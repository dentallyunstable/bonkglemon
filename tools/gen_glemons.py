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



# ---------------------------------------------------------------- 0.8 Donmus Zirve (buz-mavi)
SPECIES.update({
    'kar_penguen': {  # atkili tombul penguen yavrusu, sola donuk
        'pal': {'n': '#3a4a6a', 'N': '#2a3450', 'b': '#eef6fc', 'o': '#f0a040', 's': '#d85a5a',
                'k': '#100c14', 'w': '#ffffff', 'l': '#f0a040'},
        'map': [
            "...nnnn...",
            "..nnnnnnn.",
            ".nbwknnnn.",
            "onbkknnnnn",
            "oosssssnnn",
            ".nbbbbbnnn",
            ".nbbbbbnnN",
            "..bbbbbnN.",
            "...l..l...",
        ],
        'fx': 'beam', 'accent': '#d85a5a',
    },
    'kiragi_tilki': {  # buz rengi, kar kuyruklu tilki
        'pal': {'f': '#c8dcec', 'e': '#8ab0d0', 'T': '#f4fbff', 't': '#a8c8e4', 'm': '#ffffff',
                'o': '#2a3450', 'k': '#100c14', 'w': '#ffffff', 'l': '#8ab0d0'},
        'map': [
            ".e..e........",
            ".ee.ee.......",
            "fffffff....TT",
            "fwkffwkf..TtT",
            "fkkffkkf..Tt.",
            "offfffffffTt.",
            ".mmffffffff..",
            "..fffffffff..",
            "..l..l..l..l.",
        ],
        'fx': 'thorn', 'fxcol': ('#e8f4fc', '#8ab0d0'), 'accent': '#9cc8e8',
    },
    'buzcuk': {  # kristal tepeli buz topu
        'pal': {'i': '#9cc8e8', 'I': '#d8eef8', 'c': '#c8e6f8', 'C': '#f4fbff', 'o': '#4a6a90',
                'k': '#100c14', 'w': '#ffffff', 'l': '#6a98c0'},
        'map': [
            "....cc....",
            "...cCCc...",
            "..cCCCCc..",
            ".iiiiiiii.",
            "iIwkiiwkIi",
            "iIkkiikkIi",
            "iiiiooiiii",
            ".iIiiiiIi.",
            "..iiiiii..",
            "..l....l..",
        ],
        'fx': 'beam', 'accent': '#f4fbff',
    },
    'kar_baykusu': {  # kocaman gozlu kar baykusu, ucar
        'pal': {'e': '#9cb8d0', 'o': '#e8f0f6', 'W': '#b8d0e4', 'y': '#f0c050', 'b': '#d0e0ec',
                'v': '#a8c0d8', 'k': '#100c14', 'w': '#ffffff', 'l': '#f0c050'},
        'map': [
            ".e......e.",
            ".oe....eo.",
            ".oooooooo.",
            "oWWWooWWWo",
            "oWwkooWwko",
            "oWkkyyWkko",
            "voobbbboov",
            "vvobbbbovv",
            ".voobbbov.",
            "..l....l..",
        ],
        'fx': 'wind', 'fxcol': ('#f4fbff', '#a8c8e4'), 'accent': '#f0c050', 'fly': True,
    },
    'aurora_geyigi': {  # parlak boynuzlu kucuk geyik (nadir)
        'pal': {'d': '#b8c8e8', 'D': '#e0e8f8', 'a': '#7ae0c8', 'A': '#c08af0', 'm': '#ffffff',
                'o': '#4a5a80', 't': '#ffffff', 'k': '#100c14', 'w': '#ffffff', 'l': '#7a8ab0'},
        'map': [
            "a.A..A.a....",
            ".aAaaAa.....",
            "..dddd......",
            ".dwkddd.....",
            "odkkdddddddt",
            ".dddddDDDDdt",
            "..mdddDDDDd.",
            "...dddddddd.",
            "...l.l..l.l.",
        ],
        'fx': 'star', 'accent': '#7ae0c8',
    },
})

# ---------------------------------------------------------------- 0.8 Kor Diyari (ates-kirmizi)
SPECIES.update({
    'kor_semender': {  # sirti alevli semender, sola donuk
        'pal': {'h': '#e86a3a', 'R': '#d0502e', 'r': '#ffb050', 'y': '#ffd060', 'f': '#ffd060',
                'F': '#f08a3a', 't': '#ff9a4a', 'o': '#5a1a10', 'k': '#100c14', 'w': '#ffffff',
                'l': '#8a3020'},
        'map': [
            ".hhhh...fF...",
            "hwkhhh.fFf...",
            "hkkhhhRrRRf..",
            "hohhhRRyRrR..",
            ".hhhRRrRRyRt.",
            "...RRRRRRRRtt",
            ".l..l...l..l.",
        ],
        'fx': 'spores', 'fxcol': ('#ffd060', '#f05a2a'), 'accent': '#ffd060',
    },
    'kivilcim_yarasa': {  # kanatlari kor gibi parlayan yarasa, ucar
        'pal': {'W': '#d8583a', 'w': '#f08a3a', 'b': '#5a2a3a', 'B': '#7a3a48', 'e': '#5a2a3a',
                'y': '#ffd060', 'o': '#fff0d0', 'k': '#100c14', 'l': '#3a1a24'},
        'map': mirror([
            "W..e..",
            "WW.ee.",
            "WwWbbb",
            ".WwByk",
            "..Wbkk",
            "...bbo",
            "....bb",
            "....l.",
        ]),
        'fx': 'spores', 'fxcol': ('#ffd060', '#f05a2a'), 'accent': '#ffd060', 'fly': True,
    },
    'magma_salyangoz': {  # kabugu magma catlakli salyangoz
        'pal': {'b': '#e89a5a', 'a': '#e89a5a', 'A': '#ffd060', 's': '#4a3438', 'S': '#6a4a48',
                'm': '#ff7a2a', 'M': '#ffd060', 'k': '#100c14', 'w': '#ffffff', 'l': '#c87a4a'},
        'map': [
            ".A.A..sSSs..",
            ".a.a.sSmmSs.",
            ".a.a.sMmsmS.",
            "bbb.sSmSsmSs",
            "wkbbsSmmmSSs",
            "kkbbbsSSSSs.",
            "bbbbbbbbbbbb",
            ".l.l.l.l.l..",
        ],
        'fx': 'thorn', 'fxcol': ('#ffd060', '#ff7a2a'), 'accent': '#ff7a2a',
    },
    'kul_koc': {  # yunu kul, icinde korlar parlayan koc
        'pal': {'c': '#5a4a50', 'h': '#e8a050', 'H': '#ffd060', 'w': '#8a7e88', 'W': '#ff8a4a',
                'o': '#2a2028', 'k': '#100c14', 'l': '#3a2e34'},
        'map': [
            "..hhh.......",
            ".hHHhh......",
            ".h.ccc.wWwW.",
            "..cwkcwwWwwW",
            "..ckkcwWwwWw",
            ".occccwwwWww",
            "..cc.wWwwwWw",
            ".....wwwWww.",
            ".....l.l.l.l",
        ],
        'fx': 'slam', 'accent': '#ff8a4a',
    },
    'yakut_ejder': {  # yakut pullu minik ejder (nadir)
        'pal': {'r': '#c8304a', 'e': '#ffd060', 'v': '#e85a6a', 'V': '#ff9aa0', 'y': '#ffd8a0',
                'o': '#5a1020', 't': '#c8304a', 'k': '#100c14', 'w': '#ffffff', 'l': '#7a1a2a'},
        'map': [
            "...e..e.....",
            "..rrrrr..vV.",
            ".rrwkrr.vVVv",
            "orrkkrrvVVv.",
            ".rrrrrrrrr..",
            "..yyrrrrrrtt",
            "..yyrrrrr..t",
            "...l...l....",
        ],
        'fx': 'beam', 'fxcol': ('#ffb050', '#fff0a0'), 'accent': '#ffd060',
    },
})

