// Kodla cizilen piksel sanat: orman arka planlari, us nesneleri, esya simgeleri.
// Her sey sabit bir tohumla (seed) cizilir, yani ayni kat hep ayni gorunur.
import { GAME_W, GAME_H, GROUND_Y } from './data.js';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
const mul = (c, f) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
const pack = (c, a = 255) => (((a & 255) << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
const unpack = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, n >>> 24];

class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  set(x, y, c) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = typeof c === 'number' ? c : pack(c);
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c) {
    const v = typeof c === 'number' ? c : pack(c);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v);
  }
  // renk tonlarindan rastgele piksellerle dolgu
  noise(x, y, w, h, tones, r, weights) {
    const packed = tones.map((t) => pack(t));
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        let k = r();
        let idx = 0;
        if (weights) { while (idx < weights.length - 1 && k > weights[idx]) { k -= weights[idx]; idx++; } } else idx = Math.floor(k * packed.length);
        this.set(x + i, y + j, packed[idx]);
      }
    }
  }
  map(rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => { if (ch !== '.' && pal[ch]) this.set(ox + x, oy + y, hex(pal[ch])); });
    });
  }
  // saydam kenarlara, komsu rengin koyusundan cerceve
  outline(f = 0.3) {
    const src = this.d.slice();
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] >>> 24) continue;
        let best = null;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
          const n = src[ny * this.w + nx];
          if (!(n >>> 24) || (n >>> 24) < 200) continue;
          const c = mul(unpack(n).slice(0, 3), f);
          if (!best || c[0] + c[1] + c[2] < best[0] + best[1] + best[2]) best = c;
        }
        if (best) this.d[y * this.w + x] = pack(best);
      }
    }
    return this;
  }
  canvas() {
    const cv = document.createElement('canvas');
    cv.width = this.w; cv.height = this.h;
    const ctx = cv.getContext('2d');
    const img = ctx.createImageData(this.w, this.h);
    new Uint32Array(img.data.buffer).set(this.d);
    ctx.putImageData(img, 0, 0);
    return cv;
  }
}

// ------------------------------------------------------------------ orman
function blockTree(p, r, x, groundY, h, cw, cols) {
  const { bark, barkD, leaf, leafL, leafD } = cols;
  const tw = 6 + Math.floor(r() * 3);
  const trunkTop = groundY - h;
  for (let y = trunkTop; y < groundY; y++) {
    for (let i = 0; i < tw; i++) {
      const c = i === 0 ? mul(bark, 1.15) : i >= tw - 2 ? barkD : ((y + i * 3) % 7 === 0 ? barkD : bark);
      p.set(x + i, y, c);
    }
  }
  const ch = Math.round(cw * 0.7);
  const cx = x + tw / 2 - cw / 2;
  const cy = trunkTop - ch + 8;
  const blobs = [[cx, cy, cw, ch], [cx + cw * 0.18, cy - ch * 0.45, cw * 0.64, ch * 0.6]];
  for (const [bx, by, bw, bh] of blobs) {
    for (let j = 0; j < bh; j++) {
      for (let i = 0; i < bw; i++) {
        const edge = (i < 2 || i > bw - 3) && (j < 2 || j > bh - 3);
        if (edge && r() < 0.7) continue;
        let c = leaf;
        const k = r();
        if (j < bh * 0.3 || i < bw * 0.2) c = k < 0.55 ? leafL : leaf;
        else if (j > bh * 0.7 || i > bw * 0.8) c = k < 0.6 ? leafD : leaf;
        else c = k < 0.15 ? leafL : k > 0.85 ? leafD : leaf;
        p.set(bx + i, by + j, c);
      }
    }
  }
}

