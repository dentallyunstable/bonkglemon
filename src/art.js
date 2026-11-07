// Kodla kurulan sahneler ve nesneler (0.3, Eren 2026-11-07):
// Her sey 16x16 bloklardan (blocks.js) blok blok kurulur: ev, maden, agac, zemin, arka plan.
// - Yakin nesnelerin (ev, sandik, tezgah...) etrafinda karakterdeki gibi 1 piksel koyu cizgi var.
// - Uzaktaki tepeler ve agaclar ayni bloklardir, sadece gok rengine karisip soluklasir.
// - Zindan katlari derinlestikce sahne aksama / geceye doner.
import { GAME_W, GAME_H, GROUND_Y } from './data.js';
import { rng, Pix, hex, mix, mul, pack, unpack, col, INK } from './pix.js';
import { B, block, build } from './blocks.js';

export { rng, hex, INK };

const G = GROUND_Y;
const OL = '#16121a';
const NIGHT = '#141428';

// renk donusumleri
const fogFn = (to, t) => (v) => { const c = unpack(v); return pack(mix(c.slice(0, 3), hex(to), t), c[3]); };
const shadeFn = (f) => (v) => { const c = unpack(v); return pack(mul(c.slice(0, 3), f), c[3]); };
const chain = (...fs) => (v) => fs.reduce((a, f) => (f ? f(a) : a), v);
// gece: karart + mora kaydir
const nightFn = (t) => (t <= 0 ? null : (v) => { const c = unpack(v); return pack(mix(mul(c.slice(0, 3), 1 - 0.45 * t), hex(NIGHT), 0.35 * t), c[3]); });

const put = (p, name, x, y, fn = null) => p.draw(block(name), x, y, B, fn);

// bloku istenen boyda ciz (perspektif icin, en yakin komsu)
function putScaled(p, name, x, y, s, fn = null) {
  const src = block(name);
  const n = Math.max(1, Math.round(s));
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      let v = src.d[Math.floor((j * B) / n) * B + Math.floor((i * B) / n)];
      if (!(v >>> 24)) continue;
      if (fn) v = fn(v);
      p.set(x + i, y + j, v);
    }
  }
}

// gokyuzu: blok yuksekliginde bantlar (yukaridan asagi acilir)
const SKY_DAY = ['#7e9fb6', '#88a8bd', '#93b1c4', '#9ebacb', '#a9c2d1', '#b3c9d6', '#bccfda', '#c4d4dd', '#cad8e0', '#cfdbe2', '#d3dee4', '#d6e0e5', '#d8e1e6', '#dae2e7'];
// Gunun saati (Eren, 2026-11-07): ussun gokyuzu ve isigi gercek saate gore degisir.
// stops: gokyuzu (ust, orta, ufuk), t: karanlik, warm: sahneye karisan sicak renk,
// sun: gunes/ay yeri, tint: ustteki nesnelere ve karaktere uygulanan isik rengi
export const TOD = {
  gundogumu: { name: 'Gündoğumu', stops: ['#5a5c8c', '#b48aa4', '#f0b886'], t: 0.22, warm: ['#f0a070', 0.16], sun: 'left', tint: 0xffdcc8 },
  gun: { name: 'Gündüz', stops: null, t: 0, warm: null, sun: 'high', tint: 0xffffff },
  gunbatimi: { name: 'Günbatımı', stops: ['#3c3468', '#ac5c78', '#ec8a4e'], t: 0.32, warm: ['#e07040', 0.2], sun: 'right', tint: 0xffc4a4 },
  gece: { name: 'Gece', stops: null, t: 0.85, warm: null, sun: 'moon', tint: 0x7c84b4 },
};
export function todNow(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6 && h < 8) return 'gundogumu';
  if (h >= 8 && h < 18) return 'gun';
  if (h >= 18 && h < 20) return 'gunbatimi';
  return 'gece';
}
function skyColor(i, t, stops = null) {
  if (stops) {
    const k = Math.min(1, i / 11);
    const [a, b2, c] = stops.map(hex);
    return k < 0.5 ? mix(a, b2, k * 2) : mix(b2, c, (k - 0.5) * 2);
  }
  return mix(hex(SKY_DAY[Math.min(i, SKY_DAY.length - 1)]), mul(hex('#1c1c3a'), 1 + i * 0.06), t);
}
const toHex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
function paintSky(p, bottom, t, r, opts = {}) {
  const rows = Math.ceil(bottom / B) + 1;
  for (let i = 0; i < rows; i++) {
    const y0 = bottom - (rows - i) * B;
    p.rect(0, Math.max(0, y0), p.w, B + Math.min(0, y0), pack(skyColor(i, t, opts.stops)));
  }
  const skyTop = pack(skyColor(0, t, opts.stops));
  // gunes ya da ay + yildizlar
  const sx = 32 + Math.floor(r() * (p.w - 96) / B) * B;
  if (opts.sun === 'left' || opts.sun === 'right') {
    // ufka yakin, kizil gunes
    put(p, 'gunes', opts.sun === 'left' ? 40 : p.w - 72, bottom - 64, fogFn('#f07848', 0.4));
    if (opts.sun === 'right') {
      const star = pack(mix(hex('#e8e6f0'), unpack(skyTop).slice(0, 3), 0.55));
      for (let i = 0; i < 8; i++) p.set(Math.floor(r() * p.w), Math.floor(r() * 30), star);
    }
  } else if (t < 0.45) put(p, 'gunes', sx, 8);
  else {
    put(p, 'ay', sx, 8);
    const star = pack(mix(hex('#e8e6f0'), unpack(skyTop).slice(0, 3), 0.3));
    for (let i = 0; i < 24; i++) { const x = Math.floor(r() * p.w); const y = Math.floor(r() * (bottom * 0.6)); p.set(x, y, star); }
  }
  // bulutlar: duz blok siralari
  const cf = chain(fogFn('#c8d4dc', 0.15), opts.warm ? fogFn(opts.warm[0], 0.45) : null, nightFn(t * 0.9));
  const n = opts.clouds ?? 3;
  for (let i = 0; i < n; i++) {
    const w = 2 + Math.floor(r() * 3);
    const cx = Math.floor(r() * (p.w / B + 2)) * B - B;
    const cy = 8 + Math.floor(r() * 3) * 12;
    for (let k = 0; k < w; k++) {
      // bulut blogunun yarisi: 8 piksel yukseklik (uzak gorunsun)
      const src = block('bulut');
      for (let y = 0; y < 8; y++) for (let x = 0; x < B; x++) p.set(cx + k * B + x, cy + 8 + y, cf(src.d[(y * 2) * B + x]));
    }
    if (w > 2) for (let y = 0; y < 8; y++) for (let x = 0; x < B * (w - 2); x++) p.set(cx + B + x, cy + y, cf(block('bulut').d[(y * 2) * B + (x % B)]));
  }
}

// tepe profili (blok sutunlari): her sutunun yuksekligi blok cinsinden
function hillRow(p, r, baseY, minH, maxH, fn, phase) {
  const cols = Math.ceil(p.w / B) + 1;
  let h = minH + Math.floor(r() * (maxH - minH + 1));
  for (let c = 0; c < cols; c++) {
    if (r() < 0.45) h = Math.max(minH, Math.min(maxH, h + (r() < 0.5 ? -1 : 1)));
    for (let k = 0; k < h; k++) put(p, k === h - 1 ? 'cimen' : 'toprak', c * B - phase, baseY - (k + 1) * B, fn);
  }
}

// blok agaci: kutuk govde + yaprak taci. Tacin en alt sirasi govdenin en ust blogunu
// sarar, ust siralar bir alttakinin tam ustune oturur (havada yaprak yok).
function tree(p, x, groundY, trunk, fn = null, wide = true) {
  for (let k = 0; k < trunk; k++) put(p, 'kutuk', x, groundY - (k + 1) * B, fn);
  const top = groundY - trunk * B; // en ust kutugun ust kenari
  const rows = wide ? [[-2, 2], [-2, 2], [-1, 1], [0, 0]] : [[-1, 1], [-1, 1], [0, 0]];
  const cut = wide && (Math.round(x / B) % 2 === 0); // bazi agaclarda 2. siranin koseleri bos
  rows.forEach(([a, b], j) => {
    for (let i = a; i <= b; i++) {
      if (cut && j === 1 && (i === a || i === b)) continue;
      if (j === 0 && i === 0) continue; // govde gorunsun
      put(p, 'yaprak', x + i * B, top + B - (j + 1) * B, fn);
    }
  });
}

