# Firtina Cakali (Kavurucu Col patronu, Kat 30). Tarif: TARIFLER.md 11.4.
# Tapinak bekcisi heykeli gibi dik oturan col cakali: cok uzun kulaklar, kabarik krem gogus, yukari cene,
# turkuaz tasli genis altin gerdanlik, kuyrugu donen kum girdabi, sirtinda Toz Kertenkelesi ('tepe').
# Faz 2 "Kum Hortumu": dort ayak, one egik; girdap buyuyup sirti pelerin gibi sarar, kulaklar geri yatik, gozlerin cevresinde turkuaz cizgi.
# Renk: Turuncu (tuy), Sari (kum + altin), Cam (turkuaz tas), Krem (gogus).
PARLA = 'Sari'


def kertenkele(d, cx, top):
    """Sirtta guneslenen minik Toz Kertenkelesi: sari govde, turuncu yaka, 1x2 gozler."""
    d.ellipse('Turuncu', (cx, top + 4.5), (7.2, 5.2), part='tepe', name='yk%d' % cx, line=True, noshadow=True)
    for k in range(-3, 4):
        d.circle('Turuncu', (cx + k * 2.1, top + 1.2 + abs(k) * 0.5), 1.4, part='tepe', join='yk%d' % cx)
    d.ellipse('Sari', (cx, top + 7.5), (6.0, 4.6), part='tepe', name='kg%d' % cx, line=True, lift=0.06, noshadow=True)
    d.pix((int(cx) - 3, int(top) + 6), ['#..#', '#..#'], {'#': 'Murekkep'}, part='tepe')
    d.pix((int(cx) - 4, int(top) + 8), ['o....o'], {'o': 'Pembe-2'}, part='tepe')


def girdap(d, cx, ytop, ybot, rtop, rbot, n, name, part='kuyruk'):
    """Donen kum girdabi: ustte genis, altta dar, ust uste dizili Sari halkalar."""
    for i in range(n):
        t = i / (n - 1)
        y = ytop + (ybot - ytop) * t
        r = rtop + (rbot - rtop) * t
        x = cx + (3 if i % 2 else -3) * (1 - t) * 0.6
        if i == 0:
            d.ellipse('Sari', (x, y), (r, r * 0.34 + 1.2), part=part, name=name, line=True, lift=0.06)
        else:
            d.ellipse('Sari', (x, y), (r, r * 0.34 + 1.2), part=part, join=name)
    # donus bantlari (koyu + acik cizgiler)
    for i in range(1, n):
        t = i / (n - 1)
        y = ytop + (ybot - ytop) * t
        r = rtop + (rbot - rtop) * t
        d.curve('Sari', [(cx - r * 0.9, y - 1), (cx, y + r * 0.2 + 1.5), (cx + r * 0.9, y - 1)], 1.0, part=part, clip=name, shift=1 if i % 2 else -1)


def kulak(d, side, pts, w, part=None):
    part = part or 'kulak_%d' % side
    d.curve('Turuncu', pts, w, part=part, line=True, name='ku%d' % side, lift=0.04)
    # ic kulak krem
    inner = [(x + (1 if side == 2 else -1) * 0.0, y) for x, y in pts[1:]]
    d.curve('Krem', inner, (w[0] * 0.45, w[1] * 0.3), part=part, clip='ku%d' % side, tone=1, shade='flat')


def gerdanlik(d, cx, cy, rx, faz=False):
    d.ellipse('Sari', (cx, cy), (rx, 5.2), name='gerd', line=True, lift=0.06, cast=1)
    d.ellipse('Sari', (cx, cy - 1.5), (rx - 3, 2), clip='gerd', shift=-1)
    for dx, dy, r in ((-rx * 0.62, 1.0, 2.2), (0, 2.4, 2.8), (rx * 0.62, 1.0, 2.2)):
        d.circle('Cam', (cx + dx, cy + dy), r, line=True, shade='flat', tone=2, noshadow=True, name='ts')
        d.pix((int(cx + dx) - 1, int(cy + dy) - 1), ['o'], {'o': 'Parilti'})
    for dx in (-rx * 0.31, rx * 0.31):
        d.pix((int(cx + dx), int(cy + 3)), ['#'], {'#': 'Sari-4'})


