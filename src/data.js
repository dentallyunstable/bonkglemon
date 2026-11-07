// Oyun verileri: karakterler, Glemonlar, esyalar, sabitler.
// Denge sayilari Oyun Tasarim Belgesi'nden gelir ve test ederken ayarlanir.

export const GAME_W = 384;
export const GAME_H = 216;
export const GROUND_Y = 178;
export const VERSION = '0.3.0';

// Her karakter sadece kendi koduyla secilebilir. Kodun kendisi burada degil,
// sadece SHA-256 ozeti tutulur. (Bulut hesaplari 0.6 surumunde gelecek.)
export const CHARACTERS = [
  { key: 'dunstable', name: 'dunstable', hash: 'a9a7a3be4f37356f6ffa8980c1503a76c45b741576378dcc319d66cf55f81d93' },
  { key: 'chegn', name: 'chegn', hash: 'c734bb92345401d81c4af18522bd79f20cc242327628df337cf7726ca270dbdb' },
  { key: 'bonk', name: 'bonk', hash: '8aa05c8b979de923f929e3d16b6844cdb89f3237bba6bdbdbba207974a99fbc9' },
];

// Karakter animasyonlari tools/convert_chars.py ile tek bir atlas resmine donusur.
// Kural (Eren, 2026-11-07): hareket ederken yandan, dururken 3/4 onden gorunur.
// Ayni ise yarayan animasyonlardan her seferinde rastgele biri oynar:
export const ANIM_POOLS = {
  sevinc: ['cheer', 'clap', 'joy', 'piglindance'],
  olum: ['death', 'explosion', 'mcdeath', 'vanish'],
  kacinma: ['jump', 'mcjump', 'shake'],
};
// Para birimi: Cimen Blogu (kayitta hala "gold" alani)
export const CURRENCY = 'Çimen Bloğu';

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
  { key: 'madencilik', name: 'Madencilik', desc: 'Maden Ocağı\'nda ve maden damarlarında kazınca artar. Yeni cevherler ve kazmalar.' },
  { key: 'toplama', name: 'Toplama', desc: 'Zindanda ot, böğürtlen ve dal toplayınca artar. Her 10 seviyede +1 fazla toplarsın.' },
  { key: 'uretim', name: 'Üretim', desc: 'Evindeki Masa, Fırın ve Kazan\'da üretince artar. Yeni tarifler açar.' },
  { key: 'insa', name: 'İnşa', desc: 'Arsana blok ve eşya koyunca artar. Yeni bloklar açar, arsan büyür (20, 40, 60).' },
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
    pattern: ['normal', 'kok', 'normal', 'cagir', 'normal', 'darbe', 'normal', 'recine'],
    specials: {
      kok: { name: 'Kök Sarması', mult: 1.0, status: ['sersem', 1], telegraph: true },
      darbe: { name: 'Dev Darbe', mult: 2.0, telegraph: true },
      cagir: { name: 'Köklerden Çağrı', summon: 'kutukcuk' },
      recine: { name: 'Yanan Reçine', mult: 0.8, status: ['yanma', 3], telegraph: true },
    },
    drops: [['agac_kalbi', 1], ['kabuk_zirh', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08]],
  },
};

export const SPAWN_TABLE = [
  ['kutukcuk', 0.27], ['patlakmantar', 0.27], ['dikentavsan', 0.26],
  ['yaprakbocek', 0.17], ['yosunbaba', 0.03],
];
export const SHINY_CHANCE = 1 / 500;

export const floorMult = (floor) => 1 + 0.22 * (floor - 1);

