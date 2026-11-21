// Plan v2 (Glemon yenileme): yeni bicimdeki (v: 2) Glemonlar icin yukleme, yuz karosu, huy, efekt.
// Eski bicimdeki turler bu dosyadaki yardimcilardan etkilenmez (hepsi v2 degilse hicbir sey yapmaz).
import { makeAnim, animDur } from './anim.js';

const ANIM_OF = {};   // anim anahtari -> { key, stage, name, shiny }
let GMETA = null;
const SKIP_IDLE = new Set(['uyku', 'bayilma', 'savunma', 'hazirlik']);

export const isV2 = (gmeta, key) => !!(gmeta && gmeta[key] && gmeta[key].v === 2);

// Sayfa ve kare: v2'de parlak ayri sayfa, kare 0; eskide alt sira (meta.n)
export function glemTex(gmeta, key, stage, shiny) {
  const st = gmeta[key].stages[stage];
  if (isV2(gmeta, key)) return [`gs_${key}_${stage}${shiny ? '_p' : ''}`, 0];
  return [`gs_${key}_${stage}`, shiny ? st.n : 0];
}

// Usta'nin eski kesirli olcegi (0.8 / 0.85 / 0.75) yalniz eski turlerde kalir
export const glemScale = (gmeta, key, oldScale) => (isV2(gmeta, key) ? 1 : oldScale);

// ---------------------------------------------------------------- tembel yukleme (plan 12.7)
// Her asama sayfasi ~0,6-1 MB ekran bellegi tutar; 70 turun hepsi birden ~350 MB olurdu. Bu yuzden acilista yalniz
// efekt sayfasi yuklenir; Glemon sayfalari gerektiginde (takim, ahir, bolgeye girerken) yuklenir, kullanilmayanlar atilir.
const MAX_SHEETS = 36;              // ayni anda bellekte en cok bu kadar govde sayfasi (normal + parlak ayri sayilir)
const pending = new Map();          // doku anahtari -> Promise
const lastUse = new Map();          // doku anahtari -> son kullanim zamani (LRU)
let GAME = null;

export function preloadV2(scene, gmeta) {
  GMETA = gmeta;
  GAME = scene.game;
  scene.load.spritesheet('glemfx', 'assets/glemons/fx.png', { frameWidth: 9, frameHeight: 9 });
  scene.load.json('glemfxjson', 'assets/glemons/fx.json');
}

export function createV2Anims(scene, gmeta) {
  GMETA = gmeta;
  GAME = scene.game;
  if (!scene.textures.exists('__glemph')) {
    const c = scene.textures.createCanvas('__glemph', 2, 2);
    if (c) c.refresh();
  }
}

function makeStageAnims(scene, k, s, sh) {
  const m = GMETA[k];
  const tex = `gs_${k}_${s}${sh ? '_p' : ''}`;
  for (const [a, an] of Object.entries(m.anims)) {
    const key = `g_${k}_${s}_${a}${sh ? '_p' : ''}`;
    makeAnim(scene, key, tex, an.durs, an.loop ? -1 : 0, an.start);
    ANIM_OF[key] = { key: k, stage: s, name: a, shiny: sh };
    if (an.loopFrom) {   // hazirlik: son kareler doner
      const k2 = `g_${k}_${s}_${a}2${sh ? '_p' : ''}`;
      makeAnim(scene, k2, tex, an.durs.slice(an.loopFrom), -1, an.start + an.loopFrom);
      ANIM_OF[k2] = { key: k, stage: s, name: a, shiny: sh, loopPart: an.loopFrom };
    }
  }
}

