// Savas: ATB (bekleme cubugu) sistemi, manuel / otomatik mod, zamanlama cubugu, kacinma,
// durumlar (Zehir, Yanma, Sersem, Donma, Karanlik), silah yetenekleri ve kombolar (0.5),
// yanindaki evcil Glemon ve evcillestirme (0.4), odul ve dusurmeler.
import {
  GLEMONS, GROUND_Y, RARITY, ITEMS, floorMult, ANIM_POOLS, CURRENCY, STAGES, STAGE_STAT, TAME, FOODS, ZONE_SPAWNS,
  typeMult, WATER_GLEMONS, BASIC, ABILITIES, WEAPON_SKILL, STATUS_NAMES, COMBOS, zoneOf, ZONES, masteryOf,
} from './data.js';
import { S } from './state.js';
import { ARENA } from './art.js';
import { $, el, button, floatText, feed, timingBar, dodgePrompt, banner } from './ui.js';
import { sfx } from './audio.js';
import { playAnim, wait } from './anim.js';

const RMULT = { siradan: 1, nadir: 1.6, epik: 2.5, efsanevi: 15 };
const ATB_RATE = 1.0; // Hiz 100 -> cubuk 1 saniyede dolar
const GRADE = {
  mukemmel: { mult: 2, text: 'MÜKEMMEL!', cls: 'perfect', sfx: 'perfect' },
  iyi: { mult: 1.2, text: 'İyi!', cls: 'good', sfx: null },
  zayif: { mult: 0.8, text: 'Zayıf', cls: 'weak', sfx: 'weak' },
};
const WEAPON_ANIM = { kilic: 'stab', yay: 'bowshot', yumruk: 'punch' };
const PET_POS = { x: 136, y: GROUND_Y + 24, scale: 1.6 };

export function calcDamage(atk, mult, def) {
  const d = atk * mult * (100 / (100 + def)) * (0.9 + Math.random() * 0.2);
  return Math.max(1, Math.round(d));
}

const BATTLE_ITEMS = ['iksir_k', 'orta_iksir', 'buyuk_iksir', 'ay_iksiri', 'mantar_corbasi', 'izgara_balik', 'balik_corbasi', 'bogurtlen', 'hurma', 'altin_elma', 'bonk_bombasi'];
// otomatik savasin kullanabildigi iyilestiriciler (Altin Elma haric), zayiftan gucluye
const HEALS = BATTLE_ITEMS.filter((id) => ITEMS[id] && ITEMS[id].heal && !ITEMS[id].golden).sort((a, b) => ITEMS[a].heal - ITEMS[b].heal);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Savas ekrani karakterin arkasindan bakar: karakter solda, yakin ve buyuk (arka 3/4)
export const BPOS = { x: 70, y: GROUND_Y + 34, scale: 2 }; // 0.8.9: daha kucuk, on tumsegin ustunde
const B = (a) => `c_b_${a}`;
// Glemon turunun bolgesi (yemi bu bolgenin yemidir)
const ZONE_OF_KEY = {};
for (const [z, list] of Object.entries(ZONE_SPAWNS)) for (const [k] of list) ZONE_OF_KEY[k] = z;
for (const [k] of WATER_GLEMONS) ZONE_OF_KEY[k] = 'su';
const emptySt = () => ({ zehir: 0, yanma: 0, sersem: 0, donma: 0, karanlik: 0, shell: 0, reflect: 0 });

// ayri savas ekraninda (arena) Glemonlarin yerleri
function arenaX(n, i, boss) {
  if (boss) return [280, 190, 344][i] ?? 190;
  if (n === 1) return 262;
  if (n === 2) return [222, 302][i];
  return [198, 264, 332][i];
}

function slotX(n, i, boss) {
  if (boss) return [292, 206, 356][i] ?? 206;
  if (n === 1) return 262;
  if (n === 2) return [236, 306][i];
  return [218, 276, 338][i];
}

export class Battle {
  // specs: [{ key, shiny, golden, sleeping, stage }]
  constructor(world, specs, opts = {}) {
    this.w = world;
    this.scene = world;
    this.opts = opts;
    this.floor = opts.floor || 1;
    this.zone = zoneOf(this.floor);
    this.enemies = [];
    this.over = false;
    this.busy = true;
    this.phase = null;
    this.wt = S.weaponType();
    // yayla savasa onde baslarsin (Tek Ok: ilk saldiran sen olursun)
    this.pAtb = opts.ambush ? 100 : Math.random() * 30 + (this.wt === 'yay' ? 45 : 0);
    this.status = { zehir: 0, sersem: 0, savun: false, yanma: opts.burn && !S.fireproof() ? 3 : 0, tok: 0, guc: 0, donma: 0, karanlik: opts.dark && !S.darkproof() ? 3 : 0 };
    this.cd = {};
    this.manualActs = 0;
    this.autoActs = 0;
    this.killXp = 0;
    this.defXp = 0;
    this.luckXp = 0;
    this.bagXp = 0;
    this.luckBonus = 1;
    this.gold = 0;
    this.flyTold = false;
    this.firstStrike = !!opts.ambush;
    this.gy = GROUND_Y;   // Glemonlarin durdugu zemin (arenada uzak meydan)
    this.arena = false;
    this.pet = null;
    specs.forEach((s, i) => this.addEnemy(s, slotX(specs.length, i, opts.boss)));
    if (opts.surprised) for (const e of this.enemies) e.atb = 100;
  }

  // -------------------------------------------------------------- dusmanlar
  addEnemy(spec, x) {
    const data = GLEMONS[spec.key];
    const stage = data.boss ? 0 : (spec.stage || 0);
    const meta = this.w.gmeta[spec.key].stages[stage];
    const m = floorMult(this.floor);
    const zoom = this.arena ? (data.boss ? 1.5 : 2) : 1;
    const scale = (spec.golden ? 1.35 : 1) * zoom;
    const tex = `gs_${spec.key}_${stage}`;
    const k = (a) => `g_${spec.key}_${stage}_${a}${spec.shiny ? '_p' : ''}`;
    const sprite = this.scene.add.sprite(x, this.gy, tex, spec.shiny ? meta.n : 0)
      .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(8).setScale(scale);
    if (spec.golden) sprite.setTint(0xffd86a);
    sprite.play(k('durma'));
    if (spec.sleeping) sprite.anims.timeScale = 0.35;
    const shadow = this.scene.add.image(x, this.gy + 1, 'shadow').setDepth(7).setScale((meta.bodyW * scale) / 18, 1);
    const prefix = (spec.shiny ? 'Parlak ' : spec.golden ? 'Altın ' : '') + (stage ? `${STAGES[stage]} ` : '');
    const sm = STAGE_STAT[stage];
    const e = {
      key: spec.key, data, meta, sprite, shadow, k, scale, spec, stage,
      homeX: x,
      name: prefix + data.name,
      from: prefix + data.from,
      rarity: spec.golden ? 'epik' : data.rarity,
      type: data.type,
      fly: !!data.fly,
      shiny: !!spec.shiny, golden: !!spec.golden, sleeping: !!spec.sleeping,
      maxHp: Math.round(data.hp * m * sm * (spec.golden ? 2.2 : 1)),
      atk: data.atk * m * (1 + 0.25 * stage) * (spec.golden ? 1.4 : 1),
      defense: data.def * m * (1 + 0.2 * stage),
      spd: data.spd,
      atb: Math.random() * 30,
      acts: 0,
      alive: true,
      st: emptySt(),
    };
    e.hp = e.maxHp;
    S.seeGlemon(spec.key, spec.shiny);
    if (spec.shiny) this.sparkle(e);
    this.enemies.push(e);
    return e;
  }

  alive() { return this.enemies.filter((e) => e.alive); }
  topY(e) { return this.gy - e.meta.ay * e.scale; }
  eDef(e) { return e.defense * (e.st.shell > 0 ? 2 : 1); }

  // Ayri savas ekranina gecis: Glemonlar uzak meydana, bize donuk ve buyuk
  toArena() {
    this.arena = true;
    this.gy = ARENA.enemyY;
    const n = this.enemies.length;
    this.enemies.forEach((e, i) => {
      const z = e.data.boss ? 1.5 : 2;
      e.scale = (e.golden ? 1.35 : 1) * z;
      e.homeX = arenaX(n, i, !!this.opts.boss);
      e.sprite.setPosition(e.homeX, this.gy).setScale(e.scale);
      e.shadow.setPosition(e.homeX, this.gy + 1).setScale((e.meta.bodyW * e.scale) / 18, e.scale * 0.8);
    });
    this.makePet();
  }

