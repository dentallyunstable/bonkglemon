# Buzul Ayisi (Donmus Zirve patronu, Kat 40). Tarif: TARIFLER.md 11.5.
# Kocaman tombul kutup ayisi: kirmizi orgu atki, sirtinda kucuk buzul, buzulun ustunde iki Buzcuk ('tepe').
# Normal: oturur, karni onde, pencelari dizlerinde, uykulu. Faz 2 "Buzul Carpmasi": ayakta, iki kol havada,
# buzul buyuk ve sivri, agzindan buhar, atki ruzgarda ucar, pencelere buz kaplanmis.
# Renk: Kar (tuy), Gok (buzul), Kirmizi (atki), Komur (burun, pence). Parlak: Kar -> Kahve, Gok -> Pembe.
PARLA = 'Gok'


def buzcuk(d, cx, top):
    """Buzulun ustundeki minik Buzcuk: karli buz kupu, 1x2 gozler, pembe yanak."""
    n = 'bz%d' % cx
    d.rect('Gok', (cx - 5, top + 3, cx + 5, top + 12), rad=3, part='tepe', name=n, line=True, lift=0.3, noshadow=True)
    d.ellipse('Kar', (cx, top + 3.2), (6.2, 2.6), part='tepe', name=n + 'k', line=True, lift=0.1, noshadow=True)
    d.circle('Kar', (cx - 1.5, top + 1), 2.2, part='tepe', join=n + 'k')
    d.circle('Kar', (cx - 5, top + 5), 1.4, part='tepe', join=n + 'k')
    d.circle('Kar', (cx + 5, top + 5), 1.4, part='tepe', join=n + 'k')
    d.pix((cx - 3, top + 7), ['#..#', '#..#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((cx - 4, top + 9), ['o....o'], {'o': 'Pembe-2'}, part='tepe')


def kristal(d, pts, n, tone=3):
    """Buzul sivrisi: orta ton govde, sol acik yuz, sag koyu yuz."""
    d.poly('Gok', pts, name='kr%d' % n, line=True, noshadow=True, shade='flat', tone=tone)
    top = min(pts, key=lambda q: q[1])
    bot = max(q[1] for q in pts)
    xs = [q[0] for q in pts]
    mx = (min(xs) + max(xs)) / 2
    d.poly('Gok', [(top[0], top[1]), (min(xs) - 1, bot + 1), (mx - 0.5, bot + 1), (top[0] - 0.5, top[1] + 5)],
           clip='kr%d' % n, shade='flat', tone=tone - 1)
    d.poly('Gok', [(top[0] + 1, top[1] + 4), (mx + 1, bot + 1), (max(xs) + 1, bot + 1), (top[0] + 2, top[1])],
           clip='kr%d' % n, shade='flat', tone=tone + 1)


def parilti(d, x, y):
    d.pix((x, y), ['oo', 'o.'], {'o': 'Parilti'})


def atki(d, cx, cy, rx, ry, flying):
    """Kirmizi orgu atki: boyun halkasi, orgu cizgileri; ucu 'esya'."""
    d.ellipse('Kirmizi', (cx, cy), (rx, ry), name='atki', line=True, lift=0.06, cast=1)
    for i in range(-3, 4):
        x = cx + i * (rx * 0.3)
        d.curve('Kirmizi', [(x - 1, cy - ry + 1), (x, cy), (x - 0.5, cy + ry - 1)], 0.9, clip='atki', shift=1)
    d.ellipse('Kirmizi', (cx - rx * 0.5, cy - ry * 0.5), (rx * 0.3, 1.0), clip='atki', shift=-1)
    if not flying:
        # on tarafa sarkan uc
        d.capsule('Kirmizi', (cx + rx * 0.45, cy + 1), (cx + rx * 0.5, cy + 12), (6, 5.5), part='esya', name='au', line=True, lift=0.04)
        for k in (4, 8):
            d.curve('Kirmizi', [(cx + rx * 0.5 - 3, cy + k), (cx + rx * 0.5 + 3, cy + k)], 0.9, part='esya', clip='au', shift=1)
        for k in range(3):
            d.pix((int(cx + rx * 0.5) - 2 + k * 2, int(cy) + 12), ['#'], {'#': 'Kirmizi-4'}, part='esya')
    else:
        # ruzgarda uzaga ucan uc (saga)
        d.curve('Kirmizi', [(cx + rx * 0.6, cy - 1), (cx + rx + 6, cy - 5), (cx + rx + 14, cy - 1), (cx + rx + 21, cy - 6)],
                (6, 4), part='esya', name='au', line=True, lift=0.04)
        for t in ((cx + rx + 6, cy - 5), (cx + rx + 14, cy - 1)):
            d.capsule('Kirmizi', (t[0], t[1] - 2), (t[0] - 1, t[1] + 2), 1.0, part='esya', clip='au', shift=1)
        d.pix((int(cx + rx + 20), int(cy) - 8), ['#', '#'], {'#': 'Kirmizi-4'}, part='esya')
        d.pix((int(cx + rx + 22), int(cy) - 5), ['#', '#'], {'#': 'Kirmizi-4'}, part='esya')


def yuz(d, cx, ey, steam=False):
    # burun: gozlerin arasinda, yuz alaninin icinde
    d.set_face(cx, ey, gap=8, ten='Kar')
    d.ellipse('Komur', (cx, ey + 5), (2.6, 1.6), name='burun', shade='flat', tone=2, noshadow=True)
    d.pix((int(cx) - 1, int(ey) + 4), ['o'], {'o': 'Komur-1'})


def patron(d):
    # --- buzul (sirtta: kafanin ve omuzlarin arkasinda genis buz kutlesi, ustunde iki Buzcuk oturur)
    kristal(d, [(14, 56), (16, 33), (22, 28), (40, 24), (42, 34), (42, 56)], 1)
    kristal(d, [(82, 56), (80, 33), (74, 28), (56, 24), (54, 34), (54, 56)], 2)
    kristal(d, [(34, 40), (40, 30), (48, 22), (56, 30), (62, 40)], 3, tone=3)
    # --- ayaklar (oturan ayi: ayak tabanlari one bakar)
    d.ellipse('Kar', (28, 70), (13, 7), name='ayak1', cast=1, lift=0.02)
    d.ellipse('Kar', (68, 70), (13, 7), name='ayak2', cast=1, lift=0.02)
    # --- govde: karni onde
    d.ellipse('Kar', (48, 59), (29, 18), name='govde', cast=3, lift=0.04)
    d.ellipse('Kar', (48, 67), (21, 11), clip='govde', shift=-1)
    d.ellipse('Kar', (48, 71), (13, 5), clip='govde', shift=-2)
    d.ellipse('Kar', (23, 62), (10, 8), name='diz1', lift=0.04)
    d.ellipse('Kar', (73, 62), (10, 8), name='diz2', lift=0.04)
    d.ellipse('Komur', (28, 71), (7.5, 3.8), shade='flat', tone=2, noshadow=True, line=True)
    d.ellipse('Komur', (68, 71), (7.5, 3.8), shade='flat', tone=2, noshadow=True, line=True)
    # --- kafa
    d.circle('Kar', (28, 32), 5.6, name='ku1', line=True, lift=0.04)
    d.circle('Kar', (68, 32), 5.6, name='ku2', line=True, lift=0.04)
    d.circle('Pembe', (28.5, 33), 2.6, shade='flat', tone=1, noshadow=True)
    d.circle('Pembe', (67.5, 33), 2.6, shade='flat', tone=1, noshadow=True)
    d.ellipse('Kar', (48, 45), (23, 16.5), name='kafa', cast=2, lift=0.06)
    d.ellipse('Kar', (36, 35), (6, 2.2), clip='kafa', shift=-1, rot=-15)
    atki(d, 48, 60, 20, 5.0, False)
    # --- kollar: pencelar dizlerinde
    for s, sx in ((1, -1), (2, 1)):
        part = 'kol_%d' % s
        d.capsule('Kar', (48 + sx * 27, 54), (48 + sx * 26, 61), (9, 8), part=part, line=True, name='kl%d' % s, lift=0.06)
        d.ellipse('Kar', (48 + sx * 26, 62), (7.5, 5.0), part=part, name='pc%d' % s, line=True, lift=0.08, cast=1)
        for k in (-3, 0, 3):
            d.pix((48 + sx * 26 + k - 1, 65), ['##'], {'#': 'Komur-2'}, part=part)
    buzcuk(d, 29, 12)
    buzcuk(d, 67, 12)
    parilti(d, 21, 34)
    yuz(d, 48, 40)


def faz2(d):
    # buyuk, sivri buzul
    kristal(d, [(16, 60), (18, 42), (24, 27), (31, 38), (34, 60)], 1)
    kristal(d, [(80, 60), (78, 42), (72, 27), (65, 38), (62, 60)], 2)
    kristal(d, [(28, 50), (32, 38), (38, 25), (46, 36), (50, 50)], 3, tone=2)
    kristal(d, [(46, 50), (50, 38), (58, 25), (64, 36), (68, 50)], 4, tone=3)
    kristal(d, [(38, 48), (43, 32), (48, 22), (53, 32), (58, 48)], 5, tone=2)
    d.ellipse('Kar', (34, 70), (11, 7), name='ayak1', cast=1, lift=0.02)
    d.ellipse('Kar', (62, 70), (11, 7), name='ayak2', cast=1, lift=0.02)
    d.ellipse('Komur', (34, 72), (7, 3.4), shade='flat', tone=2, noshadow=True, line=True)
    d.ellipse('Komur', (62, 72), (7, 3.4), shade='flat', tone=2, noshadow=True, line=True)
    d.ellipse('Kar', (48, 63), (23, 15), name='govde', cast=3, lift=0.04)
    d.ellipse('Kar', (48, 69), (15, 9), clip='govde', shift=-1)
    d.circle('Kar', (31, 35), 5.0, name='ku1', line=True, lift=0.04)
    d.circle('Kar', (65, 35), 5.0, name='ku2', line=True, lift=0.04)
    d.circle('Pembe', (31.5, 36), 2.3, shade='flat', tone=1, noshadow=True)
    d.circle('Pembe', (64.5, 36), 2.3, shade='flat', tone=1, noshadow=True)
    d.ellipse('Kar', (48, 47), (20, 15.5), name='kafa', cast=2, lift=0.06)
    # kollar havada, buz kapli pencelar
    for s, sx in ((1, -1), (2, 1)):
        part = 'kol_%d' % s
        sh = (48 + sx * 21, 58)
        el = (48 + sx * 31, 50)
        hd = (48 + sx * 35, 38)
        d.capsule('Kar', sh, el, (10, 9), part=part, line=True, name='kl%d' % s, lift=0.06)
        d.capsule('Kar', el, hd, (9, 8.5), part=part, join='kl%d' % s)
        d.ellipse('Kar', (hd[0], hd[1] - 1), (7.5, 6.0), part=part, name='pc%d' % s, line=True, lift=0.08)
        d.ellipse('Gok', (hd[0], hd[1] - 3), (8.2, 5.0), part=part, name='bu%d' % s, line=True, lift=0.1)
        for k in (-5, -1, 3):
            d.poly('Gok', [(hd[0] + k, hd[1] - 5), (hd[0] + k + 2, hd[1] - 9), (hd[0] + k + 4, hd[1] - 5)], part=part, join='bu%d' % s)
        d.ellipse('Gok', (hd[0] - 2, hd[1] - 5), (3, 1.2), part=part, clip='bu%d' % s, shift=-1)
    atki(d, 48, 62, 18, 4.8, True)
    for x, y, r in ((41, 56, 3.0), (35, 58, 2.5), (30, 55, 1.9)):
        d.circle('Gok', (x, y), r, lift=0.5, line=True, noshadow=True)
    buzcuk(d, 38, 12)
    buzcuk(d, 58, 12)
    parilti(d, 79, 34)
    yuz(d, 48, 41)


STAGES = {'patron': patron, 'faz2': faz2}
