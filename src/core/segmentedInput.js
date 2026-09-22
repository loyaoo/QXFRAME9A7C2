// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Events } from './events.js';
import { mergeOptions } from './options.js';
import { Utils } from '../utils/utils.js';

function normalizeSegments(segments) {
    var seen = Object.create(null);
    return (Array.isArray(segments) ? segments : []).map(function (segment, index) {
      if (!segment || typeof segment !== 'object') throw new TypeError('[QXFRAME9A7C2] SegmentedInput segments must be objects.');
      var key = segment.key === undefined || segment.key === null || segment.key === '' ? '' : String(segment.key);
      if (!key) throw new TypeError('[QXFRAME9A7C2] SegmentedInput segment.key is required.');
      if (seen[key]) throw new TypeError('[QXFRAME9A7C2] SegmentedInput segment.key must be unique: ' + key + '.');
      seen[key] = true;
      var maxLength = Math.max(0, Math.floor(Number(segment.maxLength) || 0));
      return Object.freeze({
        key: key, placeholder: segment.placeholder == null ? '' : String(segment.placeholder),
        maxLength: maxLength, inputMode: segment.inputMode == null ? '' : String(segment.inputMode),
        autocomplete: segment.autocomplete == null ? 'off' : String(segment.autocomplete),
        type: segment.type == null ? 'text' : String(segment.type),
        disabled: segment.disabled === true, readOnly: segment.readOnly === true,
        mask: segment.mask === true ? '•' : (typeof segment.mask === 'string' ? segment.mask.charAt(0) : '')
      });
    });
  }

  function create(options) {
    var opts = mergeOptions({ segments: [], segmentValues: [], separator: '' }, options);
    var emitter = Events.createEmitter();
    var segments = normalizeSegments(opts.segments);
    if (!segments.length) throw new TypeError('[QXFRAME9A7C2] SegmentedInput requires at least one segment.');
    var destroyed = false;
    var api = null;

    function normalizeValues(values) {
      var input = Array.isArray(values) ? values : [];
      return segments.map(function (segment, index) {
        var value = input[index] === undefined || input[index] === null ? '' : String(input[index]);
        return segment.maxLength ? value.slice(0, segment.maxLength) : value;
      });
    }

    function adapter() {
      var valueAdapter = opts.valueAdapter;
      if (valueAdapter == null) return null;
      if (!valueAdapter || typeof valueAdapter !== 'object' || !Utils.isFunction(valueAdapter.toValue) || !Utils.isFunction(valueAdapter.toSegments)) {
        throw new TypeError('[QXFRAME9A7C2] SegmentedInput valueAdapter requires toValue and toSegments functions.');
      }
      return valueAdapter;
    }

    function context(values) {
      var map = {};
      segments.forEach(function (segment, index) { map[segment.key] = values[index] || ''; });
      return Object.freeze({ segments: segments.slice(), values: values.slice(), valueMap: Object.freeze(map), controller: api });
    }

    function toValue(values) {
      var a = adapter();
      if (!a) return values.slice();
      var result = a.toValue(values.slice(), context(values));
      if (result && Utils.isFunction(result.then)) throw new TypeError('[QXFRAME9A7C2] SegmentedInput valueAdapter must be synchronous.');
      return result;
    }

    function fromValue(value) {
      var a = adapter();
      if (!a) return normalizeValues(Array.isArray(value) ? value : []);
      var result = a.toSegments(value, context(values));
      if (result && Utils.isFunction(result.then)) throw new TypeError('[QXFRAME9A7C2] SegmentedInput valueAdapter must be synchronous.');
      if (result && !Array.isArray(result) && typeof result === 'object') {
        result = segments.map(function (segment) { return result[segment.key]; });
      }
      return normalizeValues(result);
    }

    var values = opts.value !== undefined ? [] : normalizeValues(opts.segmentValues);
    if (opts.value !== undefined) values = fromValue(opts.value);
    else if (opts.defaultValue !== undefined) values = fromValue(opts.defaultValue);

    function payload(base, meta) {
      return mergeOptions(mergeOptions({
        values: values.slice(), value: toValue(values), complete: values.every(function (value) { return value !== ''; }),
        controller: api, source: 'api', reason: 'api'
      }, base), meta);
    }

    function emitChange(previous, meta) {
      var detail = payload({ previousValues: previous }, meta);
      if (Utils.isFunction(opts.onInput)) opts.onInput(values.slice(), detail);
      emitter.emit('input', detail);
      if (Utils.isFunction(opts.onChange)) opts.onChange(detail.value, detail);
      emitter.emit('change', detail);
      if (detail.complete) {
        if (Utils.isFunction(opts.onComplete)) opts.onComplete(detail.value, detail);
        emitter.emit('complete', detail);
      }
    }

    function setValues(next, meta) {
      if (destroyed) return false;
      var normalized = normalizeValues(next);
      var previous = values;
      values = normalized;
      if (!(meta && meta.silent)) emitChange(previous, meta);
      return true;
    }

    function setValue(value, meta) { return setValues(fromValue(value), meta); }

    function normalizeText(index, text) {
      var segment = segments[index];
      var next = text === undefined || text === null ? '' : String(text);
      if (Utils.isFunction(opts.formatSegment)) next = opts.formatSegment(next, index, segment, context(values));
      next = next === undefined || next === null ? '' : String(next);
      return segment.maxLength ? next.slice(0, segment.maxLength) : next;
    }

    function patch(index, text, meta) {
      if (destroyed) return false;
      index = Number(index);
      if (!Number.isInteger(index) || index < 0 || index >= segments.length) return false;
      var previous = values;
      var next = values.slice();
      next[index] = normalizeText(index, text);
      values = next;
      if (!(meta && meta.silent)) emitChange(previous, meta);
      return true;
    }

    function distribute(index, text, meta) {
      if (destroyed) return -1;
      index = Number(index);
      if (!Number.isInteger(index) || index < 0 || index >= segments.length) return -1;
      var raw = text === undefined || text === null ? '' : String(text);
      var next = values.slice();
      var cursor = 0;
      var last = index;
      for (var i = index; i < segments.length && cursor < raw.length; i += 1) {
        var cap = segments[i].maxLength;
        if (!cap) {
          next[i] = normalizeText(i, raw.slice(cursor));
          cursor = raw.length;
          last = i;
          break;
        }
        var sourceChunk = '';
        var normalized = '';
        while (cursor < raw.length && Array.from(normalized).length < cap) {
          sourceChunk += raw.charAt(cursor);
          cursor += 1;
          normalized = normalizeText(i, sourceChunk);
        }
        next[i] = normalized;
        last = i;
      }
      var previous = values;
      values = next;
      if (!(meta && meta.silent)) emitChange(previous, meta);
      return last;
    }

    function erasePrevious(index, meta) {
      if (destroyed || index <= 0) return false;
      var previousIndex = index - 1;
      var current = values[previousIndex] || '';
      if (!current) return false;
      return patch(previousIndex, current.slice(0, -1), mergeOptions({ reason: 'backspace-previous', source: 'keyboard' }, meta));
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      if (Object.prototype.hasOwnProperty.call(Object(next), 'segments')) throw new Error('[QXFRAME9A7C2] SegmentedInput segments are immutable; destroy and recreate to change structure.');
      opts = mergeOptions(opts, next);
      adapter();
      if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) setValue(next.value, { silent: true, reason: 'options-value', source: 'options' });
      if (Object.prototype.hasOwnProperty.call(Object(next), 'segmentValues')) setValues(next.segmentValues, { silent: true, reason: 'options-values', source: 'options' });
      return api;
    }

    api = Object.freeze({
      setValues: setValues, setValue: setValue, patch: patch, distribute: distribute, erasePrevious: erasePrevious,
      updateOptions: updateOptions,
      getState: function () { var detail = payload(); return Object.freeze({ segments: segments.slice(), values: values.slice(), value: detail.value, valueMap: context(values).valueMap, complete: detail.complete, destroyed: destroyed }); },
      on: emitter.on, once: emitter.once,
      destroy: function () { if (destroyed) return false; destroyed = true; values = []; segments = []; emitter.dispose(); return true; }
    });
    return api;
  }

export const SegmentedInput = Object.freeze({ create });
export { create };
