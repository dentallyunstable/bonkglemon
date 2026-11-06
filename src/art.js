// Kodla cizilen piksel sanat: arka planlar, us nesneleri, esya simgeleri.
//
// Tarz (karakterlerle uyumlu olsun diye):
// - Her sey 2x2 piksellik bloklarla (texel) cizilir, karakterlerin yuzu gibi.
// - Duz renkler, malzeme basina en fazla 2-3 ton. Rastgele piksel "kumlanmasi" yok.
// - On plandaki nesnelerin 1 piksellik siyah cizgisi var (karakter gibi).
//   Arka plandaki agac ve calilarin cizgisi kendi renginin koyusudur, geride kalsinlar diye.
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
const col = (c) => (c == null ? 0 : typeof c === 'number' ? c : typeof c === 'string' ? pack(hex(c)) : pack(c));

export const INK = '#100c14'; // karakterlerin siyah cizgisine yakin

// Tam cozunurluklu piksel tuvali
class Pix {
  constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  set(x, y, c) {
    x |= 0; y |= 0;
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
  }
  map(rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => { if (ch !== '.' && pal[ch]) this.set(ox + x, oy + y, pal[ch]); });
    });
  }
  // saydam kenarlara 1 piksel cizgi (renk ya da 'dark' = komsu rengin koyusu)
  outline(c = INK) {
    const src = this.d.slice();
    const fixed = c === 'dark' ? 0 : col(c);
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (src[y * this.w + x] >>> 24) continue;
        let best = 0;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx; const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= this.w || ny >= this.h) continue;
          const n = src[ny * this.w + nx];
          if ((n >>> 24) < 200) continue;
          best = fixed || pack(mul(unpack(n).slice(0, 3), 0.45));
          break;
        }
        if (best) this.d[y * this.w + x] = best;
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

// Texel tuvali: her hucre ekranda 2x2 piksel olur
class Tex {
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
  // kose kesilmis dikdortgen (yumusak gorunum)
  rrect(x, y, w, h, c, r = 1) {
    const v = col(c);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const cx = Math.min(i, w - 1 - i); const cy = Math.min(j, h - 1 - j);
        if (cx + cy < r) continue;
        this.set(x + i, y + j, v);
      }
    }
    return this;
  }
  ellipse(cx, cy, rx, ry, c) {
    const v = col(c);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx; const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, v);
      }
    }
    return this;
  }
  map(rows, pal, ox = 0, oy = 0) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => { if (ch !== '.' && pal[ch]) this.set(ox + x, oy + y, pal[ch]); });
    });
    return this;
  }
  // sadece dolu hucreleri boya (golge/isik bantlari icin)
  tint(fn) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const v = this.d[y * this.w + x];
        if (!(v >>> 24)) continue;
        const c = fn(x, y, v);
        if (c != null) this.d[y * this.w + x] = col(c);
      }
    }
    return this;
  }
}

// Katmanlari ust uste koyup cizgileriyle birlikte tam cozunurluge cevirir.
// Her katman kendi cizgisini alir; ondeki katmanin cizgisi arkadakinin ustune duser
// ve parcalar arasinda karakterdeki gibi ince ayirici cizgiler olusur.
function compose(pw, ph, layers, pad = 1) {
  const out = new Pix(pw, ph);
  for (const L of layers) {
    const t = L.t; const ox = pad + (L.x || 0) * 2; const oy = pad + (L.y || 0) * 2;
    const lw = t.w * 2 + 2; const lh = t.h * 2 + 2;
    const buf = new Uint32Array(lw * lh);
    for (let y = 0; y < t.h; y++) {
      for (let x = 0; x < t.w; x++) {
        const v = t.d[y * t.w + x];
        if (!(v >>> 24)) continue;
        const i = (y * 2 + 1) * lw + x * 2 + 1;
        buf[i] = v; buf[i + 1] = v; buf[i + lw] = v; buf[i + lw + 1] = v;
      }
    }
    if (L.ol) {
      const fixed = L.ol === 'dark' ? 0 : col(L.ol);
      const src = buf.slice();
      for (let y = 0; y < lh; y++) {
        for (let x = 0; x < lw; x++) {
          if (src[y * lw + x]) continue;
          let n = 0;
          if (x > 0 && src[y * lw + x - 1]) n = src[y * lw + x - 1];
          else if (x < lw - 1 && src[y * lw + x + 1]) n = src[y * lw + x + 1];
          else if (y > 0 && src[(y - 1) * lw + x]) n = src[(y - 1) * lw + x];
          else if (y < lh - 1 && src[(y + 1) * lw + x]) n = src[(y + 1) * lw + x];
          if (!n) continue;
          buf[y * lw + x] = fixed || pack(mul(unpack(n).slice(0, 3), L.olF || 0.45));
        }
      }
    }
    for (let y = 0; y < lh; y++) {
      for (let x = 0; x < lw; x++) {
        const v = buf[y * lw + x];
        if (v) out.set(ox + x - 1, oy + y - 1, v);
      }
    }
  }
  return out;
}

