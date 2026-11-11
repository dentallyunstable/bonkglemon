# 1.0.9 (Eren): arayuz simgeleri (kilit, yildiz, kalp, tik...) piksel olsun.
# Pixelify Sans'ta olmayan simgeler icin kucuk bir piksel yazi tipi uretir: vendor/fonts/bonk-sym.woff2
# Her simge 7 satir piksel; 1 piksel = 128 birim (Tiny5 ile ayni izgara).
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
import os
G = {
 '★': ['...#...', '...#...', '#######', '.#####.', '..###..', '.##.##.', '.#...#.'],
 '☆': ['...#...', '..#.#..', '###.###', '#.....#', '.#...#.', '.#.#.#.', '##...##'],
 '✦': ['...#...', '...#...', '..###..', '#######', '..###..', '...#...', '...#...'],
 '♥': ['.##.##.', '#######', '#######', '#######', '.#####.', '..###..', '...#...'],
 '♡': ['.##.##.', '#..#..#', '#.....#', '#.....#', '.#...#.', '..#.#..', '...#...'],
 '✓': ['.......', '......#', '.....##', '#...##.', '##.##..', '.###...', '..#....'],
 '✗': ['.......', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '.......'],
 '→': ['.......', '....#..', '....##.', '#######', '....##.', '....#..', '.......'],
 '←': ['.......', '..#....', '.##....', '#######', '.##....', '..#....', '.......'],
 '↑': ['...#...', '..###..', '.#####.', '...#...', '...#...', '...#...', '...#...'],
 '▼': ['.......', '.......', '#######', '.#####.', '..###..', '...#...', '.......'],
 '▶': ['#....', '##...', '###..', '####.', '###..', '##...', '#....'],
 '●': ['.....', '.###.', '#####', '#####', '#####', '.###.', '.....'],
 '⏳': ['#######', '.#...#.', '..#.#..', '...#...', '..###..', '.#####.', '#######'],
 '🔒': ['..###..', '.#...#.', '.#...#.', '#######', '###.###', '###.###', '#######'],
 '🌙': ['..###..', '.##....', '##.....', '##.....', '##.....', '.##....', '..###..'],
 '🎁': ['.##.##.', '...#...', '#######', '#..#..#', '#######', '#..#..#', '#######'],
}
G['✔'] = G['✓']; G['✕'] = G['✗']
U, L = 128, 0
names = ['.notdef', 'space'] + ['s%x' % ord(c) for c in G]
fb = FontBuilder(1024, isTTF=True)
fb.setupGlyphOrder(names)
cmap = {32: 'space'}
cmap.update({ord(c): 's%x' % ord(c) for c in G})
fb.setupCharacterMap(cmap)
glyphs, metrics = {}, {}
def empty():
    p = TTGlyphPen(None); return p.glyph()
glyphs['.notdef'] = empty(); metrics['.notdef'] = (500, 0)
glyphs['space'] = empty(); metrics['space'] = (400, 0)
for c, rows in G.items():
    p = TTGlyphPen(None)
    w = max(len(r) for r in rows)
    for j, r in enumerate(rows):
        y0 = (len(rows) - 1 - j) * U - U
        for i, ch in enumerate(r):
            if ch != '#': continue
            x0 = L + i * U
            p.moveTo((x0, y0)); p.lineTo((x0, y0 + U)); p.lineTo((x0 + U, y0 + U)); p.lineTo((x0 + U, y0)); p.closePath()
    n = 's%x' % ord(c)
    glyphs[n] = p.glyph(); metrics[n] = ((w + 1) * U, 0)
fb.setupGlyf(glyphs)
fb.setupHorizontalMetrics(metrics)
fb.setupHorizontalHeader(ascent=896, descent=-256)
fb.setupNameTable({'familyName': 'BonkSym', 'styleName': 'Regular'})
fb.setupOS2(sTypoAscender=896, sTypoDescender=-256, usWinAscent=896, usWinDescent=256)
fb.setupPost()
out = os.path.join(os.path.dirname(__file__), '..', 'vendor', 'fonts', 'bonk-sym.woff2')
fb.font.flavor = 'woff2'
fb.save(out)
print('ok', out, os.path.getsize(out))
