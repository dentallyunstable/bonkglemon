"""Glemonlari kodla ciz (Eren 2026-11-21: gorsel yuklemek yerine Claude cizer).

Kullanim: python3 tools/glemon_draw.py <anahtar> [asama ...]
Tur cizimi: tools/cizim/<anahtar>.py icinde STAGES = {'bebek': fn, 'genc': fn, 'usta': fn} (patron: 'patron', 'faz2', 'faz3').
Her fn bir D (Drawing) nesnesi alir ve sekilleri ekler; bkz. tools/cizim/KILAVUZ.md.
Cikti glemon_import.py ile ayni (gen_glemons2.py hicbir fark gormez):
  build/glemon/<anahtar>_<asama>.png / _ic.png / _yuzsuz.png / .json, assets/glemons/kukla/<anahtar>_<asama>_maske.png
  onizleme/<anahtar>_cizim.png (6 kat buyuk + oyun arka planinda gercek boy + eski cizim)

Stil kitabi (plan v2 bolum 3) burada kurallasir: ortak palet, isik sol ustten (genis orta ton, sag altta golge,
sol ustte kucuk acik leke, derin ton yalniz en altta), 1 piksel dis cizgi ailenin 4. tonu (en alt Murekkep),
ic cizgi ailenin 3. tonu, tek basina piksel yok, yuz ortak goz kalibindan damgalanir.
"""
import importlib.util, json, math, os, sys
from collections import Counter, deque
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bonk_palette as BP
import glemon_faces as GF

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = {'bebek': (48, 48), 'genc': (56, 56), 'usta': (64, 64), 'patron': (96, 80), 'faz2': (96, 80), 'faz3': (96, 80)}
KALIP = {'bebek': 'K', 'genc': 'K', 'usta': 'O', 'patron': 'B', 'faz2': 'B', 'faz3': 'B'}
BODY_RANGE = {'bebek': (26, 30, 30), 'genc': (32, 38, 38), 'usta': (42, 48, 48), 'patron': (50, 58, 72), 'faz2': (50, 58, 72), 'faz3': (50, 58, 72)}
PART_COL = {'govde': (90, 160, 230), 'tepe': (120, 220, 90), 'kol_1': (240, 150, 60), 'kol_2': (230, 90, 160),
            'kulak_1': (250, 230, 80), 'kulak_2': (200, 120, 250), 'kuyruk': (90, 230, 220), 'esya': (250, 90, 90),
            'kanat_1': (160, 100, 40), 'kanat_2': (40, 120, 120), 'kafa': (200, 200, 200)}
LIGHT = np.array([-0.55, -0.62, 0.56])
LIGHT = LIGHT / np.linalg.norm(LIGHT)


# ---------------------------------------------------------------- sekil rasterlama
PAD = 16   # cizim tuvalden genis bir calisma alaninda yapilir; yerlestirmeden sonra tuvale kirpilir


def _grid(W, H):
    ys, xs = np.mgrid[0:H, 0:W]
    return xs + 0.5 - PAD, ys + 0.5 - PAD


def m_ellipse(W, H, c, r, rot=0):
    X, Y = _grid(W, H)
    dx, dy = X - c[0], Y - c[1]
    if rot:
        a = math.radians(rot)
        dx, dy = dx * math.cos(a) + dy * math.sin(a), -dx * math.sin(a) + dy * math.cos(a)
    return (dx / r[0]) ** 2 + (dy / r[1]) ** 2 <= 1.0


def m_rect(W, H, box, rad=0):
    x0, y0, x1, y1 = box
    X, Y = _grid(W, H)
    m = (X >= x0) & (X <= x1 + 1) & (Y >= y0) & (Y <= y1 + 1)
    if rad:
        cx = np.clip(X, x0 + rad, x1 + 1 - rad); cy = np.clip(Y, y0 + rad, y1 + 1 - rad)
        m &= (X - cx) ** 2 + (Y - cy) ** 2 <= rad * rad
    return m


