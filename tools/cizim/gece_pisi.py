# Gece Pisisi (Golge, siradan). Tarif: TARIFLER.md. Ince, iri kulakli, gece mavisi kedi yavrusu; kuyrugunun ucu parlayan hilal.
# Renk: Lacivert (govde), Mor (kulak ici, golge, patiler), Sari (hilal, can, yildiz benek). Parlak: Lacivert -> Krem.
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kulaklar(d, cx, L, I):
    d.poly('Lacivert', L, part='kulak_1', name='e1', line=True, lift=0.1)
    d.poly('Mor', I, part='kulak_1', clip='e1', tone=2)
    d.poly('Lacivert', mir(L, cx), part='kulak_2', name='e2', line=True, lift=0.1)
    d.poly('Mor', mir(I, cx), part='kulak_2', clip='e2', tone=2)


def hilal(d, x, y, r):
    d.circle('Sari', (x, y), r, part='kuyruk', name='hl', line=True)
    d.circle('Sari', (x - 2.6, y), r - 0.6, part='kuyruk', sub='hl')
    d.pix((int(x + r - 3), int(y - 2)), ['o', 'o'], {'o': 'Parilti'}, part='kuyruk')


def yildiz(d, x, y):
    d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')


def bebek(d):
    cx = 24
    kulaklar(d, cx, [(12, 28), (11, 13), (14, 10), (22, 21), (22, 28)], [(13.5, 25), (13, 15), (15, 13.5), (19, 20), (19, 25)])
    d.capsule('Lacivert', (33, 44), (40, 41), 4.4, part='kuyruk', line=True, lift=0.05)
    d.ellipse('Lacivert', (24, 39.5), (10.5, 7), name='g', cast=1, lift=0.12)
    d.ellipse('Lacivert', (24, 30), (13, 10.5), name='h', lift=0.12, join='g')
    d.ellipse('Lacivert', (24, 43), (5, 3), clip='g', shift=-1)
    d.capsule('Lacivert', (19, 43), (19, 46), 4.4, part='kol_1', line=True, lift=0.15)
    d.capsule('Lacivert', (29, 43), (29, 46), 4.4, part='kol_2', line=True, lift=0.15)
    d.set_face(24, 30, gap=5)


def genc(d):
    cx = 28
    kulaklar(d, cx, [(15, 28), (13, 10), (16, 6), (26, 18), (26, 28)], [(16.5, 25), (15.5, 12), (17, 10.5), (23, 18), (23, 25)])
    d.curve('Lacivert', [(38, 52), (47, 53), (50, 46), (48, 40)], 4.6, part='kuyruk', line=True, lift=0.05)
    hilal(d, 47, 34, 6)
    d.ellipse('Lacivert', (28, 43.5), (11.5, 10), name='g', cast=1, lift=0.12)
    d.ellipse('Lacivert', (28, 32), (14, 11.5), name='h', join='g', lift=0.12)
    d.ellipse('Lacivert', (28, 49), (6, 4.5), clip='g', shift=-1)
    d.capsule('Lacivert', (22, 49), (22, 53), 5, part='kol_1', line=True, lift=0.15)
    d.capsule('Lacivert', (34, 49), (34, 53), 5, part='kol_2', line=True, lift=0.15)
    yildiz(d, 28, 25)
    d.set_face(28, 31, gap=5)


