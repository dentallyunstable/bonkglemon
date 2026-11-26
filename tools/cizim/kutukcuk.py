# Kutukcuk (Orman). On (3/4) cizim Eren'in resminden gelir (glemon_import + glemon_kucult); bu dosyada YALNIZ yandan
# gorunum var (1.0.28, Eren 2026-11-26: yururken yandan). Elle iri piksel (pix2): her harf oyunda 2x2 blok, Glemon sola bakar.
# Renkler on cizimdekiyle ayni tonlar. Dis cizgi otomatik eklenir (haritada yok). Goz/yanak set_face_side ile basilir.

KB = {'a': 'Kahve-2', 'c': 'Kahve-3', 'b': 'Kahve-4', 'i': 'Kahve-1', 'd': 'Krem-2', 'h': 'Krem-4', 'f': 'Cimen-4', 'g': 'Cimen-2'}
KG = {'a': 'Kahve-2', 'b': 'Kahve-4', 'c': 'Kahve-3', 'd': 'Cimen-4', 'e': 'Krem-2', 'f': 'Cimen-2', 'h': 'Krem-4',
      'i': 'Kirmizi-4', 'j': 'Kirmizi-2', 'k': 'Cimen-3', 'l': 'Kahve-1'}
KU = {'a': 'Kahve-2', 'b': 'Kahve-4', 'c': 'Kahve-3', 'd': 'Cimen-4', 'e': 'Cimen-2', 'f': 'Cimen-3', 'g': 'Krem-2',
      'i': 'Kahve-1', 'k': 'Gok-4', 'l': 'Gok-3', 'n': 'Krem-4'}


def ciz(d, rows, key, parts):
    """rows'u parcalara bol: parts = {parca: (y0, y1, x0, x1)} (dahil); kalan govde."""
    def region(p):
        y0, y1, x0, x1 = parts[p]
        return [''.join(ch if (y0 <= y <= y1 and x0 <= x <= x1) else '.' for x, ch in enumerate(r)) for y, r in enumerate(rows)]
    used = set()
    for p in parts:
        y0, y1, x0, x1 = parts[p]
        used |= {(y, x) for y in range(y0, y1 + 1) for x in range(x0, x1 + 1)}
    body = [''.join('.' if (y, x) in used else ch for x, ch in enumerate(r)) for y, r in enumerate(rows)]
    d.pix2((0, 0), body, key)
    for p in parts:
        d.pix2((0, 0), region(p), key, part=p)


def bebek_yan(d):
    rows = [
        '........ff.ff..',
        '.......fggfggf.',
        '........fggf...',
        '...hhhddddhhb..',
        '.hhddddddddddh.',
        '.iaaaaacaaacab.',
        'iaaaaaacaaacacb',
        'iaaaaaaaabaacbb',
        'iaaaaacaaabacbb',
        'iaaaaacaaabaccb',
        'iaaaaaaaaaaacbb',
        'iacaaaabaaacacb',
        '.acaaaaabaaccb.',
        '.ccaaacaaaccbb.',
        '..bccaacccbbb..',
        '...cb....cb....',
    ]
    ciz(d, rows, KB, {'tepe': (0, 2, 0, 14), 'kol_1': (15, 15, 0, 6), 'kol_2': (15, 15, 7, 14)})
    d.set_face_side(2, 14, ten='Kahve')


def genc_yan(d):
    rows = [
        '..............dd...',
        '..........dd.dffd..',
        '.........dffkdffd..',
        '..........dkbbdd...',
        '............kbab...',
        '....hhhheeeebaab...',
        '..hheeeeeeeeeeeehh.',
        '.lahheeeeeeehheeacb',
        'laaaaacaaaaaaacaacb',
        'laaaaacaabaaaacaijb',
        'laaaaaaaaabaaacijjj',
        'laaaaaaaaaacbaacijb',
        'laaaaaaaacaacbacabb',
        'laaaaaaaacaaaaacbcb',
        'lacaaaaaaaaaabacbcb',
        'lacaaaabaaaaabaccbb',
        '.aaaaaaabaaaaaaccb.',
        '.ccaaaaaaaacaaccbb.',
        '..ccaacaaaacacccb..',
        '...bbccaaacccbbb...',
        '....bcb....bccb....',
        '....bcb....bccb....',
    ]
    ciz(d, rows, KG, {'tepe': (0, 3, 0, 18), 'kol_1': (20, 21, 0, 8), 'kol_2': (20, 21, 9, 18)})
    d.set_face_side(2, 20, ten='Kahve')


def usta_yan(d):
    rows = [
        '...........ddddd......',
        '.........ddeeeeedd....',
        '.......ddeeeffeefffd..',
        '......deeeeedddffffd..',
        '......deeddebbffdddd..',
        '.......dddbbbbdeeed...',
        '....kkb...bbbcbbfffd..',
        '...ll.....bcb..ddd....',
        '....nnnggggibggnn.....',
        '..nngggggggggggggnn...',
        '.iiggnggggggggnngggb..',
        'iiaaannaaacaaaaaacacb.',
        'iaaaaaaacaaaaaaaacacbd',
        'iaacaaaacaaabaaaacccde',
        'iaacaaaaaaaabaaaaccdee',
        'iaaaaaaaaaaabacaacdeef',
        'iaaaaaaacaaaabcaacdffd',
        'iaaaaaaacaaaabaaaaccdb',
        'iaaaaaaaaaaaaabaaaaccb',
        'iacaaaaaaaacaaaaacaccb',
        'iacaaaaabaacaaaaaacbbb',
        '.aaaaaaaabaaaabaaaccbb',
        '.caaacaaaabaaabaaccbb.',
        '..ccaacaaaaacaacccbb..',
        '..bbbcccaaaacccbbbbb..',
        '...bccbb....bbccbb....',
        '...bccb......bccb.....',
    ]
    ciz(d, rows, KU, {'tepe': (0, 7, 0, 21), 'kol_1': (25, 26, 0, 9), 'kol_2': (25, 26, 10, 21)})
    d.set_face_side(2, 30, ten='Kahve')


STAGES = {'bebek_yan': bebek_yan, 'genc_yan': genc_yan, 'usta_yan': usta_yan}