# ---------------------------------------------------------------- 0.8 Golge Boslugu (mor)
SPECIES.update({
    'fisilti': {  # parlak gozlu golge hayaleti, ucar
        'pal': {'s': '#4a3a6a', 'S': '#6a4a9a', 'G': '#b8f0f0', 'o': '#1a1028', 'l': '#4a3a6a'},
        'map': [
            "...ssss...",
            "..ssssss..",
            ".ssssssss.",
            ".sGGssGGs.",
            ".sGGssGGs.",
            ".ssssosss.",
            ".sSssssSs.",
            ".s.sSs.s..",
            "s...s...s.",
        ],
        'fx': 'wave', 'fxcol': ('#b88af0',), 'accent': '#b88af0', 'fly': True,
    },
    'gece_pisi': {  # iki kuyruklu golge kedisi
        'pal': {'c': '#3a2e4e', 'C': '#5a4a7a', 'e': '#5a4a7a', 'y': '#7af0e0', 'o': '#c88aa0',
                't': '#3a2e4e', 'T': '#b88af0', 'k': '#100c14', 'l': '#2a2038'},
        'map': [
            ".e...e.......",
            ".ee.ee.....T.",
            ".ccccc....t.T",
            "cykccykc..t.t",
            "ckkcckkc..tt.",
            "cccoccccccct.",
            ".ccccccccccc.",
            "..cccCCCCccc.",
            "..l..l...l.l.",
        ],
        'fx': 'thorn', 'fxcol': ('#b88af0', '#5a3a8a'), 'accent': '#7af0e0',
    },
    'bosluk_kurdu': {  # halka halka parlayan bosluk kurdu
        'pal': {'v': '#6a4a9a', 'm': '#4a3a6a', 'M': '#b88af0', 'o': '#1a1028', 'k': '#100c14',
                'w': '#ffffff', 'l': '#3a2a5a'},
        'map': [
            ".vvvv.......",
            "vwkvwkv.....",
            "vkkvkkvmmm..",
            "vvoovvmMMmm.",
            ".vvvvmMmmMmm",
            "..vvmmmMmmMm",
            "..l.l..l..l.",
        ],
        'fx': 'spores', 'fxcol': ('#b88af0', '#6a4a9a'), 'accent': '#b88af0',
    },
    'gozmantar': {  # sapkasinda tek koca goz olan mantar
        'pal': {'p': '#5a3a8a', 'P': '#7af0e0', 'W': '#f4f0ff', 's': '#c8b8d8', 'o': '#3a2a5a',
                'k': '#100c14', 'l': '#8a7aa0'},
        'map': [
            "...pppp...",
            ".ppPppPpp.",
            "pPpWWWWpPp",
            "ppWWkkWWpp",
            "ppWWkkWWpp",
            "pppWWWWppp",
            "...ssss...",
            "..ssoss...",
            "..ssssss..",
            "..l....l..",
        ],
        'fx': 'beam', 'fxcol': ('#b88af0', '#f4f0ff'), 'accent': '#7af0e0',
    },
    'ay_guvesi': {  # kanadinda ay lekesi olan guve (nadir), ucar
        'pal': {'W': '#3a3a7a', 'v': '#b8c8f8', 'm': '#fff0a0', 'b': '#e8e0f8', 'a': '#b8c8f8',
                'k': '#100c14', 'w': '#ffffff', 'l': '#8a8ab0'},
        'map': mirror([
            "WW..a.",
            "WvW..a",
            "WvvWbb",
            "WvmWwk",
            ".WvWkk",
            ".WvWbb",
            "..WWbb",
            "....l.",
        ]),
        'fx': 'star', 'accent': '#fff0a0', 'fly': True,
    },
})


