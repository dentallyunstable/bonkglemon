# Kivilcim Yarasasi (Ates, siradan, ucar). Tarif: TARIFLER.md. Komur renkli yuvarlak yarasa; kanatlari alev dili gibi, basinda alev percemi.
# Renk: Komur (govde), Turuncu (kanat alevi), Sari (percem, kulak ucu). Parlak: Turuncu -> Gok.
PARLA = 'Sari'

TON = {'#': 'Turuncu-3', 'o': 'Sari-1', 'p': 'Parilti', 'a': 'Turuncu-1'}
P_KUCUK = ['.#.', '#o#', '#o#', '#p#', '.#.']
P_ORTA = ['..#..', '.#o#.', '.#oo#', '#oop#', '#oop#', '.###.']
P_BUYUK = ['...#...', '..#o#..', '..#oo#.', '.#ooo#.', '.#oopo#', '#ooppo#', '#oppoo#', '#oooo#.', '.####..']


def tuft(d, x, y, b):
    d.pix((x, y), b, TON, part='tepe')


def tongue(d, cx, side, a, b, w, fam, name, first=False, clip=None):
    """Alev dili: a (kok) -> b (uc). Sol icin verilir, side=2 aynalanir."""
    m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
    kw = dict(part='kanat_%d' % side)
    if clip:
        kw.update(clip=clip, shift=-1)
    elif first:
        kw.update(name=name, line=True)
    else:
        kw.update(join=name)
    d.capsule(fam, m(a), m(b), w, **kw)


def kulaklar(d, cx, y, dx, w, ic):
    """Sivri olmayan yarasa kulagi: tabandan uca daralan kapsul, ucu parlak."""
    for s in (1, 2):
        k = -1 if s == 1 else 1
        bx, tx = cx + k * (dx - 0.5), cx + k * (dx + 1)
        d.capsule('Komur', (bx, y + 3), (tx, y - 6), w, part='kulak_%d' % s, line=True, name='ku%d' % s)
        d.circle(ic, (tx, y - 5.4), 1.7, part='kulak_%d' % s, clip='ku%d' % s, tone=1)


def bebek(d):
    d.flyer = True
    cx = 24
    for s in (1, 2):
        nm = 'w%d' % s
        tongue(d, cx, s, (16, 36), (4, 22), (7.0, 2.4), 'Komur', nm, first=True)
        tongue(d, cx, s, (16, 38), (3, 34), (7.0, 2.6), 'Komur', nm)
        tongue(d, cx, s, (16, 34), (10, 18), (5.6, 2.2), 'Komur', nm)
        tongue(d, cx, s, (7, 26), (4, 22), 3.0, 'Turuncu', nm, clip=nm)
        tongue(d, cx, s, (7, 35), (3, 34), 3.0, 'Turuncu', nm, clip=nm)
        tongue(d, cx, s, (11, 22), (10, 18), 2.6, 'Turuncu', nm, clip=nm)
    kulaklar(d, cx, 25, 7.5, (6.0, 3.0), 'Turuncu')
    d.ellipse('Komur', (24, 34), (13, 13), name='g', lift=0.05, cast=1)
    tuft(d, 22, 17, P_KUCUK)
    d.ellipse('Komur', (24, 35.5), (9, 6), clip='g', shift=-1)
    d.set_face(24, 33, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    for s in (1, 2):
        nm = 'w%d' % s
        tongue(d, cx, s, (17, 38), (4, 21), (8.0, 2.6), 'Komur', nm, first=True)
        tongue(d, cx, s, (17, 41), (3, 34), (8.0, 2.8), 'Komur', nm)
        tongue(d, cx, s, (16, 35), (10, 13), (6.4, 2.4), 'Komur', nm)
        tongue(d, cx, s, (9, 27), (4, 21), 3.4, 'Turuncu', nm, clip=nm)
        tongue(d, cx, s, (8, 37), (3, 34), 3.4, 'Turuncu', nm, clip=nm)
        tongue(d, cx, s, (12, 20), (10, 13), 3.0, 'Turuncu', nm, clip=nm)
    kulaklar(d, cx, 26, 9, (7.0, 3.4), 'Sari')
    d.ellipse('Komur', (28, 37), (15, 15), name='g', lift=0.05, cast=1)
    tuft(d, 25, 16, P_ORTA)
    d.ellipse('Komur', (28, 39), (10, 6.5), clip='g', shift=-1)
    d.set_face(28, 36, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    for s in (1, 2):
        nm = 'w%d' % s
        tongue(d, cx, s, (18, 42), (3, 24), (10.0, 3.0), 'Turuncu', nm, first=True)
        tongue(d, cx, s, (18, 46), (2, 40), (9.0, 3.0), 'Turuncu', nm)
        tongue(d, cx, s, (17, 38), (10, 12), (8.0, 2.8), 'Turuncu', nm)
        tongue(d, cx, s, (17, 42), (6, 28), 4.4, 'Sari', nm, clip=nm)
        tongue(d, cx, s, (17, 46), (5, 41), 4.0, 'Sari', nm, clip=nm)
        tongue(d, cx, s, (16, 36), (11, 17), 3.6, 'Sari', nm, clip=nm)
    kulaklar(d, cx, 27, 11, (8.4, 3.8), 'Sari')
    d.ellipse('Komur', (32, 43), (19.5, 20), name='g', lift=0.05, cast=1)
    tuft(d, 28, 14, P_BUYUK)
    d.ellipse('Komur', (32, 44), (12, 8), clip='g', shift=-1)
    d.set_face(32, 41, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
