# Taskabuk (Tas, siradan). Tarif: TARIFLER.md. Kabugu icinde kristal dolu bir tas (jeot) olan kaplumbaga.
# Renk: Tas (kabuk), Cam (kafa/ten), Mor (kristal). Kabuk govde, kafa part='kafa' (yuz kafada).
PARLA = 'Mor'


def bebek(d):
    # yumurta gibi duz kabuk, genis kubbe
    d.ellipse('Tas', (25, 27), (14, 11), name='kabuk', lift=0.04, cast=1)
    d.ellipse('Tas', (19, 21), (3.6, 2.2), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (33, 30), 2.4, clip='kabuk', shift=1)
    d.circle('Tas', (30.5, 21.5), 1.4, clip='kabuk', shift=1)
    d.ellipse('Cam', (14, 38), (3.4, 2.8), part='kol_1', line=True)
    d.ellipse('Cam', (35.5, 38), (3.4, 2.8), part='kol_2', line=True)
    # kabugun altindan bakan kafa
    d.ellipse('Cam', (24, 34.5), (10.6, 8.4), part='kafa', name='kafa', lift=0.04, cast=1)
    d.set_face(24, 31, gap=5)


def genc(d):
    d.ellipse('Tas', (30, 27), (17, 12.5), name='kabuk', lift=0.03, cast=1)
    d.ellipse('Tas', (20, 21), (4.2, 2.4), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (42, 31), 2.6, clip='kabuk', shift=1)
    # catlak: kabugun ustunden asagi zikzak, icinde mor kristaller
    d.poly('Mor', [(26, 16), (35, 16), (35, 20), (33, 22), (34, 26), (31, 24), (30, 28), (29, 23), (27, 21)], name='catlak', clip='kabuk', tone=3)
    d.capsule('Mor', (27.5, 20), (26.5, 14), 4.2, name='k1', line=True)
    d.capsule('Mor', (34, 20), (37, 14.5), 3.8, name='k2', line=True)
    d.capsule('Mor', (31, 21), (31, 12), 3.8, name='k3', line=True)
    d.rect('Mor', (27, 15, 27, 18), clip='k1', shift=-1)
    d.ellipse('Cam', (14, 41), (3.6, 3.0), part='kol_1', line=True)
    d.ellipse('Cam', (43, 41), (3.6, 3.0), part='kol_2', line=True)
    d.ellipse('Cam', (26, 37), (11, 8.6), part='kafa', name='kafa', lift=0.04, cast=1)
    d.set_face(26, 34, gap=5)


