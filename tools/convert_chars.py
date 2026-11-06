"""Karakter GIF'lerini oyunun kullandigi sprite seritlerine cevirir.

Kullanim: python3 tools/convert_chars.py <zip_klasoru_ya_da_acilmis_klasor> assets/chars

GIF'lerde 1 piksel = 4 ekran pikseli oldugu icin her kare 4'e bolunur (kayipsiz).
Her animasyon icin yatay bir PNG seridi ve anims.json (kare sayisi + sureler) yazilir.
"""
import json, os, sys, zipfile, tempfile
from PIL import Image, ImageSequence

SCALE = 4
CHARS = {  # oyun adi -> (zip/klasor adi, klasor on eki)
    'dunstable': ('dunstable', 'dunstable'),
    'chegn': ('chegn', 'cheg'),
    'bonk': ('bonk', 'bonk'),
}
VIEWS = {'side': None, 'front': ['idle', 'wave', 'joy', 'cheer', 'clap']}


def find_root(src, name):
    d = os.path.join(src, name)
    if os.path.isdir(d):
        return d
    z = os.path.join(src, f'{name}_selected.zip')
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(z) as zf:
        zf.extractall(tmp)
    return tmp


def convert(gif_path, out_png):
    im = Image.open(gif_path)
    frames, durs = [], []
    for fr in ImageSequence.Iterator(im):
        f = fr.convert('RGBA')
        frames.append(f.resize((f.width // SCALE, f.height // SCALE), Image.NEAREST))
        durs.append(int(fr.info.get('duration', 100)) or 100)
    w, h = frames[0].size
    strip = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        strip.paste(f, (i * w, 0))
    strip.save(out_png, optimize=True)
    return {'w': w, 'h': h, 'frames': len(frames), 'durations': durs}


def main(src, dst):
    for key, (name, prefix) in CHARS.items():
        root = find_root(src, name)
        meta = {}
        for view, only in VIEWS.items():
            vdir = os.path.join(root, f'{prefix}{view}')
            odir = os.path.join(dst, key, view)
            os.makedirs(odir, exist_ok=True)
            for fn in sorted(os.listdir(vdir)):
                if not fn.endswith('.gif'):
                    continue
                anim = fn[:-4]
                if only and anim not in only:
                    continue
                meta[f'{view}/{anim}'] = convert(os.path.join(vdir, fn), os.path.join(odir, anim + '.png'))
        with open(os.path.join(dst, key, 'anims.json'), 'w') as fh:
            json.dump(meta, fh, separators=(',', ':'))
        print(key, len(meta), 'animasyon')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
