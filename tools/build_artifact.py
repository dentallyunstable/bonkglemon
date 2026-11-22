# Test kopyasi (claude.ai artifact) icin tek HTML dosyasi uretir.
# Kullanim: python3 tools/build_artifact.py <cikis.html> [yayin_klasoru]   (esbuild gerekir: npx esbuild)
# yayin_klasoru verilirse Glemon resimleri oraya paketlenir: assets/glemons/<tur>.pak.json (tur basina tek dosya),
# assets/glemons/ikonlar.json, glemons.json, fx.png, fx.json. Artifact en cok ~500 dosya tutabildigi icin (src/glemon2.js PAK).
# CSS (yazi tipleri base64) + index.html govdesi + esbuild ile paketlenmis src/main.js; Phaser jsDelivr'dan.
import base64, json, re, shutil, subprocess, sys, os
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
out = sys.argv[1]
css = open(os.path.join(root, 'css/style.css'), encoding='utf8').read()
def font(m):
    p = os.path.normpath(os.path.join(root, 'css', m.group(1)))
    return 'url(data:font/woff2;base64,' + base64.b64encode(open(p, 'rb').read()).decode() + ')'
css = re.sub(r'url\((\.\./vendor/fonts/[^)]+\.woff2)\)', font, css)
html = open(os.path.join(root, 'index.html'), encoding='utf8').read()
body = html[html.index('<div id="stage">'):html.index('<script src="vendor/phaser.min.js">')]
js = subprocess.run(['npx', 'esbuild', os.path.join(root, 'src/main.js'), '--bundle', '--minify', '--format=iife', '--define:__DEV__=false'], capture_output=True, text=True, check=True).stdout
js = js.replace('</script', '<\\/script')
page = ('<title>Bonkglemon</title>\n<style>\n:root{color-scheme:dark}\n' + css + '\n</style>\n' + body +
        '<script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>\n<script>' + js + '</script>\n')
open(out, 'w', encoding='utf8').write(page)
print(out, len(page))

if len(sys.argv) > 2:
    G = os.path.join(root, 'assets/glemons')
    dst = os.path.join(sys.argv[2], 'assets/glemons')
    os.makedirs(dst, exist_ok=True)
    icons = {}
    n = 0
    for key in sorted(os.listdir(G)):
        d = os.path.join(G, key)
        if not os.path.isdir(d) or key == 'kukla':   # kukla: yalniz arac verisi, oyun kullanmaz
            continue
        pak = {}
        for f in sorted(os.listdir(d)):
            if not f.endswith('.png'):
                continue
            b = base64.b64encode(open(os.path.join(d, f), 'rb').read()).decode()
            if f.endswith('_ikon.png'):
                icons['%s/%s' % (key, f[:-len('_ikon.png')])] = b
            else:
                pak[f] = b
        json.dump(pak, open(os.path.join(dst, key + '.pak.json'), 'w'), separators=(',', ':'))
        n += 1
    json.dump(icons, open(os.path.join(dst, 'ikonlar.json'), 'w'), separators=(',', ':'))
    for f in ('glemons.json', 'fx.png', 'fx.json'):
        shutil.copy(os.path.join(G, f), os.path.join(dst, f))
    print('paket', n, 'tur,', len(icons), 'ikon ->', dst)
