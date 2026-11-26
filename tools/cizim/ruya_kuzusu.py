# Ruya Kuzusu (Ay, epik). Tarif: TARIFLER.md. Yunu pembe bir bulut, yuzu ve bacaklari Mor, sarkik kulakli uyuklayan kuzu.
# Renk: Pembe (yun), Mor (yuz, kulak, bacak, takke), Sari (hilal can, yildiz benek, puskul). Epik isik kaynagi: Sari hilal can + puskul.
# Not: arac yari kapali goz basamaz; uykulu hal sarkik kulak, takke ve yuzun alcakliginda verildi. Parlak: Pembe -> Gok.
import math
PARLA = 'Sari'

STAR = ['.o.', 'ooo', '.o.']
CRES = ['..oo', '.oo.', 'oo..', 'oo..', '.oo.', '..oo']


def yun(d, cx, cy, rx, ry, n, r, name='yun', start=0.3, part='govde'):
    d.ellipse('Pembe', (cx, cy), (rx, ry), name=name, lift=0.08, cast=1, part=part)
    for i in range(n):
        a = start + 2 * math.pi * i / n
        d.circle('Pembe', (cx + math.cos(a) * rx * 0.92, cy + math.sin(a) * ry * 0.92), r, join=name, part=part)


def yuz(d, cx, cy, rx, ry):
    d.ellipse('Mor', (cx, cy), (rx, ry), name='yuz', lift=0.22, cast=1)


def kulaklar(d, cx, y, dx, ln, w=(4.2, 3.0)):
    d.capsule('Mor', (cx - dx, y), (cx - dx - 3, y + ln), w, part='kulak_1', line=True, lift=-0.1)
    d.capsule('Mor', (cx + dx, y), (cx + dx + 3, y + ln), w, part='kulak_2', line=True, lift=-0.1)


def bacak(d, cx, y, dx, w=3.4):
    d.ellipse('Mor', (cx - dx, y + 1), (w, w * 0.8), part='kol_1', line=True)
    d.ellipse('Mor', (cx + dx, y + 1), (w, w * 0.8), part='kol_2', line=True)


def bebek(d):
    yun(d, 24, 31, 12, 10.5, 10, 3.9)
    d.circle('Pembe', (24, 21.5), 3.4, join='yun')
    d.circle('Pembe', (19.5, 22.5), 3.0, join='yun')
    bacak(d, 24, 41, 6.5, 3.4)
    yuz(d, 24, 36.5, 9.5, 7)
    kulaklar(d, 24, 30, 11.5, 9)
    d.set_face(24, 33, gap=5, ten='Pembe')


