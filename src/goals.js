// 0.9 Hedefler (yol haritasi, Eren onayi 2026-11-10): her gun girmek icin bir sebep ve uzun hedefler.
// Gunluk ve haftalik gorevler, Lale Pulu, basarimlar, unvanlar, beceri pelerinleri ve etkinlik takvimi
// (Gunun Zindani, hafta sonu etkinligi, Gezgin Tuccar, Dolunay Gecesi).
// Takvim gercek saate bagli. Saat geri alinirsa yenilenme ve etkinlik odulu durur (kasilmasin diye).
import { S } from './state.js';
import { SKILLS, GLEMONS, ITEMS, FISH, ZONES } from './data.js';

export const PUL = 'Lale Pulu';
const DAY = 86400000;

// ------------------------------------------------------------ saat ve takvim
// Saat, bugune kadar gorulen en ileri zamandan 10 dakikadan fazla geride ise "geri alinmis" sayilir.
export function clockOk() {
  const c = S.save.clock || (S.save.clock = { max: 0 });
  const now = Date.now();
  if (now + 10 * 60000 < c.max) return false;
  if (now > c.max) c.max = now;
  return true;
}
export function dayNum(t = Date.now()) { return Math.floor((t - new Date(t).getTimezoneOffset() * 60000) / DAY); }
// 0 pazar, 1 pazartesi ... 6 cumartesi (1970-01-01 persembe)
export function weekday(t = Date.now()) { return (dayNum(t) + 4) % 7; }
// pazartesiden baslayan hafta numarasi
export function weekNum(t = Date.now()) { return Math.floor((dayNum(t) - 4) / 7); }
export function nextMidnight(t = Date.now()) { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime(); }
export function dayStart(t = Date.now()) { const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }
export function nextMonday(t = Date.now()) { const wd = weekday(t); const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + ((8 - wd) % 7 || 7)).getTime(); }
export function fmtLeft(ms) {
  const m = Math.max(1, Math.ceil(ms / 60000));
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa ${m % 60} dk`;
  return `${Math.floor(h / 24)} gün ${h % 24} sa`;
}

// Dolunay: gercek takvimdeki dolunayin oldugu gun (yerel saatle 00:00-24:00)
const SYN = 29.530588853;
const FULL_REF = Date.UTC(2000, 0, 21, 4, 41);
function fullMoonNear(t) { const k = Math.round((t - FULL_REF) / DAY / SYN); return FULL_REF + k * SYN * DAY; }
export function fullMoon(t = Date.now()) {
  if (typeof window !== 'undefined' && window.__moon !== undefined) return !!window.__moon;
  return dayNum(fullMoonNear(t)) === dayNum(t);
}
export function nextFullMoon(t = Date.now()) {
  let fm = fullMoonNear(t);
  if (dayNum(fm) <= dayNum(t)) fm += SYN * DAY;
  return dayStart(fm);
}

// Gunun Zindani: her gun baska bir kural
export const DAILY_RULES = [
  { k: 'ates', n: 'Ateş Günü', d: 'Sadece ateş Glemonları çıkar.' },
  { k: 'altin', n: 'Altın Günü', d: 'Savaşlardan çift Çimen Bloğu düşer.' },
  { k: 'karanlik', n: 'Karanlık Gün', d: 'Bütün odalar karanlık. Fenerini unutma!' },
  { k: 'parlak', n: 'Parıltı Günü', d: 'Parlak Glemon şansı 3 kat.' },
  { k: 'buz', n: 'Buz Günü', d: 'Sadece buz Glemonları çıkar.' },
  { k: 'dev', n: 'Devler Günü', d: 'Bütün Glemonlar Usta aşamasında, ama XP 2 kat.' },
];
export function todayRule() { return DAILY_RULES[dayNum() % DAILY_RULES.length]; }
// Hafta sonu etkinligi: cuma, cumartesi, pazar. Haftadan haftaya patron kosusu / balik turnuvasi
export function weekendNow(t = Date.now()) { const wd = weekday(t); return wd === 5 || wd === 6 || wd === 0; }
export function weekendKind(t = Date.now()) { return weekNum(t) % 2 === 0 ? 'patron' : 'balik'; }
export function weekendEnds(t = Date.now()) { return nextMonday(t); }
export function weekendStarts(t = Date.now()) { const wd = weekday(t); const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + ((5 - wd + 7) % 7)).getTime(); }
export const FISH_TOUR = [10, 25, 50]; // balik turnuvasi: hafta sonu tutulan balik esikleri
export const FISH_TOUR_PUL = [2, 3, 5];
// Gezgin Tuccar: cumartesi ve pazar ussun ortasinda
export function merchantHere(t = Date.now()) {
  if (typeof window !== 'undefined' && window.__merchant !== undefined) return !!window.__merchant;
  const wd = weekday(t); return wd === 6 || wd === 0;
}
export function merchantNext(t = Date.now()) { const wd = weekday(t); const d = new Date(t); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + ((6 - wd + 7) % 7)).getTime(); }

// ------------------------------------------------------------ Gezgin Tuccar vitrini
// [esya, adet, fiyat (Lale Pulu)]. Her hafta 6 tanesi secilir; her biri haftada bir kez alinir.
export const MERCHANT = [
  ['ay_tasi', 8, 3], ['altin_tugla', 8, 4], ['pembe_yaprak', 8, 3], ['mavi_fener', 2, 4],
  ['ay_tohumu', 2, 3], ['altin_tohum', 1, 6], ['can_tilsimi', 1, 8], ['altin_elma', 2, 4],
  ['buyuk_iksir', 3, 3], ['parlak_yem', 2, 5], ['canta_eki', 1, 12], ['tuccar_pelerini', 1, 15],
];
function seeded(n) { let x = (n * 2654435761) >>> 0; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
export function merchantStock(t = Date.now()) {
  const r = seeded(weekNum(t) + 913);
  const list = MERCHANT.filter(([id]) => ITEMS[id]).slice();
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list.slice(0, 6);
}

// ------------------------------------------------------------ gunluk ve haftalik gorevler
const ST = (k) => (s) => s.stats[k] || 0;
export const DAILY = {
  kill: { t: (n) => `${n} Glemon yen`, stat: ST('kills'), amt: [15, 25], skill: 'saldiri' },
  mine: { t: (n) => `${n} blok kaz`, stat: ST('mined'), amt: [20, 35], skill: 'madencilik' },
  fish: { t: (n) => `${n} balık tut`, stat: ST('fished'), amt: [4, 8], skill: 'balikcilik' },
  gather: { t: (n) => `${n} kez toplama yap`, stat: ST('gathered'), amt: [4, 8], skill: 'toplama' },
  craft: { t: (n) => `${n} eşya üret`, stat: ST('crafted'), amt: [3, 6], skill: 'uretim' },
  place: { t: (n) => `Arsana ${n} blok koy`, stat: ST('placed'), amt: [10, 20], skill: 'insa' },
  zfloor: { t: (n) => `Zindan'da ${n} kat in`, stat: ST('zfloors'), amt: [4, 6], skill: 'savunma' },
  tame: { t: () => '1 Glemon evcilleştir', stat: ST('tamed'), amt: [1, 1], skill: 'bag', bag: true },
};
export const WEEKLY = {
  boss: { t: (n) => `${n} patron ya da ara patron yen`, stat: (s) => (s.stats.bossKills || 0) + (s.stats.golden || 0), amt: [4], skill: 'sans' },
  zfloor: { t: (n) => `Zindan'da toplam ${n} kat in`, stat: ST('zfloors'), amt: [30], skill: 'savunma' },
  mine: { t: (n) => `${n} blok kaz`, stat: ST('mined'), amt: [200], skill: 'madencilik' },
  kill: { t: (n) => `${n} Glemon yen`, stat: ST('kills'), amt: [200], skill: 'saldiri' },
  fish: { t: (n) => `${n} balık tut`, stat: ST('fished'), amt: [40], skill: 'balikcilik' },
  craft: { t: (n) => `${n} eşya üret`, stat: ST('crafted'), amt: [30], skill: 'uretim' },
  gather: { t: (n) => `${n} kez toplama yap`, stat: ST('gathered'), amt: [40], skill: 'toplama' },
  tame: { t: (n) => `${n} Glemon evcilleştir`, stat: ST('tamed'), amt: [3], skill: 'bag', bag: true },
};

