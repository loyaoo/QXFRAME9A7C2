
import { Events } from './events.js';
import { StateController } from './stateController.js';
import { mergeOptions } from './options.js';
import { Utils } from '../utils/utils.js';

function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }

  function normalizeDecimal(value) {
    if (value === null || value === undefined || value === '') return '';
    var text = String(value).trim();
    if (!text) return '';
    var sign = '';
    if (text.charAt(0) === '+' || text.charAt(0) === '-') {
      if (text.charAt(0) === '-') sign = '-';
      text = text.slice(1);
    }
    var parts = text.split('.');
    var integer = (parts.shift() || '').replace(/\D+/g, '') || '0';
    var decimal = parts.join('').replace(/\D+/g, '');
    integer = integer.replace(/^0+(?=\d)/, '') || '0';
    var out = sign + integer + (decimal ? '.' + decimal : '');
    return out === '-0' ? '0' : out;
  }

  function isCompleteDecimal(value) {
    return /^-?(?:\d+|\d*\.\d+)$/.test(String(value == null ? '' : value));
  }

  function decimalPrecision(value) {
    var text = String(value == null ? '' : value).toLowerCase();
    if (!text) return 0;
    var exponentMatch = text.match(/e([+-]?\d+)$/);
    var exponent = exponentMatch ? Number(exponentMatch[1]) : 0;
    var base = exponentMatch ? text.slice(0, exponentMatch.index) : text;
    var decimal = base.indexOf('.') >= 0 ? base.length - base.indexOf('.') - 1 : 0;
    return Math.max(0, decimal - exponent);
  }

  function toScaledInteger(value, scale) {
    var normalized = normalizeDecimal(value) || '0';
    var negative = normalized.charAt(0) === '-';
    var unsigned = negative ? normalized.slice(1) : normalized;
    var parts = unsigned.split('.');
    var integer = parts[0] || '0';
    var decimal = (parts[1] || '').padEnd(scale, '0').slice(0, scale);
    var digits = (integer + decimal).replace(/^0+(?=\d)/, '') || '0';
    var output = BigInt(digits);
    return negative ? -output : output;
  }

  function fromScaledInteger(value, scale) {
    var negative = value < 0n;
    var digits = String(negative ? -value : value);
    if (scale > 0) digits = digits.padStart(scale + 1, '0');
    var integer = scale > 0 ? digits.slice(0, -scale) : digits;
    var decimal = scale > 0 ? digits.slice(-scale).replace(/0+$/, '') : '';
    var text = (negative ? '-' : '') + (integer || '0') + (decimal ? '.' + decimal : '');
    return text === '-0' ? '0' : text;
  }

  function compareDecimal(left, right) {
    var scale = Math.max(decimalPrecision(left), decimalPrecision(right));
    var a = toScaledInteger(left, scale);
    var b = toScaledInteger(right, scale);
    return a === b ? 0 : (a > b ? 1 : -1);
  }

  function addDecimal(left, right) {
    var scale = Math.max(decimalPrecision(left), decimalPrecision(right));
    return fromScaledInteger(toScaledInteger(left || 0, scale) + toScaledInteger(right || 0, scale), scale);
  }

  function multiplyDecimal(value, multiplier) {
    var scale = decimalPrecision(value);
    return fromScaledInteger(toScaledInteger(value || 0, scale) * BigInt(multiplier), scale);
  }

  function roundDecimal(value, precision) {
    if (value === '' || value === null || value === undefined) return '';
    var target = Math.max(0, Number(precision) || 0);
    var normalized = normalizeDecimal(value);
    var sourcePrecision = decimalPrecision(normalized);
    if (sourcePrecision <= target) {
      if (target === 0) return normalized.split('.')[0];
      var existing = normalized.split('.');
      return existing[0] + '.' + (existing[1] || '').padEnd(target, '0');
    }
    var negative = normalized.charAt(0) === '-';
    var unsigned = negative ? normalized.slice(1) : normalized;
    var parts = unsigned.split('.');
    var integer = parts[0] || '0';
    var decimal = parts[1] || '';
    var kept = decimal.slice(0, target);
    var nextDigit = Number(decimal.charAt(target) || 0);
    var scaled = BigInt((integer + kept) || '0');
    if (nextDigit >= 5) scaled += 1n;
    var result = fromScaledInteger(negative ? -scaled : scaled, target);
    if (target === 0) return result;
    var resultParts = result.split('.');
    return resultParts[0] + '.' + (resultParts[1] || '').padEnd(target, '0');
  }

  function create(options) {
    var opts = mergeOptions({ step: 1, stringMode: false, disabled: false, readOnly: false }, options);
    var emitter = Events.createEmitter();
    var destroyed = false;
    var api = null;
    var valueState = null;
    var inputValue = '';
    var userTyping = false;

    function currentValue() { return valueState ? valueState.value : null; }

    function external(canonical) {
      if (canonical === null || canonical === undefined || canonical === '') return null;
      return opts.stringMode === true ? String(canonical) : Number(canonical);
    }

    function parseDisplay(display) {
      var raw = String(display == null ? '' : display);
      if (Utils.isFunction(opts.parser)) {
        var current = currentValue();
        var custom = opts.parser(raw, Object.freeze({ previousValue: external(current), stringValue: current === null ? '' : String(current), inputValue: inputValue, userTyping: userTyping, controller: api }));
        if (custom && Utils.isFunction(custom.then)) throw new TypeError('[QXFRAME9A7C2] NumericInput parser must be synchronous.');
        return custom === undefined || custom === null ? '' : String(custom);
      }
      var text = raw;
      if (opts.decimalSeparator && String(opts.decimalSeparator) !== '.') {
        text = text.split(String(opts.decimalSeparator)).join('.');
      }
      text = text.replace(/[^\d+\-.]/g, '');
      var negative = text.charAt(0) === '-';
      text = text.replace(/[+-]/g, '');
      var firstDot = text.indexOf('.');
      if (firstDot >= 0) text = text.slice(0, firstDot + 1) + text.slice(firstDot + 1).replace(/\./g, '');
      return (negative ? '-' : '') + text;
    }

    function resolvedPrecision(canonical, typing) {
      if (typing) return null;
      if (Number.isInteger(Number(opts.precision)) && Number(opts.precision) >= 0) return Number(opts.precision);
      return Math.max(decimalPrecision(canonical), decimalPrecision(opts.step));
    }

    function formatValue(canonical, typing) {
      if (canonical === null || canonical === undefined || canonical === '') return '';
      var text = String(canonical);
      if (Utils.isFunction(opts.formatter)) {
        var formatted = opts.formatter(external(text), Object.freeze({ userTyping: typing === true, inputValue: inputValue, stringValue: text, controller: api }));
        if (formatted && Utils.isFunction(formatted.then)) throw new TypeError('[QXFRAME9A7C2] NumericInput formatter must be synchronous.');
        return formatted === undefined || formatted === null ? '' : String(formatted);
      }
      if (typing) return text;
      var precision = resolvedPrecision(text, false);
      var output = precision === null ? text : roundDecimal(text, precision);
      if (opts.decimalSeparator && String(opts.decimalSeparator) !== '.') output = output.replace('.', String(opts.decimalSeparator));
      return output;
    }

    function formatUserCommitted(canonical) {
      if (canonical === null || canonical === undefined || canonical === '') return '';
      var text = String(canonical);
      if (Utils.isFunction(opts.formatter)) {
        var formatted = opts.formatter(external(text), Object.freeze({ userTyping: false, inputValue: inputValue, stringValue: text, controller: api }));
        if (formatted && Utils.isFunction(formatted.then)) throw new TypeError('[QXFRAME9A7C2] NumericInput formatter must be synchronous.');
        return formatted === undefined || formatted === null ? '' : String(formatted);
      }
      if (opts.decimalSeparator && String(opts.decimalSeparator) !== '.') text = text.replace('.', String(opts.decimalSeparator));
      return text;
    }

    function inRange(canonical) {
      if (canonical === null || canonical === undefined || canonical === '') return true;
      if (opts.min !== undefined && opts.min !== null && compareDecimal(canonical, opts.min) < 0) return false;
      if (opts.max !== undefined && opts.max !== null && compareDecimal(canonical, opts.max) > 0) return false;
      return true;
    }

    function clamp(canonical) {
      if (canonical === null || canonical === undefined || canonical === '') return '';
      if (opts.min !== undefined && opts.min !== null && compareDecimal(canonical, opts.min) < 0) return normalizeDecimal(opts.min);
      if (opts.max !== undefined && opts.max !== null && compareDecimal(canonical, opts.max) > 0) return normalizeDecimal(opts.max);
      return normalizeDecimal(canonical);
    }

    function normalizeCommitted(canonical) {
      if (canonical === null || canonical === undefined || canonical === '') return '';
      var next = clamp(canonical);
      var precision = resolvedPrecision(next, false);
      if (precision !== null) next = roundDecimal(next, precision);
      next = clamp(next);
      if (precision !== null) next = roundDecimal(next, precision);
      return next;
    }

    function snapshot() {
      var value = currentValue();
      var atMax = value !== null && opts.max !== undefined && opts.max !== null && compareDecimal(value, opts.max) >= 0;
      var atMin = value !== null && opts.min !== undefined && opts.min !== null && compareDecimal(value, opts.min) <= 0;
      return Object.freeze({
        value: external(value), stringValue: value === null ? '' : String(value), inputValue: inputValue,
        userTyping: userTyping, controlled: !!(valueState && valueState.controlled), disabled: opts.disabled === true, readOnly: opts.readOnly === true,
        upDisabled: opts.disabled === true || opts.readOnly === true || atMax,
        downDisabled: opts.disabled === true || opts.readOnly === true || atMin,
        destroyed: destroyed
      });
    }

    function detail(meta, previous, proposed) {
      var value = arguments.length >= 3 ? proposed : currentValue();
      return mergeOptions({ value: external(value), stringValue: value === null ? '' : String(value), inputValue: inputValue, previousValue: external(previous), controlled: !!(valueState && valueState.controlled), source: 'api', reason: 'api', controller: api }, meta);
    }

    function emitInput(meta) {
      var value = currentValue();
      var payload = detail(meta, value);
      if (Utils.isFunction(opts.onInput)) opts.onInput(inputValue, payload);
      if (destroyed) return false;
      emitter.emit('input', payload);
      return !destroyed;
    }

    function commit(next, meta) {
      var cfg = meta || {};
      var normalized = next === null || next === undefined || next === '' ? null : normalizeDecimal(next);
      var previous = currentValue();
      var changed = String(previous === null ? '' : previous) !== String(normalized === null ? '' : normalized);
      if (changed) {
        if (cfg.request === true && valueState.controlled) valueState.requestChange(normalized, mergeOptions({ silent: true }, cfg));
        else valueState.setValue(normalized, mergeOptions({ silent: true }, cfg));
      }
      var resolved = currentValue();
      if (cfg.preserveInput !== true) inputValue = formatValue(resolved, cfg.userTyping === true);
      if (changed && cfg.silent !== true) {
        var payload = detail(cfg, previous, normalized);
        if (Utils.isFunction(opts.onChange)) opts.onChange(external(normalized), payload);
        if (!destroyed) emitter.emit('change', payload);
      }
      return changed;
    }

    function collectInput(display, meta) {
      if (destroyed) return false;
      userTyping = true;
      inputValue = String(display == null ? '' : display);
      if (emitInput(meta) === false || destroyed) return false;
      if (meta && meta.composing === true) return true;
      var parsed = parseDisplay(inputValue);
      if (parsed === '') {
        commit(null, mergeOptions({ reason: 'input', source: 'input', userTyping: true, preserveInput: true, request: true }, meta));
        return true;
      }
      if (!isCompleteDecimal(parsed)) return true;
      var normalized = normalizeDecimal(parsed);
      if (!inRange(normalized)) return true;
      // A complete in-range manual decimal is already a valid committed value.
      // Keep its exact canonical precision while the editor remains a draft.
      // `precision` still owns programmatic set/step and clamp normalization,
      // but blur must not rewrite an accepted manual 1.201111 back to 1.20.
      commit(normalized, mergeOptions({ reason: 'input', source: 'input', userTyping: true, preserveInput: true, request: true }, meta));
      return true;
    }

    function restoreInput(meta) {
      if (destroyed) return false;
      userTyping = false;
      var value = currentValue();
      inputValue = formatValue(value, false);
      if (!(meta && meta.silent)) emitter.emit('display-reset', detail(meta, value));
      return true;
    }

    function flush(meta) {
      if (destroyed) return false;
      var parsed = parseDisplay(inputValue);
      if (!parsed || parsed === '-' || parsed === '.' || parsed === '-.') {
        if (!parsed) commit(null, mergeOptions({ reason: 'flush', source: 'api', request: true }, meta));
        userTyping = false;
        inputValue = formatValue(currentValue(), false);
        return true;
      }
      if (!isCompleteDecimal(parsed)) return restoreInput(meta);
      userTyping = false;
      var normalized = normalizeDecimal(parsed);
      var clamped = clamp(normalized);
      var didClamp = String(clamped) !== String(normalized);
      var committed = didClamp ? normalizeCommitted(clamped) : normalized;
      commit(committed, mergeOptions({ reason: 'flush', source: 'api', preserveInput: true, request: true }, meta));
      inputValue = valueState.controlled ? formatValue(currentValue(), false) : (didClamp ? formatValue(currentValue(), false) : formatUserCommitted(currentValue()));
      return true;
    }

    function setValue(next, meta) {
      if (destroyed) return false;
      var cfg = meta || {};
      if (next === null || next === undefined || next === '') {
        userTyping = false;
        commit(null, mergeOptions({ reason: 'set-value', source: 'api' }, cfg));
        inputValue = formatValue(currentValue(), false);
        return true;
      }
      var parsed = parseDisplay(next);
      if (!isCompleteDecimal(parsed)) {
        if (cfg.strict === true) throw new TypeError('[QXFRAME9A7C2] NumericInput value must be a complete decimal.');
        return false;
      }
      userTyping = false;
      commit(normalizeCommitted(parsed), mergeOptions({ reason: 'set-value', source: 'api' }, cfg));
      inputValue = formatValue(currentValue(), false);
      return true;
    }

    function stepBase() {
      var value = currentValue();
      if (value !== null) return value;
      if (opts.min !== undefined && opts.min !== null && compareDecimal(opts.min, 0) > 0) return normalizeDecimal(opts.min);
      return '0';
    }

    function step(direction, meta) {
      if (destroyed || opts.disabled === true || opts.readOnly === true) return false;
      var up = Number(direction) >= 0;
      var multiplier = meta && Number.isInteger(Number(meta.multiplier)) ? Number(meta.multiplier) : 1;
      var signed = (up ? 1 : -1) * multiplier;
      var offset = multiplyDecimal(opts.step === undefined ? 1 : opts.step, signed);
      var previous = currentValue();
      var proposed = normalizeCommitted(addDecimal(stepBase(), offset));
      userTyping = false;
      commit(proposed, mergeOptions({ reason: 'step', source: 'step', request: true }, meta));
      inputValue = formatValue(currentValue(), false);
      var payload = detail(mergeOptions({ type: up ? 'up' : 'down', offset: opts.stringMode === true ? String(offset) : Number(offset) }, meta), previous, proposed);
      if (Utils.isFunction(opts.onStep)) opts.onStep(external(proposed), payload);
      if (destroyed) return true;
      emitter.emit('step', payload);
      return true;
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      var previousOptions = opts;
      var candidate = mergeOptions(opts, next);
      var nextCanonical = currentValue();
      var nextDisplay;
      // Preflight every parser/formatter path against the candidate before committing either
      // options or value state. User callbacks may throw and must leave the instance unchanged.
      opts = candidate;
      try {
        if (hasOwn(next, 'value')) {
          var externalParsed = next.value === null || next.value === undefined || next.value === '' ? '' : parseDisplay(next.value);
          nextCanonical = externalParsed && isCompleteDecimal(externalParsed) ? normalizeCommitted(externalParsed) : null;
        } else if (nextCanonical !== null) nextCanonical = normalizeCommitted(nextCanonical);
        nextDisplay = formatValue(nextCanonical, false);
      } catch (error) {
        opts = previousOptions;
        throw error;
      }
      if (hasOwn(next, 'value')) {
        valueState.setControlled(true);
        valueState.syncExternal(nextCanonical, { silent: true, reason: 'options-value', source: 'options' });
      } else if (currentValue() !== null) valueState.setValue(nextCanonical, { silent: true, reason: 'options-renormalize', source: 'options' });
      inputValue = nextDisplay;
      return api;
    }

    var initial = hasOwn(opts, 'value') ? opts.value : (hasOwn(opts, 'defaultValue') ? opts.defaultValue : null);
    var initialValue = null;
    if (initial !== null && initial !== undefined && initial !== '') {
      var parsedInitial = parseDisplay(initial);
      initialValue = isCompleteDecimal(parsedInitial) ? normalizeCommitted(parsedInitial) : null;
    }
    valueState = StateController.create({ value: initialValue, controlled: hasOwn(options || {}, 'value') });
    inputValue = formatValue(currentValue(), false);

    api = Object.freeze({
      collectInput: collectInput,
      flush: flush,
      restoreInput: restoreInput,
      setValue: setValue,
      step: step,
      stepUp: function (meta) { return step(1, meta); },
      stepDown: function (meta) { return step(-1, meta); },
      updateOptions: updateOptions,
      getState: snapshot,
      on: emitter.on,
      once: emitter.once,
      destroy: function () { if (destroyed) return false; destroyed = true; if (valueState) valueState.destroy(); valueState = null; inputValue = ''; emitter.dispose(); return true; }
    });
    return api;
  }

export const NumericInput = Object.freeze({ create });
export { create };
