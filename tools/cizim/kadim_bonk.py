# Kadim Bonk (Yildiz Cekirdegi son patronu, Kat 70). Tarif: TARIFLER.md 11.8.
# Ilk Glemon: kocaman, neredeyse tam yuvarlak, bebek yuzlu top. Gece gogu gibi Lacivert govde, karninda donen pembe sarmal,
# basinda bes kristalli tepelik, belinde yatay yildiz tozu halkasi; halkada iki minik Yildiz Tozu ('tepe').
# Faz 2 "Supernova": sarmal buyuk ve sari parlar, govdede catlaklardan isik, tepelik uzun, halka dikleskmis, kararli kasli yuz.
# Faz 3 "Kara Delik": sarmalin ortasi kapkara daire + mor isik halkasi, halka parcalanmis ve etrafinda doner, kenarlar koyu, yorgun inatci yuz.
# Renk: Lacivert (govde), Mor + Pembe (sarmal, kristal), Sari (yildiz, halka); faz3'te Komur. Parlak: Lacivert -> Gok, Pembe -> Sari.
import math
PARLA = 'Sari'

CX, CY = 48, 43


def kristal(d, x, ty, by, lean, n, fam='Mor'):
    """Tepelik kristali: sivri olmayan kalin elmas, sol acik yuz, sag koyu yuz."""
    tx = x + lean
    hw = 3.6
    pts = [(x - hw, by), (tx - hw * 0.8, ty + 6), (tx, ty), (tx + hw * 0.8, ty + 6), (x + hw, by)]
    d.poly(fam, pts, name='kr%d' % n, line=True, noshadow=True, shade='flat', tone=2)
    d.poly(fam, [(tx, ty), (x - hw - 1, by + 1), (x - 0.3, by + 1), (tx - 0.3, ty + 5)], clip='kr%d' % n, shade='flat', tone=1)
    d.poly(fam, [(tx + 0.7, ty + 3), (x + 0.5, by + 1), (x + hw + 1, by + 1), (tx + 1.5, ty)], clip='kr%d' % n, shade='flat', tone=3)
    d.pix((int(tx) - 1, int(ty) + 3), ['oo'], {'o': 'Parilti'})


def tepelik(d, uzun):
    # govdeden once: tabanlari kafanin ust kenarina gomulu
    if uzun:
        spec = ((28, 15, -4), (38, 11, -2), (48, 9, 0), (58, 11, 2), (68, 15, 4))
    else:
        spec = ((30, 15, -3), (39, 12, -1.5), (48, 10, 0), (57, 12, 1.5), (66, 15, 3))
    for i, (x, ty, lean) in enumerate(spec):
        kristal(d, x, ty + (0 if uzun else 4), 25 + abs(x - 48) * 0.18, lean, i)


def halka(d, rot, rx, ry, cy, fam='Sari', on_front=None, th=3.2, name='h'):
    d.ellipse(fam, (CX, cy), (rx, ry), rot=rot, part='esya', name=name, line=True, lift=0.1, inbox=on_front)
    d.ellipse(fam, (CX, cy), (rx - th, ry - th * 0.62), rot=rot, part='esya', sub=name)