function newGoal(pool, kind, weekly) {
  const def = pool[kind];
  const lvl = S.totalLevel();
  const scale = 1 + lvl / 60;
  const target = def.amt[Math.floor(Math.random() * def.amt.length)];
  return {
    k: kind, target, base: def.stat(S.save), claimed: false,
    gold: Math.round((weekly ? 220 : 40) * scale), xp: Math.round((weekly ? 900 : 180) * scale * scale), pul: weekly ? 5 : 1,
  };
}
function pickKinds(pool, n) {
  const ks = Object.keys(pool).filter((k) => !pool[k].bag || S.level('bag') >= 1);
  for (let i = ks.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [ks[i], ks[j]] = [ks[j], ks[i]]; }
  return ks.slice(0, n);
}
export function goals() {
  if (!S.save.goals) S.save.goals = { day: -1, daily: [], dchest: false, week: -1, weekly: [], wchest: false, dDone: 0, wDone: 0 };
  return S.save.goals;
}
// Gun ya da hafta degistiyse gorevleri yeniler. Saat geri alindiysa hicbir sey yenilenmez.
export function refreshGoals() {
  const g = goals();
  if (!clockOk()) return false;
  const d = dayNum(); const w = weekNum();
  if (d > g.day) { g.day = d; g.daily = pickKinds(DAILY, 3).map((k) => newGoal(DAILY, k, false)); g.dchest = false; }
  if (w > g.week) { g.week = w; g.weekly = pickKinds(WEEKLY, 2).map((k) => newGoal(WEEKLY, k, true)); g.wchest = false; }
  return true;
}
export function goalDef(q, weekly) { return (weekly ? WEEKLY : DAILY)[q.k]; }
export function goalText(q, weekly) { return goalDef(q, weekly).t(q.target); }
export function goalProgress(q, weekly) { return Math.min(q.target, Math.max(0, goalDef(q, weekly).stat(S.save) - q.base)); }
export function readyCount() {
  const g = goals();
  let n = 0;
  for (const q of g.daily) if (!q.claimed && goalProgress(q, false) >= q.target) n++;
  for (const q of g.weekly) if (!q.claimed && goalProgress(q, true) >= q.target) n++;
  if (!g.dchest && g.daily.length && g.daily.every((q) => q.claimed)) n++;
  if (!g.wchest && g.weekly.length && g.weekly.every((q) => q.claimed)) n++;
  return n;
}
export function addPul(n) { S.save.pul = (S.save.pul || 0) + n; }

