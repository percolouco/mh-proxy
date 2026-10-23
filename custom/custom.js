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
      // dans le bloc « poids porté » (2e enfant) pour ne pas décaler la mise en page de l'encart
      var poids = h3.nextElementSibling;
      (poids && poids.tagName === 'DIV' ? poids : box).appendChild(el);
    });
  }
  function init() { addItButton(); addFollowerDla(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