export function forestBackground(floor, variant = 0, base = false) {
  const W = GAME_W; const H = GAME_H; const G = GROUND_Y;
  const p = new Pix(W, H);
  const r = rng(floor * 7919 + variant * 104729 + (base ? 77 : 0));
  const t = base ? 0 : Math.min(1, (floor - 1) / 9) * 0.85;

  // gokyuzu (bantli + titresimli gecis)
  const top = mix(hex('#6cbcef'), hex('#1c1838'), t);
  const bot = mix(hex('#d6f2ff'), hex('#94506a'), t);
  const bands = 9;
  for (let y = 0; y < G; y++) {
    const k = Math.min(1, y / (G - 30)) * bands;
    const b = Math.floor(k);
    const frac = k - b;
    const c1 = pack(mix(top, bot, b / bands));
    const c2 = pack(mix(top, bot, Math.min(1, (b + 1) / bands)));
    for (let x = 0; x < W; x++) {
      const use2 = (frac > 0.66 && (x + y) % 2 === 0) || (frac > 0.86);
      p.set(x, y, use2 ? c2 : c1);
    }
  }
  // gunes / ay
  const sx = 40 + Math.floor(r() * 300);
  if (t < 0.45) {
    p.rect(sx, 18, 14, 14, mix(hex('#fff2a0'), bot, t)); p.rect(sx + 2, 20, 10, 10, hex('#fff9d8'));
  } else {
    p.rect(sx, 16, 12, 12, hex('#e8e4f0')); p.rect(sx + 2, 18, 3, 3, hex('#c8c4d8')); p.rect(sx + 7, 22, 2, 2, hex('#c8c4d8'));
    for (let i = 0; i < 40; i++) p.set(r() * W, r() * 90, mix(hex('#ffffff'), top, r() * 0.5));
  }
  // bulutlar
  const cloud = mix(hex('#ffffff'), top, 0.15 + t * 0.6);
  const cloudD = mix(cloud, top, 0.25);
  for (let i = 0; i < 4; i++) {
    const cx = Math.floor(r() * W); const cy = 12 + Math.floor(r() * 50); const cw = 24 + Math.floor(r() * 30);
    p.rect(cx, cy + 4, cw, 6, cloud); p.rect(cx + 6, cy, cw - 14, 5, cloud); p.rect(cx + 2, cy + 9, cw - 4, 2, cloudD);
  }
  // uzak tepeler
  const hill = mix(hex('#93c6a6'), hex('#34345a'), t);
  const ph1 = r() * 6; const ph2 = r() * 6;
  for (let x = 0; x < W; x++) {
    const h = 34 + 12 * Math.sin(x * 0.018 + ph1) + 8 * Math.sin(x * 0.047 + ph2);
    const yTop = Math.round((G - 30 - h) / 2) * 2;
    for (let y = yTop; y < G; y++) p.set(x, y, y < yTop + 2 ? mul(hill, 1.08) : hill);
  }
  // uzak orman (yuvarlak tepeli agac kumeleri)
  const far = mix(hex('#5c9f74'), hex('#262c4c'), t);
  const farL = mix(far, hex('#bfe8b0'), 0.22 * (1 - t) + 0.05);
  const farD = mix(far, hex('#10141e'), 0.18);
  const prof = new Array(W).fill(G);
  for (let x = -12; x < W + 12; x += 7 + Math.floor(r() * 9)) {
    const rad = 7 + r() * 9;
    const cy = G - 30 - r() * 26;
    for (let i = -Math.ceil(rad); i <= Math.ceil(rad); i++) {
      const xx = x + i;
      if (xx < 0 || xx >= W || Math.abs(i) > rad) continue;
      const top = Math.round((cy - Math.sqrt(rad * rad - i * i)) / 2) * 2;
      prof[xx] = Math.min(prof[xx], top);
    }
  }
  for (let x = 0; x < W; x++) {
    for (let y = prof[x]; y < G; y++) {
      const edge = y < prof[x] + 2 || (x > 0 && prof[x - 1] > y) ;
      let c = edge ? farL : far;
      if (!edge && r() < 0.12) c = farD;
      p.set(x, y, c);
    }
  }
  // orta agaclar
  const cols = {
    bark: mix(hex('#7a5232'), hex('#2f2622'), t), barkD: mix(hex('#553820'), hex('#1e1816'), t),
    leaf: mix(hex('#3f8f3a'), hex('#1c3a2e'), t), leafL: mix(hex('#68b84a'), hex('#2c5638'), t), leafD: mix(hex('#2a662a'), hex('#132820'), t),
  };
  const nTrees = base ? 3 : 4 + Math.floor(r() * 3);
  for (let i = 0; i < nTrees; i++) {
    let x = Math.floor(r() * (W + 20)) - 20;
    if (base && x > 60 && x < 300) x = x < 180 ? 10 + Math.floor(r() * 40) : 330 + Math.floor(r() * 40);
    blockTree(p, r, x, G, 40 + Math.floor(r() * 30), 34 + Math.floor(r() * 14), cols);
  }
  // calilar
  const bush = mix(hex('#4f9f3c'), hex('#1f3d2c'), t);
  const bushL = mix(hex('#78c450'), hex('#2e5838'), t);
  for (let x = 0; x < W;) {
    const w = 10 + Math.floor(r() * 18); const h = 4 + Math.floor(r() * 8);
    if (r() < 0.6) {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        if ((i === 0 || i === w - 1) && j === 0) continue;
        p.set(x + i, G - h + j, j < 2 && r() < 0.6 ? bushL : bush);
      }
    }
    x += w + Math.floor(r() * 20);
  }
  // zemin: cim + toprak bloklari
  const grass = mix(hex('#5cb341'), hex('#2d5a34'), t);
  const grassL = mix(hex('#8ad75c'), hex('#3c7640'), t);
  const grassD = mix(hex('#3f8a2e'), hex('#1f4024'), t);
  const dirt = mix(hex('#8b5a2b'), hex('#4a3224'), t * 0.8);
  const dirtL = mix(hex('#a66d36'), hex('#5a3e2c'), t * 0.8);
  const dirtD = mix(hex('#6b431f'), hex('#33221a'), t * 0.8);
  for (let x = 0; x < W; x++) {
    if (r() < 0.35) p.set(x, G - 1, grassL);
    if (r() < 0.08) { p.set(x, G - 2, grass); p.set(x, G - 1, grass); }
  }
  p.noise(0, G, W, 4, [grassL, grass, grassD], r, [0.3, 0.55, 0.15]);
  for (let bx = 0; bx < W; bx += 8) {
    for (let by = G + 4; by < H; by += 8) {
      const f = 0.92 + r() * 0.14;
      const deep = by > G + 18 ? 0.86 : 1;
      p.noise(bx, by, 8, 8, [mul(dirtL, f * deep), mul(dirt, f * deep), mul(dirtD, f * deep)], r, [0.25, 0.55, 0.2]);
    }
  }
  for (let x = 0; x < W; x++) {
    if (r() < 0.5) p.set(x, G + 4, grassD);
    if (r() < 0.2) p.set(x, G + 5, grassD);
  }
  // taslar
  const stone = mix(hex('#9a9a9a'), hex('#4a4a56'), t);
  for (let i = 0; i < 10; i++) {
    const x = Math.floor(r() * W); const y = G + 8 + Math.floor(r() * 26); const w = 3 + Math.floor(r() * 4);
    p.rect(x, y, w, 2, stone); p.rect(x + 1, y - 1, w - 2, 1, mul(stone, 1.2)); p.rect(x, y + 2, w, 1, mul(stone, 0.7));
  }
  // cicekler ve kucuk mantarlar
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(r() * W);
    const kind = r();
    if (kind < 0.4) { p.set(x, G - 1, grassD); p.set(x, G - 2, grassD); p.set(x, G - 3, hex(r() < 0.5 ? '#f05a5a' : '#ffd84a')); }
    else if (kind < 0.55) { p.rect(x, G - 2, 1, 2, hex('#f4e8cc')); p.rect(x - 1, G - 4, 3, 2, mix(hex('#d8433b'), hex('#5a2030'), t)); }
    else { p.set(x, G - 1, grassL); p.set(x + 1, G - 2, grassL); p.set(x + 2, G - 1, grassL); }
  }
  return p.canvas();
}

