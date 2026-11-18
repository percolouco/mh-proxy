// Porte d'entrée du proxy MH (njs).
//
// 1. login()        : contrôle côté serveur du formulaire de connexion (POST PlayStart2.php). Seuls les trolls du groupe
//                     peuvent tenter de se connecter. Lit uniquement le champ as_Login (numéro ou nom) : le mot de passe
//                     n'est ni lu, ni journalisé, ni stocké. Refuse les formulaires ambigus (champ en double, nom encodé...).
// 2. badgeFilter()  : quand MH accepte la connexion (302 vers une page du jeu), pose le « badge » du proxy :
//                     cookie mhx_badge = numéro du troll + expiration, signé HMAC-SHA256 (clé MHX_BADGE_SECRET, hors Git).
// 3. badgeTroll()   : $mhx_troll = numéro du troll si le badge est valide, sinon "" (pages du jeu et relais /_mhx/api/).
// 4. apiKey()       : $mhx_api_key = MHX_API_KEY, envoyée au site mh par le relais /_mhx/api/ (jamais au navigateur).
// 5. cookieMh()     : $mhx_cookie_mh = cookies du navigateur sans le badge, transmis à MH.
var crypto = require('crypto');

// Trolls du groupe : numéro -> noms acceptés au login (en minuscules)
var TROLLS = {
    '95681': ['perco'],
    '101586': ['taotd'],
    '101617': ['free'],
    '101587': ['killdray'],
    '113075': ['telekom'],
    '113379': ['flak flak'],
    '113620': ['minitel']
};
var BADGE_JOURS = 30;

function secret() { return process.env.MHX_BADGE_SECRET || ''; }

function decode(s) {
    try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return null; }
}

// Numéro du troll désigné par la valeur du champ as_Login, ou null s'il n'est pas du groupe
function trollDe(valeur) {
    var v = valeur.replace(/\s+/g, ' ').replace(/^ | $/g, '').toLowerCase();
    if (TROLLS.hasOwnProperty(v)) return v;
    for (var num in TROLLS) {
        if (TROLLS[num].indexOf(v) !== -1) return num;
    }
    return null;
}

// Lecture stricte du formulaire : exactement un champ as_Login, nom non encodé, rien dans l'URL
function loginDemande(r) {
    var type = (r.headersIn['Content-Type'] || '').toLowerCase();
    if (type.indexOf('application/x-www-form-urlencoded') !== 0) return null;
    if (/(^|&)[^=&]*as(%5f|_)login/i.test(r.variables.args || '')) return null;
    var corps = r.requestText || '';
    var trouves = [];
    var champs = corps.split('&');
    for (var i = 0; i < champs.length; i++) {
        var eg = champs[i].indexOf('=');
        var nomBrut = eg === -1 ? champs[i] : champs[i].slice(0, eg);
        var nom = decode(nomBrut);
        if (nom === null) return null;
        if (nom.toLowerCase().replace(/\s/g, '').indexOf('as_login') !== -1) {
            if (nomBrut !== 'as_Login') return null;          // nom encodé ou variante : refusé
            var val = decode(eg === -1 ? '' : champs[i].slice(eg + 1));
            if (val === null) return null;
            trouves.push(val);
        }
    }
    if (trouves.length !== 1) return null;                   // absent ou en double : refusé
    return trollDe(trouves[0]);
}

function refuser(r) {
    r.headersOut['Content-Type'] = 'text/plain; charset=utf-8';
    r.return(403, 'Accès refusé.');
}

function login(r) {
    if (r.method !== 'POST') { r.internalRedirect('@mh'); return; }
    if (r.uri !== '/mountyhall/MH_Play/PlayStart2.php') { refuser(r); return; }
    var troll = loginDemande(r);
    if (!troll) { refuser(r); return; }
    r.variables.mhx_login = troll;
    r.internalRedirect('@mh');
}

function signer(donnee) {
    return crypto.createHmac('sha256', secret()).update(donnee).digest('base64url');
}

function badgeFilter(r) {
    var troll = r.variables.mhx_login;
    if (!troll || !secret() || r.method !== 'POST') return;
    var loc = r.headersOut['Location'] || '';
    // MH répond 302 vers une page du jeu si la connexion est acceptée, 200 (page d'erreur) sinon
    if (r.status !== 302 || loc.indexOf('/MH_Play/') === -1 || loc.indexOf('PlayStart') !== -1) return;
    var exp = Math.floor(Date.now() / 1000) + BADGE_JOURS * 86400;
    var donnee = troll + '.' + exp;
    var cookie = 'mhx_badge=' + donnee + '.' + signer(donnee) + '; Path=/; Max-Age=' + (BADGE_JOURS * 86400) +
        '; HttpOnly; Secure; SameSite=Lax';
    var existants = r.headersOut['Set-Cookie'];
    if (!existants) existants = [];
    else if (typeof existants === 'string') existants = [existants];
    existants.push(cookie);
    r.headersOut['Set-Cookie'] = existants;
}

function badgeTroll(r) {
    var c = r.variables.cookie_mhx_badge || '';
    var m = /^(\d+)\.(\d+)\.([A-Za-z0-9_-]+)$/.exec(c);
    if (!m || !secret() || !TROLLS.hasOwnProperty(m[1])) return '';
    if (parseInt(m[2], 10) < Date.now() / 1000) return '';
    var attendu = signer(m[1] + '.' + m[2]);
    if (attendu.length !== m[3].length) return '';
    var diff = 0;
    for (var i = 0; i < attendu.length; i++) diff |= attendu.charCodeAt(i) ^ m[3].charCodeAt(i);
    return diff === 0 ? m[1] : '';
}

function apiKey(r) { return process.env.MHX_API_KEY || ''; }

// En-tête Cookie transmis à MH : celui du navigateur, sans le badge du proxy
function cookieMh(r) {
    var c = r.headersIn['Cookie'] || '';
    return c.split(/;\s*/).filter(function (x) { return x && x.indexOf('mhx_badge=') !== 0; }).join('; ');
}

export default { login, badgeFilter, badgeTroll, apiKey, cookieMh };
