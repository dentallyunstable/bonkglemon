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

export function preloadV2(scene, gmeta) {
  GMETA = gmeta;
  scene.load.spritesheet('glemfx', 'assets/glemons/fx.png', { frameWidth: 9, frameHeight: 9 });
  scene.load.json('glemfxjson', 'assets/glemons/fx.json');
  for (const [k, m] of Object.entries(gmeta)) {
    if (m.v !== 2) continue;
    m.stages.forEach((st, s) => {
      scene.load.spritesheet(`gs_${k}_${s}`, `assets/glemons/${k}/${s}.png`, { frameWidth: st.w, frameHeight: st.h });
      scene.load.spritesheet(`gs_${k}_${s}_p`, `assets/glemons/${k}/${s}_p.png`, { frameWidth: st.w, frameHeight: st.h });
      scene.load.spritesheet(`gy_${k}_${s}`, `assets/glemons/${k}/${s}_yuz.png`, { frameWidth: st.face.w, frameHeight: st.face.h });
    });
  }
}

export function createV2Anims(scene, gmeta) {
  GMETA = gmeta;
  for (const [k, m] of Object.entries(gmeta)) {
    if (m.v !== 2) continue;
    m.stages.forEach((st, s) => {
      for (const [a, an] of Object.entries(m.anims)) {
        for (const sh of [false, true]) {
          const key = `g_${k}_${s}_${a}${sh ? '_p' : ''}`;
          makeAnim(scene, key, `gs_${k}_${s}${sh ? '_p' : ''}`, an.durs, an.loop ? -1 : 0, an.start);
          ANIM_OF[key] = { key: k, stage: s, name: a, shiny: sh };
          if (an.loopFrom) {   // hazirlik: son kareler doner
            const k2 = `g_${k}_${s}_${a}2${sh ? '_p' : ''}`;
            makeAnim(scene, k2, `gs_${k}_${s}${sh ? '_p' : ''}`, an.durs.slice(an.loopFrom), -1, an.start + an.loopFrom);
            ANIM_OF[k2] = { key: k, stage: s, name: a, shiny: sh, loopPart: an.loopFrom };
          }
        }
      }
    });
  }
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
  const st = gm.stages[stage];
  const exprs = gm.exprs;
  const face = scene.add.image(sprite.x, sprite.y, `gy_${key}_${stage}`, 0).setOrigin(0, 0).setVisible(false);
  const now = () => scene.time.now;
  const ctl = {
    sprite, face, key, stage, shiny, k, state, st, gm,
    over: null, overUntil: 0,
    blinkAt: now() + 2600 + Math.random() * 2600, blinkSeq: null,
    idleAt: now() + 4000 + Math.random() * 5000, fxAt: 0,
    setFace(name, ms) { this.over = name; this.overUntil = now() + (ms || 0); },
  };
  sprite._glem = ctl;
  const upd = () => {
    if (!sprite.active) { cleanup(); return; }
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
