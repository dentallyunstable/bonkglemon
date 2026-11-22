# Parilmantar (Tas, nadir). Tarif: TARIFLER.md. Karanlikta mavi parlayan, ince uzun saplı mantar demeti; yuz en buyuk mantarin sapinda.
# Renk: Gok (sapka), Cam (sapka alti isigi, turkuaz), Kar (sap). Nadir: sapkada 2 piksel Parilti. Parlak: Gok -> Pembe.
PARLA = 'Cam'


def cap(d, cx, cy, rx, ry, name, spots, hang=3, **kw):
    """Sapka: alti Cam isikli kubbe. cy = kubbe tabani satiri."""
    # sapka altindan sizan turkuaz isik
    d.ellipse('Cam', (cx, cy + 0.5), (rx - 1, hang), name=name + 'g', lift=0.15, **kw)
    d.ellipse('Gok', (cx, cy), (rx, ry), inbox=(0, 0, 63, int(cy) - 1), name=name, lift=0.05, cast=1, **kw)
    for dx, dy, r in spots:
        d.circle('Gok', (cx + dx, cy + dy), r, clip=name, shift=-1, **kw)


def stem(d, cx, y0, y1, w, name, **kw):
    d.rect('Kar', (cx - w // 2, y0, cx + w // 2 - 1, y1), rad=w / 2.6, name=name, lift=0.03, **kw)
    d.ellipse('Kar', (cx, y1), (w / 2 + 1, 2.4), join=name, **kw)


def glint(d, x, y, part='govde'):
    d.pix((x, y), ['oo', 'o.'], {'o': 'Parilti'}, part=part)


def bebek(d):
    stem(d, 24, 26, 43, 16, 's')
    cap(d, 24, 28, 13, 10, 'c', [(-5, -6, 2.4), (4, -7, 1.8), (8, -2, 1.6)], hang=2.4)
    glint(d, 18, 22)
    d.set_face(24, 32, gap=5)


def genc(d):
    # kisa kardes solda (kol_1): sapi ana sapa yapisik
    stem(d, 14, 42, 53, 8, 's2', part='kol_1')
    cap(d, 14, 44, 9, 7, 'c2', [(-3, -4, 1.8), (3, -3, 1.4)], hang=2, part='kol_1')
    stem(d, 30, 28, 54, 16, 's')
    cap(d, 30, 31, 14, 11, 'c', [(-6, -7, 2.6), (4, -8, 2.0), (9, -3, 1.8), (-10, -2, 1.5)], hang=2.6)
    glint(d, 24, 23)
    d.set_face(30, 35, gap=5)


def usta(d):
    # kisa (kol_1) ve orta (kol_2) kardesler ana mantara yapisik
    stem(d, 14, 49, 60, 8, 's3', part='kol_1')
    cap(d, 14, 51, 9, 7, 'c3', [(-3, -4, 1.8), (3, -3, 1.4)], hang=2, part='kol_1')
    stem(d, 50, 40, 60, 9, 's2', part='kol_2')
    cap(d, 50, 42, 10, 8, 'c2', [(-3, -5, 2.0), (4, -4, 1.5)], hang=2.2, part='kol_2')
    stem(d, 32, 28, 61, 18, 's')
    cap(d, 32, 32, 16, 12, 'c', [(-7, -8, 3.0), (5, -9, 2.2), (10, -3, 2.0), (-11, -2, 1.6), (0, -3, 1.4)], hang=3.8)
    glint(d, 25, 23)
    glint(d, 45, 37, 'kol_2')
    d.set_face(32, 37, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
