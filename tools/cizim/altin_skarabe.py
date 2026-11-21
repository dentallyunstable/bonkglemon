# Altin Skarabe (Kum, epik). Tarif: TARIFLER.md. Gunes topunu hazinesi gibi tasiyan altin bocek.
# Renk: Sari (govde, top), Lacivert (cizgi, boynuz), Cam (turkuaz tas). Parlak: Sari -> Tas.
PARLA = 'Sari'


def top(d, cx, cy, r, part='esya'):
    """Parlak gunes topu: acik sari kure + sicak cekirdek + Parilti vurgu."""
    d.circle('Turuncu', (cx, cy), r, part=part, name='top', line=True, lift=0.1)
    d.circle('Sari', (cx - r * .1, cy - r * .1), r * .72, part=part, clip='top', shift=-1, lift=0.3)
    d.circle('Krem', (cx - r * .2, cy - r * .2), r * .42, part=part, clip='top', tone=0)
    d.pix((int(cx - r * .55), int(cy - r * .6)), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def anten(d, cx, y, dx, part='tepe'):
    d.capsule('Lacivert', (cx - dx, y), (cx - dx - 2, y - 5), (1.6, 1.2), part=part, name='a1', line=False)
    d.capsule('Lacivert', (cx + dx, y), (cx + dx + 2, y - 5), (1.6, 1.2), part=part, name='a2', line=False)
    d.circle('Lacivert', (cx - dx - 2, y - 5.5), 1.5, part=part, lift=0.1)
    d.circle('Lacivert', (cx + dx + 2, y - 5.5), 1.5, part=part, lift=0.1)


def bebek(d):
    d.ellipse('Sari', (24, 33), (13.5, 10), name='g', cast=1, lift=-0.08)
    d.ellipse('Sari', (24, 24.5), (6, 2.4), clip='g', shift=-1)
    anten(d, 24, 24, 4)
    # on ayaklariyla toba sarilmis
    top(d, 24, 44.5, 6, 'kol_1')
    d.capsule('Sari', (12, 39), (18, 46), 3.8, part='kol_1', line=True)
    d.capsule('Sari', (36, 39), (30, 46), 3.8, part='kol_2', line=True)
    d.set_face(24, 31, gap=5)


def genc(d):
    d.ellipse('Sari', (28, 40), (15.5, 14.2), name='g', cast=1, lift=-0.08)
    # kabukta lacivert cizgiler (yuz alaninin disinda, yanlarda)
    d.curve('Lacivert', [(17, 44), (16, 49), (19, 54)], 1.1, clip='g', shift=0)
    d.curve('Lacivert', [(39, 44), (40, 49), (37, 54)], 1.1, clip='g', shift=0)
    d.capsule('Lacivert', (28, 50), (28, 55), 1.1, clip='g', shift=0)
    d.curve('Lacivert', [(12, 40), (11.5, 46), (14, 50)], 1.0, clip='g', shift=0)
    d.curve('Lacivert', [(44, 40), (44.5, 46), (42, 50)], 1.0, clip='g', shift=0)
    anten(d, 28, 28, 4)
    # top basin ustunde, kollar kaldirmis
    d.capsule('Sari', (13, 40), (19, 25), 3.8, part='kol_1', line=True)
    d.capsule('Sari', (43, 40), (37, 25), 3.8, part='kol_2', line=True)
    top(d, 28, 20, 8)
    d.set_face(28, 37, gap=5)


def usta(d):
    d.ellipse('Sari', (32, 47), (18.5, 20), name='g', cast=1, lift=-0.08)
    # kabuk cizgileri
    d.curve('Lacivert', [(15, 42), (13.5, 52), (17, 62)], 1.2, clip='g', shift=0)
    d.curve('Lacivert', [(49, 42), (50.5, 52), (47, 62)], 1.2, clip='g', shift=0)
    d.capsule('Lacivert', (32, 58), (32, 66), 1.1, clip='g', shift=0)
    d.curve('Lacivert', [(20, 60), (32, 63), (44, 60)], 1.0, clip='g', shift=0)
    d.capsule('Sari', (17, 55), (13, 63), 4.4, part='kol_1', line=True)
    d.capsule('Sari', (47, 55), (51, 63), 4.4, part='kol_2', line=True)
    # turkuaz tas
    d.poly('Cam', [(32, 52), (36.5, 57), (32, 62), (27.5, 57)], part='govde', name='tas', line=True)
    d.pix((30, 55), ['o'], {'o': 'Parilti'}, part='govde')
    # iki boynuz ve aralarinda gunes
    d.curve('Lacivert', [(21, 30), (16, 21), (19, 12)], 3.6, part='tepe', name='b1', line=False, lift=0.05)
    d.curve('Lacivert', [(43, 30), (48, 21), (45, 12)], 3.6, part='tepe', name='b2', line=False, lift=0.05)
    top(d, 32, 17, 9.4, 'tepe')
    d.set_face(32, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
