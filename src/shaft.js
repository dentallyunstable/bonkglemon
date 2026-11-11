// 0.10 Blok Dunyasi: asagi dogru sonsuz maden kuyusu.
// 12 blok genis bir kuyu. Karakter bloklar arasinda yurur, bir blok yukari ziplar,
// merdivenle tirmanir, bosluga duser. Her 10 satirda yeni katman; derinlerde karanlik,
// lav, su, cakil, magara cepleri (Glemon), fosil, antik sandik ve jeotlar var.
import {
  SECRETS, GAME_W, ITEMS, ORES, ZONES, ZONE_SPAWNS, GLEMONS, CURRENCY, SHAFT, LAYERS, layerOf, oreDepthOf,
  oreWeights, mineXpMult, mineHardBonus, FOSSILS, GEODE_GEMS,
} from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx, stopMusic, playMusic } from './audio.js';
import { playAnim, wait } from './anim.js';
import { Battle } from './battle.js';
import { caveBackground } from './art.js';

export const SH = { X0: (GAME_W - SHAFT.cols * 16) / 2, TOP: 120, CELL: 16, SIDE: 6, SCALE: 0.9 };
const COLS = SHAFT.cols;
const FLUIDS = ['lav', 'su', 'lavf', 'suf'];
const isLava = (k) => k === 'lav' || k === 'lavf';
const isWater = (k) => k === 'su' || k === 'suf';
const SOFT_BLOCK = { toprak: 'toprak_blok', cimen: 'cimen_blok', cakil: 'cakil_blok' };
const ANTIK_LOOT = [['demir_cevheri', 20], ['altin_cevheri', 12], ['merdiven', 16], ['mesale', 16], ['bonk_bombasi', 8], ['sifali_ot', 14], ['ametist', 6], ['yakut', 3]];

