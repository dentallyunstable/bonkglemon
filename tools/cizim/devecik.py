# Devecik (Kum, siradan). Tarif: TARIFLER.md. Uykulu, tombul deve yavrusu; hormuc(ler) basinin arkasindan gorunur.
# Renk: Kahve (govde, hormuc), Krem (burun/dudak, can, kus), Kirmizi (kilim). Parlak: Kahve -> Kar.
PARLA = 'Kirmizi'


def dudak(d, cx, y, rx, ry):
    """Kalin krem dudak/burun yastigi (yuz alaninin altinda) + burun delikleri."""
    d.ellipse('Krem', (cx, y), (rx, ry), name='dudak', line=True, lift=0.05, noshadow=True)
    d.pix((cx - 2, y - 1), ['#..#'], {'#': 'Kahve-4'}, part='govde')
    d.capsule('Kahve', (cx - rx + 2, y + ry - 1), (cx + rx - 2, y + ry - 1), 0.7, clip='dudak', shift=1)


def kulaklar(d, x1, x2, y, r):
    d.ellipse('Kahve', (x1, y), (r * 1.4, r * 0.8), part='kulak_1', line=True, rot=-25)
    d.ellipse('Kahve', (x2, y), (r * 1.4, r * 0.8), part='kulak_2', line=True, rot=25)


def bebek(d):
    d.ellipse('Kahve', (25, 23), (5.4, 6), part='tepe', name='h', line=True, lift=0.06)
    kulaklar(d, 12.5, 35.5, 28, 2.8)
    d.ellipse('Kahve', (24, 35), (13.5, 12.4), name='g', cast=1)
    dudak(d, 24, 43.5, 6.4, 3.6)
    d.set_face(24, 32, gap=5)


def genc(d):
    d.ellipse('Kahve', (21, 24), (6, 7.2), part='tepe', name='h1', line=True, lift=0.06)
    d.ellipse('Kahve', (35, 24), (6, 7.2), part='tepe', name='h2', line=True, lift=0.06)
    kulaklar(d, 12.5, 43.5, 31, 3.2)
    d.ellipse('Kahve', (28, 40.5), (15, 17), name='g', cast=1)
    d.capsule('Kahve', (14, 52), (18, 55), 4.4, part='kol_1', line=True)
    d.capsule('Kahve', (42, 52), (38, 55), 4.4, part='kol_2', line=True)
    dudak(d, 28, 49.5, 7, 3.8)
    # kirmizi desenli kilim iki hormucun arasinda
    d.rect('Kirmizi', (22, 22, 34, 32), rad=2, part='esya', name='kl', line=True)
    d.pix((26, 24), ['.#.', '#.#', '.#.'], {'#': 'Krem-1'}, part='esya')
    d.capsule('Krem', (23, 30.5), (33, 30.5), 0.7, part='esya', clip='kl', shift=0)
    d.set_face(28, 36, gap=5)


def usta(d):
    d.ellipse('Kahve', (21, 25), (7.6, 9), part='tepe', name='h1', line=True, lift=0.06)
    d.ellipse('Kahve', (43, 25), (7.6, 9), part='tepe', name='h2', line=True, lift=0.06)
    kulaklar(d, 13.5, 50.5, 33, 3.6)
    d.ellipse('Kahve', (32, 45.5), (17.5, 21.5), name='g', cast=1)
    d.capsule('Kahve', (16, 60), (20, 63), 5, part='kol_1', line=True)
    d.capsule('Kahve', (48, 60), (44, 63), 5, part='kol_2', line=True)
    dudak(d, 32, 54.5, 8, 4.2)
    # puskullu kilim
    d.rect('Kirmizi', (26, 22, 38, 33), rad=2, part='esya', name='kl', line=True)
    d.capsule('Krem', (27, 25.5), (37, 25.5), 0.7, part='esya', clip='kl', shift=0)
    d.pix((31, 27), ['.#.', '#.#', '.#.'], {'#': 'Krem-1'}, part='esya')
    for x in (27, 30, 34, 37):
        d.capsule('Krem', (x, 33), (x, 36.5), 1.2, part='esya', line=True)
    # uyuyan minik col kusu hormuclarin arasinda
    d.ellipse('Krem', (32, 17.5), (5, 3.8), part='tepe', name='kus', line=True)
    d.circle('Krem', (28.5, 15.5), 2.3, part='tepe', join='kus')
    d.pix((26, 15), ['#'], {'#': 'Kirmizi-3'}, part='tepe')
    d.capsule('Kirmizi', (33, 19), (38, 18.5), 1.2, part='tepe', clip='kus', shift=1)
    # boyunda can
    d.capsule('Kirmizi', (23, 59.5), (41, 59.5), 1.2, part='esya', line=True)
    d.circle('Krem', (32, 63), 2.6, part='esya', line=True, lift=0.1)
    d.set_face(32, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