// katmani cizgisiyle ana tuvale bas
function layer(p, fill, ol = 'dark', f = 0.55) {
  const L = new Pix(p.w, p.h);
  fill(L);
  if (ol) L.outline(ol, f);
  p.draw(L, 0, 0, L.w);
}

// ------------------------------------------------------------------ orman (us + zindan odalari)
export function forestBackground(floor, variant = 0, base = false, width = GAME_W, tod = null) {
  const r = rng(floor * 7919 + variant * 104729 + (base ? 77 : 0));
  const T = tod ? TOD[tod] : null;
  const t = T ? T.t : base ? 0 : Math.min(1, (floor - 1) / 9) * 0.85;
  const nf = T && T.warm ? chain(fogFn(T.warm[0], T.warm[1]), nightFn(t)) : nightFn(t);
  const p = new Pix(width, GAME_H);
  paintSky(p, G - 2 * B, t, r, T ? { stops: T.stops, sun: T.sun, warm: T.warm } : {});
  const skyLow = toHex(skyColor(9, t, T && T.stops));
  // uzak tepeler (gok rengine karismis) ve uzak agaclar
  hillRow(p, r, G, 3, 5, fogFn(skyLow, 0.62), Math.floor(r() * B));
  layer(p, (L) => {
    for (let x = Math.floor(r() * 3) * B - B; x < width + B; x += B * (3 + Math.floor(r() * 3))) tree(L, x, G - B, 1 + Math.floor(r() * 2), fogFn(skyLow, 0.45), false);
  }, null);
  hillRow(p, r, G, 1, 2, fogFn(skyLow, 0.32), Math.floor(r() * B));
  // orta agaclar (biraz koyu, koyu cizgili)
  layer(p, (L) => {
    const spots = [];
    const n = base ? 2 : 3 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      let c = Math.floor(r() * (width / B));
      if (base) c = i === 0 ? 7 : 22;
      spots.push(c * B);
    }
    spots.sort((a, b) => a - b);
    for (const x of spots) tree(L, x, G, 3 + Math.floor(r() * 2), chain(shadeFn(0.86), nf));
    // calilar: tek sira yaprak blogu
    for (let c = Math.floor(r() * 4); c < width / B; c += 3 + Math.floor(r() * 5)) {
      if (base && c > 0 && c < 23 && c !== 7 && c !== 8) continue;
      const w = 1 + (r() < 0.4 ? 1 : 0);
      for (let k = 0; k < w; k++) put(L, 'yaprak', (c + k) * B, G - B, chain(shadeFn(0.8), nf));
    }
  }, 'dark', 0.5);
  // zemin: cimen sirasi + toprak, arada tas
  for (let c = 0; c < width / B; c++) {
    put(p, 'cimen', c * B, G, nf);
    put(p, (c * 7 + variant) % 11 === 3 ? 'tas' : 'toprak', c * B, G + B, nf);
    put(p, (c * 5 + variant + floor) % 7 < 2 ? 'tas' : (c * 3 + floor) % 13 === 0 ? 'komur' : 'toprak', c * B, G + 2 * B, nf);
  }
  // cicek ve ot tutamlari
  for (let i = 0; i < 9; i++) {
    const c = Math.floor(r() * (width / B));
    const k = r();
    put(p, k < 0.5 ? 'ot' : k < 0.75 ? 'cicek_k' : 'cicek_s', c * B, G - B + 1, nf);
  }
  return p.canvas();
}

