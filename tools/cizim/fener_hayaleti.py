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
    d.poly('Komur', [(cx - 10, 19), (cx - 5, 14.5), (cx + 5, 14.5), (cx + 10, 19)], part='tepe', name='cati', line=True)
    d.rect('Kirmizi', (cx - 9, 18, cx + 9, 21), rad=1, part='tepe', line=True)
    d.ellipse('Krem', (cx, 26), (10.5, 5.2), name='ustkat', line=True, cast=1)
    d.capsule('Komur', (cx - 10.5, 21), (cx - 10.5, 26), 1.2, clip='ustkat', tone=2)
    d.capsule('Komur', (cx + 10.5, 21), (cx + 10.5, 26), 1.2, clip='ustkat', tone=2)
    d.pix((cx - 2, 22.5), ALEV_S, C)
    kapak(d, cx, 29, 33, 12, 'orta')
    d.ellipse('Krem', (cx, 44), (19.5, 13.5), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 54.5, 58.5, 12.5, 'alt')
    kaburga(d, cx, 35, 53, 17, 1.5)
    d.pix((cx - 3, 33), ALEV_B, C, part='govde')
    for s, p in ((-1, 'kol_1'), (1, 'kol_2')):
        d.capsule('Krem', (cx + s * 18.5, 42), (cx + s * 23, 50), (3.8, 3.4), part=p, line=True)
    puskul(d, cx - 6, 58, 0.8)
    puskul(d, cx + 6, 58, 0.8)
    d.set_face(cx, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, kanatsiz suzulur
def bebek_yan(d):
    d.flyer = True
    cx = 26
    d.ellipse('Krem', (cx, 32), (11.5, 9.8), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 21, 24, 6.5, 'ust')
    kapak(d, cx, 40, 43.5, 6.5, 'alt')
    d.capsule('Komur', (cx + 8.5, 26), (cx + 9, 38), 1.3, clip='kagit', tone=2)
    d.pix((cx - 2, 23.5), ALEV_S, C, part='govde')
    puskul(d, cx, 43.5, 0.7)
    d.set_face_side(16, 30)


def genc_yan(d):
    d.flyer = True
    cx = 30
    d.curve('Komur', [(cx - 5, 21), (cx - 4, 13), (cx + 4, 13), (cx + 5, 21)], 2.0, part='tepe', line=True)
    d.capsule('Krem', (cx + 10, 37), (cx + 14.5, 44), (3.4, 3.2), part='kol_2', line=True)
    d.ellipse('Krem', (cx, 35.5), (13.5, 12.5), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 22, 26, 8, 'ust')
    kapak(d, cx, 45, 49, 8, 'alt')
    d.capsule('Komur', (cx + 11, 28), (cx + 11.5, 44), 1.4, clip='kagit', tone=2)
    d.pix((cx - 3, 25), ALEV_B, C, part='govde')
    d.capsule('Krem', (cx - 9, 38), (cx - 11, 45), (3.6, 3.2), part='kol_1', line=True)
    puskul(d, cx, 49, 1.0)
    d.set_face_side(18, 33)


def usta_yan(d):
    d.flyer = True
    cx = 32
    d.poly('Komur', [(cx - 8, 19), (cx - 4, 14.5), (cx + 4, 14.5), (cx + 8, 19)], part='tepe', name='cati', line=True)
    d.rect('Kirmizi', (cx - 7, 18, cx + 7, 21), rad=1, part='tepe', line=True)
    d.capsule('Krem', (cx + 11, 43), (cx + 17.5, 51), (3.8, 3.4), part='kol_2', line=True)
    d.ellipse('Krem', (cx, 26), (8.5, 5.2), name='ustkat', line=True, cast=1)
    d.pix((cx - 2, 22.5), ALEV_S, C)
    kapak(d, cx, 29, 33, 9.5, 'orta')
    d.ellipse('Krem', (cx, 44), (16, 13.5), name='kagit', cast=1, lift=0.05)
    kapak(d, cx, 54.5, 58.5, 10, 'alt')
    d.capsule('Komur', (cx + 13.5, 35), (cx + 14, 53), 1.5, clip='kagit', tone=2)
    d.pix((cx - 3, 33), ALEV_B, C, part='govde')
    d.capsule('Krem', (cx - 11.5, 44), (cx - 14, 52), (4, 3.4), part='kol_1', line=True)
    puskul(d, cx - 3, 58, 0.8)
    puskul(d, cx + 3, 58, 0.8)
    d.set_face_side(19, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
