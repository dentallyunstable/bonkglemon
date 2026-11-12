// Kodla kurulan sahneler ve nesneler (0.3, Eren 2026-11-07):
// Her sey 16x16 bloklardan (blocks.js) blok blok kurulur: ev, maden, agac, zemin, arka plan.
// - Yakin nesnelerin (ev, sandik, tezgah...) etrafinda karakterdeki gibi 1 piksel koyu cizgi var.
// - Uzaktaki tepeler ve agaclar ayni bloklardir, sadece gok rengine karisip soluklasir.
// - Zindan katlari derinlestikce sahne aksama / geceye doner.
import { GAME_W, GAME_H, GROUND_Y, FISH, CAPE_COLORS, KITCHEN, SEED_OF } from './data.js';
import { rng, Pix, hex, mix, mul, pack, unpack, col, INK } from './pix.js';
import { B, block, build } from './blocks.js';

export { rng, hex, INK };

const G = GROUND_Y;
// 0.8.9: dis cizgi siyah degil, nesnenin kendi renginin koyusu (Glemonlardaki gibi yumusak)
const OL = 'dark';
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
// 0.10.5: yatakta gece uyuyunca sabaha (08:00) kadar gunduz sayilir
export const TOD_SKIP = { until: 0 };
// M4 (1.0.22, Eren karari 2026-11-12): gun vakti gercek saate bagli, oyun ici dongu yok.
// 06-08 gundogumu, 08-18 gun, 18-20 gunbatimi, 20-06 gece. Yatakta uyuyunca sabaha (08:00) kadar gunduz.
export function todNow(d = new Date()) {
  if (d.getTime() < TOD_SKIP.until) return 'gun';
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6 && h < 8) return 'gundogumu';
  if (h >= 8 && h < 18) return 'gun';
  if (h >= 18 && h < 20) return 'gunbatimi';
  return 'gece';
}
// bir sonraki sabah 08:00 (yatakta uyuyunca buraya kadar gunduz sayilir)
export function nextMorning(t = Date.now()) {
  const d = new Date(t); const m = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 8).getTime();
  return m > t ? m : new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 8).getTime();
}
// gecenin bitmesine (06:00) kalan dakika
export function todLeftMin(t = Date.now()) {
  const d = new Date(t); let e = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 6).getTime();
  if (e <= t) e = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 6).getTime();
  return Math.ceil((e - t) / 60000);
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
function tree(p, x, groundY, trunk, fn = null, wide = true, leaf = 'yaprak') {
  for (let k = 0; k < trunk; k++) put(p, 'kutuk', x, groundY - (k + 1) * B, fn);
  const top = groundY - trunk * B; // en ust kutugun ust kenari
  const rows = wide ? [[-2, 2], [-2, 2], [-1, 1], [0, 0]] : [[-1, 1], [-1, 1], [0, 0]];
  const cut = wide && (Math.round(x / B) % 2 === 0); // bazi agaclarda 2. siranin koseleri bos
  rows.forEach(([a, b], j) => {
    for (let i = a; i <= b; i++) {
      if (cut && j === 1 && (i === a || i === b)) continue;
      if (j === 0 && i === 0) continue; // govde gorunsun
      put(p, leaf, x + i * B, top + B - (j + 1) * B, fn);
    }
  });
}


// Uzak katmanlar (Eren, 2026-11-07: "bloklar cok yakin gorunuyor"): ayni bloklar kucultulmus
// olarak (4 ve 8 piksel) arkaya dizilir ve goge karisir; boylece derinlik hissi olur.
function farMountains(p, r, baseY, s, minH, maxH, top, body, fn, step = 0.5) {
  const cols = Math.ceil(p.w / s) + 1;
  let h = minH + Math.floor(r() * (maxH - minH + 1));
  let dir = 1;
  for (let c = 0; c < cols; c++) {
    if (r() < step) { if (r() < 0.25) dir = -dir; h = Math.max(minH, Math.min(maxH, h + dir)); }
    for (let k = 0; k < h; k++) putScaled(p, k >= h - 1 ? top : body, c * s, baseY - (k + 1) * s, s, fn);
  }
}
function farTrees(p, r, baseY, s, fn, leaf = 'yaprak') {
  for (let x = Math.floor(r() * 3) * s; x < p.w + s; x += s * (2 + Math.floor(r() * 3))) {
    const th = 1 + Math.floor(r() * 2);
    for (let k = 0; k < th; k++) putScaled(p, 'kutuk', x, baseY - (k + 1) * s, s, fn);
    for (const [i, j] of [[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1], [0, 2]]) putScaled(p, leaf, x + i * s, baseY - (th + 1 + j) * s, s, fn);
  }
}

// katmani cizgisiyle ana tuvale bas
function layer(p, fill, ol = 'dark', f = 0.55) {
  const L = new Pix(p.w, p.h);
  fill(L);
  if (ol) L.outline(ol, f);
  p.draw(L, 0, 0, L.w);
}

// ------------------------------------------------------------------ orman (us + zindan odalari)
// 1.0.12: yeni manzara sistemine (sceneRoom) devredildi
export function forestBackground(floor, variant = 0, base = false, width = GAME_W, tod = null) {
  return sceneRoom('orman', floor, variant, { base, width, tod });
}

// ------------------------------------------------------------------ savas ekrani
// Kamera oyuncunun sirtindan bakar. Ufuk yukarida, zemin blok izgarasi perspektifle
// bize dogru buyur (uzak bloklar kucuk, yakin bloklar buyuk). Glemonlar ortadaki
// uzak cimende, oyuncu sol altta.
export const ARENA = { horizon: 92, enemyY: G - 29, nearY: 206 }; // 0.8.9: Glemonlar ortadaki tumsekte
export function battleBackground(floor = 1, zone = 'orman') {
  if (zone === 'magara') return caveArena(floor);
  if (zone === 'col') return desertArena(floor);
  if (BIOME[zone]) return biomeArena(floor, zone);
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
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? 'kum' : (c * 13 + row * 7) % 17 === 0 ? 'toprak' : 'cimen_ust'), skyLow);
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
function caveWall(p, r, bottom, D, deep, variant = 0) {
  const s = 8;
  for (let y = bottom - s; y > -s; y -= s) for (let x = -4; x < GAME_W + s; x += s) {
    const hh = ((x * 73856093) ^ (y * 19349663)) >>> 0;
    putScaled(p, 'tas_duvar', x + ((Math.floor(y / s) % 2) ? 4 : 0), y, s, chain(shadeFn(hh % 7 === 0 ? 0.8 : 0.9), fogFn(D, 0.34 + deep * 0.1)));
  }
  // uzak tunel agizlari: yamuk kenarli, ici derin
  const off = Math.floor(r() * 60);
  for (let a = off + 30; a < GAME_W; a += 150 + Math.floor(r() * 40)) {
    const rx = 22 + Math.floor(r() * 10); const ry = 50 + Math.floor(r() * 12); const by = bottom;
    for (let y = by - ry - 6; y < by; y++) for (let x = a - rx - 6; x <= a + rx + 6; x++) {
      if (x < 0 || x >= GAME_W) continue;
      const j = Math.sin(y * 0.6 + a) * 1.5 + Math.sin(x * 0.4) * 1.2;
      const d = Math.hypot((x - a) / (rx + j), (y - by) / ry);
      if (d < 1) p.set(x, y, pack(mix(hex('#030208'), hex('#1c1628'), Math.pow(Math.max(0, (y - (by - ry)) / ry), 1.8))));
      else if (d < 1 + 6 / rx) { const b = block('tas').d[(((y % B) + B) % B) * B + (((x % B) + B) % B)]; p.set(x, y, chain(shadeFn(0.85), fogFn(D, 0.3))(b)); }
    }
  }
  // duvarda kucuk kristal damarlari
  for (let i = 0; i < 5; i++) {
    const x = Math.floor(r() * GAME_W); const y = 50 + Math.floor(r() * (bottom - 90)); const blue = r() < 0.5;
    putScaled(p, blue ? 'kristal_b' : 'kristal_m', x, y, 8, fogFn(D, 0.25));
    glowAt(p, x + 4, y + 4, 22, blue ? '#7cc8f0' : '#b48ae0', 0.28);
  }
  darkenRows(p, 0, 60, 0.8, 0, D);
}
export function caveRoomBackground(floor, variant = 0, dark = false) {
  // 1.0.12: Kule gibi derinlikli: uzak duvar 8 px, tunel kemerleri, sarkitlar, kristal isiklari
  const r = rng(floor * 6131 + variant * 911 + (dark ? 5 : 0));
  const deep = Math.min(1, (floor - 11) / 9);
  const D = CAVE_DARK;
  const nf = fogFn(D, (dark ? 0.62 : 0.14) + deep * 0.12);
  const p = new Pix(GAME_W, GAME_H);
  p.rect(0, 0, GAME_W, GAME_H, D);
  const s = 8;
  caveWall(p, r, G, D, deep, variant);
  // orta kaya sirti (8 px)
  layer(p, (L) => ridge(L, r, G - 2, 8, 8, 28, 'tas', 'tas', chain(shadeFn(0.8), fogFn(D, 0.3)), 2, G), 'dark', 0.4);
  darkenRows(p, G - 26, G, 0, 0.3, D);
  // tavan: kaya sirasi + sarkitlar (8 ve 16 px)
  layer(p, (L) => {
    for (let x = 0; x < GAME_W; x += s) { const h = 1 + Math.round(1.5 + Math.sin(x * 0.05 + variant) * 1.2 + r()); for (let k = 0; k < h; k++) putScaled(L, 'tas', x, k * s, s, chain(shadeFn(0.66), nf)); if (r() < 0.22) putScaled(L, 'sarkit', x, h * s, s, chain(shadeFn(0.8), nf)); }
    for (let i = 0; i < 4; i++) put(L, 'sarkit', Math.floor(r() * (GAME_W / B)) * B, 2 * s + Math.floor(r() * 2) * s, chain(shadeFn(0.75), nf));
  }, 'dark', 0.5);
  for (let c = 0; c < GAME_W / B; c++) {
    put(p, 'magara_zemin', c * B, G, nf);
    put(p, (c * 5 + variant) % 7 === 2 ? 'komur' : (c * 3 + floor) % 11 === 0 ? 'demir' : 'tas', c * B, G + B, chain(shadeFn(0.8), nf));
    put(p, 'kaldirim', c * B, G + 2 * B, chain(shadeFn(0.65), nf));
  }
  darkenRows(p, G + 6, GAME_H, 0, 0.35, D);
  // kristaller: isik saciyor
  for (let i = 0; i < 4; i++) {
    const c = Math.floor(r() * (GAME_W / B));
    const blue = r() < 0.5;
    put(p, blue ? 'kristal_b' : 'kristal_m', c * B, G - B + 1, dark ? fogFn(D, 0.35) : null);
    if (!dark) { glowAt(p, c * B + 8, G - 6, 40, blue ? '#7cc8f0' : '#b48ae0', 0.38); glowAt(p, c * B + 8, G - 8, 10, '#f0f0ff', 0.25); }
  }
  if (r() < 0.6) put(p, 'mantarlar', Math.floor(r() * (GAME_W / B)) * B, G - B + 1, nf);
  return p.canvas();
}

// 1.0.12: Magara savasi: odadaki gibi duvar + perspektifli zemin
export function caveStage(level = 1, variant = 0) {
  const r = rng(level * 4513 + variant * 71 + 9);
  const D = CAVE_DARK; const HZ = 136; const s = 8;
  const p = new Pix(GAME_W, GAME_H);
  p.rect(0, 0, GAME_W, GAME_H, D);
  caveWall(p, r, HZ, D, 0.2, variant);
  layer(p, (L) => ridge(L, r, HZ, 6, 6, 20, 'tas', 'tas', chain(shadeFn(0.8), fogFn(D, 0.32)), 2, HZ + 2), 'dark', 0.4);
  darkenRows(p, HZ - 20, HZ, 0, 0.3, D);
  arenaGround(p, HZ, fogFn(D, 0.14), (onPath, c, row) => (onPath ? 'kaldirim' : ((((c * 374761393) ^ (row * 668265263)) >>> 0) % 11 === 0 ? 'komur' : 'magara_zemin')), D);
  layer(p, (L) => {
    for (let x = 0; x < GAME_W; x += s) { const h = 1 + Math.round(1.5 + Math.sin(x * 0.05 + variant) * 1.2 + r()); for (let k = 0; k < h; k++) putScaled(L, 'tas', x, k * s, s, shadeFn(0.6)); if (r() < 0.25) putScaled(L, 'sarkit', x, h * s, s, shadeFn(0.75)); }
    for (const x of [20, 150, 300]) putScaled(L, 'sarkit', x, 24, 24, shadeFn(0.7));
  }, 'dark', 0.5);
  const lights = [];
  for (let i = 0; i < 5; i++) { const x = i % 2 ? 330 + Math.floor(r() * 50) : 20 + Math.floor(r() * 120); const y = HZ + 4 + Math.floor(r() * 30); lights.push([x, y, r() < 0.5]); }
  const C = new Pix(GAME_W, GAME_H);
  for (const [x, y, blue] of lights) putScaled(C, blue ? 'kristal_b' : 'kristal_m', x, y - Math.round(6 + (y - HZ) * 0.4), Math.round(6 + (y - HZ) * 0.4), null);
  putScaled(C, 'kristal_m', GAME_W - 52, GAME_H - 40, 36, null);
  C.outline('dark', 0.45);
  p.draw(C, 0, 0, C.w);
  for (const [x, y, blue] of lights) glowAt(p, x + 4, y - 6, 26, blue ? '#7cc8f0' : '#b48ae0', 0.4);
  glowAt(p, GAME_W - 34, GAME_H - 22, 50, '#b48ae0', 0.35);
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
  farMountains(p, r, G - 2 * B, 4, 6, 18, 'kum', 'kumtasi', fogFn(skyLow, 0.78));
  farMountains(p, r, G - B, 8, 2, 6, 'kum', 'kumtasi', fogFn(skyLow, 0.66), 0.35);
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
// Duz zemin: her ekran pikseli perspektifle yere izdusurulur (tek parca, duz bir yuzey).
// Bloklar yine 16x16 dokular; yakinda iri, uzakta kucuk ve sise karisir.
function arenaGround(p, HZ, nf, pick, fogCol = null) {
  const vx = 192; // kaybolma noktasi
  const F = 190; // yatay olcek (buyudukce zemin daha "yatik" gorunur)
  const K = 9000; // derinlik olcegi
  const C = 3; // ufuk cizgisinin hemen altinda sonsuza gitmesin
  const tex = {};
  const T = (n) => tex[n] || (tex[n] = block(n).d);
  // patika: oyuncunun onunden dusmanlarin ortasina giden duz bir yol (dunya koordinatinda)
  const vNear = K / (GAME_H - HZ + C);
  const uNear = ((40 - vx) * vNear) / F;
  const vFar = K / 18;
  const uFar = ((vx - 6 - vx) * vFar) / F;
  const pathU = (v) => uNear + ((uFar - uNear) * (v - vNear)) / (vFar - vNear);
  for (let y = HZ; y < GAME_H; y++) {
    const dy = y - HZ + C;
    const v = K / dy;
    const dim = 0.74 + 0.26 * Math.min(1, (y - HZ) / 70);
    const shade = chain(shadeFn(dim), nf);
    const far = Math.max(0, 1 - (y - HZ) / 26); // ufka yakin satirlar sise karisir
    const tv = Math.floor(v / B);
    const py = ((Math.floor(v) % B) + B) % B;
    for (let x = 0; x < GAME_W; x++) {
      const u = ((x - vx + 0.5) * v) / F;
      const tu = Math.floor(u / B);
      const onPath = Math.abs((tu + 0.5) * B - pathU((tv + 0.5) * B)) < B * 1.05;
      const px = ((Math.floor(u) % B) + B) % B;
      let c = T(pick(onPath, tu, tv))[py * B + px];
      c = shade(c);
      if (far > 0 && fogCol) c = fogFn(fogCol, far * 0.85)(c);
      p.set(x, y, c);
    }
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
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? 'kaldirim' : (c * 13 + row * 7) % 11 === 0 ? 'komur' : 'magara_zemin'), CAVE_DARK);
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
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? 'kumtasi' : (c * 13 + row * 7) % 17 === 0 ? 'kumtasi' : 'kum'), '#e8d6b0');
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

