/*
  Faux serveur Stake Engine (RGS) pour tester le front-end en local avec les vrais fichiers mathématiques.
  - sert frontend/ en statique
  - /wallet/authenticate, /wallet/balance, /wallet/play, /wallet/end-round, /bet/event, /bet/replay/...
  - tire chaque partie dans books_<mode>.jsonl.zst selon les poids de lookUpTable_<mode>_0.csv

  Usage : node tools/mock-rgs.js [port=8787]
  Puis ouvrir : http://localhost:8787/index.html?sessionID=test&lang=en&device=desktop&rgs_url=http://localhost:8787
*/
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
const FRONT = path.join(ROOT, 'frontend'), PUB = path.join(ROOT, 'math', 'publish');
const PORT = +(process.argv[2] || 8787);

const index = JSON.parse(fs.readFileSync(path.join(PUB, 'index.json'), 'utf8'));
const modes = {};
for (const m of index.modes) {
  const books = zlib.zstdDecompressSync(fs.readFileSync(path.join(PUB, m.events))).toString('utf8').trim().split('\n');
  const lut = fs.readFileSync(path.join(PUB, m.weights), 'utf8').trim().split('\n').map(l => l.split(',').map(Number));
  let acc = 0n; const cum = lut.map(([, w]) => (acc += BigInt(w)));
  modes[m.name] = { cost: m.cost, books, cum, total: acc };
  console.log(`mode ${m.name}: ${books.length} livres`);
}
function draw(mode) {
  const M = modes[mode]; const r = BigInt('0x' + crypto.randomBytes(8).toString('hex')) % M.total;
  let lo = 0, hi = M.cum.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (M.cum[mid] > r) hi = mid; else lo = mid + 1; }
  return JSON.parse(M.books[lo]);
}

const session = { balance: 1000 * 1e6, currency: process.env.CUR || 'USD', round: null, betID: 0 };
const config = {
  minBet: 100000, maxBet: 100000000, stepBet: 100000, defaultBetLevel: 1000000,
  betLevels: [100000, 200000, 400000, 600000, 800000, 1000000, 2000000, 4000000, 5000000, 10000000, 20000000, 50000000, 100000000],
  jurisdiction: { socialCasino: false, disabledFullscreen: false, disabledTurbo: false, disabledSuperTurbo: false, disabledAutoplay: false, disabledSlamstop: false, disabledSpacebar: false, disabledBuyFeature: false, displayNetPosition: !!process.env.NET, displayRTP: false, displaySessionTimer: !!process.env.NET, minimumRoundDuration: 0 }
};
const send = (res, code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' }); res.end(JSON.stringify(obj)); };
const bal = () => ({ amount: session.balance, currency: session.currency });

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url, 'http://x');
  if (req.method === 'GET' && url.pathname.startsWith('/bet/replay/')) {
    const [, , , , , mode] = url.pathname.split('/');
    const b = draw(mode || 'base'); return send(res, 200, { state: b.events, payoutMultiplier: b.payoutMultiplier / 100, costMultiplier: modes[mode || 'base'].cost });
  }
  if (req.method === 'GET') {
    const f = path.join(FRONT, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
    if (!f.startsWith(FRONT) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    const ext = path.extname(f), type = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type }); return fs.createReadStream(f).pipe(res);
  }
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const q = body ? JSON.parse(body) : {};
    if (!q.sessionID) return send(res, 400, { error: 'ERR_IS', message: 'missing session' });
    switch (url.pathname) {
      case '/wallet/authenticate': return send(res, 200, { balance: bal(), config, round: session.round });
      case '/wallet/balance': return send(res, 200, { balance: bal() });
      case '/wallet/play': {
        if (session.round && session.round.active) return send(res, 400, { error: 'ERR_VAL', message: 'round active' });
        const M = modes[q.mode]; if (!M) return send(res, 400, { error: 'ERR_VAL', message: 'bad mode' });
        if (!config.betLevels.includes(q.amount)) return send(res, 400, { error: 'ERR_VAL', message: 'bad amount' });
        const cost = Math.round(q.amount * M.cost); if (cost > session.balance) return send(res, 400, { error: 'ERR_IPB' });
        session.balance -= cost;
        const b = draw(q.mode), payout = Math.round(q.amount * b.payoutMultiplier / 100);
        session.round = { betID: ++session.betID, amount: q.amount, payout, payoutMultiplier: b.payoutMultiplier / 100, active: payout > 0, mode: q.mode, event: null, state: b.events };
        if (payout === 0) session.round.active = false;
        console.log(`play ${q.mode} mise ${q.amount / 1e6} → ${b.payoutMultiplier / 100}x (livre ${b.id})`);
        return send(res, 200, { balance: bal(), round: session.round });
      }
      case '/wallet/end-round': {
        if (!session.round || !session.round.active) return send(res, 400, { error: 'ERR_VAL', message: 'no active round' });
        session.balance += session.round.payout; session.round.active = false;
        return send(res, 200, { balance: bal() });
      }
      case '/bet/event': return send(res, 200, { event: q.event });
      default: return send(res, 404, { error: 'ERR_VAL' });
    }
  });
}).listen(PORT, () => console.log(`faux RGS sur http://localhost:${PORT}`));
