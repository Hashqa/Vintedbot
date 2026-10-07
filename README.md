# Jolly Wilds

Machine à sous pirate pour **Stake Engine** : 5 rouleaux × 4 rangées, **1024 façons de gagner**, et un bonus à **wilds collants** : à chaque free spin, un personnage de l'équipage peut monter à bord et poser un wild qui **reste en place jusqu'à la fin du bonus**, avec son propre multiplicateur.

Le dépôt contient tout ce que demande Stake : le front-end, les fichiers mathématiques, la tuile 3:4, la couverture 16:9, les calques pour l'éditeur de tuile et les deux zips prêts à envoyer.

## Le jeu

- **Gains en façons** : des symboles identiques sur 3, 4 ou 5 rouleaux voisins, en partant de la gauche, à n'importe quelle position. Chaque combinaison d'une position par rouleau est une façon (jusqu'à 1024).
- **Wild** (drapeau pirate) sur les rouleaux 2 à 5 en jeu de base.
- **Free spins** : 3, 4 ou 5 symboles Bonus donnent 8, 10 ou 12 free spins. 3 Bonus pendant le bonus ajoutent 3 spins, et les wilds déjà posés restent.
- **Gain maximum** : 10 000 fois la mise, dans chaque mode.

### Le bonus de l'équipage (wilds collants)

À chaque free spin, un personnage peut monter à bord (environ un spin sur 3,3). Il pose un wild sur une position libre des rouleaux 2 à 5. **Ce wild ne repart plus** : il reste jusqu'à la fin du bonus et garde le multiplicateur de son personnage. Les wilds de personnages différents s'accumulent donc sur les rouleaux au fil des spins.

| Personnage | Multiplicateur de son wild | Part des abordages (Bonus) | Super bonus |
|---|---|---|---|
| Matelot | x2 | 39 % | non |
| Perroquet | x3 | 26 % | non |
| Cuistot | x5 | 18 % | oui |
| Canonnier | x10 | 11 % | oui |
| Capitaine | x25 | 4,6 % | oui |
| Kraken | x100 | 1 % | oui |

Si une façon passe par plusieurs wilds de l'équipage, leurs multiplicateurs s'additionnent (x5 + x10 = x15). Une façon sans wild de l'équipage compte x1.

### Modes de jeu

| Mode | Nom côté serveur | Coût | Contenu |
|---|---|---|---|
| Jeu normal | `base` | 1 × la mise | bonus naturel environ 1 spin sur 250 |
| Achat du bonus | `bonus` | 100 × la mise | 8 free spins ou plus, tout l'équipage |
| Super bonus | `super` | 200 × la mise | 8 free spins ou plus, équipage d'élite seulement (chaque wild vaut de x5 à x100) |

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
  tile-layers/            calques pour l'éditeur de tuile du Studio : fonds seuls, personnages sur fond transparent
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
| base | 96,20 % | 10 000 × | 0,38 | 0,002 |
| bonus | 96,20 % | 10 000 × | 0,74 | 0,15 |
| super | 96,20 % | 10 000 × | 0,15 | 0,15 |

- Paiements entiers en centièmes de mise, multiples de 10 (donc par paliers de 0,1 × la mise) ; poids entiers ; livres identiques aux tables.
- Écart de retour entre les modes : nul.
- Moteur : 150 000 parties normales et 12 000 parties par mode bonus, plus 40 parties « gain max » par mode. Les poids sont calculés pour viser exactement 96,2 % tout en respectant les limites de volatilité.

## Publier sur Stake Engine

1. **Médias** : dans le Studio, Media → Create tile. Utilise `stake/tile-layers/background-*.png` comme fond et `stake/tile-layers/foreground-crew-*.png` comme premier plan, puis ajoute le titre « Jolly Wilds » avec une police de l'éditeur. `stake/tile-3x4.png` et `stake/cover-16x9.png` montrent le rendu attendu. Les visuels sont clairs, sans bords sombres, sans texte promotionnel ni multiplicateur, comme l'exige la grille.
2. **Mathématiques** : dans « Téléchargement des fichiers », envoie les 7 fichiers de `math/publish/` (ou le contenu de `jolly-wilds-math.zip`), sans sous-dossier. Publie la version.
3. **Front-end** : envoie le contenu de `frontend/` (ou de `jolly-wilds-frontend.zip`) : `index.html` doit être à la racine. Publie la version.
4. **Niveaux de mise** : choisis un modèle de niveaux de mise dans le tableau de bord. Le jeu lit les niveaux envoyés par le serveur.
5. Lance la validation, puis la soumission.

## Conformité avec la grille Stake Engine

Le jeu a été vérifié point par point avec les pages « Approval guidelines » de la documentation Stake (communication front-end, RGS, rejeu, juridictions, avertissement, tuiles, vérification mathématique) :

- **Restrictions** : jeu sans état, pas de jackpot ni de quitte ou double ; personnages tous adultes (le Mousse a été remplacé par un Matelot, Stake refuse les personnages enfantins).
- **Affichage** : sans défilement sur ordinateur, mobile et Popout S/L ; zoom désactivé ; polices et images servies avec le jeu, aucune ressource externe ; aucun message dans la console.
- **Règles** : table des gains à la mise en cours, tous les multiplicateurs possibles, déclenchement et relance des free spins, coût de chaque mode, retour au joueur et gain maximum par mode, guide des commandes, avertissement général complet.
- **Commandes** : changement de mise, solde affiché, gain final affiché et mis à jour au fil des gains, coupure du son, barre espace = lancer, autoplay avec confirmation, confirmation pour tout mode coûtant plus de 2 fois la mise.
- **RGS** : tous les niveaux de mise du serveur, mise de la partie en cours restaurée à la reprise, pas de `/play` si le solde manque, `/end-round` seulement pour une partie gagnante, `rgs_url` jamais en dur (erreur affichée si invalide), petits montants avec la bonne précision, toutes les devises de la table Stake (symbole, décimales, position).
- **Rejeu** (`?replay=true`) : chargement automatique, bouton Play, aucune action de mise ni appel de session, mode / mise / coût réel affichés, gain et multiplicateur à la fin, bouton Play again, message si la partie ne se charge pas, fonctionne en Popout S et en mode social.
- **Mode social** (`social=true` ou `socialCasino`) : anglais uniquement, aucun terme interdit (« Play amount », « Get bonus », « Total play »…), devises SC et GC sans « $ ».
- **Langues** : anglais et français ; toute autre langue retombe sur l'anglais.

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
