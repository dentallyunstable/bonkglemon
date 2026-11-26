# Gece Kelebegi (Golge, nadir, ucar). Tarif: TARIFLER.md. Tombul Mor govdeli, gece gogu gibi sivri Lacivert kanatli kelebek;
# kanatlarda Sari yildiz benekleri, ustada ust kanatta Sari hilal, alt kanatta yildiz dizisi.
# Renk: Lacivert (kanat), Mor (govde), Sari (hilal, yildiz). Parlak: Lacivert -> Pembe. Kanatlar "yukari" halde cizili.
PARLA = 'Sari'

STAR = ['.o.', 'ooo', '.o.']
CRES = ['..###', '.##..', '##...', '##...', '##...', '.##..', '..###']


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def flip(rows):
    return [r[::-1] for r in rows]


def put(d, cx, x, y, rows, part_l='kanat_1', cols=None, both=True):
    """Deseni sol kanada (x,y sol-ust) ve aynasini sag kanada basar."""
    cols = cols or {'o': 'Sari-1', '#': 'Sari-1'}
    d.pix((x, y), rows, cols, part=part_l)
    if both:
        w = len(rows[0])
        d.pix((int(2 * cx - x - w + 1), y), flip(rows), cols, part='kanat_2')


def wings(d, cx, L, name, lift=0.0, part=None):
    d.poly('Lacivert', L, part=part or 'kanat_1', name=name + '1', line=True, lift=lift)
    d.poly('Lacivert', mir(L, cx), part='kanat_2', name=name + '2', line=True, lift=lift)


def govde(d, c, r, tufts):
    d.ellipse('Mor', c, r, name='g', lift=0.05, cast=1)
    for x, y, rr in tufts:
        d.circle('Mor', (x, y), rr, join='g')


def anten(d, cx, y, dx, h, w=1.4):
    for s in (-1, 1):
        d.curve('Mor', [(cx + s * dx, y), (cx + s * (dx + 1), y - h), (cx + s * (dx + 4), y - h - 2)], w, part='tepe', line=True)


