# Kirpi Baligi (Su, nadir). Tarif: TARIFLER.md. Kuyruk yuzgecinin ustunde dik oturan tombul sari balon baligi: buzuk dudak,
# yan yuzgec, krem karin; genc turuncu benek + kisa yuvarlak uclu diken; usta basinda deniz yildizi tokasi, sira sira diken.
# Renk: Sari (govde), Krem (karin), Turuncu (benek, yuzgec, yildiz). Parlak: Sari -> Mor.
import math
PARLA = 'Turuncu'


def dudak(d, cx, y):
    """Buzuk dudak: iki piksel yuksek turuncu halka (agiz yerine)."""
    d.pix((cx - 1, y), ['###', '#.#'], {'#': 'Turuncu-3'}, part='govde')


def kuyruk(d, cx, y, rx, ry):
    d.ellipse('Turuncu', (cx, y), (rx, ry), name='kuyruk', line=True, cast=0)
    for dx in (-0.55, 0, 0.55):
        d.capsule('Turuncu', (cx + dx * rx * 0.3, y - ry * 0.8), (cx + dx * rx * 0.85, y + ry * 0.7), 1.0, clip='kuyruk', shift=1)


def bebek(d):
    kuyruk(d, 24, 45.5, 7.5, 3.8)
    d.ellipse('Sari', (24, 34), (13.5, 12.2), name='govde', cast=1, lift=0.04)
    d.ellipse('Krem', (24, 43.5), (9.5, 4.6), lift=0.1)
    d.ellipse('Turuncu', (10.5, 38), (3.4, 2.4), rot=25, part='kol_1', line=True)
    d.ellipse('Turuncu', (37.5, 38), (3.4, 2.4), rot=-25, part='kol_2', line=True)
    # tepede minik yuzgec tutami
    d.capsule('Turuncu', (24, 22), (24, 19), (2.4, 1.6), part='tepe', line=True)
    dudak(d, 24, 36)
    d.set_face(24, 30, gap=5, mouth=False)


def diken(d, cx, cy, rx, ry, angs, ln=3.0, w=(2.8, 2.0), name='govde'):
    for ang in angs:
        a = math.radians(ang)
        x0, y0 = cx + math.cos(a) * rx * 0.88, cy + math.sin(a) * ry * 0.88
        x1, y1 = cx + math.cos(a) * (rx + ln), cy + math.sin(a) * (ry + ln)
        d.capsule('Sari', (x0, y0), (x1, y1), w, join=name)
        d.circle('Turuncu', (x1 - math.cos(a) * 0.5, y1 - math.sin(a) * 0.5), 1.3, part='govde', line=False, noshadow=True)


def genc(d):
    kuyruk(d, 28, 52, 8, 3.4)
    d.ellipse('Sari', (28, 39), (14.6, 13.4), name='govde', cast=1, lift=0.04)
    diken(d, 28, 39, 14.6, 13.4, (-165, -135, -105, -75, -45, -15, 10, 170), ln=2.4)
    d.ellipse('Krem', (28, 48.5), (10, 4.8), lift=0.1)
    # sirtta turuncu benekler
    d.circle('Turuncu', (19, 29), 2.2, clip='govde', tone=2)
    d.circle('Turuncu', (36, 28.5), 2.0, clip='govde', tone=2)
    d.circle('Turuncu', (40.5, 38), 1.8, clip='govde', tone=2)
    d.circle('Turuncu', (15.5, 39), 1.6, clip='govde', tone=2)
    d.ellipse('Turuncu', (14, 44), (3.8, 2.6), rot=25, part='kol_1', line=True)
    d.ellipse('Turuncu', (42, 44), (3.8, 2.6), rot=-25, part='kol_2', line=True)
    dudak(d, 28, 41)
    d.set_face(28, 35, gap=5, mouth=False)


def yildiz(d, cx, cy, r):
    for i in range(5):
        a = math.radians(-90 + i * 72)
        d.capsule('Turuncu', (cx, cy), (cx + math.cos(a) * r, cy + math.sin(a) * r), (2.4, 1.3), part='tepe', line=True, name='ys%d' % i if False else None)
    d.circle('Turuncu', (cx, cy), 2.0, part='tepe', lift=0.15)
    d.pix((cx - 1, cy - 1), ['oo'], {'o': 'Parilti'}, part='tepe')


def usta(d):
    kuyruk(d, 32, 58, 10, 3.6)
    d.ellipse('Sari', (32, 42), (19, 15.5), name='govde', cast=1, lift=0.04)
    diken(d, 32, 42, 19, 15.5, (-170, -145, -120, -95, -70, -45, -20, 8, 172), ln=3.2, w=(3.4, 2.4))
    d.ellipse('Krem', (32, 52.5), (12, 5.0), lift=0.1)
    for x, y, r in ((21, 31, 2.8), (43, 30, 2.6), (47, 40, 2.2), (17, 41, 2.0), (32, 28.5, 2.0)):
        d.circle('Turuncu', (x, y), r, clip='govde', tone=2)
    # ikinci sira diken: yuze yakin yanlarda
    d.ellipse('Turuncu', (13, 49), (4.6, 3.2), rot=25, part='kol_1', line=True)
    d.ellipse('Turuncu', (51, 49), (4.6, 3.2), rot=-25, part='kol_2', line=True)
    # basta deniz yildizi toka
    yildiz(d, 40, 22, 4.6)
    dudak(d, 32, 45)
    d.set_face(32, 38, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
