// Oyuncu kaydi: beceriler, canta, ekipman, istatistikler.
// 0.1'de kayit bu cihazin tarayicisinda tutulur (localStorage).
// 0.6'da Firebase ile buluta tasinacak.
import { ITEMS, SETS, BAG_SIZE, STACK, SKILLS, RARITY, BUILD, GLEMONS, WEAPON_SKILL, EVOLVE_AT, PET_MAX_LVL, petXpFor, petStatMult, petCap, ahirSize, QUESTS, QUEST_SLOTS, ZONES, ZONE_SPAWNS, EGGS, EGG_BATTLES, TREE, TREE_COST, RECIPES } from './data.js';

const CRAFTABLE = new Set(RECIPES.map((r) => r.out));

const SAVE_PREFIX = 'bonkglemon.save.';
const DEPO_SIZE = 40;

export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(40 * Math.pow(level - 1, 2.4));
}

export function levelFromXp(xp) {
  let l = 1;
  while (l < 99 && xpForLevel(l + 1) <= xp) l++;
  return l;
}

function freshSave(char) {
  const skills = {};
  for (const s of SKILLS) skills[s.key] = 0;
  const bag = new Array(BAG_SIZE).fill(null);
  bag[0] = { id: 'iksir_k', n: 3 };
  return {
    v: 1,
    char,
    created: Date.now(),
    skills,
    gold: 0,
    bag,
    depo: new Array(DEPO_SIZE).fill(null),
    equip: { silah: 'pasli_kilic', kask: null, gogus: null, bot: null, tilsim: null, kazma: 'tahta_kazma', olta: 'tahta_olta', pelerin: null },
    stats: { kills: 0, deepest: 0, bossKills: 0, shiny: 0, deaths: 0, battles: 0, glemons: {}, playMs: 0, mined: 0, crafted: 0, gathered: 0, deepestMine: 1, placed: 0, zfloors: 0 },
    seen: {},                               // bir kez bulunan esyalar (tarif defteri icin)
    furnace: { rid: null, n: 0, t0: 0 },    // firindaki is: tarif, adet, baslama zamani
    mine: { depth: 1 },
    droplog: [],
    settings: { sound: true, auto: false },
    // 0.3 Us: arsa hucreleri "sutun,sira" -> { id, shape? }, bahce "sutun" -> { seed, t0 }
    plot: { cells: {}, garden: {}, best: 0, back: {}, kinds: {}, rw: {}, bestScore: 0 },
    lastSeen: Date.now(),
    // 0.4 evcil Glemonlar: { id, key, stage, shiny, lvl, xp, t }
    pets: [],
    pet: null,          // yanindaki Glemon'un id'si
    petSeq: 1,
    album: { seen: {}, shiny: {}, tamed: {} },
    combos: {},
    // 0.5
    bagBonus: 0,
    waterUntil: 0,
    // 0.6 Hanci Lale'nin gorevleri
    quests: { list: [], done: 0, seq: 1 },
    // 0.8.5 balikcilik: tur -> kac tane, secili yem
    fishing: { caught: {}, best: {}, bait: 'yok', total: 0 },
    upg: {},            // Ors yukseltmeleri: esya turu -> +1..+4
    perks: {},          // yetenek agaci: dal -> [kat0, kat1, kat2] secilen yetenek sirasi (0/1) ya da null
    // 0.9 Hedefler (bkz. goals.js)
    pul: 0,             // Lale Pulu: sadece gorev ve etkinliklerden
    goals: null,        // gunluk/haftalik gorevler
    ach: {},            // basarim -> bildirilen kademe
    title: 'caylak',
    flags: {},          // gizli basarimlar icin anlar (tek vurus, kil payi)
    capes: {},          // verilen pelerinler
    albumRw: {},        // albume tamamlama odulleri (25/50/75/100)
    merch: { week: -1, bought: {} },
    ev: { daily: -1, weekend: -1, tourWeek: -1, tourBase: 0, tour: [] },
    clock: { max: 0 },
    // 0.10 Blok Dunyasi: maden kuyusu, fosiller, kazma ozelligi, Koru
    shaft: null,
    fossils: {},
    ench: null,
    grove: null,
  };
}

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function storageSet(key, val) {
  try { localStorage.setItem(key, val); return true; } catch (e) { return false; }
}

