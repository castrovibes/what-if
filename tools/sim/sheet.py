#!/usr/bin/env python3
"""Stitch screenshots side by side into one contact sheet, each labeled with its file name.

Usage: sheet.py OUT.png [--height 600] IN1.png IN2.png ...
"""
import os
import sys

from PIL import Image, ImageDraw

args = sys.argv[1:]
if not args:
    sys.exit("usage: sheet.py OUT.png [--height N] IN.png ...")
out = args.pop(0)
height = 600
if args and args[0] == "--height":
    height = int(args[1])
    args = args[2:]
if not args:
    sys.exit("no input images")

LABEL = 18
GAP = 8
tiles = []
for path in args:
    im = Image.open(path).convert("RGB")
    w = round(im.width * height / im.height)
    tiles.append((os.path.splitext(os.path.basename(path))[0], im.resize((w, height), Image.LANCZOS)))

total_w = sum(t.width for _, t in tiles) + GAP * (len(tiles) + 1)
sheet = Image.new("RGB", (total_w, height + LABEL + GAP * 2), (60, 60, 70))
draw = ImageDraw.Draw(sheet)
x = GAP
for name, tile in tiles:
    draw.text((x + 2, 2), name, fill=(255, 255, 255))
    sheet.paste(tile, (x, LABEL + GAP))
    x += tile.width + GAP
sheet.save(out)
print(out, f"{sheet.width}x{sheet.height}")
