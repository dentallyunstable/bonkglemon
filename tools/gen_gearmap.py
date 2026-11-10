"""Karakter atlaslari icin "ekipman katmani haritasi" uretir (0.10.1, Eren'in istegi).

Kullanim: python3 tools/gen_gearmap.py [assets/chars]

0.8.9'da ekipman, skinin kendi piksellerini boyuyordu (kask saci yesile boyuyordu).
Eren skinin degismemesini, zirhin skinin USTUNE ayri bir piksel katmani olarak
cizilmesini istedi. Bu arac her karakter klasorune iki dosya yazar:

  gear.json  her kare icin 2 piksel bosluklu yeni bir atlas yerlesimi (zirh siluetin
             disina 1 piksel tasabilsin diye) ve karenin orijinal atlastaki yeri
  gear.png   ayni yerlesimde zirh katmaninin sekli:
             R = parca x30: 1 kask, 2 goguslik, 3 bot, 4 kilic agzi, 5 kazma ucu, 6 yay,
                 7 pelerin ustu, 8 pelerin etegi
             G = ton x80 (0 koyu .. 3 parlak), B = 255 ise dis cizgi

Oyun (src/gear.js) karakteri bu yerlesime kopyalar ve sadece giyili esyalarin
katmanini malzemenin renkleriyle ustune cizer. Kask kafanin tepesine oturan bir
baslik, goguslik govdenin ortasinda omuzluklu bir zirh (kollar ve tisort gorunur),
bot ayagin ustunde konclu bir cizme, pelerin arkadan sirtta. Kilic, kazma ve yay
animasyonun icinde cizili oldugu icin onlar eskisi gibi esyanin renginde boyanir.
"""
import colorsys, json, os, sys
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'assets/chars'
PAD = 2
ITEM_ANIMS = {'stab': 4, 'spin': 4, 'mine': 5, 'bowshot': 6}
BASE_ANIMS = ['idle', 'walk', 'run', 'idlesway', 'hurt', 'sit', 'wave', 'clap', 'cheer', 'punch', 'jump']
# kafanin tepesinden satirlar (karakterler 34 piksel: kafa 0-16, govde 17-26, bacak 27-32)
CAP = (-1, 4)        # kask: tepeden 1 satir yukaridan 4. satira
CAP_BACK = (-1, 9)   # arkadan kask daha asagi iner
GUARD = 10           # yanliklar bu satira kadar iner
CHEST = (17, 25)     # goguslik (25: kemer)
SHOULDER = (17, 18)  # omuzluk satirlari (kollarin ustune tasar)
BOOT = (29, 32)      # bot (29: konc)
CAPE = (17, 31)      # pelerin (arkadan)


def is_outline(p):
    return p[0] == 0 and p[1] == 0 and p[2] == 0


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def frame_img(atlas, fr):
    f = fr['frame']
    return atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def skin_model(atlas, frames):
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
    for vmin in (0.6, 0.45):
        cand = [(n, c) for c, n in count.items()
                if colorsys.rgb_to_hsv(*[v / 255 for v in c])[2] > vmin and colorsys.rgb_to_hsv(*[v / 255 for v in c])[1] > 0.08]
        if cand:
            return colorsys.rgb_to_hsv(*[v / 255 for v in max(cand)[1]])
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
            for p in frame_img(atlas, fr).getdata():
                if p[3]:
                    pal.add(p[:3])
    return pal


