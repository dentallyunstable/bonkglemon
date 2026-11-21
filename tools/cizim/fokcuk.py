# Fokcuk (Buz, siradan). Tarif: TARIFLER.md. Beyaz tuy topu fok yavrusu: bebek bembeyaz, genc benekli + kartopu, usta kartopu kardan adam + mavi fular.
# Renk: Kar (tuy), Tas (benek, bigi noktalari, kuyruk yuzgeci), Gok (fular). Kartopu burun ustunde/alnin ustunde dengelenir. Parlak: Kar -> Krem.
PARLA = 'Gok'


def burun(d, cx, y):
    d.pix((cx - 2, y), ['.##.', '####'], {'#': 'Murekkep'}, part='govde')


def topu(d, cx, y, r, part='esya'):
    d.circle('Kar', (cx, y), r, part=part, name='top%d' % int(y), line=True, lift=0.12)
    d.pix((int(cx - r * .5), int(y - r * .5)), ['oo'], {'o': 'Parilti'}, part=part)


def bebek(d):
    d.ellipse('Kar', (24, 46.5), (4.2, 2.4), rot=-35, name='y1', line=True, noshadow=True, lift=0.1)
    d.ellipse('Kar', (31, 46.5), (4.2, 2.4), rot=35, name='y2', line=True, noshadow=True, lift=0.1)
    d.ellipse('Kar', (24, 35.5), (13.8, 12.4), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (11.5, 41), (2.6, 3.8), rot=25, part='kol_1', line=True)
    d.ellipse('Kar', (36.5, 41), (2.6, 3.8), rot=-25, part='kol_2', line=True)
    pass  # burun kaldirildi (gozlerin ustunde kas gibi duruyordu)
    d.set_face(24, 33, gap=5)


def genc(d):
    cx = 28
    d.ellipse('Tas', (cx - 6, 53), (5, 2.6), rot=-30, name='y1', line=True, lift=0.0)
    d.ellipse('Tas', (cx + 6, 53), (5, 2.6), rot=30, name='y2', line=True, lift=0.0)
    d.ellipse('Kar', (cx, 40), (16, 15), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 47), (11, 6.5), name='karin', lift=0.25)
    for x, y, r in ((cx - 12, 34, 1.9), (cx + 11, 46, 2.1), (cx - 9, 48, 1.7), (cx + 12, 36, 1.5), (cx - 3, 31, 1.4)):
        d.circle('Tas', (x, y), r, clip='g', shift=0)
    # bigi noktalari: yuz alaninin disinda, yanaklarin yaninda
    d.pix((cx - 10, 41), ['#.#'], {'#': 'Tas-3'})
    d.pix((cx + 9, 41), ['#.#'], {'#': 'Tas-3'})
    d.ellipse('Kar', (12.5, 46), (3, 4.4), rot=22, part='kol_1', line=True)
    d.ellipse('Kar', (43.5, 46), (3, 4.4), rot=-22, part='kol_2', line=True)
    pass  # burun kaldirildi (gozlerin ustunde kas gibi duruyordu)
    topu(d, cx, 28, 5.0)
    d.set_face(cx, 37, gap=5)


def usta(d):
    cx = 32
    d.ellipse('Tas', (cx - 8, 64), (6.4, 3), rot=-30, name='y1', line=True, lift=0.0)
    d.ellipse('Tas', (cx + 8, 64), (6.4, 3), rot=30, name='y2', line=True, lift=0.0)
    d.ellipse('Kar', (cx, 47.5), (19, 20.3), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 55), (13, 8), name='karin', lift=0.25)
    for x, y, r in ((cx - 15, 40, 2.4), (cx + 14, 54, 2.6), (cx - 11, 56, 2.0), (cx + 15, 42, 1.8), (cx - 4, 33, 1.6), (cx + 6, 32.5, 1.5)):
        d.circle('Tas', (x, y), r, clip='g', shift=0)
    d.pix((cx - 12, 45), ['#.#'], {'#': 'Tas-3'})
    d.pix((cx + 11, 45), ['#.#'], {'#': 'Tas-3'})
    # fular
    d.ellipse('Gok', (cx, 54), (13.5, 3.2), name='fu', line=True, cast=1)
    for x in (-8, -3, 3, 8):
        d.capsule('Gok', (cx + x - .5, 51), (cx + x + .5, 54.5), 0.9, clip='fu', shift=1)
    d.capsule('Gok', (cx + 7, 55), (cx + 9, 62), (3.8, 3.0), part='esya', line=True, name='fuc')
    d.ellipse('Kar', (12.5, 53), (3.6, 5.4), rot=22, part='kol_1', line=True)
    d.ellipse('Kar', (51.5, 53), (3.6, 5.4), rot=-22, part='kol_2', line=True)
    pass  # burun kaldirildi (gozlerin ustunde kas gibi duruyordu)
    topu(d, cx, 30, 5.8)
    topu(d, cx, 21.5, 4.0)
    d.set_face(cx, 40, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
