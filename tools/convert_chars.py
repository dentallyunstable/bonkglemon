"""Karakter GIF'lerini oyunun kullandigi dokulara cevirir.

Kullanim: python3 tools/convert_chars.py <zip_klasoru_ya_da_acilmis_klasor> assets/chars

Her karakter icin yazilanlar:
  atlas.png + atlas.json  Oyundaki butun animasyon kareleri tek resimde (Phaser atlas).
                          Kareler bos kenarlarindan kirpilir, ayni kareler bir kez saklanir.
                          Her karenin "pivot"u ayak ortasidir, boylece yandan ve 3/4 onden
                          gorunusler arasinda gecerken karakter yerinden kaymaz.
  front/<anim>.png        Giris ekrani ve profil karti icin onden gorunus seritleri.
  anims.json              Animasyonlarin hangi gorunusten geldigi, kare adlari ve sureleri.

Gorunus kurali (Eren, 2026-11-07): hareket ederken yandan, dururken 3/4 onden.
GIF'lerde 1 piksel = 4 ekran pikseli oldugu icin her kare 4'e bolunur (kayipsiz).
"""
import hashlib, json, os, sys, tempfile, zipfile
from PIL import Image, ImageSequence

SCALE = 4
CHARS = {  # oyun adi -> (zip/klasor adi, klasor on eki)
    'dunstable': ('dunstable', 'dunstable'),
    'chegn': ('chegn', 'cheg'),
    'bonk': ('bonk', 'bonk'),
}
VIEW_DIR = {'side': 'side', '34': '3-4', 'front': 'front', '34back': '3-4back', 'back': 'back'}
# Hareket eden ya da bir seye donuk yapilan animasyonlar yandan
SIDE = ['walk', 'run', 'sprint', 'ninjadash', 'ninjarun', 'sneakwalk', 'blockwalk', 'skip',
        'stab', 'punch', 'mine', 'placeblock', 'bowshot']
# Yerinde durulan animasyonlar 3/4 onden
FRONT34 = ['idle', 'idlesway', 'sit', 'cheer', 'clap', 'joy', 'piglindance', 'levelup', 'cry',
           'shake', 'sulk', 'surprise', 'wave', 'love', 'eat', 'drinkpotion', 'goldenapple',
           'totem', 'onfire', 'death', 'explosion', 'mcdeath', 'vanish', 'spin', 'sneakspam',
           'hurt', 'jump', 'mcjump']
# Savas ekrani karakterin arkasindan bakar (Eren, 2026-11-07): arka 3/4 gorunus, 'b_' on ekiyle
BATTLE = ['idlesway', 'stab', 'punch', 'spin', 'hurt', 'drinkpotion', 'eat', 'goldenapple', 'totem',
          'onfire', 'death', 'explosion', 'mcdeath', 'vanish', 'jump', 'mcjump', 'shake', 'ninjarun',
          'bowshot', 'cheer', 'run']
# Bir yere girerken kisa sure arkadan yurur
ENTER = [('walkin', 'back', 'walk')]
STRIPS = ['idle', 'turn']  # onden gorunus (DOM'da oynar)
ATLAS_W = 1024
PAD = 1


def find_root(src, name):
    d = os.path.join(src, name)
    if os.path.isdir(d):
        return d
    z = os.path.join(src, f'{name}_selected.zip')
    tmp = tempfile.mkdtemp()
    with zipfile.ZipFile(z) as zf:
        zf.extractall(tmp)
    return tmp


