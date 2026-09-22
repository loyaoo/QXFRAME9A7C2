// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { mergeOptions } from './options.js';

function defaultKey(entry, index) {
  if (entry && typeof entry === 'object') {
    if (entry.key !== undefined) return entry.key;
    if (entry.value !== undefined) return entry.value;
    if (entry.id !== undefined) return entry.id;
  }
  return entry === undefined || entry === null ? index : entry;
}

function create(options) {
  var opts = mergeOptions({ loop: false }, options);
  var localEntries = Array.isArray(opts.entries) ? opts.entries.slice()
    : (Array.isArray(opts.keys) ? opts.keys.slice() : []);
  var activeKey = opts.activeKey !== undefined ? String(opts.activeKey)
    : (opts.defaultActiveKey !== undefined ? String(opts.defaultActiveKey) : '');
  var emitter = Events.createEmitter();
  var destroyed = false;
  var mutationVersion = 0;
  var api = null;

  function sourceEntries() {
    if (destroyed) return [];
    var source = Utils.isFunction(opts.getEntries) ? opts.getEntries() : localEntries;
    return Array.isArray(source) ? source : [];
  }

  function normalizedEntries() {
    var getter = Utils.isFunction(opts.getKey) ? opts.getKey : defaultKey;
    return sourceEntries().map(function (entry, index) {
      var rawKey = getter(entry, index);
      var key = rawKey === undefined || rawKey === null ? String(index) : String(rawKey);
      var disabled = Utils.isFunction(opts.isDisabled)
        ? opts.isDisabled(entry, index) === true
        : !!(entry && typeof entry === 'object' && entry.disabled === true);
      return Object.freeze({ entry: entry, index: index, key: key, disabled: disabled });
    });
  }

  function enabledEntries() {
    return normalizedEntries().filter(function (entry) { return !entry.disabled; });
  }

  function set(nextKey, meta) {
    if (destroyed) return false;
    var normalized = nextKey === undefined || nextKey === null ? '' : String(nextKey);
    if (normalized) {
      var found = normalizedEntries().find(function (entry) { return entry.key === normalized; });
      if (!found || found.disabled) return false;
    }
    if (normalized === activeKey) return true;

    var detail = mergeOptions({
      key: normalized,
      previousKey: activeKey,
      reason: 'set',
      source: 'api',
      controller: api
    }, meta);

    var versionBefore = mutationVersion;
    if (Utils.isFunction(opts.beforeChange) && opts.beforeChange(detail) === false) return false;
    if (mutationVersion !== versionBefore) return false;
    activeKey = normalized;
    mutationVersion += 1;
    if (detail.silent !== true) {
      if (Utils.isFunction(opts.onChange)) opts.onChange(activeKey, detail);
      emitter.emit('change', detail);
    }
    return true;
  }

  function move(delta, meta) {
    if (destroyed) return false;
    var list = enabledEntries();
    if (!list.length) return set('', mergeOptions({ reason: 'empty' }, meta));

    var step = Number(delta || 0);
    if (!Number.isFinite(step) || step === 0) return true;
    step = step < 0 ? -1 : 1;

    var index = list.findIndex(function (entry) { return entry.key === activeKey; });
    if (index < 0) index = step < 0 ? list.length : -1;
    var nextIndex = index + step;

    if (opts.loop === true) {
      nextIndex = (nextIndex % list.length + list.length) % list.length;
    } else {
      nextIndex = Math.max(0, Math.min(list.length - 1, nextIndex));
    }

    return set(list[nextIndex].key, mergeOptions({
      reason: step < 0 ? 'previous' : 'next'
    }, meta));
  }

  function ensureValid(meta) {
    if (destroyed) return false;
    if (activeKey) {
      var found = normalizedEntries().find(function (entry) {
        return entry.key === activeKey && !entry.disabled;
      });
      if (found) return true;
    }
    var list = enabledEntries();
    return set(list.length ? list[0].key : '', mergeOptions({ reason: 'ensure-valid' }, meta));
  }

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (Object.keys(Object(next)).length) mutationVersion += 1;
    opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'entries')) {
      localEntries = Array.isArray(next.entries) ? next.entries.slice() : [];
      mutationVersion += 1;
    } else if (Object.prototype.hasOwnProperty.call(Object(next), 'keys')) {
      localEntries = Array.isArray(next.keys) ? next.keys.slice() : [];
      mutationVersion += 1;
    }
    if (Object.prototype.hasOwnProperty.call(Object(next), 'activeKey')) {
      set(next.activeKey, { silent: true, reason: 'options', source: 'options' });
    }
    return api;
  }

  function destroy() {
    if (destroyed) return false;
    mutationVersion += 1;
    destroyed = true;
    localEntries = [];
    activeKey = '';
    emitter.dispose();
    return true;
  }

  api = {
    set: set,
    clear: function (meta) { return set('', mergeOptions({ reason: 'clear' }, meta)); },
    first: function (meta) {
      var list = enabledEntries();
      return list.length ? set(list[0].key, mergeOptions({ reason: 'first' }, meta)) : false;
    },
    last: function (meta) {
      var list = enabledEntries();
      return list.length ? set(list[list.length - 1].key, mergeOptions({ reason: 'last' }, meta)) : false;
    },
    next: function (meta) { return move(1, meta); },
    previous: function (meta) { return move(-1, meta); },
    move: move,
    ensureValid: ensureValid,
    entries: normalizedEntries,
    enabledEntries: enabledEntries,
    updateOptions: updateOptions,
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };

  Object.defineProperties(api, {
    activeKey: { enumerable: true, get: function () { return activeKey; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });

  return api;
}

export const ActiveItem = Object.freeze({ create });
export { create };
