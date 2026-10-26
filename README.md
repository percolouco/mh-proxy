# mh-proxy 🛡️

Reverse proxy devant le jeu **MountyHall** (`games.mountyhall.com`), pour y jouer depuis n'importe quel appareil
avec une **surcouche perso** (CSS/JS) sans rien installer sur le poste.

- **URL** : https://mh2.nas.percolouco.com (mêmes chemins que MH, ex. `/mountyhall/MH_Play/PlayStart2.php`)
- **Stack** : nginx (conteneur `mh-proxy`) derrière Traefik, certificat Let's Encrypt

## Fonctionnement

- Relaie toutes les requêtes vers `https://games.mountyhall.com` (en-tête `Host` d'origine).
- Réécrit les redirections (`Location`), les cookies (domaine) et les liens absolus vers MH.
- **Mobile** : MH redirige les smartphones vers `smartphone.mountyhall.com` d'après le User-Agent. Le proxy présente un User-Agent « bureau » à MH quand le client est mobile/tablette (`map $http_user_agent` dans `nginx.conf`) : le jeu complet (avec la surcouche) s'affiche donc aussi sur téléphone.
- Désactive la compression amont pour pouvoir modifier le HTML, et injecte avant `</head>` de chaque page :
  `/_mhx/custom.css` et `/_mhx/custom.js` (fichiers du dossier `custom/`, servis sans cache).
- `custom.js` est protégé par `window.__mhx` contre une double exécution.
- `custom.js` ajoute un bouton **IT** dans le menu de gauche (sous « Ma vue ») qui ouvre `https://mh.percolouco.com/tactique/tactique.php` dans le cadre de contenu ; images `custom/img/interfaceit.jpg` (normal) et `interfaceit2.jpg` (survol), style dans `custom.css`.
- `custom.js` intègre aussi les fonctions des userscripts **MHD** (Firefox/Chrome), sans rien installer : un seul code pour tous les navigateurs (pas de `GM_*`, les endpoints de `mh.percolouco.com` autorisent le CORS). Lecture de la page affichée uniquement, jamais d'action dans le jeu :
  - pages **Gestion des Étapes / Récompenses / Équipe** d'une mission : envoi automatique à `mission/includes/update/update_mission.php` (pastille verte/rouge en haut à droite) ;
  - **TurnStart.php** : envoi de la ligne troll à `tactique/includes/sp_mh/parser_handler.php` ;
  - **profil d'un monstre** (`MonsterView.php`) : encart « Analyse Tactique » (DLA estimée, prochain tour/cumul).
- Les pages `frameset` n'ont pas de `</head>` : seule leur contenu (cadres) est injecté, c'est voulu.

## Fichiers

```
mh-proxy/
├── nginx.conf                  # proxy + injection de la surcouche
├── custom/custom.css|js        # surcouche perso (à éditer, pas de rebuild)
├── custom/img/                 # images de la surcouche (bouton IT)
├── deploy/docker-compose.yml   # copié dans /opt/container/mh-proxy/
└── README.md
```

## Déploiement

```bash
cp deploy/docker-compose.yml /opt/container/mh-proxy/ && cd /opt/container/mh-proxy && docker compose up -d
# après modification de nginx.conf : docker compose restart   (pas un simple reload, le fichier est monté)
```

Modifier `custom/custom.css|js` ne demande aucune action : rechargez la page.

## Limites / règles

- Aucun mot de passe ni formulaire n'est loggé. Affichage et lecture uniquement : **jamais d'action automatique dans le jeu** (non autorisé par MH).
- Peut casser si MH change son site (liens absolus, nouveaux domaines).
- Un filtre réseau (travail) peut bloquer le domaine.

## Versioning

| Version | Date | Notes |
|---|---|---|
| 0.1.0 | 2026-10-23 | Reverse proxy minimal + injection CSS/JS, testé (login, frames, accents) |
| 0.2.0 | 2026-10-23 | Bouton « IT » dans le menu → page tactique de mh.percolouco.com |
| 0.3.0 | 2026-10-23 | Plus de redirection vers smartphone.mountyhall.com sur mobile (User-Agent bureau) |
| 0.3.1 | 2026-10-23 | Bouton IT avec les images fournies (normal + survol) |
| 0.3.2 | 2026-10-23 | Bouton IT placé entre « Mon profil » et « Ma vue » |
| 0.3.3 | 2026-10-23 | Bouton IT sous « Ma vue », sans `font-size: 0` |
| 0.4.0 | 2026-10-23 | Page Suivants : DLA de chaque suivant affichée dans son encart (lue dans le `data-json`, aucune requête en plus) |
| 0.5.0 | 2026-10-23 | Fonctions des userscripts MHD intégrées (envoi mission/équipe, infos troll au début de tour, analyse DLA monstre) |
| 0.5.1 | 2026-10-23 | Page Suivants : « poids porté : X minutes / Y minutes restantes » (Y = moitié de la durée du tour moins X) |
| 0.5.3 | 2026-10-23 | Page Suivants : gowaps en couleur via une liste commune (mh.percolouco.com/gowap/gowap_perks.php), couleur au choix, encart de gestion en bas de page, « Ramasse les Trésors » ajouté en vert depuis la page profil du suivant |
| 0.5.4 | 2026-10-23 | Analyse monstre : durée du tour = CDM en priorité (historique seulement sans CDM), début = dernier événement du monstre (« un… »), peut rejouer = début + durée, cumul = peut rejouer + durée |
| 0.5.5 | 2026-10-23 | custom.js : caractères accentués échappés (la page monstre est en ISO-8859-1, le script plantait) |
| 0.6.0 | 2026-10-24 | Résultat du sortilège Téléportation : le portail créé (qui, où, destination, erreur de calcul) est signalé dans le groupe WhatsApp via le serveur MH (notif/portail_whatsapp.php, WAHA) |
| 0.6.1 | 2026-10-24 | Portail WhatsApp : numéro du troll lu uniquement dans la page / les cadres de la session en cours |
| 0.7.0 | 2026-10-24 | Page Ma vue : PV des monstres sur leur ligne, lus dans le popup CDM de Mountyzilla (clic sur le niveau, ouvert masqué puis refermé) ; « xxx-yyy PV » ; ✓ si la CDM a une ligne Blessure (fiable) ; « ~valeur PV » + ⚠ si l’intervalle de confiance jaune est présent (pas encore viable) ; rien pour les Gowap Apprivoisés et les monstres flous |
| 0.7.1 | 2026-10-24 | Page Ma vue : la coche « CDM fiable » est en vert |
| 0.7.2 | 2026-10-24 | Page Ma vue : PV en vert (CDM fiable ✓), orange (CDM simple), rouge (estimation ~ pas encore viable) |
| 0.8.0 | 2026-10-24 | Page Ma vue : colonne « PV » (80 px) entre « Niv. » et « Réf. » (PV lus dans le popup CDM de Mountyzilla ; vert ✓ fiable, orange simple, rouge ~ estimation ⚠) ; rien pour les Familiers (Gowap Apprivoisé, famille « Familier ») |
| 0.8.1 | 2026-10-24 | Page Ma vue : colonne PV en police 12px |
| 0.8.2 | 2026-10-24 | Page Ma vue : colonne PV sans sigles (couleur et ~ seulement), en-tête PV au style des autres en-têtes |
| 0.9.0 | 2026-10-24 | Page Ma vue : colonnes PA (après Actions) et PV (avant Réf.) des trolls, lues dans le récap tactique du serveur MH (endpoint `notif/trolls_etat.php`) |
| 0.9.1 | 2026-10-24 | Page Ma vue : colonne PV des trolls réduite (66 px) |
| 0.9.2 | 2026-10-24 | Page Ma vue : colonne « DLA dans... » (temps restant avant la prochaine DLA, ex. 4h00) |
| 0.9.3 | 2026-10-24 | Page Ma vue : « DLA dans... » aussi pour les trolls dont la DLA enregistrée est dépassée (estimation avec la durée du tour, affichée avec ~) |
| 0.9.4 | 2026-10-24 | Page Ma vue : colonne « DLA à... » (heure de la prochaine DLA, temps restant au survol) |
| 0.9.5 | 2026-10-24 | Page Ma vue : colonnes PA (20 px) et DLA à... (50 px) plus étroites |
| 0.10.0 | 2026-10-24 | Page Ma vue : les trolls admin visibles dans IT absents de la vue sont ajoutés (données du serveur MH, actions vides, distance calculée) |
| 0.11.0 | 2026-10-24 | Résultat d'un Lancer de Créatures (saisie + lancer, dégâts cumulés, morts) envoyé dans le groupe WhatsApp (`notif/lancer_whatsapp.php`) |
| 0.12.0 | 2026-10-24 | Attaque réussie sur un monstre (sortilège ou compétence) envoyée dans le groupe WhatsApp : dégâts, PV perdus, mort, butin |
| 0.12.1 | 2026-10-24 | Message d'attaque : nom du sortilège ou de la compétence lu dans le titre de l'écran de résultat |
| 0.12.2 | 2026-10-24 | Message d'attaque : ligne XP au-dessus de 2 PX, ligne butin retirée |
| 0.12.3 | 2026-10-25 | Page Ma vue : trolls hors vue ajoutés en style léger (estompés, italique) |
| 0.13.0 | 2026-10-25 | Compétence Baroufle (symphonie, effets, durée, lieu) envoyée dans le groupe WhatsApp |
| 0.13.1 | 2026-10-26 | Attaque : monstre interposé pris en compte (dégâts sur le bon monstre, cible visée indiquée) et jet d'esquive affiché si > 0 |
| 0.13.2 | 2026-10-26 | Sortilèges sans dégâts (Hypnotisme) envoyés dans le groupe WhatsApp (cible, effet, état) |
| 0.13.3 | 2026-10-26 | Correctif : script invalide sur les pages du jeu (accents non échappés, introduits en 0.13.2) qui masquait les PV monstres et infos trolls de Ma vue |
| 0.13.4 | 2026-10-26 | Ma vue : pas de PV pour les Familiers (comme pour les Gowap Apprivoisés) |
| 0.14.0 | 2026-10-26 | Ma vue : les gowaps de la liste commune sont colorés (couleur choisie sur la page Suivants) |
| 0.15.0 | 2026-10-26 | Menu : image des points cardinaux (pistage) au début de la div #favoris |
| 0.15.1 | 2026-10-26 | Image pistage : marges 14 px (CSS demandé) |
| 0.16.0 | 2026-10-26 | Ma vue : clic sur la colonne PV d'un troll -> popup de confirmation -> « Demande de sacro » dans le groupe WhatsApp (`notif/sacro_whatsapp.php`) |
| 0.16.1 | 2026-10-26 | Popup sacro : design de l'interface MH (parchemin, bandeau, boutons du jeu) et bouton × pour fermer (adapté au mobile) |
| 0.16.2 | 2026-10-26 | Popup sacro : sans numéro de troll |
| 0.17.0 | 2026-10-26 | Ma vue : survol de « DLA à... » = temps restant + heure approximative du cumul d'après (DLA + durée du tour) |
| 0.17.1 | 2026-10-26 | Infobulle DLA : libellé « Cumul » |
| 0.18.0 | 2026-10-26 | Sortilège Flash Aveuglant : cibles mémorisées sur le serveur MH, picto 💫 à côté du nom des monstres touchés dans Ma vue (durée approximative) et résumé dans le groupe WhatsApp |
| 0.18.1 | 2026-10-26 | Correctif : picto Flash Aveuglant affiché correctement (emoji mal encodé) |
| 0.19.0 | 2026-10-26 | Picto 🙈 pour Flash Aveuglant ; compétence Hurlement Effrayant (😱 fuit / 😡 plus énervé) mémorisée, picto dans Ma vue et message WhatsApp |
| 0.19.1 | 2026-10-26 | Pictos d'effets légèrement agrandis |
| 0.19.2 | 2026-10-26 | Demande de sacro : « Régen : ~N PV » (moyenne) dans le popup et le message ; PV max retiré |
| 0.21.0 | 2026-10-26 | Page de connexion : bonus/malus en cours et pas encore actifs envoyés au serveur MH (`notif/bonus_malus.php`, remplacement sans doublon) |
| 0.21.1 | 2026-10-26 | Demande de sacro : ligne « Malus PV : N (suivant : M) » (popup et message) d'après les bonus/malus enregistrés |
| 0.21.2 | 2026-10-26 | Image pistage placée tout en bas de la div #favoris |
| 0.21.3 | 2026-10-26 | Popup sacro : malus PV sur sa propre ligne, titre du bandeau retiré (× conservé) |
| 0.22.0 | 2026-10-26 | Ma vue, Trésors : boutons de filtre Parchemin / Composant / Gigots de Gob (additionnables, bouton Tout) |
| 0.22.1 | 2026-10-26 | Filtres Trésors placés sur la même ligne que Filtre / Copier |
| 0.22.2 | 2026-10-26 | Filtres Trésors : bouton « Tout » retiré |
| 0.23.0 | 2026-10-26 | Ma vue : interrupteur ON / OFF de toutes les améliorations du script, mémorisé par troll (navigateur) |
| 0.23.1 | 2026-10-26 | Interrupteur de Ma vue : réglage stocké par troll sur le serveur MH (`notif/prefs_vue.php`), bouton déplacé dans l'encart d'informations sous le titre |
| 0.24.0 | 2026-10-26 | Ma vue : interrupteurs plus fins (16 px) ; option « Blocs ouverts à l'ouverture » (Monstres, Trôlls, Trésors... ouverts ou fermés), mémorisée par troll sur le serveur |
| 0.24.1 | 2026-10-26 | Ma vue : les deux interrupteurs sur la même ligne |
| 0.25.0 | 2026-10-26 | Kiki Meter : essais de sorts / compétences comptés par troll sur le serveur MH (ratés, effets réduits, dégât max) et tableau des 5 trolls dans Mon Profil (meilleur vert, pire rouge) |
| 0.26.0 | 2026-10-26 | Filtres Trésors : boutons « Sans gowap » / « Sans troll » avec distance réglable (même case, 1, 2 ou 3 cases) |
| 0.26.1 | 2026-10-26 | Filtres Trésors : « Sans gowap » et « Sans troll » fusionnés en un seul bouton « Personne sur la case » |
| 0.27.0 | 2026-10-26 | Trésors : 2e ligne « Plus grosses piles » (liste des N plus grosses piles de la plus grosse à la plus petite, N = 3 / 5 / 10 / 20, clic pour repérer la pile dans le tableau) |
| 0.28.0 | 2026-10-26 | Menu : liens vers les 4 écuyers (Retak, Coucouze, Roxxor, Xouz) en haut, ouverts dans un nouvel onglet |
