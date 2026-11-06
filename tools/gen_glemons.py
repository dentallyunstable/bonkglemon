"""Glemon sprite ureticisi.

Kullanim: python3 tools/gen_glemons.py assets/glemons [onizleme.png]

Kurallar (Oyun Tasarim Belgesi, bolum 16):
- 1 texel = 2x2 piksel (karakterlerin yuz izgarasi gibi)
- her renk icin birkac ton, 1 piksel dis cizgi = komsu rengin cok koyusu
- Glemonlar sola bakar (oyuncu solda durur)
Cikti: her Glemon icin <anim>.png ve <anim>_parlak.png yatay seritleri + glemons.json
"""
import colorsys, json, os, random, sys
from PIL import Image

ANIMS = ['durma', 'yurume', 'saldiri', 'hasar']


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


# ---------------------------------------------------------------- texel haritalari
SPECIES = {
    'kutukcuk': {
        'pal': {'m': '#7cc04a', 'M': '#4f8f2e', 'T': '#f4e2b8', 't': '#e4c48e', 'q': '#c99e66',
                'A': '#e0953f', 'a': '#c4742e', 'b': '#9c5626', 'B': '#7a3f1c', 'g': '#5c2c14',
                'w': '#ffffff', 'k': '#1b1b1b', 'p': '#ec9478', 'o': '#4a2010', 'l': '#5c2c14'},
        'map': [
            "...m.Mm...",
            "..TTtTTq..",
            ".TtqqtTTq.",
            "qtTTTTttTq",
            "BqttTTttqa",
            "BbbaAAAaaa",
            "BgbaAAgaaa",
            "BgwkaAwkaa",
            "BbkkaAkkaa",
            "BbpaooAapa",
            "BgbaAAgaga",
            "BgbaAAgaga",
            "BbbaAAgaaa",
            "BbgaAAaaga",
            ".BbbaaaaA.",
            ".ll....ll.",
        ],
        'fx': 'star',
    },
    'patlakmantar': {
        'pal': {'C': '#f0665a', 'c': '#d8433b', 'd': '#b5332e', 'D': '#8a2423', 'w': '#fff6e6',
                'W': '#e9d3b8', 's': '#f4e8cc', 'S': '#dccaa2', 'z': '#c2ab80', 'u': '#b89a78',
                'k': '#1b1b1b', 'o': '#5a3a2a', 'p': '#f0a0a0', 'l': '#a8946c'},
        'map': [
            "...cCCc...",
            ".cCwWCCcc.",
            "cCCWwcCwdc",
            "cwccccdWdD",
            "dWcdcddddD",
            "DDuuuuuuDD",
            "..ssssSz..",
            "..wkswkSz.",
            "..psooSpz.",
            "..ssssSzz.",
            "..ll..ll..",
        ],
        'fx': 'spores',
    },
    'dikentavsan': {
        'pal': {'H': '#a6d47a', 'g': '#7fb05a', 'G': '#5d8c42', 'e': '#e8a0a8', 't': '#d9c48a',
                'T': '#9c8550', 'c': '#ece6c8', 'w': '#ffffff', 'k': '#1b1b1b', 'p': '#e88a9a',
                'l': '#44692f'},
        'map': [
            "..Hg.Hg.....",
            "..He.He.....",
            "..ge.ge..t.t",
            ".gHHggg.tTtT",
            "gHwkgggHgTgT",
            "ggkkgggHgggg",
            "pggcggggggGc",
            ".gcccgggGGcc",
            "..ccgggGGGc.",
            "..ll..lll...",
        ],
        'fx': 'thorn',
    },
    'yaprakbocek': {
        'pal': {'a': '#2c3a1f', 'h': '#6a9440', 'j': '#476a2c', 'H': '#a6e07a', 'L': '#6cc24a',
                'N': '#4f9f38', 'D': '#3a7a2c', 'v': '#c8f09a', 'k': '#1b1b1b', 'w': '#ffffff',
                'o': '#1f2a14', 'l': '#2c3a1f'},
        'map': [
            ".a..a.......",
            "..a.a.HHLL..",
            ".jhhhHHvLLN.",
            "jwkhhHLLvLNN",
            "jkkhjLvLLNND",
            ".jojDNNNNDD.",
            "..l.l.l.l...",
        ],
        'fx': 'leaf',
    },
    'yosunbaba': {
        'pal': {'n': '#93cc5c', 'm': '#6fae45', 'M': '#4d8a30', 'h': '#c2c4ba', 's': '#9a9c94',
                'S': '#76786f', 'D': '#5a5c55', 'b': '#f0f0e4', 'k': '#1b1b1b', 'w': '#ffffff',
                'l': '#5a5c55'},
        'map': [
            "...nmmn...",
            "..nmMmmn..",
            ".shhsssSS.",
            "shbbsbbSSD",
            "shkwskwsSD",
            "ssssssssSD",
            "snmnmmnmMD",
            ".nmMmnmMM.",
            "..mMnmMm..",
            "...mMmM...",
            "..l....l..",
        ],
        'fx': 'heal',
    },
}


