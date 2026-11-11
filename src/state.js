// Oyuncu kaydi: beceriler, canta, ekipman, istatistikler.
// 0.1'de kayit bu cihazin tarayicisinda tutulur (localStorage).
// 0.6'da Firebase ile buluta tasinacak.
import { QUALITY_KINDS, QUALITY_ROLL, AFFIX, LEGEND_FX } from './data.js';
import { todNow } from './art.js';
import { ITEMS, SETS, BAG_SIZE, STACK, SKILLS, RARITY, BUILD, GLEMONS, WEAPON_SKILL, EVOLVE_AT, PET_MAX_LVL, petXpFor, petStatMult, petCap, ahirSize, QUESTS, QUEST_SLOTS, ZONES, ZONE_SPAWNS, EGGS, EGG_BATTLES, TREE, TREE_COST, TREE2, TREE_ROW_NEED, CLASS_ROW, SUB_ROW, nodeCost, RECIPES, TOK, TASTY_BONUS, TRAITS, RANCH, BOND, TEAM, passiveOf, CLASSES, SUBCLASSES, CLASS_TREE, SUB_TREE, CLASS_RULES, MAGIC } from './data.js';

const CRAFTABLE = new Set(RECIPES.map((r) => r.out));

const SAVE_PREFIX = 'bonkglemon.save.';
const DEPO_SIZE = 40;

