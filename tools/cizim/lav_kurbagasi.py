# Lav Kurbagasi (Ates, siradan). Tarif: TARIFLER.md. Sogumus lav gibi kara, catlak sirtli yassi genis kurbaga; gozleri tepede (iki tumsek kafayla birlesir, yuz tumseklerin icinde).
# Bebekte iki parlak catlak, gencte catlak agi + turuncu bogaz kesesi, ustada sirtta lav goleti + kor gibi ayak parmaklari.
# Renk: Komur (govde), Turuncu (catlak, kese, parmak ucu), Sari (karin, kese ici). Parlak: Turuncu -> Mor.
PARLA = 'Turuncu'


def catlak(d, pts, w=1.5, cl='govde'):
    d.curve('Turuncu', pts, w, part='govde', clip=cl, shift=0)


def sari(d, xy, part='govde'):
    d.pix(xy, ['oo'], {'o': 'Sari-1'}, part=part)


def bebek(d):
    d.ellipse('Komur', (13, 44.5), (4.6, 3.6), part='kol_1', line=True, rot=-10)
    d.ellipse('Komur', (35, 44.5), (4.6, 3.6), part='kol_2', line=True, rot=10)
    d.ellipse('Komur', (24, 38.5), (13.2, 9.8), name='kafa', cast=1, lift=0.08)
    # gozlu tumsekler (yuz bunlarin icinde)
    d.circle('Komur', (17.5, 31.5), 6.2, join='kafa')
    d.circle('Komur', (30.5, 31.5), 6.2, join='kafa')
    d.ellipse('Sari', (24, 45), (7.5, 3.6), part='govde', clip='kafa', shift=-2, inbox=(0, 43.5, 47, 50))
    catlak(d, [(10.5, 36), (13.5, 39), (12, 42.5)], 1.7, 'kafa')
    catlak(d, [(37.5, 36), (34.5, 39), (36, 42.5)], 1.7, 'kafa')
    catlak(d, [(12.5, 29), (14, 31.5)], 1.6, 'kafa')
    catlak(d, [(35.5, 29), (34, 31.5)], 1.6, 'kafa')
    d.ellipse('Komur', (17, 47.5), (4, 2.4), part='kol_1', line=True)
    d.ellipse('Komur', (31, 47.5), (4, 2.4), part='kol_2', line=True)
    d.set_face(24, 30, gap=6)


def genc(d):
    d.ellipse('Komur', (16, 51), (5.6, 4.4), part='kol_1', line=True, rot=-10)
    d.ellipse('Komur', (40, 51), (5.6, 4.4), part='kol_2', line=True, rot=10)
    d.ellipse('Komur', (28, 45), (17, 10.5), name='govde', cast=1, lift=0.05)
    d.ellipse('Komur', (28, 38.5), (16, 9.5), name='kafa', join='govde')
    d.circle('Komur', (20.5, 32.5), 6.8, join='govde')
    d.circle('Komur', (35.5, 32.5), 6.8, join='govde')
    d.ellipse('Turuncu', (28, 47.5), (8.5, 3.8), name='kese', line=True, cast=1, part='govde')
    d.ellipse('Sari', (28, 47.8), (5.6, 2.0), part='govde', clip='kese', shift=-1)
    for pts in ([(11, 40), (14.5, 43), (12.5, 47)], [(14.5, 43), (18.5, 44)], [(45, 40), (41.5, 43), (43.5, 47)], [(41.5, 43), (37.5, 44)], [(17, 31), (20, 34)], [(39, 31), (36, 34)],
                [(8, 47), (12, 51)], [(48, 47), (44, 51)], [(21, 52), (23, 55)], [(35, 52), (33, 55)]):
        catlak(d, pts, 1.5, 'govde')
    d.pix((22, 27), ['oo'], {'o': 'Sari-1'}, part='govde'); d.pix((34, 27), ['oo'], {'o': 'Sari-1'}, part='govde')
    d.ellipse('Komur', (19.5, 55), (4.6, 2.8), part='kol_1', line=True)
    d.ellipse('Komur', (36.5, 55), (4.6, 2.8), part='kol_2', line=True)
    d.set_face(28, 30, gap=6)


def usta(d):
    d.ellipse('Komur', (17, 58), (6.0, 5.0), part='kol_1', line=True, rot=-10)
    d.ellipse('Komur', (47, 58), (6.0, 5.0), part='kol_2', line=True, rot=10)
    d.ellipse('Komur', (32, 51), (21.5, 11.5), name='govde', cast=1, lift=0.05)
    d.ellipse('Komur', (32, 43), (20.5, 10.5), name='kafa', join='govde')
    d.circle('Komur', (22, 32), 8.2, join='govde')
    d.circle('Komur', (42, 32), 8.2, join='govde')
    # sirtta lav goleti: alt-ortada degil, govdenin ust kenarinda iki goz tumsegi arasinda
    d.ellipse('Turuncu', (32, 24.5), (5.6, 2.6), name='golet', line=True, part='tepe')
    d.ellipse('Sari', (32, 24.8), (3.4, 1.2), part='tepe', clip='golet', shift=-1)
    d.ellipse('Turuncu', (32, 55), (10, 4.2), name='kese', line=True, cast=1, part='govde')
    d.ellipse('Sari', (32, 55.4), (6.8, 2.2), part='govde', clip='kese', shift=-1)
    for pts in ([(12, 45), (16, 48), (14, 53)], [(16, 48), (20, 49)], [(52, 45), (48, 48), (50, 53)], [(48, 48), (44, 49)],
                [(11, 52), (14, 57)], [(53, 52), (50, 57)], [(16, 31), (19, 35)], [(48, 31), (45, 35)], [(21, 57), (23.5, 60.5)], [(43, 57), (40.5, 60.5)], [(26, 44), (23, 47)], [(38, 44), (41, 47)]):
        catlak(d, pts, 1.6, 'govde')
    d.pix((24, 29), ['oo'], {'o': 'Parilti'}, part='govde'); d.pix((39, 29), ['oo'], {'o': 'Sari-1'}, part='govde')
    d.ellipse('Komur', (22, 60), (5.4, 3.0), part='kol_1', line=True)
    d.ellipse('Komur', (42, 60), (5.4, 3.0), part='kol_2', line=True)
    for x in (17.5, 22, 26.5):
        d.circle('Turuncu', (x, 62.5), 1.7, part='kol_1', line=True)
    for x in (37.5, 42, 46.5):
        d.circle('Turuncu', (x, 62.5), 1.7, part='kol_2', line=True)
    d.set_face(32, 32, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
