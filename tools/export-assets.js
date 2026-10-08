/*
  Exporte chaque symbole et chaque personnage en images séparées, pour les retoucher ou les redessiner :
    stake/symboles/<nom>.svg   dessin vectoriel modifiable (Illustrator, Figma, Inkscape…)
    stake/symboles/<nom>.png   image 512×512 à fond transparent
    stake/symboles/planche.png planche de tous les symboles avec leurs noms
  Usage : node tools/export-assets.js   (Playwright avec Chromium)
*/
const path = require('path'), fs = require('fs');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'stake', 'symboles');
const LIST = [
  ['0', '01-coffre', 'Coffre (symbole haut, ouvre les coffres en bonus)'], ['1', '02-bouteille-de-rhum', 'Bouteille de rhum'], ['2', '03-carte', 'Carte au trésor'], ['3', '04-boussole', 'Boussole'],
  ['4', '05-crane-et-epees', 'Crâne et épées'], ['5', '06-ancre', 'Ancre'], ['6', '07-canon', 'Canon'], ['7', '08-longue-vue', 'Longue-vue'], ['8', '09-baril-de-rhum', 'Baril de rhum'],
  ['W', '10-drapeau-wild', 'Drapeau Wild'], ['S', '11-bonus', 'Bonus (scatter)'],
  ['c0', '20-matelot-x2', 'Matelot x2'], ['c1', '21-perroquet-x3', 'Perroquet x3'], ['c2', '22-canonnier-x4', 'Canonnier x4'], ['c3', '23-capitaine-x5', 'Capitaine x5']
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1600, height: 1200 } });
  // la page des visuels charge déjà la police et les dessins du jeu
  await p.goto('file://' + path.join(__dirname, 'covers.html') + '?w=10&h=10&layer=fg');
  await p.evaluate(async () => { document.body.innerHTML = ''; document.body.style.background = 'transparent'; await document.fonts.load('40px "Lilita One"'); });
  for (const [code, name] of LIST) {
    const svg = await p.evaluate(c => c[0] === 'c' ? JollyArt.crewSVG(+c[1]) : JollyArt.symSVG(c), code);
    fs.writeFileSync(path.join(OUT, name + '.svg'), svg.replace('<svg ', '<svg width="512" height="512" '));
    await p.evaluate(s => { document.body.innerHTML = `<div id="x" style="width:512px;height:512px">${s.replace('<svg', '<svg style="width:512px;height:512px;display:block"')}</div>`; }, svg);
    await (await p.$('#x')).screenshot({ path: path.join(OUT, name + '.png'), omitBackground: true });
  }
  // planche
  await p.evaluate(list => {
    document.body.style.background = '#0a2148';
    document.body.innerHTML = `<div id="sheet" style="width:1500px;padding:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:24px;font:600 18px Outfit,sans-serif;color:#fff;background:#0a2148">
      <div style="grid-column:1/-1;font:40px 'Lilita One';color:#ffc83d">Jolly Wilds · symboles et personnages</div>` +
      list.map(([c, n, label]) => `<div style="text-align:center;background:rgba(255,255,255,.06);border-radius:16px;padding:12px">${(c[0] === 'c' ? JollyArt.crewSVG(+c[1]) : JollyArt.symSVG(c)).replace('<svg', '<svg style="width:220px;height:220px"')}<div>${label}</div><div style="color:#9fb3d9;font-size:14px">${n}.png / .svg</div></div>`).join('') + '</div>';
  }, LIST);
  await (await p.$('#sheet')).screenshot({ path: path.join(OUT, 'planche.png') });
  await b.close();
  console.log(LIST.length + ' symboles exportés dans stake/symboles/ (+ planche.png)');
})();