# ---------------------------------------------------------------- 0.8 Efsanevi Glemonlar (yumurtadan cikar)
SPECIES.update({
    'cicek_aslani': {  # yelesi cicek tacli aslan yavrusu
        'pal': {'y': '#e8c070', 'P': '#ec96a4', 'r': '#d86a7a', 'o': '#7a3e2a', 't': '#e8c070',
                'k': '#100c14', 'w': '#ffffff', 'l': '#b88a4a'},
        'map': [
            "..PrPrP.....",
            ".PryyyyrP...",
            "PrywkywkrP..",
            "PrykkykkrP..",
            ".PryoyyrPyyt",
            "..PrPrPyyyyP",
            "...yyyyyyyy.",
            "...yyyyyyyy.",
            "...l.l..l.l.",
        ],
        'fx': 'leaf', 'accent': '#ec96a4',
    },
    'kristal_yilan': {  # sirti ametist kristalli buz mavisi yilan
        'pal': {'c': '#7cb4d8', 'C': '#c8e6f8', 'v': '#9a6cc8', 'o': '#e85a6a', 'k': '#100c14',
                'w': '#ffffff'},
        'map': [
            ".cccc........",
            "cCwkCc.......",
            "cCkkCc...cvc.",
            "occCCcc.cCvCc",
            "...cCCcccCCc.",
            "....cCCvCCc..",
            "......ccc....",
        ],
        'fx': 'beam', 'fxcol': ('#c8a0ec', '#f0e0ff'), 'accent': '#9a6cc8',
    },
    'gunes_kusu': {  # altin tuylu, turuncu kanatli gunes kusu
        'pal': {'Y': '#ffd04d', 'f': '#ff8a2e', 'W': '#e86a2a', 'w': '#ffb04a', 'o': '#c87a1a',
                'T': '#e86a2a', 'k': '#100c14', 'l': '#c87a1a'},
        'map': mirror([
            "....f.",
            "...fY.",
            "W..YYY",
            "WWwYwk",
            "WwwWkk",
            ".WwYYo",
            "..WYYY",
            "...TT.",
            "....l.",
        ]),
        'fx': 'wave', 'fxcol': ('#ffe080',), 'accent': '#ffd04d', 'fly': True,
    },
    'kuzey_kurdu': {  # sirtinda aurora yelesi olan kurt
        'pal': {'f': '#8a9ab8', 'e': '#6a7a98', 'a': '#7ae0c8', 'A': '#c08af0', 'T': '#e4ebf2',
                't': '#7ae0c8', 'm': '#e4ebf2', 'o': '#1a1a28', 'k': '#100c14', 'w': '#ffffff',
                'l': '#5a6a88'},
        'map': [
            ".e..e........",
            ".eeeee.aA....",
            "fffffffAaA.TT",
            "fwkffwkffffTt",
            "fkkffkkffff.T",
            "offffffffff..",
            ".mmffffffff..",
            "..fffffffff..",
            "..l..l..l..l.",
        ],
        'fx': 'beam', 'accent': '#7ae0c8',
    },
    'anka_yavrusu': {  # alev tuylu anka yavrusu
        'pal': {'F': '#e8502a', 'f': '#ffd060', 'W': '#ff8a2e', 'w': '#ffd060', 'o': '#ffd060',
                'k': '#100c14', 'l': '#a83a14'},
        'map': mirror([
            "f.....",
            ".f..f.",
            "..fFF.",
            "W..FFF",
            "WWwFwk",
            "WwwWkk",
            ".WwFFo",
            "..WFFF",
            "..ff..",
            "....l.",
        ]),
        'fx': 'spores', 'fxcol': ('#ffd060', '#f05a2a'), 'accent': '#ffd060', 'fly': True,
    },
    'yildiz_balinasi': {  # havada yuzen, yildiz benekli kucuk balina
        'pal': {'b': '#3a3a7a', 'B': '#8a8ac8', 's': '#fff0a0', 't': '#3a3a7a', 'T': '#c8a0f0',
                'k': '#100c14', 'w': '#ffffff'},
        'map': [
            "...........tt.",
            "...bbbbbb..tT.",
            ".bbbsbbbbbbtt.",
            "bbwkbbbsbbbbt.",
            "bbkkbbbbbbbbb.",
            "bBBBBBBBbbbb..",
            ".BBsBBBBBBb...",
            "..BBBBBBB.....",
        ],
        'fx': 'star', 'accent': '#fff0a0', 'fly': True,
    },
})


def _pad(rows):
    w = max(len(r) for r in rows)
    return [r.ljust(w, '.') for r in rows]


def boss_ayi():
    """Buzul Ayisi (Buz 40. kat): omuzlari buz kristalli koca beyaz ayi."""
    half = _pad([
        "..ee......",
        ".eEEeffff.",
        ".eEEffffff",
        "..ffffffff",
        "..ffwkffff",
        "..ffkkffff",
        "...fffffmm",
        "C...ffffmo",
        "Cc..fffmmm",
        "CcC.ffffff",
        "cCcffffBBB",
        ".cffffBBBB",
        "..fffBBBBB",
        ".ffffBBBBB",
        ".fdddfBBBB",
        ".fdddfBBBB",
        "..ffffffff",
        "..ll....ll",
    ])
    pal = {'f': '#e8f0f8', 'e': '#c8d8e8', 'E': '#f0b8c8', 'm': '#ffffff', 'o': '#2a3450',
           'B': '#c8dcec', 'd': '#a8c0d8', 'c': '#9cc8e8', 'C': '#d8eef8', 'k': '#100c14',
           'w': '#ffffff', 'l': '#8aa8c8'}
    return {'pal': pal, 'map': mirror(half), 'fx': 'beam', 'boss': True, 'ts': 3}


def boss_kaplumbaga():
    """Magma Kaplumbagasi (Kor 50. kat): sirti tutup kizaran volkan kabuklu kaplumbaga."""
    rows = _pad([
        "............M...........",
        "...........mMm..........",
        "...........SSSS.........",
        ".........SSmMSSS........",
        ".......SSSSmSSmSSS......",
        "......SSmSSSSSSmMSS.....",
        ".....SSmMmSSSmSSSSSS....",
        ".hhh.SSSSSSmSSSSmSSSS...",
        "hhhhhSSmSSSSSSmMmSSSSS..",
        "hwkhhrrrrrrrrrrrrrrrrrr.",
        "hkkhhhrrrrrrrrrrrrrrrrrt",
        "hhhhh.hhhh.......hhhh.tt",
        "oohh..hhhh.......hhhh...",
        "......llll.......llll...",
    ])
    pal = {'S': '#4a3438', 'm': '#ff7a2a', 'M': '#ffd060', 'r': '#c8603a', 'h': '#a0603e',
           'o': '#5a2a1a', 't': '#a0603e', 'k': '#100c14', 'w': '#ffffff', 'l': '#6a3a24'}
    return {'pal': pal, 'map': rows, 'fx': 'slam', 'boss': True, 'ts': 3}


def boss_bekci():
    """Bosluk Bekcisi (Golge 60. kat): havada suzulen, kapusonlu, mor tasli bekci."""
    half = _pad([
        "......hhhh",
        ".....hHHHH",
        "....hHhhhh",
        "...hHhkkkk",
        "...hHkGGkk",
        "...hHkGGkk",
        "...hHkkkkk",
        "..hHHhkkkk",
        "..hHhhhhhh",
        ".hHhhhhhhV",
        "hhHhhhhhVv",
        "AhHhhhhhhV",
        "aAhHhhhhhh",
        "aa.hHhhhhh",
        "...hHhhhhh",
        "....hHhhhh",
        ".....h.h.h",
        "......h..h",
    ])
    pal = {'h': '#2a2040', 'H': '#4a3a6a', 'k': '#0a0612', 'G': '#7af0e0', 'V': '#b88af0',
           'v': '#f4f0ff', 'a': '#b88af0', 'A': '#5a3a8a'}
    return {'pal': pal, 'map': mirror(half), 'fx': 'wave', 'fxcol': ('#b88af0',), 'boss': True,
            'ts': 3, 'fly': True}