// ---------------------------------------------------------------- Esyalar
// kind: malzeme | tuketim | silah | kask | gogus | bot | tilsim | kazma
export const ITEMS = {
  // ---- dusen malzemeler
  dal: { name: 'Dal parçası', kind: 'malzeme', rarity: 'siradan', icon: 'dal', desc: 'Kütükçükten düşer, zindanda da toplanır. Tahta eşyaların ana malzemesi.' },
  mantar: { name: 'Mantar şapkası', kind: 'malzeme', rarity: 'siradan', icon: 'mantar', desc: 'Patlakmantardan düşer. Çorba ve Bonk Bombası malzemesi.' },
  diken: { name: 'Diken', kind: 'malzeme', rarity: 'siradan', icon: 'diken', desc: 'Dikentavşandan düşer.' },
  yaprak_kanadi: { name: 'Yaprak kanadı', kind: 'malzeme', rarity: 'nadir', icon: 'yaprak', desc: 'Yaprakböcekten düşer. Hafif ve sağlam.' },
  antik_yosun: { name: 'Antik yosun', kind: 'malzeme', rarity: 'epik', icon: 'yosun', desc: 'Yosunbabanın sakalından. Can Tılsımı malzemesi.' },
  agac_kalbi: { name: 'Ağaç Kalbi', kind: 'malzeme', rarity: 'nadir', icon: 'kalp', bound: true, desc: 'Ağaçbaşının çekirdeği. Takas edilemez.' },
  // ---- maden
  tas: { name: 'Taş parçası', kind: 'malzeme', rarity: 'siradan', icon: 'tas', desc: 'Maden Ocağında kazılır. Taş eşyalar ve Taş Tuğla.' },
  kum: { name: 'Kum', kind: 'malzeme', rarity: 'siradan', icon: 'kum', desc: 'Ocağın üst katlarında. Fırında şişe ve cam olur.' },
  komur: { name: 'Kömür', kind: 'malzeme', rarity: 'siradan', icon: 'komur', desc: 'Fırın yakıtı ve Bonk Bombası malzemesi.' },
  demir_cevheri: { name: 'Demir cevheri', kind: 'malzeme', rarity: 'siradan', icon: 'demir_cevheri', desc: 'Ocağın derinlerinde (Derinlik 2+). Fırında külçe olur.' },
  demir_kulcesi: { name: 'Demir külçesi', kind: 'malzeme', rarity: 'siradan', icon: 'kulce', desc: 'Fırında eritilir. Demir eşyaların ana malzemesi.' },
  // ---- toplama
  sifali_ot: { name: 'Şifalı ot', kind: 'malzeme', rarity: 'siradan', icon: 'ot', desc: 'Zindanda toplanır. İksir ve çorba malzemesi.' },
  bogurtlen: { name: 'Böğürtlen', kind: 'tuketim', rarity: 'siradan', icon: 'bogurtlen', heal: 0.1, food: true, anim: 'eat', desc: 'Zindanda toplanır. Yersen biraz can verir. Glemon yemi malzemesi (0.4).' },
  bal: { name: 'Bal', kind: 'malzeme', rarity: 'nadir', icon: 'bal', desc: 'Toplarken nadiren bulunur. Özel Glemon yemi malzemesi (0.4).' },
  // ---- uretilenler
  bos_sise: { name: 'Boş şişe', kind: 'malzeme', rarity: 'siradan', icon: 'sise', desc: 'Fırında kumdan yapılır. İksir şişesi.' },
  tahta_kalas: { name: 'Tahta Kalas', kind: 'malzeme', rarity: 'siradan', icon: 'kalas', desc: 'İnşa bloğu. Arsana koyabilirsin.' },
  tas_tugla: { name: 'Taş Tuğla', kind: 'malzeme', rarity: 'siradan', icon: 'tugla', desc: 'İnşa bloğu. Arsana koyabilirsin.' },
  cam: { name: 'Cam', kind: 'malzeme', rarity: 'siradan', icon: 'cam', desc: 'İnşa bloğu (pencere). Arsana koyabilirsin.' },
  // ---- insa (0.3)
  kutuk: { name: 'Kütük', kind: 'malzeme', rarity: 'siradan', icon: 'kutuk', desc: 'İnşa bloğu: ağaç gövdesi, ev köşesi.' },
  kaldirim: { name: 'Kaldırım Taşı', kind: 'malzeme', rarity: 'siradan', icon: 'kaldirim', desc: 'İnşa bloğu: sağlam temel.' },
  kiremit: { name: 'Kiremit', kind: 'malzeme', rarity: 'siradan', icon: 'kiremit', desc: 'İnşa bloğu: çatı.' },
  yaprak_blogu: { name: 'Yaprak Bloğu', kind: 'malzeme', rarity: 'siradan', icon: 'yaprak_blok', desc: 'İnşa bloğu: ağaç tacı, çit, süs.' },
  cit: { name: 'Çit', kind: 'malzeme', rarity: 'siradan', icon: 'cit', desc: 'İnşa eşyası: bahçe çiti.' },
  fener: { name: 'Fener', kind: 'malzeme', rarity: 'siradan', icon: 'fener', desc: 'İnşa eşyası: asılı fener.' },
  ahsap_kapi: { name: 'Ahşap Kapı', kind: 'malzeme', rarity: 'siradan', icon: 'kapi', desc: 'İnşa eşyası: 2 blok boyunda kapı.' },
  tarla: { name: 'Bahçe Tarlası', kind: 'malzeme', rarity: 'siradan', icon: 'tarla', desc: 'Arsanın zeminine koyulur. Tohum ekip ot ve böğürtlen yetiştirirsin.' },
  ot_tohumu: { name: 'Ot tohumu', kind: 'malzeme', rarity: 'siradan', icon: 'tohum_ot', desc: 'Şifalı ot toplarken bazen çıkar. Bahçe tarlasına ekilir (1 saat).' },
  bogurtlen_tohumu: { name: 'Böğürtlen tohumu', kind: 'malzeme', rarity: 'siradan', icon: 'tohum_bogurtlen', desc: 'Böğürtlen toplarken bazen çıkar. Bahçe tarlasına ekilir (2 saat).' },
  // ---- tuketilebilir
  iksir_k: { name: 'Küçük Can İksiri', kind: 'tuketim', rarity: 'siradan', icon: 'iksir', heal: 0.25, anim: 'drinkpotion', desc: 'Canının %25\'ini doldurur.' },
  mantar_corbasi: { name: 'Mantar Çorbası', kind: 'tuketim', rarity: 'siradan', icon: 'corba', heal: 0.3, food: true, anim: 'eat', desc: 'Canının %30\'unu doldurur.' },
  altin_elma: { name: 'Altın Elma', kind: 'tuketim', rarity: 'epik', icon: 'altin_elma', heal: 0.4, golden: true, battleOnly: true, anim: 'goldenapple', desc: 'Çok nadir. Savaşta yersen canının %40\'ı dolar, 5 tur boyunca saldırın ve savunman %30 artar.' },
  bonk_bombasi: { name: 'Bonk Bombası', kind: 'tuketim', rarity: 'nadir', icon: 'bomba', bomb: true, desc: 'Savaşta bütün Glemonlara vurur, madende 3×3 bloğu tek seferde kırar.' },
  // ---- silahlar
  pasli_kilic: { name: 'Paslı Kılıç', kind: 'silah', rarity: 'siradan', icon: 'kilic_pas', power: 4, desc: 'Herkesin ilk kılıcı.' },
  tahta_kilic: { name: 'Tahta Kılıç', kind: 'silah', rarity: 'siradan', icon: 'kilic_tahta', power: 6, desc: 'Kütükçükten düşer ya da Üretim Masasında yapılır.' },
  diken_kilici: { name: 'Diken Kılıcı', kind: 'silah', rarity: 'nadir', icon: 'kilic_diken', power: 9, req: ['saldiri', 5], desc: 'Dikentavşandan çok nadir düşer.' },
  tas_kilic: { name: 'Taş Kılıç', kind: 'silah', rarity: 'siradan', icon: 'kilic_tas', power: 10, req: ['saldiri', 10], desc: 'Üretim Masasında yapılır.' },
  demir_kilic: { name: 'Demir Kılıç', kind: 'silah', rarity: 'siradan', icon: 'kilic_demir', power: 15, req: ['saldiri', 20], desc: 'Üretim Masasında yapılır.' },
  // ---- kazmalar
  tahta_kazma: { name: 'Tahta Kazma', kind: 'kazma', rarity: 'siradan', icon: 'kazma_tahta', pick: 1, desc: 'Herkesin ilk kazması.' },
  tas_kazma: { name: 'Taş Kazma', kind: 'kazma', rarity: 'siradan', icon: 'kazma_tas', pick: 2, req: ['madencilik', 10], desc: 'İki kat hızlı kazar.' },
  demir_kazma: { name: 'Demir Kazma', kind: 'kazma', rarity: 'siradan', icon: 'kazma_demir', pick: 4, req: ['madencilik', 20], desc: 'Dört kat hızlı kazar.' },
  // ---- zirhlar
  tahta_kask: { name: 'Tahta Kask', kind: 'kask', rarity: 'siradan', icon: 'kask_tahta', def: 2, set: 'tahta', desc: 'Üretim Masasında yapılır.' },
  tahta_gogus: { name: 'Tahta Göğüslük', kind: 'gogus', rarity: 'siradan', icon: 'gogus_tahta', def: 3, set: 'tahta', desc: 'Üretim Masasında yapılır.' },
  tahta_bot: { name: 'Tahta Bot', kind: 'bot', rarity: 'siradan', icon: 'bot_tahta', def: 1, set: 'tahta', desc: 'Üretim Masasında yapılır.' },
  tas_kask: { name: 'Taş Kask', kind: 'kask', rarity: 'siradan', icon: 'kask_tas', def: 3, set: 'tas', req: ['savunma', 10], desc: 'Üretim Masasında yapılır.' },
  tas_gogus: { name: 'Taş Göğüslük', kind: 'gogus', rarity: 'siradan', icon: 'gogus_tas', def: 6, set: 'tas', req: ['savunma', 10], desc: 'Üretim Masasında yapılır.' },
  tas_bot: { name: 'Taş Bot', kind: 'bot', rarity: 'siradan', icon: 'bot_tas', def: 3, set: 'tas', req: ['savunma', 10], desc: 'Üretim Masasında yapılır.' },
  demir_kask: { name: 'Demir Kask', kind: 'kask', rarity: 'siradan', icon: 'kask_demir', def: 5, set: 'demir', req: ['savunma', 20], desc: 'Üretim Masasında yapılır.' },
  demir_gogus: { name: 'Demir Göğüslük', kind: 'gogus', rarity: 'siradan', icon: 'gogus_demir', def: 10, set: 'demir', req: ['savunma', 20], desc: 'Üretim Masasında yapılır.' },
  demir_bot: { name: 'Demir Bot', kind: 'bot', rarity: 'siradan', icon: 'bot_demir', def: 5, set: 'demir', req: ['savunma', 20], desc: 'Üretim Masasında yapılır.' },
  yosun_kask: { name: 'Yosun Kask', kind: 'kask', rarity: 'siradan', icon: 'kask_yosun', def: 2, set: 'yosun', desc: 'Yosunbabadan düşer, sandıklarda da çıkabilir.' },
  yosun_gogus: { name: 'Yosun Göğüslük', kind: 'gogus', rarity: 'siradan', icon: 'gogus_yosun', def: 4, set: 'yosun', desc: 'Yosunbabadan düşer, sandıklarda da çıkabilir.' },
  yosun_bot: { name: 'Yosun Bot', kind: 'bot', rarity: 'siradan', icon: 'bot_yosun', def: 2, spd: 5, set: 'yosun', desc: 'Sandıklarda bulunur.' },
  kabuk_zirh: { name: 'Kabuk Zırh', kind: 'gogus', rarity: 'epik', icon: 'gogus_kabuk', def: 9, hp: 10, req: ['savunma', 8], desc: 'Ağaçbaşının kabuğundan. Çok nadir.' },
  yaprak_tilsimi: { name: 'Yaprak Tılsımı', kind: 'tilsim', rarity: 'nadir', icon: 'tilsim_yaprak', spd: 15, desc: 'Hız +15.' },
  can_tilsimi: { name: 'Can Tılsımı', kind: 'tilsim', rarity: 'epik', icon: 'tilsim_can', revive: 0.3, desc: 'Takılıyken savaşta canın biterse seni bir kez %30 canla ayağa kaldırır, sonra kırılır.' },
};