function loadSheet(scene, texKey, url, fw, fh) {
  if (scene.textures.exists(texKey)) return Promise.resolve(true);
  if (pending.has(texKey)) return pending.get(texKey);
  const ld = scene.load;
  const pr = new Promise((res) => {
    let done = false;
    const ok = () => { if (done) return; done = true; cleanup(); res(true); };
    const bad = (file) => { if (done || !file || file.key !== texKey) return; done = true; cleanup(); res(false); };
    const cleanup = () => { ld.off(`filecomplete-spritesheet-${texKey}`, ok); ld.off('loaderror', bad); pending.delete(texKey); };
    ld.on(`filecomplete-spritesheet-${texKey}`, ok);
    ld.on('loaderror', bad);
    ld.spritesheet(texKey, url, { frameWidth: fw, frameHeight: fh });
    if (!ld.isLoading()) ld.start();
  });
  pending.set(texKey, pr);
  return pr;
}

export function glemReady(scene, key, stage, shiny) {
  if (!isV2(GMETA, key)) return true;
  const tex = `gs_${key}_${stage}${shiny ? '_p' : ''}`;
  return scene.textures.exists(tex) && !!ANIM_OF[`g_${key}_${stage}_durma${shiny ? '_p' : ''}`];
}

// Bir turun bir asamasini (ve parlak sayfasini) yukler; hazir olunca cozulur.
export function ensureGlemon(scene, key, stage, shiny) {
  if (!isV2(GMETA, key) || !scene || !scene.sys) return Promise.resolve(true);
  const st = GMETA[key].stages[stage];
  if (!st) return Promise.resolve(false);
  const tex = `gs_${key}_${stage}${shiny ? '_p' : ''}`;
  lastUse.set(tex, Date.now());
  if (glemReady(scene, key, stage, shiny) && scene.textures.exists(`gy_${key}_${stage}`)) return Promise.resolve(true);
  const jobs = [
    loadSheet(scene, tex, `assets/glemons/${key}/${stage}${shiny ? '_p' : ''}.png`, st.w, st.h),
    loadSheet(scene, `gy_${key}_${stage}`, `assets/glemons/${key}/${stage}_yuz.png`, st.face.w, st.face.h),
  ];
  return Promise.all(jobs).then((r) => {
    if (!scene.sys || !r[0]) return false;
    makeStageAnims(scene, key, stage, !!shiny);
    evict(scene);
    return true;
  });
}

// Bir listeyi arka planda yukle: [[key, stage, shiny], ...]
export function glemPreload(scene, list) {
  return Promise.all((list || []).map(([k, s, sh]) => ensureGlemon(scene, k, s, sh)));
}

function texInUse(tex) {
  if (!GAME) return false;
  for (const sc of GAME.scene.getScenes(false)) {
    const list = sc.sys && sc.sys.displayList && sc.sys.displayList.list;
    if (!list) continue;
    for (const o of list) if (o.active && o.texture && o.texture.key === tex) return true;
  }
  return false;
}

function evict(scene) {
  const loaded = [...lastUse.keys()].filter((t) => scene.textures.exists(t));
  if (loaded.length <= MAX_SHEETS) return;
  loaded.sort((a, b) => lastUse.get(a) - lastUse.get(b));
  let extra = loaded.length - MAX_SHEETS;
  for (const tex of loaded) {
    if (extra <= 0) break;
    if (texInUse(tex) || pending.has(tex)) continue;
    const m = /^gs_(.+)_(\d)(_p)?$/.exec(tex);
    if (!m) continue;
    const [, k, s, p] = m;
    for (const [ak, info] of Object.entries(ANIM_OF)) {
      if (info.key === k && String(info.stage) === s && !!info.shiny === !!p) { scene.anims.remove(ak); delete ANIM_OF[ak]; }
    }
    scene.textures.remove(tex);
    lastUse.delete(tex);
    const other = `gs_${k}_${s}${p ? '' : '_p'}`;
    if (!scene.textures.exists(other) && scene.textures.exists(`gy_${k}_${s}`) && !texInUse(`gy_${k}_${s}`)) scene.textures.remove(`gy_${k}_${s}`);
    extra--;
  }
}

