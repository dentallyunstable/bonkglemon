# Yildiz Balinasi (Golge, efsanevi, ucar). Tarif: TARIFLER.md. Kanatsiz, havada yuzen tombul lacivert balina; sirti gece gogu, acik mavi karin yuz alani.
# Bebek: tek yildiz fiskiyede. Genc: sirtta yildiz benekler, hilal kuyruk. Usta: cizgilerle bagli takimyildiz, kuyrukta altin halka, fiskiyede 3 yildiz.
# Renk: Lacivert (govde), Gok (karin), Sari (yildiz, altin halka). Yuz Gok karin yuzeyinde (duz).
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def yildiz(d, x, y, big=True, part='tepe', glint=True):
    if big:
        d.pix((x - 2, y - 2), ['..#..', '.###.', '#####', '.###.', '##.##'], {'#': 'Sari-2'}, part=part)
        if glint:
            d.pix((x - 1, y - 1), ['oo'], {'o': 'Parilti'}, part=part)
    else:
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part=part)


def benek(d, x, y, nm, r=1.1):
    d.circle('Sari', (x, y), r, clip=nm, tone=2)


def fiskiye(d, x, y, h=4):
    d.ellipse('Lacivert', (x, y), (2.2, 1.0), clip='kafa', shift=1)
    # kisa su/isik sutunu yildizi govdeye baglar
    d.capsule('Gok', (x, y), (x, y - h), (1.8, 1.2), part='tepe', line=True)


def fluke(d, x, y, s, base):
    # iki lobu hilal kuyruk yuzgeci; sap govdeden gelir
    d.curve('Lacivert', base + [(x, y)], (5.0 * s, 3.0 * s), part='kuyruk', line=True, name='k', lift=-0.05)
    d.ellipse('Lacivert', (x - 3.4 * s, y - 1.0 * s), (3.8 * s, 1.9 * s), rot=35, part='kuyruk', join='k')
    d.ellipse('Lacivert', (x + 3.4 * s, y - 1.0 * s), (3.8 * s, 1.9 * s), rot=-35, part='kuyruk', join='k')


def cene(d, cx, y, w):
    # karin pilileri (balina isareti)
    for k in range(2):
        d.capsule('Gok', (cx - w + k * 1.5, y + k * 2.4), (cx + w - k * 1.5, y + k * 2.4), 0.5, clip='karin', shift=1)


