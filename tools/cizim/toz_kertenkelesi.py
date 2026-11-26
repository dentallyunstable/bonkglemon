# Toz Kertenkelesi (Kum, siradan). Tarif: TARIFLER.md. Oturan tombul kertenkele; boynundaki yaka bebekte mama onlugu, gencte yari acik, ustada koca gunes.
# Renk: Sari (govde), Turuncu (yaka), Cam (benek, halka desen). Parlak: Sari -> Pembe.
import math
PARLA = 'Turuncu'


def dis(d, cx, cy, r, a0, a1, n, rr, part, name):
    """yaka kenarinda disler: a0..a1 derece arasinda n kucuk daire."""
    for k in range(n):
        a = math.radians(a0 + (a1 - a0) * k / max(1, n - 1))
        d.circle('Turuncu', (cx + math.cos(a) * r, cy + math.sin(a) * r), rr, part=part, join=name)


def bebek(d):
    # kuyruk onde kivrik
    d.curve('Sari', [(36, 49), (41, 50), (41, 45), (37, 44.5)], (4.2, 2.6), part='kuyruk', line=True)
    d.ellipse('Sari', (24, 35.5), (13.8, 10.6), name='kafa', cast=1)
    d.ellipse('Sari', (24, 43), (11.5, 8.5), name='karin', join='kafa')
    d.circle('Sari', (14.5, 48.5), 3.4, part='kol_1', line=True)
    d.circle('Sari', (33.5, 48.5), 3.4, part='kol_2', line=True)
    # mama onlugu gibi kucuk yaka (yuzun altinda)
    d.ellipse('Turuncu', (24, 41.5), (10.5, 5.6), name='onluk', line=True, cast=1, inbox=(0, 40, 47, 50), lift=0.05)
    dis(d, 24, 41.5, 10, 10, 170, 6, 1.9, 'govde', 'onluk')
    for x in (21, 24, 27):
        d.pix((x, 43), ['#'], {'#': 'Turuncu-4'}, part='govde') if False else None
    d.pix((19, 44), ['##'], {'#': 'Turuncu-2'}, part='govde')
    d.pix((26, 44), ['##'], {'#': 'Turuncu-2'}, part='govde')
    # tepede kucuk sirt dikeni
    d.pix((22, 23), ['##'], {'#': 'Turuncu-2'}, part='tepe')
    d.set_face(24, 31, gap=5)


def genc(d):
    cx = 28
    # yari acik, disli yaka: kafanin arkasinda yelpaze
    d.ellipse('Turuncu', (28, 34), (19, 14.5), name='yaka', part='tepe', line=True, inbox=(0, 0, 55, 40), lift=-0.05)
    dis(d, 28, 34, 18.2, 180, 360, 9, 2.4, 'tepe', 'yaka')
    d.ellipse('Turuncu', (28, 30), (11.5, 8.5), part='tepe', clip='yaka', shift=1, inbox=(0, 0, 55, 36))
    for a in (205, 232, 258, 284, 310, 335):
        r = math.radians(a)
        d.capsule('Turuncu', (28 + math.cos(r) * 10, 34 + math.sin(r) * 7), (28 + math.cos(r) * 16, 34 + math.sin(r) * 12.5), 1.1, part='tepe', clip='yaka', shift=-1)
    d.curve('Sari', [(40, 55), (46, 55), (46, 49), (41, 48.5)], (4.6, 3.0), part='kuyruk', line=True)
    d.ellipse('Sari', (28, 46), (14.5, 11), name='govde', cast=1)
    d.ellipse('Sari', (28, 37), (14, 11.5), name='kafa', join='govde')
    d.ellipse('Krem', (28, 50.5), (8.5, 5.4), part='govde', clip='govde', shift=-1, inbox=(0, 46, 55, 60))
    # sirtta benek sirasi (govdenin iki yaninda ve tepede)
    for x, y in ((19, 29), (24, 27.2), (32, 27.2), (37, 29), (16.5, 46), (39.5, 46)):
        d.circle('Cam', (x, y), 1.5, part='govde', clip='govde', shift=0)
    d.circle('Sari', (17, 56), 3.6, part='kol_1', line=True)
    d.circle('Sari', (39, 56), 3.6, part='kol_2', line=True)
    d.ellipse('Sari', (21, 58), (5, 2.8), part='govde', line=True)
    d.ellipse('Sari', (35, 58), (5, 2.8), part='govde', line=True)
    d.set_face(28, 34, gap=5)


