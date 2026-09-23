
function isFunction(value) { return typeof value === 'function'; }
function noop() {}
function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function normalizeEnum(value, values, fallback, label) {
  var text = String(value == null ? fallback : value).toLowerCase();
  if (values.indexOf(text) >= 0) return text;
  if (fallback !== undefined) return fallback;
  throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be one of: ' + values.join(', ') + '.');
}
function normalizeSize(value, fallback) { return normalizeEnum(value, ['xs','sm','md','lg','xl'], fallback || 'md', 'size'); }
function finiteNumber(value, fallback, label) {
  var number = Number(value == null ? fallback : value);
  if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be finite.');
  return number;
}
function positiveInt(value, fallback, label) {
  var number = Math.floor(finiteNumber(value, fallback, label));
  if (number <= 0) throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be a positive integer.');
  return number;
}
function nonNegativeInt(value, fallback, label) {
  var number = Math.floor(finiteNumber(value, fallback, label));
  if (number < 0) throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be a non-negative integer.');
  return number;
}
function booleanValue(value, fallback, label) {
  if (value === undefined || value === null) return fallback;
  if (typeof value !== 'boolean') throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be boolean.');
  return value;
}
function enumValue(value, values, fallback, label) {
  var resolved = value === undefined || value === null || value === '' ? fallback : String(value);
  if (values.indexOf(resolved) >= 0) return resolved;
  throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be one of: ' + values.join(', ') + '.');
}
function finiteAtLeast(value, fallback, minimum, label) {
  if (value === undefined || value === null || value === '') return fallback;
  var number = Number(value);
  if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'value') + ' must be finite.');
  return minimum === undefined || minimum === null ? number : Math.max(Number(minimum), number);
}
function safeOwnKey(key) { return key !== '__proto__' && key !== 'prototype' && key !== 'constructor'; }
function copyOwn(target, source) {
  Object.keys(Object(source || {})).forEach(function (key) {
    if (!safeOwnKey(key)) return;
    target[key] = source[key];
  });
  return target;
}
function immutablePatch(current, next, normalizers) {
  var output = copyOwn({}, current || {}), patch = next || {}, rules = normalizers || {};
  Object.keys(Object(patch)).forEach(function (key) {
    if (!safeOwnKey(key)) return;
    output[key] = isFunction(rules[key]) ? rules[key](patch[key], output, patch) : patch[key];
  });
  return Object.freeze(output);
}

export const Utils = Object.freeze({
    isFunction,
    noop,
    own,
    normalizeEnum,
    normalizeSize,
    finiteNumber,
    positiveInt,
    nonNegativeInt,
    booleanValue,
    enumValue,
    finiteAtLeast,
    copyOwn,
    immutablePatch
});

export { isFunction, noop, own, normalizeEnum, normalizeSize, finiteNumber, positiveInt, nonNegativeInt, booleanValue, enumValue, finiteAtLeast, copyOwn, immutablePatch };
