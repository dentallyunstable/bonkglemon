# Glemon kodla çizim kılavuzu

Bu klasördeki her `<anahtar>.py` dosyası bir Glemon türünü kodla çizer. Çizim aracı `tools/glemon_draw.py`.
Onaylı stil örneği: Kütükçük (Eren "MÜKEMMEL" dedi). Kodla çizilmiş iki deneme: `patlakmantar.py`, `tirtilcik.py`.
Hepsi tek resimde: `tools/cizim/referans.png` (üstten alta Kütükçük, Patlakmantar, Tırtılcık; soldan sağa Bebek, Genç, Usta).

Kurallar: `STIL_KITABI.md` (plan bölüm 3-5). Her türün tarifi: `TARIFLER.md` (Fikir, Bebek/Genç/Usta, Renk, Hareket, İngilizce Komut).
Tarife sadık kal: tarifte yazan her ayrıntı (eşya, desen, uzuv, renk) çizimde olsun. Eski çizimi kopyalama.

## Çalıştırma

```
cd /home/user/w/bonkglemon
python3 tools/glemon_draw.py <anahtar>          # üç aşama
python3 tools/glemon_draw.py <anahtar> genc     # tek aşama
```
Çıktı satırı: renk sayısı, gövde genişliği, boy, parçalar ve `DENETIM` (kural dışı her şey). `ok` görene kadar düzelt.
Önizleme: `onizleme/<anahtar>_cizim.png` (üstte 6 kat büyük, altta oyundaki gerçek boy 1x ve 2x, en sağda ESKİ çizim).
Önizlemeyi Read aracıyla MUTLAKA aç ve gözünle bak. En az 3 tur bak-düzelt yap.
`gen_glemons2.py` ÇALIŞTIRMA, `glemons.json` ve başka türlerin dosyalarına dokunma (ana oturum yapar).

## Dosya biçimi

```python
# <Ad> (<bölge>, <nadirlik>). Tarif: TARIFLER.md. Kısa fikir cümlesi.
PARLA = 'Sari'        # özel hamlede parlayan aile (türün ışıklı/vurgu ailesi)

def bebek(d):
    d.ellipse('Cimen', (24, 35), (11, 9.6), name='kafa', cast=1)
    ...
    d.set_face(24, 31, gap=5)

def genc(d): ...
def usta(d): ...

STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
```
Uçan türlerde her fonksiyonun başına `d.flyer = True` yaz (araç gövdeyi 8 piksel havaya kaldırır).

## Tuval ve ölçüler (araç otomatik yerleştirir)

| Aşama | Tuval | Gövde boyu (çizgi dahil) | En geniş | Göz kalıbı | Göz boşluğu (gap) |
|---|---|---|---|---|---|
| bebek | 48x48 | 26-30 | 30 | K (4x5) | 4-6 (öneri 5) |
| genc | 56x56 | 32-38 | 38 | K (4x5) | 4-6 (öneri 5) |
| usta | 64x64 | 42-48 | 48 | O (5x6) | 5-7 (öneri 6) |

Koordinatlar tuval pikselidir, (0,0) sol üst; kesirli sayı olabilir. Çizimi kabaca tuvalin ortasına çiz; araç gövdeyi
yatayda ortalar ve ayakları tabandan 4. satıra oturtur (yüz de aynı kayar). Tuvalin biraz dışına taşan çizim kaybolmaz
(araç geniş bir alanda çizer, sonra yerleştirir); yerleştirdikten sonra hâlâ sığmıyorsa "UYARI" yazar.
"Gövde boyu" = en alttaki pikselden (ayak dahil), tepe/kulak/kanat/kuyruk/eşya OLMAYAN en üst piksele kadar, +3 (çizgiler).
Kol ve gövde parçaları sayılır. Silüeti belirleyen büyük şapka/miğfer `govde` kalabilir.
"En geniş" = `govde` parçasının genişliği +2.
Kafa / boy oranı: Bebek %55-60, Genç %48-52, Usta %40-45. Bebek neredeyse sadece kafadır.

## Şekiller

