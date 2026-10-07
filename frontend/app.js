/*
  Jolly Wilds — front-end Stake Engine.
  Chaque partie est demandée au serveur Stake (RGS : /wallet/authenticate, /wallet/play, /wallet/end-round),
  puis ses événements sont animés. Gère la reprise d'une partie interrompue, le rejeu (?replay=true),
  les devises et niveaux de mise du serveur, les options de juridiction, le mode social, l'anglais et le français.
  ?demo=true : démo locale en crédits fictifs (moteur dans le navigateur), pour tester hors Stake.
*/
'use strict';
const $ = id => document.getElementById(id);
const ENG = JollyEngine.create();
const CFG = JollyEngine.CONFIG;
const { symSVG, crewSVG, CREW_COLORS } = JollyArt;
const REELS = CFG.REELS, ROWS = CFG.ROWS;
const MAX_WIN_X = CFG.MAX_WIN / 100;
const RTP_TEXT = '96.20%';
const BUY_STD = CFG.MODES.bonus.cost, BUY_SUP = CFG.MODES.super.cost;
const SUP_FROM = CFG.MODES.super.crewFrom;

/* ============ LANGUE ============ */
const Q = new URLSearchParams(location.search);
const LANG = (Q.get('lang') || navigator.language || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
const LOCALE = LANG === 'fr' ? 'fr-FR' : 'en-US';
let SOC = Q.get('social') === 'true';          // aussi activé par config.jurisdiction.socialCasino (authenticate)
const REPLAY = Q.get('replay') === 'true';
const DEMO = Q.get('demo') === 'true' && !REPLAY;
const JUR = {};                                 // options imposées par la juridiction (authenticate)

/* Vocabulaire neutre (pas de « pays/paid/payouts/money/gambling ») ; « bet/buy » seulement hors mode social. */
function makeT(soc) {
  const en = {
    balance: 'Balance', bet: soc ? 'Play amount' : 'Bet', buy: 'Bonus', sup: 'Super bonus',
    buyD: '10+ free spins, a crew wild every spin.', supD: 'Elite crew only (x5 to x100), one extra wild each spin.',
    fsLeft: 'Free spins', fsWin: 'Bonus total', hint: 'Match symbols on adjacent reels from the left. 1024 ways.', luck: 'Good luck…',
    nowin: 'No win this time.', win: 'Win', bonusDone: 'Bonus complete!',
    crew: ['Cabin Boy', 'Parrot', 'Cook', 'Gunner', 'Captain', 'Kraken'],
    syms: ['Treasure chest', 'Rum', 'Map', 'Compass', 'A', 'K', 'Q', 'J', '10'], wild: 'Wild', scatter: 'Bonus',
    boards: n => 'The ' + n + ' comes aboard!', wildsOf: (n, m) => n + ' wild' + (n > 1 ? 's' : '') + ' x' + m,
    trig: 'Bonus triggered', spins: n => n + ' FREE SPINS',
    intro: 'Every free spin, one member of the crew comes aboard and drops wilds on reels 2 to 5. Each wild carries that character\'s multiplier.',
    introSup: 'Super bonus: only the elite crew comes aboard, with one extra wild each spin.', start: 'Start',
    retrig: n => '+' + n + ' FREE SPINS', over: 'Bonus complete', maxed: 'Max win reached', inSpins: n => 'in ' + n + ' free spin' + (n > 1 ? 's' : ''), cont: 'Continue',
    confirm: (b, sup) => (soc ? 'For a play amount of ' : 'For a bet of ') + b + ', you get <b>10 or more free spins</b>' + (sup ? ' with the <b>elite crew</b> (x5 to x100, one extra wild each spin)' : ' with a crew wild every spin') + '.',
    cancel: 'Cancel', buyBtn: soc ? 'Start' : 'Buy', skip: 'Tap to skip', tapCont: 'Tap to continue', tiers: ['BIG WIN', 'MEGA WIN', 'EPIC WIN', 'LEGENDARY'],
    wayLine: (s, n, f, a) => s + ' ×' + n + ' · ' + f + ' way' + (f > 1 ? 's' : '') + ' · ' + a, more: n => '+' + n + ' more',
    replayDone: 'Replay complete', replayAgain: 'Watch again', replayPlay: 'Play', replayWin: x => 'Win: ' + x,
    replayBanner: (m, b, c) => m + ' · ' + (soc ? 'play amount ' : 'bet ') + b + (c ? ' · cost ' + c : ''), modeName: { base: 'Base game', bonus: 'Bonus', super: 'Super bonus' },
    session: 'Session', net: 'Net', loading: 'Loading…', noSession: 'This game must be opened from the casino.',
    music: 'Music', musicOn: 'Turn music on', musicOff: 'Turn music off', soundOn: 'Turn sound on', soundOff: 'Turn sound off', rulesTip: 'Game rules',
    spinAria: 'Spin', stopAuto: n => 'Stop autoplay (' + n + ')', autoAsk: n => 'Start autoplay for ' + n + ' spins?', autoStart: 'Start autoplay',
    dec: 'Decrease', inc: 'Increase', autoTip: 'Autoplay', turboTip: 'Turbo: faster animations', buyTip: soc ? 'Start the bonus' : 'Buy the bonus', supTip: soc ? 'Start the super bonus' : 'Buy the super bonus',
    err: { ERR_IPB: 'Insufficient balance.', ERR_IS: 'Your session has expired. Please reload the game.', ERR_ATE: 'Authentication failed. Please reload the game.', ERR_GLE: soc ? 'Play limit reached.' : 'Limit reached.', ERR_LOC: 'This game is not available in your location.', ERR_MAINTENANCE: 'The game is under maintenance. Please try again later.', def: 'Connection problem. Please try again.' },
    controls: [['Spin button', 'Starts a spin. During autoplay it shows the spins left; tap it to stop.'], ['− / +', soc ? 'Lowers or raises the play amount.' : 'Lowers or raises the bet.'], ['Auto', 'Choose a number of automatic spins, then confirm to start.'], ['Turbo', 'Speeds up the animations.'],
      ['Bonus', (soc ? 'Starts the bonus' : 'Buys the bonus') + ' for ' + BUY_STD + '× the ' + (soc ? 'play amount' : 'bet') + '.'], ['Super bonus', (soc ? 'Starts the super bonus' : 'Buys the super bonus') + ' for ' + BUY_SUP + '× the ' + (soc ? 'play amount' : 'bet') + '; only the elite crew comes aboard.'],
      ['♪', 'Turns the music on or off.'], ['Speaker', 'Turns all sound on or off.'], ['?', 'Opens these rules.'], ['Space', 'Starts a spin (when allowed).']],
    rules: f => `<h2>Rules</h2>
      <p>5 reels, 4 rows, <b>1024 ways</b>. A win is formed by matching symbols on <b>3, 4 or 5 adjacent reels, starting from the leftmost reel</b>, in any position. Each combination of one matching position per reel is one way; every way wins the value below. Values are for your current ${soc ? 'play amount' : 'bet'} of <b>${f.bet}</b>, per way. Wins of different symbols add up.</p>
      ${f.table}
      <h3>Wild</h3><p>${f.wild} The Wild appears on reels 2 to 5 in the base game and substitutes for every symbol except Bonus.</p>
      <h3>Free spins</h3><p>${f.scatter} 3, 4 or 5 Bonus symbols anywhere award ${CFG.FS_AWARD[3]}, ${CFG.FS_AWARD[4]} or ${CFG.FS_AWARD[5]} free spins. During the bonus, 3 or more Bonus symbols award ${CFG.RETRIGGER} extra free spins.</p>
      <h3>The crew</h3><p>On every free spin, one member of the crew comes aboard and drops their wilds on random positions of reels 2 to 5. Each crew wild substitutes for every symbol except Bonus and carries the character's multiplier. If a way goes through several crew wilds, their multipliers are added together; a way without a crew wild counts ×1.</p>
      ${f.crew}
      ${f.buy}
      <h3>Max win</h3><p>Wins are capped at <b>${MAX_WIN_X.toLocaleString('en-US')}× the ${soc ? 'play amount' : 'bet'}</b> (${f.maxwin}). When it is reached, the round ends and the max win is awarded.</p>
      <h3>Return to player</h3><p>The theoretical RTP is <b>${RTP_TEXT}</b> for the base game, the Bonus and the Super bonus.</p>
      <h3>Controls</h3><div class="ctrl-list">${f.controls}</div>
      <h3>Disclaimer</h3><p style="color:var(--mute);font-size:13px">A malfunction voids all wins and plays. A stable internet connection is required; if the connection is lost, reload the game to complete an unfinished round. The RTP is a theoretical value calculated over a very large number of rounds. The game display is not representative of any physical device and is for illustrative purposes only. Winnings are settled according to the amount received from the Remote Game Server and not from events within the web browser. Jolly Wilds™ © ${new Date().getFullYear()} KPOS. All rights reserved.</p>`,
    rulesBuy: (a, b) => `<h3>Bonus and Super bonus</h3><p>Bonus: ${a} (${BUY_STD}× the ${soc ? 'play amount' : 'bet'}), the free spins start right away. Super bonus: ${b} (${BUY_SUP}× the ${soc ? 'play amount' : 'bet'}), only the elite crew (Cook, Gunner, Captain and Kraken) comes aboard, and each of them drops one extra wild.</p>`,
    crewHead: ['Character', 'Multiplier', 'Wilds'], close: 'Close'
  };
  const fr = {
    balance: 'Solde', bet: soc ? 'Montant' : 'Mise', buy: 'Bonus', sup: 'Super bonus',
    buyD: '10 free spins ou plus, un wild de l’équipage à chaque spin.', supD: 'Équipage d’élite (x5 à x100), un wild de plus à chaque spin.',
    fsLeft: 'Free spins', fsWin: 'Total du bonus', hint: 'Alignez des symboles sur des rouleaux voisins depuis la gauche. 1024 façons.', luck: 'Bonne chance…',
    nowin: 'Pas de gain cette fois.', win: 'Gain', bonusDone: 'Bonus terminé !',
    crew: ['Mousse', 'Perroquet', 'Cuistot', 'Canonnier', 'Capitaine', 'Kraken'],
    syms: ['Coffre', 'Rhum', 'Carte', 'Boussole', 'A', 'K', 'Q', 'J', '10'], wild: 'Wild', scatter: 'Bonus',
    boards: n => 'Le ' + n + ' monte à bord !', wildsOf: (n, m) => n + ' wild' + (n > 1 ? 's' : '') + ' x' + m,
    trig: 'Bonus déclenché', spins: n => n + ' FREE SPINS',
    intro: 'À chaque free spin, un membre de l’équipage monte à bord et pose ses wilds sur les rouleaux 2 à 5. Chaque wild porte le multiplicateur de ce personnage.',
    introSup: 'Super bonus : seul l’équipage d’élite monte à bord, avec un wild de plus à chaque spin.', start: 'Commencer',
    retrig: n => '+' + n + ' FREE SPINS', over: 'Bonus terminé', maxed: 'Gain maximum atteint', inSpins: n => 'en ' + n + ' free spin' + (n > 1 ? 's' : ''), cont: 'Continuer',
    confirm: (b, sup) => (soc ? 'Pour un montant de ' : 'Pour une mise de ') + b + ', vous obtenez <b>10 free spins ou plus</b>' + (sup ? ' avec <b>l’équipage d’élite</b> (x5 à x100, un wild de plus à chaque spin)' : ' avec un wild de l’équipage à chaque spin') + '.',
    cancel: 'Annuler', buyBtn: soc ? 'Lancer' : 'Acheter', skip: 'Touchez pour passer', tapCont: 'Touchez pour continuer', tiers: ['BIG WIN', 'MEGA WIN', 'EPIC WIN', 'LÉGENDAIRE'],
    wayLine: (s, n, f, a) => s + ' ×' + n + ' · ' + f + ' façon' + (f > 1 ? 's' : '') + ' · ' + a, more: n => '+' + n + ' autre' + (n > 1 ? 's' : ''),
    replayDone: 'Rejeu terminé', replayAgain: 'Revoir', replayPlay: 'Lancer', replayWin: x => 'Gain : ' + x,
    replayBanner: (m, b, c) => m + ' · ' + (soc ? 'montant ' : 'mise ') + b + (c ? ' · coût ' + c : ''), modeName: { base: 'Jeu de base', bonus: 'Bonus', super: 'Super bonus' },
    session: 'Session', net: 'Net', loading: 'Chargement…', noSession: 'Ce jeu doit être ouvert depuis le casino.',
    music: 'Musique', musicOn: 'Activer la musique', musicOff: 'Couper la musique', soundOn: 'Activer le son', soundOff: 'Couper le son', rulesTip: 'Règles du jeu',
    spinAria: 'Lancer', stopAuto: n => 'Arrêter l’auto (' + n + ')', autoAsk: n => 'Lancer ' + n + ' spins automatiques ?', autoStart: 'Lancer l’auto',
    dec: 'Diminuer', inc: 'Augmenter', autoTip: 'Spins automatiques', turboTip: 'Turbo : animations plus rapides', buyTip: soc ? 'Lancer le bonus' : 'Acheter le bonus', supTip: soc ? 'Lancer le super bonus' : 'Acheter le super bonus',
    err: { ERR_IPB: 'Solde insuffisant.', ERR_IS: 'Votre session a expiré. Rechargez le jeu.', ERR_ATE: 'Échec de l’authentification. Rechargez le jeu.', ERR_GLE: 'Limite atteinte.', ERR_LOC: 'Ce jeu n’est pas disponible dans votre pays.', ERR_MAINTENANCE: 'Le jeu est en maintenance. Réessayez plus tard.', def: 'Problème de connexion. Réessayez.' },
    controls: [['Bouton de lancement', 'Lance un spin. En automatique, il affiche les spins restants ; touchez-le pour arrêter.'], ['− / +', soc ? 'Diminue ou augmente le montant.' : 'Diminue ou augmente la mise.'], ['Auto', 'Choisissez un nombre de spins automatiques, puis confirmez pour lancer.'], ['Turbo', 'Accélère les animations.'],
      ['Bonus', (soc ? 'Lance le bonus' : 'Achète le bonus') + ' pour ' + BUY_STD + ' fois ' + (soc ? 'le montant' : 'la mise') + '.'], ['Super bonus', (soc ? 'Lance le super bonus' : 'Achète le super bonus') + ' pour ' + BUY_SUP + ' fois ' + (soc ? 'le montant' : 'la mise') + ' ; seul l’équipage d’élite monte à bord.'],
      ['♪', 'Active ou coupe la musique.'], ['Haut-parleur', 'Active ou coupe tous les sons.'], ['?', 'Ouvre ces règles.'], ['Espace', 'Lance un spin (si autorisé).']],
    rules: f => `<h2>Règles</h2>
      <p>5 rouleaux, 4 rangées, <b>1024 façons de gagner</b>. Un gain se forme avec des symboles identiques sur <b>3, 4 ou 5 rouleaux voisins, en partant du rouleau de gauche</b>, à n'importe quelle position. Chaque combinaison d'une position par rouleau est une façon, et chaque façon rapporte la valeur du tableau. Les valeurs sont données par façon, pour ${soc ? 'votre montant actuel' : 'votre mise actuelle'} de <b>${f.bet}</b>. Les gains de symboles différents s'additionnent.</p>
      ${f.table}
      <h3>Wild</h3><p>${f.wild} Le Wild apparaît sur les rouleaux 2 à 5 en jeu de base et remplace tous les symboles sauf le Bonus.</p>
      <h3>Free spins</h3><p>${f.scatter} 3, 4 ou 5 symboles Bonus n'importe où donnent ${CFG.FS_AWARD[3]}, ${CFG.FS_AWARD[4]} ou ${CFG.FS_AWARD[5]} free spins. Pendant le bonus, 3 symboles Bonus ou plus ajoutent ${CFG.RETRIGGER} free spins.</p>
      <h3>L'équipage</h3><p>À chaque free spin, un membre de l'équipage monte à bord et pose ses wilds au hasard sur les rouleaux 2 à 5. Chaque wild de l'équipage remplace tous les symboles sauf le Bonus et porte le multiplicateur du personnage. Si une façon passe par plusieurs wilds de l'équipage, leurs multiplicateurs s'additionnent ; une façon sans wild de l'équipage compte ×1.</p>
      ${f.crew}
      ${f.buy}
      <h3>Gain maximum</h3><p>Les gains sont plafonnés à <b>${MAX_WIN_X.toLocaleString('fr-FR')} fois ${soc ? 'le montant' : 'la mise'}</b> (${f.maxwin}). Dès qu'il est atteint, la partie s'arrête et le gain maximum est accordé.</p>
      <h3>Taux de retour</h3><p>Le taux de retour théorique est de <b>${RTP_TEXT.replace('.', ',')}</b> pour le jeu de base, le Bonus et le Super bonus.</p>
      <h3>Commandes</h3><div class="ctrl-list">${f.controls}</div>
      <h3>Avertissement</h3><p style="color:var(--mute);font-size:13px">Tout dysfonctionnement annule les parties et les gains. Une connexion internet stable est nécessaire ; en cas de coupure, rechargez le jeu pour terminer une partie en cours. Le taux de retour est une valeur théorique calculée sur un très grand nombre de parties. L'affichage du jeu ne représente aucun appareil physique et n'est qu'illustratif. Les gains sont réglés selon le montant reçu du serveur de jeu (RGS), et non selon les événements affichés dans le navigateur. Jolly Wilds™ © ${new Date().getFullYear()} KPOS. Tous droits réservés.</p>`,
    rulesBuy: (a, b) => `<h3>Bonus et Super bonus</h3><p>Bonus : ${a} (${BUY_STD} fois ${soc ? 'le montant' : 'la mise'}), les free spins commencent tout de suite. Super bonus : ${b} (${BUY_SUP} fois ${soc ? 'le montant' : 'la mise'}), seul l'équipage d'élite (Cuistot, Canonnier, Capitaine et Kraken) monte à bord, et chacun pose un wild de plus.</p>`,
    crewHead: ['Personnage', 'Multiplicateur', 'Wilds'], close: 'Fermer'
  };
  return LANG === 'fr' ? fr : en;
}
let T = makeT(SOC), TIERS = [];
function setTexts() { T = makeT(SOC); TIERS = [20, 50, 100, 500].map((x, i) => ({ x, label: T.tiers[i] })); }
setTexts();

/* ============ ÉTAT ============ */
let BETS = [1], betIdx = 0, balance = 0, busy = false, inFS = false, turbo = false, autoLeft = 0, muted = false, ready = false;
let CURRENCY = null;
let grid = [];                // grid[rouleau][rangée] = code symbole affiché
let crewNow = -1;             // personnage du spin en cours (free spins)
let lastTotal = 0;            // gain cumulé de la partie en cours (centièmes de mise)
try { muted = localStorage.getItem('jw-muted') === '1'; } catch (e) {}

const sp = t => t.replace(/[  ]/g, ' ');
/* devises Stake Engine : symbole, décimales, symbole après le montant */
const CUR_META = { USD: ['$', 2], CAD: ['CA$', 2], JPY: ['¥', 0], EUR: ['€', 2], RUB: ['₽', 2], CNY: ['CN¥', 2], PHP: ['₱', 2], INR: ['₹', 2], IDR: ['Rp', 0], KRW: ['₩', 0], BRL: ['R$', 2], MXN: ['MX$', 2], DKK: ['KR', 2, 1], PLN: ['zł', 2, 1], VND: ['₫', 0, 1], TRY: ['₺', 2], CLP: ['CLP', 0, 1], ARS: ['ARS', 2, 1], PEN: ['S/', 2, 1], XGC: ['GC', 2, 1], XSC: ['SC', 2, 1], XEC: ['SC', 2, 1] };
function money(n, dec) {
  const m = CURRENCY ? (CUR_META[CURRENCY] || [CURRENCY, 2, 1]) : null; let d = dec ?? (m ? m[1] : 2);
  if (n && dec === undefined) { while (d < 6 && Math.abs(Math.round(n * 10 ** d) / 10 ** d - n) > 1e-9) d++; }   // 0,005 reste 0,005
  const s = sp(n.toLocaleString(LOCALE, { minimumFractionDigits: d, maximumFractionDigits: d }));
  return !m ? s : m[2] ? s + ' ' + m[0] : m[0] + s;
}
const fmt = n => money(n);
const sleep = ms => new Promise(r => setTimeout(r, ms * (turbo ? 0.45 : 1)));
const bet = () => BETS[betIdx];
function setBalance(v) { balance = v; $('balance').textContent = fmt(v); updateUI(); }

/* ============ SON (Web Audio) ============ */
let ac = null;
function A() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; }
function tone(f, d = .12, type = 'sine', v = .12, f2 = null, delay = 0, dest = null) {
  if (muted) return; const a = A(); if (!a) return;
  const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .01); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(dest || a.destination); o.start(t); o.stop(t + d + .03);
}
const SFX = {
  click: () => tone(660, .05, 'triangle', .06),
  stop: r => tone(160 + r * 25, .09, 'square', .05, 90),
  win: () => { [523, 659, 784].forEach((f, i) => tone(f, .18, 'triangle', .09, null, i * .07)); },
  coin: () => tone(1400 + Math.random() * 500, .06, 'sine', .04),
  scatter: () => tone(880, .35, 'sine', .1, 1320),
  crew: m => { const base = 220 + Math.min(m, 100) * 4; [0, 4, 7, 12].forEach((s, i) => tone(base * 2 ** (s / 12), .22, 'sawtooth', .05, null, i * .08)); },
  splash: () => tone(300, .3, 'triangle', .07, 60),
  big: () => { [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, .3, 'triangle', .08, null, i * .06)); }
};
/* musique : petite chanson de marins en boucle, générée en direct */
const Music = (() => {
  let on = true, timer = null, step = 0, bus = null;
  try { on = localStorage.getItem('jw-music') !== '0'; } catch (e) {}
  const mel = [69, 0, 72, 74, 76, 0, 74, 72, 74, 0, 71, 67, 69, 0, 0, 0, 69, 0, 72, 74, 76, 0, 79, 77, 76, 74, 72, 71, 69, 0, 0, 0];
  const bass = [45, 45, 52, 52, 43, 43, 50, 50, 45, 45, 52, 52, 40, 40, 45, 45];
  const hz = n => 440 * 2 ** ((n - 69) / 12);
  function tick() {
    const a = A(); if (!a || muted || !on) return;
    if (!bus) { bus = a.createGain(); bus.gain.value = .5; bus.connect(a.destination); }
    const n = mel[step % mel.length]; if (n) tone(hz(n), .22, 'triangle', .035, null, 0, bus);
    if (step % 2 === 0) tone(hz(bass[(step / 2) % bass.length]), .3, 'sine', .05, null, 0, bus);
    step++;
  }
  function play() { if (timer || !on || muted) return; timer = setInterval(tick, 190); }
  function stop() { clearInterval(timer); timer = null; }
  return {
    get on() { return on; },
    kick() { play(); },
    toggle() { on = !on; try { localStorage.setItem('jw-music', on ? '1' : '0'); } catch (e) {} on ? play() : stop(); paintMusic(); },
    sync() { muted || !on ? stop() : play(); }
  };
})();

