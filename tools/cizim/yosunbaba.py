# Yosunbaba (Orman, epik). Tarif: TARIFLER.md. Uykulu bilge yosun topu dede: sakal, tepede minik bahce, tohum isigi.
# Renk: Cimen (yosun), Cam (sakal, yonca), Kahve (baston); cicek/mantar Krem. Parlak: Cimen -> Gok.
PARLA = 'Sari'


def yosun(d, cx, cy, rx, ry, tufts, name='kafa', cast=1, ticks=True):
    d.ellipse('Cimen', (cx, cy), (rx, ry), name=name, cast=cast, lift=0.04)
    for ang, r in tufts:
        import math
        a = math.radians(ang)
        d.circle('Cimen', (cx + math.cos(a) * rx * 0.96, cy + math.sin(a) * ry * 0.96), r, join=name)
    # yosun lekeleri
    for dx, dy, r in ((-0.45, -0.45, 2.4), (0.35, -0.6, 1.8), (0.62, 0.0, 1.6), (-0.7, 0.1, 1.4)):
        d.circle('Cimen', (cx + dx * rx, cy + dy * ry), r, clip=name, shift=-1)
    for dx, dy in (((-0.2, -0.78), (0.6, -0.3), (-0.75, -0.2)) if ticks else ()):
        d.capsule('Cimen', (cx + dx * rx, cy + dy * ry), (cx + dx * rx + 1.5, cy + dy * ry + 2.5), 1.0, clip=name, shift=1)


def yonca(d, cx, cy, r=2.4, part='tepe'):
    d.capsule('Cam', (cx, cy + 2), (cx, cy + 5), 1.0, part=part, line=True)
    for dx, dy in ((-r, 0), (r, 0), (0, -r)):
        d.circle('Cam', (cx + dx, cy + dy), r * 0.95, part=part, line=True, name='y%d%d' % (dx, dy) if False else None)


