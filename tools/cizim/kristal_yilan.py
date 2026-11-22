# Kristal Yilan (Tas, efsanevi). Tarif: TARIFLER.md. Kendi ustune halka halka sarilip dik duran guler yuzlu mor yilan; koca kafa, kuyruk ucu kristal cingirak.
# Renk: Mor (govde), Gok (kristal), Sari (altin halka, ustada boyunda). Halkalar kafanin arkasinda/altinda ust uste. Parlak: Mor -> Cimen (Cam).
import math
PARLA = 'Gok'


def kristal(d, c, h=5.0, w=2.6, part='govde', name=None, lift=0.1, noshadow=True):
    """Dik duran kristal: ucgen uclu, altigen govde."""
    x, y = c
    pts = [(x, y - h), (x + w, y - h * 0.45), (x + w, y + h * 0.55), (x, y + h), (x - w, y + h * 0.55), (x - w, y - h * 0.45)]
    d.poly('Gok', pts, part=part, line=True, name=name, lift=lift, noshadow=noshadow)


def halka(d, c, rx, ry, nm, band=True, lift=-0.08, part='govde', **kw):
    d.ellipse('Mor', c, (rx, ry), name=nm, lift=lift, part=part, **kw)
    if band:  # karin cizgileri
        for k, sh in ((-0.45, -1), (0.05, 1)):
            d.curve('Mor', [(c[0] - rx * 0.85, c[1] + ry * (0.4 + k)), (c[0], c[1] + ry * (0.8 + k)), (c[0] + rx * 0.85, c[1] + ry * (0.4 + k))],
                    1.0, clip=nm, shift=sh, part=part)


def elmas(d, x, y, tone='Gok-2'):
    d.pix((x - 1, y - 1), ['.#.', '###', '.#.'], {'#': tone})


def dil(d, x, y, long=3):
    """Catalli dil, cene altindan sarkar."""
    rows = ['#.#', '.#.'] + ['.#.'] * (long - 2)
    d.pix((x - 1, y), rows, {'#': 'Pembe-2'})


def bebek(d):
    cx = 24
    # kuyruk, halkanin sagindan kivrilip kristalle biter
    d.curve('Mor', [(33, 46), (40, 46.5), (42, 41)], (4.0, 2.2), part='kuyruk', line=True, lift=-0.08)
    kristal(d, (42, 36.5), 3.8, 2.0, part='kuyruk', name='ck')
    halka(d, (cx, 43), 13.5, 6.3, 'c1', cast=1)
    elmas(d, 15, 45)
    elmas(d, 33, 46)
    d.ellipse('Mor', (cx, 31.5), (11.6, 10), name='kafa', cast=1, lift=0.06)
    d.set_face(cx, 29.5, gap=5)
    dil(d, cx, 41, 3)


def genc(d):
    cx = 27
    # uc bolumlu cingirak, kuyruktan yukari
    d.curve('Mor', [(40, 52), (47, 52), (48, 46)], (4.4, 2.6), part='kuyruk', line=True, lift=-0.1)
    for i, (y, h, w) in enumerate(((43, 3.4, 1.8), (38.5, 4.2, 2.3), (33, 5.0, 2.8))):
        kristal(d, (48, y), h, w, part='kuyruk', name='ck%d' % i, lift=0.08 + 0.04 * i)
    halka(d, (cx, 49), 15.5, 6.2, 'c1', cast=1)
    elmas(d, 17, 51)
    elmas(d, 37, 51)
    # sirtta kristal pullar (halka kenarlarinda)
    for x, y in ((13.5, 47), (40.5, 47), (16, 41.5), (38, 41.5)):
        kristal(d, (x, y), 3.2, 1.7, name='pl_%d_%d' % (x, y), lift=0.0)
    halka(d, (cx, 42.5), 12.6, 5.4, 'c2', cast=1, lift=-0.04)
    d.ellipse('Mor', (cx, 31), (12.6, 10.6), name='kafa', cast=1, lift=0.06)
    elmas(d, 21, 45)
    elmas(d, 33, 45)
    d.set_face(cx, 29, gap=5)
    dil(d, cx, 40, 3)


def usta(d):
    cx = 31
    # buyuk uc bolumlu cingirak
    d.curve('Mor', [(46, 59), (54, 58), (55, 52)], (5.0, 3.0), part='kuyruk', line=True, lift=-0.1)
    for i, (y, h, w) in enumerate(((49, 4.2, 2.2), (43.5, 5.2, 2.8), (37, 6.4, 3.4))):
        kristal(d, (55, y), h, w, part='kuyruk', name='ck%d' % i, lift=0.06 + 0.05 * i)
    halka(d, (cx, 55), 18, 6.8, 'c1', cast=1, lift=-0.12)
    for x in (18, 31, 44):
        elmas(d, x, 58 if x == 31 else 56)
    halka(d, (cx, 49), 14.8, 6.0, 'c2', cast=1, lift=-0.08)
    for x in (22, 40):
        elmas(d, x, 51)
    # kafanin arkasinda kristal tepelik
    for i, (dx, dy, h, w, a) in enumerate(((-11, 21, 5.6, 2.6, 0), (-6, 16, 6.6, 3.0, 0), (0, 13.5, 7.6, 3.4, 0), (6, 16, 6.6, 3.0, 0), (11, 21, 5.6, 2.6, 0))):
        kristal(d, (cx + dx, dy + 2), h, w, part='tepe', name='tp%d' % i, lift=0.04 + 0.04 * (3 - abs(i - 2)))
    halka(d, (cx, 43), 11.8, 5.4, 'c3', cast=1, band=False, lift=-0.02)
    d.ellipse('Mor', (cx, 31.5), (13.6, 11.6), name='kafa', cast=1, lift=0.06)
    # altin boyun halkasi
    d.curve('Sari', [(cx - 10, 40.5), (cx, 44.5), (cx + 10, 40.5)], 2.8, name='halka', line=True, lift=0.3, cast=1)
    d.set_face(cx, 30.5, gap=6)
    dil(d, cx, 42, 3)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