// ------------------------------------------------------------ basarimlar
// 22 basarim x 3 kademe (bronz, gumus, altin) = 66, arti 4 gizli. Hepsi kayittaki sayaclardan
// hesaplanir, bu yuzden eski kayitlarda da geriye donuk acilir.
export const ACH_GROUPS = ['Savaş', 'Toplayıcı', 'Zanaat', 'Glemon', 'Keşif'];
export const TIER_NAMES = ['Bronz', 'Gümüş', 'Altın'];
export const TIER_PTS = [5, 10, 25];
const lv = (k) => () => S.level(k);
const fishN = () => Object.keys(FISH).length;
const glemonN = () => Object.keys(GLEMONS).length;
export const ACH = [
  { k: 'kills', g: 0, n: 'Glemon Avcısı', d: (t) => `${t} Glemon yen`, v: (s) => s.stats.kills, t: [100, 1000, 10000] },
  { k: 'boss', g: 0, n: 'Patron Deviren', d: (t) => `${t} bölge patronu yen`, v: (s) => s.stats.bossKills, t: [1, 10, 50] },
  { k: 'golden', g: 0, n: 'Altın Avı', d: (t) => `${t} ara patron (Altın Glemon) yen`, v: (s) => s.stats.golden || 0, t: [1, 10, 50] },
  { k: 'zindan', g: 0, n: 'Dipsiz Kuyu', d: (t) => `Zindan'da Kat ${t}'e in`, v: (s) => s.stats.zindanBest || 0, t: [10, 25, 50] },
  { k: 'warrior', g: 0, n: 'Silah Ustası', d: (t) => `Saldırı ya da Okçuluk ${t}. seviye`, v: () => Math.max(S.level('saldiri'), S.level('okculuk')), t: [30, 60, 99] },
  { k: 'mined', g: 1, n: 'Kazmacı', d: (t) => `${t} blok kaz`, v: (s) => s.stats.mined, t: [200, 2000, 10000] },
  { k: 'gathered', g: 1, n: 'Sepet Dolusu', d: (t) => `${t} kez toplama yap`, v: (s) => s.stats.gathered, t: [50, 500, 3000] },
  { k: 'fished', g: 1, n: 'Oltacı', d: (t) => `${t} balık tut`, v: (s) => s.stats.fished || 0, t: [25, 250, 1500] },
  { k: 'fishsp', g: 1, n: 'Balık Kataloğu', d: (t) => `${t} tür balık tut`, v: (s) => Object.keys((s.fishing && s.fishing.caught) || {}).length, t: () => [5, 12, fishN()] },
  { k: 'crafted', g: 2, n: 'Zanaatkâr', d: (t) => `${t} eşya üret`, v: (s) => s.stats.crafted, t: [25, 250, 1500] },
  { k: 'placed', g: 2, n: 'Yapıcı', d: (t) => `Arsana ${t} blok koy`, v: (s) => s.stats.placed || 0, t: [50, 500, 2500] },
  { k: 'score', g: 2, n: 'Güzel Üs', d: (t) => `Üs Puanı ${t}`, v: () => S.baseScore(), t: [50, 200, 600] },
  { k: 'anvil', g: 2, n: 'Örsün Efendisi', d: (t) => `Bir eşyayı Örste +${t} yap`, v: (s) => Math.max(0, ...Object.values(s.upg || {})), t: [1, 2, 4] },
  { k: 'seen', g: 3, n: 'Albümcü', d: (t) => `${t} Glemon türü gör`, v: (s) => Object.keys(s.album.seen).length, t: () => [10, 25, glemonN()] },
  { k: 'tamed', g: 3, n: 'Bakıcı', d: (t) => `${t} Glemon evcilleştir`, v: (s) => s.stats.tamed || 0, t: [1, 10, 40] },
  { k: 'shiny', g: 3, n: 'Parıltı Avcısı', d: (t) => `${t} parlak Glemon yen`, v: (s) => s.stats.shiny, t: [1, 5, 20] },
  { k: 'hatch', g: 3, n: 'Yumurta Bakıcısı', d: (t) => `${t} efsanevi yumurta çatlat`, v: (s) => s.stats.hatched || 0, t: [1, 3, 6] },
  { k: 'petlvl', g: 3, n: 'Sadık Dost', d: (t) => `Bir evcil Glemon'u ${t}. seviyeye çıkar`, v: (s) => Math.max(0, ...s.pets.map((p) => p.lvl)), t: [15, 35, 50] },
  { k: 'deepest', g: 4, n: 'Kâşif', d: (t) => `Keşifte Kat ${t}'e in`, v: (s) => s.stats.deepest, t: [10, 30, 60] },
  { k: 'total', g: 4, n: 'Çok Yönlü', d: (t) => `Toplam seviye ${t}`, v: () => S.totalLevel(), t: [150, 500, 1000] },
  { k: 'daily', g: 4, n: 'Lale\'nin Yardımcısı', d: (t) => `${t} günlük görev bitir`, v: (s) => (s.goals && s.goals.dDone) || 0, t: [10, 60, 250] },
  { k: 'hours', g: 4, n: 'Sadık Oyuncu', d: (t) => `${t} saat oyna`, v: (s) => Math.floor(s.stats.playMs / 3600000), t: [5, 25, 100] },
  { k: 'kule', g: 0, n: 'Kule Fatihi', d: (t) => `Sonsuz Kule'de Kat ${t}'i geç`, v: (s) => s.stats.kuleBest || 0, t: [10, 25, 50] },
];
export const SECRET = [
  { k: 'ilk_parlak', n: 'Bu Ne Parlıyor?', d: 'İlk parlak Glemonunu gör', v: (s) => s.stats.shiny > 0 || Object.keys(s.album.shiny).length > 0 },
  { k: 'tek_vurus', n: 'Tek Darbe', d: 'Bir patronu ya da ara patronu tek vuruşta bitir', v: (s) => !!(s.flags && s.flags.tek_vurus) },
  { k: 'kil_payi', n: 'Kıl Payı', d: 'Canın %5 ya da altındayken bir savaş kazan', v: (s) => !!(s.flags && s.flags.kil_payi) },
  { k: 'ay_isigi', n: 'Ay Işığında', d: 'Dolunay Tavşanı ile karşılaş', v: (s) => !!s.album.seen.ay_tavsani },
];
export const SECRET_PTS = 15;
export function achTargets(a) { return typeof a.t === 'function' ? a.t() : a.t; }
export function achTier(a) { const v = a.v(S.save); return achTargets(a).filter((t) => v >= t).length; }
export function achPoints() {
  let p = 0;
  for (const a of ACH) { const t = achTier(a); for (let i = 0; i < t; i++) p += TIER_PTS[i]; }
  for (const a of SECRET) if (a.v(S.save)) p += SECRET_PTS;
  return p;
}
export function achCount() {
  let n = 0;
  for (const a of ACH) n += achTier(a);
  for (const a of SECRET) if (a.v(S.save)) n++;
  return n;
}
export const ACH_TOTAL = ACH.length * 3 + SECRET.length;