# ---------------------------------------------------------------- 0.8.5 Su Glemonlari (balik tutarken)
SPECIES.update({
    'damlacik': {  # damla seklinde, icinde kabarcik olan su yavrusu
        'pal': {'d': '#5aa8d0', 'D': '#a8dcf4', 'b': '#e8f8ff', 'o': '#2e6a90', 'k': '#100c14', 'w': '#ffffff',
                'm': '#e87a8a', 'l': '#3a88b0'},
        'map': [
            "....dd....",
            "...dDDd...",
            "..dDDbdd..",
            ".ddDbddd..",
            ".dwkddwkd.",
            "ddkkddkkdd",
            "dddmddmddd",
            "ddddooddd.",
            ".ddddddddo",
            "..dddddd..",
        ],
        'fx': 'wave', 'accent': '#a8dcf4',
    },
    'inci_istiridye': {  # kabugunun arasindan inci ve gozler gorunen istiridye
        'pal': {'s': '#b8a8c8', 'S': '#e8dcf0', 'v': '#7a6a90', 'p': '#fff8f0', 'P': '#f0d8e8', 'r': '#e88a9a',
                'k': '#100c14', 'w': '#ffffff'},
        'map': [
            "..ssssssss..",
            ".sSSsSSsSSs.",
            "sSSsSSsSSsSs",
            "vssssssssssv",
            ".rrwkrrwkrr.",
            ".rrkkpPkkrr.",
            "vsssspPssssv",
            "sSSsSSsSSsSs",
            ".vssssssssv.",
        ],
        'fx': 'slam', 'accent': '#fff8f0',
    },
    'gol_ejderi': {  # uzun boyunlu, yuzgec kulakli minik su ejderi (nadir)
        'pal': {'g': '#4a9a98', 'G': '#8ad8c8', 'b': '#e0f4e8', 'f': '#5aa8d0', 'F': '#a8dcf4', 'o': '#2a5a5a',
                'k': '#100c14', 'w': '#ffffff', 'l': '#2e7a78'},
        'map': [
            "f..f.........",
            "Ffgf.........",
            ".gggg........",
            "gwkggg.......",
            "gkkggg.......",
            "oggggg..fF...",
            ".bbggg.ggfF..",
            "..bgggggggg..",
            "..bbGGGGGgggf",
            "...gggggggg.F",
            "...l.l..l.l..",
        ],
        'fx': 'wave', 'fxcol': ('#e8f8ff', '#5aa8d0'), 'accent': '#8ad8c8',
    },
})

# ---------------------------------------------------------------- 0.11 gece Glemonlari (sadece gece)
SPECIES.update({
    'isilbocek': {  # karnindan sari-yesil isik yayan yuvarlak ates bocegi
        'pal': {'b': '#3a4a6a', 'B': '#5a6c94', 'y': '#d8f070', 'Y': '#f8ffc0', 'a': '#8ab8e8', 'k': '#100c14', 'w': '#ffffff', 'l': '#2a3450'},
        'map': [
            "..a.....a...",
            "...a...a....",
            "..aaa.aaa...",
            ".abbbbbbba..",
            ".bBwkbBwkb..",
            "bbBkkbBkkbb.",
            "bbbbbbbbbbyy",
            ".bbbbbbbbyYY",
            "..bbbbbbyYYy",
            "...l..l..yy.",
        ],
        'fx': 'star', 'fxcol': ('#f8ffc0', '#d8f070'), 'accent': '#d8f070',
    },
    'parilmantar': {  # sapkasi mavi parlayan, benekli gece mantari
        'pal': {'m': '#3a8ac8', 'M': '#8ad8ff', 'd': '#c8f4ff', 's': '#e8e0d0', 'S': '#b8ac98', 'k': '#100c14', 'w': '#ffffff', 'p': '#f0a0c0'},
        'map': [
            "...mmmmmm...",
            "..mMdmmdMm..",
            ".mMMmmmmMMm.",
            "mmdmmMMmmdmm",
            "mmmmmmmmmmmm",
            "..ssssssss..",
            "..swkssswk..",
            "..skkssskk..",
            "..spssssps..",
            "...SsssssS..",
            "...SS..SS...",
        ],
        'fx': 'spores', 'fxcol': ('#c8f4ff', '#3a8ac8'), 'accent': '#8ad8ff',
    },
    'gece_kelebegi': {  # mor kanatli, kanatlarinda ay deseni olan pervane
        'pal': {'v': '#6a4a9a', 'V': '#a07ad0', 'm': '#f0e0a0', 'b': '#3a2a4a', 'B': '#5a4a6a', 'k': '#100c14', 'w': '#ffffff', 'f': '#e8d8f0'},
        'map': [
            "VV....ff....VV",
            "vVV...ff...VVv",
            "vmVV..bb..VVmv",
            "vvVVbbBBbbVVvv",
            ".vvVbwkbwkVvv.",
            ".vVVbkkbkkVVv.",
            "vmvVbBBBBbVvmv",
            "vvv.bbbbbb.vvv",
            ".v....bb....v.",
        ],
        'fx': 'wind', 'accent': '#f0e0a0', 'fly': True,
    },
    'ruya_kuzusu': {  # lavanta yunlu, yununde yildizlar olan uykucu kuzu (nadir)
        'pal': {'c': '#d8c8f0', 'C': '#f4ecff', 'y': '#fff0a0', 'f': '#3a3050', 'F': '#5a4a70', 'k': '#100c14', 'w': '#ffffff', 'p': '#f0a0c0'},
        'map': [
            "..cCcc.cCc..",
            ".cCCycccCCc.",
            "cCCcccCCcycc",
            "cFFFcccCCccc",
            "FwkFFcccycCc",
            "FkkFFcCccccc",
            "FpFFccccCCc.",
            ".FFcccyccc..",
            "..cccccccc..",
            "...ff..ff...",
        ],
        'fx': 'star', 'accent': '#fff0a0',
    },
})

