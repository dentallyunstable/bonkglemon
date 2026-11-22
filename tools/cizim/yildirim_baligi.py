# Yildirim Yilanbaligi (Su, epik). Tarif: TARIFLER.md. Kivrilip dik duran lacivert yilanbaligi: koca kafa onde, govde halkalari kafanin arkasinda/altinda; yanaklarda sari elektrik daireleri, kuyruk simsek zikzagi.
# Bebek 1 kivrim + kisa zikzak kuyruk; genc 2 kivrim + sirtta sari zikzak cizgi; usta kafa arkasinda dalgali Gok yuzgec yele, kuyruk ucu uc koseli simsek.
# Renk: Lacivert (govde), Sari (yanak, zikzak, simsek), Gok (karin ve yuzgec). Parlak: Lacivert -> Cam.
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def zigzag(d, pts, w, part='kuyruk', name=None):
    for a, b in zip(pts, pts[1:]):
        d.capsule('Sari', a, b, w, part=part, line=True)
    for a, b in zip(pts, pts[1:]):
        d.capsule('Sari', a, b, w - 0.2, part=part, noshadow=True)


def yanak(d, cx, y, dx, r):
    # elektrik yanak daireleri: yuz alaninin disinda, kafa kenarinda
    for sgn in (-1, 1):
        d.circle('Sari', (cx + sgn * dx, y), r, clip='kafa', tone=2)
        d.circle('Sari', (cx + sgn * dx, y), r - 1.0, clip='kafa', tone=1)


def bebek(d):
    cx = 22
    # kuyruk: kisa sari zikzak, sagdan yukari
    zigzag(d, [(34, 40), (40, 37), (37, 34), (42, 29)], 2.8)
    # kivrim: kafanin altinda yatan halka
    d.ellipse('Lacivert', (cx, 37.5), (13.5, 6), name='kv', line=True, lift=-0.06, cast=1)
    d.ellipse('Gok', (cx, 40.5), (9, 3.2), clip='kv', shift=0)
    d.ellipse('Lacivert', (cx, 25), (13, 10.4), name='kafa', lift=0.04, cast=1)
    yanak(d, cx, 28, 10.2, 2.7)
    d.pix((cx - 12, 26), ['oo'], {'o': 'Parilti'}, part='govde')
    d.set_face(cx, 23, gap=5, yanak='Sari-1')


def genc(d):
    cx = 26
    # sirttaki sari zikzak cizgi iki kivrim boyunca; uc kuyruk
    d.ellipse('Lacivert', (cx + 3, 46.5), (15, 5.8), name='k2', line=True, lift=-0.12, cast=1)
    d.ellipse('Gok', (cx + 3, 49), (10.5, 3.0), clip='k2', shift=0)
    zigzag(d, [(41, 47), (47, 44), (44, 41), (50, 36)], 3.0)
    d.ellipse('Lacivert', (cx, 39.5), (14.5, 7), name='k1', line=True, lift=-0.04, cast=1)
    d.ellipse('Gok', (cx, 43), (10, 3.4), clip='k1', shift=0)
    pts = [(14, 38.5), (18, 35.5), (22, 38.5), (26, 35.5), (30, 38.5), (34, 35.5), (38, 38.5)]
    for a, b in zip(pts, pts[1:]):
        d.capsule('Sari', a, b, 1.0, clip='k1', tone=2)
    d.ellipse('Lacivert', (cx, 27), (14, 11.4), name='kafa', lift=0.04, cast=1)
    yanak(d, cx, 30, 10.8, 2.8)
    d.pix((cx - 12.5, 28), ['oo'], {'o': 'Parilti'}, part='govde')
    d.set_face(cx, 25, gap=5, yanak='Sari-1')


def usta(d):
    cx = 32
    # dalgali Gok yuzgec yele kafanin arkasinda
    d.ellipse('Gok', (cx, 28), (19, 12), name='yl', part='govde', line=True, lift=-0.1)
    for x in (13.5, 19, 25, 32, 39, 45, 50.5):
        d.circle('Gok', (x, 21 + abs(x - 32) * 0.18), 4.2, join='yl')
    d.capsule('Gok', (22, 35), (42, 35), 1.0, clip='yl', shift=1) if False else None
    # kivrimlar
    d.ellipse('Lacivert', (cx + 4, 56), (17.5, 6.2), name='k2', line=True, lift=-0.12, cast=1)
    d.ellipse('Gok', (cx + 4, 58.5), (12, 3.2), clip='k2', shift=0)
    # kuyruk ucu: uc koseli simsek
    zigzag(d, [(46, 56), (53, 54)], 3.4)
    d.poly('Sari', [(60, 32), (51, 43), (56.5, 43), (52.5, 53), (63, 40), (57.5, 40), (62.5, 32)], part='kuyruk', line=True, lift=0.05)
    d.pix((57, 36), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    d.ellipse('Lacivert', (cx, 47), (16.5, 8), name='k1', line=True, lift=-0.04, cast=1)
    d.ellipse('Gok', (cx, 50.5), (11.5, 3.8), clip='k1', shift=0)
    pts = [(17, 46), (21, 42.5), (26, 46), (31, 42.5), (36, 46), (41, 42.5), (46, 46)]
    for a, b in zip(pts, pts[1:]):
        d.capsule('Sari', a, b, 1.1, clip='k1', tone=2)
    d.ellipse('Lacivert', (cx, 32), (16.5, 13.5), name='kafa', lift=0.04, cast=1)
    yanak(d, cx, 35, 12.6, 3.2)
    d.pix((cx - 14.5, 33), ['oo'], {'o': 'Parilti'}, part='govde')
    d.set_face(cx, 30, gap=6, yanak='Sari-1')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
