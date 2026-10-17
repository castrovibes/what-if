"""Builds the app icon: the sticky-note question mark on the brand's deep purple.

Usage (from the repo root; needs Pillow and NumPy):
    python tools/graphics/make_icon.py

Writes:
    assets/images/icon.png                    1024x1024, opaque (Expo / iOS icon)
    ios/WhatCouldYouDo/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
    assets/images/adaptive-icon.png           Android adaptive-icon foreground (transparent;
                                              the background color is in app.json)
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
NOTE = ROOT / 'assets/graphics/question-postit.png'   # made by make_postit.py
PURPLE = np.array([0x49, 0x29, 0x7E], np.float32)
SIZE = 1024
NOTE_ROUND = 2000 / 2440       # the note's share of its image (the rest is shadow margin)
TILT = -3                      # degrees, a slightly casual stick


def note_at(note_width):
    note = Image.open(NOTE).convert('RGBA')
    full = round(note_width / NOTE_ROUND)
    note = note.resize((full, full), Image.LANCZOS)
    return note.rotate(TILT, resample=Image.BICUBIC, expand=True)


def purple_backdrop():
    # Deep purple, a touch lighter behind the note so it doesn't look flat.
    yy, xx = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32)
    d = np.hypot(xx - SIZE * 0.5, yy - SIZE * 0.45) / (SIZE * 0.72)
    glow = np.clip(1.18 - 0.30 * d, 0.88, 1.18)[..., None]
    return Image.fromarray(np.clip(PURPLE * glow, 0, 255).astype(np.uint8)).convert('RGBA')


def place(canvas, note):
    canvas.alpha_composite(note, ((SIZE - note.width) // 2, (SIZE - note.height) // 2))
    return canvas


icon = place(purple_backdrop(), note_at(SIZE * 0.70)).convert('RGB')
icon.save(ROOT / 'assets/images/icon.png', optimize=True)
icon.save(ROOT / 'ios/WhatCouldYouDo/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
          optimize=True)

# Android masks the adaptive icon to various shapes; keep the note inside the central
# safe zone (about 66% of the canvas).
fg = place(Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)), note_at(SIZE * 0.52))
fg.save(ROOT / 'assets/images/adaptive-icon.png', optimize=True)
print('icon', icon.size, icon.mode, '| adaptive foreground', fg.size)
