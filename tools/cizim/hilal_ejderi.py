# Hilal Ejderi (Ay, epik, ucar). Tarif: TARIFLER.md. Hilal gibi kivrilan tombul lavanta ejder: kafa ustte, govde solda asagi inip kuyrukla sagda yukari kivrilir (C).
# Kanatsiz suzulur: kanat_1/kanat_2 parcalari gercek kanat degil, kucuk yuzgec/bulut kabarciklari (bebekte minik yuzgec, gencte/ustada bulut yele kabarciklari).
# Yakut Ejder (kirmizi, kanatli, karin tasi) ve Gol Ejderi (turkuaz, yuzgec kulakli) ile karismasin: lavanta, C kivrimi, bulut yele, ay tasi pencede.
# Renk: Mor (govde, acik ton), Kar (bulut yele, puskul), Sari (boynuz, ay tasi). Parlak: Mor -> Lacivert.
PARLA = 'Sari'


def mir(pts, cx):
    return [(2 * cx - x, y) for x, y in pts]


def govde(d, pts, w):
    d.curve('Mor', pts, w, name='g', line=True, lift=0.06, cast=1)


def bulut(d, x, y, r, part, nm, line=True):
    d.circle('Kar', (x, y), r, part=part, name=nm, line=line, lift=0.0)
    d.circle('Kar', (x - r * 0.9, y + r * 0.5), r * 0.75, part=part, join=nm)
    d.circle('Kar', (x + r * 0.8, y + r * 0.6), r * 0.7, part=part, join=nm)


def bebek(d):
    d.flyer = True
    cx = 25
    # C govde: kafanin solundan asagi, altta saga kivrilir
    govde(d, [(17, 24), (13, 29), (15, 33.5), (21, 36), (27, 34.5), (31, 30)], (10.0, 4.0))
    # basta kucuk yuzgec yelesi (kanat parcalari)
    d.ellipse('Mor', (12, 30), (2.4, 3.0), part='kanat_1', line=True, lift=0.14)
    d.ellipse('Mor', (cx - 1, 20), (11.8, 9.2), name='kafa', lift=0.06, cast=1)
    d.circle('Mor', (31.5, 29.5), 2.6, part='kanat_2', line=True, lift=0.14)
    d.set_face(cx - 1, 19, gap=5)


def genc(d):
    d.flyer = True
    cx = 28
    govde(d, [(20, 29), (13, 36), (14, 42), (23, 46), (34, 43), (40, 38)], (12.0, 5.0))
    bulut(d, 10.5, 36, 3.6, 'kanat_1', 'y1')
    bulut(d, 12.5, 44, 3.2, 'kanat_1', 'y2')
    bulut(d, 45, 35, 3.2, 'kanat_2', 'y3')
    d.ellipse('Mor', (cx, 25), (13.5, 11.5), name='kafa', lift=0.06, cast=1)
    bulut(d, cx, 13.5, 3.4, 'tepe', 'y4')
    d.capsule('Kar', (cx - 12, 29), (cx - 18, 27), (1.6, 1.0), part='esya', line=True)
    d.capsule('Kar', (cx + 12, 29), (cx + 18, 27), (1.6, 1.0), part='esya', line=True)
    d.circle('Mor', (41, 36.5), 2.8, line=True, lift=0.12)
    d.set_face(cx, 24, gap=5)


