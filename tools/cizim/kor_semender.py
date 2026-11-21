# Kor Semenderi (Ates, siradan). Tarif: TARIFLER.md. Kuyrugunun ucunda mum alevi yanan kirmizi semender (dik oturur, kuyruk onde kivrik).
# Renk: Kirmizi (govde), Sari (karin, alev), Komur (benek). Parlak: Kirmizi -> Lacivert, Sari -> Gok.
PARLA = 'Sari'


def alev(d, x, y, s, part='kuyruk'):
    """Mum alevi: (x, y) taban ortasi, s boyut carpani."""
    d.ellipse('Sari', (x, y - 2.2 * s), (1.9 * s, 2.8 * s), part=part, name='al%d' % int(x * 10), line=True)
    d.poly('Sari', [(x - 1.2 * s, y - 3 * s), (x, y - 6.4 * s), (x + 1.2 * s, y - 3 * s)], part=part, join='al%d' % int(x * 10))
    d.pix((int(x) - 1, int(y - 3.2 * s)), ['oo'], {'o': 'Parilti'}, part=part)


def bebek(d):
    d.ellipse('Kirmizi', (24, 33), (14, 12), name='kafa', cast=1)
    # gozlerin ustunde iki kucuk goz kemigi tumsegi (semender kafasi)
    d.circle('Kirmizi', (14, 21.5), 3.0, join='kafa')
    d.circle('Kirmizi', (34, 21.5), 3.0, join='kafa')
    d.ellipse('Sari', (24, 43), (7.5, 3.2), name='karin', clip='kafa', shift=0)
    d.ellipse('Kirmizi', (13.5, 43.5), (3.4, 2.8), part='kol_1', line=True)
    d.ellipse('Kirmizi', (34.5, 43.5), (3.4, 2.8), part='kol_2', line=True)
    # kuyruk onde kivrilir, ucu sol alta
    d.curve('Kirmizi', [(40, 40), (40, 47), (30, 48.5), (21, 47.5)], (3.4, 2.6), part='kuyruk', line=True)
    alev(d, 19.5, 47, 0.95)
    d.set_face(24, 30, gap=5)


def genc(d):
    d.ellipse('Kirmizi', (28, 40), (14, 12), name='govde', cast=1)
    d.ellipse('Kirmizi', (28, 31), (13, 10.5), name='kafa', join='govde')
    d.circle('Kirmizi', (17, 22), 3.0, join='govde')
    d.circle('Kirmizi', (39, 22), 3.0, join='govde')
    d.ellipse('Sari', (28, 46.5), (8, 3.6), clip='govde', shift=0)
    # sirtta kor benekleri (kenarlarda)
    for x, y, r in ((16.5, 36, 1.9), (40, 38, 2.0), (15.5, 44, 1.7), (41, 45, 1.7)):
        d.circle('Komur', (x, y), r, clip='govde', shift=0)
        d.pix((int(x) - 1, int(y) - 1), ['oo'], {'o': 'Sari-1'}, part='govde')
    d.ellipse('Kirmizi', (15, 50), (3.8, 3.0), part='kol_1', line=True)
    d.ellipse('Kirmizi', (41, 50), (3.8, 3.0), part='kol_2', line=True)
    d.curve('Kirmizi', [(44, 44), (46, 52), (36, 54), (26, 53)], (4.2, 3.2), part='kuyruk', line=True)
    alev(d, 23.5, 52, 1.3)
    d.set_face(28, 29, gap=5)


def usta(d):
    cx = 32
    # sirtta alev dilleri
    for x, y, s in ((20, 20, 1.0), (32, 14, 1.4), (44, 20, 1.0), (26, 16, 0.9), (38, 16, 0.9)):
        alev(d, x, y + 5, s, part='tepe')
    d.ellipse('Kirmizi', (32, 45), (17, 14), name='govde', cast=1)
    d.ellipse('Kirmizi', (32, 33), (15, 12.4), name='kafa', join='govde')
    d.circle('Kirmizi', (19, 23.5), 3.4, join='govde')
    d.circle('Kirmizi', (45, 23.5), 3.4, join='govde')
    d.ellipse('Sari', (32, 54), (10, 4.2), clip='govde', shift=0)
    for x, y, r in ((17, 42, 2.2), (47, 44, 2.2), (15.5, 52, 1.9), (48.5, 53, 1.9), (23, 28, 1.6)):
        d.circle('Komur', (x, y), r, clip='govde', shift=0)
        d.pix((int(x) - 1, int(y) - 1), ['oo'], {'o': 'Sari-1'}, part='govde')
    d.ellipse('Kirmizi', (14, 57), (4.4, 3.4), part='kol_1', line=True)
    d.ellipse('Kirmizi', (50, 57), (4.4, 3.4), part='kol_2', line=True)
    d.curve('Kirmizi', [(48, 52), (53, 59), (42, 61), (30, 60)], (5.0, 3.6), part='kuyruk', line=True)
    alev(d, 24, 59, 1.6)
    d.set_face(32, 31, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
