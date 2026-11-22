# Altin Skarabe (Kum, epik). Tarif: TARIFLER.md. Gunes topunu hazinesi gibi tasiyan altin bocek: kubbe kabuk, koyu bas/pronotum, ortada dikis (iki kanat kilifi), her yanda 3 bacak, tombul uclu antenler.
# Renk: Sari (govde, top), Lacivert (cizgi, boynuz), Cam (turkuaz tas). Parlak: Sari -> Tas.
PARLA = 'Sari'


def top(d, cx, cy, r, part='esya'):
    """Parlak gunes topu: acik sari kure + sicak cekirdek + Parilti vurgu."""
    d.circle('Turuncu', (cx, cy), r, part=part, name='top', line=True, lift=0.1)
    d.circle('Sari', (cx - r * .1, cy - r * .1), r * .72, part=part, clip='top', shift=-1, lift=0.3)
    d.circle('Krem', (cx - r * .2, cy - r * .2), r * .42, part=part, clip='top', tone=0)
    d.pix((int(cx - r * .55), int(cy - r * .6)), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def anten(d, cx, y, dx, part='tepe'):
    """Kisa, ucu yuvarlak topuzlu antenler (y = kafa ustu)."""
    for sg in (-1, 1):
        d.capsule('Lacivert', (cx + sg * dx, y + 1), (cx + sg * (dx + 1.6), y - 3), (2.2, 1.8), part=part, line=False, lift=0.05)
        d.circle('Lacivert', (cx + sg * (dx + 1.8), y - 4), 1.9, part=part, lift=0.1)


def bacak(d, x, y, sg, part='kol_1', w=3.0, L=2.0):
    """Yanlardan gorunen kisa, koyu, tombul bacak."""
    d.capsule('Lacivert', (x, y), (x + sg * L, y + 1.2), w, part=part, line=True, lift=0.0)


def govde(d, cx, cy, rx, ry, pron_ry, pron_dy, seam_y0, seam_y1, hl):
    """Kubbe kabuk + koyu pronotum bandi + ortada dikis + iki kanat kilifinin kendi sol-ust isigi."""
    d.ellipse('Sari', (cx, cy), (rx, ry), name='g', cast=1, lift=0.0)
    for sg, (hx, hy, hr) in ((-1, hl[0]), (1, hl[1])):
        d.ellipse('Sari', (hx, hy), (hr, hr * 0.8), clip='g', shift=-1)
    d.capsule('Lacivert', (cx, seam_y0), (cx, seam_y1), 1.1, clip='g', tone=3)
    # koyu bas/pronotum bandi (yuz burada, duz zemin)
    d.ellipse('Sari', (cx, cy - pron_dy), (rx - 2.6, pron_ry), name='pr', line=True, lift=-0.55, noshadow=True)
    # pronotum ile kanat kiliflari arasinda net koyu cizgi
    by = cy - pron_dy + pron_ry
    d.curve('Sari', [(cx - (rx - 4.2), by - pron_ry * 0.55), (cx - (rx - 8), by - 0.8), (cx, by + 0.2), (cx + (rx - 8), by - 0.8), (cx + (rx - 4.2), by - pron_ry * 0.55)], 1.0, clip='g', tone=4)


def bebek(d):
    cx = 24
    # arka ve orta bacaklar (kabugun arkasinda)
    for yy in (36.5, 42.5):
        bacak(d, 11.5, yy, -1, 'kol_1')
        bacak(d, 36.5, yy, 1, 'kol_2')
    govde(d, cx, 34.5, 14, 10.5, 6.4, 3.8, 36.5, 44.5, ((19, 41.5, 3.2), (29.5, 41.5, 3.2)))
    d.ellipse('Sari', (cx, 30.5), (8, 3.4), clip='pr', shift=-1)
    anten(d, cx, 25.5, 4.5)
    # ust bacaklarla bilye kadar topa sarilmis
    top(d, 24, 45.5, 5.6, 'kol_1')
    d.capsule('Lacivert', (13, 40.5), (19, 46.5), 3.2, part='kol_1', line=True)
    d.capsule('Lacivert', (35, 40.5), (29, 46.5), 3.2, part='kol_2', line=True)
    d.set_face(24, 30.5, gap=5)


def genc(d):
    cx = 28
    for yy in (45.5, 52):
        bacak(d, 12.5, yy, -1, 'kol_1', w=3.4)
        bacak(d, 43.5, yy, 1, 'kol_2', w=3.4)
    govde(d, cx, 42.5, 17.5, 15.2, 8, 5.4, 44, 57, ((22.5, 49, 3.8), (34, 49, 3.8)))
    d.ellipse('Sari', (cx, 36), (9.5, 4), clip='pr', shift=-1)
    # kabukta lacivert cizgiler (her kilifta iki egri serit)
    for sg in (-1, 1):
        d.curve('Lacivert', [(cx + sg * 4, 47), (cx + sg * 7.5, 50), (cx + sg * 8.5, 54)], 1.0, clip='g', tone=3)
        d.curve('Lacivert', [(cx + sg * 10, 46), (cx + sg * 12, 50), (cx + sg * 11.5, 53)], 1.0, clip='g', tone=3)
    anten(d, cx, 28, 5.5)
    # on bacaklar topu basin ustune kaldirmis
    d.capsule('Lacivert', (13.5, 38), (20, 30), 3.4, part='kol_1', line=True)
    d.capsule('Lacivert', (42.5, 38), (36, 30), 3.4, part='kol_2', line=True)
    top(d, 28, 21, 8)
    d.set_face(28, 36.5, gap=5)


def usta(d):
    cx = 32
    for yy in (52, 58.5, 65):
        bacak(d, 12, yy, -1, 'kol_1', w=3.8, L=2.0)
        bacak(d, 52, yy, 1, 'kol_2', w=3.8, L=2.0)
    govde(d, cx, 47.5, 21.5, 19.5, 11, 8.2, 52, 66.5, ((24, 56, 5), (40, 56, 5)))
    d.ellipse('Sari', (cx, 33), (11, 4.2), clip='pr', shift=-1)
    # kabuk cizgileri
    for sg in (-1, 1):
        for a, b, c in (((4, 54), (8, 58), (9, 64)), ((10.5, 52), (13.5, 57), (13.5, 62))):
            d.curve('Lacivert', [(cx + sg * a[0], a[1]), (cx + sg * b[0], b[1]), (cx + sg * c[0], c[1])], 1.2, clip='g', tone=3)
    # turkuaz tas
    d.poly('Cam', [(32, 52.5), (36.5, 57.5), (32, 62.5), (27.5, 57.5)], part='govde', name='tas', line=True)
    d.pix((30, 55), ['o'], {'o': 'Parilti'}, part='govde')
    # on bacaklar
    d.capsule('Lacivert', (15, 51), (11.5, 57), 4.0, part='kol_1', line=True)
    d.capsule('Lacivert', (49, 51), (52.5, 57), 4.0, part='kol_2', line=True)
    # iki kisa boynuz ve aralarinda gunes
    d.curve('Lacivert', [(22, 31), (17.5, 23), (20, 15)], 3.6, part='tepe', name='b1', line=False, lift=0.05)
    d.curve('Lacivert', [(42, 31), (46.5, 23), (44, 15)], 3.6, part='tepe', name='b2', line=False, lift=0.05)
    top(d, 32, 18, 8.6, 'tepe')
    d.set_face(32, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