// ------------------------------------------------------------------ 0.8 Donmus Zirve, Kor Diyari, Golge Boslugu
// Uc yeni bolge ayni duzenle cizilir: gok, uzak daglar (kucuk bloklar), orta katman, zemin, suslemeler.
const BIOME = {
  buz: {
    stops: ['#7c98bc', '#a8c0d8', '#dce6ee'], t: 0, clouds: 3,
    far: ['kar_ust', 'tas'], mid: ['kar_ust', 'buz'], hill: ['kar', 'donmus_toprak'],
    ground: ['kar', 'donmus_toprak', 'tas'], props: ['karli_cali', 'kristal_b', 'buz'], trees: 'karli_yaprak',
    arena: { path: 'buz', main: 'kar_ust', alt: 'buz', near: ['buz', 'kristal_b'] },
  },
  kor: {
    stops: ['#24141a', '#5a2420', '#b4502a'], t: 0.1, clouds: 0, sun: 'left',
    far: ['kor_kaya', 'bazalt'], mid: ['kor_kaya', 'bazalt'], hill: ['bazalt', 'bazalt'],
    ground: ['bazalt', 'kor_kaya', 'bazalt'], props: ['kor_kristal', 'olu_agac', 'biberlik'], lavaPools: true,
    arena: { path: 'kor_kaya', main: 'bazalt', alt: 'lav', near: ['kor_kristal', 'olu_agac'] },
  },
  golge: {
    stops: ['#0c0816', '#22183a', '#46345e'], t: 0.9, clouds: 0, stars: true,
    far: ['golge_tas', 'golge_tas'], mid: ['golge_zemin', 'golge_tas'], hill: ['golge_zemin', 'golge_tas'],
    ground: ['golge_zemin', 'golge_tas', 'golge_tas'], props: ['golge_kristal', 'gece_mantarlari', 'olu_agac'],
    arena: { path: 'golge_tas', main: 'golge_zemin', alt: 'golge_tas', near: ['golge_kristal', 'gece_mantarlari'] },
  },
  cekirdek: { // 1.0 Yildiz Cekirdegi
    stops: ['#04061a', '#121c4a', '#3a2a6a'], t: 0.9, clouds: 0, stars: true, starCol: '#fff0a0',
    far: ['yildiz_tas', 'yildiz_tas'], mid: ['yildiz_zemin', 'yildiz_tas'], hill: ['yildiz_zemin', 'yildiz_tas'],
    ground: ['yildiz_zemin', 'yildiz_tas', 'yildiz_tas'], props: ['yildiz_kristal', 'nebula_kristal', 'golge_kristal'],
    arena: { path: 'yildiz_tas', main: 'yildiz_zemin', alt: 'yildiz_tas', near: ['yildiz_kristal', 'nebula_kristal'] },
  },
};
export const BIOME_KEYS = Object.keys(BIOME);
function biomeSky(p, b, bottom, r) {
  paintSky(p, bottom, 0, r, { stops: b.stops, clouds: b.clouds, sun: b.sun });
  if (b.stars) {
    for (let i = 0; i < 40; i++) p.set(Math.floor(r() * p.w), Math.floor(r() * bottom * 0.75), r() < 0.3 ? (b.starCol || '#c8a0f0') : '#d8d4ec');
  }
  if (b.sun === 'left') {
    // kor diyarinda gunes yerine kizgin pus: ufukta parlak bant
    for (let y = bottom - 30; y < bottom; y++) for (let x = 0; x < p.w; x++) {
      const v = p.get(x, y); const c = unpack(v);
      p.set(x, y, pack(mix(c.slice(0, 3), hex('#e07034'), 0.25 * (y - bottom + 30) / 30)));
    }
  }
}
export function biomeRoomBackground(zone, floor, variant = 0) {
  const b = BIOME[zone];
  const r = rng(floor * 5309 + variant * 787 + zone.length * 31);
  const deep = Math.min(1, ((floor - 1) % 10) / 9);
  const nf = b.t > 0.5 ? fogFn(zone === 'cekirdek' ? '#0a1030' : '#120c20', 0.12 + deep * 0.1) : zone === 'kor' ? fogFn('#40140c', 0.08 + deep * 0.12) : nightFn(deep * 0.3);
  const p = new Pix(GAME_W, GAME_H);
  biomeSky(p, b, G - 2 * B, r);
  const skyLow = toHex(skyColor(9, 0, b.stops));
  farMountains(p, r, G - 2 * B, 4, 8, 24, b.far[0], b.far[1], fogFn(skyLow, 0.78));
  if (b.trees) farTrees(p, r, G - 2 * B + 6, 6, fogFn(skyLow, 0.66), b.trees);
  farMountains(p, r, G - B, 8, 2, 7, b.mid[0], b.mid[1], fogFn(skyLow, 0.6), 0.4);
  // orta katman: tepeler ve buyuk kayaliklar
  layer(p, (L) => {
    const colsN = Math.ceil(GAME_W / B) + 1;
    let h = 1 + Math.floor(r() * 2);
    for (let c = 0; c < colsN; c++) {
      if (r() < 0.4) h = Math.max(0, Math.min(3, h + (r() < 0.5 ? -1 : 1)));
      for (let k = 0; k < h; k++) put(L, k === h - 1 ? b.hill[0] : b.hill[1], c * B, G - (k + 1) * B, chain(fogFn(skyLow, 0.32), nf));
    }
    if (b.trees) for (let i = 0; i < 2 + Math.floor(r() * 2); i++) tree(L, Math.floor(r() * (GAME_W / B)) * B, G, 3 + Math.floor(r() * 2), chain(shadeFn(0.9), nf), true, b.trees);
  }, 'dark', 0.5);
  // zemin
  for (let c = 0; c < GAME_W / B; c++) {
    const pool = b.lavaPools && (c * 7 + variant * 3 + floor) % 9 === 4;
    put(p, pool ? 'lav' : b.ground[0], c * B, G, nf);
    put(p, (c * 7 + variant) % 9 === 3 ? b.ground[1] : b.ground[2], c * B, G + B, chain(shadeFn(0.88), nf));
    put(p, b.ground[2], c * B, G + 2 * B, chain(shadeFn(0.75), nf));
  }
  // susler
  layer(p, (L) => {
    for (let i = 0; i < 4; i++) put(L, b.props[Math.floor(r() * b.props.length)], Math.floor(r() * (GAME_W / B)) * B, G - B, nf);
  }, 'dark', 0.5);
  return p.canvas();
}
function biomeArena(floor, zone) {
  const b = BIOME[zone];
  const a = b.arena;
  const HZ = ARENA.horizon;
  const r = rng(floor * 9173 + zone.length);
  const nf = zone === 'golge' ? fogFn('#120c20', 0.15) : zone === 'cekirdek' ? fogFn('#0a1030', 0.12) : zone === 'kor' ? fogFn('#40140c', 0.12) : null;
  const p = new Pix(GAME_W, GAME_H);
  biomeSky(p, b, HZ, r);
  const skyLow = toHex(skyColor(5, 0, b.stops));
  const s1 = 8;
  const far = new Pix(GAME_W, GAME_H);
  for (let x = 0, h = 2; x < GAME_W; x += s1) {
    if (r() < 0.4) h = Math.max(1, Math.min(5, h + (r() < 0.5 ? -1 : 1)));
    for (let k = 0; k < h; k++) putScaled(far, k === h - 1 ? b.mid[0] : b.mid[1], x, HZ - (k + 1) * s1, s1, fogFn(skyLow, 0.45));
    if (r() < 0.1) putScaled(far, b.props[0], x, HZ - (h + 1) * s1, s1, fogFn(skyLow, 0.3));
  }
  far.outline('dark', 0.6);
  p.draw(far, 0, 0, far.w);
  const fog = zone === 'buz' ? '#dce6ee' : zone === 'kor' ? '#8a3a22' : zone === 'cekirdek' ? '#1a2460' : '#2a1e40';
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? a.path : (c * 13 + row * 7) % 13 === 0 ? a.alt : a.main), fog);
  const near = new Pix(GAME_W, GAME_H);
  putScaled(near, a.near[0], GAME_W - 66, GAME_H - 40, 40, nf);
  putScaled(near, a.near[1], -6, GAME_H - 44, 44, nf);
  putScaled(near, a.near[0], 300, GAME_H - 30, 28, nf);
  if (zone === 'buz') for (let i = 0; i < 6; i++) putScaled(near, 'buz_sarkit', i * 70 - 10, -6, 28, null);
  near.outline('dark', 0.5);
  p.draw(near, 0, 0, near.w);
  return p.canvas();
}

// ------------------------------------------------------------------ gol (0.8.5)
// Yandan gorunen gol: zemin sirasinin yerine su, iskele (ya da odada boydan boya kopru).
// Su yuzeyi zeminden biraz asagida; aradaki seritte karsi kiyinin camuru gorunur.
export const POND = { x0: 13 * B, x1: 22 * B, surf: G + 6, deck: G - 4, standX: 232, bobX: 300 };
const WATER_TINT = {
  us: null, orman: null, magara: ['#20344c', 0.4], col: ['#3aa8a0', 0.35], buz: ['#a8c8e0', 0.3],
  kor: 'lav', golge: ['#2a1e48', 0.5], cekirdek: ['#1a2a6a', 0.45],
};
export function pondOverlay(kind = 'us', bridge = false) {
  const p = new Pix(GAME_W, GAME_H - G + B);
  const tint = WATER_TINT[kind];
  const lava = tint === 'lav';
  const fn = tint && !lava ? fogFn(tint[0], tint[1]) : null;
  const Y = B; // overlay G-B'den baslar
  const { x0, x1 } = POND;
  // kiyi: iki yanda egimli camur / kum
  const bank = kind === 'col' ? 'kum' : kind === 'buz' ? 'kar' : kind === 'kor' ? 'bazalt' : kind === 'golge' ? 'golge_tas' : kind === 'cekirdek' ? 'yildiz_tas' : kind === 'magara' ? 'magara_zemin' : 'toprak';
  for (let x = x0; x < x1; x += B) {
    for (let j = 0; j < 3; j++) put(p, bank, x, Y + j * B, shadeFn(0.55));
    put(p, lava ? 'lav' : 'su_ust', x, Y + 6, fn);
    put(p, lava ? 'lav' : 'su', x, Y + 6 + B, fn);
    put(p, lava ? 'lav' : 'su', x, Y + 6 + 2 * B, chain(fn, shadeFn(0.85)));
  }
  // lavda parlak kabarciklar
  if (lava) for (let x = x0 + 4; x < x1; x += 22) { p.rect(x, Y + 6, 4, 1, hex('#ffd070')); p.rect(x + 9, Y + 12, 2, 2, hex('#ffb040')); }
  // kenarlar: iki yanda yuvarlatilmis kiyi
  for (const side of [0, 1]) {
    const bx = side ? x1 - 3 : x0;
    for (let y = Y + 6; y < Y + 6 + B * 3; y++) { const w = 2 + Math.floor((y - Y) / 7); for (let k = 0; k < w; k++) p.set(side ? bx + 2 - k : bx + k, y, hex(kind === 'col' ? '#a89060' : '#4a3e30')); }
  }
  // susler: saz ve nilufer (lavda yok)
  if (!lava) {
    put(p, kind === 'buz' ? 'karli_cali' : 'saz', x0 - 6, Y - B + 1, kind === 'buz' ? null : fn);
    put(p, 'saz', x1 - 4, Y - B + 1, fn);
    if (kind !== 'buz') { put(p, 'nilufer', x0 + 5 * B + 2, Y - 8, null); put(p, 'nilufer', x0 + 7 * B + 6, Y - 9, null); }
  }
  // iskele: kalas sirasi + direkler. Odada iki yana kadar uzar (kopru), ussun golunde yarim
  const dx0 = x0 - 2 * B;
  const dx1 = bridge ? x1 + 2 * B : x0 + 4 * B;
  const deck = new Pix(GAME_W, p.h);
  for (let x = dx0; x < dx1; x += 4) {
    deck.rect(x, Y - 4, 4, 4, hex(x % 8 ? '#b88a5a' : '#a87a4a'));
    deck.rect(x, Y - 4, 4, 1, hex('#d0a070'));
    deck.set(x + 3, Y - 3, hex('#7a5232'));
  }
  for (let x = dx0 + 6; x < dx1; x += 3 * B) {
    deck.rect(x, Y, 3, 26, hex('#7a5232')); deck.rect(x, Y, 1, 26, hex('#9a6a42'));
  }
  deck.outline('dark', 0.55);
  p.draw(deck, 0, 0, deck.w);
  return p.canvas();
}
// samandira: kirmizi ust, beyaz alt (6x8)
export function bobber() {
  const p = new Pix(6, 8);
  p.rect(1, 1, 4, 3, hex('#e05a4a')); p.rect(2, 0, 2, 1, hex('#e05a4a')); p.set(2, 1, hex('#ff9a8a'));
  p.rect(1, 4, 4, 2, hex('#f4f0e8')); p.rect(2, 6, 2, 1, hex('#f4f0e8'));
  p.outline(INK);
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

// 0.6 Us: zanaat avlusu. Catili, arkasi kalas duvar; duvarda kalkan, raf, fener;
// yerde zirh askisi, silah askisi, ors ve varil. Istasyonlar (masa, firin, kazan, yem, depo)
// dunyada ayri nesneler olarak bunun onune konur.
export const YARD = { cols: 11, x: 0 };
export function workshopYard() {
  const w = YARD.cols * B;
  const p = new Pix(w + 18, 4 * B + 2);
  const wall = shadeFn(0.7);
  for (let c = 0; c < YARD.cols; c++) for (let k = 1; k <= 3; k++) p.draw(block('kalas'), 9 + c * B, 1 + k * B, B, wall);
  for (const k of [1, 2, 3]) { p.draw(block('kutuk'), 9, 1 + k * B, B); p.draw(block('kutuk'), 9 + (YARD.cols - 1) * B, 1 + k * B, B); }
  // cati: kiremit sirasi, iki ucta egim
  p.draw(block('kiremit_sol'), 1, 1, B);
  for (let c = 0; c < YARD.cols; c++) p.draw(block('kiremit'), 9 + c * B, 1, B);
  p.draw(block('kiremit_sag'), 9 + YARD.cols * B - 8, 1, B);
  const at = (name, c, k, fn = null) => p.draw(block(name), 9 + c * B, 1 + k * B, B, fn);
  at('kalkan', 4, 1); at('raf', 6, 1); at('fener', 2, 1); at('fener', 8, 1); at('kalkan', 9, 1);
  at('zirh_ust', 0, 2); at('zirh_alt', 0, 3);
  at('silahlik_ust', 2, 2); at('silahlik_alt', 2, 3);
  at('ors', 4, 3); at('varil', 6, 3);
  p.outline(OL);
  return p.canvas();
}

// Han: tenteli tahta kulube, arkada asili harita ve fener. Tezgah ayri resim (hanci arkasinda durur).
export const INN = { cols: 5 };

// Zindan odasi: koyu tas tugla duvar, mesaleler, kaldirim zemin. Derinlestikce kararir.
export function dungeonRoomBackground(level, variant = 0) {
  // 1.1: duvar yeniden: tugla, sutunlar, derin kemerler ve mesale isigi (eskiden duz duvar + siyah kutular)
  const r = rng(level * 9173 + variant * 37);
  const dk = Math.min(0.5, 0.12 + level * 0.01);
  const dark = '#0e0b14';
  const nf = fogFn(dark, dk);
  const p = new Pix(GAME_W, GAME_H);
  p.rect(0, 0, GAME_W, GAME_H, dark);
  for (let y = G - 16; y > -16; y -= 16) for (let x = 0; x < GAME_W; x += 16) put(p, 'tugla', x, y, chain(shadeFn(0.82), fogFn(dark, 0.3 + dk * 0.5)));
  const off = Math.floor(r() * 3) * 16 + 16;
  const cols = [];
  for (let a = off - 128; a < GAME_W + 64; a += 128) {
    archway(p, a + 32, G - 80, 64, 80, dark, 12);
    cols.push(a);
  }
  for (const a of cols) {
    const cx = a - 16;
    for (let y = 0; y < G; y += 16) for (let k = 0; k < 2; k++) put(p, 'tas', cx + k * 16, y, chain(shadeFn(k ? 0.8 : 1.02), fogFn(dark, 0.15 + dk * 0.4)));
    for (let y = 0; y < G; y++) { p.set(cx - 1, y, pack(hex('#08060c'))); p.set(cx + 32, y, pack(hex('#08060c'))); }
    for (let k = -1; k < 3; k++) put(p, 'kaldirim', cx + k * 16 - 0, G - 16, chain(shadeFn(0.9), nf));
    for (let k = -1; k < 3; k++) put(p, 'kaldirim', cx + k * 16, 40, chain(shadeFn(0.85), nf));
  }
  for (let x = 0; x < GAME_W; x += 16) put(p, 'tas', x, 24, chain(shadeFn(0.8), fogFn(dark, 0.3)));
  darkenRows(p, 0, 70, 0.75, 0, dark);
  darkenRows(p, G - 8, G, 0, 0.35, dark);
  for (let c = 0; c < GAME_W / B; c++) {
    put(p, 'kaldirim', c * B, G, nf);
    put(p, 'tas', c * B, G + B, chain(shadeFn(0.7), nf));
    put(p, 'tas_duvar', c * B, G + 2 * B, nf);
  }
  for (const a of cols) wallTorch(p, a, 112, '#ff9a40');
  return p.canvas();
}

// ------------------------------------------------------------------ 1.1 kapali mekan duvarlari
// Eren (2026-11-11): zindan ve magara duvarlari kotu duruyordu (duz tugla, simsiyah kutular).
// Yeni: uzak duvar 8 px bloklar, sutunlar, derinligi olan kemerler, mesale isigi; ustu karanlik.
function glowAt(p, cx, cy, r, col, a) {
  const c2 = hex(col);
  for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(p.h, Math.ceil(cy + r)); y++) {
    for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(p.w, Math.ceil(cx + r)); x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d >= 1) continue;
      const v = p.get(x, y);
      if (!(v >>> 24)) continue;
      const c = unpack(v);
      const t = a * (1 - d) * (1 - d);
      // isik: renge karis + biraz parlat
      p.set(x, y, pack(mix(c.slice(0, 3), c2, t).map((k, i) => Math.min(255, Math.round(k + c2[i] * t * 0.35)))));
    }
  }
}
function darkenRows(p, y0, y1, f0, f1, to) {
  for (let y = y0; y < y1; y++) {
    const t = f0 + ((f1 - f0) * (y - y0)) / Math.max(1, y1 - y0);
    const fn = fogFn(to, t);
    for (let x = 0; x < p.w; x++) { const v = p.get(x, y); if (v >>> 24) p.set(x, y, fn(v)); }
  }
}
// kemerli girinti: ici yukaridan asagi koyulasan bir derinlik, tas kenar, dipte hafif isik
function archway(p, x, top, w, h, dark, s = 8) {
  const R = w / 2;
  const inside = (px, py) => (py >= top + R ? px >= x && px < x + w : Math.hypot(px - (x + R - 0.5), py - (top + R)) < R);
  // kenar taslari (bir blok kalinliginda)
  for (let py = top - s; py < top + h; py++) for (let px = x - s; px < x + w + s; px++) {
    const out = (py >= top + R ? px >= x - s && px < x + w + s : Math.hypot(px - (x + R - 0.5), py - (top + R)) < R + s);
    if (!out || inside(px, py) || py >= top + h) continue;
    const b = block('tas').d[(((py % B) + B) % B) * B + (((px % B) + B) % B)];
    p.set(px, py, chain(shadeFn(0.95), fogFn(dark, 0.35))(b));
  }
  for (let py = top; py < top + h; py++) for (let px = x; px < x + w; px++) {
    if (!inside(px, py)) continue;
    const t = (py - top) / h;
    const deep = mix(hex('#050308'), hex('#2a2030'), Math.pow(t, 1.6));
    const side = Math.min(px - x, x + w - 1 - px);
    const c = side < 3 ? mul(deep, 0.6) : deep; // ic kenar golgesi
    p.set(px, py, pack(c));
  }
}
function wallTorch(p, x, y, warm) {
  put(p, 'mesale', x - 8, y - 8, null);
  glowAt(p, x, y - 2, 40, warm, 0.45);
  glowAt(p, x, y - 4, 9, '#fff0b0', 0.35);
}
// kind: 'zindan' | 'magara'. Savas sahnesi (battleStage) icin kaynak resim; zemini perspektifli.
export function indoorStage(kind, level = 1, variant = 0) {
  const r = rng(level * 4513 + variant * 71 + (kind === 'magara' ? 9 : 0));
  const dark = kind === 'magara' ? CAVE_DARK : '#0e0b14';
  const HZ = 136; // duvarin dibi = zeminin ufku
  const s = 8;
  const p = new Pix(GAME_W, GAME_H);
  p.rect(0, 0, GAME_W, GAME_H, dark);
  if (kind === 'zindan') {
    for (let y = HZ - 16; y > -16; y -= 16) for (let x = 0; x < GAME_W; x += 16) put(p, 'tugla', x, y, chain(shadeFn(0.8), fogFn(dark, 0.42)));
    const off = Math.floor(r() * 3) * 16;
    for (let a = off - 48; a < GAME_W + 48; a += 96) {
      archway(p, a + 24, HZ - 64, 48, 64, dark);
      // sutun: 16 px, yanlari golgeli
      for (let y = 0; y < HZ; y += s) for (let k = 0; k < 3; k++) putScaled(p, 'tas', a - 12 + k * s, y, s, chain(shadeFn([0.72, 1.05, 0.86][k]), fogFn(dark, 0.18)));
      for (let y = 0; y < HZ; y++) { p.set(a - 13, y, pack(hex('#0a0810'))); p.set(a + 12, y, pack(hex('#0a0810'))); }
      for (let k = -1; k < 3; k++) putScaled(p, 'kaldirim', a - 8 + k * s, HZ - s, s, fogFn(dark, 0.2)); // sutun ayagi
      for (let k = -1; k < 3; k++) putScaled(p, 'kaldirim', a - 8 + k * s, 40, s, fogFn(dark, 0.25)); // sutun basligi
    }
    // duvarin ustunde kalin bir korniş
    for (let x = 0; x < GAME_W; x += s) putScaled(p, 'tas', x, 32, s, chain(shadeFn(0.85), fogFn(dark, 0.3)));
  } else {
    for (let y = HZ - 16; y > -16; y -= 16) for (let x = 0; x < GAME_W; x += 16) put(p, 'tas_duvar', x, y, fogFn(dark, 0.42));
    // uzak tunel agizlari: duzensiz, ici derinlesen karanlik
    for (let i = 0; i < 2; i++) {
      const cx = 60 + i * 190 + Math.floor(r() * 70); const rx = 22 + Math.floor(r() * 10); const ry = 26 + Math.floor(r() * 8); const by = HZ - 30;
      for (let y = by - ry; y < by; y++) for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
        const wob = Math.sin(y * 0.7 + i) * 1.5;
        const d = Math.hypot((x - cx) / (rx + wob), (y - by) / ry);
        if (d > 1 || x < 0 || x >= GAME_W) continue;
        p.set(x, y, pack(mix(hex('#04030a'), hex(dark), Math.min(1, d * d * 0.9))));
      }
    }
    // tavandan sarkan kaya kutleleri (daha yakin)
    const roof = new Pix(GAME_W, GAME_H);
    for (let x = 0, h = 1; x < GAME_W; x += 16) {
      if (r() < 0.6) h = Math.max(0, Math.min(3, h + (r() < 0.5 ? -1 : 1)));
      for (let k = 0; k < h; k++) put(roof, 'tas', x, k * 16, chain(shadeFn(0.78), fogFn(dark, 0.32)));
      if (h && r() < 0.5) put(roof, 'sarkit', x, h * 16, chain(shadeFn(0.8), fogFn(dark, 0.3)));
    }
    roof.outline('dark', 0.55);
    p.draw(roof, 0, 0, roof.w);
    // kaya cikintilari (daha yakin, 16 px)
    const rock = new Pix(GAME_W, GAME_H);
    for (let x = 0, h = 2; x < GAME_W; x += 16) {
      if (r() < 0.5) h = Math.max(1, Math.min(2, h + (r() < 0.5 ? -1 : 1)));
      for (let k = 0; k < h; k++) put(rock, 'tas', x, HZ - (k + 1) * 16, chain(shadeFn(0.8 - k * 0.05), fogFn(dark, 0.3)));
    }
    rock.outline('dark', 0.55);
    p.draw(rock, 0, 0, rock.w);
  }
  // tavan karanligi ve ufuk golgesi
  darkenRows(p, 0, 70, 0.78, 0.0, dark);
  darkenRows(p, HZ - 10, HZ, 0.0, 0.45, dark);
  arenaGround(p, HZ, fogFn(dark, kind === 'magara' ? 0.22 : 0.18),
    kind === 'magara' ? (onPath, c, row) => (onPath ? 'kaldirim' : (c * 13 + row * 7) % 11 === 0 ? 'komur' : 'magara_zemin')
      : (onPath) => (onPath ? 'kaldirim' : 'tas_duvar'), dark);
  if (kind === 'zindan') {
    const off = Math.floor(rng(level * 4513 + variant * 71)() * 3) * 16;
    for (let a = off - 48; a < GAME_W + 48; a += 96) wallTorch(p, a, 92, '#ff9a40');
  } else {
    // kristaller ve mantarlar duvar dibinde, kendi isiklariyla; tepeden sarkitlar
    for (let i = 0; i < 5; i++) {
      const x = 12 + Math.floor(r() * (GAME_W - 24));
      const blue = r() < 0.5;
      put(p, blue ? 'kristal_b' : 'kristal_m', x - 8, HZ - 17, null);
      glowAt(p, x, HZ - 8, 30, blue ? '#7cc8f0' : '#b48ae0', 0.35);
    }
  }
  return p.canvas();
}

