# Damlacik (Su, nadir). Tarif: TARIFLER.md. Canli su damlasi: bebek kivrik uclu damla + kabarcik, genc sicrayan su tacli ve su kollu, usta dalga perçemli, sirtinda yaprak pelerin.
# Renk: Gok (su), Cam (golge/derinlik), Cimen (yaprak). Yuz gozlerin oldugu duz Gok alanda; kabarcik yuzun disinda (ust sag).
PARLA = 'Kar'


def kabarcik(d, x, y, r, tone=1):
    d.circle('Gok', (x, y), r + 0.7, clip='govde_', tone=3)
    d.circle('Gok', (x - 0.5, y - 0.5), r, clip='govde_', tone=1)
    d.pix((x - r + 1, y - r + 1), ['oo', 'o.'], {'o': 'Parilti'})


def bebek(d):
    d.ellipse('Gok', (24, 38), (13, 10.5), name='govde_', cast=1, lift=0.05)
    d.ellipse('Gok', (24, 30), (8.5, 7), join='govde_')
    # kivrik damla ucu
    d.curve('Gok', [(23, 28), (23, 23), (26, 19), (31, 18.5)], (7, 3.2), part='tepe', name='uc', line=True)
    d.circle('Gok', (32, 21), 2.4, part='tepe', line=True)
    # alt golge
    d.ellipse('Cam', (27, 46), (11, 3), clip='govde_', tone=1)
    kabarcik(d, 31.5, 31, 3.0)
    d.set_face(23, 35, gap=5)


def genc(d):
    d.ellipse('Gok', (28, 42), (14, 12), name='govde_', cast=1, lift=0.05)
    d.ellipse('Gok', (28, 34), (9.5, 8), join='govde_')
    d.ellipse('Cam', (31, 52), (12, 3.2), clip='govde_', tone=1)
    # su kollar
    d.ellipse('Gok', (12.5, 44), (3.4, 5.5), rot=20, part='kol_1', line=True)
    d.ellipse('Gok', (43.5, 44), (3.4, 5.5), rot=-20, part='kol_2', line=True)
    # sicrayan su tacı: kavisli damlalar
    d.ellipse('Gok', (28, 27), (6, 3), name='taban', part='tepe', join='govde_')
    d.capsule('Gok', (24, 27), (19, 17), (4, 3), part='tepe', name='t1', line=True)
    d.capsule('Gok', (28, 27), (28, 14), (4.5, 3.2), part='tepe', name='t2', line=True)
    d.capsule('Gok', (32, 27), (37, 17), (4, 3), part='tepe', name='t3', line=True)
    d.circle('Gok', (19, 15.5), 2.4, part='tepe', line=True)
    d.circle('Gok', (28, 11.5), 2.6, part='tepe', line=True)
    d.circle('Gok', (37.5, 15.5), 2.4, part='tepe', line=True)
    d.pix((27, 12), ['oo'], {'o': 'Parilti'}, part='tepe')
    kabarcik(d, 36, 36, 3.2)
    d.set_face(27, 40, gap=5)


def usta(d):
    # yaprak pelerin: arkada, omuz ve sirtin iki yaninda gorunur
    d.ellipse('Cimen', (32, 44), (23, 19), name='pelerin', part='esya', cast=1)
    d.poly('Cimen', [(12, 52), (20, 56), (14, 63)], join='pelerin', part='esya')
    d.poly('Cimen', [(52, 52), (44, 56), (50, 63)], join='pelerin', part='esya')
    d.capsule('Cimen', (32, 31), (32, 60), 1.0, clip='pelerin', shift=1, part='esya')
    d.capsule('Cimen', (32, 40), (16, 48), 0.9, clip='pelerin', shift=1, part='esya')
    d.capsule('Cimen', (32, 40), (48, 48), 0.9, clip='pelerin', shift=1, part='esya')
    d.capsule('Cimen', (32, 53), (20, 56), 0.9, clip='pelerin', shift=1, part='esya')
    d.capsule('Cimen', (32, 53), (44, 56), 0.9, clip='pelerin', shift=1, part='esya')
    d.ellipse('Cimen', (22, 36), (5, 2.4), clip='pelerin', shift=-1, rot=-30, part='esya')
    d.ellipse('Gok', (32, 46), (17, 18.5), name='govde_', cast=1, lift=0.05)
    d.ellipse('Gok', (32, 34), (12, 11), join='govde_')
    d.ellipse('Cam', (35, 61), (14, 3.4), clip='govde_', tone=1)
    d.ellipse('Gok', (14.5, 50), (3.6, 6), rot=20, part='kol_1', line=True)
    d.ellipse('Gok', (49.5, 50), (3.6, 6), rot=-20, part='kol_2', line=True)
    # dalga gibi kivrilan perçem
    d.curve('Gok', [(30, 27), (28, 20), (32, 15), (39, 14.5), (44, 18.5)], (7.5, 3.6), part='tepe', name='dalga', line=True)
    d.circle('Gok', (45, 21), 2.6, part='tepe', line=True)
    d.curve('Gok', [(33, 17), (38, 16)], 1.6, clip='dalga', shift=-2, part='tepe')
    d.pix((28, 21), ['o', 'o'], {'o': 'Parilti'}, part='tepe')
    kabarcik(d, 41, 41, 3.6)
    d.set_face(31, 43, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