export const SETS = {
  yosun: { pieces: 3, hp: 15, name: 'Yosun seti', bonus: '+15 can' },
  tahta: { pieces: 3, name: 'Tahta seti', bonus: 'bonus yok' },
  tas: { pieces: 3, hp: 5, name: 'Taş seti', bonus: '+5 can' },
  demir: { pieces: 3, defPct: 0.1, name: 'Demir seti', bonus: 'Savunma +%10' },
};

export const SLOTS = [
  ['silah', 'Silah'], ['kask', 'Kask'], ['gogus', 'Göğüslük'], ['bot', 'Bot'], ['tilsim', 'Tılsım'], ['kazma', 'Kazma'],
];

export const BAG_SIZE = 20;
export const STACK = 99;

// Sandik odasi esya havuzu
export const CHEST_GEAR = [['tahta_kilic', 3], ['yosun_kask', 3], ['yosun_bot', 3], ['yosun_gogus', 2], ['diken_kilici', 0.5]];
export const CHEST_MATS = ['dal', 'mantar', 'diken', 'sifali_ot', 'komur'];

// Kat odalari
export const ROOM_WEIGHTS = [['savas', 52], ['sandik', 13], ['tuzak', 11], ['uyuyan', 10], ['kamp', 8], ['maden', 8]];
// savastan sonra odada toplanacak bir sey cikma ihtimali
export const GATHER_CHANCE = 0.4;

