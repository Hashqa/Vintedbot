/*
  Jolly Wilds — moteur de jeu.
  Grille 5 rouleaux × 4 rangées, 1024 façons de gagner (de gauche à droite, rouleaux voisins).
  Bonus : à chaque free spin, un personnage de l'équipage peut monter à bord. Il pose un wild sur les
  rouleaux 2 à 5, et ce wild RESTE EN PLACE jusqu'à la fin du bonus, avec le multiplicateur de ce
  personnage (x2 Matelot, x3 Perroquet, x4 Canonnier, x5 Capitaine). Les wilds s'accumulent spin après spin.

  Une partie complète est produite sous forme de liste d'événements (format « livre » Stake Engine).
  Plateau : 5 chaînes (une par rouleau, de haut en bas). Symboles : '0'..'8' normaux, 'W' wild simple,
  'S' Bonus, 'a'..'d' wild collant du personnage 0..3. Case = rouleau * 4 + rangée.
    reveal            { board, gameType, sticky:[[case,id,mult]] }       les wilds collants déjà posés y figurent
    crew              { id, mult, cells:[cases] }                       personnage du spin et ses nouveaux wilds
    duel              { a:[case,id,mult], b:[case,id,mult], winner, loser, result:[case,id,mult] }
                        deux wilds collants de personnages différents s'affrontent ; le perdant passe dans le camp du gagnant (personnage et multiplicateur)
    chest             { from, cell, mult }                               un Coffre s'ouvre : +1 au multiplicateur du wild collant « cell »
    flagCollect       { cells:[cases], meter, awarded, left }           jauge du pavillon (jeu de base) : les drapeaux Wild du spin sont ramassés dans la jauge ;
                        chaque fois qu'elle atteint 2, elle se vide et donne 2 spins gratuits (awarded). left : spins gratuits restants
    flagSpin          { number, left }                                    un spin gratuit du pavillon (suivi d'un reveal gameType 'flagspin', sans symbole Bonus)
                        La jauge ne dure que le temps de la mise : elle repart de zéro à chaque mise (jeu sans état).
    winInfo           { wins:[{ s, n, ways, f, b, w, c:[cases] }], spinWin, totalWin }
                        s symbole, n rouleaux, ways façons, f façons pondérées par les multiplicateurs, b gain par façon, w gain
    scatters          { count, cells }
    freeSpinTrigger   { count, scatters, crew:[ids possibles], sticky:[[case, id]] }   sticky : wilds posés d'office (Super bonus)
    freeSpin { number, left } · freeSpinRetrigger { added, left }
    freeSpinEnd       { total, played, maxed, topUp }   topUp : complément pour atteindre le gain minimum de 10 × la mise
    winCap { amount } · finalWin { amount }
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
  const CREW_CODES = 'abcd';                         // wild collant du personnage 0..3
  const isCrew = c => CREW_CODES.indexOf(c) >= 0;

  // Gains par façon, en centièmes de mise, pour 3, 4 et 5 rouleaux.
  // 0 Coffre · 1 Bouteille de rhum · 2 Carte · 3 Boussole · 4 Crâne et épées · 5 Ancre · 6 Canon · 7 Longue-vue · 8 Baril de rhum
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

  // L'équipage : multiplicateur de son wild collant et fréquence de passage (plus le multiplicateur est fort, plus il est rare).
  const CREW = [
    { id: 0, key: 'deckhand', mult: 2, weight: 50 },
    { id: 1, key: 'parrot',   mult: 3, weight: 28 },
    { id: 2, key: 'gunner',   mult: 4, weight: 15 },
    { id: 3, key: 'captain',  mult: 5, weight: 7 }
  ];

  const CONFIG = {
    REELS, ROWS, WILD, SCATTER, CREW_CODES, PAYTABLE, CREW,
    SYMBOL_WEIGHTS: [6, 7, 8, 9, 12, 12, 13, 13, 14],
    WILD_WEIGHT: 5,              // drapeau Wild, rouleaux 2 à 5, jeu de base uniquement
    SCATTER_WEIGHT: [2.05, 2.05, 2.05, 2.05, 2.05],
    FS_SCATTER_WEIGHT: 0.9,
    BOARD_CHANCE: 0.4,           // chance qu'un personnage monte à bord à chaque free spin
    DUEL_CHANCE: 0.3,            // chance d'un duel par free spin (s'il y a deux wilds collants de personnages différents)
    DUEL_FAVOURITE: 0.65,        // chance que le plus fort gagne le duel
    CHEST_CHANCE: 0.35,          // chance qu'un Coffre visible s'ouvre (s'il y a au moins un wild collant)
    MAX_STICKY_MULT: 10,         // plafond du multiplicateur d'un wild collant
    FLAG_METER: 2,               // drapeaux à ramasser pour remplir la jauge du pavillon
    FLAG_SPINS: 2,               // spins gratuits donnés par une jauge pleine
    FLAGSPIN_WILD_WEIGHT: 2.4,   // poids du drapeau Wild pendant un spin gratuit du pavillon
    HOT_CHANCE: 0.05,            // free spin « à l'abordage » : un symbole envahit les rouleaux
    HOT_BOOST: 30,
    FS_AWARD: { 3: 8, 4: 10, 5: 12 },
    RETRIGGER: 3,
    MIN_BONUS: 1000,             // un bonus rapporte au moins 10 × la mise (centièmes)
    MAX_WIN: 1000000,            // 10 000 × la mise (centièmes)
    MODES: {
      base:  { cost: 1,   label: 'Spin' },
      bonus: { cost: 100, label: 'Bonus', buy: true },
      superbonus: { cost: 150, label: 'Superbonus', buy: true, crewFrom: 2 }   // équipage d'élite seulement : Canonnier (x4) et Capitaine (x5)
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
          if (st !== undefined) { col.push(CREW_CODES[st.id]); continue; }
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

    // multAt(rouleau, rangée) : multiplicateur du wild collant de cette case (par défaut, celui de son personnage)
    const defaultMult = b => (r, y) => C.CREW[CREW_CODES.indexOf(b[r][y])].mult;
    // Gains « façons » : dans une façon, les multiplicateurs des wilds de l'équipage s'additionnent ;
    // une façon sans wild de l'équipage compte ×1.
    function evaluate(b, multAt) {
      multAt = multAt || defaultMult(b);
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
        const f = factor(b, sym, n, multAt);
        const pay = PAYTABLE[s][n - 3];
        const cells = [];
        for (let r = 0; r < n; r++) for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD || isCrew(c)) cells.push(r * ROWS + y); }
        wins.push({ s, n, ways, f, b: pay, w: pay * f, c: cells });
      }
      return wins;
    }
    // f = (façons sans wild de l'équipage) + (somme, sur les autres façons, de leurs multiplicateurs additionnés)
    function factor(b, sym, n, multAt) {
      let all = 1, plain = 1, sum = 0;
      for (let r = 0; r < n; r++) {
        let k = 0, kw = 0, mw = 0;
        for (let y = 0; y < ROWS; y++) { const c = b[r][y]; if (c === sym || c === WILD) k++; else if (isCrew(c)) { kw++; mw += multAt(r, y); } }
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
      const stickyList = () => [...o.sticky].sort((a, z) => a[0] - z[0]).map(([c, v]) => [c, v.id, v.m]);
      ev.push(Object.assign({ type: 'reveal', board: b.map(col => col.join('')), gameType: fs ? 'freegame' : 'basegame' }, fs ? { sticky: stickyList() } : {}));
      if (fs && (o.forceCrew != null || rnd() < C.BOARD_CHANCE)) {
        const p = o.forceCrew != null ? C.CREW[o.forceCrew] : pickCrew(M.crewFrom);
        const spots = freeCells(b);
        if (spots.length) {
          const c = spots[(rnd() * spots.length) | 0];
          b[(c / ROWS) | 0][c % ROWS] = CREW_CODES[p.id];
          o.sticky.set(c, { id: p.id, m: p.mult });
          ev.push({ type: 'crew', id: p.id, mult: p.mult, cells: [c] });
        }
      }
      // duel : deux wilds collants de personnages différents ; le perdant prend le personnage et le multiplicateur du gagnant
      if (fs && rnd() < C.DUEL_CHANCE) {
        const all = [...o.sticky].sort((a, z) => a[0] - z[0]), pairs = [];
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (all[i][1].id !== all[j][1].id) pairs.push([all[i], all[j]]);
        if (pairs.length) {
          const [A, B] = pairs[(rnd() * pairs.length) | 0];
          const [strong, weak] = A[1].m > B[1].m || (A[1].m === B[1].m && rnd() < .5) ? [A, B] : [B, A];
          const [win, lose] = rnd() < C.DUEL_FAVOURITE ? [strong, weak] : [weak, strong];
          const ev0 = { type: 'duel', a: [A[0], A[1].id, A[1].m], b: [B[0], B[1].id, B[1].m], winner: win[0], loser: lose[0] };
          o.sticky.set(lose[0], { id: win[1].id, m: win[1].m });
          b[(lose[0] / ROWS) | 0][lose[0] % ROWS] = CREW_CODES[win[1].id];
          ev0.result = [lose[0], win[1].id, win[1].m];
          ev.push(ev0);
        }
      }
      // coffre : un Coffre visible peut s'ouvrir et ajouter +1 au multiplicateur d'un wild collant
      if (fs && o.sticky.size) {
        const chests = []; for (let r = 0; r < REELS; r++) for (let y = 0; y < ROWS; y++) if (b[r][y] === '0') chests.push(r * ROWS + y);
        const room = [...o.sticky].filter(([, v]) => v.m < C.MAX_STICKY_MULT);
        if (chests.length && room.length && rnd() < C.CHEST_CHANCE) {
          const from = chests[(rnd() * chests.length) | 0], [c, v] = room[(rnd() * room.length) | 0];
          v.m += 1;
          ev.push({ type: 'chest', from, cell: c, mult: v.m });
        }
      }
      const wins = evaluate(b, fs ? (r, y) => o.sticky.get(r * ROWS + y).m : null);
      let win = wins.reduce((a, w) => a + w.w, 0);
      win = Math.floor(win / 10) * 10;
      let maxed = false;
      if (win >= o.capLeft) { win = o.capLeft; maxed = true; }
      if (wins.length) ev.push({ type: 'winInfo', wins, spinWin: win, totalWin: o.before + win });
      if (maxed) ev.push({ type: 'winCap', amount: o.before + win });
      const scCells = [];
      for (let r = 0; r < REELS; r++) for (let y = 0; y < ROWS; y++) if (b[r][y] === SCATTER) scCells.push(r * ROWS + y);
      if (!maxed && scCells.length >= 3) ev.push({ type: 'scatters', count: scCells.length, cells: scCells });
      return { win, maxed, sc: scCells.length, board: b };
    }
    const fsFor = n => C.FS_AWARD[Math.min(n, 5)] || 0;

    // Jauge du pavillon (jeu de base) : les drapeaux Wild de chaque spin sont ramassés ; 2 drapeaux = 2 spins gratuits,
    // joués tout de suite dans la même mise (sans symbole Bonus). Ce qui reste dans la jauge à la fin de la mise est perdu.
    function flagSpins(ev, b0, capLeft, before) {
      const flags = b => { const out = []; for (let r = 1; r < REELS; r++) for (let y = 0; y < ROWS; y++) if (b[r][y] === WILD) out.push(r * ROWS + y); return out; };
      let meter = 0, left = 0, total = 0, played = 0;
      const collect = cells => {
        if (!cells.length) return;
        meter += cells.length;
        const full = Math.floor(meter / C.FLAG_METER), awarded = full * C.FLAG_SPINS;
        meter -= full * C.FLAG_METER; left += awarded;
        ev.push({ type: 'flagCollect', cells, meter, awarded, left });
      };
      collect(flags(b0));
      while (left > 0) {
        left--; played++;
        ev.push({ type: 'flagSpin', number: played, left });
        const b = [];
        for (let r = 0; r < REELS; r++) {
          const w = weightsFor(r, false, -1).filter(([s]) => s !== SCATTER).map(([s, x]) => [s, s === WILD ? C.FLAGSPIN_WILD_WEIGHT : x]), col = [];
          for (let y = 0; y < ROWS; y++) col.push(pickFrom(w));
          b.push(col);
        }
        ev.push({ type: 'reveal', board: b.map(col => col.join('')), gameType: 'flagspin' });
        const wins = evaluate(b);
        let win = Math.floor(wins.reduce((a, w) => a + w.w, 0) / 10) * 10, maxed = false;
        if (win >= capLeft - total) { win = capLeft - total; maxed = true; }
        total += win;
        if (wins.length) ev.push({ type: 'winInfo', wins, spinWin: win, totalWin: before + total });
        if (maxed) { ev.push({ type: 'winCap', amount: before + total }); return { win: total, maxed: true }; }
        collect(flags(b));
      }
      return { win: total, maxed: false };
    }

    function freeSpins(ev, count, sc, M, capLeft, before, o) {
      const sticky = new Map();
      if (M.startWilds) {
        const all = []; for (let r = 1; r < REELS; r++) for (let y = 0; y < ROWS; y++) all.push(r * ROWS + y);
        for (let k = 0; k < M.startWilds; k++) { const c = all.splice((rnd() * all.length) | 0, 1)[0], p = pickCrew(M.crewFrom); sticky.set(c, { id: p.id, m: p.mult }); }
      }
      ev.push({ type: 'freeSpinTrigger', count, scatters: sc, crew: C.CREW.slice(M.crewFrom || 0).map(p => p.id), sticky: [...sticky].sort((a, z) => a[0] - z[0]).map(([c, v]) => [c, v.id, v.m]) });
      let left = count, total = 0, played = 0, maxed = false;
      while (left > 0) {
        left--; played++;
        ev.push({ type: 'freeSpin', number: played, left });
        const r = spin(ev, true, M, { capLeft: capLeft - total, before: before + total, forceHot: o.forceHot, forceCrew: o.forceCrew, sticky });
        total += r.win;
        if (r.maxed) { maxed = true; break; }
        if (r.sc >= 3) { left += C.RETRIGGER; ev.push({ type: 'freeSpinRetrigger', added: C.RETRIGGER, left }); }
      }
      let topUp = 0;                                   // gain minimum du bonus : complété si besoin
      if (!maxed && total + before < C.MIN_BONUS) { topUp = Math.min(C.MIN_BONUS - before, capLeft) - total; total += topUp; }
      ev.push({ type: 'freeSpinEnd', total, played, maxed, topUp });
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
      if (!first.maxed && !M.buy) {
        const rs = flagSpins(ev, first.board, cap - total, total);
        total += rs.win; base += rs.win; if (rs.maxed) first.maxed = true;
      }
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
