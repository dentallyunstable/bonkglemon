// Bonkglemon blok dokulari (Eren, 2026-11-07): oyundaki her sey 16x16 bloklardan kurulur.
//
// Kurallar:
// - Her blok 16x16 piksel. 1 doku pikseli = 1 oyun pikseli (karakterin pikselleriyle ayni boy),
//   boylece karakter 2 blok boyunda durur (Minecraft oranina yakin).
// - Her dokuda 4-6 ton, soluk / dogal renkler. Asiri parlak ya da tek ton renk yok.
// - Dokular sabit: ayni blok her yerde birebir ayni gorunur (sabit tohumla cizilir).
// - Dolu bloklarin ust satiri biraz acik, alt satiri biraz koyu: yan yana dizilince
//   yapilarin "blok blok" kuruldugu gorulur.
import { rng, Pix, hex, mix, mul, pack, unpack, col } from './pix.js';

export const B = 16;

const T = (base) => { const t = new Pix(B, B); if (base) t.rect(0, 0, B, B, base); return t; };

function blobs(t, r, tones, n, rmin = 1, rmax = 2) {
  for (let i = 0; i < n; i++) {
    const cx = Math.floor(r() * B); const cy = Math.floor(r() * B);
    const w = rmin + Math.floor(r() * (rmax - rmin + 1)); const h = rmin + Math.floor(r() * (rmax - rmin + 1));
    const c = tones[Math.floor(r() * tones.length)];
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) t.set((cx + k) % B, (cy + j) % B, c);
  }
  return t;
}
function speckle(t, r, tones, n) {
  for (let i = 0; i < n; i++) t.set(Math.floor(r() * B), Math.floor(r() * B), tones[Math.floor(r() * tones.length)]);
  return t;
}
// dolu bloklarin kenar golgesi
function bevel(t, up = 1.06, down = 0.86) { // 0.8.9: blok sinirlari daha yumusak
  for (let x = 0; x < B; x++) {
    const a = t.get(x, 0); if (a >>> 24) t.set(x, 0, pack(mul(unpack(a).slice(0, 3), up)));
    const b = t.get(x, B - 1); if (b >>> 24) t.set(x, B - 1, pack(mul(unpack(b).slice(0, 3), down)));
  }
  for (let y = 1; y < B - 1; y++) {
    const c = t.get(B - 1, y); if (c >>> 24) t.set(B - 1, y, pack(mul(unpack(c).slice(0, 3), 0.9)));
  }
  return t;
}


// Yumusatma (Eren, 2026-11-07: "dokulari yumusat"): her piksel komsularinin ortalamasina
// ve dokunun ortalama tonuna biraz yaklasir. Kumlu/karincali gorunum azalir, ton cesidi kalir.
function soften(t, blur = 0.45, flat = 0.25) {
  const src = Uint32Array.from(t.d);
  let sr = 0, sg = 0, sb = 0, n = 0;
  for (const v of src) { if (!(v >>> 24)) continue; const c = unpack(v); sr += c[0]; sg += c[1]; sb += c[2]; n++; }
  if (!n) return t;
  const avg = [sr / n, sg / n, sb / n];
  const at = (x, y) => src[((y + B) % B) * B + ((x + B) % B)];
  for (let y = 0; y < B; y++) {
    for (let x = 0; x < B; x++) {
      const v = at(x, y);
      if (!(v >>> 24)) continue;
      const c = unpack(v);
      const nb = [at(x - 1, y), at(x + 1, y), at(x, y - 1), at(x, y + 1)].map(unpack);
      const out = [0, 1, 2].map((i) => {
        const m = (nb[0][i] + nb[1][i] + nb[2][i] + nb[3][i]) / 4;
        const b = c[i] + (m - c[i]) * blur;
        return Math.round(b + (avg[i] - b) * flat);
      });
      t.d[y * B + x] = pack(out, c[3]);
    }
  }
  return t;
}

// ------------------------------------------------------------- dogal bloklar
const DIRT = ['#7a5638', '#6a4a30', '#86603e', '#5c4029', '#94704c'];
const STONE = ['#7f7d82', '#706e74', '#8c8a8f', '#626066', '#9a989c'];
const GRASS = ['#5e8f3e', '#6f9e48', '#507d36', '#7aa852', '#46702f'];
const WOOD = ['#9c7444', '#8e683c', '#a87e4c', '#6e4e2a'];
const BARK = ['#6e5034', '#5e442c', '#7c5c3c', '#523a26', '#4a3422', '#86664a'];
const LEAF = ['#4e7e36', '#5e8f3e', '#43702e', '#6a9a46', '#3a6428'];