/* ============ PLATEAU ============ */
const boardEl = $('board');
const reelEls = [];
for (let r = 0; r < REELS; r++) { const d = document.createElement('div'); d.className = 'reel'; boardEl.appendChild(d); reelEls.push(d); }
const boardOf = b => b.map(s => s.split(''));
function cellHTML(code, crewId) {
  if (code[0] === 'X') { const id = code.length > 1 ? +code[1] : crewId >= 0 ? crewId : 0, m = CFG.CREW[id].mult; return `${crewSVG(id)}<span class="mult" style="--cc:${CREW_COLORS[id]}">x${m}</span>`; }
  return symSVG(code);
}
function makeStrip(codes) {
  const s = document.createElement('div'); s.className = 'strip'; s.style.height = (codes.length * 25) + '%';
  s.innerHTML = codes.map(c => `<div class="cell" style="height:${100 / codes.length}%">${cellHTML(c, crewNow)}</div>`).join('');
  return s;
}
function drawReel(r) { reelEls[r].innerHTML = ''; reelEls[r].appendChild(makeStrip(grid[r])); }
function drawBoard() { for (let r = 0; r < REELS; r++) drawReel(r); }
const cellEl = i => reelEls[(i / ROWS) | 0].querySelector('.strip').children[i % ROWS];
function clearMarks() { boardEl.classList.remove('showing'); boardEl.querySelectorAll('.win,.sc').forEach(c => c.classList.remove('win', 'sc')); }
const FILLER = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '4', '5', '6', '7', '8'];
async function spinReels(next, fs) {
  clearMarks();
  const a = turbo ? 0.45 : 1, promises = [];
  for (let r = 0; r < REELS; r++) {
    const k = Math.round((8 + r * 3) * (turbo ? .6 : 1));
    const filler = Array.from({ length: k }, () => FILLER[(Math.random() * FILLER.length) | 0]);
    if (!fs && r > 0 && Math.random() < .3) filler[(Math.random() * k) | 0] = 'W';
    const codes = next[r].concat(filler, grid[r] || []);
    const strip = makeStrip(codes); reelEls[r].innerHTML = ''; reelEls[r].appendChild(strip);
    const from = -(codes.length - ROWS) / codes.length * 100;
    strip.style.transform = `translateY(${from}%)`;
    const dur = (380 + r * 170) * a;
    promises.push(new Promise(res => {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        strip.style.transition = `transform ${dur}ms cubic-bezier(.3,.05,.4,1.06)`;
        strip.style.transform = 'translateY(0)';
        setTimeout(() => { grid[r] = next[r].slice(); drawReel(r); SFX.stop(r); if (next[r].includes('S')) SFX.scatter(); res(); }, dur + 20);
      }));
    }));
  }
  await Promise.all(promises);
}

