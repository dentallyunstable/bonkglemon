# Gol Ejderi (Su, epik). Tarif: TARIFLER.md. Kanatsiz, yuzgec kulakli tombul turkuaz su ejderi; alninda inci/mucevher tasir.
# Renk: Cam (turkuaz govde), Gok (karin), Pembe (yuzgec, mercan boynuz); mucevher Kar inci. Yakut Ejder'den farki: kanatsiz, boynuzsuz bebek/genc, yuzgecli, mavi-yesil.
PARLA = 'Kar'


PAL = {'A': 'Kar-3', 'p': 'Parilti', 'w': 'Kar-1', 's': 'Kar-2'}


def inci(d, x, y, r, part='govde', ad=None):
    """5x5 inci (r>=2.5) ya da 4x4 kucuk inci; (x, y) merkez."""
    if r >= 2.5:
        d.pix((round(x) - 2, round(y) - 2), ['.AAA.', 'ApwsA', 'AwwsA', 'AwssA', '.AAA.'], PAL, part=part)
    else:
        d.pix((round(x) - 2, round(y) - 2), ['.AA.', 'ApwA', 'AwsA', '.AA.'], PAL, part=part)


def yuzgec_kulak(d, x, y, yon, s=1.0, part='kulak_1'):
    # yelpaze yuzgec: kok kafada, uca dogru acilir, pembe
    ad = 'yk' + part
    d.ellipse('Pembe', (x + yon * 3.5 * s, y - 4 * s), (5.2 * s, 3.2 * s), rot=yon * -55, part=part, name=ad, line=True, cast=0)
    d.ellipse('Pembe', (x + yon * 3.5 * s, y - 3 * s), (2.6 * s, 1.4 * s), rot=yon * -55, clip=ad, shift=-1, part=part)
    d.capsule('Pembe', (x + yon * 2 * s, y - 1 * s), (x + yon * 7 * s, y - 7 * s), 0.9, clip=ad, shift=1, part=part)


def bebek(d):
    # kisa kuyruk (sag arkada), ucu pembe
    d.capsule('Cam', (33, 41), (42, 37), (6, 3.2), part='kuyruk', name='kuyruk', line=True)
    d.ellipse('Pembe', (43.5, 35.5), (3.4, 2.6), rot=-30, part='kuyruk', line=True)
    # yuvarlak gövde + kafa
    d.ellipse('Cam', (24, 36), (13, 11.5), name='kafa', cast=1, lift=0.05)
    yuzgec_kulak(d, 14, 29, -1, 1.0, 'kulak_1')
    yuzgec_kulak(d, 34, 29, 1, 1.0, 'kulak_2')
    d.ellipse('Gok', (24, 42.5), (7.5, 5), name='karin', lift=0.1, part='govde')
    d.ellipse('Cam', (16.5, 47), (4, 2.6), part='kol_1', line=True)
    d.ellipse('Cam', (31.5, 47), (4, 2.6), part='kol_2', line=True)
    inci(d, 24, 26, 2.8, part='tepe')
    d.set_face(24, 32, gap=5)