// ------------------------------------------------------------------ nesneler
export function cabin() {
  const p = new Pix(104, 82);
  const log = hex('#9a6a3a'); const logL = hex('#bf8a4e'); const logD = hex('#6e4422');
  for (let row = 0; row < 8; row++) {
    const y = 34 + row * 6;
    p.rect(8, y, 88, 6, log); p.rect(8, y, 88, 1, logL); p.rect(8, y + 5, 88, 1, logD);
    for (let k = 0; k < 6; k++) p.set(12 + ((row * 23 + k * 17) % 80), y + 2 + (k % 2), logD);
    for (const ex of [4, 94]) {
      p.rect(ex, y, 6, 6, hex('#c89a5a')); p.rect(ex + 1, y + 1, 4, 4, hex('#a8763e')); p.rect(ex + 2, y + 2, 2, 2, hex('#8a5a2a'));
    }
  }
  // kapi
  p.rect(60, 54, 18, 28, hex('#6a3e1e'));
  for (let i = 0; i < 3; i++) p.rect(61 + i * 6, 55, 1, 27, hex('#4e2c14'));
  p.rect(74, 68, 2, 2, hex('#ffd04d'));
  // pencere
  p.rect(20, 46, 20, 16, hex('#4e2c14'));
  p.rect(22, 48, 16, 12, hex('#ffd36a'));
  p.rect(22, 48, 7, 5, hex('#fff0b0'));
  p.rect(29, 48, 2, 12, hex('#4e2c14')); p.rect(22, 53, 16, 2, hex('#4e2c14'));
  // cati (basamakli)
  const roof = hex('#b04a30'); const roofL = hex('#d0644a'); const roofD = hex('#7c2e1e');
  for (let s = 0; s < 8; s++) {
    const y = 4 + s * 4; const w = 26 + s * 11; const x = 52 - w / 2;
    p.rect(x, y, w, 4, roof); p.rect(x, y, w, 1, roofL); p.rect(x, y + 3, w, 1, roofD);
  }
  // baca
  p.rect(74, 2, 9, 18, hex('#8a8a92'));
  for (let y = 2; y < 20; y += 4) p.rect(74 + ((y / 4) % 2) * 4, y, 4, 1, hex('#6a6a72'));
  return p.outline(0.35).canvas();
}

