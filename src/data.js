// Oyun verileri: karakterler, Glemonlar, esyalar, sabitler.
// Denge sayilari Oyun Tasarim Belgesi'nden gelir ve test ederken ayarlanir.

export const GAME_W = 384;
export const GAME_H = 216;
export const GROUND_Y = 178;
export const VERSION = '0.9.0';

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
  { key: 'okculuk', name: 'Okçuluk', desc: 'Yayla Glemon yenince artar. Daha iyi yaylar ve ok yetenekleri (20, 40, 60). Uçan Glemonlara tam hasar.' },
  { key: 'madencilik', name: 'Madencilik', desc: 'Maden Ocağı\'nda ve maden damarlarında kazınca artar. Yeni cevherler ve kazmalar.' },
  { key: 'toplama', name: 'Toplama', desc: 'Keşifte ve Zindanda ot, böğürtlen ve dal toplayınca artar. Her 10 seviyede +1 fazla toplarsın.' },
  { key: 'uretim', name: 'Üretim', desc: 'Zanaat avlusundaki Masa, Fırın, Kazan ve Yem Tezgâhı\'nda üretince artar. Yeni tarifler açar.' },
  { key: 'insa', name: 'İnşa', desc: 'Arsana blok ve eşya koyunca artar. Yeni bloklar açar, arsan büyür (20, 40, 60).' },
  { key: 'balikcilik', name: 'Balıkçılık', desc: 'Üs Göletinde ve Keşifteki göllerde balık tutunca artar. Yeni balıklar, oltalar ve batık sandıklar.' },
  { key: 'sans', name: 'Şans', desc: 'Patron yenince, sandık açınca ve nadir bir şey düşünce artar. Nadir düşme ve parlak Glemon şansı.' },
  { key: 'bag', name: 'Glemon Bağı', desc: 'Yanındaki Glemon savaşınca ve evcilleştirince artar. Daha zor Glemonları evcilleştirirsin, evcillerin güçlenir ve seviye sınırları artar (Bağ / 2).' },
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
    drops: [['agac_kalbi', 1], ['kabuk_zirh', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08], ['yumurta_orman', 0.1]],
  },
  // ---------------------------------------------------------------- 0.5 Yanki Magaralari (Tas)
  micir: {
    name: 'Mıcır', from: "Mıcır'dan", rarity: 'siradan', type: 'Taş',
    hp: 15, atk: 3.2, def: 4, spd: 80,
    special: { name: 'Yuvarlanma', mult: 1.7, telegraph: true }, every: 3,
    drops: [['tas', 0.5], ['ham_kristal', 0.08]],
  },
  taskabuk: {
    name: 'Taşkabuk', from: "Taşkabuk'tan", rarity: 'siradan', type: 'Taş',
    hp: 19, atk: 2.7, def: 6, spd: 65,
    special: { name: 'Kabuğa Çekil', shell: 2 }, every: 3,
    drops: [['ham_kristal', 0.3]],
  },
  pirpir: {
    name: 'Pırpır', from: "Pırpır'dan", rarity: 'siradan', type: 'Taş', fly: true,
    hp: 11, atk: 3, def: 1.5, spd: 125,
    special: { name: 'Ses Dalgası', mult: 0.9, status: ['sersem', 1], telegraph: true }, every: 3,
    drops: [['yarasa_zari', 0.3]],
  },
  kristalbocek: {
    name: 'Kristalböcek', from: "Kristalböcek'ten", rarity: 'nadir', type: 'Taş',
    hp: 17, atk: 4, def: 3.5, spd: 105,
    special: { name: 'Buz Kristali', mult: 1.3, status: ['donma', 2], telegraph: true }, every: 3,
    drops: [['ham_kristal', 0.4], ['bocek_kanadi', 0.04]],
  },
  ametist_kirpi: {
    name: 'Ametist Kirpi', from: "Ametist Kirpi'den", rarity: 'epik', type: 'Taş',
    hp: 26, atk: 3.6, def: 6, spd: 80,
    special: { name: 'Kristal Diken', reflect: 2 }, every: 3,
    drops: [['ametist', 0.12], ['ham_kristal', 0.5]],
  },
  tas_golemi: {
    name: 'Taş Golemi', from: "Taş Golemi'nden", rarity: 'efsanevi', type: 'Taş', boss: true,
    hp: 92, atk: 4.4, def: 4.2, spd: 70,
    pattern: ['normal', 'sarsinti', 'normal', 'cagir', 'normal', 'kabuk', 'normal', 'sarsinti'],
    specials: {
      sarsinti: { name: 'Yer Sarsıntısı', mult: 2.4, telegraph: true, aoe: true },
      cagir: { name: 'Çakıl Yağmuru', summon: 'micir' },
      kabuk: { name: 'Taş Deri', shell: 2 },
    },
    drops: [['golem_cekirdegi', 1], ['golem_yumrugu', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08], ['yumurta_magara', 0.1]],
  },
  // ---------------------------------------------------------------- 0.5 Kavurucu Col (Kum)
  kumkiskic: {
    name: 'Kumkıskaç', from: "Kumkıskaç'tan", rarity: 'siradan', type: 'Kum',
    hp: 13, atk: 3.4, def: 2.5, spd: 105,
    special: { name: 'Zehirli İğne', mult: 1.0, status: ['zehir', 4], telegraph: true }, every: 3,
    drops: [['akrep_ignesi', 0.08], ['pul', 0.1]],
  },
  kaktus_bekcisi: {
    name: 'Kaktüs Bekçisi', from: "Kaktüs Bekçisi'nden", rarity: 'siradan', type: 'Orman',
    hp: 18, atk: 2.8, def: 4, spd: 75,
    special: { name: 'Diken Zırhı', reflect: 2 }, every: 3,
    drops: [['kaktus_suyu', 0.35]],
  },
  toz_kertenkelesi: {
    name: 'Toz Kertenkelesi', from: "Toz Kertenkelesi'nden", rarity: 'siradan', type: 'Kum',
    hp: 13, atk: 3, def: 2, spd: 120,
    special: { name: 'Kum Atma', mult: 0.8, status: ['karanlik', 3], telegraph: true }, every: 3,
    drops: [['pul', 0.3]],
  },
  sargicik: {
    name: 'Sargıcık', from: "Sargıcık'tan", rarity: 'nadir', type: 'Gölge',
    hp: 18, atk: 3.8, def: 3, spd: 100,
    special: { name: 'Lanetli Ateş', mult: 1.2, status: ['yanma', 3], telegraph: true }, every: 3,
    drops: [['eski_sargi', 0.1], ['pul', 0.3]],
  },
  altin_skarabe: {
    name: 'Altın Skarabe', from: "Altın Skarabe'den", rarity: 'epik', type: 'Kum',
    hp: 24, atk: 3.4, def: 5, spd: 95, goldMult: 3,
    special: { name: 'Parıltı', mult: 0.6, status: ['karanlik', 2], luck: true, telegraph: true }, every: 3,
    drops: [['altin_kanat', 0.06]],
  },
  firtina_cakali: {
    name: 'Fırtına Çakalı', from: "Fırtına Çakalı'ndan", rarity: 'efsanevi', type: 'Kum', boss: true,
    hp: 96, atk: 4.8, def: 3.6, spd: 118,
    pattern: ['normal', 'firtina', 'normal', 'isirik', 'normal', 'cagir', 'normal', 'firtina'],
    specials: {
      firtina: { name: 'Kum Fırtınası', mult: 0.8, status: ['karanlik', 3], telegraph: true, aoe: true },
      isirik: { name: 'Çakal Isırığı', mult: 2.2, telegraph: true },
      cagir: { name: 'Uluma', summon: 'toz_kertenkelesi' },
    },
    drops: [['firtina_disi', 1], ['cakal_yayi', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08], ['yumurta_col', 0.1]],
  },
  // ---------------------------------------------------------------- 0.8 Donmus Zirve (Buz)
  kar_penguen: {
    name: 'Kar Pengueni', from: "Kar Pengueni'nden", rarity: 'siradan', type: 'Buz',
    hp: 16, atk: 3.2, def: 3, spd: 90,
    special: { name: 'Buz Kayması', mult: 1.5, telegraph: true }, every: 3,
    drops: [['buz_kristali', 0.3], ['kar_tuyu', 0.1]],
  },
  kiragi_tilki: {
    name: 'Kırağı Tilkisi', from: "Kırağı Tilkisi'nden", rarity: 'siradan', type: 'Buz',
    hp: 13, atk: 3.6, def: 2, spd: 130,
    special: { name: 'Kırağı Pençesi', mult: 1.2, status: ['donma', 1], telegraph: true }, every: 3,
    drops: [['kiragi_postu', 0.3]],
  },
  buzcuk: {
    name: 'Buzcuk', from: "Buzcuk'tan", rarity: 'siradan', type: 'Buz',
    hp: 18, atk: 2.8, def: 5, spd: 75,
    special: { name: 'Buz Zırhı', shell: 2 }, every: 3,
    drops: [['buz_kristali', 0.5]],
  },
  kar_baykusu: {
    name: 'Kar Baykuşu', from: "Kar Baykuşu'ndan", rarity: 'nadir', type: 'Buz', fly: true,
    hp: 17, atk: 4, def: 3, spd: 115,
    special: { name: 'Tipi', mult: 0.8, status: ['karanlik', 2], telegraph: true, aoe: true }, every: 3,
    drops: [['kar_tuyu', 0.4], ['buz_kristali', 0.3]],
  },
  aurora_geyigi: {
    name: 'Aurora Geyiği', from: "Aurora Geyiği'nden", rarity: 'epik', type: 'Buz',
    hp: 28, atk: 3.6, def: 5, spd: 100,
    special: { name: 'Kutup Işığı', heal: 0.25 }, every: 2,
    drops: [['aurora_boynuzu', 0.12], ['buz_kristali', 0.5]],
  },
  buzul_ayisi: {
    name: 'Buzul Ayısı', from: "Buzul Ayısı'ndan", rarity: 'efsanevi', type: 'Buz', boss: true,
    hp: 104, atk: 5.2, def: 4.2, spd: 80,
    pattern: ['normal', 'nefes', 'normal', 'pence', 'normal', 'cagir', 'normal', 'nefes'],
    specials: {
      nefes: { name: 'Buz Nefesi', mult: 0.9, status: ['donma', 1], telegraph: true, aoe: true },
      pence: { name: 'Buzul Pençesi', mult: 2.4, telegraph: true },
      cagir: { name: 'Çığ', summon: 'buzcuk' },
    },
    drops: [['buzul_kalbi', 1], ['ayi_eldiveni', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08], ['yumurta_buz', 0.1]],
  },
  // ---------------------------------------------------------------- 0.8 Kor Diyari (Ates)
  kor_semender: {
    name: 'Kor Semenderi', from: "Kor Semenderi'nden", rarity: 'siradan', type: 'Ateş',
    hp: 15, atk: 3.6, def: 2.5, spd: 110,
    special: { name: 'Kıvılcım Tükürüğü', mult: 1.0, status: ['yanma', 3], telegraph: true }, every: 3,
    drops: [['kor_pulu', 0.3]],
  },
  kivilcim_yarasa: {
    name: 'Kıvılcım Yarasası', from: "Kıvılcım Yarasası'ndan", rarity: 'siradan', type: 'Ateş', fly: true,
    hp: 12, atk: 3.4, def: 1.5, spd: 135,
    special: { name: 'Kor Kanat', mult: 1.4, telegraph: true }, every: 3,
    drops: [['kivilcim', 0.3]],
  },
  magma_salyangoz: {
    name: 'Magma Salyangozu', from: "Magma Salyangozu'ndan", rarity: 'siradan', type: 'Ateş',
    hp: 22, atk: 2.8, def: 6, spd: 60,
    special: { name: 'Kızgın Kabuk', reflect: 2 }, every: 3,
    drops: [['kor_pulu', 0.2], ['kul', 0.3]],
  },
  kul_koc: {
    name: 'Kül Koçu', from: "Kül Koçu'ndan", rarity: 'nadir', type: 'Ateş',
    hp: 20, atk: 4.4, def: 4, spd: 95,
    special: { name: 'Kor Toslaması', mult: 2.0, status: ['sersem', 1], telegraph: true }, every: 3,
    drops: [['kul', 0.5], ['kivilcim', 0.2]],
  },
  yakut_ejder: {
    name: 'Yakut Ejderi', from: "Yakut Ejderi'nden", rarity: 'epik', type: 'Ateş',
    hp: 28, atk: 4.6, def: 4, spd: 105,
    special: { name: 'Ejder Nefesi', mult: 1.0, status: ['yanma', 3], telegraph: true, aoe: true }, every: 3,
    drops: [['yakut', 0.12], ['kor_pulu', 0.5]],
  },
  magma_kaplumbaga: {
    name: 'Magma Kaplumbağası', from: "Magma Kaplumbağası'ndan", rarity: 'efsanevi', type: 'Ateş', boss: true,
    hp: 120, atk: 5.4, def: 5.2, spd: 66,
    pattern: ['normal', 'kizgin', 'normal', 'kabuk', 'normal', 'lav', 'normal', 'kizgin'],
    specials: {
      kizgin: { name: 'Kızgın Kabuk', mult: 0.9, status: ['yanma', 3], telegraph: true, aoe: true },
      kabuk: { name: 'Volkan Kabuğu', shell: 2 },
      lav: { name: 'Lav Fışkırması', mult: 2.3, telegraph: true },
    },
    drops: [['magma_kabugu', 1], ['kor_kilici', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08], ['yumurta_kor', 0.1]],
  },
  // ---------------------------------------------------------------- 0.8 Golge Boslugu (Golge)
  fisilti: {
    name: 'Fısıltı', from: "Fısıltı'dan", rarity: 'siradan', type: 'Gölge', fly: true,
    hp: 14, atk: 3.8, def: 2, spd: 125,
    special: { name: 'Korkutma', mult: 0.9, status: ['sersem', 1], telegraph: true }, every: 3,
    drops: [['golge_ozu', 0.3]],
  },
  gece_pisi: {
    name: 'Gece Pisisi', from: "Gece Pisisi'nden", rarity: 'siradan', type: 'Gölge',
    hp: 16, atk: 4, def: 2.5, spd: 125,
    special: { name: 'Gölge Pençesi', mult: 1.6, telegraph: true }, every: 3,
    drops: [['gece_postu', 0.3]],
  },
  bosluk_kurdu: {
    name: 'Boşluk Kurdu', from: "Boşluk Kurdu'ndan", rarity: 'siradan', type: 'Gölge',
    hp: 20, atk: 3.4, def: 4, spd: 80,
    special: { name: 'Mor Salya', mult: 1.0, status: ['zehir', 4], telegraph: true }, every: 3,
    drops: [['golge_ozu', 0.3], ['gece_postu', 0.1]],
  },
  gozmantar: {
    name: 'Gözmantar', from: "Gözmantar'dan", rarity: 'nadir', type: 'Gölge',
    hp: 21, atk: 4.4, def: 3.5, spd: 95,
    special: { name: 'Bakış', mult: 1.2, status: ['karanlik', 3], telegraph: true }, every: 3,
    drops: [['golge_ozu', 0.4], ['gece_mantari', 0.3]],
  },
  ay_guvesi: {
    name: 'Ay Güvesi', from: "Ay Güvesi'nden", rarity: 'epik', type: 'Gölge', fly: true,
    hp: 26, atk: 4, def: 4, spd: 120, goldMult: 2,
    special: { name: 'Ay Tozu', mult: 0.6, status: ['sersem', 2], luck: true, telegraph: true, aoe: true }, every: 3,
    drops: [['ay_tozu', 0.12], ['golge_ozu', 0.5]],
  },
  // 0.9 Dolunay Gecesi: sadece dolunayda, her bolgede nadiren cikar
  ay_tavsani: {
    name: 'Dolunay Tavşanı', from: "Dolunay Tavşanı'ndan", rarity: 'epik', type: 'Ay', moon: true,
    hp: 22, atk: 3.6, def: 3, spd: 140, goldMult: 3,
    special: { name: 'Ay Sıçrayışı', mult: 1.5, luck: true, telegraph: true }, every: 3,
    drops: [['ay_otu', 0.6], ['ay_tozu', 0.25], ['ay_tilsimi', 0.04]],
  },
  bosluk_bekcisi: {
    name: 'Boşluk Bekçisi', from: "Boşluk Bekçisi'nden", rarity: 'efsanevi', type: 'Gölge', boss: true, fly: true,
    hp: 130, atk: 5.8, def: 4.6, spd: 100,
    pattern: ['normal', 'isinlan', 'normal', 'kopya', 'normal', 'karanlik', 'normal', 'darbe'],
    specials: {
      isinlan: { name: 'Işınlanma', shell: 2 },
      kopya: { name: 'Gölge Kopyaları', summon: 'fisilti' },
      karanlik: { name: 'Sonsuz Gece', mult: 0.9, status: ['karanlik', 3], telegraph: true, aoe: true },
      darbe: { name: 'Boşluk Darbesi', mult: 2.5, telegraph: true },
    },
    drops: [['bosluk_tasi', 1], ['bekci_pelerini', 0.03], ['altin_elma', 0.3], ['can_tilsimi', 0.08], ['yumurta_golge', 0.1]],
  },
  // ---------------------------------------------------------------- 0.8 Efsanevi Glemonlar (sadece yumurtadan)
  cicek_aslani: {
    name: 'Çiçek Aslanı', from: "Çiçek Aslanı'ndan", rarity: 'efsanevi', type: 'Orman', egg: 'orman',
    hp: 30, atk: 4.6, def: 4.4, spd: 105, special: { name: 'Çiçek Kükremesi', heal: 0.25 }, every: 3, drops: [],
  },
  kristal_yilan: {
    name: 'Kristal Yılan', from: "Kristal Yılan'dan", rarity: 'efsanevi', type: 'Taş', egg: 'magara',
    hp: 30, atk: 4.8, def: 5, spd: 100, special: { name: 'Kristal Sokma', mult: 1.4, status: ['donma', 2], telegraph: true }, every: 3, drops: [],
  },
  gunes_kusu: {
    name: 'Güneş Kuşu', from: "Güneş Kuşu'ndan", rarity: 'efsanevi', type: 'Kum', egg: 'col', fly: true,
    hp: 28, atk: 5, def: 4, spd: 125, special: { name: 'Güneş Işını', mult: 1.2, status: ['karanlik', 2], aoe: true, telegraph: true }, every: 3, drops: [],
  },
  kuzey_kurdu: {
    name: 'Kuzey Kurdu', from: "Kuzey Kurdu'ndan", rarity: 'efsanevi', type: 'Buz', egg: 'buz',
    hp: 32, atk: 5.2, def: 4.6, spd: 120, special: { name: 'Aurora Uluması', mult: 1.3, status: ['donma', 2], telegraph: true }, every: 3, drops: [],
  },
  anka_yavrusu: {
    name: 'Anka Yavrusu', from: "Anka Yavrusu'ndan", rarity: 'efsanevi', type: 'Ateş', egg: 'kor', fly: true,
    hp: 30, atk: 5.4, def: 4.2, spd: 120, special: { name: 'Küllerden Doğuş', mult: 1.0, status: ['yanma', 3], aoe: true, telegraph: true }, every: 3, drops: [],
  },
  yildiz_balinasi: {
    name: 'Yıldız Balinası', from: "Yıldız Balinası'ndan", rarity: 'efsanevi', type: 'Gölge', egg: 'golge', fly: true,
    hp: 36, atk: 4.8, def: 5.4, spd: 95, special: { name: 'Yıldız Yağmuru', mult: 0.9, aoe: true, telegraph: true }, every: 3, drops: [],
  },
  // ---------------------------------------------------------------- 0.8.5 Su Glemonlari (sadece balik tutarken oltaya takilir)
  damlacik: {
    name: 'Damlacık', from: "Damlacık'tan", rarity: 'nadir', type: 'Su', water: true,
    hp: 18, atk: 3.4, def: 3, spd: 105, special: { name: 'Su Fıskiyesi', mult: 1.5, telegraph: true }, every: 3,
    drops: [['deniz_cami', 0.25], ['solucan', 0.5]],
  },
  inci_istiridye: {
    name: 'İnci İstiridye', from: "İnci İstiridye'den", rarity: 'nadir', type: 'Su', water: true,
    hp: 22, atk: 3, def: 5, spd: 85, special: { name: 'Kabuğunu Kapat', shell: 2 }, every: 3,
    drops: [['gol_incisi', 0.15], ['deniz_cami', 0.2]],
  },
  gol_ejderi: {
    name: 'Göl Ejderi', from: "Göl Ejderi'nden", rarity: 'epik', type: 'Su', water: true,
    hp: 26, atk: 4.4, def: 4, spd: 110, special: { name: 'Dalga Çarpması', mult: 1.2, aoe: true, telegraph: true }, every: 3,
    drops: [['gol_incisi', 0.3], ['efsane_pul', 0.05]],
  },
};

