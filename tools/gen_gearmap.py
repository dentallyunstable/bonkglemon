"""Karakter atlaslari icin "ekipman katmani haritasi" uretir (0.13.1, Eren'in istegi).

Kullanim: python3 tools/gen_gearmap.py [assets/chars]

Eren (2026-11-10): zirh animasyonu yeniden boyamasin, karakterin USTUNE eklensin ve her
bakis acisina uysun (3/4 onden bakarken kask da 3/4 durmali). Eldeki esyalar (cimen blogu,
iksir, kilic...) asla boyanmasin. Aletler sadece kendi animasyonunda degissin: kazma sadece
kazarken, kilic sadece kilic hareketlerinde, yay sadece ok atarken.

Bu yuzden her karede once kafa kutusu bulunur (chibi kafasi sabit boyutlu bir kutu), sonra
bakis acisina gore (anims.json'daki view) kask bir sablondan cizilir:
  34      : kafanin yan yuzu tamamen kapali, on yuzde ustte bant + iki yanak koruyucu, yuz acik
  side    : on taraftaki yuz acik, gerisi kapali
  34back / back : butun kafa kapali
Goguslik govdeyi (omuzlar dahil) kaplar, bot ayaklari; ikisi de eldeki esyalarin ustune cizilmez.

  gear.json  her kare icin 2 piksel bosluklu yeni bir atlas yerlesimi ve karenin orijinal yeri
  gear.png   ayni yerlesimde katmanin sekli:
             R = parca x20: 1 kask, 2 goguslik, 3 bot, 4 kilic agzi, 5 kazma ucu, 6 yay,
                 7 pelerin ustu, 8 pelerin etegi
             G = ton x60 (0 koyu .. 3 parlak, 4 sus rengi), B = 255 ise dis cizgi
  cape.png   pelerin katmani (goguslugun ustune)
"""
import colorsys, json, os, sys
from PIL import Image

ROOT = sys.argv[1] if len(sys.argv) > 1 else 'assets/chars'
PAD = 2
# alet sadece kendi animasyonunun karelerinde boyanir
TOOL_ANIMS = {'stab': 4, 'spin': 4, 'b_stab': 4, 'b_spin': 4, 'mine': 5, 'bowshot': 6, 'b_bowshot': 6}
BASE_ANIMS = ['idle', 'walk', 'run', 'idlesway', 'hurt', 'sit', 'wave', 'clap', 'cheer', 'punch', 'jump']
HEAD_H = 17        # kafa kutusu: ust cizgi + 16 satir (alt cizgi 17. satir)
HEAD_MIN_W = 14    # kafa satiri en az bu kadar genis bir parca
HELM_LOW = 13      # kaskin yanlari bu satira kadar iner
BAND = 7           # on yuzde ust bant bu satira kadar
TORSO = (18, 26)   # goguslik satirlari (kafa ustunden)
SHOULDER = (18, 20)
BOOT_ROWS = 3
CAPE = (17, 31)
# Donme (spin) animasyonu butun bakis acilarindan gecer; anims.json hepsine '34' der.
# 'm' = aynali (sola donuk) bakis.
VIEW_FIX = {}
for _a in ('spin', 'b_spin'):
    for _i, _v in enumerate(['front' if _a == 'spin' else '34', '34', 'side', '34back', 'back', '34backm', 'sidem', '34m']):
        VIEW_FIX[f'{_a}/{_i}'] = _v
# Savasta asa ile buyu: yumruk karelerinin kopyasi (b_cast); yumruk kareleri iksir/yemek
# animasyonlarinda da kullanildigi icin asa ayri karelere cizilir.
ALIAS = {f'b_cast/{i}': f'b_punch/{i}' for i in range(3)}
# animasyonda hic olmayan aletler katmana eklenir: 9 kilic (doner kesik), 10 yay (arkadan ok), 11 asa
DRAWN = {'spin': 9, 'b_spin': 9, 'b_bowshot': 10, 'b_cast': 11}
TOOL_PAD = 13


