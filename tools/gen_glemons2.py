"""Yeni Glemon kare ureticisi (Plan v2, bolum 5 ve 12.5): kukla + yuz karosu.

Kullanim: python3 tools/gen_glemons2.py <anahtar> [<anahtar> ...]
Girdi:  build/glemon/<anahtar>_<asama>.json, _ic.png (yuzlu ic, cizgisiz), _yuzsuz.png,
        assets/glemons/kukla/<anahtar>_<asama>_maske.png, assets/glemons/kukla/<anahtar>.json,
        tools/glemon_species.json (huy, saldiri, yuruyus, parlak, ozel)
Cikti:  assets/glemons/<anahtar>/<i>.png        61 kare, 16 sutunlu izgara (i = 0 Bebek, 1 Genc, 2 Usta)
        assets/glemons/<anahtar>/<i>_p.png      parlak hali
        assets/glemons/<anahtar>/<i>_yuz.png    12 ifade karosu; alt satir parlak
        assets/glemons/<anahtar>/<i>_ikon.png   durmanin ilk karesi: normal | parlak
        assets/glemons/glemons.json             turun kaydi v: 2 bicimiyle degisir (digerleri aynen kalir)
        onizleme/<anahtar>_anim.gif, onizleme/<anahtar>_yuz.png
Kurallar: kafa yalniz kayar; ezilme/uzama satir silip ekleyerek ve ayak sabit; tepe ve kollar 1 kare
gecikmeli izler ve durunca 1 piksel fazla gidip doner; dis cizgi her karede yeniden cizilir.
Uzakliklar Bebek icindir; Genc ayni, Usta 1.5 kati (yukari yuvarlanir).
"""
import json, math, os, sys
from collections import Counter
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bonk_palette as BP
import glemon_faces as GF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STAGES = ['bebek', 'genc', 'usta']
SPECIES = json.load(open(os.path.join(ROOT, 'tools/glemon_species.json'), encoding='utf8'))
PART_COL = {(90, 160, 230): 'govde', (120, 220, 90): 'tepe', (240, 150, 60): 'kol_1', (230, 90, 160): 'kol_2',
            (250, 230, 80): 'kulak_1', (200, 120, 250): 'kulak_2', (90, 230, 220): 'kuyruk', (250, 90, 90): 'esya',
            (160, 100, 40): 'kanat_1', (40, 120, 120): 'kanat_2', (200, 200, 200): 'kafa'}
FOLLOW = ('tepe', 'kulak_1', 'kulak_2', 'kuyruk', 'esya', 'kol_1', 'kol_2')
ORDER = ['durma', 'huy', 'yurume', 'hazirlik', 'saldiri', 'ozel', 'hasar', 'bayilma', 'uyku', 'mutlu', 'savunma']
COLS = 16

# ---------------------------------------------------------------- sureler (bolum 5.3 + 12.6 sure kurali)
DURS = {
    'durma': [200, 160, 160, 200, 160, 160],
    'huy': [120] * 10,
    'yurume': [100] * 6,
    'hazirlik': [120, 120, 120],
    'saldiri': [134, 104, 75, 134, 164, 209],      # 820 ms (bugunku saldiri toplami)
    'ozel': [110, 110, 110, 60, 90, 90, 110, 140],  # 820 ms
    'hasar': [81, 122, 121, 216],                   # 540 ms (bugunku hasar toplami)
    'bayilma': [100, 100, 120, 120, 160, 400],
    'uyku': [420] * 4,
    'mutlu': [90] * 6,
    'savunma': [300, 300],
}
DURS['faz'] = [140, 140, 140, 90, 90, 90, 140, 140, 140, 140]
DURS['cagir'] = [140, 140, 110, 160, 140, 160]
# Patronlar (bolum 11.1): mutlu ve uyku yok; faz (10) ve cagir (6) var; durma 1.4 kat yavas; mesafeler 2 kat
BOSS_ORDER = ['durma', 'huy', 'yurume', 'hazirlik', 'saldiri', 'ozel', 'hasar', 'bayilma', 'savunma', 'faz', 'cagir']
LOOP = {'durma', 'yurume', 'uyku', 'savunma'}
ATK_FX = {'A3': 'pence_izi', 'A4': 'dis_izi'}
RARITY = {'nadir': 'nadir', 'epik': 'epik', 'efsanevi': 'efsanevi', 'gizli': 'efsanevi'}
REGION_FX = {'Orman': 'yaprak', 'Taş': 'tas', 'Kum': 'kum', 'Buz': 'kar', 'Ateş': 'kivilcim', 'Gölge': 'golge',
             'Yıldız': 'yildiz', 'Su': 'su', 'Ay': 'aytozu', 'Gece': 'aytozu'}
HIT = {'saldiri': 3, 'ozel': 4}


def F(**k):
    return k


# ---------------------------------------------------------------- kare tarifleri (bolum 5.4, Bebek birimi)
# dx,dy: butun Glemon (ileri = -x, Glemon sola bakar)  sq: +ezil/-uza (satir)  lean: ust govde (kafa) kayar
# p: {parca: (dx,dy)} ek kayma  face: ifade (None = pisirilmis normal yuz)  flash: butun Glemon Parilti
# ol: dis cizgi rengi  trail: hiz izi  glow: parlayan aile bir ton acilir  noface: yuz gorunmez
def anim_durma(sp, rig):
    if rig.fly:   # ucanlar ezilmez: 0,-1,-2,-1,0,+1 suzulur, kanat yukari/orta/asagi
        return [F(dy=0), F(dy=-1), F(dy=-2), F(dy=-1), F(dy=0), F(dy=1)]
    return [F(), F(sq=1), F(sq=1), F(), F(sq=-1), F(sq=-1)]


def first_part(rig, names):
    for n in names:
        if n in rig.parts:
            return n
    return None


