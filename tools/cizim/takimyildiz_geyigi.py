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


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def kulak_yan(d, x, y, part, rot=-22, lift=0.1):
    n = 'e' + part[-1]
    d.ellipse('Lacivert', (x, y), (5.4, 2.9), rot=rot, part=part, name=n, line=True, lift=lift)
    d.ellipse('Gok', (x - 0.3, y + 0.3), (3.2, 1.3), rot=rot, part=part, clip=n, tone=2)


def cizgi_yan(d, pts, w=1.9, lift=0.0):
    for a, b in zip(pts, pts[1:]):
        d.capsule('Gok', a, b, w, part='tepe', noshadow=True, lift=lift)


def boynuz_yan(d, main, branch, dx, dy, lift):
    """Bir boynuz: main = ana cizgi noktalari, branch = dal (ilk nokta main'de). Uzak boynuz (dx,dy) kayik, koyu."""
    cizgi_yan(d, [(x + dx, y + dy) for x, y in main], lift=lift)
    cizgi_yan(d, [(x + dx, y + dy) for x, y in branch], lift=lift)


def bebek_yan(d):
    kulak_yan(d, 29, 29, 'kulak_2', -22, -0.08)
    d.capsule('Lacivert', (35, 41), (38, 38), (3, 2), part='kuyruk', line=True, lift=0.05)
    d.capsule('Lacivert', (32, 45), (32, 47.5), 4.4, part='kol_2', line=True, lift=-0.05)
    d.ellipse('Lacivert', (28, 43), (9.8, 6.4), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (21, 33), (11.6, 9.6), name='h', join='g', lift=0.1)
    d.ellipse('Lacivert', (12, 36.5), (3.4, 3), join='g', lift=0.1)
    d.pix2((5, 18), ['#'], {'#': 'Komur-4'})
    d.pix((33, 40), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    d.pix((24, 44), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    kulak_yan(d, 26, 28, 'kulak_1')
    d.capsule('Lacivert', (20, 45), (20, 47.5), 4.4, part='kol_1', line=True, lift=0.05)
    d.pix((19, 17), ['..#..', '.###.', '##o##', '.###.', '..#..'], {'#': 'Sari-2', 'o': 'Parilti'}, part='tepe')
    d.set_face_side(14, 30)


def genc_yan(d):
    M = [(26, 31), (29, 23), (32, 14)]
    B = [(29, 23), (39, 20)]
    boynuz_yan(d, M, B, 9, 1, -0.14)
    yildiz(d, 32 + 9, 15, False)
    yildiz(d, 39 + 9, 21, False)
    boynuz_yan(d, M, B, 0, 0, 0.0)
    yildiz(d, 29, 23, False)
    yildiz(d, 32, 14)
    yildiz(d, 39, 20)
    kulak_yan(d, 31, 34, 'kulak_2', -22, -0.08)
    d.capsule('Lacivert', (41, 47), (44, 43), (3.4, 2.2), part='kuyruk', line=True, lift=0.05)
    d.capsule('Lacivert', (38, 52), (38, 55), 4.8, part='kol_2', line=True, lift=-0.05)
    d.ellipse('Lacivert', (33, 49), (11.6, 8), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (24, 38), (13.4, 11.4), name='h', join='g', lift=0.1)
    d.ellipse('Lacivert', (13, 42), (4, 3.4), join='g', lift=0.1)
    d.pix2((6, 21), ['#'], {'#': 'Komur-4'})
    for x, y in ((38, 46), (31, 52), (26, 44)):
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    kulak_yan(d, 29, 33, 'kulak_1')
    d.capsule('Lacivert', (22, 52), (22, 55), 4.8, part='kol_1', line=True, lift=0.05)
    d.set_face_side(16, 36)


def usta_yan(d):
    M = [(25, 32), (27, 26), (29, 19), (31, 12)]
    B = [(27, 26), (37, 24), (43, 17)]
    boynuz_yan(d, M, B, 10, 1, -0.14)
    yildiz(d, 31 + 10, 13, False)
    yildiz(d, 43 + 10, 18, False)
    boynuz_yan(d, M, B, 0, 0, 0.0)
    yildiz(d, 27, 26, False)
    yildiz(d, 31, 12)
    yildiz(d, 37, 24, False)
    yildiz(d, 43, 17)
    kulak_yan(d, 34, 37, 'kulak_2', -22, -0.08)
    d.capsule('Lacivert', (50, 53), (53, 48), (3.8, 2.4), part='kuyruk', line=True, lift=0.05)
    d.capsule('Lacivert', (46, 62), (46, 65.5), 5.2, part='kol_2', line=True, lift=-0.05)
    d.ellipse('Lacivert', (38, 56), (15, 11), name='g', cast=1, lift=0.08)
    d.ellipse('Lacivert', (25, 42), (14.6, 13), name='h', join='g', lift=0.1)
    d.ellipse('Lacivert', (24, 54), (8, 8), join='g')
    d.ellipse('Lacivert', (13, 46), (4.4, 3.6), join='g', lift=0.1)
    d.pix2((6, 23), ['#'], {'#': 'Komur-4'})
    d.circle('Sari', (22, 56), 5, part='govde', name='hl', line=True)
    d.circle('Sari', (24.8, 55), 4.3, part='govde', sub='hl')
    d.pix((18, 54), ['oo'], {'o': 'Parilti'}, part='govde')
    for x, y in ((43, 54), (36, 61), (49, 59)):
        d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')
    kulak_yan(d, 31, 36, 'kulak_1')
    d.capsule('Lacivert', (24, 62), (24, 65.5), 5.2, part='kol_1', line=True, lift=0.05)
    d.set_face_side(16, 39)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
