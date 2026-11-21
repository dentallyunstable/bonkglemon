# Yaprakbocek (Orman, nadir, ucar). Tarif: TARIFLER.md
# Komur tombul bocek (ugur bocegi kivaminda), Cimen yaprak: bebekte semsiye, gencte kanat kabugu, ustada uc yapraktan pelerin (alttaki Turuncu).
# Nadir: Turuncu vurgu + yaprak/cig damlasinda 2 piksel Parilti.
PARLA = 'Turuncu'


def leaf(d, fam, c, r, rot, part, name, vein=True, **kw):
    """Yaprak: genis elips, orta damar bir ton acik/koyu."""
    d.ellipse(fam, c, r, rot=rot, part=part, name=name, line=True, **kw)
    if vein:
        import math
        a = math.radians(rot)
        dx, dy = math.cos(a) * r[0] * 0.8, math.sin(a) * r[0] * 0.8
        d.capsule(fam, (c[0] - dx, c[1] - dy), (c[0] + dx, c[1] + dy), 0.9, clip=name, shift=1, part=part)


def plate(d, c, r):
    """Krem yuz levhasi: koyu govdede gozler okunsun diye (ugur bocegi yuz beneği gibi)."""
    d.ellipse('Krem', c, r, name='levha', lift=0.0)


def bebek(d):
    d.flyer = True
    d.ellipse('Komur', (11.5, 38), (2.4, 3.6), rot=20, part='kanat_1', line=True)
    d.ellipse('Komur', (36.5, 38), (2.4, 3.6), rot=-20, part='kanat_2', line=True)
    d.ellipse('Komur', (24, 37), (13.5, 11), name='kafa', lift=0.1, cast=1)
    plate(d, (24, 40), (9.5, 6.4))
    # sapin kivrik ucu
    d.curve('Cimen', [(24, 20), (25, 15.5), (28, 14), (30.5, 15.5)], 1.6, part='tepe', line=True)
    # yaprak: kendinden buyuk, ustten sarkar
    leaf(d, 'Cimen', (24, 26), (14.5, 6.2), -6, 'govde', 'yaprak', lift=0.05, cast=1)
    d.set_face(24, 35, gap=5, ten='Krem')


def genc(d):
    d.flyer = True
    # kanat kabugu: yaprak ikiye ayrilmis, yukari kalkik
    leaf(d, 'Cimen', (14, 28), (5.4, 12), -26, 'kanat_1', 'k1', lift=-0.05)
    leaf(d, 'Cimen', (42, 28), (5.4, 12), 26, 'kanat_2', 'k2', lift=-0.05)
    d.pix((12, 21), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.capsule('Komur', (23, 26), (19.5, 16), 1.6, part='tepe', line=True)
    d.capsule('Komur', (33, 26), (36.5, 16), 1.6, part='tepe', line=True)
    d.circle('Turuncu', (19, 14.5), 2.3, part='tepe', line=True)
    d.circle('Turuncu', (37, 14.5), 2.3, part='tepe', line=True)
    d.ellipse('Komur', (28, 47), (12, 8.2), name='govde', lift=0.1)
    d.ellipse('Komur', (28, 36), (14, 11.5), name='kafa', lift=0.1, cast=2)
    plate(d, (28, 38), (9.8, 7))
    d.capsule('Komur', (17.5, 46), (14.5, 50), 3.2, part='kol_1', line=True, lift=0.1)
    d.capsule('Komur', (38.5, 46), (41.5, 50), 3.2, part='kol_2', line=True, lift=0.1)
    d.ellipse('Komur', (22, 53), (3.2, 2), part='govde', lift=0.1)
    d.ellipse('Komur', (34, 53), (3.2, 2), part='govde', lift=0.1)
    d.set_face(28, 34, gap=5, ten='Krem')


def usta(d):
    d.flyer = True
    # pelerin: her yanda uc yaprak, en alttaki Turuncu
    for sgn, part in ((-1, 'kanat_1'), (1, 'kanat_2')):
        cx = 32 + sgn * 17
        leaf(d, 'Turuncu', (cx + sgn * 2, 47), (5.0, 11), sgn * -8, part, 'o%d' % sgn, lift=-0.05)
        leaf(d, 'Cimen', (cx + sgn * 1, 39), (5.4, 12), sgn * -22, part, 'm%d' % sgn, lift=-0.1)
        leaf(d, 'Cimen', (cx - sgn * 1, 31), (5.4, 12), sgn * -40, part, 'u%d' % sgn, lift=0.05)
    d.pix((13, 28), ['oo', 'o.'], {'o': 'Parilti'}, part='kanat_1')
    d.curve('Komur', [(27, 21), (25, 16.5), (23, 13.5)], 1.8, part='tepe', line=True)
    d.curve('Komur', [(37, 21), (39, 16.5), (41, 13.5)], 1.8, part='tepe', line=True)
    d.circle('Turuncu', (22.5, 12.5), 3.0, part='tepe', line=True)
    d.circle('Turuncu', (41.5, 12.5), 3.0, part='tepe', line=True)
    d.pix((21, 11), ['oo', 'o.'], {'o': 'Parilti'}, part='tepe')
    d.ellipse('Komur', (32, 50), (15, 10), name='govde', lift=0.1)
    d.ellipse('Komur', (32, 34), (16, 14.5), name='kafa', lift=0.1, cast=2)
    plate(d, (32, 37), (11, 8))
    d.capsule('Komur', (19, 51), (14.5, 57), 4.4, part='kol_1', line=True, lift=0.1)
    d.capsule('Komur', (45, 51), (49.5, 57), 4.4, part='kol_2', line=True, lift=0.1)
    d.set_face(32, 33, gap=6, ten='Krem')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
