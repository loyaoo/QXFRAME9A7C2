import { LogicalOwnership } from './logicalOwnership.js';

function create(options) {
  var opts = options || {};
  var records = new Map();
  var roots = typeof WeakMap === 'function' ? new WeakMap() : null;
  var destroyed = false;

  function assertAlive() {
    if (destroyed) throw new Error('[QXFRAME9A7C2] LogicalOwnerTree is destroyed.');
  }

  function getRecord(id) {
    return records.get(String(id || '')) || null;
  }

  function resolveRoot(record) {
    if (!record) return null;
    return typeof record.rootResolver === 'function' ? record.rootResolver() : record.root;
  }

  function unmapRoot(record) {
    if (!roots || !record || !record.mappedRoot || (typeof record.mappedRoot !== 'object' && typeof record.mappedRoot !== 'function')) return;
    if (roots.get(record.mappedRoot) === record.node) roots.delete(record.mappedRoot);
    record.mappedRoot = null;
  }

  function refreshOwnerRoot(id) {
    assertAlive();
    var record = getRecord(id);
    if (!record) return null;
    unmapRoot(record);
    var root = resolveRoot(record);
    if (roots && root && (typeof root === 'object' || typeof root === 'function')) {
      roots.set(root, record.node);
      record.mappedRoot = root;
    }
    return root;
  }

  function registerOwner(config) {
    assertAlive();
    var local = config || {};
    var id = String(local.id || '').trim();
    if (!id) throw new TypeError('[QXFRAME9A7C2] LogicalOwnerTree owner id must not be empty.');
    if (records.has(id)) throw new Error('[QXFRAME9A7C2] LogicalOwnerTree duplicate owner id: ' + id);
    var parent = null;
    if (local.parentId !== undefined && local.parentId !== null) {
      var parentRecord = getRecord(local.parentId);
      if (!parentRecord) throw new Error('[QXFRAME9A7C2] LogicalOwnerTree parent not found: ' + local.parentId);
      parent = parentRecord.node;
    } else if (local.parent !== undefined && local.parent !== null) {
      if (!LogicalOwnership.isNode(local.parent)) throw new TypeError('[QXFRAME9A7C2] LogicalOwnerTree parent must be a LogicalOwnership node.');
      parent = local.parent;
    }
    var node = LogicalOwnership.createNode({ id: id, parent: parent, owner: local.owner || null });
    var record = {
      id: id,
      node: node,
      document: local.document || null,
      root: local.root || null,
      rootResolver: typeof local.rootResolver === 'function' ? local.rootResolver : null,
      mappedRoot: null
    };
    records.set(id, record);
    refreshOwnerRoot(id);
    return node;
  }

  function resolveOwnerFromEvent(event) {
    if (destroyed || !event) return null;
    var path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    if (!path.length && event.target) {
      var cursor = event.target;
      while (cursor) {
        path.push(cursor);
        cursor = cursor.parentNode || null;
      }
    }
    if (roots) {
      for (var index = 0; index < path.length; index += 1) {
        var node = path[index];
        if (node && (typeof node === 'object' || typeof node === 'function')) {
          var owner = roots.get(node);
          if (owner && !owner.destroyed) return owner;
        }
      }
    }
    return null;
  }

  function isLogicalDescendant(childId, parentId) {
    var child = getRecord(childId);
    var parent = getRecord(parentId);
    return !!(child && parent && parent.node.isAncestorOf(child.node));
  }

  function releaseOwner(id) {
    if (destroyed) return false;
    var record = getRecord(id);
    if (!record) return false;
    record.node.getChildren().slice().forEach(function (child) {
      if (child && records.has(child.id)) releaseOwner(child.id);
    });
    unmapRoot(record);
    record.node.destroy();
    records.delete(record.id);
    return true;
  }

  function destroy() {
    if (destroyed) return false;
    Array.from(records.keys()).forEach(function (id) { if (records.has(id)) releaseOwner(id); });
    destroyed = true;
    return true;
  }

  function getState() {
    return Object.freeze({ size: records.size, ownerIds: Object.freeze(Array.from(records.keys())), destroyed: destroyed });
  }

  return Object.freeze({
    registerOwner,
    resolveOwnerFromEvent,
    isLogicalDescendant,
    refreshOwnerRoot,
    releaseOwner,
    get: function (id) { var record = getRecord(id); return record ? record.node : null; },
    getState,
    destroy
  });
}

export const LogicalOwnerTree = Object.freeze({ create });
export { create };
