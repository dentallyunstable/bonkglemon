# Kar Pengueni (Buz, siradan). Tarif: TARIFLER.md. Karnin ustunde kayan tombul penguen: bebek gri tuy, genc atkili, usta beresi ve yanak lekesi.
# Renk: Lacivert (sirt; bebekte Tas tuy), Kirmizi (atki, bere), Turuncu (gaga, ayak, yanak); karin Kar. Parlak: Lacivert -> Mor.
PARLA = 'Turuncu'


def ayak(d, cx, y, dx=9.5, w=4.6):
    for s, part in ((-1, 'kol_1'), (1, 'kol_2')):
        pass
    d.ellipse('Turuncu', (cx - dx, y), (w, 2.8), name='f1', line=True, noshadow=True)
    d.ellipse('Turuncu', (cx + dx, y), (w, 2.8), name='f2', line=True, noshadow=True)


def gaga(d, cx, y, w=2.6):
    d.ellipse('Turuncu', (cx, y), (w, 1.5), line=True, noshadow=True)


def bebek(d):
    # kocaman ayaklar altta, govdeden once (arkada)
    ayak(d, 24, 45.5, 8.5, 5.2)
    d.ellipse('Tas', (24, 35.5), (13.5, 11.3), name='kafa', cast=1, lift=0.05)
    # pofuduk tuy tutamlari
    d.circle('Tas', (24, 25), 3.2, join='kafa')
    d.circle('Tas', (19.5, 25.5), 3, join='kafa')
    d.circle('Tas', (28.5, 25.5), 3, join='kafa')
    d.ellipse('Kar', (24, 38.5), (10.5, 7.8), name='karin', lift=0.1)
    d.ellipse('Tas', (12, 39), (2.6, 4.4), rot=15, part='kol_1', line=True)
    d.ellipse('Tas', (36, 39), (2.6, 4.4), rot=-15, part='kol_2', line=True)
    gaga(d, 24, 38.5, 2.4)
    d.set_face(24, 33, gap=6, mouth=False)


def genc(d):
    cx = 28
    ayak(d, cx, 51, 9, 5.2)
    d.ellipse('Lacivert', (cx, 38), (15, 15), name='govde', cast=1, lift=0.03)
    d.ellipse('Kar', (cx, 42), (10.5, 10.5), name='karin', lift=0.12)
    d.ellipse('Kar', (cx, 34), (10.5, 7), join='karin')
    d.ellipse('Lacivert', (12.8, 41), (3.2, 6.5), rot=12, part='kol_1', line=True)
    d.ellipse('Lacivert', (43.2, 41), (3.2, 6.5), rot=-12, part='kol_2', line=True)
    # orgu atki: boyunda, yuzun altinda
    d.ellipse('Kirmizi', (cx, 44.5), (11.5, 3.0), name='atki', line=True, cast=1)
    for x in (-8, -3, 3, 8):
        d.capsule('Kirmizi', (cx + x - 0.5, 42.8), (cx + x + 0.5, 46.2), 0.9, clip='atki', shift=1)
    d.capsule('Kirmizi', (cx + 6, 46), (cx + 8.5, 52), (3.6, 3.0), part='esya', line=True, name='uc')
    d.capsule('Kirmizi', (cx + 7, 48), (cx + 8, 50.5), 0.9, clip='uc', shift=1, part='esya')
    gaga(d, cx, 35.8, 2.4)
    d.set_face(cx, 30, gap=6, mouth=False)


