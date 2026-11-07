"""Glemon sprite ureticisi.

Kullanim: python3 tools/gen_glemons.py assets/glemons [onizleme.png]

Kurallar (Oyun Tasarim Belgesi, bolum 16):
- 1 texel = 2x2 piksel (karakterlerin yuz izgarasi gibi); Usta asamasi 3x3 (daha iri)
- 0.3 (Eren, 2026-11-07): daha fazla ton, soluk renkler. Renkler biraz soldurulur ve
  her parca 1 piksellik isik/golge alir: sol-ust kenar acik, sag-alt kenar koyu,
  govdenin alt kismi hafif koyu. Kucuk parcalar (goz, agiz) duz kalir.
- 1 piksel siyaha yakin dis cizgi (karakterlerin cizgisi gibi)
- Glemonlar onden ya da 3/4 onden sola bakar (savas ekrani oyuncunun sirtindan bakar)
- 0.4: her turun 3 evrim asamasi var: 0 Bebek, 1 Genc (tepede tutam), 2 Usta (tac + iri).
Cikti: her Glemon ve asama icin <asama>.png (ust sira normal, alt sira parlak; butun
animasyonlar yan yana) + glemons.json
"""
import colorsys, json, os, sys
from PIL import Image

ANIMS = ['durma', 'yurume', 'saldiri', 'hasar']
INK = (16, 12, 20, 255)  # karakterlerin siyah cizgisine yakin


