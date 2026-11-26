# Fener Semenderi (Tas, nadir). Tarif: TARIFLER.md. Karanlik goldeki pembe aksolotl; sacakli solungaclari fener gibi parlar.
# Renk: Pembe (govde), Mor (benek, golge), Sari (isik). Parlak: Pembe -> Lacivert.
PARLA = 'Sari'


def sag(side, x, cx):
    return x if side == 1 else 2 * cx - x


def solungac(d, side, cx, base, tip, w=(3.0, 3.8), nm=None):
    """side=1 sol (kulak_1), 2 sag (kulak_2); koordinatlar sol icin verilir, sag aynalanir."""
    m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
    d.capsule('Sari', m(base), m(tip), w, part='kulak_%d' % side, line=True, name=nm)
    (bx, by), (tx, ty) = m(base), m(tip)
    L = ((bx - tx) ** 2 + (by - ty) ** 2) ** 0.5
    px, py = tx + 2.6 * (bx - tx) / L, ty + 2.6 * (by - ty) / L - 0.5
    d.pix((round(px) - 1, round(py)), ['oo'], {'o': 'Parilti'}, part='kulak_%d' % side)


def bebek(d):
    cx = 24
    for base, tip in (((14, 29), (7, 21)), ((12.5, 34), (4.5, 31.5)), ((14, 39), (6.5, 41))):
        solungac(d, 1, cx, base, tip)
        solungac(d, 2, cx, base, tip)
    d.ellipse('Pembe', (24, 35), (14, 11.8), name='kafa', cast=1)
    d.ellipse('Pembe', (24, 43), (8.5, 3.8), name='karin', join='kafa')
    d.circle('Pembe', (16.5, 45), 2.8, part='kol_1', line=True)
    d.circle('Pembe', (31.5, 45), 2.8, part='kol_2', line=True)
    d.set_face(24, 33, gap=5)


