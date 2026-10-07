/*
  Rend la tuile 3:4 (1200×1600) et la couverture 16:9 (1920×1080) de Jolly Wilds à partir de tools/covers.html.
  Usage : node tools/render-covers.js   (Playwright avec Chromium)
*/
const path = require('path');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
(async () => {
  const b = await chromium.launch();
  const page = 'file://' + path.join(__dirname, 'covers.html');
  for (const [w, h, out] of [[1200, 1600, 'tile-3x4.png'], [1920, 1080, 'cover-16x9.png']]) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`${page}?w=${w}&h=${h}`); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(__dirname, '..', 'stake', out) }); await p.close();
    console.log('stake/' + out);
  }
  await b.close();
})();
