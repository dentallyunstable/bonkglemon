# Micir (Tas, siradan). Tarif: TARIFLER.md. Ust uste dizilmis cakil taslari; buyudukce tas sayisi artar, dengede durur.
# Renk: Tas (taslar), Gok (kristal). Yuz en alttaki buyuk tasta.
PARLA = 'Gok'


def pebble(d, fam, c, r, name, **kw):
    d.ellipse(fam, c, r, name=name, **kw)


def bebek(d):
    d.ellipse('Tas', (24, 34), (14, 11.5), name='tas', lift=0.04, cast=1)
    d.ellipse('Tas', (17, 29), (3.5, 2.2), clip='tas', shift=-1, rot=-30)
    d.circle('Tas', (32, 40), 2.2, clip='tas', shift=1)
    d.circle('Tas', (31, 29.5), 1.4, clip='tas', shift=1)
    d.ellipse('Tas', (17.5, 46), (3.8, 2.6), part='kol_1', line=True)
    d.ellipse('Tas', (30.5, 46), (3.8, 2.6), part='kol_2', line=True)
    d.set_face(24, 32, gap=5)


def genc(d):
    # ust tas: kucuk, hafif yana egik
    d.ellipse('Tas', (30, 25), (8.5, 6.5), name='ust', lift=0.06, rot=-8)
    d.ellipse('Tas', (27, 22.5), (2.6, 1.5), clip='ust', shift=-1, rot=-20)
    d.poly('Gok', [(33, 25), (32, 20), (34.5, 17.5), (37, 20), (36.5, 25)], name='kris', line=True)
    d.rect('Gok', (34, 19, 35, 23), clip='kris', shift=-1)
    # alt tas: buyuk, yuz burada
    d.ellipse('Tas', (28, 41), (14, 10), name='alt', lift=0.02, cast=2)
    d.ellipse('Tas', (20, 36), (3.6, 2.2), clip='alt', shift=-1, rot=-30)
    d.circle('Tas', (38, 45), 2.4, clip='alt', shift=1)
    d.circle('Tas', (37, 36), 1.5, clip='alt', shift=1)
    d.ellipse('Tas', (20.5, 51.5), (4, 2.6), part='kol_1', line=True)
    d.ellipse('Tas', (35.5, 51.5), (4, 2.6), part='kol_2', line=True)
    d.set_face(28, 37, gap=5)


def usta(d):
    d.ellipse('Tas', (33, 20), (6.2, 4.8), name='t3', lift=0.08, rot=-10)
    d.ellipse('Tas', (31, 18.5), (2, 1.2), clip='t3', shift=-1, rot=-20)
    d.poly('Gok', [(32, 17), (31, 11), (33.5, 8), (36.5, 11), (36, 17)], name='kris', line=True, part='tepe')
    d.poly('Gok', [(37, 17), (37.5, 13.5), (39.5, 12.5), (41, 15), (40, 17)], name='kris2', line=True, part='tepe')
    d.rect('Gok', (33, 10, 34, 15), clip='kris', shift=-1)
    d.ellipse('Tas', (30, 30), (10, 7), name='t2', lift=0.04, rot=6)
    d.ellipse('Tas', (25, 27.5), (3, 1.6), clip='t2', shift=-1, rot=-20)
    d.circle('Tas', (36, 33), 1.6, clip='t2', shift=1)
    d.ellipse('Tas', (32, 47), (17, 12), name='t1', cast=2)
    d.ellipse('Tas', (22, 41), (4.5, 2.4), clip='t1', shift=-1, rot=-30)
    d.circle('Tas', (44, 51), 2.8, clip='t1', shift=1)
    d.circle('Tas', (43, 41), 1.8, clip='t1', shift=1)
    d.circle('Tas', (20, 53), 1.8, clip='t1', shift=1)
    d.ellipse('Tas', (13.5, 50), (3.8, 3.4), part='kol_1', line=True, lift=0.05)
    d.ellipse('Tas', (50.5, 50), (3.8, 3.4), part='kol_2', line=True, lift=0.05)
    d.set_face(32, 43, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
