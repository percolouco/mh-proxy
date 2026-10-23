// Surcouche perso MountyHall — chargée dans chaque page via le proxy.
// Ne fait que de l'affichage / lecture : jamais d'action automatique dans le jeu.
(function () {
  if (window.__mhx) return; // la page peut être injectée deux fois (voir nginx.conf)
  window.__mhx = true;

  // Bouton « IT » dans le menu de gauche : ouvre la page tactique de mh.percolouco.com
  // dans le cadre de contenu (le <base target="Contenu"> du menu s'applique).
  function addItButton() {
    if (!/\/Play_menu\.php$/.test(location.pathname)) return;
    var last = document.querySelector('menu a.interface-taniere');
    if (!last || document.querySelector('a.interface-it')) return;
    var a = document.createElement('a');
    a.href = 'https://mh.percolouco.com/tactique/tactique.php';
    a.className = 'interface-it';
    a.textContent = 'IT';
    last.parentNode.insertBefore(a, last.nextSibling);
    last.parentNode.insertBefore(document.createElement('br'), a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addItButton);
  else addItButton();
})();
