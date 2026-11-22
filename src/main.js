// Bonkglemon giris noktasi: verileri yukle, giris ekranini goster, oyunu baslat.
import { GAME_W, GAME_H, CHARACTERS } from './data.js';
import { S } from './state.js';
import { $, show } from './ui.js';
import { setSound, stopMusic, pauseMusic } from './audio.js';
import { showLogin } from './login.js';
import { makeAnim, makeAnimFrames } from './anim.js';
import { preloadV2, createV2Anims, loadGlemIcons } from './glemon2.js';
import { WorldScene } from './world.js';
import * as ART from './art.js';
import { block, BLOCK_NAMES } from './blocks.js';
import { Pix } from './pix.js';
import { initGear, refreshGear } from './gear.js';
import { now as gNow } from './clock.js';

const LOOPING = new Set(['idle', 'idlesway', 'walk', 'run', 'sprint', 'ninjadash', 'ninjarun', 'sneakwalk', 'blockwalk', 'sit',
  'sneakspam', 'walkin', 'fish_idle', 'fish_reel', 'b_idlesway', 'b_ninjarun', 'b_run']);
let BOOT = null;
// K3: test kapilari sadece gelistirme kopyasinda acik; build_artifact.py __DEV__=false koyar
// eslint-disable-next-line no-undef
const DEV = typeof __DEV__ === 'undefined' ? true : __DEV__;

class BootScene extends Phaser.Scene {
  constructor() { super('boot'); }

  preload() {
    const { char, gmeta } = BOOT;
    this.load.on('progress', (v) => { $('#loading').textContent = `Yükleniyor… %${Math.round(v * 100)}`; });
    // butun karakter kareleri tek atlasta; her karenin pivotu ayak ortasi
    this.load.spritesheet('hanci', 'assets/npc/hanci.png', { frameWidth: BOOT.npc.w, frameHeight: BOOT.npc.h });
    this.load.spritesheet('tuccar', 'assets/npc/tuccar.png', { frameWidth: BOOT.npc.w, frameHeight: BOOT.npc.h }); // 0.9 Gezgin Tuccar
    this.load.atlas('char', `assets/chars/${char}/atlas.png`, `assets/chars/${char}/atlas.json`);
    // 0.8.9: ekipmanin karakter ustunde gorunmesi icin parca haritasi
    this.load.image('chargear', `assets/chars/${char}/gear.png`);
    this.load.image('chargearcape', `assets/chars/${char}/cape.png`);
    this.load.json('chargearjson', `assets/chars/${char}/gear.json`);
    // 0.4: her Glemon ve evrim asamasi tek resim: ust sira normal, alt sira parlak
    for (const [k, m] of Object.entries(gmeta)) {
      if (m.v === 2) continue; // Plan v2 bicimi: glemon2.js yukler (16 sutunlu izgara, ayri parlak sayfa, yuz karolari)
      m.stages.forEach((st, s) => this.load.spritesheet(`gs_${k}_${s}`, `assets/glemons/${k}/${s}.png`, { frameWidth: st.w, frameHeight: st.h }));
    }
    preloadV2(this, gmeta);
  }

