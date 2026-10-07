(function (global, document) {
  'use strict';

  /* Docs theme state: light / dark only (createApp v3 stage 2).
   * Style, colors, fonts and radius are customised in createApp (docs/create/), which exports a
   * theme CSS file; the docs site always shows the default theme built into qxframe.css.
   * Dark mode is the `.dark` class on <html> (v3 §5). */
  var STORAGE_KEY = 'qxframe9a7c2-docs-theme-v2';
  var DEFAULTS = Object.freeze({ mode: 'light' });
  var media = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
  var state = load();

  function normalize(source) {
    var mode = source && source.mode;
    return { mode: mode === 'dark' || mode === 'light' || mode === 'system' ? mode : DEFAULTS.mode };
  }
  function load() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (_) {}
    return normalize(DEFAULTS);
  }
  function save() {
    try { if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }
  function effectiveMode(input) {
    var value = input || state;
    if (value.mode === 'system') return media && media.matches ? 'dark' : 'light';
    return value.mode === 'dark' ? 'dark' : 'light';
  }
  function getState() { return Object.assign({}, state, { effectiveMode: effectiveMode(state) }); }
  function apply(next, options) {
    options = options || {};
    state = normalize(Object.assign({}, state, next || {}));
    var mode = effectiveMode(state);
    var root = document.documentElement;
    root.classList.toggle('dark', mode === 'dark');
    root.classList.toggle('qxframe9a7c2-theme-dark', mode === 'dark');
    root.classList.toggle('qxframe9a7c2-theme-light', mode !== 'dark');
    root.setAttribute('data-theme', mode);
    if (options.persist !== false) save();
    if (options.emit !== false && typeof global.CustomEvent === 'function') {
      global.dispatchEvent(new CustomEvent('qxframe9a7c2:docs-theme-change', { detail: getState() }));
    }
    return getState();
  }
  function reset(options) { state = normalize(DEFAULTS); return apply(state, options); }
  function setState(next, options) { return apply(next, options); }

  if (media && typeof media.addEventListener === 'function') {
    media.addEventListener('change', function () { if (state.mode === 'system') apply(null, { persist: false }); });
  }
  global.addEventListener('storage', function (event) {
    if (event && event.key === STORAGE_KEY) { state = load(); apply(state, { persist: false }); }
  });

  global.QXFRAME9A7C2_DOCS_THEME = Object.freeze({
    storageKey: STORAGE_KEY,
    createAppUrl: 'create/',
    presets: [],
    bases: {},
    fonts: {},
    defaults: DEFAULTS,
    getColorOverrides: function () { return {}; },
    getState: getState,
    setState: setState,
    reset: reset,
    apply: apply,
    effectiveMode: function () { return effectiveMode(state); }
  });

  // Apply before first paint.
  apply(state, { persist: false, emit: false });
})(window, document);
