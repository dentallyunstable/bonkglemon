// Animasyon yardimcilari: Promise ile "bitince devam et" yazabilmek icin.
export const animDur = {}; // anim anahtari -> toplam sure (ms)

export function makeAnim(scene, key, sheet, durations, repeat = 0, start = 0) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: durations.map((d, i) => ({ key: sheet, frame: start + i, duration: Math.max(0, d - 1) })),
    frameRate: 1000,
    repeat,
  });
  animDur[key] = durations.reduce((a, b) => a + b, 0);
}

export function wait(scene, ms) {
  return new Promise((res) => scene.time.delayedCall(ms, res));
}

// Atlas karelerinden animasyon (karakterler)
export function makeAnimFrames(scene, key, tex, names, durations, repeat = 0) {
  if (scene.anims.exists(key)) return;
  scene.anims.create({
    key,
    frames: names.map((n, i) => ({ key: tex, frame: n, duration: Math.max(0, durations[i] - 1) })),
    frameRate: 1000,
    repeat,
  });
  animDur[key] = durations.reduce((a, b) => a + b, 0);
}

// Animasyonu oynat; dongusel degilse bitince cozulur.
export function playAnim(sprite, key, timeScale = 1) {
  return new Promise((resolve) => {
    const scene = sprite.scene;
    const anim = scene && scene.anims.get(key);
    if (!anim) { resolve(); return; }
    sprite.play({ key, timeScale });
    if (anim.repeat === -1) { resolve(); return; }
    let done = false;
    const ev = 'animationcomplete-' + key;
    const finish = () => {
      if (done) return;
      done = true;
      sprite.off(ev, finish);
      resolve();
    };
    sprite.once(ev, finish);
    scene.time.delayedCall((animDur[key] || 1000) / timeScale + 300, finish);
  });
}

// Bir noktaya yuru/kos
export function moveTo(sprite, x, { speed = 70, anim = null, flip = true, ease = 'Linear', timeScale = 1 } = {}) {
  return new Promise((resolve) => {
    const scene = sprite.scene;
    if (sprite._moveTween) { sprite._moveTween.stop(); sprite._moveTween = null; }
    const dist = Math.abs(x - sprite.x);
    if (dist < 0.5) { resolve(); return; }
    // Glemonlar varsayilan olarak sola bakar (flip: 'left')
    if (flip === 'left') sprite.setFlipX(x > sprite.x);
    else if (flip) sprite.setFlipX(x < sprite.x);
    if (anim) sprite.play({ key: anim, timeScale }, true);
    sprite._moveTween = scene.tweens.add({
      targets: sprite, x, duration: (dist / speed) * 1000, ease,
      onComplete: () => { sprite._moveTween = null; resolve(); },
      onStop: () => { sprite._moveTween = null; resolve(); },
    });
  });
}
