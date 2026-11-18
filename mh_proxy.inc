# Directives communes du reverse proxy MH (incluses par « location / » et « @mh »).
set $upstream https://games.mountyhall.com;
proxy_pass $upstream;
proxy_ssl_server_name on;
proxy_http_version 1.1;

proxy_set_header Host games.mountyhall.com;
proxy_set_header User-Agent $mh_user_agent;
# Aucune adresse de joueur transmise à MH : on retire les en-têtes ajoutés par Traefik
proxy_set_header X-Forwarded-For "";
proxy_set_header X-Real-IP "";
proxy_set_header X-Forwarded-Host "";
proxy_set_header X-Forwarded-Port "";
proxy_set_header X-Forwarded-Proto "";
proxy_set_header X-Forwarded-Server "";
# Le badge du proxy reste entre le navigateur et le proxy
proxy_set_header Cookie $mhx_cookie_mh;
# Pages non compressées pour pouvoir y injecter la surcouche
proxy_set_header Accept-Encoding "";
# Referer/Origin vus comme venant du site d'origine
proxy_set_header Referer $http_referer;
proxy_set_header Origin "";

# Redirections et cookies ramenés sur ce domaine
proxy_redirect ~^https?://(games|www)\.mountyhall\.com(.*)$ $scheme://$host$2;
proxy_cookie_domain games.mountyhall.com $host;
# Cookie de session MH protégé : illisible par JavaScript (HttpOnly), HTTPS uniquement, pas d'envoi intersite
proxy_cookie_flags PHPSESSID httponly secure samesite=lax;

# Liens absolus vers MH -> relatifs ; injection de la surcouche
sub_filter_once off;
sub_filter_types text/html;
sub_filter 'https://games.mountyhall.com' '';
sub_filter 'http://games.mountyhall.com' '';
sub_filter '</head>' '<link rel="stylesheet" href="/_mhx/custom.css"><script src="/_mhx/custom.js"></script></head>';

proxy_read_timeout 60s;
