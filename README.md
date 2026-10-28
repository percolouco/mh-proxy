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
| 0.28.0 | 2026-10-26 | Menu : liens vers les 4 écuyers (Retak, Coucouze, Roxxor, Xouz) sous l'image de pistage, ouverts dans un nouvel onglet |
| 0.29.0 | 2026-10-26 | Aggro : page du monstre = encart « dernière cible visée » (coups portés ou tentés) (envoyée au serveur MH) ; Ma vue = colonne « Aggro » entre PV et Réf. des monstres |
| 0.29.2 | 2026-10-26 | Aggro : le troll est mémorisé (localStorage) pour que la page d’un monstre ouverte hors du jeu envoie quand même la cible |
| 0.30.0 | 2026-10-26 | Aggro : vérification en arrière-plan (lecture seule, une page à la fois, 1 à 10 s entre deux) des monstres à distance 0-2 hors gowaps/familiers : d’abord sans info, puis dernier check > 6 h ; un check sans coup est enregistré (aggro vide) |
| 0.30.1 | 2026-10-26 | Aggro : colonne bien placée entre PV et Réf. (attend la colonne PV) ; vérifié en réel (Voir le Monde Souterrain) |
| 0.30.2 | 2026-10-26 | Aggro : la vérification en arrière-plan lit les événements dans les données de la page (le tableau est rempli par JavaScript, donc vide dans la page récupérée) ; corrige les faux « aucun coup » |
| 0.31.0 | 2026-10-26 | Trésors de Ma vue envoyés au serveur (par troll, remplacés à chaque affichage) et réaffichés sur Équipement > Suivants > Ordres, au-dessus de la carte du trajet : recherche par nom, filtres Parchemin/Composant/Gigots, piles, clic = copie des coordonnées |
| 0.31.1 | 2026-10-26 | Page Ordres : 2e bloc « même affichage que Ma vue » (Dist., Actions avec icône, Réf., Nom, X, Y, N, tri au clic sur l’en-tête) sous le bloc de recherche |
| 0.31.2 | 2026-10-26 | Page Ordres : le 2e bloc reprend la présentation de la partie Trésors de Ma vue (styles du jeu, colonnes, icônes) avec Plus grosses piles et filtres Parchemin / Composant / Gigots de Gob / Personne sur la case (positions des gowaps et trolls mémorisées avec la vue) |
| 0.32.0 | 2026-10-26 | Page Ordres : distances calculées depuis la position du suivant ; clic sur un trésor = étape « Se déplacer vers » pré-remplie (X/Y/N) dans le planificateur de trajet (rien n’est validé : l’ordre reste à enregistrer par le joueur) |
| 0.33.0 | 2026-10-26 | Suivants : la portée de vue du suivant (page Profil, « Vue : 6 Cases +0 ») est mémorisée et affichée à côté de son nom sur la page Ordres, « (Vue : 6 cases) » ; lue en arrière-plan si elle manque ou date de plus de 6 h |
| 0.34.0 | 2026-10-26 | Ordres : clic sur un trésor dans la vue du suivant (Dist. ≤ Vue) = ordre « Aller chercher » (choix de l’ordre, sélection du trésor dans la fenêtre Action, clic sur Action ; sans PA, à la demande de Perco) ; sinon étape « Se déplacer vers » pré-remplie |
| 0.34.1 | 2026-10-26 | Aller chercher : le formulaire est posté en arrière-plan puis la page Ordres est rechargée (les blocs Trésors ne disparaissent plus) ; fenêtre Action fermée |
| 0.35.0 | 2026-10-26 | Aller chercher : séquence complète en arrière-plan (ordre « Se secouer à terre dans ma caverne » créé et remonté en 1er, pause 1 s, ordre « Aller chercher » du trésor créé et remonté en 1er) puis rechargement de la page Ordres ; plus de fenêtre Action |
| 0.35.1 | 2026-10-26 | Page Ordres : le 1er bloc Trésors (recherche / piles compactes) est retiré, seul reste le bloc « même affichage que Ma vue » avec la date de la vue |
| 0.36.0 | 2026-10-26 | Page Ordres : bouton « Dans la vue du suivant (≤ N) » dans le bloc Trésors, limite la liste aux trésors à portée de vue du suivant |
| 0.37.0 | 2026-10-26 | Trésors : la vue enregistrée n’est plus écrasée. Les trésors sont fusionnés (conservés 24 h) ; un trésor n’est retiré que s’il a disparu dans la zone couverte par la vue envoyée, donc une petite vue ne détruit pas une grande ; envoi seulement quand le tableau est stable ; ancienneté affichée sur la page Ordres |
| 0.37.1 | 2026-10-26 | Page Ordres : « Dans la vue du suivant » et « Aller chercher » tiennent compte de la portée verticale = moitié de la Vue (6 -> N ±3, 5 -> N ±2) |
| 0.37.2 | 2026-10-26 | Aggro : la colonne ne dépend plus de la colonne PV (elle-même liée à la colonne Niv. ajoutée par MZ) : si PV n’apparaît pas au bout de 6 s, Aggro se place avant Réf. |
| 0.38.0 | 2026-10-26 | Monstres : colonnes PV et Aggro placées juste avant « Réf. » (plus de dépendance à la colonne Niv. de MZ) ; sans MZ, PV n’affiche que les valeurs déjà mémorisées |
| 0.39.0 | 2026-10-27 | Ordres : clic sur un trésor hors de la vue du suivant = ordres « Arrêt » puis « Se déplacer vers » (X/Y/N du trésor) créés via le menu déroulant des ordres du jeu, en arrière-plan, déplacement en 1er ; dans la vue, « Aller chercher » inchangé |
| 0.40.0 | 2026-10-27 | Ordres : clic sur des « Gigots de Gob » = « Se secouer » sur leur case (X/Y/N), puis « Aller chercher » (dans la vue) ou « Se déplacer vers » (hors vue), puis « Arrêt » ; créés en arrière-plan via le menu déroulant des ordres |
| 0.40.2 | 2026-10-27 | Gigots de Gob hors de la vue : « Se secouer » sur leur case puis « Arrêt » suffisent (plus de « Se déplacer vers ») ; dans la vue inchangé |
| 0.41.0 | 2026-10-27 | Mes gowaps : case à cocher par gowap dans la liste commune (page Suivants), rattaché au troll connecté (un seul propriétaire, serveur MH `gowap/gowap_mine.php`) ; encart « Mes gowaps » sur TurnStart.php au-dessus de « Votre Equipement utilisé » (PV, PA, DLA, position, vue, dernier décès, objets portés) |
| 0.42.0 | 2026-10-27 | Connexion : lecture en arrière-plan (simple GET de Play_e_follo.php, au plus 1 fois / 5 min) de la page Équipement > Suivants ; pour chaque gowap de la liste commune, DLA, PA, PV, vue, position, poids et ordres sont envoyés au serveur MH (`gowap/gowap_infos.php`) et affichés dans « Mes gowaps » (prioritaires sur les infos du cron SP) |
| 0.42.1 | 2026-10-27 | Mes gowaps : ligne « Infos du … » retirée |
| 0.42.2 | 2026-10-27 | Mes gowaps : PV, PA, DLA, position et vue sur une seule ligne |
| 0.43.0 | 2026-10-27 | Mes gowaps : objets lus à la connexion dans les tableaux repliables « [+] » de la page Suivants (n°, nom, détail, état, poids, y compris les objets non identifiés), groupés par type dans un bloc « Objets (N) » repliable |
| 0.43.1 | 2026-10-27 | Mes gowaps : les objets avec une mention « Autre » (ex. [En gueule]) sont listés directement (« Objet : nom • [En gueule] »), le reste reste dans le bloc repliable « Tous les objets » |
| 0.44.0 | 2026-10-27 | Mes gowaps : fond rouge (rgba(218, 11, 11, 0.6)) quand le 1er ordre du gowap est « Arrêt » |
| 0.45.0 | 2026-10-27 | Mes gowaps : fond orange (rgba(218, 137, 11, 0.6)) quand le 1er ordre est « Se secouer » sur une case à portée de vue du gowap (X et Y ≤ Vue, N ≤ Vue / 2) |
| 0.45.1 | 2026-10-27 | Mes gowaps : infos relues à chaque ouverture de TurnStart (10 s mini entre deux lectures) puis toutes les 60 s tant que la page reste ouverte (avant : 5 min) |
| 0.46.0 | 2026-10-27 | Mes gowaps : bouton « MAJ » à côté du titre, relit tout de suite les infos des gowaps (sans attendre les 10 s / 60 s) et rafraîchit l’encart |
| 0.46.1 | 2026-10-27 | Mes gowaps : un gowap sans aucun objet écrase désormais l'ancienne liste (liste vide envoyée) ; le repli sur la liste du serveur (cron SP) n'a lieu que si aucune info n'a été lue dans le jeu |
| 0.47.0 | 2026-10-27 | Marques « trésor en cours de récupération » : après l'envoi des ordres à un gowap pour un trésor, sa ligne est colorée en bleu pour tous les joueurs (page Ordres et Ma vue), enregistrée sur le serveur MH (`gowap/tresor_marks.php`, 24 h max) ; croix « ✕ » sur la page Ordres pour la retirer, réservée à celui qui l'a posée |
| 0.48.0 | 2026-10-27 | Page « Mes commandes » du jeu : une case par commande « Synchroniser avec le suivi des enchantements ». Case cochée : la commande est ajoutée / mise à jour dans le suivi du site MH (composants changés remplacés, ancienne ligne réactivée) ; une commande suivie qui disparaît du jeu passe en « à annuler », sans suppression. Non cochée : rien nest envoyé. |
| 0.49.0 | 2026-10-27 | Page « Mes commandes » : chaque composant est coloré comme sur le suivi des enchantements (vert = qualité exacte en stock, bleu = qualité supérieure, rouge = non disponible) avec le lieu où il se trouve (GT Basse / Haute, gowap et son propriétaire). |
| 0.50.0 | 2026-10-27 | Ma vue : les gowaps (hors liste commune) de toute la vue sont lus en arrière-plan (lecture seule, 1 à 10 s entre deux pages, résultat gardé 6 h dans le navigateur) ; au moins 3 « s'est ébroué » et 3 « a ramassé un trésor » : le nom du gowap est souligné en rose (infobulle avec les nombres). |
| 0.50.1 | 2026-10-27 | Gowaps soulignés en rose : toute la vue est lue (plus seulement les 0-2 cases), les plus proches d'abord. |
| 0.51.0 | 2026-10-27 | Gowaps roses : les lectures d'événements sont stockées sur le serveur MH (gowap/gowap_events.php, 7 jours) et partagées entre joueurs ; un gowap lu depuis moins de 6 h n'est relu par personne. |
| 0.51.1 | 2026-10-27 | Gowaps roses : les lectures déjà faites dans le navigateur avant le partage (0.50.x) sont envoyées au serveur à la 1re ouverture de Ma vue. |
| 0.51.2 | 2026-10-27 | Gowaps roses : la file de lecture est reconstruite toutes les 5 s (grosses vues dont le tableau arrive après le chargement : rien n'était lu). |
| 0.52.0 | 2026-10-27 | Ma vue : bouton « Lancer la recherche des gowaps » au-dessus du tableau des monstres ; les lectures (gowaps hors liste commune, les plus proches d'abord, 1 à 10 s entre deux) ne démarrent plus seules, avec compteur et bouton « Arrêter la recherche ». Le rose et les lectures partagées s'affichent sans lancer la recherche. |
| 0.52.1 | 2026-10-28 | Gowaps à 3 ébrouements + 3 trésors : toute la ligne du tableau passe en rose (comme la ligne du trésor en bleu), en plus du nom souligné. |
| 0.53.0 | 2026-10-28 | Ma vue : destination des Portails de Téléportation connus affichée après le nom du portail (« → X= Y= N= », infobulle : erreur de calcul, créateur, ancienneté). Source : résultat du sortilège lu par le proxy, stocké sur le serveur MH (notif/portails.php, 30 jours). |
| 0.54.0 | 2026-10-28 | Ma vue : nom réel des trésors identifiés affiché après le nom générique (« Potion → Elixir de Longue-Vue », effets en infobulle), tiré des mails d'identification analysés par le serveur MH (evenements/api.php). |
| 0.55.0 | 2026-10-28 | Pages monstre / troll : les lignes COMBAT du tableau des événements reçoivent le détail tiré des mails (type d'attaque, jets d'attaque / esquive / résistance, résultat, dégâts, PV gagnés, mortel, troll ayant reçu le mail), via evenements/api.php?combats=. |
| 0.56.0 | 2026-10-28 | Événements des pages monstre / troll : la phrase du jeu des lignes COMBAT est réécrite à partir du mail (comme SCIZ : « X a attaqué Y — type : jet d'attaque…, touché, … dégâts »), avec une icône ⇄ pour revenir à la phrase d'origine (choix mémorisé dans le navigateur). Remplace l'ajout sous la phrase de 0.55.0. |
| 0.57.0 | 2026-10-28 | Événements : phrase réécrite au format exact de SCIZ (sciz_format.yaml) : « [MORT - ]Type [esquivé(e) [parfaitement]] [critique] [résisté(e)] de ATTAQUANT sur DÉFENSEUR : -NPV soin +N (reste NPV) (att A esq E deg D arm M resi R sr S (px +N)) », esquivé / critique / résisté déduits des jets comme SCIZ, noms cliquables (monstre / troll), ⇄ pour revenir à la phrase du jeu. |
| 0.58.0 | 2026-10-28 | Événements : les lignes MONSTRE « a utilisé un pouvoir sur X » sont aussi réécrites au format SCIZ à partir du mail POUVOIR (« Maladie résisté(e) de MONSTRE sur TROLL : (Maladie ; REDUIT : Dégâts : -7 | Régénération : -6 pour 3T) (resi 31 sr 90) »), idem balayage (destab / stab) et ronflements. |
| 0.59.0 | 2026-10-28 | Événements : pour une attaque subie, les PV perdus sont ceux de la phrase « Votre Armure vous protège et vous ne perdrez que N points de vie » (et non les dégâts infligés) ; PV restants affichés ; plus de deg / arm dans la phrase. |
| 0.60.0 | 2026-10-28 | Page événements d'un troll (PJView_Events.php) : mêmes phrases SCIZ que sur la page monstre (combats, pouvoirs), et aussi les lignes SORTILEGE / COMPETENCE (« Hurlement Effrayant de X sur Y (px +1) »), reliées au mail par la date (± 2 s) et les numéros. |
| 0.61.0 | 2026-10-28 | Ma vue : bouton « Filtrer sur les gowaps ramasseurs » à côté de « Lancer la recherche des gowaps », qui ne garde que les lignes roses du tableau des monstres (même design que les boutons Parchemin / Composant / Gigots de Gob, état mémorisé). |
| 0.62.0 | 2026-10-28 | Événements : sorts de soin / Sacrifice (soin de la cible, PV perdus, PV restants, receveur du mail = cible) : « Sacrifice de TeleKom sur Taotd : -26PV soin +19 (reste 84PV) (px +1) ». |
| 0.63.0 | 2026-10-28 | Sortilège Sacrifice réussi : message WhatsApp détaillé (lanceur, cible soignée, PV perdus, PV restants / max) envoyé au groupe via le serveur MH (notif/sacrifice_whatsapp.php), lu dans la page de résultat ; un seul envoi par résultat. |
