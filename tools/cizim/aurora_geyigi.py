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


def dal_y(d, a, b, w, lift=0.0):
    d.capsule('Krem', a, b, w, part='tepe', line=True, lift=lift)


def kulak_yan_a(d, x, y, rx, ry, rot, part, name, back=False):
    d.ellipse('Kar', (x, y), (rx, ry), rot=rot, part=part, name=name, line=True, lift=-0.05 if back else 0.1)
    d.ellipse('Mor', (x + 0.3, y + 0.3), (rx - 1.8, ry - 1.5), rot=rot, part=part, clip=name, tone=2 if back else 1)


def bebek_yan(d):
    # uzak boynuz tomurcugu (arkada), yakin tomurcuk onde
    d.capsule('Krem', (30, 27), (32, 22), 3.4, part='tepe', line=True, lift=-0.15)
    d.circle('Cam', (32.4, 19.8), 2.8, part='tepe', line=True, lift=0.1)
    d.capsule('Kar', (36, 40), (40, 37), (3.6, 2.4), part='kuyruk', line=True)
    kulak_yan_a(d, 31, 29, 4.4, 2.8, -28, 'kulak_2', 'e2', back=True)
    d.ellipse('Mor', (33, 48.5), (2.6, 1.6), part='kol_2', line=True, noshadow=True)
    d.ellipse('Kar', (27, 37), (12.5, 12.3), name='g', cast=1, lift=0.2)
    d.circle('Kar', (21, 34), 9, join='g')
    d.ellipse('Kar', (14.5, 38), (4, 3.2), join='g')
    d.pix2((6, 19), ['#'], {'#': 'Komur-4'})
    d.ellipse('Kar', (27, 44.5), (8, 4.6), name='karin', lift=0.28)
    d.capsule('Krem', (23, 27), (24.5, 21.5), 3.6, part='tepe', line=True)
    d.circle('Cam', (24.8, 19.2), 3.0, part='tepe', line=True, lift=0.25)
    d.pix((22, 16.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    kulak_yan_a(d, 28.5, 31, 4.4, 2.8, -28, 'kulak_1', 'e1')
    d.ellipse('Mor', (21, 48.5), (2.6, 1.6), part='kol_1', line=True, noshadow=True)
    d.set_face_side(15, 31)


def genc_yan(d):
    # uzak boynuz (koyu, arkada)
    dal_y(d, (35, 30), (40, 19), (4.6, 3.2), lift=-0.2)
    dal_y(d, (38, 24), (46, 22), 2.8, lift=-0.2)
    d.capsule('Kar', (40, 44), (45, 40), (4.2, 2.8), part='kuyruk', line=True)
    kulak_yan_a(d, 35, 33, 4.8, 2.8, -28, 'kulak_2', 'e2', back=True)
    d.ellipse('Mor', (36, 57.4), (2.9, 1.6), part='kol_2', line=True, noshadow=True)
    d.ellipse('Kar', (31, 42), (14, 14.5), name='g', cast=1, lift=0.2)
    d.circle('Kar', (23, 37), 10, join='g')
    d.ellipse('Kar', (14.5, 41), (4.6, 3.6), join='g')
    d.pix2((6, 21), ['#'], {'#': 'Komur-4'})
    d.ellipse('Kar', (31, 49), (9.5, 6.5), name='karin', lift=0.28)
    # yakin boynuz: arkaya yatik, dallanir
    dal_y(d, (24, 31), (30, 17), (5.6, 3.6))
    dal_y(d, (28, 22), (38, 19), 3.4)
    dal_y(d, (30, 17), (29, 10.5), 3.2)
    # isik kurdelesi: arka dal ucundan sarkar
    d.curve('Cam', [(38, 18.5), (45, 22), (47, 31), (44, 40)], 2.8, part='tepe', line=True, lift=0.15)
    d.circle('Cam', (29, 9.6), 2.0, part='tepe', lift=0.3)
    d.circle('Cam', (38.5, 18.2), 2.0, part='tepe', lift=0.3)
    d.pix((25, 21), ['oo'], {'o': 'Parilti'}, part='tepe')
    kulak_yan_a(d, 29, 35, 4.8, 2.8, -28, 'kulak_1', 'e1')
    d.ellipse('Kar', (24, 54), (2.9, 4.2), part='kol_1', line=True, name='b1', lift=0.1)
    d.ellipse('Mor', (24, 56.4), (3.0, 1.6), part='kol_1', clip='b1', tone=2)
    d.set_face_side(15, 36)


def usta_yan(d):
    # uzak boynuz
    dal_y(d, (41, 33), (47, 21), (5.4, 3.8), lift=-0.2)
    dal_y(d, (47, 21), (47, 12), 3.4, lift=-0.2)
    dal_y(d, (44, 26), (54, 22), 3.4, lift=-0.2)
    d.capsule('Kar', (48, 54), (54, 50), (5, 3.2), part='kuyruk', line=True)
    kulak_yan_a(d, 41, 38, 5.6, 3.3, -30, 'kulak_2', 'e2', back=True)
    d.ellipse('Kar', (43, 61), (3.2, 5), part='kol_2', line=True, name='b2', lift=-0.05)
    d.ellipse('Mor', (43, 63.8), (3.3, 1.9), part='kol_2', clip='b2', tone=2)
    d.ellipse('Kar', (35, 50), (17, 16), name='g', cast=1, lift=0.2)
    d.circle('Kar', (26, 41), 12.5, join='g')
    d.ellipse('Kar', (16.5, 45), (5.4, 4.2), join='g')
    d.pix2((7, 25), ['#'], {'#': 'Komur-4'})
    d.ellipse('Kar', (34, 59), (11, 7.2), name='karin', lift=0.28)
    d.ellipse('Kar', (28, 54), (13, 4.4), name='yaka', line=True, cast=1, lift=0.3)
    for x in (-10, -5, 0, 5, 10):
        d.circle('Kar', (28 + x, 55.2 + (0.8 if x % 10 == 0 else 0)), 2.6, join='yaka')
    # yakin boynuz: genis, arkaya dogru dalli
    dal_y(d, (26, 33), (33, 18), (6.0, 4.2))
    dal_y(d, (33, 18), (32, 8.5), 3.8)
    dal_y(d, (30, 24), (42, 20), 3.8)
    dal_y(d, (42, 20), (46, 12.5), 3.2)
    # uc kurdele: arka dallardan arkaya akar (morla yesil)
    d.curve('Mor', [(45, 12), (52, 17), (55, 28), (54, 40)], 2.8, part='tepe', line=True, lift=0.1)
    d.curve('Cam', [(42, 21), (49, 26), (51, 36), (49, 46)], 2.8, part='tepe', line=True, lift=0.25)
    d.pix((28, 17), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.pix((37, 24), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.circle('Cam', (32.5, 7.5), 2.0, part='tepe', lift=0.3)
    d.circle('Cam', (46.5, 11.5), 2.0, part='tepe', lift=0.3)
    kulak_yan_a(d, 31, 38, 5.6, 3.3, -30, 'kulak_1', 'e1')
    d.ellipse('Kar', (25, 60), (3.2, 5), part='kol_1', line=True, name='b1', lift=0.1)
    d.ellipse('Mor', (25, 63), (3.3, 1.9), part='kol_1', clip='b1', tone=2)
    d.set_face_side(16, 41)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
