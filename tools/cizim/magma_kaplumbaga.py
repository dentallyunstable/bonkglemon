# Magma Kaplumbagasi (Kor Diyari patronu, Kat 50). Tarif: TARIFLER.md 11.6.
# Cok yasli, cok yavas dev kaplumbaga; kabugu uyuyan bir yanardag (Komur), ince duman, yamaclarda sogumus lav cizgileri.
# Kabuk govde; kafa part='kafa' (yuz kafada, kirisik boyunsuz kafa one uzanir); dort kalin bacak (on ikisi kol_1/kol_2).
# Faz 2 "Yanardag": dagin tepesi patlamis, lav firliyor (esya), yamaclardan lav nehirleri iner, bacak catlaklari parlar.
# Renk: Komur (kabuk), Kahve (ten), Turuncu + Sari (lav). Parlak: Turuncu -> Cimen, Kahve -> Tas.
PARLA = 'Turuncu'


def parilti(d, x, y, part='govde'):
    d.pix((x, y), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def bacaklar(d, faz):
    """Dort kalin bacak: arkadakiler kabugun kenarindan, onde ikisi kol_1/kol_2. Tirnaklar Krem."""
    d.ellipse('Kahve', (22, 67), (8, 9), name='ab1', lift=-0.04, cast=1)
    d.ellipse('Kahve', (74, 67), (8, 9), name='ab2', lift=-0.04, cast=1)
    for s, cx in ((1, 28), (2, 68)):
        part = 'kol_%d' % s
        n = 'ob%d' % s
        d.ellipse('Kahve', (cx, 69), (10.5, 9.5), part=part, name=n, line=True, lift=0.05, cast=1)
        d.curve('Kahve', [(cx - 7, 65), (cx - 2, 63.5), (cx + 4, 65)], 1.0, part=part, clip=n, shift=1)
        d.curve('Kahve', [(cx - 8, 70), (cx - 3, 69)], 1.0, part=part, clip=n, shift=1)
        d.ellipse('Kahve', (cx - 4, 64), (4, 2), part=part, clip=n, shift=-1)
        for k in (-6, -1, 4):
            d.pix((cx + k, 75), ['##'], {'#': 'Krem-2'}, part=part)
        if faz:
            # parlayan catlaklar
            d.curve('Turuncu', [(cx - 3, 65), (cx - 1, 68), (cx - 4, 72)], 1.2, part=part, clip=n, tone=2, shade='flat')
            d.curve('Sari', [(cx + 4, 66), (cx + 6, 69)], 1.0, part=part, clip=n, tone=2, shade='flat')
    if faz:
        d.curve('Turuncu', [(19, 62), (22, 67), (20, 72)], 1.2, clip='ab1', tone=2, shade='flat')
        d.curve('Turuncu', [(77, 62), (74, 67), (76, 72)], 1.2, clip='ab2', tone=2, shade='flat')


def kafa(d, faz):
    cy = 66 if not faz else 65
    d.ellipse('Kahve', (48, cy), (16.5, 11.5), part='kafa', name='kafa', cast=1, lift=0.06)
    # kirisiklar: alin ve yanlar (yuz alaninin disinda)
    d.curve('Kahve', [(40, cy - 9.5), (48, cy - 11), (56, cy - 9.5)], 1.0, part='kafa', clip='kafa', shift=1)
    d.curve('Kahve', [(34, cy - 3), (33, cy + 2), (35, cy + 6)], 1.0, part='kafa', clip='kafa', shift=1)
    d.curve('Kahve', [(62, cy - 3), (63, cy + 2), (61, cy + 6)], 1.0, part='kafa', clip='kafa', shift=1)
    d.curve('Kahve', [(40, cy + 10), (48, cy + 11.5), (56, cy + 10)], 1.0, part='kafa', clip='kafa', shift=1)
    d.ellipse('Kahve', (39, cy - 7), (4, 1.6), part='kafa', clip='kafa', shift=-1, rot=-15)


def kabuk(d, faz):
    # taban: genis yuvarlak dag eteği
    d.ellipse('Komur', (48, 54), (31, 16), name='kabuk', cast=2, lift=0.02)
    if not faz:
        # sonmus dag: konik, yuvarlak tepeli
        d.poly('Komur', [(20, 54), (28, 46), (37, 33), (43, 27), (53, 27), (59, 33), (68, 46), (76, 54)], join='kabuk')
        d.ellipse('Komur', (48, 29), (9, 4.5), join='kabuk')
    else:
        # patlamis dag: tepesi kopmus, girintili genis krater agzi
        d.poly('Komur', [(20, 54), (28, 46), (35, 37), (38, 31), (42, 33), (46, 30), (51, 33), (55, 30), (59, 32), (61, 37), (68, 46), (76, 54)], join='kabuk')
    # acik yamac (sol ust isik) ve koyu doku
    d.poly('Komur', [(24, 50), (31, 43), (38, 33), (41, 30), (37, 40), (30, 49)], clip='kabuk', shift=-1)
    d.circle('Komur', (62, 46), 2.2, clip='kabuk', shift=1)
    d.circle('Komur', (36, 48), 1.8, clip='kabuk', shift=1)
    d.circle('Komur', (59, 38), 1.6, clip='kabuk', shift=1)
    d.ellipse('Komur', (24, 55), (4, 2), clip='kabuk', shift=1)
    d.ellipse('Komur', (72, 55), (4, 2), clip='kabuk', shift=1)
    # kabuk kenar seridi (alt kenar boyunca koyu)
    d.ellipse('Komur', (48, 61), (30, 4), clip='kabuk', shift=1)


def patron(d):
    bacaklar(d, False)
    kabuk(d, False)
    # krater
    d.ellipse('Komur', (48, 28), (6.5, 2.6), name='krater', shade='flat', tone=4, line=True, noshadow=True)
    d.ellipse('Komur', (48, 28.5), (4, 1.3), shade='flat', tone=4, noshadow=True)
    # yamaclarda sogumus lav cizgileri (koyu kizil-turuncu, soluk)
    for pts in ([(45, 30), (41, 37), (43, 44), (39, 50)], [(51, 30), (55, 37), (53, 43), (58, 49)],
                [(38, 36), (33, 43), (29, 50)], [(59, 36), (65, 43), (69, 50)]):
        d.curve('Turuncu', pts, 1.3, clip='kabuk', tone=4, shade='flat')
    d.curve('Turuncu', [(48, 31), (47, 41), (49, 51)], 1.0, clip='kabuk', tone=3, shade='flat')
    parilti(d, 33, 38)
    # ince duman
    d.curve('Komur', [(48, 26), (45, 22), (50, 18), (46, 14)], (2.2, 1.4), part='esya', shade='flat', tone=1, noshadow=True)
    d.circle('Komur', (46, 14), 1.6, part='esya', shade='flat', tone=1, noshadow=True)
    kafa(d, False)
    d.set_face(48, 59, gap=8, ten='Kahve')


def lav_nehri(d, pts, w):
    d.curve('Turuncu', pts, w, clip='kabuk', tone=2, shade='flat')
    d.curve('Sari', pts, w * 0.45, clip='kabuk', tone=2, shade='flat')


def faz2(d):
    bacaklar(d, True)
    kabuk(d, True)
    # krater: genis, icinde parlayan lav
    d.ellipse('Komur', (49, 32.5), (12, 4.2), name='krater', shade='flat', tone=4, line=True, noshadow=True)
    d.ellipse('Turuncu', (49, 33), (9.5, 2.8), shade='flat', tone=2, noshadow=True)
    d.ellipse('Sari', (49, 33), (5.5, 1.4), shade='flat', tone=2, noshadow=True)
    # lav nehirleri yamaclardan iner
    lav_nehri(d, [(42, 34), (38, 41), (41, 47), (36, 52)], 2.6)
    lav_nehri(d, [(56, 34), (60, 41), (57, 47), (62, 53)], 2.6)
    lav_nehri(d, [(37, 37), (31, 44), (27, 52)], 2.2)
    lav_nehri(d, [(61, 37), (67, 44), (71, 52)], 2.2)
    lav_nehri(d, [(50, 34), (49, 44), (51, 52)], 2.2)
    # lav fiskirmasi (esya): ortada sutun, yanlara sicrayan toplar
    d.capsule('Turuncu', (49, 32), (49, 22), (7, 4), part='esya', name='fis', line=True, shade='flat', tone=2, noshadow=True)
    d.capsule('Sari', (49, 32), (49, 23), (3.4, 1.8), part='esya', shade='flat', tone=2, noshadow=True)
    for pts in ([(49, 24), (42, 20), (40, 23)], [(49, 24), (57, 20), (59, 22)], [(49, 22), (46, 16), (44, 14)],
                [(49, 22), (53, 17), (55, 15)], [(44, 26), (36, 25), (33, 28)], [(54, 26), (62, 25), (66, 27)]):
        d.curve('Turuncu', pts, 1.4, part='esya', shade='flat', tone=2, noshadow=True)
    for x, y, r in ((49, 19, 3.6), (40, 23, 3.0), (59, 22, 3.2), (33, 28, 2.4), (66, 27, 2.4), (44, 14, 2.2), (55, 15, 2.4)):
        d.circle('Turuncu', (x, y), r, part='esya', line=True, shade='flat', tone=2, noshadow=True)
        d.circle('Sari', (x, y), r * 0.45, part='esya', shade='flat', tone=2, noshadow=True)
    d.pix((47, 18), ['oo'], {'o': 'Parilti'}, part='esya')
    parilti(d, 32, 40)
    kafa(d, True)
    d.set_face(48, 58, gap=8, ten='Kahve')


STAGES = {'patron': patron, 'faz2': faz2}
