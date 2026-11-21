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
