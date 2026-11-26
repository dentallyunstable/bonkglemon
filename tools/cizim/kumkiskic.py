# Kumkiskac (Kum, siradan). Tarif: TARIFLER.md. Kuma gomulen tombul akrep; kuyrugu basinin ustunde soru isareti, ucu yuvarlak yesil damla.
# Renk: Turuncu (govde, kiskac), Sari (kum, karin), Cam (damla, boncuk). Parlak: Turuncu -> Lacivert.
PARLA = 'Cam'


def damla(d, x, y, r, parilti=2):
    d.circle('Cam', (x, y), r, part='kuyruk', line=True)
    d.pix((round(x - r * 0.55), round(y - r * 0.55)), ['o' * parilti], {'o': 'Parilti'}, part='kuyruk')


def kiskac(d, side, cx, x, y, r, nm, heart=False):
    """side 1 sol(kol_1), 2 sag. Koordinatlar sol icin, sag aynalanir. Ucu oyuk kiskac."""
    X = x if side == 1 else 2 * cx - x
    s = -1 if side == 1 else 1
    p = 'kol_%d' % side
    d.circle('Turuncu', (X, y + r * 0.3), r * 0.9, part=p, line=True, name=nm)
    d.circle('Turuncu', (X - r * 0.5, y - r * 0.55), r * 0.66, part=p, join=nm)
    d.circle('Turuncu', (X + r * 0.5, y - r * 0.55), r * 0.66, part=p, join=nm)
    d.poly('Turuncu', [(X - 0.8, y - r * 1.5), (X + 0.8, y - r * 1.5), (X, y - r * 0.35)], part=p, sub=nm)


def bebek(d):
    d.ellipse('Turuncu', (24, 34), (13, 10.2), name='kafa', cast=1)
    d.curve('Turuncu', [(31, 27), (35, 20), (31, 14.5), (25, 17)], (3.6, 2.8), part='kuyruk', line=True)
    damla(d, 24, 17.5, 3.2)
    kiskac(d, 1, 24, 9.5, 37, 4.8, 'k1')
    kiskac(d, 2, 24, 9.5, 37, 4.8, 'k2')
    d.ellipse('Sari', (24, 45.5), (13.5, 6.8), name='kum', cast=1, line=True)
    d.circle('Sari', (14, 43), 2.4, part='govde', clip='kum', shift=-1)
    d.capsule('Sari', (28, 48), (34, 49), 1.2, part='govde', clip='kum', shift=1)
    d.set_face(24, 31, gap=5)


def genc(d):
    cx = 28
    # sirtta uc zirh plakasi (kafanin ustunden gorunur)
    for x, y, w in ((17, 30, 4.2), (28, 26, 5.0), (39, 30, 4.2)):
        d.rect('Turuncu', (x - w, y - 3, x + w, y + 3), rad=2.5, part='govde', line=True, lift=-0.12, name='pl%d' % x)
        d.capsule('Turuncu', (x - w + 2, y - 0.5), (x + w - 2, y - 0.5), 1.0, part='govde', clip='pl%d' % x, shift=1)
    d.ellipse('Turuncu', (28, 40), (14, 12), name='kafa', cast=1)
    d.curve('Turuncu', [(39, 33), (44, 24), (41, 13), (33, 14), (29.5, 15.5)], (4.2, 3.2), part='kuyruk', line=True)
    damla(d, 29.5, 15.5, 3.8)
    kiskac(d, 1, cx, 11, 43, 5.8, 'k1')
    kiskac(d, 2, cx, 11, 43, 5.8, 'k2')
    # karin ve kum
    d.ellipse('Sari', (28, 49), (11, 4.6), part='govde', line=True, name='karin', cast=1)
    d.ellipse('Sari', (28, 53), (15, 3.4), part='govde', line=True, name='kum', lift=-0.05)
    d.set_face(28, 36, gap=5)


