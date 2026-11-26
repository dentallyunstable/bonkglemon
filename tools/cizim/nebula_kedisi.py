# Nebula Kedisi (Yildiz, siradan). Tarif: TARIFLER.md. Bulut gibi pofuduk uzun tuylu kedi; tuyu mor-pembe bulutsu, icinde yildiz benekleri.
# Renk: Mor (tuy), Pembe (seritler, kuyruk bulutu), Lacivert (golge, pati, kulak ici). Yildizlar Parilti. Gece Pisisi'nden farki: yuvarlak bulut siluet, kucuk kulak.
import math
PARLA = 'Pembe'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kabar(d, fam, cx, cy, rx, ry, n, r, name, a0=0, a1=360, part='govde', skip=None, **kw):
    """Elips kenari boyunca kucuk daireler: bulut kenari (join ile ana sekle katilir)."""
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / max(1, n - 1 if a1 - a0 < 360 else n))
        x, y = cx + rx * math.cos(a), cy + ry * math.sin(a)
        if skip and skip(x, y):
            continue
        d.circle(fam, (x, y), r, join=name, part=part, **kw)


def kulaklar(d, cx, L, I):
    d.poly('Mor', L, part='kulak_1', name='e1', line=True, lift=0.05)
    d.poly('Lacivert', I, part='kulak_1', clip='e1', tone=1)
    d.poly('Mor', mir(L, cx), part='kulak_2', name='e2', line=True, lift=0.05)
    d.poly('Lacivert', mir(I, cx), part='kulak_2', clip='e2', tone=1)


def yildiz(d, x, y, big=False, part='govde'):
    if big:
        d.pix((x - 2, y - 2), ['..o..', '.ooo.', 'ooooo', '.ooo.', '..o..'], {'o': 'Parilti'}, part=part)
    else:
        d.pix((x - 1, y - 1), ['.o.', 'ooo', '.o.'], {'o': 'Parilti'}, part=part)


def bebek(d):
    cx = 24
    kulaklar(d, cx, [(12, 29), (11.5, 21.5), (13.5, 19), (17, 19.5), (23, 25), (23, 29)], [(14, 27), (13.5, 23), (15, 21.5), (18.5, 25), (18.5, 27)])
    d.circle('Pembe', (35, 42), 5.2, part='kuyruk', name='kb', line=True, lift=0.05)
    d.circle('Pembe', (37.5, 38.5), 3.6, part='kuyruk', join='kb')
    d.ellipse('Mor', (cx, 36), (10.8, 11.2), name='g', cast=1, lift=0.06)
    kabar(d, 'Mor', cx, 36, 10.6, 11, 11, 3.4, 'g', skip=lambda x, y: y < 28)
    d.ellipse('Lacivert', (cx, 47.5), (10, 3.2), clip='g', shift=0, tone=3)
    d.ellipse('Pembe', (cx - 8, 31), (3.4, 1.4), clip='g', rot=40, tone=2)
    d.ellipse('Pembe', (cx + 8, 31), (3.4, 1.4), clip='g', rot=-40, tone=2)
    d.ellipse('Pembe', (cx + 6, 44), (5, 1.4), clip='g', tone=2)
    yildiz(d, cx + 8, 37)
    d.set_face(cx, 33, gap=5)


