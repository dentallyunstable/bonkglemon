# Kristalbocek (Tas, nadir). Tarif: TARIFLER.md. Sirtinda buz mavisi kristal buyuyen tosbik koyu bocek.
# Renk: Komur (govde), Gok (kristal), Mor (vurgu: benek, ayak). Nadir: kristalde 2 piksel Parilti. Parlak: Gok -> Pembe.
PARLA = 'Gok'


def kristal(d, a, b, w, name, part='tepe', **kw):
    d.capsule('Gok', a, b, w, name=name, part=part, line=True, **kw)


def isik(d, x, y, part='tepe'):
    d.pix((x, y), ['oo'], {'o': 'Parilti'}, part=part)


def govde(d, c, r, name='g', **kw):
    d.ellipse('Komur', c, r, name=name, lift=0.05, cast=1, **kw)


def bebek(d):
    # ayaklar
    d.ellipse('Mor', (16, 44.5), (3.4, 2.4), part='kol_1', line=True)
    d.ellipse('Mor', (32, 44.5), (3.4, 2.4), part='kol_2', line=True)
    govde(d, (24, 34), (14, 11.5))
    # kabuk yaladigi: parlak yay ve mor benekler
    d.ellipse('Komur', (17, 27), (4.5, 2.2), clip='g', shift=-1, rot=-30)
    d.circle('Mor', (33, 40), 2.0, clip='g', shift=0)
    d.circle('Mor', (33.5, 29), 1.5, clip='g', shift=0)
    # sirtta parti sapkasi gibi tek kristal
    d.poly('Gok', [(27, 25), (28, 17), (31, 11), (34, 17), (35, 26)], name='k1', part='tepe', line=True)
    d.rect('Gok', (30, 14, 31, 22), clip='k1', shift=-1)
    isik(d, 29, 17)
    d.set_face(24, 32, gap=5)


def genc(d):
    # orta bacaklar govdenin arkasindan gorunur
    d.ellipse('Mor', (14, 47), (3.4, 2.4), line=True, lift=-0.1, name='mb1')
    d.ellipse('Mor', (42, 47), (3.4, 2.4), line=True, lift=-0.1, name='mb2')
    d.ellipse('Mor', (18, 55), (4, 2.7), part='kol_1', line=True)
    d.ellipse('Mor', (38, 55), (4, 2.7), part='kol_2', line=True)
    # sirtta uc kristal, yanlara dagilmis
    d.poly('Gok', [(13, 34), (12, 25), (15, 19), (19, 25), (20, 35)], name='k3', part='tepe', line=True, lift=-0.1)
    d.poly('Gok', [(34, 30), (34, 21), (38, 14), (42, 21), (42, 32)], name='k1', part='tepe', line=True, lift=-0.04)
    d.poly('Gok', [(41, 36), (42, 28), (46, 23), (49, 29), (47, 38)], name='k2', part='tepe', line=True, lift=-0.1)
    d.rect('Gok', (37, 17, 37, 26), clip='k1', shift=-1)
    d.rect('Gok', (16, 22, 16, 30), clip='k3', shift=-1)
    isik(d, 37, 18)
    govde(d, (28, 41), (14.5, 16.5))
    d.ellipse('Komur', (20, 31), (5.5, 2.4), clip='g', shift=-1, rot=-25)
    d.capsule('Komur', (28, 25), (28, 32), 1.0, clip='g', shift=-1)
    d.circle('Mor', (38, 49), 2.2, clip='g')
    d.circle('Mor', (38.5, 35), 1.5, clip='g')
    # burunda (alnin ustunde) kisa kristal boynuz
    d.capsule('Gok', (27, 31), (26, 22), (4.8, 3.2), name='boynuz', part='tepe', line=True)
    d.rect('Gok', (26, 25, 26, 28), clip='boynuz', shift=-1)
    d.set_face(28, 38, gap=5)


