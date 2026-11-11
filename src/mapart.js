// 1.0.7 Kesif yol haritasi: yukaridan ~50 derece bakilan ada, 7 biyom bir yolla bagli.
// (Ana harita artik Eren'in resmi; bu dosya sadece Kesif haritasini cizer.)
// Hersey oyunun 16x16 bloklarindan: ust yuzler blok dokusundan ornekleniyor, on yuzler
// golgeli. Dio = kucuk bir "diorama": hucre yukseklikleri + ust/yan dokulari + nesneler.
import { Pix, rng, hex, mix, mul, pack, unpack, col } from './pix.js';
import { block, B } from './blocks.js';

const shadeV = (v, f) => { const c = unpack(v); return pack(mul(c.slice(0, 3), f), c[3]); };
const tintV = (v, to, t) => { const c = unpack(v); return pack(mix(c.slice(0, 3), hex(to), t), c[3]); };
const OUT = '#1c1622';

export class Dio {
  constructor(cols, rows, o = {}) {
    this.cols = cols; this.rows = rows;
    this.cw = o.cw || 8; this.cd = o.cd || 5; this.hu = o.hu || 4;
    this.ox = o.ox || 0; this.oy = o.oy || 0;
    this.W = o.W || cols * this.cw; this.H = o.H || rows * this.cd + 40;
    this.cell = [];
    for (let y = 0; y < rows; y++) { const r = []; for (let x = 0; x < cols; x++) r.push(null); this.cell.push(r); }
    this.objs = [];
    this.bg = o.bg || '#5a8ab0';
    this.ground = o.ground || null;
  }
  set(x, y, h, top, side, extra = {}) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return;
    this.cell[y][x] = { h, top, side, ...extra };
  }
  at(x, y) { return x < 0 || y < 0 || x >= this.cols || y >= this.rows ? null : this.cell[y][x]; }
  hAt(x, y) { const c = this.at(Math.floor(x), Math.floor(y)); return c ? (c.water ? 0 : c.h) : 0; }
  // hucre (x, y) ustunun ekran noktasi (hucrenin ortasi)
  pos(x, y, h = null) {
    const hh = h == null ? this.hAt(x, y) : h;
    return [Math.round(this.ox + x * this.cw), Math.round(this.oy + y * this.cd - hh * this.hu)];
  }
  // nesne: y satirinin arazisinden hemen sonra cizilir (onundeki arazi onu orter)
  add(x, y, fn) { this.objs.push({ x, y, fn }); }

  render(seed = 1) {
    const { cw, cd, hu } = this;
    const p = new Pix(this.W, this.H);
    const r = rng(seed);
    // deniz
    if (this.ground) { // yakin harita: zemin deniz degil, koyu orman
      for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) p.set(x, y, shadeV(sample(this.ground, x, y), 0.55));
    } else {
      const sea = ['#4a7aa4', '#5486ae', '#5e90b6', '#4472a0'];
      for (let y = 0; y < this.H; y++) for (let x = 0; x < this.W; x++) p.set(x, y, sea[(x * 7 + y * 13 + ((x >> 3) ^ (y >> 2))) % 4 === 0 ? 1 : 0]);
      for (let i = 0; i < this.W * this.H / 90; i++) { const x = Math.floor(r() * this.W), y = Math.floor(r() * this.H); p.rect(x, y, 3, 1, '#7aaed0'); }
    }
    const objs = [...this.objs].sort((a, b) => a.y - b.y);
    let oi = 0;
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const c = this.cell[y][x];
        if (!c) continue;
        this.drawCell(p, x, y, c);
      }
      while (oi < objs.length && objs[oi].y < y + 1) {
        const o = objs[oi++];
        const [sx, sy] = this.pos(o.x, o.y);
        o.fn(p, sx, sy, this);
      }
    }
    while (oi < objs.length) { const o = objs[oi++]; const [sx, sy] = this.pos(o.x, o.y); o.fn(p, sx, sy, this); }
    return p;
  }

  drawCell(p, x, y, c) {
    const { cw, cd, hu } = this;
    const h = c.water ? 0 : c.h;
    const sx = this.ox + x * cw, sy = this.oy + y * cd - h * hu;
    const lo = (dx, dy) => { const n = this.at(x + dx, y + dy); return !n || (n.water ? 0 : n.h) < h; };
    const hi = (dx, dy) => { const n = this.at(x + dx, y + dy); return n && (n.water ? 0 : n.h) > h; };
    if (c.water) {
      const t = block(c.top || 'su');
      for (let j = 0; j < cd; j++) for (let i = 0; i < cw; i++) {
        let v = t.d[((j * 3 + y * 5) % B) * B + ((i * 2 + x * 3) % B)];
        v = tintV(v, c.tint || '#4f8cbc', 0.45);
        // kiyida kopuk
        const n = this.at(x, y - 1);
        if (j === 0 && n && !n.water) v = tintV(v, '#dceef4', 0.6);
        if (hi(-1, 0) && i === 0) v = tintV(v, '#dceef4', 0.4);
        if (((i + x * 3 + j * 5 + y) % 11) === 0) v = tintV(v, '#cfe8f4', 0.5);
        p.set(sx + i, sy + j, v);
      }
      return;
    }
    // on yuz: yukseklik + adanin kalinligi
    const t = block(c.side || c.top);
    const fh = h * hu + (c.base == null ? 5 : c.base);
    for (let j = 0; j < fh; j++) for (let i = 0; i < cw; i++) {
      let v = t.d[((j * 2) % B) * B + ((i * 2 + x * 4) % B)];
      const f = 0.74 - 0.22 * (j / Math.max(1, fh));
      v = shadeV(v, j === 0 ? 0.88 : f);
      if (j === fh - 1) v = shadeV(v, 0.6);
      p.set(sx + i, sy + cd + j, v);
    }
    // ust yuz
    const tt = block(c.top);
    for (let j = 0; j < cd; j++) for (let i = 0; i < cw; i++) {
      let v = tt.d[Math.floor((j * B) / cd) * B + Math.floor((i * B) / cw)];
      if (!(v >>> 24)) v = tt.d[8 * B + 8];
      let f = 1;
      if (hi(0, -1)) f *= 0.82;                    // arkadaki yuksek blok golgesi
      if (hi(-1, 0) && i < 3) f *= 0.88;
      if (lo(0, -1) && j === 0) f *= 1.16;         // arka kenar isikta
      if (lo(-1, 0) && i === 0) f *= 1.08;
      if (lo(1, 0) && i === cw - 1) f *= 0.86;
      if (lo(0, 1) && j === cd - 1) f *= 1.08;     // on kenar parlak
      if (c.tint) v = tintV(v, c.tint, c.tintA || 0.3);
      if ((x + y) % 2) f *= 0.96;                 // hucre hucre hafif fark
      if (c.glow && ((i + j * 3 + x) % 5 === 0)) v = tintV(v, '#ffe080', 0.6);
      p.set(sx + i, sy + j, shadeV(v, f));
    }
    // yan yuz (saga bakan, alcak komsu varsa)
    if (lo(1, 0)) {
      const n = this.at(x + 1, y);
      const nh = n ? (n.water ? 0 : n.h) : -1;
      const drop = (h - Math.max(0, nh)) * hu;
      for (let j = 0; j < drop; j++) p.set(sx + cw, sy + cd + j - 0, shadeV(t.d[((j * 2) % B) * B + 4], 0.5));
    }
  }
}

