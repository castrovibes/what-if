#!/usr/bin/env python3
"""Find the device screen inside a capture of the Simulator window.

Usage: calibrate.py WINDOW_CAPTURE.png WIN_X WIN_Y WIN_W WIN_H DEV_W DEV_H
Prints JSON: where device point (0,0) sits in Mac screen points, and the scale.

The app must be showing a light screen (the wrapper switches to light mode first):
the device screen is the bounding box of light pixels, which the black bezel never has.
"""
import json
import sys

from PIL import Image

path, wx, wy, ww, wh, dw, dh = sys.argv[1:8]
wx, wy, ww, wh, dw, dh = map(float, (wx, wy, ww, wh, dw, dh))

im = Image.open(path).convert("RGB")
cw, ch = im.size
backing = cw / ww  # capture pixels per screen point (2 on Retina displays)

# Bounding box of light pixels. A per-row scan keeps this fast enough in plain Python.
px = im.load()
x0 = y0 = None
x1 = y1 = -1
for y in range(ch):
    row_min = None
    row_max = None
    for x in range(cw):
        r, g, b = px[x, y]
        if min(r, g, b) > 128:
            if row_min is None:
                row_min = x
            row_max = x
    if row_min is not None:
        x0 = row_min if x0 is None else min(x0, row_min)
        x1 = max(x1, row_max)
        y0 = y if y0 is None else y0
        y1 = y

if x0 is None:
    sys.exit("no light pixels in the window capture: is the app showing a light screen?")

sw = x1 - x0 + 1
sh = y1 - y0 + 1
scale_x = sw / backing / dw  # screen points per device point
scale_y = sh / backing / dh
if abs(scale_x - scale_y) / scale_x > 0.03:
    sys.exit(
        f"screen box {sw}x{sh} px is not the device's {dw:.0f}x{dh:.0f} aspect; "
        "a sheet, keyboard or dark screen may be hiding the edges"
    )

print(
    json.dumps(
        {
            "originX": round(wx + x0 / backing, 2),
            "originY": round(wy + y0 / backing, 2),
            "scale": round((scale_x + scale_y) / 2, 4),
            "window": [wx, wy, ww, wh],
            "device": [dw, dh],
        }
    )
)
