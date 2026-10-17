"""Turns the hand-drawn question-mark photo into a sticky-note graphic (transparent PNG):
a square note with the drawing centered and the bottom-right corner curling up."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

SRC, OUT = sys.argv[1], sys.argv[2]
N = 2000            # note size (px)
PAD = 220           # transparent margin around the note for its shadow
SS = 2              # supersampling for smooth curves
CURL = int(N * 0.17)

photo = ImageOps.exif_transpose(Image.open(SRC)).convert('RGB')
W, H = photo.size
a = np.asarray(photo).astype(np.float32)

# --- 1. Even out the photo's lighting -----------------------------------------
# Fit a smooth (quadratic) lighting model to the paper around the drawing, then
# divide it out, so the paper becomes one flat note color and ink/fill keep their
# contrast.
bx0, by0, bx1, by1 = 420, 330, 2450, 3450   # the question mark, with a margin
yy, xx = np.mgrid[0:H:16, 0:W:16]
samp = a[::16, ::16]
outside = ~((xx > bx0) & (xx < bx1) & (yy > by0) & (yy < by1))
X = np.stack([np.ones_like(xx), xx, yy, xx * xx, yy * yy, xx * yy], -1)[outside].astype(np.float64)
X[:, 1:3] /= 1000.0
X[:, 3:] /= 1e6
model = np.zeros((H, W, 3), np.float32)
fy, fx = np.mgrid[0:H, 0:W].astype(np.float32)
for c in range(3):
    coef, *_ = np.linalg.lstsq(X, samp[..., c][outside].astype(np.float64), rcond=None)
    model[..., c] = (coef[0] + coef[1] * fx / 1000 + coef[2] * fy / 1000
                     + coef[3] * fx * fx / 1e6 + coef[4] * fy * fy / 1e6
                     + coef[5] * fx * fy / 1e6)
paper = np.median(samp[outside], axis=0)            # typical paper color
flat = np.clip(a / np.maximum(model, 1) * paper, 0, 255)
# Smooth the bare paper to the flat note color (keeping ink and the green fill), so the
# photo's paper grain doesn't show as a patch around the drawing.
dist = np.linalg.norm(flat - paper, axis=-1)
keep = np.clip((dist - 14) / 22, 0, 1)[..., None]   # 0 = bare paper, 1 = drawing
flat = flat * keep + paper * (1 - keep)

# --- 2. The drawing, cropped and scaled onto a note-sized canvas -----------------
crop = Image.fromarray(flat.astype(np.uint8)).crop((bx0, by0, bx1, by1))
scale = (N * 0.80) / crop.height
crop = crop.resize((int(crop.width * scale), int(crop.height * scale)), Image.LANCZOS)
note = Image.new('RGB', (N, N), tuple(int(v) for v in paper))
# feather the crop's edges into the flat note color
mask = Image.new('L', crop.size, 0)
ImageDraw.Draw(mask).rectangle((40, 40, crop.width - 40, crop.height - 40), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(30))
note.paste(crop, ((N - crop.width) // 2, (N - crop.height) // 2 + int(N * 0.01)), mask)

# a hint of paper: one even fine grain over the whole note, and gentle vertical
# shading, slightly darker toward the bottom
rng = np.random.default_rng(7)
grain = Image.fromarray((rng.normal(128, 10, (N, N))).clip(0, 255).astype(np.uint8))
grain = (np.asarray(grain.filter(ImageFilter.GaussianBlur(1.2)), np.float32) - 128) / 128 * 4
shade = np.linspace(1.03, 0.95, N, dtype=np.float32)[:, None, None]
note = Image.fromarray(np.clip(np.asarray(note).astype(np.float32) * shade + grain[..., None],
                               0, 255).astype(np.uint8))

# --- 3. Shapes for the curled corner (drawn supersampled) ------------------------
S = N * SS
C = CURL * SS


def bez(p0, p1, p2, n=60):
    t = np.linspace(0, 1, n)[:, None]
    return ((1 - t) ** 2) * p0 + 2 * (1 - t) * t * p1 + (t ** 2) * p2


A = np.array([S, S - C], float)          # fold starts on the right edge
B = np.array([S - C, S], float)          # ...and ends on the bottom edge
bow = np.array([S - C * 0.42, S - C * 0.42])     # fold line bows inward a little
fold = bez(A, bow, B)
tip = np.array([S - C * 1.05, S - C * 1.05])      # where the lifted corner points

body = [(0, 0), (S, 0)] + [tuple(p) for p in fold] + [(0, S)]
flap_edge1 = bez(A, np.array([S - C * 0.35, S - C * 0.95]), tip)
flap_edge2 = bez(tip, np.array([S - C * 0.95, S - C * 0.35]), B)
flap = [tuple(p) for p in fold] + [tuple(p) for p in flap_edge2[::-1]] + [tuple(p) for p in flap_edge1[::-1]]


def shape_mask(points, blur=0):
    m = Image.new('L', (S, S), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    m = m.resize((N, N), Image.LANCZOS)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


body_m = shape_mask(body)
flap_m = shape_mask(flap)

# --- 4. Compose: shadow, note body, shadow under the flap, the flap ---------------
canvas = Image.new('RGBA', (N + 2 * PAD, N + 2 * PAD), (0, 0, 0, 0))

# soft drop shadow under the whole note, deeper toward the lifted corner
shadow = Image.new('L', canvas.size, 0)
shadow.paste(body_m, (PAD + 10, PAD + 22))
shadow = shadow.filter(ImageFilter.GaussianBlur(28))
corner_lift = Image.new('L', canvas.size, 0)
ImageDraw.Draw(corner_lift).ellipse(
    (PAD + N - CURL * 1.7, PAD + N - CURL * 1.7, PAD + N + CURL * 0.3, PAD + N + CURL * 0.3), fill=255)
corner_lift = corner_lift.filter(ImageFilter.GaussianBlur(60))
shadow = Image.fromarray(np.clip(
    np.asarray(shadow, np.float32) * 0.30 + np.asarray(corner_lift, np.float32) * 0.18
    * (np.asarray(shadow, np.float32) > 2), 0, 255).astype(np.uint8))
canvas.paste((40, 40, 20, 255), (0, 0), shadow)

body_rgba = note.convert('RGBA')
body_rgba.putalpha(body_m)
canvas.alpha_composite(body_rgba, (PAD, PAD))

# shadow the flap casts on the note just inside the fold
flap_shadow = shape_mask(flap, blur=0)
fs = Image.new('L', (N, N), 0)
fs.paste(flap_shadow, (-int(CURL * 0.06), -int(CURL * 0.06)))
fs = fs.filter(ImageFilter.GaussianBlur(30))
fs = Image.fromarray((np.asarray(fs, np.float32) * 0.22
                      * (np.asarray(body_m, np.float32) / 255)).astype(np.uint8))
dark = Image.new('RGBA', (N, N), (60, 70, 10, 255))
dark.putalpha(fs)
canvas.alpha_composite(dark, (PAD, PAD))

# the flap: the back of the paper, lit along the fold and shading toward its tip
yy, xx = np.mgrid[0:N, 0:N].astype(np.float32)
d = ((N - xx) + (N - yy)) / (2 * CURL)               # 0 at the corner, ~1 at the tip
light = np.clip(1.06 - 0.20 * d, 0.80, 1.08)[..., None]
back = np.clip(np.asarray(note.convert('RGB'), np.float32).mean((0, 1)) * 0 + paper * 0.97 * light
               + np.array([8, 8, 0], np.float32), 0, 255).astype(np.uint8)
flap_rgba = Image.fromarray(back).convert('RGBA')
flap_rgba.putalpha(flap_m)
canvas.alpha_composite(flap_rgba, (PAD, PAD))

# a thin crease line along the fold
crease = Image.new('RGBA', (S, S), (0, 0, 0, 0))
ImageDraw.Draw(crease).line([tuple(p) for p in fold], fill=(70, 80, 20, 90), width=3 * SS)
crease = crease.resize((N, N), Image.LANCZOS)
canvas.alpha_composite(crease, (PAD, PAD))

canvas.save(OUT)
print('wrote', OUT, canvas.size, 'paper', [int(v) for v in paper])