function dirt(seed = 1) {
  const r = rng(seed); const t = T(DIRT[0]);
  blobs(t, r, DIRT.slice(1, 4), 22, 1, 3); speckle(t, r, [DIRT[4]], 4);
  return soften(t);
}
function grassSide() {
  const r = rng(2); const t = dirt(3);
  for (let x = 0; x < B; x++) {
    const h = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.25 ? 1 : 0);
    for (let y = 0; y < h; y++) t.set(x, y, GRASS[Math.floor(r() * 4)]);
    t.set(x, h, r() < 0.6 ? GRASS[4] : DIRT[3]);
  }
  for (let x = 0; x < B; x++) t.set(x, 0, x % 3 ? GRASS[3] : GRASS[1]);
  return t;
}
function grassTop() {
  const r = rng(4); const t = T(GRASS[0]);
  return soften(blobs(t, r, GRASS.slice(1), 26, 1, 3), 0.5, 0.3);
}
function stone(seed = 5) {
  const r = rng(seed); const t = T(STONE[0]);
  blobs(t, r, STONE.slice(1, 4), 20, 1, 3); speckle(t, r, [STONE[4], STONE[3]], 6);
  return soften(t, 0.4, 0.2);
}
function ore(seed, tones) {
  const r = rng(seed); const t = stone(seed + 100);
  const shapes = [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2]];
  for (const [cx, cy] of [[2, 2], [10, 3], [4, 10], [11, 11]]) {
    for (const [dx, dy] of shapes) if (r() < 0.8) t.set(cx + dx, cy + dy, tones[(dx + dy) % tones.length]);
    t.set(cx, cy, tones[tones.length - 1]);
  }
  return t;
}
function sand() {
  const r = rng(7); const t = T('#c4ad7c');
  blobs(t, r, ['#b8a070', '#d0bb8a', '#ab9364'], 22, 1, 3); speckle(t, r, ['#9c8458'], 3);
  return soften(t, 0.55, 0.3);
}
function planks(tones = WOOD) {
  const r = rng(8); const t = T(tones[0]);
  for (let row = 0; row < 4; row++) {
    const y0 = row * 4;
    for (let y = y0; y < y0 + 3; y++) for (let x = 0; x < B; x++) t.set(x, y, r() < 0.25 ? tones[1 + ((x + y) % 2)] : tones[row % 2]);
    t.rect(0, y0 + 3, B, 1, tones[3]);
    t.rect((row * 7 + 3) % B, y0, 1, 3, tones[3]);
    t.set((row * 5 + 9) % B, y0 + 1, tones[3]);
  }
  return t;
}
function log() {
  const r = rng(9); const t = T(BARK[0]);
  for (let x = 0; x < B; x++) {
    const c = BARK[[0, 1, 2, 0, 3, 2, 0, 1][x % 8]];
    for (let y = 0; y < B; y++) t.set(x, y, c);
  }
  for (let i = 0; i < 9; i++) { const x = Math.floor(r() * B); const y = Math.floor(r() * 13); t.rect(x, y, 1, 2 + Math.floor(r() * 3), BARK[4]); }
  speckle(t, r, [BARK[5]], 6);
  return t;
}
function leaves() {
  const r = rng(10); const t = T(LEAF[0]);
  blobs(t, r, LEAF.slice(1), 34, 1, 3);
  speckle(t, r, ['#7aa852'], 4);
  return soften(t, 0.35, 0.15);
}
function roof() {
  const r = rng(11); const t = T('#8e4a3c');
  const tones = ['#8e4a3c', '#7e4034', '#9c5646'];
  for (let row = 0; row < 4; row++) {
    const y0 = row * 4;
    for (let y = y0; y < y0 + 3; y++) for (let x = 0; x < B; x++) t.set(x, y, tones[(Math.floor(x / 4) + row) % 3]);
    t.rect(0, y0 + 3, B, 1, '#5e2e26');
    for (let x = (row % 2) * 4; x < B; x += 8) t.rect(x, y0, 1, 3, '#5e2e26');
  }
  speckle(t, r, ['#a8604e'], 4);
  return t;
}
// cati merdiveni: 'sol' egimin solunda (sag ust ceyrek dolu), 'sag' tersi
function roofStair(side) {
  const t = roof();
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) t.set(side === 'sol' ? x : 8 + x, y, 0);
  return t;
}
function cobble() {
  const r = rng(12); const t = T('#4e4c52');
  const stones = [[0, 0, 6, 5], [6, 0, 5, 4], [11, 0, 5, 6], [0, 5, 4, 6], [4, 5, 7, 5], [11, 6, 5, 5], [0, 11, 7, 5], [7, 10, 5, 6], [12, 11, 4, 5]];
  for (const [x, y, w, h] of stones) {
    const c = [STONE[0], STONE[1], STONE[2], STONE[3]][Math.floor(r() * 4)];
    t.rect(x + 1, y + 1, w - 1, h - 1, c);
    t.rect(x + 1, y + 1, w - 2, 1, STONE[4]);
    t.set(x + w - 1, y + h - 1, STONE[3]);
  }
  return t;
}
function brick() {
  const t = T('#78767c');
  const r = rng(15);
  for (let row = 0; row < 4; row++) {
    const y0 = row * 4;
    for (let x = 0; x < B; x++) t.set(x, y0, '#88868c');
    t.rect(0, y0 + 3, B, 1, '#504e54');
    for (let x = (row % 2) * 4; x < B + 8; x += 8) t.rect(x % B, y0, 1, 3, '#504e54');
  }
  speckle(t, r, ['#6a686e', '#8e8c92'], 10);
  return t;
}
function glass() {
  const t = T('#8eb4c0');
  t.rect(1, 1, 14, 14, '#a4c6d0'); t.rect(1, 9, 14, 6, '#98bcc8');
  for (const [x, y, w, h] of [[0, 0, B, 1], [0, 15, B, 1], [0, 0, 1, B], [15, 0, 1, B], [7, 1, 2, 14], [1, 7, 14, 2]]) t.rect(x, y, w, h, BARK[1]);
  for (let i = 0; i < 3; i++) { t.set(3 + i, 5 - i, '#d4e6ea'); t.set(11 + i, 13 - i, '#d4e6ea'); }
  return t;
}
function door(top) {
  const t = planks(['#8a6038', '#7e5632', '#966a40', '#5e4024']);
  t.rect(0, 0, 1, B, '#4e3620'); t.rect(15, 0, 1, B, '#4e3620');
  if (top) { t.rect(3, 4, 4, 5, '#2e2418'); t.rect(9, 4, 4, 5, '#2e2418'); t.rect(3, 4, 4, 1, '#3e3020'); t.rect(9, 4, 4, 1, '#3e3020'); t.rect(0, 0, B, 1, '#4e3620'); } else { t.rect(11, 5, 2, 2, '#b8954a'); t.set(11, 5, '#d0b060'); }
  return t;
}
function darkStone() {
  const t = stone(14);
  return t.each((v) => shade(v, 0.5));
}
function dark() {
  const r = rng(13); const t = T('#1e1a22');
  return blobs(t, r, ['#1a161e', '#24202a'], 12, 1, 3);
}
function wool(base, tones) {
  const r = rng(16 + base.length); const t = T(base);
  blobs(t, r, tones, 22); return t;
}
function awning() {
  const t = T(null);
  const g = ['#5a8a46', '#4e7c3c']; const c = ['#d8ccae', '#c8bc9e'];
  for (let x = 0; x < B; x++) {
    const stripe = Math.floor(x / 4) % 2 ? c : g;
    for (let y = 0; y < 12; y++) t.set(x, y, stripe[y % 5 === 4 ? 1 : 0]);
    if (x % 4 === 1 || x % 4 === 2) t.set(x, 12, stripe[1]);
  }
  t.rect(0, 0, B, 1, '#3e6230');
  return t;
}
const shade = (v, f) => { const c = unpack(v); return pack(mul(c.slice(0, 3), f), c[3]); };

