# Buzcuk (Buz, siradan). Tarif: TARIFLER.md. Canli buz kupu: bebek karli kup, genc kollu ve ici kar tanesi, usta kaideli kar kuresi icinde cam.
# Renk: Gok (buz), Kar (kar, kaide, kar tanesi), Cimen (ic cam). Yuz buzun on yuzeyinde, duz Gok alanda. Parlak: Gok -> Cam.
PARLA = 'Kar'


def parilti(d, x, y, part='govde'):
    d.pix((x, y), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def bebek(d):
    d.rect('Gok', (11, 18, 37, 47), rad=7.5, name='kup', cast=1, lift=0.08)
    # buz icinde soluk cizgiler (cam gibi)
    d.capsule('Gok', (14, 40), (14, 45), 0.9, clip='kup', shift=-1)
    d.capsule('Gok', (33, 41), (35, 42), 0.8, clip='kup', shift=1)
    d.capsule('Gok', (13, 31), (13, 35), 0.9, clip='kup', shift=-1)
    # tepede kar sapka, kenarlardan sarkar
    d.ellipse('Kar', (24, 18.5), (13.5, 4.4), name='kar', part='tepe', line=True, cast=1, lift=0.1)
    for x, r in ((13.5, 2.4), (19, 2.2), (29.5, 2.4), (34.5, 2.4)):
        d.circle('Kar', (x, 21.5), r, join='kar', part='tepe')
    d.circle('Kar', (22, 14.5), 3.6, part='tepe', join='kar')
    d.circle('Kar', (27, 15.5), 2.6, part='tepe', join='kar')
    parilti(d, 15, 24)
    d.set_face(24, 31, gap=5)


def bebekkar(d, x, y):
    """Kucuk 7x7 kar tanesi (buzun icinde)."""
    d.pix((x - 3, y - 3), ['#..#..#',
                           '.#.#.#.',
                           '..###..',
                           '#######',
                           '..###..',
                           '.#.#.#.',
                           '#..#..#'], {'#': 'Kar-2'})


def genc(d):
    d.rect('Gok', (13, 18, 43, 52), rad=8.5, name='kup', cast=1, lift=0.08)
    d.capsule('Gok', (16, 40), (16, 46), 1.0, clip='kup', shift=-1)
    d.capsule('Gok', (40, 36), (40, 40), 0.9, clip='kup', shift=1)
    # iki buz kol
    d.capsule('Gok', (14, 41), (7, 45), (4.4, 3.8), part='kol_1', line=True, lift=0.1)
    d.capsule('Gok', (42, 41), (49, 45), (4.4, 3.8), part='kol_2', line=True, lift=0.1)
    d.circle('Gok', (6.5, 46), 2.7, part='kol_1', lift=0.15)
    d.circle('Gok', (49.5, 46), 2.7, part='kol_2', lift=0.15)
    d.ellipse('Kar', (24, 19), (9, 3.4), name='kar', part='tepe', line=True, cast=1, lift=0.1)
    d.circle('Kar', (17.5, 22), 2.2, join='kar', part='tepe')
    d.circle('Kar', (22, 15.5), 2.8, join='kar', part='tepe')
    bebekkar(d, 28, 46)
    parilti(d, 17, 24)
    d.set_face(28, 28, gap=5)


def usta(d):
    # kaide: kar yigini
    d.ellipse('Kar', (32, 51.5), (19.5, 5), name='kaide', cast=1, lift=0.1)
    d.circle('Kar', (17, 50.5), 3.8, join='kaide')
    d.circle('Kar', (47, 50.5), 3.8, join='kaide')
    d.circle('Kar', (26, 55.5), 3.0, join='kaide')
    d.circle('Kar', (38.5, 55.8), 3.0, join='kaide')
    # cam kure
    d.circle('Gok', (32, 31), 18, name='kure', lift=0.1, cast=1)
    # kurenin icinde kar zemin
    d.ellipse('Kar', (32, 47.5), (13, 4), clip='kure', tone=1)
    # kurenin icinde minik cam agaci
    d.pix((26, 35), ['.....o.....',
                     '....ooo....',
                     '...ooCoo...',
                     '....CCC....',
                     '...CCCCC...',
                     '..ooCCCoo..',
                     '.CCCCCCCCC.',
                     '...CCCCC...',
                     '..CCCCCCC..',
                     '.CCCCCCCCC.',
                     '....TTT....'], {'o': 'Kar-1', 'C': 'Cimen-2', 'T': 'Kahve-3'})
    # cam isik: sol ust yansima ve kar taneleri
    d.curve('Gok', [(17, 28), (19, 21), (25, 16)], 1.8, clip='kure', shift=-2)
    d.pix((41, 21), ['#.', '.#'], {'#': 'Kar-1'})
    d.pix((19, 41), ['#.', '.#'], {'#': 'Kar-1'})
    parilti(d, 44, 28)
    d.set_face(32, 24, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
