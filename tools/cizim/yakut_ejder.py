# Yakut Ejderi (Ates, epik). Tarif: TARIFLER.md. Tombul kirmizi ejder, karninda dogustan yakut tasi (isik kaynagi). Bebek yumurta kabugunun alt yarisinda (pantolon gibi), genc kabuktan cikmis boynuzlu, usta kanatlari acik, iri yakut, kuyruk ucunda kalp aleviyle.
# Renk: Kirmizi (govde), Krem (karin, kabuk, boynuz), Pembe (yakut, kanat zari, alev). Parlak: Kirmizi -> Cam (Cam ailesi).
PARLA = 'Pembe'


def yakut(d, cx, cy, r, part='govde'):
    """karindaki tas: cok yuzlu yakut, Parilti parlama."""
    pts = [(cx, cy - r), (cx + r * 1.0, cy - r * 0.25), (cx + r * 0.65, cy + r * 0.95), (cx - r * 0.65, cy + r * 0.95), (cx - r * 1.0, cy - r * 0.25)]
    d.poly('Kirmizi', [(x + (x - cx) * 0.3, y + (y - cy) * 0.3) for x, y in pts], part=part, line=True, noshadow=True, name='yakutc', lift=-0.15)
    d.poly('Pembe', pts, part=part, name='yakut', shade='flat', tone=3)
    d.poly('Pembe', [(cx - r * 0.95, cy - r * 0.25), (cx, cy - r * 0.9), (cx - r * 0.1, cy + r * 0.2), (cx - r * 0.55, cy + r * 0.85)], part=part, clip='yakut', shade='flat', tone=2)
    d.poly('Pembe', [(cx + r * 0.95, cy - r * 0.2), (cx + r * 0.1, cy + r * 0.2), (cx + r * 0.6, cy + r * 0.95)], part=part, clip='yakut', shade='flat', tone=4)
    d.pix((int(cx - r * 0.55), int(cy - r * 0.55)), ['oo'], {'o': 'Parilti'}, part=part)


def kabuk(d, cx, y, rx, ry, n, part='govde'):
    d.ellipse('Krem', (cx, y + ry * 0.4), (rx, ry), name='kabuk', line=True, cast=1, inbox=(0, y + 1.5, 2 * cx, y + 3 * ry))
    step = 2 * rx / n
    for i in range(n):
        x = cx - rx + step * (i + 0.5)
        d.poly('Krem', [(x - step / 2, y + 2), (x + step / 2, y + 2), (x, y - 1.2)], join='kabuk')


def bebek(d):
    # minik kanatlar
    d.ellipse('Pembe', (11, 33), (3.6, 4.6), rot=25, part='kanat_1', line=True)
    d.ellipse('Pembe', (37, 33), (3.6, 4.6), rot=-25, part='kanat_2', line=True)
    # kuyruk ucu kabuktan cikar
    d.ellipse('Kirmizi', (24, 35), (14, 10.8), name='kafa', cast=1)
    d.ellipse('Krem', (24, 40.5), (8, 3.6), part='govde', clip='kafa', shift=-1, inbox=(0, 38, 47, 46)) if False else None
    d.circle('Kirmizi', (13.5, 40.5), 3.0, part='kol_1', line=True)
    d.circle('Kirmizi', (34.5, 40.5), 3.0, part='kol_2', line=True)
    # yumurta kabugu alt yarisi
    d.ellipse('Krem', (24, 45), (13.6, 7.4), name='kabuk', line=True, cast=1, inbox=(0, 41, 47, 52))
    for i, x in enumerate((13, 17.5, 22, 26.5, 31, 35.5)):
        d.poly('Krem', [(x - 2.6, 43), (x + 2.6, 43), (x, 37.6 if i % 2 == 0 else 39.4)], join='kabuk')
    d.pix((14, 44), ['oo'], {'o': 'Parilti'}, part='govde') if False else None
    d.pix((16, 46), ['##'], {'#': 'Krem-3'}, part='govde')
    d.pix((29, 47), ['##'], {'#': 'Krem-3'}, part='govde')
    d.curve('Kirmizi', [(35, 45), (42, 46), (44, 39)], (5.4, 3.0), part='kuyruk', line=True)
    yakut(d, 24, 38.6, 3.2)
    d.set_face(24, 27, gap=5)


