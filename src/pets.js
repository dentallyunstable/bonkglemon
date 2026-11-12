// 0.12 Glemon Derinligi: huy, bag kalbi, sevdigi yemek, aksesuar, ikili takim uyumu,
// Yasayan Ahir (gunluk malzeme), ciftlestirme, kulucka ve bolge tamamlama.
import {
  GLEMONS, ITEMS, ZONE_SPAWNS, WATER_GLEMONS, NIGHT_HOME, SECRET_HOME, EGGS, TRAITS, BOND, TEAM, RANCH, NEST,
  ranchDropOf, favOf, passiveOf, ZONES, ZONE_DONE, masteryOf, EGG_BATTLES,
} from './data.js';
import { S } from './state.js';
import { giveNote } from './ui.js';
import { now as gNow } from './clock.js';

// ------------------------------------------------------------ Glemon'un yuvasi (bolgesi)
const HOME = {};
for (const [z, list] of Object.entries(ZONE_SPAWNS)) for (const [k] of list) HOME[k] = z;
for (const [k] of WATER_GLEMONS) HOME[k] = 'su';
Object.assign(HOME, NIGHT_HOME, SECRET_HOME, { ay_tavsani: 'golge' });
for (const [z, k] of Object.entries(EGGS)) HOME[k] = z;
export const homeOf = (key) => HOME[key] || null;
export const ZONE_LABEL = { orman: 'Yabani Orman', magara: 'Yankı Mağaraları', col: 'Kavurucu Çöl', buz: 'Donmuş Zirve', kor: 'Kor Diyarı', golge: 'Gölge Boşluğu', cekirdek: 'Yıldız Çekirdeği', su: 'Su' };

// ------------------------------------------------------------ ikili takim
export function teamInfo(pets) {
  if (pets.length < 2) return { sync: 0, label: '' };
  const [a, b] = pets;
  if (homeOf(a.key) && homeOf(a.key) === homeOf(b.key)) return { sync: TEAM.sameHome, label: 'Aynı yuva: statlar +%10' };
  return { sync: 0, label: '' };
}
// takimin pasiflerinden oyuncuya gelen etkiler
export function teamAura(pets) {
  const a = { pAtk: 0, pDef: 0, crit: 0, gold: 0, xp: 0, luck: 0 };
  for (const p of pets) {
    const ps = passiveOf(p.key) || {};
    for (const k of Object.keys(a)) a[k] += ps[k] || 0;
    const tr = TRAITS[p.huy] || {};
    a.luck += tr.luck || 0;
  }
  return a;
}

// ------------------------------------------------------------ bag kalbi ve yemek
export function heartsText(p) {
  const h = S.hearts(p);
  return '♥'.repeat(h) + '♡'.repeat(BOND.max - h);
}
export function petDisplayName(p) { return p.nick || S.petName(p); }
export function canFeedFav(p, now = gNow()) { return !p.fed || now - p.fed >= BOND.feedMs; }
// sevdigi yemek (gunde bir) ya da Glemon Sekeri (her zaman)
export function feedPet(p, id) {
  const it = ITEMS[id];
  if (!it || S.countItem(id) < 1) return { ok: false, msg: 'Çantanda yok.' };
  if (S.hearts(p) >= BOND.max && (p.kalp || 0) >= BOND.max * BOND.per) return { ok: false, msg: 'Kalpleri zaten dolu!' };
  let n;
  if (it.treat) n = BOND.treat;
  else if (id === favOf(p.key)) {
    if (!canFeedFav(p)) return { ok: false, msg: 'Bugün zaten yedi. Yarın tekrar ver.' };
    n = BOND.fav * ((TRAITS[p.huy] || {}).food || 1);
    p.fed = gNow();
  } else return { ok: false, msg: 'Bunu pek sevmedi.' };
  S.removeItem(id, 1);
  const up = S.addBond(p, n);
  return { ok: true, n, up, msg: up ? `${petDisplayName(p)} artık ${up} kalp!` : `+${n} bağ` };
}
// birlikte savastiktan sonra
export function fightBond(p, mult = 1) {
  const tr = TRAITS[p.huy] || {};
  const ac = (p.acc && ITEMS[p.acc] && ITEMS[p.acc].acc) || {};
  return S.addBond(p, BOND.fight * (tr.fight || 1) * (1 + (ac.bond || 0)) * mult);
}

// ------------------------------------------------------------ aksesuar
export function equipAcc(p, id) {
  if (p.acc) giveNote(S.giveSafe(p.acc, 1)); // 1.1 cila: canta doluysa Depo'ya
  p.acc = null;
  if (id && S.removeItem(id, 1) >= 1) p.acc = id;
}

// ------------------------------------------------------------ Yasayan Ahir: gunluk malzeme
export function ranchReady(p, now = gNow()) { return now - (p.rt || 0) >= RANCH.ms; }
export function ranchLeft(p, now = gNow()) { return Math.max(0, RANCH.ms - (now - (p.rt || 0))); }
export function ranchAmount(p) { return 1 + (p.stage === 2 ? 1 : 0) + (S.hearts(p) >= 3 ? 1 : 0); }
export function collectRanch(p) {
  if (!ranchReady(p)) return null;
  const id = ranchDropOf(p.key);
  const n = ranchAmount(p);
  p.rt = gNow();
  return { id, n };
}
export function readyCount() { return S.save.pets.filter((p) => ranchReady(p)).length; }