// ------------------------------------------------------------------ savas ekrani
// Kamera oyuncunun sirtindan bakar. Ufuk yukarida, zemin blok izgarasi perspektifle
// bize dogru buyur (uzak bloklar kucuk, yakin bloklar buyuk). Glemonlar ortadaki
// uzak cimende, oyuncu sol altta.
export const ARENA = { horizon: 92, enemyY: 140, nearY: 206 };
export function battleBackground(floor = 1, zone = 'orman') {
  if (zone === 'magara') return caveArena(floor);
  if (zone === 'col') return desertArena(floor);
  return forestArena(floor);
}
function forestArena(floor) {
  const HZ = ARENA.horizon;
  const r = rng(floor * 31337 + 5);
  const t = Math.min(1, (floor - 1) / 9) * 0.85;
  const nf = nightFn(t);
  const p = new Pix(GAME_W, GAME_H);
  paintSky(p, HZ, t, r, { clouds: 3 });
  const skyLow = '#' + unpack(pack(skyColor(5, t))).slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');
  // ufukta kucuk (8 piksel) bloklardan tepe ve agac siralari
  const s1 = 8;
  for (let x = 0, h = 2; x < GAME_W; x += s1) {
    if (r() < 0.4) h = Math.max(1, Math.min(4, h + (r() < 0.5 ? -1 : 1)));
    for (let k = 0; k < h; k++) putScaled(p, k === h - 1 ? 'cimen' : 'toprak', x, HZ - (k + 1) * s1, s1, fogFn(skyLow, 0.6));
  }
  const woods = new Pix(GAME_W, GAME_H);
  for (let x = -8; x < GAME_W; x += 24 + Math.floor(r() * 3) * 8) {
    const th = 1 + Math.floor(r() * 2);
    for (let k = 0; k < th; k++) putScaled(woods, 'kutuk', x, HZ - (k + 1) * s1, s1, fogFn(skyLow, 0.35));
    for (const [i, j] of [[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) putScaled(woods, 'yaprak', x + i * s1, HZ - (th + 1 + j) * s1, s1, fogFn(skyLow, 0.35));
  }
  woods.outline('dark', 0.6);
  p.draw(woods, 0, 0, woods.w);
  // zemin: ufuk noktasina giden blok izgarasi
  const vx = 192;
  const pathAt = (y) => { const f = (y - HZ) / (GAME_H - HZ); return vx - 10 + (40 - (vx - 10)) * f; };
  let y = HZ;
  let row = 0;
  while (y < GAME_H) {
    const s = Math.max(3, Math.round(2 + (y - HZ) * 0.34));
    const off = ((row * 7) % 3) * 0.33;
    const c0 = Math.floor((0 - vx) / s) - 1;
    for (let c = c0; c * s + vx < GAME_W; c++) {
      const x = Math.round(vx + (c + off) * s);
      const cx = x + s / 2;
      const onPath = Math.abs(cx - pathAt(y + s / 2)) < s * 1.1;
      const kind = onPath ? 'kum' : ((c * 13 + row * 7) % 17 === 0 ? 'toprak' : 'cimen_ust');
      const dim = 0.78 + 0.22 * Math.min(1, (y - HZ) / 60);
      putScaled(p, kind, x, y, s, chain(shadeFn(dim), nf));
    }
    y += s;
    row++;
  }
  // yanlarda yakin (iri, 32 piksel) agaclar ve calilar: cerceve gibi
  const near = new Pix(GAME_W, GAME_H);
  const s2 = 32;
  for (let k = 0; k < 4; k++) putScaled(near, 'kutuk', GAME_W - 40, HZ + 8 - k * s2, s2, nf);
  for (const [i, j] of [[-1, 0], [0, 0], [1, 0], [-2, 1], [-1, 1], [0, 1], [1, 1]]) putScaled(near, 'yaprak', GAME_W - 40 + i * s2, -18 + j * s2 - s2, s2, chain(shadeFn(0.85), nf));
  for (let k = 0; k < 3; k++) putScaled(near, 'kutuk', 8, HZ - 12 - k * s2, s2, nf);
  for (const [i, j] of [[-1, 0], [0, 0], [1, 0], [0, 1]]) putScaled(near, 'yaprak', 8 + i * s2, -14 + j * s2 - s2 + 16, s2, chain(shadeFn(0.85), nf));
  for (const [bx, by, bs] of [[300, GAME_H - 30, 32], [336, GAME_H - 30, 32]]) putScaled(near, 'yaprak', bx, by, bs, chain(shadeFn(0.8), nf));
  near.outline('dark', 0.5);
  p.draw(near, 0, 0, near.w);
  return p.canvas();
}


// ------------------------------------------------------------------ 0.5 Yanki Magaralari (zindan odalari)
// Gokyuzu yok: arkada tas duvar, tavanda sarkitlar, yer yer mor ve mavi kristaller.
// Karanlik odalar cok daha koyu (fenerle aydinlanir).
const CAVE_DARK = '#120e1c';
export function caveRoomBackground(floor, variant = 0, dark = false) {
  const r = rng(floor * 6131 + variant * 911 + (dark ? 5 : 0));
  const zf = floor - 10;
  const deep = Math.min(1, (zf - 1) / 9);
  const nf = fogFn(CAVE_DARK, (dark ? 0.62 : 0.18) + deep * 0.15);
  const p = new Pix(GAME_W, GAME_H);
  const cols = GAME_W / B;
  const rowsUp = Math.ceil(G / B);
  for (let c = 0; c < cols; c++) {
    for (let k = 1; k <= rowsUp; k++) put(p, 'tas_duvar', c * B, G - k * B, nf);
    put(p, 'magara_zemin', c * B, G, nf);
    put(p, (c * 5 + variant) % 7 === 2 ? 'komur' : (c * 3 + floor) % 11 === 0 ? 'demir' : 'tas', c * B, G + B, chain(shadeFn(0.8), nf));
    put(p, 'kaldirim', c * B, G + 2 * B, chain(shadeFn(0.65), nf));
  }
  // arka duvarda daha acik tas kumeleri (derinlik)
  layer(p, (L) => {
    for (let c = 0; c < cols; c++) {
      const h = 1 + Math.floor(r() * 3);
      if (r() < 0.45) for (let k = 0; k < h; k++) put(L, 'tas', c * B, G - (k + 1) * B, chain(shadeFn(0.62), nf));
    }
  }, 'dark', 0.5);
  // tavan: tas sirasi ve sarkitlar
  layer(p, (L) => {
    for (let c = 0; c < cols; c++) {
      put(L, 'tas', c * B, 0, chain(shadeFn(0.7), nf));
      if (r() < 0.5) put(L, 'tas', c * B, B, chain(shadeFn(0.66), nf));
      if (r() < 0.35) put(L, 'sarkit', c * B, r() < 0.5 ? B : 2 * B, chain(shadeFn(0.8), nf));
    }
  }, 'dark', 0.5);
  // kristaller ve mantarlar zeminde
  for (let i = 0; i < 4; i++) {
    const c = Math.floor(r() * cols);
    put(p, r() < 0.5 ? 'kristal_m' : 'kristal_b', c * B, G - B + 1, dark ? fogFn(CAVE_DARK, 0.35) : null);
  }
  if (r() < 0.6) put(p, 'mantarlar', Math.floor(r() * cols) * B, G - B + 1, nf);
  return p.canvas();
}

// ------------------------------------------------------------------ 0.5 Kavurucu Col (zindan odalari)
// Sicak gokyuzu, kum tepeleri, kumtasi kayaliklar, kaktus ve hurma. Derin katlarda gun batar.
const SKY_HOT = ['#d89a5c', '#e4b070', '#ecc488'];
export function desertRoomBackground(floor, variant = 0) {
  const r = rng(floor * 4219 + variant * 313);
  const zf = floor - 20;
  const t = Math.min(1, (zf - 1) / 9) * 0.5;
  const stops = ['#8eaccc', '#c8c4b0', '#ecd2a0'];
  const warm = ['#e09050', 0.12 + t * 0.4];
  const nf = chain(fogFn(warm[0], warm[1] * 0.5), nightFn(t * 0.6));
  const p = new Pix(GAME_W, GAME_H);
  paintSky(p, G - 2 * B, t * 0.5, r, { stops: t > 0.25 ? ['#5a5c8c', '#c48a84', SKY_HOT[1]] : stops, warm, clouds: 1, sun: t > 0.3 ? 'right' : undefined });
  const skyLow = toHex(skyColor(9, t * 0.5, stops));
  // uzak kum tepeleri
  const dunes = (baseY, minH, maxH, fn) => {
    const colsN = Math.ceil(p.w / B) + 1;
    let h = minH + Math.floor(r() * (maxH - minH + 1));
    for (let c = 0; c < colsN; c++) {
      if (r() < 0.35) h = Math.max(minH, Math.min(maxH, h + (r() < 0.5 ? -1 : 1)));
      for (let k = 0; k < h; k++) put(p, k === h - 1 ? 'kum' : 'kumtasi', c * B, baseY - (k + 1) * B, fn);
    }
  };
  dunes(G, 2, 4, fogFn(skyLow, 0.6));
  // kumtasi kayaliklar (masa)
  layer(p, (L) => {
    for (let i = 0; i < 2; i++) {
      const c0 = Math.floor(r() * (GAME_W / B - 4));
      const w = 3 + Math.floor(r() * 3);
      const h = 2 + Math.floor(r() * 3);
      for (let c = 0; c < w; c++) for (let k = 0; k < h - (c === 0 || c === w - 1 ? 1 : 0); k++) put(L, 'kumtasi', (c0 + c) * B, G - (k + 1) * B, chain(fogFn(skyLow, 0.3), nf));
    }
  }, 'dark', 0.55);
  dunes(G, 1, 1, chain(fogFn(skyLow, 0.2), nf));
  // kaktus, hurma, kemik
  layer(p, (L) => {
    for (let i = 0; i < 3; i++) put(L, r() < 0.6 ? 'kaktus' : 'hurmalik', Math.floor(r() * (GAME_W / B)) * B, G - B, nf);
  }, 'dark', 0.5);
  for (let c = 0; c < GAME_W / B; c++) {
    put(p, 'kum', c * B, G, nf);
    put(p, (c * 7 + variant) % 9 === 3 ? 'kumtasi' : 'kum', c * B, G + B, chain(shadeFn(0.88), nf));
    put(p, 'kumtasi', c * B, G + 2 * B, chain(shadeFn(0.8), nf));
  }
  if (r() < 0.5) put(p, 'kemik', Math.floor(r() * (GAME_W / B)) * B, G - B + 1, nf);
  return p.canvas();
}

// savas ekrani: magara (tavan ve duvar, kristalli cerceve)
function arenaGround(p, HZ, nf, pick) {
  const vx = 192;
  const pathAt = (y) => { const f = (y - HZ) / (GAME_H - HZ); return vx - 10 + (40 - (vx - 10)) * f; };
  let y = HZ;
  let row = 0;
  while (y < GAME_H) {
    const s = Math.max(3, Math.round(2 + (y - HZ) * 0.34));
    const off = ((row * 7) % 3) * 0.33;
    const c0 = Math.floor((0 - vx) / s) - 1;
    for (let c = c0; c * s + vx < GAME_W; c++) {
      const x = Math.round(vx + (c + off) * s);
      const onPath = Math.abs(x + s / 2 - pathAt(y + s / 2)) < s * 1.1;
      const dim = 0.78 + 0.22 * Math.min(1, (y - HZ) / 60);
      putScaled(p, pick(onPath, c, row), x, y, s, chain(shadeFn(dim), nf));
    }
    y += s;
    row++;
  }
}
function caveArena(floor) {
  const HZ = ARENA.horizon;
  const r = rng(floor * 7717 + 3);
  const deep = Math.min(1, (floor - 11) / 9);
  const nf = fogFn(CAVE_DARK, 0.15 + deep * 0.2);
  const p = new Pix(GAME_W, GAME_H);
  const s1 = 8;
  for (let y = 0; y < HZ; y += s1) for (let x = 0; x < GAME_W; x += s1) putScaled(p, 'tas_duvar', x, y, s1, fogFn(CAVE_DARK, 0.25 + (y / HZ) * 0.1));
  const far = new Pix(GAME_W, GAME_H);
  for (let x = 0, h = 2; x < GAME_W; x += s1) {
    if (r() < 0.4) h = Math.max(1, Math.min(4, h + (r() < 0.5 ? -1 : 1)));
    for (let k = 0; k < h; k++) putScaled(far, 'tas', x, HZ - (k + 1) * s1, s1, fogFn(CAVE_DARK, 0.4));
    if (r() < 0.15) putScaled(far, r() < 0.5 ? 'kristal_m' : 'kristal_b', x, HZ - (h + 1) * s1, s1, fogFn(CAVE_DARK, 0.2));
  }
  far.outline('dark', 0.6);
  p.draw(far, 0, 0, far.w);
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? 'kaldirim' : (c * 13 + row * 7) % 11 === 0 ? 'komur' : 'magara_zemin'));
  const near = new Pix(GAME_W, GAME_H);
  const s2 = 32;
  for (let i = 0; i < 6; i++) putScaled(near, 'tas', i * s2 - 8, -18, s2, chain(shadeFn(0.7), nf));
  for (const x of [14, 120, 230, 330]) putScaled(near, 'sarkit', x, 10, s2, chain(shadeFn(0.8), nf));
  for (let k = 0; k < 3; k++) putScaled(near, 'tas', GAME_W - 36, HZ - k * s2, s2, chain(shadeFn(0.75), nf));
  putScaled(near, 'kristal_m', GAME_W - 70, GAME_H - 34, s2, null);
  putScaled(near, 'kristal_b', 298, GAME_H - 30, 28, null);
  near.outline('dark', 0.5);
  p.draw(near, 0, 0, near.w);
  return p.canvas();
}
function desertArena(floor) {
  const HZ = ARENA.horizon;
  const r = rng(floor * 5521 + 9);
  const t = Math.min(1, (floor - 21) / 9) * 0.5;
  const nf = chain(fogFn('#e09050', 0.08 + t * 0.2), nightFn(t * 0.5));
  const p = new Pix(GAME_W, GAME_H);
  const stops = t > 0.25 ? ['#5a5c8c', '#c48a84', '#e4b070'] : ['#8eaccc', '#c8c4b0', '#ecd2a0'];
  paintSky(p, HZ, t * 0.5, r, { stops, clouds: 1, sun: t > 0.25 ? 'right' : undefined });
  const skyLow = toHex(skyColor(5, t * 0.5, stops));
  const s1 = 8;
  const far = new Pix(GAME_W, GAME_H);
  for (let x = 0, h = 2; x < GAME_W; x += s1) {
    if (r() < 0.35) h = Math.max(1, Math.min(5, h + (r() < 0.5 ? -1 : 1)));
    for (let k = 0; k < h; k++) putScaled(far, k === h - 1 ? 'kum' : 'kumtasi', x, HZ - (k + 1) * s1, s1, fogFn(skyLow, 0.45));
    if (r() < 0.08) putScaled(far, 'kaktus', x, HZ - (h + 1) * s1, s1, fogFn(skyLow, 0.35));
  }
  far.outline('dark', 0.6);
  p.draw(far, 0, 0, far.w);
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? 'kumtasi' : (c * 13 + row * 7) % 17 === 0 ? 'kumtasi' : 'kum'));
  const near = new Pix(GAME_W, GAME_H);
  const s2 = 32;
  putScaled(near, 'hurmalik', GAME_W - 64, HZ - 40, 64, nf);
  putScaled(near, 'hurmalik', -14, HZ - 52, 64, nf);
  putScaled(near, 'kaktus', 300, GAME_H - 34, s2, nf);
  putScaled(near, 'kemik', 334, GAME_H - 22, 24, nf);
  near.outline('dark', 0.5);
  p.draw(near, 0, 0, near.w);
  return p.canvas();
}

