/* global __dirname */
// Rasterizes the vector question mark (assets/graphics/question-mark-bw-lines.svg) to a
// tall PNG of black ink on a transparent background. make_splash.py and make_icon.py
// tint and place this raster, so everything downstream comes from the one vector.
//
// Usage (install the renderer in a scratch folder so it isn't added to the app's dependencies):
//   npm install @resvg/resvg-js
//   NODE_PATH=<scratch>/node_modules node tools/graphics/render_question_mark.js
const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const SVG = path.join(ROOT, 'assets/graphics/question-mark-bw-lines.svg');
const OUT = path.join(ROOT, 'assets/graphics/question-mark-ink.png');
const HEIGHT = 2400; // px; the largest use is the 1024 icon, where the mark is ~780 px tall

const r = new Resvg(fs.readFileSync(SVG, 'utf8'), { fitTo: { mode: 'height', value: HEIGHT } });
const png = r.render();
fs.writeFileSync(OUT, png.asPng());
console.log('wrote', path.relative(ROOT, OUT), `${png.width}x${png.height}`);
