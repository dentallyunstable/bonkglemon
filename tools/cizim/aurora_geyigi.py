# Aurora Geyigi (Buz, epik). Tarif: TARIFLER.md. Boynuzlarinin arasinda kuzey isiklari tasiyan beyaz geyik yavrusu; isiklar asili kurdele gibi.
# Renk: Kar (tuy), Cam (isik, kurdele), Mor (kurdele sonu, kulak ici, toynak). Isik kaynagi: boynuz tomurcugu + kurdeleler. Parlak: Cam -> Sari.
PARLA = 'Cam'


def kulak(d, cx, y, dx, rx, ry, rot):
    d.ellipse('Kar', (cx - dx, y), (rx, ry), rot=-rot, part='kulak_1', name='e1', line=True, lift=0.1)
    d.ellipse('Mor', (cx - dx - 0.3, y + 0.3), (rx - 1.8, ry - 1.5), rot=-rot, part='kulak_2' if False else 'kulak_1', clip='e1', tone=1)
    d.ellipse('Kar', (cx + dx, y), (rx, ry), rot=rot, part='kulak_2', name='e2', line=True, lift=0.1)
    d.ellipse('Mor', (cx + dx + 0.3, y + 0.3), (rx - 1.8, ry - 1.5), rot=rot, part='kulak_2', clip='e2', tone=1)


def dal(d, a, b, w, **kw):
    d.capsule('Krem', a, b, w, part='tepe', line=True, lift=0.0, **kw)


def bebek(d):
    cx = 24
    # boynuz tomurcuklari: yesil parlayan
    for s in (-1, 1):
        d.capsule('Krem', (cx + s * 5, 26), (cx + s * 6.5, 21.5), 3.6, part='tepe', line=True)
        d.circle('Cam', (cx + s * 6.8, 19.2), 3.0, part='tepe', line=True, lift=0.25)
    d.pix((cx - 9, 16.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.pix((cx + 5, 16.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    kulak(d, cx, 28, 12, 4.4, 2.8, 28)
    d.ellipse('Kar', (cx, 36), (13.8, 13.2), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 43.5), (8.5, 4.8), name='karin', lift=0.28)
    d.ellipse('Mor', (cx - 4.5, 47.5), (2.6, 1.6), name='t1', part='kol_1', line=True, noshadow=True)
    d.ellipse('Mor', (cx + 4.5, 47.5), (2.6, 1.6), name='t2', part='kol_2', line=True, noshadow=True)
    d.set_face(cx, 33, gap=5)


def genc(d):
    cx = 28
    # dallanan boynuzlar
    for s in (-1, 1):
        dal(d, (cx + s * 6, 28), (cx + s * 9.5, 18.5), (5.2, 3.6))
        dal(d, (cx + s * 9, 22), (cx + s * 15.5, 18.5), 3.2)
        dal(d, (cx + s * 9.5, 18.5), (cx + s * 11.5, 13), 3.2)
    # tek yesil isik kurdelesi: iki boynuz ucu arasinda sarkar
    d.curve('Cam', [(cx - 11, 14.5), (cx - 6, 19), (cx, 20.5), (cx + 6, 19), (cx + 11, 14.5)], 2.6, part='tepe', line=True, lift=0.15)
    d.circle('Cam', (cx - 11.5, 13.2), 2.0, part='tepe', lift=0.3)
    d.circle('Cam', (cx + 11.5, 13.2), 2.0, part='tepe', lift=0.3)
    d.pix((cx - 5, 19), ['oo'], {'o': 'Parilti'}, part='tepe')
    kulak(d, cx, 30.5, 13.5, 4.8, 2.8, 28)
    d.ellipse('Kar', (cx, 41.5), (14.8, 15.8), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 49), (9.5, 7), name='karin', lift=0.28)
    d.ellipse('Kar', (cx - 6.5, 54), (2.8, 4.2), part='kol_1', line=True, name='b1', lift=0.1)
    d.ellipse('Kar', (cx + 6.5, 54), (2.8, 4.2), part='kol_2', line=True, name='b2', lift=0.1)
    d.ellipse('Mor', (cx - 6.5, 56.4), (2.9, 1.6), part='kol_1', clip='b1', tone=2)
    d.ellipse('Mor', (cx + 6.5, 56.4), (2.9, 1.6), part='kol_2', clip='b2', tone=2)
    d.set_face(cx, 36, gap=5)


def usta(d):
    cx = 32
    # genis dalli boynuzlar
    for s in (-1, 1):
        dal(d, (cx + s * 9, 30), (cx + s * 14, 21), (6.2, 4.2))
        dal(d, (cx + s * 14, 21), (cx + s * 15, 12.5), 3.8)
        dal(d, (cx + s * 12, 24), (cx + s * 23, 20), 3.8)
        dal(d, (cx + s * 23, 20), (cx + s * 26, 14), 3.2)
        dal(d, (cx + s * 15.5, 16.5), (cx + s * 21, 12.5), 3.0)
    # uc kurdele: yesilden mora
    d.curve('Mor', [(cx - 15, 14), (cx - 8, 17), (cx, 18), (cx + 8, 17), (cx + 15, 14)], 2.8, part='tepe', line=True, lift=0.1)
    d.curve('Cam', [(cx - 14, 18.5), (cx - 7, 21.5), (cx, 22.5), (cx + 7, 21.5), (cx + 14, 18.5)], 2.8, part='tepe', line=True, lift=0.0)
    d.curve('Cam', [(cx - 11, 22.5), (cx - 5, 25.5), (cx, 26.5), (cx + 5, 25.5), (cx + 11, 22.5)], 2.8, part='tepe', line=True, lift=0.3)
    d.pix((cx - 9, 16.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.pix((cx + 5, 21), ['oo'], {'o': 'Parilti'}, part='tepe')
    for s in (-1, 1):
        d.circle('Cam', (cx + s * 15, 11.5), 2.0, part='tepe', lift=0.3)
        d.circle('Cam', (cx + s * 26, 13), 2.0, part='tepe', lift=0.3)
    kulak(d, cx, 36, 17, 5.6, 3.3, 30)
    d.ellipse('Kar', (cx, 50), (17.4, 17.4), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 39.5), (15.4, 13.5), name='kafa', join='g')
    d.ellipse('Kar', (cx, 59), (11, 7.4), name='karin', lift=0.28)
    # kabarik kis yakasi
    d.ellipse('Kar', (cx, 53.5), (14.5, 4.4), name='yaka', line=True, cast=1, lift=0.3)
    for x in (-12, -8, -4, 0, 4, 8, 12):
        d.circle('Kar', (cx + x, 54.9 + (0.8 if x % 8 == 0 else 0)), 2.6, join='yaka')
    d.ellipse('Kar', (cx - 9.5, 60), (3.2, 5), part='kol_1', line=True, name='b1', lift=0.1)
    d.ellipse('Kar', (cx + 9.5, 60), (3.2, 5), part='kol_2', line=True, name='b2', lift=0.1)
    d.ellipse('Mor', (cx - 9.5, 63), (3.3, 1.9), part='kol_1', clip='b1', tone=2)
    d.ellipse('Mor', (cx + 9.5, 63), (3.3, 1.9), part='kol_2', clip='b2', tone=2)
    d.set_face(cx, 41, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
