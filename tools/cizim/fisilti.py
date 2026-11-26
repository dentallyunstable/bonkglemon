# Fisilti (Golge, siradan, ucar, kanatsiz). Tarif: TARIFLER.md. Yastik gibi yumusak, utangac minik hayalet; alt kenari dalgali.
# Renk: Mor (govde), Lacivert (golge/desen), Cam (ruh alevi, usta), Sari (cingirak). Parlak: Mor -> Cam.
PARLA = 'Cam'


def dalga(d, y, xs, r):
    for x in xs:
        d.circle('Mor', (x, y), r, join='g')


def golge(d, c, r):
    d.ellipse('Mor', c, r, clip='g', shift=1)
    d.ellipse('Lacivert', (c[0], c[1] + r[1] * 0.7 + 3.5), (r[0] * 1.9, 3), clip='g', tone=2)


def bebek(d):
    d.flyer = True
    d.ellipse('Mor', (24, 29), (11, 11), name='g', cast=1, lift=0.06)
    d.poly('Mor', [(13, 31), (35, 31), (37.5, 41), (10.5, 41)], join='g')
    dalga(d, 41.5, (14.5, 24, 33.5), 3.7)
    golge(d, (34, 40), (7, 6))
    d.curve('Mor', [(24, 20), (23, 16), (27, 14), (29.5, 17)], 3.0, part='tepe', line=True)
    d.set_face(24, 28, gap=5)


def genc(d):
    d.flyer = True
    d.ellipse('Mor', (28, 29), (13, 12.5), name='g', cast=1, lift=0.06)
    d.poly('Mor', [(14, 32), (42, 32), (45, 45), (11, 45)], join='g')
    dalga(d, 45.5, (16, 28, 40), 4.2)
    golge(d, (40, 43), (8, 8))
    d.curve('Mor', [(28, 18), (27, 13), (31, 11), (34, 14)], 3.2, part='tepe', line=True)
    d.capsule('Mor', (13, 37), (9, 42), 4.4, part='kol_1', line=True)
    d.capsule('Mor', (43, 37), (47, 42), 4.4, part='kol_2', line=True)
    # hic calmayan cingirak
    d.circle('Sari', (28, 43), 3.0, part='esya', line=True)
    d.pix((27, 43), ['#.'], {'#': 'Lacivert-3'}, part='esya')
    d.set_face(28, 28, gap=5)


def usta(d):
    d.flyer = True
    cx = 30
    # uzun dalgali kuyruk: govdeden saga kivrilir, ucu yukari
    d.curve('Mor', [(38, 44), (47, 46), (54, 42), (55, 34)], 8, part='kuyruk', name='ku', line=True, lift=-0.04)
    d.circle('Mor', (55, 32), 3.4, part='kuyruk', join='ku')
    d.ellipse('Mor', (cx, 34), (15.5, 13.5), name='g', cast=1, lift=0.06)
    d.poly('Mor', [(14.5, 36), (45.5, 36), (48, 48), (12, 48)], join='g')
    for x in (17, 26, 34, 43):
        d.circle('Mor', (x, 48.5), 4.3, join='g')
    golge(d, (42, 46), (9, 9))
    # kapusonu andiran sivri bas
    d.poly('Mor', [(19, 28), (cx - 1, 16), (cx + 2, 10), (cx + 5, 16), (cx + 10, 28)], join='g')
    d.curve('Mor', [(cx + 2, 12), (cx + 4, 8), (cx + 8, 8)], 3.0, part='tepe', line=True)
    # ruh alevini tutan el
    d.capsule('Mor', (15, 42), (11, 33), 4.6, part='kol_1', line=True)
    d.capsule('Mor', (45, 42), (48, 48), 4.6, part='kol_2', line=True)
    d.poly('Cam', [(11, 18), (8, 24), (7, 30), (11, 33), (15, 30), (14, 24)], part='esya', name='al', line=True)
    d.ellipse('Cam', (10.5, 29), (1.6, 2.4), part='esya', clip='al', shift=-2)
    d.set_face(cx, 31, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def bebek_yan(d):
    d.flyer = True
    d.ellipse('Mor', (23, 29), (11, 11), name='g', cast=1, lift=0.06)
    d.poly('Mor', [(12, 31), (34, 31), (41, 41), (11, 41)], join='g')
    dalga(d, 41.5, (14.5, 22, 29.5), 3.7)
    d.circle('Mor', (38, 40), 3.2, join='g')
    golge(d, (34, 40), (7, 6))
    d.curve('Mor', [(26, 20), (28, 16), (32, 15), (34, 18)], 3.0, part='tepe', line=True)
    d.set_face_side(14, 28)


def genc_yan(d):
    d.flyer = True
    d.ellipse('Mor', (27, 29), (13, 12.5), name='g', cast=1, lift=0.06)
    d.poly('Mor', [(14, 32), (36, 32), (47, 46), (12, 45)], join='g')
    dalga(d, 45.5, (16, 25, 34), 4.2)
    d.circle('Mor', (43, 44), 3.4, join='g')
    golge(d, (38, 43), (8, 8))
    d.curve('Mor', [(31, 18), (33, 13), (37, 12), (39, 15)], 3.2, part='tepe', line=True)
    d.capsule('Mor', (15, 39), (11, 44), 4.4, part='kol_1', line=True)
    d.circle('Sari', (18, 43), 3.0, part='esya', line=True)
    d.pix((17, 43), ['#.'], {'#': 'Lacivert-3'}, part='esya')
    d.set_face_side(15, 28)


def usta_yan(d):
    d.flyer = True
    cx = 32
    d.curve('Mor', [(40, 44), (49, 47), (56, 43), (57, 35)], 8, part='kuyruk', name='ku', line=True, lift=-0.04)
    d.circle('Mor', (57, 33), 3.4, part='kuyruk', join='ku')
    d.ellipse('Mor', (cx, 34), (15.5, 13.5), name='g', cast=1, lift=0.06)
    d.poly('Mor', [(17, 36), (44, 36), (47, 48), (15, 48)], join='g')
    for x in (20, 28, 36):
        d.circle('Mor', (x, 48.5), 4.3, join='g')
    golge(d, (40, 46), (9, 9))
    d.poly('Mor', [(21, 28), (cx - 2, 16), (cx + 2, 10), (cx + 5, 16), (cx + 11, 28)], join='g')
    d.curve('Mor', [(cx + 3, 12), (cx + 5, 8), (cx + 9, 8)], 3.0, part='tepe', line=True)
    d.capsule('Mor', (19, 43), (13, 36), 4.6, part='kol_1', line=True)
    d.poly('Cam', [(8, 18), (5, 24), (4, 30), (8, 34), (12, 30), (11, 24)], part='esya', name='al', line=True)
    d.ellipse('Cam', (7.5, 29), (1.6, 2.4), part='esya', clip='al', shift=-2)
    d.set_face_side(21, 32)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
