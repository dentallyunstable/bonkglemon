# Kara Kuzgun (Golge, nadir, ucar). Tarif: TARIFLER.md. Tombul Lacivert kuzgun yavrusu; buyuk Mor gaga, tuylerde Mor yansima, Sari hazine (dugme, anahtar, yuzuk).
# Baykuslardan farki: kulak tutami ve yuz diski yok; gaga yuz kutusunun disinda, kanatlar yukari acik, kuyruk yelpaze.
# Renk: Lacivert (koyu tonlar: tuy, gaga), Mor (ince yansima serit), Sari (hazine). Parlak: Lacivert -> Kar.
PARLA = 'Sari'
DK = -0.8   # govde isik kaymasi: neredeyse siyah (Lacivert-3/4)


import math


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kanat(d, cx, W, sheen, nm=('w1', 'w2')):
    d.poly('Lacivert', W, part='kanat_1', line=True, name=nm[0], lift=DK)
    d.poly('Lacivert', mir(W, cx), part='kanat_2', line=True, name=nm[1], lift=DK)
    for (a, b, w) in sheen:
        d.capsule('Mor', a, b, w, clip=nm[0], tone=2, part='kanat_1')
        d.capsule('Mor', (2 * cx - a[0], a[1]), (2 * cx - b[0], b[1]), w, clip=nm[1], tone=2, part='kanat_2')


def gaga(d, cx, y, w, h):
    """Iri, koyu kuzgun gagasi: genis tabanli, hafif kancali uc. Ustunde ince acik vurgu."""
    d.poly('Lacivert', [(cx - w, y), (cx + w, y), (cx + w * 0.9, y + h * 0.5), (cx + w * 0.4, y + h * 0.85), (cx, y + h), (cx - w * 0.4, y + h * 0.85), (cx - w * 0.9, y + h * 0.5)],
           line=True, name='gaga', lift=0.1, noshadow=True)
    d.capsule('Lacivert', (cx - w * 0.8, y + h * 0.52), (cx + w * 0.8, y + h * 0.52), 0.55, clip='gaga', shift=1)
    d.capsule('Lacivert', (cx - w * 0.45, y + 1.2), (cx - w * 0.1, y + h * 0.4), 1.0, clip='gaga', tone=1)


def tutam(d, cx, top, n=3):
    """Bas ustunde 2-3 tuylu kucuk tutam (tepe)."""
    xs = (-2.8, 0, 2.8) if n == 3 else (-2, 2)
    for k, x in enumerate(xs):
        h = 4 if k == 1 and n == 3 else 3
        d.capsule('Lacivert', (cx + x * 0.7, top + 2), (cx + x * 1.0, top - h), (2.4, 1.6), part='tepe', line=True, lift=DK + 0.25)


def tepe_parilti(d, cx, top):
    d.pix((cx - 1, top + 1), ['.oo'], {'o': 'Mor-2'}, keep=True)


def tuyyaka(d, pts, r):
    """Gogus/bogaz sivri tuy yakasi: asagi sivri ucgen tuyler, govdeye katilir."""
    for x, y in pts:
        d.poly('Lacivert', [(x - r, y - 1), (x + r, y - 1), (x + 0.3, y + r * 1.9)], join='kafa')


def govde_ac(d, nm='kafa', yuz=None):
    """Sol ustte yumusak isik lekesi + ince Mor yansima serit(ler) + gozlerin cevresinde bir ton acik yuz alani."""
    pass


def dugme(d, x, y, r=2.5):
    d.circle('Sari', (x, y), r, line=True, part='govde', lift=0.1)
    d.pix((round(x) - 1, round(y)), ['#.#'], {'#': 'Sari-4'}, part='govde')


def zincir(d, pts, w=0.9):
    d.curve('Sari', pts, w, part='govde', line=False, noshadow=True, shade='flat', tone=3)