// ------------------------------------------------------------------ us nesneleri
// Ev: 5 blok genis kutuk-kalas duvar, iki cam, ortada kapi, basamakli kiremit cati.
export const CABIN = { w: 7 * B + 2, door: 3 * B + B / 2 + 1 };
export function cabin() {
  return build([
    '...k...',
    '..LkR..',
    '.LkkkR.',
    'LkkkkkR',
    '.upppu.',
    '.ucDcu.',
    '.upduu.',
  ], { k: 'kiremit', L: 'kiremit_sol', R: 'kiremit_sag', u: 'kutuk', p: 'kalas', c: 'cam', D: 'kapi_ust', d: 'kapi_alt' }).canvas();
}

// zindan girisi: tas tepecik, kutuk destekli karanlik agiz, ici ray
export function mineEntrance() {
  const p = build([
    '..gg..',
    '.gtttg',
    'gtbbtt',
    'tuKKut',
    'cuKKut',
  ], { g: 'cimen', t: 'tas', c: 'komur', b: 'kalas', u: 'kutuk', K: 'karanlik' });
  put(p, 'ray', 1 + 2 * B, 1 + 4 * B); put(p, 'ray', 1 + 3 * B, 1 + 4 * B);
  put(p, 'fener', 1 + 2 * B + 8, 1 + 3 * B - 2);
  return p.canvas();
}

export function signpost() { return build(['T', 'P'], { T: 'tabela', P: 'direk' }).canvas(); }

// Takas Tezgahi: tente, iki direk, kalas tezgah, ustunde bir Cimen Blogu
export function stall() {
  return build(['aaa', 'PgP', 'kkk'], { a: 'tente', P: 'direk', g: 'cimen', k: 'kalas' }).canvas();
}

export function chest(open = false) { return build(['s'], { s: open ? 'sandik_acik' : 'sandik' }).canvas(); }

// kare seridi: [ad, ad, ...] -> { canvas, fw, fh }
function strip(names, rows = ['x']) {
  const frames = names.map((n) => build(rows, { x: n }));
  const fw = frames[0].w; const fh = frames[0].h;
  const out = new Pix(fw * frames.length, fh);
  frames.forEach((f, i) => out.draw(f, i * fw, 0, fw));
  return { canvas: out.canvas(), fw, fh };
}

export function campfire() { return strip(['ates0', 'ates1', 'ates2']); }
export function spikes() { return build(['dd'], { d: 'diken' }).canvas(); }

// asagi inen tas merdiven (zemine oyulmus), ust kenari zeminle ayni hizada
export function stairsDown() {
  const p = new Pix(3 * B, 2 * B);
  for (let j = 0; j < 2; j++) for (let i = 0; i < 3; i++) put(p, 'karanlik', i * B, j * B);
  put(p, 'kaldirim', 0, 0); put(p, 'kaldirim', 0, B); put(p, 'kaldirim', B, B);
  const step = block('kaldirim');
  for (let y = 8; y < B; y++) for (let x = 0; x < B; x++) { p.set(B + x, y, step.d[y * B + x]); p.set(2 * B + x, B + y, step.d[y * B + x]); }
  return p.canvas();
}

export function slash() {
  const p = new Pix(28, 28);
  for (let a = -1.15; a <= 1.15; a += 0.03) {
    const thick = 4.4 * (1 - Math.abs(a) / 1.2);
    for (let rr = 13 - thick; rr <= 13; rr += 0.5) p.set(14 + Math.cos(a) * rr, 14 + Math.sin(a) * rr, rr > 11.5 ? '#f0f0f0' : '#bcd4e4');
  }
  return p.canvas();
}

export function shadow() {
  const p = new Pix(24, 5);
  for (let y = 0; y < 5; y++) {
    const half = Math.round(Math.sqrt(1 - Math.pow((y - 2) / 2.6, 2)) * 12);
    for (let x = 12 - half; x < 12 + half; x++) p.set(x, y, pack([0, 0, 0], 70));
  }
  return p.canvas();
}

