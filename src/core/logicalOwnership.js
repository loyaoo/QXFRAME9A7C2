
import { Utils } from '../utils/utils.js';
import { IdManager } from '../utils/id.js';

var logicalNodesCreated = 0, logicalNodesDestroyed = 0;

  function normalizeEventName(name) {
    var value = String(name || '').trim();
    if (!value) throw new TypeError('[QXFRAME9A7C2] Logical event name must not be empty.');
    return value;
  }

  function isNode(value) {
    return !!(value && value.__qxframe9a7c2LogicalOwnershipNode === true);
  }

  function createEvent(type, detail, targetNode, options, path) {
    var local = options || {};
    var defaultPrevented = false;
    var propagationStopped = false;
    var immediatePropagationStopped = false;
    var nativeEvent = local.nativeEvent || local.originalEvent || (detail && (detail.nativeEvent || detail.originalEvent)) || null;
    var event = {
      type: type,
      detail: detail,
      target: targetNode,
      currentTarget: null,
      targetNode: targetNode,
      currentTargetNode: null,
      bubbles: local.bubbles !== false,
      cancelable: local.cancelable !== false,
      nativeEvent: nativeEvent,
      originalEvent: nativeEvent,
      reason: local.reason || (detail && detail.reason) || '',
      stopPropagation: function () { propagationStopped = true; },
      stopImmediatePropagation: function () {
        immediatePropagationStopped = true;
        propagationStopped = true;
      },
      preventDefault: function () {
        if (event.cancelable) defaultPrevented = true;
      },
      composedPath: function () { return path.slice(); }
    };
    Object.defineProperties(event, {
      defaultPrevented: { enumerable: true, get: function () { return defaultPrevented; } },
      propagationStopped: { enumerable: true, get: function () { return propagationStopped; } },
      immediatePropagationStopped: { enumerable: true, get: function () { return immediatePropagationStopped; } }
    });
    return event;
  }

  function createNode(options) {
    logicalNodesCreated += 1;
    var opts = options || {};
    var id = String(opts.id || IdManager.next('logical-node'));
    var parent = null;
    var children = new Set();
    var listeners = Object.create(null);
    var owner = opts.owner || null;
    var destroyed = false;
    var api = null;

    function assertAlive() {
      if (destroyed) throw new Error('[QXFRAME9A7C2] Logical ownership node is destroyed: ' + id);
    }

    function validateParent(nextParent) {
      if (nextParent === null || nextParent === undefined) return null;
      if (!isNode(nextParent)) throw new TypeError('[QXFRAME9A7C2] Logical parent must be a LogicalOwnership node.');
      if (nextParent.destroyed) throw new Error('[QXFRAME9A7C2] Logical parent is destroyed.');
      if (nextParent === api) throw new Error('[QXFRAME9A7C2] Logical ownership cycle: a node cannot own itself.');
      var cursor = nextParent;
      var guard = 0;
      while (cursor) {
        if (cursor === api) throw new Error('[QXFRAME9A7C2] Logical ownership cycle detected.');
        cursor = cursor.parent;
        guard += 1;
        if (guard > 10000) throw new Error('[QXFRAME9A7C2] Logical ownership parent chain exceeded safety limit.');
      }
      return nextParent;
    }

    function setParent(nextParent) {
      assertAlive();
      nextParent = validateParent(nextParent);
      if (parent === nextParent) return api;
      if (parent) parent.__removeLogicalChild(api);
      parent = nextParent;
      if (parent) parent.__addLogicalChild(api);
      return api;
    }

    function setOwner(nextOwner) {
      assertAlive();
      owner = nextOwner || null;
      return api;
    }

    function on(name, handler) {
      assertAlive();
      var eventName = normalizeEventName(name);
      if (!Utils.isFunction(handler)) throw new TypeError('[QXFRAME9A7C2] Logical event handler must be a function.');
      var list = listeners[eventName] || (listeners[eventName] = []);
      var active = true;
      list.push(handler);
      return function offLogicalHandler() {
        if (!active) return false;
        active = false;
        var current = listeners[eventName];
        if (!current) return false;
        var index = current.indexOf(handler);
        if (index >= 0) current.splice(index, 1);
        if (!current.length) delete listeners[eventName];
        return index >= 0;
      };
    }

    function once(name, handler) {
      if (!Utils.isFunction(handler)) throw new TypeError('[QXFRAME9A7C2] Logical event handler must be a function.');
      var off = Utils.noop;
      off = on(name, function logicalOnce(event) {
        off();
        return handler(event);
      });
      return off;
    }

    function dispatchLocal(event) {
      if (destroyed) return 0;
      var list = listeners[event.type];
      if (!list || !list.length) return 0;
      var snapshot = list.slice();
      var count = 0;
      for (var index = 0; index < snapshot.length; index += 1) {
        if (event.immediatePropagationStopped) break;
        var result = snapshot[index](event);
        count += 1;
        if (result === false) {
          event.preventDefault();
          event.stopPropagation();
        }
      }
      return count;
    }

    function buildPath(bubbles) {
      var path = [];
      var cursor = api;
      var guard = 0;
      while (cursor) {
        path.push(cursor);
        if (!bubbles) break;
        cursor = cursor.parent;
        guard += 1;
        if (guard > 10000) throw new Error('[QXFRAME9A7C2] Logical ownership dispatch path exceeded safety limit.');
      }
      return path;
    }

    function dispatch(name, detail, dispatchOptions) {
      assertAlive();
      var eventName = normalizeEventName(name);
      var local = dispatchOptions || {};
      var path = buildPath(local.bubbles !== false);
      var event = createEvent(eventName, detail, api, local, path);
      for (var index = 0; index < path.length; index += 1) {
        var current = path[index];
        if (current.destroyed) continue;
        event.currentTarget = current;
        event.currentTargetNode = current;
        current.__dispatchLogicalLocal(event);
        if (event.propagationStopped) break;
      }
      event.currentTarget = null;
      event.currentTargetNode = null;
      return event;
    }

    function clear(name) {
      if (destroyed) return 0;
      if (name === undefined) {
        var total = Object.keys(listeners).reduce(function (sum, eventName) { return sum + listeners[eventName].length; }, 0);
        listeners = Object.create(null);
        return total;
      }
      var eventName = normalizeEventName(name);
      var list = listeners[eventName];
      if (!list) return 0;
      var count = list.length;
      delete listeners[eventName];
      return count;
    }

    function listenerCount(name) {
      if (destroyed) return 0;
      if (name === undefined) return Object.keys(listeners).reduce(function (sum, eventName) { return sum + listeners[eventName].length; }, 0);
      var list = listeners[normalizeEventName(name)];
      return list ? list.length : 0;
    }

    function ancestors() {
      var output = [];
      var cursor = parent;
      var guard = 0;
      while (cursor) {
        output.push(cursor);
        cursor = cursor.parent;
        guard += 1;
        if (guard > 10000) throw new Error('[QXFRAME9A7C2] Logical ownership ancestor chain exceeded safety limit.');
      }
      return output;
    }

    function getChildren() {
      return Array.from(children);
    }

    function isAncestorOf(node) {
      if (!isNode(node) || node === api) return false;
      var cursor = node.parent;
      var guard = 0;
      while (cursor) {
        if (cursor === api) return true;
        cursor = cursor.parent;
        guard += 1;
        if (guard > 10000) break;
      }
      return false;
    }

    function contains(node) {
      return node === api || isAncestorOf(node);
    }

    function destroy() {
      if (destroyed) return false;
      if (parent) parent.__removeLogicalChild(api);
      parent = null;
      getChildren().forEach(function (child) {
        if (!child.destroyed && child.parent === api) child.__detachLogicalParent(api);
      });
      children.clear();
      listeners = Object.create(null);
      owner = null;
      destroyed = true;
      logicalNodesDestroyed += 1;
      return true;
    }

    api = {
      setParent: setParent,
      setOwner: setOwner,
      getParent: function () { return parent; },
      getChildren: getChildren,
      ancestors: ancestors,
      contains: contains,
      on: on,
      once: once,
      emit: dispatch,
      dispatch: dispatch,
      clear: clear,
      listenerCount: listenerCount,
      isAncestorOf: isAncestorOf,
      destroy: destroy,
      __dispatchLogicalLocal: dispatchLocal,
      __addLogicalChild: function (child) { if (!destroyed && isNode(child)) children.add(child); },
      __removeLogicalChild: function (child) { return children.delete(child); },
      __detachLogicalParent: function (expectedParent) {
        if (parent === expectedParent) parent = null;
      }
    };

    Object.defineProperties(api, {
      __qxframe9a7c2LogicalOwnershipNode: { value: true },
      id: { enumerable: true, get: function () { return id; } },
      parent: { enumerable: true, get: function () { return parent; } },
      owner: { enumerable: true, get: function () { return owner; } },
      childCount: { enumerable: true, get: function () { return children.size; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });

    if (opts.parent !== undefined && opts.parent !== null) setParent(opts.parent);
    return api;
  }

export const LogicalOwnership = Object.freeze({ createNode, isNode, getStats: function () { return Object.freeze({ createdNodes: logicalNodesCreated, destroyedNodes: logicalNodesDestroyed, activeNodes: Math.max(0, logicalNodesCreated - logicalNodesDestroyed) }); } });
export { createNode, isNode };
