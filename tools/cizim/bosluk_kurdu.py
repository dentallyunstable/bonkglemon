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


def bebek(d):
    cx = 24
    L = [(15, 27), (9, 24), (6, 34), (7, 40), (12, 37), (15, 33)]
    d.poly('Mor', L, part='kulak_1', line=True, lift=-0.2)
    d.poly('Mor', mir(L, cx), part='kulak_2', line=True, lift=-0.2)
    d.ellipse('Mor', (24, 36), (13.5, 11.5), name='g', cast=1, lift=0.1)
    for x, y in ((14, 44), (34, 44), (24, 47)):
        d.circle('Mor', (x, y), 3.4, join='g')
    d.ellipse('Mor', (24, 44), (6, 4), clip='g', shift=-1)
    d.curve('Mor', [(37, 45), (43, 44), (44, 38)], 4.2, part='kuyruk', line=True)
    d.set_face(24, 32, gap=5, mouth=False)
    burun(d, 24, 32)
    d.pix((22, 38), ['###'], {'#': 'Lacivert-4'})
    d.pix((23, 39), ['##', '##'], {'#': 'Pembe-2'})
    damla(d, 27, 40, 1.8)


def genc(d):
    cx = 28
    d.poly('Mor', [(15, 30), (9, 27), (7, 36), (8, 42), (13, 40), (16, 36)], part='kulak_1', line=True, lift=-0.2)
    e = [(20, 28), (21, 17), (25, 12), (34, 26)]
    d.poly('Mor', e, part='kulak_2', name='e2', line=True, lift=-0.05)
    d.poly('Lacivert', [(22.5, 25), (23, 18), (26, 16), (30.5, 25)], part='kulak_2', clip='e2', tone=2)
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
    d.set_face(28, 33, gap=5, mouth=False)
    burun(d, 28, 33)
    d.pix((26, 39), ['###'], {'#': 'Lacivert-4'})
    d.pix((27, 40), ['##', '##'], {'#': 'Pembe-2'})
    damla(d, 31, 41, 2.0)


def usta(d):
    cx = 32
    kL = [(17, 32), (16, 19), (19, 12), (25, 10), (29, 13), (26, 16), (31, 28)]
    iL = [(19.5, 28), (19, 20), (22, 16), (27, 24)]
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
    d.set_face(cx, 33, gap=6, mouth=False)
    burun(d, cx, 33)
    agiz(d, cx, 45.5, 5.2, 3.4, yildiz=True)
    damla(d, 38, 48, 2.0)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
