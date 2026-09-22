// Canonical hierarchy traversal/query algorithms. Components supply item semantics through ItemAccessors or explicit callbacks.
import { ItemAccessors } from '../core/itemAccessors.js';
import { Utils } from './utils.js';

function resolveAccessors(options) {
  var opts = options || {};
  if (opts.accessors && typeof opts.accessors === 'object') return opts.accessors;
  return ItemAccessors.create({
    getKey: opts.getKey,
    getValue: opts.getValue,
    getLabel: opts.getLabel,
    getChildren: opts.getChildren || opts.childrenOf,
    isDisabled: opts.isDisabled || opts.isItemDisabled
  });
}
function roots(items) { return Array.isArray(items) ? items : []; }
function recordFor(task, accessors) {
  var item = task.item, index = task.index;
  var key = accessors.key(item, index);
  var value = accessors.value(item, index);
  var label = accessors.label(item, index);
  var children = accessors.children(item, index);
  return {
    item:item, index:index, depth:task.depth, parent:task.parent,
    key:key, value:value, label:label, disabled:accessors.disabled(item, index), children:children,
    path:task.path.concat(item), pathKeys:task.pathKeys.concat(key)
  };
}
function visit(items, visitor, options) {
  if (!Utils.isFunction(visitor)) throw new TypeError('[QXFRAME9A7C2] TreeQuery.visit requires a visitor function.');
  var accessors = resolveAccessors(options);
  var source = roots(items);
  var stack = [];
  for (var i = source.length - 1; i >= 0; i -= 1) stack.push({ item:source[i], index:i, depth:0, parent:null, path:[], pathKeys:[] });
  while (stack.length) {
    var task = stack.pop();
    var record = recordFor(task, accessors);
    var result = visitor(record);
    if (result === false) return record;
    if (result === TreeQuery.SKIP_CHILDREN) continue;
    for (var childIndex = record.children.length - 1; childIndex >= 0; childIndex -= 1) {
      stack.push({ item:record.children[childIndex], index:childIndex, depth:record.depth + 1, parent:record, path:record.path, pathKeys:record.pathKeys });
    }
  }
  return null;
}
function find(items, predicate, options) {
  if (!Utils.isFunction(predicate)) throw new TypeError('[QXFRAME9A7C2] TreeQuery.find requires a predicate function.');
  var found = null;
  visit(items, function (record) { if (predicate(record)) { found = record; return false; } }, options);
  return found;
}
function sameToken(left, right) { return String(left === undefined || left === null ? '' : left) === String(right === undefined || right === null ? '' : right); }
function findByKey(items, key, options) { return find(items, function (record) { return sameToken(record.key, key); }, options); }
function findByValue(items, value, options) { return find(items, function (record) { return sameToken(record.value, value); }, options); }
function location(items, target, options) { return find(items, function (record) { return record.item === target; }, options); }
function findPath(items, target, options) {
  var opts = options || {};
  var record;
  if (Utils.isFunction(target)) record = find(items, target, opts);
  else if (opts.by === 'key') record = findByKey(items, target, opts);
  else if (opts.by === 'item' || (target && typeof target === 'object' && opts.by !== 'value')) record = location(items, target, opts);
  else record = findByValue(items, target, opts);
  return record ? record.path.slice() : [];
}
function findPathByKeys(items, keys, options) {
  var accessors = resolveAccessors(options);
  var cursor = roots(items), path = [];
  var values = Array.isArray(keys) ? keys : [];
  for (var depth = 0; depth < values.length; depth += 1) {
    var found = null;
    for (var index = 0; index < cursor.length; index += 1) {
      if (sameToken(accessors.key(cursor[index], index), values[depth])) { found = { item:cursor[index], index:index }; break; }
    }
    if (!found) break;
    path.push(found.item);
    cursor = accessors.children(found.item, found.index);
  }
  return path;
}
function filterPaths(items, predicate, options) {
  if (!Utils.isFunction(predicate)) throw new TypeError('[QXFRAME9A7C2] TreeQuery.filterPaths requires a predicate function.');
  var output = [];
  visit(items, function (record) { if (predicate(record)) output.push(record.path.slice()); }, options);
  return output;
}
function index(items, options) {
  var opts = options || {};
  var records = [], byKey = new Map(), byValue = new Map(), byItem = typeof WeakMap === 'function' ? new WeakMap() : null;
  visit(items, function (record) {
    records.push(record);
    if (record.key !== undefined && record.key !== null && record.key !== '') {
      var key = String(record.key);
      if (opts.uniqueKeys === true && byKey.has(key)) throw new TypeError('[QXFRAME9A7C2] TreeQuery duplicate key: ' + key);
      if (!byKey.has(key)) byKey.set(key, record);
    }
    if (record.value !== undefined && record.value !== null) {
      var value = String(record.value);
      if (opts.uniqueValues === true && byValue.has(value)) throw new TypeError('[QXFRAME9A7C2] TreeQuery duplicate value: ' + value);
      if (!byValue.has(value)) byValue.set(value, record);
    }
    if (byItem && record.item && typeof record.item === 'object') byItem.set(record.item, record);
  }, opts);
  return Object.freeze({ records:records, byKey:byKey, byValue:byValue, byItem:byItem });
}

export const TreeQuery = Object.freeze({
  SKIP_CHILDREN: Symbol('TreeQuery.skipChildren'),
  visit, find, findByKey, findByValue, findPath, findPathByKeys, filterPaths, location, index
});