/* ============ ÉQUIPAGE ============ */
function buildCrewBar() {
  $('crewbar').innerHTML = CFG.CREW.map(p => `<div class="cm" data-id="${p.id}" title="${T.crew[p.id]} x${p.mult}">${crewSVG(p.id)}<b>x${p.mult}</b></div>`).join('');
  $('miniStd').innerHTML = CFG.CREW.map(p => crewSVG(p.id)).join('');
  $('miniSup').innerHTML = CFG.CREW.slice(SUP_FROM).map(p => crewSVG(p.id)).join('');
}
function setCrewBar(avail, cur) {
  document.querySelectorAll('#crewbar .cm').forEach(el => { const id = +el.dataset.id; el.classList.toggle('off', !!avail && !avail.includes(id)); el.classList.toggle('on', id === cur); });
}
function callout(html, color, ms) {
  const el = document.createElement('div'); el.className = 'callout'; el.style.setProperty('--cc', color); el.innerHTML = html;
  document.querySelector('.machine').appendChild(el);
  return sleep(ms).then(() => el.remove());
}
async function crewEnter(e) {
  crewNow = e.id; setCrewBar(null, e.id);
  const p = CFG.CREW[e.id];
  SFX.crew(p.mult);
  await callout(`${crewSVG(e.id)}<div><div class="n">${T.boards(T.crew[e.id])}</div><div class="x">x${p.mult}</div><small>${T.wildsOf(e.cells.length, p.mult)}</small></div>`, CREW_COLORS[e.id], e.id >= 4 ? 1300 : 850);
  for (const c of e.cells) {
    const r = (c / ROWS) | 0, y = c % ROWS;
    grid[r][y] = 'X' + e.id;
    const el = cellEl(c); el.innerHTML = cellHTML(grid[r][y]); el.classList.add('crew'); SFX.splash();
    await sleep(160);
  }
  await sleep(200);
}

