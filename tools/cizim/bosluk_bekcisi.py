# Bosluk Bekcisi (Golge Boslugu patronu, Kat 60, ucar). Tarif: TARIFLER.md 11.7.
# Uzun pelerinli, kapusonlu, suzulen bekci: kapusonun ici karanlik, icinde yalniz turkuaz parlayan iki iri goz.
# Elinde fener asasi; fenerin icinde minik bir Fisilti parlar ('tepe', cagir'da asa sallanir, Fisilti cikar).
# Faz 2 "Yutan Bosluk": kapuson geriye dusmus, altindan yuvarlak lavanta hayalet kafasi; pelerin iki yana acilmis,
# ici yildizli bosluk; fener bos, kapisi acik.
# Renk: Lacivert (pelerin), Mor (hayalet), Cam (goz, fener), Komur (kapuson ici, bosluk). Parlak: Lacivert -> Kar, Cam -> Sari.
PARLA = 'Cam'


def fisilti(d, cx, top):
    """Fenerin icindeki minik Fisilti: Mor yumusak hayalet, sivri tepe, dalgali alt, 1x2 gozler."""
    d.ellipse('Mor', (cx, top + 5), (4.6, 4.4), part='tepe', name='fs%d' % cx, lift=0.1, noshadow=True)
    d.circle('Mor', (cx - 2.6, top + 8.6), 1.5, part='tepe', join='fs%d' % cx)
    d.circle('Mor', (cx + 2.6, top + 8.6), 1.5, part='tepe', join='fs%d' % cx)
    d.capsule('Mor', (cx, top + 1.5), (cx + 1.5, top - 0.5), 1.6, part='tepe', join='fs%d' % cx)
    d.pix((int(cx) - 2, int(top) + 4), ['#.#', '#.#'], {'#': 'Murekkep'}, part='tepe')


def fener(d, cx, cy, bos=False):
    fr = 'Lacivert' if bos else 'Komur'
    """Fener: Komur cerceve, Cam isik; bos fenerde kapi acik, ic karanlik."""
    d.rect(fr, (cx - 3, cy - 11, cx + 3, cy - 9), part='tepe' if not bos else 'esya', rad=1.5, name='fcap', line=True)
    d.ellipse(fr, (cx, cy), (8.5, 9), part='tepe' if not bos else 'esya', name='fcer', line=True, lift=0.05)
    if not bos:
        d.ellipse('Cam', (cx, cy), (6.4, 7), part='tepe', name='fcam', shade='flat', tone=1, noshadow=True)
        d.ellipse('Cam', (cx + 2, cy + 3), (4.4, 4.2), part='tepe', clip='fcam', tone=2, shade='flat')
        fisilti(d, cx, cy - 5)
        d.pix((cx - 5, cy - 6), ['oo'], {'o': 'Parilti'}, part='tepe')
    else:
        d.ellipse('Komur', (cx, cy), (6.2, 6.8), part='esya', name='fic', shade='flat', tone=4, noshadow=True)
        # acik kapi: yana acilmis cam levha
        d.poly('Cam', [(cx + 5, cy - 7), (cx + 11, cy - 5), (cx + 11, cy + 6), (cx + 5, cy + 8)], part='esya', line=True, shade='flat', tone=2, name='kapi')
        d.pix((cx + 7, cy - 4), ['o', 'o'], {'o': 'Parilti'}, part='esya')
        d.pix((cx - 3, cy + 3), ['oo'], {'o': 'Cam-2'}, part='esya')


def etek(d, ys, xs, r, join='govde'):
    for x in xs:
        d.circle('Lacivert', (x, ys), r, join=join)


def patron(d):
    d.flyer = True
    # pelerin: genis cani, dalgali etek (bacak yok)
    d.ellipse('Lacivert', (48, 44), (26, 17), name='govde', cast=2)
    d.poly('Lacivert', [(22, 47), (74, 47), (81, 62), (15, 62)], join='govde')
    etek(d, 61.8, (19.5, 31, 42.5, 54, 65.5, 77), 4.7)
    for pts in ([(30, 50), (27, 57), (28, 65)], [(40, 53), (38, 60), (39, 66)], [(57, 53), (58, 60), (57, 66)],
                [(67, 50), (69, 57), (68, 64)]):
        d.curve('Lacivert', pts, 1.0, clip='govde', shift=1)
    d.curve('Lacivert', [(22, 44), (20, 52), (22, 58)], 1.4, clip='govde', shift=-1)
    # kapuson
    d.ellipse('Lacivert', (48, 29), (22, 16), join='govde', name='kap')
    d.circle('Lacivert', (55, 15.5), 4.2, join='govde')
    d.curve('Lacivert', [(52, 16), (58, 19), (62, 25)], 1.0, clip='govde', shift=-1)
    d.ellipse('Komur', (48, 31), (17, 13), name='oyuk', line=True, shade='flat', tone=3, noshadow=True)
    d.ellipse('Komur', (48, 40), (15, 3), clip='oyuk', tone=4, shade='flat')
    # yaka tokasi
    d.ellipse('Lacivert', (48, 45.5), (11, 3.2), name='yaka', line=True, lift=0.08, cast=1)
    d.circle('Cam', (48, 50), 2.6, line=True, shade='flat', tone=1, noshadow=True)
    d.pix((47, 48), ['oo'], {'o': 'Parilti'})
    # kollar
    d.capsule('Lacivert', (27, 44), (22, 54), (8, 7), part='kol_1', line=True, name='k1', lift=0.08)
    d.circle('Lacivert', (22, 55), 4.2, part='kol_1', line=True, lift=0.12, noshadow=True)
    d.capsule('Lacivert', (69, 42), (75, 42), (8, 7), part='kol_2', line=True, name='k2', lift=0.04)
    d.capsule('Komur', (77, 28), (77, 66), 3.0, part='esya', line=True, shade='flat', tone=2)
    d.circle('Lacivert', (77, 42), 4.4, part='kol_2', line=True, lift=0.12, noshadow=True)
    fener(d, 77, 20)
    d.set_face(48, 25, gap=8, goz='Cam-1', yanak=False, mouth=False)


