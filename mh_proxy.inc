# Directives communes du reverse proxy MH (incluses par « location / » et « @mh »).
set $upstream https://games.mountyhall.com;
proxy_pass $upstream;
proxy_ssl_server_name on;
proxy_http_version 1.1;

proxy_set_header Host games.mountyhall.com;
proxy_set_header User-Agent $mh_user_agent;
proxy_set_header X-Forwarded-For $remote_addr;
# Pages non compressées pour pouvoir y injecter la surcouche
proxy_set_header Accept-Encoding "";
# Referer/Origin vus comme venant du site d'origine
proxy_set_header Referer $http_referer;
proxy_set_header Origin "";

# Redirections et cookies ramenés sur ce domaine
proxy_redirect ~^https?://(games|www)\.mountyhall\.com(.*)$ $scheme://$host$2;
proxy_cookie_domain games.mountyhall.com $host;

# Liens absolus vers MH -> relatifs ; injection de la surcouche
sub_filter_once off;
sub_filter_types text/html;
sub_filter 'https://games.mountyhall.com' '';
sub_filter 'http://games.mountyhall.com' '';
sub_filter '</head>' '<link rel="stylesheet" href="/_mhx/custom.css"><script src="/_mhx/custom.js"></script></head>';

proxy_read_timeout 60s;