def yildiz_bebek(d, cx, cy, k):
    """Halkada oturan minik Yildiz Tozu: Sari yuvarlak yildiz, 1x2 Murekkep gozler, pembe yanak."""
    n = 'ys%d' % k
    d.circle('Sari', (cx, cy), 4.4, part='tepe', name=n, line=True, lift=0.08, noshadow=True)
    for i in range(5):
        a = math.radians(-90 + 72 * i)
        d.capsule('Sari', (cx, cy), (cx + 7.6 * math.cos(a), cy + 7.6 * math.sin(a)), (4.4, 2.2), part='tepe', join=n)
    d.pix((int(cx) - 2, int(cy) - 1), ['#.#', '#.#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((int(cx) - 3, int(cy) + 1), ['o...o'], {'o': 'Pembe-2'}, part='tepe')


def govde(d, kenar=False):
    d.ellipse('Lacivert', (CX, CY), (30, 26), name='govde', cast=2, lift=0.02)
    # ayaklar: iki kucuk yumru
    d.ellipse('Lacivert', (34, 69.5), (8, 4.5), join='govde')
    d.ellipse('Lacivert', (62, 69.5), (8, 4.5), join='govde')
    if kenar:
        d.ellipse('Komur', (CX, CY), (30, 26), name='kenar', clip='govde', tone=3, shade='flat')
        d.ellipse('Komur', (CX + 0.5, CY - 0.5), (27, 23), sub='kenar')
        d.ellipse('Komur', (CX, CY + 1), (30, 26), name='kenar2', clip='govde', tone=4, shade='flat')
        d.ellipse('Komur', (CX + 1, CY - 1.5), (28, 23.8), sub='kenar2')
    # yildiz benekleri: yuz alaninin disinda, 2 piksellik
    for x, y in ((24, 30), (21, 41), (28, 55), (73, 33), (70, 47), (66, 58), (36, 21), (62, 22)):
        d.pix((x, y), ['oo'], {'o': 'Parilti'})
    for x, y in ((18, 49), (75, 40), (31, 62), (60, 63)):
        d.pix((x, y), ['#', '#'], {'#': 'Sari-1'})


def kollar(d, yukari=False):
    if not yukari:
        d.capsule('Lacivert', (23, 47), (26, 58), (8, 7), part='kol_1', line=True, name='k1', lift=0.1)
        d.capsule('Lacivert', (73, 47), (70, 58), (8, 7), part='kol_2', line=True, name='k2', lift=0.1)
        d.circle('Lacivert', (27, 59), 4.2, part='kol_1', line=True, lift=0.16, noshadow=True)
        d.circle('Lacivert', (69, 59), 4.2, part='kol_2', line=True, lift=0.16, noshadow=True)


def sarmal(d, cy, R, fam, iz, glow=False, kara=False):
    """Karindaki donen sarmal: disk + iki kollu sarmal cizgisi."""
    d.circle(fam, (CX, cy), R, name='sp', line=True, lift=0.08, noshadow=True)
    for ph in (0, math.pi):
        pts = []
        for i in range(0, 30):
            t = i / 29
            a = ph + 4.6 * t * math.pi * 0.9 + 0.4
            r = R * 0.92 * (0.15 + 0.85 * t) if False else R * 0.9 * t
            pts.append((CX + r * math.cos(a), cy + r * math.sin(a)))
        d.curve(iz, pts, (0.8, 2.2), clip='sp', tone=2 if not glow else 1, shade='flat')


def patron(d):
    tepelik(d, False)
    halka(d, 0, 36, 8.5, 64, on_front=(0, 0, 96, 64))     # arka yarim
    govde(d)
    sarmal(d, 53, 8.4, 'Pembe', 'Mor')
    d.pix((CX - 3, 49), ['oo'], {'o': 'Parilti'})
    halka(d, 0, 36, 8.5, 64, on_front=(0, 64, 96, 80), name='h2')    # on yarim
    kollar(d)
    yildiz_bebek(d, 13, 56, 1)
    yildiz_bebek(d, 83, 56, 2)
    d.set_face(CX, 29, gap=8)


def catlak(d, pts):
    d.curve('Sari', pts, 1.3, clip='govde', tone=2, shade='flat')
    d.curve('Sari', [(x + 0.8, y) for x, y in pts], 0.8, clip='govde', tone=1, shade='flat')


def faz2(d):
    tepelik(d, True)
    halka(d, -64, 30, 7.5, 43)
    govde(d)
    # catlaklardan sizan isik (yuzden ve sarmaldan uzakta)
    catlak(d, [(19, 44), (23, 48), (21, 53), (25, 58)])
    catlak(d, [(77, 42), (73, 47), (75, 52), (71, 57)])
    catlak(d, [(30, 24), (33, 28)])
    catlak(d, [(66, 24), (63, 28)])
    sarmal(d, 55, 11.5, 'Sari', 'Pembe', glow=True)
    d.pix((CX - 4, 49), ['oo'], {'o': 'Parilti'})
    # halkanin on yarisi (sag taraf govdenin onunden gecer)
    halka(d, -64, 30, 7.5, 43, on_front=(CX + 1, 0, 96, 80), name='h2')
    kollar(d)
    yildiz_bebek(d, 12, 30, 1)
    yildiz_bebek(d, 84, 30, 2)
    d.set_face(CX, 28, gap=8)
    # kararli kaslar
    d.pix((31, 25), ['..##', '###.'], {'#': 'Murekkep'})
    d.pix((57, 25), ['##..', '.###'], {'#': 'Murekkep'})


def faz3(d):
    tepelik(d, True)
    govde(d, kenar=True)
    # kara delik: mor isik halkasi, kapkara orta, pembe kalintilar
    d.circle('Mor', (CX, 55), 12.5, name='sp', line=True, lift=0.1, noshadow=True)
    d.circle('Mor', (CX, 55), 10.3, name='sp2', shade='flat', tone=1, noshadow=True)
    d.circle('Komur', (CX, 55), 8.6, name='bh', shade='flat', tone=4, noshadow=True, line=True)
    for ph in (0.5, 0.5 + math.pi):
        pts = [(CX + (9.5 + 2.2 * (i / 14)) * math.cos(ph + i * 0.22), 55 + (9.5 + 2.2 * (i / 14)) * math.sin(ph + i * 0.22)) for i in range(15)]
        d.curve('Pembe', pts, 1.4, clip='sp', tone=2, shade='flat')
    d.pix((CX - 8, 49), ['oo'], {'o': 'Parilti'})
    # parcalanmis halka: govdenin etrafinda donen parcalar
    for k, (ang, ln) in enumerate(((200, 14), (250, 11), (330, 13), (20, 14), (75, 12), (130, 11))):
        a = math.radians(ang)
        rx, ry = 38, 29
        x, y = CX + rx * math.cos(a), CY + 4 + ry * math.sin(a)
        ta = a + math.pi / 2
        dx, dy = math.cos(ta) * ln / 2 * (rx / 38.0), math.sin(ta) * ln / 2 * (ry / 38.0)
        if 15 < ang < 165:
            on = None
        n = 'pr%d' % k
        d.capsule('Sari', (x - dx, y - dy), (x + dx, y + dy), (3.8, 3.8), part='esya', name=n, line=True, lift=0.1, noshadow=True)
    kollar(d)
    yildiz_bebek(d, 12, 24, 1)
    yildiz_bebek(d, 84, 24, 2)
    d.set_face(CX, 29, gap=8)
    # yorgun ama inatci: agir kapak cizgisi, duz kaslar
    d.pix((31, 26), ['###', '.##'], {'#': 'Murekkep'})
    d.pix((60, 26), ['###', '##.'], {'#': 'Murekkep'})


STAGES = {'patron': patron, 'faz2': faz2, 'faz3': faz3}