// Sprite olustur: sayfa yukluyse hemen; degilse gorunmez yer tutucu, yuklenince doku ve istenen animasyon gelir.
export function glemSprite(scene, x, y, key, stage, shiny) {
  const [tex, fr] = glemTex(GMETA, key, stage, shiny);
  if (!isV2(GMETA, key)) return scene.add.sprite(x, y, tex, fr);
  lastUse.set(`gs_${key}_${stage}${shiny ? '_p' : ''}`, Date.now());
  if (glemReady(scene, key, stage, shiny)) return scene.add.sprite(x, y, tex, fr);
  const s = scene.add.sprite(x, y, '__glemph');
  s._glemWait = true;
  const play0 = s.play;
  let want = null;
  s.play = function (k, ...a) { want = [k, a]; return this; };
  ensureGlemon(scene, key, stage, shiny).then((ok) => {
    if (!s.active || !ok) return;
    s.play = play0;
    s.setTexture(tex, fr);
    if (s.input && s.input.hitArea && s.input.hitArea.setTo) s.input.hitArea.setTo(0, 0, s.frame.realWidth, s.frame.realHeight);
    s._glemWait = false;
    if (want) s.play(want[0], ...want[1]);
    s.emit('glemready');
  });
  return s;
}

// v2 turde bu adli animasyon var mi? Yoksa yedek (eski davranis) anahtari kullanilir.
export function glemAnim(k, name, fallback) {
  const key = k(name);
  return ANIM_OF[key] ? key : k(fallback);
}

// ---------------------------------------------------------------- efekt parcaciklari (bolum 5.6)
export function glemFx(scene, x, y, name, { n = 1, spread = 10, rise = 14, dur = 700, scale = 1, depth = 30 } = {}) {
  if (!scene || !scene.textures.exists('glemfx')) return;
  const j = scene.cache.json.get('glemfxjson');
  const idx = j ? j.names.indexOf(name) : -1;
  if (idx < 0) return;
  for (let i = 0; i < n; i++) {
    const ox = (Math.random() - 0.5) * spread * scale;
    const img = scene.add.image(x + ox, y, 'glemfx', idx).setDepth(depth).setScale(scale);
    scene.tweens.add({
      targets: img, y: y - rise * scale * (0.7 + Math.random() * 0.6), x: x + ox * 1.4, alpha: 0,
      duration: dur * (0.8 + Math.random() * 0.4), delay: i * 70, ease: 'Sine.easeOut', onComplete: () => img.destroy(),
    });
  }
}

// ---------------------------------------------------------------- yuz karosu + huy + goz kirpma
// sprite'a baglanir; her karede yuz karosunu animasyonun kare konumuna oturtur.
// opts.state(): { sleep, defend, status: 'zehir'|'yanma'|'donma'|'sersem'|'karanlik' } (savas icin)
const STATUS_FACE = { zehir: 'uzgun', yanma: 'uzgun', donma: 'saskin', sersem: 'sersem', karanlik: 'kapali' };
const STATUS_FX = { zehir: 'kabarcik', yanma: 'alev', donma: 'buz', sersem: 'yildiz', karanlik: 'duman' };

