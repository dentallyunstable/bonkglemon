# Isilbocek (Orman, nadir). Tarif: TARIFLER.md. Komur tombul ates bocegi, arkasinda ampul gibi parlayan Sari fener.
# Renk: Komur (govde), Sari (isik), Cimen (kanat kabugu). Nadir: fenerde 2 piksel Parilti. Parlak: Sari -> Pembe.
PARLA = 'Sari'


def glint(d, x, y, part='kuyruk'):
    d.pix((x, y), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def plate(d, c, r):
    d.ellipse('Krem', c, r, name='levha')


def bebek(d):
    # fener: govdenin arkasindan sag altta bir yumru
    d.ellipse('Sari', (37, 42), (8, 8), part='kuyruk', name='fener', line=True, lift=0.12)
    d.ellipse('Sari', (37, 43), (4.5, 4.5), part='kuyruk', clip='fener', shift=-1)
    d.ellipse('Komur', (22, 35), (14, 12.5), name='kafa', lift=0.1, cast=1)
    plate(d, (22, 39), (9.5, 6.4))
    d.capsule('Komur', (20, 25), (18, 21), 1.5, part='tepe', line=True)
    d.capsule('Komur', (26, 25), (28, 21), 1.5, part='tepe', line=True)
    glint(d, 35, 38)
    d.set_face(22, 35, gap=5, ten='Krem')


def genc(d):
    # ampul biciminde fener (ince boyun + yuvarlak ampul), kanat kabuklari yanlarda
    d.ellipse('Sari', (43, 44), (8.5, 8.5), part='kuyruk', name='fener', line=True, lift=0.12)
    d.ellipse('Sari', (43, 45), (5, 5), part='kuyruk', clip='fener', shift=-1)
    d.rect('Komur', (38, 34, 42, 38), part='kuyruk', line=True)
    d.ellipse('Cimen', (14, 42), (6, 10), rot=15, part='kanat_1', name='k1', line=True, lift=-0.05)
    d.capsule('Cimen', (14, 34), (16, 47), 1, clip='k1', shift=1, part='kanat_1')
    d.ellipse('Komur', (27, 47), (12, 9), name='alt', lift=0.1)
    d.ellipse('Komur', (27, 36), (15, 14), name='kafa', lift=0.1, cast=2)
    plate(d, (27, 39), (10, 7))
    d.capsule('Komur', (24, 24), (21, 18), 1.6, part='tepe', line=True)
    d.capsule('Komur', (31, 24), (34, 18), 1.6, part='tepe', line=True)
    d.circle('Sari', (20.5, 17), 1.8, part='tepe', line=True)
    d.circle('Sari', (34.5, 17), 1.8, part='tepe', line=True)
    d.capsule('Komur', (18, 52), (16, 55), 3.0, part='kol_1', line=True, lift=0.1)
    d.capsule('Komur', (36, 52), (38, 55), 3.0, part='kol_2', line=True, lift=0.1)
    glint(d, 41, 39)
    d.set_face(27, 35, gap=5, ten='Krem')


def usta(d):
    # kanat kabuklari aralik, yanlara acilmis
    for sgn, part in ((-1, 'kanat_1'), (1, 'kanat_2')):
        n = 'k%d' % sgn
        d.ellipse('Cimen', (32 + sgn * 20, 44), (7, 14), rot=sgn * -22, part=part, name=n, line=True, lift=-0.05)
        d.capsule('Cimen', (32 + sgn * 18, 34), (32 + sgn * 22, 53), 1.1, clip=n, shift=1, part=part)
    # arkadaki buyuk fener ampulu + kabuklarin altindan sizan isik
    d.ellipse('Sari', (47, 51), (10, 10), part='kuyruk', name='fener', line=True, lift=0.12)
    d.ellipse('Sari', (47, 52), (6, 6), part='kuyruk', clip='fener', shift=-1)
    d.ellipse('Sari', (16, 51), (5, 8), part='kuyruk', name='sizi', line=True, lift=0.08)
    d.ellipse('Komur', (32, 49), (15, 10), name='alt', lift=0.1)
    d.ellipse('Komur', (32, 36), (17, 15.5), name='kafa', lift=0.1, cast=2)
    plate(d, (32, 40), (11.5, 8.5))
    d.capsule('Komur', (27, 24), (22, 15), 1.7, part='tepe', line=True)
    d.capsule('Komur', (37, 24), (42, 15), 1.7, part='tepe', line=True)
    d.circle('Sari', (21.5, 13.5), 2.9, part='tepe', line=True, lift=0.1)
    d.circle('Sari', (42.5, 13.5), 2.9, part='tepe', line=True, lift=0.1)
    d.pix((20, 12), ['oo'], {'o': 'Parilti'}, part='tepe')
    d.capsule('Komur', (21, 51), (18, 55), 3.6, part='kol_1', line=True, lift=0.1)
    d.capsule('Komur', (43, 51), (46, 55), 3.6, part='kol_2', line=True, lift=0.1)
    glint(d, 50, 46)
    d.set_face(32, 36, gap=6, ten='Krem')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
