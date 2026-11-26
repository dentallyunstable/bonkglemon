# Kiragi Tilkisi (Buz, siradan). Tarif: TARIFLER.md. Kuyrugu govdesinden buyuk beyaz tilki; kuyruk ve kulak uclari mavi kiragili.
# Renk: Kar (tuy; govde acik, kuyruk bir ton koyu ki ayrilsin), Gok (kiragi). Kuyruk her asamada en buyuk parca. Parlak: Gok -> Pembe.
PARLA = 'Gok'


def kulak(d, cx, y, s, side, h=6.5, w=4.0):
    """Tilki kulagi: genis tabanli, ucu yuvarlatilmis ucgen; ucu Gok kiragi. side 1 sol, 2 sag."""
    m = (lambda x: x) if side == 1 else (lambda x: 2 * cx - x)
    x = cx - s
    pts = [(m(x - w * 1.3), y + h), (m(x - w * 0.45), y - h * 0.8), (m(x + w * 0.1), y - h), (m(x + w * 0.5), y - h * 0.6), (m(x + w * 1.2), y + h)]
    nm = 'k%d' % side
    d.poly('Kar', pts, part='kulak_%d' % side, name=nm, line=True, lift=0.12)
    d.ellipse('Gok', (m(x - w * 0.1), y - h + 1.2), (w + 0.8, 3.4), clip=nm, tone=2, part='kulak_%d' % side)


def bebek(d):
    cx = 24
    kulak(d, cx, 22.5, 8.5, 1, 5.4, 3.6)
    kulak(d, cx, 22.5, 8.5, 2, 5.4, 3.6)
    d.ellipse('Kar', (cx, 33), (13.5, 10.8), name='kafa', cast=1, lift=0.14)
    d.circle('Kar', (cx - 12.5, 37), 2.4, join='kafa')
    d.circle('Kar', (cx + 12.5, 37), 2.4, join='kafa')
    # kuyruk govdeyi dolayip onde kivrilir, ucu mavi
    d.curve('Kar', [(38, 34), (40, 42), (32, 46.5), (18, 46.5), (10, 42.5)], (6.5, 7.5), part='kuyruk', name='ky', line=True, lift=-0.1)
    d.ellipse('Gok', (9, 42), (4.6, 4.4), clip='ky', tone=2, part='kuyruk')
    d.capsule('Kar', (22, 44.8), (33, 45), 0.9, clip='ky', shift=1, part='kuyruk')
    d.capsule('Kar', (38, 38), (38.6, 44), 0.9, clip='ky', shift=1, part='kuyruk')
    d.set_face(cx, 30, gap=5)


def genc(d):
    cx = 24
    # dik duran dev kuyruk, arkada
    d.curve('Kar', [(32, 51), (40, 49), (44, 38), (42, 27), (37, 20)], (8.5, 12.5), part='kuyruk', name='ky', line=True, lift=-0.1)
    d.ellipse('Gok', (38.5, 21.5), (6.8, 6.2), rot=-35, clip='ky', tone=2, part='kuyruk')
    d.ellipse('Gok', (42, 27), (3.2, 2.2), rot=-60, clip='ky', tone=2, part='kuyruk')
    d.capsule('Kar', (41, 46), (43.5, 36), 1.0, clip='ky', shift=1, part='kuyruk')
    d.capsule('Kar', (37, 42), (39, 32), 1.0, clip='ky', shift=1, part='kuyruk')
    kulak(d, cx, 19.5, 9, 1, 7.4, 4.0)
    kulak(d, cx, 19.5, 9, 2, 7.4, 4.0)
    d.ellipse('Kar', (cx, 45), (12.5, 10.5), name='govde', cast=1, lift=0.16)
    d.ellipse('Kar', (cx, 33.5), (14, 11.8), name='kafa', join='govde', lift=0.14)
    d.ellipse('Kar', (cx - 7, 52.5), (4.4, 2.6), part='kol_1', line=True, lift=0.1)
    d.ellipse('Kar', (cx + 7, 52.5), (4.4, 2.6), part='kol_2', line=True, lift=0.1)
    d.set_face(cx, 31, gap=5)