export function mineEntrance() {
  const p = new Pix(80, 60);
  const r = rng(42);
  const st = [hex('#8e8e96'), hex('#76767e'), hex('#a4a4ac'), hex('#62626a')];
  for (let y = 6; y < 60; y++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((60 - y) / 56, 2))) * 38);
    for (let x = 40 - half; x < 40 + half; x++) {
      const k = r();
      p.set(x, y, k < 0.5 ? st[0] : k < 0.75 ? st[1] : k < 0.9 ? st[2] : st[3]);
    }
  }
  // yosun
  for (let x = 6; x < 74; x++) {
    const half = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((x - 40) / 38, 2))) * 54);
    const y = 60 - half;
    for (let j = 0; j < 3 + (x % 3); j++) if (r() < 0.8) p.set(x, y + j, j === 0 ? hex('#86d65a') : hex('#5cb341'));
  }
  // karanlik giris
  for (let y = 22; y < 60; y++) {
    const half = y < 30 ? Math.round(Math.sqrt(1 - Math.pow((30 - y) / 9, 2)) * 13) : 13;
    for (let x = 40 - half; x < 40 + half; x++) p.set(x, y, y > 44 && (x + y) % 6 < 2 ? hex('#1e1824') : hex('#0e0b14'));
  }
  // ahsap maden cercevesi
  const wd = hex('#8a5a2b'); const wdL = hex('#b07a3e');
  p.rect(24, 22, 4, 38, wd); p.rect(24, 22, 1, 38, wdL);
  p.rect(52, 22, 4, 38, wd); p.rect(52, 22, 1, 38, wdL);
  p.rect(20, 18, 40, 5, wd); p.rect(20, 18, 40, 1, wdL);
  // fener
  p.rect(57, 26, 4, 5, hex('#ffd04d')); p.rect(57, 25, 4, 1, hex('#3a3a3a'));
  return p.outline(0.35).canvas();
}

