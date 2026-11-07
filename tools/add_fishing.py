"""Balik tutma animasyonu (0.8.5): karakterin mevcut `mine/2` karesinden (yandan, kol onde)
kazma silinir, yerine tahta bir olta cizilir. Kareler karakter atlasinin altina eklenir ve
anims.json'a fish_cast / fish_idle / fish_reel animasyonlari ile olta ucunun yeri yazilir.

Kullanim: python3 tools/add_fishing.py assets/chars
Tekrar calistirilabilir: onceki balik kareleri silinip bastan uretilir.
"""
import json
import os
import sys

from PIL import Image

PICK = {(43, 199, 172), (39, 178, 154), (51, 235, 203), (14, 63, 54), (8, 37, 32),
        (73, 54, 21), (40, 30, 11), (137, 103, 39), (104, 78, 30)}
INK = (0, 0, 0, 255)
WOOD = [(196, 140, 84, 255), (150, 100, 56, 255), (110, 70, 38, 255)]  # acik, orta, koyu
GRIP = (70, 46, 30, 255)
RING = (232, 224, 208, 255)


def full(atlas, fr, name):
    f = fr[name]
    a, s = f['frame'], f['spriteSourceSize']
    out = Image.new('RGBA', (f['sourceSize']['w'], f['sourceSize']['h']))
    out.paste(atlas.crop((a['x'], a['y'], a['x'] + a['w'], a['y'] + a['h'])), (s['x'], s['y']))
    return out


def strip_pick(img):
    """Kazmayi siler; kazmanin cizgisi olan siyah pikselleri de temizler, eli kapatir."""
    px = img.load()
    w, h = img.size
    removed = set()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] and px[x, y][:3] in PICK:
                px[x, y] = (0, 0, 0, 0)
                removed.add((x, y))

    def solid(x, y):
        return 0 <= x < w and 0 <= y < h and px[x, y][3] and px[x, y][:3] != (0, 0, 0) and max(px[x, y][:3]) > 12

    # artik hicbir renkli piksele komsu olmayan siyah cizgiler (kazmanin cizgisi).
    # Sadece kazmanin durdugu kutuda bakilir: tisort de siyah oldugu icin.
    x0 = min(x for x, _ in removed) - 1
    y0, y1 = min(y for _, y in removed) - 1, max(y for _, y in removed) + 1
    for _ in range(2):
        kill = []
        for y in range(h):
            for x in range(w):
                p = px[x, y]
                if p[3] and p[:3] == (0, 0, 0) and x > x0 and y0 <= y <= y1:
                    if not any(solid(x + dx, y + dy) for dx in (-1, 0, 1) for dy in (-1, 0, 1)):
                        kill.append((x, y))
        for x, y in kill:
            px[x, y] = (0, 0, 0, 0)
    # sapin elin arkasinda (solunda) kalan ucu: kolun sol cizgisi olur
    hand_x = min((x for (x, y) in removed if solid(x - 1, y)), default=None)
    for (x, y) in removed:
        if hand_x is not None and x < hand_x - 4 and (solid(x + 1, y) or solid(x - 1, y)):
            px[x, y] = INK
    # elin sag kenari: silinen sap yerine cizgi
    grip = None
    for (x, y) in sorted(removed):
        if solid(x - 1, y) and not px[x, y][3]:
            px[x, y] = INK
            if grip is None or x < grip[0]:
                grip = (x - 1, y)
    return img, grip


def line_pts(x0, y0, x1, y1):
    pts = []
    dx, dy = abs(x1 - x0), -abs(y1 - y0)
    sx, sy = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1)
    err = dx + dy
    while True:
        pts.append((x0, y0))
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return pts


def curve_pts(p0, p1, bend):
    """El (p0) ile uc (p1) arasinda, ortasi `bend` kadar asagi egilmis olta."""
    (x0, y0), (x1, y1) = p0, p1
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2 + bend
    pts = []
    n = max(abs(x1 - x0), abs(y1 - y0)) * 2 + 2
    for i in range(n + 1):
        t = i / n
        x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * cx + t * t * x1
        y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * cy + t * t * y1
        p = (round(x), round(y))
        if not pts or pts[-1] != p:
            pts.append(p)
    # koseli adimlari tek piksellik cizgiye indir
    out = []
    for p in pts:
        if len(out) >= 2 and abs(out[-2][0] - p[0]) <= 1 and abs(out[-2][1] - p[1]) <= 1:
            out[-1] = p
        else:
            out.append(p)
    return out