def pelerin_kanat(d, side):
    """Iki yana acilmis pelerin: Lacivert dis, Komur ic (yildizli bosluk)."""
    s = -1 if side == 1 else 1
    part = 'kol_%d' % side
    X = lambda x: 48 + s * x
    Y = lambda y: 29 + (y - 38) * 0.86
    d.poly('Lacivert', [(X(14), Y(36)), (X(26), Y(38)), (X(36), Y(44)), (X(42), Y(54)), (X(42), Y(66)), (X(38), Y(72)),
                        (X(30), Y(75)), (X(22), Y(71)), (X(14), Y(75)), (X(10), Y(66))],
           part=part, name='pl%d' % side, line=True, lift=0.04, cast=1)
    for cx, cy in ((35, 70), (25, 71), (15, 71)):
        d.circle('Lacivert', (X(cx), Y(cy)), 4.2, part=part, join='pl%d' % side)
    d.poly('Komur', [(X(14), Y(38)), (X(26), Y(39)), (X(33), Y(45)), (X(38), Y(55)), (X(38), Y(65)), (X(33), Y(69)),
                     (X(26), Y(67)), (X(20), Y(69)), (X(14), Y(66))],
           part=part, name='bs%d' % side, shade='flat', tone=2, noshadow=True)
    d.ellipse('Komur', (X(28), Y(55)), (11, 7), part=part, clip='bs%d' % side, tone=3, shade='flat')
    # yildizlar: iki piksellik parilti
    pts = ((31, 63), (34, 54), (28, 49), (24, 66)) if side == 1 else ((33, 61), (28, 52), (34, 57), (25, 65))
    for x, y in pts:
        d.pix((int(X(x)), int(Y(y))), ['oo'], {'o': 'Parilti'}, part=part)


def faz2(d):
    d.flyer = True
    d.ellipse('Lacivert', (48, 49), (19, 13), name='govde', cast=2)
    d.poly('Lacivert', [(32, 51), (64, 51), (66, 61), (30, 61)], join='govde')
    for x in (34.5, 43, 52, 61):
        d.circle('Lacivert', (x, 61.3), 4.4, join='govde')
    d.curve('Lacivert', [(40, 56), (39, 65)], 1.0, clip='govde', shift=1)
    d.curve('Lacivert', [(56, 56), (57, 65)], 1.0, clip='govde', shift=1)
    pelerin_kanat(d, 1)
    pelerin_kanat(d, 2)
    # dusmus kapuson: boyun cevresinde toplanmis kumas
    d.ellipse('Lacivert', (48, 41), (20, 7), name='yaka', line=True, cast=1)
    d.circle('Lacivert', (30, 38), 4.8, join='yaka')
    d.circle('Lacivert', (66, 38), 4.8, join='yaka')
    d.curve('Lacivert', [(32, 41), (40, 46), (56, 46), (64, 41)], 1.0, clip='yaka', shift=1)
    # hayalet kafasi
    d.ellipse('Mor', (48, 27), (21, 15), name='kafa', lift=0.06, cast=2)
    d.curve('Mor', [(46, 15), (47, 12), (51, 11.5), (53, 14)], 3.0, join='kafa')
    d.ellipse('Mor', (38, 18), (6, 3.0), clip='kafa', shift=-1, rot=-25)
    d.circle('Mor', (28, 32), 1.8, clip='kafa', shift=1)
    d.circle('Mor', (69, 31), 1.8, clip='kafa', shift=1)
    # asa ve bos fener
    d.capsule('Komur', (79, 28), (79, 58), 3.0, part='esya', line=True, shade='flat', tone=2)
    d.circle('Lacivert', (79, 42), 4.2, part='kol_2', line=True, lift=0.12, noshadow=True)
    fener(d, 79, 20, bos=True)
    d.set_face(48, 24, gap=8, goz='Cam-1', yanak=True)


STAGES = {'patron': patron, 'faz2': faz2}
