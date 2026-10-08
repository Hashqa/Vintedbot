/*
  Simulateur Jolly Wilds : mesure le retour au joueur, la fréquence du bonus et la part de chaque personnage.
  Usage : node tools/simulate.js [base=200000] [achats=3000]
  Vérifie aussi le calcul des gains « façons » par force brute sur 2 000 plateaux.
*/
const Engine = require('../frontend/engine.js');
const eng = Engine.create({ rng: Math.random });
const C = Engine.CONFIG;

// contrôle par force brute : chaque façon = un choix de case par rouleau
(function check() {
  // plateaux au hasard avec des wilds collants de multiplicateurs quelconques (x1 à x10) : calcul direct contre force brute
  const syms = ['0', '1', '4', 'W', 'a', 'b', 'd', 'S'];
  for (let t = 0; t < 3000; t++) {
    const b = Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, () => { const s = syms[(Math.random() * syms.length) | 0]; return r === 0 && (s === 'W' || 'abcd'.includes(s)) ? '0' : s; }));
    const M = Array.from({ length: 20 }, () => 1 + ((Math.random() * 10) | 0)), mult = (r, y) => M[r * 4 + y];
    for (const w of eng.evaluate(b, mult)) {
      const sym = String(w.s); let f = 0;
      const rec = (r, sum) => { if (r === w.n) { f += sum || 1; return; } for (let y = 0; y < 4; y++) { const c = b[r][y]; if (c === sym || c === 'W') rec(r + 1, sum); else if ('abcd'.includes(c)) rec(r + 1, sum + mult(r, y)); } };
      rec(0, 0);
      if (f !== w.f) throw new Error('façons : ' + f + ' ≠ ' + w.f + ' ' + JSON.stringify(b));
    }
  }
  console.log('calcul des façons : OK (3 000 plateaux, multiplicateurs x1 à x10)');
})();

const N = +(process.argv[2] || 200000), B = +(process.argv[3] || 3000);
let paid = 0, trig = 0, hit = 0, maxX = 0, fsPaid = 0;
for (let i = 0; i < N; i++) {
  const r = eng.playRound('base'); paid += r.payoutX; if (r.payoutX > 0) hit++; if (r.freeGameWins > 0 || r.events.some(e => e.type === 'freeSpinTrigger')) { trig++; fsPaid += r.freeGameWins; } if (r.payoutX > maxX) maxX = r.payoutX;
}
console.log(`base : RTP ${(paid / N * 100).toFixed(2)} %  (bonus ${(fsPaid / N * 100).toFixed(2)} %)  bonus 1 sur ${(N / trig).toFixed(0)}  touche ${(hit / N * 100).toFixed(1)} %  max ${maxX}×`);
for (const mode of ['bonus', 'superbonus']) {
  const cost = C.MODES[mode].cost; let s = 0, mx = 0, under = 0; const crew = Array(6).fill(0);
  for (let i = 0; i < B; i++) {
    const r = eng.playRound(mode); s += r.payoutX; if (r.payoutX > mx) mx = r.payoutX; if (r.payoutX < cost) under++;
    for (const e of r.events) { if (e.type === 'crew') crew[e.id]++; if (e.type === 'duel') crew[4] = (crew[4] || 0) + 1; if (e.type === 'chest') crew[5] = (crew[5] || 0) + 1; }
  }
  console.log(`${mode} (${cost}×) : RTP ${(s / B / cost * 100).toFixed(2)} %  moyenne ${(s / B).toFixed(1)}×  max ${mx}×  sous la mise ${(under / B * 100).toFixed(0)} %  wilds collants par bonus : ${((crew[0] + crew[1] + crew[2] + crew[3]) / B).toFixed(1)}  duels ${((crew[4] || 0) / B).toFixed(2)}  coffres ${((crew[5] || 0) / B).toFixed(2)}`);
}
