# Bonkglemon

Arkadaşlarınla (en fazla 3 kişi) oynanan 2D piksel bir web oyunu. Zindana in,
**Glemon** adlı yaratıklarla savaş, eşya topla, becerilerini 1'den 99'a kadar kas
ve okulda arkadaşlarına profil kartını göster.

## Sürüm 1.0.17 - 1.0.22 (Denetim düzeltmeleri)

- 1.0.22 Eren'in kararları: patronlar hem uzun (20-42 vuruş) hem sert (vuruşu canın ~%14'ü), patron kontrol noktası (patrona ulaşınca Keşif'te "Patron" düğmesi, bayılınca "Patrona tekrar dene"), gün vakti yine gerçek saate bağlı, XP payı 60/20/20 ve Orman ilk 3 kat -%25 (rapordaki değerler).

- 1.0.17 acil hatalar: çanta doluyken ganimet kaybolmaz (Depo, sonra bekleyen kutusu), oto savaş mutfak yemeklerini de yer, satışta onay, Bonus düğmesi gizli.
- 1.0.18 denge: Saldırı / Can / Savunma XP payı 50/20/30, eşya seviyeleri 25/35/45/55, kısa ama sert patronlar, yoldaş saldırısı %60, Orman'ın ilk 3 katı daha kolay (kamp ateşi garanti). Örs ucuz malzemelerle başlar, artılar eşyanın kendisinde durur (kayıt sürümü 4). Çanta yuvası satın alma, kalite yeniden atma.
- 1.0.19 sade ekran: yeni adlar (Ev, Göl, Maden Kuyusu, Köy Haritası), yakına gelince çıkan yazılar, birleşik seviye mesajı, küçük ilk adım rozeti, tek tuşla alt sınıf değiştirme.
- 1.0.20 gece ve gündüz: zindan ve maden göğü gece karanlık, yeni Çöl / Gölge / Yıldız arka planları.
- 1.0.21 kod temizliği: saat ileri alma hilesine geçici koruma (kapalıyken en fazla 12 saat sayılır), madende bayılınca o inişte kazılanın yarısı düşer, test kapıları yayında kapalı, world.js parçalara bölündü (plot, pond, dungeon).

## Sürüm 0.13.5 (Ustalık)

- Eşya kalitesi: yeni silah, zırh ve tılsımlar bazen Nadir (1 ek özellik) ya da Epik (2 ek özellik) çıkar. Üretim seviyesi, patronlar ve Kule sandıkları şansı artırır.
- Set bonusları 2 kademe: 2 parça küçük bonus, 3 parça tam bonus (Tahta setine de geldi).
- Efsanevi silahlar, 3 yol (aynı güç): Yıldız (Üret), Kadim (zor patron / Kule), Şanlı (Lale'nin Efsane Vitrini, Lale Pulu + 300 başarım puanı). Kılıç, yay ve asa.
- Örs'te Parçala: üretilmiş eski eşyadan malzemelerin yarısı geri gelir.
- Sonsuz Kule (Lale haritası ve Etkinlik Kapısı): her kat tek savaş + rastgele kural, 5 katta ara patron ve kontrol noktası, 10 katta Kule sandığı, haftalık rekor.
- Patronlar: canı yarıya inince 2. aşama, yenince Zor mod (kendi ödülleri), Patron Günlüğü (Kupa Rafı ve Lale).

## Sürüm 0.13.0 (Sınıflar ve Büyü)

- Yeni beceri Büyü: asalar (Çırak Asası, Taş, Demir, Kristal, Kor, Bonkit, Gölge), Rün Taşı ve 3 rün tılsımı. Büyü Oku ve büyü yetenekleri (Alev Dalgası, Buz Kalkanı, Lanet Bulutu) mana harcar.
- Kılıç / yay / asa üçgeni: her Glemon tipi bir tarza zayıf, birine dayanıklı (Albümde yazar). Savaşta silah değiştirmek 1 tur sürer.
- Sınıflar (Hancı Lale, savaş becerisi 20): Savaşçı, Nişancı, Büyücü, Destek; 50'de 8 alt sınıf. Yetenek ağacının Savaş dalı artık Sınıf dalı (eski puanlar iade). Her sınıfın büyük yeteneği ve pelerini var.
- Manuel savaş 2.0: seri sayacı, Savun'dayken savuşturma, düşman niyeti, bitirici vuruş.

## Sürüm 0.8.5 (Su ve Yetenek)

- **Yeni kaçınma:** Glemon saldırmadan önce ekranın rastgele bir yerinde "KAÇ!" düğmesi çıkar, halka bitmeden bas. Patronlarda bazen arka arkaya 2 düğme. Halkanın ilk yarısında basarsan **Kusursuz kaçış** ve küçük bir karşı darbe. Düğmenin dışına basmak ıska.
- **Balıkçılık (yeni beceri):** Üs Göleti (üstte "Göl" düğmesi) ve Keşifteki göl odaları (her bölgede; Kor Diyarında lav gölü). Karakter tahta oltayla iskelede balık tutar. Olta at, şamandıra batınca dokun, sonra basılı tutarak yeşil kutuyla balığı yakala.
- 22 balık + her bölgede bir efsane balık, 6 olta (Tahta, Bambu, Demir, Kristal, Kor, Efsane), yemler (Solucan, Parlak Yem), batık sandıklar ve oltaya takılan 3 Su Glemonu (Damlacık, İnci İstiridye, Göl Ejderi). Albümde Balıklar sayfası.
- Balık yemekleri: Izgara Balık, Balık Çorbası; Su Glemonları için Balık Kraker.
- **Sadece tek beceriyle bulunanlar:** Göl İncisi, Efsane Pul, Deniz Camı (balık), Yıldız Demiri ve Çekirdek Kristali (en derin maden), Ay otu (sadece gece toplanır), Usta Damgası (Üretim 75+).
- **Örs:** Üretim Masasından açılır. Kuşandığın silah, zırh ya da kazmayı Yıldız Demiriyle +3'e, Usta Damgasıyla +4'e yükselt. Her artı %8, asla başarısız olmaz.
- **Yetenek ağacı:** 4 dal (Savaş, Toplayıcı, Zanaat, Glemon). Becerilerde her 10 seviye 1 puan; her katta 2 yetenekten birini seç. Hancı Lale sıfırlar.

## Sürüm 0.8.0 (Dünya tamam)

- **3 yeni Keşif bölgesi:** Donmuş Zirve (Kat 31-40), Kor Diyarı (41-50) ve Gölge Boşluğu (51-60). Her biri kendi arka planı, savaş arenası ve 5 yeni Glemonuyla.
- **Yeni patronlar:** Buzul Ayısı (buz nefesi, çığ), Magma Kaplumbağası (kızgın kabuk herkesi yakar) ve Boşluk Bekçisi (ışınlanır, gölge kopyaları çağırır).
- **Bölge tehlikeleri:** Zirvede Sıcak Çorba içmezsen savaşlarda yavaşlarsın. Kor Diyarında Ateş Direnci İksiri yoksa savaşa yanarak başlarsın. Gölge Boşluğunda odaların yarısı karanlık.
- **Yeni cevherler:** Altın (Madencilik 25), Kristal (35), Kor taşı (50), Bonkit (65, her derinlikte %0,5) ve Gölge taşı (80). Derin madende çıkarlar.
- **Yeni ekipman seviyeleri:** Kristal, Kor, Bonkit ve Gölge (kılıç, yay, kazma, kask, göğüslük, bot). Set bonusları: +20 can, yanmazlık, kritik +%10, karanlıkta görme.
- **Özel eşyalar:** Buzul Kılıcı (dondurur), Kor Kılıcı (yakar), Ayı Eldiveni, Magma Göğüslüğü, Boşluk Yayı, Bekçi Pelerini ve 3 yeni tılsım.
- **Efsanevi yumurtalar:** her bölgenin patronundan (%10) ve Zindan ödül sandıklarından düşer. Çantanda taşırsan 100 savaştan sonra çatlar ve 6 efsanevi Glemondan biri çıkar.
- Albüm artık bütün bölgeleri ve efsanevileri gösterir. Hancı Lale Sıcak Çorba ve Ateş Direnci İksiri de satıyor.
- Çok oyunculu özellikler (0.6 ve 0.7) şimdilik rafa kalktı.

## Sürüm 0.5.5 (Üs yenileme, Keşif ve Zindan)

- **Ev kalktı:** Üretim Masası, Fırın, Simya Kazanı, Yem Tezgâhı ve Depo artık dışarıda, çatılı bir zanaat avlusunda (silah askısı, zırh askısı, örs, kalkanlar). Bayılınca kamp ateşinin başında uyanırsın.
- **Hancı Lale:** Takas Tezgâhı ve tabelanın yerine han. Lale'ye dokununca arkasındaki harita açılır: Keşif, Zindan, Maden, Arsa ve Ahır'a buradan gidilir. Takas ve görevler de onda.
- **Görevler:** Lale'den aynı anda 3 görev (Glemon yen, topla, kaz, üret, evcilleştir, Zindan'da in…). Ödül: Çimen Bloğu ve beceri XP'si. Beğenmediğin görevi 15 Çimen Bloğu'na değiştirirsin.
- **Keşif:** orman, mağara ve çöl; bölge patronlarını yenerek ilerlenir (eski "zindan").
- **Zindan (yeni):** sonu olmayan iniş. Her kat daha zor, 5 katta bir ara patron ve büyüyen ödül sandığı. Rekorun profilde; 10 katta bir kısayol açılır.
- Üstte sadece Arsa ve Maden düğmeleri kaldı; gerisine yapılara dokunarak ulaşılır.
- Toprak, taş, çimen, kum ve yaprak dokuları yumuşatıldı. Arka planlara uzak dağlar ve uzak orman katmanları eklendi.
- Savaş zemini düz perspektif, karakter daha büyük ve net.

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

## 1.0 Tam Sürüm, 1. parça: Hikâye ve Son
- **Lale'nin hikâyesi:** Lale'de "Hikâye" satırı. 9 bölüm + 1 oyun sonrası bölüm; her bölümün kısa konuşması, tek hedefi ve ödülü var.
- **Son bölge Yıldız Çekirdeği (Kat 61-70):** Boşluk Bekçisi'nden sonra açılır (Saldırı 100). Yeni tür Yıldız (Gölge ve Ay'a güçlü, asaya zayıf). 4 yeni Glemon: Yıldız Tozu, Nebula Kedisi, Meteor Kaplumbağası, Takımyıldız Geyiği (nadir). Yıldız Havuzu'nda 2 yeni balık.
- **Son patron Kadim Bonk:** 3 aşamalı (%66'da Süpernova, %33'te Kara Delik). Yenince jenerik akar, "Efsane" unvanı açılır.
- **Kadim zorluk:** Kadim Bonk'tan sonra Keşif Haritası'nda açılıp kapanır. Glemonlar daha güçlü, XP ve eşya daha bol; Kadim Öz düşer. Örs'te +5 (Kadim işçiliği).