export const ZONES = [
  { key: 'orman', name: 'Yabani Orman', floors: [1, 10], open: true },
  { key: 'magara', name: 'Yankı Mağaraları', floors: [11, 20], soon: '0.5' },
  { key: 'col', name: 'Kavurucu Çöl', floors: [21, 30], soon: '0.5' },
  { key: 'buz', name: 'Donmuş Zirve', floors: [31, 40], soon: '0.8' },
  { key: 'kor', name: 'Kor Diyarı', floors: [41, 50], soon: '0.8' },
  { key: 'golge', name: 'Gölge Boşluğu', floors: [51, 60], soon: '0.8' },
];

// ---------------------------------------------------------------- Madencilik (0.2)
// sertlik / kazma gucu = kac vurusta kirilir. XP tasarim belgesindekinin 5 katidir
// (bizim seviye egrimiz daha dik oldugu icin).
export const ORES = {
  toprak: { name: 'Toprak', hard: 1, xp: 3, req: 1, drop: null },
  kum: { name: 'Kum', hard: 1, xp: 6, req: 1, drop: 'kum' },
  tas: { name: 'Taş', hard: 2, xp: 10, req: 1, drop: 'tas' },
  komur: { name: 'Kömür', hard: 3, xp: 25, req: 1, drop: 'komur' },
  demir: { name: 'Demir', hard: 6, xp: 75, req: 15, drop: 'demir_cevheri' },
  define: { name: 'Define sandığı', hard: 3, xp: 30, req: 1, drop: null },
};
export const MINE_COLS = 8;
export const MINE_ROWS = 6;
export const DEFINE_CHANCE = 0.006;