// tekrarlanabilir rastgele sayi: ayni tohum + satir + sutun hep ayni sonucu verir
function rnd(seed, a, b, salt = 0) {
  let h = (seed ^ Math.imul(a + 7919, 374761393) ^ Math.imul(b + 104729, 668265263) ^ Math.imul(salt + 31, 2246822519)) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function wpick(list, u) {
  const tot = list.reduce((t, [, w]) => t + w, 0);
  let r = u * tot;
  for (const [k, w] of list) { r -= w; if (r < 0) return k; }
  return list[0][0];
}

export function newShaft() {
  return { seed: (Math.random() * 2 ** 31) >>> 0, d: {}, it: {}, cv: {}, pr: -1, pc: 5, low: -1, t: Date.now() };
}

// magara cepleri: her 4 satirlik bantta bir tane olabilir (3 genis, 2 yuksek)
function caveOf(seed, r, c) {
  if (r < 6) return null;
  const b = Math.floor(r / 4);
  if (rnd(seed, b, 0, 11) > 0.45) return null;
  const r0 = b * 4 + 1; const c0 = Math.floor(rnd(seed, b, 1, 12) * (COLS - 3));
  if (r < r0 || r > r0 + 1 || c < c0 || c > c0 + 2) return null;
  return { id: b, r0, c0, mon: rnd(seed, b, 2, 13) < 0.7 };
}

// kayitta yoksa blok tohumdan uretilir
export function genKind(seed, r, c) {
  if (r < 0) return null;
  if (r === 0) return 'cimen';
  if (caveOf(seed, r, c)) return null;
  // sivilar: su 8. satirdan, lav 30. satirdan sonra
  if (r >= 8) { const b = Math.floor(r / 5); if (rnd(seed, b, 3, 14) < 0.3 && r === b * 5 + 2) { const c0 = Math.floor(rnd(seed, b, 4, 15) * (COLS - 1)); if (c === c0 || c === c0 + 1) return r >= 30 && rnd(seed, b, 5, 16) < 0.6 ? 'lav' : 'su'; } }
  const u = rnd(seed, r, c, 1);
  if (u < 0.006) return 'define';
  if (r >= 8 && u < 0.014) return 'fosil';
  if (r >= 5 && u < 0.018) return 'antik';
  if (r >= 20 && u < 0.024) return 'jeot';
  if (r >= 40 && u < 0.028) return 'bonkit';
  if (r >= 3 && r < 45 && rnd(seed, r, c, 2) < 0.06) return 'cakil';
  if (r <= 3 && rnd(seed, r, c, 3) < 0.75) return 'toprak';
  // cevherler 2x2 damarlar halinde kumelenir
  const w = oreWeights(oreDepthOf(r)).map(([k, x]) => [k, ['toprak', 'kum', 'tas', 'komur'].includes(k) ? x : x * S.perk('damar_bulucu', 1.3, 1)]);
  const vein = rnd(seed, r >> 1, c >> 1, 4) < 0.4;
  const k = wpick(w, vein ? rnd(seed, r >> 1, c >> 1, 5) : rnd(seed, r, c, 6));
  return k === 'toprak' && r > 12 ? 'tas' : k;
}

export const ShaftMixin = {
  sv() { return S.save.shaft; },
  shCaveAt(r, c) { return caveOf(this.sv().seed, r, c); },
  shX(c) { return SH.X0 + c * 16 + 8; },
  shFeet(r) { return SH.TOP + (r + 1) * 16; },
  kindAt(r, c) {
    if (c < 0 || c >= COLS) return r < 0 ? 'edge' : 'wall';
    const key = `${r},${c}`;
    const d = this.sv().d;
    if (key in d) return d[key];
    return genKind(this.sv().seed, r, c);
  },
  setKind(r, c, k) { this.sv().d[`${r},${c}`] = k; },
  itemAt(r, c) { return this.sv().it[`${r},${c}`] || null; },
  solidAt(r, c) { const k = this.kindAt(r, c); return k === 'wall' || k === 'edge' || !!(k && ORES[k]); },
  passAt(r, c) { const k = this.kindAt(r, c); return k === null || FLUIDS.includes(k); },
  ladderAt(r, c) { return this.itemAt(r, c) === 'merdiven'; },
  // ayakta durabilir mi: ikisi de bos ve altinda zemin, merdiven ya da su var
  standOk(r, c) { return this.passAt(r, c) && this.passAt(r - 1, c); },
  supported(r, c) { return this.solidAt(r + 1, c) || this.ladderAt(r, c) || this.ladderAt(r + 1, c) || isWater(this.kindAt(r, c)); },
  fallFrom(r, c) { let n = r; while (!this.supported(n, c) && n < r + 60) n++; return n; },

  async enterMine() {
    UI.closePanel();
    if (!this.busy && this.home()) stopMusic();
    if (this.busy || !this.home()) return;
    this.busy = true;
    this.time.delayedCall(1200, () => { if (this.mode === 'mine') playMusic('z_maden', false); });
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    let first = false;
    if (!S.save.shaft || typeof S.save.shaft.seed !== 'number') { S.save.shaft = newShaft(); first = true; }
    if (!S.save.flags.shaftKit) {
      S.save.flags.shaftKit = 1;
      UI.giveNote(S.giveSafe('merdiven', 8)); UI.giveNote(S.giveSafe('mesale', 8));
      first = true;
    }
    this.goShaft();
    await this.fade(false);
    this.busy = false;
    if (first) UI.feed('Maden kuyusu! Bloğa dokun: kazarsın. Boşluğa dokun: oraya yürürsün. Lale sana 8 merdiven ve 8 meşale verdi; yukarı çıkmak için merdiven, karanlık için meşale.');
    else UI.feed('Kuyuya geri döndün. Kaldığın yerdesin.');
  },

  goShaft() {
    this.mode = 'mine';
    this.clearRoom();
    this.sh = { rows: new Map(), lights: [] };
    const v = this.sv();
    if (!this.standOk(v.pr, v.pc)) { v.pr = -1; v.pc = 5; }
    this.shLayerBg(true);
    // yuzeyde orman (kuyu ustundeki gokyuzu)
    const sky = this.add.image(0, SH.TOP - 178, this.todBg('bg_base')).setOrigin(0).setDepth(1);
    this.roomObjs.push(sky);
    this.shDark = this.add.renderTexture(0, 0, GAME_W, 216).setOrigin(0).setScrollFactor(0).setDepth(11);
    this.roomObjs.push(this.shDark);
    if (!this.textures.exists('lightmask')) {
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const ctx = cv.getContext('2d');
      const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
      this.textures.addCanvas('lightmask', cv);
    }
    this.shLm = this.make.image({ key: 'lightmask', add: false });
    this.bombArmed = false;
    this.shPlacePlayer();
    this.cameras.main.scrollY = this.shCamY();
    this.shRender();
    this.idle();
    this.shActions();
  },

  shLayerBg(force) {
    const v = this.sv();
    const li = Math.min(LAYERS.length - 1, Math.max(0, Math.floor(Math.max(0, v.pr) / 10)));
    if (!force && li === this.shLi) return;
    this.shLi = li;
    const key = `cave_${Math.min(9, 1 + li * 2)}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, caveBackground(Math.min(9, 1 + li * 2)));
    this.bg.setTexture(key);
  },

  shPlacePlayer() {
    const v = this.sv();
    const p = this.player;
    p.setScale(SH.SCALE).setAlpha(1).setDepth(10);
    p.x = this.shX(v.pc);
    p.y = this.shFeet(v.pr);
    this.pShadow.y = p.y + 1;
  },
  shCamY() { return Math.max(0, this.shFeet(this.sv().pr) - 140); },
  shFloat(x, y, text, cls) { UI.floatText(x, y, text, cls); },

  // gorunen satirlari ciz (kaydirildikca eklenir/silinir)
  shRender(full = false) {
    const cam = this.cameras.main;
    const top = Math.floor((cam.scrollY - SH.TOP) / 16) - 1;
    const bot = top + 16;
    for (const [r, objs] of this.sh.rows) {
      if (full || r < top || r > bot) { for (const o of objs) o.destroy(); this.sh.rows.delete(r); }
    }
    for (let r = Math.max(-1, top); r <= bot; r++) if (!this.sh.rows.has(r)) this.sh.rows.set(r, this.shRow(r));
    this.shLights();
  },
  shRedraw(r) {
    const objs = this.sh.rows.get(r);
    if (!objs) return;
    for (const o of objs) o.destroy();
    this.sh.rows.set(r, this.shRow(r));
    this.shLights();
  },

  shRow(r) {
    const objs = [];
    const lay = layerOf(Math.max(0, r));
    const y = SH.TOP + r * 16;
    const v = this.sv();
    for (let c = -SH.SIDE; c < COLS + SH.SIDE; c++) {
      const x = SH.X0 + c * 16;
      const k = this.kindAt(r, c);
      if (k === 'edge' || (r < 0 && k === null)) continue;
      if (k === 'wall') {
        const base = r === 0 ? 'cimen' : r < 10 ? 'toprak' : 'tas';
        objs.push(this.add.image(x, y, 'ores', base).setOrigin(0).setDepth(5).setTint(r === 0 ? 0xdcdcdc : this.shTint(lay, 0.8)));
        continue;
      }
      if (k === null || FLUIDS.includes(k)) {
        if (r >= 0) objs.push(this.add.image(x, y, 'ores', 'arka_tas').setOrigin(0).setDepth(4).setTint(this.shTint(lay, 0.75)));
        if (FLUIDS.includes(k)) objs.push(this.add.image(x, y, 'ores', k.slice(0, 3) === 'lav' ? 'lav' : 'su').setOrigin(0).setDepth(7).setAlpha(k.length > 3 ? 0.78 : 0.92));
      } else {
        const img = this.add.image(x, y, 'ores', k).setOrigin(0).setDepth(5);
        if (k === 'tas' || k === 'toprak') img.setTint(this.shTint(lay, 1));
        if (r >= SHAFT.deepRow) img.setTint(0xd8b8d8);
        objs.push(img);
      }
      const it = v.it[`${r},${c}`];
      if (it) objs.push(this.add.image(x, y, 'ores', it).setOrigin(0).setDepth(6));
      // magara: icinde bekleyen Glemon gorunur
      const cv = caveOf(v.seed, r, c);
      if (cv && cv.mon && !v.cv[cv.id] && r === cv.r0 + 1 && c === cv.c0 + 1 && this.kindAt(r, c) === null) {
        const g = this.caveGlemon(cv, r);
        if (g && this.textures.exists(`gs_${g}_0`)) {
          const meta = this.gmeta[g].stages[0];
          const s = this.add.sprite(x + 8, y + 16, `gs_${g}_0`, 0).setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(8).setScale(0.75);
          if (this.anims.exists(`g_${g}_0_durma`)) s.play(`g_${g}_0_durma`);
          objs.push(s);
        }
      }
    }
    return objs;
  },
  shTint(lay, mult) {
    const t = lay.tint;
    const ch = (sh) => Math.round(((t >> sh) & 255) * mult);
    return (ch(16) << 16) | (ch(8) << 8) | ch(0);
  },
  caveGlemon(cv, r) {
    const z = layerOf(r).zone;
    const tab = ZONE_SPAWNS[z];
    // 0.12 gizli tur: 50. siranin altinda nadiren Kadim Kostebek
    if (r >= SECRETS.deep[2] && rnd(this.sv().seed, cv.id, 31, 7) < SECRETS.deep[1]) return SECRETS.deep[0];
    return tab ? wpick(tab, rnd(this.sv().seed, cv.id, 9, 17)) : null;
  },

  // karanlik: 12. satirdan sonra koyulasir; karakter, fener ve mesaleler aydinlatir
  shLights() {
    const rt = this.shDark;
    if (!rt) return;
    const v = this.sv();
    const cam = this.cameras.main;
    const a = Math.max(0, Math.min(0.86, (v.pr - 10) / 22));
    rt.clear();
    for (const g of this.sh.lights) g.destroy();
    this.sh.lights = [];
    if (a <= 0) return;
    rt.fill(0x07050c, a);
    const lm = this.shLm;
    const hole = (x, y, s) => { lm.setScale(s); rt.erase(lm, x, y - cam.scrollY); };
    const fener = S.countItem('fener') > 0 || S.darkproof();
    hole(this.player.x, this.player.y - 14, fener ? 2.6 : 1.5);
    const top = Math.floor((cam.scrollY - SH.TOP) / 16) - 2;
    for (const [key, it] of Object.entries(v.it)) {
      if (it !== 'mesale') continue;
      const [r, c] = key.split(',').map(Number);
      if (r < top || r > top + 18) continue;
      hole(this.shX(c), SH.TOP + r * 16 + 6, 2.8);
      const gl = this.add.image(this.shX(c), SH.TOP + r * 16 + 5, 'glow').setDepth(12).setScale(0.9).setAlpha(0.45).setBlendMode(Phaser.BlendModes.ADD);
      this.sh.lights.push(gl);
      this.roomObjs.push(gl);
    }
    // lav kendi kendine parlar
    for (const [r] of this.sh.rows) {
      for (let c = 0; c < COLS; c++) if (isLava(this.kindAt(r, c))) hole(this.shX(c), SH.TOP + r * 16 + 8, 1.2);
    }
  },

  shScroll() {
    const cam = this.cameras.main;
    const ty = this.shCamY();
    if (Math.abs(cam.scrollY - ty) < 1) return Promise.resolve();
    return new Promise((res) => {
      this.tweens.add({
        targets: cam, scrollY: ty, duration: 260, ease: 'Sine.easeOut',
        onUpdate: () => this.shLights(),
        onComplete: () => { this.shRender(); res(); },
      });
      this.shRender();
    });
  },

  shActions() {
    if (this.mode !== 'mine') return;
    const v = this.sv();
    const lad = S.countItem('merdiven'); const tor = S.countItem('mesale'); const bombs = S.countItem('bonk_bombasi');
    const lay = layerOf(Math.max(0, v.pr));
    UI.setLocation(v.pr < 0 ? 'Maden Kuyusu · Yüzey' : `Maden · ${lay.name} · ${v.pr + 1}. sıra`);
    UI.setActions([
      { label: `Tırman ↑ (${lad})`, cls: 'primary', disabled: v.pr < 0, onClick: () => this.shClimb() },
      { label: `Merdiven (${lad})`, disabled: lad < 1 || v.pr < 0, onClick: () => this.shPlace('merdiven') },
      { label: `Meşale (${tor})`, disabled: tor < 1 || v.pr < 0, onClick: () => this.shPlace('mesale') },
      bombs > 0 ? { label: this.bombArmed ? 'Bomba: bloğa dokun' : `Bomba (${bombs})`, cls: 'purple', onClick: () => { this.bombArmed = !this.bombArmed; this.shActions(); } } : null,
      { label: 'Eve dön', onClick: () => this.leaveMine() },
    ]);
  },

  async leaveMine() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    sfx('stairs');
    await this.fade(true);
    this.shExit();
    this.goBase('mine');
    await this.fade(false);
    this.busy = false;
  },
  shClearRows() {
    if (!this.sh) return;
    for (const objs of this.sh.rows.values()) for (const o of objs) o.destroy();
    this.sh.rows.clear();
    for (const g of this.sh.lights) g.destroy();
    this.sh.lights = [];
  },
  shExit() {
    this.shClearRows();
    this.cameras.main.scrollY = 0;
    this.player.setScale(1);
    this.shDark = null;
    this.sh = null;
  },

  // ---------------------------------------------------------- dokunma
  shTap(ptr) {
    if (this.busy || UI.panelOpen() || this.battle) return;
    const r = Math.floor((ptr.worldY - SH.TOP) / 16);
    const c = Math.floor((ptr.worldX - SH.X0) / 16);
    if (c < 0 || c >= COLS) return;
    const v = this.sv();
    if (this.solidAt(r, c)) {
      if (this.bombArmed) { this.shBomb(r, c); return; }
      if (this.inReach(v.pr, v.pc, r, c)) { this.shMine(r, c); return; }
      // uzaktaki bloga once yuru
      const path = this.shPath((s) => this.inReach(s.r, s.c, r, c));
      if (path) { this.shWalk(path).then((ok) => { if (ok && this.mode === 'mine' && !this.busy) this.shMine(r, c); }); return; }
      this.shFloat(this.shX(c), SH.TOP + r * 16, 'Çok uzak', 'note');
      return;
    }
    if (r < -2) return;
    const path = this.shPath((s) => s.c === c && (s.r === r || s.r - 1 === r));
    if (path) { this.shWalk(path); return; }
    this.shFloat(this.shX(c), SH.TOP + r * 16, 'Oraya yol yok', 'note');
    this.sulk();
  },
  inReach(pr, pc, r, c) { return Math.abs(c - pc) <= 1 && r >= pr - 2 && r <= pr + 1 && !(c !== pc && r === pr + 1 && false); },

  // kisa yol (BFS): yuru, bir blok zipla, merdivenle in/cik, dus
  shPath(goal) {
    const v = this.sv();
    const start = { r: v.pr, c: v.pc };
    if (goal(start)) return [];
    const key = (s) => `${s.r},${s.c}`;
    const prev = new Map([[key(start), null]]);
    const q = [start];
    const lavaOk = S.fireproof() || Date.now() < (S.save.fireResUntil || 0);
    const enter = (r, c) => this.standOk(r, c) && (lavaOk || (!isLava(this.kindAt(r, c)) && !isLava(this.kindAt(r - 1, c))));
    while (q.length && prev.size < 400) {
      const s = q.shift();
      const nexts = [];
      for (const dc of [-1, 1]) {
        const c = s.c + dc;
        if (enter(s.r, c)) nexts.push({ r: this.fallFrom(s.r, c), c, how: 'walk', fall: true });
        else if (this.solidAt(s.r, c) && enter(s.r - 1, c) && this.passAt(s.r - 2, s.c)) nexts.push({ r: s.r - 1, c, how: 'jump' });
      }
      if ((this.ladderAt(s.r, s.c) || this.ladderAt(s.r - 1, s.c)) && enter(s.r - 1, s.c)) nexts.push({ r: s.r - 1, c: s.c, how: 'up' });
      if (this.ladderAt(s.r + 1, s.c) && enter(s.r + 1, s.c)) nexts.push({ r: s.r + 1, c: s.c, how: 'down' });
      for (const n of nexts) {
        if (Math.abs(n.r - start.r) > 14 || prev.has(key(n))) continue;
        prev.set(key(n), s);
        n.from = s;
        if (goal(n)) {
          const path = [];
          for (let x = n; x && x !== start; x = x.from) path.unshift(x);
          return path;
        }
        q.push(n);
      }
    }
    return null;
  },

  async shWalk(path) {
    this.busy = true;
    const v = this.sv();
    const p = this.player;
    let ok = true;
    for (const st of path) {
      const fromR = v.pr;
      if (st.c !== v.pc) p.setFlipX(st.c < v.pc);
      if (st.how === 'jump') {
        playAnim(p, 'c_mcjump', 1.6);
        await this.shTween({ x: this.shX(st.c), y: this.shFeet(st.r) }, 260, 'Back.easeOut');
      } else if (st.how === 'up' || st.how === 'down') {
        p.play('c_walkin', true);
        await this.shTween({ y: this.shFeet(st.r) }, 220);
      } else {
        p.play('c_walk', true);
        const landR = st.r;
        await this.shTween({ x: this.shX(st.c) }, 200);
        v.pc = st.c;
        if (landR !== fromR) await this.shTween({ y: this.shFeet(landR) }, 90 + 45 * (landR - fromR), 'Quad.easeIn');
      }
      v.pr = st.r; v.pc = st.c;
      if (st.r - fromR >= 5) await this.shFallHurt(st.r - fromR);
      await this.shScroll();
      this.shLayerBg();
      if (this.mode !== 'mine') { ok = false; break; }
      if (await this.shHazards()) { ok = false; break; }
      if (await this.shCaveCheck()) { ok = false; break; }
    }
    S.changed();
    if (this.mode === 'mine') { this.idle(); this.busy = false; this.shActions(); }
    return ok;
  },
  shTween(props, ms, ease = 'Linear') {
    return new Promise((res) => this.tweens.add({ targets: this.player, ...props, duration: ms, ease, onUpdate: () => this.shLights(), onComplete: res }));
  },

  async shFallHurt(rows) {
    const dmg = Math.round(S.maxHp() * 0.06 * (rows - 4));
    this.cameras.main.shake(180, 0.01);
    sfx('hit');
    S.hp = Math.max(0, S.hp - dmg);
    this.shFloat(this.player.x, this.player.y - 30, `-${dmg} düştün`, 'bad');
    await playAnim(this.player, 'c_hurt', 1.2);
    this.refreshHud();
  },

  // ---------------------------------------------------------- kazma
  shovel() { return Math.max(1, ...S.save.bag.filter(Boolean).map((s) => ITEMS[s.id].shovel || 0)); },

  async shMine(r, c) {
    const k = this.kindAt(r, c);
    const ore = ORES[k];
    if (!ore) return;
    const x = this.shX(c); const y = SH.TOP + r * 16;
    if (r >= SHAFT.deepRow && !S.perk('derin_kazi')) { this.shFloat(x, y, 'Derin Kazı yeteneği gerekli', 'note'); UI.feed(`${SHAFT.deepRow + 1}. sıra ve aşağısı çekirdek kadar sert. Yetenek ağacındaki Derin Kazı gerekli.`); this.sulk(); return; }
    if (!S.pick()) { UI.feed('Kazma kuşanmadan kazamazsın. (Çanta → Kazma)'); this.sulk(); return; }
    if (S.level('madencilik') < ore.req) { this.shFloat(x, y, `Madencilik ${ore.req} gerekli`, 'note'); sfx('weak'); this.sulk(); return; }
    const silk = S.save.ench === 'ipek' && SOFT_BLOCK[k];
    const drop = silk || ore.drop;
    if (drop && !S.fits(drop)) { this.shFloat(x, y, 'Çanta dolu!', 'note'); this.sulk(); return; }
    this.busy = true;
    const p = this.player; const v = this.sv();
    if (c !== v.pc) p.setFlipX(c < v.pc);
    const depth = oreDepthOf(r);
    let need = Math.max(1, Math.ceil((ore.hard + mineHardBonus(depth)) / S.pick()) - (S.has('hizli_kazma') ? 1 : 0) - (S.save.ench === 'verim' ? 1 : 0));
    if (ore.soft) need = Math.max(1, Math.ceil(need / this.shovel()));
    const swingMs = S.save.ench === 'verim' ? 170 : 230;
    let crack = null; let hits = 0;
    while (hits < need) {
      const swing = playAnim(p, 'c_mine', S.save.ench === 'verim' ? 1.7 : 1.3);
      await wait(this, swingMs);
      hits++;
      sfx('mine');
      this.chips(x + (c < v.pc ? 4 : -4), y + 8, k, 3);
      if (hits < need) {
        if (!crack) { crack = this.add.image(x - 8, y, 'ores', 'crack1').setOrigin(0).setDepth(6); this.roomObjs.push(crack); }
        crack.setFrame(`crack${Math.min(3, Math.ceil((hits / need) * 3))}`);
      }
      await swing;
    }
    if (crack) crack.destroy();
    await this.shBreak(r, c, false);
    await this.shSettle([[r, c]]);
    this.idle();
    if (this.mode === 'mine') {
      if (await this.shFallCheck()) return;
      this.busy = false;
      this.shActions();
    }
  },

  // ayaginin alti bosaldiysa duser; sonra lav/can ve magara kontrolu. true: sahne degisti
  async shFallCheck() {
    const v = this.sv();
    const land = this.fallFrom(v.pr, v.pc);
    if (land !== v.pr) {
      this.player.play('c_hurt', true);
      await this.shTween({ y: this.shFeet(land) }, 90 + 45 * (land - v.pr), 'Quad.easeIn');
      const rows = land - v.pr;
      v.pr = land;
      if (rows >= 5) await this.shFallHurt(rows);
      this.idle();
      await this.shScroll();
      this.shLayerBg();
      S.changed();
    }
    if (await this.shHazards()) return true;
    if (await this.shCaveCheck()) return true;
    return false;
  },

  async shBreak(r, c, silent) {
    const k = this.kindAt(r, c);
    const ore = ORES[k];
    const x = this.shX(c); const y = SH.TOP + r * 16;
    this.setKind(r, c, null);
    const v = this.sv();
    v.low = Math.max(v.low ?? -1, r);
    this.shRedraw(r);
    if (!silent) sfx('break');
    this.chips(x, y + 8, k, 7);
    const depth = oreDepthOf(r);
    S.save.mine.depth = depth;
    S.save.stats.deepestMine = Math.max(S.save.stats.deepestMine || 1, depth);
    S.save.stats.mined++;
    const silk = S.save.ench === 'ipek' && SOFT_BLOCK[k];
    const drop = silk || ore.drop;
    if (drop) {
      const n = !silk && S.save.ench === 'servet' && !ore.soft && Math.random() < 0.3 ? 2 : 1;
      const left = S.addItem(drop, n);
      if (left < n) this.shFloat(x, y - 4, `+${n - left} ${ITEMS[drop].name}`, n > 1 ? 'gold' : 'info');
      if (left > 0) UI.feed(`Çanta dolu! ${ITEMS[drop].name} sığmadı.`);
    }
    if (k === 'toprak' && Math.random() < 0.35 && S.addItem('solucan', 1) === 0) this.shFloat(x, y - 12, '+1 Solucan', 'info');
    if (k === 'define') {
      const gold = 20 + Math.floor(Math.random() * 30 * depth);
      S.addGold(gold);
      sfx('rare');
      S.logDrop(null, 'Define sandığı', { note: `buldun! +${gold} ${CURRENCY}` });
      UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Define sandığı! +${gold} ${CURRENCY}`, 'gold');
    }
    if (ore.find === 'fosil') {
      const id = wpick(Object.entries(FOSSILS).map(([key, f]) => [key, f.w]), Math.random());
      const isNew = !S.save.fossils[id];
      S.save.fossils[id] = (S.save.fossils[id] || 0) + 1;
      this.giveDrop(id, 1, 'Fosil bloğundan', true);
      UI.feed(`Fosil buldun: <b>${ITEMS[id].name}</b>!${isNew ? ' Albümün Fosiller sayfasına eklendi.' : ''}`, 'gold');
      if (isNew) sfx('rare');
    }
    if (ore.find === 'antik') {
      const gold = 30 + Math.floor(Math.random() * 40) + r * 3;
      S.addGold(gold);
      sfx('rare');
      UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Antik sandık açıldı! +${gold} ${CURRENCY}`, 'gold');
      for (let i = 0; i < 2; i++) { const id = wpick(ANTIK_LOOT, Math.random()); this.giveDrop(id, id === 'merdiven' || id === 'mesale' ? 4 : 1, 'Antik sandıktan'); }
    }
    if (ore.find === 'jeot') {
      sfx('rare');
      const n = 1 + (Math.random() < 0.4 ? 1 : 0);
      for (let i = 0; i < n; i++) this.giveDrop(wpick(GEODE_GEMS, Math.random()), 1, 'Jeottan');
      UI.feed('Jeot kırıldı: içi mücevher dolu!', 'gold');
    }
    const xp = Math.round(ore.xp * mineXpMult(Math.min(depth, 11)));
    this.shFloat(x, y - 14, `+${xp} XP`, 'good');
    const ups = S.addXp({ madencilik: xp });
    S.changed();
    for (const u of ups) await this.levelUp(u);
  },

  // ---------------------------------------------------------- tehlikeler
  // bir blok bosalinca: ustteki cakil duser, sivilar akar, lav suya degince bazalt olur
  async shSettle(cells) {
    const v = this.sv();
    const q = cells.slice();
    let guard = 0;
    while (q.length && guard++ < 80) {
      const [r, c] = q.shift();
      if (this.kindAt(r, c) !== null) continue;
      // cakil
      if (this.kindAt(r - 1, c) === 'cakil') {
        let land = r;
        while (this.kindAt(land + 1, c) === null && land < r + 30) land++;
        const hitsPlayer = c === v.pc && v.pr >= r - 1 && v.pr - 1 <= land;
        this.setKind(r - 1, c, null);
        const spr = this.add.image(SH.X0 + c * 16, SH.TOP + (r - 1) * 16, 'ores', 'cakil').setOrigin(0).setDepth(8);
        this.shRedraw(r - 1);
        if (hitsPlayer) {
          await new Promise((res) => this.tweens.add({ targets: spr, y: this.player.y - 40, duration: 160, ease: 'Quad.easeIn', onComplete: res }));
          spr.destroy();
          this.chips(this.player.x, this.player.y - 30, 'cakil', 8);
          sfx('hit');
          const dmg = Math.round(S.maxHp() * 0.12);
          S.hp = Math.max(0, S.hp - dmg);
          this.shFloat(this.player.x, this.player.y - 34, `Çakıl düştü! -${dmg}`, 'bad');
          playAnim(this.player, 'c_hurt', 1.2);
          this.refreshHud();
        } else {
          await new Promise((res) => this.tweens.add({ targets: spr, y: SH.TOP + land * 16, duration: 90 + 40 * (land - r + 1), ease: 'Quad.easeIn', onComplete: res }));
          spr.destroy();
          this.setKind(land, c, 'cakil');
          this.shRedraw(land);
          sfx('mine');
        }
        q.push([r - 1, c]);
        continue;
      }
      // sivilar: kaynak (lav/su) yana ve asagi, akan (lavf/suf) sadece asagi
      const above = this.kindAt(r - 1, c);
      const sides = [this.kindAt(r, c - 1), this.kindAt(r, c + 1)];
      let flow = null;
      if (FLUIDS.includes(above)) flow = above.slice(0, 3) === 'lav' ? 'lavf' : 'suf';
      else if (sides.includes('lav')) flow = 'lavf';
      else if (sides.includes('su')) flow = 'suf';
      if (flow) {
        await wait(this, 120);
        this.setKind(r, c, flow);
        this.shRedraw(r);
        sfx(flow === 'lavf' ? 'fire' : 'splash');
        q.push([r + 1, c], [r, c - 1], [r, c + 1]);
      }
    }
    // lav + su = bazalt
    const rows = [...this.sh.rows.keys()];
    for (const r of rows) {
      for (let c = 0; c < COLS; c++) {
        if (!isLava(this.kindAt(r, c))) continue;
        if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dr, dc]) => isWater(this.kindAt(r + dr, c + dc)))) {
          this.setKind(r, c, 'bazalt');
          this.shRedraw(r);
          this.chips(this.shX(c), SH.TOP + r * 16 + 8, 'tas', 5);
          sfx('splash');
        }
      }
    }
  },

  // lav ya da can bitti mi? true donerse madenden cikildi
  async shHazards() {
    const v = this.sv();
    const inLava = isLava(this.kindAt(v.pr, v.pc)) || isLava(this.kindAt(v.pr - 1, v.pc));
    if (inLava) {
      if (S.fireproof() || Date.now() < (S.save.fireResUntil || 0)) {
        if (!this.toldLavaOk) { this.toldLavaOk = true; UI.feed('Lavın içindesin ama ateş direncin seni koruyor.'); }
      } else if (S.countItem('ates_iksiri') > 0) {
        S.removeItem('ates_iksiri', 1);
        S.save.fireResUntil = Date.now() + 30 * 60 * 1000;
        UI.feed('Lav! Hemen Ateş Direnci İksiri içtin: 30 dakika yanmazsın.');
        await playAnim(this.player, 'c_drinkpotion', 2.4);
      } else {
        const dmg = Math.round(S.maxHp() * 0.3);
        S.hp = Math.max(0, S.hp - dmg);
        sfx('fire');
        this.shFloat(this.player.x, this.player.y - 34, `Lav! -${dmg}`, 'bad');
        await playAnim(this.player, 'c_onfire', 1.4);
        UI.feed('Lava bastın! Ateş Direnci İksiri ya da ateşe dayanıklı zırh taşı.');
      }
      this.refreshHud();
    }
    if (S.hp <= 0) { await this.shFaint(); return true; }
    return false;
  },

  async shFaint() {
    this.busy = true;
    S.save.stats.deaths++;
    const v = this.sv();
    v.pr = -1; v.pc = 5;
    S.hp = Math.max(1, Math.round(S.maxHp() * 0.3));
    S.changed();
    await playAnim(this.player, 'c_death', 1);
    await this.fade(true);
    this.shExit();
    this.goBase('death');
    await this.fade(false);
    UI.feed('Madende bayıldın. Lale seni yüzeye çıkarıp kampa getirdi; çantan sende. Bir dahaki sefere canına dikkat et!');
    await playAnim(this.player, 'c_cry', 1);
    this.idle();
    this.busy = false;
  },

  // ---------------------------------------------------------- magara savasi
  async shCaveCheck() {
    const v = this.sv();
    for (const r of [v.pr, v.pr - 1]) {
      const cv = caveOf(v.seed, r, v.pc);
      if (!cv || !cv.mon || v.cv[cv.id] || this.kindAt(r, v.pc) !== null) continue;
      if (this.shFled === cv.id) return false;
      await this.shCaveFight(cv, r);
      return true;
    }
    this.shFled = null;
    return false;
  },

  async shCaveFight(cv, r) {
    const v = this.sv();
    const lay = layerOf(r);
    const zone = ZONES.find((z) => z.key === lay.zone) || ZONES[0];
    const floor = zone.floors[0] + Math.min(9, r % 10);
    const key = this.caveGlemon(cv, r);
    sfx('warn');
    UI.banner('Mağarada bir Glemon!', GLEMONS[key] ? GLEMONS[key].name : '', 1600, 'gold');
    await wait(this, 800);
    const saved = this.floor; const savedZz = this.zz;
    this.floor = floor; this.zz = zone;
    const specs = this.enemySpecs(Math.random() < 0.35 ? 2 : 1);
    specs[0].key = key;
    if (GLEMONS[key].secret) specs[0].stage = 0;
    const cam = this.cameras.main;
    this.shClearRows();
    cam.scrollY = 0;
    this.shDark.setVisible(false);
    this.battle = new Battle(this, specs, { floor, dark: false, cold: false, burn: false });
    await this.enterBattleView();
    const res = await this.battle.start();
    this.battle = null;
    if (this.inBattleView) await this.exitBattleView(res !== 'lose');
    this.floor = saved; this.zz = savedZz;
    if (res === 'lose') { S.hp = 0; await this.shFaint(); return; }
    if (res === 'win') { v.cv[cv.id] = 1; UI.feed('Mağara temizlendi!'); }
    else this.shFled = cv.id;
    this.player.setScale(0.9);
    this.shPlacePlayer();
    cam.scrollY = this.shCamY();
    this.shDark.setVisible(true);
    this.shRender(true);
    this.idle();
    this.busy = false;
    this.shActions();
  },

  // ---------------------------------------------------------- merdiven, mesale, tirmanma
  shPlace(what) {
    if (this.busy) return;
    const v = this.sv();
    let r = v.pr;
    if (what === 'mesale' && this.itemAt(r, v.pc)) r = v.pr - 1;
    if (this.itemAt(r, v.pc) || FLUIDS.includes(this.kindAt(r, v.pc))) { UI.feed(what === 'mesale' ? 'Burada meşale için yer yok.' : 'Burada zaten bir şey var.'); this.sulk(); return; }
    if (S.removeItem(what, 1) < 1) return;
    v.it[`${r},${v.pc}`] = what;
    sfx('place');
    playAnim(this.player, 'c_placeblock', 1.6).then(() => { if (!this.busy) this.idle(); });
    this.shRedraw(r);
    S.changed();
    this.shActions();
  },

  async shClimb() {
    if (this.busy) return;
    const v = this.sv();
    if (!this.passAt(v.pr - 2, v.pc)) { UI.feed('Başının üstü kapalı. Önce yukarıdaki bloğu kaz.'); this.sulk(); return; }
    this.busy = true;
    const p = this.player;
    let steps = 0;
    while (v.pr >= 0 && this.passAt(v.pr - 2, v.pc) && this.mode === 'mine') {
      if (!this.ladderAt(v.pr, v.pc)) {
        if (S.removeItem('merdiven', 1) < 1) { UI.feed('Merdivenin bitti! Üretim Masası: 3 Tahta Kalas → 4 Merdiven.'); break; }
        v.it[`${v.pr},${v.pc}`] = 'merdiven';
        sfx('place');
        this.shRedraw(v.pr);
        await wait(this, 90);
      }
      p.play('c_walkin', true);
      await this.shTween({ y: this.shFeet(v.pr - 1) }, 200);
      v.pr--;
      steps++;
      await this.shScroll();
      this.shLayerBg();
      if (await this.shCaveCheck()) return;
      // yanda yurunecek yer acildiysa (yuzey ya da tunel) ve ustu kapaliysa dur
      if (v.pr < 0) break;
    }
    S.changed();
    this.idle();
    this.busy = false;
    this.shActions();
    if (!steps) this.sulk();
  },

  // ---------------------------------------------------------- Bonk Bombasi (3x3)
  async shBomb(r, c) {
    this.bombArmed = false;
    const v = this.sv();
    if (Math.abs(r - v.pr) > 4 || Math.abs(c - v.pc) > 4) { UI.feed('Bomba için biraz daha yaklaş.'); this.shActions(); return; }
    if (S.removeItem('bonk_bombasi', 1) < 1) { this.shActions(); return; }
    this.busy = true;
    await playAnim(this.player, 'c_punch', 1.4);
    const boom = this.add.sprite(this.shX(c), SH.TOP + r * 16 + 8, 'boom').setDepth(13).setScale(1.3);
    boom.play('boom');
    boom.once('animationcomplete', () => boom.destroy());
    sfx('boom');
    this.cameras.main.shake(300, 0.016);
    await wait(this, 150);
    let skipped = 0;
    const broken = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const rr = r + dr; const cc = c + dc;
        const k = this.kindAt(rr, cc);
        if (!k || !ORES[k] || cc < 0 || cc >= COLS || rr < 0) continue;
        if (S.level('madencilik') < ORES[k].req || (rr >= SHAFT.deepRow && !S.perk('derin_kazi'))) { skipped++; continue; }
        await this.shBreak(rr, cc, true);
        broken.push([rr, cc]);
      }
    }
    if (skipped) UI.feed('Bazı bloklar için Madencilik seviyen yetmedi, bomba onları kıramadı.');
    await this.shSettle(broken);
    this.idle();
    if (await this.shFallCheck()) return;
    this.busy = false;
    this.shActions();
  },
};