def padf(name):
    return TOOL_PAD if name.split('/')[0] in DRAWN else PAD


KR = 20            # R kanali = parca x20
TONE = 60          # G kanali = ton x60 (0 koyu, 1 orta, 2 acik, 3 parlak, 4 sus rengi)


def is_outline(p):
    return p[0] == 0 and p[1] == 0 and p[2] == 0


def lum(p):
    return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]


def hsv(p):
    return colorsys.rgb_to_hsv(*[c / 255 for c in p[:3]])


def frame_img(atlas, fr):
    f = fr['frame']
    return atlas.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))


def skin_model(atlas, frames):
    fr = frames['idle/0']
    img = frame_img(atlas, fr)
    ss = fr['spriteSourceSize']
    cx = fr['pivot']['x'] * fr['sourceSize']['w'] - ss['x']
    top = min(y for y in range(img.height) for x in range(img.width) if img.getpixel((x, y))[3])
    count = {}
    for y in range(top + 6, top + 16):
        for x in range(int(cx) - 6, int(cx) + 6):
            p = img.getpixel((x, y))
            if p[3] and not is_outline(p):
                count[p[:3]] = count.get(p[:3], 0) + 1
    for vmin in (0.6, 0.45):
        cand = [(n, c) for c, n in count.items() if hsv(c)[2] > vmin and hsv(c)[1] > 0.08]
        if cand:
            return hsv(max(cand)[1])
    return None


def is_skin(p, sk):
    if not sk:
        return False
    h, s, v = hsv(p)
    dh = min(abs(h - sk[0]), 1 - abs(h - sk[0]))
    return dh < 0.05 and abs(s - sk[1]) < 0.16 and v > sk[2] * 0.68


def base_palette(atlas, frames):
    pal = set()
    for name, fr in frames.items():
        if name.split('/')[0].replace('b_', '') in BASE_ANIMS:
            img = frame_img(atlas, fr)
            px = img.load()
            for y in range(img.height):
                for x in range(img.width):
                    if px[x, y][3]:
                        pal.add(px[x, y][:3])
    return pal


def frame_views(char_dir, frames):
    anims = json.load(open(os.path.join(char_dir, 'anims.json')))['anims']
    view, anim_of = {}, {}
    for a, d in anims.items():
        for f in d.get('frames', []):
            view.setdefault(f, d.get('view', '34'))
            anim_of.setdefault(f, set()).add(a)
    for f in frames:
        if f not in view:
            a = f.split('/')[0]
            view[f] = '34back' if a.startswith('b_') else 'back' if a == 'walkin' else 'side' if a == 'fish' else '34'
    return view, anim_of


# 1.0.25 (Eren): altin elma / totem gibi animasyonlarda kafanin/govdenin ustundeki parlama ve
# parcaciklar kafa bulmayi sasirtiyor; bazi karelerde kask/goguslik bos ya da yarim cikiyor ve
# zirh cok hizli yanip sonuyor. Bu karelerde eksik parca, ayni animasyonun en yakin saglam
# karesinden (ayni kaynak koordinatina) kopyalanir. Karakterin gercekten kayboldugu
# animasyonlara (olum, patlama, kaybolma) dokunulmaz.
REPAIR = ('goldenapple', 'totem', 'levelup', 'love')   # parlama/parcacikli animasyonlar
REPAIR_MIN = 0.75