def huy_frames(code, sp, rig):
    """Bolum 5.5 huy kutuphanesi (10 kare). Parca yoksa govde ile calisir. fx=True olan karede turun parcacigi cikar."""
    if code == 'H1':     # kulak/anten/tepe iki kez titrer, gozler o yana bakar
        t = first_part(rig, ('kulak_1', 'tepe', 'kulak_2', 'kuyruk', 'kanat_1'))
        if not t:
            return [F(), F(lean=-1, face='bak_sol'), F(lean=1, face='bak_sol'), F(lean=-1, face='bak_sol'), F(lean=1, face='bak_sol'),
                    F(), F(sq=-1, face='saskin'), F(sq=-1, face='saskin'), F(face='saskin'), F(face='saskin')]
        b = 'bak_sol' if rig.mil[t][0] < rig.C / 2 else 'bak_sag'
        return [F(), F(p={t: (-1, 0)}, face=b), F(p={t: (1, 0)}, face=b), F(p={t: (-1, 0)}, face=b), F(p={t: (1, 0)}, face=b),
                F(p={t: (0, -1)}), F(sq=-1, face='saskin'), F(sq=-1, face='saskin'), F(face='saskin'), F(face='saskin')]
    if code == 'H3':
        return [F(sq=1), F(dy=-2, sq=-1, face='mutlu'), F(dy=-1, face='mutlu'), F(sq=1, face='mutlu'), F(dy=-2, sq=-1, face='mutlu'),
                F(dy=-1, face='mutlu'), F(sq=1, face='mutlu'), F(face='mutlu'), F(), F()]
    if code == 'H4':
        return [F(face='bak_sol', lean=-1)] * 3 + [F(face='bak_sag', lean=1)] * 3 + [F(face='kapali'), F(), F(), F()]
    if code == 'H5':     # esneme: agiz acilir, goz kapali, govde uzar, sonra coker
        return [F(face='yarim'), F(sq=-1, face='esneme'), F(sq=-2, face='esneme'), F(sq=-2, face='esneme'), F(sq=-1, face='esneme'),
                F(sq=1, face='kapali'), F(sq=1, face='yarim'), F(face='yarim'), F(), F()]
    if code == 'H6':     # kuyruk 4 kez saga sola, govde ters yone 1 piksel
        t = first_part(rig, ('kuyruk', 'tepe', 'kulak_2', 'kulak_1', 'esya'))
        if not t:
            return [F(dx=1), F(dx=-1)] * 4 + [F(face='mutlu'), F()]
        return [F(p={t: (-1, 0)}, dx=1), F(p={t: (1, 0)}, dx=-1)] * 4 + [F(face='mutlu'), F()]
    if code == 'H7':     # hapsirma: geri cekil, hizla one egil, kapali goz, parcacik, sonra saskin
        tp = {n: (0, -2) for n in ('tepe',) if n in rig.parts}
        return [F(dx=1, sq=-1, face='yarim'), F(dx=2, sq=-1, face='esneme'), F(dx=2, sq=-1, face='esneme'),
                F(dx=-2, sq=1, lean=-1, face='kapali', fx=True, dy=-1, p=tp), F(dx=-1, sq=1, face='kapali'),
                F(face='saskin'), F(face='saskin'), F(face='saskin'), F(), F()]
    if code == 'H8':     # donme: govde daralir, arkasi doner (yuz 2 kare gizli), genisler
        return [F(), F(sq=-1), F(sq=-1, flip=True, bare=True, noface=True), F(sq=-1, flip=True, bare=True, noface=True), F(sq=-1),
                F(sq=1, face='mutlu'), F(face='mutlu'), F(face='mutlu'), F(), F()]
    if code == 'H9':     # isildama: parlayan parca tondan tona parlar, Glemon ona bakip mutlu olur
        return [F(glow=True), F(), F(glow=True), F(face='saskin'), F(glow=True, face='saskin'), F(face='mutlu'),
                F(sq=1, face='mutlu'), F(dy=-1, face='mutlu'), F(face='mutlu'), F()]
    if code == 'H10':    # kanat / kabuk / yaka / yaprak acilir kapanir
        if 'kanat_1' in rig.parts or 'kanat_2' in rig.parts:
            w = ['yukari', 'orta', 'asagi', 'orta', 'yukari', 'orta', 'asagi', 'orta', 'yukari', 'yukari']
            return [F(wing=s) for s in w]
        out = {'kulak_1': (-1, -1), 'kulak_2': (1, -1), 'kol_1': (-1, -1), 'kol_2': (1, -1), 'tepe': (0, -1), 'esya': (0, -1)}
        po = {n: v for n, v in out.items() if n in rig.parts}
        if not po:
            return [F(sq=-1), F(sq=-1), F(sq=1), F(sq=1)] * 2 + [F(), F()]
        return [F(), F(p=po, sq=-1), F(p=po, sq=-1, face='mutlu'), F(p=po, face='mutlu'), F(), F(sq=1),
                F(p=po, sq=-1), F(p=po, face='mutlu'), F(), F()]
    if code == 'H11':    # koklama: kafa one 2 piksel, burun iki kez oynar, geri gelir (esyasi varsa agzina goturur)
        e = {'esya': (1, -2)} if 'esya' in rig.parts else {}
        return [F(lean=-1), F(lean=-2), F(lean=-2, sq=1, p=e), F(lean=-2), F(lean=-2, sq=1, p=e), F(lean=-2),
                F(lean=-1, face='mutlu'), F(face='mutlu'), F(), F()]
    if code == 'H12':    # uyuklama: yarim yuz, kafa yavasca duser, aniden kalkar, saskin
        return [F(face='yarim'), F(face='yarim'), F(sq=1, face='yarim'), F(sq=1, face='kapali'), F(sq=2, face='kapali'),
                F(sq=2, face='kapali'), F(sq=-1, dy=-1, face='saskin'), F(face='saskin'), F(face='saskin'), F()]
    # varsayilan: silkelenme (H2), ilk karede parcacik
    return [F(dx=-1, fx=True), F(dx=1), F(dx=-1), F(dx=1), F(dx=-1), F(dx=1), F(dx=-1), F(dx=1), F(), F()]


def yurume_frames(kind):
    if kind == 'agir':   # agir turler: ziplama yerine iki yana 1 piksel sallanarak
        return [F(lean=-1), F(lean=-1, sq=1), F(), F(lean=1), F(lean=1, sq=1), F()]
    if kind == 'ucan':
        return [F(dx=-1, dy=-1), F(dx=-1, dy=-2), F(dx=-1, dy=-2), F(dx=-1, dy=-1), F(dx=-1), F(dx=-1)]
    return [F(sq=1), F(dy=-1, sq=-1), F(dy=-3, p={'kulak_1': (0, 1), 'kulak_2': (0, 1)}), F(dy=-3), F(dy=-1, sq=-1),
            F(sq=1, p={'kulak_1': (0, 1), 'kulak_2': (0, 1)})]


def yan_frames(kind):
    """Yandan yurume (Glemon sola bakar, ileri = -x). kol_1 = on ayak, kol_2 = arka ayak (yandan cizimde ayaklar)."""
    fw, bw = {'kol_1': (-1, 0), 'kol_2': (1, 0)}, {'kol_1': (1, 0), 'kol_2': (-1, 0)}
    if kind == 'ucan':
        return [F(dy=-1), F(dy=-2), F(dy=-2), F(dy=-1), F(), F()]
    if kind == 'agir':   # ziplamadan adim adim: ayaklar sirayla one gider, govde her adimda 1 piksel iner kalkar
        return [F(p=fw), F(dy=-1, p=fw), F(sq=1), F(p=bw), F(dy=-1, p=bw), F(sq=1)]
    # (lean yok: yandan ust govdenin kaymasi iri pikselde yirtik gibi gorunur)
    return [F(sq=1), F(dy=-1, sq=-1, p=fw), F(dy=-3, p=dict(fw, tepe=(0, 1))), F(dy=-3, p=bw),
            F(dy=-1, sq=-1, p=bw), F(sq=1, p={'tepe': (0, 1)})]


BALL_HIDE = ('tepe', 'kulak_1', 'kulak_2', 'kol_1', 'kol_2', 'esya', 'kuyruk', 'kanat_1', 'kanat_2', 'kafa')