def m_poly(W, H, pts):
    X, Y = _grid(W, H)
    inside = np.zeros((H, W), bool)
    n = len(pts)
    for i in range(n):
        x1, y1 = pts[i]; x2, y2 = pts[(i + 1) % n]
        cond = ((y1 > Y) != (y2 > Y))
        xint = (x2 - x1) * (Y - y1) / ((y2 - y1) if y2 != y1 else 1e-9) + x1
        inside ^= cond & (X < xint)
    return inside


def m_capsule(W, H, a, b, w):
    X, Y = _grid(W, H)
    w0, w1 = (w, w) if not isinstance(w, (tuple, list)) else w
    ax, ay = a; bx, by = b
    vx, vy = bx - ax, by - ay
    L2 = vx * vx + vy * vy or 1e-9
    t = np.clip(((X - ax) * vx + (Y - ay) * vy) / L2, 0, 1)
    px, py = ax + t * vx, ay + t * vy
    rr = (w0 + (w1 - w0) * t) / 2.0
    return (X - px) ** 2 + (Y - py) ** 2 <= rr * rr


def m_curve(W, H, pts, w):
    """Kalin egri: noktalar arasi kapsul zinciri; w sabit ya da (bas, son)."""
    m = np.zeros((H, W), bool)
    n = len(pts) - 1
    w0, w1 = (w, w) if not isinstance(w, (tuple, list)) else w
    for i in range(n):
        a0 = w0 + (w1 - w0) * i / n; a1 = w0 + (w1 - w0) * (i + 1) / n
        m |= m_capsule(W, H, pts[i], pts[i + 1], (a0, a1))
    return m


def m_pix(W, H, at, rows):
    m = np.zeros((H, W), bool)
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            X, Y = int(round(at[0])) + x + PAD, int(round(at[1])) + y + PAD
            if ch not in '. ' and 0 <= X < W and 0 <= Y < H:
                m[Y, X] = True
    return m


def dist_in(m):
    """Seklin icinde kenara 8-komsu uzaklik (kenar pikseli 1)."""
    H, W = m.shape
    D = np.zeros((H, W), float)
    q = deque()
    for y, x in zip(*np.where(m)):
        edge = False
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = y + dy, x + dx
                if not (0 <= yy < H and 0 <= xx < W) or not m[yy, xx]:
                    edge = True
        if edge:
            D[y, x] = 1; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and m[yy, xx] and D[yy, xx] == 0:
                    D[yy, xx] = D[y, x] + 1; q.append((yy, xx))
    return D


def shade_round(m, lift=0.0, flat=1.0):
    """Hacimli golge (stil kitabi 3.6): sekli kutusuna oturan bir elipsoit gibi isiklandirir, isik sol ustten.
    2 = genis orta ton, 3 = sag alt golge, 1 = sol ustte kucuk acik leke (yalniz yeterince icte),
    4 = yalniz en alttaki dar serit. Kucuk sekillerde (yaricap < 3.5) 4. ton kullanilmaz."""
    H, W = m.shape
    ys, xs = np.where(m)
    T = np.zeros((H, W), int)
    if not len(ys):
        return T
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    cx, cy = (x0 + x1) / 2.0, (y0 + y1) / 2.0
    rx, ry = max(1.0, (x1 - x0) / 2.0), max(1.0, (y1 - y0) / 2.0)
    small = min(rx, ry) < 3.5
    D = dist_in(m)
    strip = 1 if max(rx, ry) < 10 else 2
    below = np.zeros((H, W), int)          # ayni sutunda alttaki dolu piksel sayisi
    for x in range(W):
        run = 0
        for y in range(H - 1, -1, -1):
            run = run + 1 if m[y, x] else 0
            below[y, x] = run - 1 if m[y, x] else 0
    for y, x in zip(ys, xs):
        u = (x + 0.5 - cx) / rx; v = (y + 0.5 - cy) / ry
        d = math.sqrt(u * u + v * v)
        k = min(0.999, d) * flat
        nx, ny = (u / d * k, v / d * k) if d > 1e-6 else (0.0, 0.0)
        nz = math.sqrt(max(0.0, 1 - nx * nx - ny * ny))
        I = nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + lift
        if I > 0.87 and D[y, x] >= 2 and not small:
            t = 1
        elif I > 0.18:
            t = 2
        else:
            t = 3
        if t == 3 and not small and below[y, x] < strip and ny > 0.3:
            t = 4
        T[y, x] = t
    return T


