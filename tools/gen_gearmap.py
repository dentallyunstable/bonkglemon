"""Karakter atlaslari icin "ekipman katmani haritasi" uretir (0.13.1, Eren'in istegi).

Kullanim: python3 tools/gen_gearmap.py [assets/chars]

Eren (2026-11-10): zirh animasyonu yeniden boyamasin, karakterin USTUNE eklensin ve her
bakis acisina uysun (3/4 onden bakarken kask da 3/4 durmali). Eldeki esyalar (cimen blogu,
iksir, kilic...) asla boyanmasin. Aletler sadece kendi animasyonunda degissin: kazma sadece
kazarken, kilic sadece kilic hareketlerinde, yay sadece ok atarken.

Bu yuzden her karede once kafa kutusu bulunur (chibi kafasi sabit boyutlu bir kutu), sonra
bakis acisina gore (anims.json'daki view) kask bir sablondan cizilir:
  34      : kafanin yan yuzu tamamen kapali, on yuzde ustte bant + iki yanak koruyucu, yuz acik
  side    : on taraftaki yuz acik, gerisi kapali
  34back / back : butun kafa kapali
Goguslik govdeyi (omuzlar dahil) kaplar, bot ayaklari; ikisi de eldeki esyalarin ustune cizilmez.

  gear.json  her kare icin 2 piksel bosluklu yeni bir atlas yerlesimi ve karenin orijinal yeri
  gear.png   ayni yerlesimde katmanin sekli:
             R = parca x30: 1 kask, 2 goguslik, 3 bot, 4 kilic agzi, 5 kazma ucu, 6 yay,
                 7 pelerin ustu, 8 pelerin etegi
             G = ton x80 (0 koyu .. 3 parlak), B = 255 ise dis cizgi
  cape.png   pelerin katmani (goguslugun ustune)
"""
import colorsys, json, os, sys
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'assets/chars'
PAD = 2
# alet sadece kendi animasyonunun karelerinde boyanir
TOOL_ANIMS = {'stab': 4, 'spin': 4, 'b_stab': 4, 'b_spin': 4, 'mine': 5, 'bowshot': 6, 'b_bowshot': 6}
BASE_ANIMS = ['idle', 'walk', 'run', 'idlesway', 'hurt', 'sit', 'wave', 'clap', 'cheer', 'punch', 'jump']
HEAD_H = 17        # kafa kutusu: ust cizgi + 16 satir (alt cizgi 17. satir)
HEAD_MIN_W = 14    # kafa satiri en az bu kadar genis bir parca
HELM_LOW = 13      # kaskin yanlari bu satira kadar iner
BAND = 7           # on yuzde ust bant bu satira kadar
TORSO = (18, 26)   # goguslik satirlari (kafa ustunden)
SHOULDER = (18, 20)
BOOT_ROWS = 3
CAPE = (17, 31)


def is_outline(p):
    return p[0] == 0 and p[1] == 0 and p[2] == 0


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def hsv(p):
    return colorsys.rgb_to_hsv(*[c / 255 for c in p[:3]])


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
        cand = [(n, c) for c, n in count.items() if hsv(c)[2] > vmin and hsv(c)[1] > 0.08]
        if cand:
            return hsv(max(cand)[1])
    return None


def is_skin(p, sk):
    if not sk:
        return False
    h, s, v = hsv(p)
    dh = min(abs(h - sk[0]), 1 - abs(h - sk[0]))
    return dh < 0.05 and abs(s - sk[1]) < 0.16 and v > sk[2] * 0.68


def base_palette(atlas, frames):
    pal = set()
    for name, fr in frames.items():
        if name.split('/')[0].replace('b_', '') in BASE_ANIMS:
            img = frame_img(atlas, fr)
            px = img.load()
            for y in range(img.height):
                for x in range(img.width):
                    if px[x, y][3]:
                        pal.add(px[x, y][:3])
    return pal


def frame_views(char_dir, frames):
    anims = json.load(open(os.path.join(char_dir, 'anims.json')))['anims']
    view, anim_of = {}, {}
    for a, d in anims.items():
        for f in d.get('frames', []):
            view.setdefault(f, d.get('view', '34'))
            anim_of.setdefault(f, set()).add(a)
    for f in frames:
        if f not in view:
            a = f.split('/')[0]
            view[f] = '34back' if a.startswith('b_') else 'back' if a == 'walkin' else 'side' if a == 'fish' else '34'
    return view, anim_of


