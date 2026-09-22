// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';

var createdScopes = 0;
  var disposedScopes = 0;
  var activeScopes = 0;
  var registeredResources = 0;
  var releasedResources = 0;
  var activeResources = 0;

  function createScope(options) {
    var settings = options || {};
    var onError = Utils.isFunction(settings.onError) ? settings.onError : Utils.noop;
    var entries = [];
    var disposed = false;

    createdScopes += 1;
    activeScopes += 1;

    function report(error) {
      try { onError(error); } catch (_) {}
    }

    function runEntry(entry, errors) {
      if (!entry || !entry.active) return false;
      entry.active = false;
      activeResources = Math.max(0, activeResources - 1);
      releasedResources += 1;
      try { entry.cleanup(); }
      catch (error) {
        errors.push(error);
        report(error);
      }
      return true;
    }

    function add(cleanup) {
      if (!Utils.isFunction(cleanup)) throw new TypeError('[QXFRAME9A7C2] Lifecycle cleanup must be a function.');
      var entry = { cleanup: cleanup, active: true };
      if (disposed) {
        try { cleanup(); } catch (error) { report(error); }
        return Utils.noop;
      }
      entries.push(entry);
      registeredResources += 1;
      activeResources += 1;
      return function disposeRegisteredResource() {
        if (!entry.active) return false;
        var errors = [];
        var didRun = runEntry(entry, errors);
        return didRun && !errors.length;
      };
    }

    function dispose() {
      if (disposed) return [];
      disposed = true;
      disposedScopes += 1;
      activeScopes = Math.max(0, activeScopes - 1);
      var errors = [];
      entries.splice(0).reverse().forEach(function (entry) {
        runEntry(entry, errors);
      });
      return errors;
    }

    function size() {
      return entries.reduce(function (count, entry) {
        return count + (entry.active ? 1 : 0);
      }, 0);
    }

    var api = { add: add, dispose: dispose, size: size };
    Object.defineProperty(api, 'disposed', {
      enumerable: true,
      get: function () { return disposed; }
    });
    return api;
  }

  function getStats() {
    return Object.freeze({
      createdScopes: createdScopes,
      disposedScopes: disposedScopes,
      activeScopes: activeScopes,
      registeredResources: registeredResources,
      releasedResources: releasedResources,
      activeResources: activeResources
    });
  }

export const Lifecycle = Object.freeze({ createScope, getStats });
export { createScope, getStats };
