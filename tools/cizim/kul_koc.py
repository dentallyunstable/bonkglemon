# Kul Kocu (Ates, nadir). Tarif: TARIFLER.md. Yunu kul bulutu gibi gri ve pofuduk, kivrik boynuzlarinin ici kor gibi parlayan inatci kocu yavrusu.
# Renk: Tas (yun), Komur (yuz, boynuz, ayak), Turuncu (kor). Nadir: Sari kor isigi + Parilti.
import math
PARLA = 'Turuncu'


def yun(d, cx, cy, rx, ry, n, r, name='yun', start=0.0):
    """Pofuduk yun: elips + cevresinde kabarik toplar."""
    d.ellipse('Tas', (cx, cy), (rx, ry), name=name, lift=0.06, cast=1)
    for i in range(n):
        a = start + 2 * math.pi * i / n
        d.circle('Tas', (cx + math.cos(a) * rx * 0.92, cy + math.sin(a) * ry * 0.92), r, join=name)


def yuz(d, cx, cy, rx, ry):
    d.ellipse('Komur', (cx, cy), (rx, ry), name='yuz', lift=0.18, cast=1)


def boynuz(d, side, cx, pts, w, name, kor, inner=None):
    m = (lambda p: p) if side == 1 else (lambda p: (2 * cx - p[0], p[1]))
    d.curve('Komur', [m(p) for p in pts], w, part='tepe', line=True, name=name, lift=-0.05)
    if inner:
        d.curve(kor, [m(p) for p in inner], 2.0, part='tepe', clip=name, tone=1)


def bebek(d):
    d.circle('Komur', (18, 43.5), 2.8, part='kol_1', line=True)
    d.circle('Komur', (30, 43.5), 2.8, part='kol_2', line=True)
    yun(d, 24, 32, 11.6, 10.2, 11, 3.4)
    # boynuz tomurcuklari
    for s, x in ((1, 15), (2, 33)):
        d.capsule('Komur', (x, 23), (x + (-2 if s == 1 else 2), 18), (4.2, 3.0), part='tepe', line=True)
        d.pix((x + (-2 if s == 1 else 2) - 1, 18), ['oo'], {'o': 'Turuncu-1'}, part='tepe')
    yuz(d, 24, 36, 8.6, 6.8)
    d.set_face(24, 33, gap=5)


def genc(d):
    cx = 28
    d.ellipse('Komur', (20, 52), (3.4, 2.4), part='kol_1', line=True)
    d.ellipse('Komur', (36, 52), (3.4, 2.4), part='kol_2', line=True)
    yun(d, 28, 37, 15, 13, 12, 4.0)
    # yarim tur kivrilan boynuz, ic yuzu turuncu
    P = [(20, 28), (13, 25), (10, 31), (13, 36), (17, 35)]
    I = [(19, 29), (14, 27), (12, 31), (14, 34)]
    boynuz(d, 1, cx, P, (5.4, 3.2), 'h1', 'Turuncu', I)
    boynuz(d, 2, cx, P, (5.4, 3.2), 'h2', 'Turuncu', I)
    yuz(d, 28, 41, 10.4, 8.2)
    d.set_face(28, 38, gap=5)


def usta(d):
    cx = 32
    d.ellipse('Komur', (22, 61), (4.2, 2.6), part='kol_1', line=True)
    d.ellipse('Komur', (42, 61), (4.2, 2.6), part='kol_2', line=True)
    yun(d, 32, 40, 19, 17, 14, 5.0)
    yun(d, 32, 27, 11, 6, 8, 3.4, name='kafa_yun')
    # tam sarmal boynuz: disa, yukari, geri, iceri kivrilir; catlaklardan kor
    P = [(24, 34), (15, 30), (10, 22), (14, 16), (21, 18), (20, 25), (15, 24)]
    I = [(23, 33), (15, 30), (11, 23), (14, 18), (19, 19)]
    boynuz(d, 1, cx, P, (9.0, 4.6), 'h1', 'Turuncu', I)
    boynuz(d, 2, cx, P, (9.0, 4.6), 'h2', 'Turuncu', I)
    for s, pts in ((1, [(13, 21), (14, 23)]), (2, [(50, 21), (50, 23)])):
        d.pix((pts[0][0], pts[0][1]), ['oo'], {'o': 'Parilti'}, part='tepe')
    yuz(d, 32, 46, 11.6, 9.6)
    d.set_face(32, 43, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