// Bolgeler ve icindeki Glemonlar (0.5). Her bolgenin 10 kati, 5. katta ara patron, 10. katta patron.
export const ZONE_SPAWNS = {
  orman: [['kutukcuk', 0.27], ['patlakmantar', 0.27], ['dikentavsan', 0.26], ['yaprakbocek', 0.17], ['yosunbaba', 0.03]],
  magara: [['micir', 0.28], ['taskabuk', 0.26], ['pirpir', 0.26], ['kristalbocek', 0.17], ['ametist_kirpi', 0.03]],
  col: [['kumkiskic', 0.27], ['kaktus_bekcisi', 0.26], ['toz_kertenkelesi', 0.27], ['sargicik', 0.17], ['altin_skarabe', 0.03]],
  buz: [['kar_penguen', 0.27], ['kiragi_tilki', 0.27], ['buzcuk', 0.26], ['kar_baykusu', 0.17], ['aurora_geyigi', 0.03]],
  kor: [['kor_semender', 0.27], ['kivilcim_yarasa', 0.27], ['magma_salyangoz', 0.26], ['kul_koc', 0.17], ['yakut_ejder', 0.03]],
  golge: [['fisilti', 0.27], ['gece_pisi', 0.27], ['bosluk_kurdu', 0.26], ['gozmantar', 0.17], ['ay_guvesi', 0.03]],
};
// Efsanevi yumurtalar (0.8): her bolgenin patronundan (%10) ve Zindan odul sandiklarindan dusur.
// Cantanda tasirsan 100 savastan sonra catlar.
export const EGGS = {
  orman: 'cicek_aslani', magara: 'kristal_yilan', col: 'gunes_kusu', buz: 'kuzey_kurdu', kor: 'anka_yavrusu', golge: 'yildiz_balinasi',
};
export const EGG_BATTLES = 100;
// Tip tablosu: guclu oldugu tiplere 1.5 kat, onu yenen tiplere 0.67 kat hasar
export const TYPE_STRONG = {
  Orman: ['Taş', 'Kum', 'Su'], Taş: ['Ateş', 'Buz'], Kum: ['Ateş', 'Gölge'],
  Buz: ['Orman', 'Kum'], Ateş: ['Orman', 'Buz'], Gölge: ['Taş'], Su: ['Ateş', 'Kum'],
};
export function typeMult(att, def) {
  if (!att || !def) return 1;
  if ((TYPE_STRONG[att] || []).includes(def)) return 1.5;
  if ((TYPE_STRONG[def] || []).includes(att)) return 0.67;
  return 1;
}
// Vahsi Glemonlarin evrim asamasi: bolgenin derin katlarinda Genc ve Usta da cikar
export const STAGES = ['Bebek', 'Genç', 'Usta'];
export function wildStageChances(zoneFloor) {
  return [zoneFloor >= 8 ? 0.03 : 0, zoneFloor >= 4 ? 0.06 + 0.02 * (zoneFloor - 4) : 0];
}
export const STAGE_STAT = [1, 1.4, 1.9];

// ---------------------------------------------------------------- Evcil Glemonlar (0.4)
// Evcillestirme: cani %25'in altindaki Glemon'a bolgesinin yemini verirsin.
export const TAME = {
  hpBelow: 0.25,
  chance: [0.3, 0.08, 0.01],          // Bebek, Genc, Usta
  bagReq: { siradan: 1, nadir: 20, epik: 40, efsanevi: 99 },
  stageBag: [0, 10, 20],
  sleepingBonus: 2,
};
// her bolgenin basit (Siradan) ve ozel (Nadir, Epik) yemi
export const FOODS = {
  orman: ['orman_turtasi', 'bal_damlasi'],
  magara: ['mantar_ezmesi', 'kristal_sekeri'],
  col: ['kaktus_jolesi', 'hurma_tatlisi'],
  buz: ['kar_kurabiyesi', 'aurora_sekeri'],
  kor: ['biber_kebabi', 'yakut_receli'],
  golge: ['gece_coregi', 'ay_pastasi'],
  su: ['balik_kraker', 'inci_kraker'],
};
export const PET_MAX_LVL = 50;
export const EVOLVE_AT = [15, 35];
export const petXpFor = (lvl) => (lvl <= 1 ? 0 : Math.floor(30 * Math.pow(lvl - 1, 2.1)));
export const petStatMult = (lvl, stage) => (1 + 0.2 * (lvl - 1)) * STAGE_STAT[stage] * 1.5;
export const ahirSize = (insaLvl) => Math.min(30, 6 + Math.floor(insaLvl / 10) * 3);
export const petCap = (bagLvl) => Math.min(PET_MAX_LVL, Math.max(5, Math.floor(bagLvl / 2)));

