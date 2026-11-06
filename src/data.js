// Oyun verileri: karakterler, Glemonlar, esyalar, sabitler.
// Denge sayilari Oyun Tasarim Belgesi'nden gelir ve test ederken ayarlanir.

export const GAME_W = 384;
export const GAME_H = 216;
export const GROUND_Y = 178;
export const VERSION = '0.1';

// Her karakter sadece kendi koduyla secilebilir. Kodun kendisi burada degil,
// sadece SHA-256 ozeti tutulur. (Bulut hesaplari 0.6 surumunde gelecek.)
export const CHARACTERS = [
  { key: 'dunstable', name: 'dunstable', hash: 'a9a7a3be4f37356f6ffa8980c1503a76c45b741576378dcc319d66cf55f81d93' },
  { key: 'chegn', name: 'chegn', hash: 'c734bb92345401d81c4af18522bd79f20cc242327628df337cf7726ca270dbdb' },
  { key: 'bonk', name: 'bonk', hash: '8aa05c8b979de923f929e3d16b6844cdb89f3237bba6bdbdbba207974a99fbc9' },
];

// Oyuncunun kullandigi karakter animasyonlari (yan gorunum)
export const CHAR_ANIMS = ['idle', 'walk', 'run', 'stab', 'punch', 'hurt', 'death', 'drinkpotion',
  'eat', 'cheer', 'joy', 'levelup', 'sit', 'vanish', 'ninjadash', 'jump', 'sneakwalk', 'surprise',
  'spin', 'totem', 'wave'];

export const RARITY = {
  siradan: { name: 'Sıradan', color: '#c4c4bc' },
  nadir: { name: 'Nadir', color: '#62d862' },
  epik: { name: 'Epik', color: '#c08cff' },
  efsanevi: { name: 'Efsanevi', color: '#ffd04d' },
};

export const SKILLS = [
  { key: 'saldiri', name: 'Saldırı', desc: 'Kılıç ve yumrukla Glemon yenince artar. ATK ve yeni yetenekler.' },
  { key: 'savunma', name: 'Savunma', desc: 'Hasar alınca ve kaçınınca artar. DEF.' },
  { key: 'can', name: 'Can', desc: 'Her savaşta artar. Her seviye +10 can.' },
  { key: 'okculuk', name: 'Okçuluk', soon: '0.5' },
  { key: 'madencilik', name: 'Madencilik', soon: '0.2' },
  { key: 'toplama', name: 'Toplama', soon: '0.2' },
  { key: 'uretim', name: 'Üretim', soon: '0.2' },
  { key: 'insa', name: 'İnşa', soon: '0.3' },
  { key: 'sans', name: 'Şans', soon: '0.5' },
  { key: 'bag', name: 'Glemon Bağı', soon: '0.4' },
];

// ---------------------------------------------------------------- Glemonlar
// Statlar 1. kattaki degerlerdir; kat arttikca carpan buyur (floorMult).
export const GLEMONS = {
  kutukcuk: {
    name: 'Kütükçük', from: "Kütükçük'ten", rarity: 'siradan', type: 'Orman',
    hp: 14, atk: 3, def: 3, spd: 85,
    special: { name: 'Kafa Atma', mult: 1.6, telegraph: true }, every: 3,
    drops: [['dal', 0.40], ['tahta_kilic', 0.03]],
  },
  patlakmantar: {
    name: 'Patlakmantar', from: "Patlakmantar'dan", rarity: 'siradan', type: 'Orman',
    hp: 11, atk: 2.4, def: 1, spd: 95,
    special: { name: 'Spor Bulutu', mult: 0.8, status: ['zehir', 4], telegraph: true }, every: 3,
    drops: [['mantar', 0.20]],
  },
  dikentavsan: {
    name: 'Dikentavşan', from: "Dikentavşan'dan", rarity: 'siradan', type: 'Orman',
    hp: 10, atk: 3, def: 1, spd: 130,
    special: { name: 'Diken Fırlatma', mult: 1.4, telegraph: true }, every: 3,
    drops: [['diken', 0.30], ['diken_kilici', 0.015]],
  },
  yaprakbocek: {
    name: 'Yaprakböcek', from: "Yaprakböcek'ten", rarity: 'nadir', type: 'Orman',
    hp: 16, atk: 3.8, def: 3, spd: 110,
    special: { name: 'Yaprak Fırlatma', mult: 1.7, telegraph: true }, every: 3,
    drops: [['yaprak_kanadi', 0.08], ['yaprak_tilsimi', 0.02]],
  },
  yosunbaba: {
    name: 'Yosunbaba', from: "Yosunbaba'dan", rarity: 'epik', type: 'Orman',
    hp: 24, atk: 3, def: 6, spd: 70,
    special: { name: 'İyileştiren Yosun', heal: 0.25 }, every: 2,
    drops: [['antik_yosun', 0.10], ['yosun_gogus', 0.10], ['yosun_kask', 0.10]],
  },
  agacbasi: {
    name: 'Ağaçbaşı', from: "Ağaçbaşı'ndan", rarity: 'efsanevi', type: 'Orman', boss: true,
    hp: 85, atk: 4.2, def: 3.2, spd: 85,
    pattern: ['normal', 'kok', 'normal', 'cagir', 'normal', 'darbe'],
    specials: {
      kok: { name: 'Kök Sarması', mult: 1.0, status: ['sersem', 1], telegraph: true },
      darbe: { name: 'Dev Darbe', mult: 2.0, telegraph: true },
      cagir: { name: 'Köklerden Çağrı', summon: 'kutukcuk' },
    },
    drops: [['agac_kalbi', 1], ['kabuk_zirh', 0.03]],
  },
};