// derinlige gore duvarin icerigi
export function oreWeights(depth) {
  if (depth <= 1) return [['toprak', 22], ['tas', 50], ['kum', 13], ['komur', 15]];
  if (depth === 2) return [['toprak', 6], ['tas', 56], ['kum', 12], ['komur', 20], ['demir', 6]];
  return [['tas', 54], ['kum', 7], ['komur', 23], ['demir', Math.min(22, 10 + (depth - 3) * 3)]];
}
export const mineXpMult = (depth) => Math.min(1.5, 1 + 0.05 * (depth - 1));
export const mineHardBonus = (depth) => Math.floor((depth - 1) / 4);

// ---------------------------------------------------------------- Toplama (0.2)
export const GATHER = {
  sifali_ot: { name: 'Şifalı ot', node: 'herb', xp: 20, w: 40 },
  bogurtlen: { name: 'Böğürtlen', node: 'berry', xp: 20, w: 35 },
  dal: { name: 'Dal', node: 'branch', xp: 15, w: 25 },
};
export const BAL_CHANCE = 0.06;

// ---------------------------------------------------------------- Uretim (0.2)
// station: masa = Uretim Masasi (aninda), firin = Firin (her biri 5 sn), kazan = Simya Kazani (aninda)
// Tarif, ilk malzemesini bir kez bulunca tarif defterinde acilir.
export const FURNACE_MS = 5000;
export const FURNACE_MAX = 20;
export const STATIONS = {
  masa: { name: 'Üretim Masası', desc: 'Silah, kazma, zırh ve inşa blokları.' },
  firin: { name: 'Fırın', desc: 'Eritme ve pişirme. Her biri 5 saniye sürer, sen yokken de çalışır.' },
  kazan: { name: 'Simya Kazanı', desc: 'İksirler ve bombalar.' },
};
const gearSet = (tier, main, lvl, xpEach) => [
  { out: `${tier}_kilic`, mats: { [main]: 3, dal: 1 } },
  { out: `${tier}_kazma`, mats: { [main]: 3, dal: 2 } },
  { out: `${tier}_kask`, mats: { [main]: 5 } },
  { out: `${tier}_gogus`, mats: { [main]: 8 } },
  { out: `${tier}_bot`, mats: { [main]: 4 } },
].map((r) => ({ ...r, station: 'masa', lvl, xp: xpEach * r.mats[main] }));

