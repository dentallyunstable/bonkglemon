# Sargicik (Golge, nadir). Tarif: TARIFLER.md. Sargilara sarili minik col ruhu (kedi yavrusu); sargi araligi koyu, gozler orada Cam renginde parlar.
# Renk: Krem (sargi), Lacivert (aralik, golge), Cam (goz parlamasi, muska); Usta'da Sari baslik. Parlak: Krem -> Mor.
# Not: arac gozleri Murekkep basar; parlama icin gozlerin arkasina Cam-1 halka cizildi (yuz istisnasi).
PARLA = 'Cam'
EW = {'bebek': (4, 5), 'genc': (4, 5), 'usta': (5, 6)}


def goz_parla(d, stage, cx, ey, gap):
    ew, eh = EW[stage]
    lx = int(round(cx - gap / 2.0 - ew))
    rx = lx + ew + gap
    for x in (lx, rx):
        d.rect('Cam', (x - 1, ey - 1, x + ew, ey + eh), rad=1.6, part='govde', shade='flat', tone=1)


def aralik(d, nm, cx, ey, hw, top=2, bot=8):
    """yuz icin koyu sargi araligi (kafa seklinin icine kirpilir)."""
    d.rect('Lacivert', (cx - hw, ey - top, cx + hw, ey + bot), rad=3, part='govde', clip=nm, tone=3, name='ara')


def sarim(d, nm, lines, w=1.0, tone=3):
    """koyu sargi cizgileri (aralik); lines: [(p, q), ...]"""
    for p, q in lines:
        d.capsule('Lacivert', p, q, w, part='govde', clip=nm, tone=tone)


def bebek(d):
    cx = 24
    d.circle('Krem', (15.5, 25.5), 3.4, part='kulak_1', line=True)
    d.circle('Krem', (32.5, 25.5), 3.4, part='kulak_2', line=True)
    d.pix((15, 25), ['#', '#'], {'#': 'Lacivert-3'}, part='kulak_1')
    d.pix((32, 25), ['#', '#'], {'#': 'Lacivert-3'}, part='kulak_2')
    # kuyruk gibi sarkan sargi ucu
    d.curve('Krem', [(33, 43), (38, 45.5), (39.5, 49.5)], (3.6, 3.0), part='kuyruk', line=True)
    d.ellipse('Krem', (24, 36.2), (13.8, 11.2), name='kafa', cast=1)
    aralik(d, 'kafa', cx, 31, 10.5, 2, 8)
    goz_parla(d, 'bebek', cx, 31, 5)
    sarim(d, 'kafa', [((11, 26), (31, 22.5)), ((10.5, 29), (33, 25.5)), ((12, 43), (35, 39.5)), ((13, 46), (37, 42.5)), ((16, 49), (33, 46.5))])
    d.capsule('Lacivert', (35.5, 46.2), (38.5, 49.5), 1.0, part='kuyruk', clip=None) if False else None
    d.pix((24, 54), ['#.#'], {'#': 'Lacivert-4'}) if False else None
    d.set_face(cx, 31, gap=5, ten='Krem')


def genc(d):
    cx = 28
    d.circle('Krem', (18.5, 29), 3.8, part='kulak_1', line=True)
    d.circle('Krem', (37.5, 29), 3.8, part='kulak_2', line=True)
    d.pix((18, 28), ['#', '#'], {'#': 'Lacivert-3'}, part='kulak_1')
    d.pix((37, 28), ['#', '#'], {'#': 'Lacivert-3'}, part='kulak_2')
    d.curve('Krem', [(38, 52), (44, 55), (46, 49.5)], (4.0, 3.2), part='kuyruk', line=True)
    d.ellipse('Krem', (28, 44.5), (14.6, 16), name='kafa', cast=1)
    aralik(d, 'kafa', cx, 36, 11, 2, 8)
    goz_parla(d, 'genc', cx, 36, 5)
    sarim(d, 'kafa', [((14, 31), (36, 28)), ((13.5, 34), (39, 31)), ((14, 48), (40, 45)), ((15, 51), (42, 48)), ((18, 54), (38, 52.5)), ((22, 57), (34, 56))])
    # kisa sargili kollar
    d.capsule('Krem', (15, 52), (10, 56), (5.8, 5.2), part='kol_1', line=True)
    d.capsule('Krem', (41, 52), (46, 56), (5.8, 5.2), part='kol_2', line=True)
    d.capsule('Lacivert', (11.5, 50.5), (13.5, 53.2), 1.0, part='kol_1', clip=None) if False else None
    # turkuaz muska
    d.capsule('Lacivert', (20, 46.5), (28, 50), 1.0, part='govde', tone=3, clip='kafa')
    d.capsule('Lacivert', (36, 46.5), (28, 50), 1.0, part='govde', tone=3, clip='kafa')
    d.circle('Cam', (28, 51), 2.9, part='esya', line=True)
    d.pix((27, 50), ['oo'], {'o': 'Parilti'}, part='esya')
    d.set_face(cx, 36, gap=5, ten='Krem')


def usta(d):
    cx = 32
    # kulaklar baslikten cikar
    d.circle('Krem', (21.5, 17.5), 4.0, part='kulak_1', line=True)
    d.circle('Krem', (42.5, 17.5), 4.0, part='kulak_2', line=True)
    d.pix((21, 16), ['#', '#', '#'], {'#': 'Lacivert-3'}, part='kulak_1')
    d.pix((42, 16), ['#', '#', '#'], {'#': 'Lacivert-3'}, part='kulak_2')
    # uzun sargi uclari yanlarda dalgalanir
    d.curve('Krem', [(16, 54), (10, 57), (6, 54), (4.5, 58)], (5.4, 3.8), part='kuyruk', line=True)
    d.curve('Krem', [(48, 54), (54, 57), (58, 54), (59.5, 58)], (5.4, 3.8), part='esya', line=True)
    d.ellipse('Krem', (32, 47.4), (16.2, 14), name='govde', cast=1)
    d.ellipse('Krem', (32, 38), (15.4, 14), name='kafa', join='govde')
    aralik(d, 'govde', cx, 36, 12, 2, 10)
    goz_parla(d, 'usta', cx, 36, 6)
    sarim(d, 'govde', [((20, 49), (44, 46)), ((17, 52), (47, 49)), ((18, 56), (46, 53.5)), ((22, 59.5), (42, 57.5))])
    # cizgili altin baslik
    d.ellipse('Sari', (32, 29), (16.5, 13), name='baslik', part='govde', line=True, cast=1, inbox=(0, 0, 63, 33))
    for x in (21, 26, 32, 38, 43):
        d.capsule('Sari', (x, 17.5), (cx + (x - cx) * 1.15, 33), 1.0, part='govde', clip='baslik', shift=1)
    d.rect('Sari', (14, 30, 50, 32), rad=1, part='govde', line=True, lift=0.12, name='bant')
    for sd in (1, 2):
        m = (lambda p: p) if sd == 1 else (lambda p: (2 * cx - p[0], p[1]))
        nm = 'yan%d' % sd
        d.poly('Sari', [m((16, 31)), m((20.5, 31)), m((19.5, 46)), m((12, 49)), m((11, 40))], name=nm, part='govde', line=True, cast=1)
        for yy in (36, 41, 46):
            d.capsule('Sari', m((11, yy)), m((20, yy - 1)), 1.0, part='govde', clip=nm, shift=1)
    # altin ortasinda turkuaz
    d.circle('Cam', (32, 31), 1.9, part='govde', line=True)
    d.set_face(cx, 36, gap=6, ten='Krem')


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
