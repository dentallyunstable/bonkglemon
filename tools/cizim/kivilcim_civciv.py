# Kivilcim Civcivi (Ates, siradan). Tarif: TARIFLER.md. Basinda kivilcim tuyu olan heyecanli sari civciv: bebekte yumurta kabugu sapkali, gencte alev ibikli, ustada alev kuyruklu.
# Renk: Sari (govde), Turuncu (alev, kanat ucu, gaga), Kirmizi (ibik ucu); kabuk Krem. Parlak: Sari -> Kar, Turuncu -> Gok.
PARLA = 'Turuncu'


def gaga(d, cx, y, w=2.4):
    d.ellipse('Turuncu', (cx, y), (w, 1.5), line=True, noshadow=True)


def alev(d, x, y, h, w, part, name, kirmizi=True):
    """alev dili: tabani (x,y), yukari h."""
    d.capsule('Turuncu', (x, y), (x, y - h), (w, w * 0.45), part=part, line=True, name=name)
    if kirmizi:
        d.capsule('Kirmizi', (x, y - h * 0.55), (x, y - h), (w * 0.5, 1.2), part=part, clip=name, shift=0)
    d.pix((int(x) - 0, int(y - h * 0.4)), ['o'], {'o': 'Parilti'}, part=part) if False else None


def bebek(d):
    ayak = lambda x: d.ellipse('Turuncu', (x, 46), (3.2, 1.8), line=True, noshadow=True)
    ayak(19); ayak(29)
    d.ellipse('Sari', (24, 36), (13.4, 10.8), name='kafa', cast=1)
    d.circle('Sari', (11.5, 38), 2.8, part='kol_1', line=True)
    d.circle('Sari', (36.5, 38), 2.8, part='kol_2', line=True)
    # kabuk sapka: kafanin ustunde, kenari zikzak
    d.ellipse('Krem', (24, 26), (10.5, 7.5), name='sapka', part='tepe', line=True, inbox=(0, 0, 47, 27), cast=1)
    for i, x in enumerate((15, 18.5, 22, 25.5, 29, 32.5)):
        d.poly('Krem', [(x - 1.8, 26), (x + 1.8, 26), (x, 29.5 if i % 2 else 28)], part='tepe', join='sapka')
    d.circle('Turuncu', (20, 22), 1.3, part='tepe', clip='sapka', shift=0)
    d.circle('Turuncu', (28.5, 21.5), 1.2, part='tepe', clip='sapka', shift=0)
    # tek kivilcim tuyu
    d.capsule('Turuncu', (24, 21), (24, 12), (3.2, 2.0), part='tepe', line=True, name='tuy')
    d.capsule('Kirmizi', (24, 15), (24, 11.5), (1.8, 1.2), part='tepe', clip='tuy', shift=0)
    d.pix((23, 16), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, 24, 36.5)
    d.set_face(24, 31, gap=5, mouth=False)