def genc(d):
    # ust: sirt yuzgeci dalgali (pembe), basin ustunden arkaya
    for i, (x, y, r) in enumerate(((23, 25, 3.2), (28, 22.5, 3.4), (33, 23, 3.4), (38, 27, 3.4), (41, 33, 3.2))):
        d.circle('Pembe', (x, y), r, part='tepe', line=True, name='sf%d' % i)
    # kuyruk: genis yelpaze uc
    d.capsule('Cam', (36, 48), (46, 44), (7, 4), part='kuyruk', name='kuyruk', line=True)
    d.ellipse('Pembe', (49, 41), (5.4, 5.8), rot=-25, part='kuyruk', name='kf', line=True)
    for a, b in (((46, 44), (51, 38)), ((46, 44), (53, 42)), ((46, 44), (50, 46))):
        d.capsule('Pembe', a, b, 0.9, clip='kf', shift=1, part='kuyruk')
    d.ellipse('Cam', (28, 40), (14.5, 13.5), name='kafa', cast=1, lift=0.05)
    yuzgec_kulak(d, 15, 36, -1, 1.1, 'kulak_1')
    yuzgec_kulak(d, 41, 36, 1, 1.1, 'kulak_2')
    d.ellipse('Gok', (28, 47.5), (9, 6.5), name='karin', lift=0.1, part='govde')
    d.ellipse('Cam', (14, 46), (3.6, 4.4), rot=15, part='kol_1', line=True)
    d.ellipse('Cam', (42, 46), (3.6, 4.4), rot=-15, part='kol_2', line=True)
    d.ellipse('Cam', (21, 54), (4.6, 2.8), part='kol_1', line=True)
    d.ellipse('Cam', (35, 54), (4.6, 2.8), part='kol_2', line=True)
    inci(d, 28, 30, 2.8, part='tepe')
    d.set_face(28, 36, gap=5)


def usta(d):
    # buyuk dalgali kuyruk yuzgeci (sag arkada)
    d.capsule('Cam', (42, 58), (52, 53), (9, 5), part='kuyruk', name='kuyruk', line=True)
    d.ellipse('Pembe', (55, 49), (7.5, 8.5), rot=-20, part='kuyruk', name='kf', line=True)
    d.circle('Pembe', (51, 43), 3.4, part='kuyruk', join='kf')
    d.circle('Pembe', (58, 55), 3.2, part='kuyruk', join='kf')
    for a, b in (((52, 53), (53, 42)), ((52, 53), (58, 46)), ((52, 53), (60, 53)), ((52, 53), (57, 58))):
        d.capsule('Pembe', a, b, 1.0, clip='kf', shift=1, part='kuyruk')
    # sirt yuzgeci
    for i, (x, y, r) in enumerate(((37, 22, 3.4), (42, 25, 3.6), (46, 31, 3.6), (48, 38, 3.4))):
        d.circle('Pembe', (x, y), r, part='tepe', line=True)
    d.ellipse('Cam', (32, 47), (17.5, 15.5), name='kafa', cast=1, lift=0.05)
    d.ellipse('Cam', (32, 35), (13.5, 11.5), join='kafa')
    yuzgec_kulak(d, 16, 38, -1, 1.2, 'kulak_1')
    yuzgec_kulak(d, 48, 38, 1, 1.2, 'kulak_2')
    d.ellipse('Gok', (32, 60), (11.5, 7.5), clip='kafa', tone=1)
    d.ellipse('Gok', (35, 63), (8, 3), clip='kafa', tone=2)
    d.ellipse('Cam', (14.5, 52), (4, 5), rot=15, part='kol_1', line=True)
    d.ellipse('Cam', (49.5, 52), (4, 5), rot=-15, part='kol_2', line=True)
    d.ellipse('Cam', (22, 61), (5, 3), part='kol_1', line=True)
    d.ellipse('Cam', (42, 61), (5, 3), part='kol_2', line=True)
    # iki kisa mercan boynuz
    d.capsule('Pembe', (27, 30), (24, 22), (6.5, 4.6), part='tepe', name='b1', line=True)
    d.capsule('Pembe', (37, 30), (40, 22), (6.5, 4.6), part='tepe', name='b2', line=True)
    d.capsule('Pembe', (26.5, 28), (24.5, 24), 1.0, clip='b1', shift=1, part='tepe')
    d.capsule('Pembe', (37.5, 28), (39.5, 24), 1.0, clip='b2', shift=1, part='tepe')
    # inci dizisi boyunda
    for i, (x, y) in enumerate(((19, 50), (22, 53), (26, 55), (32, 56), (38, 55), (42, 53), (45, 50))):
        inci(d, x, y, 2.0, part='esya')
    d.set_face(32, 41, gap=6)
    inci(d, 32, 32, 3.2, part='tepe')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
