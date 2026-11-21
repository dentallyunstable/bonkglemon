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
