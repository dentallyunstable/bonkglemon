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

// Takas Tezgahi: iki direk, tezgah, cizgili tente, ustunde bir cimen blogu
export function stall() {
  const W = 22; const H = 26;
  const posts = new Tex(W, H);
  posts.rect(1, 6, 2, 20, '#a2703f'); posts.rect(2, 6, 1, 20, '#875a30');
  posts.rect(19, 6, 2, 20, '#a2703f'); posts.rect(20, 6, 1, 20, '#875a30');
  const counter = new Tex(W, H);
  counter.rect(0, 16, 22, 2, '#d49b58'); counter.rect(0, 17, 22, 1, '#b07a40');
  counter.rect(1, 18, 20, 8, '#c88f4c'); counter.rect(1, 25, 20, 1, '#a6713a');
  for (const x of [6, 11, 16]) counter.rect(x, 18, 1, 8, '#a6713a');
  const awn = new Tex(W, H);
  for (let i = 0; i < 6; i++) awn.rect(i * 4 - 1, 1, 4, 5, i % 2 ? '#f4ecd8' : '#62a844');
  awn.rect(0, 0, 22, 1, '#4c8434');
  for (let i = 0; i < 6; i++) awn.rect(i * 4, 6, 2, 1, i % 2 ? '#f4ecd8' : '#62a844');
  const block = new Tex(W, H);
  block.rect(13, 11, 5, 5, '#a07150'); block.rect(13, 11, 5, 2, '#74c452'); block.rect(14, 13, 1, 1, '#74c452'); block.rect(16, 13, 1, 1, '#74c452');
  block.rect(17, 13, 1, 3, '#86583a');
  const pot = new Tex(W, H);
  pot.rect(5, 13, 3, 3, '#ec4c42'); pot.rect(6, 12, 1, 1, '#dcecf4'); pot.rect(5, 13, 1, 1, '#ffd4cc');
  return compose(W * 2 + 2, H * 2 + 2, [{ t: posts, ol: INK }, { t: counter, ol: INK }, { t: awn, ol: INK }, { t: block, ol: INK }, { t: pot, ol: INK }]).canvas();
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

// ------------------------------------------------------------------ ev ici (0.2)
export function houseInterior() {
  const PW = GAME_W; const PH = GAME_H; const TW = PW / 2; const TH = PH / 2; const TG = GROUND_Y / 2;
  const layers = [];
  const wall = new Tex(TW, TH);
  const pl = ['#c0916a', '#b88964']; const gap = '#9a6e4c';
  for (let x = 0; x < TW; x++) wall.rect(x, 0, 1, TG, x % 7 === 6 ? gap : pl[Math.floor(x / 7) % 2]);
  // tavan kirisi ve supurgelik
  wall.rect(0, 0, TW, 6, '#8e6040'); wall.rect(0, 5, TW, 1, '#744c30');
  wall.rect(0, TG - 3, TW, 3, '#946446'); wall.rect(0, TG - 3, TW, 1, '#a87452');
  // zemin tahtalari
  const fl = ['#a8724a', '#9c6942'];
  for (let y = TG; y < TH; y++) {
    const row = Math.floor((y - TG) / 4);
    for (let x = 0; x < TW; x++) {
      let c = fl[row % 2];
      if ((y - TG) % 4 === 3) c = '#835634';
      if ((x + row * 11) % 26 === 0) c = '#835634';
      wall.set(x, y, c);
    }
  }
  layers.push({ t: wall });
  // pencere (disarisi gorunur)
  const win = new Tex(TW, TH);
  win.rect(150, 20, 22, 18, '#7e4e2e');
  win.rect(151, 21, 20, 16, '#a6dcf4'); win.rect(151, 31, 20, 6, '#c4e8f8');
  win.rrect(154, 24, 8, 3, '#ffffff', 1);
  win.rect(151, 33, 20, 4, '#7cc65e');
  win.rect(160, 21, 2, 16, '#7e4e2e'); win.rect(151, 28, 20, 1, '#7e4e2e');
  win.rect(148, 38, 26, 2, '#a87452');
  layers.push({ t: win, ol: INK });
  // raf ve kavanozlar
  const shelf = new Tex(TW, TH);
  shelf.rect(64, 34, 26, 2, '#8e6040'); shelf.rect(66, 36, 2, 3, '#744c30'); shelf.rect(86, 36, 2, 3, '#744c30');
  shelf.rect(67, 29, 4, 5, '#9ccce0'); shelf.rect(67, 28, 4, 1, '#c99a6a');
  shelf.rect(74, 30, 4, 4, '#e8564a'); shelf.rect(74, 29, 4, 1, '#c99a6a');
  shelf.rect(81, 28, 4, 6, '#ffd04d'); shelf.rect(81, 27, 4, 1, '#c99a6a');
  layers.push({ t: shelf, ol: INK });
  // asili fener
  const lamp = new Tex(TW, TH);
  lamp.rect(120, 6, 1, 8, '#4a4652'); lamp.rect(118, 14, 5, 6, '#ffd04d'); lamp.rect(118, 14, 5, 1, '#4a4652'); lamp.rect(119, 15, 1, 4, '#fff3b0');
  layers.push({ t: lamp, ol: INK });
  return compose(PW, PH, layers, 0).canvas();
}

export function doorInside() {
  const t = new Tex(14, 25);
  t.rect(0, 0, 14, 25, '#6e4428');
  t.rect(1, 1, 12, 24, '#8e5c36'); t.rect(7, 1, 1, 24, '#74482a'); t.rect(1, 12, 12, 1, '#74482a');
  t.rect(10, 13, 1, 2, '#ffd04d');
  return solo(t).canvas();
}

export function workbench() {
  const top = new Tex(24, 14);
  top.rect(0, 4, 24, 3, '#c99258'); top.rect(0, 6, 24, 1, '#a8743e');
  const legs = new Tex(24, 14);
  legs.rect(1, 7, 3, 7, '#9a6a40'); legs.rect(20, 7, 3, 7, '#9a6a40'); legs.rect(4, 10, 16, 2, '#8a5c36');
  const tools = new Tex(24, 14);
  // cekic
  tools.rect(4, 2, 6, 2, '#a9a5b2'); tools.rect(9, 2, 1, 2, '#8e8a98'); tools.rect(6, 0, 2, 2, '#9a6436');
  // testere
  tools.rect(13, 2, 9, 2, '#d8dce4'); tools.rect(13, 3, 9, 1, '#aab0bc'); tools.rect(11, 1, 3, 3, '#b8803e');
  return compose(50, 30, [{ t: legs, ol: INK }, { t: top, ol: INK }, { t: tools, ol: INK }]).canvas();
}

// Firin: 3 kare (0 = sonuk, 1-2 = yanan)
export function furnaceArt() {
  const fw = 42; const fh = 54;
  const out = new Pix(fw * 3, fh);
  for (let f = 0; f < 3; f++) {
    const body = new Tex(20, 26);
    const st = '#a9a5b2'; const stD = '#8e8a98'; const stL = '#bdb9c6';
    body.rrect(0, 6, 20, 20, st, 3);
    // tugla bantlari (duzenli)
    for (let y = 9; y < 26; y += 4) body.tint((x, yy) => (yy === y ? stD : null));
    for (let y = 9; y < 26; y += 4) for (let x = (y % 8 === 1 ? 3 : 7); x < 20; x += 8) body.rect(x, y - 3, 1, 3, stD);
    body.tint((x, y) => (!(body.get(x - 1, y) >>> 24) || !(body.get(x, y - 1) >>> 24) ? stL : null));
    const pipe = new Tex(20, 26);
    pipe.rect(13, 0, 4, 8, '#7a7684'); pipe.rect(12, 0, 6, 2, '#8e8a98');
    const mouth = new Tex(20, 26);
    mouth.rrect(5, 15, 10, 11, '#241f2c', 2);
    if (f > 0) {
      mouth.rect(6, 21, 8, 5, '#ff8a2e');
      mouth.rect(7 + (f % 2), 19, 2, 3, '#ffc23e'); mouth.rect(11 - (f % 2), 20, 2, 2, '#ffc23e');
      mouth.rect(8, 23, 4, 3, '#fff1a6');
    }
    const p = compose(fw, fh, [{ t: pipe, ol: INK }, { t: body, ol: INK }, { t: mouth }]);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const v = p.get(x, y); if (v) out.set(f * fw + x, y, v); }
  }
  return { canvas: out.canvas(), fw, fh };
}