/* ============ AFFICHAGE DES GAINS ============ */
function showMsg(t) { $('msg').textContent = t; }
function showAmt(x) { $('winAmt').textContent = x > 0 ? fmt(x) : ''; }
async function showWins(e, b) {
  boardEl.classList.add('showing');
  const cells = new Set(); e.wins.forEach(w => w.c.forEach(c => cells.add(c)));
  cells.forEach(c => cellEl(c).classList.add('win'));
  const top = e.wins.slice().sort((a, z) => z.w - a.w);
  const label = w => T.wayLine(T.syms[w.s], w.n, w.f, fmt(Math.floor(w.w) / 100 * b));
  showMsg(label(top[0]) + (top.length > 1 ? ' · ' + T.more(top.length - 1) : ''));
  lastTotal = e.totalWin; showAmt(e.totalWin / 100 * b);
  if (inFS) $('fsWin').textContent = fmt(e.totalWin / 100 * b);
  SFX.win();
  const big = e.spinWin / 100 >= 5;
  await sleep(big ? 1300 : 850);
  if (top.length > 1 && !turbo) { for (const w of top.slice(1, 3)) { showMsg(label(w)); await sleep(550); } }
}

/* ============ FENÊTRES ============ */
function modal(html, buttons, wide = false) {
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = `<div class="card${wide ? ' wide' : ''}">${html}<div class="row"></div></div>`;
    const row = ov.querySelector('.row');
    buttons.forEach(([label, val, cls]) => { const bt = document.createElement('button'); bt.className = 'btn ' + (cls || 'go'); bt.textContent = label; bt.onclick = () => { SFX.click(); ov.remove(); res(val); }; row.appendChild(bt); });
    document.body.appendChild(ov); (row.querySelector('.ghost') || row.querySelector('.go') || row.firstChild).focus({ preventScroll: true });
    if (REPLAY && buttons.length === 1) setTimeout(() => { if (ov.isConnected) { ov.remove(); res(buttons[0][1]); } }, 2500);
    if (autoLeft > 0 && buttons.length === 1) setTimeout(() => { if (ov.isConnected) { ov.remove(); res(buttons[0][1]); } }, 3500);
    ov.addEventListener('keydown', e => { if (e.key === 'Escape') { ov.remove(); res(null); } });
  });
}
function toast(t) { const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 2000); }

