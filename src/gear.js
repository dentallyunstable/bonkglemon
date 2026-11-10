// 0.8.9: giydigin ekipman karakterin ustunde gorunur (Eren, 2026-11-10).
// tools/gen_partmap.py her karakter atlasi icin parts.png uretir: hangi piksel kask, goguslik,
// bot, kilic agzi, kazma ucu ya da yay. Burada o pikseller giyilen esyanin renkleriyle boyanir.
// Atlas bir kez tuvale cevrilir; ekipman degisince sadece tuval yeniden boyanip GPU'ya gonderilir.
import { ITEMS } from './data.js';
import { S } from './state.js';
import { gearRamp } from './art.js';

let base = null;   // orijinal atlas pikselleri
let parts = null;  // parca haritasi pikselleri
let canvas = null;
let ctx = null;
let lastKey = '';
let texRef = null;
let frames = null;

// sahne olusurken bir kez: 'char' atlasini tuval tabanli yapar
export function initGear(scene, atlasJson) {
  const img = scene.textures.get('char').getSourceImage();
  const pimg = scene.textures.exists('charparts') ? scene.textures.get('charparts').getSourceImage() : null;
  frames = atlasJson && atlasJson.frames;
  canvas = document.createElement('canvas');
  canvas.width = img.width; canvas.height = img.height;
  ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  base = ctx.getImageData(0, 0, canvas.width, canvas.height);
  if (pimg) {
    const c2 = document.createElement('canvas');
    c2.width = img.width; c2.height = img.height;
    const x2 = c2.getContext('2d');
    x2.drawImage(pimg, 0, 0);
    parts = x2.getImageData(0, 0, c2.width, c2.height).data;
  }
  scene.textures.remove('char');
  texRef = scene.textures.addAtlas('char', canvas, atlasJson);
  lastKey = '';
  refreshGear();
}

function ramps() {
  const e = S.save.equip;
  const r = (id) => (id && ITEMS[id] ? gearRamp(ITEMS[id].icon) : null);
  const w = e.silah && ITEMS[e.silah];
  const isBow = w && w.wt === 'yay';
  // 7: pelerin (0.9). Pelerin yoksa sirttaki pikseller goguslugun rengini alir (yoksa oldugu gibi kalir)
  return { 1: r(e.kask), 2: r(e.gogus), 3: r(e.bot), 4: isBow ? null : r(e.silah), 5: r(e.kazma), 6: isBow ? r(e.silah) : null, 7: r(e.pelerin) || r(e.gogus), 8: r(e.pelerin) };
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
  for (let i = 0; i < parts.length; i += 4) {
    if (!parts[i + 3]) continue;
    const ramp = R[Math.round(parts[i] / 30)];
    if (!ramp || !d[i + 3]) continue;
    const c = ramp[Math.min(3, Math.round(parts[i + 1] / 80))];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  ctx.putImageData(out, 0, 0);
  if (texRef) texRef.source[0].update();
}

// Canta ekraninda karakterin canli onizlemesi (giydigin her sey ustunde)
export function gearPreview(name = 'idle/0') {
  const f = frames && (frames[name] || frames['idle/0']);
  if (!canvas || !f) return null;
  refreshGear();
  const c = document.createElement('canvas');
  // ayak ortasi (pivot) cevresinde 36x44 piksellik bir kare
  c.width = 36; c.height = 44;
  const ox = Math.round(f.pivot.x * f.sourceSize.w) - 18, oy = Math.round(f.pivot.y * f.sourceSize.h) - 40;
  c.getContext('2d').drawImage(canvas, f.frame.x, f.frame.y, f.frame.w, f.frame.h, f.spriteSourceSize.x - ox, f.spriteSourceSize.y - oy, f.frame.w, f.frame.h);
  return c;
}
