"""Eren'in Glemon gorselini Bonk stiline uyduran ice aktarma araci (Plan v2, bolum 12.2-12.4).

Kullanim: python3 tools/glemon_import.py <anahtar> [asama ...]
Girdi:  /mnt/project-files/glemon-art/<anahtar>/<asama>.(png|jpg)  (ya da GLEMON_ART ortam degiskeni)
        assets/glemons/kukla/<anahtar>.json   (asama ayarlari)
Cikti:  build/glemon/<anahtar>_<asama>.png      tuvale oturmus, cizgili, yuzlu tek kare
        build/glemon/<anahtar>_<asama>.json     ic veri (yuz konumu, olculer, parca maskesi bilgisi)
        assets/glemons/kukla/<anahtar>_<asama>_maske.png
        onizleme/<anahtar>_<asama>_ice.png       (6x buyutulmus kontrol resmi)
Adimlar: arka plan -> yaratik -> piksel adimi -> eski cizgi ve yuzu sil -> kucult (en sik renk)
         -> palete oturt -> temizle -> yerlestir -> yuz damgasi -> kukla maskesi -> denetim.
"""
import json, os, sys
from collections import Counter
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bonk_palette as BP
import glemon_faces as GF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ART = os.environ.get('GLEMON_ART', '/mnt/project-files/glemon-art')
CANVAS = {'bebek': 48, 'genc': 56, 'usta': 64}
BODY_RANGE = {'bebek': (26, 30, 30), 'genc': (32, 38, 38), 'usta': (42, 48, 48)}
STAGES = ['bebek', 'genc', 'usta']
SPECIES = json.load(open(os.path.join(ROOT, 'tools/glemon_species.json'), encoding='utf8'))
PART_COL = {'govde': (90, 160, 230), 'tepe': (120, 220, 90), 'kol_1': (240, 150, 60), 'kol_2': (230, 90, 160),
            'kulak_1': (250, 230, 80), 'kulak_2': (200, 120, 250), 'kuyruk': (90, 230, 220), 'esya': (250, 90, 90)}


def lum(c):
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


# ---------------------------------------------------------------- 1-3: arka plan, yaratik, piksel adimi
def find_period(a):
    """Buyutulmus piksel adimi: renk degisim cizgilerine en iyi oturan aralik (yoksa None)."""
    def edges(axis):
        d = np.abs(np.diff(a.astype(int), axis=axis)).sum(2) > 60
        return d.sum(0 if axis == 1 else 1)
    out = []
    for axis in (1, 0):
        e = edges(axis).astype(float)
        n = len(e)
        best = None
        for p in np.arange(6, 64, 0.05):
            for ph in np.arange(0, p, max(0.5, p / 24)):
                pos = np.arange(ph, n - 1, p)
                idx = np.round(pos).astype(int)
                mid = np.clip(np.round(pos + p / 2).astype(int), 0, n - 1)
                on = (e[idx] + e[np.clip(idx - 1, 0, n - 1)]).mean()
                off = (e[mid] + e[np.clip(mid - 1, 0, n - 1)]).mean()
                s = on - off     # gercek adimda cizgiler dolu, aralarinin ortasi bos; katlarda orta da dolu
                if best is None or s > best[0]:
                    best = (s, p, ph)
        out.append(best)
    (sx, px, phx), (sy, py, phy) = out
    if abs(px - py) / px > 0.05:
        p = (px + py) / 2
    else:
        p = (px + py) / 2
    return p, phx, phy


def to_native(a, p, phx, phy):
    H, W, _ = a.shape
    nx, ny = int((W - phx) // p), int((H - phy) // p)
    o = np.zeros((ny, nx, 3), np.uint8)
    for j in range(ny):
        for i in range(nx):
            x0 = int(phx + i * p + p * 0.25); x1 = int(phx + (i + 1) * p - p * 0.25)
            y0 = int(phy + j * p + p * 0.25); y1 = int(phy + (j + 1) * p - p * 0.25)
            o[j, i] = np.median(a[y0:y1, x0:x1].reshape(-1, 3), axis=0)
    return o


def key_background(a):
    """Kose rengi arka plan; uzakligi 60'tan az olanlar saydam (kenardan ve ic adaciklar)."""
    corners = [a[0, 0], a[0, -1], a[-1, 0], a[-1, -1]]
    bg = np.median(np.array(corners), axis=0)
    d = np.sqrt(((a.astype(int) - bg) ** 2).sum(2))
    return d >= 60   # True = yaratik


def components(mask):
    H, W = mask.shape
    lab = np.zeros((H, W), int)
    n = 0
    sizes = {}
    for y in range(H):
        for x in range(W):
            if mask[y, x] and not lab[y, x]:
                n += 1
                st = [(y, x)]; lab[y, x] = n; c = 0
                while st:
                    cy, cx = st.pop(); c += 1
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        yy, xx = cy + dy, cx + dx
                        if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]:
                            lab[yy, xx] = n; st.append((yy, xx))
                sizes[n] = c
    return lab, sizes


