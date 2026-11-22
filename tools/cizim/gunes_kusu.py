# Gunes Kusu (Kum, efsanevi, ucar). Tarif: TARIFLER.md. Kuyruk tuyleri gunes isinlari gibi acilan tombul altin kus.
# Kuyruk bebekte 3 kisa isin, gencte yarim daire yelpaze, ustada govdenin arkasinda tam gunes. Kanat uclari Turuncu.
# Ustada 3 tuylu tepelik, ayakta altin halka, gogusde Cam (turkuaz) tas. Gaga yuz kutusunun disinda (alt).
# Renk: Sari (tuy, altin), Turuncu (isin, gaga, kanat ucu), Cam (tas). Parlak: Turuncu -> Pembe.
import math
PARLA = 'Turuncu'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def isinlar(d, c, r0, r1, angles, w=(4.0, 3.0), pre='r', low=0.0):
    """c merkezden disa dogru isin tuyleri; aci 0 = yukari, saat yonu. Sari/Turuncu sirali."""
    for i, a in enumerate(angles):
        t = math.radians(a)
        s, co = math.sin(t), -math.cos(t)
        fam = 'Sari' if i % 2 == 0 else 'Turuncu'
        r1_ = r1 - low * max(0.0, -co)
        d.capsule(fam, (c[0] + r0 * s, c[1] + r0 * co), (c[0] + r1_ * s, c[1] + r1_ * co), w,
                  part='kuyruk', name='%s%d' % (pre, i), line=True, lift=-0.12 if fam == 'Sari' else -0.02)


def gaga(d, cx, y, w=2.6, h=1.6):
    d.ellipse('Turuncu', (cx, y), (w, h), line=True, noshadow=True, lift=0.1)


def bacak(d, cx, y, dx, ring=True):
    for s, part in ((-1, 'kol_1'), (1, 'kol_2')):
        x = cx + s * dx
        d.capsule('Turuncu', (x, y), (x, y + 3.6), 2.8, part=part, line=True, noshadow=True)
        d.ellipse('Turuncu', (x + s * -0.5, y + 4.4), (2.8, 1.4), part=part, line=True, noshadow=True)
        if ring:
            d.capsule('Sari', (x - 1.6, y + 1.6), (x + 1.6, y + 1.6), 1.5, part=part, line=True, noshadow=True, lift=0.3)


def kanat(d, W, cx, tip, tipc, w=3.0):
    d.poly('Sari', W, part='kanat_1', line=True, name='w1', lift=-0.06)
    d.poly('Sari', mir(W, cx), part='kanat_2', line=True, name='w2', lift=-0.06)
    d.ellipse('Turuncu', tipc, tip, rot=-25, clip='w1', tone=2, part='kanat_1')
    d.ellipse('Turuncu', (2 * cx - tipc[0], tipc[1]), tip, rot=25, clip='w2', tone=2, part='kanat_2')


def bebek(d):
    d.flyer = True
    cx = 24
    isinlar(d, (cx, 33), 8, 17.5, (-36, 0, 36), w=(3.8, 3.0))
    W = [(13, 35), (8, 27), (5, 28), (4, 34), (8, 38), (12, 39)]
    kanat(d, W, cx, (3.4, 3.0), (6, 28.5))
    d.ellipse('Sari', (cx, 33.5), (13.2, 11.8), name='govde', cast=1, lift=0.05)
    d.ellipse('Sari', (cx, 40), (8, 4.5), clip='govde', shift=-1)
    gaga(d, cx, 38.6, 2.3, 1.5)
    bacak(d, cx, 43.5, 5, ring=False)
    d.set_face(cx, 30, gap=5, mouth=False)


def genc(d):
    d.flyer = True
    cx = 28
    # yarim daire yelpaze
    isinlar(d, (cx, 35), 9, 21.5, (-80, -60, -40, -20, 0, 20, 40, 60, 80), w=(4.0, 3.2))
    W = [(15, 37), (9, 28), (5, 29), (3, 35), (6, 40), (13, 42)]
    kanat(d, W, cx, (4.0, 3.4), (6, 30))
    d.ellipse('Sari', (cx, 35.5), (16, 13.8), name='govde', cast=1, lift=0.05)
    d.ellipse('Sari', (cx, 43), (10, 5.5), clip='govde', shift=-1)
    gaga(d, cx, 41, 2.8, 1.8)
    bacak(d, cx, 47, 6.5, ring=False)
    d.set_face(cx, 32, gap=5, mouth=False)


def usta(d):
    d.flyer = True
    cx = 32
    # tam gunes: govdenin arkasinda 16 isin
    isinlar(d, (cx, 37), 13, 29.5, [i * 22.5 for i in range(16) if i not in (0, 15, 8, 6, 7, 9, 10)], w=(5.0, 3.6), pre='g', low=7)
    W = [(18, 41), (12, 31), (8, 31), (6, 37), (8, 43), (15, 46)]
    kanat(d, W, cx, (3.8, 3.4), (9, 33))
    # uc tuylu tepelik
    for i, (dx, tx, ty) in enumerate(((-6, -7, 17), (0, 0, 15), (6, 7, 17))):
        d.capsule('Turuncu', (cx + dx * 0.5, 23), (cx + tx, ty - 2), (3.2, 2.6), part='tepe', line=True, name='t%d' % i)
        d.circle('Sari', (cx + tx, ty - 3), 2.4, part='tepe', line=True, lift=0.1)
    d.ellipse('Sari', (cx, 38), (19, 18.5), name='govde', cast=1, lift=0.05)
    d.ellipse('Sari', (cx, 47.5), (12.5, 7.5), clip='govde', shift=-1)
    gaga(d, cx, 42, 3.2, 2.0)
    # gogus tasi
    d.poly('Cam', [(cx, 47.5), (cx + 2.6, 50.1), (cx, 52.9), (cx - 2.6, 50.1)], line=True, name='tas', lift=0.1)
    d.pix((cx - 1, 48.5), ['oo'], {'o': 'Parilti'})
    bacak(d, cx, 55, 7)
    d.set_face(cx, 33, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
