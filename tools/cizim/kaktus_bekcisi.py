# Kaktus Bekcisi (Orman, siradan). Tarif: TARIFLER.md. Saksida dogmus ciddi ama tatli kaktus; saksi once ev, sonra kask/omuzluk olur.
# Renk: Cimen (kaktus), Turuncu (saksi), Pembe (cicek); noktamsi dikenler Krem. Parlak: Cimen -> Mor.
PARLA = 'Pembe'


def dikenler(d, pts, part='govde'):
    for x, y in pts:
        d.pix((x, y), ['#', '#'], {'#': 'Krem-2'}, part=part)


def cicek(d, cx, cy, r, part='tepe'):
    """bes yaprakli pembe cicek, ortasi krem."""
    import math
    for k in range(5):
        a = -math.pi / 2 + k * 2 * math.pi / 5
        d.circle('Pembe', (cx + math.cos(a) * r * 0.95, cy + math.sin(a) * r * 0.95), r * 0.72, part=part, line=True)
    d.circle('Krem', (cx, cy), r * 0.55, part=part)


def bebek(d):
    # saksi
    d.poly('Turuncu', [(14.5, 43), (33.5, 43), (31, 51.5), (17, 51.5)], name='saksi', cast=1, line=True)
    d.capsule('Turuncu', (20, 46), (28, 46), 1.0, clip='saksi', shift=-1)
    d.rect('Turuncu', (12, 40, 36, 44), rad=1.5, name='agiz', line=True, lift=0.08, cast=1)
    # kaktus topu
    d.ellipse('Cimen', (24, 34), (12.6, 10.6), name='kafa', cast=1)
    d.capsule('Cimen', (24, 25), (24, 41), 1.0, clip='kafa', shift=-1) if False else None
    d.rect('Turuncu', (12, 40, 36, 44), rad=1.5, name='agiz2', line=True, lift=0.08)
    dikenler(d, [(15, 29), (19, 25), (29, 25), (33, 29), (14, 36), (34, 36), (24, 24)])
    # tomurcuk
    d.capsule('Cimen', (24, 24), (24, 20), 2.2, part='tepe')
    d.ellipse('Pembe', (24, 17.5), (3.6, 4.4), part='tepe', line=True, name='tomurcuk')
    d.capsule('Pembe', (23, 15), (25, 18), 1.0, part='tepe', clip='tomurcuk', shift=1)
    d.set_face(24, 30, gap=5)


def genc(d):
    cx = 28
    d.ellipse('Cimen', (28, 40.5), (14, 14.6), name='kafa', cast=1)
    # kaktus kollari: yana, sonra yukari
    for side in (1, 2):
        m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
        d.curve('Cimen', [m((17, 43)), m((10, 43)), m((8.5, 35))], (5.0, 4.6), part='kol_%d' % side, line=True)
        for x, y in ((7, 33), (10, 36)):
            d.pix(m((x, y)), ['#', '#'], {'#': 'Krem-2'}, part='kol_%d' % side)
    # kirik saksi parcalari omuzluk
    for side in (1, 2):
        m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
        nm = 'omuz%d' % side
        d.poly('Turuncu', [m((11, 36)), m((17, 31)), m((20, 35)), m((17, 40)), m((12, 40))], name=nm, line=True, cast=1)
        d.capsule('Turuncu', m((12, 37)), m((16.5, 33.5)), 1.0, clip=nm, shift=-1)
        d.pix(m((17, 36)), ['#.#'], {'#': 'Turuncu-4'}) if False else None
    # ayaklar
    d.ellipse('Cimen', (20.5, 54), (4.4, 2.8), line=True)
    d.ellipse('Cimen', (35.5, 54), (4.4, 2.8), line=True)
    dikenler(d, [(23, 30), (33, 30), (28, 28), (18, 46), (38, 46), (21, 50), (35, 50)])
    # acmis cicek
    d.capsule('Cimen', (28, 29), (28, 23), 2.4, part='tepe')
    cicek(d, 28, 19, 4.4)
    d.set_face(28, 36, gap=5)