// ---------------------------------------------------------------- Silah yetenekleri (0.5)
// wt: kilic | yay | yumruk (silahsiz ya da eldiven). Seviye: kilic/yumruk Saldiri, yay Okculuk.
export const WEAPON_SKILL = { kilic: 'saldiri', yay: 'okculuk', yumruk: 'saldiri' };
export const BASIC = {
  kilic: { name: 'Kesik', hits: 1, mult: 1 },
  yay: { name: 'Tek Ok', hits: 1, mult: 1 },
  yumruk: { name: 'Seri Yumruk', hits: 2, mult: 0.6 },
};
export const ABILITIES = {
  kilic: [
    { key: 'doner', name: 'Döner Kesik', lvl: 20, cd: 3, aoe: true, mult: 0.6, desc: 'tüm düşmanlara ×0,6' },
    { key: 'kalkan', name: 'Kalkan Kırıcı', lvl: 40, cd: 3, mult: 0.8, status: ['sersem', 2], desc: '×0,8 + Sersem' },
    { key: 'firtina', name: 'Kılıç Fırtınası', lvl: 60, cd: 4, hits: 3, mult: 0.7, desc: '3 vuruş ×0,7' },
  ],
  yay: [
    { key: 'coklu', name: 'Çoklu Ok', lvl: 20, cd: 3, aoe: true, mult: 0.5, desc: '3 hedefe ×0,5' },
    { key: 'atesli', name: 'Ateşli Ok', lvl: 40, cd: 3, mult: 0.8, status: ['yanma', 3], desc: '×0,8 + Yanma' },
    { key: 'delici', name: 'Delici Ok', lvl: 60, cd: 3, mult: 1, pierce: true, desc: 'savunmayı yok sayar' },
  ],
  yumruk: [
    { key: 'sersemletici', name: 'Sersemletici', lvl: 20, cd: 3, mult: 0.7, status: ['sersem', 2], desc: '×0,7 + Sersem' },
    { key: 'buz', name: 'Buz Yumruğu', lvl: 40, cd: 3, mult: 0.6, status: ['donma', 1], desc: '×0,6 + Donma' },
    { key: 'patlat', name: 'Patlat', lvl: 60, cd: 4, mult: 1.2, desc: 'yanan hedefi patlatır' },
  ],
};
export const STATUS_NAMES = { zehir: 'Zehir', yanma: 'Yanma', sersem: 'Sersem', donma: 'Donma', karanlik: 'Karanlık' };
// Kombolar: ilk kez yapilinca Kombo Defteri'ne yazilir
export const COMBOS = {
  buz_kirici: { name: 'Buz Kırıcı', how: 'Donmuş hedefe kılıçla vur', result: '3 kat hasar, donma biter', hint: 'Buz ve kılıç…' },
  alev_patlamasi: { name: 'Alev Patlaması', how: 'Yanan hedefe Patlat yeteneği', result: 'Bütün düşmanlara patlama hasarı', hint: 'Ateş ve yumruk…' },
  zehirli_yagmur: { name: 'Zehirli Yağmur', how: 'Zehirli hedefe Çoklu Ok', result: 'Zehir bütün düşmanlara yayılır', hint: 'Zehir ve oklar…' },
};

export const SPAWN_TABLE = [
  ['kutukcuk', 0.27], ['patlakmantar', 0.27], ['dikentavsan', 0.26],
  ['yaprakbocek', 0.17], ['yosunbaba', 0.03],
];
export const SHINY_CHANCE = 1 / 500;

export const floorMult = (floor) => 1 + 0.22 * (floor - 1);