def genc(d):
    cx = 26
    kulaklar(d, cx, [(12, 31), (11.5, 21), (13.5, 18), (18, 18.5), (25, 25), (25, 31)], [(14, 28), (13.5, 23), (15, 21), (19, 24), (19.5, 28)])
    # buyuk bulut kuyruk
    d.curve('Mor', [(37, 52), (44, 50), (46, 42), (43, 34)], (6.4, 7), part='kuyruk', name='k', line=True, lift=0.06)
    for x, y, r in ((45, 46, 5), (47.5, 40, 4.6), (45, 33.5, 5), (41, 51, 3.6)):
        d.circle('Mor', (x, y), r, part='kuyruk', join='k')
    d.curve('Pembe', [(40, 51), (45, 47), (46, 41), (42, 35)], 2.2, part='kuyruk', clip='k', tone=2)
    d.curve('Mor', [(42, 49), (44.5, 43), (44, 38)], 2, part='kuyruk', clip='k', shift=-1)
    d.ellipse('Mor', (cx, 40), (14, 12), name='g', cast=1, lift=0.06)
    d.ellipse('Mor', (cx, 49), (11.5, 7.5), join='g')
    kabar(d, 'Mor', cx, 40, 14.4, 12, 13, 4, 'g', skip=lambda x, y: y < 31)
    kabar(d, 'Mor', cx, 49, 11.5, 8.5, 5, 3.6, 'g', a0=30, a1=150)
    # mor-pembe seritler
    d.ellipse('Pembe', (cx - 10.5, 36), (5, 1.5), clip='g', rot=55, tone=2)
    d.ellipse('Pembe', (cx + 10.5, 36), (5, 1.5), clip='g', rot=-55, tone=2)
    d.ellipse('Pembe', (cx - 7, 45), (5.5, 1.5), clip='g', rot=25, tone=2)
    d.ellipse('Pembe', (cx + 7, 45), (5.5, 1.5), clip='g', rot=-25, tone=2)
    d.ellipse('Lacivert', (cx, 56), (11, 3), clip='g', tone=3)
    d.capsule('Lacivert', (cx - 6, 53), (cx - 6, 55.5), 4.6, part='kol_1', line=True, lift=0.1)
    d.capsule('Lacivert', (cx + 6, 53), (cx + 6, 55.5), 4.6, part='kol_2', line=True, lift=0.1)
    yildiz(d, cx - 10, 45)
    yildiz(d, cx + 9, 28, True)
    d.set_face(cx, 36, gap=5)


