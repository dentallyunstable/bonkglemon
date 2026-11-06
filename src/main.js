// Bonkglemon giris noktasi: verileri yukle, giris ekranini goster, oyunu baslat.
import { GAME_W, GAME_H, CHARACTERS, CHAR_ANIMS } from './data.js';
import { S } from './state.js';
import { $, show } from './ui.js';
import { setSound } from './audio.js';
import { showLogin } from './login.js';
import { makeAnim } from './anim.js';
import { WorldScene } from './world.js';
import * as ART from './art.js';

const LOOPING = new Set(['idle', 'walk', 'run', 'sneakwalk', 'sit', 'ninjadash']);
let BOOT = null;

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const { char, gmeta } = BOOT;
    this.load.on('progress', (v) => { $('#loading').textContent = `Yükleniyor… %${Math.round(v * 100)}`; });
    for (const a of CHAR_ANIMS) {
      this.load.spritesheet(`c_${a}`, `assets/chars/${char}/side/${a}.png`, { frameWidth: 67, frameHeight: 76 });
    }
    for (const [k, m] of Object.entries(gmeta)) {
      for (const a of Object.keys(m.anims)) {
        this.load.spritesheet(`g_${k}_${a}`, `assets/glemons/${k}/${a}.png`, { frameWidth: m.w, frameHeight: m.h });
        this.load.spritesheet(`g_${k}_${a}_p`, `assets/glemons/${k}/${a}_parlak.png`, { frameWidth: m.w, frameHeight: m.h });
      }
    }
  }

  create() {
    const { charMeta, gmeta } = BOOT;
    for (const a of CHAR_ANIMS) {
      const meta = charMeta[`side/${a}`];
      if (meta) makeAnim(this, `c_${a}`, `c_${a}`, meta.durations, LOOPING.has(a) ? -1 : 0);
    }
    for (const [k, m] of Object.entries(gmeta)) {
      for (const [a, durs] of Object.entries(m.anims)) {
        const loop = a === 'durma' || a === 'yurume' ? -1 : 0;
        makeAnim(this, `g_${k}_${a}`, `g_${k}_${a}`, durs, loop);
        makeAnim(this, `g_${k}_${a}_p`, `g_${k}_${a}_p`, durs, loop);
      }
    }
    const tex = (key, canvas) => { if (!this.textures.exists(key)) this.textures.addCanvas(key, canvas); };
    tex('bg_base', ART.forestBackground(1, 0, true));
    tex('cabin', ART.cabin());
    tex('mine', ART.mineEntrance());
    tex('signpost', ART.signpost());
    tex('chest', ART.chest(false));
    tex('chest_open', ART.chest(true));
    tex('spikes', ART.spikes());
    tex('stairs', ART.stairsDown());
    tex('slash', ART.slash());
    tex('shadow', ART.shadow());
    const fire = ART.campfire();
    const ft = this.textures.addCanvas('fire', fire.canvas);
    for (let i = 0; i < 3; i++) ft.add(i, 0, i * fire.fw, 0, fire.fw, fire.fh);
    this.anims.create({ key: 'fire', frames: [0, 1, 2].map((i) => ({ key: 'fire', frame: i })), frameRate: 7, repeat: -1 });
    this.scene.start('world', { gmeta, charMeta });
  }
}

async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url);
  return r.json();
}

function startGame(char, charMeta, gmeta) {
  S.load(char);
  window.__S = S; // testler icin
  setSound(S.save.settings.sound);
  BOOT = { char, charMeta: charMeta[char], gmeta };
  $('#loading').textContent = 'Yükleniyor…';
  show('#loading', true);
  // oyun suresi sayaci
  setInterval(() => {
    if (document.hidden || !S.save) return;
    S.save.stats.playMs += 30000;
    S.persist();
  }, 30000);
  // eslik: sekme kapanirken kaydet
  window.addEventListener('pagehide', () => S.persist());
  new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: '#14121c',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 2 },
    scene: [BootScene, WorldScene],
  });
}

async function main() {
  try {
    const gmeta = await loadJson('assets/glemons/glemons.json');
    const charMeta = {};
    await Promise.all(CHARACTERS.map(async (c) => { charMeta[c.key] = await loadJson(`assets/chars/${c.key}/anims.json`); }));
    show('#loading', false);
    showLogin(charMeta, (char) => startGame(char, charMeta, gmeta));
  } catch (e) {
    console.error(e);
    $('#loading').textContent = 'Oyun dosyaları yüklenemedi. Sayfayı yenile.';
  }
}

main();
