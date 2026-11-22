# Takimyildiz Geyigi (Yildiz, nadir). Tarif: TARIFLER.md. Gece mavisi ince geyik yavrusu; boynuzlari kemik degil, yildizlari baglayan isik cizgileri.
# Renk: Lacivert (tuy), Sari (yildizlar, gogus hilali), Gok (cizgi boynuz, kulak ici). Aurora Geyigi'nden farki: koyu, ince cizgi boynuz, yildiz dugumleri.
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def yildiz(d, x, y, big=True):
    if big:
        d.pix((x - 2, y - 2), ['..#..', '.#o#.', '##o##', '.###.', '..#..'][:5] if False else
              ['..#..', '.###.', '##o##', '.###.', '..#..'], {'#': 'Sari-2', 'o': 'Parilti'}, part='tepe')
    else:
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='tepe')


def cizgi(d, pts, w=1.9):
    for a, b in zip(pts, pts[1:]):
        d.capsule('Gok', a, b, w, part='tepe', noshadow=True)


def kulaklar(d, cx, y, dx, rot):
    for s, p in ((-1, 'kulak_1'), (1, 'kulak_2')):
        n = 'e%d' % s
        d.ellipse('Lacivert', (cx + s * dx, y), (5.2, 2.8), rot=s * rot, part=p, name=n, line=True, lift=0.1)
        d.ellipse('Gok', (cx + s * (dx + 0.3), y + 0.3), (3.2, 1.3), rot=s * rot, part=p, clip=n, tone=2)


def govdeler(d, cx, hy, hrx, hry, by, brx, bry, leg, spots):
    d.ellipse('Lacivert', (cx, by), (brx, bry), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (cx, hy), (hrx, hry), name='h', join='g', lift=0.1)
    d.ellipse('Lacivert', (cx, by + bry - 1.5), (brx - 2, 2.4), clip='g', shift=1)
    for x, y in spots:
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')


def bebek(d):
    cx = 24
    kulaklar(d, cx, 28, 12, 22)
    d.ellipse('Lacivert', (cx, 43), (9.4, 6.4), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (cx, 32.5), (12, 10), name='h', join='g', lift=0.1)
    d.capsule('Lacivert', (cx - 5, 45), (cx - 5, 47.5), 4.4, part='kol_1', line=True, lift=0.05)
    d.capsule('Lacivert', (cx + 5, 45), (cx + 5, 47.5), 4.4, part='kol_2', line=True, lift=0.05)
    d.pix((cx + 7, 41), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    d.pix((cx - 9, 44), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    d.pix((cx - 3, 23), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    yildiz(d, cx, 20)
    d.set_face(cx, 30, gap=5)


def genc(d):
    cx = 28
    for s in (-1, 1):
        P = [(cx + s * 5, 30), (cx + s * 8, 23)]
        cizgi(d, [P[0], P[1], (cx + s * 12, 15)])
        cizgi(d, [P[1], (cx + s * 17, 20)])
    for s in (-1, 1):
        for x, y in ((8, 23), (12, 15), (17, 20)):
            yildiz(d, cx + s * x, y)
    kulaklar(d, cx, 33, 14, 22)
    d.ellipse('Lacivert', (cx, 49), (11, 8), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (cx, 38), (13.4, 11.4), name='h', join='g', lift=0.1)
    d.capsule('Lacivert', (cx - 6, 52), (cx - 6, 55), 4.8, part='kol_1', line=True, lift=0.05)
    d.capsule('Lacivert', (cx + 6, 52), (cx + 6, 55), 4.8, part='kol_2', line=True, lift=0.05)
    for x, y in ((cx + 9, 47), (cx - 10, 50), (cx + 3, 44)):
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    d.set_face(cx, 36, gap=5)


def usta(d):
    cx = 32
    for s in (-1, 1):
        base = (cx + s * 7, 31)
        A, B, C = (cx + s * 10, 26), (cx + s * 12, 19), (cx + s * 16, 13)
        D, E = (cx + s * 20, 25), (cx + s * 25, 19)
        cizgi(d, [base, A, B, C])
        cizgi(d, [A, D, E])
    for s in (-1, 1):
        for x, y in ((10, 26), (12, 19), (16, 13), (20, 25), (25, 19)):
            yildiz(d, cx + s * x, y)
    kulaklar(d, cx, 36, 16, 22)
    d.ellipse('Lacivert', (cx, 57), (12.4, 11), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (cx, 41), (14.6, 13), name='h', join='g', lift=0.1)
    d.capsule('Lacivert', (cx - 7, 62), (cx - 7, 65.5), 5.2, part='kol_1', line=True, lift=0.05)
    d.capsule('Lacivert', (cx + 7, 62), (cx + 7, 65.5), 5.2, part='kol_2', line=True, lift=0.05)
    # gogusta sari hilal
    d.circle('Sari', (cx, 57), 4.4, part='govde', name='hl', line=True)
    d.circle('Sari', (cx + 2.6, 56), 3.8, part='govde', sub='hl')
    d.pix((cx - 3, 55), ['oo'], {'o': 'Parilti'}, part='govde')
    for x, y in ((cx + 11, 54), (cx - 12, 60), (cx + 12, 62)):
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    d.set_face(cx, 41, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