// Simya kazani: 2 kare (kabarciklar)
export function cauldronArt() {
  const fw = 38; const fh = 34;
  const out = new Pix(fw * 2, fh);
  for (let f = 0; f < 2; f++) {
    const pot = new Tex(18, 16);
    pot.rrect(1, 5, 16, 9, '#3e3a48', 3); pot.rect(0, 4, 18, 2, '#56525f');
    pot.rect(3, 7, 2, 4, '#56525f');
    pot.rect(3, 14, 2, 2, '#3e3a48'); pot.rect(13, 14, 2, 2, '#3e3a48');
    const brew = new Tex(18, 16);
    brew.rect(2, 4, 14, 1, '#7ad65a'); brew.rect(5, 4, 3, 1, '#b4f08c');
    const bub = new Tex(18, 16);
    if (f === 0) { bub.rect(6, 2, 2, 2, '#9ae878'); bub.rect(11, 0, 1, 1, '#9ae878'); } else { bub.rect(10, 2, 2, 2, '#9ae878'); bub.rect(6, 0, 1, 1, '#9ae878'); }
    const p = compose(fw, fh, [{ t: pot, ol: INK }, { t: brew }, { t: bub, ol: INK }]);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const v = p.get(x, y); if (v) out.set(f * fw + x, y, v); }
  }
  return { canvas: out.canvas(), fw, fh };
}

