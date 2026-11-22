# Ay Guvesi (Golge, epik, ucar). Tarif: TARIFLER.md. Kar govdeli, Mor kanatli guve; kabarik tuy yaka, tuylu antenler, kanatlarda Sari hilal (isik kaynagi).
# Renk: Mor (kanat), Kar (govde, yaka, anten), Sari (hilal). Parlak: Mor -> Cam.
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def anten(d, cx, base, tip, n, r, side):
    """Tuylu anten: ince sap + kisa yan tuyler. side=-1 sol, 1 sag. 'tepe' parcasi."""
    bx, by = base
    tx, ty = tip
    d.capsule('Kar', (bx, by), (tx, ty), (1.8, 1.2), part='tepe')
    for i in range(1, n + 1):
        t = i / (n + 1)
        x = bx + (tx - bx) * t
        y = by + (ty - by) * t
        k = r * (1 - 0.4 * t)
        d.ellipse('Kar', (x - side * k * 0.8, y + 0.4), (k, 1.0), rot=-side * 30, part='tepe')
        d.ellipse('Kar', (x + side * k * 0.8, y - 0.8), (k, 1.0), rot=side * 30, part='tepe')


def hilal(d, c, r, part, nm, ox, oy, rot_family='Mor', k=0.82):
    d.circle('Sari', c, r, part=part, name=nm, lift=0.1)
    d.circle(rot_family, (c[0] + ox, c[1] + oy), r * k, sub=nm)


def bebek(d):
    d.flyer = True
    cx = 24
    W = [(14, 34), (9, 25), (5, 25), (4, 32), (7, 38), (13, 40)]
    d.poly('Mor', W, part='kanat_1', line=True, name='w1', lift=0.04)
    d.poly('Mor', mir(W, cx), part='kanat_2', line=True, name='w2', lift=0.04)
    anten(d, cx, (20, 25), (14, 14), 3, 2.6, -1)
    anten(d, cx, (28, 25), (34, 14), 3, 2.6, 1)
    d.ellipse('Kar', (24, 34.5), (12.8, 11.2), name='kafa', cast=1, lift=0.03)
    for x, y in ((14, 38), (34, 38), (24, 44.5), (19, 43.5), (29, 43.5)):
        d.circle('Kar', (x, y), 3, join='kafa')
    d.set_face(24, 31, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    W = [(16, 37), (10, 24), (5, 20), (3, 29), (4, 38), (9, 43), (15, 44)]
    d.poly('Mor', W, part='kanat_1', line=True, name='w1', lift=0.04)
    d.poly('Mor', mir(W, cx), part='kanat_2', line=True, name='w2', lift=0.04)
    hilal(d, (9.5, 31), 4.6, 'kanat_1', 'h1', 1.8, -0.4)
    hilal(d, (46.5, 31), 4.6, 'kanat_2', 'h2', -1.8, -0.4)
    d.pix((7, 28), ['oo'], {'o': 'Parilti'}, part='kanat_1')
    d.pix((47, 28), ['oo'], {'o': 'Parilti'}, part='kanat_2')
    anten(d, cx, (23, 26), (15, 12), 4, 3.2, -1)
    anten(d, cx, (33, 26), (41, 12), 4, 3.2, 1)
    d.ellipse('Kar', (28, 36.5), (14.2, 13.3), name='kafa', cast=1, lift=0.03)
    for x, y in ((15, 40), (41, 40), (28, 47.5), (21, 46.5), (35, 46.5)):
        d.circle('Kar', (x, y), 3.4, join='kafa')
    # kabarik yaka (yuz altinda)
    d.ellipse('Kar', (28, 46.5), (12.5, 3.6), name='yaka', line=True, lift=0.1)
    for x, y, r in ((16.5, 46, 2.6), (20.5, 49, 2.7), (25, 50.3, 2.8), (31, 50.3, 2.8), (35.5, 49, 2.7), (39.5, 46, 2.6)):
        d.circle('Kar', (x, y), r, join='yaka')
    d.set_face(28, 32, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    W = [(20, 42), (14, 29), (9, 20), (5, 27), (4, 36), (6, 44), (15, 47)]
    d.poly('Mor', W, part='kanat_1', line=True, name='w1', lift=0.04)
    d.poly('Mor', mir(W, cx), part='kanat_2', line=True, name='w2', lift=0.04)
    # alt kanatlar: uzun kivrik kuyruklar
    for s_, p in ((1, 'kanat_1'), (-1, 'kanat_2')):
        X = lambda x: x if s_ == 1 else 2 * cx - x
        d.poly('Mor', [(X(20), 44), (X(10), 44), (X(5), 49), (X(7), 55), (X(14), 55)], part=p, line=True, lift=-0.04)
        d.curve('Mor', [(X(7), 53), (X(4), 58), (X(5), 62), (X(8), 62), (X(9), 59)], (4.0, 1.8), part=p, line=True)
    hilal(d, (10.5, 34), 6.4, 'kanat_1', 'h1', 2.8, -0.8)
    hilal(d, (53.5, 34), 6.4, 'kanat_2', 'h2', -2.8, -0.8)
    d.pix((7, 29), ['ooo', 'o..'], {'o': 'Parilti'}, part='kanat_1')
    d.pix((55, 29), ['ooo', '..o'], {'o': 'Parilti'}, part='kanat_2')
    d.circle('Sari', (8, 50), 1.8, part='kanat_1', line=True)
    d.circle('Sari', (56, 50), 1.8, part='kanat_2', line=True)
    anten(d, cx, (26, 27), (19, 16), 5, 3.2, -1)
    anten(d, cx, (38, 27), (45, 16), 5, 3.2, 1)
    d.ellipse('Kar', (32, 41), (13.6, 16.8), name='kafa', cast=1, lift=0.03)
    for x, y in ((17, 44), (47, 44), (32, 52), (24, 51), (40, 51)):
        d.circle('Kar', (x, y), 3.6, join='kafa')
    d.ellipse('Kar', (32, 52.5), (12.5, 4.4), name='yaka', line=True, lift=0.1)
    for x, y, r in ((20, 51.5, 3.2), (23.5, 55.5, 3.3), (28, 57.5, 3.4), (36, 57.5, 3.4), (40.5, 55.5, 3.3), (44, 51.5, 3.2)):
        d.circle('Kar', (x, y), r, join='yaka')
    d.set_face(32, 34, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
