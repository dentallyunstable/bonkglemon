# Dolunay Tavsani (Ay, epik). Tarif: TARIFLER.md. Gumus beyazi tuy topu; govdesinden uzun kulaklar, alnda sari dolunay isareti.
# Renk: Kar (tuy), Mor (golge, kulak ici), Sari (ay, tokmak, kulak ucu, ay tasi). Parlak: Kar -> Pembe.
import math
PARLA = 'Sari'


def tuy(d, cx, cy, rx, ry, name, tufts, cast=1):
    d.ellipse('Kar', (cx, cy), (rx, ry), name=name, cast=cast, lift=0.05)
    for ang, r in tufts:
        a = math.radians(ang)
        d.circle('Kar', (cx + math.cos(a) * rx * 0.95, cy + math.sin(a) * ry * 0.95), r, join=name)


def ay(d, cx, y, r=2.0):
    d.circle('Sari', (cx, y), r, part='govde', line=False)


def kulak(d, a, b, w, side, tip=None, ic=True):
    part = 'kulak_1' if side < 0 else 'kulak_2'
    d.capsule('Kar', a, b, w, part=part, line=True, name='k%d' % side)
    if ic:
        f = 0.55
        a2 = (a[0] + (b[0] - a[0]) * 0.12, a[1] + (b[1] - a[1]) * 0.12)
        b2 = (a[0] + (b[0] - a[0]) * 0.8, a[1] + (b[1] - a[1]) * 0.8)
        d.capsule('Mor', a2, b2, (w[0] * f, w[1] * f), part=part, clip='k%d' % side, tone=1)
    if tip:
        d.capsule('Sari', tip[0], tip[1], tip[2], part=part, clip='k%d' % side, tone=1)


def bebek(d):
    tuy(d, 24, 35, 12, 11.2, 'kafa', ((-140, 3), (-100, 3), (-60, 3), (-20, 2.6)))
    d.ellipse('Kar', (24, 45.5), (6, 2.6), name='ayak', line=True)
    # cok uzun sarkik kulaklar: basin yanindan yere kadar sarkar (onde)
    kulak(d, (13, 26), (8.5, 47), (5.4, 4.0), -1)
    kulak(d, (35, 26), (39.5, 47), (5.4, 4.0), 1)
    ay(d, 24, 26.3, 2.7)
    d.set_face(24, 31, gap=5)


def genc(d):
    # dik kulaklar
    kulak(d, (21, 29), (18.5, 7), (4.6, 3.6), -1)
    kulak(d, (35, 29), (37.5, 7), (4.6, 3.6), 1)
    d.ellipse('Kar', (36, 51), (5.0, 3.0), part='kuyruk', line=True)
    # govde ve kafa
    d.ellipse('Kar', (28, 47), (10, 8), name='govde', cast=1)
    tuy(d, 28, 37, 14.2, 11.6, 'kafa', ((-140, 3), (-100, 3.2), (-60, 3.2), (-20, 3)), cast=2)
    d.capsule('Kar', (21, 52), (20, 54.5), 3.6, part='kol_1', line=True)
    d.capsule('Kar', (35, 52), (36, 54.5), 3.6, part='kol_2', line=True)
    # tahta tokmak
    d.capsule('Sari', (42, 50), (46, 36), 1.8, part='esya', name='sap', line=True)
    d.ellipse('Sari', (47, 33.5), (4.2, 3.2), rot=-25, part='esya', name='bas', line=True, lift=0.15)
    d.capsule('Sari', (44.5, 31.5), (49.5, 36), 1.0, part='esya', clip='bas', shift=1)
    d.capsule('Kar', (41, 49), (43, 52), 3.2, part='kol_2', line=True)
    ay(d, 28, 28, 2.8)
    d.set_face(28, 33, gap=5)