def bebek(d):
    d.flyer = True
    cx = 24
    W = [(14, 37), (9, 30), (6, 25), (4.5, 31), (7, 33), (4.5, 37), (8, 40), (12, 42)]
    kanat(d, cx, W, [((12, 35), (8, 28), 1.0)])
    d.ellipse('Lacivert', (cx, 34.5), (12.8, 11), name='kafa', cast=1, lift=DK)
    d.ellipse('Lacivert', (cx - 5, 29), (4.5, 3), clip='kafa', shift=-1)
    d.capsule('Mor', (16.5, 30), (20, 26.8), 0.9, clip='kafa', tone=2)
    d.capsule('Mor', (29, 27), (31.5, 29.5), 0.9, clip='kafa', tone=2)
    d.ellipse('Lacivert', (cx, 33), (9.5, 4.8), clip='kafa', tone=3, shade='flat')
    for x, y in ((15, 40), (33, 40), (24, 45), (19, 44.5), (29, 44.5)):
        d.circle('Lacivert', (x, y), 3, join='kafa')
    tuyyaka(d, [(16, 43), (20, 45.5), (28, 45.5), (32, 43)], 2.3)
    tutam(d, cx, 23.5)
    gaga(d, cx, 36.5, 4.0, 8.5)
    dugme(d, cx, 46.5, 2.8)
    d.pix((cx - 2, 45), ['oo'], {'o': 'Parilti'})
    d.set_face(cx, 30, gap=5, mouth=False)


def genc(d):
    d.flyer = True
    cx = 28
    W = [(16, 41), (10, 32), (6, 24), (4.5, 30), (8, 33), (4, 38), (8, 42), (5, 46), (14, 47)]
    kanat(d, cx, W, [((13, 38), (8, 27), 1.2), ((10, 43), (6, 36), 1.0)])
    d.ellipse('Lacivert', (cx, 37), (14.5, 13), name='kafa', cast=1, lift=DK)
    d.ellipse('Lacivert', (cx - 6, 31), (5, 3.2), clip='kafa', shift=-1)
    d.capsule('Mor', (17.5, 31), (22, 27), 1.0, clip='kafa', tone=2)
    d.capsule('Mor', (34, 30), (37, 34), 1.0, clip='kafa', tone=2)
    d.capsule('Mor', (21, 47), (24, 50), 1.0, clip='kafa', tone=2)
    d.ellipse('Lacivert', (cx, 36), (10.5, 5.2), clip='kafa', tone=3, shade='flat')
    for x, y in ((15.5, 43), (40.5, 43), (28, 48.5), (22, 48), (34, 48)):
        d.circle('Lacivert', (x, y), 3.4, join='kafa')
    tuyyaka(d, [(16.5, 46), (21, 49.5), (26, 50.5), (30, 50.5), (35, 49.5), (39.5, 46)], 2.6)
    tutam(d, cx, 24)
    gaga(d, cx, 37, 4.6, 9.5)
    zincir(d, [(15.5, 42), (19, 48), (28, 51), (37, 48), (40.5, 42)])
    dugme(d, cx, 52, 2.8)
    d.pix((cx - 1.5, 50.5), ['oo'], {'o': 'Parilti'})
    d.set_face(cx, 31, gap=5, mouth=False)


