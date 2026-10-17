"""Builds the launch (splash) images: "What If?" in Rock Salt above the hand-drawn
question mark, in light and dark versions, for the iOS splash and the in-app loading
screen (src/screens/LoadingScreen.tsx), which shows the same image so the hand-off from
the splash is seamless.

Usage (from the repo root; needs Pillow):
    python tools/graphics/make_splash.py

Writes:
    assets/graphics/splash-light.png, splash-dark.png          (3x, for the app)
    ios/WhatCouldYouDo/Images.xcassets/SplashScreen.imageset/  (1x/2x/3x, light + dark)
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
DRAWING = ROOT / 'assets/graphics/question-drawing.png'  # made by make_question.py
FONT = ROOT / 'assets/fonts/RockSalt-Regular.ttf'
OUT_APP = ROOT / 'assets/graphics'
OUT_IOS = ROOT / 'ios/WhatCouldYouDo/Images.xcassets/SplashScreen.imageset'

WIDTH_PT = 280          # the splash image's width on screen, in points
SCALE = 3
TITLE = 'What If?'
COLORS = {'light': (0x49, 0x29, 0x7E), 'dark': (0xA7, 0x8B, 0xDB)}  # surface.accent
GAP_PT = 14             # between the lettering and the top of the drawing
DRAWING_HEIGHT_PT = 190 # the question mark's height on screen


def build(color):
    w = WIDTH_PT * SCALE
    note = Image.open(DRAWING).convert('RGBA')
    note = note.crop(note.getchannel('A').getbbox())
    nh = DRAWING_HEIGHT_PT * SCALE
    note = note.resize((round(note.width * nh / note.height), nh), Image.LANCZOS)
    target = w * 0.74
    size = 40
    while True:
        font = ImageFont.truetype(str(FONT), size)
        l, t, r, b = font.getbbox(TITLE)
        if r - l >= target:
            break
        size += 2
    l, t, r, b = font.getbbox(TITLE)
    text_h = b - t
    gap = GAP_PT * SCALE
    canvas = Image.new('RGBA', (w, text_h + gap + note.height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)
    draw.text(((w - (r - l)) / 2 - l, -t), TITLE, font=font, fill=color + (255,))
    canvas.alpha_composite(note, ((w - note.width) // 2, text_h + gap))
    return canvas


OUT_IOS.mkdir(parents=True, exist_ok=True)
images = []
for mode, color in COLORS.items():
    img = build(color)
    img.save(OUT_APP / f'splash-{mode}.png', optimize=True)
    for s in (1, 2, 3):
        name = f'splash-{mode}@{s}x.png'
        img.resize((img.width * s // SCALE, img.height * s // SCALE), Image.LANCZOS).save(
            OUT_IOS / name, optimize=True)
        entry = {'filename': name, 'idiom': 'universal', 'scale': f'{s}x'}
        if mode == 'dark':
            entry['appearances'] = [{'appearance': 'luminosity', 'value': 'dark'}]
        images.append(entry)
    print(mode, 'splash', img.size, '->', f'{img.width // SCALE}x{img.height // SCALE} pt')

import json
(OUT_IOS / 'Contents.json').write_text(json.dumps(
    {'images': images, 'info': {'author': 'xcode', 'version': 1}}, indent=2) + '\n')
