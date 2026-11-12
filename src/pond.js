// K4 (1.0.21): evdeki gol (balik tutma) world.js'ten ayrildi. Davranis ayni.
import { GAME_W, GROUND_Y, ITEMS, GLEMONS, ORES, mineXpMult, CURRENCY, stormNow, FISH, WATERS, fishXp, NAMES } from './data.js';
import { castOnce, chestLoot, cycleBait, baitLabel } from './fishing.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx, stopMusic } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';
import { Battle } from './battle.js';
import { todNow, POND, pondOverlay, bobber } from './art.js';
import { shinyMastery } from './pets.js';
import { pick } from './wconst.js';

export class PondPart {
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
    if (!S.save.fishing.total) UI.feed('Göl! "Olta at" de, şamandıra batınca dokun, sonra yeşil kutuyla balığı yakala.');
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
    UI.setLocation(NAMES.gol);
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
      await this.levelUps(ups);
      await this.waterFight(out.glemon, room);
      return;
    }
    S.changed();
    await this.levelUps(ups);
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
    await this.levelUps(ups);
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
}