// ------------------------------------------------------------ ciftlestirme
export function breedReady(p, now = gNow()) { return !p.bred || now - p.bred >= NEST.breedCd; }
export function breedWhy(a, b) {
  if (!a || !b || a.id === b.id) return 'İki farklı Glemon seç.';
  if (a.stage < 2 || b.stage < 2) return 'İkisi de Usta olmalı (Sv. 35).';
  const ga = GLEMONS[a.key]; const gb = GLEMONS[b.key];
  if (ga.egg || gb.egg) return 'Efsanevi Glemonlar yumurta bırakmaz.';
  if (ga.type !== gb.type && homeOf(a.key) !== homeOf(b.key)) return 'Uyumlu değiller: aynı tipten ya da aynı bölgeden olmalılar.';
  if (!breedReady(a) || !breedReady(b)) return 'Biri yorgun. Günde bir kez yumurta bırakabilirler.';
  if (S.save.eggs.length >= NEST.basket) return `Yumurta sepeti dolu (${NEST.basket}). Önce kuluçkaya koy.`;
  return null;
}
export function breed(a, b) {
  const why = breedWhy(a, b);
  if (why) return { ok: false, msg: why };
  const key = Math.random() < 0.5 ? a.key : b.key;
  const huy = Math.random() < NEST.traitKeep ? (Math.random() < 0.5 ? a.huy : b.huy) : null;
  const shiny = Math.random() < NEST.shinyBase + NEST.shinyParent * ((a.shiny ? 1 : 0) + (b.shiny ? 1 : 0));
  const egg = { key, huy, shiny, from: [a.key, b.key] };
  S.save.eggs.push(egg);
  a.bred = b.bred = gNow();
  S.save.stats.bred = (S.save.stats.bred || 0) + 1;
  return { ok: true, egg };
}

// ------------------------------------------------------------ kulucka (3 yuva)
export function hasNest() { return Object.values(S.save.plot.cells).some((c) => c && c.id === 'kulucka' && !c.top && !c.part); }
export function nestNeed() { return Math.round(NEST.legendBattles * (S.has('yumurta_bakicisi') ? 0.6 : 1)); }
// sepetten (i) ya da cantadaki efsanevi yumurtadan (bag yuvasi) kuluckaya koy
export function putBasketEgg(slot, i) {
  if (S.save.nest[slot] || !S.save.eggs[i]) return false;
  const e = S.save.eggs.splice(i, 1)[0];
  S.save.nest[slot] = { ...e, t0: gNow(), ms: NEST.bredMs };
  return true;
}
export function putBagEgg(slot, bagIdx) {
  const s = S.save.bag[bagIdx];
  if (S.save.nest[slot] || !s || !ITEMS[s.id] || !ITEMS[s.id].egg) return false;
  const key = EGGS[ITEMS[s.id].egg];
  // cantada biriken ilerleme korunur (100 uzerinden), kuluckada 80 yeter
  const p = Math.round(((s.p || 0) / EGG_BATTLES) * nestNeed());
  S.save.nest[slot] = { key, legend: ITEMS[s.id].egg, item: s.id, p, shiny: Math.random() < 0.05 };
  if (s.n > 1) { s.n--; s.p = 0; } else S.save.bag[bagIdx] = null;
  return true;
}
export function nestProgress(e, now = gNow()) {
  if (!e) return 0;
  if (e.legend) return Math.min(1, (e.p || 0) / nestNeed());
  return Math.min(1, (now - e.t0) / e.ms);
}
export function nestLeftText(e, now = gNow()) {
  if (e.legend) return `${Math.max(0, nestNeed() - (e.p || 0))} savaş`;
  const ms = Math.max(0, e.ms - (now - e.t0));
  const m = Math.ceil(ms / 60000);
  return m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`;
}
// her zaferde kuluckadaki efsanevi yumurtalar bir adim
export function tickNest() {
  for (const e of S.save.nest) if (e && e.legend) e.p = Math.min(nestNeed(), (e.p || 0) + 1);
}
export function hatch(slot) {
  const e = S.save.nest[slot];
  if (!e || nestProgress(e) < 1) return { ok: false };
  if (S.save.pets.length >= S.ahirSize()) return { ok: false, msg: `Ahırın dolu (${S.ahirSize()} yer).` };
  const pet = S.addPet(e.key, 0, e.shiny, 1, e.huy);
  if (!pet) return { ok: false };
  S.save.nest[slot] = null;
  S.save.stats.hatched = (S.save.stats.hatched || 0) + 1;
  S.seeGlemon(e.key, pet.shiny);
  return { ok: true, pet };
}
export function nestReadyCount() { return S.save.nest.filter((e) => e && nestProgress(e) >= 1).length; }

// ------------------------------------------------------------ Albüm 2.0
export function zoneSpecies(z) {
  if (z === 'su') return WATER_GLEMONS.map(([k]) => k).filter((k) => !GLEMONS[k].secret);
  return ZONE_SPAWNS[z].map(([k]) => k);
}
export const ZONE_KEYS = [...ZONES.map((z) => z.key), 'su'];
export function zoneTamed(z) { const l = zoneSpecies(z); return { n: l.filter((k) => S.save.album.tamed[k]).length, of: l.length }; }
export function zoneComplete(z) { const t = zoneTamed(z); return t.n >= t.of; }
export function zoneBonus(z) { return S.save.zoneDone[z] ? ZONE_DONE : null; }
export function recordDrop(key, id) {
  const d = S.save.album.drops;
  (d[key] = d[key] || {})[id] = 1;
}
// 4. ustalik: o turun parlak sansi 2 kat
export function shinyMastery(key) { return masteryOf((S.save.stats.glemons || {})[key] || 0).lvl >= 4 ? 2 : 1; }
