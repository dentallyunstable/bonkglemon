# Murekkepcik (Golge, siradan). Tarif: TARIFLER.md. Cam hokkada yasayan Lacivert murekkep damlasi; genc tuy kalem tutar, usta dort kollu, hokka etek, kalem sapka tuyu.
# Renk: Lacivert (damla), Tas (cam hokka); tuy Kar. Parlak: Lacivert -> Kirmizi.
PARLA = 'Lacivert'


def hokka(d, cx, ny, nw, by, bw, bh, ink=True):
    """Hokka: boyun halkasi + yuvarlak govde. ny boyun ustu, by govde merkezi y."""
    d.ellipse('Tas', (cx, by), (bw, bh), name='hk', cast=1, lift=0.05)
    d.rect('Tas', (cx - nw, ny, cx + nw, by - bh * 0.4), rad=1.5, name='bo', join='hk')
    d.rect('Tas', (cx - nw - 1.5, ny - 0.5, cx + nw + 1.5, ny + 2.5), rad=1.2, line=True, lift=0.1)
    # icindeki murekkep seviyesi
    d.ellipse('Lacivert', (cx, by + bh * 0.45), (bw - 2.5, bh * 0.55), clip='hk', tone=2)
    # cam yansimasi
    d.pix((cx - bw + 3, by - 1), ['Oo', 'o.', 'o.'], {'O': 'Parilti', 'o': 'Kar-1'}) if False else None
    d.capsule('Kar', (cx - bw + 3.2, by - bh * 0.35), (cx - bw + 3.2, by + bh * 0.2), 0.9, clip='hk', shift=-1)


def kalem(d, bx, by, ang, L, part='esya', wd=2.6):
    """Beyaz tuy kalem: sap ucu (bx,by); ang derece (0=yukari, + saga); L boy."""
    import math
    ca, sa = math.cos(math.radians(ang)), math.sin(math.radians(ang))
    P = lambda u, v: (bx + u * ca + v * sa, by - (-u * sa + v * ca))
    d.poly('Kar', [P(0, 0), P(-wd, L * 0.45), P(-wd * 0.8, L * 0.8), P(0, L), P(wd * 0.8, L * 0.8), P(wd, L * 0.45)],
           part=part, line=True, name='tuy_' + part, lift=0.18)
    d.capsule('Kar', P(0, 0.5), P(0, L * 0.92), 0.8, part=part, clip='tuy_' + part, shift=1)
    d.capsule('Kar', P(-0.2, L * 0.4), P(-wd * 0.8, L * 0.62), 0.6, part=part, clip='tuy_' + part, shift=1)
    d.capsule('Kar', P(0.2, L * 0.4), P(wd * 0.8, L * 0.62), 0.6, part=part, clip='tuy_' + part, shift=1)


def bebek(d):
    cx = 24
    d.ellipse('Lacivert', (cx, 29.5), (11.2, 10.2), name='damla', cast=1, lift=0.12)
    hokka(d, cx, 36, 8.5, 42.5, 13.5, 5.4)
    d.set_face(cx, 26.5, gap=5)


def genc(d):
    cx = 28
    d.ellipse('Lacivert', (cx, 31), (13.5, 12.5), name='damla', cast=1, lift=0.12)
    hokka(d, cx, 40, 10, 48, 15.5, 7.5)
    # iki murekkep kol, hokkanin onunden sarkar
    d.capsule('Lacivert', (cx - 13, 36), (cx - 17, 45), (3.8, 3.4), part='kol_1', line=True, lift=0.12)
    d.capsule('Lacivert', (cx + 13, 36), (cx + 17, 44), (3.8, 3.4), part='kol_2', line=True, lift=0.12)
    kalem(d, cx + 17.5, 44, 8, 18, wd=3.0)
    d.circle('Lacivert', (cx + 17.5, 44), 2.8, part='kol_2', line=True, lift=0.12)
    d.set_face(cx, 29, gap=5)


def usta(d):
    cx = 32
    d.ellipse('Lacivert', (cx, 32), (15, 14), name='damla', cast=1, lift=0.12)
    # kalem sapka tuyu gibi
    kalem(d, cx + 5, 22, 20, 19, part='tepe', wd=3.2)
    # ust kollar (yukari kalkik), alt kollar hokka onunde
    d.capsule('Lacivert', (cx - 14, 34), (cx - 20, 26), (4.2, 3.6), part='kol_1', line=True, lift=0.12)
    d.capsule('Lacivert', (cx + 14, 34), (cx + 20, 26), (4.2, 3.6), part='kol_2', line=True, lift=0.12)
    hokka(d, cx, 43, 12, 51, 18.5, 9.5)
    d.capsule('Lacivert', (cx - 15, 43), (cx - 21, 52), (4.2, 3.6), part='kol_1', line=True, lift=0.12)
    d.capsule('Lacivert', (cx + 15, 43), (cx + 21, 52), (4.2, 3.6), part='kol_2', line=True, lift=0.12)
    d.set_face(cx, 31, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}


def bebek_yan(d):
    d.ellipse('Lacivert', (23, 29.5), (11.2, 10.2), name='damla', cast=1, lift=0.12)
    hokka(d, 24, 36, 8.5, 42.5, 13.5, 5.4)
    d.set_face_side(14, 26)


def genc_yan(d):
    d.capsule('Lacivert', (36, 38), (41, 45), (3.8, 3.4), part='kol_2', line=True, lift=-0.1)
    d.ellipse('Lacivert', (26, 31), (13.5, 12.5), name='damla', cast=1, lift=0.12)
    hokka(d, 28, 40, 10, 48, 15.5, 7.5)
    kalem(d, 10, 47, -10, 18, wd=3.0)
    d.capsule('Lacivert', (20, 38), (12, 46), (3.8, 3.4), part='kol_1', line=True, lift=0.12)
    d.circle('Lacivert', (11.5, 46), 2.8, part='kol_1', line=True, lift=0.12)
    d.set_face_side(16, 29)


def usta_yan(d):
    d.capsule('Lacivert', (43, 34), (48, 27), (4.2, 3.6), part='kol_2', line=True, lift=-0.1)
    d.capsule('Lacivert', (45, 45), (50, 52), (4.2, 3.6), part='kol_2', line=True, lift=-0.1)
    kalem(d, 36, 22, 22, 19, part='tepe', wd=3.2)
    d.ellipse('Lacivert', (30, 32), (15, 14), name='damla', cast=1, lift=0.12)
    d.capsule('Lacivert', (20, 34), (12, 27), (4.2, 3.6), part='kol_1', line=True, lift=0.12)
    hokka(d, 32, 43, 12, 51, 18.5, 9.5)
    d.capsule('Lacivert', (17, 43), (11, 52), (4.2, 3.6), part='kol_1', line=True, lift=0.12)
    d.set_face_side(18, 30)


STAGES.update({'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan})
