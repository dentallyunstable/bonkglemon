"""Bonk paleti (Glemon Yenileme Plani v2, bolum 3.5): 14 aile x 4 ton + Parilti + Murekkep.

Butun yeni Glemon araclari rengi buradan okur. Ton 1 acik, 2 orta, 3 golge, 4 derin.
"""
import math

FAMILIES = {
    'Krem':     ['#f6ead2', '#e3cfa8', '#bfa27c', '#8c7358'],
    'Kahve':    ['#d9a36a', '#b07a4a', '#7d5234', '#523424'],
    'Kirmizi':  ['#e8776a', '#c9544c', '#963a40', '#642a36'],
    'Turuncu':  ['#f2a65a', '#dd7f3c', '#b05a30', '#7a3c2a'],
    'Sari':     ['#f7dc8a', '#e8bd5a', '#bd8c3c', '#86602e'],
    'Cimen':    ['#b5d977', '#86b85a', '#5a8c48', '#3a6040'],
    'Cam':      ['#9fe0c0', '#62b89c', '#3f8a7c', '#2c5c5e'],
    'Gok':      ['#bfe6f2', '#86c4e0', '#5a94c0', '#3e6490'],
    'Lacivert': ['#7c86c8', '#55599c', '#3a3a70', '#25244a'],
    'Mor':      ['#cdb0e8', '#a384cc', '#74589e', '#4a3a6c'],
    'Pembe':    ['#f7c6d0', '#ec9cb0', '#c46e8c', '#8e4a68'],
    'Tas':      ['#c8c6d4', '#9896a8', '#6a687c', '#444254'],
    'Kar':      ['#f4f8fa', '#d2dde8', '#a3b4c8', '#74859e'],
    'Komur':    ['#5c4e58', '#3e3440', '#2a222e', '#1c1622'],
}
PARILTI = '#fff6e8'
MUREKKEP = '#1c1622'


def rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def hexs(c):
    return '#%02x%02x%02x' % tuple(c[:3])


def tone(name):
    """'Kahve-4' -> (r,g,b); 'Parilti' ve 'Murekkep' de gecerli."""
    if name == 'Parilti':
        return rgb(PARILTI)
    if name == 'Murekkep':
        return rgb(MUREKKEP)
    fam, n = name.rsplit('-', 1)
    return rgb(FAMILIES[fam][int(n) - 1])


# renk -> (aile, ton) ters tablo (Murekkep Komur-4 ile ayni renktir)
LOOKUP = {}
for _f, _ts in FAMILIES.items():
    for _i, _h in enumerate(_ts):
        LOOKUP.setdefault(rgb(_h), (_f, _i + 1))
LOOKUP[rgb(PARILTI)] = ('Parilti', 0)


def family_of(c):
    return LOOKUP.get(tuple(c[:3]))


def _lab(c):
    def f(u):
        u /= 255
        return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4
    r, g, b = (f(v) for v in c[:3])
    x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047
    y = r * 0.2126 + g * 0.7152 + b * 0.0722
    z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883
    def t(v):
        return v ** (1 / 3) if v > 0.008856 else 7.787 * v + 16 / 116
    fx, fy, fz = t(x), t(y), t(z)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


_LABC = {}


def lab(c):
    c = tuple(c[:3])
    if c not in _LABC:
        _LABC[c] = _lab(c)
    return _LABC[c]


def dist(a, b):
    la, lb = lab(a), lab(b)
    return math.sqrt(sum((p - q) ** 2 for p, q in zip(la, lb)))


def candidates(families, extra=('Parilti', 'Murekkep')):
    out = []
    for f in families:
        out += [rgb(h) for h in FAMILIES[f]]
    for e in extra:
        out.append(tone(e))
    return out


def nearest(c, cands):
    best = min(cands, key=lambda k: dist(c, k))
    return best, dist(c, best)


def swap_map(pairs):
    """{'Kahve':'Kar'} -> {rgb: rgb} (her ton ayni numarali tona)."""
    m = {}
    for a, b in pairs.items():
        for i in range(4):
            m[rgb(FAMILIES[a][i])] = rgb(FAMILIES[b][i])
    return m
