// B3 (1.0.19, gecici cozum): oyun saati. Butun zamanlayicilar (ekin, agac, firin, kovan, ahir,
// kulucka, gorevler, takvim) Date.now() yerine now() kullanir.
// Oyun acikken gercek gecen sureyi sayar (performance.now: cihaz saati degisse de etkilenmez).
// Oyun kapaliyken gecen sure acilista en fazla 12 saat kabul edilir; saat geri alinmissa 0.
// Kalici cozum: bulut kaydi gelince saat sunucudan alinacak (Paket 6).
export const MAX_GAP = 12 * 3600 * 1000;
let base = null; let perf0 = 0;

export function now() { return base == null ? Date.now() : Math.floor(base + (performance.now() - perf0)); }

// kayit yuklenince: kaydin saati + (kapali kalinan sure, en fazla 12 saat)
export function initClock(save) {
  const wall = Date.now();
  const g = save.gclock;
  if (!g || !Number.isFinite(g.t) || !Number.isFinite(g.wall)) { base = wall; } else {
    const gap = Math.max(0, Math.min(MAX_GAP, wall - g.wall));
    base = Math.max(g.t, g.t + gap);
  }
  perf0 = performance.now();
  stampClock(save);
}
// her kayitta: o anki oyun saati + cihaz saati
export function stampClock(save) { save.gclock = { t: now(), wall: Date.now() }; }
