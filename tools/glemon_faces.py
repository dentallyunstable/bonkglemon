"""Glemon yuz kaliplari ve 12 ifade (Glemon Yenileme Plani v2, bolum 4).

Karakterler:  # Murekkep   o Parilti   i Mor-2 (kucuk yansima)   w Kar-1 (saskin halkasi)
              t Gok-1 (gozyasi)   . bos (alttaki ten rengi gorunur)
Agiz:         m tenin 4. tonu   r Kirmizi-3 (acik agiz ici)   . bos
Her ifade = (sol goz, sag goz, agiz, goz_dx). Sol goz ekranda soldaki gozdur.
Yanaklar her ifadede ayni yerde durur (bolum 4.2).
"""

EXPRS = ['normal', 'yarim', 'kapali', 'mutlu', 'kizgin', 'aci', 'saskin', 'baygin',
         'sersem', 'uzgun', 'bak_sol', 'bak_sag', 'esneme', 'isir']
# 2026-11-21: esneme (H5/H7/A9: kapali goz + acik agiz) ve isir (A4: kizgin goz + acik agiz) sona eklendi;
# eski yuz sayfalari (12 ifade) bozulmaz, oyun her turun kendi exprs listesini kullanir.
EYE_ALIAS = {'esneme': 'kapali', 'isir': 'kizgin'}

# ---------------------------------------------------------------- K (4x5) Bebek, Genc
K = {
    'normal': ['.##.', '#oo#', '#o##', '####', '.##.'],
    'yarim':  ['....', '....', '####', '#o##', '.##.'],
    'kapali': ['....', '....', '####', '#..#', '....'],
    'mutlu':  ['....', '.##.', '#..#', '#..#', '....'],
    'kizgin_l': ['#...', '##..', '#o##', '####', '.##.'],
    'kizgin_r': ['...#', '..##', '#o##', '####', '.##.'],
    'aci_l':  ['#...', '.##.', '..##', '.##.', '#...'],
    'aci_r':  ['...#', '.##.', '##..', '.##.', '...#'],
    'saskin': ['.ww.', 'wo#w', 'w##w', 'w##w', '.ww.'],
    'baygin': ['#..#', '.##.', '.##.', '#..#', '....'],
    'sersem': ['.##.', '#..#', '#.##', '#...', '.###'],
    'uzgun':  ['.##.', '#oo#', '#oo#', '####', '.##.'],
}
# ---------------------------------------------------------------- O (5x6) Usta
O = {
    'normal': ['.###.', '#oo##', '#oo##', '#####', '###i#', '.###.'],
    'yarim':  ['.....', '.....', '#####', '#o###', '###i#', '.###.'],
    'kapali': ['.....', '.....', '#####', '#...#', '.....', '.....'],
    'mutlu':  ['.....', '.###.', '#...#', '#...#', '.....', '.....'],
    'kizgin_l': ['#....', '##...', '#o###', '#oo##', '###i#', '.###.'],
    'kizgin_r': ['....#', '...##', '#o###', '#oo##', '###i#', '.###.'],
    'aci_l':  ['#....', '.##..', '..###', '.##..', '#....', '.....'],
    'aci_r':  ['....#', '..##.', '###..', '..##.', '....#', '.....'],
    'saskin': ['.www.', 'wo##w', 'w###w', 'w###w', 'w#i#w', '.www.'],
    'baygin': ['#...#', '.#.#.', '..#..', '.#.#.', '#...#', '.....'],
    'sersem': ['.###.', '#...#', '#.#.#', '#.###', '#....', '.####'],
    'uzgun':  ['.###.', '#ooo#', '#ooo#', '#####', '###i#', '.###.'],
}
# ---------------------------------------------------------------- B (7x8) patron
B = {
    'normal': ['..###..', '.#####.', '#ooo###', '#ooo###', '#######', '#####i#', '.#####.', '..###..'],
    'yarim':  ['.......', '.......', '.......', '#######', '#oo####', '#####i#', '.#####.', '..###..'],
    'kapali': ['.......', '.......', '.......', '.......', '#.....#', '.#####.', '.......', '.......'],
    'mutlu':  ['.......', '.......', '..###..', '.#...#.', '#.....#', '.......', '.......', '.......'],
    'kizgin_l': ['#......', '###....', '#oo###.', '#oo####', '#######', '#####i#', '.#####.', '..###..'],
    'kizgin_r': ['......#', '....###', '.#oo###', '#oo####', '#######', '#####i#', '.#####.', '..###..'],
    'aci_l':  ['#......', '.##....', '...##..', '.....##', '...##..', '.##....', '#......', '.......'],
    'aci_r':  ['......#', '....##.', '..##...', '##.....', '..##...', '....##.', '......#', '.......'],
    'saskin': ['..www..', '.w###w.', 'wooo##w', 'wooo##w', 'w#####w', 'w####iw', '.w###w.', '..www..'],
    'baygin': ['#.....#', '.#...#.', '..#.#..', '...#...', '..#.#..', '.#...#.', '#.....#', '.......'],
    'sersem': ['.#####.', '#.....#', '#.###.#', '#.#.#.#', '#.#...#', '#.#####', '#......', '.######'],
    'uzgun':  ['..###..', '.#ooo#.', '#ooooo#', '#ooo###', '#######', '#####i#', '.#####.', '..###..'],
}

