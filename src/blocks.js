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
function bevel(t, up = 1.08, down = 0.8) {
  for (let x = 0; x < B; x++) {
    const a = t.get(x, 0); if (a >>> 24) t.set(x, 0, pack(mul(unpack(a).slice(0, 3), up)));
    const b = t.get(x, B - 1); if (b >>> 24) t.set(x, B - 1, pack(mul(unpack(b).slice(0, 3), down)));
  }
  for (let y = 1; y < B - 1; y++) {
    const c = t.get(B - 1, y); if (c >>> 24) t.set(B - 1, y, pack(mul(unpack(c).slice(0, 3), 0.9)));
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
  blobs(t, r, DIRT.slice(1, 4), 26); speckle(t, r, [DIRT[4]], 6);
  return t;
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
  return blobs(t, r, GRASS.slice(1), 30);
}
function stone(seed = 5) {
  const r = rng(seed); const t = T(STONE[0]);
  blobs(t, r, STONE.slice(1, 4), 20, 1, 3); speckle(t, r, [STONE[4], STONE[3]], 10);
  return t;
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
  blobs(t, r, ['#b8a070', '#d0bb8a', '#ab9364'], 24); speckle(t, r, ['#9c8458'], 6);
  return t;
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
  blobs(t, r, LEAF.slice(1), 40);
  speckle(t, r, ['#7aa852'], 5);
  return t;
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
function crack(n) {
  const t = T(null); const k = '#141016';
  t.rect(7, 6, 1, 4, k); t.rect(8, 8, 1, 2, k);
  if (n >= 2) { t.rect(5, 4, 2, 1, k); t.set(9, 10, k); t.rect(10, 4, 1, 3, k); t.set(4, 3, k); }
  if (n >= 3) { t.rect(2, 2, 2, 1, k); t.rect(11, 11, 2, 2, k); t.rect(12, 2, 1, 2, k); t.rect(3, 12, 2, 1, k); t.rect(5, 10, 1, 2, k); t.set(13, 7, k); }
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
  firin0: () => furnace(0), firin1: () => furnace(1), firin2: () => furnace(2),
};
const PROPS = {
  kiremit_sol: () => roofStair('sol'), kiremit_sag: () => roofStair('sag'), tente: awning,
  sandik: () => chest(false), sandik_acik: () => chest(true),
  ates0: () => fire(0), ates1: () => fire(1), ates2: () => fire(2),
  tabela: signBoard, direk: post, cit: fence, cicek_k: () => flower('#b05a50', '#d8b848'), cicek_s: () => flower('#c8a848', '#8a5a2e'),
  ot: tallGrass, gunes: sun, ay: moon, fener: lantern, kazan0: () => cauldron(0), kazan1: () => cauldron(1),
  yatak_bas: () => bed('bas'), yatak_ayak: () => bed('ayak'), diken: spike, ray: rail,
  bitki: herb, cali: berryBush, dallar: branches, crack1: () => crack(1), crack2: () => crack(2), crack3: () => crack(3),
};
const BEVEL_SKIP = new Set(['bulut', 'cam', 'kapi_ust', 'kapi_alt', 'tas_duvar', 'karanlik', 'cimen_ust']);

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
  if (opts.ol !== false) p.outline(opts.ol || '#16121a');
  return p;
}
export { shade };
export const fogTo = (to, t) => (v) => { const c = unpack(v); return pack(mix(c.slice(0, 3), hex(to), t), c[3]); };
export { col };
