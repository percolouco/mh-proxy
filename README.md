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
- `custom.js` ajoute un bouton **IT** dans le menu de gauche (entre « Mon profil » et « Ma vue ») qui ouvre `https://mh.percolouco.com/tactique/tactique.php` dans le cadre de contenu ; images `custom/img/interfaceit.jpg` (normal) et `interfaceit2.jpg` (survol), style dans `custom.css`.
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
