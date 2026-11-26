# Serap Kelebegi (Kum, nadir, ucar). Tarif: TARIFLER.md. Gozlu yuvarlak kanatli, tuyu krem tombul kelebek.
# Renk: Turuncu (kanat), Krem (govde), Cam (goz deseni). Parlak: Turuncu -> Mor. Kanatlar "yukari" halde cizili.
import math
PARLA = 'Cam'


def mir(x, cx):
    return 2 * cx - x


def kanat(d, cx, c, r, rot, name, wavy=0, part='kanat_1', lift=0.0):
    """Yuvarlak kanat; sol (c) ve sag (aynali) iki kopya. wavy>0: kenar dalgasi."""
    for side in (1, -1):
        x = c[0] if side == 1 else mir(c[0], cx)
        rr = rot if side == 1 else -rot
        n = name + str(side)
        p = 'kanat_1' if side == 1 else 'kanat_2'
        d.ellipse('Turuncu', (x, c[1]), r, rot=rr, part=p, name=n, line=True, lift=lift)
        if wavy:
            for k in range(wavy[0]):
                a = math.radians(wavy[1] + k * wavy[2])
                ex, ey = r
                px, py = ex * 0.96 * math.cos(a), ey * 0.96 * math.sin(a)
                R = math.radians(rr)
                X = x + px * math.cos(R) - py * math.sin(R)
                Y = c[1] + px * math.sin(R) + py * math.cos(R)
                d.circle('Turuncu', (X, Y), wavy[3], part=p, join=n)


def goz(d, cx, c, r, name, big=True):
    """Goz deseni: Cam halka, krem ic halka, turkuaz gobek."""
    for side in (1, -1):
        x = c[0] if side == 1 else mir(c[0], cx)
        n = name + str(side)
        p = 'kanat_1' if side == 1 else 'kanat_2'
        d.circle('Cam', (x, c[1]), r, part=p, clip=n, tone=3)
        d.circle('Krem', (x, c[1]), r * 0.68, part=p, clip=n, tone=1)
        d.circle('Cam', (x, c[1]), r * 0.4, part=p, clip=n, tone=1)
        if big:
            d.pix((int(x - 1.5), int(c[1] - 1.5)), ['oo'], {'o': 'Parilti'}, part=p)


def govde(d, cx, cy, rx, ry, tufts):
    d.ellipse('Krem', (cx, cy), (rx, ry), name='g', cast=1, lift=0.04)
    for x, y, r in tufts:
        d.circle('Krem', (x, y), r, join='g')


def anten(d, cx, y, dx, h):
    for s in (-1, 1):
        d.curve('Turuncu', [(cx + s * dx, y), (cx + s * (dx + 1), y - h), (cx + s * (dx + 4), y - h - 1.5)], 1.4, part='tepe', line=False)
        d.circle('Turuncu', (cx + s * (dx + 4.5), y - h - 1.5), 1.5, part='tepe', lift=0.15)


