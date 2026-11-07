"""Glemon sprite ureticisi.

Kullanim: python3 tools/gen_glemons.py assets/glemons [onizleme.png]

Kurallar (Oyun Tasarim Belgesi, bolum 16):
- 1 texel = 2x2 piksel (karakterlerin yuz izgarasi gibi)
- 0.3 (Eren, 2026-11-07): daha fazla ton, soluk renkler. Renkler biraz soldurulur ve
  her parca 1 piksellik isik/golge alir: sol-ust kenar acik, sag-alt kenar koyu,
  govdenin alt kismi hafif koyu. Kucuk parcalar (goz, agiz) duz kalir.
- 1 piksel siyaha yakin dis cizgi (karakterlerin cizgisi gibi)
- Glemonlar onden ya da 3/4 onden sola bakar (savas ekrani oyuncunun sirtindan bakar)
Cikti: her Glemon icin <anim>.png ve <anim>_parlak.png yatay seritleri + glemons.json
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
