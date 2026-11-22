# Tas Golemi (Yanki Magaralari patronu, Kat 20). Tarif: TARIFLER.md 11.3.
# Ust uste dizili yuvarlak kayalardan nazik dev, Micir'in buyugu. Kucuk kafa, kocaman eller, gogsunde mor kristal kalp.
# Omuzlarinda iki Micir ('tepe'). Normal: kambur, elleri yerde, kafada yosun + tek cicek.
# Faz 2 "Kaya Cigi": dogrulur, kalp buyur, catlaklar mor parlar, sirt/omuz kristalleri, cicek kapali.
# Renk: Tas, Mor, Cimen (yosun), Pembe (cicek) + Krem.
PARLA = 'Mor'


def micir(d, cx, top):
    """Omuzdaki minik Micir: Tas tas, acik leke, 1x2 gozler, pembe yanak."""
    d.ellipse('Tas', (cx, top + 5), (6.4, 5.0), part='tepe', name='mc%d' % cx, line=True, lift=0.08, noshadow=True)
    d.ellipse('Tas', (cx - 2.5, top + 2.5), (2.2, 1.2), part='tepe', clip='mc%d' % cx, shift=-1)
    d.pix((int(cx) - 3, int(top) + 4), ['#..#', '#..#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((int(cx) - 4, int(top) + 6), ['o....o'], {'o': 'Pembe-2'}, part='tepe')


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
        sh, el, fi = (48 + sx * 26, 46), (48 + sx * 31, 58), (48 + sx * 31, 69)
        d.capsule('Tas', sh, el, (9, 8), part=part, line=True, name='ka%d' % side, lift=0.04)
        d.capsule('Tas', el, fi, (8, 8), part=part, join='ka%d' % side)
        d.ellipse('Tas', (fi[0] + sx * 1, fi[1] + 1), (10, 8.5), part=part, line=True, name='el%d' % side, lift=0.08, cast=1)
        d.ellipse('Tas', (fi[0] + sx * 5, fi[1] - 3), (3.8, 2.4), part=part, clip='el%d' % side, shift=-1, rot=-30 * sx)
        d.curve('Tas', [(fi[0] - sx * 3, fi[1] + 3), (fi[0] - sx * 3, fi[1] - 1)], 1.0, part=part, clip='el%d' % side, shift=1)
        d.curve('Tas', [(fi[0] + sx * 3, fi[1] + 5), (fi[0] + sx * 3, fi[1] + 1)], 1.0, part=part, clip='el%d' % side, shift=1)
    else:
        sh, el, fi = (48 + sx * 27, 44), (48 + sx * 34, 54), (48 + sx * 35, 64)
        d.capsule('Tas', sh, el, (9, 8), part=part, line=True, name='ka%d' % side, lift=0.04)
        d.capsule('Tas', el, fi, (8, 8), part=part, join='ka%d' % side)
        d.ellipse('Tas', (fi[0] + sx * 1, fi[1] + 2), (9.5, 8.5), part=part, line=True, name='el%d' % side, lift=0.08, cast=1)
        d.ellipse('Tas', (fi[0] + sx * 4, fi[1] - 2), (3.6, 2.4), part=part, clip='el%d' % side, shift=-1, rot=-30 * sx)
        d.curve('Mor', [(fi[0] - sx * 3, fi[1] + 5), (fi[0] - sx * 3, fi[1] - 1)], 1.0, part=part, clip='el%d' % side, tone=1, shade='flat')


def patron(d):
    # alt kayalar (ayak) ve govde: kambur, genis
    d.ellipse('Tas', (33, 72), (13, 7), name='ay1', cast=1)
    d.ellipse('Tas', (63, 72), (13, 7), name='ay2', cast=1)
    d.ellipse('Tas', (48, 54), (27, 21), name='govde', cast=3, lift=0.02)
    d.ellipse('Tas', (48, 68), (22, 9), name='bel', lift=-0.04)
    # sirtta yuvarlak omuz kayasi (kambur)
    d.ellipse('Tas', (28, 38), (12, 9.5), name='om1', lift=0.04)
    d.ellipse('Tas', (68, 38), (12, 9.5), name='om2', lift=0.04)
    # catlak/doku (yuz alaninin disinda)
    for pts in ([(30, 56), (31, 64)], [(66, 56), (65, 64)], [(38, 70), (36, 77)], [(58, 70), (60, 77)]):
        d.curve('Tas', pts, 1.0, clip='govde', shift=1)
    d.ellipse('Tas', (24, 55), (4, 2.4), clip='govde', shift=-1, rot=-30)
    d.ellipse('Tas', (24, 35), (4.5, 2.2), clip='om1', shift=-1, rot=-25)
    d.circle('Tas', (72, 42), 1.8, clip='om2', shift=1)
    # mor kalp
    kalp(d, 48, 64, 1.0, False)
    # kollar
    kolfist(d, 1, False)
    kolfist(d, 2, False)
    # kucuk kafa
    d.ellipse('Tas', (48, 38), (18, 13.5), name='kafa', cast=2, lift=0.06)
    d.ellipse('Tas', (38, 28.5), (5, 2.2), clip='kafa', shift=-1, rot=-15)
    d.circle('Tas', (62, 46), 1.8, clip='kafa', shift=1)
    # yosun tutami + cicek (govde kalir: tepe sadece Micir)
    d.ellipse('Cimen', (46, 25), (8, 3.6), name='yos', line=True, lift=0.05)
    d.circle('Cimen', (41, 24), 3.2, join='yos')
    d.circle('Cimen', (52, 23.5), 3.4, join='yos')
    d.circle('Cimen', (46, 22), 2.6, join='yos')
    d.circle('Cimen', (49, 21), 1.4, clip='yos', shift=-1)
    d.capsule('Cimen', (47, 22), (47, 17), 1.4)
    for dx, dy in ((0, -2.4), (2.6, 0), (-2.6, 0), (0, 2.4)):
        d.circle('Pembe', (47 + dx, 15.5 + dy), 2.0, name='petal', noshadow=True, shade='flat', tone=1)
    d.circle('Krem', (47, 15.5), 1.5, shade='flat', tone=0, noshadow=True)
    # omuzlarda iki Micir
    micir(d, 22, 26)
    micir(d, 74, 26)
    d.set_face(48, 33, gap=8, ten='Tas')


def faz2(d):
    # dogrulmus: daha uzun govde, kafa yukarida, kollar acik
    d.ellipse('Tas', (36, 73), (11, 6.5), name='ay1', cast=1)
    d.ellipse('Tas', (60, 73), (11, 6.5), name='ay2', cast=1)
    # sirt kristalleri (arkada)
    for pts, c in (([(36, 36), (30, 22), (35, 12), (42, 22), (42, 34)], 0), ([(60, 36), (54, 22), (61, 11), (67, 24), (66, 36)], 0),
                   ([(48, 30), (45, 20), (49, 12), (53, 20), (52, 30)], 0)):
        d.poly('Mor', pts, line=True, noshadow=True, lift=-0.08)
    d.ellipse('Tas', (48, 55), (23, 20), name='govde', cast=3, lift=0.02)
    d.ellipse('Tas', (48, 69), (20, 8), name='bel', lift=-0.04)
    d.ellipse('Tas', (29, 39), (11, 9), name='om1', lift=0.04)
    d.ellipse('Tas', (67, 39), (11, 9), name='om2', lift=0.04)
    # omuz kristalleri
    d.poly('Mor', [(21, 36), (15, 26), (19, 17), (26, 30)], line=True, noshadow=True)
    d.poly('Mor', [(75, 36), (81, 26), (77, 17), (70, 30)], line=True, noshadow=True)
    d.poly('Mor', [(14, 38), (8, 34), (11, 28), (18, 34)], line=True, noshadow=True)
    d.poly('Mor', [(82, 38), (88, 34), (85, 28), (78, 34)], line=True, noshadow=True)
    # mor parlayan catlaklar
    for pts in ([(34, 56), (36, 62), (33, 69)], [(62, 56), (60, 62), (63, 69)], [(26, 42), (29, 48), (27, 53)],
                [(70, 42), (67, 48), (69, 53)], [(40, 71), (38, 77)], [(56, 71), (58, 77)]):
        d.curve('Mor', pts, 1.2, clip='govde', tone=1, shade='flat')
    d.curve('Mor', [(23, 36), (28, 40), (34, 38)], 1.2, clip='om1', tone=1, shade='flat')
    d.curve('Mor', [(73, 36), (68, 40), (62, 38)], 1.2, clip='om2', tone=1, shade='flat')
    kalp(d, 48, 62, 1.35, True)
    kolfist(d, 1, True)
    kolfist(d, 2, True)
    d.ellipse('Tas', (48, 36), (18, 13.5), name='kafa', cast=2, lift=0.06)
    d.ellipse('Tas', (38, 26.5), (5, 2.2), clip='kafa', shift=-1, rot=-15)
    d.curve('Mor', [(34, 25), (37, 29)], 1.0, clip='kafa', tone=1, shade='flat')
    d.curve('Mor', [(62, 25), (59, 29)], 1.0, clip='kafa', tone=1, shade='flat')
    # yosun + KAPALI cicek (tomurcuk)
    d.ellipse('Cimen', (46, 23), (8, 3.4), name='yos', line=True, lift=0.05)
    d.circle('Cimen', (41, 22), 3.0, join='yos')
    d.circle('Cimen', (52, 21.5), 3.2, join='yos')
    d.capsule('Cimen', (47, 21), (47, 17), 1.4)
    d.ellipse('Pembe', (47, 14), (2.2, 3.4), name='tom', line=True, noshadow=True)
    d.pix((46, 11), ['#', '#'], {'#': 'Cimen-2'})
    micir(d, 22, 24)
    micir(d, 74, 24)
    d.set_face(48, 31, gap=8, ten='Tas')


STAGES = {'patron': patron, 'faz2': faz2}
