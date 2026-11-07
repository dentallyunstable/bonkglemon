# Bonkglemon

Arkadaşlarınla (en fazla 3 kişi) oynanan 2D piksel bir web oyunu. Zindana in,
**Glemon** adlı yaratıklarla savaş, eşya topla, becerilerini 1'den 99'a kadar kas
ve okulda arkadaşlarına profil kartını göster.

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
