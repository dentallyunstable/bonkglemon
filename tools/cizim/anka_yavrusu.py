# Anka Yavrusu (Ates, efsanevi, ucar). Tarif: TARIFLER.md. Kulden dogmus tombul turuncu anka: bebekte kul yigininda, gencte kirmizi kanat uclu, ustada uc kivrik kuyruk tuyu.
# Kivilcim Civcivi'nden farki: Turuncu govde (Sari degil), kanatli, alev gaga yerine altin gaga + altin yaka, kul lekesi, uzun kivrik kuyruk tuyleri.
# Renk: Turuncu (govde), Kirmizi (kanat ucu, alev), Sari (altin yaka, gaga, ayak); bebekte kul Tas.
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def alev(d, x, y, h, w, part='tepe', name='al'):
    d.capsule('Kirmizi', (x, y), (x, y - h), (w, w * 0.4), part=part, line=True, name=name)
    d.capsule('Sari', (x, y - h * 0.45), (x, y - h * 0.95), (w * 0.5, 0.9), part=part, clip=name, shift=0)


def yaka(d, cx, y, rx, ry=2.4):
    d.ellipse('Sari', (cx, y), (rx, ry), part='esya', name='yaka', line=True, lift=0.08, cast=1)


def gaga(d, cx, y, w=2.4):
    d.ellipse('Sari', (cx, y), (w, 1.6), line=True, noshadow=True, lift=0.1)


def bebek(d):
    d.flyer = True
    cx = 24
    # minik kanatlar (yukari, govdeye degiyor)
    d.ellipse('Turuncu', (12.5, 31), (3.2, 5.0), rot=-28, part='kanat_1', line=True)
    d.ellipse('Turuncu', (35.5, 31), (3.2, 5.0), rot=28, part='kanat_2', line=True)
    d.ellipse('Turuncu', (cx, 34), (12.8, 11), name='kafa', cast=1)
    # kul lekesi basta
    d.ellipse('Tas', (cx - 5, 26), (3.4, 1.8), rot=-20, clip='kafa', shift=-1)
        # tek alev tuyu
    alev(d, cx + 1, 25, 9, 3.6)
    d.pix((cx, 18), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, cx, 37.6, 1.9)
    # kul yigini
    d.ellipse('Tas', (cx, 46.5), (12.6, 4.8), name='kul', line=True, cast=1)
    for x, y, r in ((13, 44.5, 3.0), (18, 43.4, 3.2), (30, 43.6, 3.2), (35, 44.6, 3.0), (24, 43, 3.0)):
        d.circle('Tas', (x, y), r, join='kul')
    d.circle('Tas', (17, 47), 1.2, clip='kul', shift=1)
    d.circle('Tas', (30, 47.5), 1.2, clip='kul', shift=1)
    d.set_face(cx, 30, gap=5, mouth=False)
    # tek kor kor altin yaka yok: kulun ustunde altin yuzuk
    d.ellipse('Sari', (cx, 41.2), (7.5, 1.6), part='esya', name='yaka', line=True, lift=0.08)


def genc(d):
    d.flyer = True
    cx = 28
    # kanatlar (yukari), ucu kirmizi
    for m, p in ((lambda x: x, 'kanat_1'), (lambda x: 2 * cx - x, 'kanat_2')):
        d.poly('Turuncu', [(m(18), 42), (m(9), 36), (m(6), 27), (m(10), 26), (m(14), 33), (m(19), 36)], part=p, line=True, name='w' + p[-1])
        d.poly('Kirmizi', [(m(8), 33), (m(6), 27), (m(10), 26), (m(13), 31)], part=p, clip='w' + p[-1], shift=0)
    # kuyrukta tek uzun kivrik tuy
    d.curve('Kirmizi', [(40, 49), (47, 50), (50, 43), (46, 38)], (5.2, 2.4), part='kuyruk', line=True, name='kt')
    d.curve('Sari', [(45, 49), (49, 46), (48, 41)], 1.6, part='kuyruk', clip='kt', shift=0)
    d.ellipse('Turuncu', (cx, 38), (15, 13), name='kafa', cast=1, lift=0.02)
    d.ellipse('Turuncu', (cx, 47.5), (11, 7), name='gv', join='kafa')
    d.ellipse('Tas', (cx - 5, 28.5), (3.4, 1.8), rot=-20, clip='kafa', shift=-1)
    d.circle('Tas', (cx - 10, 48), 1.6, clip='kafa', shift=-1)
    alev(d, cx - 1, 27, 11, 4.0)
    alev(d, cx + 4, 28, 7, 3.0, name='al2')
    d.pix((cx - 2, 20), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, cx, 40.2, 2.2)
    # altin yaka
    d.ellipse('Sari', (cx, 46.3), (9, 2.0), part='esya', name='yaka', line=True, lift=0.08)
    # ayaklar
    for x in (22, 34):
        d.ellipse('Sari', (x, 55), (3.4, 1.8), line=True, noshadow=True)
    d.set_face(cx, 33, gap=5, mouth=False)


