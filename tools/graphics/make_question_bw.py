"""Step 1 of 2 for the black-and-white vector question mark: splits question-drawing.png
(made by make_question.py) into two 1-bit masks for potrace — the ink (outline and
hatching, found by an Otsu threshold on luminance) and the whole silhouette (used as a
white fill under the ink so the SVG reads on any background).

Usage (needs Pillow and NumPy):
    python tools/graphics/make_question_bw.py assets/graphics/question-drawing.png /tmp/mask
Writes /tmp/mask-ink.png and /tmp/mask-sil.png (black = shape, white = empty) plus
/tmp/mask-ink-small.png, the ink at one-third scale for the lighter path the app draws
(src/ui/questionMarkPath.ts). Then run tools/graphics/trace_question_bw.js on them.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

SRC, OUT = sys.argv[1], sys.argv[2]
img = Image.open(SRC).convert('RGBA')
a = np.asarray(img).astype(np.float32)
inside = a[..., 3] > 127
lum = a[..., :3].mean(-1)

# Otsu's threshold separates the dark ink from the green fill.
hist, _ = np.histogram(lum[inside], bins=256, range=(0, 255))
p = hist / hist.sum()
w0 = np.cumsum(p)
m = np.cumsum(p * np.arange(256))
sigma = (m[-1] * w0 - m) ** 2 / np.maximum(w0 * (1 - w0), 1e-9)
t = int(np.argmax(sigma))

def mask_png(mask, path):
    m = Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5))
    Image.fromarray(255 - np.asarray(m)).convert('L').save(path)

mask_png(inside & (lum < t), OUT + '-ink.png')
mask_png(inside, OUT + '-sil.png')
small = Image.open(OUT + '-ink.png').convert('L')
small = small.resize((small.width // 3, small.height // 3), Image.LANCZOS)
small.point(lambda v: 255 if v > 128 else 0).save(OUT + '-ink-small.png')
print('threshold', t, '-> wrote', OUT + '-ink.png', OUT + '-sil.png', OUT + '-ink-small.png')