// ------------------------------------------------------------------ ev ici
export function houseInterior() {
  const p = new Pix(GAME_W, GAME_H);
  const cols = GAME_W / B;
  const back = shadeFn(0.72);
  const rowsUp = Math.ceil(G / B);
  for (let c = 0; c < cols; c++) {
    for (let k = 1; k <= rowsUp; k++) put(p, 'kalas', c * B, G - k * B, back);
    put(p, 'kalas', c * B, G); put(p, 'kalas', c * B, G + B, shadeFn(0.85)); put(p, 'kalas', c * B, G + 2 * B, shadeFn(0.75));
  }
  // tavan kirisi ve direkler (kutuk)
  for (let c = 0; c < cols; c++) put(p, 'kutuk', c * B, G - rowsUp * B + 2 * B, shadeFn(0.85));
  for (const c of [0, 8, 16, 23]) for (let k = 1; k <= rowsUp - 2; k++) put(p, 'kutuk', c * B, G - k * B, shadeFn(0.9));
  // pencere (2x2 cam) ve raflar
  for (const [i, j] of [[0, 0], [1, 0], [0, 1], [1, 1]]) put(p, 'cam', (12 + i) * B, G - (5 - j) * B);
  put(p, 'raf', 4 * B, G - 4 * B); put(p, 'raf', 5 * B, G - 4 * B);
  put(p, 'raf', 19 * B, G - 4 * B);
  // asili fenerler
  put(p, 'fener', 10 * B, G - 7 * B + 2); put(p, 'fener', 20 * B, G - 7 * B + 2);
  return p.canvas();
}

export function doorInside() { return build(['u', 'd'], { u: 'kapi_ust', d: 'kapi_alt' }).canvas(); }
export function workbench() { return build(['t'], { t: 'tezgah' }).canvas(); }
export function furnaceArt() { return strip(['firin0', 'firin1', 'firin2']); }
export function cauldronArt() { return strip(['kazan0', 'kazan1']); }
export function bed() { return build(['ba'], { b: 'yatak_bas', a: 'yatak_ayak' }).canvas(); }

// ------------------------------------------------------------------ maden ocagi
export const MINE_WALL = { x: 240, cols: 8, rows: 6, size: 16 };

export function caveBackground(depth = 1) {
  const t = Math.min(1, (depth - 1) / 8);
  const nf = nightFn(t * 0.7);
  const p = new Pix(GAME_W, GAME_H);
  const cols = GAME_W / B;
  const rowsUp = Math.ceil(G / B);
  for (let c = 0; c < cols; c++) {
    for (let k = 1; k <= rowsUp; k++) put(p, 'tas_duvar', c * B, G - k * B, nf);
    put(p, 'tas', c * B, G, nf); put(p, (c * 5) % 7 === 2 ? 'komur' : 'tas', c * B, G + B, chain(shadeFn(0.8), nf)); put(p, 'kaldirim', c * B, G + 2 * B, chain(shadeFn(0.7), nf));
    // tavan: tas sirasi, yer yer sarkit
    put(p, 'tas', c * B, G - rowsUp * B, chain(shadeFn(0.7), nf));
    if ((c * 7) % 5 === 1) put(p, 'tas', c * B, G - (rowsUp - 1) * B, chain(shadeFn(0.62), nf));
  }
  // kazilan duvarin arkasi
  const W = MINE_WALL;
  for (let j = 0; j < W.rows; j++) for (let i = 0; i < W.cols; i++) put(p, 'karanlik', W.x + i * B, G - (j + 1) * B);
  // ahsap iskele: iki direk + kiris, kirisin altinda fenerler; zeminde ray
  layer(p, (L) => {
    for (const c of [0, 6]) for (let k = 1; k <= 6; k++) put(L, 'kutuk', c * B, G - k * B, nf);
    for (let c = 0; c <= 6; c++) put(L, 'kalas', c * B, G - 7 * B, nf);
    for (let c = 0; c < W.x / B - 1; c++) put(L, 'ray', c * B, G - B, nf);
  }, OL);
  put(p, 'fener', 2 * B, G - 6 * B); put(p, 'fener', 4 * B, G - 6 * B);
  return p.canvas();
}

// Cevher bloklari (16x16): toprak, kum, tas, komur, demir, define + 3 catlak
export const ORE_FRAMES = ['toprak', 'kum', 'tas', 'komur', 'demir', 'define', 'crack1', 'crack2', 'crack3'];
export function oreSheet() {
  const out = new Pix(B * ORE_FRAMES.length, B);
  ORE_FRAMES.forEach((k, i) => out.draw(block(k), i * B, 0, B));
  return { canvas: out.canvas(), fw: B, fh: B };
}

// kirilan bloktan sacilan parca (beyaz, oyunda renklendirilir)
export function chip() { return new Pix(3, 3).rect(0, 0, 3, 3, '#ffffff').canvas(); }

// Bonk Bombasi patlamasi: 4 kare, 4 piksellik kare parcaciklar
export function boomArt() {
  const fw = 52; const fh = 52;
  const out = new Pix(fw * 4, fh);
  const rings = [[8, '#f0d080', '#e09a3c'], [14, '#e09a3c', '#d0702e'], [18, '#d0702e', '#8c8a8f'], [20, '#8c8a8f', '#626066']];
  rings.forEach(([rad, a, b], f) => {
    for (let y = 0; y < fh; y += 4) {
      for (let x = 0; x < fw; x += 4) {
        const d = Math.hypot(x + 2 - 26, y + 2 - 26);
        if (d > rad) continue;
        if (f === 3 && d < rad * 0.5) continue;
        out.rect(f * fw + x, y, 4, 4, d < rad * 0.55 ? a : b);
      }
    }
  });
  return { canvas: out.canvas(), fw, fh };
}

// ------------------------------------------------------------------ toplanabilirler
const NODE_BLOCK = { herb: 'bitki', berry: 'cali', branch: 'dallar', shroom: 'mantarlar', palm: 'hurmalik', sand: 'kum_yigini' };
export function gatherNode(kind) {
  return build(['x'], { x: NODE_BLOCK[kind] || 'dallar' }).canvas();
}

