# Pirpir (Tas, siradan, ucar). Tarif: TARIFLER.md. Kulaklari govdesinden buyuk, pofuduk mor yarasa yavrusu.
# Renk: Mor (tuy), Tas (kanat), Pembe (kulak ici); kupe ve yaka Kar. Parlak: Mor -> Krem.
PARLA = 'Pembe'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kulak(d, pts, inner, name, part):
    """Yarasa kulagi: tabani genis, ucu yuvarlak. pts sol kulak noktalari; inner pembe ic."""
    d.poly('Mor', pts, part=part, name=name, line=True, lift=0.03)
    d.poly('Pembe', inner, clip=name, tone=2)


def kulaklar(d, cx, L, I):
    kulak(d, L, I, 'e1', 'kulak_1')
    kulak(d, mir(L, cx), mir(I, cx), 'e2', 'kulak_2')


def govde(d, c, r, tufts):
    d.ellipse('Mor', c, r, name='g', lift=0.04, cast=1)
    for x, y, rr in tufts:
        d.circle('Mor', (x, y), rr, join='g')


def bebek(d):
    d.flyer = True
    cx = 24
    # minicik kanatlar (yukari halde, govdeye degiyor)
    W = [(13, 33), (8, 27), (5, 28), (5, 33), (8, 36), (12, 38)]
    d.poly('Tas', W, part='kanat_1', line=True, name='w1')
    d.poly('Tas', mir(W, cx), part='kanat_2', line=True, name='w2')
    L = [(11, 27), (7, 17), (9, 12), (13, 13), (21, 20), (21, 27)]
    I = [(12, 25), (10, 17), (12, 15), (18, 21), (18, 25)]
    kulaklar(d, cx, L, I)
    govde(d, (24, 34), (13, 11), [(13, 39, 3), (35, 39, 3), (24, 44, 3.2), (18, 43, 3), (30, 43, 3), (24, 23, 3)])
    d.set_face(24, 32, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    L = [(12, 24), (8, 13), (10, 8), (15, 9), (24, 18), (24, 24)]
    I = [(13, 22), (11, 13), (13, 11), (20, 18), (20, 22)]
    kulaklar(d, cx, L, I)
    govde(d, (28, 33), (15, 12.5), [(14, 38, 3.2), (42, 38, 3.2), (28, 45.5, 3.4), (20, 44, 3.2), (36, 44, 3.2), (28, 21, 3)])
    # kanatlar atki gibi boynuna sarili: iki yandan gelip onde bulusur
    d.capsule('Tas', (12, 37), (22, 43), 5.4, part='kanat_1', line=True, name='w1')
    d.capsule('Tas', (44, 37), (34, 43), 5.4, part='kanat_2', line=True, name='w2')
    d.capsule('Tas', (22, 43), (34, 43), 5.2, part='kanat_1', name='wc', line=True)
    d.capsule('Tas', (32, 44), (34, 50), (3.8, 3.0), part='kanat_2', line=True)
    # kanat parmak izleri
    d.capsule('Tas', (13, 36), (21, 42), 1.0, clip='w1', shift=1)
    d.capsule('Tas', (43, 36), (35, 42), 1.0, clip='w2', shift=1)
    d.set_face(28, 30, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    # kadife pelerin gibi kanatlar: omuzdan yukari acik, alt kenari dalgali
    W = [(19, 34), (10, 22), (4, 14), (3, 26), (2, 38), (6, 44), (9, 40), (13, 48), (17, 43), (21, 48)]
    d.poly('Tas', W, part='kanat_1', line=True, lift=-0.06, name='w1')
    d.poly('Tas', mir(W, cx), part='kanat_2', line=True, lift=-0.06, name='w2')
    d.capsule('Tas', (19, 36), (5, 18), 1.2, clip='w1', shift=1)
    d.capsule('Tas', (19, 38), (4, 34), 1.2, clip='w1', shift=1)
    d.capsule('Tas', (19, 40), (9, 46), 1.2, clip='w1', shift=1)
    d.capsule('Tas', (45, 36), (59, 18), 1.2, clip='w2', shift=1)
    d.capsule('Tas', (45, 38), (60, 34), 1.2, clip='w2', shift=1)
    d.capsule('Tas', (45, 40), (55, 46), 1.2, clip='w2', shift=1)
    L = [(15, 27), (11, 14), (13, 8), (19, 9), (28, 20), (28, 27)]
    I = [(16, 25), (14, 14), (16, 12), (24, 20), (24, 25)]
    kulaklar(d, cx, L, I)
    govde(d, (32, 38.5), (17, 17.5), [(16, 45, 3.4), (48, 45, 3.4), (32, 55, 3.6), (22, 53, 3.4), (42, 53, 3.4), (32, 22, 3.2)])
    # acik tuy yaka
    d.ellipse('Kar', (32, 50), (9, 3.4), name='yaka', line=True)
    for x in (24.5, 28.5, 32, 36, 39.5):
        d.circle('Kar', (x, 51.7), 2.0, join='yaka')
    # kulakta kristal kupe
    d.poly('Kar', [(16, 22), (13.5, 25.5), (16, 30), (18.5, 25.5)], part='kulak_1', line=True, name='kupe')
    d.set_face(32, 34, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (sola bakar)
def kulak_y(d, x, y, w, h, back, part, name, ic, lift=0.03):
    """Yan kulak: taban ortasi (x,y), ucu arkaya (saga) yatik."""
    L = [(x - w * .5, y), (x - w * .4 + back * .3, y - h * .6), (x + back * .7, y - h), (x + w * .3 + back, y - h * .85),
         (x + w * .55 + back * .3, y - h * .3), (x + w * .5, y)]
    I = [(x - w * .2, y - 1), (x - w * .15 + back * .4, y - h * .55), (x + back * .8, y - h * .8), (x + w * .25 + back * .5, y - h * .45), (x + w * .25, y - 1)]
    d.poly('Mor', L, part=part, name=name, line=True, lift=lift)
    d.poly('Pembe', I, part=part, clip=name, tone=ic)


def bebek_yan(d):
    d.flyer = True
    W = [(32, 35), (40, 27), (44, 27), (45, 32), (42, 37), (36, 40)]
    d.poly('Tas', W, part='kanat_2', line=True, name='w2', lift=-0.08)
    kulak_y(d, 34, 28, 11, 16, 5, 'kulak_2', 'e2', 2, lift=-0.08)
    d.ellipse('Mor', (27, 34), (14.5, 11), name='g', lift=0.04, cast=1)
    for x, y, r in ((17, 40, 3), (38, 39, 3), (27, 44, 3.2), (21, 43.5, 3), (31, 43.5, 3), (27, 23, 3)):
        d.circle('Mor', (x, y), r, join='g')
    d.ellipse('Mor', (14.5, 36), (4, 3.2), join='g')
    d.pix2((6, 17), ['#'], {'#': 'Komur-4'})
    kulak_y(d, 22, 28, 12, 17, 4, 'kulak_1', 'e1', 1)
    d.poly('Tas', [(27, 33), (31, 28), (34, 29), (34, 34), (31, 38), (27, 38)], part='kanat_1', line=True, name='w1')
    d.set_face_side(16, 32)


def genc_yan(d):
    d.flyer = True
    d.poly('Tas', [(36, 36), (45, 28), (49, 28), (50, 34), (46, 40), (40, 43)], part='kanat_2', line=True, name='w2', lift=-0.08)
    kulak_y(d, 40, 26, 12, 19, 6, 'kulak_2', 'e2', 2, lift=-0.08)
    d.ellipse('Mor', (31, 33), (16.5, 12.5), name='g', lift=0.04, cast=1)
    for x, y, r in ((20, 39, 3.2), (44, 39, 3.2), (30, 45.5, 3.4), (24, 44, 3.2), (36, 44, 3.2), (31, 21, 3)):
        d.circle('Mor', (x, y), r, join='g')
    d.ellipse('Mor', (16, 36), (4.4, 3.4), join='g')
    d.pix2((7, 18), ['#'], {'#': 'Komur-4'})
    d.ellipse('Mor', (34, 49), (2.6, 2.2), part='kol_2', line=True, lift=-0.1)
    kulak_y(d, 26, 26, 13, 20, 5, 'kulak_1', 'e1', 1)
    # kanat atki gibi boyunda
    d.capsule('Tas', (21, 43), (36, 43), 5.2, part='kanat_1', line=True, name='wc')
    d.capsule('Tas', (36, 42), (42, 49), (4.6, 3.4), part='kanat_1', line=True, name='wt')
    d.capsule('Tas', (24, 41.5), (34, 41.5), 1.0, clip='wc', shift=1)
    d.ellipse('Mor', (24, 49), (2.8, 2.4), part='kol_1', line=True)
    d.set_face_side(19, 31)


def usta_yan(d):
    d.flyer = True
    W = [(44, 36), (50, 26), (56, 16), (61, 20), (62, 32), (62, 42), (58, 50), (56, 45), (52, 52), (48, 46)]
    d.poly('Tas', W, part='kanat_2', line=True, lift=-0.12, name='w2')
    d.capsule('Tas', (48, 38), (60, 22), 1.2, clip='w2', shift=1)
    d.capsule('Tas', (48, 42), (61, 38), 1.2, clip='w2', shift=1)
    kulak_y(d, 47, 28, 13, 22, 6, 'kulak_2', 'e2', 2, lift=-0.08)
    d.ellipse('Mor', (35, 38), (19, 17.5), name='g', lift=0.04, cast=1)
    for x, y, r in ((22, 45, 3.4), (51, 44, 3.4), (35, 55, 3.6), (28, 53, 3.4), (42, 53, 3.4), (36, 21, 3.2)):
        d.circle('Mor', (x, y), r, join='g')
    d.ellipse('Mor', (16.5, 41), (5.2, 4), join='g')
    d.pix2((8, 20), ['#'], {'#': 'Komur-4'})
    d.ellipse('Kar', (26, 50), (6, 3.4), name='yaka', line=True)
    for x in (22, 25.5, 29.5):
        d.circle('Kar', (x, 51.5), 2.0, join='yaka')
    kulak_y(d, 29, 27, 14, 23, 5, 'kulak_1', 'e1', 1)
    d.poly('Kar', [(25, 20), (22.5, 23.5), (25, 27.5), (27.5, 23.5)], part='kulak_1', line=True, name='kupe')
    # yakin kanat: omuzdan arkaya dusen kadife pelerin
    W1 = [(33, 34), (40, 31), (46, 36), (47, 46), (44, 54), (41, 50), (38, 56), (34, 50)]
    d.poly('Tas', W1, part='kanat_1', line=True, lift=-0.04, name='w1')
    d.capsule('Tas', (37, 38), (43, 50), 1.0, clip='w1', shift=1)
    d.set_face_side(20, 36)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
