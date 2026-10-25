"""Builds the app icon: the hand-drawn question mark (the vector's ink, in white) on a
deep purple field, filling most of the canvas so it reads at home-screen size and holds
up on the dark and tinted home screens.

Usage (from the repo root; needs Pillow):
    python3 tools/graphics/make_icon.py

Writes:
    assets/images/icon.png                    1024x1024, opaque (Expo / iOS icon)
    ios/WhatIf/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
    assets/images/adaptive-icon.png           Android adaptive-icon foreground (transparent;
                                              the background color is in app.json)
Prints the background color, for app.json's android.adaptiveIcon.backgroundColor.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
INK = ROOT / 'assets/graphics/question-mark-ink.png'   # made by render_question_mark.js
SIZE = 1024
MARK = (0xFF, 0xFF, 0xFF)      # white ink
FILL = (0x49, 0x29, 0x7E)      # deep purple (surface.accent, light)
# How much of the canvas the mark's height takes. iOS icons read best when the
# artwork fills about 80% of the tile; the rounded mask trims the corners, not this.
MARK_HEIGHT = 0.80
# The drawing's weight (stem and dot) sits right of its bounding box's center, because
# the hook's tail reaches far left; centering the box makes it look off center. Shift it
# left by this share of its width (same value as OPTICAL_SHIFT in src/ui/QuestionMark.tsx).
OPTICAL_SHIFT = 0.10

# The ink raster is black on transparent; recolor it by keeping only its alpha.
alpha = Image.open(INK).convert('RGBA').getchannel('A')
alpha = alpha.crop(alpha.getbbox())


def place(canvas, height):
    a = alpha.resize((round(alpha.width * height / alpha.height), height), Image.LANCZOS)
    d = Image.new('RGBA', a.size, MARK + (0,))
    d.putalpha(a)
    x = (SIZE - d.width) // 2 - round(d.width * OPTICAL_SHIFT)
    canvas.alpha_composite(d, (x, (SIZE - d.height) // 2))
    return canvas


icon = place(Image.new('RGBA', (SIZE, SIZE), FILL + (255,)), round(SIZE * MARK_HEIGHT)).convert('RGB')
icon.save(ROOT / 'assets/images/icon.png', optimize=True)
icon.save(ROOT / 'ios/WhatIf/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
          optimize=True)

# Android masks the adaptive icon to various shapes; keep the drawing in the central
# safe zone (about 66% of the canvas). The purple field comes from app.json.
fg = place(Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0)), round(SIZE * 0.56))
fg.save(ROOT / 'assets/images/adaptive-icon.png', optimize=True)
print('icon', icon.size, '| background color #%02x%02x%02x' % FILL)
