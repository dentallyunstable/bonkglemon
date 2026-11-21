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
