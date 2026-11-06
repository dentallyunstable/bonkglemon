# Bonkglemon

Arkadaşlarınla (en fazla 3 kişi) oynanan 2D piksel bir web oyunu. Zindana in,
**Glemon** adlı yaratıklarla savaş, eşya topla, becerilerini 1'den 99'a kadar kas
ve okulda arkadaşlarına profil kartını göster.

## Sürüm 0.1 (ilk prototip)

- **Giriş:** Her karakter (dunstable, chegn, bonk) sadece kendi koduyla açılır.
  Kodlar bu depoda yazmaz; sadece şifrelenmiş özetleri (SHA-256) vardır.
- **Üs:** Ev, depo sandığı, kamp ateşi, harita tabelası ve maden girişi.
- **Yabani Orman, Kat 1–10:** Savaş, sandık, tuzak, uyuyan Glemon ve kamp ateşi
  odaları. Kat 5'te altın ara patron, Kat 10'da **Ağaçbaşı**.
- **Savaş:** Bekleme çubuğu (ATB). Manuel modda zamanlama çubuğu (Mükemmel ×2,
  İyi ×1.2, Zayıf ×0.8) ve "KAÇIN!" ile kaçınma vardır; Oto mod iyi oynar ama
  kusursuz değildir. Manuel oynayan %20 daha fazla XP alır.
- **Beceriler:** Saldırı, Savunma, Can (diğer 7 beceri sonraki sürümlerde).
- **Çanta, ekipman, depo, profil kartı ve düşüş günlüğü.**
- Bayılırsan bu turda topladıklarının yarısını kaybedersin; "Üsse dön" her şeyini korur.

Kayıtlar şimdilik oyunu açtığın cihazın tarayıcısında tutulur. Bulut kaydı ve
arkadaş özellikleri (Buluşma ekranı) 0.6 sürümünde **Firebase (Spark, ücretsiz)**
ile gelecek.

## Kontroller

- Üste: yere dokun ya da A/D, ok tuşları ile yürü. Nesnelere dokun.
- Savaşta: düğmeler; zamanlama ve kaçınma için ekrana dokun ya da boşluk tuşu.

## Geliştirme

Derleme adımı yok: düz JavaScript modülleri + [Phaser 3](https://phaser.io) (`vendor/`).
Yerelde denemek için bir web sunucusu yeterli:

```
python3 -m http.server 8000
```

- `src/` oyun kodu (`data.js` denge sayıları, `battle.js` savaş, `world.js` üs ve zindan)
- `assets/chars/` karakter animasyonları (`tools/convert_chars.py` ile GIF'lerden)
- `assets/glemons/` Glemon çizimleri (`tools/gen_glemons.py` ile üretilir)
- Font: Pixelify Sans (SIL Open Font License, `vendor/fonts/`)