// ------------------------------------------------------------- esyalar (saydam zeminli)
function chest(open) {
  const t = T(null);
  const w = ['#9a6c3e', '#8a5e34', '#a87a48']; const band = '#4e3620'; const metal = '#a8a29a';
  t.rect(1, 6, 14, 10, w[0]);
  for (let y = 7; y < 16; y += 3) t.rect(1, y, 14, 1, w[1]);
  t.rect(1, 6, 14, 1, w[2]);
  t.rect(1, 6, 1, 10, band); t.rect(14, 6, 1, 10, band); t.rect(1, 15, 14, 1, band);
  if (!open) {
    t.rect(1, 2, 14, 5, w[2]); t.rect(1, 2, 14, 1, '#b48654'); t.rect(1, 6, 14, 1, band);
    t.rect(1, 2, 1, 5, band); t.rect(14, 2, 1, 5, band);
    t.rect(7, 5, 2, 3, metal); t.set(7, 7, '#7a766e');
  } else {
    t.rect(1, 0, 14, 3, w[1]); t.rect(1, 0, 14, 1, band); t.rect(1, 0, 1, 3, band); t.rect(14, 0, 1, 3, band);
    t.rect(2, 4, 12, 2, '#2a2018'); t.rect(4, 4, 3, 1, '#c8a04a'); t.rect(9, 5, 3, 1, '#b08a3e'); t.set(5, 5, '#e0c070');
  }
  return t;
}
function fire(f) {
  const t = T(null);
  // tas halka + capraz kutukler
  for (let i = 0; i < 4; i++) t.rect(i * 4, 13, 4, 3, i % 2 ? STONE[1] : STONE[2]);
  for (let i = 0; i < 4; i++) t.rect(i * 4, 13, 4, 1, STONE[4]);
  for (let i = 0; i < 10; i++) { t.set(3 + i, 12 - Math.floor(i / 4), BARK[2]); t.set(3 + i, 13 - Math.floor(i / 4), BARK[3]); }
  for (let i = 0; i < 10; i++) { t.set(12 - i, 12 - Math.floor(i / 4), BARK[0]); }
  const flames = [
    ['....o...', '...oo..o', '..oyo.oo', '.oyyooyo', '.oywyyyo', 'oywwwyo.', '.oywwyo.', '..oooo..'],
    ['......o.', '.o...oo.', '.oo.oyo.', 'oyoooyyo', 'oyyywyyo', 'oywwwwyo', '.oywwyo.', '..oooo..'],
    ['..o.....', '..oo.o..', '.oyooyo.', '.oyyyyyo', 'oyywwyyo', 'oywwwyyo', '.oyywyo.', '..oooo..'],
  ][f];
  t.map(flames, { o: '#d0702e', y: '#e09a3c', w: '#f0d080' }, 4, 2);
  return t;
}
function signBoard() {
  const t = T(null);
  t.rect(7, 10, 2, 6, BARK[2]); t.rect(8, 10, 1, 6, BARK[1]);
  t.rect(1, 1, 14, 9, WOOD[0]); t.rect(1, 1, 14, 1, WOOD[2]); t.rect(1, 9, 14, 1, WOOD[3]);
  t.rect(1, 1, 1, 9, WOOD[3]); t.rect(14, 1, 1, 9, WOOD[3]); t.rect(1, 5, 14, 1, WOOD[1]);
  t.rect(3, 3, 7, 1, '#4e3620'); t.rect(3, 7, 9, 1, '#4e3620'); t.rect(11, 3, 2, 1, '#4e3620');
  return t;
}
function post() { const t = T(null); t.rect(7, 0, 2, B, BARK[2]); t.rect(8, 0, 1, B, BARK[1]); t.set(7, 4, BARK[3]); t.set(7, 11, BARK[3]); return t; }
function fence() {
  const t = T(null);
  t.rect(6, 0, 4, B, WOOD[0]); t.rect(9, 0, 1, B, WOOD[3]); t.rect(6, 0, 4, 1, WOOD[2]);
  t.rect(0, 3, 16, 2, WOOD[1]); t.rect(0, 9, 16, 2, WOOD[1]); t.rect(0, 4, 16, 1, WOOD[3]); t.rect(0, 10, 16, 1, WOOD[3]);
  t.rect(6, 0, 4, B, WOOD[0]); t.rect(9, 0, 1, B, WOOD[3]); t.rect(6, 0, 4, 1, WOOD[2]);
  return t;
}
function flower(c1, c2) {
  const t = T(null);
  t.rect(7, 9, 1, 7, GRASS[2]); t.rect(8, 12, 2, 1, GRASS[0]); t.rect(5, 13, 2, 1, GRASS[0]);
  t.rect(6, 6, 3, 3, c1); t.set(7, 5, c1); t.set(5, 7, c1); t.set(9, 7, c1); t.set(7, 7, c2);
  return t;
}
function tallGrass() {
  const t = T(null);
  for (const [x, h] of [[2, 4], [4, 7], [6, 5], [9, 8], [11, 5], [13, 6]]) { t.rect(x, B - h, 1, h, GRASS[1]); t.set(x, B - h, GRASS[3]); t.set(x, B - 1, GRASS[4]); }
  return t;
}
function cloud() {
  const t = T('#e2e6ea');
  t.rect(0, 10, B, 6, '#d2d8de'); t.rect(0, 14, B, 2, '#c4cad2');
  t.rect(0, 0, B, 2, '#eef0f2');
  return t;
}
function sun() {
  const t = T(null);
  t.rect(2, 2, 12, 12, '#e8d488'); t.rect(4, 4, 8, 8, '#f0e0a0'); t.rect(2, 12, 12, 2, '#d8c070'); t.rect(12, 2, 2, 12, '#d8c070');
  return t;
}
function moon() {
  const t = T(null);
  t.rect(3, 3, 10, 10, '#d8d6e2'); t.rect(4, 5, 3, 2, '#b8b6c6'); t.rect(9, 9, 2, 2, '#b8b6c6'); t.rect(10, 4, 2, 1, '#c4c2d0');
  return t;
}
function lantern() {
  const t = T(null);
  t.rect(7, 0, 2, 4, '#3a3840');
  t.rect(4, 4, 8, 2, '#3a3840'); t.rect(4, 14, 8, 2, '#3a3840');
  t.rect(4, 6, 8, 8, '#d8a848'); t.rect(6, 7, 4, 6, '#ecd088'); t.rect(4, 6, 1, 8, '#3a3840'); t.rect(11, 6, 1, 8, '#3a3840');
  return t;
}
function shelf() {
  const t = planks();
  t.each((v) => shade(v, 0.75));
  t.rect(0, 7, B, 2, WOOD[3]); t.rect(0, 15, B, 1, WOOD[3]);
  t.rect(2, 2, 3, 5, '#8eb4c0'); t.rect(2, 1, 3, 1, '#b48654'); t.set(2, 3, '#c4dce2');
  t.rect(7, 3, 3, 4, '#a04a40'); t.rect(7, 2, 3, 1, '#b48654');
  t.rect(11, 2, 3, 5, '#c8a04a'); t.rect(11, 1, 3, 1, '#b48654');
  t.rect(2, 10, 5, 5, '#6e5a8e'); t.rect(2, 10, 5, 1, '#8270a2'); t.rect(8, 11, 6, 4, '#5a7e4a'); t.rect(8, 11, 6, 1, '#6e9a5a');
  return t;
}
function workbench() {
  const t = planks();
  t.rect(0, 0, B, 4, '#b48654'); t.rect(0, 3, B, 1, WOOD[3]); t.rect(0, 0, B, 1, '#c4966a');
  // on yuzde asili aletler: cekic ve testere
  t.rect(2, 6, 1, 7, BARK[3]); t.rect(1, 5, 4, 2, STONE[2]); t.set(4, 6, STONE[3]);
  t.rect(7, 6, 7, 3, STONE[4]); t.rect(7, 8, 7, 1, STONE[1]); for (let x = 7; x < 14; x += 2) t.set(x, 9, STONE[1]); t.rect(13, 5, 2, 4, BARK[2]);
  return t;
}
function furnace(f) {
  const t = cobble();
  t.rect(0, 0, B, 2, STONE[4]); t.rect(0, 1, B, 1, STONE[1]);
  t.rect(4, 7, 8, 7, '#1e1a22'); t.rect(4, 6, 8, 1, STONE[3]); t.rect(3, 7, 1, 7, STONE[3]); t.rect(12, 7, 1, 7, STONE[3]);
  if (f > 0) {
    t.rect(5, 11, 6, 3, '#c0602a'); t.rect(6 + (f % 2), 9, 2, 2, '#d8902e'); t.rect(9 - (f % 2), 10, 2, 1, '#d8902e'); t.rect(7, 12, 2, 2, '#e8c070');
  }
  return t;
}
function cauldron(f) {
  const t = T(null);
  t.rect(1, 4, 14, 2, '#504c58'); t.rect(2, 6, 12, 8, '#3a3642'); t.rect(3, 14, 2, 2, '#3a3642'); t.rect(11, 14, 2, 2, '#3a3642');
  t.rect(3, 7, 2, 4, '#504c58'); t.rect(2, 13, 12, 1, '#2a2630'); t.rect(1, 4, 14, 1, '#625e6a');
  t.rect(2, 5, 12, 1, '#5a8e46'); t.rect(4, 5, 3, 1, '#7aa85a');
  if (f === 0) { t.rect(5, 2, 2, 2, '#6e9e56'); t.set(10, 0, '#6e9e56'); } else { t.rect(9, 2, 2, 2, '#6e9e56'); t.set(5, 0, '#6e9e56'); }
  return t;
}
function bed(part) {
  const t = T(null);
  t.rect(0, 13, B, 3, WOOD[1]); t.rect(0, 15, B, 1, WOOD[3]);
  const red = wool('#8e3a34', ['#7e322e', '#9c4640']);
  for (let y = 7; y < 13; y++) for (let x = 0; x < B; x++) t.set(x, y, red.get(x, y));
  t.rect(0, 7, B, 1, '#a8524a');
  if (part === 'bas') { t.rect(0, 2, 3, 14, WOOD[0]); t.rect(0, 2, 3, 1, WOOD[2]); t.rect(2, 2, 1, 14, WOOD[3]); t.rect(3, 5, 7, 3, '#d8d0c0'); t.rect(3, 5, 7, 1, '#e6e0d2'); t.rect(9, 6, 1, 2, '#c0b8a8'); } else { t.rect(13, 5, 3, 11, WOOD[0]); t.rect(13, 5, 3, 1, WOOD[2]); t.rect(15, 5, 1, 11, WOOD[3]); }
  return t;
}
function spike() {
  const t = T(null);
  t.rect(0, 12, B, 4, STONE[1]); t.rect(0, 12, B, 1, STONE[4]); t.rect(0, 15, B, 1, STONE[3]);
  for (const x of [1, 6, 11]) {
    t.rect(x + 1, 2, 1, 2, '#c8c6cc'); t.rect(x + 1, 4, 2, 4, '#b0aeb4'); t.rect(x, 8, 4, 4, '#a09ea6'); t.rect(x + 2, 4, 1, 8, '#7a787e'); t.rect(x + 3, 8, 1, 4, '#6a686e');
  }
  return t;
}
function rail() {
  const t = T(null);
  for (const x of [1, 9]) { t.rect(x, 13, 6, 3, BARK[2]); t.rect(x, 15, 6, 1, BARK[3]); }
  t.rect(0, 11, B, 2, STONE[2]); t.rect(0, 11, B, 1, STONE[4]);
  return t;
}
function herb() {
  const t = T(null);
  t.rect(7, 6, 1, 10, GRASS[2]);
  for (const [x, y, d] of [[3, 8, 1], [9, 7, -1], [4, 11, 1], [9, 11, -1]]) { t.rect(x, y, 4, 2, GRASS[1]); t.rect(x, y + 1, 4, 1, GRASS[2]); t.set(d > 0 ? x : x + 3, y, GRASS[3]); }
  t.rect(6, 3, 3, 3, '#d8d4c8'); t.set(7, 4, '#d8b848'); t.rect(10, 4, 2, 2, '#c890a8');
  return t;
}
function berryBush() {
  const t = leaves();
  for (let x = 0; x < B; x++) for (let y = 0; y < 3; y++) if ((x < 2 || x > 13) || (y < 1 && (x < 4 || x > 11))) t.set(x, y, 0);
  for (const [x, y] of [[3, 5], [8, 4], [11, 8], [5, 10], [12, 12], [2, 12]]) { t.rect(x, y, 2, 2, '#9a3a52'); t.set(x, y, '#c05a6a'); }
  return t;
}
function branches() {
  const t = T(null);
  t.rect(1, 13, 12, 2, BARK[2]); t.rect(1, 14, 12, 1, BARK[3]); t.rect(3, 11, 11, 2, WOOD[0]); t.rect(3, 12, 11, 1, WOOD[1]);
  t.rect(12, 9, 2, 2, BARK[0]); t.rect(12, 8, 3, 1, GRASS[1]); t.rect(0, 15, 14, 1, BARK[4]);
  return t;
}
// bahce tarlasi: ust kisimda nemli koyu toprak siralari, altta toprak
function farmland() {
  const t = dirt(31);
  t.rect(0, 0, B, 5, '#4e3624');
  for (let x = 0; x < B; x++) { t.set(x, 0, x % 4 < 2 ? '#5c4029' : '#46301f'); if (x % 4 === 1) t.set(x, 2, '#3a2818'); }
  t.rect(0, 5, B, 1, '#3e2a1a');
  return t;
}
// buyume asamalari (saydam, tarlanin ustune konur): filiz, fide
function sprout(stage) {
  const t = T(null);
  if (stage === 0) { t.rect(7, 12, 1, 4, GRASS[2]); t.rect(5, 11, 2, 1, GRASS[1]); t.rect(8, 10, 2, 1, GRASS[3]); }
  else { t.rect(7, 7, 1, 9, GRASS[2]); t.rect(3, 9, 4, 2, GRASS[1]); t.rect(8, 8, 4, 2, GRASS[1]); t.rect(4, 12, 3, 2, GRASS[0]); t.rect(8, 12, 4, 2, GRASS[0]); t.set(3, 9, GRASS[3]); t.set(11, 8, GRASS[3]); }
  return t;
}
function crack(n) {
  const t = T(null); const k = '#141016';
  t.rect(7, 6, 1, 4, k); t.rect(8, 8, 1, 2, k);
  if (n >= 2) { t.rect(5, 4, 2, 1, k); t.set(9, 10, k); t.rect(10, 4, 1, 3, k); t.set(4, 3, k); }
  if (n >= 3) { t.rect(2, 2, 2, 1, k); t.rect(11, 11, 2, 2, k); t.rect(12, 2, 1, 2, k); t.rect(3, 12, 2, 1, k); t.rect(5, 10, 1, 2, k); t.set(13, 7, k); }
  return t;
}