## 1.0 Tam Sürüm, 2. parça: Rehber, Ayarlar ve 99 Ödülleri
- **İlk adımlar:** yeni oyuncuya sağ üstte 7 adımlık küçük kart, her adımda küçük ödül. Eski oyuncular görmez; Ayarlar ya da Rehber'den tekrar açılır.
- **"?" düğmeleri:** çoğu panelin başlığında; o konunun kısa anlatımını açar. Alttaki **Rehber** düğmesi 12 konuluk kitabı açar.
- **Ayarlar:** ses, ekran sarsıntısı, yazı boyutu, sakin ekran, savaş başlangıcı, ilk adımlar, çıkış.
- **Kayıt ve yedek:** yedeği dosya olarak indir / dosyadan yükle (sadece aynı karakter), cihazda günlük otomatik yedek (son 3), kayıt bozulursa en yeni yedekten kendiliğinden döner. Kayıt sürümü (sv) ve sırayla çalışan geçişler.
- **99 ödülleri:** 99 pelerinleri parıldar; ilk 99'da üsse altın heykel; 99'dan sonra 120'ye kadar sanal seviye; bir beceride 120 olunca altın parlayan Usta Pelerini.

## 1.0 Tam Sürüm, 3. parça: Müzik, Telefon, Denge
- **Bölge müzikleri:** Keşif'te her bölgenin, Zindan'ın, Kule'nin ve Maden'in kendi şarkısı (src/audio.js SONGS; tarayıcıda sentezlenir, dosya yok). Savaş ve üs müzikleri Eren'in parçaları.
- **Müzik dosyaları küçüldü:** 16 MB → 4,4 MB (tek kanal, 40 kbps). Orijinaller proje klasöründe: bonkglemon-src/muzik-orijinal.
- **Telefon:** yatay telefonda yazılar büyür, düğmeler kalınlaşır, ilk adımlar kartı kısalır.
- **Denge:** kat başına Glemon güç artışı %22 → %20; oto savaş dikeni açık Glemona vurmaktan kaçınır.
