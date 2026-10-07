/*
  Rend la tuile 3:4 (1200×1600), la couverture 16:9 (1920×1080) et les calques séparés pour
  l'éditeur de tuile du Studio Stake (fond seul, personnages sur fond transparent), à partir de tools/covers.html.
  Usage : node tools/render-covers.js   (Playwright avec Chromium)
*/
const path = require('path'), fs = require('fs');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const OUT = path.join(__dirname, '..', 'stake');
(async () => {
  const b = await chromium.launch();
  const page = 'file://' + path.join(__dirname, 'covers.html');
  fs.mkdirSync(path.join(OUT, 'tile-layers'), { recursive: true });
  const jobs = [
    [1200, 1600, 'all', 'tile-3x4.png'], [1920, 1080, 'all', 'cover-16x9.png'],
    [1200, 1600, 'bg', 'tile-layers/background-3x4.png'], [1920, 1080, 'bg', 'tile-layers/background-16x9.png'],
    [1200, 1600, 'fg', 'tile-layers/foreground-crew-3x4.png'], [1920, 1080, 'fg', 'tile-layers/foreground-crew-16x9.png']
  ];
  for (const [w, h, layer, out] of jobs) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    await p.goto(`${page}?w=${w}&h=${h}&layer=${layer}`); await p.waitForTimeout(500);
    await p.screenshot({ path: path.join(OUT, out), omitBackground: layer === 'fg' }); await p.close();
    console.log('stake/' + out);
  }
  await b.close();
})();
