# Buz Kirpisi (Buz, nadir). Tarif: TARIFLER.md. Kartopu gibi yuvarlak beyaz kirpi; dikenleri yuvarlak uclu buz sacaklari, alnina perce gibi doker.
# Renk: Kar (govde), Gok (buz), Mor (golge/dip). Ametist Kirpi'den farki: bembeyaz yuvarlak govde, mavi alin perceme + sirtta kisa sacak sirasi, hic mor kristal yok.
PARLA = 'Gok'


def sacak(d, a, b, w, part='tepe', lift=0.0, **kw):
    d.capsule('Gok', a, b, w, part=part, line=True, lift=lift, **kw)


def bebek(d):
    # sirt sacaklari arkada, cok kisa
    sacak(d, (33, 31), (37.5, 25.5), (4.2, 3.2), lift=-0.15)
    sacak(d, (36, 36), (42, 33), (4.2, 3.2), lift=-0.2)
    d.ellipse('Kar', (24, 35.5), (14, 12.4), name='g', cast=1, lift=0.18)
    d.ellipse('Mor', (24, 49), (13, 4.2), clip='g', tone=2, shift=-1)
    d.circle('Kar', (13, 26.5), 3.2, part='kulak_1', line=True, lift=0.1)
    d.circle('Kar', (35, 26.5), 3.2, part='kulak_2', line=True, lift=0.1)
    # alin saçaklari: uc kisa damla
    for x, y2, w in ((18.5, 28.5, 3.4), (24, 29.8, 3.8), (29.5, 28.5, 3.4)):
        sacak(d, (x, 24.5), (x, y2), (w, 2.0), lift=0.05)
    d.set_face(24, 33, gap=5)


def genc(d):
    cx = 28
    # sirt boyunca kisa yuvarlak uclu sacaklar
    for i, (a, b) in enumerate((((34, 28), (38.5, 20)), ((38, 31), (45.5, 25)), ((41, 36), (49, 33)),
                                ((43, 42), (50.5, 41)), ((41, 48), (48, 49)))):
        sacak(d, a, b, (5.0, 3.6), lift=-0.12 - 0.02 * i)
    d.ellipse('Kar', (cx, 42.5), (15.5, 16), name='g', cast=1, lift=0.18)
    d.ellipse('Mor', (cx, 60.5), (14, 4.6), clip='g', tone=2, shift=-1)
    d.circle('Kar', (cx - 11, 29), 3.5, part='kulak_1', line=True, lift=0.1)
    d.circle('Kar', (cx + 10, 29), 3.5, part='kulak_2', line=True, lift=0.1)
    d.circle('Kar', (cx - 7.5, 55), 3, part='kol_1', line=True, lift=0.1)
    d.circle('Kar', (cx + 7.5, 55), 3, part='kol_2', line=True, lift=0.1)
    for x, y2, w in ((-6.5, 31.8, 4.2), (-2, 33, 4.2), (2.5, 33.3, 4.2), (7, 32, 4.2)):
        sacak(d, (cx + x, 26.5), (cx + x, y2), (w, 2.2), lift=0.05)
    d.set_face(cx, 36, gap=5)


def usta(d):
    cx = 32
    # arkada iki sira parlak, katmanli sacak
    for i, (a, b, w) in enumerate((((19, 36), (9, 30), 7), ((22, 28), (15, 17), 7.4), ((28, 24), (26, 11), 7.6),
                                   ((36, 24), (41, 11), 7.6), ((42, 28), (49, 17), 7.4), ((45, 36), (55, 30), 7),
                                   ((46, 45), (57, 44), 6.6), ((18, 45), (7, 44), 6.6))):
        sacak(d, a, b, (w, w - 2.8), lift=-0.2 + 0.03 * (i % 3))
    for i, (a, b, w) in enumerate((((25, 29), (21, 20), 5.4), ((32, 26), (32, 17), 5.6), ((39, 29), (43, 20), 5.4))):
        sacak(d, a, b, (w, w - 2.2), lift=0.0)
    d.ellipse('Kar', (cx, 48.5), (18.5, 17.5), name='g', cast=1, lift=0.18)
    d.ellipse('Kar', (cx, 36), (15.5, 12), name='kafa', join='g')
    d.ellipse('Mor', (cx, 69), (16, 5), clip='g', tone=2, shift=-1)
    d.circle('Kar', (cx - 13, 30), 3.8, part='kulak_1', line=True, lift=0.1)
    d.circle('Kar', (cx + 13, 30), 3.8, part='kulak_2', line=True, lift=0.1)
    d.circle('Kar', (cx - 10, 61), 3.6, part='kol_1', line=True, lift=0.1)
    d.circle('Kar', (cx + 10, 61), 3.6, part='kol_2', line=True, lift=0.1)
    # parlak, katmanli percem: arka sira Gok koyu, on sira acik
    for x, y2, w in ((-9, 34, 4.8), (-4.5, 35.5, 5.0), (0, 35, 5.0), (4.5, 33.5, 4.8), (9, 33, 4.6)):
        sacak(d, (cx + x, 27), (cx + x, y2), (w, 2.4), lift=0.08)
    # sol goze yari inen uzun perce
    sacak(d, (cx - 7.5, 27), (cx - 7.5, 37.5), (4.6, 2.2), lift=0.12)
    d.pix((cx - 9, 29), ['oo'], {'o': 'Parilti'}, part='tepe')
    # burun ucunda buz damlasi
    d.circle('Gok', (cx, 45.2), 1.5, part='esya', line=True, lift=0.15)
    d.set_face(cx, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