def hx(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


def shiny(c, shift=0.38):
    r, g, b, a = c
    if max(r, g, b) - min(r, g, b) < 18:   # siyah/beyaz/gri tonlari koru
        return c
    h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
    r, g, b = colorsys.hls_to_rgb((h + shift) % 1, l, min(1, s * 1.1))
    return (int(r * 255), int(g * 255), int(b * 255), a)


def mirror(half, center_dup=False):
    """Onden bakan simetrik cizimler: sol yarim + aynasi."""
    out = []
    for r in half:
        m = r[::-1]
        out.append(r + (m[1:] if center_dup else m))
    return out


# ---------------------------------------------------------------- texel haritalari
SPECIES = {
    'kutukcuk': {
        'pal': {'m': '#8ccc5e', 'M': '#62a844', 'T': '#f4e0b4', 't': '#dcbf88', 'q': '#d29550',
                'A': '#e4a35c', 'a': '#cc8646', 'b': '#ad6a34', 'w': '#ffffff', 'k': '#100c14',
                'p': '#f4a08c', 'o': '#5a2a14', 'l': '#7a4424'},
        'map': [
            "....mM.m..",
            "...mMmM...",
            "..qTTTTq..",
            ".qTTttTTq.",
            "qTTtTTtTTq",
            "qTTTttTTTq",
            "AAaaaaaaab",
            "AAabaaabab",
            "Awkaaawkab",
            "AkkaaakkAb",
            "ApaaooaApb",
            "AAaaaaaaab",
            "AAabaaabab",
            "AAabaaaaab",
            ".Aaaaabaa.",
            ".ll....ll.",
        ],
        'fx': 'star',
    },
    'patlakmantar': {
        'pal': {'C': '#ec5a4c', 'd': '#c4443a', 'w': '#fff4e4', 'u': '#caa888', 's': '#f4e8cc',
                'S': '#dcc9a0', 'k': '#100c14', 'o': '#5a3a2a', 'p': '#f4a0a0', 'l': '#a8946c'},
        'map': [
            "...CCCC...",
            ".CCwwCCCC.",
            "CCCwwCCwwC",
            "CwwCCCCwwd",
            "dddCCddddd",
            "..uuuuuu..",
            "..ssssSS..",
            "..wkswkS..",
            "..psooSp..",
            "..ssssSS..",
            "..ll..ll..",
        ],
        'fx': 'spores',
    },
    'dikentavsan': {  # 3/4 onden, sola (oyuncuya) donuk
        'pal': {'H': '#a8d880', 'g': '#80b45c', 'G': '#62944a', 'e': '#eca4ac', 't': '#e0cc92',
                'T': '#b09a62', 'c': '#f0eacc', 'w': '#ffffff', 'k': '#100c14', 'p': '#ec8c9c',
                'o': '#5a2a14', 'l': '#4c7434'},
        'map': [
            "..He...He...",
            "..He...He...",
            "..gH...gH.t.",
            ".gHHHHgggtTt",
            "gHwkHHwkggTt",
            "gHkkHHkkgGTT",
            "gpgcccgpgGGt",
            ".gccoccggGG.",
            ".gcccccggGG.",
            "..ccccgggG..",
            "..ll...ll...",
        ],
        'fx': 'thorn',
    },
    'yaprakbocek': {  # 3/4 onden, sola donuk
        'pal': {'a': '#34442a', 'h': '#72a048', 'L': '#78c856', 'v': '#ccf2a4', 'D': '#58a442',
                'k': '#100c14', 'w': '#ffffff', 'o': '#2a3a1c', 'l': '#34442a'},
        'map': [
            ".a...a......",
            "..a.a..LLL..",
            ".hhhhhLLvLD.",
            "hwkhwkLvLLDD",
            "hkkhkkhLLDDD",
            "hhhohhhDDDD.",
            ".hhhhhDDDD..",
            "..l.l..l.l..",
        ],
        'fx': 'leaf',
    },
    'yosunbaba': {
        'pal': {'n': '#9cd466', 'm': '#72b44a', 'h': '#cdcfc6', 's': '#a6a89e', 'S': '#84867c',
                'b': '#f4f4e8', 'k': '#100c14', 'w': '#ffffff', 'l': '#5e6058'},
        'map': [
            "...nmmn...",
            "..nmmmmn..",
            ".shhsssSS.",
            "shbbsbbSSS",
            "shkwskwsSS",
            "ssssssssSS",
            "snmnmmnmmS",
            ".nmmmnmmm.",
            "..mmnmmm..",
            "...mmmm...",
            "..l....l..",
        ],
        'fx': 'heal',
    },
}



# ---------------------------------------------------------------- 0.5 Yanki Magaralari (gri-mor-mavi)
SPECIES.update({
    'micir': {  # yuzu olan cakil topu
        'pal': {'h': '#c4c0cc', 'g': '#a8a4b0', 'G': '#8c8896', 's': '#6e6a7a', 'k': '#100c14',
                'w': '#ffffff', 'o': '#3a2a2a', 'l': '#4e4a58'},
        'map': [
            "...gGGg...",
            ".gGGGGGGg.",
            "gGGhGGGGGs",
            "GGwkGGwkGs",
            "GGkkGGkkss",
            "GGGGooGGss",
            ".sGGGGGss.",
            "..ssssss..",
            "..l....l..",
        ],
        'fx': 'slam', 'accent': '#9c6cd0',
    },
    'taskabuk': {  # tas kabuklu kaplumbaga, sola donuk
        'pal': {'h': '#9cae8c', 'S': '#8a8696', 's': '#a6a2b0', 'd': '#5e5a6a', 'k': '#100c14',
                'w': '#ffffff', 'o': '#3a2a2a', 'l': '#6c7c60'},
        'map': [
            ".....SSSS...",
            "...SSsSSsS..",
            "..SsSSSSSsS.",
            ".hhSSsSSSSSS",
            "hwkhdddddddd",
            "hkkhhhhhhhh.",
            "hhohhhhhhhh.",
            ".l..l..l..l.",
        ],
        'fx': 'star', 'accent': '#7cb4d8',
    },
    'pirpir': {  # fener gozlu yarasa (ucar)
        'pal': {'W': '#5a4e72', 'a': '#7a6e94', 'y': '#f4e070', 'o': '#2a2030', 'f': '#f4f0e8', 'k': '#100c14'},
        'map': [
            "...a...a...",
            "...aa.aa...",
            "W..aaaaa..W",
            "WW.ayaya.WW",
            "WWWaaaaaWWW",
            "WWWaofoaWWW",
            ".WWWaaaWWW.",
            "..W.....W..",
        ],
        'fx': 'wave', 'fly': True, 'accent': '#f4e070',
    },
    'kristalbocek': {  # sirtinda kristal olan bocek, sola donuk
        'pal': {'c': '#9cc8e8', 'C': '#c8e6f8', 'v': '#f0faff', 'h': '#6a6488', 'D': '#4e4868',
                'a': '#3a3448', 'k': '#100c14', 'w': '#ffffff', 'o': '#2a2030', 'l': '#3a3448'},
        'map': [
            "......c.....",
            ".a...cCc....",
            "..a.cCCvc...",
            ".hhhcCvCCc..",
            "hwkhhcccDDD.",
            "hkkhhhhDDDDD",
            "hhhohhhDDDD.",
            ".hhhhhhDDD..",
            "..l.l..l.l..",
        ],
        'fx': 'beam', 'accent': '#c8e6f8',
    },
    'ametist_kirpi': {  # mor kristal dikenli kirpi, sola donuk
        'pal': {'P': '#9a6cc8', 'p': '#c8a0ec', 'f': '#d4b8a0', 'k': '#100c14', 'w': '#ffffff',
                'o': '#3a2028', 'l': '#8a6a54'},
        'map': [
            "....P.P.P...",
            "...PpPpPpP..",
            "..PpPpPpPpP.",
            ".fPpPpPpPpPP",
            "ffwkfPpPpPpP",
            "ffkkffPpPpP.",
            "fofffffffff.",
            ".fffffffff..",
            "..l.l...l.l.",
        ],
        'fx': 'thorn', 'fxcol': ('#c8a0ec', '#7a4ca8'), 'accent': '#e4c8ff',
    },
})

# ---------------------------------------------------------------- 0.5 Kavurucu Col (kum-turuncu)
SPECIES.update({
    'kumkiskic': {  # kum renkli akrep, kuyrugu yukarida
        'pal': {'c': '#c89858', 'b': '#dcb478', 'B': '#b8905a', 't': '#c4a06a', 's': '#8a5aa0',
                'k': '#100c14', 'w': '#ffffff', 'l': '#8a6a40'},
        'map': [
            "........tt..",
            ".........ts.",
            "..........t.",
            "cc....bbbbt.",
            "c.cbbbbbbbb.",
            "ccbwkbwkbbb.",
            ".cbkkbkkbB..",
            "..bbbbbbbB..",
            ".l.l.l.l.l..",
        ],
        'fx': 'thorn', 'fxcol': ('#b88ad0', '#6a3a80'), 'accent': '#8a5aa0',
    },
    'kaktus_bekcisi': {  # cicek sapkali kaktus
        'pal': {'r': '#d86a7a', 'R': '#ec96a4', 'y': '#f0d070', 'g': '#5e9a5a', 'G': '#7ab46a',
                'p': '#c8a070', 'k': '#100c14', 'w': '#ffffff', 'o': '#2a3a1c', 'l': '#8a6a40'},
        'map': [
            "...rRRr...",
            "..rRyyRr..",
            "...gGGg...",
            "..gGGGGg..",
            "g.wkGGwk.g",
            "g.kkGGkk.g",
            "gggGooGggg",
            "..gGGGGg..",
            "..gGGGGg..",
            "..pppppp..",
            "...l..l...",
        ],
        'fx': 'thorn', 'fxcol': ('#b4dc8c', '#4e7a3a'), 'accent': '#ec96a4',
    },
    'toz_kertenkelesi': {  # kum firlatan kertenkele, sola donuk
        'pal': {'h': '#d8b070', 'S': '#c89a5c', 's': '#a8784a', 't': '#b08850', 'k': '#100c14',
                'w': '#ffffff', 'o': '#4a2a14', 'l': '#8a6038'},
        'map': [
            ".hhhh........",
            "hwkhhh.......",
            "hkkhhhSsSS...",
            "hohhhSSSSsS..",
            ".hhhSSsSSSSt.",
            "...SSSSSSSStt",
            ".l..l...l..l.",
        ],
        'fx': 'spores', 'fxcol': ('#e8d098', '#c8a060'), 'accent': '#e07a3a',
    },
    'sargicik': {  # sargilara sarili kucuk kedi
        'pal': {'b': '#e4dcc4', 'B': '#bfb49a', 'e': '#cbbf9f', 'g': '#8ae070', 'w': '#ffffff',
                'p': '#c88a8a', 'k': '#100c14', 'l': '#a89c80'},
        'map': [
            ".e......e.",
            ".ee....ee.",
            ".bBbBbBbb.",
            "bBwgbbwgBb",
            "bbggbBggbb",
            "bBbbppbbBb",
            ".bBbbbBbb.",
            ".bbBbbbBb.",
            "..bBbbBb..",
            "..l....l..",
        ],
        'fx': 'spores', 'fxcol': ('#b88ad0', '#8ae070'), 'accent': '#8ae070',
    },
    'altin_skarabe': {  # parlak altin bocek, sola donuk
        'pal': {'Y': '#e8c050', 'y': '#fff0a0', 'O': '#b88a30', 'h': '#a07a34', 'a': '#5a4420',
                'k': '#100c14', 'w': '#ffffff', 'o': '#3a2410', 'l': '#5a4420'},
        'map': [
            ".a....a.....",
            "..a..a.YYY..",
            ".hhhhhYyYYY.",
            "hwkhwkYYyYYO",
            "hkkhkkhYYYOO",
            "hhhohhhYYOO.",
            ".hhhhhhOOO..",
            "..l.l..l.l..",
        ],
        'fx': 'star', 'accent': '#fff0a0',
    },
})

# ilk turlerin evrim rengi
for _k, _a in {'kutukcuk': '#8ccc5e', 'patlakmantar': '#ec5a4c', 'dikentavsan': '#eca4ac',
               'yaprakbocek': '#b4ea86', 'yosunbaba': '#f0d070'}.items():
    SPECIES[_k]['accent'] = _a


# ---------------------------------------------------------------- patronlar
def boss_golem():
    """Tas Golemi (Magara 20. kat): kristal gozlu, kocaman yumruklu tas dev."""
    half = [
        "........GGGG",
        ".......GgggG",
        "......GgGGGG",
        "......GgkYGG",
        "......GgkkGG",
        "......GGGGGo",
        ".......GGGGG",
        "...SSS..GGGG",
        "..SssSSGGGGG",
        ".SssSSGGgGGc",
        ".SsSSGGgGGcC",
        ".SSS.GgGGGGc",
        "SSSS.GgGGGGG",
        "SsSS.GgGGGGG",
        "SSSS.GGGGGGG",
        ".SS..GGGGGGG",
        "......GGGGGG",
        "......ddd...",
        ".....dddd...",
        ".....dddd...",
        "....lllll...",
    ]
    pal = {'G': '#8a8696', 'g': '#a8a4b2', 'S': '#76727f', 's': '#9894a4', 'Y': '#ecd4ff',
           'k': '#100c14', 'o': '#2a2430', 'c': '#9c6cd0', 'C': '#d0b0f4', 'd': '#6a6674', 'l': '#5a5664'}
    return {'pal': pal, 'map': mirror(half), 'fx': 'slam', 'boss': True}


def boss_cakal():
    """Firtina Cakali (Col 30. kat): oturan, sivri kulakli cakal; kumdan kuyrugu."""
    half = [
        "..e......",
        "..ee.....",
        "..eEe....",
        "..eEEe...",
        "..eeccccc",
        "...cccccc",
        "..cwkcccc",
        "..ckkcccc",
        "...cccccc",
        "....cccmm",
        "....ccmMo",
        ".....cmmm",
        "....bbbbb",
        "...bbbBBB",
        "..bbbBBBB",
        "..bbbBBBB",
        "..bbbbBBB",
        "..bbbbbbb",
        "..ddb.bbb",
        "..dd..bbb",
        "..ll...ll",
    ]
    rows = [list(r + '....') for r in mirror(half)]
    # govdenin sagindan kivrilip yukari kalkan kumdan kuyruk
    for y, x, c in [(17, 16, 't'), (16, 16, 't'), (16, 17, 't'), (15, 17, 't'), (15, 18, 'T'), (14, 18, 't'),
                    (14, 19, 'T'), (13, 19, 't'), (13, 20, 'T'), (12, 20, 'T'), (11, 20, 'T')]:
        rows[y][x] = c
    rows = [''.join(r) for r in rows]
    pal = {'e': '#c88a4a', 'E': '#e8b49a', 'c': '#d49a54', 'm': '#ecd8b0', 'M': '#e0c49a',
           'o': '#3a2418', 'b': '#c08446', 'B': '#e4c48e', 'd': '#a86c38', 'l': '#7a4a24',
           'k': '#100c14', 'w': '#ffffff', 't': '#b87a3e', 'T': '#ecd8b0'}
    return {'pal': pal, 'map': rows, 'fx': 'wind', 'boss': True, 'ts': 3}


def boss_agacbasi():
    """Agacbasi: tepesi yaprak, govdesi kizgin yuzlu kutuk, dal kollu dev agac."""
    W, H = 26, 34
    grid = [['.'] * W for _ in range(H)]
    # yaprak taci (elips): ust sira acik, alt ve sag koyu, duz bantlar
    cx, cy, rx, ry = 13, 8, 12.5, 8.5
    for y in range(H):
        for x in range(W):
            d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2
            if d <= 1:
                grid[y][x] = 'L2'
    for y in range(H):
        for x in range(W):
            if grid[y][x] != 'L2':
                continue
            if y == 0 or grid[y - 1][x] == '.' or (y < 6 and x < 9):
                grid[y][x] = 'L1'
            elif y >= 13 or (x >= 20 and y >= 7):
                grid[y][x] = 'L3'
    # birkac yaprak kumesi cizgisi (duzenli)
    for x, y in [(6, 6), (7, 6), (15, 4), (16, 4), (19, 9), (20, 9), (4, 11), (5, 11), (11, 11), (12, 11)]:
        grid[y][x] = 'L3'
    # govde
    for y in range(12, 31):
        for x in range(7, 19):
            if (y < 14 and (x < 8 or x > 17)):
                continue
            t = 'B1' if x <= 8 else ('B3' if x >= 16 else 'B2')
            if x in (10, 14) and (y // 2) % 2 == 0 and y > 20:
                t = 'B3'
            grid[y][x] = t
    # dal kollar
    for i, (x, y) in enumerate([(6, 19), (5, 18), (4, 18), (3, 17), (2, 16), (2, 15), (1, 14)]):
        grid[y][x] = 'B1'
        if i % 2 == 0:
            grid[y + 1][x] = 'B3'
    for i, (x, y) in enumerate([(19, 19), (20, 18), (21, 18), (22, 17), (23, 16), (23, 15), (24, 14)]):
        grid[y][x] = 'B2'
        if i % 2 == 0:
            grid[y + 1][x] = 'B3'
    grid[13][1] = 'L2'; grid[13][24] = 'L2'; grid[12][1] = 'L1'; grid[13][0] = 'L3'
    # yuz: kas, goz, agiz
    for x, y in [(9, 16), (10, 17), (16, 16), (15, 17)]:
        grid[y][x] = 'k'
    for x in (10, 11):
        grid[18][x] = 'Y'
    grid[19][10] = 'Y'; grid[19][11] = 'k'
    for x in (14, 15):
        grid[18][x] = 'Y'
    grid[19][15] = 'Y'; grid[19][14] = 'k'
    for x in range(10, 16):
        grid[23][x] = 'o'
    for x in (10, 12, 14):
        grid[22][x] = 'o'
    for x in (11, 13, 15):
        grid[24][x] = 'o'
    grid[23][11] = 'w'; grid[23][14] = 'w'
    # kokler (bacaklar)
    legs = [(7, 31), (8, 31), (6, 32), (7, 32), (5, 33), (6, 33), (17, 31), (18, 31), (18, 32), (19, 32), (19, 33), (20, 33)]
    for x, y in legs:
        grid[y][x] = 'l'
    pal = {'L1': '#90d462', 'L2': '#6cb84a', 'L3': '#4e963a', 'B1': '#b0743e',
           'B2': '#94603a', 'B3': '#74482a', 'k': '#100c14', 'Y': '#ffd34d',
           'o': '#2e160a', 'w': '#f4ecd8', 'l': '#64381c'}
    keymap = {k: chr(65 + i) for i, k in enumerate(pal)}
    keymap['l'] = 'l'
    rows = [''.join('.' if c == '.' else keymap[c] for c in r) for r in grid]
    return {'pal': {keymap[k]: v for k, v in pal.items()}, 'map': rows, 'fx': 'slam', 'boss': True}


SPECIES['agacbasi'] = boss_agacbasi()
SPECIES['tas_golemi'] = boss_golem()
SPECIES['firtina_cakali'] = boss_cakal()


# ---------------------------------------------------------------- evrim (0.4)
def lighten(h, f=1.3):
    c = hx(h)
    return '#%02x%02x%02x' % tuple(min(255, int(v * f + 20)) for v in c[:3])


def evolve(sp, stage):
    """Genc: tepede renkli bir tutam. Usta: tacli (ortada altin tas). Cizim yukari buyur."""
    if stage == 0:
        return sp
    rows = sp['map']
    w = len(rows[0])
    top = rows[0]
    xs = [i for i, c in enumerate(top) if c != '.']
    cx = (xs[0] + xs[-1]) // 2 if xs else w // 2
    # evrim parcalari turun kendi harfleriyle karismasin diye rakamla yazilir
    add = [".1.", "121"] if stage == 1 else ["1.1.1", "12321"]
    pal = dict(sp['pal'])
    pal['1'] = sp.get('accent', '#f0d070')
    pal['2'] = lighten(pal['1'])
    pal['3'] = '#ffd34d'
    aw = len(add[0])
    ox = max(0, min(w - aw, cx - aw // 2))
    new = []
    for r in add:
        line = ['.'] * w
        for i, ch in enumerate(r):
            if ch != '.':
                line[ox + i] = ch
        new.append(''.join(line))
    out = dict(sp)
    out['pal'] = pal
    out['map'] = new + rows
    out['ts'] = 3 if stage == 2 else 2
    return out


# ---------------------------------------------------------------- cizim
def texel_layer(rows, pal, only=None, skip=None, shiny_on=False, ts=2):
    px = {}
    for ty, row in enumerate(rows):
        for tx, ch in enumerate(row):
            if ch == '.' or (only and ch not in only) or (skip and ch in skip):
                continue
            c = hx(pal[ch])
            if shiny_on:
                c = shiny(c)
            for dy in range(ts):
                for dx in range(ts):
                    px[(tx * ts + dx, ty * ts + dy)] = c
    return px


def outlined(px):
    out = dict(px)
    for (x, y), c in px.items():
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in px:
                out[n] = INK
    return out


def mute(c):
    r, g, b, a = c
    l = 0.3 * r + 0.59 * g + 0.11 * b
    return tuple(int(max(0, min(255, (v + (l - v) * 0.18) * 0.94))) for v in (r, g, b)) + (a,)


def mulc(c, f):
    return tuple(int(max(0, min(255, v * f))) for v in c[:3]) + (c[3],)


def shaded(px):
    if not px:
        return px
    ys = [y for _, y in px]
    y0, y1 = min(ys), max(ys)
    # ayni renkli bitisik bolgelerin boyu (kucuk parcalar golgelenmez)
    seen, size = set(), {}
    for k in px:
        if k in seen:
            continue
        stack, comp = [k], []
        seen.add(k)
        while stack:
            q = stack.pop(); comp.append(q)
            for n in ((q[0] + 1, q[1]), (q[0] - 1, q[1]), (q[0], q[1] + 1), (q[0], q[1] - 1)):
                if n in px and n not in seen and px[n] == px[k]:
                    seen.add(n); stack.append(n)
        for q in comp:
            size[q] = len(comp)
    out = {}
    for (x, y), c in px.items():
        c2 = mute(c)
        if size[(x, y)] >= 24 and sum(c[:3]) > 90:
            if (x - 1, y) not in px or (x, y - 1) not in px:
                c2 = mulc(c2, 1.12)
            elif (x + 1, y) not in px or (x, y + 1) not in px or (x + 2, y) not in px:
                c2 = mulc(c2, 0.8)
            elif y1 > y0 and (y - y0) / (y1 - y0) > 0.72:
                c2 = mulc(c2, 0.9)
        out[(x, y)] = c2
    return out


def render(size, parts, flash=False):
    parts = [(shaded(pix) if i < 3 else pix, ox, oy) for i, (pix, ox, oy) in enumerate(parts)]
    cw, ch = size
    img = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
    p = img.load()
    for pix, ox, oy in parts:
        for (x, y), c in outlined(pix).items():
            X, Y = x + ox, y + oy
            if 0 <= X < cw and 0 <= Y < ch:
                if flash and sum(c[:3]) > 120:
                    c = tuple(min(255, v + 150) for v in c[:3]) + (255,)
                p[X, Y] = c
    return img


def fx_pixels(kind, t, h, fxcol=None):
    pts = {}
    mid = h // 2
    if kind == 'star' and t in (2, 3):
        col = hx('#ffe14d')
        x, y = -3, mid - 2
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0), (0, 2), (0, -2)):
            pts[(x + dx, y + dy)] = col
        if t == 3:
            pts[(x - 3, y - 3)] = col
            pts[(x - 3, y + 3)] = col
    elif kind == 'spores' and t >= 2:
        col, col2 = (hx(fxcol[0]), hx(fxcol[1])) if fxcol else (hx('#c9e05a'), hx('#8fb33a'))
        d = (t - 2) * 4
        for i, (sx, sy) in enumerate(((-2, 4), (-4, 8), (-1, 1), (-5, 5), (-3, 11))):
            c = col if i % 2 else col2
            pts[(sx - d - (i % 2), sy + (i % 3) - 1)] = c
            pts[(sx - d - (i % 2) - 1, sy + (i % 3) - 1)] = c
    elif kind == 'thorn' and t >= 2:
        col, col2 = (hx(fxcol[0]), hx(fxcol[1])) if fxcol else (hx('#d9c48a'), hx('#9c8550'))
        d = (t - 2) * 7
        for dx in range(5):
            pts[(-4 - d + dx, mid - 3)] = col
        pts[(-5 - d, mid - 3)] = col2
    elif kind == 'leaf' and t >= 2:
        d = (t - 2) * 7
        col, col2 = hx('#6cc24a'), hx('#b4ea86')
        for yy, r in enumerate([" XXX ", "XvvvX", " XXX "]):
            for xx, chh in enumerate(r):
                if chh != ' ':
                    pts[(-7 - d + xx, 5 + yy)] = col2 if chh == 'v' else col
    elif kind == 'heal' and t >= 2:
        col = hx('#9df07a')
        for i in range(4):
            x, y = 2 + i * 4, -2 - (t - 2) * 3 - (i % 2) * 2
            for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1)):
                pts[(x + dx, y + dy)] = col
    elif kind == 'slam' and t in (2, 3):
        col, col2 = hx('#8a8696'), hx('#ffe14d')
        for i in range(8):
            pts[(-6 - i, h - 2 - (i % 3))] = col
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0)):
            pts[(-12 + dx, h - 6 + dy)] = col2
    elif kind == 'wave' and t >= 2:
        col = hx('#f4e070')
        d = (t - 2) * 4
        for r in (3, 6):
            for yy in range(-r, r + 1):
                xx = -int((r * r - yy * yy) ** 0.5)
                pts[(xx - 3 - d, mid + yy)] = col
    elif kind == 'beam' and t >= 2:
        col, col2 = hx('#c8e6f8'), hx('#f0faff')
        L = 6 + (t - 2) * 6
        for dx in range(L):
            pts[(-2 - dx, mid - 4)] = col
            pts[(-2 - dx, mid - 3)] = col2
            pts[(-2 - dx, mid - 2)] = col
    elif kind == 'wind' and t >= 2:
        col, col2 = hx('#e8d098'), hx('#c8a060')
        d = (t - 2) * 5
        for i in range(10):
            pts[(-4 - d - (i * 3) % 9, 6 + (i * 7) % (h - 8))] = col if i % 2 else col2
    return pts