def usta(d):
    cx = 32
    d.ellipse('Cimen', (32, 46.5), (14.5, 14), name='govde', cast=1)
    # kollar: yana ve yukari kivrik, ucunda minik cicek
    for side in (1, 2):
        m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
        d.curve('Cimen', [m((19, 51)), m((10, 51)), m((8, 38)), m((9, 31))], (6.2, 5.2), part='kol_%d' % side, line=True)
        for x, y in ((6.5, 42), (10, 46), (7, 36)):
            d.pix(m((x, y)), ['#', '#'], {'#': 'Krem-2'}, part='kol_%d' % side)
        # kol ucundaki cicek
        import math
        mx, my = m((9, 30.5))
        for k in range(5):
            a = -math.pi / 2 + k * 2 * math.pi / 5
            d.circle('Pembe', (mx + math.cos(a) * 2.3, my + math.sin(a) * 2.3), 1.7, part='kol_%d' % side, line=True)
        d.circle('Krem', (mx, my), 1.3, part='kol_%d' % side)
    # ters saksi miger
    d.poly('Turuncu', [(16, 31), (48, 31), (44, 19), (20, 19)], name='kask', part='govde', cast=1, line=True, lift=0.05)
    d.rect('Turuncu', (13, 28, 51, 33), rad=2, part='govde', name='kenar', line=True, lift=0.1, cast=2)
    d.capsule('Turuncu', (22, 23), (42, 23), 1.0, part='govde', clip='kask', shift=1)
    d.capsule('Turuncu', (21, 20.5), (30, 20.5), 1.0, part='govde', clip='kask', shift=-1)
    d.rect('Turuncu', (28, 15, 36, 19), rad=1.2, part='govde', line=True, lift=0.05)
    dikenler(d, [(20, 37), (44, 37), (17, 44), (47, 44), (22, 56), (42, 56), (32, 58)])
    # kaskin yaninda buyuk cicek
    import math
    fx, fy = 46, 21
    for k in range(5):
        a = -math.pi / 2 + k * 2 * math.pi / 5
        d.circle('Pembe', (fx + math.cos(a) * 3.6, fy + math.sin(a) * 3.6), 2.7, part='govde', line=True)
    d.circle('Krem', (fx, fy), 2.2, part='govde')
    d.set_face(32, 37, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}

# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken

def bebek_yan(d):
    d.poly('Turuncu', [(14.5, 43), (33.5, 43), (31, 51.5), (17, 51.5)], name='saksi', cast=1, line=True)
    d.capsule('Turuncu', (20, 46), (28, 46), 1.0, clip='saksi', shift=-1)
    d.ellipse('Cimen', (22, 34), (12.6, 10.6), name='kafa', cast=1)
    d.rect('Turuncu', (12, 40, 36, 44), rad=1.5, name='agiz', line=True, lift=0.08, cast=1)
    dikenler(d, [(26, 25), (31, 28), (34, 34), (30, 38)])
    d.capsule('Cimen', (25, 24), (26, 20), 2.2, part='tepe')
    d.ellipse('Pembe', (26.5, 17.5), (3.6, 4.4), part='tepe', line=True, name='tomurcuk')
    d.capsule('Pembe', (25.5, 15), (27.5, 18), 1.0, part='tepe', clip='tomurcuk', shift=1)
    d.set_face_side(14, 30)


def genc_yan(d):
    d.ellipse('Cimen', (28, 41), (14, 14.6), name='kafa', cast=1)
    d.ellipse('Cimen', (21, 54), (4.4, 2.8), part='kol_1', line=True)
    d.ellipse('Cimen', (35, 54), (4.4, 2.8), part='kol_2', line=True)
    # yakin kol: yukari kivrik, omuzluk kirik saksi
    d.curve('Cimen', [(30, 45), (24, 46), (22, 38)], (5.0, 4.6), line=True)
    d.poly('Turuncu', [(25, 36), (31, 31), (34, 35), (31, 40), (26, 40)], name='omuz', line=True, cast=1)
    d.capsule('Turuncu', (26, 37), (30.5, 33.5), 1.0, clip='omuz', shift=-1)
    dikenler(d, [(36, 33), (40, 39), (38, 47), (22, 28)])
    d.capsule('Cimen', (31, 29), (32, 23), 2.4, part='tepe')
    cicek(d, 32, 19, 4.4)
    d.set_face_side(16, 36)


def usta_yan(d):
    import math
    d.ellipse('Cimen', (33, 47), (14.5, 13), name='govde', cast=1)
    d.ellipse('Cimen', (25, 60), (4.8, 3.0), part='kol_1', line=True)
    d.ellipse('Cimen', (41, 60), (4.8, 3.0), part='kol_2', line=True)
    # yakin kol: yukari kivrik, ucunda minik cicek
    d.curve('Cimen', [(30, 52), (37, 55), (45, 50), (46, 42)], (6.0, 5.0), line=True)
    for k in range(5):
        a = -math.pi / 2 + k * 2 * math.pi / 5
        d.circle('Pembe', (46 + math.cos(a) * 2.3, 39 + math.sin(a) * 2.3), 1.7, line=True)
    d.circle('Krem', (46, 39), 1.3)
    # ters saksi miger (one egik)
    d.poly('Turuncu', [(20, 33), (47, 33), (44, 21), (24, 21)], name='kask', cast=1, line=True, lift=0.05)
    d.rect('Turuncu', (17, 30, 50, 35), rad=2, name='kenar', line=True, lift=0.1, cast=2)
    d.capsule('Turuncu', (27, 25), (42, 25), 1.0, clip='kask', shift=1)
    d.capsule('Turuncu', (26, 22.5), (34, 22.5), 1.0, clip='kask', shift=-1)
    d.rect('Turuncu', (32, 17, 39, 21), rad=1.2, line=True, lift=0.05)
    fx, fy = 45, 24
    for k in range(5):
        a = -math.pi / 2 + k * 2 * math.pi / 5
        d.circle('Pembe', (fx + math.cos(a) * 3.6, fy + math.sin(a) * 3.6), 2.7, line=True)
    d.circle('Krem', (fx, fy), 2.2)
    dikenler(d, [(26, 55), (44, 58), (36, 58)])
    d.set_face_side(20, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