Hepsi `d.<şekil>(aile, ..., seçenekler)`; sonra eklenen öndedir.
- `ellipse(f, (cx, cy), (rx, ry), rot=derece)` · `circle(f, (cx, cy), r)`
- `rect(f, (x0, y0, x1, y1), rad=köşe)` · `poly(f, [(x, y), ...])`
- `capsule(f, (x1, y1), (x2, y2), w)` ya da `w=(baş, son)` (uzuv, kuyruk, boynuz, anten)
- `curve(f, [(x, y), ...], w)` (kıvrık kuyruk, saç, anten)
- `pix((x, y), ['#.#', ...], {'#': 'Kahve-4', 'o': 'Parilti'}, part=...)` elle piksel (gölgesiz). Çok küçük ayrıntı için.

Aileler (4 ton, 1 açık → 4 derin): Krem, Kahve, Kirmizi, Turuncu, Sari, Cimen, Cam, Gok, Lacivert, Mor, Pembe, Tas, Kar, Komur.
Ayrıca `Parilti` (#fff6e8, ışık) ve `Murekkep` (göz/çizgi koyusu).

Seçenekler:
- `name='kafa'`: sonradan başvurmak için ad.
- `part='...'`: kukla parçası (aşağıda). Varsayılan `govde`.
- `join='ad'`: şekli o adlı şekle KATAR (tek parça gibi gölgelenir, iç çizgi olmaz). Dalgalı kenar, tümsek için.
- `sub='ad'`: şekli o adlı şekilden OYAR (ısırık izi, çentik).
- `clip='ad'` + `shift=-1/+1` ya da `tone=n`: DESEN. Yalnız o şeklin üstüne boyar; alttaki tonu `shift` kadar
  açar (-1) ya da koyulaştırır (+1). Benek, çizgi, halka, doku için. Desen ailesi farklı olabilir (krem benek).
- `inbox=(x0, y0, x1, y1)`: şekli bu kutuyla kırpar (yarım daire, düz alt kenar).
- `lift=0.1` / `-0.12`: şekli biraz açık / koyu ışıklandırır (arkadaki parçaları koyulaştır, öndekini aç).
- `cast=1..2`: şeklin altındaki 1-2 satıra gölge düşer (şapka, kafa, yele altı).
- `line=True`: önündeki şekil başka aileden olsa da arkasıyla arasına 3. ton iç çizgi çeker (kol, eşya).
  Aynı aileden iki şekil arasında iç çizgi zaten otomatik.
- `noshadow=True`: bu şekil arkasına temas gölgesi düşürmez.
- `shade='flat', tone=2`: gölgesiz düz ton (nadiren).

## Kukla parçaları (animasyon bunlarla yapılır)

- `govde` (varsayılan): kafa + gövde tek kütle. Yüz burada.
- `tepe`: kafanın üstündeki her şey (filiz, anten, ibik, saç, boynuz, küçük şapka). Kafayı 1 kare gecikmeyle izler, sallanır.
- `kulak_1` (sol), `kulak_2` (sağ): kulaklar; huy H1'de seğirir, yürürken sallanır.
- `kol_1` (sol, öndeki), `kol_2` (sağ): kol/pati/yüzgeç; pençe saldırısı (A3) `kol_1`'i savurur.
- `kuyruk`: H6 ve A5 bunu sallar.
- `esya`: taşınan şey (yaprak, fener, atkının ucu, püskül).
- `kanat_1`, `kanat_2`: UÇANLAR İÇİN. Kanatlar "yukarı" (açık, kalkık) halde çizilir; kod orta ve aşağı halleri üretir.
  Kanat gövdeye değmeli (kök orası). Kanatsız uçanlar (Fısıltı, Fener Hayaleti, Yıldız Tozu, Yıldız Balinası) kanat çizmez.
- `kafa`: YALNIZ kabuklu türlerde (kaplumbağa, istiridye vb.): kabuktan çıkan kafa. Savunmada kafa ve kollar gizlenir,
  o yüzden yüz bu parçanın üstünde olmalı ve kabuk `govde` olmalı.
Bir parça mutlaka gövdeye değmeli (yoksa animasyonda kopuk durur). Aşağı sarkan şeyler (etek, sakal) `govde`'de kalsın.

## Yüz

`d.set_face(cx, ey, gap=5)`: `cx` iki gözün ortası, `ey` gözlerin ÜST satırı. Göz, yanak, ağız kodla basılır, sen çizme.
- K gözü 4 geniş 5 yüksek; O gözü 5x6. Yanaklar gözlerin altında, ağız iki gözün ortasında gözlerin hemen altında.
- Yüz kafanın alt-orta kısmında olsun (gözler kafa yüksekliğinin ~%50-60'ında), iri gözlü, tatlı.
- Yüz alanı (gözler + 1 piksel çevre + yanak + ağız) TEK renkli düz bir yüzeyde olsun: üstünde desen, eşya, kol olmasın.
  Çünkü oyunda diğer ifadeler bu alanın üstüne bir karo olarak konur.
- Ağzı olmayan türler (gaga, hortum vb. kendi çizimindeyse): `d.set_face(..., mouth=False)` ve gagayı yüz alanının DIŞINA çiz.
- Ten (yanak/ağız rengi) en çok kullanılan aileden otomatik seçilir; gerekirse `ten='Krem'` ver.
- Parlayan gözler (ör. hayalet, mumya, Boşluk Bekçisi): `goz='Cam-1'` göz rengini değiştirir (parıltı yine sol üstte).
  Yanak istemeyen türler: `yanak=False`. Kirpik çizilmez.

## Sık hatalar

- `pix` anahtarında aile adı değil ton adı yaz: `'Kar-1'`, `'Kahve-4'`, `'Parilti'`.
- `join='ad'` yalnız `name='ad'` verilmiş bir şekle katılır; `join` ile eklenen şekle ad verilmez, ana şeklin adını kullan.
- Araç `govde` parçasını yatayda ortalar ve en alttaki pikseli yere oturtur: gövdenin altına sarkan uç (kuyruk, sargı)
  yerleşimi değiştirir. Büyük kuyruk/kanat da tuvale sığmalı (UYARI'ya bak).

## Stil (Kütükçük gibi olsun)

- Tek yuvarlak kütle (fasulye). Boyun yok, uzuvlar kısa ve tombul (2-5 piksel). Sivri uç yok, en ince yer 2 piksel.
- Önden, hafif sola dönük duruş. Profil yasak. Uzun gövdeliler kafanın arkasında toplanır/kıvrılır.
- Işık sol üstten: araç tonları kendisi koyar. Sen şekil, katman sırası, desen ver.
- Doku: 2-4 piksellik benek/çizgi/halka, yüzeyin en çok %20'si (`clip` + `shift`). Kütükçük'teki kabuk çizgileri gibi.
- En çok 3 renk ailesi + Krem/Kar (Pembe yanak sayılmaz). Renk sınırı 16 (araç fazlasını birleştirir, notu DENETIM'de görürsün).
- Evrim: Bebek = neredeyse sadece kafa, ayırt edici özellik küçük ipucu, eşya yok. Genç = kol/bacak belirir, özellik iki katı,
  en çok 1 eşya. Usta = ayırt edici özellik silüetin en büyük parçası, en çok 2 eşya, hâlâ tatlı. Taç yok.
- Nadirlik: nadir → 3. aile vurgu + parlayan parçada 1-2 piksel Parilti (`d.pix(..., {'o': 'Parilti'})`, tek piksel olmasın: 2 piksel yan yana).
  epik → bir mücevher/çiçek/ışık kaynağı taşır. efsanevi → Sari'den altın süs (tasma, halka; taç değil). Hale/parıltı ÇİZME.
- Parlak (shiny) renk ayrı çizilmez; kod aileyi değiştirir. Parlak sürümde değişecek aileyi tarif söyler.
- Çizimde yazı/rakam yok (savaşta aynalanır).

## Kontrol listesi (her tür için)

1. Tarifi oku (Fikir + 3 aşama + Renk + Komut satırları). Bölüm 7.2'deki benzer tür ayrımına bak.
2. Üç aşamayı yaz, çalıştır, önizlemeyi aç.
3. Soru sor: Tarifteki her ayrıntı var mı? Bebek-Genç-Usta aynı tür olduğu belli mi (aynı renk, aynı göz, aynı ayırt edici özellik)?
   Silüet her aşamada değişiyor mu? Oyundaki 1x boyda okunuyor mu? Yüz temiz mi? Kütükçük'ün yanında aynı oyundan gibi mi?
4. `DENETIM` satırı `ok` (renk birleştirme notu kabul).
5. Bitince: türün dosyasının başına 1-2 satır açıklama, varsa kararların (ör. "yaprak Cam ailesinde, gövdeden ayrılsın").
