# Kuzey Kurdu (Buz, efsanevi). Tarif: TARIFLER.md. Dik oturan, gogsu kabarik beyaz kurt yavrusu; yelesinin uclari kuzey isiklari renginde.
# Kiragi Tilkisi (dev kuyruk) ve Bosluk Kurdu (sarkik kulak, mor) ile karismasin diye: dik sivri kulaklar, belirgin on cikinti (burun-agiz),
# yanaklarda sivri yele tutamlari. Renk: Kar (tuy), Gok + Cam (yele/kulak uclari), Sari (kupe). Parlak: Gok -> Mor.
import math
PARLA = 'Cam'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def kulak(d, cx, pts, side, tip, tipfam='Gok'):
    P = pts if side == 1 else mir(pts, cx)
    nm = 'ku%d' % side
    d.poly('Kar', P, part='kulak_%d' % side, name=nm, line=True, lift=0.1)
    ty = min(y for _, y in P)
    tx = sum(x for x, y in P if y == ty) / max(1, len([1 for x, y in P if y == ty]))
    d.ellipse(tipfam, (tx, ty + 1.5), (tip[0], tip[1]), clip=nm, tone=2, part='kulak_%d' % side)


def tutam(d, a, b, w, nm, tipfam, part='govde', lift=-0.05, tipr=None):
    d.capsule('Kar', a, b, (w, w * 0.55), name=nm, line=True, lift=lift, part=part)
    d.circle(tipfam, b, tipr or w * 0.85, clip=nm, tone=2, part=part)


def kupe(d, x, y):
    d.circle('Sari', (x, y), 2.7, part='kulak_1', name='kp', line=True, lift=0.15)
    d.circle('Sari', (x, y), 1.1, sub='kp', part='kulak_1')


def burun(d, cx, y, rx=4.6, ry=3.2, ny=None):
    """On cikinti (kurt burnu): kafanin altindan one cikan acik renkli burun-agiz bolgesi, ustte koyu burun."""
    d.ellipse('Kar', (cx, y), (rx, ry), name='on', lift=0.18, line=True, noshadow=True)
    ny = ny if ny is not None else int(y - ry) + 1
    d.pix((int(cx) - 1, ny), ['###', '.#.'], {'#': 'Murekkep'}, keep=True)


def yanak_tutam(d, cx, y, dx, h, side):
    """Yanaktan disa-asagi sivri tutam (gdy kafaya katilir)."""
    x = cx + side * dx
    d.capsule('Kar', (x - side * 3, y - 1), (x + side * 3.2, y + h), (4.2, 2.2), join='g')


def bebek(d):
    cx = 24
    d.curve('Kar', [(33, 43), (40, 43), (42, 37)], (5, 3), part='kuyruk', line=True, lift=-0.08)
    E = [(11.5, 28), (9.5, 17.5), (13, 14.5), (22, 21), (22, 27)]
    kulak(d, cx, E, 1, (3.4, 3.2))
    kulak(d, cx, E, 2, (3.4, 3.2))
    d.ellipse('Kar', (cx, 34), (12.4, 10), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (cx, 26), (10, 5.5), clip='g', shift=1)
    yanak_tutam(d, cx, 37, 11, 4, -1)
    yanak_tutam(d, cx, 37, 11, 4, 1)
    d.circle('Kar', (17, 43.5), 3.2, join='g')
    d.circle('Kar', (31, 43.5), 3.2, join='g')
    d.circle('Kar', (cx, 44.5), 3.2, join='g')
    burun(d, cx, 40.5, 4.2, 3.0)
    d.set_face(cx, 30.5, gap=5, mouth=False)


def genc(d):
    cx = 28
    d.curve('Kar', [(36, 51), (44, 50), (46, 43)], (5.5, 3.2), part='kuyruk', line=True, lift=-0.08)
    E = [(14.5, 27), (12, 14.5), (16, 11), (25, 18.5), (25, 25)]
    kulak(d, cx, E, 1, (3.8, 3.6))
    kulak(d, cx, E, 2, (3.8, 3.6))
    d.ellipse('Kar', (cx, 46), (11, 7.5), name='gv', cast=1, lift=-0.04)
    d.ellipse('Kar', (cx - 6, 52.5), (4, 2.6), part='kol_1', line=True, noshadow=True)
    d.ellipse('Kar', (cx + 6, 52.5), (4, 2.6), part='kol_2', line=True, noshadow=True)
    # kabarik boyun yelesi: kafanin altinda genis, kenarlari sivri, uclari yesil
    d.ellipse('Kar', (cx, 42.5), (15.5, 7), name='yele', lift=-0.1, cast=1)
    for k, x in enumerate((-13, -9, -4.5, 0, 4.5, 9, 13)):
        d.capsule('Kar', (cx + x * 0.9, 44), (cx + x * 1.05, 49.5 - abs(x) * 0.12), (4.0, 1.6), join='yele')
    for x, y in ((-13.6, 47), (-9.5, 49.2), (-4.7, 50), (0, 50.4), (4.7, 50), (9.5, 49.2), (13.6, 47)):
        d.circle('Cam', (cx + x, y), 2.4, clip='yele', tone=2)
    d.ellipse('Kar', (cx, 33), (13.4, 10.8), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (cx, 25), (11, 5.5), clip='g', shift=1)
    yanak_tutam(d, cx, 37.5, 12, 4.5, -1)
    yanak_tutam(d, cx, 37.5, 12, 4.5, 1)
    burun(d, cx, 41, 4.6, 3.2)
    d.set_face(cx, 30.5, gap=5, mouth=False)


def usta(d):
    cx = 31
    d.curve('Kar', [(42, 56), (52, 55), (55, 46)], (6.5, 3.8), part='kuyruk', line=True, lift=-0.08)
    E = [(15.5, 28), (12.5, 12.5), (17, 8.5), (28, 17.5), (28, 26)]
    kulak(d, cx, E, 1, (4.4, 4.0))
    kulak(d, cx, E, 2, (4.4, 4.0))
    kupe(d, 14.2, 17.5)
    d.ellipse('Kar', (cx, 50), (13, 8.5), name='gv', cast=1, lift=-0.04)
    d.ellipse('Kar', (cx - 7, 57), (4.6, 2.8), part='kol_1', line=True, noshadow=True)
    d.ellipse('Kar', (cx + 7, 57), (4.6, 2.8), part='kol_2', line=True, noshadow=True)
    # omuzlara pelerin gibi inen yele: ust sira yesil, alt sira maviye doner
    d.ellipse('Kar', (cx, 42), (20, 8.5), name='yele', lift=-0.12, cast=1)
    xs = (-19, -15, -11, -7, -3.5, 0, 3.5, 7, 11, 15, 19)
    for x in xs:
        d.capsule('Kar', (cx + x * 0.9, 43), (cx + x * 1.02, 50.5 - abs(x) * 0.12), (4.4, 1.8), join='yele')
    for x in xs:
        y = 51.2 - abs(x) * 0.12
        fam = 'Cam' if abs(x) <= 8 else 'Gok'
        d.circle(fam, (cx + x * 1.02, y), 2.9, clip='yele', tone=2)
    d.ellipse('Cam', (cx, 40), (6, 2.2), clip='yele', tone=2) if False else None
    d.ellipse('Kar', (cx, 33), (15, 11.6), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (cx, 25), (12.5, 6), clip='g', shift=1)
    yanak_tutam(d, cx, 37, 14, 5, -1)
    yanak_tutam(d, cx, 37, 14, 5, 1)
    burun(d, cx, 42, 5.2, 3.4)
    d.set_face(cx, 31, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
