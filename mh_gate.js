// Controle cote serveur de la tentative de connexion (POST de la page PlayStart2.php).
// Lit uniquement le champ as_Login (numero ou nom) ; le mot de passe n'est ni lu, ni journalise, ni stocke.
var OK_NUM = ['95681', '101586', '101617', '101587', '113075', '113379', '113620'];
var OK_NOM = ['perco', 'taotd', 'free', 'killdray', 'telekom', 'flak flak', 'minitel'];

function decode(s) {
    try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch (e) { return s; }
}

function login(r) {
    if (r.method !== 'POST') { r.internalRedirect('@mh'); return; }
    var m = /(?:^|&)as_Login=([^&]*)/.exec(r.requestText || '');
    var v = m ? decode(m[1]).replace(/\s+/g, ' ').replace(/^ | $/g, '').toLowerCase() : '';
    if (OK_NUM.indexOf(v) !== -1 || OK_NOM.indexOf(v) !== -1) { r.internalRedirect('@mh'); return; }
    r.headersOut['Content-Type'] = 'text/plain; charset=utf-8';
    r.return(403, 'Acc\u00e8s refus\u00e9.');
}

export default { login };