def genc(d):
    cx = 28
    # kanatlar (arkada), kirmizi kemik + pembe zar
    for s in (1, 2):
        m = (lambda x: x) if s == 1 else (lambda x: 2 * cx - x)
        d.poly('Pembe', [(m(17), 35), (m(5), 27), (m(3), 39), (m(9), 43), (m(17), 44)], part='kanat_%d' % s, line=True, name='zar%d' % s)
        d.capsule('Kirmizi', (m(17), 36), (m(5), 28), (2.4, 1.8), part='kanat_%d' % s, clip='zar%d' % s, shift=0)
        d.capsule('Kirmizi', (m(15), 40), (m(4.5), 39), (2.0, 1.6), part='kanat_%d' % s, clip='zar%d' % s, shift=0)
    # kivrik kuyruk onde
    d.curve('Kirmizi', [(40, 54), (47, 55), (49, 48), (45, 45)], (5.6, 2.8), part='kuyruk', line=True)
    d.ellipse('Kirmizi', (28, 46), (14, 11.4), name='govde', cast=1)
    d.ellipse('Kirmizi', (28, 37), (14, 12), name='kafa', join='govde')
    d.ellipse('Krem', (28, 51.5), (9, 6.4), part='govde', clip='govde', shift=0, inbox=(0, 47, 55, 60))
    for y in (50, 52.6, 55):
        d.rect('Krem', (22, y, 34, y + 0.9), part='govde', clip='govde', shift=1)
    yakut(d, 28, 48.8, 4.0)
    # iki kisa boynuz
    d.capsule('Krem', (20.5, 28), (18, 22), (3.4, 2.2), part='tepe', line=True)
    d.capsule('Krem', (35.5, 28), (38, 22), (3.4, 2.2), part='tepe', line=True)
    d.circle('Kirmizi', (15.5, 56), 3.6, part='kol_1', line=True)
    d.circle('Kirmizi', (40.5, 56), 3.6, part='kol_2', line=True)
    d.ellipse('Kirmizi', (21, 58), (5, 2.8), part='govde', line=True)
    d.ellipse('Kirmizi', (35, 58), (5, 2.8), part='govde', line=True)
    d.set_face(28, 33, gap=5)


def kalp(d, cx, cy, r):
    d.circle('Kirmizi', (cx - r * 0.55, cy - r * 0.3), r * 0.62 + 1, part='kuyruk', line=True, name='kalp0')
    d.circle('Kirmizi', (cx + r * 0.55, cy - r * 0.3), r * 0.62 + 1, part='kuyruk', join='kalp0')
    d.poly('Kirmizi', [(cx - r * 1.3, cy - r * 0.1), (cx + r * 1.3, cy - r * 0.1), (cx, cy + r * 1.5)], part='kuyruk', join='kalp0')
    d.circle('Pembe', (cx - r * 0.55, cy - r * 0.3), r * 0.62, part='kuyruk', name='kalp', lift=0.1)
    d.circle('Pembe', (cx + r * 0.55, cy - r * 0.3), r * 0.62, part='kuyruk', join='kalp')
    d.poly('Pembe', [(cx - r * 1.1, cy - r * 0.1), (cx + r * 1.1, cy - r * 0.1), (cx, cy + r * 1.25)], part='kuyruk', join='kalp')
    d.circle('Pembe', (cx, cy + r * 0.1), r * 0.5, part='kuyruk', clip='kalp', shift=1)
    d.pix((int(cx - r * 0.9), int(cy - r * 0.6)), ['oo'], {'o': 'Parilti'}, part='kuyruk')


def usta(d):
    cx = 32
    # kanatlar acik, buyuk
    for s in (1, 2):
        m = (lambda x: x) if s == 1 else (lambda x: 2 * cx - x)
        d.poly('Pembe', [(m(18), 38), (m(8), 24), (m(1), 17), (m(1.5), 31), (m(4), 40), (m(10), 44), (m(18), 46)], part='kanat_%d' % s, line=True, name='zar%d' % s)
        d.capsule('Kirmizi', (m(18), 39), (m(2), 18), (3.0, 2.0), part='kanat_%d' % s, clip='zar%d' % s, shift=0)
        d.capsule('Kirmizi', (m(16), 42), (m(2.5), 32), (2.6, 1.8), part='kanat_%d' % s, clip='zar%d' % s, shift=0)
        d.capsule('Kirmizi', (m(16), 44.5), (m(5), 41), (2.2, 1.6), part='kanat_%d' % s, clip='zar%d' % s, shift=0)
    d.pix((7, 25), ['oo'], {'o': 'Parilti'}, part='kanat_1')
    # kuyruk, ucunda kalp aleviyle
    d.curve('Kirmizi', [(42, 62), (49, 63.5), (54, 60), (54, 56)], (6.4, 3.6), part='kuyruk', line=True)
    kalp(d, 54.5, 52.5, 5.8)
    d.ellipse('Kirmizi', (32, 49.5), (17.5, 14), name='govde', cast=1)
    d.ellipse('Kirmizi', (32, 36), (16, 13.6), name='kafa', join='govde')
    d.ellipse('Krem', (32, 55.5), (11, 7), part='govde', clip='govde', shift=0, inbox=(0, 49, 63, 63))
    for y in (53.5, 56.5, 59.5):
        d.rect('Krem', (24, y, 40, y + 1), part='govde', clip='govde', shift=1)
    yakut(d, 32, 51, 6.0)
    d.capsule('Krem', (23, 25.5), (19.5, 17.5), (4.2, 2.6), part='tepe', line=True)
    d.capsule('Krem', (41, 25.5), (44.5, 17.5), (4.2, 2.6), part='tepe', line=True)
    d.circle('Kirmizi', (16, 58), 4.0, part='kol_1', line=True)
    d.circle('Kirmizi', (48, 58), 4.0, part='kol_2', line=True)
    d.ellipse('Kirmizi', (22.5, 61), (5.6, 3.2), part='govde', line=True)
    d.ellipse('Kirmizi', (41.5, 61), (5.6, 3.2), part='govde', line=True)
    d.set_face(32, 33, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
