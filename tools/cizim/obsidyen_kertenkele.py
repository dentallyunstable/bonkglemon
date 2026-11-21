# Obsidyen Kertenkelesi (Ates, nadir). Tarif: TARIFLER.md. Sirti parlak kara volkan cami plakali zirhli kertenkele (altigen plakalar, Mor yansima, Krem bant karin);
# Toz Kertenkelesi'nden farki: kara zirh, yaka yok, sirt/kuyruk plaka sirasi, parmakli ayak, ustada kuyrukta cam topuz. Bebekte 3 plaka, gencte omuzdan kuyruga plaka sirasi, ustada plaka arasi Turuncu isik.
# Renk: Komur (govde, plaka), Mor (yansima), Turuncu (isik), Krem (karin). Parlak: Mor -> Kirmizi.
import math
PARLA = 'Turuncu'


def hexa(x, y, rx, ry, rot=0):
    pts = []
    for ax, ay in ((0, -1), (1, -0.45), (1, 0.45), (0, 1), (-1, 0.45), (-1, -0.45)):
        px, py = ax * rx, ay * ry
        c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
        pts.append((x + px * c - py * s, y + px * s + py * c))
    return pts


def plaka(d, x, y, rx, ry, rot=0, part='tepe', isik=None):
    if isik:
        d.poly('Turuncu', hexa(x, y + 1.5, rx + 2.4, ry + 2.0, rot), part=part, noshadow=True, lift=0.1)
    d.poly('Mor', hexa(x, y, rx + 0.8, ry + 0.8, rot), part=part, line=True, noshadow=True, lift=-0.1)
    d.poly('Komur', hexa(x + 0.3, y + 0.5, rx - 0.6, ry - 0.6, rot), part=part, lift=0.12, noshadow=True)
    d.poly('Mor', hexa(x - rx * 0.35, y - ry * 0.3, rx * 0.35, ry * 0.4, rot), part=part, lift=0.1, noshadow=True)
    d.pix((int(x - rx * 0.5), int(y - ry * 0.55)), ['oo'], {'o': 'Parilti'}, part=part)


def kemer(d, cx, cy, rx, ry, aciler, boyut, isik=None, part='tepe'):
    """govde dis hattinin hemen disinda, disa bakan dik plakalar."""
    for a, k in zip(aciler, boyut):
        t = math.radians(a)
        x, y = cx + math.cos(t) * (rx + 1.5), cy + math.sin(t) * (ry + 1.5)
        plaka(d, x, y, 3.6 * k, 5.2 * k, rot=a + 90, part=part, isik=isik)


def parmak(d, x, y, part):
    for dx in (-2, 0, 2):
        d.circle('Komur', (x + dx, y), 1.4, part=part, line=True, noshadow=True)


def bebek(d):
    # arka sirt: 3 plaka (kafanin arkasindan gorunur)
    kemer(d, 24, 36, 14.4, 11.8, (-125, -90, -55), (0.85, 1.05, 0.85))
    d.ellipse('Komur', (24, 36), (14.2, 10.2), name='kafa', cast=1)
    d.ellipse('Komur', (24, 43), (11.5, 8.5), name='karin', join='kafa')
    d.ellipse('Krem', (24, 45.5), (7.5, 5.2), part='govde', clip='kafa', shift=0, inbox=(0, 42, 47, 52))
    d.rect('Krem', (18, 44, 30, 44.9), part='govde', clip='kafa', shift=1)
    d.rect('Krem', (18, 47, 30, 47.9), part='govde', clip='kafa', shift=1)
    d.curve('Komur', [(30, 48.5), (38, 50.5), (44, 48), (43, 42)], (6.0, 3.0), part='kuyruk', line=True)
    plaka(d, 42.5, 45, 2.0, 2.4, rot=15, part='kuyruk')
    d.circle('Komur', (14, 47.5), 3.4, part='kol_1', line=True)
    d.circle('Komur', (34, 47.5), 3.4, part='kol_2', line=True)
    parmak(d, 14, 50, 'kol_1'); parmak(d, 34, 50, 'kol_2')
    d.set_face(24, 31, gap=5)