def frames_for(sp, shiny_on):
    rows, pal = sp['map'], sp['pal']
    ts = sp.get('ts', 2)
    w, h = len(rows[0]) * ts, len(rows) * ts
    fly = sp.get('fly')
    lift = 8 if fly else 0
    pad_l = 20 if sp.get('boss') else 16
    cw, ch = w + pad_l + 6, h + 6 + lift + (2 if fly else 0)
    body = texel_layer(rows, pal, skip='l', shiny_on=shiny_on, ts=ts)
    legs_rows = [r if 'l' in r else '.' * len(r) for r in rows]
    legs = texel_layer(legs_rows, pal, only='l', shiny_on=shiny_on, ts=ts)
    legL = {k: v for k, v in legs.items() if k[0] < w // 2}
    legR = {k: v for k, v in legs.items() if k[0] >= w // 2}
    bx, by = pad_l, ch - h - 2 - lift

    def f(dx=0, bob=0, lup=0, rup=0, t=-1, flash=False):
        if fly:
            bob = bob * 2  # kanat cirpar gibi daha cok iner kalkar
        parts = [(legL, bx + dx, by - lup), (legR, bx + dx, by - rup), (body, bx + dx, by + bob)]
        if t >= 0:
            parts.append((fx_pixels(sp['fx'], t, h, sp.get('fxcol')), bx + dx, by + bob))
        return render((cw, ch), parts, flash)

    anims = {
        'durma': [(f(), 500), (f(bob=1), 500)],
        'yurume': [(f(lup=1), 160), (f(bob=1), 160), (f(rup=1), 160), (f(bob=1), 160)],
        'saldiri': [(f(dx=2), 180), (f(dx=3, bob=1), 120), (f(dx=-3, t=2), 90),
                    (f(dx=-4, t=3), 110), (f(dx=-2, t=4), 120), (f(), 200)],
        'hasar': [(f(dx=2, flash=True), 90), (f(dx=3), 110), (f(dx=1, flash=True), 90), (f(), 250)],
    }
    # ay: zeminde durdugu nokta (ucanlar havada, golgesi zeminde)
    meta = {'w': cw, 'h': ch, 'ax': bx + w // 2, 'ay': ch - 2, 'bodyW': w, 'bodyH': h + lift}
    return anims, meta


def main(out, preview=None):
    os.makedirs(out, exist_ok=True)
    allmeta = {}
    sheets = []
    for key, base in SPECIES.items():
        d = os.path.join(out, key)
        os.makedirs(d, exist_ok=True)
        for old in os.listdir(d):
            os.remove(os.path.join(d, old))
        info = {'stages': [], 'anims': {}, 'fly': bool(base.get('fly'))}
        for stage in ((0,) if base.get('boss') else (0, 1, 2)):
            sp = evolve(base, stage)
            rows_img = []
            meta = None
            for sh in (False, True):
                anims, meta = frames_for(sp, sh)
                frames = [im for a in ANIMS for im, _ in anims[a]]
                rows_img.append(frames)
                if not sh:
                    sheets.append(anims['durma'][0][0])
                    start = 0
                    for a in ANIMS:
                        info['anims'][a] = {'start': start, 'durs': [dur for _, dur in anims[a]]}
                        start += len(anims[a])
            n = len(rows_img[0])
            sheet = Image.new('RGBA', (meta['w'] * n, meta['h'] * 2), (0, 0, 0, 0))
            for r, frames in enumerate(rows_img):
                for i, im in enumerate(frames):
                    sheet.paste(im, (i * meta['w'], r * meta['h']))
            sheet.save(os.path.join(d, f'{stage}.png'), optimize=True)
            meta['n'] = n
            info['stages'].append(meta)
        allmeta[key] = info
    with open(os.path.join(out, 'glemons.json'), 'w') as fh:
        json.dump(allmeta, fh, separators=(',', ':'))
    if preview:
        W = sum(s.width for s in sheets) + 4 * len(sheets)
        H = max(s.height for s in sheets)
        pv = Image.new('RGBA', (W, H), (200, 220, 200, 255))
        x = 0
        for s in sheets:
            pv.paste(s, (x, H - s.height), s)
            x += s.width + 4
        pv.resize((W * 3, H * 3), Image.NEAREST).save(preview)
    print('ok', list(allmeta))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
