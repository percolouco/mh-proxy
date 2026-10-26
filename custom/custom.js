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

  // Menu : image des points cardinaux (pistage) au début de la div #favoris.
  function addPistageImage() {
    if (!/\/Play_menu\.php$/.test(location.pathname) || document.getElementById('mhx-pistage')) return;
    var fav = document.getElementById('favoris');
    if (!fav) return;
    var img = document.createElement('img');
    img.id = 'mhx-pistage';
    img.src = '/_mhx/img/pistage.png';
    img.alt = 'Pistage : points cardinaux';
    fav.insertBefore(img, fav.firstChild);
  }

  // Page Ma vue : clic sur la colonne PV d'un troll -> popup « envoyer une demande de sacro » -> confirmer -> message dans le groupe WhatsApp.
  // Rien n'est envoyé au jeu ; le message part seulement après le clic sur « Confirmer ».
  var NOTIF_FLASH_URL = 'https://mh.percolouco.com/notif/flash_whatsapp.php';
  var EFFETS_URL = 'https://mh.percolouco.com/notif/effets_monstres.php';
  var NOTIF_SACRO_URL = 'https://mh.percolouco.com/notif/sacro_whatsapp.php';
  function addSacroClick() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    document.addEventListener('click', function (e) {
      var td = e.target.closest && e.target.closest('td.mhx-pvcol2');
      if (!td || !td.firstChild || document.getElementById('mhx-sacro-pop')) return;
      var tr = td.parentNode, ref = tr.querySelector('td.ref');
      var m = /(\d+)\s*\/\s*(\d+)/.exec(td.textContent);
      if (!ref || !m) return;
      var cible = ref.textContent.trim();
      var nomCell = ref.nextElementSibling;
      var nom = nomCell ? nomCell.textContent.replace(/\s+/g, ' ').trim() : '';
      // même look que l'interface : fond parchemin, bandeau marron (mh_tdtitre), boutons mh_form_submit
      var ov = document.createElement('div');
      ov.id = 'mhx-sacro-pop';
      var box = document.createElement('div');
      box.className = 'mhx-sacro-box';
      var head = document.createElement('div');
      head.className = 'mh_tdtitre mhx-sacro-head';
      var t = document.createElement('span');
      t.textContent = 'Demande de sacro';
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'mhx-sacro-x';
      x.textContent = '\u00d7';
      x.title = 'Fermer';
      x.setAttribute('aria-label', 'Fermer');
      head.appendChild(t); head.appendChild(x);
      var body = document.createElement('div');
      body.className = 'mhx-sacro-body';
      var q = document.createElement('div');
      q.textContent = 'Envoyer une demande de sacro ?';
      var d = document.createElement('div');
      d.className = 'mhx-sacro-who';
      d.textContent = (nom || 'Troll') + ' \u2014 ' + m[1] + '/' + m[2] + ' PV';
      var st = document.createElement('div');
      st.className = 'mhx-sacro-st';
      var btns = document.createElement('div');
      var mk = function (label) {
        var bt = document.createElement('input');
        bt.type = 'button';
        bt.className = 'mh_form_submit mhx-sacro-btn';
        bt.value = label;
        return bt;
      };
      var ok = mk('Confirmer'), no = mk('Annuler');
      var close = function () { document.removeEventListener('keydown', onKey); if (ov.parentNode) ov.parentNode.removeChild(ov); };
      var onKey = function (ev) { if (ev.key === 'Escape') close(); };
      no.addEventListener('click', close);
      x.addEventListener('click', close);
      document.addEventListener('keydown', onKey);
      ov.addEventListener('click', function (ev) { if (ev.target === ov) close(); });
      ok.addEventListener('click', function () {
        var troll = currentTrollId();
        if (!troll) { st.textContent = 'Troll connect\u00e9 introuvable.'; return; }
        ok.disabled = true;
        st.textContent = 'Envoi...';
        mhdPost(NOTIF_SACRO_URL, 'troll=' + troll + '&cible=' + encodeURIComponent(cible) + '&pv=' + m[1] + '&pvmax=' + m[2] + '&nom=' + encodeURIComponent(nom), function (done) {
          st.textContent = done ? 'Demande envoy\u00e9e sur WhatsApp.' : 'Envoi impossible.';
          if (done) setTimeout(close, 1200); else ok.disabled = false;
        });
      });
      btns.appendChild(ok); btns.appendChild(no);
      body.appendChild(q); body.appendChild(d); body.appendChild(st); body.appendChild(btns);
      box.appendChild(head); box.appendChild(body);
      ov.appendChild(box);
      document.body.appendChild(ov);
    });
  }

  // Page Ma vue : picto à côté du nom des monstres touchés par un Flash Aveuglant (durée approximative : tours x durée du tour du lanceur).
  function addEffectIcons() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var t0 = Date.now();
    var paint = function (list) {
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre');
        var e = ref && list[ref.textContent.trim()];
        var old = tr.querySelector('.mhx-fa');
        if (!nom || !e || e.effet !== 'FA' || e.reste - Math.round((Date.now() - t0) / 1000) <= 0) { if (old) old.parentNode.removeChild(old); return; }
        var rest = e.reste - Math.round((Date.now() - t0) / 1000), mn = Math.floor(rest / 60);
        var tip = 'Flash Aveuglant' + (e.reduit ? ' (effet r\u00e9duit)' : '') + ' : Att ' + e.att + ' | Esq ' + e.esq + ' | Vue ' + e.vue + '\nEncore ~' + Math.floor(mn / 60) + 'h' + ('0' + (mn % 60)).slice(-2) + ' (' + e.tours + ' tour' + (e.tours > 1 ? 's' : '') + ')';
        if (!old) {
          old = document.createElement('span');
          old.className = 'mhx-fa';
          old.textContent = ' \u1f4ab';
          nom.parentNode.insertBefore(old, nom.nextSibling);
        }
        old.title = tip;
      });
    };
    var load = function () {
      fetch(EFFETS_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (l) { if (l) { t0 = Date.now(); paint(l); } }, function () {});
    };
    load();
    setInterval(load, 60000);
    [1500, 4000, 8000].forEach(function (d) { setTimeout(load, d); });
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

  // Page profil d'un suivant (Play_a_Action.php?type=F&id=-4&id_target=N) : \u00ab Ramasse les Tr\u00e9sors \u00bb
  // dans les am\u00e9liorations -> ajout\u00e9 en vert \u00e0 la liste commune s'il n'y est pas d\u00e9j\u00e0.
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

  // Bloc le plus proche (en remontant) qui porte le fond bleu des encarts, sinon l'encart lui-m\u00eame
  function followerBlock(h3) {
    if (h3.mhxBlock) return h3.mhxBlock; // apr\u00e8s coloration le fond d'origine n'est plus d\u00e9tectable
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

  // Page Ma vue : les gowaps de la liste commune sont colorés (même couleur que sur la page Suivants), reconnus par leur référence.
  function colorVueGowaps() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    perksCall('', function (list) {
      if (!list) return;
      var paint = function () {
        document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
          var ref = tr.querySelector('td.ref');
          var c = ref && list[ref.textContent.trim()];
          if (!c || !PERK_COLORS[c]) return;
          tr.classList.add('mhx-gw'); // la couleur s'applique par le CSS, donc aussi aux colonnes ajout\u00e9es apr\u00e8s (PV)
          tr.style.setProperty('--mhx-gw', PERK_COLORS[c]);
        });
      };
      paint();
      [1500, 4000, 8000].forEach(function (d) { setTimeout(paint, d); }); // le tableau est retravaillé après le chargement
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
  // le serveur MH). Lecture du texte affich\u00e9 seulement, rien n'est soumis dans le jeu ; un portail n'est
  // envoy\u00e9 qu'une fois (le serveur garde son num\u00e9ro).
  var NOTIF_PORTAIL_URL = 'https://mh.percolouco.com/notif/portail_whatsapp.php';
  // Num\u00e9ro du troll connect\u00e9 : data-idtroll de la page, sinon d'un cadre du m\u00eame jeu (menu, vue...) ouvert avec
  // la m\u00eame session. Pas de valeur m\u00e9moris\u00e9e d'une autre session : mieux vaut ne rien envoyer qu'un mauvais nom.
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
  // R\u00e9sultat d'un Lancer de Cr\u00e9atures : monstres touch\u00e9s, d\u00e9g\u00e2ts, morts -> groupe WhatsApp (m\u00eame principe que le portail).
  // Deux pages possibles : la saisie (« Vous tentez de saisir… ») et le lancer (« Vous avez lancé X sur Y »).
  var NOTIF_LANCER_URL = 'https://mh.percolouco.com/notif/lancer_whatsapp.php';
  function parseLancer(txt) {
    var art = '(?:une|un|la|le|l\u2019|l\')\\s?', mon = '(.+?) \\((\\d+)\\)';
    var deg = function (t, re) { var m = re.exec(t); return m ? parseInt(m[1], 10) : null; };
    var mort = function (t) { return /TU\u00c9/.test(t); };
    var m = new RegExp('Vous avez lanc\u00e9 ' + art + mon + ' sur ' + art + mon + '\\s?\\.').exec(txt);
    if (m) {
      var reste = txt.slice(m.index + m[0].length), parts = reste.split(new RegExp('Et sur ' + art));
      var out = [{ role: 'lance', nom: m[1], id: m[2], degats: deg(parts[0], /a subi (\d+) points? de d\u00e9g\u00e2ts/), mort: mort(parts[0]) }];
      var cibles = parts.length > 1 ? parts.slice(1) : [];
      cibles.forEach(function (p) {
        var c = new RegExp('^' + mon + '\\s?:').exec(p);
        if (c) out.push({ role: 'cible', nom: c[1], id: c[2], degats: deg(p, /inflig\u00e9 (\d+) points? de d\u00e9g\u00e2ts/), mort: mort(p) });
      });
      if (out.length === 1) out.push({ role: 'cible', nom: m[3], id: m[4], degats: deg(reste, /inflig\u00e9 (\d+) points? de d\u00e9g\u00e2ts/), mort: mort(reste) });
      // la m\u00eame page peut contenir la saisie juste avant : la cr\u00e9ature lanc\u00e9e a alors pris deux coups
      var sa = new RegExp('Vous tentez de saisir ' + art + mon + ' gr\u00e2ce \u00e0').exec(txt.slice(0, m.index));
      if (sa && sa[2] === out[0].id && /r\u00e9ussi \u00e0 attraper/.test(txt.slice(0, m.index))) {
        var d1 = deg(txt.slice(0, m.index), /inflig\u00e9 (\d+) points? de d\u00e9g\u00e2ts/);
        if (d1 !== null && out[0].degats !== null) {
          out[0].detail = d1 + ' + ' + out[0].degats;
          out[0].degats += d1;
          out[0].mort = out[0].mort || mort(txt.slice(0, m.index));
        }
      }
      out = out.filter(function (x) { return x.degats !== null; });
      return out.length ? { type: 'lancer', monstres: out } : null;
    }
    var s = new RegExp('Vous tentez de saisir ' + art + mon + ' gr\u00e2ce \u00e0').exec(txt);
    if (s && /r\u00e9ussi \u00e0 attraper/.test(txt)) {
      var d = deg(txt, /inflig\u00e9 (\d+) points? de d\u00e9g\u00e2ts/);
      if (d !== null) return { type: 'saisie', monstres: [{ role: 'saisi', nom: s[1], id: s[2], degats: d, mort: mort(txt) }] };
    }
    return null;
  }
  // Attaque réussie sur un monstre (sortilège ou compétence) : dégâts, PV perdus, mort, butin -> groupe WhatsApp.
  function parseAttaque(txt) {
    var m = /Vous avez attaqu\u00e9 (?:une|un|la|le|l\u2019|l')\s?(.+?) \((\d+)\) gr\u00e2ce \u00e0 (un sortil\u00e8ge|une comp\u00e9tence)/.exec(txt);
    if (!m || !/TOUCH\u00c9/.test(txt)) return null;
    var d = /inflig\u00e9 (\d+) points? de d\u00e9g\u00e2ts/.exec(txt);
    if (!d) return null;
    var pv = /ne perdra que (\d+) points? de vie/.exec(txt);
    var ef = /a donc un (EFFET [A-Z\u00c9]+)/.exec(txt);
    var px = /gagn\u00e9 un total de (\d+) PX/.exec(txt);
    var mon = { role: 'cible', nom: m[1], id: m[2], degats: parseInt(d[1], 10), mort: /Vous l'avez TU\u00c9/.test(txt) };
    var ip = /N\u00e9anmoins, (?:une|un|la|le|l\u2019|l')\s?(.+?) \((\d+)\) s.est interpos/.exec(txt);
    if (ip) { mon.vise = { nom: mon.nom, id: mon.id }; mon.nom = ip[1]; mon.id = ip[2]; } // le coup touche le monstre interpos\u00e9, pas la cible vis\u00e9e
    var es = /(?:jet d'Esquive|jet de r\u00e9flexe) de votre adversaire est de : ?(\d+)/i.exec(txt);
    if (es && parseInt(es[1], 10) > 0) mon.esquive = parseInt(es[1], 10);
    if (pv) mon.pv = parseInt(pv[1], 10);
    if (px) mon.px = parseInt(px[1], 10);
    var jets = (txt.match(/(?:Votre jet d'Attaque|Le jet (?:d'Esquive|de r\u00e9flexe) de votre adversaire|Jet de R\u00e9sistance) (?:est de )?: ?-?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    var tt = /(?:Comp\u00e9tence|Sortil\u00e8ge) : (.{1,40}?)(?= (?:Vous|Votre)\b)/.exec(txt); // titre de l'\u00e9cran : \u00ab Sortil\u00e8ge : Vampirisme \u00bb
    return { type: 'attaque', nom: tt ? tt[1] : '', moyen: m[3] === 'un sortil\u00e8ge' ? 'sortil\u00e8ge' : 'comp\u00e9tence', effet: ef ? ef[1].toLowerCase().replace('reduit', 'r\u00e9duit') : '', sig: jets, monstres: [mon] };
  }
  // Sortilège sans dégâts (Hypnotisme...) : cible influencée, effet et état de la cible.
  function parseSortEffet(txt) {
    var m = /Le Sortil\u00e8ge ([A-Z\u00c0-\u00dc' -]+?) a eu l'effet suivant : ?(?:une|un|la|le|l\u2019|l')\s?(.+?) \((\d+)\) a \u00e9t\u00e9 influenc\u00e9/.exec(txt);
    if (!m) return null;
    var ef = /a donc un (EFFET [A-Z\u00c9]+)/.exec(txt);
    var et = /La Cible est (.{1,60}?) jusqu'\u00e0 sa prochaine Date Limite d'Action/.exec(txt);
    var tt = /Sortil\u00e8ge : (.{1,40}?)(?= (?:Vous|Votre)\b)/.exec(txt);
    var jets = (txt.match(/(?:Jet de R\u00e9sistance) ?: ?-?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    var mon = { role: 'cible', nom: m[2], id: m[3], etat: et ? et[1] : '' };
    return { type: 'attaque', nom: tt ? tt[1] : m[1].charAt(0) + m[1].slice(1).toLowerCase(), moyen: 'sortil\u00e8ge', effet: ef ? ef[1].toLowerCase().replace('reduit', 'r\u00e9duit') : '', sig: jets + '|' + m[3], monstres: [mon] };
  }
  // Sortilège Flash Aveuglant : une section par cible touchée (monstre ou troll), avec durée en tours, effet réduit et malus.
  function parseFlash(txt) {
    var re = /\((\d+)\) a \u00e9t\u00e9 influenc\u00e9 par l'effet du sortil\u00e8ge : Flash Aveuglant, pour une dur\u00e9e de (\d+) tours?/g;
    var hits = [], m;
    while ((m = re.exec(txt))) hits.push({ id: m[1], tours: parseInt(m[2], 10), start: m.index, end: re.lastIndex });
    if (!hits.length) return null;
    var cibles = [], prev = 0;
    hits.forEach(function (h, i) {
      var avant = txt.slice(prev, h.start);
      var cut = Math.max(avant.lastIndexOf('Copier le texte') >= 0 ? avant.lastIndexOf('Copier le texte') + 15 : 0, (function () { var k = /Vue : -?\d+/g, p = 0, x; while ((x = k.exec(avant))) p = k.lastIndex; return p; })());
      var nom = avant.slice(cut).replace(/^[\s.]+|\s+$/g, '');
      var apres = txt.slice(h.end, i + 1 < hits.length ? hits[i + 1].start : txt.length);
      var mal = /Att : (-?\d+) \| Esq : (-?\d+) \| Vue : (-?\d+)/.exec(apres);
      var art = /^(?:une|un)\s+/.exec(nom);
      if (art) nom = nom.slice(art[0].length);
      if (!nom || nom.length > 70) return;
      cibles.push({ nom: nom, id: h.id, monstre: !!art, tours: h.tours, reduit: /EFFET R[E\u00c9]DUIT/.test(apres), att: mal ? parseInt(mal[1], 10) : 0, esq: mal ? parseInt(mal[2], 10) : 0, vue: mal ? parseInt(mal[3], 10) : 0 });
      prev = h.end;
    });
    if (!cibles.length) return null;
    var jets = (txt.match(/Jet de R\u00e9sistance ?: ?-?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    return { type: 'flash', sig: jets, cibles: cibles };
  }
  // Compétence Baroufle : symphonie, effets, durée et lieu -> groupe WhatsApp.
  function parseBaroufle(txt) {
    var so = /Vous parvenez \u00e0 jouer (\d+) sons?/.exec(txt);
    if (!so) return null;
    var sy = /symphonie suivante : ["\u201c\u00ab] ?(.+?) ?["\u201d\u00bb]/.exec(txt);
    var ef = /effet suivant :\s*(.+?)\s*Votre tintamarre aura des effets pendant (\d+) tours?/.exec(txt);
    var po = /X = ([+-]?\d+) \| Y = ([+-]?\d+) \| N = ([+-]?\d+)/.exec(txt.slice(txt.indexOf('Votre m\u00e9lodie')));
    var effets = ef ? ef[1].split(/\s-\s(?=[A-Z\u00c0-\u00dc])/).map(function (e) { return e.replace(/^ ?- ?/, '').replace(/ : de /, ' : ').trim(); }).filter(Boolean) : [];
    var jets = (txt.match(/jet de (\d+) sur/) || [])[1] || '';
    var res = { type: 'baroufle', sons: parseInt(so[1], 10), symphonie: sy ? sy[1] : '', effets: effets, tours: ef ? parseInt(ef[2], 10) : 0, sig: jets };
    if (po) { res.x = po[1]; res.y = po[2]; res.n = po[3]; }
    return res;
  }
  function sendLancerNotice() {
    if (!/\/Play_a_ActionResult\.php$/.test(location.pathname) || !document.body) return;
    var txt = document.body.textContent.replace(/[\s\u00a0]+/g, ' ');
    var fl = parseFlash(txt), troll0 = currentTrollId();
    if (fl && troll0) {
      mhdPost(NOTIF_FLASH_URL, 'troll=' + troll0 + '&data=' + encodeURIComponent(JSON.stringify({ sig: fl.sig, cibles: fl.cibles })), function (ok) {
        mhdBadge(ok ? 'Flash Aveuglant signal\u00e9 sur WhatsApp' : 'Flash Aveuglant : envoi impossible', !ok);
      });
      return;
    }
    var res = parseLancer(txt) || parseAttaque(txt) || parseSortEffet(txt) || parseBaroufle(txt);
    if (res && !res.sig) res.sig = (txt.match(/jet[^:]{0,40}: ?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    var troll = currentTrollId();
    if (!res || !troll) return;
    mhdPost(NOTIF_LANCER_URL, 'troll=' + troll + '&data=' + encodeURIComponent(JSON.stringify(res)), function (ok) {
      mhdBadge(ok ? 'Action signal\u00e9e sur WhatsApp' : 'Action : envoi WhatsApp impossible', !ok);
    });
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
  // Source : le popup CDM de Mountyzilla (clic sur le niveau du monstre), que Mountyzilla remplit lui-même.
  // On l'ouvre une fraction de seconde (masqu\u00e9 par le CSS), on lit la ligne \u00ab Points de Vie \u00bb, puis on le referme.
  // Ouvrir ce popup n'est qu'un affichage, rien n'est envoy\u00e9 au jeu. Pas de valeur pour les Gowap Apprivois\u00e9s ni les Familiers.
  // Trois cas dans la ligne « Points de Vie » du popup :
  //  - « 90-110 → 100 PV » seul : on affiche « 90-110 PV » ;
  //  - avec une ligne « Blessure » en plus : CDM fiable, même affichage + ✓ ;
  //  - avec l'intervalle de confiance jaune (second intervalle) : CDM pas encore viable, on affiche
  //    « ~65 PV » (valeur après la flèche) + ⚠.
  var PV_KEY = 'mhx-pv-monstres-3';
  function pvCache() {
    try { return JSON.parse(localStorage.getItem(PV_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function addMonsterPv() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var cache = pvCache(), busy = false, tries = {}, done = {};
    var rows = function () {
      var out = [];
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre'), niv = tr.querySelector('td[data-indxmz]');
        if (!ref || !nom || !niv || /^\s*(?:Gowap Apprivois|Familier)/i.test(nom.textContent)) return;
        out.push({ tr: tr, id: ref.textContent.trim(), nom: nom, niv: niv });
      });
      return out;
    };
    // Vraie colonne « PV » entre « Niv. » et « R\u00e9f. » : une cellule ajout\u00e9e apr\u00e8s celle du niveau dans chaque ligne
    var ensureCol = function () {
      var th = document.querySelector('#VUE_monstres thead tr td:nth-child(3), #VUE_monstres thead tr th:nth-child(3)');
      if (th && /^\s*Niv/i.test(th.textContent) && !th.parentNode.querySelector('.mhx-pvh')) {
        var h = document.createElement(th.tagName.toLowerCase());
        h.className = 'mhx-pvh'; // sans style propre : il reprend celui des autres en-têtes du tableau
        h.textContent = 'PV';
        h.style.cssText = 'width: 80px; display: table-cell;';
        th.parentNode.insertBefore(h, th.nextSibling);
      }
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var niv = tr.cells[2]; // colonne « Niv. » : présente dans toutes les lignes, même sans niveau cliquable
        if (!niv || tr.cells.length < 6 || tr.querySelector('td.mhx-pvcol')) return;
        var td = document.createElement('td');
        td.className = 'mhx-pvcol';
        td.style.cssText = 'width: 80px; display: table-cell;'; // footable masque les cellules qu'il ne conna\u00eet pas
        niv.parentNode.insertBefore(td, niv.nextSibling);
      });
    };
    var show = function (r) {
      var c = cache[r.id];
      var td = r.tr.querySelector('td.mhx-pvcol');
      if (!c || !td) return;
      if (c.k === 'fam') { td.textContent = ''; td.className = 'mhx-pvcol'; td.title = ''; return; } // familier : pas d'info
      var txt = c.v + ' PV';
      if (td.textContent !== txt) td.textContent = txt;
      td.className = 'mhx-pvcol mhx-pv-' + c.k;
      td.title = c.k === 'bless' ? 'CDM fiable (blessure connue)'
        : c.k === 'doute' ? 'Estimation : la CDM n\u2019est pas encore fiable' : '';
    };
    var readPv = function (id) {
      var pop = document.getElementById('popupCDM' + id);
      if (!pop) return null;
      var res = null, bless = false, familier = false;
      pop.querySelectorAll('tr').forEach(function (tr) {
        var c = tr.cells;
        if (!c || c.length < 2) return;
        var lab = c[0].textContent.trim();
        if (/^Blessure$/i.test(lab) && c[1].textContent.trim()) bless = true;
        if (/^Famille$/i.test(lab) && /^\s*Familier/i.test(c[1].textContent)) familier = true;
        if (/^Points de Vie$/i.test(lab)) {
          var td = c[1].cloneNode(true);
          var doute = td.querySelector('span') !== null; // intervalle de confiance à 80 % (jaune)
          td.querySelectorAll('span').forEach(function (x) { x.remove(); });
          var t = td.textContent.replace(/[\s\u00a0]+/g, ' ');
          var m = /(\d+)\s*-\s*(\d+)\s*\u2192\s*(\d+(?:[.,]\d+)?)/.exec(t);
          if (doute) {
            var avg = m ? m[3] : ((/(\d+(?:[.,]\d+)?)\s*PV/.exec(t) || [])[1]);
            if (avg) res = { v: '~' + avg, k: 'doute' };
          } else if (m) {
            res = { v: m[1] + '-' + m[2], k: 'ok' };
          } else {
            var m2 = /(\d+)\s*-\s*(\d+)/.exec(t) || /(\d+)/.exec(t);
            if (m2) res = { v: m2[2] ? m2[1] + '-' + m2[2] : m2[1], k: 'ok' };
          }
        }
      });
      if (familier) return { v: '', k: 'fam' };
      if (res && bless && res.k === 'ok') res.k = 'bless';
      return res;
    };
    var sleep = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
    var harvest = async function () {
      if (busy) return;
      busy = true;
      document.body.classList.add('mhx-pv-lecture');
      try {
        var list = rows(), changed = false;
        for (var i = 0; i < list.length; i++) {
          var r = list[i];
          show(r);
          if (done[r.id] || (tries[r.id] || 0) >= 5 || document.getElementById('popupCDM' + r.id)) continue;
          tries[r.id] = (tries[r.id] || 0) + 1;
          r.niv.click();
          await sleep(40);
          var pv = readPv(r.id);
          if (document.getElementById('popupCDM' + r.id)) { r.niv.click(); done[r.id] = true; } // referme (le clic bascule le popup)
          if (pv) {
            if (!cache[r.id] || cache[r.id].v !== pv.v || cache[r.id].k !== pv.k) { cache[r.id] = pv; changed = true; }
            show(r);
          }
        }
        if (changed) { try { localStorage.setItem(PV_KEY, JSON.stringify(cache)); } catch (e) {} }
      } finally {
        document.body.classList.remove('mhx-pv-lecture');
        busy = false;
      }
    };
    var n = 0, timer = setInterval(function () {
      ensureCol();
      rows().forEach(show);
      harvest();
      var tb = document.querySelector('#VUE_monstres tbody');
      if (tb && !tb.mhxObserved) {
        tb.mhxObserved = true;
        new MutationObserver(function () { ensureCol(); rows().forEach(show); }).observe(tb, { childList: true });
      }
      if (++n > 25) clearInterval(timer);
    }, 2000);
  }

  // Page \u00ab Suivants \u00bb : affiche la date limite d'action (DLA) de chaque suivant dans son encart bleu.
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
      // dans le bloc \u00ab poids port\u00e9 \u00bb (2e enfant) pour ne pas d\u00e9caler la mise en page de l'encart
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
  // \u00c9tapes et R\u00e9compenses l'emportent toujours sur \u00c9quipe.
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
  // (page pas encore rendue, tableau absent...). `err` re\u00e7oit un message d'erreur \u00e9ventuel.
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
      // \u00e9tape \u00ab Validable \u00bb : l'avancement vaut l'objectif
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
  //    \u00e0 partir de l'historique du monstre.
  // 2. Début du tour : dernier événement du monstre (ceux qui commencent par « un… »), pas ceux des joueurs.
  // Peut rejouer = début du tour + durée ; cumul = peut rejouer + durée.
  function monsterDla(dateStrs, cdm) {
    var toDate = function (s) {
      var a = s.split(' '), d = a[0].split('/'), t = a[1].split(':');
      return new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);
    };
    var dates = dateStrs.map(toDate).sort(function (a, b) { return a - b; });
    if (!dates.length) return null;
    var act = [dates[0]]; // d\u00e9buts de tour : les \u00e9v\u00e9nements \u00e0 moins de 2 min d'\u00e9cart sont le m\u00eame tour
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

  // Page Ma vue : deux colonnes pour les trolls, PA (après Actions) et PV (avant Réf.), lues dans le récap tactique du
  // serveur MH (mêmes valeurs, mêmes couleurs). Cellule vide quand le serveur ne connaît pas le troll.
  var ETAT_URL = 'https://mh.percolouco.com/notif/trolls_etat.php';
  function addTrollEtat() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var etat = null, started = false, t0 = 0;
    var ensureCols = function () {
      var hr = document.querySelector('#VUE_trolls thead tr');
      if (!hr) return false;
      var hAct = hr.querySelector('.actions'), hRef = hr.querySelector('.ref');
      if (!hAct || !hRef) return false;
      var mk = function (tag, cls, txt, w) {
        var e = document.createElement(tag);
        e.className = cls;
        if (txt) e.textContent = txt;
        e.style.cssText = 'width: ' + w + 'px; display: table-cell;'; // footable masque les cellules qu'il ne connait pas
        return e;
      };
      if (!hr.querySelector('.mhx-pah')) {
        var tag = hAct.tagName.toLowerCase();
        hAct.parentNode.insertBefore(mk(tag, 'mhx-pah', 'PA', 20), hAct.nextSibling);
        hRef.parentNode.insertBefore(mk(tag, 'mhx-pvth', 'PV', 66), hRef);
        hRef.parentNode.insertBefore(mk(tag, 'mhx-dlah', 'DLA \u00e0...', 50), hRef);
      }
      document.querySelectorAll('#VUE_trolls tbody tr').forEach(function (tr) {
        var act = tr.querySelector('td.actions'), ref = tr.querySelector('td.ref');
        if (!act || !ref || tr.querySelector('td.mhx-pacol')) return;
        act.parentNode.insertBefore(mk('td', 'mhx-pacol', '', 20), act.nextSibling);
        ref.parentNode.insertBefore(mk('td', 'mhx-pvcol2', '', 66), ref);
        ref.parentNode.insertBefore(mk('td', 'mhx-dlacol', '', 50), ref);
      });
      return true;
    };
    // Trolls admin (visible dans IT) absents de la vue du joueur : ajout\u00e9s d'apr\u00e8s le serveur MH, cellules d'actions vides
    var GUILDES = { 3848: 'Tr\u00f5lls Of Darkness II' };
    var addMissing = function () {
      var tb = document.querySelector('#VUE_trolls tbody');
      var model = tb && tb.querySelector('tr');
      var me = currentTrollId();
      if (!model || !me) return;
      var pos = null, have = {};
      tb.querySelectorAll('tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref');
        if (!ref) return;
        have[ref.textContent.trim()] = true;
        if (ref.textContent.trim() === me) {
          var g = function (c) { var t = tr.querySelector('td.' + c); return t ? parseInt(t.textContent, 10) : NaN; };
          pos = [g('x'), g('y'), g('n')];
        }
      });
      Object.keys(etat).forEach(function (id) {
        var e = etat[id];
        if (!e.admin || have[id]) return;
        var dist = pos && !isNaN(pos[0] + pos[1] + pos[2]) ? Math.max(Math.abs(e.x - pos[0]), Math.abs(e.y - pos[1]), Math.abs(e.n - pos[2])) : null;
        var tr = model.cloneNode(true);
        tr.className = (tr.className || '') + ' mhx-horsvue';
        var set = function (c, txt) { var t = tr.querySelector('td.' + c); if (t) { t.textContent = txt; t.removeAttribute('data-sort-value'); } };
        tr.querySelectorAll('td.mhx-pacol, td.mhx-pvcol2, td.mhx-dlacol').forEach(function (t) { t.textContent = ''; t.title = ''; });
        set('dist', dist === null ? '' : dist);
        var d = tr.querySelector('td.dist'); if (d) d.removeAttribute('data-trajcanv-xyn');
        var act = tr.querySelector('td.actions'); if (act) act.textContent = '';
        set('ref', id); set('niv', e.niveau); set('race', e.race); set('x', e.x); set('y', e.y); set('n', e.n);
        var nom = tr.querySelector('td.ref'); nom = nom && nom.nextElementSibling;
        // les cellules Nom et Guilde ne portent pas de classe fixe : Nom suit R\u00e9f., Guilde suit Nom
        var gu = nom && nom.nextElementSibling;
        if (nom) {
          nom.textContent = '';
          var a = document.createElement('a');
          a.className = 'troll'; a.href = 'javascript:PVT(' + id + ')'; a.textContent = e.nom;
          nom.appendChild(a);
          nom.setAttribute('data-sort-value', e.nom);
          nom.title = 'Hors de port\u00e9e de vue : ajout\u00e9 d\u2019apr\u00e8s le serveur MH';
        }
        if (gu) {
          gu.textContent = '';
          if (e.guilde) {
            var ga = document.createElement('a');
            ga.href = 'javascript:PVG(' + e.guilde + ')';
            ga.textContent = GUILDES[e.guilde] || ('Guilde ' + e.guilde);
            gu.appendChild(ga);
          }
          gu.removeAttribute('data-sort-value');
        }
        // plac\u00e9 par distance croissante parmi les lignes existantes
        var before = null;
        if (dist !== null) {
          tb.querySelectorAll('tr').forEach(function (r) {
            var dc = r.querySelector('td.dist'), v = dc ? parseInt(dc.textContent, 10) : NaN;
            if (!before && !isNaN(v) && v > dist) before = r;
          });
        }
        tb.insertBefore(tr, before);
        have[id] = true;
      });
    };
    var show = function () {
      if (!etat) return;
      document.querySelectorAll('#VUE_trolls tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), pa = tr.querySelector('td.mhx-pacol'), pv = tr.querySelector('td.mhx-pvcol2'), dl = tr.querySelector('td.mhx-dlacol');
        var e = ref && etat[ref.textContent.trim()];
        if (!e || !pa || !pv || !dl) return;
        // temps restant avant la prochaine DLA (format 4h00) ; ~ si estim\u00e9e (DLA enregistr\u00e9e d\u00e9pass\u00e9e : on ajoute la dur\u00e9e du tour)
        var rest = typeof e.dla_dans === 'number' ? e.dla_dans - Math.round((Date.now() - t0) / 1000) : -1;
        var dt = '';
        var tip = '';
        if (rest > 0) {
          // heure de la prochaine DLA (heure locale, avec le jour si ce n'est pas aujourd'hui) ; temps restant au survol
          var d = new Date(Date.now() + rest * 1000), p2 = function (x) { return ('0' + x).slice(-2); };
          var mn = Math.floor(rest / 60), now = new Date();
          dt = (e.dla_estimee ? '~' : '') + (d.toDateString() === now.toDateString() ? '' : p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + ' ') + p2(d.getHours()) + 'h' + p2(d.getMinutes());
          tip = 'Dans ' + Math.floor(mn / 60) + 'h' + p2(mn % 60) + (e.dla_estimee ? ' (estimation)' : '');
          if (e.duree_tour > 0) { // cumul d'après (approximatif) = prochaine DLA + une durée de tour
            var c = new Date(Date.now() + (rest + e.duree_tour) * 1000);
            tip += '\nCumul : ~' + (c.toDateString() === now.toDateString() ? '' : p2(c.getDate()) + '/' + p2(c.getMonth() + 1) + ' ') + p2(c.getHours()) + 'h' + p2(c.getMinutes());
          }
        }
        if (dl.textContent !== dt) dl.textContent = dt;
        if (dl.title !== tip) dl.title = tip;
        var txt = e.pa === null ? '' : String(e.pa);
        if (pa.textContent !== txt) pa.textContent = txt;
        // comme le récap : vert si la DLA est dépassée ou si le troll a au moins 4 PA
        pa.className = 'mhx-pacol' + (e.pa !== null && (e.dla_passee || e.pa >= 4) ? ' mhx-pa-vert' : '');
        if (e.pv === null || !e.pvmax || pv.firstChild) return;
        var r = e.pv / e.pvmax;
        var t = document.createElement('div');
        t.textContent = e.pv + ' / ' + e.pvmax;
        var bar = document.createElement('div');
        bar.className = 'mhx-pvbar';
        var fill = document.createElement('div');
        fill.className = r >= 0.8 ? 'mhx-pvfill-vert' : r >= 0.5 ? 'mhx-pvfill-orange' : 'mhx-pvfill-rouge';
        fill.style.width = Math.max(0, Math.min(100, r * 100)) + '%';
        bar.appendChild(fill);
        pv.appendChild(t);
        pv.appendChild(bar);
      });
    };
    var start = function () {
      if (!ensureCols()) return;
      if (!started) {
        started = true;
        var ids = [];
        document.querySelectorAll('#VUE_trolls tbody td.ref').forEach(function (td) {
          var id = td.textContent.trim();
          if (/^\d+$/.test(id) && ids.indexOf(id) < 0) ids.push(id);
        });
        if (!ids.length) return;
        fetch(ETAT_URL + '?admin=1&ids=' + ids.join(','), { referrerPolicy: 'no-referrer' })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (j) { if (j) { etat = j; t0 = Date.now(); addMissing(); show(); } })
          .catch(function () {});
      }
    };
    var n = 0;
    var iv = setInterval(function () { start(); ensureCols(); show(); if (++n > 25) clearInterval(iv); }, 2000);
    setInterval(show, 60000); // le temps restant avance
    start();
    var tbl = document.getElementById('VUE_trolls');
    if (tbl && window.MutationObserver) {
      new MutationObserver(function () { ensureCols(); show(); }).observe(tbl, { childList: true, subtree: true });
    }
  }

  function init() { addMonsterPv(); colorVueGowaps(); addEffectIcons(); addTrollEtat(); addSacroClick(); sendPortalNotice(); sendLancerNotice(); rememberGowapPerks(); addItButton(); addPistageImage(); addFollowerDla(); sendMission(); sendTrollInfo(); addMonsterAnalysis(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