def bebek(d):
    d.flyer = True
    cx = 24
    W = [(15, 40), (7, 34), (3, 24), (2, 15), (9, 19), (16, 27), (19, 33)]
    wings(d, cx, W, 'w')
    d.capsule('Lacivert', (14, 36), (5, 20), 1.0, clip='w1', shift=1)
    d.capsule('Lacivert', (34, 36), (43, 20), 1.0, clip='w2', shift=1)
    anten(d, cx, 27, 4, 6)
    govde(d, (24, 36), (12.5, 11), [(15, 42, 3), (33, 42, 3), (24, 46.5, 3.3), (19, 45.5, 3), (29, 45.5, 3)])
    d.set_face(24, 33, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    U = [(18, 38), (9, 33), (4, 23), (3, 13), (11, 17), (19, 25), (23, 32)]
    Lo = [(19, 44), (10, 44), (5, 50), (9, 56), (16, 54), (22, 50)]
    wings(d, cx, Lo, 'lo')
    wings(d, cx, U, 'up')
    d.capsule('Lacivert', (17, 36), (6, 19), 1.0, clip='up1', shift=1)
    d.capsule('Lacivert', (39, 36), (50, 19), 1.0, clip='up2', shift=1)
    put(d, cx, 8, 24, STAR)
    put(d, cx, 11, 48, STAR)
    d.pix((7, 18), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    anten(d, cx, 27, 4, 7)
    govde(d, (28, 38), (14.5, 13.5), [(18, 47, 3.4), (38, 47, 3.4), (28, 52.5, 3.6), (22, 51.5, 3.2), (34, 51.5, 3.2)])
    d.set_face(28, 36, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    U = [(20, 43), (9, 38), (3, 29), (2, 18), (12, 19), (22, 27), (26, 37)]
    Lo = [(20, 50), (9, 50), (3, 58), (8, 65), (16, 63), (23, 58)]
    wings(d, cx, Lo, 'lo')
    wings(d, cx, U, 'up')
    d.capsule('Lacivert', (18, 41), (8, 36), 1.0, clip='up1', shift=1)
    d.capsule('Lacivert', (46, 41), (56, 36), 1.0, clip='up2', shift=1)
    put(d, cx, 6, 24, CRES, cols={'o': 'Sari-1', '#': 'Sari-1'})
    put(d, cx, 6, 55, STAR)
    put(d, cx, 11, 60, STAR)
    put(d, cx, 15, 54, STAR)
    d.pix((14, 32), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    anten(d, cx, 29, 5, 8, 1.6)
    govde(d, (32, 45), (17.5, 18), [(18, 56, 3.8), (46, 56, 3.8), (32, 63, 4), (24, 62, 3.6), (40, 62, 3.6)])
    # ince Kar yaka degil: gogus tuyu Mor-acik
    d.set_face(32, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, kanatlar yukari
def kelebek_yan(d, s, ox, oy, alt=False):
    """Bebek olcusunda tasarla (24,44 capa), s ile buyut. Yakin kanat kanat_1, uzak kanat_2."""
    P = lambda x, y: (ox + (x - 24) * s, oy + (y - 44) * s)
    L = lambda pts: [P(*q) for q in pts]
    # uzak kanatlar (arkada, koyu)
    if alt:
        d.poly('Lacivert', L([(30, 42), (36, 44), (42, 50), (38, 55), (31, 51)]), part='kanat_2', name='lf', line=True, lift=-0.25)
    d.poly('Lacivert', L([(24, 34), (26, 24), (29, 14), (36, 19), (38, 30), (32, 38)]), part='kanat_2', name='uf', line=True, lift=-0.25)
    d.capsule('Lacivert', P(28, 31), P(32, 18), 1.0 * s, clip='uf', shift=1, part='kanat_2')
    # govde
    d.ellipse('Mor', P(22, 38), (11.5 * s, 10.2 * s), name='g', lift=0.05, cast=1)
    for x, y, r in ((17, 46.5, 3), (27, 46.5, 3), (22, 48.5, 3), (13, 43, 2.6)):
        d.circle('Mor', P(x, y), r * s, join='g')
    # anten (tepe)
    for dx, tone in ((-2, 0), (3, 0)):
        d.curve('Mor', [P(16 + dx, 29), P(13 + dx, 22), P(8 + dx, 18)], 1.4 * s, part='tepe', line=True)
    # yakin kanatlar
    if alt:
        d.poly('Lacivert', L([(28, 40), (35, 41), (42, 47), (38, 53), (30, 49)]), part='kanat_1', name='ln', line=True)
    d.poly('Lacivert', L([(24, 36), (27, 28), (33, 19), (41, 22), (42, 32), (36, 40)]), part='kanat_1', name='un', line=True)
    d.capsule('Lacivert', P(27, 33), P(37, 24), 1.1 * s, clip='un', shift=1, part='kanat_1')
    return P


def bebek_yan(d):
    d.flyer = True
    P = kelebek_yan(d, 1.0, 24, 44)
    d.pix(P(34, 24), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.set_face_side(14, 34)


def genc_yan(d):
    d.flyer = True
    P = kelebek_yan(d, 1.15, 26, 47, alt=True)
    x, y = P(32, 28); d.pix((round(x) - 1, round(y)), STAR, {'o': 'Sari-1'}, part='kanat_1')
    x, y = P(34, 45); d.pix((round(x) - 1, round(y)), STAR, {'o': 'Sari-1'}, part='kanat_1')
    d.pix(P(36, 23), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.set_face_side(14, 38)


def usta_yan(d):
    d.flyer = True
    P = kelebek_yan(d, 1.36, 27, 52, alt=True)
    x, y = P(28, 23); d.pix((round(x), round(y)), CRES, {'#': 'Sari-1'}, part='kanat_1')
    x, y = P(33, 44); d.pix((round(x) - 1, round(y)), STAR, {'o': 'Sari-1'}, part='kanat_1')
    x, y = P(38, 47); d.pix((round(x) - 1, round(y)), STAR, {'o': 'Sari-1'}, part='kanat_1')
    d.pix(P(36, 28), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.set_face_side(*[int(round(v / 2)) * 2 for v in P(12.5, 34)])


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
