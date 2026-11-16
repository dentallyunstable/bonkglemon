// K4 (1.0.21): ev ve insa (arsa, istasyonlar, tarla, ahir) world.js'ten ayrildi. Davranis ayni.
import { glemTex, glemScale, attachGlemon, glemHappy } from './glemon2.js';
import { GAME_W, GROUND_Y, ITEMS, BUILD, BUILD_ORDER, plotSize, MAX_TARLA, SEEDS, RANCH, ranchDropOf, BASE_REWARDS, HIVE, NAMES } from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';
import { block } from './blocks.js';
import { Pix, INK } from './pix.js';
import { TOD_SKIP, todNow, nextMorning } from './art.js';
import { openDepo, openStation, openVillageMap, openTrophies, openNest } from './panels.js';
import { ranchReady, collectRanch, ranchLeft, heartsText, petDisplayName } from './pets.js';
import { PUL, addPul } from './goals.js';
import { now as gNow } from './clock.js';
import { YARD_W, SPRINT_DIST } from './wconst.js';

export class PlotPart {
  // ------------------------------------------------------------ arsa ve insa (0.3)
  // Arsa: usteki ayri ekran. Blok izgarasi zeminden yukari (sira 0 = zemin ustu).
  // 0.10.5: arsa 64 blok genis ve kayar (kamera karakteri izler). Sutun numaralari eskisiyle
  // ayni, eski arsalar sol bastan aynen durur.
  plotGeom() {
    const { cols, rows: r0 } = plotSize(S.level('insa'));
    const rows = r0 + (S.has('mimar') ? 1 : 0);
    const x0 = YARD_W; // 1.0.5: solda patika + calisma alani, sonra insa alani
    return { cols, rows, x0, w: x0 + cols * 16 + 32 };
  }

  home() { return this.mode === 'plot'; }

  worldMaxX() { return this.mode === 'plot' ? this.plotGeom().w - 12 : GAME_W - 12; }

  cellAt(wx, wy) {
    const g = this.plotGeom();
    const c = Math.floor((wx - g.x0) / 16);
    const r = Math.floor((GROUND_Y - wy) / 16);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return null;
    return { c, r, key: `${c},${r}` };
  }

  // 1.0.5: arsa artik evin kendisi; haritadan "Arsa" eve dondurur
  async enterPlot() {
    UI.closePanel();
    if (this.busy || this.mode !== 'plot') return;
    const g = this.plotGeom();
    this.walkThen(g.x0 + 40, null);
  }

  goPlot() {
    this.mode = 'plot';
    this.clearRoom();
    this.tod = todNow();
    this.bg.setTexture(this.todBg('bg_plot'));
    const g = this.plotGeom();
    const G = GROUND_Y;
    // arsa boyunca zemin (arka plan sabit kalir, cimen zemin arsayla kayar)
    for (let x = -16; x < g.w + 16; x += 16) this.roomObjs.push(this.add.image(x, G, 'blocks', 'cimen').setOrigin(0, 0).setDepth(2));
    for (const x of [g.x0 - 8, g.x0 + g.cols * 16 + 8]) this.roomObjs.push(this.add.image(x, G, 'blocks', 'direk').setOrigin(0.5, 1).setDepth(3));
    this.plotImg = null;
    this.plotBackImg = null;
    this.gardenSprites = {};
    this.buildLayer = this.buildLayer || 'on';
    this.starterHut();
    this.buildYard();
    this.drawPlot();
    this.refreshGarden();
    this.spawnRanch();
    this.applyTod();
    this.player.setFlipX(false);
    this.resetPlayer();
    this.idle();
    this.plotActions();
    this.refreshHud();
  }

