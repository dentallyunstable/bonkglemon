# Sarkitcik (Tas, siradan). Tarif: TARIFLER.md. Damla bicimli sarkit tasi; tepesinde hep bir su damlasi.
# Renk: Tas (govde), Cam (damla, mineral). Parlak: Tas -> Sari.
PARLA = 'Cam'


def damla(d, cx, cy, s=1.0, glow=False):
    """Tepede duran su damlasi (Cam)."""
    d.ellipse('Cam', (cx, cy), (2.6 * s, 3.0 * s), part='tepe', name='damla', line=True, lift=0.1 if glow else 0)
    d.poly('Cam', [(cx, cy - 6.2 * s), (cx - 2.0 * s, cy - 1.5 * s), (cx + 2.0 * s, cy - 1.5 * s)], part='tepe', join='damla')
    d.pix((int(cx - 1.2 * s), int(cy - 0.5 * s)), ['o', 'o'], {'o': 'Parilti'}, part='tepe')


def cizgi(d, pts, nm='govde', w=1.0, shift=1):
    d.curve('Tas', pts, w, clip=nm, shift=shift)


def bebek(d):
    d.capsule('Tas', (24, 39), (24, 25), (27, 13), name='govde', cast=1)
    d.ellipse('Tas', (24, 39), (13.4, 4.4), join='govde')
    cizgi(d, [(14, 43), (24, 45), (34, 43)])
    cizgi(d, [(20, 24), (24, 25.5), (29, 24)], shift=-1)
    damla(d, 24, 19.5)
    d.circle('Tas', (13, 43), 2.6, part='kol_1', line=True)
    d.circle('Tas', (35, 43), 2.6, part='kol_2', line=True)
    d.set_face(24, 33, gap=5)


def genc(d):
    # minik kardes sarkit
    d.capsule('Tas', (41.5, 51), (41.5, 40), (9, 5.4), name='kardes', lift=-0.08, cast=1)
    d.ellipse('Tas', (41.5, 51), (5.4, 2.4), join='kardes')
    d.curve('Tas', [(37, 47), (41.5, 48.5), (46, 47)], 1.0, clip='kardes', shift=1)
    d.capsule('Tas', (25, 49), (25, 24), (28, 11), name='govde', cast=1)
    d.ellipse('Tas', (25, 49), (14, 4.4), join='govde')
    for y in (28, 47):
        cizgi(d, [(13, y + 2), (25, y + 3.5), (38, y + 2)], w=1.0, shift=1)
    cizgi(d, [(20, 24), (25, 25.2), (30, 24)], shift=-1)
    damla(d, 25, 18.5, 1.1)
    d.circle('Tas', (13.5, 46), 3.0, part='kol_1', line=True)
    d.circle('Tas', (37.5, 46), 3.0, part='kol_2', line=True)
    d.set_face(25, 33, gap=5)


def usta(d):
    # uzun, mum gibi akmis katmanli govde; yanlarda iki kucuk sarkit (kollar)
    d.capsule('Tas', (14, 55), (14, 40), (9, 5.6), part='kol_1', name='k1', lift=0.04, line=True)
    d.capsule('Tas', (50, 55), (50, 40), (9, 5.6), part='kol_2', name='k2', lift=0.04, line=True)
    d.capsule('Tas', (32, 57), (32, 26), (36, 14), name='govde', cast=2)
    d.ellipse('Tas', (32, 57), (19, 4.6), join='govde')
    for y in (29, 33, 52, 56):
        cizgi(d, [(15, y), (23, y + 1.8), (32, y + 2.2), (41, y + 1.8), (49, y)], w=1.0)
    for x, y in ((19, 31), (40, 53), (24, 50)):
        d.capsule('Tas', (x, y), (x, y + 4), 1.2, clip='govde', shift=-1)
    cizgi(d, [(26, 27), (32, 28.2), (38, 27)], shift=-1)
    damla(d, 32, 19.5, 1.3, glow=True)
    d.pix((31, 18), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.set_face(32, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (sola bakar)
def bebek_yan(d):
    d.circle('Tas', (31, 44.6), 2.6, part='kol_2', line=True)
    d.capsule('Tas', (26, 39), (24, 25), (27, 13), name='govde', cast=1)
    d.ellipse('Tas', (26, 39), (13.4, 4.4), join='govde')
    cizgi(d, [(15, 43), (26, 45), (36, 43)])
    cizgi(d, [(19, 24), (24, 25.5), (29, 24)], shift=-1)
    damla(d, 24, 19.5)
    d.circle('Tas', (19, 44.6), 2.6, part='kol_1', line=True)
    d.set_face_side(15, 32)


def genc_yan(d):
    d.capsule('Tas', (42.5, 51), (42.5, 40), (9, 5.4), name='kardes', lift=-0.08, cast=1)
    d.ellipse('Tas', (42.5, 51), (5.4, 2.4), join='kardes')
    d.curve('Tas', [(38, 47), (42.5, 48.5), (47, 47)], 1.0, clip='kardes', shift=1)
    d.circle('Tas', (35, 51), 3.0, part='kol_2', line=True)
    d.capsule('Tas', (28, 49), (25, 24), (28, 11), name='govde', cast=1)
    d.ellipse('Tas', (28, 49), (14, 4.4), join='govde')
    for y in (28, 47):
        cizgi(d, [(15, y + 2), (27, y + 3.5), (40, y + 2)], w=1.0, shift=1)
    cizgi(d, [(19, 24), (25, 25.2), (31, 24)], shift=-1)
    damla(d, 25, 18.5, 1.1)
    d.circle('Tas', (21, 51), 3.0, part='kol_1', line=True)
    d.set_face_side(18, 35)


def usta_yan(d):
    d.capsule('Tas', (46, 55), (46, 40), (9, 5.6), part='kol_2', name='k2', lift=0.04, line=True)
    d.capsule('Tas', (32, 57), (32, 26), (36, 14), name='govde', cast=2)
    d.ellipse('Tas', (32, 57), (19, 4.6), join='govde')
    for y in (29, 33, 52, 56):
        cizgi(d, [(14, y), (22, y + 1.8), (32, y + 2.2), (42, y + 1.8), (50, y)], w=1.0)
    for x, y in ((19, 31), (40, 53), (24, 50)):
        d.capsule('Tas', (x, y), (x, y + 4), 1.2, clip='govde', shift=-1)
    cizgi(d, [(26, 27), (32, 28.2), (38, 27)], shift=-1)
    damla(d, 32, 19.5, 1.3, glow=True)
    d.pix((31, 18), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.capsule('Tas', (22, 55), (22, 42), (9, 5.6), part='kol_1', name='k1', lift=0.04, line=True)
    d.set_face_side(20, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
