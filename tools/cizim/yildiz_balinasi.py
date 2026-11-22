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
        d.capsule('Sari', a, b, 1.0, clip='kafa', tone=3)
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