  create() {
    const { charMeta, gmeta } = BOOT;
    try { initGear(this, this.cache.json.get('chargearjson')); } catch (e) { console.error('gear', e); }
    S.onChange(refreshGear);
    for (const [a, m] of Object.entries(charMeta.anims)) {
      makeAnimFrames(this, `c_${a}`, 'char', m.frames, m.durations, LOOPING.has(a) ? -1 : 0);
    }
    // animasyon adi: g_<tur>_<asama>_<anim>[_p]
    createV2Anims(this, gmeta);
    for (const [k, m] of Object.entries(gmeta)) {
      if (m.v === 2) continue;
      m.stages.forEach((st, s) => {
        for (const [a, an] of Object.entries(m.anims)) {
          const loop = a === 'durma' || a === 'yurume' ? -1 : 0;
          makeAnim(this, `g_${k}_${s}_${a}`, `gs_${k}_${s}`, an.durs, loop, an.start);
          makeAnim(this, `g_${k}_${s}_${a}_p`, `gs_${k}_${s}`, an.durs, loop, an.start + st.n);
        }
      });
    }
    for (const [a, m] of Object.entries(BOOT.npc.anims)) {
      if (!this.anims.exists(`npc_${a}`)) this.anims.create({ key: `npc_${a}`, frames: m.frames.map((f, i) => ({ key: 'hanci', frame: f, duration: m.durs[i] })), frameRate: 1000, repeat: a === 'durma' ? -1 : 0 });
      if (!this.anims.exists(`tuccar_${a}`)) this.anims.create({ key: `tuccar_${a}`, frames: m.frames.map((f, i) => ({ key: 'tuccar', frame: f, duration: m.durs[i] })), frameRate: 1000, repeat: a === 'durma' ? -1 : 0 });
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
    tex('yard', ART.workshopYard());
    tex('bigmoon', ART.bigMoon());
    tex('feedtable', ART.feedTable());
    tex('chest', ART.chest(false));
    tex('chest_open', ART.chest(true));
    tex('spikes', ART.spikes());
    tex('stairs', ART.stairsDown());
    tex('slash', ART.slash());
    tex('hitstar', ART.hitStar());
    tex('dust', ART.dustPuff());
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
    strip('gate', ART.eventGate());
    loop('gate', 'gate', [0, 1, 2, 3], 5);
    loop('fire', 'fire', [0, 1, 2], 7);
    // 0.2: uretim istasyonlari, maden ocagi, toplama (0.6: ev kalkti, istasyonlar dışarıda)
    tex('workbench', ART.workbench());
    strip('furnace', ART.furnaceArt());
    loop('furnace_on', 'furnace', [1, 2], 6);
    strip('cauldron', ART.cauldronArt());
    loop('cauldron', 'cauldron', [0, 1], 3);
    strip('ores', ART.oreSheet(), ART.ORE_FRAMES);
    strip('boom', ART.boomArt());
    this.anims.create({ key: 'boom', frames: [0, 1, 2, 3].map((i) => ({ key: 'boom', frame: i })), frameRate: 12, repeat: 0 });
    tex('chip', ART.chip());
    for (const k of ['herb', 'berry', 'branch', 'shroom', 'palm', 'sand', 'snowberry', 'pepper', 'nightshroom', 'moonherb']) tex(`node_${k}`, ART.gatherNode(k));
    this.scene.start('world', { gmeta, charMeta });
  }
}

async function loadJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(url);
  return r.json();
}

function startGame(char, charMeta, gmeta, npc) {
  S.load(char);
  if (DEV) window.__S = S; // testler icin (yayin surumunde kapali)
  stopMusic();
  setSound(S.save.settings.sound);
  BOOT = { char, charMeta: charMeta[char], gmeta, npc };
  $('#loading').textContent = 'Yükleniyor…';
  show('#loading', true);
  // oyun suresi sayaci
  setInterval(() => {
    if (document.hidden || !S.save) return;
    S.save.stats.playMs += 30000;
    S.save.lastSeen = gNow();
    S.persist();
  }, 30000);
  // eslik: sekme kapanirken kaydet
  window.addEventListener('pagehide', () => { S.save.lastSeen = gNow(); S.persist(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { S.save.lastSeen = gNow(); S.persist(); } pauseMusic(document.hidden); });
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
    loadGlemIcons();   // derlemede ikon paketi arka planda gelir
    const npc = await loadJson('assets/npc/hanci.json');
    const charMeta = {};
    await Promise.all(CHARACTERS.map(async (c) => { charMeta[c.key] = await loadJson(`assets/chars/${c.key}/anims.json`); }));
    show('#loading', false);
    if (DEV) {
      // K6 test turu: #t<karakter> girisi atlar
      window.__start = (c) => startGame(c, charMeta, gmeta, npc);
      import('./panels.js').then((P) => { window.__P = P; });
      const m = location.hash.match(/^#t(\w+)/);
      if (m && charMeta[m[1]]) { window.__start(m[1]); return; }
    }
    showLogin(charMeta, (char) => startGame(char, charMeta, gmeta, npc));
  } catch (e) {
    console.error(e);
    $('#loading').textContent = 'Oyun dosyaları yüklenemedi. Sayfayı yenile.';
  }
}

main();