class Drawing:
    """Bir asamanin cizimi. Sekiller sirayla eklenir; sonra eklenen ondedir (z ile degistirilebilir)."""

    def __init__(self, stage):
        self.stage = stage
        self.CW, self.CH = SIZE[stage]                    # asil tuval
        self.W, self.H = self.CW + 2 * PAD, self.CH + 2 * PAD   # calisma alani
        self.shapes = []
        self.names = {}
        self.face = None
        self.ten = None
        self.flyer = False
        self.notes = []

    # -- sekiller
    def add(self, kind, fam, part='govde', z=None, **kw):
        W, H = self.W, self.H
        if kind == 'ellipse':
            m = m_ellipse(W, H, kw['c'], kw['r'], kw.get('rot', 0))
        elif kind == 'circle':
            m = m_ellipse(W, H, kw['c'], (kw['r'], kw['r']))
        elif kind == 'rect':
            m = m_rect(W, H, kw['box'], kw.get('rad', 0))
        elif kind == 'poly':
            m = m_poly(W, H, kw['pts'])
        elif kind == 'capsule':
            m = m_capsule(W, H, kw['a'], kw['b'], kw['w'])
        elif kind == 'curve':
            m = m_curve(W, H, kw['pts'], kw['w'])
        elif kind == 'pix':
            m = m_pix(W, H, kw['at'], kw['rows'])
        else:
            raise ValueError(kind)
        if kw.get('inbox'):
            m &= m_rect(W, H, kw['inbox'])
        if kw.get('outbox'):
            m &= ~m_rect(W, H, kw['outbox'])
        if kw.get('join'):          # var olan sekle ekle (tek parca golgelenir, ic cizgi olusmaz)
            self.names[kw['join']]['mask'] |= m
            return self.names[kw['join']]
        if kw.get('sub'):           # var olan sekilden oy
            self.names[kw['sub']]['mask'] &= ~m
            return self.names[kw['sub']]
        if kw.get('clip'):
            m &= self.names[kw['clip']]['mask']
        if kw.get('minus'):
            for nm in ([kw['minus']] if isinstance(kw['minus'], str) else kw['minus']):
                m &= ~self.names[nm]['mask']
        s = {'kind': kind, 'fam': fam, 'part': part, 'mask': m, 'z': len(self.shapes) if z is None else z,
             'i': len(self.shapes), 'shade': kw.get('shade', 'round'), 'tone': kw.get('tone'),
             'line': kw.get('line'), 'mark': bool(kw.get('clip')) or kw.get('mark', False),
             'lift': kw.get('lift', 0.0), 'flat': kw.get('flatness', 1.0), 'name': kw.get('name'),
             'cut': kw.get('cut', False), 'keep': kw.get('keep', False), 'rows': kw.get('rows'),
             'key': kw.get('key'), 'at': kw.get('at'), 'shift': kw.get('shift', 0), 'noshadow': kw.get('noshadow', False),
             'ghost': kw.get('ghost', False), 'cast': kw.get('cast', 0)}
        self.shapes.append(s)
        if s['name']:
            self.names[s['name']] = s
        return s

    def ellipse(self, fam, c, r, **kw): return self.add('ellipse', fam, c=c, r=r, **kw)
    def circle(self, fam, c, r, **kw): return self.add('circle', fam, c=c, r=r, **kw)
    def rect(self, fam, box, **kw): return self.add('rect', fam, box=box, **kw)
    def poly(self, fam, pts, **kw): return self.add('poly', fam, pts=pts, **kw)
    def capsule(self, fam, a, b, w, **kw): return self.add('capsule', fam, a=a, b=b, w=w, **kw)
    def curve(self, fam, pts, w, **kw): return self.add('curve', fam, pts=pts, w=w, **kw)

    def pix(self, at, rows, key, part='govde', **kw):
        """Elle piksel: rows harfleri key ile 'Aile-ton' ya da 'Parilti' olur (golgesiz, oldugu gibi)."""
        return self.add('pix', None, part=part, at=at, rows=rows, key=key, shade='pix', **kw)

    def cut(self, kind, **kw):
        """Saydam bosluk acar (iki bacak arasi gibi)."""
        return self.add(kind, None, part='govde', cut=True, shade='none', **kw)

    def set_face(self, cx, ey, gap=None, mouth=True, ten=None, lx=None, rx=None, goz=None, yanak=True, tek=False, kalip=None):
        """cx: iki gozun ortasi, ey: gozlerin ust satiri. gap: goz arasi bosluk (varsayilan kalibin en kucugu+1).
        goz: goz rengi (varsayilan Murekkep; parlayan gozler icin ornek 'Cam-1'). yanak=False: yanak basilmaz.
        tek=True: tek, ortada bir goz (yalniz Gozmantar gibi istisnalar). kalip: 'K'/'O'/'B' goz kalibini zorlar."""
        self.goz, self.yanak = goz, yanak
        r = lambda v: None if v is None else int(round(v))
        self.face = {'cx': cx, 'ey': r(ey), 'gap': r(gap), 'mouth': mouth, 'lx': r(lx), 'rx': r(rx), 'tek': tek, 'kalip': kalip}
        if ten:
            self.ten = ten

    # -- birlestirme
    def render(self):
        W, H = self.W, self.H
        col = np.zeros((H, W, 3), np.uint8)
        alpha = np.zeros((H, W), bool)
        owner = -np.ones((H, W), int)
        tone = np.zeros((H, W), int)
        fam = np.full((H, W), '', object)
        part = np.full((H, W), '', object)
        order = sorted(self.shapes, key=lambda s: (s['z'], s['i']))
        shaded = {}
        self._shadowed = set()
        for s in order:
            m = s['mask']
            if s['ghost']:
                continue
            if s['cut']:
                alpha &= ~m; owner[m] = -1
                continue
            if s['shade'] == 'pix':
                for y, r in enumerate(s['rows']):
                    for x, ch in enumerate(r):
                        X, Y = int(round(s['at'][0])) + x + PAD, int(round(s['at'][1])) + y + PAD
                        if ch in '. ' or not (0 <= X < W and 0 <= Y < H):
                            continue
                        nm = s['key'][ch]
                        c = BP.tone(nm)
                        col[Y, X] = c; alpha[Y, X] = True; owner[Y, X] = s['i']
                        fo = BP.family_of(c)
                        fam[Y, X] = fo[0] if fo else ''
                        tone[Y, X] = fo[1] if fo else 0
                        if not s['mark']:
                            part[Y, X] = s['part']
                continue
            if s['mark']:
                # desen: altindaki parcanin tonunu (shift ile kaydirilmis) kendi ailesinde kullanir
                for y, x in zip(*np.where(m & alpha)):
                    t = s['tone'] or max(1, min(4, tone[y, x] + s['shift']))
                    if s['fam'] in ('Parilti',):
                        c = BP.tone('Parilti'); f, t = 'Parilti', 0
                    else:
                        c = BP.tone(f"{s['fam']}-{t}"); f = s['fam']
                    col[y, x] = c; fam[y, x] = f; tone[y, x] = t; owner[y, x] = s['i']
                continue
            if s['shade'] == 'flat':
                T = np.where(m, s['tone'] or 2, 0)
            else:
                T = shade_round(m, s['lift'], s['flat'])
            shaded[s['i']] = T
            ys, xs = np.where(m)
            for y, x in zip(ys, xs):
                t = int(T[y, x])
                col[y, x] = BP.tone(f"{s['fam']}-{t}")
                fam[y, x] = s['fam']; tone[y, x] = t; owner[y, x] = s['i']; alpha[y, x] = True
                part[y, x] = s['part']
        # temas golgesi: ondeki seklin sag-alt komsusu (arkadaki sekil) bir ton koyulur
        idx = {s['i']: s for s in self.shapes}
        z_of = {s['i']: (s['z'], s['i']) for s in self.shapes}
        for y in range(H):
            for x in range(W):
                o = owner[y, x]
                if o < 0 or not alpha[y, x] or idx[o]['mark'] or idx[o]['shade'] == 'pix' or idx[o]['noshadow']:
                    continue
                for dy, dx in ((-1, 0), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and alpha[yy, xx]:
                        o2 = owner[yy, xx]
                        if o2 >= 0 and o2 != o and z_of[o2] > z_of[o] and not idx[o2]['mark'] and not idx[o2]['noshadow']:
                            t = min(4, tone[y, x] + 1) if tone[y, x] < 3 else tone[y, x]
                            tone[y, x] = t
                            col[y, x] = BP.tone(f"{fam[y, x]}-{t}")
                            break
        # dusen golge: cast=n olan sekil, altindaki n satira (arkadaki sekillere) bir ton koyuluk verir
        for s in self.shapes:
            n = s.get('cast', 0)
            if not n:
                continue
            m = s['mask']
            for y, x in zip(*np.where(m)):
                for k in range(1, n + 1):
                    yy = y + k
                    if yy >= H or m[yy, x]:
                        continue
                    o2 = owner[yy, x]
                    if o2 < 0 or o2 == s['i'] or not alpha[yy, x] or z_of[o2] > z_of[s['i']] or idx[o2]['mark']:
                        continue
                    if (yy, x) not in self._shadowed:
                        self._shadowed.add((yy, x))
                        t = min(4, tone[yy, x] + 1)
                        tone[yy, x] = t
                        col[yy, x] = BP.tone(f"{fam[yy, x]}-{t}")
        # ic cizgi: ondeki seklin, arkasindaki AYNI aileden sekle degen kenari 3. ton
        for y in range(H):
            for x in range(W):
                o = owner[y, x]
                if o < 0 or not alpha[y, x]:
                    continue
                s = idx[o]
                if s['mark'] or s['shade'] == 'pix' or s['line'] is False:
                    continue
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and alpha[yy, xx]:
                        o2 = owner[yy, xx]
                        if o2 >= 0 and o2 != o and z_of[o2] < z_of[o] and not idx[o2]['mark']:
                            if s['line'] or fam[yy, xx] == fam[y, x]:
                                t = 3 if tone[y, x] < 3 else 4
                                tone[y, x] = t
                                col[y, x] = BP.tone(f"{fam[y, x]}-{t}")
                                break
        self.col, self.alpha, self.part, self.fam, self.tone = col, alpha, part, fam, tone
        return self


# ---------------------------------------------------------------- yardimcilar (glemon_import ile ayni kurallar)
def clean(col, alpha, keep=()):
    """Tek basina kalan (4 komsusu da baska renk) pikselleri en cok komsusu olan renkle degistir."""
    H, W = alpha.shape
    n = 0
    for _ in range(2):
        for y in range(H):
            for x in range(W):
                if not alpha[y, x]:
                    continue
                c = tuple(int(v) for v in col[y, x])
                if c in keep:
                    continue
                nb = []
                for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < H and 0 <= xx < W and alpha[yy, xx]:
                        nb.append(tuple(int(v) for v in col[yy, xx]))
                if nb and c not in nb:
                    col[y, x] = Counter(nb).most_common(1)[0][0]; n += 1
    return n


def outline(a, m):
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
                    nb.append((dy, tuple(int(v) for v in a[yy, xx])))
            if not nb:
                continue
            fams = Counter()
            for dy, c in nb:
                fo = BP.family_of(c)
                if fo and fo[0] != 'Parilti':
                    fams[fo[0]] += 1
            if y > bottom and any(dy == -1 for dy, _ in nb):
                c = BP.tone('Murekkep')
            elif fams:
                c = BP.tone(fams.most_common(1)[0][0] + '-4')
            else:
                c = BP.tone('Murekkep')
            o[y, x] = c; om[y, x] = True
    return o, om


def rgba(a, m):
    out = np.zeros(m.shape + (4,), np.uint8)
    out[..., :3] = a; out[..., 3] = m * 255
    return Image.fromarray(out, 'RGBA')


def face_colors(sfam, goz=None, yanak=True):
    cheek = 'Pembe-3' if sfam in ('Pembe', 'Kirmizi', 'Turuncu') else 'Pembe-2'
    c = {'#': BP.tone(goz or 'Murekkep'), 'o': BP.tone('Parilti'), 'i': BP.tone('Mor-2'), 'w': BP.tone('Kar-1'),
         't': BP.tone('Gok-1'), 'm': BP.tone(sfam + '-4'), 'r': BP.tone('Kirmizi-3'), 'cheek': BP.tone(cheek)}
    if not yanak:
        c['cheek'] = None
    return c


def load_species(key):
    p = os.path.join(ROOT, 'tools/cizim', f'{key}.py')
    spec = importlib.util.spec_from_file_location(f'cizim_{key}', p)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# ---------------------------------------------------------------- ana is
def draw_stage(key, stage, mod):
    d = Drawing(stage)
    mod.STAGES[stage](d)
    d.render()
    W, H = d.CW, d.CH
    col, alpha, part = d.col, d.alpha, d.part
    if not alpha.any():
        raise SystemExit(f'{key} {stage}: bos cizim')
    # yerlestir: govde yatayda ortada; ayak alttan 2 piksel yukarida (cizgi dahil), ucanlarda +8 (patron +10)
    ys, xs = np.where(alpha)
    ys, xs = ys - PAD, xs - PAD                       # tuval koordinati
    gm = alpha & (part == 'govde')
    gys, gxs = np.where(gm)
    gxs = gxs - PAD
    axis = (gxs.min() + gxs.max()) / 2.0
    ox = int(round((W - 1) / 2.0 - axis))
    lift = 0
    if d.flyer:
        lift = 10 if stage in ('patron', 'faz2', 'faz3') else 8
    oy = (H - 4 - lift) - ys.max()
    if getattr(mod, 'NO_AUTOPLACE', False):
        ox = oy = 0
    def sh(a, fill):
        # tuvaldeki (Y, X) = calisma alanindaki (Y - oy + PAD, X - ox + PAD)
        o = np.full((H, W) + a.shape[2:], fill, dtype=a.dtype)
        GH, GW = a.shape[:2]
        y0, y1 = max(0, oy - PAD), min(H, GH + oy - PAD); x0, x1 = max(0, ox - PAD), min(W, GW + ox - PAD)
        o[y0:y1, x0:x1] = a[y0 - oy + PAD:y1 - oy + PAD, x0 - ox + PAD:x1 - ox + PAD]
        return o
    if ys.min() + oy < 1 or xs.min() + ox < 1 or xs.max() + ox > W - 2:
        d.notes.append('UYARI: cizim tuvale sigmiyor ya da kenara degiyor')
    col = sh(col, 0); alpha = sh(alpha, False); part = sh(part, '')
    keep = {BP.tone('Parilti')}
    for s in d.shapes:
        if s.get('keep') and s['shade'] == 'pix':
            for ch, nm in s['key'].items():
                keep.add(BP.tone(nm))
    nfix = clean(col, alpha, keep)
    # kabuklu turler: kafa ve kollar olmadan da ciz (savunmada kabugun arkasi gorunsun)
    shell = None
    if any(s_['part'] == 'kafa' for s_ in d.shapes):
        d2 = Drawing(stage)
        d2.shapes = [s_ for s_ in d.shapes if s_['part'] not in ('kafa', 'kol_1', 'kol_2')]
        d2.names = d.names
        d2.render()
        c2 = sh(d2.col, 0); a2 = sh(d2.alpha, False)
        clean(c2, a2, keep)
        shell = (c2, a2)
    bare = col.copy()
    # yuz
    kal = (d.face or {}).get('kalip') or KALIP[stage]
    ew, eh = GF.SIZE[kal]
    f = d.face
    if f is None:
        raise SystemExit(f'{key} {stage}: set_face yok')
    if f.get('tek'):
        lx = rx = int(round(f['cx'] + ox - ew / 2.0))
    elif f['lx'] is not None:
        lx, rx = f['lx'] + ox, f['rx'] + ox
    else:
        gap = f['gap'] if f['gap'] is not None else GF.GAP[kal][0] + 1
        cx = f['cx'] + ox
        lx = int(round(cx - gap / 2.0 - ew)); rx = lx + ew + gap
    ey = f['ey'] + oy
    gmin, gmax = GF.GAP[kal]
    g = rx - lx - ew
    if not f.get('tek') and not (gmin <= g <= gmax):
        d.notes.append(f'UYARI: goz araligi {g} (kural {gmin}-{gmax})')
    ten = d.ten or Counter(x for x in d.fam.flatten() if x).most_common(1)[0][0]
    colors = face_colors(ten, getattr(d, 'goz', None), getattr(d, 'yanak', True))
    A = col.copy()
    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            A[y, x] = c
    lay = GF.stamp(put, kal, 'normal', lx, rx, ey, colors, skip_mouth=not f['mouth'])
    OA, OM = outline(A, alpha)
    # renk siniri (16, patron 20): ic renklerden en az kullanilani ayni ailenin komsu tonuna katar
    limit = 20 if stage in ('patron', 'faz2', 'faz3') else 16
    face_cols = set(tuple(int(v) for v in c) for c in colors.values() if c is not None)
    merged = []
    while True:
        cols_all = set(tuple(int(v) for v in OA[y, x]) for y, x in zip(*np.where(OM)))
        if len(cols_all) <= limit:
            break
        cnt = Counter(tuple(int(v) for v in A[y, x]) for y, x in zip(*np.where(alpha)))
        cands = [(n, c) for c, n in cnt.items() if c not in face_cols and BP.family_of(c) and BP.family_of(c)[0] != 'Parilti']
        cands.sort()
        done = False
        for n, c in cands:
            fa, t = BP.family_of(c)
            for t2 in ((t - 1, t + 1) if t > 2 else (t + 1, t - 1)):
                if 1 <= t2 <= 4:
                    c2 = BP.tone(f'{fa}-{t2}')
                    if c2 in cnt or c2 in cols_all:
                        for arr in (A, bare):
                            mm = (arr == np.array(c, np.uint8)).all(2) & alpha
                            arr[mm] = c2
                        merged.append(f'{fa}-{t}>{t2}')
                        done = True
                        break
            if done:
                break
        if not done:
            break
        OA, OM = outline(A, alpha)
    if merged:
        d.notes.append('renk birlestirme: ' + ', '.join(merged))
    # olculer
    gm = alpha & (part == 'govde')
    gys, gxs = np.where(gm)
    rows = np.where(alpha.any(1))[0]
    widths = alpha.sum(1)
    govde_ust = int(np.where(widths >= widths.max() * 0.6)[0][0])   # glemon_import ile ayni tanim
    fams = sorted(set(x for x in d.fam.flatten() if x and x != 'Parilti'))
    nt = alpha & ~np.isin(part, ['tepe', 'kulak_1', 'kulak_2', 'kanat_1', 'kanat_2', 'kuyruk', 'esya'])
    if not nt.any():
        nt = alpha
    body_h = int(rows.max() - np.where(nt.any(1))[0].min() + 3)   # cizgi dahil, tepe/kulak haric
    lo, hi, wmax = BODY_RANGE[stage]
    issues = list(d.notes)
    if not (lo <= body_h <= hi):
        issues.append(f'govde boyu {body_h} (kural {lo}-{hi})')
    bw = int(gxs.max() - gxs.min() + 3)
    if bw > wmax:
        issues.append(f'govde genisligi {bw} > {wmax}')
    cols = set(tuple(int(v) for v in OA[y, x]) for y, x in zip(*np.where(OM)))
    if len(cols) > (20 if stage in ('patron', 'faz2', 'faz3') else 16):
        issues.append(f'renk sayisi {len(cols)}')
    info = {
        'anahtar': key, 'asama': stage, 'kaynak': 'cizim', 'tuval': W, 'tuval_h': H, 'kalip': kal,
        'boy': body_h, 'goz': {'lx': int(lx), 'rx': int(rx), 'ey': int(ey)}, 'ten': ten, 'yuz_kutusu': [int(v) for v in lay['box']],
        'govde_ust': govde_ust, 'ayak': int(rows.max()), 'govde_gen': bw, 'aileler': fams, 'renk': len(cols),
        'tek_piksel_duzeltme': nfix, 'denetim': issues, 'agiz': bool(f['mouth']), 'ucar': bool(d.flyer),
        'goz_renk': getattr(d, 'goz', None), 'yanak': getattr(d, 'yanak', True),
    }
    os.makedirs(os.path.join(ROOT, 'build/glemon'), exist_ok=True)
    base = os.path.join(ROOT, f'build/glemon/{key}_{stage}')
    if shell is not None:
        rgba(*shell).save(base + '_kafasiz.png')
    elif os.path.exists(base + '_kafasiz.png'):
        os.remove(base + '_kafasiz.png')
    rgba(OA, OM).save(base + '.png')
    rgba(A, alpha).save(base + '_ic.png')
    rgba(bare, alpha).save(base + '_yuzsuz.png')
    mimg = np.zeros((H, W, 3), np.uint8)
    names = set()
    for y, x in zip(*np.where(alpha)):
        p = part[y, x] or 'govde'
        mimg[y, x] = PART_COL[p]; names.add(p)
    os.makedirs(os.path.join(ROOT, 'assets/glemons/kukla'), exist_ok=True)
    Image.fromarray(mimg).save(os.path.join(ROOT, f'assets/glemons/kukla/{key}_{stage}_maske.png'))
    info['parcalar'] = sorted(names)
    json.dump(info, open(base + '.json', 'w'), ensure_ascii=False, indent=1)
    return info


def preview(key, infos):
    os.makedirs(os.path.join(ROOT, 'onizleme'), exist_ok=True)
    big = []
    for info in infos:
        im = Image.open(os.path.join(ROOT, f"build/glemon/{key}_{info['asama']}.png"))
        b = im.resize((im.width * 6, im.height * 6), Image.NEAREST)
        bg = Image.new('RGB', b.size, (52, 64, 58)); bg.paste(b, (0, 0), b)
        big.append((info, im, bg))
    Wt = sum(b.width + 8 for _, _, b in big) + 8
    Ht = max(b.height for _, _, b in big) + 8 + 150
    out = Image.new('RGB', (Wt, Ht), (30, 26, 34))
    x = 8
    for info, im, bg in big:
        out.paste(bg, (x, 8)); x += bg.width + 8
    # oyun arka planinda gercek boy: dunya 1x, savas 2x; eski cizim
    strip = Image.new('RGB', (Wt - 16, 140), (96, 128, 80))
    sx = 8
    for info, im, bg in big:
        strip.paste(im, (sx, 140 - im.height - 6), im); sx += im.width + 6
    sx += 12
    for info, im, bg in big:
        i2 = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
        strip.paste(i2, (sx, 140 - i2.height - 2), i2); sx += i2.width + 4
    gj = json.load(open(os.path.join(ROOT, 'assets/glemons/glemons.json')))
    old = gj.get(key)
    if old and 'v' not in old and sx < strip.width - 60:
        sx += 16
        for si, st in enumerate(old['stages']):
            p = os.path.join(ROOT, f'assets/glemons/{key}/{si}.png')
            if os.path.exists(p):
                o = Image.open(p).convert('RGBA').crop((0, 0, st['w'], st['h']))
                o2 = o.resize((st['w'] * 2, st['h'] * 2), Image.NEAREST)
                if sx + o2.width < strip.width:
                    strip.paste(o2, (sx, 140 - o2.height - 2), o2); sx += o2.width + 4
    out.paste(strip, (8, Ht - 146))
    out.save(os.path.join(ROOT, f'onizleme/{key}_cizim.png'))


def main():
    key = sys.argv[1]
    mod = load_species(key)
    stages = sys.argv[2:] or list(mod.STAGES)
    infos = []
    for st in stages:
        info = draw_stage(key, st, mod)
        infos.append(info)
        print(key, st, 'renk', info['renk'], 'gen', info['govde_gen'], 'boy', info['boy'],
              'parca', info['parcalar'], ('DENETIM: ' + '; '.join(info['denetim'])) if info['denetim'] else 'ok')
    preview(key, infos)
    # gen_glemons2 icin kukla ayari (yoksa yazilir; parla_aile = ozel hamlede parlayan aile)
    kp = os.path.join(ROOT, f'assets/glemons/kukla/{key}.json')
    cfg = json.load(open(kp, encoding='utf8')) if os.path.exists(kp) else {}
    cfg.update({'anahtar': key, 'kaynak': 'cizim', 'parla_aile': getattr(mod, 'PARLA', None) or cfg.get('parla_aile') or infos[0]['aileler'][-1],
                'not': (mod.__doc__ or '').strip() or cfg.get('not', '')})
    json.dump(cfg, open(kp, 'w', encoding='utf8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
