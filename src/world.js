// Ana sahne: us (ev, depo, harita, maden girisi) ve zindan odalari.
import {
  GAME_W, GROUND_Y, ITEMS, SKILLS, SPAWN_TABLE, SHINY_CHANCE, ROOM_WEIGHTS, CHEST_GEAR, CHEST_MATS,
} from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';
import { Battle } from './battle.js';
import { forestBackground, iconUrl } from './art.js';
import { openBag, openDepo, openSkills, openProfile, openMap } from './panels.js';

const PLAYER_HOME = 96;
const MINE_X = 330;

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
    this.playerHomeX = PLAYER_HOME;
    this.coinUrl = iconUrl('para');
    this.bg = this.add.image(0, 0, 'bg_base').setOrigin(0).setDepth(0);
    this.roomObjs = [];
    this.labels = [];
    this.pShadow = this.add.image(0, GROUND_Y + 1, 'shadow').setDepth(9);
    this.player = this.add.sprite(200, GROUND_Y, 'c_idle').setOrigin(32 / 67, 56 / 76).setDepth(10);
    this.player.play('c_idle');
    this.battle = null;
    this.busy = false;
    this.mode = 'base';
    this.walkTok = 0;
    this.input.on('pointerdown', (ptr, over) => this.onTap(ptr, over));
    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D');
    this.buildHud();
    S.onChange(() => this.refreshHud());
    window.__BG = this; // testler icin
    this.goBase(false);
    UI.show('#loading', false);
    UI.feed(`Hoş geldin, ${S.save.char}! Maden girişinden zindana inebilirsin.`);
  }

  update(time, dt) {
    this.pShadow.x = this.player.x;
    this.pShadow.setAlpha(this.player.alpha);
    if (this.battle && !UI.panelOpen()) this.battle.update(dt);
    if (this.mode === 'base' && !this.busy && !UI.panelOpen()) {
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
        this.player.play('c_idle');
      }
    }
  }

  // ------------------------------------------------------------ ust bilgi
  buildHud() {
    UI.show('#hud', true);
    const btns = UI.$('#hud-btns');
    btns.innerHTML = '';
    btns.appendChild(UI.button('Çanta', () => openBag(this), 'small'));
    btns.appendChild(UI.button('Beceriler', () => openSkills(this), 'small'));
    btns.appendChild(UI.button('Profil', () => openProfile(this), 'small'));
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
    UI.$('#hud-gold').innerHTML = `<img class="ico-inline" src="${this.coinUrl}">${S.save.gold} Bonk`;
  }

  say(text, ms = 3000) {
    UI.bubble(this.player.x, GROUND_Y - 42, UI.escapeHtml(text), ms);
  }

  // ------------------------------------------------------------ yurume
  onTap(ptr, over) {
    if (over && over.length) return;
    if (this.mode !== 'base' || this.busy || UI.panelOpen()) return;
    this.walkThen(Phaser.Math.Clamp(ptr.worldX, 12, GAME_W - 12), null);
  }

  async walkThen(x, fn) {
    const tok = ++this.walkTok;
    await moveTo(this.player, x, { speed: 80, anim: 'c_walk' });
    if (tok !== this.walkTok) return;
    this.player.play('c_idle');
    if (fn) fn();
  }

  // ------------------------------------------------------------ oda temizligi
  addObj(obj, opts = {}) {
    this.roomObjs.push(obj);
    if (opts.act) {
      obj.setInteractive({ useHandCursor: true });
      obj.on('pointerdown', () => {
        if (this.busy || UI.panelOpen() || this.mode !== 'base') return;
        this.walkThen(opts.x ?? obj.x, () => {
          if (opts.face !== undefined) this.player.setFlipX(opts.face);
          opts.act();
        });
      });
    }
    if (opts.label) {
      const l = UI.el('div', 'objlabel', opts.label);
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

  fade(out) {
    return new Promise((res) => {
      const cam = this.cameras.main;
      if (out) { cam.fadeOut(220, 10, 8, 16); cam.once('camerafadeoutcomplete', res); } else { cam.fadeIn(220, 10, 8, 16); cam.once('camerafadeincomplete', res); }
    });
  }

  // ------------------------------------------------------------ us
  goBase(fromDungeon) {
    this.mode = 'base';
    this.clearRoom();
    this.bg.setTexture('bg_base');
    const G = GROUND_Y;
    this.addObj(this.add.image(2, G + 3, 'cabin').setOrigin(0, 1).setDepth(3), {
      x: 70, label: 'Evin', lx: 54, ly: G - 84,
      act: () => this.say('Evini 0.3 sürümünde büyütüp döşeyebileceksin!'),
    });
    this.addObj(this.add.image(136, G + 1, 'chest').setOrigin(0.5, 1).setDepth(4), {
      x: 118, face: false, label: 'Depo', ly: G - 22, act: () => openDepo(this),
    });
    const fire = this.add.sprite(184, G + 2, 'fire').setOrigin(0.5, 1).setDepth(4);
    fire.play('fire');
    this.addObj(fire, {
      x: 166, face: false, label: 'Kamp ateşi', ly: G - 30,
      act: () => {
        this.player.play('c_sit');
        this.say('Kamp 0.3 sürümünde gelecek: sen yokken 2 saate kadar malzeme toplayacak.', 3600);
      },
    });
    this.addObj(this.add.image(240, G + 2, 'signpost').setOrigin(0.5, 1).setDepth(4), {
      x: 224, face: false, label: 'Harita', ly: G - 36, act: () => openMap(this),
    });
    this.addObj(this.add.image(MINE_X, G + 3, 'mine').setOrigin(0.5, 1).setDepth(3), {
      x: MINE_X, label: 'Zindan girişi', ly: G - 62, act: () => openMap(this),
    });
    this.player.setFlipX(false);
    this.player.x = fromDungeon ? MINE_X : 200;
    this.player.y = G;
    this.player.alpha = 1;
    this.player.play('c_idle');
    UI.setLocation('Üs');
    UI.setActions([
      { label: 'Zindana gir', cls: 'primary', onClick: () => openMap(this) },
      { label: 'Depo', onClick: () => openDepo(this) },
    ]);
    this.refreshHud();
  }

  async enterDungeon(floor) {
    UI.closePanel();
    if (this.busy) return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await moveTo(this.player, MINE_X, { speed: 95, anim: 'c_walk' });
    sfx('stairs');
    S.startRun(floor);
    S.hp = S.maxHp();
    this.mode = 'dungeon';
    await this.enterFloor(floor);
  }

  // ------------------------------------------------------------ zindan
  genRooms(f) {
    const n = 4 + Math.floor(f / 4);
    const rooms = [];
    let kamp = false;
    for (let i = 0; i < n - 1; i++) {
      let t = weighted(ROOM_WEIGHTS);
      if (i === 0 && (t === 'tuzak' || t === 'kamp')) t = 'savas';
      if (t === 'kamp') { if (kamp) t = 'savas'; kamp = true; }
      rooms.push({ type: t });
    }
    if (f === 5) rooms.push({ type: 'arapatron' });
    if (f === 10) {
      if (!kamp) rooms.push({ type: 'kamp' });
      rooms.push({ type: 'boss' });
    } else rooms.push({ type: 'merdiven' });
    return rooms;
  }

  enemyCount(f) {
    return pick(f <= 2 ? [1, 1, 2] : f <= 6 ? [1, 2, 2, 3] : [2, 2, 3]);
  }

  enemySpecs(n, extra = {}) {
    return Array.from({ length: n }, () => ({ key: weighted(SPAWN_TABLE), shiny: Math.random() < SHINY_CHANCE, ...extra }));
  }

  async enterFloor(f) {
    this.floor = f;
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
    const key = `bg_${this.floor}_${v}`;
    if (!this.textures.exists(key)) this.textures.addCanvas(key, forestBackground(this.floor, v));
    this.bg.setTexture(key);
    this.player.setFlipX(false);
    this.player.x = -20;
    this.player.y = GROUND_Y;
    this.player.alpha = 1;
    this.prepareRoom(room);
    UI.setLocation(`Yabani Orman · Kat ${this.floor} · Oda ${i + 1}/${this.rooms.length}`);
    await this.fade(false);
    if (i === 0) UI.banner(`Kat ${this.floor}`, 'Yabani Orman', 1600);
    await moveTo(this.player, PLAYER_HOME, { speed: 115, anim: 'c_walk', timeScale: 1.3 });
    this.player.play('c_idle');
    this.busy = false;
    this.runRoom(room);
  }

  prepareRoom(room) {
    const G = GROUND_Y;
    switch (room.type) {
      case 'savas':
        room.specs = room.specs || this.enemySpecs(this.enemyCount(this.floor));
        this.battle = new Battle(this, room.specs, { floor: this.floor });
        break;
      case 'arapatron':
        room.specs = room.specs || [{ key: weighted(SPAWN_TABLE.filter(([k]) => k !== 'yosunbaba')), golden: true }];
        this.battle = new Battle(this, room.specs, { floor: this.floor });
        break;
      case 'boss':
        this.battle = new Battle(this, [{ key: 'agacbasi' }], { floor: this.floor, boss: true });
        break;
      case 'uyuyan': {
        room.specs = room.specs || this.enemySpecs(Math.random() < 0.7 ? 1 : 2, { sleeping: true });
        this.battle = new Battle(this, room.specs, { floor: this.floor });
        room.zzz = this.battle.enemies.map((e) => UI.bubble(e.sprite.x + 6, this.battle.topY(e) - 2, 'Zzz', 9e8, 'zzz'));
        for (const z of room.zzz) this.labels.push(z);
        break;
      }
      case 'sandik':
        room.obj = this.addObj(this.add.image(250, G + 1, room.opened ? 'chest_open' : 'chest').setOrigin(0.5, 1).setDepth(4));
        break;
      case 'tuzak':
        room.obj = this.addObj(this.add.image(198, G + 2, 'spikes').setOrigin(0.5, 1).setDepth(4));
        break;
      case 'kamp': {
        const fire = this.add.sprite(200, G + 2, 'fire').setOrigin(0.5, 1).setDepth(4);
        fire.play('fire');
        room.obj = this.addObj(fire);
        break;
      }
      case 'merdiven':
        room.obj = this.addObj(this.add.image(300, G - 1, 'stairs').setOrigin(0.5, 0).setDepth(2));
        break;
      default:
        break;
    }
  }

  runRoom(room) {
    const back = { label: 'Üsse dön', onClick: () => this.returnBase() };
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
        UI.setActions([
          room.opened ? null : { label: 'Sandığı aç', cls: 'primary', onClick: () => this.openChest(room) },
          { label: 'İlerle →', onClick: () => this.nextRoom() },
          back,
        ]);
        break;
      case 'tuzak':
        UI.feed('Dikenli tuzak! Zıplamak için zamanlamayı tuttur.');
        UI.setActions([{ label: 'Zıpla!', cls: 'primary', onClick: () => this.trap(room) }, back]);
        break;
      case 'kamp':
        UI.setActions([
          room.rested ? null : { label: 'Ateşte dinlen (+%30 can)', cls: 'primary', onClick: () => this.rest(room) },
          { label: 'İlerle →', onClick: () => this.nextRoom() },
          back,
        ]);
        break;
      case 'merdiven':
        UI.setActions([{ label: `Aşağı in (Kat ${this.floor + 1})`, cls: 'primary', onClick: () => this.descend() }, back]);
        break;
      default:
        this.roomDone();
    }
  }

  roomDone() {
    UI.setActions([
      { label: 'İlerle →', cls: 'primary', onClick: () => this.nextRoom() },
      { label: 'Üsse dön', onClick: () => this.returnBase() },
    ]);
  }

  async nextRoom() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    this.player.setFlipX(false);
    await moveTo(this.player, GAME_W + 24, { speed: 170, anim: 'c_run' });
    this.enterRoom(this.roomIdx + 1);
  }

  // ------------------------------------------------------------ savas
  async fight(room) {
    this.busy = true;
    UI.setActions([]);
    if (room.type === 'boss') {
      UI.banner('AĞAÇBAŞI', "Yabani Orman'ın bekçisi", 2400, 'boss');
      sfx('roar');
      this.cameras.main.shake(500, 0.012);
      await wait(this, 1300);
    } else if (room.type === 'arapatron') {
      UI.banner('Ara Patron!', this.battle.enemies[0].name, 1800, 'gold');
      sfx('warn');
      await wait(this, 900);
    } else {
      playAnim(this.player, 'c_surprise', 2).then(() => this.player.play('c_idle'));
      await wait(this, 450);
    }
    const res = await this.battle.start();
    this.battle = null;
    this.busy = false;
    if (res === 'win') {
      if (room.type === 'boss') this.bossDefeated();
      else this.roomDone();
    } else if (res === 'lose') this.onDeath();
    else if (res === 'flee') this.afterFlee(room);
  }

  async afterFlee(room) {
    this.busy = true;
    if (room.type === 'uyuyan') {
      room.type = 'savas';
      room.specs = room.specs.map((s) => ({ ...s, sleeping: false }));
    }
    this.player.setFlipX(false);
    this.player.x = -24;
    this.prepareRoom(room);
    await moveTo(this.player, 50, { speed: 85, anim: 'c_walk' });
    this.player.play('c_idle');
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
          this.player.play('c_idle');
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
    this.player.play('c_idle');
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
    await playAnim(this.player, 'c_ninjadash', 1);
    this.player.play('c_idle');
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
    this.player.play('c_idle');
    const f = this.floor;
    const gold = f * 8 + Math.floor(Math.random() * (f * 4 + 4));
    S.addGold(gold);
    UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Sandıktan ${gold} Bonk çıktı!`);
    sfx('coin');
    if (Math.random() < 0.6) this.giveDrop('iksir_k', 1, 'Sandıktan');
    if (Math.random() < 0.18) this.giveDrop(weighted(CHEST_GEAR), 1, 'Sandıktan');
    if (Math.random() < 0.3) this.giveDrop(pick(CHEST_MATS), 1 + Math.floor(Math.random() * 3), 'Sandıktan');
    S.changed();
    this.busy = false;
    this.roomDone();
  }

  async trap(room) {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    await moveTo(this.player, 160, { speed: 75, anim: 'c_walk' });
    this.player.play('c_idle');
    const grade = await UI.timingBar('ZIPLA!', 'Sarı ya da maviye denk getir');
    const p = this.player;
    if (grade !== 'zayif') {
      sfx('jump');
      UI.floatText(p.x, GROUND_Y - 44, grade === 'mukemmel' ? 'Kusursuz atlayış!' : 'Atladın!', 'good');
      p.play({ key: 'c_jump', timeScale: 1.3 });
      this.tweens.add({ targets: p, y: GROUND_Y - 26, duration: 320, yoyo: true, ease: 'Sine.easeOut' });
      await moveTo(p, 240, { speed: 125, ease: 'Linear' });
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
    p.play('c_idle');
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
    this.player.play('c_idle');
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
    this.enterFloor(this.floor + 1);
  }

  async bossDefeated() {
    this.busy = true;
    S.logDrop(null, 'Ağaçbaşı', { note: 'yenildi! Yabani Orman temizlendi' });
    S.changed();
    UI.banner('Yabani Orman temizlendi!', 'Yeni bölgeler 0.5 sürümünde açılacak', 3500, 'gold');
    sfx('rare');
    await playAnim(this.player, 'c_joy', 1);
    await playAnim(this.player, 'c_joy', 1);
    this.player.play('c_idle');
    this.busy = false;
    UI.setActions([{ label: 'Üsse dön', cls: 'primary', onClick: () => this.returnBase() }]);
  }

  // ------------------------------------------------------------ donus ve bayilma
  async returnBase() {
    if (this.busy) return;
    this.busy = true;
    UI.setActions([]);
    sfx('vanish');
    await playAnim(this.player, 'c_vanish', 1.6);
    this.player.alpha = 0;
    await this.fade(true);
    S.endRun();
    this.goBase(true);
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
      if (res.gold > 0) { const li = UI.el('li'); li.innerHTML = `<img class="ico-inline" src="${this.coinUrl}">${res.gold} Bonk`; ul.appendChild(li); }
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
    this.goBase(true);
    await this.fade(false);
    this.busy = false;
  }

  // ------------------------------------------------------------ ganimet ve seviye
  giveDrop(id, n, from) {
    const it = ITEMS[id];
    const left = S.addItem(id, n);
    const got = n - left;
    if (got > 0) {
      const special = it.rarity !== 'siradan' || !['malzeme', 'tuketim'].includes(it.kind);
      const cls = it.rarity === 'nadir' ? 'rare' : it.rarity === 'epik' ? 'epic' : it.rarity === 'efsanevi' ? 'gold' : '';
      const text = `${UI.escapeHtml(from)} ${UI.itemName(id)}${got > 1 ? ` ×${got}` : ''} düştü!`;
      UI.feed(`<img class="ico-inline" src="${iconUrl(it.icon)}">${text}`, cls);
      if (special) {
        sfx('rare');
        UI.bubble(this.player.x, GROUND_Y - 44, text, 3200);
        S.logDrop(id, from);
        playAnim(this.player, 'c_cheer', 1.2).then(() => { if (!this.battle || this.battle.over) this.player.play('c_idle'); });
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
    if (up.skill === 'saldiri' && up.level === 5) UI.feed('Artık Diken Kılıcı kuşanabilirsin.');
    if (up.skill === 'saldiri' && up.level === 20) UI.feed('Yeni yetenek: Döner Kesik! (tüm düşmanlara vurur)', 'gold');
    if (up.skill === 'savunma' && up.level === 8) UI.feed('Artık Kabuk Zırh giyebilirsin.');
    await playAnim(this.player, 'c_levelup', 1);
    this.player.play('c_idle');
    this.refreshHud();
  }
}