def genc(d):
    cx = 28
    ayak = lambda x: d.ellipse('Turuncu', (x, 53), (3.6, 2), line=True, noshadow=True)
    ayak(22); ayak(34)
    d.curve('Turuncu', [(41, 46), (46, 42)], (3.6, 2.4), part='kuyruk', line=True)
    d.ellipse('Sari', (28, 45), (13.5, 9.5), name='govde', cast=1)
    d.ellipse('Sari', (28, 37), (14, 11.5), name='kafa', join='govde')
    d.ellipse('Krem', (28, 49), (8, 4.5), part='govde', clip='govde', shift=-1, inbox=(0, 47, 55, 60))
    # kanatlar, ucu turuncu
    d.ellipse('Sari', (13.5, 44), (3.4, 6.2), rot=14, part='kol_1', line=True)
    d.ellipse('Sari', (42.5, 44), (3.4, 6.2), rot=-14, part='kol_2', line=True)
    d.ellipse('Turuncu', (12.6, 48), (2.4, 2.6), rot=14, part='kol_1', clip='govde' if False else None) if False else None
    d.capsule('Turuncu', (12.5, 47), (13.5, 49.5), (3.0, 2.2), part='kol_1', line=True)
    d.capsule('Turuncu', (43.5, 47), (42.5, 49.5), (3.0, 2.2), part='kol_2', line=True)
    # alev ibik: uc dil
    d.capsule('Turuncu', (28, 27), (28, 17), (4.6, 2.2), part='tepe', line=True, name='ib1')
    d.capsule('Turuncu', (25.5, 27), (22.5, 19.5), (3.6, 1.8), part='tepe', line=True, name='ib2')
    d.capsule('Turuncu', (30.5, 27), (33.5, 20), (3.6, 1.8), part='tepe', line=True, name='ib3')
    d.capsule('Kirmizi', (28, 21), (28, 16.5), (2.4, 1.2), part='tepe', clip='ib1', shift=0)
    d.pix((27, 22), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, 28, 38.5)
    d.set_face(28, 33, gap=5, mouth=False)


def usta(d):
    cx = 32
    # yelpaze alev kuyruk (arkada)
    for ang, h in ((-58, 15), (0, 19), (58, 15)):
        import math
        a = math.radians(ang)
        bx, by = cx + math.sin(a) * 8, 52 - math.cos(a) * 2
        tx, ty = cx + math.sin(a) * 22, 52 - math.cos(a) * h - 6
        d.capsule('Turuncu', (bx, by), (tx, ty), (5.0, 3.0), part='kuyruk', line=True, name='k%d' % ang)
        d.capsule('Kirmizi', ((bx + tx * 2) / 3, (by + ty * 2) / 3), (tx, ty), (2.6, 1.4), part='kuyruk', clip='k%d' % ang, shift=0)
    d.pix((cx - 1, 33), ['oo'], {'o': 'Parilti'}, part='kuyruk') if False else None
    ayak = lambda x: d.ellipse('Turuncu', (x, 60), (4.2, 2.2), line=True, noshadow=True)
    ayak(25); ayak(39)
    d.ellipse('Sari', (32, 49), (16.5, 12.5), name='govde', cast=1)
    d.ellipse('Sari', (32, 37), (15.5, 14), name='kafa', join='govde')
    d.ellipse('Krem', (32, 54), (10, 5.5), part='govde', clip='govde', shift=-1, inbox=(0, 51, 63, 63))
    d.ellipse('Sari', (14.5, 49), (4, 8), rot=14, part='kol_1', line=True)
    d.ellipse('Sari', (49.5, 49), (4, 8), rot=-14, part='kol_2', line=True)
    d.capsule('Turuncu', (13.5, 53), (14.5, 56.5), (3.4, 2.6), part='kol_1', line=True)
    d.capsule('Turuncu', (50.5, 53), (49.5, 56.5), (3.4, 2.6), part='kol_2', line=True)
    # uc dilli alev ibik
    d.capsule('Turuncu', (32, 26), (32, 11), (6.0, 2.6), part='tepe', line=True, name='i1')
    d.capsule('Turuncu', (28, 26), (23, 14), (4.6, 2.2), part='tepe', line=True, name='i2')
    d.capsule('Turuncu', (36, 26), (41, 14), (4.6, 2.2), part='tepe', line=True, name='i3')
    d.capsule('Kirmizi', (32, 17), (32, 10.5), (3.2, 1.4), part='tepe', clip='i1', shift=0)
    d.capsule('Kirmizi', (24.5, 17), (23, 14), (2.4, 1.2), part='tepe', clip='i2', shift=0)
    d.capsule('Kirmizi', (39.5, 17), (41, 14), (2.4, 1.2), part='tepe', clip='i3', shift=0)
    d.pix((31, 21), ['oo'], {'o': 'Parilti'}, part='tepe')
    gaga(d, 32, 40, 2.8)
    d.set_face(32, 33, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