def process(char_dir):
    atlas = Image.open(os.path.join(char_dir, 'atlas.png')).convert('RGBA')
    frames = json.load(open(os.path.join(char_dir, 'atlas.json')))['frames']
    sk = skin_model(atlas, frames)
    pal = base_palette(atlas, frames)
    view, anim_of = frame_views(char_dir, frames)
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
    cout = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
    CO = cout.load()
    meta = {}
    stats = {'skip': 0}
    for name, fr in frames.items():
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
        v = view[name]
        back = v in ('34back', 'back')
        anims = anim_of.get(name, set())
        tool = next((TOOL_ANIMS[a] for a in anims if a in TOOL_ANIMS), None)
        opaque = lambda xx, yy: 0 <= xx < W and 0 <= yy < H and P[xx, yy][3] > 0
        # eldeki esya: karakterin renk paletinde olmayan pikseller (+ onlara ait siyah cizgi)
        item = [[False] * W for _ in range(H)]
        for yy in range(H):
            for xx in range(W):
                p = P[xx, yy]
                if p[3] and not is_outline(p) and p[:3] not in pal:
                    item[yy][xx] = True
        colored = lambda xx, yy: opaque(xx, yy) and not is_outline(P[xx, yy]) and not item[yy][xx]
        for yy in range(H):
            for xx in range(W):
                if opaque(xx, yy) and is_outline(P[xx, yy]):
                    nb = [(xx + a, yy + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                    if any(0 <= a < W and 0 <= b < H and item[b][a] for a, b in nb) and not any(colored(a, b) for a, b in nb):
                        item[yy][xx] = True
        body = lambda xx, yy: opaque(xx, yy) and not item[yy][xx]

        GW, GH = W + 2 * PAD, H + 2 * PAD
        part = [[0] * GW for _ in range(GH)]
        cpart = [[0] * GW for _ in range(GH)]

        def put(k, xx, yy):
            gx, gy = xx + PAD, yy + PAD
            if not (0 <= gx < GW and 0 <= gy < GH):
                return
            if 0 <= xx < W and 0 <= yy < H and item[yy][xx]:
                return                                  # eldeki esyanin ustune asla
            M = cpart if k >= 7 else part
            if M[gy][gx] == 0 or k < M[gy][gx] or k >= 4:
                M[gy][gx] = k

        def run_at(yy):
            """satirdaki en uzun govde parcasi (x0, x1)"""
            best, cur = None, None
            for xx in range(W + 1):
                if xx < W and body(xx, yy):
                    cur = (cur[0], xx) if cur else (xx, xx)
                else:
                    if cur and (not best or cur[1] - cur[0] > best[1] - best[0]):
                        best = cur
                    cur = None
            return best

        # kafa kutusu: en ustteki genis satir
        top = None
        for yy in range(H):
            r = run_at(yy)
            if r and r[1] - r[0] + 1 >= HEAD_MIN_W:
                top = yy
                break
        ok = top is not None and H >= 30 and top + HEAD_H <= H
        if ok:
            hr = run_at(top + 5)
            ok = hr is not None and hr[1] - hr[0] + 1 >= HEAD_MIN_W
        if not ok:
            stats['skip'] += 1
        else:
            x0, x1 = hr
            # ---- kask (bakis acisina gore sablon)
            for yy in range(top - 1, top + HELM_LOW + 1):
                for xx in range(x0 - 1, x1 + 2):
                    d = yy - top
                    if d < 0 and xx in (x0 - 1, x1 + 1):
                        continue                          # yuvarlak ust koseler
                    if not back and d > BAND:
                        if v == '34':
                            side_end = x0 + 6             # 3/4: soldaki yan yuz kapali
                            if side_end < xx < x1:        # on yuz acik (sagda yanak koruyucu)
                                continue
                        elif v == 'side':
                            if xx > x1 - 6 and xx <= x1:  # yandan: ondeki yuz acik
                                continue
                    if 0 <= yy < H and 0 <= xx < W and not opaque(xx, yy) and x0 <= xx <= x1 and d >= 0:
                        continue
                    put(1, xx, yy)
            # ---- goguslik: omuzlar tamamen, asagisi tisort (ten degil)
            for d in range(TORSO[0], TORSO[1] + 1):
                yy = top + d
                if yy >= H:
                    break
                # uzanan kollar (alkis, el sallama) zirhla boyanmasin: kafa genisligi kadar
                xs = [xx for xx in range(max(0, x0 - 2), min(W, x1 + 3)) if body(xx, yy)]
                if not xs:
                    continue
                for xx in range(min(xs) - 1, max(xs) + 2):
                    if xx in xs:
                        p = P[xx, yy]
                        if SHOULDER[0] <= d <= SHOULDER[1] or not is_skin(p, sk) or is_outline(p):
                            if not (d > SHOULDER[1] and is_outline(p) and not any(body(xx + a, yy) and not is_skin(P[xx + a, yy], sk) and not is_outline(P[xx + a, yy]) for a in (-1, 1))):
                                put(2, xx, yy)
                    elif SHOULDER[0] <= d <= SHOULDER[1]:
                        put(2, xx, yy)                    # omuzluk 1 piksel tasar
            # ---- bot: en alttaki satirlar, yanlara 1 piksel
            bottom = max((yy for yy in range(H) for xx in range(W) if body(xx, yy)), default=None)
            if bottom is not None and bottom - top >= 28:
                for yy in range(bottom - BOOT_ROWS + 1, bottom + 1):
                    for xx in range(-1, W + 1):
                        if body(xx, yy) or ((body(xx - 1, yy) or body(xx + 1, yy)) and yy > bottom - BOOT_ROWS + 1):
                            put(3, xx, yy)
            # ---- pelerin: sadece arkadan
            if back and x1 - x0 >= 18:
                cx = (x0 + x1) / 2
                for d in range(CAPE[0], CAPE[1] + 1):
                    yy = top + d
                    if yy > H:
                        break
                    grow = (d - CAPE[0]) // 5
                    for xx in range(int(round(cx)) - 7 - grow, int(round(cx)) + 7 + grow):
                        if any(body(xx + a, yy + b) for a in (-1, 0, 1) for b in (-1, 0, 1)) or any(body(xx + a, yy - 1) for a in (-1, 0, 1)):
                            put(7 if d < TORSO[1] else 8, xx, yy)
        # ---- alet: sadece kendi animasyonunda, sadece malzemesi olan kisim
        if tool:
            for yy in range(H):
                for xx in range(W):
                    if not item[yy][xx] or is_outline(P[xx, yy]):
                        continue
                    h, s, val = hsv(P[xx, yy])
                    if tool == 4:
                        hit = s < 0.2 and val > 0.3          # kilic agzi (gri/beyaz)
                    elif tool == 5:
                        hit = s > 0.3 and 0.35 < h < 0.6     # kazma ucu (elmas)
                    else:
                        hit = s > 0.25                       # yay govdesi (ip haric)
                    if hit:
                        part[yy + PAD][xx + PAD] = tool

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
                    d = gy - PAD - (top if top is not None else 0)
                    t = 1
                    if not same(gx, gy - 2):
                        t = 2                                   # ust kenar acik
                    if not same(gx, gy + 2) or not same(gx + 2, gy):
                        t = 0                                   # alt / sag kenar koyu
                    if k == 1 and d == BAND and not back:
                        t = 0                                   # kask siperligi
                    if t == 2 and (gx + gy) % 4 == 0:
                        t = 3
                    if k == 1 and v == '34' and ok:
                        if gx - PAD == x0 + 6:
                            t = 0                               # 3/4: yan ve on yuz kosesi
                        elif gx - PAD < x0 + 6:
                            t = min(t, 1)                       # yan yuz golgede
                        elif t == 1:
                            t = 2                               # on yuz isikta
                    if k == 2 and d == TORSO[1]:
                        t = 0                                   # kemer
                    if k == 3 and d >= 0 and gy - PAD == (bottom - BOOT_ROWS + 1 if ok and bottom is not None else -9):
                        t = 3                                   # konc
                    if k in (7, 8) and (gx + 1) % 3 == 0 and d > CAPE[0] + 2:
                        t = 0                                   # pelerin kivrimlari
                    OUT[lx + gx, ly + gy] = (k * 30, t * 80, 0, 255)
                    stats[k] = stats.get(k, 0) + 1
        bottom = locals().get('bottom')
        shade(part, O)
        shade(cpart, CO)
    out.save(os.path.join(char_dir, 'gear.png'), optimize=True)
    cout.save(os.path.join(char_dir, 'cape.png'), optimize=True)
    json.dump({'frames': meta, 'meta': {'size': {'w': AW, 'h': AH}, 'pad': PAD}}, open(os.path.join(char_dir, 'gear.json'), 'w'))
    return stats


if __name__ == '__main__':
    for ch in sorted(os.listdir(ROOT)):
        d = os.path.join(ROOT, ch)
        if os.path.isfile(os.path.join(d, 'atlas.png')):
            print(ch, process(d))