// ---------------------------------------------------------------- Esyalar
// kind: malzeme | tuketim | silah | kask | gogus | bot | tilsim | kazma | olta
export const ITEMS = {
  // ---- dusen malzemeler
  dal: { name: 'Dal parçası', kind: 'malzeme', rarity: 'siradan', icon: 'dal', desc: 'Kütükçükten düşer, keşifte de toplanır. Tahta eşyaların ana malzemesi.' },
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
  sifali_ot: { name: 'Şifalı ot', kind: 'malzeme', rarity: 'siradan', icon: 'ot', desc: 'Keşifte toplanır. İksir ve çorba malzemesi.' },
  bogurtlen: { name: 'Böğürtlen', kind: 'tuketim', rarity: 'siradan', icon: 'bogurtlen', heal: 0.1, food: true, anim: 'eat', desc: 'Keşifte toplanır. Yersen biraz can verir. Glemon yemi malzemesi (0.4).' },
  bal: { name: 'Bal', kind: 'malzeme', rarity: 'nadir', icon: 'bal', desc: 'Toplarken nadiren bulunur. Özel Glemon yemlerinin malzemesi.' },
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
  // ---- 0.4 Glemon yemleri (Yem Tezgahi)
  orman_turtasi: { name: 'Orman Turtası', kind: 'malzeme', rarity: 'siradan', icon: 'turta', yem: 'orman', desc: 'Orman Glemonlarının sevdiği basit yem. Sıradan Orman Glemonlarını evcilleştirir.' },
  bal_damlasi: { name: 'Bal Damlası', kind: 'malzeme', rarity: 'nadir', icon: 'bal_damlasi', yem: 'orman', special: true, desc: 'Özel yem: Nadir ve Epik Orman Glemonlarını da evcilleştirir.' },
  mantar_ezmesi: { name: 'Mantar Ezmesi', kind: 'malzeme', rarity: 'siradan', icon: 'ezme', yem: 'magara', desc: 'Mağara Glemonlarının sevdiği basit yem.' },
  kristal_sekeri: { name: 'Kristal Şekeri', kind: 'malzeme', rarity: 'nadir', icon: 'seker', yem: 'magara', special: true, desc: 'Özel yem: Nadir ve Epik Mağara Glemonlarını da evcilleştirir.' },
  kaktus_jolesi: { name: 'Kaktüs Jölesi', kind: 'malzeme', rarity: 'siradan', icon: 'jole', yem: 'col', desc: 'Çöl Glemonlarının sevdiği basit yem.' },
  hurma_tatlisi: { name: 'Hurma Tatlısı', kind: 'malzeme', rarity: 'nadir', icon: 'hurma_tatlisi', yem: 'col', special: true, desc: 'Özel yem: Nadir ve Epik Çöl Glemonlarını da evcilleştirir.' },
  // ---- 0.5 Magara ve Col malzemeleri
  ham_kristal: { name: 'Ham kristal', kind: 'malzeme', rarity: 'siradan', icon: 'kristal', desc: 'Mıcır ve Taşkabuktan düşer. Kristal Şekeri ve Golem Kılıcı malzemesi.' },
  yarasa_zari: { name: 'Yarasa zarı', kind: 'malzeme', rarity: 'siradan', icon: 'zar', desc: 'Pırpırdan düşer. Yay ipi ve Çanta Eki malzemesi.' },
  bocek_kanadi: { name: 'Böcek kanadı', kind: 'malzeme', rarity: 'epik', icon: 'bocek_kanadi', desc: 'Kristalböcekten çok nadir düşer. Parıl parıl.' },
  ametist: { name: 'Ametist', kind: 'malzeme', rarity: 'epik', icon: 'ametist', desc: 'Ametist Kirpinin dikeninden. Çok değerli.' },
  golem_cekirdegi: { name: 'Golem Çekirdeği', kind: 'malzeme', rarity: 'nadir', icon: 'cekirdek', bound: true, desc: 'Taş Goleminin kalbi. Golem Kılıcı malzemesi. Takas edilemez.' },
  akrep_ignesi: { name: 'Akrep iğnesi', kind: 'malzeme', rarity: 'nadir', icon: 'igne', desc: 'Kumkıskaçtan düşer. Zehirli ama değerli.' },
  kaktus_suyu: { name: 'Kaktüs suyu', kind: 'malzeme', rarity: 'siradan', icon: 'kaktus_suyu', desc: 'Kaktüs Bekçisinden düşer. Su Matarası, Kaktüs Jölesi ve Orta İksir malzemesi.' },
  pul: { name: 'Pul', kind: 'malzeme', rarity: 'siradan', icon: 'pul', desc: 'Toz Kertenkelesinden düşer. Su Matarası ve Çanta Eki malzemesi.' },
  eski_sargi: { name: 'Eski sargı', kind: 'malzeme', rarity: 'nadir', icon: 'sargi', desc: 'Sargıcıktan düşer. Eski ve gizemli.' },
  altin_kanat: { name: 'Altın kanat', kind: 'malzeme', rarity: 'epik', icon: 'altin_kanat', desc: 'Altın Skarabeden düşer. Skarabe Tılsımı malzemesi.' },
  firtina_disi: { name: 'Fırtına Dişi', kind: 'malzeme', rarity: 'nadir', icon: 'dis', bound: true, desc: 'Fırtına Çakalının dişi. Fırtına Yayı malzemesi. Takas edilemez.' },
  hurma: { name: 'Hurma', kind: 'tuketim', rarity: 'siradan', icon: 'hurma', heal: 0.12, food: true, anim: 'eat', desc: 'Çölde toplanır. Yersen biraz can verir. Hurma Tatlısı malzemesi.' },
  // ---- 0.5 tuketilebilir
  su_matarasi: { name: 'Su Matarası', kind: 'tuketim', rarity: 'siradan', icon: 'matara', water: true, anim: 'drinkpotion', desc: 'Çölde sıcağı 30 dakika engeller. Çölde susayınca kendiliğinden içersin.' },
  orta_iksir: { name: 'Orta Can İksiri', kind: 'tuketim', rarity: 'nadir', icon: 'iksir_orta', heal: 0.5, anim: 'drinkpotion', desc: 'Canının %50\'sini doldurur.' },
  canta_eki: { name: 'Çanta Eki', kind: 'tuketim', rarity: 'nadir', icon: 'canta', bagPlus: 5, desc: 'Kullanınca çantan 5 yuva büyür (en fazla 40 yuva).' },
  // ---- 0.5 yaylar (Okculuk) ve yumruk
  tahta_yay: { name: 'Tahta Yay', kind: 'silah', wt: 'yay', rarity: 'siradan', icon: 'yay_tahta', power: 5, desc: 'İlk yay. Uçan Glemonlara tam hasar vurur, savaşa önde başlarsın.' },
  tas_yay: { name: 'Taş Yay', kind: 'silah', wt: 'yay', rarity: 'siradan', icon: 'yay_tas', power: 9, req: ['okculuk', 10], desc: 'Üretim Masasında yapılır.' },
  demir_yay: { name: 'Demir Yay', kind: 'silah', wt: 'yay', rarity: 'siradan', icon: 'yay_demir', power: 14, req: ['okculuk', 20], desc: 'Üretim Masasında yapılır.' },
  firtina_yayi: { name: 'Fırtına Yayı', kind: 'silah', wt: 'yay', rarity: 'nadir', icon: 'yay_firtina', power: 20, req: ['okculuk', 25], desc: 'Fırtına Dişiyle yapılır. Çok güçlü.' },
  cakal_yayi: { name: 'Çakal Yayı', kind: 'silah', wt: 'yay', rarity: 'epik', icon: 'yay_cakal', power: 22, spd: 10, req: ['okculuk', 20], desc: 'Fırtına Çakalından çok nadir düşer. Hız +10.' },
  golem_kilici: { name: 'Golem Kılıcı', kind: 'silah', rarity: 'nadir', icon: 'kilic_golem', power: 20, req: ['saldiri', 25], desc: 'Golem Çekirdeğiyle yapılır. Çok güçlü.' },
  golem_yumrugu: { name: 'Golem Yumruğu', kind: 'silah', wt: 'yumruk', rarity: 'epik', icon: 'eldiven', power: 18, def: 4, req: ['saldiri', 15], desc: 'Taş Goleminden çok nadir düşer. Yumruk eldiveni: iki vuruşluk Seri Yumruk.' },
  skarabe_tilsimi: { name: 'Skarabe Tılsımı', kind: 'tilsim', rarity: 'epik', icon: 'tilsim_skarabe', luck: 15, desc: 'Şans +15: daha çok nadir düşüş ve parlak Glemon.' },
  // ---- 0.8 Donmus Zirve, Kor Diyari, Golge Boslugu
  buz_kristali: { name: 'Buz kristali', kind: 'malzeme', rarity: 'siradan', icon: 'buz_kristali', desc: 'Buzcuk ve Kar Penguenden düşer. Ateş Direnci İksiri malzemesi.' },
  kar_tuyu: { name: 'Kar tüyü', kind: 'malzeme', rarity: 'siradan', icon: 'kar_tuyu', desc: 'Kar Baykuşundan düşer. Kristal Yay ipi.' },
  kiragi_postu: { name: 'Kırağı postu', kind: 'malzeme', rarity: 'siradan', icon: 'kiragi_postu', desc: 'Kırağı Tilkisinden düşer. Sıcak tutar.' },
  aurora_boynuzu: { name: 'Aurora boynuzu', kind: 'malzeme', rarity: 'epik', icon: 'aurora_boynuzu', desc: 'Aurora Geyiğinden düşer. Aurora Tılsımı malzemesi.' },
  buzul_kalbi: { name: 'Buzul Kalbi', kind: 'malzeme', rarity: 'nadir', icon: 'buzul_kalbi', bound: true, desc: 'Buzul Ayısının kalbi. Buzul Kılıcı malzemesi. Takas edilemez.' },
  kor_pulu: { name: 'Kor pulu', kind: 'malzeme', rarity: 'siradan', icon: 'kor_pulu', desc: 'Kor Semenderinden düşer. Kor eşyaların ikinci malzemesi.' },
  kivilcim: { name: 'Kıvılcım', kind: 'malzeme', rarity: 'siradan', icon: 'kivilcim', desc: 'Kıvılcım Yarasasından düşer. Kor Yay ipi.' },
  kul: { name: 'Kül', kind: 'malzeme', rarity: 'siradan', icon: 'kul', desc: 'Kül Koçundan düşer, Kor Diyarında toplanır.' },
  yakut: { name: 'Yakut', kind: 'malzeme', rarity: 'epik', icon: 'yakut', desc: 'Yakut Ejderinden düşer. Yakut Tılsımı malzemesi.' },
  magma_kabugu: { name: 'Magma Kabuğu', kind: 'malzeme', rarity: 'nadir', icon: 'magma_kabugu', bound: true, desc: 'Magma Kaplumbağasının kabuk parçası. Magma Göğüslüğü malzemesi. Takas edilemez.' },
  golge_ozu: { name: 'Gölge özü', kind: 'malzeme', rarity: 'siradan', icon: 'golge_ozu', desc: 'Gölge Glemonlarından düşer. Gölge eşyaların ikinci malzemesi.' },
  gece_postu: { name: 'Gece postu', kind: 'malzeme', rarity: 'siradan', icon: 'gece_postu', desc: 'Gece Pisisinden düşer. Gölge Yay ipi.' },
  ay_tozu: { name: 'Ay tozu', kind: 'malzeme', rarity: 'epik', icon: 'ay_tozu', desc: 'Ay Güvesinden düşer. Ay Tılsımı malzemesi.' },
  bosluk_tasi: { name: 'Boşluk Taşı', kind: 'malzeme', rarity: 'nadir', icon: 'bosluk_tasi', bound: true, desc: 'Boşluk Bekçisinin taşı. Boşluk Yayı malzemesi. Takas edilemez.' },
  kar_cilegi: { name: 'Kar çileği', kind: 'tuketim', rarity: 'siradan', icon: 'kar_cilegi', heal: 0.12, food: true, anim: 'eat', desc: 'Donmuş Zirvede toplanır. Yersen biraz can verir.' },
  ates_biberi: { name: 'Ateş biberi', kind: 'malzeme', rarity: 'siradan', icon: 'ates_biberi', desc: 'Kor Diyarında toplanır. Sıcak Çorba ve Biber Kebabı malzemesi.' },
  gece_mantari: { name: 'Gece mantarı', kind: 'malzeme', rarity: 'siradan', icon: 'gece_mantari', desc: 'Gölge Boşluğunda toplanır. Parlıyor.' },
  // ---- 0.8 cevherler ve kulceler
  altin_cevheri: { name: 'Altın cevheri', kind: 'malzeme', rarity: 'siradan', icon: 'altin_cevheri', desc: 'Madende Derinlik 3+ (Madencilik 25). Fırında külçe olur.' },
  altin_kulcesi: { name: 'Altın külçesi', kind: 'malzeme', rarity: 'siradan', icon: 'altin_kulcesi', desc: 'Kristal eşyaların ve tılsımların malzemesi.' },
  saf_kristal: { name: 'Saf kristal', kind: 'malzeme', rarity: 'siradan', icon: 'saf_kristal', desc: 'Madende Derinlik 5+ (Madencilik 35). Kristal eşyaların ana malzemesi.' },
  kor_tasi: { name: 'Kor taşı', kind: 'malzeme', rarity: 'siradan', icon: 'kor_tasi', desc: 'Madende Derinlik 7+ (Madencilik 50). Fırında Kor külçesi olur.' },
  kor_kulcesi: { name: 'Kor külçesi', kind: 'malzeme', rarity: 'siradan', icon: 'kor_kulcesi', desc: 'Kor eşyaların ana malzemesi.' },
  bonkit: { name: 'Bonkit', kind: 'malzeme', rarity: 'epik', icon: 'bonkit', desc: 'Her derinlikte çok nadir (%0,5, Madencilik 65). Oyunun en sert cevheri.' },
  bonkit_kulcesi: { name: 'Bonkit külçesi', kind: 'malzeme', rarity: 'epik', icon: 'bonkit_kulcesi', desc: 'Bonkit eşyaların ana malzemesi.' },
  golge_tasi: { name: 'Gölge taşı', kind: 'malzeme', rarity: 'nadir', icon: 'golge_tasi', desc: 'Madende Derinlik 9+ (Madencilik 80). Fırında Gölge külçesi olur.' },
  golge_kulcesi: { name: 'Gölge külçesi', kind: 'malzeme', rarity: 'nadir', icon: 'golge_kulcesi', desc: 'Gölge eşyaların ana malzemesi.' },
  // ---- 0.8 yemler ve tuketilebilirler
  kar_kurabiyesi: { name: 'Kar Kurabiyesi', kind: 'malzeme', rarity: 'siradan', icon: 'kar_kurabiyesi', yem: 'buz', desc: 'Buz Glemonlarının sevdiği basit yem.' },
  aurora_sekeri: { name: 'Aurora Şekeri', kind: 'malzeme', rarity: 'nadir', icon: 'aurora_sekeri', yem: 'buz', special: true, desc: 'Özel yem: Nadir ve Epik Buz Glemonlarını da evcilleştirir.' },
  biber_kebabi: { name: 'Biber Kebabı', kind: 'malzeme', rarity: 'siradan', icon: 'biber_kebabi', yem: 'kor', desc: 'Ateş Glemonlarının sevdiği basit yem.' },
  yakut_receli: { name: 'Yakut Reçeli', kind: 'malzeme', rarity: 'nadir', icon: 'yakut_receli', yem: 'kor', special: true, desc: 'Özel yem: Nadir ve Epik Ateş Glemonlarını da evcilleştirir.' },
  gece_coregi: { name: 'Gece Çöreği', kind: 'malzeme', rarity: 'siradan', icon: 'gece_coregi', yem: 'golge', desc: 'Gölge Glemonlarının sevdiği basit yem.' },
  ay_pastasi: { name: 'Ay Pastası', kind: 'malzeme', rarity: 'nadir', icon: 'ay_pastasi', yem: 'golge', special: true, desc: 'Özel yem: Nadir ve Epik Gölge Glemonlarını da evcilleştirir.' },
  sicak_corba: { name: 'Sıcak Çorba', kind: 'tuketim', rarity: 'siradan', icon: 'sicak_corba', heal: 0.2, food: true, warm: true, anim: 'eat', desc: 'Donmuş Zirvede soğuğu 30 dakika engeller. Üşüyünce kendiliğinden içersin.' },
  ates_iksiri: { name: 'Ateş Direnci İksiri', kind: 'tuketim', rarity: 'nadir', icon: 'ates_iksiri', fireRes: true, anim: 'drinkpotion', desc: 'Kor Diyarında lavın yakmasını 30 dakika engeller. Gerekince kendiliğinden içersin.' },
  buyuk_iksir: { name: 'Büyük Can İksiri', kind: 'tuketim', rarity: 'epik', icon: 'iksir_buyuk', heal: 0.75, anim: 'drinkpotion', desc: 'Canının %75\'ini doldurur.' },
  // ---- 0.8 efsanevi yumurtalar
  yumurta_orman: { name: 'Orman Yumurtası', kind: 'yumurta', rarity: 'efsanevi', icon: 'yumurta_orman', egg: 'orman', bound: true, desc: 'Efsanevi bir Glemon yumurtası. Çantanda taşırsan 100 savaştan sonra çatlar.' },
  yumurta_magara: { name: 'Mağara Yumurtası', kind: 'yumurta', rarity: 'efsanevi', icon: 'yumurta_magara', egg: 'magara', bound: true, desc: 'Efsanevi bir Glemon yumurtası. Çantanda taşırsan 100 savaştan sonra çatlar.' },
  yumurta_col: { name: 'Çöl Yumurtası', kind: 'yumurta', rarity: 'efsanevi', icon: 'yumurta_col', egg: 'col', bound: true, desc: 'Efsanevi bir Glemon yumurtası. Çantanda taşırsan 100 savaştan sonra çatlar.' },
  yumurta_buz: { name: 'Buz Yumurtası', kind: 'yumurta', rarity: 'efsanevi', icon: 'yumurta_buz', egg: 'buz', bound: true, desc: 'Efsanevi bir Glemon yumurtası. Çantanda taşırsan 100 savaştan sonra çatlar.' },
  yumurta_kor: { name: 'Kor Yumurtası', kind: 'yumurta', rarity: 'efsanevi', icon: 'yumurta_kor', egg: 'kor', bound: true, desc: 'Efsanevi bir Glemon yumurtası. Çantanda taşırsan 100 savaştan sonra çatlar.' },
  yumurta_golge: { name: 'Gölge Yumurtası', kind: 'yumurta', rarity: 'efsanevi', icon: 'yumurta_golge', egg: 'golge', bound: true, desc: 'Efsanevi bir Glemon yumurtası. Çantanda taşırsan 100 savaştan sonra çatlar.' },
  // ---- 0.8 ozel esyalar
  buzul_kilici: { name: 'Buzul Kılıcı', kind: 'silah', rarity: 'nadir', icon: 'kilic_buzul', power: 28, onHit: ['donma', 0.2], req: ['saldiri', 35], desc: 'Buzul Kalbiyle yapılır. Vuruşların bazen dondurur.' },
  ayi_eldiveni: { name: 'Ayı Eldiveni', kind: 'silah', wt: 'yumruk', rarity: 'epik', icon: 'eldiven_ayi', power: 30, def: 6, req: ['saldiri', 35], desc: 'Buzul Ayısından çok nadir düşer. Yumruk eldiveni.' },
  kor_kilici: { name: 'Kor Kılıcı', kind: 'silah', rarity: 'epik', icon: 'kilic_kor_ozel', power: 38, onHit: ['yanma', 0.3], req: ['saldiri', 45], desc: 'Magma Kaplumbağasından çok nadir düşer. Vuruşların sık sık yakar.' },
  magma_gogus: { name: 'Magma Göğüslüğü', kind: 'gogus', rarity: 'nadir', icon: 'gogus_magma', def: 20, hp: 20, fireproof: true, req: ['savunma', 45], desc: 'Magma Kabuğuyla yapılır. Yanma işlemez.' },
  bosluk_yayi: { name: 'Boşluk Yayı', kind: 'silah', wt: 'yay', rarity: 'nadir', icon: 'yay_bosluk', power: 52, req: ['okculuk', 62], desc: 'Boşluk Taşıyla yapılır. Çok güçlü.' },
  bekci_pelerini: { name: 'Bekçi Pelerini', kind: 'tilsim', rarity: 'epik', icon: 'pelerin', def: 6, spd: 15, darkproof: true, desc: 'Boşluk Bekçisinden çok nadir düşer. Karanlık işlemez, Hız +15.' },
  aurora_tilsimi: { name: 'Aurora Tılsımı', kind: 'tilsim', rarity: 'epik', icon: 'tilsim_aurora', hp: 30, desc: 'Can +30.' },
  yakut_tilsimi: { name: 'Yakut Tılsımı', kind: 'tilsim', rarity: 'epik', icon: 'tilsim_yakut', crit: 0.08, luck: 8, desc: 'Kritik +%8, Şans +8.' },
  ay_tilsimi: { name: 'Ay Tılsımı', kind: 'tilsim', rarity: 'epik', icon: 'tilsim_ay', spd: 25, desc: 'Hız +25.' },
  // ---- 0.8.5 balikcilik: oltalar (box: yakalama kutusu buyur, bite: daha cabuk isirir, rare: nadir balik)
  tahta_olta: { name: 'Tahta Olta', kind: 'olta', rarity: 'siradan', icon: 'olta_tahta', rod: { box: 0, bite: 1, rare: 1 }, desc: 'Herkesin ilk oltası.' },
  bambu_olta: { name: 'Bambu Olta', kind: 'olta', rarity: 'siradan', icon: 'olta_bambu', rod: { box: 0.15, bite: 1, rare: 1 }, req: ['balikcilik', 20], desc: 'Yakalama kutusu %15 büyük.' },
  demir_olta: { name: 'Demir Olta', kind: 'olta', rarity: 'siradan', icon: 'olta_demir', rod: { box: 0.25, bite: 0.8, rare: 1 }, req: ['balikcilik', 35], desc: 'Kutu %25 büyük, balık daha çabuk ısırır.' },
  kristal_olta: { name: 'Kristal Olta', kind: 'olta', rarity: 'nadir', icon: 'olta_kristal', rod: { box: 0.35, bite: 0.8, rare: 1.5 }, req: ['balikcilik', 55], desc: 'Kutu %35 büyük, nadir balık şansı artar.' },
  kor_olta: { name: 'Kor Olta', kind: 'olta', rarity: 'nadir', icon: 'olta_kor', rod: { box: 0.35, bite: 0.75, rare: 1.5, lava: true }, req: ['balikcilik', 70], desc: 'Yanmaz. Kor Diyarındaki lav göllerinde balık tutar.' },
  // ---- 0.8.5 yemler (cantada varsa kullanilir; gol ekraninda hangisi secilir)
  solucan: { name: 'Solucan', kind: 'malzeme', rarity: 'siradan', icon: 'solucan', bait: 'solucan', desc: 'Madende toprak kazarken çıkar. Yem: balık daha çabuk ısırır.' },
  parlak_yem: { name: 'Parlak Yem', kind: 'malzeme', rarity: 'nadir', icon: 'parlak_yem', bait: 'parlak', desc: 'Simya Kazanında yapılır. Yem: nadir ve efsane balık şansı artar.' },
  // ---- 0.8.5 sadece balikcilikla bulunanlar
  gol_incisi: { name: 'Göl İncisi', kind: 'malzeme', rarity: 'epik', icon: 'gol_incisi', desc: 'Sadece batık sandıklarda (Balıkçılık 30+). İnci Tılsımı malzemesi.' },
  efsane_pul: { name: 'Efsane Pul', kind: 'malzeme', rarity: 'efsanevi', icon: 'efsane_pul', desc: 'Sadece efsane balıklardan. Pullu Pelerin ve en iyi olta malzemesi.' },
  deniz_cami: { name: 'Deniz Camı', kind: 'malzeme', rarity: 'nadir', icon: 'deniz_cami', desc: 'Sadece batık sandıklarda. Arsan için renkli cam blokları.' },
  // ---- 0.8.5 balik yemekleri
  izgara_balik: { name: 'Izgara Balık', kind: 'tuketim', rarity: 'siradan', icon: 'izgara_balik', heal: 0.35, food: true, strong: 3, anim: 'eat', desc: 'Canının %35\'ini doldurur. Savaşta yersen 3 tur saldırın %30 artar.' },
  balik_corbasi: { name: 'Balık Çorbası', kind: 'tuketim', rarity: 'nadir', icon: 'balik_corbasi', heal: 0.5, food: true, warm: true, anim: 'eat', desc: 'Canının %50\'sini doldurur ve soğuğu 30 dakika engeller.' },
  balik_kraker: { name: 'Balık Kraker', kind: 'malzeme', rarity: 'siradan', icon: 'balik_kraker', yem: 'su', desc: 'Su Glemonlarının sevdiği yem. Sadece nadir Su Glemonlarını evcilleştirir.' },
  // ---- 0.8.5 sadece tek beceriyle bulunan malzemeler ve onlardan yapilanlar
  yildiz_demiri: { name: 'Yıldız Demiri', kind: 'malzeme', rarity: 'epik', icon: 'yildiz_demiri', desc: 'Sadece madende Derinlik 12 ve altında (Madencilik 70). Örste eşya yükseltir.' },
  cekirdek_kristali: { name: 'Çekirdek Kristali', kind: 'malzeme', rarity: 'efsanevi', icon: 'cekirdek_kristali', desc: 'Sadece madende Derinlik 16 ve altında (Derin Kazı yeteneği, Madencilik 80).' },
  ay_otu: { name: 'Ay otu', kind: 'malzeme', rarity: 'nadir', icon: 'ay_otu', desc: 'Sadece gece (gerçek saat) Keşifte toplanır. Ay İksiri malzemesi.' },
  usta_damgasi: { name: 'Usta Damgası', kind: 'malzeme', rarity: 'epik', icon: 'usta_damgasi', desc: 'Üretim 75+ iken her üretimde %2 ihtimalle çıkar. Örste eşyayı +4 Usta yapar.' },
  inci_tilsimi: { name: 'İnci Tılsımı', kind: 'tilsim', rarity: 'epik', icon: 'tilsim_inci', dodge: 0.15, def: 4, desc: 'Kaçınma düğmesi %15 daha uzun kalır.' },
  pullu_pelerin: { name: 'Pullu Pelerin', kind: 'tilsim', rarity: 'efsanevi', icon: 'pelerin_pullu', def: 10, hp: 25, spd: 15, dodge: 0.08, req: ['savunma', 60], desc: 'Efsane balık pullarından. Her şeyden biraz.' },
  efsane_olta: { name: 'Efsane Olta', kind: 'olta', rarity: 'efsanevi', icon: 'olta_efsane', rod: { box: 0.5, bite: 0.65, rare: 2, lava: true }, req: ['balikcilik', 85], desc: 'Oyunun en iyi oltası. Lavda da tutar.' },
  cekirdek_kazma: { name: 'Çekirdek Kazma', kind: 'kazma', rarity: 'efsanevi', icon: 'kazma_cekirdek', pick: 34, req: ['madencilik', 85], desc: 'Oyunun en güçlü kazması.' },
  sifirlama_tasi: { name: 'Sıfırlama Taşı', kind: 'malzeme', rarity: 'epik', icon: 'sifirlama_tasi', desc: 'Hancı Lale\'ye verirsen yetenek ağacını bedavaya sıfırlar.' },
  ay_iksiri: { name: 'Ay İksiri', kind: 'tuketim', rarity: 'epik', icon: 'ay_iksiri', ward: 3, battleOnly: true, anim: 'drinkpotion', desc: 'Savaşta içersen sonraki 3 saldırıdan hiç hasar almazsın.' },
  renkli_cam: { name: 'Renkli Cam', kind: 'malzeme', rarity: 'nadir', icon: 'renkli_cam', desc: 'İnşa bloğu: deniz camından yeşil-mavi pencere.' },
  inci_kraker: { name: 'İncili Kraker', kind: 'malzeme', rarity: 'nadir', icon: 'inci_kraker', yem: 'su', special: true, desc: 'Özel yem: bütün Su Glemonlarını evcilleştirir.' },
};

