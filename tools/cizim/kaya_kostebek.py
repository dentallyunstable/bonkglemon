# Kaya Kostebegi (Tas, siradan). Tarif: TARIFLER.md. Pembe yildiz burunlu, calisgan madenci kostebek.
# Renk: Kahve (govde), Tas (kask, caki, kazma), Pembe (burun, pencere). Parlak: Kahve -> Lacivert.
PARLA = 'Pembe'


def yildiz(d, cx, ey):
    """Gozlerin arasinda pembe yildiz burun."""
    d.pix((cx - 2, ey + 1), ['.#.', '###', '.#.'], {'#': 'Pembe-2'}, part='govde')


def pence(d, x, y, side):
    """Iri pembe kazma pencesi: yuvarlak avuc + 3 tombul parmak ucu."""
    pass


def bebek(d):
    d.ellipse('Kahve', (24, 35), (14, 12.4), name='kafa', cast=1)
    d.circle('Kahve', (15, 24.5), 3.0, part='kulak_1', line=True)
    d.circle('Kahve', (33, 24.5), 3.0, part='kulak_2', line=True)
    # basta sapka gibi cakil
    d.ellipse('Tas', (24, 21.5), (6.2, 4.4), part='tepe', name='cakil', line=True, cast=1)
    d.circle('Tas', (20, 20), 1.6, part='tepe', clip='cakil', shift=-1)
    d.capsule('Tas', (25, 22.5), (28, 23.5), 1.3, part='tepe', clip='cakil', shift=1)
    # iri pembe pencler
    d.ellipse('Pembe', (14.5, 44.5), (4.4, 3.4), part='kol_1', line=True, rot=-20)
    d.ellipse('Pembe', (33.5, 44.5), (4.4, 3.4), part='kol_2', line=True, rot=20)
    d.pix((11, 46), ['#.#'], {'#': 'Pembe-4'}, part='kol_1')
    d.pix((33, 46), ['#.#'], {'#': 'Pembe-4'}, part='kol_2')
    yildiz(d, 24, 33)
    d.set_face(24, 33, gap=5)


def kask(d, cx, cy, rx, ry, base):
    """Tas kask: kubbe + alt siperlik kenari (gozlerin ustunde biter)."""
    d.ellipse('Tas', (cx, cy), (rx, ry), inbox=(0, 0, 63, base), part='govde', name='kask', line=True, cast=1, lift=0.05)
    d.ellipse('Tas', (cx, base), (rx + 0.8, 1.7), part='govde', join='kask')
    d.capsule('Tas', (cx - rx + 3, base - 4), (cx + rx - 3, base - 4), 1.2, part='govde', clip='kask', shift=1)


def genc(d):
    d.ellipse('Kahve', (28, 40), (15, 13), name='kafa', cast=1)
    d.circle('Kahve', (17, 28), 3.2, part='kulak_1', line=True)
    d.circle('Kahve', (39, 28), 3.2, part='kulak_2', line=True)
    # alt ayak
    d.ellipse('Pembe', (14, 46.5), (4.6, 3.6), part='kol_1', line=True, rot=-20)
    d.ellipse('Pembe', (42, 46.5), (4.6, 3.6), part='kol_2', line=True, rot=20)
    d.pix((10, 48), ['#.#'], {'#': 'Pembe-4'}, part='kol_1')
    d.pix((42, 48), ['#.#'], {'#': 'Pembe-4'}, part='kol_2')
    kask(d, 28, 29, 11.5, 8.6, 32)
    # kask onunde isildayan minik mantar
    d.ellipse('Pembe', (28, 24.2), (3.4, 2.4), part='tepe', name='mantar', line=True, lift=0.15)
    d.rect('Pembe', (27, 26, 28, 27), part='tepe', line=True)
    d.pix((26, 23), ['oo'], {'o': 'Parilti'}, part='tepe')
    yildiz(d, 28, 37)
    d.set_face(28, 37, gap=5)