// ------------------------------------------------------------- 0.5 magara ve col
function sandstone() {
  const r = rng(41); const t = T('#cbb284');
  for (const y of [4, 9, 13]) t.rect(0, y, B, 1, '#b0956a');
  blobs(t, r, ['#d6bf92', '#bea676'], 10); speckle(t, r, ['#a88c60'], 6);
  for (const y of [4, 9, 13]) t.rect(0, y, B, 1, '#b0956a');
  return t;
}
function caveFloor() {
  const t = stone(44);
  return t.each((v) => { const c = unpack(v); return pack(mix(mul(c.slice(0, 3), 0.85), hex('#5a4e72'), 0.18)); });
}
function crystal(c1, c2, c3) {
  const t = T(null);
  t.rect(3, 8, 3, 8, c1); t.rect(4, 6, 1, 2, c1); t.rect(4, 9, 1, 6, c3);
  t.rect(7, 3, 3, 13, c1); t.rect(8, 1, 1, 2, c1); t.rect(8, 4, 1, 10, c3); t.rect(9, 5, 1, 11, c2);
  t.rect(11, 9, 3, 7, c1); t.rect(12, 8, 1, 1, c1); t.rect(12, 10, 1, 5, c3); t.rect(13, 10, 1, 6, c2);
  return t;
}
function stalactite() {
  const t = T(null);
  t.rect(0, 0, B, 3, STONE[1]); t.rect(2, 3, 5, 4, STONE[0]); t.rect(3, 7, 3, 4, STONE[0]); t.rect(4, 11, 1, 3, STONE[3]);
  t.rect(9, 3, 4, 3, STONE[0]); t.rect(10, 6, 2, 3, STONE[3]); t.rect(2, 3, 1, 4, STONE[4]); t.rect(9, 3, 1, 3, STONE[4]);
  return t;
}
function shrooms() {
  const t = T(null);
  for (const [x, y, h, c] of [[2, 9, 7, '#8a7ab4'], [8, 6, 10, '#b48ac8'], [11, 11, 5, '#8a7ab4']]) {
    t.rect(x + 1, y + 2, 2, h - 2, '#d8d0c4'); t.rect(x, y, 4, 2, c); t.rect(x - 1, y + 1, 6, 1, c); t.set(x + 1, y, '#e8dcf4');
  }
  return t;
}
function cactus() {
  const t = T(null);
  const g = ['#5e9a5a', '#7ab46a', '#4a7e48'];
  t.rect(6, 1, 4, 15, g[0]); t.rect(7, 1, 1, 15, g[1]); t.rect(9, 1, 1, 15, g[2]);
  t.rect(2, 5, 2, 6, g[0]); t.rect(2, 10, 4, 2, g[0]); t.rect(12, 3, 2, 5, g[0]); t.rect(10, 7, 4, 2, g[0]);
  for (const [x, y] of [[6, 4], [9, 8], [6, 12], [3, 7], [12, 5]]) t.set(x, y, '#e8e0b0');
  return t;
}
function palm() {
  const t = T(null);
  t.rect(7, 6, 2, 10, BARK[2]); t.rect(7, 8, 2, 1, BARK[3]); t.rect(7, 12, 2, 1, BARK[3]);
  const L = ['#6a9a46', '#4e7e36'];
  t.rect(2, 3, 12, 2, L[0]); t.rect(4, 2, 8, 1, L[0]); t.rect(1, 5, 3, 2, L[1]); t.rect(12, 5, 3, 2, L[1]); t.rect(5, 5, 6, 1, L[1]);
  for (const [x, y] of [[5, 6], [8, 6], [10, 7]]) { t.rect(x, y, 2, 2, '#9a5a2e'); t.set(x, y, '#c07a40'); }
  return t;
}
function sandPile() {
  const t = T(null);
  t.rect(3, 11, 10, 5, '#d0bb8a'); t.rect(5, 9, 6, 2, '#d0bb8a'); t.rect(7, 8, 2, 1, '#dcc89a'); t.rect(3, 15, 10, 1, '#ab9364'); t.rect(10, 11, 3, 4, '#b8a070');
  return t;
}
function bones() {
  const t = T(null);
  t.rect(2, 13, 10, 2, '#e4dcc4'); t.rect(1, 12, 2, 4, '#e4dcc4'); t.rect(11, 12, 2, 4, '#e4dcc4'); t.rect(2, 14, 10, 1, '#bfb49a');
  return t;
}

