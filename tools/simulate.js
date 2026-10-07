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
  const syms = ['0', '1', '4', 'W', 'X', 'S'];
  for (let t = 0; t < 2000; t++) {
    const b = Array.from({ length: 5 }, (_, r) => Array.from({ length: 4 }, () => { const s = syms[(Math.random() * syms.length) | 0]; return r === 0 && (s === 'W' || s === 'X') ? '0' : s; }));
    const m = [2, 5, 100][t % 3];
    for (const w of eng.evaluate(b, m)) {
      const sym = String(w.s); let f = 0;
      const rec = (r, sum) => { if (r === w.n) { f += sum || 1; return; } for (let y = 0; y < 4; y++) { const c = b[r][y]; if (c === sym || c === 'W') rec(r + 1, sum); else if (c === 'X') rec(r + 1, sum + m); } };
      rec(0, 0);
      if (f !== w.f) throw new Error('façons : ' + f + ' ≠ ' + w.f + ' ' + JSON.stringify(b));
    }
  }
  console.log('calcul des façons : OK (2 000 plateaux)');
})();

const N = +(process.argv[2] || 200000), B = +(process.argv[3] || 3000);
let paid = 0, trig = 0, hit = 0, maxX = 0, fsPaid = 0;
for (let i = 0; i < N; i++) {
  const r = eng.playRound('base'); paid += r.payoutX; if (r.payoutX > 0) hit++; if (r.freeGameWins > 0 || r.events.some(e => e.type === 'freeSpinTrigger')) { trig++; fsPaid += r.freeGameWins; } if (r.payoutX > maxX) maxX = r.payoutX;
}
console.log(`base : RTP ${(paid / N * 100).toFixed(2)} %  (bonus ${(fsPaid / N * 100).toFixed(2)} %)  bonus 1 sur ${(N / trig).toFixed(0)}  touche ${(hit / N * 100).toFixed(1)} %  max ${maxX}×`);
for (const mode of ['bonus', 'super']) {
  const cost = C.MODES[mode].cost; let s = 0, mx = 0, under = 0; const crew = Array(6).fill(0);
  for (let i = 0; i < B; i++) {
    const r = eng.playRound(mode); s += r.payoutX; if (r.payoutX > mx) mx = r.payoutX; if (r.payoutX < cost) under++;
    let cur = -1; for (const e of r.events) { if (e.type === 'crew') cur = e.id; if (e.type === 'winInfo' && cur >= 0) crew[cur] += e.spinWin / 100; }
  }
  console.log(`${mode} (${cost}×) : RTP ${(s / B / cost * 100).toFixed(2)} %  moyenne ${(s / B).toFixed(1)}×  max ${mx}×  sous la mise ${(under / B * 100).toFixed(0)} %  part des gains par personnage : ${crew.map((x, i) => C.CREW[i].key + ' ' + (x / s * 100).toFixed(0) + '%').join(' ')}`);
}