def kristal(d, x, y, part='kuyruk'):
    """Kar tanesi, 9x9 piksel: Gok kollar, ortada Parilti."""
    d.pix((x - 4, y - 4), ['#...#...#',
                           '.#..#..#.',
                           '..#.#.#..',
                           '...###...',
                           '#####o###',
                           '...###...',
                           '..#.#.#..',
                           '.#..#..#.',
                           '#...#...#'], {'#': 'Gok-3', 'o': 'Parilti'}, part=part)


def usta(d):
    cx = 26
    # dev kuyruk: arkada kabarik, ucu kar tanesi
    d.curve('Kar', [(36, 58), (44, 55), (47, 43), (45, 32), (41, 25)], (11, 15), part='kuyruk', name='ky', line=True, lift=-0.1)
    d.ellipse('Gok', (42.5, 27), (8.2, 7.5), rot=-40, clip='ky', tone=2, part='kuyruk')
    d.ellipse('Gok', (46.5, 34), (3.6, 2.4), rot=-70, clip='ky', tone=2, part='kuyruk')
    d.capsule('Kar', (46, 52), (48, 41), 1.2, clip='ky', shift=1, part='kuyruk')
    d.capsule('Kar', (41, 49), (43, 38), 1.2, clip='ky', shift=1, part='kuyruk')
    kristal(d, 43, 16)
    kulak(d, cx, 17, 10.5, 1, 7.4, 4.4)
    kulak(d, cx, 17, 10.5, 2, 7.4, 4.4)
    d.ellipse('Kar', (cx, 48), (14.5, 13), name='govde', cast=1, lift=0.1)
    d.ellipse('Kar', (cx, 33), (15.5, 13), name='kafa', join='govde', lift=0.14)
    d.ellipse('Kar', (cx - 9, 58), (5, 3.0), part='kol_1', line=True, lift=0.1)
    d.ellipse('Kar', (cx + 9, 58), (5, 3.0), part='kol_2', line=True, lift=0.1)
    # kabarik gogus yakasi: tombul tuy tutamlari
    d.ellipse('Kar', (cx, 46.5), (10.5, 5.2), name='yaka', line=True, lift=0.2, cast=1)
    for x in (-7.5, -2.5, 2.5, 7.5):
        d.circle('Kar', (cx + x, 50.5), 3.0, join='yaka')
    d.set_face(cx, 30, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---- yandan gorunum (sola bakar) ----
def kulak_yan(d, x, y, w, h, back, part, name, lift=0.12):
    """Ucu arkaya (saga) yatik ucgen kulak, ucu Gok kiragi. (x, y) taban ortasi."""
    pts = [(x - w * 0.55, y), (x - w * 0.35 + back * 0.4, y - h * 0.7), (x + back, y - h), (x + w * 0.4 + back * 0.6, y - h * 0.6), (x + w * 0.6, y)]
    d.poly('Kar', pts, part=part, name=name, line=True, lift=lift)
    d.ellipse('Gok', (x + back * 0.9, y - h + 1.6), (w * 0.45 + 1.0, 3.4), rot=25, clip=name, tone=2, part=part)


def bebek_yan(d):
    # kuyruk govdeyi dolayip onde kivrilir, ucu mavi
    d.curve('Kar', [(35, 33), (40, 41), (32, 46.5), (18, 46.5), (11, 43.5)], (6.5, 7.5), part='kuyruk', name='ky', line=True, lift=-0.22)
    d.ellipse('Gok', (10.5, 43), (4.4, 4.2), clip='ky', tone=2, part='kuyruk')
    d.capsule('Kar', (22, 44.8), (33, 45), 0.9, clip='ky', shift=1, part='kuyruk')
    d.capsule('Kar', (38, 38), (38.6, 43), 0.9, clip='ky', shift=1, part='kuyruk')
    kulak_yan(d, 28, 29, 8, 10.5, 3, 'kulak_2', 'e2', lift=-0.02)
    d.ellipse('Kar', (24, 35), (12.5, 10.8), name='kafa', cast=1, lift=0.14)
    d.ellipse('Kar', (13, 38), (4.2, 3.2), join='kafa')
    d.pix2((6, 19), ['#'], {'#': 'Komur-4'})
    kulak_yan(d, 21, 29, 8.5, 11.5, 3, 'kulak_1', 'e1')
    d.set_face_side(15, 31)


def genc_yan(d):
    d.curve('Kar', [(34, 51), (42, 49), (46, 39), (44, 29), (39, 23)], (8.5, 12.5), part='kuyruk', name='ky', line=True, lift=-0.22)
    d.ellipse('Gok', (40, 24.5), (6.8, 6.2), rot=-35, clip='ky', tone=2, part='kuyruk')
    d.ellipse('Gok', (44.5, 30), (3.2, 2.2), rot=-60, clip='ky', tone=2, part='kuyruk')
    d.capsule('Kar', (43, 46), (45, 38), 1.0, clip='ky', shift=1, part='kuyruk')
    d.capsule('Kar', (39, 42), (41, 34), 1.0, clip='ky', shift=1, part='kuyruk')
    d.ellipse('Kar', (31, 55.5), (4.4, 2.6), part='kol_2', line=True, lift=0.0)
    kulak_yan(d, 30, 26, 9, 11, 4, 'kulak_2', 'e2', lift=-0.02)
    d.ellipse('Kar', (27, 45), (11.5, 10), name='govde', cast=1, lift=0.16)
    d.ellipse('Kar', (23, 34), (13.5, 11.5), name='kafa', join='govde', lift=0.14)
    d.ellipse('Kar', (11, 37), (4.4, 3.4), join='govde')
    d.pix2((4, 18), ['#'], {'#': 'Komur-4'})
    kulak_yan(d, 22, 26, 10, 12, 4, 'kulak_1', 'e1')
    d.ellipse('Kar', (21, 55.5), (4.4, 2.6), part='kol_1', line=True, lift=0.1)
    d.set_face_side(15, 32)


def usta_yan(d):
    d.curve('Kar', [(37, 58), (46, 55), (49, 43), (47, 32), (43, 25)], (11, 15), part='kuyruk', name='ky', line=True, lift=-0.22)
    d.ellipse('Gok', (44.5, 27), (8.2, 7.5), rot=-40, clip='ky', tone=2, part='kuyruk')
    d.ellipse('Gok', (48.5, 34), (3.6, 2.4), rot=-70, clip='ky', tone=2, part='kuyruk')
    d.capsule('Kar', (48, 52), (50, 41), 1.2, clip='ky', shift=1, part='kuyruk')
    d.capsule('Kar', (43, 49), (45, 38), 1.2, clip='ky', shift=1, part='kuyruk')
    kristal(d, 46, 15)
    d.ellipse('Kar', (33, 62), (5, 3.0), part='kol_2', line=True, lift=0.0)
    kulak_yan(d, 31, 25, 10, 11.5, 4, 'kulak_2', 'e2', lift=-0.02)
    d.ellipse('Kar', (28, 48), (13.5, 12.5), name='govde', cast=1, lift=0.1)
    d.ellipse('Kar', (24, 33), (15, 13), name='kafa', join='govde', lift=0.14)
    d.ellipse('Kar', (10, 36.5), (4.8, 3.6), join='govde')
    d.pix2((3, 18), ['#'], {'#': 'Komur-4'})
    kulak_yan(d, 23, 25, 11, 12.5, 4, 'kulak_1', 'e1')
    d.ellipse('Kar', (21, 47.5), (8, 5), name='yaka', line=True, lift=0.2, cast=1)
    for x, y in ((15, 49.5), (17, 53.5), (22, 55.5)):
        d.circle('Kar', (x, y), 3.0, join='yaka')
    d.ellipse('Kar', (22, 62), (5, 3.0), part='kol_1', line=True, lift=0.1)
    d.set_face_side(15, 31)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
