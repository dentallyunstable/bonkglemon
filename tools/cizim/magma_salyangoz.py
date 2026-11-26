# Magma Salyangozu (Ates, siradan). Tarif: TARIFLER.md. Kabugu kucuk bir yanardag olan, acele etmeyen salyangoz.
# Renk: Komur (kabuk), Turuncu (govde, lav), Sari (parlak lav). Kabuk govde, kafa part='kafa' (yuz kafada, savunmada kabuga girer).
PARLA = 'Sari'

DUMAN = ['.ooo.', 'o...o', 'o...o', '.ooo.']


def sap(d, a, b, tip, w=1.8, pr=2.4):
    """Goz sapi: kafadan cikar, ucu top (parlak)."""
    d.capsule('Turuncu', a, b, w, part='kafa', line=True)
    d.circle(tip, b, pr, part='kafa', line=True)


def bebek(d):
    # yumusak govde (ayak)
    d.ellipse('Turuncu', (24, 42.5), (13, 5.2), name='ayak', cast=1)
    d.ellipse('Turuncu', (34, 40), (5.4, 4.2), join='ayak')
    # yuvarlak kara tas kabuk, catlakta lav
    d.ellipse('Komur', (28, 31), (11.5, 9.5), name='kabuk', lift=0.05, cast=1)
    d.ellipse('Komur', (24, 26), (3.6, 2.2), clip='kabuk', shift=-1, rot=-30)
    d.poly('Sari', [(29, 23), (32, 25), (30, 28), (34, 30), (31, 32), (32, 36), (29, 33), (30, 29), (27, 27)], clip='kabuk', tone=2)
    d.pix((31, 26), ['oo'], {'o': 'Parilti'}, part='govde')
    # kafa + goz sapi
    sap(d, (19, 31), (16, 24.5), 'Sari')
    sap(d, (27, 31), (29, 24), 'Sari')
    d.ellipse('Turuncu', (22, 37), (10, 8), part='kafa', name='kafa', cast=1, lift=0.05)
    d.set_face(22, 34, gap=5)


def genc(d):
    d.ellipse('Turuncu', (27, 49), (17, 5.4), name='ayak', cast=1)
    d.ellipse('Turuncu', (40, 46), (6.4, 4.8), join='ayak')
    # koni kabuk: yamac + yuvarlak taban
    d.poly('Komur', [(14, 44), (20, 32), (25, 22), (35, 22), (40, 32), (46, 44)], name='kabuk', cast=1, lift=0.05)
    d.ellipse('Komur', (30, 43), (16.5, 6), join='kabuk')
    d.ellipse('Komur', (30, 22), (5.4, 2.2), join='kabuk', lift=0.12)
    d.ellipse('Komur', (24, 34), (3.0, 6), clip='kabuk', shift=-1, rot=22)
    d.poly('Sari', [(34, 28), (37, 32), (35, 36), (39, 40), (36, 42), (34, 39), (33, 34)], clip='kabuk', tone=2)
    d.poly('Sari', [(28, 22), (31, 22), (30, 25)], clip='kabuk', tone=2)
    d.pix((36, 31), ['oo'], {'o': 'Parilti'}, part='govde')
    # krater ustunde duman halkasi
    d.pix((28, 16), DUMAN, {'o': 'Komur-1'}, part='tepe')
    sap(d, (21, 38), (17, 30), 'Sari', pr=2.6)
    sap(d, (31, 38), (34, 29), 'Sari', pr=2.6)
    d.ellipse('Turuncu', (25, 44), (11, 8.6), part='kafa', name='kafa', cast=1, lift=0.05)
    d.set_face(25, 41, gap=5)