// tek katmanli nesne: Tex -> cizgili Pix
const solo = (t, ol = INK) => compose(t.w * 2 + 2, t.h * 2 + 2, [{ t, ol }]);

// ------------------------------------------------------------------ renk yardimcilari
// t: 0 = gunduz, 1 = gece. Kat derinlestikce orman kararir.
const dn = (t) => (day, night, k = 1) => mix(hex(day), hex(night), Math.min(1, t * k));

// ------------------------------------------------------------------ orman
function oak(t, x, groundY, h, cw, ch, c) {
  // govde: 3 texel, sol acik sag koyu
  const top = groundY - h;
  for (let y = top; y < groundY; y++) {
    t.set(x, y, c.barkL); t.set(x + 1, y, c.bark); t.set(x + 2, y, c.barkD);
  }
  // yaprak tacı: kosesi kesilmis kutu + ustte kucuk kutu (blok gibi ama yumusak)
  const cx = x + 1.5 - cw / 2;
  const cy = top - ch + 4;
  t.rrect(Math.round(cx), cy, cw, ch, c.leaf, 2);
  t.rrect(Math.round(cx + cw * 0.2), cy - 3, Math.round(cw * 0.6), 5, c.leaf, 2);
  // isik sol ustten: ust sira acik, alt iki sira koyu
  const x0 = Math.round(cx); const y0 = cy - 3; const x1 = x0 + cw; const y1 = cy + ch;
  t.tint((tx, ty, v) => {
    if (tx < x0 - 1 || tx > x1 || ty < y0 || ty >= y1) return null;
    if (v === col(c.barkL) || v === col(c.bark) || v === col(c.barkD)) return null;
    const above = t.get(tx, ty - 1);
    if (!(above >>> 24)) return c.leafL;
    if (ty >= y1 - 2) return c.leafD;
    if (tx >= x1 - 2 && ty > cy + 1) return c.leafD;
    return null;
  });
}