def main_creature(fg):
    lab, sizes = components(fg)
    if not sizes:
        raise SystemExit('Gorselde yaratik bulunamadi')
    big = max(sizes, key=sizes.get)
    others = [k for k, v in sizes.items() if k != big and v > sizes[big] * 0.3]
    if others:
        raise SystemExit('Gorselde birden cok buyuk parca var (kural disi, Eren\'e sor)')
    keep = lab == big
    ys, xs = np.where(keep)
    # 3 pikselden yakin kucuk parcalari dahil et
    near = ndimage.binary_dilation(keep, iterations=3)
    for k in sizes:
        if k != big and (near & (lab == k)).any():
            keep |= lab == k
    return keep


class ndimage:
    """scipy olmadan gereken birkac goruntu islemi (4 komsuluk)."""
    @staticmethod
    def binary_dilation(m, iterations=1):
        m = m.copy()
        for _ in range(iterations):
            o = m.copy()
            o[1:] |= m[:-1]; o[:-1] |= m[1:]; o[:, 1:] |= m[:, :-1]; o[:, :-1] |= m[:, 1:]
            m = o
        return m

    @staticmethod
    def binary_erosion(m):
        o = m.copy()
        o[1:] &= m[:-1]; o[:-1] &= m[1:]; o[:, 1:] &= m[:, :-1]; o[:, :-1] &= m[:, 1:]
        o[0, :] = False; o[-1, :] = False; o[:, 0] = False; o[:, -1] = False
        return o

    @staticmethod
    def label(m):
        lab, sizes = components(m)
        return lab, len(sizes)

    @staticmethod
    def binary_fill_holes(m):
        outside = np.zeros(m.shape, bool)
        H, W = m.shape
        st = [(y, x) for y in range(H) for x in (0, W - 1)] + [(y, x) for x in range(W) for y in (0, H - 1)]
        st = [(y, x) for y, x in st if not m[y, x]]
        for y, x in st:
            outside[y, x] = True
        while st:
            y, x = st.pop()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and not m[yy, xx] and not outside[yy, xx]:
                    outside[yy, xx] = True; st.append((yy, xx))
        return ~outside


# ---------------------------------------------------------------- 4: eski yuzu ve cizgiyi sil
def find_eyes(a, fg):
    """Ust %65'te, icinde acik nokta olan iki koyu leke."""
    L = lum(a.astype(float))
    ys, xs = np.where(fg)
    top, bot = ys.min(), ys.max()
    dark = fg & (L < 70)
    # dis cizgiye degen koyu pikseller goz degildir
    edge = fg & ~ndimage.binary_erosion(fg)
    lab, n = ndimage.label(dark)
    cands = []
    for k in range(1, n + 1):
        m = lab == k
        if (m & ndimage.binary_dilation(edge)).any():
            continue
        yy, xx = np.where(m)
        if yy.mean() > top + (bot - top) * 0.65 or m.sum() < 12:
            continue
        filled = ndimage.binary_fill_holes(m)
        bright = filled & ~m & (L > 170)
        cands.append((m.sum(), k, filled, bright.any()))
    cands.sort(key=lambda c: -c[0])
    eyes = [c for c in cands if c[3]][:2] or cands[:2]
    if len(eyes) < 2:
        raise SystemExit('Gozler bulunamadi; kukla dosyasina elle yazin')
    out = []
    for _, k, filled, _ in eyes:
        yy, xx = np.where(filled)
        out.append({'cx': xx.mean(), 'cy': yy.mean(), 'x0': xx.min(), 'x1': xx.max(), 'y0': yy.min(), 'y1': yy.max(),
                    'mask': filled})
    out.sort(key=lambda e: e['cx'])
    return out


