# Taskabuk (Tas, siradan). Tarif: TARIFLER.md. Kabugu icinde kristal dolu bir tas (jeot) olan kaplumbaga.
# Renk: Tas (kabuk), Cam (kafa/ten), Mor (kristal). Kabuk govde, kafa part='kafa' (yuz kafada).
PARLA = 'Mor'


def bebek(d):
    # yumurta gibi duz kabuk, genis kubbe
    d.ellipse('Tas', (25, 27), (14, 11), name='kabuk', lift=0.04, cast=1)
    d.ellipse('Tas', (19, 21), (3.6, 2.2), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (33, 30), 2.4, clip='kabuk', shift=1)
    d.circle('Tas', (30.5, 21.5), 1.4, clip='kabuk', shift=1)
    d.ellipse('Cam', (14, 38), (3.4, 2.8), part='kol_1', line=True)
    d.ellipse('Cam', (35.5, 38), (3.4, 2.8), part='kol_2', line=True)
    # kabugun altindan bakan kafa
    d.ellipse('Cam', (24, 34.5), (10.6, 8.4), part='kafa', name='kafa', lift=0.04, cast=1)
    d.set_face(24, 31, gap=5)


def genc(d):
    d.ellipse('Tas', (30, 27), (17, 12.5), name='kabuk', lift=0.03, cast=1)
    d.ellipse('Tas', (20, 21), (4.2, 2.4), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (42, 31), 2.6, clip='kabuk', shift=1)
    # catlak: kabugun ustunden asagi zikzak, icinde mor kristaller
    d.poly('Mor', [(26, 16), (35, 16), (35, 20), (33, 22), (34, 26), (31, 24), (30, 28), (29, 23), (27, 21)], name='catlak', clip='kabuk', tone=3)
    d.capsule('Mor', (27.5, 20), (26.5, 14), 4.2, name='k1', line=True)
    d.capsule('Mor', (34, 20), (37, 14.5), 3.8, name='k2', line=True)
    d.capsule('Mor', (31, 21), (31, 12), 3.8, name='k3', line=True)
    d.rect('Mor', (27, 15, 27, 18), clip='k1', shift=-1)
    d.ellipse('Cam', (14, 41), (3.6, 3.0), part='kol_1', line=True)
    d.ellipse('Cam', (43, 41), (3.6, 3.0), part='kol_2', line=True)
    d.ellipse('Cam', (26, 37), (11, 8.6), part='kafa', name='kafa', lift=0.04, cast=1)
    d.set_face(26, 34, gap=5)


def usta(d):
    d.ellipse('Tas', (32, 33), (20, 12.5), name='kabuk', lift=0.03, cast=1)
    d.ellipse('Tas', (21, 28), (4.6, 2.4), clip='kabuk', shift=-1, rot=-30)
    d.circle('Tas', (46, 38), 2.8, clip='kabuk', shift=1)
    d.circle('Tas', (45, 29), 1.6, clip='kabuk', shift=1)
    # ustu acik oyuk, icinde buyuk mor kristaller
    d.ellipse('Mor', (32, 24.5), (13.5, 5.2), name='oyuk', line=True, lift=-0.1)
    d.capsule('Mor', (23, 25), (21, 18), 4.0, name='k1', line=True)
    d.capsule('Mor', (29, 25), (29, 13), 4.6, name='k2', line=True)
    d.capsule('Mor', (36, 25), (38, 15), 4.2, name='k3', line=True)
    d.capsule('Mor', (42, 25), (45, 19), 3.4, name='k4', line=True)
    d.ellipse('Mor', (32, 26.5), (13, 3.4), name='oyuk2', line=True, lift=0.1)
    d.rect('Mor', (28, 15, 28, 21), clip='k2', shift=-1)
    d.rect('Mor', (21, 20, 21, 23), clip='k1', shift=-1)
    d.rect('Mor', (37, 17, 37, 22), clip='k3', shift=-1)
    # tas plakali ayaklar
    d.ellipse('Cam', (14, 46), (4.4, 3.2), part='kol_1', line=True)
    d.ellipse('Cam', (51, 46), (4.4, 3.2), part='kol_2', line=True)
    d.ellipse('Tas', (14, 48.5), (5, 2.2), part='kol_1', line=True, name='pl1')
    d.ellipse('Tas', (51, 48.5), (5, 2.2), part='kol_2', line=True, name='pl2')
    d.ellipse('Cam', (32, 42), (12.5, 9.2), part='kafa', name='kafa', lift=0.04, cast=1)
    d.set_face(32, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
