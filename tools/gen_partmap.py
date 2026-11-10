"""Karakter atlaslari icin "parca haritasi" uretir (0.8.9: ekipman ustunde gorunsun).

Kullanim: python3 tools/gen_partmap.py [assets/chars]

Her karakter klasorune parts.png yazar. Atlasla ayni boyda; her piksel:
  R = parca: 0 yok, 1 kask, 2 goguslik, 3 bot, 4 kilic agzi, 5 kazma ucu, 6 yay
  G = ton: 0 koyu, 1 orta, 2 acik, 3 parlak (oyunda malzemenin renk rampasindan secilir)
Oyun (src/gear.js) giyilen esyaya gore bu pikselleri o malzemenin renkleriyle boyar,
boylece kask sacin, goguslik tisortun, bot ayakkabinin yerine gecer; 44 animasyonun
hepsinde ve her gorunuste (yandan, 3/4 onden, arkadan) kendiliginden dogru yerde durur.

Kural: kafa ust 16 satir, govde sonraki 10, bot en alttaki 6 satir (ayak ortasina gore).
Ten rengi (yuz, el) ve siyah dis cizgi hic boyanmaz. Yuzdeki goz ve agiz (iki yaninda ten
olan pikseller) kaskla kaplanmaz.
"""
import colorsys, json, os, sys
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'assets/chars'
HEAD, TORSO = 16, 10          # satir sayilari (kafanin tepesinden itibaren)
BOOT_FROM = 28                # tepeden bu satirdan sonrasi bot
ITEM_ANIMS = {'stab': 4, 'spin': 4, 'mine': 5, 'bowshot': 6}
BASE_ANIMS = ['idle', 'walk', 'run', 'idlesway', 'hurt', 'sit', 'wave', 'clap', 'cheer', 'punch', 'jump']


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def is_outline(p):
    return p[0] == 0 and p[1] == 0 and p[2] == 0


def frame_img(atlas, fr):
    f = fr['frame']
    return atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def skin_model(atlas, frames):
    """Onden durus karesinin yuz bolgesinden ten rengini bulur."""
    fr = frames['idle/0']
    img = frame_img(atlas, fr)
    ss = fr['spriteSourceSize']
    cx = fr['pivot']['x'] * fr['sourceSize']['w'] - ss['x']
    top = min(y for y in range(img.height) for x in range(img.width) if img.getpixel((x, y))[3])
    count = {}
    for y in range(top + 6, top + 16):
        for x in range(int(cx) - 6, int(cx) + 6):
            p = img.getpixel((x, y))
            if p[3] and not is_outline(p):
                count[p[:3]] = count.get(p[:3], 0) + 1
    # yuzde en cok gecen acik ve renkli ton ten rengidir (sac daha koyu)
    for vmin in (0.6, 0.45):
        cand = [(n, c) for c, n in count.items()
                if colorsys.rgb_to_hsv(*[v / 255 for v in c])[2] > vmin and colorsys.rgb_to_hsv(*[v / 255 for v in c])[1] > 0.08]
        if cand:
            c = max(cand)[1]
            return colorsys.rgb_to_hsv(*[v / 255 for v in c])
    return None


def is_skin(p, sk):
    if not sk:
        return False
    h, s, v = colorsys.rgb_to_hsv(*[c / 255 for c in p[:3]])
    dh = min(abs(h - sk[0]), 1 - abs(h - sk[0]))
    return dh < 0.05 and abs(s - sk[1]) < 0.16 and v > sk[2] * 0.68


def base_palette(atlas, frames):
    pal = set()
    for name, fr in frames.items():
        if name.split('/')[0].replace('b_', '') in BASE_ANIMS:
            img = frame_img(atlas, fr)
            for p in img.get_flattened_data() if hasattr(img, 'get_flattened_data') else img.getdata():
                if p[3]:
                    pal.add(p[:3])
    return pal


def process(char_dir):
    atlas = Image.open(os.path.join(char_dir, 'atlas.png')).convert('RGBA')
    frames = json.load(open(os.path.join(char_dir, 'atlas.json')))['frames']
    sk = skin_model(atlas, frames)
    pal = base_palette(atlas, frames)
    out = Image.new('RGBA', atlas.size, (0, 0, 0, 0))
    O = out.load()
    stats = {}
    for name, fr in frames.items():
        anim = name.split('/')[0].replace('b_', '')
        img = frame_img(atlas, fr)
        W, H = img.size
        P = img.load()
        ss = fr['spriteSourceSize']
        fx, fy = fr['frame']['x'], fr['frame']['y']
        cx = fr['pivot']['x'] * fr['sourceSize']['w'] - ss['x']
        item = ITEM_ANIMS.get(anim)
        # esya pikselleri: temel paletinde olmayan renkler ya da govde disinda kalanlar
        is_item = [[False] * W for _ in range(H)]
        if item:
            for y in range(H):
                for x in range(W):
                    p = P[x, y]
                    if p[3] and not is_outline(p) and (p[:3] not in pal or abs(x - cx) > 8) and not is_skin(p, sk):
                        is_item[y][x] = True
        # kafanin tepesi: orta sutunlardaki en ust govde pikseli
        top = None
        for y in range(H):
            if any(P[x, y][3] and not is_item[y][x] for x in range(max(0, int(cx) - 6), min(W, int(cx) + 7))):
                top = y
                break
        if top is None:
            continue
        part = [[0] * W for _ in range(H)]
        for y in range(H):
            for x in range(W):
                p = P[x, y]
                if not p[3] or is_outline(p):
                    continue
                if is_item[y][x]:
                    part[y][x] = item
                    continue
                if is_skin(p, sk):
                    continue
                d = y - top
                if d < 0:
                    continue
                if d < HEAD:
                    # yuz ozellikleri (goz, agiz): iki yaninda da ten var
                    l = any(x - k >= 0 and P[x - k, y][3] and is_skin(P[x - k, y], sk) for k in (1, 2))
                    r = any(x + k < W and P[x + k, y][3] and is_skin(P[x + k, y], sk) for k in (1, 2))
                    if l and r:
                        continue
                    part[y][x] = 1
                elif d < HEAD + TORSO and d < BOOT_FROM:
                    part[y][x] = 2
                elif d >= BOOT_FROM:
                    part[y][x] = 3
        # ton: ustu bos ise acik, alti/sagi bos ise koyu; esyada orijinal parlaklik
        for y in range(H):
            for x in range(W):
                k = part[y][x]
                if not k:
                    continue
                def other(xx, yy):
                    return not (0 <= xx < W and 0 <= yy < H) or part[yy][xx] != k
                if k >= 4:
                    L = lum(P[x, y])
                    t = 0 if L < 70 else 1 if L < 140 else 2 if L < 210 else 3
                else:
                    t = 1
                    if other(x, y - 1):
                        t = 2
                    if other(x, y + 1) or other(x + 1, y):
                        t = 0
                    if t == 2 and (x + y) % 5 == 0:
                        t = 3
                O[fx + x, fy + y] = (k * 40, t * 80, 0, 255)
                stats[k] = stats.get(k, 0) + 1
    out.save(os.path.join(char_dir, 'parts.png'), optimize=True)
    return sk, stats


for ch in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, ch)
    if os.path.isfile(os.path.join(d, 'atlas.png')):
        sk, stats = process(d)
        print(ch, 'ten', tuple(round(c, 2) for c in sk) if sk else None, stats)
