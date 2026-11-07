# Hanci NPC'si (Lale): karakterlerle ayni chibi piksel tarzi, buyuk kafa, 1px koyu cizgi.
# Cikti: assets/npc/hanci.png (yan yana kareler) + hanci.json (kare boyu, animasyonlar)
import json, os
from PIL import Image

W, H = 32, 44
P = {
 'K': (22, 18, 26), 'h': (140, 62, 44), 'H': (106, 42, 32), 'i': (176, 86, 58), 'I': (204, 116, 80),
 's': (242, 200, 164), 'S': (218, 166, 130), 'p': (234, 146, 128), 'm': (186, 88, 84),
 'g': (70, 136, 102), 'G': (40, 90, 66), 'w': (255, 255, 255),
 'c': (236, 228, 212), 'C': (200, 188, 166), 'd': (98, 60, 100), 'D': (70, 42, 76),
 't': (62, 106, 92), 'T': (44, 80, 70), 'a': (232, 220, 196), 'A': (198, 182, 154),
 'b': (78, 50, 36), 'f': (236, 206, 104), 'F': (214, 120, 132), 'r': (176, 70, 64),
}

def frame(breath=0, blink=False, wave=None, smile=False):
    g = [[None] * W for _ in range(H)]
    def R(x0, y0, x1, y1, c):
        for y in range(y0, y1 + 1):
            for x in range(x0, x1 + 1):
                if 0 <= x < W and 0 <= y < H: g[y][x] = c
    def S_(x, y, c):
        if 0 <= x < W and 0 <= y < H: g[y][x] = c
    ox, hy = 6, 3 + breath  # kafa ofseti (nefeste kafa 1px iner)
    # arkadaki uzun sac (omuzlardan bele)
    R(ox - 2, hy + 12, ox + 1, hy + 27, 'H'); R(ox + 18, hy + 12, ox + 21, hy + 27, 'H')
    R(ox - 1, hy + 12, ox, hy + 26, 'h'); R(ox + 19, hy + 12, ox + 20, hy + 26, 'h')
    # govde
    by = 22
    R(ox + 2, by, ox + 17, by + 7, 'c')          # bluz
    R(ox + 4, by + 2, ox + 15, by + 8, 'd')       # yelek
    R(ox + 7, by, ox + 12, by + 2, 'c'); R(ox + 8, by + 3, ox + 11, by + 3, 'c')  # yaka (V)
    R(ox + 4, by + 8, ox + 15, by + 8, 'D')
    for x in (ox + 6, ox + 13):
        for y in (by + 3, by + 5): S_(x, y, 'f')  # yelek dugmeleri
    R(ox + 1, by + 9, ox + 18, by + 15, 't')      # etek
    R(ox + 1, by + 15, ox + 18, by + 15, 'T'); R(ox + 1, by + 9, ox + 1, by + 15, 'T')
    R(ox + 5, by + 8, ox + 14, by + 15, 'a')      # onluk
    R(ox + 5, by + 8, ox + 5, by + 15, 'A'); R(ox + 14, by + 8, ox + 14, by + 15, 'A'); R(ox + 5, by + 15, ox + 14, by + 15, 'A')
    R(ox + 7, by + 11, ox + 12, by + 13, 'A'); R(ox + 8, by + 11, ox + 11, by + 12, 'a')  # cep
    R(ox + 5, by + 16, ox + 7, by + 17, 'S'); R(ox + 12, by + 16, ox + 14, by + 17, 'S')  # bacak
    R(ox + 4, by + 18, ox + 8, by + 19, 'b'); R(ox + 11, by + 18, ox + 15, by + 19, 'b')  # ayakkabi
    # kollar (kabarik kol + el)
    R(ox - 1, by, ox + 2, by + 3, 'c'); R(ox - 1, by + 3, ox + 2, by + 3, 'C')
    R(ox, by + 4, ox + 1, by + 9, 's'); R(ox, by + 9, ox + 1, by + 10, 'S')
    if wave is None:
        R(ox + 17, by, ox + 20, by + 3, 'c'); R(ox + 17, by + 3, ox + 20, by + 3, 'C')
        R(ox + 18, by + 4, ox + 19, by + 9, 's'); R(ox + 18, by + 9, ox + 19, by + 10, 'S')
    else:  # el sallama: kol yukarida, el iki konumda
        R(ox + 17, by - 1, ox + 20, by + 2, 'c'); R(ox + 17, by + 2, ox + 20, by + 2, 'C')
        hx = ox + 21 + wave
        R(hx - 1, by - 7, hx, by - 2, 's'); R(hx - 1, by - 9, hx + 1, by - 7, 's'); R(hx - 1, by - 2, hx, by - 2, 'S')
    # kafa
    R(ox, hy, ox + 19, hy + 17, 's')
    R(ox, hy + 15, ox + 1, hy + 17, None) if False else None
    for (x, y) in [(ox, hy + 17), (ox + 19, hy + 17)]: S_(x, y, None)
    # boyun golgesi
    R(ox + 7, hy + 18, ox + 12, hy + 18, 'S')
    # sac: ust ve yanlar
    R(ox - 1, hy - 1, ox + 20, hy + 5, 'h')
    R(ox + 1, hy - 2, ox + 18, hy - 2, 'h')
    R(ox - 1, hy, ox + 2, hy + 18, 'h'); R(ox + 17, hy, ox + 20, hy + 18, 'h')
    R(ox - 1, hy + 6, ox, hy + 19, 'H'); R(ox + 19, hy + 6, ox + 20, hy + 19, 'H')
    R(ox + 3, hy + 17, ox + 3, hy + 17, 'h'); R(ox + 16, hy + 17, ox + 16, hy + 17, 'h')
    # isik parlamasi
    R(ox + 4, hy - 1, ox + 9, hy - 1, 'I'); R(ox + 3, hy, ox + 5, hy, 'i'); R(ox + 11, hy, ox + 15, hy + 0, 'i')
    # kakul (duzensiz uclar)
    R(ox + 3, hy + 6, ox + 16, hy + 6, 'h')
    for x in (ox + 3, ox + 4, ox + 8, ox + 9, ox + 10, ox + 15, ox + 16): S_(x, hy + 7, 'h')
    for x in (ox + 3, ox + 9): S_(x, hy + 8, 'h')
    R(ox + 4, hy + 5, ox + 7, hy + 5, 'i')
    # sacta cicek
    R(ox + 15, hy - 1, ox + 17, hy + 1, 'F'); S_(ox + 16, hy, 'f'); S_(ox + 14, hy, 'F'); S_(ox + 18, hy, 'F'); S_(ox + 16, hy - 2, 'F'); S_(ox + 16, hy + 2, 'F')
    # gozler (buyuk, yesil, kirpikli)
    ey = hy + 9
    for ex, outer in ((ox + 4, ox + 3), (ox + 12, ox + 16)):
        if blink:
            R(ex, ey + 2, ex + 3, ey + 2, 'K'); S_(outer, ey + 1, 'K')
        else:
            R(ex - (1 if outer < ex else 0), ey, ex + 3 + (1 if outer > ex else 0), ey, 'K')
            R(ex, ey + 1, ex + 3, ey + 3, 'g'); R(ex, ey + 1, ex + 3, ey + 1, 'G'); R(ex + 1, ey + 2, ex + 2, ey + 3, 'G')
            S_(ex + (2 if outer > ex else 1), ey + 1, 'w'); S_(ex + (1 if outer > ex else 2), ey + 3, 'w')
            S_(outer, ey - 1, 'K')
    # yanaklar, burun, agiz
    R(ox + 3, ey + 5, ox + 4, ey + 5, 'p'); R(ox + 15, ey + 5, ox + 16, ey + 5, 'p')
    S_(ox + 9, ey + 4, 'S')
    if smile:
        R(ox + 8, ey + 6, ox + 11, ey + 6, 'm'); S_(ox + 7, ey + 5, 'm'); S_(ox + 12, ey + 5, 'm')
    else:
        R(ox + 8, ey + 6, ox + 10, ey + 6, 'm'); S_(ox + 11, ey + 5, 'm')
    # cizgi: dolu piksellerin disina 1px koyu kenar
    out = [row[:] for row in g]
    for y in range(H):
        for x in range(W):
            if g[y][x] is None and any(0 <= x + dx < W and 0 <= y + dy < H and g[y + dy][x + dx] is not None for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                out[y][x] = 'K'
    im = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for y in range(H):
        for x in range(W):
            if out[y][x]: im.putpixel((x, y), P[out[y][x]] + (255,))
    return im

frames = [frame(0), frame(1), frame(0, blink=True), frame(0, wave=0, smile=True), frame(0, wave=1, smile=True), frame(1, smile=True)]
sheet = Image.new('RGBA', (W * len(frames), H), (0, 0, 0, 0))
for i, f in enumerate(frames): sheet.paste(f, (i * W, 0))
root = os.path.join(os.path.dirname(__file__), '..', 'assets', 'npc')
os.makedirs(root, exist_ok=True)
sheet.save(os.path.join(root, 'hanci.png'))
json.dump({'w': W, 'h': H, 'footY': 42, 'anims': {
    'durma': {'frames': [0, 1, 0, 1, 0, 1, 2, 1], 'durs': [700, 700, 700, 700, 700, 600, 140, 600]},
    'selam': {'frames': [3, 4, 3, 4, 3, 4], 'durs': [180, 180, 180, 180, 180, 300]},
    'gulumse': {'frames': [5, 0], 'durs': [900, 400]},
}}, open(os.path.join(root, 'hanci.json'), 'w'))
print('ok', sheet.size)
