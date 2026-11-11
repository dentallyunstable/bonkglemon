// Savas: ATB (bekleme cubugu) sistemi, manuel / otomatik mod, zamanlama cubugu, kacinma,
// durumlar (Zehir, Yanma, Sersem, Donma, Karanlik), silah yetenekleri ve kombolar (0.5),
// yanindaki evcil Glemon ve evcillestirme (0.4), odul ve dusurmeler.
import {
  passiveOf, SECRET_HOME, GLEMONS, GROUND_Y, RARITY, ITEMS, floorMult, ANIM_POOLS, CURRENCY, STAGES, STAGE_STAT, TAME, FOODS, ZONE_SPAWNS,
  typeMult, WATER_GLEMONS, BASIC, ABILITIES, WEAPON_SKILL, STATUS_NAMES, COMBOS, zoneOf, ZONES, masteryOf, KITCHEN, NIGHT, NIGHT_HOME,
  MAGIC, styleMult, styleOf, ELEMENTS, SIFA, MANUAL2, SKILLS, BOSS_P2, BOSS_PHASE, HARD, KULE, BOSS_PHASES, KADIM,
} from './data.js';
import { S } from './state.js';
import { ARENA } from './art.js';
import { $, el, button, floatText, feed, timingBar, dodgePrompt, banner, icon } from './ui.js';
import { sfx } from './audio.js';
import { playAnim, wait } from './anim.js';
import { teamInfo, teamAura, petDisplayName, fightBond, recordDrop, tickNest, zoneBonus, homeOf } from './pets.js';

const RMULT = { siradan: 1, nadir: 1.6, epik: 2.5, efsanevi: 15 };
const ATB_RATE = 1.0; // Hiz 100 -> cubuk 1 saniyede dolar
const GRADE = {
  mukemmel: { mult: 2, text: 'MÜKEMMEL!', cls: 'perfect', sfx: 'perfect' },
  iyi: { mult: 1.2, text: 'İyi!', cls: 'good', sfx: null },
  zayif: { mult: 0.8, text: 'Zayıf', cls: 'weak', sfx: 'weak' },
};
const WEAPON_ANIM = { kilic: 'stab', yay: 'bowshot', yumruk: 'punch' };
const PET_POS = [{ x: 136, y: GROUND_Y + 24, scale: 1.6 }, { x: 184, y: GROUND_Y + 13, scale: 1.35 }];

export function calcDamage(atk, mult, def) {
  const d = atk * mult * (100 / (100 + def)) * (0.9 + Math.random() * 0.2);
  return Math.max(1, Math.round(d));
}