export function forestBackground(floor, variant = 0, base = false, width = GAME_W) {
  const PW = width; const PH = GAME_H;
  const TW = PW / 2; const TH = PH / 2; const TG = GROUND_Y / 2;
  const r = rng(floor * 7919 + variant * 104729 + (base ? 77 : 0));
  const t = base ? 0 : Math.min(1, (floor - 1) / 9) * 0.85;
  const C = dn(t);
  const layers = [];

  // gokyuzu: birkac genis duz bant
  const sky = new Tex(TW, TG);
  const bands = [C('#94d2f0', '#1b1a36'), C('#a4daf3', '#251f44'), C('#b5e1f5', '#352851'), C('#c8e9f7', '#4e3159'), C('#d8effa', '#6b3d64')];
  const edges = [0, 22, 38, 50, 60, TG];
  for (let b = 0; b < 5; b++) sky.rect(0, edges[b], TW, edges[b + 1] - edges[b], bands[b]);
  layers.push({ t: sky });

  // gunes ya da ay + yildizlar
  const deco = new Tex(TW, TG);
  const sx = 20 + Math.floor(r() * (TW - 40));
  if (t < 0.45) {
    deco.ellipse(sx, 13, 5, 5, C('#fff4b8', '#f0c890'));
  } else {
    deco.ellipse(sx, 12, 4.5, 4.5, '#ece8f4');
    deco.set(sx - 1, 11, '#d2cce2'); deco.set(sx + 1, 13, '#d2cce2'); deco.set(sx + 2, 12, '#d2cce2');
    const star = mix(hex('#ffffff'), bands[0], 0.25);
    for (let i = 0; i < 26; i++) deco.set(Math.floor(r() * TW), Math.floor(r() * 44), star);
  }
  // bulutlar: yumusak koseli duz bloklar
  const cloud = C('#ffffff', '#4a4470', 0.9);
  const cloudD = mix(cloud, bands[1], 0.3);
  for (let i = 0; i < 3 + Math.floor(r() * 2); i++) {
    const cx = Math.floor(r() * TW) - 6; const cy = 6 + Math.floor(r() * 26); const cw = 12 + Math.floor(r() * 10);
    deco.rrect(cx, cy + 2, cw, 4, cloud, 1);
    deco.rrect(cx + 3, cy, cw - 8, 3, cloud, 1);
    deco.rect(cx + 1, cy + 5, cw - 2, 1, cloudD);
  }
  layers.push({ t: deco });

  // uzak tepeler (duz, soluk)
  const hills = new Tex(TW, TG);
  const hill = C('#bfe2c8', '#3a3a62');
  const ph1 = r() * 6; const ph2 = r() * 6;
  for (let x = 0; x < TW; x++) {
    const h = 18 + 6 * Math.sin(x * 0.036 + ph1) + 3 * Math.sin(x * 0.09 + ph2);
    for (let y = Math.round(TG - 12 - h); y < TG; y++) hills.set(x, y, hill);
  }
  layers.push({ t: hills });

  // uzak orman: yuvarlak agac tepeleri, tek duz renk (bosluksuz siluet)
  const far = new Tex(TW, TG);
  const farC = C('#92caa2', '#2c3254');
  const prof = new Array(TW).fill(TG - 8);
  for (let x = -6; x < TW + 6; x += 4 + Math.floor(r() * 5)) {
    const rad = 3.5 + r() * 4;
    const cy = TG - 12 - r() * 10;
    for (let i = Math.floor(-rad); i <= Math.ceil(rad); i++) {
      const xx = x + i;
      if (xx < 0 || xx >= TW || Math.abs(i + 0.5) > rad) continue;
      prof[xx] = Math.min(prof[xx], Math.round(cy - Math.sqrt(rad * rad - (i + 0.5) * (i + 0.5))));
    }
  }
  for (let x = 0; x < TW; x++) far.rect(x, prof[x], 1, TG - prof[x], farC);
  layers.push({ t: far });

  // orta agaclar (koyu tonlu cizgi, geride kalsinlar)
  const cols = {
    bark: C('#8f6446', '#3a2e2c'), barkL: C('#a8785a', '#463836'), barkD: C('#74503a', '#2c2424'),
    leaf: C('#5aac4e', '#22443a'), leafL: C('#7cc65e', '#2f5a44'), leafD: C('#468e40', '#18342e'),
  };
  const nTrees = base ? 3 : 4 + Math.floor(r() * 3);
  const spots = [];
  for (let i = 0; i < nTrees; i++) {
    let x = Math.floor(r() * (TW + 10)) - 10;
    if (base && x > 30 && x < TW - 40) x = x < TW / 2 ? 2 + Math.floor(r() * 16) : TW - 36 + Math.floor(r() * 20);
    spots.push(x);
  }
  spots.sort((a, b) => a - b);
  for (const x of spots) {
    const tr = new Tex(TW, TG);
    const cw = 14 + Math.floor(r() * 6);
    oak(tr, x, TG, 18 + Math.floor(r() * 14), cw, 9 + Math.floor(r() * 4), cols);
    layers.push({ t: tr, ol: 'dark' });
  }

  // calilar
  const bush = C('#62b450', '#244a38'); const bushL = C('#86cc62', '#2f5a44');
  for (let x = Math.floor(r() * 10); x < TW;) {
    const w = 5 + Math.floor(r() * 7); const h = 3 + Math.floor(r() * 3);
    if (r() < 0.55) {
      const b = new Tex(TW, TG);
      b.rrect(x, TG - h, w, h + 1, bush, 1);
      b.rect(x + 1, TG - h, w - 2, 1, bushL);
      layers.push({ t: b, ol: 'dark' });
    }
    x += w + 4 + Math.floor(r() * 14);
  }

  // zemin: cim seridi + toprak
  const gr = new Tex(TW, TH);
  const grass = C('#78c457', '#2d5a36'); const grassL = C('#98d96c', '#3a6e42'); const grassD = C('#5ea548', '#234a2e');
  const dirt = C('#a07150', '#4c3428', 0.8); const dirtD = C('#8b5f42', '#3e2a22', 0.8); const deep = C('#7a5238', '#33231d', 0.8);
  gr.rect(0, TG, TW, TH - TG, dirt);
  gr.rect(0, TG, TW, 2, grass);
  gr.rect(0, TG, TW, 1, grassL);
  for (let x = 0; x < TW; x++) {
    const k = (x * 7 + variant * 3) % 11;
    if (k < 4) gr.set(x, TG + 2, grass);
    if (k === 1) gr.set(x, TG + 3, grassD);
    if (r() < 0.12) gr.set(x, TG - 1, grassL); // cim tutamlari
  }
  // derin toprak bandi (basamakli sinir)
  for (let x = 0; x < TW; x++) {
    const y = TG + 11 + ((Math.floor(x / 6) * 5 + variant) % 3);
    gr.rect(x, y, 1, TH - y, deep);
  }
  // seyrek toprak lekeleri
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(r() * TW); const y = TG + 4 + Math.floor(r() * 14);
    gr.rect(x, y, r() < 0.5 ? 2 : 1, 1, dirtD);
  }
  layers.push({ t: gr, ol: 'dark', olF: 0.5 });
  // cakil taslari (kendi cizgileriyle)
  const st = new Tex(TW, TH);
  const stone = C('#c2bab2', '#5a5864'); const stoneD = C('#a39a92', '#48464f');
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * (TW - 4)); const y = TG + 6 + Math.floor(r() * 12); const w = 2 + Math.floor(r() * 2);
    st.rect(x, y, w, 1, stone); st.set(x + w - 1, y, stoneD);
  }
  layers.push({ t: st, ol: 'dark', olF: 0.55 });
  // cicekler
  const fl = new Tex(TW, TH);
  for (let i = 0; i < 7; i++) {
    const x = Math.floor(r() * TW);
    fl.set(x, TG - 1, grassD);
    fl.set(x, TG - 2, C(r() < 0.5 ? '#f27a7a' : '#ffd95a', '#7a4060'));
  }
  layers.push({ t: fl });

  return compose(PW, PH, layers, 0).canvas();
}