def bebek(d):
    d.flyer = True
    cx = 24
    kanat(d, cx, (9.5, 29), (6.4, 8.4), -20, 'w')
    goz(d, cx, (8.5, 28.5), 2.6, 'w', big=False)
    govde(d, cx, 36.5, 12.8, 13, [(13.5, 44, 2.6), (34.5, 44, 2.6)])
    anten(d, cx, 24.5, 4, 6)
    d.set_face(24, 33, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    # alt kanatlar (kucuk)
    kanat(d, cx, (11, 46), (6.6, 6.2), 25, 'a', lift=-0.06)
    # ust kanatlar halka desenli
    kanat(d, cx, (10, 28), (8, 11), -22, 'w')
    goz(d, cx, (8.5, 26.5), 3.8, 'w', big=False)
    govde(d, cx, 40.5, 14.2, 16.2, [(15.5, 50, 3), (40.5, 50, 3)])
    anten(d, cx, 25.5, 4.5, 7)
    d.set_face(28, 37, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    kanat(d, cx, (10.5, 57), (7, 6.2), 28, 'a', wavy=(4, 110, 45, 2.6), lift=-0.06)
    goz(d, cx, (9.5, 55.5), 2.6, 'a', big=False)
    kanat(d, cx, (14, 34), (9.2, 12), -24, 'w', wavy=(5, 160, 40, 3))
    goz(d, cx, (12, 32), 5.0, 'w')
    govde(d, cx, 46.5, 17, 20.5, [(17.5, 58, 3.4), (46.5, 58, 3.4)])
    anten(d, cx, 28.5, 5, 6)
    d.set_face(32, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, ucar
def kanat_yan(d, c, r, rot, name, part, lift=0.0, wavy=0, desen=None, tone_far=False):
    """Tek yuvarlak kanat (yan gorunum). desen=(yaricap, buyuk_mu)."""
    d.ellipse('Turuncu', c, r, rot=rot, part=part, name=name, line=True, lift=lift)
    if wavy:
        for k in range(wavy[0]):
            a = math.radians(wavy[1] + k * wavy[2])
            ex, ey = r
            px, py = ex * 0.96 * math.cos(a), ey * 0.96 * math.sin(a)
            R = math.radians(rot)
            d.circle('Turuncu', (c[0] + px * math.cos(R) - py * math.sin(R), c[1] + px * math.sin(R) + py * math.cos(R)), wavy[3], part=part, join=name)
    if desen:
        gr, big = desen
        d.circle('Cam', (c[0] - 1, c[1] - 1), gr, part=part, clip=name, tone=3)
        d.circle('Krem', (c[0] - 1, c[1] - 1), gr * 0.68, part=part, clip=name, tone=1)
        d.circle('Cam', (c[0] - 1, c[1] - 1), gr * 0.4, part=part, clip=name, tone=1)
        if big:
            d.pix((int(c[0] - 3), int(c[1] - 3)), ['oo'], {'o': 'Parilti'}, part=part)


def anten_yan(d, x, y, h):
    """Yakin anten one (sola) kivrik, uzak anten arkada."""
    d.curve('Turuncu', [(x + 3, y), (x + 2, y - h), (x - 2, y - h - 1.5)], 1.4, part='tepe', line=False)
    d.circle('Turuncu', (x - 2.5, y - h - 1.5), 1.5, part='tepe', lift=0.15)
    d.curve('Turuncu', [(x + 6, y), (x + 6, y - h + 1), (x + 3, y - h - 1.5)], 1.4, part='tepe', line=False, lift=-0.15)
    d.circle('Turuncu', (x + 2.5, y - h - 1.5), 1.5, part='tepe', lift=-0.05)


def bebek_yan(d):
    d.flyer = True
    kanat_yan(d, (36, 25), (7, 9.6), 28, 'w2', 'kanat_2', lift=-0.15, desen=(2.4, False))
    govde(d, 22, 36.5, 12.8, 13, [(14, 44, 2.6), (30, 45, 2.6)])
    anten_yan(d, 17, 24.5, 6)
    kanat_yan(d, (33, 27), (7.4, 10), 24, 'w1', 'kanat_1', desen=(2.8, False))
    d.set_face_side(12, 33)


def genc_yan(d):
    d.flyer = True
    kanat_yan(d, (43, 26), (8.2, 12.4), 30, 'w2', 'kanat_2', lift=-0.15, desen=(3.4, False))
    kanat_yan(d, (39, 47), (6.2, 5.8), -25, 'a2', 'kanat_2', lift=-0.2)
    govde(d, 26, 40.5, 14.2, 16.2, [(17, 50, 3), (33, 51, 3)])
    anten_yan(d, 20, 25.5, 7)
    kanat_yan(d, (38, 29), (8.8, 12.6), 26, 'w1', 'kanat_1', desen=(3.8, False))
    kanat_yan(d, (35, 48), (6.6, 6.2), -20, 'a1', 'kanat_1', lift=-0.06)
    d.set_face_side(14, 37)


def usta_yan(d):
    d.flyer = True
    kanat_yan(d, (47, 31), (10, 14), 28, 'w2', 'kanat_2', lift=-0.15, wavy=(5, 160, 40, 3), desen=(4.4, False))
    kanat_yan(d, (44, 58), (7, 6.4), -28, 'a2', 'kanat_2', lift=-0.2, wavy=(4, 110, 45, 2.6))
    govde(d, 30, 46.5, 17, 20.5, [(20, 58, 3.4), (40, 59, 3.4)])
    anten_yan(d, 23, 28.5, 7)
    kanat_yan(d, (43, 34), (10.8, 14.2), 24, 'w1', 'kanat_1', wavy=(5, 160, 40, 3), desen=(5.0, True))
    kanat_yan(d, (40, 58), (7.4, 6.6), -22, 'a1', 'kanat_1', lift=-0.06, wavy=(4, 110, 45, 2.6))
    d.set_face_side(16, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