def erase_face(a, fg, eyes):
    """Goz, agiz ve yanak piksellerini satirdaki en yakin ten pikseliyle doldur."""
    a = a.copy()
    ex0 = min(e['x0'] for e in eyes); ex1 = max(e['x1'] for e in eyes)
    ey0 = min(e['y0'] for e in eyes); ey1 = max(e['y1'] for e in eyes)
    ew = ex1 - ex0
    bx0, bx1 = int(ex0 - ew * 0.25), int(ex1 + ew * 0.25)
    by0, by1 = int(ey0 - 1), int(ey1 + (ey1 - ey0) * 0.8)
    L = lum(a.astype(float))
    r, g, b = a[..., 0].astype(int), a[..., 1].astype(int), a[..., 2].astype(int)
    pink = (r > 200) & (r - g > 50) & (b > g - 10)
    face = np.zeros(fg.shape, bool)
    for e in eyes:
        face |= ndimage.binary_dilation(e['mask'])
    box = np.zeros(fg.shape, bool)
    box[by0:by1 + 1, bx0:bx1 + 1] = True
    face |= box & fg & ((L < 70) | pink | (L > 225))
    face = ndimage.binary_dilation(face & box, iterations=0) if False else face
    face &= fg & box | (face & fg)
    H, W = fg.shape
    for y, x in zip(*np.where(face)):
        best = None
        for d in range(1, W):
            for xx in (x - d, x + d):
                if 0 <= xx < W and fg[y, xx] and not face[y, xx]:
                    best = a[y, xx]; break
            if best is not None:
                break
        if best is not None:
            a[y, x] = best
    return a, (bx0, by0, bx1, by1)


def strip_outline(a, fg):
    """Saydama degen koyu dis cizgiyi kaldir (bolum 12.2: cizgi sonra tam 1 piksel yeniden cizilir)."""
    L = lum(a.astype(float))
    fg = fg.copy()
    for _ in range(2):
        edge = fg & ~ndimage.binary_erosion(fg)
        dark = edge & (L < 40)
        if not dark.any():
            break
        fg &= ~dark
    return fg


# ---------------------------------------------------------------- 5: en sik renkle kucult
def downscale(a, fg, f):
    H, W = fg.shape
    nw, nh = int(round(W * f)), int(round(H * f))
    out = np.zeros((nh, nw, 3), np.uint8)
    om = np.zeros((nh, nw), bool)
    inv = 1.0 / f
    for j in range(nh):
        for i in range(nw):
            x0, x1 = i * inv, (i + 1) * inv
            y0, y1 = j * inv, (j + 1) * inv
            cnt = Counter()
            for yy in range(int(y0), min(H, int(np.ceil(y1)))):
                wy = min(y1, yy + 1) - max(y0, yy)
                for xx in range(int(x0), min(W, int(np.ceil(x1)))):
                    wx = min(x1, xx + 1) - max(x0, xx)
                    w = wx * wy
                    if w <= 0:
                        continue
                    k = tuple(a[yy, xx]) if fg[yy, xx] else None
                    cnt[k] += w
            if not cnt:
                continue
            k, w = cnt.most_common(1)[0]
            tot = sum(cnt.values())
            if k is None and w < tot * 0.65:
                # yaratigin kenarinda: saydam ancak yarisindan azsa piksel dolu sayilir
                k = Counter({kk: vv for kk, vv in cnt.items() if kk is not None}).most_common(1)[0][0]
            if k is not None:
                out[j, i] = k; om[j, i] = True
    return out, om