// ------------------------------------------------------------------ us nesneleri
export function cabin() {
  const W = 51; const H = 40;
  const wall = new Tex(W, H);
  const log = '#b8804e'; const logD = '#966438'; const post = '#cf9a62'; const postD = '#a87a48';
  for (let row = 0; row < 8; row++) {
    const y = 16 + row * 3;
    wall.rect(4, y, 43, 2, log); wall.rect(4, y + 2, 43, 1, logD);
  }
  wall.rect(2, 16, 3, 24, post); wall.rect(46, 16, 3, 24, post);
  for (let y = 18; y < 40; y += 3) { wall.rect(2, y, 3, 1, postD); wall.rect(46, y, 3, 1, postD); }
  const chim = new Tex(W, H);
  chim.rect(36, 1, 5, 12, '#aaa6b2'); chim.rect(40, 1, 1, 12, '#8e8a98'); chim.rect(35, 1, 7, 2, '#bdb9c4');
  const roof = new Tex(W, H);
  const rf = '#cc5a40'; const rfD = '#a8452f';
  for (let s = 0; s < 8; s++) {
    const y = 2 + s * 2; const w = 11 + s * 6; const x = Math.round(25.5 - w / 2);
    roof.rect(x, y, w, 2, rf); roof.rect(x, y + 1, w, 1, rfD);
  }
  const door = new Tex(W, H);
  door.rect(30, 26, 9, 14, '#7e4e2e'); door.rect(34, 26, 1, 14, '#68401f'); door.rect(36, 33, 1, 1, '#ffd04d');
  const win = new Tex(W, H);
  win.rect(9, 23, 12, 9, '#7e4e2e'); win.rect(10, 24, 10, 7, '#ffe08a'); win.rect(10, 24, 4, 3, '#fff3c4');
  win.rect(14, 24, 1, 7, '#7e4e2e'); win.rect(10, 27, 10, 1, '#7e4e2e');
  return compose(W * 2 + 2, H * 2 + 2, [
    { t: chim, ol: INK }, { t: wall, ol: INK }, { t: roof, ol: INK }, { t: door, ol: INK }, { t: win, ol: INK },
  ]).canvas();
}