// ---------------------------------------------------------------- Balikcilik (0.8.5)
// Her suyun kendi balıklari var. lvl: gereken Balikcilik, diff: ne kadar kivrak (1-5),
// legend: efsane balik (elle tutulur, ozel hareket), col: simge renkleri [govde, acik, koyu, yuzgec]
export const WATERS = {
  us: { name: 'Üs Göleti' },
  orman: { name: 'Orman Gölü' },
  magara: { name: 'Yeraltı Gölü' },
  col: { name: 'Vaha' },
  buz: { name: 'Buz Deliği' },
  kor: { name: 'Lav Gölü', lava: true },
  golge: { name: 'Gölge Kuyusu' },
};
export const FISH = {
  pulcuk: { name: 'Pulcuk', water: 'us', lvl: 1, diff: 1, w: 50, rarity: 'siradan', col: ['#8ab4c8', '#d0e8f0', '#4a7890', '#e8a050'] },
  cizgili_sazan: { name: 'Çizgili Sazan', water: 'us', lvl: 4, diff: 1.4, w: 35, rarity: 'siradan', col: ['#c8a050', '#f0d890', '#7a5a28', '#a86a30'] },
  camur_yayini: { name: 'Çamur Yayını', water: 'us', lvl: 10, diff: 1.8, w: 25, rarity: 'siradan', col: ['#7a6a50', '#b0a080', '#4a3e2e', '#5a4a38'] },
  altin_pulcuk: { name: 'Altın Pulcuk', water: 'us', lvl: 25, diff: 2.8, w: 6, rarity: 'nadir', col: ['#f0c040', '#fff0a0', '#b08020', '#f08030'] },
  yaprak_baligi: { name: 'Yaprak Balığı', water: 'orman', lvl: 8, diff: 1.6, w: 45, rarity: 'siradan', col: ['#74b452', '#c8f0a0', '#3e7a30', '#a8d878'] },
  yosunlu_turna: { name: 'Yosunlu Turna', water: 'orman', lvl: 15, diff: 2.2, w: 30, rarity: 'siradan', col: ['#5a8a5a', '#a0c890', '#2e5a34', '#8a6a3a'] },
  dere_alabaligi: { name: 'Dere Alabalığı', water: 'orman', lvl: 20, diff: 2.6, w: 18, rarity: 'nadir', col: ['#b8a8c8', '#f0e0f0', '#6a5a7a', '#e87a8a'] },
  kok_baligi: { name: 'Kadim Kökbalığı', water: 'orman', lvl: 30, diff: 3.6, legend: 'dive', rarity: 'efsanevi', col: ['#8a5a32', '#c8a070', '#4a2e18', '#7cc25a'] },
  kor_balik: { name: 'Mağara Körbalığı', water: 'magara', lvl: 22, diff: 2.4, w: 45, rarity: 'siradan', col: ['#e8d8d0', '#ffffff', '#a89890', '#f0b0b0'] },
  kristal_karides: { name: 'Kristal Karides', water: 'magara', lvl: 28, diff: 2.9, w: 30, rarity: 'siradan', col: ['#a8d4ec', '#e8f8ff', '#5a8ab0', '#c08af0'] },
  yanki_yilanbaligi: { name: 'Yankı Yılanbalığı', water: 'magara', lvl: 32, diff: 3.2, w: 16, rarity: 'nadir', col: ['#5a5a7a', '#9a9ab8', '#2e2e44', '#9a6cc8'] },
  ametist_mersin: { name: 'Ametist Mersin', water: 'magara', lvl: 45, diff: 4, legend: 'dart', rarity: 'efsanevi', col: ['#9a6cc8', '#e0c8ff', '#5a3a8a', '#7af0e0'] },
  vaha_alabaligi: { name: 'Vaha Alabalığı', water: 'col', lvl: 32, diff: 3, w: 45, rarity: 'siradan', col: ['#e8b060', '#ffe0a0', '#a87030', '#5aa8a0'] },
  kum_kedibaligi: { name: 'Kum Kedibalığı', water: 'col', lvl: 36, diff: 3.3, w: 30, rarity: 'siradan', col: ['#d8c090', '#f8ecc8', '#9a8050', '#7a5a38'] },
  serap_baligi: { name: 'Serap Balığı', water: 'col', lvl: 40, diff: 3.6, w: 16, rarity: 'nadir', col: ['#f0a0c8', '#fff0f8', '#b06a90', '#ffe080'] },
  gunes_turnasi: { name: 'Güneş Turnası', water: 'col', lvl: 55, diff: 4.3, legend: 'dart', rarity: 'efsanevi', col: ['#ffb030', '#fff0a0', '#c86a10', '#e8401a'] },
  buz_morinasi: { name: 'Buz Morinası', water: 'buz', lvl: 42, diff: 3.4, w: 45, rarity: 'siradan', col: ['#c8d8e8', '#f4fbff', '#7a90a8', '#9cc8e8'] },
  kar_somonu: { name: 'Kar Somonu', water: 'buz', lvl: 46, diff: 3.7, w: 30, rarity: 'siradan', col: ['#f0a080', '#ffe0d0', '#b06048', '#e4ebf2'] },
  kuzey_ringasi: { name: 'Kuzey Ringası', water: 'buz', lvl: 50, diff: 4, w: 16, rarity: 'nadir', col: ['#7ae0c8', '#e0fff8', '#3a8a8a', '#c08af0'] },
  aurora_mersini: { name: 'Aurora Mersini', water: 'buz', lvl: 65, diff: 4.6, legend: 'dive', rarity: 'efsanevi', col: ['#7ae0c8', '#f0d0ff', '#4a6a90', '#c08af0'] },
  lav_kefali: { name: 'Lav Kefali', water: 'kor', lvl: 70, diff: 4, w: 45, rarity: 'siradan', col: ['#e0602a', '#ffb040', '#8a3014', '#ffe080'] },
  kul_yayini: { name: 'Kül Yayını', water: 'kor', lvl: 73, diff: 4.2, w: 30, rarity: 'siradan', col: ['#6a6268', '#a89ca4', '#3e3638', '#f07a2a'] },
  magma_yengeci: { name: 'Magma Yengeci', water: 'kor', lvl: 76, diff: 4.5, w: 16, rarity: 'nadir', col: ['#c8301e', '#f07a3a', '#6a1a10', '#ffd060'] },
  ejder_baligi: { name: 'Ateş Ejder Balığı', water: 'kor', lvl: 85, diff: 5, legend: 'dart', rarity: 'efsanevi', col: ['#e8401a', '#ffd060', '#8a1a10', '#c8304a'] },
  golge_yilanbaligi: { name: 'Gölge Yılanbalığı', water: 'golge', lvl: 62, diff: 3.9, w: 45, rarity: 'siradan', col: ['#4a3a6a', '#8a6ac0', '#2a2040', '#7af0e0'] },
  fener_baligi: { name: 'Fener Balığı', water: 'golge', lvl: 68, diff: 4.2, w: 30, rarity: 'siradan', col: ['#3a4a6a', '#6a8ab0', '#1e2a40', '#fff0a0'] },
  bosluk_vatozu: { name: 'Boşluk Vatozu', water: 'golge', lvl: 74, diff: 4.5, w: 16, rarity: 'nadir', col: ['#2a2040', '#5a4a8a', '#140e20', '#c8a0f0'] },
  ay_baligi: { name: 'Dolunay Balığı', water: 'golge', lvl: 90, diff: 5, legend: 'dive', rarity: 'efsanevi', col: ['#e8e8f8', '#ffffff', '#8a8ac8', '#fff0a0'] },
};
// 0.9 Dolunay Gecesi: sadece dolunayda Üs Göletinde
FISH.ay_sazani = { name: 'Ay Işığı Sazanı', water: 'us', lvl: 10, diff: 2.2, w: 30, rarity: 'nadir', moon: true, col: ['#c8d0f0', '#ffffff', '#7a80b8', '#fff0a0'] };
export const fishXp = (f) => Math.round((20 + f.lvl * 5 + f.lvl * f.lvl * 0.06) * (f.legend ? 5 : f.rarity === 'nadir' ? 1.6 : 1));
export const FISHING = {
  legendChance: 0.015,   // uygun seviyedeysen her atista efsane balik
  chestChance: 0.06,     // batik sandik
  glemonChance: 0.025,   // su Glemonu (Balikcilik 15+)
  autoChance: 0.6,       // otomatikte yakalama
  biteMs: [2000, 8000],
  hookMs: 800,
};
// ---------------------------------------------------------------- 0.9 Hedefler esyalari
// Beceri pelerinleri: bir beceri 99 olunca kendiliginden gelir. Sirtta gorunur.
export const CAPE_COLORS = {
  saldiri: ['#7a2a22', '#b8402e', '#e0705a', '#ffd04d'], savunma: ['#2e3e62', '#4a6496', '#7a98c8', '#e8f0ff'],
  can: ['#7a2a44', '#c04a6a', '#e888a0', '#fff0f4'], okculuk: ['#2a5430', '#3e8240', '#74b45a', '#e8f8a0'],
  madencilik: ['#5a3a22', '#8a5a32', '#b8885a', '#c8ccd6'], toplama: ['#3e5a22', '#62883a', '#94c060', '#f0e078'],
  uretim: ['#6a4a26', '#a07040', '#d0a868', '#fff0c8'], insa: ['#6a2e22', '#a04a32', '#d07a58', '#f0d0a0'],
  balikcilik: ['#1e4a62', '#2e7a9a', '#5ab0c8', '#e0f8ff'], sans: ['#7a5a12', '#c09020', '#ecc850', '#fff8d0'],
  bag: ['#4a2a6a', '#7448a0', '#a880d0', '#f0e0ff'], cirak: ['#4a4038', '#6e6254', '#9a8c7a', '#d8ccb8'],
  tuccar: ['#1e3e3a', '#2e6a5e', '#c89a3a', '#ffe8a0'],
};
for (const s of SKILLS) {
  ITEMS[`pelerin_${s.key}`] = {
    name: `${s.name} Pelerini`, kind: 'pelerin', rarity: 'efsanevi', icon: `pelerin_${s.key}`, def: 6, hp: 30, cape: s.key,
    desc: `${s.name} 99 olanlara. Ustalığın sırtında dalgalanır. Savunma +6, Can +30.`,
  };
}
Object.assign(ITEMS, {
  cirak_pelerini: { name: 'Çırak Pelerini', kind: 'pelerin', rarity: 'nadir', icon: 'pelerin_cirak', def: 1, desc: 'Bir beceriyi 50\'ye çıkaranlara. İlk büyük hedefin!' },
  tuccar_pelerini: { name: 'Gezgin Pelerini', kind: 'pelerin', rarity: 'epik', icon: 'pelerin_tuccar', def: 3, spd: 10, desc: 'Gezgin Tüccar\'ın yedek pelerini. Hız +10.' },
  ay_tasi: { name: 'Ay Taşı', kind: 'malzeme', rarity: 'nadir', icon: 'ay_tasi', desc: 'İnşa bloğu: soluk mavi parlayan taş. Sadece Gezgin Tüccar\'da.' },
  altin_tugla: { name: 'Altın Tuğla', kind: 'malzeme', rarity: 'nadir', icon: 'altin_tugla', desc: 'İnşa bloğu: yaldızlı tuğla. Sadece Gezgin Tüccar\'da.' },
  pembe_yaprak: { name: 'Pembe Yaprak', kind: 'malzeme', rarity: 'nadir', icon: 'pembe_yaprak', desc: 'İnşa bloğu: çiçek açmış ağaç tacı. Sadece Gezgin Tüccar\'da.' },
  mavi_fener: { name: 'Ay Feneri', kind: 'malzeme', rarity: 'nadir', icon: 'mavi_fener', desc: 'İnşa bloğu: mavi ışıklı fener. Sadece Gezgin Tüccar\'da.' },
  ay_tohumu: { name: 'Ay Tohumu', kind: 'malzeme', rarity: 'nadir', icon: 'tohum_ay', desc: 'Tarlaya ek: 4 saatte Ay otu verir. Sadece Gezgin Tüccar\'da.' },
  altin_tohum: { name: 'Altın Tohum', kind: 'malzeme', rarity: 'epik', icon: 'tohum_altin', desc: 'Tarlaya ek: 8 saatte bir Altın Elma verir. Sadece Gezgin Tüccar\'da.' },
});

