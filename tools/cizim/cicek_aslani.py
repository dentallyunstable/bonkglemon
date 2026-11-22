# Cicek Aslani (Orman, efsanevi). Tarif: TARIFLER.md. Yelesi pembe cicek yapraklarindan, kafasi cicegin ortasi olan tombul altin aslan yavrusu.
# Renk: Sari (tuy + altin halka), Pembe (yele yapraklari, cicek), Cimen (sap, yaprak). Bebek tek sira, genc cift sira, usta katmanli yele.
# Kuyruk ucu: tomurcuk -> yarim cicek -> tam cicek. Parlak: Pembe -> Gok.
import math
PARLA = 'Pembe'


def yapraklar(d, c, R, rx, ry, n, off=0, lift=0.0, pre='p', fam='Pembe'):
    """c merkezli halka: n yaprak, ry yaricap yonunde uzun."""
    for i in range(n):
        a = math.radians(off + i * 360.0 / n)
        x = c[0] + R * math.sin(a)
        y = c[1] - R * math.cos(a)
        d.ellipse(fam, (x, y), (rx, ry), rot=math.degrees(a), name='%s%d' % (pre, i), lift=lift)


def cicek(d, c, n, R, rx, ry, rot=0, part='kuyruk', pre='c', mer=2.0):
    """Kuyruk cicegi: n yaprak + Sari orta."""
    for i in range(n):
        a = math.radians(rot + i * 360.0 / n)
        x = c[0] + R * math.sin(a)
        y = c[1] - R * math.cos(a)
        d.ellipse('Pembe', (x, y), (rx, ry), rot=math.degrees(a), part=part, name='%s%d' % (pre, i), line=True, lift=0.22)
    d.circle('Sari', c, mer, part=part, line=True, lift=0.2)


def tomurcuk(d, c, s=1.0, part='kuyruk'):
    d.ellipse('Pembe', c, (2.6 * s, 3.4 * s), part=part, line=True, lift=0.08, name='tom')
    d.ellipse('Cimen', (c[0], c[1] + 2.2 * s), (2.4 * s, 1.6 * s), part=part, clip='tom', tone=3)


def kulak(d, x, y, r, side):
    nm = 'ku%d' % side
    d.circle('Sari', (x, y), r, part='kulak_%d' % side, name=nm, line=True)
    d.circle('Pembe', (x, y + 0.5), r * 0.5, part='kulak_%d' % side, clip=nm, tone=2)


def bebek(d):
    cx = 24
    # kuyruk: kisa sap, ucta tomurcuk
    d.curve('Sari', [(30, 42), (37, 44), (40, 39)], 3.2, part='kuyruk', line=True)
    tomurcuk(d, (40.5, 35.5), 0.95)
    d.ellipse('Sari', (17.5, 43), (3.8, 2.6), part='kol_1', line=True, noshadow=True)
    d.ellipse('Sari', (30.5, 43), (3.8, 2.6), part='kol_2', line=True, noshadow=True)
    # tek sira tac yaprak
    yapraklar(d, (cx, 31), 9.6, 3.7, 4.4, 10, off=18, lift=-0.04)
    kulak(d, 15.5, 21, 3.0, 1)
    kulak(d, 32.5, 21, 3.0, 2)
    d.ellipse('Sari', (cx, 31.5), (9.4, 8.8), name='kafa', cast=1, lift=0.04)
    d.set_face(cx, 29.5, gap=5)


def genc(d):
    cx = 27
    # kuyruk: yarim acik cicek
    # govde + bacaklar
    d.ellipse('Sari', (cx, 42), (10, 6.5), name='govde', cast=1, lift=-0.04)
    d.ellipse('Sari', (cx - 6.5, 47.5), (4.2, 2.6), part='kol_1', line=True, noshadow=True)
    d.ellipse('Sari', (cx + 6.5, 47.5), (4.2, 2.6), part='kol_2', line=True, noshadow=True)
    # iki sira yele
    yapraklar(d, (cx, 31), 12.2, 4.2, 5.2, 12, off=0, lift=-0.14, pre='d')
    yapraklar(d, (cx, 31), 8.8, 3.6, 4.4, 9, off=20, lift=0.02, pre='e')
    kulak(d, cx - 11, 19, 3.3, 1)
    kulak(d, cx + 11, 19, 3.3, 2)
    d.ellipse('Sari', (cx, 31.5), (9.6, 9.0), name='kafa', cast=1, lift=0.05)
    d.ellipse('Sari', (cx - 5.2, 43), (3.0, 2.5), part='kol_1', line=True)
    d.ellipse('Sari', (cx + 5.2, 43), (3.0, 2.5), part='kol_2', line=True)
    d.curve('Sari', [(34, 46), (41, 47), (45, 45)], 3.2, part='kuyruk', line=True)
    cicek(d, (46.5, 41), 5, 3.4, 2.4, 3.0, rot=-60, mer=1.9)
    d.set_face(cx, 29.5, gap=5)


def usta(d):
    cx = 30
    # kuyruk: tam cicek
    # govde + bacaklar
    d.ellipse('Sari', (cx, 47), (12.5, 8), name='govde', cast=1, lift=-0.04)
    d.ellipse('Sari', (cx - 8, 54), (4.8, 3.0), part='kol_1', line=True, noshadow=True)
    d.ellipse('Sari', (cx + 8, 54), (4.8, 3.0), part='kol_2', line=True, noshadow=True)
    # ayak dibinde iki yaprak
    d.ellipse('Cimen', (cx - 16, 55.5), (4.6, 2.2), rot=-15, part='esya', line=True, name='y1')
    d.ellipse('Cimen', (cx + 16, 55.5), (4.6, 2.2), rot=15, part='esya', line=True, name='y2')
    # katmanli yele: uc sira
    yapraklar(d, (cx, 33), 15.4, 4.8, 6.0, 14, off=0, lift=-0.2, pre='a')
    yapraklar(d, (cx, 33), 12.2, 4.4, 5.4, 12, off=15, lift=-0.07, pre='b')
    yapraklar(d, (cx, 33), 9.2, 3.8, 4.6, 10, off=0, lift=0.05, pre='c')
    kulak(d, cx - 13, 19, 3.6, 1)
    kulak(d, cx + 13, 19, 3.6, 2)
    d.ellipse('Sari', (cx, 34), (11.2, 10.2), name='kafa', cast=1, lift=0.05)
    # altin halka (boyun)
    d.curve('Sari', [(cx - 10, 43), (cx, 47), (cx + 10, 43)], 2.8, name='halka', line=True, lift=0.3, cast=1)
    d.ellipse('Sari', (cx - 7, 50), (3.2, 2.8), part='kol_1', line=True)
    d.ellipse('Sari', (cx + 7, 50), (3.2, 2.8), part='kol_2', line=True)
    d.curve('Sari', [(38, 52), (47, 53), (52, 50)], 3.8, part='kuyruk', line=True)
    cicek(d, (54.5, 46), 7, 3.9, 2.5, 3.1, rot=0, mer=2.2)
    d.set_face(cx, 32, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