export function signpost() {
  const p = new Pix(30, 34);
  p.rect(13, 10, 4, 24, hex('#8a5a2b')); p.rect(13, 10, 1, 24, hex('#b07a3e'));
  p.rect(2, 3, 24, 10, hex('#b07a3e')); p.rect(2, 3, 24, 1, hex('#d29a5a')); p.rect(2, 12, 24, 1, hex('#7a4a22'));
  p.rect(26, 5, 2, 6, hex('#b07a3e')); p.rect(28, 7, 1, 2, hex('#b07a3e'));
  p.rect(5, 6, 14, 1, hex('#5a3418')); p.rect(5, 9, 10, 1, hex('#5a3418'));
  return p.outline(0.35).canvas();
}

export function chest(open = false) {
  const p = new Pix(20, 20);
  const wood = hex('#a8702e'); const woodL = hex('#c88c44'); const woodD = hex('#74481c');
  const band = hex('#5a3a1a'); const gold = hex('#ffd04d');
  const by = 8;
  p.rect(1, by, 18, 11, wood); p.rect(1, by, 18, 1, woodL); p.rect(1, by + 10, 18, 1, woodD);
  p.rect(1, by + 4, 18, 1, woodD);
  p.rect(1, by, 1, 11, band); p.rect(18, by, 1, 11, band);
  if (!open) {
    p.rect(1, 3, 18, 5, wood); p.rect(1, 3, 18, 1, woodL); p.rect(1, 3, 1, 5, band); p.rect(18, 3, 1, 5, band);
    p.rect(8, 6, 4, 4, gold); p.rect(9, 8, 2, 1, band);
  } else {
    p.rect(2, by - 1, 16, 2, gold); p.rect(4, by - 2, 3, 1, hex('#fff3a0')); p.rect(12, by - 2, 2, 1, hex('#fff3a0'));
    p.rect(1, 0, 18, 4, woodD); p.rect(1, 0, 18, 1, wood);
  }
  return p.outline(0.3).canvas();
}

// 3 kareli kamp atesi (yan yana)
export function campfire() {
  const fw = 26; const fh = 28;
  const p = new Pix(fw * 3, fh);
  const flames = [
    ['....y.......', '...yy...y...', '..yYy..yy...', '..yYYyyYy...', '.yYwYYYYYy..', '.yYwwYwYYy..', '.yYwwwwYYy..', '..yYwwwYy...', '...yyyyy....'],
    ['......y.....', '..y...yy....', '..yy.yYy....', '..yYyyYYy...', '.yYYYwYYy...', '.yYwwwYYYy..', '.yYwwwwYYy..', '..yYwwYYy...', '...yyyyy....'],
    ['...y........', '...yy..y....', '..yYy.yYy...', '.yYYyyYYy...', '.yYwYYwYYy..', '.yYwwwwYYy..', '..YwwwwwYy..', '..yYwwYYy...', '...yyyyy....'],
  ];
  for (let f = 0; f < 3; f++) {
    const ox = f * fw;
    // taslar
    for (let i = 0; i < 6; i++) p.rect(ox + 2 + i * 4, 23 + (i % 2), 3, 3, hex(i % 2 ? '#8a8a92' : '#a2a2aa'));
    // odunlar
    for (let i = 0; i < 16; i++) { p.set(ox + 5 + i, 18 + Math.floor(i / 3), hex('#7a4a22')); p.set(ox + 5 + i, 19 + Math.floor(i / 3), hex('#5a3418')); }
    for (let i = 0; i < 16; i++) { p.set(ox + 20 - i, 18 + Math.floor(i / 3), hex('#8a5a2b')); p.set(ox + 20 - i, 19 + Math.floor(i / 3), hex('#6a3e1e')); }
    p.map(flames[f].map((r) => r.replace(/y/g, 'a')), { a: '#ff7a1e', Y: '#ffb02e', w: '#fff0a0' }, ox + 7, 9);
  }
  return { canvas: p.canvas(), fw, fh };
}

