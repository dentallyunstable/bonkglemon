# Patlakmantar (Orman, siradan). Tarif: TARIFLER.md
# Sapkasi kafasindan buyuk utangac puf mantari; sapka gozlerin ustune iner, altindan bakar.
# Renk: Kirmizi (sapka), Krem (sap, benekler). Parlak: Kirmizi -> Gok.


def bebek(d):
    # sap: yuvarlak tabanli, ayaksiz
    d.ellipse('Krem', (24, 37), (9.5, 8.2), name='sap')
    # sapka: alcak kubbe, alt kenari gozlerin ust satirina iner
    d.ellipse('Kirmizi', (24, 30), (13.5, 12), inbox=(0, 0, 47, 31), name='sapka', lift=0.05, cast=1)
    d.ellipse('Kirmizi', (24, 31), (12.5, 1.6), join='sapka')
    # uc krem benek
    d.circle('Krem', (18.5, 23.5), 2.6, clip='sapka', shift=-1)
    d.circle('Krem', (27.5, 21), 2.1, clip='sapka', shift=-1)
    d.circle('Krem', (31.5, 27.5), 1.8, clip='sapka', shift=-1)
    d.capsule('Krem', (31, 38), (31, 41), 1.1, clip='sap', shift=1)
    d.set_face(24, 31, gap=5)


def genc(d):
    d.capsule('Krem', (18.5, 45), (13, 37.5), (3.4, 3.0), part='kol_1')
    d.capsule('Krem', (37.5, 45), (43, 37.5), (3.4, 3.0), part='kol_2')
    d.ellipse('Krem', (28, 44), (10.5, 9.2), name='sap')
    # etek gibi halka
    d.ellipse('Krem', (28, 46.5), (12.5, 2.6), name='etek', line=True)
    d.rect('Krem', (16, 46, 40, 49), clip='etek', tone=3, mark=True)
    # genis, kenari dalgali sapka
    d.ellipse('Kirmizi', (28, 35), (17, 14.5), inbox=(0, 0, 55, 35), name='sapka', lift=0.05, cast=2)
    for x in (13, 19, 25, 31, 37, 43):
        d.circle('Kirmizi', (x, 35.2), 2.4, join='sapka')
    for x in (16, 22, 28, 34, 40):
        d.circle('Kirmizi', (x, 37.6), 1.4, sub='sapka')
    # benekler
    d.circle('Krem', (20, 26), 2.8, clip='sapka', shift=-1)
    d.circle('Krem', (30, 23.5), 2.2, clip='sapka', shift=-1)
    d.circle('Krem', (37.5, 29.5), 2.0, clip='sapka', shift=-1)
    d.circle('Krem', (13.5, 31.5), 1.5, clip='sapka', shift=-1)
    # iki minik kol sapkanin kenarini tutar (eller kenarin altina girer)
    d.capsule('Krem', (20, 42), (20, 44), 1.1, clip='sap', shift=1)
    d.capsule('Krem', (35, 41), (35, 44), 1.1, clip='sap', shift=1)
    d.set_face(28, 36, gap=5)


def usta(d):
    # kollar semsiyenin kenarini tutar (sapkanin arkasinda)
    d.capsule('Krem', (21, 49), (12, 41), (3.8, 3.2), part='kol_1')
    d.capsule('Krem', (43, 49), (52, 41), (3.8, 3.2), part='kol_2')
    d.ellipse('Krem', (32, 49.5), (12, 11.5), name='sap')
    for a, b in (((23, 43), (23, 46)), ((41, 44), (41, 48)), ((38, 49), (38, 51))):
        d.capsule('Krem', a, b, 1.1, clip='sap', shift=1)
    # firfirli etek
    d.ellipse('Krem', (32, 52.5), (15, 3.2), name='etek', line=True)
    for x in (19, 24, 29, 35, 40, 45):
        d.circle('Krem', (x, 55.4), 1.7, join='etek')
    d.rect('Krem', (16, 52, 48, 57), clip='etek', tone=3, mark=True)
    for x in (21.5, 26.5, 32, 37.5, 42.5):
        d.rect('Krem', (int(x), 53, int(x), 56), clip='etek', tone=4, mark=True)
    # buyuk semsiye sapka
    d.ellipse('Kirmizi', (32, 40.5), (22.5, 20), inbox=(0, 0, 63, 40), name='sapka', lift=0.05, cast=2)
    for x in (12, 19, 26, 32, 38, 45, 52):
        d.circle('Kirmizi', (x, 40.2), 2.6, join='sapka')
    # benekler
    d.circle('Krem', (21, 28), 3.6, clip='sapka', shift=-1)
    d.circle('Krem', (34, 24.5), 2.8, clip='sapka', shift=-1)
    d.circle('Krem', (45, 31), 2.8, clip='sapka', shift=-1)
    d.circle('Krem', (13.5, 35.5), 2.0, clip='sapka', shift=-1)
    d.circle('Krem', (29, 34.5), 1.7, clip='sapka', shift=-1)
    d.circle('Krem', (51, 37), 1.4, clip='sapka', shift=-1)
    # kenarda kucuk puskuller
    for x in (17.5, 25, 32, 39, 46.5):
        d.capsule('Krem', (x, 42.5), (x, 44.5), 2.2, part='esya', line=True, noshadow=True)
    # tepede uyuyan yavru mantar
    d.ellipse('Krem', (39, 20.5), (3.6, 3.2), part='tepe', name='ysap')
    d.ellipse('Kirmizi', (39, 18.5), (6, 5), inbox=(0, 0, 63, 18), part='tepe', name='ysapka', line=True)
    d.circle('Krem', (37, 15.5), 1.2, clip='ysapka', shift=-1)
    d.pix((37, 20), ['#.#'], {'#': 'Krem-4'}, part='tepe')
    d.set_face(32, 41, gap=6)


STAGES = {'bebek': bebek, 'genc': genc, 'usta': usta}
