# Kum Tilkisi (Kum, siradan). Tarif: TARIFLER.md. Govde kadar dev, genis tabanli kulakli krem col tilkisi.
# Renk: Krem (govde), Turuncu (sirt, kulak, kuyruk), Cam (bandana). Parlak: Turuncu -> Tas.
PARLA = 'Cam'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kulak(d, cx, x, y, w, h, tilt, tip=False):
    """Genis tabanli, ucu yuvarlak, disa egik kulak. (x,y) sol kulak tabani ortasi."""
    L = [(x - w * .55, y), (x - w * .5 - tilt * .5, y - h * .5), (x - w * .35 - tilt, y - h * .9), (x - tilt * 1.1, y - h),
         (x + w * .4 - tilt * .9, y - h * .85), (x + w * .6 - tilt * .4, y - h * .45), (x + w * .6, y)]
    I = [(x - w * .3, y - 1), (x - w * .3 - tilt * .5, y - h * .5), (x - w * .1 - tilt * .9, y - h * .78), (x + w * .2 - tilt * .7, y - h * .65),
         (x + w * .3 - tilt * .3, y - h * .4), (x + w * .35, y - 1)]
    d.poly('Turuncu', L, part='kulak_1', name='e1', line=True, lift=0.03)
    d.poly('Krem', I, part='kulak_1', clip='e1', tone=1)
    d.poly('Turuncu', mir(L, cx), part='kulak_2', name='e2', line=True, lift=0.03)
    d.poly('Krem', mir(I, cx), part='kulak_2', clip='e2', tone=1)
    if tip:
        t = [(x - w * .5 - tilt, y - h * .62), (x - tilt * 1.2, y - h * .66), (x - tilt * 1.2, y - h - 1), (x - w * .5 - tilt, y - h - 1)]
        d.poly('Turuncu', t, part='kulak_1', clip='e1', shift=2)
        d.poly('Turuncu', mir(t, cx), part='kulak_2', clip='e2', shift=2)


def bebek(d):
    cx = 24
    kulak(d, cx, 14, 29, 13, 22, 4)
    d.ellipse('Krem', (24, 35), (12.8, 12.2), name='g', cast=1)
    d.ellipse('Turuncu', (24, 25.5), (6, 2.2), clip='g')
    d.curve('Turuncu', [(37, 41), (33, 46), (22, 46.5)], 4.6, part='kuyruk', name='k', line=True, lift=0.03)
    d.circle('Krem', (21, 46.5), 2.6, part='kuyruk', clip='k', tone=1)
    d.set_face(24, 33, gap=5)


def genc(d):
    cx = 28
    kulak(d, cx, 17, 33, 14, 26, 4, tip=True)
    d.ellipse('Krem', (28, 41), (15, 15.5), name='g', cast=1)
    d.ellipse('Turuncu', (28, 29.5), (7, 2.4), clip='g')
    d.capsule('Krem', (14, 48), (19, 52), 4.2, part='kol_1', line=True)
    d.capsule('Krem', (42, 48), (37, 52), 4.2, part='kol_2', line=True)
    d.curve('Turuncu', [(43, 46), (47, 53), (34, 53.5)], 5.6, part='kuyruk', name='k', line=True, lift=0.03)
    d.circle('Krem', (33, 53.5), 3, part='kuyruk', clip='k', tone=1)
    d.poly('Cam', [(15, 49), (41, 49), (28, 58)], part='esya', name='b', line=True)
    d.capsule('Cam', (21, 50.5), (28, 56), 1.0, part='esya', clip='b', shift=-1)
    d.set_face(28, 37, gap=5)


def usta(d):
    cx = 32
    # sirtta kucuk yolcu bohcasi (kulagin altindan omuza)
    d.capsule('Turuncu', (47, 34), (56, 58), 1.8, part='esya', name='sap', line=True, lift=-0.2)
    d.circle('Cam', (51, 38), 6.2, part='esya', name='bh', line=True)
    d.capsule('Cam', (47, 37), (59, 41), 1.4, part='esya', clip='bh', shift=-1)
    d.circle('Krem', (50, 33), 1.8, part='esya', line=True)
    kulak(d, cx, 21, 36, 16, 27, 4, tip=True)
    d.curve('Turuncu', [(47, 55), (56, 56), (57, 46)], 8.4, part='kuyruk', name='k', line=True, lift=0.03)
    d.capsule('Turuncu', (49, 56), (55, 51), 1.5, part='kuyruk', clip='k', shift=1)
    d.capsule('Turuncu', (52, 59), (57, 54), 1.5, part='kuyruk', clip='k', shift=1)
    d.capsule('Turuncu', (54, 50), (58, 45), 1.5, part='kuyruk', clip='k', shift=1)
    d.circle('Krem', (57, 43), 3.6, part='kuyruk', clip='k', tone=1)
    d.ellipse('Krem', (32, 46), (17, 20), name='g', cast=1)
    d.ellipse('Turuncu', (32, 32), (8, 2.6), clip='g')
    for x, y in ((17, 53), (23, 58), (32, 59.5), (41, 58), (47, 53)):
        d.circle('Krem', (x, y - 1), 3.8, join='g')
    d.ellipse('Krem', (32, 54.5), (13.5, 4.4), part='govde', line=True, lift=0.12)
    for x in (22, 27, 32, 37, 42):
        d.circle('Krem', (x, 58.3), 2.3, part='govde', join='g2') if False else None
    d.capsule('Krem', (17, 58), (21, 61), 4.6, part='kol_1', line=True)
    d.capsule('Krem', (47, 58), (43, 61), 4.6, part='kol_2', line=True)
    d.set_face(32, 41, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}

# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def kulak_yan(d, x, y, w, h, back, part, name, tip=False, tone_in=1):
    """Tek kulak, ucu arkaya (saga) yatik. (x,y) taban ortasi."""
    L = [(x - w * .5, y), (x - w * .45 + back * .3, y - h * .55), (x - w * .2 + back * .8, y - h * .92), (x + back, y - h),
         (x + w * .35 + back * .8, y - h * .8), (x + w * .55 + back * .4, y - h * .4), (x + w * .55, y)]
    I = [(x - w * .25, y - 1), (x - w * .2 + back * .4, y - h * .5), (x + back * .8, y - h * .8), (x + w * .25 + back * .6, y - h * .55), (x + w * .3, y - 1)]
    d.poly('Turuncu', L, part=part, name=name, line=True, lift=0.03)
    d.poly('Krem', I, part=part, clip=name, tone=tone_in)
    if tip:
        t = [(x - w, y - h * .7), (x + w, y - h * .7), (x + w, y - h - 2), (x - w, y - h - 2)]
        d.poly('Turuncu', t, part=part, clip=name, shift=2)


def bebek_yan(d):
    d.curve('Turuncu', [(33, 42), (40, 39), (41, 31)], 4.6, part='kuyruk', name='k', line=True, lift=0.03)
    d.circle('Krem', (41, 30), 2.6, part='kuyruk', clip='k', tone=1)
    kulak_yan(d, 31, 29, 12, 22, 4, 'kulak_2', 'e2', tone_in=2)
    d.capsule('Krem', (30, 45), (31, 47), 2.6, part='kol_2', line=True)
    d.ellipse('Krem', (25, 35), (12, 11.6), name='g', cast=1)
    d.ellipse('Turuncu', (29, 25), (6.5, 2.2), clip='g')
    d.ellipse('Krem', (13.5, 38), (4, 3), join='g')
    d.pix2((5, 19), ['#'], {'#': 'Komur-4'})
    kulak_yan(d, 21, 29, 13, 23, 4, 'kulak_1', 'e1')
    d.capsule('Krem', (19, 45), (18, 47), 2.6, part='kol_1', line=True)
    d.set_face_side(16, 30)


def genc_yan(d):
    d.curve('Turuncu', [(39, 49), (48, 45), (49, 34)], 5.6, part='kuyruk', name='k', line=True, lift=0.03)
    d.circle('Krem', (49, 33), 3, part='kuyruk', clip='k', tone=1)
    kulak_yan(d, 37, 33, 14, 26, 4, 'kulak_2', 'e2', tip=True, tone_in=2)
    d.capsule('Krem', (35, 52), (36, 55), 3.2, part='kol_2', line=True)
    d.ellipse('Krem', (29, 41), (14.5, 15), name='g', cast=1)
    d.ellipse('Turuncu', (34, 28.5), (7.5, 2.4), clip='g')
    d.ellipse('Krem', (15, 44), (4.6, 3.4), join='g')
    d.pix2((6, 22), ['#'], {'#': 'Komur-4'})
    d.poly('Cam', [(17, 48), (29, 50), (20, 57)], part='esya', name='b', line=True)
    kulak_yan(d, 25, 33, 15, 27, 4, 'kulak_1', 'e1', tip=True)
    d.capsule('Krem', (21, 52), (20, 55), 3.2, part='kol_1', line=True)
    d.set_face_side(18, 36)


def usta_yan(d):
    d.curve('Turuncu', [(43, 56), (52, 54), (52, 41)], 8, part='kuyruk', name='k', line=True, lift=0.03)
    d.capsule('Turuncu', (48, 56), (52, 50), 1.5, part='kuyruk', clip='k', shift=1)
    d.capsule('Turuncu', (51, 49), (52, 44), 1.5, part='kuyruk', clip='k', shift=1)
    d.circle('Krem', (52, 39), 3.4, part='kuyruk', clip='k', tone=1)
    kulak_yan(d, 40, 37, 16, 25, 4, 'kulak_2', 'e2', tip=True, tone_in=2)
    d.capsule('Krem', (39, 62), (40, 65), 3.6, part='kol_2', line=True)
    d.ellipse('Krem', (32, 46), (16.5, 19), name='g', cast=1)
    d.ellipse('Turuncu', (37, 31), (8, 2.6), clip='g')
    for x, y in ((19, 56), (25, 59.5), (33, 60), (41, 58)):
        d.circle('Krem', (x, y - 1), 3.6, join='g')
    d.ellipse('Krem', (16, 49), (5.2, 3.8), join='g')
    d.pix2((6, 25), ['#'], {'#': 'Komur-4'})
    # sirtta bohca (arkada, sagda)
    d.capsule('Turuncu', (40, 36), (47, 56), 1.8, part='esya', name='sap', line=True, lift=-0.2)
    d.circle('Cam', (47, 43), 7, part='esya', name='bh', line=True)
    d.capsule('Cam', (42, 41), (53, 46), 1.4, part='esya', clip='bh', shift=-1)
    d.circle('Krem', (46, 37), 1.8, part='esya', line=True)
    kulak_yan(d, 29, 37, 17, 26, 4, 'kulak_1', 'e1', tip=True)
    d.capsule('Krem', (23, 63), (22, 66), 3.6, part='kol_1', line=True)
    d.set_face_side(20, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
