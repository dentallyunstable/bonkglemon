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
    d.ellipse('Kar', (cx, 34), (12, 10), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (cx, 26), (10, 5.5), clip='g', shift=1)
    yanak_tutam(d, cx, 37, 9.5, 4, -1)
    yanak_tutam(d, cx, 37, 9.5, 4, 1)
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
    d.ellipse('Kar', (cx, 43), (15.5, 7.5), name='yele', lift=-0.1, cast=1)
    for k, x in enumerate((-13, -9, -4.5, 0, 4.5, 9, 13)):
        d.capsule('Kar', (cx + x * 0.9, 44), (cx + x * 1.05, 51 - abs(x) * 0.2), (4.2, 1.8), join='yele')
    for x, y in ((-13.6, 48.5), (-9.5, 50.6), (-4.7, 51.4), (0, 51.6), (4.7, 51.4), (9.5, 50.6), (13.6, 48.5)):
        d.circle('Cam', (cx + x, y), 3.4, clip='yele', tone=2)
    d.ellipse('Kar', (cx, 33), (13.4, 10.8), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (cx, 25), (11, 5.5), clip='g', shift=1)
    yanak_tutam(d, cx, 37.5, 12, 4.5, -1)
    yanak_tutam(d, cx, 37.5, 12, 4.5, 1)
    burun(d, cx, 41, 4.6, 3.2)
    d.set_face(cx, 30.5, gap=5, mouth=False)


def usta(d):
    cx = 31
    d.curve('Kar', [(42, 58), (52, 57), (55, 48)], (6.5, 3.8), part='kuyruk', line=True, lift=-0.08)
    E = [(15.5, 28), (12.5, 12.5), (17, 8.5), (28, 17.5), (28, 26)]
    kulak(d, cx, E, 1, (4.4, 4.0))
    kulak(d, cx, E, 2, (4.4, 4.0))
    kupe(d, 14.2, 17.5)
    d.ellipse('Kar', (cx, 52), (13, 8.5), name='gv', cast=1, lift=-0.04)
    d.ellipse('Kar', (cx - 7, 59), (4.6, 2.8), part='kol_1', line=True, noshadow=True)
    d.ellipse('Kar', (cx + 7, 59), (4.6, 2.8), part='kol_2', line=True, noshadow=True)
    # omuzlara pelerin gibi inen yele: ust sira yesil, alt sira maviye doner
    d.ellipse('Kar', (cx, 43), (20, 9), name='yele', lift=-0.12, cast=1)
    xs = (-19, -15, -11, -7, -3.5, 0, 3.5, 7, 11, 15, 19)
    for x in xs:
        d.capsule('Kar', (cx + x * 0.9, 43), (cx + x * 1.02, 52.5 - abs(x) * 0.2), (4.8, 2.0), join='yele')
    for x in xs:
        y = 53 - abs(x) * 0.2
        fam = 'Cam' if abs(x) <= 8 else 'Gok'
        d.circle(fam, (cx + x * 1.02, y), 3.8, clip='yele', tone=2)
    d.ellipse('Cam', (cx, 40), (6, 2.2), clip='yele', tone=2) if False else None
    d.ellipse('Kar', (cx, 33), (15, 11.6), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (cx, 25), (12.5, 6), clip='g', shift=1)
    yanak_tutam(d, cx, 37, 14, 5, -1)
    yanak_tutam(d, cx, 37, 14, 5, 1)
    burun(d, cx, 42, 5.2, 3.4)
    d.set_face(cx, 31, gap=6, mouth=False)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def kulak_y(d, pts, part, name, tip, back=False):
    d.poly('Kar', pts, part=part, name=name, line=True, lift=-0.08 if back else 0.1)
    ty = min(y for _, y in pts)
    tx = sum(x for x, y in pts if y == ty) / max(1, len([1 for x, y in pts if y == ty]))
    d.ellipse('Gok', (tx, ty + 1.5), tip, clip=name, tone=2, part=part)


