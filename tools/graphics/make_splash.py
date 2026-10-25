"""Builds the launch (splash) images: "What If?" in Geomini ExtraBold, curved in a gentle
arch over the hand-drawn question mark (the vector's ink, tinted the same accent color as
the lettering), in light and dark versions, for the iOS splash and the in-app loading
screen (src/screens/LoadingScreen.tsx), which shows the same image so the hand-off from the
splash is seamless.

Usage (from the repo root; needs Pillow):
    python tools/graphics/make_splash.py
    python tools/graphics/make_splash.py --preview out.png 0.8 1.1 1.5
        (side-by-side light versions at those arc radii, to compare; writes nothing else)

Writes:
    assets/graphics/splash-light.png, splash-dark.png          (3x, for the app)
    ios/WhatIf/Images.xcassets/SplashScreenLogo.imageset/     (1x/2x/3x, light + dark)
    ios/WhatIf/SplashScreen.storyboard                         (the image's size, updated)
"""
import json
import math
import re
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
INK = ROOT / 'assets/graphics/question-mark-ink.png'  # made by render_question_mark.js
FONT = ROOT / 'assets/fonts/Geomini-ExtraBold.ttf'
OUT_APP = ROOT / 'assets/graphics'
OUT_IOS = ROOT / 'ios/WhatIf/Images.xcassets/SplashScreenLogo.imageset'
STORYBOARD = ROOT / 'ios/WhatIf/SplashScreen.storyboard'

WIDTH_PT = 280          # the splash image's width on screen, in points
SCALE = 3
TITLE = 'What If?'
COLORS = {'light': (0x49, 0x29, 0x7E), 'dark': (0xA7, 0x8B, 0xDB)}  # surface.accent
GAP_PT = 14             # between the lettering's lowest point and the top of the drawing
DRAWING_HEIGHT_PT = 190 # the question mark's height on screen
TEXT_WIDTH = 0.74       # the lettering's length along the arc, as a share of the width
ARC_RADIUS = 1.1        # the arc's radius as a multiple of that length; larger = flatter
# The drawing's weight (stem and dot) sits right of its bounding box's center, because
# the hook's tail reaches far left; centering the box makes it look off center. Shift it
# left by this share of its width (same value as OPTICAL_SHIFT in src/ui/QuestionMark.tsx).
OPTICAL_SHIFT = 0.10


def question_mark(color):
    # The ink raster is black on transparent; recolor it by keeping only its alpha.
    alpha = Image.open(INK).convert('RGBA').getchannel('A')
    alpha = alpha.crop(alpha.getbbox())
    nh = DRAWING_HEIGHT_PT * SCALE
    alpha = alpha.resize((round(alpha.width * nh / alpha.height), nh), Image.LANCZOS)
    mark = Image.new('RGBA', alpha.size, color + (0,))
    mark.putalpha(alpha)
    return mark


def lettering(color, radius_factor):
    """TITLE set along an arc that bows upward, each letter turned to follow it."""
    target = WIDTH_PT * SCALE * TEXT_WIDTH
    size = 40
    while ImageFont.truetype(str(FONT), size).getlength(TITLE) < target:
        size += 2
    font = ImageFont.truetype(str(FONT), size)
    length = font.getlength(TITLE)
    radius = radius_factor * length

    tile = size * 2  # each letter is drawn on its own square, centered on its anchor
    layer = Image.new('RGBA', (round(length * 1.4), round(radius + size * 3)), (0, 0, 0, 0))
    cx, cy = layer.width / 2, radius + size * 1.5  # the arc's center, below the letters
    for i, ch in enumerate(TITLE):
        if ch == ' ':
            continue
        start = font.getlength(TITLE[:i])
        advance = font.getlength(TITLE[:i + 1]) - start
        # Angle of the letter's center along the arc, from straight up.
        theta = (start + advance / 2 - length / 2) / radius
        glyph = Image.new('RGBA', (tile, tile), (0, 0, 0, 0))
        ImageDraw.Draw(glyph).text((tile / 2 - advance / 2, tile / 2), ch, font=font,
                                   fill=color + (255,), anchor='ls')
        glyph = glyph.rotate(-math.degrees(theta), resample=Image.BICUBIC,
                             center=(tile / 2, tile / 2))
        x = cx + radius * math.sin(theta)
        y = cy - radius * math.cos(theta)
        layer.alpha_composite(glyph, (round(x - tile / 2), round(y - tile / 2)))
    return layer.crop(layer.getchannel('A').getbbox())


def build(color, radius_factor=ARC_RADIUS):
    w = WIDTH_PT * SCALE
    mark = question_mark(color)
    text = lettering(color, radius_factor)
    gap = GAP_PT * SCALE
    canvas = Image.new('RGBA', (w, text.height + gap + mark.height), (0, 0, 0, 0))
    canvas.alpha_composite(text, ((w - text.width) // 2, 0))
    canvas.alpha_composite(mark, ((w - mark.width) // 2 - round(mark.width * OPTICAL_SHIFT),
                                  text.height + gap))
    return canvas


def preview(out, factors):
    tiles = [build(COLORS['light'], f) for f in factors]
    sheet = Image.new('RGB', (sum(t.width for t in tiles), max(t.height for t in tiles)),
                      (0xF9, 0xFA, 0xFB))
    x = 0
    for t in tiles:
        sheet.paste(t, (x, 0), t)
        x += t.width
    sheet.save(out)
    print('preview', out, 'radii', factors)


def main():
    OUT_IOS.mkdir(parents=True, exist_ok=True)
    # Prebuild fills the image set with its own copies (image.png…); replace them.
    for old in OUT_IOS.glob('*.png'):
        old.unlink()
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
        print(mode, 'splash', img.size, '->', f'{img.width // SCALE}x{img.height / SCALE:.2f} pt')
    (OUT_IOS / 'Contents.json').write_text(json.dumps(
        {'images': images, 'info': {'author': 'xcode', 'version': 1}}, indent=2) + '\n')

    # The storyboard records the image's size (the image view centers itself at runtime,
    # but keep the recorded size true so Xcode's canvas and any later prebuild agree).
    h = img.height / SCALE
    sb = STORYBOARD.read_text()
    sb = re.sub(r'(<rect key="frame" x="[\d.]+" y=")[\d.]+(" width="280" height=")[\d.]+(")',
                lambda m: f'{m[1]}{(852 - h) / 2:.2f}{m[2]}{h}{m[3]}', sb, count=1)
    sb = re.sub(r'(<image name="SplashScreenLogo" width="280" height=")[\d.]+(")',
                lambda m: f'{m[1]}{h}{m[2]}', sb)
    STORYBOARD.write_text(sb)
    print('storyboard image size 280 x', h)


if __name__ == '__main__':
    if len(sys.argv) > 2 and sys.argv[1] == '--preview':
        preview(sys.argv[2], [float(f) for f in sys.argv[3:]] or [0.8, 1.1, 1.5])
    else:
        main()
