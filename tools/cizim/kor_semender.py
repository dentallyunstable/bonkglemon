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


def bacak(d, a, b, w, part, side):
    """Yana acilan semender bacagi; ucunda uc parmak (Kirmizi-4 noktalar)."""
    d.capsule('Kirmizi', a, b, w, part=part, line=True)
    x, y = int(round(b[0])), int(round(b[1]))
    d.pix((x - 2 if side < 0 else x, y + 1), ['#.#.#'[:5]], {'#': 'Kirmizi-4'}, part=part, keep=True)


def kuyruk(d, pts, w, fx, fy, bmp):
    """Onden kivrilan ince kuyruk, ucunda yukari bakan mum alevi."""
    d.curve('Kirmizi', pts, w, part='kuyruk', line=True, name='ku')
    alev(d, fx, fy, bmp)


def benek(d, x, y, r, clip):
    d.circle('Komur', (x, y), r, clip=clip, shift=0)
    d.pix((int(x) - 1, int(y)), ['oo'], {'o': 'Sari-1'}, part='govde', keep=True)


def bebek(d):
    # genis yassi kafa, kucuk govde; kuyruk onde kivrilir
    d.ellipse('Kirmizi', (24, 39.5), (11, 7.5), name='g', cast=1)
    bacak(d, (17, 43), (11.5, 45), 3.4, 'kol_1', -1)
    bacak(d, (31, 43), (36.5, 45), 3.4, 'kol_2', 1)
    d.ellipse('Kirmizi', (24, 31), (13.5, 9), name='kafa', lift=0.08, cast=1)
    d.ellipse('Sari', (24, 42.5), (5.5, 3), clip='g', shift=-1)
    kuyruk(d, [(31, 44), (33, 47.5), (25, 48.5), (17, 47.5), (13, 44.5)], (4.4, 2.8), 10, 36, A_KUCUK)
    d.set_face(24, 28, gap=6)


def genc(d):
    d.ellipse('Kirmizi', (28, 44), (13, 9), name='g', cast=1)
    bacak(d, (19, 47), (12.5, 50), 3.8, 'kol_1', -1)
    bacak(d, (37, 47), (43.5, 50), 3.8, 'kol_2', 1)
    d.ellipse('Kirmizi', (28, 32.5), (16, 10.5), name='kafa', lift=0.08, cast=1)
    d.ellipse('Sari', (28, 48), (7, 3.6), clip='g', shift=-1)
    d.curve('Sari', [(22, 49.5), (34, 49.5)], 1.0, clip='g', shift=1)
    # sirtta kor gibi parlayan benekler (yuz alaninin disinda)
    for x, y, r in ((15, 31, 1.8), (41, 31, 1.8), (18, 25.5, 1.5), (38, 25.5, 1.5), (18, 43, 1.6), (38, 43, 1.6)):
        benek(d, x, y, r, 'kafa' if y < 40 else 'g')
    kuyruk(d, [(36, 49), (38, 53), (29, 54.5), (19, 54), (13, 50)], (5.0, 3.0), 9, 39, A_ORTA)
    d.set_face(28, 29, gap=6)


def usta(d):
    d.ellipse('Kirmizi', (32, 49), (15.5, 11), name='g', cast=1)
    bacak(d, (21, 53), (12.5, 56.5), 4.4, 'kol_1', -1)
    bacak(d, (43, 53), (51.5, 56.5), 4.4, 'kol_2', 1)
    d.ellipse('Kirmizi', (32, 35), (20, 12.5), name='kafa', lift=0.08, cast=2)
    d.ellipse('Sari', (32, 54), (8.5, 4.2), clip='g', shift=-1)
    for yy in (52.5, 55.5):
        d.curve('Sari', [(25, yy), (39, yy)], 1.0, clip='g', shift=1)
    for x, y, r in ((15, 33, 2.0), (49, 33, 2.0), (18, 26.5, 1.7), (46, 26.5, 1.7), (20, 46.5, 1.8), (44, 46.5, 1.8)):
        benek(d, x, y, r, 'kafa' if y < 44 else 'g')
    # sirt boyunca kucuk alev dilleri (kafanin ustunde, tepe)
    alev(d, 20, 18, A_KUCUK, part='tepe')
    alev(d, 29, 15, A_KUCUK, part='tepe')
    alev(d, 38, 18, A_KUCUK, part='tepe')
    kuyruk(d, [(41, 56), (44, 61), (33, 63.5), (21, 63), (13, 57)], (6.0, 3.4), 7, 44, A_BUYUK)
    d.set_face(32, 32, gap=7, yanak='Sari-1')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