def usta(d):
    cx = 32
    ayak(d, cx, 65, 10.5, 6.2)
    d.ellipse('Lacivert', (cx, 41), (18.5, 26), name='govde', cast=1, lift=0.03)
    d.ellipse('Kar', (cx, 48), (13.5, 18), name='karin', lift=0.15)
    d.ellipse('Kar', (cx, 36), (13.5, 9), join='karin')
    # kayganlik parlamasi karinda
    d.pix((cx - 8, 59), ['oo', 'o.'], {'o': 'Parilti'})
    d.ellipse('Lacivert', (13, 49), (4.0, 9.5), rot=12, part='kol_1', line=True)
    d.ellipse('Lacivert', (51, 49), (4.0, 9.5), rot=-12, part='kol_2', line=True)
    # turuncu yanak lekeleri (yuz alaninin disinda, kenarda)
    d.circle('Turuncu', (cx - 13, 39), 2.8, clip='govde', tone=2)
    d.circle('Turuncu', (cx + 13, 39), 2.8, clip='govde', tone=2)
    d.ellipse('Kirmizi', (cx, 51), (14.5, 3.4), name='atki', line=True, cast=1)
    for x in (-10, -5, 0, 5, 10):
        d.capsule('Kirmizi', (cx + x - 0.5, 49.2), (cx + x + 0.5, 52.8), 0.9, clip='atki', shift=1)
    d.capsule('Kirmizi', (cx + 8, 52), (cx + 11, 61), (4.0, 3.2), part='esya', line=True, name='uc')
    # ponponlu bere
    d.ellipse('Kirmizi', (cx, 22.5), (14, 8.5), name='bere', inbox=(0, 0, 63, 26.5), cast=1, line=True, part='tepe')
    d.rect('Kirmizi', (cx - 15, 23.5, cx + 15, 27), rad=1.5, name='kivrik', line=True, part='tepe', lift=0.1)
    for x in (-10, -6, -2, 2, 6, 10):
        d.capsule('Kirmizi', (cx + x, 24), (cx + x, 26.5), 0.9, clip='kivrik', shift=1, part='tepe')
    d.circle('Kar', (cx, 13), 3.6, part='tepe', line=True, name='pon')
    d.circle('Kar', (cx - 1, 12), 1.2, clip='pon', shift=-1, part='tepe')
    gaga(d, cx, 38.5, 2.8)
    d.set_face(cx, 32, gap=7, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---- yandan gorunum (sola bakar) ----
def ayak_yan(d, x1, x2, y, w):
    d.ellipse('Turuncu', (x2, y), (w, 2.8), part='kol_2', line=True, noshadow=True, lift=-0.1)
    d.ellipse('Turuncu', (x1 - 1, y), (w, 2.8), part='kol_1', line=True, noshadow=True)


def bebek_yan(d):
    ayak_yan(d, 17, 28, 45.5, 5.0)
    d.ellipse('Tas', (23, 35.5), (13.5, 11.3), name='kafa', cast=1, lift=0.05)
    d.circle('Tas', (22, 25), 3.4, join='kafa')
    d.circle('Tas', (27, 25.8), 3.0, join='kafa')
    d.ellipse('Kar', (15, 38.5), (8.5, 8), clip='kafa', shift=0, lift=0.1)
    d.ellipse('Tas', (29, 39), (3.0, 4.6), rot=-20, line=True, lift=-0.08)
    d.ellipse('Turuncu', (9.5, 38), (2.6, 1.6), line=True, noshadow=True)
    d.set_face_side(14, 32)


def genc_yan(d):
    ayak_yan(d, 21, 31, 51, 5.0)
    d.ellipse('Lacivert', (28, 38), (14, 15), name='govde', cast=1, lift=0.03)
    d.ellipse('Kar', (20, 43), (9.5, 11), clip='govde', shift=0, lift=0.12)
    d.ellipse('Kar', (18, 33), (6.5, 6), clip='govde', shift=0, lift=0.12)
    d.ellipse('Lacivert', (31, 41), (3.4, 6.6), rot=-12, line=True, lift=-0.1)
    # atki
    d.ellipse('Kirmizi', (27, 44.5), (11.5, 3.2), rot=-8, name='atki', line=True, cast=1)
    for x in (-8, -3, 3, 8):
        d.capsule('Kirmizi', (27 + x - 0.5, 42.8), (27 + x + 0.5, 46.2), 0.9, clip='atki', shift=1)
    d.capsule('Kirmizi', (35, 45.5), (38.5, 52), (3.6, 3.0), part='esya', line=True, name='uc')
    d.capsule('Kirmizi', (36, 47.5), (37.5, 50), 0.9, clip='uc', shift=1, part='esya')
    d.ellipse('Turuncu', (13, 36), (2.6, 1.6), line=True, noshadow=True)
    d.set_face_side(16, 31)


def usta_yan(d):
    ayak_yan(d, 24, 36, 65, 6.0)
    d.ellipse('Lacivert', (31, 41), (17.5, 26), name='govde', cast=1, lift=0.03)
    d.ellipse('Kar', (21, 48), (10.5, 17.5), clip='govde', shift=0, lift=0.15)
    d.ellipse('Kar', (20, 35), (8, 8), clip='govde', shift=0, lift=0.15)
    d.pix((17, 58), ['oo', 'o.'], {'o': 'Parilti'})
    d.ellipse('Lacivert', (35, 49), (4.2, 9.5), rot=-10, line=True, lift=-0.1)
    d.circle('Turuncu', (24, 41), 2.8, clip='govde', tone=2)
    d.ellipse('Kirmizi', (30, 51), (14.5, 3.4), rot=-8, name='atki', line=True, cast=1)
    for x in (-10, -5, 0, 5, 10):
        d.capsule('Kirmizi', (30 + x - 0.5, 49.2), (30 + x + 0.5, 52.8), 0.9, clip='atki', shift=1)
    d.capsule('Kirmizi', (40, 52), (43, 61), (4.0, 3.2), part='esya', line=True, name='uc')
    # ponponlu bere
    d.ellipse('Kirmizi', (30, 22.5), (13.5, 8.5), name='bere', inbox=(0, 0, 63, 26.5), cast=1, line=True, part='tepe')
    d.rect('Kirmizi', (15, 23.5, 45, 27), rad=1.5, name='kivrik', line=True, part='tepe', lift=0.1)
    for x in (-10, -6, -2, 2, 6, 10):
        d.capsule('Kirmizi', (30 + x, 24), (30 + x, 26.5), 0.9, clip='kivrik', shift=1, part='tepe')
    d.circle('Kar', (31, 13), 4.2, part='tepe', line=True, name='pon')
    d.circle('Kar', (30, 12), 1.2, clip='pon', shift=-1, part='tepe')
    d.ellipse('Turuncu', (13, 38), (3.0, 1.8), line=True, noshadow=True)
    d.set_face_side(16, 32)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
