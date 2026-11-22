# Agacbasi (Yabani Orman patronu, Kat 10). Tarif: TARIFLER.md 11.2.
# Ormanin dedesi: tombul yasli mese, Kutukcuk'un buyumus hali gibi. Yuz govdede, kaslar yosun.
# Genis yaprak tacinin icinden iki Kutukcuk bebek bakar. Tac + bebekler 'tepe' (cagir: tac sallanir, bebek duser).
# Faz 2 "Kok Tufani": yapraklar turuncu ve seyrek, kokler havada iki ek kol, ortadaki kovuk acik yesil parlar, kaslar catik.
# Renk: Kahve, Cimen, Krem (+ faz2 Turuncu). Parlak: Cimen -> Pembe, Kahve -> Kar.
PARLA = 'Cimen'


def bebek_kutuk(d, cx, top, fam_leaf='Cimen'):
    """Tacin icinden bakan minik Kutukcuk: krem kesik ust, kahve govde, filiz, 1x2 gozler."""
    d.ellipse('Kahve', (cx, top + 5.5), (5.2, 4.8), part='tepe', name='bk%d' % cx, line=True, lift=0.1)
    d.ellipse('Krem', (cx, top + 1.8), (5.0, 1.9), part='tepe', line=True, noshadow=True)
    d.pix((int(cx) - 1, int(top) - 2), ['.#', '##'], {'#': fam_leaf + '-1'}, part='tepe')
    d.pix((int(cx) - 2, int(top) + 5), ['#..#', '#..#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((int(cx) - 3, int(top) + 7), ['o....o'], {'o': 'Pembe-2'}, part='tepe')


def leaf_clumps(d, name, pts, fam='Cimen'):
    """Yaprak kumelerinin kenarlari: kucuk 'u' yaylari (koyu) ve sol ustte acik lekeler."""
    for x, y in pts:
        d.curve(fam, [(x - 3.5, y - 1), (x, y + 1.6), (x + 3.5, y - 1)], 1.2, clip=name, shift=1)


def govde_ortak(d, faz):
    # kok ayaklar (govdeye katilir)
    d.ellipse('Kahve', (48, 51), (23, 26), name='govde', cast=3, lift=0.12)
    d.ellipse('Kahve', (48, 70.5), (28.5, 6.5), join='govde')
    for a, b, w in (((34, 71), (22, 74.5), (6, 4)), ((44, 72), (40, 75), (6, 4)),
                    ((52, 72), (56, 75), (6, 4)), ((62, 71), (74, 74.5), (6, 4))):
        d.capsule('Kahve', a, b, w, join='govde')
    # kabuk cizgileri (yuz alaninin disinda: yanlarda ve agzin altinda)
    for pts in ([(30, 40), (29, 50), (31, 62)], [(35, 58), (34, 68)], [(66, 40), (67, 50), (65, 62)], [(61, 58), (62, 68)],
                [(44, 62), (43, 72)], [(52, 62), (53, 72)]):
        if faz and pts[0][0] in (44, 52):
            continue    # faz2: orada kovuk var
        d.curve('Kahve', pts, 1.0, clip='govde', shift=1)
    d.curve('Kahve', [(27, 74), (32, 72.5)], 1.0, clip='govde', shift=1)
    d.curve('Kahve', [(69, 74), (64, 72.5)], 1.0, clip='govde', shift=1)


def kollar(d, fam_leaf, faz):
    # kalin dal kollar; uclarinda kucuk yaprak tutami
    dy = -6 if faz else 0
    d.curve('Kahve', [(29, 47), (20, 52 + dy), (13, 50 + dy * 2)], (7, 5), part='kol_1', line=True, name='k1')
    d.curve('Kahve', [(67, 47), (76, 52 + dy), (83, 50 + dy * 2)], (7, 5), part='kol_2', line=True, name='k2')
    d.capsule('Kahve', (20, 51 + dy), (18, 46 + dy), 2.4, part='kol_1', join='k1')
    d.capsule('Kahve', (76, 51 + dy), (78, 46 + dy), 2.4, part='kol_2', join='k2')
    d.circle(fam_leaf, (11, 48 + dy * 2), 3.6, part='kol_1', line=True)
    d.circle(fam_leaf, (85, 48 + dy * 2), 3.6, part='kol_2', line=True)
    d.circle(fam_leaf, (18, 44.5 + dy), 2.4, part='kol_1', line=True)
    d.circle(fam_leaf, (78, 44.5 + dy), 2.4, part='kol_2', line=True)


def patron(d):
    govde_ortak(d, False)
    kollar(d, 'Cimen', False)
    # genis yuvarlak yaprak taci (tepe: cagir'da sallanir). Ekrana sigsin: en ust 10. satir
    d.ellipse('Cimen', (48, 23), (36, 9), part='tepe', name='tac', lift=0.1, cast=2)
    for x, y, r in ((15, 24, 6.5), (24, 18.5, 7), (36, 16.5, 7), (49, 16, 7), (62, 16.5, 7), (73, 18.5, 7), (81, 24, 6.5),
                    (21, 29.5, 5.5), (33, 31, 5), (48, 31.5, 5), (63, 31, 5), (75, 29.5, 5.5)):
        d.circle('Cimen', (x, y), r, join='tac')
    leaf_clumps(d, 'tac', [(21, 24), (29, 19), (42, 15), (55, 15), (67, 18), (76, 24), (26, 30), (70, 30),
                           (40, 26), (57, 26), (48, 32), (17, 20), (80, 20)])
    for c, r in (((31, 14), 1.8), ((44, 11.5), 1.6), ((20, 19), 1.5)):
        d.circle('Cimen', c, r, clip='tac', shift=-1)
    # iki Kutukcuk bebek tacin icinden bakar; onlerinde yaprak kumesi
    bebek_kutuk(d, 32, 18.5)
    bebek_kutuk(d, 64, 18)
    for x, y in ((32, 28), (64, 27.5)):
        d.ellipse('Cimen', (x, y), (7.5, 3.0), part='tepe', line=True)
    # yosun kaslar (yuz kutusunun ustunde)
    d.capsule('Cimen', (35.5, 39.5), (44, 38.5), 3.0, line=True, noshadow=True)
    d.capsule('Cimen', (52, 38.5), (60.5, 39.5), 3.0, line=True, noshadow=True)
    d.set_face(48, 42.5, gap=8, ten='Kahve')


def faz2(d):
    govde_ortak(d, True)
    # kokler topraktan kalkip iki ek kol gibi havada durur
    d.curve('Kahve', [(31, 66), (23, 66), (18, 60), (16.5, 52)], (6, 3.4), name='kok1', line=True)
    d.curve('Kahve', [(65, 66), (73, 66), (78, 60), (79.5, 52)], (6, 3.4), name='kok2', line=True)
    d.capsule('Kahve', (19, 64), (16, 68), 2.2, join='kok1')
    d.capsule('Kahve', (77, 64), (80, 68), 2.2, join='kok2')
    kollar(d, 'Turuncu', True)
    # seyreklesmis turuncu tac
    d.ellipse('Turuncu', (48, 23.5), (33, 8.5), part='tepe', name='tac', lift=0.1, cast=2)
    for x, y, r in ((19, 24.5, 6), (27, 19, 6.5), (38, 17, 6.5), (50, 16.5, 6.5), (62, 17, 6.5), (71, 19.5, 6), (78, 24.5, 5.5),
                    (26, 30, 5), (48, 31.5, 4.5), (70, 30, 5)):
        d.circle('Turuncu', (x, y), r, join='tac')
    for c, r in (((15, 28.5), 2.2), ((82, 28.5), 2.2), ((45, 10.5), 2.0), ((28, 13), 1.8), ((70, 25), 1.6)):
        d.circle('Turuncu', c, r, sub='tac')
    leaf_clumps(d, 'tac', [(24, 24), (33, 18), (45, 16), (57, 17), (68, 20), (74, 25), (36, 26), (60, 26)], fam='Turuncu')
    d.circle('Turuncu', (32, 15), 1.6, clip='tac', shift=-1)
    # dusen yapraklar (tacin altinda, kollarin yaninda)
    d.pix((21, 35), ['.#', '#.'], {'#': 'Turuncu-2'}, part='tepe')
    d.pix((74, 36), ['#.', '.#'], {'#': 'Turuncu-2'}, part='tepe')
    bebek_kutuk(d, 32, 19, 'Turuncu')
    bebek_kutuk(d, 64, 19, 'Turuncu')
    for x, y in ((32, 28.5), (64, 28.5)):
        d.ellipse('Turuncu', (x, y), (7, 2.8), part='tepe', line=True)
    # ortadaki kovuk acik yesil parlar (agzin altinda)
    d.ellipse('Kahve', (48, 64.5), (6.2, 6.8), name='kovuk', tone=4, shade='flat', line=True)
    d.ellipse('Cimen', (48, 65.5), (4.2, 4.8), name='isik', tone=1, shade='flat', noshadow=True)
    d.ellipse('Cimen', (48, 67), (2.6, 3.0), clip='isik', tone=2)
    d.pix((46, 62), ['oo'], {'o': 'Parilti'})
    # catik yosun kaslar
    d.capsule('Cimen', (35, 37), (44.5, 40), 3.0, line=True, noshadow=True)
    d.capsule('Cimen', (51.5, 40), (61, 37), 3.0, line=True, noshadow=True)
    d.set_face(48, 42.5, gap=8, ten='Kahve')


STAGES = {'patron': patron, 'faz2': faz2}