export function attachGlemon(sprite, { key, stage, shiny, k, state = null, idle = true } = {}) {
  const gm = GMETA && GMETA[key];
  if (!gm || gm.v !== 2 || !sprite || !sprite.scene) return null;
  const scene = sprite.scene;
  let st = gm.stages[stage];
  const exprs = gm.exprs;
  let fk = `gy_${key}_${stage}`;
  const face = scene.add.image(sprite.x, sprite.y, scene.textures.exists(fk) ? fk : '__glemph', 0).setOrigin(0, 0).setVisible(false);
  const now = () => scene.time.now;
  const ctl = {
    sprite, face, key, stage, shiny, k, state, st, gm,
    over: null, overUntil: 0, fxKey: null, fxDone: false, rarAt: now() + 800 + Math.random() * 1500, ringAt: now() + 3000,
    blinkAt: now() + 2600 + Math.random() * 2600, blinkSeq: null,
    idleAt: now() + 4000 + Math.random() * 5000, fxAt: 0,
    setFace(name, ms) { this.over = name; this.overUntil = now() + (ms || 0); },
    // patron faz degisimi: ayni sprite yeni asamanin sayfasina gecer
    restage(s, k2) { stage = s; st = gm.stages[s]; fk = `gy_${key}_${s}`; this.stage = s; this.st = st; this.k = k2; k = k2; },
  };
  sprite._glem = ctl;
  const upd = () => {
    if (!sprite.active) { cleanup(); return; }
    if (sprite._glemWait) { face.setVisible(false); return; }
    if (face.texture.key !== fk) { if (!scene.textures.exists(fk)) { face.setVisible(false); return; } face.setTexture(fk, 0); }
    const t = now();
    const ca = sprite.anims && sprite.anims.currentAnim;
    const info = ca ? ANIM_OF[ca.key] : null;
    const fr = sprite.frame ? Number(sprite.frame.name) : 0;
    const s = state ? state() : null;
    // savunma (kabuk/diken) ve uyku: dururken kendiliginden gecer
    if (info && k) {
      if (s && s.sleep && info.name === 'durma') sprite.play(k('uyku'));
      else if (s && !s.sleep && info.name === 'uyku' && state) { sprite.play(k('durma')); ctl.setFace('saskin', 300); }
      else if (s && s.defend && info.name === 'durma') sprite.play(k('savunma'));
      else if (s && !s.defend && info.name === 'savunma') sprite.play(k('durma'));
      // huy: dururken 4-9 saniyede bir
      else if (idle && info.name === 'durma' && t > ctl.idleAt && !(s && s.status)) {
        ctl.idleAt = t + 4000 + Math.random() * 5000;
        sprite.play(k('huy'));
        sprite.once('animationcomplete', () => { if (sprite.active && sprite.anims.currentAnim && ANIM_OF[sprite.anims.currentAnim.key] && ANIM_OF[sprite.anims.currentAnim.key].name === 'huy') sprite.play(k('durma')); });
      }
    }
    // ifade secimi: zamanli > animasyonun karesi > durum > goz kirpma
    let ex = null;
    if (ctl.over && t < ctl.overUntil) ex = ctl.over;
    if (!ex && info) {
      const an = gm.anims[info.name];
      if (an.faces) ex = an.faces[fr - an.start] || null;
      if (info.name === 'uyku') ex = 'kapali';
    }
    if (!ex && s && s.status) ex = STATUS_FACE[s.status] || null;
    const noBlink = info && (info.name === 'uyku' || info.name === 'bayilma');
    if (!ex && !noBlink) {
      if (!ctl.blinkSeq && t > ctl.blinkAt) {
        const twice = Math.random() < 0.15;
        ctl.blinkSeq = { t0: t, steps: twice ? [60, 90, 60, 80, 60, 90, 60] : [60, 90, 60] };
      }
      if (ctl.blinkSeq) {
        const el = t - ctl.blinkSeq.t0;
        let acc = 0; let idx = -1;
        for (let i = 0; i < ctl.blinkSeq.steps.length; i++) { acc += ctl.blinkSeq.steps[i]; if (el < acc) { idx = i; break; } }
        if (idx < 0) { ctl.blinkSeq = null; ctl.blinkAt = t + 2600 + Math.random() * 2600; } else {
          const seq = ctl.blinkSeq.steps.length === 3 ? ['yarim', 'kapali', 'yarim'] : ['yarim', 'kapali', 'yarim', null, 'yarim', 'kapali', 'yarim'];
          ex = seq[idx];
        }
      }
    }
    // huy parcacigi (H2 silkelenme, H7 hapsirma): animasyonun fxAt karesinde bir kez
    if (info && ca) {
      const an = gm.anims[info.name];
      const rel = fr - (an ? an.start : 0);
      if (ctl.fxKey !== ca.key || rel < (ctl.fxFrame || 0)) { ctl.fxKey = ca.key; ctl.fxDone = false; }
      ctl.fxFrame = rel;
      if (an && an.fxAt != null && !ctl.fxDone && rel >= an.fxAt && sprite.visible) {
        ctl.fxDone = true;
        const sc = Math.abs(sprite.scaleX) > 1.5 ? 2 : 1;
        glemFx(scene, sprite.x, sprite.y - st.bodyH * Math.abs(sprite.scaleY) * 0.6, gm.fx.huy, { n: 3, spread: 14, scale: sc, depth: sprite.depth + 1 });
      }
    }
    // nadirlik (3.8): nadir parca 2 sn'de bir isildar, epik etrafinda parcacik, efsanevi + 6 sn'de bir isik halkasi
    const rar = gm.fx && gm.fx.nadir;
    if (rar && sprite.visible && sprite.alpha > 0.5 && t > ctl.rarAt && !(s && s.sleep)) {
      const sc = Math.abs(sprite.scaleX) > 1.5 ? 2 : 1;
      const bh = st.bodyH * Math.abs(sprite.scaleY); const bw = (st.bodyW || 20) * Math.abs(sprite.scaleX);
      if (rar === 'nadir') {
        ctl.rarAt = t + 2000;
        const g = st.glow;
        const left = sprite.x - sprite.originX * st.w * sprite.scaleX; const topY = sprite.y - sprite.originY * st.h * sprite.scaleY;
        const gx = g ? left + (sprite.flipX ? st.w - g[0] : g[0]) * sprite.scaleX : sprite.x + (Math.random() - 0.5) * bw * 0.6;
        const gy = g ? topY + g[1] * sprite.scaleY : sprite.y - bh * (0.5 + Math.random() * 0.4);
        glemFx(scene, gx, gy, 'yildiz', { n: 1, spread: 2, rise: 3, dur: 500, scale: sc, depth: sprite.depth + 1 });
      } else {
        ctl.rarAt = t + 1100 + Math.random() * 600;
        const ang = Math.random() * Math.PI * 2;
        glemFx(scene, sprite.x + Math.cos(ang) * bw * 0.55, sprite.y - bh * 0.5 + Math.sin(ang) * bh * 0.45, gm.fx.huy || 'yildiz',
          { n: 1, spread: 4, rise: 8, dur: 1100, scale: sc, depth: sprite.depth + (Math.sin(ang) > 0 ? 1 : -1) });
        if (rar === 'efsanevi' && t > ctl.ringAt) {
          ctl.ringAt = t + 6000;
          glemRing(scene, sprite.x, sprite.y - bh * 0.5, Math.max(bw, bh) / 9, sprite.depth - 1);
        }
      }
    }
    // durum efekti parcaciklari
    if (s && (s.status || s.sleep) && t > ctl.fxAt && sprite.visible) {
      ctl.fxAt = t + (s.sleep ? 900 : 650);
      const top = sprite.y - st.ay * Math.abs(sprite.scaleY) + (st.ay - st.bodyH) * Math.abs(sprite.scaleY);
      glemFx(scene, sprite.x, top, s.sleep ? 'z' : STATUS_FX[s.status], { scale: Math.abs(sprite.scaleX) > 1.5 ? 2 : 1, depth: sprite.depth + 1 });
    }
    const pos = st.face.pos[fr];
    if (!ex || ex === 'normal' || !pos || !sprite.visible || sprite.alpha <= 0) { face.setVisible(false); return; }
    const sx = sprite.scaleX; const sy = sprite.scaleY;
    const left = sprite.x - sprite.originX * st.w * sx;
    const topY = sprite.y - sprite.originY * st.h * sy;
    const px = sprite.flipX ? st.w - pos[0] - st.face.w : pos[0];
    face.setFrame(exprs.indexOf(ex) + (shiny ? exprs.length : 0))
      .setPosition(left + px * sx, topY + pos[1] * sy).setScale(sx, sy).setFlipX(sprite.flipX)
      .setDepth(sprite.depth + 0.01).setAlpha(sprite.alpha).setVisible(true);
    if (sprite.isTinted) face.setTint(sprite.tintTopLeft); else face.clearTint();
  };
  const cleanup = () => {
    scene.events.off('postupdate', upd);
    if (face.active) face.destroy();
  };
  scene.events.on('postupdate', upd);
  sprite.once('destroy', cleanup);
  return ctl;
}