def usta(d):
    d.flyer = True
    cx = 32
    govde(d, [(22, 33), (12, 43), (13, 52), (23, 57), (36, 54), (46, 47)], (14.0, 5.5))
    bulut(d, 49.5, 44, 4.0, 'kuyruk', 'pk')
    bulut(d, 7.5, 44, 4.2, 'kanat_1', 'y1')
    bulut(d, 10.5, 53, 3.6, 'kanat_1', 'y2')
    bulut(d, 53, 33, 3.6, 'kanat_2', 'y3')
    d.ellipse('Mor', (cx, 28), (15.5, 13), name='kafa', lift=0.06, cast=1)
    d.capsule('Sari', (cx - 9, 19), (cx - 12, 10), (3.4, 1.6), part='tepe', line=True, lift=0.1)
    d.capsule('Sari', (cx + 9, 19), (cx + 12, 10), (3.4, 1.6), part='tepe', line=True, lift=0.1)
    d.capsule('Kar', (cx - 14.5, 33), (cx - 21, 31), (1.8, 1.0), part='esya', line=True)
    d.capsule('Kar', (cx + 14.5, 33), (cx + 21, 31), (1.8, 1.0), part='esya', line=True)
    d.circle('Mor', (cx - 5, 51.5), 2.6, part='kol_1', line=True, lift=0.1)
    d.circle('Mor', (cx + 7, 51.5), 2.6, part='kol_2', line=True, lift=0.1)
    d.circle('Sari', (cx + 1, 50.5), 4.2, part='esya', name='tas', line=True, lift=0.12)
    d.circle('Mor', (cx + 3.2, 49.3), 3.0, part='esya', sub='tas')
    d.pix((cx - 2, 48.5), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face(cx, 27, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


# ---------------------------------------------------------------- yandan (1.0.28): sola bakar, yururken
def bebek_yan(d):
    d.flyer = True
    govde(d, [(21, 26), (15, 31), (17, 35.5), (24, 38), (31, 36), (35, 31)], (10.0, 4.0))
    d.circle('Mor', (34.5, 30), 2.6, part='kanat_2', line=True, lift=0.14)
    d.ellipse('Mor', (29, 24), (2.6, 3.0), part='kanat_1', line=True, lift=0.14)
    d.ellipse('Mor', (19, 21), (11.8, 9.2), name='kafa', lift=0.06, cast=1)
    d.ellipse('Mor', (10.5, 24), (3.4, 3), join='kafa')
    d.set_face_side(14, 19)


def genc_yan(d):
    d.flyer = True
    govde(d, [(24, 31), (17, 38), (18, 44), (27, 48), (35, 45), (39, 39)], (12.0, 5.0))
    bulut(d, 12.5, 39, 3.4, 'kanat_1', 'y1')
    bulut(d, 14, 47, 3.0, 'kanat_1', 'y2')
    bulut(d, 43, 36, 3.2, 'kanat_2', 'y3')
    d.circle('Mor', (39.5, 39), 2.8, line=True, lift=0.12)
    d.ellipse('Mor', (23, 26), (13.5, 11.5), name='kafa', lift=0.06, cast=1)
    d.ellipse('Mor', (12.5, 30), (4, 3.4), join='kafa')
    bulut(d, 29, 15, 3.4, 'tepe', 'y4')
    d.capsule('Kar', (11, 31), (3, 29), (1.6, 1.0), part='esya', line=True)
    d.set_face_side(15, 25)


def usta_yan(d):
    d.flyer = True
    govde(d, [(27, 36), (16, 44), (17, 52), (26, 57), (36, 55), (43, 47)], (14.0, 5.5))
    bulut(d, 47, 41, 4.0, 'kuyruk', 'pk')
    bulut(d, 9, 45, 4.2, 'kanat_1', 'y1')
    bulut(d, 11, 54, 3.6, 'kanat_1', 'y2')
    bulut(d, 47, 30, 3.6, 'kanat_2', 'y3')
    d.capsule('Sari', (31, 20), (36, 10), (3.2, 1.4), part='tepe', line=True, lift=-0.05)
    d.ellipse('Mor', (25, 31), (15.5, 13), name='kafa', lift=0.06, cast=1)
    d.ellipse('Mor', (12.5, 35), (4.4, 3.8), join='kafa')
    d.capsule('Sari', (27, 20), (31, 9), (3.6, 1.6), part='tepe', line=True, lift=0.1)
    d.capsule('Kar', (11, 36), (3, 34), (1.8, 1.0), part='esya', line=True)
    d.circle('Mor', (34, 53), 2.6, part='kol_2', line=True, lift=0.0)
    d.circle('Mor', (24, 54), 2.6, part='kol_1', line=True, lift=0.1)
    d.circle('Sari', (29, 50), 4.2, part='esya', name='tas', line=True, lift=0.12)
    d.circle('Mor', (31.2, 48.8), 3.0, part='esya', sub='tas')
    d.pix((26, 48), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face_side(15, 30)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
