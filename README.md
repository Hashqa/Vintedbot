# Jolly Wilds

Machine à sous pirate pour **Stake Engine** : 5 rouleaux × 4 rangées, **1024 façons de gagner**, et un bonus où **un personnage différent monte à bord à chaque free spin**. Chaque personnage pose ses propres wilds, avec son propre multiplicateur.

Le dépôt contient tout ce que demande Stake : le front-end, les fichiers mathématiques, la tuile 3:4, la couverture 16:9 et les deux zips prêts à envoyer.

## Le jeu

- **Gains en façons** : des symboles identiques sur 3, 4 ou 5 rouleaux voisins, en partant de la gauche, à n'importe quelle position. Chaque combinaison d'une position par rouleau est une façon (jusqu'à 1024).
- **Wild** (drapeau pirate) sur les rouleaux 2 à 5 en jeu de base.
- **Free spins** : 3, 4 ou 5 symboles Bonus donnent 10, 12 ou 15 free spins. 3 Bonus pendant le bonus ajoutent 5 spins.
- **Gain maximum** : 10 000 fois la mise.

### Le bonus de l'équipage

À chaque free spin, un personnage est tiré au sort. Il monte à bord et pose ses wilds au hasard sur les rouleaux 2 à 5. Ses wilds portent son multiplicateur.

| Personnage | Multiplicateur | Wilds posés | Fréquence |
|---|---|---|---|
| Mousse | x2 | 2 à 4 | très fréquent (39 %) |
| Perroquet | x3 | 2 à 3 | fréquent (26 %) |
| Cuistot | x5 | 1 à 3 | 18 % |
| Canonnier | x10 | 1 à 2 | 11 % |
| Capitaine | x25 | 1 à 2 | rare (4,6 %) |
| Kraken | x100 | 1 à 2 | très rare (1 %) |

Les petits personnages posent plus de wilds, les grands en posent moins mais multiplient beaucoup plus. Si une façon passe par plusieurs wilds de l'équipage, leurs multiplicateurs s'additionnent (deux wilds x25 = x50). Une façon sans wild de l'équipage compte x1.

### Modes de jeu

| Mode | Nom côté serveur | Coût | Contenu |
|---|---|---|---|
| Jeu normal | `base` | 1 × la mise | bonus naturel environ 1 spin sur 290 |
| Achat du bonus | `bonus` | 100 × la mise | 10 free spins ou plus, tout l'équipage |
| Super bonus | `super` | 400 × la mise | équipage d'élite seulement (Cuistot x5 → Kraken x100), un wild de plus à chaque spin |

## Contenu du dépôt

```
frontend/                 le jeu, à envoyer sur Stake (index.html à la racine)
  index.html              mise en page et styles
  app.js                  logique : serveur Stake, animations, rejeu, textes EN/FR
  art.js                  symboles et personnages dessinés en SVG (aucune image externe)
  engine.js               moteur du jeu (partagé avec le générateur mathématique)
  theme/fonts/            polices embarquées (licence SIL OFL)
math/
  generate.js             fabrique les fichiers mathématiques Stake et les vérifie
  publish/                les 7 fichiers à envoyer (index.json, livres .jsonl.zst, tables .csv)
  report.json             statistiques de chaque mode
stake/
  tile-3x4.png            tuile 1200×1600
  cover-16x9.png          couverture 1920×1080
  a-envoyer-sur-stake/    jolly-wilds-frontend.zip et jolly-wilds-math.zip
tools/
  simulate.js             simulateur (retour au joueur, part de chaque personnage)
  mock-rgs.js             faux serveur Stake pour tester en local
  verify_stake.py         contrôles officiels du Math SDK de Stake
  covers.html, render-covers.js   tuile et couverture
  package.py              fabrique les deux zips
```

## Mathématiques

Les trois modes passent les contrôles officiels du Math SDK de Stake Engine (`utils/rgs_verification.py`) :

| Mode | Retour au joueur | Gain max | etl40b | etl10k |
|---|---|---|---|---|
| base | 96,20 % | 10 000 × | 0,33 | 0,002 |
| bonus | 96,20 % | 10 000 × | 0,15 | 0,15 |
| super | 96,20 % | 10 000 × | 0,00 | 0,15 |

- Paiements entiers en centièmes de mise, multiples de 10 (donc par paliers de 0,1 × la mise) ; poids entiers ; livres identiques aux tables.
- Écart de retour entre les modes : nul.
- Moteur : 150 000 parties normales et 12 000 parties par mode bonus, plus 40 parties « gain max » par mode. Les poids sont calculés pour viser exactement 96,2 % tout en respectant les limites de volatilité.

## Publier sur Stake Engine

1. **Médias** : ajoute `stake/tile-3x4.png` et `stake/cover-16x9.png` dans la bibliothèque média du jeu. Place la tuile comme couverture.
2. **Mathématiques** : dans « Téléchargement des fichiers », envoie les 7 fichiers de `math/publish/` (ou le contenu de `jolly-wilds-math.zip`), sans sous-dossier. Publie la version.
3. **Front-end** : envoie le contenu de `frontend/` (ou de `jolly-wilds-frontend.zip`) : `index.html` doit être à la racine. Publie la version.
4. **Niveaux de mise** : choisis un modèle de niveaux de mise dans le tableau de bord. Le jeu lit les niveaux envoyés par le serveur.
5. Lance la validation, puis la soumission.

## Conformité Stake (reprise de la revue de Spooky Burst)

Le front-end intègre dès le départ toutes les corrections demandées lors de la revue de la première machine :

- mise en page sans défilement sur ordinateur, mobile (portrait) et petite fenêtre (400×225) ; zoom désactivé ;
- polices embarquées, aucune ressource externe, pas de requête favicon ;
- partie demandée au serveur (`/wallet/authenticate`, `/wallet/play`, `/wallet/end-round`), solde toujours celui du serveur ;
- reprise d'une partie interrompue ;
- rejeu (`?replay=true`) : bouton Lancer, bandeau mode / mise / coût, résultat affiché à la fin, fenêtres qui avancent seules ;
- niveaux de mise du serveur uniquement (bornés par `minBet`, `maxBet`, `stepBet`) ;
- devises, dont GC et SC, et montants plus petits que la précision de la devise ;
- options de juridiction : turbo, autoplay, achat de bonus, barre espace, durée minimale d'une partie, minuteur de session, position nette, casino social ;
- vocabulaire social (« Play amount », « Start » au lieu de « Bet », « Buy ») ;
- erreurs du serveur traduites, écran bloquant si la session est invalide ;
- autoplay avec confirmation ; barre espace qui ne valide jamais une fenêtre ;
- info-bulle et libellé sur chaque commande ; anglais complet et français ;
- règles complètes : table des gains à la mise en cours, équipage, achats, gain max, retour au joueur, commandes, avertissement.

## Tester en local

```bash
node tools/mock-rgs.js 8787
# puis ouvrir http://localhost:8787/index.html?sessionID=test&lang=fr&rgs_url=http://localhost:8787
```

Démo sans serveur, en crédits fictifs : ouvrir `frontend/index.html?demo=true` (servi par n'importe quel serveur statique, par exemple `npx serve frontend`).

## Refaire les fichiers

Après toute modification des gains dans `frontend/engine.js`, il faut régénérer les mathématiques **et** renvoyer le front-end :

```bash
node tools/simulate.js 200000 3000                  # vérifier l'équilibre (≈ 10 s)
node math/generate.js 150000 12000 12000            # fichiers mathématiques (≈ 40 s)
git clone https://github.com/StakeEngine/math-sdk tools/math-sdk && pip install zstandard numpy
python3 tools/verify_stake.py math/publish          # contrôles officiels
node tools/render-covers.js                         # tuile et couverture (Playwright)
python3 tools/package.py                            # les deux zips
```

## Avant toute exploitation en argent réel

Stake Engine fournit la licence, le serveur de jeu et la certification. En dehors de Stake, une version en argent réel demande une licence de jeux d'argent (ou un opérateur qui en a une) et la certification du générateur aléatoire et du taux de retour par un laboratoire agréé.
