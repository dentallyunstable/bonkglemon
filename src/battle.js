// Savas: ATB (bekleme cubugu) sistemi, manuel / otomatik mod,
// zamanlama cubugu, kacinma, durumlar (Zehir, Sersem), odul ve dusurmeler.
import { GLEMONS, GROUND_Y, RARITY, ITEMS, floorMult, ANIM_POOLS, CURRENCY } from './data.js';
import { S } from './state.js';
import { ARENA } from './art.js';
import { $, el, button, floatText, feed, timingBar, dodgePrompt } from './ui.js';
import { sfx } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';

const RMULT = { siradan: 1, nadir: 1.6, epik: 2.5, efsanevi: 15 };
const ATB_RATE = 1.0; // Hiz 100 -> cubuk 1 saniyede dolar
const GRADE = {
  mukemmel: { mult: 2, text: 'MÜKEMMEL!', cls: 'perfect', sfx: 'perfect' },
  iyi: { mult: 1.2, text: 'İyi!', cls: 'good', sfx: null },
  zayif: { mult: 0.8, text: 'Zayıf', cls: 'weak', sfx: 'weak' },
};

export function calcDamage(atk, mult, def) {
  const d = atk * mult * (100 / (100 + def)) * (0.9 + Math.random() * 0.2);
  return Math.max(1, Math.round(d));
}

