
import { Events } from './events.js';
import { mergeOptions } from './options.js';
import { Utils } from '../utils/utils.js';

function normalizeValue(value, accordion) {
    if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Disclosure value must be an array of keys.');
    var input = value;
    var seen = Object.create(null);
    var output = [];
    input.forEach(function (key) {
      var normalized = String(key);
      if (!normalized || seen[normalized]) return;
      seen[normalized] = true;
      output.push(normalized);
    });
    return accordion === true ? output.slice(0, 1) : output;
  }

  function create(options) {
    var supplied = options || {};
    var opts = mergeOptions({ accordion: false }, supplied);
    ['keys','activeKey','activeKeys','defaultActiveKey','defaultActiveKeys'].forEach(function (name) {
      if (Object.prototype.hasOwnProperty.call(Object(opts), name)) {
        throw new TypeError('[QXFRAME9A7C2] Disclosure does not accept legacy option "' + name + '".');
      }
    });
    var emitter = Events.createEmitter();
    var initialValue = Object.prototype.hasOwnProperty.call(Object(supplied), 'value') ? opts.value : (Object.prototype.hasOwnProperty.call(Object(supplied), 'defaultValue') ? opts.defaultValue : []);
    var value = normalizeValue(initialValue, opts.accordion === true);
    var destroyed = false;
    var api = null;

    function detail(base, meta) {
      return mergeOptions(mergeOptions({
        value: value.slice(), accordion: opts.accordion === true,
        reason: 'api', source: 'api', controller: api
      }, base), meta);
    }

    function commit(next, meta) {
      if (destroyed) return false;
      var normalized = normalizeValue(next, opts.accordion === true);
      var previous = value.slice();
      var same = normalized.length === previous.length && normalized.every(function (key, index) { return key === previous[index]; });
      if (same) return true;
      var payload = detail({ previousValue: previous, nextValue: normalized.slice() }, meta);
      if (Utils.isFunction(opts.beforeChange) && opts.beforeChange(normalized.slice(), payload) === false) return false;
      value = normalized;
      payload = detail({ previousValue: previous }, meta);
      if (!(meta && meta.silent)) {
        if (Utils.isFunction(opts.onChange)) opts.onChange(value.slice(), payload);
        emitter.emit('change', payload);
      }
      return true;
    }

    function set(key, open, meta) {
      if (destroyed) return false;
      var normalized = String(key || '');
      if (!normalized) return false;
      var exists = value.indexOf(normalized) >= 0;
      var shouldOpen = open === true;
      if (exists === shouldOpen) return true;
      var next;
      if (shouldOpen) next = opts.accordion === true ? [normalized] : value.concat([normalized]);
      else next = value.filter(function (entry) { return entry !== normalized; });
      return commit(next, mergeOptions({ key: normalized, open: shouldOpen, reason: shouldOpen ? 'open' : 'close' }, meta));
    }

    function toggle(key, meta) {
      var normalized = String(key || '');
      return set(normalized, value.indexOf(normalized) < 0, mergeOptions({ reason: 'toggle' }, meta));
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      ['keys','activeKey','activeKeys','defaultActiveKey','defaultActiveKeys'].forEach(function (name) {
        if (Object.prototype.hasOwnProperty.call(Object(next), name)) {
          throw new TypeError('[QXFRAME9A7C2] Disclosure does not accept legacy option "' + name + '".');
        }
      });
      var candidateOptions = mergeOptions(opts, next);
      var candidateValue = value.slice();
      if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) candidateValue = normalizeValue(next.value, candidateOptions.accordion === true);
      else if (Object.prototype.hasOwnProperty.call(Object(next), 'accordion')) candidateValue = normalizeValue(value, candidateOptions.accordion === true);
      opts = candidateOptions;
      value = candidateValue;
      return api;
    }

    api = Object.freeze({
      setValue: function (next, meta) { return commit(next, mergeOptions({ reason: 'set-value' }, meta)); },
      set: set,
      toggle: toggle,
      has: function (key) { return value.indexOf(String(key)) >= 0; },
      updateOptions: updateOptions,
      getState: function () { return Object.freeze({ value: value.slice(), accordion: opts.accordion === true, destroyed: destroyed }); },
      on: emitter.on,
      once: emitter.once,
      destroy: function () { if (destroyed) return false; destroyed = true; value = []; emitter.dispose(); return true; }
    });
    return api;
  }

export const Disclosure = Object.freeze({ create });
export { create };
