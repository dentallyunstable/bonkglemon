# Bosluk Kurdu (Golge, siradan). Tarif: TARIFLER.md. Sarkik kulakli, sakar mor kurt yavrusu; agzinin ici yildizli bosluk, hep mor salya damlasi.
# Renk: Mor (tuy), Lacivert (agiz ici, kulak, golge), Pembe (dil). Parlak: Mor -> Gok.
PARLA = 'Mor'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def agiz(d, cx, y, w, h, yildiz=False):
    """Acik agiz: Lacivert ic, Pembe dil, istege bagli yildizlar."""
    d.ellipse('Lacivert', (cx, y), (w, h), part='govde', name='ag', shade='flat', tone=3)
    d.ellipse('Pembe', (cx + 0.5, y + h - 0.5), (w * 0.5, h * 0.5), part='govde', clip='ag', shade='flat', tone=2)
    if yildiz:
        d.pix((int(cx - w + 2), int(y - h + 1)), ['o'], {'o': 'Parilti'})
        d.pix((int(cx + w - 3), int(y - h + 2)), ['o'], {'o': 'Parilti'})
        d.pix((int(cx - 1), int(y - h + 1)), ['o'], {'o': 'Sari-1'})


def damla(d, x, y, r):
    x = int(x); y = int(y)
    d.pix((x - 1, y), ['.#.', '###', '###', '.#.'], {'#': 'Mor-4'}, part='esya')
    d.pix((x - 1, y + 1), ['o'], {'o': 'Parilti'}, part='esya')


def burun(d, cx, ey):
    d.pix((cx - 1, ey + 4), ['##'], {'#': 'Lacivert-4'})


def sarkik(d, cx, top, side, n):
    """Kafanin ust yanindan one sarkan yavru kulagi (govdenin ONUNDE), ucu Lacivert."""
    L = [(cx - 9.5, top), (cx - 4.5, top - 1.5), (cx - 8, top + 6), (cx - 11.5, top + 10.5), (cx - 13.5, top + 7)]
    if side > 0:
        L = mir(L, cx)
    d.poly('Mor', L, part='kulak_%d' % (1 if side < 0 else 2), name=n, line=True, lift=-0.1)
    tip = [(cx - 15, top + 6), (cx - 8, top + 6), (cx - 10, top + 12), (cx - 15, top + 10)]
    d.poly('Lacivert', mir(tip, cx) if side > 0 else tip, clip=n, tone=3)


def burun_cikinti(d, cx, y, rx, ry):
    """Kurt burnu: acik renk cikinti, ustunde ucgen Lacivert burun."""
    d.ellipse('Mor', (cx, y), (rx, ry), name='bu', shade='flat', tone=1, line=True)
    d.pix((int(cx) - 1, int(y - ry) + 1), ['###', '.#.'], {'#': 'Lacivert-4'}, keep=True)


def bebek(d):
    cx = 24
    d.ellipse('Mor', (24, 36), (13.5, 11.5), name='g', cast=1, lift=0.1)
    for x, y in ((14, 44), (34, 44), (24, 47)):
        d.circle('Mor', (x, y), 3.4, join='g')
    d.ellipse('Mor', (24, 44), (6, 4), clip='g', shift=-1)
    d.curve('Mor', [(37, 45), (43, 44), (44, 38)], 4.2, part='kuyruk', line=True)
    sarkik(d, cx, 26, -1, 'k1')
    sarkik(d, cx, 26, 1, 'k2')
    burun_cikinti(d, 24.5, 39, 4.6, 3.0)
    d.set_face(24, 30, gap=5, mouth=False)
    d.pix((23, 42), ['##', '##'], {'#': 'Pembe-2'})
    damla(d, 27, 41, 1.8)


