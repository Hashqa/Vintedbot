/*
  Jolly Wilds — dessins vectoriels (SVG intégrés, aucune image externe).
  symSVG(code)  : symbole du plateau ('0'..'8', 'W', 'S')
  crewSVG(id)   : portrait d'un personnage de l'équipage (0 Matelot … 5 Kraken)
*/
(function (root) {
  'use strict';
  const svg = (body, extra = '') => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ${extra}>${body}</svg>`;
  const gid = (() => { let n = 0; return p => p + (++n); })();

  // ---------- symboles hauts
  function chest() {
    const g = gid('ch');
    return svg(`<defs><linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8692e"/><stop offset="1" stop-color="#6b3311"/></linearGradient>
      <linearGradient id="${g}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a8"/><stop offset=".5" stop-color="#ffc83d"/><stop offset="1" stop-color="#c47a00"/></linearGradient></defs>
      <ellipse cx="50" cy="88" rx="38" ry="6" fill="#000" opacity=".35"/>
      <circle cx="30" cy="34" r="9" fill="url(#${g}g)" stroke="#8a5300" stroke-width="2"/><circle cx="50" cy="28" r="10" fill="url(#${g}g)" stroke="#8a5300" stroke-width="2"/><circle cx="70" cy="34" r="9" fill="url(#${g}g)" stroke="#8a5300" stroke-width="2"/>
      <path d="M14 46 Q50 22 86 46 L86 52 L14 52Z" fill="url(#${g}w)" stroke="#3b1a06" stroke-width="3"/>
      <rect x="14" y="50" width="72" height="36" rx="4" fill="url(#${g}w)" stroke="#3b1a06" stroke-width="3"/>
      <rect x="14" y="56" width="72" height="7" fill="url(#${g}g)" stroke="#8a5300" stroke-width="1.5"/>
      <rect x="22" y="50" width="7" height="36" fill="url(#${g}g)" stroke="#8a5300" stroke-width="1.5"/><rect x="71" y="50" width="7" height="36" fill="url(#${g}g)" stroke="#8a5300" stroke-width="1.5"/>
      <rect x="42" y="56" width="16" height="18" rx="3" fill="url(#${g}g)" stroke="#8a5300" stroke-width="2"/><circle cx="50" cy="63" r="2.6" fill="#3b1a06"/><rect x="49" y="64" width="2" height="6" fill="#3b1a06"/>`);
  }
  function rum() {
    const g = gid('rm');
    return svg(`<defs><linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f5a2e"/><stop offset=".45" stop-color="#2fbf6a"/><stop offset="1" stop-color="#0b3f20"/></linearGradient></defs>
      <ellipse cx="50" cy="90" rx="26" ry="5" fill="#000" opacity=".35"/>
      <rect x="42" y="6" width="16" height="10" rx="2" fill="#a0652e" stroke="#4a2a0c" stroke-width="2"/>
      <path d="M43 16 h14 v14 q16 8 16 26 v28 q0 6 -6 6 h-34 q-6 0 -6 -6 v-28 q0 -18 16 -26z" fill="url(#${g}b)" stroke="#06301a" stroke-width="3"/>
      <path d="M33 52 q17 -6 34 0 v22 q-17 6 -34 0z" fill="#f3e2b5" stroke="#7a5a26" stroke-width="2"/>
      <text x="50" y="69" font-family="Lilita One, sans-serif" font-size="15" text-anchor="middle" fill="#7a1d12">XXX</text>
      <path d="M37 40 q3 -8 9 -10" stroke="#bff5d3" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>`);
  }
  function map() {
    return svg(`<ellipse cx="50" cy="90" rx="36" ry="5" fill="#000" opacity=".35"/>
      <path d="M12 20 q10 -6 20 0 q10 6 20 0 q10 -6 20 0 q8 5 16 0 v62 q-8 5 -16 0 q-10 -6 -20 0 q-10 6 -20 0 q-10 -6 -20 0z" fill="#f0d9a0" stroke="#7a5a26" stroke-width="3"/>
      <path d="M22 66 q10 -18 22 -10 t20 -14 t14 -14" stroke="#a0522d" stroke-width="3" fill="none" stroke-dasharray="5 4" stroke-linecap="round"/>
      <path d="M66 22 l12 12 M78 22 l-12 12" stroke="#d62828" stroke-width="5" stroke-linecap="round"/>
      <circle cx="26" cy="38" r="7" fill="#7cc6a2" stroke="#3d7a5c" stroke-width="2"/><path d="M40 72 q6 -6 12 0" stroke="#3a8fd1" stroke-width="3" fill="none"/>`);
  }
  function compass() {
    const g = gid('cp');
    return svg(`<defs><radialGradient id="${g}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff6d0"/><stop offset="1" stop-color="#d9b56a"/></radialGradient></defs>
      <ellipse cx="50" cy="91" rx="30" ry="5" fill="#000" opacity=".35"/>
      <circle cx="50" cy="50" r="38" fill="#c9962b" stroke="#5e3d07" stroke-width="3"/><circle cx="50" cy="50" r="30" fill="url(#${g})" stroke="#8a5f12" stroke-width="2"/>
      <path d="M50 22 L57 50 L50 78 L43 50Z" fill="#2b2b3a"/><path d="M50 22 L57 50 L43 50Z" fill="#d62828"/>
      <path d="M22 50 L50 45 L78 50 L50 55Z" fill="#6b6b80" opacity=".6"/><circle cx="50" cy="50" r="4" fill="#ffc83d" stroke="#5e3d07" stroke-width="1.5"/>
      <text x="50" y="20" font-family="Lilita One, sans-serif" font-size="9" text-anchor="middle" fill="#5e3d07">N</text>`);
  }
  // ---------- symboles bas : lettres sur un écu
  const LOW = { 4: ['A', '#e63946', '#7a0f19'], 5: ['K', '#3a86ff', '#0d2f73'], 6: ['Q', '#b15cff', '#4a137a'], 7: ['J', '#2ecc71', '#0e5a2c'], 8: ['10', '#ff9f1c', '#7a4300'] };
  function low(code) {
    const [t, c1, c2] = LOW[code], g = gid('lw');
    return svg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
      <ellipse cx="50" cy="91" rx="26" ry="4" fill="#000" opacity=".3"/>
      <text x="50" y="${t.length > 1 ? 72 : 76}" font-family="Lilita One, sans-serif" font-size="${t.length > 1 ? 54 : 66}" text-anchor="middle" fill="url(#${g})" stroke="#fff6d8" stroke-width="5" paint-order="stroke" letter-spacing="-3">${t}</text>`);
  }
  function wild() {
    return svg(`<ellipse cx="50" cy="91" rx="32" ry="5" fill="#000" opacity=".35"/>
      <rect x="14" y="8" width="5" height="84" rx="2" fill="#8a5a2b" stroke="#3b1a06" stroke-width="1.5"/>
      <path d="M19 12 h62 q-6 18 0 36 h-62z" fill="#16161f" stroke="#000" stroke-width="2"/>
      <circle cx="50" cy="26" r="9" fill="#f4f1e6"/><rect x="45" y="32" width="10" height="5" rx="1.5" fill="#f4f1e6"/><circle cx="46.5" cy="25" r="2.4" fill="#16161f"/><circle cx="53.5" cy="25" r="2.4" fill="#16161f"/>
      <path d="M36 38 L64 44 M64 38 L36 44" stroke="#f4f1e6" stroke-width="3.5" stroke-linecap="round"/>
      <text x="52" y="80" font-family="Lilita One, sans-serif" font-size="28" text-anchor="middle" fill="#ffc83d" stroke="#3b1a06" stroke-width="5" paint-order="stroke">WILD</text>`);
  }
  function scatter() {
    const g = gid('sc');
    return svg(`<defs><radialGradient id="${g}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff6c2"/><stop offset=".45" stop-color="#ffc83d"/><stop offset="1" stop-color="#a35d00"/></radialGradient></defs>
      <ellipse cx="50" cy="92" rx="30" ry="4" fill="#000" opacity=".35"/>
      <circle cx="50" cy="48" r="40" fill="url(#${g})" stroke="#6b3a00" stroke-width="3"/><circle cx="50" cy="48" r="32" fill="none" stroke="#a35d00" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M33 44 q0 -18 17 -18 q17 0 17 18 q0 8 -6 11 v6 h-22 v-6 q-6 -3 -6 -11z" fill="#fff8e6" stroke="#6b3a00" stroke-width="2.5"/>
      <circle cx="43" cy="44" r="5" fill="#2a1600"/><circle cx="57" cy="44" r="5" fill="#2a1600"/><path d="M50 50 l-3 5 h6z" fill="#2a1600"/>
      <text x="50" y="82" font-family="Lilita One, sans-serif" font-size="15" text-anchor="middle" fill="#fff" stroke="#6b3a00" stroke-width="4" paint-order="stroke">BONUS</text>`);
  }

  // ---------- l'équipage
  const CREW_COLORS = ['#3a86ff', '#2ecc71', '#ffd60a', '#ff7a1a', '#ff3b5c', '#b15cff'];
  const skin = '#f2c194', skinD = '#c98a5b';
  function face(extra) { return `<ellipse cx="50" cy="56" rx="22" ry="25" fill="${skin}" stroke="${skinD}" stroke-width="2"/>${extra}`; }
  const eyes = (y = 52) => `<circle cx="41" cy="${y}" r="3.2" fill="#1d1d2b"/><circle cx="59" cy="${y}" r="3.2" fill="#1d1d2b"/><circle cx="42" cy="${y - 1}" r="1" fill="#fff"/><circle cx="60" cy="${y - 1}" r="1" fill="#fff"/>`;
  function deckhand() { // le Matelot : marin adulte, bonnet, barbe de trois jours, boucle d'oreille
    return `<path d="M22 100 q4 -18 28 -20 q24 2 28 20z" fill="#f4f1e6"/><path d="M26 92 h48 M24 98 h52" stroke="#1f4fa8" stroke-width="4"/>
      ` + face(`<path d="M30 60 q2 22 20 24 q18 -2 20 -24 q-6 10 -20 10 q-14 0 -20 -10z" fill="#8a6a4a" opacity=".55"/>
      ${eyes(53)}<path d="M37 46 l9 1 M63 46 l-9 1" stroke="#4a2e16" stroke-width="3" stroke-linecap="round"/>
      <path d="M43 68 q7 4 14 0" stroke="#7a2b12" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M48 58 q2 4 4 0" stroke="${skinD}" stroke-width="2" fill="none"/>
      <circle cx="72" cy="62" r="3" fill="none" stroke="#ffc83d" stroke-width="2"/>
      <path d="M26 44 q2 -24 24 -24 q22 0 24 24z" fill="#1f4fa8" stroke="#0d2f73" stroke-width="2"/>
      <rect x="24" y="40" width="52" height="9" rx="4" fill="#2b6fd6" stroke="#0d2f73" stroke-width="2"/><path d="M30 44 h40" stroke="#9cc3ff" stroke-width="1.5" stroke-dasharray="3 3"/>`);
  }
  function parrot() {  // le Perroquet
    return `<path d="M30 88 q-6 -40 20 -58 q26 -6 30 22 q2 18 -10 36z" fill="#2ecc71" stroke="#0e5a2c" stroke-width="2.5"/>
      <path d="M50 30 q-8 -14 4 -20 q2 10 8 14z" fill="#e63946" stroke="#7a0f19" stroke-width="2"/>
      <path d="M62 44 q18 0 18 16 q-4 -6 -14 -4z" fill="#ffc83d" stroke="#8a5300" stroke-width="2"/><path d="M66 56 q8 2 10 8 q-8 0 -12 -4z" fill="#3b2a12"/>
      <circle cx="58" cy="44" r="7" fill="#fff" stroke="#0e5a2c" stroke-width="1.5"/><circle cx="59" cy="44" r="3.5" fill="#1d1d2b"/>
      <path d="M34 66 q10 10 22 6 q-6 14 -22 12z" fill="#3a86ff" stroke="#0d2f73" stroke-width="2"/>`;
  }
  function cook() {    // le Cuistot : toque et moustache
    return face(`${eyes(54)}<path d="M36 66 q7 -6 14 -1 q7 -5 14 1 q-7 5 -14 1 q-7 4 -14 -1z" fill="#5a3418"/>
      <path d="M44 72 q6 4 12 0" stroke="#7a2b12" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <rect x="30" y="34" width="40" height="10" rx="3" fill="#fff" stroke="#b9b9c8" stroke-width="2"/>
      <path d="M31 36 q-10 -14 4 -22 q6 -10 15 -4 q9 -6 15 4 q14 8 4 22z" fill="#fff" stroke="#b9b9c8" stroke-width="2"/>`);
  }
  function gunner() {  // le Canonnier : barbe, bandeau sur l'œil
    return face(`<circle cx="59" cy="52" r="3.2" fill="#1d1d2b"/><path d="M33 46 L68 56" stroke="#16161f" stroke-width="2.5"/><ellipse cx="41" cy="52" rx="6" ry="5" fill="#16161f"/>
      <path d="M28 58 q4 26 22 26 q18 0 22 -26 q-6 8 -22 8 q-16 0 -22 -8z" fill="#3b2a1a" stroke="#1f150c" stroke-width="2"/>
      <path d="M43 68 q7 4 14 0" stroke="#f2c194" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M27 44 q6 -18 23 -18 q17 0 23 18 q-23 -6 -46 0z" fill="#16161f"/><path d="M72 40 l10 3 l-7 6z" fill="#16161f"/>`);
  }
  function captain() { // le Capitaine : tricorne à tête de mort, grande barbe
    return face(`${eyes(55)}<path d="M38 49 l8 2 M62 49 l-8 2" stroke="#3b2a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 60 q2 30 24 30 q22 0 24 -30 q-8 10 -24 10 q-16 0 -24 -10z" fill="#1d1d2b" stroke="#000" stroke-width="2"/>
      <path d="M36 66 q14 -8 28 0 q-14 4 -28 0z" fill="#1d1d2b"/>
      <path d="M10 40 q40 -14 80 0 q-6 -26 -40 -30 q-34 4 -40 30z" fill="#16161f" stroke="#ffc83d" stroke-width="3"/>
      <circle cx="50" cy="26" r="6" fill="#f4f1e6"/><circle cx="48" cy="25" r="1.5" fill="#16161f"/><circle cx="52" cy="25" r="1.5" fill="#16161f"/><path d="M43 33 l14 4 M57 33 l-14 4" stroke="#f4f1e6" stroke-width="2"/>`);
  }
  function kraken() {  // le Kraken
    return `<path d="M20 90 q-8 -20 6 -24 q10 -2 6 14" stroke="#7b2cbf" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M80 90 q8 -20 -6 -24 q-10 -2 -6 14" stroke="#7b2cbf" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M38 92 q-4 -14 4 -18 M62 92 q4 -14 -4 -18" stroke="#7b2cbf" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M22 60 q-4 -46 28 -48 q32 2 28 48 q-12 14 -28 14 q-16 0 -28 -14z" fill="#9d4edd" stroke="#4a137a" stroke-width="2.5"/>
      <circle cx="36" cy="28" r="3" fill="#c77dff"/><circle cx="62" cy="22" r="4" fill="#c77dff"/><circle cx="68" cy="38" r="2.5" fill="#c77dff"/>
      <ellipse cx="50" cy="50" rx="15" ry="12" fill="#ffe14d" stroke="#4a137a" stroke-width="2.5"/><rect x="47" y="40" width="6" height="20" rx="3" fill="#16161f"/>
      <circle cx="26" cy="70" r="2.5" fill="#e0aaff"/><circle cx="74" cy="70" r="2.5" fill="#e0aaff"/>`;
  }
  const CREW_ART = [deckhand, parrot, cook, gunner, captain, kraken];
  function crewSVG(id, opts = {}) {
    const col = CREW_COLORS[id], g = gid('cr');
    return svg(`<defs><radialGradient id="${g}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="${col}" stop-opacity=".95"/><stop offset="1" stop-color="#0a1230"/></radialGradient><clipPath id="${g}c"><circle cx="50" cy="50" r="45"/></clipPath></defs>
      <circle cx="50" cy="50" r="47" fill="url(#${g})" stroke="${col}" stroke-width="4"/>
      <g clip-path="url(#${g}c)">${CREW_ART[id]()}</g>
      ${opts.mult ? `<g><rect x="54" y="68" width="44" height="28" rx="14" fill="#16161f" stroke="${col}" stroke-width="3"/><text x="76" y="89" font-family="Lilita One, sans-serif" font-size="20" text-anchor="middle" fill="#fff">x${opts.mult}</text></g>` : ''}`);
  }
  function symSVG(code) {
    switch (code) {
      case '0': return chest(); case '1': return rum(); case '2': return map(); case '3': return compass();
      case 'W': return wild(); case 'S': return scatter();
      default: return low(+code);
    }
  }
  root.JollyArt = { symSVG, crewSVG, CREW_COLORS };
})(typeof self !== 'undefined' ? self : this);
