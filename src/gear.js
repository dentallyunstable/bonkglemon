// Giydigin ekipman karakterin ustunde gorunur (0.8.9, 0.10.1 ve 0.13.1'de yeniden: Eren, 2026-11-10).
// 0.13.1: kask bakis acisina gore cizilir; eldeki esyalar boyanmaz; aletler sadece kendi animasyonunda.
// tools/gen_gearmap.py her karakter icin gear.png (kask, goguslik, bot, silah) ve cape.png
// (pelerin) uretir. Skin degismez: zirh, karakterin ustune ayri bir piksel katmani olarak
// cizilir ve siluetten 1 piksel tasar. Silahlar animasyonda cizili oldugu icin boyanir.
import { ITEMS } from './data.js';
import { S } from './state.js';
import { gearRamp } from './art.js';

let base = null;   // karakterin bosluklu yerlesimdeki orijinal pikselleri
let parts = null;  // ekipman katmani sekli (kask, goguslik, bot, silah)
let cape = null;   // pelerin katmani (goguslugun ustune)
let canvas = null;
let ctx = null;
let lastKey = '';
let texRef = null;
let frames = null;

function pixels(scene, key) {
  if (!scene.textures.exists(key)) return null;
  const img = scene.textures.get(key).getSourceImage();
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0);
  return x.getImageData(0, 0, c.width, c.height).data;
}

// 0.10.1: zirh skinin USTUNE ayri katman (Eren). Her kare 2 piksel bosluklu yeni bir
// yerlesime kopyalanir (zirh siluetten tasabilsin), sonra giyili esyalar ustune cizilir.
export function initGear(scene, gearJson) {
  const img = scene.textures.get('char').getSourceImage();
  frames = gearJson && gearJson.frames;
  if (!frames) return;
  canvas = document.createElement('canvas');
  canvas.width = gearJson.meta.size.w; canvas.height = gearJson.meta.size.h;
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  const pad = gearJson.meta.pad;
  for (const f of Object.values(frames)) {
    const p = f.pad != null ? f.pad : pad;   // 1.0.3: eklenen aletli karelerin kenari daha genis
    ctx.drawImage(img, f.src.x, f.src.y, f.src.w, f.src.h, f.frame.x + p, f.frame.y + p, f.src.w, f.src.h);
  }
  base = ctx.getImageData(0, 0, canvas.width, canvas.height);
  parts = pixels(scene, 'chargear');
  cape = pixels(scene, 'chargearcape');
  scene.textures.remove('char');
  texRef = scene.textures.addAtlas('char', canvas, { frames: gearJson.frames, meta: { scale: 1 } });
  lastKey = '';
  refreshGear();
}

function ramps() {
  const e = S.save.equip;
  const r = (id) => (id && ITEMS[id] ? gearRamp(ITEMS[id].icon) : null);
  const w = e.silah && ITEMS[e.silah];
  const isBow = w && w.wt === 'yay';
  // 7: pelerin (0.9). Pelerin yoksa sirttaki pikseller goguslugun rengini alir (yoksa oldugu gibi kalir)
  const isStaff = w && w.wt === 'asa';
  const sword = isBow || isStaff ? null : r(e.silah);
  // 9-11 (1.0.3): animasyonda olmayan aletler katmana eklenir: doner kesikte kilic,
  // savasta arkadan yay ve asa ile buyu (b_cast)
  return { 1: r(e.kask), 2: r(e.gogus), 3: r(e.bot), 4: sword, 5: r(e.kazma), 6: isBow ? r(e.silah) : null, 7: r(e.pelerin), 8: r(e.pelerin), 9: sword, 10: isBow ? r(e.silah) : null, 11: isStaff ? r(e.silah) : null };
}

export function gearKey() {
  const e = S.save && S.save.equip;
  return e ? [e.kask, e.gogus, e.bot, e.silah, e.kazma, e.pelerin].join('|') : '';
}

// ekipman degistiyse atlasi yeniden boya
export function refreshGear() {
  if (!canvas || !parts || !S.save) return;
  const key = gearKey();
  if (key === lastKey) return;
  lastKey = key;
  const R = ramps();
  const out = new ImageData(new Uint8ClampedArray(base.data), base.width, base.height);
  const d = out.data;
  const paint = (M) => {
    if (!M) return;
    for (let i = 0; i < M.length; i += 4) {
      if (!M[i + 3]) continue;
      const k = Math.round(M[i] / 20);
      const ramp = R[k];
      if (!ramp) continue;
      // animasyondaki silah pikselleri sadece kendi yerinde boyanir; zirh ve eklenen aletler bos piksele de cizilir
      if (k >= 4 && k <= 6 && !d[i + 3]) continue;
      const c = M[i + 2] === 255 ? ramp[0].map((v) => Math.round(v * 0.42)) : ramp[Math.min(ramp.length - 1, Math.round(M[i + 1] / 60))];
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
  };
  paint(parts);
  paint(cape);
  ctx.putImageData(out, 0, 0);
  if (texRef) texRef.source[0].update();
}

// Canta ekraninda karakterin canli onizlemesi (giydigin her sey ustunde)
export function gearPreview(name = 'idle/0') {
  const f = frames && (frames[name] || frames['idle/0']);
  if (!canvas || !f) return null;
  refreshGear();
  const c = document.createElement('canvas');
  // ayak ortasi (pivot) cevresinde 40x46 piksellik bir kare
  c.width = 40; c.height = 46;
  const ox = Math.round(f.pivot.x * f.sourceSize.w) - 20, oy = Math.round(f.pivot.y * f.sourceSize.h) - 42;
  c.getContext('2d').drawImage(canvas, f.frame.x, f.frame.y, f.frame.w, f.frame.h, f.spriteSourceSize.x - ox, f.spriteSourceSize.y - oy, f.frame.w, f.frame.h);
  return c;
}