// Su Glemonlari sadece balik tutarken cikar
export const WATER_GLEMONS = [['damlacik', 50], ['inci_istiridye', 35], ['gol_ejderi', 15]];
for (const [k, f] of Object.entries(FISH)) {
  const w = WATERS[f.water].name;
  ITEMS[k] = {
    name: f.name, kind: 'malzeme', rarity: f.rarity, icon: `balik_${k}`, fish: true,
    desc: f.legend ? `Efsane balık! ${w} (Balıkçılık ${f.lvl}). Tutunca Efsane Pul da verir.` : `${w} balığı (Balıkçılık ${f.lvl}). Fırında pişer ya da satılır.`,
  };
}

// 0.8 ekipman seviyeleri: Kristal, Kor, Bonkit, Golge (kilic, yay, kazma, kask, goguslik, bot)
export const TIERS = {
  kristal: { name: 'Kristal', atk: 22, bow: 21, pick: 7, def: [7, 13, 7], lvl: 30, mine: 35 },
  kor: { name: 'Kor', atk: 32, bow: 30, pick: 11, def: [9, 17, 9], lvl: 45, mine: 50 },
  bonkit: { name: 'Bonkit', atk: 44, bow: 42, pick: 16, def: [12, 22, 12], lvl: 60, mine: 65 },
  golge: { name: 'Gölge', atk: 58, bow: 55, pick: 24, def: [15, 28, 15], lvl: 75, mine: 80 },
};
for (const [t, T] of Object.entries(TIERS)) {
  const d = 'Üretim Masasında yapılır.';
  ITEMS[`${t}_kilic`] = { name: `${T.name} Kılıç`, kind: 'silah', rarity: t === 'bonkit' ? 'epik' : 'nadir', icon: `kilic_${t}`, power: T.atk, req: ['saldiri', T.lvl], desc: d };
  ITEMS[`${t}_yay`] = { name: `${T.name} Yay`, kind: 'silah', wt: 'yay', rarity: t === 'bonkit' ? 'epik' : 'nadir', icon: `yay_${t}`, power: T.bow, req: ['okculuk', T.lvl], desc: d };
  ITEMS[`${t}_kazma`] = { name: `${T.name} Kazma`, kind: 'kazma', rarity: t === 'bonkit' ? 'epik' : 'nadir', icon: `kazma_${t}`, pick: T.pick, req: ['madencilik', T.mine], desc: d };
  ['kask', 'gogus', 'bot'].forEach((k, i) => {
    ITEMS[`${t}_${k}`] = { name: `${T.name} ${{ kask: 'Kask', gogus: 'Göğüslük', bot: 'Bot' }[k]}`, kind: k, rarity: t === 'bonkit' ? 'epik' : 'nadir', icon: `${k}_${t}`, def: T.def[i], set: t, req: ['savunma', T.lvl], desc: d };
  });
}

export const SETS = {
  yosun: { pieces: 3, hp: 15, name: 'Yosun seti', bonus: '+15 can' },
  tahta: { pieces: 3, name: 'Tahta seti', bonus: 'bonus yok' },
  tas: { pieces: 3, hp: 5, name: 'Taş seti', bonus: '+5 can' },
  demir: { pieces: 3, defPct: 0.1, name: 'Demir seti', bonus: 'Savunma +%10' },
  kristal: { pieces: 3, hp: 20, name: 'Kristal seti', bonus: '+20 can' },
  kor: { pieces: 3, fireproof: true, name: 'Kor seti', bonus: 'Yanma işlemez' },
  bonkit: { pieces: 3, crit: 0.1, name: 'Bonkit seti', bonus: 'Kritik +%10' },
  golge: { pieces: 3, darkproof: true, name: 'Gölge seti', bonus: 'Karanlık işlemez' },
};

export const SLOTS = [
  ['silah', 'Silah'], ['kask', 'Kask'], ['gogus', 'Göğüs'], ['bot', 'Bot'], ['tilsim', 'Tılsım'], ['kazma', 'Kazma'], ['olta', 'Olta'], ['pelerin', 'Pelerin'],
];

export const BAG_SIZE = 20;
export const STACK = 99;

// Sandik odasi esya havuzu
export const CHEST_GEAR = [['tahta_kilic', 3], ['yosun_kask', 3], ['yosun_bot', 3], ['yosun_gogus', 2], ['diken_kilici', 0.5]];
export const CHEST_MATS = ['dal', 'mantar', 'diken', 'sifali_ot', 'komur'];
export const ZONE_CHEST = {
  orman: { mats: CHEST_MATS },
  magara: { mats: ['tas', 'komur', 'ham_kristal', 'yarasa_zari', 'demir_cevheri'], gear: [['tas_yay', 2], ['tas_kilic', 2], ['fener', 2]] },
  col: { mats: ['kum', 'pul', 'kaktus_suyu', 'hurma', 'demir_kulcesi'], gear: [['su_matarasi', 4], ['demir_yay', 1], ['orta_iksir', 2]] },
  buz: { mats: ['buz_kristali', 'kar_tuyu', 'kiragi_postu', 'kar_cilegi', 'altin_kulcesi'], gear: [['sicak_corba', 4], ['kristal_yay', 1], ['kristal_kilic', 1], ['orta_iksir', 2]] },
  kor: { mats: ['kor_pulu', 'kul', 'kivilcim', 'ates_biberi', 'kor_tasi'], gear: [['ates_iksiri', 4], ['kor_yay', 1], ['kor_kask', 1], ['orta_iksir', 2]] },
  golge: { mats: ['golge_ozu', 'gece_postu', 'gece_mantari', 'kor_kulcesi', 'golge_tasi'], gear: [['fener', 2], ['golge_yay', 0.5], ['golge_bot', 0.5], ['buyuk_iksir', 2]] },
};

// Kat odalari
export const ROOM_WEIGHTS = [['savas', 52], ['sandik', 13], ['tuzak', 11], ['uyuyan', 10], ['kamp', 8], ['maden', 8], ['gol', 9]];
// savastan sonra odada toplanacak bir sey cikma ihtimali
export const GATHER_CHANCE = 0.4;