  // -------------------------------------------------------------- evcil Glemon (0.4)
  makePet() {
    const p = S.activePet();
    if (!p || (S.run && S.run.petDown) || this.pet) return;
    const meta = this.w.gmeta[p.key].stages[p.stage];
    const st = S.petStats(p);
    const k = (a) => `g_${p.key}_${p.stage}_${a}${p.shiny ? '_p' : ''}`;
    const sc = PET_POS.scale * (p.stage === 2 ? 0.85 : 1);
    const sprite = this.scene.add.sprite(PET_POS.x, PET_POS.y, `gs_${p.key}_${p.stage}`, p.shiny ? meta.n : 0)
      .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(18).setScale(sc).setFlipX(true);
    sprite.play(k('durma'));
    const shadow = this.scene.add.image(PET_POS.x, PET_POS.y + 1, 'shadow').setDepth(17).setScale((meta.bodyW * sc) / 18, sc * 0.8);
    const hp = S.run && S.run.petHp != null ? Math.min(S.run.petHp, st.maxHp) : st.maxHp;
    this.pet = {
      p, meta, sprite, shadow, k, scale: sc, data: GLEMONS[p.key], name: S.petName(p),
      maxHp: st.maxHp, hp, atk: st.atk, def: st.def, spd: st.spd,
      atb: Math.random() * 40, acts: 0, alive: hp > 0, charged: false, queued: false,
      taunt: 0, shell: 0, reflect: 0, fought: false,
    };
    if (!this.pet.alive) { sprite.destroy(); shadow.destroy(); this.pet = null; }
  }

  petTop() { const t = this.pet; return t.sprite.y - t.meta.ay * t.scale; }

  makePetBar() {
    const t = this.pet;
    if (!t) return;
    const wrap = el('div', 'ebar pbar');
    const nm = el('div', 'nm', `${t.name} Sv.${t.p.lvl}`);
    wrap.appendChild(nm);
    const hp = el('div', 'bar'); const hf = el('div', 'fill'); hp.appendChild(hf);
    const atb = el('div', 'bar atb'); const af = el('div', 'fill'); atb.appendChild(af);
    wrap.appendChild(hp); wrap.appendChild(atb);
    const sp = button(`★ ${t.data.special ? t.data.special.name : 'Yetenek'}`, () => {
      if (!t.charged || !t.alive) return;
      t.queued = true;
      sfx('click');
      floatText(t.sprite.x, this.petTop() - 6, 'Hazır!', 'good');
      this.renderPet();
    }, 'small purple pet-sp');
    wrap.appendChild(sp);
    wrap.style.left = `${(PET_POS.x / 384) * 100}%`;
    wrap.style.top = `${((this.petTop() - 2) / 216) * 100}%`;
    $('#bars').appendChild(wrap);
    t.ui = { wrap, hf, af, sp };
    this.renderPet();
  }

  renderPet() {
    const t = this.pet;
    if (!t || !t.ui) return;
    t.ui.hf.style.width = `${Math.max(0, t.hp / t.maxHp) * 100}%`;
    t.ui.af.style.width = `${t.atb}%`;
    const show = t.alive && t.charged && !S.save.settings.auto;
    t.ui.sp.classList.toggle('hidden', !show);
    t.ui.sp.classList.toggle('queued', !!t.queued);
  }

