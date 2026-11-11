// 1.1 Yeni harita (Eren, 2026-11-11): Lale'nin haritasi yukaridan ~50 derece aciyla bakilan
// kucuk bir ada. Solda barisci Koy, nehrin ve koprunun otesinde tehlikeli bolgeler.
// Koye dokununca koyun yakin ve detayli hali (Koy Meydani, Ormanlik, Us, Maden) acilir.
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
    const fx = x / k, fy = y / k, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const a = g[iy][ix], b = g[iy][ix + 1], c = g[iy + 1][ix], d = g[iy + 1][ix + 1];
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  };
}

// ---------------------------------------------------------------- dunya haritasi
export const WORLD = { W: 320, H: 180 };
export function worldMap() {
  const cols = 40, rows = 34;
  const d = new Dio(cols, rows, { W: WORLD.W, H: WORLD.H, cw: 8, cd: 5, hu: 3, oy: 14 });
  const r = rng(11);
  const n = noise(r, cols, rows, 5);
  const n2 = noise(r, cols, rows, 3);
  const RIV = (y) => 19 + Math.round(Math.sin(y / 4) * 1.2);
  const spots = {};
  const deco = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const ex = (x - cols / 2 + 0.5) / (cols / 2 - 1), ey = (y - rows / 2) / (rows / 2 - 1.5);
      const e = ex * ex + ey * ey + (n(x, y) - 0.5) * 0.35;
      if (e > 1) continue;
      const rx = RIV(y);
      if (x === rx || x === rx + 1) { d.set(x, y, 0, 'su', 'su', { water: true }); continue; }
      const edge = e > 0.86;
      if (x < rx) {
        // barisci taraf: kiyida kum, icerde basamakli cimen tepeler
        const nn = n2(x, y);
        const h = edge ? 1 : 2 + (nn > 0.58 ? 1 : 0) + (nn > 0.78 ? 1 : 0);
        d.set(x, y, h, edge ? 'kum' : 'cimen_ust', edge ? 'kum' : 'toprak');
        if (!edge && r() < 0.16) deco.push([x + r() * 0.6, y + 0.5, r() < 0.5 ? 'cicek_k' : r() < 0.5 ? 'cicek_s' : 'ot']);
      } else {
        const nn = n(x, y * 1.2), m = n2(x, y);
        let top = 'tas', side = 'tas', h = 2;
        if (y < 12) { const pk = Math.max(0, 1 - Math.abs(y - 5) / 6) * Math.max(0, 1 - Math.abs(x - 29) / 9); h = 3 + Math.round(pk * 6 + m * 2); top = h >= 7 ? 'kar_ust' : h >= 5 ? 'tas' : 'tas'; side = h >= 7 ? 'kar' : 'tas'; }
        else if (y < 22) { h = 2 + Math.round(m * 2); top = x > 29 ? 'golge_zemin' : 'magara_zemin'; side = x > 29 ? 'golge_tas' : 'tas_duvar'; }
        else { h = 2 + Math.round(m * 2); top = x < 27 ? 'kum' : 'kor_kaya'; side = x < 27 ? 'kumtasi' : 'bazalt'; }
        if (edge) h = Math.min(h, 1);
        d.set(x, y, h, top, side);
        if (y >= 24 && x >= 28 && m > 0.62 && !edge) d.set(x, y, 1, 'lav', 'bazalt', { tint: '#ff9a3a', tintA: 0.35, glow: true });
        if (!edge && r() < 0.1) {
          const k = y < 12 ? (h >= 6 ? null : 'tas_yarim') : y < 22 ? (x > 29 ? 'golge_kristal' : 'mantarlar') : x < 27 ? (r() < 0.5 ? 'kaktus' : 'kemik') : 'kor_kristal';
          if (k) deco.push([x + r() * 0.6, y + 0.5, k]);
        }
      }
    }
  }
  // kopru ve yollar
  const by = 17;
  for (const x of [RIV(by), RIV(by) + 1]) d.set(x, by, 2, 'kalas', 'kalas', { base: 3 });
  for (let y = 12; y <= 21; y++) for (let x = 6; x <= 15; x++) if (d.at(x, y) && !d.at(x, y).water) d.set(x, y, 2, (x * 3 + y) % 9 === 0 ? 'cakil' : 'cimen_ust', 'toprak');
  for (let x = 6; x <= 17; x++) d.set(x, 17, 2, 'kaldirim', 'toprak');
  for (let x = RIV(by) + 2; x <= 28; x++) if (d.at(x, by)) d.set(x, by, 2, 'cakil', 'tas');
  for (let y = 11; y <= 16; y++) d.set(24, y, Math.min(d.at(24, y) ? d.at(24, y).h : 2, 3), 'cakil', 'tas');
  for (const [x, y, k] of deco) {
    const c = d.at(Math.floor(x), Math.floor(y));
    if (!c || c.water || c.top === 'kaldirim' || c.top === 'cakil' || c.top === 'kalas' || c.top === 'lav') continue;
    if (x > 5 && x < 16 && y > 11 && y < 22) continue;
    d.add(x, y, (p, sx, sy) => sprite(p, k, sx, sy + 1, k === 'ot' || k.startsWith('cicek') ? 6 : 7));
  }

  const K = (x, y, fn) => d.add(x, y, fn);
  // ------- Koy: evler, kuyu, cit, agaclar
  K(8, 14.6, (p, sx, sy) => { shadowAt(p, sx + 7, sy + 1, 18); house(p, sx, sy, 14, 'kalas', 'kiremit'); });
  K(12.4, 13.6, (p, sx, sy) => { shadowAt(p, sx + 6, sy + 1, 16); house(p, sx, sy, 12, 'tugla', 'kiremit', { h: 6 }); });
  K(7, 20, (p, sx, sy) => { shadowAt(p, sx + 6, sy + 1, 16); house(p, sx, sy, 12, 'hus_kalas', 'kiremit', { h: 6 }); });
  K(11.6, 20.4, (p, sx, sy) => { // kuyu
    shadowAt(p, sx + 3, sy + 1, 9);
    p.rect(sx, sy - 4, 7, 4, '#8a8690'); p.rect(sx, sy - 4, 7, 1, '#a8a4b0'); p.rect(sx + 1, sy - 3, 5, 1, '#3a4a6a');
    p.rect(sx, sy - 9, 1, 5, '#6a4a2e'); p.rect(sx + 6, sy - 9, 1, 5, '#6a4a2e'); p.rect(sx - 1, sy - 11, 9, 2, '#a8463e'); p.rect(sx - 1, sy - 11, 9, 1, '#c86a5a');
  });
  K(14.4, 20.6, (p, sx, sy) => { for (let i = 0; i < 5; i++) p.rect(sx + i * 3, sy - 4, 1, 4, '#7a5a3a'); p.rect(sx, sy - 3, 13, 1, '#a8845a'); });
  K(5.2, 15.8, (p, sx, sy) => { for (let i = 0; i < 4; i++) p.rect(sx + i * 3, sy - 4, 1, 4, '#7a5a3a'); p.rect(sx, sy - 3, 10, 1, '#a8845a'); });
  for (const [x, y, l] of [[3, 10, 'yaprak'], [5, 8, 'yaprak'], [3.6, 22, 'yaprak'], [16, 10, 'pembe_yaprak'], [5, 25.5, 'hus_yaprak'], [10, 26.5, 'yaprak'], [14.5, 24, 'yaprak'], [2.5, 16, 'cam_yaprak'], [9, 8.5, 'yaprak'], [17, 26, 'cam_yaprak']]) K(x, y, (p, sx, sy) => { shadowAt(p, sx + 1, sy + 1, 8); tree(p, sx, sy, l); });
  spots.koy = d.pos(10.5, 14);
  // ------- Kesif: kamp, yol, bayraklar
  for (const [x, y, l] of [[22.4, 13.5, 'yaprak'], [25.8, 12.2, 'yaprak'], [22, 9.6, 'karli_yaprak'], [27.5, 8, 'karli_yaprak'], [21.6, 5.5, 'karli_yaprak']]) K(x, y, (p, sx, sy) => { shadowAt(p, sx + 1, sy + 1, 8); tree(p, sx, sy, l); });
  K(25.6, 15.6, (p, sx, sy) => { shadowAt(p, sx, sy + 1, 14); tent(p, sx, sy); });
  K(23, 16.2, (p, sx, sy) => { p.rect(sx - 2, sy - 1, 5, 1, '#5a3a24'); p.set(sx, sy - 2, '#ffb040'); p.set(sx - 1, sy - 2, '#e0602a'); p.set(sx + 1, sy - 3, '#ffe080'); });
  K(24.6, 11, (p, sx, sy) => flag(p, sx, sy, '#c84a3c'));
  K(24.4, 6, (p, sx, sy) => flag(p, sx, sy, '#c84a3c'));
  spots.kesif = d.pos(25, 13.6);
  // ------- Zindan: tas kapi ve merdiven
  K(28.4, 20.4, (p, sx, sy) => { shadowAt(p, sx, sy + 1, 22); stoneGate(p, sx, sy); });
  spots.zindan = d.pos(28.4, 17.6);
  // ------- Kule
  K(33, 12.4, (p, sx, sy) => {
    shadowAt(p, sx, sy + 1, 14);
    const th = 38;
    for (let j = 0; j < th; j++) for (let i = 0; i < 10; i++) p.set(sx - 5 + i, sy - j, shadeV(sample('tas_duvar', i * 2, j * 2), i < 2 ? 1.08 : i > 7 ? 0.68 : 0.9));
    for (let i = 0; i < 12; i++) if (i % 3 !== 2) p.rect(sx - 6 + i, sy - th - 3, 1, 3, '#6a6474');
    p.rect(sx - 6, sy - th - 1, 12, 1, '#4a4454');
    for (const yy of [8, 18, 28]) { p.rect(sx - 1, sy - yy - 3, 2, 3, '#5a3a8a'); p.set(sx - 1, sy - yy - 3, '#c8a0f0'); }
    p.rect(sx - 2, sy - 5, 4, 5, '#1a1420');
    for (let j = -th - 3; j <= 0; j++) { p.set(sx - 7, sy + j, OUT); p.set(sx + 6, sy + j, OUT); }
    flag(p, sx, sy - th - 3, '#8a5ac8');
  });
  spots.kule = d.pos(33, 6);
  // ------- Etkinlik Kapisi
  K(34, 26.5, (p, sx, sy) => {
    shadowAt(p, sx, sy + 1, 18);
    for (let j = 0; j < 17; j++) for (let i = 0; i < 16; i++) p.set(sx - 8 + i, sy - 17 + j, shadeV(sample('tas_duvar', i * 2, j * 2), i < 2 ? 1.08 : 0.9));
    for (let j = 0; j < 13; j++) for (let i = 0; i < 10; i++) { const dx = i - 4.5, dy = j - 6.5; const a = Math.atan2(dy, dx), rr = Math.sqrt(dx * dx + dy * dy); const v = (rr * 0.9 - a * 1.2 + 10) % 3; p.set(sx - 5 + i, sy - 14 + j, v < 1 ? '#c8a0f8' : v < 2 ? '#8a5ac8' : '#4a2e7a'); }
    for (let i = -8; i < 8; i++) p.set(sx + i, sy - 18, OUT);
    p.rect(sx - 9, sy - 18, 1, 18, OUT); p.rect(sx + 8, sy - 18, 1, 18, OUT);
    p.set(sx - 3, sy - 20, '#e0c8ff'); p.set(sx + 4, sy - 22, '#c8a0f8'); p.set(sx, sy - 24, '#e0c8ff');
  });
  spots.etkinlik = d.pos(34, 24);
  const pix = d.render(7);
  pix.each((v, x, y) => { const ex = Math.abs(x / WORLD.W - 0.5) * 2, ey = Math.abs(y / WORLD.H - 0.5) * 2; const k = Math.max(0, Math.max(ex, ey) - 0.82) * 1.6; return k > 0 ? shadeV(v, 1 - k * 0.4) : v; });
  return { canvas: pix.canvas(), spots };
}

