/*
  Jolly Wilds — moteur de jeu.
  Grille 5 rouleaux × 4 rangées, 1024 façons de gagner (de gauche à droite, rouleaux voisins).
  Bonus : à chaque free spin, un personnage de l'équipage monte à bord. Il pose ses wilds sur les
  rouleaux 2 à 5, et chaque wild porte le multiplicateur de ce personnage (x2 pour le Mousse … x100 pour le Kraken).

  Une partie complète est produite sous forme de liste d'événements (format « livre » Stake Engine).
  Plateau : 5 chaînes (une par rouleau, de haut en bas). Symboles : '0'..'8' normaux, 'W' wild simple,
  'S' Bonus, 'X' wild de personnage. Case = rouleau * 4 + rangée.
    reveal            { board, gameType }
    crew              { id, mult, cells:[cases] }                       personnage du spin et ses wilds (free spins)
    winInfo           { wins:[{ s, n, ways, f, b, w, c:[cases] }], spinWin, totalWin }
                        s symbole, n rouleaux, ways façons, f somme des multiplicateurs, b gain par façon, w gain
    scatters          { count, cells }
    freeSpinTrigger   { count, scatters, crew:[ids possibles] } · freeSpin { number, left } · freeSpinRetrigger { added, left }
    freeSpinEnd       { total, played, maxed } · winCap { amount } · finalWin { amount }
  Tous les montants sont en centièmes de mise (100 = 1 × la mise). Chaque gain de spin est arrondi
  à la dizaine inférieure : les paiements sont donc des multiples de 0,1 × la mise, comme l'exige Stake Engine.
  Utilisé par le générateur des fichiers mathématiques (Node) et par le front-end en démo.
*/
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.JollyEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const REELS = 5, ROWS = 4, WILD = 'W', SCATTER = 'S', CREW_WILD = 'X';

  // Gains par façon, en centièmes de mise, pour 3, 4 et 5 rouleaux.
  // 0 Coffre · 1 Rhum · 2 Carte · 3 Boussole · 4 A · 5 K · 6 Q · 7 J · 8 10
  const PAYTABLE = [
    [25, 100, 250],
    [20, 60, 150],
    [15, 40, 100],
    [10, 30, 75],
    [5, 15, 40],
    [5, 15, 30],
    [4, 10, 25],
    [4, 10, 20],
    [3, 8, 20]
  ];

  // L'équipage : chaque personnage a son multiplicateur, son nombre de wilds et sa fréquence.
  const CREW = [
    { id: 0, key: 'cabin',   mult: 2,   wilds: [2, 3, 3, 4], weight: 380 },
    { id: 1, key: 'parrot',  mult: 3,   wilds: [2, 2, 3],    weight: 260 },
    { id: 2, key: 'cook',    mult: 5,   wilds: [1, 2, 2, 3], weight: 180 },
    { id: 3, key: 'gunner',  mult: 10,  wilds: [1, 2, 2],    weight: 110 },
    { id: 4, key: 'captain', mult: 25,  wilds: [1, 1, 2],    weight: 45 },
    { id: 5, key: 'kraken',  mult: 100, wilds: [1, 1, 2],    weight: 10 }
  ];

  const CONFIG = {
    REELS, ROWS, WILD, SCATTER, CREW_WILD, PAYTABLE, CREW,
    SYMBOL_WEIGHTS: [6, 7, 8, 9, 12, 12, 13, 13, 14],
    WILD_WEIGHT: 7.5,            // wild simple, rouleaux 2 à 5, jeu de base uniquement
    SCATTER_WEIGHT: [1.9, 1.9, 1.9, 1.9, 1.9],
    FS_SCATTER_WEIGHT: 0.9,
    HOT_CHANCE: 0.05,            // free spin « à l'abordage » : un symbole envahit les rouleaux
    HOT_BOOST: 30,
    FS_AWARD: { 3: 10, 4: 12, 5: 15 },
    RETRIGGER: 5,
    MAX_WIN: 1000000,            // 10 000 × la mise (centièmes)
    MODES: {
      base:  { cost: 1,   label: 'Spin' },
      bonus: { cost: 100, label: 'Bonus', buy: true },
      super: { cost: 400, label: 'Super bonus', buy: true, crewFrom: 2, extraWilds: 1 }   // équipage d'élite : Cuistot (x5) et plus forts, un wild de plus chacun
    }
  };

  function defaultRng() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
    return Math.random();
  }

  function create(opts = {}) {
    const C = Object.assign({}, CONFIG, opts.config || {});
    const rnd = opts.rng || defaultRng;

    function weightsFor(reel, fs, hotSym) {
      const w = C.SYMBOL_WEIGHTS.map((x, i) => [String(i), x + (i === hotSym ? C.HOT_BOOST : 0)]);
      if (!fs && reel > 0) w.push([WILD, C.WILD_WEIGHT]);
      w.push([SCATTER, fs ? C.FS_SCATTER_WEIGHT : C.SCATTER_WEIGHT[reel]]);
      return w;
    }
    function pickFrom(w) { let t = 0; for (const [, x] of w) t += x; let x = rnd() * t; for (const [s, v] of w) { x -= v; if (x < 0) return s; } return w[0][0]; }

    // Plateau : board[rouleau][rangée]. Au plus un Bonus par rouleau.
    function randomBoard(fs, hotSym, forceScatters) {
      const b = [];
      for (let r = 0; r < REELS; r++) {
        const w = weightsFor(r, fs, hotSym), col = [];
        for (let y = 0; y < ROWS; y++) {
          let s = pickFrom(w);
          if (s === SCATTER && col.includes(SCATTER)) { do { s = pickFrom(w); } while (s === SCATTER); }
          col.push(s);
        }
        b.push(col);
      }
      if (forceScatters) {
        let have = b.filter(col => col.includes(SCATTER)).length;
        const order = [...Array(REELS).keys()].sort(() => rnd() - .5);
        for (const r of order) { if (have >= forceScatters) break; if (b[r].includes(SCATTER)) continue; b[r][(rnd() * ROWS) | 0] = SCATTER; have++; }
      }
      return b;
    }

    // Gains « façons » avec multiplicateurs : dans une façon, les multiplicateurs des wilds de personnage
    // s'additionnent ; une façon sans wild de personnage compte ×1.
    function evaluate(b, crewMult) {
      const wins = [];
      for (let s = 0; s < PAYTABLE.length; s++) {
        const sym = String(s);
        let ways = 1, n = 0;
        for (let r = 0; r < REELS; r++) {
          let k = 0;
          for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD || c === CREW_WILD) k++; }
          if (!k) break;
          ways *= k; n++;
        }
        if (n < 3) continue;
        const f = factor(b, sym, n, crewMult);
        const pay = PAYTABLE[s][n - 3];
        const cells = [];
        for (let r = 0; r < n; r++) for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD || c === CREW_WILD) cells.push(r * ROWS + y); }
        wins.push({ s, n, ways, f, b: pay, w: pay * f, c: cells });
      }
      return wins;
    }
    // f = (façons sans wild de personnage) + (somme des multiplicateurs des façons qui en ont)
    function factor(b, sym, n, m) {
      let all = 1, plain = 1, sum = 0;   // sum : somme des multiplicateurs (additionnés) sur toutes les façons
      for (let r = 0; r < n; r++) {
        let k = 0, kw = 0;
        for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD) k++; else if (c === CREW_WILD) kw++; }
        sum = sum * (k + kw) + all * kw * m;
        all *= (k + kw); plain *= k;
      }
      return plain + sum;
    }

    function pickCrew(from) {
      const list = C.CREW.slice(from || 0); let t = 0; for (const p of list) t += p.weight;
      let x = rnd() * t; for (const p of list) { x -= p.weight; if (x < 0) return p; } return list[0];
    }

    // Un spin. Ajoute les événements, renvoie le gain (centièmes, multiple de 10).
    function spin(ev, fs, M, o) {
      const hot = fs && (o.forceHot || rnd() < C.HOT_CHANCE) ? (o.forceHot ? (rnd() * 4) | 0 : (rnd() * 9) | 0) : -1;
      const b = randomBoard(fs, hot, o.forceScatters || 0);
      ev.push({ type: 'reveal', board: b.map(col => col.join('')), gameType: fs ? 'freegame' : 'basegame' });
      let mult = 0;
      if (fs) {
        const p = o.forceCrew != null ? C.CREW[o.forceCrew] : pickCrew(M.crewFrom);
        const k = p.wilds[(rnd() * p.wilds.length) | 0] + (M.extraWilds || 0), spots = [];
        for (let r = 1; r < REELS; r++) for (let y = 0; y < ROWS; y++) if (b[r][y] !== SCATTER) spots.push(r * ROWS + y);
        const cells = [];
        for (let i = 0; i < k && spots.length; i++) cells.push(spots.splice((rnd() * spots.length) | 0, 1)[0]);
        cells.sort((a, z) => a - z);
        for (const c of cells) b[(c / ROWS) | 0][c % ROWS] = CREW_WILD;
        mult = p.mult;
        ev.push({ type: 'crew', id: p.id, mult, cells });
      }
      const wins = evaluate(b, mult);
      let win = wins.reduce((a, w) => a + w.w, 0);
      win = Math.floor(win / 10) * 10;
      let maxed = false;
      if (win >= o.capLeft) { win = o.capLeft; maxed = true; }
      if (wins.length) ev.push({ type: 'winInfo', wins, spinWin: win, totalWin: o.before + win });
      if (maxed) ev.push({ type: 'winCap', amount: o.before + win });
      const scCells = [];
      for (let r = 0; r < REELS; r++) for (let y = 0; y < ROWS; y++) if (b[r][y] === SCATTER) scCells.push(r * ROWS + y);
      if (!maxed && scCells.length >= 3) ev.push({ type: 'scatters', count: scCells.length, cells: scCells });
      return { win, maxed, sc: scCells.length };
    }
    const fsFor = n => C.FS_AWARD[Math.min(n, 5)] || 0;

    function freeSpins(ev, count, sc, M, capLeft, before, o) {
      ev.push({ type: 'freeSpinTrigger', count, scatters: sc, crew: C.CREW.slice(M.crewFrom || 0).map(p => p.id) });
      let left = count, total = 0, played = 0, maxed = false;
      while (left > 0) {
        left--; played++;
        ev.push({ type: 'freeSpin', number: played, left });
        const r = spin(ev, true, M, { capLeft: capLeft - total, before: before + total, forceHot: o.forceHot, forceCrew: o.forceCrew });
        total += r.win;
        if (r.maxed) { maxed = true; break; }
        if (r.sc >= 3) { left += C.RETRIGGER; ev.push({ type: 'freeSpinRetrigger', added: C.RETRIGGER, left }); }
      }
      ev.push({ type: 'freeSpinEnd', total, played, maxed });
      return { total, maxed };
    }

    // Une partie complète dans un mode donné.
    //   o.forceTrigger : nombre de Bonus imposés au premier spin · o.forceHot / o.forceCrew : pour les livres « gain max »
    function playRound(mode = 'base', o = {}) {
      const M = C.MODES[mode]; if (!M) throw new Error('mode inconnu: ' + mode);
      const ev = [], cap = C.MAX_WIN;
      let total = 0, base = 0, free = 0;
      const force = M.buy ? (rnd() < .1 ? 4 : 3) : (o.forceTrigger || 0);
      const first = spin(ev, false, M, { capLeft: cap, before: 0, forceScatters: force });
      total += first.win; base += first.win;
      if (!first.maxed && (M.buy || first.sc >= 3)) {
        const sc = Math.max(3, first.sc);
        const fs = freeSpins(ev, fsFor(sc), sc, M, cap - total, total, o);
        total += fs.total; free += fs.total;
      }
      if (total > cap) total = cap;
      ev.push({ type: 'finalWin', amount: total });
      ev.forEach((e, i) => e.index = i);
      return {
        payoutMultiplier: total,               // centièmes (format Stake), multiple de 10
        payoutX: total / 100,                  // en × mise
        events: ev,
        criteria: total >= cap ? 'wincap' : (free > 0 || M.buy) ? 'freegame' : total > 0 ? 'basegame' : '0',
        baseGameWins: base / 100, freeGameWins: free / 100
      };
    }
    return { playRound, evaluate, factor, config: C };
  }

  return { create, CONFIG };
});