/* confettis (pièces d'or) pour les gros gains */
let fxOn = false;
function runFx() {
  const cv = document.createElement('canvas'); cv.className = 'fx'; document.body.appendChild(cv);
  const ctx = cv.getContext('2d'); const W = cv.width = innerWidth, H = cv.height = innerHeight;
  const ps = Array.from({ length: 90 }, () => ({ x: Math.random() * W, y: -Math.random() * H, v: 2 + Math.random() * 4, r: 4 + Math.random() * 7, a: Math.random() * 6 }));
  (function f() {
    if (!fxOn) { cv.remove(); return; }
    ctx.clearRect(0, 0, W, H);
    for (const p of ps) { p.y += p.v; p.a += .1; if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      ctx.fillStyle = '#ffc83d'; ctx.strokeStyle = '#8a5300'; ctx.beginPath(); ctx.ellipse(p.x, p.y, Math.abs(Math.cos(p.a)) * p.r + 1, p.r, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    requestAnimationFrame(f);
  })();
}
function bigWin(amount, b) {
  const ratio = amount / b; if (ratio < TIERS[0].x) return Promise.resolve();
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'bigwin';
    ov.innerHTML = `<div><div class="tier"></div><div class="amt"></div><div class="hint">${T.skip}</div></div>`;
    document.body.appendChild(ov); $('app').classList.add('shake'); setTimeout(() => $('app').classList.remove('shake'), 500);
    fxOn = true; runFx(); SFX.big();
    const reached = TIERS.filter(t => ratio >= t.x).length, dur = (1500 + reached * 1200) * (turbo ? .6 : 1);
    const t0 = performance.now(); let ti0 = -1, finished = false, lastCoin = 0;
    const tierEl = ov.querySelector('.tier'), amtEl = ov.querySelector('.amt');
    function frame(now) {
      if (finished) return;
      const p = Math.min(1, (now - t0) / dur), cur = amount * (1 - Math.pow(1 - p, 2.2));
      amtEl.textContent = fmt(cur);
      let ti = 0; TIERS.forEach((t, i) => { if (cur / b >= t.x) ti = i; });
      if (ti !== ti0) { ti0 = ti; tierEl.textContent = TIERS[ti].label; tierEl.classList.remove('up'); void tierEl.offsetWidth; tierEl.classList.add('up'); if (ti > 0) SFX.big(); }
      if (now - lastCoin > 80) { SFX.coin(); lastCoin = now; }
      if (p < 1) requestAnimationFrame(frame); else end();
    }
    function end() { if (finished) return; finished = true; amtEl.textContent = fmt(amount); tierEl.textContent = TIERS[reached - 1].label; setTimeout(close, 1500 * (turbo ? .6 : 1)); }
    function close() { if (!ov.isConnected) return; fxOn = false; ov.remove(); res(); }
    ov.onclick = () => { finished ? close() : end(); };
    requestAnimationFrame(frame);
  });
}
function maxWinScreen(amount) {
  return new Promise(res => {
    const ov = document.createElement('div'); ov.className = 'bigwin';
    ov.innerHTML = `<div><div class="tier up">MAX WIN</div><div class="amt">${fmt(amount)}</div><div class="hint">${T.tapCont}</div></div>`;
    document.body.appendChild(ov); fxOn = true; runFx(); SFX.big(); setTimeout(SFX.big, 500);
    const close = () => { if (!ov.isConnected) return; fxOn = false; ov.remove(); res(); };
    ov.onclick = close; setTimeout(close, 6000);
  });
}