def usta(d):
    d.flyer = True
    cx = 32
    # yelpaze kuyruk: sivri uclu tuyler
    d.ellipse('Lacivert', (cx, 55), (13, 6), part='kuyruk', name='kyr', line=True, lift=DK)
    for x in (-13, -6.5, 0, 6.5, 13):
        y = 63.5 - abs(x) * 0.28
        d.poly('Lacivert', [(cx + x * 0.35 - 3, 54), (cx + x * 0.35 + 3, 54), (cx + x + 2.4, y - 2), (cx + x, y + 1.5), (cx + x - 2.4, y - 2)], part='kuyruk', join='kyr')
        d.capsule('Mor', (cx + x * 0.3, 56), (cx + x * 0.97, y - 1), 0.8, part='kuyruk', clip='kyr', tone=2)
    W = [(19, 45), (12, 34), (7, 24), (4.5, 17), (4, 25), (1.5, 30), (3.5, 36), (1.5, 42), (5, 47), (9, 51), (14, 50)]
    kanat(d, cx, W, [((15, 41), (8, 24), 1.3), ((11, 45), (5, 33), 1.2), ((8, 46), (5, 40), 1.0)])
    d.ellipse('Lacivert', (cx, 42), (17, 18.5), name='kafa', cast=1, lift=DK)
    d.ellipse('Lacivert', (cx - 7, 33), (6, 3.6), clip='kafa', shift=-1)
    d.capsule('Mor', (18, 33), (24, 27.5), 1.1, clip='kafa', tone=2)
    d.capsule('Mor', (42, 31), (45, 36), 1.1, clip='kafa', tone=2)
    d.capsule('Mor', (21, 49), (25, 52), 1.1, clip='kafa', tone=2)
    d.ellipse('Lacivert', (cx, 40.5), (12, 6.2), clip='kafa', tone=3, shade='flat')
    for x, y in ((17, 46), (47, 46), (32, 56), (24, 55), (40, 55)):
        d.circle('Lacivert', (x, y), 3.8, join='kafa')
    tuyyaka(d, [(18, 49), (22, 53), (27, 56), (32, 57), (37, 56), (42, 53), (46, 49)], 3.0)
    tutam(d, cx, 23.5)
    gaga(d, cx, 39.5, 5.2, 10.5)
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


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, kanatlari ustte
def kuzgun_yan(d, s, ox, oy, dugme_var=True, anahtar=False):
    """Bebek olcusunda tasarla, s ile buyut. (ox, oy) = bebek (24, 44) noktasinin yeri."""
    P = lambda x, y: (ox + (x - 24) * s, oy + (y - 44) * s)
    L = lambda pts: [P(*q) for q in pts]
    d.poly('Lacivert', L([(30, 32), (32, 23), (37, 16), (40, 24), (38, 34)]), part='kanat_2', name='wf', line=True, lift=DK - 0.12)
    d.capsule('Mor', P(33, 30), P(36, 21), 1.0 * s, clip='wf', tone=2, part='kanat_2')
    d.poly('Lacivert', L([(34, 36), (43, 33), (45.5, 38), (35, 43)]), part='kuyruk', name='ky', line=True, lift=DK)
    d.capsule('Mor', P(37, 38), P(44, 36.5), 0.8 * s, clip='ky', tone=2, part='kuyruk')
    d.ellipse('Lacivert', P(27, 37), (10.5 * s, 10 * s), name='kafa', cast=1, lift=DK)
    d.circle('Lacivert', P(20, 33), 10 * s, join='kafa')
    d.ellipse('Lacivert', P(17, 27), (4.5 * s, 3 * s), clip='kafa', shift=-1)
    d.ellipse('Lacivert', P(21, 40), (7 * s, 4 * s), clip='kafa', tone=3, shade='flat')
    for k, (x, y) in enumerate(((19, 23.5), (23, 23))):
        q = P(x, y)
        d.capsule('Lacivert', (q[0], q[1] + 2), (q[0] + 1.2 * s, q[1] - (3.5 + k) * s), (2.4 * s, 1.6 * s), part='tepe', line=True, lift=DK + 0.25)
    d.pix(P(17, 26), ['.oo'], {'o': 'Mor-2'}, keep=True)
    b = L([(11.5, 35), (3.5, 38.5), (11.5, 42.5)])
    d.poly('Lacivert', b, line=True, name='gaga', lift=0.1, noshadow=True)
    d.capsule('Lacivert', (b[0][0] - 1, b[0][1] + 3.3 * s), (b[1][0] + 3, b[1][1] + 0.5), 0.6, clip='gaga', shift=1)
    d.poly('Lacivert', L([(25, 35), (33, 33), (39, 39), (34, 44), (26, 42)]), part='kanat_1', name='wn', line=True, lift=DK + 0.12)
    d.capsule('Mor', P(28, 36), P(37, 38.5), 1.0 * s, clip='wn', tone=2, part='kanat_1')
    if dugme_var:
        c = P(20.5, 44)
        d.circle('Sari', c, 2.5 * s, line=True, part='govde', lift=0.1)
        d.pix((round(c[0]) - 1, round(c[1]) - 1), ['oo'], {'o': 'Parilti'})
    return P


def bebek_yan(d):
    d.flyer = True
    kuzgun_yan(d, 1.0, 24, 44)
    d.set_face_side(14, 28)


def genc_yan(d):
    d.flyer = True
    P = kuzgun_yan(d, 1.15, 26, 49)
    d.curve('Sari', [P(15, 42), P(19, 47.5), P(26, 48)], 0.9, shade='flat', tone=3, noshadow=True)
    d.set_face_side(*[int(round(v / 2)) * 2 for v in P(14.5, 29)])


def usta_yan(d):
    d.flyer = True
    P = kuzgun_yan(d, 1.3, 28, 54, dugme_var=False)
    c = P(20, 44)
    d.circle('Sari', c, 3.0, line=True, part='govde', lift=0.1)
    d.pix((round(c[0]) - 1, round(c[1]) - 1), ['oo'], {'o': 'Parilti'})
    d.pix((round(c[0]) + 4, round(c[1]) - 1), ['.###.', '#...#', '#...#', '.###.', '..#..', '..##.', '..#..', '..##.'], {'#': 'Sari-2'}, part='govde')
    d.set_face_side(*[int(round(v / 2)) * 2 for v in P(14.5, 29)])


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