// ------------------------------------------------------------------ simgeler
const ICONS = {
  dal: [['............', '..........g.', '.........gg.', '........bb..', '.......bB...', '......bB....', '.....bB.....', '....bB......', '...bB.......', '..bB........', '.bB.........', '............'],
    { b: '#b8804e', B: '#8e5e32', g: '#7cc25a' }],
  mantar: [['............', '....rrrr....', '..rrwrrrrr..', '.rrwwrrrwrr.', '.rrrrrrrrrr.', '.dddddddddd.', '....ssss....', '....ssss....', '....ssss....', '....ssSs....', '...ssssss...', '............'],
    { r: '#e8564a', w: '#fff3e2', d: '#b13c34', s: '#f2e4c4', S: '#d8c49c' }],
  diken: [['............', '..........w.', '.........wg.', '........wgg.', '.......wgg..', '......ggg...', '.....ggd....', '....ggd.....', '...ggd......', '..gdd.......', '..dd........', '............'],
    { w: '#eef8d4', g: '#a8cc66', d: '#7a9a44' }],
  yaprak: [['............', '......LLL...', '....LLvLLL..', '...LvLLLLLD.', '..LvLLLLLDD.', '..LvLLLLDDD.', '.LvLLLLDDD..', '.vLLLLDDD...', '.vLLLDDD....', 'vvLDDD......', 'v...........', '............'],
    { L: '#74c452', v: '#c8f0a0', D: '#55a040' }],
  yosun: [['............', '............', '....mMMm....', '..mMMmmMMm..', '.mMmmmmmMmm.', '.MmmmmMmmmM.', 'mmMmMmmmMmmm', 'dmmmmmmmmmmd', 'dddddddddddd', '.dddddddddd.', '............', '............'],
    { m: '#68a542', M: '#8acb5c', d: '#4c8434' }],
  kalp: [['............', '..AA....AA..', '.AaaA..AaaA.', 'AaGaaAAaaaaA', 'AaGaaaaaaaaA', 'AaaagGGgaaaA', '.Aaaagga.aA.', '..AaaaaaaA..', '...AaaaaA...', '....AaaA....', '.....AA.....', '............'],
    { A: '#7a4524', a: '#b0703a', G: '#d2ffaa', g: '#6ad86a' }],
  iksir: [['............', '.....cc.....', '.....kk.....', '....gkkg....', '...g....g...', '..gRRRRRRg..', '..gRwRRRRg..', '..gRwRRRRg..', '..gRRRRRrg..', '...grrrrg...', '....gggg....', '............'],
    { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', R: '#ec4c42', r: '#bf3630', w: '#ffd4cc' }],
  kilic_pas: [null, { W: '#c9a48c', B: '#9c6e56', G: '#6e4e3e', h: '#5e3e26', P: '#8e6e4e' }],
  kilic_tahta: [null, { W: '#e4b678', B: '#b88046', G: '#7e4e2a', h: '#6e3e1e', P: '#b88046' }],
  kilic_diken: [null, { W: '#daf6b0', B: '#68a842', G: '#a8cc66', h: '#4e3e26', P: '#86d462' }],
  kask_yosun: [['............', '............', '...mmmmmm...', '..mMMMMMMm..', '.mMMMMMMMMm.', '.mMMMMMMMMm.', '.mmmmmmmmmm.', '.mm......mm.', '.mm......mm.', '.dd......dd.', '............', '............'],
    { m: '#68a542', M: '#8acb5c', d: '#4c8434' }],
  gogus_yosun: [null, { m: '#68a542', M: '#8acb5c', y: '#b8e07a', d: '#4c8434' }],
  gogus_kabuk: [null, { m: '#86522a', M: '#b07a40', y: '#d4a060', d: '#68401f' }],
  bot_yosun: [['............', '............', '............', '..mm....mm..', '..mM....mM..', '..mM....mM..', '..mM....mM..', '..mMm...mMm.', '.mMMMm.mMMMm', '.ddddd.ddddd', '............', '............'],
    { m: '#68a542', M: '#8acb5c', d: '#4c8434' }],
  tilsim_yaprak: [['............', '..s......s..', '...s....s...', '....s..s....', '.....ss.....', '.....oo.....', '....oLLo....', '...oLvLLo...', '...oLLLLo...', '....oLLo....', '.....oo.....', '............'],
    { s: '#dccc96', o: '#d0a040', L: '#74c452', v: '#c8f0a0' }],
  cimen: [['............', '............', '..gggggggg..', '..gGgggGgg..', '..gdGgdgGg..', '..dddgddgd..', '..dDddddDd..', '..dddDdddd..', '..ddddddDd..', '..dDdddddd..', '............', '............'],
    { g: '#8cd060', G: '#62a844', d: '#a07150', D: '#7a5034' }],
  altin_elma: [['............', '......h.....', '.....hL.....', '...YYhYY....', '..YwYYYYY...', '..YwYYYYYo..', '..YYYYYYYo..', '..YYYYYYYo..', '...YYYYYo...', '....oooo....', '............', '............'],
    { Y: '#ffd04d', w: '#fff6c0', o: '#d29a22', h: '#7a4c2a', L: '#74c452' }],
  tilsim_can: [['............', '..s......s..', '...s....s...', '....s..s....', '....oooo....', '...oYYYYo...', '...oYrrYo...', '...orrrro...', '...oYrrYo...', '...oYYYYo...', '....oooo....', '............'],
    { s: '#dccc96', o: '#b07a2a', Y: '#ffd04d', r: '#ec4c42' }],
  tohum_ot: [['............', '............', '.....gg.....', '....g.......', '...pPPp.....', '..pPwPPp....', '..pPPPPp.pp.', '...pPPp.pPPp', '....pp..pPPp', '.........pp.', '............', '............'],
    { p: '#a08a5a', P: '#c8b07a', w: '#e0d0a0', g: '#6cbc4e' }],
  tohum_bogurtlen: [['............', '............', '....pp......', '...pPPp..pp.', '...pPwp.pPPp', '....pp..pPPp', '.........pp.', '..pp........', '.pPPp.......', '.pPPp.......', '..pp........', '............'],
    { p: '#5e2a3a', P: '#8a3a52', w: '#c05a6a' }],
  para: [['............', '....oooo....', '...oYYYYo...', '..oYyYYYYo..', '..oYYBBYYo..', '..oYYBYBYo..', '..oYYBBYYo..', '..oYYBYBYo..', '...oYBBYo...', '....oooo....', '............', '............'],
    { o: '#d29a22', Y: '#ffd04d', y: '#fff3a8', B: '#b8801e' }],
  tas: [['............', '............', '....SSSs....', '..SSssssS...', '.SssssssssS.', '.SsssDssssd.', '.ssssssssDd.', '.sssDsssssd.', '..dddddddd..', '............', '............', '............'],
    { S: '#bdb9c6', s: '#9e9aa6', d: '#7a7684', D: '#86828f' }],
  kum: [['............', '............', '............', '.....LL.....', '....LsLs....', '...LssssS...', '..LsssssssS.', '.ssssSsssssS', 'SSSSSSSSSSSS', '............', '............', '............'],
    { L: '#f6e6b4', s: '#e6cd88', S: '#cdb06c' }],
  komur: [['............', '............', '.....kkk....', '...kkHkkk...', '..kkHkkkkk..', '..kkkkkHkk..', '.kkHkkkkkkk.', '.kkkkkkHkkk.', '..kkkkkkkk..', '............', '............', '............'],
    { k: '#2e2a36', H: '#5a5664' }],
  demir_cevheri: [['............', '............', '....SSSs....', '..SSosssS...', '.SsoossssS..', '.SsssssooS..', '.ssoosssood.', '.ssossssssd.', '..dddddddd..', '............', '............', '............'],
    { S: '#bdb9c6', s: '#9e9aa6', d: '#7a7684', o: '#e0a882' }],
  kulce: [['............', '............', '............', '....LLLL....', '...LwwwwL...', '..LwwwwwwM..', '.MMMMMMMMMM.', '.MmmmmmmmmM.', '.mmmmmmmmmm.', '............', '............', '............'],
    { L: '#e4e6ec', w: '#cfd2da', M: '#a9adb8', m: '#8a8e9a' }],
  ot: [['............', '.....w......', '....wyw.....', '.....w.g....', '...g..gg....', '..ggg.g.gg..', '.gggggggggg.', '..GggGgGgG..', '...GGgGGG...', '.....G......', '............', '............'],
    { g: '#74c452', G: '#4e9a3a', w: '#ffffff', y: '#ffd95a' }],
  bogurtlen: [['............', '......g.....', '.....gg.....', '....rRr.....', '...rRrRr....', '...RrRrRr...', '....rRrRr...', '.....rRr....', '......r.....', '............', '............', '............'],
    { r: '#8a2a5a', R: '#d84a6a', g: '#6cbc4e' }],
  bal: [['............', '...cccccc...', '...cccccc...', '..gyyyyyyg..', '..gYYYYYYg..', '..gYyYYYYg..', '..gYYYYYYg..', '..gYYYYYoG..', '..gooooooG..', '...gggggg...', '............', '............'],
    { c: '#c99a6a', g: '#c4dcea', G: '#a8c4d4', y: '#ffe48a', Y: '#ffc23e', o: '#e0962a' }],
  sise: [['............', '.....cc.....', '.....kk.....', '....gkkg....', '...g....g...', '..g......g..', '..g.w....g..', '..g.w....g..', '..g......g..', '...g....g...', '....gggg....', '............'],
    { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', w: '#ffffff' }],
  kalas: [['............', '............', '............', '.LLLLLLLLLL.', '.wwwwwwwwww.', '.wwwdwwwwww.', '.dddddddddd.', '.LLLLLLLLLL.', '.wwwwwwwdww.', '.dddddddddd.', '............', '............'],
    { L: '#d8a46a', w: '#c08a52', d: '#946438' }],
  tugla: [['............', '.LLLLLLLLLL.', '.sssdssssds.', '.dddddddddd.', '.sdssssdsss.', '.dddddddddd.', '.sssdssssds.', '.dddddddddd.', '.sdssssdsss.', '.dddddddddd.', '............', '............'],
    { L: '#bdb9c6', s: '#a4a0ae', d: '#76727f' }],
  cam: [['............', '.ffffffffff.', '.fw.......f.', '.f.w......f.', '.f........f.', '.f........f.', '.f......w.f.', '.f.......wf.', '.f........f.', '.ffffffffff.', '............', '............'],
    { f: '#9ccce0', w: '#ffffff' }],
  corba: [['............', '....s..s....', '.....s..s...', '....s..s....', '............', '.bbbbbbbbbb.', '.BccmcccmcB.', '.BbbbbbbbbB.', '..BbbbbbbB..', '...BBBBBB...', '............', '............'],
    { s: '#e4e4ec', b: '#b8844c', B: '#8e5e32', c: '#e2b86a', m: '#e8564a' }],
  bomba: [['........y...', '.......yo...', '......f.....', '.....f......', '...kkkkk....', '..kkHkkkk...', '.kkHkkkkkk..', '.kkkkkkkkk..', '.kkkkkkkkk..', '..kkkkkkk...', '...kkkkk....', '............'],
    { k: '#3e3a48', H: '#7a7684', f: '#c99a6a', y: '#ffd04d', o: '#ff8a2e' }],
  kilic_tas: [null, { W: '#c4c0cc', B: '#8e8a98', G: '#7e4e2a', h: '#6e3e1e', P: '#a9a5b2' }],
  kilic_demir: [null, { W: '#eef0f4', B: '#a9adb8', G: '#5a5664', h: '#6e3e1e', P: '#8a8e9a' }],
  kazma_tahta: [null, { H: '#c08a52', D: '#946438', h: '#7e4e2a' }],
  kazma_tas: [null, { H: '#a9a5b2', D: '#7a7684', h: '#7e4e2a' }],
  kazma_demir: [null, { H: '#e4e6ec', D: '#a9adb8', h: '#7e4e2a' }],
  kask_tahta: [null, { m: '#a8743e', M: '#c99258', d: '#7e5434' }],
  kask_tas: [null, { m: '#8e8a98', M: '#a9a5b2', d: '#6a6674' }],
  kask_demir: [null, { m: '#a9adb8', M: '#dcdee6', d: '#7a7e8a' }],
  gogus_tahta: [null, { m: '#a8743e', M: '#c99258', y: '#d8a46a', d: '#7e5434' }],
  gogus_tas: [null, { m: '#8e8a98', M: '#a9a5b2', y: '#c4c0cc', d: '#6a6674' }],
  gogus_demir: [null, { m: '#a9adb8', M: '#dcdee6', y: '#f2f4f8', d: '#7a7e8a' }],
  bot_tahta: [null, { m: '#a8743e', M: '#c99258', d: '#7e5434' }],
  bot_tas: [null, { m: '#8e8a98', M: '#a9a5b2', d: '#6a6674' }],
  bot_demir: [null, { m: '#a9adb8', M: '#dcdee6', d: '#7a7e8a' }],
  // ---- 0.4 / 0.5
  turta: [['............', '............', '....cccc....', '..cccccccc..', '.cRcRccRcRc.', '.cccccccccc.', '.dddddddddd.', '.dRdRddRdRd.', '..dddddddd..', '...bbbbbb...', '............', '............'],
    { c: '#e4b678', R: '#9a3a52', d: '#c08a52', b: '#946438' }],
  bal_damlasi: [['............', '.....Y......', '.....YY.....', '....YYyY....', '....YyYY....', '...YYyYYY...', '...YYYYYo...', '...YYYYYo...', '....YYYo....', '.....oo.....', '............', '............'],
    { Y: '#ffc23e', y: '#ffe48a', o: '#e0962a' }],
  ezme: [['............', '............', '....mmmm....', '..mMmmMmmm..', '.bbbbbbbbbb.', '.BbbbbbbbbB.', '..BbbbbbbB..', '...BBBBBB...', '............', '............', '............', '............'],
    { m: '#b48ac8', M: '#e8dcf4', b: '#a9a5b2', B: '#76727f' }],
  seker: [['............', '............', '...w....w...', '..ww.cc.ww..', '...wcCCcw...', '...cCvCCc...', '...wcCCcw...', '..ww.cc.ww..', '...w....w...', '............', '............', '............'],
    { w: '#f0f0f4', c: '#7cb4d8', C: '#c8e6f8', v: '#ffffff' }],
  jole: [['............', '............', '....gggg....', '...gGGGgg...', '..gGwGGGgg..', '..gGGGGGgg..', '..ggGGGggg..', '.pppppppppp.', '.pPPPPPPPPp.', '..pppppppp..', '............', '............'],
    { g: '#5e9a5a', G: '#8ac47a', w: '#d4f0c4', p: '#d8d0c4', P: '#ecd8b0' }],
  hurma_tatlisi: [['............', '............', '...hh..hh...', '..hHHhhHHh..', '..hhhhhhhh..', '.YYYYYYYYYY.', '.YyyyyyyyyY.', '.pppppppppp.', '..pppppppp..', '............', '............', '............'],
    { h: '#7a3e1e', H: '#a85a2e', Y: '#ffc23e', y: '#ffe48a', p: '#d8d0c4' }],
  kristal: [['............', '.....c......', '....cCc.....', '....cvC..c..', '...cCvCc.cc.', '...cCCCc.cC.', '..cCvCCCcCc.', '..cCCCCCcc..', '...cCCCc....', '....ddd.....', '............', '............'],
    { c: '#7cb4d8', C: '#a8d4ec', v: '#e8f6ff', d: '#6e6a7a' }],
  ametist: [['............', '.....p......', '....pPp.....', '....pvP..p..', '...pPvPp.pp.', '...pPPPp.pP.', '..pPvPPPpPp.', '..pPPPPPpp..', '...pPPPp....', '....ddd.....', '............', '............'],
    { p: '#9a6cc8', P: '#c8a0ec', v: '#f0e0ff', d: '#6e6a7a' }],
  zar: [['............', '.a........a.', '.aa......aa.', '.aWa....aWa.', '.aWWa..aWWa.', '.aWWWaaWWWa.', '.aWWWWWWWWa.', '..aWWaaWWa..', '...aa..aa...', '............', '............', '............'],
    { a: '#3a3448', W: '#7a6e94' }],
  bocek_kanadi: [['............', '..cc........', '.cCCc.......', '.cCvCc......', '.cCCvCc.....', '..cCCvCc....', '...cCCCCc...', '....cCCCCc..', '.....ccccc..', '............', '............', '............'],
    { c: '#7cb4d8', C: '#c8e6f8', v: '#ffffff' }],
  altin_kanat: [['............', '..YY........', '.YyyY.......', '.YyvyY......', '.YyyvyY.....', '..YyyvyY....', '...YyyyyY...', '....YyyyyY..', '.....OOOOO..', '............', '............', '............'],
    { Y: '#e8c050', y: '#fff0a0', v: '#ffffff', O: '#b88a30' }],
  cekirdek: [['............', '....ssss....', '...sSSSSs...', '..sSpPpSSs..', '..sSPvPpSs..', '..sSpPPpSs..', '..sSSppSSs..', '...sSSSSs...', '....ssss....', '............', '............', '............'],
    { s: '#6a6674', S: '#8a8696', p: '#9c6cd0', P: '#d0b0f4', v: '#ffffff' }],
  igne: [['............', '..........s.', '.........sS.', '........tt..', '.......tt...', '......tt....', '.....tt.....', '....tT......', '...tT.......', '..tT........', '............', '............'],
    { s: '#8a5aa0', S: '#c8a0ec', t: '#c4a06a', T: '#9c7a48' }],
  kaktus_suyu: [['............', '.....cc.....', '.....kk.....', '....gkkg....', '...g....g...', '..gGGGGGGg..', '..gGwGGGGg..', '..gGwGGGGg..', '..gGGGGGgg..', '...ggggggg..', '............', '............'],
    { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', G: '#7ab46a', w: '#d4f0c4' }],
  pul: [['............', '............', '....SSSS....', '...SsssSS...', '..SsSSsssS..', '..SsssSssS..', '..SSssssSS..', '...SSssSS...', '....SSSS....', '............', '............', '............'],
    { S: '#a8784a', s: '#d8b070' }],
  sargi: [['............', '............', '...bbbbbb...', '..bBbbbbBb..', '..bbbBbbbb..', '..bBbbbbBb..', '..bbbBbbbbbb', '..bBbbbbBb.b', '...bbbbbb...', '............', '............', '............'],
    { b: '#e4dcc4', B: '#bfb49a' }],
  dis: [['............', '....wwww....', '...wwvwww...', '...wvwwwd...', '....wwwd....', '....wwwd....', '.....wwd....', '.....wd.....', '......d.....', '............', '............', '............'],
    { w: '#f0e8d4', v: '#ffffff', d: '#c8b896' }],
  hurma: [['............', '.....g......', '....gg......', '...hHh......', '..hHHhh.hh..', '..hhHhh.hHh.', '...hhh.hHHh.', '.......hhh..', '............', '............', '............', '............'],
    { h: '#7a3e1e', H: '#b06a3a', g: '#6a9a46' }],
  matara: [['............', '.....cc.....', '....bccb....', '...bbbbbb...', '..bLLLLLLb..', '..bLwLLLLb..', '..bLLLLLLb..', '..bLLLLLLb..', '..bbbbbbbb..', '...bbbbbb...', '............', '............'],
    { c: '#5a4a3a', b: '#8a6a40', L: '#7cb4d8', w: '#c8e6f8' }],
  iksir_orta: [['............', '.....cc.....', '....gkkg....', '...g....g...', '..gRRRRRRg..', '.gRwRRRRRRg.', '.gRwRRRRRRg.', '.gRRRRRRRrg.', '.gRRRRRRrrg.', '..grrrrrrg..', '...gggggg...', '............'],
    { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', R: '#e07a3a', r: '#b8562a', w: '#ffd4b0' }],
  canta: [['............', '....bbbb....', '...b....b...', '..BBBBBBBB..', '.BbbbbbbbbB.', '.BbbbYYbbbB.', '.BbbbYYbbbB.', '.BbbbbbbbbB.', '.BbbbbbbbbB.', '.BBBBBBBBBB.', '............', '............'],
    { b: '#a87a4a', B: '#7a5434', Y: '#e8c050' }],
  eldiven: [['............', '..ggg.......', '.gGGGgg.....', '.gGGGGGgg...', '.gGGGGGGGg..', '.gGcGGGGGGg.', '.gGGGGGGGGg.', '..gGGGGGGg..', '...SSSSSS...', '...SsssSS...', '............', '............'],
    { g: '#6a6674', G: '#8a8696', c: '#9c6cd0', S: '#5a5664', s: '#76727f' }],
  tilsim_skarabe: [['............', '..s......s..', '...s....s...', '....s..s....', '....oooo....', '...oYYYYo...', '...oYyyYo...', '...oYyyYo...', '...oYYYYo...', '....oooo....', '............', '............'],
    { s: '#dccc96', o: '#b07a2a', Y: '#e8c050', y: '#fff0a0' }],
  kilic_golem: [null, { W: '#c8e6f8', B: '#8a8696', G: '#9c6cd0', h: '#5a5664', P: '#76727f' }],
  yay_tahta: [null, { W: '#c08a52', B: '#7e4e2a', s: '#e4dcc4' }],
  yay_tas: [null, { W: '#a9a5b2', B: '#6a6674', s: '#e4dcc4' }],
  yay_demir: [null, { W: '#dcdee6', B: '#8a8e9a', s: '#e4dcc4' }],
  yay_firtina: [null, { W: '#e8c050', B: '#a87a30', s: '#f4f0e8' }],
  yay_cakal: [null, { W: '#d49a54', B: '#8a5a2e', s: '#ecd8b0' }],
};
const BOW = ['......WB....', '.....W..s...', '....W...s...', '...W....s...', '...W....s...', '..WB....s...', '..WB....s...', '...W....s...', '...W....s...', '....W...s...', '.....W..s...', '......WB....'];
const PICK = ['............', '...DHHHHD...', '..HH....HH..', '.HD..h...DH.', '.D...h....D.', '.....h......', '.....h......', '.....h......', '.....h......', '.....h......', '.....h......', '............'];
const SWORD = ['............', '...........W', '..........WB', '.........WB.', '........WB..', '.......WB...', '..G...WB....', '...G.WB.....', '....G.......', '...h.G......', '..h...G.....', '.P..........'];
const CHESTPLATE = ['............', '.mmm....mmm.', '.mMMmmmmMMm.', '.mMMMMMMMMm.', '..mMMyMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mmmmmmmm..', '..dddddddd..', '............', '............'];


// Simgeler 16x16: blok olan esyalar blogun kendisi, digerleri 12x12 cizimden
// golgelendirilip (sol ust acik, sag alt koyu) ve renkleri biraz soldurulup cizilir.
const ICON_BLOCKS = {
  tas: 'tas', kum: 'kum', kalas: 'kalas', tugla: 'tugla', cam: 'cam', cimen: 'cimen', demir_cevheri: 'demir',
  kutuk: 'kutuk', kaldirim: 'kaldirim', kiremit: 'kiremit', yaprak_blok: 'yaprak', tarla: 'tarla',
};
// saydam zeminli bloklar: cercevesiz, sadece cizgiyle
const ICON_PROPS = { cit: 'cit', fener: 'fener', kapi: 'kapi_alt' };
const mute = (v) => {
  const c = unpack(v); const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  return pack(mul(mix(c.slice(0, 3), [l, l, l], 0.18), 0.94), c[3]);
};
const iconCache = {};
export function iconUrl(name) {
  if (iconCache[name]) return iconCache[name];
  let p;
  if (ICON_PROPS[name]) {
    p = new Pix(16, 16);
    const bl = block(ICON_PROPS[name]);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) { const v = bl.d[Math.floor(y * 16 / 14) * 16 + Math.floor(x * 16 / 14)]; if (v >>> 24) p.set(1 + x, 1 + y, v); }
    p.outline(INK);
  } else if (ICON_BLOCKS[name]) {
    p = new Pix(16, 16);
    const b = block(ICON_BLOCKS[name]);
    for (let y = 0; y < 14; y++) for (let x = 0; x < 14; x++) p.set(1 + x, 1 + y, b.d[Math.floor(y * 16 / 14) * 16 + Math.floor(x * 16 / 14)]);
    p.outline(INK);
    for (let i = 0; i < 16; i++) { p.set(i, 0, 0); p.set(i, 15, 0); p.set(0, i, 0); p.set(15, i, 0); }
    p.rect(1, 0, 14, 1, INK); p.rect(1, 15, 14, 1, INK); p.rect(0, 1, 1, 14, INK); p.rect(15, 1, 1, 14, INK);
  } else {
    const def = ICONS[name] || ICONS.dal;
    let rows = def[0];
    if (!rows) {
      if (name.startsWith('kilic')) rows = SWORD;
      else if (name.startsWith('yay')) rows = BOW;
      else if (name.startsWith('kazma')) rows = PICK;
      else if (name.startsWith('kask')) rows = ICONS.kask_yosun[0];
      else if (name.startsWith('bot')) rows = ICONS.bot_yosun[0];
      else rows = CHESTPLATE;
    }
    const raw = new Pix(16, 16);
    raw.map(rows, def[1], 2, 2);
    p = new Pix(16, 16);
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const v = raw.get(x, y);
        if (!(v >>> 24)) continue;
        let f = 1;
        if (!(raw.get(x - 1, y) >>> 24) || !(raw.get(x, y - 1) >>> 24)) f = 1.14;
        else if (!(raw.get(x + 1, y) >>> 24) || !(raw.get(x, y + 1) >>> 24)) f = 0.8;
        p.set(x, y, mute(pack(mul(unpack(v).slice(0, 3), f))));
      }
    }
    p.outline(INK);
  }
  iconCache[name] = p.canvas().toDataURL();
  return iconCache[name];
}
