// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';

const global = globalThis;

function normalizeEventName(name) {
  var value = String(name || '').trim();
  if (!value) throw new TypeError('[QXFRAME9A7C2] Event name must not be empty.');
  return value;
}

function createEmitter(options) {
  var settings = options || {};
  var listeners = Object.create(null);
  var disposed = false;
  var errorCount = 0;
  function report(error, detail) {
    errorCount += 1;
    try {
      if (Utils.isFunction(settings.onError)) settings.onError(error, detail || {});
      else if (global.console && Utils.isFunction(global.console.error)) global.console.error(error);
    } catch (_) {}
  }

  function on(name, handler) {
    var eventName = normalizeEventName(name);
    if (!Utils.isFunction(handler)) throw new TypeError('[QXFRAME9A7C2] Event handler must be a function.');
    if (disposed) return Utils.noop;

    var list = listeners[eventName] || (listeners[eventName] = []);
    var active = true;
    list.push(handler);

    return function offRegisteredHandler() {
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
    var off = Utils.noop;
    off = on(name, function onceHandler(payload) {
      off();
      return handler(payload);
    });
    return off;
  }

  function emit(name, payload) {
    var eventName = normalizeEventName(name);
    if (disposed) return 0;
    var list = listeners[eventName];
    if (!list || !list.length) return 0;
    var snapshot = list.slice();
    snapshot.forEach(function (handler) {
      try { handler(payload); }
      catch (error) { report(error, { event: eventName, payload: payload, handler: handler }); }
    });
    return snapshot.length;
  }

  function clear(name) {
    if (disposed) return 0;
    if (name === undefined) {
      var count = Object.keys(listeners).reduce(function (sum, key) {
        return sum + listeners[key].length;
      }, 0);
      listeners = Object.create(null);
      return count;
    }
    var eventName = normalizeEventName(name);
    var list = listeners[eventName];
    var countForName = list ? list.length : 0;
    delete listeners[eventName];
    return countForName;
  }

  function listenerCount(name) {
    if (disposed) return 0;
    if (name === undefined) {
      return Object.keys(listeners).reduce(function (sum, key) {
        return sum + listeners[key].length;
      }, 0);
    }
    var eventName = normalizeEventName(name);
    return listeners[eventName] ? listeners[eventName].length : 0;
  }

  function dispose() {
    if (disposed) return false;
    clear();
    disposed = true;
    return true;
  }

  var api = {
    on: on, once: once, emit: emit, clear: clear,
    listenerCount: listenerCount, dispose: dispose
  };
  Object.defineProperty(api, 'errorCount', { enumerable: true, get: function () { return errorCount; } });
  Object.defineProperty(api, 'disposed', {
    enumerable: true,
    get: function () { return disposed; }
  });
  return api;
}

export const Events = Object.freeze({ createEmitter });
export { createEmitter };