// ussun sagindaki zindan girisi (tas magara agzi)
export function mineEntrance() {
  const W = 39; const H = 29;
  const rock = new Tex(W, H);
  const st = '#a7a3b0'; const stL = '#bdb9c6'; const stD = '#8b8796';
  rock.ellipse(19.5, 29, 19.5, 27, st);
  rock.tint((x, y) => {
    if (!(rock.get(x, y - 1) >>> 24) || !(rock.get(x - 1, y) >>> 24)) return stL;
    if (!(rock.get(x + 1, y) >>> 24) || x > 32) return stD;
    return null;
  });
  // birkac tas catlagi (duzenli, kumlanma yok)
  for (const [x, y, w] of [[6, 14, 3], [9, 20, 2], [30, 12, 3], [29, 21, 2], [13, 7, 2], [24, 5, 3]]) rock.rect(x, y, w, 1, stD);
  const moss = new Tex(W, H);
  const ms = '#7cc25a'; const msL = '#9ad672';
  for (let x = 0; x < W; x++) {
    let top = -1;
    for (let y = 0; y < H; y++) if (rock.get(x, y) >>> 24) { top = y; break; }
    if (top < 0 || top > 16) continue;
    const drip = (x * 5) % 7 < 2 ? 3 : 2;
    moss.rect(x, top, 1, drip, ms);
    moss.set(x, top, msL);
  }
  const hole = new Tex(W, H);
  hole.rrect(13, 11, 13, 18, '#17121f', 3);
  hole.rect(14, 22, 11, 7, '#211a2b');
  const frame = new Tex(W, H);
  const wd = '#b07a44'; const wdD = '#8e5e32';
  frame.rect(12, 11, 2, 18, wd); frame.rect(25, 11, 2, 18, wd); frame.rect(10, 9, 19, 2, wd); frame.rect(10, 10, 19, 1, wdD);
  const lamp = new Tex(W, H);
  lamp.rect(28, 13, 2, 3, '#ffd04d'); lamp.rect(28, 12, 2, 1, '#4a4652');
  return compose(W * 2 + 2, H * 2 + 2, [
    { t: rock, ol: INK }, { t: moss, ol: INK }, { t: hole }, { t: frame, ol: INK }, { t: lamp, ol: INK },
  ]).canvas();
}

export function signpost() {
  const t = new Tex(14, 16);
  const post = new Tex(14, 16);
  post.rect(6, 5, 2, 11, '#a2703f'); post.rect(7, 5, 1, 11, '#875a30');
  t.rect(0, 1, 11, 5, '#c99258'); t.rect(11, 2, 1, 3, '#c99258'); t.rect(12, 3, 1, 1, '#c99258');
  t.rect(0, 5, 11, 1, '#a8743e');
  t.rect(2, 2, 6, 1, '#7a4c2a'); t.rect(2, 4, 4, 1, '#7a4c2a');
  return compose(30, 34, [{ t: post, ol: INK }, { t, ol: INK }]).canvas();
}

export function chest(open = false) {
  const body = new Tex(9, 9);
  const wood = '#c88f4c'; const woodD = '#a6713a'; const band = '#6e4626';
  body.rect(0, 4, 9, 5, wood); body.rect(0, 8, 9, 1, woodD);
  body.rect(0, 4, 1, 5, band); body.rect(8, 4, 1, 5, band);
  const lid = new Tex(9, 9);
  if (!open) {
    lid.rect(0, 1, 9, 3, '#d49b58'); lid.rect(0, 3, 9, 1, woodD); lid.rect(0, 1, 1, 3, band); lid.rect(8, 1, 1, 3, band);
  } else {
    lid.rect(0, 0, 9, 2, woodD); lid.rect(0, 0, 9, 1, '#d49b58');
    body.rect(1, 3, 7, 1, '#ffd04d'); body.rect(2, 3, 2, 1, '#fff2a8');
  }
  const lock = new Tex(9, 9);
  if (!open) { lock.rect(4, 3, 1, 2, '#ffd04d'); }
  return compose(20, 20, [{ t: body, ol: INK }, { t: lid, ol: INK }, { t: lock }]).canvas();
}

