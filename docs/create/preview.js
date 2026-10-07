// Preview iframe runtime: receives the compiled theme from the createApp host and
// forwards shortcuts / outside clicks back to it (v3 §3.1).
(function () {
  var root = document.documentElement;
  var styleEl = document.createElement('style');
  styleEl.id = 'qxframe9a7c2-create-theme';
  document.head.appendChild(styleEl);
  var host = window.parent && window.parent !== window ? window.parent : null;
  var origin = window.location.origin === 'null' ? '*' : window.location.origin;

  function apply(data) {
    styleEl.textContent = data.css || '';
    root.setAttribute('data-qxframe9a7c2-style', data.style || 'nova');
    root.setAttribute('data-qxframe9a7c2-theme', data.mode === 'dark' ? 'dark' : 'light');
    root.toggleAttribute('data-create-menu-inverted', Boolean(data.menuInverted));
    root.toggleAttribute('data-create-menu-translucent', Boolean(data.menuTranslucent));
  }

  window.addEventListener('message', function (event) {
    if (event.source !== host || !event.data || event.data.type !== 'qxframe9a7c2-create:apply') return;
    apply(event.data);
  });

  function typing(target) {
    return target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
  }
  document.addEventListener('keydown', function (event) {
    if (!host || typing(event.target)) return;
    var key = String(event.key || '').toLowerCase();
    var mod = event.metaKey || event.ctrlKey;
    var handled = (mod && (key === 'z' || (key === 'y' && event.ctrlKey))) || (!mod && !event.altKey && /^[rdo]$/.test(key));
    if (!handled) return;
    event.preventDefault();
    host.postMessage({ type: 'qxframe9a7c2-create:key', key: event.key, shiftKey: event.shiftKey, metaKey: event.metaKey, ctrlKey: event.ctrlKey, altKey: event.altKey }, origin);
  });
  document.addEventListener('pointerdown', function () {
    if (host) host.postMessage({ type: 'qxframe9a7c2-create:pointer' }, origin);
  });
  if (host) host.postMessage({ type: 'qxframe9a7c2-create:ready' }, origin);
})();
