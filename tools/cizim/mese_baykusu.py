# Mese Baykusu (Orman, nadir, ucar). Tarif: TARIFLER.md
# Palamut baykus: govde palamut (Kahve), sapka palamut kapagi (koyu Kahve, doku), karin/yuz levhasi Krem, meşe yapraklari Cimen.
# Nadir: Cimen vurgu + palamut kolye / yaprakta 2 piksel Parilti.
import math
PARLA = 'Sari'


def oak(d, c, s, rot, part, name, fam='Cimen', **kw):
    """Mese yapragi: uzun elips + yan lobl (tumsekler). rot: derece, ucu (0,-1) yonune bakar, rot ile doner."""
    a = math.radians(rot)
    ca, sa = math.cos(a), math.sin(a)

    def P(u, v):  # yerel (u yanal, v uzun; -v uc)
        return (c[0] + u * ca - v * sa, c[1] + u * sa + v * ca)
    d.ellipse(fam, c, (1.7 * s, 5.8 * s), rot=rot, part=part, name=name, line=True, **kw)
    for v in (-3.4, -0.4, 2.6):
        for u in (-2.7, 2.7):
            d.circle(fam, P(u * s, v * s), 1.45 * s, join=name)
    d.capsule(fam, P(0, 4.5 * s), P(0, -4.2 * s), 0.9, clip=name, shift=1, part=part)


def cap(d, cx, cy, rx, ry, name='kapak', rot=0, inb=None, cast=1, part='govde'):
    d.ellipse('Kahve', (cx, cy), (rx, ry), name=name, rot=rot, lift=-0.12, cast=cast, inbox=inb, part=part)
    # pul dokusu: kucuk koyu yaylar
    for i, (x, y) in enumerate(((-6, -4), (0, -6), (6, -4), (-3, -1), (3, -1), (-8.5, 0), (8.5, 0))):
        d.capsule('Kahve', (cx + x * rx / 13.0 - 1, cy + y * ry / 9.0), (cx + x * rx / 13.0 + 1, cy + y * ry / 9.0), 0.9,
                  clip=name, shift=1, part=part)


def bebek(d):
    d.flyer = True
    d.ellipse('Kahve', (11.5, 40), (2.4, 3.6), rot=20, part='kanat_1', line=True)
    d.ellipse('Kahve', (36.5, 40), (2.4, 3.6), rot=-20, part='kanat_2', line=True)
    d.ellipse('Kahve', (24, 38), (13, 11), name='govde', lift=0.12, cast=1)
    d.ellipse('Krem', (24, 40), (9.6, 7), name='levha')
    # palamut kapagi: gozlere duser
    d.ellipse('Kahve', (24, 31), (14, 9.5), name='kapak', lift=-0.12, cast=1, inbox=(0, 0, 47, 31))
    d.ellipse('Kahve', (24, 31.5), (13.2, 1.8), join='kapak')
    for x, y in ((17, 26), (22, 24), (27, 24), (32, 26), (19.5, 29), (25, 28), (30, 29)):
        d.capsule('Kahve', (x - 1, y), (x + 1, y), 0.9, clip='kapak', shift=1)
    d.capsule('Kahve', (24, 23), (25, 19), (2.2, 1.6), part='tepe', line=True)
    d.ellipse('Cimen', (28, 19), (2.0, 1.4), rot=-15, part='tepe', line=True)
    d.set_face(24, 33, gap=5, ten='Krem')


