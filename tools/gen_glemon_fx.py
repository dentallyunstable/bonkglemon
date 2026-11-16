"""Ortak Glemon efekt parcaciklari (Plan v2, bolum 5.6): assets/glemons/fx.png + fx.json.

Her efekt 9x9 hucrede, ortak paletten. Harf -> renk tablosu her efektin yaninda.
Kullanim: python3 tools/gen_glemon_fx.py
"""
import json, os, sys
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bonk_palette as BP

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CELL = 9

FX = {
    'yaprak': ({'a': 'Cimen-1', 'b': 'Cimen-2', 'c': 'Cimen-3', 'd': 'Cimen-4'}, [
        '.........', '....dd...', '...dabd..', '..dabbd..', '..dbbcd..', '..dbcd...', '..dcd....', '.dd......', '.........']),
    'spor': ({'a': 'Krem-1', 'b': 'Cimen-1', 'c': 'Cimen-3'}, [
        '.........', '.........', '...cc....', '..cabc...', '..cbbc...', '...cc....', '.........', '.........', '.........']),
    'diken': ({'a': 'Krem-1', 'b': 'Kahve-2', 'c': 'Kahve-4'}, [
        '.........', '.........', '.........', '.cc......', '.cabbbcc.', '.cbbbbbcc', '.cc......', '.........', '.........']),
    'cicek': ({'a': 'Pembe-1', 'b': 'Pembe-2', 'c': 'Pembe-4', 'y': 'Sari-1'}, [
        '.........', '...cc....', '..cabc...', '.cabybc..', '.cbyybc..', '..cbbc...', '...cc....', '.........', '.........']),
    'tas': ({'a': 'Tas-1', 'b': 'Tas-2', 'c': 'Tas-3', 'd': 'Tas-4'}, [
        '.........', '.........', '...ddd...', '..dabbd..', '..dbbcd..', '..dbccd..', '...ddd...', '.........', '.........']),
    'kristal': ({'a': 'Mor-1', 'b': 'Mor-2', 'c': 'Mor-3', 'd': 'Mor-4', 'o': 'Parilti'}, [
        '.........', '....d....', '...dod...', '...dbd...', '..dabcd..', '..dbbcd..', '...dcd...', '....d....', '.........']),
    'toz': ({'a': 'Krem-1', 'b': 'Krem-2', 'c': 'Krem-3'}, [
        '.........', '.........', '..bb.....', '.babb.bb.', '.bbbbbab.', '..cbbbbc.', '...cccc..', '.........', '.........']),
    'kum': ({'a': 'Sari-1', 'b': 'Sari-2', 'c': 'Sari-3'}, [
        '.........', '.........', '..ab.....', '..bc..ab.', '......bc.', '...ab....', '...bc....', '.........', '.........']),
    'kar': ({'a': 'Kar-1', 'b': 'Kar-2', 'c': 'Kar-3'}, [
        '.........', '.........', '....b....', '..b.a.b..', '...aaa...', '..b.a.b..', '....b....', '.........', '.........']),
    'buz': ({'a': 'Kar-1', 'b': 'Gok-1', 'c': 'Gok-2', 'd': 'Gok-4'}, [
        '.........', '....d....', '...dad...', '...dbd...', '..dabcd..', '..dbccd..', '...dcd...', '....d....', '.........']),
    'kivilcim': ({'a': 'Parilti', 'b': 'Sari-1', 'c': 'Turuncu-1'}, [
        '.........', '.........', '....c....', '....b....', '..cbabc..', '....b....', '....c....', '.........', '.........']),
    'alev': ({'a': 'Sari-1', 'b': 'Turuncu-1', 'c': 'Turuncu-2', 'd': 'Turuncu-4'}, [
        '....d....', '...dcd...', '...dcd...', '..dcbcd..', '..cbabc..', '.dcbaabd.', '.dcbaabd.', '..dccccd.', '...dddd..']),
    'duman': ({'a': 'Tas-1', 'b': 'Tas-2', 'c': 'Tas-3'}, [
        '.........', '...bb....', '..babb...', '.bbabbb..', '.bbbbbbb.', '..cbbbbc.', '...cccc..', '.........', '.........']),
    'lav': ({'a': 'Sari-1', 'b': 'Turuncu-1', 'c': 'Kirmizi-2', 'd': 'Kirmizi-4'}, [
        '.........', '....d....', '...dcd...', '..dcbcd..', '..dbabd..', '..dcbcd..', '...ddd...', '.........', '.........']),
    'golge': ({'a': 'Lacivert-2', 'b': 'Lacivert-3', 'c': 'Lacivert-4'}, [
        '.........', '..bb.....', '.babbb...', '.bbbbbbb.', '..cbbbbbb', '...cbbbc.', '....ccc..', '.........', '.........']),
    'ruh': ({'a': 'Parilti', 'b': 'Cam-1', 'c': 'Cam-2', 'd': 'Cam-3'}, [
        '.........', '...ddd...', '..dbbbd..', '..dbabd..', '..dbbbd..', '..dcbcd..', '...dcd...', '....dd...', '.........']),
    'murekkep': ({'a': 'Komur-1', 'b': 'Komur-2', 'c': 'Komur-3'}, [
        '.........', '....c....', '...cbc...', '..cbabc..', '..cbbbc..', '...ccc...', '.........', '.........', '.........']),
    'yildiz': ({'a': 'Parilti', 'b': 'Sari-1', 'c': 'Sari-2', 'd': 'Sari-4'}, [
        '....d....', '...dbd...', 'dddbabddd', 'dbbaaabbd', '.dccbccd.', '..dcdcd..', '.dcd.dcd.', '.dd...dd.', '.........']),
    'aytozu': ({'a': 'Parilti', 'b': 'Mor-1', 'c': 'Mor-2'}, [
        '.........', '.........', '....b....', '...bab...', '....b....', '.......c.', '..c......', '.........', '.........']),
    'su': ({'a': 'Kar-1', 'b': 'Gok-1', 'c': 'Gok-2', 'd': 'Gok-4'}, [
        '.........', '....d....', '...dcd...', '...dcd...', '..dcbcd..', '..dbabd..', '..dcbcd..', '...ddd...', '.........']),
    'kabarcik': ({'a': 'Parilti', 'b': 'Cimen-1', 'c': 'Cimen-3'}, [
        '.........', '.........', '...ccc...', '..cabbc..', '..cbbbc..', '..cbbbc..', '...ccc...', '.........', '.........']),
    'simsek': ({'a': 'Parilti', 'b': 'Sari-1', 'd': 'Sari-4'}, [
        '....ddd..', '...dbbd..', '..dbbd...', '.dbbbbdd.', '.ddbbbbd.', '...dbbd..', '..dbd....', '..dd.....', '.........']),
    'ipek': ({'a': 'Kar-1', 'b': 'Kar-2'}, [
        '.........', '.........', '.a.......', '..a...a..', '...a.a.a.', '....a...a', '.........', '.........', '.........']),
    'kalp': ({'a': 'Parilti', 'b': 'Pembe-1', 'c': 'Pembe-2', 'd': 'Pembe-4'}, [
        '.........', '.dd.dd...', 'dabdbcd..', 'dbccccd..', 'dcccccd..', '.dcccd...', '..dcd....', '...d.....', '.........']),
    'nota': ({'a': 'Lacivert-2', 'd': 'Lacivert-4'}, [
        '.........', '....dddd.', '....d..d.', '....d..d.', '....d..d.', '..ddd.dd.', '.dadd.dd.', '..dd.....', '.........']),
    'z': ({'a': 'Kar-1', 'd': 'Lacivert-3'}, [
        '.........', '.ddddd...', '.daaad...', '.dddad...', '..dad....', '.dadddd..', '.daaaad..', '.dddddd..', '.........']),
    'isik_halkasi': ({'a': 'Parilti', 'b': 'Sari-1'}, [
        '...bbb...', '.bb...bb.', '.b.....b.', 'b.......b', 'b.......b', 'b.......b', '.b.....b.', '.bb...bb.', '...bbb...']),
    'ses_halkasi': ({'a': 'Sari-1', 'b': 'Sari-2'}, [
        '.........', '...aaa...', '..a...a..', '.a.....a.', '.a.....a.', '.a.....a.', '..a...a..', '...aaa...', '.........']),
    'pence_izi': ({'a': 'Parilti', 'b': 'Kar-2'}, [
        'a..a..a..', '.a..a..a.', '.a..a..a.', '..a..a..a', '..a..a..a', '..b..b..b', '...b..b..', '.........', '.........']),
    'dis_izi': ({'a': 'Parilti', 'b': 'Kar-3'}, [
        '.........', '..aaaaa..', '.a.....a.', '.ba.a.ab.', '.........', '.ba.a.ab.', '.a.....a.', '..aaaaa..', '.........']),
    'vurus_yildizi': ({'a': 'Parilti', 'b': 'Sari-1', 'c': 'Turuncu-1'}, [
        '....c....', 'c...b...c', '.b.bab.b.', '..baaab..', 'cbaaaaabc', '..baaab..', '.b.bab.b.', 'c...b...c', '....c....']),
}


def main():
    names = list(FX)
    img = Image.new('RGBA', (CELL * len(names), CELL), (0, 0, 0, 0))
    for i, n in enumerate(names):
        pal, rows = FX[n]
        assert len(rows) == CELL and all(len(r) == CELL for r in rows), n
        for y, r in enumerate(rows):
            for x, c in enumerate(r):
                if c != '.':
                    img.putpixel((i * CELL + x, y), BP.tone(pal[c]) + (255,))
    img.save(os.path.join(ROOT, 'assets/glemons/fx.png'), optimize=True)
    json.dump({'cell': CELL, 'names': names}, open(os.path.join(ROOT, 'assets/glemons/fx.json'), 'w'))
    img.resize((img.width * 6, img.height * 6), Image.NEAREST).save(os.path.join(ROOT, 'onizleme/fx.png'))
    print(len(names), 'efekt')


if __name__ == '__main__':
    main()