def saldiri_frames(code, rig):
    """Bolum 5.4 + 5.5: 6 kare, vurus karesi 3 (0'dan). Ileri = -x."""
    if code == 'A2':     # zipla ez: one ve yukari zipla (6 yukari), ustune in, ezil
        return [F(sq=1), F(dx=-3, dy=-6, sq=-1), F(dx=-6, dy=-5), F(dx=-8, sq=2), F(dx=-3), F(sq=1)]
    if code == 'A3':     # pence: kol parcasi yay cizerek savrulur
        k = first_part(rig, ('kol_1', 'kol_2', 'kulak_1', 'esya'))
        p = (lambda v: {k: v}) if k else (lambda v: {})
        return [F(dx=2, sq=1, p=p((1, -1))), F(dx=3, p=p((2, -3))), F(dx=-6, sq=-1, trail=2, p=p((0, -3))),
                F(dx=-8, sq=1, p=p((-3, 1))), F(dx=-3, p=p((-1, 0))), F(sq=1)]
    if code == 'A4':     # isirik: agiz acik atilir
        return [F(dx=2, sq=1, face='kizgin'), F(dx=3, sq=1, face='isir'), F(dx=-6, sq=-1, trail=2, face='isir'),
                F(dx=-8, sq=1, lean=-1, face='isir'), F(dx=-3), F(sq=1)]
    if code == 'A5':     # kuyruk: yarim doner (arkasi one), kuyruk one savrulur
        t = first_part(rig, ('kuyruk', 'tepe', 'esya'))
        p = (lambda v: {t: v}) if t else (lambda v: {})
        return [F(sq=-1), F(dx=1, sq=-1, flip=True, bare=True, noface=True),
                F(dx=-5, flip=True, bare=True, noface=True, p=p((2, 0)), trail=2),
                F(dx=-8, sq=1, flip=True, bare=True, noface=True, p=p((3, -1))), F(dx=-3, sq=-1), F(sq=1)]
    if code == 'A6':     # firlatma: yerinden az oynar, mermi kodla ucar
        return [F(dx=1, sq=1), F(dx=2, sq=1, face='kizgin'), F(dx=-1, sq=-1, face='kizgin'), F(dx=-2, sq=1, face='kizgin'),
                F(dx=-1), F()]
    if code == 'A7':     # yuvarlanma: top olur, ileri yuvarlanir, desen ceyrek tur doner
        b = dict(hide=BALL_HIDE, bare=True, noface=True)
        return [F(sq=1), F(dx=2, sq=2, **b), F(dx=-4, rot=1, trail=2, **b), F(dx=-8, rot=2, **b), F(dx=-4, rot=3, **b), F(sq=1)]
    if code == 'A8':     # dalis (ucanlar): 4 yukari, capraz asagi
        return [F(dy=-2), F(dx=1, dy=-4), F(dx=-4, dy=-2, trail=2), F(dx=-8, dy=1, sq=1), F(dx=-3), F()]
    if code == 'A9':     # ufleme: yanaklar sisir, agizdan koni seklinde parcacik
        return [F(dx=1, sq=-1, face='esneme'), F(dx=2, sq=1, face='kapali'), F(dx=1, sq=1, face='kapali'),
                F(dx=-2, sq=-1, face='saskin'), F(dx=-1, face='saskin'), F()]
    hit = F(dx=-8, sq=1)
    if code == 'A1':     # tos: kafa parcasi 2 piksel daha ileride
        hit = F(dx=-8, sq=1, lean=-2)
    return [F(dx=2, sq=1), F(dx=3, sq=1), F(dx=-6, sq=-1, trail=2), hit, F(dx=-3), F(sq=1)]


def ozel_code(sp):
    import re
    m = re.search(r'\bA([1-9])\b', (sp.get('ozel') or {}).get('not', '') or '')
    return 'A' + m.group(1) if m else sp.get('saldiri')


def ozel_frames(sp, rig, key):
    """Bolum 5.4: 1-3 guc toplama (ezil, titre, dis cizgi tek karelerde Parilti), 4 patlama (uza, beyaz parilti),
    5-6 hamle (ozel hamlenin saldiri tipiyle), 7-8 toparlanma. Vurus karesi 4."""
    g = 'parla'
    if key == 'kutukcuk':   # onaylanan Kutukcuk 'Kafa Atma'
        return [F(dx=2, sq=1, glow=g, ol='Parilti', face='kizgin'), F(dx=4, sq=1, glow=g, face='kizgin'),
                F(dx=3, sq=1, glow=g, ol='Parilti', face='kizgin'), F(dx=-4, sq=-1, flash=True),
                F(dx=-8, sq=1, lean=-2), F(dx=-6, lean=-1), F(dx=-3), F(sq=1)]
    a = saldiri_frames(ozel_code(sp), rig)
    return [F(dx=1, sq=1, glow=g, ol='Parilti', face='kizgin'), F(dx=2, sq=1, glow=g, face='kizgin'),
            F(dx=1, sq=1, glow=g, ol='Parilti', face='kizgin'), F(sq=-1, flash=True),
            a[3], a[2] if a[2].get('rot') else dict(a[4]), a[4], a[5]]


def savunma_frames(sp, rig):
    if 'kafa' in rig.parts:   # kabuk: kafa ve kollar gizlenir, kabuk 2 piksel iner
        h = ('kafa', 'kol_1', 'kol_2', 'kulak_1', 'kulak_2', 'kuyruk')
        return [F(dy=2, hide=h, noface=True, ol='Kar-1'), F(dy=2, sq=1, hide=h, noface=True, ol='Kar-1')]
    return [F(sq=2, p={'kol_1': (1, 1), 'kol_2': (-1, 1)}, ol='Kar-1', face='kizgin'),
            F(sq=1, p={'kol_1': (1, 1), 'kol_2': (-1, 1)}, ol='Kar-1', face='kizgin')]


def faz_frames():
    """11.1 faz: 1-3 titrer (aci yuz, ESKI cizim) · 4-5 Parilti · 6 yeni cizim beyaz siluet · 7 yeni cizim 2 satir uzamis ·
    8 yere oturur (toz, sarsinti kodla) · 9-10 kizgin yuz. old=True kareler bir onceki fazin kuklasiyla cizilir."""
    return [F(dx=-1, face='aci', old=True), F(dx=1, face='aci', old=True), F(dx=-1, face='aci', old=True),
            F(flash=True, old=True), F(flash=True, old=True), F(flash=True),
            F(sq=-1), F(sq=1, fx=True), F(face='kizgin'), F(face='kizgin')]


def cagir_frames(rig):
    """11.1 cagir: 1-2 guc toplar · 3 yavruyu tasiyan parca yukari firlar · 4 yavru duser (kod) · 5-6 toparlanir."""
    t = first_part(rig, ('tepe', 'esya', 'kulak_1', 'kol_1', 'kol_2'))
    p = (lambda v: {t: v}) if t else (lambda v: {})
    return [F(sq=1, glow=True, face='kizgin'), F(sq=1, dx=1, glow=True, ol='Parilti', face='kizgin'),
            F(sq=-1, p=p((0, -3))), F(p=p((0, -1)), fx=True), F(sq=1), F()]