// ---------------------------------------------------------------- nesneler
function sample(name, u, v) { const t = block(name); return t.d[(v & 15) * B + (u & 15)]; }

// yuvarlak agac tacı: blok dokusundan, sol ust isikli, sag alt golgeli, koyu cizgili
export function tree(p, sx, sy, leaf = 'yaprak', trunk = 'kutuk', s = 1) {
  const R = Math.round(5 * s), th = Math.round(5 * s);
  for (let j = 0; j < th; j++) for (let i = 0; i < 2; i++) p.set(sx + i, sy - j, shadeV(sample(trunk, i * 4 + 4, j * 3), i ? 0.7 : 0.95));
  p.set(sx - 1, sy, OUT); p.set(sx + 2, sy, OUT);
  const cx = sx + 1, cy = sy - th - R + 2;
  const pts = [];
  for (let y = -R - 1; y <= R + 1; y++) for (let x = -R - 1; x <= R + 1; x++) {
    const d = (x * x) / (R * R) + (y * y) / ((R * 0.9) * (R * 0.9));
    if (d <= 1) pts.push([x, y, d]);
  }
  const inside = new Set(pts.map(([x, y]) => `${x},${y}`));
  for (const [x, y] of pts) {
    let v = sample(leaf, x * 2 + 8, y * 2 + 8);
    const l = (-x - y) / (2 * R);
    v = shadeV(v, 0.92 + 0.34 * l);
    if (!inside.has(`${x + 1},${y + 1}`)) v = shadeV(v, 0.7);
    p.set(cx + x, cy + y, v);
  }
  for (const [x, y] of pts) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!inside.has(`${x + dx},${y + dy}`)) p.set(cx + x + dx, cy + y + dy, OUT);
  }
}