// ------------------------------------------------------------- 0.6 us yenileme: zanaat avlusu ve han
const IRON = ['#9ea2a8', '#c4c8cc', '#74787e', '#54585e'];
// silah askisi (2 blok): tahta cerceveye yaslanmis kilic, yay ve balta
function weaponRack(part) {
  const t = T(null);
  const fr = (y0, y1) => { t.rect(1, y0, 2, y1 - y0, WOOD[1]); t.rect(13, y0, 2, y1 - y0, WOOD[1]); t.rect(1, y0, 2, 1, WOOD[2]); t.rect(13, y0, 2, 1, WOOD[2]); };
  if (part === 'ust') {
    fr(4, 16); t.rect(1, 4, 14, 2, WOOD[0]); t.rect(1, 4, 14, 1, WOOD[2]); t.rect(1, 5, 14, 1, WOOD[3]);
    // kilic (ucu yukarida)
    t.rect(4, 0, 2, 13, IRON[0]); t.rect(4, 0, 1, 13, IRON[1]); t.set(5, 0, IRON[2]); t.rect(3, 13, 4, 1, '#8a6a3a');
    // yay
    for (let y = 1; y < 16; y++) t.set(9 + (y < 4 || y > 12 ? 1 : 0) + (y < 2 || y > 14 ? 1 : 0), y, '#8e5e30');
    t.rect(8, 1, 1, 15, '#e8dcc0');
    // balta sapi + basi
    t.rect(12, 2, 1, 14, BARK[2]); t.rect(10, 2, 3, 4, IRON[2]); t.rect(10, 2, 1, 4, IRON[1]);
  } else {
    fr(0, 13); t.rect(1, 12, 14, 2, WOOD[0]); t.rect(1, 13, 14, 1, WOOD[3]);
    t.rect(4, 0, 2, 2, '#6e4e2a'); t.rect(4, 2, 2, 1, '#c8a04a'); // kilic kabzasi
    t.rect(8, 0, 1, 5, '#e8dcc0'); t.set(9, 0, '#8e5e30'); t.set(9, 1, '#8e5e30');
    t.rect(12, 0, 1, 12, BARK[2]);
    t.rect(0, 14, B, 2, BARK[3]);
  }
  return t;
}
// zirh askisi (2 blok): kask + gogusluk ustte, direk ve ayak altta
function armorStand(part) {
  const t = T(null);
  if (part === 'ust') {
    t.rect(4, 0, 8, 6, IRON[0]); t.rect(4, 0, 8, 1, IRON[1]); t.rect(5, 3, 6, 1, IRON[3]); t.rect(4, 5, 8, 1, IRON[2]);
    t.rect(7, 4, 2, 2, IRON[3]);
    t.rect(1, 7, 14, 4, IRON[0]); t.rect(1, 7, 14, 1, IRON[1]); t.rect(3, 11, 10, 5, IRON[0]);
    t.rect(7, 8, 2, 8, IRON[2]); t.rect(3, 15, 10, 1, IRON[3]); t.rect(1, 10, 2, 1, IRON[2]); t.rect(13, 10, 2, 1, IRON[2]);
    t.rect(10, 12, 2, 2, '#b84a3c');
  } else {
    t.rect(4, 0, 8, 6, IRON[2]); t.rect(4, 0, 8, 1, IRON[0]); t.rect(4, 5, 3, 1, IRON[3]); t.rect(9, 5, 3, 1, IRON[3]);
    t.rect(7, 6, 2, 8, BARK[2]); t.rect(8, 6, 1, 8, BARK[1]);
    t.rect(3, 14, 10, 2, WOOD[1]); t.rect(3, 14, 10, 1, WOOD[2]);
  }
  return t;
}
// ors: kutuk ustunde demir
function anvil() {
  const t = T(null);
  t.rect(3, 9, 10, 7, BARK[0]); t.rect(3, 9, 10, 1, '#a07a50'); t.rect(5, 10, 6, 1, '#8a6a44'); t.rect(3, 15, 10, 1, BARK[3]);
  t.rect(1, 3, 14, 3, '#5a5e66'); t.rect(1, 3, 14, 1, '#80848c'); t.rect(0, 4, 2, 1, '#5a5e66');
  t.rect(5, 6, 6, 2, '#4a4e56'); t.rect(4, 8, 8, 1, '#3e4248');
  t.rect(10, 1, 1, 2, BARK[2]); t.rect(9, 0, 3, 1, '#80848c');
  return t;
}
// yem tezgahi: kucuk tezgah, ustunde sepet bogurtlen ve turta
function feedTable() {
  const t = T(null);
  t.rect(0, 6, B, 3, '#b48654'); t.rect(0, 6, B, 1, '#c4966a'); t.rect(0, 8, B, 1, WOOD[3]);
  t.rect(1, 9, 2, 7, WOOD[1]); t.rect(13, 9, 2, 7, WOOD[1]); t.rect(3, 12, 10, 1, WOOD[3]);
  t.rect(1, 2, 6, 4, '#a07040'); t.rect(1, 2, 6, 1, '#c09060'); t.rect(2, 1, 4, 1, '#8a3a4a'); t.set(3, 0, '#b04a5a'); t.set(5, 1, '#6a2a3a');
  t.rect(9, 3, 6, 3, '#d4a058'); t.rect(9, 3, 6, 1, '#e8bc74'); t.rect(10, 4, 1, 1, '#8a3a4a'); t.rect(12, 4, 1, 1, '#8a3a4a');
  t.rect(4, 13, 4, 3, '#c8b088'); t.rect(4, 13, 4, 1, '#d8c49a');
  return t;
}
// varil
function barrel() {
  const t = T(null);
  t.rect(3, 2, 10, 14, WOOD[0]); t.rect(2, 4, 12, 10, WOOD[0]);
  for (const x of [4, 7, 10]) t.rect(x, 2, 1, 14, WOOD[1]);
  t.rect(2, 5, 12, 1, '#54585e'); t.rect(2, 12, 12, 1, '#54585e'); t.rect(3, 2, 10, 1, WOOD[2]); t.rect(3, 15, 10, 1, WOOD[3]);
  return t;
}
// asili kalkan (duvar susu)
function wallShield() {
  const t = T(null);
  t.rect(3, 2, 10, 8, '#8a4a3a'); t.rect(4, 10, 8, 2, '#8a4a3a'); t.rect(5, 12, 6, 1, '#8a4a3a'); t.rect(6, 13, 4, 1, '#8a4a3a');
  t.rect(3, 2, 10, 1, '#a85e4a'); t.rect(7, 2, 2, 12, '#c8a04a'); t.rect(3, 6, 10, 2, '#c8a04a');
  t.rect(3, 2, 1, 9, '#5e3026'); t.rect(12, 2, 1, 9, '#5e3026');
  return t;
}
// duvardaki harita (2 blok genis): eski kagit, yollar, bolgeler, kirmizi isaret
function wallMap(part) {
  const t = T(null);
  const pa = ['#d8c8a0', '#c8b68c', '#e4d6b2'];
  t.rect(0, 1, B, 13, pa[0]);
  for (let i = 0; i < 18; i++) t.set((i * 7) % B, 2 + ((i * 5) % 11), pa[(i % 2) + 1]);
  t.rect(0, 1, B, 1, '#a89670'); t.rect(0, 13, B, 1, '#a89670');
  if (part === 'sol') {
    t.rect(0, 1, 1, 13, '#a89670');
    t.rect(2, 4, 4, 3, '#6e9a5a'); t.rect(3, 3, 2, 1, '#6e9a5a'); t.rect(2, 9, 3, 2, '#6e9a5a'); // orman
    t.rect(8, 7, 3, 3, '#8a8890'); t.set(9, 6, '#8a8890'); // magara
    for (let x = 4; x < B; x += 2) t.set(x, 11 - Math.floor(x / 5), '#7a4e2e');
    t.set(1, 1, '#b84a3c'); t.set(2, 1, '#8e3a2e');
  } else {
    t.rect(B - 1, 1, 1, 13, '#a89670');
    t.rect(2, 3, 6, 4, '#d8b070'); t.rect(4, 2, 3, 1, '#d8b070'); // col
    t.rect(10, 8, 3, 3, '#5a4e72'); // zindan
    t.set(10, 7, '#b84a3c'); t.set(12, 7, '#b84a3c'); t.set(11, 8, '#b84a3c'); t.set(10, 9, '#b84a3c'); t.set(12, 9, '#b84a3c');
    for (let x = 0; x < 10; x += 2) t.set(x, 9 - Math.floor(x / 4), '#7a4e2e');
    t.set(14, 1, '#b84a3c'); t.set(13, 1, '#8e3a2e');
  }
  return t;
}
// tezgah ustu: bira kupalari ve sise
function mugs() {
  const t = T(null);
  t.rect(1, 9, 4, 6, '#a07040'); t.rect(1, 9, 4, 1, '#ece4d4'); t.rect(1, 8, 4, 1, '#ece4d4'); t.rect(5, 10, 1, 3, '#a07040');
  t.rect(7, 10, 4, 5, '#a07040'); t.rect(7, 9, 4, 1, '#ece4d4'); t.rect(11, 11, 1, 2, '#a07040');
  t.rect(13, 6, 2, 9, '#5a7e4a'); t.rect(13, 5, 2, 1, '#8a6a3a'); t.set(13, 8, '#7aa06a');
  t.rect(0, 15, B, 1, '#6e4e2a');
  return t;
}


