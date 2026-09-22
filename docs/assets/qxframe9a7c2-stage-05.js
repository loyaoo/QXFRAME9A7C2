(function (global, document) {
  'use strict';

  var portalRoot = null;
  var source = document.getElementById('stage05-portal-source');
  var metrics = document.getElementById('stage05-portal-metrics');
  var sizes = ['is-xs', 'is-sm', 'is-md', 'is-lg', 'is-xl'];
  var themes = ['qxframe9a7c2-theme-light', 'qxframe9a7c2-theme-dark'];

  function removeClasses(node, names) {
    names.forEach(function (name) { node.classList.remove(name); });
  }

  function activeClass(node, names, fallback) {
    for (var i = 0; i < names.length; i += 1) {
      if (node.classList.contains(names[i])) return names[i];
    }
    return fallback;
  }

  function ensurePortal() {
    if (portalRoot) return portalRoot;
    portalRoot = document.createElement('div');
    portalRoot.id = 'stage05-portal-root';
    portalRoot.className = 'qxframe9a7c2-stage05-portal';

    var label = document.createElement('div');
    label.className = 'qxframe9a7c2-stage05-portal-label';
    label.textContent = 'Portal root · 已脱离 source DOM';

    var control = document.createElement('button');
    control.type = 'button';
    control.className = 'qxframe9a7c2-control-contract is-primary is-solid';
    control.textContent = 'Portal Control';

    portalRoot.appendChild(label);
    portalRoot.appendChild(control);
    document.body.appendChild(portalRoot);
    return portalRoot;
  }

  function syncPortalContext() {
    var target = ensurePortal();
    removeClasses(target, sizes.concat(themes));

    var sizeClass = activeClass(source, sizes, 'is-md');
    var themeClass = activeClass(source, themes, 'qxframe9a7c2-theme-light');
    target.classList.add(sizeClass);
    target.classList.add(themeClass);

    var a = global.getComputedStyle(source.querySelector('.qxframe9a7c2-control-contract'));
    var b = global.getComputedStyle(target.querySelector('.qxframe9a7c2-control-contract'));

    metrics.textContent = JSON.stringify({
      copiedContext: [themeClass, sizeClass],
      sourceHeight: a.minHeight,
      portalHeight: b.minHeight,
      sourceColor: a.color,
      portalColor: b.color,
      sameHeight: a.minHeight === b.minHeight,
      sameColor: a.color === b.color
    }, null, 2);
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-stage05-size]'), function (button) {
    button.addEventListener('click', function () {
      var next = button.getAttribute('data-stage05-size');
      if (sizes.indexOf(next) < 0) return;
      removeClasses(source, sizes);
      source.classList.add(next);
      syncPortalContext();
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('[data-stage05-theme]'), function (button) {
    button.addEventListener('click', function () {
      var next = button.getAttribute('data-stage05-theme');
      if (themes.indexOf(next) < 0) return;
      removeClasses(source, themes);
      source.classList.add(next);
      syncPortalContext();
    });
  });

  document.getElementById('stage05-portal-toggle').addEventListener('click', function () {
    var target = ensurePortal();
    target.hidden = !target.hidden;
    if (!target.hidden) syncPortalContext();
  });

  syncPortalContext();

  global.QXFRAME9A7C2Stage05Demo = {
    syncPortalContext: syncPortalContext,
    getPortalRoot: function () { return portalRoot; }
  };
})(window, document);
