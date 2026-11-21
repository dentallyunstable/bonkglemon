# Fener Hayaleti (Golge, siradan, kanatsiz ucar). Tarif: TARIFLER.md. Canli kagit fener: yuz krem kagitta, icinde Cam alev, Komur cerceve, Kirmizi puskul.
# Renk: Krem (kagit), Komur (cerceve), Cam (alev), Kirmizi (puskul). Parlak: Cam -> Pembe.
PARLA = 'Cam'

C = {'#': 'Cam-3', 'o': 'Cam-2', 'x': 'Cam-1'}
ALEV_S = ['..#..', '.#o#.', '.#ox#', '#oxo#', '#oxo#', '.###.']
ALEV_B = ['...#...', '..#o#..', '..#ox#.', '.#oxo#.', '#oxxxo#', '#oxxxo#', '.#ooo#.']


def puskul(d, x, y, s=1.0):
    d.capsule('Kirmizi', (x, y), (x, y + 2.5), 1.4, part='esya', line=True)
    d.capsule('Kirmizi', (x, y + 2), (x, y + 2 + 3 * s), (3.2, 3.8), part='esya', line=True)


def kapak(d, cx, y0, y1, hw, nm):
    d.rect('Komur', (cx - hw, y0, cx + hw, y1), rad=1.5, name=nm, line=True)


def kaburga(d, cx, ya, yb, dx, w=1.3):
    for s in (-1, 1):
        d.capsule('Komur', (cx + s * dx, ya), (cx + s * (dx + 1), yb), w, clip='kagit', tone=2)


def bebek(d):
    d.flyer = True
    cx = 24
    d.ellipse('Krem', (cx, 32), (13.8, 10.2), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 21, 24, 8, 'ust')
    kapak(d, cx, 40, 43.5, 8, 'alt')
    kaburga(d, cx, 26, 39, 11)
    d.pix((cx - 2, 23.5), ALEV_S, C, part='govde')
    puskul(d, cx, 43.5, 0.7)
    d.set_face(cx, 31, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    d.curve('Komur', [(cx - 6, 21), (cx - 5, 13), (cx + 5, 13), (cx + 6, 21)], 2.0, part='tepe', line=True)
    d.ellipse('Krem', (cx, 35.5), (17, 12.5), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 22, 26, 10.5, 'ust')
    kapak(d, cx, 45, 49, 10.5, 'alt')
    kaburga(d, cx, 28, 44, 14.2, 1.4)
    d.pix((cx - 3, 25), ALEV_B, C, part='govde')
    # kagit serit kollar: asagi sarkan, kivrimli uclu
    for s, p in ((-1, 'kol_1'), (1, 'kol_2')):
        d.capsule('Krem', (cx + s * 15.5, 36), (cx + s * 19, 43), (3.4, 3.2), part=p, line=True)
        d.capsule('Komur', (cx + s * 16.5, 39.5), (cx + s * 18.4, 41.2), 0.7, part=p, clip=None) if False else None
    puskul(d, cx, 49, 1.0)
    d.set_face(cx, 33, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    d.curve('Komur', [(cx - 4, 10), (cx - 4, 4), (cx + 4, 4), (cx + 4, 10)], 2.0, part='tepe', line=True)
    d.poly('Komur', [(cx - 10, 17), (cx - 5, 9.5), (cx + 5, 9.5), (cx + 10, 17)], part='tepe', name='cati', line=True)
    d.rect('Kirmizi', (cx - 9, 15.5, cx + 9, 18.5), rad=1, part='tepe', line=True)
    d.ellipse('Krem', (cx, 23.5), (10.5, 5.5), name='ustkat', part='tepe', line=True, cast=1)
    d.capsule('Komur', (cx - 10.5, 21), (cx - 10.5, 26), 1.2, clip='ustkat', tone=2, part='tepe')
    d.capsule('Komur', (cx + 10.5, 21), (cx + 10.5, 26), 1.2, clip='ustkat', tone=2, part='tepe')
    d.pix((cx - 2, 20), ALEV_S, C, part='tepe')
    kapak(d, cx, 27, 31, 12, 'orta')
    d.ellipse('Krem', (cx, 44), (19.5, 15), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 56, 60.5, 12.5, 'alt')
    kaburga(d, cx, 33, 54, 17, 1.5)
    d.pix((cx - 3, 31.5), ALEV_B, C, part='govde')
    for s, p in ((-1, 'kol_1'), (1, 'kol_2')):
        d.capsule('Krem', (cx + s * 18.5, 42), (cx + s * 23, 50), (3.8, 3.4), part=p, line=True)
    puskul(d, cx - 6, 60, 1.1)
    puskul(d, cx + 6, 60, 1.1)
    d.set_face(cx, 39, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