export const SPAWN_TABLE = [
  ['kutukcuk', 0.27], ['patlakmantar', 0.27], ['dikentavsan', 0.26],
  ['yaprakbocek', 0.17], ['yosunbaba', 0.03],
];
export const SHINY_CHANCE = 1 / 500;

export const floorMult = (floor) => 1 + 0.22 * (floor - 1);

// ---------------------------------------------------------------- Esyalar
// kind: malzeme | tuketim | silah | kask | gogus | bot | tilsim
export const ITEMS = {
  dal: { name: 'Dal parçası', kind: 'malzeme', rarity: 'siradan', icon: 'dal', desc: 'Kütükçükten düşer. Tahta eşyalar için (0.2).' },
  mantar: { name: 'Mantar şapkası', kind: 'malzeme', rarity: 'siradan', icon: 'mantar', desc: 'Çorba ve yem malzemesi (0.2).' },
  diken: { name: 'Diken', kind: 'malzeme', rarity: 'siradan', icon: 'diken', desc: 'Dikentavşandan düşer.' },
  yaprak_kanadi: { name: 'Yaprak kanadı', kind: 'malzeme', rarity: 'nadir', icon: 'yaprak', desc: 'Yaprakböcekten düşer. Hafif ve sağlam.' },
  antik_yosun: { name: 'Antik yosun', kind: 'malzeme', rarity: 'epik', icon: 'yosun', desc: 'Yosunbabanın sakalından. Can Tılsımı malzemesi.' },
  agac_kalbi: { name: 'Ağaç Kalbi', kind: 'malzeme', rarity: 'nadir', icon: 'kalp', bound: true, desc: 'Ağaçbaşının çekirdeği. Takas edilemez.' },
  iksir_k: { name: 'Küçük Can İksiri', kind: 'tuketim', rarity: 'siradan', icon: 'iksir', heal: 0.25, anim: 'drinkpotion', desc: 'Canının %25\'ini doldurur.' },
  pasli_kilic: { name: 'Paslı Kılıç', kind: 'silah', rarity: 'siradan', icon: 'kilic_pas', power: 4, desc: 'Herkesin ilk kılıcı.' },
  tahta_kilic: { name: 'Tahta Kılıç', kind: 'silah', rarity: 'siradan', icon: 'kilic_tahta', power: 6, desc: 'Kütükçükten düşer.' },
  diken_kilici: { name: 'Diken Kılıcı', kind: 'silah', rarity: 'nadir', icon: 'kilic_diken', power: 9, req: ['saldiri', 5], desc: 'Dikentavşandan çok nadir düşer.' },
  yosun_kask: { name: 'Yosun Kask', kind: 'kask', rarity: 'siradan', icon: 'kask_yosun', def: 2, set: 'yosun', desc: 'Yosunbabadan düşer, sandıklarda da çıkabilir.' },
  yosun_gogus: { name: 'Yosun Göğüslük', kind: 'gogus', rarity: 'siradan', icon: 'gogus_yosun', def: 4, set: 'yosun', desc: 'Yosunbabadan düşer, sandıklarda da çıkabilir.' },
  yosun_bot: { name: 'Yosun Bot', kind: 'bot', rarity: 'siradan', icon: 'bot_yosun', def: 2, spd: 5, set: 'yosun', desc: 'Sandıklarda bulunur.' },
  kabuk_zirh: { name: 'Kabuk Zırh', kind: 'gogus', rarity: 'epik', icon: 'gogus_kabuk', def: 9, hp: 10, req: ['savunma', 8], desc: 'Ağaçbaşının kabuğundan. Çok nadir.' },
  yaprak_tilsimi: { name: 'Yaprak Tılsımı', kind: 'tilsim', rarity: 'nadir', icon: 'tilsim_yaprak', spd: 15, desc: 'Hız +15.' },
};

export const SETS = { yosun: { pieces: 3, hp: 15, name: 'Yosun seti' } };

export const SLOTS = [
  ['silah', 'Silah'], ['kask', 'Kask'], ['gogus', 'Göğüslük'], ['bot', 'Bot'], ['tilsim', 'Tılsım'],
];

export const BAG_SIZE = 20;
export const STACK = 99;

// Sandik odasi esya havuzu
export const CHEST_GEAR = [['tahta_kilic', 3], ['yosun_kask', 3], ['yosun_bot', 3], ['yosun_gogus', 2], ['diken_kilici', 0.5]];
export const CHEST_MATS = ['dal', 'mantar', 'diken'];

// Kat odalari (0.1): madencilik ve gizli oda 0.2'de gelecek
export const ROOM_WEIGHTS = [['savas', 55], ['sandik', 14], ['tuzak', 12], ['uyuyan', 10], ['kamp', 9]];

export const ZONES = [
  { key: 'orman', name: 'Yabani Orman', floors: [1, 10], open: true },
  { key: 'magara', name: 'Yankı Mağaraları', floors: [11, 20], soon: '0.5' },
  { key: 'col', name: 'Kavurucu Çöl', floors: [21, 30], soon: '0.5' },
  { key: 'buz', name: 'Donmuş Zirve', floors: [31, 40], soon: '0.8' },
  { key: 'kor', name: 'Kor Diyarı', floors: [41, 50], soon: '0.8' },
  { key: 'golge', name: 'Gölge Boşluğu', floors: [51, 60], soon: '0.8' },
];