# ---------------------------------------------------------------- 0.9 Dolunay Gecesi
SPECIES['ay_tavsani'] = {  # ay rengi tavsan, alninda hilal, sola donuk
    'pal': {'H': '#e8ecff', 'g': '#c8d0f0', 'G': '#9aa4d0', 'e': '#f0b8d0', 'm': '#ffe890',
            'c': '#ffffff', 'w': '#ffffff', 'k': '#1a1630', 'p': '#f0a0c0', 'l': '#8a90c0', 'y': '#fff4b0'},
    'map': [
        "..He..He....",
        "..He..He....",
        "..gH..gH....",
        ".gHHmHHgg..y",
        "gHwkHHwkgg.c",
        "gHkkHHkkggcc",
        "gpgHccgpgGG.",
        ".gHccccgGG..",
        ".gccccggGG..",
        "..ccccggG...",
        "..ll..ll....",
    ],
    'fx': 'star', 'accent': '#ffe890',
}
# ---------------------------------------------------------------- 0.12 Glemon Derinligi: 20 yeni tur + 3 gizli tur
SPECIES.update({
    'pamukcuk': {  # tepesinde filiz olan pamuk yumagi
        'pal': {'c': '#ece6dc', 'C': '#ffffff', 'd': '#c8beb0', 'f': '#6a5a4a', 'F': '#8a7a66', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a0b0', 'l': '#5a4a3a', 'g': '#7ab04e'},
        'map': [
            "....gg......",
            "...g.Cc.....",
            "..cCCcCCc...",
            ".cCCccCCcc..",
            "cCCfFFfccCc.",
            "cCfwkFwkfcc.",
            "ccfkkFkkfcd.",
            "ccfpFFFpfcd.",
            ".ccffffccdd.",
            ".cccccccddd.",
            "..cccccdd...",
            "...l...l....",
        ],
        'fx': 'star', 'accent': '#7ab04e',
    },
    'tirtilcik': {  # benekli yesil tirtil, sola donuk
        'pal': {'g': '#8cc85a', 'G': '#b4e07a', 'd': '#5a9a3a', 'y': '#f0d050', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a0a0', 'a': '#e07a3a', 'l': '#4a6a2a'},
        'map': [
            "..a.a.........",
            "..d.d.........",
            ".gGGGg........",
            "gGwkGgg.gGg...",
            "gGkkGggGGGGg.g",
            "gpGGgyggGyGGgG",
            ".gggddgggdgggd",
            "..dd.ddd.ddd..",
            "..l...l...l...",
        ],
        'fx': 'spores', 'fxcol': ('#f4f0e0', '#c8c0a8'), 'accent': '#f0d050',
    },
    'mese_baykusu': {  # sirtinda mese yapragi olan kahverengi baykus, ucar
        'pal': {'b': '#8a6a4a', 'B': '#b08a64', 'c': '#e8d4b0', 'o': '#f0c050', 'k': '#100c14', 'w': '#ffffff',
                'y': '#e8a040', 'l': '#c88a3a'},
        'map': [
            "..b......b..",
            "..bb....bb..",
            "..bBBBBBBb..",
            ".bBoooBooob.",
            ".bowkoowkob.",
            ".bokkookkob.",
            "bbBoooyooBbb",
            "bBBccyycccBb",
            "bBcccccccBBb",
            ".bBccccccBb.",
            "..bbBBBBbb..",
            "...l....l...",
        ],
        'fx': 'wind', 'fxcol': ('#b4e07a', '#5a9a3a'), 'accent': '#7ab04e', 'fly': True,
    },
    'sarkitcik': {  # ters sarkit seklinde zipzip tas
        'pal': {'s': '#8a8a96', 'S': '#b4b4c0', 'd': '#5e5e6a', 'c': '#a8d8f0', 'k': '#100c14', 'w': '#ffffff',
                'p': '#e8a0b0', 'l': '#4a4a56'},
        'map': [
            "..sSSSSs..",
            ".sSSSSSSd.",
            "sSSSSSSSdd",
            "sSwkSSwkdd",
            "sSkkSSkkdd",
            "sSSSppSSdd",
            ".sSSSSSdd.",
            "..sSSSdd..",
            "...sSdd...",
            "....cc....",
            "...l..l...",
        ],
        'fx': 'slam', 'accent': '#a8d8f0',
    },
    'kaya_kostebek': {  # pembe burunlu kaya kostebegi
        'pal': {'m': '#6a5a6a', 'M': '#8a7a8a', 'd': '#4a3e4a', 'n': '#f0a0b0', 'c': '#e8c8b0', 'k': '#100c14', 'w': '#ffffff',
                'l': '#3a303a'},
        'map': [
            "...mmmmm....",
            "..mMMMMMm...",
            ".mMMMMMMMm..",
            "mMwkMMMMMMm.",
            "nmkkMMMMMMd.",
            "nnMMMMMMMdd.",
            ".ccMMMMMMdd.",
            ".cc.mMMMddd.",
            "...mmmmddd..",
            "...l....l...",
        ],
        'fx': 'slam', 'accent': '#f0a0b0',
    },
    'fener_semenderi': {  # sirti isik benekli magara semenderi (nadir)
        'pal': {'t': '#3a8a9a', 'T': '#5ab4c0', 'd': '#2a6070', 'y': '#d8f070', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a0b0', 'l': '#24505a'},
        'map': [
            "..tTTt........",
            ".tTwkTt.......",
            "tTTkkTTtttt...",
            "tpTTTyTTTTTtt.",
            ".tTTtTTyTTTTtt",
            "..dddddddddd.t",
            "...l..l..l..l.",
        ],
        'fx': 'beam', 'fxcol': ('#f8ffc0', '#d8f070'), 'accent': '#d8f070',
    },
    'kum_tilkisi': {  # kocaman kulakli col tilkisi
        'pal': {'f': '#e8c890', 'F': '#f4e0b4', 'd': '#c8a060', 'e': '#f0b0a0', 'k': '#100c14', 'w': '#ffffff',
                't': '#fff4e0', 'l': '#b08a50'},
        'map': [
            "e.....e.....",
            "fe...ef.....",
            "ffe.eff.....",
            "fFFFFFf.....",
            "FwkFFwkf..ff",
            "FkkFFkkf.fFf",
            "kFtttFFfffFf",
            ".FttFFFffFf.",
            "..FFFFFfff..",
            "..dFFFFdd...",
            "..l..l.l.l..",
        ],
        'fx': 'spores', 'fxcol': ('#e8d098', '#c8a060'), 'accent': '#f0b0a0',
    },
    'devecik': {  # tek horguclu yavru deve
        'pal': {'c': '#d8a868', 'C': '#ecc890', 'd': '#b08048', 'h': '#c89058', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a0a0', 'l': '#8a6038'},
        'map': [
            "..cc........",
            ".cCCc.......",
            ".wkCc..hh...",
            ".kkCc.hhhh..",
            "ccCCcchhhhh.",
            "p.cCCCCCCChd",
            "...cCCCCCCdd",
            "...cCCCCCCd.",
            "....dd..dd..",
            "....l...l...",
        ],
        'fx': 'wave', 'fxcol': ('#e8f4ff',), 'accent': '#e07a3a',
    },
    'serap_kelebegi': {  # kanatlari serap gibi parildayan turuncu kelebek (nadir), ucar
        'pal': {'o': '#e8a050', 'O': '#f8d090', 'm': '#80d0d0', 'b': '#5a4030', 'B': '#7a5a44', 'k': '#100c14', 'w': '#ffffff',
                'f': '#f8f0d0'},
        'map': [
            "OO....ff....OO",
            "oOO...ff...OOo",
            "omOO..bb..OOmo",
            "ooOObbBBbbOOoo",
            ".ooObwkbwkOoo.",
            ".oOObkkbkkOOo.",
            "omoObBBBBbOomo",
            "ooo.bbbbbb.ooo",
            ".o....bb....o.",
        ],
        'fx': 'wind', 'fxcol': ('#80d0d0', '#f8d090'), 'accent': '#80d0d0', 'fly': True,
    },
    'fokcuk': {  # tombul yavru fok
        'pal': {'s': '#d8e4ec', 'S': '#f4f8fb', 'd': '#a8bccc', 'n': '#3a3a48', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a8b8', 'l': '#8aa0b4'},
        'map': [
            "..sSSSs.....",
            ".sSSSSSSs...",
            "sSwkSwkSSs..",
            "sSkkSkkSSSs.",
            "sSnpSSSSSSSs",
            ".sSSSSSSSSSd",
            "..sSSSddSSdd",
            "...sdd..dddd",
            "..ll......l.",
        ],
        'fx': 'beam', 'accent': '#8ac8e8',
    },
    'kar_gelincigi': {  # uzun beyaz gelincik, kuyruk ucu siyah
        'pal': {'W': '#eef4f8', 's': '#c8d8e4', 'd': '#98aec0', 't': '#2a2a34', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a8b8', 'l': '#8aa0b4'},
        'map': [
            "..s...........",
            ".sWs..........",
            ".WWWs.........",
            "WwkWWs........",
            "WkkWWWssss..tt",
            "pWWWWWWWWWsstd",
            ".WWWWWWWWWWss.",
            "..sss..ssss...",
            "..l..l..l..l..",
        ],
        'fx': 'thorn', 'fxcol': ('#e8f4fc', '#8ab0d0'), 'accent': '#9cc8e8',
    },
    'buz_kirpisi': {  # buz dikenli kirpi (nadir)
        'pal': {'i': '#a8d8f0', 'I': '#e0f4ff', 'b': '#8a7a6a', 'B': '#b0a090', 'd': '#6a8aa8', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a8b8', 'l': '#5a4a3a'},
        'map': [
            "....I.I.I...",
            "...iIiIiIi..",
            "..iIiIiIiIi.",
            ".iIiIiIiIiId",
            "BbbiIiIiIidd",
            "BwkbiIiIiddd",
            "BkkbbbbbbBd.",
            "pBBBBBBBBBb.",
            ".bbbbbbbbbb.",
            "..l..l..l...",
        ],
        'fx': 'thorn', 'fxcol': ('#e0f4ff', '#a8d8f0'), 'accent': '#e0f4ff',
    },
    'lav_kurbagasi': {  # sirti lav benekli kurbaga
        'pal': {'r': '#c84a2a', 'R': '#e87a3a', 'y': '#ffd060', 'd': '#8a2a1a', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f8b0a0', 'l': '#6a2014'},
        'map': [
            ".rr....rr...",
            "rwkr..rwkr..",
            "rkkrRRrkkr..",
            "rRRRRRRRRRr.",
            "RRyRRRRyRRRr",
            "pRRRRRRRRRRd",
            ".dRRRRRRRRd.",
            "ddRRyRRRRdd.",
            "dd.dddddd.dd",
            ".l........l.",
        ],
        'fx': 'spores', 'fxcol': ('#ffd060', '#f05a2a'), 'accent': '#ffd060',
    },
    'kivilcim_civciv': {  # tepesi alevli civciv
        'pal': {'y': '#f8d050', 'Y': '#fff0a0', 'o': '#f08a3a', 'r': '#e04a2a', 'b': '#e8a030', 'k': '#100c14', 'w': '#ffffff',
                'l': '#c87a2a'},
        'map': [
            "...r.r....",
            "...ror....",
            "..yYYYy...",
            ".yYYYYYy..",
            "bwkYYYYYy.",
            "bkkYYYYyyo",
            ".yYYYYyyoo",
            ".yYYYYyoo.",
            "..yyyyoo..",
            "...l..l...",
        ],
        'fx': 'spores', 'fxcol': ('#ffd060', '#f05a2a'), 'accent': '#f05a2a',
    },
    'obsidyen_kertenkele': {  # parlak siyah kertenkele, catlaklari kor (nadir)
        'pal': {'o': '#3a3044', 'O': '#5a4e66', 'g': '#9a8ab8', 'r': '#f05a2a', 'y': '#ffd060', 'k': '#100c14',
                'l': '#2a2230'},
        'map': [
            "..oOOo........",
            ".oOykOo.......",
            "oOOkkOOooo....",
            "OOOOOgOOOOoo..",
            ".oOrOOOrOOOooo",
            "..ooooooooo..o",
            "..l..l..l..l..",
        ],
        'fx': 'slam', 'accent': '#f05a2a',
    },
    'murekkepcik': {  # mor parlak murekkep damlasi
        'pal': {'v': '#4a3a6a', 'V': '#6a5a8a', 'd': '#2a2040', 's': '#b88af0', 'k': '#100c14', 'w': '#ffffff',
                'p': '#e0a0d0'},
        'map': [
            "...vvvv...",
            "..vVsVVv..",
            ".vVsVVVVv.",
            ".vwkVVwkv.",
            "vVkkVVkkVv",
            "vVVpVVpVVd",
            "vVVVVVVVdd",
            ".vVddVVddv",
            "..d..dd..d",
        ],
        'fx': 'spores', 'fxcol': ('#b88af0', '#4a3a6a'), 'accent': '#b88af0',
    },
    'fener_hayaleti': {  # elinde fener tutan yumusak hayalet, ucar
        'pal': {'g': '#d8d0f0', 'G': '#f4f0ff', 'd': '#a8a0c8', 'y': '#ffd060', 'Y': '#fff0a0', 'b': '#5a4a3a',
                'k': '#100c14', 'w': '#ffffff'},
        'map': [
            "...gGGGg....",
            "..gGGGGGg...",
            ".gGwkGwkGg..",
            ".gGkkGkkGg..",
            ".gGGGGGGGg.b",
            ".gGGGGGGGgbY",
            "..gGGGGGgdyY",
            "..gGgGgGdd.b",
            "..g.g.g.d...",
        ],
        'fx': 'wave', 'fxcol': ('#fff0a0',), 'accent': '#ffd060', 'fly': True,
    },
    'kara_kuzgun': {  # mor parlak tuylu kuzgun (nadir), ucar
        'pal': {'b': '#2a2434', 'B': '#4a405a', 's': '#7a6a9a', 'y': '#f0c050', 'k': '#100c14', 'w': '#ffffff',
                'l': '#5a4a3a'},
        'map': [
            "...bbbb.....",
            "..bBBBBb....",
            ".bBwkBBBb...",
            "yyBkkBBBbb..",
            ".ybBBBsBBbb.",
            "..bBBsBBBBbb",
            "..bBBBBBBsbb",
            "...bBBBBbbb.",
            "....bbbb.bb.",
            "....l..l....",
        ],
        'fx': 'wind', 'fxcol': ('#7a6a9a', '#2a2434'), 'accent': '#b88af0', 'fly': True,
    },
    'nilufer_kurbagasi': {  # basinda nilufer yapragi olan su kurbagasi (nadir)
        'pal': {'g': '#6ac08a', 'G': '#9ae0b0', 'd': '#3a8a5a', 'n': '#5aa84e', 'N': '#8ad06a', 'f': '#f0a0c0',
                'k': '#100c14', 'w': '#ffffff', 'p': '#f0a0b0'},
        'map': [
            "...nNNfNn...",
            "..nNNNNNNn..",
            ".gwkg..gwkg.",
            ".gkkgGGgkkg.",
            "gGGGGGGGGGGd",
            "gpGGGGGGGpdd",
            ".gGGGGGGGGd.",
            "ddgGGGGGGgdd",
            "dd.dddddd.dd",
        ],
        'fx': 'heal', 'accent': '#f0a0c0',
    },
    'kirpi_baligi': {  # dikenli sari balon baligi (nadir)
        'pal': {'y': '#e8d080', 'Y': '#f8f0b0', 'd': '#b8a050', 's': '#8a7a40', 'b': '#8ac8e0', 'k': '#100c14', 'w': '#ffffff',
                'p': '#f0a0a0'},
        'map': [
            "..s..s..s...",
            ".sYYYYYYYs..",
            "sYYYYYYYYYs.",
            "YwkYYYYYYYYb",
            "YkkYYYYYYYbb",
            "YpYYYYYYYYYb",
            "sYYYYYYYYYs.",
            ".sddddddds..",
            "..s..s..s...",
        ],
        'fx': 'thorn', 'fxcol': ('#e8d080', '#8a7a40'), 'accent': '#8ac8e0',
    },
    # ---- gizli turler
    'hilal_ejderi': {  # alninda hilal olan ay rengi ejder (dolunay gecesi), ucar
        'pal': {'m': '#c8d0f0', 'M': '#eef0ff', 'd': '#9aa4d0', 'y': '#ffe890', 'Y': '#fff8c8', 'v': '#7a6ab0', 'V': '#a89ae0',
                'k': '#1a1630', 'w': '#ffffff', 'p': '#f0a0c0'},
        'map': [
            "..y...........",
            ".yY...........",
            ".ymMMm....vv..",
            "mMwkMMm..vVv..",
            "mMkkMMMmvVvv..",
            "pMMMMMMMMvv...",
            ".mmMMMMMMMMm..",
            "...mMMMMMMMmmy",
            "...mdMMMdMmmY.",
            "....dd..dd....",
        ],
        'fx': 'star', 'accent': '#ffe890', 'fly': True,
    },
    'kadim_kostebek': {  # sirti kristal dolu yasli dev kostebek (madende 50. derinlik)
        'pal': {'m': '#5a4a5a', 'M': '#7a6a7a', 'd': '#3a2e3a', 'c': '#c8a0ec', 'C': '#f0e0ff', 'n': '#f0a0b0',
                'h': '#e8d8c0', 'g': '#ffd34d', 'k': '#100c14', 'w': '#ffffff', 'l': '#2a222a'},
        'map': [
            "......cC.c....",
            "....cCcCcCc...",
            "...mmcCmCcmm..",
            "..mMMMMMMMMMm.",
            ".mwkMMMMMMMMMm",
            "nmkkMMMgMMMMMd",
            "nnMMMMMMMMMMdd",
            ".hhMMMMMMMMddd",
            ".hh.mMMMMdddd.",
            "....l....l....",
        ],
        'fx': 'beam', 'fxcol': ('#c8a0ec', '#f0e0ff'), 'accent': '#ffd34d',
    },
    'yildirim_baligi': {  # simsek desenli lacivert yilanbaligi (firtinada)
        'pal': {'b': '#2a4a7a', 'B': '#4a7ab0', 'y': '#f8e050', 'Y': '#fff8a0', 'd': '#1a3050', 'f': '#8ad8ff',
                'k': '#100c14', 'w': '#ffffff', 'p': '#f0a0c0'},
        'map': [
            "..........Yy..",
            "..bBBb...yY...",
            ".bBwkBb..y....",
            "bBBkkBBbBBbb..",
            "bpBBBBBBBByBbb",
            ".bBByBBBBBBBBb",
            "..ddddddBBBdfb",
            "........ddd.ff",
        ],
        'fx': 'beam', 'fxcol': ('#fff8a0', '#f8e050'), 'accent': '#f8e050',
    },
})
SPECIES['agacbasi'] = boss_agacbasi()
SPECIES['tas_golemi'] = boss_golem()
SPECIES['firtina_cakali'] = boss_cakal()
SPECIES['buzul_ayisi'] = boss_ayi()
SPECIES['magma_kaplumbaga'] = boss_kaplumbaga()
SPECIES['bosluk_bekcisi'] = boss_bekci()


# ---------------------------------------------------------------- 1.0 Yildiz Cekirdegi
def boss_kadim():
    """Kadim Bonk (Yildiz Cekirdegi 70. kat): ilk Glemon. Yildiz tacli, gogsunde pembe kalp kristali olan yuvarlak kozmik dev."""
    half = _pad([
        ".......y.y",
        "......yYyY",
        ".....bbbbb",
        "...bbBBBBB",
        "..bBBBsBBB",
        ".bBBBBBBBB",
        ".bBwwkBBBB",
        "bBBwkkBBBB",
        "bBBkkkBBBB",
        "bBpBBBBBBB",
        "bBBBBBBBcc",
        "bBBsBBBcCC",
        ".bBBBBBBcc",
        ".bBBBBBBBB",
        "..bBBsBBBB",
        "AAbbBBBBBB",
        "aA..bbbbbb",
        "....d..d.d",
    ])
    pal = {'b': '#2a3478', 'B': '#4a5ab8', 's': '#fff0a0', 'y': '#ffd04d', 'Y': '#fff0a0', 'w': '#ffffff',
           'k': '#100c14', 'p': '#e07ab0', 'c': '#e05aa0', 'C': '#ffa8d8', 'A': '#c8d8ff', 'a': '#7a8ad8',
           'd': '#1a2050'}
    return {'pal': pal, 'map': mirror(half), 'fx': 'star', 'fxcol': ('#fff0a0', '#ffa8d8'), 'boss': True, 'ts': 3}


SPECIES.update({
    'yildiz_tozu': {  # gulumseyen bes koseli kucuk yildiz, ucar
        'pal': {'y': '#e8c850', 'Y': '#fff0a0', 'w': '#ffffff', 'k': '#100c14', 'm': '#e07a8a'},
        'map': [
            "....yy....",
            "...yYYy...",
            "yyyYYYYyyy",
            ".yYwkYwkY.",
            "..YkkYkkY.",
            "..yYmYmYy.",
            ".yYYYYYYYy",
            ".yYy..yYy.",
            "yy......yy",
        ],
        'fx': 'star', 'accent': '#fff0a0', 'fly': True,
    },
    'nebula_kedisi': {  # tuyleri mor nebula, uzerinde yildiz benekleri olan kedi
        'pal': {'n': '#5a3a8a', 'N': '#9a6ad0', 's': '#fff0a0', 'w': '#ffffff', 'k': '#100c14', 'p': '#f0a0c0',
                't': '#c8a0f0', 'd': '#3a2a5a'},
        'map': [
            ".n......n...",
            ".nN....nN...",
            ".nNnnnnNNn..",
            "nNwkNNNwkNn.",
            "nNkkNpNkkNn.",
            "nNNNsNNNsNn.",
            ".nNNNNNNNn.t",
            "..nNsNNNNntt",
            "..nNNNNNNnt.",
            "..d.d..d.d..",
        ],
        'fx': 'thorn', 'fxcol': ('#f0c8ff', '#9a6ad0'), 'accent': '#c8a0f0',
    },
    'meteor_kaplumbaga': {  # kabugu kizgin catlakli meteor tasi olan kaplumbaga
        'pal': {'r': '#3a3036', 'R': '#5a4a4e', 'o': '#ffb040', 'g': '#6a8ab0', 'G': '#9ab8d8', 'w': '#ffffff',
                'k': '#100c14'},
        'map': [
            "...rrrrrr....",
            "..rRoRRRRr...",
            ".rRRRRoRRRr..",
            ".rRoRRRRRoRgg",
            "rrrrrrrrrrgwk",
            ".gGGGGGGGGgkk",
            ".gg.gg..gg.g.",
        ],
        'fx': 'slam', 'accent': '#ffb040',
    },
    'takimyildiz_geyigi': {  # boynuzlari takimyildiz gibi parlayan lacivert geyik (nadir)
        'pal': {'y': '#ffd04d', 'Y': '#fff0a0', 'b': '#2a3478', 'B': '#4a5ab8', 's': '#fff0a0', 'w': '#ffffff',
                'k': '#100c14', 'p': '#e07ab0', 'd': '#1a2050'},
        'map': [
            "y.y....y.y..",
            ".yY....Yy...",
            "..YyyyyY....",
            "...bbbb.....",
            "..bwkbb.....",
            "..bkkbbbbbb.",
            "..bpbBBsBBbb",
            "...bBBBBsBBb",
            "....bBBBBBb.",
            "....b.b.b.b.",
            "....d.d.d.d.",
        ],
        'fx': 'star', 'accent': '#fff0a0',
    },
})
SPECIES['kadim_bonk'] = boss_kadim()


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


def soft_ink(c):
    """Yumusak dis cizgi (0.8.6): duz siyah yerine govde renginin koyusu.
    Koyu parcalarda neredeyse siyah kalir, acik parcalarda renkli ve yumusak durur."""
    r, g, b = c[:3]
    return (int(INK[0] * 0.55 + r * 0.45 * 0.42), int(INK[1] * 0.55 + g * 0.45 * 0.42), int(INK[2] * 0.55 + b * 0.45 * 0.42), 255)


def rounded(px):
    """Merdiven gibi duran sivri dis koseleri yumusat: iki komsusu da bos olan
    (cikinti yapan) kose pikseli silinir. Sadece buyuk duz parcalarda, ince
    ayrintilara (kulak ucu, bacak, anten) dokunmaz."""
    out = dict(px)
    for (x, y), c in px.items():
        for dx, dy in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
            if (x + dx, y) in px or (x, y + dy) in px:
                continue
            # kosenin ic tarafi dolu ve ayni renkte olmali (2x2 texelin kosesi)
            if px.get((x - dx, y)) == c and px.get((x, y - dy)) == c and px.get((x - dx, y - dy)) == c \
                    and (x - 2 * dx, y) in px and (x, y - 2 * dy) in px:
                out.pop((x, y), None)
                break
    return out


def outlined(px):
    out = dict(px)
    for (x, y), c in px.items():
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in px:
                k = soft_ink(c)
                if n not in out or sum(k[:3]) < sum(out[n][:3]):
                    out[n] = k
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
    parts = [(shaded(rounded(pix)) if i < 3 else pix, ox, oy) for i, (pix, ox, oy) in enumerate(parts)]
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
        col = hx(fxcol[0]) if fxcol else hx('#f4e070')
        d = (t - 2) * 4
        for r in (3, 6):
            for yy in range(-r, r + 1):
                xx = -int((r * r - yy * yy) ** 0.5)
                pts[(xx - 3 - d, mid + yy)] = col
    elif kind == 'beam' and t >= 2:
        col, col2 = (hx(fxcol[0]), hx(fxcol[1])) if fxcol else (hx('#c8e6f8'), hx('#f0faff'))
        L = 6 + (t - 2) * 6
        for dx in range(L):
            pts[(-2 - dx, mid - 4)] = col
            pts[(-2 - dx, mid - 3)] = col2
            pts[(-2 - dx, mid - 2)] = col
    elif kind == 'wind' and t >= 2:
        col, col2 = (hx(fxcol[0]), hx(fxcol[1])) if fxcol else (hx('#e8d098'), hx('#c8a060'))
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
    # Plan v2: yeni cizime gecmis turler (v: 2) tools/gen_glemons2.py ile uretilir; dosyalarina ve
    # glemons.json kayitlarina dokunulmaz.
    v2 = {}
    jp = os.path.join(out, 'glemons.json')
    if os.path.exists(jp):
        v2 = {k: v for k, v in json.load(open(jp)).items() if v.get('v') == 2}
    for key, base in SPECIES.items():
        if key in v2:
            allmeta[key] = v2[key]
            continue
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
