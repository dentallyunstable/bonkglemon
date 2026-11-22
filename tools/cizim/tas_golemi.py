# Tas Golemi (Yanki Magaralari patronu, Kat 20). Tarif: TARIFLER.md 11.3.
# Ust uste dizili yuvarlak kayalardan nazik dev, Micir'in buyugu. Kucuk kafa, kocaman eller, gogsunde mor kristal kalp.
# Omuzlarinda iki Micir ('tepe'). Normal: kambur, elleri yerde, kafada yosun + tek cicek.
# Faz 2 "Kaya Cigi": dogrulur, kalp buyur, catlaklar mor parlar, sirt/omuz kristalleri, cicek kapali.
# Renk: Tas, Mor, Cimen (yosun), Pembe (cicek) + Krem.
PARLA = 'Mor'


def micir(d, cx, top):
    """Omuzdaki minik Micir: Tas tas, acik leke, 1x2 gozler, pembe yanak."""
    d.ellipse('Tas', (cx, top + 5.5), (7.0, 5.6), part='tepe', name='mc%d' % cx, line=True, lift=0.16, noshadow=True)
    d.ellipse('Tas', (cx - 2.5, top + 2.5), (2.2, 1.2), part='tepe', clip='mc%d' % cx, shift=-1)
    d.pix((int(cx) - 3, int(top) + 5), ['#..#', '#..#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((int(cx) - 4, int(top) + 7), ['o....o'], {'o': 'Pembe-2'}, part='tepe')


def kris(d, pts, n):
    """Mor kristal sivrisi: orta ton govde, sol acik yuz, sag koyu yuz."""
    d.poly('Mor', pts, name='kr%d' % n, line=True, noshadow=True, shade='flat', tone=2)
    top = min(pts, key=lambda q: q[1])
    bot = max(q[1] for q in pts)
    xs = [q[0] for q in pts]
    mx = (min(xs) + max(xs)) / 2
    d.poly('Mor', [(top[0], top[1]), (min(xs) - 1, bot + 1), (mx - 0.5, bot + 1), (top[0] - 0.5, top[1] + 4)], clip='kr%d' % n, shade='flat', tone=1)
    d.poly('Mor', [(top[0] + 1, top[1] + 3), (mx + 1, bot + 1), (max(xs) + 1, bot + 1), (top[0] + 2, top[1])], clip='kr%d' % n, shade='flat', tone=3)


def kalp(d, cx, cy, s, glow):
    """Mor kristal kalp: altigen kristal, ici acik, parlayan isik."""
    d.poly('Mor', [(cx, cy - 7 * s), (cx + 5 * s, cy - 3 * s), (cx + 5 * s, cy + 3 * s), (cx, cy + 7 * s),
                   (cx - 5 * s, cy + 3 * s), (cx - 5 * s, cy - 3 * s)], name='kalp', line=True, noshadow=True,
           shade='flat', tone=2)
    d.poly('Mor', [(cx - 1.5 * s, cy - 5 * s), (cx + 2.5 * s, cy - 2 * s), (cx + 2.5 * s, cy + 2 * s), (cx - 1.5 * s, cy + 3 * s),
                   (cx - 3 * s, cy)], clip='kalp', tone=1)
    d.pix((int(cx - 2 * s), int(cy - 3 * s)), ['oo', 'o.'], {'o': 'Parilti'})


def kolfist(d, side, faz):
    sx = -1 if side == 1 else 1
    part = 'kol_%d' % side
    if not faz:
        # kambur: kol omuzdan asagi uzanir, dev yumruk yerde
        sh, el, fi = (48 + sx * 25, 49), (48 + sx * 30, 60), (48 + sx * 30, 69)
        d.capsule('Tas', sh, el, (9, 8), part=part, line=True, name='ka%d' % side, lift=0.04)
        d.capsule('Tas', el, fi, (8, 8), part=part, join='ka%d' % side)
        d.ellipse('Tas', (fi[0] + sx * 1, fi[1] + 1), (10, 8.5), part=part, line=True, name='el%d' % side, lift=0.08, cast=1)
        d.ellipse('Tas', (fi[0] + sx * 5, fi[1] - 3), (3.8, 2.4), part=part, clip='el%d' % side, shift=-1, rot=-30 * sx)
        d.curve('Tas', [(fi[0] - sx * 3, fi[1] + 3), (fi[0] - sx * 3, fi[1] - 1)], 1.0, part=part, clip='el%d' % side, shift=1)
        d.curve('Tas', [(fi[0] + sx * 3, fi[1] + 5), (fi[0] + sx * 3, fi[1] + 1)], 1.0, part=part, clip='el%d' % side, shift=1)
    else:
        sh, el, fi = (48 + sx * 26, 46), (48 + sx * 30, 56), (48 + sx * 30, 65)
        d.capsule('Tas', sh, el, (9, 8), part=part, line=True, name='ka%d' % side, lift=0.04)
        d.capsule('Tas', el, fi, (8, 8), part=part, join='ka%d' % side)
        d.ellipse('Tas', (fi[0] + sx * 1, fi[1] + 2), (9.5, 8.5), part=part, line=True, name='el%d' % side, lift=0.08, cast=1)
        d.ellipse('Tas', (fi[0] + sx * 4, fi[1] - 2), (3.6, 2.4), part=part, clip='el%d' % side, shift=-1, rot=-30 * sx)
        d.curve('Mor', [(fi[0] - sx * 3, fi[1] + 5), (fi[0] - sx * 3, fi[1] - 1)], 1.0, part=part, clip='el%d' % side, tone=1, shade='flat')


def patron(d):
    # alt kayalar (ayak) ve govde: kambur, genis
    d.ellipse('Tas', (33, 72), (13, 7), name='ay1', cast=1)
    d.ellipse('Tas', (63, 72), (13, 7), name='ay2', cast=1)
    d.ellipse('Tas', (48, 57), (27, 19), name='govde', cast=3, lift=0.02)
    d.ellipse('Tas', (48, 69), (22, 8), name='bel', lift=-0.04)
    # sirtta yuvarlak omuz kayasi (kambur)
    d.ellipse('Tas', (28, 42), (12, 9), name='om1', lift=0.04)
    d.ellipse('Tas', (68, 42), (12, 9), name='om2', lift=0.04)
    # catlak/doku (yuz alaninin disinda)
    for pts in ([(30, 58), (31, 66)], [(66, 58), (65, 66)], [(38, 70), (36, 77)], [(58, 70), (60, 77)]):
        d.curve('Tas', pts, 1.0, clip='govde', shift=1)
    d.ellipse('Tas', (24, 57), (4, 2.4), clip='govde', shift=-1, rot=-30)
    d.ellipse('Tas', (24, 39), (4.5, 2.2), clip='om1', shift=-1, rot=-25)
    d.circle('Tas', (72, 46), 1.8, clip='om2', shift=1)
    # mor kalp
    kalp(d, 48, 66, 1.0, False)
    # kollar
    kolfist(d, 1, False)
    kolfist(d, 2, False)
    # kucuk kafa
    d.ellipse('Tas', (48, 42), (18, 13), name='kafa', cast=2, lift=0.06)
    d.ellipse('Tas', (38, 33), (5, 2.2), clip='kafa', shift=-1, rot=-15)
    d.circle('Tas', (62, 50), 1.8, clip='kafa', shift=1)
    # yosun tutami + cicek (govde kalir: tepe sadece Micir)
    d.ellipse('Cimen', (46, 29), (8, 3.6), name='yos', line=True, lift=0.05, part='tepe')
    d.circle('Cimen', (41, 28), 3.2, join='yos', part='tepe')
    d.circle('Cimen', (52, 27.5), 3.4, join='yos', part='tepe')
    d.circle('Cimen', (46, 26), 2.6, join='yos', part='tepe')
    d.circle('Cimen', (49, 25), 1.4, clip='yos', shift=-1, part='tepe')
    d.capsule('Cimen', (47, 26), (47, 21), 1.4, part='tepe')
    for dx, dy in ((0, -2.4), (2.6, 0), (-2.6, 0), (0, 2.4)):
        d.circle('Pembe', (47 + dx, 19.5 + dy), 2.0, name='petal', part='tepe', noshadow=True, shade='flat', tone=1)
    d.circle('Krem', (47, 19.5), 1.5, shade='flat', tone=0, noshadow=True, part='tepe')
    # omuzlarda iki Micir
    micir(d, 20, 29)
    micir(d, 76, 29)
    d.set_face(48, 37, gap=8, ten='Tas')


def faz2(d):
    # dogrulmus: daha uzun govde, kafa yukarida, kollar acik
    d.ellipse('Tas', (36, 73), (11, 6.5), name='ay1', cast=1)
    d.ellipse('Tas', (60, 73), (11, 6.5), name='ay2', cast=1)
    d.ellipse('Tas', (48, 56), (22, 20), name='govde', cast=3, lift=0.02)
    d.ellipse('Tas', (48, 69), (20, 8), name='bel', lift=-0.04)
    d.ellipse('Tas', (30, 41), (10, 8.5), name='om1', lift=0.04)
    d.ellipse('Tas', (66, 41), (10, 8.5), name='om2', lift=0.04)
    # mor parlayan catlaklar
    for pts in ([(34, 56), (36, 62), (33, 69)], [(62, 56), (60, 62), (63, 69)], [(26, 42), (29, 48), (27, 53)],
                [(70, 42), (67, 48), (69, 53)], [(40, 71), (38, 77)], [(56, 71), (58, 77)]):
        d.curve('Mor', pts, 1.2, clip='govde', tone=1, shade='flat')
    d.curve('Mor', [(23, 36), (28, 40), (34, 38)], 1.2, clip='om1', tone=1, shade='flat')
    d.curve('Mor', [(73, 36), (68, 40), (62, 38)], 1.2, clip='om2', tone=1, shade='flat')
    # sirt ve omuz kristalleri (kafanin arkasindan ve omuzlardan cikar)
    kris(d, [(25, 44), (22, 32), (28, 23), (36, 30), (38, 42)], 1)
    kris(d, [(71, 44), (74, 32), (68, 23), (60, 30), (58, 42)], 2)
    kris(d, [(42, 36), (40, 28), (45, 22), (50, 30)], 3)
    kris(d, [(24, 52), (15, 51), (13, 42), (20, 43), (26, 46)], 4)
    kris(d, [(72, 52), (81, 51), (83, 42), (76, 43), (70, 46)], 5)
    kalp(d, 48, 62, 1.35, True)
    kolfist(d, 1, True)
    kolfist(d, 2, True)
    d.ellipse('Tas', (48, 38), (18, 13), name='kafa', cast=2, lift=0.06)
    d.ellipse('Tas', (38, 29), (5, 2.2), clip='kafa', shift=-1, rot=-15)
    d.curve('Mor', [(34, 30), (37, 34)], 1.0, clip='kafa', tone=1, shade='flat')
    d.curve('Mor', [(62, 30), (59, 34)], 1.0, clip='kafa', tone=1, shade='flat')
    # yosun + KAPALI cicek (tomurcuk)
    d.ellipse('Cimen', (46, 25), (8, 3.4), name='yos', line=True, lift=0.05, part='tepe')
    d.circle('Cimen', (41, 24), 3.0, join='yos', part='tepe')
    d.circle('Cimen', (52, 23.5), 3.2, join='yos', part='tepe')
    d.capsule('Cimen', (47, 23), (47, 19), 1.4, part='tepe')
    d.ellipse('Pembe', (47, 16), (2.2, 3.4), name='tom', line=True, noshadow=True, part='tepe')
    d.pix((46, 13), ['#', '#'], {'#': 'Cimen-2'}, part='tepe')
    micir(d, 19, 29)
    micir(d, 77, 29)
    d.set_face(48, 33, gap=8, ten='Tas')


STAGES = {'patron': patron, 'faz2': faz2}
