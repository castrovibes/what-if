"""Builds the app icon: the hand-drawn question mark on its own fill color, edge to edge.

Usage (from the repo root; needs Pillow and NumPy):
    python tools/graphics/make_icon.py

Writes:
    assets/images/icon.png                    1024x1024, opaque (Expo / iOS icon)
    ios/WhatCouldYouDo/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
    assets/images/adaptive-icon.png           Android adaptive-icon foreground (transparent;
                                              the background color is in app.json)
Prints the fill color, for app.json's android.adaptiveIcon.backgroundColor.
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
DRAWING = ROOT / 'assets/graphics/question-drawing.png'   # made by make_question.py
SIZE = 1024

drawing = Image.open(DRAWING).convert('RGBA')
drawing = drawing.crop(drawing.getchannel('A').getbbox())

# The question mark's own fill color, sampled from the solid face of its top curve
# (the sides are hatched, so an average over the whole drawing comes out paler).
a = np.asarray(drawing).astype(np.float32)
h, w = a.shape[:2]
face = a[int(h * 0.19):int(h * 0.25), int(w * 0.20):int(w * 0.30)]
face = face[face[..., 3] > 250][:, :3]
face = face[face.mean(1) > np.percentile(face.mean(1), 30)]   # skip any stray ink
fill = tuple(int(v) for v in np.median(face, axis=0))


def place(canvas, height):
    d = drawing.resize((round(drawing.width * height / drawing.height), height), Image.LANCZOS)
    canvas.alpha_composite(d, ((SIZE - d.width) // 2, (SIZE - d.height) // 2))
    return canvas


icon = place(Image.new('RGBA', (SIZE, SIZE), fill + (255,)), round(SIZE * 0.76)).convert('RGB')
icon.save(ROOT / 'assets/images/icon.png', optimize=True)
icon.save(ROOT / 'ios/WhatCouldYouDo/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
          optimize=True)

# Android masks the adaptive icon to various shapes; keep the drawing in the central
# safe zone (about 66% of the canvas).
fg = place(Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)), round(SIZE * 0.56))
fg.save(ROOT / 'assets/images/adaptive-icon.png', optimize=True)
print('icon', icon.size, '| fill color #%02x%02x%02x' % fill)