// kutu: on yuz w x h, ust yuz w x d (ust yuz tex), sag yan yok (on cephe gorunur)
export function box(p, sx, sy, w, h, d, front, top, o = {}) {
  // sx, sy: on yuzun sol alt kosesi
  const ft = block(front), tp = block(top || front);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    let v = ft.d[((j * (o.fs || 2) + (o.fv || 0)) % B) * B + ((i * (o.fs || 2)) % B)];
    v = shadeV(v, (o.ff || 0.86) - 0.12 * (j / h));
    p.set(sx + i, sy - h + j, v);
  }
  for (let j = 0; j < d; j++) for (let i = 0; i < w; i++) {
    let v = tp.d[(Math.floor((j * B) / d) % B) * B + ((i * 2) % B)];
    v = shadeV(v, j === 0 ? 1.12 : 1.0);
    p.set(sx + i, sy - h - d + j, v);
  }
  // cizgi
  for (let i = -1; i <= w; i++) { p.set(sx + i, sy, OUT); p.set(sx + i, sy - h - d - 1, OUT); }
  for (let j = -h - d - 1; j <= 0; j++) { p.set(sx - 1, sy + j, OUT); p.set(sx + w, sy + j, OUT); }
}

// cati: on yuzde ucgen alin (wall), uzerinde iki egimli cati (kiremit)
export function house(p, sx, sy, w = 14, wall = 'kalas', roof = 'kiremit', o = {}) {
  const h = o.h || 7, d = o.d || 6;
  const ft = block(wall), rt = block(roof);
  // duvar
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.set(sx + i, sy - h + j, shadeV(ft.d[((j * 2) % B) * B + ((i * 2) % B)], 0.95 - 0.15 * (j / h)));
  // kapi + pencere
  const dx = sx + Math.floor(w / 2) - 1;
  p.rect(dx, sy - 5, 3, 5, '#4a3020'); p.rect(dx, sy - 5, 3, 1, '#2e1e14'); p.set(dx + 2, sy - 3, '#d8b860');
  if (w >= 12) { p.rect(sx + 2, sy - 5, 2, 2, '#f0d890'); p.rect(sx + w - 4, sy - 5, 2, 2, '#f0d890'); }
  // cati: on kenar sacak, arkaya dogru yukselir
  const rh = d + Math.ceil(w / 4);
  for (let j = 0; j < rh; j++) {
    const inset = Math.max(0, Math.floor((j - d) * 2));
    for (let i = -1 + inset; i < w + 1 - inset; i++) {
      let v = rt.d[((j * 3) % B) * B + (((i + 1) * 2) % B)];
      const f = j < d ? 0.78 + 0.3 * (j / d) : 1.1;
      p.set(sx + i, sy - h - 1 - j, shadeV(v, f));
    }
  }
  p.rect(sx - 1, sy - h - 1, w + 2, 1, shadeV(col(rt.d[0]), 0.5));
  // baca
  if (o.chimney !== false) { p.rect(sx + w - 4, sy - h - rh - 2, 2, 4, '#7a5a4a'); p.rect(sx + w - 4, sy - h - rh - 3, 2, 1, OUT); p.set(sx + w - 3, sy - h - rh - 5, '#d8d4d0'); p.set(sx + w - 2, sy - h - rh - 7, '#e8e4e0'); }
  // dis cizgi
  const top = sy - h - rh - 1;
  for (let i = -2; i <= w + 1; i++) p.set(sx + i, sy + 1, OUT);
  for (let j = top; j <= sy; j++) { if (j >= sy - h) { p.set(sx - 1, j, OUT); p.set(sx + w, j, OUT); } }
}