const BATTLE_ITEMS = ['iksir_k', 'mantar_corbasi', 'bogurtlen', 'altin_elma', 'bonk_bombasi'];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Savas ekrani karakterin arkasindan bakar: karakter solda, yakin ve buyuk (arka 3/4)
export const BPOS = { x: 66, y: GROUND_Y + 48, scale: 2.4 };
const B = (a) => `c_b_${a}`;

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
  // specs: [{ key, shiny, golden, sleeping }]
  constructor(world, specs, opts = {}) {
    this.w = world;
    this.scene = world;
    this.opts = opts;
    this.floor = opts.floor || 1;
    this.enemies = [];
    this.over = false;
    this.busy = true;
    this.phase = null;
    this.pAtb = opts.ambush ? 100 : Math.random() * 30;
    this.status = { zehir: 0, sersem: 0, savun: false, yanma: 0, tok: 0, guc: 0 };
    this.spinCd = 0;
    this.manualActs = 0;
    this.autoActs = 0;
    this.killXp = 0;
    this.defXp = 0;
    this.gold = 0;
    this.firstStrike = !!opts.ambush;
    this.gy = GROUND_Y;   // Glemonlarin durdugu zemin (arenada uzak meydan)
    this.arena = false;
    specs.forEach((s, i) => this.addEnemy(s, slotX(specs.length, i, opts.boss)));
    if (opts.surprised) for (const e of this.enemies) e.atb = 100;
  }

  // -------------------------------------------------------------- dusmanlar
  addEnemy(spec, x) {
    const data = GLEMONS[spec.key];
    const meta = this.w.gmeta[spec.key];
    const m = floorMult(this.floor);
    const zoom = this.arena ? (data.boss ? 1.5 : 2) : 1;
    const scale = (spec.golden ? 1.35 : 1) * zoom;
    const sfxk = spec.shiny ? '_p' : '';
    const k = (a) => `g_${spec.key}_${a}${sfxk}`;
    const sprite = this.scene.add.sprite(x, this.gy, k('durma'))
      .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(8).setScale(scale);
    if (spec.golden) sprite.setTint(0xffd86a);
    sprite.play(k('durma'));
    if (spec.sleeping) sprite.anims.timeScale = 0.35;
    const shadow = this.scene.add.image(x, this.gy + 1, 'shadow').setDepth(7).setScale((meta.bodyW * scale) / 18, 1);
    const prefix = spec.shiny ? 'Parlak ' : spec.golden ? 'Altın ' : '';
    const e = {
      key: spec.key, data, meta, sprite, shadow, k, scale, spec,
      homeX: x,
      name: prefix + data.name,
      from: prefix + data.from,
      rarity: spec.golden ? 'epik' : data.rarity,
      shiny: !!spec.shiny, golden: !!spec.golden, sleeping: !!spec.sleeping,
      maxHp: Math.round(data.hp * m * (spec.golden ? 2.2 : 1)),
      atk: data.atk * m * (spec.golden ? 1.4 : 1),
      defense: data.def * m,
      spd: data.spd,
      atb: Math.random() * 30,
      acts: 0,
      alive: true,
    };
    e.hp = e.maxHp;
    if (spec.shiny) this.sparkle(e);
    this.enemies.push(e);
    return e;
  }

  alive() { return this.enemies.filter((e) => e.alive); }
  topY(e) { return this.gy - e.meta.ay * e.scale; }

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
  }

  // oyuncunun yazilari icin konum (karakter ekranin altinda, buyuk duruyor)
  px() { return this.w.player.x + 6; }
  py() { return GROUND_Y - 22; }
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
    this.buildPanel();
    $('#actions').classList.add('hidden');
    $('#battle').classList.remove('hidden');
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
    wrap.appendChild(hp); wrap.appendChild(atb);
    wrap.style.left = `${(e.homeX / 384) * 100}%`;
    wrap.style.top = `${((this.topY(e) - 3) / 216) * 100}%`;
    $('#bars').appendChild(wrap);
    e.ui = { wrap, hf, af };
    this.renderEnemy(e);
  }

  renderEnemy(e) {
    if (!e.ui) return;
    e.ui.hf.style.width = `${Math.max(0, e.hp / e.maxHp) * 100}%`;
    e.ui.af.style.width = `${e.atb}%`;
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
  }

  renderStatus() {
    const parts = [];
    if (this.status.zehir > 0) parts.push(`Zehir ${this.status.zehir}`);
    if (this.status.sersem > 0) parts.push('Sersem');
    if (this.status.yanma > 0) parts.push(`Yanma ${this.status.yanma}`);
    if (this.status.tok > 0) parts.push(`Tok ${this.status.tok}`);
    if (this.status.guc > 0) parts.push(`Altın güç ${this.status.guc}`);
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
    if (S.save.settings.auto && (this.phase === 'menu' || this.phase === 'target' || this.phase === 'items')) {
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
    this.pAtb = Math.min(100, this.pAtb + S.spd() * k);
    for (const e of this.alive()) e.atb = Math.min(100, e.atb + e.spd * k);
    this.renderAtb();
    if (this.pAtb >= 100) { this.playerTurn(); return; }
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
      this.damagePlayer(d, false);
      this.renderStatus();
      if (S.hp <= 0) { await this.lose(); if (this.over) return; }
      await wait(this.scene, 400);
    }
    if (this.status.yanma > 0) {
      this.status.yanma--;
      const d = Math.max(1, Math.round(S.maxHp() * 0.05));
      floatText(this.px(), this.py() - 10, 'Yanıyorsun!', 'info');
      this.damagePlayer(d, false);
      this.renderStatus();
      if (S.hp <= 0) { await this.lose(); if (this.over) return; }
      await playAnim(p, B('onfire'), 2);
      this.pose();
      if (this.over) return;
    }
    if (this.status.tok > 0) this.status.tok--;
    if (this.status.guc > 0) this.status.guc--;
    if (this.status.sersem > 0) {
      this.status.sersem--;
      floatText(this.px(), this.py() - 10, 'Sersem! Sıra geçti', 'info');
      this.renderStatus();
      await wait(this.scene, 700);
      this.endPlayerTurn();
      return;
    }
    if (this.spinCd > 0) this.spinCd--;
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
    this.setHint('');
    this.renderAtb();
    this.renderStatus();
    if (!this.checkEnd()) this.busy = false;
  }

  canSpin() { return S.level('saldiri') >= 20 && this.spinCd === 0; }

  showMenu() {
    this.phase = 'menu';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', 'Sıra sende!'));
    this.acts.appendChild(button('Saldır', () => this.onAttack(), 'primary'));
    const spinLbl = S.level('saldiri') < 20 ? 'Döner Kesik (Saldırı 20)' : this.spinCd > 0 ? `Döner Kesik (${this.spinCd})` : 'Döner Kesik';
    const sb = button(spinLbl, () => this.spin(false), 'purple');
    sb.disabled = !this.canSpin();
    this.acts.appendChild(sb);
    const usable = BATTLE_ITEMS.filter((id) => S.countItem(id) > 0);
    const pots = S.countItem('iksir_k');
    const pb = button(usable.length > 1 || (usable.length === 1 && usable[0] !== 'iksir_k') ? 'Eşya' : `İksir (${pots})`, () => this.itemMenu(), 'red');
    pb.disabled = usable.length === 0;
    this.acts.appendChild(pb);
    this.acts.appendChild(button('Savun', () => this.defend(), 'blue'));
    const fb = button('Kaç', () => this.flee(), 'small');
    fb.disabled = !!this.opts.boss || this.enemies.some((e) => e.golden);
    this.acts.appendChild(fb);
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
    const boom = this.scene.add.sprite(cx, this.gy - 30, 'boom').setDepth(13).setScale(1.4);
    boom.play('boom');
    boom.once('animationcomplete', () => boom.destroy());
    sfx('boom');
    this.scene.cameras.main.shake(300, 0.016);
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
    const t = await this.chooseTarget();
    if (t === 'auto' || this.over) return;
    if (!t) { this.showMenu(); return; }
    await this.doAttack(t, false);
  }

  chooseTarget() {
    const alive = this.alive();
    if (alive.length === 1) return Promise.resolve(alive[0]);
    this.phase = 'target';
    return new Promise((resolve) => {
      this.targetResolve = resolve;
      this.acts.innerHTML = '';
      this.acts.appendChild(el('div', 'hint', 'Hedefe dokun'));
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
      const heal = ['iksir_k', 'mantar_corbasi', 'bogurtlen'].find((id) => S.countItem(id) > 0);
      if (heal) return this.drink(true, heal);
    }
    const alive = this.alive();
    if (alive.length >= 2 && this.canSpin()) return this.spin(true);
    const target = alive.reduce((a, b) => (a.hp <= b.hp ? a : b));
    return this.doAttack(target, true);
  }

  async doAttack(target, auto) {
    this.phase = null;
    this.setHint('');
    let mult = 1;
    let grade = null;
    if (auto) this.autoActs++;
    else {
      this.manualActs++;
      grade = await timingBar();
      mult = GRADE[grade].mult;
    }
    if (this.firstStrike) { mult *= 1.5; this.firstStrike = false; }
    const crit = Math.random() < S.crit();
    const p = this.w.player;
    // silah yoksa yumrukla (az hasar), varsa kilicla
    const armed = !!S.save.equip.silah;
    const lunge = this.lunge(p, 34, -8, 200);
    const swing = playAnim(p, B(armed ? 'stab' : 'punch'), armed ? 2.3 : 1.4);
    await wait(this.scene, armed ? 760 / 2.3 : 260);
    await lunge;
    this.hitEnemy(target, S.atk() * this.atkMult(), mult, crit, grade);
    await swing;
    await this.back(p);
    this.pose();
    this.endPlayerTurn();
  }

  async spin(auto) {
    if (!this.canSpin()) return;
    this.phase = null;
    this.setHint('');
    let mult = 0.6;
    let grade = null;
    if (auto) this.autoActs++;
    else {
      this.manualActs++;
      grade = await timingBar('DÖNER KESİK!');
      mult *= GRADE[grade].mult;
    }
    this.spinCd = 3;
    const p = this.w.player;
    this.lunge(p, 40, -10, 220);
    const sp = playAnim(p, B('spin'), 1);
    await wait(this.scene, 300);
    let first2 = true;
    for (const e of this.alive()) {
      this.hitEnemy(e, S.atk() * this.atkMult(), mult, Math.random() < S.crit(), first2 ? grade : null);
      first2 = false;
    }
    await sp;
    await this.back(p);
    this.pose();
    this.endPlayerTurn();
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
    const heal = Math.round(S.maxHp() * it.heal);
    S.hp = Math.min(S.maxHp(), S.hp + heal);
    sfx('heal');
    floatText(this.px(), this.py(), `+${heal}`, 'heal');
    // yemek yiyince guclenir: normal yemek 3 tur +%10 saldiri, Altin Elma 5 tur +%30 saldiri ve savunma
    if (it.golden) { this.status.guc = 5; sfx('levelup'); floatText(this.px(), this.py() - 14, 'Altın güç!', 'perfect'); }
    else if (it.food) { this.status.tok = 3; floatText(this.px(), this.py() - 14, 'Tok: saldırı +%10', 'info'); }
    this.pose();
    this.renderMe();
    S.changed();
    this.endPlayerTurn();
  }

  async defend() {
    this.phase = null;
    this.manualActs++;
    this.status.savun = true;
    this.defXp += 2 * this.floor;
    const p = this.w.player;
    floatText(this.px(), this.py() - 10, 'Savunma ×2', 'info');
    sfx('click');
    this.renderStatus();
    await wait(this.scene, 450);
    this.endPlayerTurn();
    this.status.savun = true;
    this.renderStatus();
  }

  async flee() {
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
      this.cleanup(true);
      this.resolve('flee');
    } else {
      floatText(this.px(), this.py() - 10, 'Kaçamadın!', 'info');
      sfx('weak');
      await wait(this.scene, 600);
      this.endPlayerTurn();
    }
  }

  // -------------------------------------------------------------- hasar
  hitEnemy(e, atk, mult, crit, grade) {
    if (!e.alive) return;
    const dmg = calcDamage(atk, mult * (crit ? 1.5 : 1), e.defense);
    e.hp = Math.max(0, e.hp - dmg);
    const top = this.topY(e);
    floatText(e.sprite.x, top + 4, String(dmg), crit || grade === 'mukemmel' ? 'crit' : 'dmg');
    if (grade) floatText(e.sprite.x, top - 8, GRADE[grade].text, GRADE[grade].cls);
    if (crit) floatText(e.sprite.x + 14, top - 2, 'Kritik!', 'perfect');
    sfx(crit ? 'crit' : 'hit');
    if (grade && GRADE[grade].sfx) sfx(GRADE[grade].sfx);
    if (crit || grade === 'mukemmel') this.scene.cameras.main.shake(110, 0.008);
    const sl = this.scene.add.image(e.sprite.x, top + e.meta.bodyH * e.scale * 0.5, 'slash').setDepth(12).setRotation(Math.random() * 1.2 - 0.6);
    this.scene.tweens.add({ targets: sl, alpha: 0, scale: 1.4, duration: 260, onComplete: () => sl.destroy() });
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
    // patron dusunce cagirdigi kokler de cekilir (odulsuz)
    if (e.data.boss) {
      for (const o of this.alive()) {
        o.alive = false;
        if (o.ui) { o.ui.wrap.remove(); o.ui = null; }
        floatText(o.sprite.x, this.topY(o), 'Kökler çekildi', 'info');
        this.scene.tweens.add({ targets: [o.sprite, o.shadow], alpha: 0, y: '+=12', duration: 600, onComplete: () => { o.sprite.destroy(); o.shadow.destroy(); } });
      }
    }
    // oduller
    const rm = RMULT[e.rarity] || 1;
    let xp = 8 * Math.pow(this.floor, 1.2) * rm;
    if (e.shiny) xp *= 2;
    if (e.golden) xp *= 4;
    this.killXp += xp;
    let gold = Math.round(this.floor * (2 + Math.random() * 2) * Math.min(rm, 3));
    if (e.shiny) gold *= 3;
    if (e.golden) gold *= 3;
    if (e.data.boss) gold = 150 + Math.round(Math.random() * 50);
    S.addGold(gold);
    this.gold += gold;
    const st = S.save.stats;
    st.kills++;
    st.glemons[e.key] = (st.glemons[e.key] || 0) + 1;
    if (S.run) S.run.kills++;
    if (e.data.boss) st.bossKills++;
    if (e.shiny) {
      st.shiny++;
      S.logDrop(null, e.name, { note: 'yenildi (1/500 şans!)' });
      feed(`<span style="color:#ffd04d">✦ ${e.name} yendin! (1/500 şans)</span>`, 'gold');
    }
    const manual = this.manualActs >= this.autoActs;
    for (const [id, ch] of e.data.drops) {
      let c = ch * (manual ? 1.1 : 1) * (e.sleeping ? 1.5 : 1) * (e.golden ? 3 : 1) * (e.shiny ? 2 : 1);
      if (ch >= 1) c = 1;
      if (Math.random() < Math.min(1, c)) this.w.giveDrop(id, 1, e.from);
    }
  }

  damagePlayer(d, anim = true) {
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
    this.renderEnemy(e);
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
    const p = this.w.player;
    let dodged = false;
    if (act.telegraph) {
      const top = this.topY(e);
      floatText(e.sprite.x, top - 2, '!', 'warn');
      if (act.name) floatText(e.sprite.x, top - 20, act.name, 'info');
      sfx('warn');
      e.sprite.setTintFill(0xffffff);
      this.scene.time.delayedCall(90, () => { if (e.sprite.active) { e.sprite.clearTint(); if (e.golden) e.sprite.setTint(0xffd86a); } });
      if (!S.save.settings.auto) dodged = await dodgePrompt();
      else await wait(this.scene, 550);
    }
    if (this.over) return;
    // Glemon kameraya (oyuncuya) dogru atilir
    e.sprite.setDepth(15);
    e.sprite.play(e.k('yurume'));
    await new Promise((res) => this.scene.tweens.add({
      targets: e.sprite, x: 150, y: this.gy + 46, scale: e.scale * 1.4, duration: 260, ease: 'Quad.easeIn', onComplete: res,
    }));
    const atkAnim = playAnim(e.sprite, e.k('saldiri'), 1.6);
    await wait(this.scene, 300 / 1.6);
    if (dodged) {
      sfx('dodge');
      floatText(this.px(), this.py() - 10, 'Kaçındın!', 'good');
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
      if (act.status && S.hp > 0) {
        const [st, turns] = act.status;
        this.status[st] = Math.max(this.status[st], turns);
        floatText(this.px(), this.py() - 20, { zehir: 'Zehirlendin!', sersem: 'Sersemledin!', yanma: 'Yanıyorsun!' }[st], 'info');
        if (st === 'yanma') this.scene.time.delayedCall(500, () => { if (!this.over && S.hp > 0) playAnim(p, B('onfire'), 2).then(() => { if (!this.over) this.pose(); }); });
        this.renderStatus();
      }
    }
    await atkAnim;
    if (S.hp <= 0) { await this.lose(); if (this.over) return; }
    if (e.sprite.active) {
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
      n.sprite.y = this.gy + 30;
      this.scene.tweens.add({ targets: n.sprite, y: this.gy, duration: 500, ease: 'Back.easeOut' });
      this.makeBar(n);
    }
  }

  // -------------------------------------------------------------- bitis
  async win() {
    this.over = true;
    this.busy = true;
    this.phase = null;
    await wait(this.scene, 350);
    sfx('win');
    const manual = this.manualActs > 0 && this.manualActs >= this.autoActs;
    const xm = manual ? 1.2 : 1;
    const gains = { saldiri: this.killXp * 0.7 * xm, can: this.killXp * 0.3 * xm, savunma: this.defXp };
    const ups = S.addXp(gains);
    S.save.stats.battles++;
    const r = (x) => Math.round(x);
    feed(`Zafer! +${r(gains.saldiri)} Saldırı, +${r(gains.can)} Can, +${r(gains.savunma)} Savunma XP${manual ? ' <span style="color:#ffd04d">(manuel +%20)</span>' : ''}`);
    if (this.gold > 0) { feed(`<img class="ico-inline" src="${this.w.coinUrl}">+${this.gold} ${CURRENCY}`); sfx('coin'); }
    this.cleanup(false);
    await this.w.exitBattleView();
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
    if (removeEnemies) {
      for (const e of this.enemies) {
        if (e.sprite.active) e.sprite.destroy();
        if (e.shadow.active) e.shadow.destroy();
      }
    }
  }

  destroy() { this.over = true; this.cleanup(true); }
}