def burun_y(d, x, y, rx, ry):
    """Yandan on cikinti (kurt burnu): acik renkli, ucunda koyu burun."""
    d.ellipse('Kar', (x, y), (rx, ry), name='on', lift=0.18, line=True, noshadow=True)
    d.pix2((int(x - rx) // 2 + 1, int(y - ry) // 2 + 1), ['#'], {'#': 'Murekkep'}, keep=True)


def bebek_yan(d):
    d.curve('Kar', [(34, 43), (41, 43), (43, 36)], (5, 3), part='kuyruk', line=True, lift=-0.08)
    # uzak kulak arkada, koyu
    kulak_y(d, [(28, 28), (29, 16), (34, 14), (37, 27)], 'kulak_2', 'ku2', (3.2, 3.0), back=True)
    d.capsule('Kar', (31, 46), (32, 49), 3.0, part='kol_2', line=True, lift=-0.1)
    d.ellipse('Kar', (28, 39), (10.5, 9), name='g', cast=1, lift=0.0)
    d.ellipse('Kar', (22, 34), (11.5, 9.5), join='g')
    d.ellipse('Kar', (22, 27), (9, 4.5), clip='g', shift=1)
    d.capsule('Kar', (23, 38), (29, 42), (4.2, 2.2), join='g')
    d.circle('Kar', (20, 44.5), 3.2, join='g')
    d.circle('Kar', (14, 43), 3.0, join='g')
    burun_y(d, 12.5, 37, 4.4, 3.0)
    kulak_y(d, [(17, 28), (16, 16.5), (21, 14), (27, 27)], 'kulak_1', 'ku1', (3.4, 3.2))
    d.capsule('Kar', (20, 46), (19, 49), 3.2, part='kol_1', line=True, lift=0.1)
    d.set_face_side(16, 30)


def genc_yan(d):
    d.curve('Kar', [(38, 51), (46, 50), (48, 43)], (5.5, 3.2), part='kuyruk', line=True, lift=-0.08)
    kulak_y(d, [(30, 26), (31, 12), (36, 10), (40, 25)], 'kulak_2', 'ku2', (3.6, 3.4), back=True)
    d.ellipse('Kar', (35, 47), (11, 7.5), name='gv', cast=1, lift=-0.04)
    d.ellipse('Kar', (38, 54), (4, 2.6), part='kol_2', line=True, noshadow=True)
    # boyun yelesi: on-alt, uclari yesil
    d.ellipse('Kar', (27, 44), (12, 7.5), name='yele', lift=-0.1, cast=1)
    for x in (-9, -4.5, 0, 4.5, 9):
        d.capsule('Kar', (27 + x, 44), (27 + x * 1.1, 51 - abs(x) * 0.15), (4.2, 1.8), join='yele')
    for x, y in ((-9.5, 49.8), (-4.7, 51.0), (0, 51.6), (4.7, 51.0), (9.5, 49.8)):
        d.circle('Cam', (27 + x, y), 3.2, clip='yele', tone=2)
    d.ellipse('Kar', (24, 34), (12.5, 10.5), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (24, 26.5), (10, 5), clip='g', shift=1)
    d.capsule('Kar', (26, 38), (33, 43), (4.4, 2.2), join='g')
    burun_y(d, 13.5, 38.5, 4.8, 3.2)
    kulak_y(d, [(18, 27), (17, 13.5), (22, 11), (28, 25)], 'kulak_1', 'ku1', (3.8, 3.6))
    d.ellipse('Kar', (24, 53), (4, 2.6), part='kol_1', line=True, noshadow=True)
    d.set_face_side(15, 30)


def usta_yan(d):
    d.curve('Kar', [(43, 58), (53, 57), (56, 48)], (6.5, 3.8), part='kuyruk', line=True, lift=-0.08)
    kulak_y(d, [(33, 26), (34, 9), (39, 7.5), (44, 25)], 'kulak_2', 'ku2', (4.2, 3.8), back=True)
    d.ellipse('Kar', (37, 52), (12.5, 8.5), name='gv', cast=1, lift=-0.04)
    d.ellipse('Kar', (41, 59), (4.6, 2.8), part='kol_2', line=True, noshadow=True)
    # omuzlara pelerin gibi inen yele: ust yesil, alt mavi
    d.ellipse('Kar', (31, 43), (19, 9), name='yele', lift=-0.12, cast=1)
    xs = (-15, -11, -7, -3.5, 0, 3.5, 7, 11, 15)
    for x in xs:
        d.capsule('Kar', (31 + x * 0.9, 43), (31 + x * 1.02, 52.5 - abs(x) * 0.2), (4.8, 2.0), join='yele')
    for x in xs:
        y = 53 - abs(x) * 0.2
        d.circle('Cam' if abs(x) <= 7 else 'Gok', (31 + x * 1.02, y), 3.6, clip='yele', tone=2)
    d.ellipse('Kar', (26, 33), (14, 11.6), name='g', cast=1, lift=0.05)
    d.ellipse('Kar', (26, 25.5), (11.5, 6), clip='g', shift=1)
    d.capsule('Kar', (28, 38), (36, 44), (4.8, 2.4), join='g')
    burun_y(d, 14, 40, 5.4, 3.6)
    kulak_y(d, [(20, 27), (19, 9.5), (25, 6.5), (32, 24)], 'kulak_1', 'ku1', (4.4, 4.0))
    d.circle('Sari', (24.5, 18), 2.7, part='kulak_1', name='kp', line=True, lift=0.15)
    d.circle('Sari', (24.5, 18), 1.1, sub='kp', part='kulak_1')
    d.ellipse('Kar', (25, 59), (4.6, 2.8), part='kol_1', line=True, noshadow=True)
    d.set_face_side(16, 31)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
