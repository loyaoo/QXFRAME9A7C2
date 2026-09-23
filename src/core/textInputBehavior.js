
import { Utils } from '../utils/utils.js';
const global = globalThis;

function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
  function text(value) { return value === undefined || value === null ? '' : String(value); }
  function finiteLength(value) {
    if (value === undefined || value === null || value === '') return null;
    var number = Math.floor(Number(value));
    return Number.isFinite(number) && number >= 0 ? number : null;
  }
  function countNative(value) { return text(value).length; }
  function countGrapheme(value) {
    var source = text(value);
    if (global.Intl && typeof global.Intl.Segmenter === 'function') {
      var segmenter = new global.Intl.Segmenter(undefined, { granularity: 'grapheme' });
      var count = 0;
      Array.from(segmenter.segment(source)).forEach(function () { count += 1; });
      return count;
    }
    return Array.from(source).length;
  }
  function lengthMode(value) {
    var mode = String(value || 'native').toLowerCase();
    if (mode !== 'native' && mode !== 'grapheme') throw new TypeError('[QXFRAME9A7C2] TextInputBehavior lengthMode must be "native" or "grapheme".');
    return mode;
  }
  function limitMode(value) {
    var mode = String(value || 'hard').toLowerCase();
    if (mode !== 'hard') throw new TypeError('[QXFRAME9A7C2] TextInputBehavior limitMode currently supports only "hard".');
    return mode;
  }

  function create(adapter, options) {
    if (!adapter || typeof adapter.getValue !== 'function' || typeof adapter.setValue !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] TextInputBehavior requires adapter.getValue() and adapter.setValue().');
    }
    var opts = Object.assign({ count: false, maxLength: null, minLength: null, lengthMode: 'native', limitMode: 'hard' }, options || {});
    lengthMode(opts.lengthMode);
    limitMode(opts.limitMode);
    var composing = false;
    var destroyed = false;
    var listeners = [];
    var state = null;

    function countValue(value) { return lengthMode(opts.lengthMode) === 'grapheme' ? countGrapheme(value) : countNative(value); }
    function snapshot() {
      var value = text(adapter.getValue());
      var current = countValue(value);
      var max = finiteLength(opts.maxLength);
      var min = finiteLength(opts.minLength);
      return Object.freeze({
        value: value,
        current: current,
        max: max,
        min: min,
        remaining: max === null ? null : max - current,
        overMax: max !== null && current > max,
        underMin: min !== null && current < min,
        composing: composing,
        count: opts.count === true,
        lengthMode: lengthMode(opts.lengthMode),
        limitMode: limitMode(opts.limitMode)
      });
    }
    function emit() {
      state = snapshot();
      listeners.slice().forEach(function (listener) { listener(state); });
      return state;
    }
    function clear(meta) {
      if (destroyed) return false;
      if (typeof adapter.isDisabled === 'function' && adapter.isDisabled()) return false;
      if (typeof adapter.isReadOnly === 'function' && adapter.isReadOnly()) return false;
      if (typeof adapter.requestClear === 'function') adapter.requestClear(meta || {});
      else adapter.setValue('', meta || {});
      if (typeof adapter.requestFocus === 'function') adapter.requestFocus();
      emit();
      return true;
    }
    function updateOptions(next) {
      if (destroyed) return api;
      var patch = next || {};
      if (hasOwn(patch, 'lengthMode')) lengthMode(patch.lengthMode);
      if (hasOwn(patch, 'limitMode')) limitMode(patch.limitMode);
      Utils.copyOwn(opts, patch);
      emit();
      return api;
    }
    function subscribe(listener) {
      if (typeof listener !== 'function') throw new TypeError('[QXFRAME9A7C2] TextInputBehavior.subscribe requires a function.');
      listeners.push(listener);
      listener(state || emit());
      var active = true;
      return function () { if (!active) return false; active = false; var index = listeners.indexOf(listener); if (index >= 0) listeners.splice(index, 1); return true; };
    }
    function setComposing(value) { composing = value === true; emit(); return api; }

    var api = Object.freeze({
      sync: emit,
      clear: clear,
      setComposing: setComposing,
      updateOptions: updateOptions,
      getState: function () { return state || emit(); },
      formatCount: function () { var current = (state || emit()).current, max = finiteLength(opts.maxLength); return max === null ? String(current) : (current + '/' + max); },
      subscribe: subscribe,
      destroy: function () { if (destroyed) return false; destroyed = true; listeners.length = 0; return true; }
    });
    state = snapshot();
    return api;
  }

export const TextInputBehavior = Object.freeze({ create, countNative, countGrapheme });
export { create, countNative, countGrapheme };