// ------------------------------------------------------------- 0.8 buz, kor, golge
const SNOW = ['#e4ebf2', '#d6e0ea', '#eef3f8', '#c8d4e0', '#b8c6d4'];
const BASALT = ['#3e3638', '#342c2e', '#4a4042', '#2a2426', '#564a4a'];
const VOID = ['#382c4a', '#2e2440', '#44385a', '#261e36', '#56467a'];
const tintTo = (t, to, k) => t.each((v) => { const c = unpack(v); return pack(mix(c.slice(0, 3), hex(to), k), c[3]); });
function snowTop() {
  const r = rng(51); const t = T(SNOW[0]);
  blobs(t, r, SNOW.slice(1, 4), 24, 1, 3); speckle(t, r, [SNOW[4]], 3);
  return soften(t, 0.5, 0.3);
}
function frozenDirt(seed = 53) { return tintTo(dirt(seed), '#6a7488', 0.35); }
function snowSide() {
  const r = rng(52); const t = frozenDirt();
  for (let x = 0; x < B; x++) {
    const h = 3 + (r() < 0.5 ? 1 : 0) + (r() < 0.3 ? 1 : 0);
    for (let y = 0; y < h; y++) t.set(x, y, SNOW[Math.floor(r() * 3)]);
    t.set(x, h, SNOW[4]);
  }
  for (let x = 0; x < B; x++) t.set(x, 0, x % 3 ? SNOW[2] : SNOW[0]);
  return t;
}
function ice() {
  const r = rng(54); const t = T('#94bcd8');
  blobs(t, r, ['#a4c8e2', '#86b0d0', '#b2d2ea'], 14, 1, 3);
  soften(t, 0.5, 0.3);
  for (const [x0, y0, n] of [[2, 3, 5], [8, 7, 6], [4, 11, 4]]) for (let i = 0; i < n; i++) t.set(x0 + i, y0 - i, '#dceef8');
  return t;
}
function basalt(seed = 55) {
  const r = rng(seed); const t = T(BASALT[0]);
  blobs(t, r, BASALT.slice(1, 4), 22, 1, 3); speckle(t, r, [BASALT[4]], 5);
  return soften(t, 0.4, 0.2);
}
function emberRock() {
  const r = rng(56); const t = basalt(57);
  let x = 1; let y = 2 + Math.floor(r() * 4);
  for (let i = 0; i < 14; i++) { t.set(x, y, i % 3 ? '#e0602a' : '#ffa040'); x++; if (r() < 0.4) y += r() < 0.5 ? 1 : -1; y = Math.max(1, Math.min(14, y)); }
  for (let i = 0; i < 4; i++) t.set(3 + i * 3, 12 + (i % 2), '#c8461e');
  return t;
}
function lava() {
  const r = rng(58); const t = T('#d8561e');
  blobs(t, r, ['#ec7426', '#f49a34', '#c0441a'], 20, 1, 3); speckle(t, r, ['#ffd070'], 6);
  return soften(t, 0.5, 0.2);
}
// 0.8.5 gol: su (soluk mavi, yatay dalga cizgileri), yuzey (ustte acik dalga), nilufer, saz
function water(seed = 62) {
  const r = rng(seed); const t = T('#5a86a8');
  blobs(t, r, ['#6290b2', '#527c9e', '#6a98b8'], 14, 1, 3);
  soften(t, 0.5, 0.3);
  for (const [x0, y0, n] of [[2, 4, 5], [9, 9, 5], [4, 13, 4]]) t.rect(x0, y0, n, 1, '#86b0cc');
  return t;
}
function waterTop() {
  const t = water(63);
  t.rect(0, 0, B, 2, '#9cc4dc'); t.rect(0, 2, B, 1, '#7aa6c4');
  for (const x of [1, 6, 11]) t.rect(x, 0, 3, 1, '#c4e0ee');
  return t;
}
function lilyPad() {
  const t = T(null);
  t.rect(3, 13, 10, 2, '#6aa45a'); t.rect(4, 12, 8, 1, '#7cb468'); t.rect(4, 15, 8, 1, '#4e7e44');
  t.rect(8, 12, 1, 3, '#4e7e44');
  t.rect(4, 9, 3, 3, '#e8a4b8'); t.rect(5, 8, 1, 1, '#f4c8d4'); t.set(5, 10, '#f8e080');
  return t;
}
function reeds() {
  const t = T(null);
  for (const [x, h, c] of [[3, 12, '#6a8a44'], [6, 15, '#7a9a4e'], [9, 11, '#5e7e3c'], [12, 14, '#6a8a44']]) {
    t.rect(x, B - h, 1, h, c);
    if (h > 12) { t.rect(x, B - h, 1, 3, '#8a6a3a'); t.rect(x - 1, B - h + 1, 1, 2, '#7a5a30'); }
  }
  return t;
}
function moonHerb() {
  const t = T(null);
  t.rect(7, 7, 1, 9, '#5a8a7a');
  for (const [x, y] of [[4, 10], [9, 9], [5, 13], [9, 12]]) { t.rect(x, y, 3, 1, '#6aa08a'); }
  for (const [x, y] of [[6, 2], [3, 5], [10, 4]]) { t.rect(x, y, 3, 3, '#c8d8ff'); t.set(x + 1, y + 1, '#ffffff'); t.set(x + 1, y + 3, '#7a8ac0'); }
  return t;
}
function voidStone(seed = 59) {
  const r = rng(seed); const t = T(VOID[0]);
  blobs(t, r, VOID.slice(1, 4), 22, 1, 3); speckle(t, r, [VOID[4], '#7a5ab0'], 4);
  return soften(t, 0.4, 0.2);
}
function voidFloor() {
  const t = voidStone(60);
  for (const [x, y] of [[3, 4], [11, 9], [6, 13]]) { t.set(x, y, '#8ae8e0'); t.set(x + 1, y, '#5ab8b8'); }
  return t;
}
function snowLeaves() {
  const r = rng(61); const t = tintTo(leaves(), '#2e5040', 0.35);
  for (let x = 0; x < B; x++) { const h = 2 + Math.floor(r() * 3); for (let y = 0; y < h; y++) t.set(x, y, SNOW[Math.floor(r() * 3)]); }
  for (let i = 0; i < 5; i++) t.set(Math.floor(r() * B), 5 + Math.floor(r() * 10), SNOW[2]);
  return t;
}
function snowBerry() {
  const t = snowLeaves();
  for (let x = 0; x < B; x++) for (let y = 0; y < 3; y++) if ((x < 2 || x > 13) || (y < 1 && (x < 4 || x > 11))) t.set(x, y, 0);
  for (const [x, y] of [[3, 6], [8, 5], [11, 9], [5, 11], [12, 12]]) { t.rect(x, y, 2, 2, '#6a9ad0'); t.set(x, y, '#c8e0f8'); }
  return t;
}
function pepperPlant() {
  const t = T(null);
  t.rect(7, 5, 1, 11, '#4e6a2e');
  for (const [x, y] of [[3, 7], [9, 6], [4, 11], [9, 11]]) { t.rect(x, y, 4, 2, '#5e7a36'); t.rect(x, y + 1, 4, 1, '#46602a'); }
  for (const [x, y] of [[4, 9], [10, 8], [6, 13]]) { t.rect(x, y, 2, 3, '#d8401e'); t.set(x, y, '#f07a3a'); t.set(x, y - 1, '#4e6a2e'); }
  return t;
}
function nightShrooms() {
  const t = T(null);
  for (const [x, y, h, c] of [[2, 9, 7, '#3a8a8a'], [8, 6, 10, '#5ac8c0'], [11, 11, 5, '#3a8a8a']]) {
    t.rect(x + 1, y + 2, 2, h - 2, '#8a7aa0'); t.rect(x, y, 4, 2, c); t.rect(x - 1, y + 1, 6, 1, c); t.set(x + 1, y, '#c8fff4');
  }
  return t;
}
function iceSpike() {
  const t = T(null); const c = ['#a4c8e2', '#dceef8', '#7aa4c4'];
  t.rect(0, 0, B, 3, c[0]); t.rect(2, 3, 5, 4, c[0]); t.rect(3, 7, 3, 4, c[0]); t.rect(4, 11, 1, 3, c[2]);
  t.rect(9, 3, 4, 3, c[0]); t.rect(10, 6, 2, 3, c[2]); t.rect(2, 3, 1, 4, c[1]); t.rect(9, 3, 1, 3, c[1]); t.rect(0, 0, B, 1, c[1]);
  return t;
}
function deadTree() {
  const t = T(null); const c = ['#2a2224', '#3a3032', '#1e181a'];
  t.rect(7, 4, 2, 12, c[1]); t.rect(8, 4, 1, 12, c[2]);
  t.rect(3, 6, 4, 1, c[1]); t.rect(3, 4, 1, 2, c[1]); t.rect(9, 8, 4, 1, c[1]); t.rect(12, 5, 1, 3, c[1]); t.rect(6, 1, 1, 3, c[0]); t.rect(7, 3, 1, 1, c[0]);
  return t;
}