def bebek(d):
    yosun(d, 24, 34, 12.8, 11.8, ((-150, 2.8), (-110, 2.8), (-70, 2.8), (-30, 2.8), (160, 2.2), (20, 2.2)))
    # cenede minik sakal tutami
    d.ellipse('Cam', (24, 44.5), (3.4, 3.2), name='sakal', line=True, cast=1)
    d.capsule('Cam', (22.3, 45), (22.3, 47.6), 1.1, clip='sakal', shift=1)
    d.capsule('Cam', (25.8, 45), (25.8, 47.6), 1.1, clip='sakal', shift=1)
    # tepede tek yonca
    d.capsule('Cam', (24, 24), (24, 18), 1.1, part='tepe', line=True)
    d.circle('Cam', (19.8, 18.5), 2.8, part='tepe', line=True, lift=0.1)
    d.circle('Cam', (28.2, 18.5), 2.8, part='tepe', line=True, lift=0.1)
    d.circle('Cam', (24, 14), 2.8, part='tepe', line=True, lift=0.1)
    d.pix((23, 12.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    # minik kollar
    d.ellipse('Cimen', (11.2, 40), (2.6, 3.6), rot=15, part='kol_1', line=True)
    d.ellipse('Cimen', (36.8, 40), (2.6, 3.6), rot=-15, part='kol_2', line=True)
    d.set_face(24, 31, gap=5)


def mantar(d, cx, cy, r, part='tepe'):
    n = 'm%d' % int(cx)
    d.capsule('Krem', (cx, cy), (cx, cy + 3.5), 1.5, part=part, line=True)
    d.ellipse('Kahve', (cx, cy - 0.5), (r, r * 0.85), inbox=(0, 0, 63, int(cy)), part=part, name=n, line=True)
    d.ellipse('Kahve', (cx, cy), (r + 0.4, 0.9), part=part, join=n)
    d.circle('Krem', (cx - r * 0.3, cy - r * 0.45), max(1.0, r * 0.28), part=part, clip=n, shift=-2)


def genc(d):
    # dal baston (sol elde)
    d.capsule('Kahve', (47, 54), (46, 31), 1.7, part='esya', name='baston', line=True)
    d.circle('Kahve', (46, 30.5), 2.1, part='esya', join='baston')
    yosun(d, 28, 39, 15.5, 13, ((-155, 3.2), (-120, 3.4), (-85, 3.4), (-50, 3.4), (-20, 3.2), (165, 2.6), (15, 2.6)), cast=2)
    # uzun sakal: gogse iner
    d.ellipse('Cam', (28, 49), (8.4, 4.6), name='sakal', line=True, cast=1, lift=0.1)
    d.capsule('Cam', (28, 50), (28, 57), (9, 2.6), join='sakal')
    for x, y0, y1, t in ((24.5, 46, 51, -1), (28, 47, 56, 1), (31.5, 46, 51, -1)):
        d.capsule('Cam', (x, y0), (x, y1), 1.0, clip='sakal', shift=t)
    # tepede iki mantar ve minik cicek
    mantar(d, 22, 24.5, 3.6)
    mantar(d, 35, 25.5, 3.0)
    d.capsule('Cam', (29, 25), (29, 22), 1.0, part='tepe', line=True)
    d.circle('Krem', (29, 20.5), 1.7, part='tepe', line=True)
    d.pix((28, 20), ['oo'], {'o': 'Parilti'}, part='tepe')
    # eğrelti kaslari (yuz alaninin ustunde)
    d.capsule('Cam', (19.5, 32), (23.5, 31.2), (1.1, 1.5), part='govde', line=False)
    d.capsule('Cam', (32.5, 31.2), (36.5, 32), (1.5, 1.1), part='govde', line=False)
    # kollar
    d.ellipse('Cimen', (11.5, 46), (3, 4), rot=15, part='kol_1', line=True)
    d.ellipse('Cimen', (44.5, 43), (3, 3.6), rot=-15, part='kol_2', line=True)
    d.set_face(28, 34, gap=5)


def usta(d):
    # baston: ucunda parlayan tohum
    d.capsule('Kahve', (55, 60), (54, 22), 2.0, part='esya', name='baston', line=True)
    d.ellipse('Krem', (54, 17.5), (3.0, 4.0), part='esya', line=True, lift=0.3)
    d.pix((53, 15), ['ooo', 'oo.'], {'o': 'Parilti'}, part='esya')
    yosun(d, 32, 40, 21, 17.5, ((-160, 4), (-135, 4.4), (-110, 4.4), (-85, 4.4), (-60, 4.4), (-35, 4.2), (-15, 3.6), (170, 3.4), (15, 3.4)), cast=2)
    # yere degen sakal
    d.ellipse('Cam', (32, 54), (11.5, 5.2), name='sakal', line=True, cast=1, lift=0.1)
    d.capsule('Cam', (32, 55), (32, 62), (13, 2.8), join='sakal')
    for x, y0, y1, t in ((25.5, 51, 56, -1), (28.5, 52, 59, 1), (32, 56, 61, -1), (35.5, 52, 59, 1), (38.5, 51, 56, -1)):
        d.capsule('Cam', (x, y0), (x, y1), 1.0, clip='sakal', shift=t)
    # tepede bahce: cicekler ve mantarlar
    d.ellipse('Cimen', (31, 24.5), (11, 4.2), name='bahce', part='tepe', line=True, lift=0.1)
    mantar(d, 24, 19.5, 4.4)
    mantar(d, 39, 20.5, 3.6)
    for x, y in ((31.5, 15), (35, 18.5), (19, 21)):
        d.capsule('Cam', (x, y + 2), (x, y + 6), 1.0, part='tepe', line=True)
        d.circle('Krem', (x, y), 2.2, part='tepe', line=True)
    d.pix((31, 14), ['oo'], {'o': 'Parilti'}, part='tepe')
    # kaslar
    d.capsule('Cam', (22, 34.5), (28, 33.5), (1.2, 1.6), part='govde')
    d.capsule('Cam', (36, 33.5), (42, 34.5), (1.6, 1.2), part='govde')
    # kollar (soldaki baston tutar)
    d.ellipse('Cimen', (13, 52), (3.8, 4.6), rot=15, part='kol_1', line=True)
    d.ellipse('Cimen', (53, 50), (3.6, 4.2), rot=-15, part='kol_2', line=True)
    d.set_face(32, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yosun topu
def bebek_yan(d):
    yosun(d, 27, 34, 12.8, 11.8, ((-150, 2.8), (-110, 2.8), (-70, 2.8), (-30, 2.8), (165, 2.2), (20, 2.2)), ticks=False)
    d.ellipse('Cam', (16, 44.5), (3.6, 3.4), name='sakal', line=True, cast=1)
    d.capsule('Cam', (15, 45), (15, 47.6), 1.1, clip='sakal', shift=1)
    d.capsule('Cam', (18, 45), (18, 47.6), 1.1, clip='sakal', shift=1)
    d.capsule('Cam', (27, 24), (28, 18), 1.1, part='tepe', line=True)
    d.circle('Cam', (23.8, 18.5), 2.8, part='tepe', line=True, lift=0.1)
    d.circle('Cam', (32.2, 18.5), 2.8, part='tepe', line=True, lift=0.1)
    d.circle('Cam', (28, 14), 2.8, part='tepe', line=True, lift=0.1)
    d.pix((27, 12.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.ellipse('Cimen', (24, 41), (2.8, 3.6), rot=-15, part='kol_1', line=True)
    d.set_face_side(16, 30)


def genc_yan(d):
    d.capsule('Kahve', (14, 56), (13, 33), 1.7, part='esya', name='baston', line=True)
    d.circle('Kahve', (13, 32.5), 2.1, part='esya', join='baston')
    yosun(d, 30, 39, 15.5, 13, ((-155, 3.2), (-120, 3.4), (-85, 3.4), (-50, 3.4), (-20, 3.2), (165, 2.6), (15, 2.6)), cast=2, ticks=False)
    d.ellipse('Cam', (19, 49), (6.4, 5.0), name='sakal', line=True, cast=1, lift=0.1)
    d.capsule('Cam', (19, 50), (19, 57), (6.6, 2.6), join='sakal')
    for x, y0, y1, t in ((16.5, 47, 53, -1), (19.5, 48, 56, 1), (22.5, 47, 53, -1)):
        d.capsule('Cam', (x, y0), (x, y1), 1.0, clip='sakal', shift=t)
    mantar(d, 28, 24.5, 3.6)
    mantar(d, 37, 25.5, 3.0)
    d.capsule('Cam', (32, 25), (32, 22), 1.0, part='tepe', line=True)
    d.circle('Krem', (32, 20.5), 1.7, part='tepe', line=True)
    d.pix((31, 20), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.capsule('Cam', (18, 33), (23, 31.8), (1.1, 1.5), part='govde', line=False)
    d.ellipse('Cimen', (25, 46), (3.4, 4), rot=-15, part='kol_1', line=True)
    d.set_face_side(18, 35)


def usta_yan(d):
    d.capsule('Kahve', (12, 61), (11, 23), 2.0, part='esya', name='baston', line=True)
    d.ellipse('Krem', (11, 18.5), (3.0, 4.0), part='esya', line=True, lift=0.3)
    d.pix((10, 16), ['ooo', 'oo.'], {'o': 'Parilti'}, part='esya')
    yosun(d, 34, 40, 21, 17.5, ((-160, 4), (-135, 4.4), (-110, 4.4), (-85, 4.4), (-60, 4.4), (-35, 4.2), (-15, 3.6), (170, 3.4), (15, 3.4)), cast=2, ticks=False)
    d.ellipse('Cam', (20, 54), (7.5, 5.6), name='sakal', line=True, cast=1, lift=0.1)
    d.capsule('Cam', (20, 55), (20, 62), (8.6, 2.8), join='sakal')
    for x, y0, y1, t in ((16.5, 51, 56, -1), (20, 52, 59, 1), (23.5, 51, 56, -1)):
        d.capsule('Cam', (x, y0), (x, y1), 1.0, clip='sakal', shift=t)
    d.ellipse('Cimen', (33, 24.5), (11, 4.2), name='bahce', part='tepe', line=True, lift=0.1)
    mantar(d, 27, 19.5, 4.4)
    mantar(d, 41, 20.5, 3.6)
    for x, y in ((34, 15), (37.5, 18.5), (22, 21)):
        d.capsule('Cam', (x, y + 2), (x, y + 6), 1.0, part='tepe', line=True)
        d.circle('Krem', (x, y), 2.2, part='tepe', line=True)
    d.pix((33, 14), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.capsule('Cam', (18, 34.5), (24, 33.5), (1.2, 1.6), part='govde')
    d.ellipse('Cimen', (22, 52), (3.8, 4.6), rot=-15, part='kol_1', line=True)
    d.set_face_side(18, 38)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
