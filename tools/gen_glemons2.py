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
            (250, 230, 80): 'kulak_1', (200, 120, 250): 'kulak_2', (90, 230, 220): 'kuyruk', (250, 90, 90): 'esya'}
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
LOOP = {'durma', 'yurume', 'uyku', 'savunma'}
HIT = {'saldiri': 3, 'ozel': 4}


def F(**k):
    return k


# ---------------------------------------------------------------- kare tarifleri (bolum 5.4, Bebek birimi)
# dx,dy: butun Glemon (ileri = -x, Glemon sola bakar)  sq: +ezil/-uza (satir)  lean: ust govde (kafa) kayar
# p: {parca: (dx,dy)} ek kayma  face: ifade (None = pisirilmis normal yuz)  flash: butun Glemon Parilti
# ol: dis cizgi rengi  trail: hiz izi  glow: parlayan aile bir ton acilir  noface: yuz gorunmez
def anim_durma(sp):
    return [F(), F(sq=1), F(sq=1), F(), F(sq=-1), F(sq=-1)]


def huy_frames(code, sp):
    """Bolum 5.5 huy kutuphanesi; parca yoksa govde ile calisir. Kutukcuk: H1 (filiz titrer, sonra sasirir)."""
    if code == 'H1':
        return [F(), F(p={'tepe': (-1, 0)}, face='bak_sol'), F(p={'tepe': (1, 0)}, face='bak_sol'),
                F(p={'tepe': (-1, 0)}, face='bak_sol'), F(p={'tepe': (1, 0)}, face='bak_sol'),
                F(p={'tepe': (0, -1)}), F(sq=-1, face='saskin'), F(sq=-1, face='saskin'), F(face='saskin'), F(face='saskin')]
    if code == 'H3':
        return [F(sq=1), F(dy=-2, sq=-1, face='mutlu'), F(dy=-1, face='mutlu'), F(sq=1, face='mutlu'), F(dy=-2, sq=-1, face='mutlu'),
                F(dy=-1, face='mutlu'), F(sq=1, face='mutlu'), F(face='mutlu'), F(), F()]
    if code == 'H4':
        return [F(face='bak_sol', lean=-1)] * 3 + [F(face='bak_sag', lean=1)] * 3 + [F(face='kapali'), F(), F(), F()]
    # varsayilan: silkelenme (H2)
    return [F(dx=-1), F(dx=1), F(dx=-1), F(dx=1), F(dx=-1), F(dx=1), F(dx=-1), F(dx=1), F(), F()]


def yurume_frames(kind):
    if kind == 'agir':   # agir turler: ziplama yerine iki yana 1 piksel sallanarak
        return [F(lean=-1), F(lean=-1, sq=1), F(), F(lean=1), F(lean=1, sq=1), F()]
    if kind == 'ucan':
        return [F(dx=-1, dy=-1), F(dx=-1, dy=-2), F(dx=-1, dy=-2), F(dx=-1, dy=-1), F(dx=-1), F(dx=-1)]
    return [F(sq=1), F(dy=-1, sq=-1), F(dy=-3, p={'kulak_1': (0, 1), 'kulak_2': (0, 1)}), F(dy=-3), F(dy=-1, sq=-1),
            F(sq=1, p={'kulak_1': (0, 1), 'kulak_2': (0, 1)})]


def saldiri_frames(code):
    hit = F(dx=-8, sq=1)
    if code == 'A1':     # tos: kafa parcasi 2 piksel daha ileride
        hit = F(dx=-8, sq=1, lean=-2)
    elif code == 'A2':
        hit = F(dx=-8, dy=0, sq=1)
    return [F(dx=2, sq=1), F(dx=3, sq=1), F(dx=-6, sq=-1, trail=2), hit, F(dx=-3), F(sq=1)]


def ozel_frames(sp):
    """Kutukcuk 'Kafa Atma': halkalar parlar, iki adim gerileyip tos (bolum 7.3 + 5.4 ozel)."""
    g = 'parla'
    return [F(dx=2, sq=1, glow=g, ol='Parilti', face='kizgin'), F(dx=4, sq=1, glow=g, face='kizgin'),
            F(dx=3, sq=1, glow=g, ol='Parilti', face='kizgin'), F(dx=-4, sq=-1, flash=True),
            F(dx=-8, sq=1, lean=-2), F(dx=-6, lean=-1), F(dx=-3), F(sq=1)]


