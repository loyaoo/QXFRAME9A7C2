// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

/* generated:layer-tokens:start */
  var LAYER_TOKENS = Object.freeze({ overlayBase:19920510, step:10, bandStride:10000, bands:Object.freeze({ popup:0, modal:1, notice:2, tooltip:3, blocking:4 }) });
  /* generated:layer-tokens:end */
  var DEFAULT_BASE = LAYER_TOKENS.overlayBase;
  var DEFAULT_STEP = LAYER_TOKENS.step;
  var BAND_STRIDE = LAYER_TOKENS.bandStride;
  var BAND_ORDER = LAYER_TOKENS.bands;
  var LAYER_ID_PROPERTY = '__qxframe9a7c2LayerId';
  var sharedManager = null;
  var sharedFacade = null;
  var sharedByDocument = typeof WeakMap === 'function' ? new WeakMap() : null;
  var sharedFacades = [];
  var managersCreated = 0, managersDestroyed = 0, activeLayers = 0;

  function normalizeKind(value) {
    var kind = String(value || 'popup').toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(BAND_ORDER, kind)) throw new TypeError('[QXFRAME9A7C2] LayerManager kind must be popup, modal, notice, tooltip, or blocking.');
    return kind;
  }
  function finiteOffset(value, bandStride, step) {
    if (value === undefined || value === null || value === '') return 0;
    var number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] LayerManager zIndex offset must be finite.');
    number = Math.floor(number);
    if (number < 0 || number >= bandStride - step) throw new RangeError('[QXFRAME9A7C2] LayerManager zIndex offset must stay inside its semantic band (0..' + String(bandStride - step - 1) + ').');
    return number;
  }
  function findParentId(node) {
    var current = node || null;
    var seen = [];
    while (current && seen.indexOf(current) < 0) {
      seen.push(current);
      if (current[LAYER_ID_PROPERTY]) return String(current[LAYER_ID_PROPERTY]);
      if (current.parentElement) current = current.parentElement;
      else if (current.parentNode && current.parentNode.host) current = current.parentNode.host;
      else current = current.parentNode || null;
    }
    return null;
  }
  function singletonId(type, group, parentId) {
    return String(type || '') + '\u0000' + String(group || '') + '\u0000' + String(parentId || '');
  }

  function create(options) {
    managersCreated += 1;
    var settings = options || {};
    var baseZIndex = Number.isFinite(Number(settings.baseZIndex)) ? Math.floor(Number(settings.baseZIndex)) : DEFAULT_BASE;
    var step = Math.max(1, Math.floor(Number(settings.step) || DEFAULT_STEP));
    var bandStride = Math.max(step * 100, Math.floor(Number(settings.bandStride) || BAND_STRIDE));
    var kindCount = Object.keys(BAND_ORDER).length;
    var rootStride = Math.max(bandStride * (kindCount + 1), Math.floor(Number(settings.rootStride) || 0));
    var stack = [];
    var singletonRecords = Object.create(null);
    var sequence = 0;
    var rootOrderSequence = 0;
    var destroyed = false;

    function findIndex(id) {
      for (var i = 0; i < stack.length; i += 1) if (stack[i].id === id) return i;
      return -1;
    }
    function findEntry(id) {
      var index = findIndex(String(id || ''));
      return index < 0 ? null : stack[index];
    }
    function parentEntry(entry) { return entry && entry.parentId ? findEntry(entry.parentId) : null; }
    function rootEntry(entry) { return entry ? findEntry(entry.rootId) || entry : null; }
    function depthOf(entry) {
      var depth = 0, current = parentEntry(entry), seen = Object.create(null);
      while (current && !seen[current.id]) { seen[current.id] = true; depth += 1; current = parentEntry(current); }
      return depth;
    }
    function effectiveBandRank(entry) {
      var rank = BAND_ORDER[entry.kind];
      var seen = Object.create(null);
      var current = parentEntry(entry);
      while (current && !seen[current.id]) {
        seen[current.id] = true;
        rank = Math.max(rank, BAND_ORDER[current.kind]);
        current = parentEntry(current);
      }
      return rank;
    }
    function entriesForRootRank(rootId, rank) {
      return stack.filter(function (entry) { return entry.rootId === rootId && effectiveBandRank(entry) === rank; }).sort(function (a, b) {
        if (depthOf(a) !== depthOf(b)) return depthOf(a) - depthOf(b);
        return a.sequence - b.sequence;
      });
    }
    function rootPlane(entry) {
      var root = rootEntry(entry);
      if (!root) return 0;
      if (root.kind === 'blocking') return 2;
      if (root.kind === 'notice') return 1;
      return 0;
    }
    function orderedRoots() {
      var roots = stack.filter(function (entry) { return entry.id === entry.rootId; });
      return roots.sort(function (a, b) {
        var plane = rootPlane(a) - rootPlane(b);
        return plane || (a.rootOrder - b.rootOrder) || (a.sequence - b.sequence);
      });
    }
    function rootPosition(rootId) {
      var roots = orderedRoots();
      for (var i = 0; i < roots.length; i += 1) if (roots[i].id === rootId) return i;
      return -1;
    }
    function zIndexFor(entry) {
      if (!entry) return null;
      var rank = effectiveBandRank(entry);
      var bandEntries = entriesForRootRank(entry.rootId, rank);
      var position = -1;
      for (var i = 0; i < bandEntries.length; i += 1) if (bandEntries[i].id === entry.id) { position = i; break; }
      if (position < 0) return null;
      var local = rank * bandStride + position * step + entry.zIndexOffset;
      if (local >= rootStride) throw new RangeError('[QXFRAME9A7C2] LayerManager root-family capacity exceeded; reduce zIndex offset or active descendant layers.');
      var rootIndex = rootPosition(entry.rootId);
      if (rootIndex < 0) return null;
      return baseZIndex + rootIndex * rootStride + local;
    }
    function descendantsOf(id, includeSelf) {
      var rootId = String(id || '');
      var result = [];
      var queue = includeSelf ? [rootId] : stack.filter(function (entry) { return entry.parentId === rootId; }).map(function (entry) { return entry.id; });
      var seen = Object.create(null);
      while (queue.length) {
        var currentId = queue.shift();
        if (seen[currentId]) continue;
        seen[currentId] = true;
        var current = findEntry(currentId);
        if (current) result.push(current);
        stack.forEach(function (entry) { if (entry.parentId === currentId) queue.push(entry.id); });
      }
      return result;
    }
    function isDescendantId(ownerId, candidateId, includeSelf) {
      var owner = String(ownerId || ''), current = findEntry(candidateId), seen = Object.create(null);
      while (current && !seen[current.id]) {
        if (current.id === owner) return includeSelf !== false || current.id !== String(candidateId || '');
        seen[current.id] = true;
        current = parentEntry(current);
      }
      return false;
    }
    function snapshot(entry) {
      return {
        id: entry.id,
        element: entry.element,
        parentId: entry.parentId,
        kind: entry.kind,
        componentType: entry.componentType,
        group: entry.group,
        rootId: entry.rootId,
        rootOrder: entry.rootOrder,
        zIndexOffset: entry.zIndexOffset,
        zIndex: zIndexFor(entry)
      };
    }
    function orderedByZ(entries) {
      return entries.slice().sort(function (a, b) { return (zIndexFor(a) || 0) - (zIndexFor(b) || 0); });
    }
    function requestTeardown(entry, reason, originalEvent) {
      if (!entry || typeof entry.requestTeardown !== 'function') return false;
      try {
        entry.requestTeardown({ reason: reason || 'parent-teardown', originalEvent: originalEvent || null, layerId: entry.id, structural: true });
        return true;
      } catch (_) { return false; }
    }
    function teardownDescendants(id, reason, originalEvent) {
      var entries = descendantsOf(id, false).sort(function (a, b) {
        var depth = depthOf(b) - depthOf(a);
        return depth || ((zIndexFor(b) || 0) - (zIndexFor(a) || 0));
      });
      entries.forEach(function (entry) { if (findEntry(entry.id)) requestTeardown(entry, reason || 'parent-teardown', originalEvent); });
      // No dangling ownership is allowed even when a consumer teardown callback throws.
      entries.forEach(function (entry) {
        var index = findIndex(entry.id);
        if (index >= 0) stack.splice(index, 1);
      });
      return entries.length;
    }
    function containsTarget(ownerId, target) {
      var owner = findEntry(ownerId);
      if (!owner || !target) return false;
      if (owner.element && (target === owner.element || (owner.element.contains && owner.element.contains(target)))) return true;
      var targetId = findParentId(target);
      return !!(targetId && isDescendantId(owner.id, targetId, true));
    }
    function getTreeElements(ownerId) {
      return orderedByZ(descendantsOf(ownerId, true)).map(function (entry) { return entry.element; }).filter(function (element, index, list) {
        return !!element && list.indexOf(element) === index;
      });
    }

    function register(element, entryOptions) {
      if (destroyed) throw new Error('[QXFRAME9A7C2] LayerManager is destroyed.');
      var local = entryOptions || {};
      sequence += 1;
      var id = String(local.id || ('qxframe9a7c2-layer-' + sequence));
      if (findIndex(id) >= 0) throw new Error('[QXFRAME9A7C2] Duplicate layer id: ' + id);
      var parentId = local.parentId ? String(local.parentId) : null;
      var parent = parentId ? findEntry(parentId) : null;
      if (parentId && !parent) parentId = null;
      if (parent && parent.id === id) throw new Error('[QXFRAME9A7C2] LayerManager layer cannot parent itself.');
      var entry = {
        id: id,
        element: element || null,
        parentId: parentId,
        kind: normalizeKind(local.kind),
        componentType: local.componentType ? String(local.componentType) : null,
        group: local.group === undefined || local.group === null ? null : String(local.group),
        zIndexOffset: finiteOffset(local.zIndexOffset !== undefined ? local.zIndexOffset : local.zIndex, bandStride, step),
        requestDismiss: typeof local.requestDismiss === 'function' ? local.requestDismiss : null,
        requestTeardown: typeof local.requestTeardown === 'function' ? local.requestTeardown : null,
        sequence: sequence,
        rootId: parent ? parent.rootId : id,
        rootOrder: parent ? parent.rootOrder : (++rootOrderSequence)
      };
      stack.push(entry);
      activeLayers += 1;
      var active = true;

      function unregister(options) {
        if (!active) return false;
        active = false;
        var current = findEntry(id);
        if (!current) return false;
        var localOptions = options || {};
        if (localOptions.cascade !== false) teardownDescendants(id, localOptions.reason || 'parent-teardown', localOptions.originalEvent || null);
        var index = findIndex(id);
        if (index >= 0) { stack.splice(index, 1); activeLayers = Math.max(0, activeLayers - 1); }
        return true;
      }
      function bringToFront() {
        if (!active) return false;
        var current = findEntry(id);
        if (!current) return false;
        var rootId = current.rootId;
        var nextOrder = ++rootOrderSequence;
        stack.forEach(function (candidate) { if (candidate.rootId === rootId) candidate.rootOrder = nextOrder; });
        return true;
      }
      function update(nextOptions) {
        if (!active) return false;
        var current = findEntry(id);
        if (!current) return false;
        var next = nextOptions || {};
        if (Object.prototype.hasOwnProperty.call(next, 'kind')) current.kind = normalizeKind(next.kind);
        if (Object.prototype.hasOwnProperty.call(next, 'zIndexOffset') || Object.prototype.hasOwnProperty.call(next, 'zIndex')) current.zIndexOffset = finiteOffset(Object.prototype.hasOwnProperty.call(next, 'zIndexOffset') ? next.zIndexOffset : next.zIndex, bandStride, step);
        if (Object.prototype.hasOwnProperty.call(next, 'requestDismiss')) current.requestDismiss = typeof next.requestDismiss === 'function' ? next.requestDismiss : null;
        if (Object.prototype.hasOwnProperty.call(next, 'requestTeardown')) current.requestTeardown = typeof next.requestTeardown === 'function' ? next.requestTeardown : null;
        return true;
      }

      return Object.freeze({
        id: id,
        unregister: unregister,
        destroy: unregister,
        bringToFront: bringToFront,
        update: update,
        isTop: function () { var currentTop = top(); return active && !!currentTop && currentTop.id === id; },
        getZIndex: function () { return active ? zIndexFor(findEntry(id)) : null; },
        getState: function () { var current = findEntry(id); return current ? Object.freeze(snapshot(current)) : null; }
      });
    }

    function top() {
      if (!stack.length) return null;
      var ordered = orderedByZ(stack);
      return snapshot(ordered[ordered.length - 1]);
    }
    function list() { return orderedByZ(stack).map(snapshot); }
    function requestDismiss(entry, reason, originalEvent) {
      if (!entry || typeof entry.requestDismiss !== 'function') return false;
      return entry.requestDismiss({ reason: reason || 'api', originalEvent: originalEvent || null, layerId: entry.id }) !== false;
    }
    function dismissTop(reason, originalEvent) {
      var current = top();
      return current ? requestDismiss(findEntry(current.id), reason || 'dismiss-top', originalEvent) : false;
    }
    function dismissTree(id, reason, originalEvent) {
      var entries = orderedByZ(descendantsOf(id, true)).reverse();
      var count = 0;
      entries.forEach(function (entry) { if (requestDismiss(entry, reason || 'dismiss-tree', originalEvent)) count += 1; });
      return count;
    }
    function matchesFilter(entry, filter) {
      if (!filter) return true;
      if (typeof filter === 'function') return filter(snapshot(entry)) === true;
      if (typeof filter === 'string') return entry.kind === filter || entry.componentType === filter;
      if (typeof filter === 'object') {
        if (filter.kind && entry.kind !== String(filter.kind)) return false;
        if (filter.componentType && entry.componentType !== String(filter.componentType)) return false;
        if (filter.parentId !== undefined && entry.parentId !== (filter.parentId ? String(filter.parentId) : null)) return false;
        return true;
      }
      return false;
    }
    function dismissAll(filter, reason, originalEvent) {
      var entries = orderedByZ(stack.filter(function (entry) { return matchesFilter(entry, filter); })).reverse();
      var count = 0;
      entries.forEach(function (entry) { if (requestDismiss(entry, reason || 'dismiss-all', originalEvent)) count += 1; });
      return count;
    }

    function acquireSingleton(options) {
      if (destroyed) throw new Error('[QXFRAME9A7C2] LayerManager is destroyed.');
      var local = options || {};
      var type = String(local.type || local.componentType || '');
      var group = local.group === undefined || local.group === null ? '' : String(local.group);
      var parentId = local.parentId ? String(local.parentId) : '';
      if (!type || !group) throw new TypeError('[QXFRAME9A7C2] LayerManager singleton requires component type and group.');
      var key = singletonId(type, group, parentId);
      var record = singletonRecords[key];
      var created = false;
      if (!record) {
        var value = typeof local.create === 'function' ? local.create() : local.value;
        record = singletonRecords[key] = { key: key, type: type, group: group, parentId: parentId || null, value: value, refs: 0 };
        created = true;
      }
      record.refs += 1;
      var released = false;
      return Object.freeze({
        key: key,
        value: record.value,
        created: created,
        release: function () {
          if (released) return false;
          released = true;
          record.refs = Math.max(0, record.refs - 1);
          if (record.refs === 0 && singletonRecords[key] === record) {
            delete singletonRecords[key];
            if (typeof local.onLastRelease === 'function') local.onLastRelease(record.value);
          }
          return true;
        },
        getRefCount: function () { return singletonRecords[key] ? singletonRecords[key].refs : 0; }
      });
    }
    function getSingleton(type, group, parentId) {
      var record = singletonRecords[singletonId(type, group, parentId ? String(parentId) : '')];
      return record ? record.value : null;
    }

    function clear() {
      var entries = stack.slice().sort(function (a, b) { return depthOf(b) - depthOf(a) || ((zIndexFor(b) || 0) - (zIndexFor(a) || 0)); });
      entries.forEach(function (entry) { if (findEntry(entry.id)) requestTeardown(entry, 'manager-clear', null); });
      var count = stack.length;
      activeLayers = Math.max(0, activeLayers - count);
      stack.length = 0;
      Object.keys(singletonRecords).forEach(function (key) { delete singletonRecords[key]; });
      return count;
    }
    function destroy() {
      if (destroyed) return false;
      clear();
      destroyed = true;
      managersDestroyed += 1;
      return true;
    }

    var api = {
      register: register,
      top: top,
      list: list,
      dismissTop: dismissTop,
      dismissTree: dismissTree,
      dismissAll: dismissAll,
      teardownDescendants: teardownDescendants,
      containsTarget: containsTarget,
      getTreeElements: getTreeElements,
      isDescendantId: isDescendantId,
      findParentId: findParentId,
      acquireSingleton: acquireSingleton,
      getSingleton: getSingleton,
      clear: clear,
      destroy: destroy
    };
    Object.defineProperties(api, {
      size: { enumerable: true, get: function () { return stack.length; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } },
      baseZIndex: { enumerable: true, get: function () { return baseZIndex; } },
      rootStride: { enumerable: true, get: function () { return rootStride; } },
      bands: { enumerable: true, get: function () { return Object.freeze({ popup: 0, modal: bandStride, notice: bandStride * 2, tooltip: bandStride * 3, blocking: bandStride * 4 }); } }
    });
    return api;
  }

  function sharedRecord(manager) {
    var facade = {
      register: function (element, options) { return manager.register(element, options); },
      top: function () { return manager.top(); },
      list: function () { return manager.list(); },
      dismissTop: function (reason, event) { return manager.dismissTop(reason, event); },
      dismissTree: function (id, reason, event) { return manager.dismissTree(id, reason, event); },
      dismissAll: function (filter, reason, event) { return manager.dismissAll(filter, reason, event); },
      teardownDescendants: function (id, reason, event) { return manager.teardownDescendants(id, reason, event); },
      containsTarget: function (id, target) { return manager.containsTarget(id, target); },
      getTreeElements: function (id) { return manager.getTreeElements(id); },
      isDescendantId: function (ownerId, candidateId, includeSelf) { return manager.isDescendantId(ownerId, candidateId, includeSelf); },
      acquireSingleton: function (options) { return manager.acquireSingleton(options); },
      getSingleton: function (type, group, parentId) { return manager.getSingleton(type, group, parentId); },
      findParentId: findParentId
    };
    Object.defineProperties(facade, {
      size: { enumerable: true, get: function () { return manager.size; } },
      baseZIndex: { enumerable: true, get: function () { return manager.baseZIndex; } },
      rootStride: { enumerable: true, get: function () { return manager.rootStride; } },
      bands: { enumerable: true, get: function () { return manager.bands; } }
    });
    var record = Object.freeze({ manager: manager, facade: Object.freeze(facade) });
    sharedFacades.push(record.facade);
    return record;
  }

  function getShared(documentRef) {
    var documentKey = documentRef && documentRef.nodeType === 9 ? documentRef : (documentRef && documentRef.ownerDocument && documentRef.ownerDocument.nodeType === 9 ? documentRef.ownerDocument : null);
    if (documentKey && sharedByDocument) {
      var existing = sharedByDocument.get(documentKey);
      if (!existing) { existing = sharedRecord(create()); sharedByDocument.set(documentKey, existing); }
      return existing.facade;
    }
    if (!sharedManager) {
      var fallback = sharedRecord(create());
      sharedManager = fallback.manager;
      sharedFacade = fallback.facade;
    }
    return sharedFacade;
  }

export const LayerManager = Object.freeze({ create, getShared, DEFAULT_BASE, BAND_STRIDE, BAND_ORDER, LAYER_ID_PROPERTY, findParentId, getStats: function () { var sharedLayers = sharedFacades.reduce(function (sum, facade) { return sum + Number(facade && facade.size || 0); }, 0); return Object.freeze({ createdManagers: managersCreated, destroyedManagers: managersDestroyed, activeManagers: Math.max(0, managersCreated - managersDestroyed), activeLayers: activeLayers, sharedLayers: sharedLayers, sharedRealms: sharedFacades.length }); } });
export { create, getShared, DEFAULT_BASE, BAND_STRIDE, BAND_ORDER, LAYER_ID_PROPERTY, findParentId };
