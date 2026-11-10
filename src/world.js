// Ana sahne: us (ev, depo, harita, maden girisi) ve zindan odalari.
import {
  GAME_W, GROUND_Y, ITEMS, SKILLS, ROOM_WEIGHTS, CHEST_GEAR, CHEST_MATS, GLEMONS, STAGES,
  ZONES, zoneOf, ZONE_SPAWNS, ZONE_GATHER, ZONE_CHEST, wildStageChances, ABILITIES,
  ORES, MINE_COLS, MINE_ROWS, DEFINE_CHANCE, oreWeights, mineXpMult, mineHardBonus,
  GATHER, BAL_CHANCE, GATHER_CHANCE, RECIPES, ANIM_POOLS, CURRENCY,
  BUILD, BUILD_ORDER, plotSize, MAX_TARLA, SEEDS, SEED_CHANCE, CAMP, BONKIT_CHANCE, EGG_BATTLES,
  FISH, WATERS, fishXp, DEEP_LIMIT, AY_OTU_CHANCE, TREE,
} from './data.js';
import { castOnce, chestLoot, cycleBait, baitLabel } from './fishing.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx, playMusic, stopMusic, currentMusic } from './audio.js';
import { playAnim, moveTo, wait, animDur } from './anim.js';
import { Battle, BPOS } from './battle.js';
import { block } from './blocks.js';
import { Pix, INK } from './pix.js';
import { TOD, todNow, forestBackground, caveBackground, battleStage, caveRoomBackground, desertRoomBackground, dungeonRoomBackground, biomeRoomBackground, BIOME_KEYS, iconUrl, MINE_WALL, POND, pondOverlay, bobber } from './art.js';
import { openBag, openDepo, openSkills, openProfile, openMap, openStation, furnaceState, openShop, openCamp, openAhir, openAlbum, openHanci, openZindan, openQuests, openEventGate } from './panels.js';

const PLAYER_HOME = 96;
const MINE_X = 330;
const WALK_MODES = ['base', 'plot'];
// 0.6 us yerlesimi (Eren, 2026-11-07): solda zanaat avlusu, ortada kamp atesi, sonra han, sagda zindan
const ST = { masa: 24, firin: 56, kazan: 88, yem: 120, depo: 152 };
const FIRE_X = 186;
const INN_X = 198;
const NPC_X = 246;
const MINE_STAND_X = MINE_WALL.x - 14;
const SIT_AFTER = 20000; // bu kadar hareketsiz kalinca oturur
const SPRINT_DIST = 150; // bundan uzaga dokununca kosar