def genc(d):
    # omuzdan: sirt plaka sirasi, yuzun cevresinde kemer
    kemer(d, 28, 38, 15.5, 14, (-150, -125, -100, -75, -50, -25, -2), (0.75, 0.9, 1.05, 1.05, 0.95, 0.8, 0.7))
    d.ellipse('Komur', (28, 46), (14.8, 11), name='govde', cast=1)
    d.ellipse('Komur', (28, 37.5), (14.5, 11.5), name='kafa', join='govde')
    d.ellipse('Krem', (28, 51), (8.8, 5.4), part='govde', clip='govde', shift=0, inbox=(0, 46, 55, 60))
    for y in (49, 51.6, 54.2):
        d.rect('Krem', (21, y, 35, y + 0.9), part='govde', clip='govde', shift=1)
    d.curve('Komur', [(34, 57), (44, 59), (51, 55), (50, 47)], (7.2, 3.2), part='kuyruk', line=True)
    for x, y, rx, ry, r in ((46.5, 58.5, 2.3, 2.7, 70), (51, 54, 2.3, 2.7, 10), (51, 48.5, 2.0, 2.4, -10)):
        plaka(d, x, y, rx, ry, r, part='kuyruk')
    d.circle('Komur', (15.5, 55), 3.6, part='kol_1', line=True)
    d.circle('Komur', (40.5, 55), 3.6, part='kol_2', line=True)
    d.ellipse('Komur', (21, 57.5), (5, 2.8), part='govde', line=True)
    d.ellipse('Komur', (35, 57.5), (5, 2.8), part='govde', line=True)
    parmak(d, 20, 59.5, 'govde'); parmak(d, 36, 59.5, 'govde')
    d.set_face(28, 33, gap=5)


def usta(d):
    kemer(d, 32, 40, 17.5, 16.5, (-155, -130, -105, -80, -55, -30, -5), (0.85, 1.0, 1.15, 1.2, 1.1, 0.95, 0.8), isik=True)
    d.ellipse('Komur', (32, 49), (17.2, 14), name='govde', cast=1)
    d.ellipse('Komur', (32, 35), (16, 13.5), name='kafa', join='govde')
    d.ellipse('Krem', (32, 55.5), (10.5, 6.4), part='govde', clip='govde', shift=0, inbox=(0, 49, 63, 63))
    for y in (53, 56, 59):
        d.rect('Krem', (23, y, 41, y + 1), part='govde', clip='govde', shift=1)
    d.curve('Komur', [(40, 61), (51, 61.5), (57, 56), (55, 49)], (7.4, 3.6), part='kuyruk', line=True)
    for x, y, rx, ry, r in ((49.5, 61, 2.6, 3.0, 80), (55.5, 58, 2.6, 3.0, 20), (56, 52.5, 2.3, 2.7, 0)):
        plaka(d, x, y, rx, ry, r, part='kuyruk', isik=True)
    d.circle('Mor', (54.5, 46.5), 4.6, part='kuyruk', line=True, name='topuz')
    d.circle('Komur', (55, 47), 2.9, part='kuyruk', clip='topuz', shift=0)
    d.pix((56, 48), ['oo'], {'o': 'Turuncu-1'}, part='kuyruk')
    d.pix((52, 44), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    for pts in ([(14, 38), (16, 42), (14, 47)], [(50, 38), (48, 42), (50, 47)], [(22, 28), (20, 32)], [(42, 28), (44, 32)]):
        d.curve('Turuncu', pts, 1.5, part='govde', clip='govde', shift=0)
    d.circle('Komur', (16, 57), 4.0, part='kol_1', line=True)
    d.circle('Komur', (48, 57), 4.0, part='kol_2', line=True)
    d.ellipse('Komur', (22.5, 60.5), (5.6, 3.2), part='govde', line=True)
    d.ellipse('Komur', (41.5, 60.5), (5.6, 3.2), part='govde', line=True)
    parmak(d, 22, 62.5, 'govde'); parmak(d, 42, 62.5, 'govde')
    d.set_face(32, 32, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
