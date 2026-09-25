
import { Utils } from './utils.js';
function equals(left, right, comparator) {
  return typeof comparator === 'function' ? comparator(left, right) === true : Object.is(left, right);
}
function array(left, right, comparator) {
  if (Object.is(left, right)) return true;
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  for (var i = 0; i < left.length; i += 1) if (!equals(left[i], right[i], comparator)) return false;
  return true;
}
function valueTag(value) { return Object.prototype.toString.call(value); }
function deep(left, right) {
  var seen = typeof WeakMap === 'function' ? new WeakMap() : null;
  function visit(a, b) {
    if (Object.is(a, b)) return true;
    if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
    var aTag = valueTag(a), bTag = valueTag(b);
    if (aTag !== bTag || Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;
    if (aTag === '[object Date]') return Number(a.getTime()) === Number(b.getTime());
    if (aTag === '[object RegExp]') return a.source === b.source && a.flags === b.flags;
    if (seen) {
      var mapped = seen.get(a);
      if (mapped) return mapped === b;
      seen.set(a, b);
    }
    if (aTag === '[object Array]') {
      if (a.length !== b.length) return false;
      for (var ai = 0; ai < a.length; ai += 1) if (!visit(a[ai], b[ai])) return false;
      return true;
    }
    if (aTag === '[object Map]') {
      if (a.size !== b.size) return false;
      for (var mapEntry of a) {
        if (!b.has(mapEntry[0]) || !visit(mapEntry[1], b.get(mapEntry[0]))) return false;
      }
      return true;
    }
    if (aTag === '[object Set]') {
      if (a.size !== b.size) return false;
      for (var setValue of a) if (!b.has(setValue)) return false;
      return true;
    }
    if (aTag !== '[object Object]') return false;
    var ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (var i = 0; i < ak.length; i += 1) {
      var key = ak[i];
      if (!Object.prototype.hasOwnProperty.call(b, key) || !visit(a[key], b[key])) return false;
    }
    return true;
  }
  return visit(left, right);
}
function copy(value, copier) { if (typeof copier === 'function') return copier(value); if (Array.isArray(value)) return value.slice(); if (valueTag(value) === '[object Date]') return new Date(value.getTime()); return value; }
function copyDeep(value, seen) {
  if (!value || typeof value !== 'object') return value;
  var tag = valueTag(value);
  if (tag === '[object Date]') return new Date(value.getTime());
  var memo = seen || (typeof WeakMap === 'function' ? new WeakMap() : null);
  if (memo && memo.has(value)) return memo.get(value);
  if (tag === '[object Array]') {
    var arrayOutput = [];
    if (memo) memo.set(value, arrayOutput);
    value.forEach(function (entry) { arrayOutput.push(copyDeep(entry, memo)); });
    return arrayOutput;
  }
  if (tag !== '[object Object]') return value;
  var output = Object.getPrototypeOf(value) === null ? Object.create(null) : {};
  if (memo) memo.set(value, output);
  Object.keys(value).forEach(function (key) { if (Utils.safeOwnKey(key)) output[key] = copyDeep(value[key], memo); });
  return output;
}

export const ValueEquality = Object.freeze({ equals, array, deep, copy, copyDeep });
export { equals, array, deep, copy, copyDeep };