export const S = {
  save: null,     // kalici kayit
  run: null,      // aktif dungeon turu (kaydedilmez)
  hp: 0,          // anlik can
  listeners: new Set(),

  load(char) {
    let data = null;
    const raw = storageGet(SAVE_PREFIX + char);
    if (raw) {
      try { data = JSON.parse(raw); } catch (e) { data = null; }
    }
    if (!data || data.char !== char) data = freshSave(char);
    // eski kayitlarda eksik alanlari tamamla
    const fresh = freshSave(char);
    for (const k of Object.keys(fresh)) if (data[k] === undefined) data[k] = fresh[k];
    for (const k of Object.keys(fresh.skills)) if (data.skills[k] === undefined) data.skills[k] = 0;
    for (const k of Object.keys(fresh.stats)) if (data.stats[k] === undefined) data.stats[k] = fresh.stats[k];
    while (data.bag.length < BAG_SIZE + (data.bagBonus || 0)) data.bag.push(null);
    // 0.4: albume daha once yenilenleri ekle
    for (const k of Object.keys(data.stats.glemons || {})) if (GLEMONS[k]) data.album.seen[k] = true;
    // 0.2: kazma yuvasi ve tarif defteri
    if (!('kazma' in data.equip)) {
      const owned = [...data.bag, ...data.depo].some((x) => x && ITEMS[x.id] && ITEMS[x.id].kind === 'kazma');
      data.equip.kazma = owned ? null : 'tahta_kazma';
    }
    // 0.8.5: olta yuvasi; herkese bir Tahta Olta
    if (!('olta' in data.equip)) data.equip.olta = 'tahta_olta';
    if (!('pelerin' in data.equip)) data.equip.pelerin = null;
    if (!data.fishing) data.fishing = { caught: {}, best: {}, bait: 'yok', total: 0 };
    if (!data.upg) data.upg = {};
    if (!data.perks) data.perks = {};
    // 0.10.5 Insa: arka duvar katmani, ilk kez konan blok turleri, odul basamaklari, depo sandiklari
    data.plot.back = data.plot.back || {};
    data.plot.kinds = data.plot.kinds || {};
    data.plot.rw = data.plot.rw || {};
    data.plot.bestScore = data.plot.bestScore || 0;
    { const chests = Object.values(data.plot.cells).filter((c) => c && c.id === 'depo_sandigi').length;
      while (data.depo.length < DEPO_SIZE + 10 * Math.min(4, chests)) data.depo.push(null); }
    for (const x of [...data.bag, ...data.depo]) if (x) data.seen[x.id] = true;
    for (const id of Object.values(data.equip)) if (id) data.seen[id] = true;
    // bilinmeyen esya kimliklerini temizle (eski surumlerden kalma)
    for (const list of [data.bag, data.depo]) list.forEach((x, i) => { if (x && (!ITEMS[x.id] || !(x.n > 0))) list[i] = null; });
    // 0.8.6: bozuk ya da eski kayit oyunu cokertmesin
    for (const [slot, id] of Object.entries(data.equip)) if (id && (!ITEMS[id] || ITEMS[id].kind !== slot)) data.equip[slot] = null;
    data.pets = (data.pets || []).filter((p) => p && GLEMONS[p.key] && !GLEMONS[p.key].boss);
    for (const p of data.pets) { p.stage = Math.max(0, Math.min(2, p.stage | 0)); p.lvl = Math.max(1, Math.min(PET_MAX_LVL, p.lvl | 0)); if (!(p.xp >= 0)) p.xp = petXpFor(p.lvl); }
    if (data.pet && !data.pets.some((p) => p.id === data.pet)) data.pet = null;
    for (const [k, c] of Object.entries(data.plot.cells)) if (!c || !BUILD[c.id]) delete data.plot.cells[k];
    for (const k of Object.keys(data.plot.garden)) if (!data.plot.cells[k] || data.plot.cells[k].id !== 'tarla') delete data.plot.garden[k];
    if (data.furnace.rid != null && !RECIPES[data.furnace.rid]) data.furnace = { rid: null, n: 0, t0: 0 };
    data.quests.list = (data.quests.list || []).filter((q) => q && QUESTS[q.kind] && (q.kind !== 'species' || GLEMONS[q.key]));
    if (!(data.gold >= 0)) data.gold = 0;
    data.gold = Math.floor(data.gold);
    for (const k of Object.keys(data.skills)) if (!(data.skills[k] >= 0)) data.skills[k] = 0;
    for (const k of Object.keys(data.upg)) if (!ITEMS[k]) delete data.upg[k];
    this.save = data;
    this.hp = this.maxHp();
    // 0.8.6: savasin ortasinda oyunu kapatmak bayilma cezasindan kurtarmaz
    this.loadNote = null;
    if (data.run) {
      if (data.run.fight) {
        this.run = data.run;
        const res = this.loseHalfRun();
        data.stats.deaths++;
        this.loadNote = res;
      }
      this.run = null;
      data.run = null;
    }
    storageSet('bonkglemon.last', char);
    this.changed();
  },

  persist() {
    if (!this.save) return;
    if (this._pt) { clearTimeout(this._pt); this._pt = null; }
    storageSet(SAVE_PREFIX + this.save.char, JSON.stringify(this.save));
  },
  // 0.8.6: art arda gelen degisiklikler tek seferde yazilir (sekme kapanirken hemen yazilir)
  persistSoon() {
    if (this._pt || !this.save) return;
    this._pt = setTimeout(() => { this._pt = null; this.persist(); }, 200);
  },

  changed() {
    this.persistSoon();
    for (const fn of this.listeners) { try { fn(); } catch (e) { console.error(e); } }
  },

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },

  // ------------------------------------------------ beceriler
  level(skill) { return levelFromXp(this.save.skills[skill] || 0); },
  totalLevel() { return SKILLS.reduce((t, s) => t + this.level(s.key), 0); },

  // XP ekler, seviye atlayan becerileri dondurur
  addXp(gains) {
    const ups = [];
    for (let [skill, amount] of Object.entries(gains)) {
      if (!amount) continue;
      const before = this.level(skill);
      // 0.9: secili unvan o beceriye en fazla %3 XP bonusu verir
      if (amount > 0 && this.xpBonus) amount *= this.xpBonus(skill);
      this.save.skills[skill] = (this.save.skills[skill] || 0) + Math.round(amount);
      const after = this.level(skill);
      if (after > before) ups.push({ skill, level: after });
    }
    return ups;
  },

  // ------------------------------------------------ yetenek agaci (0.8.5)
  treePoints(branch) { return Math.floor(TREE[branch].skills.reduce((t, k) => t + this.level(k), 0) / 10); },
  treeSpent(branch) { return (this.save.perks[branch] || []).reduce((t, v, i) => t + (v == null ? 0 : TREE_COST[i]), 0); },
  has(key) {
    for (const [b, def] of Object.entries(TREE)) {
      const sel = this.save.perks[b];
      if (!sel) continue;
      for (let i = 0; i < 3; i++) if (sel[i] != null && def.tiers[i][sel[i]].key === key) return true;
    }
    return false;
  },
  perk(key, val = true, def = false) { return this.has(key) ? val : def; },
  canPick(branch, tier) {
    const sel = this.save.perks[branch] || [];
    if (sel[tier] != null) return false;
    for (let i = 0; i < tier; i++) if (sel[i] == null) return false;
    return this.treePoints(branch) - this.treeSpent(branch) >= TREE_COST[tier];
  },
  pickPerk(branch, tier, idx) {
    if (!this.canPick(branch, tier)) return false;
    const sel = this.save.perks[branch] || [null, null, null];
    sel[tier] = idx;
    this.save.perks[branch] = sel;
    this.hp = Math.min(this.hp, this.maxHp());
    this.changed();
    return true;
  },
  eggNeed() { return this.has('yumurta_bakicisi') ? 60 : EGG_BATTLES; },
  counterMult() { return this.has('karsi_darbe') ? 2 : 1; },

  // ------------------------------------------------ statlar
  gear() {
    return Object.values(this.save.equip).filter(Boolean).map((id) => ITEMS[id]);
  },
  // Ors (0.8.5): her arti %8 guc; esya turune islenir
  upg(id) { return (this.save.upg && this.save.upg[id]) || 0; },
  upMult(id) { return 1 + 0.08 * this.upg(id) + (CRAFTABLE.has(id) && this.has('usta_isi') ? 0.05 : 0); },
  gearStat(key) { return Object.values(this.save.equip).filter(Boolean).reduce((t, id) => t + (ITEMS[id][key] || 0) * (key === 'def' ? this.upMult(id) : 1), 0); },
  dodgeBonus() { return this.gear().reduce((t, it) => t + (it.dodge || 0), 0) + this.perk('refleks', 0.2, 0); },
  activeSets() {
    const counts = {};
    for (const it of this.gear()) if (it.set) counts[it.set] = (counts[it.set] || 0) + 1;
    return Object.entries(counts).filter(([set, n]) => n >= SETS[set].pieces).map(([set]) => SETS[set]);
  },
  setBonusHp() {
    return this.activeSets().reduce((t, st) => t + (st.hp || 0), 0);
  },
  maxHp() {
    return 50 + 10 * this.level('can') + this.gear().reduce((t, it) => t + (it.hp || 0), 0) + this.setBonusHp();
  },
  // silah turu: kilic, yay ya da yumruk (silahsiz ya da eldiven)
  weaponType() {
    const id = this.save.equip.silah;
    if (!id) return 'yumruk';
    return ITEMS[id].wt || 'kilic';
  },
  atkSkill() { return WEAPON_SKILL[this.weaponType()]; },
  atk() {
    const wt = this.weaponType();
    const m = wt === 'yay' ? this.perk('kartal_gozu', 1.08, 1) : this.perk('keskin_kilic', 1.08, 1);
    return Math.round(this.atkBase() * m);
  },
  atkBase() {
    const id = this.save.equip.silah;
    const w = id ? Math.round(ITEMS[id].power * this.upMult(id)) : 0;
    return this.level(this.atkSkill()) + w;
  },
  // Sans: nadir dusme ve parlak Glemon (seviye + tilsim)
  luck() { return this.level('sans') + this.gear().reduce((t, it) => t + (it.luck || 0), 0) + this.perk('sansli_dogan', 8, 0); },
  dropMult() { return 1 + this.luck() * 0.006; },
  shinyChance() { return (this.shinyMult ? this.shinyMult() : 1) * this.perk('parlak_goz', 1.5, 1) / Math.max(200, 500 - this.luck() * 2.5); },
  bagSize() { return BAG_SIZE + (this.save.bagBonus || 0); },
  def() {
    const base = this.level('savunma') + this.gearStat('def');
    const pct = this.activeSets().reduce((t, st) => t + (st.defPct || 0), 0);
    return Math.round(base * (1 + pct));
  },
  pick() {
    const id = this.save.equip.kazma;
    return id ? ITEMS[id].pick * this.upMult(id) : 0;
  },
  rod() {
    const id = this.save.equip.olta;
    return id ? ITEMS[id].rod : null;
  },
  spd() {
    return 100 + this.gear().reduce((t, it) => t + (it.spd || 0), 0);
  },
  crit() { return (this.hp < this.maxHp() * 0.3 ? this.perk('ofke', 0.2, 0) : 0) + 0.05 + this.gear().reduce((t, it) => t + (it.crit || 0), 0) + this.activeSets().reduce((t, st) => t + (st.crit || 0), 0); },
  // 0.8: Kor seti / Magma Goguslugu yanmaz, Golge seti / Bekci Pelerini karanlikta gorur
  fireproof() { return this.gear().some((it) => it.fireproof) || this.activeSets().some((st) => st.fireproof); },
  darkproof() { return this.gear().some((it) => it.darkproof) || this.activeSets().some((st) => st.darkproof); },
  // efsanevi yumurtalar: cantadaki her yumurta her zaferde bir adim catlar
  tickEggs() {
    const out = [];
    this.save.bag.forEach((s, i) => {
      if (!s || !ITEMS[s.id] || !ITEMS[s.id].egg) return;
      const need = this.eggNeed();
      s.p = Math.min(need, (s.p || 0) + 1);
      if (s.p < need) { if (s.p % 25 === 0) out.push({ progress: s.p, name: ITEMS[s.id].name }); return; }
      const key = EGGS[ITEMS[s.id].egg];
      const pet = this.addPet(key, 0, Math.random() < 0.05, 1);
      if (!pet) { if (!s.full) { s.full = true; out.push({ full: true, name: ITEMS[s.id].name }); } return; }
      this.save.bag[i] = null;
      this.save.stats.hatched = (this.save.stats.hatched || 0) + 1;
      this.seeGlemon(key, pet.shiny);
      out.push({ pet, key });
    });
    return out;
  },

  // ------------------------------------------------ canta
  countItem(id, where = 'bag') {
    return this.save[where].reduce((t, s) => t + (s && s.id === id ? s.n : 0), 0);
  },

  // esyanin cantaya sigip sigmayacagi (yigin + bos yuva)
  fits(id, n = 1) {
    const stackable = ITEMS[id].kind === 'malzeme' || ITEMS[id].kind === 'tuketim';
    let room = 0;
    for (const s of this.save.bag) {
      if (!s) room += stackable ? STACK : 1;
      else if (stackable && s.id === id) room += STACK - s.n;
      if (room >= n) return true;
    }
    return false;
  },

  // Esya ekler. Sigmayan miktari dondurur (0 = hepsi sigdi).
  addItem(id, n = 1, where = 'bag') {
    const list = this.save[where];
    const stackable = ITEMS[id].kind === 'malzeme' || ITEMS[id].kind === 'tuketim';
    this.save.seen[id] = true;
    let left = n;
    if (stackable) {
      for (const s of list) {
        if (left <= 0) break;
        if (s && s.id === id && s.n < STACK) {
          const add = Math.min(STACK - s.n, left);
          s.n += add; left -= add;
        }
      }
    }
    for (let i = 0; i < list.length && left > 0; i++) {
      if (!list[i]) {
        const add = stackable ? Math.min(STACK, left) : 1;
        list[i] = { id, n: add };
        left -= add;
      }
    }
    if (left < n && this.run && where === 'bag') {
      this.run.gained[id] = (this.run.gained[id] || 0) + (n - left);
    }
    return left;
  },

  removeItem(id, n = 1, where = 'bag') {
    const list = this.save[where];
    let left = n;
    for (let i = list.length - 1; i >= 0 && left > 0; i--) {
      const s = list[i];
      if (s && s.id === id) {
        const take = Math.min(s.n, left);
        s.n -= take; left -= take;
        if (s.n <= 0) list[i] = null;
      }
    }
    return n - left;
  },

  bagFreeSlots() { return this.save.bag.filter((s) => !s).length; },

  canEquip(id) {
    const it = ITEMS[id];
    if (!it.req) return true;
    return this.level(it.req[0]) >= it.req[1];
  },

  // canta slotundaki esyayi kusan
  equipFromBag(index) {
    const slot = this.save.bag[index];
    if (!slot) return false;
    const it = ITEMS[slot.id];
    const where = it.kind;
    if (!(where in this.save.equip)) return false;
    if (!this.canEquip(slot.id)) return false;
    const old = this.save.equip[where];
    const hpRatio = this.hp / this.maxHp();
    this.save.equip[where] = slot.id;
    this.save.bag[index] = old ? { id: old, n: 1 } : null;
    this.hp = Math.max(1, Math.round(hpRatio * this.maxHp()));
    this.changed();
    return true;
  },

  unequip(where) {
    const id = this.save.equip[where];
    if (!id) return false;
    const i = this.save.bag.findIndex((s) => !s);
    if (i < 0) return false;
    const hpRatio = this.hp / this.maxHp();
    this.save.bag[i] = { id, n: 1 };
    this.save.equip[where] = null;
    this.hp = Math.max(1, Math.min(this.maxHp(), Math.round(hpRatio * this.maxHp())));
    this.changed();
    return true;
  },

  // canta <-> depo
  moveSlot(fromList, index, toList) {
    const s = this.save[fromList][index];
    if (!s) return false;
    // yumurta catlama sayacini korusun: yuvayi oldugu gibi tasi
    if (ITEMS[s.id].egg) {
      const j = this.save[toList].indexOf(null);
      if (j < 0) return false;
      this.save[toList][j] = s;
      this.save[fromList][index] = null;
      this.changed();
      return true;
    }
    const left = this.addItemRaw(s.id, s.n, toList);
    if (left === s.n) return false;
    if (left === 0) this.save[fromList][index] = null;
    else s.n = left;
    this.changed();
    return true;
  },
  addItemRaw(id, n, where) {
    const run = this.run; this.run = null;
    const left = this.addItem(id, n, where);
    this.run = run;
    return left;
  },

  // ------------------------------------------------ gunluk
  logDrop(item, from, extra = {}) {
    const it = ITEMS[item];
    this.save.droplog.unshift({ t: Date.now(), item, from, rarity: it ? it.rarity : 'siradan', ...extra });
    this.save.droplog = this.save.droplog.slice(0, 30);
  },

  // ------------------------------------------------ dungeon turu
  startRun(floor) {
    this.run = { gained: {}, gold: 0, startFloor: floor, kills: 0 };
    this.save.run = this.run; // kayitla birlikte yazilir (bkz. load)
    this.persist();
  },
  // savas basladi / bitti: savas sirasinda sayfa kapanirsa tur bayilma sayilir
  setFight(on) {
    if (!this.run) return;
    this.run.fight = !!on;
    this.persist();
  },

  // Bayilinca: bu turda kazanilanlarin yarisi kaybolur
  loseHalfRun() {
    const lost = [];
    if (!this.run) return { lost, gold: 0 };
    for (const [id, n] of Object.entries(this.run.gained)) {
      const lose = Math.floor(n / 2);
      if (lose > 0) {
        const removed = this.removeItem(id, lose);
        if (removed > 0) lost.push({ id, n: removed });
      }
    }
    const gold = Math.floor(this.run.gold / 2);
    this.save.gold = Math.max(0, this.save.gold - gold);
    return { lost, gold };
  },

  endRun() { this.run = null; this.save.run = null; this.hp = this.maxHp(); this.persist(); this.changed(); },

  // ------------------------------------------------ gorevler (0.6)
  questProgress(q) {
    const def = QUESTS[q.kind];
    const now = def.stat(this.save, q.key);
    return def.abs ? Math.min(q.target, now) : Math.min(q.target, Math.max(0, now - q.base));
  },
  newQuest(avoid = []) {
    const lvl = this.totalLevel();
    const kills = this.save.stats.glemons || {};
    const zones = ZONES.filter((z) => z.open && (!z.after || kills[z.after] > 0));
    const pool = Object.keys(QUESTS).filter((k) => !avoid.includes(k) && (k !== 'tame' || this.level('bag') >= 1));
    const kind = pool[Math.floor(Math.random() * pool.length)];
    const def = QUESTS[kind];
    const tier = Math.min(2, Math.floor(Math.random() * (lvl > 150 ? 3 : lvl > 60 ? 2 : 1.4)));
    let key = null;
    if (kind === 'species') {
      const z = zones[Math.floor(Math.random() * zones.length)];
      const opts = ZONE_SPAWNS[z.key].map(([k]) => k).filter((k) => GLEMONS[k].rarity !== 'epik');
      key = opts[Math.floor(Math.random() * opts.length)];
    }
    let target = def.amt[tier];
    if (def.abs) target = (this.save.stats.zindanBest || 0) + def.amt[tier];
    const scale = 1 + lvl / 60;
    const q = {
      id: this.save.quests.seq++, kind, key, tier, target, base: def.abs ? 0 : def.stat(this.save, key),
      gold: Math.round((25 + 30 * tier) * scale), xp: Math.round((120 + 180 * tier) * scale * scale), skill: def.skill,
    };
    q.text = def.name(def.abs ? target : target, key);
    return q;
  },
  fillQuests() {
    const qs = this.save.quests;
    while (qs.list.length < QUEST_SLOTS) qs.list.push(this.newQuest(qs.list.map((q) => q.kind)));
  },

  addGold(n) {
    this.save.gold += n;
    if (this.run) this.run.gold += n;
  },

  // ------------------------------------------------ us (0.3)
  baseScore() {
    const front = Object.values(this.save.plot.cells).reduce((t, c) => t + (c.top || c.part ? 0 : (BUILD[c.id] ? BUILD[c.id].pts : 0)), 0);
    // 0.10.5: arka duvar bloklari yarim puan
    const back = Object.values(this.save.plot.back || {}).reduce((t, c) => t + (BUILD[c.id] ? BUILD[c.id].pts / 2 : 0), 0);
    return Math.round((front + back) * this.perk('usta_insa', 1.25, 1));
  },
  depoSize() { return DEPO_SIZE + 10 * Math.min(4, Object.values(this.save.plot.cells).filter((c) => c.id === 'depo_sandigi').length); },
  placedCount() {
    return Object.values(this.save.plot.cells).filter((c) => !c.top && !c.part).length + Object.keys(this.save.plot.back || {}).length;
  },

  // ------------------------------------------------ evcil Glemonlar (0.4)
  activePet() { return this.save.pets.find((p) => p.id === this.save.pet) || null; },
  ahirSize() { return ahirSize(this.level('insa')); },
  petCap() { return petCap(this.level('bag')); },
  petName(p) { return (p.shiny ? 'Parlak ' : '') + GLEMONS[p.key].name; },
  petStats(p) {
    const d = GLEMONS[p.key];
    const m = petStatMult(p.lvl, p.stage);
    const bond = 1 + this.level('bag') * 0.005;
    return {
      maxHp: Math.round(d.hp * m * (p.shiny ? 1.1 : 1)),
      atk: d.atk * m * bond * (p.shiny ? 1.1 : 1) * this.perk('sadik_dost', 1.15, 1),
      def: d.def * m * 0.6,
      spd: d.spd,
    };
  },
  addPet(key, stage, shiny, lvl) {
    if (this.save.pets.length >= this.ahirSize()) return null;
    const p = { id: this.save.petSeq++, key, stage, shiny: !!shiny, lvl: Math.max(1, lvl), xp: petXpFor(Math.max(1, lvl)), t: Date.now() };
    this.save.pets.push(p);
    this.save.album.tamed[key] = true;
    if (shiny) this.save.album.shiny[key] = true;
    if (!this.save.pet) this.save.pet = p.id;
    return p;
  },
  releasePet(id) {
    this.save.pets = this.save.pets.filter((p) => p.id !== id);
    if (this.save.pet === id) this.save.pet = null;
  },
  // XP ekler; seviye sinirinda (Bag / 2) birikir. { up: yeni seviye ya da 0, evolved: yeni asama ya da -1 }
  petAddXp(p, xp) {
    const cap = this.petCap();
    p.xp += Math.round(xp);
    const before = p.lvl;
    while (p.lvl < Math.min(cap, PET_MAX_LVL) && p.xp >= petXpFor(p.lvl + 1)) p.lvl++;
    if (p.lvl >= cap) p.xp = Math.min(p.xp, petXpFor(cap + 1) - 1);
    let evolved = -1;
    while (p.stage < 2 && p.lvl >= EVOLVE_AT[p.stage]) { p.stage++; evolved = p.stage; }
    return { up: p.lvl > before ? p.lvl : 0, evolved };
  },
  seeGlemon(key, shiny) {
    this.save.album.seen[key] = true;
    if (shiny) this.save.album.shiny[key] = true;
  },

  rarityColor(r) { return (RARITY[r] || RARITY.siradan).color; },
};

export function lastCharacter() {
  return storageGet('bonkglemon.last');
}

export function hasSave(char) {
  return !!storageGet(SAVE_PREFIX + char);
}
