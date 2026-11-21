# Tirtilcik (Orman, siradan). Tarif: TARIFLER.md
# Onden bakan, dik oturan tombul tirtil; koca kafa, govde bogumlari kafanin arkasinda kivrilip yukari kalkar.
# Elinde kemirdigi bir yaprak. Renk: Cimen, Sari (karin, benek), Kar (ipek); yaprak Cam (govdeden ayrilsin diye). Parlak: Cimen -> Mor.
PARLA = 'Sari'


def leaf(d, c, s=1.0, rot=-30):
    """Isirilmis yaprak: acik ton, orta damar, bir kenarinda isirik."""
    cx, cy = c
    d.ellipse('Cam', c, (2.8 * s, 4.4 * s), rot=rot, part='esya', name='yaprak', line=True)
    d.circle('Cam', (cx + 2.7 * s, cy - 2.4 * s), 1.7 * s, sub='yaprak')
    d.capsule('Cam', (cx - 1.4 * s, cy + 3.2 * s), (cx + 1.0 * s, cy - 2.4 * s), 1.0, clip='yaprak', tone=3)


def antenna(d, base, tip, knob, w=1.6):
    d.capsule('Cimen', base, tip, w, part='tepe', line=True)
    d.circle('Sari', tip, knob, part='tepe', line=True)


def bebek(d):
    # arkadaki iki bogum (once cizilir, kafanin arkasinda kalir)
    d.circle('Cimen', (33.5, 26), 4.8, name='b2', lift=-0.12)
    d.circle('Sari', (34.5, 27), 1.9, clip='b2', shift=-1)
    d.circle('Cimen', (34, 36.5), 5.8, name='b1', lift=-0.12)
    d.circle('Sari', (35.5, 38), 2.3, clip='b1', shift=-1)
    antenna(d, (19.5, 27), (17, 19.5), 1.9)
    antenna(d, (27.5, 26.5), (29.5, 19.5), 1.9)
    d.ellipse('Cimen', (23.5, 35), (10.6, 9.8), name='kafa', lift=0.04, cast=1)
    # minik eller ve yaprak
    leaf(d, (19, 41.5), 0.95, rot=-25)
    d.circle('Cimen', (17, 43.6), 1.6, part='kol_1', line=True)
    d.circle('Cimen', (21.6, 43.8), 1.6, part='kol_2', line=True)
    d.set_face(24, 31, gap=5)


def genc(d):
    # uc bogum: arkada kivrilip yukari kalkar, her birinde sari benek
    d.circle('Cimen', (40.5, 24.5), 5.0, name='b3', lift=-0.12)
    d.circle('Sari', (41.5, 25), 1.9, clip='b3', shift=-1)
    d.circle('Cimen', (43, 34), 6.0, name='b2', lift=-0.12)
    d.circle('Sari', (44, 34.5), 2.3, clip='b2', shift=-1)
    d.circle('Cimen', (40, 44.5), 6.6, name='b1', lift=-0.12)
    d.circle('Sari', (41.5, 45), 2.5, clip='b1', shift=-1)
    # oturan on bogum (sari karin)
    d.ellipse('Cimen', (27, 46.5), (10, 6.6), name='karin_b')
    d.ellipse('Sari', (26, 48), (6, 4.2), clip='karin_b', shift=-1)
    antenna(d, (21, 25), (17.5, 17.5), 2.0)
    antenna(d, (31, 24), (34, 17), 2.0)
    d.ellipse('Cimen', (27, 33), (12.2, 10.4), name='kafa', lift=0.04, cast=1)
    # ipek atki
    d.capsule('Kar', (16.5, 42.5), (37.5, 42.5), 4.2, part='esya', name='atki', line=True, cast=1)
    d.capsule('Kar', (34.5, 43.5), (37.5, 49), (3.6, 2.8), part='esya', line=True)
    # eller ve yaprak
    leaf(d, (18.5, 47), 1.15)
    d.circle('Cimen', (16.6, 49.5), 1.8, part='kol_1', line=True)
    d.circle('Cimen', (21.6, 49.8), 1.8, part='kol_2', line=True)
    d.set_face(27, 30, gap=5)


def usta(d):
    # sirtta iki minik kanat tomurcugu (kafanin arkasindan yarim gorunur)
    d.ellipse('Sari', (19, 25.5), (3.2, 5), rot=-40, part='kanat_1', line=True, lift=0.15)
    d.ellipse('Sari', (45, 25.5), (3.2, 5), rot=40, part='kanat_2', line=True, lift=0.15)
    # tuylu antenler
    d.curve('Cimen', [(27, 24), (24.5, 18.5), (21.5, 15.5)], 1.8, part='tepe', line=True)
    d.curve('Cimen', [(37, 24), (39.5, 18.5), (42.5, 15.5)], 1.8, part='tepe', line=True)
    d.circle('Sari', (21, 14.5), 2.5, part='tepe', name='tuy1', line=True)
    d.circle('Sari', (43, 14.5), 2.5, part='tepe', name='tuy2', line=True)
    for c in ((19.4, 13.2), (21.8, 12.4), (19.2, 15.8)):
        d.circle('Sari', c, 1.5, join='tuy1')
    for c in ((44.6, 13.2), (42.2, 12.4), (44.8, 15.8)):
        d.circle('Sari', c, 1.5, join='tuy2')
    d.ellipse('Cimen', (32, 33), (13.5, 11.6), name='kafa', lift=0.04, cast=2)
    # yarim ipek koza, uyku tulumu gibi: kabarik ust kenar, sarili iplik izleri
    d.ellipse('Kar', (32, 51.5), (14.5, 10), name='koza')
    for x, y, r in ((19.5, 44.5, 3.2), (25, 42.8, 3.0), (32, 42.4, 2.8), (39, 42.8, 3.0), (44.5, 44.5, 3.2)):
        d.circle('Kar', (x, y), r, join='koza')
    for pts in ([(19, 50), (26, 52), (35, 50.5), (45, 52)], [(20, 56), (29, 57.5), (38, 56), (44, 57)]):
        d.curve('Kar', pts, 1.0, clip='koza', shift=1)
    # kollar kozanin agzindan cikar, yapragi tutar
    d.capsule('Cimen', (22, 43), (26.5, 46.5), 3.4, part='kol_1', line=True)
    d.capsule('Cimen', (42, 43), (37.5, 46.5), 3.4, part='kol_2', line=True)
    leaf(d, (32, 47.5), 1.15, rot=-15)
    d.set_face(32, 31, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
