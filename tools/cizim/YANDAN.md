# Yandan görünüm çizimi (1.0.28)

Eren'in kararı: Glemonlar 2D dünyada **yürürken yandan**, dururken ve savaşta 3/4 (önden) görünür. Her tür, her aşama için
(bebek, genç, usta) bir yandan çizim ister. Patronlara yandan çizim YOK. Eren pilotu onayladı: `kum_tilkisi.py`,
`patlakmantar.py`, `fokcuk.py` (şekillerle) ve `kutukcuk.py` (elle iri piksel `pix2`) dosyalarının sonundaki
`*_yan` fonksiyonları ÖRNEKTİR. Önce bu dördünü oku.

## Kurallar
- Fonksiyon adları `bebek_yan`, `genc_yan`, `usta_yan`. Dosyanın SONUNA ekle, sonra:
  `STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})`
- Önden çizim fonksiyonlarına (bebek/genc/usta) DOKUNMA.
- Glemon **SOLA bakar** (yüzü, burnu, gagası solda; kuyruğu, sırt eşyası sağda). Oyun sağa giderken aynalar.
- Koordinatlar önden çizimle aynı: tam boy tuval (bebek 48, genç 56, usta 64). Araç 2x2 bloğa indirir (iri piksel):
  1-2 piksellik ayrıntı kaybolur, şekiller en az 3-4 piksel kalın olsun.
- Aynı renk aileleri, aynı tonlar, aynı imza ayrıntılar (şapka, atkı, kristal, desen, benek, taşıdığı eşya) yandan da
  görünsün. Aynı yaratık olduğu bir bakışta anlaşılmalı. Boyut ve gövde boyu önden çizime yakın olsun.
- Yüz: `d.set_face_side(ex, ey)` = TEK gözün sol-üst köşesi (tam boy koordinat; çift sayı ver). Göz 2x3 iri piksel
  (usta da), arkasına (sağına) 2 piksel yanak basılır. Göz gövdenin ön (sol) kısmında, önden çizimdeki göz yüksekliğinde.
  Ağız yok. Burun/gaga istersen şekille ekle (ör. `d.pix2((x, y), ['#'], {'#': 'Komur-4'})`, x,y YARIM koordinat).
  `goz='Cam-1'` gibi göz rengi ve `yanak=False` önden çizimde ne ise aynısı.
- Parçalar (animasyon için ÖNEMLİ):
  - `kol_1` = ÖN ayak, `kol_2` = ARKA ayak. Yürürken sırayla ileri-geri adım atarlar. Ayağı olan her tür için
    gövdenin altında iki küçük ayak çiz (arka ayak gövdeden önce çizilir, biraz görünsün). Ayaksız (top, mantar, hayalet,
    balık) türlerde kol yok, ya da kolları varsa yan görünümde tek kolu (yakın olanı) `kol_1` yap.
  - `kulak_1` yakın kulak (önde), `kulak_2` uzak kulak (arkada, biraz sağda ve bir ton koyu `tone=2`/gölgeli).
  - `kanat_1` yakın kanat, `kanat_2` uzak kanat (uçanlar çırpar). `kuyruk`, `tepe` (baştaki süs), `esya` aynı anlamda.
- Uçan türlerde fonksiyonun başına `d.flyer = True` (önden çizimde olduğu gibi).
- Kabuklu türlerde (`kafa` parçası olanlar) yan çizimde `kafa` parçası KULLANMA (yandan savunma yok), kafa = gövde.

## Çalıştırma ve kontrol
```
python3 tools/glemon_draw.py <anahtar> bebek_yan genc_yan usta_yan
python3 tools/glemon_yan_onizle.py <anahtar>
```
`onizleme/<anahtar>_yan.png` dosyasını Read ile AÇ ve gözünle bak (her aşama: solda önden, sağda yandan; altta oyundaki boy).
DENETIM satırındaki `tuvale sigmiyor` uyarısı olmamalı (şekli küçült/kaydır). `govde boyu/genisligi` uyarısı 1-2 piksel
ise sorun değil. En az 3 tur bak-düzelt yap. Kontrol listesi:
1. Sola mı bakıyor? Göz ön tarafta mı, gövdenin içinde mi (kenara yapışık değil)?
2. Önden çizimle aynı yaratık mı (renk, imza ayrıntılar, oranlar)?
3. İki ayak (kol_1, kol_2) altta ve görünüyor mu? Uzak kulak/kanat/ayak arkada mı?
4. İri pikselde dağınık, tek pikselli kırıntı var mı? Varsa şekli sadeleştir.

YAPMA: `gen_glemons2.py` çalıştırma, git kullanma, başka türlerin dosyalarına, `glemon_draw.py`'ye, `glemons.json`'a dokunma.