# ---------------------------------------------------------------- 6-7: palet ve temizlik
def snap(a, m, cands, chroma=1.0, dl=0.0, light=None, accent=(), penalty=10.0, primary=None):
    """CIELAB'da en yakin aday. chroma > 1: kaynak renklerin doygunlugu (a, b) once bu kadar artirilir
    (gorsel yapay zekalari renkleri paletten soluk uretir; aksi halde kahve govde Krem'e kayar)."""
    far = 0
    o = a.copy()
    cache = {}
    labs = [(k, BP.lab(k)) for k in cands]
    acc = set(BP.rgb(h) for f in accent for h in BP.FAMILIES[f])
    prim = BP.lab(BP.rgb(BP.FAMILIES[primary][1])) if primary else (0, 1, 0)
    for y, x in zip(*np.where(m)):
        c = tuple(int(v) for v in a[y, x])
        if c not in cache:
            L, A_, B_ = BP.lab(c)
            q = (L + dl, A_ * chroma, B_ * chroma)
            pool = labs
            if acc:
                # vurgu ailesi yalniz kaynakta gercekten o renkte olan pikselde aday: acik (L>=30) ve ya doygun
                # (C>=30) ya da tonu ana aileden cok farkli (>90 derece). Golgeler ve koyu cizgiler ana aileye kalir.
                import math
                C_ = math.hypot(A_, B_)
                h = math.degrees(math.atan2(B_, A_))
                ph = math.degrees(math.atan2(prim[2], prim[1]))
                dh = abs((h - ph + 180) % 360 - 180)
                if not (L >= 30 and (C_ >= 30 or dh > 90)):
                    pool = [t for t in labs if t[0] not in acc]
            if light is not None:
                # acik aile (Krem/Kar) yalniz kaynakta acik olan bolgelere (karin, halka); govde turun ana ailesinden
                lf = set(BP.rgb(h) for h in BP.FAMILIES[light[0]])
                if L >= light[1]:
                    q = (L, A_, B_)          # acik bolge: doygunluk artirilmadan en yakin ton
                else:
                    pool = [t for t in pool if t[0] not in lf]
            # vurgu ailesi (ek_aileler) yalniz acikca o renkte olan kucuk parcalara (mantar, yumurta) gider
            k, kl = min(pool, key=lambda t: np.sqrt(sum((u - v) ** 2 for u, v in zip(q, t[1]))) + (penalty if t[0] in acc else 0))
            cache[c] = (k, BP.dist(c, k))
        k, d = cache[c]
        o[y, x] = k
        far += d > 25
    return o, far / max(1, m.sum())


def clean(a, m, keep=()):
    """Tek basina kalan pikselleri en cok komsusu olan renkle degistir; 1 piksellik cikintilari kalinlastir."""
    H, W = m.shape
    n = 0
    for _ in range(2):
        for y in range(H):
            for x in range(W):
                if not m[y, x]:
                    continue
                c = tuple(a[y, x])
                if c in keep:
                    continue
                nb = []
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and m[yy, xx]:
                        nb.append(tuple(a[yy, xx]))
                if nb and c not in nb:
                    a[y, x] = Counter(nb).most_common(1)[0][0]; n += 1
    # 1 piksellik saydam delikleri doldur
    for y in range(1, H - 1):
        for x in range(1, W - 1):
            if not m[y, x] and m[y - 1, x] and m[y + 1, x] and m[y, x - 1] and m[y, x + 1]:
                m[y, x] = True; a[y, x] = a[y, x - 1]
    # tek piksellik cikintilar (iki yani bos dolu piksel zinciri) -> 2 piksele kalinlastir
    for y in range(H):
        for x in range(1, W - 1):
            if m[y, x] and not m[y, x - 1] and not m[y, x + 1]:
                m[y, x + 1] = True; a[y, x + 1] = a[y, x]
    for x in range(W):
        for y in range(1, H - 1):
            if m[y, x] and not m[y - 1, x] and not m[y + 1, x]:
                m[y + 1, x] = True; a[y + 1, x] = a[y, x]
    return a, m, n


def outline(a, m):
    """Saydama degen her bos piksel: icteki komsunun ailesinin 4. tonu; en alt kenar Murekkep."""
    H, W = m.shape
    o = a.copy(); om = m.copy()
    ys = np.where(m.any(1))[0]
    bottom = ys.max() if len(ys) else H
    for y in range(H):
        for x in range(W):
            if m[y, x]:
                continue
            nb = []
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx]:
                    nb.append((dy, tuple(a[yy, xx])))
            if not nb:
                continue
            fams = Counter()
            for dy, c in nb:
                fo = BP.family_of(c)
                fam = fo[0] if fo else None
                if fam in (None, 'Parilti'):
                    continue
                fams[fam] += 1
            if y >= bottom and any(dy == -1 for dy, _ in nb):
                col = BP.tone('Murekkep')
            elif fams:
                col = BP.tone(fams.most_common(1)[0][0] + '-4')
            else:
                col = BP.tone('Murekkep')
            o[y, x] = col; om[y, x] = True
    return o, om


# ---------------------------------------------------------------- yardimcilar
def rgba(a, m):
    out = np.zeros(m.shape + (4,), np.uint8)
    out[..., :3] = a; out[..., 3] = m * 255
    return Image.fromarray(out, 'RGBA')