def usta(d):
    # kocaman ponpon kuyruk
    d.circle('Kar', (50, 52), 8.5, part='kuyruk', name='ponpon', line=True, lift=-0.04)
    for a in range(0, 360, 45):
        r = math.radians(a)
        d.circle('Kar', (50 + math.cos(r) * 8, 52 + math.sin(r) * 8), 2.6, part='kuyruk', join='ponpon')
    # kulaklar: uclari sari parlar
    kulak(d, (26, 28), (22, 7), (5.2, 4.2), -1, tip=((22.5, 11), (22, 7), 3.6))
    kulak(d, (39, 28), (43, 7), (5.2, 4.2), 1, tip=((42.5, 11), (43, 7), 3.6))
    d.pix((21, 8), ['oo'], {'o': 'Parilti'}, part='kulak_1')
    d.pix((42, 8), ['oo'], {'o': 'Parilti'}, part='kulak_2')
    d.ellipse('Kar', (32, 48), (13.5, 11.5), name='govde', cast=1)
    tuy(d, 32, 35, 16.5, 13, 'kafa', ((-145, 3.4), (-105, 3.4), (-65, 3.4), (-25, 3.4)), cast=2)
    d.capsule('Kar', (22, 57), (21, 60), 4.4, part='kol_1', line=True)
    d.capsule('Kar', (42, 57), (43, 60), 4.4, part='kol_2', line=True)
    d.capsule('Kar', (14, 49), (17, 55), 4.2, part='kol_1', line=True)
    d.capsule('Kar', (50, 49), (47, 55), 4.2, part='kol_2', line=True)
    # ay tasi kolye
    d.curve('Mor', [(22, 46), (27, 50), (32, 51.5), (37, 50), (42, 46)], 1.2, part='esya', line=False)
    d.circle('Sari', (32, 53.5), 2.9, part='esya', line=True, lift=0.15)
    d.pix((31, 52), ['oo'], {'o': 'Parilti'}, part='esya')
    ay(d, 32, 24.5, 3.0)
    d.set_face(32, 31, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def kulak_y(d, a, b, w, side, tip=None, tone=0):
    part = 'kulak_1' if side < 0 else 'kulak_2'
    d.capsule('Kar', a, b, w, part=part, line=True, name='y%d' % side, lift=-0.1 if side > 0 else 0.0)
    f = 0.5
    a2 = (a[0] + (b[0] - a[0]) * 0.12, a[1] + (b[1] - a[1]) * 0.12)
    b2 = (a[0] + (b[0] - a[0]) * 0.8, a[1] + (b[1] - a[1]) * 0.8)
    d.capsule('Mor', a2, b2, (w[0] * f, w[1] * f), part=part, clip='y%d' % side, tone=1 + tone)
    if tip:
        d.capsule('Sari', tip[0], tip[1], tip[2], part=part, clip='y%d' % side, tone=1)


def bebek_yan(d):
    kulak_y(d, (30, 27), (35, 46), (5.0, 3.8), 1, tone=1)
    d.capsule('Kar', (31, 45), (32, 48.5), 2.6, line=True, part='kol_2')
    tuy(d, 25, 36, 12.5, 11.2, 'kafa', ((-140, 3), (-100, 3), (-60, 3), (-20, 2.6)))
    d.capsule('Kar', (20, 45), (19, 48.5), 2.8, line=True, part='kol_1')
    kulak_y(d, (27, 27), (24, 48), (5.0, 3.8), -1)
    d.circle('Sari', (16.5, 28.5), 2.6)
    d.set_face_side(15, 32)


def genc_yan(d):
    d.ellipse('Kar', (41, 51), (5.0, 3.4), part='kuyruk', line=True)
    kulak_y(d, (31, 30), (34, 8), (4.6, 3.6), 1, tone=1)
    d.capsule('Kar', (35, 52), (36, 55), 3.4, part='kol_2', line=True)
    d.ellipse('Kar', (31, 47), (11.5, 8), name='govde', cast=1)
    tuy(d, 27, 38, 14, 11.6, 'kafa', ((-140, 3), (-100, 3.2), (-60, 3.2), (-20, 3)), cast=2)
    d.capsule('Kar', (22, 52), (21, 55), 3.4, part='kol_1', line=True)
    # tokmak onde (yakin elde), sagda yukari
    d.capsule('Sari', (28, 50), (40, 38), 1.8, part='esya', name='sap', line=True)
    d.ellipse('Sari', (43, 35), (4.2, 3.4), rot=-25, part='esya', name='bas', line=True, lift=0.15)
    d.capsule('Sari', (40.5, 33), (45.5, 37.5), 1.0, part='esya', clip='bas', shift=1)
    kulak_y(d, (25, 30), (23, 7), (4.8, 3.6), -1)
    d.circle('Sari', (17.5, 31), 2.8)
    d.set_face_side(15, 37)


def usta_yan(d):
    d.circle('Kar', (53, 52), 8.5, part='kuyruk', name='ponpon', line=True, lift=-0.04)
    for a in range(0, 360, 45):
        r = math.radians(a)
        d.circle('Kar', (53 + math.cos(r) * 8, 52 + math.sin(r) * 8), 2.6, part='kuyruk', join='ponpon')
    kulak_y(d, (38, 29), (42, 7), (5.2, 4.2), 1, tip=((41.5, 11), (42, 7), 3.6), tone=1)
    d.capsule('Kar', (40, 57), (41, 60), 4.2, part='kol_2', line=True)
    d.ellipse('Kar', (35, 48), (13.5, 11.5), name='govde', cast=1)
    tuy(d, 30, 36, 16, 13, 'kafa', ((-145, 3.4), (-105, 3.4), (-65, 3.4), (-25, 3.4)), cast=2)
    d.capsule('Kar', (23, 57), (22, 60), 4.2, part='kol_1', line=True)
    # kolye
    d.curve('Mor', [(17, 47), (20, 51), (25, 52.5)], 1.2, part='esya')
    d.circle('Sari', (20, 54), 2.9, part='esya', line=True, lift=0.15)
    d.pix((19, 53), ['oo'], {'o': 'Parilti'}, part='esya')
    kulak_y(d, (29, 29), (26, 7), (5.2, 4.2), -1, tip=((26.5, 11), (26, 7), 3.6))
    d.pix((25, 8), ['oo'], {'o': 'Parilti'}, part='kulak_1')
    d.circle('Sari', (20, 27), 3.0)
    d.set_face_side(17, 36)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
