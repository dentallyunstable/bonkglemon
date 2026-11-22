# Nilufer Kurbagasi (Su, nadir). Tarif: TARIFLER.md. Dik oturan minik agac kurbagasi; basinda nilufer yapragi sapka, ustunde pembe nilufer.
# Renk: Cimen (kurbaga, yaprak daha koyu), Pembe (nilufer), Krem (karin). Yuz govdenin duz Cimen alaninda; yaprak/cicek yuzun ustunde.
PARLA = 'Pembe'


def yaprak(d, cx, cy, rx, ry, ad, part='tepe', damar=5):
    d.ellipse('Cimen', (cx, cy), (rx, ry), name=ad, part=part, line=True, cast=1, shade='flat', tone=3)
    d.ellipse('Cimen', (cx - rx * 0.3, cy - ry * 0.3), (rx * 0.5, ry * 0.4), clip=ad, shift=-1, part=part)
    # tarakli kesik (nilufer yapraginin v-bicimli yarigi)
    d.poly('Cimen', [(cx + 0.5, cy + ry * 0.2), (cx + rx + 2, cy - ry * 0.9), (cx + rx + 2, cy + ry * 0.2)], sub=ad, part=part)
    # damarlar merkezden
    import math
    for i in range(damar):
        a = math.radians(160 + 220 * i / (damar - 1))
        d.capsule('Cimen', (cx, cy), (cx + rx * 0.9 * math.cos(a), cy + ry * 0.9 * math.sin(a)), 0.9, clip=ad, shift=1, part=part)


def gozkabarcik(d, y, cx, dx, r, w):
    pass


def bebek(d):
    # arka bacaklar (oturan), govde
    d.ellipse('Cimen', (24, 40), (14.2, 10.8), name='kafa', cast=1, lift=0.05)
    d.ellipse('Krem', (24, 45.5), (8.5, 5.5), clip='kafa', tone=1)
    d.ellipse('Cimen', (13, 47), (4.6, 3.0), part='kol_1', line=True)
    d.ellipse('Cimen', (35, 47), (4.6, 3.0), part='kol_2', line=True)
    # kurbaga goz tumsekleri kafanin ust koselerinde
    d.circle('Cimen', (14, 31), 4.4, join='kafa')
    d.circle('Cimen', (34, 31), 4.4, join='kafa')
    yaprak(d, 24, 28, 8.5, 3.8, 'yap')
    d.set_face(24, 35, gap=5)


def genc(d):
    d.ellipse('Cimen', (28, 44), (14.5, 13), name='kafa', cast=1, lift=0.05)
    d.ellipse('Krem', (28, 52), (9, 6), clip='kafa', tone=1)
    d.circle('Cimen', (15, 35), 4.8, join='kafa')
    d.circle('Cimen', (41, 35), 4.8, join='kafa')
    d.ellipse('Cimen', (14, 50), (3.4, 4.6), rot=15, part='kol_1', line=True)
    d.ellipse('Cimen', (42, 50), (3.4, 4.6), rot=-15, part='kol_2', line=True)
    d.circle('Cimen', (13.5, 54), 2.4, part='kol_1', line=True, lift=0.15)
    d.circle('Cimen', (42.5, 54), 2.4, part='kol_2', line=True, lift=0.15)
    d.ellipse('Cimen', (21, 56.5), (5.5, 3), part='kol_1', line=True)
    d.ellipse('Cimen', (35, 56.5), (5.5, 3), part='kol_2', line=True)
    d.circle('Cimen', (16.5, 57.5), 2.0, part='kol_1', line=True, lift=0.15)
    d.circle('Cimen', (39.5, 57.5), 2.0, part='kol_2', line=True, lift=0.15)
    yaprak(d, 28, 30, 10, 4.2, 'yap')
    # pembe tomurcuk
    d.ellipse('Pembe', (28, 24.5), (3.8, 4.8), name='tom', part='tepe', line=True, cast=0)
    d.poly('Pembe', [(24.5, 28), (22.5, 24), (26, 25)], part='tepe', line=True)
    d.poly('Pembe', [(31.5, 28), (33.5, 24), (30, 25)], part='tepe', line=True)
    d.capsule('Pembe', (28, 21.5), (28, 27), 1.0, clip='tom', shift=1, part='tepe')
    d.pix((27, 22.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.set_face(28, 39, gap=5)


def usta(d):
    # sapli ikinci yaprak: omuz arkasindan yukari, semsiye
    d.capsule('Cimen', (51, 58), (53, 30), 1.8, part='esya', line=True, name='sap')
    d.ellipse('Cimen', (53, 27), (9.5, 4.8), rot=-14, part='esya', name='semsiye', line=True, cast=1, lift=-0.1)
    d.ellipse('Cimen', (49, 25.5), (3.2, 1.6), clip='semsiye', shift=-1, rot=-14, part='esya')
    d.capsule('Cimen', (53, 28), (46, 29), 0.9, clip='semsiye', shift=1, part='esya')
    d.capsule('Cimen', (53, 28), (60, 25.5), 0.9, clip='semsiye', shift=1, part='esya')
    d.ellipse('Cimen', (32, 48.5), (18.5, 17.5), name='kafa', cast=1, lift=0.05)
    d.ellipse('Krem', (32, 58), (10.5, 7), clip='kafa', tone=1)
    d.circle('Cimen', (18, 30.5), 5.8, join='kafa')
    d.circle('Cimen', (46, 30.5), 5.8, join='kafa')
    d.ellipse('Cimen', (14, 54), (3.8, 5.2), rot=15, part='kol_1', line=True)
    d.circle('Cimen', (13.5, 58.5), 2.6, part='kol_1', line=True, lift=0.15)
    # sag el sapi tutar
    d.ellipse('Cimen', (49.5, 55), (3.8, 4.6), rot=-15, part='kol_2', line=True)
    d.circle('Cimen', (50, 52), 2.6, part='kol_2', line=True, lift=0.15)
    d.ellipse('Cimen', (22, 61), (6, 3.2), part='kol_1', line=True)
    d.ellipse('Cimen', (42, 61), (6, 3.2), part='kol_2', line=True)
    d.circle('Cimen', (17, 62), 2.2, part='kol_1', line=True, lift=0.15)
    d.circle('Cimen', (47, 62), 2.2, part='kol_2', line=True, lift=0.15)
    yaprak(d, 32, 28.5, 11, 5, 'yap', damar=6)
    # tam acik nilufer
    for dx, dy, rot in ((-6.5, 0, 40), (6.5, 0, -40), (-3.5, -2, 15), (3.5, -2, -15)):
        d.ellipse('Pembe', (32 + dx, 21.5 + dy), (2.6, 5.2), rot=rot, part='tepe', line=True, name='p%d' % (dx * 2))
    d.ellipse('Pembe', (32, 20.5), (3, 6), part='tepe', line=True, name='pm', lift=0.1)
    d.ellipse('Sari', (32, 25), (2.6, 1.4), part='tepe', line=True)
    d.pix((31, 16.5), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.set_face(32, 42, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
