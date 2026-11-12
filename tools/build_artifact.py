# Test kopyasi (claude.ai artifact) icin tek HTML dosyasi uretir.
# Kullanim: python3 tools/build_artifact.py <cikis.html>   (esbuild gerekir: npx esbuild)
# CSS (yazi tipleri base64) + index.html govdesi + esbuild ile paketlenmis src/main.js; Phaser jsDelivr'dan.
import base64, re, subprocess, sys, os
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