export function spikes() {
  const p = new Pix(46, 16);
  p.rect(0, 12, 46, 4, hex('#6a6a72')); p.rect(0, 12, 46, 1, hex('#8a8a92'));
  for (let i = 0; i < 7; i++) {
    const x = 1 + i * 6;
    for (let j = 0; j < 10; j++) {
      const half = Math.floor(j / 3.4);
      for (let k = -half; k <= half; k++) p.set(x + 2 + k, 2 + j, k < 0 ? hex('#d8dce4') : hex('#9aa0ac'));
    }
    p.set(x + 2, 1, hex('#ffffff'));
  }
  return p.outline(0.3).canvas();
}

// asagi inen tas merdiven (zemine oyulmus)
export function stairsDown() {
  const p = new Pix(56, 38);
  const dark = hex('#0d0a12');
  for (let y = 0; y < 38; y++) {
    const inset = Math.max(0, 6 - y) * 0;
    for (let x = 4 + inset; x < 52 - inset; x++) p.set(x, y, dark);
  }
  const stone = hex('#9a9aa2'); const stoneD = hex('#6a6a72'); const stoneL = hex('#bcbcc4');
  for (let s = 0; s < 6; s++) {
    const x = 6 + s * 7; const y = 2 + s * 6;
    const fade = 1 - s * 0.13;
    p.rect(x, y, 46 - s * 7, 2, mul(stoneL, fade)); p.rect(x, y + 2, 46 - s * 7, 4, mul(stone, fade)); p.rect(x, y + 5, 46 - s * 7, 1, mul(stoneD, fade));
  }
  for (let y = 0; y < 38; y++) { p.set(3, y, stoneD); p.set(2, y, stone); p.set(52, y, stoneD); p.set(53, y, stone); }
  p.rect(0, 0, 56, 2, hex('#5cb341')); p.rect(0, 0, 56, 1, hex('#86d65a'));
  return p.canvas();
}