def draw_rod(img, grip, tip, bend=0, behind=False):
    px = img.load()
    w, h = img.size
    pts = curve_pts(grip, tip, bend) if bend else line_pts(*grip, *tip)
    body = {(x, y) for x in range(w) for y in range(h) if px[x, y][3]}
    rod = {}
    for i, (x, y) in enumerate(pts):
        k = i / max(1, len(pts) - 1)
        c = GRIP if k < 0.18 else WOOD[0] if i % 4 else WOOD[1]
        rod[(x, y)] = c
    # golge tarafi: her noktanin bir alti koyu (2 piksel kalinlik ilk yarida)
    for i, (x, y) in enumerate(pts[: len(pts) // 2]):
        if (x, y + 1) not in rod:
            rod[(x, y + 1)] = GRIP if i < len(pts) * 0.18 else WOOD[2]
    tx, ty = pts[-1]
    rod[(tx, ty)] = RING
    outline = set()
    for (x, y) in rod:
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            q = (x + dx, y + dy)
            if q not in rod:
                outline.add(q)
    for (x, y) in outline:
        if 0 <= x < w and 0 <= y < h and (x, y) not in body:
            px[x, y] = INK
    for (x, y), c in rod.items():
        if 0 <= x < w and 0 <= y < h and not (behind and (x, y) in body):
            px[x, y] = c
    return (tx, ty)


def main(root):
    for c in sorted(os.listdir(root)):
        d = os.path.join(root, c)
        if not os.path.exists(os.path.join(d, 'atlas.json')):
            continue
        at = json.load(open(os.path.join(d, 'atlas.json')))
        fr = at['frames']
        atlas = Image.open(os.path.join(d, 'atlas.png')).convert('RGBA')
        base_h = at['meta'].get('fishBaseH', atlas.height)
        atlas = atlas.crop((0, 0, atlas.width, base_h))
        for k in [k for k in fr if k.startswith('fish/')]:
            del fr[k]
        src, grip = strip_pick(full(atlas, fr, 'mine/2'))
        gx, gy = grip
        # (uc yeri, egilme, arkada mi)
        poses = [
            ((gx + 21, gy - 22), 0, False),   # 0 bekle
            ((gx + 21, gy - 21), 2, False),   # 1 bekle (hafif sallanir)
            ((gx - 8, gy - 28), 0, True),     # 2 atis: olta geride
            ((gx + 25, gy - 9), 0, False),    # 3 atis: one savrulur
            ((gx + 20, gy - 12), 6, False),   # 4 cek: egik
            ((gx + 19, gy - 9), 8, False),    # 5 cek: daha egik
        ]
        frames, tips = [], {}
        for i, (tip, bend, behind) in enumerate(poses):
            img = src.copy()
            t = draw_rod(img, grip, tip, bend, behind)
            frames.append(img)
            tips[f'fish/{i}'] = list(t)
        # atlasin altina ekle
        fw, fh = frames[0].size
        new = Image.new('RGBA', (max(atlas.width, fw * len(frames)), base_h + fh))
        new.paste(atlas, (0, 0))
        pv = fr['mine/2']['pivot']
        for i, img in enumerate(frames):
            bb = img.getbbox()
            crop = img.crop(bb)
            x, y = i * fw, base_h
            new.paste(crop, (x, y))
            fr[f'fish/{i}'] = {
                'frame': {'x': x, 'y': y, 'w': crop.width, 'h': crop.height}, 'rotated': False, 'trimmed': True,
                'spriteSourceSize': {'x': bb[0], 'y': bb[1], 'w': crop.width, 'h': crop.height},
                'sourceSize': {'w': fw, 'h': fh}, 'pivot': dict(pv),
            }
        at['meta']['fishBaseH'] = base_h
        at['meta']['size'] = {'w': new.width, 'h': new.height}
        new.save(os.path.join(d, 'atlas.png'), optimize=True)
        json.dump(at, open(os.path.join(d, 'atlas.json'), 'w'), separators=(',', ':'))
        an = json.load(open(os.path.join(d, 'anims.json')))
        an['anims']['fish_cast'] = {'view': 'side', 'frames': ['fish/2', 'fish/3', 'fish/0'], 'durations': [320, 110, 240]}
        an['anims']['fish_idle'] = {'view': 'side', 'frames': ['fish/0', 'fish/1'], 'durations': [700, 700]}
        an['anims']['fish_reel'] = {'view': 'side', 'frames': ['fish/4', 'fish/5'], 'durations': [110, 110]}
        # olta ucu: kaynak karede (sourceSize) piksel yeri; oyunda ip buradan sarkar
        an['fishTip'] = {k: v for k, v in tips.items()}
        an['fishTipSize'] = [fw, fh]
        json.dump(an, open(os.path.join(d, 'anims.json'), 'w'), separators=(',', ':'))
        print(c, 'ok', grip, tips['fish/0'])


if __name__ == '__main__':
    main(sys.argv[1])