// ------------------------------------------------------------ unvanlar
// bonus: [beceri, oran] o beceriye gelen XP'yi en fazla %3 arttirir (secim anlamli ama zorunlu degil)
const st = (k, n) => () => (S.save.stats[k] || 0) >= n;
const sk = (k, n) => () => S.level(k) >= n;
export const TITLES = [
  { k: 'caylak', n: 'Çaylak', req: 'Herkese açık', ok: () => true },
  { k: 'savasci', n: 'Savaşçı', req: 'Saldırı 40', ok: sk('saldiri', 40), bonus: ['saldiri', 0.02] },
  { k: 'keskin_goz', n: 'Keskin Göz', req: 'Okçuluk 40', ok: sk('okculuk', 40), bonus: ['okculuk', 0.02] },
  { k: 'yikilmaz', n: 'Yıkılmaz', req: 'Savunma 50', ok: sk('savunma', 50), bonus: ['savunma', 0.02] },
  { k: 'madenci', n: 'Madenci', req: 'Madencilik 30', ok: sk('madencilik', 30), bonus: ['madencilik', 0.02] },
  { k: 'usta_madenci', n: 'Usta Madenci', req: 'Madencilik 70', ok: sk('madencilik', 70), bonus: ['madencilik', 0.03] },
  { k: 'balikci', n: 'Usta Balıkçı', req: 'Balıkçılık 50', ok: sk('balikcilik', 50), bonus: ['balikcilik', 0.03] },
  { k: 'ot_bilgini', n: 'Ot Bilgini', req: 'Toplama 40', ok: sk('toplama', 40), bonus: ['toplama', 0.03] },
  { k: 'zanaatkar', n: 'Zanaatkâr', req: 'Üretim 50', ok: sk('uretim', 50), bonus: ['uretim', 0.03] },
  { k: 'mimar', n: 'Mimar', req: 'İnşa 50', ok: sk('insa', 50), bonus: ['insa', 0.03] },
  { k: 'dost', n: 'Glemon Dostu', req: '10 Glemon evcilleştir', ok: st('tamed', 10), bonus: ['bag', 0.03] },
  { k: 'sansli', n: 'Şanslı', req: 'Bir parlak Glemon yen', ok: st('shiny', 1), bonus: ['sans', 0.03] },
  { k: 'golem', n: 'Golem Kıran', req: 'Taş Golemi\'ni yen', ok: () => (S.save.stats.glemons.tas_golemi || 0) > 0 },
  { k: 'avci', n: 'Avcı', req: '1000 Glemon yen', ok: st('kills', 1000) },
  { k: 'kahraman', n: 'Kahraman', req: '25 bölge patronu yen', ok: st('bossKills', 25) },
  { k: 'zindan_faresi', n: 'Zindan Faresi', req: 'Zindan Kat 25', ok: st('zindanBest', 25) },
  { k: 'bosluk', n: 'Boşluk Yürüyücüsü', req: 'Boşluk Bekçisi\'ni yen', ok: () => (S.save.stats.glemons.bosluk_bekcisi || 0) > 0 },
  { k: 'gozde', n: 'Lale\'nin Gözdesi', req: '60 günlük görev bitir', ok: () => goals().dDone >= 60 },
  { k: 'koleksiyoncu', n: 'Koleksiyoncu', req: 'Albümü %100 doldur', ok: () => Object.keys(S.save.album.seen).length >= glemonN() },
  { k: 'ay_cocugu', n: 'Ay Çocuğu', req: 'Dolunay Tavşanı ile karşılaş', ok: () => !!S.save.album.seen.ay_tavsani },
  { k: 'basarim', n: 'Başarım Avcısı', req: '300 başarım puanı', ok: () => achPoints() >= 300 },
  { k: 'yapici', n: 'Usta Yapıcı', req: 'Üs Puanı 250', ok: () => (S.save.plot.bestScore || 0) >= 250 },
  { k: 'buyuk_mimar', n: 'Büyük Mimar', req: 'Üs Puanı 1000', ok: () => (S.save.plot.bestScore || 0) >= 1000 },
  { k: 'efsane', n: 'Efsane', req: 'Bir beceride 99', ok: () => SKILLS.some((s) => S.level(s.key) >= 99) },
];
export function titleOf() { return TITLES.find((t) => t.k === S.save.title) || null; }
// state.addXp bu kancayi kullanir: secili unvan o beceriye XP bonusu verir
S.xpBonus = (skill) => { const t = titleOf(); return t && t.bonus && t.bonus[0] === skill && t.ok() ? 1 + t.bonus[1] : 1; };