export const ZONES = [
  { key: 'orman', name: 'Yabani Orman', floors: [1, 10], open: true, boss: 'agacbasi', type: 'Orman', atk: 1 },
  { key: 'magara', name: 'Yankı Mağaraları', floors: [11, 20], open: true, boss: 'tas_golemi', type: 'Taş', atk: 15, after: 'agacbasi', hazard: 'Karanlık odalar: çantanda Fener yoksa göremezsin.' },
  { key: 'col', name: 'Kavurucu Çöl', floors: [21, 30], open: true, boss: 'firtina_cakali', type: 'Kum', atk: 30, after: 'tas_golemi', hazard: 'Sıcak: Su Matarası yoksa her odada biraz can kaybedersin.' },
  { key: 'buz', name: 'Donmuş Zirve', floors: [31, 40], open: true, boss: 'buzul_ayisi', type: 'Buz', atk: 45, after: 'firtina_cakali', hazard: 'Soğuk: Sıcak Çorba içmezsen savaşlarda yavaşlarsın.' },
  { key: 'kor', name: 'Kor Diyarı', floors: [41, 50], open: true, boss: 'magma_kaplumbaga', type: 'Ateş', atk: 60, after: 'buzul_ayisi', hazard: 'Lav: Ateş Direnci İksiri yoksa savaşlara yanarak başlarsın.' },
  { key: 'golge', name: 'Gölge Boşluğu', floors: [51, 60], open: true, boss: 'bosluk_bekcisi', type: 'Gölge', atk: 75, after: 'magma_kaplumbaga', hazard: 'Karanlık: odaların yarısı karanlık, Fener taşı.' },
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
  // 0.8 yeni cevherler (Madencilik seviyesi; derinlikle artar)
  altin: { name: 'Altın', hard: 9, xp: 120, req: 25, drop: 'altin_cevheri' },
  kristal: { name: 'Kristal', hard: 18, xp: 180, req: 35, drop: 'saf_kristal' },
  kor: { name: 'Kor taşı', hard: 30, xp: 260, req: 50, drop: 'kor_tasi' },
  bonkit: { name: 'Bonkit', hard: 44, xp: 700, req: 65, drop: 'bonkit' },
  golge: { name: 'Gölge taşı', hard: 64, xp: 420, req: 80, drop: 'golge_tasi' },
  // 0.8.5 sadece en derinde: Yildiz Demiri (Derinlik 12+), Cekirdek Kristali (Derinlik 16+, Derin Kazi yetenegi)
  yildiz: { name: 'Yıldız Demiri', hard: 52, xp: 600, req: 70, drop: 'yildiz_demiri' },
  cekirdek: { name: 'Çekirdek Kristali', hard: 70, xp: 950, req: 80, drop: 'cekirdek_kristali' },
};
export const DEEP_LIMIT = 15; // Derin Kazi yetenegi olmadan inilebilen en derin kat
export const BONKIT_CHANCE = 0.005;
export const zoneOf = (floor) => ZONES.find((z) => floor >= z.floors[0] && floor <= z.floors[1]) || ZONES[0];
export const MINE_COLS = 8;
export const MINE_ROWS = 6;
export const DEFINE_CHANCE = 0.006;

// derinlige gore duvarin icerigi
export function oreWeights(depth) {
  if (depth <= 1) return [['toprak', 22], ['tas', 50], ['kum', 13], ['komur', 15]];
  if (depth === 2) return [['toprak', 6], ['tas', 56], ['kum', 12], ['komur', 20], ['demir', 6]];
  const w = [['tas', 54], ['kum', 7], ['komur', 23], ['demir', Math.min(22, 10 + (depth - 3) * 3)]];
  // 0.8: derinlik 3'ten sonra altin, 5'ten sonra kristal, 7'den sonra kor tasi, 9'dan sonra golge tasi
  if (depth >= 3) w.push(['altin', Math.min(12, 4 + (depth - 3) * 2)]);
  if (depth >= 5) w.push(['kristal', Math.min(10, 3 + (depth - 5) * 2)]);
  if (depth >= 7) w.push(['kor', Math.min(9, 3 + (depth - 7) * 2)]);
  if (depth >= 9) w.push(['golge', Math.min(8, 2 + (depth - 9) * 2)]);
  if (depth >= 12) w.push(['yildiz', Math.min(7, 2 + (depth - 12))]);
  if (depth > DEEP_LIMIT) w.push(['cekirdek', Math.min(5, 2 + (depth - 16))]);
  return w;
}
export const mineXpMult = (depth) => Math.min(1.5, 1 + 0.05 * (depth - 1));
export const mineHardBonus = (depth) => Math.floor((depth - 1) / 4);

// ---------------------------------------------------------------- Toplama (0.2)
export const GATHER = {
  sifali_ot: { name: 'Şifalı ot', node: 'herb', xp: 20, w: 40 },
  bogurtlen: { name: 'Böğürtlen', node: 'berry', xp: 20, w: 35 },
  dal: { name: 'Dal', node: 'branch', xp: 15, w: 25 },
  mantar: { name: 'Mantar', node: 'shroom', xp: 22 },
  hurma: { name: 'Hurma', node: 'palm', xp: 24 },
  kum: { name: 'Kum', node: 'sand', xp: 12 },
  kar_cilegi: { name: 'Kar çileği', node: 'snowberry', xp: 30 },
  ates_biberi: { name: 'Ateş biberi', node: 'pepper', xp: 34 },
  kul: { name: 'Kül', node: 'sand', xp: 20 },
  gece_mantari: { name: 'Gece mantarı', node: 'nightshroom', xp: 38 },
  ay_otu: { name: 'Ay otu', node: 'moonherb', xp: 70 },
};
export const AY_OTU_CHANCE = 0.3; // gece (gercek saat) toplanacak bitkinin Ay otu olma ihtimali
// bolgeye gore toplanabilirler [esya, agirlik]
export const ZONE_GATHER = {
  orman: [['sifali_ot', 40], ['bogurtlen', 35], ['dal', 25]],
  magara: [['mantar', 45], ['sifali_ot', 30], ['dal', 25]],
  col: [['hurma', 45], ['kum', 30], ['bogurtlen', 25]],
  buz: [['kar_cilegi', 50], ['sifali_ot', 25], ['dal', 25]],
  kor: [['ates_biberi', 50], ['kul', 25], ['dal', 25]],
  golge: [['gece_mantari', 55], ['sifali_ot', 25], ['dal', 20]],
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
  yem: { name: 'Yem Tezgâhı', desc: 'Glemon yemleri.' },
};
const gearSet = (tier, main, lvl, xpEach) => [
  { out: `${tier}_kilic`, mats: { [main]: 3, dal: 1 } },
  { out: `${tier}_kazma`, mats: { [main]: 3, dal: 2 } },
  { out: `${tier}_kask`, mats: { [main]: 5 } },
  { out: `${tier}_gogus`, mats: { [main]: 8 } },
  { out: `${tier}_bot`, mats: { [main]: 4 } },
].map((r) => ({ ...r, station: 'masa', lvl, xp: xpEach * r.mats[main] }));

// 0.8 seviye seti: ana malzeme + ikinci malzeme (yay ipi ayri). k: Bonkit gibi nadir cevherde adet carpani
function tierSet(tier, main, extra, string, lvl, xpEach, k) {
  const n = (v) => Math.max(1, Math.round(v * k));
  return [
    { out: `${tier}_kilic`, mats: { [main]: n(3), [extra]: 2 } },
    { out: `${tier}_yay`, mats: { [main]: n(3), [string]: 2 } },
    { out: `${tier}_kazma`, mats: { [main]: n(3), dal: 2 } },
    { out: `${tier}_kask`, mats: { [main]: n(5), [extra]: 1 } },
    { out: `${tier}_gogus`, mats: { [main]: n(8), [extra]: 2 } },
    { out: `${tier}_bot`, mats: { [main]: n(4), [extra]: 1 } },
  ].map((r) => ({ ...r, station: 'masa', lvl, xp: xpEach * r.mats[main] }));
}

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
  // 0.4 Glemon yemleri
  { out: 'orman_turtasi', mats: { bogurtlen: 2, sifali_ot: 1 }, station: 'yem', lvl: 1, xp: 25 },
  { out: 'bal_damlasi', mats: { bal: 1, sifali_ot: 2 }, station: 'yem', lvl: 6, xp: 60 },
  { out: 'mantar_ezmesi', mats: { mantar: 2, tas: 1 }, station: 'yem', lvl: 8, xp: 40 },
  { out: 'kristal_sekeri', mats: { ham_kristal: 2, bal: 1 }, station: 'yem', lvl: 14, xp: 90 },
  { out: 'kaktus_jolesi', mats: { kaktus_suyu: 2, bogurtlen: 1 }, station: 'yem', lvl: 16, xp: 60 },
  { out: 'hurma_tatlisi', mats: { hurma: 2, bal: 1 }, station: 'yem', lvl: 20, xp: 120 },
  // 0.5 yaylar, mataralar, cantalar
  { out: 'tahta_yay', mats: { dal: 3, sifali_ot: 2 }, station: 'masa', lvl: 2, xp: 50 },
  { out: 'tas_yay', mats: { tas: 3, yarasa_zari: 2 }, station: 'masa', lvl: 6, xp: 70 },
  { out: 'demir_yay', mats: { demir_kulcesi: 3, yarasa_zari: 2 }, station: 'masa', lvl: 12, xp: 150 },
  { out: 'su_matarasi', mats: { kaktus_suyu: 2, pul: 1 }, station: 'kazan', lvl: 12, xp: 60 },
  { out: 'orta_iksir', mats: { sifali_ot: 3, kaktus_suyu: 1, bos_sise: 1 }, station: 'kazan', lvl: 18, xp: 110 },
  { out: 'canta_eki', mats: { yarasa_zari: 10, pul: 5 }, station: 'masa', lvl: 15, xp: 300 },
  { out: 'golem_kilici', mats: { golem_cekirdegi: 1, demir_kulcesi: 4, ham_kristal: 4 }, station: 'masa', lvl: 20, xp: 400 },
  { out: 'firtina_yayi', mats: { firtina_disi: 1, demir_kulcesi: 3, yarasa_zari: 4 }, station: 'masa', lvl: 24, xp: 450 },
  { out: 'skarabe_tilsimi', mats: { altin_kanat: 2, bal: 1 }, station: 'masa', lvl: 20, xp: 300 },
  // 0.8 (sona eklenir)
  { out: 'altin_kulcesi', mats: { altin_cevheri: 2, komur: 1 }, station: 'firin', lvl: 22, xp: 70 },
  { out: 'kor_kulcesi', mats: { kor_tasi: 2, komur: 2 }, station: 'firin', lvl: 38, xp: 140 },
  { out: 'bonkit_kulcesi', mats: { bonkit: 1, kor_tasi: 1 }, station: 'firin', lvl: 52, xp: 300 },
  { out: 'golge_kulcesi', mats: { golge_tasi: 2, kor_tasi: 1 }, station: 'firin', lvl: 64, xp: 260 },
  ...tierSet('kristal', 'saf_kristal', 'altin_kulcesi', 'kar_tuyu', 30, 40, 1),
  ...tierSet('kor', 'kor_kulcesi', 'kor_pulu', 'kivilcim', 42, 70, 1),
  ...tierSet('bonkit', 'bonkit_kulcesi', 'saf_kristal', 'yarasa_zari', 55, 160, 0.5),
  ...tierSet('golge', 'golge_kulcesi', 'golge_ozu', 'gece_postu', 68, 130, 1),
  { out: 'kar_kurabiyesi', mats: { kar_cilegi: 2, dal: 1 }, station: 'yem', lvl: 26, xp: 70 },
  { out: 'aurora_sekeri', mats: { kar_cilegi: 2, bal: 1 }, station: 'yem', lvl: 30, xp: 140 },
  { out: 'biber_kebabi', mats: { ates_biberi: 2, kul: 1 }, station: 'yem', lvl: 36, xp: 90 },
  { out: 'yakut_receli', mats: { ates_biberi: 2, bal: 1 }, station: 'yem', lvl: 40, xp: 170 },
  { out: 'gece_coregi', mats: { gece_mantari: 2, dal: 1 }, station: 'yem', lvl: 46, xp: 110 },
  { out: 'ay_pastasi', mats: { gece_mantari: 2, bal: 1 }, station: 'yem', lvl: 50, xp: 200 },
  { out: 'sicak_corba', mats: { mantar: 2, sifali_ot: 1, komur: 1 }, station: 'firin', lvl: 24, xp: 60 },
  { out: 'ates_iksiri', mats: { buz_kristali: 2, sifali_ot: 1, bos_sise: 1 }, station: 'kazan', lvl: 32, xp: 120 },
  { out: 'buyuk_iksir', mats: { sifali_ot: 3, kar_cilegi: 2, bos_sise: 1 }, station: 'kazan', lvl: 40, xp: 180 },
  { out: 'buzul_kilici', mats: { buzul_kalbi: 1, saf_kristal: 4, altin_kulcesi: 2 }, station: 'masa', lvl: 34, xp: 600 },
  { out: 'magma_gogus', mats: { magma_kabugu: 1, kor_kulcesi: 4 }, station: 'masa', lvl: 45, xp: 800 },
  { out: 'bosluk_yayi', mats: { bosluk_tasi: 1, golge_kulcesi: 3, gece_postu: 3 }, station: 'masa', lvl: 66, xp: 1100 },
  { out: 'aurora_tilsimi', mats: { aurora_boynuzu: 2, altin_kulcesi: 2 }, station: 'masa', lvl: 34, xp: 500 },
  { out: 'yakut_tilsimi', mats: { yakut: 2, altin_kulcesi: 2 }, station: 'masa', lvl: 46, xp: 650 },
  { out: 'ay_tilsimi', mats: { ay_tozu: 2, altin_kulcesi: 2 }, station: 'masa', lvl: 56, xp: 800 },
  // 0.8.5 balikcilik (sona eklenir)
  { out: 'tahta_olta', mats: { dal: 4, sifali_ot: 1 }, station: 'masa', lvl: 1, xp: 40 },
  { out: 'bambu_olta', mats: { dal: 8, yarasa_zari: 2 }, station: 'masa', lvl: 8, xp: 120 },
  { out: 'demir_olta', mats: { demir_kulcesi: 3, yarasa_zari: 2 }, station: 'masa', lvl: 14, xp: 200 },
  { out: 'kristal_olta', mats: { saf_kristal: 3, kar_tuyu: 2 }, station: 'masa', lvl: 32, xp: 400 },
  { out: 'kor_olta', mats: { kor_kulcesi: 3, kivilcim: 2 }, station: 'masa', lvl: 44, xp: 600 },
  { out: 'parlak_yem', n: 3, mats: { solucan: 3, ham_kristal: 1 }, station: 'kazan', lvl: 10, xp: 60 },
  { out: 'izgara_balik', mats: { pulcuk: 2, komur: 1 }, station: 'firin', lvl: 2, xp: 30 },
  { out: 'izgara_balik', n: 2, mats: { yaprak_baligi: 2, komur: 1 }, station: 'firin', lvl: 10, xp: 50 },
  { out: 'balik_corbasi', mats: { camur_yayini: 1, mantar: 1, sifali_ot: 1 }, station: 'firin', lvl: 12, xp: 70 },
  { out: 'balik_corbasi', n: 2, mats: { buz_morinasi: 1, kar_cilegi: 1, sifali_ot: 1 }, station: 'firin', lvl: 30, xp: 110 },
  { out: 'balik_kraker', mats: { cizgili_sazan: 1, kum: 1 }, station: 'yem', lvl: 10, xp: 50 },
  { out: 'inci_kraker', mats: { cizgili_sazan: 1, gol_incisi: 1 }, station: 'yem', lvl: 25, xp: 160 },
  { out: 'inci_tilsimi', mats: { gol_incisi: 3, altin_kulcesi: 2 }, station: 'masa', lvl: 40, xp: 700 },
  { out: 'pullu_pelerin', mats: { efsane_pul: 4, golge_ozu: 4, gece_postu: 2 }, station: 'masa', lvl: 65, xp: 1400 },
  { out: 'efsane_olta', mats: { efsane_pul: 3, yildiz_demiri: 2, kor_olta: 1 }, station: 'masa', lvl: 70, xp: 1600 },
  { out: 'cekirdek_kazma', mats: { cekirdek_kristali: 3, yildiz_demiri: 3, dal: 2 }, station: 'masa', lvl: 75, xp: 1800 },
  { out: 'sifirlama_tasi', mats: { cekirdek_kristali: 1, altin_kulcesi: 2 }, station: 'masa', lvl: 60, xp: 500 },
  { out: 'ay_iksiri', mats: { ay_otu: 2, bal: 1, bos_sise: 1 }, station: 'kazan', lvl: 35, xp: 220 },
  { out: 'renkli_cam', n: 4, mats: { deniz_cami: 1, cam: 2 }, station: 'masa', lvl: 15, xp: 40 },
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
  { id: 'solucan', price: 4 },
  { id: 'bogurtlen_tohumu', price: 15 },
  { id: 'orman_turtasi', price: 25 },
  { id: 'tahta_yay', price: 60 },
  { id: 'sicak_corba', price: 45 },
  { id: 'ates_iksiri', price: 80 },
  { id: 'altin_elma', price: 450 },
  { id: 'can_tilsimi', price: 1500 },
];
export const SELL = {
  dal: 1, mantar: 2, diken: 2, tas: 1, kum: 1, komur: 2, demir_cevheri: 4, demir_kulcesi: 10,
  sifali_ot: 2, bogurtlen: 2, bal: 15, yaprak_kanadi: 12, antik_yosun: 40, tahta_kalas: 2, tas_tugla: 2, cam: 2,
  kutuk: 2, kaldirim: 1, kiremit: 2, cit: 1, ot_tohumu: 3, bogurtlen_tohumu: 4,
  ham_kristal: 4, yarasa_zari: 3, bocek_kanadi: 80, ametist: 120, akrep_ignesi: 20, kaktus_suyu: 3, pul: 3,
  eski_sargi: 25, altin_kanat: 150, hurma: 3, orman_turtasi: 6, mantar_ezmesi: 6, kaktus_jolesi: 8,
  buz_kristali: 5, kar_tuyu: 5, kiragi_postu: 6, aurora_boynuzu: 180, kor_pulu: 6, kivilcim: 6, kul: 3, yakut: 220,
  golge_ozu: 8, gece_postu: 8, ay_tozu: 260, kar_cilegi: 4, ates_biberi: 5, gece_mantari: 6,
  altin_cevheri: 8, altin_kulcesi: 20, saf_kristal: 14, kor_tasi: 18, kor_kulcesi: 40, bonkit: 200, bonkit_kulcesi: 420,
  golge_tasi: 30, golge_kulcesi: 70, kar_kurabiyesi: 10, biber_kebabi: 12, gece_coregi: 14,
  yildiz_demiri: 120, cekirdek_kristali: 400, ay_otu: 30, usta_damgasi: 150, renkli_cam: 6,
  solucan: 1, parlak_yem: 5, gol_incisi: 150, deniz_cami: 25, efsane_pul: 300, izgara_balik: 10, balik_corbasi: 18, balik_kraker: 6,
};
// baliklar: seviyesiyle ve nadirligiyle artar
for (const [k, f] of Object.entries(FISH)) SELL[k] = Math.round((2 + f.lvl * 0.6) * (f.legend ? 8 : f.rarity === 'nadir' ? 2 : 1));

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
  renkli_cam: { tex: 'renkli_cam', lvl: 15, xp: 20, pts: 4 },
  // 0.9 Gezgin Tuccar bloklari
  ay_tasi: { tex: 'ay_tasi', lvl: 5, xp: 20, pts: 5 },
  altin_tugla: { tex: 'altin_tugla', lvl: 5, xp: 20, pts: 5 },
  pembe_yaprak: { tex: 'pembe_yaprak', lvl: 5, xp: 16, pts: 4 },
  mavi_fener: { tex: 'mavi_fener', lvl: 5, xp: 40, pts: 8 },
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
  ay_tohumu: { out: 'ay_otu', n: [1, 2], ms: 4 * 60 * 60 * 1000, xp: 160, name: 'Ay otu' },
  altin_tohum: { out: 'altin_elma', n: [1, 1], ms: 8 * 60 * 60 * 1000, xp: 300, name: 'Altın Elma' },
};
export const SEED_CHANCE = 0.3; // ot / bogurtlen toplarken tohum cikma ihtimali
// Kamp: oyun kapaliyken en fazla 2 saat, saatte bu kadar basit malzeme (XP ve nadir esya yok)
export const CAMP = { maxMs: 2 * 60 * 60 * 1000, minMs: 10 * 60 * 1000, perHour: { dal: 6, tas: 6, komur: 3, bogurtlen: 3 } };

