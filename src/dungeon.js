// K4 (1.0.21): Kesif ve Zindan odalari, Kule, zor mod, savas, donus ve bayilma world.js'ten ayrildi. Davranis ayni.
import { GAME_W, GROUND_Y, ITEMS, ROOM_WEIGHTS, CHEST_GEAR, GLEMONS, ZONES, zoneOf, ZONE_SPAWNS, ZONE_GATHER, ZONE_CHEST, wildStageChances, GATHER, BAL_CHANCE, GATHER_CHANCE, CURRENCY, SEED_CHANCE, SECRETS, WATERS, AY_OTU_CHANCE, NIGHT, NIGHT_SPAWNS, KULE, KULE_RULES, HARD, HARD_DROPS } from './data.js';
import { cycleBait, baitLabel } from './fishing.js';
import { S } from './state.js';
import * as UI from './ui.js';
import { sfx, playMusic, stopMusic, SYNTH_KEYS } from './audio.js';
import { playAnim, moveTo, wait } from './anim.js';
import { Battle, BPOS } from './battle.js';
import { TOD, todNow, battleStage, indoorStage, kuleRoomBackground, kuleStage, caveRoomBackground, dungeonRoomBackground, sceneRoom, sceneStage, SCENE_ZONES, caveStage, POND } from './art.js';
import { openPrep, openCredits } from './panels.js';
import { shinyMastery } from './pets.js';
import { fullMoon, todayRule, PUL, clockOk, dayNum, weekNum, addPul } from './goals.js';
import { now as gNow } from './clock.js';
import { glemPreload } from './glemon2.js';
import { PLAYER_HOME, weighted, pick } from './wconst.js';

export class DungeonPart {
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
    // 1.0.22 (Eren): patron kontrol noktasindan gelince sadece patron odasi
    const bossStart = this.bossStart; this.bossStart = false;
    if (bossStart && zf === 10) return [{ type: 'boss' }];
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
    // D3 (1.0.18): Orman'in ilk 3 katinda her katta bir kamp atesi odasi garanti
    if (zone.key === 'orman' && zf <= 3 && !kamp) { rooms.splice(Math.max(1, rooms.length - 1), 0, { type: 'kamp', dark: false }); kamp = true; }
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
    // Plan v2 tembel yukleme: bolgenin Glemonlarini ve patronunu arka planda yukle (ilk savasa hazir olsun)
    try {
      const z = zoneOf(f);
      const list = (ZONE_SPAWNS[z.key] || []).flatMap(([k]) => [0, 1, 2].map((s) => [k, s, false]));
      if (z.boss) list.push([z.boss, 0, false]);
      glemPreload(this, list.filter(([k, s]) => this.gmeta[k] && this.gmeta[k].stages[s]));
    } catch (err) { /* yukleme yalniz hizlandirir */ }
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
    // B2 (1.0.20): gece Kesfi'nde gece goku
    const nightSky = this.isNight() && zone.key !== 'magara' ? 'gece' : null;
    const key = zin ? `${kule ? 'kbg' : 'zbg'}_${Math.min(this.zLevel, 40)}_${v}` : `bg_${this.floor}_${v}${room.dark ? '_d' : ''}${nightSky ? '_n' : ''}`;
    this.roomBg = null;
    this.bgTex(key, () => (kule ? kuleRoomBackground(Math.min(this.zLevel, 40), v) : zin ? dungeonRoomBackground(Math.min(this.zLevel, 40), v) : zone.key === 'magara' ? caveRoomBackground(this.floor, v, !!room.dark)
      : sceneRoom(SCENE_ZONES.includes(zone.key) ? zone.key : 'orman', this.floor, v, { tod: nightSky })));
    this.bg.setTexture(key);
    this.player.setFlipX(false);
    this.player.x = -20;
    this.placeFollowers(-48);
    this.resetPlayer();
    this.prepareRoom(room);
    // B2: gece oda nesneleri evdeki gibi gece tonunda
    if (nightSky) for (const o of this.roomObjs) if (o.active && o.setTint && !o.noTint) o.setTint(TOD.gece.tint);
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
  cold() { return this.zone().key === 'buz' && !this.inZindan() && gNow() >= (S.save.warmUntil || 0); }
  // 0.11: corba, iksir ve matara artik kendiliginden icilmez; Hazirlik ekranindan (ya da cantadan) icilir
  async coldCheck() {
    if (gNow() < (S.save.warmUntil || 0)) return;
    if (!this.toldCold) { this.toldCold = true; UI.feed(S.countItem('sicak_corba') || S.countItem('balik_corbasi') ? 'Üşüyorsun! Çantandan Sıcak Çorba iç (Çanta → Ye), yoksa savaşlarda yavaşlarsın.' : 'Donmuş Zirve çok soğuk! Sıcak Çorba içmezsen savaşlarda yavaşlarsın. (Mutfak ya da Hancı Lale)'); }
  }
  // 0.8 Kor Diyari: ates direnci yoksa savaslara yanarak baslarsin
  burning() { return this.zone().key === 'kor' && !this.inZindan() && gNow() >= (S.save.fireResUntil || 0) && !S.fireproof(); }
  async lavaCheck() {
    if (gNow() < (S.save.fireResUntil || 0) || S.fireproof()) return;
    if (!this.toldLava) { this.toldLava = true; UI.feed(S.countItem('ates_iksiri') ? 'Lav yakıyor! Çantandan Ateş Direnci İksiri iç, yoksa savaşlara yanarak başlarsın.' : 'Kor Diyarı yakıyor! Ateş Direnci İksiri yoksa savaşlara yanarak başlarsın. (Simya Kazanı ya da Hancı Lale)'); }
  }
  battleOpts(room) { return { floor: this.floor, dark: this.unlit(room), cold: this.cold(), burn: this.burning(), night: this.isNight(), kadim: !!(S.run && S.run.kadim && !this.inZindan()) }; }
  // 0.11 gece tehlikesi: sadece Kesifte (Zindan ve etkinlikler haric), gercek saatle gece
  isNight() { return this.mode === 'dungeon' && !this.inZindan() && !(S.run && S.run.ev) && todNow() === 'gece'; }