def usta(d):
    d.flyer = True
    cx = 32
    # uc uzun kivrik kuyruk tuyu (arkada, hepsi saga savrulur: iki yanda simetrik dursa ahtapot kolu gibi okunuyordu)
    for i, pts in enumerate((
        [(39, 50), (48, 53), (56, 51), (60, 45), (57, 40.5)],
        [(38, 46), (47, 45), (54, 39), (55, 32), (51, 29)],
        [(38, 54), (46, 58), (54, 58.5), (60, 56), (61, 52)],
    )):
        d.curve('Kirmizi', pts, (8.5, 3.2), part='kuyruk', line=True, name='kt%d' % i)
        d.curve('Turuncu', pts[1:], 2.4, part='kuyruk', clip='kt%d' % i, shift=-1)
        d.curve('Sari', pts[2:], 1.8, part='kuyruk', clip='kt%d' % i, shift=0)
    # kanatlar
    for m, p in ((lambda x: x, 'kanat_1'), (lambda x: 2 * cx - x, 'kanat_2')):
        n = 'w' + p[-1]
        d.poly('Turuncu', [(m(21), 50), (m(12), 45), (m(7), 36), (m(6), 26), (m(10), 24), (m(16), 31), (m(21), 38)], part=p, line=True, name=n, lift=-0.04)
        d.poly('Kirmizi', [(m(8), 34), (m(6), 26), (m(10), 24), (m(14), 29)], part=p, clip=n, shift=0)
        d.capsule('Turuncu', (m(19), 45), (m(10), 33), 1.0, part=p, clip=n, shift=1)
    d.ellipse('Turuncu', (cx, 37.5), (16.5, 15.8), name='kafa', cast=1, lift=0.02)
    d.ellipse('Turuncu', (cx, 48), (15, 12), name='gv', join='kafa')
    d.ellipse('Tas', (cx - 7, 28), (3.6, 1.8), rot=-20, clip='kafa', shift=-1)
    d.circle('Tas', (cx - 14, 50), 1.7, clip='kafa', shift=-1)
    # alev tepelik
    alev(d, cx - 4, 27, 9, 4.4, name='a1')
    alev(d, cx + 1, 27, 13, 5.2, name='a2')
    alev(d, cx + 6.5, 27, 8, 4.2, name='a3')
    d.pix((cx, 18), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, cx, 42.6, 2.6)
    d.ellipse('Sari', (cx, 49.5), (12, 2.6), part='esya', name='yaka', line=True, lift=0.08, cast=1)
    for x in (25, 39):
        d.ellipse('Sari', (x, 60.5), (4, 2.1), line=True, noshadow=True)
    d.set_face(cx, 34, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def bebek_yan(d):
    d.flyer = True
    cx = 26
    d.ellipse('Turuncu', (34, 30), (3.0, 5.4), rot=30, part='kanat_2', line=True, tone=2, name='w2')
    d.ellipse('Turuncu', (cx, 34), (12.8, 11), name='kafa', cast=1)
    d.ellipse('Tas', (cx - 5, 26), (3.4, 1.8), rot=-20, clip='kafa', shift=-1)
    d.ellipse('Turuncu', (29.5, 31), (3.4, 5.4), rot=25, part='kanat_1', line=True, name='w1')
    alev(d, cx + 1, 25, 9, 3.6)
    d.pix((cx, 18), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, 13.5, 37.6, 2.3)
    d.ellipse('Tas', (cx, 46.5), (12.6, 4.8), name='kul', line=True, cast=1)
    for x, y, r in ((14, 44.5, 3.0), (19, 43.4, 3.2), (32, 43.6, 3.2), (37, 44.6, 3.0), (26, 43, 3.0)):
        d.circle('Tas', (x, y), r, join='kul')
    d.circle('Tas', (18, 47), 1.2, clip='kul', shift=1)
    d.circle('Tas', (32, 47.5), 1.2, clip='kul', shift=1)
    d.ellipse('Sari', (cx - 1, 41.2), (7, 1.6), part='esya', name='yaka', line=True, lift=0.08)
    d.set_face_side(16, 30)


def genc_yan(d):
    d.flyer = True
    cx = 29
    d.ellipse('Sari', (35, 55), (3.4, 1.8), part='kol_2', line=True, noshadow=True)
    d.poly('Turuncu', [(37, 42), (43, 34), (45, 25), (41, 24), (37, 30), (33, 36)], part='kanat_2', line=True, name='w2', lift=-0.1)
    d.poly('Kirmizi', [(44, 33), (45, 25), (41, 24), (39, 29)], part='kanat_2', clip='w2', shift=0)
    d.curve('Kirmizi', [(41, 49), (48, 50), (51, 43), (47, 38)], (5.2, 2.4), part='kuyruk', line=True, name='kt')
    d.curve('Sari', [(46, 49), (50, 46), (49, 41)], 1.6, part='kuyruk', clip='kt', shift=0)
    d.ellipse('Turuncu', (cx, 38), (14, 13), name='kafa', cast=1, lift=0.02)
    d.ellipse('Turuncu', (cx + 1, 47.5), (11, 7), name='gv', join='kafa')
    d.ellipse('Tas', (cx - 5, 28.5), (3.4, 1.8), rot=-20, clip='kafa', shift=-1)
    d.circle('Tas', (cx - 9, 48), 1.6, clip='kafa', shift=-1)
    alev(d, cx - 1, 27, 11, 4.0)
    alev(d, cx + 4, 28, 7, 3.0, name='al2')
    d.pix((cx - 2, 20), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, 14.5, 40.2, 2.6)
    d.ellipse('Sari', (cx - 1, 46.3), (9, 2.0), part='esya', name='yaka', line=True, lift=0.08)
    d.poly('Turuncu', [(33, 44), (39, 36), (41, 27), (37, 26), (33, 32), (29, 38)], part='kanat_1', line=True, name='w1')
    d.poly('Kirmizi', [(40, 35), (41, 27), (37, 26), (35, 31)], part='kanat_1', clip='w1', shift=0)
    d.ellipse('Sari', (23, 55), (3.4, 1.8), part='kol_1', line=True, noshadow=True)
    d.set_face_side(16, 34)


def usta_yan(d):
    d.flyer = True
    cx = 32
    d.ellipse('Sari', (39, 60.5), (4, 2.1), part='kol_2', line=True, noshadow=True)
    d.poly('Turuncu', [(40, 50), (47, 42), (50, 31), (45, 28), (41, 34), (36, 42)], part='kanat_2', line=True, name='w2', lift=-0.1)
    d.poly('Kirmizi', [(49, 38), (50, 31), (45, 28), (43, 33)], part='kanat_2', clip='w2', shift=0)
    for i, pts in enumerate((
        [(44, 50), (51, 53), (57, 51), (60, 45), (57, 40.5)],
        [(43, 46), (50, 45), (55, 39), (56, 32), (52, 29)],
        [(43, 54), (49, 58), (55, 58.5), (60, 56), (61, 52)],
    )):
        d.curve('Kirmizi', pts, (8.0, 3.2), part='kuyruk', line=True, name='kt%d' % i)
        d.curve('Turuncu', pts[1:], 2.4, part='kuyruk', clip='kt%d' % i, shift=-1)
        d.curve('Sari', pts[2:], 1.8, part='kuyruk', clip='kt%d' % i, shift=0)
    d.ellipse('Turuncu', (cx, 37.5), (15.5, 15.8), name='kafa', cast=1, lift=0.02)
    d.ellipse('Turuncu', (cx + 1, 48), (14.5, 12), name='gv', join='kafa')
    d.ellipse('Tas', (cx - 7, 28), (3.6, 1.8), rot=-20, clip='kafa', shift=-1)
    d.circle('Tas', (cx - 12, 50), 1.7, clip='kafa', shift=-1)
    alev(d, cx - 4, 27, 9, 4.4, name='a1')
    alev(d, cx + 1, 27, 13, 5.2, name='a2')
    alev(d, cx + 6.5, 27, 8, 4.2, name='a3')
    d.pix((cx, 18), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, 16, 42.6, 3.0)
    d.ellipse('Sari', (cx - 1, 49.5), (12, 2.6), part='esya', name='yaka', line=True, lift=0.08, cast=1)
    d.poly('Turuncu', [(37, 52), (44, 43), (47, 32), (42, 29), (37, 36), (32, 44)], part='kanat_1', line=True, name='w1')
    d.poly('Kirmizi', [(46, 40), (47, 32), (42, 29), (40, 34)], part='kanat_1', clip='w1', shift=0)
    d.capsule('Turuncu', (36, 49), (43, 38), 1.0, part='kanat_1', clip='w1', shift=1)
    d.ellipse('Sari', (26, 60.5), (4, 2.1), part='kol_1', line=True, noshadow=True)
    d.set_face_side(17, 38)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
