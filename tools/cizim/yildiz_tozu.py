# Yildiz Tozu (Yildiz, siradan, ucar). Tarif: TARIFLER.md. Kanatsiz, kosesi yuvarlak tombul yildiz.
# Renk: Sari (govde), Pembe (kuyruk, halka). Bebek yalniz yildiz, genc kuyruklu yildiz, usta halka + iki yavru yildiz.
import math
PARLA = 'Sari'


def yildiz(d, cx, cy, R, rc, w, name='s', rot=-90, tw=4.6, **kw):
    d.circle('Sari', (cx, cy), rc, name=name, **kw)
    for i in range(5):
        a = math.radians(rot + 72 * i)
        d.capsule('Sari', (cx, cy), (cx + R * math.cos(a), cy + R * math.sin(a)), (w, tw), join=name)


def bebek(d):
    d.flyer = True
    yildiz(d, 24, 30, 12.5, 9.5, 12, cast=1)
    d.set_face(24, 29, gap=5)


def genc(d):
    d.flyer = True
    # kuyruklu yildiz kuyrugu: atki gibi dalgali, pembe
    d.curve('Pembe', [(31, 44), (36, 45), (40, 40), (44, 43), (47, 37)], (6.4, 3.0), part='kuyruk', name='k', line=True)
    d.curve('Pembe', [(35, 44), (39, 41), (43, 42)], 2.4, part='kuyruk', clip='k', shift=-1)
    d.pix((37, 43), ['oo'], {'o': 'Parilti'}, part='kuyruk')
    yildiz(d, 22, 33, 15, 11, 14, cast=1)
    d.set_face(22, 32, gap=5)


def usta(d):
    d.flyer = True
    cx, cy = 32, 36
    # ince halka (esya)
    d.ellipse('Pembe', (cx, cy + 2), (26, 8.5), rot=0, part='esya', name='h', line=True, lift=0.1)
    d.ellipse('Pembe', (cx, cy + 2), (23.4, 6), rot=0, part='esya', sub='h')
    yildiz(d, cx, cy, 19.5, 14, 18, tw=5.4, cast=1)
    # halkanin on kolu yildizin onunden gecer
    d.ellipse('Pembe', (cx, cy + 2), (26, 8.5), rot=0, part='esya', name='h2', inbox=(10, cy + 8, 54, 60), line=True, lift=0.1)
    d.ellipse('Pembe', (cx, cy + 2), (23.4, 6), rot=0, part='esya', sub='h2')
    # yavru yildizlar
    for (x, y) in ((8, 20), (56, 22)):
        d.pix((x - 3, y - 3), ['..#..', '.###.', '#####', '.###.', '..#..'][:5],
              {'#': 'Sari-2'}, part='esya')
        d.pix((x - 1, y - 1), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face(cx, 35, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