def usta(d):
    cx = 30
    kulaklar(d, cx, [(14, 34), (13, 22), (15.5, 19), (20, 19.5), (28, 27), (28, 34)], [(16, 31), (15.5, 25), (17.5, 23), (21, 26), (22, 31)])
    # kuyruk: bulut, ucu dagilan duman
    d.curve('Mor', [(41, 58), (53, 57), (56, 47), (53, 38)], (7, 8), part='kuyruk', name='k', line=True, lift=0.06)
    for x, y, r in ((54, 51, 5.2), (56, 44, 5), (53, 38, 5), (48, 56, 4)):
        d.circle('Mor', (x, y), r, part='kuyruk', join='k')
    d.curve('Pembe', [(47, 57), (54, 52), (55, 45), (52, 38)], 2.4, part='kuyruk', clip='k', tone=2)
    # dagilan duman ucu: kucuk pembe puflar
    d.pix((49, 31), ['.oo.', 'oooo', '.oo.'], {'o': 'Pembe-1'}, part='kuyruk')
    d.pix((55, 29), ['.o.', 'ooo', '.o.'], {'o': 'Pembe-1'}, part='kuyruk')
    d.ellipse('Mor', (cx, 46), (18, 17), name='g', cast=1, lift=0.06)
    d.ellipse('Mor', (cx, 56), (15.5, 9), join='g')
    kabar(d, 'Mor', cx, 46, 18, 16.5, 13, 4.4, 'g', skip=lambda x, y: y < 33)
    kabar(d, 'Mor', cx, 56, 15, 9, 6, 4, 'g', a0=25, a1=155)
    # kabarik yele: boynun cevresinde acik tuy bulutu
    for dx, dy, r in ((-16, 48, 4.4), (16, 48, 4.4), (-14, 54, 4.4), (14, 54, 4.4), (-7, 56, 4), (7, 56, 4), (0, 57, 4)):
        d.circle('Pembe', (cx + dx, dy), r, join='g', lift=0.1)
    # seritler
    d.ellipse('Pembe', (cx - 12, 39), (5.5, 1.6), clip='g', rot=55, tone=2)
    d.ellipse('Pembe', (cx + 12, 39), (5.5, 1.6), clip='g', rot=-55, tone=2)
    d.ellipse('Mor', (cx - 14, 55), (4, 1.4), clip='g', rot=20, shift=1)
    d.ellipse('Mor', (cx + 14, 55), (4, 1.4), clip='g', rot=-20, shift=1)
    d.ellipse('Lacivert', (cx, 64.5), (13, 3), clip='g', tone=3)
    d.capsule('Lacivert', (cx - 7, 61), (cx - 7, 63.5), 5.2, part='kol_1', line=True, lift=0.1)
    d.capsule('Lacivert', (cx + 7, 61), (cx + 7, 63.5), 5.2, part='kol_2', line=True, lift=0.1)
    for x, y, b in ((cx - 15, 36, False), (cx + 14, 33, True), (cx - 13, 58, True), (cx + 13, 60, False), (cx - 3, 31, False)):
        yildiz(d, x, y, b)
    d.set_face(cx, 43, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def kulak_yan(d, L, I, part, name, lift=0.05, tone=1):
    d.poly('Mor', L, part=part, name=name, line=True, lift=lift)
    d.poly('Lacivert', I, part=part, clip=name, tone=tone)


def bebek_yan(d):
    kulak_yan(d, [(20, 29), (21, 21.5), (23, 19), (26.5, 19.5), (30, 25), (30, 29)], [(22, 27), (23, 23), (25, 21.5), (27.5, 25), (27.5, 27)], 'kulak_2', 'e2', -0.1, 2)
    d.circle('Pembe', (37, 41), 5.2, part='kuyruk', name='kb', line=True, lift=0.05)
    d.circle('Pembe', (39, 36.5), 3.6, part='kuyruk', join='kb')
    d.capsule('Lacivert', (28, 45), (28, 47.5), 4.4, part='kol_2', line=True, lift=0.05)
    d.ellipse('Mor', (25, 36), (11.5, 11), name='g', cast=1, lift=0.06)
    kabar(d, 'Mor', 25, 36, 11.4, 11, 11, 3.4, 'g', skip=lambda x, y: y < 28)
    d.circle('Mor', (14, 38.5), 3.6, join='g')
    d.ellipse('Lacivert', (25, 47.5), (10, 3.2), clip='g', shift=0, tone=3)
    d.ellipse('Pembe', (31, 31), (3.4, 1.4), clip='g', rot=-40, tone=2)
    d.ellipse('Pembe', (30, 43), (6, 1.4), clip='g', tone=2)
    yildiz(d, 31, 37)
    d.pix2((6, 18), ['#'], {'#': 'Lacivert-4'})
    kulak_yan(d, [(13, 29), (13.5, 21.5), (15.5, 19), (19, 19.5), (24, 25), (24, 29)], [(15, 27), (15.5, 23), (17, 21.5), (20.5, 25), (20.5, 27)], 'kulak_1', 'e1')
    d.capsule('Lacivert', (18, 45), (18, 47.5), 4.4, part='kol_1', line=True, lift=0.05)
    d.set_face_side(14, 30)


def genc_yan(d):
    kulak_yan(d, [(20, 31), (21, 21), (23, 18), (27.5, 18.5), (32, 25), (32, 31)], [(22, 28), (23, 23), (25, 21), (29, 24), (29.5, 28)], 'kulak_2', 'e2', -0.1, 2)
    d.curve('Mor', [(40, 52), (47, 50), (49, 42), (46, 34)], (6.4, 7), part='kuyruk', name='k', line=True, lift=0.06)
    for x, y, r in ((48, 46, 5), (50.5, 40, 4.6), (48, 33.5, 5), (44, 51, 3.6)):
        d.circle('Mor', (x, y), r, part='kuyruk', join='k')
    d.curve('Pembe', [(43, 51), (48, 47), (49, 41), (45, 35)], 2.2, part='kuyruk', clip='k', tone=2)
    d.capsule('Lacivert', (33, 53), (33, 55.5), 4.6, part='kol_2', line=True, lift=0.1)
    d.ellipse('Mor', (27, 41), (14.5, 12), name='g', cast=1, lift=0.06)
    d.ellipse('Mor', (28, 49), (12.5, 7.5), join='g')
    kabar(d, 'Mor', 27, 41, 14.5, 12, 13, 4, 'g', skip=lambda x, y: y < 32)
    kabar(d, 'Mor', 28, 49, 12.5, 8.5, 5, 3.6, 'g', a0=30, a1=150)
    d.circle('Mor', (14, 42), 3.8, join='g')
    d.ellipse('Pembe', (34, 37), (5, 1.5), clip='g', rot=-55, tone=2)
    d.ellipse('Pembe', (31, 46), (5.5, 1.5), clip='g', rot=-25, tone=2)
    d.ellipse('Pembe', (21, 48), (4, 1.4), clip='g', rot=25, tone=2)
    d.ellipse('Lacivert', (28, 56), (11, 3), clip='g', tone=3)
    yildiz(d, 36, 33, True)
    yildiz(d, 24, 50)
    d.pix2((6, 21), ['#'], {'#': 'Lacivert-4'})
    kulak_yan(d, [(14, 31), (14.5, 21), (16.5, 18), (21, 18.5), (27, 25), (27, 31)], [(16, 28), (16.5, 23), (18, 21), (22, 24), (22.5, 28)], 'kulak_1', 'e1')
    d.capsule('Lacivert', (20, 53), (20, 55.5), 4.6, part='kol_1', line=True, lift=0.1)
    d.set_face_side(16, 35)


def usta_yan(d):
    kulak_yan(d, [(20, 34), (21, 22), (23.5, 19), (28, 19.5), (35, 27), (35, 34)], [(22, 31), (23, 25), (25, 23), (29, 26), (30, 31)], 'kulak_2', 'e2', -0.1, 2)
    d.curve('Mor', [(44, 58), (56, 57), (59, 47), (56, 38)], (7, 8), part='kuyruk', name='k', line=True, lift=0.06)
    for x, y, r in ((57, 51, 5.2), (59, 44, 5), (56, 38, 5), (51, 56, 4)):
        d.circle('Mor', (x, y), r, part='kuyruk', join='k')
    d.curve('Pembe', [(50, 57), (57, 52), (58, 45), (55, 38)], 2.4, part='kuyruk', clip='k', tone=2)
    d.pix((52, 31), ['.oo.', 'oooo', '.oo.'], {'o': 'Pembe-1'}, part='kuyruk')
    d.pix((58, 29), ['.o.', 'ooo', '.o.'], {'o': 'Pembe-1'}, part='kuyruk')
    d.capsule('Lacivert', (39, 61), (39, 63.5), 5.2, part='kol_2', line=True, lift=0.1)
    d.ellipse('Mor', (32, 46), (18.5, 17), name='g', cast=1, lift=0.06)
    d.ellipse('Mor', (32, 56), (16, 9), join='g')
    kabar(d, 'Mor', 32, 46, 18.5, 16.5, 13, 4.4, 'g', skip=lambda x, y: y < 33)
    kabar(d, 'Mor', 32, 56, 15.5, 9, 6, 4, 'g', a0=25, a1=155)
    d.circle('Mor', (14, 47), 4.2, join='g')
    for dx, dy, r in ((-14, 55, 4.4), (-11, 59, 4.4), (-4, 60, 4), (3, 60, 4)):
        d.circle('Pembe', (32 + dx, dy), r, join='g', lift=0.1)
    d.ellipse('Pembe', (41, 40), (5.5, 1.6), clip='g', rot=-55, tone=2)
    d.ellipse('Mor', (44, 56), (4, 1.4), clip='g', rot=-20, shift=1)
    d.ellipse('Lacivert', (32, 64.5), (13, 3), clip='g', tone=3)
    for x, y, b in ((41, 34, True), (46, 49, False), (24, 57, True), (36, 31, False)):
        yildiz(d, x, y, b)
    d.pix2((6, 23), ['#'], {'#': 'Lacivert-4'})
    kulak_yan(d, [(13, 34), (14, 22), (16.5, 19), (21, 19.5), (29, 27), (29, 34)], [(15, 31), (16, 25), (18, 23), (22, 26), (23, 31)], 'kulak_1', 'e1')
    d.capsule('Lacivert', (23, 61), (23, 63.5), 5.2, part='kol_1', line=True, lift=0.1)
    d.set_face_side(16, 40)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