def find_src(key, stage):
    for ext in ('png', 'jpg', 'jpeg', 'webp'):
        p = os.path.join(ART, key, f'{stage}.{ext}')
        if os.path.exists(p):
            return p
    return None


def skin_family(a, m):
    c = Counter()
    for y, x in zip(*np.where(m)):
        fo = BP.family_of(tuple(a[y, x]))
        if fo and fo[0] not in ('Parilti',):
            c[fo[0]] += 1
    return c.most_common(1)[0][0]


# ---------------------------------------------------------------- ana is
def import_stage(key, stage, cfg, report):
    st = cfg['asamalar'][stage]
    src = os.path.join(ART, st['kaynak']) if st.get('kaynak') else find_src(key, stage)
    sp = SPECIES[key]
    fams = list(sp['aileler']) + list(st.get('ek_aileler', []))
    raw = np.asarray(Image.open(src).convert('RGB'))
    p, phx, phy = find_period(raw)
    nat = to_native(raw, p, phx, phy) if p > 3 else raw
    fg = key_background(nat)
    fg = main_creature(fg)
    eyes = find_eyes(nat, fg)
    nat2, fbox = erase_face(nat, fg, eyes)
    body = strip_outline(nat2, fg)
    ys, xs = np.where(body)
    # govde boyu: kutugun ust kenarindan (genisligin %60'ina ulasilan ilk satir) ayaga
    widths = body.sum(1)
    top_row = int(np.where(widths >= widths.max() * 0.6)[0][0])
    body_h = ys.max() - top_row + 1 + 1           # +1: sonra eklenecek alt cizgi
    f = (st['govde_boy'] - 1) / (body_h - 1)
    crop = (slice(ys.min(), ys.max() + 1), slice(xs.min(), xs.max() + 1))
    small, sm = downscale(nat2[crop], body[crop], f)
    # Murekkep, Parilti ve Pembe yalniz yuz damgasindan gelir; govde yalniz turun ailelerinden boyanir
    cands = BP.candidates(fams, extra=())
    small, far = snap(small, sm, cands, float(os.environ.get('GL_CH', st.get('doygunluk', cfg.get('doygunluk', 1.0)))),
                      float(os.environ.get('GL_DL', st.get('parlaklik', cfg.get('parlaklik', 0.0)))),
                      cfg.get('acik_aile'), st.get('ek_aileler', []), primary=sp['aileler'][0])
    keep = {BP.tone('Parilti')}
    small, sm, nfix = clean(small, sm, keep)
    # tuvale yerlestir: govde ortalanir, ayaklar alttan 2 piksel yukarida (cizgi dahil)
    C = CANVAS[stage]
    H, W = sm.shape
    swid = sm.sum(1)
    stop = int(np.where(swid >= swid.max() * 0.6)[0][0])
    cols = np.where(sm[stop:].any(0))[0]
    # govde ekseni: govde satirlarinda sol ve sag kenarin ortalamasi
    lefts = [np.where(sm[y])[0].min() for y in range(stop, H) if sm[y].any()]
    rights = [np.where(sm[y])[0].max() for y in range(stop, H) if sm[y].any()]
    axis = (np.median(lefts) + np.median(rights)) / 2.0
    ox = int(round(C / 2.0 - 0.5 - axis))
    oy = C - 3 - (H - 1)   # en alt dolu satir C-3; cizgi C-2... ayak cizgisi alttan 2 piksel yukarida
    oy = C - 2 - 1 - H     # alt cizgi satiri = C-3, yani altta 2 bos satir
    A = np.zeros((C, C, 3), np.uint8); M = np.zeros((C, C), bool)
    for y in range(H):
        for x in range(W):
            if sm[y, x]:
                X, Y = x + ox, y + oy
                if not (0 <= X < C and 0 <= Y < C):
                    raise SystemExit(f'{stage}: cizim tuvale sigmiyor ({X},{Y})')
                A[Y, X] = small[y, x]; M[Y, X] = True
    # yuz konumu: goz merkezleri yeni olcege
    kalip = st['kalip']
    ew, eh = GF.SIZE[kalip]
    ec = [((e['cx'] - xs.min()) * f + ox, (e['cy'] - ys.min()) * f + oy) for e in eyes]
    ey = int(round((ec[0][1] + ec[1][1]) / 2 - eh / 2.0))
    lx = int(round(ec[0][0] - ew / 2.0 + 0.5)); rx = int(round(ec[1][0] - ew / 2.0 + 0.5))
    gmin, gmax = GF.GAP[kalip]
    gap = rx - (lx + ew)
    if gap < gmin or gap > gmax:
        mid = (lx + rx + ew) / 2.0
        gap = min(gmax, max(gmin, gap))
        lx = int(round(mid - gap / 2.0 - ew)); rx = lx + ew + gap
    if 'yuz' in st:
        lx, rx, ey = st['yuz']['lx'], st['yuz']['rx'], st['yuz']['ey']
    sfam = skin_family(A, M)
    colors = face_colors(sfam)
    interior = A.copy()            # yuzsuz ic (karo zemini)
    def put(x, y, c):
        A[y, x] = c
    lay = GF.stamp(put, kalip, 'normal', lx, rx, ey, colors)
    # kukla maskesi (otomatik): tepe = govde ustunun yukarisi, kollar = govde kenarindan tasan ust/orta kisim
    mask = auto_mask(M, stage, st)
    OA, OM = outline(A, M)
    # denetim
    issues = audit(OA, OM, stage, fams, lay, M)
    bodyrows = np.where(M.any(1))[0]
    gw = M[stop + oy:].any(0)
    info = {
        'anahtar': key, 'asama': stage, 'kaynak': src, 'piksel_adimi': round(float(p), 3), 'olcek': round(f, 4),
        'tuval': C, 'kalip': kalip, 'goz': {'lx': lx, 'rx': rx, 'ey': ey}, 'ten': sfam,
        'yuz_kutusu': lay['box'], 'govde_ust': int(stop + oy), 'ayak': int(bodyrows.max()),
        'govde_gen': int(gw.sum()), 'aileler': fams, 'uzak_oran': round(far, 3), 'tek_piksel_duzeltme': nfix,
        'denetim': issues,
    }
    os.makedirs(os.path.join(ROOT, 'build/glemon'), exist_ok=True)
    rgba(OA, OM).save(os.path.join(ROOT, f'build/glemon/{key}_{stage}.png'))
    rgba(A, M).save(os.path.join(ROOT, f'build/glemon/{key}_{stage}_ic.png'))
    rgba(interior, M).save(os.path.join(ROOT, f'build/glemon/{key}_{stage}_yuzsuz.png'))
    mimg = np.zeros((C, C, 3), np.uint8)
    names = sorted(set(mask.values()))
    for (x, y), part in mask.items():
        mimg[y, x] = PART_COL[part]
    Image.fromarray(mimg).save(os.path.join(ROOT, f'assets/glemons/kukla/{key}_{stage}_maske.png'))
    info['parcalar'] = names
    json.dump(info, open(os.path.join(ROOT, f'build/glemon/{key}_{stage}.json'), 'w'), ensure_ascii=False, indent=1)
    report.append(info)
    return info


