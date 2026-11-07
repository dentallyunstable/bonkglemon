// Piksel tuvali ve renk yardimcilari (art.js ve blocks.js ortak kullanir).

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
export const mix = (a, b, t) => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t));
export const mul = (c, f) => c.map((v) => Math.max(0, Math.min(255, Math.round(v * f))));
export const pack = (c, a = 255) => (((a & 255) << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;
export const unpack = (n) => [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, n >>> 24];
export const col = (c) => (c == null ? 0 : typeof c === 'number' ? c : typeof c === 'string' ? pack(hex(c)) : pack(c));

export const INK = '#16121a'; // karakterlerin siyah cizgisine yakin

export class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  set(x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.d[y * this.w + x] = col(c);
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.d[y * this.w + x];
  }
  rect(x, y, w, h, c) {
    const v = col(c);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v);
    return this;
  }
  map(rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => { if (ch !== '.' && pal[ch]) this.set(ox + x, oy + y, pal[ch]); });
    });
    return this;
  }
  // baska bir tuvali (ya da 16x16 blok dizisini) uste kopyala; saydam pikseller atlanir
  draw(src, ox, oy, sw = src.w, fn = null) {
    const w = sw; const h = src.d.length / w;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = src.d[y * w + x];
        if (!(v >>> 24)) continue;
        if (fn) v = fn(v, x, y);
        this.set(ox + x, oy + y, v);
      }
    }
    return this;
  }
  // her dolu piksele renk fonksiyonu uygula
  each(fn) {
    for (let i = 0; i < this.d.length; i++) {
      const v = this.d[i];
      if (v >>> 24) this.d[i] = col(fn(v, i % this.w, Math.floor(i / this.w)));
    }
    return this;
  }
  // saydam kenarlara 1 piksel cizgi (renk ya da 'dark' = komsu rengin koyusu)
  outline(c = INK, f = 0.45) {
    const src = this.d.slice();
    const fixed = c === 'dark' ? 0 : col(c);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] >>> 24) continue;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
          const n = src[ny * this.w + nx];
          if ((n >>> 24) < 200) continue;
          this.d[y * this.w + x] = fixed || pack(mul(unpack(n).slice(0, 3), f));
          break;
        }
      }
    }
    return this;
  }
  // tam sayi kat buyutme (en yakin komsu)
  scaled(k) {
    if (k === 1) return this;
    const o = new Pix(this.w * k, this.h * k);
    for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) o.d[y * o.w + x] = this.d[Math.floor(y / k) * this.w + Math.floor(x / k)];
    return o;
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

// renk donusumu: v (paketli) -> karartilmis / sise karismis
export function shade(v, f) { const c = unpack(v); return pack(mul(c.slice(0, 3), f), c[3]); }
export function fog(v, to, t) { const c = unpack(v); return pack(mix(c.slice(0, 3), hex(to), t), c[3]); }