export function shadowAt(p, sx, sy, w = 10) {
  for (let i = -Math.floor(w / 2); i < Math.ceil(w / 2); i++) for (const j of [0, 1]) {
    if (j === 1 && Math.abs(i) > w / 2 - 2) continue;
    const v = p.get(sx + i, sy + j); if (v) p.set(sx + i, sy + j, shadeV(v, 0.72));
  }
}

// cadir: ucgen bez, on acik, iki direk
export function tent(p, sx, sy, c = '#c8b48a', c2 = '#a8463e') {
  for (let j = 0; j < 9; j++) {
    const half = Math.floor(j * 0.9) + 1;
    for (let i = -half; i <= half; i++) {
      let v = Math.abs(i) <= Math.floor(j * 0.35) && j > 3 ? '#2a2020' : (i < 0 ? c : shadeV(col(c), 0.8));
      if (j === 8) v = shadeV(col(c), 0.7);
      p.set(sx + i, sy - 9 + j, v);
    }
    p.set(sx - half - 1, sy - 9 + j, OUT); p.set(sx + half + 1, sy - 9 + j, OUT);
  }
  p.rect(sx - 1, sy - 11, 1, 3, '#5a3a24'); p.rect(sx, sy - 12, 3, 2, c2);
}

// tas giris kapisi (zindan): iki sutun, lento, karanlik ic, merdiven ve iki mesale
export function stoneGate(p, sx, sy) {
  const w = 16, h = 13;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) p.set(sx - 8 + i, sy - h + j, shadeV(sample('tas_duvar', i * 2, j * 2), i < 2 ? 1.08 : 0.92));
  for (let j = 0; j < h - 4; j++) for (let i = 0; i < 8; i++) p.set(sx - 4 + i, sy - h + 4 + j, j < 1 ? '#3a3040' : '#0e0a14');
  for (let k = 0; k < 4; k++) p.rect(sx - 3 + k, sy - 2 - k * 2, 6 - k * 2 > 0 ? 6 - k * 2 : 1, 1, shadeV(col('#8a8694'), 1 - k * 0.15));
  p.rect(sx - 10, sy - h - 2, 20, 3, '#6a6474'); p.rect(sx - 10, sy - h - 2, 20, 1, '#8a8694');
  for (let i = -10; i < 10; i++) p.set(sx + i, sy - h - 3, OUT);
  for (let j = -h - 3; j <= 0; j++) { p.set(sx - 11, sy + j, OUT); p.set(sx + 10, sy + j, OUT); }
  for (const tx of [sx - 12, sx + 11]) { p.rect(tx, sy - 9, 1, 6, '#5a3a24'); p.rect(tx - 1, sy - 11, 3, 2, '#ffb040'); p.set(tx, sy - 12, '#fff0a0'); }
}

export function flag(p, sx, sy, c = '#c84a3c') {
  p.rect(sx, sy - 9, 1, 9, '#5a3a24');
  p.rect(sx + 1, sy - 9, 4, 3, c); p.rect(sx + 1, sy - 9, 4, 1, shadeV(col(c), 1.3)); p.set(sx + 5, sy - 8, c);
}

export function sprite(p, name, sx, sy, s = 8) {
  const t = block(name);
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const v = t.d[Math.floor((j * B) / s) * B + Math.floor((i * B) / s)];
    if (v >>> 24) p.set(sx + i - Math.floor(s / 2), sy - s + j, v);
  }
}