def bebek(d):
    d.flyer = True
    cx = 24
    fluke(d, 39.5, 29, 0.75, [(32, 42), (38, 41), (39.5, 35)])
    # yuzgecler
    d.ellipse('Lacivert', (10.5, 40), (3.8, 2.6), rot=30, part='kol_1', line=True)
    d.ellipse('Lacivert', (37.5, 40), (3.8, 2.6), rot=-30, part='kol_2', line=True)
    d.ellipse('Lacivert', (cx, 35), (14.5, 12), name='kafa', cast=1)
    d.ellipse('Gok', (cx, 38), (10.6, 7.8), name='karin', clip='kafa', shift=0)
    fiskiye(d, cx, 23.5, 4)
    yildiz(d, cx, 17)
    d.set_face(cx, 34, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    fluke(d, 47, 34, 0.95, [(40, 48), (46, 46), (47, 40)])
    d.ellipse('Lacivert', (11.5, 46), (4.4, 3), rot=30, part='kol_1', line=True)
    d.ellipse('Lacivert', (44.5, 46), (4.4, 3), rot=-30, part='kol_2', line=True)
    d.ellipse('Lacivert', (cx, 40), (17, 16), name='kafa', cast=1)
    d.ellipse('Gok', (cx, 45), (12.5, 10.5), name='karin', clip='kafa', shift=0)
    for x, y, r in ((17.5, 33, 1.0), (21, 29, 1.2), (35, 29.5, 1.1), (39, 35, 1.0), (15.5, 38.5, 0.9)):
        benek(d, x, y, 'kafa', r)
    d.pix((17, 28), ['oo'], {'o': 'Parilti'}, part='govde')
    fiskiye(d, cx, 24.5, 4)
    yildiz(d, cx, 17)
    d.set_face(cx, 38, gap=5)
    cene(d, cx, 51, 5)


def usta(d):
    d.flyer = True
    cx = 32
    fluke(d, 54, 34, 1.05, [(46, 56), (52, 54), (54, 44)])
    d.ellipse('Sari', (54, 44.5), (3.8, 2.4), part='kuyruk', line=True, lift=0.1, name='halka')
    d.pix((52, 43.5), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    d.ellipse('Lacivert', (12.5, 53), (5.2, 3.4), rot=30, part='kol_1', line=True)
    d.ellipse('Lacivert', (51.5, 53), (5.2, 3.4), rot=-30, part='kol_2', line=True)
    d.ellipse('Lacivert', (cx - 1, 46.5), (18, 20.8), name='kafa', cast=2)
    d.ellipse('Gok', (cx - 1, 53), (14, 13), name='karin', clip='kafa', shift=0)
    # takimyildiz: cizgiler + yildizlar
    pts = [(16, 42), (21, 35), (28, 32), (37, 33), (43, 38), (48, 45)]
    for a, b in zip(pts, pts[1:]):
        d.capsule('Sari', a, b, 1.3, clip='kafa', tone=3)
    for i, (x, y) in enumerate(pts):
        d.circle('Sari', (x, y), 1.5 if i % 2 == 0 else 1.1, clip='kafa', tone=2)
    d.pix((20, 34), ['oo'], {'o': 'Parilti'}, part='govde')
    d.pix((36, 32), ['oo'], {'o': 'Parilti'}, part='govde')
    fiskiye(d, cx - 1, 26, 4)
    yildiz(d, cx - 1, 17)
    yildiz(d, cx - 9, 22, big=False)
    yildiz(d, cx + 7, 22, big=False)
    d.set_face(cx - 1, 45, gap=6)
    cene(d, cx - 1, 59, 6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, havada yuzer
def balina_yan(d, s, ox, oy):
    """Bebek olcusunda tasarla, (24,44) capasi (ox,oy), olcek s. Kuyruk saga, fiskiye tepede."""
    P = lambda x, y: (ox + (x - 24) * s, oy + (y - 44) * s)
    # kuyruk: sap yukari kivrilir, hilal yuzgec
    d.curve('Lacivert', [P(33, 42), P(38, 41), P(40.5, 35)], (5.0 * s, 3.0 * s), part='kuyruk', line=True, name='k', lift=-0.05)
    d.ellipse('Lacivert', P(41.5, 31), (2.8 * s, 5.6 * s), rot=20, part='kuyruk', join='k')
    # uzak yuzgec
    d.ellipse('Lacivert', P(30, 49), (4.2 * s, 2.5 * s), rot=-35, part='kol_2', line=True, lift=-0.2)
    d.ellipse('Lacivert', P(22, 40), (14.5 * s, 11.5 * s), name='kafa', cast=1)
    d.ellipse('Gok', P(20, 46), (11.5 * s, 6 * s), name='karin', clip='kafa', shift=0)
    fiskiye_y(d, P(19, 29), s)
    d.ellipse('Lacivert', P(23, 48), (4.4 * s, 2.7 * s), rot=-30, part='kol_1', line=True)
    return P


def fiskiye_y(d, q, s):
    x, y = q
    d.ellipse('Lacivert', (x, y + 1), (2.2, 1.0), clip='kafa', shift=1)
    d.capsule('Gok', (x, y), (x, y - 4 * s), (1.8, 1.2), part='tepe', line=True)
    yildiz(d, x, y - 4 * s - 2)
    return x, y


def bebek_yan(d):
    d.flyer = True
    P = balina_yan(d, 1.0, 24, 44)
    d.set_face_side(12, 36)


def genc_yan(d):
    d.flyer = True
    P = balina_yan(d, 1.17, 26, 50)
    for x, y, r in ((24, 33, 1.5), (30, 32, 1.6), (35, 37, 1.4), (28, 39, 1.3)):
        benek(d, *P(x, y), 'kafa', r)
    d.pix(P(23, 33), ['oo'], {'o': 'Parilti'}, part='govde')
    cx, cy = P(10, 47)
    d.capsule('Gok', (cx, cy), (cx + 5, cy), 0.5, clip='karin', shift=1)
    d.set_face_side(14, 40)


def usta_yan(d):
    d.flyer = True
    P = balina_yan(d, 1.38, 26, 57)
    pts = [P(13, 38), P(19, 33.5), P(26, 32.5), P(32, 35), P(37, 38.5)]
    for a, b in zip(pts, pts[1:]):
        d.capsule('Sari', a, b, 1.3, clip='kafa', tone=3)
    for i, q in enumerate(pts):
        d.circle('Sari', q, 2.0 if i % 2 == 0 else 1.5, clip='kafa', tone=2)
    d.pix((round(pts[1][0]) - 1, round(pts[1][1]) - 1), ['oo'], {'o': 'Parilti'}, part='govde')
    q = P(40.5, 38)
    d.ellipse('Sari', q, (3.2, 2.4), part='kuyruk', line=True, lift=0.1)
    d.pix((round(q[0]) - 1, round(q[1]) - 1), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    fx, fy = P(19, 29)
    yildiz(d, fx - 8, fy - 8, big=False)
    yildiz(d, fx + 8, fy - 8, big=False)
    d.set_face_side(*[int(round(v / 2)) * 2 for v in P(10.5, 37)])


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