def process(char_dir):
    atlas = Image.open(os.path.join(char_dir, 'atlas.png')).convert('RGBA')
    frames = json.load(open(os.path.join(char_dir, 'atlas.json')))['frames']
    sk = skin_model(atlas, frames)
    pal = base_palette(atlas, frames)
    # yeni yerlesim: raf raf, her kare 2 piksel bosluklu
    names = sorted(frames, key=lambda n: -frames[n]['frame']['h'])
    AW = 2048
    lay = {}
    x = y = shelf = 0
    for n in names:
        f = frames[n]['frame']
        w, h = f['w'] + 2 * PAD, f['h'] + 2 * PAD
        if x + w > AW:
            x, y, shelf = 0, y + shelf, 0
        lay[n] = (x, y, w, h)
        x += w
        shelf = max(shelf, h)
    AH = y + shelf
    out = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
    O = out.load()
    cout = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))   # pelerin ayri katman (goguslugun ustune)
    CO = cout.load()
    meta = {}
    stats = {}
    for name, fr in frames.items():
        anim = name.split('/')[0]
        back = anim.startswith('b_') or anim == 'walkin'
        item = ITEM_ANIMS.get(anim.replace('b_', ''))
        img = frame_img(atlas, fr)
        W, H = img.size
        P = img.load()
        ss = fr['spriteSourceSize']; so = fr['sourceSize']
        lx, ly, lw, lh = lay[name]
        meta[name] = {
            'frame': {'x': lx, 'y': ly, 'w': lw, 'h': lh}, 'rotated': False, 'trimmed': True,
            'spriteSourceSize': {'x': ss['x'], 'y': ss['y'], 'w': lw, 'h': lh},
            'sourceSize': {'w': so['w'] + 2 * PAD, 'h': so['h'] + 2 * PAD},
            'pivot': {'x': (fr['pivot']['x'] * so['w'] + PAD) / (so['w'] + 2 * PAD), 'y': (fr['pivot']['y'] * so['h'] + PAD) / (so['h'] + 2 * PAD)},
            'src': {'x': fr['frame']['x'], 'y': fr['frame']['y'], 'w': W, 'h': H},
        }
        cx = fr['pivot']['x'] * so['w'] - ss['x']
        opaque = lambda xx, yy: 0 <= xx < W and 0 <= yy < H and P[xx, yy][3] > 0
        is_item = [[False] * W for _ in range(H)]
        if item:
            for yy in range(H):
                for xx in range(W):
                    p = P[xx, yy]
                    if p[3] and not is_outline(p) and (p[:3] not in pal or abs(xx - cx) > 8) and not is_skin(p, sk):
                        is_item[yy][xx] = True
        top = None
        for yy in range(H):
            if any(P[xx, yy][3] and not is_item[yy][xx] for xx in range(max(0, int(cx) - 6), min(W, int(cx) + 7))):
                top = yy
                break
        if top is None:
            continue
        # karede (bosluklu koordinatlarda) her parca icin bir maske
        GW, GH = W + 2 * PAD, H + 2 * PAD
        part = [[0] * GW for _ in range(GH)]
        cpart = [[0] * GW for _ in range(GH)]
        body = lambda xx, yy: opaque(xx, yy) and not is_item[yy][xx]
        near = lambda xx, yy: any(body(xx + a, yy + b) for a in (-1, 0, 1) for b in (-1, 0, 1))

        def span(yy):
            xs = [xx for xx in range(W) if body(xx, yy)]
            return (min(xs), max(xs)) if xs else None

        def put(k, xx, yy):
            gx, gy = xx + PAD, yy + PAD
            M = cpart if k >= 7 else part
            if 0 <= gx < GW and 0 <= gy < GH and (M[gy][gx] == 0 or k > M[gy][gx]):
                M[gy][gx] = k

        # kask: kafanin tepesini saran bir baslik. Ustte 1 piksel tasar, yanlarda yanaklik
        # olarak asagi iner, on yuz (gozler) acik kalir. Arkadan butun ense kapali.
        c0, c1 = CAP_BACK if back else CAP
        hs = span(min(H - 1, top + 2))
        for d in range(-1, GUARD + 1):
            yy = top + d
            sp = span(max(top, min(H - 1, yy)))
            if not sp or not hs:
                continue
            a, b = min(sp[0], hs[0]) - 1, max(sp[1], hs[1]) + 1
            for xx in range(a, b + 1):
                if d == -1 and xx in (a, b):
                    continue                                  # yuvarlak ust koseler
                if d > c1 and a + 2 < xx < b - 2:
                    continue                                  # yuz acik, sadece yanlik
                if d > c1 and not back and a + 3 < xx < b - 3:
                    continue
                if near(xx, yy) or d < 0:
                    put(1, xx, yy)
        # govde genisligi: genis (onden/arkadan) mi dar (yandan) mi
        sp = span(min(H - 1, top + 20))
        wide = sp and sp[1] - sp[0] >= 12
        # goguslik: govdenin ortasi, omuzlarda kollarin ustune tasar
        for d in range(CHEST[0], CHEST[1] + 1):
            yy = top + d
            if yy >= H:
                break
            s2 = span(yy)
            if not s2:
                continue
            if wide:
                a, b = (s2[0] - 1, s2[1] + 1) if SHOULDER[0] <= d <= SHOULDER[1] else (int(round(cx)) - 6, int(round(cx)) + 5)
            else:
                a, b = s2[0] - 1, s2[1] + 1
            for xx in range(a, b + 1):
                if near(xx, yy):
                    put(2, xx, yy)
        # bot: ayaklar, yanlara 1 piksel
        for d in range(BOOT[0], BOOT[1] + 1):
            yy = top + d
            if yy >= H:
                break
            for xx in range(-1, W + 1):
                if body(xx, yy) or (body(xx - 1, yy) or body(xx + 1, yy)) and d > BOOT[0]:
                    put(3, xx, yy)
        # pelerin: sadece arkadan, sirtin ortasi asagi dogru genisler
        if back and wide:
            for d in range(CAPE[0], CAPE[1] + 1):
                yy = top + d
                if yy >= H + 1:
                    break
                grow = (d - CAPE[0]) // 5
                for xx in range(int(round(cx)) - 6 - grow, int(round(cx)) + 6 + grow):
                    if near(xx, yy) or near(xx, yy - 1):
                        put(7 if d < CHEST[1] else 8, xx, yy)
        # silah pikselleri: orijinal yerinde boyanir
        for yy in range(H):
            for xx in range(W):
                if is_item[yy][xx]:
                    part[yy + PAD][xx + PAD] = item
        # tonlar ve dis cizgi
        def shade(M, OUT):
            for gy in range(GH):
                for gx in range(GW):
                    k = M[gy][gx]
                    if not k:
                        continue
                    if 4 <= k <= 6:
                        L = lum(P[gx - PAD, gy - PAD])
                        t = 0 if L < 70 else 1 if L < 140 else 2 if L < 210 else 3
                        OUT[lx + gx, ly + gy] = (k * 30, t * 80, 0, 255)
                        continue
                    same = lambda a, b: 0 <= a < GW and 0 <= b < GH and (M[b][a] == k or (k in (7, 8) and M[b][a] in (7, 8)))
                    if not all(same(gx + a, gy + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        OUT[lx + gx, ly + gy] = (k * 30, 0, 255, 255)
                        continue
                    d = gy - PAD - top
                    t = 1
                    if not same(gx, gy - 2):
                        t = 2                                   # ust kenar acik
                    if not same(gx, gy + 2) or not same(gx + 2, gy):
                        t = 0                                   # alt / sag kenar koyu
                    if k == 1 and d == (CAP_BACK if back else CAP)[1] - 1:
                        t = 0                                   # kask kenari
                    if k == 2 and d == CHEST[1] - 1:
                        t = 0                                   # kemer
                    if k == 2 and wide and not back and abs(gx - PAD - cx + 0.5) < 0.6 and d > SHOULDER[1]:
                        t = 0                                   # gogus ortasi cizgi
                    if k == 3 and d == BOOT[0] + 1:
                        t = 3                                   # konc
                    if k in (7, 8) and (gx + 1) % 3 == 0 and d > CAPE[0] + 2:
                        t = 0                                   # pelerin kivrimlari
                    if t == 2 and (gx + gy) % 4 == 0:
                        t = 3
                    OUT[lx + gx, ly + gy] = (k * 30, t * 80, 0, 255)
                    stats[k] = stats.get(k, 0) + 1
        shade(part, O)
        shade(cpart, CO)
    out.save(os.path.join(char_dir, 'gear.png'), optimize=True)
    cout.save(os.path.join(char_dir, 'cape.png'), optimize=True)
    json.dump({'frames': meta, 'meta': {'size': {'w': AW, 'h': AH}, 'pad': PAD}}, open(os.path.join(char_dir, 'gear.json'), 'w'))
    return stats


for ch in sorted(os.listdir(ROOT)):
    d = os.path.join(ROOT, ch)
    if os.path.isfile(os.path.join(d, 'atlas.png')):
        print(ch, process(d))
