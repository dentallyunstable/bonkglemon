// Ana sahne: us (ev, depo, harita, maden girisi) ve zindan odalari.
import {
  GAME_W, GROUND_Y, ITEMS, SKILLS, SPAWN_TABLE, SHINY_CHANCE, ROOM_WEIGHTS, CHEST_GEAR, CHEST_MATS,
  ORES, MINE_COLS, MINE_ROWS, DEFINE_CHANCE, oreWeights, mineXpMult, mineHardBonus,
  GATHER, BAL_CHANCE, GATHER_CHANCE, RECIPES,
} from './data.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';
import { Battle } from './battle.js';
import { forestBackground, caveBackground, iconUrl, MINE_WALL } from './art.js';
import { openBag, openDepo, openSkills, openProfile, openMap, openStation, furnaceState } from './panels.js';

const PLAYER_HOME = 96;
const MINE_X = 330;
const CABIN_DOOR_X = 70;
const WALK_MODES = ['base', 'house'];
const MINE_STAND_X = MINE_WALL.x - 14;

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
    UI.feed(`Hoş geldin, ${S.save.char}! Zindana inebilir, madende kazabilir ya da evinde üretim yapabilirsin.`);
  }

  update(time, dt) {
    this.pShadow.x = this.player.x;
    this.pShadow.setAlpha(this.player.alpha);
    if (this.battle && !UI.panelOpen()) this.battle.update(dt);
    if (this.mode === 'house' && this.furnace) {
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
        this.player.play('c_idle');
      }
    }
  }

  canWalk() { return WALK_MODES.includes(this.mode); }

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
    if (!this.canWalk() || this.busy || UI.panelOpen()) return;
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
  goBase(from) {
    this.mode = 'base';
    this.clearRoom();
    this.bg.setTexture('bg_base');
    const G = GROUND_Y;
    this.addObj(this.add.image(2, G + 3, 'cabin').setOrigin(0, 1).setDepth(3), {
      x: CABIN_DOOR_X, label: 'Evin', lx: 54, ly: G - 84,
      act: () => this.enterHouse(),
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
    this.player.x = from === 'dungeon' ? MINE_X : from === 'house' ? CABIN_DOOR_X : 200;
    this.player.y = G;
    this.player.alpha = 1;
    this.player.play('c_idle');
    UI.setLocation('Üs');
    UI.setActions([
      { label: 'Zindana gir', cls: 'primary', onClick: () => openMap(this) },
      { label: 'Maden Ocağı', cls: 'blue', onClick: () => this.enterMine(S.save.mine.depth) },
      { label: 'Evine gir', onClick: () => this.enterHouse() },
      { label: 'Depo', onClick: () => openDepo(this) },
    ]);
    this.refreshHud();
    const fs = furnaceState();
    if (fs.ready > 0) UI.feed(`Fırında ${fs.ready} ${ITEMS[fs.out].name} hazır! Evine girip alabilirsin.`);
  }

  async enterHouse() {
    if (this.busy || this.mode !== 'base') return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await moveTo(this.player, CABIN_DOOR_X, { speed: 95, anim: 'c_walk' });
    await this.fade(true);
    this.goHouse();
    await this.fade(false);
    this.busy = false;
  }

  async leaveHouse() {
    if (this.busy || this.mode !== 'house') return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await moveTo(this.player, 26, { speed: 95, anim: 'c_walk' });
    await this.fade(true);
    this.goBase('house');
    await this.fade(false);
    this.busy = false;
  }

  // ------------------------------------------------------------ ev ici (uretim istasyonlari)
  goHouse() {
    this.mode = 'house';
    this.clearRoom();
    this.bg.setTexture('house');
    const G = GROUND_Y;
    this.addObj(this.add.image(26, G + 1, 'door_in').setOrigin(0.5, 1).setDepth(3), {
      x: 30, label: 'Dışarı', ly: G - 52, act: () => this.leaveHouse(),
    });
    this.addObj(this.add.image(112, G + 1, 'workbench').setOrigin(0.5, 1).setDepth(4), {
      x: 88, face: false, label: 'Üretim Masası', ly: G - 30, act: () => openStation(this, 'masa'),
    });
    this.furnace = this.add.sprite(196, G + 1, 'furnace', 0).setOrigin(0.5, 1).setDepth(4);
    this.addObj(this.furnace, {
      x: 174, face: false, label: 'Fırın', ly: G - 54, act: () => openStation(this, 'firin'),
    });
    const caul = this.add.sprite(262, G + 1, 'cauldron', 0).setOrigin(0.5, 1).setDepth(4);
    caul.play('cauldron');
    this.addObj(caul, {
      x: 242, face: false, label: 'Simya Kazanı', ly: G - 34, act: () => openStation(this, 'kazan'),
    });
    this.addObj(this.add.image(336, G + 1, 'bed').setOrigin(0.5, 1).setDepth(4), {
      x: 308, face: false, label: 'Yatak', ly: G - 26,
      act: () => { this.player.play('c_sit'); this.say('Yatak 0.3 sürümünde işe yarayacak: bayılınca burada uyanacaksın.', 3400); },
    });
    this.refreshFurnace();
    this.player.setFlipX(false);
    this.player.x = 30;
    this.player.y = G;
    this.player.alpha = 1;
    this.player.play('c_idle');
    UI.setLocation('Evin');
    UI.setActions([
      { label: 'Üretim Masası', cls: 'primary', onClick: () => this.walkThen(88, () => openStation(this, 'masa')) },
      { label: 'Fırın', cls: 'primary', onClick: () => this.walkThen(174, () => openStation(this, 'firin')) },
      { label: 'Simya Kazanı', cls: 'purple', onClick: () => this.walkThen(242, () => openStation(this, 'kazan')) },
      { label: 'Dışarı çık', onClick: () => this.leaveHouse() },
    ]);
    this.refreshHud();
  }

  refreshFurnace() {
    if (!this.furnace || !this.furnace.active) { this.furnace = null; return; }
    const on = furnaceState().working;
    if (on && !this.furnace.anims.isPlaying) this.furnace.play('furnace_on');
    if (!on && this.furnace.anims.isPlaying) { this.furnace.stop(); this.furnace.setFrame(0); }
  }

  // ------------------------------------------------------------ maden ocagi
  async enterMine(depth) {
    UI.closePanel();
    if (this.busy || this.mode !== 'base') return;
    this.busy = true;
    this.walkTok++;
    UI.setActions([]);
    await moveTo(this.player, 240, { speed: 95, anim: 'c_walk' });
    sfx('stairs');
    await this.fade(true);
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
    this.player.y = GROUND_Y;
    this.player.alpha = 1;
    this.player.play('c_idle');
    UI.setLocation(`Maden Ocağı · Derinlik ${depth}`);
    this.mineActions();
  }

  buildWall(depth) {
    const W = MINE_WALL;
    const weights = oreWeights(depth);
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
        if ((k === 'komur' || k === 'demir') && Math.random() < 0.35) {
          const [dr, dc] = pick([[0, 1], [1, 0], [0, -1], [-1, 0]]);
          const rr = r + dr; const cc = c + dc;
          if (rr >= 0 && rr < MINE_ROWS && cc >= 0 && cc < MINE_COLS) grid[rr][cc] = k;
        }
        if (Math.random() < DEFINE_CHANCE) grid[r][c] = 'define';
      }
    }
    this.wall = [];
    for (let r = 0; r < MINE_ROWS; r++) {
      const row = [];
      for (let c = 0; c < MINE_COLS; c++) {
        const kind = grid[r][c];
        const x = W.x + c * W.size + W.size / 2;
        const y = GROUND_Y - (MINE_ROWS - r) * W.size + W.size / 2;
        const spr = this.add.image(x, y, 'ores', kind).setDepth(5);
        spr.setInteractive({ useHandCursor: true });
        const b = { r, c, kind, hits: 0, spr, crack: null };
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
    if (this.mode === 'mine' && !this.isExposed(b)) { UI.floatText(b.spr.x, by, 'Önce yanını kaz', 'note'); return; }
    if (this.bombArmed && this.mode === 'mine') { this.useBomb(b); return; }
    if (!S.pick()) { UI.feed('Kazma kuşanmadan kazamazsın. (Çanta → Kazma)'); return; }
    if (S.level('madencilik') < ore.req) { UI.floatText(b.spr.x, by, `Madencilik ${ore.req} gerekli`, 'note'); sfx('weak'); return; }
    if (ore.drop && !S.fits(ore.drop)) { UI.floatText(b.spr.x, by, 'Çanta dolu!', 'note'); return; }
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
    const need = Math.max(1, Math.ceil((ORES[b.kind].hard + (this.mode === 'mine' ? mineHardBonus(depth) : 0)) / S.pick()));
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
    p.play('c_idle');
    this.busy = false;
    if (this.mode === 'mine') this.mineActions();
    else if (this.mode === 'dungeon' && this.afterVein) this.afterVein();
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
    if (kind === 'define') {
      const gold = 20 + Math.floor(Math.random() * 30 * depth);
      S.addGold(gold);
      sfx('rare');
      S.logDrop(null, 'Define sandığı', { note: `buldun! +${gold} Bonk` });
      UI.feed(`<img class="ico-inline" src="${this.coinUrl}">Define sandığı! +${gold} Bonk`, 'gold');
      for (let i = 0; i < 2; i++) this.giveDrop(pick(['komur', 'demir_cevheri', 'sifali_ot', 'kum']), 1 + Math.floor(Math.random() * 3), 'Defineden');
    }
    UI.floatText(b.spr.x, b.spr.y - 16, `+${xp} XP`, 'good');
    const ups = S.addXp({ madencilik: xp });
    S.changed();
    for (const u of ups) await this.levelUp(u);
  }

  chips(x, y, kind, n) {
    const tint = { toprak: 0xa07150, kum: 0xe6cd88, tas: 0x9e9aa6, komur: 0x3a3642, demir: 0xe0a882, define: 0xffd04d }[kind] || 0x9e9aa6;
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
    p.play('c_idle');
    this.busy = false;
    this.mineActions();
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
      case 'maden': {
        if (!room.vein) {
          const w = [['tas', 55], ['komur', 35], ['demir', this.floor >= 4 ? 18 : 0]];
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
      room.node = ok && Math.random() < GATHER_CHANCE ? weighted(Object.entries(GATHER).map(([k, g]) => [k, g.w])) : null;
      room.nodeX = 146 + Math.floor(Math.random() * 40);
    }
    if (room.node && !room.gathered) {
      const g = GATHER[room.node];
      room.nodeSpr = this.addObj(this.add.image(room.nodeX, G + 2, `node_${g.node}`).setOrigin(0.5, 1).setDepth(3), {
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
    const next = { label: 'İlerle →', cls: room.type === 'sandik' || room.type === 'kamp' || room.type === 'maden' ? '' : 'primary', onClick: () => this.nextRoom() };
    const g = this.gatherAction(room);
    if (room.type === 'sandik') {
      UI.setActions([room.opened ? null : { label: 'Sandığı aç', cls: 'primary', onClick: () => this.openChest(room) }, next, g, back]);
    } else if (room.type === 'kamp') {
      UI.setActions([room.rested ? null : { label: 'Ateşte dinlen (+%30 can)', cls: 'primary', onClick: () => this.rest(room) }, next, g, back]);
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
    if (!S.fits(room.node)) { UI.feed('Çanta dolu!'); return; }
    this.busy = true;
    UI.setActions([]);
    const p = this.player;
    await moveTo(p, room.nodeX - 14, { speed: 100, anim: 'c_walk' });
    p.setFlipX(false);
    await playAnim(p, 'c_placeblock', 2.4);
    sfx('gather');
    const n = 1 + Math.floor(S.level('toplama') / 10) + (Math.random() < 0.3 ? 1 : 0);
    this.giveDrop(room.node, n, 'Topladın:', true);
    if (Math.random() < BAL_CHANCE) this.giveDrop('bal', 1, 'Bir arı kovanı! Topladın:', true);
    room.gathered = true;
    S.save.stats.gathered++;
    if (room.nodeSpr) this.tweens.add({ targets: room.nodeSpr, alpha: 0, y: room.nodeSpr.y + 4, duration: 300 });
    const xp = Math.round(g.xp * (1 + 0.1 * (this.floor - 1)));
    UI.floatText(p.x, GROUND_Y - 44, `+${xp} Toplama XP`, 'good');
    const ups = S.addXp({ toplama: xp });
    S.changed();
    for (const u of ups) await this.levelUp(u);
    p.play('c_idle');
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
        UI.setActions([{ label: `Aşağı in (Kat ${this.floor + 1})`, cls: 'primary', onClick: () => this.descend() }, back]);
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
    this.goBase('dungeon');
    await this.fade(false);
    this.busy = false;
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
    const gear = Object.values(ITEMS).filter((it) => it.req && it.req[0] === up.skill && it.req[1] === up.level);
    if (gear.length) UI.feed(`Artık kuşanabilirsin: ${gear.map((it) => it.name).join(', ')}`);
    if (up.skill === 'saldiri' && up.level === 20) UI.feed('Yeni yetenek: Döner Kesik! (tüm düşmanlara vurur)', 'gold');
    if (up.skill === 'uretim') {
      const rs = RECIPES.filter((r) => r.lvl === up.level);
      if (rs.length) UI.feed(`Yeni tarifler: ${rs.map((r) => ITEMS[r.out].name).join(', ')}`);
    }
    if (up.skill === 'madencilik') {
      const os = Object.values(ORES).filter((o) => o.req === up.level);
      if (os.length) UI.feed(`Artık kazabilirsin: ${os.map((o) => o.name).join(', ')}`);
    }
    await playAnim(this.player, 'c_levelup', 1);
    this.player.play('c_idle');
    this.refreshHud();
  }
}