def face_colors(sfam):
    cheek = 'Pembe-3' if sfam in ('Pembe', 'Kirmizi', 'Turuncu') else 'Pembe-2'
    return {'#': BP.tone('Murekkep'), 'o': BP.tone('Parilti'), 'i': BP.tone('Mor-2'), 'w': BP.tone('Kar-1'),
            't': BP.tone('Gok-1'), 'm': BP.tone(sfam + '-4'), 'r': BP.tone('Kirmizi-3'), 'cheek': BP.tone(cheek)}


def auto_mask(M, stage, st):
    """Otomatik maske (12.4): genisligi en genis satirin %40'indan az olan ust satirlar tepe; kalan govde.
    Kollar ve digerleri kukla dosyasindaki 'maske' dikdortgenleriyle elle isaretlenir: [x0, y0, x1, y1, parca]."""
    H, W = M.shape
    widths = M.sum(1)
    rows = np.where(widths >= widths.max() * 0.4)[0]
    top = int(rows[0])
    out = {}
    for y in range(H):
        for x in range(W):
            if M[y, x]:
                out[(x, y)] = 'tepe' if y < top else 'govde'
    for x0, y0, x1, y1, part in st.get('maske', []):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if (x, y) in out:
                    out[(x, y)] = part
    return out


def audit(A, M, stage, fams, lay, M_in):
    issues = []
    C = A.shape[0]
    ys, xs = np.where(M)
    if ys.max() != C - 3:
        issues.append(f'zemin cizgisi {ys.max()} (beklenen {C - 3})')
    if xs.min() < 1 or xs.max() > C - 2 or ys.min() < 1:
        issues.append('cizim tuval kenarina degiyor')
    cols = set(tuple(A[y, x]) for y, x in zip(ys, xs))
    if len(cols) > 16:
        issues.append(f'renk sayisi {len(cols)} > 16')
    bad = [c for c in cols if BP.family_of(c) is None]
    if bad:
        issues.append(f'palet disi renk {len(bad)}')
    fam_set = set(BP.family_of(c)[0] for c in cols if BP.family_of(c))
    fam_set -= {'Parilti', 'Komur', 'Krem', 'Kar', 'Pembe', 'Mor'}  # Komur-4 = Murekkep; Pembe yanak; Mor-2 goz yansimasi
    if len(fam_set) > 3:
        issues.append(f'aile sayisi {len(fam_set)} > 3: {sorted(fam_set)}')
    # tek piksel
    single = 0
    H, W = M.shape
    for y, x in zip(ys, xs):
        c = tuple(A[y, x])
        if c == BP.tone('Parilti'):
            continue
        same = 0
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            yy, xx = y + dy, x + dx
            if 0 <= yy < H and 0 <= xx < W and M[yy, xx] and tuple(A[yy, xx]) == c:
                same += 1
        single += same == 0
    if single:
        issues.append(f'tek basina piksel {single} (yuz ve cizgi dahil)')
    lo, hi, wmax = BODY_RANGE[stage]
    return issues


