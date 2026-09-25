
import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { mergeOptions } from './options.js';
import { DataRevision } from './dataRevision.js';

function asArray(value) {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value.slice() : [value];
}

function defaultKey(value) {
  if (value && typeof value === 'object') {
    if (value.key !== undefined) return value.key;
    if (value.value !== undefined) return value.value;
    if (value.id !== undefined) return value.id;
  }
  return value;
}

function create(options) {
  var opts = mergeOptions({ multiple: false, maxCount: 0 }, options);
  var store = new Set();
  var emitter = Events.createEmitter();
  var destroyed = false;
  var dataRevision = DataRevision.create();
  var api = null;

  function keyOf(value) {
    var getter = Utils.isFunction(opts.getKey) ? opts.getKey : defaultKey;
    var raw = getter(value);
    return raw === undefined || raw === null ? '' : String(raw);
  }

  function normalize(next) {
    var seen = Object.create(null);
    var output = [];
    asArray(next).forEach(function (item) {
      var key = keyOf(item);
      if (!key || seen[key]) return;
      seen[key] = true;
      output.push(key);
    });
    if (opts.multiple !== true && output.length > 1) output = output.slice(0, 1);
    return output;
  }

  function values() {
    return Array.from(store);
  }

  function sameKeys(left, right) {
    if (left.length !== right.length) return false;
    for (var index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) return false;
    }
    return true;
  }

  function commit(next, meta) {
    if (destroyed) return false;
    var normalized = normalize(next);
    var previous = values();
    var nextSet = new Set(normalized);
    var maxCount = Math.max(0, Number(opts.maxCount || 0));
    var payload = mergeOptions({
      previousValues: previous.slice(),
      values: normalized.slice(),
      addedValues: normalized.filter(function (key) { return !store.has(key); }),
      removedValues: previous.filter(function (key) { return !nextSet.has(key); }),
      reason: 'set',
      source: 'api',
      controller: api
    }, meta);

    if (maxCount > 0 && normalized.length > maxCount) {
      payload.rejected = true;
      payload.reason = 'max-count';
      payload.maxCount = maxCount;
      if (Utils.isFunction(opts.onMaxCount)) opts.onMaxCount(payload);
      emitter.emit('max-count', payload);
      return false;
    }

    if (sameKeys(previous, normalized)) return true;
    var versionBefore = dataRevision.current();
    if (Utils.isFunction(opts.beforeChange) && opts.beforeChange(payload) === false) return false;
    if (dataRevision.current() !== versionBefore) return false;

    store.clear();
    normalized.forEach(function (key) { store.add(key); });
    dataRevision.advance();
    payload.values = values();
    if (payload.silent !== true) {
      if (Utils.isFunction(opts.onChange)) opts.onChange(payload.values.slice(), payload);
      emitter.emit('change', payload);
    }
    return true;
  }

  function select(value, meta) {
    if (destroyed) return false;
    var key = keyOf(value);
    if (!key) return false;
    if (Utils.isFunction(opts.isDisabled) && opts.isDisabled(key, meta || {}) === true) return false;
    if (opts.multiple === true) {
      var next = values();
      if (next.indexOf(key) < 0) next.push(key);
      return commit(next, mergeOptions({ reason: 'select', key: key }, meta));
    }
    return commit([key], mergeOptions({ reason: 'select', key: key }, meta));
  }

  function deselect(value, meta) {
    if (destroyed) return false;
    var key = keyOf(value);
    if (!store.has(key)) return true;
    return commit(
      values().filter(function (item) { return item !== key; }),
      mergeOptions({ reason: 'deselect', key: key }, meta)
    );
  }

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (Object.keys(Object(next)).length) dataRevision.advance();
    opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'values')) {
      commit(next.values, { silent: true, reason: 'options', source: 'options' });
    } else if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) {
      commit(next.value, { silent: true, reason: 'options', source: 'options' });
    } else if (opts.multiple !== true && store.size > 1) {
      commit(values().slice(0, 1), { silent: true, reason: 'mode-change', source: 'options' });
    }
    return api;
  }

  function destroy() {
    if (destroyed) return false;
    dataRevision.advance();
    destroyed = true;
    store.clear();
    emitter.dispose();
    dataRevision.destroy();
    return true;
  }

  api = {
    has: function (value) { return store.has(keyOf(value)); },
    set: commit,
    replace: commit,
    select: select,
    deselect: deselect,
    toggle: function (value, desired, meta) {
      var key = keyOf(value);
      var next = desired === undefined ? !store.has(key) : desired !== false;
      return next ? select(key, meta) : deselect(key, meta);
    },
    clear: function (meta) { return commit([], mergeOptions({ reason: 'clear' }, meta)); },
    updateOptions: updateOptions,
    createRef: function (key) { return dataRevision.capture(String(key)); },
    isCurrentRef: function (ref) { return dataRevision.isCurrent(ref); },
    snapshot: function () {
      var current = values();
      return Object.freeze({
        values: current,
        value: opts.multiple === true ? current.slice() : (current[0] === undefined ? null : current[0]),
        size: store.size,
        multiple: opts.multiple === true,
        dataRevision: dataRevision.current(),
        destroyed: destroyed
      });
    },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };

  Object.defineProperties(api, {
    values: { enumerable: true, get: values },
    value: {
      enumerable: true,
      get: function () {
        var current = values();
        return opts.multiple === true ? current : (current[0] === undefined ? null : current[0]);
      }
    },
    size: { enumerable: true, get: function () { return store.size; } },
    multiple: { enumerable: true, get: function () { return opts.multiple === true; } },
    dataRevision: { enumerable: true, get: function () { return dataRevision.current(); } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });

  var initial = opts.values !== undefined ? opts.values
    : (opts.value !== undefined ? opts.value : opts.defaultValue);
  commit(initial, { silent: true, reason: 'init', source: 'init' });

  return api;
}

export const Selection = Object.freeze({ create });
export { create };