export function bed() {
  const frame = new Tex(30, 12);
  frame.rect(0, 2, 3, 10, '#9a6a40'); frame.rect(27, 5, 3, 7, '#9a6a40'); frame.rect(0, 8, 30, 2, '#8a5c36');
  const sheet = new Tex(30, 12);
  sheet.rect(3, 5, 24, 3, '#d8544a'); sheet.rect(3, 5, 24, 1, '#ec6e60');
  const pillow = new Tex(30, 12);
  pillow.rrect(3, 3, 7, 3, '#f4efe4', 1);
  return compose(62, 26, [{ t: frame, ol: INK }, { t: sheet, ol: INK }, { t: pillow, ol: INK }]).canvas();
}

// ------------------------------------------------------------------ maden ocagi (0.2)
export const MINE_WALL = { x: 240, cols: 8, rows: 6, size: 16 };

export function caveBackground(depth = 1) {
  const PW = GAME_W; const PH = GAME_H; const TW = PW / 2; const TH = PH / 2; const TG = GROUND_Y / 2;
  const t = Math.min(1, (depth - 1) / 8);
  const C = dn(t);
  const r = rng(depth * 4421 + 9);
  const layers = [];
  const back = new Tex(TW, TH);
  const rock = C('#5a5468', '#3e3656'); const rockL = C('#666077', '#4a4166'); const rockD = C('#4a4458', '#302a44');
  back.rect(0, 0, TW, TH, rock);
  for (let i = 0; i < 26; i++) {
    const x = Math.floor(r() * TW); const y = Math.floor(r() * (TG - 6)); const w = 6 + Math.floor(r() * 10); const h = 3 + Math.floor(r() * 4);
    back.rrect(x, y, w, h, rockL, 1);
    back.rect(x + 1, y + h, w - 2, 1, rockD);
  }
  // tavan sarkitlari
  back.rect(0, 0, TW, 5, rockD);
  for (let x = 2; x < TW; x += 7 + Math.floor(r() * 6)) {
    const h = 2 + Math.floor(r() * 4);
    for (let j = 0; j < h; j++) back.rect(x + Math.floor(j / 2), 5 + j, Math.max(1, 3 - j), 1, rockD);
  }
  // duvar oyugu (kazilan bloklarin arkasi)
  const W = MINE_WALL;
  back.rect(W.x / 2 - 1, TG - (W.rows * W.size) / 2 - 1, (W.cols * W.size) / 2 + 2, (W.rows * W.size) / 2 + 1, C('#241f2c', '#18141f'));
  layers.push({ t: back });
  // zemin + raylar
  const fl = new Tex(TW, TH);
  fl.rect(0, TG, TW, TH - TG, C('#6a6478', '#463e5e'));
  fl.rect(0, TG, TW, 1, C('#7e788c', '#544a6e'));
  for (let x = 0; x < TW; x++) if ((x * 3) % 13 === 0) fl.rect(x, TG + 3 + (x % 3), 2, 1, C('#5a5468', '#3e3656'));
  layers.push({ t: fl, ol: 'dark', olF: 0.55 });
  const rail = new Tex(TW, TH);
  for (let x = 0; x < W.x / 2 - 4; x += 5) rail.rect(x, TG - 1, 3, 1, '#8a5c36');
  rail.rect(0, TG - 2, W.x / 2 - 4, 1, '#a9a5b2');
  layers.push({ t: rail, ol: INK });
  // ahsap maden iskeleti: iki direk + ust kiris, kirisin altinda iki fener
  const sup = new Tex(TW, TH);
  for (const px of [8, 96]) { sup.rect(px, 13, 3, TG - 13, '#9a6a40'); sup.rect(px + 2, 13, 1, TG - 13, '#7e5434'); }
  sup.rect(4, 10, 99, 3, '#a8743e'); sup.rect(4, 12, 99, 1, '#86592e');
  layers.push({ t: sup, ol: INK });
  const lamp = new Tex(TW, TH);
  for (const lx of [36, 70]) { lamp.rect(lx + 1, 13, 1, 3, '#4a4652'); lamp.rect(lx, 16, 3, 4, '#ffd04d'); lamp.rect(lx, 16, 3, 1, '#4a4652'); lamp.set(lx + 1, 18, '#fff3b0'); }
  layers.push({ t: lamp, ol: INK });
  const out = compose(PW, PH, layers, 0);
  return out.canvas();
}