def frames_for(sp, walk, rig, key):
    fr = {
        'durma': anim_durma(sp, rig),
        'huy': huy_frames(sp.get('huy', {}).get('kod'), sp, rig),
        'yurume': yurume_frames(walk),
        'hazirlik': [F(dx=2, sq=1, face='kizgin'), F(dx=1, sq=1, ol='Sari-1', face='kizgin'), F(dx=2, sq=1, face='kizgin')],
        'saldiri': saldiri_frames(sp.get('saldiri'), rig),
        'ozel': ozel_frames(sp, rig, key),
        'hasar': [F(dx=3, flash=True), F(dx=4, sq=1, face='aci'), F(dx=2, face='aci'), F()],
        'bayilma': [F(dx=-2, face='sersem'), F(dx=2, face='sersem'), F(sq=-1, face='sersem'), F(sq=2, face='baygin'),
                    F(sq=3, p={'tepe': (0, 1), 'kol_1': (0, 1), 'kol_2': (0, 1)}, face='baygin'),
                    F(sq=3, p={'tepe': (0, 1), 'kol_1': (0, 1), 'kol_2': (0, 1)}, face='baygin')],
        'uyku': [F(sq=s, p={'tepe': (0, 1), 'kulak_1': (0, 1), 'kulak_2': (0, 1)}, face='kapali') for s in (2, 3, 3, 2)],
        'mutlu': [F(sq=1, face='mutlu'), F(dy=-4, sq=-1, p={'kol_1': (0, -1), 'kol_2': (0, -1), 'tepe': (0, -1)}, face='mutlu'),
                  F(sq=1, face='mutlu'), F(dy=-2, face='mutlu'), F(sq=1, face='mutlu'), F(face='mutlu')],
        'savunma': savunma_frames(sp, rig),
    }
    if rig.fly:
        # ucanlar: ezilme yerine suzulme; kanatli olanlar her karede yukari/orta/asagi cirpar, kanatsizlarin alt kenari dalgalanir
        cyc = ['yukari', 'orta', 'asagi']
        for a in list(fr):
            fr[a] = frames = [dict(x) for x in fr[a]]
            for i, f in enumerate(frames):
                if a in ('uyku', 'bayilma'):
                    if a == 'uyku':
                        f.pop('sq', None); f['dy'] = (0, 1, 1, 0)[i]; f['wing'] = 'orta'
                    continue
                if a in ('durma', 'yurume') and 'sq' in f:
                    f.pop('sq')
                f.setdefault('wing', cyc[i % 3])
                f.setdefault('ripple', 1 if i % 2 == 0 else -1)
    return fr


# ---------------------------------------------------------------- yardimcilar
def sc(v, k):
    if v == 0 or k == 1:
        return v
    return int(math.copysign(math.ceil(abs(v) * k), v))


def load_rgba(p):
    return np.asarray(Image.open(p).convert('RGBA')).copy()