def genc(d):
    d.flyer = True
    # kanatlar: yukari kalkik, uclari mese yapragi
    d.capsule('Kahve', (18, 45), (11.5, 31), (6.4, 4.0), part='kanat_1', line=True, lift=-0.05)
    d.capsule('Kahve', (40, 45), (46.5, 31), (6.4, 4.0), part='kanat_2', line=True, lift=-0.05)
    oak(d, (10.5, 26), 0.95, -12, 'kanat_1', 'ok1')
    oak(d, (47.5, 26), 0.95, 12, 'kanat_2', 'ok2')
    d.pix((9, 23), ['oo'], {'o': 'Parilti'}, part='kanat_1')
    d.ellipse('Kahve', (29, 44), (12.5, 10), name='govde', lift=0.12, cast=1)
    d.ellipse('Krem', (29, 46), (8, 6.2), name='karin')
    for x in (25, 29, 33):
        d.capsule('Kahve', (x - 1, 47), (x, 49), 0.9, clip='karin', shift=1)
    d.ellipse('Kahve', (29, 35), (13.5, 10.5), name='kafa', lift=0.12, cast=1)
    d.ellipse('Krem', (29, 37.5), (10, 6.5), name='levha')
    # bere gibi kapak: yana yatik
    cap(d, 27, 28, 13.5, 8, rot=-8, inb=(0, 0, 55, 30.4))
    d.capsule('Kahve', (26, 20.5), (26, 17.5), (2.2, 1.6), part='tepe', line=True)
    d.capsule('Kahve', (21, 51), (21, 54.5), 3.2, part='govde', line=True)
    d.capsule('Kahve', (35, 51), (35, 54.5), 3.2, part='govde', line=True)
    d.set_face(29, 31, gap=5, ten='Krem')


def usta(d):
    d.flyer = True
    # pelerin: mese yapragi kanatlar, ust uste
    for sgn, part in ((-1, 'kanat_1'), (1, 'kanat_2')):
        bx = 32 + sgn * 15
        oak(d, (bx + sgn * 6, 50), 1.5, sgn * -8, part, 'a%d' % sgn, fam='Cimen', lift=-0.22)
        oak(d, (bx + sgn * 4, 40), 1.6, sgn * -22, part, 'b%d' % sgn, fam='Cimen', lift=-0.02)
        oak(d, (bx + sgn * 1, 31), 1.5, sgn * -38, part, 'c%d' % sgn, fam='Cimen', lift=0.16)
    d.pix((13, 26), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.ellipse('Kahve', (32, 48), (14, 10), name='govde', lift=0.12, cast=1)
    d.ellipse('Krem', (32, 50), (9.5, 7), name='karin')
    d.ellipse('Kahve', (32, 36), (15, 11.5), name='kafa', lift=0.12, cast=1)
    d.ellipse('Krem', (32, 38.5), (11.2, 7), name='levha')
    # kulak tuyleri: iki yaprak
    d.ellipse('Cimen', (20.5, 24), (2.4, 5.4), rot=-28, part='tepe', line=True, name='t1')
    d.ellipse('Cimen', (43.5, 24), (2.4, 5.4), rot=28, part='tepe', line=True, name='t2')
    d.capsule('Cimen', (20.5, 26), (21.5, 22), 0.9, clip='t1', shift=1, part='tepe')
    d.capsule('Cimen', (43.5, 26), (42.5, 22), 0.9, clip='t2', shift=1, part='tepe')
    cap(d, 32, 28.5, 14.5, 8.6, inb=(0, 0, 63, 31.4), part='govde')
    d.capsule('Kahve', (32, 21), (32.5, 17.5), (2.4, 1.8), part='tepe', line=True)
    d.capsule('Kahve', (24, 54), (22, 58), 3.6, part='govde', line=True)
    d.capsule('Kahve', (40, 54), (42, 58), 3.6, part='govde', line=True)
    # palamut kolye
    d.ellipse('Kahve', (32, 52.5), (3.0, 3.4), part='esya', name='kol', line=True, lift=0.1)
    d.ellipse('Kahve', (32, 50.6), (3.2, 1.8), part='esya', line=True, lift=-0.15)
    d.pix((31, 52), ['oo', 'o.'], {'o': 'Parilti'}, part='esya')
    d.set_face(32, 34, gap=6, ten='Krem')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}

# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken

def bebek_yan(d):
    d.flyer = True
    d.ellipse('Kahve', (33, 38), (4.6, 6), rot=-25, part='kanat_2', line=True, lift=-0.2)
    d.ellipse('Kahve', (24, 38), (13, 11), name='g', lift=0.12, cast=1)
    d.ellipse('Krem', (16.5, 40.5), (7.5, 6.5), name='lv')
    d.ellipse('Kahve', (24, 31), (14, 9.5), name='kapak', lift=-0.12, cast=1, inbox=(0, 0, 47, 31))
    d.ellipse('Kahve', (24, 31.5), (13.2, 1.8), join='kapak')
    for x, y in ((19, 26), (24, 24), (29, 25), (33, 28), (21.5, 29), (27, 28.5)):
        d.capsule('Kahve', (x - 1, y), (x + 1, y), 0.9, clip='kapak', shift=1)
    d.capsule('Kahve', (25, 23), (27, 19), (2.2, 1.6), part='tepe', line=True)
    d.ellipse('Cimen', (30, 19), (2.0, 1.4), rot=-15, part='tepe', line=True)
    d.ellipse('Kahve', (28, 40), (5, 6.5), rot=-20, part='kanat_1', line=True, lift=0.05)
    d.set_face_side(14, 33)


def genc_yan(d):
    d.flyer = True
    d.capsule('Kahve', (35, 44), (42, 33), (5.6, 3.6), part='kanat_2', line=True, lift=-0.2)
    oak(d, (44, 29), 0.9, 22, 'kanat_2', 'ok2', lift=-0.2)
    d.ellipse('Kahve', (28, 41), (14, 13), name='g', lift=0.12, cast=1)
    d.ellipse('Krem', (20, 44), (8.5, 7.5), name='lv')
    for x in (17, 21, 25):
        d.capsule('Kahve', (x - 1, 47), (x, 49), 0.9, clip='lv', shift=1)
    cap(d, 27, 29, 14, 8.2, inb=(0, 0, 55, 30.4))
    d.capsule('Kahve', (27, 21), (29, 17.5), (2.2, 1.6), part='tepe', line=True)
    d.capsule('Kahve', (31, 44), (38, 32), (6.4, 4.0), part='kanat_1', line=True, lift=0.0)
    oak(d, (40, 27), 1.0, 20, 'kanat_1', 'ok1')
    d.pix((39, 23), ['oo'], {'o': 'Parilti'}, part='kanat_1')
    d.capsule('Kahve', (22, 52), (21, 55), 3.2, part='kol_1', line=True)
    d.capsule('Kahve', (34, 52), (35, 55), 3.2, part='kol_2', line=True)
    d.set_face_side(16, 35)


def usta_yan(d):
    d.flyer = True
    # pelerin: arkada (sagda) ust uste mese yapraklari
    for (cx_, cy_, r_, lf, nm, pt) in ((50, 56, 80, -0.25, 'a', 'kanat_2'), (49, 46, 62, -0.12, 'b', 'kanat_2'),
                                       (46, 37, 45, -0.02, 'c', 'kanat_2')):
        oak(d, (cx_, cy_), 1.5, r_, pt, nm, lift=lf)
    d.ellipse('Kahve', (30, 46), (15, 12.5), name='g', lift=0.12, cast=1)
    d.ellipse('Krem', (24, 46.5), (9.5, 9.5), name='lv')
    d.capsule('Kahve', (21, 52), (27, 54), 0.9, clip='lv', shift=1)
    d.capsule('Kahve', (22, 55), (30, 57), 0.9, clip='lv', shift=1)
    d.ellipse('Cimen', (35, 28), (2.4, 5.4), rot=24, part='tepe', line=True, name='t1')
    d.capsule('Cimen', (35, 30), (34, 26), 0.9, clip='t1', shift=1, part='tepe')
    cap(d, 29, 32, 15, 8.8, inb=(0, 0, 63, 34.4), part='govde')
    d.capsule('Kahve', (29, 24), (30.5, 20.5), (2.4, 1.8), part='tepe', line=True)
    d.capsule('Kahve', (33, 50), (38, 42), (5.5, 3.5), part='kanat_1', line=True, lift=0.05)
    oak(d, (41, 40), 1.2, 40, 'kanat_1', 'near', lift=0.1)
    d.pix((40, 35), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.ellipse('Kahve', (19, 56.5), (3.0, 3.4), part='esya', name='kol', line=True, lift=0.1)
    d.pix((18, 55), ['oo', 'o.'], {'o': 'Parilti'}, part='esya')
    d.capsule('Kahve', (27, 56), (26, 60), 3.6, part='kol_1', line=True)
    d.capsule('Kahve', (39, 56), (40, 60), 3.6, part='kol_2', line=True)
    d.set_face_side(19, 38)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