export const RECIPES = [
  { out: 'tahta_kalas', mats: { dal: 2 }, station: 'masa', lvl: 1, xp: 15 },
  { out: 'tahta_kilic', mats: { dal: 5 }, station: 'masa', lvl: 1, xp: 50 },
  { out: 'tahta_kazma', mats: { dal: 5 }, station: 'masa', lvl: 1, xp: 50 },
  { out: 'tahta_kask', mats: { dal: 5 }, station: 'masa', lvl: 2, xp: 50 },
  { out: 'tahta_gogus', mats: { dal: 8 }, station: 'masa', lvl: 2, xp: 80 },
  { out: 'tahta_bot', mats: { dal: 4 }, station: 'masa', lvl: 2, xp: 40 },
  { out: 'tas_tugla', mats: { tas: 2 }, station: 'masa', lvl: 3, xp: 20 },
  ...gearSet('tas', 'tas', 5, 15),
  ...gearSet('demir', 'demir_kulcesi', 12, 45),
  { out: 'demir_kulcesi', mats: { demir_cevheri: 2, komur: 1 }, station: 'firin', lvl: 1, xp: 35 },
  { out: 'bos_sise', mats: { kum: 2 }, station: 'firin', lvl: 1, xp: 12 },
  { out: 'cam', mats: { kum: 1 }, station: 'firin', lvl: 4, xp: 8 },
  { out: 'mantar_corbasi', mats: { mantar: 2, sifali_ot: 1 }, station: 'firin', lvl: 3, xp: 40 },
  { out: 'iksir_k', mats: { sifali_ot: 2, bos_sise: 1 }, station: 'kazan', lvl: 5, xp: 55 },
  { out: 'bonk_bombasi', mats: { komur: 3, mantar: 2 }, station: 'kazan', lvl: 10, xp: 90 },
  { out: 'can_tilsimi', mats: { antik_yosun: 2, sifali_ot: 3, bal: 1 }, station: 'kazan', lvl: 8, xp: 250 },
  // 0.3 insa (sona eklenir: firin isleri tarifin sirasiyla kaydedilir)
  { out: 'kutuk', mats: { dal: 3 }, station: 'masa', lvl: 1, xp: 18 },
  { out: 'kaldirim', mats: { tas: 1 }, station: 'masa', lvl: 2, xp: 8 },
  { out: 'cit', mats: { dal: 2 }, station: 'masa', lvl: 1, xp: 12 },
  { out: 'tarla', mats: { dal: 4, sifali_ot: 1 }, station: 'masa', lvl: 2, xp: 30 },
  { out: 'ahsap_kapi', mats: { tahta_kalas: 3 }, station: 'masa', lvl: 4, xp: 30 },
  { out: 'yaprak_blogu', n: 4, mats: { yaprak_kanadi: 1 }, station: 'masa', lvl: 6, xp: 30 },
  { out: 'fener', mats: { demir_kulcesi: 1, komur: 1 }, station: 'masa', lvl: 12, xp: 60 },
  { out: 'kiremit', mats: { kum: 2, komur: 1 }, station: 'firin', lvl: 6, xp: 14 },
];