// ---------------------------------------------------------------- Gorevler (0.6, Hanci Lale)
// Her gorev bir sayacin kabul anindan sonra ne kadar arttigina bakar (zindan: rekor).
// tier: 0 kolay, 1 orta, 2 zor. Odul: Cimen Blogu + ilgili beceriye XP.
export const QUESTS = {
  kill: { name: (n) => `${n} Glemon yen`, stat: (s) => s.stats.kills, amt: [8, 16, 30], skill: 'saldiri' },
  gather: { name: (n) => `Keşifte ${n} kez toplama yap`, stat: (s) => s.stats.gathered, amt: [3, 6, 10], skill: 'toplama' },
  mine: { name: (n) => `Madende ${n} blok kaz`, stat: (s) => s.stats.mined, amt: [12, 25, 45], skill: 'madencilik' },
  craft: { name: (n) => `${n} eşya üret`, stat: (s) => s.stats.crafted, amt: [3, 6, 12], skill: 'uretim' },
  tame: { name: (n) => `${n} Glemon evcilleştir`, stat: (s) => s.stats.tamed || 0, amt: [1, 1, 2], skill: 'bag', minBag: 1 },
  boss: { name: (n) => `${n} patron ya da ara patron yen`, stat: (s) => (s.stats.bossKills || 0) + (s.stats.golden || 0), amt: [1, 1, 2], skill: 'sans' },
  zindan: { name: (n) => `Zindan'da Kat ${n}'e in`, abs: true, stat: (s) => s.stats.zindanBest || 0, amt: [2, 4, 7], skill: 'savunma' },
  species: { name: (n, k) => `${n} ${GLEMONS[k].name} yen`, stat: (s, k) => (s.stats.glemons || {})[k] || 0, amt: [4, 8, 14], skill: 'saldiri' },
};
export const QUEST_SLOTS = 3;

// ---------------------------------------------------------------- Yetenek agaci (0.8.5)
// 4 dal. Bir dalin becerilerinde her 10 seviye o dala 1 puan verir. Her katta 2 yetenekten
// birini secersin. Kat maliyeti: 5, 7, 6 puan (2. kat icin 5, 3. kat icin 12 puan harcamis olmalisin).
export const TREE_COST = [5, 7, 6];
export const TREE = {
  savas: {
    name: 'Savaş', skills: ['saldiri', 'savunma', 'can', 'okculuk'],
    tiers: [
      [{ key: 'keskin_kilic', name: 'Keskin Kılıç', desc: 'Kılıç ve yumruk gücü +%8' }, { key: 'kartal_gozu', name: 'Kartal Gözü', desc: 'Yay gücü +%8' }],
      [{ key: 'refleks', name: 'Refleks', desc: 'Kaçınma düğmesi %20 uzun kalır, otomatik savaşta %25 kaçınırsın' }, { key: 'demir_deri', name: 'Demir Deri', desc: 'Aldığın hasar -%10' }],
      [{ key: 'ofke', name: 'Öfke', desc: 'Canın %30\'un altındayken kritik +%20' }, { key: 'karsi_darbe', name: 'Karşı Darbe', desc: 'Kusursuz kaçışın karşı darbesi 2 kat' }],
    ],
  },
  toplayici: {
    name: 'Toplayıcı', skills: ['madencilik', 'toplama', 'balikcilik'],
    tiers: [
      [{ key: 'hizli_kazma', name: 'Hızlı Kazma', desc: 'Bloklar 1 vuruş erken kırılır' }, { key: 'sabirli_olta', name: 'Sabırlı Olta', desc: 'Balık %30 daha çabuk ısırır' }],
      [{ key: 'damar_bulucu', name: 'Damar Bulucu', desc: 'Değerli cevher şansı +%30' }, { key: 'genis_ag', name: 'Geniş Ağ', desc: 'Balık yakalama kutusu +%20' }],
      [{ key: 'derin_kazi', name: 'Derin Kazı', desc: 'Madende Derinlik 15\'ten aşağı inebilirsin (Çekirdek Kristali)' }, { key: 'efsane_avcisi', name: 'Efsane Avcısı', desc: 'Efsane balık şansı 2 kat' }],
    ],
  },
  zanaat: {
    name: 'Zanaat', skills: ['uretim', 'insa'],
    tiers: [
      [{ key: 'tutumlu', name: 'Tutumlu', desc: '%10 ihtimalle malzemeler gitmez' }, { key: 'sicak_firin', name: 'Sıcak Fırın', desc: 'Fırın %30 hızlı pişirir' }],
      [{ key: 'cifte_uretim', name: 'Çifte Üretim', desc: '%8 ihtimalle 2 tane çıkar' }, { key: 'usta_insa', name: 'Usta İnşa', desc: 'Üs Puanı +%25' }],
      [{ key: 'usta_isi', name: 'Usta İşi', desc: 'Üretilebilen silah, zırh ve aletler +%5 güçlü' }, { key: 'mimar', name: 'Mimar', desc: 'Arsan 1 sıra yükselir, 4 tarla fazla' }],
    ],
  },
  glemon: {
    name: 'Glemon', skills: ['bag', 'sans'],
    tiers: [
      [{ key: 'yem_ustasi', name: 'Yem Ustası', desc: 'Evcilleştirme şansı +%15' }, { key: 'sansli_dogan', name: 'Şanslı Doğan', desc: 'Şans +8' }],
      [{ key: 'sadik_dost', name: 'Sadık Dost', desc: 'Evcilinin saldırısı +%15' }, { key: 'parlak_goz', name: 'Parlak Göz', desc: 'Parlak Glemon şansı 1,5 kat' }],
      [{ key: 'yumurta_bakicisi', name: 'Yumurta Bakıcısı', desc: 'Yumurtalar 60 savaşta çatlar' }, { key: 'hazine_avcisi', name: 'Hazine Avcısı', desc: 'Sandıklardan 1 eşya fazla çıkar' }],
    ],
  },
};
// ---------------------------------------------------------------- Tur ustaligi (0.8.6)
// Bir Glemon turunu yendikce o ture karsi guclenirsin: [yenilen sayi, hasar bonusu]
export const MASTERY = [[50, 0.05], [250, 0.1], [1000, 0.15]];
export function masteryOf(kills) {
  let lvl = 0; let bonus = 0;
  for (const [n, b] of MASTERY) if (kills >= n) { lvl++; bonus = b; }
  return { lvl, bonus, next: MASTERY[lvl] ? MASTERY[lvl][0] : null };
}
export const respecCost = (spent) => 100 + spent * 40;
export const QUEST_REROLL = 15;