def frames_for(sp, walk):
    return {
        'durma': anim_durma(sp),
        'huy': huy_frames(sp.get('huy', {}).get('kod'), sp),
        'yurume': yurume_frames(walk),
        'hazirlik': [F(dx=2, sq=1, face='kizgin'), F(dx=1, sq=1, ol='Sari-1', face='kizgin'), F(dx=2, sq=1, face='kizgin')],
        'saldiri': saldiri_frames(sp.get('saldiri')),
        'ozel': ozel_frames(sp),
        'hasar': [F(dx=3, flash=True), F(dx=4, sq=1, face='aci'), F(dx=2, face='aci'), F()],
        'bayilma': [F(dx=-2, face='sersem'), F(dx=2, face='sersem'), F(sq=-1, face='sersem'), F(sq=2, face='baygin'),
                    F(sq=3, p={'tepe': (0, 1), 'kol_1': (0, 1), 'kol_2': (0, 1)}, face='baygin'),
                    F(sq=3, p={'tepe': (0, 1), 'kol_1': (0, 1), 'kol_2': (0, 1)}, face='baygin')],
        'uyku': [F(sq=s, p={'tepe': (0, 1), 'kulak_1': (0, 1), 'kulak_2': (0, 1)}, face='kapali') for s in (2, 3, 3, 2)],
        'mutlu': [F(sq=1, face='mutlu'), F(dy=-4, sq=-1, p={'kol_1': (0, -1), 'kol_2': (0, -1), 'tepe': (0, -1)}, face='mutlu'),
                  F(sq=1, face='mutlu'), F(dy=-2, face='mutlu'), F(sq=1, face='mutlu'), F(face='mutlu')],
        'savunma': [F(sq=2, p={'kol_1': (1, 1), 'kol_2': (-1, 1)}, ol='Kar-1', face='kizgin'),
                    F(sq=1, p={'kol_1': (1, 1), 'kol_2': (-1, 1)}, ol='Kar-1', face='kizgin')],
    }


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
        mk = np.asarray(Image.open(os.path.join(ROOT, f'assets/glemons/kukla/{key}_{stage}_maske.png')).convert('RGB'))
        self.C = self.ic.shape[0]
        self.parts = {}
        for col, name in PART_COL.items():
            m = (mk == np.array(col)).all(2) & (self.ic[..., 3] > 0)
            if m.any():
                self.parts[name] = m
        fx, fy, fw, fh = self.info['yuz_kutusu']
        self.face = (fx, fy, fw, fh)
        self.feet = self.info['ayak']
        self.y_sq = (fy + fh + self.feet) // 2
        self.x_w = fx - 1
        self.k = 1.5 if stage == 'usta' else 1.0
        self.maxsq = 2 if stage == 'usta' else 1
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
                    if 0 <= yy < self.C and 0 <= xx < self.C and g[yy, xx]:
                        pts.append((x, y, dx, dy)); break
            self.attach[n] = pts
        self.glow_family = cfg.get('parla_aile')

    # -- govde donusumleri
    def body(self, sq, lean):
        C = self.C
        g = np.zeros_like(self.ic)
        g[self.parts['govde']] = self.ic[self.parts['govde']]
        y0, xw = self.y_sq, self.x_w
        if sq > 0:
            n = sq
            o = np.zeros_like(g)
            o[n:y0 + n] = g[0:y0]          # y0..y0+n-1 satirlari silinir, ustu asagi kayar
            o[y0 + n:] = g[y0 + n:]
            g = o
            o = g.copy()                     # n sutun genisler (yuzun solunda); sag taraf ve yuz sabit
            o[:, 0:xw - n + 1] = g[:, n:xw + 1]
            for k in range(1, n + 1):
                o[:, xw - k + 1] = g[:, xw]
            o[:, :0] = 0
            g = o
        elif sq < 0:
            m = -sq
            o = np.zeros_like(g)
            o[0:y0 - m + 1] = g[m:y0 + 1]    # y0 satiri m kez tekrar, ustu yukari kayar
            for k in range(m):
                o[y0 - k] = g[y0]
            o[y0 + 1:] = g[y0 + 1:]
            g = o
            o = g.copy()                     # m sutun daralir: sol taraf saga kayar
            o[:, m:xw + 1] = g[:, 0:xw + 1 - m]
            o[:, :m] = 0
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

    def head_disp(self, f):
        return (f.get('lean', 0), f.get('sq', 0))

    def render(self, f, follow, pal=None, glow=False):
        """f: olceklenmis kare tarifi. follow: {parca: (dx,dy)} gecikmeli kafa kaymasi."""
        C = self.C
        sq, lean = f.get('sq', 0), f.get('lean', 0)
        g = self.body(sq, lean)
        hdx, hdy = lean, sq
        canvas = np.zeros_like(g)
        layers = []
        for n, m in self.parts.items():
            if n == 'govde':
                continue
            mx, my = self.mil[n]
            if my < self.y_sq:
                bdx, bdy = follow.get(n, (hdx, hdy))
            else:
                bdx, bdy = 0, 0
            if sq > 0 and mx < self.x_w:
                bdx -= sq
            elif sq < 0 and mx < self.x_w:
                bdx += -sq
            ex = f.get('p', {}).get(n, (0, 0))
            pdx, pdy = bdx + ex[0], bdy + ex[1]
            # govdenin bu parcanin yanindaki kaymasi (ayni kafa kaymasi)
            gdx, gdy = (hdx, hdy) if my < self.y_sq else (0, 0)
            if sq > 0 and mx < self.x_w:
                gdx -= sq
            elif sq < 0 and mx < self.x_w:
                gdx += -sq
            layers.append((n, m, pdx, pdy, gdx, gdy))
        # dolgu: govdeye degen piksel, govdenin yeni yerinden parcanin yeni yerine kadar uzatilir
        for n, m, pdx, pdy, gdx, gdy in layers:
            for x, y, ax, ay in self.attach[n]:
                c = self.ic[y, x]
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
                    if 0 <= px_ < C and 0 <= py_ < C and g[py_, px_, 3] == 0:
                        canvas[py_, px_] = c
        sel = g[..., 3] > 0
        canvas[sel] = g[sel]
        for n, m, pdx, pdy, gdx, gdy in layers:
            ys, xs = np.where(m)
            for y, x in zip(ys, xs):
                X, Y = x + pdx, y + pdy
                if 0 <= X < C and 0 <= Y < C:
                    canvas[Y, X] = self.ic[y, x]
        # butun Glemon kaymasi (tuvalden tasmasin)
        dx, dy = f.get('dx', 0), f.get('dy', 0)
        m = canvas[..., 3] > 0
        ys, xs = np.where(m)
        dx = max(1 - xs.min(), min(C - 2 - xs.max(), dx))
        dy = max(1 - ys.min(), min(C - 3 - ys.max(), dy))
        out = np.zeros_like(canvas)
        x0, x1 = max(0, dx), min(C, C + dx)
        y0, y1 = max(0, dy), min(C, C + dy)
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
                    if xr + k < C:
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


