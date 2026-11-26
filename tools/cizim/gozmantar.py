# Gozmantar (Golge, nadir). Tarif: TARIFLER.md. Can sapkali, sapinin onunde tek kocaman merakli goz olan mantar.
# Renk: Mor (sapka), Krem (sap), Cam (parlayan benek). Parlak: Mor -> Kirmizi. Tek goz: set_face(tek=True).
PARLA = 'Cam'


def benek(d, x, y, r, name):
    d.circle('Cam', (x, y), r, part='govde', clip=name, shade='flat', tone=2)
    d.pix((int(x - 1), int(y - 1)), ['o'], {'o': 'Parilti'})


def bebek(d):
    d.ellipse('Krem', (24, 37.5), (10, 7.5), name='sap', cast=1, lift=0.05)
    d.circle('Krem', (18.5, 42.5), 2.8, join='sap')
    d.circle('Krem', (29.5, 42.5), 2.8, join='sap')
    d.ellipse('Mor', (24, 25.5), (11.8, 8.5), name='cap', cast=1, inbox=(0, 0, 48, 30), lift=0.08)
    d.ellipse('Mor', (24, 29.5), (13, 1.6), join='cap')
    d.ellipse('Mor', (19.5, 20), (3.2, 2), clip='cap', shift=-1)
    d.ellipse('Mor', (29.5, 24), (2, 1.4), clip='cap', shift=-1)
    d.set_face(24, 32, tek=True, kalip='B')


def genc(d):
    d.ellipse('Krem', (28, 40.5), (11, 8), name='sap', cast=1, lift=0.05)
    d.ellipse('Krem', (21.5, 48), (4.2, 3), part='kol_1', line=True)
    d.ellipse('Krem', (34.5, 48), (4.2, 3), part='kol_2', line=True)
    d.ellipse('Mor', (28, 27.5), (16.5, 11), name='cap', cast=1, inbox=(0, 0, 56, 33), lift=0.08)
    d.ellipse('Mor', (28, 32.5), (17.5, 1.8), join='cap')
    for x, y in ((12.5, 32), (20, 33), (28, 33.5), (36, 33), (43.5, 32)):
        d.circle('Mor', (x, y - 0.5), 2.4, join='cap')
    for x, y in ((13.5, 31.5), (22.5, 32.5), (33.5, 32.5), (42.5, 31.5)):
        d.circle('Cam', (x, y), 1.9, part='govde', clip='cap', shade='flat', tone=2)
        d.pix((int(x - 1), int(y - 1)), ['oo'], {'o': 'Parilti'})
    d.ellipse('Mor', (22, 20), (3.5, 2.2), clip='cap', shift=-1)
    d.ellipse('Mor', (36, 24), (2, 1.4), clip='cap', shift=-1)
    d.set_face(28, 35, tek=True, kalip='B')


def bebe(d, x, y, cx_cap=None):
    """Kenardan sarkan yavru mantar: kapali gozlu."""
    d.capsule('Krem', (x, y + 1), (x, y + 8), 5.4, part='esya', line=True)
    d.ellipse('Mor', (x, y), (5.6, 3.4), part='esya', line=True, lift=0.15, inbox=(0, 0, 64, y + 2))
    d.pix((x - 2, y + 4), ['##.##'], {'#': 'Murekkep'}, part='esya', keep=True)


def usta(d):
    cx = 32
    d.ellipse('Krem', (32, 51), (13.5, 10), name='sap', cast=1, lift=0.05)
    d.ellipse('Krem', (22, 58.5), (5.2, 3.2), part='kol_1', line=True)
    d.ellipse('Krem', (42, 58.5), (5.2, 3.2), part='kol_2', line=True)
    d.ellipse('Mor', (32, 29), (22, 13), name='cap', cast=2, inbox=(0, 0, 64, 36), lift=0.08)
    # dalgali kenar
    d.ellipse('Mor', (32, 35.5), (22.5, 2.2), join='cap')
    for x in (13, 20.5, 28, 36, 43.5, 51):
        d.circle('Mor', (x, 37), 3.2, join='cap')
    for x, y, r in ((17, 29, 2.0), (47, 29, 2.0), (32, 22, 2.4), (24, 36, 1.6), (40, 36, 1.6)):
        d.circle('Cam', (x, y), r, part='govde', clip='cap', shade='flat', tone=2)
        d.pix((int(x - 1), int(y - 1)), ['o'], {'o': 'Parilti'})
    d.ellipse('Mor', (24, 20), (4, 2.4), clip='cap', shift=-1)
    # yavru mantarlar
    bebe(d, 10, 36)
    bebe(d, 54, 36)
    d.set_face(cx, 45, tek=True, kalip='B')
    # uzun kirpiklar (goz kutusunun disinda, bir bos piksel ustte)
    d.pix((cx - 4, 42), ['#...#...#'], {'#': 'Murekkep'}, keep=True)
    d.pix((cx - 4, 43), ['.#..#..#.'], {'#': 'Murekkep'}, keep=True)

STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def bebek_yan(d):
    d.ellipse('Krem', (26, 38.5), (8.5, 6.3), name='sap', cast=1, lift=0.05)
    d.circle('Krem', (21, 42), 2.6, join='sap')
    d.circle('Krem', (31, 42), 2.6, join='sap')
    d.ellipse('Mor', (25, 26), (13.5, 9), name='cap', cast=1, inbox=(0, 0, 48, 30), lift=0.08)
    d.ellipse('Mor', (25, 30), (14.5, 1.6), join='cap')
    d.ellipse('Mor', (19, 20.5), (3.4, 2), clip='cap', shift=-1)
    d.ellipse('Mor', (31, 24.5), (2.2, 1.5), clip='cap', shift=-1)
    d.set_face_side(20, 34)


def genc_yan(d):
    d.ellipse('Krem', (30, 44), (9.5, 8), name='sap', cast=1, lift=0.05)
    d.ellipse('Krem', (36.5, 51), (4.2, 3), part='kol_2', line=True)
    d.ellipse('Mor', (29, 31), (17, 11.5), name='cap', cast=1, inbox=(0, 0, 56, 34), lift=0.08)
    d.ellipse('Mor', (29, 35.5), (18, 1.8), join='cap')
    for x in (13, 20, 27, 34, 41):
        d.circle('Mor', (x, 35.5), 2.4, join='cap')
    for x, y in ((18, 33), (30, 32), (41, 32)):
        d.circle('Cam', (x, y), 1.9, part='govde', clip='cap', shade='flat', tone=2)
        d.pix((int(x - 1), int(y - 1)), ['oo'], {'o': 'Parilti'})
    d.ellipse('Mor', (22, 24), (3.6, 2.2), clip='cap', shift=-1)
    d.ellipse('Mor', (37, 26), (2.2, 1.5), clip='cap', shift=-1)
    d.ellipse('Krem', (23, 51), (4.2, 3), part='kol_1', line=True)
    d.set_face_side(22, 39)


def bebe_y(d, x, y):
    d.capsule('Krem', (x, y + 1), (x, y + 8), 5.4, part='esya', line=True)
    d.ellipse('Mor', (x, y), (5.6, 3.4), part='esya', line=True, lift=0.15, inbox=(0, 0, 64, y + 2))
    d.pix((x - 2, y + 4), ['##.##'], {'#': 'Murekkep'}, part='esya', keep=True)


def usta_yan(d):
    bebe_y(d, 55, 37)
    d.ellipse('Krem', (43, 62), (5.2, 3.2), part='kol_2', line=True)
    d.ellipse('Krem', (35, 53), (12, 9.5), name='sap', cast=1, lift=0.05)
    d.ellipse('Mor', (34, 36), (23, 13), name='cap', cast=2, inbox=(0, 0, 64, 44), lift=0.08)
    d.ellipse('Mor', (34, 42), (23.5, 2.2), join='cap')
    for x in (14, 21.5, 29, 37, 44.5, 52):
        d.circle('Mor', (x, 43.5), 3.2, join='cap')
    for x, y, r in ((20, 37, 2.0), (46, 37, 2.0), (34, 29, 2.4), (28, 42.5, 1.6)):
        d.circle('Cam', (x, y), r, part='govde', clip='cap', shade='flat', tone=2)
        d.pix((int(x - 1), int(y - 1)), ['o'], {'o': 'Parilti'})
    d.ellipse('Mor', (26, 27), (4, 2.4), clip='cap', shift=-1)
    bebe_y(d, 12, 40)
    d.ellipse('Krem', (27, 62), (5.2, 3.2), part='kol_1', line=True)
    d.set_face_side(26, 49)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