# agiz kaliplari (ortalanir). K/O ayni agzi kullanir; patron 1 piksel genis.
MOUTH = {
    'normal': ['mm'],
    'yarim':  ['mm'],
    'kapali': ['mm'],
    'mutlu':  ['m.m', '.m.'],
    'kizgin': ['mmm'],
    'aci':    ['mm', 'rr'],
    'saskin': ['mm', 'mm'],
    'baygin': ['m.m.', '.m.m'],
    'sersem': ['.m.m', 'm.m.'],
    'uzgun':  ['.m.', 'm.m'],
    'bak_sol': ['mm'],
    'bak_sag': ['mm'],
    'esneme': ['mm', 'rr'],
    'isir':   ['mmm', 'rrr'],
}

TEMPLATES = {'K': K, 'O': O, 'B': B}
SIZE = {'K': (4, 5), 'O': (5, 6), 'B': (7, 8)}
CHEEK = {'K': (2, 1), 'O': (3, 2), 'B': (4, 2)}
GAP = {'K': (4, 6), 'O': (5, 7), 'B': (7, 10)}   # goz arasi bosluk (1 - 1.5 goz genisligi)


def eyes(kalip, expr):
    """(sol, sag, dx) goz desenleri."""
    t = TEMPLATES[kalip]
    expr = EYE_ALIAS.get(expr, expr)
    if expr in ('bak_sol', 'bak_sag'):
        e = t['normal']
        return e, e, (-1 if expr == 'bak_sol' else 1)
    if expr + '_l' in t:
        return t[expr + '_l'], t[expr + '_r'], 0
    e = t.get(expr, t['normal'])
    return e, e, 0


def layout(kalip, lx, rx, ey):
    """Goz konumlarindan yuz kutusu: (x, y, w, h) ve ogelerin kutu ici konumlari."""
    ew, eh = SIZE[kalip]
    cw, ch = CHEEK[kalip]
    cheeks = [(lx - 1, ey + eh, cw, ch), (rx + ew - cw + 1, ey + eh, cw, ch)]
    mx = (lx + ew + rx) / 2.0           # iki gozun ortasi (kesirli olabilir)
    my = ey + eh                        # gozlerin alt kenarindan bir satir asagi
    x0 = min(lx - 1, cheeks[0][0]) - 1 - 1     # bak_sol icin 1 piksel pay
    x1 = max(rx + ew, cheeks[1][0] + cw) + 1 + 1
    y0 = ey - 1
    y1 = max(ey + eh + ch, my + 2) + 1
    return {'box': (x0, y0, x1 - x0, y1 - y0), 'cheeks': cheeks, 'mouth': (mx, my)}


def stamp(px, kalip, expr, lx, rx, ey, colors, skip_mouth=False):
    """px: dict/2B erisim set(x,y,renk). colors: {'#','o','i','w','t','m','r','cheek'} -> renk.
    Yanaklar, agiz ve gozler basilir. '.' dokunulmaz."""
    el, er, dx = eyes(kalip, expr)
    lay = layout(kalip, lx, rx, ey)
    for (cx, cy, cw, ch) in (lay['cheeks'] if colors.get('cheek') is not None else []):
        for yy in range(ch):
            for xx in range(cw):
                px(cx + xx, cy + yy, colors['cheek'])
    for pat, ox in (((el, lx), (er, rx)) if lx != rx else ((el, lx),)):   # lx == rx: tek goz
        for yy, row in enumerate(pat):
            for xx, c in enumerate(row):
                if c != '.':
                    px(ox + xx + dx, ey + yy, colors[c])
    if expr == 'uzgun':                  # gozyasi
        px(lx + 1, ey + SIZE[kalip][1], colors['t'])
        px(rx + 1, ey + SIZE[kalip][1], colors['t'])
    if not skip_mouth:
        m = MOUTH[expr]
        mw = len(m[0])
        mx = int(round(lay['mouth'][0] - mw / 2.0))
        for yy, row in enumerate(m):
            for xx, c in enumerate(row):
                if c != '.':
                    px(mx + xx, lay['mouth'][1] + yy, colors[c])
    return lay