// ---------------------------------------------------------------- Takas Tezgahi (0.2.1)
// Fiyatlar Cimen Blogu. Satis fiyati uretim maliyetinden dusuk tutulur.
export const SHOP = [
  { id: 'iksir_k', price: 30 },
  { id: 'mantar_corbasi', price: 35 },
  { id: 'bos_sise', price: 10 },
  { id: 'sifali_ot', price: 8 },
  { id: 'komur', price: 6 },
  { id: 'ot_tohumu', price: 12 },
  { id: 'bogurtlen_tohumu', price: 15 },
  { id: 'altin_elma', price: 450 },
  { id: 'can_tilsimi', price: 1500 },
];
export const SELL = {
  dal: 1, mantar: 2, diken: 2, tas: 1, kum: 1, komur: 2, demir_cevheri: 4, demir_kulcesi: 10,
  sifali_ot: 2, bogurtlen: 2, bal: 15, yaprak_kanadi: 12, antik_yosun: 40, tahta_kalas: 2, tas_tugla: 2, cam: 2,
  kutuk: 2, kaldirim: 1, kiremit: 2, cit: 1, ot_tohumu: 3, bogurtlen_tohumu: 4,
};

// ---------------------------------------------------------------- Us ve insa (0.3)
// Arsa: usteki ayri bir ekran, yandan gorunen blok izgarasi. Her esya bir bloga karsilik gelir.
// tex: blocks.js dokusu, lvl: gereken Insa seviyesi, xp: ilk kez koyunca Insa XP, pts: Us Puani
// tall: 2 blok boyunda (kapi), ground: sadece zemin sirasina, furn: mobilya (oyuncu onunde durur)
export const BUILD = {
  tahta_kalas: { tex: 'kalas', lvl: 1, xp: 12, pts: 2 },
  kutuk: { tex: 'kutuk', lvl: 1, xp: 14, pts: 2 },
  kum: { tex: 'kum', lvl: 1, xp: 4, pts: 1 },
  tas: { tex: 'tas', lvl: 1, xp: 4, pts: 1 },
  cit: { tex: 'cit', lvl: 2, xp: 10, pts: 2 },
  kaldirim: { tex: 'kaldirim', lvl: 3, xp: 8, pts: 2 },
  tarla: { tex: 'tarla', lvl: 3, xp: 25, pts: 4, ground: true, furn: true },
  tas_tugla: { tex: 'tugla', lvl: 5, xp: 16, pts: 3 },
  ahsap_kapi: { tex: 'kapi_alt', top: 'kapi_ust', lvl: 6, xp: 30, pts: 5, tall: true },
  kiremit: { tex: 'kiremit', lvl: 8, xp: 16, pts: 3, shapes: ['kiremit', 'kiremit_sol', 'kiremit_sag'] },
  yaprak_blogu: { tex: 'yaprak', lvl: 10, xp: 10, pts: 2 },
  fener: { tex: 'fener', lvl: 12, xp: 40, pts: 6 },
  cam: { tex: 'cam', lvl: 12, xp: 14, pts: 3 },
};
export const BUILD_ORDER = Object.keys(BUILD);
// Arsa boyu Insa seviyesiyle buyur (tasarim belgesi 16x8 -> 32x12; ekrana sigsin diye 24x10'a kadar)
export function plotSize(insaLvl) {
  const cols = insaLvl >= 40 ? 24 : insaLvl >= 20 ? 20 : 16;
  const rows = insaLvl >= 60 ? 10 : insaLvl >= 40 ? 9 : 8;
  return { cols, rows };
}
export const MAX_TARLA = (insaLvl) => Math.min(16, 4 + Math.floor(insaLvl / 10) * 2);
// Bahce: tohum -> urun
export const SEEDS = {
  ot_tohumu: { out: 'sifali_ot', n: [2, 3], ms: 60 * 60 * 1000, xp: 45, name: 'Şifalı ot' },
  bogurtlen_tohumu: { out: 'bogurtlen', n: [2, 4], ms: 2 * 60 * 60 * 1000, xp: 70, name: 'Böğürtlen' },
};
export const SEED_CHANCE = 0.3; // ot / bogurtlen toplarken tohum cikma ihtimali
// Kamp: oyun kapaliyken en fazla 2 saat, saatte bu kadar basit malzeme (XP ve nadir esya yok)
export const CAMP = { maxMs: 2 * 60 * 60 * 1000, minMs: 10 * 60 * 1000, perHour: { dal: 6, tas: 6, komur: 3, bogurtlen: 3 } };
