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


def hilal(d, x, y, r, rot_dx=1.6):
    d.circle('Sari', (x, y), r, part='kuyruk', name='hl', line=True)
    d.circle('Sari', (x - rot_dx, y - 0.4), r - 0.8, part='kuyruk', sub='hl')
    d.pix((int(x + r - 2), int(y - r + 1)), ['oo'], {'o': 'Parilti'}, part='kuyruk')


def yildiz(d, x, y):
    d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='govde')


def bebek(d):
    cx = 24
    kulaklar(d, cx, [(11, 31), (9, 15), (13, 11), (23, 23), (22, 31)], [(12.5, 28), (11.5, 17), (14, 15.5), (20, 23), (20, 28)])
    # kisa kuyruk
    d.capsule('Lacivert', (35, 44), (41, 40), 4.4, part='kuyruk', line=True, lift=0.05)
    d.ellipse('Lacivert', (24, 35.5), (12.5, 11), name='g', cast=1, lift=0.12)
    d.ellipse('Lacivert', (24, 44), (7, 3.5), clip='g', shift=-1)
    d.circle('Lacivert', (16, 46), 3.2, join='g')
    d.circle('Lacivert', (32, 46), 3.2, join='g')
    d.set_face(24, 33, gap=5)


def genc(d):
    cx = 28
    kulaklar(d, cx, [(13, 32), (10, 14), (14, 9), (26, 22), (25, 32)], [(14.5, 29), (12.5, 16), (15, 13.5), (23, 22), (23, 29)])
    # uzun kuyruk, ucu hilal
    d.curve('Lacivert', [(40, 49), (48, 49), (51, 42), (48, 36)], 4.6, part='kuyruk', line=True, lift=0.05)
    hilal(d, 48, 33, 5.2)
    d.ellipse('Lacivert', (28, 40), (14, 12.5), name='g', cast=1, lift=0.12)
    d.ellipse('Lacivert', (28, 49), (8, 4), clip='g', shift=-1)
    d.circle('Lacivert', (19, 51), 3.4, join='g')
    d.circle('Lacivert', (37, 51), 3.4, join='g')
    d.capsule('Lacivert', (17, 47), (19, 52), 4.6, part='kol_1', line=True, lift=0.1)
    d.capsule('Lacivert', (39, 47), (37, 52), 4.6, part='kol_2', line=True, lift=0.1)
    yildiz(d, 28, 29)
    d.set_face(28, 36, gap=5)


def usta(d):
    cx = 32
    kulaklar(d, cx, [(15, 34), (11, 12), (16, 6), (31, 22), (30, 34)], [(16.5, 31), (13.5, 14), (16.5, 11), (27, 22), (27, 31)])
    d.curve('Lacivert', [(46, 57), (55, 56), (58, 48), (55, 40)], 5.6, part='kuyruk', line=True, lift=0.05)
    hilal(d, 54, 36, 6.4)
    d.ellipse('Lacivert', (32, 44), (17, 15.5), name='g', cast=1, lift=0.12)
    d.ellipse('Lacivert', (32, 54), (10, 4.5), clip='g', shift=-1)
    d.circle('Lacivert', (21, 57), 3.8, join='g')
    d.circle('Lacivert', (43, 57), 3.8, join='g')
    d.capsule('Lacivert', (20, 53), (22, 59), 5.2, part='kol_1', line=True, lift=0.1)
    d.capsule('Lacivert', (44, 53), (42, 59), 5.2, part='kol_2', line=True, lift=0.1)
    # altin can tasmasi
    d.capsule('Sari', (22, 50.5), (42, 50.5), 2.2, part='esya', line=True)
    d.circle('Sari', (32, 54), 2.8, part='esya', line=True, lift=0.1)
    d.pix((31, 54), ['o'], {'o': 'Lacivert-3'}, part='esya')
    for x, y in ((20, 38), (44, 40), (22, 28)):
        yildiz(d, x, y)
    d.set_face(32, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