/* ============ LECTURE D'UNE PARTIE (événements) ============ */
// Renvoie le gain total de la partie, en × la mise.
async function playBook(events, b, mode) {
  let final = 0, maxShown = false, hadBonus = false, before = 0;
  showMsg(T.luck); showAmt(0); lastTotal = 0;
  for (const e of events) {
    switch (e.type) {
      case 'reveal':
        if (e.gameType === 'basegame') { crewNow = -1; }
        await spinReels(boardOf(e.board), e.gameType === 'freegame');
        break;
      case 'crew': await crewEnter(e); break;
      case 'winInfo': await showWins(e, b); break;
      case 'scatters':
        boardEl.classList.add('showing'); e.cells.forEach(c => cellEl(c).classList.add('sc')); SFX.scatter(); await sleep(1100); break;
      case 'freeSpinTrigger': {
        hadBonus = true; inFS = true; before = lastTotal; document.body.classList.add('fs'); updateUI();
        setCrewBar(e.crew, -1);
        $('fsInfo').hidden = false; $('fsLeft').textContent = e.count; $('fsWin').textContent = fmt(0);
        const roster = CFG.CREW.map(p => `<div class="${e.crew.includes(p.id) ? '' : 'off'}">${crewSVG(p.id)}<span><b>x${p.mult}</b>${T.crew[p.id]}</span></div>`).join('');
        await modal(`<div class="kicker">${mode === 'base' ? T.trig : T.modeName[mode]}</div><h2>${T.spins(e.count)}</h2><p>${T.intro}</p>${mode === 'super' ? '<p><b>' + T.introSup + '</b></p>' : ''}<div class="crewgrid">${roster}</div>`, [[T.start, 1]]);
        break;
      }
      case 'freeSpin': $('fsLeft').textContent = e.left; clearMarks(); break;
      case 'freeSpinRetrigger': $('fsLeft').textContent = e.left; toast(T.retrig(e.added)); SFX.big(); await sleep(900); break;
      case 'freeSpinEnd': {
        await sleep(400);
        const amt = (before + e.total) / 100 * b;          // gain du spin déclencheur compris
        await modal(`<div class="kicker">${e.maxed ? T.maxed : T.over}</div><h2>${fmt(amt)}</h2><p>${T.inSpins(e.played)}</p>`, [[T.cont, 1]]);
        inFS = false; crewNow = -1; document.body.classList.remove('fs'); $('fsInfo').hidden = true; setCrewBar(null, -1); updateUI();
        break;
      }
      case 'winCap': await maxWinScreen(e.amount / 100 * b); maxShown = true; break;
      case 'finalWin': final = e.amount / 100; break;
    }
  }
  clearMarks();
  showAmt(final * b);
  showMsg(final > 0 ? (hadBonus ? T.bonusDone : T.win) : T.nowin);
  if (!maxShown && final > 0) await bigWin(final * b, b);
  return final;
}

/* ============ SERVEUR DE JEU (Stake Engine RGS) ============ */
const Backend = (() => {
  const sid = Q.get('sessionID'), rgs = Q.get('rgs_url');
  const live = !!(sid && rgs) && !REPLAY && !DEMO;
  const base = rgs ? (/^https?:\/\//.test(rgs) ? rgs : 'https://' + rgs).replace(/\/+$/, '') : '';
  let round = null, demoWin = 0;
  async function call(method, path, body) {
    let r, d = {};
    try { r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); }
    catch (e) { const er = new Error('network'); er.code = 'NET'; throw er; }
    try { d = await r.json(); } catch (e) {}
    if (!r.ok || d.error) { const er = new Error(d.message || d.error || ('HTTP ' + r.status)); er.code = d.error || d.code || ('HTTP' + r.status); throw er; }
    return d;
  }
  const eventsOf = rd => Array.isArray(rd && rd.state) ? rd.state : (rd && rd.state && rd.state.events) || [];
  return {
    live, hasRgs: !!rgs,
    async authenticate() { const d = await call('POST', '/wallet/authenticate', { sessionID: sid, language: LANG }); round = d.round || null; return d; },
    pendingRound() { return round && round.active && eventsOf(round).length ? { events: eventsOf(round), mode: round.mode, amount: round.amount } : null; },
    async play(mode, b) {
      if (DEMO) { const r = ENG.playRound(mode); setBalance(balance - b * CFG.MODES[mode].cost); demoWin = r.payoutMultiplier / 100 * b; return r.events; }
      const d = await call('POST', '/wallet/play', { sessionID: sid, mode, amount: Math.round(b * 1e6), currency: CURRENCY });
      if (d.balance) setBalance(d.balance.amount / 1e6);
      round = d.round;
      const ev = eventsOf(d.round);
      if (!ev.length) { const er = new Error('empty round'); er.code = 'ERR_GEN'; throw er; }
      return ev;
    },
    async endRound() {
      if (DEMO) { setBalance(balance + demoWin); demoWin = 0; return; }
      if (round && round.active) { const d = await call('POST', '/wallet/end-round', { sessionID: sid }); if (d.balance) setBalance(d.balance.amount / 1e6); }
      round = null;
    },
    async balance() { if (DEMO) return; try { const d = await call('POST', '/wallet/balance', { sessionID: sid }); if (d.balance && !busy) setBalance(d.balance.amount / 1e6); } catch (e) {} },
    async replay() {
      const p = k => encodeURIComponent(Q.get(k) || '');
      const d = await call('GET', `/bet/replay/${p('game')}/${p('version')}/${p('mode')}/${p('event')}`);
      const rd = d.round || d;
      return { events: eventsOf(rd), cost: +(d.costMultiplier || rd.costMultiplier || 0) || null };
    }
  };
})();

/* erreurs : fenêtre normale, ou écran bloquant (session invalide, serveur injoignable au lancement) */
function errText(err) { const code = err && err.code; return { code, txt: (code && T.err[code]) || T.err.def }; }
function showError(err) {
  const { code, txt } = errText(err); console.error(err);
  modal(`<h2 style="font-size:26px">${txt}</h2>${code && code !== 'NET' ? `<p style="color:var(--mute);font-size:13px">${code}</p>` : ''}`, [[T.close, 1]]);
}
function bootScreen(html) { let el = $('boot'); if (!el) { el = document.createElement('div'); el.id = 'boot'; el.className = 'boot'; document.body.appendChild(el); } el.innerHTML = '<div>' + html + '</div>'; el.hidden = false; }
function bootDone() { const el = $('boot'); if (el) el.remove(); }
function fatal(err, txt) { const e = err ? errText(err) : { txt, code: null }; if (err) console.error(err); busy = true; updateUI(); bootScreen(`<h2>${e.txt}</h2>${e.code && e.code !== 'NET' ? `<p style="opacity:.7;font-size:13px">${e.code}</p>` : ''}`); }