// 1.0.11 (Eren): Kule'nin arka plani Zindan'dan farkli olsun. Bulutlarin ustunde yuvarlak bir
// kulenin ici: egri tas duvar (ortasi aydinlik, yanlari karanlik), uzun kemerli pencerelerden
// yildizli mor gece ve bulutlar, mor kristal isiklari, duvarda asili bayraklar.
const KULE_DARK = '#120c1e';
function towerWall(p, HZ, r, top = 0) {
  const dark = KULE_DARK;
  const s = 8;
  for (let y = HZ - s; y > top - s; y -= s) for (let x = 0; x < GAME_W + s; x += s) {
    const t = (x + 4) / GAME_W, curve = 0.55 + 0.5 * Math.sin(t * Math.PI); // yuvarlak duvar
    const hh = ((x * 73856093) ^ (y * 19349663)) >>> 0;
    const moon = hh % 19 === 0;
    putScaled(p, moon ? 'ay_tasi' : 'tas_duvar', x + ((Math.floor(y / s) % 2) ? 4 : 0) - 4, y, s, chain(shadeFn(curve * (moon ? 0.6 : 0.95)), fogFn(moon ? '#3a2a5a' : dark, moon ? 0.45 : 0.3)));
  }
  // pencereler: egri duvarda ortaya yakin genis, kenarlarda dar
  const wins = [];
  const n = 3, off = (r() - 0.5) * 30;
  for (let i = 0; i < n; i++) {
    const cx = Math.round(GAME_W * (0.2 + i * 0.3) + off);
    const t = cx / GAME_W, w = 2 * Math.round(7 + 7 * Math.sin(t * Math.PI));
    wins.push([cx, w]);
    const wt = 34, wh = 62, R = w / 2;
    const inside = (px, py) => (py >= wt + R ? Math.abs(px - cx) < R : Math.hypot(px - cx, py - (wt + R)) < R);
    for (let py = wt - 6; py < wt + wh + 6; py++) for (let px = cx - R - 6; px < cx + R + 6; px++) {
      if (px < 0 || px >= GAME_W || py < 0) continue;
      const rim = py >= wt + R ? Math.abs(px - cx) < R + 5 && py < wt + wh + 5 : Math.hypot(px - cx, py - (wt + R)) < R + 5;
      if (!rim) continue;
      if (!inside(px, py) || py >= wt + wh) { const b = block('tas').d[(((py % B) + B) % B) * B + (((px % B) + B) % B)]; p.set(px, py, chain(shadeFn(0.92), fogFn(dark, 0.25))(b)); continue; }
      // gokyuzu: ustte koyu lacivert, altta mor; altta bulut seridi
      const k = (py - wt) / wh;
      let c = mix(hex('#141a3a'), hex('#6a4a9a'), Math.pow(k, 1.3));
      const cl = Math.sin(px * 0.35 + py * 0.08) * 3 + wt + wh * 0.72;
      if (py > cl) c = mix(hex('#c8c0e0'), hex('#8a7ab8'), Math.min(1, (py - cl) / 14));
      p.set(px, py, pack(c));
    }
    for (let k = 0; k < 6; k++) { const sx = cx - R + 2 + Math.floor(r() * (w - 4)), sy = wt + 4 + Math.floor(r() * wh * 0.5); p.set(sx, sy, pack(hex(r() < 0.5 ? '#ffffff' : '#ffe8a0'))); }
    // pencere kafesi ve denizlik
    for (let py = wt + 2; py < wt + wh; py++) if (inside(cx, py)) p.set(cx, py, pack(hex('#2a2238')));
    for (let px = cx - R; px < cx + R; px++) if (inside(px, wt + R + 6)) p.set(px, wt + R + 6, pack(hex('#2a2238')));
    for (let px = cx - R - 4; px < cx + R + 4; px++) { p.set(px, wt + wh, pack(hex('#8a8494'))); p.set(px, wt + wh + 1, pack(hex('#4a4454'))); }
  }
  // sol duvarda yukari kivrilan doner merdiven (basamaklar duvara gomulu)
  for (let i = 0; i < 9; i++) {
    const sx = 46 - i * 6, sy = HZ - 12 - i * 9, sw = 18 - i;
    for (let y = 0; y < 9; y++) for (let x = 0; x < sw; x++) {
      const px = sx + x, py = sy + y;
      if (px < 0 || py < top) continue;
      const b = block('kaldirim').d[(py & 15) * B + (px & 15)];
      const f = y < 2 ? 1.12 : y > 6 ? 0.55 : 0.8;
      p.set(px, py, chain(shadeFn(f * (0.75 + 0.03 * i)), fogFn(dark, 0.2 + i * 0.04))(b));
    }
    for (let x = 0; x < sw; x++) p.set(sx + x, sy + 9, pack(hex('#0e0a16')));
  }
  // pencereler arasinda asili mor bayraklar
  for (let i = 0; i < wins.length - 1; i++) {
    const bx = Math.round((wins[i][0] + wins[i + 1][0]) / 2) - 6;
    for (let y = 30; y < 74; y++) for (let x = 0; x < 12; x++) {
      if (y > 66 && Math.abs(x - 5.5) < (y - 66)) continue; // kirlangic kuyruk
      const c = x < 2 ? '#3a1f66' : x > 9 ? '#4a2a80' : '#6a3fa8';
      p.set(bx + x, y, pack(hex(c)));
    }
    for (let y = 40; y < 52; y++) for (let x = 3; x < 9; x++) if (Math.abs(x - 5.5) + Math.abs(y - 46) < 5) p.set(bx + x, y, pack(hex('#e0c060')));
    for (let x = -2; x < 14; x++) p.set(bx + x, 29, pack(hex('#5a3a24')));
  }
  return wins;
}
function kuleLights(p, wins, y) {
  for (let i = 0; i < wins.length - 1; i++) {
    const x = Math.round((wins[i][0] + wins[i + 1][0]) / 2);
    put(p, 'kristal_m', x - 8, y - 12, null);
    glowAt(p, x, y - 4, 42, '#b48af0', 0.45);
    glowAt(p, x, y - 6, 10, '#f0e0ff', 0.3);
  }
  for (const [cx] of wins) glowAt(p, cx, 70, 34, '#8a7ad0', 0.18); // pencereden giren ay isigi
}
export function kuleRoomBackground(level, variant = 0) {
  const r = rng(level * 7919 + variant * 53 + 5);
  const p = new Pix(GAME_W, GAME_H);
  p.rect(0, 0, GAME_W, GAME_H, KULE_DARK);
  const wins = towerWall(p, G, r);
  darkenRows(p, 0, 26, 0.7, 0, KULE_DARK);
  darkenRows(p, G - 8, G, 0, 0.3, KULE_DARK);
  const nf = fogFn(KULE_DARK, 0.15);
  for (let c = 0; c < GAME_W / B; c++) {
    put(p, c % 3 === 1 ? 'ay_tasi' : 'kaldirim', c * B, G, nf);
    put(p, 'tas', c * B, G + B, chain(shadeFn(0.7), nf));
    put(p, 'tas_duvar', c * B, G + 2 * B, nf);
  }
  kuleLights(p, wins, G - 2);
  return p.canvas();
}
export function kuleStage(level = 1, variant = 0) {
  const r = rng(level * 7919 + variant * 53 + 11);
  const HZ = 136;
  const p = new Pix(GAME_W, GAME_H);
  p.rect(0, 0, GAME_W, GAME_H, KULE_DARK);
  const wins = towerWall(p, HZ, r);
  darkenRows(p, 0, 26, 0.7, 0, KULE_DARK);
  darkenRows(p, HZ - 10, HZ, 0.0, 0.4, KULE_DARK);
  arenaGround(p, HZ, fogFn(KULE_DARK, 0.16), (onPath, c, row) => (onPath ? 'ay_tasi' : (c + row) % 2 ? 'kaldirim' : 'tas_duvar'), KULE_DARK);
  kuleLights(p, wins, HZ);
  return p.canvas();
}

