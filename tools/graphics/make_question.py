"""Cuts the hand-drawn question mark out of the photo (no sticky note): the ink lines,
hatching and green fill, on a transparent background.

Usage (needs Pillow and NumPy):
    python tools/graphics/make_question.py <photo.jpg> assets/graphics/question-drawing.png

How: even out the photo's lighting, find the ink, then flood-fill the paper in from the
photo's edges (with the ink slightly thickened so the flood can't leak through small
gaps in the outline). Whatever the flood doesn't reach is the drawing.
"""
import sys
from collections import deque
import numpy as np
from PIL import Image, ImageFilter, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
SCALE = 0.5            # work at half resolution for the flood fill
PAD = 40               # transparent margin around the drawing (px, output)

photo = ImageOps.exif_transpose(Image.open(SRC)).convert('RGB')
W, H = photo.size
a = np.asarray(photo).astype(np.float32)

# --- even out the lighting (same approach as make_postit.py) ---------------------
bx0, by0, bx1, by1 = 420, 330, 2450, 3450
yy, xx = np.mgrid[0:H:16, 0:W:16]
samp = a[::16, ::16]
outside = ~((xx > bx0) & (xx < bx1) & (yy > by0) & (yy < by1))
X = np.stack([np.ones_like(xx), xx / 1000, yy / 1000, xx * xx / 1e6, yy * yy / 1e6,
              xx * yy / 1e6], -1)[outside].astype(np.float64)
fy, fx = np.mgrid[0:H, 0:W].astype(np.float32)
model = np.zeros((H, W, 3), np.float32)
for c in range(3):
    k, *_ = np.linalg.lstsq(X, samp[..., c][outside].astype(np.float64), rcond=None)
    model[..., c] = (k[0] + k[1] * fx / 1000 + k[2] * fy / 1000 + k[3] * fx * fx / 1e6
                     + k[4] * fy * fy / 1e6 + k[5] * fx * fy / 1e6)
paper = np.median(samp[outside], axis=0)
flat = np.clip(a / np.maximum(model, 1) * paper, 0, 255)

# --- ink mask, thickened, at working resolution -----------------------------------
small = Image.fromarray(flat.astype(np.uint8)).resize((int(W * SCALE), int(H * SCALE)), Image.LANCZOS)
s = np.asarray(small).astype(np.float32)
lum = s.mean(-1)
paper_lum = float(np.median(lum))
ink = lum < paper_lum * 0.62
ink_img = Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
wall = np.asarray(ink_img) > 0

# --- flood the paper in from the edges --------------------------------------------
h, w = wall.shape
reached = np.zeros_like(wall)
q = deque()
for x in range(w):
    for y in (0, h - 1):
        if not wall[y, x]:
            reached[y, x] = True; q.append((y, x))
for y in range(h):
    for x in (0, w - 1):
        if not wall[y, x] and not reached[y, x]:
            reached[y, x] = True; q.append((y, x))
while q:
    y, x = q.popleft()
    for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
        if 0 <= ny < h and 0 <= nx < w and not reached[ny, nx] and not wall[ny, nx]:
            reached[ny, nx] = True; q.append((ny, nx))

# The drawing = not paper. Undo the thickening on the outside edge (the paper side) so
# the cut follows the real ink line, then smooth the edge.
shape = Image.fromarray(((~reached) * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(9))
shape = shape.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.5))
alpha = np.asarray(shape).astype(np.float32) / 255
alpha = np.clip((alpha - 0.35) / 0.3, 0, 1)

rgba = np.dstack([flat, alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, 'RGBA')
bbox = img.getchannel('A').getbbox()
img = img.crop(bbox)
out = Image.new('RGBA', (img.width + 2 * PAD, img.height + 2 * PAD), (0, 0, 0, 0))
out.alpha_composite(img, (PAD, PAD))
out.save(OUT, optimize=True)
print('wrote', OUT, out.size)
