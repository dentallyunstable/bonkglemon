// Ana sahne: us (ev, depo, harita, maden girisi) ve zindan odalari.
import {
  GAME_W, GROUND_Y, ITEMS, SKILLS, ROOM_WEIGHTS, CHEST_GEAR, CHEST_MATS, GLEMONS, STAGES,
  ZONES, zoneOf, ZONE_SPAWNS, ZONE_GATHER, ZONE_CHEST, wildStageChances, ABILITIES,
  ORES, MINE_COLS, MINE_ROWS, DEFINE_CHANCE, oreWeights, mineXpMult, mineHardBonus,
  GATHER, BAL_CHANCE, GATHER_CHANCE, RECIPES, ANIM_POOLS, CURRENCY,
  BUILD, BUILD_ORDER, plotSize, MAX_TARLA, SEEDS, SEED_CHANCE, CAMP, BONKIT_CHANCE, EGG_BATTLES,
  RANCH, ranchDropOf, SECRETS, stormNow, CLASS_RULES, WEAPON_SKILL, FISH, WATERS, fishXp, DEEP_LIMIT, AY_OTU_CHANCE, TREE, BASE_REWARDS, NIGHT, NIGHT_SPAWNS, HIVE, FIRE, TOK,
  RARITY, KULE, KULE_RULES, BOSS_P2, HARD, HARD_DROPS, LEGENDS,
  CAPE_COLORS,
  STATION_LVL,
} from './data.js';
import { castOnce, chestLoot, cycleBait, baitLabel } from './fishing.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx, playMusic, stopMusic, currentMusic, SYNTH_KEYS } from './audio.js';
import { playAnim, moveTo, wait, animDur } from './anim.js';
import { Battle, BPOS } from './battle.js';
import { block } from './blocks.js';
import { Pix, INK, mix, mul, pack, unpack } from './pix.js';
import { TOD, TOD_SKIP, todNow, forestBackground, caveBackground, battleStage, indoorStage, kuleRoomBackground, kuleStage, caveRoomBackground, desertRoomBackground, dungeonRoomBackground, biomeRoomBackground, BIOME_KEYS, iconUrl, MINE_WALL, POND, pondOverlay, bobber } from './art.js';
import { refreshTut, tutInit, applySettings, openGuide, openSettings } from './help.js';
import { openBag, openDepo, openSkills, openProfile, openMap, openStation, openAnvil, furnaceState, openShop, openCamp, openAhir, openAlbum, openHanci, openZindan, openQuests, openEventGate, openMerchant, openTrophies, openPrep, openNest, openCredits } from './panels.js';
import { ranchReady, collectRanch, ranchLeft, heartsText, petDisplayName, shinyMastery } from './pets.js';
import { ShaftMixin } from './shaft.js';
import { GroveMixin } from './grove.js';
import { refreshGoals, readyCount, goalTick, fullMoon, merchantHere, todayRule, PUL, clockOk, dayNum, weekNum, addPul, titleOf } from './goals.js';