// ------------------------------------------------------------------ 1.0.12 Yeni manzaralar
// Eren (2026-11-11): Kule/Zindan gibi derinlikli, yumusak-tatli piksel manzaralar istedi.
// Uzaklik = daha kucuk blok + goge karisma (sis). Gok dither ile yumusak gecer, gunes/ay halesi,
// yuvarlak bulutlar, ufukta pus, her bolgeye kendi isiklari. Savas sahnesi perspektif zeminli.
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
function softSky(p, y0, y1, stops) {
  const cs = stops.map(([k, h]) => [k, hex(h)]);
  const at = (k) => {
    for (let i = 1; i < cs.length; i++) if (k <= cs[i][0]) { const [ka, a] = cs[i - 1]; const [kb, b] = cs[i]; return mix(a, b, (k - ka) / Math.max(1e-6, kb - ka)); }
    return cs[cs.length - 1][1];
  };
  const band = 6; const H = Math.max(1, y1 - y0);
  for (let y = y0; y < y1; y++) {
    const yy = y - y0; const b0 = Math.floor(yy / band) * band;
    const ca = pack(at(b0 / H)); const cb = pack(at(Math.min(1, (b0 + band) / H)));
    const f = (yy - b0) / band;
    for (let x = 0; x < p.w; x++) p.set(x, y, f * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5 ? cb : ca);
  }
}
// 2 piksellik izgarada daire: yumusak ama piksel
function blobAt(p, cx, cy, R, colFn, g = 2) {
  for (let y = Math.floor((cy - R) / g) * g; y <= cy + R; y += g) for (let x = Math.floor((cx - R) / g) * g; x <= cx + R; x += g) {
    const d = Math.hypot(x + g / 2 - cx, y + g / 2 - cy) / R;
    if (d > 1) continue;
    const c = colFn(d, x - cx, y - cy);
    if (c != null) p.rect(x, y, g, g, c);
  }
}
function sunDisk(p, x, y, R, core, rim, halo, ha = 0.5) {
  glowAt(p, x, y, R * 5, halo, ha);
  glowAt(p, x, y, R * 2.2, '#fff6dc', ha * 0.6);
  blobAt(p, x, y, R, (d, dx, dy) => (d > 0.78 ? rim : dx + dy < -R * 0.5 ? '#fffbea' : core));
}
function moonDisk(p, x, y, R, col, shade, halo) {
  glowAt(p, x, y, R * 4, halo, 0.35);
  blobAt(p, x, y, R, (d, dx, dy) => {
    if (Math.hypot(dx + R * 0.55, dy - R * 0.35) < R * 0.85) return shade; // hilal golgesi
    return (Math.abs(dx - 3) < 3 && Math.abs(dy + 2) < 3) || (Math.abs(dx - 6) < 2 && Math.abs(dy - 5) < 2) ? shade : col;
  });
}
function puffCloud(p, x, y, w, light, mid, dark) {
  const puffs = [];
  const n = Math.max(2, Math.round(w / 12));
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    const R = 6 + Math.round(Math.sin(t * Math.PI) * w * 0.16);
    puffs.push([x + t * w, y - Math.sin(t * Math.PI) * R * 0.5, R]);
  }
  for (const [cx, cy, R] of puffs) blobAt(p, cx, cy, R, (d, dx, dy) => (dy > R * 0.25 ? dark : dy > -R * 0.2 ? mid : light));
  p.rect(Math.round(x), Math.round(y + 2), Math.round(w), 4, dark); // duz alt
}
function stars(p, r, n, y1, cols) {
  for (let i = 0; i < n; i++) {
    const x = Math.floor(r() * p.w); const y = Math.floor(r() * y1); const c = cols[Math.floor(r() * cols.length)];
    p.set(x, y, c);
    if (r() < 0.12) { p.set(x - 1, y, c); p.set(x + 1, y, c); p.set(x, y - 1, c); p.set(x, y + 1, c); }
  }
}
// yumusak sirt: sinus toplami, s pikselde basamak
function ridge(p, r, baseY, s, minH, maxH, top, body, fn, freq = 1, bottom = null) {
  const ph = [r() * 6.28, r() * 6.28, r() * 6.28];
  const off = -Math.floor(r() * s);
  for (let x = off; x < p.w + s; x += s) {
    const n = 0.5 + 0.32 * Math.sin(x * 0.012 * freq + ph[0]) + 0.13 * Math.sin(x * 0.031 * freq + ph[1]) + 0.05 * Math.sin(x * 0.083 * freq + ph[2]);
    const h = Math.max(1, Math.round((minH + (maxH - minH) * n) / s));
    const yb = bottom == null ? baseY : bottom;
    for (let yy = baseY - h * s, k = 0; yy < yb; yy += s, k++) putScaled(p, k === 0 ? top : body, x, yy, s, fn);
  }
}
// olcekli yuvarlak agac (ya da cam)
function roundTree(p, x, baseY, s, leaf, trunk, fn, pine = false, wood = 'kutuk') {
  for (let k = 0; k < trunk; k++) putScaled(p, wood, x, baseY - (k + 1) * s, s, fn);
  const top = baseY - trunk * s;
  const rows = pine ? [[-2, 2], [-1, 1], [-1, 1], [0, 0]] : [[-1, 1], [-2, 2], [-2, 2], [-1, 1]];
  rows.forEach(([a, b], j) => {
    const f = [0.82, 0.94, 1.04, 1.12][j];
    for (let i = a; i <= b; i++) putScaled(p, leaf, x + i * s, top - j * s, s, chain(shadeFn(f), fn));
  });
}
function treeLine(p, r, baseY, s, leaf, fn, pine = false, gap = 2) {
  for (let x = -Math.floor(r() * 3) * s; x < p.w + 2 * s; x += s * (gap + Math.floor(r() * 3))) roundTree(p, x, baseY + Math.floor(r() * 3) * 2, s, leaf, 1 + Math.floor(r() * 2), fn, pine);
}
function aurora(p, y, cols) {
  for (let x = 0; x < p.w; x++) {
    const yc = y + Math.sin(x * 0.03) * 8 + Math.sin(x * 0.011 + 1) * 6;
    for (let k = 0; k < 26; k++) {
      const yy = Math.round(yc + k); const a = 0.32 * (1 - k / 26) * (0.6 + 0.4 * Math.sin(x * 0.09 + k * 0.2));
      const v = p.get(x, yy); if (!(v >>> 24)) continue;
      const c = unpack(v); p.set(x, yy, pack(mix(c.slice(0, 3), hex(cols[k < 8 ? 0 : 1]), a)));
    }
  }
}
function nebula(p, r, n, cols, y1) {
  for (let i = 0; i < n; i++) glowAt(p, Math.floor(r() * p.w), Math.floor(r() * y1), 30 + Math.floor(r() * 40), cols[i % cols.length], 0.28);
}