// alcak yukseklik gurultusu
function noise(r, cols, rows, k = 4) {
  const g = [];
  const gw = Math.ceil(cols / k) + 2, gh = Math.ceil(rows / k) + 2;
  for (let y = 0; y < gh; y++) { const row = []; for (let x = 0; x < gw; x++) row.push(r()); g.push(row); }
  return (x, y) => {
    const fx = Math.abs(x / k) % (gw - 2), fy = Math.abs(y / k) % (gh - 2), ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const a = g[iy][ix], b = g[iy][ix + 1], c = g[iy + 1][ix], d = g[iy + 1][ix + 1];
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}


// ---------------------------------------------------------------- kesif yol haritasi
export const KMAP = { W: 320, H: 180 };
const BIO = {
  orman: { c: [7, 21], w: 1.5, top: 'cimen_ust', side: 'toprak', h: 2, deco: ['tree:yaprak', 'tree:cam_yaprak', 'tree:yaprak', 'cicek_k'] },
  magara: { c: [16, 21], top: 'magara_zemin', side: 'tas', h: 3, deco: ['tas_yarim', 'mantarlar', 'kristal_m'] },
  col: { c: [27, 25], top: 'kum', side: 'kumtasi', h: 2, deco: ['kaktus', 'kemik', 'kum_yigini'] },
  buz: { c: [34, 15], top: 'kar_ust', side: 'kar', h: 4, deco: ['tree:karli_yaprak', 'buz_sarkit', 'karli_cali'] },
  kor: { c: [24, 12], top: 'kor_kaya', side: 'bazalt', h: 2, deco: ['kor_kristal', 'olu_agac'] },
  golge: { c: [13, 9], w: 0.8, top: 'golge_zemin', side: 'golge_tas', h: 3, deco: ['golge_kristal', 'gece_mantarlari'] },
  cekirdek: { c: [26, 3.6], w: 0.85, top: 'yildiz_zemin', side: 'yildiz_tas', h: 4, deco: ['yildiz_kristal', 'nebula_kristal'] },
};
export const KORDER = ['orman', 'magara', 'col', 'buz', 'kor', 'golge', 'cekirdek'];
// state: { open: Set, done: Set } -> kapali bolgeler sisli, yenilen patronlarda bayrak
export function kesifMap(state = {}) {
  const open = state.open || new Set(KORDER), done = state.done || new Set();
  const cols = 40, rows = 30;
  const d = new Dio(cols, rows, { W: KMAP.W, H: KMAP.H, cw: 8, cd: 5, hu: 3, oy: 22 });
  const r = rng(31);
  const n = noise(r, cols, rows, 4);
  const owner = (x, y) => { let best = null, bd = 1e9; for (const k of KORDER) { const [cx, cy] = BIO[k].c; const dd = Math.hypot(x - cx, (y - cy) * 1.25) / (BIO[k].w || 1) + (n(x, y) - 0.5) * 4; if (dd < bd) { bd = dd; best = k; } } return best; };
  const own = [];
  for (let y = 0; y < rows; y++) {
    own.push([]);
    for (let x = 0; x < cols; x++) {
      const ex = (x - cols / 2 + 0.5) / (cols / 2 - 0.5), ey = (y - rows / 2 + 1) / (rows / 2 - 0.5);
      const e = ex * ex + ey * ey + (n(x * 1.3, y) - 0.5) * 0.4;
      own[y].push(null);
      if (e > 1) continue;
      const k = owner(x, y); own[y][x] = k;
      const b = BIO[k];
      const edge = e > 0.88;
      let h = edge ? 1 : b.h + Math.round((n(y, x) - 0.5) * 2);
      const ex2 = {};
      if (!open.has(k)) { ex2.tint = '#3a3448'; ex2.tintA = 0.55; }
      if (k === 'kor' && !edge && n(x * 2, y * 2) > 0.74) { d.set(x, y, 1, 'lav', 'bazalt', { tint: '#ff9a3a', tintA: 0.35, glow: true, ...ex2 }); continue; }
      d.set(x, y, Math.max(1, h), edge ? (k === 'buz' ? 'kar_ust' : k === 'col' ? 'kum' : 'kum') : b.top, edge ? 'kumtasi' : b.side, ex2);
    }
  }
  // yol: bolge merkezlerini sirayla baglayan cakil yol
  const pts = KORDER.map((k) => BIO[k].c);
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    const steps = Math.ceil(Math.hypot(bx - ax, by - ay) * 2);
    for (let t = 0; t <= steps; t++) {
      const u = t / steps;
      const x = Math.round(ax + (bx - ax) * u + Math.sin(u * Math.PI) * 1.5), y = Math.round(ay + (by - ay) * u);
      for (const xx of [x, x + 1]) {
        const c = d.at(xx, y); if (!c || c.water) continue;
        d.set(xx, y, c.h, 'kaldirim', c.side, { tint: c.tint || '#e0c890', tintA: c.tint ? c.tintA : 0.3, road: true });
      }
    }
  }
  // susler
  for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) {
    const c = d.at(x, y), k = own[y][x];
    if (!c || c.road || c.water || c.top === 'lav' || !k || r() > (k === 'orman' ? 0.35 : 0.16)) continue;
    const [cx, cy] = BIO[k].c; if (Math.hypot(x - cx, y - cy) < 2.2) continue;
    const dk = BIO[k].deco[Math.floor(r() * BIO[k].deco.length)];
    const dim = !open.has(k);
    d.add(x + r() * 0.5, y + 0.6, (p, sx, sy) => {
      if (dk.startsWith('tree:')) { shadowAt(p, sx + 1, sy + 1, 8); tree(p, sx, sy, dk.slice(5), 'kutuk', 0.8); }
      else sprite(p, dk, sx, sy + 1, 7);
      if (dim) for (let j = -16; j < 2; j++) for (let i = -6; i < 8; i++) { const v = p.get(sx + i, sy + j); if (v) p.set(sx + i, sy + j, tintV(v, '#3a3448', 0.5)); }
    });
  }
  const spots = {};
  for (const k of KORDER) {
    const [cx, cy] = BIO[k].c;
    spots[k] = d.pos(cx, cy);
    const isDone = done.has(k), isOpen = open.has(k);
    d.add(cx, cy + 0.2, (p, sx, sy) => {
      // bolge isareti: tas kaide, ustunde bayrak (patron yenildiyse) ya da kilit
      p.rect(sx - 4, sy - 2, 9, 3, '#8a8690'); p.rect(sx - 4, sy - 2, 9, 1, '#b0acb8');
      for (let i = -5; i <= 5; i++) { p.set(sx + i, sy + 1, OUT); p.set(sx + i, sy - 3, OUT); } p.rect(sx - 5, sy - 3, 1, 4, OUT); p.rect(sx + 5, sy - 3, 1, 4, OUT);
      if (isDone) flag(p, sx, sy - 3, '#e0b040');
      else if (isOpen) flag(p, sx, sy - 3, '#c84a3c');
      else { p.rect(sx - 2, sy - 9, 5, 4, '#6a6474'); p.rect(sx - 1, sy - 12, 3, 3, '#6a6474'); p.set(sx, sy - 11, '#2a2232'); p.set(sx, sy - 7, '#2a2232'); }
    });
    if (k !== 'orman') { // bonus patron magarasi (orman haric; onu Eren anlatacak)
      const bx = cx + 2.6, by = cy + 1.4;
      spots['b_' + k] = d.pos(bx, by);
      d.add(bx, by, (p, sx, sy) => {
        for (let j = 0; j < 8; j++) for (let i = 0; i < 10; i++) p.set(sx - 5 + i, sy - 8 + j, shadeV(sample('tas_duvar', i * 2, j * 2), i < 2 ? 1.05 : 0.85));
        for (let j = 0; j < 5; j++) for (let i = 0; i < 4; i++) p.set(sx - 2 + i, sy - 5 + j, isDone ? '#2a1640' : '#0e0a14');
        if (isDone) { p.set(sx - 1, sy - 3, '#c8a0f8'); p.set(sx, sy - 2, '#8a5ac8'); }
        for (let i = -6; i <= 5; i++) { p.set(sx + i, sy - 9, OUT); p.set(sx + i, sy, OUT); } p.rect(sx - 6, sy - 9, 1, 9, OUT); p.rect(sx + 5, sy - 9, 1, 9, OUT);
      });
    }
  }
  const pix = d.render(5);
  pix.each((v, x, y) => { const ex = Math.abs(x / KMAP.W - 0.5) * 2, ey = Math.abs(y / KMAP.H - 0.5) * 2; const k = Math.max(0, Math.max(ex, ey) - 0.82) * 1.6; return k > 0 ? shadeV(v, 1 - k * 0.4) : v; });
  return { canvas: pix.canvas(), spots };
}
