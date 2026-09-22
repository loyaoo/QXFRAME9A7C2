(function (global, document) {
  'use strict';

  var STORAGE_KEY = 'qxframe9a7c2-docs-theme-v2';
  var LEGACY_PLAYGROUND_KEY = 'qxframe9a7c2-theme-playground-v1';
  var LEGACY_MODE_KEY = 'qxframe9a7c2-docs-theme';
  var PRESETS = Object.freeze([
    Object.freeze({ key: 'nova', name: 'Nova', seed: '#5b5bd6' }),
    Object.freeze({ key: 'ocean', name: 'Ocean', seed: '#2563eb' }),
    Object.freeze({ key: 'violet', name: 'Violet', seed: '#7c3aed' }),
    Object.freeze({ key: 'emerald', name: 'Emerald', seed: '#059669' }),
    Object.freeze({ key: 'amber', name: 'Amber', seed: '#d97706' }),
    Object.freeze({ key: 'rose', name: 'Rose', seed: '#e11d48' })
  ]);
  var BASES = Object.freeze({
    mixed: Object.freeze({ name: 'Mixed · r2 曲线 × 强度', palette: null }),
    grey: Object.freeze({ name: 'Grey · 纯灰', palette: 'grey' }),
    gray: Object.freeze({ name: 'Gray · 冷灰', palette: 'gray' })
  });
  var FONTS = Object.freeze({
    inter: Object.freeze({ name: 'Inter', value: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }),
    system: Object.freeze({ name: 'System', value: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }),
    humanist: Object.freeze({ name: 'Humanist', value: '"Trebuchet MS", "Segoe UI", ui-sans-serif, system-ui, sans-serif' }),
    serif: Object.freeze({ name: 'Serif', value: 'Georgia, "Times New Roman", serif' }),
    mono: Object.freeze({ name: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' })
  });
  var DEFAULTS = Object.freeze({
    mode: 'light', preset: 'nova', primarySeed: '#5b5bd6', base: 'mixed', mixRatio: 100, mixCurveVersion: 2, font: 'inter', radius: 8, focusRing: 2
  });
  var media = global.matchMedia ? global.matchMedia('(prefers-color-scheme: dark)') : null;
  var state = load();

  function clamp(value, min, max) {
    var number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : min;
  }
  function parse(raw) {
    if (!raw) return null;
    try { var value = JSON.parse(raw); return value && typeof value === 'object' ? value : null; } catch (_) { return null; }
  }
  function presetFor(seed, key) {
    var normalized = String(seed || '').toLowerCase();
    var exact = PRESETS.find(function (entry) { return entry.seed.toLowerCase() === normalized; });
    if (exact) return exact.key;
    return PRESETS.some(function (entry) { return entry.key === key; }) ? key : 'custom';
  }
  function normalize(input) {
    var source = Object.assign({}, DEFAULTS, input || {});
    var primarySeed = /^#[0-9a-f]{6}$/i.test(String(source.primarySeed || '')) ? String(source.primarySeed) : DEFAULTS.primarySeed;
    var mode = source.mode === 'dark' || source.mode === 'system' ? source.mode : 'light';
    var base = BASES[source.base] ? source.base : DEFAULTS.base;
    var font = FONTS[source.font] ? source.font : DEFAULTS.font;
    var mixCurveVersion = Number(source.mixCurveVersion) || 0;
    var mixRatio = mixCurveVersion >= 2 && source.mixRatio != null ? clamp(source.mixRatio, 0, 100) : DEFAULTS.mixRatio;
    return {
      mode: mode,
      preset: presetFor(primarySeed, source.preset),
      primarySeed: primarySeed,
      base: base,
      mixRatio: mixRatio,
      mixCurveVersion: DEFAULTS.mixCurveVersion,
      font: font,
      radius: clamp(source.radius, 0, 24),
      focusRing: clamp(source.focusRing, 1, 4)
    };
  }
  function load() {
    var shared = null;
    try { shared = parse(global.localStorage && global.localStorage.getItem(STORAGE_KEY)); } catch (_) {}
    if (shared) return normalize(shared);

    var legacyPlayground = null;
    try { legacyPlayground = parse(global.localStorage && global.localStorage.getItem(LEGACY_PLAYGROUND_KEY)); } catch (_) {}
    if (legacyPlayground) return normalize({
      mode: legacyPlayground.mode,
      preset: legacyPlayground.preset,
      primarySeed: legacyPlayground.primarySeed || legacyPlayground.customPrimary,
      base: legacyPlayground.base,
      mixRatio: legacyPlayground.mixRatio,
      font: legacyPlayground.font,
      radius: legacyPlayground.radius,
      focusRing: legacyPlayground.focusRing
    });

    var legacyMode = '';
    try { legacyMode = global.localStorage && global.localStorage.getItem(LEGACY_MODE_KEY) || ''; } catch (_) {}
    return normalize({ mode: legacyMode === 'dark' ? 'dark' : DEFAULTS.mode });
  }
  function save() {
    try { if (global.localStorage) global.localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }
  function effectiveMode(input) {
    var value = input || state;
    if (value.mode === 'system') return media && media.matches ? 'dark' : 'light';
    return value.mode === 'dark' ? 'dark' : 'light';
  }
  function setPublic(name, value) {
    var root = document.documentElement;
    if (value == null || value === '') root.style.removeProperty(name);
    else root.style.setProperty(name, value);
  }
  function apply(next, options) {
    options = options || {};
    state = normalize(Object.assign({}, state, next || {}));
    var mode = effectiveMode(state);
    var root = document.documentElement;
    var selectedBase = BASES[state.base];
    root.classList.toggle('qxframe9a7c2-theme-dark', mode === 'dark');
    root.classList.toggle('qxframe9a7c2-theme-light', mode !== 'dark');
    root.setAttribute('data-theme', mode);
    root.setAttribute('data-qxframe9a7c2-theme', mode);
    setPublic('--qxframe9a7c2-theme-primary', state.primarySeed);
    setPublic('--qxframe9a7c2-theme-neutral-mix-ratio', state.mixRatio + '%');
    for (var step = 1; step <= 13; step += 1) {
      setPublic('--qxframe9a7c2-theme-primary-' + step, null);
      setPublic('--qxframe9a7c2-theme-neutral-' + step, selectedBase.palette ? 'rgb(var(--qxframe9a7c2-color-' + selectedBase.palette + '-' + step + '))' : null);
    }
    setPublic('--qxframe9a7c2-theme-radius', state.radius + 'px');
    setPublic('--qxframe9a7c2-theme-font-family', FONTS[state.font].value);
    setPublic('--qxframe9a7c2-theme-focus-ring-size', state.focusRing + 'px');

    /* Docs chrome and component demos must consume the same canonical semantic owner.
     * Clear legacy direct semantic overrides rather than creating a second docs palette. */
    ['light', 'dark'].forEach(function (themeMode) {
      ['bg', 'surface', 'surface-raised', 'surface-muted', 'text', 'text-secondary', 'text-muted', 'text-placeholder', 'border', 'border-subtle', 'border-strong'].forEach(function (name) {
        setPublic('--qxframe9a7c2-theme-' + themeMode + '-' + name, null);
      });
    });
    ['bg', 'surface', 'surface-raised', 'surface-muted', 'text', 'text-secondary', 'text-muted', 'text-placeholder', 'border', 'border-subtle', 'border-strong'].forEach(function (name) {
      setPublic('--qxframe9a7c2-semantic-' + name, null);
    });

    if (options.persist !== false) save();
    if (options.emit !== false && typeof global.CustomEvent === 'function') {
      global.dispatchEvent(new CustomEvent('qxframe9a7c2:docs-theme-change', { detail: getState() }));
    }
    return getState();
  }
  function getState() { return Object.assign({}, state, { effectiveMode: effectiveMode(state) }); }
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
    presets: PRESETS,
    bases: BASES,
    fonts: FONTS,
    defaults: DEFAULTS,
    getState: getState,
    setState: setState,
    reset: reset,
    apply: apply,
    effectiveMode: function () { return effectiveMode(state); }
  });

  /* Apply before the runtime CSS arrives. The public slots remain valid unresolved var() values
   * and resolve as soon as the canonical stylesheet is loaded, preventing docs-only theme drift. */
  apply(state, { persist: false, emit: false });
})(window, document);