def preview(key, infos):
    """onizleme/<anahtar>_ice.png: orijinal | sonuc 6x | dunya 1x + savas 2x | eski cizim."""
    os.makedirs(os.path.join(ROOT, 'onizleme'), exist_ok=True)
    tiles = []
    for info in infos:
        st = info['asama']
        src = Image.open(info['kaynak']).convert('RGB')
        src.thumbnail((384, 384))
        res = Image.open(os.path.join(ROOT, f"build/glemon/{key}_{st}.png"))
        big = res.resize((res.width * 6, res.height * 6), Image.NEAREST)
        bg = Image.new('RGB', (big.width, big.height), (52, 64, 58))
        bg.paste(big, (0, 0), big)
        real = Image.new('RGB', (64 * 3 + 16, 140), (88, 120, 72))
        real.paste(res, (8, 140 - res.height - 8), res)
        r2 = res.resize((res.width * 2, res.height * 2), Image.NEAREST)
        real.paste(r2, (8 + 64, 140 - r2.height - 4), r2)
        old = None
        op = os.path.join(ROOT, f'assets/glemons/{key}/{STAGES.index(st)}.png')
        if os.path.exists(op):
            o = Image.open(op).convert('RGBA')
            gm = json.load(open(os.path.join(ROOT, 'assets/glemons/glemons.json')))[key]
            if 'v' not in gm:
                s = gm['stages'][STAGES.index(st)]
                old = o.crop((0, 0, s['w'], s['h'])).resize((s['w'] * 2, s['h'] * 2), Image.NEAREST)
        h = max(src.height, bg.height, real.height)
        row = Image.new('RGB', (src.width + bg.width + real.width + 140 + 40, h), (30, 26, 34))
        x = 0
        row.paste(src, (x, 0)); x += src.width + 10
        row.paste(bg, (x, 0)); x += bg.width + 10
        row.paste(real, (x, 0)); x += real.width + 10
        if old:
            row.paste(old, (x, 0), old)
        tiles.append(row)
    W = max(t.width for t in tiles); H = sum(t.height + 8 for t in tiles)
    out = Image.new('RGB', (W, H), (30, 26, 34))
    y = 0
    for t in tiles:
        out.paste(t, (0, y)); y += t.height + 8
    out.save(os.path.join(ROOT, f'onizleme/{key}_ice.png'))


def main():
    key = sys.argv[1]
    stages = sys.argv[2:] or STAGES
    cfg = json.load(open(os.path.join(ROOT, f'assets/glemons/kukla/{key}.json'), encoding='utf8'))
    report = []
    for st in stages:
        info = import_stage(key, st, cfg, report)
        print(st, json.dumps({k: info[k] for k in ('olcek', 'goz', 'yuz_kutusu', 'govde_ust', 'ayak', 'govde_gen',
                                                   'uzak_oran', 'denetim', 'parcalar')}, ensure_ascii=False))
    preview(key, report)


if __name__ == '__main__':
    main()
