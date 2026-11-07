# Bonkglemon

Arkadaşlarınla (en fazla 3 kişi) oynanan 2D piksel bir web oyunu. Zindana in,
**Glemon** adlı yaratıklarla savaş, eşya topla, becerilerini 1'den 99'a kadar kas
ve okulda arkadaşlarına profil kartını göster.

## Sürüm 0.5.0 (Yeni bölgeler)

- **Yankı Mağaraları (Kat 11-20):** Ağaçbaşı yenilince açılır. Bazı odalar karanlık: çantanda Fener yoksa ıskalarsın. Patron: **Taş Golemi** (sarsıntı, kabuğa çekilme, Mıcır çağırır).
- **Kavurucu Çöl (Kat 21-30):** Taş Golemi yenilince açılır. Sıcak: Su Matarası yoksa her odada biraz can gider. Patron: **Fırtına Çakalı** (kum fırtınası, karanlık, kertenkele çağırır).
- **10 yeni Glemon:** Mıcır, Taşkabuk, Pırpır (uçar), Kristalböcek, Ametist Kirpi, Kumkıskaç, Kaktüs Bekçisi, Toz Kertenkelesi, Sargıcık, Altın Skarabe. Her bölgenin kendi Glemon tipi var (Orman / Taş / Kum / Gölge); güçlü tip "Etkili!" vurur.
- **Okçuluk ve yaylar:** Tahta, Taş, Demir, Fırtına ve Çakal yayı. Yayla savaşa önde başlarsın, uçan Glemonlara tam vurursun (kılıç ve yumruk yarım vurur).
- **Yetenekler:** silah becerisi 20/40/60'ta her silaha 3 yetenek açılır (Döner Kesik, Çoklu Ok, Ateşli Ok, Buz Yumruğu, Patlat…).
- **Durumlar:** Zehir, Yanma, Sersem, Donma, Karanlık. **Kombolar:** Buz Kırıcı, Alev Patlaması, Zehirli Yağmur; ilk yapışta Kombo Defteri'ne yazılır.
- Yeni eşyalar: Golem Kılıcı, Golem Yumruğu, Skarabe Tılsımı (Şans), Çanta Eki (+5 yer), Orta İksir, Su Matarası. Şans becerisi artık çalışır (sandık ve nadir düşüş).

## Sürüm 0.4.0 (Glemon dostları)

