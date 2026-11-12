// Denge hesabi (denetim raporundaki iki tablonun aynisi). Kullanim: node tools/test/balance.mjs
// Duz ilerleyen oyuncu: geri donmeden, kat basina ~4,5 Glemon, otomatik savas, yoldassiz, duz saldiri.
// Her bolgede o bolgenin esyasini (giyebildigi an) giyer. Tahminidir; gercek oyunda yetenekler ve yoldas savasi kisaltir.
import * as D from '../../src/data.js';

const xpForLevel = (l) => (l <= 1 ? 0 : Math.floor(10.6 * Math.pow(l - 1, 2) * Math.pow(2, (l - 1) / 18.5)));
const lvl = (xp) => { let l = 1; while (l < 99 && xpForLevel(l + 1) <= xp) l++; return l; };
const dmgf = (atk, def) => atk * 100 / (100 + def);
const RM = { siradan: 1, nadir: 1.6, epik: 2.5, efsanevi: 15 };
const SPLIT = D.XP_SPLIT || { weapon: 0.7, can: 0.3, savunma: 0 };
const KPF = 4.5;
const I = D.ITEMS;
// bolgenin esyasi (rapordaki tablo)
const ZONE_GEAR = { orman: 'tas', magara: 'demir', col: 'kristal', buz: 'kristal', kor: 'kor', golge: 'bonkit', cekirdek: 'golge' };
const weaponOf = (t) => I[`${t}_kilic`];
const armorOf = (t) => ['kask', 'gogus', 'bot'].map((k) => I[`${t}_${k}`]);
const TIER_ORDER = ['tas', 'demir', 'kristal', 'kor', 'bonkit', 'golge'];

const xp = { saldiri: 0, can: 0, savunma: 0 };
let pending = { w: null, a: null };
const rows = []; const bossRows = []; let wall = [];
function bestGear(zoneIdx) {
  const avail = TIER_ORDER.slice(0, TIER_ORDER.indexOf(ZONE_GEAR[D.ZONES[zoneIdx].key]) + 1);
  let w = I.tahta_kilic; let ar = [];
  for (const t of avail) {
    const wi = weaponOf(t); if (lvl(xp.saldiri) >= (wi.req ? wi.req[1] : 0)) w = wi;
    const a = armorOf(t); if (lvl(xp.savunma) >= (a[0].req ? a[0].req[1] : 0)) ar = a;
  }
  return { w, def: ar.reduce((t, x) => t + x.def, 0) };
}
const stats = (zi) => { const g = bestGear(zi); return { atk: lvl(xp.saldiri) + g.w.power, def: lvl(xp.savunma) + g.def, hp: 50 + 10 * lvl(xp.can), w: g.w }; };
const deathsAt = [];
for (let zi = 0; zi < D.ZONES.length; zi++) {
  const z = D.ZONES[zi];
  // giris gucu bekleme: gucu yetmezse onceki bolgenin son katinda kasar
  let grind = 0;
  while (stats(Math.max(0, zi - 1)).atk < z.atk && grind < 2000) {
    const f = z.floors[0] - 1; kill(f, zi - 1, 1); grind++;
  }
  if (grind) wall.push(`${z.name}: giris ${z.atk} icin ${grind} Glemon fazladan (${lvl(xp.saldiri)} Saldiri)`);
  for (let f = z.floors[0]; f <= z.floors[1]; f++) {
    kill(f, zi, KPF);
    if (f === z.floors[1]) boss(f, zi);
  }
  rows.push({ zone: `${z.name}, Kat ${z.floors[1]}`, saldiri: lvl(xp.saldiri), can: lvl(xp.can), savunma: lvl(xp.savunma), gear: ZONE_GEAR[z.key], req: weaponOf(ZONE_GEAR[z.key]).req[1], entry: z.atk });
}
function avgEnemy(zk) {
  const sp = D.ZONE_SPAWNS[zk]; let w = 0; const o = { hp: 0, atk: 0, def: 0, spd: 0, rm: 0 };
  for (const [k, p] of sp) { const g = D.GLEMONS[k]; w += p; o.hp += g.hp * p; o.atk += g.atk * p; o.def += g.def * p; o.spd += g.spd * p; o.rm += (RM[g.rarity] || 1) * p; }
  for (const k of Object.keys(o)) o[k] /= w; return o;
}
function kill(f, zi, n) {
  const z = D.ZONES[zi]; const e = avgEnemy(z.key); const m = D.floorMult(f); const zf = f - z.floors[0] + 1;
  const [p2, p1] = D.wildStageChances(zf); const stx = 1 + 0.6 * (p1 + 2 * p2);
  const kx = (D.killXpMult ? D.killXpMult(f) : 1);
  const per = 8 * Math.pow(f, 1.2) * e.rm * stx * kx;
  const s = stats(zi);
  const hits = (e.hp * m) / dmgf(s.atk, e.def * m);
  const taken = hits * (e.spd / 100) * dmgf(e.atk * m * (D.earlyAtk ? D.earlyAtk(z.key, zf) : 1), s.def);
  const total = per * n;
  xp.saldiri += total * SPLIT.weapon; xp.can += total * SPLIT.can; xp.savunma += total * SPLIT.savunma + taken * 0.6 * n;
}
function boss(f, zi) {
  const z = D.ZONES[zi]; const b = D.GLEMONS[z.boss]; const m = D.floorMult(f); const s = stats(zi);
  const hp = b.hp * m; const hits = hp / dmgf(s.atk, b.def * m); const hitPct = dmgf(b.atk * m, s.def) / s.hp;
  bossRows.push({ boss: b.name, hp: Math.round(hp), hits: Math.round(hits), pct: Math.round(hitPct * 100) });
  const total = 8 * Math.pow(f, 1.2) * 15;
  xp.saldiri += total * SPLIT.weapon; xp.can += total * SPLIT.can; xp.savunma += total * SPLIT.savunma;
}
// D3: yeni oyuncu Kat 1-3 (Pasli Kilic, zirhsiz, 60 can); 2 savas basina kac can gider
const fresh = { atk: 1 + 4, def: 1, hp: 60 };
const early = [1, 2, 3].map((f) => { const e = avgEnemy('orman'); const m = D.floorMult(f); const ea = D.earlyAtk ? D.earlyAtk('orman', f) : 1; const hits = e.hp * m / dmgf(fresh.atk, e.def * m); return Math.round(hits * (e.spd / 100) * dmgf(e.atk * m * ea, fresh.def) * 1.6); });

console.log('Bolge sonu | Saldiri | Can | Savunma | Bolge esyasi (seviye) | Giris gucu');
for (const r of rows) console.log(`${r.zone} | ${r.saldiri} | ${r.can} | ${r.savunma} | ${r.gear} ${r.req} | ${r.entry}`);
console.log('\nPatron | Can | Duz vurusla kac vurus | Normal vurusu canin %');
for (const r of bossRows) console.log(`${r.boss} | ${r.hp} | ${r.hits} | %${r.pct}`);
console.log('\nGiris duvarlari:', wall.length ? '\n' + wall.join('\n') : 'yok');
console.log('Yeni oyuncu Kat 1/2/3: 1,6 Glemonluk savasta kaybedilen can (60 uzerinden):', early.join(' / '));
// D2: onerilen giris gucleri = onceki bolgenin esyasini giyip o bolgeyi bitiren oyuncunun gucunun %90'i
const sug = rows.slice(0, -1).map((r, i) => `${D.ZONES[i + 1].key} ${Math.floor(0.9 * (r.saldiri + weaponOf(r.gear).power))}`);
console.log('Onerilen giris gucleri:', sug.join(', '));
