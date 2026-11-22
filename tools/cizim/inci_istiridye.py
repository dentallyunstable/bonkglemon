# Inci Istiridye (Su, nadir). Tarif: TARIFLER.md. Iki kapakli kabuktan bakan utangac pembe yaratik; inci en degerli seyi.
# Renk: Tas (kabuk, govde), Pembe (yaratik, part='kafa': yuz burada), Kar (inci). Bebek aralik kabuk, genc yari acik + eller, usta tam acik yelpaze kapak.
PARLA = 'Kar'


def inci(d, x, y, r, part='govde'):
    d.circle('Kar', (x, y), r, line=True, part=part, name='inci%d%d' % (x, y), noshadow=True)
    d.pix((x - r + 1, y - r + 1), ['oo', 'o.'] if r >= 3 else ['oo'], {'o': 'Parilti'}, part=part)


def yelpaze(d, cx, cy, ad, n, r0, r1, ang0, ang1, part='govde', w=0.9):
    import math
    for i in range(n):
        a = math.radians(ang0 + (ang1 - ang0) * i / (n - 1))
        d.capsule('Tas', (cx + r0 * math.cos(a), cy + r0 * math.sin(a)), (cx + r1 * math.cos(a), cy + r1 * math.sin(a)), w, clip=ad, shift=1, part=part)


def lid(d, cx, cy, rx, ry, n, r):
    import math
    for i in range(n):
        a = math.radians(180 + 180 * (i + 0.5) / n)
        d.circle('Tas', (cx + (rx - r * 0.55) * math.cos(a), cy + (ry - r * 0.55) * math.sin(a)), r, join='ust')


def bebek(d):
    # ust kapak (arkada), kabarik yelpaze
    d.ellipse('Tas', (24, 28.5), (13.5, 8.5), name='ust', cast=1, lift=0.06)
    lid(d, 24, 28.5, 13.5, 8.5, 6, 2.6)
    d.ellipse('Tas', (17, 21), (4.2, 2.0), clip='ust', shift=-1, rot=-30)
    yelpaze(d, 24, 36, 'ust', 5, 10, 15, 220, 320)
    # pembe yaratik aralikta
    d.ellipse('Pembe', (24, 33.5), (10.5, 7), part='kafa', name='kafa', cast=1, lift=0.05)
    # alt kapak onde
    d.ellipse('Tas', (24, 41), (13.5, 6.2), name='alt', lift=-0.02)
    d.ellipse('Tas', (24, 38.8), (12, 2.0), clip='alt', shift=-2)
    for x in (14, 19, 29, 34):
        d.capsule('Tas', (x, 40), (x + (x - 24) * 0.25, 45), 0.9, clip='alt', shift=1)
    inci(d, 24, 39.5, 2.6)
    d.set_face(24, 30, gap=5)


def genc(d):
    d.ellipse('Tas', (28, 30), (17, 10), name='ust', cast=1, lift=0.06)
    lid(d, 28, 30, 17, 10, 7, 2.8)
    d.ellipse('Tas', (19, 22), (5, 2.2), clip='ust', shift=-1, rot=-30)
    yelpaze(d, 28, 38, 'ust', 7, 11, 18, 210, 330)
    d.ellipse('Pembe', (28, 38.5), (12.5, 9), part='kafa', name='kafa', cast=1, lift=0.05)
    d.ellipse('Tas', (28, 47.5), (16.5, 6.5), name='alt', lift=-0.02)
    d.ellipse('Tas', (28, 45.2), (14, 2.2), clip='alt', shift=-2)
    for x in (15, 20.5, 26, 31.5, 37, 42):
        d.capsule('Tas', (x, 46), (x + (x - 28) * 0.25, 52), 0.9, clip='alt', shift=1)
    # eller inciyi tutar (yuzun altinda)
    d.ellipse('Pembe', (22, 46), (3.4, 2.8), part='kol_1', line=True)
    d.ellipse('Pembe', (34, 46), (3.4, 2.8), part='kol_2', line=True)
    inci(d, 28, 46.5, 3.4, part='kol_1')
    d.set_face(28, 35, gap=5)


def usta(d):
    # ust kapak: arkada genis yelpaze
    d.ellipse('Tas', (32, 29), (21.5, 12), name='ust', cast=1, lift=0.06)
    lid(d, 32, 29, 21.5, 12, 8, 3.2)
    d.ellipse('Tas', (20, 22), (6, 2.4), clip='ust', shift=-1, rot=-25)
    yelpaze(d, 32, 40, 'ust', 9, 14, 23, 205, 335, w=1.1)
    d.ellipse('Pembe', (32, 41.5), (15, 11), part='kafa', name='kafa', cast=1, lift=0.05)
    # alt kapak
    d.ellipse('Tas', (32, 53.5), (21, 7.5), name='alt', lift=-0.02)
    d.ellipse('Tas', (32, 50.8), (17.5, 2.6), clip='alt', shift=-2)
    for x in (16, 21, 26.5, 32, 37.5, 43, 48):
        d.capsule('Tas', (x, 51.5), (x + (x - 32) * 0.22, 59), 1.0, clip='alt', shift=1)
    # kenarda kucuk inciler
    for x, y in ((14.5, 52), (49.5, 52), (20, 58), (44, 58)):
        inci(d, x, y, 2.2)
    # eller + buyuk inci
    d.ellipse('Pembe', (25, 51), (4, 3.2), part='kol_1', line=True)
    d.ellipse('Pembe', (39, 51), (4, 3.2), part='kol_2', line=True)
    inci(d, 32, 51.5, 4.6, part='kol_1')
    d.set_face(32, 38, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
