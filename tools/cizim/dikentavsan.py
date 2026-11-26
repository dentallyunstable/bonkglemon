# Dikentavsan (Orman, siradan). Tarif: TARIFLER.md
# Krem tuy topu tavsan, Cimen dikenli kestane kabugunun icinden cikar; kabuk once ev, sonra kapuson, sonra yele. Kahve kestane.
PARLA = 'Kahve'


def spikes(d, xs, y, base, r=1.6, name='kabuk'):
    for x in xs:
        d.circle('Cimen', (x, y), r, join=name)


def bebek(d):
    # kulaklar kabuktan disari cikar
    d.capsule('Krem', (19.5, 26), (16, 12), (3.4, 2.4), part='kulak_1', line=True)
    d.capsule('Krem', (28.5, 26), (32, 12), (3.4, 2.4), part='kulak_2', line=True)
        # kabugun arka yari
    d.ellipse('Cimen', (24, 39), (13, 8), name='arka', lift=-0.12)
    for x in (13, 17, 21, 27, 31, 35):
        d.capsule('Cimen', (x, 35), (x + (x - 24) * 0.22, 30), (2.4, 1.1), join='arka')
    # tuy topu
    d.ellipse('Krem', (24, 33), (10.5, 9.3), name='kafa', lift=0.04, cast=1)
    # on kabuk: kasenin on yarisi
    d.ellipse('Cimen', (24, 43.5), (13, 5.2), name='kabuk', cast=1)
    for x in (12.5, 16.5, 20.5, 27.5, 31.5, 35.5):
        d.capsule('Cimen', (x, 41), (x + (x - 24) * 0.2, 37), (2.4, 1.1), join='kabuk')
    d.ellipse('Kahve', (25, 44), (3.6, 2.6), clip='kabuk', shift=0)
    for x in (15, 22, 29, 35):
        d.capsule('Cimen', (x, 45), (x, 47), 1.2, clip='kabuk', shift=1)
    d.set_face(24, 31, gap=5)


def genc(d):
    # kapuson: sirtta kabuk, yaprak ucu kulaklar
    d.ellipse('Cimen', (28, 38), (16.5, 13), name='kabuk', lift=-0.1)
    for a in range(0, 8):
        x = 15 + a * 3.6
        d.capsule('Cimen', (x, 30 + abs(a - 3.5) * 2.2), (x + (x - 28) * 0.3, 23 + abs(a - 3.5) * 2.2), (2.6, 1.1), join='kabuk')
    d.capsule('Cimen', (43.5, 38), (46, 38.5), (2.6, 1.1), join='kabuk')
    d.capsule('Cimen', (42.5, 46), (45, 47.5), (2.6, 1.1), join='kabuk')
    d.capsule('Krem', (22, 25), (18.5, 12), (3.6, 2.6), part='kulak_1', line=True)
    d.capsule('Krem', (33, 25), (36.5, 12), (3.6, 2.6), part='kulak_2', line=True)
    d.ellipse('Cimen', (18.5, 11.5), (2.0, 3.0), rot=-15, part='kulak_1', line=True)
    d.ellipse('Cimen', (36.5, 11.5), (2.0, 3.0), rot=15, part='kulak_2', line=True)
    # govde ve ayaklar
    d.ellipse('Krem', (28, 44), (9.5, 6.5), name='govde')
    d.ellipse('Krem', (23, 33), (11.5, 10), name='kafa', lift=0.04, cast=2)
    d.capsule('Krem', (22, 48), (20.5, 51), 3.2, part='kol_1', line=True)
    d.capsule('Krem', (34, 48), (36, 51), 3.2, part='kol_2', line=True)
    d.capsule('Krem', (22, 44), (20, 47), 3.0, part='kol_1', line=True)
    d.capsule('Krem', (34, 44), (36, 47), 3.0, part='kol_2', line=True)
    d.set_face(23, 30, gap=5)