def outline(a):
    """a: RGBA. Saydama degen her bos piksel icteki komsunun ailesinin 4. tonu; en alt kenar Murekkep."""
    m = a[..., 3] > 0
    H, W = m.shape
    o = a.copy()
    rows = np.where(m.any(1))[0]
    if not len(rows):
        return o, np.zeros_like(m)
    bottom = rows.max() + 1
    olm = np.zeros_like(m)
    for y in range(H):
        for x in range(W):
            if m[y, x]:
                continue
            fams = Counter(); up = False
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx]:
                    if dy == -1:
                        up = True
                    fo = BP.family_of(tuple(a[yy, xx, :3]))
                    if fo and fo[0] != 'Parilti':
                        fams[fo[0]] += 1
            if not fams and not up:
                if not any(0 <= y + dy < H and 0 <= x + dx < W and m[y + dy, x + dx]
                           for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    continue
            if y >= bottom - 0 and up:
                c = BP.tone('Murekkep')
            elif fams:
                c = BP.tone(fams.most_common(1)[0][0] + '-4')
            else:
                c = BP.tone('Murekkep')
            o[y, x, :3] = c; o[y, x, 3] = 255; olm[y, x] = True
    return o, olm


class Rig:
    def __init__(self, key, stage, cfg):
        self.key, self.stage = key, stage
        base = os.path.join(ROOT, 'build/glemon', f'{key}_{stage}')
        self.info = json.load(open(base + '.json', encoding='utf8'))
        self.ic = load_rgba(base + '_ic.png')
        self.bare = load_rgba(base + '_yuzsuz.png')
        self.shell = load_rgba(base + '_kafasiz.png') if os.path.exists(base + '_kafasiz.png') else None
        mk = np.asarray(Image.open(os.path.join(ROOT, f'assets/glemons/kukla/{key}_{stage}_maske.png')).convert('RGB'))
        self.H, self.W = self.ic.shape[:2]
        self.C = self.W
        self.parts = {}
        for col, name in PART_COL.items():
            m = (mk == np.array(col)).all(2) & (self.ic[..., 3] > 0)
            if m.any():
                self.parts[name] = m
        fx, fy, fw, fh = self.info['yuz_kutusu']
        self.face = (fx, fy, fw, fh)
        self.feet = self.info['ayak']
        self.y_sq = (fy + fh + self.feet) // 2
        self.x_w = fx - 1               # yuzun solundaki son sutun
        self.x_r = fx + fw              # yuzun sagindaki ilk sutun (ezilmede iki yan simetrik genisler)
        base_st = stage[:-4] if stage.endswith('_yan') else stage
        self.k = 1.5 if base_st == 'usta' else 1.0
        self.maxsq = 2 if base_st == 'usta' else 1
        # 1.0.28 iri piksel: cizim yarim cozunurlukte; hareketler de yarim (oyun dosyasi sonra 2 kat buyutulur)
        self.px = int(self.info.get('px', 1))
        if self.px == 2:
            self.k *= 0.5
            self.maxsq = 1
        # her parcanin bagli oldugu yer: govdeye degen pikselleri (dolgu icin) ve mil (ortalama)
        self.attach = {}
        self.mil = {}
        g = self.parts['govde']
        for n, m in self.parts.items():
            if n == 'govde':
                continue
            ys, xs = np.where(m)
            self.mil[n] = (xs.mean(), ys.mean())
            pts = []
            for y, x in zip(ys, xs):
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < self.H and 0 <= xx < self.W and g[yy, xx]:
                        pts.append((x, y, dx, dy)); break
            self.attach[n] = pts
        self.glow_family = cfg.get('parla_aile')
        self.fly = bool(self.info.get('ucar'))
        # kanat koku: govdeye degen piksellerin ortalama satiri (yoksa govdeye en yakin satir)
        self.wroot = {}
        for n in ('kanat_1', 'kanat_2'):
            if n in self.parts:
                pts = self.attach.get(n) or []
                if pts:
                    self.wroot[n] = sum(p[1] for p in pts) / len(pts)
                else:
                    ys, xs = np.where(self.parts[n])
                    self.wroot[n] = float(ys.max())

    # -- govde donusumleri
    def body(self, sq, lean, src=None, mask=None):
        C = self.C
        src = self.ic if src is None else src
        mask = self.parts['govde'] if mask is None else mask
        g = np.zeros_like(self.ic)
        g[mask] = src[mask]
        y0, xw, xr = self.y_sq, self.x_w, self.x_r
        W = g.shape[1]
        if sq > 0:
            n = sq
            o = np.zeros_like(g)
            o[n:y0 + n] = g[0:y0]          # y0..y0+n-1 satirlari silinir, ustu asagi kayar
            o[y0 + n:] = g[y0 + n:]
            g = o
            # 1.0.28: iki yan da ayni miktar disari genisler (eskiden yalniz sol taraf kayardi, dikey bir kesik gibi gorunuyordu)
            e = self.side(sq)
            o = g.copy()
            o[:, 0:xw + 1 - e] = g[:, e:xw + 1]
            o[:, xr + e:W] = g[:, xr:W - e]
            g = o
        elif sq < 0:
            m = -sq
            o = np.zeros_like(g)
            o[0:y0 - m + 1] = g[m:y0 + 1]    # y0 satiri m kez tekrar, ustu yukari kayar
            for k in range(m):
                o[y0 - k] = g[y0]
            o[y0 + 1:] = g[y0 + 1:]
            g = o
            e = self.side(sq)
            o = g.copy()                     # iki yan da iceri daralir
            o[:, e:xw + 1] = g[:, 0:xw + 1 - e]
            o[:, :e] = 0
            o[:, xr:W - e] = g[:, xr + e:W]
            o[:, W - e:] = 0
            g = o
        if lean:
            top = self.y_sq + max(sq, 0) if sq > 0 else self.y_sq
            o = g.copy()
            o[:top] = 0
            src = g[:top]
            if lean > 0:
                o[:top, lean:] = src[:, :-lean]
            else:
                o[:top, :lean] = src[:, -lean:]
            g = o
        return g

    def side(self, sq):
        return (abs(sq) + 1) // 2 if sq else 0

    def sdx(self, sq, mx):
        """ezilme/uzamada parcanin yana kaymasi: sol taraf sola, sag taraf saga (uzamada tersi)"""
        e = self.side(sq) * (1 if sq > 0 else -1)
        if mx < self.x_w:
            return -e
        if mx > self.x_r:
            return e
        return 0

    def head_disp(self, f):
        return (f.get('lean', 0), f.get('sq', 0))

    def render(self, f, follow, pal=None, glow=False):
        """f: olceklenmis kare tarifi. follow: {parca: (dx,dy)} gecikmeli kafa kaymasi."""
        W, H = self.W, self.H
        sq, lean = f.get('sq', 0), f.get('lean', 0)
        src = self.bare if f.get('bare') else self.ic
        hide = set(f.get('hide') or ())
        if 'kafa' in hide and self.shell is not None:     # kabuk savunmasi: kafa ve kollarin arkasi
            g = self.body(sq, lean, self.shell, self.shell[..., 3] > 0)
        else:
            g = self.body(sq, lean, src)
        hdx, hdy = lean, sq
        canvas = np.zeros_like(g)
        layers = []
        for n, m in self.parts.items():
            if n == 'govde' or n in hide:
                continue
            mx, my = self.mil[n]
            if my < self.y_sq:
                bdx, bdy = follow.get(n, (hdx, hdy))
            else:
                bdx, bdy = 0, 0
            bdx += self.sdx(sq, mx)
            ex = f.get('p', {}).get(n, (0, 0))
            pdx, pdy = bdx + ex[0], bdy + ex[1]
            # govdenin bu parcanin yanindaki kaymasi (ayni kafa kaymasi)
            gdx, gdy = (hdx, hdy) if my < self.y_sq else (0, 0)
            gdx += self.sdx(sq, mx)
            layers.append((n, m, pdx, pdy, gdx, gdy))
        # dolgu: govdeye degen piksel, govdenin yeni yerinden parcanin yeni yerine kadar uzatilir
        for n, m, pdx, pdy, gdx, gdy in layers:
            if n.startswith('kanat') and f.get('wing') not in (None, 'yukari'):
                continue
            for x, y, ax, ay in self.attach[n]:
                c = src[y, x]
                sx, sy = x + gdx, y + gdy
                ex_, ey_ = x + pdx, y + pdy
                path = []
                yy = sy
                while yy != ey_:
                    path.append((sx, yy)); yy += 1 if ey_ > yy else -1
                xx = sx
                while xx != ex_:
                    path.append((xx, ey_)); xx += 1 if ex_ > xx else -1
                for px_, py_ in path:
                    if 0 <= px_ < W and 0 <= py_ < H and g[py_, px_, 3] == 0:
                        canvas[py_, px_] = c
        sel = g[..., 3] > 0
        canvas[sel] = g[sel]
        wing = f.get('wing')
        for n, m, pdx, pdy, gdx, gdy in layers:
            ys, xs = np.where(m)
            if n.startswith('kanat') and wing in ('orta', 'asagi'):
                # kanat cirpma (5.7): orta = yukseklik koke dogru %60, asagi = ortanin koke gore aynasi
                r = self.wroot[n]
                rows = sorted(set(ys.tolist()), key=lambda y: -abs(y - r))   # koke yakin satirlar en son (ustte kalir)
                for yy in rows:
                    for x in xs[ys == yy]:
                        ny = r + (yy - r) * 0.6
                        if wing == 'asagi':
                            ny = r - (yy - r) * 0.6
                        X, Y = x + pdx, int(round(ny)) + pdy
                        if 0 <= X < W and 0 <= Y < H:
                            canvas[Y, X] = src[yy, x]
                continue
            for y, x in zip(ys, xs):
                X, Y = x + pdx, y + pdy
                if 0 <= X < W and 0 <= Y < H:
                    canvas[Y, X] = src[y, x]
        if f.get('flip'):          # arkasi donuk (H8, A5): yatay ayna, kayma sonra uygulanir
            canvas = canvas[:, ::-1].copy()
        if f.get('rot'):           # yuvarlanma (A7): govde merkezinde ceyrek tur
            m = canvas[..., 3] > 0
            ys, xs = np.where(m)
            cy, cx = (ys.min() + ys.max() + 1) / 2.0, (xs.min() + xs.max() + 1) / 2.0
            S = int(max(ys.max() - ys.min(), xs.max() - xs.min())) + 2
            pad = np.zeros((H + 2 * S, W + 2 * S, 4), canvas.dtype)
            pad[S:S + H, S:S + W] = canvas
            y0, x0 = int(round(cy - S / 2.0)) + S, int(round(cx - S / 2.0)) + S
            reg = pad[y0:y0 + S, x0:x0 + S].copy()
            pad[y0:y0 + S, x0:x0 + S] = np.rot90(reg, -int(f['rot']))
            canvas = pad[S:S + H, S:S + W].copy()
        if f.get('ripple'):        # kanatsiz ucanlar: alt 3 satir 1 piksel saga sola
            m = canvas[..., 3] > 0
            ys = np.where(m.any(1))[0]
            r = int(f['ripple'])
            for y in range(ys.max() - 2, ys.max() + 1):
                if not any(n.startswith('kanat') for n in self.parts):
                    canvas[y] = np.roll(canvas[y], r, axis=0)
        # butun Glemon kaymasi (tuvalden tasmasin)
        dx, dy = f.get('dx', 0), f.get('dy', 0)
        m = canvas[..., 3] > 0
        ys, xs = np.where(m)
        dx = max(1 - xs.min(), min(W - 2 - xs.max(), dx))
        dy = max(1 - ys.min(), min(H - 3 - ys.max(), dy))
        out = np.zeros_like(canvas)
        x0, x1 = max(0, dx), min(W, W + dx)
        y0, y1 = max(0, dy), min(H, H + dy)
        out[y0:y1, x0:x1] = canvas[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
        if f.get('glow') and self.glow_family:
            fam = BP.FAMILIES[self.glow_family]
            up = {BP.rgb(fam[0]): BP.tone('Parilti')}
            for i in range(1, 4):
                up[BP.rgb(fam[i])] = BP.rgb(fam[i - 1])
            for y, x in zip(*np.where(out[..., 3] > 0)):
                c = tuple(out[y, x, :3])
                if c in up:
                    out[y, x, :3] = up[c]
        if pal:
            for y, x in zip(*np.where(out[..., 3] > 0)):
                c = tuple(int(v) for v in out[y, x, :3])
                if c in pal:
                    out[y, x, :3] = pal[c]
        out, olm = outline(out)
        if f.get('ol'):
            out[olm, :3] = BP.tone(f['ol'])
        if f.get('trail'):
            m = out[..., 3] > 0
            ys = np.where(m.any(1))[0]
            for t in (1 / 3.0, 2 / 3.0):
                y = int(ys.min() + (ys.max() - ys.min()) * t)
                xr = np.where(m[y])[0].max()
                for k in range(2, 2 + f['trail']):
                    if xr + k < W:
                        out[y, xr + k, :3] = BP.tone('Kar-1'); out[y, xr + k, 3] = 255
        if f.get('flash'):
            out[out[..., 3] > 0, :3] = BP.tone('Parilti')
        fx, fy, fw, fh = self.face
        face = None if (f.get('flash') or f.get('noface')) else [int(fx + hdx + dx), int(fy + hdy + dy)]
        return out, face


def scale_frame(f, k, maxsq, anim):
    g = dict(f)
    for a in ('dx', 'dy', 'lean', 'trail'):
        if a in g:
            g[a] = sc(g[a], k)
    if 'sq' in g:
        s = sc(g['sq'], k)
        if anim in ('durma', 'yurume', 'saldiri', 'hazirlik', 'mutlu', 'huy', 'hasar', 'ozel'):
            s = max(-maxsq, min(maxsq, s))
        g['sq'] = s
    if 'p' in g:
        g['p'] = {n: (sc(v[0], k), sc(v[1], k)) for n, v in g['p'].items()}
    return g


def follow_offsets(frames, loop):
    """Gecikme: takipci parcalar kafayi 1 kare geriden izler, durunca 1 piksel fazla gidip doner."""
    hd = [(f.get('lean', 0), f.get('sq', 0)) for f in frames]
    n = len(hd)
    out = []
    for i in range(n):
        prev = hd[i - 1] if (i > 0 or loop) else (0, 0)
        prev2 = hd[i - 2] if (i > 1 or loop) else (0, 0)
        cur = hd[i]
        f = list(prev)
        for ax in (0, 1):
            if cur[ax] == prev[ax] and prev[ax] != prev2[ax]:
                f[ax] = cur[ax] + (1 if prev[ax] > prev2[ax] else -1)
        out.append(tuple(f))
    return out


def face_tiles(rig, pal, colors, dflt='normal'):
    """dflt: tarifteki varsayilan yuz; 'normal' karosu onunla basilir (goz kirpma sonrasi ona doner)."""
    fx, fy, fw, fh = rig.face
    base = rig.bare.copy()
    if pal:
        for y, x in zip(*np.where(base[..., 3] > 0)):
            c = tuple(int(v) for v in base[y, x, :3])
            if c in pal:
                base[y, x, :3] = pal[c]
    g = rig.info['goz']
    tiles = []
    for e in GF.EXPRS:
        t = base[fy:fy + fh, fx:fx + fw].copy()
        def put(x, y, c):
            X, Y = x - fx, y - fy
            if 0 <= X < fw and 0 <= Y < fh:
                t[Y, X, :3] = c; t[Y, X, 3] = 255
        cols = dict(colors)
        if pal:
            cols['m'] = pal.get(tuple(colors['m']), colors['m'])
        GF.stamp(put, rig.info['kalip'], dflt if e == 'normal' else e, g['lx'], g['rx'], g['ey'], cols, skip_mouth=not rig.info.get('agiz', True))
        tiles.append(t)
    return tiles


def build(key):
    cfg = json.load(open(os.path.join(ROOT, f'assets/glemons/kukla/{key}.json'), encoding='utf8'))
    sp = SPECIES[key]
    walk = sp.get('yuruyus', 'zipla')
    pal = BP.swap_map(sp['parlak'])
    gj = os.path.join(ROOT, 'assets/glemons/glemons.json')
    allmeta = json.load(open(gj))
    old = allmeta.get(key, {})
    boss = bool(sp.get('patron'))
    entry = {'v': 2, 'fly': bool(sp.get('ucar')), 'stages': [], 'anims': {}, 'fx': {}}
    if boss:
        entry['boss'] = True
        sp = dict(sp)
        sp.setdefault('saldiri', 'A2')
        walk = 'ucan' if sp.get('ucar') else 'agir'
    stages = STAGES
    if boss:
        stages = ['patron', 'faz2'] + (['faz3'] if os.path.exists(os.path.join(ROOT, f'build/glemon/{key}_faz3.json')) else [])
    order = BOSS_ORDER if boss else ORDER
    durs_all = dict(DURS)
    if boss:
        durs_all['durma'] = [int(round(d * 1.4)) for d in DURS['durma']]
    outdir = os.path.join(ROOT, 'assets/glemons', key)
    os.makedirs(outdir, exist_ok=True)
    gif_frames = []
    gif_frames_yan = []
    face_prev = []
    prev = None   # (rig, tiles normal, tiles shiny): faz animasyonunun eski cizimi
    for si, stage in enumerate(stages):
        rig = Rig(key, stage, cfg)
        W, H = rig.W, rig.H
        if boss:
            rig.k, rig.maxsq = (1, 1) if rig.px == 2 else (2, 2)
        rig.fly = rig.fly or bool(sp.get('ucar'))
        recipes = frames_for(sp, walk, rig, key)
        if boss:
            recipes['faz'] = faz_frames()
            recipes['cagir'] = cagir_frames(rig)
        colors = face_colors(rig.info['ten'], rig.info.get('goz_renk'), rig.info.get('yanak', True))
        tn = face_tiles(rig, None, colors, (sp.get("yuz") or {}).get("varsayilan") or "normal")
        tp = face_tiles(rig, pal, colors, (sp.get("yuz") or {}).get("varsayilan") or "normal")
        old = prev or (rig, tn, tp)
        allf, allp, faces = [], [], []
        start = 0
        anims = {}
        for a in order:
            fr = [scale_frame(f, rig.k, rig.maxsq, a) for f in recipes[a]]
            assert len(fr) == len(durs_all[a]), a
            fol = follow_offsets(fr, a in LOOP)
            exprs = []
            for f, fo in zip(fr, fol):
                follow = {n: fo for n in FOLLOW}
                if f.get('old'):     # onceki fazin cizimi; yuz kareye pisirilir (oyundaki yuz karosu yeni faza ait)
                    orig, otn, otp = old
                    im, pos = orig.render(f, follow)
                    imp, _ = orig.render(f, follow, pal=pal)
                    ex = f.get('face')
                    if ex and pos:
                        for img, tl in ((im, otn), (imp, otp)):
                            t = tl[GF.EXPRS.index(ex)]
                            th, tw = t.shape[:2]
                            x0, y0 = pos
                            reg = img[max(0, y0):y0 + th, max(0, x0):x0 + tw]
                            tt = t[max(0, -y0):max(0, -y0) + reg.shape[0], max(0, -x0):max(0, -x0) + reg.shape[1]]
                            mm = tt[..., 3] > 0
                            reg[mm] = tt[mm]
                    pos = None
                    exprs.append(None)
                else:
                    im, pos = rig.render(f, follow)
                    imp, _ = rig.render(f, follow, pal=pal)
                    exprs.append(f.get('face'))
                allf.append(im); allp.append(imp); faces.append(pos)
            an = {'start': start, 'durs': durs_all[a]}
            if a in LOOP:
                an['loop'] = True
            if a in HIT:
                an['hit'] = HIT[a]
            if a == 'hazirlik':
                an['loopFrom'] = 1
            if any(exprs):
                an['faces'] = exprs
            fxat = [i for i, f in enumerate(fr) if f.get('fx')]
            if fxat:
                an['fxAt'] = fxat[0]
            anims[a] = an
            start += len(fr)
        n = len(allf)
        rows = (n + COLS - 1) // COLS
        P = rig.px    # iri piksel: her kare, yuz karosu ve ikon en yakin komsuyla P kat buyutulur; olculer de P kat
        up = (lambda a: Image.fromarray(a, 'RGBA').resize((a.shape[1] * P, a.shape[0] * P), Image.NEAREST)) if P > 1 else (lambda a: Image.fromarray(a, 'RGBA'))
        W2, H2 = W * P, H * P
        for frames, suf in ((allf, ''), (allp, '_p')):
            sheet = Image.new('RGBA', (W2 * COLS, H2 * rows), (0, 0, 0, 0))
            for i, im in enumerate(frames):
                sheet.paste(up(im), ((i % COLS) * W2, (i // COLS) * H2))
            sheet.save(os.path.join(outdir, f'{si}{suf}.png'), optimize=True)
        prev = (rig, tn, tp)
        fx, fy, fw, fh = rig.face
        ys = Image.new('RGBA', (fw * P * len(tn), fh * P * 2), (0, 0, 0, 0))
        for i, (a, b) in enumerate(zip(tn, tp)):
            ys.paste(up(a), (i * fw * P, 0))
            ys.paste(up(b), (i * fw * P, fh * P))
        ys.save(os.path.join(outdir, f'{si}_yuz.png'), optimize=True)
        face_prev.append(ys)
        ik = Image.new('RGBA', (W2 * 2, H2), (0, 0, 0, 0))
        ik.paste(up(allf[0]), (0, 0)); ik.paste(up(allp[0]), (W2, 0))
        ik.save(os.path.join(outdir, f'{si}_ikon.png'), optimize=True)
        info = rig.info
        stent = {
            'w': W2, 'h': H2, 'ax': W2 // 2, 'ay': H2 - 2, 'bodyW': info['govde_gen'] * P, 'bodyH': H2 - 2 - info['govde_ust'] * P,
            'n': n, 'cols': COLS, 'face': {'w': fw * P, 'h': fh * P, 'pos': [None if q is None else [q[0] * P, q[1] * P] for q in faces]},
            'kalip': info['kalip'], 'px': P}
        # nadir turlerin parlayan parcasi: yuz kutusu disindaki Parilti pikselleri (oyun 2 sn'de bir orada isildatir)
        par = np.array(BP.tone('Parilti'))
        gm_ = (allf[0][..., 3] > 0) & (allf[0][..., :3] == par).all(2)
        gm_[fy:fy + fh, fx:fx + fw] = False
        if gm_.any():
            ys_, xs_ = np.where(gm_)
            stent['glow'] = [int(round(xs_.mean())) * P, int(round(ys_.mean())) * P]
        # yandan yurume sayfasi (cizimi varsa): {si}_yan.png / {si}_yan_p.png, yuz pisirilmis, tek sira
        if not boss and os.path.exists(os.path.join(ROOT, f'build/glemon/{key}_{stage}_yan.json')):
            ry = Rig(key, stage + '_yan', cfg)
            ry.fly = rig.fly
            fr = [scale_frame(f, ry.k, ry.maxsq, 'yurume') for f in yan_frames(walk)]
            if ry.fly:     # ucanlar yandan da kanat cirpar (kanat yoksa alt kenar dalgalanir)
                for i, f in enumerate(fr):
                    f.pop('sq', None)
                    f.setdefault('wing', ['yukari', 'orta', 'asagi'][i % 3])
                    f.setdefault('ripple', 1 if i % 2 == 0 else -1)
            fol = follow_offsets(fr, True)
            yf = [ry.render(f, {n: fo for n in FOLLOW})[0] for f, fo in zip(fr, fol)]
            yp = [ry.render(f, {n: fo for n in FOLLOW}, pal=pal)[0] for f, fo in zip(fr, fol)]
            Py = ry.px
            upy = (lambda a: Image.fromarray(a, 'RGBA').resize((a.shape[1] * Py, a.shape[0] * Py), Image.NEAREST))
            Wy, Hy = ry.W * Py, ry.H * Py
            for frames, suf in ((yf, ''), (yp, '_p')):
                sheet = Image.new('RGBA', (Wy * len(frames), Hy), (0, 0, 0, 0))
                for i, im in enumerate(frames):
                    sheet.paste(upy(im), (i * Wy, 0))
                sheet.save(os.path.join(outdir, f'{si}_yan{suf}.png'), optimize=True)
            stent['yan'] = {'w': Wy, 'h': Hy, 'ax': Wy // 2, 'ay': Hy - 2, 'n': len(yf), 'durs': DURS['yurume']}
            gif_frames_yan.append((stage, yf))
        else:
            for suf in ('', '_p'):
                pth = os.path.join(outdir, f'{si}_yan{suf}.png')
                if os.path.exists(pth):
                    os.remove(pth)
        entry['stages'].append(stent)
        entry['anims'] = anims
        gif_frames.append((stage, allf, allp, anims, faces, tn, rig))
    oz = sp.get('ozel') or {}
    part = (oz.get('fx') or [None])[0]
    if part in (None, 'vurus_yildizi', 'isik_halkasi', 'ses_halkasi', 'pence_izi', 'z', 'nota'):
        part = REGION_FX.get(sp.get('tip'), 'toz')
    atk = sp.get('saldiri') or 'A1'
    entry['atk'] = atk
    entry['ozAtk'] = ozel_code(sp) or atk
    entry['fx'] = {'huy': part, 'saldiri': ATK_FX.get(atk, 'vurus_yildizi'), 'ozel': oz.get('fx') or ['vurus_yildizi'],
                   'mermi': part, 'mutlu': 'kalp', 'uyku': 'z', 'bayilma': 'yildiz',
                   'nadir': RARITY.get(sp.get('nadirlik'))}
    entry['exprs'] = GF.EXPRS
    allmeta[key] = entry
    txt = json.dumps(allmeta, separators=(',', ':'))   # once metin: hata olursa dosya bozulmaz
    with open(gj, 'w') as fh:
        fh.write(txt)
    preview_gif(key, gif_frames)
    if gif_frames_yan:   # yandan yurume onizlemesi: onizleme/<tur>_yan.gif (4x)
        fr_ = []
        for i in range(6):
            row = [fs[i] for _, fs in gif_frames_yan]
            Wt = sum(a.shape[1] for a in row) * 4 + 8 * len(row); Ht = max(a.shape[0] for a in row) * 4
            im = Image.new('RGBA', (Wt, Ht), (70, 96, 72, 255)); x = 0
            for a in row:
                b = Image.fromarray(a, 'RGBA').resize((a.shape[1] * 4, a.shape[0] * 4), Image.NEAREST)
                im.paste(b, (x, Ht - b.height), b); x += b.width + 8
            fr_.append(im.convert('RGB'))
        fr_[0].save(os.path.join(ROOT, f'onizleme/{key}_yan.gif'), save_all=True, append_images=fr_[1:], duration=100, loop=0)
    pv = Image.new('RGBA', (max(i.width for i in face_prev) * 6, sum(i.height for i in face_prev) * 6 + 30), (40, 40, 48, 255))
    y = 0
    for im in face_prev:
        b = im.resize((im.width * 6, im.height * 6), Image.NEAREST); pv.paste(b, (0, y), b); y += b.height + 10
    pv.save(os.path.join(ROOT, f'onizleme/{key}_yuz.png'))
    print(key, 'ok', [s['n'] for s in entry['stages']])


def face_colors(sfam, goz=None, yanak=True):
    cheek = 'Pembe-3' if sfam in ('Pembe', 'Kirmizi', 'Turuncu') else 'Pembe-2'
    c = {'#': BP.tone(goz or 'Murekkep'), 'o': BP.tone('Parilti'), 'i': BP.tone('Mor-2'), 'w': BP.tone('Kar-1'),
         't': BP.tone('Gok-1'), 'm': BP.tone(sfam + '-4'), 'r': BP.tone('Kirmizi-3'), 'cheek': BP.tone(cheek)}
    if not yanak:
        c['cheek'] = None
    elif isinstance(yanak, str):      # ozel yanak rengi, ornek 'Sari-1' (kor gibi parlayan yanak)
        c['cheek'] = BP.tone(yanak)
    return c


def preview_gif(key, stages):
    """onizleme/<anahtar>_anim.gif: animasyonlar sirayla, 3 kat; asamalar yan yana. onizleme/<anahtar>_kareler.png: butun kareler."""
    S = 3
    W = sum(st[6].W for st in stages) * S + 20
    H = max(st[6].H for st in stages) * S + 16
    out = []
    durs = []
    names = list(stages[0][3].keys())
    for a in names:
        n = len(stages[0][3][a]['durs'])
        reps = 2 if stages[0][3][a].get('loop') else 1
        for r in range(reps):
            for i in range(n):
                fr = Image.new('RGB', (W, H), (58, 70, 84))
                x = 4
                for stage, allf, allp, anims, faces, tn, rig in stages:
                    an = anims.get(a)
                    if an and i < len(an['durs']):
                        idx = an['start'] + i
                        im = Image.fromarray(allf[idx], 'RGBA')
                        ex = (an.get('faces') or [None] * n)[i]
                        if ex and faces[idx]:
                            t = Image.fromarray(tn[GF.EXPRS.index(ex)], 'RGBA')
                            im.paste(t, tuple(faces[idx]), t)
                        im = im.resize((im.width * S, im.height * S), Image.NEAREST)
                        fr.paste(im, (x, H - im.height - 4), im)
                    x += rig.W * S + 6
                out.append(fr)
                durs.append(stages[0][3][a]['durs'][i])
        blank = out[-1].copy()
        out.append(blank); durs.append(300)
    out[0].save(os.path.join(ROOT, f'onizleme/{key}_anim.gif'), save_all=True, append_images=out[1:], duration=durs, loop=0)
    S2 = 2
    sheets = []
    from PIL import ImageDraw
    for stage, allf, allp, anims, faces, tn, rig in stages:
        Wc, Hc = rig.W, rig.H
        mx = max(len(an['durs']) for an in anims.values())
        sh = Image.new('RGB', (mx * (Wc * S2 + 2) + 70, len(anims) * (Hc * S2 + 2)), (58, 70, 84))
        dr = ImageDraw.Draw(sh)
        for r, (a, an) in enumerate(anims.items()):
            dr.text((2, r * (Hc * S2 + 2) + 4), a, fill=(230, 230, 230))
            for i in range(len(an['durs'])):
                idx = an['start'] + i
                im = Image.fromarray(allf[idx], 'RGBA')
                ex = (an.get('faces') or [None] * len(an['durs']))[i]
                if ex and faces[idx]:
                    t = Image.fromarray(tn[GF.EXPRS.index(ex)], 'RGBA')
                    im.paste(t, tuple(faces[idx]), t)
                im = im.resize((Wc * S2, Hc * S2), Image.NEAREST)
                sh.paste(im, (70 + i * (Wc * S2 + 2), r * (Hc * S2 + 2)), im)
        sheets.append(sh)
    W2 = max(x.width for x in sheets); H2 = sum(x.height + 6 for x in sheets)
    big = Image.new('RGB', (W2, H2), (30, 26, 34)); y = 0
    for x in sheets:
        big.paste(x, (0, y)); y += x.height + 6
    big.save(os.path.join(ROOT, f'onizleme/{key}_kareler.png'))


if __name__ == '__main__':
    for k in sys.argv[1:]:
        build(k)