def usta(d):
    d.ellipse('Tas', (32, 33), (20, 12.5), name='kabuk', lift=0.03, cast=1)
    d.ellipse('Tas', (21, 28), (4.6, 2.4), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (46, 38), 2.8, clip='kabuk', shift=1)
    d.circle('Tas', (45, 29), 1.6, clip='kabuk', shift=1)
    # ustu acik oyuk, icinde buyuk mor kristaller
    d.ellipse('Mor', (32, 24.5), (13.5, 5.2), name='oyuk', line=True, lift=-0.1)
    # sivri uclu, farkli boy ve acida kristal kumesi (tac gibi sira olmasin: solda buyuk kume, sagda tek kucuk)
    def kr(n, bx, by, ang, L, w):
        import math
        t = math.radians(ang); sx, sy = math.sin(t), -math.cos(t); px, py = -sy, sx
        tip = (bx + sx * L, by + sy * L); mid = (bx + sx * (L - w * 0.9), by + sy * (L - w * 0.9))
        pts = [(bx - px * w / 2, by - py * w / 2), (mid[0] - px * w / 2, mid[1] - py * w / 2), tip,
               (mid[0] + px * w / 2, mid[1] + py * w / 2), (bx + px * w / 2, by + py * w / 2)]
        d.poly('Mor', pts, name=n, line=True)
        d.poly('Mor', [(bx, by), (mid[0], mid[1]), tip, (mid[0] + px * w / 2, mid[1] + py * w / 2), (bx + px * w / 2, by + py * w / 2)], clip=n, shift=1)
    kr('k1', 24, 26, -28, 9, 4.6)
    kr('k2', 29, 26, -6, 15, 6.0)
    kr('k3', 34, 26, 14, 10, 4.8)
    kr('k4', 42, 26, 32, 6, 3.6)
    d.ellipse('Mor', (32, 26.5), (13, 3.4), name='oyuk2', line=True, lift=0.1)
    d.pix((27, 16), ['oo'], {'o': 'Parilti'})
    # tas plakali ayaklar
    d.ellipse('Cam', (14, 46), (4.4, 3.2), part='kol_1', line=True)
    d.ellipse('Cam', (51, 46), (4.4, 3.2), part='kol_2', line=True)
    d.ellipse('Tas', (14, 48.5), (5, 2.2), part='kol_1', line=True, name='pl1')
    d.ellipse('Tas', (51, 48.5), (5, 2.2), part='kol_2', line=True, name='pl2')
    d.ellipse('Cam', (32, 42), (12.5, 9.2), part='kafa', name='kafa', lift=0.04, cast=1)
    d.set_face(32, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (sola bakar)
def bebek_yan(d):
    d.ellipse('Cam', (31, 40), (3.2, 2.4), part='kol_2', line=True)
    d.ellipse('Tas', (29, 28), (15, 12), name='kabuk', lift=0.04, cast=1)
    d.ellipse('Tas', (22, 21), (4, 2.2), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (38, 31), 2.4, clip='kabuk', shift=1)
    d.circle('Tas', (33, 22), 1.4, clip='kabuk', shift=1)
    d.ellipse('Cam', (17, 36), (9.6, 7.6), name='kafa', lift=0.04, cast=1)
    d.ellipse('Cam', (19, 40), (3.2, 2.4), part='kol_1', line=True)
    d.set_face_side(11, 32)


def genc_yan(d):
    d.ellipse('Cam', (38, 46), (3.4, 2.6), part='kol_2', line=True)
    d.ellipse('Tas', (34, 31), (18, 13), name='kabuk', lift=0.03, cast=1)
    d.ellipse('Tas', (25, 24), (4.4, 2.4), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (46, 36), 2.6, clip='kabuk', shift=1)
    d.poly('Mor', [(31, 20), (40, 20), (40, 24), (38, 26), (39, 30), (36, 28), (35, 32), (34, 27), (32, 25)], name='catlak', clip='kabuk', tone=3)
    d.capsule('Mor', (32.5, 24), (31, 16.5), 4.8, name='k1', line=True)
    d.capsule('Mor', (40, 24), (43.5, 18), 4.4, name='k2', line=True)
    d.capsule('Mor', (36, 25), (36, 14.5), 4.6, name='k3', line=True)
    d.rect('Mor', (31, 16, 31, 21), clip='k1', shift=-1)
    d.ellipse('Cam', (18, 40), (10.4, 8.4), name='kafa', lift=0.04, cast=1)
    d.ellipse('Cam', (20, 46), (3.6, 2.8), part='kol_1', line=True)
    d.set_face_side(12, 36)


def usta_yan(d):
    d.ellipse('Cam', (46, 54), (4.4, 3.0), part='kol_2', line=True)
    d.ellipse('Tas', (46, 56.5), (5, 2.2), part='kol_2', line=True, name='pl2')
    d.ellipse('Tas', (37, 38), (21, 12.5), name='kabuk', lift=0.03, cast=1)
    d.ellipse('Tas', (24, 31), (4.6, 2.4), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (51, 42), 2.8, clip='kabuk', shift=1)
    d.ellipse('Mor', (39, 29.5), (14, 5), name='oyuk', line=True, lift=-0.1)

    def kr(n, bx, by, ang, L, w):
        import math
        t = math.radians(ang); sx, sy = math.sin(t), -math.cos(t); px, py = -sy, sx
        tip = (bx + sx * L, by + sy * L); mid = (bx + sx * (L - w * 0.9), by + sy * (L - w * 0.9))
        pts = [(bx - px * w / 2, by - py * w / 2), (mid[0] - px * w / 2, mid[1] - py * w / 2), tip,
               (mid[0] + px * w / 2, mid[1] + py * w / 2), (bx + px * w / 2, by + py * w / 2)]
        d.poly('Mor', pts, name=n, line=True)
        d.poly('Mor', [(bx, by), (mid[0], mid[1]), tip, (mid[0] + px * w / 2, mid[1] + py * w / 2), (bx + px * w / 2, by + py * w / 2)], clip=n, shift=1)
    kr('k1', 30, 31, -28, 9, 4.6)
    kr('k2', 36, 31, -6, 15, 6.0)
    kr('k3', 42, 31, 14, 10, 4.8)
    kr('k4', 48, 31, 32, 6, 3.6)
    d.ellipse('Mor', (39, 32), (13.5, 3.2), name='oyuk2', line=True, lift=0.1)
    d.pix((34, 22), ['oo'], {'o': 'Parilti'})
    d.ellipse('Cam', (19, 47), (11.5, 9), name='kafa', lift=0.04, cast=1)
    d.ellipse('Cam', (23, 56), (4.6, 3.2), part='kol_1', line=True)
    d.ellipse('Tas', (23, 58.5), (5, 2.2), part='kol_1', line=True, name='pl1')
    d.set_face_side(13, 42)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