def genc(d):
    cx = 28
    e = [(31, 27), (36, 16), (38.5, 14.5), (41, 30)]
    d.poly('Mor', e, part='kulak_2', name='e2', line=True, lift=-0.05)
    d.poly('Lacivert', [(33.5, 26), (37, 19), (38.5, 18), (39.5, 27)], part='kulak_2', clip='e2', tone=2)
    d.ellipse('Mor', (28, 37), (13.5, 11.5), name='g', cast=1, lift=0.1)
    d.ellipse('Mor', (28, 47), (11, 8.5), name='b', cast=1, join='g')
    for x, y in ((18, 52), (38, 52), (28, 55)):
        d.circle('Mor', (x, y), 3.6, join='g')
    # kabarik yele (onde, acik, dalgali alt kenar)
    d.ellipse('Mor', (28, 48), (13.5, 6.5), part='govde', name='m', lift=0.22, line=True)
    for x in (17, 23, 28, 33, 39):
        d.circle('Mor', (x, 53), 3.4, part='govde', join='m')
    d.capsule('Mor', (21, 53), (21, 56), 4.6, part='kol_1', line=True, lift=0.05)
    d.capsule('Mor', (35, 53), (35, 56), 4.6, part='kol_2', line=True, lift=0.05)
    d.curve('Mor', [(40, 50), (47, 50), (48, 42)], 4.8, part='kuyruk', line=True)
    sarkik(d, 28, 28, -1, 'e1')
    burun_cikinti(d, 28.5, 41.5, 5.0, 3.2)
    d.set_face(28, 32, gap=5, mouth=False)
    d.pix((27, 44), ['##', '##'], {'#': 'Pembe-2'})
    damla(d, 32, 43, 2.0)


