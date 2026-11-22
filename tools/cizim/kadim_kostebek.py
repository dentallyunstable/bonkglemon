# Kadim Kostebek (Tas, epik, gizli). Tarif: TARIFLER.md. Yasli bilge gri kostebek: yuvarlak sari gozluk, kar sakal, sirtinda mor kristal.
# Gozluk yuz istisnasi: goz piksellerinin 1 piksel disinda, yuvarlak cerceve (Sari-3) elle cizilir; goz/yanak/agiza dokunmaz.
# Renk: Tas (tuy), Mor (kristal), Sari (gozluk), Kar (sakal). Parlak: Mor -> Cam. Kaya Kostebegi'nden farki: kask/pembe yildiz burun yok.
import math
PARLA = 'Mor'


def gozluk(d, cx, ey, gap, ew=4, eh=5, kol=True):
    """Iki yuvarlak mercek: goz kutusunun (ew x eh) cevresinde 1 piksel bosluk birakan 1 px cerceve + koprü + sap."""
    lx = int(round(cx - gap / 2.0 - ew))
    rx = lx + ew + gap
    for x0 in (lx, rx):
        a, b, t, bt = x0 - 2, x0 + ew + 1, ey - 2, ey + eh
        for x in range(a + 1, b):
            d.pix((x, t), ['#'], {'#': 'Sari-3'}, part='govde')
            d.pix((x, bt), ['#'], {'#': 'Sari-3'}, part='govde')
        for y in range(t + 1, bt):
            d.pix((a, y), ['#'], {'#': 'Sari-3'}, part='govde')
            d.pix((b, y), ['#'], {'#': 'Sari-3'}, part='govde')
    # burun: kopruden asagi iki piksel
    d.pix((lx + ew + 2, ey + 2), ['##'], {'#': 'Tas-4'}, part='govde')
    # kopru (iki mercek arasi, goz hizasinin ustunde)
    for x in range(lx + ew + 2, rx - 1):
        d.pix((x, ey + 1), ['#'], {'#': 'Sari-3'}, part='govde')
    # saplar
    if kol:
        for x in (lx - 4, lx - 3):
            d.pix((x, ey + 1), ['#'], {'#': 'Sari-3'}, part='govde')
        for x in (rx + ew + 2, rx + ew + 3):
            d.pix((x, ey + 1), ['#'], {'#': 'Sari-3'}, part='govde')


def kristal(d, a, b, w, name=None, part='esya', lift=0.0):
    d.capsule('Mor', a, b, w, part=part, line=True, name=name, lift=lift)


def bebek(d):
    # basin ustunden bakan minik kristal ucu
    kristal(d, (31, 25), (33.5, 19.5), (3.4, 2.2))
    d.pix((33, 20), ['oo'], {'o': 'Parilti'}, part='esya')
    d.ellipse('Tas', (24, 35), (13.5, 11.8), name='kafa', cast=1, lift=0.04)
    # cenede minik beyaz tutam
    d.ellipse('Kar', (24, 45), (3.2, 2.8), name='sakal', line=True, cast=1)
    d.capsule('Kar', (24, 44), (24, 47), 1.0, clip='sakal', shift=1)
    # tombul pencelerle
    d.ellipse('Tas', (13, 44), (4.0, 3.2), part='kol_1', line=True, rot=-20)
    d.ellipse('Tas', (35, 44), (4.0, 3.2), part='kol_2', line=True, rot=20)
    d.pix((11, 46), ['###', '#.#'], {'#': 'Tas-1'}, part='kol_1')
    d.pix((33, 46), ['###', '#.#'], {'#': 'Tas-1'}, part='kol_2')
    gozluk(d, 24, 31, 6)
    d.set_face(24, 31, gap=6)