def patron(d):
    # kum girdabi kuyruk (sagda, buyuk)
    girdap(d, 78, 38, 75, 13, 4.5, 8, 'gir')
    d.ellipse('Sari', (70, 72), (6, 3.5), part='kuyruk', join='gir')
    # arka bacaklar/kalcalar
    d.ellipse('Turuncu', (32, 68), (11, 9), name='kal1', lift=-0.06)
    d.ellipse('Turuncu', (64, 68), (11, 9), name='kal2', lift=-0.06)
    # govde
    d.ellipse('Turuncu', (48, 58), (22, 19), name='govde', cast=3)
    # kabarik krem gogus
    d.ellipse('Krem', (48, 62), (14.5, 13), name='gogus', line=True, lift=0.03)
    d.ellipse('Krem', (43, 56), (4.5, 2.4), clip='gogus', shift=-1, rot=-30)
    for x in (41, 45, 49, 53, 57):
        d.poly('Krem', [(x - 2, 73), (x, 76.5), (x + 2, 73)], noshadow=True, shade='flat', tone=1, clip='gogus')
    # on bacaklar
    for side, x in ((1, 30), (2, 66)):
        part = 'kol_%d' % side
        sx = 1 if side == 1 else -1
        d.capsule('Turuncu', (x, 51), (x + sx, 72), (8, 7), part=part, line=True, name='ob%d' % side, lift=0.04)
        d.ellipse('Turuncu', (x - sx, 74), (6, 3.4), part=part, line=True, lift=0.06)
        for dx in (-2, 1):
            d.pix((x + dx - sx, 75), ['#'], {'#': 'Turuncu-4'}, part=part)
    # kafa
    d.ellipse('Turuncu', (48, 35), (19, 13.5), name='kafa', cast=2, lift=0.06)
    d.ellipse('Turuncu', (37, 26.5), (5, 2.2), clip='kafa', shift=-1, rot=-15)
    gerdanlik(d, 48, 51.5, 21)
    # cok uzun, genis tabanli kulaklar
    kulak(d, 1, [(38, 29), (34, 20), (32, 12.5)], (11, 4.4))
    kulak(d, 2, [(58, 29), (62, 20), (64, 12.5)], (11, 4.4))
    kertenkele(d, 66, 35)
    d.set_face(48, 32, gap=8, ten='Turuncu')


def pelerin(d):
    """Buyuyen kum girdabi sirti pelerin gibi sarar: arkada ustte genis, altta daralan donen halkalar (hortum)."""
    girdap(d, 48, 27, 68, 31, 19, 7, 'pel')
    for x, y in ((12, 24), (84, 25), (8, 50), (88, 51)):
        d.pix((x, y), ['.#.', '###', '.#.'], {'#': 'Sari-2'}, part='kuyruk', keep=True)


def faz2(d):
    pelerin(d)
    # arka kalcalar
    d.ellipse('Turuncu', (28, 67), (12, 9), name='kal1', lift=-0.1)
    d.ellipse('Turuncu', (68, 67), (12, 9), name='kal2', lift=-0.1)
    d.ellipse('Turuncu', (48, 55), (24, 16), name='govde', cast=3, lift=-0.04)
    # on bacaklar one basik
    for side, x in ((1, 27), (2, 69)):
        part = 'kol_%d' % side
        sx = 1 if side == 1 else -1
        d.capsule('Turuncu', (x + sx * 3, 53), (x - sx * 3, 72), (10, 8), part=part, line=True, lift=0.04)
        d.ellipse('Turuncu', (x - sx * 4, 74), (7.5, 3.6), part=part, line=True, lift=0.06)
        for dx in (-3, 0):
            d.pix((x - sx * 4 + dx, 75), ['#'], {'#': 'Turuncu-4'}, part=part)
    d.ellipse('Krem', (48, 71), (11, 5.5), name='gogus', line=True)
    # kafa alcakta, one egik, buyuk
    d.ellipse('Turuncu', (48, 45), (21, 15), name='kafa', cast=2, lift=0.04, line=True)
    d.ellipse('Turuncu', (36, 34.5), (5, 2.2), clip='kafa', shift=-1, rot=-15)
    gerdanlik(d, 48, 60.5, 19)
    # geriye yatik kulaklar (arka-asagi)
    kulak(d, 1, [(33, 36), (24, 35), (12, 42)], (10, 4))
    kulak(d, 2, [(63, 36), (72, 35), (84, 42)], (10, 4))
    kertenkele(d, 66, 22)
    d.set_face(48, 41, gap=8, ten='Turuncu')
    # gozlerin cevresinde turkuaz cizgiler (goz ucundan yukari kanat + kas ustu)
    for sx in (-1, 1):
        d.capsule('Cam', (48 + sx * 17, 45), (48 + sx * 22, 40), 1.8, shade='flat', tone=2)
        d.capsule('Cam', (48 + sx * 5, 36.5), (48 + sx * 14, 35), 1.6, shade='flat', tone=2)


STAGES = {'patron': patron, 'faz2': faz2}
