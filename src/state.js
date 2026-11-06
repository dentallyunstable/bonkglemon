// Oyuncu kaydi: beceriler, canta, ekipman, istatistikler.
// 0.1'de kayit bu cihazin tarayicisinda tutulur (localStorage).
// 0.6'da Firebase ile buluta tasinacak.
import { ITEMS, SETS, BAG_SIZE, STACK, SKILLS, RARITY } from './data.js';

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
    equip: { silah: 'pasli_kilic', kask: null, gogus: null, bot: null, tilsim: null, kazma: 'tahta_kazma' },
    stats: { kills: 0, deepest: 0, bossKills: 0, shiny: 0, deaths: 0, battles: 0, glemons: {}, playMs: 0, mined: 0, crafted: 0, gathered: 0, deepestMine: 1 },
    seen: {},                               // bir kez bulunan esyalar (tarif defteri icin)
    furnace: { rid: null, n: 0, t0: 0 },    // firindaki is: tarif, adet, baslama zamani
    mine: { depth: 1 },
    droplog: [],
    settings: { sound: true, auto: false },
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
    while (data.bag.length < BAG_SIZE) data.bag.push(null);
    // 0.2: kazma yuvasi ve tarif defteri
    if (!('kazma' in data.equip)) {
      const owned = [...data.bag, ...data.depo].some((x) => x && ITEMS[x.id] && ITEMS[x.id].kind === 'kazma');
      data.equip.kazma = owned ? null : 'tahta_kazma';
    }
    for (const x of [...data.bag, ...data.depo]) if (x) data.seen[x.id] = true;
    for (const id of Object.values(data.equip)) if (id) data.seen[id] = true;
    // bilinmeyen esya kimliklerini temizle (eski surumlerden kalma)
    for (const list of [data.bag, data.depo]) list.forEach((x, i) => { if (x && !ITEMS[x.id]) list[i] = null; });
    this.save = data;
    this.hp = this.maxHp();
    storageSet('bonkglemon.last', char);
    this.changed();
  },

  persist() {
    if (!this.save) return;
    storageSet(SAVE_PREFIX + this.save.char, JSON.stringify(this.save));
  },

  changed() {
    this.persist();
    for (const fn of this.listeners) { try { fn(); } catch (e) { console.error(e); } }
  },

  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },

  // ------------------------------------------------ beceriler
  level(skill) { return levelFromXp(this.save.skills[skill] || 0); },
  totalLevel() { return SKILLS.reduce((t, s) => t + this.level(s.key), 0); },

  // XP ekler, seviye atlayan becerileri dondurur
  addXp(gains) {
    const ups = [];
    for (const [skill, amount] of Object.entries(gains)) {
      if (!amount) continue;
      const before = this.level(skill);
      this.save.skills[skill] = (this.save.skills[skill] || 0) + Math.round(amount);
      const after = this.level(skill);
      if (after > before) ups.push({ skill, level: after });
    }
    return ups;
  },

  // ------------------------------------------------ statlar
  gear() {
    return Object.values(this.save.equip).filter(Boolean).map((id) => ITEMS[id]);
  },
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
  atk() {
    const w = this.save.equip.silah ? ITEMS[this.save.equip.silah].power : 0;
    return this.level('saldiri') + w;
  },
  def() {
    const base = this.level('savunma') + this.gear().reduce((t, it) => t + (it.def || 0), 0);
    const pct = this.activeSets().reduce((t, st) => t + (st.defPct || 0), 0);
    return Math.round(base * (1 + pct));
  },
  pick() {
    const id = this.save.equip.kazma;
    return id ? ITEMS[id].pick : 0;
  },
  spd() {
    return 100 + this.gear().reduce((t, it) => t + (it.spd || 0), 0);
  },
  crit() { return 0.05; },

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

  endRun() { this.run = null; this.hp = this.maxHp(); this.changed(); },

  addGold(n) {
    this.save.gold += n;
    if (this.run) this.run.gold += n;
  },

  rarityColor(r) { return (RARITY[r] || RARITY.siradan).color; },
};

export function lastCharacter() {
  return storageGet('bonkglemon.last');
}

export function hasSave(char) {
  return !!storageGet(SAVE_PREFIX + char);
}