def usta(d):
    # belde caki dolu kese (once: govdenin arkasinda degil, yanda)
    d.ellipse('Kahve', (32, 46), (17.5, 15.4), name='govde', cast=1)
    d.ellipse('Kahve', (32, 35), (14.4, 13.5), name='kafa', join='govde')
    d.circle('Kahve', (19, 26), 3.6, part='kulak_1', line=True)
    d.circle('Kahve', (45, 26), 3.6, part='kulak_2', line=True)
    # omuzda kazma
    d.capsule('Kahve', (47, 54), (51, 27), 2.6, part='esya', name='sap', line=True)
    d.curve('Tas', [(44, 32), (51, 26.5), (58, 32)], 3.4, part='esya', name='kazma', line=True, lift=0.05)
    # kristalli kask
    d.ellipse('Tas', (32, 30), (13.9, 10.4), inbox=(0, 0, 63, 33), part='govde', name='kask', line=True, cast=1, lift=0.05)
    d.ellipse('Tas', (32, 32), (14.8, 1.8), part='govde', join='kask')
    d.capsule('Tas', (21, 27), (43, 27), 1.2, part='govde', clip='kask', shift=1)
    for a, b, w in (((26, 24), (23, 17), (4.2, 3.4)), ((32, 22), (32, 14), (4.6, 3.6)), ((38, 24), (41, 17), (4.2, 3.4))):
        d.capsule('Pembe', a, b, w, part='tepe', line=True)
    d.pix((31, 15), ['oo'], {'o': 'Parilti'}, part='tepe')
    # pembe pencler
    d.ellipse('Pembe', (17, 54), (5.4, 4.2), part='kol_1', line=True, rot=-20)
    d.ellipse('Pembe', (47, 54), (5.4, 4.2), part='kol_2', line=True, rot=20)
    d.pix((12, 56), ['#.#.#'], {'#': 'Pembe-4'}, part='kol_1')
    d.pix((46, 56), ['#.#.#'], {'#': 'Pembe-4'}, part='kol_2')
    # kemer ve kese
    d.capsule('Kahve', (19, 52), (45, 52), 2.4, part='govde', clip='govde', shift=2)
    d.ellipse('Krem', (24, 56), (4.2, 3.4), part='esya', name='kese', line=True)
    d.circle('Tas', (23, 55), 1.6, part='esya')
    d.circle('Tas', (26, 56.5), 1.2, part='esya')
    yildiz(d, 32, 38)
    d.set_face(32, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def burun_yan(d, x, y, r):
    d.circle('Pembe', (x, y), r, line=True, lift=0.1)


def bebek_yan(d):
    d.circle('Kahve', (31, 26), 3.0, part='kulak_2', line=True, lift=-0.2)
    d.ellipse('Pembe', (33, 45.5), (4.2, 3.2), part='kol_2', line=True, lift=-0.15)
    d.ellipse('Kahve', (26, 35), (13.5, 12), name='kafa', cast=1)
    d.ellipse('Kahve', (14, 38), (5, 4), join='kafa')
    burun_yan(d, 10, 37.5, 2.6)
    d.circle('Kahve', (27, 25), 3.0, part='kulak_1', line=True)
    d.ellipse('Tas', (27, 22), (6.4, 4.4), part='tepe', name='cakil', line=True, cast=1)
    d.circle('Tas', (23, 20.5), 1.6, part='tepe', clip='cakil', shift=-1)
    d.ellipse('Pembe', (20, 46), (4.4, 3.4), part='kol_1', line=True)
    d.set_face_side(18, 34)


def genc_yan(d):
    d.circle('Kahve', (35, 31), 3.2, part='kulak_2', line=True, lift=-0.2)
    d.ellipse('Pembe', (36, 47.5), (4.6, 3.6), part='kol_2', line=True, lift=-0.15)
    d.ellipse('Kahve', (30, 40), (15, 13), name='kafa', cast=1)
    d.ellipse('Kahve', (16, 43), (5.4, 4.2), join='kafa')
    burun_yan(d, 11.5, 42.5, 2.8)
    d.ellipse('Tas', (28, 29), (11.5, 8.6), inbox=(0, 0, 63, 32), name='kask', line=True, cast=1, lift=0.05)
    d.ellipse('Tas', (28, 32), (12.3, 1.7), join='kask')
    d.capsule('Tas', (21, 28), (35, 28), 1.2, clip='kask', shift=1)
    d.circle('Kahve', (35, 33), 3.2, part='kulak_1', line=True)
    d.ellipse('Pembe', (22, 24.2), (3.6, 2.6), part='tepe', name='mantar', line=True, lift=0.15)
    d.rect('Pembe', (21, 26, 22, 27), part='tepe', line=True)
    d.pix((20, 23), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.ellipse('Pembe', (22, 48), (4.6, 3.6), part='kol_1', line=True)
    d.set_face_side(18, 38)


def usta_yan(d):
    d.capsule('Kahve', (45, 56), (50, 28), 2.6, part='esya', name='sap', line=True)
    d.curve('Tas', [(44, 32), (51, 26.5), (58, 32)], 3.4, part='esya', name='kazma', line=True, lift=0.05)
    d.ellipse('Pembe', (43, 59), (5.4, 4.2), part='kol_2', line=True, lift=-0.15)
    d.ellipse('Kahve', (34, 47), (17, 15), name='govde', cast=1)
    d.ellipse('Kahve', (27, 37), (14, 13), name='kafa', join='govde')
    d.ellipse('Kahve', (14, 41), (5.8, 4.4), join='govde')
    burun_yan(d, 9.5, 40.5, 3.0)
    d.circle('Kahve', (36, 30), 3.6, part='kulak_2', line=True, lift=-0.2)
    d.ellipse('Krem', (41, 52), (4.2, 3.6), part='esya', name='kese', line=True)
    d.circle('Tas', (40, 51), 1.6, part='esya')
    d.circle('Tas', (43, 53), 1.2, part='esya')
    d.ellipse('Tas', (28, 31), (13.4, 10.4), inbox=(0, 0, 63, 34), name='kask', line=True, cast=1, lift=0.05)
    d.ellipse('Tas', (28, 34), (14.2, 1.8), join='kask')
    d.capsule('Tas', (17, 30), (39, 30), 1.2, clip='kask', shift=1)
    for a, b, w in (((23, 26), (20, 18), (4.2, 3.4)), ((28, 24), (28, 15), (4.6, 3.6)), ((33, 26), (36, 18), (4.2, 3.4))):
        d.capsule('Pembe', a, b, w, part='tepe', line=True)
    d.pix((27, 16), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.circle('Kahve', (36, 36), 3.6, part='kulak_1', line=True)
    d.ellipse('Pembe', (22, 60), (5.4, 4.2), part='kol_1', line=True)
    d.set_face_side(18, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
