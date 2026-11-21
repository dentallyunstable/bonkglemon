### 6.4 Komut şablonu
Her üretimde önce sabit stil bloğu, sonra aşama cümlesi, sonra o Glemonun tarifindeki İngilizce cümle yapıştırılır.
Stil bloğu (her zaman aynı, değiştirme):
```
Pixel art game sprite of ONE cute chibi creature on a 64x64 pixel grid.
Crisp square pixels, no anti-aliasing, no blur, no gradients, no dithering.
Front three-quarter view: facing the viewer, turned slightly to the left,
both eyes visible. Round chubby body, oversized head, short stubby limbs, no neck.
Big glossy oval eyes: solid dark navy-black with one white highlight in the
upper-left corner. Tiny simple mouth. Soft pink blush under each eye.
Soft muted pastel colors, 3 to 4 flat tones per color, light from the upper-left.
Thin 1-pixel dark colored outline, never pure black.
Calm relaxed standing pose, whole body visible, centered.
Plain solid magenta (#FF00FF) background. No ground, no shadow, no text,
no border, no sparkles, no glow, no particles, no other objects.
```

Aşama cümlesi (birini seç):
```
BABY form: almost all head, tiny body, very simple, curious and clumsy.
TEEN form: same creature, evolved. Slightly taller, small limbs appear, playful.
ADULT form: same creature, fully evolved. Bigger and confident but still soft and cute, never scary.
```

Aracın "istemediğim şeyler" (negative prompt) kutusu varsa:
```
side view, profile, realistic, 3D, smooth shading, anti-aliasing, blur, gradient,
text, watermark, multiple creatures, scenery, scary, sharp teeth, angry, tiny eyes
```

İsteğe bağlı sayfalar için, aynı komuta şu cümle eklenir (ve o Glemonun kendi görseli örnek olarak verilir):
```
Kanat aşağı:  Same creature, same size and pose, but wings fully down.
Kabuk:        Same creature, same size, hiding inside its shell, only eyes peeking out.
```

Patronlarda stil bloğunun ilk satırı şöyle değişir: Pixel art game sprite of ONE big cute boss creature on a 128x128 pixel grid.