def genc(d):
    yun(d, 28, 35, 15, 12.5, 12, 4.3)
    for dx in (-5, 0, 5):
        d.circle('Pembe', (28 + dx, 23.5 - (0 if dx else 1.5)), 3.8, join='yun')
    bacak(d, 28, 46, 8, 3.8)
    yuz(d, 28, 40, 10.5, 8)
    kulaklar(d, 28, 32, 13.5, 11)
    d.pix((19, 27), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((36, 26), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((26, 47), CRES, {'o': 'Sari-1'}, part='esya')
    d.pix((27, 48), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face(28, 37, gap=5, ten='Pembe')


def usta(d):
    yun(d, 32, 44, 19.5, 11.5, 14, 4.8, name='alt', start=0.2)
    yun(d, 32, 33, 16.5, 12.5, 12, 4.8, name='ust', start=0.5)
    bacak(d, 32, 53, 9, 4.2)
    yuz(d, 32, 41, 12, 9)
    kulaklar(d, 32, 33, 17.5, 13, (5, 3.6))
    # uyku takkesi: Mor, yana sarkan uc, Sari puskul
    d.poly('Mor', [(21, 27), (22, 17), (28, 10), (36, 10), (43, 17), (44, 27)], part='tepe', name='takke', line=True, lift=0.05)
    d.curve('Mor', [(38, 12), (46, 11), (51, 18)], 4.4, part='tepe', line=True)
    d.ellipse('Pembe', (32.5, 27), (13.5, 2.8), part='tepe', line=True, name='kenar', lift=0.05)
    d.circle('Sari', (52, 22), 3.8, part='esya', line=True, lift=0.12)
    d.pix((50, 20), ['oo', 'o.'], {'o': 'Parilti'}, part='esya')
    d.pix((27, 18), ['oo', 'o.'], {'o': 'Sari-1'}, part='tepe')
    d.pix((19, 30), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((43, 31), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((30, 51), CRES, {'o': 'Sari-1'}, part='esya')
    d.pix((31, 52), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face(32, 38, gap=6, ten='Pembe')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def kulak_yan(d, x, y, ln, part, lift, w=(4.2, 3.0), back=3):
    d.capsule('Mor', (x, y), (x + back, y + ln), w, part=part, line=True, lift=lift)


def bacak_yan(d, x1, x2, y, w):
    d.ellipse('Mor', (x2, y + 1), (w, w * 0.8), part='kol_2', line=True, lift=-0.1)
    d.ellipse('Mor', (x1, y + 1), (w, w * 0.8), part='kol_1', line=True)


def bebek_yan(d):
    yun(d, 27, 31, 12, 10.5, 10, 3.9)
    d.circle('Pembe', (22, 21.5), 3.4, join='yun')
    d.circle('Pembe', (27, 20.5), 3.0, join='yun')
    kulak_yan(d, 28, 35, 11, 'kulak_2', -0.15, back=2)
    bacak_yan(d, 21, 33, 41, 3.4)
    d.ellipse('Mor', (16, 37), (8, 7.2), name='yuz', lift=0.22, cast=1)
    kulak_yan(d, 23, 36, 11, 'kulak_1', -0.1, back=1)
    d.set_face_side(12, 33, ten='Pembe') if False else d.set_face_side(12, 33)


def genc_yan(d):
    yun(d, 32, 35, 15, 12.5, 12, 4.3)
    for dx in (-3, 3, 9):
        d.circle('Pembe', (28 + dx, 23.5 - (1.5 if dx == 3 else 0)), 3.8, join='yun')
    kulak_yan(d, 32, 40, 11, 'kulak_2', -0.15, back=2)
    bacak_yan(d, 22, 38, 46, 3.8)
    d.ellipse('Mor', (18, 41), (9, 8), name='yuz', lift=0.22, cast=1)
    d.pix((30, 28), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((41, 33), STAR, {'o': 'Sari-1'}, part='govde')
    kulak_yan(d, 27, 41, 12, 'kulak_1', -0.1, back=1)
    d.pix((21, 48), CRES, {'o': 'Sari-1'}, part='esya')
    d.pix((22, 49), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face_side(12, 37)


def usta_yan(d):
    yun(d, 38, 44, 19.5, 11.5, 14, 4.8, name='alt', start=0.2)
    yun(d, 36, 33, 16.5, 12.5, 12, 4.8, name='ust', start=0.5)
    kulak_yan(d, 35, 44, 12, 'kulak_2', -0.15, (5, 3.6), back=2)
    bacak_yan(d, 25, 43, 53, 4.2)
    d.ellipse('Mor', (19, 42), (10, 8.5), name='yuz', lift=0.22, cast=1)
    kulak_yan(d, 29, 45, 13, 'kulak_1', -0.1, (5, 3.6), back=1)
    d.poly('Mor', [(13, 31), (15, 24), (21, 18), (28, 17), (34, 22), (35, 31)], part='tepe', name='takke', line=True, lift=0.05)
    d.curve('Mor', [(31, 19), (40, 17), (46, 23)], 4.4, part='tepe', line=True)
    d.ellipse('Pembe', (24, 31), (12, 2.8), part='tepe', line=True, name='kenar', lift=0.05)
    d.circle('Sari', (47, 28), 3.8, part='esya', line=True, lift=0.12)
    d.pix((45, 26), ['oo', 'o.'], {'o': 'Parilti'}, part='esya')
    d.pix((22, 23), ['oo', 'o.'], {'o': 'Sari-1'}, part='tepe')
    d.pix((36, 28), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((50, 40), STAR, {'o': 'Sari-1'}, part='govde')
    d.pix((23, 52), CRES, {'o': 'Sari-1'}, part='esya')
    d.pix((24, 53), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face_side(12, 38)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
