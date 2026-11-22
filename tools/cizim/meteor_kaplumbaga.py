# Meteor Kaplumbagasi (Yildiz, siradan). Tarif: TARIFLER.md. Iki ayagi ustunde dik duran, kraterli gok tasi kabugu sirt cantasi gibi tasiyan uzay yolcusu.
# Renk: Gok (ten), Tas (kabuk), Sari (krater isigi, alev). Kabuk govde, kafa part='kafa' (yuz kafada, savunmada kabuga girer).
PARLA = 'Sari'
GL = []


def parilti(d):
    for p in GL:
        d.pix(p, ['oo'], {'o': 'Parilti'}, part='govde')
    del GL[:]


def krater(d, x, y, rx, ry, glow=False, rot=0):
    d.ellipse('Tas', (x, y), (rx, ry), clip='sh', shift=2, rot=rot)
    d.ellipse('Tas', (x, y + 0.8), (rx - 0.9, ry - 0.9), clip='sh', shift=-1, rot=rot) if False else None
    if glow:
        d.ellipse('Sari', (x, y + 0.5), (rx - 1.0, ry - 0.8), clip='sh', tone=2, rot=rot)
        GL.append((int(x - rx * 0.4), int(y - ry * 0.4)))


def bayak(d, pts):
    d.poly('Tas', pts, clip='sh', shift=-1)


def bebek(d):
    # kabuk: yuvarlak kraterli tas, hafif sagda arkada
    d.ellipse('Tas', (29, 32.5), (12.5, 11.5), name='sh', cast=1, lift=0.02)
    d.ellipse('Tas', (26, 23), (5, 2.4), clip='sh', shift=-1, rot=-25)
    krater(d, 34, 27, 4.2, 3.4)
    krater(d, 35, 37, 2.6, 2.2)
    # govde (karin) + ayaklar
    d.ellipse('Gok', (22, 42), (7.5, 5.5), name='tn', cast=1)
    d.ellipse('Gok', (17.5, 46.5), (3.8, 2.2), line=True, name='a1')
    d.ellipse('Gok', (27, 46.5), (3.8, 2.2), line=True, name='a2')
    d.capsule('Gok', (14.5, 40), (12.5, 44), 3.6, part='kol_1', line=True)
    d.capsule('Gok', (29.5, 40), (31.5, 44), 3.6, part='kol_2', line=True)
    d.ellipse('Gok', (22, 34), (10, 8.4), part='kafa', name='kf', cast=1, lift=0.05)
    d.set_face(22, 33, gap=5)
    parilti(d)


def genc(d):
    d.ellipse('Tas', (33, 38), (15.5, 13.5), name='sh', cast=1, lift=0.02)
    d.ellipse('Tas', (29, 28), (6, 2.6), clip='sh', shift=-1, rot=-25)
    krater(d, 39, 31, 4.6, 3.4)
    krater(d, 43, 41, 3.6, 3, glow=True)
    krater(d, 37, 47, 3, 2.2)
    d.ellipse('Gok', (26, 51), (9, 6.2), name='tn', cast=1)
    d.ellipse('Gok', (20.5, 56), (4.2, 2.4), line=True)
    d.ellipse('Gok', (32, 56), (4.2, 2.4), line=True)
    d.capsule('Gok', (16.5, 47), (13.5, 52), 4.2, part='kol_1', line=True)
    d.capsule('Gok', (35.5, 47), (37.5, 52), 4.2, part='kol_2', line=True)
    d.ellipse('Gok', (26, 39), (10.5, 9), part='kafa', name='kf', cast=1, lift=0.05)
    d.set_face(26, 37, gap=5)
    parilti(d)


def usta(d):
    # alev kuyrugu (kabugun altindan)
    d.curve('Sari', [(46, 56), (52, 60), (55, 58)], (5.4, 2.2), part='kuyruk', name='fl', line=True, lift=0.1)
    d.curve('Sari', [(46, 56), (51, 59.5)], (3, 1.4), part='kuyruk', clip='fl', shift=-1)
    d.pix((48, 56), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    d.ellipse('Tas', (37, 39), (19, 18.5), name='sh', cast=1, lift=0.02)
    d.ellipse('Tas', (28, 28), (7, 3), clip='sh', shift=-1, rot=-25)
    krater(d, 43, 29, 5.4, 4.2, glow=True)
    krater(d, 49, 42, 4.2, 3.6, glow=True)
    krater(d, 42, 51, 3.8, 3, glow=True)
    krater(d, 31, 24, 2.6, 2.0, glow=True)
    d.ellipse('Gok', (32, 56), (11, 7), name='tn', cast=1)
    d.ellipse('Gok', (25.5, 61), (5, 2.6), line=True)
    d.ellipse('Gok', (39, 61), (5, 2.6), line=True)
    d.capsule('Gok', (20.5, 52), (16.5, 57), 5, part='kol_1', line=True)
    d.capsule('Gok', (43.5, 52), (46, 57), 5, part='kol_2', line=True)
    d.ellipse('Gok', (30, 43), (12.5, 10.5), part='kafa', name='kf', cast=1, lift=0.05)
    d.set_face(30, 41, gap=6)
    parilti(d)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
