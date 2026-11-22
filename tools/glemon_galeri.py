# Plan v2 Glemon galerisi: her tip icin bir resim (Bebek, Genc, Usta yan yana, 3x), patronlar ayri.
# Kullanim: python3 tools/glemon_galeri.py <cikis_klasoru>
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B = os.path.join(ROOT, 'build/glemon')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'onizleme/galeri')
SC = 3
FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
BG = (52, 66, 58)
CELL = (88, 104, 92)
INK = (240, 236, 222)
SUB = (196, 206, 190)

sp = json.load(open(os.path.join(ROOT, 'tools/glemon_species.json'), encoding='utf8'))
f1 = ImageFont.truetype(FONT, 22)
f2 = ImageFont.truetype(FONT, 15)
os.makedirs(OUT, exist_ok=True)


def sheet(title, rows, stages, labels, cols=2, fname='x'):
    imgs = []
    for k in rows:
        ims = []
        for s in stages:
            p = os.path.join(B, '%s_%s.png' % (k, s))
            if os.path.exists(p):
                im = Image.open(p).convert('RGBA')
                ims.append(im.resize((im.width * SC, im.height * SC), Image.NEAREST))
        imgs.append((k, ims))
    cw = max(sum(i.width for i in ims) + 16 * (len(ims) + 1) for _, ims in imgs)
    ch = max(max(i.height for i in ims) for _, ims in imgs) + 52
    W = cols * cw + (cols + 1) * 12
    nrow = (len(imgs) + cols - 1) // cols
    H = 60 + nrow * (ch + 12) + 4
    out = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(out)
    d.text((14, 16), title, font=f1, fill=INK)
    d.text((W - 14, 22), '  ·  '.join(labels), font=f2, fill=SUB, anchor='ra')
    for n, (k, ims) in enumerate(imgs):
        x0 = 12 + (n % cols) * (cw + 12)
        y0 = 60 + (n // cols) * (ch + 12)
        d.rounded_rectangle((x0, y0, x0 + cw, y0 + ch), 8, fill=CELL)
        e = sp.get(k, {})
        nm = e.get('ad', k)
        info = ' · '.join(x for x in (e.get('nadirlik'), 'uçar' if e.get('ucar') else None) if x)
        d.text((x0 + 12, y0 + 8), nm, font=f2, fill=INK)
        if info:
            d.text((x0 + cw - 12, y0 + 9), info, font=f2, fill=SUB, anchor='ra')
        x = x0 + 16
        base = y0 + ch - 10
        for im in ims:
            out.paste(im, (x, base - im.height), im)
            x += im.width + 16
    out.save(os.path.join(OUT, fname + '.png'))
    return out.size


TIPS = ['Orman', 'Taş', 'Kum', 'Buz', 'Ateş', 'Gölge', 'Su', 'Ay', 'Yıldız', None]
names = {None: 'Efsanevi ve gizli'}
for i, t in enumerate(TIPS):
    ks = [k for k, e in sp.items() if e.get('tip') == t and not e.get('patron')]
    if not ks:
        continue
    fn = '%02d_%s' % (i + 1, (t or 'efsanevi').lower().replace('ş', 's').replace('ı', 'i').replace('ö', 'o').replace('ğ', 'g').replace('ü', 'u').replace('ç', 'c'))
    print(fn, sheet('Glemon: %s (%d tür)' % (names.get(t, t), len(ks)), ks, ['bebek', 'genc', 'usta'], ['Bebek', 'Genç', 'Usta'], 2, fn))
bs = [k for k, e in sp.items() if e.get('patron')]
print('patronlar', sheet('Patronlar (%d)' % len(bs), bs, ['patron', 'faz2', 'faz3'], ['1. aşama', '2. aşama', '3. aşama'], 1, '11_patronlar'))