def usta(d):
    cx = 32
    fx, fy = 32, 30
    # tam acik gunes yaka
    d.circle('Turuncu', (fx, fy), 22.5, name='yaka', part='tepe', line=True, lift=-0.05)
    dis(d, fx, fy, 22, 0, 360, 22, 2.6, 'tepe', 'yaka')
    d.circle('Cam', (fx, fy), 18.5, part='tepe', clip='yaka', shift=0)
    d.circle('Turuncu', (fx, fy), 16.2, part='tepe', clip='yaka', shift=0)
    d.circle('Cam', (fx, fy), 12.5, part='tepe', clip='yaka', shift=0)
    d.circle('Turuncu', (fx, fy), 10.4, part='tepe', clip='yaka', shift=0)
    d.curve('Sari', [(46, 62), (53, 62), (53, 54), (47, 53)], (5.2, 3.4), part='kuyruk', line=True)
    d.ellipse('Sari', (32, 48.5), (17, 14), name='govde', cast=1)
    d.ellipse('Sari', (32, 34.5), (15.5, 14.5), name='kafa', join='govde')
    d.ellipse('Krem', (32, 54.5), (10, 6.5), part='govde', clip='govde', shift=-1, inbox=(0, 50, 63, 63))
    for x, y in ((17.5, 43), (46.5, 43), (16.5, 50), (47.5, 50), (18.5, 56.5), (45.5, 56.5)):
        d.circle('Cam', (x, y), 1.8, part='govde', clip='govde', shift=0)
    d.circle('Sari', (16.5, 56.5), 4.0, part='kol_1', line=True)
    d.circle('Sari', (47.5, 56.5), 4.0, part='kol_2', line=True)
    d.ellipse('Sari', (22.5, 60), (5.6, 3.2), part='govde', line=True)
    d.ellipse('Sari', (41.5, 60), (5.6, 3.2), part='govde', line=True)
    d.set_face(32, 33, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def bebek_yan(d):
    d.curve('Sari', [(34, 47), (41, 49), (42, 43), (38, 41.5)], (4.2, 2.6), part='kuyruk', line=True)
    d.circle('Sari', (33, 48.5), 3.4, part='kol_2', line=True, lift=-0.15)
    d.ellipse('Sari', (24, 35.5), (13.8, 10.6), name='kafa', cast=1)
    d.ellipse('Sari', (26, 43), (11.5, 8.5), name='karin', join='kafa')
    d.circle('Sari', (20, 48), 3.4, part='kol_1', line=True)
    # kucuk onluk: yuzun altinda, onde
    d.ellipse('Turuncu', (15, 41.5), (6, 4.2), name='onluk', line=True, cast=1, lift=0.05)
    for x in (11.5, 15, 18.5):
        d.circle('Turuncu', (x, 44.6), 1.9, join='onluk')
    d.pix((29, 22), ['##', '##'], {'#': 'Turuncu-2'}, part='tepe')
    d.pix((33, 24), ['##', '##'], {'#': 'Turuncu-2'}, part='tepe')
    d.set_face_side(12, 31)


def genc_yan(d):
    # yari acik yaka: kafanin arkasinda (sagda) dislli yelpaze
    d.ellipse('Turuncu', (40, 35), (12.5, 15.5), name='yaka', part='tepe', line=True, lift=-0.05)
    dis(d, 40, 35, 13, -100, 100, 7, 2.3, 'tepe', 'yaka')
    d.ellipse('Turuncu', (38, 35), (6.5, 10), part='tepe', clip='yaka', shift=1)
    for a in (-60, -25, 10, 45):
        r = math.radians(a)
        d.capsule('Turuncu', (40 + math.cos(r) * 4, 35 + math.sin(r) * 6), (40 + math.cos(r) * 10, 35 + math.sin(r) * 12), 1.1, part='tepe', clip='yaka', shift=-1)
    d.curve('Sari', [(40, 55), (47, 55), (47, 49), (43, 48.5)], (4.6, 3.0), part='kuyruk', line=True)
    d.circle('Sari', (37, 57.5), 3.6, part='kol_2', line=True, lift=-0.15)
    d.ellipse('Sari', (29, 46), (14.5, 11), name='govde', cast=1)
    d.ellipse('Sari', (25, 37), (14, 11.5), name='kafa', join='govde')
    d.ellipse('Krem', (25, 51), (8.5, 4.6), part='govde', clip='govde', shift=-1, inbox=(0, 47, 55, 60))
    for x, y in ((30, 32.5), (36, 35), (40, 40), (42, 46)):
        d.circle('Cam', (x, y), 1.5, part='govde', clip='govde', shift=0)
    d.circle('Sari', (22, 57.5), 3.6, part='kol_1', line=True)
    d.set_face_side(15, 34)


def usta_yan(d):
    fx, fy = 43, 31
    # tam acik gunes yaka: kafanin arkasinda
    d.circle('Turuncu', (fx, fy), 19, name='yaka', part='tepe', line=True, lift=-0.05)
    dis(d, fx, fy, 18.6, 0, 360, 19, 2.4, 'tepe', 'yaka')
    d.circle('Cam', (fx, fy), 15.4, part='tepe', clip='yaka', shift=0)
    d.circle('Turuncu', (fx, fy), 13.2, part='tepe', clip='yaka', shift=0)
    d.circle('Cam', (fx, fy), 10, part='tepe', clip='yaka', shift=0)
    d.circle('Turuncu', (fx, fy), 8, part='tepe', clip='yaka', shift=0)
    d.curve('Sari', [(46, 62), (54, 62), (54, 54), (49, 53)], (5.2, 3.4), part='kuyruk', line=True)
    d.circle('Sari', (42, 59.5), 4.0, part='kol_2', line=True, lift=-0.15)
    d.ellipse('Sari', (33, 48.5), (17, 14), name='govde', cast=1)
    d.ellipse('Sari', (27, 35.5), (15.5, 14.5), name='kafa', join='govde')
    d.ellipse('Krem', (27, 55), (10, 6), part='govde', clip='govde', shift=-1, inbox=(0, 51, 63, 63))
    for x, y in ((38, 29), (42, 33), (44, 39), (45, 46), (44, 53)):
        d.circle('Cam', (x, y), 1.8, part='govde', clip='govde', shift=0)
    d.circle('Sari', (24, 59.5), 4.0, part='kol_1', line=True)
    d.set_face_side(17, 33)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
