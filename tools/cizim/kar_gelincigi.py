# Kar Gelincigi (Buz, siradan). Tarif: TARIFLER.md. Arka ayaklari ustunde dik duran beyaz gelincik; uzun kuyrugu atki gibi boynunda, ucu kara.
# Renk: Kar (tuy), Komur (kuyruk ucu), Pembe (kulak ici). Bebek kisa/tombul, genc kuyruk 1 tur, usta 2 tur + omuzdan sarkan uc.
PARLA = 'Pembe'


def kulaklar(d, cx, y, dx, r):
    d.circle('Kar', (cx - dx, y), r, part='kulak_1', name='k1', line=True, lift=0.1)
    d.circle('Pembe', (cx - dx, y + 0.5), r - 1.6, part='kulak_1', clip='k1', tone=1)
    d.circle('Kar', (cx + dx, y), r, part='kulak_2', name='k2', line=True, lift=0.1)
    d.circle('Pembe', (cx + dx, y + 0.5), r - 1.6, part='kulak_2', clip='k2', tone=1)


def bebek(d):
    # kisa kuyruk yanda, ucu kara
    d.curve('Kar', [(33, 46), (40, 45), (40, 38)], 4.6, part='kuyruk', name='ku', line=True, lift=0.1)
    d.circle('Komur', (40, 36.5), 2.4, part='kuyruk', line=True, tone=2)
    kulaklar(d, 24, 25, 8.6, 3.8)
    d.ellipse('Kar', (24, 35.5), (12.6, 13.2), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (24, 43), (8, 5.5), name='karin', lift=0.25)
    # patiler karinda
    d.circle('Kar', (19.5, 44), 2.6, part='kol_1', line=True, lift=0.1)
    d.circle('Kar', (28.5, 44), 2.6, part='kol_2', line=True, lift=0.1)
    d.set_face(24, 31, gap=5)


def genc(d):
    cx = 28
    kulaklar(d, cx, 21.5, 8.6, 4.0)
    d.ellipse('Kar', (cx - 5.5, 53), (4.2, 2.4), name='a1', line=True, noshadow=True, lift=0.1)
    d.ellipse('Kar', (cx + 5.5, 53), (4.2, 2.4), name='a2', line=True, noshadow=True, lift=0.1)
    d.ellipse('Kar', (cx, 38), (12.4, 16.8), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 46), (9, 7.5), name='karin', lift=0.25)
    d.circle('Kar', (cx - 5, 47), 2.8, part='kol_1', line=True, lift=0.1)
    d.circle('Kar', (cx + 5, 47), 2.8, part='kol_2', line=True, lift=0.1)
    # kuyruk: boyna bir tur
    d.ellipse('Kar', (cx, 43), (13, 4.2), name='sar', part='kuyruk', line=True, cast=1, lift=-0.12)
    for x in (-8, -3, 3, 8):
        d.capsule('Kar', (cx + x - 0.5, 40.3), (cx + x + 0.5, 45.5), 1.0, part='kuyruk', clip='sar', shift=1)
    d.capsule('Kar', (cx + 9, 44), (cx + 12, 50.5), (3.8, 3.4), part='kuyruk', name='uc', line=True, lift=-0.12)
    d.capsule('Komur', (cx + 11.5, 49.5), (cx + 13, 54.6), 3.6, part='kuyruk', line=True, noshadow=True)
    d.set_face(cx, 33, gap=5)