// Efsanevi: govdenin arkasinda buyuyup sonen yumusak isik halkasi
export function glemRing(scene, x, y, size, depth) {
  const j = scene.cache.json.get('glemfxjson');
  const idx = j ? j.names.indexOf('isik_halkasi') : -1;
  if (idx < 0) return;
  const img = scene.add.image(x, y, 'glemfx', idx).setDepth(depth).setScale(size * 0.4).setAlpha(0.7);
  scene.tweens.add({ targets: img, scale: size * 1.3, alpha: 0, duration: 1200, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
}

// A6 firlatma: mermi saldirandan hedefe ucar, sonra patlar
export function glemShot(scene, x0, y0, x1, y1, name, { scale = 2, depth = 40, dur = 220 } = {}) {
  const j = scene.cache.json.get('glemfxjson');
  const idx = j ? j.names.indexOf(name) : -1;
  if (idx < 0) return;
  const img = scene.add.image(x0, y0, 'glemfx', idx).setDepth(depth).setScale(scale);
  scene.tweens.add({ targets: img, x: x1, y: y1, angle: 360, duration: dur, ease: 'Quad.easeIn',
    onComplete: () => { img.destroy(); glemFx(scene, x1, y1, name, { n: 3, spread: 14, rise: 10, scale, dur: 450, depth }); } });
}

// A9 ufleme: agizdan hedefe dogru genisleyen koni seklinde parcacik
export function glemCone(scene, x0, y0, x1, y1, name, { scale = 2, depth = 40, n = 7 } = {}) {
  const j = scene.cache.json.get('glemfxjson');
  const idx = j ? j.names.indexOf(name) : -1;
  if (idx < 0) return;
  const dx = x1 - x0; const dy = y1 - y0; const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len; const ny = dx / len;
  for (let i = 0; i < n; i++) {
    const sp = (i / (n - 1) - 0.5) * len * 0.55;
    const img = scene.add.image(x0, y0, 'glemfx', idx).setDepth(depth).setScale(scale * 0.6).setAlpha(0.95);
    scene.tweens.add({ targets: img, x: x1 + nx * sp, y: y1 + ny * sp, scale, alpha: 0, delay: i * 25,
      duration: 320 + Math.random() * 120, ease: 'Sine.easeOut', onComplete: () => img.destroy() });
  }
}

// Kafa kaymasi (aksesuar bagi icin): animasyonun bu karesindeki yuz konumu - ilk kare
export function glemHeadOffset(sprite) {
  const c = sprite && sprite._glem;
  if (!c) return [0, 0];
  const fr = sprite.frame ? Number(sprite.frame.name) : 0;
  const p = c.st.face.pos[fr]; const p0 = c.st.face.pos[0];
  if (!p || !p0) return [0, 0];
  return [p[0] - p0[0], p[1] - p0[1]];
}

// Yuz konumundan aksesuar bagi (yakanin yeri): eski formul yerine
export function accAnchor(gmeta, key, stage, meta) {
  if (!isV2(gmeta, key)) return null;
  const p0 = meta.face.pos[0];
  return { fy: meta.ay - (p0[1] + meta.face.h), fx: meta.ax - (p0[0] + meta.face.w / 2) };
}

// Bir kez mutlu (evcilleşme, beslenme, dokunma, zafer); bitince durmaya doner
export function glemHappy(sprite) {
  const c = sprite && sprite._glem;
  if (!c || !c.k) return false;
  sprite.play(c.k('mutlu'));
  glemFx(sprite.scene, sprite.x, sprite.y - c.st.bodyH * Math.abs(sprite.scaleY), 'kalp', { n: 2, scale: Math.abs(sprite.scaleX) > 1.5 ? 2 : 1, depth: sprite.depth + 1 });
  sprite.once('animationcomplete', () => { if (sprite.active) { c.setFace('mutlu', 400); sprite.play(c.k('durma')); } });
  return true;
}

export { animDur };
