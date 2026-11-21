# Ametist Kirpi (Tas, epik). Tarif: TARIFLER.md. Sirti acik jeot gibi mor kristallerle dolu kirpi.
# Renk: Kahve (tuy), Krem (yuz, karin), Mor (kristal). Parlak: Mor -> Cam.
PARLA = 'Mor'


def kristal(d, a, b, w, name=None, **kw):
    d.capsule('Mor', a, b, w, part='tepe', line=True, **kw)


def bebek(d):
    kristal(d, (28, 28), (33, 19), (6, 5), lift=-0.08)
    kristal(d, (33, 31), (39, 25), (6, 5), lift=-0.08)
    kristal(d, (22, 27), (21, 18), (6, 5), lift=-0.08)
    kristal(d, (35, 36), (42, 33), (5.4, 4.2), lift=-0.12)
    d.ellipse('Kahve', (24, 35), (14, 12.2), name='kafa', cast=1)
    d.circle('Kahve', (13, 25.5), 3.4, part='kulak_1', line=True)
    d.circle('Kahve', (34, 25.5), 3.4, part='kulak_2', line=True)
    d.ellipse('Krem', (23, 37.5), (10.8, 8.4), name='yuz', line=True)
    d.circle('Krem', (17, 43.5), 2.6, part='kol_1', line=True)
    d.circle('Krem', (29, 43.5), 2.6, part='kol_2', line=True)
    d.set_face(23, 32, gap=5)


def genc(d):
    for a, b, w in (((34, 30), (36, 20), (6.4, 5)), ((40, 34), (46, 26), (6.4, 5)),
                    ((43, 41), (50, 37), (6, 4.6)), ((27, 27), (26, 17), (6.4, 5)), ((19, 30), (9, 24), (6.2, 4.8)), ((16, 38), (6, 36), (5.8, 4.4)),
                    ((41, 47), (48, 46), (5.4, 4.4))):
        kristal(d, a, b, w, lift=-0.08)
    d.ellipse('Kahve', (28, 41), (15, 11.5), name='govde', cast=1)
    d.ellipse('Kahve', (27, 31), (12.4, 10.4), name='kafa', join='govde')
    d.circle('Kahve', (17, 23), 3.4, part='kulak_1', line=True)
    d.circle('Kahve', (38, 23), 3.4, part='kulak_2', line=True)
    d.ellipse('Krem', (26.5, 42.5), (9.5, 7.5), name='karin', line=True)
    d.ellipse('Krem', (26.5, 34.5), (10.2, 6.8), name='yuz', line=True)
    d.circle('Pembe', (26.5, 32.6), 1.6, part='govde')
    d.circle('Krem', (18, 50), 3.2, part='kol_1', line=True)
    d.circle('Krem', (35, 50), 3.2, part='kol_2', line=True)
    d.set_face(27, 30, gap=5)


def usta(d):
    # yarim ay kristal yelpaze, sirtin arkasinda
    for i, (a, b, w) in enumerate((((20, 40), (6, 36), 7), ((22, 34), (8, 26), 7.4), ((26, 28), (15, 17), 7.8),
                                   ((32, 25), (28, 11), 8), ((38, 27), (43, 12), 7.8), ((43, 33), (55, 22), 7.4),
                                   ((45, 40), (58, 36), 7))):
        d.capsule('Mor', a, b, (w, w - 1.6), part='tepe', line=True, lift=-0.1 + 0.03 * (i % 3))
    d.ellipse('Kahve', (32, 47), (18, 13.5), name='govde', cast=1)
    d.ellipse('Kahve', (32, 33), (14, 13.5), name='kafa', join='govde')
    d.circle('Kahve', (20, 26), 3.8, part='kulak_1', line=True)
    d.circle('Kahve', (44, 26), 3.8, part='kulak_2', line=True)
    d.ellipse('Krem', (32, 48), (10.5, 8.5), name='karin', line=True)
    d.ellipse('Krem', (32, 39), (11.5, 8.2), name='yuz', line=True)
    d.circle('Pembe', (32, 36.2), 1.7, part='govde')
    d.circle('Krem', (21, 56), 3.6, part='kol_1', line=True)
    d.circle('Krem', (43, 56), 3.6, part='kol_2', line=True)
    # alin mucevheri
    d.ellipse('Mor', (32, 25.5), (3, 3.6), part='tepe', name='mucevher', line=True, lift=0.15)
    d.pix((31, 24), ['#.'], {'#': 'Parilti'}, part='tepe')
    d.set_face(32, 34, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