def frames_of(gif_path):
    im = Image.open(gif_path)
    out = []
    for fr in ImageSequence.Iterator(im):
        f = fr.convert('RGBA')
        f = f.resize((f.width // SCALE, f.height // SCALE), Image.NEAREST)
        out.append((f, int(fr.info.get('duration', 100)) or 100))
    return out


def anchor(frame):
    """Ayaklarin altindaki satirin ortasi: (x, y)."""
    a = frame.split()[3]
    w, h = frame.size
    rows = [y for y in range(h) if any(a.getpixel((x, y)) for x in range(w))]
    yb = max(rows)
    xs = [x for x in range(w) if a.getpixel((x, yb))]
    return (min(xs) + max(xs) + 1) // 2, yb + 1


def strip(frames, out_png):
    w, h = frames[0][0].size
    img = Image.new('RGBA', (w * len(frames), h), (0, 0, 0, 0))
    for i, (f, _) in enumerate(frames):
        img.paste(f, (i * w, 0))
    img.save(out_png, optimize=True)
    return {'w': w, 'h': h, 'frames': len(frames), 'durations': [d for _, d in frames]}


def pack(items):
    """Basit raf yerlestirme. items: [(ad, resim)] -> {ad: (x, y)}, (genislik, yukseklik)"""
    order = sorted(items, key=lambda it: (-it[1].height, -it[1].width))
    pos, x, y, shelf = {}, 0, 0, 0
    for name, im in order:
        if x + im.width > ATLAS_W:
            x, y, shelf = 0, y + shelf + PAD, 0
        pos[name] = (x, y)
        x += im.width + PAD
        shelf = max(shelf, im.height)
    return pos, (ATLAS_W, y + shelf)


def convert_char(root, prefix, odir):
    os.makedirs(os.path.join(odir, 'front'), exist_ok=True)
    meta = {'anims': {}}
    pivots = {}
    for view in ('side', '34', '34back', 'back'):
        f0 = frames_of(os.path.join(root, f'{prefix}{VIEW_DIR[view]}', 'idle.gif'))[0][0]
        ax, ay = anchor(f0)
        pivots[view] = (ax / f0.width, ay / f0.height)
    uniq = {}   # hash -> kare adi
    tiles = []  # (ad, kirpilmis resim, kirpma kutusu, kaynak boyutu, gorunus)
    jobs = [(a, 'side', a) for a in SIDE] + [(a, '34', a) for a in FRONT34]
    jobs += [('b_' + a, '34back', a) for a in BATTLE] + ENTER
    for key, view, anim in jobs:
        if True:
            frs = frames_of(os.path.join(root, f'{prefix}{VIEW_DIR[view]}', anim + '.gif'))
            fnames, durs = [], []
            for i, (f, d) in enumerate(frs):
                box = f.getbbox() or (0, 0, 1, 1)
                crop = f.crop(box)
                h = hashlib.md5(view.encode() + bytes(box) + crop.tobytes()).hexdigest()
                if h not in uniq:
                    uniq[h] = f'{key}/{i}'
                    tiles.append((uniq[h], crop, box, f.size, view))
                fnames.append(uniq[h])
                durs.append(d)
            meta['anims'][key] = {'view': view, 'frames': fnames, 'durations': durs}
    pos, size = pack([(n, im) for n, im, *_ in tiles])
    atlas = Image.new('RGBA', size, (0, 0, 0, 0))
    jframes = {}
    for name, im, box, (sw, sh), view in tiles:
        x, y = pos[name]
        atlas.paste(im, (x, y))
        px, py = pivots[view]
        jframes[name] = {
            'frame': {'x': x, 'y': y, 'w': im.width, 'h': im.height},
            'rotated': False, 'trimmed': True,
            'spriteSourceSize': {'x': box[0], 'y': box[1], 'w': im.width, 'h': im.height},
            'sourceSize': {'w': sw, 'h': sh},
            'pivot': {'x': round(px, 5), 'y': round(py, 5)},
        }
    atlas.save(os.path.join(odir, 'atlas.png'), optimize=True)
    with open(os.path.join(odir, 'atlas.json'), 'w') as fh:
        json.dump({'frames': jframes, 'meta': {'image': 'atlas.png', 'format': 'RGBA8888',
                   'size': {'w': size[0], 'h': size[1]}, 'scale': '1'}}, fh, separators=(',', ':'))
    for anim in STRIPS:
        frs = frames_of(os.path.join(root, f'{prefix}front', anim + '.gif'))
        meta[f'front/{anim}'] = strip(frs, os.path.join(odir, 'front', anim + '.png'))
    with open(os.path.join(odir, 'anims.json'), 'w') as fh:
        json.dump(meta, fh, separators=(',', ':'))
    return len(tiles), size


def main(src, dst):
    for key, (name, prefix) in CHARS.items():
        root = find_root(src, name)
        n, size = convert_char(root, prefix, os.path.join(dst, key))
        print(key, len(SIDE) + len(FRONT34) + len(BATTLE) + len(ENTER), 'animasyon,', n, 'kare, atlas', size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
