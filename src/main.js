// Bonkglemon giris noktasi: verileri yukle, giris ekranini goster, oyunu baslat.
import { GAME_W, GAME_H, CHARACTERS } from './data.js';
import { S } from './state.js';
import { $, show } from './ui.js';
import { setSound, stopMusic } from './audio.js';
import { showLogin } from './login.js';
import { makeAnim, makeAnimFrames } from './anim.js';
import { WorldScene } from './world.js';
import * as ART from './art.js';
import { block, BLOCK_NAMES } from './blocks.js';
import { Pix } from './pix.js';

const LOOPING = new Set(['idle', 'idlesway', 'walk', 'run', 'sprint', 'ninjadash', 'ninjarun', 'sneakwalk', 'blockwalk', 'sit',
  'sneakspam', 'walkin', 'b_idlesway', 'b_ninjarun', 'b_run']);
let BOOT = null;

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const { char, gmeta } = BOOT;
    this.load.on('progress', (v) => { $('#loading').textContent = `Yükleniyor… %${Math.round(v * 100)}`; });
    // butun karakter kareleri tek atlasta; her karenin pivotu ayak ortasi
    this.load.atlas('char', `assets/chars/${char}/atlas.png`, `assets/chars/${char}/atlas.json`);
    for (const [k, m] of Object.entries(gmeta)) {
      for (const a of Object.keys(m.anims)) {
        this.load.spritesheet(`g_${k}_${a}`, `assets/glemons/${k}/${a}.png`, { frameWidth: m.w, frameHeight: m.h });
        this.load.spritesheet(`g_${k}_${a}_p`, `assets/glemons/${k}/${a}_parlak.png`, { frameWidth: m.w, frameHeight: m.h });
      }
    }
  }

  create() {
    const { charMeta, gmeta } = BOOT;
    for (const [a, m] of Object.entries(charMeta.anims)) {
      makeAnimFrames(this, `c_${a}`, 'char', m.frames, m.durations, LOOPING.has(a) ? -1 : 0);
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
    tex('bg_plot', ART.forestBackground(1, 3, true));
    // 0.3: arsada tek tek konan bloklar (her blok bir kare, adiyla)
    if (!this.textures.exists('blocks')) {
      const sheet = new Pix(16 * BLOCK_NAMES.length, 16);
      BLOCK_NAMES.forEach((n, i) => sheet.draw(block(n), i * 16, 0, 16));
      const bt = this.textures.addCanvas('blocks', sheet.canvas());
      BLOCK_NAMES.forEach((n, i) => bt.add(n, 0, i * 16, 0, 16, 16));
    }
    tex('cabin', ART.cabin());
    tex('mine', ART.mineEntrance());
    tex('signpost', ART.signpost());
    tex('stall', ART.stall());
    tex('chest', ART.chest(false));
    tex('chest_open', ART.chest(true));
    tex('spikes', ART.spikes());
    tex('stairs', ART.stairsDown());
    tex('slash', ART.slash());
    tex('shadow', ART.shadow());
    // yan yana karelerden olusan dokular
    const strip = (key, art, names) => {
      if (this.textures.exists(key)) return;
      const t = this.textures.addCanvas(key, art.canvas);
      const n = Math.round(art.canvas.width / art.fw);
      for (let i = 0; i < n; i++) t.add(names ? names[i] : i, 0, i * art.fw, 0, art.fw, art.fh);
    };
    const loop = (key, tex, frames, rate) => this.anims.create({ key, frames: frames.map((i) => ({ key: tex, frame: i })), frameRate: rate, repeat: -1 });
    strip('fire', ART.campfire());
    loop('fire', 'fire', [0, 1, 2], 7);
    // 0.2: ev ici, maden ocagi, toplama
    tex('house', ART.houseInterior());
    tex('door_in', ART.doorInside());
    tex('workbench', ART.workbench());
    tex('bed', ART.bed());
    strip('furnace', ART.furnaceArt());
    loop('furnace_on', 'furnace', [1, 2], 6);
    strip('cauldron', ART.cauldronArt());
    loop('cauldron', 'cauldron', [0, 1], 3);
    strip('ores', ART.oreSheet(), ART.ORE_FRAMES);
    strip('boom', ART.boomArt());
    this.anims.create({ key: 'boom', frames: [0, 1, 2, 3].map((i) => ({ key: 'boom', frame: i })), frameRate: 12, repeat: 0 });
    tex('chip', ART.chip());
    for (const k of ['herb', 'berry', 'branch']) tex(`node_${k}`, ART.gatherNode(k));
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
  stopMusic();
  setSound(S.save.settings.sound);
  BOOT = { char, charMeta: charMeta[char], gmeta };
  $('#loading').textContent = 'Yükleniyor…';
  show('#loading', true);
  // oyun suresi sayaci
  setInterval(() => {
    if (document.hidden || !S.save) return;
    S.save.stats.playMs += 30000;
    S.save.lastSeen = Date.now();
    S.persist();
  }, 30000);
  // eslik: sekme kapanirken kaydet
  window.addEventListener('pagehide', () => { S.save.lastSeen = Date.now(); S.persist(); });
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