// B2/G1 (1.0.20): gece Kesfi'nde gok gece olur (koyu gok, ay, yildizlar) ve her sey gece tonuna boyanir.
// Orman kendi gun vakti renklerini kullanir; Golge ve Cekirdek zaten gece.
const NIGHT_SKY = '#141a3c';
function nightTheme(th) {
  const out = { ...th };
  out.sky = th.sky.map(([k, c]) => [k, '#' + mix(hex(c), hex(NIGHT_SKY), 0.68).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')]);
  if (th.body === 'sun') { out.body = 'moon'; out.moonR = 9; }
  out.starsN = Math.max(th.starsN || 0, 70);
  out.haze = '#' + mix(hex(th.haze), hex('#3a4270'), 0.6).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  out.tint = chain(th.tint, nightFn(0.75));
  out.cloud = ['#5a6290', '#4a5280', '#3c4470'];
  out.clouds = Math.min(2, th.clouds || 0);
  out.sunR = 0;
  return out;
}
// Bolge temalari. sky: yukaridan asagi renk duraklari. ranges: [olcek, ust, govde, sis]
function themeOf(zone, floor, tod) {
  const th = themeBase(zone, floor, tod);
  return tod === 'gece' && zone !== 'orman' && zone !== 'golge' && zone !== 'cekirdek' ? nightTheme(th) : th;
}
function themeBase(zone, floor, tod) {
  const deep = Math.min(1, ((Math.max(1, floor) - 1) % 10) / 9);
  if (zone === 'orman') {
    let sky; let body = 'sun'; let haze = '#dfe9e4'; let tint = null; let bx = 0.72; let starsN = 0; let cl = ['#ffffff', '#eef2f4', '#cfdbe4'];
    const T = tod ? TOD[tod] : null;
    const t = T ? T.t : Math.min(1, (floor - 1) / 9) * 0.85;
    if (tod === 'gundogumu' || tod === 'gunbatimi') {
      sky = [[0, T.stops[0]], [0.55, T.stops[1]], [1, T.stops[2]]]; haze = T.stops[2]; tint = fogFn(T.warm[0], T.warm[1]); bx = tod === 'gundogumu' ? 0.16 : 0.84; cl = ['#ffe2cc', '#f0b8a4', '#b8849a'];
    } else if (t > 0.55) {
      sky = [[0, '#141a3c'], [0.6, '#2c3666'], [1, '#56608a']]; body = 'moon'; haze = '#4a5480'; tint = nightFn(Math.min(1, t)); starsN = 70; cl = ['#5a6290', '#4a5280', '#3c4470'];
    } else if (t > 0.3) {
      sky = [[0, '#5a6aa0'], [0.55, '#c49ab0'], [1, '#f2c49a']]; haze = '#e8c0a4'; tint = fogFn('#e09070', 0.12); bx = 0.85; cl = ['#ffe2cc', '#f0b8a4', '#b8849a'];
    } else sky = [[0, '#6f9cc8'], [0.55, '#a8cbe0'], [1, '#e8f0e4']];
    return {
      sky, body, bx, haze, tint, starsN, clouds: body === 'moon' ? 1 : 4, cloud: cl,
      ranges: [[3, 'cimen_ust', 'tas', 0.8], [4, 'cimen_ust', 'tas', 0.66]], line: { leaf: 'yaprak', s: 6, fog: 0.55 }, hills: ['cimen_ust', 'cimen_ust'],
      leaf: 'yaprak', ground: ['cimen', 'toprak', 'tas'], arena: { path: 'toprak', main: 'cimen_ust', alt: 'cimen_ust' },
      props: ['ot', 'cicek_k', 'cicek_s', 'ot'], depth: [['tree', 'yaprak'], ['blk', 'cali'], ['tree', 'hus_yaprak', 'hus_kutuk']], fire: body === 'moon',
    };
  }
  if (zone === 'col') {
    const t = deep * 0.6;
    const late = t > 0.3;
    return {
      sky: late ? [[0, '#4a4c84'], [0.5, '#c4848a'], [1, '#f2b878']] : [[0, '#7aa4cc'], [0.55, '#d6d0b4'], [1, '#f4dcaa']],
      body: 'sun', bx: late ? 0.82 : 0.66, sunR: late ? 12 : 9, haze: late ? '#f0b888' : '#f2dcae', tint: fogFn('#e09050', 0.06 + t * 0.2), clouds: 1, cloud: ['#fff4e4', '#f4dcc4', '#d8b8a0'],
      ranges: [[3, 'kum', 'kumtasi', 0.78], [4, 'kum', 'kumtasi', 0.62]], line: null, hills: ['kum', 'kumtasi'], mesa: true, landmarks: 'col',
      ground: ['kum', 'kum', 'kumtasi'], arena: { path: 'kumtasi', main: 'kum', alt: 'kumtasi' },
      props: ['kaktus', 'kemik', 'kum_yigini'], depth: [['blk', 'kaktus'], ['blk', 'hurmalik', 2], ['blk', 'kum_yigini']],
    };
  }
  if (zone === 'buz') return {
    sky: [[0, '#5c78ac'], [0.55, '#a6c0dc'], [1, '#eef4f8']], body: 'sun', bx: 0.3, sunR: 7, haze: '#eef4f8', tint: nightFn(deep * 0.25), clouds: 3, cloud: ['#ffffff', '#e8f0f6', '#c4d4e4'],
    aurora: deep > 0.4 ? ['#9af0c8', '#7ab8f0'] : null,
    ranges: [[3, 'kar_ust', 'tas', 0.72], [4, 'kar_ust', 'buz', 0.58]], line: { leaf: 'karli_yaprak', s: 6, fog: 0.5, pine: true }, hills: ['kar', 'donmus_toprak'],
    leaf: 'karli_yaprak', pine: true, ground: ['kar', 'donmus_toprak', 'tas'], arena: { path: 'buz', main: 'kar_ust', alt: 'buz' },
    props: ['karli_cali', 'kristal_b', 'buz'], depth: [['tree', 'karli_yaprak', 'kutuk', true], ['blk', 'karli_cali'], ['blk', 'kristal_b']], snow: true,
  };
  if (zone === 'kor') return {
    sky: [[0, '#1c0e14'], [0.5, '#5a2224'], [1, '#d8642e']], body: 'none', haze: '#c0502a', tint: fogFn('#40140c', 0.06 + deep * 0.1), clouds: 3, cloud: ['#7a3a34', '#5a2a2a', '#3a1c20'],
    ranges: [[3, 'kor_kaya', 'bazalt', 0.6], [4, 'bazalt', 'bazalt', 0.45]], line: null, hills: ['bazalt', 'bazalt'], volcano: true,
    ground: ['bazalt', 'kor_kaya', 'bazalt'], arena: { path: 'kor_kaya', main: 'bazalt', alt: 'lav' }, lava: true,
    props: ['kor_kristal', 'olu_agac', 'biberlik'], depth: [['blk', 'olu_agac', 2], ['blk', 'kor_kristal'], ['blk', 'biberlik']], embers: true,
  };
  if (zone === 'golge') return {
    sky: [[0, '#0a0614'], [0.55, '#241838'], [1, '#4a3666']], body: 'moon', bx: 0.7, moonR: 13, moon: ['#e8dcf4', '#a890c8', '#b48af0'], haze: '#3c2c58', tint: fogFn('#120c20', 0.1 + deep * 0.1), starsN: 90, starCols: ['#d8d4ec', '#c8a0f0'],
    clouds: 2, cloud: ['#4a3a68', '#3a2c56', '#2c2044'],
    ranges: [[3, 'golge_tas', 'golge_tas', 0.62], [4, 'golge_tas', 'golge_tas', 0.5]], line: { leaf: 'golge_kristal', s: 6, fog: 0.45, crystal: true }, hills: ['golge_tas', 'golge_tas'],
    ground: ['golge_tas', 'golge_tas', 'golge_tas'], groundAlt: 'golge_zemin', landmarks: 'golge', arena: { path: 'golge_zemin', main: 'golge_tas', alt: 'golge_zemin' },
    props: ['golge_kristal', 'gece_mantarlari', 'olu_agac'], depth: [['blk', 'golge_kristal'], ['blk', 'gece_mantarlari'], ['blk', 'olu_agac', 2]], glowProps: { golge_kristal: '#b48af0', gece_mantarlari: '#7ab8f0' }, floaters: 'golge_tas',
  };
  return { // cekirdek
    sky: [[0, '#03041a'], [0.55, '#121c4a'], [1, '#3a2a6a']], body: 'planet', haze: '#2a2a6a', tint: fogFn('#0a1030', 0.08 + deep * 0.1), starsN: 120, starCols: ['#fff0a0', '#d8d4ec', '#a0c8ff'],
    clouds: 0, nebula: ['#c060c0', '#4080e0', '#60c0d0'],
    ranges: [[3, 'yildiz_tas', 'yildiz_tas', 0.6], [4, 'yildiz_tas', 'yildiz_tas', 0.48]], line: null, hills: ['yildiz_tas', 'yildiz_tas'],
    ground: ['yildiz_tas', 'yildiz_tas', 'yildiz_tas'], groundAlt: 'yildiz_zemin', landmarks: 'cekirdek', arena: { path: 'yildiz_zemin', main: 'yildiz_tas', alt: 'yildiz_zemin' },
    props: ['yildiz_kristal', 'nebula_kristal', 'golge_kristal'], depth: [['blk', 'yildiz_kristal'], ['blk', 'nebula_kristal'], ['blk', 'yildiz_kristal']], glowProps: { yildiz_kristal: '#ffe080', nebula_kristal: '#e080f0', golge_kristal: '#b48af0' }, floaters: 'yildiz_tas',
  };
}

// gok + uzak katmanlar (oda ve savas ortak). hz: ufuk cizgisi (uzak sirtlarin dibi)
function sceneBack(p, th, r, hz, scale = 1) {
  softSky(p, 0, p.h, th.sky);
  const skyLow = th.sky[th.sky.length - 1][1];
  if (th.nebula) nebula(p, r, 6, th.nebula, hz - 20);
  if (th.aurora) aurora(p, 18, th.aurora);
  if (th.starsN) stars(p, r, th.starsN, hz - 10, (th.starCols || ['#e8e6f4', '#c8cce8']).map((c) => pack(hex(c))));
  const bx = Math.round(p.w * (th.bx ?? 0.7));
  if (th.body === 'sun') sunDisk(p, bx, 30, th.sunR || 9, '#fff2b8', '#f6d88a', th.haze, 0.45);
  else if (th.body === 'moon') { const m = th.moon || ['#f4f0e0', '#c8c4b4', '#a8b4e8']; moonDisk(p, bx, 30, th.moonR || 10, m[0], m[1], m[2]); }
  else if (th.body === 'planet') {
    const px = Math.round(p.w * 0.78); const py = 44; const R = 18;
    glowAt(p, px, py, 64, '#6a5ac8', 0.35);
    const ring = (front) => { for (let a = 0; a < 360; a += 1) { const t = a * Math.PI / 180; const x = px + Math.cos(t) * R * 1.7; const y = py + Math.sin(t) * R * 0.38; if ((Math.sin(t) > 0) !== front) continue; p.rect(Math.round(x / 2) * 2, Math.round(y / 2) * 2, 2, 2, Math.sin(t) > 0 ? '#f0d8a0' : '#b8a078'); } };
    ring(false);
    blobAt(p, px, py, R, (d, dx, dy) => { const l = (-dx - dy) / (R * 1.4); return d > 0.86 ? '#5a4ab8' : l > 0.45 ? '#d0c4fa' : l > 0.05 ? '#a090ec' : l > -0.45 ? '#7c6cd8' : '#4c3ca8'; });
    for (const [ox, oy, rr] of [[-6, 4, 3], [5, -6, 2], [4, 7, 2]]) blobAt(p, px + ox, py + oy, rr, () => '#6a5ac4');
    ring(true);
  }
  for (let i = 0; i < (th.clouds || 0); i++) {
    const w = 30 + Math.floor(r() * 40); let x = Math.floor(r() * (p.w + 40)) - 30; const y = 20 + Math.floor(r() * 3) * 14 + (i % 2) * 8;
    if (th.body !== 'none' && Math.abs(x + w / 2 - bx) < w / 2 + 24) x = (x + w / 2 < bx ? bx - w - 30 : bx + 30);
    puffCloud(p, x, y, w, th.cloud[0], th.cloud[1], th.cloud[2]);
  }
  if (th.volcano) {
    const vx = 90 + Math.floor(r() * 200); const vt = hz - 70;
    for (let y = vt; y < hz; y += 4) { const half = 10 + (y - vt) * 1.3; for (let x = vx - half; x < vx + half; x += 4) putScaled(p, 'bazalt', Math.round(x / 4) * 4, y, 4, fogFn(skyLow, 0.55)); }
    glowAt(p, vx, vt, 46, '#ff8a3a', 0.6);
    for (let k = 0; k < 14; k++) p.rect(vx - 4 + Math.round(Math.sin(k) * 3), vt + k * 4, 2, 4, k % 2 ? '#ffb040' : '#ff6a2a');
  }
  const [s1, s2] = [th.ranges[0][0] * scale, th.ranges[1][0] * scale];
  ridge(p, r, hz - 10, Math.max(2, Math.round(s1)), 26, 74, th.ranges[0][1], th.ranges[0][2], fogFn(skyLow, th.ranges[0][3]), 1, hz + 4);
  darkenRows(p, hz - 50, hz + 4, 0, 0.35, th.haze);
  ridge(p, r, hz - 2, Math.max(2, Math.round(s2)), 12, 44, th.ranges[1][1], th.ranges[1][2], fogFn(skyLow, th.ranges[1][3]), 1.4, hz + 4);
  if (th.floaters) for (let i = 0; i < 3; i++) {
    const fx = 20 + Math.floor(r() * (p.w * 0.55)); const fy = 30 + Math.floor(r() * (hz - 90)); const w = 4 + Math.floor(r() * 3);
    for (let k = 0; k < w; k++) { putScaled(p, th.floaters, fx + k * 6, fy, 6, fogFn(skyLow, 0.45)); if (k > 0 && k < w - 1) putScaled(p, th.floaters, fx + k * 6, fy + 6, 6, fogFn(skyLow, 0.55)); }
    putScaled(p, th.floaters, fx + Math.floor(w / 2) * 6, fy + 12, 6, fogFn(skyLow, 0.6));
  }
  if (th.line) {
    const L = th.line;
    // G2 (1.0.20): kristal sirasi seyrek ve farkli boylarda (esit aralikli sira noktali cizgi gibi duruyordu)
    if (L.crystal) for (let x = -4 + Math.floor(r() * 30); x < p.w; x += 40 + Math.floor(r() * 70)) { const k = 1 + Math.floor(r() * 3); putScaled(p, L.leaf, x, hz - 6 - L.s * k, L.s * k, fogFn(skyLow, L.fog)); glowAt(p, x + L.s, hz - 8, 10 + k * 4, '#b48af0', 0.2); }
    else treeLine(p, r, hz + 2, L.s * scale, L.leaf, fogFn(skyLow, L.fog), L.pine);
  }
  darkenRows(p, hz - 22, hz + 4, 0, 0.3, th.haze);
}
// gok kismina kucuk isik noktalari (atesbocegi, kivilcim, kar)
function sceneSparks(p, th, r, y0, y1) {
  if (th.embers) for (let i = 0; i < 40; i++) { const x = Math.floor(r() * p.w); const y = y0 + Math.floor(r() * (y1 - y0)); p.set(x, y, r() < 0.5 ? '#ffb040' : '#ff7030'); }
  if (th.snow) for (let i = 0; i < 70; i++) { const x = Math.floor(r() * p.w); const y = y0 + Math.floor(r() * (y1 - y0)); p.set(x, y, '#ffffff'); if (r() < 0.3) p.set(x + 1, y, '#e8f0f8'); }
  if (th.fire) for (let i = 0; i < 12; i++) { const x = Math.floor(r() * p.w); const y = y0 + 30 + Math.floor(r() * (y1 - y0 - 30)); glowAt(p, x, y, 5, '#e8f070', 0.5); p.set(x, y, '#f8ffb0'); }
}

export const SCENE_ZONES = ['orman', 'col', 'buz', 'kor', 'golge', 'cekirdek'];
// Kesif odasi (yandan): oyuncu G hizasinda yurur
export function sceneRoom(zone, floor, variant = 0, opts = {}) {
  const th = themeOf(zone, floor, opts.tod);
  const r = rng(floor * 7919 + variant * 104729 + zone.length * 31 + (opts.base ? 77 : 0));
  const W = opts.width || GAME_W;
  const nf = th.tint;
  const p = new Pix(W, GAME_H);
  sceneBack(p, th, r, G - 30);
  const skyLow = th.sky[th.sky.length - 1][1];
  // orta tepeler (8 px) + kayaliklar
  layer(p, (L) => {
    ridge(L, r, G - 4, 8, 8, 30, th.hills[0], th.hills[1], chain(fogFn(skyLow, 0.36), nf), 2, G);
    if (th.mesa) for (let i = 0; i < 2; i++) {
      const c0 = Math.floor(r() * (W / 8 - 8)); const w = 4 + Math.floor(r() * 4); const h = 3 + Math.floor(r() * 3);
      for (let c = 0; c < w; c++) for (let k = 0; k < h - (c === 0 || c === w - 1 ? 1 : 0); k++) putScaled(L, 'kumtasi', (c0 + c) * 8, G - (k + 1) * 8, 8, chain(fogFn(skyLow, 0.32), nf));
    }
  }, 'dark', 0.35);
  if (th.leaf) layer(p, (L) => {
    for (let x = Math.floor(r() * 3) * 10; x < W; x += 30 + Math.floor(r() * 40)) roundTree(L, x, G, 8, th.leaf, 2 + Math.floor(r() * 2), chain(fogFn(skyLow, 0.28), nf), th.pine);
  }, 'dark', 0.35);
  // G2 (1.0.20): Col, Golge ve Yildiz'a bolgeye ozel buyuk nesneler (uzak / orta / on katman)
  if (th.landmarks) landmarks(p, th, r, W, nf, skyLow, opts.base);
  darkenRows(p, G - 30, G, 0, 0.22, th.haze);
  sceneSparks(p, th, r, 0, G - 20);
  // yakin agaclar (16 px)
  const lit = [];
  layer(p, (L) => {
    if (th.leaf) {
      const spots = [];
      const n = opts.base ? 2 : 2 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) spots.push(opts.base ? (i === 0 ? 7 : 22) * B : Math.floor(r() * (W / B)) * B);
      for (const x of spots) tree(L, x, G, 3 + Math.floor(r() * 2), chain(shadeFn(0.92), nf), !th.pine, th.leaf);
    }
    for (let i = 0; i < 3; i++) {
      const c = Math.floor(r() * (W / B));
      if (opts.base && c > 0 && c < 23 && c !== 7 && c !== 8) continue;
      const pr = th.props[Math.floor(r() * th.props.length)];
      if (pr === 'ot' || pr === 'cicek_k' || pr === 'cicek_s') continue;
      put(L, pr, c * B, G - B, nf);
      lit.push([c * B, pr]);
    }
    if (zone === 'orman') for (let c = Math.floor(r() * 4); c < W / B; c += 3 + Math.floor(r() * 5)) {
      if (opts.base && c > 0 && c < 23 && c !== 7 && c !== 8) continue;
      put(L, 'yaprak', c * B, G - B, chain(shadeFn(0.82), nf));
    }
  }, 'dark', 0.5);
  // zemin
  for (let c = 0; c < W / B; c++) {
    const pool = th.lava && (c * 7 + variant * 3 + floor) % 9 === 4;
    put(p, pool ? 'lav' : th.groundAlt && (c * 5 + variant * 7 + floor) % 9 === 2 ? th.groundAlt : th.ground[0], c * B, G, nf);
    put(p, (c * 7 + variant) % 11 === 3 ? th.ground[2] : th.ground[1], c * B, G + B, chain(shadeFn(0.9), nf));
    put(p, (c * 5 + variant + floor) % 7 < 2 ? th.ground[2] : th.ground[1], c * B, G + 2 * B, chain(shadeFn(0.8), nf));
    if (pool) glowAt(p, c * B + 8, G + 2, 26, '#ff8a3a', 0.4);
  }
  darkenRows(p, G + 6, GAME_H, 0, 0.3, '#16121a');
  for (let i = 0; i < 9; i++) {
    const c = Math.floor(r() * (W / B)); const k = th.props[Math.floor(r() * th.props.length)];
    if (zone !== 'orman' && r() < 0.6) continue;
    put(p, zone === 'orman' ? (r() < 0.5 ? 'ot' : r() < 0.5 ? 'cicek_k' : 'cicek_s') : k, c * B, G - B + 1, nf);
    if (zone !== 'orman') lit.push([c * B, k]);
  }
  if (th.glowProps) for (const [x, k] of lit) if (th.glowProps[k]) glowAt(p, x + 8, G - 6, 26, th.glowProps[k], 0.32);
  return p.canvas();
}

// ---- G2 (1.0.20): bolge simgeleri. Hepsi 16x16 bloklardan, uzakta kucuk ve sisli, yakinda buyuk.
function arch(L, x, base, s, h, gap, name, fn) { // tas kemer: iki ayak + ust kemer
  for (let k = 0; k < h; k++) { putScaled(L, name, x, base - (k + 1) * s, s, fn); putScaled(L, name, x + (gap + 1) * s, base - (k + 1) * s, s, fn); }
  for (let c = 0; c <= gap + 1; c++) putScaled(L, name, x + c * s, base - (h + 1) * s, s, fn);
  for (let c = 1; c <= gap; c++) if (c === 1 || c === gap) putScaled(L, name, x + c * s, base - h * s, s, chain(shadeFn(0.9), fn));
}
function column(L, x, base, s, h, name, cap, fn, broken) { // harabe sutun: govde + baslik (kirik olabilir)
  putScaled(L, cap, x - s, base - s, s, chain(shadeFn(0.85), fn)); putScaled(L, cap, x + s, base - s, s, chain(shadeFn(0.85), fn));
  for (let k = 0; k < h; k++) putScaled(L, name, x, base - (k + 1) * s, s, chain(shadeFn(k % 2 ? 0.92 : 1), fn));
  if (!broken) for (const dx of [-1, 0, 1]) putScaled(L, cap, x + dx * s, base - (h + 1) * s, s, fn);
  else putScaled(L, name, x + Math.round(s / 2), base - (h + 1) * s + Math.round(s / 2), Math.round(s / 2), fn);
}
function island(L, x, y, s, w, top, body, fn, crystal) { // yuzen ada: ust duz, alt sivri
  for (let row = 0; row < 3; row++) { const a = row; for (let c = a; c < w - a; c++) putScaled(L, row === 0 ? top : body, x + c * s, y + row * s, s, chain(shadeFn(1 - row * 0.12), fn)); }
  if (crystal) putScaled(L, crystal, x + Math.floor(w / 2) * s, y - s * 1.5, s * 1.5, fn);
}
function spire(L, x, base, s, h, names, fn) { // dev kristal kule: ay tasi govde (sol acik, sag koyu), tepede buyuk kristal
  const tint = names[0] === 'nebula_kristal' ? '#c070e0' : '#7a90e8';
  for (let k = 0; k < h; k++) {
    const w = k < h * 0.45 ? 1 : 0;
    for (let dx = -w; dx <= w; dx++) putScaled(L, 'ay_tasi', x + dx * s, base - (k + 1) * s, s, chain(fogFn(tint, 0.45), shadeFn(dx < 0 ? 1.08 : dx > 0 ? 0.72 : 0.9), fn));
  }
  putScaled(L, names[0], x - Math.round(s / 2), base - h * s - s * 2, s * 2, fn);
  if (h > 5) putScaled(L, names[1] || names[0], x - s * 2, base - Math.round(h * 0.45) * s - s, s, fn);
}
function landmarks(p, th, r, W, nf, skyLow, base) {
  const z = th.landmarks;
  if (z === 'col') {
    layer(p, (L) => { // uzak: kaya kemeri ve sutunlar (sisli, 6 px)
      arch(L, 40 + Math.floor(r() * (W - 160)), G - 6, 6, 5, 3, 'kumtasi', chain(fogFn(skyLow, 0.28), shadeFn(0.85), nf));
      for (let i = 0; i < 2; i++) column(L, 20 + Math.floor(r() * (W - 40)), G - 4, 6, 3 + Math.floor(r() * 3), 'kumtasi', 'altin_tugla', chain(fogFn(skyLow, 0.32), shadeFn(0.88), nf), r() < 0.5);
    }, 'dark', 0.25);
    layer(p, (L) => { // orta: harabe sutunlar (8 px)
      for (let i = 0; i < 3; i++) { const x = Math.floor(r() * (W / 8)) * 8; if (base && x > 16 && x < 23 * 16) continue; column(L, x, G, 8, 2 + Math.floor(r() * 4), 'kumtasi', 'altin_tugla', chain(fogFn(skyLow, 0.2), nf), r() < 0.6); }
    }, 'dark', 0.4);
    layer(p, (L) => { // on: palmiyeler (32 px) ve kum yiginlari
      const n = 1 + Math.floor(r() * 2);
      for (let i = 0; i < n; i++) { const x = (i === 0 ? 10 : W - 70) + Math.floor(r() * 40); putScaled(L, 'hurmalik', x, G - 46, 48, chain(shadeFn(0.95), nf)); }
      for (let i = 0; i < 2; i++) put(L, 'kum_yigini', Math.floor(r() * (W / B)) * B, G - B, nf);
    }, 'dark', 0.5);
  } else if (z === 'golge') {
    layer(p, (L) => { // uzak ve orta: yuzen adalar (ustlerinde kristal)
      for (let i = 0; i < 3; i++) { const s = i === 0 ? 8 : 6; island(L, Math.floor(r() * (W - 80)), 40 + i * 22 + Math.floor(r() * 16), s, 5 + Math.floor(r() * 3), 'golge_tas', 'golge_tas', chain(fogFn(skyLow, i === 0 ? 0.2 : 0.4), nf), 'golge_kristal'); }
    }, 'dark', 0.35);
    layer(p, (L) => { // kirik sutunlar
      for (let i = 0; i < 3; i++) { const x = Math.floor(r() * (W / 8)) * 8; column(L, x, G, 8, 2 + Math.floor(r() * 4), 'golge_tas', 'golge_tas', chain(fogFn('#6a5a90', 0.3), nf), r() < 0.7); }
    }, 'dark', 0.45);
    for (let i = 0; i < 5; i++) glowAt(p, Math.floor(r() * W), 50 + Math.floor(r() * 80), 14, '#b48af0', 0.25);
  } else if (z === 'cekirdek') {
    layer(p, (L) => { // uzak dev kristal kuleler
      for (let i = 0; i < 3; i++) spire(L, 20 + Math.floor(r() * (W - 40)), G - 8, 6, 7 + Math.floor(r() * 6), ['yildiz_kristal', 'nebula_kristal'], chain(fogFn(skyLow, 0.45), nf));
    }, 'dark', 0.25);
    layer(p, (L) => { // orta kristal kuleler
      for (let i = 0; i < 2; i++) spire(L, Math.floor(r() * (W / 8)) * 8, G, 8, 4 + Math.floor(r() * 4), ['nebula_kristal', 'yildiz_kristal'], chain(fogFn(skyLow, 0.18), nf));
    }, 'dark', 0.4);
    // yildiz tozu: ufkun ustunde parlak tanecikler ve birkac pirilti
    for (let i = 0; i < 90; i++) { const x = Math.floor(r() * W); const y = 60 + Math.floor(r() * (G - 70)); p.set(x, y, r() < 0.5 ? '#fff0a0' : '#e8c8ff'); }
    for (let i = 0; i < 6; i++) { const x = Math.floor(r() * W); const y = 50 + Math.floor(r() * (G - 70)); glowAt(p, x, y, 10, '#ffe080', 0.35); p.set(x - 1, y, '#ffffff'); p.set(x + 1, y, '#ffffff'); p.set(x, y - 1, '#ffffff'); p.set(x, y + 1, '#ffffff'); }
  }
}
// savas sahnesinde ufukta bolge simgeleri (kucuk, sisli)
function stageLandmarks(p, th, r, HZ) {
  const z = th.landmarks; const skyLow = th.sky[th.sky.length - 1][1]; const nf = th.tint;
  if (!z) return;
  layer(p, (L) => {
    if (z === 'col') { arch(L, 150 + Math.floor(r() * 60), HZ + 2, 5, 5, 3, 'kumtasi', chain(fogFn(skyLow, 0.4), nf)); column(L, 40 + Math.floor(r() * 40), HZ + 2, 5, 4, 'kumtasi', 'altin_tugla', chain(fogFn(skyLow, 0.45), nf), true); column(L, 300 + Math.floor(r() * 40), HZ + 2, 5, 6, 'kumtasi', 'altin_tugla', chain(fogFn(skyLow, 0.45), nf), false); }
    else if (z === 'golge') { for (let i = 0; i < 3; i++) island(L, 30 + i * 120 + Math.floor(r() * 40), 40 + Math.floor(r() * 40), 6, 5, 'golge_tas', 'golge_tas', chain(fogFn(skyLow, 0.35), nf), 'golge_kristal'); }
    else if (z === 'cekirdek') { for (let i = 0; i < 4; i++) spire(L, 20 + i * 100 + Math.floor(r() * 40), HZ + 2, 5, 8 + Math.floor(r() * 8), ['yildiz_kristal', 'nebula_kristal'], chain(fogFn(skyLow, 0.4), nf)); }
  }, 'dark', 0.25);
}

// Kesif savasi: perspektifli zemin, ufukta katmanlar, yanlarda derinlikte olcekli susler
export function sceneStage(zone, floor, variant = 0, tod = null) {
  const th = themeOf(zone, floor, tod);
  const r = rng(floor * 9173 + variant * 211 + zone.length * 17);
  const HZ = 136;
  const nf = th.tint;
  const p = new Pix(GAME_W, GAME_H);
  sceneBack(p, th, r, HZ, 0.75);
  stageLandmarks(p, th, r, HZ);
  sceneSparks(p, th, r, 0, HZ - 10);
  const a = th.arena;
  arenaGround(p, HZ, nf, (onPath, c, row) => (onPath ? a.path : ((((c * 374761393) ^ (row * 668265263)) >>> 0) % 9 === 0 ? a.alt : a.main)), th.haze);
  // derinlikte susler: uzak = kucuk, yakin = buyuk. Dusman tumsegi (sag orta) ve oyuncu (sol alt) bos kalir.
  const items = [];
  for (let i = 0; i < 7; i++) {
    const y = HZ + 3 + Math.floor(r() * 22);
    const left = i % 2 === 0;
    const x = left ? 96 + Math.floor(r() * 50) - (y - HZ) * 2 : 362 + Math.floor(r() * 26);
    items.push([x, y, th.depth[i % th.depth.length]]);
  }
  for (const x of [4, 60]) items.push([x, HZ + 2 + Math.floor(r() * 4), th.depth[0]]);
  items.sort((u, v) => u[1] - v[1]);
  const D = new Pix(GAME_W, GAME_H);
  for (const [x, y, d] of items) {
    const s = Math.round(4 + (y - HZ) * 0.45);
    const fn = chain(fogFn(th.haze, Math.max(0, 0.45 - (y - HZ) * 0.015)), nf);
    if (d[0] === 'tree') roundTree(D, x, y, s, d[1], 2, fn, !!d[3], d[2] || 'kutuk');
    else { const k = d[2] || 1; for (let j = 0; j < k; j++) putScaled(D, d[1], x, y - (j + 1) * s * 1.5, Math.round(s * 1.5), fn); }
  }
  D.outline('dark', 0.45);
  p.draw(D, 0, 0, D.w);
  if (th.glowProps) for (const [x, y, d] of items) if (th.glowProps[d[1]]) glowAt(p, x + 4, y - 6, 18, th.glowProps[d[1]], 0.35);
  if (th.lava) for (let i = 0; i < 5; i++) glowAt(p, Math.floor(r() * GAME_W), HZ + 10 + Math.floor(r() * 60), 30, '#ff7a30', 0.25);
  // yakin cerceve: koseler
  const N = new Pix(GAME_W, GAME_H);
  putScaled(N, th.props[0], GAME_W - 46, GAME_H - 38, 36, chain(shadeFn(0.85), nf));
  N.outline('dark', 0.5);
  p.draw(N, 0, 0, N.w);
  if (th.glowProps && th.glowProps[th.props[0]]) glowAt(p, GAME_W - 28, GAME_H - 20, 40, th.glowProps[th.props[0]], 0.3);
  if (th.snow) sceneSparks(p, { snow: true }, r, HZ, GAME_H);
  return p.canvas();
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
export function feedTable() { return build(['t'], { t: 'yem_tezgahi' }).canvas(); }
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
  // 1.0.12: uzak duvar 8 px, sise karisan; fener isiklari
  p.rect(0, 0, GAME_W, GAME_H, CAVE_DARK);
  for (let y = G - 8; y > -8; y -= 8) for (let x = -4; x < GAME_W + 8; x += 8) putScaled(p, 'tas_duvar', x + ((Math.floor(y / 8) % 2) ? 4 : 0), y, 8, chain(shadeFn(0.92), nf, fogFn(CAVE_DARK, 0.28)));
  darkenRows(p, 0, 50, 0.7, 0, CAVE_DARK);
  for (let c = 0; c < cols; c++) {
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
  for (const c of [2, 4]) glowAt(p, c * B + 8, G - 6 * B + 8, 46, '#ffb050', 0.4);
  darkenRows(p, G + 6, GAME_H, 0, 0.3, CAVE_DARK);
  return p.canvas();
}

// Cevher bloklari (16x16): toprak, kum, tas, komur, demir, define + 3 catlak
export const ORE_FRAMES = ['toprak', 'kum', 'tas', 'komur', 'demir', 'define', 'crack1', 'crack2', 'crack3', 'altin', 'kristal', 'kor', 'bonkit', 'golge', 'yildiz', 'cekirdek',
  'cimen', 'cakil', 'fosil', 'antik', 'jeot', 'bazalt', 'lav', 'su', 'merdiven', 'mesale', 'arka_tas']; // 0.10 maden kuyusu
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
const NODE_BLOCK = { moonherb: 'ay_otu', herb: 'bitki', berry: 'cali', branch: 'dallar', shroom: 'mantarlar', palm: 'hurmalik', sand: 'kum_yigini', snowberry: 'karli_cali', pepper: 'biberlik', nightshroom: 'gece_mantarlari' };
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

// 0.8 simgeleri: cogu eski cizimlerin yeni renkli hali
const EGG = ['............', '.....oo.....', '....oYYo....', '...oYwYYo...', '...oYYYYo...', '..oYsYYsYo..', '..oYYYYYYo..', '..oYYsYYYo..', '..oYYYYYso..', '...oYYYYo...', '....oooo....', '............'];
const like = (base, pal) => [ICONS[base][0], pal];
const mixHex = (a, b, t) => { const c = mix(hex(a), hex(b), t); return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join(''); };

const TILSIM = (Y, y) => like('tilsim_skarabe', { s: '#dccc96', o: '#b07a2a', Y, y });
Object.assign(ICONS, {
  buz_kristali: like('kristal', { c: '#9cc8e8', C: '#d8eef8', v: '#ffffff', d: '#6a7a98' }),
  saf_kristal: like('kristal', { c: '#5aa8d0', C: '#a8dcf4', v: '#e8f8ff', d: '#6e6a7a' }),
  kor_tasi: like('kristal', { c: '#d8561e', C: '#f49a34', v: '#ffe080', d: '#3e3638' }),
  bonkit: like('kristal', { c: '#36a868', C: '#80e4a8', v: '#e0fff0', d: '#3e3638' }),
  golge_tasi: like('kristal', { c: '#5a3a8a', C: '#8a6ac0', v: '#e0c8ff', d: '#2a2040' }),
  yakut: like('ametist', { p: '#c8304a', P: '#ff7a8a', v: '#ffe0e8', d: '#6e6a7a' }),
  aurora_boynuzu: like('dis', { w: '#7ae0c8', v: '#e0fff8', d: '#c08af0' }),
  ay_tozu: like('seker', { w: '#c8c8f0', c: '#fff0a0', C: '#fff8d0', v: '#ffffff' }),
  kar_tuyu: like('bocek_kanadi', { c: '#c8d8e8', C: '#f4fbff', v: '#ffffff' }),
  kivilcim: like('bal_damlasi', { Y: '#f07a2a', y: '#ffd060', o: '#c8401a' }),
  golge_ozu: like('bal_damlasi', { Y: '#6a4a9a', y: '#b88af0', o: '#3a2a5a' }),
  kiragi_postu: like('sargi', { b: '#c8dcec', B: '#8ab0d0' }),
  gece_postu: like('sargi', { b: '#4a3a6a', B: '#2e2440' }),
  kul: like('kum', { L: '#8a8288', s: '#6a6268', S: '#4a4448' }),
  kor_pulu: like('pul', { S: '#a83a14', s: '#f08a3a' }),
  altin_cevheri: like('demir_cevheri', { S: '#bdb9c6', s: '#9e9aa6', d: '#7a7684', o: '#f0c850' }),
  altin_kulcesi: like('kulce', { L: '#fff0a0', w: '#f0d060', M: '#d0a030', m: '#a87a20' }),
  kor_kulcesi: like('kulce', { L: '#ffb060', w: '#f07a30', M: '#c8501e', m: '#8a3014' }),
  bonkit_kulcesi: like('kulce', { L: '#c0f8d8', w: '#80e4a8', M: '#4ec888', m: '#2a8a58' }),
  golge_kulcesi: like('kulce', { L: '#c8a0f0', w: '#8a6ac0', M: '#5a3a8a', m: '#3a2a5a' }),
  buzul_kalbi: like('kalp', { A: '#4a6a90', a: '#9cc8e8', G: '#ffffff', g: '#d8eef8' }),
  magma_kabugu: like('cekirdek', { s: '#3e3638', S: '#564a4a', p: '#e0602a', P: '#ffb040', v: '#fff0a0' }),
  bosluk_tasi: like('cekirdek', { s: '#2a2040', S: '#3a2e4e', p: '#7a5ab0', P: '#7af0e0', v: '#ffffff' }),
  kar_cilegi: like('bogurtlen', { r: '#5a8ac0', R: '#c8e0f8', g: '#6cbc4e' }),
  ates_biberi: like('hurma', { h: '#c8301e', H: '#f07a3a', g: '#4e7a2e' }),
  gece_mantari: like('mantar', { r: '#3a8a8a', w: '#c8fff4', d: '#2a5a5a', s: '#c8b8d8', S: '#8a7aa0' }),
  kar_kurabiyesi: like('turta', { c: '#f4f8fb', R: '#5a8ac0', d: '#d8b080', b: '#a87a4a' }),
  aurora_sekeri: like('seker', { w: '#c08af0', c: '#7ae0c8', C: '#c8fff4', v: '#ffffff' }),
  biber_kebabi: like('hurma_tatlisi', { h: '#c8301e', H: '#f07a3a', Y: '#a86a3a', y: '#d8a06a', p: '#8a6a40' }),
  yakut_receli: like('bal', { c: '#c99a6a', g: '#c4dcea', G: '#a8c4d4', y: '#ff8a9a', Y: '#c8304a', o: '#8a1a2a' }),
  gece_coregi: like('ezme', { m: '#3a8a8a', M: '#c8fff4', b: '#8a7aa0', B: '#4a3a6a' }),
  ay_pastasi: like('hurma_tatlisi', { h: '#fff0a0', H: '#ffffff', Y: '#8a6ac0', y: '#c8a0f0', p: '#d8d0c4' }),
  sicak_corba: like('corba', { s: '#f4f4f8', b: '#a85a2a', B: '#7a3e1e', c: '#e0602a', m: '#ffd060' }),
  ates_iksiri: like('iksir', { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', R: '#5aa8d0', r: '#3a7aa8', w: '#d8eef8' }),
  iksir_buyuk: like('iksir_orta', { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', R: '#c040a0', r: '#8a2a70', w: '#f8c8ec' }),
  yumurta_orman: [EGG, { o: '#4e8434', Y: '#a8d878', w: '#ffffff', s: '#ec96a4' }],
  yumurta_magara: [EGG, { o: '#4a6a90', Y: '#a8d4ec', w: '#ffffff', s: '#9a6cc8' }],
  yumurta_col: [EGG, { o: '#b88a30', Y: '#ffe08a', w: '#ffffff', s: '#e86a2a' }],
  yumurta_buz: [EGG, { o: '#6a7a98', Y: '#e4ebf2', w: '#ffffff', s: '#7ae0c8' }],
  yumurta_kor: [EGG, { o: '#a83a14', Y: '#ffb060', w: '#fff0a0', s: '#e8502a' }],
  yumurta_golge: [EGG, { o: '#2a2040', Y: '#5a4a8a', w: '#c8a0f0', s: '#fff0a0' }],
  kilic_buzul: [null, { W: '#f4fbff', B: '#9cc8e8', G: '#4a6a90', h: '#5a4a3a', P: '#7aa4c4' }],
  kilic_kor_ozel: [null, { W: '#ffe080', B: '#e0602a', G: '#3e3638', h: '#2a2426', P: '#c8401a' }],
  eldiven_ayi: like('eldiven', { g: '#c8d8e8', G: '#f4f8fb', c: '#5aa8d0', S: '#8aa8c8', s: '#a8c0d8' }),
  gogus_magma: [null, { m: '#3e3638', M: '#564a4a', y: '#f07a2a', d: '#2a2426' }],
  yay_bosluk: [null, { W: '#8a6ac0', B: '#3a2a5a', s: '#7af0e0' }],
  pelerin: like('gogus_yosun', { m: '#2a2040', M: '#4a3a6a', y: '#7af0e0', d: '#1a1428' }),
  tilsim_aurora: TILSIM('#7ae0c8', '#e0fff8'),
  tilsim_yakut: TILSIM('#c8304a', '#ff9aa0'),
  tilsim_ay: TILSIM('#8a8ac8', '#fff0a0'),
});
// 0.9 pelerinler ve Gezgin Tuccar tohumlari
const CAPE_ICON = ['............', '...dyyyyd...', '..dmMMMMmd..', '..mMMMMMMm..', '.dmMMMMMMmd.', '.mMMMMMMMMm.', '.mMMMMMMMMm.', 'dmMMMMMMMMmd', 'mMMMMMMMMMMm', 'mmMMmMMmMMmm', 'dmmddmmddmmd', '............'];
for (const [k, c] of Object.entries(CAPE_COLORS)) ICONS[`pelerin_${k}`] = [CAPE_ICON, { d: c[0], m: c[1], M: c[2], y: c[3] }];
// Lale Pulu: kenari tirtikli, ortasinda pembe lale olan para
ICONS.lale_pulu = [['....yyyy....', '..yYYYYYYy..', '.yYYpYYpYYy.', '.yYYpPPpYYy.', 'yYYYpPPpYYYy', 'yYYYYppYYYYy', 'yYYYYgYYYYYy', 'yYYYggYYYYYy', '.yYYYgYYYYy.', '.yYYYYYYYYy.', '..yYYYYYYy..', '....yyyy....'],
  { y: '#c89a3a', Y: '#f4dc8a', p: '#e0607a', P: '#ff9ab0', g: '#4a9a4a' }];
// 0.10 kurek, balta, fidanlar, fosiller
const SHOVEL = ['.........HH.', '........HHHH', '.......HHHH.', '.......HHH..', '......h.H...', '.....h......', '....h.......', '...h........', '..h.........', '.gh.........', 'gg..........', '............'];
ICONS.kurek_tahta = [SHOVEL, { H: '#c49a64', h: '#8a5e36', g: '#5a3e24' }];
ICONS.kurek_demir = [SHOVEL, { H: '#c8ccd6', h: '#8a5e36', g: '#5a3e24' }];
ICONS.balta_tahta = [['............', '...HHH......', '..HHHHh.....', '..HHHh.h....', '...HH...h...', '.........h..', '..........h.', '...........g', '............', '............', '............', '............'], { H: '#c49a64', h: '#8a5e36', g: '#5a3e24' }];
ICONS.balta_demir = [ICONS.balta_tahta[0], { H: '#c8ccd6', h: '#8a5e36', g: '#5a3e24' }];
const SAPLING = ['............', '....ll......', '...lLLl.ll..', '....lLlLLl..', '.....lLll...', '......t.....', '......t.....', '....ddtdd...', '...dDDDDDd..', '...dDDDDDd..', '....ddddd...', '............'];
ICONS.fidan_mese = [SAPLING, { l: '#4a8a3a', L: '#7cc25a', t: '#7a5232', d: '#6a4a2e', D: '#8a6a4a' }];
ICONS.fidan_hus = [SAPLING, { l: '#7aa848', L: '#b8e078', t: '#e8e0d0', d: '#6a4a2e', D: '#8a6a4a' }];
ICONS.fidan_cam = [SAPLING, { l: '#1e4a32', L: '#3e7a4e', t: '#4a3424', d: '#6a4a2e', D: '#8a6a4a' }];
ICONS.fidan_kiraz = [SAPLING, { l: '#c86a8a', L: '#f0a8c8', t: '#8a4a3a', d: '#6a4a2e', D: '#8a6a4a' }];
const FOSSIL = ['............', '...mmmmm....', '..mMMMMMm...', '.mMMbbMMMm..', '.mMbBBbMMm..', '.mMbBBBbMm..', '.mMMbBBbMm..', '.mMMMbbMMm..', '..mMMMMMm...', '...mmmmm....', '............', '............'];
for (const [k, c] of Object.entries({ fosil_kabuk: '#e8dcc0', fosil_yaprak: '#a8c890', fosil_dis: '#f0ece0', fosil_kemik: '#e0d4b8', fosil_kafatasi: '#d8ccb0', fosil_kehribar: '#f0a030' })) {
  ICONS[k] = [FOSSIL, { m: '#6e6874', M: '#8a8490', b: c, B: '#fff8e8' }];
}
ICONS.tohum_ay = [ICONS.tohum_ot[0], { p: '#7a80b8', P: '#b8c0f0', w: '#ffffff', g: '#fff0a0' }];
ICONS.tohum_altin = [ICONS.tohum_bogurtlen[0], { p: '#b08020', P: '#f0c040', w: '#fff0a0' }];
// 0.8.5 balikcilik simgeleri
const FISH_ICON = ['............', '............', '......FF....', '....BBBBF...', '..BBLLLBBF.F', '.BwkLBBBBBFF', '.BkkBBBBBBFF', '.BBBDDDBBBF.', '..DDDDDDDF.F', '....DDDF....', '............', '............'];
const ROD_ICON = ['..........R.', '.........Rl.', '........R.l.', '.......R..l.', '......R...l.', '.....R....l.', '....R.....l.', '...r......l.', '..r......wb.', '.gg.......b.', 'gg..........', '............'];
const CRACKER = ['............', '............', '...cccccc...', '..cCcCcCcc..', '.cCcPcCcCcc.', '.ccCcCcPcCc.', '.cCcCcCcCcc.', '..ccCcCcCc..', '...dddddd...', '............', '............', '............'];
Object.assign(ICONS, {
  olta_tahta: [ROD_ICON, { R: '#c48c54', r: '#8e5e32', g: '#6a4426', l: '#e8e4dc', w: '#ffffff', b: '#e8564a' }],
  olta_bambu: [ROD_ICON, { R: '#c8c060', r: '#8a9a3a', g: '#5a6a2a', l: '#e8e4dc', w: '#ffffff', b: '#e8564a' }],
  olta_demir: [ROD_ICON, { R: '#c8ccd6', r: '#8a8e9a', g: '#5a3e26', l: '#e8e4dc', w: '#ffffff', b: '#e8564a' }],
  olta_kristal: [ROD_ICON, { R: '#a8dcf4', r: '#5aa8d0', g: '#e8c050', l: '#e8f8ff', w: '#ffffff', b: '#c08af0' }],
  olta_kor: [ROD_ICON, { R: '#ffb050', r: '#d8561e', g: '#3e3638', l: '#ffe080', w: '#ffffff', b: '#ffd060' }],
  solucan: [['............', '............', '............', '.......pp...', '......pPPp..', '..pp.pP..pk.', '.pPPpP...pp.', '.p..pp......', '............', '..ddddddddd.', '.ddddddddddd', '............'], { p: '#e88a9a', P: '#f8b8c0', k: '#100c14', d: '#7a5a38' }],
  parlak_yem: [['............', '.....w......', '....wYw.....', '.....w......', '.......pp...', '......pYYp..', '..pp.pY..pk.', '.pYYpY...pp.', '.p..pp......', '..........w.', '.........wYw', '..........w.'], { p: '#d8a0e8', Y: '#fff0a0', k: '#100c14', w: '#ffffff' }],
  gol_incisi: [['............', '............', '..ssssssss..', '.sSSSSSSSSs.', '.sSSSppSSSs.', '.sSSpPwpSSs.', '.sSSpPPpSSs.', '.sSSSppSSSs.', '..ssssssss..', '............', '............', '............'], { s: '#7a6a90', S: '#b8a8c8', p: '#f0d8e8', P: '#fff8f0', w: '#ffffff' }],
  efsane_pul: like('pul', { S: '#c8902a', s: '#ffe080' }),
  deniz_cami: like('kristal', { c: '#5ab8a8', C: '#a8f0e0', v: '#e8fff8', d: '#3a7a70' }),
  izgara_balik: [['............', '............', '......FF....', '....BBBBF...', '..BBLdLdBF.F', '.BwkdBdBdBFF', '.BkkBdBdBBFF', '.BBBDDDBBBF.', '..DDDDDDDF.F', '.pppppppppp.', '..pppppppp..', '............'], { B: '#b8783a', L: '#e8b070', D: '#7a4a24', F: '#8a5a30', d: '#4a2e18', w: '#fff0d0', k: '#100c14', p: '#e8e4dc' }],
  balik_corbasi: like('corba', { s: '#f4f4f8', b: '#5a8ab0', B: '#3a5a7a', c: '#f0d8a0', m: '#e88a6a' }),
  balik_kraker: [CRACKER, { c: '#d8a860', C: '#f0d090', P: '#8ab4c8', d: '#a87a40' }],
  inci_kraker: [CRACKER, { c: '#d8a860', C: '#f0d090', P: '#fff8f0', d: '#a87a40' }],
  yildiz_demiri: like('kulce', { L: '#ffffff', w: '#e8ecf4', M: '#b8bccc', m: '#7a7e90' }),
  cekirdek_kristali: like('kristal', { c: '#e05aa0', C: '#ffa8d8', v: '#fff0f8', d: '#6a2a50' }),
  ay_otu: like('ot', { w: '#c8d8ff', y: '#ffffff', g: '#6aa08a', G: '#4a7a6a' }),
  usta_damgasi: like('tilsim_skarabe', { s: '#c8b8a0', o: '#7a5a3a', Y: '#e8c050', y: '#fff0a0' }),
  tilsim_inci: TILSIM('#f0d8e8', '#ffffff'),
  pelerin_pullu: like('gogus_yosun', { m: '#c8902a', M: '#ffe080', y: '#7ae0c8', d: '#7a5418' }),
  olta_efsane: [ROD_ICON, { R: '#ffe080', r: '#c8902a', g: '#7ae0c8', l: '#fff8e0', w: '#ffffff', b: '#7ae0c8' }],
  kazma_cekirdek: [null, { H: '#ffa8d8', D: '#e05aa0', h: '#5a3e26' }],
  sifirlama_tasi: like('cekirdek', { s: '#5a4a6a', S: '#7a6a8a', p: '#e05aa0', P: '#ffa8d8', v: '#ffffff' }),
  ay_iksiri: like('iksir', { c: '#c99a6a', k: '#dcecf4', g: '#a8d0e2', R: '#c8d8ff', r: '#7a8ac0', w: '#ffffff' }),
});
for (const [k, f] of Object.entries(FISH)) {
  const [B, L, D, F] = f.col;
  ICONS[`balik_${k}`] = [FISH_ICON, { B, L, D, F, w: '#ffffff', k: '#100c14' }];
}
// seviye esyalari: kilic, yay, kazma, kask, goguslik, bot (renk: ana, acik, koyu, ikinci)
const TIER_COL = {
  kristal: ['#7cc0e0', '#d8f2fc', '#4a88b0', '#e8c050'],
  kor: ['#d8561e', '#ffb050', '#8a3014', '#3e3638'],
  bonkit: ['#4ec888', '#c0f8d8', '#2a8a58', '#e8f0ea'],
  golge: ['#5a3a8a', '#b88af0', '#2e2040', '#7af0e0'],
};
for (const [t, [m, l, d, x]] of Object.entries(TIER_COL)) {
  ICONS[`kilic_${t}`] = [null, { W: l, B: m, G: x, h: '#5a3e26', P: d }];
  ICONS[`yay_${t}`] = [null, { W: l, B: d, s: x === '#3e3638' ? '#ffd060' : '#e4dcc4' }];
  ICONS[`kazma_${t}`] = [null, { H: l, D: m, h: '#7e4e2a' }];
  ICONS[`kask_${t}`] = [null, { m, M: l, d }];
  ICONS[`gogus_${t}`] = [null, { m, M: l, y: x, d }];
  ICONS[`bot_${t}`] = [null, { m, M: l, d }];
}
const BOW = ['......WB....', '.....W..s...', '....W...s...', '...W....s...', '...W....s...', '..WB....s...', '..WB....s...', '...W....s...', '...W....s...', '....W...s...', '.....W..s...', '......WB....'];
const PICK = ['............', '...DHHHHD...', '..HH....HH..', '.HD..h...DH.', '.D...h....D.', '.....h......', '.....h......', '.....h......', '.....h......', '.....h......', '.....h......', '............'];
const SWORD = ['............', '...........W', '..........WB', '.........WB.', '........WB..', '.......WB...', '..G...WB....', '...G.WB.....', '....G.......', '...h.G......', '..h...G.....', '.P..........'];
// 0.11 ciftlik ve mutfak simgeleri
Object.assign(ICONS, {
  bugday: [['............', '...y.y.y....', '..yYyYyYy...', '..yyYyYyy...', '...yyyyy....', '....gyg.....', '....gyg.....', '...rrrrr....', '....gyg.....', '...gyyyg....', '..gy.y.yg...', '............'], { y: '#d8b048', Y: '#f0d070', g: '#a8a050', r: '#8a5a30' }],
  havuc: [['........gg..', '.......gGg..', '......gGg.g.', '.....oogGg..', '....oOoo....', '...oOooo....', '...oooo.....', '..oOoo......', '..ooo.......', '.oo.........', '.o..........', '............'], { o: '#e8782a', O: '#f8a050', g: '#4e8a2e', G: '#7ac04e' }],
  patates: [['............', '............', '....pppp....', '...pPpppp...', '..pPppdppp..', '..ppppppdp..', '..pdppppppd.', '..ppppdppp..', '...pppppp...', '....dddd....', '............', '............'], { p: '#c8985a', P: '#e8c890', d: '#8a6030' }],
  kabak: [['.....gg.....', '......g.....', '...oOoOoo...', '..oOoOoOoo..', '.oOodOdoOdo.', '.ooodoodood.', '.oOodOdoOdo.', '.ooodoodood.', '..oodoodoo..', '...dddddd...', '............', '............'], { o: '#e0802a', O: '#f8a850', d: '#b85a1a', g: '#5a7a2e' }],
  misir: [['.......gg...', '......gyyg..', '.....gyYyg..', '....gyYyYg..', '...gyYyYyg..', '...gyyYyg...', '..gyYyYg....', '..gyyyg.....', '.gGgyg......', '.gGgg.......', '..g.........', '............'], { y: '#f0c838', Y: '#f8e070', g: '#5a8a2e', G: '#8ac05a' }],
  pamuk: [['............', '...ww..ww...', '..wWWwwWWw..', '..wWWwwWWw..', '...wwbbww...', '....bwwb....', '...wwbbww...', '..wWWwwWWw..', '..wWWw.wWw..', '...ww...w...', '............', '............'], { w: '#e8e2d8', W: '#ffffff', b: '#7a5a3a' }],
  su_kovasi: [['............', '...kkkkkk...', '..k......k..', '.k........k.', '.mbbbbbbbbm.', '.mBwBBBBBBm.', '.mbbbbbbbbm.', '..mssssssm..', '..mssssssm..', '..mMMMMMMm..', '...mmmmmm...', '............'], { k: '#5a5a6a', m: '#7a7a8a', M: '#5a5a6a', s: '#a8a8b8', b: '#3a8ac8', B: '#8ad8ff', w: '#ffffff' }],
  gubre: [['............', '....kkkk....', '.....ss.....', '....ssss....', '...sSsssS...', '..sSssssss..', '..sssbbsss..', '..ssbBbbss..', '..ssbbbbss..', '..sssssssd..', '...dddddd...', '............'], { s: '#c8a870', S: '#e8d0a0', d: '#8a6a40', b: '#5a3e24', B: '#7a5a34', k: '#6a4a2a' }],
});
ICONS.yanmis_yemek = like('corba', { s: '#8a8a8a', b: '#4a4040', B: '#2a2424', c: '#3a2a20', m: '#5a4030' });
{
  const SC = { bugday_tohumu: '#d8b048', havuc_tohumu: '#e8782a', patates_tohumu: '#b8884a', kabak_tohumu: '#f0d8a0', misir_tohumu: '#f0c838', pamuk_tohumu: '#e8e2d8', biber_tohumu: '#c8301e', cilek_tohumu: '#5a8ac0' };
  const tp = ICONS.tohum_ot[1];
  for (const sd of Object.values(SEED_OF)) ICONS[sd] = like('tohum_ot', { ...tp, p: mixHex(SC[sd], '#3a2a20', 0.35), P: SC[sd] });
  for (const [id, , , , , , [base, pal]] of KITCHEN) ICONS[id] = pal ? like(base, pal) : ICONS[base];
  ICONS.sargi_pamuk = like('sargi', { b: '#ffffff', B: '#e05a5a' }); // G6: Pamuk Sargi beyaz, kirmizi bantli
}

// 0.12 Yasayan Ahir malzemeleri ve Glemon aksesuarlari
Object.assign(ICONS, {
  yumusak_yun: [['............', '............', '....wwww....', '..wwWWwwww..', '.wWWwwwWWww.', '.wwwwdwwwwd.', '.wWwwwwWwwd.', '.wwwdwwwwdd.', '..wwwwwwdd..', '....dddd....', '............', '............'], { w: '#ece6dc', W: '#ffffff', d: '#c8beb0' }],
  parlak_tuy: [['............', '.........yY.', '........yYy.', '.......yYy..', '......yYy...', '.....yYy....', '....yYy.....', '...yYy......', '..yYy.......', '..ss........', '.s..........', '............'], { y: '#8ac8e0', Y: '#e0f4ff', s: '#7a6a5a' }],
  kivilcim_tozu: [['............', '.....y......', '....yYy..o..', '.....y..oYo.', '..o......o..', '.oYo..y.....', '..o..yYy....', '......y..y..', '...ddddddYd.', '..dDDDDDDDd.', '...dddddddd.', '............'], { y: '#ffd060', Y: '#fff0a0', o: '#f05a2a', d: '#7a4a3a', D: '#a86a4a' }],
  glemon_sumugu: [['............', '............', '.....gg.....', '....gGGg....', '...gGwGGg...', '..gGGGGGgg..', '..gGGGGGGg..', '.ggGGGGGGgg.', '.gggggggggg.', '..g..gg..g..', '............', '............'], { g: '#6a5a9a', G: '#a08ad0', w: '#f0e8ff' }],
  kristal_tozu: [['............', '......C.....', '.....cCc....', '..C...c..c..', '.cCc.....Cc.', '..c...C.....', '.....cCc....', '......c.....', '..dddddddd..', '.dDDDDDDDDd.', '..dddddddd..', '............'], { c: '#9a6cc8', C: '#e4c8ff', d: '#6a6a7a', D: '#8a8a9a' }],
  altin_kum: [['............', '............', '.....y......', '....yYy.....', '...yyYyy....', '..yyyyyyy...', '.yyYyyyYyy..', '.yyyyYyyyyy.', 'yyyyyyyyyyyy', '.dddddddddd.', '............', '............'], { y: '#e8c050', Y: '#fff0a0', d: '#b08a30' }],
  yun_tasma: [['............', '............', '...rrrrrr...', '..r......r..', '.r........r.', '.r........r.', '..r......r..', '...rrrrrr...', '.....yy.....', '.....yy.....', '............', '............'], { r: '#d84a4a', y: '#ffd060' }],
  tuylu_atki: [['............', '..bbbbbbbb..', '.bBBBBBBBBb.', '.bbbbbbbbbb.', '.......bb...', '.......bBb..', '.......bBb..', '.......bbb..', '.......b.b..', '............', '............', '............'], { b: '#4a8ad8', B: '#8ab8f0' }],
  kivilcim_kurdele: [['............', '............', '..oo....oo..', '.oOOo..oOOo.', '.oOOOooOOOo.', '..ooOyyOoo..', '..ooOyyOoo..', '.oOOOooOOOo.', '.oOOo..oOOo.', '..oo....oo..', '............', '............'], { o: '#c85a1a', O: '#f07a2a', y: '#ffd060' }],
  kristal_can: [['.....bb.....', '....b..b....', '....yyyy....', '...yYYyyy...', '...yYyyyy...', '..yYyyyyyy..', '..yyyyyyyy..', '.yyyyyyyyyy.', '.dddddddddd.', '.....dd.....', '............', '............'], { y: '#ffd060', Y: '#fff4c0', d: '#b08a30', b: '#6a5a3a' }],
  glemon_sekeri: [['............', '............', '..w......w..', '.wpw....wpw.', '..wppppppw..', '...pPPpPp...', '...pPpPPp...', '..wppppppw..', '.wpw....wpw.', '..w......w..', '............', '............'], { p: '#f08ab0', P: '#ffd0e0', w: '#f4ecd8' }],
  sumuk_yemi: [['............', '............', '....gggg....', '...gGGGGg...', '..gGbGGbGg..', '..gGGGGGGg..', '..gGbGGGbg..', '...gGGGGg...', '....gggg....', '............', '............', '............'], { g: '#6a5a9a', G: '#a08ad0', b: '#5a2a6a' }],
  glemon_yumurtasi: [EGG, { o: '#b8a070', Y: '#f4ecd8', w: '#ffffff', s: '#ec96a4' }],
});

const CHESTPLATE = ['............', '.mmm....mmm.', '.mMMmmmmMMm.', '.mMMMMMMMMm.', '..mMMyMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mmmmmmmm..', '..dddddddd..', '............', '............'];


// Simgeler 16x16: blok olan esyalar blogun kendisi, digerleri 12x12 cizimden
// golgelendirilip (sol ust acik, sag alt koyu) ve renkleri biraz soldurulup cizilir.
const ICON_BLOCKS = {
  tas: 'tas', kum: 'kum', kalas: 'kalas', tugla: 'tugla', cam: 'cam', cimen: 'cimen', demir_cevheri: 'demir',
  kutuk: 'kutuk', kaldirim: 'kaldirim', kiremit: 'kiremit', yaprak_blok: 'yaprak', tarla: 'tarla', renkli_cam: 'renkli_cam',
  ay_tasi: 'ay_tasi', altin_tugla: 'altin_tugla', pembe_yaprak: 'pembe_yaprak',
  hus_kutuk: 'hus_kutuk', cam_kutuk: 'cam_kutuk', kiraz_kutuk: 'kiraz_kutuk', hus_kalas: 'hus_kalas', cam_kalas: 'cam_kalas', kiraz_kalas: 'kiraz_kalas',
  toprak_blok: 'toprak', cimen_blok: 'cimen', cakil_blok: 'cakil',
  pencere: 'pencere', somine: 'somine', raf: 'raf', hus_yaprak: 'hus_yaprak', cam_yaprak: 'cam_yaprak', tezgah: 'tezgah', firin0: 'firin0',
};
// saydam zeminli bloklar: cercevesiz, sadece cizgiyle
const ICON_PROPS = { cit: 'cit', fener: 'fener', kapi: 'kapi_alt', mavi_fener: 'mavi_fener', merdiven: 'merdiven', mesale: 'mesale',
  tas_yarim: 'tas_yarim', kalas_yarim: 'kalas_yarim', tas_basamak: 'tas_basamak', kalas_basamak: 'kalas_basamak', hali_k: 'hali_k', hali_m: 'hali_m', yatak_bas: 'yatak_bas', masa_m: 'masa_m', sandalye: 'sandalye', saksi: 'saksi', tabela: 'tabela', bayrak_k: 'bayrak_k', bayrak_m: 'bayrak_m', sandik: 'sandik', kupa_rafi: 'kupa_rafi', heykel: 'heykel', altin_heykel: 'altin_heykel', cesme: 'cesme', kristal_sutun: 'kristal_sutun', kristal_fener: 'kristal_fener', kazan0: 'kazan0', varil: 'varil', kalkan: 'kalkan', kovan: 'kovan', kulucka: 'kulucka' };
const mute = (v) => {
  const c = unpack(v); const l = 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  return pack(mul(mix(c.slice(0, 3), [l, l, l], 0.18), 0.94), c[3]);
};
// K6 veri taramasi icin: simgenin gercekten cizimi var mi (yoksa Dal simgesine duser)
export const hasIcon = (name) => !!(ICON_PROPS[name] || ICON_BLOCKS[name] || ICONS[name]);
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

// 0.8.9: giyilen esyanin karakter ustundeki renkleri (koyu, orta, acik, parlak)
const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const shadeRgb = (c, f) => c.map((v) => Math.max(0, Math.min(255, Math.round(f >= 1 ? v + (255 - v) * (f - 1) : v * f))));
export function gearRamp(icon) {
  const def = ICONS[icon];
  if (!def || !def[1]) return null;
  const p = def[1];
  const g = (k) => (p[k] ? hexToRgb(p[k]) : null);
  let d, m, l;
  if (icon.startsWith('kilic') || icon.startsWith('asa')) { d = g('P') || g('B'); m = g('B'); l = g('W'); }
  else if (icon.startsWith('kazma')) { m = g('D'); l = g('H'); d = shadeRgb(m, 0.72); }
  else if (icon.startsWith('yay')) { m = g('B'); l = g('W'); d = shadeRgb(m, 0.75); }
  else { d = g('d'); m = g('m'); l = g('M'); }
  if (!m || !l) return null;
  if (!d) d = shadeRgb(m, 0.72);
  // 1.0.3: zirhta 'y' sus rengidir (kristalde altin), parlak ton degil. Parlak ton hep
  // acik rengin bir tik acigi; sus rengi 5. ton olarak sadece toka ve percinde kullanilir.
  const armor = /^(kask|gogus|bot)_/.test(icon);
  const set = icon.replace(/^(kask|bot)_/, 'gogus_');
  const ya = p.y || (ICONS[set] && ICONS[set][1] && ICONS[set][1].y);
  const h = !armor && p.y ? hexToRgb(p.y) : shadeRgb(l, 1.3);
  const acc = armor && ya ? hexToRgb(ya) : shadeRgb(l, 1.45);
  return [d, m, l, h, acc].map((c) => shadeRgb(c, 0.97));
}

// 0.8.9 Etkinlik Kapisi (Eren, 2026-11-10): ussun sagindaki eski maden girisinin yerinde.
// Tas tugla kemer, ortasinda donen yumusak isik. 4 kare: kapi + 4 dalga evresi.
export const GATE = { w: 4 * B + 2, h: 5 * B + 2 };
export function eventGate() {
  const frames = 4;
  const out = new Pix(GATE.w * frames, GATE.h);
  const swirl = ['#3a2a5e', '#5a3a8a', '#8a5ac8', '#b88af0', '#e0c8ff', '#fff4fc'];
  for (let f = 0; f < frames; f++) {
    const p = new Pix(GATE.w, GATE.h);
    // donen isik (kemerin ici: 2 blok genis, 3.5 blok yuksek)
    const x0 = 1 + B, y0 = 1 + B + 4, w = 2 * B, h = 3 * B + 12;
    const cx = x0 + w / 2 - 0.5, cy = y0 + h / 2;
    for (let y = y0; y < y0 + h; y++) {
      for (let x = x0; x < x0 + w; x++) {
        const dx = (x - cx) / (w / 2), dy = (y - cy) / (h / 2);
        const r = Math.sqrt(dx * dx + dy * dy);
        const a = Math.atan2(dy, dx);
        const v = (r * 3.2 - a / Math.PI + f / frames) % 1;
        let k = Math.floor((1 - r) * 4 + (v < 0.5 ? 1 : 0));
        k = Math.max(0, Math.min(swirl.length - 1, k));
        p.set(x, y, col(swirl[k]));
      }
    }
    // kemer: yanlarda tas duvar sutunlari, ustte tugla ve ortada yildiz
    const light = shadeFn(1.18);
    for (let k = 1; k <= 4; k++) { put(p, 'tas_duvar', 1, 1 + k * B, light); put(p, 'tas_duvar', 1 + 3 * B, 1 + k * B, light); }
    for (let c = 0; c < 4; c++) put(p, 'tugla', 1 + c * B, 1);
    put(p, 'renkli_cam', 1 + B + 8, 1);
    // kemerin ic kosesi yuvarlak
    for (const [x, y] of [[x0, y0], [x0 + 1, y0], [x0, y0 + 1], [x0 + w - 1, y0], [x0 + w - 2, y0], [x0 + w - 1, y0 + 1]]) p.set(x, y, col('#6a6674'));
    p.outline(OL);
    out.draw(p, f * GATE.w, 0, GATE.w);
  }
  return { canvas: out.canvas(), fw: GATE.w, fh: GATE.h };
}

// 0.8.9 alt kisayol cubugu simgeleri
Object.assign(ICONS, {
  dock_canta: [['............', '....dddd....', '...d....d...', '..BBBBBBBB..', '.BbbbbbbbbB.', '.BbbbYYbbbB.', '.BbbbYYbbbB.', '.BbbbbbbbbB.', '.BbbbbbbbbB.', '.BbbbbbbbbB.', '..BBBBBBBB..', '............'],
    { b: '#c08a52', B: '#86522a', d: '#68401f', Y: '#ffd04d' }],
  dock_beceri: [['.....gg.....', '....gGGg....', '...gGGGGg...', '..gGGGGGGg..', '.gggGGGGggg.', '....gGGg....', '....gGGg....', '....gGGg....', '....gGGg....', '....gggg....', '............', '............'],
    { g: '#3c8a3a', G: '#8ad86a' }],
  dock_gorev: [['............', '.ddddddddd..', 'dWWWWWWWWWd.', '.dWkkkkkWd..', '.dWWWWWWWd..', '.dWkkkkWWd..', '.dWWWWWWWd..', '.dWkkkkkWd..', '.dWWWWWWWd..', 'dWWWWWWWWWd.', '.ddddddddd..', '............'],
    { W: '#f4e4bc', d: '#b0864a', k: '#8a6a4a' }],
  dock_album: [['............', '.GGGGGGGGG..', '.GggggggggG.', '.GgWWWWWggG.', '.GgWYYYWggG.', '.GgWWWWWggG.', '.GggggggggG.', '.GggggggggG.', '.GggggggggG.', '.GGGGGGGGGG.', '.wwwwwwwwww.', '............'],
    { G: '#2a6a8a', g: '#4a9ac0', W: '#f4e4bc', Y: '#ff9ab4', w: '#e8e0d0' }],
  dock_profil: [['....HHHH....', '...HHHHHH...', '..HHHHHHHH..', '..HsssssHH..', '..sksssks...', '..ssssssss..', '...sspss....', '....ssss....', '..CCCCCCCC..', '.CCCCCCCCCC.', '.CCCCCCCCCC.', '............'],
    { H: '#6e4a3a', s: '#f0be98', k: '#2a1f1a', p: '#e8867a', C: '#4a8a4a' }],
  dock_rehber: [['............', '.RRRRR.BBBB.', '.RrrrrRBbbB.', '.RrWWrRBbbB.', '.RrrrrRBbbB.', '.RrWWrRBbbB.', '.RrrrrRBbbB.', '.RrrrrRBbbB.', '.RRRRRRBBBB.', '.wwwwwwwwww.', '..........yy', '............'],
    { R: '#8a3a2a', r: '#c85a3a', W: '#f4e4bc', B: '#2a4a7a', b: '#4a7ab0', w: '#e8e0d0', y: '#ffd04d' }],
  ui_filtre: [['............', '.dddddddddd.', '.dWWWWWWWWd.', '..dWWWWWWd..', '...dWWWWd...', '....dWWd....', '....dWWd....', '....dWWd....', '....dWWd....', '....ddWd....', '......dd....', '............'],
    { d: '#3e2a1e', W: '#f4e4bc' }],
  dock_ayar: [['............', '.....gg.....', '..g.gGGg.g..', '..gGGGGGGg..', '...GGddGG...', '.gGGd..dGGg.', '.gGGd..dGGg.', '...GGddGG...', '..gGGGGGGg..', '..g.gGGg.g..', '.....gg.....', '............'],
    { g: '#6a6a7a', G: '#b8bccc', d: '#4a4a5a' }],
  dock_harita: [['............', '.YYY.YYY.YY.', 'YyyyYyyyYyyY', 'YyryYyyyYyyY', 'YyyyYyryYyyY', 'YyyyYyyyYryY', 'YyryYyyyYyyY', 'YyyyYyyyYyyY', 'YyyyYyryYyyY', 'YyyyYyyyYyyY', '.YYY.YYY.YY.', '............'],
    { Y: '#b0864a', y: '#f4e4bc', r: '#d8564a' }],
});

// 0.8.9 yeni savas sahnesi (Eren, 2026-11-10: perspektifli arka planlar kotu duruyordu).
// Savas, o an bulundugun odanin yumusak blok manzarasinin onunde gecer. Kamera yine
// karakterin sirtinda; Glemonlar odanin zemininde bir cimen tumsegi ustunde, karakter
// on tarafta (sol alt) kendi tumseginde durur. Renkler odanin zemininden alinir.
export const STAGE = { enemy: { x: 262, y: G - 27, rx: 96, ry: 11 }, me: { x: 70, y: GAME_H + 2, rx: 78, ry: 16 } };
export function battleStage(src) {
  const cv = document.createElement('canvas');
  cv.width = GAME_W; cv.height = GAME_H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(src, 0, 0, GAME_W, GAME_H);
  const img = cx.getImageData(0, 0, GAME_W, GAME_H);
  const d = img.data;
  const at = (x, y) => { const i = (Math.max(0, Math.min(GAME_H - 1, y)) * GAME_W + Math.max(0, Math.min(GAME_W - 1, x))) * 4; return [d[i], d[i + 1], d[i + 2]]; };
  const avg = (pts) => pts.reduce((a, c) => a.map((v, k) => v + c[k] / pts.length), [0, 0, 0]).map(Math.round);
  // zeminin ust (cimen) ve yan (toprak) rengi
  const top = avg([40, 120, 200, 280, 340].map((x) => at(x, G + 1)));
  const side = avg([40, 120, 200, 280, 340].map((x) => at(x, G + 9)));
  const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
  // on taraf hafif karanlik: goz Glemonlara ve karaktere gitsin
  for (let y = G + 4; y < GAME_H; y++) {
    const f = 0.86 - ((y - G) / (GAME_H - G)) * 0.12;
    for (let x = 0; x < GAME_W; x++) { const i = (y * GAME_W + x) * 4; d[i] *= f; d[i + 1] *= f; d[i + 2] *= f; }
  }
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const mound = (m, thick) => {
    const topC = lum(top) > 40 ? top : [110, 150, 80];
    const light = topC.map((v) => Math.min(255, Math.round(v * 1.18 + 14)));
    const dark = topC.map((v) => Math.round(v * 0.82));
    const sideC = (lum(side) > 20 ? side : [110, 80, 60]).map((v) => Math.round(v * 0.92));
    const sideD = sideC.map((v) => Math.round(v * 0.72));
    for (let y = Math.floor(m.y - m.ry - 1); y <= m.y + m.ry + thick + 1; y++) {
      if (y < 0 || y >= GAME_H) continue;
      for (let x = Math.floor(m.x - m.rx - 1); x <= m.x + m.rx + 1; x++) {
        if (x < 0 || x >= GAME_W) continue;
        const dx = (x - m.x) / m.rx;
        const inTop = dx * dx + ((y - m.y) / m.ry) ** 2 <= 1;
        const inSide = !inTop && dx * dx + ((y - m.y - thick) / m.ry) ** 2 <= 1 && y >= m.y;
        let c = null;
        if (inTop) {
          const ny = (y - m.y) / m.ry;
          const edge = dx * dx + ny * ny > 0.82;
          c = ny < -0.55 || (edge && ny < 0) ? light : edge ? dark : topC;
          if (!edge && hash(x, y) < 0.08) c = dark;
          if (!edge && hash(x + 7, y) < 0.05) c = light;
        } else if (inSide) {
          c = (y - m.y) > thick * 0.6 + m.ry * Math.sqrt(Math.max(0, 1 - dx * dx)) * 0.9 ? sideD : sideC;
          if (hash(x, y + 3) < 0.07) c = sideD;
        }
        if (!c) {
          // 1 piksel yumusak dis cizgi
          const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => {
            const ex = (x + a - m.x) / m.rx;
            return ex * ex + ((y + b - m.y) / m.ry) ** 2 <= 1 || (y + b >= m.y && ex * ex + ((y + b - m.y - thick) / m.ry) ** 2 <= 1);
          });
          if (near) c = d.slice((y * GAME_W + x) * 4, (y * GAME_W + x) * 4 + 3).map((v) => Math.round(v * 0.45 + 22 * 0.55));
        }
        if (c) { const i = (y * GAME_W + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
      }
    }
  };
  mound(STAGE.enemy, 9);
  mound(STAGE.me, 10);
  cx.putImageData(img, 0, 0);
  return cv;
}

// 0.8.9 vurus efektleri: kucuk yildiz ve toz bulutu
export function hitStar() {
  const p = new Pix(7, 7);
  p.map(['...Y...', '...W...', '.YWWWY.', 'YWWWWWY', '.YWWWY.', '...W...', '...Y...'], { Y: '#ffd04d', W: '#fff8d8' });
  return p.canvas();
}
export function dustPuff() {
  const p = new Pix(8, 6);
  p.map(['..aaa...', '.abbba..', 'abbbbbaa', 'abbbbbba', '.aabbaa.', '........'], { a: '#c8bca8', b: '#ece4d4' });
  return p.canvas();
}

// 0.9 Dolunay Gecesi: gokte buyuk, hafif parlayan ay
export function bigMoon() {
  const R = 14; const S = 2 * R + 10; const p = new Pix(S, S); const c = S / 2;
  const r = rng(77);
  const craters = [[-5, -4, 3], [4, 3, 4], [-2, 7, 2], [6, -6, 2], [-8, 3, 2]];
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const dx = x + 0.5 - c; const dy = y + 0.5 - c; const d = Math.hypot(dx, dy);
      if (d <= R) {
        let v = hex('#f6f0d8');
        if (dx + dy > R * 0.9) v = hex('#e2dabe');
        for (const [cx, cy, cr] of craters) if (Math.hypot(dx - cx, dy - cy) <= cr) v = mix(v, hex('#c8c0a8'), 0.55);
        if (dx + dy < -R * 1.1) v = hex('#fffbea');
        if (r() < 0.04) v = mix(v, hex('#d8d0b8'), 0.4);
        p.set(x, y, pack(v));
      } else if (d <= R + 5) {
        p.set(x, y, pack(hex('#fff6d0'), Math.round(70 * (1 - (d - R) / 5))));
      }
    }
  }
  return p.canvas();
}

// 0.13 asalar ve run taslari
{
  const STAFF = ['........WW..', '.......WBBP.', '......WBBPP.', '......hBPP..', '.....hh.P...', '....hh......', '...hh.......', '..hh........', '.hh.........', 'hh..........', 'h...........', '............'];
  const RUNE = ['............', '...dddddd...', '..dSSSSSSd..', '..dSgSSgSd..', '..dSSggSSd..', '..dSSgSSSd..', '..dSgggSSd..', '..dSSSSSSd..', '..dSSSSSSd..', '...dddddd...', '............', '............'];
  ICONS.asa_cirak = [STAFF, { W: '#d8f2fc', B: '#7cc0e0', P: '#4a88b0', h: '#8a5a32' }];
  ICONS.asa_tas = [STAFF, { W: '#c4c0cc', B: '#8e8a98', P: '#6a6674', h: '#7e4e2a' }];
  ICONS.asa_demir = [STAFF, { W: '#eef0f4', B: '#a9adb8', P: '#6a6e7a', h: '#5a3e26' }];
  for (const [t, [m, l, d]] of Object.entries(TIER_COL)) ICONS[`asa_${t}`] = [STAFF, { W: l, B: m, P: d, h: '#5a3e26' }];
  ICONS.run_tasi = [RUNE, { d: '#5a5664', S: '#a9a5b2', g: '#7af0e0' }];
  ICONS.run_ates = [RUNE, { d: '#3e3638', S: '#76727f', g: '#ff9a3a' }];
  ICONS.run_buz = [RUNE, { d: '#3e4a62', S: '#8aa4c8', g: '#e0f8ff' }];
  ICONS.run_golge = [RUNE, { d: '#2e2040', S: '#5a3a8a', g: '#b88af0' }];
  // 0.13.5 efsanevi silahlar: Yildiz (uretilir), Kadim (duser), Sanli (pulla alinir)
  const LEG_COL = {
    yildiz: ['#c8c4ec', '#ffffff', '#7a74b0', '#ffd060'],
    kadim: ['#2a9a86', '#9af4dc', '#164a44', '#d0a040'],
    sanli: ['#d24a4a', '#ffc0b0', '#7a1a28', '#ffd04d'],
  };
  for (const [t, [m, l, d, x]] of Object.entries(LEG_COL)) {
    ICONS[`kilic_${t}`] = [SWORD, { W: l, B: m, G: x, h: '#5a3e26', P: d }];
    ICONS[`yay_${t}`] = [BOW, { W: l, B: d, s: x }];
    ICONS[`asa_${t}`] = [STAFF, { W: l, B: m, P: d, h: x }];
  }
}

// 1.0 Yildiz Cekirdegi malzemeleri
Object.assign(ICONS, {
  yildiz_parcasi: like('kristal', { c: '#e8c850', C: '#fff0a0', v: '#ffffff', d: '#8a6a2a' }),
  nebula_tuyu: like('parlak_tuy', { y: '#b06ad8', Y: '#f8c8ff', s: '#3a2a6a' }),
  meteor_tasi: like('cekirdek', { s: '#3a3036', S: '#5a4a4e', p: '#e0602a', P: '#ffb040', v: '#fff0a0' }),
  takimyildiz_boynuzu: like('dis', { w: '#3a4a9a', v: '#fff0a0', d: '#c8d8ff' }),
  kadim_kalp: like('cekirdek', { s: '#6a2a50', S: '#a83a7a', p: '#ffd04d', P: '#fff0a0', v: '#ffffff' }),
  kadim_oz: like('kristal_tozu', { c: '#e8c850', C: '#fff8d0', d: '#3a4a9a', D: '#5a6ab8' }),
});
