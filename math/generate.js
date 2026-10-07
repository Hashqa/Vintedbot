/*
  Génère les fichiers mathématiques Stake Engine de Jolly Wilds :
    publish/index.json
    publish/books_<mode>.jsonl.zst       parties pré-calculées (une par ligne, compressées zstd)
    publish/lookUpTable_<mode>_0.csv     "id,poids,paiement" (paiement en centièmes, identique aux livres)
  puis vérifie les règles de format et affiche les statistiques de chaque mode.

  Usage : node math/generate.js [base=100000] [bonus=20000] [super=20000]
*/
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const Engine = require('../frontend/engine.js');

const OUT = path.join(__dirname, 'publish');
const TARGET_RTP = 0.962;                 // limite Stake : 0,967 ; écart max entre modes : 0,05
const CAP_COUNT = 40;                     // livres "gain max" fournis par mode
const CAP_PROB = { base: 1 / 5e6, bonus: 1 / 40000, super: 1 / 12000 };   // probabilité d'atteindre le gain max
const COUNTS = { base: +(process.argv[2] || 1e5), bonus: +(process.argv[3] || 2e4), super: +(process.argv[4] || 2e4) };

// aléatoire cryptographique, lu par blocs pour la vitesse
let pool = Buffer.alloc(0), pos = 0;
const rng = () => { if (pos + 6 > pool.length) { pool = crypto.randomBytes(1 << 16); pos = 0; } const v = pool.readUIntBE(pos, 6); pos += 6; return v / 281474976710656; };
const eng = Engine.create({ rng });

function writeBooks(file, rounds) {
  return new Promise((res, rej) => {
    const z = zlib.createZstdCompress({ params: { [zlib.constants.ZSTD_c_compressionLevel]: 12 } });
    const out = fs.createWriteStream(file); z.pipe(out); out.on('finish', res); out.on('error', rej);
    let i = 0;
    (function pump() {
      while (i < rounds.length) {
        const r = rounds[i];
        const line = JSON.stringify({ id: i + 1, payoutMultiplier: r.payoutMultiplier, events: r.events, criteria: r.criteria, baseGameWins: r.baseGameWins, freeGameWins: r.freeGameWins }) + '\n';
        i++;
        if (!z.write(line)) { z.once('drain', pump); return; }
      }
      z.end();
    })();
  });
}

// Poids. Groupes selon le paiement x (en × mise) :
//   L : x < coût (perdants)        → facteur a, ajusté pour viser TARGET_RTP exactement
//   M : coût ≤ x < 40 × coût        → facteur 1   (H est prioritaire : x ≥ 10 000 va toujours dans H)
//   T : 40 × coût ≤ x < 10 000      → facteur t   (limite Stake etl40b ≤ 0,9)
//   H : 10 000 ≤ x < gain max       → facteur h   (limite Stake etl10k ≤ 0,8)
//   CAP : gain max                  → probabilité fixée
const ETL40_TARGET = 0.75, ETL10K_TARGET = 0.6, CAP_ETL_SHARE = 0.15;
function computeWeights(rounds, cost, capProbWanted) {
  const U = 1e6, CAPX = Engine.CONFIG.MAX_WIN / 100;
  const capProb = Math.min(capProbWanted, CAP_ETL_SHARE / CAPX);
  const grp = r => r.criteria === 'wincap' ? 'C' : r.payoutX >= 10000 ? 'H' : r.payoutX < cost ? 'L' : r.payoutX < 40 * cost ? 'M' : 'T';
  const G = { L: [0, 0], M: [0, 0], T: [0, 0], H: [0, 0], C: [0, 0] };   // [nombre, somme des paiements]
  for (const r of rounds) { const g = G[grp(r)]; g[0]++; g[1] += r.payoutX; }
  const f = { L: 1, M: 1, T: 1, H: 1 };
  const evalW = () => {
    let W = 0, P = 0; for (const k of 'LMTH') { W += f[k] * U * G[k][0]; P += f[k] * U * G[k][1]; }
    const capW = capProb * W / (1 - capProb); W += capW; P += capW * CAPX;
    const etl10k = (f.H * U * G.H[1] + capW * CAPX) / W, etl40 = (f.T * U * G.T[1] + f.H * U * G.H[1] + capW * CAPX) / W;
    return { rtp: P / W / cost, etl40, etl10k };
  };
  const solveA = () => { let lo = 1e-3, hi = 1e3; for (let k = 0; k < 100; k++) { f.L = Math.sqrt(lo * hi); if (evalW().rtp > TARGET_RTP) lo = f.L; else hi = f.L; } f.L = Math.sqrt(lo * hi); };
  for (let it = 0; it < 60; it++) {
    solveA(); const e = evalW();
    if (G.H[0] && e.etl10k > ETL10K_TARGET) { f.H *= ETL10K_TARGET / e.etl10k * 0.98; continue; }
    if ((G.T[0] || G.H[0]) && e.etl40 > ETL40_TARGET) { const k = ETL40_TARGET / e.etl40 * 0.98; f.T *= k; f.H *= k; continue; }
    break;
  }
  solveA();
  let W = 0; for (const k of 'LMTH') W += f[k] * U * G[k][0];
  const capEach = G.C[0] ? Math.max(1, Math.round(capProb * W / (1 - capProb) / G.C[0])) : 0;
  return { a: f.L, factors: { ...f }, weights: rounds.map(r => { const g = grp(r); return g === 'C' ? capEach : Math.max(1, Math.round(f[g] * U)); }) };
}