const OLD_ITEMS = ['iksir_k', 'orta_iksir', 'buyuk_iksir', 'ay_iksiri', 'mantar_corbasi', 'izgara_balik', 'balik_corbasi', 'bogurtlen', 'hurma', 'altin_elma', 'bonk_bombasi'];
// 0.11: Mutfak yemekleri, sargi ve havuc da savasta yenir
const BATTLE_ITEMS = [...OLD_ITEMS.slice(0, -2), 'sargi_bezi', 'havuc', 'yanmis_yemek', ...KITCHEN.map(([id]) => id), ...OLD_ITEMS.slice(-2)];
// otomatik savasin kullanabildigi iyilestiriciler (Altin Elma haric), zayiftan gucluye
const HEALS = OLD_ITEMS.filter((id) => ITEMS[id] && ITEMS[id].heal && !ITEMS[id].golden).sort((a, b) => ITEMS[a].heal - ITEMS[b].heal);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Savas ekrani karakterin arkasindan bakar: karakter solda, yakin ve buyuk (arka 3/4)
export const BPOS = { x: 70, y: GROUND_Y + 34, scale: 2 }; // 0.8.9: daha kucuk, on tumsegin ustunde
const B = (a) => `c_b_${a}`;
// Glemon turunun bolgesi (yemi bu bolgenin yemidir)
const ZONE_OF_KEY = {};
for (const [z, list] of Object.entries(ZONE_SPAWNS)) for (const [k] of list) ZONE_OF_KEY[k] = z;
for (const [k] of WATER_GLEMONS) ZONE_OF_KEY[k] = 'su';
Object.assign(ZONE_OF_KEY, NIGHT_HOME, SECRET_HOME);
// 1.0 patron asamalari: BOSS_PHASES (cok asamali) ya da BOSS_P2 (tek ek asama)
const phasesOf = (k) => BOSS_PHASES[k] || (BOSS_P2[k] ? [{ at: BOSS_PHASE.at, ...BOSS_P2[k] }] : []);
const emptySt = () => ({ zehir: 0, yanma: 0, sersem: 0, donma: 0, karanlik: 0, shell: 0, reflect: 0, lanet: 0 });
const M = (k) => S.cmod(k);

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
    this.pAtb = opts.ambush ? 100 : Math.min(99, Math.random() * 30 + (this.wt === 'yay' ? 45 : 0) + M('fastStart'));
    this.status = { zehir: 0, sersem: 0, savun: false, yanma: opts.burn && !S.fireproof() ? 3 : 0, tok: 0, guc: 0, donma: 0, karanlik: opts.dark && !S.darkproof() ? 3 : 0, nara: 0, ice: 0, kalkan: 0 };
    // 0.13: mana, buyuk yetenek (sinif), seri sayaci, nisan, ilk vurus kalkani
    this.maxMana = S.maxMana();
    this.mana = this.maxMana;
    this.ult = 0;
    this.streak = 0;
    this.elemI = 0;
    this.aim = false;
    this.firstBlock = M('firstBlock') > 0;
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
    this.t0 = Date.now();
    this.gy = GROUND_Y;   // Glemonlarin durdugu zemin (arenada uzak meydan)
    this.arena = false;
    this.pets = [];
    this.pTurns = 0;
    this.aura = teamAura(S.teamPets().filter((p) => !(S.run && S.run.pets && S.run.pets[p.id] && S.run.pets[p.id].down)));
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
      maxHp: Math.round(data.hp * m * sm * (spec.golden ? 2.2 : 1) * (this.opts.night ? NIGHT.mult : 1)),
      atk: data.atk * m * (1 + 0.25 * stage) * (spec.golden ? 1.4 : 1) * (this.opts.night ? NIGHT.mult : 1),
      defense: data.def * m * (1 + 0.2 * stage),
      spd: data.spd,
      atb: Math.random() * 30,
      acts: 0,
      alive: true,
      st: emptySt(),
    };
    // 0.13.5 zor mod patronu ve Kule kurallari
    if (data.boss && this.opts.hard) { e.maxHp = Math.round(e.maxHp * HARD.hp); e.atk *= HARD.atk; e.defense *= HARD.def; e.name = `${data.name} (Zor)`; }
    if (S.run && S.run.kule) { e.maxHp = Math.round(e.maxHp * KULE.hp); e.atk *= KULE.atk; }
    if (this.opts.kadim) { e.maxHp = Math.round(e.maxHp * KADIM.hp); e.atk *= KADIM.atk; e.defense *= KADIM.def; e.name = `${e.name} (Kadim)`; }
    if (this.kr() === 'hizli') e.spd = Math.round(e.spd * 1.4);
    if (this.kr() === 'zirhli') e.defense *= 1.6;
    e.hp = e.maxHp;
    S.seeGlemon(spec.key, spec.shiny);
    if (spec.shiny) this.sparkle(e);
    this.enemies.push(e);
    return e;
  }

  alive() { return this.enemies.filter((e) => e.alive); }
  // 0.13.5 Sonsuz Kule kurali
  kr() { return S.run && S.run.krule; }
  hm(h) { return this.kr() === 'sifa' ? Math.max(1, Math.round(h * 0.5)) : h; }
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

  // -------------------------------------------------------------- evcil Glemonlar (0.4, 0.12: iki yoldas)
  get pet() { return this.pets.find((t) => t.alive) || null; }
  makePet() {
    if (this.pets.length) return;
    if (this.kr() === 'yalniz') return;
    const list = S.teamPets();
    const team = teamInfo(list);
    const runPets = S.run ? (S.run.pets = S.run.pets || {}) : null;
    list.forEach((p, i) => {
      const rp = runPets && runPets[p.id];
      if (rp && rp.down) return;
      const pos = PET_POS[i];
      const meta = this.w.gmeta[p.key].stages[p.stage];
      const st = S.petStats(p, team);
      const k = (a) => `g_${p.key}_${p.stage}_${a}${p.shiny ? '_p' : ''}`;
      const sc = pos.scale * (p.stage === 2 ? 0.85 : 1);
      const sprite = this.scene.add.sprite(pos.x, pos.y, `gs_${p.key}_${p.stage}`, p.shiny ? meta.n : 0)
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(18 - i).setScale(sc).setFlipX(true);
      sprite.play(k('durma'));
      const shadow = this.scene.add.image(pos.x, pos.y + 1, 'shadow').setDepth(17 - i).setScale((meta.bodyW * sc) / 18, sc * 0.8);
      const hp = rp && rp.hp != null ? Math.min(rp.hp, st.maxHp) : st.maxHp;
      const ps = passiveOf(p.key) || {};
      const t = {
        p, i, pos, meta, sprite, shadow, k, scale: sc, data: GLEMONS[p.key], name: petDisplayName(p), ps,
        maxHp: st.maxHp, hp, atk: st.atk, def: st.def, spd: st.spd,
        atb: ps.first ? 100 : Math.random() * 40, acts: 0, alive: hp > 0, charged: false, queued: false,
        taunt: 0, shell: 0, reflect: 0, fought: false, hearts: S.hearts(p),
      };
      if (!t.alive) { sprite.destroy(); shadow.destroy(); return; }
      if (this.w.attachAcc) this.w.attachAcc(sprite, p, meta);
      this.pets.push(t);
    });
    if (team.label && this.pets.length > 1) this.teamLabel = team.label;
  }

  petTop(t = this.pet) { return t.sprite.y - t.meta.ay * t.scale; }

  makePetBar(t) {
    if (!t) { for (const x of this.pets) if (x.alive) this.makePetBar(x); return; }
    const wrap = el('div', 'ebar pbar' + (t.i ? ' pbar2' : ''));
    const nm = el('div', 'nm', `${t.name} Sv.${t.p.lvl}${t.hearts ? ' ' + '♥'.repeat(t.hearts) : ''}`);
    wrap.appendChild(nm);
    const hp = el('div', 'bar'); const hf = el('div', 'fill'); hp.appendChild(hf);
    const atb = el('div', 'bar atb'); const af = el('div', 'fill'); atb.appendChild(af);
    wrap.appendChild(hp); wrap.appendChild(atb);
    const sp = button(`★ ${t.data.special ? t.data.special.name : 'Yetenek'}`, () => {
      if (!t.charged || !t.alive) return;
      t.queued = true;
      sfx('click');
      floatText(t.sprite.x, this.petTop(t) - 6, 'Hazır!', 'good');
      this.renderPet(t);
    }, 'small purple pet-sp');
    wrap.appendChild(sp);
    wrap.style.left = `${(t.pos.x / 384) * 100}%`;
    wrap.style.top = `${((this.petTop(t) - 2) / 216) * 100}%`;
    $('#bars').appendChild(wrap);
    t.ui = { wrap, hf, af, sp };
    this.renderPet(t);
  }

  renderPet(t) {
    if (!t) { for (const x of this.pets) this.renderPet(x); return; }
    if (!t.ui) return;
    t.ui.hf.style.width = `${Math.max(0, t.hp / t.maxHp) * 100}%`;
    t.ui.af.style.width = `${t.atb}%`;
    const show = t.alive && t.charged && !S.save.settings.auto;
    t.ui.sp.classList.toggle('hidden', !show);
    t.ui.sp.classList.toggle('queued', !!t.queued);
  }

  // yanindaki Glemon'un sirasi: normal saldiri ya da ozel yetenek
  async petTurn(t) {
    this.busy = true;
    t.atb = 0;
    t.acts++;
    t.fought = true;
    if (t.taunt > 0) t.taunt--;
    if (t.shell > 0) t.shell--;
    if (t.reflect > 0) t.reflect--;
    if (t.acts % (M('petCharge') ? 2 : 3) === 0) t.charged = true;
    this.gainUlt(MANUAL2.ultPet);
    // 0.12 pasif: sifali ruh / ay isigi
    if (t.ps.regen && S.hp > 0 && S.hp < S.maxHp()) {
      const h = this.hm(Math.max(1, Math.round(S.maxHp() * t.ps.regen)));
      S.hp = Math.min(S.maxHp(), S.hp + h);
      floatText(this.px(), this.py() + 6, `+${h}`, 'heal');
      this.renderMe();
    }
    const sp = t.data.special;
    const useSp = t.charged && sp && (t.queued || S.save.settings.auto);
    this.renderPet(t);
    const alive = this.alive();
    if (!alive.length) { this.endEnemyTurn(); return; }
    const target = alive.reduce((a, b) => (a.hp <= b.hp ? a : b));
    if (useSp) {
      t.charged = false; t.queued = false;
      if (M('manaShare')) { this.mana = Math.min(this.maxMana, this.mana + M('manaShare')); this.renderMe(); }
      floatText(t.sprite.x, this.petTop(t) - 10, sp.name, 'info');
      // 0.12 kombolar: Ikili Saldiri (iki yetenek arka arkaya), Kalp Bagi (5 kalp + MUKEMMEL)
      let boost = 1;
      if (this.lastPetSp && this.lastPetSp.i !== t.i && this.lastPetSp.turn === this.pTurns) { boost *= 2; this.combo('ikili_saldiri'); }
      this.lastPetSp = { i: t.i, turn: this.pTurns };
      let heartCombo = false;
      if (t.hearts >= 5 && !t.heartUsed && this.perfectTurn === this.pTurns) { boost *= 2.5; t.heartUsed = true; heartCombo = true; this.combo('kalp_bagi'); }
      if (sp.heal) {
        await playAnim(t.sprite, t.k('saldiri'), 1);
        const h = this.hm(Math.round(S.maxHp() * 0.2 * boost));
        S.hp = Math.min(S.maxHp(), S.hp + h);
        t.hp = Math.min(t.maxHp, t.hp + Math.round(t.maxHp * 0.2));
        floatText(this.px(), this.py(), `+${h}`, 'heal');
        sfx('heal');
        this.renderMe();
      } else if (sp.shell || sp.reflect) {
        await playAnim(t.sprite, t.k('saldiri'), 1);
        if (sp.shell) { t.shell = 3; t.taunt = 3; floatText(t.sprite.x, this.petTop(t) - 20, 'Glemonlar ona saldıracak!', 'info'); }
        else { t.reflect = 3; t.taunt = 2; floatText(t.sprite.x, this.petTop(t) - 20, 'Dikenler hazır!', 'info'); }
        if (S.hp < S.maxHp() * 0.3) {
          this.combo('dost_kalkani');
          const h = this.hm(Math.round(S.maxHp() * 0.15));
          S.hp = Math.min(S.maxHp(), S.hp + h);
          this.status.ay = Math.max(this.status.ay || 0, 1);
          floatText(this.px(), this.py(), `+${h}`, 'heal');
          this.renderMe(); this.renderStatus();
        }
      } else {
        if (sp.luck) { this.luckBonus = 1.3; floatText(t.sprite.x, this.petTop(t) - 20, 'Şans arttı!', 'perfect'); }
        if (sp.aoe) {
          const blind = alive.filter((e) => e.st.karanlik > 0).length;
          if (blind >= 2) {
            this.combo('kum_firtinasi');
            for (const e of alive) { e.st.sersem = Math.max(e.st.sersem, 2); this.renderEnemy(e); }
          }
          await this.petStrike(t, alive, (sp.mult || 1) * 0.8 * boost, sp.status);
        } else await this.petStrike(t, [target], (sp.mult || 1.4) * boost, sp.status);
      }
      if (heartCombo) {
        const h = this.hm(Math.round(S.maxHp() * 0.15));
        S.hp = Math.min(S.maxHp(), S.hp + h);
        floatText(this.px(), this.py() - 8, `+${h}`, 'heal');
        this.renderMe();
      }
    } else {
      const oh = t.ps.onHit;
      await this.petStrike(t, [target], 1, oh && Math.random() < oh[2] ? [oh[0], oh[1]] : null);
    }
    if (t.sprite.active) t.sprite.play(t.k('durma'));
    this.renderPet(t);
    this.endEnemyTurn();
  }

  async petStrike(t, targets, mult, status) {
    const first = targets[0];
    t.sprite.setDepth(16);
    t.sprite.play(t.k('yurume'));
    await new Promise((res) => this.scene.tweens.add({ targets: t.sprite, x: first.sprite.x - 34, y: this.gy + 8, scale: t.scale * 0.8, duration: 240, ease: 'Quad.easeIn', onComplete: res }));
    const atk = playAnim(t.sprite, t.k('saldiri'), 1.6);
    await wait(this.scene, 200);
    for (const e of targets) {
      if (!e.alive) continue;
      const tm = typeMult(t.data.type, e.type);
      let m = mult * (this.status.nara > 0 ? 1.3 + M('naraPow') : 1) * (e.st.lanet > 0 ? 1.25 : 1);
      if (M('petCrit') && Math.random() < M('petCrit')) { m *= 1.5; floatText(e.sprite.x + 14, this.topY(e) - 2, 'Kritik!', 'perfect'); }
      // Golge Pencesi: Golge Glemonu sersem dusmana
      if (t.data.type === 'Gölge' && e.st.sersem > 0) { m *= 2; this.combo('golge_pencesi'); floatText(e.sprite.x + 14, this.topY(e) - 2, 'Kritik!', 'perfect'); }
      const dmg = calcDamage(t.atk * tm, m, this.eDef(e));
      this.applyDamage(e, dmg, false);
      if (tm > 1) floatText(e.sprite.x, this.topY(e) - 10, 'Etkili!', 'good');
      else if (tm < 1) floatText(e.sprite.x, this.topY(e) - 10, 'Etkisiz…', 'weak');
      if (status && e.alive) this.giveEnemyStatus(e, status);
      if (t.ps.lifesteal) t.hp = Math.min(t.maxHp, t.hp + Math.max(1, Math.round(dmg * t.ps.lifesteal)));
      if (e.alive && e.st.reflect > 0) this.damagePet(t, Math.max(1, Math.round(dmg * 0.3)), 'Diken!');
    }
    await atk;
    if (t.sprite.active) {
      t.sprite.play(t.k('yurume'));
      await new Promise((res) => this.scene.tweens.add({ targets: t.sprite, x: t.pos.x, y: t.pos.y, scale: t.scale, duration: 260, ease: 'Quad.easeOut', onComplete: res }));
      t.sprite.setDepth(18 - t.i);
    }
  }

  damagePet(t, d, label = null) {
    if (!t || !t.alive) return;
    t.hp = Math.max(0, t.hp - d);
    floatText(t.sprite.x, this.petTop(t), label ? `${label} -${d}` : `-${d}`, 'hurt');
    this.savePetHp();
    if (t.hp <= 0 && M('petRevive') && !t.revived) {
      t.revived = true;
      t.hp = 0;
      t.alive = false;
      this.revivePet(t, M('petRevive'));
      floatText(t.sprite.x, this.petTop(t) - 22, 'Sadakat!', 'perfect');
      return;
    }
    if (t.hp <= 0) {
      t.alive = false;
      this.savePetHp();
      feed(`${t.name} bayıldı! Üsse dönünce iyileşir.`);
      floatText(t.sprite.x, this.petTop(t) - 12, 'Bayıldı!', 'warn');
      t.sprite.play(t.k('hasar'));
      this.scene.tweens.add({ targets: [t.sprite, t.shadow], alpha: 0, duration: 600, delay: 200 });
      if (t.ui) { t.ui.wrap.remove(); t.ui = null; }
    } else {
      playAnim(t.sprite, t.k('hasar'), 1).then(() => { if (t.alive && t.sprite.active) t.sprite.play(t.k('durma')); });
      this.renderPet(t);
    }
  }

  // oyuncunun yazilari icin konum (karakter ekranin altinda, buyuk duruyor)
  px() { return this.w.player.x + 6; }
  py() { return BPOS.y - 60; }
  pose() { if (!this.lostDone) this.w.player.play(B('idlesway'), true); }
  gearSum(k) { return S.gear().reduce((t, it) => t + (it[k] || 0), 0); }
  atkMult() { return 1 + (this.status.tok > 0 ? 0.1 : 0) + (this.status.guc > 0 ? 0.3 : 0) + this.aura.pAtk; }
  defMult() { return (this.status.savun ? 2 : 1) * (this.status.guc > 0 ? 1.3 : 1) * (1 + this.aura.pDef); }

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
    if (this.teamLabel) feed(`Takım uyumu! ${this.teamLabel}`);
    if (this.opts.cold) feed('Üşüyorsun: bu savaşta yavaşsın. (Sıcak Çorba: Fırın)');
    // 0.13 Avci Tuzakci: bir dusman tuzaga duser
    if (M('startStun') && this.alive().length) {
      const e = pick(this.alive());
      e.st.sersem = Math.max(e.st.sersem, 2);
      floatText(e.sprite.x, this.topY(e) - 14, 'Tuzak!', 'info');
      this.renderEnemy(e);
    }
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
    const intent = el('div', 'intent', '');
    wrap.insertBefore(intent, nm);
    wrap.appendChild(hp); wrap.appendChild(atb); wrap.appendChild(st);
    wrap.style.left = `${(e.homeX / 384) * 100}%`;
    wrap.style.top = `${((this.topY(e) - 3) / 216) * 100}%`;
    $('#bars').appendChild(wrap);
    e.ui = { wrap, hf, af, st, intent };
    this.renderEnemy(e);
  }

  renderEnemy(e) {
    if (!e.ui) return;
    e.ui.hf.style.width = `${Math.max(0, e.hp / e.maxHp) * 100}%`;
    e.ui.af.style.width = `${e.atb}%`;
    const parts = [];
    for (const k of ['zehir', 'yanma', 'sersem', 'donma', 'karanlik']) if (e.st[k] > 0) parts.push(STATUS_NAMES[k]);
    if (e.st.lanet > 0) parts.push('Lanet');
    if (e.st.shell > 0) parts.push('Kabuk');
    // 0.13 dusman niyeti: siradaki hamlesi
    const [it, ic] = this.intentOf(e);
    const itxt = e.st.donma > 0 ? 'Donmuş' : it;
    if (e.ui.intent.textContent !== itxt) { e.ui.intent.textContent = itxt; e.ui.intent.className = `intent ${e.st.donma > 0 ? 'status' : ic}`; }
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
    me.appendChild(hp); me.appendChild(atb);
    // 0.13 mana (asa ya da Buyucu/Destek) ve sinifin buyuk yetenegi
    this.manaFill = null; this.ultFill = null;
    if (this.usesMana()) {
      const mb = el('div', 'bar mana'); this.manaFill = el('div', 'fill'); this.manaText = el('span', '');
      mb.appendChild(this.manaFill); mb.appendChild(this.manaText); me.appendChild(mb);
    }
    if (S.cls()) {
      const ub = el('div', 'bar ult'); this.ultFill = el('div', 'fill'); this.ultBar = ub;
      ub.appendChild(this.ultFill); ub.appendChild(el('span', '', S.cls().ult.name)); me.appendChild(ub);
    }
    me.appendChild(this.statusEl);
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

  usesMana() { return this.wt === 'asa' || !!M('sifa') || (S.save.cls && S.save.cls.c === 'buyucu'); }
  renderMe() {
    const max = S.maxHp();
    if (this.hpFill) {
      this.hpFill.style.width = `${(S.hp / max) * 100}%`;
      this.hpText.textContent = `${S.hp} / ${max}`;
    }
    if (this.manaFill) {
      this.manaFill.style.width = `${(this.mana / this.maxMana) * 100}%`;
      this.manaText.textContent = `Mana ${Math.floor(this.mana)} / ${this.maxMana}`;
    }
    if (this.ultFill) {
      this.ultFill.style.width = `${Math.min(100, this.ult)}%`;
      this.ultBar.classList.toggle('ready', this.ult >= 100);
    }
    this.w.refreshHud();
  }

  renderAtb() {
    if (this.atbFill) {
      this.atbFill.style.width = `${this.pAtb}%`;
      this.atbBar.classList.toggle('ready', this.pAtb >= 100);
    }
    for (const e of this.enemies) if (e.alive) this.renderEnemy(e);
    this.renderPet();
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
    if (this.status.savun) parts.push(S.save.settings.auto ? 'Savunmada' : 'Savunmada (savuştur!)');
    if (this.streak > 0) parts.push(`Seri ×${this.streak}`);
    if (this.status.nara > 0) parts.push(`Nâra ${this.status.nara}`);
    if (this.status.ice > 0) parts.push(`Buz kalkanı ${this.status.ice}`);
    if (this.status.kalkan > 0) parts.push('Kalkan');
    if (this.aim) parts.push('Nişan alındı');
    if (this.firstBlock) parts.push('Kutsal kalkan');
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
    for (const t of this.pets) if (t.alive) t.atb = Math.min(100, t.atb + t.spd * k);
    this.renderAtb();
    if (this.pAtb >= 100) { this.playerTurn(); return; }
    const pt = this.pets.find((t) => t.alive && t.atb >= 100);
    if (pt) { this.petTurn(pt); return; }
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
    this.pTurns++;
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
    if (this.status.nara > 0) this.status.nara--;
    if (this.status.sersem > 0) this.status.sersem--;
    // 0.13: mana her turda dolar; Sifaci Yenilenme
    if (this.kr() === 'zehir' && S.hp > 0) {
      const d = Math.max(1, Math.round(S.maxHp() * 0.04));
      floatText(this.px(), this.py() - 10, 'Zehirli hava', 'info');
      this.damagePlayer(d, false, true);
      if (S.hp <= 0) { await this.lose(); if (this.over) return; }
    }
    if (this.mana < this.maxMana && this.kr() !== 'manasiz') this.mana = Math.min(this.maxMana, this.mana + this.maxMana * MAGIC.regen * (1 + M('manaRegen')));
    if (M('regen') && S.hp < S.maxHp()) {
      const h = this.hm(Math.max(1, Math.round(S.maxHp() * M('regen'))));
      S.hp = Math.min(S.maxHp(), S.hp + h);
      floatText(this.px(), this.py() + 6, `+${h}`, 'heal');
    }
    this.renderMe();
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
    if (S.cls() && !this.ultJust) this.gainUlt(MANUAL2.ultAct);
    this.ultJust = false;
    this.renderMe();
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
  manaCost(a) { return a ? (a.mana || 0) : (this.wt === 'asa' ? MAGIC.basicCost : 0); }
  ready(a) { return !(this.cd[a.key] > 0) && this.mana >= this.manaCost(a); }
  readyText(a) { return this.cd[a.key] > 0 ? `${a.name} (${this.cd[a.key]})` : this.mana < this.manaCost(a) ? `${a.name} (mana)` : a.name; }

  tameables() {
    return this.alive().filter((e) => !e.data.boss && !e.golden && e.hp / e.maxHp < TAME.hpBelow);
  }
  // 0.13 bitirici vurus: cani cok az kalan dusman (sadece manuel)
  finishables() {
    return this.alive().filter((e) => e.hp / e.maxHp < (e.data.boss ? MANUAL2.finishBoss : MANUAL2.finishAt + M('finish')));
  }
  // cantadaki diger silahlar (savasta degistirmek 1 tur surer)
  swapWeapons() {
    const out = [];
    S.save.bag.forEach((sl, i) => { if (sl && ITEMS[sl.id] && ITEMS[sl.id].kind === 'silah' && S.canEquip(sl.id) && sl.id !== S.save.equip.silah) out.push(i); });
    return out;
  }

  showMenu() {
    this.phase = 'menu';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', this.streak > 0 ? `Sıra sende! · Seri ×${this.streak}` : 'Sıra sende!'));
    const fin = this.finishables();
    if (fin.length) this.acts.appendChild(button('Bitir!', () => this.onFinish(), 'primary finish'));
    if (S.cls() && this.ult >= 100) this.acts.appendChild(button(`★ ${S.cls().ult.name}`, () => this.useUlt(false), 'primary ult-btn'));
    const basic = BASIC[this.wt];
    const bonk = this.wt === 'asa' && this.mana < MAGIC.basicCost;
    const atkName = this.wt === 'kilic' ? 'Saldır' : bonk ? 'Asa Darbesi' : basic.name;
    this.acts.appendChild(button(atkName, () => this.onAttack(), 'primary'));
    const sk = this.skills();
    const first = ABILITIES[this.wt][0];
    const skillName = SKILLS.find((x) => x.key === WEAPON_SKILL[this.wt]).name;
    const sb = button(sk.length ? 'Yetenek' : `${first.name} (${skillName} ${first.lvl})`, () => this.skillMenu(), 'purple');
    sb.disabled = !sk.some((a) => this.ready(a));
    if (sk.length === 1) sb.textContent = this.readyText(sk[0]);
    this.acts.appendChild(sb);
    if (M('sifa')) {
      const cost = this.sifaCost();
      const hb = button(this.cd.sifa > 0 ? `Şifa (${this.cd.sifa})` : `Şifa (${cost})`, () => this.castSifa(false), 'green');
      hb.disabled = this.cd.sifa > 0 || this.mana < cost;
      this.acts.appendChild(hb);
    }
    if (M('aimOn') && this.wt === 'yay' && !this.aim) this.acts.appendChild(button('Nişan Al', () => this.aimTurn(), 'blue'));
    const usable = BATTLE_ITEMS.filter((id) => S.countItem(id) > 0);
    const pots = S.countItem('iksir_k');
    const pb = button(usable.length > 1 || (usable.length === 1 && usable[0] !== 'iksir_k') ? 'Eşya' : `İksir (${pots})`, () => this.itemMenu(), 'red');
    pb.disabled = usable.length === 0;
    this.acts.appendChild(pb);
    if (this.tameables().length) this.acts.appendChild(button('Yem ver', () => this.onFeed(), 'green'));
    this.acts.appendChild(button('Savun', () => this.defend(), 'blue'));
    if (this.swapWeapons().length) this.acts.appendChild(button('Silah', () => this.swapMenu(), 'small'));
    const fb = button('Kaç', () => this.flee(), 'small');
    fb.disabled = !!this.opts.boss || this.enemies.some((e) => e.golden);
    this.acts.appendChild(fb);
    // 0.11 Hizli kemer: en cok kullandigin 3 esya tek dokunusla
    const belt = this.beltItems();
    if (belt.length) {
      const row = el('div', 'belt');
      for (const id of belt) {
        const b = button('', () => this.useItem(id, false), 'belt-btn');
        b.appendChild(icon(ITEMS[id].icon));
        b.appendChild(el('span', '', `${S.countItem(id)}`));
        b.title = ITEMS[id].name;
        if (ITEMS[id].heal && !ITEMS[id].golden && !ITEMS[id].tok && S.hp >= S.maxHp()) b.disabled = true;
        row.appendChild(b);
      }
      this.acts.appendChild(row);
    }
  }

  beltItems() {
    const have = BATTLE_ITEMS.filter((id) => S.countItem(id) > 0);
    const uc = S.save.useCount || {};
    return have.sort((a, b) => (uc[b] || 0) - (uc[a] || 0) || HEALS.indexOf(a) - HEALS.indexOf(b)).slice(0, 3);
  }

  skillMenu() {
    const sk = this.skills();
    if (sk.length === 1) { this.useSkill(sk[0]); return; }
    this.phase = 'skills';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', 'Hangi yetenek?'));
    for (const a of sk) {
      const b = button(this.readyText(a), () => this.useSkill(a), 'purple');
      b.title = a.desc;
      b.disabled = !this.ready(a);
      this.acts.appendChild(b);
    }
    this.acts.appendChild(button('Geri', () => this.showMenu(), 'small'));
  }

  async useSkill(a) {
    if (!this.ready(a) || !['menu', 'skills'].includes(this.phase)) return;
    if (a.self) { await this.selfSpell(a, false); return; }
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
    if (!auto) S.save.useCount.bonk_bombasi = (S.save.useCount.bonk_bombasi || 0) + 1;
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
    const c = S.save.cls.c;
    const lowPet = this.pets.some((t) => t.alive && t.hp < t.maxHp * 0.5) || this.pets.some((t) => !t.alive);
    // sinifin buyuk yetenegi: Destek iyilestirmek icin saklar, digerleri hemen kullanir
    if (S.cls() && this.ult >= 100 && (c !== 'destek' || S.hp < S.maxHp() * 0.6 || lowPet)) return this.useUlt(true);
    // Destek once Sifa buyusunu kullanir
    if (M('sifa') && S.hp < S.maxHp() * 0.5 && !(this.cd.sifa > 0) && this.mana >= this.sifaCost()) return this.castSifa(true);
    if (S.hp < S.maxHp() * 0.35) {
      // eksik cani kapatan en kucuk iyilestirici; yoksa eldeki en guclusu
      const have = HEALS.filter((id) => S.countItem(id) > 0);
      const need = 1 - S.hp / S.maxHp();
      const heal = have.find((id) => ITEMS[id].heal >= need - 0.15) || have[have.length - 1];
      if (heal) return this.drink(true, heal);
    }
    const alive = this.alive();
    let sk = this.skills().filter((a) => this.ready(a));
    // Buyucu manayi idareli kullanir: yetenekten sonra Buyu Oku'na mana kalsin
    if (this.wt === 'asa') sk = sk.filter((a) => this.mana - this.manaCost(a) >= MAGIC.basicCost * 2);
    const self = sk.find((a) => a.self);
    if (self && S.hp < S.maxHp() * 0.7 && !(this.status.ice > 0)) return this.selfSpell(self, true);
    const aoe = sk.find((a) => a.aoe);
    if (alive.length >= 2 && aoe) return this.doAttack(null, true, aoe);
    const single = sk.find((a) => !a.aoe && !a.self && a.key !== 'patlat');
    // 1.0: oto savas dikeni acik Glemona vurmamaya calisir
    const safe = alive.filter((e) => !(e.st.reflect > 0));
    const target = (safe.length ? safe : alive).reduce((a, b) => (a.hp <= b.hp ? a : b));
    if (single && target.hp > S.atk() * 1.2) return this.doAttack(target, true, single);
    return this.doAttack(target, true);
  }

  // mana harca (Derin Bilgi: bazen bedava)
  spendMana(n) {
    if (!n) return;
    if (M('free') && Math.random() < M('free')) { floatText(this.px(), this.py() - 22, 'Bedava büyü!', 'good'); return; }
    this.mana = Math.max(0, this.mana - n);
    this.renderMe();
  }
  setCd(key, cd) { this.cd[key] = Math.max(1, cd - M('cd')); }

  // Saldiri ya da yetenek. target null ise alan yetenegi (aoe).
  async doAttack(target, auto, ab = null) {
    this.phase = null;
    this.setHint('');
    let mult = ab ? ab.mult : BASIC[this.wt].mult;
    const hits = ab ? (ab.hits || 1) : BASIC[this.wt].hits;
    // 0.13 asa: Buyu Oku mana harcar; mana yoksa asayla vurursun (zayif)
    const bonk = !ab && this.wt === 'asa' && this.mana < MAGIC.basicCost;
    if (bonk) mult *= MAGIC.bonk;
    const magic = this.wt === 'asa' && !bonk;
    let grade = null;
    if (auto) this.autoActs++;
    else {
      this.manualActs++;
      grade = await timingBar(ab ? `${ab.name.toLocaleUpperCase('tr')}!` : 'VUR!');
      mult *= GRADE[grade].mult;
      // 0.13 seri sayaci: art arda MUKEMMEL hasari buyutur (5 seride +%50)
      if (grade === 'mukemmel') {
        this.streak = Math.min(MANUAL2.streakMax, this.streak + 1);
        if (this.streak >= 2) floatText(this.px(), this.py() - 30, `Seri ×${this.streak}!`, 'perfect');
      } else this.streak = 0;
      mult *= 1 + MANUAL2.streakStep * this.streak;
    }
    if (ab) this.setCd(ab.key, ab.cd);
    if (magic) this.spendMana(this.manaCost(ab));
    if (this.firstStrike) { mult *= 1.5; this.firstStrike = false; }
    let aimed = false;
    if (this.aim) { aimed = true; this.aim = false; mult *= 2.2 + M('aim'); }
    const p = this.w.player;
    const wt = this.wt;
    let targets = target ? [target] : this.alive();
    if (ab && ab.key === 'coklu') targets = targets.slice(0, 3);
    const poisonedBefore = targets.some((e) => e.st.zehir > 0);
    const elem = magic && !ab ? ELEMENTS[this.elemI++ % ELEMENTS.length] : null;
    // animasyon: kilic/yumruk one atilir, yay yerinde ok atar, asa yerinde buyu firlatir
    const animKey = ab && ab.key === 'doner' ? 'spin' : WEAPON_ANIM[wt] || 'stab';
    if (wt === 'yay') {
      await playAnim(p, B('bowshot'), 1.8);
      await Promise.all(targets.map((e) => this.arrow(e, ab && ab.key === 'atesli')));
    } else if (magic) {
      await playAnim(p, B('punch'), 1.6);
      const col = elem ? elem[4] : ab && ab.key === 'alev_dalgasi' ? 0xff8a3a : 0xb08aff;
      await Promise.all(targets.map((e) => this.orb(e, col)));
    } else {
      const lunge = this.lunge(p, 34, -8, 200);
      this.swing = playAnim(p, B(animKey), animKey === 'stab' ? 2.3 : animKey === 'spin' ? 1 : 1.4);
      await wait(this.scene, animKey === 'stab' ? 760 / 2.3 : 260);
      await lunge;
    }
    this.curMagic = magic;
    for (let h = 0; h < hits; h++) {
      for (const e of targets) {
        if (!e.alive) continue;
        const crit = aimed || Math.random() < S.crit() + this.aura.crit;
        this.hitEnemy(e, S.atk() * this.atkMult(), mult, crit, h === 0 && e === targets[0] ? grade : null, ab);
        if (e.alive && elem && Math.random() < elem[3] * (1 + M('statusX'))) this.giveEnemyStatus(e, [elem[1], elem[2]]);
      }
      if (hits > 1 && h < hits - 1) {
        await wait(this.scene, 180);
        if (wt !== 'yay' && !magic) playAnim(p, B(WEAPON_ANIM[wt]), 2.4);
      }
    }
    // Cifte Ok: Tek Ok bazen iki kez
    if (!ab && wt === 'yay' && M('double') && Math.random() < M('double') && targets[0].alive) {
      await this.arrow(targets[0], false);
      floatText(targets[0].sprite.x, this.topY(targets[0]) - 24, 'Çifte ok!', 'good');
      this.hitEnemy(targets[0], S.atk() * this.atkMult(), mult, Math.random() < S.crit() + this.aura.crit, null, null);
    }
    // Firtina Cagir: Buyu Oku ikinci bir dusmana seker
    if (elem && M('chain') && Math.random() < M('chain')) {
      const other = this.alive().find((e) => !targets.includes(e));
      if (other) {
        await this.orb(other, elem[4]);
        floatText(other.sprite.x, this.topY(other) - 24, 'Sekti!', 'good');
        this.hitEnemy(other, S.atk() * this.atkMult(), mult * 0.6, false, null, null);
      }
    }
    // Lanet Bulutu: herkese zehir ve karanlik, durumlar yayilir
    if (ab && ab.spread) {
      const spread = {};
      for (const e of this.enemies) for (const k of ['zehir', 'yanma', 'sersem', 'donma', 'lanet']) if (e.st[k] > 0) spread[k] = Math.max(spread[k] || 0, e.st[k]);
      for (const e of this.alive()) {
        for (const [k, v] of Object.entries(spread)) e.st[k] = Math.max(e.st[k], k === 'donma' ? 1 : v);
        e.st.zehir = Math.max(e.st.zehir, 3);
        e.st.karanlik = Math.max(e.st.karanlik, 2 + M('shroud'));
        this.renderEnemy(e);
      }
    }
    this.curMagic = false;
    // Zehirli Yagmur: zehirli hedefe Coklu Ok -> zehir herkese yayilir
    if (ab && ab.key === 'coklu' && poisonedBefore) {
      this.combo('zehirli_yagmur');
      for (const e of this.alive()) { e.st.zehir = Math.max(e.st.zehir, 5); this.renderEnemy(e); }
    }
    if (wt !== 'yay' && !magic) { await this.swing; await this.back(p); }
    if (S.hp <= 0) { await this.lose(); if (this.over) return; }
    // Avci ortak saldiri: MUKEMMEL vurustan sonra Glemonun da saldirir
    if (grade === 'mukemmel' && M('coop') && this.pet && this.alive().length) {
      const t = this.pet;
      const tg = target && target.alive ? target : this.alive()[0];
      floatText(t.sprite.x, this.petTop(t) - 10, 'Ortak saldırı!', 'perfect');
      await this.petStrike(t, [tg], 0.6 * M('coop'), null);
      if (t.sprite.active) t.sprite.play(t.k('durma'));
    }
    this.pose();
    this.endPlayerTurn();
  }

  // buyu topu: oyuncudan hedefe ucan parlak daire
  orb(e, col) {
    const a = this.scene.add.circle(BPOS.x + 30, GROUND_Y - 30, 3, col).setDepth(21);
    const g = this.scene.add.circle(a.x, a.y, 6, col, 0.35).setDepth(20);
    const ty = this.topY(e) + e.meta.bodyH * e.scale * 0.45;
    return new Promise((res) => this.scene.tweens.add({ targets: [a, g], x: e.sprite.x, y: ty, duration: 220, ease: 'Sine.easeIn', onComplete: () => { a.destroy(); g.destroy(); res(); } }));
  }

  // Buz Kalkani: kendine buyu
  async selfSpell(a, auto) {
    this.phase = null;
    this.setHint('');
    if (auto) this.autoActs++; else this.manualActs++;
    this.setCd(a.key, a.cd);
    this.spendMana(this.manaCost(a));
    await playAnim(this.w.player, B('drinkpotion'), 3.2);
    this.status.ice = 2;
    sfx('heal');
    floatText(this.px(), this.py() - 14, 'Buz kalkanı!', 'perfect');
    this.pose(); this.renderStatus(); this.endPlayerTurn();
  }

  // Destek: Sifa buyusu
  sifaCost() { return Math.round(SIFA.mana * (1 - M('sifaCost'))); }
  healPlayer(frac) {
    const h = this.hm(Math.round(S.maxHp() * frac * (1 + M('heal'))));
    S.hp = Math.min(S.maxHp(), S.hp + h);
    floatText(this.px(), this.py(), `+${h}`, 'heal');
    if (M('cleanse')) { for (const k of ['zehir', 'yanma', 'sersem', 'donma', 'karanlik']) this.status[k] = 0; }
    if (M('shieldOnHeal')) this.status.kalkan = 1;
    this.renderMe(); this.renderStatus();
  }
  healPets(frac) {
    for (const t of this.pets) if (t.alive) {
      const h = Math.round(t.maxHp * frac * (1 + M('heal')));
      t.hp = Math.min(t.maxHp, t.hp + h);
      floatText(t.sprite.x, this.petTop(t), `+${h}`, 'heal');
      this.renderPet(t);
    }
  }
  async castSifa(auto) {
    if (!auto && this.phase !== 'menu') return;
    if (this.cd.sifa > 0 || this.mana < this.sifaCost()) return;
    this.phase = null;
    this.setHint('');
    if (auto) this.autoActs++; else this.manualActs++;
    this.mana -= this.sifaCost();
    this.cd.sifa = SIFA.cd;
    await playAnim(this.w.player, B('drinkpotion'), 3.2);
    sfx('heal');
    this.healPlayer(SIFA.heal);
    this.healPets(SIFA.pet);
    if (M('sifaWard')) { this.status.ay = Math.max(this.status.ay || 0, 1); floatText(this.px(), this.py() - 14, 'Ay kalkanı!', 'perfect'); }
    this.pose(); this.endPlayerTurn();
  }

  // Keskin Nisanci: bir tur nisan al, sonraki vurus kesin kritik
  async aimTurn() {
    if (this.phase !== 'menu') return;
    this.phase = null;
    this.setHint('');
    this.manualActs++;
    this.aim = true;
    floatText(this.px(), this.py() - 14, 'Nişan alındı…', 'info');
    sfx('click');
    await playAnim(this.w.player, B('bowshot'), 0.6);
    this.pose(); this.renderStatus(); this.endPlayerTurn();
  }

  // savasta silah degistirmek 1 tur surer
  swapMenu() {
    this.phase = 'items';
    this.acts.innerHTML = '';
    this.acts.appendChild(el('div', 'hint', 'Hangi silah? (1 tur sürer)'));
    for (const i of this.swapWeapons()) {
      const it = ITEMS[S.save.bag[i].id];
      this.acts.appendChild(button(it.name, () => this.swap(i), it.wt === 'yay' ? 'green' : it.wt === 'asa' ? 'purple' : 'primary'));
    }
    this.acts.appendChild(button('Geri', () => this.showMenu(), 'small'));
  }
  async swap(i) {
    if (this.phase !== 'items') return;
    this.phase = null;
    this.manualActs++;
    if (!S.equipFromBag(i)) { this.showMenu(); return; }
    this.wt = S.weaponType();
    this.maxMana = S.maxMana();
    this.mana = Math.min(this.mana, this.maxMana);
    this.streak = 0;
    sfx('click');
    floatText(this.px(), this.py() - 14, ITEMS[S.save.equip.silah].name, 'info');
    this.buildPanel();
    await wait(this.scene, 400);
    this.endPlayerTurn();
  }

  // 0.13 bitirici vurus (sadece manuel)
  async onFinish() {
    if (this.phase !== 'menu') return;
    const list = this.finishables();
    const e = await this.chooseTarget(list, 'Kimi bitireceksin?');
    if (e === 'auto' || this.over) return;
    if (!e) { this.showMenu(); return; }
    this.phase = null;
    this.setHint('');
    this.manualActs++;
    const p = this.w.player;
    p.play(B('run'));
    await new Promise((res) => this.scene.tweens.add({ targets: p, x: BPOS.x + 60, y: BPOS.y - 12, duration: 240, ease: 'Quad.easeIn', onComplete: res }));
    await playAnim(p, B('spin'), 1.3);
    this.scene.cameras.main.flash(160, 255, 240, 200);
    if (S.save.settings.shake !== false) this.scene.cameras.main.shake(200, 0.014);
    sfx('crit');
    floatText(e.sprite.x, this.topY(e) - 18, 'BİTİRİCİ!', 'perfect');
    this.burst(e.sprite.x, this.topY(e) + e.meta.bodyH * e.scale * 0.5, 10);
    e.finished = true;
    S.save.stats.finishers = (S.save.stats.finishers || 0) + 1;
    this.applyDamage(e, Math.max(1, e.hp), true);
    await this.back(p, 260);
    this.pose();
    this.endPlayerTurn();
  }

  // 0.13 sinifin buyuk yetenegi
  gainUlt(n) {
    if (!S.cls() || this.over) return;
    const low = M('lastBreath') && S.hp < S.maxHp() * 0.3 ? 2 : 1;
    const before = this.ult;
    this.ult = Math.min(100, this.ult + n * low);
    if (before < 100 && this.ult >= 100) floatText(this.px(), this.py() - 34, `★ ${S.cls().ult.name} hazır!`, 'perfect');
    this.renderMe();
  }
  async useUlt(auto) {
    if (!S.cls() || this.ult < 100) return;
    if (!auto && this.phase !== 'menu') return;
    this.phase = null;
    this.setHint('');
    if (auto) this.autoActs++; else this.manualActs++;
    this.ult = 0;
    this.ultJust = true;
    const u = S.cls().ult;
    const p = this.w.player;
    banner(`★ ${u.name}!`, u.desc, 1300, 'gold');
    sfx('levelup');
    if (u.key === 'nara') {
      await playAnim(p, B('cheer'), 1.4);
      this.scene.cameras.main.shake(260, 0.012);
      this.status.nara = 3 + M('naraTurns') + 1;
      for (const e of this.alive()) { e.st.sersem = Math.max(e.st.sersem, 1); this.renderEnemy(e); }
      sfx('roar');
    } else if (u.key === 'ok_yagmuru') {
      await playAnim(p, B('jump'), 1.4);
      const n = 6 + M('arrows');
      for (let i = 0; i < n && this.alive().length; i++) {
        const e = pick(this.alive());
        playAnim(p, B('bowshot'), 3);
        await this.arrow(e, false);
        this.hitEnemy(e, S.atk() * this.atkMult(), 0.55, Math.random() < S.crit() + this.aura.crit, null, null);
      }
    } else if (u.key === 'meteor') {
      await playAnim(p, B('shake'), 1.2);
      const alive = this.alive();
      const cx = alive.reduce((t, e) => t + e.sprite.x, 0) / Math.max(1, alive.length);
      const m = this.scene.add.circle(cx + 60, -20, 9, 0xff7a2a).setDepth(22);
      await new Promise((res) => this.scene.tweens.add({ targets: m, x: cx, y: this.gy - 20, duration: 420, ease: 'Quad.easeIn', onComplete: res }));
      m.destroy();
      this.boom(cx, this.gy - 26, 2);
      this.curMagic = true;
      for (const e of alive) {
        this.hitEnemy(e, S.atk() * this.atkMult(), 1.6 + M('meteor'), Math.random() < S.crit() + this.aura.crit, null, null);
        if (e.alive) this.giveEnemyStatus(e, ['yanma', 3 + (M('meteor') ? 2 : 0)]);
      }
      this.curMagic = false;
    } else if (u.key === 'toplu_sifa') {
      await playAnim(p, B('cheer'), 1.4);
      sfx('heal');
      for (const k of ['zehir', 'yanma', 'sersem', 'donma', 'karanlik']) this.status[k] = 0;
      this.healPlayer(0.4);
      if (M('revive')) for (const t of this.pets) if (!t.alive && t.sprite.active) this.revivePet(t, M('revive'));
      this.healPets(0.5);
      if (M('ward')) this.status.ay = Math.max(this.status.ay || 0, 1);
    }
    if (S.hp <= 0) { await this.lose(); if (this.over) return; }
    this.pose();
    this.renderStatus();
    this.endPlayerTurn();
  }

  // bayilan Glemonu kaldir (Diriltme, Sadakat)
  revivePet(t, frac) {
    t.alive = true;
    t.hp = Math.max(1, Math.round(t.maxHp * frac));
    this.scene.tweens.killTweensOf([t.sprite, t.shadow]);
    t.sprite.setAlpha(1); t.shadow.setAlpha(1);
    t.sprite.play(t.k('durma'));
    floatText(t.sprite.x, this.petTop(t) - 12, 'Kalktı!', 'perfect');
    if (!t.ui) this.makePetBar(t);
    this.renderPet(t);
    this.savePetHp();
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
    if (!auto) S.save.useCount[id] = (S.save.useCount[id] || 0) + 1;
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
    const heal = this.hm(Math.round(S.maxHp() * it.heal));
    S.hp = Math.min(S.maxHp(), S.hp + heal);
    sfx('heal');
    floatText(this.px(), this.py(), `+${heal}`, 'heal');
    // yemek yiyince guclenir: normal yemek 3 tur +%10 saldiri, Altin Elma 5 tur +%30 saldiri ve savunma
    if (it.golden) { this.status.guc = 5; sfx('levelup'); floatText(this.px(), this.py() - 14, 'Altın güç!', 'perfect'); }
    else if (it.strong) { this.status.guc = Math.max(this.status.guc, it.strong); floatText(this.px(), this.py() - 14, 'Balık gücü: saldırı +%30', 'info'); }
    else if (it.tok) { const msg = S.applyTok(id); floatText(this.px(), this.py() - 14, msg.split(' (')[0], 'info'); this.w.refreshHud(); }
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
    // 0.12 Yapiskan Yem: her bolgenin Siradan Glemonlari yer
    if (e.rarity === 'siradan' && S.countItem('sumuk_yemi') > 0) return 'sumuk_yemi';
    return null;
  }

  // 0.12: evcillestirme sansi (ekranda da gorunur)
  tameChance(e, food) {
    let ch = TAME.chance[e.stage] * (e.sleeping ? TAME.sleepingBonus : 1) * (1 + S.level('bag') * 0.004) * S.perk('yem_ustasi', 1.15, 1) * (1 + M('tame'));
    if (food && ITEMS[food].special && e.rarity === 'siradan') ch *= 1.3;
    return Math.min(1, ch);
  }
  showTameChances(list) {
    for (const e of list) {
      const z = ZONE_OF_KEY[e.key];
      const need = TAME.bagReq[e.data.rarity] + TAME.stageBag[e.stage];
      const food = z ? this.foodFor(e) : null;
      const txt = !z ? 'evcilleşmez' : S.level('bag') < need ? `Bağ ${need} gerek` : !food ? 'yem yok' : `♥ %${Math.round(this.tameChance(e, food) * 100)}${e.sleeping ? ' (uyuyor)' : ''}`;
      const t = el('div', 'target tame-ch', txt);
      t.style.left = `${(e.sprite.x / 384) * 100}%`;
      t.style.top = `${((this.topY(e) - 26) / 216) * 100}%`;
      $('#bars').appendChild(t);
    }
  }

  async onFeed() {
    if (this.phase !== 'menu') return;
    const list = this.tameables();
    this.showTameChances(list);
    const e = await this.chooseTarget(list, 'Kime yem vereceksin? (♥ evcilleşme şansı)');
    this.removeMarkers();
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
    const ch = this.tameChance(e, food);
    floatText(e.sprite.x, this.topY(e) - 24, `♥ %${Math.round(ch * 100)}`, 'info');
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
    // 0.12 Buhar Patlamasi: donmus hedefi yakmak ya da yanani dondurmak
    if ((st === 'yanma' && e.st.donma > 0) || (st === 'donma' && e.st.yanma > 0)) {
      e.st.donma = 0; e.st.yanma = 0;
      this.combo('buhar_patlamasi');
      this.boom(e.sprite.x, this.gy - 26, 1.4);
      const best = Math.max(S.atk() * this.atkMult(), ...this.pets.filter((t) => t.alive).map((t) => t.atk));
      this.applyDamage(e, calcDamage(best, 2.2 * (1 + M('steam')), this.eDef(e)), true);
      for (const o of this.alive()) { o.st.sersem = Math.max(o.st.sersem, 1); this.renderEnemy(o); }
      return;
    }
    if (st === 'donma') turns += M('freeze');
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
    let m = mult * (crit ? 1.5 + M('critDmg') : 1);
    // 0.13 kilic / yay / asa ucgeni
    const sm = styleMult(this.wt, e.type);
    m *= sm;
    if (sm !== 1 && !e.styleTold) { e.styleTold = true; floatText(e.sprite.x, top - 30, sm > 1 ? 'Zayıf noktası!' : 'Dayanıklı…', sm > 1 ? 'good' : 'weak'); }
    // 0.13 sinif: kendi silahinda bonus, Barbar ofkesi, Nara, durumlu / lanetli hedef
    m *= 1 + M(`dmg_${styleOf(this.wt)}`) + (this.curMagic ? this.gearSum('magic') : 0);
    if (M('rage')) m *= 1 + Math.min(0.4, M('rage') * Math.floor((1 - S.hp / S.maxHp()) * 10));
    if (this.status.nara > 0) m *= 1.3 + M('naraPow');
    if (M('statusDmg') && ['zehir', 'yanma', 'sersem', 'donma', 'karanlik', 'lanet'].some((k) => e.st[k] > 0)) m *= 1 + M('statusDmg');
    if (e.st.lanet > 0) m *= 1.25;
    if (e.fly && M('fly')) m *= 1 + M('fly');
    // tur ustaligi: cok yendigin ture daha sert vurursun
    m *= 1 + masteryOf((S.save.stats.glemons || {})[e.key] || 0).bonus;
    // 0.12 bolge tamamlama bonusu
    { const zb = zoneBonus(this.zone.key); if (zb) m *= 1 + zb.dmg; }
    // ucan Glemonlar: kilic ve yumruk yari hasar, yay tam
    if (e.fly && this.wt !== 'yay' && this.wt !== 'asa') {
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
    // 0.13.5 Kule: cam top, silah katlari
    const kr = this.kr();
    if (kr === 'cam') m *= 2;
    if (kr === 'kilic' || kr === 'yay' || kr === 'asa') m *= styleOf(this.wt) === kr ? 1.4 : 0.7;
    const def = ab && ab.pierce ? 0 : this.eDef(e);
    const dmg = calcDamage(atk, m, def);
    if (grade) floatText(e.sprite.x, top - 8, GRADE[grade].text, GRADE[grade].cls);
    if (grade === 'mukemmel') this.perfectTurn = this.pTurns;
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
    // 0.13: can calma (Golge Buyucusu, Golge Runu), Kan Hirsi, Lanet, Avci zehri
    const steal = (this.curMagic ? M('drain') + this.gearSum('drain') : 0) + M('leech');
    if (steal > 0 && S.hp > 0) { const h = this.hm(Math.max(1, Math.round(dmg * steal))); S.hp = Math.min(S.maxHp(), S.hp + h); floatText(this.px(), this.py() + 4, `+${h}`, 'heal'); this.renderMe(); }
    if (e.alive && this.curMagic && M('curse')) { e.st.lanet = Math.max(e.st.lanet, 2 + M('curseTurns')); this.renderEnemy(e); }
    if (e.alive && this.wt === 'yay' && M('poison') && Math.random() < M('poison')) this.giveEnemyStatus(e, ['zehir', 3]);
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
    this.checkPhase(e);
    playAnim(e.sprite, e.k('hasar'), 1).then(() => { if (e.alive && e.sprite.active) e.sprite.play(e.k('durma')); });
  }

  // 0.13.5 patron canı yarıya inince 2. aşama
  checkPhase(e) {
    if (!e.alive || !e.data.boss) return;
    const phs = phasesOf(e.key);
    const ph = phs[e.ph || 0];
    if (!ph || e.hp > e.maxHp * ph.at) return;
    e.ph = (e.ph || 0) + 1;
    e.p2 = true;
    e.acts = 0;
    e.atk *= BOSS_PHASE.atk;
    e.spd += BOSS_PHASE.spd;
    e.st.shell = 0;
    if (ph.heal) e.hp = Math.min(e.maxHp, e.hp + Math.round(e.maxHp * ph.heal));
    banner(`${e.data.name}: ${e.ph + 1}. AŞAMA`, ph.sp.name + '!', 1800, 'boss');
    feed(`<span style="color:#ff6b5a">${e.data.name} öfkelendi! Saldırı düzeni değişti, artık ${ph.sp.name} yapıyor.</span>`);
    sfx('roar');
    if (S.save.settings.shake !== false) this.scene.cameras.main.shake(400, 0.012);
    if (e.sprite.active) { e.sprite.setTint(0xff9a8a); this.scene.time.delayedCall(260, () => { if (e.sprite.active) e.sprite.clearTint(); }); }
    this.renderEnemy(e);
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
    if (this.opts.night) xp *= NIGHT.reward; // 0.11 gece
    if (e.finished) xp *= 1 + MANUAL2.finishXp; // 0.13 bitirici vurus
    this.killXp += xp;
    let gold = Math.round(this.floor * (2 + Math.random() * 2) * Math.min(rm, 3) * (e.data.goldMult || 1));
    if (e.shiny) gold *= 3;
    if (e.golden) gold *= 3;
    if (this.opts.night) gold = Math.round(gold * NIGHT.reward);
    if (e.data.boss) gold = (150 * (ZONES.indexOf(this.zone) + 1) + Math.round(Math.random() * 50)) * (this.opts.hard ? HARD.gold : 1);
    if (e.data.boss && this.opts.hard) xp *= HARD.xp;
    if (this.opts.kadim) xp *= KADIM.xp;
    if (e.data.boss) this.bossWin = e.key;
    if (S.run && S.run.goldX) gold = Math.round(gold * S.run.goldX); // 0.9 Altin Gunu
    gold = Math.round(gold * (1 + this.aura.gold));
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
      let c = ch * (manual ? 1.1 : 1) * (e.sleeping ? 1.5 : 1) * (e.golden ? 3 : 1) * (e.shiny ? 2 : 1) * S.dropMult() * this.luckBonus * (1 + this.aura.luck) * (1 + 0.3 * e.stage) * (this.opts.night ? NIGHT.reward : 1) * (this.opts.kadim ? KADIM.drop : 1);
      if (ch >= 1) c = 1;
      if (Math.random() < Math.min(1, c)) {
        this.w.giveDrop(id, 1, e.from, false, e.data.boss ? (this.opts.hard ? 3 : 2) : 1);
        recordDrop(e.key, id);
        if (e.data.boss && ch < 1) S.bossDrop(e.key, id);
        if (ITEMS[id].rarity !== 'siradan' && ch < 1) this.luckXp += 20 * Math.pow(this.floor, 0.8) * (RMULT[ITEMS[id].rarity] || 1);
      }
    }
    // 1.0 Kadim zorluk: Kadim Oz dusurur, patron her zaman
    if (this.opts.kadim && (e.data.boss || Math.random() < KADIM.oz * S.dropMult())) {
      this.w.giveDrop('kadim_oz', e.data.boss ? 2 : 1, e.from, false, 0);
      if (e.data.boss) st.kadimBoss = (st.kadimBoss || 0) + 1;
    }
  }

  damagePlayer(d, anim = true, dot = false, src = null) {
    // 0.13 Kutsal Kalkan: her savasta ilk vurus
    if (this.firstBlock && d > 0 && !dot) {
      this.firstBlock = false;
      floatText(this.px(), this.py(), 'Kutsal kalkan!', 'good');
      this.renderStatus();
      return;
    }
    // Ay Iksiri: sonraki saldirilardan hasar yok (zehir ve yanma kalkani harcamaz)
    if (this.status.ay > 0 && d > 0 && !dot) {
      this.status.ay--;
      floatText(this.px(), this.py(), 'Ay kalkanı!', 'good');
      this.renderStatus();
      return;
    }
    if (S.has('demir_deri')) d = Math.max(1, Math.round(d * 0.9));
    if (this.kr() === 'cam' && !dot) d *= 2;
    if (!dot && this.status.ice > 0) { this.status.ice--; d = Math.max(1, Math.round(d * 0.4)); if (src && src.alive && Math.random() < 0.3) this.giveEnemyStatus(src, ['donma', 1]); }
    if (!dot && this.status.kalkan > 0) { this.status.kalkan = 0; d = Math.max(1, Math.round(d * 0.5)); }
    // Mana Kalkani: hasarin bir kismini mana karsilar
    if (M('manaShield') && this.mana > 0) { const m = Math.min(this.mana, Math.round(d * M('manaShield'))); this.mana -= m; d = Math.max(1, d - m); }
    if (!dot) {
      // hasar alinca seri bozulur (patronun cagirdiklari bozmaz)
      if (this.streak > 0 && !(src && src.summoned)) { this.streak = 0; floatText(this.px(), this.py() - 24, 'Seri bozuldu', 'weak'); }
      this.gainUlt(MANUAL2.ultHit);
    }
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
        this.applyDamage(e, Math.max(1, Math.round(e.maxHp * pct * (1 + M('dotPow')))), false);
        await wait(this.scene, 250);
      }
    }
    this.renderEnemy(e);
    if (!e.alive) { this.endEnemyTurn(); return; }
    // 0.13 Lanet ve Korku
    const cursed = e.st.lanet > 0;
    if (cursed) e.st.lanet--;
    if (cursed && M('fear') && Math.random() < M('fear')) {
      floatText(e.sprite.x, this.topY(e) - 12, 'Korktu!', 'info');
      await wait(this.scene, 500);
      this.renderEnemy(e);
      this.endEnemyTurn();
      return;
    }
    if (e.st.donma > 0) {
      e.st.donma--;
      floatText(e.sprite.x, this.topY(e) - 12, 'Donmuş!', 'info');
      await wait(this.scene, 500);
      this.renderEnemy(e);
      this.endEnemyTurn();
      return;
    }
    const d = e.data;
    let act = this.planAct(e, e.acts);
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
    // hedef: yanindaki Glemonlar bazen (ya da kabuguna cekildiyse hep) saldiriyi uzerine alir
    const live = this.pets.filter((x) => x.alive);
    const taunter = live.find((x) => x.taunt > 0);
    let t = taunter || null;
    if (!t && live.length) {
      const guard = live.find((x) => x.ps.guard);
      const ch = (live.length > 1 ? 0.4 : 0.3) + (guard ? 0.15 : 0);
      if (Math.random() < ch) t = guard && Math.random() < 0.6 ? guard : live[Math.floor(Math.random() * live.length)];
    }
    const onPet = !act.aoe && !!t;
    let dodged = false;
    let parried = false;
    // 0.13 savusturma: Savun'dayken dogru anda dokun -> hasar yok ve karsi vurus
    if (this.status.savun && !onPet && !S.save.settings.auto) {
      const top = this.topY(e);
      floatText(e.sprite.x, top - 2, '!', 'warn');
      sfx('warn');
      parried = !!(await dodgePrompt(Math.round(MANUAL2.parryMs * (1 + M('parry'))), 1, 'SAVUŞTUR!'));
    } else if (act.telegraph) {
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
    const tx = onPet ? t.pos.x + 30 : 150;
    const ty = onPet ? t.pos.y + 6 : BPOS.y - 14;
    await new Promise((res) => this.scene.tweens.add({
      targets: e.sprite, x: tx, y: ty, scale: e.scale * (onPet ? 1.1 : 1.4), duration: 260, ease: 'Quad.easeIn', onComplete: res,
    }));
    const atkAnim = playAnim(e.sprite, e.k('saldiri'), 1.6);
    await wait(this.scene, 300 / 1.6);
    if (missed) {
      floatText(onPet ? t.sprite.x : this.px(), onPet ? this.petTop(t) : this.py() - 10, 'Iskaladı!', 'good');
    } else if (parried) {
      sfx('perfect');
      floatText(this.px(), this.py() - 10, 'Savuşturdun!', 'perfect');
      S.save.stats.parries = (S.save.stats.parries || 0) + 1;
      this.defXp += 4 * this.floor;
      if (e.alive) {
        const back = calcDamage(S.atk() * this.atkMult(), MANUAL2.parryCounter * S.counterMult() * (1 + M('counter')), this.eDef(e));
        this.scene.time.delayedCall(300, () => { if (!this.over && e.alive) { floatText(e.sprite.x, this.topY(e) - 22, 'Karşı vuruş!', 'perfect'); this.applyDamage(e, back, true); } });
      }
      playAnim(p, B('stab'), 2.4).then(() => { if (!this.over) this.pose(); });
    } else if (onPet && t.ps.dodge && Math.random() < t.ps.dodge) {
      floatText(t.sprite.x, this.petTop(t) - 6, 'Kaçtı!', 'good');
      sfx('dodge');
    } else if (onPet) {
      const tm = typeMult(e.type, t.data.type);
      const dmg = calcDamage(e.atk * tm * (cursed ? 0.8 : 1) * this.petGuard(), act.mult || 1, t.def * (t.shell > 0 ? 2 : 1));
      this.damagePet(t, dmg);
      const refl = (t.reflect > 0 ? 0.5 : 0) + (t.ps.thorns || 0);
      if (refl > 0 && e.alive) {
        let m = refl;
        if (e.st.zehir > 0) { m *= 3; this.combo('zehirli_diken'); }
        this.applyDamage(e, Math.max(1, Math.round(dmg * m)), false);
      }
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
      const dmg = calcDamage(e.atk * (cursed ? 0.8 : 1), act.mult || 1, def);
      this.damagePlayer(dmg, true, false, e);
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
      if (act.aoe) for (const x of this.pets) if (x.alive) this.damagePet(x, calcDamage(e.atk * typeMult(e.type, x.data.type) * this.petGuard(), (act.mult || 1) * 0.7, x.def));
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

  // 0.13 dusmanin siradaki hamlesi (niyet simgesi icin de kullanilir)
  planAct(e, n) {
    const d = e.data;
    if (d.boss) {
      // 0.13.5 ikinci asama: yeni duzen ve yeni ozel hamle
      const phs = phasesOf(e.key);
      const cur = e.ph ? phs[e.ph - 1] : null;
      const pat = cur ? cur.pattern : d.pattern;
      const step = pat[(n - 1) % pat.length];
      if (step !== 'normal') {
        const ph = phs.find((x) => x.key === step);
        return { ...(ph ? ph.sp : d.specials[step]) };
      }
    } else if (d.special && n % d.every === 0) return { ...d.special };
    return { mult: 1 };
  }
  intentOf(e) {
    const a = this.planAct(e, e.acts + 1);
    if (a.heal) return ['Şifa', 'heal'];
    if (a.summon) return ['Çağırır', 'summon'];
    if (a.shell) return ['Kabuk', 'guard'];
    if (a.reflect) return ['Diken', 'guard'];
    if (a.aoe) return ['Alan!', 'strong'];
    if ((a.mult || 1) >= 1.5 || a.telegraph) return ['Güçlü!', 'strong'];
    if (a.status) return [STATUS_NAMES[a.status[0]], 'status'];
    return ['Vuruş', 'atk'];
  }
  // Sovalye ve Kale: Glemonlar daha az hasar alir
  petGuard() { return (1 - M('petTaken')) * (this.status.savun && M('guardPets') ? 1 - M('guardPets') : 1); }

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
    if (!S.run) return;
    S.run.pets = S.run.pets || {};
    for (const t of this.pets) S.run.pets[t.p.id] = { hp: t.hp, down: !t.alive };
  }

  async win() {
    this.over = true;
    this.busy = true;
    this.phase = null;
    this.savePetHp();
    await wait(this.scene, 350);
    sfx('win');
    const manual = this.manualActs > 0 && this.manualActs >= this.autoActs;
    const zb = zoneBonus(this.zone.key);
    const xm = (manual ? 1.2 : 1) * ((S.run && S.run.xpX) || 1) * (1 + this.aura.xp + (zb ? zb.xp : 0) + S.bonus('xpPct')) * (this.kr() === 'bol' ? 2 : 1); // 0.9 Devler Gunu: 2 kat
    const skill = WEAPON_SKILL[this.wt];
    const gains = { [skill]: this.killXp * 0.7 * xm, can: this.killXp * 0.3 * xm, savunma: this.defXp, sans: this.luckXp };
    let petMsg = '';
    const evos = [];
    for (const t of this.pets) {
      if (!t.fought) continue;
      const ac = (t.p.acc && ITEMS[t.p.acc] && ITEMS[t.p.acc].acc) || {};
      this.bagXp += this.killXp * 0.35 * xm / this.pets.length;
      const res = S.petAddXp(t.p, this.killXp * 0.6 * xm * (1 + (ac.xp || 0)));
      if (res.up) petMsg += ` · ${t.name} Sv.${res.up}!`;
      if (res.evolved > 0) evos.push({ name: GLEMONS[t.p.key].name, stage: res.evolved });
      const hu = fightBond(t.p, 1 + M('bond'));
      if (hu) petMsg += ` · <span style="color:#ff9ab4">${t.name} ${'♥'.repeat(hu)}</span>`;
    }
    gains.bag = this.bagXp;
    const ups = S.addXp(gains);
    S.save.stats.battles++;
    // 0.9 gizli basarim: canin %5 ya da altindayken kazanmak
    if (S.hp > 0 && S.hp <= S.maxHp() * 0.05) S.save.flags.kil_payi = true;
    const hatched = S.tickEggs();
    tickNest();
    const r = (x) => Math.round(x);
    const skName = SKILLS.find((x) => x.key === skill).name;
    const extra = [];
    if (gains.bag >= 1) extra.push(`+${r(gains.bag)} Bağ`);
    if (gains.sans >= 1) extra.push(`+${r(gains.sans)} Şans`);
    feed(`Zafer! +${r(gains[skill])} ${skName}, +${r(gains.can)} Can, +${r(gains.savunma)} Savunma${extra.length ? ', ' + extra.join(', ') : ''} XP${manual ? ' <span style="color:#ffd04d">(manuel +%20)</span>' : ''}${petMsg}`);
    if (this.gold > 0) { feed(`<img class="ico-inline" src="${this.w.coinUrl}">+${this.gold} ${CURRENCY}`); sfx('coin'); }
    this.cleanup(false);
    await this.w.exitBattleView();
    for (const evo of evos) await this.w.petEvolved(evo);
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
      delete S.save.eqx.tilsim;
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
    for (const t of this.pets) {
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
