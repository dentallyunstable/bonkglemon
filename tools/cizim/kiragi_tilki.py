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