const SOLID = {
  toprak: () => dirt(), cimen: grassSide, cimen_ust: grassTop, tas: () => stone(), kum: sand,
  komur: () => ore(20, ['#2e2c32', '#3c3a40', '#24222a', '#4a4850']),
  demir: () => ore(21, ['#b89478', '#a07e64', '#c8a68a', '#d4b49a']),
  define: () => ore(22, ['#c8a048', '#b08a3a', '#d8b860', '#e4c878']),
  kalas: () => planks(), kutuk: log, yaprak: leaves, kiremit: roof,
  kaldirim: cobble, tugla: brick, cam: glass, kapi_ust: () => door(true), kapi_alt: () => door(false),
  tas_duvar: darkStone, karanlik: dark, bulut: cloud, raf: shelf, tezgah: workbench,
  kumtasi: sandstone, magara_zemin: caveFloor,
  kar: snowSide, kar_ust: snowTop, donmus_toprak: () => frozenDirt(62), buz: ice, bazalt: () => basalt(), kor_kaya: emberRock, lav: lava,
  golge_tas: () => voidStone(), golge_zemin: voidFloor, karli_yaprak: snowLeaves,
  altin: () => ore(23, ['#d8b048', '#b88a30', '#ecd070', '#fff0a0']),
  kristal: () => ore(24, ['#7cc0e0', '#a8d8f0', '#5aa0c8', '#e8f8ff']),
  kor: () => ore(25, ['#d8561e', '#ec7a30', '#f8a840', '#ffe080']),
  bonkit: () => ore(26, ['#4ec888', '#36a868', '#80e4a8', '#d0ffe0']),
  golge: () => ore(27, ['#5a3a8a', '#74559e', '#3e2a60', '#c8a0f0']),
  su: () => water(), su_ust: waterTop, renkli_cam: () => tintTo(glass(), '#5ab8a8', 0.4),
  yildiz: () => ore(28, ['#d8dce8', '#b8bccc', '#fff6c0', '#ffffff']),
  cekirdek: () => ore(29, ['#e05aa0', '#b03a7a', '#ffa8d8', '#fff0f8']),
  // 0.9 Gezgin Tuccar bloklari
  ay_tasi: () => tintTo(stone(41), '#b8c4f4', 0.5), altin_tugla: () => tintTo(brick(), '#e8c050', 0.55), pembe_yaprak: () => tintTo(leaves(), '#f0a8c8', 0.55),
  tarla: farmland, firin0: () => furnace(0), firin1: () => furnace(1), firin2: () => furnace(2),
};
const PROPS = {
  kiremit_sol: () => roofStair('sol'), kiremit_sag: () => roofStair('sag'), tente: awning,
  sandik: () => chest(false), sandik_acik: () => chest(true),
  ates0: () => fire(0), ates1: () => fire(1), ates2: () => fire(2),
  tabela: signBoard, direk: post, cit: fence, cicek_k: () => flower('#b05a50', '#d8b848'), cicek_s: () => flower('#c8a848', '#8a5a2e'),
  ot: tallGrass, gunes: sun, ay: moon, fener: lantern, kazan0: () => cauldron(0), kazan1: () => cauldron(1),
  yatak_bas: () => bed('bas'), yatak_ayak: () => bed('ayak'), diken: spike, ray: rail,
  bitki: herb, filiz: () => sprout(0), fide: () => sprout(1), cali: berryBush, dallar: branches, crack1: () => crack(1), crack2: () => crack(2), crack3: () => crack(3),
  kristal_m: () => crystal('#9a6cc8', '#6e4c9a', '#c8a0ec'), kristal_b: () => crystal('#7cb4d8', '#4e84a8', '#c8e6f8'),
  karli_cali: snowBerry, biberlik: pepperPlant, gece_mantarlari: nightShrooms, buz_sarkit: iceSpike, olu_agac: deadTree,
  kor_kristal: () => crystal('#e0602a', '#a83a14', '#ffb040'), golge_kristal: () => crystal('#7a5ab0', '#4a3a6a', '#c8a0f0'),
  sarkit: stalactite, mantarlar: shrooms, kaktus: cactus, hurmalik: palm, kum_yigini: sandPile, kemik: bones,
  silahlik_ust: () => weaponRack('ust'), silahlik_alt: () => weaponRack('alt'), zirh_ust: () => armorStand('ust'), zirh_alt: () => armorStand('alt'),
  nilufer: lilyPad, saz: reeds, ay_otu: moonHerb, mavi_fener: () => tintTo(lantern(), '#90c8ff', 0.4),
  ors: anvil, yem_tezgahi: feedTable, varil: barrel, kalkan: wallShield, harita_sol: () => wallMap('sol'), harita_sag: () => wallMap('sag'), kupalar: mugs,
};
const BEVEL_SKIP = new Set(['bulut', 'cam', 'kapi_ust', 'kapi_alt', 'tas_duvar', 'karanlik', 'cimen_ust', 'kar_ust', 'lav', 'su', 'su_ust']);