def usta(d):
    d.ellipse('Mor', (13, 54), (4, 2.8), line=True, lift=-0.1, name='mb1')
    d.ellipse('Mor', (51, 54), (4, 2.8), line=True, lift=-0.1, name='mb2')
    d.ellipse('Mor', (23, 64.5), (4.8, 3.4), part='kol_1', line=True)
    d.ellipse('Mor', (41, 64.5), (4.8, 3.4), part='kol_2', line=True)
    # sirt: kristal demeti kabuk gibi (ortada catalli boynuza yer birakir)
    d.poly('Gok', [(10, 40), (8, 29), (11, 21), (16, 28), (17, 40)], name='c1', part='tepe', line=True, lift=-0.14)
    d.poly('Gok', [(47, 40), (48, 30), (52, 22), (56, 30), (54, 42)], name='c2', part='tepe', line=True, lift=-0.14)
    d.poly('Gok', [(16, 36), (16, 22), (20, 12), (26, 22), (27, 36)], name='c3', part='tepe', line=True, lift=-0.06)
    d.poly('Gok', [(38, 36), (39, 20), (44, 10), (49, 22), (50, 36)], name='c4', part='tepe', line=True, lift=-0.02)
    d.rect('Gok', (19, 16, 19, 28), clip='c3', shift=-1)
    d.rect('Gok', (43, 14, 43, 28), clip='c4', shift=-1)
    d.rect('Gok', (11, 25, 11, 34), clip='c1', shift=-1)
    d.rect('Gok', (52, 26, 52, 36), clip='c2', shift=-1)
    isik(d, 20, 17)
    govde(d, (32, 43.5), (20, 20.5))
    d.ellipse('Komur', (21, 36), (7, 2.8), clip='g', shift=-1, rot=-25)
    d.capsule('Komur', (32, 27), (32, 35), 1.0, clip='g', shift=-1)
    d.circle('Mor', (47, 56), 2.8, clip='g')
    d.circle('Mor', (48, 41), 1.8, clip='g')
    d.circle('Mor', (18, 57), 1.8, clip='g')
    # catalli kristal boynuz (geyik bocegi gibi)
    d.capsule('Gok', (32, 33), (32, 27), (6, 4.6), name='bs', part='tepe', line=True)
    d.capsule('Gok', (32, 29), (26, 19), (4.4, 3.4), name='b1', part='tepe', line=True)
    d.capsule('Gok', (32, 29), (38, 19), (4.4, 3.4), name='b2', part='tepe', line=True)
    d.rect('Gok', (32, 29, 32, 32), clip='bs', shift=-1)
    d.set_face(32, 45, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (sola bakar)
def bebek_yan(d):
    d.ellipse('Mor', (31, 44.5), (3.4, 2.4), part='kol_2', line=True)
    d.poly('Gok', [(30, 26), (31, 18), (34, 11), (37, 17), (38, 27)], name='k1', part='tepe', line=True)
    d.rect('Gok', (33, 14, 34, 22), clip='k1', shift=-1)
    isik(d, 32, 17)
    govde(d, (26, 34), (14, 11.5))
    d.ellipse('Komur', (19, 27), (4.5, 2.2), clip='g', shift=-1, rot=-30)
    d.circle('Mor', (35, 40), 2.0, clip='g', shift=0)
    d.circle('Mor', (36, 31), 1.5, clip='g', shift=0)
    d.ellipse('Komur', (13, 37), (4, 3), join='g')
    d.pix2((5, 18), ['#'], {'#': 'Komur-4'})
    d.ellipse('Mor', (18, 44.5), (3.4, 2.4), part='kol_1', line=True)
    d.set_face_side(15, 31)


def genc_yan(d):
    d.ellipse('Mor', (38, 54), (4, 2.7), part='kol_2', line=True)
    d.poly('Gok', [(33, 34), (33, 22), (38, 13), (43, 22), (44, 35)], name='k1', part='tepe', line=True, lift=-0.04)
    d.poly('Gok', [(41, 38), (42, 28), (47, 20), (51, 29), (49, 40)], name='k2', part='tepe', line=True, lift=-0.1)
    d.poly('Gok', [(26, 31), (25, 22), (29, 15), (33, 24), (35, 33)], name='k3', part='tepe', line=True, lift=-0.1)
    d.rect('Gok', (37, 16, 37, 28), clip='k1', shift=-1)
    d.rect('Gok', (29, 19, 29, 27), clip='k3', shift=-1)
    isik(d, 37, 17)
    govde(d, (29, 41), (15, 14.5))
    d.ellipse('Komur', (22, 31), (5.5, 2.4), clip='g', shift=-1, rot=-25)
    d.capsule('Komur', (29, 29), (29, 35), 1.0, clip='g', shift=-1)
    d.circle('Mor', (39, 47), 2.2, clip='g')
    d.circle('Mor', (40, 36), 1.5, clip='g')
    d.ellipse('Komur', (14, 42), (4.2, 3.4), join='g')
    d.capsule('Gok', (11, 41), (5, 33), (5.6, 4.0), name='boynuz', line=True)
    d.rect('Gok', (7, 35, 8, 38), clip='boynuz', shift=-1)
    d.ellipse('Mor', (21, 54.5), (4, 2.7), part='kol_1', line=True)
    d.set_face_side(15, 36)


def usta_yan(d):
    d.ellipse('Mor', (44, 64.5), (4.8, 3.4), part='kol_2', line=True)
    d.poly('Gok', [(46, 46), (48, 30), (54, 19), (60, 31), (58, 48)], name='c2', part='tepe', line=True, lift=-0.14)
    d.poly('Gok', [(28, 40), (29, 22), (35, 7), (42, 22), (43, 40)], name='c3', part='tepe', line=True, lift=-0.06)
    d.poly('Gok', [(38, 42), (40, 24), (47, 11), (54, 26), (54, 43)], name='c4', part='tepe', line=True, lift=-0.02)
    d.rect('Gok', (34, 12, 34, 28), clip='c3', shift=-1)
    d.rect('Gok', (46, 16, 46, 32), clip='c4', shift=-1)
    d.rect('Gok', (54, 24, 54, 38), clip='c2', shift=-1)
    isik(d, 34, 12)
    govde(d, (34, 44.5), (20, 20))
    d.ellipse('Komur', (23, 35), (7, 2.8), clip='g', shift=-1, rot=-25)
    d.capsule('Komur', (34, 27), (34, 35), 1.0, clip='g', shift=-1)
    d.circle('Mor', (49, 57), 2.8, clip='g')
    d.circle('Mor', (50, 42), 1.8, clip='g')
    d.circle('Mor', (20, 58), 1.8, clip='g')
    d.ellipse('Komur', (15, 49), (5, 3.8), join='g')
    d.capsule('Gok', (13, 47), (5, 40), (7.4, 5.2), name='bs', line=True)
    d.capsule('Gok', (9, 44), (3, 34), (5.4, 4), name='b1', line=True)
    d.capsule('Gok', (9, 44), (13, 33), (5.4, 4), name='b2', line=True)
    d.rect('Gok', (9, 43, 10, 45), clip='bs', shift=-1)
    d.ellipse('Mor', (24, 64.5), (4.8, 3.4), part='kol_1', line=True)
    d.set_face_side(18, 44)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
