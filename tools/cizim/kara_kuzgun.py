# Kara Kuzgun (Golge, nadir, ucar). Tarif: TARIFLER.md. Tombul Lacivert kuzgun yavrusu; buyuk Mor gaga, tuylerde Mor yansima, Sari hazine (dugme, anahtar, yuzuk).
# Baykuslardan farki: kulak tutami ve yuz diski yok; gaga yuz kutusunun disinda, kanatlar yukari acik, kuyruk yelpaze.
# Renk: Lacivert (tuy), Mor (yansima, gaga), Sari (hazine). Parlak: Lacivert -> Kar.
PARLA = 'Sari'


import math


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kanat(d, cx, W, sheen, nm=('w1', 'w2')):
    d.poly('Lacivert', W, part='kanat_1', line=True, name=nm[0], lift=-0.02)
    d.poly('Lacivert', mir(W, cx), part='kanat_2', line=True, name=nm[1], lift=-0.02)
    for (a, b, w) in sheen:
        d.capsule('Mor', a, b, w, clip=nm[0], tone=2, part='kanat_1')
        d.capsule('Mor', (2 * cx - a[0], a[1]), (2 * cx - b[0], b[1]), w, clip=nm[1], tone=2, part='kanat_2')


def gaga(d, cx, y, w, h):
    """Buyuk kuzgun gagasi: genis tabanli, kancali uc. y ust kenar."""
    d.poly('Mor', [(cx - w, y), (cx + w, y), (cx + w * 0.9, y + h * 0.5), (cx + w * 0.4, y + h * 0.85), (cx, y + h), (cx - w * 0.4, y + h * 0.85), (cx - w * 0.9, y + h * 0.5)],
           line=True, name='gaga', lift=0.22, noshadow=True)
    d.capsule('Mor', (cx - w * 0.8, y + h * 0.52), (cx + w * 0.8, y + h * 0.52), 0.55, clip='gaga', shift=1)
    d.capsule('Mor', (cx, y + 0.5), (cx, y + h * 0.4), 0.9, clip='gaga', shift=-1)


def dugme(d, x, y, r=2.5):
    d.circle('Sari', (x, y), r, line=True, part='govde', lift=0.1)
    d.pix((round(x) - 1, round(y)), ['#.#'], {'#': 'Sari-4'}, part='govde')


def zincir(d, pts, w=0.9):
    d.curve('Sari', pts, w, part='govde', line=False, noshadow=True, shade='flat', tone=3)


def bebek(d):
    d.flyer = True
    cx = 24
    W = [(14, 37), (9, 30), (5, 25), (4, 32), (6, 38), (12, 42)]
    kanat(d, cx, W, [((12, 35), (7, 28), 1.0)])
    # tuy kuyruk ucu
    d.ellipse('Lacivert', (cx, 34.5), (12.8, 11), name='kafa', cast=1, lift=0.0)
    d.capsule('Mor', (16.5, 30), (20.5, 26.5), 0.9, clip='kafa', tone=2)
    d.capsule('Mor', (29, 27), (32, 30), 0.9, clip='kafa', tone=2)
    for x, y in ((15, 40), (33, 40), (24, 45), (19, 44.5), (29, 44.5)):
        d.circle('Lacivert', (x, y), 3, join='kafa')
    gaga(d, cx, 36.5, 4.0, 8.5)
    d.pix((22, 44), ['.oo.', 'ooxo', 'oxxo', '.oo.'], {'o': 'Sari-3', 'x': 'Sari-1'}) if False else None
    dugme(d, cx, 46.5, 2.8)
    d.pix((cx - 2, 45), ['oo'], {'o': 'Parilti'})
    d.set_face(cx, 30, gap=5, mouth=False)


def genc(d):
    d.flyer = True
    cx = 28
    W = [(16, 41), (10, 32), (5, 24), (3, 31), (4, 39), (8, 45), (14, 46)]
    kanat(d, cx, W, [((13, 38), (7, 27), 1.2), ((10, 42), (5, 35), 1.0)])
    d.ellipse('Lacivert', (cx, 37), (14.5, 13), name='kafa', cast=1, lift=0.0)
    d.capsule('Mor', (17.5, 31), (22.5, 26.5), 1.0, clip='kafa', tone=2)
    d.capsule('Mor', (34, 30), (38, 35), 1.0, clip='kafa', tone=2)
    d.capsule('Mor', (21, 47), (24, 50), 1.0, clip='kafa', tone=2)
    for x, y in ((15.5, 43), (40.5, 43), (28, 48.5), (22, 48), (34, 48)):
        d.circle('Lacivert', (x, y), 3.4, join='kafa')
    gaga(d, cx, 37, 4.6, 9.5)
    # kolye: dugme boynunda
    zincir(d, [(15.5, 42), (19, 48), (28, 51), (37, 48), (40.5, 42)])
    dugme(d, cx, 52, 2.8)
    d.pix((cx - 1.5, 50.5), ['oo'], {'o': 'Parilti'})
    d.set_face(cx, 31, gap=5, mouth=False)


def usta(d):
    d.flyer = True
    cx = 32
    # yelpaze kuyruk: govdenin arkasindan acilan tuyler
    d.ellipse('Lacivert', (cx, 56), (15, 7.5), part='kuyruk', name='kyr', line=True, lift=-0.06)
    for i, x in enumerate((-12.5, -6.3, 0, 6.3, 12.5)):
        y = 62.5 - abs(x) * 0.22
        d.circle('Lacivert', (cx + x, y), 3.3, part='kuyruk', join='kyr')
        d.capsule('Mor', (cx + x * 0.3, 55), (cx + x, y - 0.5), 0.8, part='kuyruk', clip='kyr', tone=2)
    W = [(19, 45), (12, 34), (6, 24), (3, 17), (2, 28), (2, 40), (6, 48), (14, 50)]
    kanat(d, cx, W, [((15, 41), (7, 24), 1.3), ((11, 45), (4, 33), 1.2), ((7, 43), (5, 38), 1.0)])
    d.ellipse('Lacivert', (cx, 41), (16.5, 16.2), name='kafa', cast=1, lift=0.0)
    d.capsule('Mor', (18, 33), (24.5, 27), 1.1, clip='kafa', tone=2)
    d.capsule('Mor', (42, 30), (46, 36), 1.1, clip='kafa', tone=2)
    d.capsule('Mor', (21, 49), (25, 52), 1.1, clip='kafa', tone=2)
    for x, y in ((17, 46), (47, 46), (32, 56), (24, 55), (40, 55)):
        d.circle('Lacivert', (x, y), 3.8, join='kafa')
    gaga(d, cx, 39.5, 5.2, 10.5)
    # kolye: dugme, anahtar, yuzuk
    zincir(d, [(17, 46), (21, 51), (32, 54.5), (43, 51), (47, 46)], 1.0)
    dugme(d, 22.5, 54, 2.9)
    d.pix((21, 52), ['oo'], {'o': 'Parilti'})
    d.pix((30, 55), ['.###.', '#...#', '#...#', '.###.', '..#..', '..##.', '..#..', '..##.'], {'#': 'Sari-2'}, part='govde')
    d.pix((30, 55), ['.oo..'], {'o': 'Parilti'}, part='govde')
    d.circle('Sari', (41.5, 54.5), 3.0, line=True, name='yz', part='govde', lift=0.1)
    d.circle('Lacivert', (41.5, 55), 1.3, sub='yz')
    d.pix((40, 51), ['oo'], {'o': 'Parilti'})
    d.set_face(cx, 33, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