def usta(d):
    cx = 32
    # zirh plakalari: kenarinda turkuaz boncuk
    for x, y, w, h in ((16.5, 33, 5.6, 4.6), (32, 27.5, 7, 5), (47.5, 33, 5.6, 4.6)):
        d.rect('Turuncu', (x - w, y - h, x + w, y + h), rad=3, part='govde', line=True, lift=-0.12, name='pl%d' % x)
        d.capsule('Turuncu', (x - w + 2, y - 0.5), (x + w - 2, y - 0.5), 1.0, part='govde', clip='pl%d' % x, shift=1)
        for bx in (x - w + 0.5, x + w - 1.5):
            d.rect('Cam', (bx, y - h + 1, bx + 1.4, y - h + 2.4), part='govde')
    d.ellipse('Turuncu', (32, 46), (16.5, 15.5), name='kafa', cast=1)
    # kuyruk: uzun soru isareti, ucunda buyuk mucevher damla
    d.curve('Turuncu', [(46, 38), (54, 29), (52, 12), (43, 8.5), (36, 13)], (5.2, 3.4), part='kuyruk', line=True)
    d.circle('Cam', (35, 14), 5.0, part='kuyruk', line=True)
    d.pix((31, 11), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    d.pix((36, 16), ['#'], {'#': 'Cam-4'}, part='kuyruk')
    kiskac(d, 1, cx, 11.5, 50, 6.0, 'k1', heart=True)
    kiskac(d, 2, cx, 11.5, 50, 6.0, 'k2', heart=True)
    d.ellipse('Sari', (32, 55), (12.5, 5.6), part='govde', line=True, name='karin', cast=1)
    d.ellipse('Sari', (32, 60.5), (17.5, 3.6), part='govde', line=True, name='kum', lift=-0.05)
    d.set_face(32, 41, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def kiskac_yan(d, x, y, r, nm, part, lift=0.0):
    """Yandan kiskac: yuvarlak taban, solda iki cene (ust ve alt), arada oyuk."""
    d.circle('Turuncu', (x, y), r * 0.95, part=part, line=True, name=nm, lift=lift)
    d.circle('Turuncu', (x - r * 0.85, y - r * 0.62), r * 0.55, part=part, join=nm)
    d.circle('Turuncu', (x - r * 0.85, y + r * 0.62), r * 0.55, part=part, join=nm)
    d.rect('Turuncu', (x - r * 1.9, y - r * 0.18, x - r * 0.75, y + r * 0.18), part=part, sub=nm)


def bebek_yan(d):
    d.curve('Turuncu', [(33, 31), (38, 24), (33, 15), (26, 17)], (3.8, 3.0), part='kuyruk', line=True)
    damla(d, 25, 18, 3.2)
    kiskac_yan(d, 14, 35, 4.2, 'k2', 'kol_2', lift=-0.2)
    d.ellipse('Turuncu', (26, 34), (13, 10.2), name='kafa', cast=1)
    d.ellipse('Sari', (25, 45.5), (14, 6.8), name='kum', cast=1, line=True)
    d.circle('Sari', (35, 43), 2.4, part='govde', clip='kum', shift=-1)
    d.capsule('Sari', (14, 48), (20, 49), 1.2, part='govde', clip='kum', shift=1)
    kiskac_yan(d, 14, 41, 4.8, 'k1', 'kol_1', lift=0.1)
    d.set_face_side(18, 31)


def genc_yan(d):
    for x, y, w in ((31, 28, 4.6), (40, 33, 4.0)):
        d.rect('Turuncu', (x - w, y - 3, x + w, y + 3), rad=2.5, part='govde', line=True, lift=-0.12, name='pl%d' % x)
        d.capsule('Turuncu', (x - w + 2, y - 0.5), (x + w - 2, y - 0.5), 1.0, part='govde', clip='pl%d' % x, shift=1)
    d.curve('Turuncu', [(41, 36), (47, 28), (43, 15), (35, 15), (31, 17)], (4.4, 3.2), part='kuyruk', line=True)
    damla(d, 31, 17, 3.8)
    kiskac_yan(d, 15, 39, 5.0, 'k2', 'kol_2', lift=-0.2)
    d.ellipse('Turuncu', (29, 40), (14, 12), name='kafa', cast=1)
    d.rect('Turuncu', (20, 29, 28, 35), rad=2.5, part='govde', line=True, lift=-0.12, name='pl20')
    d.capsule('Turuncu', (22, 32), (26, 32), 1.0, part='govde', clip='pl20', shift=1)
    d.ellipse('Sari', (29, 49), (11, 4.6), part='govde', line=True, name='karin', cast=1)
    d.ellipse('Sari', (29, 53), (16, 3.4), part='govde', line=True, name='kum', lift=-0.05)
    kiskac_yan(d, 14, 46, 5.8, 'k1', 'kol_1', lift=0.1)
    d.set_face_side(19, 36)


def usta_yan(d):
    for x, y, w, h in ((27, 31, 5.6, 4.6), (37, 28, 6.4, 5), (47, 34, 5.0, 4.4)):
        d.rect('Turuncu', (x - w, y - h, x + w, y + h), rad=3, part='govde', line=True, lift=-0.12, name='pl%d' % x)
        d.capsule('Turuncu', (x - w + 2, y - 0.5), (x + w - 2, y - 0.5), 1.0, part='govde', clip='pl%d' % x, shift=1)
        d.rect('Cam', (x - w + 0.5, y - h + 1, x - w + 1.9, y - h + 2.4), part='govde')
    d.curve('Turuncu', [(48, 40), (57, 31), (55, 13), (45, 9), (37, 14)], (5.2, 3.4), part='kuyruk', line=True)
    d.circle('Cam', (36, 15), 5.0, part='kuyruk', line=True)
    d.pix((32, 12), ['oo', 'o.'], {'o': 'Parilti'}, part='kuyruk')
    d.pix((37, 17), ['#'], {'#': 'Cam-4'}, part='kuyruk')
    kiskac_yan(d, 16, 44, 5.6, 'k2', 'kol_2', lift=-0.2)
    d.ellipse('Turuncu', (34, 46), (16.5, 15.5), name='kafa', cast=1)
    d.ellipse('Sari', (34, 55), (12.5, 5.6), part='govde', line=True, name='karin', cast=1)
    d.ellipse('Sari', (34, 60.5), (18, 3.6), part='govde', line=True, name='kum', lift=-0.05)
    kiskac_yan(d, 15, 52, 6.4, 'k1', 'kol_1', lift=0.1)
    d.set_face_side(21, 41)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