/* session : durée et position nette (si la juridiction l'exige) */
let sessStart = Date.now(), net = 0;
function paintSession() {
  if (!(JUR.displaySessionTimer || JUR.displayNetPosition)) return;
  const el = $('sess'); el.hidden = false;
  const s = Math.floor((Date.now() - sessStart) / 1000), hh = String(Math.floor(s / 3600)).padStart(2, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
  el.textContent = [JUR.displaySessionTimer ? `${T.session} ${hh}:${mm}:${ss}` : '', JUR.displayNetPosition ? `${T.net} ${net >= 0 ? '+' : ''}${fmt(net)}` : ''].filter(Boolean).join(' · ');
}
setInterval(paintSession, 1000);

/* une partie : demande au serveur, animation, fin de partie */
async function playRound(mode, b, resumeEvents) {
  busy = true; updateUI();
  const t0 = Date.now();
  let events = resumeEvents;
  if (!events) {
    try { events = await Backend.play(mode, b); }
    catch (err) { busy = false; stopAuto(); if (err.code === 'ERR_IS' || err.code === 'ERR_ATE') fatal(err); else showError(err); return false; }
  }
  const won = await playBook(events, b, mode);
  const minMs = +JUR.minimumRoundDuration || 0, minDur = minMs > 0 && minMs < 100 ? minMs * 1000 : minMs;
  if (Date.now() - t0 < minDur) await new Promise(r => setTimeout(r, minDur - (Date.now() - t0)));
  try { await Backend.endRound(); } catch (err) { showError(err); }
  net += won * b - (resumeEvents ? 0 : b * CFG.MODES[mode].cost);
  busy = false; updateUI(); paintSession();
  return true;
}

/* ============ ACTIONS ============ */
function stopAuto() { autoLeft = 0; $('autoSel').value = '0'; updateUI(); }
async function spin() {
  if (!ready || busy || inFS || REPLAY) return;
  const b = bet();
  if (balance < b) { showError({ code: 'ERR_IPB' }); stopAuto(); return; }
  const ok = await playRound('base', b);
  if (ok && autoLeft > 0) {
    autoLeft--;
    if (autoLeft === 0) { stopAuto(); return; }
    updateUI(); await sleep(200);
    if (autoLeft > 0 && !busy && !inFS) spin();
  }
}
async function buy(sup) {
  if (!ready || busy || inFS || REPLAY || JUR.disabledBuyFeature) return;
  const b = bet(), mode = sup ? 'super' : 'bonus', price = b * CFG.MODES[mode].cost;
  if (balance < price) { showError({ code: 'ERR_IPB' }); return; }
  const ok = await modal(`<div class="kicker">${sup ? T.sup : T.buy}</div><h2>${fmt(price)}</h2><p>${T.confirm(fmt(b), sup)}</p>`, [[T.cancel, false, 'ghost'], [T.buyBtn, true]]);
  if (!ok) return;
  if (balance < price) { showError({ code: 'ERR_IPB' }); return; }
  stopAuto();
  await playRound(mode, b);
}

function showRules() {
  const b = bet();
  const head = `<tr><th></th><th>3</th><th>4</th><th>5</th></tr>`;
  const rows = CFG.PAYTABLE.map((p, i) => `<tr><td>${symSVG(String(i))} ${T.syms[i]}</td>${p.map(v => `<td>${fmt(v / 100 * b)}</td>`).join('')}</tr>`).join('');
  const crew = `<div class="tablewrap"><table class="pay"><tr><th>${T.crewHead[0]}</th><th>${T.crewHead[1]}</th><th>${T.crewHead[2]}</th></tr>` +
    CFG.CREW.map(p => `<tr><td>${crewSVG(p.id)} ${T.crew[p.id]}</td><td>x${p.mult}</td><td>${Math.min(...p.wilds)}–${Math.max(...p.wilds)}</td></tr>`).join('') + '</table></div>';
  const controls = T.controls.filter(([k]) => !(JUR.disabledBuyFeature && /onus/.test(k)) && !(JUR.disabledAutoplay && k === 'Auto') && !(JUR.disabledTurbo && k === 'Turbo') && !(JUR.disabledSpacebar && /Space|Espace/.test(k)))
    .map(([k, v]) => `<b>${k}</b><span>${v}</span>`).join('');
  const icon = c => symSVG(c).replace('<svg', '<svg style="width:30px;height:30px;vertical-align:middle"');
  modal(T.rules({ bet: fmt(b), table: `<div class="tablewrap"><table class="pay">${head}${rows}</table></div>`, crew, controls, wild: icon('W'), scatter: icon('S'),
    buy: JUR.disabledBuyFeature ? '' : T.rulesBuy(fmt(BUY_STD * b), fmt(BUY_SUP * b)), maxwin: fmt(MAX_WIN_X * b) }), [[T.close, 1]], true);
}

function updateUI() {
  const b = bet(), lock = busy || inFS || !ready || REPLAY;
  $('betVal').textContent = fmt(b);
  $('betDown').disabled = lock || betIdx === 0; $('betUp').disabled = lock || betIdx === BETS.length - 1;
  $('spinBtn').disabled = (lock && autoLeft === 0) || !ready;
  $('spinBtn').classList.toggle('auto', autoLeft > 0);
  $('autoCnt').hidden = autoLeft <= 0; $('autoCnt').textContent = autoLeft;
  $('spinBtn').setAttribute('aria-label', autoLeft > 0 ? T.stopAuto(autoLeft) : T.spinAria); $('spinBtn').title = $('spinBtn').getAttribute('aria-label');
  $('buyStd').disabled = lock; $('buySup').disabled = lock;
  $('buyStd').classList.toggle('short', balance < b * BUY_STD); $('buySup').classList.toggle('short', balance < b * BUY_SUP);
  $('pBuy').textContent = fmt(b * BUY_STD); $('pSup').textContent = fmt(b * BUY_SUP);
  $('autoSel').disabled = lock && autoLeft === 0;
}

/* ============ BRANCHEMENTS ============ */
$('spinBtn').onclick = () => { A(); if (autoLeft > 0) { stopAuto(); return; } SFX.click(); spin(); };
$('betDown').onclick = () => { if (betIdx > 0 && !busy) { betIdx--; SFX.click(); updateUI(); } };
$('betUp').onclick = () => { if (betIdx < BETS.length - 1 && !busy) { betIdx++; SFX.click(); updateUI(); } };
$('buyStd').onclick = () => { A(); buy(false); };
$('buySup').onclick = () => { A(); buy(true); };
$('turboBtn').onclick = e => { turbo = !turbo; e.currentTarget.setAttribute('aria-pressed', turbo); SFX.click(); };
/* autoplay : confirmation avant de démarrer */
$('autoSel').onchange = async e => {
  A(); const n = +e.target.value; e.target.blur();
  if (n <= 0) { stopAuto(); return; }
  if (!ready || busy || inFS) { e.target.value = '0'; return; }
  const ok = await modal(`<h2 style="font-size:26px">${T.autoAsk(n)}</h2>`, [[T.cancel, false, 'ghost'], [T.autoStart, true]]);
  if (!ok) { stopAuto(); return; }
  autoLeft = n; updateUI(); spin();
};
$('rulesBtn').onclick = () => { SFX.click(); showRules(); };
function paintMute() {
  $('muteIcon').innerHTML = muted ? '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l5 6M22 9l-5 6"/>' : '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12"/>';
  $('muteBtn').setAttribute('aria-label', muted ? T.soundOn : T.soundOff); $('muteBtn').title = muted ? T.soundOn : T.soundOff;
}
function paintMusic() { const b = $('musicBtn'); b.setAttribute('aria-pressed', Music.on); b.title = Music.on ? T.musicOff : T.musicOn; b.setAttribute('aria-label', b.title); }
$('muteBtn').onclick = () => { muted = !muted; try { localStorage.setItem('jw-muted', muted ? '1' : '0'); } catch (e) {} paintMute(); A(); SFX.click(); Music.sync(); };
$('musicBtn').onclick = () => { A(); Music.toggle(); };
/* barre espace : toujours un spin (hors fenêtres et listes), jamais un clic sur le bouton qui a le focus */
addEventListener('keydown', e => {
  if (e.code !== 'Space' && e.key !== ' ') return;
  if (document.querySelector('.ov,.bigwin,.boot')) { e.preventDefault(); e.stopPropagation(); return; }   // jamais de validation d'une fenêtre à la barre espace
  if (JUR.disabledSpacebar || REPLAY || document.activeElement.tagName === 'SELECT') return;
  e.preventDefault(); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); A(); if (!e.repeat) spin();
}, true);
addEventListener('pointerup', () => { const a = document.activeElement; if (a && a.tagName === 'BUTTON') a.blur(); });
addEventListener('pointerdown', () => { A(); Music.kick(); }, { once: true });
addEventListener('keydown', () => { A(); Music.kick(); }, { once: true });