const cache = {};
export function block(name) {
  if (cache[name]) return cache[name];
  let t;
  if (SOLID[name]) { t = SOLID[name](); if (!BEVEL_SKIP.has(name)) bevel(t); } else if (PROPS[name]) t = PROPS[name]();
  else throw new Error('blok yok: ' + name);
  cache[name] = t;
  return t;
}
export const BLOCK_NAMES = [...Object.keys(SOLID), ...Object.keys(PROPS)];

// Bloklardan resim kurar. rows: ust satirdan alta dizgi listesi, her karakter bir blok
// (key: blok adi, '.' bos). opts.fn: her piksele renk donusumu, opts.ol: cizgi rengi
export function build(rows, key, opts = {}) {
  const w = Math.max(...rows.map((r) => r.length));
  const p = new Pix(w * B + 2, rows.length * B + 2);
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '.' || !key[ch]) return;
    p.draw(block(key[ch]), 1 + i * B, 1 + j * B, B, opts.fn || null);
  }));
  if (opts.ol !== false) p.outline(opts.ol || 'dark', 0.42); // 0.8.9: yumusak cizgi
  return p;
}
export { shade };
export const fogTo = (to, t) => (v) => { const c = unpack(v); return pack(mix(c.slice(0, 3), hex(to), t), c[3]); };
export { col };
