# Kor Semenderi (Ates, siradan). Tarif: TARIFLER.md. Kuyrugunun ucunda mum alevi yanan kirmizi semender (dik oturur, kuyruk onde kivrik).
# Renk: Kirmizi (govde), Sari (karin, alev), Komur (benek). Parlak: Kirmizi -> Lacivert, Sari -> Gok.
PARLA = 'Sari'

# el cizimi alevler: # kenar, o alev, p cekirdek
A_KUCUK = ['..#..', '.#o#.', '.#oo#', '#ooo#', '#opo#', '#opo#', '.###.']
A_ORTA = ['...#...', '..#o#..', '..#oo#.', '.#ooo#.', '.#oopo#', '#ooppo#', '#oppo#.', '#oppo#.', '#oooo#.', '.####..']
A_BUYUK = ['....#....', '...#o#...', '...#oo#..', '..#ooo#..', '..#oopo#.', '.#ooppo#.', '.#ooppoo#', '#oooppoo#', '#ooppppo#', '#oppppo#.', '#ooppoo#.', '.#oooo#..', '..####...']
TON = {'#': 'Sari-3', 'o': 'Sari-1', 'p': 'Parilti'}


def alev(d, x, y, b, part='kuyruk'):
    """Alev bitmap'i; (x, y) sol ust."""
    d.pix((x, y), b, TON, part=part)


def bebek(d):
    d.ellipse('Kirmizi', (24, 33), (14.5, 10.5), name='kafa', cast=1)
    d.ellipse('Sari', (24, 42.5), (7, 3), clip='kafa', shift=0)
    # kuyruk onde kivrilir, ucu yukari
    d.curve('Kirmizi', [(40, 40), (38, 46), (28, 47.5), (16, 46.5), (8, 40)], (5.6, 4.0), part='kuyruk', line=True)
    alev(d, 4, 33, A_KUCUK)
    d.ellipse('Kirmizi', (13, 41), (3.6, 2.8), part='kol_1', line=True)
    d.ellipse('Kirmizi', (35, 41), (3.6, 2.8), part='kol_2', line=True)
    d.pix((10, 42), ['#.#'], {'#': 'Kirmizi-4'}, part='kol_1')
    d.pix((33, 42), ['#.#'], {'#': 'Kirmizi-4'}, part='kol_2')
    d.set_face(24, 30, gap=5)


def genc(d):
    d.ellipse('Kirmizi', (28, 41), (14, 11), name='govde', cast=1)
    d.ellipse('Kirmizi', (28, 33), (14.5, 10), name='kafa', join='govde')
    d.ellipse('Sari', (28, 47), (8, 3.6), clip='govde', shift=0)
    for x, y, r in ((15.5, 37, 1.8), (41, 39, 2.0), (16.5, 45, 1.7), (40, 46, 1.7)):
        d.circle('Komur', (x, y), r + 0.6, clip='govde', shift=0)
        d.pix((int(x) - 1, int(y) - 1), ['oo'], {'o': 'Sari-1'}, part='govde')
    d.curve('Kirmizi', [(44, 45), (44, 52), (32, 54.5), (18, 54), (7, 46)], (6.4, 4.4), part='kuyruk', line=True)
    alev(d, 3, 36, A_ORTA)
    d.ellipse('Kirmizi', (14, 47), (4.0, 3.0), part='kol_1', line=True)
    d.ellipse('Kirmizi', (42, 47), (4.0, 3.0), part='kol_2', line=True)
    d.pix((10, 48), ['#.#'], {'#': 'Kirmizi-4'}, part='kol_1')
    d.pix((41, 48), ['#.#'], {'#': 'Kirmizi-4'}, part='kol_2')
    d.set_face(28, 30, gap=5)


def usta(d):
    d.ellipse('Kirmizi', (32, 45), (17.5, 13), name='govde', cast=1)
    d.ellipse('Kirmizi', (32, 34), (17, 11.5), name='kafa', join='govde')
    d.ellipse('Sari', (32, 54), (10, 4.2), clip='govde', shift=0)
    for x, y, r in ((16, 45, 2.2), (48.5, 46, 2.2), (17, 54, 1.9), (47.5, 55, 1.9)):
        d.circle('Komur', (x, y), r + 0.6, clip='govde', shift=0)
        d.pix((int(x) - 1, int(y) - 1), ['oo'], {'o': 'Sari-1'}, part='govde')
    # sirt alev dilleri: omuzlarda
    alev(d, 14, 21, A_KUCUK, part='tepe')
    alev(d, 45, 21, A_KUCUK, part='tepe')
    alev(d, 29, 17, A_KUCUK, part='tepe')
    d.curve('Kirmizi', [(48, 52), (51, 60), (38, 62), (22, 61), (7, 51)], (7.4, 5.2), part='kuyruk', line=True)
    alev(d, 2, 39, A_BUYUK)
    d.ellipse('Kirmizi', (13, 52.5), (4.6, 3.4), part='kol_1', line=True)
    d.ellipse('Kirmizi', (51, 52.5), (4.6, 3.4), part='kol_2', line=True)
    d.pix((9, 54), ['#.#'], {'#': 'Kirmizi-4'}, part='kol_1')
    d.pix((50, 54), ['#.#'], {'#': 'Kirmizi-4'}, part='kol_2')
    d.set_face(32, 33, gap=6, ten='Sari')

STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
