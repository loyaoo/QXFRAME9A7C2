
(function (window, document) {
  'use strict';

  var root = document.documentElement;
  var buttons = Array.from(document.querySelectorAll('[data-qxframe9a7c2-theme-toggle]'));

  function currentTheme() {
    return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    var normalized = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', normalized);
    root.classList.toggle('qxframe9a7c2-theme-dark', normalized === 'dark');
    root.classList.toggle('qxframe9a7c2-theme-light', normalized !== 'dark');
    buttons.forEach(function (button) {
      button.textContent = normalized === 'dark' ? '切换为浅色' : '切换为深色';
      button.classList.toggle('is-active', normalized === 'dark');
    });
    return normalized;
  }

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      setTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  });

  window.QXFRAME9A7C2Docs = {
    getTheme: currentTheme,
    setTheme: setTheme
  };

  setTheme(currentTheme());
})(window, document);
