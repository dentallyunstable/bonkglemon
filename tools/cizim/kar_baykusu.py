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
    tuy(d, cx, 8, 24.5, 5, 3.2)
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
    tuy(d, cx, 8.5, 22, 6, 3.6)
    gaga(d, cx, 35.5, 1.9, 1.7)
    d.set_face(cx, 28, gap=5, mouth=False)


def tuy(d, cx, dx, y, h, w):
    """Baykus kulak tuyu: kafanin ust kosesinden disa yatik sivri ucgen (tavsan kulagi gibi uzun/yuvarlak degil)."""
    for sx in (-1, 1):
        x = cx + sx * dx
        d.poly('Kar', [(x - sx * w, y + 2), (x + sx * w * 0.6, y + 2), (x + sx * w * 0.9, y - h)], part='tepe', line=True, lift=0.1)


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
    tuy(d, cx, 10, 23.5, 7, 4.2)
    flake(d, cx - 13, 15)
    flake(d, cx + 13, 15)
    gaga(d, cx, 38.5, 2.2, 1.9)
    d.set_face(cx, 31, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---- yandan gorunum (sola bakar) ----
def kanat_yan(d, part, root, tips, w, base_r, nm, lift=-0.1, ice=False, speck=()):
    d.ellipse('Kar', root, base_r, part=part, name=nm, line=True, lift=lift)
    for t in tips:
        d.capsule('Kar', root, t, w, part=part, join=nm)
    for (x, y) in speck:
        d.capsule('Tas', (x - 0.9, y), (x + 0.9, y + 2.0), 1.3, clip=nm, part=part, tone=3)
    if ice:
        for t in tips:
            d.circle('Kar', t, 2.3, clip=nm, part=part, shift=-2)
        d.pix((round(tips[0][0] - 1), round(tips[0][1] + 2)), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def tuy_yan(d, x, y, h, w, lift, name=None):
    d.poly('Kar', [(x - w, y + 2), (x + w * 0.8, y + 2), (x + w * 1.2, y - h)], part='tepe', line=True, lift=lift)


def bebek_yan(d):
    d.flyer = True
    kanat_yan(d, 'kanat_2', (27, 36), [(33, 27), (36, 32), (35, 38)], (4.0, 3.2), (3.8, 5.2), 'w2', lift=-0.25)
    d.ellipse('Sari', (26, 47), (3.0, 2.6), part='kol_2', line=True, noshadow=True, lift=-0.1)
    tuy_yan(d, 26.5, 24.5, 5, 3.0, -0.05)
    d.ellipse('Kar', (22, 35.5), (12.5, 12), name='govde', cast=1, lift=0.14)
    tuy_yan(d, 19, 24.5, 5, 3.2, 0.1)
    d.ellipse('Sari', (10, 37.5), (2.4, 1.9), line=True, noshadow=True)
    kanat_yan(d, 'kanat_1', (25, 38), [(32, 29), (35, 34), (34, 40)], (4.0, 3.2), (3.8, 5.2), 'w1', lift=-0.1)
    d.ellipse('Sari', (20, 47), (3.0, 2.6), part='kol_1', line=True, noshadow=True)
    d.set_face_side(14, 31)


def genc_yan(d):
    d.flyer = True
    sp = [(31, 31), (30, 37), (33, 40)]
    kanat_yan(d, 'kanat_2', (29, 38), [(36, 28), (39, 34), (38, 41)], (4.6, 3.6), (4.0, 6.0), 'w2', lift=-0.25)
    d.ellipse('Sari', (31, 54), (3.2, 2.6), part='kol_2', line=True, noshadow=True, lift=-0.1)
    tuy_yan(d, 27, 22, 6, 3.4, -0.05)
    d.ellipse('Kar', (25, 38), (13.5, 16), name='govde', cast=1, lift=0.14)
    d.ellipse('Kar', (24, 44.5), (13.5, 4.6), name='yaka', line=True, lift=0.22, cast=1)
    for x, dy in ((-10, 0), (-5, 0.9), (0, 0), (5, 0.9), (10, 0)):
        d.circle('Kar', (24 + x, 47.2 + dy), 3.1, join='yaka')
    for x, y in ((-5, 52), (0, 51), (5, 52.5), (-2.5, 55), (3, 55.5)):
        d.capsule('Tas', (24 + x - 0.7, y), (24 + x + 0.7, y + 1.3), 0.9, clip='govde', tone=2)
    tuy_yan(d, 19, 22, 6, 3.6, 0.1)
    d.ellipse('Sari', (11, 35.5), (2.5, 1.9), line=True, noshadow=True)
    kanat_yan(d, 'kanat_1', (28, 40), [(36, 30), (39, 36), (37, 43)], (5.0, 4.0), (4.4, 6.2), 'w1', lift=-0.1, speck=sp)
    d.ellipse('Sari', (22, 54), (3.2, 2.6), part='kol_1', line=True, noshadow=True)
    d.set_face_side(15, 29)


def usta_yan(d):
    d.flyer = True
    sp = [(34, 30), (33, 36), (36, 41), (37, 33)]
    tips = [(40, 23), (43, 31), (43, 40), (41, 47)]
    kanat_yan(d, 'kanat_2', (31, 40), [(38, 24), (42, 32), (41, 41)], (5.4, 4.4), (4.8, 7.4), 'w2', lift=-0.25, ice=True)
    d.ellipse('Sari', (35, 61), (3.4, 3.0), part='kol_2', line=True, noshadow=True, lift=-0.1)
    tuy_yan(d, 31, 23.5, 7, 3.8, -0.05)
    flake(d, 37, 14)
    d.ellipse('Kar', (29, 41), (16.5, 21.5), name='govde', cast=1, lift=0.14)
    d.ellipse('Kar', (28, 48.5), (16, 5.2), name='yaka', line=True, lift=0.22, cast=1)
    for x, dy in ((-12, 0), (-8, 0.9), (-4, 0), (0, 0.9), (4, 0), (8, 0.9), (12, 0)):
        d.circle('Kar', (28 + x, 51.5 + dy), 3.2, join='yaka')
    for x, y in ((-7, 57), (-1, 56.5), (6, 57.5), (-4, 60), (3, 60.5)):
        d.capsule('Tas', (28 + x - 0.7, y), (28 + x + 0.7, y + 1.3), 0.9, clip='govde', tone=2)
    tuy_yan(d, 22, 23.5, 7, 4.2, 0.1)
    flake(d, 22, 14)
    d.ellipse('Sari', (12, 38.5), (2.8, 2.2), line=True, noshadow=True)
    kanat_yan(d, 'kanat_1', (31, 42), [(39, 29), (43, 36), (42, 44), (39, 50)], (5.8, 4.6), (5.2, 8.0), 'w1', lift=-0.1, ice=True, speck=sp)
    d.ellipse('Sari', (25, 61), (3.4, 3.0), part='kol_1', line=True, noshadow=True)
    d.set_face_side(16, 31)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
