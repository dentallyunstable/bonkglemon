# Obsidyen Kertenkelesi (Ates, nadir). Tarif: TARIFLER.md. Sirti parlak kara volkan cami plakali tombul oturan kertenkele (keskin kenarli plakalar, Mor yansima, Krem karin plakasi, dolu sivri kuyruk);
# Toz Kertenkelesi'nden farki: kara zirh, yaka yok, sirt/kuyruk plaka sirasi, parmakli ayak, ustada kuyrukta cam topuz. Bebekte 3 plaka, gencte omuzdan kuyruga plaka sirasi, ustada plaka arasi Turuncu isik.
# Renk: Komur (govde, plaka), Mor (yansima), Turuncu (isik), Krem (karin). Parlak: Mor -> Kirmizi.
import math
PARLA = 'Turuncu'

KITE = ((0, -1.0), (0.85, -0.1), (0.6, 0.9), (-0.6, 0.9), (-0.85, -0.1))


def sekil(x, y, rx, ry, rot):
    c, s = math.cos(math.radians(rot)), math.sin(math.radians(rot))
    return [(x + px * rx * c - py * ry * s, y + px * rx * s + py * ry * c) for px, py in KITE]


def plaka(d, x, y, rx, ry, rot=0, part='tepe', isik=False):
    """Parlak kara cam plaka: Mor kenar (sol ust), Komur govde, Parilti parilti. Ucu rot yonune bakar (0 = yukari)."""
    if isik:
        d.poly('Turuncu', sekil(x, y + 0.8, rx + 2.2, ry + 1.8, rot), part=part, noshadow=True, lift=0.15)
    d.poly('Mor', sekil(x, y, rx + 0.7, ry + 0.7, rot), part=part, line=True, noshadow=True, lift=-0.12)
    d.poly('Komur', sekil(x + 0.6, y + 0.8, rx - 0.1, ry - 0.3, rot), part=part, lift=0.18, noshadow=True)
    gx, gy = x - rx * 0.35, y - ry * 0.25
    d.pix((int(round(gx)), int(round(gy))), ['oo'], {'o': 'Parilti'}, part=part)


def isik(d, pts, w=1.8, part='tepe'):
    """Plaka aralarindan sizan Turuncu cizgi (plakalardan once cizilir)."""
    d.curve('Turuncu', pts, w, part=part, noshadow=True, lift=0.1)


def parmak(d, x, y, part, yon=0):
    """Ayak ucunda 3 minik parmak (Komur-4 noktalar)."""
    d.pix((int(x) - 2 + yon, int(y)), ['#.#.#'], {'#': 'Komur-4'}, part=part, keep=True)


def burun(d, x, y):
    d.pix((x, y), ['#...#'], {'#': 'Komur-4'}, part='govde', keep=True)


def karin(d, cx, cy, rx, ry, clip, y0, bant, bx0, bx1):
    d.ellipse('Krem', (cx, cy), (rx, ry), part='govde', clip=clip, shift=0, inbox=(0, y0, 80, 80))
    for y in bant:
        d.rect('Krem', (bx0, y, bx1, y + 0.9), part='govde', clip=clip, shift=1)


def bebek(d):
    plaka(d, 17, 22.5, 3.3, 5.2, rot=-16)
    plaka(d, 26, 21.5, 3.9, 5.8, rot=12)
    plaka(d, 34.5, 28, 3.6, 5.4, rot=58)
    d.ellipse('Komur', (24, 41), (10.5, 8.5), name='g', cast=1)
    d.ellipse('Komur', (22.5, 33.2), (12.5, 8.0), name='kafa', cast=1, lift=0.05)
    karin(d, 24, 45.5, 7.2, 4.6, 'g', 42, (44.5, 47), 18, 30)
    d.curve('Komur', [(31, 46), (37, 50.5), (42, 47), (41.5, 40)], (8.0, 2.2), part='kuyruk', line=True)
    d.capsule('Komur', (15, 46), (12.5, 48.5), 5.6, part='kol_1', line=True)
    d.capsule('Komur', (33, 46), (35.5, 48.5), 5.6, part='kol_2', line=True)
    parmak(d, 12.5, 51, 'kol_1', -1); parmak(d, 35.5, 51, 'kol_2', 1)
    burun(d, 21, 28)
    d.set_face(22.5, 31, gap=5)


def genc(d):
    plaka(d, 17, 24.5, 3.5, 5.6, rot=-16)
    plaka(d, 26, 22.5, 4.1, 6.2, rot=10)
    plaka(d, 34.5, 27, 4.1, 6.0, rot=42)
    plaka(d, 40, 36, 3.8, 5.4, rot=68)
    d.ellipse('Komur', (25, 46.5), (13, 10.5), name='g', cast=1)
    d.ellipse('Komur', (23.5, 36), (14.5, 10), name='kafa', cast=1, lift=0.05)
    karin(d, 25, 51.5, 8.6, 5.4, 'g', 47, (49.5, 52.5), 18, 32)
    d.curve('Komur', [(34, 53), (41, 58), (46.5, 54.5), (46.5, 46.5)], (9.5, 2.4), part='kuyruk', line=True)
    for x, y, rx, ry, r in ((41, 55, 2.2, 3.2, 100), (46, 51, 2.1, 3.0, 40)):
        plaka(d, x, y, rx, ry, r, part='kuyruk')
    d.capsule('Komur', (15.5, 52), (12.5, 55.5), 6.0, part='kol_1', line=True)
    d.capsule('Komur', (35.5, 52), (38.5, 55.5), 6.0, part='kol_2', line=True)
    parmak(d, 12.5, 58, 'kol_1', -1); parmak(d, 38.5, 58, 'kol_2', 1)
    burun(d, 21, 31)
    d.set_face(23.5, 35, gap=5)


def usta(d):
    for x, y, rx, ry, r in ((19.5, 25, 3.8, 5.8, -16), (29.5, 22, 4.4, 6.6, 8), (38.5, 26, 4.4, 6.6, 38), (43.5, 35, 4.0, 6.0, 64)):
        plaka(d, x, y, rx, ry, r, isik=True)
    d.ellipse('Komur', (28, 51), (16.5, 12.5), name='g', cast=1)
    d.ellipse('Komur', (26, 36), (17, 12.5), name='kafa', cast=1, lift=0.05)
    karin(d, 28, 57, 10, 6.4, 'g', 51, (55, 58), 21, 35)
    # dolu, sivrilen kuyruk onden dolanir; ucunda cam topuz
    d.curve('Komur', [(39, 58), (47, 63.5), (52, 59), (52, 51)], (11.0, 4.0), part='kuyruk', line=True)
    for x, y, rx, ry, r in ((45.5, 59, 2.4, 3.4, 85), (51.5, 54, 2.2, 3.2, 40)):
        plaka(d, x, y, rx, ry, r, part='kuyruk', isik=True)
    d.circle('Mor', (52, 46.5), 4.6, part='kuyruk', line=True, name='topuz')
    d.circle('Komur', (52.5, 47), 3.2, part='kuyruk', clip='topuz', shift=0)
    d.pix((52, 47), ['oo', 'oo'], {'o': 'Turuncu-1'}, part='kuyruk')
    d.pix((49, 43), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    d.capsule('Komur', (15.5, 57), (11.5, 61), 6.6, part='kol_1', line=True)
    d.capsule('Komur', (40.5, 57), (44.5, 61), 6.6, part='kol_2', line=True)
    parmak(d, 11.5, 64, 'kol_1', -1); parmak(d, 44.5, 64, 'kol_2', 1)
    burun(d, 24, 31)
    d.set_face(26, 34, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
