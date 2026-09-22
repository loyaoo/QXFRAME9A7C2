// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { mergeOptions } from './options.js';

var LEGACY_OPTIONS = Object.freeze(['nodes', 'treeData', 'rootId', 'getId', 'getChildren', 'getParentId', 'fieldNames']);

function assertCanonicalOptions(options) {
  var source = options || {};
  LEGACY_OPTIONS.forEach(function (name) {
    if (Object.prototype.hasOwnProperty.call(source, name)) {
      throw new TypeError('[QXFRAME9A7C2] TreeModel no longer accepts legacy option "' + name + '". Use canonical items/key/items/parentKey mapping.');
    }
  });
}

function create(options) {
  assertCanonicalOptions(options);
  var opts = mergeOptions({ maxNodes: 100000 }, options);
  var emitter = Events.createEmitter();
  var destroyed = false;
  var api = null;

  var records = [];
  var recordMap = new Map();
  var childrenMap = new Map();
  var diagnostics = {
    duplicateKeys: 0,
    missingKeys: 0,
    repeatedObjects: 0,
    parentCycles: 0,
    limited: false
  };
  var rootKey = String(opts.rootKey || '__qxframe9a7c2_tree_root__');

  function getKey(item, index) {
    if (Utils.isFunction(opts.getKey)) return opts.getKey(item, index);
    if (!item || typeof item !== 'object') return item;
    if (item.key !== undefined) return item.key;
    if (item.id !== undefined) {
      throw new TypeError('[QXFRAME9A7C2] TreeModel item.id is not a canonical key field. Use item.key or explicit getKey().');
    }
    return undefined;
  }

  function getItems(item, index) {
    if (Utils.isFunction(opts.getItems)) {
      var supplied = opts.getItems(item, index);
      return Array.isArray(supplied) ? supplied : [];
    }
    if (!item || typeof item !== 'object') return [];
    if (item.items !== undefined) return Array.isArray(item.items) ? item.items : [];
    if (item.children !== undefined) {
      throw new TypeError('[QXFRAME9A7C2] TreeModel item.children is not canonical. Use item.items or explicit getItems().');
    }
    return [];
  }

  function getParentKey(item, index) {
    if (Utils.isFunction(opts.getParentKey)) return opts.getParentKey(item, index);
    if (!item || typeof item !== 'object') return rootKey;
    if (item.parentKey !== undefined) return item.parentKey;
    if (item.parentId !== undefined) {
      throw new TypeError('[QXFRAME9A7C2] TreeModel item.parentId is not canonical. Use item.parentKey or explicit getParentKey().');
    }
    return rootKey;
  }

  function resetDiagnostics() {
    diagnostics = {
      duplicateKeys: 0,
      missingKeys: 0,
      repeatedObjects: 0,
      parentCycles: 0,
      limited: false
    };
  }

  function rebuild(meta) {
    if (destroyed) return api;
    resetDiagnostics();

    var items = Array.isArray(opts.items) ? opts.items : [];
    var maxNodes = Math.max(1, Math.trunc(Number(opts.maxNodes || 100000)));
    var nextRecords = [];
    var nextMap = new Map();
    var nextChildren = new Map();
    var seenObjects = typeof WeakSet === 'function' ? new WeakSet() : null;
    var sequence = 0;

    var stack = [];
    for (var rootIndex = items.length - 1; rootIndex >= 0; rootIndex -= 1) {
      stack.push({ item: items[rootIndex], parentOverride: undefined, depthHint: undefined, index: rootIndex });
    }

    while (stack.length) {
      if (nextRecords.length >= maxNodes) {
        diagnostics.limited = true;
        break;
      }

      var task = stack.pop();
      var item = task.item;
      if (item === undefined || item === null) continue;

      if (seenObjects && item && typeof item === 'object') {
        if (seenObjects.has(item)) {
          diagnostics.repeatedObjects += 1;
          continue;
        }
        seenObjects.add(item);
      }

      var rawKey = getKey(item, task.index);
      var key = rawKey === undefined || rawKey === null ? '' : String(rawKey);
      if (!key) {
        diagnostics.missingKeys += 1;
        continue;
      }
      if (nextMap.has(key)) {
        diagnostics.duplicateKeys += 1;
        throw new Error('[QXFRAME9A7C2] TreeModel duplicate key: ' + key);
      }

      var nestedItems = getItems(item, task.index);
      var parentRaw = task.parentOverride !== undefined && task.parentOverride !== null
        ? task.parentOverride : getParentKey(item, task.index);
      var parentKey = parentRaw === undefined || parentRaw === null || parentRaw === ''
        ? rootKey : String(parentRaw);

      var record = Object.freeze({
        key: key,
        parentKey: parentKey,
        item: item,
        index: task.index,
        depth: task.depthHint === undefined ? -1 : task.depthHint,
        level: task.depthHint === undefined ? 0 : task.depthHint + 1,
        sequence: sequence += 1,
        order: Number(item && item.order || 0),
        nested: nestedItems.length > 0
      });

      nextMap.set(key, record);
      nextRecords.push(record);
      if (!nextChildren.has(parentKey)) nextChildren.set(parentKey, []);
      nextChildren.get(parentKey).push(record);

      for (var childIndex = nestedItems.length - 1; childIndex >= 0; childIndex -= 1) {
        stack.push({
          item: nestedItems[childIndex],
          parentOverride: key,
          depthHint: task.depthHint === undefined ? undefined : task.depthHint + 1,
          index: childIndex
        });
      }
    }

    var resolvedMap = new Map();
    nextRecords.forEach(function (record) {
      if (resolvedMap.has(record.key)) return;
      var path = [];
      var seen = new Set();
      var current = record;
      var baseDepth = -1;

      while (current && !resolvedMap.has(current.key)) {
        if (seen.has(current.key)) {
          diagnostics.parentCycles += 1;
          baseDepth = -1;
          break;
        }
        seen.add(current.key);
        path.push(current);
        if (current.parentKey === rootKey || !nextMap.has(current.parentKey)) {
          baseDepth = -1;
          break;
        }
        current = nextMap.get(current.parentKey);
      }

      if (current && resolvedMap.has(current.key)) baseDepth = resolvedMap.get(current.key).depth;

      for (var index = path.length - 1; index >= 0; index -= 1) {
        baseDepth += 1;
        var oldRecord = path[index];
        var resolved = Object.freeze({
          key: oldRecord.key,
          parentKey: oldRecord.parentKey,
          item: oldRecord.item,
          index: oldRecord.index,
          depth: baseDepth,
          level: baseDepth + 1,
          sequence: oldRecord.sequence,
          order: oldRecord.order,
          nested: oldRecord.nested
        });
        resolvedMap.set(resolved.key, resolved);
      }
    });

    nextRecords = nextRecords.map(function (record) { return resolvedMap.get(record.key) || record; });
    nextMap = new Map(nextRecords.map(function (record) { return [record.key, record]; }));
    nextChildren = new Map();
    nextRecords.forEach(function (record) {
      if (!nextChildren.has(record.parentKey)) nextChildren.set(record.parentKey, []);
      nextChildren.get(record.parentKey).push(record);
    });
    nextChildren.forEach(function (list) {
      list.sort(function (left, right) { return left.order - right.order || left.sequence - right.sequence; });
    });

    records = nextRecords;
    recordMap = nextMap;
    childrenMap = nextChildren;

    var detail = mergeOptions({
      reason: 'rebuild',
      size: records.length,
      diagnostics: api ? api.diagnostics : mergeOptions({}, diagnostics),
      controller: api
    }, meta);
    if (detail.silent !== true) {
      if (Utils.isFunction(opts.onRebuild)) opts.onRebuild(detail);
      emitter.emit('rebuild', detail);
    }
    if (diagnostics.limited && Utils.isFunction(opts.onLimit)) opts.onLimit(detail);
    return api;
  }

  function childRecords(key) {
    var normalized = key === undefined || key === null ? rootKey : String(key);
    return (childrenMap.get(normalized) || []).slice();
  }

  function getAncestors(key) {
    var output = [];
    var current = recordMap.get(String(key));
    var guard = new Set();
    while (current && current.parentKey !== rootKey && recordMap.has(current.parentKey) && !guard.has(current.parentKey)) {
      guard.add(current.parentKey);
      current = recordMap.get(current.parentKey);
      output.push(current);
    }
    return output;
  }

  function getDescendants(key, config) {
    var settings = mergeOptions({ includeSelf: false }, config);
    var output = [];
    var normalized = String(key);
    var self = recordMap.get(normalized);
    if (settings.includeSelf && self && (!Utils.isFunction(settings.filter) || settings.filter(self) !== false)) output.push(self);

    var stack = childRecords(normalized).reverse();
    var guard = new Set();
    while (stack.length) {
      var record = stack.pop();
      if (!record || guard.has(record.key)) continue;
      guard.add(record.key);
      if (Utils.isFunction(settings.stopAt) && settings.stopAt(record) === true) continue;
      if (!Utils.isFunction(settings.filter) || settings.filter(record) !== false) output.push(record);
      var items = childRecords(record.key);
      for (var index = items.length - 1; index >= 0; index -= 1) stack.push(items[index]);
    }
    return output;
  }

  function normalizeKeySet(value) {
    if (value instanceof Set) return new Set(Array.from(value, String));
    var source = Array.isArray(value) ? value : (value === undefined || value === null ? [] : [value]);
    return new Set(source.map(String));
  }

  function flattenVisible(expandedKeys, config) {
    var expanded = normalizeKeySet(expandedKeys);
    var settings = config || {};
    var output = [];
    var stack = childRecords(rootKey).reverse();
    var guard = new Set();
    while (stack.length) {
      var record = stack.pop();
      if (!record || guard.has(record.key)) continue;
      guard.add(record.key);
      if (!Utils.isFunction(settings.filter) || settings.filter(record) !== false) output.push(record);
      if (expanded.has(record.key)) {
        var items = childRecords(record.key);
        for (var index = items.length - 1; index >= 0; index -= 1) stack.push(items[index]);
      }
    }
    return output;
  }

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    assertCanonicalOptions(nextOptions);
    opts = mergeOptions(opts, nextOptions);
    rootKey = String(opts.rootKey || rootKey);
    return rebuild({ silent: true, reason: 'options', source: 'options' });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    records = [];
    recordMap.clear();
    childrenMap.clear();
    emitter.dispose();
    return true;
  }

  api = {
    updateOptions: updateOptions,
    setItems: function (items, meta) {
      opts = mergeOptions(opts, { items: Array.isArray(items) ? items : [] });
      return rebuild(mergeOptions({ reason: 'set-items' }, meta));
    },
    rebuild: rebuild,
    getRecord: function (key) { return recordMap.get(String(key)) || null; },
    getItem: function (key) { var record = recordMap.get(String(key)); return record ? record.item : null; },
    getParent: function (key) { var record = recordMap.get(String(key)); return record && recordMap.get(record.parentKey) || null; },
    getChildren: childRecords,
    getAncestors: getAncestors,
    getDescendants: getDescendants,
    flattenVisible: flattenVisible,
    hasChildren: function (key) { return childRecords(key).length > 0; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };

  Object.defineProperties(api, {
    rootKey: { enumerable: true, get: function () { return rootKey; } },
    records: { enumerable: true, get: function () { return records.slice(); } },
    keys: { enumerable: true, get: function () { return records.map(function (record) { return record.key; }); } },
    size: { enumerable: true, get: function () { return records.length; } },
    diagnostics: {
      enumerable: true,
      get: function () {
        return Object.freeze({
          duplicateKeys: diagnostics.duplicateKeys,
          missingKeys: diagnostics.missingKeys,
          repeatedObjects: diagnostics.repeatedObjects,
          parentCycles: diagnostics.parentCycles,
          limited: diagnostics.limited
        });
      }
    },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });

  rebuild({ silent: true, reason: 'init', source: 'init' });
  return api;
}

export const TreeModel = Object.freeze({ create });
export { create };