def usta(d):
    cx = 32
    kL = [(16, 30), (17, 20), (15, 15), (19, 15.5), (22.5, 19), (29, 27)]
    iL = [(18.5, 27.5), (19, 21), (21.5, 20.5), (25.5, 26)]
    d.poly('Mor', kL, part='kulak_1', name='e1', line=True, lift=-0.05)
    d.poly('Lacivert', iL, part='kulak_1', clip='e1', tone=2)
    d.poly('Mor', mir(kL, cx), part='kulak_2', name='e2', line=True, lift=-0.05)
    d.poly('Lacivert', mir(iL, cx), part='kulak_2', clip='e2', tone=2)
    d.curve('Mor', [(47, 58), (54, 56), (56, 49)], 7, part='kuyruk', name='ku', line=True)
    for x, y, r in ((56, 46, 3.2), (59, 43, 2.2), (54, 43, 1.8)):
        d.circle('Mor', (x, y), r, part='kuyruk', join='ku', lift=0.15)
    d.pix((58, 41), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    d.ellipse('Mor', (32, 39), (16.5, 15), name='g', cast=1, lift=0.1)
    d.ellipse('Mor', (32, 52), (14, 10), join='g')
    for x, y in ((20, 58), (44, 58), (32, 61)):
        d.circle('Mor', (x, y), 4.4, join='g')
    d.ellipse('Mor', (32, 54), (17.5, 7), part='govde', name='m', lift=0.22, line=True)
    for x in (18, 24.5, 32, 39.5, 46):
        d.circle('Mor', (x, 59.5), 3.8, part='govde', join='m')
    d.capsule('Mor', (23, 60), (23, 62.5), 5.2, part='kol_1', line=True, lift=0.05)
    d.capsule('Mor', (41, 60), (41, 62.5), 5.2, part='kol_2', line=True, lift=0.05)
    d.ellipse('Mor', (cx, 45), (7.5, 5), name='bu', shade='flat', tone=1, line=True)
    d.pix((cx - 1, 41), ['###', '.#.'], {'#': 'Lacivert-4'}, keep=True)
    agiz(d, cx + 0.5, 47, 4.2, 2.6, yildiz=True)
    d.set_face(cx, 32, gap=6, mouth=False)
    damla(d, 37, 49, 2.0)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def kulak_yn(d, L, tip, part, name, lift=-0.3):
    d.poly('Mor', L, part=part, name=name, line=True, lift=lift)
    d.poly('Lacivert', tip, part=part, clip=name, tone=3)


def damla_y(d, x, y):
    d.pix((x - 1, y), ['.#.', '###', '###', '.#.'], {'#': 'Mor-4'}, part='esya')


def burun_y(d, x, y):
    d.pix2((x, y), ['#'], {'#': 'Lacivert-4'})


def bebek_yan(d):
    d.curve('Mor', [(37, 43), (43, 41), (44, 33)], 4.2, part='kuyruk', line=True)
    kulak_yn(d, [(26, 25), (33, 27), (35, 36), (31, 37)], [(29, 33), (35, 33), (35, 38), (30, 38)], 'kulak_2', 'k2', -0.2)
    d.capsule('Mor', (32, 45), (32, 47), 4.2, part='kol_2', line=True)
    d.ellipse('Mor', (27, 38), (12, 9.5), name='g', cast=1, lift=0.1)
    d.circle('Mor', (19, 33), 10, join='g')
    d.ellipse('Mor', (27, 44), (6, 3), clip='g', shift=-1)
    d.ellipse('Mor', (11.5, 39), (4.8, 3.2), name='bu', shade='flat', tone=1, line=True)
    burun_y(d, 4, 19)
    damla_y(d, 12, 42)
    kulak_yn(d, [(20, 24), (27, 26), (29, 36), (25, 39), (20, 33)], [(23, 31), (29, 31), (28, 39), (24, 40)], 'kulak_1', 'k1', -0.3)
    d.capsule('Mor', (19, 45), (19, 47), 4.2, part='kol_1', line=True)
    d.set_face_side(14, 30)


def genc_yan(d):
    d.curve('Mor', [(41, 50), (48, 48), (49, 38)], 4.8, part='kuyruk', line=True)
    kulak_yn(d, [(28, 27), (35, 28), (37, 40), (33, 41)], [(31, 36), (37, 36), (37, 41), (32, 41)], 'kulak_2', 'k2', -0.2)
    d.capsule('Mor', (37, 53), (37, 56), 4.6, part='kol_2', line=True, lift=0.05)
    d.ellipse('Mor', (32, 45), (14, 10.5), name='g', cast=1, lift=0.1)
    d.circle('Mor', (21, 38), 11, join='g')
    d.ellipse('Mor', (32, 51), (7, 3.5), clip='g', shift=-1)
    d.ellipse('Mor', (12, 43.5), (5.4, 3.6), name='bu', shade='flat', tone=1, line=True)
    burun_y(d, 4, 21)
    damla_y(d, 13, 47)
    # kabarik yele (onde, acik, dalgali alt kenar)
    d.ellipse('Mor', (24, 51), (9, 5.5), part='govde', name='m', lift=0.22, line=True)
    for x in (17, 22, 27, 31):
        d.circle('Mor', (x, 54.5), 3.2, part='govde', join='m')
    kulak_yn(d, [(22, 27), (29, 29), (31, 41), (27, 44), (22, 37)], [(25, 34), (31, 34), (30, 43), (26, 44)], 'kulak_1', 'k1', -0.3)
    d.capsule('Mor', (21, 53), (21, 56), 4.6, part='kol_1', line=True, lift=0.05)
    d.set_face_side(14, 34)


def usta_yan(d):
    d.curve('Mor', [(46, 57), (54, 54), (56, 45)], 7, part='kuyruk', name='ku', line=True)
    for x, y, r in ((56, 42, 3.2), (58, 38, 2.4), (53, 39, 1.8)):
        d.circle('Mor', (x, y), r, part='kuyruk', join='ku', lift=0.15)
    d.pix((57, 37), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    kulak_yn(d, [(33, 29), (41, 30), (44, 45), (39, 47)], [(37, 40), (44, 40), (43, 47), (38, 47)], 'kulak_2', 'k2', -0.2)
    d.capsule('Mor', (42, 61), (42, 63), 5.2, part='kol_2', line=True, lift=0.05)
    d.ellipse('Mor', (37, 50), (17, 12.5), name='g', cast=1, lift=0.1)
    d.circle('Mor', (23, 42), 13.5, join='g')
    d.ellipse('Mor', (36, 58), (8, 4), clip='g', shift=-1)
    d.ellipse('Mor', (12, 48.5), (6.4, 4.2), name='bu', shade='flat', tone=1, line=True)
    burun_y(d, 4, 23)
    damla_y(d, 13, 53)
    # yele
    d.ellipse('Mor', (26, 56), (11, 6.5), part='govde', name='m', lift=0.22, line=True)
    for x in (17, 22, 27, 32, 36):
        d.circle('Mor', (x, 60), 3.6, part='govde', join='m')
    kulak_yn(d, [(25, 29), (34, 31), (36, 46), (31, 50), (25, 41)], [(28, 37), (36, 37), (35, 48), (30, 49)], 'kulak_1', 'k1', -0.3)
    d.capsule('Mor', (24, 61), (24, 63), 5.2, part='kol_1', line=True, lift=0.05)
    d.set_face_side(16, 38)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
