/*
  Jolly Wilds — moteur de jeu.
  Grille 5 rouleaux × 4 rangées, 1024 façons de gagner (de gauche à droite, rouleaux voisins).
  Bonus : à chaque free spin, un personnage de l'équipage peut monter à bord. Il pose un wild sur les
  rouleaux 2 à 5, et ce wild RESTE EN PLACE jusqu'à la fin du bonus, avec le multiplicateur de ce
  personnage (x2 pour le Matelot … x100 pour le Kraken). Les wilds s'accumulent spin après spin.

  Une partie complète est produite sous forme de liste d'événements (format « livre » Stake Engine).
  Plateau : 5 chaînes (une par rouleau, de haut en bas). Symboles : '0'..'8' normaux, 'W' wild simple,
  'S' Bonus, 'a'..'f' wild collant du personnage 0..5. Case = rouleau * 4 + rangée.
    reveal            { board, gameType }                                les wilds collants déjà posés y figurent
    crew              { id, mult, cells:[cases] }                       personnage du spin et ses nouveaux wilds
    winInfo           { wins:[{ s, n, ways, f, b, w, c:[cases] }], spinWin, totalWin }
                        s symbole, n rouleaux, ways façons, f façons pondérées par les multiplicateurs, b gain par façon, w gain
    scatters          { count, cells }
    freeSpinTrigger   { count, scatters, crew:[ids possibles], sticky:[[case, id]] }   sticky : wilds posés d'office (Super bonus)
    freeSpin { number, left } · freeSpinRetrigger { added, left }
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

  const REELS = 5, ROWS = 4, WILD = 'W', SCATTER = 'S';
  const CREW_CODES = 'abcdef';                       // wild collant du personnage 0..5
  const isCrew = c => CREW_CODES.indexOf(c) >= 0;

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

  // L'équipage : multiplicateur de ses wilds et fréquence de passage.
  const CREW = [
    { id: 0, key: 'deckhand', mult: 2,   weight: 380 },
    { id: 1, key: 'parrot',   mult: 3,   weight: 260 },
    { id: 2, key: 'cook',     mult: 5,   weight: 180 },
    { id: 3, key: 'gunner',   mult: 10,  weight: 110 },
    { id: 4, key: 'captain',  mult: 25,  weight: 45 },
    { id: 5, key: 'kraken',   mult: 100, weight: 10 }
  ];

  const CONFIG = {
    REELS, ROWS, WILD, SCATTER, CREW_CODES, PAYTABLE, CREW,
    SYMBOL_WEIGHTS: [6, 7, 8, 9, 12, 12, 13, 13, 14],
    WILD_WEIGHT: 7.5,            // wild simple, rouleaux 2 à 5, jeu de base uniquement
    SCATTER_WEIGHT: [2.05, 2.05, 2.05, 2.05, 2.05],
    FS_SCATTER_WEIGHT: 0.9,
    BOARD_CHANCE: 0.3,           // chance qu'un personnage monte à bord à chaque free spin
    HOT_CHANCE: 0.05,            // free spin « à l'abordage » : un symbole envahit les rouleaux
    HOT_BOOST: 30,
    FS_AWARD: { 3: 8, 4: 10, 5: 12 },
    RETRIGGER: 3,
    MAX_WIN: 1000000,            // 10 000 × la mise (centièmes)
    MODES: {
      base:  { cost: 1,   label: 'Spin' },
      bonus: { cost: 100, label: 'Bonus', buy: true },
      super: { cost: 200, label: 'Super bonus', buy: true, crewFrom: 2 }   // équipage d'élite seulement : Cuistot (x5) et plus forts
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

    // Plateau : board[rouleau][rangée]. Au plus un Bonus par rouleau. sticky : Map case → id du personnage.
    function randomBoard(fs, hotSym, forceScatters, sticky) {
      const b = [];
      for (let r = 0; r < REELS; r++) {
        const w = weightsFor(r, fs, hotSym), col = [];
        for (let y = 0; y < ROWS; y++) {
          const st = sticky && sticky.get(r * ROWS + y);
          if (st !== undefined) { col.push(CREW_CODES[st]); continue; }
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

    const multOf = c => C.CREW[CREW_CODES.indexOf(c)].mult;
    // Gains « façons » : dans une façon, les multiplicateurs des wilds de l'équipage s'additionnent ;
    // une façon sans wild de l'équipage compte ×1.
    function evaluate(b) {
      const wins = [];
      for (let s = 0; s < PAYTABLE.length; s++) {
        const sym = String(s);
        let ways = 1, n = 0;
        for (let r = 0; r < REELS; r++) {
          let k = 0;
          for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD || isCrew(c)) k++; }
          if (!k) break;
          ways *= k; n++;
        }
        if (n < 3) continue;
        const f = factor(b, sym, n);
        const pay = PAYTABLE[s][n - 3];
        const cells = [];
        for (let r = 0; r < n; r++) for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD || isCrew(c)) cells.push(r * ROWS + y); }
        wins.push({ s, n, ways, f, b: pay, w: pay * f, c: cells });
      }
      return wins;
    }
    // f = (façons sans wild de l'équipage) + (somme, sur les autres façons, de leurs multiplicateurs additionnés)
    function factor(b, sym, n) {
      let all = 1, plain = 1, sum = 0;
      for (let r = 0; r < n; r++) {
        let k = 0, kw = 0, mw = 0;
        for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD) k++; else if (isCrew(c)) { kw++; mw += multOf(c); } }
        sum = sum * (k + kw) + all * mw;
        all *= (k + kw); plain *= k;
      }
      return plain + sum;
    }

    function pickCrew(from) {
      const list = C.CREW.slice(from || 0); let t = 0; for (const p of list) t += p.weight;
      let x = rnd() * t; for (const p of list) { x -= p.weight; if (x < 0) return p; } return list[0];
    }
    function freeCells(b) { const out = []; for (let r = 1; r < REELS; r++) for (let y = 0; y < ROWS; y++) if (b[r][y] !== SCATTER && !isCrew(b[r][y])) out.push(r * ROWS + y); return out; }

    // Un spin. Ajoute les événements, renvoie le gain (centièmes, multiple de 10).
    function spin(ev, fs, M, o) {
      const hot = fs && (o.forceHot || rnd() < C.HOT_CHANCE) ? (o.forceHot ? (rnd() * 4) | 0 : (rnd() * 9) | 0) : -1;
      const b = randomBoard(fs, hot, o.forceScatters || 0, o.sticky);
      ev.push({ type: 'reveal', board: b.map(col => col.join('')), gameType: fs ? 'freegame' : 'basegame' });
      if (fs && (o.forceCrew != null || rnd() < C.BOARD_CHANCE)) {
        const p = o.forceCrew != null ? C.CREW[o.forceCrew] : pickCrew(M.crewFrom);
        const spots = freeCells(b);
        if (spots.length) {
          const c = spots[(rnd() * spots.length) | 0];
          b[(c / ROWS) | 0][c % ROWS] = CREW_CODES[p.id];
          o.sticky.set(c, p.id);
          ev.push({ type: 'crew', id: p.id, mult: p.mult, cells: [c] });
        }
      }
      const wins = evaluate(b);
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
      const sticky = new Map();
      if (M.startWilds) {
        const all = []; for (let r = 1; r < REELS; r++) for (let y = 0; y < ROWS; y++) all.push(r * ROWS + y);
        for (let k = 0; k < M.startWilds; k++) { const c = all.splice((rnd() * all.length) | 0, 1)[0]; sticky.set(c, pickCrew(M.crewFrom).id); }
      }
      ev.push({ type: 'freeSpinTrigger', count, scatters: sc, crew: C.CREW.slice(M.crewFrom || 0).map(p => p.id), sticky: [...sticky].sort((a, z) => a[0] - z[0]) });
      let left = count, total = 0, played = 0, maxed = false;
      while (left > 0) {
        left--; played++;
        ev.push({ type: 'freeSpin', number: played, left });
        const r = spin(ev, true, M, { capLeft: capLeft - total, before: before + total, forceHot: o.forceHot, forceCrew: o.forceCrew, sticky });
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