function weighted(list) {
  const tot = list.reduce((t, [, w]) => t + w, 0);
  let r = Math.random() * tot;
  for (const [k, w] of list) { r -= w; if (r < 0) return k; }
  return list[0][0];
}
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export class WorldScene extends Phaser.Scene {
  constructor() { super('world'); }

  init(data) { this.gmeta = data.gmeta; this.charMeta = data.charMeta; }

  create() {
    // 0.8.9: ekran sarsintisi Profil'den kapatilabilir
    { const cam = this.cameras.main; const orig = cam.shake.bind(cam); cam.shake = (...a) => (S.save.settings.shake === false ? cam : orig(...a)); }
    this.playerHomeX = PLAYER_HOME;
    this.coinUrl = iconUrl('cimen');
    this.bg = this.add.image(0, 0, 'bg_base').setOrigin(0).setDepth(0);
    this.roomObjs = [];
    this.labels = [];
    this.pShadow = this.add.image(0, GROUND_Y + 1, 'shadow').setDepth(9);
    this.player = this.add.sprite(200, GROUND_Y, 'char', this.charMeta.anims.idle.frames[0]).setDepth(10);
    this.player.play('c_idle');
    this.stillMs = 0;
    this.battle = null;
    this.busy = false;
    this.mode = 'base';
    this.walkTok = 0;
    this.input.on('pointerdown', (ptr, over) => this.onTap(ptr, over));
    this.tod = todNow();
    this.glows = [];
    if (!this.textures.exists('glow')) {
      // ates ve fenerlerin gece isigi (yumusak daire)
      const cv = document.createElement('canvas'); cv.width = 64; cv.height = 64;
      const ctx = cv.getContext('2d');
      const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,190,110,0.85)'); gr.addColorStop(0.45, 'rgba(255,150,70,0.3)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 64, 64);
      this.textures.addCanvas('glow', cv);
    }
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');
    this.buildHud();
    S.onChange(() => this.refreshHud());
    window.__BG = this; // testler icin
    this.goBase(false);
    UI.show('#loading', false);
    UI.feed(`Hoş geldin, ${S.save.char}! Hancı Lale'ye dokun: Keşif, Zindan, görevler ve takas hep onda.`);
    if (S.loadNote) {
      const n = S.loadNote; S.loadNote = null;
      const lost = n.lost.map((l) => `${ITEMS[l.id].name} ×${l.n}`).concat(n.gold ? [`${n.gold} ${CURRENCY}`] : []).join(', ');
      UI.feed(`Oyun bir savaşın ortasında kapandı: bayılmış sayıldın.${lost ? ' Kaybettiklerin: ' + UI.escapeHtml(lost) : ''}`);
    }
    this.checkCamp();
    this.makeFollower();
  }

  // ------------------------------------------------------------ yanindaki Glemon (0.4)
  // Savas disinda karakterin arkasindan yurur; ustte ona dokununca Ahir acilir.
  makeFollower() {
    if (this.follower) { this.follower.destroy(); this.followerShadow.destroy(); this.follower = null; }
    const p = S.activePet();
    if (!p) return;
    const meta = this.gmeta[p.key].stages[p.stage];
    const k = (a) => `g_${p.key}_${p.stage}_${a}${p.shiny ? '_p' : ''}`;
    const f = this.add.sprite(this.player.x - 24, GROUND_Y, `gs_${p.key}_${p.stage}`, p.shiny ? meta.n : 0)
      .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(9).setScale(p.stage === 2 ? 0.8 : 1);
    f.play(k('durma'));
    f.k = k;
    f.pet = p;
    f.setInteractive({ useHandCursor: true });
    f.on('pointerdown', () => { if (!this.busy && !UI.panelOpen() && WALK_MODES.includes(this.mode)) openAhir(this); });
    this.follower = f;
    this.followerShadow = this.add.image(f.x, GROUND_Y + 1, 'shadow').setDepth(8).setScale((meta.bodyW * f.scale) / 18, 1);
  }

  updateFollower(dt) {
    const f = this.follower;
    if (!f) return;
    const hide = this.inBattleView || this.player.alpha < 0.5 || this.player.y > GROUND_Y + 8 || (S.run && S.run.petDown);
    f.setVisible(!hide);
    this.followerShadow.setVisible(!hide);
    if (hide) return;
    const p = this.player;
    const side = p.flipX ? 1 : -1;
    const tx = p.x + side * 26;
    const dx = tx - f.x;
    const moving = Math.abs(dx) > 3;
    if (moving) {
      const sp = Math.min(Math.abs(dx), (Math.abs(dx) > 60 ? 200 : 90) * dt / 1000);
      f.x += Math.sign(dx) * sp;
      f.setFlipX(dx > 0);
      if (f.anims.currentAnim.key !== f.k('yurume')) f.play(f.k('yurume'));
    } else if (f.anims.currentAnim.key !== f.k('durma')) {
      f.play(f.k('durma'));
      f.setFlipX(!p.flipX);
    }
    f.y = GROUND_Y;
    this.followerShadow.x = f.x;
  }

  async petEvolved(evo) {
    UI.banner(`${evo.name} evrimleşti!`, `Artık ${STAGES[evo.stage]} ${evo.name}`, 2600, 'gold');
    UI.feed(`<span style="color:#ffd04d">★ ${evo.name} evrimleşti: ${STAGES[evo.stage]}! Statları arttı.</span>`, 'gold');
    sfx('levelup');
    this.makeFollower();
    await wait(this, 900);
  }

  // ------------------------------------------------------------ kamp (0.3)
  // Oyun kapaliyken kamp atesinin basinda en fazla 2 saatlik basit malzeme birikir.
  campReward(awayMs) {
    const ms = Math.min(CAMP.maxMs, awayMs);
    if (ms < CAMP.minMs) return null;
    const h = ms / 3600000;
    const items = {};
    for (const [id, per] of Object.entries(CAMP.perHour)) items[id] = Math.max(1, Math.round(per * h));
    return { ms, items };
  }

  checkCamp() {
    const away = Date.now() - (S.save.lastSeen || Date.now());
    S.save.lastSeen = Date.now();
    S.persist();
    const rw = this.campReward(away);
    if (rw) this.time.delayedCall(700, () => openCamp(this, rw));
  }

  update(time, dt) {
    this.pShadow.x = this.player.x;
    // gunun saati: ustte (dis ve arsa) karakter de isiga gore boyanir
    const outdoor = this.mode === 'base' || this.mode === 'plot' || this.mode === 'pond';
    const ptint = outdoor ? TOD[this.tod].tint : 0xffffff;
    if (this.player.tintTopLeft !== ptint) { if (ptint === 0xffffff) this.player.clearTint(); else this.player.setTint(ptint); }
    this.todTick = (this.todTick || 0) + dt;
    if (this.todTick > 30000) { this.todTick = 0; if (outdoor && todNow() !== this.tod) this.applyTod(); }
    this.pShadow.setAlpha(this.inBattleView ? 0 : this.player.alpha);
    // karakterin ustune binen yazilar soluklasir (Depo yazisi yuzunu kapatmasin)
    for (const l of this.labels) {
      if (l._x === undefined) continue;
      const near = Math.abs(l._x - this.player.x) < 20;
      if (l._near !== near) { l._near = near; l.classList.toggle('near', near); }
    }
    this.updateFollower(dt);
    // uzun sure hareketsiz kalinca otur
    const cur = this.player.anims.currentAnim && this.player.anims.currentAnim.key;
    if ((cur === 'c_idle' || cur === 'c_idlesway') && !this.busy && !this.battle && !UI.panelOpen()) {
      this.stillMs += dt;
      if (this.stillMs > SIT_AFTER) { this.stillMs = 0; this.player.play('c_sit'); }
    } else if (cur !== 'c_sit') this.stillMs = 0;
    if (this.battle && !UI.panelOpen()) this.battle.update(dt);
    if (this.mode === 'plot') {
      this.gardenTick = (this.gardenTick || 0) + dt;
      if (this.gardenTick > 2000) { this.gardenTick = 0; this.refreshGarden(); }
    }
    if (this.mode === 'base' && this.furnace) {
      this.furnaceTick = (this.furnaceTick || 0) + dt;
      if (this.furnaceTick > 500) { this.furnaceTick = 0; this.refreshFurnace(); }
    }
    if (this.canWalk() && !this.busy && !UI.panelOpen()) {
      const left = this.keys.LEFT.isDown || this.keys.A.isDown;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown;
      if (left !== right) {
        if (this.player._moveTween) this.player._moveTween.stop();
        this.walkTok++;
        this.player.x = Phaser.Math.Clamp(this.player.x + (right ? 1 : -1) * 75 * dt / 1000, 12, GAME_W - 12);
        this.player.setFlipX(left);
        this.player.play('c_walk', true);
        this.kbWalk = true;
      } else if (this.kbWalk) {
        this.kbWalk = false;
        this.idle();
      }
    }
  }

  canWalk() { return WALK_MODES.includes(this.mode); }

  // Durma: usteyken (dis ve arsa) idle, baska her yerde idlesway. Ikisi de 3/4 onden.
  idle() {
    this.stillMs = 0;
    this.player.play(WALK_MODES.includes(this.mode) ? 'c_idle' : 'c_idlesway', true);
  }

  // Ayni ise yarayan animasyonlardan rastgele biri; kisa olanlar tekrar eder
  async playPool(pool, minMs = 1300, timeScale = 1) {
    const key = 'c_' + pick(ANIM_POOLS[pool]);
    const one = (this.anims.get(key) ? animDur[key] : 500) / timeScale;
    const times = Math.max(1, Math.round(minMs / one));
    for (let i = 0; i < times; i++) await playAnim(this.player, key, timeScale);
  }

  async celebrate() {
    if (this.inBattleView) return;
    await this.playPool('sevinc', 1400);
    if (!this.inBattleView) this.idle();
  }

  // Bir sey yapilamayinca omuz silker (sulk)
  sulk() {
    if (this.inBattleView) return;
    const p = this.player;
    const cur = p.anims.currentAnim && p.anims.currentAnim.key;
    if (cur && !['c_idle', 'c_idlesway', 'c_sit', 'c_sulk'].includes(cur)) return;
    playAnim(p, 'c_sulk', 1).then(() => playAnim(p, 'c_sulk', 1)).then(() => { if (p.anims.currentAnim && p.anims.currentAnim.key === 'c_sulk') this.idle(); });
  }

  // 0.8.9: Maden, Kesif ve Zindana yola cikis: karakter ussun sagindan yurur gider
  async travelOut() {
    this.player.setFlipX(false);
    await moveTo(this.player, GAME_W + 18, { speed: 120, anim: 'c_walk' });
    sfx('stairs');
    await this.fade(true);
    this.resetPlayer();
  }

  // Bir yere girerken kisa sure arkadan yurur (iceri giriyormus gibi)
  async walkIn(dy = -4) {
    const p = this.player;
    p.play('c_walkin');
    await new Promise((res) => this.tweens.add({ targets: p, y: p.y + dy, scale: 0.92, duration: 420, onComplete: res }));
  }

  resetPlayer() {
    this.player.setScale(1);
    this.player.y = GROUND_Y;
    this.player.alpha = 1;
  }

  // ------------------------------------------------------------ ust bilgi
  buildHud() {
    UI.show('#hud', true);
    // 0.8.9: kisayollar ekranin altinda, her zaman ayni yerde (savasta gizlenir)
    UI.$('#hud-btns').innerHTML = '';
    const dock = UI.$('#dock');
    dock.innerHTML = '';
    const item = (ico, label, fn) => {
      const b = UI.button('', fn, 'dock-btn');
      b.appendChild(UI.icon(ico, 'ico'));
      b.appendChild(UI.el('span', 'lbl', label));
      dock.appendChild(b);
      return b;
    };
    item('dock_canta', 'Çanta', () => openBag(this));
    item('dock_beceri', 'Beceriler', () => openSkills(this));
    this.questBtn = item('dock_gorev', 'Görevler', () => openQuests(this));
    item('dock_album', 'Albüm', () => openAlbum(this));
    item('dock_profil', 'Profil', () => openProfile(this));
    this.refreshHud();
  }

  refreshHud() {
    if (!S.save) return;
    const max = S.maxHp();
    S.hp = Math.min(S.hp, max);
    UI.$('#hud-name').textContent = S.save.char;
    UI.$('#hud-lvl').textContent = `Toplam Sv. ${S.totalLevel()}`;
    UI.$('#hud-hp').style.width = `${(S.hp / max) * 100}%`;
    UI.$('#hud-hp-text').textContent = `${S.hp} / ${max}`;
    UI.$('#hud-gold').innerHTML = `<img class="ico-inline" src="${this.coinUrl}">${S.save.gold} ${CURRENCY}`;
  }

  say(text, ms = 3000) {
    UI.bubble(this.player.x, GROUND_Y - 42, UI.escapeHtml(text), ms);
  }

  // ------------------------------------------------------------ yurume
  onTap(ptr, over) {
    if (this.mode === 'plot' && !this.busy && !UI.panelOpen() && this.plotTap(ptr)) return;
    if (over && over.length) return;
    if (!this.canWalk() || this.busy || UI.panelOpen()) return;
    this.walkThen(Phaser.Math.Clamp(ptr.worldX, 12, GAME_W - 12), null);
  }

  async walkThen(x, fn) {
    const tok = ++this.walkTok;
    const far = Math.abs(x - this.player.x) > SPRINT_DIST;
    await moveTo(this.player, x, far ? { speed: 190, anim: 'c_sprint' } : { speed: 80, anim: 'c_walk' });
    if (tok !== this.walkTok) return;
    this.idle();
    if (fn) fn();
  }

  // ------------------------------------------------------------ oda temizligi
  addObj(obj, opts = {}) {
    this.roomObjs.push(obj);
    if (opts.act) {
      obj.setInteractive({ useHandCursor: true });
      obj.on('pointerdown', () => {
        if (this.busy || UI.panelOpen() || !(opts.modes || WALK_MODES).includes(this.mode)) return;
        if (opts.direct) { opts.act(); return; }
        this.walkThen(opts.x ?? obj.x, () => {
          if (opts.face !== undefined) this.player.setFlipX(opts.face);
          opts.act();
        });
      });
    }
    if (opts.label) {
      const l = UI.el('div', 'objlabel', opts.label);
      l._x = opts.lx ?? obj.x;
      l.style.left = UI.pctX(opts.lx ?? obj.x);
      l.style.top = UI.pctY(opts.ly);
      UI.$('#floats').appendChild(l);
      this.labels.push(l);
    }
    return obj;
  }

  clearRoom() {
    if (this.battle) { this.battle.destroy(); this.battle = null; }
    for (const o of this.roomObjs) o.destroy();
    this.roomObjs = [];
    for (const l of this.labels) l.remove();
    this.labels = [];
    UI.$('#bars').innerHTML = '';
  }

  // Uretilen arka planlar (oda, savas meydani) sinirsiz birikmesin: son 12 tanesi tutulur.
  bgTex(key, make) {
    this.bgKeys = this.bgKeys || [];
    const i = this.bgKeys.indexOf(key);
    if (i >= 0) this.bgKeys.splice(i, 1);
    if (!this.textures.exists(key)) this.textures.addCanvas(key, make());
    this.bgKeys.push(key);
    while (this.bgKeys.length > 12) {
      const old = this.bgKeys[0];
      if (old === this.bg.texture.key || old === this.roomBg) { this.bgKeys.push(this.bgKeys.shift()); break; }
      this.bgKeys.shift();
      if (this.textures.exists(old)) this.textures.remove(old);
    }
    return key;
  }

  fade(out) {
    if (out === !!this.faded) return Promise.resolve();
    this.faded = out;
    return new Promise((res) => {
      const cam = this.cameras.main;
      if (out) { cam.fadeOut(220, 10, 8, 16); cam.once('camerafadeoutcomplete', res); } else { cam.fadeIn(220, 10, 8, 16); cam.once('camerafadeincomplete', res); }
    });
  }

  // ------------------------------------------------------------ us
  // 0.6: ev yok. Uretim istasyonlari disarida (zanaat avlusu), Hanci Lale her yere kapi.
  goBase(from) {
    this.mode = 'base';
    this.zz = null;
    this.clearRoom();
    this.tod = todNow();
    this.bg.setTexture(this.todBg('bg_base'));
    const G = GROUND_Y;
    this.addObj(this.add.image(-9, G + 1, 'yard').setOrigin(0, 1).setDepth(2));
    const station = (obj, sx, label, high, act) => this.addObj(obj.setOrigin(0.5, 1).setDepth(4), {
      x: sx + 15, face: true, label, lx: sx, ly: high ? G - 46 : G - 24, act,
    });
    station(this.add.image(ST.masa, G + 1, 'workbench'), ST.masa, 'Üretim Masası', false, () => openStation(this, 'masa'));
    this.furnace = this.add.sprite(ST.firin, G + 1, 'furnace', 0);
    station(this.furnace, ST.firin, 'Fırın', true, () => openStation(this, 'firin'));
    const caul = this.add.sprite(ST.kazan, G + 1, 'cauldron', 0);
    caul.play('cauldron');
    station(caul, ST.kazan, 'Simya Kazanı', false, () => openStation(this, 'kazan'));
    station(this.add.image(ST.yem, G + 1, 'feedtable'), ST.yem, 'Yem Tezgâhı', true, () => openStation(this, 'yem'));
    station(this.add.image(ST.depo, G + 1, 'chest'), ST.depo, 'Depo', false, () => openDepo(this));
    const fire = this.add.sprite(FIRE_X, G + 1, 'fire').setOrigin(0.5, 1).setDepth(4);
    fire.play('fire');
    fire.noTint = true;
    this.addObj(fire, {
      x: FIRE_X - 16, face: false,
      act: () => {
        this.player.play('c_sit');
        this.say('Sen yokken burada 2 saate kadar dal, taş, kömür ve böğürtlen birikir.', 3600);
      },
    });
    // Han: arkada harita, onde tezgah; Hanci Lale ikisinin arasinda durur
    this.addObj(this.add.image(INN_X, G + 1, 'inn_back').setOrigin(0, 1).setDepth(2));
    const npc = this.add.sprite(NPC_X, G - 4, 'hanci', 0).setOrigin(0.5, 1).setDepth(3); // ayaklari tezgahin arkasinda kalir
    npc.play('npc_durma');
    this.npc = npc;
    this.addObj(npc, { x: NPC_X - 30, face: false, label: 'Hancı Lale', ly: G - 62, act: () => this.talkNpc() });
    this.addObj(this.add.image(INN_X, G + 1, 'inn_counter').setOrigin(0, 1).setDepth(5));
    // 0.8.9: eski maden girisi kalkti; yerine Etkinlik Kapisi (gidis yolu artik Hanci Lale'den)
    const gate = this.add.sprite(MINE_X, G + 1, 'gate', 0).setOrigin(0.5, 1).setDepth(3);
    gate.play('gate');
    this.addObj(gate, { x: MINE_X - 30, face: true, label: 'Etkinlik Kapısı', ly: G - 86, act: () => openEventGate(this) });
    this.refreshFurnace();
    if (!S.run) S.hp = S.maxHp(); // us guvenli yer: her donuste can dolar
    this.player.setFlipX(false);
    this.player.x = from === 'dungeon' ? GAME_W - 16 : from === 'death' ? FIRE_X - 22 : from === 'plot' ? GAME_W - 16 : FIRE_X - 18;
    this.resetPlayer();
    this.idle();
    UI.setLocation('Üs');
    // 0.8.9: usse eylem dugmesi yok; her yere Hanci Lale'den gidilir, alttaki cubuk kisayollari tutar
    UI.setActions([]);
    if (this.follower) { this.follower.x = this.player.x - 26; }
    this.refreshHud();
    this.applyTod();
    // ussun muzigi: her donuste (zindan, maden, bayilma, oyun acilisi) yeniden secilir;
    // arsadan gelince calan parca devam eder
    const keep = from === 'plot' && this.baseTrack && currentMusic() === this.baseTrack;
    if (!keep) this.pickBaseMusic();
    const fs = furnaceState();
    if (fs.ready > 0) UI.feed(`Fırında ${fs.ready} ${ITEMS[fs.out].name} hazır! Fırına dokunup alabilirsin.`);
  }

  // Hanci Lale: el sallar, sonra her yere giden panel acilir
  async talkNpc() {
    const n = this.npc;
    if (n && n.active) { n.play('npc_selam'); n.once('animationcomplete', () => { if (n.active) n.play('npc_durma'); }); }
    this.player.setFlipX(false);
    openHanci(this);
  }

  refreshFurnace() {
    if (!this.furnace || !this.furnace.active) { this.furnace = null; return; }
    const on = furnaceState().working;
    if (on && !this.furnace.anims.isPlaying) this.furnace.play('furnace_on');
    if (!on && this.furnace.anims.isPlaying) { this.furnace.stop(); this.furnace.setFrame(0); }
  }

  // ------------------------------------------------------------ gunun saati ve muzik
  todBg(base) {
    const key = `${base}_${this.tod}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, forestBackground(1, base === 'bg_plot' ? 3 : base === 'bg_pond' ? 5 : 0, true, GAME_W, this.tod));
    return key;
  }

  // gokyuzu, nesnelerin isik rengi ve gece isiklari (ates, fener)
  applyTod() {
    for (const g of this.glows) g.destroy();
    this.glows = [];
    if (this.mode !== 'base' && this.mode !== 'plot' && this.mode !== 'pond') return;
    this.tod = todNow();
    this.bg.setTexture(this.todBg(this.mode === 'plot' ? 'bg_plot' : this.mode === 'pond' ? 'bg_pond' : 'bg_base'));
    const T = TOD[this.tod];
    for (const o of this.roomObjs) {
      if (!o.active || !o.setTint || o.noTint) continue;
      if (T.tint === 0xffffff) o.clearTint(); else o.setTint(T.tint);
    }
    if (this.tod === 'gun') return;
    const G = GROUND_Y;
    const spots = [];
    if (this.mode === 'base') spots.push([FIRE_X, G - 8, 1.6], [MINE_X, G - 26, 0.9], [32, G - 40, 0.6], [128, G - 40, 0.6], [INN_X + 68, G - 40, 0.7]);
    else if (this.mode === 'pond') spots.push([POND.standX - 40, G - 30, 0.8]);
    else {
      const g = this.plotGeom();
      for (const [key, c] of Object.entries(S.save.plot.cells)) {
        if (c.id !== 'fener') continue;
        const [cc, rr] = key.split(',').map(Number);
        if (cc < g.cols && rr < g.rows) spots.push([g.x0 + cc * 16 + 8, G - rr * 16 - 6, 1]);
      }
    }
    const a = this.tod === 'gece' ? 0.75 : 0.4;
    for (const [x, y, sc] of spots) {
      const gl = this.add.image(x, y, 'glow').setDepth(7).setScale(sc).setAlpha(a).setBlendMode(Phaser.BlendModes.ADD);
      this.glows.push(gl);
      this.roomObjs.push(gl);
      this.tweens.add({ targets: gl, alpha: a * 0.75, scale: sc * 1.06, duration: 900 + Math.random() * 400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  }

  pickBaseMusic() {
    const night = this.tod === 'gunbatimi' || this.tod === 'gece';
    const pool = night ? ['night1', 'night2'] : ['day1', 'day2'];
    this.baseTrack = pick(pool);
    playMusic(this.baseTrack, true);
  }

  // takas paneli kapaninca ussun muzigi kaldigi yerden devam eder
  shopClosed() {
    this.time.delayedCall(150, () => {
      if (this.shopBusy || UI.panelOpen() || this.mode !== 'base') return;
      if (this.baseTrack) playMusic(this.baseTrack, false);
    });
  }

  // ------------------------------------------------------------ arsa ve insa (0.3)
  // Arsa: usteki ayri ekran. Blok izgarasi zeminden yukari (sira 0 = zemin ustu).
  plotGeom() {
    const { cols, rows: r0 } = plotSize(S.level('insa'));
    const rows = r0 + (S.has('mimar') ? 1 : 0);
    const x0 = Math.floor((GAME_W - cols * 16) / 32) * 16;
    return { cols, rows, x0 };
  }

  cellAt(wx, wy) {
    const g = this.plotGeom();
    const c = Math.floor((wx - g.x0) / 16);
    const r = Math.floor((GROUND_Y - wy) / 16);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return null;
    return { c, r, key: `${c},${r}` };
  }

  async enterPlot() {
    UI.closePanel();
    if (this.busy || this.mode !== 'base') return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await moveTo(this.player, GAME_W + 10, { speed: 190, anim: 'c_sprint' });
    await this.fade(true);
    this.goPlot();
    this.player.x = -12;
    await this.fade(false);
    await moveTo(this.player, 40, { speed: 95, anim: 'c_walk' });
    this.idle();
    this.busy = false;
  }

  async leavePlot() {
    if (this.busy || this.mode !== 'plot') return;
    this.stopBuild();
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await moveTo(this.player, -12, { speed: 190, anim: 'c_sprint' });
    await this.fade(true);
    this.goBase('plot');
    this.player.setFlipX(true);
    await this.fade(false);
    this.player.setFlipX(false);
    this.busy = false;
  }

  goPlot() {
    this.mode = 'plot';
    this.clearRoom();
    this.tod = todNow();
    this.bg.setTexture(this.todBg('bg_plot'));
    const g = this.plotGeom();
    const G = GROUND_Y;
    // arsanin iki kenarinda direk
    for (const x of [g.x0 - 8, g.x0 + g.cols * 16 + 8]) this.roomObjs.push(this.add.image(x, G, 'blocks', 'direk').setOrigin(0.5, 1).setDepth(3));
    this.plotImg = null;
    this.gardenSprites = {};
    this.drawPlot();
    this.refreshGarden();
    this.applyTod();
    this.player.setFlipX(false);
    this.resetPlayer();
    this.idle();
    this.plotActions();
    this.refreshHud();
  }

  plotActions() {
    const g = this.plotGeom();
    UI.setLocation(`Arsan · ${g.cols}×${g.rows} · Üs Puanı ${S.baseScore()}`);
    UI.setActions([
      { label: 'İnşa et', cls: 'primary', onClick: () => this.startBuild() },
      { label: 'Üsse dön', onClick: () => this.leavePlot() },
    ]);
  }

  // Arsadaki bloklar tek resimde cizilir; yapinin disina karakterdeki gibi koyu cizgi gelir.
  drawPlot() {
    const g = this.plotGeom();
    const pix = new Pix(g.cols * 16 + 2, g.rows * 16 + 2);
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      const def = BUILD[cell.id];
      if (!def) continue;
      const [c, r] = key.split(',').map(Number);
      if (c >= g.cols || r >= g.rows) continue;
      const frame = cell.top ? def.top : (cell.shape || def.tex);
      pix.draw(block(frame), 1 + c * 16, 1 + (g.rows - 1 - r) * 16, 16);
    }
    pix.outline(INK);
    if (this.plotImg) { this.plotImg.destroy(); this.plotImg = null; }
    if (this.textures.exists('plot_tex')) this.textures.remove('plot_tex');
    this.textures.addCanvas('plot_tex', pix.canvas());
    this.plotImg = this.add.image(g.x0 - 1, GROUND_Y - g.rows * 16 - 1, 'plot_tex').setOrigin(0).setDepth(5);
    this.roomObjs.push(this.plotImg);
  }

  drawCell() { this.drawPlot(); }

  // bahce: tarlanin ustunde buyuyen bitki
  gardenInfo(key) {
    const gd = S.save.plot.garden[key];
    if (!gd) return null;
    const sd = SEEDS[gd.seed];
    const p = (Date.now() - gd.t0) / sd.ms;
    return { ...gd, sd, p, ready: p >= 1, left: Math.max(0, gd.t0 + sd.ms - Date.now()) };
  }

  refreshGarden() {
    if (this.mode !== 'plot') return;
    const g = this.plotGeom();
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      if (cell.id !== 'tarla') continue;
      const info = this.gardenInfo(key);
      const frame = !info ? null : info.ready ? (info.seed === 'ot_tohumu' ? 'bitki' : 'cali') : info.p < 0.4 ? 'filiz' : 'fide';
      const cur = this.gardenSprites[key];
      if (cur && cur.frame.name === frame) continue;
      if (cur) { cur.destroy(); delete this.gardenSprites[key]; }
      if (!frame) continue;
      const [c] = key.split(',').map(Number);
      const spr = this.add.image(g.x0 + c * 16, GROUND_Y - 32 + 4, 'blocks', frame).setOrigin(0).setDepth(6);
      this.gardenSprites[key] = spr;
      this.roomObjs.push(spr);
    }
  }

  // arsaya dokununca: insa modunda blok koy/kaldir, degilse tarlaya dokunmak bahceyi acar
  plotTap(ptr) {
    const cell = this.cellAt(ptr.worldX, ptr.worldY);
    if (this.building) {
      if (!cell) return true; // insa modunda arsa disina dokunmak bir sey yapmaz
      if (this.buildTool === 'kaldir') this.removeAt(cell); else this.placeAt(cell);
      return true;
    }
    if (!cell) return false;
    // tarlanin kendisi ya da ustundeki bitki
    const base = S.save.plot.cells[cell.key] && S.save.plot.cells[cell.key].id === 'tarla' ? cell
      : cell.r === 1 && S.save.plot.cells[`${cell.c},0`] && S.save.plot.cells[`${cell.c},0`].id === 'tarla' ? { c: cell.c, r: 0, key: `${cell.c},0` } : null;
    if (!base) return false;
    this.gardenTap(base);
    return true;
  }

  standNear(c) {
    const g = this.plotGeom();
    const cx = g.x0 + c * 16 + 8;
    const side = this.player.x <= cx ? -1 : 1;
    return { cx, x: Phaser.Math.Clamp(cx + side * 18, 12, GAME_W - 12) };
  }

  async walkToCell(c) {
    const { cx, x } = this.standNear(c);
    if (Math.abs(this.player.x - cx) > 30) await moveTo(this.player, x, { speed: 110, anim: 'c_walk' });
    this.player.setFlipX(cx < this.player.x);
  }

  // ---- insa modu
  startBuild() {
    if (this.busy) return;
    this.building = true;
    if (!this.buildSel || !S.countItem(this.buildSel)) this.buildSel = BUILD_ORDER.find((id) => S.countItem(id) > 0 && S.level('insa') >= BUILD[id].lvl) || null;
    this.buildTool = 'koy';
    this.drawGrid();
    this.buildBar();
  }

  stopBuild() {
    if (!this.building) return;
    this.building = false;
    if (this.grid) { this.grid.destroy(); this.grid = null; }
    if (this.mode === 'plot') this.plotActions();
  }

  drawGrid() {
    if (this.grid) this.grid.destroy();
    const g = this.plotGeom();
    const gr = this.add.graphics().setDepth(8);
    gr.lineStyle(1, 0xffffff, 0.22);
    const top = GROUND_Y - g.rows * 16;
    for (let c = 0; c <= g.cols; c++) gr.lineBetween(g.x0 + c * 16 + 0.5, top, g.x0 + c * 16 + 0.5, GROUND_Y);
    for (let r = 0; r <= g.rows; r++) gr.lineBetween(g.x0, GROUND_Y - r * 16 + 0.5, g.x0 + g.cols * 16, GROUND_Y - r * 16 + 0.5);
    this.grid = gr;
  }

  // alt cubuk: elindeki bloklar (simge + adet), Kaldir, Bitti
  buildBar() {
    const bar = UI.$('#actions');
    bar.innerHTML = '';
    const lvl = S.level('insa');
    const owned = BUILD_ORDER.filter((id) => S.countItem(id) > 0);
    if (!owned.length) UI.feed('Elinde inşa bloğu yok. Zanaat avlusundaki Üretim Masası\'nda Tahta Kalas, Kütük, Çit gibi bloklar yapabilirsin.');
    for (const id of owned) {
      const def = BUILD[id];
      const b = UI.el('button', 'btn small build-btn' + (this.buildTool === 'koy' && this.buildSel === id ? ' sel' : ''));
      b.appendChild(UI.icon(ITEMS[id].icon));
      b.appendChild(UI.el('span', '', `${S.countItem(id)}`));
      b.title = ITEMS[id].name + (lvl < def.lvl ? ` (İnşa ${def.lvl} gerekli)` : '');
      if (lvl < def.lvl) b.classList.add('locked');
      b.onclick = (ev) => {
        ev.stopPropagation(); sfx('click');
        if (lvl < def.lvl) { UI.feed(`${ITEMS[id].name} koymak için İnşa ${def.lvl} gerekli.`); return; }
        this.buildSel = id; this.buildTool = 'koy'; this.buildBar();
      };
      bar.appendChild(b);
    }
    if (this.buildSel === 'kiremit' && this.buildTool === 'koy') {
      const names = { kiremit: 'Düz', kiremit_sol: 'Sol eğim', kiremit_sag: 'Sağ eğim' };
      const shape = this.roofShape || 'kiremit';
      bar.appendChild(UI.button(`Şekil: ${names[shape]}`, () => {
        const order = BUILD.kiremit.shapes;
        this.roofShape = order[(order.indexOf(shape) + 1) % order.length];
        this.buildBar();
      }, 'small'));
    }
    bar.appendChild(UI.button('Kaldır', () => { this.buildTool = this.buildTool === 'kaldir' ? 'koy' : 'kaldir'; this.buildBar(); }, 'small' + (this.buildTool === 'kaldir' ? ' sel red' : '')));
    bar.appendChild(UI.button('Bitti', () => this.stopBuild(), 'small primary'));
    const sel = this.buildTool === 'kaldir' ? 'Kaldır: bloğa dokun' : this.buildSel ? `${ITEMS[this.buildSel].name}: boş kareye dokun` : 'Blok seç';
    UI.setLocation(`İnşa · ${sel}`);
  }

  canPlace(id, cell) {
    const def = BUILD[id];
    const cells = S.save.plot.cells;
    const g = this.plotGeom();
    if (cells[cell.key]) return 'Orası dolu.';
    if (def.ground && cell.r !== 0) return 'Tarla sadece zemine konur.';
    if (def.tall && (cell.r + 1 >= g.rows || cells[`${cell.c},${cell.r + 1}`])) return 'Kapının üstünde bir boş kare daha lazım.';
    if (cell.r === 1 && cells[`${cell.c},0`] && cells[`${cell.c},0`].id === 'tarla') return 'Tarlanın üstü bitki için boş kalmalı.';
    if (id === 'tarla') {
      const n = Object.values(cells).filter((x) => x.id === 'tarla').length;
      const mx = MAX_TARLA(S.level('insa')) + (S.has('mimar') ? 4 : 0);
      if (n >= mx) return `En fazla ${mx} tarla koyabilirsin (İnşa seviyesiyle artar).`;
      if (cells[`${cell.c},1`]) return 'Tarlanın üstü boş olmalı.';
    }
    return null;
  }

  async placeAt(cell) {
    if (this.busy) return;
    const id = this.buildSel;
    if (!id || !S.countItem(id)) { UI.feed('Önce aşağıdan bir blok seç.'); this.sulk(); return; }
    const def = BUILD[id];
    if (S.level('insa') < def.lvl) { UI.feed(`İnşa ${def.lvl} gerekli.`); this.sulk(); return; }
    const why = this.canPlace(id, cell);
    if (why) { UI.feed(why); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    // blogu koyar, bir adim geri cekilir (placeblock)
    sfx('craft');
    const anim = playAnim(this.player, 'c_placeblock', 2.2);
    await wait(this, 260);
    S.removeItem(id, 1);
    const cells = S.save.plot.cells;
    cells[cell.key] = id === 'kiremit' && this.roofShape && this.roofShape !== 'kiremit' ? { id, shape: this.roofShape } : { id };
    if (def.tall) cells[`${cell.c},${cell.r + 1}`] = { id, top: true };
    this.drawCell(cell.key);
    if (def.tall) this.drawCell(`${cell.c},${cell.r + 1}`);
    if (id === 'tarla') this.refreshGarden();
    // Insa XP sadece arsadaki blok sayisi yeni bir rekora cikinca (koy-kaldir ile XP kasilmaz)
    const placed = S.placedCount();
    let ups = [];
    if (placed > (S.save.plot.best || 0)) {
      S.save.plot.best = placed;
      UI.floatText(this.player.x, GROUND_Y - 44, `+${def.xp} İnşa XP`, 'good');
      const before = this.plotGeom();
      ups = S.addXp({ insa: def.xp });
      const after = this.plotGeom();
      if (after.cols !== before.cols || after.rows !== before.rows) this.time.delayedCall(1200, () => { if (this.mode === 'plot') { UI.banner('Arsan büyüdü!', `${after.cols}×${after.rows} blok`, 2000); const b = this.building; this.goPlot(); if (b) this.startBuild(); } });
    }
    S.changed();
    await anim;
    this.idle();
    for (const u of ups) await this.levelUp(u);
    this.busy = false;
    if (this.building) { if (!S.countItem(id)) this.buildSel = null; this.buildBar(); }
  }

  async removeAt(cell) {
    if (this.busy) return;
    const cells = S.save.plot.cells;
    let key = cell.key;
    let c = cells[key];
    if (!c) return;
    if (c.top) { key = `${cell.c},${cell.r - 1}`; c = cells[key]; }
    if (c.id === 'tarla' && S.save.plot.garden[key]) { UI.feed('Tarlada bitki var. Önce hasat et.'); this.sulk(); return; }
    if (!S.fits(c.id)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    await playAnim(this.player, 'c_punch', 1.6);
    sfx('break');
    const [cc, rr] = key.split(',').map(Number);
    delete cells[key];
    this.drawCell(key);
    if (BUILD[c.id] && BUILD[c.id].tall) { delete cells[`${cc},${rr + 1}`]; this.drawCell(`${cc},${rr + 1}`); }
    S.addItem(c.id, 1);
    S.changed();
    this.idle();
    this.busy = false;
    if (this.building) this.buildBar();
  }

  // ---- bahce
  gardenTap(cell) {
    const info = this.gardenInfo(cell.key);
    if (!info) {
      const seeds = Object.keys(SEEDS).filter((id) => S.countItem(id) > 0);
      if (!seeds.length) { UI.feed('Tohumun yok. Keşifte ot ve böğürtlen toplarken tohum çıkar, Hancı Lale de satar.'); this.sulk(); return; }
      UI.choice('Bahçe tarlası', 'Ne ekmek istersin?', [
        ...seeds.map((id) => ({ label: `${SEEDS[id].name} (${S.countItem(id)})`, cls: 'primary', onClick: () => this.plant(cell, id) })),
        { label: 'Vazgeç' },
      ]);
      return;
    }
    if (!info.ready) {
      const m = Math.ceil(info.left / 60000);
      this.say(`${info.sd.name} büyüyor. ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`} kaldı.`, 2600);
      return;
    }
    this.harvest(cell, info);
  }

  async plant(cell, seed) {
    if (this.busy || !S.countItem(seed)) return;
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 900);
    S.removeItem(seed, 1);
    S.save.plot.garden[cell.key] = { seed, t0: Date.now() };
    sfx('gather');
    S.changed();
    this.refreshGarden();
    UI.feed(`${SEEDS[seed].name} ektin. ${SEEDS[seed].ms / 3600000} saatte büyür, oyun kapalıyken de.`);
    this.idle();
    this.busy = false;
  }

  async harvest(cell, info) {
    if (this.busy) return;
    const n = info.sd.n[0] + Math.floor(Math.random() * (info.sd.n[1] - info.sd.n[0] + 1));
    if (!S.fits(info.sd.out, n)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 1100);
    delete S.save.plot.garden[cell.key];
    sfx('gather');
    this.giveDrop(info.sd.out, n, 'Hasat ettin:', true);
    if (Math.random() < 0.5) this.giveDrop(info.seed, 1, 'Tohum geri geldi:', true);
    UI.floatText(this.player.x, GROUND_Y - 44, `+${info.sd.xp} Toplama XP`, 'good');
    const ups = S.addXp({ toplama: info.sd.xp });
    S.save.stats.gathered++;
    S.changed();
    this.refreshGarden();
    for (const u of ups) await this.levelUp(u);
    this.idle();
    this.busy = false;
  }

  // ------------------------------------------------------------ maden ocagi
  // ------------------------------------------------------------ gol (0.8.5)
  // Ussun arkasindaki kucuk gol: iskelenin ucunda balik tutulur.
  async enterPond() {
    UI.closePanel();
    if (this.busy || this.mode !== 'base') return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    this.player.setFlipX(true);
    await moveTo(this.player, -12, { speed: 190, anim: 'c_sprint' });
    await this.fade(true);
    this.goPond();
    this.player.x = -12;
    await this.fade(false);
    await moveTo(this.player, POND.standX, { speed: 95, anim: 'c_walk' });
    this.player.y = POND.deck + 1;
    this.idle();
    this.busy = false;
    this.pondActions();
    if (!S.save.fishing.total) UI.feed('Üs Göleti! "Olta at" de, şamandıra batınca dokun, sonra yeşil kutuyla balığı yakala.');
  }

  goPond() {
    this.mode = 'pond';
    this.clearRoom();
    this.tod = todNow();
    this.bg.setTexture(this.todBg('bg_pond'));
    this.addPond('us', false);
    this.applyTod();
    this.player.setFlipX(false);
    this.resetPlayer();
    this.idle();
    UI.setLocation('Üs Göleti');
  }

  // gol cizimi ve balik tutma noktasi (us ya da Kesif odasi)
  addPond(water, bridge) {
    if (!this.textures.exists('bobber')) this.textures.addCanvas('bobber', bobber());
    const key = `pond_${water}_${bridge ? 1 : 0}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, pondOverlay(water, bridge));
    this.addObj(this.add.image(0, GROUND_Y - 16, key).setOrigin(0, 0).setDepth(3));
    this.fishSpot = { water, bobX: POND.bobX, surfY: POND.surf, standX: POND.standX };
  }

  pondActions() {
    UI.setActions([
      { label: 'Olta at', cls: 'primary', onClick: () => this.cast() },
      { label: baitLabel(), cls: 'blue', onClick: () => { cycleBait(); this.pondActions(); } },
      { label: 'Üsse dön', onClick: () => this.leavePond() },
    ]);
  }

  async leavePond() {
    if (this.busy || this.mode !== 'pond') return;
    this.busy = true;
    UI.setActions([]);
    this.player.y = GROUND_Y;
    this.player.setFlipX(false);
    await moveTo(this.player, GAME_W + 12, { speed: 190, anim: 'c_sprint' });
    await this.fade(true);
    this.goBase('pond');
    this.player.x = 12;
    await this.fade(false);
    this.busy = false;
  }

  // bir atis: balik, sandik ya da su Glemonu
  async cast() {
    if (this.busy || !this.fishSpot) return;
    const room = this.mode === 'dungeon' ? this.rooms[this.roomIdx] : null;
    const spot = this.fishSpot;
    if (WATERS[spot.water].lava && !(S.rod() && S.rod().lava)) {
      UI.feed('Lav gölü! Burada sadece Kor Olta ile balık tutabilirsin (Balıkçılık 70).');
      this.sulk();
      return;
    }
    if (!S.save.equip.olta) { UI.feed('Oltan yok! Çantandan bir olta kuşan ya da Üretim Masasında yap.'); this.sulk(); return; }
    if (S.bagFreeSlots() === 0) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    UI.setActions([]);
    if (Math.abs(this.player.x - spot.standX) > 2) {
      this.player.y = GROUND_Y;
      await moveTo(this.player, spot.standX, { speed: 95, anim: 'c_walk' });
    }
    this.player.y = POND.deck + 1;
    const out = await castOnce(this);
    if (room && room.type === 'gol' && !(out && out.nofish)) room.casts--;
    let ups = [];
    if (out && out.fish) {
      const f = FISH[out.fish];
      const xp = Math.round(fishXp(f) * (out.manual ? 1.2 : 1));
      const fs = S.save.fishing;
      const first = !fs.caught[out.fish];
      fs.caught[out.fish] = (fs.caught[out.fish] || 0) + 1;
      fs.total = (fs.total || 0) + 1;
      S.save.stats.fished = fs.total;
      this.giveDrop(out.fish, 1, 'Tuttun:', true);
      if (f.legend) {
        UI.banner('EFSANE BALIK!', f.name, 2600, 'gold');
        this.giveDrop('efsane_pul', 1 + (Math.random() < 0.4 ? 1 : 0), 'Pulları parlıyor:', true);
      } else if (first) UI.feed(`Yeni balık: ${f.name}! Albümdeki Balıklar sayfasına yazıldı.`);
      UI.floatText(this.player.x, POND.deck - 46, `+${xp} Balıkçılık XP`, 'good');
      ups = S.addXp({ balikcilik: xp });
      await this.playPool('sevinc', 900);
    } else if (out && out.chest) {
      const c = chestLoot(spot.water);
      sfx('rare');
      UI.banner('Batık sandık!', 'Oltana bir sandık takıldı', 1800, 'gold');
      S.addGold(c.gold);
      UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Batık sandık! +${c.gold} ${CURRENCY}`, 'gold');
      for (const [id, n] of c.loot) this.giveDrop(id, n, 'Sandıktan:', true);
      ups = S.addXp({ balikcilik: 40 + S.level('balikcilik') * 4 });
      await this.playPool('sevinc', 900);
    } else if (out && out.glemon) {
      ups = S.addXp({ balikcilik: 30 + S.level('balikcilik') * 3 });
      S.changed();
      for (const u of ups) await this.levelUp(u);
      await this.waterFight(out.glemon, room);
      return;
    }
    S.changed();
    for (const u of ups) await this.levelUp(u);
    this.player.y = POND.deck + 1;
    this.idle();
    this.busy = false;
    if (this.mode === 'pond') this.pondActions();
    else this.refreshRoomActions();
  }

  // oltaya Glemon takildi: savas (kaybedersen sadece canin azalir, tur bozulmaz)
  async waterFight(key, room) {
    const G = GLEMONS[key];
    sfx('warn');
    UI.banner('Oltaya bir Glemon takıldı!', G.name, 1800, 'gold');
    this.cameras.main.shake(300, 0.008);
    await wait(this, 900);
    const floor = this.mode === 'dungeon' ? this.floor : Math.max(1, Math.min(30, Math.round(S.level('balikcilik') / 1.6)));
    const saved = this.floor;
    this.floor = floor;
    const stage = Math.random() < 0.15 ? 1 : 0;
    this.battle = new Battle(this, [{ key, stage, shiny: Math.random() < S.shinyChance() }], { ...this.battleOpts(room || {}), floor });
    this.player.y = GROUND_Y;
    await this.enterBattleView();
    const res = await this.battle.start();
    this.battle = null;
    if (this.inBattleView) await this.exitBattleView(true);
    this.floor = saved;
    if (this.mode === 'pond' || room) {
      this.player.x = this.fishSpot.standX;
      this.player.y = POND.deck + 1;
    }
    if (res === 'lose') {
      if (this.mode === 'dungeon') { this.onDeath(); return; }
      S.hp = Math.max(1, Math.round(S.maxHp() * 0.3));
      UI.feed(`${G.name} seni yendi ve suya geri daldı. Biraz dinlen.`);
      S.changed();
      playAnim(this.player, 'c_cry', 1).then(() => this.idle());
    }
    this.busy = false;
    if (this.mode === 'pond') this.pondActions();
    else this.refreshRoomActions();
  }

  async enterMine(depth) {
    UI.closePanel();
    if (!this.busy && this.mode === 'base') stopMusic();
    if (this.busy || this.mode !== 'base') return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    this.goMine(depth || S.save.mine.depth || 1);
    await this.fade(false);
    this.busy = false;
    UI.feed('Maden Ocağı! Sol sıradaki ya da yanı açık bloklara dokunup kaz.');
  }

  goMine(depth) {
    this.mode = 'mine';
    this.clearRoom();
    this.mineDepth = depth;
    S.save.mine.depth = depth;
    S.save.stats.deepestMine = Math.max(S.save.stats.deepestMine || 1, depth);
    S.changed();
    const key = `cave_${Math.min(depth, 9)}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, caveBackground(Math.min(depth, 9)));
    this.bg.setTexture(key);
    this.buildWall(depth);
    this.bombArmed = false;
    this.player.setFlipX(false);
    this.player.x = 150;
    this.resetPlayer();
    this.idle();
    UI.setLocation(`Maden Ocağı · Derinlik ${depth}`);
    this.mineActions();
  }

  buildWall(depth) {
    const W = MINE_WALL;
    // 0.8.6: duvar kayda yazilir. Madenden cikip girmek yeni duvar vermez (define/Bonkit
    // icin duvar cevirme acigi); yarisi kazilinca ya da 10 dakika gecince yenilenir.
    const sv = S.save.mine.wall;
    const half = (MINE_COLS * MINE_ROWS) / 2;
    const keep = sv && sv.depth === depth && Array.isArray(sv.grid) && sv.grid.length === MINE_ROWS
      && sv.grid.every((r) => Array.isArray(r) && r.length === MINE_COLS && r.every((k) => k === null || ORES[k]))
      && sv.grid.flat().filter((k) => k === null).length < half && Date.now() - sv.t < 10 * 60 * 1000;
    const weights = oreWeights(depth).map(([k, w]) => [k, ['toprak', 'kum', 'tas', 'komur'].includes(k) ? w : w * S.perk('damar_bulucu', 1.3, 1)]);
    const grid = [];
    for (let r = 0; r < MINE_ROWS; r++) {
      const row = [];
      for (let c = 0; c < MINE_COLS; c++) {
        let kind = weighted(weights);
        if (depth === 1 && r < 2 && Math.random() < 0.6) kind = 'toprak';
        row.push(kind);
      }
      grid.push(row);
    }
    // cevherler damar gibi kumelensin
    for (let r = 0; r < MINE_ROWS; r++) {
      for (let c = 0; c < MINE_COLS; c++) {
        const k = grid[r][c];
        if (['komur', 'demir', 'altin', 'kristal', 'kor', 'golge'].includes(k) && Math.random() < 0.35) {
          const [dr, dc] = pick([[0, 1], [1, 0], [0, -1], [-1, 0]]);
          const rr = r + dr; const cc = c + dc;
          if (rr >= 0 && rr < MINE_ROWS && cc >= 0 && cc < MINE_COLS) grid[rr][cc] = k;
        }
        if (Math.random() < DEFINE_CHANCE) grid[r][c] = 'define';
        else if (Math.random() < BONKIT_CHANCE) grid[r][c] = 'bonkit';
      }
    }
    if (keep) for (let r = 0; r < MINE_ROWS; r++) for (let c = 0; c < MINE_COLS; c++) grid[r][c] = sv.grid[r][c];
    else S.save.mine.wall = { depth, t: Date.now(), grid: grid.map((r) => r.slice()) };
    this.wall = [];
    for (let r = 0; r < MINE_ROWS; r++) {
      const row = [];
      for (let c = 0; c < MINE_COLS; c++) {
        const kind = grid[r][c];
        const x = W.x + c * W.size + W.size / 2;
        const y = GROUND_Y - (MINE_ROWS - r) * W.size + W.size / 2;
        const spr = this.add.image(x, y, 'ores', kind || 'tas').setDepth(5);
        const b = { r, c, kind, hits: 0, spr, crack: null };
        if (kind) spr.setInteractive({ useHandCursor: true }); else spr.setVisible(false);
        spr.on('pointerdown', () => this.onBlock(b));
        this.roomObjs.push(spr);
        row.push(b);
      }
      this.wall.push(row);
    }
  }

  blockAt(r, c) {
    if (r < 0 || c < 0 || r >= MINE_ROWS || c >= MINE_COLS) return null;
    return this.wall[r][c];
  }

  isExposed(b) {
    if (b.c === 0) return true;
    return [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dr, dc]) => {
      const n = this.blockAt(b.r + dr, b.c + dc);
      return n && n.kind === null;
    });
  }

  minedCount() { return this.wall.flat().filter((b) => b.kind === null).length; }

  mineActions() {
    const bombs = S.countItem('bonk_bombasi');
    const half = this.minedCount() >= (MINE_COLS * MINE_ROWS) / 2;
    UI.setActions([
      half ? { label: 'Daha derin ↓', cls: 'primary', onClick: () => this.changeDepth(1) }
        : { label: `Daha derin (${this.minedCount()}/${(MINE_COLS * MINE_ROWS) / 2})`, cls: 'primary', disabled: true, onClick: () => {} },
      this.mineDepth > 1 ? { label: 'Yukarı ↑', onClick: () => this.changeDepth(-1) } : null,
      bombs > 0 ? { label: this.bombArmed ? 'Bomba: bloğa dokun' : `Bonk Bombası (${bombs})`, cls: 'purple', onClick: () => { this.bombArmed = !this.bombArmed; this.mineActions(); } } : null,
      { label: 'Üsse dön', onClick: () => this.leaveMine() },
    ]);
  }

  async changeDepth(d) {
    if (this.busy) return;
    if (d > 0 && this.mineDepth + d > DEEP_LIMIT && !S.perk('derin_kazi')) {
      UI.feed(`Derinlik ${DEEP_LIMIT}'ten aşağısı çok sert. Yetenek ağacındaki Derin Kazı yeteneği gerekli.`);
      this.sulk();
      return;
    }
    this.busy = true;
    UI.setActions([]);
    sfx('stairs');
    await this.fade(true);
    this.goMine(Math.max(1, this.mineDepth + d));
    await this.fade(false);
    this.busy = false;
    if (d > 0) UI.feed(`Derinlik ${this.mineDepth}: ${mineHardBonus(this.mineDepth) ? 'bloklar daha sert, ' : ''}cevherler daha bol. XP ×${mineXpMult(this.mineDepth).toFixed(2)}`);
  }

  async leaveMine() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, 40, { speed: 110, anim: 'c_walk' });
    await this.fade(true);
    this.goBase('mine');
    await this.fade(false);
    this.busy = false;
  }

  oreReq(kind) { return ORES[kind].req; }

  // bloga dokununca: kontroller, sonra kazma
  onBlock(b) {
    if (this.mode !== 'mine' && this.mode !== 'dungeon') return;
    if (this.busy || UI.panelOpen() || !b.kind) return;
    if (this.mode === 'dungeon' && this.battle) return;
    const ore = ORES[b.kind];
    const by = b.spr.y - 10;
    if (this.mode === 'mine' && !this.isExposed(b)) { UI.floatText(b.spr.x, by, 'Önce yanını kaz', 'note'); this.sulk(); return; }
    if (this.bombArmed && this.mode === 'mine') { this.useBomb(b); return; }
    if (!S.pick()) { UI.feed('Kazma kuşanmadan kazamazsın. (Çanta → Kazma)'); this.sulk(); return; }
    if (S.level('madencilik') < ore.req) { UI.floatText(b.spr.x, by, `Madencilik ${ore.req} gerekli`, 'note'); sfx('weak'); this.sulk(); return; }
    if (ore.drop && !S.fits(ore.drop)) { UI.floatText(b.spr.x, by, 'Çanta dolu!', 'note'); this.sulk(); return; }
    this.mineBlock(b);
  }

  async mineBlock(b) {
    this.busy = true;
    this.walkTok++;
    const p = this.player;
    const standX = b.standX ?? MINE_STAND_X;
    if (Math.abs(p.x - standX) > 2) await moveTo(p, standX, { speed: 110, anim: 'c_walk' });
    p.setFlipX(false);
    const depth = this.mode === 'mine' ? this.mineDepth : 1;
    const need = Math.max(1, Math.ceil((ORES[b.kind].hard + (this.mode === 'mine' ? mineHardBonus(depth) : 0)) / S.pick()) - (S.has('hizli_kazma') ? 1 : 0));
    while (b.hits < need) {
      const swing = playAnim(p, 'c_mine', 1.3);
      await wait(this, 230);
      b.hits++;
      sfx('mine');
      this.chips(b.spr.x - 4, b.spr.y, b.kind, 3);
      if (b.hits < need) {
        const stage = Math.min(3, Math.ceil((b.hits / need) * 3));
        if (!b.crack) { b.crack = this.add.image(b.spr.x, b.spr.y, 'ores', 'crack1').setDepth(6); this.roomObjs.push(b.crack); }
        b.crack.setFrame(`crack${stage}`);
      }
      await swing;
    }
    await this.breakBlock(b, depth);
    this.idle();
    this.busy = false;
    if (this.mode === 'mine') this.mineActions();
    else if (this.mode === 'dungeon' && this.afterVein) this.afterVein();
  }

  async breakBlock(b, depth, silent = false) {
    const kind = b.kind;
    const ore = ORES[kind];
    b.kind = null;
    const mw = S.save.mine.wall;
    if (this.mode === 'mine' && b.r !== undefined && mw && mw.grid[b.r]) mw.grid[b.r][b.c] = null;
    b.spr.setVisible(false);
    b.spr.disableInteractive();
    if (b.crack) b.crack.setVisible(false);
    if (!silent) sfx('break');
    this.chips(b.spr.x, b.spr.y, kind, 7);
    const xp = Math.round(ore.xp * mineXpMult(depth));
    S.save.stats.mined++;
    if (ore.drop) {
      const left = S.addItem(ore.drop, 1);
      if (left === 0) UI.floatText(b.spr.x, b.spr.y - 6, `+1 ${ITEMS[ore.drop].name}`, 'info');
      else UI.feed(`Çanta dolu! ${ITEMS[ore.drop].name} sığmadı.`);
    }
    // 0.8.5: topraktan solucan cikar (balik yemi)
    if (kind === 'toprak' && Math.random() < 0.35 && S.addItem('solucan', 1) === 0) UI.floatText(b.spr.x, b.spr.y - 14, '+1 Solucan', 'info');
    if (kind === 'define') {
      const gold = 20 + Math.floor(Math.random() * 30 * depth);
      S.addGold(gold);
      sfx('rare');
      S.logDrop(null, 'Define sandığı', { note: `buldun! +${gold} ${CURRENCY}` });
      UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Define sandığı! +${gold} ${CURRENCY}`, 'gold');
      this.celebrate();
      for (let i = 0; i < 2; i++) this.giveDrop(pick(['komur', 'demir_cevheri', 'sifali_ot', 'kum']), 1 + Math.floor(Math.random() * 3), 'Defineden');
    }
    UI.floatText(b.spr.x, b.spr.y - 16, `+${xp} XP`, 'good');
    const ups = S.addXp({ madencilik: xp });
    S.changed();
    for (const u of ups) await this.levelUp(u);
  }

  chips(x, y, kind, n) {
    const tint = { toprak: 0xa07150, kum: 0xe6cd88, tas: 0x9e9aa6, komur: 0x3a3642, demir: 0xe0a882, define: 0xffd04d, altin: 0xf0c850, kristal: 0xa8d8f0, kor: 0xf08a3a, bonkit: 0x80e4a8, golge: 0x8a6ac0, yildiz: 0xf4f4ff, cekirdek: 0xe05aa0 }[kind] || 0x9e9aa6;
    for (let i = 0; i < n; i++) {
      const c = this.add.image(x, y, 'chip').setDepth(12).setTint(tint);
      this.tweens.add({
        targets: c, x: x + (Math.random() * 28 - 14), y: y + 10 + Math.random() * 14, alpha: 0, angle: Math.random() * 180,
        duration: 380 + Math.random() * 200, ease: 'Quad.easeOut', onComplete: () => c.destroy(),
      });
    }
  }

  async useBomb(b) {
    this.bombArmed = false;
    if (S.removeItem('bonk_bombasi', 1) < 1) { this.mineActions(); return; }
    this.busy = true;
    const p = this.player;
    if (Math.abs(p.x - MINE_STAND_X) > 2) await moveTo(p, MINE_STAND_X - 30, { speed: 110, anim: 'c_walk' });
    p.setFlipX(false);
    await playAnim(p, 'c_punch', 1.4);
    const boom = this.add.sprite(b.spr.x, b.spr.y, 'boom').setDepth(13).setScale(1.3);
    boom.play('boom');
    boom.once('animationcomplete', () => boom.destroy());
    sfx('boom');
    this.cameras.main.shake(300, 0.016);
    await wait(this, 150);
    let skipped = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const n = this.blockAt(b.r + dr, b.c + dc);
        if (!n || !n.kind) continue;
        if (S.level('madencilik') < ORES[n.kind].req) { skipped++; continue; }
        await this.breakBlock(n, this.mineDepth, true);
      }
    }
    if (skipped) UI.feed('Bazı cevherler için Madencilik seviyen yetmedi, bomba onları kıramadı.');
    this.idle();
    this.busy = false;
    this.mineActions();
  }

  async enterDungeon(floor) {
    UI.closePanel();
    if (this.busy) return;
    this.busy = true;
    stopMusic();
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    S.startRun(floor);
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    this.zz = null;
    await this.enterFloor(floor);
  }

  // ------------------------------------------------------------ Zindan (0.6)
  // Kesif'ten ayri, sonsuz inis. Her kat bir oncekinden zor; 5 katta bir ara patron ve
  // odul sandigi. En derin kat rekoru arkadaslarla yarisilir (Eren'in secimi, 2026-11-07).
  unlockedZones() {
    const k = S.save.stats.glemons || {};
    return ZONES.filter((z) => z.open && (!z.after || k[z.after] > 0));
  }
  zone() { return this.zz || zoneOf(this.floor); }
  zEff(n) { return Math.round(2 + n * 1.6); }
  inZindan() { return !!(S.run && S.run.zindan); }

  async enterZindan(level = 1) {
    UI.closePanel();
    if (this.busy) return;
    this.busy = true;
    stopMusic();
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    S.startRun(level);
    S.run.zindan = true;
    S.run.zseed = Math.floor(Math.random() * 3);
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    await this.enterFloor(level);
  }

  // 5 katta bir odul sandigi: derinlestikce buyur
  async zindanReward() {
    const n = this.zLevel;
    const gold = Math.round(40 * n * (1 + n / 10));
    S.addGold(gold);
    UI.banner('Zindan ödülü!', `Kat ${n}`, 1800, 'gold');
    UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Ödül sandığından ${gold} ${CURRENCY}!`, 'gold');
    const zs = this.unlockedZones();
    for (let i = 0; i < 1 + Math.floor(n / 10); i++) {
      const zc = ZONE_CHEST[pick(zs).key];
      this.giveDrop(pick(zc.mats), 2 + Math.floor(n / 5), 'Ödül sandığından');
    }
    if (Math.random() < Math.min(0.9, 0.3 + n * 0.02) * S.dropMult()) {
      const zc = ZONE_CHEST[pick(zs).key];
      this.giveDrop(weighted(zc.gear || CHEST_GEAR), 1, 'Ödül sandığından');
    }
    if (Math.random() < 0.15 + n * 0.01) this.giveDrop('altin_elma', 1, 'Ödül sandığından');
    if (Math.random() < 0.04 + n * 0.006) this.giveDrop('can_tilsimi', 1, 'Ödül sandığından');
    if (n >= 10 && Math.random() < 0.5) this.giveDrop('orta_iksir', 2, 'Ödül sandığından');
    // 0.8: derinlerde nadir cevherler ve efsanevi yumurta
    if (n >= 15 && Math.random() < 0.25) this.giveDrop(pick(['altin_cevheri', 'saf_kristal', 'kor_tasi']), 2 + Math.floor(n / 10), 'Ödül sandığından');
    if (n >= 20 && Math.random() < 0.06 + n * 0.002) this.giveDrop('bonkit', 1, 'Ödül sandığından');
    if (Math.random() < Math.min(0.15, 0.02 + n * 0.002) * S.dropMult()) this.giveDrop(`yumurta_${pick(zs).key}`, 1, 'Ödül sandığından');
  }

  zindanRooms(level) {
    const W = [['savas', 50], ['uyuyan', 15], ['sandik', 12], ['tuzak', 18], ['maden', 5]];
    const rooms = [{ type: 'savas' }];
    const n = 3 + (level >= 10 ? 1 : 0);
    for (let i = 1; i < n; i++) rooms.push({ type: weighted(W) });
    for (const r of rooms) r.dark = Math.random() < 0.25;
    rooms[0].dark = false;
    if (level % 5 === 0) { rooms.push({ type: 'arapatron' }); rooms.push({ type: 'sandik', big: true }); }
    rooms.push({ type: 'merdiven' });
    return rooms;
  }

  // ------------------------------------------------------------ zindan
  // bolgenin kacinci kati (1-10)
  zoneFloor(f = this.floor) { return this.inZindan() ? Math.min(10, 2 + Math.floor(this.zLevel / 2)) : f - zoneOf(f).floors[0] + 1; }

  genRooms(f) {
    if (this.inZindan()) return this.zindanRooms(this.zLevel);
    const zf = this.zoneFloor(f);
    const zone = zoneOf(f);
    const n = Math.min(6, 4 + Math.floor(zf / 4) + (zone.key === 'orman' ? 0 : 1));
    const rooms = [];
    let kamp = false;
    for (let i = 0; i < n - 1; i++) {
      let t = weighted(ROOM_WEIGHTS);
      if (i === 0 && (t === 'tuzak' || t === 'kamp')) t = 'savas';
      if (t === 'kamp') { if (kamp) t = 'savas'; kamp = true; }
      // magarada bazi odalar karanlik (fener gerekir)
      rooms.push({ type: t, dark: i > 0 && Math.random() < (zone.key === 'magara' ? 0.3 : zone.key === 'golge' ? 0.5 : 0) });
    }
    if (zf === 5) rooms.push({ type: 'arapatron' });
    if (zf === 10) {
      if (!kamp) rooms.push({ type: 'kamp' });
      rooms.push({ type: 'boss' });
    } else rooms.push({ type: 'merdiven' });
    return rooms;
  }

  enemyCount(f) {
    const zf = this.zoneFloor(f);
    return pick(zf <= 2 ? (f <= 2 ? [1, 1, 2] : [1, 2, 2]) : zf <= 6 ? [1, 2, 2, 3] : [2, 2, 3]);
  }

  enemySpecs(n, extra = {}) {
    const table = ZONE_SPAWNS[this.zone().key];
    const [usta, genc] = wildStageChances(this.zoneFloor());
    return Array.from({ length: n }, () => {
      const r = Math.random();
      const stage = r < usta ? 2 : r < usta + genc ? 1 : 0;
      return { key: weighted(table), shiny: Math.random() < S.shinyChance(), stage, ...extra };
    });
  }

  roomLabel() {
    if (this.inZindan()) return `Zindan · Kat ${this.zLevel} · Oda ${this.roomIdx + 1}/${this.rooms.length}`;
    return `${zoneOf(this.floor).name} · Kat ${this.floor} · Oda ${this.roomIdx + 1}/${this.rooms.length}`;
  }

  async enterFloor(f) {
    if (this.inZindan()) {
      this.zLevel = f;
      this.floor = this.zEff(f);
      const zs = this.unlockedZones();
      this.zz = zs[(Math.floor((f - 1) / 3) + (S.run.zseed || 0)) % zs.length];
      this.rooms = this.genRooms(f);
      if (f > (S.save.stats.zindanBest || 0)) {
        S.save.stats.zindanBest = f;
        if (f > 1 && f % 10 === 1) UI.feed(`<span style="color:#ffd04d">Zindan Kat ${f} kısayolu açıldı!</span>`, 'gold');
      }
      S.changed();
      await this.enterRoom(0);
      return;
    }
    this.floor = f;
    this.zz = null;
    this.rooms = this.genRooms(f);
    if (f > S.save.stats.deepest) {
      S.save.stats.deepest = f;
      if (f === 5 || f === 10) UI.feed(`<span style="color:#ffd04d">Kat ${f} kısayolu açıldı! Artık üsten direkt buraya inebilirsin.</span>`, 'gold');
    }
    S.changed();
    await this.enterRoom(0);
  }

  async enterRoom(i) {
    this.busy = true;
    UI.setActions([]);
    await this.fade(true);
    this.clearRoom();
    this.roomIdx = i;
    const room = this.rooms[i];
    const v = i % 3;
    const zone = this.zone();
    const zin = this.inZindan();
    const key = zin ? `zbg_${Math.min(this.zLevel, 40)}_${v}` : `bg_${this.floor}_${v}${room.dark ? '_d' : ''}`;
    this.roomBg = null;
    this.bgTex(key, () => (zin ? dungeonRoomBackground(Math.min(this.zLevel, 40), v) : zone.key === 'magara' ? caveRoomBackground(this.floor, v, !!room.dark)
      : zone.key === 'col' ? desertRoomBackground(this.floor, v) : BIOME_KEYS.includes(zone.key) ? biomeRoomBackground(zone.key, this.floor, v) : forestBackground(this.floor, v)));
    this.bg.setTexture(key);
    this.player.setFlipX(false);
    this.player.x = -20;
    if (this.follower) this.follower.x = -48;
    this.resetPlayer();
    this.prepareRoom(room);
    this.darkness(room);
    UI.setLocation(this.roomLabel());
    await this.fade(false);
    if (i === 0) UI.banner(zin ? `Zindan Kat ${this.zLevel}` : `Kat ${this.floor}`, zin ? `Rekorun: Kat ${S.save.stats.zindanBest || 0}` : zone.name, 1600);
    await moveTo(this.player, PLAYER_HOME, { speed: 115, anim: 'c_walk', timeScale: 1.3 });
    this.idle();
    if (zone.key === 'col' && !zin) await this.heat();
    if (zone.key === 'buz' && !zin) await this.coldCheck();
    if (zone.key === 'kor' && !zin) await this.lavaCheck();
    if (room.dark && i > 0 && !room.toldDark) {
      room.toldDark = true;
      UI.feed(S.darkproof() ? 'Karanlık oda! Ama gölgelerin içini görebiliyorsun.' : S.countItem('fener') > 0 ? 'Karanlık oda! Fenerin yolu aydınlatıyor.' : 'Karanlık oda! Fenerin yok, Glemonları zor göreceksin. (Fener: Üretim Masası)');
    }
    this.busy = false;
    this.runRoom(room);
  }

  // Magaranin karanlik odalari: fener varsa oyuncunun cevresi aydinlik
  darkness(room) {
    if (!room.dark) return;
    const lit = S.countItem('fener') > 0;
    const ov = this.add.rectangle(0, 0, GAME_W, 216, 0x07050c, lit ? 0.35 : 0.62).setOrigin(0).setDepth(11);
    this.roomObjs.push(ov);
    if (lit) {
      const gl = this.add.image(this.player.x, GROUND_Y - 16, 'glow').setDepth(12).setScale(2.6).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
      this.roomObjs.push(gl);
      this.lightTimer = gl;
      const follow = () => { if (gl.active) { gl.x = this.player.x; requestAnimationFrame(follow); } };
      follow();
    }
  }

  unlit(room) { return !!room.dark && S.countItem('fener') === 0 && !S.darkproof(); }

  // 0.8 Donmus Zirve: sicak corba yoksa savaslarda yavaslarsin
  cold() { return this.zone().key === 'buz' && !this.inZindan() && Date.now() >= (S.save.warmUntil || 0); }
  async coldCheck() {
    if (Date.now() < (S.save.warmUntil || 0)) return;
    if (S.countItem('sicak_corba') > 0) {
      S.removeItem('sicak_corba', 1);
      S.save.warmUntil = Date.now() + 30 * 60 * 1000;
      S.hp = Math.min(S.maxHp(), S.hp + Math.round(S.maxHp() * 0.2));
      UI.feed('Üşüdün ve Sıcak Çorba içtin. 30 dakika soğuktan etkilenmezsin.');
      await playAnim(this.player, 'c_eat', 2.4);
      this.idle();
      this.refreshHud();
      S.changed();
      return;
    }
    if (!this.toldCold) { this.toldCold = true; UI.feed('Donmuş Zirve çok soğuk! Sıcak Çorba taşımazsan savaşlarda yavaşlarsın. (Fırın: Mantar + Şifalı ot + Kömür, ya da Hancı Lale)'); }
  }
  // 0.8 Kor Diyari: ates direnci yoksa savaslara yanarak baslarsin
  burning() { return this.zone().key === 'kor' && !this.inZindan() && Date.now() >= (S.save.fireResUntil || 0) && !S.fireproof(); }
  async lavaCheck() {
    if (Date.now() < (S.save.fireResUntil || 0) || S.fireproof()) return;
    if (S.countItem('ates_iksiri') > 0) {
      S.removeItem('ates_iksiri', 1);
      S.save.fireResUntil = Date.now() + 30 * 60 * 1000;
      UI.feed('Lavın sıcağı geldi ve Ateş Direnci İksiri içtin. 30 dakika yanmazsın.');
      await playAnim(this.player, 'c_drinkpotion', 2.4);
      this.idle();
      S.changed();
      return;
    }
    if (!this.toldLava) { this.toldLava = true; UI.feed('Kor Diyarı yakıyor! Ateş Direnci İksiri yoksa savaşlara yanarak başlarsın. (Simya Kazanı ya da Hancı Lale)'); }
  }
  battleOpts(room) { return { floor: this.floor, dark: this.unlit(room), cold: this.cold(), burn: this.burning() }; }

  async eggHatched(h) {
    if (h.progress) { UI.feed(`${h.name} çatırdıyor… (${h.progress}/${S.eggNeed()} savaş)`); return; }
    if (h.full) { UI.feed(`${h.name} çatlamaya hazır ama Ahır dolu! Ahırda yer aç.`); return; }
    const g = GLEMONS[h.key];
    UI.banner('Yumurta çatladı!', `${h.pet.shiny ? 'Parlak ' : ''}${g.name} doğdu!`, 3000, 'gold');
    UI.feed(`<span style="color:#ffd04d">★ Efsanevi yumurta çatladı: ${h.pet.shiny ? 'Parlak ' : ''}${g.name}! Ahırına gitti.</span>`, 'gold');
    sfx('rare');
    this.celebrate();
    this.makeFollower();
    await wait(this, 1200);
  }

  // Col sicagi: su matarasi yoksa her odada biraz can gider (bayiltmaz)
  async heat() {
    if (Date.now() < (S.save.waterUntil || 0)) return;
    if (S.countItem('su_matarasi') > 0) {
      S.removeItem('su_matarasi', 1);
      S.save.waterUntil = Date.now() + 30 * 60 * 1000;
      UI.feed('Susadın ve Su Matarası\'ndan içtin. 30 dakika sıcaktan etkilenmezsin.');
      await playAnim(this.player, 'c_drinkpotion', 2.4);
      this.idle();
      S.changed();
      return;
    }
    const d = Math.max(1, Math.round(S.maxHp() * 0.04));
    if (S.hp <= 1) return;
    S.hp = Math.max(1, S.hp - d);
    UI.floatText(this.player.x, GROUND_Y - 40, `Sıcak! -${d}`, 'hurt');
    if (!this.toldHeat) { this.toldHeat = true; UI.feed('Çöl çok sıcak! Su Matarası taşırsan can kaybetmezsin. (Simya Kazanı: Kaktüs suyu + Pul)'); }
    this.refreshHud();
  }

  prepareRoom(room) {
    const G = GROUND_Y;
    switch (room.type) {
      case 'savas':
        room.specs = room.specs || this.enemySpecs(this.enemyCount(this.floor));
        this.battle = new Battle(this, room.specs, this.battleOpts(room));
        break;
      case 'arapatron': {
        const table = ZONE_SPAWNS[this.zone().key].filter(([k]) => GLEMONS[k].rarity !== 'epik');
        room.specs = room.specs || [{ key: weighted(table), golden: true }];
        this.battle = new Battle(this, room.specs, this.battleOpts({}));
        break;
      }
      case 'boss':
        this.battle = new Battle(this, [{ key: zoneOf(this.floor).boss }], { ...this.battleOpts({}), boss: true });
        break;
      case 'uyuyan': {
        room.specs = room.specs || this.enemySpecs(Math.random() < 0.7 ? 1 : 2, { sleeping: true });
        this.battle = new Battle(this, room.specs, this.battleOpts(room));
        room.zzz = this.battle.enemies.map((e) => UI.bubble(e.sprite.x + 6, this.battle.topY(e) - 2, 'Zzz', 9e8, 'zzz'));
        for (const z of room.zzz) this.labels.push(z);
        break;
      }
      case 'sandik':
        room.obj = this.addObj(this.add.image(250, G + 1, room.opened ? 'chest_open' : 'chest').setOrigin(0.5, 1).setDepth(4));
        break;
      case 'tuzak':
        room.obj = this.addObj(this.add.image(198, G + 1, 'spikes').setOrigin(0.5, 1).setDepth(4));
        break;
      case 'kamp': {
        const fire = this.add.sprite(200, G + 1, 'fire').setOrigin(0.5, 1).setDepth(4);
        fire.play('fire');
        room.obj = this.addObj(fire);
        break;
      }
      case 'merdiven':
        room.obj = this.addObj(this.add.image(300, G, 'stairs').setOrigin(0.5, 0).setDepth(2));
        break;
      case 'gol':
        this.addPond(this.zone().key, true);
        room.casts = room.casts ?? 3;
        break;
      case 'maden': {
        if (!room.vein) {
          const zk = this.zone().key;
          const w = zk === 'orman' ? [['tas', 55], ['komur', 35], ['demir', this.floor >= 4 ? 18 : 0]]
            : zk === 'magara' ? [['tas', 40], ['komur', 30], ['demir', 30], ['define', 3]]
              : zk === 'buz' ? [['tas', 30], ['demir', 25], ['altin', 25], ['kristal', 18], ['define', 4]]
                : zk === 'kor' ? [['tas', 25], ['komur', 25], ['altin', 20], ['kor', 25], ['define', 4]]
                  : zk === 'golge' ? [['tas', 25], ['kristal', 20], ['kor', 20], ['golge', 20], ['bonkit', 1], ['define', 5]]
                    : [['kum', 35], ['tas', 30], ['demir', 25], ['define', 4]];
          room.vein = [[258, G - 8], [274, G - 8], [266, G - 24]].map(([x, y]) => ({ kind: weighted(w), x, y }));
        }
        room.blocks = room.vein.filter((v) => v.kind).map((v) => {
          const b = { kind: v.kind, hits: 0, crack: null, standX: 236, src: v };
          b.spr = this.add.image(v.x, v.y, 'ores', v.kind).setDepth(5);
          b.spr.setInteractive({ useHandCursor: true });
          b.spr.on('pointerdown', () => this.onBlock(b));
          this.roomObjs.push(b.spr);
          return b;
        });
        break;
      }
      default:
        break;
    }
    // toplanabilir bitki / dal
    if (room.node === undefined) {
      const ok = ['savas', 'uyuyan', 'sandik', 'kamp', 'maden', 'arapatron'].includes(room.type);
      room.node = ok && Math.random() < GATHER_CHANCE ? weighted(ZONE_GATHER[this.zone().key]) : null;
      // 0.8.5: gece (gercek saat) Ay otu da cikar
      if (room.node && !this.inZindan() && todNow() === 'gece' && Math.random() < AY_OTU_CHANCE) room.node = 'ay_otu';
      room.nodeX = 146 + Math.floor(Math.random() * 40);
    }
    if (room.node && !room.gathered) {
      const g = GATHER[room.node];
      room.nodeSpr = this.addObj(this.add.image(room.nodeX, G + 1, `node_${g.node}`).setOrigin(0.5, 1).setDepth(3), {
        act: () => this.gather(room), modes: ['dungeon'], direct: true,
      });
    }
  }

  // ------------------------------------------------------------ oda eylemleri
  gatherAction(room) {
    if (!room.node || room.gathered || !room.cleared) return null;
    return { label: `Topla: ${GATHER[room.node].name}`, cls: 'blue', onClick: () => this.gather(room) };
  }

  refreshRoomActions() {
    const room = this.rooms[this.roomIdx];
    if (!room || this.mode !== 'dungeon') return;
    const back = { label: 'Üsse dön', onClick: () => this.returnBase() };
    const next = { label: 'İlerle →', cls: ['sandik', 'kamp', 'maden', 'gol'].includes(room.type) ? '' : 'primary', onClick: () => this.nextRoom() };
    const g = this.gatherAction(room);
    if (room.type === 'sandik') {
      UI.setActions([room.opened ? null : { label: 'Sandığı aç', cls: 'primary', onClick: () => this.openChest(room) }, next, g, back]);
    } else if (room.type === 'kamp') {
      UI.setActions([room.rested ? null : { label: 'Ateşte dinlen (+%30 can)', cls: 'primary', onClick: () => this.rest(room) }, next, g, back]);
    } else if (room.type === 'gol') {
      const lava = WATERS[this.fishSpot.water].lava;
      UI.setActions([
        room.casts > 0 ? { label: `Olta at (${room.casts})`, cls: 'primary', onClick: () => this.cast() } : null,
        room.casts > 0 && !lava ? { label: baitLabel(), cls: 'blue', onClick: () => { cycleBait(); this.refreshRoomActions(); } } : null,
        next, back,
      ]);
    } else if (room.type === 'maden') {
      const left = (room.blocks || []).filter((b) => b.kind);
      UI.setActions([left.length ? { label: `Kaz (${left.length})`, cls: 'primary', onClick: () => this.onBlock(left[left.length - 1]) } : null, next, g, back]);
    } else {
      next.cls = 'primary';
      UI.setActions([next, g, back]);
    }
  }

  async gather(room) {
    if (this.busy || this.battle || !room.cleared || room.gathered || this.mode !== 'dungeon') return;
    const g = GATHER[room.node];
    if (!S.fits(room.node)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    UI.setActions([]);
    const p = this.player;
    await moveTo(p, room.nodeX - 14, { speed: 100, anim: 'c_walk' });
    p.setFlipX(false);
    // yerden toplarken egilip kalkar (sneakspam)
    p.play('c_sneakspam');
    await wait(this, 1300);
    sfx('gather');
    const n = 1 + Math.floor(S.level('toplama') / 10) + (Math.random() < 0.3 ? 1 : 0);
    this.giveDrop(room.node, n, 'Topladın:', true);
    if (Math.random() < BAL_CHANCE) this.giveDrop('bal', 1, 'Bir arı kovanı! Topladın:', true);
    const seed = room.node === 'sifali_ot' ? 'ot_tohumu' : room.node === 'bogurtlen' ? 'bogurtlen_tohumu' : null;
    if (seed && Math.random() < SEED_CHANCE && S.fits(seed)) this.giveDrop(seed, 1, 'Tohum buldun:', true);
    room.gathered = true;
    S.save.stats.gathered++;
    if (room.nodeSpr) this.tweens.add({ targets: room.nodeSpr, alpha: 0, y: room.nodeSpr.y + 4, duration: 300 });
    const xp = Math.round(g.xp * (1 + 0.1 * (this.floor - 1)));
    UI.floatText(p.x, GROUND_Y - 44, `+${xp} Toplama XP`, 'good');
    const ups = S.addXp({ toplama: xp });
    S.changed();
    for (const u of ups) await this.levelUp(u);
    this.idle();
    this.busy = false;
    this.refreshRoomActions();
  }

  runRoom(room) {
    const back = { label: 'Üsse dön', onClick: () => this.returnBase() };
    this.afterVein = null;
    switch (room.type) {
      case 'savas':
      case 'arapatron':
      case 'boss':
        this.fight(room);
        break;
      case 'uyuyan':
        UI.feed('Uyuyan Glemon! Gizlice geçebilir ya da pusu kurabilirsin.');
        UI.setActions([
          { label: 'Gizlice geç', cls: 'blue', onClick: () => this.sneak(room) },
          { label: 'Pusu kur', cls: 'primary', onClick: () => this.ambush(room) },
          back,
        ]);
        break;
      case 'sandik':
      case 'kamp':
        room.cleared = true;
        this.refreshRoomActions();
        break;
      case 'gol': {
        room.cleared = true;
        const w = WATERS[this.zone().key];
        UI.feed(w.lava ? `${w.name}! Kor Olta ile lavda balık tutabilirsin (3 atış).` : `${w.name}! Köprüden 3 kez olta atabilirsin.`);
        this.refreshRoomActions();
        break;
      }
      case 'maden':
        room.cleared = true;
        UI.feed('Maden damarı! Bloklara dokunup kazabilirsin.');
        this.afterVein = () => this.refreshRoomActions();
        this.refreshRoomActions();
        break;
      case 'tuzak':
        UI.feed('Dikenli tuzak! Zıplamak için zamanlamayı tuttur.');
        UI.setActions([{ label: 'Zıpla!', cls: 'primary', onClick: () => this.trap(room) }, back]);
        break;
      case 'merdiven':
        UI.setActions([{ label: `Aşağı in (Kat ${this.inZindan() ? this.zLevel + 1 : this.floor + 1})`, cls: 'primary', onClick: () => this.descend() }, back]);
        break;
      default:
        this.roomDone();
    }
  }

  roomDone() {
    const room = this.rooms[this.roomIdx];
    if (room) room.cleared = true;
    if (room && room.node && !room.gathered) UI.feed(`Burada ${GATHER[room.node].name.toLowerCase()} var, toplayabilirsin.`);
    this.refreshRoomActions();
  }

  async nextRoom() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    this.player.setFlipX(false);
    const room = this.rooms[this.roomIdx];
    if (room && room.type === 'gol') this.player.y = POND.deck + 1;
    await moveTo(this.player, GAME_W + 24, { speed: 170, anim: 'c_run' });
    this.enterRoom(this.roomIdx + 1);
  }

  // ------------------------------------------------------------ savas
  async fight(room) {
    this.busy = true;
    UI.setActions([]);
    if (room.type === 'boss') {
      const z = zoneOf(this.floor);
      UI.banner(GLEMONS[z.boss].name.toLocaleUpperCase('tr'), `${z.name} bekçisi`, 2400, 'boss');
      sfx('roar');
      this.cameras.main.shake(500, 0.012);
      await wait(this, 1300);
    } else if (room.type === 'arapatron') {
      UI.banner('Ara Patron!', this.battle.enemies[0].name, 1800, 'gold');
      sfx('warn');
      await wait(this, 900);
    } else {
      await wait(this, 300);
    }
    await this.enterBattleView();
    const res = await this.battle.start();
    this.battle = null;
    if (this.inBattleView) await this.exitBattleView(res !== 'lose');
    this.busy = false;
    if (res === 'win') {
      if (room.type === 'boss') this.bossDefeated();
      else this.roomDone();
    } else if (res === 'lose') this.onDeath();
    else if (res === 'flee') this.afterFlee(room);
  }

  // Savas ekrani: kamera karakterin sirtindan bakar. Karakter solda, yakin, buyuk ve
  // biraz bulanik (arka 3/4); Glemonlar karsida bize donuk.
  // Savas ayri bir ekranda acilir (Undertale gibi): oda gizlenir, perspektifli savas
  // sahnesi gelir. Kamera karakterin sirtindan bakar: karakter sol altta, yakin, buyuk
  // ve hafif bulanik (arka 3/4); Glemonlar karsidaki uzak meydanda bize donuk.
  async enterBattleView() {
    if (this.inBattleView) return;
    this.inBattleView = true;
    UI.$('#ui').classList.add('fighting');
    S.setFight(true);
    // 0.8.9: patron savaslarinda Eren'in boss muzigi
    const bossFight = !!(this.battle && this.battle.enemies.some((e) => e.data.boss));
    playMusic(bossFight ? 'boss' : 'enemyfight');
    const cam = this.cameras.main;
    cam.flash(120, 255, 255, 255);
    await wait(this, 120);
    await this.fade(true);
    this.roomBg = this.bg.texture.key;
    // 0.8.9: savas odanin kendi manzarasinda, iki cimen tumsegi ustunde gecer
    const key = `stage_${this.roomBg}`;
    this.bgTex(key, () => battleStage(this.textures.get(this.roomBg).getSourceImage()));
    this.bg.setTexture(key);
    this.hiddenObjs = this.roomObjs.filter((o) => o.visible);
    for (const o of this.hiddenObjs) o.setVisible(false);
    for (const l of this.labels) l.style.visibility = 'hidden';
    this.battle.toArena();
    const p = this.player;
    p.setFlipX(false).setDepth(20).setScale(BPOS.scale);
    p.x = BPOS.x;
    p.y = BPOS.y;
    p.alpha = 1;
    p.play('c_b_idlesway');
    UI.setLocation('Savaş!');
    await this.fade(false);
  }

  async exitBattleView(show = true) {
    if (!this.inBattleView) return;
    S.setFight(false);
    stopMusic();
    if (show) await this.fade(true);
    this.inBattleView = false;
    UI.$('#ui').classList.remove('fighting');
    const p = this.player;
    if (this.roomBg) this.bg.setTexture(this.roomBg);
    for (const o of this.hiddenObjs || []) if (o.active) o.setVisible(true);
    this.hiddenObjs = null;
    for (const l of this.labels) l.style.visibility = '';
    if (this.mode === 'dungeon' && this.rooms) UI.setLocation(this.roomLabel());
    p.setDepth(10).setScale(1);
    p.x = this.playerHomeX;
    p.y = GROUND_Y;
    p.setFlipX(false);
    this.idle();
    if (!show) p.alpha = 0;
    if (show) await this.fade(false);
  }

  async afterFlee(room) {
    this.busy = true;
    if (room.type === 'uyuyan') {
      room.type = 'savas';
      room.specs = room.specs.map((s) => ({ ...s, sleeping: false }));
    }
    this.player.setFlipX(false);
    this.player.x = -24;
    if (room.nodeSpr && room.nodeSpr.active) { room.nodeSpr.destroy(); room.nodeSpr = null; }
    this.prepareRoom(room);
    await moveTo(this.player, 50, { speed: 85, anim: 'c_walk' });
    this.idle();
    this.busy = false;
    UI.feed('Kaçtın! Glemonlar hâlâ burada bekliyor.');
    UI.setActions([
      {
        label: 'Tekrar savaş', cls: 'primary',
        onClick: async () => {
          if (this.busy) return;
          UI.setActions([]);
          this.busy = true;
          await moveTo(this.player, PLAYER_HOME, { speed: 85, anim: 'c_walk' });
          this.idle();
          this.fight(room);
        },
      },
      { label: 'Üsse dön', onClick: () => this.returnBase() },
    ]);
  }

  async sneak(room) {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, 186, { speed: 34, anim: 'c_sneakwalk' });
    if (Math.random() < 0.6) {
      await moveTo(this.player, GAME_W + 24, { speed: 40, anim: 'c_sneakwalk' });
      UI.feed('Uyandırmadan geçtin!');
      this.enterRoom(this.roomIdx + 1);
      return;
    }
    sfx('warn');
    for (const z of room.zzz || []) z.remove();
    for (const e of this.battle.enemies) UI.floatText(e.sprite.x, this.battle.topY(e) - 2, '!', 'warn');
    UI.feed('Glemon uyandı! Önce o saldıracak.');
    playAnim(this.player, 'c_surprise', 1.6);
    await wait(this, 500);
    await moveTo(this.player, PLAYER_HOME, { speed: 140, anim: 'c_run' });
    this.player.setFlipX(false);
    this.idle();
    this.battle.wake(true);
    room.type = 'savas';
    room.specs = room.specs.map((s) => ({ ...s, sleeping: false }));
    this.fight(room);
  }

  async ambush(room) {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    for (const z of room.zzz || []) z.remove();
    // uyuyan Glemon'a ninja kosusuyla atilir
    await moveTo(this.player, PLAYER_HOME + 60, { speed: 240, anim: 'c_ninjadash' });
    this.idle();
    UI.feed('Pusu! İlk vuruşun ×1.5 güçlü.');
    this.battle.wake(false);
    this.fight(room);
  }

  // ------------------------------------------------------------ diger odalar
  async openChest(room) {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, room.obj.x - 20, { speed: 85, anim: 'c_walk' });
    this.player.setFlipX(false);
    await playAnim(this.player, 'c_punch', 1.4);
    room.obj.setTexture('chest_open');
    room.opened = true;
    sfx('chest');
    this.idle();
    const f = this.floor;
    const gold = f * 8 + Math.floor(Math.random() * (f * 4 + 4));
    S.addGold(gold);
    UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Sandıktan ${gold} ${CURRENCY} çıktı!`);
    sfx('coin');
    const zc = ZONE_CHEST[this.zone().key];
    if (room.big) await this.zindanReward();
    if (Math.random() < 0.6) this.giveDrop(f > 15 && Math.random() < 0.4 ? 'orta_iksir' : 'iksir_k', 1, 'Sandıktan');
    if (Math.random() < 0.18 * S.dropMult()) this.giveDrop(weighted(zc.gear || CHEST_GEAR), 1, 'Sandıktan');
    if (Math.random() < 0.4) this.giveDrop(pick(zc.mats), 1 + Math.floor(Math.random() * 3), 'Sandıktan');
    if (S.has('hazine_avcisi')) this.giveDrop(pick(zc.mats), 1, 'Hazine Avcısı:');
    const lx = S.addXp({ sans: 10 * f });
    for (const u of lx) await this.levelUp(u);
    if (Math.random() < 0.03 + 0.004 * f) this.giveDrop('altin_elma', 1, 'Sandıktan');
    if (Math.random() < 0.006 + 0.001 * f) this.giveDrop('can_tilsimi', 1, 'Sandıktan');
    S.changed();
    this.busy = false;
    this.roomDone();
  }

  async trap(room) {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, 160, { speed: 75, anim: 'c_walk' });
    this.idle();
    const grade = await UI.timingBar('ZIPLA!', 'Sarı ya da maviye denk getir');
    const p = this.player;
    if (grade !== 'zayif') {
      sfx('jump');
      UI.floatText(p.x, GROUND_Y - 44, grade === 'mukemmel' ? 'Kusursuz atlayış!' : 'Atladın!', 'good');
      // kosup dikenlerin ustunden atlar (skip)
      p.play({ key: 'c_skip', timeScale: 1.4 });
      this.tweens.add({ targets: p, y: GROUND_Y - 26, duration: 340, delay: 120, yoyo: true, ease: 'Sine.easeOut' });
      await moveTo(p, 240, { speed: 100, ease: 'Linear' });
      p.y = GROUND_Y;
      if (grade === 'mukemmel') { const ups = S.addXp({ savunma: 4 * this.floor }); for (const u of ups) await this.levelUp(u); }
    } else {
      await moveTo(p, 198, { speed: 60, anim: 'c_walk' });
      const dmg = Math.max(1, Math.round(S.maxHp() * 0.12));
      S.hp = Math.max(1, S.hp - dmg);
      sfx('hurt');
      UI.floatText(p.x, GROUND_Y - 36, `-${dmg}`, 'hurt');
      UI.feed('Ah! Dikenlere bastın. (Tuzaklar seni bayıltamaz.)');
      this.cameras.main.shake(150, 0.008);
      await playAnim(p, 'c_hurt', 2.2);
      await moveTo(p, 240, { speed: 60, anim: 'c_walk' });
    }
    this.idle();
    room.crossed = true;
    S.changed();
    this.busy = false;
    this.roomDone();
  }

  async rest(room) {
    if (this.busy || room.rested) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, 176, { speed: 80, anim: 'c_walk' });
    this.player.setFlipX(false);
    this.player.play('c_sit');
    await wait(this, 1400);
    const heal = Math.round(S.maxHp() * 0.3);
    S.hp = Math.min(S.maxHp(), S.hp + heal);
    sfx('heal');
    UI.floatText(this.player.x, GROUND_Y - 40, `+${heal}`, 'heal');
    S.changed();
    await wait(this, 600);
    this.idle();
    room.rested = true;
    this.busy = false;
    this.roomDone();
  }

  async descend() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, 290, { speed: 85, anim: 'c_walk' });
    sfx('stairs');
    await new Promise((res) => this.tweens.add({ targets: this.player, x: 312, y: GROUND_Y + 22, alpha: 0, duration: 600, onComplete: res }));
    this.player.alpha = 1;
    this.player.y = GROUND_Y;
    this.enterFloor(this.inZindan() ? this.zLevel + 1 : this.floor + 1);
  }

  async bossDefeated() {
    this.busy = true;
    const z = zoneOf(this.floor);
    const next = ZONES[ZONES.indexOf(z) + 1];
    S.logDrop(null, GLEMONS[z.boss].name, { note: `yenildi! ${z.name} temizlendi` });
    S.changed();
    const nextOpen = next && next.open;
    UI.banner(`${z.name} temizlendi!`, nextOpen ? `${next.name} açıldı!` : 'Bütün Keşif bölgelerini bitirdin! Zindan seni bekliyor.', 3500, 'gold');
    sfx('rare');
    await this.playPool('sevinc', 2600);
    this.idle();
    this.busy = false;
    const acts = [];
    if (nextOpen) {
      const ok = S.atk() >= next.atk;
      if (!ok) UI.feed(`${next.name} için Saldırı gücün en az ${next.atk} olmalı (şu an ${S.atk()}). Silahını güçlendir!`);
      else {
        this.addObj(this.add.image(300, GROUND_Y, 'stairs').setOrigin(0.5, 0).setDepth(2));
        acts.push({ label: `Aşağı in (Kat ${next.floors[0]}: ${next.name})`, cls: 'primary', onClick: () => this.descend() });
      }
    }
    acts.push({ label: 'Üsse dön', cls: acts.length ? '' : 'primary', onClick: () => this.returnBase() });
    UI.setActions(acts);
  }

  // ------------------------------------------------------------ donus ve bayilma
  async returnBase() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    this.fade(true);
    this.player.setFlipX(true);
    await moveTo(this.player, Math.max(-30, this.player.x - 90), { speed: 200, anim: 'c_sprint' });
    this.player.alpha = 0;
    S.endRun();
    this.goBase('dungeon');
    this.player.alpha = 1;
    await this.fade(false);
    UI.feed('Üsse döndün. Topladıkların güvende!');
    this.busy = false;
  }

  onDeath() {
    this.busy = true;
    S.save.stats.deaths++;
    const res = S.loseHalfRun();
    S.changed();
    UI.openPanel('Bayıldın!', (body) => {
      body.appendChild(UI.el('p', 'choice-text', 'Glemonlar seni yendi. Bu turda topladıklarının yarısını kaybettin:'));
      const ul = UI.el('ul', 'droplog');
      for (const l of res.lost) {
        const li = UI.el('li');
        li.innerHTML = `${UI.itemName(l.id)} ×${l.n}`;
        ul.appendChild(li);
      }
      if (res.gold > 0) { const li = UI.el('li'); li.innerHTML = `<img class="ico-inline" src="${this.coinUrl}">${res.gold} ${CURRENCY}`; ul.appendChild(li); }
      if (!res.lost.length && !res.gold) ul.appendChild(UI.el('li', '', 'Kaybedecek bir şey yoktu, şanslısın!'));
      body.appendChild(ul);
      body.appendChild(UI.el('p', 'muted', 'İpucu: Canın azalınca "Üsse dön" ile her şeyini koruyabilirsin.'));
      const row = UI.el('div', 'choice-row');
      row.appendChild(UI.button('Üsse dön', () => UI.closePanel(), 'primary'));
      body.appendChild(row);
    }, { onClose: () => this.afterDeath() });
  }

  async afterDeath() {
    await this.fade(true);
    S.endRun();
    this.goBase('death'); // kamp atesinin basinda uyanir
    await this.fade(false);
    // bayilmak bir basarisizlik: uste aglar (cry)
    await playAnim(this.player, 'c_cry', 1);
    this.idle();
    this.busy = false;
  }

  // ------------------------------------------------------------ takas (Hanci Lale)
  goShop() {
    playMusic('shop');
    openShop(this);
  }

  // Takas basarili: blogu tezgaha birakir, birkac adim geri cekilir (placeblock), sonra durur
  async tradeDone() {
    const p = this.player;
    p.setFlipX(false);
    await playAnim(p, 'c_placeblock', 1.6);
    this.idle();
  }

  // ------------------------------------------------------------ ganimet ve seviye
  giveDrop(id, n, from, found = false) {
    const it = ITEMS[id];
    const left = S.addItem(id, n);
    const got = n - left;
    if (got > 0) {
      const special = it.rarity !== 'siradan' || !['malzeme', 'tuketim'].includes(it.kind);
      const cls = it.rarity === 'nadir' ? 'rare' : it.rarity === 'epik' ? 'epic' : it.rarity === 'efsanevi' ? 'gold' : '';
      const text = found ? `${UI.escapeHtml(from)} ${UI.itemName(id)}${got > 1 ? ` ×${got}` : ''}` : `${UI.escapeHtml(from)} ${UI.itemName(id)}${got > 1 ? ` ×${got}` : ''} düştü!`;
      UI.feed(`<img class="ico-inline" src="${iconUrl(it.icon)}">${text}`, cls);
      if (special) {
        sfx('rare');
        UI.bubble(this.player.x, GROUND_Y - 44, text, 3200);
        S.logDrop(id, from);
        if (!this.battle && !this.busy) this.celebrate();
      } else sfx('drop');
    }
    if (left > 0) UI.feed(`Çanta dolu! ${UI.itemName(id, false)} ×${left} sığmadı.`);
    S.changed();
  }

  async levelUp(up) {
    const sk = SKILLS.find((s) => s.key === up.skill);
    if (up.skill === 'can') S.hp = Math.min(S.maxHp(), S.hp + 10);
    sfx('levelup');
    UI.bubble(this.player.x, GROUND_Y - 44, `<b>${sk.name}</b> ${up.level}. seviye!`, 2600);
    UI.feed(`<span style="color:#ffd04d">★ ${sk.name} seviyen ${up.level} oldu!</span>`, 'gold');
    const gear = Object.values(ITEMS).filter((it) => it.req && it.req[0] === up.skill && it.req[1] === up.level);
    if (gear.length) UI.feed(`Artık kuşanabilirsin: ${gear.map((it) => it.name).join(', ')}`);
    for (const [wt, list] of Object.entries(ABILITIES)) {
      const sk = wt === 'yay' ? 'okculuk' : 'saldiri';
      for (const a of list) if (sk === up.skill && a.lvl === up.level) UI.feed(`Yeni yetenek: ${a.name} (${wt === 'yay' ? 'yay' : wt === 'kilic' ? 'kılıç' : 'yumruk'}: ${a.desc})`, 'gold');
    }
    if (up.skill === 'bag' && up.level % 2 === 0) UI.feed(`Evcil Glemonların artık ${S.petCap()}. seviyeye kadar büyüyebilir.`);
    if (up.skill === 'uretim') {
      const rs = RECIPES.filter((r) => r.lvl === up.level);
      if (rs.length) UI.feed(`Yeni tarifler: ${rs.map((r) => ITEMS[r.out].name).join(', ')}`);
    }
    if (up.skill === 'madencilik') {
      const os = Object.values(ORES).filter((o) => o.req === up.level);
      if (os.length) UI.feed(`Artık kazabilirsin: ${os.map((o) => o.name).join(', ')}`);
    }
    // her 10 seviye bir kilometre tasi: buyuk yazi ve yetenek agaci puani hatirlatmasi
    if (up.level % 10 === 0) UI.banner(`${sk.name} ${up.level}!`, up.level === 99 ? 'En üst seviye!' : 'Kilometre taşı', 2200, 'gold');
    const br = Object.entries(TREE).find(([, t]) => t.skills.includes(up.skill));
    if (br) {
      const free = S.treePoints(br[0]) - S.treeSpent(br[0]);
      const sum = br[1].skills.reduce((t, k) => t + S.level(k), 0);
      if (free > 0 && sum % 10 === 0) UI.feed(`<span style="color:#9ce08a">Yetenek Ağacı: ${br[1].name} dalında ${free} boş puanın var. (Beceriler → Yetenek Ağacı)</span>`);
    }
    if (!this.inBattleView) {
      await playAnim(this.player, 'c_levelup', 1);
      this.idle();
    }
    this.refreshHud();
  }
}
