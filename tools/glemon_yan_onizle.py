"""Yandan cizim onizlemesi: python3 tools/glemon_yan_onizle.py <anahtar> [...]
onizleme/<anahtar>_yan.png: her asama icin on (3/4) ve yandan cizim yan yana, 6 kat; altta oyundaki gercek boy (2 kat)."""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build/glemon')
S = 6
for key in sys.argv[1:]:
    ims = []
    for st in ('bebek', 'genc', 'usta'):
        for suf in ('', '_yan'):
            p = os.path.join(B, f'{key}_{st}{suf}.png')
            if os.path.exists(p):
                ims.append(Image.open(p).convert('RGBA'))
    big = [i.resize((i.width * S, i.height * S), Image.NEAREST) for i in ims]
    small = [i.resize((i.width * 2, i.height * 2), Image.NEAREST) for i in ims]
    W = sum(b.width + 10 for b in big) + 10
    H = max(b.height for b in big) + max(s.height for s in small) + 40
    o = Image.new('RGBA', (W, H), (70, 96, 72, 255))
    x = 10
    hb = max(b.height for b in big)
    for i, b in enumerate(big):
        if i % 2 == 0 and i:
            x += 10
        o.paste(b, (x, 10 + hb - b.height), b); x += b.width + 10
    x = 10
    for s in small:
        o.paste(s, (x, H - 10 - s.height), s); x += s.width + 6
    o.save(os.path.join(ROOT, f'onizleme/{key}_yan.png'))
    print(key, '->', f'onizleme/{key}_yan.png')