def boss_agacbasi():
    """Agacbasi: tepesi yaprak, govdesi kizgin yuzlu kutuk, dal kollu dev agac."""
    rnd = random.Random(7)
    W, H = 26, 34
    grid = [['.'] * W for _ in range(H)]
    leaf = ['L1', 'L2', 'L3', 'L4']
    # yaprak tacı (elips)
    cx, cy, rx, ry = 13, 8, 12.5, 8.5
    for y in range(H):
        for x in range(W):
            d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
            if d <= 1 and rnd.random() > (0.18 if d > 0.82 else 0):
                shade = 0.55 * (y / (cy + ry)) + 0.35 * (x / W) + rnd.uniform(-0.25, 0.25)
                grid[y][x] = leaf[max(0, min(3, int((1 - shade) * 4)))]
    # govde
    for y in range(12, 31):
        for x in range(7, 19):
            if (y < 14 and (x < 8 or x > 17)):
                continue
            t = 'B1' if x <= 8 else ('B3' if x >= 16 else 'B2')
            if x in (10, 14) and rnd.random() < 0.55:
                t = 'G'
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
    pal = {'L1': '#8fd05a', 'L2': '#6cb844', 'L3': '#4f9a34', 'L4': '#3a7a28', 'B1': '#a8693a',
           'B2': '#8a5430', 'B3': '#6a3c20', 'G': '#4e2a14', 'k': '#1b1b1b', 'Y': '#ffd34d',
           'o': '#2e160a', 'w': '#f4ecd8', 'l': '#5c3218'}
    # tek harfli haritaya cevir
    keymap = {k: chr(65 + i) for i, k in enumerate(pal)}
    keymap['l'] = 'l'
    rows = [''.join('.' if c == '.' else keymap[c] for c in r) for r in grid]
    return {'pal': {keymap[k]: v for k, v in pal.items()}, 'map': rows, 'fx': 'slam', 'boss': True}


SPECIES['agacbasi'] = boss_agacbasi()


# ---------------------------------------------------------------- cizim
def texel_layer(rows, pal, only=None, skip=None, shiny_on=False):
    px = {}
    for ty, row in enumerate(rows):
        for tx, ch in enumerate(row):
            if ch == '.' or (only and ch not in only) or (skip and ch in skip):
                continue
            c = hx(pal[ch])
            if shiny_on:
                c = shiny(c)
            for dy in (0, 1):
                for dx in (0, 1):
                    px[(tx * 2 + dx, ty * 2 + dy)] = c
    return px


def outlined(px):
    out = dict(px)
    for (x, y), c in px.items():
        dark = tuple(int(v * 0.28) for v in c[:3]) + (255,)
        for n in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if n not in px:
                prev = out.get(n)
                if prev is None or sum(dark[:3]) < sum(prev[:3]):
                    out[n] = dark
    return out


