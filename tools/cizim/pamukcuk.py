# Pamukcuk (Orman, siradan). Tarif: TARIFLER.md
# Kuzu gibi Kar pamuk topu; Kahve koza kabugu once besik, sonra boynuz, sonra yaka. Cimen yaprak kucuk vurgu.
# Pamuk kenari kabarik (join ile tumsekli), yuz duz Kar uzerinde.
PARLA = 'Kar'


def puff(d, cx, cy, rx, ry, n, name, extra=1.0, rr=2.6, seed=0):
    """Kabarik pamuk: elips + kenarinda n tumsek (join)."""
    import math
    d.ellipse('Kar', (cx, cy), (rx, ry), name=name, lift=0.12, cast=1)
    for i in range(n):
        a = 2 * math.pi * (i + 0.5 * seed) / n
        x = cx + math.cos(a) * rx * 0.98
        y = cy + math.sin(a) * ry * 0.95
        if y > cy + ry * 0.6:
            continue
        d.circle('Kar', (x, y), rr, join=name)


def husk_petal(d, a, b, w=(4.0, 2.0), **kw):
    d.capsule('Kahve', a, b, w, line=True, **kw)


def bebek(d):
    # besik: arkada iki-uc koza yaprak, onde kase
    husk_petal(d, (15, 38), (12.5, 31), (4.4, 2.2))
    husk_petal(d, (33, 38), (35.5, 31), (4.4, 2.2))
    husk_petal(d, (24, 36), (24, 29), (5, 2.4))
    puff(d, 24, 33.5, 10.5, 10, 11, 'kafa', rr=2.5)
    d.ellipse('Kahve', (24, 43.5), (13, 5.4), name='kase', cast=1, lift=0.0)
    for x in (13, 18, 30, 35):
        d.capsule('Kahve', (x, 41), (x + (x - 24) * 0.12, 38.5), (3.0, 1.4), join='kase')
    d.capsule('Kahve', (15, 45.5), (33, 45.5), 1.0, clip='kase', shift=1)
    # minik yaprak kasenin kenarinda
    d.ellipse('Cimen', (34.5, 41), (2.0, 3.2), rot=40, name='yap', line=True, noshadow=True)
    d.set_face(24, 31, gap=5)


def genc(d):
    # boynuz gibi iki koza parcasi (tepe)
    d.capsule('Kahve', (19, 26), (15, 15), (4.2, 2.2), part='tepe', line=True)
    d.capsule('Kahve', (38, 26), (42, 15), (4.2, 2.2), part='tepe', line=True)
    # arka bacaklar
    d.capsule('Kar', (21, 50), (20, 54), 3.4, part='kol_1', line=True, lift=0.05)
    d.capsule('Kar', (35, 50), (36, 54), 3.4, part='kol_2', line=True, lift=0.05)
    puff(d, 28, 41, 14, 10, 12, 'govde', rr=3.0, seed=1)
    puff(d, 28, 32.5, 13, 11.5, 12, 'kafa', rr=3.0)
    d.capsule('Kar', (15, 44), (12.5, 48), 3.4, part='kol_1', line=True)
    d.capsule('Kar', (41, 44), (43.5, 48), 3.4, part='kol_2', line=True)
    d.capsule('Kar', (22, 49), (21.5, 52), 3.4, part='govde', line=True)
    d.capsule('Kar', (34, 49), (34.5, 52), 3.4, part='govde', line=True)
    # yaprak: boynuz diplerinde
    d.ellipse('Cimen', (28, 21), (2.0, 3.2), rot=0, part='tepe', line=True, name='yap')
    d.set_face(28, 30, gap=5)


def usta(d):
    puff(d, 32, 45, 19, 13, 14, 'bulut', rr=3.6, seed=1)
    puff(d, 32, 32, 16.5, 14, 14, 'kafa', rr=3.4)
    d.capsule('Kar', (19.5, 55), (18.5, 58.5), 4.0, part='kol_1', line=True, lift=0.1)
    d.capsule('Kar', (44.5, 55), (45.5, 58.5), 4.0, part='kol_2', line=True, lift=0.1)
    d.capsule('Kar', (14, 46), (10, 52), 4.2, part='kol_1', line=True, lift=0.1)
    d.capsule('Kar', (50, 46), (54, 52), 4.2, part='kol_2', line=True, lift=0.1)
    # koza yakasi: boynun etrafinda sarkan kahve yapraklar
    d.ellipse('Kahve', (32, 47.5), (15.5, 3.4), name='yaka', line=True, cast=1)
    for x, tx in ((18.5, 17), (23.5, 22.5), (28.5, 28), (35.5, 36), (40.5, 41.5), (45.5, 47)):
        d.capsule('Kahve', (x, 48), (tx, 52.5), (4.6, 2.4), join='yaka')
    for x in (21, 26, 32, 38, 43):
        d.capsule('Kahve', (x, 46), (x, 50), 0.9, clip='yaka', shift=1)
    # tepede acik pamuk cicegi: kahve cal, beyaz pamuk
    d.capsule('Cimen', (32, 22), (32, 18), 1.6, part='tepe', line=True)
    for ang in (-90, -18, 54, 126, 198):
        import math
        a = math.radians(ang)
        d.capsule('Kahve', (32, 13), (32 + math.cos(a) * 8.5, 13 + math.sin(a) * 8.5), (4.6, 2.4), part='tepe', line=True)
    d.circle('Kar', (32, 13), 4.8, part='tepe', line=True, lift=0.15)
    d.ellipse('Cimen', (21, 27), (2.0, 3.6), rot=-55, part='tepe', line=True)
    d.ellipse('Cimen', (43, 27), (2.0, 3.6), rot=55, part='tepe', line=True)
    d.set_face(32, 32, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
