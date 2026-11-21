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