export function slash() {
  const p = new Pix(28, 28);
  for (let a = -1.1; a < 1.1; a += 0.02) {
    for (let rr = 9; rr < 13; rr++) {
      const thick = 1 - Math.abs(a) / 1.1;
      if (rr - 9 > thick * 4) continue;
      p.set(14 + Math.cos(a) * rr, 14 + Math.sin(a) * rr, rr > 11 ? hex('#ffffff') : hex('#cfe8ff'));
    }
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

// ------------------------------------------------------------------ simgeler
const ICONS = {
  dal: [['............', '.........gG.', '........gGg.', '.......bb...', '......bBb...', '.....bBb....', '....bBb.....', '...bBb......', '..bBb.......', '.bBb........', '.bb.........', '............'],
    { b: '#8a5a2b', B: '#b07a3e', g: '#4f9f38', G: '#7cd35a' }],
  mantar: [['............', '....rrrr....', '..rrRwrrrr..', '.rrwRRRrwrr.', '.rRRRrRRRRr.', '.dddddddddd.', '....ssss....', '....sSss....', '....ssss....', '....sSss....', '...ssssss...', '............'],
    { r: '#d8433b', R: '#f0665a', w: '#fff6e6', d: '#8a2423', s: '#f4e8cc', S: '#dccaa2' }],
  diken: [['............', '..........w.', '.........wg.', '........wgg.', '.......wgg..', '......dgg...', '.....dgg....', '....dgg.....', '...dgg......', '..ddg.......', '..dd........', '............'],
    { w: '#e8f5c8', g: '#9cc45a', d: '#5a7a2c' }],
  yaprak: [['............', '......LLL...', '....LLvLLL..', '...LvLLLLLN.', '..LvLLLNLNN.', '..LvLLNNNNN.', '.LvLLNNNNND.', '.vLLNNNNDD..', '.vLNNNDDD...', 'vvNNDDD.....', 'v...........', '............'],
    { L: '#6cc24a', v: '#c8f09a', N: '#4f9f38', D: '#3a7a2c' }],
  yosun: [['............', '............', '....mMMm....', '..mMMmmMMm..', '.mMmmymmMmm.', '.MmmmmMmmyM.', 'mmMyMmmmMmmm', 'dmmmmMmmmmmd', 'ddmmdmmdmmdd', '.dddddddddd.', '............', '............'],
    { m: '#5f9a3a', M: '#86c255', y: '#c9e05a', d: '#3e6a2a' }],
  kalp: [['............', '..AA....AA..', '.AaaA..AaaA.', 'AaGaaAAaaaaA', 'AaGaaggaaaaA', 'AaaagGGgaabA', '.Aaaagga.bA.', '..AaaaaabA..', '...AaaabA...', '....AabA....', '.....AA.....', '............'],
    { A: '#6b3a1a', a: '#a8642e', G: '#c8ffa0', g: '#62d862', b: '#7a4520' }],
  iksir: [['............', '.....cc.....', '.....kk.....', '....gkkg....', '...g....g...', '..gRRRRRRg..', '..gRwRRRRg..', '..gRwRRRrg..', '..gRRRRrrg..', '...grrrrg...', '....gggg....', '............'],
    { c: '#c49a6c', k: '#d8e8f0', g: '#9fc8dc', R: '#e8433b', r: '#b02a26', w: '#ffd0c8' }],
  kilic_pas: [null, { W: '#c8a088', B: '#8a5a44', G: '#6a4a3a', h: '#5a3a22', P: '#8a6a4a' }],
  kilic_tahta: [null, { W: '#e0b070', B: '#a8743a', G: '#7a4a22', h: '#6a3a1a', P: '#a8743a' }],
  kilic_diken: [null, { W: '#d4f4a8', B: '#5a9a3a', G: '#9cc45a', h: '#4a3a22', P: '#7cd35a' }],
  kask_yosun: [['............', '............', '...mmmmmm...', '..mMMMMMMm..', '.mMMyMMMMMm.', '.mMMMMMMMMm.', '.mmmmmmmmmm.', '.mm......mm.', '.mm......mm.', '.dd......dd.', '............', '............'],
    { m: '#5f9a3a', M: '#86c255', y: '#c9e05a', d: '#3e6a2a' }],
  gogus_yosun: [null, { m: '#5f9a3a', M: '#86c255', y: '#c9e05a', d: '#3e6a2a' }],
  gogus_kabuk: [null, { m: '#7a4a22', M: '#a8702e', y: '#d29a5a', d: '#5a3418' }],
  bot_yosun: [['............', '............', '............', '..mm....mm..', '..mM....mM..', '..mM....mM..', '..mM....mM..', '..mMm...mMm.', '.mMMMm.mMMMm', '.ddddd.ddddd', '............', '............'],
    { m: '#5f9a3a', M: '#86c255', d: '#3e6a2a' }],
  tilsim_yaprak: [['............', '..s......s..', '...s....s...', '....s..s....', '.....ss.....', '.....oo.....', '....oLLo....', '...oLvLLo...', '...oLLvLo...', '....oLLo....', '.....oo.....', '............'],
    { s: '#d8c890', o: '#c89a3a', L: '#6cc24a', v: '#c8f09a' }],
  para: [['............', '....oooo....', '...oYYYYo...', '..oYyYYYYo..', '..oYYBBYYo..', '..oYYBYBYo..', '..oYYBBYYo..', '..oYYBYBYo..', '...oYBBYo...', '....oooo....', '............', '............'],
    { o: '#c8901a', Y: '#ffd04d', y: '#fff3a0', B: '#b07a1a' }],
};
const SWORD = ['............', '...........W', '..........WB', '.........WB.', '........WB..', '.......WB...', '..G...WB....', '...G.WB.....', '....G.......', '...h.G......', '..h...G.....', '.P..........'];
const CHESTPLATE = ['............', '.mmm....mmm.', '.mMMmmmmMMm.', '.mMMMMMMMMm.', '..mMMyMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mmmmmmmm..', '..dddddddd..', '............', '............'];

const iconCache = {};
export function iconUrl(name) {
  if (iconCache[name]) return iconCache[name];
  const def = ICONS[name] || ICONS.dal;
  let rows = def[0];
  if (!rows) rows = name.startsWith('kilic') ? SWORD : CHESTPLATE;
  const p = new Pix(14, 14);
  p.map(rows, def[1], 1, 1);
  p.outline(0.3);
  iconCache[name] = p.canvas().toDataURL();
  return iconCache[name];
}
