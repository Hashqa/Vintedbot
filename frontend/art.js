/*
  Jolly Wilds — dessins vectoriels animés (SVG intégrés, aucune image externe).
  symSVG(code)  : symbole du plateau ('0'..'8', 'W', 'S')
  crewSVG(id)   : portrait d'un personnage (0 Matelot x2, 1 Perroquet x3, 2 Canonnier x4, 3 Capitaine x5)

  Les animations sont en CSS (frontend/index.html) et visent les classes « a-… » posées sur les parties des dessins :
    au repos   : a-cloth (drapeau qui flotte), a-blink (paupières), a-shine (reflet), a-bob (respiration), a-wing
    sur un gain (.cell.win) : a-lid / a-glow / a-coins (coffre), a-liquid (rhum), a-path / a-x (carte), a-needle (boussole),
                a-eyes / a-swl / a-swr (crâne), a-swing (ancre), a-recoil / a-flash / a-smoke (canon), a-tube / a-glint (longue-vue),
                a-wobble / a-drip (baril), a-spin (pièce Bonus), a-spark (étincelles)
*/
(function (root) {
  'use strict';
  const svg = (body, extra = '') => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" ${extra}>${body}</svg>`;
  const gid = (() => { let n = 0; return p => p + (++n); })();
  const shadow = w => `<ellipse cx="50" cy="92" rx="${w}" ry="4.5" fill="#000" opacity=".32"/>`;
  // étincelle à 4 branches (apparaît sur les gains)
  const spark = (x, y, r, d = 0) => `<path class="a-spark" opacity="0" style="animation-delay:${d}s" d="M${x} ${y - r} Q${x + r * .18} ${y - r * .18} ${x + r} ${y} Q${x + r * .18} ${y + r * .18} ${x} ${y + r} Q${x - r * .18} ${y + r * .18} ${x - r} ${y} Q${x - r * .18} ${y - r * .18} ${x} ${y - r}Z" fill="#fffbe0"/>`;
  const gold = g => `<linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".35" stop-color="#ffd24a"/><stop offset=".7" stop-color="#e09a12"/><stop offset="1" stop-color="#8a5300"/></linearGradient>`;

  // ---------- symboles hauts
  function chest() {
    const g = gid('ch');
    return svg(`<defs>${gold(g + 'g')}
      <linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c47a3a"/><stop offset=".5" stop-color="#8a4a1c"/><stop offset="1" stop-color="#4a220a"/></linearGradient>
      <linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d98c48"/><stop offset="1" stop-color="#7a3d14"/></linearGradient>
      <radialGradient id="${g}r" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#fff4b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffc83d" stop-opacity="0"/></radialGradient></defs>
      ${shadow(38)}
      <ellipse class="a-glow" opacity="0" cx="50" cy="44" rx="40" ry="26" fill="url(#${g}r)"/>
      <g class="a-coins"><circle cx="34" cy="44" r="7" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.5"/><circle cx="50" cy="40" r="8" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.5"/><circle cx="66" cy="44" r="7" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.5"/>
        <path d="M45 37 l3 3 M61 41 l2 2" stroke="#fffbe0" stroke-width="2" stroke-linecap="round"/><circle cx="58" cy="47" r="3" fill="#e63946" stroke="#7a0f19"/><circle cx="42" cy="47" r="2.6" fill="#3a86ff" stroke="#0d2f73"/></g>
      <rect x="12" y="50" width="76" height="38" rx="5" fill="url(#${g}w)" stroke="#2a1405" stroke-width="2.5"/>
      <path d="M12 62 h76 M12 75 h76" stroke="#3b1a06" stroke-width="1.2" opacity=".55"/>
      <rect x="20" y="50" width="8" height="38" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.2"/><rect x="72" y="50" width="8" height="38" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.2"/>
      <rect x="41" y="54" width="18" height="20" rx="3" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.5"/><circle cx="50" cy="62" r="3" fill="#2a1405"/><path d="M50 64 v6" stroke="#2a1405" stroke-width="2.4"/>
      <g class="a-lid"><path d="M12 52 Q12 26 50 24 Q88 26 88 52 Z" fill="url(#${g}l)" stroke="#2a1405" stroke-width="2.5"/>
        <path d="M24 50 Q24 30 50 28 Q76 30 76 50" fill="none" stroke="#3b1a06" stroke-width="1.2" opacity=".5"/>
        <path d="M20 51 Q21 30 28 28 M72 28 Q79 30 80 51" fill="none" stroke="url(#${g}g)" stroke-width="7"/>
        <rect x="10" y="48" width="80" height="6" rx="2" fill="url(#${g}g)" stroke="#7a4600" stroke-width="1.2"/>
        <path d="M26 35 Q38 27 50 27" stroke="#ffe2b0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".6"/></g>
      ${spark(22, 30, 6, 0)}${spark(80, 26, 5, .3)}${spark(62, 16, 4, .6)}`);
  }
  function rum() {
    const g = gid('rm');
    return svg(`<defs><linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0b4a26"/><stop offset=".35" stop-color="#2fbf6a"/><stop offset=".6" stop-color="#1b8a48"/><stop offset="1" stop-color="#06301a"/></linearGradient>
      <linearGradient id="${g}q" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb347"/><stop offset="1" stop-color="#8a3a00"/></linearGradient>
      <clipPath id="${g}c"><path d="M43 18 h14 v12 q16 8 16 26 v28 q0 6 -6 6 h-34 q-6 0 -6 -6 v-28 q0 -18 16 -26z"/></clipPath></defs>
      ${shadow(26)}
      <g class="a-tilt">
      <path d="M43 18 h14 v12 q16 8 16 26 v28 q0 6 -6 6 h-34 q-6 0 -6 -6 v-28 q0 -18 16 -26z" fill="url(#${g}b)"/>
      <g clip-path="url(#${g}c)"><path class="a-liquid" d="M20 58 Q35 53 50 58 T80 58 V100 H20Z" fill="url(#${g}q)" opacity=".75"/></g>
      <path d="M43 18 h14 v12 q16 8 16 26 v28 q0 6 -6 6 h-34 q-6 0 -6 -6 v-28 q0 -18 16 -26z" fill="none" stroke="#042414" stroke-width="2.5"/>
      <rect x="41" y="6" width="18" height="13" rx="3" fill="#b07a43" stroke="#3b1a06" stroke-width="2"/><path d="M44 10 h12" stroke="#d9a46a" stroke-width="1.5"/>
      <rect x="40" y="16" width="20" height="4" rx="2" fill="#e0b040" stroke="#7a4600" stroke-width="1"/>
      <path d="M31 54 q19 -6 38 0 v20 q-19 6 -38 0z" fill="#f3e2b5" stroke="#7a5a26" stroke-width="2"/>
      <circle cx="50" cy="61" r="5" fill="#2a1a10"/><circle cx="48" cy="60" r="1.3" fill="#f3e2b5"/><circle cx="52" cy="60" r="1.3" fill="#f3e2b5"/><path d="M43 69 l14 -3 M43 66 l14 3" stroke="#2a1a10" stroke-width="1.6"/>
      <path class="a-shine" d="M36 38 q3 -8 9 -10 M35 46 v6" stroke="#d6ffe6" stroke-width="3" fill="none" stroke-linecap="round" opacity=".75"/>
      </g>${spark(76, 30, 5, .2)}`);
  }
  function map() {
    const g = gid('mp');
    return svg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbeec4"/><stop offset=".6" stop-color="#ead39a"/><stop offset="1" stop-color="#c9a865"/></linearGradient></defs>
      ${shadow(36)}
      <path d="M12 20 q10 -6 20 0 q10 6 20 0 q10 -6 20 0 q8 5 16 0 v62 q-8 5 -16 0 q-10 -6 -20 0 q-10 6 -20 0 q-10 -6 -20 0z" fill="url(#${g})" stroke="#6b4a1a" stroke-width="2.5"/>
      <path d="M32 20 v62 M52 20 v62 M72 20 v62" stroke="#a8864a" stroke-width="1" opacity=".5"/>
      <path d="M14 22 q6 2 4 8 M86 78 q-6 -2 -4 -8" stroke="#a8864a" stroke-width="1.5" fill="none"/>
      <path d="M20 44 q6 -8 14 -4 q6 4 0 10 q-8 4 -14 -6z" fill="#7cc6a2" stroke="#3d7a5c" stroke-width="1.6"/><path d="M26 42 l3 -6 l3 6" stroke="#2e7a4f" stroke-width="1.6" fill="none"/>
      <path d="M40 74 q4 -4 8 0 q4 4 8 0 M56 66 q3 -3 6 0" stroke="#3a8fd1" stroke-width="2" fill="none"/>
      <path class="a-path" d="M24 66 q10 -18 22 -10 t20 -14 t12 -12" stroke="#a0362d" stroke-width="2.8" fill="none" stroke-dasharray="4 4" stroke-linecap="round"/>
      <g class="a-x"><path d="M66 22 l12 12 M78 22 l-12 12" stroke="#d62828" stroke-width="5.5" stroke-linecap="round"/><path d="M66 22 l12 12 M78 22 l-12 12" stroke="#ff8f8f" stroke-width="1.5" stroke-linecap="round"/></g>
      <g transform="translate(78 70)"><circle r="7" fill="none" stroke="#6b4a1a" stroke-width="1.2"/><path d="M0 -9 l2 9 l-2 9 l-2 -9z" fill="#6b4a1a"/></g>`);
  }
  function compass() {
    const g = gid('cp');
    const ticks = Array.from({ length: 16 }, (_, i) => { const a = i * Math.PI / 8, r1 = i % 4 ? 26 : 23, r2 = 29; return `<path d="M${50 + Math.sin(a) * r1} ${50 - Math.cos(a) * r1} L${50 + Math.sin(a) * r2} ${50 - Math.cos(a) * r2}" stroke="#7a5310" stroke-width="${i % 4 ? 1.2 : 2.2}"/>`; }).join('');
    return svg(`<defs>${gold(g + 'g')}<radialGradient id="${g}f" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="#fffbe8"/><stop offset="1" stop-color="#e2c27a"/></radialGradient>
      <linearGradient id="${g}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      ${shadow(30)}
      <circle cx="50" cy="50" r="40" fill="url(#${g}g)" stroke="#5e3d07" stroke-width="2.5"/><circle cx="50" cy="50" r="40" fill="none" stroke="#fff4c0" stroke-width="1" opacity=".6"/>
      <circle cx="50" cy="8" r="5" fill="url(#${g}g)" stroke="#5e3d07" stroke-width="2"/>
      <circle cx="50" cy="50" r="31" fill="url(#${g}f)" stroke="#8a5f12" stroke-width="2"/>${ticks}
      <text x="50" y="30" font-family="Lilita One, sans-serif" font-size="9" text-anchor="middle" fill="#7a1d12">N</text>
      <g class="a-needle"><path d="M50 24 L56 50 L50 76 L44 50Z" fill="#2b2b3a"/><path d="M50 24 L56 50 L44 50Z" fill="#d62828"/><path d="M50 24 L50 50 L44 50Z" fill="#ff6b6b"/></g>
      <circle cx="50" cy="50" r="4.5" fill="url(#${g}g)" stroke="#5e3d07" stroke-width="1.5"/>
      <path class="a-shine" d="M28 34 a26 26 0 0 1 22 -15" stroke="url(#${g}s)" stroke-width="6" fill="none" stroke-linecap="round"/>`);
  }
  // ---------- symboles bas
  function skull() {
    const g = gid('sk');
    return svg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#d7deea"/><stop offset="1" stop-color="#8f9bb3"/></linearGradient>
      <linearGradient id="${g}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4f7fb"/><stop offset="1" stop-color="#8a96ad"/></linearGradient>${gold(g + 'g')}
      <radialGradient id="${g}e" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ff5a3c"/><stop offset="1" stop-color="#ff5a3c" stop-opacity="0"/></radialGradient></defs>
      ${shadow(32)}
      <g class="a-swl"><path d="M18 84 L78 22" stroke="#3a4560" stroke-width="7" stroke-linecap="round"/><path d="M18 84 L78 22" stroke="url(#${g}b)" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M20 70 l12 12" stroke="url(#${g}g)" stroke-width="5" stroke-linecap="round"/><path d="M14 88 l7 -7" stroke="#7a1d12" stroke-width="5" stroke-linecap="round"/><circle cx="12" cy="90" r="3.6" fill="url(#${g}g)"/></g>
      <g class="a-swr"><path d="M82 84 L22 22" stroke="#3a4560" stroke-width="7" stroke-linecap="round"/><path d="M82 84 L22 22" stroke="url(#${g}b)" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M80 70 l-12 12" stroke="url(#${g}g)" stroke-width="5" stroke-linecap="round"/><path d="M86 88 l-7 -7" stroke="#7a1d12" stroke-width="5" stroke-linecap="round"/><circle cx="88" cy="90" r="3.6" fill="url(#${g}g)"/></g>
      <path d="M27 46 q0 -28 23 -28 q23 0 23 28 q0 12 -8 17 v11 q0 3 -3 3 h-24 q-3 0 -3 -3 v-11 q-8 -5 -8 -17z" fill="url(#${g})" stroke="#2a3348" stroke-width="2.5"/>
      <path d="M33 34 q6 -10 16 -11" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>
      <ellipse cx="40" cy="47" rx="7" ry="8" fill="#1d1d2b"/><ellipse cx="60" cy="47" rx="7" ry="8" fill="#1d1d2b"/>
      <g class="a-eyes" opacity="0"><circle cx="40" cy="47" r="7" fill="url(#${g}e)"/><circle cx="60" cy="47" r="7" fill="url(#${g}e)"/><circle cx="40" cy="48" r="2" fill="#ffd0c0"/><circle cx="60" cy="48" r="2" fill="#ffd0c0"/></g>
      <path d="M50 55 l-4 7 h8z" fill="#1d1d2b"/><path d="M40 77 v-8 M46 77 v-8 M54 77 v-8 M60 77 v-8" stroke="#2a3348" stroke-width="2"/>`);
  }
  function anchor() {
    const g = gid('an');
    return svg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#173a8a"/><stop offset=".45" stop-color="#5aa8ff"/><stop offset=".6" stop-color="#2f6fe0"/><stop offset="1" stop-color="#0d2050"/></linearGradient></defs>
      ${shadow(30)}
      <g class="a-swing">
      <circle cx="50" cy="15" r="8" fill="none" stroke="#0d2050" stroke-width="8"/><circle cx="50" cy="15" r="8" fill="none" stroke="url(#${g})" stroke-width="5"/>
      <rect x="45" y="22" width="10" height="58" rx="4" fill="url(#${g})" stroke="#0d2050" stroke-width="2"/>
      <rect x="28" y="30" width="44" height="9" rx="4.5" fill="url(#${g})" stroke="#0d2050" stroke-width="2"/>
      <path d="M17 56 q4 28 33 30 q29 -2 33 -30" fill="none" stroke="#0d2050" stroke-width="11" stroke-linecap="round"/>
      <path d="M17 56 q4 28 33 30 q29 -2 33 -30" fill="none" stroke="url(#${g})" stroke-width="7" stroke-linecap="round"/>
      <path d="M8 62 l9 -13 l9 13z M74 62 l9 -13 l9 13z" fill="url(#${g})" stroke="#0d2050" stroke-width="2" stroke-linejoin="round"/>
      <path d="M44 44 q12 4 0 8 q12 4 0 8 q12 4 0 8" fill="none" stroke="#b07a43" stroke-width="3.2" stroke-linecap="round"/><path d="M44 44 q12 4 0 8 q12 4 0 8 q12 4 0 8" fill="none" stroke="#e0b07a" stroke-width="1.2" stroke-linecap="round"/>
      <path class="a-shine" d="M48 26 v14" stroke="#cfe6ff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
      </g>`);
  }
  function cannon() {
    const g = gid('cn');
    return svg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9aa3b5"/><stop offset=".35" stop-color="#4a5266"/><stop offset="1" stop-color="#14161d"/></linearGradient>${gold(g + 'g')}
      <radialGradient id="${g}f" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ff9f1c"/><stop offset="1" stop-color="#ff4d00" stop-opacity="0"/></radialGradient></defs>
      ${shadow(36)}
      <g class="a-smoke" opacity="0" fill="#e8ecf4"><circle cx="92" cy="26" r="6"/><circle cx="96" cy="18" r="4.5"/><circle cx="88" cy="16" r="3.5"/></g>
      <circle class="a-flash" opacity="0" cx="91" cy="30" r="10" fill="url(#${g}f)"/>
      <g class="a-recoil">
      <path d="M12 44 L82 24 q8 -2 9 6 l3 13 q1 8 -7 9 L18 70 q-8 2 -10 -6 l-3 -12 q-1 -6 7 -8z" fill="url(#${g})" stroke="#0b0c10" stroke-width="2.5"/>
      <ellipse cx="90" cy="36" rx="5" ry="11" transform="rotate(-15 90 36)" fill="#0b0c10" stroke="#4a5266" stroke-width="1.5"/>
      <path d="M30 40 l5 22 M60 31 l5 22" stroke="url(#${g}g)" stroke-width="4"/>
      <path d="M22 46 L80 30" stroke="#c9d1e0" stroke-width="2" opacity=".5"/>
      <path d="M6 54 q-6 -3 -4 -9" stroke="#c47a00" stroke-width="2.5" fill="none"/><circle cx="2" cy="44" r="2" fill="#ffd60a"/>
      </g>
      <path d="M18 74 h40 l-6 10 h-28z" fill="#6b3a1a" stroke="#2a1405" stroke-width="2"/>
      <g><circle cx="34" cy="78" r="13" fill="#8a5a2b" stroke="#2a1405" stroke-width="2.5"/><circle cx="34" cy="78" r="9" fill="none" stroke="#5a3416" stroke-width="1.5"/><circle cx="34" cy="78" r="3.5" fill="url(#${g}g)"/>
        <path d="M34 65 v26 M21 78 h26 M25 69 l18 18 M43 69 l-18 18" stroke="#2a1405" stroke-width="1.8"/></g>`);
  }
  function spyglass() {
    const g = gid('sg');
    return svg(`<defs>${gold(g + 'g')}<linearGradient id="${g}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5a2a"/><stop offset="1" stop-color="#4a220a"/></linearGradient>
      <radialGradient id="${g}e" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#e6fbff"/><stop offset=".5" stop-color="#5ac8ff"/><stop offset="1" stop-color="#1f4fa8"/></radialGradient></defs>
      ${shadow(32)}
      <g transform="rotate(-28 50 50)">
        <rect x="6" y="41" width="26" height="18" rx="4" fill="url(#${g}l)" stroke="#2a1405" stroke-width="2"/><path d="M10 45 h18 M10 50 h18 M10 55 h18" stroke="#2a1405" stroke-width="1" opacity=".5"/>
        <g class="a-tube">
          <rect x="30" y="38" width="28" height="24" rx="3" fill="url(#${g}g)" stroke="#5a3400" stroke-width="2"/><rect x="30" y="38" width="5" height="24" fill="#b07a10" opacity=".6"/>
          <rect x="56" y="35" width="30" height="30" rx="3" fill="url(#${g}g)" stroke="#5a3400" stroke-width="2"/><rect x="56" y="35" width="5" height="30" fill="#b07a10" opacity=".6"/>
          <rect x="84" y="32" width="8" height="36" rx="2" fill="#7a4a00" stroke="#3b2200" stroke-width="1.5"/>
          <ellipse cx="92" cy="50" rx="3.5" ry="15" fill="url(#${g}e)" stroke="#123a8a" stroke-width="1.5"/>
          <path class="a-glint" d="M90 40 v20" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
          <path d="M38 41 h16 M64 38 h18" stroke="#fffbe0" stroke-width="2" stroke-linecap="round" opacity=".8"/>
        </g>
      </g>${spark(82, 18, 6, 0)}`);
  }
  function barrel() {
    const g = gid('br');
    return svg(`<defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5a2a0c"/><stop offset=".45" stop-color="#d08a48"/><stop offset=".6" stop-color="#b06a2a"/><stop offset="1" stop-color="#4a220a"/></linearGradient>
      <linearGradient id="${g}h" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#4a5266"/><stop offset=".45" stop-color="#d3dae6"/><stop offset="1" stop-color="#3a4256"/></linearGradient></defs>
      ${shadow(30)}
      <g class="a-wobble">
      <path d="M24 12 q26 -7 52 0 q9 38 0 76 q-26 7 -52 0 q-9 -38 0 -76z" fill="url(#${g})" stroke="#2a1405" stroke-width="2.5"/>
      <path d="M37 10 q-6 40 0 80 M50 9 v82 M63 10 q6 40 0 80" stroke="#3b1a06" stroke-width="1.4" opacity=".55" fill="none"/>
      <ellipse cx="50" cy="12" rx="26" ry="5" fill="#8a4a1c" stroke="#2a1405" stroke-width="2"/><ellipse cx="50" cy="12" rx="18" ry="3" fill="#5a2a0c"/>
      <path d="M20 28 q30 -7 60 0" stroke="url(#${g}h)" stroke-width="6" fill="none"/><path d="M18 72 q32 7 64 0" stroke="url(#${g}h)" stroke-width="6" fill="none"/>
      <path d="M20 28 q30 -7 60 0 M18 72 q32 7 64 0" stroke="#22262f" stroke-width="1.2" fill="none"/>
      <ellipse cx="50" cy="50" rx="14" ry="11" fill="#f3e2b5" stroke="#7a5a26" stroke-width="2"/>
      <text x="50" y="55" font-family="Lilita One, sans-serif" font-size="13" text-anchor="middle" fill="#7a1d12">RUM</text>
      <rect x="44" y="76" width="12" height="7" rx="2" fill="#7a4a00" stroke="#2a1405" stroke-width="1.5"/>
      <path class="a-shine" d="M30 20 q-4 30 0 60" stroke="#ffd6a8" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".5"/>
      </g>
      <path class="a-drip" opacity="0" d="M50 84 q-3 5 0 8 q3 -3 0 -8z" fill="#ff9f1c"/>`);
  }
  function wild() {
    const g = gid('wd');
    return svg(`<defs>${gold(g + 'g')}<linearGradient id="${g}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2e3e"/><stop offset="1" stop-color="#0b0b12"/></linearGradient></defs>
      ${shadow(32)}
      <rect x="12" y="6" width="5" height="86" rx="2" fill="#8a5a2b" stroke="#3b1a06" stroke-width="1.5"/><circle cx="14.5" cy="6" r="4" fill="url(#${g}g)" stroke="#7a4600"/>
      <g class="a-cloth"><path d="M17 10 Q35 4 50 10 T86 10 Q80 28 86 48 Q68 42 50 48 T17 48z" fill="url(#${g}c)" stroke="#000" stroke-width="2"/>
        <circle cx="50" cy="24" r="8.5" fill="#f4f1e6"/><rect x="45.5" y="29" width="9" height="5" rx="1.5" fill="#f4f1e6"/><circle cx="46.8" cy="23.5" r="2.4" fill="#16161f"/><circle cx="53.2" cy="23.5" r="2.4" fill="#16161f"/>
        <path d="M36 35 L64 44 M64 35 L36 44" stroke="#f4f1e6" stroke-width="3.5" stroke-linecap="round"/></g>
      <text x="53" y="82" font-family="Lilita One, sans-serif" font-size="30" text-anchor="middle" fill="url(#${g}g)" stroke="#3b1a06" stroke-width="5" paint-order="stroke">WILD</text>
      ${spark(84, 62, 6, .1)}${spark(24, 60, 4, .5)}`);
  }
  function scatter() {
    const g = gid('sc');
    return svg(`<defs><radialGradient id="${g}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fffbe0"/><stop offset=".4" stop-color="#ffd24a"/><stop offset="1" stop-color="#a35d00"/></radialGradient>${gold(g + 'g')}</defs>
      ${shadow(30)}
      <g class="a-spin">
      <circle cx="50" cy="47" r="41" fill="url(#${g})" stroke="#6b3a00" stroke-width="3"/>
      <circle cx="50" cy="47" r="34" fill="none" stroke="#a35d00" stroke-width="2" stroke-dasharray="3 3"/>
      <path d="M33 43 q0 -18 17 -18 q17 0 17 18 q0 8 -6 11 v6 h-22 v-6 q-6 -3 -6 -11z" fill="#fff8e6" stroke="#6b3a00" stroke-width="2.5"/>
      <circle cx="43" cy="43" r="5" fill="#2a1600"/><circle cx="57" cy="43" r="5" fill="#2a1600"/><path d="M50 49 l-3 5 h6z" fill="#2a1600"/>
      <path class="a-shine" d="M22 34 a30 30 0 0 1 20 -18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>
      </g>
      <path d="M14 70 h72 l-5 7 l5 7 h-72 l5 -7z" fill="#c8102e" stroke="#5a0010" stroke-width="2"/>
      <text x="50" y="81" font-family="Lilita One, sans-serif" font-size="13" text-anchor="middle" fill="#fff" stroke="#5a0010" stroke-width="3" paint-order="stroke">BONUS</text>
      ${spark(84, 20, 6, 0)}${spark(16, 26, 4, .4)}`);
  }

  // ---------- l'équipage (portraits ronds)
  const CREW_COLORS = ['#3a86ff', '#2ecc71', '#ff7a1a', '#ff3b5c'];
  const skin = '#f2c194', skinD = '#c98a5b';
  const face = extra => `<ellipse cx="29" cy="58" rx="4" ry="6" fill="${skin}" stroke="${skinD}" stroke-width="1.5"/><ellipse cx="71" cy="58" rx="4" ry="6" fill="${skin}" stroke="${skinD}" stroke-width="1.5"/>
    <ellipse cx="50" cy="57" rx="22" ry="25" fill="${skin}" stroke="${skinD}" stroke-width="2"/><ellipse cx="44" cy="44" rx="9" ry="5" fill="#fff" opacity=".18"/>${extra}`;
  // yeux avec paupières qui clignent (a-blink)
  const eyes = (y = 53, lx = 41, rx = 59) => `<ellipse cx="${lx}" cy="${y}" rx="3.6" ry="4" fill="#fff"/><ellipse cx="${rx}" cy="${y}" rx="3.6" ry="4" fill="#fff"/>
    <circle cx="${lx + .5}" cy="${y + .5}" r="2.5" fill="#1d1d2b"/><circle cx="${rx + .5}" cy="${y + .5}" r="2.5" fill="#1d1d2b"/><circle cx="${lx + 1.3}" cy="${y - .5}" r=".9" fill="#fff"/><circle cx="${rx + 1.3}" cy="${y - .5}" r=".9" fill="#fff"/>
    <g class="a-blink" transform="scale(1 0)"><ellipse cx="${lx}" cy="${y}" rx="4" ry="4.4" fill="${skin}"/><ellipse cx="${rx}" cy="${y}" rx="4" ry="4.4" fill="${skin}"/></g>`;
  function deckhand() { // le Matelot : marin adulte, bonnet, barbe de trois jours, boucle d'oreille, marinière
    return `<path d="M18 100 q4 -20 32 -22 q28 2 32 22z" fill="#f4f1e6" stroke="#9aa3b5" stroke-width="1.5"/><path d="M22 90 h56 M20 97 h60" stroke="#1f4fa8" stroke-width="4"/>
      <path d="M40 80 l10 8 l10 -8" fill="#e63946" stroke="#7a0f19" stroke-width="1.5"/>
      <g class="a-bob">${face(`<path d="M29 60 q2 24 21 26 q19 -2 21 -26 q-6 11 -21 11 q-15 0 -21 -11z" fill="#8a6a4a" opacity=".5"/>
      ${eyes(53)}<path d="M36 46 l9 1.5 M64 46 l-9 1.5" stroke="#4a2e16" stroke-width="3" stroke-linecap="round"/>
      <path d="M43 69 q7 5 14 0" stroke="#7a2b12" stroke-width="2.6" fill="none" stroke-linecap="round"/><path d="M47 60 q3 4 6 0" stroke="${skinD}" stroke-width="2" fill="none"/>
      <circle cx="73" cy="64" r="3" fill="none" stroke="#ffc83d" stroke-width="2"/>
      <path d="M26 44 q2 -26 24 -26 q22 0 24 26z" fill="#1f4fa8" stroke="#0d2f73" stroke-width="2"/><path d="M36 26 q6 -4 12 -4" stroke="#6fa0ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <rect x="24" y="40" width="52" height="9" rx="4" fill="#2b6fd6" stroke="#0d2f73" stroke-width="2"/><path d="M30 44.5 h40" stroke="#9cc3ff" stroke-width="1.5" stroke-dasharray="3 3"/>
      <circle cx="50" cy="17" r="4" fill="#e63946" stroke="#7a0f19" stroke-width="1.5"/>`)}</g>`;
  }
  function parrot() {   // le Perroquet
    return `<path d="M60 100 q2 -10 10 -14" stroke="#8a5a2b" stroke-width="6" stroke-linecap="round"/>
      <g class="a-bob"><path d="M28 92 q-8 -42 20 -62 q28 -8 32 22 q2 20 -12 40z" fill="#2ecc71" stroke="#0e5a2c" stroke-width="2.5"/>
      <path d="M36 46 q6 -8 16 -8" stroke="#8ff0b8" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
      <g class="a-wing"><path d="M30 64 q12 12 26 6 q-6 18 -26 16z" fill="#3a86ff" stroke="#0d2f73" stroke-width="2"/><path d="M34 72 q8 4 16 2 M34 78 q8 3 14 1" stroke="#9fd3ff" stroke-width="1.5" fill="none"/></g>
      <path d="M50 30 q-10 -16 4 -24 q2 12 10 16z" fill="#e63946" stroke="#7a0f19" stroke-width="2"/><path d="M56 26 q-2 -10 8 -14 q-2 10 2 14z" fill="#ffd60a" stroke="#8a5300" stroke-width="1.5"/>
      <path d="M62 44 q20 0 20 18 q-5 -7 -16 -5z" fill="#ffc83d" stroke="#8a5300" stroke-width="2"/><path d="M66 56 q9 2 11 9 q-9 0 -13 -5z" fill="#3b2a12"/>
      <circle cx="57" cy="44" r="7.5" fill="#fff" stroke="#0e5a2c" stroke-width="1.5"/><circle cx="58" cy="44" r="3.8" fill="#1d1d2b"/><circle cx="59.4" cy="42.6" r="1.2" fill="#fff"/>
      <g class="a-blink" transform="scale(1 0)"><circle cx="57" cy="44" r="8" fill="#2ecc71"/></g></g>`;
  }
  function gunner() {   // le Canonnier : barbe, bandeau sur l'œil, foulard noir
    return `<path d="M18 100 q4 -20 32 -22 q28 2 32 22z" fill="#5a3416" stroke="#2a1405" stroke-width="1.5"/><path d="M40 80 l10 10 l10 -10" fill="#d0d6e2"/>
      <g class="a-bob">${face(`<path d="M27 58 q3 30 23 30 q20 0 23 -30 q-6 9 -23 9 q-17 0 -23 -9z" fill="#3b2a1a" stroke="#1f150c" stroke-width="2"/>
      <path d="M42 70 q8 5 16 0" stroke="#f2c194" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M33 45 L69 57" stroke="#16161f" stroke-width="2.6"/><ellipse cx="41" cy="52" rx="6.5" ry="5.5" fill="#16161f"/>
      <ellipse cx="59" cy="53" rx="3.6" ry="4" fill="#fff"/><circle cx="59.5" cy="53.5" r="2.5" fill="#1d1d2b"/><circle cx="60.3" cy="52.5" r=".9" fill="#fff"/>
      <g class="a-blink" transform="scale(1 0)"><ellipse cx="59" cy="53" rx="4" ry="4.4" fill="${skin}"/></g>
      <path d="M54 46 l10 -2" stroke="#3b2a1a" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 44 q6 -20 24 -20 q18 0 24 20 q-24 -6 -48 0z" fill="#16161f"/><path d="M73 40 l11 3 l-8 7z" fill="#16161f"/>
      <circle cx="40" cy="32" r="1.6" fill="#e63946"/><circle cx="52" cy="29" r="1.6" fill="#e63946"/><circle cx="62" cy="33" r="1.6" fill="#e63946"/>`)}</g>`;
  }
  function captain() {  // le Capitaine : tricorne à tête de mort, grande barbe, épaulettes
    return `<path d="M14 100 q4 -20 36 -22 q32 2 36 22z" fill="#7a0f19" stroke="#3b0008" stroke-width="1.5"/>
      <path d="M18 92 h14 M68 92 h14" stroke="#ffc83d" stroke-width="5" stroke-linecap="round"/><circle cx="44" cy="92" r="2" fill="#ffc83d"/><circle cx="56" cy="92" r="2" fill="#ffc83d"/>
      <g class="a-bob">${face(`${eyes(55)}<path d="M37 49 l9 2.5 M63 49 l-9 2.5" stroke="#3b2a1a" stroke-width="3.2" stroke-linecap="round"/>
      <path d="M26 61 q2 31 24 31 q22 0 24 -31 q-8 10 -24 10 q-16 0 -24 -10z" fill="#1d1d2b" stroke="#000" stroke-width="2"/>
      <path d="M36 67 q14 -8 28 0 q-14 4 -28 0z" fill="#1d1d2b"/><path d="M44 74 q6 3 12 0" stroke="#e8b48a" stroke-width="2" fill="none"/>
      <path d="M40 78 q2 8 0 12 M50 80 v10 M60 78 q-2 8 0 12" stroke="#3a3a4e" stroke-width="1.5" fill="none"/>
      <path d="M8 41 q42 -15 84 0 q-6 -28 -42 -32 q-36 4 -42 32z" fill="#16161f" stroke="#ffc83d" stroke-width="3"/>
      <path d="M30 22 q10 -6 20 -6" stroke="#4a4a60" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="26" r="6.5" fill="#f4f1e6"/><circle cx="47.8" cy="25" r="1.6" fill="#16161f"/><circle cx="52.2" cy="25" r="1.6" fill="#16161f"/><path d="M42 34 l16 4 M58 34 l-16 4" stroke="#f4f1e6" stroke-width="2.2"/>
      <path d="M86 30 q8 -10 4 -20 q-6 8 -10 10" fill="#e63946" stroke="#7a0f19" stroke-width="1.5"/>`)}</g>`;
  }
  const CREW_ART = [deckhand, parrot, gunner, captain];
  function crewSVG(id, opts = {}) {
    const col = CREW_COLORS[id], g = gid('cr');
    const rays = Array.from({ length: 12 }, (_, i) => `<path d="M50 50 L${50 + Math.cos(i * Math.PI / 6) * 60} ${50 + Math.sin(i * Math.PI / 6) * 60} L${50 + Math.cos(i * Math.PI / 6 + .18) * 60} ${50 + Math.sin(i * Math.PI / 6 + .18) * 60}Z" fill="#fff" opacity=".07"/>`).join('');
    return svg(`<defs><radialGradient id="${g}" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="${col}"/><stop offset="1" stop-color="#0a1230"/></radialGradient>
      <linearGradient id="${g}r" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="${col}"/><stop offset="1" stop-color="#1a1030"/></linearGradient>
      <clipPath id="${g}c"><circle cx="50" cy="50" r="44"/></clipPath></defs>
      <circle cx="50" cy="50" r="48" fill="url(#${g}r)"/><circle cx="50" cy="50" r="44.5" fill="url(#${g})"/>
      <g clip-path="url(#${g}c)"><g class="a-rays">${rays}</g>${CREW_ART[id]()}</g>
      <circle cx="50" cy="50" r="44.5" fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.5"/>
      <path class="a-shine" d="M18 34 a36 36 0 0 1 22 -20" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".45"/>
      ${opts.mult ? `<g><rect x="54" y="68" width="44" height="28" rx="14" fill="#16161f" stroke="${col}" stroke-width="3"/><text x="76" y="89" font-family="Lilita One, sans-serif" font-size="20" text-anchor="middle" fill="#fff">x${opts.mult}</text></g>` : ''}`);
  }
  const LOW = { 4: skull, 5: anchor, 6: cannon, 7: spyglass, 8: barrel };
  function symSVG(code) {
    switch (code) {
      case '0': return chest(); case '1': return rum(); case '2': return map(); case '3': return compass();
      case 'W': return wild(); case 'S': return scatter();
      default: return LOW[+code]();
    }
  }
  root.JollyArt = { symSVG, crewSVG, CREW_COLORS };
})(typeof self !== 'undefined' ? self : this);