// 1.0.13 (Eren): basta hizli, sonda yavas. Eski egri: 40 * (L-1)^2.4
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.floor(10.6 * Math.pow(level - 1, 2) * Math.pow(2, (level - 1) / 18.5));
}
const oldXpForLevel = (l) => (l <= 1 ? 0 : Math.floor(40 * Math.pow(l - 1, 2.4)));
const oldPetXpFor = (l) => (l <= 1 ? 0 : Math.floor(30 * Math.pow(l - 1, 2.1)));
// eski XP'yi yeni egriye tasir: seviye ve seviyedeki ilerleme orani korunur
function remapXp(xp, oldF, newF, max) {
  let l = 1;
  while (l < max && oldF(l + 1) <= xp) l++;
  const a = oldF(l); const b = oldF(l + 1);
  const f = b > a ? Math.min(1, (xp - a) / (b - a)) : 0;
  return Math.round(newF(l) + f * (newF(l + 1) - newF(l)));
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
    // 0.11: Tok guclendirmesi { id, k, v, until }, lezzetli yemek sayilari, kamp atesi, savas esyasi kullanimlari
    tok: null, tasty: {}, fireUntil: 0, useCount: {},
    lastSeen: Date.now(),
    // 0.4 evcil Glemonlar: { id, key, stage, shiny, lvl, xp, t }
    pets: [],
    pet: null,          // yanindaki Glemon'un id'si
    pet2: null,         // 0.12: ikinci yoldas (Glemon Bagi 50)
    petSeq: 1,
    album: { seen: {}, shiny: {}, tamed: {}, drops: {} },
    // 0.12: Ahir yumurta sepeti, kulucka yuvalari, tamamlanan bolgeler
    eggs: [], nest: [null, null, null], zoneDone: {},
    // 0.13: sinif { c: savasci|nisanci|buyucu|destek, sub: alt sinif, ch: kac kez degisti }
    cls: { c: null, sub: null, ch: 0 },
    // 0.13.5: kusanilan esyalarin kalitesi, Sonsuz Kule, patron gunlugu
    eqx: {},
    kule: { wk: 0, best: 0, all: 0, cp: 0, chests: [], k50: false },
    bossLog: {},
    story: { ch: 0 }, // 1.0 Lale'nin hikayesi: alinan bolum odulu sayisi
    kadimMode: false, // 1.0 oyun sonrasi Kadim zorluk (Kesif)
    ending: 0, // Kadim Bonk ilk kez yenildigi an
    combos: {},
    // 0.5
    bagBonus: 0,
    waterUntil: 0,
    // 0.6 Hanci Lale'nin gorevleri
    quests: { list: [], done: 0, seq: 1 },
    // 0.8.5 balikcilik: tur -> kac tane, secili yem
    fishing: { caught: {}, best: {}, bait: 'yok', total: 0 },
    upg: {},            // Ors yukseltmeleri: esya turu -> +1..+4
    perks: {},          // eski (0.8.5) yetenek agaci; 1.0.13'ten beri bos
    tree: {},           // 1.0.13 yetenek agaci 2.0: dal -> { yetenek: kademe }
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

// 1.0 kayit surumu ve yedekler
export const SAVE_V = 3;
const BAK_PREFIX = 'bonkglemon.bak.';
const BAK_MAX = 3;
const BAK_EVERY = 20 * 3600 * 1000;
// sv eski olan kayitlar sirayla bu adimlardan gecer (index = hedef surum - 2)
const MIGRATIONS = [
  (d) => { if (!d.settings) d.settings = { sound: true, auto: false }; }, // 1 -> 2: 1.0 ayarlar + yedek
  (d) => { // 2 -> 3: 1.0.13 yeni seviye egrisi (seviyeler korunur) + yetenek agaci 2.0 (puanlar iade)
    for (const k of Object.keys(d.skills || {})) d.skills[k] = remapXp(d.skills[k] || 0, oldXpForLevel, xpForLevel, 120);
    for (const p of d.pets || []) if (p && p.lvl) {
      const a = oldPetXpFor(p.lvl); const b = oldPetXpFor(p.lvl + 1);
      const f = b > a ? Math.max(0, Math.min(1, ((p.xp || 0) - a) / (b - a))) : 0;
      p.xp = Math.round(petXpFor(p.lvl) + f * (petXpFor(p.lvl + 1) - petXpFor(p.lvl)));
    }
    d.oldPerks = d.perks; d.perks = {}; d.tree = {};
  },
];
function readBackups(char) {
  try { const a = JSON.parse(storageGet(BAK_PREFIX + char) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
}
// kaydin oyuna ait ve o karaktere ait oldugunu kontrol et (sifre/kod kayitta yok)
function validSave(d, char) {
  return !!d && typeof d === 'object' && d.char === char && d.skills && typeof d.skills === 'object' &&
    d.stats && typeof d.stats === 'object' && Array.isArray(d.bag) && d.equip && typeof d.equip === 'object';
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
    this.restoredFrom = 0;
    // 1.0: kayit bozulduysa en yeni otomatik yedege don
    if (raw && !validSave(data, char)) {
      for (const b of readBackups(char).sort((x, y) => y.t - x.t)) {
        let d = null; try { d = JSON.parse(b.raw); } catch (e) { d = null; }
        if (validSave(d, char)) { data = d; this.restoredFrom = b.t; break; }
      }
    }
    if (!data || data.char !== char) data = freshSave(char);
    for (let v = (data.sv || 1) + 1; v <= SAVE_V; v++) { const m = MIGRATIONS[v - 2]; if (m) m(data); }
    data.sv = SAVE_V;
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
    // 0.12: eski Glemonlara rastgele huy, bag kalbi ve ahir zamanlayicisi
    const tk = Object.keys(TRAITS);
    for (const p of data.pets) {
      if (!TRAITS[p.huy]) p.huy = tk[Math.floor(Math.random() * tk.length)];
      if (!(p.kalp >= 0)) p.kalp = 0;
      if (!p.rt) p.rt = Date.now() - RANCH.ms;
      if (p.acc && (!ITEMS[p.acc] || ITEMS[p.acc].kind !== 'aksesuar')) p.acc = null;
    }
    if (data.pet2 && (data.pet2 === data.pet || !data.pets.some((p) => p.id === data.pet2))) data.pet2 = null;
    data.album.drops = data.album.drops || {};
    // 0.13: "Savas" dali "Sinif" dali oldu: o dala harcanan puanlar iade edilir
    if (!data.flags.sinif13) {
      if (data.perks.savas && data.perks.savas.some((v) => v != null)) data.flags.sinifIade = true;
      delete data.perks.savas;
      data.flags.sinif13 = true;
    }
    if (!data.cls || (data.cls.c && !CLASSES[data.cls.c])) data.cls = { c: null, sub: null, ch: 0 };
    if (data.cls.sub && (!SUBCLASSES[data.cls.sub] || SUBCLASSES[data.cls.sub].of !== data.cls.c)) data.cls.sub = null;
    if (!data.tree || typeof data.tree !== 'object') data.tree = {};
    if (!Array.isArray(data.nest) || data.nest.length !== 3) data.nest = [null, null, null];
    for (const [k, c] of Object.entries(data.plot.cells)) if (!c || !BUILD[c.id]) delete data.plot.cells[k];
    for (const k of Object.keys(data.plot.garden)) if (!data.plot.cells[k] || data.plot.cells[k].id !== 'tarla') delete data.plot.garden[k];
    if (data.furnace.rid != null && !RECIPES[data.furnace.rid]) data.furnace = { rid: null, n: 0, t0: 0 };
    data.quests.list = (data.quests.list || []).filter((q) => q && QUESTS[q.kind] && (q.kind !== 'species' || GLEMONS[q.key]));
    if (!(data.gold >= 0)) data.gold = 0;
    data.gold = Math.floor(data.gold);
    for (const k of Object.keys(data.skills)) if (!(data.skills[k] >= 0)) data.skills[k] = 0;
    for (const k of Object.keys(data.upg)) if (!ITEMS[k]) delete data.upg[k];
    // 0.13.5: kalite bilgisi sadece kusanili yuvada durur
    if (!data.eqx || typeof data.eqx !== 'object') data.eqx = {};
    for (const k of Object.keys(data.eqx)) if (!data.equip[k] || !data.eqx[k] || !Array.isArray(data.eqx[k].a)) delete data.eqx[k];
    if (!data.kule || typeof data.kule !== 'object') data.kule = freshSave(char).kule;
    if (!data.story || typeof data.story !== 'object' || !Number.isFinite(data.story.ch)) data.story = { ch: 0 };
    data.kadimMode = !!data.kadimMode;
    if (!Number.isFinite(data.ending)) data.ending = 0;
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
    this.autoBackup();
    this.changed();
  },

  // ------------------------------------------------ 1.0 yedekler
  // gunde bir kez bu cihazda otomatik yedek (son 3 tane)
  autoBackup(force = false) {
    if (!this.save) return;
    const list = readBackups(this.save.char);
    const last = list.reduce((m, b) => Math.max(m, b.t || 0), 0);
    if (!force && Date.now() - last < BAK_EVERY) return;
    list.push({ t: Date.now(), raw: JSON.stringify(this.save) });
    list.sort((x, y) => y.t - x.t);
    if (!storageSet(BAK_PREFIX + this.save.char, JSON.stringify(list.slice(0, BAK_MAX)))) storageSet(BAK_PREFIX + this.save.char, JSON.stringify(list.slice(0, 1)));
  },
  backups() { return this.save ? readBackups(this.save.char).sort((x, y) => y.t - x.t).map((b) => ({ t: b.t })) : []; },
  // yedege don: once su anki hali de yedeklenir, sonra sayfa yenilenir
  restoreBackup(t) {
    const b = readBackups(this.save.char).find((x) => x.t === t);
    if (!b) return false;
    let d = null; try { d = JSON.parse(b.raw); } catch (e) { return false; }
    if (!validSave(d, this.save.char)) return false;
    this.persist();
    this.autoBackup(true);
    this.frozen = true; // sayfa yenilenene kadar eski hal yazilmasin
    return storageSet(SAVE_PREFIX + d.char, b.raw);
  },
  // indirilecek yedek dosyasinin metni
  exportText() {
    this.persist();
    return JSON.stringify({ game: 'bonkglemon', sv: SAVE_V, t: Date.now(), char: this.save.char, save: this.save });
  },
  // dosyadan yukle: sadece ayni karakterin kaydi kabul edilir
  importText(text) {
    let o = null;
    try { o = JSON.parse(text); } catch (e) { return 'Bu dosya okunamadı. Bonkglemon yedeği mi?'; }
    if (!o || o.game !== 'bonkglemon' || !o.save) return 'Bu bir Bonkglemon yedeği değil.';
    if (o.char !== this.save.char || !validSave(o.save, this.save.char)) return `Bu yedek başka bir karaktere ait (${String(o.char || '?').slice(0, 20)}). Sadece kendi yedeğini yükleyebilirsin.`;
    if ((o.save.sv || 1) > SAVE_V) return 'Bu yedek oyunun daha yeni bir sürümünden. Önce oyunu güncelle.';
    this.persist();
    this.autoBackup(true);
    o.save.run = null;
    this.frozen = true;
    if (!storageSet(SAVE_PREFIX + o.char, JSON.stringify(o.save))) return 'Kayıt yazılamadı (tarayıcı alanı dolu olabilir).';
    return null;
  },

  persist() {
    if (!this.save || this.frozen) return;
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
  // 1.0 sanal seviye: 99'dan sonra 120'ye kadar (sadece gosterim ve Usta Pelerini)
  vlevel(skill) {
    const xp = this.save.skills[skill] || 0;
    let l = levelFromXp(xp);
    if (l < 99) return l;
    while (l < 120 && xpForLevel(l + 1) <= xp) l++;
    return l;
  },
  vlevelOf(xp) { let l = 99; while (l < 120 && xpForLevel(l + 1) <= xp) l++; return l; },
  count99() { return SKILLS.filter((s) => !s.soon && this.level(s.key) >= 99).length; },
  totalLevel() { return SKILLS.reduce((t, s) => t + this.level(s.key), 0); },

  // XP ekler, seviye atlayan becerileri dondurur
  addXp(gains) {
    const ups = [];
    for (let [skill, amount] of Object.entries(gains)) {
      if (!amount) continue;
      const before = this.level(skill);
      // 0.9: secili unvan o beceriye en fazla %3 XP bonusu verir
      if (amount > 0 && this.xpBonus) amount *= this.xpBonus(skill);
      if (amount > 0) amount *= 1 + this.tokVal('xp'); // 0.11 Tok
      if (amount > 0) amount *= 1 + this.treeBon('xp_' + skill); // 1.0.13 yetenek agaci
      this.save.skills[skill] = (this.save.skills[skill] || 0) + Math.round(amount);
      const after = this.level(skill);
      if (after > before) ups.push({ skill, level: after });
      else if (before >= 99 && amount > 0) { // 1.0 sanal seviye
        const vb = levelFromXp(this.save.skills[skill] - Math.round(amount)) >= 99 ? this.vlevelOf(this.save.skills[skill] - Math.round(amount)) : 99;
        const va = this.vlevel(skill);
        if (va > vb) ups.push({ skill, level: va, virt: true });
      }
    }
    return ups;
  },

  // ------------------------------------------------ yetenek agaci 2.0 (1.0.13)
  // dalin becerilerinde her seviye atlayis 1 puan
  treePoints(branch) { return TREE2[branch].skills.reduce((t, k) => t + this.level(k) - 1, 0); },
  // dalin siralari: Sinif dalina secili sinifin ve alt sinifin yetenekleri eklenir
  treeRowsFor(save, branch) {
    const rows = TREE2[branch].rows.map((r) => r.map((n) => n));
    if (branch === 'savas') {
      const c = save.cls && save.cls.c;
      if (c) CLASS_TREE[c].forEach((pair, i) => { for (const n of pair) rows[CLASS_ROW[i]].push({ ...n, max: 1, big: 3, cls: true }); });
      const sb = save.cls && save.cls.sub;
      if (sb) SUB_TREE[sb].forEach((pair, i) => { for (const n of pair) rows[SUB_ROW[i]].push({ ...n, max: 1, big: 3, cls: true }); });
    }
    return rows;
  },
  treeRows(branch) { return this.treeRowsFor(this.save, branch); },
  treeRank(branch, key) { return ((this.save.tree || {})[branch] || {})[key] || 0; },
  treeSpent(branch) {
    let t = 0;
    this.treeRows(branch).forEach((row, i) => { for (const n of row) t += this.treeRank(branch, n.key) * nodeCost(n, i); });
    return t;
  },
  rowOpen(branch, row) { return this.treeSpent(branch) >= TREE_ROW_NEED[row]; },
  canBuy(branch, row, node) {
    return this.treeRank(branch, node.key) < node.max && this.rowOpen(branch, row) && this.treePoints(branch) - this.treeSpent(branch) >= nodeCost(node, row);
  },
  buyNode(branch, row, node) {
    if (!this.canBuy(branch, row, node)) return false;
    const t = (this.save.tree[branch] = this.save.tree[branch] || {});
    t[node.key] = (t[node.key] || 0) + 1;
    this.hp = Math.min(this.hp, this.maxHp());
    this.changed();
    return true;
  },
  // alinmis yetenekler: [{...yetenek, rank}]
  pickedPerks() {
    // kucuk onbellek: agac ya da sinif degismedikce ayni liste
    const sig = JSON.stringify(this.save.tree) + (this.save.cls ? `${this.save.cls.c}|${this.save.cls.sub}` : '');
    if (this._ppSig === sig && this._ppSave === this.save) return this._pp;
    const out = [];
    for (const b of Object.keys(TREE2)) for (const row of this.treeRows(b)) for (const n of row) {
      const r = this.treeRank(b, n.key);
      if (r > 0) out.push({ ...n, rank: r });
    }
    this._ppSig = sig; this._ppSave = this.save; this._pp = out;
    return out;
  },
  has(key) { return this.pickedPerks().some((pk) => pk.key === key); },
  treeBon(k) { let v = 0; for (const pk of this.pickedPerks()) if (pk.bon && pk.bon[k]) v += pk.bon[k] * pk.rank; return v; },
  // ------------------------------------------------ 0.13 sinif
  cls() { return this.save.cls && this.save.cls.c ? CLASSES[this.save.cls.c] : null; },
  sub() { return this.save.cls && this.save.cls.sub ? SUBCLASSES[this.save.cls.sub] : null; },
  combatLevel() { return Math.max(...CLASS_RULES.skills.map((k) => this.level(k))); },
  // sinif, alt sinif ve agac dugumlerinin toplam etkisi
  cmod(k) {
    let v = 0;
    const c = this.cls(); const sb = this.sub();
    if (c && c.mods[k]) v += c.mods[k];
    if (sb && sb.mods[k]) v += sb.mods[k];
    for (const pk of this.pickedPerks()) if (pk.mods && pk.mods[k]) v += pk.mods[k] * pk.rank;
    return v;
  },
  // kendi silahinda sinif bonusu (Savasci = kilic, Nisanci = yay, Buyucu/Destek = asa)
  classWeapon() { const c = this.cls(); return !!c && c.wt.includes(this.weaponType()); },
  // ilk secim ve ilk degisiklik ucretsiz, sonrasi Lale Pulu
  classChangeCost() { const cl = this.save.cls; return cl.c && cl.ch >= 1 ? CLASS_RULES.changePul : 0; },
  pickClass(c) {
    if (!CLASSES[c] || this.combatLevel() < CLASS_RULES.unlock) return false;
    const cl = this.save.cls;
    if (cl.c === c) return false;
    const cost = this.classChangeCost();
    if ((this.save.pul || 0) < cost) return false;
    this.save.pul = (this.save.pul || 0) - cost;
    if (cl.c) cl.ch++;
    cl.c = c; cl.sub = null;
    this.dropClassNodes();
    this.hp = Math.min(this.hp, this.maxHp());
    this.changed();
    return true;
  },
  // sinif degisince sinifa ozel yetenekler iade edilir (genel Sinif yetenekleri kalir)
  dropClassNodes() {
    const t = (this.save.tree || {}).savas;
    if (!t) return;
    const keys = new Set([...Object.values(CLASS_TREE), ...Object.values(SUB_TREE)].flat(2).map((n) => n.key));
    for (const k of Object.keys(t)) if (keys.has(k)) delete t[k];
  },
  pickSub(sb) {
    const d = SUBCLASSES[sb];
    if (!d || d.of !== this.save.cls.c || this.save.cls.sub || this.combatLevel() < CLASS_RULES.sub) return false;
    this.save.cls.sub = sb;
    this.changed();
    return true;
  },
  // mana (0.13 Buyu)
  maxMana() {
    return Math.round(MAGIC.base + this.level('buyu') * MAGIC.perLvl + this.gear().reduce((t, it) => t + (it.mana || 0), 0) + this.cmod('manaMax') + this.bonus('mana'));
  },
  perk(key, val = true, def = false) { return this.has(key) ? val : def; },
  eggNeed() { return this.has('yumurta_bakicisi') ? 60 : EGG_BATTLES; },
  counterMult() { return this.has('karsi_darbe') ? 2 : 1; },

  // ------------------------------------------------ statlar
  gear() {
    return Object.values(this.save.equip).filter(Boolean).map((id) => ITEMS[id]);
  },
  // 0.13.5 esya kalitesi: Nadir 1, Epik 2 ek ozellik
  rollX(id, boost = 1) {
    const it = ITEMS[id];
    if (!it || !QUALITY_KINDS.includes(it.kind) || it.legend || it.revive || it.bound) return null;
    const r = Math.random();
    const m = boost * this.dropMult();
    const q = r < QUALITY_ROLL.epik * m ? 'epik' : r < (QUALITY_ROLL.epik + QUALITY_ROLL.nadir) * m ? 'nadir' : null;
    if (!q) return null;
    const pool = Object.keys(AFFIX).filter((k) => AFFIX[k].kinds.includes(it.kind));
    const a = [];
    for (let i = 0; i < (q === 'epik' ? 2 : 1) && pool.length; i++) {
      const k = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
      const [lo, hi] = AFFIX[k].r;
      // epik ozellikler araligin ust yarisindan
      const t = q === 'epik' ? 0.5 + Math.random() * 0.5 : Math.random();
      const v = AFFIX[k].int ? Math.round(lo + (hi - lo) * t) : Math.round((lo + (hi - lo) * t) * 100) / 100;
      a.push([k, v]);
    }
    return { q, a };
  },
  // esyanin gorunen nadirligi (kalitesi daha yuksekse o)
  rarityOf(id, x) {
    const base = ITEMS[id].rarity;
    if (!x) return base;
    const order = ['siradan', 'nadir', 'epik', 'efsanevi'];
    return order.indexOf(x.q) > order.indexOf(base) ? x.q : base;
  },
  // kusanili esyalarin ek ozellikleri + efsanevi ozellikler + set bonuslari
  bonus(k) {
    let t = 0;
    for (const [slot, x] of Object.entries(this.save.eqx || {})) {
      if (!x || !this.save.equip[slot]) continue;
      for (const [ak, v] of x.a) if (ak === k) t += v;
    }
    for (const it of this.gear()) if (it.fx) for (const [ak, v] of it.fx) if (ak === k) t += v;
    for (const st of this.activeSets()) if (typeof st[k] === 'number') t += st[k];
    return t + this.treeBon(k);
  },
  // Ors (0.8.5): her arti %8 guc; esya turune islenir
  upg(id) { return (this.save.upg && this.save.upg[id]) || 0; },
  upMult(id) { return 1 + 0.08 * this.upg(id) + (CRAFTABLE.has(id) && this.has('usta_isi') ? 0.05 : 0); },
  gearStat(key) { return Object.values(this.save.equip).filter(Boolean).reduce((t, id) => t + (ITEMS[id][key] || 0) * (key === 'def' ? this.upMult(id) : 1), 0); },
  dodgeBonus() { return this.gear().reduce((t, it) => t + (it.dodge || 0), 0) + this.perk('refleks', 0.2, 0) + this.bonus('dodge'); },
  activeSets() {
    const counts = {};
    for (const it of this.gear()) if (it.set) counts[it.set] = (counts[it.set] || 0) + 1;
    // 0.13.5: 2 parca = kucuk bonus, 3 parca = tam bonus (ikisi toplanir)
    const out = [];
    for (const [set, n] of Object.entries(counts)) {
      const st = SETS[set];
      if (!st) continue;
      if (st.two) {
        if (n >= 2) out.push({ ...st.two, set, tier: 2, name: st.name });
        if (n >= 3) out.push({ ...st.full, set, tier: 3, name: st.name });
      } else if (n >= st.pieces) out.push(st);
    }
    return out;
  },
  setBonusHp() {
    return 0; // 0.13.5: bonus('hp') icinde
  },
  maxHp() {
    return Math.round((50 + 10 * this.level('can') + this.gear().reduce((t, it) => t + (it.hp || 0), 0) + this.bonus('hp')) * (1 + this.tokVal('hp')));
  },
  // ------------------------------------------------ 0.11 Tok guclendirmesi (ayni anda bir tane)
  tokVal(k) {
    const t = this.save && this.save.tok;
    if (!t || t.k !== k || Date.now() >= t.until) return 0;
    return t.v;
  },
  applyTok(id) {
    const [k, v, min] = ITEMS[id].tok;
    let ms = min * 60000;
    let tasty = false;
    this.save.tasty[id] = Math.min(this.save.tasty[id] || 0, this.countItem(id) + 1);
    if ((this.save.tasty[id] || 0) > 0) { this.save.tasty[id]--; ms *= TASTY_BONUS; tasty = true; }
    const before = this.save.tok && this.tokLeft() ? this.save.tok : null;
    this.save.tok = { id, k, v, until: Date.now() + ms };
    this.hp = Math.min(this.hp, this.maxHp());
    return `Tok: ${TOK[k].fmt(v)} (${Math.round(ms / 60000)} dk${tasty ? ', lezzetli!' : ''})${before && before.id !== id ? ` · ${ITEMS[before.id].name} etkisi bitti` : ''}`;
  },
  tokLeft() { const t = this.save.tok; return t && Date.now() < t.until ? t.until - Date.now() : 0; },
  // yemek, iksir, matara: hepsi buradan yenir. Mesajlari dondurur.
  consume(id) {
    const it = ITEMS[id];
    const msgs = [];
    if (this.removeItem(id, 1) < 1) return null;
    if (it.heal) { const h = Math.round(this.maxHp() * it.heal); this.hp = Math.min(this.maxHp(), this.hp + h); msgs.push(`+${h} can`); }
    const m30 = Date.now() + 30 * 60 * 1000;
    if (it.warm) { this.save.warmUntil = m30; msgs.push('30 dakika soğuktan etkilenmezsin'); }
    if (it.fireRes) { this.save.fireResUntil = m30; msgs.push('30 dakika lav seni yakmaz'); }
    if (it.water) { this.save.waterUntil = m30; msgs.push('30 dakika çöl sıcağından etkilenmezsin'); }
    if (it.tok) msgs.push(this.applyTok(id));
    return msgs;
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
    const gece = todNow() === 'gece' ? this.bonus('gece') : 0;
    return Math.round(this.atkBase() * m * (1 + this.tokVal('atk')) * (1 + this.bonus('atkPct') + gece));
  },
  atkBase() {
    const id = this.save.equip.silah;
    const w = id ? Math.round(ITEMS[id].power * this.upMult(id)) : 0;
    return this.level(this.atkSkill()) + w;
  },
  // Sans: nadir dusme ve parlak Glemon (seviye + tilsim)
  luck() { return this.tokVal('luck') + this.level('sans') + this.gear().reduce((t, it) => t + (it.luck || 0), 0) + this.perk('sansli_dogan', 8, 0) + this.bonus('luck'); },
  dropMult() { return 1 + this.luck() * 0.006; },
  shinyChance() { return (this.shinyMult ? this.shinyMult() : 1) * this.perk('parlak_goz', 1.5, 1) / Math.max(200, 500 - this.luck() * 2.5); },
  bagSize() { return BAG_SIZE + (this.save.bagBonus || 0); },
  def() {
    const base = this.level('savunma') + this.gearStat('def');
    const pct = this.bonus('defPct') + this.cmod('defPct');
    return Math.round(base * (1 + pct) * (1 + this.tokVal('def')));
  },
  pick() {
    const id = this.save.equip.kazma;
    return id ? ITEMS[id].pick * this.upMult(id) * (1 + this.tokVal('mine')) : 0;
  },
  rod() {
    const id = this.save.equip.olta;
    return id ? ITEMS[id].rod : null;
  },
  spd() {
    return Math.round((100 + this.gear().reduce((t, it) => t + (it.spd || 0), 0) + this.bonus('spd')) * (1 + this.tokVal('spd')));
  },
  crit() { return (this.hp < this.maxHp() * 0.3 ? this.perk('ofke', 0.2, 0) : 0) + 0.05 + this.gear().reduce((t, it) => t + (it.crit || 0), 0) + this.bonus('crit') + this.cmod('crit'); },
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
  addItem(id, n = 1, where = 'bag', boost = 1) {
    const list = this.save[where];
    this.lastRoll = null;
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
        // 0.13.5: yeni silah/zirh/tilsim bazen Nadir ya da Epik cikar (dukkan ve tasima haric: boost 0)
        if (!stackable && boost > 0) { const x = this.rollX(id, boost); if (x) { list[i].x = x; this.lastRoll = x; } }
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
    // 0.13.5: once kalitesiz olanlar gider (Nadir/Epik esya en son harcanir)
    const order = [...list.keys()].reverse().sort((a, b) => (list[a] && list[a].x ? 1 : 0) - (list[b] && list[b].x ? 1 : 0));
    for (const i of order) {
      if (left <= 0) break;
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
    const oldX = this.save.eqx[where];
    const hpRatio = this.hp / this.maxHp();
    this.save.equip[where] = slot.id;
    if (slot.x) this.save.eqx[where] = slot.x; else delete this.save.eqx[where];
    this.save.bag[index] = old ? (oldX ? { id: old, n: 1, x: oldX } : { id: old, n: 1 }) : null;
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
    this.save.bag[i] = this.save.eqx[where] ? { id, n: 1, x: this.save.eqx[where] } : { id, n: 1 };
    delete this.save.eqx[where];
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
    if (ITEMS[s.id].egg || s.x) {
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
  // 1.1 cila: odul/hediye cantaya sigmazsa Depo'ya gider (kaybolmasin). Kalan = ikisine de sigmayan
  giveSafe(id, n = 1, boost = 0) {
    let left = this.addItem(id, n, 'bag', boost);
    let depo = 0;
    if (left > 0) { const l2 = this.addItemRaw(id, left, 'depo'); depo = left - l2; left = l2; }
    this.lastGive = { id, depo, lost: left };
    return this.lastGive;
  },
  addItemRaw(id, n, where) {
    const run = this.run; this.run = null;
    const left = this.addItem(id, n, where, 0);
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

  // 0.13.5 patron gunlugu
  // 1.0 Kadim zorluk ancak Kadim Bonk yenildikten sonra
  kadimOpen() { return (this.save.stats.glemons.kadim_bonk || 0) > 0; },
  kadimOn() { return this.kadimOpen() && !!this.save.kadimMode; },
  bossLogOf(key) {
    const L = this.save.bossLog;
    return (L[key] = L[key] || { n: 0, hn: 0, best: 0, bestH: 0, rares: {} });
  },
  bossWin(key, hard, ms) {
    const b = this.bossLogOf(key);
    if (hard) { b.hn++; if (!b.bestH || ms < b.bestH) b.bestH = ms; } else { b.n++; if (!b.best || ms < b.best) b.best = ms; }
    this.changed();
  },
  bossDrop(key, id) { const b = this.bossLogOf(key); b.rares[id] = (b.rares[id] || 0) + 1; },
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
    const front = Object.values(this.save.plot.cells).reduce((t, c) => t + (c.top || c.part || c.free ? 0 : (BUILD[c.id] ? BUILD[c.id].pts : 0)), 0);
    // 0.10.5: arka duvar bloklari yarim puan
    const back = Object.values(this.save.plot.back || {}).reduce((t, c) => t + (!c.free && BUILD[c.id] ? BUILD[c.id].pts / 2 : 0), 0);
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
  petStats(p, team = null) {
    const d = GLEMONS[p.key];
    const m = petStatMult(p.lvl, p.stage);
    const bond = 1 + this.level('bag') * 0.005;
    const tr = TRAITS[p.huy] || {};
    const ps = passiveOf(p.key) || {};
    const ac = (p.acc && ITEMS[p.acc] && ITEMS[p.acc].acc) || {};
    const heart = 1 + this.hearts(p) * BOND.stat;
    const sy = 1 + (team ? team.sync : 0);
    const f = (k) => 1 + (tr[k] || 0) + (ps[k] || 0) + (ac[k] || 0);
    const sh = p.shiny ? 1.1 : 1;
    return {
      maxHp: Math.round(d.hp * m * sh * f('hp') * heart * sy * (1 + this.cmod('petHp'))),
      atk: d.atk * m * bond * sh * this.perk('sadik_dost', 1.15, 1) * f('atk') * heart * sy * (1 + this.cmod('petAtk')),
      def: d.def * m * 0.6 * f('def') * heart * sy,
      spd: Math.round(d.spd * f('spd')),
    };
  },
  // 0.12 bag kalbi: 100 puan = 1 kalp (en fazla 5)
  hearts(p) { return Math.min(BOND.max, Math.floor((p.kalp || 0) / BOND.per)); },
  addBond(p, n) {
    const before = this.hearts(p);
    p.kalp = Math.min(BOND.max * BOND.per, (p.kalp || 0) + Math.round(n));
    return this.hearts(p) > before ? this.hearts(p) : 0;
  },
  // savasa giren yoldaslar (1 ya da Bag 50'de 2)
  teamPets() {
    const a = this.activePet();
    const b = this.level('bag') >= TEAM.bag2 ? this.save.pets.find((p) => p.id === this.save.pet2 && p.id !== this.save.pet) : null;
    return [a, b].filter(Boolean);
  },
  addPet(key, stage, shiny, lvl, huy = null) {
    if (this.save.pets.length >= this.ahirSize()) return null;
    const tk = Object.keys(TRAITS);
    const p = { id: this.save.petSeq++, key, stage, shiny: !!shiny, lvl: Math.max(1, lvl), xp: petXpFor(Math.max(1, lvl)), t: Date.now(),
      huy: TRAITS[huy] ? huy : tk[Math.floor(Math.random() * tk.length)], kalp: 0, rt: Date.now(), acc: null };
    this.save.pets.push(p);
    this.save.album.tamed[key] = true;
    this.save.album.seen[key] = true;
    if (shiny) this.save.album.shiny[key] = true;
    if (!this.save.pet) this.save.pet = p.id;
    return p;
  },
  releasePet(id) {
    const p = this.save.pets.find((x) => x.id === id);
    if (p && p.acc) this.addItem(p.acc, 1);
    this.save.pets = this.save.pets.filter((x) => x.id !== id);
    if (this.save.pet === id) this.save.pet = null;
    if (this.save.pet2 === id) this.save.pet2 = null;
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