// ---------------------------------------------------------------- koy (yakin)
// Koy Meydani ortada (Lale + pazar tezgahlari), solda Ormanlik (Gol + Koru),
// sol ustte Maden tepesi, sagda Us (ev, arsa, istasyonlar) ve sag altta Ahir.
function stall(p, sx, sy, c1, c2) {
  shadowAt(p, sx + 6, sy + 1, 14);
  p.rect(sx, sy - 9, 1, 9, '#5a3a24'); p.rect(sx + 12, sy - 9, 1, 9, '#5a3a24');
  box(p, sx, sy, 13, 4, 3, 'kalas', 'kalas');
  for (let i = -1; i < 14; i++) for (let j = 0; j < 4; j++) p.set(sx + i, sy - 13 + j, ((i + 1) >> 1) % 2 ? c1 : c2);
  for (let i = -1; i < 14; i += 2) p.set(sx + i, sy - 9, ((i + 1) >> 1) % 2 ? c1 : c2);
  for (let i = -2; i <= 14; i++) p.set(sx + i, sy - 14, OUT);
  p.set(sx - 2, sy - 13, OUT); p.set(sx + 14, sy - 13, OUT);
}
function person(p, sx, sy, hair, shirt) {
  p.rect(sx - 1, sy - 3, 3, 3, shirt); p.rect(sx - 1, sy - 1, 3, 1, shadeV(col(shirt), 0.7));
  p.rect(sx - 1, sy - 6, 3, 3, '#f0c8a0'); p.rect(sx - 1, sy - 7, 3, 2, hair); p.set(sx - 2, sy - 6, hair);
  p.set(sx, sy - 5, '#2a2020');
}
export function koyMap() {
  const cols = 26, rows = 19;
  const d = new Dio(cols, rows, { W: WORLD.W, H: WORLD.H, cw: 12, cd: 8, hu: 4, ox: 4, oy: 18, ground: 'yaprak' });
  const r = rng(23);
  const n = noise(r, cols, rows, 4);
  const spots = {};
  const isLake = (x, y) => { const dx = (x - 3.6) / 3.1, dy = (y - 13.2) / 2.8; return dx * dx + dy * dy < 1; };
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const nn = n(x, y);
    let h = 2, top = 'cimen_ust', side = 'toprak', ex = {};
    if (x <= 8 && y <= 6) { // maden tepesi
      const k = Math.max(0, 1 - Math.hypot((x - 3) / 6, (y - 1.5) / 5.5));
      h = 2 + Math.round(k * 6 + nn); top = h >= 5 ? 'tas' : 'cimen_ust'; side = h >= 4 ? 'tas' : 'toprak';
    } else if (isLake(x, y)) { d.set(x, y, 0, 'su', 'su', { water: true }); continue; }
    else if (x >= 17 && y >= 3 && y <= 11) { h = 2; } // us duz
    else h = 2 + (nn > 0.7 ? 1 : 0);
    d.set(x, y, h, top, side, ex);
  }
  // gol kiyisi kum
  for (let y = 9; y < rows; y++) for (let x = 0; x < 9; x++) if (!isLake(x, y) && [[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => isLake(x + a, y + b))) d.set(x, y, 1, 'kum', 'kum');
  // yollar
  const road = (x, y, t = 'cakil') => { const c = d.at(x, y); if (c && !c.water) d.set(x, y, 2, t, 'toprak'); };
  for (let y = 7; y <= 12; y++) for (let x = 10; x <= 15; x++) road(x, y, 'kaldirim'); // meydan
  for (let y = 13; y < rows; y++) road(12, y), road(13, y);       // disari giden yol
  for (let x = 16; x <= 19; x++) road(x, 9);                       // usse
  for (let x = 7; x <= 9; x++) road(x, 10);                        // ormana
  for (let y = 4; y <= 6; y++) road(9, y); road(8, 6); road(10, 6); // madene
  for (let x = 16; x <= 21; x++) road(x, 14); for (let y = 10; y <= 13; y++) road(16, y); // ahira
  // arsa: tarla satirlari
  for (let y = 7; y <= 10; y++) for (let x = 21; x <= 24; x++) d.set(x, y, 2, 'tarla', 'toprak');
  const K = (x, y, fn) => d.add(x, y, fn);
  const TREE = (x, y, l = 'yaprak', s = 1) => K(x, y, (p, sx, sy) => { shadowAt(p, sx + 1, sy + 1, 10); tree(p, sx, sy, l, l === 'hus_yaprak' ? 'hus_kutuk' : 'kutuk', s); });
  // ---- Maden: tas tepe, ahsap giris, ray ve vagon
  K(4.6, 6.1, (p, sx, sy) => {
    shadowAt(p, sx, sy + 1, 22);
    for (let j = 0; j < 12; j++) for (let i = 0; i < 18; i++) p.set(sx - 9 + i, sy - 12 + j, shadeV(sample('tas', i * 2, j * 2), 0.9));
    p.rect(sx - 5, sy - 10, 10, 10, '#0e0a14');
    p.rect(sx - 6, sy - 11, 1, 11, '#6a4a2e'); p.rect(sx + 5, sy - 11, 1, 11, '#6a4a2e'); p.rect(sx - 7, sy - 12, 14, 2, '#8a6a42'); p.rect(sx - 7, sy - 12, 14, 1, '#a8845a');
    for (let i = -9; i < 9; i++) p.set(sx + i, sy - 13, OUT);
    p.rect(sx - 3, sy - 1, 1, 1, '#8a8690'); for (let k = 0; k < 4; k++) { p.rect(sx - 3 + 0, sy + 1 + k * 2, 6, 1, '#5a3a24'); }
    p.rect(sx - 2, sy, 1, 9, '#8a8690'); p.rect(sx + 2, sy, 1, 9, '#8a8690');
    p.rect(sx - 8, sy + 1, 5, 3, '#6a5a4a'); p.rect(sx - 8, sy, 5, 1, '#3a3a40'); p.set(sx - 7, sy - 1, '#c8a050'); p.set(sx - 5, sy - 1, '#8ab0d0');
    p.rect(sx + 9, sy - 9, 1, 6, '#5a3a24'); p.rect(sx + 8, sy - 11, 3, 2, '#ffb040');
  });
  spots.maden = d.pos(4.6, 3.5);
  // ---- Ormanlik: gol + koru
  K(2.4, 12.6, (p, sx, sy) => sprite(p, 'nilufer', sx, sy, 8));
  K(4.8, 14.4, (p, sx, sy) => sprite(p, 'nilufer', sx, sy, 7));
  K(6.2, 12.2, (p, sx, sy) => { p.rect(sx, sy - 1, 8, 2, '#8a6a42'); p.rect(sx, sy - 1, 8, 1, '#a8845a'); p.rect(sx + 1, sy + 1, 1, 3, '#5a3a24'); p.rect(sx + 6, sy + 1, 1, 3, '#5a3a24'); }); // iskele
  K(7.4, 15.6, (p, sx, sy) => sprite(p, 'saz', sx, sy, 8));
  K(0.8, 11.4, (p, sx, sy) => sprite(p, 'saz', sx, sy, 8));
  spots.gol = d.pos(3.6, 13);
  for (const [x, y, l, s] of [[1, 8.6, 'yaprak', 1.1], [3.2, 9, 'hus_yaprak', 1], [5.6, 8.4, 'yaprak', 1.2], [7.6, 9.4, 'pembe_yaprak', 1], [0.6, 17.6, 'cam_yaprak', 1.2], [3.4, 18.2, 'yaprak', 1.1], [6.4, 17.6, 'hus_yaprak', 1], [8.8, 18.6, 'yaprak', 1], [9.4, 14, 'cam_yaprak', 1], [10.2, 16.6, 'yaprak', 1.1]]) TREE(x, y, l, s);
  for (const [x, y, k] of [[8.4, 12.6, 'cicek_k'], [9.2, 11.6, 'cicek_s'], [4.4, 10.2, 'ot'], [8, 16.2, 'mantarlar'], [2, 16.6, 'cicek_s'], [5.2, 16.8, 'ot']]) K(x, y, (p, sx, sy) => sprite(p, k, sx, sy + 1, 8));
  spots.koru = d.pos(6.2, 9.2);
  // ---- Koy Meydani: Lale'nin hani, kuyu/cesme, pazar tezgahlari
  K(11, 6.6, (p, sx, sy) => { shadowAt(p, sx + 12, sy + 1, 30); house(p, sx, sy, 26, 'kalas', 'kiremit', { h: 11, d: 8 }); for (let i = 0; i < 6; i++) p.rect(sx + 4 + i * 3, sy - 13, 2, 2, ['#c84a3c', '#e0b040', '#4a8ac8'][i % 3]); });
  K(13.6, 7.6, (p, sx, sy) => person(p, sx, sy, '#c86a8a', '#6aa86a')); // Lale
  K(12.4, 10.6, (p, sx, sy) => { // cesme
    shadowAt(p, sx + 6, sy + 1, 18);
    p.rect(sx, sy - 5, 13, 5, '#8a8690'); p.rect(sx, sy - 5, 13, 1, '#b0acb8'); p.rect(sx + 1, sy - 4, 11, 2, '#5a8ac0'); p.rect(sx + 2, sy - 4, 4, 1, '#9ac8e8');
    p.rect(sx + 5, sy - 10, 3, 6, '#9a96a0'); p.set(sx + 6, sy - 12, '#9ac8e8'); p.set(sx + 5, sy - 11, '#9ac8e8'); p.set(sx + 7, sy - 11, '#9ac8e8');
    for (let i = -1; i <= 13; i++) { p.set(sx + i, sy, OUT); p.set(sx + i, sy - 6, OUT); } p.rect(sx - 1, sy - 6, 1, 6, OUT); p.rect(sx + 13, sy - 6, 1, 6, OUT);
  });
  K(10.1, 9.2, (p, sx, sy) => stall(p, sx, sy, '#c84a3c', '#e8dcc0'));
  K(14.6, 9.2, (p, sx, sy) => stall(p, sx, sy, '#4a7ac8', '#e8dcc0'));
  K(10.2, 12.6, (p, sx, sy) => sprite(p, 'varil', sx, sy, 8));
  K(15.6, 12.6, (p, sx, sy) => sprite(p, 'fener', sx, sy, 8));
  spots.meydan = d.pos(13, 8.5);
  // ---- Us: ev, onunde istasyonlar, yaninda arsa (ekinler)
  K(18, 6.4, (p, sx, sy) => { shadowAt(p, sx + 9, sy + 1, 24); house(p, sx, sy, 20, 'hus_kalas', 'kiremit', { h: 9, d: 7 }); });
  for (const [x, y, k] of [[18.4, 8.2, 'masa_m'], [19.4, 8.2, 'firin0'], [18.4, 9.4, 'kazan0'], [19.6, 9.5, 'ors']]) K(x, y, (p, sx, sy) => sprite(p, k, sx, sy + 1, 10));
  for (let y = 7; y <= 10; y++) for (let x = 21; x <= 24; x++) K(x + 0.5, y + 0.6, (p, sx, sy) => sprite(p, ['ekin_bugday', 'ekin_havuc', 'ekin_misir', 'ekin_cilek'][y - 7], sx, sy, 9));
  for (let x = 20.6; x <= 25; x += 0.5) K(x, 11.3, (p, sx, sy) => { p.rect(sx, sy - 5, 1, 5, '#7a5a3a'); p.rect(sx - 3, sy - 4, 6, 1, '#a8845a'); });
  K(23.4, 5.4, (p, sx, sy) => sprite(p, 'kovan', sx, sy, 9));
  spots.arsa = d.pos(20.5, 8.4);
  // ---- Ahir: kirmizi ahsap ahir, citli otlak
  K(19.2, 16.6, (p, sx, sy) => { shadowAt(p, sx + 10, sy + 1, 26); house(p, sx, sy, 22, 'kiraz_kalas', 'kalas', { h: 10, d: 7, chimney: false }); p.rect(sx + 8, sy - 9, 6, 9, '#3a2418'); p.rect(sx + 8, sy - 9, 6, 1, '#e8dcc0'); p.set(sx + 10, sy - 6, '#e8dcc0'); p.set(sx + 11, sy - 5, '#e8dcc0'); });
  for (let x = 17.2; x <= 25.6; x += 0.5) K(x, 18.4, (p, sx, sy) => { p.rect(sx, sy - 5, 1, 5, '#7a5a3a'); p.rect(sx - 3, sy - 4, 6, 1, '#a8845a'); });
  K(22.8, 17.6, (p, sx, sy) => sprite(p, 'saman' in {} ? 'saman' : 'yem_tezgahi', sx, sy, 9));
  spots.ahir = d.pos(21, 15);
  // kenar agaclari
  for (const [x, y, l] of [[16.6, 2.2, 'yaprak'], [11.2, 2.6, 'cam_yaprak'], [14, 1.6, 'yaprak'], [21, 1.8, 'hus_yaprak'], [24.6, 2.6, 'yaprak'], [25, 13.2, 'cam_yaprak'], [16.2, 17.8, 'yaprak'], [10.8, 4.4, 'pembe_yaprak'], [17, 12.6, 'yaprak']]) TREE(x, y, l);
  for (let i = 0; i < 26; i++) { const x = 9 + r() * 16, y = 1 + r() * 17, c = d.at(Math.floor(x), Math.floor(y)); if (c && c.top === 'cimen_ust') K(x, y, (p, sx, sy) => sprite(p, r() < 0.5 ? 'ot' : 'cicek_k', sx, sy + 1, 7)); }
  spots.cik = d.pos(12.9, 17.5);
  const pix = d.render(9);
  pix.each((v, x, y) => { const ex = Math.abs(x / WORLD.W - 0.5) * 2, ey = Math.abs(y / WORLD.H - 0.5) * 2; const k = Math.max(0, Math.max(ex, ey) - 0.86) * 1.6; return k > 0 ? shadeV(v, 1 - k * 0.5) : v; });
  return { canvas: pix.canvas(), spots };
}
