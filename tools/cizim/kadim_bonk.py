# Kadim Bonk (Yildiz Cekirdegi son patronu, Kat 70). Tarif: TARIFLER.md 11.8.
# Ilk Glemon: kocaman, neredeyse tam yuvarlak, bebek yuzlu top. Gece gogu gibi Lacivert govde, karninda donen pembe sarmal,
# basinda bes kristalli tepelik, belinde yatay yildiz tozu halkasi; halkada iki minik Yildiz Tozu ('tepe').
# Faz 2 "Supernova": sarmal buyuk ve sari parlar, govdede catlaklardan isik, tepelik uzun, halka dikleskmis, kararli kasli yuz.
# Faz 3 "Kara Delik": sarmalin ortasi kapkara daire + mor isik halkasi, halka parcalanmis ve etrafinda doner, kenarlar koyu, yorgun inatci yuz.
# Renk: Lacivert (govde), Mor + Pembe (sarmal, kristal), Sari (yildiz, halka); faz3'te Komur. Parlak: Lacivert -> Gok, Pembe -> Sari.
import math
PARLA = 'Sari'

CX, CY = 48, 44
RX, RY = 27, 21


def kristal(d, x, ty, by, lean, n, hw=3.4, fam='Mor'):
    """Tepelik kristali: kalin, ucu yuvarlak elmas; sol acik yuz, sag koyu yuz."""
    tx = x + lean
    pts = [(x - hw, by), (tx - hw * 0.85, ty + 6), (tx - 1, ty + 0.5), (tx + 1, ty + 0.5), (tx + hw * 0.85, ty + 6), (x + hw, by)]
    d.poly(fam, pts, name='kr%d' % n, line=True, noshadow=True, shade='flat', tone=2)
    d.poly(fam, [(tx, ty), (x - hw - 1, by + 1), (x - 0.3, by + 1), (tx - 0.3, ty + 5)], clip='kr%d' % n, shade='flat', tone=1)
    d.poly(fam, [(tx + 0.7, ty + 3), (x + 0.5, by + 1), (x + hw + 1, by + 1), (tx + 1.5, ty)], clip='kr%d' % n, shade='flat', tone=3)
    d.pix((int(tx) - 1, int(ty) + 3), ['oo'], {'o': 'Parilti'})


def tepelik(d, uzun):
    if uzun:
        spec = ((26, 21, -4), (37, 16, -2), (48, 13, 0), (59, 16, 2), (70, 21, 4))
        hw = 3.8
    else:
        spec = ((31, 22, -2.5), (39.5, 17, -1.2), (48, 13.5, 0), (56.5, 17, 1.2), (65, 22, 2.5))
        hw = 3.3
    for i, (x, ty, lean) in enumerate(spec):
        top = CY - RY * math.sqrt(max(0.0, 1 - ((x - CX) / RX) ** 2))
        kristal(d, x, ty, top + 4, lean, i, hw=hw)


def halka(d, rot, rx, ry, c, yan=None, fam='Sari', name='h', th=4.6):
    """Halka: yan='on' / 'arka' ise yalniz o yarisi (uzun eksene gore); None ise tamami."""
    d.ellipse(fam, c, (rx, ry), rot=rot, part='esya', name=name, line=True, lift=0.1)
    d.ellipse(fam, c, (rx - th, ry - th * 0.8), rot=rot, part='esya', sub=name)
    if yan:
        ar = math.radians(rot)
        u = (math.cos(ar), math.sin(ar))
        n = (-u[1], u[0])
        if n[1] < 0:
            n = (-n[0], -n[1])
        sg = -1 if yan == 'on' else 1          # on yariyi tutarken arka yariyi oy
        L = 120
        pts = [(c[0] - u[0] * L, c[1] - u[1] * L), (c[0] + u[0] * L, c[1] + u[1] * L),
               (c[0] + u[0] * L + sg * n[0] * L, c[1] + u[1] * L + sg * n[1] * L),
               (c[0] - u[0] * L + sg * n[0] * L, c[1] - u[1] * L + sg * n[1] * L)]
        d.poly(fam, pts, part='esya', sub=name)