  // yanindaki Glemon'un sirasi: normal saldiri ya da ozel yetenek
  async petTurn() {
    const t = this.pet;
    this.busy = true;
    t.atb = 0;
    t.acts++;
    t.fought = true;
    if (t.taunt > 0) t.taunt--;
    if (t.shell > 0) t.shell--;
    if (t.reflect > 0) t.reflect--;
    if (t.acts % 3 === 0) t.charged = true;
    const sp = t.data.special;
    const useSp = t.charged && sp && (t.queued || S.save.settings.auto);
    this.renderPet();
    const alive = this.alive();
    if (!alive.length) { this.endEnemyTurn(); return; }
    const target = alive.reduce((a, b) => (a.hp <= b.hp ? a : b));
    if (useSp) {
      t.charged = false; t.queued = false;
      floatText(t.sprite.x, this.petTop() - 10, sp.name, 'info');
      if (sp.heal) {
        await playAnim(t.sprite, t.k('saldiri'), 1);
        const h = Math.round(S.maxHp() * 0.2);
        S.hp = Math.min(S.maxHp(), S.hp + h);
        t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * 0.2));
        floatText(this.px(), this.py(), `+${h}`, 'heal');
        sfx('heal');
        this.renderMe();
      } else if (sp.shell) {
        await playAnim(t.sprite, t.k('saldiri'), 1);
        t.shell = 3; t.taunt = 3;
        floatText(t.sprite.x, this.petTop() - 20, 'Glemonlar ona saldıracak!', 'info');
      } else if (sp.reflect) {
        await playAnim(t.sprite, t.k('saldiri'), 1);
        t.reflect = 3; t.taunt = 2;
        floatText(t.sprite.x, this.petTop() - 20, 'Dikenler hazır!', 'info');
      } else {
        if (sp.luck) { this.luckBonus = 1.3; floatText(t.sprite.x, this.petTop() - 20, 'Şans arttı!', 'perfect'); }
        await this.petStrike(target, sp.mult || 1.4, sp.status);
      }
    } else {
      await this.petStrike(target, 1, null);
    }
    t.sprite.play(t.k('durma'));
    this.renderPet();
    this.endEnemyTurn();
  }

  async petStrike(e, mult, status) {
    const t = this.pet;
    const tm = typeMult(t.data.type, e.type);
    t.sprite.setDepth(16);
    t.sprite.play(t.k('yurume'));
    await new Promise((res) => this.scene.tweens.add({ targets: t.sprite, x: e.sprite.x - 34, y: this.gy + 8, scale: t.scale * 0.8, duration: 240, ease: 'Quad.easeIn', onComplete: res }));
    const atk = playAnim(t.sprite, t.k('saldiri'), 1.6);
    await wait(this.scene, 200);
    if (e.alive) {
      const dmg = calcDamage(t.atk * tm, mult, this.eDef(e));
      this.applyDamage(e, dmg, false);
      if (tm > 1) floatText(e.sprite.x, this.topY(e) - 10, 'Etkili!', 'good');
      else if (tm < 1) floatText(e.sprite.x, this.topY(e) - 10, 'Etkisiz…', 'weak');
      if (status && e.alive) this.giveEnemyStatus(e, status);
      if (e.alive && e.st.reflect > 0) this.damagePet(Math.max(1, Math.round(dmg * 0.3)), 'Diken!');
    }
    await atk;
    if (t.sprite.active) {
      t.sprite.play(t.k('yurume'));
      await new Promise((res) => this.scene.tweens.add({ targets: t.sprite, x: PET_POS.x, y: PET_POS.y, scale: t.scale, duration: 260, ease: 'Quad.easeOut', onComplete: res }));
      t.sprite.setDepth(18);
    }
  }

  damagePet(d, label = null) {
    const t = this.pet;
    if (!t || !t.alive) return;
    t.hp = Math.max(0, t.hp - d);
    floatText(t.sprite.x, this.petTop(), label ? `${label} -${d}` : `-${d}`, 'hurt');
    if (S.run) S.run.petHp = t.hp;
    if (t.hp <= 0) {
      t.alive = false;
      if (S.run) S.run.petDown = true;
      feed(`${t.name} bayıldı! Üsse dönünce iyileşir.`);
      floatText(t.sprite.x, this.petTop() - 12, 'Bayıldı!', 'warn');
      t.sprite.play(t.k('hasar'));
      this.scene.tweens.add({ targets: [t.sprite, t.shadow], alpha: 0, duration: 600, delay: 200 });
      if (t.ui) { t.ui.wrap.remove(); t.ui = null; }
    } else {
      playAnim(t.sprite, t.k('hasar'), 1).then(() => { if (t.alive && t.sprite.active) t.sprite.play(t.k('durma')); });
      this.renderPet();
    }
  }

  // oyuncunun yazilari icin konum (karakter ekranin altinda, buyuk duruyor)
  px() { return this.w.player.x + 6; }
  py() { return BPOS.y - 60; }
  pose() { if (!this.lostDone) this.w.player.play(B('idlesway'), true); }
  atkMult() { return 1 + (this.status.tok > 0 ? 0.1 : 0) + (this.status.guc > 0 ? 0.3 : 0); }
  defMult() { return (this.status.savun ? 2 : 1) * (this.status.guc > 0 ? 1.3 : 1); }

  // oyuncu one atilir ve geri doner
  lunge(p, dx, dy, ms) {
    return new Promise((res) => this.scene.tweens.add({
      targets: p, x: BPOS.x + dx, y: BPOS.y + dy, scale: BPOS.scale * 0.9, duration: ms, ease: 'Quad.easeOut', onComplete: res,
    }));
  }
  back(p, ms = 180) {
    return new Promise((res) => this.scene.tweens.add({ targets: p, x: BPOS.x, y: BPOS.y, scale: BPOS.scale, duration: ms, ease: 'Quad.easeOut', onComplete: res }));
  }

  // 0.8.9: vurusta etrafa sacilan kucuk yildizlar ve ayak dibinde toz
  burst(x, y, n) {
    if (!this.scene.textures.exists('hitstar')) return;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const r = 16 + Math.random() * 12;
      const s = this.scene.add.image(x, y, 'hitstar').setDepth(13).setScale(0.6 + Math.random() * 0.6);
      this.scene.tweens.add({ targets: s, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r - 4, alpha: 0, angle: 90, scale: 0.3, duration: 380 + Math.random() * 160, ease: 'Quad.easeOut', onComplete: () => s.destroy() });
    }
  }
  dust(x, y) {
    if (!this.scene.textures.exists('dust')) return;
    for (const dx of [-1, 1]) {
      const d = this.scene.add.image(x + dx * 10, y - 2, 'dust').setDepth(11).setFlipX(dx < 0).setAlpha(0.9);
      this.scene.tweens.add({ targets: d, x: x + dx * 26, y: y - 6, alpha: 0, scale: 1.6, duration: 420, ease: 'Quad.easeOut', onComplete: () => d.destroy() });
    }
  }

  sparkle(e) {
    const ev = this.scene.time.addEvent({
      delay: 260, loop: true,
      callback: () => {
        if (!e.alive || !e.sprite.active) { ev.remove(); return; }
        const s = this.scene.add.rectangle(e.sprite.x + (Math.random() - 0.5) * e.meta.bodyW, this.topY(e) + Math.random() * e.meta.bodyH, 2, 2, 0xfff6a0).setDepth(9);
        this.scene.tweens.add({ targets: s, y: s.y - 8, alpha: 0, duration: 600, onComplete: () => s.destroy() });
      },
    });
  }

  // uyuyan Glemonlar: pusu (oyuncu once) ya da yakalanma (Glemon once)
  wake(surprised) {
    for (const e of this.enemies) {
      e.sprite.anims.timeScale = 1;
      if (surprised) { e.sleeping = false; e.atb = 100; } else e.atb = 0;
    }
    if (!surprised) { this.firstStrike = true; this.pAtb = 100; } else this.pAtb = 0;
  }

  // -------------------------------------------------------------- baslat
  start() {
    for (const e of this.enemies) {
      e.sprite.anims.timeScale = 1;
      this.makeBar(e);
    }
    this.makePetBar();
    this.buildPanel();
    $('#actions').classList.add('hidden');
    $('#battle').classList.remove('hidden');
    if (this.status.karanlik > 0) feed('Karanlıkta savaşıyorsun: vuruşların bazen boşa gidecek. (Fener taşı!)');
    if (this.opts.cold) feed('Üşüyorsun: bu savaşta yavaşsın. (Sıcak Çorba: Fırın)');
    if (this.status.yanma > 0 && this.opts.burn) feed('Lav sıcağı seni yaktı! (Ateş Direnci İksiri: Simya Kazanı)');
    return new Promise((res) => {
      this.resolve = res;
      this.busy = false;
    });
  }

  makeBar(e) {
    const wrap = el('div', 'ebar' + (e.data.boss ? ' boss' : ''));
    const nm = el('div', 'nm', e.name);
    nm.style.color = (RARITY[e.rarity] || RARITY.siradan).color;
    wrap.appendChild(nm);
    const hp = el('div', 'bar'); const hf = el('div', 'fill'); hp.appendChild(hf);
    const atb = el('div', 'bar atb'); const af = el('div', 'fill'); atb.appendChild(af);
    const st = el('div', 'est', '');
    wrap.appendChild(hp); wrap.appendChild(atb); wrap.appendChild(st);
    wrap.style.left = `${(e.homeX / 384) * 100}%`;
    wrap.style.top = `${((this.topY(e) - 3) / 216) * 100}%`;
    $('#bars').appendChild(wrap);
    e.ui = { wrap, hf, af, st };
    this.renderEnemy(e);
  }

  renderEnemy(e) {
    if (!e.ui) return;
    e.ui.hf.style.width = `${Math.max(0, e.hp / e.maxHp) * 100}%`;
    e.ui.af.style.width = `${e.atb}%`;
    const parts = [];
    for (const k of ['zehir', 'yanma', 'sersem', 'donma', 'karanlik']) if (e.st[k] > 0) parts.push(STATUS_NAMES[k]);
    if (e.st.shell > 0) parts.push('Kabuk');
    if (e.st.reflect > 0) parts.push('Diken');
    if (e.fly) parts.push('Uçuyor');
    if (e.ui.st.textContent !== parts.join(' · ')) e.ui.st.textContent = parts.join(' · ');
  }

  // -------------------------------------------------------------- panel
  buildPanel() {
    const b = $('#battle');
    b.innerHTML = '';
    const me = el('div', 'b-me');
    me.appendChild(el('div', '', S.save.char));
    const hp = el('div', 'bar hp'); this.hpFill = el('div', 'fill'); this.hpText = el('span', '');
    hp.appendChild(this.hpFill); hp.appendChild(this.hpText);
    const atb = el('div', 'bar atb'); this.atbFill = el('div', 'fill'); atb.appendChild(this.atbFill);
    this.atbBar = atb;
    this.statusEl = el('div', 'status', '');
    me.appendChild(hp); me.appendChild(atb); me.appendChild(this.statusEl);
    this.acts = el('div', 'b-acts');
    const autoWrap = el('div', 'b-auto');
    this.autoBtn = button('', () => this.toggleAuto(), 'small');
    autoWrap.appendChild(this.autoBtn);
    b.appendChild(me); b.appendChild(this.acts); b.appendChild(autoWrap);
    this.renderMe();
    this.renderAuto();
    this.renderStatus();
    this.setHint('');
  }

  renderMe() {
    const max = S.maxHp();
    if (this.hpFill) {
      this.hpFill.style.width = `${(S.hp / max) * 100}%`;
      this.hpText.textContent = `${S.hp} / ${max}`;
    }
    this.w.refreshHud();
  }

  renderAtb() {
    if (this.atbFill) {
      this.atbFill.style.width = `${this.pAtb}%`;
      this.atbBar.classList.toggle('ready', this.pAtb >= 100);
    }
    for (const e of this.enemies) if (e.alive) this.renderEnemy(e);
    if (this.pet && this.pet.alive) this.renderPet();
  }

  renderStatus() {
    if (!this.statusEl) return;
    const parts = [];
    if (this.status.zehir > 0) parts.push(`Zehir ${this.status.zehir}`);
    if (this.status.sersem > 0) parts.push(`Sersem ${this.status.sersem}`);
    if (this.status.yanma > 0) parts.push(`Yanma ${this.status.yanma}`);
    if (this.status.donma > 0) parts.push('Donmuş');
    if (this.status.karanlik > 0) parts.push(`Karanlık ${this.status.karanlik}`);
    if (this.status.tok > 0) parts.push(`Tok ${this.status.tok}`);
    if (this.status.guc > 0) parts.push(`Altın güç ${this.status.guc}`);
    if (this.status.ay > 0) parts.push(`Ay kalkanı ${this.status.ay}`);
    if (this.status.savun) parts.push('Savunmada');
    if (this.firstStrike) parts.push('Pusu hazır');
    this.statusEl.textContent = parts.join(' · ');
  }

  renderAuto() {
    const on = S.save.settings.auto;
    this.autoBtn.textContent = on ? 'Oto: AÇIK' : 'Oto: KAPALI';
    this.autoBtn.classList.toggle('auto-on', on);
  }

  setHint(text) {
    this.acts.innerHTML = '';
    if (text) this.acts.appendChild(el('div', 'hint', text));
  }

  toggleAuto() {
    S.save.settings.auto = !S.save.settings.auto;
    S.persist();
    this.renderAuto();
    this.renderPet();
    if (S.save.settings.auto && ['menu', 'target', 'items', 'skills', 'feed'].includes(this.phase)) {
      const r = this.targetResolve;
      this.targetResolve = null;
      this.removeMarkers();
      this.phase = null;
      if (r) r('auto');
      this.autoAct();
    }
  }

  // -------------------------------------------------------------- dongu
  update(dt) {
    if (this.over || this.busy) return;
    const k = (ATB_RATE * Math.min(dt, 60)) / 1000;
    this.pAtb = Math.min(100, this.pAtb + S.spd() * k * (this.status.sersem > 0 ? 0.5 : 1) * (this.opts.cold ? 0.7 : 1));
    for (const e of this.alive()) e.atb = Math.min(100, e.atb + e.spd * k * (e.st.sersem > 0 ? 0.5 : 1));
    const t = this.pet;
    if (t && t.alive) t.atb = Math.min(100, t.atb + t.spd * k);
    this.renderAtb();
    if (this.pAtb >= 100) { this.playerTurn(); return; }
    if (t && t.alive && t.atb >= 100) { this.petTurn(); return; }
    const ready = this.alive().find((e) => e.atb >= 100);
    if (ready) this.enemyTurn(ready);
  }

  checkEnd() {
    if (!this.over && this.alive().length === 0) { this.win(); return true; }
    return this.over;
  }

  // -------------------------------------------------------------- oyuncu sirasi
  async playerTurn() {
    this.busy = true;
    this.status.savun = false;
    const p = this.w.player;
    if (this.status.zehir > 0) {
      this.status.zehir--;
      const d = Math.max(1, Math.round(S.maxHp() * 0.03));
      floatText(this.px(), this.py() - 10, 'Zehir', 'info');
      this.damagePlayer(d, false, true);
      this.renderStatus();
      if (S.hp <= 0) { await this.lose(); if (this.over) return; }
      await wait(this.scene, 400);
    }
    if (this.status.yanma > 0) {
      this.status.yanma--;
      const d = Math.max(1, Math.round(S.maxHp() * 0.05));
      floatText(this.px(), this.py() - 10, 'Yanıyorsun!', 'info');
      this.damagePlayer(d, false, true);
      this.renderStatus();
      if (S.hp <= 0) { await this.lose(); if (this.over) return; }
      await playAnim(p, B('onfire'), 2);
      this.pose();
      if (this.over) return;
    }
    if (this.status.tok > 0) this.status.tok--;
    if (this.status.guc > 0) this.status.guc--;
    if (this.status.sersem > 0) this.status.sersem--;
    for (const k of Object.keys(this.cd)) if (this.cd[k] > 0) this.cd[k]--;
    if (this.status.donma > 0) {
      this.status.donma--;
      floatText(this.px(), this.py() - 10, 'Dondun! Sıra geçti', 'info');
      this.renderStatus();
      await wait(this.scene, 700);
      this.endPlayerTurn();
      return;
    }
    this.renderStatus();
    if (S.save.settings.auto) {
      this.setHint('Otomatik savaş…');
      await wait(this.scene, 180);
      if (this.over) return;
      if (S.save.settings.auto) { await this.autoAct(); return; }
    }
    this.showMenu();
  }

  endPlayerTurn() {
    this.phase = null;
    this.pAtb = 0;
    if (this.status.karanlik > 0) this.status.karanlik--;
    this.setHint('');
    this.renderAtb();
    this.renderStatus();
    if (!this.checkEnd()) this.busy = false;
  }

  // acik yetenekler (silah turune gore)
  skills() {
    const lvl = S.level(WEAPON_SKILL[this.wt]);
    return ABILITIES[this.wt].filter((a) => lvl >= a.lvl);
  }
  ready(a) { return !(this.cd[a.key] > 0); }

  tameables() {
    return this.alive().filter((e) => !e.data.boss && !e.golden && e.hp / e.maxHp < TAME.hpBelow);
  }

  showMenu() {
    this.phase = 'menu';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', 'Sıra sende!'));
    const basic = BASIC[this.wt];
    this.acts.appendChild(button(this.wt === 'kilic' ? 'Saldır' : basic.name, () => this.onAttack(), 'primary'));
    const sk = this.skills();
    const first = ABILITIES[this.wt][0];
    const skillName = WEAPON_SKILL[this.wt] === 'okculuk' ? 'Okçuluk' : 'Saldırı';
    const sb = button(sk.length ? 'Yetenek' : `${first.name} (${skillName} ${first.lvl})`, () => this.skillMenu(), 'purple');
    sb.disabled = !sk.some((a) => this.ready(a));
    if (sk.length === 1) sb.textContent = this.ready(sk[0]) ? sk[0].name : `${sk[0].name} (${this.cd[sk[0].key]})`;
    this.acts.appendChild(sb);
    const usable = BATTLE_ITEMS.filter((id) => S.countItem(id) > 0);
    const pots = S.countItem('iksir_k');
    const pb = button(usable.length > 1 || (usable.length === 1 && usable[0] !== 'iksir_k') ? 'Eşya' : `İksir (${pots})`, () => this.itemMenu(), 'red');
    pb.disabled = usable.length === 0;
    this.acts.appendChild(pb);
    if (this.tameables().length) this.acts.appendChild(button('Yem ver', () => this.onFeed(), 'green'));
    this.acts.appendChild(button('Savun', () => this.defend(), 'blue'));
    const fb = button('Kaç', () => this.flee(), 'small');
    fb.disabled = !!this.opts.boss || this.enemies.some((e) => e.golden);
    this.acts.appendChild(fb);
  }

  skillMenu() {
    const sk = this.skills();
    if (sk.length === 1) { this.useSkill(sk[0]); return; }
    this.phase = 'skills';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', 'Hangi yetenek?'));
    for (const a of sk) {
      const b = button(this.ready(a) ? a.name : `${a.name} (${this.cd[a.key]})`, () => this.useSkill(a), 'purple');
      b.title = a.desc;
      b.disabled = !this.ready(a);
      this.acts.appendChild(b);
    }
    this.acts.appendChild(button('Geri', () => this.showMenu(), 'small'));
  }

  async useSkill(a) {
    if (!this.ready(a) || !['menu', 'skills'].includes(this.phase)) return;
    if (a.aoe) { await this.doAttack(null, false, a); return; }
    const t = await this.chooseTarget();
    if (t === 'auto' || this.over) return;
    if (!t) { this.showMenu(); return; }
    await this.doAttack(t, false, a);
  }

  // savasta kullanilabilen esyalar
  itemMenu() {
    const usable = BATTLE_ITEMS.filter((id) => S.countItem(id) > 0);
    if (usable.length === 1 && usable[0] === 'iksir_k') { this.useItem('iksir_k', false); return; }
    this.phase = 'items';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', 'Ne kullanacaksın?'));
    for (const id of usable) {
      const it = ITEMS[id];
      const b = button(`${it.name} (${S.countItem(id)})`, () => this.useItem(id, false), it.bomb ? 'purple' : it.golden ? 'primary' : 'red');
      if (it.heal && !it.golden && S.hp >= S.maxHp()) b.disabled = true;
      this.acts.appendChild(b);
    }
    this.acts.appendChild(button('Geri', () => this.showMenu(), 'small'));
  }

  async useItem(id, auto) {
    if (!auto && !['menu', 'items'].includes(this.phase)) return;
    if (ITEMS[id].bomb) return this.bomb(auto);
    return this.drink(auto, id);
  }

  async bomb(auto) {
    this.phase = null;
    this.setHint('');
    if (S.removeItem('bonk_bombasi', 1) < 1) { this.showMenu(); return; }
    if (auto) this.autoActs++; else this.manualActs++;
    const p = this.w.player;
    await playAnim(p, B('punch'), 1.4);
    const alive = this.alive();
    const cx = alive.reduce((t, e) => t + e.sprite.x, 0) / alive.length;
    this.boom(cx, this.gy - 30, 1.4);
    await wait(this.scene, 120);
    for (const e of alive) {
      const dmg = Math.round((10 + 6 * this.floor) * (0.9 + Math.random() * 0.2));
      this.hitRaw(e, dmg);
    }
    S.changed();
    await wait(this.scene, 300);
    this.pose();
    this.endPlayerTurn();
  }

  boom(x, y, sc = 1.4) {
    const boom = this.scene.add.sprite(x, y, 'boom').setDepth(13).setScale(sc);
    boom.play('boom');
    boom.once('animationcomplete', () => boom.destroy());
    sfx('boom');
    this.scene.cameras.main.shake(300, 0.016);
  }

  // savunmayi gecen sabit hasar (bomba)
  hitRaw(e, dmg) {
    if (!e.alive) return;
    e.hp = Math.max(0, e.hp - dmg);
    floatText(e.sprite.x, this.topY(e) + 4, String(dmg), 'crit');
    this.renderEnemy(e);
    if (e.hp <= 0) { this.killEnemy(e); return; }
    playAnim(e.sprite, e.k('hasar'), 1).then(() => { if (e.alive && e.sprite.active) e.sprite.play(e.k('durma')); });
  }

  async onAttack() {
    if (this.phase !== 'menu') return;
    const t = await this.chooseTarget();
    if (t === 'auto' || this.over) return;
    if (!t) { this.showMenu(); return; }
    await this.doAttack(t, false);
  }

  chooseTarget(list = null, hintText = 'Hedefe dokun') {
    const alive = list || this.alive();
    if (alive.length === 1) return Promise.resolve(alive[0]);
    this.phase = 'target';
    return new Promise((resolve) => {
      this.targetResolve = resolve;
      this.acts.innerHTML = '';
      this.acts.appendChild(el('div', 'hint', hintText));
      this.acts.appendChild(button('Geri', () => { this.targetResolve = null; this.removeMarkers(); resolve(null); }, 'small'));
      for (const e of alive) {
        const pickIt = (ev) => { ev.stopPropagation(); sfx('click'); this.targetResolve = null; this.removeMarkers(); resolve(e); };
        const t = el('button', 'target', '▼');
        t.style.left = `${(e.sprite.x / 384) * 100}%`;
        t.style.top = `${((this.topY(e) - 14) / 216) * 100}%`;
        t.addEventListener('pointerdown', pickIt);
        $('#bars').appendChild(t);
        // yaratigin kendisi de dokunulabilir: govdesini kaplayan gorunmez alan (biraz genis)
        const bd = e.sprite.getBounds();
        const hit = el('button', 'target target-hit');
        hit.style.left = `${((bd.x - 4) / 384) * 100}%`;
        hit.style.top = `${((bd.y - 4) / 216) * 100}%`;
        hit.style.width = `${((bd.width + 8) / 384) * 100}%`;
        hit.style.height = `${((bd.height + 8) / 216) * 100}%`;
        hit.addEventListener('pointerdown', pickIt);
        $('#bars').prepend(hit);
      }
    });
  }

  removeMarkers() {
    for (const t of document.querySelectorAll('#bars .target')) t.remove();
  }

  // savas biterken bekleyen hedef secimini iptal et
  clearTargets() {
    this.removeMarkers();
    const r = this.targetResolve;
    this.targetResolve = null;
    if (r) r('auto');
  }

  async autoAct() {
    this.phase = null;
    this.setHint('Otomatik savaş…');
    if (S.hp < S.maxHp() * 0.35) {
      // eksik cani kapatan en kucuk iyilestirici; yoksa eldeki en guclusu
      const have = HEALS.filter((id) => S.countItem(id) > 0);
      const need = 1 - S.hp / S.maxHp();
      const heal = have.find((id) => ITEMS[id].heal >= need - 0.15) || have[have.length - 1];
      if (heal) return this.drink(true, heal);
    }
    const alive = this.alive();
    const sk = this.skills().filter((a) => this.ready(a));
    const aoe = sk.find((a) => a.aoe);
    if (alive.length >= 2 && aoe) return this.doAttack(null, true, aoe);
    const single = sk.find((a) => !a.aoe && a.key !== 'patlat');
    const target = alive.reduce((a, b) => (a.hp <= b.hp ? a : b));
    if (single && target.hp > S.atk() * 1.2) return this.doAttack(target, true, single);
    return this.doAttack(target, true);
  }

  // Saldiri ya da yetenek. target null ise alan yetenegi (aoe).
  async doAttack(target, auto, ab = null) {
    this.phase = null;
    this.setHint('');
    let mult = ab ? ab.mult : BASIC[this.wt].mult;
    const hits = ab ? (ab.hits || 1) : BASIC[this.wt].hits;
    let grade = null;
    if (auto) this.autoActs++;
    else {
      this.manualActs++;
      grade = await timingBar(ab ? `${ab.name.toLocaleUpperCase('tr')}!` : 'VUR!');
      mult *= GRADE[grade].mult;
    }
    if (ab) this.cd[ab.key] = ab.cd;
    if (this.firstStrike) { mult *= 1.5; this.firstStrike = false; }
    const p = this.w.player;
    const wt = this.wt;
    let targets = target ? [target] : this.alive();
    if (ab && ab.key === 'coklu') targets = targets.slice(0, 3);
    const poisonedBefore = targets.some((e) => e.st.zehir > 0);
    // animasyon: kilic/yumruk one atilir, yay yerinde ok atar
    const animKey = ab && ab.key === 'doner' ? 'spin' : WEAPON_ANIM[wt];
    if (wt === 'yay') {
      await playAnim(p, B('bowshot'), 1.8);
      await Promise.all(targets.map((e) => this.arrow(e, ab && ab.key === 'atesli')));
    } else {
      const lunge = this.lunge(p, 34, -8, 200);
      this.swing = playAnim(p, B(animKey), animKey === 'stab' ? 2.3 : animKey === 'spin' ? 1 : 1.4);
      await wait(this.scene, animKey === 'stab' ? 760 / 2.3 : 260);
      await lunge;
    }
    for (let h = 0; h < hits; h++) {
      for (const e of targets) {
        if (!e.alive) continue;
        const crit = Math.random() < S.crit();
        this.hitEnemy(e, S.atk() * this.atkMult(), mult, crit, h === 0 && e === targets[0] ? grade : null, ab);
      }
      if (hits > 1 && h < hits - 1) {
        await wait(this.scene, 180);
        if (wt !== 'yay') playAnim(p, B(WEAPON_ANIM[wt]), 2.4);
      }
    }
    // Zehirli Yagmur: zehirli hedefe Coklu Ok -> zehir herkese yayilir
    if (ab && ab.key === 'coklu' && poisonedBefore) {
      this.combo('zehirli_yagmur');
      for (const e of this.alive()) { e.st.zehir = Math.max(e.st.zehir, 5); this.renderEnemy(e); }
    }
    if (wt !== 'yay') { await this.swing; await this.back(p); }
    if (S.hp <= 0) { await this.lose(); if (this.over) return; }
    this.pose();
    this.endPlayerTurn();
  }

  // ok: oyuncudan hedefe ucan kucuk cubuk
  arrow(e, fire) {
    const a = this.scene.add.rectangle(BPOS.x + 30, GROUND_Y - 24, 10, 2, fire ? 0xff9a3a : 0xe8dcc0).setDepth(21);
    const ty = this.topY(e) + e.meta.bodyH * e.scale * 0.45;
    a.setRotation(Math.atan2(ty - a.y, e.sprite.x - a.x));
    return new Promise((res) => this.scene.tweens.add({ targets: a, x: e.sprite.x, y: ty, duration: 180, onComplete: () => { a.destroy(); res(); } }));
  }

  combo(key) {
    const c = COMBOS[key];
    const fresh = !S.save.combos[key];
    S.save.combos[key] = (S.save.combos[key] || 0) + 1;
    banner(`KOMBO: ${c.name}!`, fresh ? 'Kombo Defteri\'ne yazıldı' : c.result, 1500, 'gold');
    sfx('perfect');
    if (fresh) feed(`<span style="color:#ffd04d">★ Yeni kombo keşfettin: ${c.name}! (${c.how})</span>`, 'gold');
  }

  async drink(auto, id = 'iksir_k') {
    this.phase = null;
    this.setHint('');
    if (S.removeItem(id, 1) < 1) { this.showMenu(); return; }
    if (auto) this.autoActs++; else this.manualActs++;
    const it = ITEMS[id];
    const p = this.w.player;
    if (it.anim === 'goldenapple') await playAnim(p, B('goldenapple'), 1.6);
    else if (it.anim === 'eat') await playAnim(p, B('eat'), 1.8);
    else await playAnim(p, B('drinkpotion'), 3.2);
    if (it.ward) {
      this.status.ay = it.ward;
      sfx('levelup');
      floatText(this.px(), this.py() - 14, 'Ay kalkanı!', 'perfect');
      this.pose(); this.renderMe(); this.renderStatus(); S.changed(); this.endPlayerTurn();
      return;
    }
    const heal = Math.round(S.maxHp() * it.heal);
    S.hp = Math.min(S.maxHp(), S.hp + heal);
    sfx('heal');
    floatText(this.px(), this.py(), `+${heal}`, 'heal');
    // yemek yiyince guclenir: normal yemek 3 tur +%10 saldiri, Altin Elma 5 tur +%30 saldiri ve savunma
    if (it.golden) { this.status.guc = 5; sfx('levelup'); floatText(this.px(), this.py() - 14, 'Altın güç!', 'perfect'); }
    else if (it.strong) { this.status.guc = Math.max(this.status.guc, it.strong); floatText(this.px(), this.py() - 14, 'Balık gücü: saldırı +%30', 'info'); }
    else if (it.food) { this.status.tok = 3; floatText(this.px(), this.py() - 14, 'Tok: saldırı +%10', 'info'); }
    this.pose();
    this.renderMe();
    S.changed();
    this.endPlayerTurn();
  }

  async defend() {
    if (this.phase !== 'menu') return;
    this.phase = null;
    this.setHint('');
    this.manualActs++;
    this.status.savun = true;
    this.defXp += 2 * this.floor;
    floatText(this.px(), this.py() - 10, 'Savunma ×2', 'info');
    sfx('click');
    this.renderStatus();
    await wait(this.scene, 450);
    this.endPlayerTurn();
    this.status.savun = true;
    this.renderStatus();
  }

  async flee() {
    if (this.phase !== 'menu') return;
    this.phase = null;
    this.setHint('');
    this.manualActs++;
    const p = this.w.player;
    if (Math.random() < 0.7) {
      sfx('dodge');
      this.over = true;
      this.busy = true;
      // savastan ninja kosusuyla kacar
      p.setFlipX(true);
      p.play(B('ninjarun'));
      await new Promise((res) => this.scene.tweens.add({ targets: p, x: -60, y: BPOS.y + 10, duration: 520, onComplete: res }));
      this.savePetHp();
      this.cleanup(true);
      this.resolve('flee');
    } else {
      floatText(this.px(), this.py() - 10, 'Kaçamadın!', 'info');
      sfx('weak');
      await wait(this.scene, 600);
      this.endPlayerTurn();
    }
  }

  // -------------------------------------------------------------- evcillestirme (0.4)
  foodFor(e) {
    const z = ZONE_OF_KEY[e.key];
    if (!z) return null;
    const [basic, special] = FOODS[z];
    if ((e.rarity === 'siradan' || (z === 'su' && e.rarity === 'nadir')) && S.countItem(basic) > 0) return basic;
    if (S.countItem(special) > 0) return special;
    return null;
  }

  async onFeed() {
    if (this.phase !== 'menu') return;
    const list = this.tameables();
    const e = await this.chooseTarget(list, 'Kime yem vereceksin?');
    if (e === 'auto' || this.over) return;
    if (!e) { this.showMenu(); return; }
    const z = ZONE_OF_KEY[e.key];
    const need = TAME.bagReq[e.data.rarity] + TAME.stageBag[e.stage];
    const food = this.foodFor(e);
    let why = null;
    if (!z) why = 'Bu Glemon evcilleşmez.';
    else if (S.level('bag') < need) why = `${e.name} için Glemon Bağı ${need} gerekli (sende ${S.level('bag')}).`;
    else if (!food) {
      const [basic, special] = FOODS[z];
      why = e.rarity === 'siradan' ? `Yem yok! ${ITEMS[basic].name} ya da ${ITEMS[special].name} gerekli.` : `${e.name} sadece özel yem yer: ${ITEMS[special].name}.`;
    } else if (S.save.pets.length >= S.ahirSize()) why = `Ahırın dolu (${S.ahirSize()} yer). İnşa seviyen artınca büyür.`;
    if (why) { feed(why); sfx('weak'); this.showMenu(); return; }
    await this.tame(e, food);
  }

  async tame(e, food) {
    this.phase = null;
    this.setHint('');
    this.manualActs++;
    S.removeItem(food, 1);
    const p = this.w.player;
    // yemi atar: kucuk bir kutu yaya cizerek ucar
    const crumb = this.scene.add.rectangle(BPOS.x + 30, GROUND_Y - 30, 4, 4, 0xe4b678).setDepth(21);
    playAnim(p, B('punch'), 1.4);
    await new Promise((res) => this.scene.tweens.add({ targets: crumb, x: e.sprite.x, y: this.topY(e) + 10, duration: 420, ease: 'Sine.easeOut', onComplete: res }));
    crumb.destroy();
    floatText(e.sprite.x, this.topY(e), `${ITEMS[food].name}!`, 'info');
    await playAnim(e.sprite, e.k('saldiri'), 0.8);
    let ch = TAME.chance[e.stage] * (e.sleeping ? TAME.sleepingBonus : 1) * (1 + S.level('bag') * 0.004) * S.perk('yem_ustasi', 1.15, 1);
    if (ITEMS[food].special && e.rarity === 'siradan') ch *= 1.3;
    const ok = Math.random() < ch;
    if (!ok) {
      floatText(e.sprite.x, this.topY(e) - 12, 'Yemi yedi ama gelmedi…', 'weak');
      sfx('weak');
      e.sprite.play(e.k('durma'));
      this.pose();
      await wait(this.scene, 500);
      this.endPlayerTurn();
      return;
    }
    // evcillesti: kalpler, Glemon savastan cikip Ahir'a gider
    const lvl = Math.min(S.petCap(), Math.max(1, this.floor + e.stage * 5));
    const pet = S.addPet(e.key, e.stage, e.shiny, lvl);
    e.alive = false;
    if (e.ui) { e.ui.wrap.remove(); e.ui = null; }
    sfx('levelup');
    for (let i = 0; i < 5; i++) {
      const h = this.scene.add.text(e.sprite.x + (Math.random() - 0.5) * 20, this.topY(e) + 6, '♥', { fontFamily: 'Nunito', fontSize: '10px', color: '#ff7a9a' }).setDepth(22);
      this.scene.tweens.add({ targets: h, y: h.y - 22, alpha: 0, duration: 900, delay: i * 120, onComplete: () => h.destroy() });
    }
    this.scene.tweens.add({ targets: [e.sprite, e.shadow], alpha: 0, duration: 700, delay: 500, onComplete: () => { e.sprite.destroy(); e.shadow.destroy(); } });
    const xp = 60 * Math.pow(this.floor, 1.1) * (RMULT[e.rarity] || 1) * (1 + e.stage);
    this.bagXp += xp;
    S.save.stats.tamed = (S.save.stats.tamed || 0) + 1;
    S.logDrop(null, e.name, { note: 'evcilleşti!' });
    banner(`${e.name} evcilleşti!`, pet && S.save.pet === pet.id ? 'Artık yanında savaşacak' : 'Ahırına gitti', 2200, 'gold');
    feed(`<span style="color:#ff9ab4">♥ ${e.name} evcilleşti! Ahırında seni bekliyor (Sv. ${lvl}).</span>`, 'gold');
    S.changed();
    this.pose();
    await wait(this.scene, 900);
    this.endPlayerTurn();
  }

  // -------------------------------------------------------------- hasar
  giveEnemyStatus(e, [st, turns]) {
    e.st[st] = Math.max(e.st[st], turns);
    floatText(e.sprite.x, this.topY(e) - 14, STATUS_NAMES[st] + '!', 'info');
    this.renderEnemy(e);
  }

  hitEnemy(e, atk, mult, crit, grade, ab = null) {
    if (!e.alive) return;
    const top = this.topY(e);
    if (this.status.karanlik > 0 && Math.random() < 0.25) {
      floatText(e.sprite.x, top + 4, 'Iska!', 'weak');
      return;
    }
    let m = mult * (crit ? 1.5 : 1);
    // tur ustaligi: cok yendigin ture daha sert vurursun
    m *= 1 + masteryOf((S.save.stats.glemons || {})[e.key] || 0).bonus;
    // ucan Glemonlar: kilic ve yumruk yari hasar, yay tam
    if (e.fly && this.wt !== 'yay') {
      m *= 0.5;
      if (!this.flyTold) { this.flyTold = true; floatText(e.sprite.x, top - 20, 'Uçuyor! Yay daha iyi', 'weak'); }
    }
    // Buz Kirici: donmus hedefe kilic
    if (this.wt === 'kilic' && e.st.donma > 0) { m *= 3; e.st.donma = 0; this.combo('buz_kirici'); }
    // Alev Patlamasi: yanan hedefe Patlat -> butun dusmanlara patlama
    if (ab && ab.key === 'patlat' && e.st.yanma > 0) {
      e.st.yanma = 0;
      this.combo('alev_patlamasi');
      this.boom(e.sprite.x, this.gy - 26, 1.6);
      for (const o of this.alive()) if (o !== e) this.applyDamage(o, calcDamage(atk, m * 0.8, this.eDef(o)), true);
    }
    const def = ab && ab.pierce ? 0 : this.eDef(e);
    const dmg = calcDamage(atk, m, def);
    if (grade) floatText(e.sprite.x, top - 8, GRADE[grade].text, GRADE[grade].cls);
    if (crit) floatText(e.sprite.x + 14, top - 2, 'Kritik!', 'perfect');
    sfx(crit ? 'crit' : 'hit');
    if (grade && GRADE[grade].sfx) sfx(GRADE[grade].sfx);
    if ((crit || grade === 'mukemmel') && S.save.settings.shake !== false) this.scene.cameras.main.shake(110, 0.008);
    const sl = this.scene.add.image(e.sprite.x, top + e.meta.bodyH * e.scale * 0.5, 'slash').setDepth(12).setRotation(Math.random() * 1.2 - 0.6);
    this.burst(e.sprite.x, top + e.meta.bodyH * e.scale * 0.5, crit || grade === 'mukemmel' ? 7 : 4);
    this.dust(e.sprite.x, this.gy);
    this.scene.tweens.add({ targets: sl, alpha: 0, scale: 1.4, duration: 260, onComplete: () => sl.destroy() });
    this.applyDamage(e, dmg, crit || grade === 'mukemmel');
    if (e.alive && ab && ab.status) this.giveEnemyStatus(e, ab.status);
    // 0.8: bazi silahlar vurunca durum verir (Buzul Kilici dondurur, Kor Kilici yakar)
    const wpn = S.save.equip.silah && ITEMS[S.save.equip.silah];
    if (e.alive && wpn && wpn.onHit && Math.random() < wpn.onHit[1]) this.giveEnemyStatus(e, [wpn.onHit[0], wpn.onHit[0] === 'donma' ? 1 : 3]);
    // dikenli Glemon vuranin canini acitir
    if (e.st.reflect > 0) {
      const back = Math.max(1, Math.round(dmg * 0.3));
      floatText(this.px(), this.py() - 18, 'Diken!', 'warn');
      this.damagePlayer(back, false);
    }
  }

  applyDamage(e, dmg, big) {
    if (!e.alive) return;
    // 0.9 gizli basarim: patronu ya da ara patronu tek vurusta bitirmek
    if ((e.data.boss || e.golden) && e.hp >= e.maxHp && dmg >= e.hp) S.save.flags.tek_vurus = true;
    e.hp = Math.max(0, e.hp - dmg);
    floatText(e.sprite.x, this.topY(e) + 4, String(dmg), big ? 'crit' : 'dmg');
    this.renderEnemy(e);
    if (e.hp <= 0) { this.killEnemy(e); return; }
    playAnim(e.sprite, e.k('hasar'), 1).then(() => { if (e.alive && e.sprite.active) e.sprite.play(e.k('durma')); });
  }

  killEnemy(e) {
    e.alive = false;
    e.sprite.play(e.k('hasar'));
    this.scene.tweens.add({ targets: [e.sprite], alpha: 0, y: this.gy - 6, duration: 500, delay: 250, onComplete: () => e.sprite.destroy() });
    this.scene.tweens.add({ targets: [e.shadow], alpha: 0, duration: 500, delay: 250, onComplete: () => e.shadow.destroy() });
    if (e.ui) { e.ui.wrap.remove(); e.ui = null; }
    // patron dusunce cagirdiklari da cekilir (odulsuz)
    if (e.data.boss) {
      for (const o of this.alive()) {
        o.alive = false;
        if (o.ui) { o.ui.wrap.remove(); o.ui = null; }
        floatText(o.sprite.x, this.topY(o), 'Kaçtı!', 'info');
        this.scene.tweens.add({ targets: [o.sprite, o.shadow], alpha: 0, y: '+=12', duration: 600, onComplete: () => { o.sprite.destroy(); o.shadow.destroy(); } });
      }
    }
    // oduller. Patronun cagirdiklari sonsuza kadar kasilmasin: az XP, altin ve esya yok
    if (e.summoned) {
      this.killXp += 2 * Math.pow(this.floor, 1.2);
      S.save.stats.kills++;
      if (S.run) S.run.kills++;
      return;
    }
    const rm = RMULT[e.rarity] || 1;
    let xp = 8 * Math.pow(this.floor, 1.2) * rm * (1 + 0.6 * e.stage);
    if (e.shiny) xp *= 2;
    if (e.golden) xp *= 4;
    this.killXp += xp;
    let gold = Math.round(this.floor * (2 + Math.random() * 2) * Math.min(rm, 3) * (e.data.goldMult || 1));
    if (e.shiny) gold *= 3;
    if (e.golden) gold *= 3;
    if (e.data.boss) gold = 150 * (ZONES.indexOf(this.zone) + 1) + Math.round(Math.random() * 50);
    if (S.run && S.run.goldX) gold = Math.round(gold * S.run.goldX); // 0.9 Altin Gunu
    S.addGold(gold);
    this.gold += gold;
    const st = S.save.stats;
    st.kills++;
    const mBefore = masteryOf(st.glemons[e.key] || 0).lvl;
    st.glemons[e.key] = (st.glemons[e.key] || 0) + 1;
    const mNow = masteryOf(st.glemons[e.key]);
    if (!e.data.boss && mNow.lvl > mBefore) {
      banner(`${e.data.name} ustalığı ${'★'.repeat(mNow.lvl)}`, `Bu türe hasarın +%${Math.round(mNow.bonus * 100)}`, 2200, 'gold');
      feed(`<span style="color:#ffd04d">★ ${e.data.name} ustalığı ${mNow.lvl}. kademe: bu türe hasarın +%${Math.round(mNow.bonus * 100)}.</span>`, 'gold');
      sfx('levelup');
    }
    if (S.run) S.run.kills++;
    if (e.golden) st.golden = (st.golden || 0) + 1;
    if (e.data.boss) { st.bossKills++; this.luckXp += 250 * (ZONES.indexOf(this.zone) + 1); }
    if (e.shiny) {
      st.shiny++;
      S.logDrop(null, e.name, { note: 'yenildi (çok nadir parlak!)' });
      feed(`<span style="color:#ffd04d">✦ ${e.name} yendin! (parlak Glemon)</span>`, 'gold');
      this.luckXp += 300;
    }
    const manual = this.manualActs >= this.autoActs;
    for (const [id, ch] of e.data.drops) {
      let c = ch * (manual ? 1.1 : 1) * (e.sleeping ? 1.5 : 1) * (e.golden ? 3 : 1) * (e.shiny ? 2 : 1) * S.dropMult() * this.luckBonus * (1 + 0.3 * e.stage);
      if (ch >= 1) c = 1;
      if (Math.random() < Math.min(1, c)) {
        this.w.giveDrop(id, 1, e.from);
        if (ITEMS[id].rarity !== 'siradan' && ch < 1) this.luckXp += 20 * Math.pow(this.floor, 0.8) * (RMULT[ITEMS[id].rarity] || 1);
      }
    }
  }

  damagePlayer(d, anim = true, dot = false) {
    // Ay Iksiri: sonraki saldirilardan hasar yok (zehir ve yanma kalkani harcamaz)
    if (this.status.ay > 0 && d > 0 && !dot) {
      this.status.ay--;
      floatText(this.px(), this.py(), 'Ay kalkanı!', 'good');
      this.renderStatus();
      return;
    }
    if (S.has('demir_deri')) d = Math.max(1, Math.round(d * 0.9));
    S.hp = Math.max(0, S.hp - d);
    const p = this.w.player;
    floatText(this.px(), this.py(), `-${d}`, 'hurt');
    sfx('hurt');
    this.renderMe();
    if (anim && S.hp > 0) {
      playAnim(p, B('hurt'), 3).then(() => { if (!this.over || S.hp > 0) this.pose(); });
    }
  }

  // -------------------------------------------------------------- dusman sirasi
  async enemyTurn(e) {
    this.busy = true;
    e.atb = 0;
    e.acts++;
    // durumlar: zehir ve yanma acitir, donmus Glemon sirasini kaybeder
    if (e.st.shell > 0) e.st.shell--;
    if (e.st.reflect > 0) e.st.reflect--;
    if (e.st.sersem > 0) e.st.sersem--;
    for (const [k, pct, txt] of [['zehir', 0.03, 'Zehir'], ['yanma', 0.05, 'Yanıyor']]) {
      if (e.st[k] > 0 && e.alive) {
        e.st[k]--;
        floatText(e.sprite.x, this.topY(e) - 12, txt, 'info');
        this.applyDamage(e, Math.max(1, Math.round(e.maxHp * pct)), false);
        await wait(this.scene, 250);
      }
    }
    this.renderEnemy(e);
    if (!e.alive) { this.endEnemyTurn(); return; }
    if (e.st.donma > 0) {
      e.st.donma--;
      floatText(e.sprite.x, this.topY(e) - 12, 'Donmuş!', 'info');
      await wait(this.scene, 500);
      this.renderEnemy(e);
      this.endEnemyTurn();
      return;
    }
    const d = e.data;
    let act = { mult: 1 };
    if (d.boss) {
      const step = d.pattern[(e.acts - 1) % d.pattern.length];
      if (step !== 'normal') act = { ...d.specials[step] };
    } else if (d.special && e.acts % d.every === 0) {
      act = { ...d.special };
    }
    if (act.heal) {
      const allies = this.alive();
      const low = allies.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
      if (low.hp / low.maxHp < 0.85) { await this.enemyHeal(e, low, act); this.endEnemyTurn(); return; }
      act = { mult: 1 };
    }
    if (act.summon) {
      if (this.alive().length < 3) { await this.summon(e, act); this.endEnemyTurn(); return; }
      act = { mult: 1 };
    }
    if (act.shell || act.reflect) {
      floatText(e.sprite.x, this.topY(e) - 12, act.name, 'info');
      await playAnim(e.sprite, e.k('saldiri'), 1);
      e.sprite.play(e.k('durma'));
      if (act.shell) e.st.shell = act.shell + 1;
      if (act.reflect) e.st.reflect = act.reflect + 1;
      sfx('warn');
      this.renderEnemy(e);
      this.endEnemyTurn();
      return;
    }
    const p = this.w.player;
    const t = this.pet;
    // hedef: yanindaki Glemon bazen (ya da kabuguna cekildiyse hep) saldiriyi uzerine alir
    const onPet = !act.aoe && t && t.alive && (t.taunt > 0 || Math.random() < 0.3);
    let dodged = false;
    if (act.telegraph) {
      const top = this.topY(e);
      floatText(e.sprite.x, top - 2, '!', 'warn');
      if (act.name) floatText(e.sprite.x, top - 20, act.name, 'info');
      sfx('warn');
      e.sprite.setTintFill(0xffffff);
      this.scene.time.delayedCall(90, () => { if (e.sprite.active) { e.sprite.clearTint(); if (e.golden) e.sprite.setTint(0xffd86a); } });
      if (!S.save.settings.auto && !onPet) {
        // sure: siradan 0,9 sn, nadir/epik 0,75 sn, patron 0,6 sn (bazen 2 dugme)
        const ms = (d.boss ? 600 : e.rarity === 'siradan' ? 900 : 750) * (1 + (S.dodgeBonus ? S.dodgeBonus() : 0));
        dodged = await dodgePrompt(ms, d.boss && Math.random() < 0.4 ? 2 : 1);
      } else {
        await wait(this.scene, 550);
        if (!onPet && S.has('refleks') && Math.random() < 0.25) dodged = true;
      }
    }
    if (this.over) return;
    const missed = e.st.karanlik > 0 && Math.random() < 0.25;
    if (e.st.karanlik > 0) e.st.karanlik--;
    // Glemon kameraya (oyuncuya) ya da yanindaki Glemon'a dogru atilir
    e.sprite.setDepth(15);
    e.sprite.play(e.k('yurume'));
    const tx = onPet ? PET_POS.x + 30 : 150;
    const ty = onPet ? PET_POS.y + 6 : BPOS.y - 14;
    await new Promise((res) => this.scene.tweens.add({
      targets: e.sprite, x: tx, y: ty, scale: e.scale * (onPet ? 1.1 : 1.4), duration: 260, ease: 'Quad.easeIn', onComplete: res,
    }));
    const atkAnim = playAnim(e.sprite, e.k('saldiri'), 1.6);
    await wait(this.scene, 300 / 1.6);
    if (missed) {
      floatText(onPet ? t.sprite.x : this.px(), onPet ? this.petTop() : this.py() - 10, 'Iskaladı!', 'good');
    } else if (onPet) {
      const tm = typeMult(e.type, t.data.type);
      const dmg = calcDamage(e.atk * tm, act.mult || 1, t.def * (t.shell > 0 ? 2 : 1));
      this.damagePet(dmg);
      if (t.reflect > 0 && e.alive) this.applyDamage(e, Math.max(1, Math.round(dmg * 0.5)), false);
    } else if (dodged) {
      sfx('dodge');
      floatText(this.px(), this.py() - 10, dodged === 'kusursuz' ? 'Kusursuz kaçış!' : 'Kaçındın!', dodged === 'kusursuz' ? 'perfect' : 'good');
      // kusursuz kacis: kucuk bir karsi saldiri
      if (dodged === 'kusursuz' && e.alive) {
        const back = calcDamage(S.atk() * this.atkMult(), 0.5 * (S.counterMult ? S.counterMult() : 1), this.eDef(e));
        this.scene.time.delayedCall(350, () => { if (!this.over && e.alive) { floatText(e.sprite.x, this.topY(e) - 22, 'Karşı darbe!', 'perfect'); this.applyDamage(e, back, true); } });
      }
      this.defXp += 3 * this.floor;
      // kacinma animasyonlarindan rastgele biri
      const dk = pick(ANIM_POOLS.kacinma);
      p.play({ key: B(dk), timeScale: dk === 'shake' ? 1.4 : 1.3 });
      this.scene.tweens.add({ targets: p, x: BPOS.x - 18, y: BPOS.y + (dk === 'shake' ? 0 : -14), duration: 200, yoyo: true, ease: 'Sine.easeOut', onComplete: () => { p.x = BPOS.x; p.y = BPOS.y; } });
      this.scene.time.delayedCall(900, () => { if (!this.over) this.pose(); });
    } else {
      const def = S.def() * this.defMult();
      const dmg = calcDamage(e.atk, act.mult || 1, def);
      this.damagePlayer(dmg, true);
      this.defXp += dmg * 0.6;
      if ((act.mult || 1) >= 2) this.scene.cameras.main.shake(180, 0.012);
      const immune = act.status && ((act.status[0] === 'yanma' && S.fireproof()) || (act.status[0] === 'karanlik' && S.darkproof()));
      if (immune) floatText(this.px(), this.py() - 20, 'İşlemedi!', 'good');
      if (act.status && S.hp > 0 && !immune) {
        const [st, turns0] = act.status;
        const turns = st === 'donma' ? 1 : turns0; // oyuncu en fazla 1 tur donar
        this.status[st] = Math.max(this.status[st], turns);
        floatText(this.px(), this.py() - 20, { zehir: 'Zehirlendin!', sersem: 'Sersemledin!', yanma: 'Yanıyorsun!', donma: 'Dondun!', karanlik: 'Gözün göremiyor!' }[st], 'info');
        if (st === 'yanma') this.scene.time.delayedCall(500, () => { if (!this.over && S.hp > 0) playAnim(p, B('onfire'), 2).then(() => { if (!this.over) this.pose(); }); });
        this.renderStatus();
      }
      // alan saldirisi yanindaki Glemon'a da vurur
      if (act.aoe && t && t.alive) this.damagePet(calcDamage(e.atk * typeMult(e.type, t.data.type), (act.mult || 1) * 0.7, t.def));
    }
    await atkAnim;
    if (S.hp <= 0) { await this.lose(); if (this.over) return; }
    if (e.sprite.active && e.alive) {
      e.sprite.play(e.k('yurume'));
      await new Promise((res) => this.scene.tweens.add({
        targets: e.sprite, x: e.homeX, y: this.gy, scale: e.scale, duration: 300, ease: 'Quad.easeOut', onComplete: res,
      }));
      e.sprite.setDepth(8);
      e.sprite.play(e.k('durma'));
    }
    this.endEnemyTurn();
  }

  endEnemyTurn() {
    this.renderAtb();
    if (!this.checkEnd()) this.busy = false;
  }

  async enemyHeal(e, target, act) {
    floatText(e.sprite.x, this.topY(e) - 10, act.name, 'info');
    await playAnim(e.sprite, e.k('saldiri'), 1);
    e.sprite.play(e.k('durma'));
    const heal = Math.round(target.maxHp * act.heal);
    target.hp = Math.min(target.maxHp, target.hp + heal);
    floatText(target.sprite.x, this.topY(target), `+${heal}`, 'heal');
    sfx('heal');
    this.renderEnemy(target);
  }

  async summon(e, act) {
    floatText(e.sprite.x, this.topY(e) - 10, act.name, 'info');
    sfx('roar');
    this.scene.cameras.main.shake(300, 0.01);
    await playAnim(e.sprite, e.k('saldiri'), 0.8);
    e.sprite.play(e.k('durma'));
    const used = new Set(this.alive().map((x) => x.homeX));
    for (const x of this.arena ? [190, 344] : [206, 356]) {
      if (this.alive().length >= 3) break;
      if (used.has(x)) continue;
      const n = this.addEnemy({ key: act.summon }, x);
      n.atb = 0;
      n.summoned = true;
      n.sprite.y = this.gy + 30;
      this.scene.tweens.add({ targets: n.sprite, y: this.gy, duration: 500, ease: 'Back.easeOut' });
      this.makeBar(n);
    }
  }

  // -------------------------------------------------------------- bitis
  savePetHp() {
    const t = this.pet;
    if (t && S.run) { S.run.petHp = t.hp; if (!t.alive) S.run.petDown = true; }
  }

  async win() {
    this.over = true;
    this.busy = true;
    this.phase = null;
    this.savePetHp();
    await wait(this.scene, 350);
    sfx('win');
    const manual = this.manualActs > 0 && this.manualActs >= this.autoActs;
    const xm = (manual ? 1.2 : 1) * ((S.run && S.run.xpX) || 1); // 0.9 Devler Gunu: 2 kat
    const skill = WEAPON_SKILL[this.wt];
    const gains = { [skill]: this.killXp * 0.7 * xm, can: this.killXp * 0.3 * xm, savunma: this.defXp, sans: this.luckXp };
    const t = this.pet;
    let petMsg = '';
    let evo = null;
    if (t && t.fought) {
      this.bagXp += this.killXp * 0.35 * xm;
      const res = S.petAddXp(t.p, this.killXp * 0.6 * xm);
      if (res.up) petMsg = ` · ${t.name} Sv.${res.up}!`;
      if (res.evolved > 0) evo = { name: GLEMONS[t.p.key].name, stage: res.evolved };
    }
    gains.bag = this.bagXp;
    const ups = S.addXp(gains);
    S.save.stats.battles++;
    // 0.9 gizli basarim: canin %5 ya da altindayken kazanmak
    if (S.hp > 0 && S.hp <= S.maxHp() * 0.05) S.save.flags.kil_payi = true;
    const hatched = S.tickEggs();
    const r = (x) => Math.round(x);
    const skName = skill === 'okculuk' ? 'Okçuluk' : 'Saldırı';
    const extra = [];
    if (gains.bag >= 1) extra.push(`+${r(gains.bag)} Bağ`);
    if (gains.sans >= 1) extra.push(`+${r(gains.sans)} Şans`);
    feed(`Zafer! +${r(gains[skill])} ${skName}, +${r(gains.can)} Can, +${r(gains.savunma)} Savunma${extra.length ? ', ' + extra.join(', ') : ''} XP${manual ? ' <span style="color:#ffd04d">(manuel +%20)</span>' : ''}${petMsg}`);
    if (this.gold > 0) { feed(`<img class="ico-inline" src="${this.w.coinUrl}">+${this.gold} ${CURRENCY}`); sfx('coin'); }
    this.cleanup(false);
    await this.w.exitBattleView();
    if (evo) await this.w.petEvolved(evo);
    for (const h of hatched) await this.w.eggHatched(h);
    // seviye atladiysa levelup, atlamadiysa rastgele bir sevinme animasyonu
    if (ups.length) for (const up of ups) await this.w.levelUp(up);
    else { await this.w.playPool('sevinc', 1300, 1.2); this.w.idle(); }
    S.changed();
    this.resolve('win');
  }

  async lose() {
    if (this.over && this.lost) return;
    this.over = true;
    this.lost = true;
    this.busy = true;
    this.phase = null;
    this.clearTargets();
    const p = this.w.player;
    // Can Tilsimi takiliysa bir kez ayaga kaldirir (totem)
    if (S.save.equip.tilsim && ITEMS[S.save.equip.tilsim].revive) {
      const it = ITEMS[S.save.equip.tilsim];
      S.save.equip.tilsim = null;
      sfx('rare');
      feed(`<span style="color:#c08cff">${it.name} kırıldı ve seni ayağa kaldırdı!</span>`, 'epic');
      await playAnim(p, B('totem'), 1.2);
      S.hp = Math.max(1, Math.round(S.maxHp() * it.revive));
      floatText(this.px(), this.py(), `+${S.hp}`, 'heal');
      S.changed();
      this.renderMe();
      this.over = false;
      this.lost = false;
      this.pose();
      return;
    }
    sfx('death');
    // olum animasyonlarindan rastgele biri
    await playAnim(p, B(pick(ANIM_POOLS.olum)), 1);
    this.lostDone = true;
    this.cleanup(true);
    this.resolve('lose');
  }

  cleanup(removeEnemies) {
    this.clearTargets();
    $('#battle').classList.add('hidden');
    $('#battle').innerHTML = '';
    $('#actions').classList.remove('hidden');
    $('#bars').innerHTML = '';
    $('#overlay').className = '';
    $('#overlay').innerHTML = '';
    if (this.pet) {
      const t = this.pet;
      if (t.sprite.active) t.sprite.destroy();
      if (t.shadow.active) t.shadow.destroy();
      t.ui = null;
    }
    if (removeEnemies) {
      for (const e of this.enemies) {
        if (e.sprite.active) e.sprite.destroy();
        if (e.shadow.active) e.shadow.destroy();
      }
    }
  }

  destroy() { this.over = true; this.cleanup(true); }
}