def genc(d):
    kristal(d, (35, 34), (39, 17), (6.2, 3.6), name='kr', lift=0.05)
    d.capsule('Mor', (36.5, 30), (38.5, 20), 1.0, part='esya', clip='kr', shift=-1)
    d.pix((38, 19), ['oo'], {'o': 'Parilti'}, part='esya')
    d.ellipse('Tas', (28, 41), (15, 13.8), name='kafa', cast=1, lift=0.04)
    d.ellipse('Kar', (28, 50), (8.5, 4.6), name='sakal', line=True, cast=1)
    d.capsule('Kar', (28, 51), (28, 56), (9, 4.6), join='sakal')
    for x in (24.5, 28, 31.5):
        d.capsule('Kar', (x, 47), (x, 54), 1.0, clip='sakal', shift=1)
    # kisa baston
    d.capsule('Sari', (45, 56), (45.5, 40), 1.8, part='esya', name='baston', line=True)
    d.circle('Sari', (45.5, 39.5), 2.6, part='esya', join='baston')
    d.ellipse('Tas', (13.5, 49), (4.3, 3.4), part='kol_1', line=True, rot=-20)
    d.ellipse('Tas', (43.5, 49), (4.3, 3.4), part='kol_2', line=True, rot=20)
    d.pix((11, 51), ['###', '#.#'], {'#': 'Tas-1'}, part='kol_1')
    d.pix((41, 51), ['###', '#.#'], {'#': 'Tas-1'}, part='kol_2')
    gozluk(d, 28, 36, 6)
    d.set_face(28, 36, gap=6)


def usta(d):
    # sirtta kristal demeti (govdenin arkasi)
    for a, b, w in (((20, 34), (13, 19), (7.0, 4.0)), ((28, 30), (26, 11), (8.0, 4.4)), ((38, 30), (40, 12), (8.0, 4.4)), ((46, 34), (52, 22), (7.0, 4.0)), ((33, 26), (33, 8), (6.6, 3.6))):
        kristal(d, a, b, w, name='k%d' % int(a[0]))
    for x0, y0, x1, y1, n in ((15, 30, 14, 22, 20), (27, 26, 26, 16, 28), (39, 26, 40, 17, 38), (48, 30, 51, 26, 46)):
        d.capsule('Mor', (x0, y0), (x1, y1), 1.0, part='esya', clip='k%d' % n, shift=-1)
    d.pix((25, 14), ['oo'], {'o': 'Parilti'}, part='esya')
    d.pix((39, 16), ['oo'], {'o': 'Parilti'}, part='esya')
    d.ellipse('Tas', (32, 46), (17.5, 15.4), name='govde', cast=1)
    d.ellipse('Tas', (32, 35.5), (14.4, 13.5), name='kafa', join='govde')
    # yere degen sakal
    d.ellipse('Kar', (32, 54), (10.5, 5.2), name='sakal', line=True, cast=1)
    d.capsule('Kar', (32, 55), (32, 61.5), (12, 5.6), join='sakal')
    for x, y0, y1 in ((26.5, 51, 57), (29.5, 52, 60), (32, 53, 61), (34.5, 52, 60), (37.5, 51, 57)):
        d.capsule('Kar', (x, y0), (x, y1), 1.0, clip='sakal', shift=1)
    # baston: ucunda parlayan kristal
    d.capsule('Sari', (54, 58), (54, 26), 2.0, part='esya', name='baston', line=True)
    kristal(d, (54, 26), (54, 17), (5.6, 3.4), name='bk', lift=0.15)
    d.pix((53, 18), ['oo', 'o.'], {'o': 'Parilti'}, part='esya')
    d.ellipse('Tas', (16, 51), (5.0, 4.2), part='kol_1', line=True, rot=-20)
    d.ellipse('Tas', (50, 51), (5.0, 4.2), part='kol_2', line=True, rot=20)
    d.pix((13, 53), ['#####', '#.#.#'], {'#': 'Tas-1'}, part='kol_1')
    d.pix((47, 53), ['#####', '#.#.#'], {'#': 'Tas-1'}, part='kol_2')
    gozluk(d, 32, 31, 7, ew=5, eh=6)
    d.set_face(32, 31, gap=7)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