def usta(d):
    cx = 32
    kulaklar(d, cx, 19.5, 10, 4.6)
    d.ellipse('Kar', (cx - 7, 60.5), (5, 2.8), name='a1', line=True, noshadow=True, lift=0.1)
    d.ellipse('Kar', (cx + 7, 60.5), (5, 2.8), name='a2', line=True, noshadow=True, lift=0.1)
    d.ellipse('Kar', (cx, 40), (14.8, 19.6), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (cx, 50), (11.5, 10), name='karin', lift=0.3)
    # kabarik gogus tuyu
    for x, y in ((-6, 56), (-2, 58), (2, 58), (6, 56)):
        d.circle('Kar', (cx + x, y), 3.0, join='karin')
    d.circle('Kar', (cx - 8, 52), 3.3, part='kol_1', line=True, lift=0.1)
    d.circle('Kar', (cx + 8, 52), 3.3, part='kol_2', line=True, lift=0.1)
    # kuyruk: iki tur
    d.ellipse('Kar', (cx, 48.2), (15.4, 4.2), name='sar2', part='kuyruk', line=True, cast=1, lift=-0.15)
    d.ellipse('Kar', (cx, 44), (14.6, 4.2), name='sar1', part='kuyruk', line=True, cast=1, lift=-0.08)
    for x in (-10, -5, 0, 5, 10):
        d.capsule('Kar', (cx + x - 0.5, 41), (cx + x + 0.5, 46.5), 1.0, part='kuyruk', clip='sar1', shift=1)
        d.capsule('Kar', (cx + x + 1.5, 45.7), (cx + x + 2.5, 51.2), 1.0, part='kuyruk', clip='sar2', shift=1)
    # uc omuzdan sarkar
    d.capsule('Kar', (cx - 11, 46), (cx - 15.5, 57), (4.2, 3.8), part='kuyruk', name='uc', line=True, lift=-0.12)
    d.capsule('Komur', (cx - 15, 55), (cx - 16.2, 61.5), (4.2, 3.8), part='kuyruk', line=True, noshadow=True)
    d.set_face(cx, 33, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def kulak_yan_k(d, x, y, r, part, name, back=False):
    d.circle('Kar', (x, y), r, part=part, name=name, line=True, lift=-0.08 if back else 0.1)
    d.circle('Pembe', (x - 0.3, y + 0.5), r - 1.6, part=part, clip=name, tone=2 if back else 1)


def bebek_yan(d):
    d.curve('Kar', [(33, 46), (40, 45), (41, 37)], 4.6, part='kuyruk', name='ku', line=True, lift=0.1)
    d.circle('Komur', (41, 35.5), 2.6, part='kuyruk', line=True, tone=2)
    kulak_yan_k(d, 30, 25, 4.0, 'kulak_2', 'k2', back=True)
    d.capsule('Kar', (30, 46), (31, 49), 2.8, part='kol_2', line=True, lift=-0.1)
    d.ellipse('Kar', (26, 37), (13.5, 12.5), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (14.5, 39), (4.2, 3.2), join='g')
    d.pix2((5, 19), ['#'], {'#': 'Komur-4'})
    kulak_yan_k(d, 22, 24.5, 4.2, 'kulak_1', 'k1')
    d.capsule('Kar', (20, 46), (19, 49), 2.8, part='kol_1', line=True, lift=0.1)
    d.set_face_side(16, 32)


def genc_yan(d):
    kulak_yan_k(d, 36, 21.5, 4.6, 'kulak_2', 'k2', back=True)
    d.capsule('Kar', (34, 52), (35, 56.5), 3.2, part='kol_2', line=True, lift=-0.1)
    d.ellipse('Kar', (31, 39.5), (13.5, 15), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (17.5, 37), (5, 4), join='g')
    d.circle('Kar', (23, 33), 9, join='g')
    d.pix2((7, 18), ['#'], {'#': 'Komur-4'})
    kulak_yan_k(d, 25.5, 21.5, 4.6, 'kulak_1', 'k1')
    # kuyruk boyna bir tur, ucu arkada sarkar
    d.ellipse('Kar', (31, 45), (14.5, 4.4), name='sar', part='kuyruk', line=True, cast=1, lift=-0.12)
    for x in (-8, -3, 3, 8):
        d.capsule('Kar', (31 + x - 0.5, 42.3), (31 + x + 0.5, 47.5), 1.0, part='kuyruk', clip='sar', shift=1)
    d.capsule('Kar', (41, 46), (44, 52.5), (3.8, 3.4), part='kuyruk', name='uc', line=True, lift=-0.12)
    d.capsule('Komur', (43.5, 51.5), (45, 56.6), 3.6, part='kuyruk', line=True, noshadow=True)
    d.capsule('Kar', (25, 52), (24, 56.5), 3.2, part='kol_1', line=True, lift=0.1)
    d.set_face_side(19, 32)


def usta_yan(d):
    kulak_yan_k(d, 41, 19.5, 5.2, 'kulak_2', 'k2', back=True)
    d.capsule('Kar', (37, 58), (38, 62), 3.6, part='kol_2', line=True, lift=-0.1)
    d.ellipse('Kar', (34, 42), (15.5, 18.5), name='g', cast=1, lift=0.2)
    d.ellipse('Kar', (19.5, 38), (6, 4.6), join='g')
    d.circle('Kar', (25, 33), 10, join='g')
    d.pix2((7, 20), ['#'], {'#': 'Komur-4'})
    d.ellipse('Kar', (31, 52), (9, 8), name='karin', join='g', lift=0.3)
    for x, y in ((24, 57), (28, 59), (32, 59.5)):
        d.circle('Kar', (x, y), 3.0, join='g')
    kulak_yan_k(d, 28.5, 19, 5.2, 'kulak_1', 'k1')
    # kuyruk iki tur, ucu omuzdan arkaya sarkar
    d.ellipse('Kar', (33, 51), (16, 4.2), name='sar2', part='kuyruk', line=True, cast=1, lift=-0.15)
    d.ellipse('Kar', (33, 46.5), (15.4, 4.2), name='sar1', part='kuyruk', line=True, cast=1, lift=-0.08)
    for x in (-10, -5, 0, 5, 10):
        d.capsule('Kar', (33 + x - 0.5, 43.5), (33 + x + 0.5, 49), 1.0, part='kuyruk', clip='sar1', shift=1)
        d.capsule('Kar', (33 + x + 1.5, 48.5), (33 + x + 2.5, 54), 1.0, part='kuyruk', clip='sar2', shift=1)
    d.capsule('Kar', (44, 47), (47, 56), (4.2, 3.8), part='kuyruk', name='uc', line=True, lift=-0.12)
    d.capsule('Komur', (46.5, 55), (47.5, 61.5), (4.2, 3.8), part='kuyruk', line=True, noshadow=True)
    d.capsule('Kar', (26, 58), (25, 62), 3.6, part='kol_1', line=True, lift=0.1)
    d.set_face_side(20, 33)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