def genc(d):
    cx = 28
    # kuyruk onde kivrilir, ucu isik
    for base, tip, w in (((16, 29), (8, 20), (3.4, 4.2)), ((14.5, 34), (5, 31), (3.4, 4.2)), ((16, 39), (7, 41), (3.4, 4.2))):
        solungac(d, 1, cx, base, tip, w)
        solungac(d, 2, cx, base, tip, w)
    d.ellipse('Pembe', (28, 41), (14, 12), name='govde', cast=1)
    d.ellipse('Pembe', (28, 33), (13.4, 11), name='kafa', join='govde')
    d.circle('Pembe', (15.5, 47.5), 3.2, part='kol_1', line=True)
    d.circle('Pembe', (40.5, 45.5), 3.2, part='kol_2', line=True)
    d.curve('Pembe', [(43, 46), (40, 52), (31, 52.5)], (5.4, 4.6), part='kuyruk', line=True)
    d.circle('Sari', (25.5, 52), 3.8, part='kuyruk', line=True)
    d.pix((23, 50), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    d.set_face(28, 31, gap=5)


def usta(d):
    cx = 32

    def dal(side, pts, w):
        m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
        d.curve('Sari', [m(p) for p in pts], w, part='kulak_%d' % side, line=True)

    for side in (1, 2):
        # ana dallar, uclarda tombul ikiye ayrilir (mercan)
        dal(side, [(19, 30), (12, 25), (8, 17)], (3.6, 3.8))
        dal(side, [(12, 25), (5, 24)], (3.2, 3.4))
        dal(side, [(18, 35), (9, 34), (4, 29)], (3.6, 3.8))
        dal(side, [(9, 34), (4, 38)], (3.2, 3.4))
        dal(side, [(19, 40), (11, 43), (6, 48)], (3.6, 3.8))
        dal(side, [(11, 43), (5, 42)], (3.2, 3.4))
    d.ellipse('Pembe', (32, 47), (16.5, 15), name='govde', cast=1)
    d.ellipse('Pembe', (32, 34), (15, 13.4), name='kafa', join='govde')
    # sirtta isikli benekler (Mor zemin uzerinde Sari)
    d.circle('Pembe', (14.5, 53), 3.8, part='kol_1', line=True)
    d.circle('Pembe', (49.5, 53), 3.8, part='kol_2', line=True)
    for x, y in ((17.5, 46), (46.5, 45), (23, 55.5), (41, 55.5)):
        d.circle('Mor', (x, y), 2.9, part='govde', clip='govde', shift=0)
        d.circle('Sari', (x, y), 1.9, part='govde', clip='govde', shift=0)
    d.curve('Pembe', [(44, 60), (50, 61), (54, 58)], (5.2, 4.2), part='kuyruk', line=True)
    d.circle('Sari', (55, 57), 4.0, part='kuyruk', line=True)
    d.pix((53, 54), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    d.set_face(32, 32, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def fener_yan(d, part, pts, w, shade=0.0):
    d.curve('Sari', pts, w, part=part, line=True, lift=shade)
    ex, ey = pts[-1]
    d.pix((round(ex) - 1, round(ey) - 1), ['oo'], {'o': 'Parilti'}, part=part)


def bebek_yan(d):
    for pts in (((32, 30), (37, 22)), ((33, 35), (41, 33)), ((32, 40), (39, 43))):
        fener_yan(d, 'kulak_2', [(pts[0][0] + 4, pts[0][1] - 4), (pts[1][0] + 4, pts[1][1] - 4)], (3.0, 3.8), -0.2)
    d.ellipse('Pembe', (25, 36), (13.5, 11.4), name='kafa', cast=1)
    d.ellipse('Pembe', (33, 43), (8.5, 4.6), join='kafa')
    for pts in (((30, 30), (35, 20)), ((31, 35), (41, 32)), ((30, 40), (39, 44))):
        fener_yan(d, 'kulak_1', list(pts), (3.0, 3.8))
    d.circle('Pembe', (19, 46), 2.8, part='kol_1', line=True)
    d.circle('Pembe', (32, 46), 2.8, part='kol_2', line=True, lift=-0.1)
    d.set_face_side(14, 34)


def genc_yan(d):
    for pts in (((35, 29), (41, 20)), ((36, 34), (45, 31)), ((35, 39), (43, 42))):
        fener_yan(d, 'kulak_2', [(pts[0][0] + 3, pts[0][1] - 3), (pts[1][0] + 3, pts[1][1] - 3)], (3.4, 4.2), -0.2)
    d.curve('Pembe', [(40, 47), (48, 47), (52, 41)], (6.0, 4.6), part='kuyruk', line=True)
    d.circle('Sari', (52, 38), 3.8, part='kuyruk', line=True)
    d.pix((50, 36), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    d.circle('Pembe', (38, 49), 3.2, part='kol_2', line=True, lift=-0.1)
    d.ellipse('Pembe', (31, 42), (14.5, 11.5), name='govde', cast=1)
    d.ellipse('Pembe', (25, 34), (13.4, 11), name='kafa', join='govde')
    for pts in (((32, 29), (38, 20)), ((33, 34), (42, 31)), ((32, 39), (40, 42))):
        fener_yan(d, 'kulak_1', list(pts), (3.4, 4.2))
    d.circle('Pembe', (21, 49), 3.2, part='kol_1', line=True)
    d.set_face_side(16, 32)


def usta_yan(d):
    def dal(part, pts, w, lift=0.0):
        d.curve('Sari', [(x, y) for x, y in pts], w, part=part, line=True, lift=lift)

    for part, ox, oy, lf in (('kulak_2', 3, -3, -0.2), ('kulak_1', 0, 0, 0.0)):
        dal(part, [(32 + ox, 31 + oy), (39 + ox, 25 + oy), (43 + ox, 17 + oy)], (3.6, 3.8), lf)
        dal(part, [(39 + ox, 25 + oy), (46 + ox, 24 + oy)], (3.2, 3.4), lf)
        dal(part, [(33 + ox, 36 + oy), (42 + ox, 35 + oy), (47 + ox, 29 + oy)], (3.6, 3.8), lf)
        dal(part, [(42 + ox, 35 + oy), (48 + ox, 38 + oy)], (3.2, 3.4), lf)
        dal(part, [(33 + ox, 41 + oy), (41 + ox, 44 + oy), (46 + ox, 49 + oy)], (3.6, 3.8), lf)
        dal(part, [(41 + ox, 44 + oy), (47 + ox, 43 + oy)], (3.2, 3.4), lf)
    d.pix((43, 14), ['oo'], {'o': 'Parilti'}, part='kulak_1')
    d.curve('Pembe', [(46, 60), (53, 60), (57, 55)], (5.4, 4.4), part='kuyruk', line=True)
    d.circle('Sari', (57, 52), 4.2, part='kuyruk', line=True)
    d.pix((55, 49), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    d.circle('Pembe', (43, 58), 3.8, part='kol_2', line=True, lift=-0.1)
    d.ellipse('Pembe', (35, 48), (17, 14.5), name='govde', cast=1)
    d.ellipse('Pembe', (27, 35), (15, 13.4), name='kafa', join='govde')
    for x, y in ((36, 42), (44, 48), (30, 54), (40, 55)):
        d.circle('Mor', (x, y), 2.9, part='govde', clip='govde', shift=0)
        d.circle('Sari', (x, y), 1.9, part='govde', clip='govde', shift=0)
    d.circle('Pembe', (22, 58), 3.8, part='kol_1', line=True)
    d.set_face_side(16, 34)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