function stats(rounds, weights, cost) {
  let trig = 0, W = 0, P = 0, hit = 0, lessBet = 0, p5k = 0, p10k = 0, pmax = 0, max = 0, e40 = 0, e10k = 0;
  rounds.forEach((r, i) => { const w = weights[i], x = r.payoutX; W += w; P += w * x; if (cost === 1 && r.criteria !== 'basegame' && r.criteria !== '0') trig += w; if (x > 0) hit += w; if (x < cost) lessBet += w; if (x / cost >= 5000) p5k += w; if (x / cost >= 10000) p10k += w; if (r.criteria === 'wincap') pmax += w; if (x > max) max = x; if (x >= 40 * cost) e40 += w * x; if (x >= 10000) e10k += w * x; });
  return { rtp: P / W / cost, bonusUnSur: trig ? +(W / trig).toFixed(1) : null, hitRate: hit / W, probLessThanBet: lessBet / W, prob5k: p5k / W, prob10k: p10k / W, etl40b: e40 / W, etl10k: e10k / W, maxWinHitRate: pmax / W, maxWin: max };
}

function verify(file, lutFile) {
  // mêmes contrôles que utils/rgs_verification.py du Math SDK
  const lut = fs.readFileSync(lutFile, 'utf8').trim().split('\n').map(l => l.split(',').map(Number));
  let sum = 0n;
  for (const [id, w, p] of lut) {
    if (!Number.isInteger(p) || p < 0) throw new Error('paiement non entier');
    if (p > 0 && p < 10) throw new Error('paiement non nul < 10');
    if (p % 10 !== 0) throw new Error('paiement non multiple de 10');
    if (!Number.isInteger(w) || w < 0) throw new Error('poids non entier');
    sum += BigInt(w);
  }
  if (sum > 18446744073709551615n) throw new Error('somme des poids > uint64');
  const books = zlib.zstdDecompressSync(fs.readFileSync(file)).toString('utf8').trim().split('\n');
  if (books.length !== lut.length) throw new Error('nombre de livres ≠ nombre de lignes de la table');
  books.forEach((l, i) => { const b = JSON.parse(l); for (const k of ['payoutMultiplier', 'id', 'events']) if (!(k in b)) throw new Error('clé manquante ' + k); if (b.payoutMultiplier !== lut[i][2]) throw new Error('paiement différent livre/table à la ligne ' + (i + 1)); });
  return { lines: lut.length, totalWeight: sum.toString() };
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const index = { modes: [] }, report = {};
  for (const mode of ['base', 'bonus', 'super']) {
    const cost = Engine.CONFIG.MODES[mode].cost, N = COUNTS[mode], t0 = Date.now();
    const rounds = [];
    for (let i = 0; i < N; i++) { const r = eng.playRound(mode); if (r.criteria !== 'wincap') rounds.push(r); else i--; }
    // livres "gain max" : même jeu, avec des spins chauds forcés (méthode des distributions du Math SDK)
    let caps = 0;
    // (spins « à l'abordage » et Kraken forcés : des issues rares mais possibles du jeu normal)
    while (caps < CAP_COUNT) { const r = eng.playRound(mode, Object.assign({ forceHot: true, forceCrew: 5 }, mode === 'base' ? { forceTrigger: 3 } : {})); if (r.criteria === 'wincap') { rounds.push(r); caps++; } }
    // mélange pour que l'ordre des identifiants ne trahisse rien
    for (let i = rounds.length - 1; i > 0; i--) { const j = crypto.randomInt(0, i + 1); [rounds[i], rounds[j]] = [rounds[j], rounds[i]]; }
    const { a, factors, weights } = computeWeights(rounds, cost, CAP_PROB[mode]);
    const booksName = `books_${mode}.jsonl.zst`, lutName = `lookUpTable_${mode}_0.csv`;
    await writeBooks(path.join(OUT, booksName), rounds);
    fs.writeFileSync(path.join(OUT, lutName), rounds.map((r, i) => `${i + 1},${weights[i]},${r.payoutMultiplier}`).join('\n') + '\n');
    const v = verify(path.join(OUT, booksName), path.join(OUT, lutName));
    index.modes.push({ name: mode, cost: cost, events: booksName, weights: lutName });
    report[mode] = Object.assign({ books: v.lines, facteurs: Object.fromEntries(Object.entries(factors).map(([k, x]) => [k, +x.toFixed(4)])), secondes: Math.round((Date.now() - t0) / 1000), tailleLivresMo: +(fs.statSync(path.join(OUT, booksName)).size / 1e6).toFixed(1) }, stats(rounds, weights, cost));
    console.log(mode, JSON.stringify(report[mode]));
  }
  // "cost" écrit en nombre décimal (1.0, 100.0…) comme dans les fichiers du Math SDK
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify(index, null, 4).replace(/"cost": (\d+)(,?)\n/g, '"cost": $1.0$2\n'));
  const rtps = Object.values(report).map(r => r.rtp);
  report._ecartRTPmax = Math.max(...rtps) - Math.min(...rtps);
  fs.writeFileSync(path.join(__dirname, 'report.json'), JSON.stringify(report, null, 2));
  console.log('écart de RTP entre modes :', report._ecartRTPmax.toFixed(5), '→ fichiers dans', OUT);
})().catch(e => { console.error(e); process.exit(1); });