def face_tiles(rig, pal, colors):
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
        GF.stamp(put, rig.info['kalip'], e, g['lx'], g['rx'], g['ey'], cols)
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
    entry = {'v': 2, 'fly': bool(sp.get('ucar')), 'stages': [], 'anims': {}, 'fx': {}}
    outdir = os.path.join(ROOT, 'assets/glemons', key)
    os.makedirs(outdir, exist_ok=True)
    gif_frames = []
    face_prev = []
    for si, stage in enumerate(STAGES):
        rig = Rig(key, stage, cfg)
        C = rig.C
        recipes = frames_for(sp, walk)
        allf, allp, faces = [], [], []
        start = 0
        anims = {}
        for a in ORDER:
            fr = [scale_frame(f, rig.k, rig.maxsq, a) for f in recipes[a]]
            assert len(fr) == len(DURS[a]), a
            fol = follow_offsets(fr, a in LOOP)
            exprs = []
            for f, fo in zip(fr, fol):
                follow = {n: fo for n in FOLLOW}
                im, pos = rig.render(f, follow)
                imp, _ = rig.render(f, follow, pal=pal)
                allf.append(im); allp.append(imp); faces.append(pos)
                exprs.append(f.get('face'))
            an = {'start': start, 'durs': DURS[a]}
            if a in LOOP:
                an['loop'] = True
            if a in HIT:
                an['hit'] = HIT[a]
            if a == 'hazirlik':
                an['loopFrom'] = 1
            if any(exprs):
                an['faces'] = exprs
            anims[a] = an
            start += len(fr)
        n = len(allf)
        rows = (n + COLS - 1) // COLS
        for frames, suf in ((allf, ''), (allp, '_p')):
            sheet = Image.new('RGBA', (C * COLS, C * rows), (0, 0, 0, 0))
            for i, im in enumerate(frames):
                sheet.paste(Image.fromarray(im, 'RGBA'), ((i % COLS) * C, (i // COLS) * C))
            sheet.save(os.path.join(outdir, f'{si}{suf}.png'), optimize=True)
        colors = face_colors(rig.info['ten'])
        tn = face_tiles(rig, None, colors)
        tp = face_tiles(rig, pal, colors)
        fx, fy, fw, fh = rig.face
        ys = Image.new('RGBA', (fw * len(tn), fh * 2), (0, 0, 0, 0))
        for i, (a, b) in enumerate(zip(tn, tp)):
            ys.paste(Image.fromarray(a, 'RGBA'), (i * fw, 0))
            ys.paste(Image.fromarray(b, 'RGBA'), (i * fw, fh))
        ys.save(os.path.join(outdir, f'{si}_yuz.png'), optimize=True)
        face_prev.append(ys)
        ik = Image.new('RGBA', (C * 2, C), (0, 0, 0, 0))
        ik.paste(Image.fromarray(allf[0], 'RGBA'), (0, 0)); ik.paste(Image.fromarray(allp[0], 'RGBA'), (C, 0))
        ik.save(os.path.join(outdir, f'{si}_ikon.png'), optimize=True)
        info = rig.info
        entry['stages'].append({
            'w': C, 'h': C, 'ax': C // 2, 'ay': C - 2, 'bodyW': info['govde_gen'], 'bodyH': C - 2 - info['govde_ust'],
            'n': n, 'cols': COLS, 'face': {'w': fw, 'h': fh, 'pos': faces}, 'kalip': info['kalip']})
        entry['anims'] = anims
        gif_frames.append((stage, allf, allp, anims, faces, tn, rig))
    oz = sp.get('ozel') or {}
    entry['fx'] = {'huy': None, 'saldiri': 'vurus_yildizi', 'ozel': oz.get('fx') or ['vurus_yildizi'],
                   'mutlu': 'kalp', 'uyku': 'z', 'bayilma': 'yildiz', 'nadir': None}
    entry['exprs'] = GF.EXPRS
    allmeta[key] = entry
    txt = json.dumps(allmeta, separators=(',', ':'))   # once metin: hata olursa dosya bozulmaz
    with open(gj, 'w') as fh:
        fh.write(txt)
    preview_gif(key, gif_frames)
    pv = Image.new('RGBA', (max(i.width for i in face_prev) * 6, sum(i.height for i in face_prev) * 6 + 30), (40, 40, 48, 255))
    y = 0
    for im in face_prev:
        b = im.resize((im.width * 6, im.height * 6), Image.NEAREST); pv.paste(b, (0, y), b); y += b.height + 10
    pv.save(os.path.join(ROOT, f'onizleme/{key}_yuz.png'))
    print(key, 'ok', [s['n'] for s in entry['stages']])


def face_colors(sfam):
    cheek = 'Pembe-3' if sfam in ('Pembe', 'Kirmizi', 'Turuncu') else 'Pembe-2'
    return {'#': BP.tone('Murekkep'), 'o': BP.tone('Parilti'), 'i': BP.tone('Mor-2'), 'w': BP.tone('Kar-1'),
            't': BP.tone('Gok-1'), 'm': BP.tone(sfam + '-4'), 'r': BP.tone('Kirmizi-3'), 'cheek': BP.tone(cheek)}


def preview_gif(key, stages):
    """onizleme/<anahtar>_anim.gif: 11 animasyon sirayla, 3 kat, savas arka plani renginde; uc asama yan yana."""
    S = 3
    W = sum(st[6].C for st in stages) * S + 20
    H = max(st[6].C for st in stages) * S + 16
    out = []
    durs = []
    for a in ORDER:
        n = len(DURS[a])
        reps = 2 if a in LOOP else 1
        for r in range(reps):
            for i in range(n):
                fr = Image.new('RGB', (W, H), (58, 70, 84))
                x = 4
                for stage, allf, allp, anims, faces, tn, rig in stages:
                    an = anims[a]
                    idx = an['start'] + i
                    im = Image.fromarray(allf[idx], 'RGBA')
                    ex = (an.get('faces') or [None] * n)[i]
                    if ex and faces[idx]:
                        t = Image.fromarray(tn[GF.EXPRS.index(ex)], 'RGBA')
                        im.paste(t, tuple(faces[idx]), t)
                    im = im.resize((im.width * S, im.height * S), Image.NEAREST)
                    fr.paste(im, (x, H - im.height - 4), im)
                    x += rig.C * S + 6
                out.append(fr)
                durs.append(DURS[a][i])
        blank = out[-1].copy()
        out.append(blank); durs.append(300)
    out[0].save(os.path.join(ROOT, f'onizleme/{key}_anim.gif'), save_all=True, append_images=out[1:], duration=durs, loop=0)


if __name__ == '__main__':
    for k in sys.argv[1:]:
        build(k)