  // ------------------------------------------------------------ 0.12 Yasayan Ahir
  // Yaninda olmayan evcil Glemonlar arsada dolasir; malzemesi hazir olanin ustunde "!" var.
  spawnRanch() {
    this.ranch = [];
    const team = new Set(S.teamPets().map((p) => p.id));
    const g = this.plotGeom();
    const list = S.save.pets.filter((p) => !team.has(p.id)).sort((a, b) => (ranchReady(b) ? 1 : 0) - (ranchReady(a) ? 1 : 0)).slice(0, RANCH.wander);
    for (const p of list) {
      const meta = this.gmeta[p.key].stages[p.stage];
      const k = (a) => `g_${p.key}_${p.stage}_${a}${p.shiny ? '_p' : ''}`;
      const x = g.x0 + 8 + Math.random() * (g.cols * 16 - 16);
      const [tex, fr0] = glemTex(this.gmeta, p.key, p.stage, p.shiny);
      const sp = this.add.sprite(x, GROUND_Y, tex, fr0)
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(7).setScale(glemScale(this.gmeta, p.key, p.stage === 2 ? 0.8 : 1)).setFlipX(Math.random() < 0.5);
      sp.play(k('durma'));
      const sh = this.add.image(x, GROUND_Y + 1, 'shadow').setDepth(6.9).setScale((meta.bodyW * sp.scale) / 18, 1);
      const mark = this.add.text(x, GROUND_Y - meta.ay * sp.scale - 4, '!', { fontFamily: 'BonkSym, "Jersey 15"', fontStyle: 'normal', fontSize: '11px', color: '#ffd04d', stroke: '#16121a', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(7.5);
      const r = { p, sp, sh, mark, k, meta, tx: x, wait: 1000 + Math.random() * 4000, nap: (this.ranch.length % 2) === 0 };
      // v2: gece ahirdakilerin yarisi uyur (uyku), dokununca ve beslenince mutlu
      attachGlemon(sp, { key: p.key, stage: p.stage, shiny: !!p.shiny, k, state: () => ({ sleep: r.nap && this.ranchNight() }) });
      sp.ranchPet = true;
      sp.setInteractive({ useHandCursor: true });
      sp.on('pointerdown', () => this.ranchTap(r));
      this.attachAcc(sp, p, meta);
      this.roomObjs.push(sp, sh, mark);
      this.ranch.push(r);
    }
  }

  ranchNight() { return this.tod === 'gece'; }

  updateRanch(dt) {
    if (this.mode !== 'plot' || !this.ranch) return;
    const g = this.plotGeom();
    const now = gNow();
    for (const r of this.ranch) {
      if (!r.sp.active) continue;
      if (r.sp._glem && r.nap && this.ranchNight()) { r.tx = r.sp.x; r.sh.x = r.sp.x; continue; }
      const dx = r.tx - r.sp.x;
      if (Math.abs(dx) > 1) {
        r.sp.x += Math.sign(dx) * Math.min(Math.abs(dx), 22 * dt / 1000);
        r.sp.setFlipX(dx > 0);
        if (r.sp.anims.currentAnim.key !== r.k('yurume')) r.sp.play(r.k('yurume'));
      } else {
        const ck = r.sp.anims.currentAnim.key;
        if (ck !== r.k('durma') && ck !== r.k('huy') && ck !== r.k('mutlu') && ck !== r.k('uyku')) r.sp.play(r.k('durma'));
        r.wait -= dt;
        if (r.wait <= 0) {
          r.wait = 2000 + Math.random() * 5000;
          r.tx = Phaser.Math.Clamp(r.sp.x + (Math.random() - 0.5) * 140, g.x0 + 8, g.x0 + g.cols * 16 - 8);
        }
      }
      r.sh.x = r.sp.x;
      r.mark.x = r.sp.x;
      r.mark.setVisible(ranchReady(r.p, now));
    }
  }

  ranchTap(r) {
    if (this.busy || this.building || UI.panelOpen()) return;
    const top = GROUND_Y - r.meta.ay * r.sp.scale;
    const got = collectRanch(r.p);
    if (r.sp._glem && !(r.nap && this.ranchNight())) { r.tx = r.sp.x; glemHappy(r.sp); }
    if (got) {
      this.giveDrop(got.id, got.n, `${petDisplayName(r.p)} bıraktı:`, true);
      r.mark.setVisible(false);
      S.changed();
    } else {
      const m = Math.ceil(ranchLeft(r.p) / 60000);
      UI.floatText(r.sp.x, top - 14, `${petDisplayName(r.p)} · ${heartsText(r.p)}`, 'info');
      UI.feed(`${petDisplayName(r.p)} mutlu görünüyor. Bir sonraki ${ITEMS[ranchDropOf(r.p.key)].name}: ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`}.`);
    }
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(r.sp.x + (Math.random() - 0.5) * 14, top, '♥', { fontFamily: 'BonkSym, "Jersey 15"', fontSize: '9px', color: '#ff7a9a' }).setDepth(8);
      this.tweens.add({ targets: h, y: h.y - 16, alpha: 0, duration: 800, delay: i * 120, onComplete: () => h.destroy() });
    }
    r.sp.play(r.k('saldiri'));
    r.wait = 1500;
  }

  plotActions() {
    const g = this.plotGeom();
    UI.setLocation(`${NAMES.ev} · ${NAMES.evPuani} ${S.baseScore()}`);
    UI.setActions([
      { label: 'İnşa et', cls: 'primary', onClick: () => this.startBuild() },
      { label: NAMES.koyHaritasi, cls: 'blue', onClick: () => openVillageMap(this) },
    ]);
  }

  plotFrame(cell) {
    const def = BUILD[cell.id];
    if (!def) return null;
    if (cell.top) return cell.open ? 'kapi_acik_ust' : def.top;
    if (cell.part) return def.wide;
    if (cell.open) return 'kapi_acik_alt';
    return cell.shape || def.tex;
  }

  // Arsadaki bloklar iki resimde cizilir: arka duvar (koyu, cizgisiz) ve on (dis cizgili).
  drawPlot() {
    const g = this.plotGeom();
    const W = g.cols * 16 + 2; const H = g.rows * 16 + 2;
    const back = new Pix(W, H);
    for (const [key, cell] of Object.entries(S.save.plot.back || {})) {
      const def = BUILD[cell.id];
      if (!def) continue;
      const [c, r] = key.split(',').map(Number);
      if (c >= g.cols || r >= g.rows) continue;
      back.draw(block(def.tex), 1 + c * 16, 1 + (g.rows - 1 - r) * 16, 16);
    }
    back.each((v) => { const k = v >>> 24; if (!k) return v; const c = [v & 255, (v >>> 8) & 255, (v >>> 16) & 255].map((x) => Math.round(x * 0.58)); return ((k << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0; });
    const pix = new Pix(W, H);
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      const frame = this.plotFrame(cell);
      if (!frame) continue;
      const [c, r] = key.split(',').map(Number);
      if (c >= g.cols || r >= g.rows) continue;
      pix.draw(block(frame), 1 + c * 16, 1 + (g.rows - 1 - r) * 16, 16);
    }
    pix.outline(INK);
    for (const [img, tex, depth, sk] of [[this.plotBackImg, 'plot_back_tex', 4, 'plotBackImg'], [this.plotImg, 'plot_tex', 5, 'plotImg']]) {
      if (img) img.destroy();
      if (this.textures.exists(tex)) this.textures.remove(tex);
      this.textures.addCanvas(tex, (tex === 'plot_tex' ? pix : back).canvas());
      this[sk] = this.add.image(g.x0 - 1, GROUND_Y - g.rows * 16 - 1, tex).setOrigin(0).setDepth(depth);
      this.roomObjs.push(this[sk]);
    }
    // tabela yazilari
    for (const l of this.signLabels || []) { l.remove(); this.labels = this.labels.filter((x) => x !== l); }
    this.signLabels = [];
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      if (cell.id !== 'tabela_blok' || !cell.text) continue;
      const [c, r] = key.split(',').map(Number);
      const l = UI.el('div', 'objlabel sign', '');
      l.textContent = cell.text;
      l._x = g.x0 + c * 16 + 8;
      l.style.left = UI.pctX(l._x - this.cameras.main.scrollX);
      l.style.top = UI.pctY(GROUND_Y - (r + 1) * 16 - 2);
      UI.$('#floats').appendChild(l);
      this.labels.push(l);
      this.signLabels.push(l);
    }
  }

  drawCell() { this.drawPlot(); }

  // bahce: tarlanin ustunde buyuyen bitki
  gardenInfo(key) {
    const gd = S.save.plot.garden[key];
    if (!gd) return null;
    const sd = SEEDS[gd.seed];
    const p = (gNow() - gd.t0) / sd.ms;
    return { ...gd, sd, p, ready: p >= 1, left: Math.max(0, gd.t0 + sd.ms - gNow()) };
  }

  refreshGarden() {
    if (this.mode !== 'plot') return;
    const g = this.plotGeom();
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      if (cell.id !== 'tarla') continue;
      const info = this.gardenInfo(key);
      const frame = !info ? null : info.ready ? (info.sd.frame || (info.seed === 'ot_tohumu' ? 'bitki' : info.seed === 'ay_tohumu' ? 'ay_otu' : 'cali')) : info.p < 0.4 ? 'filiz' : 'fide';
      const cur = this.gardenSprites[key];
      if (cur && cur.frame.name === frame) continue;
      if (cur) { cur.destroy(); delete this.gardenSprites[key]; }
      if (!frame) continue;
      const [c] = key.split(',').map(Number);
      const spr = this.add.image(g.x0 + c * 16, GROUND_Y - 32 + 4, 'blocks', frame).setOrigin(0).setDepth(6);
      this.gardenSprites[key] = spr;
      this.roomObjs.push(spr);
    }
  }

  // bir hucrenin asil (sol alt) hucresi: kapinin ustu ve yatagin sag yarisi asil hucreye gider
  plotOrigin(cell) {
    const cells = S.save.plot.cells;
    const c = cells[cell.key];
    if (!c) return null;
    if (c.top) return { c: cell.c, r: cell.r - 1, key: `${cell.c},${cell.r - 1}` };
    if (c.part) return { c: cell.c - 1, r: cell.r, key: `${cell.c - 1},${cell.r}` };
    return cell;
  }

  // arsaya dokununca: insa modunda blok koy/kaldir; degilse mobilya ve tarla
  plotTap(ptr) {
    const cell = this.cellAt(ptr.worldX, ptr.worldY);
    if (this.building) {
      if (!cell) return true; // insa modunda arsa disina dokunmak bir sey yapmaz
      if (this.buildTool === 'kaldir') this.removeAt(cell); else this.placeAt(cell);
      return true;
    }
    if (!cell) return false;
    const o = this.plotOrigin(cell);
    const oc = o && S.save.plot.cells[o.key];
    const g = this.plotGeom();
    // 1.0.23 (Eren): dokunulan blok/esya kisa bir sure isaretlenir
    const sel = (c, r, cw = 1, ch = 1) => this.flashSel(g.x0 + c * 16, GROUND_Y - (r + ch) * 16, cw * 16, ch * 16);
    if (oc && BUILD[oc.id] && BUILD[oc.id].func) { const d = BUILD[oc.id]; sel(o.c, o.r, d.wide ? 2 : 1, d.tall ? 2 : 1); this.useFurniture(o, oc); return true; }
    // tarlanin kendisi ya da ustundeki bitki
    const base = oc && oc.id === 'tarla' ? o
      : cell.r === 1 && S.save.plot.cells[`${cell.c},0`] && S.save.plot.cells[`${cell.c},0`].id === 'tarla' ? { c: cell.c, r: 0, key: `${cell.c},0` } : null;
    if (!base) return false;
    sel(base.c, base.r, 1, 2);
    this.gardenTap(base);
    return true;
  }

  standNear(c) {
    const g = this.plotGeom();
    const cx = g.x0 + c * 16 + 8;
    const side = this.player.x <= cx ? -1 : 1;
    return { cx, x: Phaser.Math.Clamp(cx + side * 18, 12, g.w - 12) };
  }

  async walkToCell(c) {
    const { cx, x } = this.standNear(c);
    if (Math.abs(this.player.x - cx) > 30) await moveTo(this.player, x, Math.abs(this.player.x - x) > SPRINT_DIST ? { speed: 190, anim: 'c_sprint' } : { speed: 110, anim: 'c_walk' });
    this.player.setFlipX(cx < this.player.x);
  }

  // ---- islevli mobilyalar (0.10.5)
  async useFurniture(o, cell) {
    if (this.busy) return;
    const f = BUILD[cell.id].func;
    if (f === 'kapi') {
      cell.open = !cell.open;
      const top = S.save.plot.cells[`${o.c},${o.r + 1}`];
      if (top) top.open = cell.open;
      sfx(cell.open ? 'chest' : 'click');
      this.drawPlot();
      S.changed();
      return;
    }
    this.busy = true;
    await this.walkToCell(o.c);
    this.idle();
    this.busy = false;
    if (f === 'masa' || f === 'firin' || f === 'kazan') { openStation(this, f); return; }
    if (f === 'sandik') { openDepo(this); return; }
    if (f === 'kupa') { openTrophies(this); return; }
    if (f === 'tabela') { this.editSign(o, cell); return; }
    if (f === 'yatak') await this.sleepInBed();
    if (f === 'kovan') await this.useHive(o, cell);
    if (f === 'kulucka') openNest(this);
  }

  editSign(o, cell) {
    UI.openPanel('Tabela', (body) => {
      body.appendChild(UI.el('p', 'muted', 'Tabelaya ne yazalım? (en fazla 24 harf)'));
      const inp = document.createElement('input');
      inp.className = 'sign-input';
      inp.maxLength = 24;
      inp.value = cell.text || '';
      body.appendChild(inp);
      const row = UI.el('div', 'choice-row');
      row.appendChild(UI.button('Yaz', () => {
        cell.text = inp.value.replace(/[<>]/g, '').trim().slice(0, 24);
        S.changed();
        UI.closePanel();
        sfx('craft');
        this.drawPlot();
      }, 'primary'));
      row.appendChild(UI.button('Sil', () => { cell.text = ''; S.changed(); UI.closePanel(); this.drawPlot(); }, 'small'));
      body.appendChild(row);
      setTimeout(() => inp.focus(), 50);
    });
  }

  async sleepInBed() {
    this.busy = true;
    const night = this.tod === 'gece' || this.tod === 'gunbatimi';
    this.player.play('c_sit');
    await wait(this, 500);
    await this.fade(true);
    S.hp = S.maxHp();
    if (night) {
      // M4: oyun ici gun dongusunde bir sonraki sabaha kadar gunduz say (gece atlatilir)
      S.save.dayUntil = nextMorning();
      TOD_SKIP.until = S.save.dayUntil;
    }
    S.changed();
    await wait(this, 500);
    this.tod = todNow();
    this.applyTod();
    this.refreshHud();
    await this.fade(false);
    UI.feed(night ? 'Güzel bir uyku! Gece bitti, sabah oldu. Canın doldu.' : 'Biraz kestirdin. Canın doldu. (Akşam ya da gece uyursan sabah olur.)');
    await playAnim(this.player, 'c_cheer', 1);
    this.idle();
    this.busy = false;
  }

  // ---- insa modu
  startBuild() {
    if (this.busy) return;
    this.building = true;
    if (!this.buildSel || !S.countItem(this.buildSel)) this.buildSel = BUILD_ORDER.find((id) => S.countItem(id) > 0 && S.level('insa') >= BUILD[id].lvl) || null;
    this.buildTool = 'koy';
    this.drawGrid();
    this.buildBar();
  }

  stopBuild() {
    if (!this.building) return;
    this.building = false;
    if (this.grid) { this.grid.destroy(); this.grid = null; }
    if (this.mode === 'plot') this.plotActions();
  }

  drawGrid() {
    if (this.grid) this.grid.destroy();
    const g = this.plotGeom();
    const gr = this.add.graphics().setDepth(8);
    gr.lineStyle(1, 0xffffff, 0.22);
    const top = GROUND_Y - g.rows * 16;
    for (let c = 0; c <= g.cols; c++) gr.lineBetween(g.x0 + c * 16 + 0.5, top, g.x0 + c * 16 + 0.5, GROUND_Y);
    for (let r = 0; r <= g.rows; r++) gr.lineBetween(g.x0, GROUND_Y - r * 16 + 0.5, g.x0 + g.cols * 16, GROUND_Y - r * 16 + 0.5);
    this.grid = gr;
  }

  canBack(id) { const d = BUILD[id]; return !!d && !d.prop && !d.tall && !d.wide && !d.func && !d.ground; }

  // alt cubuk: elindeki bloklar (simge + adet), On/Arka, Kaldir, Bitti
  buildBar() {
    const bar = UI.$('#actions');
    bar.innerHTML = '';
    const lvl = S.level('insa');
    const back = this.buildLayer === 'arka';
    const owned = BUILD_ORDER.filter((id) => S.countItem(id) > 0);
    if (!owned.length) UI.feed('Elinde inşa bloğu yok. Zanaat avlusundaki Üretim Masası\'nda Tahta Kalas, Kütük, Çit gibi bloklar yapabilirsin.');
    const scroller = UI.el('div', 'build-scroll');
    for (const id of owned) {
      const def = BUILD[id];
      const b = UI.el('button', 'btn small build-btn' + (this.buildTool === 'koy' && this.buildSel === id ? ' sel' : ''));
      b.appendChild(UI.icon(ITEMS[id].icon));
      b.appendChild(UI.el('span', '', `${S.countItem(id)}`));
      b.title = ITEMS[id].name + (lvl < def.lvl ? ` (İnşa ${def.lvl} gerekli)` : '');
      if (lvl < def.lvl || (back && !this.canBack(id))) b.classList.add('locked');
      b.onclick = (ev) => {
        ev.stopPropagation(); sfx('click');
        if (lvl < def.lvl) { UI.feed(`${ITEMS[id].name} koymak için İnşa ${def.lvl} gerekli.`); return; }
        if (back && !this.canBack(id)) { UI.feed(`${ITEMS[id].name} arka duvara konmaz. Arka duvar için tam blok seç (taş, kalas, tuğla...).`); return; }
        this.buildSel = id; this.buildTool = 'koy'; this.buildBar();
      };
      scroller.appendChild(b);
    }
    bar.appendChild(scroller);
    if (this.buildSel === 'kiremit' && this.buildTool === 'koy' && !back) {
      const names = { kiremit: 'Düz', kiremit_sol: 'Sol eğim', kiremit_sag: 'Sağ eğim' };
      const shape = this.roofShape || 'kiremit';
      bar.appendChild(UI.button(`Şekil: ${names[shape]}`, () => {
        const order = BUILD.kiremit.shapes;
        this.roofShape = order[(order.indexOf(shape) + 1) % order.length];
        this.buildBar();
      }, 'small'));
    }
    bar.appendChild(UI.button(back ? 'Katman: Arka' : 'Katman: Ön', () => { this.buildLayer = back ? 'on' : 'arka'; this.buildBar(); }, 'small ' + (back ? 'purple' : 'blue')));
    bar.appendChild(UI.button('Kaldır', () => { this.buildTool = this.buildTool === 'kaldir' ? 'koy' : 'kaldir'; this.buildBar(); }, 'small' + (this.buildTool === 'kaldir' ? ' sel red' : '')));
    bar.appendChild(UI.button('Bitti', () => this.stopBuild(), 'small primary'));
    const where = back ? 'arka duvar' : 'ön';
    const sel = this.buildTool === 'kaldir' ? `Kaldır (${where}): bloğa dokun` : this.buildSel ? `${ITEMS[this.buildSel].name} (${where}): boş kareye dokun` : 'Blok seç';
    UI.setLocation(`İnşa · ${sel}`);
  }

  canPlace(id, cell, back = false) {
    const def = BUILD[id];
    const g = this.plotGeom();
    if (back) {
      if (!this.canBack(id)) return 'Bu arka duvara konmaz.';
      if (S.save.plot.back[cell.key]) return 'Arka duvarda orası dolu.';
      return null;
    }
    const cells = S.save.plot.cells;
    if (cells[cell.key]) return 'Orası dolu.';
    if (def.ground && cell.r !== 0) return 'Tarla sadece zemine konur.';
    if (def.tall && (cell.r + 1 >= g.rows || cells[`${cell.c},${cell.r + 1}`])) return 'Kapının üstünde bir boş kare daha lazım.';
    if (def.wide && (cell.c + 1 >= g.cols || cells[`${cell.c + 1},${cell.r}`])) return 'Yatağın sağında bir boş kare daha lazım.';
    if (cell.r === 1 && cells[`${cell.c},0`] && cells[`${cell.c},0`].id === 'tarla') return 'Tarlanın üstü bitki için boş kalmalı.';
    if (id === 'depo_sandigi' && Object.values(cells).filter((x) => x.id === 'depo_sandigi').length >= 4) return 'En fazla 4 Depo Sandığı koyabilirsin.';
    if (id === 'tarla') {
      const n = Object.values(cells).filter((x) => x.id === 'tarla').length;
      const mx = MAX_TARLA(S.level('insa')) + (S.has('mimar') ? 4 : 0);
      if (n >= mx) return `En fazla ${mx} tarla koyabilirsin (İnşa seviyesiyle artar).`;
      if (cells[`${cell.c},1`]) return 'Tarlanın üstü boş olmalı.';
    }
    return null;
  }

  async placeAt(cell) {
    if (this.busy) return;
    const id = this.buildSel;
    if (!id || !S.countItem(id)) { UI.feed('Önce aşağıdan bir blok seç.'); this.sulk(); return; }
    const def = BUILD[id];
    const back = this.buildLayer === 'arka';
    if (S.level('insa') < def.lvl) { UI.feed(`İnşa ${def.lvl} gerekli.`); this.sulk(); return; }
    const why = this.canPlace(id, cell, back);
    if (why) { UI.feed(why); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    // blogu koyar, bir adim geri cekilir (placeblock)
    sfx('craft');
    const anim = playAnim(this.player, 'c_placeblock', 2.2);
    await wait(this, 260);
    S.removeItem(id, 1);
    S.save.stats.placed = (S.save.stats.placed || 0) + 1;
    if (back) S.save.plot.back[cell.key] = { id };
    else {
      const cells = S.save.plot.cells;
      cells[cell.key] = id === 'kiremit' && this.roofShape && this.roofShape !== 'kiremit' ? { id, shape: this.roofShape } : { id };
      if (def.tall) cells[`${cell.c},${cell.r + 1}`] = { id, top: true };
      if (def.wide) cells[`${cell.c + 1},${cell.r}`] = { id, part: true };
      if (def.func === 'kovan') cells[cell.key].t = gNow();
      if (id === 'depo_sandigi') { while (S.save.depo.length < S.depoSize()) S.save.depo.push(null); UI.feed(`Depo büyüdü: artık ${S.save.depo.length} yer.`); }
    }
    this.drawPlot();
    if (id === 'tarla') this.refreshGarden();
    if (def.glow) this.applyTod();
    // Insa XP: arsadaki blok sayisi yeni bir rekora cikinca; ilk kez konan blok turune bonus
    let xp = 0;
    const placed = S.placedCount();
    if (placed > (S.save.plot.best || 0)) { S.save.plot.best = placed; xp += def.xp; }
    if (!S.save.plot.kinds[id]) { S.save.plot.kinds[id] = 1; xp += def.xp * 4; UI.feed(`Yeni blok türü: ${ITEMS[id].name}! Bonus İnşa XP.`); }
    let ups = [];
    if (xp) {
      UI.floatText(this.player.x, GROUND_Y - 44, `+${xp} İnşa XP`, 'good');
      const before = this.plotGeom();
      ups = S.addXp({ insa: xp });
      const after = this.plotGeom();
      if (after.rows !== before.rows) this.time.delayedCall(1200, () => { if (this.mode === 'plot') { UI.banner('Arsan büyüdü!', `${after.cols}×${after.rows} blok`, 2000); const b = this.building; this.goPlot(); if (b) this.startBuild(); } });
    }
    S.changed();
    await anim;
    this.idle();
    await this.levelUps(ups);
    await this.checkBaseRewards();
    this.busy = false;
    if (this.building) { if (!S.countItem(id)) this.buildSel = null; this.buildBar(); }
  }

  async removeAt(cell) {
    if (this.busy) return;
    const back = this.buildLayer === 'arka';
    if (back) {
      const bc = S.save.plot.back[cell.key];
      if (!bc) return;
      if (!bc.free && !S.fits(bc.id)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
      this.busy = true;
      await this.walkToCell(cell.c);
      await playAnim(this.player, 'c_punch', 1.6);
      sfx('break');
      delete S.save.plot.back[cell.key];
      if (!bc.free) S.addItem(bc.id, 1);
      this.drawPlot();
      S.changed();
      this.idle();
      this.busy = false;
      if (this.building) this.buildBar();
      return;
    }
    const cells = S.save.plot.cells;
    const o = this.plotOrigin(cell);
    if (!o) return;
    const key = o.key;
    const c = cells[key];
    if (!c) return;
    if (c.id === 'tarla' && S.save.plot.garden[key]) { UI.feed('Tarlada bitki var. Önce hasat et.'); this.sulk(); return; }
    if (c.id === 'depo_sandigi') {
      // sandik kalkinca depo kuculur: fazla yerdeki esyalar ice sigmali
      const newSize = S.depoSize() - 10;
      const items = S.save.depo.filter(Boolean);
      if (items.length > newSize) { UI.feed('Depon dolu: sandığı kaldırmadan önce Depo\'dan biraz eşya al.'); this.sulk(); return; }
    }
    if (!c.free && !S.fits(c.id)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(o.c);
    await playAnim(this.player, 'c_punch', 1.6);
    sfx('break');
    delete cells[key];
    const def = BUILD[c.id];
    if (def && def.tall) delete cells[`${o.c},${o.r + 1}`];
    if (def && def.wide) delete cells[`${o.c + 1},${o.r}`];
    if (c.id === 'depo_sandigi') {
      const items = S.save.depo.filter(Boolean);
      S.save.depo = items.concat(new Array(S.depoSize() - items.length).fill(null));
    }
    this.drawPlot();
    if (def && def.glow) this.applyTod();
    if (!c.free) S.addItem(c.id, 1);
    S.changed();
    this.idle();
    this.busy = false;
    if (this.building) this.buildBar();
  }

  // Us Puani odulleri: 100/250/500/1000 (en yuksek puana gore, bir kez)
  async checkBaseRewards() {
    const score = S.baseScore();
    S.save.plot.bestScore = Math.max(S.save.plot.bestScore || 0, score);
    for (const rw of BASE_REWARDS) {
      if (S.save.plot.bestScore < rw.pts || S.save.plot.rw[rw.pts]) continue;
      S.save.plot.rw[rw.pts] = 1;
      addPul(rw.pul);
      sfx('rare');
      UI.banner(`Ev Puanı ${rw.pts}!`, 'Yeni tarifler açıldı', 2200, 'gold');
      UI.feed(`Ev Puanı ${rw.pts} ödülü: Üretim Masası'nda yeni tarifler (${rw.items.map((i) => ITEMS[i].name).join(', ')}) ve +${rw.pul} ${PUL}.${rw.title ? ' Yeni bir unvan da açıldı!' : ''}`, 'gold');
      S.changed();
      await this.celebrate();
    }
  }

  // ---- bahce
  gardenTap(cell) {
    const info = this.gardenInfo(cell.key);
    if (!info) {
      const seeds = Object.keys(SEEDS).filter((id) => S.countItem(id) > 0);
      if (!seeds.length) { UI.feed('Tohumun yok. Hancı Lale buğday, havuç, patates ve daha fazla tohum satar; Keşifte ot ve böğürtlen toplarken de tohum çıkar.'); this.sulk(); return; }
      const tod = todNow();
      UI.choice('Bahçe tarlası', 'Ne ekmek istersin? (★ = şu an sevdiği saat, %25 çabuk büyür)', [
        ...seeds.map((id) => ({ label: `${SEEDS[id].likes === tod ? '★ ' : ''}${SEEDS[id].name} (${S.countItem(id)})`, cls: 'primary', onClick: () => this.plant(cell, id) })),
        { label: 'Vazgeç' },
      ]);
      return;
    }
    if (!info.ready) {
      const m = Math.ceil(info.left / 60000);
      const gd = S.save.plot.garden[cell.key];
      const opts = [];
      if (!gd.w) opts.push({ label: S.countItem('su_kovasi') ? 'Sula (süre yarıya iner)' : 'Sula (Su Kovası lazım)', cls: 'blue', onClick: () => this.waterCrop(cell) });
      if (!gd.f) opts.push({ label: `Gübrele: +2 ürün (Gübre ${S.countItem('gubre')})`, cls: 'green', onClick: () => this.fertilize(cell) });
      opts.push({ label: 'Tamam' });
      const tags = [gd.w ? 'sulandı' : '', gd.f ? 'gübrelendi' : ''].filter(Boolean).join(', ');
      UI.choice(info.sd.name, `Büyüyor: ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`} kaldı.${tags ? ` (${tags})` : ''}`, opts);
      return;
    }
    this.harvest(cell, info);
  }

  async waterCrop(cell) {
    const gd = S.save.plot.garden[cell.key];
    if (!gd || gd.w || this.busy) return;
    if (!S.countItem('su_kovasi')) { UI.feed('Sulamak için Su Kovası lazım. Üretim Masası: 2 Demir Külçesi.'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    await playAnim(this.player, 'c_drinkpotion', 2.4);
    const sd = SEEDS[gd.seed];
    const left = Math.max(0, gd.t0 + sd.ms - gNow());
    gd.t0 -= left / 2;
    gd.w = 1;
    sfx('splash');
    UI.floatText(this.plotGeom().x0 + cell.c * 16 + 8, GROUND_Y - 30, 'Sulandı!', 'info');
    S.changed();
    this.refreshGarden();
    this.idle();
    this.busy = false;
  }

  async fertilize(cell) {
    const gd = S.save.plot.garden[cell.key];
    if (!gd || gd.f || this.busy) return;
    if (!S.countItem('gubre')) { UI.feed('Gübre yok. Üretim Masası: 2 Solucan + 1 Pulcuk = 3 Gübre.'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 800);
    S.removeItem('gubre', 1);
    gd.f = 1;
    sfx('gather');
    UI.floatText(this.plotGeom().x0 + cell.c * 16 + 8, GROUND_Y - 30, 'Gübrelendi: +2', 'info');
    S.changed();
    this.idle();
    this.busy = false;
  }

  async plant(cell, seed) {
    if (this.busy || !S.countItem(seed)) return;
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 900);
    S.removeItem(seed, 1);
    const sd = SEEDS[seed];
    const liked = sd.likes && sd.likes === todNow();
    S.save.plot.garden[cell.key] = { seed, t0: gNow() - (liked ? sd.ms * 0.25 : 0) };
    sfx('gather');
    S.changed();
    this.refreshGarden();
    const h = sd.ms / 3600000;
    UI.feed(`${sd.name} ektin. ${h} saatte büyür, oyun kapalıyken de.${liked ? ' Sevdiği saatte ektin: %25 çabuk!' : ''}`);
    this.idle();
    this.busy = false;
  }

  async harvest(cell, info) {
    if (this.busy) return;
    const gd = S.save.plot.garden[cell.key];
    const n = info.sd.n[0] + Math.floor(Math.random() * (info.sd.n[1] - info.sd.n[0] + 1)) + (gd && gd.f ? 2 : 0);
    if (!S.fits(info.sd.out, n)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 1100);
    delete S.save.plot.garden[cell.key];
    sfx('gather');
    this.giveDrop(info.sd.out, n, 'Hasat ettin:', true);
    // ciftlik urunleri tohumunu hep geri verir (1-2), eski bitkiler %50
    if (info.sd.crop) this.giveDrop(info.seed, 1 + (Math.random() < 0.4 ? 1 : 0), 'Tohum:', true);
    else if (Math.random() < 0.5) this.giveDrop(info.seed, 1, 'Tohum geri geldi:', true);
    UI.floatText(this.player.x, GROUND_Y - 44, `+${info.sd.xp} Toplama XP`, 'good');
    const ups = S.addXp({ toplama: info.sd.xp });
    S.save.stats.gathered++;
    S.save.stats.harvested = (S.save.stats.harvested || 0) + 1;
    S.changed();
    this.refreshGarden();
    await this.levelUps(ups);
    this.idle();
    this.busy = false;
  }

  // 0.11 Ari Kovani: arsada cicek varsa bal birikir
  hiveInfo(cell) {
    const flowers = Object.values(S.save.plot.cells).filter((c) => HIVE.flowers.includes(c.id)).length;
    const rate = flowers >= 3 ? HIVE.msFlowers : HIVE.ms;
    const t = cell.t || gNow();
    const honey = flowers ? Math.min(HIVE.max, Math.floor((gNow() - t) / rate)) : 0;
    return { flowers, rate, honey, t };
  }

  async useHive(o, cell) {
    const h = this.hiveInfo(cell);
    if (!h.flowers) { cell.t = gNow(); S.changed(); UI.feed('Arıların çiçeğe ihtiyacı var: arsana Çiçek Saksısı koy (3 ve üstü çiçek = daha hızlı bal).'); this.sulk(); return; }
    if (!h.honey) {
      const m = Math.ceil((h.t + h.rate - gNow()) / 60000);
      this.say(`Arılar çalışıyor… ${m} dk sonra bal olur. (${h.flowers} çiçek)`, 2600);
      return;
    }
    if (!S.fits('bal', h.honey)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(o.c);
    this.player.play('c_sneakspam');
    await wait(this, 900);
    this.giveDrop('bal', h.honey, 'Kovandan aldın:', true);
    cell.t = h.honey >= HIVE.max ? gNow() : h.t + h.honey * h.rate;
    S.changed();
    this.idle();
    this.busy = false;
  }
}