// ------------------------------------------------------------ pelerinler
// Bir beceri 99 olunca o becerinin pelerini, herhangi biri 50 olunca Cirak Pelerini.
export function capeFor(skill) { return `pelerin_${skill}`; }

// ------------------------------------------------------------ albume tamamlama odulleri
export const ALBUM_RW = [
  { pct: 25, gold: 500, pul: 3 },
  { pct: 50, gold: 1500, pul: 5, item: 'can_tilsimi' },
  { pct: 75, gold: 4000, pul: 8, item: 'parlak_yem' },
  { pct: 100, gold: 10000, pul: 15, item: 'altin_elma' },
];
export function albumPct() { return Math.floor((Object.keys(S.save.album.seen).length / glemonN()) * 100); }

// Gunluk/haftalik sandik icerigi (rastgele malzeme, kucuk ihtimalle nadir esya; haftalik garanti nadir)
export function chestLoot(weekly) {
  const zs = ZONES.filter((z) => z.open && (!z.after || (S.save.stats.glemons[z.after] || 0) > 0));
  return { zones: zs, weekly };
}

// Parlak sansi: dolunayda 2 kat (state.shinyChance bu kancayi kullanir)
S.shinyMult = () => (fullMoon() ? 2 : 1);

// ------------------------------------------------------------ bildirim turu
// Degisikliklerden sonra cagrilir: yeni basarim kademeleri, unvanlar ve pelerinler.
// Ilk cagrida (eski kayit) hepsi sessizce islenir, tek bir ozet bildirimi gider.
export function goalTick(notify) {
  const s = S.save;
  if (!s) return;
  if (!s.ach) s.ach = {};
  if (!s.capes) s.capes = {};
  const first = !s.ach._init;
  let opened = 0;
  for (const a of ACH) {
    const t = achTier(a);
    const had = s.ach[a.k] || 0;
    if (t > had) {
      s.ach[a.k] = t;
      opened += t - had;
      if (!first) notify('ach', { name: a.n, tier: TIER_NAMES[t - 1], big: t === 3 });
    }
  }
  for (const a of SECRET) {
    if (!s.ach[a.k] && a.v(s)) {
      s.ach[a.k] = 1;
      opened++;
      if (!first) notify('ach', { name: `${a.n} (gizli)`, big: true });
    }
  }
  if (!s.titlesSeen) s.titlesSeen = {};
  for (const t of TITLES) {
    if (!s.titlesSeen[t.k] && t.ok()) {
      s.titlesSeen[t.k] = true;
      if (!first && t.k !== 'caylak') notify('title', { name: t.n });
    }
  }
  // pelerinler: 99 olan beceri ve ilk 50
  const give = (id) => {
    let where = 'bag';
    if (S.addItemRaw(id, 1, 'bag') > 0) { where = 'depo'; S.addItemRaw(id, 1, 'depo'); }
    notify('cape', { name: ITEMS[id].name, where });
  };
  for (const sk of SKILLS) {
    if (S.level(sk.key) >= 99 && !s.capes[sk.key]) { s.capes[sk.key] = true; give(capeFor(sk.key)); }
  }
  if (!s.capes.cirak && SKILLS.some((sk) => S.level(sk.key) >= 50)) { s.capes.cirak = true; give('cirak_pelerini'); }
  // balik turnuvasi hafta sonu baslarken sayac baslar
  if (weekendNow() && weekendKind() === 'balik' && s.ev.tourWeek !== weekNum() && clockOk()) {
    s.ev.tourWeek = weekNum(); s.ev.tourBase = s.stats.fished || 0; s.ev.tour = [];
  }
  if (first) { s.ach._init = true; notify('init', { ach: opened }); }
  if (opened || first) S.persistSoon();
}
export function tourCount() {
  const s = S.save;
  if (!(weekendNow() && weekendKind() === 'balik') || s.ev.tourWeek !== weekNum()) return 0;
  return Math.max(0, (s.stats.fished || 0) - s.ev.tourBase);
}