const PLAYER_HOME = 96;
const MINE_X = 330;
const MERCHANT_X = 296; // 0.9 Gezgin Tuccar (hafta sonu)
const WALK_MODES = ['base', 'plot', 'koru'];
// 0.6 us yerlesimi (Eren, 2026-11-07): solda zanaat avlusu, ortada kamp atesi, sonra han, sagda zindan
const ST = { masa: 24, firin: 56, kazan: 88, yem: 120, depo: 152 };
const FIRE_X = 186;
// 1.0.5 ev = arsa: soldan patika, kamp atesi, istasyonlar; insa alani YARD_W'den baslar
const YARD_W = 336;
const YX = { tabela: 22, ates: 68, masa: 120, firin: 158, kazan: 194, yem: 230, ors: 264, depo: 296, heykel: 322, tuccar: 44 };
const INN_X = 198;
const NPC_X = 246;
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
    this.bg = this.add.image(0, 0, 'bg_base').setOrigin(0).setDepth(0).setScrollFactor(0);
    TOD_SKIP.until = S.save.dayUntil || 0;
    this.roomObjs = [];
    this.labels = [];
    this.pShadow = this.add.image(0, GROUND_Y + 1, 'shadow').setDepth(9);
    this.player = this.add.sprite(200, GROUND_Y, 'char', this.charMeta.anims.idle.frames[0]).setDepth(10);
    this.player.play('c_idle');
    this.stillMs = 0;
    this.battle = null;
    this.busy = false;
    this.mode = 'plot';
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
    tutInit();
    applySettings();
    this.buildHud();
    S.onChange(() => this.refreshHud());
    if (S.restoredFrom) this.time.delayedCall(1500, () => UI.feed(`<span style="color:#ffb04d">Kaydın okunamadı, ${new Date(S.restoredFrom).toLocaleString('tr-TR')} tarihli otomatik yedekten geri yüklendi.</span>`, 'gold'));
    // 1.0 ilk adimlar karti (panel acilip kapaninca da guncellensin)
    this.time.addEvent({ delay: 800, loop: true, callback: () => refreshTut(this) });
    this.time.addEvent({ delay: 260, loop: true, callback: () => this.capeSparkle() });
    // 0.9: basarim, pelerin ve unvan bildirimleri (degisiklikler biriktirilip saniyede bir bakilir)
    refreshGoals();
    S.onChange(() => { if (this._gt) return; this._gt = setTimeout(() => { this._gt = null; goalTick((kind, a) => this.goalNote(kind, a)); }, 900); });
    this.time.delayedCall(2500, () => goalTick((kind, a) => this.goalNote(kind, a)));
    this.time.addEvent({ delay: 60000, loop: true, callback: () => { refreshGoals(); this.refreshHud(); if (this.mode === 'koru') this.koruTick(); } });
    window.__BG = this; // testler icin
    window.__goalTick = () => goalTick((kind, a) => this.goalNote(kind, a));
    if (!S.save.flags.st105) { S.save.flags.st105 = 1; if (S.level('uretim') > 1 || (S.save.stats.placed || 0) > 0 || S.save.pets.length > 1) S.save.flags.stOld = 1; }
    this.goBase(false);
    UI.show('#loading', false);
    UI.feed(`Hoş geldin, ${S.save.char}! Evindesin. Haritayı açmak için soldaki Köy yolu tabelasına ya da Harita düğmesine dokun.`);
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
    for (const f of this.followers || []) { f.destroy(); f.shadow.destroy(); }
    this.followers = [];
    S.teamPets().forEach((p, i) => {
      const meta = this.gmeta[p.key].stages[p.stage];
      const k = (a) => `g_${p.key}_${p.stage}_${a}${p.shiny ? '_p' : ''}`;
      const f = this.add.sprite(this.player.x - 24 - i * 22, GROUND_Y, `gs_${p.key}_${p.stage}`, p.shiny ? meta.n : 0)
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(9 - i * 0.1).setScale(p.stage === 2 ? 0.8 : 1);
      f.play(k('durma'));
      f.k = k;
      f.pet = p;
      f.slot = i;
      f.setInteractive({ useHandCursor: true });
      f.on('pointerdown', () => { if (!this.busy && !UI.panelOpen() && WALK_MODES.includes(this.mode)) openAhir(this); });
      f.shadow = this.add.image(f.x, GROUND_Y + 1, 'shadow').setDepth(8).setScale((meta.bodyW * f.scale) / 18, 1);
      this.attachAcc(f, p, meta);
      this.followers.push(f);
    });
  }
  get follower() { return (this.followers && this.followers[0]) || null; }
  placeFollowers(x) { (this.followers || []).forEach((f, i) => { f.x = x - i * 22; }); }

  updateFollower(dt) {
    for (const f of this.followers || []) {
      const rp = S.run && S.run.pets && S.run.pets[f.pet.id];
      const hide = this.mode === 'mine' || this.inBattleView || this.player.alpha < 0.5 || this.player.y > GROUND_Y + 8 || (rp && rp.down);
      f.setVisible(!hide);
      f.shadow.setVisible(!hide);
      if (hide) continue;
      const p = this.player;
      const side = p.flipX ? 1 : -1;
      const tx = p.x + side * (26 + f.slot * 22);
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
      f.shadow.x = f.x;
    }
    this.syncAccs();
  }

  // 0.12 Glemon aksesuari: govdeye kucuk bir bant (tasma, atki, kurdele, can)
  attachAcc(sprite, p, meta) {
    if (!p.acc || !ITEMS[p.acc]) return;
    const id = p.acc;
    const key = `acc_${id}`;
    if (!this.textures.exists(key)) {
      const c = ITEMS[id].col;
      const px = new Pix(8, 4);
      if (id === 'kristal_can') { px.rect(0, 0, 8, 1, '#6a5a3a'); px.rect(2, 1, 4, 2, c); px.rect(3, 3, 2, 1, '#b08a30'); px.set(2, 1, 0); px.set(5, 1, 0); }
      else if (id === 'tuylu_atki') { px.rect(0, 0, 8, 2, c); px.rect(0, 0, 8, 1, '#8ab8f0'); px.rect(5, 2, 2, 2, c); }
      else if (id === 'kivilcim_kurdele') { px.rect(0, 1, 8, 1, c); px.rect(2, 0, 2, 3, '#ffd060'); px.rect(4, 0, 2, 3, c); }
      else { px.rect(0, 0, 8, 2, c); px.rect(3, 2, 2, 2, '#ffd060'); }
      const out = new Pix(10, 6).draw(px, 1, 1);
      out.outline(INK);
      this.textures.addCanvas(key, out.canvas());
    }
    const img = this.add.image(sprite.x, sprite.y, key).setOrigin(0.5, 0.5);
    // gozlerin biraz alti: govdenin ust %45'i
    img.host = sprite; img.fy = meta.ay - meta.bodyH * 0.4; img.fx = meta.bodyW * 0.12;
    this.accs = this.accs || [];
    this.accs.push(img);
  }
  syncAccs() {
    if (!this.accs) return;
    this.accs = this.accs.filter((a) => {
      const h = a.host;
      if (!h.active) { a.destroy(); return false; }
      const sx = h.scaleX; const sy = h.scaleY;
      a.setPosition(h.x + (h.flipX ? a.fx : -a.fx) * sx, h.y - a.fy * sy).setScale(sx, sy).setFlipX(h.flipX)
        .setDepth(h.depth + 0.05).setVisible(h.visible).setAlpha(h.alpha);
      return true;
    });
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
  campReward(awayMs, fire = false) {
    const ms = Math.min(CAMP.maxMs, awayMs);
    if (ms < CAMP.minMs) return null;
    const h = ms / 3600000;
    const items = {};
    // 0.11: ayrilirken kamp atesi harliysa %50 fazla
    for (const [id, per] of Object.entries(CAMP.perHour)) items[id] = Math.max(1, Math.round(per * h * (fire ? FIRE.bonus : 1)));
    return { ms, items, fire };
  }

  // 0.11 kamp atesi: pisir, otur ve dinlen, odun at
  fireMenu() {
    const burning = Date.now() < (S.save.fireUntil || 0);
    const left = burning ? Math.ceil((S.save.fireUntil - Date.now()) / 60000) : 0;
    UI.choice('Kamp ateşi', burning ? `Ateş harlı yanıyor (${left} dk). Oyunu kapatırsan kamp ödülü %50 fazla olur.` : 'Ateş kısık. 3 Dal atarsan 2 saat harlı yanar ve kamp ödülün %50 artar.', [
      { label: 'Yemek pişir', cls: 'primary', onClick: () => openStation(this, 'mutfak') },
      { label: 'Otur, dinlen', cls: 'green', onClick: () => this.restAtFire() },
      { label: `Odun at (${FIRE.dal} Dal, sende ${S.countItem('dal')})`, cls: 'small', onClick: () => this.feedFire() },
      { label: 'Kapat' },
    ]);
  }

  async restAtFire() {
    if (this.busy) return;
    this.busy = true;
    this.player.play('c_sit');
    await wait(this, 1600);
    const heal = S.maxHp() - S.hp;
    S.hp = S.maxHp();
    if (heal > 0) { UI.floatText(this.player.x, GROUND_Y - 44, `+${heal}`, 'heal'); sfx('heal'); }
    UI.feed(heal > 0 ? 'Ateşin başında dinlendin. Canın doldu.' : 'Ateşin başında biraz oturdun. Canın zaten dolu.');
    S.changed();
    this.busy = false;
  }

  feedFire() {
    if (S.countItem('dal') < FIRE.dal) { UI.feed(`Odun atmak için ${FIRE.dal} Dal lazım. Keşifte ve Koru'da dal toplanır.`); this.sulk(); return; }
    S.removeItem('dal', FIRE.dal);
    S.save.fireUntil = Date.now() + FIRE.ms;
    sfx('smelt');
    UI.feed('Ateşe odun attın! 2 saat harlı yanacak. Bu sırada oyunu kapatırsan kamp ödülün %50 fazla olur.');
    if (this.fireSpr) this.tweens.add({ targets: this.fireSpr, scale: 1.3, duration: 400, ease: 'Back.easeOut' });
    this.applyTod();
    S.changed();
  }

  checkCamp() {
    const away = Date.now() - (S.save.lastSeen || Date.now());
    const fire = (S.save.fireUntil || 0) > (S.save.lastSeen || 0);
    S.save.lastSeen = Date.now();
    S.persist();
    const rw = this.campReward(away, fire);
    if (rw) this.time.delayedCall(700, () => openCamp(this, rw));
  }

  update(time, dt) {
    // 0.10.1: ussun disinda alt kisayollar kucuk ve profil kartinin altinda
    const away = !this.home();
    if (away !== this._away) { this._away = away; UI.$('#ui').classList.toggle('away', away); }
    this.pShadow.x = this.player.x;
    // 0.10.5: genis arsada kamera karakteri izler; yazilar da kamerayla kayar
    const cam = this.cameras.main;
    if (this.mode === 'plot') {
      const g = this.plotGeom();
      const tx = Phaser.Math.Clamp(this.player.x - GAME_W / 2, 0, Math.max(0, g.w - GAME_W));
      cam.scrollX += Math.abs(tx - cam.scrollX) < 1 ? tx - cam.scrollX : (tx - cam.scrollX) * Math.min(1, dt / 120);
      cam.scrollX = Math.round(cam.scrollX);
    } else if (cam.scrollX) cam.scrollX = 0;
    if (UI.view.x !== cam.scrollX || UI.view.y !== cam.scrollY) {
      UI.view.x = cam.scrollX; UI.view.y = cam.scrollY;
      for (const l of this.labels) if (l._x !== undefined) l.style.left = UI.pctX(l._x - cam.scrollX);
    }
    // gunun saati: ustte (dis ve arsa) karakter de isiga gore boyanir
    const outdoor = this.mode === 'plot' || this.mode === 'pond' || this.mode === 'koru';
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
    this.updateRanch(dt);
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
    if (this.home() && this.furnace) {
      this.furnaceTick = (this.furnaceTick || 0) + dt;
      if (this.furnaceTick > 500) { this.furnaceTick = 0; this.refreshFurnace(); }
    }
    if (this.canWalk() && !this.busy && !UI.panelOpen()) {
      const left = this.keys.LEFT.isDown || this.keys.A.isDown;
      const right = this.keys.RIGHT.isDown || this.keys.D.isDown;
      if (left !== right) {
        if (this.player._moveTween) this.player._moveTween.stop();
        this.walkTok++;
        this.player.x = Phaser.Math.Clamp(this.player.x + (right ? 1 : -1) * 75 * dt / 1000, 12, this.worldMaxX());
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
    const home = this.mode === 'plot';
    if (home) this.stopBuild();
    this.player.setFlipX(home);
    await moveTo(this.player, home ? Math.max(-18, this.cameras.main.scrollX - 18) : GAME_W + 18, { speed: home ? 150 : 120, anim: home ? 'c_sprint' : 'c_walk' });
    this.cameras.main.setScroll(0, 0);
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
    this.questBadge = UI.el('span', 'dock-badge hidden', '');
    this.questBtn.appendChild(this.questBadge);
    item('dock_album', 'Albüm', () => openAlbum(this));
    item('dock_profil', 'Profil', () => openProfile(this));
    item('dock_rehber', 'Rehber', () => openGuide());
    item('dock_ayar', 'Ayarlar', () => openSettings(this));
    this.refreshHud();
  }

  // 0.9 bildirimler
  goalNote(kind, a) {
    if (kind === 'init') {
      if (a.ach) UI.feed(`<span style="color:#ffd04d">★ Eski ilerlemenle ${a.ach} başarım açıldı! Profil > Başarımlar.</span>`, 'gold');
      return;
    }
    if (kind === 'ach') {
      UI.feed(`<span style="color:#ffd04d">★ Başarım: ${UI.escapeHtml(a.name)}${a.tier ? ` (${a.tier})` : ''}!</span>`, 'gold');
      if (a.big) UI.banner('Başarım!', a.name, 2200, 'gold');
      sfx('levelup');
    } else if (kind === 'title') {
      UI.feed(`<span style="color:#c08cff">Yeni unvan açıldı: “${UI.escapeHtml(a.name)}”. Profil > Unvan'dan seçebilirsin.</span>`, 'epic');
    } else if (kind === 'cape') {
      UI.banner('Pelerin kazandın!', a.name, 3000, 'gold');
      UI.feed(`<span style="color:#ffd04d">★ ${UI.escapeHtml(a.name)} ${a.where === 'depo' ? 'depona' : 'çantana'} kondu. Çantadan giyebilirsin.</span>`, 'gold');
      sfx('rare');
    }
  }

  refreshHud() {
    if (!S.save) return;
    const max = S.maxHp();
    S.hp = Math.min(S.hp, max);
    const tt = titleOf();
    UI.$('#hud-name').innerHTML = `${UI.escapeHtml(S.save.char)}${tt && tt.k !== 'caylak' ? `<span class="hud-title">${UI.escapeHtml(tt.n)}</span>` : ''}`;
    // 0.9: hazir gorev sayisi Gorevler dugmesinde
    if (this.questBadge) { const n = readyCount(); this.questBadge.textContent = n; this.questBadge.classList.toggle('hidden', !n); }
    UI.$('#hud-lvl').textContent = `Toplam Sv. ${S.totalLevel()}`;
    UI.$('#hud-hp').style.width = `${(S.hp / max) * 100}%`;
    UI.$('#hud-hp-text').textContent = `${S.hp} / ${max}`;
    UI.$('#hud-gold').innerHTML = `<img class="ico-inline" src="${this.coinUrl}">${S.save.gold} ${CURRENCY}`;
    // 0.11 Tok: kucuk simge ve kalan dakika
    const left = S.tokLeft();
    if (left) {
      const t = S.save.tok;
      UI.$('#hud-gold').insertAdjacentHTML('beforeend', `<span class="hud-tok" title="${UI.escapeHtml(ITEMS[t.id].name)}: ${UI.escapeHtml(TOK[t.k].fmt(t.v))}"><img class="ico-inline" src="${iconUrl(ITEMS[t.id].icon)}">${Math.ceil(left / 60000)} dk</span>`);
    }
    refreshTut(this);
  }

  say(text, ms = 3000) {
    UI.bubble(this.player.x, GROUND_Y - 42, UI.escapeHtml(text), ms);
  }

  // ------------------------------------------------------------ yurume
  onTap(ptr, over) {
    if (this.mode === 'mine') { this.shTap(ptr); return; }
    if (this.mode === 'plot' && !this.building && over && over.some((o) => o.ranchPet)) return;
    if (this.mode === 'plot' && !this.busy && !UI.panelOpen() && this.plotTap(ptr)) return;
    if (over && over.length) return;
    if (!this.canWalk() || this.busy || UI.panelOpen()) return;
    this.walkThen(Phaser.Math.Clamp(ptr.worldX, 12, this.worldMaxX()), null);
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
      // 1.1 cila: ekranin sol kenarindaki yazilar (Uretim Masasi) kesilmesin
      const lx = Math.max(32, opts.lx ?? obj.x);
      l._x = lx;
      l.style.left = UI.pctX(lx - (UI.view.x || 0));
      l.style.top = UI.pctY(opts.ly);
      UI.$('#floats').appendChild(l);
      this.labels.push(l);
    }
    return obj;
  }

  clearRoom() {
    if (this.battle) { this.battle.destroy(); this.battle = null; }
    for (const o of this.roomObjs) { this.tweens.killTweensOf(o); o.destroy(); }
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
  // 1.0.5 (Eren): ev = arsa. Oyun evin onunde baslar. Soldan patika (koy yolu, tabela
  // haritayi acar), kamp atesi ve calisma istasyonlari; saginda insa alani (ev).
  // Hanci Lale Koy Meydaninda, Etkinlik Kapisi haritada.
  goBase(from) {
    this.zz = null;
    this.cameras.main.setScroll(0, 0);
    this.goPlot();
    if (!S.run) S.hp = S.maxHp(); // ev guvenli yer: her donuste can dolar
    this.player.setFlipX(false);
    this.player.x = from === 'death' ? YX.ates + 20 : from === false ? YX.ates + 26 : -12;
    this.resetPlayer();
    this.idle();
    this.placeFollowers(this.player.x - 26);
    if (from && from !== 'death') { // patikadan eve yurur
      this.busy = true;
      moveTo(this.player, 44, { speed: 95, anim: 'c_walk' }).then(() => { this.idle(); this.busy = false; });
    }
    const keep = from === 'plot' && this.baseTrack && currentMusic() === this.baseTrack;
    if (!keep) this.pickBaseMusic();
    const fs = furnaceState();
    if (fs.ready > 0) UI.feed(`Fırında ${fs.ready} ${ITEMS[fs.out].name} hazır! Fırına dokunup alabilirsin.`);
  }

  // 1.0.5: bos arsaya bir kez kucuk baslangic evi (bedava bloklar: puan vermez, kirinca esya vermez)
  starterHut() {
    const pl = S.save.plot;
    if (S.save.flags.hut) return;
    S.save.flags.hut = 1;
    if (Object.keys(pl.cells).length || Object.keys(pl.back || {}).length) return;
    const F = (id, o = {}) => ({ id, free: 1, ...o });
    const put = (c, r, v) => { pl.cells[`${c},${r}`] = v; };
    for (let r = 0; r < 3; r++) { put(1, r, F('kutuk')); put(7, r, F('kutuk')); }
    for (const c of [2, 4, 5, 6]) put(c, 0, F('tahta_kalas'));
    put(3, 0, F('ahsap_kapi')); put(3, 1, F('ahsap_kapi', { top: true }));
    put(2, 1, F('pencere')); put(4, 1, F('tahta_kalas')); put(5, 1, F('pencere')); put(6, 1, F('tahta_kalas'));
    for (let c = 2; c <= 6; c++) put(c, 2, F('tahta_kalas'));
    put(0, 3, F('kiremit', { shape: 'kiremit_sol' })); put(8, 3, F('kiremit', { shape: 'kiremit_sag' }));
    for (let c = 1; c <= 7; c++) put(c, 3, F('kiremit'));
    put(1, 4, F('kiremit', { shape: 'kiremit_sol' })); put(7, 4, F('kiremit', { shape: 'kiremit_sag' }));
    for (let c = 2; c <= 6; c++) put(c, 4, F('kiremit'));
    put(2, 5, F('kiremit', { shape: 'kiremit_sol' })); put(6, 5, F('kiremit', { shape: 'kiremit_sag' }));
    for (let c = 3; c <= 5; c++) put(c, 5, F('kiremit'));
    pl.back = pl.back || {};
    for (let r = 0; r < 3; r++) for (let c = 2; c <= 6; c++) pl.back[`${c},${r}`] = F('tahta_kalas');
    S.changed();
  }

  stationOpen(k) { return S.level('uretim') >= STATION_LVL[k] || (k !== 'ors' && S.save.flags.stOld); }

  // evin solu: patika, tabela, kamp atesi, istasyonlar, depo, heykel, tuccar
  buildYard() {
    const G = GROUND_Y;
    this.furnace = null;
    if (!this.textures.exists('patika')) {
      const pc = new Pix(16, 16), gr = block('cimen'), dirt = block('toprak');
      const grav = block('cakil');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        let v = gr.get(x, y);
        if (y < 4) { // ustte acik renk toprak patika, arada cakil taslari
          v = dirt.get(x, y + 6);
          const c = unpack(v); v = pack(mix(c.slice(0, 3), [196, 160, 112], y === 0 ? 0.5 : 0.35), 255);
          if ((x * 5 + y * 3) % 11 === 0) v = grav.get(x, y + 2);
          if (y === 3) { const c2 = unpack(v); v = pack(mul(c2.slice(0, 3), 0.8), 255); }
        }
        pc.set(x, y, v);
      }
      this.textures.addCanvas('patika', pc.canvas());
    }
    // patika: soldan eve (kapinin onune) kadar
    for (let x = -16; x < YARD_W + 64; x += 16) this.roomObjs.push(this.add.image(x, G, 'patika').setOrigin(0, 0).setDepth(2.1));
    const station = (k, obj, label, high) => {
      const open = this.stationOpen(k);
      if (!open) obj.setAlpha(0.55);
      const x = obj.x;
      return this.addObj(obj.setOrigin(0.5, 1).setDepth(4), {
        x: x - 18, face: false, label: open ? label : `${label} 🔒`, lx: x, ly: high ? G - 46 : G - 26,
        act: () => {
          if (!this.stationOpen(k)) { UI.feed(`${label}, Üretim ${STATION_LVL[k]} olunca açılır. (Üretim seviyen: ${S.level('uretim')})`); this.sulk(); return; }
          if (k === 'ors') openAnvil(this); else openStation(this, k);
        },
      });
    };
    // tabela: koy yolu (haritayi acar)
    const sign = this.add.image(YX.tabela, G + 1, 'blocks', 'tabela').setOrigin(0.5, 1).setDepth(4);
    this.addObj(sign, { x: YX.tabela + 14, face: true, label: 'Köy yolu', lx: YX.tabela, ly: G - 24, act: () => openHanci(this) });
    // kucuk kamp atesi
    const fire = this.add.sprite(YX.ates, G + 1, 'fire').setOrigin(0.5, 1).setDepth(4).setScale(0.8);
    fire.play('fire');
    fire.noTint = true;
    this.addObj(fire, { x: YX.ates + 18, face: true, label: 'Kamp ateşi', lx: YX.ates, ly: G - 22, act: () => this.fireMenu() });
    this.fireSpr = fire;
    if (Date.now() < (S.save.fireUntil || 0)) fire.setScale(1.05);
    station('masa', this.add.image(YX.masa, G + 1, 'workbench'), 'Üretim Masası', false);
    this.furnace = this.add.sprite(YX.firin, G + 1, 'furnace', 0);
    station('firin', this.furnace, 'Fırın', true);
    const caul = this.add.sprite(YX.kazan, G + 1, 'cauldron', 0);
    if (this.stationOpen('kazan')) caul.play('cauldron');
    station('kazan', caul, 'Simya Kazanı', false);
    station('yem', this.add.image(YX.yem, G + 1, 'feedtable'), 'Yem Tezgâhı', true);
    station('ors', this.add.image(YX.ors, G + 1, 'blocks', 'ors').setScale(1.4), 'Örs', false);
    this.addObj(this.add.image(YX.depo, G + 1, 'chest').setOrigin(0.5, 1).setDepth(4), { x: YX.depo - 18, face: false, label: 'Depo', lx: YX.depo, ly: G - 24, act: () => openDepo(this) });
    this.buildStatue(YX.heykel);
    if (merchantHere()) {
      const tc = this.add.sprite(YX.tuccar, G + 1, 'tuccar', 0).setOrigin(0.5, 1).setDepth(6);
      tc.play('tuccar_durma');
      this.merchant = tc;
      this.addObj(tc, { x: YX.tuccar + 24, face: true, label: 'Gezgin Tüccar', ly: G - 58, act: () => { tc.play('tuccar_selam'); tc.once('animationcomplete', () => { if (tc.active) tc.play('tuccar_durma'); }); openMerchant(this); } });
    } else this.merchant = null;
    this.refreshFurnace();
  }

  // 1.0 99 pelerinleri parlar: sirttan kucuk isiltilar dokulur (Usta Pelerini altin ve daha sik)
  capeSparkle() {
    const id = S.save && S.save.equip.pelerin;
    const it = id && ITEMS[id];
    if (!it || !it.cape || this.battle || this.inBattleView || S.save.settings.calm) return;
    const p = this.player;
    if (!p || !p.visible || p.alpha < 0.5) return;
    const usta = it.cape === 'usta';
    if (!usta && Math.random() < 0.45) return;
    const col = usta ? 0xffe070 : Phaser.Display.Color.HexStringToColor(CAPE_COLORS[it.cape] ? CAPE_COLORS[it.cape][3] : '#ffffff').color;
    const back = p.flipX ? 1 : -1;
    const x = p.x + back * (3 + Math.random() * 6);
    const y = p.y - 8 - Math.random() * 16;
    const s = this.add.rectangle(x, y, 1, 1, col).setDepth(11).setAlpha(0.95);
    this.tweens.add({ targets: s, y: y + 8 + Math.random() * 6, x: x + back * Math.random() * 4, alpha: 0, duration: 700 + Math.random() * 400, onComplete: () => s.destroy() });
  }

  // 1.0 ilk 99'da depo ile ates arasinda karakterin altin heykeli; her 99 kaidede bir yildiz
  buildStatue(X = 372) {
    const n = S.count99();
    if (!n) return;
    const G = GROUND_Y;
    const g = this.add.graphics().setDepth(3);
    g.fillStyle(0x6a5a4a, 1).fillRect(X - 8, G - 6, 16, 7);
    g.fillStyle(0x8a7a64, 1).fillRect(X - 8, G - 6, 16, 2);
    g.fillStyle(0x4a3e34, 1).fillRect(X - 9, G - 1, 18, 2);
    for (let i = 0; i < Math.min(n, 5); i++) g.fillStyle(0xffd04d, 1).fillRect(X - 6 + i * 3, G - 3, 2, 2);
    this.addObj(g);
    // karakterin kendi karesinden altin renkli heykel dokusu (parlakliga gore 5 tonlu altin)
    const key = `statue_${S.save.char}`;
    if (!this.textures.exists(key)) {
      const fr = this.textures.getFrame('char', this.charMeta.anims.idle.frames[0]);
      const cv = document.createElement('canvas');
      cv.width = fr.cutWidth; cv.height = fr.cutHeight;
      const cx = cv.getContext('2d', { willReadFrequently: true });
      cx.drawImage(fr.source.image, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, fr.cutWidth, fr.cutHeight);
      const img = cx.getImageData(0, 0, cv.width, cv.height);
      const d = img.data;
      const ramp = [[74, 46, 14], [138, 92, 26], [200, 146, 42], [240, 196, 80], [255, 236, 160]];
      for (let k = 0; k < d.length; k += 4) {
        if (!d[k + 3]) continue;
        const l = (0.3 * d[k] + 0.59 * d[k + 1] + 0.11 * d[k + 2]) / 255;
        const c = ramp[Math.min(4, Math.floor(Math.pow(l, 0.8) * 5.2))];
        d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
      }
      cx.putImageData(img, 0, 0);
      this.textures.addCanvas(key, cv);
    }
    const glow = this.add.image(X, G - 12, 'glow').setScale(0.6).setAlpha(0.35).setDepth(2);
    glow.noTint = true;
    this.addObj(glow);
    // karakter kareleri ortalanmis (oyuncu gibi): ayaklar karenin ortasinda
    const st = this.add.image(X, G - 6, key).setOrigin(0.5, 0.5).setScale(0.6).setDepth(3);
    st.noTint = true;
    this.addObj(st, { x: X - 16, face: false, label: n > 1 ? `Heykel ✦${n}` : 'Heykel', lx: X - 14, ly: G - 34, act: () => {
      const list = SKILLS.filter((s) => !s.soon && S.level(s.key) >= 99).map((s) => `${s.name} ${S.vlevel(s.key) > 99 ? `(sanal ${S.vlevel(s.key)})` : ''}`);
      UI.feed(`<span style="color:#ffd04d">✦ Altın heykelin. 99 olan becerilerin: ${list.join(', ')}</span>`, 'gold');
    } });
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
    if (this.mode !== 'plot' && this.mode !== 'pond' && this.mode !== 'koru') return;
    this.tod = todNow();
    this.bg.setTexture(this.todBg(this.mode === 'plot' || this.mode === 'koru' ? 'bg_plot' : this.mode === 'pond' ? 'bg_pond' : 'bg_base'));
    // 0.9 Dolunay Gecesi: aksam ve gece gokte kocaman ay
    if (fullMoon() && (this.tod === 'gece' || this.tod === 'gunbatimi')) {
      const m = this.add.image(GAME_W * 0.62, 30, 'bigmoon').setDepth(0.5);
      this.glows.push(m);
      this.roomObjs.push(m);
    }
    const T = TOD[this.tod];
    for (const o of this.roomObjs) {
      if (!o.active || !o.setTint || o.noTint) continue;
      if (T.tint === 0xffffff) o.clearTint(); else o.setTint(T.tint);
    }
    if (this.tod === 'gun') return;
    const G = GROUND_Y;
    const spots = [];
    if (this.mode === 'base') spots.push([FIRE_X, G - 8, Date.now() < (S.save.fireUntil || 0) ? 2.3 : 1.6], [MINE_X, G - 26, 0.9], [32, G - 40, 0.6], [128, G - 40, 0.6], [INN_X + 68, G - 40, 0.7]);
    else if (this.mode === 'pond') spots.push([POND.standX - 40, G - 30, 0.8]);
    else if (this.mode === 'plot') {
      const g = this.plotGeom();
      for (const [key, c] of Object.entries(S.save.plot.cells)) {
        if (!BUILD[c.id] || !BUILD[c.id].glow || c.top || c.part) continue;
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
      if (this.shopBusy || UI.panelOpen() || !this.home()) return;
      if (this.baseTrack) playMusic(this.baseTrack, false);
    });
  }

  // ------------------------------------------------------------ arsa ve insa (0.3)
  // Arsa: usteki ayri ekran. Blok izgarasi zeminden yukari (sira 0 = zemin ustu).
  // 0.10.5: arsa 64 blok genis ve kayar (kamera karakteri izler). Sutun numaralari eskisiyle
  // ayni, eski arsalar sol bastan aynen durur.
  plotGeom() {
    const { cols, rows: r0 } = plotSize(S.level('insa'));
    const rows = r0 + (S.has('mimar') ? 1 : 0);
    const x0 = YARD_W; // 1.0.5: solda patika + calisma alani, sonra insa alani
    return { cols, rows, x0, w: x0 + cols * 16 + 32 };
  }

  home() { return this.mode === 'base' || this.mode === 'plot'; }

  worldMaxX() { return this.mode === 'plot' ? this.plotGeom().w - 12 : GAME_W - 12; }

  cellAt(wx, wy) {
    const g = this.plotGeom();
    const c = Math.floor((wx - g.x0) / 16);
    const r = Math.floor((GROUND_Y - wy) / 16);
    if (c < 0 || r < 0 || c >= g.cols || r >= g.rows) return null;
    return { c, r, key: `${c},${r}` };
  }

  // 1.0.5: arsa artik evin kendisi; haritadan "Arsa" eve dondurur
  async enterPlot() {
    UI.closePanel();
    if (this.busy || this.mode !== 'plot') return;
    const g = this.plotGeom();
    this.walkThen(g.x0 + 40, null);
  }

  goPlot() {
    this.mode = 'plot';
    this.clearRoom();
    this.tod = todNow();
    this.bg.setTexture(this.todBg('bg_plot'));
    const g = this.plotGeom();
    const G = GROUND_Y;
    // arsa boyunca zemin (arka plan sabit kalir, cimen zemin arsayla kayar)
    for (let x = -16; x < g.w + 16; x += 16) this.roomObjs.push(this.add.image(x, G, 'blocks', 'cimen').setOrigin(0, 0).setDepth(2));
    for (const x of [g.x0 - 8, g.x0 + g.cols * 16 + 8]) this.roomObjs.push(this.add.image(x, G, 'blocks', 'direk').setOrigin(0.5, 1).setDepth(3));
    this.plotImg = null;
    this.plotBackImg = null;
    this.gardenSprites = {};
    this.buildLayer = this.buildLayer || 'on';
    this.starterHut();
    this.buildYard();
    this.drawPlot();
    this.refreshGarden();
    this.spawnRanch();
    this.applyTod();
    this.player.setFlipX(false);
    this.resetPlayer();
    this.idle();
    this.plotActions();
    this.refreshHud();
  }

  // ------------------------------------------------------------ 0.12 Yasayan Ahir
  // Yaninda olmayan evcil Glemonlar arsada dolasir; malzemesi hazir olanin ustunde "!" var.
  spawnRanch() {
    this.ranch = [];
    const team = new Set(S.teamPets().map((p) => p.id));
    const g = this.plotGeom();
    const list = S.save.pets.filter((p) => !team.has(p.id)).sort((a, b) => (ranchReady(b) ? 1 : 0) - (ranchReady(a) ? 1 : 0)).slice(0, RANCH.wander);
    for (const p of list) {
      const meta = this.gmeta[p.key].stages[p.stage];
      const k = (a) => `g_${p.key}_${p.stage}_${a}${p.shiny ? '_p' : ''}`;
      const x = g.x0 + 8 + Math.random() * (g.cols * 16 - 16);
      const sp = this.add.sprite(x, GROUND_Y, `gs_${p.key}_${p.stage}`, p.shiny ? meta.n : 0)
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(7).setScale(p.stage === 2 ? 0.8 : 1).setFlipX(Math.random() < 0.5);
      sp.play(k('durma'));
      const sh = this.add.image(x, GROUND_Y + 1, 'shadow').setDepth(6.9).setScale((meta.bodyW * sp.scale) / 18, 1);
      const mark = this.add.text(x, GROUND_Y - meta.ay * sp.scale - 4, '!', { fontFamily: 'BonkSym, "Jersey 15"', fontStyle: 'normal', fontSize: '11px', color: '#ffd04d', stroke: '#16121a', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(7.5);
      const r = { p, sp, sh, mark, k, meta, tx: x, wait: 1000 + Math.random() * 4000 };
      sp.ranchPet = true;
      sp.setInteractive({ useHandCursor: true });
      sp.on('pointerdown', () => this.ranchTap(r));
      this.attachAcc(sp, p, meta);
      this.roomObjs.push(sp, sh, mark);
      this.ranch.push(r);
    }
  }

  updateRanch(dt) {
    if (this.mode !== 'plot' || !this.ranch) return;
    const g = this.plotGeom();
    const now = Date.now();
    for (const r of this.ranch) {
      if (!r.sp.active) continue;
      const dx = r.tx - r.sp.x;
      if (Math.abs(dx) > 1) {
        r.sp.x += Math.sign(dx) * Math.min(Math.abs(dx), 22 * dt / 1000);
        r.sp.setFlipX(dx > 0);
        if (r.sp.anims.currentAnim.key !== r.k('yurume')) r.sp.play(r.k('yurume'));
      } else {
        if (r.sp.anims.currentAnim.key !== r.k('durma')) r.sp.play(r.k('durma'));
        r.wait -= dt;
        if (r.wait <= 0) {
          r.wait = 2000 + Math.random() * 5000;
          r.tx = Phaser.Math.Clamp(r.sp.x + (Math.random() - 0.5) * 140, g.x0 + 8, g.x0 + g.cols * 16 - 8);
        }
      }
      r.sh.x = r.sp.x;
      r.mark.x = r.sp.x;
      r.mark.setVisible(ranchReady(r.p, now));
    }
  }

  ranchTap(r) {
    if (this.busy || this.building || UI.panelOpen()) return;
    const top = GROUND_Y - r.meta.ay * r.sp.scale;
    const got = collectRanch(r.p);
    if (got) {
      this.giveDrop(got.id, got.n, `${petDisplayName(r.p)} bıraktı:`, true);
      r.mark.setVisible(false);
      S.changed();
    } else {
      const m = Math.ceil(ranchLeft(r.p) / 60000);
      UI.floatText(r.sp.x, top - 14, `${petDisplayName(r.p)} · ${heartsText(r.p)}`, 'info');
      UI.feed(`${petDisplayName(r.p)} mutlu görünüyor. Bir sonraki ${ITEMS[ranchDropOf(r.p.key)].name}: ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`}.`);
    }
    for (let i = 0; i < 3; i++) {
      const h = this.add.text(r.sp.x + (Math.random() - 0.5) * 14, top, '♥', { fontFamily: 'BonkSym, "Jersey 15"', fontSize: '9px', color: '#ff7a9a' }).setDepth(8);
      this.tweens.add({ targets: h, y: h.y - 16, alpha: 0, duration: 800, delay: i * 120, onComplete: () => h.destroy() });
    }
    r.sp.play(r.k('saldiri'));
    r.wait = 1500;
  }

  plotActions() {
    const g = this.plotGeom();
    UI.setLocation(`Evin · Üs Puanı ${S.baseScore()}`);
    UI.setActions([
      { label: 'İnşa et', cls: 'primary', onClick: () => this.startBuild() },
      { label: 'Harita', cls: 'blue', onClick: () => openHanci(this) },
    ]);
  }

  plotFrame(cell) {
    const def = BUILD[cell.id];
    if (!def) return null;
    if (cell.top) return cell.open ? 'kapi_acik_ust' : def.top;
    if (cell.part) return def.wide;
    if (cell.open) return 'kapi_acik_alt';
    return cell.shape || def.tex;
  }

  // Arsadaki bloklar iki resimde cizilir: arka duvar (koyu, cizgisiz) ve on (dis cizgili).
  drawPlot() {
    const g = this.plotGeom();
    const W = g.cols * 16 + 2; const H = g.rows * 16 + 2;
    const back = new Pix(W, H);
    for (const [key, cell] of Object.entries(S.save.plot.back || {})) {
      const def = BUILD[cell.id];
      if (!def) continue;
      const [c, r] = key.split(',').map(Number);
      if (c >= g.cols || r >= g.rows) continue;
      back.draw(block(def.tex), 1 + c * 16, 1 + (g.rows - 1 - r) * 16, 16);
    }
    back.each((v) => { const k = v >>> 24; if (!k) return v; const c = [v & 255, (v >>> 8) & 255, (v >>> 16) & 255].map((x) => Math.round(x * 0.58)); return ((k << 24) | (c[2] << 16) | (c[1] << 8) | c[0]) >>> 0; });
    const pix = new Pix(W, H);
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      const frame = this.plotFrame(cell);
      if (!frame) continue;
      const [c, r] = key.split(',').map(Number);
      if (c >= g.cols || r >= g.rows) continue;
      pix.draw(block(frame), 1 + c * 16, 1 + (g.rows - 1 - r) * 16, 16);
    }
    pix.outline(INK);
    for (const [img, tex, depth, sk] of [[this.plotBackImg, 'plot_back_tex', 4, 'plotBackImg'], [this.plotImg, 'plot_tex', 5, 'plotImg']]) {
      if (img) img.destroy();
      if (this.textures.exists(tex)) this.textures.remove(tex);
      this.textures.addCanvas(tex, (tex === 'plot_tex' ? pix : back).canvas());
      this[sk] = this.add.image(g.x0 - 1, GROUND_Y - g.rows * 16 - 1, tex).setOrigin(0).setDepth(depth);
      this.roomObjs.push(this[sk]);
    }
    // tabela yazilari
    for (const l of this.signLabels || []) { l.remove(); this.labels = this.labels.filter((x) => x !== l); }
    this.signLabels = [];
    for (const [key, cell] of Object.entries(S.save.plot.cells)) {
      if (cell.id !== 'tabela_blok' || !cell.text) continue;
      const [c, r] = key.split(',').map(Number);
      const l = UI.el('div', 'objlabel sign', '');
      l.textContent = cell.text;
      l._x = g.x0 + c * 16 + 8;
      l.style.left = UI.pctX(l._x - this.cameras.main.scrollX);
      l.style.top = UI.pctY(GROUND_Y - (r + 1) * 16 - 2);
      UI.$('#floats').appendChild(l);
      this.labels.push(l);
      this.signLabels.push(l);
    }
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
      const frame = !info ? null : info.ready ? (info.sd.frame || (info.seed === 'ot_tohumu' ? 'bitki' : info.seed === 'ay_tohumu' ? 'ay_otu' : 'cali')) : info.p < 0.4 ? 'filiz' : 'fide';
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

  // bir hucrenin asil (sol alt) hucresi: kapinin ustu ve yatagin sag yarisi asil hucreye gider
  plotOrigin(cell) {
    const cells = S.save.plot.cells;
    const c = cells[cell.key];
    if (!c) return null;
    if (c.top) return { c: cell.c, r: cell.r - 1, key: `${cell.c},${cell.r - 1}` };
    if (c.part) return { c: cell.c - 1, r: cell.r, key: `${cell.c - 1},${cell.r}` };
    return cell;
  }

  // arsaya dokununca: insa modunda blok koy/kaldir; degilse mobilya ve tarla
  plotTap(ptr) {
    const cell = this.cellAt(ptr.worldX, ptr.worldY);
    if (this.building) {
      if (!cell) return true; // insa modunda arsa disina dokunmak bir sey yapmaz
      if (this.buildTool === 'kaldir') this.removeAt(cell); else this.placeAt(cell);
      return true;
    }
    if (!cell) return false;
    const o = this.plotOrigin(cell);
    const oc = o && S.save.plot.cells[o.key];
    if (oc && BUILD[oc.id] && BUILD[oc.id].func) { this.useFurniture(o, oc); return true; }
    // tarlanin kendisi ya da ustundeki bitki
    const base = oc && oc.id === 'tarla' ? o
      : cell.r === 1 && S.save.plot.cells[`${cell.c},0`] && S.save.plot.cells[`${cell.c},0`].id === 'tarla' ? { c: cell.c, r: 0, key: `${cell.c},0` } : null;
    if (!base) return false;
    this.gardenTap(base);
    return true;
  }

  standNear(c) {
    const g = this.plotGeom();
    const cx = g.x0 + c * 16 + 8;
    const side = this.player.x <= cx ? -1 : 1;
    return { cx, x: Phaser.Math.Clamp(cx + side * 18, 12, g.w - 12) };
  }

  async walkToCell(c) {
    const { cx, x } = this.standNear(c);
    if (Math.abs(this.player.x - cx) > 30) await moveTo(this.player, x, Math.abs(this.player.x - x) > SPRINT_DIST ? { speed: 190, anim: 'c_sprint' } : { speed: 110, anim: 'c_walk' });
    this.player.setFlipX(cx < this.player.x);
  }

  // ---- islevli mobilyalar (0.10.5)
  async useFurniture(o, cell) {
    if (this.busy) return;
    const f = BUILD[cell.id].func;
    if (f === 'kapi') {
      cell.open = !cell.open;
      const top = S.save.plot.cells[`${o.c},${o.r + 1}`];
      if (top) top.open = cell.open;
      sfx(cell.open ? 'chest' : 'click');
      this.drawPlot();
      S.changed();
      return;
    }
    this.busy = true;
    await this.walkToCell(o.c);
    this.idle();
    this.busy = false;
    if (f === 'masa' || f === 'firin' || f === 'kazan') { openStation(this, f); return; }
    if (f === 'sandik') { openDepo(this); return; }
    if (f === 'kupa') { openTrophies(this); return; }
    if (f === 'tabela') { this.editSign(o, cell); return; }
    if (f === 'yatak') await this.sleepInBed();
    if (f === 'kovan') await this.useHive(o, cell);
    if (f === 'kulucka') openNest(this);
  }

  editSign(o, cell) {
    UI.openPanel('Tabela', (body) => {
      body.appendChild(UI.el('p', 'muted', 'Tabelaya ne yazalım? (en fazla 24 harf)'));
      const inp = document.createElement('input');
      inp.className = 'sign-input';
      inp.maxLength = 24;
      inp.value = cell.text || '';
      body.appendChild(inp);
      const row = UI.el('div', 'choice-row');
      row.appendChild(UI.button('Yaz', () => {
        cell.text = inp.value.replace(/[<>]/g, '').trim().slice(0, 24);
        S.changed();
        UI.closePanel();
        sfx('craft');
        this.drawPlot();
      }, 'primary'));
      row.appendChild(UI.button('Sil', () => { cell.text = ''; S.changed(); UI.closePanel(); this.drawPlot(); }, 'small'));
      body.appendChild(row);
      setTimeout(() => inp.focus(), 50);
    });
  }

  async sleepInBed() {
    this.busy = true;
    const night = this.tod === 'gece' || this.tod === 'gunbatimi';
    this.player.play('c_sit');
    await wait(this, 500);
    await this.fade(true);
    S.hp = S.maxHp();
    if (night) {
      // gercek saatle sabaha kadar gunduz say (gece atlatilir)
      const d = new Date();
      if (d.getHours() >= 8) d.setDate(d.getDate() + 1);
      d.setHours(8, 0, 0, 0);
      S.save.dayUntil = d.getTime();
      TOD_SKIP.until = S.save.dayUntil;
    }
    S.changed();
    await wait(this, 500);
    this.tod = todNow();
    this.applyTod();
    this.refreshHud();
    await this.fade(false);
    UI.feed(night ? 'Güzel bir uyku! Gece bitti, sabah oldu. Canın doldu.' : 'Biraz kestirdin. Canın doldu. (Akşam ya da gece uyursan sabah olur.)');
    await playAnim(this.player, 'c_cheer', 1);
    this.idle();
    this.busy = false;
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

  canBack(id) { const d = BUILD[id]; return !!d && !d.prop && !d.tall && !d.wide && !d.func && !d.ground; }

  // alt cubuk: elindeki bloklar (simge + adet), On/Arka, Kaldir, Bitti
  buildBar() {
    const bar = UI.$('#actions');
    bar.innerHTML = '';
    const lvl = S.level('insa');
    const back = this.buildLayer === 'arka';
    const owned = BUILD_ORDER.filter((id) => S.countItem(id) > 0);
    if (!owned.length) UI.feed('Elinde inşa bloğu yok. Zanaat avlusundaki Üretim Masası\'nda Tahta Kalas, Kütük, Çit gibi bloklar yapabilirsin.');
    const scroller = UI.el('div', 'build-scroll');
    for (const id of owned) {
      const def = BUILD[id];
      const b = UI.el('button', 'btn small build-btn' + (this.buildTool === 'koy' && this.buildSel === id ? ' sel' : ''));
      b.appendChild(UI.icon(ITEMS[id].icon));
      b.appendChild(UI.el('span', '', `${S.countItem(id)}`));
      b.title = ITEMS[id].name + (lvl < def.lvl ? ` (İnşa ${def.lvl} gerekli)` : '');
      if (lvl < def.lvl || (back && !this.canBack(id))) b.classList.add('locked');
      b.onclick = (ev) => {
        ev.stopPropagation(); sfx('click');
        if (lvl < def.lvl) { UI.feed(`${ITEMS[id].name} koymak için İnşa ${def.lvl} gerekli.`); return; }
        if (back && !this.canBack(id)) { UI.feed(`${ITEMS[id].name} arka duvara konmaz. Arka duvar için tam blok seç (taş, kalas, tuğla...).`); return; }
        this.buildSel = id; this.buildTool = 'koy'; this.buildBar();
      };
      scroller.appendChild(b);
    }
    bar.appendChild(scroller);
    if (this.buildSel === 'kiremit' && this.buildTool === 'koy' && !back) {
      const names = { kiremit: 'Düz', kiremit_sol: 'Sol eğim', kiremit_sag: 'Sağ eğim' };
      const shape = this.roofShape || 'kiremit';
      bar.appendChild(UI.button(`Şekil: ${names[shape]}`, () => {
        const order = BUILD.kiremit.shapes;
        this.roofShape = order[(order.indexOf(shape) + 1) % order.length];
        this.buildBar();
      }, 'small'));
    }
    bar.appendChild(UI.button(back ? 'Katman: Arka' : 'Katman: Ön', () => { this.buildLayer = back ? 'on' : 'arka'; this.buildBar(); }, 'small ' + (back ? 'purple' : 'blue')));
    bar.appendChild(UI.button('Kaldır', () => { this.buildTool = this.buildTool === 'kaldir' ? 'koy' : 'kaldir'; this.buildBar(); }, 'small' + (this.buildTool === 'kaldir' ? ' sel red' : '')));
    bar.appendChild(UI.button('Bitti', () => this.stopBuild(), 'small primary'));
    const where = back ? 'arka duvar' : 'ön';
    const sel = this.buildTool === 'kaldir' ? `Kaldır (${where}): bloğa dokun` : this.buildSel ? `${ITEMS[this.buildSel].name} (${where}): boş kareye dokun` : 'Blok seç';
    UI.setLocation(`İnşa · ${sel}`);
  }

  canPlace(id, cell, back = false) {
    const def = BUILD[id];
    const g = this.plotGeom();
    if (back) {
      if (!this.canBack(id)) return 'Bu arka duvara konmaz.';
      if (S.save.plot.back[cell.key]) return 'Arka duvarda orası dolu.';
      return null;
    }
    const cells = S.save.plot.cells;
    if (cells[cell.key]) return 'Orası dolu.';
    if (def.ground && cell.r !== 0) return 'Tarla sadece zemine konur.';
    if (def.tall && (cell.r + 1 >= g.rows || cells[`${cell.c},${cell.r + 1}`])) return 'Kapının üstünde bir boş kare daha lazım.';
    if (def.wide && (cell.c + 1 >= g.cols || cells[`${cell.c + 1},${cell.r}`])) return 'Yatağın sağında bir boş kare daha lazım.';
    if (cell.r === 1 && cells[`${cell.c},0`] && cells[`${cell.c},0`].id === 'tarla') return 'Tarlanın üstü bitki için boş kalmalı.';
    if (id === 'depo_sandigi' && Object.values(cells).filter((x) => x.id === 'depo_sandigi').length >= 4) return 'En fazla 4 Depo Sandığı koyabilirsin.';
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
    const back = this.buildLayer === 'arka';
    if (S.level('insa') < def.lvl) { UI.feed(`İnşa ${def.lvl} gerekli.`); this.sulk(); return; }
    const why = this.canPlace(id, cell, back);
    if (why) { UI.feed(why); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    // blogu koyar, bir adim geri cekilir (placeblock)
    sfx('craft');
    const anim = playAnim(this.player, 'c_placeblock', 2.2);
    await wait(this, 260);
    S.removeItem(id, 1);
    S.save.stats.placed = (S.save.stats.placed || 0) + 1;
    if (back) S.save.plot.back[cell.key] = { id };
    else {
      const cells = S.save.plot.cells;
      cells[cell.key] = id === 'kiremit' && this.roofShape && this.roofShape !== 'kiremit' ? { id, shape: this.roofShape } : { id };
      if (def.tall) cells[`${cell.c},${cell.r + 1}`] = { id, top: true };
      if (def.wide) cells[`${cell.c + 1},${cell.r}`] = { id, part: true };
      if (def.func === 'kovan') cells[cell.key].t = Date.now();
      if (id === 'depo_sandigi') { while (S.save.depo.length < S.depoSize()) S.save.depo.push(null); UI.feed(`Depo büyüdü: artık ${S.save.depo.length} yer.`); }
    }
    this.drawPlot();
    if (id === 'tarla') this.refreshGarden();
    if (def.glow) this.applyTod();
    // Insa XP: arsadaki blok sayisi yeni bir rekora cikinca; ilk kez konan blok turune bonus
    let xp = 0;
    const placed = S.placedCount();
    if (placed > (S.save.plot.best || 0)) { S.save.plot.best = placed; xp += def.xp; }
    if (!S.save.plot.kinds[id]) { S.save.plot.kinds[id] = 1; xp += def.xp * 4; UI.feed(`Yeni blok türü: ${ITEMS[id].name}! Bonus İnşa XP.`); }
    let ups = [];
    if (xp) {
      UI.floatText(this.player.x, GROUND_Y - 44, `+${xp} İnşa XP`, 'good');
      const before = this.plotGeom();
      ups = S.addXp({ insa: xp });
      const after = this.plotGeom();
      if (after.rows !== before.rows) this.time.delayedCall(1200, () => { if (this.mode === 'plot') { UI.banner('Arsan büyüdü!', `${after.cols}×${after.rows} blok`, 2000); const b = this.building; this.goPlot(); if (b) this.startBuild(); } });
    }
    S.changed();
    await anim;
    this.idle();
    for (const u of ups) await this.levelUp(u);
    await this.checkBaseRewards();
    this.busy = false;
    if (this.building) { if (!S.countItem(id)) this.buildSel = null; this.buildBar(); }
  }

  async removeAt(cell) {
    if (this.busy) return;
    const back = this.buildLayer === 'arka';
    if (back) {
      const bc = S.save.plot.back[cell.key];
      if (!bc) return;
      if (!bc.free && !S.fits(bc.id)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
      this.busy = true;
      await this.walkToCell(cell.c);
      await playAnim(this.player, 'c_punch', 1.6);
      sfx('break');
      delete S.save.plot.back[cell.key];
      if (!bc.free) S.addItem(bc.id, 1);
      this.drawPlot();
      S.changed();
      this.idle();
      this.busy = false;
      if (this.building) this.buildBar();
      return;
    }
    const cells = S.save.plot.cells;
    const o = this.plotOrigin(cell);
    if (!o) return;
    const key = o.key;
    const c = cells[key];
    if (!c) return;
    if (c.id === 'tarla' && S.save.plot.garden[key]) { UI.feed('Tarlada bitki var. Önce hasat et.'); this.sulk(); return; }
    if (c.id === 'depo_sandigi') {
      // sandik kalkinca depo kuculur: fazla yerdeki esyalar ice sigmali
      const newSize = S.depoSize() - 10;
      const items = S.save.depo.filter(Boolean);
      if (items.length > newSize) { UI.feed('Depon dolu: sandığı kaldırmadan önce Depo\'dan biraz eşya al.'); this.sulk(); return; }
    }
    if (!c.free && !S.fits(c.id)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(o.c);
    await playAnim(this.player, 'c_punch', 1.6);
    sfx('break');
    delete cells[key];
    const def = BUILD[c.id];
    if (def && def.tall) delete cells[`${o.c},${o.r + 1}`];
    if (def && def.wide) delete cells[`${o.c + 1},${o.r}`];
    if (c.id === 'depo_sandigi') {
      const items = S.save.depo.filter(Boolean);
      S.save.depo = items.concat(new Array(S.depoSize() - items.length).fill(null));
    }
    this.drawPlot();
    if (def && def.glow) this.applyTod();
    if (!c.free) S.addItem(c.id, 1);
    S.changed();
    this.idle();
    this.busy = false;
    if (this.building) this.buildBar();
  }

  // Us Puani odulleri: 100/250/500/1000 (en yuksek puana gore, bir kez)
  async checkBaseRewards() {
    const score = S.baseScore();
    S.save.plot.bestScore = Math.max(S.save.plot.bestScore || 0, score);
    for (const rw of BASE_REWARDS) {
      if (S.save.plot.bestScore < rw.pts || S.save.plot.rw[rw.pts]) continue;
      S.save.plot.rw[rw.pts] = 1;
      addPul(rw.pul);
      sfx('rare');
      UI.banner(`Üs Puanı ${rw.pts}!`, 'Yeni tarifler açıldı', 2200, 'gold');
      UI.feed(`Üs Puanı ${rw.pts} ödülü: Üretim Masası'nda yeni tarifler (${rw.items.map((i) => ITEMS[i].name).join(', ')}) ve +${rw.pul} ${PUL}.${rw.title ? ' Yeni bir unvan da açıldı!' : ''}`, 'gold');
      S.changed();
      await this.celebrate();
    }
  }

  // ---- bahce
  gardenTap(cell) {
    const info = this.gardenInfo(cell.key);
    if (!info) {
      const seeds = Object.keys(SEEDS).filter((id) => S.countItem(id) > 0);
      if (!seeds.length) { UI.feed('Tohumun yok. Hancı Lale buğday, havuç, patates ve daha fazla tohum satar; Keşifte ot ve böğürtlen toplarken de tohum çıkar.'); this.sulk(); return; }
      const tod = todNow();
      UI.choice('Bahçe tarlası', 'Ne ekmek istersin? (★ = şu an sevdiği saat, %25 çabuk büyür)', [
        ...seeds.map((id) => ({ label: `${SEEDS[id].likes === tod ? '★ ' : ''}${SEEDS[id].name} (${S.countItem(id)})`, cls: 'primary', onClick: () => this.plant(cell, id) })),
        { label: 'Vazgeç' },
      ]);
      return;
    }
    if (!info.ready) {
      const m = Math.ceil(info.left / 60000);
      const gd = S.save.plot.garden[cell.key];
      const opts = [];
      if (!gd.w) opts.push({ label: S.countItem('su_kovasi') ? 'Sula (süre yarıya iner)' : 'Sula (Su Kovası lazım)', cls: 'blue', onClick: () => this.waterCrop(cell) });
      if (!gd.f) opts.push({ label: `Gübrele: +2 ürün (Gübre ${S.countItem('gubre')})`, cls: 'green', onClick: () => this.fertilize(cell) });
      opts.push({ label: 'Tamam' });
      const tags = [gd.w ? 'sulandı' : '', gd.f ? 'gübrelendi' : ''].filter(Boolean).join(', ');
      UI.choice(info.sd.name, `Büyüyor: ${m >= 60 ? `${Math.floor(m / 60)} sa ${m % 60} dk` : `${m} dk`} kaldı.${tags ? ` (${tags})` : ''}`, opts);
      return;
    }
    this.harvest(cell, info);
  }

  async waterCrop(cell) {
    const gd = S.save.plot.garden[cell.key];
    if (!gd || gd.w || this.busy) return;
    if (!S.countItem('su_kovasi')) { UI.feed('Sulamak için Su Kovası lazım. Üretim Masası: 2 Demir Külçesi.'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    await playAnim(this.player, 'c_drinkpotion', 2.4);
    const sd = SEEDS[gd.seed];
    const left = Math.max(0, gd.t0 + sd.ms - Date.now());
    gd.t0 -= left / 2;
    gd.w = 1;
    sfx('splash');
    UI.floatText(this.plotGeom().x0 + cell.c * 16 + 8, GROUND_Y - 30, 'Sulandı!', 'info');
    S.changed();
    this.refreshGarden();
    this.idle();
    this.busy = false;
  }

  async fertilize(cell) {
    const gd = S.save.plot.garden[cell.key];
    if (!gd || gd.f || this.busy) return;
    if (!S.countItem('gubre')) { UI.feed('Gübre yok. Üretim Masası: 2 Solucan + 1 Pulcuk = 3 Gübre.'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 800);
    S.removeItem('gubre', 1);
    gd.f = 1;
    sfx('gather');
    UI.floatText(this.plotGeom().x0 + cell.c * 16 + 8, GROUND_Y - 30, 'Gübrelendi: +2', 'info');
    S.changed();
    this.idle();
    this.busy = false;
  }

  async plant(cell, seed) {
    if (this.busy || !S.countItem(seed)) return;
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 900);
    S.removeItem(seed, 1);
    const sd = SEEDS[seed];
    const liked = sd.likes && sd.likes === todNow();
    S.save.plot.garden[cell.key] = { seed, t0: Date.now() - (liked ? sd.ms * 0.25 : 0) };
    sfx('gather');
    S.changed();
    this.refreshGarden();
    const h = sd.ms / 3600000;
    UI.feed(`${sd.name} ektin. ${h} saatte büyür, oyun kapalıyken de.${liked ? ' Sevdiği saatte ektin: %25 çabuk!' : ''}`);
    this.idle();
    this.busy = false;
  }

  async harvest(cell, info) {
    if (this.busy) return;
    const gd = S.save.plot.garden[cell.key];
    const n = info.sd.n[0] + Math.floor(Math.random() * (info.sd.n[1] - info.sd.n[0] + 1)) + (gd && gd.f ? 2 : 0);
    if (!S.fits(info.sd.out, n)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(cell.c);
    this.player.play('c_sneakspam');
    await wait(this, 1100);
    delete S.save.plot.garden[cell.key];
    sfx('gather');
    this.giveDrop(info.sd.out, n, 'Hasat ettin:', true);
    // ciftlik urunleri tohumunu hep geri verir (1-2), eski bitkiler %50
    if (info.sd.crop) this.giveDrop(info.seed, 1 + (Math.random() < 0.4 ? 1 : 0), 'Tohum:', true);
    else if (Math.random() < 0.5) this.giveDrop(info.seed, 1, 'Tohum geri geldi:', true);
    UI.floatText(this.player.x, GROUND_Y - 44, `+${info.sd.xp} Toplama XP`, 'good');
    const ups = S.addXp({ toplama: info.sd.xp });
    S.save.stats.gathered++;
    S.save.stats.harvested = (S.save.stats.harvested || 0) + 1;
    S.changed();
    this.refreshGarden();
    for (const u of ups) await this.levelUp(u);
    this.idle();
    this.busy = false;
  }

  // 0.11 Ari Kovani: arsada cicek varsa bal birikir
  hiveInfo(cell) {
    const flowers = Object.values(S.save.plot.cells).filter((c) => HIVE.flowers.includes(c.id)).length;
    const rate = flowers >= 3 ? HIVE.msFlowers : HIVE.ms;
    const t = cell.t || Date.now();
    const honey = flowers ? Math.min(HIVE.max, Math.floor((Date.now() - t) / rate)) : 0;
    return { flowers, rate, honey, t };
  }

  async useHive(o, cell) {
    const h = this.hiveInfo(cell);
    if (!h.flowers) { cell.t = Date.now(); S.changed(); UI.feed('Arıların çiçeğe ihtiyacı var: arsana Çiçek Saksısı koy (3 ve üstü çiçek = daha hızlı bal).'); this.sulk(); return; }
    if (!h.honey) {
      const m = Math.ceil((h.t + h.rate - Date.now()) / 60000);
      this.say(`Arılar çalışıyor… ${m} dk sonra bal olur. (${h.flowers} çiçek)`, 2600);
      return;
    }
    if (!S.fits('bal', h.honey)) { UI.feed('Çanta dolu!'); this.sulk(); return; }
    this.busy = true;
    await this.walkToCell(o.c);
    this.player.play('c_sneakspam');
    await wait(this, 900);
    this.giveDrop('bal', h.honey, 'Kovandan aldın:', true);
    cell.t = h.honey >= HIVE.max ? Date.now() : h.t + h.honey * h.rate;
    S.changed();
    this.idle();
    this.busy = false;
  }

  // ------------------------------------------------------------ maden ocagi
  // ------------------------------------------------------------ gol (0.8.5)
  // Ussun arkasindaki kucuk gol: iskelenin ucunda balik tutulur.
  async enterPond() {
    UI.closePanel();
    if (this.busy || !this.home()) return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    this.player.setFlipX(true);
    await moveTo(this.player, -12, { speed: 190, anim: 'c_sprint' });
    await this.fade(true);
    this.goPond();
    this.player.x = -12;
    await this.fade(false);
    await moveTo(this.player, 172, { speed: 95, anim: 'c_walk' });
    this.player.y = POND.deck + 1; // 1.1: iskeleye cikinca, yurumenin sonunda degil
    await moveTo(this.player, POND.standX, { speed: 95, anim: 'c_walk' });
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
    // 0.12 firtina: yagmur ve koyu gok; gizli Yildirim Yilanbaligi oltaya takilabilir
    if (stormNow()) this.makeRain();
  }

  // gol cizimi ve balik tutma noktasi (us ya da Kesif odasi)
  makeRain() {
    const dim = this.add.rectangle(0, 0, GAME_W, GROUND_Y + 40, 0x1a2030, 0.35).setOrigin(0).setDepth(2.5);
    this.addObj(dim);
    for (let i = 0; i < 46; i++) {
      const d = this.add.rectangle(Math.random() * GAME_W, Math.random() * GROUND_Y, 1, 5, 0xb8c8e8, 0.7).setDepth(30);
      this.addObj(d);
      this.tweens.add({ targets: d, y: GROUND_Y + 30, x: d.x - 10, duration: 500 + Math.random() * 300, repeat: -1, delay: Math.random() * 600, onRepeat: () => { d.y = -6; d.x = Math.random() * (GAME_W + 20); } });
    }
    if (this.rainEv) this.rainEv.remove();
    this.rainEv = this.time.addEvent({ delay: 4500, loop: true, callback: () => { if (this.mode !== 'pond') { this.rainEv.remove(); this.rainEv = null; return; } if (Math.random() < 0.4) { this.cameras.main.flash(120, 220, 230, 255); sfx('warn'); } } });
    if (!S.save.flags.storm012) { S.save.flags.storm012 = 1; UI.feed('Fırtına var! Böyle havalarda gölde gizemli bir Glemon dolaşıyormuş…'); }
    else UI.feed('Fırtına! Göl dalgalı.');
  }

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
      { label: 'Eve dön', onClick: () => this.leavePond() },
    ]);
  }

  async leavePond() {
    if (this.busy || this.mode !== 'pond') return;
    this.busy = true;
    UI.setActions([]);
    // 1.1 (Eren): gole soldan gelinir, donus de iskeleden sola dogru (suyun ustunden saga yurumesin)
    this.player.y = POND.deck + 1;
    this.player.setFlipX(true);
    await moveTo(this.player, 172, { speed: 150, anim: 'c_run' }); // iskelenin basi
    this.player.y = GROUND_Y;
    await moveTo(this.player, -12, { speed: 150, anim: 'c_run' });
    await this.fade(true);
    this.goBase('pond');
    this.player.setFlipX(false);
    await this.fade(false);
    await moveTo(this.player, 34, { speed: 120, anim: 'c_walk' });
    this.idle();
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
    const stage = GLEMONS[key].secret ? 0 : Math.random() < 0.15 ? 1 : 0;
    this.battle = new Battle(this, [{ key, stage, shiny: Math.random() < S.shinyChance() * shinyMastery(key) }], { ...this.battleOpts(room || {}), floor });
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

  // 0.10: Maden artik asagi kazilan sonsuz kuyu (src/shaft.js)

  oreReq(kind) { return ORES[kind].req; }

  // bloga dokununca: kontroller, sonra kazma
  onBlock(b) {
    if (this.mode !== 'dungeon') return;
    if (this.busy || UI.panelOpen() || !b.kind) return;
    if (this.mode === 'dungeon' && this.battle) return;
    const ore = ORES[b.kind];
    const by = b.spr.y - 10;
    if (!S.pick()) { UI.feed('Kazma kuşanmadan kazamazsın. (Çanta → Kazma)'); this.sulk(); return; }
    if (S.level('madencilik') < ore.req) { UI.floatText(b.spr.x, by, `Madencilik ${ore.req} gerekli`, 'note'); sfx('weak'); this.sulk(); return; }
    if (ore.drop && !S.fits(ore.drop)) { UI.floatText(b.spr.x, by, 'Çanta dolu!', 'note'); this.sulk(); return; }
    this.mineBlock(b);
  }

  async mineBlock(b) {
    this.busy = true;
    this.walkTok++;
    const p = this.player;
    const standX = b.standX ?? 200;
    if (Math.abs(p.x - standX) > 2) await moveTo(p, standX, { speed: 110, anim: 'c_walk' });
    p.setFlipX(false);
    const depth = 1;
    const need = Math.max(1, Math.ceil(ORES[b.kind].hard / S.pick()) - (S.has('hizli_kazma') ? 1 : 0));
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
    if (this.mode === 'dungeon' && this.afterVein) this.afterVein();
  }

  async breakBlock(b, depth, silent = false) {
    const kind = b.kind;
    const ore = ORES[kind];
    b.kind = null;
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

  async enterDungeon(floor) {
    UI.closePanel();
    if (this.busy) return;
    this.busy = true;
    stopMusic();
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    S.startRun(floor);
    if (S.kadimOn()) S.run.kadim = true; // 1.0 oyun sonrasi Kadim zorluk
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    this.zz = null;
    await this.enterFloor(floor);
    if (this.isNight()) { UI.banner('Gece', 'Glemonlar %15 güçlü · %30 fazla XP ve eşya', 2600); UI.feed('Gece Keşfi: Glemonlar daha güçlü ama daha çok XP ve eşya veriyor. Sadece gece çıkan Glemonlar da var!'); }
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

  // ------------------------------------------------------------ 0.13.5 Sonsuz Kule
  // Her kat tek savas ve rastgele bir kural. 5 katta ara patron, 10 katta sandik.
  // Haftalik sifirlanir; bu haftaki 5'in katlarindan devam edebilirsin.
  kuleWeek() {
    const k = S.save.kule;
    const wk = weekNum();
    if (k.wk !== wk) { k.wk = wk; k.best = 0; k.cp = 0; k.chests = []; }
    return k;
  }
  async enterKule(from = 1) {
    UI.closePanel();
    if (this.busy || !this.home()) return;
    this.kuleWeek();
    this.busy = true;
    stopMusic();
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    S.startRun(from);
    S.run.zindan = true;
    S.run.kule = true;
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    await this.enterFloor(from);
  }
  inKule() { return !!(S.run && S.run.kule); }
  kuleRule() { return KULE_RULES.find((r) => r.k === (S.run && S.run.krule)); }
  // Kule kati temizlendi: rekor ve kontrol noktasi
  kuleCleared(f) {
    const k = this.kuleWeek();
    if (f > k.best) k.best = f;
    if (f > (k.all || 0)) k.all = f;
    if (f % KULE.mini === 0 && f > (k.cp || 0)) { k.cp = f; UI.feed(`<span style="color:#ffd04d">Kule kontrol noktası: bu hafta Kat ${f + 1}'den devam edebilirsin.</span>`, 'gold'); }
    S.save.stats.kuleBest = Math.max(S.save.stats.kuleBest || 0, f);
    S.changed();
  }
  // 10 katta bir: Kule sandigi (her hafta her sandik bir kez)
  async kuleReward(room) {
    if (this.busy || room.opened) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, room.obj.x - 20, { speed: 85, anim: 'c_walk' });
    this.player.setFlipX(false);
    await playAnim(this.player, 'c_punch', 1.4);
    room.obj.setTexture('chest_open');
    room.opened = true;
    sfx('chest');
    this.idle();
    const f = this.zLevel;
    const k = this.kuleWeek();
    if (k.chests.includes(f)) {
      const g = 20 * f;
      S.addGold(g);
      UI.feed(`Bu haftanın Kat ${f} sandığını zaten açmıştın: sadece ${g} ${CURRENCY}. Pazartesi yenilenir.`);
    } else {
      k.chests.push(f);
      UI.banner('Kule sandığı!', `Kat ${f}`, 2000, 'gold');
      const gold = Math.round(60 * f * (1 + f / 20));
      S.addGold(gold);
      UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Kule sandığından ${gold} ${CURRENCY}!`, 'gold');
      const zs = ZONES.slice(0, Math.min(ZONES.length, 1 + Math.floor(f / 10)));
      for (let i = 0; i < 1 + Math.floor(f / 10); i++) this.giveDrop(pick(ZONE_CHEST[pick(zs).key].mats), 2 + Math.floor(f / 5), 'Kule sandığından');
      const zc = ZONE_CHEST[zs[zs.length - 1].key];
      this.giveDrop(weighted(zc.gear || CHEST_GEAR), 1, 'Kule sandığından', false, 2 + f / 10);
      if (f >= 20) this.giveDrop('yildiz_demiri', 1 + Math.floor(f / 25), 'Kule sandığından');
      if (f >= 30 && Math.random() < 0.3) this.giveDrop('usta_damgasi', 1, 'Kule sandığından');
      // Efsanevi yol 2 (Dusur): Kadim silah. 50. kat sandigi ilk seferde garanti
      const first50 = f >= 50 && !k.k50;
      if (first50 || (f >= KULE.kadimFrom && Math.random() < 0.1 * S.dropMult())) {
        if (first50) k.k50 = true;
        this.giveLegend('kadim', 'Kule sandığından');
      }
      addPul(f >= 30 ? 3 : 2);
      UI.feed(`<span style="color:#ffd04d">+${f >= 30 ? 3 : 2} ${PUL}</span>`, 'gold');
    }
    S.changed();
    this.busy = false;
    room.cleared = true;
    this.refreshRoomActions();
  }
  // efsanevi silah: sinifinin silahi (sinif yoksa elindeki silahin turu)
  giveLegend(path, from) {
    const cw = S.cls() ? S.cls().wt[0] : S.weaponType();
    const wt = ['kilic', 'yay', 'asa'].includes(cw) ? cw : 'kilic';
    const id = `${path}_${wt}`;
    UI.banner('EFSANEVİ!', ITEMS[id].name, 3000, 'gold');
    sfx('levelup');
    this.giveDrop(id, 1, from);
    return id;
  }

  // ------------------------------------------------------------ 0.13.5 zor mod patron
  async enterHardBoss(key) {
    UI.closePanel();
    if (this.busy || !this.home()) return;
    const z = ZONES.find((x) => x.boss === key);
    if (!z || !(S.save.stats.glemons[key] > 0)) return;
    this.busy = true;
    stopMusic();
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    S.startRun(z.floors[1]);
    S.run.zindan = true;
    S.run.ev = 'zor';
    S.run.hardKey = key;
    S.run.zseed = 0;
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    await this.enterFloor(1);
  }
  async hardReward(key) {
    const z = ZONES.find((x) => x.boss === key);
    const zi = ZONES.indexOf(z);
    UI.banner('Zor mod zaferi!', GLEMONS[key].name, 2400, 'gold');
    const boss = GLEMONS[key];
    // patronun kendi malzemesi 2 tane, zor mod tablosu ve garanti bir kaliteli esya sansi
    this.giveDrop(boss.drops[0][0], 2, `${boss.from} (zor)`);
    for (const [id, ch] of HARD_DROPS) if (Math.random() < ch * S.dropMult()) this.giveDrop(id, 1, `${boss.from} (zor)`);
    const zc = ZONE_CHEST[z.key];
    this.giveDrop(weighted(zc.gear || CHEST_GEAR), 1, `${boss.from} (zor)`, false, 4);
    if (Math.random() < HARD.kadim[zi] * S.dropMult()) {
      const id = this.giveLegend('kadim', `${boss.from} (zor)`);
      S.bossDrop(key, id);
    }
    S.changed();
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
      this.giveDrop(weighted(zc.gear || CHEST_GEAR), 1, 'Ödül sandığından', false, 1 + n / 20);
    }
    if (Math.random() < 0.15 + n * 0.01) this.giveDrop('altin_elma', 1, 'Ödül sandığından');
    if (Math.random() < 0.04 + n * 0.006) this.giveDrop('can_tilsimi', 1, 'Ödül sandığından');
    if (n >= 10 && Math.random() < 0.5) this.giveDrop('orta_iksir', 2, 'Ödül sandığından');
    // 0.8: derinlerde nadir cevherler ve efsanevi yumurta
    if (n >= 15 && Math.random() < 0.25) this.giveDrop(pick(['altin_cevheri', 'saf_kristal', 'kor_tasi']), 2 + Math.floor(n / 10), 'Ödül sandığından');
    if (n >= 20 && Math.random() < 0.06 + n * 0.002) this.giveDrop('bonkit', 1, 'Ödül sandığından');
    if (Math.random() < Math.min(0.15, 0.02 + n * 0.002) * S.dropMult()) this.giveDrop(`yumurta_${pick(zs).key}`, 1, 'Ödül sandığından');
  }

  // 0.9 Etkinlik Kapisi: Gunun Zindani (5 kat, gunun kurali) ve Patron Kosusu (arka arkaya bolge patronlari)
  async enterEvent(kind) {
    UI.closePanel();
    if (this.busy || !this.home()) return;
    this.busy = true;
    stopMusic();
    this.walkTok++;
    UI.setActions([]);
    await this.travelOut();
    const best = S.save.stats.zindanBest || 0;
    const start = kind === 'gunluk' ? Math.max(1, Math.floor(best * 0.6)) : 1;
    S.startRun(start);
    S.run.zindan = true;
    S.run.ev = kind;
    S.run.zseed = Math.floor(Math.random() * 3);
    S.run.evEnd = kind === 'gunluk' ? start + 4 : start;
    if (kind === 'gunluk') {
      const r = todayRule();
      S.run.rule = r.k;
      if (r.k === 'altin') S.run.goldX = 2;
      if (r.k === 'dev') S.run.xpX = 2;
    }
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    await this.enterFloor(start);
  }

  bossRushRooms() {
    const zs = this.unlockedZones().slice(-4);
    const rooms = [];
    zs.forEach((z, i) => {
      rooms.push({ type: 'evboss', key: z.boss, fl: z.floors[1] });
      if (i === 1) rooms.push({ type: 'kamp' });
    });
    rooms.push({ type: 'evodul' });
    return rooms;
  }

  async eventReward(room) {
    if (this.busy || room.opened) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, room.obj.x - 20, { speed: 85, anim: 'c_walk' });
    this.player.setFlipX(false);
    await playAnim(this.player, 'c_punch', 1.4);
    room.obj.setTexture('chest_open');
    room.opened = true;
    sfx('chest');
    this.idle();
    const kind = S.run.ev;
    const ev = S.save.ev;
    const field = kind === 'gunluk' ? 'daily' : 'weekend';
    const key = kind === 'gunluk' ? dayNum() : weekNum();
    if (!clockOk()) UI.feed('Cihazının saati geri alınmış görünüyor. Saat düzelince etkinlik ödülleri yine gelir.');
    else if (ev[field] === key) UI.feed(kind === 'gunluk' ? 'Bugünün ödülünü zaten aldın. Yarın yeni kural, yeni sandık!' : 'Bu hafta sonunun ödülünü zaten aldın.');
    else {
      ev[field] = key;
      const pul = kind === 'gunluk' ? 3 : 6;
      addPul(pul);
      UI.banner('Etkinlik sandığı!', `+${pul} ${PUL}`, 2400, 'gold');
      UI.feed(`<span style="color:#ffd04d">★ Etkinlik ödülü: +${pul} ${PUL}!</span>`, 'gold');
      await this.zindanReward();
      // patron kosusu: garanti bir epik esya
      if (kind === 'patron') this.giveDrop(pick(['can_tilsimi', 'altin_elma', 'buyuk_iksir', 'canta_eki']), 1, 'Patron sandığından');
      else if (Math.random() < 0.35) this.giveDrop(pick(['altin_elma', 'parlak_yem', 'canta_eki']), 1, 'Etkinlik sandığından');
    }
    S.changed();
    this.busy = false;
    room.cleared = true;
    UI.setActions([{ label: 'Eve dön', cls: 'primary', onClick: () => this.returnBase() }]);
  }

  zindanRooms(level) {
    if (S.run && S.run.ev === 'patron') return this.bossRushRooms();
    if (S.run && S.run.ev === 'zor') { const k = S.run.hardKey; return [{ type: 'evboss', key: k, fl: ZONES.find((z) => z.boss === k).floors[1], hard: true }]; }
    if (S.run && S.run.kule) {
      const rooms = [level % KULE.mini === 0 ? { type: 'arapatron' } : { type: 'savas' }];
      if (level % KULE.chest === 0) rooms.push({ type: 'kulesandik' });
      rooms.push({ type: 'merdiven' });
      return rooms;
    }
    const W = [['savas', 50], ['uyuyan', 15], ['sandik', 12], ['tuzak', 18], ['maden', 5]];
    const rooms = [{ type: 'savas' }];
    const n = 3 + (level >= 10 ? 1 : 0);
    for (let i = 1; i < n; i++) rooms.push({ type: weighted(W) });
    const allDark = S.run && S.run.rule === 'karanlik';
    for (const r of rooms) r.dark = allDark || Math.random() < 0.25;
    if (!allDark) rooms[0].dark = false;
    if (S.run && S.run.ev) {
      // Gunun Zindani: son katta etkinlik sandigi
      if (level >= S.run.evEnd) { rooms.push({ type: 'arapatron' }); rooms.push({ type: 'evodul' }); } else rooms.push({ type: 'merdiven' });
      return rooms;
    }
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
    if (this.inKule()) return Math.min(3, pick([1, 2, 2, 2, 3]) + (S.run.krule === 'kalabalik' ? 1 : 0));
    const zf = this.zoneFloor(f);
    return pick(zf <= 2 ? (f <= 2 ? [1, 1, 2] : [1, 2, 2]) : zf <= 6 ? [1, 2, 2, 3] : [2, 2, 3]);
  }

  enemySpecs(n, extra = {}) {
    const table = ZONE_SPAWNS[this.zone().key];
    const [usta, genc] = wildStageChances(this.zoneFloor());
    const rule = S.run && S.run.rule;
    const moon = fullMoon();
    const night = this.isNight();
    return Array.from({ length: n }, () => {
      const r = Math.random();
      const stage = rule === 'dev' || (S.run && S.run.krule === 'dev') ? 2 : r < usta ? 2 : r < usta + genc ? 1 : 0;
      // 0.9 Dolunay Gecesi: her bolgede nadiren Dolunay Tavsani
      let key = moon && Math.random() < 0.06 ? 'ay_tavsani' : night && Math.random() < NIGHT.chance ? weighted(NIGHT_SPAWNS[this.zone().key]) : weighted(table);
      // 0.12 gizli tur: dolunay gecesi Keşifte Hilal Ejderi
      if (moon && this.mode === 'dungeon' && !this.inZindan() && Math.random() < SECRETS.moon[1]) key = SECRETS.moon[0];
      return { key, shiny: Math.random() < S.shinyChance() * (rule === 'parlak' ? 3 : 1) * shinyMastery(key), stage: GLEMONS[key].secret ? 0 : stage, ...extra };
    });
  }

  roomLabel() {
    if (this.inKule()) { const r = this.kuleRule(); return `Sonsuz Kule · Kat ${this.zLevel}${r ? ` · ${r.n}` : ''}`; }
    if (S.run && S.run.ev === 'zor') return 'Zor mod patron';
    if (S.run && S.run.ev === 'patron') return `Patron Koşusu · Oda ${this.roomIdx + 1}/${this.rooms.length}`;
    if (S.run && S.run.ev) return `Günün Zindanı · Kat ${this.zLevel - S.run.evEnd + 5}/5 · Oda ${this.roomIdx + 1}/${this.rooms.length}`;
    if (this.inZindan()) return `Zindan · Kat ${this.zLevel} · Oda ${this.roomIdx + 1}/${this.rooms.length}`;
    return `${zoneOf(this.floor).name} · Kat ${this.floor} · Oda ${this.roomIdx + 1}/${this.rooms.length}`;
  }

  async enterFloor(f) {
    if (this.inKule()) {
      if (f > 1 && f - 1 > (S.run.kf || 0)) this.kuleCleared(f - 1);
      // merdivende soluklanma: her yeni katta canin %10'u dolar
      if (f > S.run.startFloor && S.hp > 0) S.hp = Math.min(S.maxHp(), S.hp + Math.round(S.maxHp() * KULE.heal));
      S.run.kf = f - 1;
      this.zLevel = f;
      this.floor = KULE.eff(f);
      this.zz = ZONES[Math.min(ZONES.length - 1, Math.floor((f - 1) / 9))];
      const pool = KULE_RULES.filter((r) => !(f % KULE.mini === 0 && r.k === 'kalabalik'));
      S.run.krule = pick(pool).k;
      this.rooms = this.genRooms(f);
      S.changed();
      await this.enterRoom(0);
      return;
    }
    if (S.run && S.run.ev === 'zor') {
      this.zLevel = 1;
      const z = ZONES.find((x) => x.boss === S.run.hardKey);
      this.floor = z.floors[1];
      this.zz = z;
      this.rooms = this.genRooms(f);
      await this.enterRoom(0);
      return;
    }
    if (this.inZindan()) {
      this.zLevel = f;
      this.floor = this.zEff(f);
      const zs = this.unlockedZones();
      this.zz = zs[(Math.floor((f - 1) / 3) + (S.run.zseed || 0)) % zs.length];
      // 0.9 Gunun Zindani kurali: sadece ates / buz Glemonlari
      if (S.run.rule === 'ates') this.zz = ZONES.find((z) => z.key === 'kor');
      if (S.run.rule === 'buz') this.zz = ZONES.find((z) => z.key === 'buz');
      this.rooms = this.genRooms(f);
      if (!S.run.ev && f > (S.save.stats.zindanBest || 0)) {
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
    this.exploreMusic();
    const v = i % 3;
    const zone = this.zone();
    const zin = this.inZindan();
    const kule = zin && S.run && S.run.kule;
    const key = zin ? `${kule ? 'kbg' : 'zbg'}_${Math.min(this.zLevel, 40)}_${v}` : `bg_${this.floor}_${v}${room.dark ? '_d' : ''}`;
    this.roomBg = null;
    this.bgTex(key, () => (kule ? kuleRoomBackground(Math.min(this.zLevel, 40), v) : zin ? dungeonRoomBackground(Math.min(this.zLevel, 40), v) : zone.key === 'magara' ? caveRoomBackground(this.floor, v, !!room.dark)
      : zone.key === 'col' ? desertRoomBackground(this.floor, v) : BIOME_KEYS.includes(zone.key) ? biomeRoomBackground(zone.key, this.floor, v) : forestBackground(this.floor, v)));
    this.bg.setTexture(key);
    this.player.setFlipX(false);
    this.player.x = -20;
    this.placeFollowers(-48);
    this.resetPlayer();
    this.prepareRoom(room);
    this.darkness(room);
    UI.setLocation(this.roomLabel());
    await this.fade(false);
    const evr = S.run && S.run.ev;
    if (i === 0 && this.inKule()) { const r = this.kuleRule(); UI.banner(`Sonsuz Kule · Kat ${this.zLevel}`, r ? `${r.n}: ${r.d}` : '', 2200, this.zLevel % KULE.mini === 0 ? 'gold' : undefined); }
    else if (i === 0 && evr === 'zor') UI.banner('Zor mod', 'Patron çok daha güçlü!', 1600, 'boss');
    else if (i === 0 && evr === 'patron') UI.banner('Patron Koşusu', 'Bölge patronları arka arkaya!', 1800, 'gold');
    else if (i === 0 && evr) UI.banner(`Günün Zindanı ${this.zLevel - S.run.evEnd + 5}/5`, todayRule().n, 1800, 'gold');
    else if (i === 0) UI.banner(zin ? `Zindan Kat ${this.zLevel}` : `Kat ${this.floor}`, zin ? `Rekorun: Kat ${S.save.stats.zindanBest || 0}` : zone.name, 1600);
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
  // 0.11: corba, iksir ve matara artik kendiliginden icilmez; Hazirlik ekranindan (ya da cantadan) icilir
  async coldCheck() {
    if (Date.now() < (S.save.warmUntil || 0)) return;
    if (!this.toldCold) { this.toldCold = true; UI.feed(S.countItem('sicak_corba') || S.countItem('balik_corbasi') ? 'Üşüyorsun! Çantandan Sıcak Çorba iç (Çanta → Ye), yoksa savaşlarda yavaşlarsın.' : 'Donmuş Zirve çok soğuk! Sıcak Çorba içmezsen savaşlarda yavaşlarsın. (Mutfak ya da Hancı Lale)'); }
  }
  // 0.8 Kor Diyari: ates direnci yoksa savaslara yanarak baslarsin
  burning() { return this.zone().key === 'kor' && !this.inZindan() && Date.now() >= (S.save.fireResUntil || 0) && !S.fireproof(); }
  async lavaCheck() {
    if (Date.now() < (S.save.fireResUntil || 0) || S.fireproof()) return;
    if (!this.toldLava) { this.toldLava = true; UI.feed(S.countItem('ates_iksiri') ? 'Lav yakıyor! Çantandan Ateş Direnci İksiri iç, yoksa savaşlara yanarak başlarsın.' : 'Kor Diyarı yakıyor! Ateş Direnci İksiri yoksa savaşlara yanarak başlarsın. (Simya Kazanı ya da Hancı Lale)'); }
  }
  battleOpts(room) { return { floor: this.floor, dark: this.unlit(room), cold: this.cold(), burn: this.burning(), night: this.isNight(), kadim: !!(S.run && S.run.kadim && !this.inZindan()) }; }
  // 0.11 gece tehlikesi: sadece Kesifte (Zindan ve etkinlikler haric), gercek saatle gece
  isNight() { return this.mode === 'dungeon' && !this.inZindan() && !(S.run && S.run.ev) && todNow() === 'gece'; }

  // Kesife cikmadan once Hazirlik ekrani
  prepDungeon(floor) { openPrep(this, floor); }

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
    const d = Math.max(1, Math.round(S.maxHp() * 0.04));
    if (S.hp <= 1) return;
    S.hp = Math.max(1, S.hp - d);
    UI.floatText(this.player.x, GROUND_Y - 40, `Sıcak! -${d}`, 'hurt');
    if (!this.toldHeat) { this.toldHeat = true; UI.feed(S.countItem('su_matarasi') ? 'Çok sıcak! Çantandan Su Matarası iç (Çanta → Kullan), yoksa her odada can kaybedersin.' : 'Çöl çok sıcak! Su Matarası içersen can kaybetmezsin. (Simya Kazanı: Kaktüs suyu + Pul)'); }
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
      case 'evboss':
        this.battle = new Battle(this, [{ key: room.key }], { ...this.battleOpts({}), floor: room.fl, boss: true, hard: !!room.hard });
        break;
      case 'kulesandik':
        room.obj = this.addObj(this.add.image(250, G + 1, room.opened ? 'chest_open' : 'chest').setOrigin(0.5, 1).setDepth(4).setScale(1.4));
        break;
      case 'evodul':
        room.obj = this.addObj(this.add.image(250, G + 1, room.opened ? 'chest_open' : 'chest').setOrigin(0.5, 1).setDepth(4).setScale(1.4));
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
                  : zk === 'cekirdek' ? [['tas', 20], ['kristal', 20], ['golge', 25], ['yildiz', 15], ['bonkit', 2], ['define', 6]]
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
      // 0.9 Dolunay Gecesi: ay otu her odada, gunun her saatinde cikabilir
      if (ok && fullMoon() && Math.random() < 0.3) room.node = 'ay_otu';
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
    const back = { label: 'Eve dön', onClick: () => this.returnBase() };
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
    const n = 1 + Math.floor(S.level('toplama') / 10) + (Math.random() < 0.3 ? 1 : 0) + (Math.random() < S.tokVal('gather') ? 1 : 0);
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
    const back = { label: 'Eve dön', onClick: () => this.returnBase() };
    this.afterVein = null;
    switch (room.type) {
      case 'savas':
      case 'arapatron':
      case 'boss':
      case 'evboss':
        this.fight(room);
        break;
      case 'kulesandik':
        if (room.opened) this.refreshRoomActions();
        else UI.setActions([{ label: 'Kule sandığını aç', cls: 'primary', onClick: () => this.kuleReward(room) }, back]);
        break;
      case 'evodul':
        if (room.opened) UI.setActions([{ label: 'Eve dön', cls: 'primary', onClick: () => this.returnBase() }]);
        else UI.setActions([{ label: 'Etkinlik sandığını aç', cls: 'primary', onClick: () => this.eventReward(room) }]);
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
        if (this.inKule()) {
          this.kuleCleared(this.zLevel);
          S.run.kf = this.zLevel;
          UI.setActions([{ label: `Yukarı çık (Kat ${this.zLevel + 1})`, cls: 'primary', onClick: () => this.descend() }, back]);
          break;
        }
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
    if (room.type === 'boss' || room.type === 'evboss') {
      const z = room.type === 'evboss' ? zoneOf(room.fl) : zoneOf(this.floor);
      UI.banner(GLEMONS[room.key || z.boss].name.toLocaleUpperCase('tr'), `${z.name} bekçisi`, 2400, 'boss');
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
    const bt = this.battle;
    const res = await this.battle.start();
    this.battle = null;
    if (this.inBattleView) await this.exitBattleView(res !== 'lose');
    this.busy = false;
    // 0.13.5 patron gunlugu: kac kez, en hizli sure (zor mod ayri)
    if (res === 'win' && bt && bt.bossWin) S.bossWin(bt.bossWin, !!room.hard, Date.now() - bt.t0);
    // 1.1 cila: Kule kati savas kazanilinca sayilir (eskiden ancak bir sonraki kata inince sayiliyordu,
    // 5. katta ara patronu yenip usse donen kontrol noktasini alamiyordu)
    if (res === 'win' && this.inKule() && S.run.kf < this.zLevel) { S.run.kf = this.zLevel; this.kuleCleared(this.zLevel); }
    if (res === 'win') {
      if (room.type === 'boss') this.bossDefeated();
      else if (room.hard) {
        this.busy = true;
        await this.hardReward(room.key);
        await this.playPool('sevinc', 2000);
        this.idle();
        this.busy = false;
        room.cleared = true;
        UI.setActions([{ label: 'Eve dön', cls: 'primary', onClick: () => this.returnBase() }]);
      } else this.roomDone();
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
    // 1.1: Zindan/Kule ve Magara savaslari kendi kapali mekan sahnesinde (kemerler, mesaleler, perspektifli zemin)
    const indoor = this.mode !== 'dungeon' ? null : this.inZindan() ? (S.run && S.run.kule ? 'kule' : 'zindan') : (this.zone() || {}).key === 'magara' ? 'magara' : null;
    const lv = this.inZindan() ? this.zLevel || 1 : this.floor;
    const key = indoor ? `stage_in_${indoor}_${lv % 6}` : `stage_${this.roomBg}`;
    this.bgTex(key, () => battleStage(indoor === 'kule' ? kuleStage(lv % 6, lv % 3) : indoor ? indoorStage(indoor, lv % 6, lv % 3) : this.textures.get(this.roomBg).getSourceImage()));
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

  // 1.0 kesif muzigi: bolgenin, Zindan'in ya da Kule'nin kendi sarkisi
  exploreMusic() {
    if (this.inBattleView) return;
    if (this.mode === 'mine') { playMusic('z_maden', false); return; }
    if (this.mode !== 'dungeon') return;
    const k = this.inKule() ? 'z_kule' : this.inZindan() ? 'z_zindan' : `z_${this.zone().key}`;
    playMusic(SYNTH_KEYS.includes(k) ? k : 'z_zindan', false);
  }

  async exitBattleView(show = true) {
    if (!this.inBattleView) return;
    S.setFight(false);
    stopMusic();
    if (show) await this.fade(true);
    this.inBattleView = false;
    this.exploreMusic();
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
      { label: 'Eve dön', onClick: () => this.returnBase() },
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
    if (Math.random() < 0.18 * S.dropMult()) this.giveDrop(weighted(zc.gear || CHEST_GEAR), 1, 'Sandıktan', false, 1.5);
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
    if (this.inZindan() && !this.inKule()) S.save.stats.zfloors = (S.save.stats.zfloors || 0) + 1;
    this.enterFloor(this.inZindan() ? this.zLevel + 1 : this.floor + 1);
  }

  async bossDefeated() {
    this.busy = true;
    const z = zoneOf(this.floor);
    const next = ZONES[ZONES.indexOf(z) + 1];
    S.logDrop(null, GLEMONS[z.boss].name, { note: `yenildi! ${z.name} temizlendi` });
    S.changed();
    if (z.boss === 'kadim_bonk' && !(S.run && S.run.kadim)) { await this.finale(); return; }
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
    acts.push({ label: 'Eve dön', cls: acts.length ? '' : 'primary', onClick: () => this.returnBase() });
    UI.setActions(acts);
  }

  // 1.0 final: Kadim Bonk uyandi. Jenerik, Efsane unvani, Kadim zorluk acilir
  async finale() {
    const first = !S.save.ending;
    S.save.ending = S.save.ending || Date.now();
    S.changed();
    UI.banner('Kadim Bonk uyandı!', 'Bonkit yeniden parlıyor', 3500, 'gold');
    sfx('rare');
    await this.playPool('sevinc', 2600);
    this.idle();
    this.busy = false;
    const acts = [{ label: 'Eve dön', cls: 'primary', onClick: () => this.returnBase() }];
    UI.setActions(acts);
    openCredits(this, first);
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
    UI.feed('Eve döndün. Topladıkların güvende!');
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
      body.appendChild(UI.el('p', 'muted', 'İpucu: Canın azalınca "Eve dön" ile her şeyini koruyabilirsin.'));
      const row = UI.el('div', 'choice-row');
      row.appendChild(UI.button('Eve dön', () => UI.closePanel(), 'primary'));
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
  giveDrop(id, n, from, found = false, boost = 1) {
    const it = ITEMS[id];
    const left = S.addItem(id, n, 'bag', boost);
    const got = n - left;
    if (got > 0) {
      // 0.13.5: Nadir / Epik kalite cikinca adinin yaninda yazar
      const x = S.lastRoll;
      const rar = S.rarityOf(id, x);
      const special = rar !== 'siradan' || !['malzeme', 'tuketim'].includes(it.kind);
      const cls = rar === 'nadir' ? 'rare' : rar === 'epik' ? 'epic' : rar === 'efsanevi' ? 'gold' : '';
      const q = x ? ` <span class="tag" style="color:${RARITY[x.q].color}">✦ ${RARITY[x.q].name} kalite</span>` : '';
      const text = found ? `${UI.escapeHtml(from)} ${UI.itemName(id)}${q}${got > 1 ? ` ×${got}` : ''}` : `${UI.escapeHtml(from)} ${UI.itemName(id)}${q}${got > 1 ? ` ×${got}` : ''} düştü!`;
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
    if (up.virt) { // 1.0 sanal seviye
      UI.bubble(this.player.x, GROUND_Y - 44, `<b>${sk.name}</b> sanal ${up.level}!`, 2600);
      UI.feed(`<span style="color:#ffd04d">✦ ${sk.name} sanal seviyen ${up.level}${up.level >= 120 ? ': gerçek bir USTA oldun!' : ''}</span>`, 'gold');
      return;
    }
    UI.bubble(this.player.x, GROUND_Y - 44, `<b>${sk.name}</b> ${up.level}. seviye!`, 2600);
    UI.feed(`<span style="color:#ffd04d">★ ${sk.name} seviyen ${up.level} oldu!</span>`, 'gold');
    if (up.level === 99) {
      UI.banner(`${sk.name} 99!`, 'Pelerinin çantanda. Üsteki heykelin de parlıyor.', 3200, 'gold');
      if (S.count99() === 1) UI.feed('<span style="color:#ffd04d">✦ İlk 99\'un! Üste altın bir heykelin dikildi. 99\'dan sonra XP birikir, sanal seviye 120\'ye kadar çıkar.</span>', 'gold');
    }
    const gear = Object.values(ITEMS).filter((it) => it.req && it.req[0] === up.skill && it.req[1] === up.level);
    if (gear.length) UI.feed(`Artık kuşanabilirsin: ${gear.map((it) => it.name).join(', ')}`);
    for (const [wt, list] of Object.entries(ABILITIES)) {
      const sk = WEAPON_SKILL[wt];
      for (const a of list) if (sk === up.skill && a.lvl === up.level) UI.feed(`Yeni yetenek: ${a.name} (${{ yay: 'yay', kilic: 'kılıç', yumruk: 'yumruk', asa: 'asa' }[wt]}: ${a.desc})`, 'gold');
    }
    // 0.13 sinif ve alt sinif Hanci Lale'de acilir
    if (CLASS_RULES.skills.includes(up.skill) && S.combatLevel() === up.level) {
      if (up.level === CLASS_RULES.unlock && !S.cls()) UI.feed('<span style="color:#ffd04d">★ Sınıf seçimi açıldı! Hancı Lale\'ye git: Savaşçı, Nişancı, Büyücü ya da Destek.</span>', 'gold');
      if (up.level === CLASS_RULES.sub && S.cls() && !S.sub()) UI.feed('<span style="color:#ffd04d">★ Alt sınıf seçimi açıldı! Hancı Lale\'ye git.</span>', 'gold');
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

Object.assign(WorldScene.prototype, ShaftMixin, GroveMixin);