// Cevher bloklari (16x16) yan yana: toprak, kum, tas, komur, demir, define + 3 catlak
export const ORE_FRAMES = ['toprak', 'kum', 'tas', 'komur', 'demir', 'define', 'crack1', 'crack2', 'crack3'];
export function oreSheet() {
  const S = 16;
  const out = new Pix(S * ORE_FRAMES.length, S);
  const base = {
    toprak: ['#9a6b4a', '#a87a58', '#83583a'],
    kum: ['#e6cd88', '#f2dfa6', '#d2b674'],
    tas: ['#929eaa', '#a4aebb', '#7c8794'],
  };
  const chunks = [[1, 1, 2, 1], [5, 2, 2, 2], [2, 5, 1, 2], [5, 6, 2, 1]];
  ORE_FRAMES.forEach((k, i) => {
    const t = new Tex(8, 8);
    if (k.startsWith('crack')) {
      const n = Number(k.slice(5));
      const ink = '#1a1620';
      t.rect(3, 3, 1, 2, ink); t.rect(4, 4, 1, 1, ink);
      if (n >= 2) { t.rect(2, 2, 1, 1, ink); t.rect(5, 5, 1, 1, ink); t.rect(5, 2, 1, 1, ink); }
      if (n >= 3) { t.rect(1, 1, 1, 1, ink); t.rect(6, 6, 1, 1, ink); t.rect(6, 1, 1, 1, ink); t.rect(1, 6, 1, 1, ink); t.rect(2, 5, 1, 1, ink); }
    } else {
      const [b, l, d] = base[k] || base.tas;
      t.rect(0, 0, 8, 8, b);
      // sade desen: birkac koyu ve acik leke (her blokta ayni, kumlanma yok)
      t.rect(1, 2, 2, 1, d); t.rect(5, 4, 2, 1, d); t.set(3, 6, d); t.set(6, 1, d);
      t.set(2, 4, l); t.set(5, 6, l); t.set(4, 1, l);
      const ore = { komur: ['#2a2630', '#5a5664'], demir: ['#e0a882', '#f4c8a4'], define: ['#ffd04d', '#fff3b0'] }[k];
      if (ore) {
        for (const [x, y, w, h] of chunks) { t.rect(x, y, w, h, ore[0]); }
        t.set(5, 2, ore[1]); t.set(1, 1, ore[1]);
      }
      if (k === 'define') { t.rect(2, 3, 4, 3, '#a8703a'); t.rect(2, 3, 4, 1, '#c88f4c'); t.set(4, 4, '#ffd04d'); }
    }
    const p = compose(S, S, [{ t }], 0);
    if (!k.startsWith('crack')) {
      // 1 piksellik koyu kenar: bloklar duvarda duzgun bir izgara olusturur
      const edge = pack(mul(hex((base[k] || base.tas)[2]), 0.62));
      for (let j = 0; j < S; j++) { p.set(j, S - 1, edge); p.set(S - 1, j, edge); }
    }
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const v = p.get(x, y); if (v) out.set(i * S + x, y, v); }
  });
  return { canvas: out.canvas(), fw: S, fh: S };
}