def render(size, parts, flash=False):
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


def fx_pixels(kind, t, h):
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
        col, col2 = hx('#c9e05a'), hx('#8fb33a')
        d = (t - 2) * 4
        for i, (sx, sy) in enumerate(((-2, 4), (-4, 8), (-1, 1), (-5, 5), (-3, 11))):
            c = col if i % 2 else col2
            pts[(sx - d - (i % 2), sy + (i % 3) - 1)] = c
            pts[(sx - d - (i % 2) - 1, sy + (i % 3) - 1)] = c
    elif kind == 'thorn' and t >= 2:
        col = hx('#d9c48a')
        d = (t - 2) * 7
        for dx in range(5):
            pts[(-4 - d + dx, mid - 3)] = col
        pts[(-5 - d, mid - 3)] = hx('#9c8550')
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
        col, col2 = hx('#8a5430'), hx('#ffe14d')
        for i in range(8):
            pts[(-6 - i, h - 2 - (i % 3))] = col
        for dx, dy in ((0, 0), (1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0)):
            pts[(-12 + dx, h - 6 + dy)] = col2
    return pts


def frames_for(sp, shiny_on):
    rows, pal = sp['map'], sp['pal']
    w, h = len(rows[0]) * 2, len(rows) * 2
    pad_l = 20 if sp.get('boss') else 16
    cw, ch = w + pad_l + 6, h + 6
    body = texel_layer(rows, pal, skip='l', shiny_on=shiny_on)
    legs_rows = [r if 'l' in r else '.' * len(r) for r in rows]
    legs = texel_layer(legs_rows, pal, only='l', shiny_on=shiny_on)
    legL = {k: v for k, v in legs.items() if k[0] < w // 2}
    legR = {k: v for k, v in legs.items() if k[0] >= w // 2}
    bx, by = pad_l, ch - h - 2

    def f(dx=0, bob=0, lup=0, rup=0, t=-1, flash=False):
        parts = [(legL, bx + dx, by - lup), (legR, bx + dx, by - rup), (body, bx + dx, by + bob)]
        if t >= 0:
            parts.append((fx_pixels(sp['fx'], t, h), bx + dx, by + bob))
        return render((cw, ch), parts, flash)

    anims = {
        'durma': [(f(), 500), (f(bob=1), 500)],
        'yurume': [(f(lup=1), 160), (f(bob=1), 160), (f(rup=1), 160), (f(bob=1), 160)],
        'saldiri': [(f(dx=2), 180), (f(dx=3, bob=1), 120), (f(dx=-3, t=2), 90),
                    (f(dx=-4, t=3), 110), (f(dx=-2, t=4), 120), (f(), 200)],
        'hasar': [(f(dx=2, flash=True), 90), (f(dx=3), 110), (f(dx=1, flash=True), 90), (f(), 250)],
    }
    meta = {'w': cw, 'h': ch, 'ax': bx + w // 2, 'ay': by + h, 'bodyW': w, 'bodyH': h}
    return anims, meta


def main(out, preview=None):
    os.makedirs(out, exist_ok=True)
    allmeta = {}
    sheets = []
    for key, sp in SPECIES.items():
        d = os.path.join(out, key)
        os.makedirs(d, exist_ok=True)
        info = None
        for sh in (False, True):
            anims, meta = frames_for(sp, sh)
            info = meta
            info['anims'] = {}
            for an, frames in anims.items():
                strip = Image.new('RGBA', (meta['w'] * len(frames), meta['h']), (0, 0, 0, 0))
                for i, (im, _) in enumerate(frames):
                    strip.paste(im, (i * meta['w'], 0))
                strip.save(os.path.join(d, f"{an}{'_parlak' if sh else ''}.png"), optimize=True)
                info['anims'][an] = [dur for _, dur in frames]
                if an == 'durma':
                    sheets.append(frames[0][0])
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
        pv.resize((W * 4, H * 4), Image.NEAREST).save(preview)
    print('ok', list(allmeta))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
