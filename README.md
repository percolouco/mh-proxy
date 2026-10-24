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