// kirilan bloktan sacilan parca (beyaz, oyunda renklendirilir)
export function chip() {
  const t = new Tex(2, 2);
  t.rect(0, 0, 2, 2, '#ffffff');
  return solo(t).canvas();
}

// Bonk Bombasi patlamasi: 4 kare
export function boomArt() {
  const fw = 52; const fh = 52;
  const out = new Pix(fw * 4, fh);
  const rings = [[6, '#fff3b0', '#ffc23e'], [10, '#ffc23e', '#ff8a2e'], [12, '#ff8a2e', '#9e9aa6'], [12, '#9e9aa6', '#7a7684']];
  rings.forEach(([rad, a, b], f) => {
    const t = new Tex(26, 26);
    t.ellipse(13, 13, rad, rad, b);
    t.ellipse(13, 13, rad * 0.6, rad * 0.6, a);
    if (f === 3) { t.ellipse(13, 13, rad * 0.45, rad * 0.45, null); t.ellipse(8, 8, 3, 3, null); }
    const p = compose(fw, fh, [{ t }], 0);
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const v = p.get(x, y); if (v) out.set(f * fw + x, y, v); }
  });
  return { canvas: out.canvas(), fw, fh };
}

// ------------------------------------------------------------------ toplanabilirler (0.2)
export function gatherNode(kind) {
  if (kind === 'herb') {
    const t = new Tex(11, 9);
    const g = '#6cbc4e'; const gD = '#4e9a3a';
    t.rect(5, 3, 1, 6, gD);
    t.rrect(1, 4, 4, 2, g, 1); t.rrect(6, 3, 4, 2, g, 1); t.rrect(2, 6, 4, 2, gD, 1); t.rrect(6, 6, 4, 2, gD, 1);
    const fl = new Tex(11, 9);
    fl.rect(4, 1, 1, 1, '#ffffff'); fl.rect(6, 0, 1, 1, '#ffffff'); fl.rect(5, 1, 1, 1, '#ffd95a'); fl.rect(8, 2, 1, 1, '#f4b4d4');
    return compose(24, 20, [{ t, ol: INK }, { t: fl, ol: INK }]).canvas();
  }
  if (kind === 'berry') {
    const t = new Tex(13, 10);
    t.rrect(0, 2, 13, 8, '#4e9a3a', 2); t.rect(2, 2, 8, 1, '#6cbc4e'); t.rect(1, 3, 3, 1, '#6cbc4e');
    const b = new Tex(13, 10);
    for (const [x, y] of [[3, 4], [7, 3], [9, 6], [5, 7], [2, 7]]) { b.rect(x, y, 1, 1, '#8a2a5a'); }
    for (const [x, y] of [[4, 5], [8, 4], [10, 7], [6, 6]]) { b.rect(x, y, 1, 1, '#d84a6a'); }
    return compose(28, 22, [{ t, ol: INK }, { t: b }]).canvas();
  }
  // dal yigini
  const t = new Tex(14, 6);
  t.rect(0, 4, 12, 1, '#a8743e'); t.rect(1, 5, 10, 1, '#86592e');
  t.rect(3, 2, 9, 1, '#b8844c'); t.rect(4, 3, 9, 1, '#96663a');
  t.rect(10, 1, 2, 1, '#7cc25a');
  return compose(30, 14, [{ t, ol: INK }]).canvas();
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
  cimen: [['............', '............', '..gggggggg..', '..gGgggGgg..', '..gdGgdgGg..', '..dddgddgd..', '..dDddddDd..', '..dddDdddd..', '..ddddddDd..', '..dDdddddd..', '............', '............'],
    { g: '#8cd060', G: '#62a844', d: '#a07150', D: '#7a5034' }],
  altin_elma: [['............', '......h.....', '.....hL.....', '...YYhYY....', '..YwYYYYY...', '..YwYYYYYo..', '..YYYYYYYo..', '..YYYYYYYo..', '...YYYYYo...', '....oooo....', '............', '............'],
    { Y: '#ffd04d', w: '#fff6c0', o: '#d29a22', h: '#7a4c2a', L: '#74c452' }],
  tilsim_can: [['............', '..s......s..', '...s....s...', '....s..s....', '....oooo....', '...oYYYYo...', '...oYrrYo...', '...orrrro...', '...oYrrYo...', '...oYYYYo...', '....oooo....', '............'],
    { s: '#dccc96', o: '#b07a2a', Y: '#ffd04d', r: '#ec4c42' }],
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
};
const PICK = ['............', '...DHHHHD...', '..HH....HH..', '.HD..h...DH.', '.D...h....D.', '.....h......', '.....h......', '.....h......', '.....h......', '.....h......', '.....h......', '............'];
const SWORD = ['............', '...........W', '..........WB', '.........WB.', '........WB..', '.......WB...', '..G...WB....', '...G.WB.....', '....G.......', '...h.G......', '..h...G.....', '.P..........'];
const CHESTPLATE = ['............', '.mmm....mmm.', '.mMMmmmmMMm.', '.mMMMMMMMMm.', '..mMMyMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mMMMMMMm..', '..mmmmmmmm..', '..dddddddd..', '............', '............'];

const iconCache = {};
export function iconUrl(name) {
  if (iconCache[name]) return iconCache[name];
  const def = ICONS[name] || ICONS.dal;
  let rows = def[0];
  if (!rows) {
    if (name.startsWith('kilic')) rows = SWORD;
    else if (name.startsWith('kazma')) rows = PICK;
    else if (name.startsWith('kask')) rows = ICONS.kask_yosun[0];
    else if (name.startsWith('bot')) rows = ICONS.bot_yosun[0];
    else rows = CHESTPLATE;
  }
  const p = new Pix(14, 14);
  p.map(rows, def[1], 1, 1);
  p.outline(INK);
  iconCache[name] = p.canvas().toDataURL();
  return iconCache[name];
}