  // Kesife cikmadan once Hazirlik ekrani
  prepDungeon(floor, opts) { openPrep(this, floor, opts); }

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
    if (gNow() < (S.save.waterUntil || 0)) return;
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
        // 1.0.22 (Eren): patrona ulasinca kontrol noktasi acilir (bayilirsan 5 kat geriden degil, patrondan baslarsin)
        if (!(S.save.bossCp || {})[zoneOf(this.floor).key]) {
          S.save.bossCp = { ...(S.save.bossCp || {}), [zoneOf(this.floor).key]: 1 };
          UI.feed(`<span style="color:#ffd04d">Patron kontrol noktası açıldı! Bayılırsan Keşif'ten "Patron" düğmesiyle doğrudan buraya dönebilirsin.</span>`, 'gold');
          S.changed();
        }
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
    await this.levelUps(ups);
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
    // B6 (1.0.17): savas nesnesi en basta saklanir; beklerken baska bir akis (eve donus, oda degisimi)
    // savasi kaldirirsa sessizce cikilir (eskiden "null.start" hatasi veriyordu)
    const bt = this.battle;
    if (!bt) return;
    const gone = () => this.battle !== bt;
    this.busy = true;
    UI.setActions([]);
    if (room.type === 'boss' || room.type === 'evboss') {
      const z = room.type === 'evboss' ? zoneOf(room.fl) : zoneOf(this.floor);
      UI.banner(GLEMONS[room.key || z.boss].name.toLocaleUpperCase('tr'), `${z.name} bekçisi`, 2400, 'boss');
      sfx('roar');
      this.cameras.main.shake(500, 0.012);
      await wait(this, 1300);
    } else if (room.type === 'arapatron') {
      UI.banner('Ara Patron!', bt.enemies[0].name, 1800, 'gold');
      sfx('warn');
      await wait(this, 900);
    } else {
      await wait(this, 300);
    }
    if (gone()) { this.busy = false; return; }
    await this.enterBattleView();
    if (gone()) { if (this.inBattleView) await this.exitBattleView(false); this.busy = false; return; }
    const res = await bt.start();
    if (this.battle === bt) this.battle = null;
    if (this.inBattleView) await this.exitBattleView(res !== 'lose');
    this.busy = false;
    // 0.13.5 patron gunlugu: kac kez, en hizli sure (zor mod ayri)
    if (res === 'win' && bt && bt.bossWin) S.bossWin(bt.bossWin, !!room.hard, gNow() - bt.t0);
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
    const bt = this.battle; // B6: gecis sirasinda savas kalkarsa yarim kalan gecisi geri al
    cam.flash(120, 255, 255, 255);
    await wait(this, 120);
    await this.fade(true);
    if (!bt || this.battle !== bt) {
      this.inBattleView = false;
      UI.$('#ui').classList.remove('fighting');
      S.setFight(false);
      await this.fade(false);
      return;
    }
    this.roomBg = this.bg.texture.key;
    // 0.8.9: savas odanin kendi manzarasinda, iki cimen tumsegi ustunde gecer
    // 1.1: Zindan/Kule ve Magara savaslari kendi kapali mekan sahnesinde (kemerler, mesaleler, perspektifli zemin)
    const indoor = this.mode !== 'dungeon' ? null : this.inZindan() ? (S.run && S.run.kule ? 'kule' : 'zindan') : (this.zone() || {}).key === 'magara' ? 'magara' : null;
    const lv = this.inZindan() ? this.zLevel || 1 : this.floor;
    // 1.0.12: Kesif savaslari kendi perspektifli acik hava sahnesinde
    const zk = this.mode === 'dungeon' && !indoor ? (this.zone() || {}).key : null;
    const outdoor = zk && SCENE_ZONES.includes(zk) ? zk : null;
    const ntod = outdoor && this.isNight() ? 'gece' : null; // B2: savas sahnesi de ayni kurali kullanir
    const key = indoor ? `stage_in_${indoor}_${lv % 6}` : outdoor ? `stage_out_${outdoor}_${lv}${ntod ? '_n' : ''}` : `stage_${this.roomBg}`;
    this.bgTex(key, () => battleStage(indoor === 'kule' ? kuleStage(lv % 6, lv % 3) : indoor === 'magara' ? caveStage(lv % 6, lv % 3) : indoor ? indoorStage(indoor, lv % 6, lv % 3) : outdoor ? sceneStage(outdoor, lv, lv % 3, ntod) : this.textures.get(this.roomBg).getSourceImage()));
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