def usta(d):
    cx = 32
    kulaklar(d, cx, [(16, 31), (13, 8), (17, 3), (30, 17), (30, 31)], [(17.5, 28), (16, 10), (18, 8.5), (26, 17), (26, 28)])
    d.curve('Lacivert', [(43, 58), (53, 59), (57, 50), (54, 44)], 5.6, part='kuyruk', line=True, lift=0.05)
    hilal(d, 53, 38, 7.2)
    d.ellipse('Lacivert', (32, 49.5), (13.5, 11.5), name='g', cast=1, lift=0.12)
    d.ellipse('Lacivert', (32, 34), (16.5, 13.5), name='h', join='g', lift=0.12)
    d.ellipse('Lacivert', (32, 56), (7, 4.5), clip='g', shift=-1)
    d.capsule('Lacivert', (25, 55), (25, 59.5), 5.6, part='kol_1', line=True, lift=0.15)
    d.capsule('Lacivert', (39, 55), (39, 59.5), 5.6, part='kol_2', line=True, lift=0.15)
    # altin can tasmasi (yuzun altinda)
    d.capsule('Sari', (24, 47.5), (40, 47.5), 2.0, part='esya', line=True)
    d.circle('Sari', (32, 51), 2.6, part='esya', line=True, lift=0.1)
    d.pix((31, 51), ['o'], {'o': 'Lacivert-3'}, part='esya')
    for x, y in ((22, 53), (42, 53), (32, 26)):
        yildiz(d, x, y)
    d.set_face(32, 35, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def kulak_y(d, pts, ipts, part, name, tone_in=2, lift=0.1):
    d.poly('Lacivert', pts, part=part, name=name, line=True, lift=lift)
    d.poly('Mor', ipts, part=part, clip=name, tone=tone_in)


def bebek_yan(d):
    kulak_y(d, [(23, 25), (23, 11), (27, 9), (31, 24)], [(24.5, 23), (24.5, 14), (27, 13), (29, 22)], 'kulak_2', 'e2', 3, 0.0)
    d.curve('Lacivert', [(34, 42), (41, 41), (42, 33)], 4.4, part='kuyruk', line=True, lift=0.05)
    d.capsule('Lacivert', (30, 43), (30, 46), 4.4, part='kol_2', line=True, lift=0.0)
    d.ellipse('Lacivert', (28, 39.5), (11.5, 7), name='g', cast=1, lift=0.12)
    d.circle('Lacivert', (19, 32), 10.5, name='h', lift=0.12, join='g')
    d.ellipse('Lacivert', (28, 43), (5, 3), clip='g', shift=-1)
    kulak_y(d, [(14, 26), (13, 11), (17, 9), (24, 22)], [(15.5, 24), (15, 14), (17.5, 13), (21, 21)], 'kulak_1', 'e1')
    d.capsule('Lacivert', (18, 43), (18, 46), 4.4, part='kol_1', line=True, lift=0.15)
    d.set_face_side(12, 30)


def genc_yan(d):
    kulak_y(d, [(26, 28), (26, 11), (30, 8), (36, 25)], [(27.5, 26), (27.5, 14), (30, 12), (33.5, 24)], 'kulak_2', 'e2', 3, 0.0)
    d.curve('Lacivert', [(40, 50), (46, 51), (49, 45), (47, 39)], 4.6, part='kuyruk', line=True, lift=0.05)
    hilal_y(d, 47, 34, 6)
    d.capsule('Lacivert', (36, 50), (36, 54), 5, part='kol_2', line=True, lift=0.0)
    d.ellipse('Lacivert', (32, 44), (13, 9.5), name='g', cast=1, lift=0.12)
    d.circle('Lacivert', (21, 35), 12, name='h', join='g', lift=0.12)
    d.ellipse('Lacivert', (32, 49), (6, 4), clip='g', shift=-1)
    kulak_y(d, [(15, 29), (14, 10), (19, 7), (27, 24)], [(16.5, 27), (16, 13), (19, 11.5), (24, 23)], 'kulak_1', 'e1')
    d.capsule('Lacivert', (21, 50), (21, 54), 5, part='kol_1', line=True, lift=0.15)
    yildiz(d, 24, 27)
    d.set_face_side(12, 34)


def hilal_y(d, x, y, r):
    d.circle('Sari', (x, y), r, part='kuyruk', name='hl', line=True)
    d.circle('Sari', (x - 3.2, y + 0.6), r - 0.4, part='kuyruk', sub='hl')
    d.pix((int(x + r - 3), int(y - 2)), ['o', 'o'], {'o': 'Parilti'}, part='kuyruk')


def usta_yan(d):
    kulak_y(d, [(29, 31), (28, 9), (33, 4), (41, 27)], [(30.5, 29), (30, 12), (33, 9.5), (38, 26)], 'kulak_2', 'e2', 3, 0.0)
    d.curve('Lacivert', [(44, 58), (52, 59), (56, 51), (53, 44)], 5.6, part='kuyruk', line=True, lift=0.05)
    hilal_y(d, 53, 38, 7.2)
    d.capsule('Lacivert', (41, 56), (41, 60), 5.6, part='kol_2', line=True, lift=0.0)
    d.ellipse('Lacivert', (36, 50), (15, 11), name='g', cast=1, lift=0.12)
    d.circle('Lacivert', (23, 38), 14, name='h', join='g', lift=0.12)
    d.ellipse('Lacivert', (36, 56), (7, 4.5), clip='g', shift=-1)
    kulak_y(d, [(15, 32), (14, 8), (20, 3), (30, 28)], [(17, 30), (16.5, 12), (20, 9.5), (26.5, 27)], 'kulak_1', 'e1')
    d.capsule('Sari', (14, 46.5), (28, 48.5), 2.0, part='esya', line=True)
    d.circle('Sari', (21, 51), 2.6, part='esya', line=True, lift=0.1)
    d.pix((20, 51), ['o'], {'o': 'Lacivert-3'}, part='esya')
    d.capsule('Lacivert', (25, 56), (25, 60), 5.6, part='kol_1', line=True, lift=0.15)
    for x, y in ((29, 31), (40, 44)):
        yildiz(d, x, y)
    d.set_face_side(14, 36)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
