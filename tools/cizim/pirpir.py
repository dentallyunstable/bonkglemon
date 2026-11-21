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