  // K5 (1.0.19): uzun akislarin basinda mod, oda ve savas saklanir; her await sonrasi
  // degistiyse (oyuncu bayildi, eve dondu, baska odaya gecti) akis sessizce biter.
  flowTok() { return { mode: this.mode, room: this.roomIdx, battle: this.battle }; }
  flowGone(t) { return this.mode !== t.mode || this.roomIdx !== t.room || this.battle !== t.battle; }

  async sneak(room) {
    if (this.busy) return;
    this.busy = true;
    const t = this.flowTok();
    UI.setActions([]);
    await moveTo(this.player, 186, { speed: 34, anim: 'c_sneakwalk' });
    if (this.flowGone(t)) return;
    if (Math.random() < 0.6) {
      await moveTo(this.player, GAME_W + 24, { speed: 40, anim: 'c_sneakwalk' });
      if (this.flowGone(t)) return;
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
    if (this.flowGone(t)) return;
    await moveTo(this.player, PLAYER_HOME, { speed: 140, anim: 'c_run' });
    if (this.flowGone(t) || !this.battle) return;
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
    const t = this.flowTok();
    for (const z of room.zzz || []) z.remove();
    // uyuyan Glemon'a ninja kosusuyla atilir
    await moveTo(this.player, PLAYER_HOME + 60, { speed: 240, anim: 'c_ninjadash' });
    if (this.flowGone(t) || !this.battle) return;
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
    await this.levelUps(lx);
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
      if (grade === 'mukemmel') { const ups = S.addXp({ savunma: 4 * this.floor }); await this.levelUps(ups); }
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
    S.save.ending = S.save.ending || gNow();
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
    const t = this.flowTok();
    UI.setActions([]);
    this.fade(true);
    this.player.setFlipX(true);
    await moveTo(this.player, Math.max(-30, this.player.x - 90), { speed: 200, anim: 'c_sprint' });
    if (this.flowGone(t)) { this.player.alpha = 1; this.fade(false); return; }
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
    const dr = this.rooms && this.rooms[this.roomIdx];
    const bossFloor = dr && dr.type === 'boss' && this.mode === 'dungeon' && !this.inZindan() ? this.floor : 0;
    this.retryBoss = 0;
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
      // 1.0.22 (Eren): patrona yenilince patron kontrol noktasindan tekrar dene
      if (bossFloor) row.appendChild(UI.button('Patrona tekrar dene', () => { this.retryBoss = bossFloor; UI.closePanel(); }, 'purple'));
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
    if (this.retryBoss) { const f = this.retryBoss; this.retryBoss = 0; openPrep(this, f, { boss: true }); }
  }
}