/* ============ DÉMARRAGE ============ */
function applyLang() {
  const set = (id, html) => { const el = $(id); if (el) el.innerHTML = html; };
  set('tBalance', T.balance); set('tBuy', T.buy); set('tBuyD', T.buyD); set('tSup', T.sup); set('tSupD', T.supD);
  set('tFsLeft', T.fsLeft); set('tFsWin', T.fsWin); set('tBet', T.bet); if (!busy) showMsg(T.hint);
  const tip = (id, t) => { const el = $(id); if (el) { el.title = t; el.setAttribute('aria-label', t); } };
  tip('rulesBtn', T.rulesTip); tip('betDown', T.dec); tip('betUp', T.inc); tip('spinBtn', T.spinAria); tip('autoSel', T.autoTip); tip('turboBtn', T.turboTip); tip('buyStd', T.buyTip); tip('buySup', T.supTip);
  document.documentElement.lang = LANG; paintMute(); paintMusic(); buildCrewBar();
}
function applyJurisdiction() {
  if (JUR.disabledTurbo) { $('grpTurbo').hidden = true; turbo = false; }
  if (JUR.disabledAutoplay) { $('grpAuto').hidden = true; autoLeft = 0; }
  if (JUR.disabledBuyFeature) { $('buyStd').hidden = true; $('buySup').hidden = true; }
}
function startGrid() {
  let ev; do { ev = ENG.playRound('base').events; } while (ev.length !== 2);     // un plateau sans gain ni Bonus (décor de départ uniquement)
  grid = boardOf(ev[0].board); drawBoard();
}
/* niveaux de mise : uniquement ceux du serveur, bornés par minBet / maxBet / stepBet */
function betLevelsFrom(c) {
  const min = +c.minBet || 0, max = +c.maxBet || Infinity, step = +c.stepBet || 0;
  const ok = v => v >= min && v <= max && (!step || v % step === 0);
  let lv = Array.isArray(c.betLevels) ? c.betLevels.filter(ok) : [];
  if (!lv.length && min && step && isFinite(max)) { for (let v = min; v <= max && lv.length < 40; v += step) lv.push(v); }
  return lv;
}
async function runReplay() {
  document.body.classList.add('replay');
  const amount = (+Q.get('amount') || 1e6) / 1e6, mode = String(Q.get('mode') || 'base').toLowerCase();
  BETS = [amount]; betIdx = 0; CURRENCY = Q.get('currency') || null; $('balance').textContent = '—';
  let data;
  try { data = await Backend.replay(); } catch (err) { fatal(err); return; }
  if (!data.events.length) { fatal({ code: 'ERR_GEN' }); return; }
  const cost = data.cost || (CFG.MODES[mode] ? CFG.MODES[mode].cost : 1);
  const banner = $('rpBanner'); banner.hidden = false;
  banner.textContent = T.replayBanner((T.modeName[mode] || mode).toUpperCase(), fmt(amount), cost !== 1 ? fmt(amount * cost) + ' (' + cost + '×)' : '');
  const machine = document.querySelector('.machine');
  const play = () => new Promise(res => { const o = document.createElement('div'); o.className = 'rp-play'; o.innerHTML = `<button type="button">▶ ${T.replayPlay}</button>`; machine.appendChild(o); o.querySelector('button').onclick = () => { A(); o.remove(); res(); }; });
  for (;;) {
    await play();
    document.querySelectorAll('.rp-end').forEach(e => e.remove());
    busy = true; const won = await playBook(data.events, amount, mode); busy = false;
    const end = document.createElement('div'); end.className = 'rp-end';
    end.innerHTML = `<span>${T.replayDone} · ${T.replayWin(fmt(won * amount))}</span><button type="button">${T.replayAgain}</button>`;
    machine.appendChild(end);
    await new Promise(res => { end.querySelector('button').onclick = () => { end.remove(); res(); }; });
  }
}
(async function init() {
  applyLang(); startGrid(); updateUI();
  if (REPLAY) { if (!Backend.hasRgs) { fatal(null, T.noSession); return; } runReplay(); return; }
  if (DEMO) {
    BETS = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100]; betIdx = 3; setBalance(1000);
    ready = true; updateUI(); return;
  }
  if (!Backend.live) { fatal(null, T.noSession); return; }
  busy = true; updateUI(); bootScreen(`<div class="spinner"></div><div>${T.loading}</div>`);
  try {
    const d = await Backend.authenticate();
    CURRENCY = d.balance && d.balance.currency || null;
    const c = d.config || {};
    Object.assign(JUR, c.jurisdiction || {});
    if (JUR.socialCasino) SOC = true;
    setTexts();
    const levels = betLevelsFrom(c);
    if (!levels.length) { fatal({ code: 'ERR_VAL' }); return; }
    BETS = levels.map(v => v / 1e6);
    const def = BETS.indexOf((c.defaultBetLevel || 0) / 1e6);
    betIdx = def >= 0 ? def : Math.max(0, BETS.findIndex(v => v >= 1));
    applyJurisdiction(); applyLang();
    setBalance(d.balance ? d.balance.amount / 1e6 : 0);
    setInterval(() => Backend.balance(), 60000);
    ready = true; busy = false; bootDone(); updateUI();
    const pending = Backend.pendingRound();
    if (pending) {
      const pb = pending.amount ? pending.amount / 1e6 : bet(); const i = BETS.indexOf(pb); if (i >= 0) betIdx = i;
      await playRound(String(pending.mode || 'base').toLowerCase(), pb, pending.events);
    }
  } catch (err) { fatal(err); return; }
  paintSession();
})();