// 3 kareli kamp atesi (yan yana)
export function campfire() {
  const fw = 26; const fh = 28;
  const out = new Pix(fw * 3, fh);
  const flames = [
    ['...o....', '..oo..o.', '.oyo.oo.', '.oyyooyo', 'oyywyyyo', 'oywwwyyo', '.oywwyo.', '..oooo..'],
    ['.....o..', '.o..oo..', '.oo.oyo.', 'oyoooyyo', 'oyyywyyo', 'oywwwwyo', '.oywwyo.', '..oooo..'],
    ['..o.....', '..oo.o..', '.oyooyo.', '.oyyyyyo', 'oyywwyyo', 'oywwwyyo', '.oyywyo.', '..oooo..'],
  ];
  for (let f = 0; f < 3; f++) {
    const stones = new Tex(12, 13);
    for (let i = 0; i < 4; i++) stones.rrect(i * 3, 11, 3, 2, i % 2 ? '#9e9aa6' : '#b4b0bb', 1);
    const logs = new Tex(12, 13);
    for (let i = 0; i < 8; i++) { logs.set(2 + i, 8 + Math.floor(i / 3), '#9a6436'); }
    for (let i = 0; i < 8; i++) { logs.set(9 - i, 8 + Math.floor(i / 3), '#7e4e2a'); }
    const fl = new Tex(12, 13);
    fl.map(flames[f], { o: '#ff8a2e', y: '#ffc23e', w: '#fff1a6' }, 2, 2);
    const p = compose(fw, fh, [{ t: fl }, { t: logs, ol: INK }, { t: stones, ol: INK }]);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const v = p.get(x, y); if (v) out.set(f * fw + x, y, v); }
  }
  return { canvas: out.canvas(), fw, fh };
}

export function spikes() {
  const base = new Tex(22, 7);
  base.rect(0, 5, 22, 2, '#8e8a98'); base.rect(0, 5, 22, 1, '#a9a5b2');
  const sp = new Tex(22, 7);
  for (let i = 0; i < 6; i++) {
    const x = 1 + i * 4 - (i > 2 ? 1 : 0);
    sp.rect(x + 1, 0, 1, 1, '#eef0f4');
    sp.rect(x + 1, 1, 1, 2, '#d8dce4'); sp.rect(x + 2, 2, 1, 1, '#aab0bc');
    sp.rect(x, 3, 2, 2, '#d8dce4'); sp.rect(x + 2, 3, 1, 2, '#aab0bc');
  }
  return compose(46, 16, [{ t: sp, ol: INK }, { t: base, ol: INK }]).canvas();
}

// asagi inen tas merdiven (zemine oyulmus)
export function stairsDown() {
  const p = new Tex(28, 19);
  p.rect(1, 0, 26, 19, '#16121c');
  for (let s = 0; s < 5; s++) {
    const x = 2 + s * 4; const y = 1 + s * 3; const w = 24 - s * 4;
    p.rect(x, y, w, 1, mix(hex('#bdb9c6'), hex('#16121c'), s * 0.15));
    p.rect(x, y + 1, w, 2, mix(hex('#9894a4'), hex('#16121c'), s * 0.15));
  }
  p.rect(0, 0, 1, 19, '#8b8796'); p.rect(27, 0, 1, 19, '#8b8796');
  const grass = new Tex(28, 19);
  grass.rect(0, 0, 28, 1, '#78c457');
  return compose(56, 38, [{ t: p }, { t: grass }], 0).canvas();
}

export function slash() {
  const t = new Tex(14, 14);
  for (let a = -1.15; a <= 1.15; a += 0.04) {
    const thick = 2.2 * (1 - Math.abs(a) / 1.2);
    for (let rr = 6.5 - thick; rr <= 6.5; rr += 0.5) {
      t.set(7 + Math.cos(a) * rr, 7 + Math.sin(a) * rr, rr > 5.6 ? '#ffffff' : '#cfe8ff');
    }
  }
  return compose(28, 28, [{ t }], 0).canvas();
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
// 12x12 piksel, duz 2-3 ton ve siyah cizgi
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
  para: [['............', '....oooo....', '...oYYYYo...', '..oYyYYYYo..', '..oYYBBYYo..', '..oYYBYBYo..', '..oYYBBYYo..', '..oYYBYBYo..', '...oYBBYo...', '....oooo....', '............', '............'],
    { o: '#d29a22', Y: '#ffd04d', y: '#fff3a8', B: '#b8801e' }],
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
  p.outline(INK);
  iconCache[name] = p.canvas().toDataURL();
  return iconCache[name];
}
