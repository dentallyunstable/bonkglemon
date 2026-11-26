"""Iri piksel (1.0.28): resimden alinmis (glemon_import) bir turu yarim cozunurluge indirir.

Kullanim: python3 tools/glemon_kucult.py <anahtar> [asama ...]
build/glemon/<anahtar>_<asama>_yuzsuz.png (tam boy, cizgisiz) 2x2 bloklarda en cok gecen renge indirilir; parca maskesi de
ayni sekilde. Sonra dis cizgi ve kucuk goz kalibi (k/o/b) yeniden basilir. Cikti glemon_draw.py ile ayni dosyalar ('px': 2);
ardindan tools/gen_glemons2.py <anahtar> calistirilir. Kutukcuk gibi Eren'in resminden gelen turler icin.
"""
import json, os, sys
from collections import Counter
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bonk_palette as BP
import glemon_faces as GF
import glemon_draw as GD

ROOT = GD.ROOT
COL_PART = {v: k for k, v in GD.PART_COL.items()}


def reduce_rgba(a):
    H, W = a.shape[:2]
    o = np.zeros((H // 2, W // 2, 4), np.uint8)
    for y in range(H // 2):
        for x in range(W // 2):
            px = [tuple(int(v) for v in p) for p in a[2 * y:2 * y + 2, 2 * x:2 * x + 2].reshape(-1, 4) if p[3] > 0]
            if len(px) >= 2:
                c = Counter(p[:3] for p in px).most_common()
                # esitlikte koyu olani sec (kabuk cizgileri kaybolmasin)
                best = max(c, key=lambda t: (t[1], -sum(t[0])))[0]
                o[y, x, :3] = best; o[y, x, 3] = 255
    return o


def reduce_mask(m, alpha):
    H, W = m.shape[:2]
    o = np.zeros((H // 2, W // 2, 3), np.uint8)
    for y in range(H // 2):
        for x in range(W // 2):
            if not alpha[y, x]:
                continue
            px = [tuple(int(v) for v in p) for p in m[2 * y:2 * y + 2, 2 * x:2 * x + 2].reshape(-1, 3) if tuple(int(v) for v in p) != (0, 0, 0)]
            o[y, x] = Counter(px).most_common(1)[0][0] if px else GD.PART_COL['govde']
    return o


def shrink(key, stage):
    base = os.path.join(ROOT, f'build/glemon/{key}_{stage}')
    info = json.load(open(base + '.json'))
    if info.get('px') == 2:
        print(key, stage, 'zaten iri'); return info
    full = np.asarray(Image.open(base + '_yuzsuz.png').convert('RGBA'))
    a = reduce_rgba(full)
    alpha = a[..., 3] > 0
    col = a[..., :3].copy()
    mk_path = os.path.join(ROOT, f'assets/glemons/kukla/{key}_{stage}_maske.png')
    mk = np.asarray(Image.open(mk_path).convert('RGB'))
    mask = reduce_mask(mk, alpha)
    keep = {BP.tone('Parilti')}
    GD.clean(col, alpha, keep)
    bare = col.copy()
    kal = info['kalip'].lower()
    g = info['goz']
    lx, rx, ey = g['lx'] // 2, g['rx'] // 2, g['ey'] // 2
    gmin, gmax = GF.GAP[kal]
    ew = GF.SIZE[kal][0]
    gap = rx - lx - ew
    if gap < gmin:
        rx = lx + ew + gmin
    elif gap > gmax:
        rx = lx + ew + gmax
    colors = GD.face_colors(info['ten'], info.get('goz_renk'), info.get('yanak', True))
    A = col.copy()
    H, W = alpha.shape
    def put(x, y, c):
        if 0 <= x < W and 0 <= y < H:
            A[y, x] = c
    lay = GF.stamp(put, kal, 'normal', lx, rx, ey, colors, skip_mouth=not info.get('agiz', True))
    OA, OM = GD.outline(A, alpha)
    rows = np.where(alpha.any(1))[0]
    widths = alpha.sum(1)
    parts = set()
    for y, x in zip(*np.where(alpha)):
        parts.add(COL_PART.get(tuple(int(v) for v in mask[y, x]), 'govde'))
    gm = alpha & (mask == np.array(GD.PART_COL['govde'])).all(2)
    gxs = np.where(gm)[1]
    info2 = dict(info)
    info2.update({'tuval': W, 'tuval_h': H, 'kalip': kal, 'goz': {'lx': lx, 'rx': rx, 'ey': ey}, 'yuz_kutusu': [int(v) for v in lay['box']],
                  'govde_ust': int(np.where(widths >= widths.max() * 0.6)[0][0]), 'ayak': int(rows.max()),
                  'govde_gen': int(gxs.max() - gxs.min() + 3) if len(gxs) else int(info['govde_gen'] // 2),
                  'boy': int(info.get('boy', 0) // 2) if info.get('boy') else None, 'px': 2, 'parcalar': sorted(parts),
                  'renk': len(set(tuple(int(v) for v in OA[y, x]) for y, x in zip(*np.where(OM))))})
    GD.rgba(OA, OM).save(base + '.png')
    GD.rgba(A, alpha).save(base + '_ic.png')
    GD.rgba(bare, alpha).save(base + '_yuzsuz.png')
    Image.fromarray(mask).save(mk_path)
    json.dump(info2, open(base + '.json', 'w'), ensure_ascii=False, indent=1)
    print(key, stage, 'iri', W, 'x', H, 'renk', info2['renk'], 'parca', info2['parcalar'])
    return info2


def main():
    key = sys.argv[1]
    stages = sys.argv[2:] or ['bebek', 'genc', 'usta']
    for st in stages:
        shrink(key, st)


if __name__ == '__main__':
    main()
