// Surcouche perso MountyHall — chargée dans chaque page via le proxy.
// Ne fait que de l'affichage / lecture : jamais d'action automatique dans le jeu.
(function () {
  if (window.__mhx) return; // la page peut être injectée deux fois (voir nginx.conf)
  window.__mhx = true;

  // Bouton « IT » dans le menu de gauche (sous « Ma vue ») : ouvre la page
  // tactique de mh.percolouco.com dans le cadre de contenu (le <base target="Contenu"> du menu s'applique).
  function addItButton() {
    if (!/\/Play_menu\.php$/.test(location.pathname)) return;
    var vue = document.querySelector('menu a.interface-vue');
    if (!vue || document.querySelector('a.interface-it')) return;
    var a = document.createElement('a');
    a.href = 'https://mh.percolouco.com/tactique/tactique.php';
    a.className = 'interface-it';
    a.textContent = 'IT';
    var br = vue.nextElementSibling; // le <br> qui suit « Ma vue »
    var after = (br && br.tagName === 'BR') ? br : vue;
    after.parentNode.insertBefore(a, after.nextSibling);
    a.parentNode.insertBefore(document.createElement('br'), a.nextSibling);
  }

  // Gowaps en couleur : liste commune à tous les navigateurs, stockée sur mh.percolouco.com
  // (table mh_gowap_perks). Lecture / affichage uniquement, rien n'est soumis dans le jeu.
  var PERKS_URL = 'https://mh.percolouco.com/gowap/gowap_perks.php';
  var PERK_COLORS = { vert: '#8fcf9a', rouge: '#e8a0a0', orange: '#f2c48d', jaune: '#efe48a', violet: '#c8a8e0' };

  // GET si body est vide, POST sinon ; cb(liste {id: couleur}) ou cb(null) en cas d'erreur
  function perksCall(body, cb) {
    var opt = { referrerPolicy: 'no-referrer' };
    if (body) {
      opt.method = 'POST';
      opt.headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
      opt.body = body;
    }
    fetch(PERKS_URL, opt).then(function (r) { return r.ok ? r.json() : null; })
      .then(cb, function () { cb(null); });
  }

  // Page profil d'un suivant (Play_a_Action.php?type=F&id=-4&id_target=N) : « Ramasse les Trésors »
  // dans les améliorations -> ajouté en vert à la liste commune s'il n'y est pas déjà.
  function rememberGowapPerks() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname)) return;
    var q = new URLSearchParams(location.search);
    var id = q.get('id_target');
    if (q.get('type') !== 'F' || !/^\d+$/.test(id || '')) return;
    var txt = document.body ? document.body.textContent : '';
    if (!/am\u00e9lioration/i.test(txt) || !/Ramasse\s+les\s+Tr\u00e9sors/i.test(txt)) return;
    perksCall('', function (list) {
      if (list && !list[id]) perksCall('action=set&color=vert&id=' + id, function () {});
    });
  }

  // Bloc le plus proche (en remontant) qui porte le fond bleu des encarts, sinon l'encart lui-même
  function followerBlock(h3) {
    if (h3.mhxBlock) return h3.mhxBlock; // après coloration le fond d'origine n'est plus détectable
    for (var el = h3; el && el !== document.body; el = el.parentNode) {
      if (el.nodeType === 1 && /tableau2_fo/.test(getComputedStyle(el).backgroundImage)) return (h3.mhxBlock = el);
    }
    return (h3.mhxBlock = h3.parentNode);
  }

  function colorFollowers(list) {
    document.querySelectorAll('.monstre-entete h3[data-json]').forEach(function (h3) {
      var el = followerBlock(h3);
      if (el.dataset.mhxBg === undefined) el.dataset.mhxBg = el.style.cssText;
      el.style.cssText = el.dataset.mhxBg;
      var gid = /\((\d+)\)/.exec(h3.textContent);
      var c = gid && list[gid[1]];
      if (c && PERK_COLORS[c]) el.style.setProperty('background', PERK_COLORS[c], 'important');
    });
  }

  // Encart en bas de la page Suivants : liste commune, couleur modifiable, ajout / retrait d'un gowap
  function addGowapPanel(list) {
    var box = document.getElementById('mhx-gowaps');
    if (!box) {
      box = document.createElement('div');
      box.id = 'mhx-gowaps';
      document.body.appendChild(box);
    }
    box.textContent = '';
    var title = document.createElement('b');
    title.textContent = 'Gowaps en couleur (liste commune)';
    box.appendChild(title);
    var save = function (body) { perksCall(body, function (l) { if (l) { colorFollowers(l); addGowapPanel(l); } }); };
    var select = function (current) {
      var sel = document.createElement('select');
      Object.keys(PERK_COLORS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k; o.textContent = k; o.selected = k === current;
        sel.appendChild(o);
      });
      return sel;
    };
    Object.keys(list).forEach(function (id) {
      var row = document.createElement('div');
      var lab = document.createElement('span');
      lab.textContent = id + ' ';
      lab.style.background = PERK_COLORS[list[id]] || '';
      var sel = select(list[id]);
      sel.onchange = function () { save('action=set&id=' + id + '&color=' + sel.value); };
      var del = document.createElement('button');
      del.type = 'button'; del.textContent = '\u2715';
      del.onclick = function () { save('action=del&id=' + id); };
      row.appendChild(lab); row.appendChild(sel); row.appendChild(del);
      box.appendChild(row);
    });
    var add = document.createElement('div');
    var inp = document.createElement('input');
    inp.type = 'text'; inp.placeholder = 'n\u00b0 du gowap'; inp.size = 10;
    var sel = select('vert');
    var btn = document.createElement('button');
    btn.type = 'button'; btn.textContent = 'Ajouter';
    btn.onclick = function () {
      if (/^\d{1,10}$/.test(inp.value.trim())) save('action=set&id=' + inp.value.trim() + '&color=' + sel.value);
    };
    add.appendChild(inp); add.appendChild(sel); add.appendChild(btn);
    box.appendChild(add);
  }

  // Résultat du sortilège Téléportation : le portail créé est signalé dans le groupe WhatsApp (envoi fait par
  // le serveur MH). Lecture du texte affiché seulement, rien n'est soumis dans le jeu ; un portail n'est
  // envoyé qu'une fois (le serveur garde son numéro).
  var NOTIF_PORTAIL_URL = 'https://mh.percolouco.com/notif/portail_whatsapp.php';
  // Numéro du troll connecté : data-idtroll de la page, sinon d'un cadre du même jeu (menu, vue...) ouvert avec
  // la même session. Pas de valeur mémorisée d'une autre session : mieux vaut ne rien envoyer qu'un mauvais nom.
  function currentTrollId() {
    var wins = [window, window.parent, window.top];
    try { for (var i = 0; i < window.top.frames.length; i++) wins.push(window.top.frames[i]); } catch (e) { /* cadres inaccessibles */ }
    for (var j = 0; j < wins.length; j++) {
      try {
        var id = wins[j].document.body.getAttribute('data-idtroll');
        if (/^\d+$/.test(id || '')) return id;
      } catch (e) { /* cadre d'une autre origine */ }
    }
    return null;
  }
  function sendPortalNotice() {
    if (!/\/Play_a_ActionResult\.php$/.test(location.pathname) || !document.body) return;
    var txt = document.body.textContent.replace(/[\s\u00a0]+/g, ' ');
    var num = '([+-]?\\d+)';
    var m = new RegExp('Portail de T\u00e9l\u00e9portation \\((\\d+)\\) en X = ' + num + ' \\| Y = ' + num + ' \\| N = ' + num +
      '.*?conduit en : X = ' + num + ' \\| Y = ' + num + ' \\| N = ' + num +
      '.*?Erreur de calcul : X=' + num + ' ?\\| ?Y=' + num + ' ?\\| ?N=' + num).exec(txt);
    var troll = currentTrollId();
    if (!m || !troll) return;
    var k = ['pid', 'x', 'y', 'n', 'dx', 'dy', 'dn', 'ex', 'ey', 'en'];
    var body = 'troll=' + troll + k.map(function (key, i) { return '&' + key + '=' + encodeURIComponent(m[i + 1].replace(/^\+/, '')); }).join('');
    mhdPost(NOTIF_PORTAIL_URL, body, function (ok) {
      mhdBadge(ok ? 'Portail signal\u00e9 sur WhatsApp' : 'Portail : envoi WhatsApp impossible', !ok);
    });
  }

  // Page « Ma vue » : PV de chaque monstre (fourchette « xxx-yyy PV ») sur sa ligne, dans la colonne du nom.
  // Les lignes arrivent après coup (chargement en JS) et la table peut être retriée : on réapplique à chaque changement.
  // Valeurs de test pour l'instant (pvMonstre) ; la source des vraies CDM reste à brancher.
  function pvMonstre(ref) {
    var lo = 100 + (ref * 7) % 300;
    return { min: lo, max: lo + 10 + (ref % 15) };
  }
  function addMonsterPv() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var apply = function () {
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref');
        var nom = tr.querySelector('td a.monstre');
        if (!ref || !nom || tr.querySelector('.mhx-pv')) return;
        var pv = pvMonstre(parseInt(ref.textContent, 10) || 0);
        var sp = document.createElement('span');
        sp.className = 'mhx-pv';
        sp.textContent = ' ' + pv.min + '-' + pv.max + ' PV';
        nom.parentNode.insertBefore(sp, nom.nextSibling);
      });
    };
    var n = 0, timer = setInterval(function () {
      apply();
      var tb = document.querySelector('#VUE_monstres tbody');
      if (tb && !tb.mhxObserved) {
        tb.mhxObserved = true;
        new MutationObserver(apply).observe(tb, { childList: true });
      }
      if (++n > 40) clearInterval(timer);
    }, 1000);
  }

  // Page « Suivants » : affiche la date limite d'action (DLA) de chaque suivant dans son encart bleu.
  // Elle est déjà dans le data-json du <h3> : aucune requête supplémentaire.
  function addFollowerDla() {
    if (!/\/Play_e_follo\.php$/.test(location.pathname)) return;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    document.querySelectorAll('.monstre-entete h3[data-json]').forEach(function (h3) {
      var box = h3.parentNode;
      if (box.querySelector('.mhx-dla')) return;
      var d;
      try { d = JSON.parse(h3.getAttribute('data-json')); } catch (e) { return; }
      var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(d.dla || '');
      if (!m) return;
      var when = new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
      var left = when - Date.now();
      var el = document.createElement('div');
      el.className = 'mhx-dla' + (left <= 0 ? ' mhx-dla-past' : left < 3 * 3600e3 ? ' mhx-dla-soon' : '');
      el.textContent = 'DLA : ' + pad(m[3]) + '/' + pad(m[2]) + ' ' + m[4] + ':' + m[5] + (left <= 0 ? ' (d\u00e9pass\u00e9e)' : '');
      // « poids porté : X minutes » -> « ... / Y minutes restantes », Y = moitié de la durée du tour - X
      var pw = h3.nextElementSibling;
      if (pw && d.tour > 0 && !pw.querySelector('.mhx-poids') && /poids port/.test(pw.textContent)) {
        var sp = document.createElement('span');
        sp.className = 'mhx-poids';
        var px = /(\d+)\s*minute/.exec(pw.textContent);
        if (px) {
          sp.textContent = ' / ' + Math.max(0, Math.round(d.tour / 2) - parseInt(px[1], 10)) + ' minutes restantes';
          pw.appendChild(sp);
        }
      }
      // dans le bloc « poids porté » (2e enfant) pour ne pas décaler la mise en page de l'encart
      var poids = h3.nextElementSibling;
      (poids && poids.tagName === 'DIV' ? poids : box).appendChild(el);
    });
    perksCall('', function (list) {
      if (!list) return;
      colorFollowers(list);
      addGowapPanel(list);
    });
  }
  // ---------------------------------------------------------------------------
  // Fonctions du script MHD (ex-userscripts Firefox/Chrome), intégrées à la surcouche :
  // lecture de la page affichée uniquement, envoi des infos à mh.percolouco.com
  // (aucune action dans le jeu). Même code pour tous les navigateurs : pas de GM_*.
  // ---------------------------------------------------------------------------
  var MHD_MISSION_URL = 'https://mh.percolouco.com/mission/includes/update/update_mission.php';
  var MHD_TROLL_URL = 'https://mh.percolouco.com/tactique/includes/sp_mh/parser_handler.php';

  function mhdPost(url, body, done) {
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
      body: body,
      referrerPolicy: 'no-referrer'
    }).then(function (r) { done(r.status === 200, r.status); },
            function () { done(false, 0); });
  }

  function mhdBadge(message, isError) {
    if (!document.body) return;
    var badge = document.getElementById('mhx-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mhx-badge';
      document.body.appendChild(badge);
    }
    badge.textContent = message;
    badge.className = isError ? 'mhx-badge-err' : 'mhx-badge-ok';
    badge.style.display = 'block';
    badge.style.opacity = '1';
    clearTimeout(badge.hideTimeout);
    badge.hideTimeout = setTimeout(function () {
      badge.style.opacity = '0';
      setTimeout(function () { badge.style.display = 'none'; }, 400);
    }, 3000);
  }

  function mhdNorm(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // Type de page de gestion de mission (Étapes / Récompenses / Équipe), sinon null.
  // Étapes et Récompenses l'emportent toujours sur Équipe.
  function mhdPageType() {
    var titre = mhdNorm(document.title);
    var h1 = document.querySelector('h1');
    var h1Text = mhdNorm(h1 ? h1.textContent : '');
    var body = mhdNorm(document.body ? document.body.textContent : '');
    var u = location.href.toLowerCase();
    if (titre.indexOf('gestion des etapes') >= 0) return 'etapes';
    if (titre.indexOf('gestion des recompenses') >= 0) return 'recompenses';
    if (titre.indexOf("gestion de l'equipe") >= 0) return 'equipe';
    if (body.indexOf('gestion des etapes') >= 0) return 'etapes';
    if (body.indexOf('gestion des recompenses') >= 0) return 'recompenses';
    if (h1Text.indexOf("l'equipe") >= 0 || u.indexOf('&equipe') >= 0) return 'equipe';
    return null;
  }

  // Lit la page de mission et renvoie les paramètres à envoyer, ou null si rien à envoyer
  // (page pas encore rendue, tableau absent...). `err` reçoit un message d'erreur éventuel.
  function mhdReadMission(type, err) {
    var h1 = document.querySelector('h1');
    var m = /Mission\s*\[(\d+)\]/.exec(h1 ? h1.textContent : '') || /mi=(\d+)/.exec(location.href);
    if (!m) { err.msg = 'Num\u00e9ro de mission introuvable'; return null; }

    var stages = '', rewards = '', meneur = '', equipiers = [];
    var current = null, target = null;

    if (type === 'etapes') {
      var tEt = document.querySelector('form[action*="Play_a_ActionResult"] table.mh_tdborder');
      if (!tEt) { err.msg = 'Tableau des \u00e9tapes introuvable'; return null; }
      tEt.querySelectorAll('tr.mh_tdpage').forEach(function (tr) {
        var td = tr.querySelectorAll('td');
        if (td.length < 2) return;
        var statut = '';
        if (td[2]) {
          // texte visible seulement : on retire les div (modales, texte RP caché)
          var c = td[2].cloneNode(true);
          c.querySelectorAll('div').forEach(function (d) { d.remove(); });
          statut = c.textContent.replace(/\s+/g, ' ').trim();
        }
        stages += td[0].textContent.trim() + ' ' + td[1].textContent.trim() + ' ' + statut + '\n';
      });
    } else if (type === 'recompenses') {
      var tabs = Array.prototype.slice.call(document.querySelectorAll('table.mh_tdborder'));
      var tRe = tabs.filter(function (t) { return (t.textContent || '').indexOf('R\u00e9compense') >= 0; })[0] || tabs[0];
      if (!tRe) { err.msg = 'Tableau r\u00e9compenses introuvable'; return null; }
      tRe.querySelectorAll('tr.mh_tdpage').forEach(function (tr) {
        var td = tr.querySelectorAll('td');
        if (td.length < 2) return;
        var first = td[0].textContent.trim();
        var num = first;
        var mn = /R\u00e9compense n\u00b0\s*(\d+)/i.exec(first) || /(\d+)/.exec(first);
        if (mn) num = mn[1];
        var desc = td[1].textContent.trim().replace(/^R\u00e9compense n\u00b0\s*\d+\s*/i, '').trim();
        rewards += 'R\u00e9compense n\u00b0' + num + ' ' + desc + '\n';
      });
    } else {
      var tabs2 = Array.prototype.slice.call(document.querySelectorAll('table.mh_tdborder'));
      var tEq = tabs2.filter(function (t) { return (t.textContent || '').indexOf('Rang') >= 0; })[0] || tabs2[0];
      if (!tEq) return null;
      var cur = 0, tgt = 0, hasProgress = false, validable = false;
      tEq.querySelectorAll('tr.mh_tdpage').forEach(function (tr) {
        var td = tr.querySelectorAll('td');
        var troll = null, isMeneur = false, isEquipier = false;
        if (td.length >= 5 && td[4].textContent.toLowerCase().indexOf('validable') >= 0) validable = true;
        Array.prototype.forEach.call(td, function (c) {
          var txt = c.textContent.trim().toLowerCase();
          var mt = /\((\d+)\)/.exec(txt);
          if (mt) troll = mt[1];
          if (txt === 'meneur') isMeneur = true;
          if (/^[e\u00e9]quipi[e\u00e8]re?$/.test(txt)) isEquipier = true;
          var mp = /(\d+)\s*\/\s*(\d+)/.exec(txt);
          if (mp && /demand\u00e9|tu\u00e9|massacre/.test(txt)) {
            cur += parseInt(mp[1], 10);
            tgt = parseInt(mp[2], 10);
            hasProgress = true;
          }
        });
        if (troll) {
          if (isMeneur) meneur = troll;
          else if (isEquipier) equipiers.push(troll);
        }
      });
      // étape « Validable » : l'avancement vaut l'objectif
      if (validable && hasProgress) cur = tgt;
      if (hasProgress) { current = cur; target = tgt; }
      if (!meneur && !equipiers.length) return null; // page pas encore rendue : on n'envoie rien
    }

    var p = new URLSearchParams();
    p.append('update_equipe', type === 'equipe' ? '1' : '0'); // en premier, au cas où le payload serait tronqué
    p.append('missionNumber', m[1]);
    p.append('stages', stages.trim());
    p.append('rewards', rewards.trim());
    if (type === 'equipe') {
      p.append('meneur', meneur);
      p.append('equipiers', equipiers.join(','));
      if (current !== null && target !== null) {
        p.append('count_current', current);
        p.append('count_target', target);
      }
    }
    return p.toString().replace(/%20/g, '+');
  }

  // Pages Gestion des Étapes / Récompenses / Équipe : envoi automatique, avec quelques
  // nouvelles tentatives tant que la page n'est pas rendue.
  function sendMission() {
    if (!/\/MH_Play\/Play_[^/]*\.php$/.test(location.pathname)) return;
    var tries = 0;
    (function attempt() {
      var type = mhdPageType();
      var err = {};
      var body = type ? mhdReadMission(type, err) : null;
      if (!body) {
        if (type && ++tries < 10) return setTimeout(attempt, 500);
        if (type && err.msg) mhdBadge('/!\\ ' + err.msg + ' /!\\', true);
        return;
      }
      mhdPost(MHD_MISSION_URL, body, function (ok) {
        mhdBadge(ok ? 'Mission sauvegard\u00e9e !' : 'Erreur de sauvegarde SQL', !ok);
      });
    })();
  }

  // Début de tour (TurnStart.php) : envoie la ligne « troll » du tableau et son numéro.
  function sendTrollInfo() {
    if (!/\/TurnStart\.php$/.test(location.pathname)) return;
    var id = document.body && document.body.getAttribute('data-idtroll');
    if (!id) return;
    var tr = null;
    var tbodies = document.querySelectorAll('tbody');
    for (var i = 0; i < tbodies.length && !tr; i++) {
      if (tbodies[i].closest('thead')) continue;
      for (var j = 0; j < tbodies[i].children.length; j++) {
        if (tbodies[i].children[j].tagName === 'TR') { tr = tbodies[i].children[j]; break; }
      }
    }
    if (!tr || !tr.outerHTML) return;
    mhdPost(MHD_TROLL_URL,
      'html_content=' + encodeURIComponent(tr.outerHTML) + '&troll_numero=' + encodeURIComponent(id),
      function () {});
  }

  // Profil d'un monstre : estime sa DLA.
  // 1. Durée du tour : celle de la CDM quand elle est affichée (« Durée du tour 3-5 → 4 heures »), sinon estimée
  //    à partir de l'historique du monstre.
  // 2. Début du tour : dernier événement du monstre (ceux qui commencent par « un… »), pas ceux des joueurs.
  // Peut rejouer = début du tour + durée ; cumul = peut rejouer + durée.
  function monsterDla(dateStrs, cdm) {
    var toDate = function (s) {
      var a = s.split(' '), d = a[0].split('/'), t = a[1].split(':');
      return new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);
    };
    var dates = dateStrs.map(toDate).sort(function (a, b) { return a - b; });
    if (!dates.length) return null;
    var act = [dates[0]]; // débuts de tour : les événements à moins de 2 min d'écart sont le même tour
    for (var i = 1; i < dates.length; i++) {
      if ((dates[i] - act[act.length - 1]) / 1000 > 120) act.push(dates[i]);
    }
    var moy = null;
    if (cdm) {
      moy = cdm.avg;
    } else {
      var deltas = [];
      for (var k = 1; k < act.length; k++) deltas.push((act[k] - act[k - 1]) / 3600000);
      var sans = deltas.filter(function (d) { return d <= 16; });
      if (!sans.length) return null;
      var sorted = sans.slice().sort(function (a, b) { return a - b; });
      var mid = Math.floor(sorted.length / 2);
      var med = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
      var valid = [];
      for (var n = 0; n < sans.length;) {
        var d = sans[n];
        if (d < med * 0.75 && n + 1 < sans.length && Math.abs(d + sans[n + 1] - med) < med * 0.25) {
          valid.push(d + sans[n + 1]); // un événement manquant a coupé un tour en deux
          n += 2;
          continue;
        }
        if (d >= med * 0.75) valid.push(d);
        n++;
      }
      var last3 = (valid.length ? valid : sans).slice(-3);
      moy = last3.reduce(function (a, b) { return a + b; }, 0) / last3.length;
    }
    var pad = function (x) { return (x < 10 ? '0' : '') + x; };
    var fmt = function (dt) {
      return pad(dt.getDate()) + '/' + pad(dt.getMonth() + 1) + ' \u00e0 ' + pad(dt.getHours()) + ':' + pad(dt.getMinutes());
    };
    var debut = act[act.length - 1];
    var min = new Date(debut.getTime() + moy * 3600000);
    var max = new Date(min.getTime() + moy * 3600000);
    var h = Math.floor(moy);
    return {
      dla: h + 'h ' + pad(Math.round((moy - h) * 60)) + 'm' + (cdm ? ' (CDM)' : ' (historique, peu fiable : CDM introuvable)'),
      debut: fmt(debut), min: fmt(min), max: fmt(max)
    };
  }

  // « Durée du tour   3-5 → 4  heures » dans la CDM du monstre
  function monsterCdmTurn() {
    var txt = (document.body ? document.body.textContent : '').normalize('NFC').replace(/[\s\u00a0]+/g, ' ');
    var m = /Dur\u00e9e du tour[^\d]{0,40}?(\d+(?:[.,]\d+)?)\s*[-\u2013]\s*(\d+(?:[.,]\d+)?)(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(txt);
    if (!m) return null;
    var f = function (x) { return parseFloat(x.replace(',', '.')); };
    var lo = f(m[1]), hi = f(m[2]);
    return { min: lo, max: hi, avg: m[3] ? f(m[3]) : (lo + hi) / 2 };
  }

  function addMonsterAnalysis() {
    if (!/\/MonsterView\.php$/.test(location.pathname)) return;
    var tries = 0;
    (function run() {
      if (document.querySelector('.mhx-monstre')) return;
      var cdm = monsterCdmTurn();
      if (!cdm && ++tries < 6) return setTimeout(run, 800); // la CDM peut arriver après le reste de la page
      var dates = [], all = [];
      document.querySelectorAll('#events tbody tr').forEach(function (tr) {
        var txt = tr.textContent.replace(/\s+/g, ' ');
        var m = /(\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2})/.exec(txt);
        if (!m) return;
        if (all.indexOf(m[1]) < 0) all.push(m[1]);
        // événement du monstre : la description (texte après la date et le type) commence par « un… »
        var after = txt.slice(txt.indexOf(m[1]) + m[1].length).replace(/^\s*[A-Z\u00c0-\u00dc]+\s*/, '');
        if (/^\s*(?:un|une)\s/i.test(after) && dates.indexOf(m[1]) < 0) dates.push(m[1]);
      });
      if (!dates.length) dates = all; // format inattendu : on retombe sur tous les événements
      var s = dates.length ? monsterDla(dates, cdm) : null;
      if (!s) return;
      var box = document.createElement('div');
      box.className = 'mhx-monstre';
      box.innerHTML = '<h4>\ud83e\udd87 Analyse Tactique (Script MH2)</h4>' +
        '<b>Dur\u00e9e du tour estim\u00e9e :</b> ' + s.dla + '<br>' +
        '<b>Dernier tour commenc\u00e9 le :</b> ' + s.debut + '<br>' +
        '<b>Peut rejouer \u00e0 partir du :</b> ' + s.min + '<br>' +
        '<b>Son prochain cumul est le :</b> ' + s.max;
      var form = document.querySelector('form[action=""]');
      if (form && form.parentNode) form.parentNode.insertBefore(box, form);
      else if (document.body) document.body.insertBefore(box, document.body.firstChild);
    })();
  }

  function init() { addMonsterPv(); sendPortalNotice(); rememberGowapPerks(); addItButton(); addFollowerDla(); sendMission(); sendTrollInfo(); addMonsterAnalysis(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