def usta(d):
    # sirtta ve boyunda dikenli yele
    d.ellipse('Cimen', (32, 40), (20, 19), name='yele', lift=-0.1)
    for a in range(0, 12):
        t = a / 11.0
        x = 14.5 + t * 35
        yy = 22 + abs(t - 0.5) * 16
        d.capsule('Cimen', (x, yy + 3), (x + (x - 32) * 0.22, yy - 4), (3.2, 1.2), join='yele')
    # kulaklar
    d.capsule('Krem', (26, 24), (22, 6), (4.2, 3.0), part='kulak_1', line=True)
    d.capsule('Krem', (39, 24), (43, 6), (4.2, 3.0), part='kulak_2', line=True)
    d.ellipse('Cimen', (22, 6.5), (2.2, 3.6), rot=-12, part='kulak_1', line=True)
    d.ellipse('Cimen', (43, 6.5), (2.2, 3.6), rot=12, part='kulak_2', line=True)
    # govde
    d.ellipse('Krem', (32, 49), (12.5, 9.5), name='govde')
    d.ellipse('Krem', (32, 32.5), (13.5, 12.5), name='kafa', lift=0.04, cast=2)
    d.capsule('Krem', (23, 52), (20.5, 57), 4.2, part='kol_1', line=True)
    d.capsule('Krem', (41, 52), (43.5, 57), 4.2, part='kol_2', line=True)
    # parlak kestane kuyruk
    d.ellipse('Kahve', (46.5, 53), (4.6, 4.2), name='kuyruk', part='kuyruk', line=True)
    d.ellipse('Kahve', (46.5, 49.2), (3.0, 1.6), part='kuyruk', clip='kuyruk', shift=1)
    d.pix((44, 51), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    # kulakta beyaz cicek
    for c in ((40.5, 11), (45.5, 11), (43, 8.2), (43, 13.8)):
        d.circle('Kar', c, 1.6, part='kulak_2', line=True)
    d.circle('Sari', (43, 11), 1.2, part='kulak_2')
    d.set_face(32, 31, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def kulak_d(d, x, y, h, back, w, part, name, lift=0.0, leaf=False):
    d.capsule('Krem', (x, y), (x + back, y - h), w, part=part, line=True, name=name, lift=lift)
    if leaf:
        d.ellipse('Cimen', (x + back + 0.5, y - h + 0.5), (2.2, 3.2), rot=15, part=part, line=True, lift=lift)


def bebek_yan(d):
    kulak_d(d, 29, 27, 14, 6, (3.4, 2.4), 'kulak_2', 'e2', lift=-0.12)
    d.capsule('Krem', (30, 45), (31, 48), 3.0, part='kol_2', line=True)
    d.ellipse('Cimen', (29, 39), (11, 8), name='arka', lift=-0.12)
    for x in (22, 26, 30, 34):
        d.capsule('Cimen', (x, 35), (x + 2 + (x - 28) * 0.15, 30), (2.4, 1.1), join='arka')
    d.ellipse('Krem', (22, 33), (10.5, 9.3), name='kafa', lift=0.04, cast=1)
    d.ellipse('Krem', (13, 35.5), (3.4, 2.6), join='kafa')
    d.pix2((5, 17), ['#'], {'#': 'Komur-4'})
    kulak_d(d, 21, 27, 15, 4, (3.6, 2.6), 'kulak_1', 'e1')
    d.ellipse('Cimen', (23, 43.5), (12, 5.2), name='kabuk', cast=1)
    for x in (14, 18, 22, 27, 31):
        d.capsule('Cimen', (x, 41), (x + (x - 22) * 0.2, 37), (2.4, 1.1), join='kabuk')
    d.ellipse('Kahve', (21, 44), (3.6, 2.6), clip='kabuk', shift=0)
    d.capsule('Krem', (18, 46), (17, 49), 3.0, part='kol_1', line=True)
    d.set_face_side(14, 30)


def genc_yan(d):
    kulak_d(d, 33, 30, 17, 7, (3.8, 2.8), 'kulak_2', 'e2', lift=-0.12, leaf=True)
    d.capsule('Krem', (34, 50), (36, 54), 3.2, part='kol_2', line=True)
    d.ellipse('Cimen', (35, 39), (12, 13), name='kabuk', lift=-0.1)
    for a in range(0, 6):
        y = 29 + a * 4.2
        d.capsule('Cimen', (35 + 6, y), (46 + (y - 39) * 0.1, y - 1.5), (2.6, 1.1), join='kabuk')
    for x in (30, 35, 40):
        d.capsule('Cimen', (x, 31), (x + 1, 26), (2.6, 1.1), join='kabuk')
    d.ellipse('Krem', (28, 45), (10.5, 6.8), name='govde')
    d.ellipse('Krem', (23, 34), (11.5, 10), name='kafa', lift=0.04, cast=2)
    d.ellipse('Krem', (13, 37), (3.6, 2.8), join='kafa')
    d.pix2((5, 18), ['#'], {'#': 'Komur-4'})
    kulak_d(d, 24, 28, 18, 5, (3.8, 2.8), 'kulak_1', 'e1', leaf=True)
    d.capsule('Krem', (22, 49), (20.5, 53), 3.2, part='kol_1', line=True)
    d.set_face_side(15, 31)


def usta_yan(d):
    kulak_d(d, 38, 30, 21, 8, (4.2, 3.0), 'kulak_2', 'e2', lift=-0.12, leaf=True)
    d.capsule('Krem', (41, 55), (43, 60), 4.0, part='kol_2', line=True)
    d.ellipse('Kahve', (53, 53), (4.4, 4.2), name='kuyruk', part='kuyruk', line=True)
    d.ellipse('Kahve', (53, 50), (2.8, 1.6), part='kuyruk', clip='kuyruk', shift=1)
    d.pix((51, 51), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    d.ellipse('Cimen', (40, 40), (14, 18), name='yele', lift=-0.1)
    for a in range(0, 8):
        y = 25 + a * 3.6
        d.capsule('Cimen', (47, y), (54, y - 2), (3.0, 1.2), join='yele')
    for x in (33, 39, 45):
        d.capsule('Cimen', (x, 27), (x + 2, 21), (3.0, 1.2), join='yele')
    d.ellipse('Krem', (35, 49), (13, 9.5), name='govde')
    d.ellipse('Krem', (27, 34), (13.5, 12.5), name='kafa', lift=0.04, cast=2)
    d.ellipse('Krem', (15, 37.5), (4.2, 3.2), join='kafa')
    d.pix2((6, 18), ['#'], {'#': 'Komur-4'})
    kulak_d(d, 28, 28, 22, 6, (4.4, 3.2), 'kulak_1', 'e1', leaf=True)
    for c in ((43.5, 11), (48.5, 11), (46, 8.4), (46, 13.6)):
        d.circle('Kar', c, 1.5, part='kulak_2', line=True)
    d.circle('Sari', (46, 11), 1.1, part='kulak_2')
    d.capsule('Krem', (27, 53), (25.5, 58), 4.0, part='kol_1', line=True)
    d.set_face_side(17, 30)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
