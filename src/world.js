// Ana sahne: us (ev, depo, harita, maden girisi) ve zindan odalari.
import { glemTex, glemScale, attachGlemon, accAnchor, glemHeadOffset } from './glemon2.js';
import { GAME_W, GROUND_Y, ITEMS, SKILLS, STAGES, ABILITIES, ORES, RECIPES, ANIM_POOLS, CURRENCY, BUILD, CAMP, CLASS_RULES, WEAPON_SKILL, TREE2, FIRE, TOK, RARITY, CAPE_COLORS, STATION_LVL } from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx, playMusic, currentMusic } from './audio.js';
import { playAnim, moveTo, wait, animDur } from './anim.js';
import { block } from './blocks.js';
import { Pix, INK, mix, mul, pack, unpack } from './pix.js';
import { TOD, TOD_SKIP, todNow, forestBackground, iconUrl, POND } from './art.js';
import { refreshTut, tutInit, applySettings, openSettings } from './help.js';
import { openBag, openDepo, openSkills, openProfile, openStation, openAnvil, furnaceState, openShop, openCamp, openAhir, openVillageMap, openQuests, openMerchant } from './panels.js';
import { ShaftMixin } from './shaft.js';
import { GroveMixin } from './grove.js';
import { refreshGoals, readyCount, goalTick, fullMoon, merchantHere, titleOf } from './goals.js';
import { now as gNow } from './clock.js';
import { PlotPart } from './plot.js';
import { PondPart } from './pond.js';
import { DungeonPart } from './dungeon.js';
import { PLAYER_HOME, WALK_MODES, YARD_W, YX, ATOLYE, SIT_AFTER, SPRINT_DIST, pick } from './wconst.js';

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
    // K3 (1.0.19): test kancalari yalnizca gelistirmede (yayin paketinde __DEV__ = false)
    if (typeof __DEV__ === 'undefined' || __DEV__) {
      window.__BG = this; // testler icin
      window.__goalTick = () => goalTick((kind, a) => this.goalNote(kind, a));
    }
    if (!S.save.flags.st105) { S.save.flags.st105 = 1; if (S.level('uretim') > 1 || (S.save.stats.placed || 0) > 0 || S.save.pets.length > 1) S.save.flags.stOld = 1; }
    this.goBase(false);
    UI.show('#loading', false);
    UI.feed(`Hoş geldin, ${S.save.char}! Evindesin. Köy Haritası için soldaki Köy yolu tabelasına ya da Köy Haritası düğmesine dokun.`);
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
      const [tex, fr0] = glemTex(this.gmeta, p.key, p.stage, p.shiny);
      const f = this.add.sprite(this.player.x - 24 - i * 22, GROUND_Y, tex, fr0)
        .setOrigin(meta.ax / meta.w, meta.ay / meta.h).setDepth(9 - i * 0.1).setScale(glemScale(this.gmeta, p.key, p.stage === 2 ? 0.8 : 1));
      f.play(k('durma'));
      attachGlemon(f, { key: p.key, stage: p.stage, shiny: !!p.shiny, k });
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
      } else if (f.anims.currentAnim.key !== f.k('durma') && f.anims.currentAnim.key !== f.k('huy')) {
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
    const an = accAnchor(this.gmeta, p.key, p.stage, meta);   // v2: yuzun alti (yaka), kafa kaymasini izler
    if (an) { img.fy = an.fy; img.fx = an.fx; }
    this.accs = this.accs || [];
    this.accs.push(img);
  }
  syncAccs() {
    if (!this.accs) return;
    this.accs = this.accs.filter((a) => {
      const h = a.host;
      if (!h.active) { a.destroy(); return false; }
      const sx = h.scaleX; const sy = h.scaleY;
      const [hx, hy] = glemHeadOffset(h);
      a.setPosition(h.x + (h.flipX ? a.fx - hx : -a.fx + hx) * sx, h.y - (a.fy - hy) * sy).setScale(sx, sy).setFlipX(h.flipX)
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
    const burning = gNow() < (S.save.fireUntil || 0);
    const left = burning ? Math.ceil((S.save.fireUntil - gNow()) / 60000) : 0;
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
    S.save.fireUntil = gNow() + FIRE.ms;
    sfx('smelt');
    UI.feed('Ateşe odun attın! 2 saat harlı yanacak. Bu sırada oyunu kapatırsan kamp ödülün %50 fazla olur.');
    if (this.fireSpr) this.tweens.add({ targets: this.fireSpr, scale: 1.3, duration: 400, ease: 'Back.easeOut' });
    this.applyTod();
    S.changed();
  }

  checkCamp() {
    const away = gNow() - (S.save.lastSeen || gNow());
    const fire = (S.save.fireUntil || 0) > (S.save.lastSeen || 0);
    S.save.lastSeen = gNow();
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
    const nightRun = this.mode === 'dungeon' && !this.inBattleView && this.isNight() && (this.zone() || {}).key !== 'magara';
    const ptint = outdoor ? TOD[this.tod].tint : nightRun ? TOD.gece.tint : 0xffffff;
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
    // 1.0.23: atolyede istasyonlar yan yana; sadece karakterin onundeki (en yakin) istasyonun yazisi gorunur
    {
      const fx = this.player.x + (this.player.flipX ? -14 : 14);
      let best = null; let bd = 30;
      for (const l of this.labels) if (l._prox) { const d = Math.abs(l._x - fx); if (d < bd) { bd = d; best = l; } }
      const t = gNow();
      for (const l of this.labels) {
        if (!l._prox) continue;
        const far = l !== best && !(l._flash > t);
        if (l._far !== far) { l._far = far; l.classList.toggle('far', far); }
      }
    }
    this.updateFollower(dt);
    this.updateRanch(dt);
    // uzun sure hareketsiz kalinca otur (1.0.14, Eren: savas, balik tutma ve maden disinda her yerde;
    // panel acikken de)
    const cur = this.player.anims.currentAnim && this.player.anims.currentAnim.key;
    if ((cur === 'c_idle' || cur === 'c_idlesway') && !this.busy && !this.battle && !this.inBattleView && this.mode !== 'mine') {
      this.stillMs += dt;
      if (this.stillMs > SIT_AFTER) { this.stillMs = 0; this.player.play('c_sit'); }
    } else if (cur !== 'c_sit') this.stillMs = 0;
    // 1.0.14: evdeki idle cok hafif (2 kare); arada bir sallanir ki karakter canli dursun
    if (cur === 'c_idle' && !this.busy) {
      this.idleVar = (this.idleVar || 0) + dt;
      if (this.idleVar > 5000 + Math.random() * 3000) {
        this.idleVar = 0;
        this.player.play('c_idlesway');
        this.time.delayedCall((animDur.c_idlesway || 1000) * 2, () => {
          const k = this.player.anims.currentAnim && this.player.anims.currentAnim.key;
          if (k === 'c_idlesway' && WALK_MODES.includes(this.mode) && !this.busy) this.player.play('c_idle');
        });
      }
    } else if (cur !== 'c_idlesway') this.idleVar = 0;
    // 1.0.14: bir animasyon bitip son karesinde takili kaldiysa beklemeye don
    if (cur && !this.player.anims.isPlaying && !this.busy && !this.battle && !this.inBattleView && !this.player._moveTween
      && cur !== 'c_sit' && !cur.startsWith('c_fish') && !cur.startsWith('c_b_') && this.player.visible && this.player.alpha > 0.5) {
      this.stuckMs = (this.stuckMs || 0) + dt;
      if (this.stuckMs > 600) { this.stuckMs = 0; this.idle(); }
    } else this.stuckMs = 0;
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
    // 1.0.15 (Eren): Canta profil kartinin hemen yaninda, ayni boyda
    const bagBox = UI.$('#hud-bag');
    bagBox.innerHTML = '';
    const bag = UI.button('', () => openBag(this), 'hud-bag-btn');
    bag.title = 'Çanta';
    bag.appendChild(UI.icon('dock_canta', 'ico'));
    bagBox.appendChild(bag);
    // B1: bekleyen ganimet kutusu (sadece bekleyen esya varken gorunur)
    this.lootBtn = UI.button('', () => this.claimLoot(), 'hud-bag-btn hud-loot-btn hidden');
    this.lootBtn.title = 'Bekleyen eşyalar';
    this.lootBtn.appendChild(UI.icon('sandik', 'ico'));
    this.lootBadge = UI.el('span', 'dock-badge', '');
    this.lootBtn.appendChild(this.lootBadge);
    bagBox.appendChild(this.lootBtn);
    item('dock_beceri', 'Beceriler', () => openSkills(this));
    this.questBtn = item('dock_gorev', 'Görevler', () => openQuests(this));
    this.questBadge = UI.el('span', 'dock-badge hidden', '');
    this.questBtn.appendChild(this.questBadge);
    item('dock_profil', 'Profil', () => openProfile(this));
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
    if (this.lootBtn) { const n = S.pendingCount(); this.lootBtn.classList.toggle('hidden', !n); this.lootBadge.textContent = n; }
    if (this.questBadge) { const n = readyCount(); this.questBadge.textContent = n; this.questBadge.classList.toggle('hidden', !n); }
    UI.$('#hud-hp').style.width = `${(S.hp / max) * 100}%`;
    UI.$('#hud-hp-text').textContent = `${S.hp} / ${max}`;
    UI.$('#hud-gold').innerHTML = `<span class="hud-coin" title="${CURRENCY}"><img class="ico-inline" src="${this.coinUrl}">${S.save.gold}</span>`;
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
        // 1.0.23 (Eren): dokunulan nesne kisa bir sure piksel kosebentlerle isaretlenir
        if (opts.sel !== false && obj.getBounds) { const b = obj.getBounds(); this.flashSel(b.x, b.y, b.width, b.height); }
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
      // G4 (1.0.19): evdeki istasyon yazilari sadece karakter yakindayken ya da dokununca gorunur
      if (opts.prox) { l._prox = true; l.classList.add('far'); obj.on('pointerdown', () => { l._flash = gNow() + 2500; }); }
      if (opts.lock) l.classList.add('lockl');
      if (opts.small) l.classList.add('st');
      l.style.left = UI.pctX(lx - (UI.view.x || 0));
      l.style.top = UI.pctY(opts.ly);
      UI.$('#floats').appendChild(l);
      this.labels.push(l);
    }
    return obj;
  }

  // 1.0.23 (Eren): acik hava atolyesi. Arkada alcak tahta duvar ve iki direk, ustte kutuk kirisi ve
  // kiremit sacak; duvara dayali silahlik, asili kalkan ve zirh askisi. Hepsi 16x16 bloklardan.
  buildWorkshop() {
    const G = GROUND_Y; const [x0, x1] = ATOLYE;
    const img = (x, y, k, d = 2.6, tint = null) => { const o = this.add.image(x, y, 'blocks', k).setOrigin(0, 1).setDepth(d); if (tint) o.setTint(tint); this.roomObjs.push(o); return o; };
    // zemin: kalaslar (patikanin ustunde ince tahta doseme)
    for (let x = x0; x < x1; x += 16) { const f = this.add.image(x, G, 'blocks', 'kalas').setOrigin(0, 0).setDepth(2.2).setCrop(0, 0, 16, 4).setTint(0xd8c8b0); this.roomObjs.push(f); }
    // arka duvar: 2 sira kalas, arkada kaldigi icin biraz koyu
    for (let x = x0 + 8; x < x1 - 8; x += 16) for (let r = 0; r < 2; r++) img(x, G - r * 16, 'kalas', 2.4, 0x9a8a78);
    // direkler (3 blok) ve kiris
    for (const x of [x0, x1 - 16]) for (let r = 0; r < 3; r++) img(x, G - r * 16, 'kutuk', 2.7);
    for (let x = x0; x < x1; x += 16) img(x, G - 48, 'kutuk', 2.7, 0xc8b8a0).setCrop(0, 10, 16, 6);
    // kiremit sacak
    img(x0 - 16, G - 50, 'kiremit_sol', 2.8);
    for (let x = x0; x < x1; x += 16) img(x, G - 50, 'kiremit', 2.8);
    img(x1, G - 50, 'kiremit_sag', 2.8);
    // duvara dayali silahlik, asili kalkan ve zirh askisi (sus)
    img(YX.silahlik - 8, G + 1, 'silahlik_alt', 3.5); img(YX.silahlik - 8, G - 15, 'silahlik_ust', 3.5);
    img(YX.zirh - 8, G + 1, 'zirh_alt', 3.5); img(YX.zirh - 8, G - 15, 'zirh_ust', 3.5);
    img(YX.firin + 4, G - 17, 'kalkan', 2.9);
    img(YX.masa - 8, G - 20, 'harita_sol', 2.9).setScale(0.75);
  }

  // 1.0.23 (Eren): secim isareti. Dort kosede sari piksel kosebent + hafif parlama, ~1 sn yanip soner.
  flashSel(x, y, w, h) {
    if (this.selG) { this.tweens.killTweensOf(this.selG); this.selG.destroy(); }
    x = Math.round(x) - 2; y = Math.round(y) - 2; w = Math.round(w) + 4; h = Math.round(h) + 4;
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0xfff4c0, 0.16).fillRect(x + 2, y + 2, w - 4, h - 4);
    const L = Math.max(3, Math.min(5, Math.floor(Math.min(w, h) / 3)));
    const corner = (cx, cy, dx, dy, col, o) => { // o = 1: koyu dis cizgi
      g.fillStyle(col, 1);
      g.fillRect((dx > 0 ? cx : cx - L + 2) - o, cy - o, L + o * 2, 2 + o * 2);
      g.fillRect(cx - o, (dy > 0 ? cy : cy - L + 2) - o, 2 + o * 2, L + o * 2);
    };
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w - 2, y, -1, 1], [x, y + h - 2, 1, -1], [x + w - 2, y + h - 2, -1, -1]]) corner(cx, cy, dx, dy, 0x2a1e14, 1);
    for (const [cx, cy, dx, dy] of [[x, y, 1, 1], [x + w - 2, y, -1, 1], [x, y + h - 2, 1, -1], [x + w - 2, y + h - 2, -1, -1]]) corner(cx, cy, dx, dy, 0xffd84a, 0);
    this.selG = g;
    this.tweens.add({ targets: g, alpha: 0.35, duration: 160, yoyo: true, repeat: 2, onComplete: () => {
      this.tweens.add({ targets: g, alpha: 0, duration: 250, onComplete: () => { g.destroy(); if (this.selG === g) this.selG = null; } });
    } });
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
    this.buildWorkshop();
    const station = (k, obj, label) => {
      const open = this.stationOpen(k);
      if (!open) obj.setAlpha(0.55);
      const x = obj.x;
      obj.setOrigin(0.5, 1).setDepth(4);
      // 1.0.23 (Eren): yazi kucuk ve istasyonun hemen ustunde
      return this.addObj(obj, {
        x: x - 16, face: false, label: open ? label : '🔒', lock: !open, prox: open, small: true, lx: x, ly: G - obj.displayHeight - 2,
        act: () => {
          if (!this.stationOpen(k)) { UI.feed(`${label}, Üretim ${STATION_LVL[k]} olunca açılır. (Üretim seviyen: ${S.level('uretim')})`); this.sulk(); return; }
          if (k === 'ors') openAnvil(this); else openStation(this, k);
        },
      });
    };
    // tabela: koy yolu (haritayi acar)
    const sign = this.add.image(YX.tabela, G + 1, 'blocks', 'tabela').setOrigin(0.5, 1).setDepth(4);
    this.addObj(sign, { x: YX.tabela + 14, face: true, label: 'Köy yolu', lx: YX.tabela, ly: G - 24, act: () => openVillageMap(this) });
    // kucuk kamp atesi
    const fire = this.add.sprite(YX.ates, G + 1, 'fire').setOrigin(0.5, 1).setDepth(4).setScale(0.8);
    fire.play('fire');
    fire.noTint = true;
    this.addObj(fire, { x: YX.ates + 18, face: true, label: 'Kamp ateşi', prox: true, lx: YX.ates, ly: G - 22, act: () => this.fireMenu() });
    this.fireSpr = fire;
    if (gNow() < (S.save.fireUntil || 0)) fire.setScale(1.05);
    station('masa', this.add.image(YX.masa, G + 1, 'workbench'), 'Üretim Masası');
    this.furnace = this.add.sprite(YX.firin, G + 1, 'furnace', 0);
    station('firin', this.furnace, 'Fırın');
    const caul = this.add.sprite(YX.kazan, G + 1, 'cauldron', 0);
    if (this.stationOpen('kazan')) caul.play('cauldron');
    station('kazan', caul, 'Simya Kazanı');
    station('yem', this.add.image(YX.yem, G + 1, 'feedtable'), 'Yem Tezgâhı');
    station('ors', this.add.image(YX.ors, G + 1, 'blocks', 'ors').setScale(1.4), 'Örs');
    this.addObj(this.add.image(YX.depo, G + 1, 'chest').setOrigin(0.5, 1).setDepth(4), { x: YX.depo - 16, face: false, label: 'Depo', prox: true, small: true, lx: YX.depo, ly: G - 16, act: () => openDepo(this) });
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
    openVillageMap(this);
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
    if (this.mode === 'pond') spots.push([POND.standX - 40, G - 30, 0.8]);
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
    // B1 (1.0.17): cantaya sigmayan Depo'ya, o da doluysa "bekleyen ganimet"e gider; hicbir esya kaybolmaz
    let left = S.addItem(id, n, 'bag', boost);
    let x = S.lastRoll;
    let depo = 0;
    if (left > 0) {
      const l2 = S.addItem(id, left, 'depo', boost);
      if (!x) x = S.lastRoll;
      depo = left - l2;
      if (depo && S.run) S.run.gained[id] = (S.run.gained[id] || 0) + depo;
      left = l2;
    }
    if (left > 0) {
      const stackable = it.kind === 'malzeme' || it.kind === 'tuketim';
      if (stackable) S.save.pendingLoot.push({ id, n: left });
      else for (let i = 0; i < left; i++) { const rx = boost > 0 ? S.rollX(id, boost) : null; S.save.pendingLoot.push(rx ? { id, n: 1, x: rx } : { id, n: 1 }); if (rx && !x) x = rx; }
    }
    const got = n;
    if (got > 0) {
      // 0.13.5: Nadir / Epik kalite cikinca adinin yaninda yazar
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
    if (depo > 0) UI.feed(`Çanta dolu, Lale depoya yolladı: ${UI.itemName(id, false)}${depo > 1 ? ` ×${depo}` : ''}.`);
    if (left > 0) UI.feed(`<span style="color:#ffb04d">Çanta ve Depo dolu! ${UI.itemName(id, false)}${left > 1 ? ` ×${left}` : ''} seni bekliyor. Yer aç, sonra çantanın yanındaki kutuya dokun.</span>`);
    S.changed();
    this.refreshHud();
  }

  // B1: bekleyen ganimeti al ("yer ac ve al")
  claimLoot() {
    const n = S.claimPending();
    const rest = S.pendingCount();
    if (n) { sfx('drop'); UI.feed(`Bekleyen ${n} eşya yerleşti.${rest ? ` ${rest} tanesi için hâlâ yer yok.` : ''}`); }
    if (rest) { UI.feed('Yer yok: çantadan ya da Depo\'dan bir şey sat, at ya da kullan. Sonra kutuya yeniden dokun.'); openBag(this); }
    this.refreshHud();
  }

  // M2 (1.0.19): ayni anda gelen seviyeler tek mesajda ("Saldiri 8, Can 6"), animasyon bir kez
  async levelUp(up) { return this.levelUps([up]); }
  async levelUps(list) {
    if (!list || !list.length) return;
    const by = {};
    for (const up of list) {
      const o = by[up.skill];
      const from = Math.min(o ? o.from : 99, up.from !== undefined ? up.from : up.level - 1);
      if (!o || up.level > o.level) by[up.skill] = { ...up, from }; else o.from = from;
    }
    for (const u of Object.values(by)) u.n = Math.max(1, u.level - u.from);
    const ups = Object.values(by);
    sfx('levelup');
    const nm = (up) => SKILLS.find((s) => s.key === up.skill).name;
    const extras = [];
    let banner = null;
    const real = ups.filter((u) => !u.virt);
    const virt = ups.filter((u) => u.virt);
    if (by.can && !by.can.virt) S.hp = Math.min(S.maxHp(), S.hp + 10 * by.can.n);
    if (virt.length) {
      UI.feed(`<span style="color:#ffd04d">✦ Sanal seviye: ${virt.map((u) => `${nm(u)} ${u.level}`).join(', ')}${virt.some((u) => u.level >= 120) ? ' · gerçek bir USTA oldun!' : ''}</span>`, 'gold');
    }
    if (real.length) {
      UI.bubble(this.player.x, GROUND_Y - 44, real.map((u) => `<b>${nm(u)}</b> ${u.level}`).join(' · '), 2600);
      UI.feed(`<span style="color:#ffd04d">★ Seviye: ${real.map((u) => `${nm(u)} ${u.level}`).join(', ')}</span>`, 'gold');
    } else if (virt.length) UI.bubble(this.player.x, GROUND_Y - 44, virt.map((u) => `<b>${nm(u)}</b> sanal ${u.level}`).join(' · '), 2600);
    const treeFree = {};
    for (const up of real) {
      const sk = SKILLS.find((s) => s.key === up.skill);
      // atlanan butun seviyelerdeki acilimlar (birden cok seviye atlanmis olabilir)
      const lvls = []; for (let l = up.from + 1; l <= up.level; l++) lvls.push(l);
      if (up.level === 99) {
        banner = [`${sk.name} 99!`, 'Pelerinin çantanda. Evindeki heykelin de parlıyor.', 3200];
        if (S.count99() === 1) extras.push('İlk 99\'un! Evinde altın bir heykelin dikildi. 99\'dan sonra XP birikir, sanal seviye 120\'ye kadar çıkar.');
      }
      const gear = Object.values(ITEMS).filter((it) => it.req && it.req[0] === up.skill && lvls.includes(it.req[1]));
      if (gear.length) extras.push(`Artık kuşanabilirsin: ${gear.map((it) => it.name).join(', ')}`);
      for (const [wt, al] of Object.entries(ABILITIES)) {
        if (WEAPON_SKILL[wt] !== up.skill) continue;
        for (const a of al) if (lvls.includes(a.lvl)) extras.push(`Yeni yetenek: ${a.name} (${{ yay: 'yay', kilic: 'kılıç', yumruk: 'yumruk', asa: 'asa' }[wt]})`);
      }
      // 0.13 sinif ve alt sinif Hanci Lale'de acilir
      if (CLASS_RULES.skills.includes(up.skill) && S.combatLevel() === up.level) {
        if (lvls.includes(CLASS_RULES.unlock) && !S.cls()) extras.push('Sınıf seçimi açıldı! Hancı Lale\'ye git.');
        if (lvls.includes(CLASS_RULES.sub) && S.cls() && !S.sub()) extras.push('Alt sınıf seçimi açıldı! Hancı Lale\'ye git.');
      }
      if (up.skill === 'bag' && lvls.some((l) => l % 2 === 0)) extras.push(`Evcil Glemonların artık ${S.petCap()}. seviyeye kadar büyüyebilir.`);
      if (up.skill === 'uretim') {
        const rs = RECIPES.filter((r) => lvls.includes(r.lvl));
        if (rs.length) extras.push(`Yeni tarifler: ${rs.map((r) => ITEMS[r.out].name).join(', ')}`);
      }
      if (up.skill === 'madencilik') {
        const os = Object.values(ORES).filter((o) => lvls.includes(o.req));
        if (os.length) extras.push(`Artık kazabilirsin: ${os.map((o) => o.name).join(', ')}`);
      }
      // her 10 seviye bir kilometre tasi (tek buyuk yazi)
      if (!banner && lvls.some((l) => l % 10 === 0)) banner = [`${sk.name} ${up.level}!`, 'Kilometre taşı', 2200];
      const br = Object.entries(TREE2).find(([, t]) => t.skills.includes(up.skill));
      if (br) { const free = S.treePoints(br[0]) - S.treeSpent(br[0]); if (free > 0) treeFree[br[1].name] = free; }
    }
    const tf = Object.entries(treeFree);
    if (tf.length) extras.push(`Yetenek puanı: ${tf.map(([n, f]) => `${n} ${f}`).join(', ')} (Beceriler → Yetenek Ağacı)`);
    if (extras.length) UI.feed(extras.join(' · '), 'gold');
    if (banner) UI.banner(banner[0], banner[1], banner[2], 'gold');
    if (!this.inBattleView && real.length) {
      await playAnim(this.player, 'c_levelup', 1);
      this.idle();
    }
    this.refreshHud();
  }
}

Object.assign(WorldScene.prototype, ShaftMixin, GroveMixin);
// K4 (1.0.21): sinif parcalarinin yontemleri sahneye eklenir (ayni isim iki yerde olamaz)
for (const P of [PlotPart, PondPart, DungeonPart]) {
  for (const k of Object.getOwnPropertyNames(P.prototype)) {
    if (k === 'constructor') continue;
    if (Object.prototype.hasOwnProperty.call(WorldScene.prototype, k)) throw new Error('K4: ayni yontem iki yerde: ' + k);
    Object.defineProperty(WorldScene.prototype, k, Object.getOwnPropertyDescriptor(P.prototype, k));
  }
}