def yildiz_bebek(d, cx, cy, k):
    """Halkada oturan minik Yildiz Tozu: Sari yuvarlak yildiz, 1x2 Murekkep gozler, pembe yanak."""
    n = 'ys%d' % k
    d.circle('Sari', (cx, cy), 4.2, part='tepe', name=n, line=True, lift=0.08, noshadow=True)
    for i in range(5):
        a = math.radians(-90 + 72 * i)
        d.capsule('Sari', (cx, cy), (cx + 7.0 * math.cos(a), cy + 7.0 * math.sin(a)), (4.2, 2.2), part='tepe', join=n)
    d.pix((int(cx) - 2, int(cy) - 1), ['#.#', '#.#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((int(cx) - 3, int(cy) + 1), ['o...o'], {'o': 'Pembe-2'}, part='tepe')


def govde(d, kenar=False):
    d.ellipse('Lacivert', (CX, CY), (RX, RY), name='govde', cast=2, lift=0.02)
    d.ellipse('Lacivert', (35, 64.5), (7.5, 3.8), join='govde')
    d.ellipse('Lacivert', (61, 64.5), (7.5, 3.8), join='govde')
    if kenar:
        d.ellipse('Komur', (CX, CY), (RX, RY), name='kenar', clip='govde', tone=3, shade='flat')
        d.ellipse('Komur', (CX + 0.5, CY - 0.5), (RX - 3, RY - 3), sub='kenar')
        d.ellipse('Komur', (CX, CY + 1), (RX, RY), name='kenar2', clip='govde', tone=4, shade='flat')
        d.ellipse('Komur', (CX + 1, CY - 1.2), (RX - 1.4, RY - 1.4), sub='kenar2')
    # yildiz benekleri: yuz ve sarmaldan uzakta, 2 piksellik
    for x, y in ((27, 33), (24, 44), (29, 54), (70, 36), (68, 47), (64, 57), (36, 27), (60, 27)):
        d.pix((x, y), ['oo'], {'o': 'Parilti'})
    for x, y in ((21, 50), (73, 42), (33, 60), (60, 61)):
        d.pix((x, y), ['##'], {'#': 'Sari-1'})


def kollar(d):
    d.capsule('Lacivert', (23, 47), (25, 56), (7.5, 6.5), part='kol_1', line=True, name='k1', lift=0.1)
    d.capsule('Lacivert', (73, 47), (71, 56), (7.5, 6.5), part='kol_2', line=True, name='k2', lift=0.1)
    d.circle('Lacivert', (26, 57), 3.8, part='kol_1', line=True, lift=0.16, noshadow=True)
    d.circle('Lacivert', (70, 57), 3.8, part='kol_2', line=True, lift=0.16, noshadow=True)


def sarmal(d, cy, R, fam, iz, tone=3, w=1.9):
    """Karindaki donen sarmal: disk + tek kollu, iki tur sarmal cizgisi."""
    d.circle(fam, (CX, cy), R, name='sp', line=True, lift=0.08, noshadow=True)
    pts = []
    for i in range(0, 36):
        t = i / 35
        a = 4.2 * math.pi * t + 0.6
        r = R * 0.82 * (0.1 + 0.9 * t)
        pts.append((CX + r * math.cos(a), cy + r * math.sin(a)))
    d.curve(iz, pts, w, clip='sp', tone=tone, shade='flat')


def patron(d):
    tepelik(d, False)
    halka(d, 0, 36, 8.5, (CX, 58), yan='arka', name='ha')            # arka yarim
    govde(d)
    sarmal(d, 54, 9.0, 'Pembe', 'Mor', w=2.2)
    d.pix((CX - 4, 49), ['oo'], {'o': 'Parilti'})
    halka(d, 0, 36, 8.5, (CX, 58), yan='on', name='hb')              # on yarim
    kollar(d)
    yildiz_bebek(d, 14, 51, 1)
    yildiz_bebek(d, 82, 51, 2)
    d.set_face(CX, 28, gap=8)


def catlak(d, pts):
    d.curve('Sari', pts, 1.7, clip='govde', tone=2, shade='flat')
    d.curve('Sari', [(x + 0.8, y) for x, y in pts], 0.8, clip='govde', tone=1, shade='flat')


def faz2(d):
    halka(d, -38, 35, 10.5, (CX, 45), yan='arka', name='ha', th=5.4)           # arka yarim govdenin arkasinda
    tepelik(d, True)
    govde(d)
    catlak(d, [(22, 37), (26, 42), (23, 47), (27, 52), (24, 57)])
    catlak(d, [(74, 37), (70, 42), (73, 47), (69, 52), (72, 57)])
    catlak(d, [(31, 58), (34, 62), (32, 65)])
    catlak(d, [(65, 58), (62, 62), (64, 65)])
    halka(d, -38, 35, 10.5, (CX, 45), yan='on', name='hb', th=5.4)              # on yarim onden gecer
    sarmal(d, 54, 9.6, 'Sari', 'Pembe', tone=3, w=2.0)
    d.pix((CX - 4, 49), ['oo'], {'o': 'Parilti'})
    kollar(d)
    yildiz_bebek(d, 13, 36, 1)
    yildiz_bebek(d, 83, 36, 2)
    d.set_face(CX, 28, gap=8)
    # kararli kaslar (ic uclar asagida)
    d.pix((36, 25), ['##...', '.####'], {'#': 'Murekkep'})
    d.pix((55, 25), ['...##', '####.'][::1], {'#': 'Murekkep'})


def yay(d, a0, ln, rs, k):
    """Halkanin kirik parcasi: elips yorungesinde ln derecelik kalin yay."""
    pts = []
    for i in range(6):
        a = math.radians(a0 + ln * i / 5)
        pts.append((CX + 39 * rs * math.cos(a), CY + 23 * rs * math.sin(a)))
    d.curve('Sari', pts, 4.4, part='esya', name='pr%d' % k, line=True, lift=0.1, noshadow=True)


def faz3(d):
    # ust parcalar govdenin arkasinda doner
    for k, (a0, ln, rs) in enumerate(((225, 24, 1.0), (262, 18, 1.07), (318, 27, 0.98))):
        yay(d, a0, ln, rs, k)
    tepelik(d, True)
    govde(d, kenar=True)
    # kara delik: mor isik halkasi, kapkara orta, pembe sarmal kalintisi
    d.circle('Mor', (CX, 55), 11.6, name='sp', line=True, lift=0.12, noshadow=True)
    d.circle('Mor', (CX, 55), 9.4, shade='flat', tone=1, noshadow=True)
    pts = [(CX + (4.5 + 7.5 * i / 24) * math.cos(0.3 + i * 0.28), 55 + (4.5 + 7.5 * i / 24) * math.sin(0.3 + i * 0.28)) for i in range(25)]
    d.curve('Pembe', pts, 1.8, clip='sp', tone=2, shade='flat')
    pts = [(CX + (4.5 + 7.5 * i / 24) * math.cos(0.3 + math.pi + i * 0.28), 55 + (4.5 + 7.5 * i / 24) * math.sin(0.3 + math.pi + i * 0.28)) for i in range(25)]
    d.curve('Pembe', pts, 1.8, clip='sp', tone=2, shade='flat')
    d.circle('Mor', (CX, 55), 5.6, shade='flat', tone=3, noshadow=True)
    d.circle('Komur', (CX, 55), 4.4, name='bh', shade='flat', tone=4, noshadow=True)
    d.pix((CX - 7, 47), ['oo'], {'o': 'Parilti'})
    # on parcalar govdenin onunden gecer
    for k, (a0, ln, rs) in enumerate(((20, 30, 1.0), (76, 20, 0.95), (116, 28, 0.94), (158, 14, 1.0))):
        yay(d, a0, ln, rs, k + 3)
    kollar(d)
    yildiz_bebek(d, 9, 44, 1)
    yildiz_bebek(d, 87, 44, 2)
    d.set_face(CX, 29, gap=8)
    # yorgun ama inatci: agir kapaklar
    d.pix((36, 26), ['####.', '.####'], {'#': 'Murekkep'})
    d.pix((55, 26), ['.####', '####.'], {'#': 'Murekkep'})


STAGES = {'patron': patron, 'faz2': faz2, 'faz3': faz3}