def usta(d):
    d.ellipse('Turuncu', (31, 56), (20, 5.6), name='ayak', cast=1)
    d.ellipse('Turuncu', (46, 53), (7, 5), join='ayak')
    # tam yanardag: genis yamac, krater agzi
    d.poly('Komur', [(11, 52), (21, 34), (26, 20), (40, 20), (44, 34), (54, 52)], name='kabuk', cast=1, lift=0.05)
    d.ellipse('Komur', (32.5, 51), (21.5, 7), join='kabuk')
    d.ellipse('Komur', (33, 20), (8, 3), join='kabuk', lift=0.1)
    d.ellipse('Komur', (26, 36), (3.4, 8), clip='kabuk', shift=-1, rot=22)
    d.circle('Komur', (46, 43), 2.6, clip='kabuk', shift=1)
    # krater agzinda lav + iki lav seridi
    d.ellipse('Sari', (33, 19.5), (6, 2.2), part='govde', line=True)
    d.pix((31, 18), ['oo'], {'o': 'Parilti'}, part='govde')
    d.curve('Turuncu', [(30, 21), (28, 29), (31, 36), (27, 45)], (3.6, 2.2), clip='kabuk', tone=2)
    d.curve('Sari', [(30, 21), (28, 29), (31, 36), (27, 45)], (1.8, 1.0), clip='kabuk', tone=2)
    d.curve('Turuncu', [(37, 22), (40, 30), (38, 37), (43, 45)], (3.6, 2.2), clip='kabuk', tone=2)
    d.curve('Sari', [(37, 22), (40, 30), (38, 37), (43, 45)], (1.8, 1.0), clip='kabuk', tone=2)
    d.pix((30, 14), ['.oo.', 'o..o', 'o..o', '.oo.'], {'o': 'Komur-1'}, part='tepe')
    sap(d, (23, 47), (17, 38), 'Sari', w=2.2, pr=3.0)
    sap(d, (36, 47), (41, 38), 'Sari', w=2.2, pr=3.0)
    d.ellipse('Turuncu', (30, 53.5), (13, 10), part='kafa', name='kafa', cast=1, lift=0.05)
    d.set_face(30, 50, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def sap_yan(d, a, b, tip, w=1.8, pr=2.4, far=False):
    """Yandan goz sapi (tepe parcasi); uzak sap daha koyu."""
    kw = dict(lift=-0.15) if far else {}
    d.capsule('Turuncu', a, b, w, part='tepe', line=True, **kw)
    d.circle(tip, b, pr, part='tepe', line=True, **kw)


def bebek_yan(d):
    sap_yan(d, (19, 34), (19, 26), 'Sari', far=True)
    d.ellipse('Turuncu', (27, 43), (14.5, 5.0), name='ayak', cast=1)
    d.ellipse('Turuncu', (13, 38.5), (7.5, 6.8), join='ayak')
    d.ellipse('Turuncu', (39, 42.5), (4.5, 3.6), join='ayak', lift=0.0)
    d.ellipse('Komur', (31, 30), (11.5, 10.5), name='kabuk', lift=0.05, cast=1)
    d.ellipse('Komur', (27, 25), (3.6, 2.2), clip='kabuk', shift=-1, rot=-30)
    d.poly('Sari', [(31, 21), (34, 23), (32, 27), (36, 29), (33, 31), (34, 35), (31, 32), (32, 28), (29, 26)], clip='kabuk', tone=2)
    d.pix((33, 25), ['oo'], {'o': 'Parilti'}, part='govde')
    sap_yan(d, (10, 34), (8, 25), 'Sari')
    d.set_face_side(8, 37)


def genc_yan(d):
    sap_yan(d, (21, 41), (21, 31), 'Sari', pr=2.6, far=True)
    d.ellipse('Turuncu', (32, 50), (17.5, 5.4), name='ayak', cast=1)
    d.ellipse('Turuncu', (15, 45), (8.6, 7.8), join='ayak')
    d.ellipse('Turuncu', (47, 49), (5.0, 4.0), join='ayak')
    d.poly('Komur', [(22, 48), (27, 34), (32, 22), (41, 22), (45, 34), (50, 48)], name='kabuk', cast=1, lift=0.05)
    d.ellipse('Komur', (36, 47), (14.5, 5.5), join='kabuk')
    d.ellipse('Komur', (36.5, 22), (5.0, 2.2), join='kabuk', lift=0.12)
    d.ellipse('Komur', (31, 36), (3.0, 6), clip='kabuk', shift=-1, rot=22)
    d.poly('Sari', [(39, 29), (42, 33), (40, 37), (44, 41), (41, 44), (39, 40), (38, 35)], clip='kabuk', tone=2)
    d.poly('Sari', [(34, 22), (37, 22), (36, 25)], clip='kabuk', tone=2)
    d.pix((41, 32), ['oo'], {'o': 'Parilti'}, part='govde')
    d.pix((34, 16), DUMAN, {'o': 'Komur-1'}, part='tepe')
    sap_yan(d, (12, 40), (9, 30), 'Sari', pr=2.6)
    d.set_face_side(9, 42)


def usta_yan(d):
    sap_yan(d, (21, 49), (21, 37), 'Sari', w=2.2, pr=3.0, far=True)
    d.ellipse('Turuncu', (36, 57), (21, 5.8), name='ayak', cast=1)
    d.ellipse('Turuncu', (16, 52), (10, 9), join='ayak')
    d.ellipse('Turuncu', (53, 56), (5.4, 4.4), join='ayak')
    d.poly('Komur', [(21, 55), (30, 36), (35, 21), (49, 21), (53, 36), (62, 55)], name='kabuk', cast=1, lift=0.05)
    d.ellipse('Komur', (41.5, 54), (21.5, 6.5), join='kabuk')
    d.ellipse('Komur', (42, 21), (8, 3), join='kabuk', lift=0.1)
    d.ellipse('Komur', (34, 39), (3.4, 8), clip='kabuk', shift=-1, rot=22)
    d.circle('Komur', (55, 46), 2.6, clip='kabuk', shift=1)
    d.ellipse('Sari', (42, 20.5), (6, 2.2), part='govde', line=True)
    d.pix((40, 19), ['oo'], {'o': 'Parilti'}, part='govde')
    d.curve('Turuncu', [(39, 22), (37, 30), (40, 37), (36, 47)], (3.6, 2.2), clip='kabuk', tone=2)
    d.curve('Sari', [(39, 22), (37, 30), (40, 37), (36, 47)], (1.8, 1.0), clip='kabuk', tone=2)
    d.curve('Turuncu', [(46, 23), (49, 31), (47, 38), (52, 47)], (3.6, 2.2), clip='kabuk', tone=2)
    d.curve('Sari', [(46, 23), (49, 31), (47, 38), (52, 47)], (1.8, 1.0), clip='kabuk', tone=2)
    d.pix((39, 15), ['.oo.', 'o..o', 'o..o', '.oo.'], {'o': 'Komur-1'}, part='tepe')
    sap_yan(d, (12, 47), (9, 36), 'Sari', w=2.2, pr=3.0)
    d.set_face_side(9, 48)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