- **Evcilleştirme:** bir Glemon'un canı %25'in altına inince savaşta "Yem ver". Yemler Yem Tezgâhı'nda yapılır (Orman Turtası, Bal Damlası, Mantar Ezmesi, Kristal Şekeri, Kaktüs Jölesi, Hurma Tatlısı). Nadir ve Epik Glemonlar özel yem ve yüksek Glemon Bağı ister. Uyuyan Glemon daha kolay gelir.
- **Ahır:** evcil Glemonların burada durur (6 yer, İnşa seviyesiyle 30'a kadar büyür). Birini "Yanıma al" dersen üste ve zindanda yanında yürür, savaşta seninle savaşır, özel yeteneğini ★ ile kullanırsın. Bayılırsa üsse dönünce iyileşir.
- **Evrim:** Bebek → Genç (Sv. 15) → Usta (Sv. 35). Her evrimde büyür, taç ve renk kazanır. Zindanda nadiren Genç ve Usta yabani Glemonlar da çıkar.
- **Glemon Bağı becerisi (1-99):** evcilleştirdikçe ve dostunla savaştıkça artar; dostlarının seviye sınırı Bağ'ın yarısıdır.
- **Albüm:** gördüğün, yendiğin, evcilleştirdiğin ve parlak yakaladığın Glemonlar. Profilde Albüm yüzdesi.

## Sürüm 0.3.2 (Gün saati)

- Üs ve arsa gerçek saate göre değişir: gündoğumu (06-08), gündüz (08-18), günbatımı (18-20), gece (20-06). Kızıl gökyüzü, yıldızlar, ay; gece kamp ateşi ve fenerler parlar.
- Üsse her dönüşte gündoğumu/gündüzse day1 ya da day2, günbatımı/geceyse night1 ya da night2 rastgele çalar. Takas Tezgâhı'nda shop müziği çalar.
- Müzik dosyaları web için 128 kbps'ye küçültüldü.

## Sürüm 0.3.1 (Müzik)

- Karakter seçim ekranında menü müziği, her savaşta savaş müziği çalar (Eren'in parçaları, `assets/music/`). Profildeki ses ayarı müziği de kapatır.

## Sürüm 0.3.0 (Üs)

- **Arsa:** üste "Arsa" düğmesiyle (ya da sağa yürüyerek) kendi blok alanına gidersin. Başta 16×8 blok; İnşa 20'de 20 sütun, 40'ta 24×9, 60'ta 24×10.
- **İnşa modu:** aşağıdan bir blok seç, boş kareye dokun, karakter bloğu koyar. "Kaldır" ile geri alırsın, malzeme çantana döner.
- **İnşa blokları:** Tahta Kalas, Kütük, Kum, Taş, Çit, Kaldırım Taşı, Bahçe Tarlası, Taş Tuğla, Ahşap Kapı (2 blok), Kiremit (düz / sol / sağ eğim), Yaprak Bloğu, Fener, Cam. Yeni tarifler Üretim Masası'nda (kiremit fırında).
- **İnşa becerisi (1-99):** blok koydukça artar. XP sadece arsadaki blok sayısı yeni rekora çıkınca gelir (koy-kaldır ile XP kasılmaz).
- **Bahçe:** tarlaya ot tohumu (1 saat) ya da böğürtlen tohumu (2 saat) ekersin, oyun kapalıyken de büyür. Tohumlar toplarken çıkar ve tezgâhta satılır.
- **Kamp ödülü:** oyun kapalıyken en fazla 2 saatlik dal, taş, kömür ve böğürtlen birikir; girişte toplarsın.
- **Üs Puanı** profilde. Zindanda bayılınca evindeki yatakta uyanırsın.

## Sürüm 0.2.5

- Savaşta hedef seçerken yaratığın kendisine dokunmak da yetiyor (sadece sarı ok değil).

## Sürüm 0.2.4

- Ağaç yaprakları artık gövdeye ve birbirine oturuyor (havada yaprak yok).
- Oturma ve zıplama animasyonunda karakter havada durmuyor.
- Giriş ekranında karakterler kartın tam ortasında dönüyor.

## Sürüm 0.2.3 (16x16 blok tarzı)

- Her şey 16x16 bloklardan kuruldu: ev, maden girişi, ağaçlar, tepeler, zemin, ev içi, maden ocağı, savaş ekranı.
- Her blok dokusu sabit, soluk ve 4-6 tonlu (`src/blocks.js`). Uzak tepe ve ağaçlar aynı blokların sisli hâli.
- Simgeler 16x16; Glemonların renkleri soldu, ışık ve gölge tonları eklendi.

## Sürüm 0.2.2 (Ayrı savaş ekranı)

- Savaş artık ayrı bir ekranda açılır: perspektifli çayır, ufukta orman, Glemonlar uzaktaki meydanda bize dönük, karakter sol altta sırtı dönük.

## Sürüm 0.2.1 (Animasyonlar)

- Karakter yürürken yandan, dururken 3/4 önden görünür; bir yere girerken kısa süre arkadan yürür.
- Savaş ekranı karakterin sırtından bakar: karakter solda, yakın ve hafif bulanık, Glemonlar karşıda bize dönük.
- Ölüm, sevinç ve kaçınma animasyonları her seferinde rastgele seçilir. Uzun süre durunca karakter oturur.
- Para birimi artık **Çimen Bloğu**. Üste **Takas Tezgâhı** geldi (al / sat).
- Yeni eşyalar: Altın Elma (savaşta 5 tur güç), Can Tılsımı (bir kez ayağa kaldırır). Yemekler 3 tur güç verir.
- Ağaçbaşı'nın yeni saldırısı Yanan Reçine seni yakar.
- Karakter resimleri tek bir atlas dosyasında (`tools/convert_chars.py`).

## Sürüm 0.2 (Zanaat)

- **Yeni çizim tarzı:** Her şey karakterler gibi düz renkli, az tonlu, iri pikselli ve
  siyah çizgili çizilir (`src/art.js`, `tools/gen_glemons.py`).
- **Maden Ocağı** (Harita'dan ya da üsteki düğmeden): 8 × 6 blokluk duvar. Sol sıradaki
  ya da yanı açık bloklara dokununca kazarsın. Toprak, Kum, Taş, Kömür, derinde Demir
  (Madencilik 15) ve nadiren Define sandığı. Yarısını kazınca "Daha derin".
- **Evin içi:** Üretim Masası (silah, kazma, zırh, inşa blokları), Fırın (külçe, şişe, cam,
  çorba; her biri 5 sn, sen yokken de çalışır) ve Simya Kazanı (iksir, Bonk Bombası).
- **Tahta, Taş ve Demir kademeleri:** kılıç, kazma, kask, göğüslük, bot. Taş seti +5 can,
  Demir seti Savunma +%10.
- **Tarif defteri:** Bir tarif, ilk malzemesini bir kez bulunca açılır.
- **Zindanda:** Şifalı ot, böğürtlen ve dal toplama; maden damarı odaları.
- **Savaşta Eşya menüsü:** iksir, Mantar Çorbası ve Bonk Bombası (bütün Glemonlara vurur).
- Yeni beceriler: **Madencilik, Toplama, Üretim.** Yeni Kazma yuvası (herkes Tahta Kazma ile başlar).

## Sürüm 0.1 (ilk prototip)

- **Giriş:** Her karakter (dunstable, chegn, bonk) sadece kendi koduyla açılır.
  Kodlar bu depoda yazmaz; sadece şifrelenmiş özetleri (SHA-256) vardır.
- **Üs:** Ev, depo sandığı, kamp ateşi, harita tabelası ve maden girişi.
- **Yabani Orman, Kat 1–10:** Savaş, sandık, tuzak, uyuyan Glemon ve kamp ateşi
  odaları. Kat 5'te altın ara patron, Kat 10'da **Ağaçbaşı**.
- **Savaş:** Bekleme çubuğu (ATB). Manuel modda zamanlama çubuğu (Mükemmel ×2,
  İyi ×1.2, Zayıf ×0.8) ve "KAÇIN!" ile kaçınma vardır; Oto mod iyi oynar ama
  kusursuz değildir. Manuel oynayan %20 daha fazla XP alır.
- **Beceriler:** Saldırı, Savunma, Can.
- **Çanta, ekipman, depo, profil kartı ve düşüş günlüğü.**
- Bayılırsan bu turda topladıklarının yarısını kaybedersin; "Üsse dön" her şeyini korur.

Kayıtlar şimdilik oyunu açtığın cihazın tarayıcısında tutulur. Bulut kaydı ve
arkadaş özellikleri (Buluşma ekranı) 0.6 sürümünde **Firebase (Spark, ücretsiz)**
ile gelecek.

## Kontroller

- Üste ve evde: yere dokun ya da A/D, ok tuşları ile yürü. Nesnelere dokun.
- Madende: bloklara dokun.
- Savaşta: düğmeler; zamanlama ve kaçınma için ekrana dokun ya da boşluk tuşu.

## Geliştirme

Derleme adımı yok: düz JavaScript modülleri + [Phaser 3](https://phaser.io) (`vendor/`).
Yerelde denemek için bir web sunucusu yeterli:

```
python3 -m http.server 8000
```

- `src/` oyun kodu (`data.js` denge sayıları ve tarifler, `battle.js` savaş, `world.js` üs, ev, maden ve zindan, `panels.js` paneller ve üretim, `art.js` kodla çizilen piksel sanat)
- `assets/chars/` karakter animasyonları (`tools/convert_chars.py` ile GIF'lerden)
- `assets/glemons/` Glemon çizimleri (`tools/gen_glemons.py` ile üretilir)
- Font: Pixelify Sans (SIL Open Font License, `vendor/fonts/`)
