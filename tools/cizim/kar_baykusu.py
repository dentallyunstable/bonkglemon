# Kar Baykusu (Buz, nadir, ucar). Tarif: TARIFLER.md. Uzun yumurta govdeli vakur beyaz baykus; boynunda kabarik tuy atki.
# Renk: Kar (tuy), Tas (benek, kanat ici), Sari (gaga, pencere). Nadir: usta kanat uclari ve kar tanesi tuyleri Parilti ile isildar.
# mese_baykusu'ndan farki: palamut/sapka yok, dik uzun yumurta, genis kabarik yaka, kanatlar acik ve ayri tuylu.
PARLA = 'Kar'


def kanat(d, side, cx, root, tips, n=3, w=(4.6, 3.6), base_r=(4.6, 5.6), nm='w', ice=False, speck=False):
    """Kalkik kanat: govdeye degen yuvarlak kok + n adet tombul tuy parmagi. side 1 sol (kanat_1), 2 sag (kanat_2).
    root, tips sol icin verilir (sag aynalanir)."""
    m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
    part = 'kanat_%d' % side
    name = '%s%d' % (nm, side)
    d.ellipse('Kar', m(root), base_r, part=part, name=name, line=True, lift=-0.1)
    for i, t in enumerate(tips):
        d.capsule('Kar', m(root), m(t), w, part=part, join=name)
    if speck:
        for (x, y) in speck:
            d.capsule('Tas', m((x - 0.9, y)), m((x + 0.9, y + 2.0)), 1.3, clip=name, part=part, tone=3)
    if ice:
        for t in tips:
            d.circle('Kar', m(t), 2.3, clip=name, part=part, shift=-2)
        px, py = m((tips[0][0] - 1, tips[0][1] + 2))
        d.pix((round(px), round(py)), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def ayak(d, cx, y, dx, h=2.6):
    for s in (-1, 1):
        d.ellipse('Sari', (cx + s * dx, y), (3.2, h), line=True, noshadow=True)


def gaga(d, cx, y, w=1.9, h=1.7):
    d.ellipse('Sari', (cx, y), (w, h), line=True, noshadow=True)


def bebek(d):
    d.flyer = True
    cx = 24
    kanat(d, 1, cx, (13.5, 38), [(8, 31), (6.5, 35), (7.5, 40)], w=(4.0, 3.2), base_r=(3.8, 5.2))
    kanat(d, 2, cx, (13.5, 38), [(8, 31), (6.5, 35), (7.5, 40)], w=(4.0, 3.2), base_r=(3.8, 5.2))
    ayak(d, cx, 46.5, 5)
    d.ellipse('Kar', (cx, 35.5), (13.5, 12.5), name='govde', cast=1, lift=0.14)
    # minik kulak tuyleri (tepe)
    d.ellipse('Kar', (cx - 8, 22), (2.4, 4.4), rot=-22, part='tepe', line=True, lift=0.1)
    d.ellipse('Kar', (cx + 8, 22), (2.4, 4.4), rot=22, part='tepe', line=True, lift=0.1)
    gaga(d, cx, 38, 1.8, 1.6)
    d.set_face(cx, 31, gap=5, mouth=False)


def genc(d):
    d.flyer = True
    cx = 28
    sp = [(8.5, 30), (8, 36), (11.5, 41), (11, 33)]
    kanat(d, 1, cx, (15, 40), [(9.5, 28), (7.5, 34), (9, 40.5)], w=(5.0, 4.0), base_r=(4.6, 6.4), speck=sp)
    kanat(d, 2, cx, (15, 40), [(9.5, 28), (7.5, 34), (9, 40.5)], w=(5.0, 4.0), base_r=(4.6, 6.4), speck=sp)
    ayak(d, cx, 54, 6)
    # uzun yumurta govde
    d.ellipse('Kar', (cx, 38), (14, 17), name='govde', cast=1, lift=0.14)
    # tombul tuy atki (yaka)
    d.ellipse('Kar', (cx, 44.5), (14.5, 4.6), name='yaka', line=True, lift=0.22, cast=1)
    for x in (-12, -7, -2.5, 2.5, 7, 12):
        d.circle('Kar', (cx + x, 47.2 + (0.9 if abs(x) in (7, 2.5) else 0)), 3.1, join='yaka')
    # karin lekeleri
    for x, y in ((-5, 52), (0, 51), (5, 52.5), (-2.5, 55), (3, 55.5)):
        d.capsule('Tas', (cx + x - 0.7, y), (cx + x + 0.7, y + 1.3), 0.9, clip='govde', tone=2)
    d.ellipse('Kar', (cx - 8.5, 18.5), (2.6, 5.2), rot=-22, part='tepe', line=True, lift=0.1)
    d.ellipse('Kar', (cx + 8.5, 18.5), (2.6, 5.2), rot=22, part='tepe', line=True, lift=0.1)
    gaga(d, cx, 35.5, 1.9, 1.7)
    d.set_face(cx, 28, gap=5, mouth=False)


def flake(d, x, y, part='tepe'):
    """7x7 kar tanesi tuyu: Kar govde, Tas ic damar, ortada Parilti."""
    d.pix((x - 3, y - 3), ['#..#..#',
                           '.#.#.#.',
                           '..###..',
                           '#######',
                           '..#o#..',
                           '.#.#.#.',
                           '#..#..#'], {'#': 'Kar-1', 'o': 'Parilti'}, part=part)


def usta(d):
    d.flyer = True
    cx = 32
    sp = [(10.5, 28), (9, 35), (12, 40), (12.5, 31), (8, 44)]
    tips = [(11, 22), (7.5, 29), (6.5, 37), (8.5, 44)]
    kanat(d, 1, cx, (17.5, 42), tips, w=(5.8, 4.6), base_r=(5.4, 8.2), ice=True, speck=sp)
    kanat(d, 2, cx, (17.5, 42), tips, w=(5.8, 4.6), base_r=(5.4, 8.2), ice=True, speck=sp)
    ayak(d, cx, 61, 7, 3.0)
    d.ellipse('Kar', (cx, 41), (17, 21.5), name='govde', cast=1, lift=0.14)
    d.ellipse('Kar', (cx, 48.5), (16.5, 5.2), name='yaka', line=True, lift=0.22, cast=1)
    for x in (-13, -8.5, -4, 0, 4, 8.5, 13):
        d.circle('Kar', (cx + x, 51.5 + (0.9 if abs(x) in (4, 8.5) else 0)), 3.3, join='yaka')
    for x, y in ((-7, 57), (-1, 56.5), (6, 57.5), (-4, 60), (3, 60.5)):
        d.capsule('Tas', (cx + x - 0.7, y), (cx + x + 0.7, y + 1.3), 0.9, clip='govde', tone=2)
    d.ellipse('Kar', (cx - 10, 21), (3.0, 5.2), rot=-22, part='tepe', line=True, lift=0.1)
    d.ellipse('Kar', (cx + 10, 21), (3.0, 5.2), rot=22, part='tepe', line=True, lift=0.1)
    flake(d, cx - 10, 16)
    flake(d, cx + 10, 16)
    gaga(d, cx, 38.5, 2.2, 1.9)
    d.set_face(cx, 31, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