def repair(out, meta, atlas, frames, pal, log):
    O = out.load()
    A = atlas.load()
    by_anim = {}
    for n in meta:
        a, i = n.rsplit('/', 1)
        by_anim.setdefault(a, []).append((int(i), n))
    def pix(n, k):
        m = meta[n]['frame']; res = []
        for y in range(m['y'], m['y'] + m['h']):
            for x in range(m['x'], m['x'] + m['w']):
                p = O[x, y]
                if p[3] and round(p[0] / KR) == k:
                    res.append((x, y, p))
        return res
    def src_px(n, sx, sy):
        f = frames[n]; ss = f['spriteSourceSize']; fr = f['frame']
        x, y = sx - ss['x'], sy - ss['y']
        return A[fr['x'] + x, fr['y'] + y] if 0 <= x < fr['w'] and 0 <= y < fr['h'] else (0, 0, 0, 0)
    sil = {}
    def body_set(n):
        if n not in sil:
            f = frames[n]; ss = f['spriteSourceSize']; fr = f['frame']; st = set()
            for y in range(fr['h']):
                for x in range(fr['w']):
                    q = A[fr['x'] + x, fr['y'] + y]
                    if q[3] and (is_outline(q) or q[:3] in pal):
                        st.add((x + ss['x'], y + ss['y']))
            sil[n] = st
        return sil[n]
    def diff(n, g):
        return len(body_set(n) ^ body_set(g))
    for a, lst in by_anim.items():
        base = a[2:] if a.startswith('b_') else a
        if base not in REPAIR or len(lst) < 4:
            continue
        lst.sort()
        names = [n for _, n in lst]
        for k in (1, 2, 3):
            cnt = {n: len(pix(n, k)) for n in names}
            vals = sorted(cnt.values())
            med = vals[len(vals) // 2]
            if med < 20:
                continue
            good = [j for j, n in enumerate(names) if cnt[n] >= REPAIR_MIN * med]
            if not good:
                continue
            # art arda bozuk kareler tek bir kaynak kareden alinir (kask sekli kareler arasinda ziplamasin):
            # karakter silueti en cok benzeyen saglam kare, esitse en yakini
            runs, cur = [], []
            for j, n in enumerate(names):
                if cnt[n] < REPAIR_MIN * med:
                    cur.append(j)
                elif cur:
                    runs.append(cur); cur = []
            if cur:
                runs.append(cur)
            src = {}
            for r in runs:
                q = min(good, key=lambda q: (sum(diff(names[j], names[q]) for j in r), min(abs(q - j) for j in r), q))
                for j in r:
                    src[j] = q
            for j, n in enumerate(names):
                if j not in src:
                    continue
                g = names[src[j]]
                mg, mb = meta[g], meta[n]
                fb = mb['frame']
                # once bu karedeki yarim parca silinir, sonra saglam kareninki kopyalanir
                for x, y, p in pix(n, k):
                    O[x, y] = (0, 0, 0, 0)
                put = 0
                for x, y, p in pix(g, k):
                    sx = x - mg['frame']['x'] - mg['pad'] + mg['spriteSourceSize']['x']
                    sy = y - mg['frame']['y'] - mg['pad'] + mg['spriteSourceSize']['y']
                    bx = sx - mb['spriteSourceSize']['x'] + mb['pad'] + fb['x']
                    by = sy - mb['spriteSourceSize']['y'] + mb['pad'] + fb['y']
                    if not (fb['x'] <= bx < fb['x'] + fb['w'] and fb['y'] <= by < fb['y'] + fb['h']):
                        continue
                    q = src_px(n, sx, sy)
                    if not q[3] and not src_px(g, sx, sy)[3]:
                        continue
                    if q[3] and not is_outline(q) and q[:3] not in pal:
                        continue                  # elde tutulan totem/elma ve parlama zirhin ustunde kalir
                    if O[bx, by][3] and round(O[bx, by][0] / KR) not in (0, k):
                        continue
                    O[bx, by] = p; put += 1
                log.append(f'{a}/{n.rsplit("/",1)[1]} parca {k}: {cnt[n]} -> {put} ({g} karesinden)')


def process(char_dir):
    atlas = Image.open(os.path.join(char_dir, 'atlas.png')).convert('RGBA')
    frames = json.load(open(os.path.join(char_dir, 'atlas.json')))['frames']
    for a, src in ALIAS.items():
        frames[a] = frames[src]                   # ayni resim, ayri ekipman katmani
    sk = skin_model(atlas, frames)
    pal = base_palette(atlas, frames)
    view, anim_of = frame_views(char_dir, frames)
    names = sorted(frames, key=lambda n: -frames[n]['frame']['h'])
    AW = 2048
    lay = {}
    x = y = shelf = 0
    for n in names:
        f = frames[n]['frame']
        pd = padf(n)
        w, h = f['w'] + 2 * pd, f['h'] + 2 * pd
        if x + w > AW:
            x, y, shelf = 0, y + shelf, 0
        lay[n] = (x, y, w, h)
        x += w
        shelf = max(shelf, h)
    AH = y + shelf
    out = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
    O = out.load()
    cout = Image.new('RGBA', (AW, AH), (0, 0, 0, 0))
    CO = cout.load()
    meta = {}
    stats = {'skip': 0}
    for name, fr in frames.items():
        pd = padf(name)
        img = frame_img(atlas, fr)
        W, H = img.size
        P = img.load()
        ss = fr['spriteSourceSize']; so = fr['sourceSize']
        lx, ly, lw, lh = lay[name]
        meta[name] = {
            'frame': {'x': lx, 'y': ly, 'w': lw, 'h': lh}, 'rotated': False, 'trimmed': True,
            'spriteSourceSize': {'x': ss['x'], 'y': ss['y'], 'w': lw, 'h': lh},
            'sourceSize': {'w': so['w'] + 2 * pd, 'h': so['h'] + 2 * pd},
            'pivot': {'x': (fr['pivot']['x'] * so['w'] + pd) / (so['w'] + 2 * pd), 'y': (fr['pivot']['y'] * so['h'] + pd) / (so['h'] + 2 * pd)},
            'pad': pd,
            'src': {'x': fr['frame']['x'], 'y': fr['frame']['y'], 'w': W, 'h': H},
        }
        v = VIEW_FIX.get(name, view[name])
        mirror = v.endswith('m')
        if mirror:                                  # sola donuk kare: aynalanip ayni sablon kullanilir
            v = v[:-1]
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
            P = img.load()
        back = v in ('34back', 'back')
        anims = anim_of.get(name, set())
        tool = next((TOOL_ANIMS[a] for a in anims if a in TOOL_ANIMS), None)
        opaque = lambda xx, yy: 0 <= xx < W and 0 <= yy < H and P[xx, yy][3] > 0
        # eldeki esya: karakterin renk paletinde olmayan pikseller (+ onlara ait siyah cizgi)
        item = [[False] * W for _ in range(H)]
        for yy in range(H):
            for xx in range(W):
                p = P[xx, yy]
                if p[3] and not is_outline(p) and p[:3] not in pal:
                    item[yy][xx] = True
        colored = lambda xx, yy: opaque(xx, yy) and not is_outline(P[xx, yy]) and not item[yy][xx]
        for yy in range(H):
            for xx in range(W):
                if opaque(xx, yy) and is_outline(P[xx, yy]):
                    nb = [(xx + a, yy + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))]
                    if any(0 <= a < W and 0 <= b < H and item[b][a] for a, b in nb) and not any(colored(a, b) for a, b in nb):
                        item[yy][xx] = True
        body = lambda xx, yy: opaque(xx, yy) and not item[yy][xx]

        GW, GH = W + 2 * pd, H + 2 * pd
        part = [[0] * GW for _ in range(GH)]
        cpart = [[0] * GW for _ in range(GH)]

        tone = [[1] * GW for _ in range(GH)]
        ctone = [[1] * GW for _ in range(GH)]

        def put(k, xx, yy, t=1):
            gx, gy = xx + pd, yy + pd
            if not (0 <= gx < GW and 0 <= gy < GH):
                return
            if 0 <= xx < W and 0 <= yy < H and item[yy][xx]:
                return                                  # eldeki esyanin ustune asla
            M = cpart if k >= 7 else part
            if M[gy][gx] == 0 or k < M[gy][gx] or k >= 4:
                M[gy][gx] = k
                (ctone if k >= 7 else tone)[gy][gx] = t

        def run_at(yy):
            """satirdaki en uzun govde parcasi (x0, x1)"""
            best, cur = None, None
            for xx in range(W + 1):
                if xx < W and body(xx, yy):
                    cur = (cur[0], xx) if cur else (xx, xx)
                else:
                    if cur and (not best or cur[1] - cur[0] > best[1] - best[0]):
                        best = cur
                    cur = None
            return best

        # kafa kutusu: en ustteki genis satir (kafanin ust cizgisi)
        top = None
        for yy in range(H):
            r = run_at(yy)
            if r and r[1] - r[0] + 1 >= HEAD_MIN_W:
                top = yy
                break
        ok = top is not None and H >= 26 and top + HEAD_H + 4 <= H
        if ok:
            hr = run_at(top + 5)
            ok = hr is not None and hr[1] - hr[0] + 1 >= HEAD_MIN_W
        if not ok:
            stats['skip'] += 1
        else:
            x0, x1 = hr                      # kafanin sol / sag cizgi sutunu
            cx = (x0 + x1) // 2
            side = v == 'side'
            pure = lambda xx, yy: opaque(xx, yy) and is_outline(P[xx, yy])
            cols = range(max(0, x0 - 1), min(W, x1 + 2))
            B = max((yy for yy in range(top, H) for xx in cols if body(xx, yy)), default=top)
            # govdenin ilk satiri: onden bakista kafanin alt cizgisi (top+17) atlanir
            row17 = [xx for xx in cols if body(xx, top + 17)] if top + 17 < H else []
            tt = top + 18 if row17 and sum(pure(xx, top + 17) for xx in row17) * 2 > len(row17) else top + 17
            # bacaklarin basladigi satir: kol altlarinin cizgisi (yandan: ayaktan 5 satir yukari)
            lt = None
            if not side:
                for r in range(tt + 3, B):
                    for ax in (x0 + 2, x1 - 2):
                        if pure(ax, r) and body(ax, r - 1) and not pure(ax, r - 1):
                            lt = r if lt is None else min(lt, r)
            if lt is None or not 4 <= B - lt <= 8:
                lt = B - 5 if side else max(tt + 6, B - 6)   # kol bulunamadi (kollar havada)
            lt = max(tt + 4, min(lt, B - 3))
            # oturma (1.0.14, Eren: oturunca zirh kotu duruyordu): bacaklar one uzanir. Goguslik
            # ayaklarin one ciktigi satira kadar, bot sadece one uzanan ayaklarda.
            sit = 'sit' in anims
            feet = None
            if sit:
                feet = next((r for r in range(tt + 3, B + 1) if any(body(xx, r) for xx in range(x1 + 2, W))), None)
                if feet is not None:
                    lt = feet
            hand_rows = (lt - 2, lt - 1)

            # ---- kask (bakis acisina gore sablon)
            low = 15 if side else 16          # arkadan butun kafa kapali
            for yy in range(top - 1, top + low + 1):
                d = yy - top
                for xx in range(x0 - 1, x1 + 2):
                    if d < 0 and xx in (x0 - 1, x1 + 1):
                        continue                          # yuvarlak ust koseler
                    if not back and d > BAND:
                        if v == '34':
                            if xx > x0 + 6 and not (xx >= x1 - 1 and d <= 11):
                                continue                  # yuz acik (sagda yanak koruyucu)
                        elif side:
                            if xx > x1 - 7:
                                continue                  # yandan: ondeki yuz acik
                        else:
                            if x0 + 2 < xx < x1 - 2:
                                continue
                    if 0 <= yy < H and 0 <= xx < W and not opaque(xx, yy) and x0 <= xx <= x1 and d >= 0:
                        continue
                    # ton: bakis acisina gore yan yuz golgede, kameraya bakan yuz isikta
                    if v == '34':
                        edge, sidef = x0 + 6, xx < x0 + 6
                    elif v == '34back':
                        edge, sidef = x1 - 6, xx > x1 - 6
                    else:
                        edge, sidef = None, False
                    if side:
                        sidef = xx <= x1 - 7                  # yandan: kafanin arka/yan kismi
                    face_l = x0 if v != '34back' else x0
                    face_r = x1 - 6 if v == '34back' else x1
                    ridge = (x0 + 6 + x1) // 2 if v == '34' else (x0 + x1 - 6) // 2 if v == '34back' else cx
                    if d == BAND and not (back and d > BAND):
                        t = 0                                 # kenar / siperlik (arkada da devam eder)
                    elif xx == edge and d >= 1:
                        t = 0                                 # yan ve on/arka yuz kosesi
                    elif d > BAND:
                        t = 0 if sidef and back else 1        # alt kisim / ense korumasi
                    elif sidef:
                        t = 2 if d <= 1 else 1
                    else:
                        t = 3 if d <= 1 else 2
                        if xx == ridge and 2 <= d < BAND and (back or v == 'back'):
                            t = 3                             # ortadaki sirt
                    # G3 (1.0.22): arkadan bakista kask duz blok gibi durmasin: tepe sirti (golgeli),
                    # bantta percinler, ense korumasinin altinda ikinci koyu kenar ve dikis
                    if back or v == 'back':
                        if 0 <= d <= BAND + 2 and xx == ridge:
                            t = 3
                        elif 1 <= d <= BAND + 2 and xx == ridge + 1:
                            t = 1                             # sirtin golgesi
                        if d == BAND and (xx - face_l) % 4 == 2 and xx not in (ridge, ridge + 1):
                            t = 4                             # bant percinleri
                        if d == low - 1:
                            t = 0                             # ense korumasinin alt kenari
                        elif d > BAND + 2 and d < low - 1 and xx == ridge:
                            t = 0                             # ense dikisi
                    if v == '34' and xx == x0 + 3 and d == 10:
                        t = 4                                 # yandaki percin
                    if v == '34back' and xx == x1 - 3 and d == 10:
                        t = 4
                    put(1, xx, yy, t)
            # ---- goguslik: govde ve kollarin ustu; eller ve eldeki esya acik kalir
            for yy in range(tt, lt):
                if yy >= H:
                    break
                d = yy - tt
                # uzanan kollar (alkis, el sallama) zirhla boyanmasin: kafa genisligi kadar
                xs = [xx for xx in range(max(0, x0 - 1), min(W, x1 + 2)) if body(xx, yy)]
                if not xs:
                    continue
                for xx in range(min(xs) - 1, max(xs) + 2):
                    if xx in xs:
                        if yy in hand_rows and is_skin(P[xx, yy], sk):
                            continue                      # eller
                    elif d > 2:
                        continue                          # sadece omuzluk 1 piksel tasar
                    # bolgeler: sol kol | govde | sag kol (bakis acisina gore)
                    if v == '34':
                        sl, sr = x0 + 8, x1 - 4
                    elif v == '34back':
                        sl, sr = x0 + 5, x1 - 6
                    elif v in ('back', 'front'):
                        sl, sr = x0 + 5, x1 - 5
                    else:
                        sl, sr = None, None
                    arm = sl is not None and (xx < sl or xx > sr)
                    t = 2 if d == 0 else 1
                    if sl is not None and xx in (sl, sr) and d >= 1:
                        t = 0                                 # kol ile govde arasi
                    elif arm:
                        if d == 3:
                            t = 0                             # omuzluk alt kenari
                        elif d < 3:
                            t = 2 if d == 0 else 1
                        elif v == '34back' and xx > sr + 3:
                            t = 0                             # arkadan sag kolun golge tarafi
                        else:
                            t = 1
                    elif not side and 1 <= d <= 2:
                        t = 2                                 # gogus ustu isikta
                    if yy == lt - 1 and not arm:
                        t = 0                                 # kemer
                        if not back and xx in (cx, cx + 1) and not side:
                            t = 4                             # toka
                    if side and yy == lt - 1:
                        t = 0
                        if xx == max(xs) - 1:
                            t = 4
                    if not back and not side and not arm and xx == (sl + sr) // 2 and 1 <= d <= 4:
                        t = 3                                 # gogus ortasi parlak
                    if back and not arm and sl is not None and xx == (sl + sr) // 2 and d >= 2 and yy < lt - 1:
                        t = 0                                 # sirttaki ek yeri
                    put(2, xx, yy, t)
            # ---- bot: her sutunun en alt pikselinden 3 satir yukari (kalkan ayak da)
            if sit and feet is not None:
                for yy in range(feet, H):
                    for xx in range(cx + 2, W):
                        if body(xx, yy):
                            put(3, xx, yy, 2 if yy == feet else 0 if yy == B else 1)
                            if not opaque(xx + 1, yy):
                                put(3, xx + 1, yy, 1)
            for xx in ([] if sit and feet is not None else range(-1, W + 1)):
                ys = [yy for yy in range(lt, H) if body(xx, yy)]
                if not ys:
                    continue
                cb = max(ys)
                for yy in range(cb - 4, cb + 1):
                    if yy >= lt and body(xx, yy):
                        put(3, xx, yy, 2 if yy == cb - 4 else 1)
                        if yy >= cb - 1:                  # tabanda yanlara 1 piksel tasar
                            for a in (-1, 1):
                                if not opaque(xx + a, yy):
                                    put(3, xx + a, yy, 1)
            # ---- pelerin: sadece arkadan
            if back and x1 - x0 >= 18:
                for d in range(CAPE[0], CAPE[1] + 1):
                    yy = top + d
                    if yy > H:
                        break
                    grow = (d - CAPE[0]) // 5
                    for xx in range(cx - 6 - grow, cx + 8 + grow):
                        if any(body(xx + a, yy + b) for a in (-1, 0, 1) for b in (-1, 0, 1)) or any(body(xx + a, yy - 1) for a in (-1, 0, 1)):
                            t = 0 if (xx + 1) % 3 == 0 and d > CAPE[0] + 2 else 2 if d == CAPE[0] else 1
                            put(7 if d < TORSO[1] else 8, xx, yy, t)
        # ---- alet: sadece kendi animasyonunda, sadece malzemesi olan kisim
        if tool:
            for yy in range(H):
                for xx in range(W):
                    if not item[yy][xx] or is_outline(P[xx, yy]):
                        continue
                    h, s, val = hsv(P[xx, yy])
                    if tool == 4:
                        hit = s < 0.2 and val > 0.3          # kilic agzi (gri/beyaz)
                    elif tool == 5:
                        hit = s > 0.3 and 0.35 < h < 0.6     # kazma ucu (elmas)
                    else:
                        hit = s > 0.25                       # yay govdesi (ip haric)
                    if hit:
                        part[yy + pd][xx + pd] = tool

        # ---- eklenen aletler (animasyonda cizili degil)
        dtool = DRAWN.get(name.split('/')[0])
        if dtool and ok:
            shape = {}

            def dput(xx, yy, t):
                if 0 <= yy < H and 0 <= xx < W and is_skin(P[xx, yy], sk):
                    return                                # el aletin onunde
                if dtool == 10 and opaque(xx, yy):
                    return                                # yay govdenin arkasinda
                shape[(xx, yy)] = t
            if dtool == 9 and v != 'side':
                # doner kesik: kilic el hizasinda yatay; onden sola, arkadan saga uzanir
                hy = tt + 5
                rs = [xx for xx in range(W) if body(xx, hy)]
                if rs:
                    right = back
                    edge = max(rs) if right else min(rs)
                    s_ = 1 if right else -1
                    for i in range(-1, 2):
                        dput(edge + s_ * i, hy, 0)        # kabza
                    for yy in range(hy - 2, hy + 3):
                        dput(edge + s_ * 2, yy, 0)        # siper
                    for i in range(3, 13):
                        dput(edge + s_ * i, hy, 2)        # agiz
                        if i < 12:
                            dput(edge + s_ * i, hy + 1, 1)
                    dput(edge + s_ * 13, hy, 3)           # uc
            elif dtool == 10:
                # arkadan ok atis: yay sag yanda, govdenin arkasindan gorunur
                arc = [0, 1, 1, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 2, 2, 2, 1, 1, 0]
                y0 = top + 9
                for i, o in enumerate(arc):
                    dput(x1 + 1 + o, y0 + i, 2 if i < 9 else 1)
                    if o >= 2:
                        dput(x1 + o, y0 + i, 1)           # yay kalinligi
                    dput(x1 + 1, y0 + i, 3) if (x1 + 1, y0 + i) not in shape else None   # kiris
            elif dtool == 11:
                # asa sag elde dik durur, ustunde parlayan tas (buyu yaparken biraz kalkar)
                lift = {0: 0, 1: 2, 2: 3}.get(int(name.split('/')[1]), 0)
                sx = x1 + 1
                for yy in range(top + 8 - lift, top + 32 - lift):
                    dput(sx, yy, 0)
                    dput(sx + 1, yy, 1)
                gy0 = top + 4 - lift
                for yy in range(gy0, gy0 + 4):
                    for xx in range(sx - 1, sx + 3):
                        if (yy in (gy0, gy0 + 3)) and xx in (sx - 1, sx + 2):
                            continue
                        dput(xx, yy, 3 if (xx, yy) in ((sx, gy0 + 1),) else 2)
            for (xx, yy), t in shape.items():
                gx, gy = xx + pd, yy + pd
                if 0 <= gx < GW and 0 <= gy < GH:
                    cpart[gy][gx] = dtool             # ust katman: alet yoksa zirh bozulmaz
                    ctone[gy][gx] = t
            for (xx, yy) in list(shape):
                for a_, b_ in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = xx + a_, yy + b_
                    if (nx, ny) in shape or opaque(nx, ny):
                        continue
                    gx, gy = nx + pd, ny + pd
                    if 0 <= gx < GW and 0 <= gy < GH and cpart[gy][gx] < 9:
                        cpart[gy][gx] = dtool
                        ctone[gy][gx] = -1                # aletin dis cizgisi

        def shade(M, OUT, T):
            for gy in range(GH):
                for gx in range(GW):
                    ox = lx + (GW - 1 - gx if mirror else gx)
                    k = M[gy][gx]
                    if not k:
                        continue
                    if k >= 9:
                        t = T[gy][gx]
                        OUT[ox, ly + gy] = (k * KR, 0, 255, 255) if t < 0 else (k * KR, t * TONE, 0, 255)
                        continue
                    if 4 <= k <= 6:
                        L = lum(P[gx - pd, gy - pd])
                        t = 0 if L < 70 else 1 if L < 140 else 2 if L < 210 else 3
                        OUT[ox, ly + gy] = (k * KR, t * TONE, 0, 255)
                        continue
                    same = lambda a, b: 0 <= a < GW and 0 <= b < GH and (M[b][a] == k or (k in (7, 8) and M[b][a] in (7, 8)))
                    if not all(same(gx + a, gy + b) for a, b in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        OUT[ox, ly + gy] = (k * KR, 0, 255, 255)
                        continue
                    t = T[gy][gx]
                    if t in (1, 2) and (not same(gx, gy + 1) or not same(gx + 1, gy)):
                        t -= 1                                  # alt / sag kenar golgede
                    OUT[ox, ly + gy] = (k * KR, t * TONE, 0, 255)
                    stats[k] = stats.get(k, 0) + 1
        shade(part, O, tone)
        shade(cpart, CO, ctone)
    log = []
    repair(out, meta, atlas, frames, pal, log)
    stats['onarim'] = len(log)
    if os.environ.get('GEAR_LOG'):
        print('\n'.join(log))
    out.save(os.path.join(char_dir, 'gear.png'), optimize=True)
    cout.save(os.path.join(char_dir, 'cape.png'), optimize=True)
    json.dump({'frames': meta, 'meta': {'size': {'w': AW, 'h': AH}, 'pad': PAD}}, open(os.path.join(char_dir, 'gear.json'), 'w'))
    return stats


if __name__ == '__main__':
    for ch in sorted(os.listdir(ROOT)):
        d = os.path.join(ROOT, ch)
        if os.path.isfile(os.path.join(d, 'atlas.png')):
            print(ch, process(d))
