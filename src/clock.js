// B3 (1.0.19) + Eren 2026-11-12 (1.0.22): oyun saati. Butun zamanlayicilar (ekin, agac, firin, kovan,
// ahir, kulucka, gorevler, takvim) Date.now() yerine now() kullanir.
// - Oyun acikken gercek gecen sureyi sayar (performance.now: cihaz saati degisse de etkilenmez).
// - Internet varsa oyun saati internetteki dogru saate esitlenir (acilista, sekmeye donunce ve 6 saatte bir).
//   Boylece oyunda 00:00 = gercek 00:00 ve cihaz saatini ileri almak ise yaramaz.
// - Internet yoksa oyun kapaliyken gecen sure acilista en fazla 12 saat kabul edilir; saat geri alinmissa 0.
//   Internet gelince saat kaldigi yerden dogru saate ilerler (hic geri gitmez).
export const MAX_GAP = 12 * 3600 * 1000;
const SYNC_EVERY = 6 * 3600 * 1000;
let base = null; let perf0 = 0;
let net = null; // { t: internet saati, perf: o anki performance.now }

export function now() { return base == null ? Date.now() : Math.floor(base + (performance.now() - perf0)); }
// internetteki dogru saat (biliniyorsa), yoksa null
export function netNow() { return net ? Math.floor(net.t + (performance.now() - net.perf)) : null; }

// kayit yuklenince: kaydin saati + (kapali kalinan sure, en fazla 12 saat); internet saati biliniyorsa dogrudan o
export function initClock(save) {
  const wall = Date.now();
  const g = save.gclock;
  if (!g || !Number.isFinite(g.t) || !Number.isFinite(g.wall)) base = wall;
  else base = g.t + Math.max(0, Math.min(MAX_GAP, wall - g.wall));
  perf0 = performance.now();
  catchUp();
  stampClock(save);
  syncTime();
}
// her kayitta: o anki oyun saati + cihaz saati
export function stampClock(save) { save.gclock = { t: now(), wall: Date.now() }; }

// oyun saatini internet saatine esitler (sadece ileri)
function catchUp() {
  const n = netNow();
  if (n == null || base == null) return;
  if (n > now()) { base = n; perf0 = performance.now(); }
}

// Internetten dogru saat: once jsDelivr'in (Phaser'i da oradan yukluyoruz) Date basligi, olmazsa saat servisi.
const SOURCES = [
  async () => { const r = await fetch('https://cdn.jsdelivr.net/npm/phaser@3.80.1/package.json', { method: 'HEAD', cache: 'no-store' }); const d = r.headers.get('date'); return d ? Date.parse(d) : NaN; },
  async () => { const r = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC', { cache: 'no-store' }); const j = await r.json(); return j.unixtime * 1000; },
];
let syncing = false; let lastSync = -Infinity;
export async function syncTime(force = false) {
  if (syncing || (!force && performance.now() - lastSync < 60000)) return;
  syncing = true;
  try {
    for (const src of SOURCES) {
      try {
        const p0 = performance.now();
        const t = await src();
        const p1 = performance.now();
        // makul bir saat mi (2025-2100)
        if (Number.isFinite(t) && t > 1735689600000 && t < 4102444800000) {
          net = { t: t + (p1 - p0) / 2, perf: p1 };
          lastSync = p1;
          catchUp();
          break;
        }
      } catch (e) { /* bu kaynak olmadi, siradaki */ }
    }
  } finally { syncing = false; }
}
if (typeof window !== 'undefined') {
  setInterval(() => syncTime(true), SYNC_EVERY);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncTime(); });
}
// test icin: internet saatini elle ver
export function _setNet(t) { net = { t, perf: performance.now() }; catchUp(); }
