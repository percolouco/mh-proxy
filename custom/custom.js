// Surcouche perso MountyHall — chargée dans chaque page via le proxy.
// Ne fait que de l'affichage / lecture : jamais d'action automatique dans le jeu.
(function () {
  if (window.__mhx) return; // la page peut \u00eatre inject\u00e9e deux fois (voir nginx.conf)
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
    var br = vue.nextElementSibling; // le <br> qui suit \u00ab Ma vue \u00bb
    var after = (br && br.tagName === 'BR') ? br : vue;
    after.parentNode.insertBefore(a, after.nextSibling);
    a.parentNode.insertBefore(document.createElement('br'), a.nextSibling);
  }

  // Menu : liens vers les 4 ecuyers (nouvel onglet), sous l'image de pistage, en bas de #favoris.
  function addEcuyers() {
    if (!/\/Play_menu\.php$/.test(location.pathname) || document.getElementById('mhx-ecuyers')) return;
    var liens = [['Retak', 'retak'], ['Coucouze', 'coucouze'], ['Roxxor', 'roxxor'], ['Xouz', 'xouz']];
    var d = document.createElement('div');
    d.id = 'mhx-ecuyers';
    liens.forEach(function (l) {
      var a = document.createElement('a');
      a.href = 'https://' + l[1] + '.nas.percolouco.com/login/';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = l[0];
      d.appendChild(a);
    });
    var fav = document.getElementById('favoris');
    if (!fav) return;
    fav.appendChild(d);
  }

  // Menu : image des points cardinaux (pistage) tout en bas de la div #favoris.
  function addPistageImage() {
    if (!/\/Play_menu\.php$/.test(location.pathname) || document.getElementById('mhx-pistage')) return;
    var fav = document.getElementById('favoris');
    if (!fav) return;
    var img = document.createElement('img');
    img.id = 'mhx-pistage';
    img.src = '/_mhx/img/pistage.png';
    img.alt = 'Pistage : points cardinaux';
    fav.appendChild(img);
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
      t.textContent = '';
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
      var nd = document.createElement('div'); // Need = PV manquants - regeneration minimale du prochain tour (calcule par le serveur)
      nd.className = 'mhx-sacro-who'; nd.style.fontWeight = 'bold';
      nd.textContent = 'Need : ' + (parseInt(m[2], 10) - parseInt(m[1], 10)) + ' PV';
      var rg = document.createElement('div'); // regeneration MINIMALE du prochain tour, lue sur le serveur (simulation, rien n'est envoye)
      rg.className = 'mhx-sacro-who';
      var mp = document.createElement('div'); // malus PV (bonus/malus enregistr\u00e9s), sur sa propre ligne
      mp.className = 'mhx-sacro-who';
      rg.style.whiteSpace = mp.style.whiteSpace = 'pre-line'; // retour \u00e0 la ligne avant \u00ab (actuellement ...) \u00bb
      fetch(NOTIF_SACRO_URL, { method: 'POST', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: 'dry=1&troll=' + (currentTrollId() || 0) + '&cible=' + encodeURIComponent(cible) + '&pv=' + m[1] + '&pvmax=' + m[2] + '&nom=' + encodeURIComponent(nom) })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (j && typeof j.need === 'number') nd.textContent = 'Need : ' + j.need + ' PV' + (j.regen_min > 0 && j.manque > 0 ? ' (manque ' + j.manque + ', Reg mini ' + j.regen_min + ')' : ''); // regen MINIMALE : seulement dans le Need
          if (j && typeof j.regen === 'number') rg.textContent = 'Reg : ~' + j.regen + ' PV' + (typeof j.regen_actuel === 'number' ? '\n(actuellement ~' + j.regen_actuel + ')' : ''); // regen moyenne, comme avant
          if (j && j.malus_pv) mp.textContent = j.malus_pv;
        }, function () {});
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
      body.appendChild(q); body.appendChild(d); body.appendChild(nd); body.appendChild(rg); body.appendChild(mp); body.appendChild(st); body.appendChild(btns);
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
      var sec = Math.round((Date.now() - t0) / 1000);
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre');
        if (!ref || !nom) return;
        tr.querySelectorAll('.mhx-fa').forEach(function (o) { o.parentNode.removeChild(o); });
        var effets = (list[ref.textContent.trim()] || []).filter(function (e) { return e.reste - sec > 0; });
        var after = nom;
        effets.forEach(function (e) {
          var rest = e.reste - sec, mn = Math.floor(rest / 60), fin = '\nEncore ~' + Math.floor(mn / 60) + 'h' + ('0' + (mn % 60)).slice(-2);
          var ico, tip;
          if (e.effet === 'HE') {
            ico = e.issue === 'fuite' ? '\ud83d\ude31' : '\ud83d\ude21';
            tip = 'Hurlement Effrayant' + (e.reduit ? ' (effet r\u00e9duit)' : '') + ' : ' + (e.issue === 'fuite' ? 'le monstre fuit' : 'le monstre est plus \u00e9nerv\u00e9') + fin;
          } else {
            ico = '\ud83d\ude48';
            tip = 'Flash Aveuglant' + (e.reduit ? ' (effet r\u00e9duit)' : '') + ' : Att ' + e.att + ' | Esq ' + e.esq + ' | Vue ' + e.vue + fin + ' (' + e.tours + ' tour' + (e.tours > 1 ? 's' : '') + ')';
          }
          var sp = document.createElement('span');
          sp.className = 'mhx-fa';
          sp.textContent = ' ' + ico;
          sp.title = tip;
          after.parentNode.insertBefore(sp, after.nextSibling);
          after = sp;
        });
      });
    };
    var load = function () {
      fetch(EFFETS_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (l) { if (l) { t0 = Date.now(); paint(l); } }, function () {});
    };
    load();
    setInterval(load, 60000);
    [1500, 4000, 8000].forEach(function (d) { setTimeout(load, d); });
  }

  // Connexion (TurnStart.php) : lecture en arriere-plan (simple GET, rien n'est soumis dans le jeu) de la page Equipement > Suivants ;
  // pour chaque gowap de la liste commune on envoie au serveur MH ses infos du moment (DLA, PA, PV, vue, position, poids, ordres).
  // A chaque ouverture de la page (10 s minimum entre deux lectures), puis toutes les 60 s tant que la page reste ouverte.
  var INFOS_URL = 'https://mh.percolouco.com/gowap/gowap_infos.php';
  var GINFO_KEY = 'mhx-gowap-infos-t';
  function majInfosGowaps(apres, force) {
    if (!/\/TurnStart\.php$/.test(location.pathname) || !document.body) return;
    var id = document.body.getAttribute('data-idtroll') || currentTrollId();
    if (!/^\d+$/.test(id || '')) return;
    // 10 s minimum entre deux lectures : evite seulement les doubles chargements
    try { if (!force && Date.now() - parseInt(localStorage.getItem(GINFO_KEY) || '0', 10) < 10000) return; localStorage.setItem(GINFO_KEY, String(Date.now())); } catch (e) { /* stockage indisponible */ }
    perksCall('', function (list) {
      if (!list) return;
      fetch('/mountyhall/MH_Play/Play_e_follo.php?type=F', { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(function (b) {
          var doc = new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(b), 'text/html');
          var envois = [], objets = {}; // objets : par gowap, lus dans les tableaux repliables \u00ab [+] \u00bb de la page (n\u00b0, nom, detail, etat, poids)
          doc.querySelectorAll('table.toggle').forEach(function (tb) {
            var m = /(?:^|\s)(\d+)_\S+/.exec(tb.className), cells = tb.querySelectorAll('td'), cible = tb.nextElementSibling;
            if (!m || cells.length < 2 || !cible) return;
            var type = cells[1].textContent.trim();
            cible.querySelectorAll('tbody tr').forEach(function (tr) {
              var td = tr.querySelectorAll('td');
              if (td.length < 5) return; // 6e colonne \u00ab Autre \u00bb : ex. [En gueule]
              var t = function (i) { return (td[i].textContent || '').replace(/[\s\u00a0]+/g, ' ').trim(); };
              (objets[m[1]] = objets[m[1]] || []).push([type, t(1), t(2), t(3), t(4), td.length > 5 ? t(5) : '']);
            });
          });
          doc.querySelectorAll('.monstre-entete h3[data-json]').forEach(function (h3) {
            var j = null;
            try { j = JSON.parse(h3.getAttribute('data-json')); } catch (e) { return; }
            if (!j || !list[j.id]) return; // seulement les gowaps de la liste commune
            var bloc = h3.parentNode && h3.parentNode.parentNode, t = (bloc ? bloc.textContent : '').replace(/[\s\u00a0]+/g, ' ');
            var pos = /X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/.exec(t), poids = /poids\s+port\S*\s*:\s*(\d+\s*minutes?)/i.exec(t);
            var d = { nom: h3.textContent.replace(/[\s\u00a0]+/g, ' ').trim(), dla: j.dla, pa: j.pa, pv: j.pv, pvmax: j.pvmax, vue: j.vue, tour: j.tour,
                      ordres: (j.ordres || []).slice(0, 8).map(function (o) { return o.ordre; }) };
            if (pos) { d.x = parseInt(pos[1], 10); d.y = parseInt(pos[2], 10); d.n = parseInt(pos[3], 10); }
            if (poids) d.poids = poids[1];
            d.objets = objets[j.id] || []; // liste vide = gowap sans equipement (ecrase l'ancienne liste)
            envois.push([j.id, d]);
          });
          var suite = function (i) {
            if (i >= envois.length) { if (apres) apres(); return; }
            mhdPost(INFOS_URL, 'id=' + envois[i][0] + '&troll=' + id + '&data=' + encodeURIComponent(JSON.stringify(envois[i][1])), function () { suite(i + 1); });
          };
          suite(0);
        })
        .catch(function () { /* silencieux : on reessaiera a la prochaine connexion */ });
    });
  }

  // Page de connexion (TurnStart.php) : encart « Mes gowaps » au-dessus de « Votre Equipement utilisé » (gowaps cochés dans la liste commune)
  function addMesGowaps() {
    if (!/\/TurnStart\.php$/.test(location.pathname) || !document.body) return;
    var id = document.body.getAttribute('data-idtroll') || currentTrollId();
    if (!/^\d+$/.test(id || '')) return;
    var titre = null;
    document.querySelectorAll('h3').forEach(function (h) { if (!titre && /Equipement utilis/i.test(h.textContent)) titre = h; });
    if (!titre) return;
    mineCall(id, '', function (d) {
      var ancien = document.getElementById('mhx-mesgowaps');
      if (ancien) ancien.remove(); // reaffichage apres la lecture de la page Suivants
      if (!d || !d.gowaps || !d.gowaps.length) return;
      var box = document.createElement('div');
      box.id = 'mhx-mesgowaps';
      var h = document.createElement('h3');
      h.textContent = 'Mes gowaps : ';
      var maj = document.createElement('button');
      maj.type = 'button'; maj.className = 'mh_form_submit'; maj.textContent = 'MAJ';
      maj.title = 'Relire les infos des gowaps dans le jeu et rafra\u00eechir cet encart';
      maj.onclick = function () { maj.disabled = true; maj.textContent = 'MAJ\u2026'; majInfosGowaps(function () { addMesGowaps(); }, true); setTimeout(function () { maj.disabled = false; maj.textContent = 'MAJ'; }, 15000); };
      h.appendChild(maj);
      box.appendChild(h);
      var fmt = function (t) { return t ? t.replace(/^(\d+)-(\d+)-(\d+) (\d+:\d+).*$/, '$3/$2 $4') : '?'; };
      d.gowaps.forEach(function (g) {
        var c = document.createElement('div');
        c.className = 'mhx-mg';
        if (g.color && PERK_COLORS[g.color]) c.style.borderLeftColor = PERK_COLORS[g.color];
        var lv = g.live || null;
        if (lv) { // infos lues dans le jeu (page Suivants) : plus fraiches que celles du serveur MH
          g.pv_actuel = lv.pv; g.pv_max = lv.pvmax; g.pa_restant = lv.pa; g.dla = lv.dla; g.modified_at = lv.maj;
          if (lv.x !== undefined) { g.pos_x = lv.x; g.pos_y = lv.y; g.pos_n = lv.n; }
        }
        if (lv && lv.ordres && /^Arr[e\u00ea]t/i.test(lv.ordres[0] || '')) c.style.background = 'rgba(218, 11, 11, 0.6)'; // 1er ordre = Arret
        var vue = gowapVueGet(g.gowap_id);
        var o1 = lv && lv.ordres ? lv.ordres[0] || '' : '', ms = /^Se secouer.*?X\s*=\s*(-?\d+).*?Y\s*=\s*(-?\d+).*?N\s*=\s*(-?\d+)/i.exec(o1), pv0 = vue ? vue.v + vue.b : (lv && lv.vue) || 0;
        // 1er ordre « Se secouer » sur une case a portee de vue du gowap (X, Y <= vue ; N <= vue / 2, comme pour « Aller chercher ») : fond orange
        if (ms && pv0 && g.pos_x !== null && Math.abs(ms[1] - g.pos_x) <= pv0 && Math.abs(ms[2] - g.pos_y) <= pv0 && Math.abs(ms[3] - g.pos_n) <= Math.floor(pv0 / 2)) c.style.background = 'rgba(218, 137, 11, 0.6)';
        var l = document.createElement('b');
        l.textContent = (g.type || 'Gowap') + ' (' + g.gowap_id + ')';
        c.appendChild(l);
        // poids port\u00e9 > moiti\u00e9 de sa dur\u00e9e de tour : surcharg\u00e9 / immobilis\u00e9 (alerte visuelle)
        var pmin = lv && lv.poids ? parseInt(lv.poids, 10) : NaN;
        if (feat('turnstart_surcharge') && !isNaN(pmin) && lv.tour > 0 && pmin > lv.tour / 2) {
          c.classList.add('mhx-mg-surcharge');
          var al = document.createElement('span'); al.className = 'mhx-mg-alerte'; al.textContent = ' \u26a0 SURCHARG\u00c9 / IMMOBILIS\u00c9';
          al.title = 'Poids port\u00e9 : ' + pmin + ' minutes, plus de la moiti\u00e9 de son tour (' + Math.round(lv.tour / 2) + ' minutes)';
          c.appendChild(al);
        }
        var lignes = [], resume = [];
        if (g.pv_actuel !== null) resume.push('PV ' + g.pv_actuel + (g.pv_max ? ' / ' + g.pv_max : ''), g.pa_restant + ' PA', 'DLA ' + fmt(g.dla));
        if (g.pos_x !== null) resume.push('Position X=' + g.pos_x + ' Y=' + g.pos_y + ' N=' + g.pos_n);
        var nvue = vue ? vue.v + vue.b : (lv && lv.vue) || 0;
        if (nvue) resume.push('Vue ' + nvue + ' case' + (nvue > 1 ? 's' : ''));
        if (resume.length) lignes.push(resume.join(' \u2022 '));
        if (lv && lv.poids) lignes.push('Poids port\u00e9 : ' + lv.poids);
        if (lv && lv.ordres && lv.ordres.length) lignes.push('Ordres : ' + lv.ordres.join(' \u2192 '));
        if (g.dernier_deces) lignes.push('Dernier d\u00e9c\u00e8s : ' + g.dernier_deces);
        lignes.forEach(function (t) { var p = document.createElement('div'); p.textContent = t; c.appendChild(p); });
        var objs = lv && lv.objets ? lv.objets : null; // [type, nom, detail, etat, poids] lus dans le jeu ; [] = vide, on n'affiche pas l'ancienne liste du serveur
        if (objs && objs.length) {
          var gueule = objs.filter(function (x) { return x[5]; }); // objets avec une mention \u00ab Autre \u00bb (ex. [En gueule]) : liste directe, sans clic
          if (gueule.length) {
            var tg = document.createElement('div');
            tg.className = 'mhx-mg-type';
            tg.textContent = gueule.length > 1 ? 'Objets :' : 'Objet :';
            c.appendChild(tg);
            gueule.forEach(function (x) {
              var li = document.createElement('div');
              li.className = 'mhx-mg-obj';
              li.textContent = x[1].replace(/\s*\[[^\]]*\]$/, '') + ' \u2022 ' + x[5];
              c.appendChild(li);
            });
          }
          var det = document.createElement('details');
          var sm = document.createElement('summary');
          sm.textContent = (gueule.length ? 'Tous les objets (' : 'Objets (') + objs.length + ')';
          det.appendChild(sm);
          var types = [];
          objs.forEach(function (x) { if (types.indexOf(x[0]) < 0) types.push(x[0]); });
          types.forEach(function (ty) {
            var lst = objs.filter(function (x) { return x[0] === ty; });
            var tt = document.createElement('div');
            tt.className = 'mhx-mg-type';
            tt.textContent = ty + ' (' + lst.length + ')';
            det.appendChild(tt);
            lst.forEach(function (x) {
              var li = document.createElement('div');
              li.className = 'mhx-mg-obj';
              li.textContent = x[1].replace(/\s*\[[^\]]*\]$/, '') + (x[2] ? ' [' + x[2] + ']' : '') + (x[3] ? ' \u2022 ' + x[3] : '') + (x[4] ? ' \u2022 ' + x[4] : '');
              det.appendChild(li);
            });
          });
          if (objs.length > gueule.length) c.appendChild(det); // rien de plus a montrer si tout est deja liste au-dessus
        } else if (!objs && g.objets && g.objets.length) { // pas d'infos lues dans le jeu : repli sur la liste du serveur (cron SP)
          var o = document.createElement('div');
          o.textContent = 'Objets (' + g.objets.length + ') : ' + g.objets.map(function (x) { return (x.nom || 'objet non identifi\u00e9') + (x.description ? ' [' + x.description + ']' : ''); }).join(', ');
          c.appendChild(o);
        }
        box.appendChild(c);
      });
      titre.parentNode.insertBefore(box, titre);
    });
  }

  // Page de connexion (TurnStart.php) : « Vos Bonus et Malus en cours » et « Pas encore actifs » -> serveur MH
  // (table mh_bonus_malus). La liste envoyée remplace la précédente : pas de doublon si on se reconnecte.
  var NOTIF_BM_URL = 'https://mh.percolouco.com/notif/bonus_malus.php';
  function sendBonusMalus() {
    if (!/\/TurnStart\.php$/.test(location.pathname) || !document.body) return;
    var id = document.body.getAttribute('data-idtroll') || currentTrollId();
    if (!/^\d+$/.test(id || '')) return;
    // liste qui suit le titre : h3#BMEncours pour les effets actifs, titre « Pas encore actifs » pour les autres
    var lire = function (titre) {
      var out = [];
      if (!titre) return out;
      var ul = titre.nextElementSibling;
      while (ul && ul.tagName !== 'UL' && ul.tagName !== 'H3' && ul.tagName !== 'H2') ul = ul.nextElementSibling;
      if (!ul || ul.tagName !== 'UL') return out;
      ul.querySelectorAll('li').forEach(function (li) {
        var m = /^(.+?) \((.+)\) : (\d+) tours?\s*$/.exec(li.textContent.replace(/[\s\u00a0]+/g, ' ').trim());
        if (m) out.push({ nom: m[1], effets: m[2], tours: parseInt(m[3], 10) });
      });
      return out;
    };
    var titreAttente = null;
    document.querySelectorAll('h2, h3').forEach(function (h) { if (/Pas encore actifs/i.test(h.textContent)) titreAttente = h; });
    var titreActifs = document.getElementById('BMEncours');
    if (!titreActifs && !titreAttente && !/Bonus et Malus|Bonus-Malus/i.test(document.body.textContent)) return; // page inattendue : rien envoy\u00e9
    var data = { actifs: lire(titreActifs), attente: lire(titreAttente) };
    var envoyer = function (tot) {
      if (tot) { data.total = tot.total; if (tot.suivant) data.suivant = tot.suivant; }
      mhdPost(NOTIF_BM_URL, 'troll=' + id + '&data=' + encodeURIComponent(JSON.stringify(data)), function () {});
    };
    // « Effet total » et « Effet total suivant » calcul\u00e9s par le jeu (d\u00e9cumul inclus) : lus sur la page Bonus / Malus (lecture seule, aucun PA)
    fetch('/mountyhall/MH_Play/Play_BM.php', { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(function (b) { envoyer(lireTotauxBM(new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(b), 'text/html'))); })
      .catch(function () { envoyer(null); });
  }
  // Page Bonus / Malus : \u00ab Effet total : ... \u00bb (tableau des effets actifs) et \u00ab Effet total suivant (avec d\u00e9cumul estim\u00e9) : ... \u00bb
  // (pied du tableau des effets actifs, ou de celui des effets pas encore actifs) ; texte du jeu, d\u00e9cumul d\u00e9j\u00e0 appliqu\u00e9
  function lireTotauxBM(doc) {
    if (!doc || !doc.body) return null;
    var txt = doc.body.textContent.replace(/[\s\u00a0]+/g, ' ');
    var t = /Effet total ?: ([^|]*?(?:\|[^|]*?)*?)(?= Effet total suivant| Pas de d\u00e9cumul| D\u00e9cumul des| Nom Type|$)/.exec(txt);
    var n = /Effet total suivant[^:]*: (.*?)(?= Pas de d\u00e9cumul| D\u00e9cumul des| Nom Type| Effet total ?:|$)/.exec(txt);
    if (!t) return null;
    return { total: t[1].split(' $(')[0].trim(), suivant: n ? n[1].split(' $(')[0].trim() : '' };
  }

  // Page Ma vue, partie Trésors : boutons Parchemin / Composant / Gigots de Gob, additionnables (un trésor est gardé s'il
  // correspond à l'un des boutons actifs ; aucun bouton = tout) ; plus un bouton « Personne sur la case » qui masquent
  // les trésors ayant un gowap apprivoisé (ou un troll, hors le troll connecté) à moins de N cases (même niveau N), N réglable de 0 à 3.
  // Affichage seulement, rien n'est envoyé au jeu.
  var TRESOR_FILTRES = [
    { cle: 'parchemin', label: 'Parchemin', re: /^Parchemin/i },
    { cle: 'composant', label: 'Composant', re: /^Composant/i },
    { cle: 'gigots', label: 'Gigots de Gob', re: /^Gigots?\s+de\s+Gob/i }
  ];
  function addTresorFilters() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var KEY = 'mhx-tresor-filtres', KEY_EX = 'mhx-tresor-personne';
    var actifs = {}, excl = { actif: false, dist: 0 };
    try { actifs = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { actifs = {}; }
    try { var ex = JSON.parse(localStorage.getItem(KEY_EX) || '{}') || {}; excl = { actif: !!ex.actif, dist: Math.min(3, Math.max(0, parseInt(ex.dist, 10) || 0)) }; } catch (e) { /* r\u00e9glages par d\u00e9faut */ }
    var bar = null, info = null, pilesBox = null, pilesList = null;
    var KEY_PILES = 'mhx-tresor-piles';
    var piles = { actif: false, n: 5 };
    try { var pp = JSON.parse(localStorage.getItem(KEY_PILES) || '{}') || {}; piles = { actif: !!pp.actif, n: [3, 5, 10, 20].indexOf(parseInt(pp.n, 10)) >= 0 ? parseInt(pp.n, 10) : 5 }; } catch (e) { /* r\u00e9glages par d\u00e9faut */ }
    var rows = function () { return document.querySelectorAll('#VUE_tresors tbody tr.mh_tdpage'); };
    // Piles = trésors de même position (X / Y / N) parmi les lignes affichées, de la plus grosse à la plus petite ; seules les N premières sont listées.
    var renderPiles = function () {
      if (!pilesBox) return;
      pilesBox.classList.toggle('mhx-piles-on', piles.actif);
      rows().forEach(function (tr) { tr.classList.remove('mhx-pile-hl'); });
      pilesList.textContent = '';
      if (!piles.actif) return;
      var groupes = {};
      rows().forEach(function (tr) {
        if (tr.classList.contains('mhx-tfiltre-cache')) return;
        var p = pos(tr);
        if (!p) return;
        var k = p.x + ';' + p.y + ';' + p.n;
        var g = groupes[k] || (groupes[k] = { p: p, trs: [], noms: {}, dist: null });
        g.trs.push(tr);
        var dc = tr.querySelector('td.dist');
        if (dc && g.dist === null) g.dist = dc.textContent.trim();
        var nom = (tr.cells[3] ? tr.cells[3].textContent : '').replace(/[\s\u00a0]+/g, ' ').trim();
        nom = /centaines? de GG/i.test(nom) || /^\d+ .*GG/i.test(nom) ? 'GG' : nom;
        g.noms[nom] = (g.noms[nom] || 0) + 1;
      });
      var liste = Object.keys(groupes).map(function (k) { return groupes[k]; }).sort(function (a, b) { return b.trs.length - a.trs.length; });
      var tot = liste.reduce(function (t, g) { return t + g.trs.length; }, 0);
      var top = liste.slice(0, piles.n);
      var tete = document.createElement('div');
      tete.className = 'mhx-piles-tete';
      tete.textContent = top.length ? top.length + ' pile' + (top.length > 1 ? 's' : '') + ' sur ' + liste.length + ' (' + tot + ' tr\u00e9sors affich\u00e9s) \u2014 cliquer sur une ligne pour la rep\u00e9rer dans le tableau' : 'Aucun tr\u00e9sor affich\u00e9';
      pilesList.appendChild(tete);
      top.forEach(function (g, i) {
        var compo = Object.keys(g.noms).sort(function (a, b) { return g.noms[b] - g.noms[a]; }).map(function (n) { return g.noms[n] + ' ' + n; }).join(', ');
        var li = document.createElement('div');
        li.className = 'mhx-pile';
        li.textContent = (i + 1) + '. X = ' + g.p.x + ' | Y = ' + g.p.y + ' | N = ' + g.p.n + (g.dist !== null ? ' (dist. ' + g.dist + ')' : '') + ' \u2014 ' + g.trs.length + ' tr\u00e9sor' + (g.trs.length > 1 ? 's' : '') + ' : ' + compo;
        li.addEventListener('click', function () {
          var deja = li.classList.contains('mhx-pile-sel');
          pilesList.querySelectorAll('.mhx-pile-sel').forEach(function (x) { x.classList.remove('mhx-pile-sel'); });
          rows().forEach(function (tr) { tr.classList.remove('mhx-pile-hl'); });
          if (deja) return;
          li.classList.add('mhx-pile-sel');
          g.trs.forEach(function (tr) { tr.classList.add('mhx-pile-hl'); });
          g.trs[0].scrollIntoView({ block: 'center' });
        });
        pilesList.appendChild(li);
      });
    };
    var pos = function (tr) {
      var x = tr.querySelector('td.x'), y = tr.querySelector('td.y'), n = tr.querySelector('td.n');
      if (!x || !y || !n) return null;
      var p = { x: parseInt(x.textContent, 10), y: parseInt(y.textContent, 10), n: parseInt(n.textContent, 10) };
      return (isNaN(p.x) || isNaN(p.y) || isNaN(p.n)) ? null : p;
    };
    // positions des gowaps apprivoisés (tableau Monstres) et des trolls (tableau Trôlls), sans le troll connecté ni les trolls ajoutés hors vue
    var positions = function () {
      var gw = [], tr = [], moi = currentTrollId();
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (r) {
        var nom = r.querySelector('td a.monstre'), p = pos(r);
        if (nom && p && /^\s*Gowap Apprivois/i.test(nom.textContent)) gw.push(p);
      });
      document.querySelectorAll('#VUE_trolls tbody tr').forEach(function (r) {
        var ref = r.querySelector('td.ref'), p = pos(r);
        if (!ref || !p || r.classList.contains('mhx-horsvue') || ref.textContent.trim() === moi) return;
        tr.push(p);
      });
      return { gowap: gw, troll: tr };
    };
    var proche = function (p, liste) {
      return liste.some(function (q) { return q.n === p.n && Math.max(Math.abs(q.x - p.x), Math.abs(q.y - p.y)) <= excl.dist; });
    };
    var apply = function () {
      var on = TRESOR_FILTRES.filter(function (f) { return actifs[f.cle]; });
      var pz = excl.actif ? positions() : null;
      var total = 0, vus = 0;
      rows().forEach(function (tr) {
        var cell = tr.cells[3];
        var nom = cell ? cell.textContent.replace(/[\s\u00a0]+/g, ' ').trim() : '';
        var garde = !on.length || on.some(function (f) { return f.re.test(nom); });
        if (garde && pz) {
          var p = pos(tr);
          if (p && (proche(p, pz.gowap) || proche(p, pz.troll))) garde = false;
        }
        tr.classList.toggle('mhx-tfiltre-cache', !garde);
        total++;
        if (garde) vus++;
      });
      if (bar) {
        bar.querySelectorAll('button[data-cle]').forEach(function (b) { b.classList.toggle('mhx-actif', !!actifs[b.getAttribute('data-cle')]); });
        bar.querySelectorAll('button[data-excl]').forEach(function (b) { b.classList.toggle('mhx-actif', !!excl.actif); });
        if (info) info.textContent = (on.length || pz) ? vus + ' / ' + total : '';
      }
      renderPiles();
    };
    var save = function () {
      try { localStorage.setItem(KEY, JSON.stringify(actifs)); localStorage.setItem(KEY_EX, JSON.stringify(excl)); localStorage.setItem(KEY_PILES, JSON.stringify(piles)); } catch (e) { /* stockage indisponible */ }
    };
    var build = function () {
      var table = document.getElementById('VUE_tresors');
      if (!table || document.getElementById('mhx-tfiltres')) return;
      bar = document.createElement('div');
      bar.id = 'mhx-tfiltres';
      TRESOR_FILTRES.forEach(function (f) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mh_form_submit mhx-tfiltre';
        b.setAttribute('data-cle', f.cle);
        b.textContent = f.label;
        b.addEventListener('click', function (ev) {
          ev.preventDefault();
          actifs[f.cle] = !actifs[f.cle];
          save();
          apply();
        });
        bar.appendChild(b);
      });
      var bp = document.createElement('button');
      bp.type = 'button';
      bp.className = 'mh_form_submit mhx-tfiltre';
      bp.setAttribute('data-excl', 'personne');
      bp.title = 'Masque les tr\u00e9sors ayant un gowap apprivois\u00e9 ou un troll \u00e0 la distance r\u00e9gl\u00e9e';
      bp.textContent = 'Personne sur la case';
      bp.addEventListener('click', function (ev) {
        ev.preventDefault();
        excl.actif = !excl.actif;
        save();
        apply();
      });
      bar.appendChild(bp);
      var sel = document.createElement('select');
      sel.className = 'mhx-tdist';
      sel.title = 'Distance du gowap / troll au tr\u00e9sor (m\u00eame niveau) pour l\'exclusion';
      ['m\u00eame case', '\u2264 1 case', '\u2264 2 cases', '\u2264 3 cases'].forEach(function (t, i) {
        var o = document.createElement('option');
        o.value = String(i);
        o.textContent = t;
        if (i === excl.dist) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () { excl.dist = parseInt(sel.value, 10) || 0; save(); apply(); });
      sel.addEventListener('click', function (ev) { ev.stopPropagation(); });
      bar.appendChild(sel);
      info = document.createElement('span');
      info.className = 'mhx-tinfo';
      bar.appendChild(info);
      // même ligne que les boutons Filtre / Copier du titre Trésors ; sinon juste au-dessus du tableau
      var titre = document.querySelector('label[for="toggle_tresors"] > div');
      if (titre) { bar.classList.add('mhx-tfiltres-ligne'); titre.appendChild(bar); }
      else table.parentNode.insertBefore(bar, table);
      // 2e ligne : liste des plus grosses piles (juste sous le titre Trésors, repliée avec le bloc)
      pilesBox = document.createElement('div');
      pilesBox.id = 'mhx-tpiles';
      var bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'mh_form_submit mhx-tfiltre';
      bt.textContent = 'Plus grosses piles';
      bt.addEventListener('click', function (ev) { ev.preventDefault(); piles.actif = !piles.actif; bt.classList.toggle('mhx-actif', piles.actif); save(); renderPiles(); });
      bt.classList.toggle('mhx-actif', piles.actif);
      var lab = document.createElement('span');
      lab.textContent = 'Afficher les';
      var sp = document.createElement('select');
      sp.className = 'mhx-tdist';
      sp.title = 'Nombre de piles list\u00e9es';
      [3, 5, 10, 20].forEach(function (n) {
        var o = document.createElement('option');
        o.value = String(n);
        o.textContent = String(n);
        if (n === piles.n) o.selected = true;
        sp.appendChild(o);
      });
      sp.addEventListener('change', function () { piles.n = parseInt(sp.value, 10) || 5; save(); renderPiles(); });
      var fin = document.createElement('span');
      fin.textContent = 'piles (de la plus grosse \u00e0 la plus petite)';
      var ligne = document.createElement('div');
      ligne.className = 'mhx-piles-ligne';
      [bt, lab, sp, fin].forEach(function (e) { ligne.appendChild(e); });
      pilesList = document.createElement('div');
      pilesList.className = 'mhx-piles-liste';
      pilesBox.appendChild(ligne);
      pilesBox.appendChild(pilesList);
      // dans le contenu repliable du bloc (le CSS du jeu lie le contenu \u00e0 la case \u00ab input + label + contenu \u00bb : rien entre le titre et le contenu)
      var contenu = document.querySelector('#toggle_tresors ~ .collapsible-content');
      if (contenu) contenu.insertBefore(pilesBox, contenu.firstChild);
      else table.parentNode.insertBefore(pilesBox, table);
      apply();
    };
    build();
    [800, 2000, 5000, 9000].forEach(function (d) { setTimeout(function () { build(); apply(); }, d); }); // le tableau est retravaill\u00e9 apr\u00e8s le chargement
  }

  // Page Ma vue : réglages par troll, enregistrés sur le serveur MH (notif/prefs_vue.php) avec une copie dans le navigateur
  // pour décider tout de suite au chargement ; si le serveur dit autre chose, la copie est corrigée et la page rechargée une fois.
  //  - interrupteur ON / OFF de toutes les améliorations du script (PV, PA, DLA, couleurs, pictos, filtres, sacro) ; défaut ON ;
  //  - blocs Monstres / Trôlls / Trésors... ouverts ou fermés à l'ouverture de la page ; défaut ouverts (comportement du jeu).
  var PREFS_VUE_URL = 'https://mh.percolouco.com/notif/prefs_vue.php';
  var VUE_RE = /\/Play_vue2\.php$/;
  function vueTrollId() {
    var id = document.body && document.body.getAttribute('data-idtroll');
    return /^\d+$/.test(id || '') ? id : null;
  }
  function vueLocal(nom) {
    try { return localStorage.getItem('mhx-vue-' + nom + '-' + (vueTrollId() || 'inconnu')); } catch (e) { return null; }
  }
  function vueSetLocal(nom, val) {
    try { localStorage.setItem('mhx-vue-' + nom + '-' + (vueTrollId() || 'inconnu'), val); } catch (e) { /* stockage indisponible */ }
  }
  function vueEnabled() { return !VUE_RE.test(location.pathname) || vueLocal('on') !== '0'; }
  function vueBlocsOuverts() { return vueLocal('blocs') !== '0'; }
  function vueSave(corps, done) {
    var id = vueTrollId();
    if (!id) { done(); return; }
    fetch(PREFS_VUE_URL, { method: 'POST', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: 'troll=' + id + '&' + corps })
      .then(done, done);
  }
  function syncVuePref() {
    var id = vueTrollId();
    if (!VUE_RE.test(location.pathname) || !id) return;
    fetch(PREFS_VUE_URL + '?troll=' + id, { referrerPolicy: 'no-referrer' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) {
        if (!j) return;
        var change = false;
        if (typeof j.vue_on === 'boolean' && j.vue_on !== vueEnabled()) { vueSetLocal('on', j.vue_on ? '1' : '0'); change = true; }
        if (typeof j.blocs === 'boolean' && j.blocs !== vueBlocsOuverts()) { vueSetLocal('blocs', j.blocs ? '1' : '0'); change = true; }
        if (change) location.reload();
      }, function () {});
  }
  // blocs repliables du jeu : une case à cocher input.toggle#toggle_xxx par bloc (cochée = ouvert)
  function setBlocs(ouverts) {
    document.querySelectorAll('.collapsible-wrap > input.toggle[id^="toggle_"]').forEach(function (c) { c.checked = ouverts; });
  }
  function applyBlocs() {
    if (!VUE_RE.test(location.pathname) || vueBlocsOuverts()) return; // ouverts : on laisse la page telle que le jeu l'affiche
    var touche = false;
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.collapsible-wrap > label, .collapsible-wrap > input.toggle')) touche = true; }, true);
    setBlocs(false);
    setTimeout(function () { if (!touche) setBlocs(false); }, 1500); // la page est retravaill\u00e9e apr\u00e8s le chargement
  }
  function mkSwitch(on, titreOn, titreOff, clic) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'mhx-switch' + (on ? ' mhx-on' : '');
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.title = on ? titreOn : titreOff;
    b.appendChild(document.createElement('span'));
    b.addEventListener('click', clic);
    return b;
  }
  function addVueSwitch() {
    if (!VUE_RE.test(location.pathname) || document.getElementById('mhx-vueswitch')) return;
    var on = vueEnabled(), blocs = vueBlocsOuverts();
    var mkLi = function (id, texte, bouton) { // un r\u00e9glage = un libell\u00e9 + son interrupteur (les deux r\u00e9glages sont sur la m\u00eame ligne)
      var li = document.createElement('span');
      li.id = id;
      li.className = 'mhx-vueopt';
      var lab = document.createElement('span');
      lab.className = 'mhx-switch-label';
      lab.textContent = texte;
      li.appendChild(lab);
      li.appendChild(bouton);
      return li;
    };
    var sw = mkSwitch(on, 'Am\u00e9liorations activ\u00e9es : cliquer pour les d\u00e9sactiver', 'Am\u00e9liorations d\u00e9sactiv\u00e9es : cliquer pour les activer', function () {
      var val = on ? '0' : '1';
      vueSetLocal('on', val);
      this.disabled = true;
      vueSave('vue_on=' + val, function () { location.reload(); });
    });
    var li1 = mkLi('mhx-vueswitch-on', 'Am\u00e9liorations du script : ' + (on ? 'ON' : 'OFF'), sw);
    var lab2 = null;
    var sw2 = mkSwitch(blocs, 'Blocs ouverts \u00e0 l\'ouverture : cliquer pour les fermer', 'Blocs ferm\u00e9s \u00e0 l\'ouverture : cliquer pour les ouvrir', function () {
      blocs = !blocs;
      vueSetLocal('blocs', blocs ? '1' : '0');
      this.classList.toggle('mhx-on', blocs);
      this.setAttribute('aria-checked', blocs ? 'true' : 'false');
      this.title = blocs ? 'Blocs ouverts \u00e0 l\'ouverture : cliquer pour les fermer' : 'Blocs ferm\u00e9s \u00e0 l\'ouverture : cliquer pour les ouvrir';
      lab2.textContent = 'Blocs ouverts \u00e0 l\'ouverture : ' + (blocs ? 'OUI' : 'NON');
      setBlocs(blocs); // appliqu\u00e9 tout de suite, sans recharger
      vueSave('blocs=' + (blocs ? '1' : '0'), function () {});
    });
    var li2 = mkLi('mhx-vueblocs', 'Blocs ouverts \u00e0 l\'ouverture : ' + (blocs ? 'OUI' : 'NON'), sw2);
    lab2 = li2.firstChild;
    var ligne = document.createElement('li');
    ligne.id = 'mhx-vueswitch';
    ligne.appendChild(li1);
    ligne.appendChild(li2);
    // dans l'encart d'informations sous le titre (liste \u00ab Ma position actuelle... \u00bb), sinon sous le titre
    var ul = document.querySelector('#infoTab ul');
    if (ul) ul.appendChild(ligne);
    else {
      var h = document.getElementById('MHTitreH2') || document.querySelector('h2');
      if (h && h.parentNode) h.parentNode.insertBefore(ligne, h.nextSibling);
    }
  }

  // Kiki Meter : chaque essai de sortilège / compétence (page de résultat) est compté sur le serveur MH : essais, réussis / ratés,
  // effets réduits, dégât max. Un résultat est un essai s'il porte le titre « Sortilège : X » ou « Compétence : X » et le jet d'utilisation
  // (« jet de N sur N % ») ; réussi s'il contient « Vous avez RÉUSSI à utiliser », sinon raté.
  var NOTIF_KIKI_URL = 'https://mh.percolouco.com/notif/kiki.php';
  // Effet r\u00e9duit : m\u00eame lecture que le message WhatsApp (\u00ab a donc un EFFET R\u00c9DUIT \u00bb), accents ou casse diff\u00e9rents accept\u00e9s.
  function kikiReduit(txt) {
    var ef = /a donc un (EFFET [A-Z\u00c0-\u00dc]+)/i.exec(txt);
    return !!((ef && /DUIT/i.test(ef[1])) || /EFFET\s+R.{0,2}DUIT/.test(txt));
  }
  function sendKiki() {
    if (!/\/Play_a_ActionResult\.php$/.test(location.pathname) || !document.body) return;
    var txt = document.body.textContent.replace(/[\s\u00a0]+/g, ' ');
    var tt = /(?:Comp\u00e9tence|Sortil\u00e8ge) : (.{1,40}?)(?= (?:Vous|Votre)\b)/.exec(txt);
    if (!tt || !/jet de \d+ sur \d+ ?%/.test(txt)) return;
    var troll = currentTrollId();
    if (!troll) return;
    var degats = 0;
    (txt.match(/inflig\u00e9 (\d+) points? de d\u00e9g\u00e2ts/g) || []).forEach(function (x) { degats = Math.max(degats, parseInt(x.replace(/\D/g, ''), 10)); });
    var cible = /(?:attaqu\u00e9|lanc\u00e9|saisir) (?:une|un|la|le|l\u2019|l')?\s?(.+?) \(\d+\)/.exec(txt);
    var data = {
      nom: tt[1], reussi: /Vous avez R\u00c9USSI \u00e0 utiliser/.test(txt), reduit: kikiReduit(txt), degats: degats, cible: cible ? cible[1] : '',
      sig: (txt.match(/(?:jet de|Jet de R\u00e9sistance :?|Jet d'Attaque est de :?) ?-?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|')
    };
    mhdPost(NOTIF_KIKI_URL, 'troll=' + troll + '&data=' + encodeURIComponent(JSON.stringify(data)), function () {});
  }

  // Page Mon Profil : bloc « Kiki Meter » (tableau des 5 trolls, meilleur en vert, pire en rouge sur chaque ligne).
  function addKikiMeter() {
    if (!/\/Play_profil\.php$/.test(location.pathname) || document.getElementById('mhx-kiki')) return;
    var apres = document.getElementById('carac') || document.querySelector('.collapsible-wrap');
    if (!apres || !apres.parentNode) return;
    fetch(NOTIF_KIKI_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
      if (!j || !j.trolls || document.getElementById('mhx-kiki')) return;
      var T = j.trolls;
      var pct = function (n, d) { return d > 0 ? n / d * 100 : null; };
      var lignes = [
        { nom: 'Essais', val: function (t) { return t.essais || null; }, txt: function (t) { return String(t.essais); }, mode: null },
        { nom: 'Rat\u00e9s / essai', val: function (t) { return pct(t.rates, t.essais); }, txt: function (t) { return t.essais ? t.rates + ' / ' + t.essais + ' (' + Math.round(pct(t.rates, t.essais)) + ' %)' : '-'; }, mode: 'bas' },
        { nom: 'R\u00e9duits / essai', val: function (t) { return pct(t.reduits, t.essais); }, txt: function (t) { return t.essais ? t.reduits + ' / ' + t.essais + ' (' + Math.round(pct(t.reduits, t.essais)) + ' %)' : '-'; }, mode: 'bas' },
        { nom: 'D\u00e9g\u00e2t max', val: function (t) { return t.degat_max || null; }, txt: function (t) { return t.degat_max ? String(t.degat_max) : '-'; }, tip: function (t) { return t.degat_max ? t.degat_max_sort + (t.degat_max_nom ? ' sur ' + t.degat_max_nom : '') : ''; }, mode: 'haut' }
      ];
      var wrap = document.createElement('div');
      wrap.id = 'mhx-kiki';
      wrap.className = 'mh_tdpage collapsible-wrap';
      wrap.innerHTML = '<input id="kikimeter" class="toggle" type="checkbox" checked><label for="kikimeter" class="lbl-toggle mh_tdtitre"><h3>Kiki Meter</h3></label>' +
        '<div class="collapsible-content"><div class="collapsible-content-inner"><table class="mhx-kikitab"><thead></thead><tbody></tbody></table>' +
        '<div class="mhx-kikinote">Sortil\u00e8ges et comp\u00e9tences compt\u00e9s depuis la mise en place du compteur. Vert : le meilleur, rouge : le moins bon.</div></div></div>';
      var th = wrap.querySelector('thead'), tb = wrap.querySelector('tbody');
      var htr = document.createElement('tr');
      htr.appendChild(document.createElement('th'));
      T.forEach(function (t) { var h = document.createElement('th'); h.textContent = t.nom; htr.appendChild(h); });
      th.appendChild(htr);
      lignes.forEach(function (l) {
        var tr = document.createElement('tr');
        var c0 = document.createElement('th');
        c0.textContent = l.nom;
        tr.appendChild(c0);
        var vals = T.map(l.val).filter(function (v) { return v !== null; });
        var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
        T.forEach(function (t) {
          var td = document.createElement('td');
          td.textContent = l.txt(t);
          if (l.tip) { var tip = l.tip(t); if (tip) td.title = tip; }
          var v = l.val(t);
          if (l.mode && v !== null && vals.length >= 2 && mn !== mx) {
            var meilleur = l.mode === 'haut' ? mx : mn, pire = l.mode === 'haut' ? mn : mx;
            if (v === meilleur) td.className = 'mhx-kiki-vert'; else if (v === pire) td.className = 'mhx-kiki-rouge';
          }
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      apres.parentNode.appendChild(wrap); // tout en bas de la grille du profil, sur toute la largeur
    }, function () {});
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

  // Page Ma vue : les tresors marques « en cours de recuperation » (voir marksCall) sont colores, reconnus par leur reference.
  function colorVueMarks() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    marksCall('', function (m) {
      if (!m) return;
      var paint = function () {
        document.querySelectorAll('#VUE_tresors tbody tr.mh_tdpage').forEach(function (tr) {
          var ref = tr.querySelector('td.ref');
          if (ref && m[ref.textContent.trim()]) { tr.classList.add('mhx-marque'); tr.title = 'Tr\u00e9sor en cours de r\u00e9cup\u00e9ration'; }
        });
      };
      paint();
      [1500, 4000, 8000].forEach(function (d) { setTimeout(paint, d); });
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
      [1500, 4000, 8000].forEach(function (d) { setTimeout(paint, d); }); // le tableau est retravaill\u00e9 apr\u00e8s le chargement
    });
  }

  // Gowaps « a moi » : case a cocher dans la liste commune -> rattache le gowap au troll connecte (un seul proprietaire par gowap),
  // stocke sur le serveur MH ; affiches sur TurnStart.php au-dessus de « Votre Equipement utilise ». Lecture / affichage uniquement.
  var MINE_URL = 'https://mh.percolouco.com/gowap/gowap_mine.php';
  function mineCall(troll, body, cb) {
    var opt = { referrerPolicy: 'no-referrer' };
    if (body) {
      opt.method = 'POST';
      opt.headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
      opt.body = body + '&troll=' + troll;
    }
    fetch(MINE_URL + (body ? '' : '?troll=' + troll), opt).then(function (r) { return r.ok ? r.json() : null; }).then(cb, function () { cb(null); });
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
      var chk = document.createElement('input');
      chk.type = 'checkbox'; chk.disabled = true; chk.dataset.gid = id;
      chk.title = 'Mon gowap : affich\u00e9 sur la page de connexion';
      row.appendChild(chk); row.appendChild(lab); row.appendChild(sel); row.appendChild(del);
      box.appendChild(row);
    });
    var moi = currentTrollId();
    if (moi) mineCall(moi, '', function (m) {
      if (!m) return;
      box.querySelectorAll('input[type="checkbox"][data-gid]').forEach(function (chk) {
        var prop = m.all[chk.dataset.gid];
        chk.checked = String(prop) === String(moi);
        chk.disabled = !!prop && !chk.checked; // deja rattache a un autre troll
        if (chk.disabled) chk.title = 'D\u00e9j\u00e0 rattach\u00e9 au troll ' + prop;
        chk.onchange = function () { chk.disabled = true; mineCall(moi, 'action=' + (chk.checked ? 'set' : 'del') + '&id=' + chk.dataset.gid, function () { chk.disabled = false; }); };
      });
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
    var plein = !ef && /endure donc pleinement l.effet/.test(txt);
    var jA = /jet d'Attaque est de ?: ?(\d+)/i.exec(txt), jE = /jet d'Esquive de votre adversaire est de ?: ?(\d+)/i.exec(txt);
    var crit = /par un coup critique/i.test(txt) || !!(jA && jE && parseInt(jE[1], 10) > 0 && parseInt(jA[1], 10) >= 2 * parseInt(jE[1], 10));
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
    return { type: 'attaque', nom: tt ? tt[1] : '', moyen: m[3] === 'un sortil\u00e8ge' ? 'sortil\u00e8ge' : 'comp\u00e9tence', effet: ef ? ef[1].toLowerCase().replace('reduit', 'r\u00e9duit') : (plein ? 'plein' : ''), critique: crit, sig: jets, monstres: [mon] };
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
  // Comp\u00e9tence Insultes : le monstre est \u00e9nerv\u00e9 et ne vise plus que le lanceur.
  function parseInsulte(txt) {
    var m = /Votre insulte a \u00e9nerv\u00e9 le monstre (?:une|un|la|le|l\u2019|l')\s?(.+?) \((\d+)\)/.exec(txt);
    if (!m) return null;
    var jets = (txt.match(/Jet de R\u00e9sistance ?: ?-?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    return { type: 'insulte', effet: /EFFET R[E\u00c9]DUIT/.test(txt) ? 'r\u00e9duit' : '', sig: jets + '|' + m[2], monstres: [{ role: 'cible', nom: m[1], id: m[2], etat: '' }] };
  }
  // Comp\u00e9tence Connaissance des Monstres : fiche du monstre (valeurs textuelles du jeu) -> groupe WhatsApp.
  var CDM_LABELS = ['Famille du monstre', 'Niveau', 'Points de Vie', 'Blessure', 'Points de Vie restants', 'D\u00e9s d\'Attaque', 'D\u00e9s d\'Esquive', 'D\u00e9s de D\u00e9g\u00e2t', 'D\u00e9s de R\u00e9g\u00e9n\u00e9ration', 'D\u00e9s d\'Armure', 'Armure Physique', 'Armure Magique', 'Vue', 'Maitrise Magique', 'R\u00e9sistance Magique', 'Capacit\u00e9 sp\u00e9ciale', 'Nombre d\'attaques', 'Attaque magique', 'Attaque \u00e0 distance', 'Vitesse de D\u00e9placement', 'Dur\u00e9e Tour', 'DLA', 'Chargement', 'Voir le Cach\u00e9', 'L\u00e9vite', 'Sang froid', 'Bonus Malus', 'Port\u00e9e du Pouvoir'];
  function parseCdm(txt) {
    var m = /Connaissance des Monstres ?: ?(.+?) \((\d+)\) Famille du monstre/.exec(txt);
    if (!m) return null;
    var reste = txt.slice(m.index + m[0].length - 'Famille du monstre'.length), champs = {}, pos = [];
    CDM_LABELS.forEach(function (l) { var i = reste.indexOf(l + ' :'); if (i >= 0) pos.push({ l: l, i: i }); });
    pos.sort(function (x, y) { return x.i - y.i; });
    pos.forEach(function (p, k) {
      var fin = k + 1 < pos.length ? pos[k + 1].i : reste.search(/ Cette action vous a co/); if (fin < 0) fin = reste.length;
      champs[p.l] = reste.slice(p.i + p.l.length + 2, fin).replace(/^\s+|\s+$/g, '');
    });
    return { type: 'cdm', sig: m[2] + '|' + (champs['Points de Vie'] || '').replace(/\D+/g, '-'), monstres: [{ role: 'cible', nom: m[1], id: m[2], etat: '' }], champs: champs };
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
  // Compétence Hurlement Effrayant (HE) : la cible fuit (réussi) ou est plus énervée (raté). Durée inconnue : 1 tour.
  function parseHurlement(txt) {
    if (!/Hurlement Effrayant/.test(txt)) return null;
    var m = /Votre cible (?:(une|un)\s+)?(.+?) \((\d+)\) (.{1,120}?)(?=\s*Seuil de|$)/.exec(txt);
    if (!m) return null;
    var phrase = m[4], issue = '';
    if (/pas effray|au contraire/.test(phrase)) issue = 'enerve';
    else if (/effray|fuit|fuir|enfui/.test(phrase)) issue = 'fuite';
    if (!issue) return null;
    var jets = (txt.match(/Jet de R\u00e9sistance ?: ?-?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    return { type: 'flash', effet: 'HE', sig: jets + '|' + m[3], cibles: [{ nom: m[2], id: m[3], monstre: !!m[1], tours: 1, reduit: /EFFET R[E\u00c9]DUIT/.test(txt), att: 0, esq: 0, vue: 0, issue: issue }] };
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
  // Sortil\u00e8ge Sacrifice : soin de la cible, PV perdus par le lanceur et PV restants (lus dans la page de r\u00e9sultat)
  var NOTIF_SACRIFICE_URL = 'https://mh.percolouco.com/notif/sacrifice_whatsapp.php';
  function parseSacrifice(txt) {
    if (!/Sortil\u00e8ge ?: ?Sacrifice/.test(txt) || !/R\u00c9USSI/.test(txt)) return null;
    var so = /Vous avez soign\u00e9 (.+?) \((\d+)\) de (\d+) Points? de Vie/.exec(txt);
    var pe = /Vous avez perdu (\d+) Points? de Vie/.exec(txt);
    var vi = /Il vous reste actuellement (\d+) points? de vie \((\d+)\)/.exec(txt);
    if (!so || !pe || !vi) return null;
    var jet = /jet de (\d+) sur (\d+) ?%/.exec(txt);
    return { cible_id: so[2], cible_nom: so[1], soin: parseInt(so[3], 10), perdus: parseInt(pe[1], 10), vie: parseInt(vi[1], 10), vie_max: parseInt(vi[2], 10), sig: jet ? jet[1] + '|' + jet[2] : '' };
  }
  // Potion ou Parchemin utilis\u00e9 : tr\u00e9sor, effet, dur\u00e9e, effet imm\u00e9diat et PA (lus dans la page de r\u00e9sultat)
  var NOTIF_TRESOR_URL = 'https://mh.percolouco.com/notif/tresor_whatsapp.php';
  function parseTresorUtilise(txt) {
    var t = /Vous avez utilis\u00e9 un tr\u00e9sor ?: ?\[(\d+)\] (.+?) Son effet est le suivant ?:/.exec(txt);
    if (!t) return null;
    var fin = '(?= Effet imm\u00e9diat| Vous avez | L\u2019effet se fera| L\'effet se fera| Cette action|$)';
    var ef = new RegExp('Son effet est le suivant ?: ?(.+?)' + fin).exec(txt);
    var im = new RegExp('Effet imm\u00e9diat ?: ?(.+?)' + fin.replace('| Effet imm\u00e9diat', '')).exec(txt);
    var pa = /Cette action vous a co\u00fbt\u00e9 (\d+) PA/.exec(txt);
    var effet = ef ? ef[1] : '', du = /\|? ?Dur\u00e9e ?: ?(\d+) tours?/.exec(effet);
    if (du) effet = effet.replace(du[0], ' | ');
    var ci = /([^|:]+? \(\d+\)) a \u00e9t\u00e9 influenc\u00e9e?\.?/.exec(effet);
    if (ci) effet = effet.replace(ci[0], '');
    effet = effet.replace(/\s+/g, ' ').replace(/^[\s|]+|[\s|]+$/g, '');
    return { tresor_id: t[1], tresor_nom: t[2], cible: ci ? ci[1].trim() : '', effet: effet, tours: du ? parseInt(du[1], 10) : 0, immediat: im ? im[1] : '', pa: pa ? parseInt(pa[1], 10) : null };
  }
  // Sortil\u00e8ge Faiblesse Passag\u00e8re : cible, dur\u00e9e, jet de r\u00e9sistance et effet th\u00e9orique -> groupe WhatsApp.
  function parseFaiblesse(txt) {
    var m = /(?:une|un|la|le|l\u2019|l')\s?(.+?) \((\d+)\) a \u00e9t\u00e9 influenc\u00e9e? par l'effet du sortil\u00e8ge ?: ?Faiblesse Passag\u00e8re ?, pour une dur\u00e9e de (\d+) tours?/.exec(txt);
    if (!m) return null;
    var apres = txt.slice(m.index + m[0].length);
    var se = /Seuil de R\u00e9sistance de la cible ?: ?(\d+) ?%/.exec(apres), je = /Jet de R\u00e9sistance ?: ?(-?\d+)/.exec(apres);
    var ph = /La cible (.{1,60}?) l.effet du sortil\u00e8ge/.exec(apres);
    var eff = [], i = apres.search(/effet th\u00e9orique suivant/), bloc = i >= 0 ? apres.slice(i) : '', fin = bloc.search(/ Cette action/);
    if (fin >= 0) bloc = bloc.slice(0, fin);
    var re = /\b([A-Z]{2,5}) ?: ?(-?\d+)/g, x;
    while ((x = re.exec(bloc))) eff.push({ k: x[1], v: parseInt(x[2], 10) });
    return { type: 'faiblesse', cible: { nom: m[1], id: m[2] }, tours: parseInt(m[3], 10), seuil: se ? parseInt(se[1], 10) : null, jet: je ? parseInt(je[1], 10) : null,
      plein: !!(ph && /pleinement/.test(ph[1])), reduit: /EFFET R[E\u00c9]DUIT|partiellement|\u00e0 moiti\u00e9/i.test(apres.slice(0, 400)), effets: eff, sig: (je ? je[1] : '') + '|' + m[2] };
  }
  function sendLancerNotice() {
    if (!/\/Play_a_ActionResult\.php$/.test(location.pathname) || !document.body) return;
    var txt = document.body.textContent.replace(/[\s\u00a0]+/g, ' ');
    var fl = parseFlash(txt) || parseHurlement(txt), troll0 = currentTrollId();
    if (fl && troll0) {
      mhdPost(NOTIF_FLASH_URL, 'troll=' + troll0 + '&data=' + encodeURIComponent(JSON.stringify({ sig: fl.sig, effet: fl.effet || 'FA', cibles: fl.cibles })), function (ok) {
        mhdBadge(ok ? (fl.effet === 'HE' ? 'Hurlement' : 'Flash Aveuglant') + ' signal\u00e9 sur WhatsApp' : 'Envoi WhatsApp impossible', !ok);
      });
      return;
    }
    var sac = parseSacrifice(txt);
    if (sac && troll0) {
      mhdPost(NOTIF_SACRIFICE_URL, 'troll=' + troll0 + '&data=' + encodeURIComponent(JSON.stringify(sac)), function (ok) {
        mhdBadge(ok ? 'Sacrifice signal\u00e9 sur WhatsApp' : 'Sacrifice : envoi WhatsApp impossible', !ok);
      });
      return;
    }
    var tre = parseTresorUtilise(txt);
    if (tre && troll0) {
      mhdPost(NOTIF_TRESOR_URL, 'troll=' + troll0 + '&data=' + encodeURIComponent(JSON.stringify(tre)), function (ok) {
        mhdBadge(ok ? 'Tr\u00e9sor utilis\u00e9 signal\u00e9 sur WhatsApp' : 'Tr\u00e9sor : envoi WhatsApp impossible', !ok);
      });
      return;
    }
    var fai = parseFaiblesse(txt);
    if (fai && troll0) {
      mhdPost(NOTIF_LANCER_URL, 'troll=' + troll0 + '&data=' + encodeURIComponent(JSON.stringify(fai)), function (ok) {
        mhdBadge(ok ? 'Faiblesse Passag\u00e8re signal\u00e9e sur WhatsApp' : 'Faiblesse : envoi WhatsApp impossible', !ok);
      });
      return;
    }
    var res = parseLancer(txt) || parseAttaque(txt) || parseSortEffet(txt) || parseInsulte(txt) || parseCdm(txt) || parseBaroufle(txt);
    if (res && !res.sig) res.sig = (txt.match(/jet[^:]{0,40}: ?\d+/g) || []).map(function (x) { return x.replace(/\D/g, ''); }).join('|');
    var troll = currentTrollId();
    if (!res || !troll) return;
    // estimation Mountyzilla du monstre touche (lue sur sa page ou dans Ma vue), pour la ligne \u00ab PV restants \u00bb du message
    (res.monstres || []).forEach(function (mo) { var z = /^\d+$/.test(mo.id || '') ? (monsterMzGet(mo.id) || ((pvCache()[mo.id] || {}).mz || null)) : null; if (z) mo.mz = z; });
    mhdPost(NOTIF_LANCER_URL, 'troll=' + troll + '&data=' + encodeURIComponent(JSON.stringify(res)), function (ok) {
      mhdBadge(ok ? 'Action signal\u00e9e sur WhatsApp' : 'Action : envoi WhatsApp impossible', !ok);
    });
    var cb = res.monstres && res.monstres[0];
    if (feat('vue_chasse') && cb && cb.mort && /^\d+$/.test(cb.id || '')) chassePost('action=cible_del&monstre=' + cb.id, function () {}); // cible tu\u00e9e : retir\u00e9e de la chasse
    if (/hypnotisme/i.test(res.nom || '') && cb && cb.etat !== undefined && /^\d+$/.test(cb.id || '')) { // monstre hypnotis\u00e9 : ligne violette sur Ma vue jusqu'\u00e0 son prochain tour
      mhdPost(HYPNO_URL, 'action=set&troll=' + troll + '&monstre=' + cb.id + '&nom=' + encodeURIComponent(cb.nom || ''), function () {});
    }
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
  // Si le monstre a subi des frappes de notre groupe depuis sa dernière CdM : « PV actuels / PV max » estimés par le serveur (notif/pv_monstres.php), même code couleur.
  var PV_KEY = 'mhx-pv-monstres-4';
  var PV_MONSTRES_URL = 'https://mh.percolouco.com/notif/pv_monstres.php';
  function pvCache() {
    try { return JSON.parse(localStorage.getItem(PV_KEY) || '{}') || {}; } catch (e) { return {}; }
  }
  function addMonsterPv() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var cache = pvCache(), busy = false, tries = {}, done = {};
    var rows = function () {
      var out = [];
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre'), niv = tr.querySelector('td[data-indxmz]'); // niv : cellule MZ, absente si MZ ne repond pas
        if (!ref || !nom || /^\s*(?:Gowap Apprivois|Familier)/i.test(nom.textContent)) return;
        out.push({ tr: tr, id: ref.textContent.trim(), nom: nom, niv: niv });
      });
      return out;
    };
    // Vraie colonne « PV » juste avant « Réf. » (donc indépendante de la colonne « Niv. » du script MZ, qui peut manquer)
    var ensureCol = function () {
      var th = document.querySelector('#VUE_monstres thead tr td.ref, #VUE_monstres thead tr th.ref');
      if (th && !th.parentNode.querySelector('.mhx-pvh')) {
        var h = document.createElement(th.tagName.toLowerCase());
        h.className = 'mhx-pvh'; // sans style propre : il reprend celui des autres en-t\u00eates du tableau
        h.textContent = 'PV';
        h.style.cssText = 'width: 80px; display: table-cell;';
        th.parentNode.insertBefore(h, th);
      }
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref');
        if (!ref || tr.querySelector('td.mhx-pvcol')) return;
        var td = document.createElement('td');
        td.className = 'mhx-pvcol';
        td.style.cssText = 'width: 80px; display: table-cell;'; // footable masque les cellules qu'il ne conna\u00eet pas
        ref.parentNode.insertBefore(td, ref);
      });
    };
    // PV estim\u00e9s par le serveur (CdM + frappes de notre groupe + r\u00e9g\u00e9n\u00e9ration des tours rejou\u00e9s) : utilis\u00e9s seulement si le monstre a subi des frappes de notre groupe
    var calc = {}, calcAsked = {};
    var mid = function (a) { return a ? (a[1] === null ? a[0] : Math.round((a[0] + a[1]) / 2)) : null; };
    var fmtRM = function (cv) {
      var r = mid(cv.r), m = mid(cv.m);
      if (r === null) return null;
      var rt = (cv.r[1] === null ? '\u2265' : (cv.r[0] !== cv.r[1] ? '~' : '')) + r;
      var mt = m === null ? '?' : (cv.m[1] === null ? m + '+' : String(m));
      return rt + ' / ' + mt;
    };
    var show = function (r) {
      var c = cache[r.id], cv = calc[r.id];
      var td = r.tr.querySelector('td.mhx-pvcol');
      if (!td) return;
      if (c && c.k === 'fam') { td.textContent = ''; td.className = 'mhx-pvcol'; td.title = ''; return; } // familier : pas d'info
      var txt = null, tip = '';
      if (cv && cv.frappes > 0) { // frappes de notre groupe depuis la CdM : PV actuels estim\u00e9s / PV max
        txt = fmtRM(cv);
        if (txt) {
          tip = 'PV actuels estim\u00e9s / PV max\n' + cv.deg + ' d\u00e9g\u00e2ts subis (' + cv.frappes + ' frappe' + (cv.frappes > 1 ? 's' : '') + ' de notre groupe' + (cv.src === 'mz' ? '' : ' depuis la CdM') + ')'
            + (cv.regen ? '\nR\u00e9g\u00e9n\u00e9ration compt\u00e9e : +' + cv.regen + ' PV (tours rejou\u00e9s)' : '')
            + (cv.mort ? '\nMort confirm\u00e9e' : '') + (cv.raisons && cv.raisons.length ? '\n' + cv.raisons.join('\n') : '');
        }
      }
      if (txt === null) {
        if (!c) return;
        txt = c.v + ' PV';
        tip = c.k === 'bless' ? 'CDM fiable (blessure connue)'
          : c.k === 'doute' ? 'Estimation : la CDM n\u2019est pas encore fiable' : '';
      }
      if (td.textContent !== txt) td.textContent = txt;
      td.className = 'mhx-pvcol mhx-pv-' + (c ? c.k : 'ok');
      if (td.title !== tip) td.title = tip;
    };
    var askCalc = function () {
      var ids = rows().filter(function (r) { return !calcAsked[r.id] && (cache[r.id] || !r.niv || (tries[r.id] || 0) >= 5); }).map(function (r) { return r.id; });
      if (!ids.length) return;
      ids.forEach(function (i) { calcAsked[i] = true; });
      for (var k = 0; k < ids.length; k += 150) {
        var part = ids.slice(k, k + 150), mz = {};
        part.forEach(function (i) { var z = (cache[i] && cache[i].mz) || monsterMzGet(i); if (z) mz[i] = z; });
        var body = new URLSearchParams(); body.set('ids', part.join(',')); body.set('mz', JSON.stringify(mz));
        fetch(PV_MONSTRES_URL, { method: 'POST', body: body, referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          if (!j) return;
          Object.keys(j).forEach(function (i) { calc[i] = j[i]; });
          rows().forEach(show);
        }, function () { /* serveur injoignable : on garde l'affichage de la CdM */ });
      }
    };
    var readPv = function (id) {
      var pop = document.getElementById('popupCDM' + id);
      if (!pop) return null;
      var res = null, bless = false, familier = false, regDes = null, autres = {};
      pop.querySelectorAll('tr').forEach(function (tr) {
        var c = tr.cells;
        if (!c || c.length < 2) return;
        var lab = c[0].textContent.trim();
        if (/^Blessure$/i.test(lab) && c[1].textContent.trim()) bless = true;
        if (/^Famille$/i.test(lab) && /^\s*Familier/i.test(c[1].textContent)) familier = true;
        if (/^Points de Vie$/i.test(lab)) {
          var td = c[1].cloneNode(true);
          var doute = td.querySelector('span') !== null; // intervalle de confiance \u00e0 80 % (jaune)
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
          // valeurs brutes (estimation Mountyzilla) pour le calcul serveur des PV actuels
          if (res && m) res.mz = { pv: [parseInt(m[1], 10), parseInt(m[2], 10)], avg: Math.round(parseFloat(String(m[3]).replace(',', '.'))) };
        }
        var cle = /^(?:D\u00e9s d.)?Esquive$/i.test(lab) ? 'esq' : /^RM$/.test(lab) ? 'rm' : /^Armure physique$/i.test(lab) ? 'arm_p' : /^Armure magique$/i.test(lab) ? 'arm_m' : null;
        if (cle) {
          var cc = c[1].cloneNode(true);
          cc.querySelectorAll('span').forEach(function (x) { x.remove(); });
          var mv = mzMoyenne(cc.textContent.replace(/[\s\u00a0]+/g, ' '));
          if (mv !== null) autres[cle] = mv;
        }
        if (/^(?:D\u00e9s de )?R\u00e9g\u00e9n\u00e9ration$/i.test(lab)) {
          var rt = c[1].cloneNode(true);
          rt.querySelectorAll('span').forEach(function (x) { x.remove(); }); // intervalle jaune (80 %) retire
          var rtx = rt.textContent.replace(/[\s\u00a0]+/g, ' ');
          var rg = /(\d+)\s*-\s*(\d+)(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(rtx) || /(\d+)/.exec(rtx);
          if (rg) regDes = [parseInt(rg[1], 10), parseInt(rg[2] || rg[1], 10), rg[3] ? parseFloat(String(rg[3]).replace(',', '.')) : null];
        }
      });
      if (familier) return { v: '', k: 'fam' };
      if (res && res.mz) Object.keys(autres).forEach(function (k) { res.mz[k] = autres[k]; });
      if (res && res.mz && regDes) { res.mz.reg = [regDes[0], regDes[1]]; if (regDes[2] !== null) res.mz.regAvg = regDes[2]; }
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
          if (!r.niv || done[r.id] || (tries[r.id] || 0) >= 5 || document.getElementById('popupCDM' + r.id)) continue;
          tries[r.id] = (tries[r.id] || 0) + 1;
          r.niv.click();
          await sleep(40);
          var pv = readPv(r.id);
          if (document.getElementById('popupCDM' + r.id)) { r.niv.click(); done[r.id] = true; } // referme (le clic bascule le popup)
          if (pv) {
            if (!cache[r.id] || cache[r.id].v !== pv.v || cache[r.id].k !== pv.k || JSON.stringify(cache[r.id].mz) !== JSON.stringify(pv.mz)) { cache[r.id] = pv; changed = true; }
            show(r);
          }
        }
        if (changed) { try { localStorage.setItem(PV_KEY, JSON.stringify(cache)); } catch (e) {} }
        askCalc();
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
      // PA disponibles (affich\u00e9s \u00e0 droite dans l'encart) : repris juste apr\u00e8s la DLA
      var paM = /(\d+)\s*PA\b/.exec((box.parentNode ? box.parentNode.textContent : box.textContent).replace(/[\s\u00a0]+/g, ' '));
      el.textContent = 'DLA : ' + pad(+m[3]) + '/' + pad(+m[2]) + ' ' + m[4] + ':' + m[5] + (left <= 0 ? ' (d\u00e9pass\u00e9e)' : '') + (paM && feat('suivants_pa') ? ' \u00b7 ' + paM[1] + ' PA' : '');
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

      // \u00ab (Vue : N cases) \u00bb apr\u00e8s le nom (comme sur la page Ordres) + picto si le gowap est hors de la vue de son troll
      if (feat('suivants_vue') && !h3.querySelector('.mhx-gvue') && d.vue > 0) {
        var gv = document.createElement('span'); gv.className = 'mhx-gvue';
        gv.textContent = ' (Vue : ' + d.vue + ' case' + (d.vue > 1 ? 's' : '') + ')';
        gv.title = 'Port\u00e9e de vue du suivant';
        h3.appendChild(gv);
      }
      var tt = (box.parentNode ? box.parentNode.textContent : box.textContent).replace(/[\s\u00a0]+/g, ' ');
      var gp = /X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/.exec(tt), tp = null, me = aggroTroll();
      try { tp = me ? JSON.parse(localStorage.getItem('mhx-position-' + me) || 'null') : null; } catch (e) { tp = null; }
      if (feat('suivants_hors_vue') && gp && tp && tp.h !== null && tp.h !== undefined && !h3.querySelector('.mhx-hvue')) {
        var ddx = Math.abs(+gp[1] - tp.x), ddy = Math.abs(+gp[2] - tp.y), ddn = Math.abs(+gp[3] - tp.n);
        if (ddx > tp.h || ddy > tp.h || ddn > tp.v) {
          var hv = document.createElement('span'); hv.className = 'mhx-hvue'; hv.textContent = ' \ud83d\udeab';
          hv.title = 'Hors de ta vue (vue de ' + tp.h + ' cases / ' + tp.v + ' en vertical) \u2014 ' + ddx + ' en X, ' + ddy + ' en Y, ' + ddn + ' en N. Position du troll relev\u00e9e sur Ma vue le ' + new Date(tp.t).toLocaleString('fr-FR');
          h3.appendChild(hv);
        }
      }
    });
    perksCall('', function (list) {
      if (!list) return;
      colorFollowers(list);
      addGowapPanel(list);
    });
  }
  // Page Transbahuter, destination « ses suivants » (Play_a_Action.php?type=A&id=58) : chaque gowap garde sa couleur de la liste commune
  // et affiche « poids porté : X minutes / Y minutes restantes » (Y = moitié de la durée du tour - X), lus sur la page Suivants (simple GET).
  function addTransbahuterGowaps() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname) || !document.body || document.body.id !== 'p_transbahuter') return;
    var entetes = document.querySelectorAll('.portlet-header');
    if (!entetes.length) return;
    perksCall('', function (list) {
      // gowaps des autres trolls du groupe : dernier poids / dur\u00e9e du tour enregistr\u00e9s sur le serveur MH (m\u00e0j \u00e0 la connexion de leur propri\u00e9taire)
      var serveur = {};
      fetch(INFOS_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (sv) { serveur = sv || {}; })
        .then(function () { return fetch('/mountyhall/MH_Play/Play_e_follo.php?type=F', { credentials: 'same-origin', referrerPolicy: 'no-referrer' }); })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(function (b) {
          var doc = new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(b), 'text/html'), infos = {};
          doc.querySelectorAll('.monstre-entete h3[data-json]').forEach(function (h3) {
            var j = null;
            try { j = JSON.parse(h3.getAttribute('data-json')); } catch (e) { return; }
            var pw = h3.nextElementSibling, px = pw && /poids\s+port\S*\s*:\s*(\d+)\s*minute/i.exec(pw.textContent);
            if (j && px) infos[j.id] = { poids: parseInt(px[1], 10), tour: j.tour };
          });
          entetes.forEach(function (h) {
            var m = /\((\d+)\)/.exec(h.textContent);
            if (!m || h.querySelector('.mhx-poids-tb')) return;
            var c = list && list[m[1]], pt = h.closest('.portlet');
            if (c && PERK_COLORS[c] && pt) pt.style.setProperty('background', PERK_COLORS[c], 'important');
            var i = infos[m[1]], vieux = '';
            if (!i) { // pas un de mes suivants : derni\u00e8re valeur connue du serveur
              var sv = serveur[m[1]], ps = sv && /(\d+)\s*minute/i.exec(sv.poids || '');
              if (!ps || !(sv.tour > 0)) return;
              i = { poids: parseInt(ps[1], 10), tour: sv.tour };
              var mj = /^\d{4}-(\d{2})-(\d{2}) (\d{2}:\d{2})/.exec(sv.maj || '');
              vieux = mj ? ' (relev\u00e9 le ' + mj[2] + '/' + mj[1] + ' \u00e0 ' + mj[3] + ')' : ' (valeur du serveur)';
            }
            var el = document.createElement('div');
            el.className = 'mhx-poids-tb';
            el.textContent = 'poids port\u00e9 : ' + i.poids + ' minutes' + (i.tour > 0 ? ' / ' + Math.max(0, Math.round(i.tour / 2) - i.poids) + ' minutes restantes' : '') + vieux;
            h.appendChild(el);
          });
        })
        .catch(function () { /* silencieux : la page reste utilisable sans ces infos */ });
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
    p.append('update_equipe', type === 'equipe' ? '1' : '0'); // en premier, au cas o\u00f9 le payload serait tronqu\u00e9
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
          valid.push(d + sans[n + 1]); // un \u00e9v\u00e9nement manquant a coup\u00e9 un tour en deux
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
      debut: fmt(debut), min: fmt(min), max: fmt(max), minMs: min.getTime()
    };
  }

  // « Durée du tour   3-5 → 4  heures » dans la CDM du monstre
  function monsterCdmTurn() {
    // lecture par la cellule (l'intervalle jaune 80 % est dans un span juste avant la valeur : en texte brut il colle les chiffres, ex. « 10-100 » -> 55 h)
    var row = monsterMzRow(/^Dur\u00e9e du tour$/);
    var mr = row && /(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(row);
    if (mr) { var g = function (x) { return parseFloat(String(x).replace(',', '.')); }; return { min: g(mr[1]), max: g(mr[2]), avg: mr[3] ? g(mr[3]) : (g(mr[1]) + g(mr[2])) / 2 }; }
    var txt = (document.body ? document.body.textContent : '').normalize('NFC').replace(/[\s\u00a0]+/g, ' ');
    var m = /Dur\u00e9e du tour[^\d]{0,40}?(\d+(?:[.,]\d+)?)\s*[-\u2013]\s*(\d+(?:[.,]\d+)?)(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(txt);
    if (!m) return null;
    var f = function (x) { return parseFloat(x.replace(',', '.')); };
    var lo = f(m[1]), hi = f(m[2]);
    return { min: lo, max: hi, avg: m[3] ? f(m[3]) : (lo + hi) / 2 };
  }

  // Cadre unique « Analyse tactique » (carte sombre) : en-tête + bouton, colonne gauche (infos monstre + chronomètre), colonne droite (plan de finition)
  function tacBox() {
    var box = document.getElementById('mhx-tactique');
    if (box) return box;
    var el = function (tag, id, cls) { var e = document.createElement(tag); if (id) e.id = id; if (cls) e.className = cls; return e; };
    box = el('div', 'mhx-tactique', 'mhx-monstre');
    var head = el('div', null, 'mhx-tac-head');
    var h = el('h4', 'mhx-tac-titre', 'mhx-tac-titre'); h.textContent = '\ud83e\udd87 Analyse tactique'; head.appendChild(h);
    var b = el('button', 'mhx-tac-btn', 'mhx-tac-btn'); b.type = 'button'; b.textContent = '\u21bb Recalculer'; head.appendChild(b);
    var w = el('button', 'mhx-tac-wa', 'mhx-tac-btn'); w.type = 'button'; w.textContent = '\ud83d\udcf2 WhatsApp'; w.style.display = 'none'; w.title = 'Envoyer le plan de finition dans le groupe WhatsApp'; head.insertBefore(w, b);
    box.appendChild(head);
    var grid = el('div', null, 'mhx-tac-grid');
    var left = el('div', null, 'mhx-tac-left');
    left.appendChild(el('div', 'mhx-tac-infos', 'mhx-tac-bloc')); left.appendChild(el('div', 'mhx-tac-tour', 'mhx-tac-bloc'));
    grid.appendChild(left); grid.appendChild(el('div', 'mhx-tac-plan', 'mhx-tac-right')); box.appendChild(grid);
    var form = document.querySelector('form[action=""]');
    if (form && form.parentNode) form.parentNode.insertBefore(box, form);
    else if (document.body) document.body.insertBefore(box, document.body.firstChild);
    return box;
  }
  function tacRow(label, val, cls) { var d = document.createElement('div'); d.className = 'mhx-tac-row'; var a = document.createElement('span'); a.className = 'mhx-tac-lab'; a.textContent = label; var b = document.createElement('span'); b.className = 'mhx-tac-val' + (cls ? ' ' + cls : ''); b.textContent = val; d.appendChild(a); d.appendChild(b); return d; }

  function addMonsterAnalysis() {
    if (!/\/MonsterView\.php$/.test(location.pathname)) return;
    var tries = 0;
    (function run() {
      if (document.getElementById('mhx-tac-tour') && document.getElementById('mhx-tac-tour').childNodes.length) return;
      var cdm = monsterCdmTurn();
      if (!cdm && ++tries < 6) return setTimeout(run, 800); // la CDM peut arriver apr\u00e8s le reste de la page
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
      if (!dates.length) dates = all; // format inattendu : on retombe sur tous les \u00e9v\u00e9nements
      var s = dates.length ? monsterDla(dates, cdm) : null;
      if (!s) return;
      MONSTRE_PROCHAIN_TOUR = s.minMs; // pour le plan de finition (fin de la fenetre : le monstre peut rejouer a partir de la)
      tacBox();
      var tr = document.getElementById('mhx-tac-tour'); tr.textContent = '';
      var tt = document.createElement('div'); tt.className = 'mhx-tac-t mhx-tac-t-bleu'; tt.textContent = 'Infos DLA monstre'; tr.appendChild(tt);
      tr.appendChild(tacRow('Dur\u00e9e' + (/CDM\)/.test(s.dla) ? ' (CDM)' : ' (estim.)'), s.dla.replace(/ \(.*$/, '')));
      tr.appendChild(tacRow('D\u00e9but', s.debut.replace(' \u00e0', '')));
      tr.appendChild(tacRow('Rejoue', s.min.replace(' \u00e0', ''), 'mhx-tac-rouge'));
      tr.appendChild(tacRow('Cumul', s.max.replace(' \u00e0', '')));
    })();
  }

  // Suivant (gowap) : portee de vue lue sur sa page Profil (ligne « Vue : 6 Cases +0 »), memorisee dans le navigateur,
  // puis affichee entre parentheses a cote de son nom sur la page Ordres. Si elle manque, la page Profil est lue en arriere-plan.
  var GVUE_KEY = 'mhx-gowap-vue';
  function gowapId() { var m = /[?&]id_target=(\d+)/.exec(location.search); return m ? m[1] : null; }
  function gowapVueRead(doc) {
    var res = null;
    doc.querySelectorAll('td').forEach(function (td) {
      if (res || td.textContent.trim() !== 'Vue' || !td.nextElementSibling) return;
      var m = /(\d+)\s*Cases?\s*([+-]\s*\d+)?/i.exec(td.nextElementSibling.textContent);
      if (m) res = { v: parseInt(m[1], 10), b: m[2] ? parseInt(m[2].replace(/\s/g, ''), 10) : 0 };
    });
    return res;
  }
  function gowapVueStore(id, r) {
    try {
      var all = JSON.parse(localStorage.getItem(GVUE_KEY) || '{}') || {};
      all[id] = { v: r.v, b: r.b, t: Date.now() };
      localStorage.setItem(GVUE_KEY, JSON.stringify(all));
    } catch (e) { /* stockage indisponible */ }
  }
  function gowapVueGet(id) {
    try { return (JSON.parse(localStorage.getItem(GVUE_KEY) || '{}') || {})[id] || null; } catch (e) { return null; }
  }
  function addGowapVue() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname) || !/[?&]type=F\b/.test(location.search)) return;
    var id = gowapId();
    if (!id) return;
    var sub = (/[?&]sub=(\w+)/.exec(location.search) || [])[1];
    if (!sub) { // page Profil du suivant
      var r = gowapVueRead(document);
      if (r) gowapVueStore(id, r);
      return;
    }
    if (sub !== 'ordres') return;
    var show = function () {
      var g = gowapVueGet(id), h3 = document.querySelector('.monstre-entete h3');
      if (!g || !h3) return;
      var sp = h3.querySelector('.mhx-gvue');
      if (!sp) { sp = document.createElement('span'); sp.className = 'mhx-gvue'; h3.appendChild(sp); }
      sp.textContent = ' (Vue : ' + (g.v + g.b) + ' case' + (g.v + g.b > 1 ? 's' : '') + ')';
      sp.title = 'Port\u00e9e de vue du suivant : ' + g.v + (g.b ? ' ' + (g.b > 0 ? '+' : '') + g.b : '') + ' (lue sur sa page Profil)';
    };
    show();
    var g0 = gowapVueGet(id);
    if (!g0 || Date.now() - g0.t > 6 * 3600 * 1000) {
      fetch('/mountyhall/MH_Play/Play_a_Action.php?type=F&id=-4&id_target=' + id, { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) {
          if (!buf) return;
          var r = gowapVueRead(new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(buf), 'text/html'));
          if (r) { gowapVueStore(id, r); show(); }
        }).catch(function () { /* ignore */ });
    }
  }

  // Tresors : la liste vue sur Ma vue est envoyee au serveur MH (par troll, elle remplace la precedente) et reaffichee
  // sur la page Ordres d'un suivant (Equipement > Suivants > Ordres), au-dessus de la carte du trajet. Affichage seulement.
  var TRESORS_URL = 'https://mh.percolouco.com/notif/tresors_vue.php';
  function sendTresorsVue() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    // Grande vue : le tableau se remplit lentement. On n'envoie qu'une fois le nombre de lignes stable (2 relevés identiques, 2 s
    // d'ecart), et au plus tard apres 90 s : une liste incomplete ne doit pas faire retirer des tresors du serveur.
    var tries = 0, dernier = -1, stable = 0;
    (function run() {
      var tb = document.querySelector('#VUE_tresors tbody');
      var rows = tb ? tb.querySelectorAll('tr.mh_tdpage') : [];
      stable = rows.length === dernier ? stable + 1 : 0;
      dernier = rows.length;
      if (++tries < 45 && (stable < 2 || !rows.length && tries < 5)) return setTimeout(run, 2000);
      var me = aggroTroll();
      if (!tb || !me) return;
      var txt = function (tr, sel) { var c = tr.querySelector(sel); return c ? c.textContent.trim() : ''; };
      var items = [];
      rows.forEach(function (tr) {
        var nomCell = tr.cells[3];
        var it = { ref: txt(tr, 'td.ref'), nom: nomCell ? nomCell.textContent.replace(/[\s\u00a0]+/g, ' ').trim() : '', x: txt(tr, 'td.x'), y: txt(tr, 'td.y'), n: txt(tr, 'td.n'), dist: txt(tr, 'td.dist'), icone: (tr.querySelector('td.actions img') || document.createElement('img')).getAttribute('src') || '' };
        if (/^\d+$/.test(it.ref) && it.nom) items.push(it);
      });
      // positions des gowaps apprivoises et des trolls (hors moi) pour le filtre « Personne sur la case » de la page Ordres
      var occ = { gowap: [], troll: [] }, moi = currentTrollId();
      var pos3 = function (r) { var x = parseInt(txt(r, 'td.x'), 10), y = parseInt(txt(r, 'td.y'), 10), n = parseInt(txt(r, 'td.n'), 10); return isNaN(x + y + n) ? null : [x, y, n]; };
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (r) {
        var nom = r.querySelector('td a.monstre'), q = pos3(r);
        if (nom && q && /^\s*Gowap Apprivois/i.test(nom.textContent)) occ.gowap.push(q);
      });
      document.querySelectorAll('#VUE_trolls tbody tr').forEach(function (r) {
        var q = pos3(r);
        if (q && !r.classList.contains('mhx-horsvue') && txt(r, 'td.ref') !== moi) occ.troll.push(q);
      });
      // zone couverte par cette vue (position + portees affichees en haut de Ma vue) : le serveur n'y retire que les tresors disparus
      var tete = (document.getElementById('infoTab') || document.body).textContent.replace(/[\s\u00a0]+/g, ' ');
      var mp = /position actuelle est\s*:\s*X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/i.exec(tete);
      var mv = /affichage est limit\u00e9 \u00e0\s*(\d+) cases horizontalement et (\d+) verticalement/i.exec(tete) || /vue porte actuellement \u00e0\s*(\d+) cases horizontalement et (\d+) verticalement/i.exec(tete);
      var cov = mp && mv ? { x: +mp[1], y: +mp[2], n: +mp[3], h: +mv[1], v: +mv[2] } : null;
      mhdPost(TRESORS_URL, 'troll=' + me + '&data=' + encodeURIComponent(JSON.stringify(items)) + '&occ=' + encodeURIComponent(JSON.stringify(occ)) + (cov ? '&cov=' + encodeURIComponent(JSON.stringify(cov)) : ''), function () {});
    })();
  }

  // Page Ordres : position du suivant (« Depart X = .., Y = .., N = .. » dans la carte du trajet) et pre-remplissage d'une etape
  // « Se deplacer vers » avec la position d'un tresor. Rien n'est envoye : l'ordre reste a valider par le joueur.
  function gowapPos() {
    var dep = document.getElementById('etape_depart');
    var m = dep ? /X\s*=\s*(-?\d+)\D+Y\s*=\s*(-?\d+)\D+N\s*=\s*(-?\d+)/.exec(dep.textContent) : null;
    if (!m && document.body) { // repli : en-t\u00eate du suivant \u00ab 6 PA - X = -62 | Y = 28 | N = -92 | D = 108|12 \u00bb
      var ent = document.querySelector('.monstre-entete'), zone = ent && ent.parentNode ? ent.parentNode : document.body;
      m = /\d+\s*PA\s*-\s*X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/.exec(zone.textContent.replace(/[\s\u00a0]+/g, ' '));
    }
    return m ? { x: parseInt(m[1], 10), y: parseInt(m[2], 10), n: parseInt(m[3], 10) } : null;
  }
  function prefillDeplacement(x, y, n) {
    var ordre = document.querySelector('select[name="gus_ordre"]');
    if (ordre) { ordre.value = '1'; ordre.dispatchEvent(new Event('change', { bubbles: true })); }
    if (!('a_modifier' in window)) window.a_modifier = ''; // le script du trajet l'affecte sans la declarer (mode strict) : sans cela ses ecouteurs plantent
    var vide = null;
    document.querySelectorAll('#liste_etapes input[id^="etape_"][id$="_x"]').forEach(function (ix) {
      var base = ix.id.slice(0, -2), iy = document.getElementById(base + '_y'), inn = document.getElementById(base + '_n');
      if (!vide && !ix.value && iy && inn && !iy.value && !inn.value) vide = [ix, iy, inn];
    });
    if (!vide) {
      var aj = document.getElementById('aj_etape');
      if (aj) aj.click(); // bouton du jeu : ajoute une ligne d'etape, aucune requete
      var xs = document.querySelectorAll('#liste_etapes input[id^="etape_"][id$="_x"]'), last = xs[xs.length - 1];
      if (last) { var b2 = last.id.slice(0, -2); vide = [last, document.getElementById(b2 + '_y'), document.getElementById(b2 + '_n')]; }
    }
    if (!vide || !vide[1] || !vide[2]) return false;
    [x, y, n].forEach(function (v, i) {
      vide[i].value = String(v);
      ['input', 'keyup', 'change', 'blur'].forEach(function (ev) { vide[i].dispatchEvent(new Event(ev, { bubbles: true })); });
    });
    var carte = document.getElementById('carte_trajet');
    if (carte && carte.scrollIntoView) carte.scrollIntoView({ block: 'nearest' });
    return true;
  }
  // Page Ordres : sur chaque ligne d'ordre « D\u00e9placement vers X=.. | Y=.. | N=.. », estimation du co\u00fbt en PA et du nombre de DLA
  // (\u00ab \u2014 ~51 PA \u2248 9 DLA \u00bb). Le trajet part de la position du gowap puis suit les ordres de d\u00e9placement dans l'ordre d'affichage.
  // Co\u00fbt d'un pas = pcCout (1,5 x dn + max(0, max(dx, dy) - dn)), un gowap a 6 PA par DLA. Estimation, affichage seulement.
  var GOWAP_PA_DLA = 6;
  function addOrdreDistance() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname) || !/[?&]sub=ordres\b/.test(location.search)) return;
    // ordres avec une position cible : \u00ab D\u00e9placement vers X=.. | Y=.. | N=.. \u00bb et \u00ab Se secouer (s'\u00e9brouer) X=.. | Y=.. | N=.. \u00bb ; chaque estimation part de la position de l'ordre pr\u00e9c\u00e9dent
    var re = /(?:D\u00e9placement vers|Se secouer|S.?\u00e9brouer)[^X\d]{0,40}X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/i;
    var fmt = function (c) { return (Math.round(c * 10) / 10).toString().replace('.', ','); };
    var maj = function () {
      var g = gowapPos();
      if (!g || !document.body) return;
      var cur = [g.x, g.y, g.n], cumul = 0, n = 0;
      document.querySelectorAll('body *').forEach(function (el) {
        if (el.closest('#carte_trajet, #liste_etapes, script, style, select, option, textarea') || el.classList.contains('mhx-ordre-pa')) return;
        var sans = function (t) { return t.replace(/\s*\u2014 [^\u2014]*$/, ''); }; // texte sans notre suffixe
        var m = re.exec(sans(el.textContent.replace(/[\s\u00a0]+/g, ' ')));
        if (!m || el.textContent.length > 200) return;
        for (var k = 0; k < el.children.length; k++) if (re.test(el.children[k].textContent.replace(/[\s\u00a0]+/g, ' '))) return; // on prend l'\u00e9l\u00e9ment le plus interne (la cellule)
        var q = [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)], cout = pcCout(cur, q);
        cumul += cout; cur = q; n++;
        var sp = el.querySelector('.mhx-ordre-pa');
        if (!sp) { sp = document.createElement('span'); sp.className = 'mhx-ordre-pa'; el.appendChild(sp); }
        var txt = ' \u2014 ' + (cout === 0 ? 'd\u00e9j\u00e0 sur place' : '~' + fmt(cout) + ' PA \u2248 ' + Math.ceil(cout / GOWAP_PA_DLA - 1e-9) + ' DLA') +
          (n > 1 && cout > 0 ? ' (cumul ' + Math.ceil(cumul / GOWAP_PA_DLA - 1e-9) + ' DLA)' : '');
        if (sp.textContent !== txt) sp.textContent = txt;
        sp.title = 'Estimation depuis ' + (n > 1 ? 'l\'ordre pr\u00e9c\u00e9dent' : 'la position du gowap') + ' : co\u00fbt d\'un pas = 1,5 \u00d7 dN + max(0, max(dX, dY) \u2212 dN), ' + GOWAP_PA_DLA + ' PA par DLA.';
      });
    };
    setInterval(maj, 1500);
    maj();
  }

  // distance au suivant (meme calcul que la colonne Dist. de Ma vue : plus grand ecart sur X, Y ou N)
  // portee de vue d'un suivant : horizontalement (X, Y) la valeur de sa Vue, verticalement (N) la moitie arrondie a l'inferieur (6 -> 3, 5 -> 2)
  function dansVueSuivant(it, g, portee) {
    return Math.max(Math.abs(it.x - g.x), Math.abs(it.y - g.y)) <= portee && Math.abs(it.n - g.n) <= Math.floor(portee / 2);
  }
  function distGowap(it, g) { return Math.max(Math.abs(it.x - g.x), Math.abs(it.y - g.y), Math.abs(it.n - g.n)); }

  // Marques « tresor en cours de recuperation » : partagees entre joueurs (serveur MH), une seule couleur, retirees seulement par celui qui les a posees
  var MARKS_URL = 'https://mh.percolouco.com/gowap/tresor_marks.php';
  function marksCall(body, cb) {
    var opt = { referrerPolicy: 'no-referrer' };
    if (body) {
      opt.method = 'POST';
      opt.headers = { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' };
      opt.body = body;
    }
    fetch(MARKS_URL, opt).then(function (r) { return r.ok ? r.json() : null; }).then(cb, function () { cb(null); });
  }

  // « Aller chercher » : sur la page Ordres, un clic sur un tresor situe dans la portee de vue du suivant (Dist. <= Vue) choisit l'ordre
  // « Aller chercher ... » et ouvre l'ecran de choix (fenetre « Action » du jeu) ; la-bas, le tresor est selectionne dans la liste et le
  // bouton « Action » est clique (sans PA, a la demande de Perco). La demande est transmise par localStorage et expire apres 2 minutes.
  var AC_KEY = 'mhx-aller-chercher';
  var acBusy = false;
  function allerChercher(it, say) {
    var id = gowapId(), vue = id ? gowapVueGet(id) : null;
    var ordre = document.querySelector('select[name="gus_ordre"]');
    if (!vue || !ordre) return false;
    var hors = gowapPos() ? !dansVueSuivant(it, gowapPos(), vue.v + vue.b) : it.dist > vue.v + vue.b;
    var gigots = /^Gigots?\s+de\s+Gob/i.test(it.nom);
    if (gigots ? !ordre.querySelector('option[value="7"]') || !ordre.querySelector('option[value="5"]') || !ordre.querySelector('option[value="' + (hors ? 1 : 8) + '"]') : hors ? !ordre.querySelector('option[value="1"]') || !ordre.querySelector('option[value="5"]') : !ordre.querySelector('option[value="8"]') || !ordre.querySelector('option[value="12"]')) return false;
    if (acBusy) { say('Un envoi est d\u00e9j\u00e0 en cours, patiente quelques secondes.'); return true; }
    acBusy = true;
    sequenceAllerChercher(it, id, say, hors).then(function (txt) { var moi = currentTrollId(); if (moi && /^\d+$/.test(it.ref)) marksCall('action=set&ref=' + it.ref + '&troll=' + moi, function () {}); say(txt); }, function (e) { say('\u00c9chec : ' + (e && e.message ? e.message : e) + ' \u2014 v\u00e9rifie les ordres du suivant.'); })
      .then(function () { acBusy = false; setTimeout(function () { location.reload(); }, 1200); });
    return true;
  }
  // Sequence a la demande de Perco (chaque nouvel ordre arrive en derniere position, d'ou les « gus_top ») :
  // 1. ordre « Se secouer a terre dans ma caverne » -> remonte en premier ; 2. attente 1 s ; 3. ordre « Aller chercher » (tresor clique)
  // -> remonte en premier. Le suivant va donc chercher le tresor, puis se secoue. Tout est poste en arriere-plan, une requete a la fois.
  function sequenceAllerChercher(it, id, say, hors) {
    var base = '/mountyhall/MH_Play/Play_a_Action.php?type=F&id=-4&id_target=' + id;
    var wait = function (ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); };
    var post = function (url, body) {
      return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body, referrerPolicy: 'no-referrer' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(function (b) { return new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(b), 'text/html'); });
    };
    // cree un ordre : formulaire d'ordre, puis formulaire de confirmation (« Action ») avec ses champs caches ; ref = tresor a choisir
    var confirmer = function (doc, ref, souple) {
        var form = doc.getElementById('ActionForm');
        if (!form && souple) return doc; // ordre sans ecran de confirmation (ex. \u00ab Arret \u00bb)
        if (!form) throw new Error('\u00e9cran de confirmation introuvable');
        var champs = new URLSearchParams();
        form.querySelectorAll('input[name], select[name]').forEach(function (f) { if (f.type !== 'button' && f.type !== 'submit') champs.set(f.name, f.value); });
        if (ref && typeof ref === 'object') { champs.set('gus_x', String(ref.x)); champs.set('gus_y', String(ref.y)); champs.set('gus_n', String(ref.n)); }
        else if (ref) {
          var sel = form.querySelector('select[name="id_tresor"]');
          if (!sel || !sel.querySelector('option[value="' + ref + '"]')) throw new Error('le tr\u00e9sor ' + ref + ' n\u2019est pas dans la liste de ce suivant');
          champs.set('id_tresor', String(ref));
        }
        return post(new URL(form.getAttribute('action'), location.href).href, champs.toString());
    };
    var creer = function (valeur, ref, souple) { return post(base, 'gus_ordre=' + valeur + '&gus_add=').then(function (doc) { return confirmer(doc, ref, souple); }); };
    // remonte le dernier ordre de la liste en premiere position (bouton gus_top de sa ligne)
    var remonter = function () {
      return fetch(base + '&sub=ordres', { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
        .then(function (b) {
          var doc = new DOMParser().parseFromString(new TextDecoder('iso-8859-1').decode(b), 'text/html');
          var tops = doc.querySelectorAll('button[name="gus_top"]');
          if (!tops.length) throw new Error('bouton \u00ab \u21d1\u21d1 \u00bb du dernier ordre introuvable');
          return post('/mountyhall/MH_Play/Play_a_ActionResult.php', 'type=F&id=-4&id_target=' + id + '&gus_top=' + encodeURIComponent(tops[tops.length - 1].value));
        });
    };
    if (/^Gigots?\s+de\s+Gob/i.test(it.nom)) { // Gigots de Gob : \u00ab Se secouer \u00bb sur leur case, puis \u00ab Aller chercher \u00bb (dans la vue) ou \u00ab Se deplacer vers \u00bb (hors vue), puis \u00ab Arret \u00bb
      var pos = { x: it.x, y: it.y, n: it.n };
      var etapes = [['Arr\u00eat', '5', null], [hors ? 'Se d\u00e9placer vers' : 'Aller chercher', hors ? '1' : '8', hors ? pos : it.ref], ['Se secouer', '7', pos]];
      if (hors) etapes.splice(1, 1); // hors vue : pas de deplacement, \u00ab Se secouer \u00bb sur la case suffit // crees dans l'ordre inverse : chacun remonte en premier
      var chaine = Promise.resolve();
      etapes.forEach(function (e, i) {
        chaine = chaine.then(function () { say((i + 1) + '/' + etapes.length + ' ' + e[0] + '\u2026'); return creer(e[1], e[2], e[1] === '5'); })
          .then(function () { return remonter(); }).then(function () { return wait(1000); });
      });
      return chaine.then(function () { return 'Termin\u00e9 : se secouer' + (hors ? '' : ', aller chercher ' + it.nom + ' (' + it.ref + ')') + ', puis arr\u00eat.'; });
    }
    if (hors) { // tresor hors de vue : ordre \u00ab Arret \u00bb (5) puis \u00ab Se deplacer vers \u00bb (1) sa position, remonte en premier
      say('1/5 Arr\u00eat\u2026');
      return creer('5', null, true).then(function () { say('2/5 Ordre remont\u00e9 en premier\u2026'); return remonter(); })
        .then(function () { return wait(1000); })
        .then(function () { say('3/5 Se d\u00e9placer vers X=' + it.x + ' Y=' + it.y + ' N=' + it.n + '\u2026'); return creer('1', { x: it.x, y: it.y, n: it.n }); })
        .then(function () { say('4/5 Ordre remont\u00e9 en premier\u2026'); return remonter(); })
        .then(function () { return 'Termin\u00e9 : le suivant ira en X=' + it.x + ' Y=' + it.y + ' N=' + it.n + ' (' + it.nom + '), puis s\u2019arr\u00eatera.'; });
    }
    say('1/5 Se secouer \u00e0 terre dans ma caverne\u2026');
    return creer('12').then(function () { say('2/5 Ordre remont\u00e9 en premier\u2026'); return remonter(); })
      .then(function () { return wait(1000); })
      .then(function () { say('3/5 Aller chercher ' + it.nom + ' (' + it.ref + ')\u2026'); return creer('8', it.ref); })
      .then(function () { say('4/5 Ordre remont\u00e9 en premier\u2026'); return remonter(); })
      .then(function () { return 'Termin\u00e9 : le suivant ira chercher ' + it.nom + ' (' + it.ref + '), puis se secouera \u00e0 terre.'; });
  }
  function addAllerChercherPopup() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname)) return;
    var sel = document.querySelector('select[name="id_tresor"]');
    if (!sel) return;
    var req = null;
    try { req = JSON.parse(localStorage.getItem(AC_KEY) || 'null'); localStorage.removeItem(AC_KEY); } catch (e) { req = null; }
    var note = function (txt, err) {
      var d = document.createElement('div');
      d.className = 'mhx-monstre';
      d.style.color = err ? '#b00020' : '#2e7d32';
      d.textContent = txt;
      sel.parentNode.insertBefore(d, sel);
    };
    if (!req || Date.now() - req.t > 120000 || req.gowap !== gowapId()) return; // pas de demande en attente : on ne touche a rien
    var opt = sel.querySelector('option[value="' + req.ref + '"]');
    if (!opt) { note('Le tr\u00e9sor ' + req.ref + ' n\u2019est pas dans la liste de ce suivant : rien n\u2019est envoy\u00e9.', true); return; }
    sel.value = req.ref;
    var action = null;
    document.querySelectorAll('button, input[type="submit"]').forEach(function (b) { if (!action && /^\s*Action\s*$/i.test(b.textContent || b.value || '')) action = b; });
    if (!action) { note('Bouton \u00ab Action \u00bb introuvable : tr\u00e9sor s\u00e9lectionn\u00e9, \u00e0 valider \u00e0 la main.', true); return; }
    note('Tr\u00e9sor ' + req.ref + ' s\u00e9lectionn\u00e9, envoi\u2026', false);
    // Le bouton du jeu enverrait le resultat dans le cadre Contenu et ferait disparaitre la page Ordres : on poste le meme formulaire
    // en arriere-plan, puis on recharge la page Ordres pour qu'elle affiche le nouvel ordre (et nos blocs Tresors).
    var form = action.form || document.getElementById('ActionForm');
    var retour = function (ok) {
      var cible = null;
      try { cible = window.opener && !window.opener.closed ? window.opener : null; } catch (e) { cible = null; }
      try { if (!cible && window.parent !== window && window.parent.frames['Contenu']) cible = window.parent.frames['Contenu']; } catch (e) { cible = null; }
      if (cible && req.ret) { try { cible.location.href = req.ret; } catch (e) { cible = null; } }
      note(ok ? 'Ordre \u00ab Aller chercher \u00bb enregistr\u00e9 pour le tr\u00e9sor ' + req.ref + '.' : '\u00c9chec de l\u2019envoi : rien n\u2019est enregistr\u00e9 (v\u00e9rifie les ordres).', !ok);
      if (ok && cible && window.opener) setTimeout(function () { window.close(); }, 1200);
    };
    if (!form) { action.click(); return; }
    fetch(form.action, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: new URLSearchParams(new FormData(form)).toString(), referrerPolicy: 'no-referrer' })
      .then(function (r) { retour(r.ok); }, function () { retour(false); });
  }

  // Second bloc de la page Ordres : meme presentation que la partie Tresors de Ma vue (table.vue du jeu : colonnes Dist., Actions,
  // Ref., Nom, X, Y, N), avec « Plus grosses piles » et les filtres Parchemin / Composant / Gigots de Gob / Personne sur la case.
  function addVueTable(parent, before, d, infoTxt, vieux) {
    ['/mountyhall/libs/vue.css?v=1.82', '/mountyhall/libs/footable-bootstrap.css?version=1.13'].forEach(function (href) {
      if (document.querySelector('link[href="' + href + '"]')) return;
      var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
    });
    var box = document.createElement('div');
    box.id = 'mhx-tresors-ordres2';
    var titre = document.createElement('div');
    titre.className = 'mh_tdtitre mhx-to2-titre';
    titre.innerHTML = '<h3>TR\u00c9SORS</h3>';
    box.appendChild(titre);
    if (infoTxt) { var ligne = document.createElement('div'); ligne.className = 'mhx-to-info' + (vieux ? ' mhx-to-vieux' : ''); ligne.textContent = infoTxt; box.appendChild(ligne); }
    var occ = d.occ || { gowap: [], troll: [] };
    var actifs = {}, excl = { actif: false, dist: 0 }, pilesN = 5, pilesOn = false, sel = null, tri = { cle: 'dist', sens: 1 };
    var marks = {}, moiM = currentTrollId(), drawM = null;
    var chargeMarks = function () { marksCall('', function (m) { if (m) { marks = m; if (drawM) drawM(); } }); };
    chargeMarks();
    var pilesBox = document.createElement('div'); pilesBox.id = 'mhx-tpiles';
    var pl = document.createElement('div'); pl.className = 'mhx-piles-ligne';
    var bp = document.createElement('button'); bp.type = 'button'; bp.className = 'mh_form_submit mhx-tfiltre'; bp.textContent = 'Plus grosses piles';
    var sp = document.createElement('select'); sp.className = 'mhx-tdist';
    [3, 5, 10, 20].forEach(function (n) { var o = document.createElement('option'); o.value = n; o.textContent = n; if (n === 5) o.selected = true; sp.appendChild(o); });
    var l1 = document.createElement('span'); l1.textContent = 'Afficher les';
    var l2 = document.createElement('span'); l2.textContent = 'piles (de la plus grosse \u00e0 la plus petite)';
    pl.appendChild(bp); pl.appendChild(l1); pl.appendChild(sp); pl.appendChild(l2);
    var liste = document.createElement('div'); liste.className = 'mhx-piles-liste';
    pilesBox.appendChild(pl); pilesBox.appendChild(liste);
    var bar = document.createElement('div'); bar.id = 'mhx-tfiltres';
    var info = document.createElement('span'); info.className = 'mhx-tinfo';
    var table = document.createElement('table');
    table.className = 'mh_tdborder footable vue';
    var hd = table.createTHead(), hr = hd.insertRow(), tb = table.createTBody();
    hd.className = 'mh_tdtitre';
    var cols = [['dist', 'Dist.', 'dist'], ['actions', 'Actions', null], ['ref', 'R\u00e9f.', 'ref'], ['', 'Nom', 'nom'], ['x', 'X', 'x'], ['y', 'Y', 'y'], ['n', 'N', 'n']];
    var sortable = document.createElement('div'); sortable.className = 'horizontal-scroll';
    var proche = function (it, liste2) {
      return liste2.some(function (q) { return q[2] === it.n && Math.max(Math.abs(q[0] - it.x), Math.abs(q[1] - it.y)) <= excl.dist; });
    };
    var portee = null, limiteVue = false, bv = null;
    var majPortee = function () { // la portee peut n'etre memorisee qu'apres l'ouverture de la page (lecture du Profil en arriere-plan)
      var gv = gowapVueGet(gowapId());
      portee = gv ? gv.v + gv.b : null;
      if (bv) bv.textContent = portee === null ? 'Dans la vue du suivant (vue inconnue)' : 'Dans la vue du suivant (\u2264 ' + portee + ', N \u00b1 ' + Math.floor(portee / 2) + ')';
    };
    var visibles = function () {
      var on = TRESOR_ORDRES_FILTRES.filter(function (f, i) { return actifs[i]; });
      return d.items.filter(function (it) {
        if (limiteVue && portee !== null) { var gp2 = gowapPos(); if (gp2 ? !dansVueSuivant(it, gp2, portee) : it.dist > portee) return false; }
        if (on.length && !on.some(function (f) { return f[1].test(it.nom); })) return false;
        if (excl.actif && (proche(it, occ.gowap || []) || proche(it, occ.troll || []))) return false;
        return true;
      });
    };
    var draw = function () {
      var items = visibles();
      info.textContent = items.length < d.items.length ? items.length + ' / ' + d.items.length + ' affich\u00e9s' : '';
      tb.textContent = '';
      items.sort(function (a, b) {
        var va = a[tri.cle], vb = b[tri.cle];
        return (typeof va === 'string' ? va.localeCompare(vb) : va - vb) * tri.sens || a.ref - b.ref;
      }).forEach(function (it) {
        var tr = tb.insertRow();
        tr.className = 'mh_tdpage' + (sel && sel === it.x + ';' + it.y + ';' + it.n ? ' mhx-pile-hl' : '');
        if (marks[it.ref]) tr.classList.add('mhx-marque');
        tr.style.cursor = 'pointer';
        if (it.age > 3600) { tr.style.opacity = '0.75'; }
        var vuIl = it.age >= 3600 ? Math.floor(it.age / 3600) + ' h' : Math.floor(it.age / 60) + ' min';
        var reste = Math.max(0, 24 * 3600 - it.age), resteTxt = reste >= 3600 ? Math.floor(reste / 3600) + ' h' : Math.max(1, Math.floor(reste / 60)) + ' min'; // le serveur garde les tr\u00e9sors 24 h (TRESORS_CONSERVES_HEURES)
        tr.title = '(vu il y a ' + vuIl + ' - visible encore ' + resteTxt + ') Cliquer : \u00ab Aller chercher \u00bb si le tr\u00e9sor est dans la vue du suivant, sinon \u00ab Se d\u00e9placer vers \u00bb sa position puis \u00ab Arr\u00eat \u00bb';
        tr.addEventListener('click', function () { if (allerChercher(it, function (t) { info.textContent = t; })) return; if (prefillDeplacement(it.x, it.y, it.n)) info.textContent = '\u00c9tape pr\u00e9-remplie (X=' + it.x + ' Y=' + it.y + ' N=' + it.n + ') \u2014 v\u00e9rifie puis valide l\u2019ordre toi-m\u00eame'; });
        cols.forEach(function (c) {
          var td = tr.insertCell();
          if (c[0]) td.className = c[0];
          if (c[1] === 'Actions') {
            if (marks[it.ref] && String(marks[it.ref]) === String(moiM)) { // seul celui qui a pose la marque peut la retirer
              var x = document.createElement('a');
              x.href = '#'; x.textContent = '\u2715'; x.className = 'mhx-marque-x'; x.title = 'Retirer la marque (tr\u00e9sor plus en cours de r\u00e9cup\u00e9ration)';
              x.addEventListener('click', function (ev) { ev.preventDefault(); ev.stopPropagation(); delete marks[it.ref]; draw(); marksCall('action=del&ref=' + it.ref + '&troll=' + moiM, function (m) { if (m) { marks = m; draw(); } }); });
              td.appendChild(x);
            }
            if (it.icone) {
              var sp2 = document.createElement('span'); sp2.className = 'cm cm-tresor';
              var im = document.createElement('img'); im.src = it.icone; im.alt = 'Tr\u00e9sor'; im.height = 20;
              sp2.appendChild(im); td.appendChild(sp2);
            }
          } else td.textContent = c[1] === 'Nom' ? it.nom : it[c[2]];
        });
      });
      liste.textContent = '';
      if (!pilesOn) return;
      var g = {};
      items.forEach(function (it) { var k = it.x + ';' + it.y + ';' + it.n; (g[k] = g[k] || []).push(it); });
      var top = Object.keys(g).map(function (k) { return { k: k, l: g[k] }; }).sort(function (a, b) { return b.l.length - a.l.length; }).slice(0, pilesN);
      var tete = document.createElement('div'); tete.className = 'mhx-piles-tete';
      tete.textContent = top.length + ' pile' + (top.length > 1 ? 's' : '') + ' sur ' + Object.keys(g).length + ' \u2014 cliquer sur une ligne pour la rep\u00e9rer dans le tableau';
      liste.appendChild(tete);
      top.forEach(function (t, i) {
        var noms = {};
        t.l.forEach(function (it) { var nm = /centaines? de GG/i.test(it.nom) || /^\d+ .*GG/i.test(it.nom) ? 'GG' : it.nom; noms[nm] = (noms[nm] || 0) + 1; });
        var compo = Object.keys(noms).sort(function (a, b) { return noms[b] - noms[a]; }).map(function (nm) { return noms[nm] + ' ' + nm; }).join(', ');
        var row = document.createElement('div');
        row.className = 'mhx-pile' + (sel === t.k ? ' mhx-pile-sel' : '');
        row.textContent = (i + 1) + '. ' + t.l.length + ' tr\u00e9sors \u2014 X=' + t.l[0].x + ' | Y=' + t.l[0].y + ' | N=' + t.l[0].n + ' (dist. ' + t.l[0].dist + ') : ' + compo;
        row.addEventListener('click', function () { sel = sel === t.k ? null : t.k; draw(); var h = tb.querySelector('tr.mhx-pile-hl'); if (h && h.scrollIntoView) h.scrollIntoView({ block: 'nearest' }); });
        liste.appendChild(row);
      });
    };
    cols.forEach(function (c) {
      var td = hr.insertCell();
      td.textContent = c[1];
      if (c[0]) td.className = c[0];
      if (c[2]) {
        td.style.cursor = 'pointer';
        td.addEventListener('click', function () { tri = { cle: c[2], sens: tri.cle === c[2] ? -tri.sens : 1 }; draw(); });
      }
    });
    TRESOR_ORDRES_FILTRES.forEach(function (f, i) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mh_form_submit mhx-tfiltre'; b.textContent = f[0];
      b.addEventListener('click', function () { actifs[i] = !actifs[i]; b.classList.toggle('mhx-actif', !!actifs[i]); draw(); });
      bar.appendChild(b);
    });
    var bx = document.createElement('button'); bx.type = 'button'; bx.className = 'mh_form_submit mhx-tfiltre'; bx.textContent = 'Personne sur la case';
    bx.title = 'Masque les tr\u00e9sors ayant un gowap apprivois\u00e9 ou un troll \u00e0 la distance r\u00e9gl\u00e9e (positions de la derni\u00e8re vue)';
    bx.addEventListener('click', function () { excl.actif = !excl.actif; bx.classList.toggle('mhx-actif', excl.actif); draw(); });
    var sd = document.createElement('select'); sd.className = 'mhx-tdist';
    ['m\u00eame case', '\u2264 1 case', '\u2264 2 cases', '\u2264 3 cases'].forEach(function (t, i) { var o = document.createElement('option'); o.value = i; o.textContent = t; sd.appendChild(o); });
    sd.addEventListener('change', function () { excl.dist = parseInt(sd.value, 10) || 0; draw(); });
    bv = document.createElement('button'); bv.type = 'button'; bv.className = 'mh_form_submit mhx-tfiltre';
    bv.title = 'Masque les tr\u00e9sors hors de la vue du suivant : X et Y jusqu\u2019\u00e0 sa Vue, N jusqu\u2019\u00e0 la moiti\u00e9 de sa Vue (6 -> 3, 5 -> 2)';
    bv.addEventListener('click', function () { majPortee(); limiteVue = !limiteVue; bv.classList.toggle('mhx-actif', limiteVue); draw(); });
    bar.insertBefore(bv, bar.firstChild);
    majPortee();
    setTimeout(function () { majPortee(); if (limiteVue) draw(); }, 2500);
    bar.appendChild(bx); bar.appendChild(sd); bar.appendChild(info);
    bp.addEventListener('click', function () { pilesOn = !pilesOn; pilesBox.classList.toggle('mhx-piles-on', pilesOn); bp.classList.toggle('mhx-actif', pilesOn); draw(); });
    sp.addEventListener('change', function () { pilesN = parseInt(sp.value, 10) || 5; draw(); });
    box.appendChild(pilesBox); box.appendChild(bar);
    sortable.appendChild(table); box.appendChild(sortable);
    drawM = draw;
    draw();
    parent.insertBefore(box, before);
  }

  var TRESOR_ORDRES_FILTRES = [['Parchemin', /^Parchemin/i], ['Composant', /^Composant/i], ['Gigots de Gob', /^Gigots?\s+de\s+Gob/i]];
  function addTresorsOrdres() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname) || !/[?&]sub=ordres\b/.test(location.search)) return;
    var tries = 0;
    (function run() {
      var carte = document.getElementById('carte_trajet');
      if (!carte && ++tries < 6) return setTimeout(run, 800);
      if (!carte || document.getElementById('mhx-tresors-ordres')) return;
      var me = aggroTroll();
      if (!me) return;
      var box = document.createElement('div');
      box.id = 'mhx-tresors-ordres';
      box.innerHTML = '<div class="mhx-to-titre">Tr\u00e9sors (derni\u00e8re vue de Ma vue)</div><div class="mhx-to-info">Chargement\u2026</div>';
      carte.parentNode.insertBefore(box, carte);
      fetch(TRESORS_URL + '?troll=' + me, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        var info = box.querySelector('.mhx-to-info');
        if (!d || !d.maj) { info.textContent = 'Aucune vue enregistr\u00e9e : ouvre \u00ab Ma vue \u00bb une fois pour alimenter cette liste.'; return; }
        var gp = gowapPos();
        if (gp) d.items.forEach(function (it) { it.dist = distGowap(it, gp); }); // Dist. = distance au suivant
        var anciens = d.items.filter(function (it) { return it.age > d.age + 600; }).length; // vus lors d'une vue precedente
        var h = Math.floor(d.age / 3600), min = Math.floor(d.age / 60) % 60;
        info.textContent = d.items.length + ' tr\u00e9sors' + (anciens ? ' (dont ' + anciens + ' conserv\u00e9s d\u2019une vue pr\u00e9c\u00e9dente)' : '') + ', derni\u00e8re vue du ' + d.maj + ' (il y a ' + (h ? h + ' h ' : '') + min + ' min)' + (gp ? ' \u2014 distances depuis le suivant (X=' + gp.x + ' Y=' + gp.y + ' N=' + gp.n + ')' : '');
        if (d.age > 86400) { info.className += ' mhx-to-vieux'; info.textContent += ' \u2014 vue ancienne, rouvre \u00ab Ma vue \u00bb'; }
        // seul le bloc « meme affichage que Ma vue » est conserve ; la ligne d'information (date de la vue) passe dedans
        addVueTable(box.parentNode, box, d, info.textContent, d.age > 86400);
        box.parentNode.removeChild(box);
      }, function () { box.querySelector('.mhx-to-info').textContent = 'Serveur MH injoignable.'; });
    })();
  }

  // Aggro : derniere personne frappee par un monstre. Page du monstre : lue dans ses evenements, affichee et envoyee
  // au serveur MH (table mh_aggro) ; page Ma vue : colonne « Aggro » entre PV et Ref., lue sur le serveur.
  var AGGRO_URL = 'https://mh.percolouco.com/notif/aggro.php';
  // Derniere cible visee d'apres les evenements d'une page de monstre (document deja charge ou recupere en arriere-plan).
  // Renvoie null si le tableau d'evenements est absent, {vide:true} s'il ne contient aucun coup du monstre.
  function aggroLast(doc, raw) {
    var evts = aggroEvents(doc, raw);
    if (!evts) return null;
    var last = null;
    evts.forEach(function (e) {
      if (last) return; // evenements du plus recent au plus ancien : le premier trouve est le dernier coup
      var m = /^\s*(?:un|une)\s.*?\(\s*(\d+)\s*\)\s+a (?:frapp\u00e9|tent\u00e9 de frapper)\s+(.+?)\s*\(\s*(\d+)\s*\)/i.exec(e.descr.replace(/[\s\u00a0]+/g, ' '));
      if (m) last = { date: e.date, monstre: m[1], nom: m[2], cible: m[3] };
    });
    return last || { vide: true };
  }
  // Evenements d'une page de monstre : lignes du tableau (page affichee), ou, pour une page recuperee en arriere-plan
  // (pas de JavaScript execute), donnees JSON placees dans le script de la page (loadRows("events", ...)).
  function aggroEvents(doc, raw) {
    var out = [];
    doc.querySelectorAll('#events tbody tr').forEach(function (tr) {
      var c = tr.cells, d = c && c.length >= 3 ? /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/.exec(c[0].textContent) : null;
      if (d) out.push({ date: d[1], descr: c[c.length - 1].textContent });
    });
    if (out.length) return out;
    var m = raw ? /\br\s*=\s*("(?:[^"\\]|\\.)*")\s*;\s*loadRows\(\s*"events"/.exec(raw) : null;
    if (m) {
      try {
        JSON.parse(JSON.parse(m[1].replace(/\\\\|\\'/g, function (t) { return t === "\\'" ? "'" : t; }))).forEach(function (e) {
          var d = /(\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2})/.exec(e.date || '');
          if (d) out.push({ date: d[1], descr: new DOMParser().parseFromString(e.descr || '', 'text/html').body.textContent });
        });
        return out;
      } catch (err) { return null; }
    }
    return doc.getElementById('events') && !raw ? out : null; // page affichee sans evenement : vide ; page recuperee sans donnees : inattendue
  }
  function aggroSend(me, monstre, last) {
    var corps = 'troll=' + me + '&monstre=' + monstre;
    if (last && !last.vide) corps += '&cible=' + last.cible + '&nom=' + encodeURIComponent(last.nom) + '&date=' + encodeURIComponent(last.date);
    mhdPost(AGGRO_URL, corps, function () {});
  }
  function aggroTroll() {
    var me = (document.body && document.body.getAttribute('data-idtroll')) || currentTrollId();
    try { // page ouverte hors du jeu (pas de cadre) : troll m\u00e9moris\u00e9 lors d'une visite pr\u00e9c\u00e9dente
      if (/^\d+$/.test(me || '')) localStorage.setItem('mhx-troll', me);
      else me = localStorage.getItem('mhx-troll');
    } catch (e) { /* stockage indisponible */ }
    return /^\d+$/.test(me || '') ? me : null;
  }
  function addMonsterAggro() {
    if (!/\/MonsterView\.php$/.test(location.pathname)) return;
    var last = aggroLast(document);
    if (!last) return;
    var id = last.monstre || (/[?&]ai_IDPJ=(\d+)/.exec(location.search) || [])[1];
    if (!last.vide) {
      var box = document.createElement('div');
      box.className = 'mhx-monstre';
      box.innerHTML = '<h4>\u2694\ufe0f Aggro</h4><b>Derni\u00e8re cible vis\u00e9e :</b> ';
      box.appendChild(document.createTextNode(last.nom + ' (' + last.cible + ') le ' + last.date));
      var form = document.querySelector('form[action=""]');
      if (form && form.parentNode) form.parentNode.insertBefore(box, form);
      else if (document.body) document.body.insertBefore(box, document.body.firstChild);
    }
    var me = aggroTroll();
    if (me && id) aggroSend(me, id, last);
  }

  // Fiche d'un monstre : bouton \u00ab Suivi PV / finisseurs \u00bb (PV restants estim\u00e9s d'apr\u00e8s la derni\u00e8re CdM et les frappes publi\u00e9es,
  // possibilit\u00e9s de finition de TeleKom et Flak Flak). Calcul fait par le serveur MH (notif/pv_monstre.php) ; affichage uniquement.
  var PLAN_WA_URL = 'https://mh.percolouco.com/notif/plan_whatsapp.php';
  var PV_MONSTRE_URL = 'https://mh.percolouco.com/notif/pv_monstre.php';
  var MONSTRE_PROCHAIN_TOUR = null; // ms : prochain tour estime du monstre (rempli par l'analyse tactique de la fiche)
  // Estimation Mountyzilla lue sur la page du monstre (lignes \u00ab Points de Vie 200-470 -> 335 PV \u00bb et \u00ab D\u00e9s de R\u00e9g\u00e9n\u00e9ration \u00bb), m\u00e9moris\u00e9e pour la colonne PV de Ma vue.
  var PV_MZ_KEY = 'mhx-pv-mz-1';
  // texte de la cellule qui suit le libelle ; l'intervalle jaune a 80 % (span) est place AVANT la valeur dans la cellule : on le retire
  function monsterMzRow(re) {
    var tds = document.querySelectorAll('td');
    for (var i = 0; i < tds.length; i++) {
      var td = tds[i];
      if (td.children.length > 3 || !td.nextElementSibling || !re.test(td.textContent.replace(/[\s\u00a0]+/g, ' ').trim())) continue;
      var c = td.nextElementSibling.cloneNode(true);
      c.querySelectorAll('span').forEach(function (x) { x.remove(); });
      return c.textContent.replace(/[\s\u00a0]+/g, ' ').trim();
    }
    return null;
  }
  // moyenne d'une cellule Mountyzilla « 7-16 -> 11.5 D6 » (valeur apres la fleche, sinon milieu de la fourchette)
  function mzMoyenne(txt) {
    var m = /(\d+(?:[.,]\d+)?)\s*-\s*(\d+(?:[.,]\d+)?)(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(txt || '');
    if (!m) return null;
    var f = function (x) { return parseFloat(String(x).replace(',', '.')); };
    return m[3] ? f(m[3]) : (f(m[1]) + f(m[2])) / 2;
  }
  function monsterMzRead() {
    var pvTxt = monsterMzRow(/^Points de Vie$/);
    if (!pvTxt) return null;
    var m = /(\d+)\s*-\s*(\d+)(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(pvTxt);
    if (!m) return null;
    var lo = parseInt(m[1], 10), hi = parseInt(m[2], 10);
    if (!(hi >= lo)) return null;
    var out = { pv: [lo, hi], avg: m[3] ? Math.round(parseFloat(m[3].replace(',', '.'))) : Math.round((lo + hi) / 2) };
    var rgTxt = monsterMzRow(/^(?:D\u00e9s de )?R\u00e9g\u00e9n\u00e9ration$/);
    var r = rgTxt && /(\d+)(?:\s*-\s*(\d+))?(?:\s*(?:\u2192|->|\u2794|\u279c)\s*(\d+(?:[.,]\d+)?))?/.exec(rgTxt);
    if (r) { out.reg = [parseInt(r[1], 10), parseInt(r[2] || r[1], 10)]; if (r[3]) out.regAvg = parseFloat(r[3].replace(',', '.')); }
    // esquive (nombre de des), RM et armures : pour le plan de finition (taux de touche, seuil de resistance, degats nets)
    var ex = mzMoyenne(monsterMzRow(/^(?:D\u00e9s d.)?Esquive$/i)), rx = mzMoyenne(monsterMzRow(/^RM$/)), ap = mzMoyenne(monsterMzRow(/^Armure physique$/i)), am = mzMoyenne(monsterMzRow(/^Armure magique$/i));
    if (ex !== null) out.esq = ex;
    if (rx !== null) out.rm = rx;
    if (ap !== null) out.arm_p = ap;
    if (am !== null) out.arm_m = am;
    return out;
  }
  function monsterMzStore(id, mz) {
    try {
      var all = JSON.parse(localStorage.getItem(PV_MZ_KEY) || '{}') || {};
      all[id] = Object.assign({ t: Date.now() }, mz);
      var ks = Object.keys(all);
      if (ks.length > 400) ks.sort(function (a, b) { return all[a].t - all[b].t; }).slice(0, ks.length - 400).forEach(function (k) { delete all[k]; });
      localStorage.setItem(PV_MZ_KEY, JSON.stringify(all));
    } catch (e) { /* ignore */ }
  }
  function monsterMzGet(id) {
    try { var o = (JSON.parse(localStorage.getItem(PV_MZ_KEY) || '{}') || {})[id]; return o ? { pv: o.pv, avg: o.avg, reg: o.reg, regAvg: o.regAvg, esq: o.esq, rm: o.rm, arm_p: o.arm_p, arm_m: o.arm_m } : null; } catch (e) { return null; }
  }
  function addFinisseurs() {
    if (!/\/MonsterView\.php$/.test(location.pathname)) return;
    var id = (/[?&]ai_IDPJ=(\d+)/.exec(location.search) || [])[1];
    if (!id || document.getElementById('mhx-finisseurs')) return;
    var mzTries = 0;
    (function lireMz() { var z = monsterMzRead(); if (z) monsterMzStore(id, z); else if (++mzTries < 8) setTimeout(lireMz, 800); })(); // l'estimation MZ peut arriver apr\u00e8s le reste de la page
    var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    tacBox();
    var box = el('div'); box.id = 'mhx-finisseurs';
    var res = el('div', 'mhx-fin-res');
    var planBox = document.getElementById('mhx-tac-plan');
    var btn = document.getElementById('mhx-tac-btn');
    var TAC = { data: null, ideal: true, sel: {}, cur: [] }; // plan \u00ab parfait \u00bb par d\u00e9faut (sorts r\u00e9ussis, jamais r\u00e9sist\u00e9s)
    var court = function (t) { return t.replace(/^Vampirisme/, 'Vampi.').replace(/^Projectile Magique/, 'PM').replace(/^Acc\u00e9l\u00e9ration du M\u00e9tabolisme \(\u2248 (\d+) PV sacrifi\u00e9s\)/, 'AM (\u2248 $1 PV)'); };
    var pc = function (x) { return Math.round(x * 100) + ' %'; };
    var degTxt = function (o) { return o.deg ? ' \u2248' + o.deg : ''; }; // d\u00e9g\u00e2ts moyens subis par le monstre apr\u00e8s armure (magique pour un sort, physique + magique pour une comp\u00e9tence)
    var majPied = function (carte, pl, sel) { // recalcul serveur de la chance de tuer pour les frappes choisies (dans l'ordre)
      var pied = carte.querySelector('.mhx-carte-pied'); pied.style.opacity = '.5';
      var jeton = (carte.mhxJeton = (carte.mhxJeton || 0) + 1);
      var z = monsterMzRead() || monsterMzGet(id);
      fetch(PV_MONSTRE_URL + '?id=' + id + (MONSTRE_PROCHAIN_TOUR ? '&fin_ms=' + Math.round(MONSTRE_PROCHAIN_TOUR) : '') + (z ? '&mz=' + encodeURIComponent(JSON.stringify(z)) : '') + '&custom=' + encodeURIComponent(JSON.stringify([{ t: pl.t_ts, sel: sel, ideal: TAC.ideal }])), { referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.json() : null; }).then(function (r) {
          if (jeton !== carte.mhxJeton) return;
          pied.style.opacity = '';
          var c = r && r.plans_custom && r.plans_custom[0];
          pied.textContent = '\ud83c\udfaf '; if (!c) { pied.appendChild(document.createTextNode('calcul impossible')); return; }
          pied.appendChild(el('b', null, pc(c.p_kill) + ' de chances')); pied.appendChild(el('span', 'mhx-dep', ' (' + c.degats_attendus + ' dgts attendus)'));
        }, function () { pied.style.opacity = ''; });
    };
    var dessineCarte = function (cls, titre, pl, cle) {
      var st = TAC.sel[cle]; if (!st) st = TAC.sel[cle] = pl.sel.slice();
      var carte = el('div', 'mhx-carte ' + cls); carte.appendChild(el('div', 'mhx-carte-t', titre));
      var corps = el('div'); carte.appendChild(corps);
      var pied = el('div', 'mhx-carte-pied'); pied.appendChild(document.createTextNode('\ud83c\udfaf ')); pied.appendChild(el('b', null, pc(pl.p_kill) + ' de chances')); pied.appendChild(el('span', 'mhx-dep', ' (' + pl.degats_attendus + ' dgts attendus)'));
      var opt = {}; pl.options.forEach(function (o) { opt[o.i] = o; });
      var chip = function (o, actif) {
        var c = el('button', 'mhx-chip' + (actif ? ' mhx-chip-on' : ''), court(o.attaque) + degTxt(o)); c.type = 'button';
        c.title = o.nom + ' \u2014 ' + o.attaque + ' (' + o.quand + ')' + (o.deg ? ' : \u2248 ' + o.deg + ' PV de d\u00e9g\u00e2ts apr\u00e8s armure' : '') + ' \u2014 clique pour ' + (actif ? 'retirer' : 'ajouter \u00e0 la fin');
        c.addEventListener('click', function () { var k = st.indexOf(o.i); if (k >= 0) st.splice(k, 1); else st.push(o.i); remplit(); majPied(carte, pl, st); });
        return c;
      };
      var remplit = function () {
        corps.textContent = '';
        var groupes = [];
        st.forEach(function (i) { var o = opt[i]; if (!o) return; var g = groupes[groupes.length - 1]; if (!g || g.troll !== o.troll) { g = { troll: o.troll, nom: o.nom, items: [] }; groupes.push(g); } g.items.push(o); });
        var vu = {}, amFait = {};
        groupes.forEach(function (g, n) {
          var l = el('div', 'mhx-carte-l'); l.appendChild(document.createTextNode((n + 1) + '. ')); l.appendChild(el('b', null, g.nom)); l.appendChild(document.createTextNode(' \u2014 '));
          g.items.forEach(function (o, k) {
            var tr = pl.trolls[o.troll] || {};
            if (k) l.appendChild(document.createTextNode(' + '));
            if (o.quand === 'apr\u00e8s Acc. m\u00e9tabolique' && tr.am && !amFait[o.troll]) { amFait[o.troll] = 1; l.appendChild(el('span', 'mhx-chip mhx-chip-am', 'AM (\u2248 ' + tr.am.pv + ' PV)')); l.appendChild(document.createTextNode(' + ')); }
            l.appendChild(chip(o, true));
          });
          var dep = !vu[g.troll] && (pl.trolls[g.troll] || {}).dep ? pl.trolls[g.troll].dep.replace(/^([\d.,]+) PA de d\u00e9placement.*$/, '+ DE $1PA') : '';
          vu[g.troll] = 1; if (dep) l.appendChild(el('span', 'mhx-dep', ' (' + dep + ')'));
          corps.appendChild(l);
        });
        if (!groupes.length) corps.appendChild(el('div', 'mhx-carte-l mhx-dep', 'Aucune frappe : clique sur une frappe ci-dessous.'));
        var libres = pl.options.filter(function (o) { return st.indexOf(o.i) < 0; });
        if (libres.length) { var a = el('div', 'mhx-carte-l mhx-libres'); a.appendChild(el('span', 'mhx-dep', 'Ajouter : ')); libres.forEach(function (o) { var c = chip(o, false); c.textContent = o.nom + ' ' + court(o.attaque) + degTxt(o) + (o.quand === 'apr\u00e8s Acc. m\u00e9tabolique' ? ' (apr\u00e8s AM)' : ''); a.appendChild(c); }); corps.appendChild(a); }
        TAC.cur = TAC.cur.filter(function (x) { return x.cle !== cle; }); TAC.cur.push({ cle: cle, t: pl.t_ts, sel: st, titre: titre });
      };
      remplit(); carte.appendChild(pied); planBox.appendChild(carte);
      if (st.join() !== pl.sel.join()) majPied(carte, pl, st);
      return carte;
    };
    var dessinePlans = function () {
      var j = TAC.data; if (!j) return; planBox.textContent = ''; TAC.cur = [];
      var pf = TAC.ideal && j.plan_finition_ideal ? j.plan_finition_ideal : j.plan_finition;
      if (!pf) return;
      var m = TAC.ideal ? 'i' : 'r';
      var tete = el('div', 'mhx-tac-tete'); tete.appendChild(el('div', 'mhx-tac-t mhx-tac-t-vert', '\ud83e\udded Plan de finition'));
      var lab = el('label', 'mhx-tac-ideal'); var cb = el('input'); cb.type = 'checkbox'; cb.checked = !TAC.ideal;
      cb.addEventListener('change', function () { TAC.ideal = !cb.checked; dessinePlans(); });
      lab.appendChild(cb); lab.appendChild(document.createTextNode(' Tenir compte des % de r\u00e9ussite et du seuil de r\u00e9sistance')); lab.title = 'D\u00e9coch\u00e9 (plan parfait) : chaque sort r\u00e9ussit et n\u2019est jamais r\u00e9sist\u00e9, seuls le toucher et le critique restent al\u00e9atoires';
      tete.appendChild(lab); planBox.appendChild(tete);
      var pl = pf.plan;
      if (pl) {
        if (pf.plan_maintenant) dessineCarte('mhx-c-rouge', '\u25b6\ufe0f Maintenant', pf.plan_maintenant, m + 'n');
        dessineCarte(pf.faisable ? 'mhx-c-vert' : 'mhx-c-orange', pl.t === 'maintenant' ? '\u25b6\ufe0f Maintenant' : '\u23f3 Meilleur moment : ' + pl.t.replace(' ', ' \u00e0 '), pl, m + 'm');
      }
      var ex = pf.exclus || [];
      if (ex.length) { var dx = el('div', 'mhx-carte mhx-c-gris'); dx.appendChild(el('div', 'mhx-carte-t', '\ud83d\udeab Non utilis\u00e9' + (ex.length > 1 ? 's' : ''))); ex.forEach(function (x) { var l = el('div', 'mhx-carte-l'); l.appendChild(el('b', null, x.nom)); l.appendChild(document.createTextNode(' : ' + x.raison.replace(/ \(aucun cr\u00e9neau.*$/, '').replace(/^trop loin : encore (\d+) pas \u00e0 faire/, 'trop loin ($1 pas)'))); dx.appendChild(l); }); planBox.appendChild(dx); }
      (pf.notes || []).forEach(function (n) { var d = el('div', 'mhx-carte mhx-c-orange'); d.appendChild(el('div', 'mhx-carte-t', '\u26a0\ufe0f')); d.appendChild(el('div', 'mhx-carte-l', n)); planBox.appendChild(d); });
      planBox.appendChild(el('div', 'mhx-tac-note', '*Simulation sur PV max' + (TAC.ideal ? ' \u2014 sorts toujours r\u00e9ussis, jamais r\u00e9sist\u00e9s' : '')));
      if (pf.plan) document.getElementById('mhx-tac-wa').style.display = '';
    };
    var calcule = function () {
      btn.disabled = true; res.textContent = 'Calcul en cours...'; planBox.textContent = '';
      fetch(PV_MONSTRE_URL + '?id=' + id + (MONSTRE_PROCHAIN_TOUR ? '&fin_ms=' + Math.round(MONSTRE_PROCHAIN_TOUR) : '') + (function () { var z = monsterMzRead() || monsterMzGet(id); if (z) monsterMzStore(id, z); return z ? '&mz=' + encodeURIComponent(JSON.stringify(z)) : ''; })(), { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        btn.disabled = false; res.textContent = ''; planBox.textContent = '';
        if (!j) { res.textContent = 'Serveur injoignable.'; return; }
        var plage = function (a) { return a ? (a[1] === null ? '\u2265 ' + a[0] : a[0] === a[1] ? String(a[0]) : a[0] + '-' + a[1]) : '?'; };
        var titre = document.getElementById('mhx-tac-titre'); titre.textContent = '\ud83e\udd87 Analyse tactique' + (j.nom ? ' \u2014 ' + j.nom : '') + (j.cible_chasse ? ' \ud83c\udfaf' : '');
        var tt = el('div', 'mhx-tac-t mhx-tac-t-orange', 'Infos monstre'); res.appendChild(tt);
        var row = function (l, v, c) { var r = tacRow(l, v, c); res.appendChild(r); return r; };
        if (j.cdm) row('PV max', plage(j.cdm.pv_max) + (j.cdm.blessure !== null ? ' (\u00b1' + j.cdm.blessure + ' %)' : '') + ' CdM ' + j.cdm.date.replace(/^(\d+)-(\d+)-(\d+) (\d+:\d+).*$/, '$3/$2'));
        else if (j.mz) row('PV max', j.mz.pv[0] + '-' + j.mz.pv[1] + (j.mz.avg ? ' (\u2192 ' + j.mz.avg + ')' : '') + ' MZ');
        else row('PV max', 'inconnus');
        var rst = row('PV restants', j.restants ? plage(j.restants) + (j.estimation ? ' (estim.)' : '') : 'inconnus');
        if (j.estimation && j.raisons && j.raisons.length) rst.title = j.raisons.join(' ; ');
        row('D\u00e9g\u00e2ts subis', j.degats_cumules + (j.nb_frappes ? ' (' + j.nb_frappes + ' frappe' + (j.nb_frappes > 1 ? 's' : '') + ')' : '') + (j.nb_frappes_total > j.nb_frappes ? ' +' + (j.nb_frappes_total - j.nb_frappes) + ' avant CdM' : ''));
        var icone = { 'morte': '\u2620\ufe0f', 'finissable': '\u2705', 'bient\u00f4t finissable': '\ud83d\udfe1', 'encore r\u00e9sistante': '\ud83d\udee1\ufe0f' }[j.etat] || '';
        row('\u00c9tat', icone + ' ' + j.etat);
        if (j.esquive) row('Esquive', String(j.esquive.valeur)).title = j.esquive.source;
        TAC.data = j; TAC.sel = {}; dessinePlans();
      }, function () { btn.disabled = false; res.textContent = 'Serveur injoignable.'; });
    };
    btn.addEventListener('click', calcule);
    var wa = document.getElementById('mhx-tac-wa');
    wa.addEventListener('click', function () {
      if (!window.confirm('Envoyer le plan de finition dans le groupe WhatsApp ?')) return;
      var tid = currentTrollId(), z = monsterMzRead() || monsterMzGet(id);
      if (!tid) { try { tid = localStorage.getItem('mhx-troll'); } catch (e) { tid = null; } }
      if (!/^\d+$/.test(tid || '')) tid = null;
      if (!tid) { wa.textContent = '\u26a0\ufe0f Troll inconnu : ouvre ta page Profil ou Ma vue puis reviens'; setTimeout(function () { wa.textContent = '\ud83d\udcf2 WhatsApp'; }, 6000); return; }
      wa.disabled = true; wa.textContent = 'Envoi...';
      var body = 'troll=' + encodeURIComponent(tid) + '&id=' + encodeURIComponent(id) + (MONSTRE_PROCHAIN_TOUR ? '&fin_ms=' + Math.round(MONSTRE_PROCHAIN_TOUR) : '') + (z ? '&mz=' + encodeURIComponent(JSON.stringify(z)) : '') + (TAC.cur.length ? '&ideal=' + (TAC.ideal ? 1 : 0) + '&custom=' + encodeURIComponent(JSON.stringify(TAC.cur.map(function (c) { return { t: c.t, sel: c.sel, ideal: TAC.ideal }; }))) : '');
      fetch(PLAN_WA_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body, referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (r) { wa.textContent = r && r.sent ? '\u2705 Envoy\u00e9' : '\u26a0\ufe0f ' + ((r && r.error) || '\u00e9chec'); setTimeout(function () { wa.disabled = false; wa.textContent = '\ud83d\udcf2 WhatsApp'; }, 4000); })
        .catch(function () { wa.textContent = '\u26a0\ufe0f \u00e9chec'; setTimeout(function () { wa.disabled = false; wa.textContent = '\ud83d\udcf2 WhatsApp'; }, 4000); });
    });
    box.appendChild(res);
    // calcul automatique à l'ouverture, dès que l'estimation Mountyzilla et le tour du monstre sont lus (6 s au plus)
    var att = 0;
    (function pret() { if ((!monsterMzRead() || !MONSTRE_PROCHAIN_TOUR) && ++att < 10) return setTimeout(pret, 600); calcule(); })();
    document.getElementById('mhx-tac-infos').appendChild(box);
  }

  // Formulaire du sortil\u00e8ge T\u00e9l\u00e9portation (champs X / Y / N \u00ab tpx tpy tpn \u00bb) : sous les champs, zone d'arriv\u00e9e possible
  // (d\u00e9viation max d'apr\u00e8s les r\u00e8gles du jeu + dispersion) et alerte si un trou de M\u00e9t\u00e9orite est \u00e0 6 cases ou moins.
  // Calcul fait par le serveur MH (notif/tp_info.php) ; affichage seulement, le bouton Action n'est jamais touch\u00e9.
  var TP_INFO_URL = 'https://mh.percolouco.com/notif/tp_info.php';
  function addTpPrepa() {
    var ix = document.getElementById('originex'), iy = document.getElementById('originey'), inn = document.getElementById('originen');
    if (!ix || !iy || !inn || document.getElementById('mhx-tpprepa')) return;
    // position du lanceur : milieu de la plage autoris\u00e9e de chaque champ (la port\u00e9e est centr\u00e9e sur le troll)
    var milieu = function (i) { var a = parseInt(i.getAttribute('min'), 10), b = parseInt(i.getAttribute('max'), 10); return isNaN(a) || isNaN(b) ? null : Math.round((a + b) / 2); };
    var p = { x: milieu(ix), y: milieu(iy), n: milieu(inn) };
    if (p.x === null || p.y === null || p.n === null) return;
    // le formulaire est dans le bandeau d'action (div.action, tr\u00e8s bas) : l'aide s'affiche en pop-in flottante dans la page principale
    // (cadre \u00ab Contenu \u00bb, main.play), coll\u00e9e juste au-dessus du bandeau, son coin bas-droit \u00e0 l'angle haut-droit de div.action.
    // Les cadres sont cherch\u00e9s depuis le haut ; \u00e0 d\u00e9faut, la pop-in reste dans le bandeau. Elle est retir\u00e9e \u00e0 la sortie du bandeau.
    var cherche = function (w, prof) {
      if (prof > 4) return null;
      var n = 0; try { n = w.frames.length; } catch (e) { return null; }
      for (var i = 0; i < n; i++) {
        var f = null; try { f = w.frames[i]; if (f === window) continue; var d = f.document; if (f.name === 'Contenu' && d && d.body) return f; } catch (e) { f = null; }
        var r = f ? cherche(f, prof + 1) : null; if (r) return r;
      }
      return null;
    };
    var fen = null, aMain = function (w) { try { return !!w.document.querySelector('main.play'); } catch (e) { return false; } };
    try { fen = cherche(window.top, 0); } catch (e) { fen = null; }
    if (!fen) { try { if (window.top !== window && aMain(window.top)) fen = window.top; } catch (e) { fen = null; } }
    var hote = fen ? fen.document : document;
    var el = function (tag, cls, txt) { var e = hote.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    var LARG = 340;
    var coin = function () { // abscisse du bord droit de div.action (m\u00eame origine horizontale que le cadre principal)
      var act = document.querySelector('div.action'), r = act ? act.getBoundingClientRect() : null;
      var droite = r && r.width > 0 ? r.right : Math.min(window.innerWidth, 800);
      var dec = 0; try { if (fen && fen !== window) dec = (window.frameElement ? window.frameElement.getBoundingClientRect().left : 0); } catch (e) { dec = 0; }
      return Math.max(LARG + 8, droite + dec);
    };
    var box = el('div'); box.id = 'mhx-tpprepa';
    box.style.cssText = 'position:fixed;bottom:6px;width:' + LARG + 'px;max-width:92vw;max-height:70vh;overflow:auto;z-index:99999;padding:10px 12px;text-align:left;font:12px/1.5 Trebuchet MS,Arial,sans-serif;color:#222;background:#efe6c8;border:2px solid #a47e3c;border-radius:7px;box-shadow:0 4px 14px rgba(0,0,0,.35);';
    var place = function () { box.style.left = Math.max(8, coin() - LARG) + 'px'; };
    place();
    hote.body.appendChild(box);
    var fermer = function () { try { if (box.parentNode) box.parentNode.removeChild(box); } catch (e) { /* page d\u00e9j\u00e0 d\u00e9charg\u00e9e */ } };
    window.addEventListener('pagehide', fermer);
    window.addEventListener('resize', place);
    var rng = function (a) { return a[0] === a[1] ? String(a[0]) : a[0] + ' \u00e0 ' + a[1]; };
    var seq = 0, tempo = null;
    var calcul = function () {
      var v = [ix, iy, inn].map(function (i) { return i.value.trim(); });
      box.textContent = '';
      if (!v.every(function (t) { return /^-?\d+$/.test(t); })) { box.style.display = 'none'; return; }
      box.style.display = '';
      var me = ++seq;
      box.appendChild(el('div', null, 'Calcul de la zone d\u2019arriv\u00e9e\u2026'));
      fetch(TP_INFO_URL + '?px=' + p.x + '&py=' + p.y + '&pn=' + p.n + '&x=' + v[0] + '&y=' + v[1] + '&n=' + v[2], { referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          if (me !== seq) return;
          box.textContent = '';
          if (!j || !j.arrivee) { box.appendChild(el('div', null, 'Aide TP indisponible (serveur MH injoignable).')); return; }
          var h = el('div', null, '\ud83c\udf00 Pr\u00e9paration du TP'); h.style.cssText = 'font-weight:bold;color:#7a1f1f;margin-bottom:4px;'; var x = el('span', null, '\u2716'); x.style.cssText = 'float:right;cursor:pointer;'; x.title = 'Masquer'; x.addEventListener('click', function () { box.style.display = 'none'; }); h.appendChild(x); box.appendChild(h);
          var l = function (t, b) { var d = el('div'); if (b) d.appendChild(el('b', null, b)); d.appendChild(document.createTextNode(t)); box.appendChild(d); return d; };
          var sg = function (x) { return '\u00b1' + x; };
          l('X/Y ' + sg(j.deviation.x) + ', N ' + sg(j.deviation.n), 'D\u00e9viation : ');
          l('X/Y ' + sg(j.dispersion.x) + ', N ' + sg(j.dispersion.n), 'Dispersion : ');
          var memes = j.saisie.x === +v[0] && j.saisie.y === +v[1] && j.saisie.n === +v[2];
          var sa = l(j.saisie.x + ' | ' + j.saisie.y + ' | ' + j.saisie.n + (memes ? ' (ta cible)' : ''), '\u00c0 saisir : ');
          sa.style.cssText = 'font-size:13px;color:#1b5e20;';
          var ab = function (a) { return a[0] + '/' + a[1]; };
          l('X ' + ab(j.arrivee.x) + ' | Y ' + ab(j.arrivee.y) + ' | N ' + ab(j.arrivee.n), 'Arriv\u00e9e probable : ');
          if (j.trous && j.trous.length) {
            var a = el('div', 'mhx-tp-alerte');
            a.style.cssText = 'margin-top:6px;padding:4px 8px;border:2px solid #b00020;color:#b00020;font-weight:bold;background:rgba(255,255,255,.5);';
            a.appendChild(el('div', null, '\u26a0\ufe0f Trou de M\u00e9t\u00e9orite'));
            j.trous.forEach(function (t) { a.appendChild(el('div', null, 'X=' + t.x + ' | Y=' + t.y + ' | N ' + t.n_max + ' \u00e0 ' + t.n_min + ' \u2014 \u00e0 ' + t.dist + ' case' + (t.dist > 1 ? 's' : ''))); });
            box.appendChild(a);
          }
          var src = l('appris sur ' + j.echantillon + ' TP du groupe', ''); src.style.cssText = 'font-size:10px;color:#777;margin-top:4px;';
        }, function () { if (me === seq) { box.textContent = ''; box.appendChild(el('div', null, 'Aide TP indisponible (serveur MH injoignable).')); } });
    };
    [ix, iy, inn].forEach(function (i) { i.addEventListener('input', function () { clearTimeout(tempo); tempo = setTimeout(calcul, 400); }); });
    calcul();
  }

  function addAggroCol() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var aggro = null, queue = null, running = false, t0 = Date.now();
    var ensure = function () {
      var hr = document.querySelector('#VUE_monstres thead tr');
      if (!hr) return;
      var tard = Date.now() - t0 > 6000; // si la colonne PV n'apparait pas (colonne Niv. du jeu absente...), on se place avant R\u00e9f. sans l'attendre
      var hRef = hr.querySelector('.mhx-pvh') || (tard ? hr.querySelector('.ref') : null);
      if (hRef && !hr.querySelector('.mhx-aggroh')) { // juste apr\u00e8s PV (ou avant R\u00e9f.), donc avant \u00ab R\u00e9f. \u00bb (apr\u00e8s PV, ajout\u00e9 par addMonsterPv)
        var h = document.createElement(hRef.tagName.toLowerCase());
        h.className = 'mhx-aggroh';
        h.textContent = 'Aggro';
        h.style.cssText = 'width: 80px; display: table-cell;';
        hRef.parentNode.insertBefore(h, hRef.classList.contains('ref') ? hRef : hRef.nextSibling);
      }
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.mhx-pvcol') || (tard ? tr.querySelector('td.ref') : null);
        if (!ref || tr.querySelector('td.mhx-aggrocol')) return;
        var td = document.createElement('td');
        td.className = 'mhx-aggrocol';
        td.style.cssText = 'width: 80px; display: table-cell;';
        ref.parentNode.insertBefore(td, ref.classList.contains('ref') ? ref : ref.nextSibling);
      });
    };
    var paint = function () {
      if (!aggro) return;
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var td = tr.querySelector('td.mhx-aggrocol'), ref = tr.querySelector('td.ref');
        if (!td || !ref) return;
        var a = aggro[ref.textContent.trim()];
        var txt = a ? a.nom : '';
        if (td.textContent !== txt) td.textContent = txt;
        td.title = a ? 'Derni\u00e8re cible frapp\u00e9e (' + a.cible + ') le ' + a.date : '';
      });
    };
    var load = function () {
      fetch(AGGRO_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (l) { if (l) { aggro = l; ensure(); paint(); if (!queue) buildQueue(); } }, function () {});
    };
    // Verification en arriere-plan (lecture seule, une page a la fois, 1 a 10 s entre deux) des monstres a distance 0-2, hors
    // gowaps et familiers : d'abord ceux sans info, puis ceux dont le dernier check a plus de 6 h. Rien n'est affiche a l'ecran.
    var buildQueue = function () {
      var me = aggroTroll();
      if (!me || !aggro) return;
      var fresh = [], old = [], seen = {};
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre'), dist = tr.querySelector('td.dist');
        if (!ref || !nom || !dist || /^\s*(?:Gowap Apprivois|Familier)/i.test(nom.textContent)) return;
        var d = parseInt(dist.textContent, 10), id = ref.textContent.trim();
        if (isNaN(d) || d > 2 || seen[id]) return;
        seen[id] = true;
        var a = aggro[id];
        if (!a) fresh.push(id);
        else if (a.age > 6 * 3600) old.push(id);
      });
      queue = fresh.concat(old);
      step(me);
    };
    var step = function (me) {
      if (running || !queue || !queue.length) return;
      running = true;
      var id = queue.shift();
      fetch('/mountyhall/View/MonsterView.php?ai_IDPJ=' + id, { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) {
          if (!buf) return;
          var raw = new TextDecoder('iso-8859-1').decode(buf);
          var doc = new DOMParser().parseFromString(raw, 'text/html');
          var last = aggroLast(doc, raw);
          if (!last) return; // page inattendue (session expiree, erreur...) : rien n'est enregistre
          aggroSend(me, id, last);
          aggro[id] = last.vide ? { cible: 0, nom: '', date: null, age: 0 } : { cible: parseInt(last.cible, 10), nom: last.nom, date: last.date, age: 0 };
          paint();
        })
        .catch(function () { /* ignore */ })
        .then(function () { running = false; setTimeout(function () { step(me); }, 1000 + Math.random() * 9000); });
    };
    ensure();
    load();
    setInterval(function () { ensure(); paint(); }, 2000);
    setInterval(load, 120000);
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
          if (e.duree_tour > 0) { // cumul d'apr\u00e8s (approximatif) = prochaine DLA + une dur\u00e9e de tour
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

  // Page \u00ab Mes commandes \u00bb (Play_e_enchantements.php) : une case par commande pour la suivre dans le suivi des enchantements du site MH.
  // Le texte est lu comme le formulaire du site (objet, boutique X=|Y=|N=, 3 composants). Rien n'est envoy\u00e9 pour une commande non coch\u00e9e.
  var ENCH_URL = 'https://mh.percolouco.com/enchantements/includes/update/sync-commandes.php';
  function addCommandesSync() {
    if (!/\/Play_e_enchantements\.php$/.test(location.pathname) || document.getElementById('mhx-commandes')) return;
    var troll = currentTrollId();
    if (!troll) return;
    var cells = [].slice.call(document.querySelectorAll('td.mh_tdtitre')).filter(function (td) { return /command\u00e9 un enchantement/.test(td.textContent); });
    if (!cells.length) return;
    var orders = cells.map(function (td) {
      var lines = td.innerText.split('\n'), item = '', name = '', shop = '', comps = [], found = false, sect = false;
      lines.forEach(function (l) {
        l = l.trim();
        if (found) { name = l.replace("(vous n'avez pas ce tr\u00e9sor sur vous)", '').replace(/:$/, '').trim(); found = false; return; }
        if (l.indexOf('command\u00e9 un enchantement de :') !== -1 && !name) { found = true; return; }
        if (l.indexOf('X=') !== -1) shop = (l.indexOf(' - ') !== -1 ? l.split(' - ').pop() : l).trim();
        if (l.indexOf("Les Composants demand\u00e9s par l'enchanteur sont :") !== -1) { sect = true; return; }
        if (sect && l) comps.push(l);
      });
      var m = /^\[(\d+)\]/.exec(name);
      if (m) item = m[1];
      return { td: td, key: item + '|' + shop, o: { item: item, name: name, shop: shop, comps: comps } };
    }).filter(function (x) { return x.o.item && x.o.shop && x.o.comps.length >= 3; });
    if (!orders.length) return;
    var marker = document.createElement('span'); marker.id = 'mhx-commandes'; marker.style.display = 'none'; document.body.appendChild(marker);
    var call = function (extra, cb) {
      var body = 'troll=' + encodeURIComponent(troll) + '&orders=' + encodeURIComponent(JSON.stringify(orders.map(function (x) { return x.o; }))) + (extra || '');
      fetch(ENCH_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body, referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.json() : null; }).then(cb, function () { cb(null); });
    };
    var boxes = orders.map(function (x) {
      var lab = document.createElement('label');
      lab.className = 'mhx-cmd-sync'; lab.style.cssText = 'display:block;margin-top:6px;font-size:11px;cursor:pointer';
      var cb = document.createElement('input'); cb.type = 'checkbox'; cb.disabled = true;
      var st = document.createElement('span'); st.textContent = ' Synchroniser avec le suivi des enchantements';
      lab.appendChild(cb); lab.appendChild(st); x.td.appendChild(lab);
      cb.addEventListener('change', function () {
        cb.disabled = true;
        call('&set=' + encodeURIComponent(x.key) + '&sync=' + (cb.checked ? '1' : '0'), function (r) {
          cb.disabled = false;
          if (!r) { cb.checked = !cb.checked; st.textContent = ' Synchronisation impossible (serveur MH)'; return; }
          st.textContent = cb.checked ? ' Synchronis\u00e9e avec le suivi des enchantements' : ' Synchroniser avec le suivi des enchantements';
        });
      });
      return { cb: cb, st: st, key: x.key };
    });
    call('', function (r) {
      // couleur de chaque composant (comme sur le site MH) et lieu o\u00f9 il se trouve (GT / gowap)
      if (r && r.compos) orders.forEach(function (x) {
        var lis = x.td.querySelectorAll('li');
        x.o.comps.forEach(function (c, i) {
          var li = lis[i], d = r.compos[c];
          if (!li || !d || li.querySelector('.mhx-compo')) return;
          var col = { vert: '#046a38', bleu: '#002d72', rouge: '#da291c' }[d.s] || '#da291c';
          var sp = document.createElement('span'); sp.className = 'mhx-compo';
          sp.style.cssText = 'background:' + col + ';color:#fff;padding:1px 5px;border-radius:3px;margin-left:6px;font-size:11px';
          sp.textContent = d.s === 'rouge' ? 'non disponible' : (d.s === 'bleu' ? 'stock : ' + d.qualite + ' ' : '') + '\ud83d\udccd ' + d.lieux.join(', ');
          if (d.res && d.res.length) { // composant en GT reserve au nom du troll : petit cadenas discret a cote du lieu
            var rs = document.createElement('span'); rs.className = 'mhx-compo-res';
            rs.style.cssText = 'font-size:9px;opacity:.7;margin-left:4px;cursor:help';
            rs.textContent = '\ud83d\udd12';
            rs.title = 'R\u00e9serv\u00e9 \u00e0 ton nom en GT : ' + d.res.map(function (x) { return x.q + ' (' + x.l + ')'; }).join(' ; ');
            sp.appendChild(rs);
          }
          li.appendChild(sp);
        });
      });
      boxes.forEach(function (b) {
        b.cb.disabled = !r;
        if (r && r.sync && r.sync[b.key]) { b.cb.checked = true; b.st.textContent = ' Synchronis\u00e9e avec le suivi des enchantements'; }
      });
    });
  }

  // Gowaps de la vue qui ne sont pas dans la liste commune : on lit en arri\u00e8re-plan (lecture seule, une page \u00e0 la fois, 1 \u00e0 10 s entre
  // deux) la page de chaque gowap de la vue (les plus proches d'abord) et on compte ses \u00e9v\u00e9nements \u00ab s'est \u00e9brou\u00e9 \u00bb et \u00ab a ramass\u00e9 un tr\u00e9sor \u00bb. Au moins 3 de chaque :
  // le nom du gowap est soulign\u00e9 en rose. Les lectures sont partag\u00e9es via le serveur MH (gowap_events.php) : gard\u00e9es 6 h pour tous, jamais relues avant.
  var EVENTS_URL = 'https://mh.percolouco.com/gowap/gowap_events.php';
  function addGowapEvents() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var KEY = 'mhx-gwev', TTL = 6 * 3600 * 1000, cache = {}, perks = null, queue = null, running = false, actif = false, fait = false;
    try { cache = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { cache = {}; }
    var save = function () { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* stockage indisponible */ } };
    var rows = function () {
      var out = [];
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre'), dist = tr.querySelector('td.dist');
        if (!ref || !nom || !dist || !/^\s*Gowap Apprivois/i.test(nom.textContent)) return;
        out.push({ id: ref.textContent.trim(), a: nom, d: parseInt(dist.textContent, 10) });
      });
      return out;
    };
    var paint = function () {
      rows().forEach(function (r) {
        var c = cache[r.id], rose = !!c && c[1] >= 3 && c[2] >= 3 && !(perks && perks[r.id]);
        r.a.classList.toggle('mhx-gw-rose', rose);
        var tr = r.a.closest('tr');
        if (tr) tr.classList.toggle('mhx-gw-rose-row', rose);
        var t = rose ? '\u00c9brou\u00e9 ' + c[1] + ' fois, a ramass\u00e9 un tr\u00e9sor ' + c[2] + ' fois' : '';
        if (rose) r.a.title = t; else if (r.a.title && /^\u00c9brou\u00e9 \d+ fois/.test(r.a.title)) r.a.title = '';
      });
    };
    var step = function () {
      if (running || !actif) return;
      if (!queue || !queue.length) { actif = false; majBtn(); return; }
      running = true;
      var id = queue.shift();
      fetch('/mountyhall/View/MonsterView.php?ai_IDPJ=' + id, { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) {
          if (!buf) return;
          var raw = new TextDecoder('iso-8859-1').decode(buf);
          var ev = aggroEvents(new DOMParser().parseFromString(raw, 'text/html'), raw);
          if (!ev) return; // page inattendue (session expir\u00e9e, erreur...) : rien n'est m\u00e9moris\u00e9
          var eb = 0, ra = 0;
          ev.forEach(function (e) {
            var d = e.descr.replace(/[\s\u00a0]+/g, ' ');
            if (/s.est \u00e9brou\u00e9/i.test(d)) eb++;
            else if (/a ramass\u00e9 un tr\u00e9sor/i.test(d)) ra++;
          });
          cache[id] = [Date.now(), eb, ra];
          save(); paint();
          mhdPost(EVENTS_URL, 'id=' + id + '&eb=' + eb + '&ra=' + ra, function () {});
        })
        .catch(function () { /* ignore */ })
        .then(function () { running = false; majBtn(); setTimeout(step, 1000 + Math.random() * 9000); });
    };
    // Bouton \u00ab Lancer la recherche \u00bb : les lectures ne d\u00e9marrent que sur clic (grosses vues = des centaines de pages, \u00e0 1-10 s l'une)
    var btn = null, info = null, btnF = null, filtre = false;
    try { filtre = localStorage.getItem('mhx-gw-filtre') === '1'; } catch (e) { /* stockage indisponible */ }
    // Filtre \u00ab gowaps ramasseurs \u00bb : ne garde que les lignes roses du tableau des monstres (m\u00eame bouton que les filtres de tr\u00e9sors)
    var appliqueFiltre = function () {
      if (btnF) { btnF.classList.toggle('mhx-actif', filtre); }
      var n = 0;
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        if (!tr.querySelector('td.ref')) return;
        var rose = tr.classList.contains('mhx-gw-rose-row');
        if (rose) n++;
        tr.classList.toggle('mhx-gwfiltre-cache', filtre && !rose);
      });
      if (btnF) btnF.title = filtre ? n + ' gowap(s) ramasseur(s) affich\u00e9(s)' : 'Ne garder que les lignes roses (gowaps ramasseurs)';
    };
    var majBtn = function () {
      if (!btn) return;
      btn.textContent = actif ? 'Arr\u00eater la recherche' : 'Lancer la recherche des gowaps (\u00e9brouements / tr\u00e9sors)';
      info.textContent = actif ? (queue ? queue.length : 0) + ' gowap(s) \u00e0 lire' + (running ? '...' : '') : (queue && !queue.length && fait ? 'Recherche termin\u00e9e.' : '');
    };
    var ensureBtn = function () {
      var table = document.getElementById('VUE_monstres');
      if (!table || !table.parentNode || document.getElementById('mhx-gwsearch')) return;
      var box = document.createElement('div');
      box.id = 'mhx-gwsearch'; box.style.cssText = 'margin:6px 0';
      btn = document.createElement('button'); btn.type = 'button'; btn.className = 'mh_form_submit mhx-tfiltre';
      info = document.createElement('span'); info.style.cssText = 'margin-left:8px;font-size:11px';
      btn.addEventListener('click', function () {
        if (actif) { actif = false; majBtn(); return; }
        if (!perks) return;
        var now = Date.now(), seen = {};
        queue = rows().filter(function (r) {
          if (perks[r.id] || seen[r.id]) return false;
          seen[r.id] = true;
          return !cache[r.id] || now - cache[r.id][0] > TTL;
        }).sort(function (a, b) { return (isNaN(a.d) ? 99 : a.d) - (isNaN(b.d) ? 99 : b.d); }).map(function (r) { return r.id; }); // les plus proches d'abord
        actif = true; fait = true; majBtn(); step();
      });
      btnF = document.createElement('button'); btnF.type = 'button'; btnF.className = 'mh_form_submit mhx-tfiltre'; btnF.style.marginLeft = '6px';
      btnF.textContent = 'Filtrer sur les gowaps ramasseurs';
      btnF.addEventListener('click', function () { filtre = !filtre; try { localStorage.setItem('mhx-gw-filtre', filtre ? '1' : '0'); } catch (e) { /* ignore */ } appliqueFiltre(); });
      box.appendChild(btn); box.appendChild(btnF); box.appendChild(info);
      table.parentNode.insertBefore(box, table);
      majBtn();
    };
    // lectures partag\u00e9es par le serveur MH (fra\u00eeches de moins de 6 h : rien n'est relu) ; le navigateur ne sert que de repli
    fetch(EVENTS_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (srv) {
        if (srv) Object.keys(srv).forEach(function (id) {
          var t = Date.now() - srv[id][0] * 1000;
          if (!cache[id] || cache[id][0] < t) cache[id] = [t, srv[id][1], srv[id][2]];
        });
        // lectures d\u00e9j\u00e0 faites dans ce navigateur (avant le partage) et inconnues du serveur : on les lui envoie, \u00e0 petit rythme
        if (srv) {
          var aEnvoyer = Object.keys(cache).filter(function (id) { return !srv[id] && Date.now() - cache[id][0] < TTL; }).slice(0, 300);
          var envoi = function () {
            var id = aEnvoyer.shift();
            if (!id) return;
            mhdPost(EVENTS_URL, 'id=' + id + '&eb=' + cache[id][1] + '&ra=' + cache[id][2], function () { setTimeout(envoi, 300); });
          };
          envoi();
        }
        perksCall('', function (list) {
          if (!list) return;
          perks = list;
        });
      });
    setInterval(function () { ensureBtn(); paint(); appliqueFiltre(); }, 2000); // le tableau est retravaill\u00e9 apr\u00e8s le chargement
  }

  // Page \u00ab Ma vue \u00bb : destination des Portails de T\u00e9l\u00e9portation connus (relev\u00e9e dans le r\u00e9sultat du sortil\u00e8ge, stock\u00e9e sur le serveur MH),
  // ajout\u00e9e apr\u00e8s le nom du portail dans le tableau des lieux. Lecture / affichage uniquement.
  var PORTAILS_URL = 'https://mh.percolouco.com/notif/portails.php';
  var TP_RAYON = 5; // rayon (en cases) de l'alerte sur les sorties de TP qui ne sont pas du groupe
  function addPortailDest() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var map = null;
    var sg = function (a) { return a >= 0 ? '+' + a : String(a); };
    var age = function (p) { return p.age >= 86400 ? Math.floor(p.age / 86400) + ' j' : Math.max(1, Math.floor(p.age / 3600)) + ' h'; };
    // la sortie est connue si elle est sur la destination d'un TP du groupe, avec ou sans l'erreur de calcul
    var trouveTp = function (x, y, n) {
      for (var id in map) {
        var p = map[id];
        if (p.d[2] !== n && p.d[2] + p.e[2] !== n) continue;
        if ((p.d[0] === x && p.d[1] === y) || (p.d[0] + p.e[0] === x && p.d[1] + p.e[1] === y)) return p;
      }
      return null;
    };
    var paint = function () {
      if (!map) return;
      var inconnus = [];
      document.querySelectorAll('#VUE_lieux tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = ref && ref.nextElementSibling;
        if (!ref || !nom) return;
        var txt = nom.textContent.replace(/[\s\u00a0]+/g, ' ').trim();
        var p = map[ref.textContent.trim()];
        if (/^Portail de T/i.test(txt)) { // portail cr\u00e9\u00e9 par le groupe : destination apr\u00e8s le nom
          if (!p || nom.querySelector('.mhx-portail')) return;
          var sp = document.createElement('span'); sp.className = 'mhx-portail';
          sp.textContent = ' \u2192 X=' + p.d[0] + ' Y=' + p.d[1] + ' N=' + p.d[2];
          sp.title = 'Destination du portail (erreur de calcul : X=' + sg(p.e[0]) + ' Y=' + sg(p.e[1]) + ' N=' + sg(p.e[2]) + ') \u2014 cr\u00e9\u00e9 par le troll ' + p.troll + ' il y a ' + age(p);
          nom.appendChild(sp);
          return;
        }
        if (!/^Sortie de Portail/i.test(txt) || !feat('vue_portails_sorties')) return;
        var cx = tr.querySelector('td.x'), cy = tr.querySelector('td.y'), cn = tr.querySelector('td.n');
        var x = cx ? parseInt(cx.textContent, 10) : NaN, y = cy ? parseInt(cy.textContent, 10) : NaN, n = cn ? parseInt(cn.textContent, 10) : NaN;
        if (isNaN(x + y + n)) return;
        var tp = trouveTp(x, y, n);
        if (tp) { // arriv\u00e9e d'un TP du groupe : ligne verte
          tr.classList.add('mhx-sortie-ok'); tr.classList.remove('mhx-sortie-ko');
          if (!nom.querySelector('.mhx-sortie-lib')) {
            var l = document.createElement('span'); l.className = 'mhx-sortie-lib'; l.textContent = ' \u2014 Sortie de TP fait par le groupe';
            l.title = 'Portail n\u00b0' + (Object.keys(map).filter(function (k) { return map[k] === tp; })[0] || '?') + ' cr\u00e9\u00e9 par le troll ' + tp.troll + ' il y a ' + age(tp);
            nom.appendChild(l);
          }
          return;
        }
        var dc = tr.querySelector('td.dist'), dist = dc ? parseInt(dc.textContent, 10) : NaN;
        if (isNaN(dist) || dist > TP_RAYON) return;
        tr.classList.add('mhx-sortie-ko'); tr.classList.remove('mhx-sortie-ok');
        inconnus.push({ ref: ref.textContent.trim(), dist: dist, x: x, y: y, n: n });
        if (!nom.querySelector('.mhx-sortie-lib')) {
          var r = document.createElement('span'); r.className = 'mhx-sortie-lib'; r.textContent = ' \u2014 \u26a0 Sortie de TP pas du groupe (\u00e0 ' + dist + ' case' + (dist > 1 ? 's' : '') + ')';
          nom.appendChild(r);
        }
      });
      var troll = currentTrollId();
      if (troll) { try { localStorage.setItem('mhx-tp-alerte-' + troll, JSON.stringify({ t: Date.now(), l: inconnus })); } catch (e) { /* stockage indisponible */ } }
    };
    fetch(PORTAILS_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (m) { map = m; paint(); setInterval(paint, 2000); }); // le tableau est retravaill\u00e9 apr\u00e8s le chargement
  }

  // Page de connexion (TurnStart.php) : alerte si la derni\u00e8re vue relev\u00e9e montrait une sortie de TP pas du groupe \u00e0 moins de TP_RAYON cases.
  // Lecture / affichage uniquement (donn\u00e9e m\u00e9moris\u00e9e par addPortailDest sur Ma vue, valable 2 h).
  function addTpAlerte() {
    if (!/\/TurnStart\.php$/.test(location.pathname) || !document.body || document.getElementById('mhx-tp-alerte')) return;
    var troll = currentTrollId(), d = null;
    try { d = JSON.parse(localStorage.getItem('mhx-tp-alerte-' + troll) || 'null'); } catch (e) { d = null; }
    if (!d || !d.l || !d.l.length || Date.now() - d.t > 7200000) return;
    var box = document.createElement('div'); box.id = 'mhx-tp-alerte';
    box.textContent = '\u26a0 Attention : sortie de TP pas du groupe \u00e0 moins de ' + TP_RAYON + ' cases \u2014 ' + d.l.map(function (q) {
      return 'sortie ' + q.ref + ' en X=' + q.x + ' Y=' + q.y + ' N=' + q.n + ' (' + q.dist + ' case' + (q.dist > 1 ? 's' : '') + ')';
    }).join(', ');
    var h = document.querySelector('h1, h2, h3');
    if (h && h.parentNode) h.parentNode.insertBefore(box, h.nextSibling); else document.body.insertBefore(box, document.body.firstChild);
  }

  // Page Ma vue : monstres hypnotis\u00e9s (Hypnotisme lu par le proxy, stock\u00e9 sur le serveur MH) : ligne violette + picto apr\u00e8s le nom.
  // Le monstre redevient normal d\u00e8s qu'il a jou\u00e9 : sa page est relue en arri\u00e8re-plan (lecture seule, comme l'aggro) \u00e0 chaque ouverture
  // de la vue et, s'il a un \u00e9v\u00e9nement de sa part apr\u00e8s l'hypnotisme, l'hypno est marqu\u00e9e termin\u00e9e sur le serveur.
  var HYPNO_URL = 'https://mh.percolouco.com/notif/hypno.php';
  function addHypnoVue() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var hyp = null, checked = {}, running = false;
    var paint = function () {
      if (!hyp) return;
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre');
        if (!ref || !nom) return;
        var h = hyp[ref.textContent.trim()], pic = tr.querySelector('.mhx-hypno-pic');
        if (!h) { tr.classList.remove('mhx-hypno'); if (pic) pic.parentNode.removeChild(pic); return; }
        tr.classList.add('mhx-hypno');
        if (!pic) {
          pic = document.createElement('span'); pic.className = 'mhx-hypno-pic'; pic.textContent = ' \ud83d\ude34';
          nom.parentNode.insertBefore(pic, nom.nextSibling);
        }
        pic.title = 'Hypnotis\u00e9 depuis ' + h.depuis + ' \u2014 jusqu\'\u00e0 son prochain tour';
      });
    };
    var iso = function (d) { var m = /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})/.exec(d); return m ? m[3] + '-' + m[2] + '-' + m[1] + ' ' + m[4] : ''; };
    var queue = [];
    var step = function (me) {
      if (running || !queue.length) return;
      running = true;
      var id = queue.shift();
      fetch('/mountyhall/View/MonsterView.php?ai_IDPJ=' + id, { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) {
          if (!buf) return;
          var raw = new TextDecoder('iso-8859-1').decode(buf);
          var evts = aggroEvents(new DOMParser().parseFromString(raw, 'text/html'), raw);
          if (!evts) return; // page inattendue : on ne touche \u00e0 rien
          var re = new RegExp('^\\s*(?:un|une)\\s.*?\\(\\s*' + id + '\\s*\\)');
          var joue = evts.some(function (e) { // \u00e9v\u00e9nement du monstre lui-m\u00eame, apr\u00e8s l'hypno (hors \u00ab a \u00e9t\u00e9 influenc\u00e9 / hypnotis\u00e9 \u00bb)
            var t = e.descr.replace(/[\s\u00a0]+/g, ' ');
            return re.test(t) && !/influenc|hypnot|a \u00e9t\u00e9/i.test(t) && iso(e.date) > hyp[id].depuis;
          });
          if (joue) {
            mhdPost(HYPNO_URL, 'action=clear&troll=' + me + '&monstre=' + id, function () {});
            delete hyp[id]; paint();
          }
        })
        .catch(function () { /* ignore */ })
        .then(function () { running = false; setTimeout(function () { step(me); }, 1000 + Math.random() * 4000); });
    };
    var load = function () {
      fetch(HYPNO_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (l) {
        if (!l) return;
        hyp = l; paint();
        var me = aggroTroll();
        if (!me) return;
        document.querySelectorAll('#VUE_monstres tbody tr td.ref').forEach(function (td) {
          var id = td.textContent.trim();
          if (hyp[id] && !checked[id]) { checked[id] = true; queue.push(id); }
        });
        step(me);
      }, function () {});
    };
    load();
    setInterval(paint, 2000);
    setInterval(function () { checked = {}; load(); }, 300000);
  }

  // ===== Gestion de la chasse (Ma vue) : cibles prioritaires (5 max) et positions de chasse (3 max), partagées par tout le groupe =====
  // Stockées sur le serveur MH (notif/chasse.php). Les cibles sont colorées dans la vue de chaque membre et retirées à leur mort ;
  // pour chaque position, les monstres à 10 cases ou moins sont ceux de la dernière observation (vues de l'IT, ou Ma vue d'un membre qui couvre la zone).
  // Lecture / affichage seulement : rien n'est envoyé au jeu.
  var CHASSE_URL = 'https://mh.percolouco.com/notif/chasse.php';
  var CHASSE_RAYON = 10;
  function chassePost(body, cb) {
    var me = aggroTroll();
    if (!me) { if (cb) cb(null); return; }
    fetch(CHASSE_URL, { method: 'POST', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: 'troll=' + me + '&' + body })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { if (cb) cb(j || {}); }, function () { if (cb) cb(null); });
  }
  function addChasse() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var data = { cibles: [], positions: [] }, t0 = Date.now(), box = null, body = null, msg = null, ouvertes = {}, observe = {}, fileMort = [], verifie = false;
    var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    // derni\u00e8re position connue d'une cible : ma vue actuelle d'abord, sinon la derni\u00e8re observation d'une position de chasse
    var positionCible = function (id) {
      var sid = String(id), vu = null;
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), x = tr.querySelector('td.x'), y = tr.querySelector('td.y'), n = tr.querySelector('td.n');
        if (ref && x && y && n && ref.textContent.trim() === sid) vu = { x: parseInt(x.textContent, 10), y: parseInt(y.textContent, 10), n: parseInt(n.textContent, 10), t: 'maintenant' };
      });
      if (!vu) data.positions.forEach(function (p) {
        (p.monstres || []).forEach(function (m) {
          if (String(m.id) === sid && p.obs && (!vu || p.obs > vu.o)) vu = { x: m.x, y: m.y, n: m.n, o: p.obs, t: 'vu le ' + p.obs.replace(/^(\d+)-(\d+)-(\d+) (\d+:\d+).*$/, '$3/$2 $4') };
        });
      });
      return vu ? ' \u2014 X=' + vu.x + ' Y=' + vu.y + ' N=' + vu.n + ' (' + vu.t + ')' : ' \u2014 position inconnue';
    };
    var ensure = function () {
      if (box && box.parentNode) return true;
      var cible = document.getElementById('monstres');
      if (!cible || !cible.parentNode) return false;
      box = el('details'); box.id = 'mhx-chasse'; // repli\u00e9 par d\u00e9faut
      var sm = el('summary', null, 'Gestion de la chasse'); box.appendChild(sm);
      body = el('div', 'mhx-chasse-corps'); box.appendChild(body);
      cible.parentNode.insertBefore(box, cible);
      return true;
    };
    var champ = function (ph, w) { var i = el('input'); i.type = 'text'; i.placeholder = ph; i.size = w; i.className = 'mhx-chasse-in'; return i; };
    var bouton = function (txt, titre, fn) { var b = el('button', 'mh_form_submit mhx-chasse-btn', txt); b.type = 'button'; if (titre) b.title = titre; b.addEventListener('click', fn); return b; };
    var erreur = function (j) { msg.textContent = j && j.error ? j.error : (j ? '' : 'Serveur injoignable.'); };
    var itLien = function (p) {
      var me = aggroTroll();
      return 'https://mh.percolouco.com/vue_2d/vue_2d.php?view_id=' + (me || '') + '&origin_x=' + p.x + '&origin_y=' + p.y + '&origin_n=' + p.n + '&portee=' + CHASSE_RAYON;
    };
    var render = function () {
      if (!ensure()) return;
      body.textContent = '';
      msg = el('div', 'mhx-chasse-msg');
      // --- cibles
      body.appendChild(el('h4', null, '\ud83c\udfaf Cibles prioritaires (' + data.cibles.length + '/5)'));
      var ul = el('div', 'mhx-chasse-liste');
      if (!data.cibles.length) ul.appendChild(el('div', 'mhx-chasse-vide', 'Aucune cible.'));
      data.cibles.forEach(function (c) {
        var l = el('div', 'mhx-chasse-ligne');
        l.appendChild(el('span', null, '[' + c.monstre + '] ' + (c.nom || 'monstre') + positionCible(c.monstre)));
        l.appendChild(bouton('\u2716', 'Retirer cette cible', function () { chassePost('action=cible_del&monstre=' + c.monstre, function (j) { erreur(j); load(); }); }));
        ul.appendChild(l);
      });
      body.appendChild(ul);
      var fc = el('div', 'mhx-chasse-form'), ic = champ('ID du monstre', 12);
      fc.appendChild(ic);
      fc.appendChild(bouton('Ajouter la cible', '', function () {
        var v = ic.value.trim().replace(/^\[|\]$/g, '');
        if (!/^\d+$/.test(v)) { msg.textContent = 'ID de monstre invalide.'; return; }
        var nom = '';
        document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) { var r = tr.querySelector('td.ref'), a = tr.querySelector('td a.monstre'); if (r && a && r.textContent.trim() === v) nom = a.textContent.trim(); });
        chassePost('action=cible_add&monstre=' + v + (nom ? '&nom=' + encodeURIComponent(nom) : ''), function (j) { erreur(j); if (j && j.ok) ic.value = ''; load(); });
      }));
      body.appendChild(fc);
      // --- positions
      body.appendChild(el('h4', null, '\ud83d\udccd Positions de chasse (' + data.positions.length + '/3)'));
      if (!data.positions.length) body.appendChild(el('div', 'mhx-chasse-vide', 'Aucune position.'));
      data.positions.forEach(function (p) {
        var d = el('details', 'mhx-chasse-pos'); d.open = !!ouvertes[p.id];
        d.addEventListener('toggle', function () { ouvertes[p.id] = d.open; });
        var dist = function (m) { return Math.max(Math.abs(m.x - p.x), Math.abs(m.y - p.y), Math.abs(m.n - p.n)); };
        var rcle = 'mhx-chasse-rayon-' + p.id, rayon = CHASSE_RAYON;
        try { rayon = parseInt(localStorage.getItem(rcle) || String(CHASSE_RAYON), 10) === 5 ? 5 : CHASSE_RAYON; } catch (e) { rayon = CHASSE_RAYON; }
        var visibles = p.monstres.filter(function (m) { return dist(m) <= rayon; });
        var sm = el('summary', null, 'X=' + p.x + ' Y=' + p.y + ' N=' + p.n + ' \u2014 ' + visibles.length + ' monstre' + (visibles.length > 1 ? 's' : '') + ' \u00e0 ' + rayon + ' cases ou moins' + (p.obs ? ' (observ\u00e9 le ' + p.obs.replace(/^(\d+)-(\d+)-(\d+) (\d+:\d+).*$/, '$3/$2 $4') + ')' : ''));
        d.appendChild(sm);
        var actions = el('div', 'mhx-chasse-ligne');
        var a = el('a', null, '\ud83d\uddfa\ufe0f Ouvrir dans l\'IT'); a.href = itLien(p); a.target = '_blank'; a.rel = 'noopener';
        actions.appendChild(a);
        var sel = el('select', 'mhx-chasse-in'); sel.title = 'Rayon autour de la position';
        [5, CHASSE_RAYON].forEach(function (r) { var o = el('option', null, r + ' cases'); o.value = String(r); if (r === rayon) o.selected = true; sel.appendChild(o); });
        sel.addEventListener('change', function () { try { localStorage.setItem(rcle, sel.value); } catch (e) { /* stockage indisponible */ } ouvertes[p.id] = true; render(); });
        actions.appendChild(sel);
        actions.appendChild(bouton('\u2716 Supprimer la position', '', function () { chassePost('action=pos_del&id=' + p.id, function (j) { erreur(j); load(); }); }));
        d.appendChild(actions);
        var mons = visibles.slice().sort(function (m1, m2) { return (m2.star - m1.star) || (dist(m1) - dist(m2)); });
        if (mons.length) {
          var tb = el('table', 'mhx-chasse-tab'), th = el('thead'), trh = el('tr');
          ['\u2b50', 'N\u00b0', 'Nom', 'X', 'Y', 'N', 'Dist.'].forEach(function (h) { trh.appendChild(el('th', null, h)); });
          th.appendChild(trh); tb.appendChild(th);
          var tbody = el('tbody');
          mons.forEach(function (m) {
            var tr = el('tr', m.star ? 'mhx-chasse-star' : '');
            var td0 = el('td'), st = el('button', 'mhx-chasse-etoile', m.star ? '\u2b50' : '\u2606'); st.type = 'button'; st.title = 'Mettre en avant / retirer la mise en avant';
            st.addEventListener('click', function () { chassePost('action=star&id=' + p.id + '&monstre=' + m.id, function (j) { erreur(j); load(); }); });
            td0.appendChild(st); tr.appendChild(td0);
            tr.appendChild(el('td', 'mhx-c', String(m.id)));
            tr.appendChild(el('td', null, m.nom || 'monstre'));
            tr.appendChild(el('td', 'mhx-c', String(m.x))); tr.appendChild(el('td', 'mhx-c', String(m.y))); tr.appendChild(el('td', 'mhx-c', String(m.n)));
            tr.appendChild(el('td', 'mhx-c', String(dist(m))));
            tbody.appendChild(tr);
          });
          tb.appendChild(tbody); d.appendChild(tb);
        } else d.appendChild(el('div', 'mhx-chasse-vide', 'Aucun monstre dans ce rayon.'));
        body.appendChild(d);
      });
      var fp = el('div', 'mhx-chasse-form'), ix = champ('X', 5), iy = champ('Y', 5), inn = champ('N', 5);
      fp.appendChild(ix); fp.appendChild(iy); fp.appendChild(inn);
      fp.appendChild(bouton('Ajouter la position', '', function () {
        var v = [ix.value, iy.value, inn.value].map(function (t) { return t.trim(); });
        if (!v.every(function (t) { return /^-?\d+$/.test(t); })) { msg.textContent = 'Coordonn\u00e9es invalides.'; return; }
        chassePost('action=pos_add&x=' + v[0] + '&y=' + v[1] + '&n=' + v[2], function (j) { erreur(j); if (j && j.ok) { ix.value = iy.value = inn.value = ''; } load(); });
      }));
      body.appendChild(fp);
      body.appendChild(msg);
    };
    var load = function () {
      fetch(CHASSE_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.cibles) return;
        var ancien = JSON.stringify(data);
        data = j;
        if (JSON.stringify(data) !== ancien || !box) render();
        paint();
        if (!verifie) { verifie = true; fileMort = data.cibles.map(function (c) { return c.monstre; }); suiteMort(); }
        planObs();
      }, function () {});
    };
    // cibles : ligne colorée + picto dans la vue
    var paint = function () {
      var ids = {};
      data.cibles.forEach(function (c) { ids[String(c.monstre)] = c; });
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = tr.querySelector('td a.monstre');
        if (!ref || !nom) return;
        var c = ids[ref.textContent.trim()], pic = tr.querySelector('.mhx-cible-pic');
        if (!c) { tr.classList.remove('mhx-cible'); if (pic) pic.parentNode.removeChild(pic); return; }
        tr.classList.add('mhx-cible');
        if (!pic) { pic = el('span', 'mhx-cible-pic', ' \ud83c\udfaf'); pic.title = 'Cible prioritaire du groupe'; nom.parentNode.insertBefore(pic, nom.nextSibling); }
      });
    };
    // mort : la page du monstre dit « Ce Monstre n'existe pas ou a été Tué » (relue en arrière-plan, au plus une fois par 10 min et par cible)
    var suiteMort = function () {
      if (!fileMort.length) return;
      var id = fileMort.shift(), cle = 'mhx-chasse-chk-' + id, last = 0;
      try { last = parseInt(localStorage.getItem(cle) || '0', 10) || 0; } catch (e) { last = 0; }
      if (Date.now() - last < 600000) return suiteMort();
      try { localStorage.setItem(cle, String(Date.now())); } catch (e) { /* stockage indisponible */ }
      fetch('/mountyhall/View/MonsterView.php?ai_IDPJ=' + id, { credentials: 'same-origin', referrerPolicy: 'no-referrer' })
        .then(function (r) { return r.ok ? r.arrayBuffer() : null; })
        .then(function (buf) {
          if (!buf) return;
          var txt = new TextDecoder('iso-8859-1').decode(buf);
          if (/n.existe pas ou a .{1,8}t.{1,8} Tu/i.test(txt) && txt.length < 5000) chassePost('action=cible_del&monstre=' + id, function () { load(); });
        })
        .catch(function () { /* ignore */ })
        .then(function () { setTimeout(suiteMort, 1000 + Math.random() * 4000); });
    };
    // observation : si ma vue couvre toute la zone (rayon 10) d'une position, la liste de ses monstres est remplacée par ce que je vois
    var planObs = function () {
      if (!data.positions.length) return;
      setTimeout(function () { observer(); }, Math.max(0, 8000 - (Date.now() - t0)));
    };
    var observer = function () {
      var txt = (document.body ? document.body.textContent : '').replace(/[\s\u00a0]+/g, ' ');
      var mp = /Ma position actuelle est\s*:\s*X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/.exec(txt);
      var mv = /vue porte actuellement \u00e0\s*(\d+) cases horizontalement et (\d+) verticalement/i.exec(txt);
      if (!mp || !mv) return;
      var me = { x: +mp[1], y: +mp[2], n: +mp[3] }, h = +mv[1], v = +mv[2];
      var rows = [];
      document.querySelectorAll('#VUE_monstres tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), a = tr.querySelector('td a.monstre'), x = tr.querySelector('td.x'), y = tr.querySelector('td.y'), n = tr.querySelector('td.n');
        if (!ref || !a || !x || !y || !n || /^\s*(?:Gowap Apprivois|Familier)/i.test(a.textContent)) return;
        rows.push({ id: ref.textContent.trim(), nom: a.textContent.replace(/[\s\u00a0]+/g, ' ').trim(), x: parseInt(x.textContent, 10), y: parseInt(y.textContent, 10), n: parseInt(n.textContent, 10) });
      });
      if (!rows.length) return; // vue pas encore remplie : on ne vide rien
      data.positions.forEach(function (p) {
        if (observe[p.id] && Date.now() - observe[p.id] < 300000) return;
        if (Math.abs(p.x - me.x) + CHASSE_RAYON > h || Math.abs(p.y - me.y) + CHASSE_RAYON > h || Math.abs(p.n - me.n) + CHASSE_RAYON > v) return; // zone pas enti\u00e8rement dans ma vue
        observe[p.id] = Date.now();
        var l = rows.filter(function (m) { return Math.abs(m.x - p.x) <= CHASSE_RAYON && Math.abs(m.y - p.y) <= CHASSE_RAYON && Math.abs(m.n - p.n) <= CHASSE_RAYON; });
        chassePost('action=pos_obs&id=' + p.id + '&data=' + encodeURIComponent(JSON.stringify(l)), function () { load(); });
      });
    };
    var essai = 0;
    (function attend() { if (ensure() || ++essai > 20) { render(); load(); } else setTimeout(attend, 500); })();
    setInterval(paint, 2000);
    setInterval(load, 60000);
  }

  // Page \u00ab Ma vue \u00bb : nom r\u00e9el des tr\u00e9sors d\u00e9j\u00e0 identifi\u00e9s (sort Identification des Tr\u00e9sors, lu dans les mails de la bo\u00eete MH par le serveur),
  // affich\u00e9 apr\u00e8s le nom g\u00e9n\u00e9rique ; les effets en infobulle. Lecture / affichage uniquement.
  var IDENT_URL = 'https://mh.percolouco.com/evenements/api.php?tresors=';
  function addTresorsIdent() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var known = {}, asked = {};
    var rows = function () {
      var out = [];
      document.querySelectorAll('#VUE_tresors tbody tr').forEach(function (tr) {
        var ref = tr.querySelector('td.ref'), nom = ref && ref.nextElementSibling;
        if (ref && nom && /^\d+$/.test(ref.textContent.trim())) out.push({ id: ref.textContent.trim(), nom: nom });
      });
      return out;
    };
    var paint = function () {
      rows().forEach(function (r) {
        var d = known[r.id];
        if (!d || r.nom.querySelector('.mhx-ident')) return;
        var sp = document.createElement('span'); sp.className = 'mhx-ident';
        sp.textContent = ' \u2192 ' + d.nom;
        sp.title = (d.effets || 'Identifi\u00e9') + (d.le ? ' (identifi\u00e9 le ' + d.le.slice(8, 10) + '/' + d.le.slice(5, 7) + ')' : '');
        r.nom.appendChild(sp);
      });
    };
    var load = function () {
      var todo = rows().map(function (r) { return r.id; }).filter(function (id) { return !asked[id]; });
      if (!todo.length) return;
      var chunk = todo.slice(0, 200); // 300 identifiants maximum par appel serveur ; le reste au passage suivant
      chunk.forEach(function (id) { asked[id] = true; });
      fetch(IDENT_URL + chunk.join(','), { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
        .then(function (m) { if (m) { Object.keys(m).forEach(function (k) { known[k] = m[k]; }); paint(); } });
    };
    setInterval(function () { load(); paint(); }, 2000); // le tableau est retravaill\u00e9 apr\u00e8s le chargement
  }

  // Pages monstre / troll (MonsterView, PJView) : d\u00e9tail des lignes COMBAT du tableau des \u00e9v\u00e9nements (jets, r\u00e9sultat, d\u00e9g\u00e2ts...), tir\u00e9 des mails de
  // notification analys\u00e9s par le serveur MH (evenements/api.php?combats=). Une ligne est reli\u00e9e \u00e0 un mail par la m\u00eame date (\u00b12 s) et les deux
  // num\u00e9ros (acteur, cible) pr\u00e9sents dans sa description. Lecture / affichage uniquement.
  var COMBATS_URL = 'https://mh.percolouco.com/evenements/api.php?combats=';
  function addEventDetails() {
    if (!/\/(MonsterView|PJView|PJView_Events)\.php$/.test(location.pathname)) return;
    var id = (/[?&]ai_IDPJ=(\d+)/.exec(location.search) || [])[1];
    if (!id) return;
    var evs = null, cdms = null;
    var epoch = function (d, t) { return Date.UTC(+d[3], +d[2] - 1, +d[1], +t[1], +t[2], +t[3]) / 1000; };
    var KEY = 'mhx-ev-reecrit', show = true;
    try { show = localStorage.getItem(KEY) !== 'no'; } catch (e) { /* stockage indisponible */ }
    // phrase r\u00e9\u00e9crite comme SCIZ (sciz_format.yaml, battleEvent) :
    //   [MORT - ]Type [esquiv\u00e9(e) [parfaitement]] [critique] [r\u00e9sist\u00e9(e)] de ATTAQUANT sur D\u00c9FENSEUR : -NPV soin +N (reste NPV) (att A esq E deg D arm M resi R sr S (px +N))
    // esquiv\u00e9 / parfaitement / critique / r\u00e9sist\u00e9 sont d\u00e9duits des jets comme dans SCIZ ; les noms sont des liens (monstre ou troll)
    var esc = function (x) { return String(x).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var etre = function (nom, id) {
      var n = esc(String(nom || '?').replace(/^une?\s/i, ''));
      return String(id).length > 6 ? '<b><a href="/mountyhall/View/MonsterView.php?ai_IDPJ=' + id + '" class="monstre">' + n + '</a></b>'
        : '<b><a href="javascript:PVT(\'' + id + '\')" class="troll">' + n + '</a></b>';
    };
    var phrase = function (e) {
      if (e.kind === 'sort' || e.kind === 'competence') {
        var dd = e.detail || {}, ss = esc(dd.nom || e.sujet) + ' de ' + etre(e.actor_nom, e.actor_id) + (e.target_id ? ' sur ' + etre(e.target_nom, e.target_id) : '');
        var im = [];
        if (dd.pv_perdus != null) im.push('-' + dd.pv_perdus + 'PV'); else if (e.degats != null) im.push('-' + e.degats + 'PV');
        if (dd.soin != null) im.push('soin +' + dd.soin);
        if (dd.vie != null && dd.vie > 0) im.push('(reste ' + dd.vie + 'PV)');
        if (im.length) ss += ' : ' + im.join(' ');
        return ss + (e.px != null ? ' (px +' + e.px + ')' : '');
      }
      var d = e.detail || {}, att = d.jet_att != null ? d.jet_att : d.destab, esq = d.jet_esq != null ? d.jet_esq : d.stab, resi = d.jet_res, sr = d.seuil_res, pv = e.degats;
      var bal = d.jet_att == null && d.destab != null;
      var typ = String(d.type || 'Attaque').replace(/\b(critique|mortelle?|esquiv\u00e9e|parfaitement|r\u00e9sist\u00e9e|par\u00e9e)\b/gi, '').replace(/\s+/g, ' ').trim();
      var vie = d.vie != null ? d.vie : null;
      var mort = d.mortel || (vie !== null && vie <= 0);
      var esquive = att != null && esq != null && esq >= att, parfaite = esquive && esq > att * 2;
      var crit = att != null && esq != null && att > esq * 2;
      var resiste = /r\u00e9sist\u00e9e/i.test(d.type || '') || (resi != null && sr != null && resi <= sr);
      var s = (mort ? 'MORT - ' : '') + esc(typ) + [esquive ? ' esquiv\u00e9(e)' : '', parfaite ? ' parfaitement' : '', crit ? ' critique' : '', resiste ? ' r\u00e9sist\u00e9(e)' : ''].join('') +
        ' de ' + etre(e.actor_nom, e.actor_id) + ' sur ' + etre(e.target_nom, e.target_id);
      var imp = [];
      if (pv != null) imp.push('-' + pv + 'PV');
      if (d.pv_gagnes != null) imp.push('soin +' + d.pv_gagnes);
      if (vie !== null && vie > 0) imp.push('(reste ' + vie + 'PV)');
      if (d.capa_desc || d.capa_effet) imp.push('(' + esc((d.capa_desc ? d.capa_desc + ' ; ' : '') + (d.capa_effet || '') + (d.capa_tour != null ? ' pour ' + d.capa_tour + 'T' : '')) + ')');
      if (d.fatigue != null) imp.push('fatigue +' + d.fatigue);
      if (imp.length) s += ' : ' + imp.join(' ');
      var car = [];
      if (att != null) car.push((bal ? 'destab ' : 'att ') + att);
      if (esq != null) car.push((bal ? 'stab ' : 'esq ') + esq);
      if (resi != null) car.push('resi ' + resi);
      if (sr != null) car.push('sr ' + sr);
      if (e.px != null) car.push('(px +' + e.px + ')');
      if (car.length) s += ' (' + car.join(' ') + ')';
      return s;
    };
    var rows = [], pris = {};
    var render = function () {
      rows.forEach(function (r) {
        r.cell.innerHTML = '';
        if (show) r.cell.innerHTML = r.nouv; else r.cell.appendChild(document.createTextNode(r.orig));
        var sw = document.createElement('a'); sw.href = 'javascript:void(0)'; sw.className = 'mhx-evswitch';
        sw.title = show ? 'Voir la phrase du jeu' : 'Voir le d\u00e9tail (mails)'; sw.textContent = show ? ' \u21c4' : ' \u21c4 (d\u00e9tail)';
        sw.addEventListener('click', function (ev) { ev.preventDefault(); show = !show; try { localStorage.setItem(KEY, show ? 'yes' : 'no'); } catch (e) { /* ignore */ } render(); });
        r.cell.appendChild(sw);
      });
    };
    // Comp\u00e9tence Connaissance des Monstres : fiche de la CdM correspondant \u00e0 la ligne (m\u00eame troll, m\u00eame seconde ; d\u00e9calage d'une heure tol\u00e9r\u00e9)
    var CDM_SHOW = ['Niveau', 'Points de Vie', 'Blessure', 'Points de Vie restants', 'D\u00e9s d\'Attaque', 'D\u00e9s d\'Esquive', 'D\u00e9s de D\u00e9g\u00e2t', 'Armure Physique', 'Armure Magique', 'R\u00e9sistance Magique'];
    var cdmFor = function (ts, txt) {
      var best = null, bd = 1e9;
      (cdms || []).forEach(function (r) {
        var m = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(r.le || ''); if (!m || txt.indexOf('(' + r.troll + ')') === -1) return;
        var dt = Math.abs(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) / 1000 - ts), d = Math.min(dt, Math.abs(dt - 3600));
        if (d <= 2 && d < bd) { bd = d; best = r; }
      });
      return best;
    };
    var cdmHtml = function (r) {
      var ch = r.champs || {}, l = [];
      CDM_SHOW.forEach(function (k) {
        var v = String(ch[k] || '').replace(/\(\s*Calcul[^()]*\)/, '').trim(), pm = /\(([^()]+)\)/.exec(v); if (pm) v = pm[1];
        if (v) l.push(esc(k) + ' : <b>' + esc(v) + '</b>');
      });
      return l.length ? '<div class="mhx-cdm">\uD83D\uDD0D <b>CdM niv. ' + (r.niveau_cdm || '?') + '</b> \u2014 ' + esc(r.mob_nom || '') + '<br>' + l.join(' \u00b7 ') + '</div>' : '';
    };
    var paint = function () {
      if (!evs) return;
      var neuf = false;
      document.querySelectorAll('#events tbody tr').forEach(function (tr) {
        var c = tr.cells;
        if (!c || c.length < 3 || tr.getAttribute('data-mhx-ev')) return;
        var d = /(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})/.exec(c[0].textContent);
        var ty = c[1].textContent, kinds = /COMBAT/i.test(ty) ? ['combat'] : /MONSTRE/i.test(ty) ? ['pouvoir'] : /SORTIL/i.test(ty) ? ['sort'] : /COMP.TENCE/i.test(ty) ? ['competence'] : null; // COMBAT : attaques ; MONSTRE : pouvoirs ; SORTILEGE / COMPETENCE
        if (!d || !kinds) return;
        var ts = epoch(d, [null, d[4], d[5], d[6]]);
        var txt = c[c.length - 1].textContent.replace(/[\s\u00a0]+/g, '');
        var found = evs.filter(function (e) {
          var m = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/.exec(e.event_time || '');
          if (!m) return false;
          var te = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]) / 1000;
          return kinds.indexOf(e.kind) !== -1 && Math.abs(te - ts) <= 2 && (e.actor_id || e.target_id) && (!e.actor_id || txt.indexOf('(' + e.actor_id + ')') !== -1) && (!e.target_id || txt.indexOf('(' + e.target_id + ')') !== -1);
        });
        var cd = kinds[0] === 'competence' ? cdmFor(ts, txt) : null, cdh = cd ? cdmHtml(cd) : '';
        if (!found.length) {
          if (!cdh) return;
          tr.setAttribute('data-mhx-ev', '1');
          rows.push({ cell: c[c.length - 1], orig: c[c.length - 1].textContent.replace(/[\s\u00a0]+/g, ' ').trim(), nouv: esc(c[c.length - 1].textContent.replace(/[\s\u00a0]+/g, ' ').trim()) + cdh });
          neuf = true; return;
        }
        // plusieurs mails pour le m\u00eame combat (attaquant et d\u00e9fenseur) : m\u00eame signature, on garde le plus complet
        found.sort(function (a, b) { return Object.keys(b.detail || {}).length - Object.keys(a.detail || {}).length; });
        var sigs = {}, fights = [];
        found.forEach(function (e) {
          var dd = e.detail || {}, k = [e.kind, e.degats, dd.vie, dd.jet_att, dd.jet_esq, dd.destab, dd.stab, e.px].join('|');
          if (!sigs[k]) { sigs[k] = 1; fights.push({ e: e, k: k }); }
        });
        // m\u00eame seconde, m\u00eames protagonistes : la ligne du haut est la plus r\u00e9cente, donc celle qui a le moins de PV restants
        fights.sort(function (a, b) {
          var va = a.e.detail && a.e.detail.vie != null ? a.e.detail.vie : 1e9, vb = b.e.detail && b.e.detail.vie != null ? b.e.detail.vie : 1e9;
          return va - vb;
        });
        var libre = fights.filter(function (f) { return !pris[f.k]; }), choix = (libre.length ? libre : fights)[0];
        pris[choix.k] = 1;
        found = [choix.e];
        tr.setAttribute('data-mhx-ev', '1');
        var cell = c[c.length - 1];
        rows.push({ cell: cell, orig: cell.textContent.replace(/[\s\u00a0]+/g, ' ').trim(), nouv: phrase(found[0]) + cdh });
        neuf = true;
      });
      if (neuf) render();
    };
    var getJ = function (u) { return fetch(u, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }); };
    Promise.all([getJ(COMBATS_URL + id), getJ(COMBATS_URL.replace('combats=', 'cdms=') + id)]).then(function (x) { evs = x[0]; cdms = x[1]; paint(); setInterval(paint, 2000); }); // le tableau est rempli par JavaScript apr\u00e8s le chargement
  }


  // ===== Parcours de recolte (page Ordres d'un gowap) : repartit les tresors d'une zone entre les gowaps d'un meme troll =====
  // Regles : diagonales permises, X / Y / N dans le meme pas ; cout = 1,5 x dn + max(0, max(dx, dy) - dn). Objectif : minimiser le temps du gowap
  // le plus lent, puis la somme des couts. Parcours ouverts depuis la position de depart de chaque gowap. Heuristique (pas de preuve d'optimalite).
  function pcCout(a, b) {
    var dx = Math.abs(a[0] - b[0]), dy = Math.abs(a[1] - b[1]), dn = Math.abs(a[2] - b[2]);
    return 1.5 * dn + Math.max(0, Math.max(dx, dy) - dn);
  }
  function pcRng(seed) { // mulberry32 : graine fixe = resultat reproductible
    var a = seed >>> 0;
    return function () { a += 0x6D2B79F5; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function pcCoutRoute(start, route, pts) {
    var c = 0, prev = start;
    for (var i = 0; i < route.length; i++) { c += pcCout(prev, pts[route[i]]); prev = pts[route[i]]; }
    return c;
  }
  function pcScore(costs) { var m = 0, s = 0; costs.forEach(function (c) { if (c > m) m = c; s += c; }); return [m, s]; }
  function pcMieux(a, b) { return a[0] < b[0] - 1e-9 || (Math.abs(a[0] - b[0]) <= 1e-9 && a[1] < b[1] - 1e-9); }
  function pcResoudre(pts, starts, rnd) {
    var G = starts.length, routes = [], costs = [], i, g, h;
    for (g = 0; g < G; g++) { routes.push([]); costs.push(0); }
    // 1. affectation : tresors dans un ordre aleatoire, chacun la ou il augmente le moins (temps du plus lent, puis somme)
    var ordre = pts.map(function (_, k) { return k; });
    for (i = ordre.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = ordre[i]; ordre[i] = ordre[j]; ordre[j] = t; }
    ordre.forEach(function (t) {
      var best = null;
      for (var g2 = 0; g2 < G; g2++) {
        var r = routes[g2];
        for (var pos = 0; pos <= r.length; pos++) {
          var a = pos === 0 ? starts[g2] : pts[r[pos - 1]];
          var add = pcCout(a, pts[t]) + (pos < r.length ? pcCout(pts[t], pts[r[pos]]) - pcCout(a, pts[r[pos]]) : 0);
          var nc = costs.slice(); nc[g2] += add;
          var sc = pcScore(nc);
          if (!best || pcMieux(sc, best.sc)) best = { g: g2, pos: pos, sc: sc };
        }
      }
      routes[best.g].splice(best.pos, 0, t);
      costs[best.g] = pcCoutRoute(starts[best.g], routes[best.g], pts);
    });
    // 2. amelioration locale tant que (temps du plus lent, somme) diminue : 2-opt, deplacements, echanges entre parcours (variations de cout calculees sans refaire les parcours)
    var cur = pcScore(costs);
    var pt = function (gg, k) { return k === 0 ? starts[gg] : pts[routes[gg][k - 1]]; }; // k = 0 : depart ; k >= 1 : k-ieme tresor
    var meilleur = function (gA, nA, gB, nB) { // nouveau score si les couts de gA (et gB) deviennent nA (nB) ?
      var nc = costs.slice(); nc[gA] = nA; if (gB !== null) nc[gB] = nB;
      var sc = pcScore(nc);
      return pcMieux(sc, cur) ? sc : null;
    };
    var recalc = function () { for (var q = 0; q < G; q++) costs[q] = pcCoutRoute(starts[q], routes[q], pts); cur = pcScore(costs); };
    var amelioree = true, garde = 0, k, kk, i1, j1;
    while (amelioree && garde++ < 100) {
      amelioree = false;
      for (g = 0; g < G; g++) { // 2-opt : inversion des positions i..j d'un parcours
        k = routes[g].length;
        for (i1 = 1; i1 <= k; i1++) for (j1 = i1 + 1; j1 <= k; j1++) {
          var d2 = pcCout(pt(g, i1 - 1), pt(g, j1)) - pcCout(pt(g, i1 - 1), pt(g, i1)) + (j1 < k ? pcCout(pt(g, i1), pt(g, j1 + 1)) - pcCout(pt(g, j1), pt(g, j1 + 1)) : 0);
          if (d2 < -1e-9 && meilleur(g, costs[g] + d2, null, null)) {
            var rv = routes[g]; routes[g] = rv.slice(0, i1 - 1).concat(rv.slice(i1 - 1, j1).reverse(), rv.slice(j1)); recalc(); amelioree = true;
          }
        }
      }
      for (g = 0; g < G; g++) { // deplacement d'un tresor : dans son parcours ou vers un autre
        for (i1 = 1; i1 <= routes[g].length; i1++) {
          k = routes[g].length;
          var x = routes[g][i1 - 1], px = pts[x], prv = pt(g, i1 - 1);
          var dA = i1 < k ? pcCout(prv, pt(g, i1 + 1)) - pcCout(prv, px) - pcCout(px, pt(g, i1 + 1)) : -pcCout(prv, px);
          var fait = false;
          for (h = 0; h < G && !fait; h++) {
            if (h === g) { // meme parcours : on teste les autres positions en recalculant ce parcours
              var rem = routes[g].slice(0, i1 - 1).concat(routes[g].slice(i1));
              for (var p2 = 0; p2 <= rem.length; p2++) {
                if (p2 === i1 - 1) continue;
                var nr = rem.slice(0, p2).concat([x], rem.slice(p2)), nc2 = pcCoutRoute(starts[g], nr, pts);
                if (nc2 < costs[g] - 1e-9 && meilleur(g, nc2, null, null)) { routes[g] = nr; recalc(); fait = true; break; }
              }
            } else {
              kk = routes[h].length;
              for (var p3 = 1; p3 <= kk + 1; p3++) {
                var qa = pt(h, p3 - 1), dB = p3 <= kk ? pcCout(qa, px) + pcCout(px, pt(h, p3)) - pcCout(qa, pt(h, p3)) : pcCout(qa, px);
                if (meilleur(g, costs[g] + dA, h, costs[h] + dB)) {
                  routes[g] = routes[g].slice(0, i1 - 1).concat(routes[g].slice(i1)); routes[h] = routes[h].slice(0, p3 - 1).concat([x], routes[h].slice(p3 - 1)); recalc(); fait = true; break;
                }
              }
            }
          }
          if (fait) { amelioree = true; i1--; }
        }
      }
      for (g = 0; g < G; g++) for (h = g + 1; h < G; h++) { // echange de deux tresors entre deux parcours
        for (i1 = 1; i1 <= routes[g].length; i1++) for (j1 = 1; j1 <= routes[h].length; j1++) {
          var ka = routes[g].length, kb = routes[h].length, tx = pts[routes[g][i1 - 1]], ty = pts[routes[h][j1 - 1]];
          var da = pcCout(pt(g, i1 - 1), ty) - pcCout(pt(g, i1 - 1), tx) + (i1 < ka ? pcCout(ty, pt(g, i1 + 1)) - pcCout(tx, pt(g, i1 + 1)) : 0);
          var db = pcCout(pt(h, j1 - 1), tx) - pcCout(pt(h, j1 - 1), ty) + (j1 < kb ? pcCout(tx, pt(h, j1 + 1)) - pcCout(ty, pt(h, j1 + 1)) : 0);
          if (meilleur(g, costs[g] + da, h, costs[h] + db)) {
            var tmp = routes[g][i1 - 1]; routes[g][i1 - 1] = routes[h][j1 - 1]; routes[h][j1 - 1] = tmp; recalc(); amelioree = true;
          }
        }
      }
    }
    return { routes: routes, costs: costs, score: cur };
  }
  function pcOptimiser(pts, starts, maxMs) {
    var rnd = pcRng(20251028), best = null, t0 = Date.now(), essais = 0;
    while (essais < 300 && (essais < 3 || Date.now() - t0 < maxMs)) {
      var sol = pcResoudre(pts, starts, rnd); essais++;
      if (!best || pcMieux(sol.score, best.score)) best = sol;
    }
    best.essais = essais;
    return best;
  }
  function pcFmt(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, ''); }
  function pcPos(p) { return p[0] + '/' + p[1] + '/' + p[2]; }

  // memorise la position du troll lue sur Ma vue (\u00ab Ma position actuelle est : X = .. | Y = .. | N = .. \u00bb) pour la page Ordres
  function rememberPosition() {
    if (!/\/Play_vue2\.php$/.test(location.pathname)) return;
    var t0 = Date.now();
    var lire = function () {
      var m = /Ma position actuelle est\s*:\s*X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/.exec((document.body ? document.body.textContent : '').replace(/[\s\u00a0]+/g, ' '));
      var troll = currentTrollId();
      var txtV = (document.body ? document.body.textContent : '').replace(/[\s\u00a0]+/g, ' ');
      var mv = /vue porte actuellement \u00e0\s*(\d+) cases horizontalement et (\d+) verticalement/i.exec(txtV); // \u00ab Ma vue porte actuellement \u00e0 66 cases horizontalement et 33 verticalement \u00bb (pas la limite d'affichage)
      if (m && troll) { try { localStorage.setItem('mhx-position-' + troll, JSON.stringify({ x: +m[1], y: +m[2], n: +m[3], h: mv ? +mv[1] : null, v: mv ? +mv[2] : null, t: Date.now() })); } catch (e) { /* stockage indisponible */ } return; }
      if (Date.now() - t0 < 8000) setTimeout(lire, 1000);
    };
    lire();
  }

  // ===== Parcours de r\u00e9colte partag\u00e9 : enregistr\u00e9 sur le serveur MH (notif/parcours.php), visible par tout le groupe, envoi des ordres au gowap =====
  // Chaque envoi d'ordres est un clic humain (par case, ou \u00ab Tout envoyer \u00bb apr\u00e8s confirmation) : il r\u00e9utilise la s\u00e9quence \u00ab Aller chercher \u00bb /
  // \u00ab Se d\u00e9placer vers \u00bb + \u00ab Arr\u00eat \u00bb ci-dessus (sans PA). Aucun envoi automatique.
  var PARCOURS_URL = 'https://mh.percolouco.com/notif/parcours.php';
  function pcApi(me, body, cb) {
    fetch(PARCOURS_URL, { method: 'POST', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: 'troll=' + me + '&' + body })
      .then(function (r) { return r.json().catch(function () { return {}; }); }).then(function (j) { cb(j || {}); }, function () { cb(null); });
  }
  // \u00ab Se d\u00e9placer vers la case puis s'arr\u00eater \u00bb pour un gowap : m\u00eame s\u00e9quence que \u00ab Aller chercher \u00bb (ordres cr\u00e9\u00e9s \u00e0 l'envers, chacun remonte en premier)
  function pcEnvoyerCase(gowapId, c, say) {
    var it = { ref: String(c.ref || ''), nom: c.nom || 'Tr\u00e9sor', x: c.x, y: c.y, n: c.n, dist: 0 };
    return sequenceAllerChercher(it, String(gowapId), say, true).then(function (txt) {
      var moi = currentTrollId(); if (moi && /^\d+$/.test(it.ref) && it.ref !== '0') marksCall('action=set&ref=' + it.ref + '&troll=' + moi, function () {});
      return txt;
    });
  }
  function pcRendrePartage(zone, liste, me, onReset, filtreGowap) {
    zone.textContent = '';
    var el = function (tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
    var l = (liste || []).filter(function (g) { return g.cases && g.cases.length; });
    var tete = el('div', 'mhx-pc-ligne');
    tete.appendChild(el('b', null, 'Parcours enregistr\u00e9 (partag\u00e9 avec le groupe) : '));
    tete.appendChild(document.createTextNode(l.length ? l.length + ' gowap' + (l.length > 1 ? 's' : '') : 'aucun'));
    var reset = el('button', 'mh_form_submit mhx-tfiltre', 'R\u00e9initialiser le parcours'); reset.type = 'button';
    reset.title = 'Efface le parcours enregistr\u00e9 de tous les gowaps (pour tout le groupe)';
    reset.addEventListener('click', function () {
      if (!l.length) return;
      if (!window.confirm('Effacer le parcours de r\u00e9colte enregistr\u00e9 pour tous les gowaps ?')) return;
      pcApi(me, 'action=reset', function (j) { if (j && j.ok) onReset(); else tete.appendChild(el('span', 'mhx-pc-info', ' \u00c9chec de la r\u00e9initialisation.')); });
    });
    tete.appendChild(reset);
    zone.appendChild(tete);
    var etat = el('div', 'mhx-pc-info'); var occupe = false;
    var say = function (t) { etat.textContent = t; };
    l.forEach(function (g) {
      var bloc = el('div', 'mhx-pc-gowap');
      var h = el('div'); h.appendChild(el('b', null, (g.nom || 'Gowap') + ' (' + g.gowap + ') : ' + g.cases.length + ' case' + (g.cases.length > 1 ? 's' : '')));
      var tout = el('button', 'mh_form_submit mhx-tfiltre', 'Tout envoyer \u00e0 ce gowap'); tout.type = 'button'; tout.style.marginLeft = '8px';
      tout.title = 'Envoie \u00e0 ce gowap les ordres de toutes les cases (d\u00e9placement puis arr\u00eat pour chacune), apr\u00e8s confirmation';
      h.appendChild(tout); bloc.appendChild(h);
      var tb = el('table', 'mhx-pc-tab');
      var envoyer = function (c, bouton, fini) {
        if (occupe) { say('Un envoi est d\u00e9j\u00e0 en cours, patiente quelques secondes.'); return Promise.resolve(); }
        occupe = true; if (bouton) bouton.disabled = true;
        return pcEnvoyerCase(g.gowap, c, say).then(function (txt) { say(txt); if (bouton) bouton.textContent = 'envoy\u00e9 \u2713'; }, function (e) { say('\u00c9chec : ' + (e && e.message ? e.message : 'envoi impossible')); if (bouton) bouton.disabled = false; })
          .then(function () { occupe = false; if (fini) fini(); });
      };
      g.cases.forEach(function (c, i) {
        var tr = el('tr');
        tr.appendChild(el('td', null, String(i + 1))); tr.appendChild(el('td', null, c.ref ? String(c.ref) : '')); tr.appendChild(el('td', null, c.nom || ''));
        tr.appendChild(el('td', null, 'X=' + c.x + ' | Y=' + c.y + ' | N=' + c.n));
        var td = el('td'), b = el('button', 'mh_form_submit mhx-tfiltre', '\u2192 ordres'); b.type = 'button';
        b.title = 'Envoie \u00e0 ce gowap : se d\u00e9placer vers cette case, puis s\u2019arr\u00eater (un clic = une case)';
        b.addEventListener('click', function () { envoyer(c, b); });
        td.appendChild(b); tr.appendChild(td); tb.appendChild(tr);
      });
      tout.addEventListener('click', function () {
        if (occupe) return;
        if (!window.confirm('Envoyer \u00e0 ' + (g.nom || 'ce gowap') + ' les ordres de ' + g.cases.length + ' case(s) (d\u00e9placement puis arr\u00eat pour chacune) ?')) return;
        occupe = true; tout.disabled = true;
        var suite = Promise.resolve(), n = g.cases.length;
        // chaque nouvel ordre arrive en premier : on envoie donc de la derni\u00e8re case \u00e0 la premi\u00e8re pour que l'ordre final suive le parcours
        g.cases.slice().reverse().forEach(function (c, k) {
          suite = suite.then(function () { say('Case ' + (n - k) + '/' + n + '\u2026'); return pcEnvoyerCase(g.gowap, c, function () {}); });
        });
        suite.then(function () { say('Termin\u00e9 : ' + n + ' case(s) envoy\u00e9e(s) \u00e0 ' + (g.nom || 'ce gowap') + '. Recharge la page pour voir les ordres.'); },
          function (e) { say('\u00c9chec : ' + (e && e.message ? e.message : 'envoi impossible') + ' (les cases d\u00e9j\u00e0 envoy\u00e9es restent enregistr\u00e9es).'); })
          .then(function () { occupe = false; tout.disabled = false; });
      });
      bloc.appendChild(tb); zone.appendChild(bloc);
    });
    zone.appendChild(etat);
  }

  function addParcoursRecolte() {
    if (!/\/Play_a_Action\.php$/.test(location.pathname) || !/[?&]sub=ordres\b/.test(location.search)) return;
    var me = aggroTroll();
    if (!me) return;
    var tries = 0;
    (function run() {
      var carte = document.getElementById('carte_trajet');
      if (!carte && ++tries < 8) return setTimeout(run, 800);
      if (!carte || document.getElementById('mhx-parcours')) return;
      var box = document.createElement('div'); box.id = 'mhx-parcours';
      var det = document.createElement('details'); det.open = false;
      var sum = document.createElement('summary'); sum.textContent = 'Parcours de r\u00e9colte (r\u00e9partir les tr\u00e9sors entre mes gowaps)';
      det.appendChild(sum);
      var corps = document.createElement('div'); corps.className = 'mhx-pc-corps'; det.appendChild(corps); box.appendChild(det);
      carte.parentNode.insertBefore(box, carte);
      var champ = function (lab, id, val, w) { var l = document.createElement('label'); l.className = 'mhx-pc-champ'; l.appendChild(document.createTextNode(lab + ' ')); var i = document.createElement('input'); i.type = 'text'; i.id = id; i.value = val; i.size = w || 4; l.appendChild(i); return l; };
      var pos = null;
      try { pos = JSON.parse(localStorage.getItem('mhx-position-' + me) || 'null'); } catch (e) { pos = null; }
      var ligne1 = document.createElement('div'); ligne1.className = 'mhx-pc-ligne';
      var sel = document.createElement('select'); sel.id = 'mhx-pc-type';
      [['Gigots de Gob', '^Gigots?\\s+de\\s+Gob'], ['Parchemin', '^Parchemin'], ['Composant', '^Composant'], ['Tous les tr\u00e9sors', '.']].forEach(function (f) { var o = document.createElement('option'); o.value = f[1]; o.textContent = f[0]; sel.appendChild(o); });
      var lt = document.createElement('label'); lt.className = 'mhx-pc-champ'; lt.appendChild(document.createTextNode('Tr\u00e9sors : ')); lt.appendChild(sel);
      ligne1.appendChild(lt);
      ligne1.appendChild(champ('Ma position X', 'mhx-pc-x', pos ? pos.x : '')); ligne1.appendChild(champ('Y', 'mhx-pc-y', pos ? pos.y : '')); ligne1.appendChild(champ('N', 'mhx-pc-n', pos ? pos.n : ''));
      var ligne2 = document.createElement('div'); ligne2.className = 'mhx-pc-ligne';
      var selm = document.createElement('select'); selm.id = 'mhx-pc-mode';
      [['separe', 'Port\u00e9e s\u00e9par\u00e9e (cases / niveaux)'], ['cout', 'Port\u00e9e en co\u00fbt unique']].forEach(function (f) { var o = document.createElement('option'); o.value = f[0]; o.textContent = f[1]; selm.appendChild(o); });
      ligne2.appendChild(selm);
      ligne2.appendChild(champ('Cases', 'mhx-pc-cases', '44')); ligne2.appendChild(champ('Niveaux', 'mhx-pc-niv', '20')); ligne2.appendChild(champ('Co\u00fbt max', 'mhx-pc-cout', '44'));
      // filtre « personne sur la case » (comme dans la liste des tr\u00e9sors) : ignore les tr\u00e9sors d'une case occup\u00e9e par un troll ou un gowap apprivois\u00e9
      var exclPc = { actif: false, dist: 0 };
      try { var exs = JSON.parse(localStorage.getItem('mhx-pc-excl') || '{}') || {}; exclPc = { actif: !!exs.actif, dist: Math.min(3, Math.max(0, parseInt(exs.dist, 10) || 0)) }; } catch (e) { /* r\u00e9glages par d\u00e9faut */ }
      var ligneX = document.createElement('div'); ligneX.className = 'mhx-pc-ligne';
      var lx = document.createElement('label'); lx.className = 'mhx-pc-champ'; lx.title = 'Ignore les tr\u00e9sors ayant un gowap apprivois\u00e9 ou un troll sur leur case (ou \u00e0 la distance choisie), d\u2019apr\u00e8s les positions de la derni\u00e8re vue';
      var cx = document.createElement('input'); cx.type = 'checkbox'; cx.checked = exclPc.actif; lx.appendChild(cx); lx.appendChild(document.createTextNode(' Personne sur la case '));
      var sx = document.createElement('select'); sx.id = 'mhx-pc-excl-dist';
      ['m\u00eame case', '\u2264 1 case', '\u2264 2 cases', '\u2264 3 cases'].forEach(function (t, i) { var o = document.createElement('option'); o.value = i; o.textContent = t; if (i === exclPc.dist) o.selected = true; sx.appendChild(o); });
      var saveX = function () { exclPc = { actif: cx.checked, dist: parseInt(sx.value, 10) || 0 }; try { localStorage.setItem('mhx-pc-excl', JSON.stringify(exclPc)); } catch (e) { /* stockage indisponible */ } };
      cx.addEventListener('change', saveX); sx.addEventListener('change', saveX);
      ligneX.appendChild(lx); ligneX.appendChild(sx);
      var ligne3 = document.createElement('div'); ligne3.className = 'mhx-pc-ligne'; ligne3.id = 'mhx-pc-gowaps'; ligne3.textContent = 'Chargement de mes gowaps\u2026';
      var go = document.createElement('button'); go.type = 'button'; go.className = 'mh_form_submit mhx-tfiltre'; go.textContent = 'Calculer les parcours'; go.disabled = true;
      var info = document.createElement('span'); info.className = 'mhx-pc-info';
      var res = document.createElement('div'); res.className = 'mhx-pc-res';
      [ligne1, ligne2, ligneX, ligne3].forEach(function (x) { corps.appendChild(x); });
      var lb = document.createElement('div'); lb.className = 'mhx-pc-ligne'; lb.appendChild(go); lb.appendChild(info); corps.appendChild(lb); corps.appendChild(res);
      var partage = document.createElement('div'); partage.className = 'mhx-pc-partage'; corps.appendChild(partage);
      var partageOn = feat('ordres_parcours_partage');
      var chargePartage = function () {
        if (!partageOn) return;
        fetch(PARCOURS_URL, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
          if (!j || !j.parcours) { partage.textContent = 'Parcours partag\u00e9 indisponible (serveur MH injoignable).'; return; }
          pcRendrePartage(partage, j.parcours, me, chargePartage);
        }, function () { partage.textContent = 'Parcours partag\u00e9 indisponible (serveur MH injoignable).'; });
      };
      chargePartage();
      var gowaps = [], items = null, occ = { gowap: [], troll: [] };
      // gowaps du troll connecte (cases cochees dans la liste commune) avec leur derniere position lue
      mineCall(me, '', function (d) {
        ligne3.textContent = '';
        if (!d || !d.gowaps) { ligne3.textContent = 'Serveur MH injoignable.'; return; }
        d.gowaps.forEach(function (g) {
          var l = g.live || {}, ok = typeof l.x === 'number' && typeof l.y === 'number' && typeof l.n === 'number';
          var lab = document.createElement('label'); lab.className = 'mhx-pc-champ';
          var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = ok; cb.disabled = !ok;
          var nom = String(l.nom || '').replace(/^\s*une?\s+/i, '').replace(/\(\d+\)\s*$/, '').replace(/^Gowap Apprivois\S*\s*(\[[^\]]*\])?\s*/i, '').trim();
          lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + (nom || 'Gowap') + ' (' + g.gowap_id + ')' + (ok ? ' : ' + l.x + '/' + l.y + '/' + l.n : ' : position inconnue')));
          ligne3.appendChild(lab);
          gowaps.push({ id: String(g.gowap_id), nom: nom, start: ok ? [l.x, l.y, l.n] : null, cb: cb });
        });
        if (!d.gowaps.length) ligne3.textContent = 'Aucun gowap rattach\u00e9 \u00e0 ton troll (coche \u00ab Mes gowaps \u00bb dans la liste commune des suivants).';
        go.disabled = false;
      });
      fetch(TRESORS_URL + '?troll=' + me, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { items = d && d.items ? d.items : []; if (d && d.occ) occ = d.occ; }, function () { items = []; });
      go.addEventListener('click', function () {
        res.textContent = '';
        var v = function (id) { var x = parseInt(document.getElementById(id).value, 10); return isNaN(x) ? null : x; };
        var ref = [v('mhx-pc-x'), v('mhx-pc-y'), v('mhx-pc-n')], haveRef = ref.every(function (x) { return x !== null; });
        var mode = selm.value, cases = v('mhx-pc-cases'), niv = v('mhx-pc-niv'), cmax = parseFloat(document.getElementById('mhx-pc-cout').value.replace(',', '.'));
        var re = new RegExp(sel.value, 'i');
        var choisis = gowaps.filter(function (g) { return g.cb.checked && g.start; });
        var msg = function (t) { info.textContent = t; };
        if (!items) { msg('Tr\u00e9sors pas encore charg\u00e9s, r\u00e9essaie.'); return; }
        if (!choisis.length) { msg('Aucun gowap coch\u00e9.'); return; }
        var vus = {}, dups = [], tres = [];
        var occupes = [], procheOcc = function (it, l2) { return (l2 || []).some(function (q) { return q[2] === it.n && Math.max(Math.abs(q[0] - it.x), Math.abs(q[1] - it.y)) <= exclPc.dist; }); };
        items.forEach(function (it) { if (!re.test(it.nom)) return; if (vus[it.ref]) { dups.push(it.ref); return; } vus[it.ref] = 1; if (exclPc.actif && (procheOcc(it, occ.gowap) || procheOcc(it, occ.troll))) { occupes.push(it); return; } tres.push(it); });
        var departs = choisis.map(function (g) { return g.start; });
        var refPos = haveRef ? ref : null;
        var retenus = [], exclus = [], limite = [];
        tres.forEach(function (it) {
          var p = [it.x, it.y, it.n];
          if (!refPos) { retenus.push(it); return; }
          var dx = Math.abs(p[0] - refPos[0]), dy = Math.abs(p[1] - refPos[1]), dn = Math.abs(p[2] - refPos[2]);
          if (mode === 'cout') {
            var c = pcCout(refPos, p);
            if (c <= cmax) { retenus.push(it); if (cmax - c < 2) limite.push([it, 'retenu, co\u00fbt ' + pcFmt(c) + ' pour ' + pcFmt(cmax)]); }
            else { exclus.push([it, 'trop loin (co\u00fbt ' + pcFmt(c) + ' > ' + pcFmt(cmax) + ')']); if (c - cmax < 2) limite.push([it, 'exclu, co\u00fbt ' + pcFmt(c)]); }
          } else {
            var mx = Math.max(dx, dy);
            if (mx <= cases && dn <= niv) { retenus.push(it); if (cases - mx < 2 || niv - dn < 2) limite.push([it, 'retenu, ' + mx + ' cases / ' + dn + ' niveaux']); }
            else { exclus.push([it, dn > niv ? 'trop loin en N (' + dn + ' > ' + niv + ')' : 'trop loin en X/Y (' + mx + ' > ' + cases + ')']); if (mx - cases < 3 && dn - niv < 3) limite.push([it, 'exclu, ' + mx + ' cases / ' + dn + ' niveaux']); }
          }
        });
        var pts = retenus.map(function (it) { return [it.x, it.y, it.n]; });
        var t0 = Date.now();
        var sol = pts.length ? pcOptimiser(pts, departs, 2500) : { routes: departs.map(function () { return []; }), costs: departs.map(function () { return 0; }), score: [0, 0], essais: 0 };
        var txt = [];
        var out = function (s) { txt.push(s); };
        var nomT = /gigots/i.test(sel.options[sel.selectedIndex].textContent) ? 'gigots' : 'tr\u00e9sors';
        out('Filtrage : ' + retenus.length + ' retenus, ' + exclus.length + ' exclus sur ' + tres.length + ' ' + nomT + (refPos ? ' (r\u00e9f. ' + pcPos(refPos) + ', ' + (mode === 'cout' ? 'co\u00fbt \u2264 ' + pcFmt(cmax) : cases + ' cases / ' + niv + ' niveaux, mode s\u00e9par\u00e9') + ')' : ' (pas de position de r\u00e9f\u00e9rence : aucun filtrage)') + '.');
        if (exclPc.actif) out('Cases occup\u00e9es ignor\u00e9es (' + (exclPc.dist ? '\u2264 ' + exclPc.dist + ' case' + (exclPc.dist > 1 ? 's' : '') : 'm\u00eame case') + ') : ' + (occupes.length ? occupes.map(function (it) { return it.ref + ' (' + pcPos([it.x, it.y, it.n]) + ')'; }).join(', ') : 'aucune'));
        if (dups.length) out('Doublons d\u2019ID ignor\u00e9s : ' + dups.join(', '));
        exclus.forEach(function (x) { out('  exclu ' + x[0].ref + ' (' + pcPos([x[0].x, x[0].y, x[0].n]) + ') : ' + x[1]); });
        if (limite.length) { out('\u00c0 la limite :'); limite.forEach(function (x) { out('  ' + x[0].ref + ' (' + pcPos([x[0].x, x[0].y, x[0].n]) + ') : ' + x[1]); }); }
        out('');
        var lignesId = [], rep = [];
        choisis.forEach(function (g, gi) {
          var r = sol.routes[gi], cum = 0, prev = g.start, lib = (g.nom || 'Gowap') + ' (' + g.id + ')';
          out('## ' + lib + ', d\u00e9part ' + pcPos(g.start) + ', co\u00fbt ' + pcFmt(sol.costs[gi]) + ', ' + r.length + ' ' + nomT);
          out('| # | Id | Position | Pas | Cumul |'); out('|---|---|---|---|---|');
          r.forEach(function (ti, k) { var p = pts[ti], st = pcCout(prev, p); cum += st; prev = p; out('| ' + (k + 1) + ' | ' + retenus[ti].ref + ' | ' + pcPos(p) + ' | ' + pcFmt(st) + ' | ' + pcFmt(cum) + ' |'); });
          out('');
          lignesId.push((g.nom || g.id) + ' : ' + r.map(function (ti) { return retenus[ti].ref; }).join(', '));
          rep.push((g.nom || g.id) + ' ' + pcFmt(sol.costs[gi]) + ' (' + r.length + ')');
        });
        out('Ordres d\u2019ID \u00e0 copier :'); lignesId.forEach(function (l) { out(l); });
        out('');
        out('R\u00e9capitulatif : ' + rep.join(' ; ') + '. Le plus lent : ' + pcFmt(sol.score[0]) + ' (somme ' + pcFmt(sol.score[1]) + ').');
        var nb = choisis.map(function (_, gi) { return sol.routes[gi].length; });
        if (Math.max.apply(null, nb) - Math.min.apply(null, nb) > 3) out('R\u00e9partition d\u00e9s\u00e9quilibr\u00e9e en nombre de ' + nomT + ' : le temps est \u00e9quilibr\u00e9, pas le nombre (points isol\u00e9s ou grappes proches).');
        out('Hypoth\u00e8ses : co\u00fbt = 1,5 \u00d7 dn + max(0, max(dx, dy) \u2212 dn), parcours ouverts, ' + sol.essais + ' essais (graine fixe), heuristique sans preuve d\u2019optimalit\u00e9. Positions des gowaps : derni\u00e8re lecture.');
        var pre = document.createElement('pre'); pre.className = 'mhx-pc-texte'; pre.textContent = txt.join('\n');
        var cp = document.createElement('button'); cp.type = 'button'; cp.className = 'mh_form_submit mhx-tfiltre'; cp.textContent = 'Copier le r\u00e9sultat';
        cp.addEventListener('click', function () {
          var t = txt.join('\n'), ok = function () { cp.textContent = 'Copi\u00e9 \u2713'; };
          if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, function () { /* presse-papiers refuse : texte selectionnable ci-dessous */ });
          else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ok(); } catch (e) { /* ignore */ } document.body.removeChild(ta); }
        });
        res.appendChild(cp); res.appendChild(pre);
        // enregistrement du parcours sur le serveur (partage avec le groupe), puis affichage des boutons d'envoi des ordres
        var donnees = choisis.map(function (g, gi) { return { gowap: parseInt(g.id, 10), nom: g.nom || 'Gowap', cases: sol.routes[gi].map(function (ti) { var it = retenus[ti]; return { ref: it.ref, nom: it.nom, x: it.x, y: it.y, n: it.n }; }) }; });
        if (partageOn) pcApi(me, 'action=save&data=' + encodeURIComponent(JSON.stringify(donnees)), function (j) { if (j && j.ok) chargePartage(); else msg('Parcours calcul\u00e9 mais non enregistr\u00e9 (serveur MH injoignable).'); });
        msg(pts.length + ' ' + nomT + ' r\u00e9partis en ' + Math.round(Date.now() - t0) + ' ms.');
      });
    })();
  }

  // ===== Fonctionnalit\u00e9s \u00e0 afficher ou non, par troll, gard\u00e9es sur le serveur MH (suivent le joueur d'un navigateur \u00e0 l'autre) =====
  // Une copie locale sert au d\u00e9marrage imm\u00e9diat des pages ; elle est rafra\u00eechie depuis le serveur \u00e0 chaque page (effet \u00e0 la page suivante).
  var FEATURES = [
    ['Page Ma vue', [
      ['vue_pv', 'PV des monstres (colonne PV : CDM, puis PV actuels / max apr\u00e8s frappes du groupe)'],
      ['vue_aggro', 'Colonne Aggro (derni\u00e8re cible frapp\u00e9e par les monstres)'],
      ['vue_gowaps_liste', 'Couleur des gowaps de la liste commune'],
      ['vue_gowaps_ramasseurs', 'Gowaps ramasseurs : recherche, ligne rose et filtre'],
      ['vue_marques', 'Marque bleue des tr\u00e9sors en cours de r\u00e9cup\u00e9ration'],
      ['vue_filtres_tresors', 'Filtres des tr\u00e9sors (Parchemin, Composant, Gigots de Gob\u2026) et piles'],
      ['vue_tresors_ident', 'Nom r\u00e9el des tr\u00e9sors identifi\u00e9s'],
      ['vue_portails', 'Destination des portails de t\u00e9l\u00e9portation'],
      ['vue_portails_sorties', 'Sorties de portail : vert (TP du groupe) / rouge (inconnue \u00e0 5 cases) + alerte \u00e0 la connexion'],
      ['vue_effets', 'Ic\u00f4nes des effets (Flash Aveuglant) sur les monstres'],
      ['vue_hypno', 'Monstres hypnotis\u00e9s : ligne violette + picto'],
      ['vue_chasse', 'Gestion de la chasse : cibles prioritaires et positions de chasse du groupe'],
      ['vue_trolls_etat', 'Colonnes PA / PV / DLA des trolls'],
      ['vue_sacro', 'Clic sur les PV d\u2019un troll pour demander un sacro'],
      ['vue_maj_it', 'Mise \u00e0 jour de ta vue dans l\u2019IT quand tu ouvres Ma vue (partielle si filtres, rien de supprim\u00e9 hors du cadre affich\u00e9)']
    ]],
    ['Pages monstre et troll', [
      ['evenements_scriz', '\u00c9v\u00e9nements r\u00e9\u00e9crits au format SCIZ (jets, d\u00e9g\u00e2ts, r\u00e9sistance\u2026)'],
      ['monstre_analyse', 'Analyse du monstre (dur\u00e9e du tour, peut rejouer, cumul)'],
      ['monstre_aggro', 'Derni\u00e8re cible frapp\u00e9e sur la fiche du monstre'],
      ['tp_prepa', 'Pr\u00e9paration du sortil\u00e8ge T\u00e9l\u00e9portation : zone d\u2019arriv\u00e9e et alerte trou de M\u00e9t\u00e9orite'],
      ['monstre_finisseurs', 'Suivi des PV et aide aux finisseurs sur la fiche du monstre (bouton)'],
      ['profil_kiki', 'Jauge Kiki Meter sur le profil']
    ]],
    ['Autres pages du jeu', [
      ['turnstart_gowaps', 'Encart \u00ab Mes gowaps \u00bb sur la page de connexion'],
      ['suivants_dla', 'DLA de chaque suivant (page Suivants)'],
      ['suivants_pa', 'PA disponibles \u00e0 c\u00f4t\u00e9 de la DLA de chaque suivant (page Suivants)'],
      ['suivants_vue', 'Port\u00e9e de vue de chaque suivant (page Suivants)'],
      ['suivants_hors_vue', 'Picto \u00ab hors de la vue du troll \u00bb sur les suivants (page Suivants)'],
      ['turnstart_surcharge', 'Alerte gowap surcharg\u00e9 / immobilis\u00e9 (page de connexion)'],
      ['ordres_dla', 'PA et DLA estim\u00e9s sur les ordres de d\u00e9placement (page Ordres)'],
      ['transbahuter_gowaps', 'Couleur et poids port\u00e9 des gowaps (page Transbahuter)'],
      ['ordres_tresors', 'Liste des tr\u00e9sors et \u00ab Aller chercher \u00bb (page Ordres des gowaps)'],
      ['ordres_parcours', 'Parcours de r\u00e9colte : r\u00e9partir les tr\u00e9sors entre mes gowaps, filtre \u00ab Personne sur la case \u00bb (page Ordres)'],
      ['ordres_parcours_partage', 'Parcours de r\u00e9colte partag\u00e9 avec le groupe : boutons \u00ab \u2192 ordres \u00bb, \u00ab Tout envoyer \u00bb et r\u00e9initialisation (page Ordres)'],
      ['commandes', 'Commandes d\u2019enchantement : synchro et couleurs des composants']
    ]],
    ['Menu', [
      ['menu_it', 'Bouton \u00ab IT \u00bb'],
      ['menu_pistage', 'Image des points cardinaux (pistage)'],
      ['menu_ecuyers', 'Liens vers les \u00e9cuyers']
    ]]
  ];
  var FEAT_KEY = 'mhx-features', FEAT_URL = 'https://mh.percolouco.com/notif/prefs_features.php';
  function featCache() { try { return JSON.parse(localStorage.getItem(FEAT_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function featOff(troll) { var c = featCache()[troll]; return Array.isArray(c) ? c : null; }
  function featSetCache(troll, liste) { try { var c = featCache(); c[troll] = liste; localStorage.setItem(FEAT_KEY, JSON.stringify(c)); } catch (e) { /* stockage indisponible */ } }
  function feat(k) { var t = currentTrollId(), l = t ? featOff(t) : null; return !(l && l.indexOf(k) !== -1); }
  function featFetch(troll, cb) {
    fetch(FEAT_URL + '?troll=' + troll, { referrerPolicy: 'no-referrer' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (j) { if (j && (Array.isArray(j.desactivees) || j.desactivees === null)) { featSetCache(troll, j.desactivees || []); cb(j.desactivees || []); } else cb(null); });
  }
  // d\u00e9marre tout de suite avec la copie locale (rafra\u00eechie en arri\u00e8re-plan) ; sans copie, attend le serveur 1,2 s au plus
  function featLoad(cb) {
    var t = currentTrollId();
    if (!t) { cb(); return; }
    if (featOff(t)) { cb(); featFetch(t, function () { /* appliqu\u00e9 \u00e0 la page suivante */ }); return; }
    var fait = false, go = function () { if (!fait) { fait = true; cb(); } };
    setTimeout(go, 1200);
    featFetch(t, go);
  }
  // Page Options du jeu : bloc de cases \u00e0 cocher, une par fonctionnalit\u00e9
  function addFeaturesOptions() {
    if (!/\/Play_option\.php$/.test(location.pathname) || document.getElementById('mhx-features')) return;
    var troll = currentTrollId();
    var main = document.querySelector('main.play') || document.body;
    if (!troll || !main) return;
    var box = document.createElement('div'); box.id = 'mhx-features';
    var h = document.createElement('h2'); h.className = 'titre2'; h.textContent = 'Am\u00e9liorations du proxy MH';
    var intro = document.createElement('p'); intro.textContent = 'Choisis les fonctionnalit\u00e9s \u00e0 afficher. Le r\u00e9glage est enregistr\u00e9 sur le serveur pour ton troll : il te suit d\u2019un navigateur \u00e0 l\u2019autre. Il s\u2019applique \u00e0 l\u2019ouverture des pages suivantes.';
    var tb = document.createElement('table'); tb.className = 'mh_tdborder'; tb.style.cssText = 'width:100%';
    var boxes = [], statut = document.createElement('span'); statut.style.cssText = 'margin-left:10px;font-size:12px';
    var lire = function () { return boxes.filter(function (b) { return !b.cb.checked; }).map(function (b) { return b.k; }); };
    var sauve = function () {
      var l = lire(); featSetCache(troll, l); statut.textContent = 'Enregistrement\u2026';
      fetch(FEAT_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: 'troll=' + encodeURIComponent(troll) + '&desactivees=' + encodeURIComponent(l.join(',')), referrerPolicy: 'no-referrer' })
        .then(function (r) { statut.textContent = r.ok ? 'Enregistr\u00e9 sur le serveur \u2713' : 'Enregistrement impossible (serveur MH)'; }, function () { statut.textContent = 'Enregistrement impossible (serveur MH)'; });
    };
    FEATURES.forEach(function (g) {
      var tr = document.createElement('tr'), th = document.createElement('td'); th.className = 'mh_tdtitre'; th.colSpan = 2; th.textContent = g[0]; tr.appendChild(th); tb.appendChild(tr);
      g[1].forEach(function (f) {
        var r = document.createElement('tr'); r.className = 'mh_tdpage';
        var td = document.createElement('td'); td.style.width = '28px'; td.style.textAlign = 'center';
        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'mhx-f-' + f[0]; cb.checked = feat(f[0]);
        cb.addEventListener('change', sauve);
        td.appendChild(cb);
        var lb = document.createElement('td'), lab = document.createElement('label'); lab.htmlFor = cb.id; lab.textContent = f[1]; lab.style.cursor = 'pointer'; lb.appendChild(lab);
        r.appendChild(td); r.appendChild(lb); tb.appendChild(r); boxes.push({ k: f[0], cb: cb });
      });
    });
    var bar = document.createElement('p');
    [['Tout activer', true], ['Tout d\u00e9sactiver', false]].forEach(function (x) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'mh_form_submit'; b.textContent = x[0]; b.style.marginRight = '6px';
      b.addEventListener('click', function () { boxes.forEach(function (y) { y.cb.checked = x[1]; }); sauve(); });
      bar.appendChild(b);
    });
    bar.appendChild(statut);
    box.appendChild(h); box.appendChild(intro); box.appendChild(bar); box.appendChild(tb);
    var pied = document.getElementById('footer1');
    if (pied && pied.parentNode === main) main.insertBefore(box, pied); else main.appendChild(box);
    // reflete le dernier reglage du serveur (autre navigateur)
    featFetch(troll, function (l) { if (l) boxes.forEach(function (b) { b.cb.checked = l.indexOf(b.k) === -1; }); });
  }

  // Page de connexion du jeu : seuls les trolls de la liste peuvent cliquer sur les boutons ; pour les autres, ils s'enfuient (easter egg).
  // Lit uniquement le champ « Numero / nom » (jamais le mot de passe), n'envoie rien et ne journalise rien.
  function addLoginGarde() {
    var champ = document.getElementById('trollinput'), b1 = document.getElementById('loginbutton'), b2 = document.getElementById('viewbutton'), form = document.getElementById('loginform');
    if (!champ || !b1 || !b2 || !form || document.body.id !== 'login') return;
    var OK_NUM = ['95681', '101586', '101617', '101587', '113075', '113379', '113620'];
    var OK_NOM = ['perco', 'taotd', 'free', 'killdray', 'telekom', 'flak flak', 'minitel'];
    function permis() {
      var v = champ.value.replace(/\s+/g, ' ').replace(/^ | $/g, '').toLowerCase();
      return OK_NUM.indexOf(v) !== -1 || OK_NOM.indexOf(v) !== -1;
    }
    var btns = [b1, b2];
    function fuir(b) {
      if (permis()) return;
      var w = b.offsetWidth || 150, h = b.offsetHeight || 30;
      b.style.position = 'fixed'; b.style.zIndex = '9999'; b.style.transition = 'left .25s, top .25s';
      b.style.left = Math.max(0, Math.random() * (window.innerWidth - w)) + 'px';
      b.style.top = Math.max(0, Math.random() * (window.innerHeight - h)) + 'px';
    }
    function rendre() { if (permis()) btns.forEach(function (b) { b.style.position = ''; b.style.left = ''; b.style.top = ''; b.style.zIndex = ''; b.style.transition = ''; }); }
    btns.forEach(function (b) {
      ['mouseover', 'pointerdown', 'touchstart', 'focus'].forEach(function (ev) { b.addEventListener(ev, function (e) { if (!permis()) { e.preventDefault(); fuir(b); if (ev === 'focus') b.blur(); } }, true); });
      b.addEventListener('click', function (e) { if (!permis()) { e.preventDefault(); e.stopImmediatePropagation(); fuir(b); } }, true);
    });
    form.addEventListener('keypress', function (e) { if (!permis() && (e.key === 'Enter' || e.keyCode === 13)) { e.preventDefault(); e.stopImmediatePropagation(); btns.forEach(fuir); } }, true);
    form.addEventListener('submit', function (e) { if (!permis()) { e.preventDefault(); e.stopImmediatePropagation(); } }, true);
    champ.addEventListener('input', rendre);
  }


  // Page Ma vue : met a jour la vue du troll dans la base de l'IT (mh_sp_vue2) avec ce que la page affiche (lecture seule, aucune action en jeu).
  // Regles : jamais de suppression pour ce qui n'est pas affiche ; une categorie n'est envoyee que si son tableau est charge ;
  // si un filtre est actif (MZ, filtres du proxy, " Mais n'affiche pas ") la categorie est en " ajout seulement " ; le serveur ne supprime
  // que les lignes de la meme categorie situees dans le carre affiche (limite de vue) et absentes de la page.
  var VUE_MAJ_URL = 'https://mh.percolouco.com/notif/vue_maj.php';
  function sendVueMaj() {
    if (!VUE_RE.test(location.pathname)) return;
    var troll = vueTrollId();
    if (!troll) return;
    var TABLES = [['monstres', 'MONSTRES'], ['trolls', 'TROLLS'], ['tresors', 'TRESORS'], ['champignons', 'CHAMPIGNONS'], ['lieux', 'LIEUX']];
    var num = function (td) { var t = td ? td.textContent.trim() : ''; return /^-?\d+$/.test(t) ? parseInt(t, 10) : null; };
    var nomDe = function (tr, ref, cat) {
      var a = tr.querySelector('td a.monstre');
      if (a) return a.textContent.trim();
      var td = ref.nextElementSibling;
      while (td && /^(?:dist|actions|x|y|n)$/.test(td.className.split(' ')[0])) td = td.nextElementSibling;
      if (!td) return '';
      var sv = td.getAttribute('data-sort-value');
      if (sv) return sv.trim();
      var t = ''; td.childNodes.forEach(function (c) { if (c.nodeType === 3) t += c.nodeValue; });
      return t.trim();
    };
    var essais = 0;
    var tente = function () {
      essais++;
      var tables = TABLES.map(function (d) { return [d, document.getElementById('VUE_' + d[0])]; }).filter(function (x) { return x[1]; });
      var pret = tables.length && tables.every(function (x) { var tb = x[1].tBodies[0]; return tb && (tb.querySelector('td.ref') || tb.querySelector('tr.footable-empty')); });
      var txt = document.body.textContent.replace(/\s+/g, ' ');
      var pos = /X\s*=\s*(-?\d+)\s*\|\s*Y\s*=\s*(-?\d+)\s*\|\s*N\s*=\s*(-?\d+)/.exec(txt);
      var porte = /porte actuellement \u00e0\s*(\d+)\s*cases horizontalement et\s*(\d+)\s*verticalement/.exec(txt);
      var lim = /limit\u00e9 \u00e0\s*(\d+)\s*cases horizontalement et\s*(\d+)\s*verticalement/.exec(txt);
      if (!pret || !pos || !porte) { if (essais < 30) setTimeout(tente, 500); return; } // le jeu charge tableaux et encart apres la page ; page non reconnue : rien n'est envoye
      var h = parseInt(porte[1], 10), v = parseInt(porte[2], 10);
      if (lim) { h = Math.min(h, parseInt(lim[1], 10)); v = Math.min(v, parseInt(lim[2], 10)); }
      var tout = false; // " Mais n'affiche pas " non vide, ou " avec filtre " coche : le contenu n'est pas la vue complete
      document.querySelectorAll('li').forEach(function (li) {
        var t = li.textContent.replace(/\s+/g, ' ').trim();
        if (/^Mais n.affiche pas/.test(t) && t.replace(/^Mais n.affiche pas\s*:?/, '').trim() !== '') tout = true;
      });
      var avecFiltre = document.getElementById('MZVueExtFiltre');
      if (avecFiltre && avecFiltre.checked) tout = true;
      var cats = {}, complet = !tout && !lim;
      tables.forEach(function (x) {
        var d = x[0], t = x[1], rows = [], filtre = tout, bad = false;
        t.tBodies[0].querySelectorAll('tr').forEach(function (tr) {
          var ref = tr.querySelector('td.ref');
          if (!ref) return;
          if (window.getComputedStyle(tr).display === 'none') { filtre = true; return; } // ligne masquee par un filtre
          var id = ref.textContent.trim(), px = num(tr.querySelector('td.x')), py = num(tr.querySelector('td.y')), pn = num(tr.querySelector('td.n'));
          if (!/^\d+$/.test(id) || px === null || py === null || pn === null) { bad = true; return; }
          rows.push([id, nomDe(tr, ref, d[1]), px, py, pn]);
        });
        var bloc = t.closest('.collapsible-wrap') || t.parentNode;
        bloc.querySelectorAll('input[type=button]').forEach(function (b) { if (b.value === '\ud83d\uddd1' && b.style.display !== 'none') filtre = true; }); // filtre MZ actif
        if (d[0] === 'tresors' && document.querySelector('.mhx-tfiltre.mhx-actif')) filtre = true; // filtres du proxy sur les tresors
        if (bad) filtre = true;
        if (filtre) complet = false;
        cats[d[1]] = { r: rows, add: filtre };
      });
      var corps = 'troll=' + troll + '&data=' + encodeURIComponent(JSON.stringify({ o: [+pos[1], +pos[2], +pos[3]], h: h, v: v, cats: cats, complet: complet }));
      fetch(VUE_MAJ_URL, { method: 'POST', referrerPolicy: 'no-referrer', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: corps }).catch(function () {});
    };
    setTimeout(tente, 2500); // le jeu charge les tableaux apres l'ouverture de la page
  }

  function demarrer() { addLoginGarde(); try { var t = currentTrollId(); if (t) localStorage.setItem('mhx-troll', t); } catch (e) { /* ignore */ } addVueSwitch(); syncVuePref(); applyBlocs(); if (vueEnabled()) { feat('vue_pv') && addMonsterPv(); feat('vue_aggro') && addAggroCol(); feat('vue_gowaps_liste') && colorVueGowaps(); feat('vue_marques') && colorVueMarks(); feat('vue_filtres_tresors') && addTresorFilters(); feat('vue_effets') && addEffectIcons(); feat('vue_trolls_etat') && addTrollEtat(); feat('vue_sacro') && addSacroClick(); } feat('vue_maj_it') && sendVueMaj(); sendPortalNotice(); sendLancerNotice(); rememberGowapPerks(); feat('menu_it') && addItButton(); feat('menu_pistage') && addPistageImage(); feat('menu_ecuyers') && addEcuyers(); sendBonusMalus(); if (feat('turnstart_gowaps')) { majInfosGowaps(addMesGowaps); addMesGowaps(); if (/\/TurnStart\.php$/.test(location.pathname)) setInterval(function () { majInfosGowaps(addMesGowaps); }, 60000); } sendKiki(); feat('profil_kiki') && addKikiMeter(); feat('suivants_dla') && addFollowerDla(); feat('transbahuter_gowaps') && addTransbahuterGowaps(); sendMission(); sendTrollInfo(); feat('monstre_analyse') && addMonsterAnalysis(); feat('monstre_aggro') && addMonsterAggro(); feat('monstre_finisseurs') && addFinisseurs(); feat('tp_prepa') && addTpPrepa(); sendTresorsVue(); feat('ordres_tresors') && addTresorsOrdres(); addGowapVue(); feat('ordres_dla') && addOrdreDistance(); feat('ordres_tresors') && addAllerChercherPopup(); feat('ordres_parcours') && addParcoursRecolte(); rememberPosition(); feat('commandes') && addCommandesSync(); feat('vue_gowaps_ramasseurs') && addGowapEvents(); feat('vue_portails') && addPortailDest(); feat('vue_portails_sorties') && addTpAlerte(); feat('vue_hypno') && addHypnoVue(); feat('vue_chasse') && addChasse(); feat('vue_tresors_ident') && addTresorsIdent(); feat('evenements_scriz') && addEventDetails();  addFeaturesOptions(); }
  function init() { try { var t = currentTrollId(); if (t) localStorage.setItem('mhx-troll', t); } catch (e) { /* ignore */ } featLoad(demarrer); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
