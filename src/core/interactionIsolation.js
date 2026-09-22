
import { ObserverHub } from './observerHub.js';

const global = globalThis;

var isolationsCreated = 0, isolationsDestroyed = 0, activeIsolations = 0;
  var records = typeof WeakMap === 'function' ? new WeakMap() : null;

  function isolateNode(node) {
    if (!node || node.nodeType !== 1) return function () {};
    var record = records && records.get(node);
    if (record) { record.count += 1; return function () { releaseNode(node); }; }
    record = {
      count: 1,
      inert: 'inert' in node ? node.inert : undefined,
      pointerEvents: node.style ? node.style.pointerEvents : ''
    };
    if (records) records.set(node, record);
    try { if ('inert' in node) node.inert = true; } catch (_) {}
    if (!('inert' in node) && node.style) node.style.pointerEvents = 'none';
    return function () { releaseNode(node); };
  }

  function releaseNode(node) {
    var record = records && records.get(node);
    if (!record) return false;
    record.count -= 1;
    if (record.count > 0) return true;
    try { if ('inert' in node && record.inert !== undefined) node.inert = record.inert; } catch (_) {}
    if (!('inert' in node) && node.style) node.style.pointerEvents = record.pointerEvents;
    records.delete(node);
    return true;
  }

  function uniqueElements(values) {
    var output = [];
    (Array.isArray(values) ? values : [values]).forEach(function (node) {
      if (!node || node.nodeType !== 1 || output.indexOf(node) >= 0) return;
      output.push(node);
    });
    return output;
  }

  function nodeInsideAllowed(node, allowed) {
    return allowed.some(function (entry) { return entry && (node === entry || (entry.contains && entry.contains(node))); });
  }
  function nodeContainsAllowed(node, allowed) {
    return allowed.some(function (entry) { return entry && node !== entry && node.contains && node.contains(entry); });
  }
  function isFrameworkFocusGuard(node) {
    return !!(node && node.nodeType === 1 && node.hasAttribute && node.hasAttribute('data-qxframe9a7c2-focus-guard'));
  }

  function create(options) {
    isolationsCreated += 1;
    var settings = options || {};
    var root = settings.root;
    var doc = settings.document || root && root.ownerDocument || global.document;
    var active = false, destroyed = false, applying = false;
    var releases = [], stopObserver = null;

    function containers() {
      var value = typeof settings.getContainers === 'function' ? settings.getContainers() : (settings.containers || [root]);
      return uniqueElements(value);
    }
    function clearIsolation() {
      releases.splice(0).reverse().forEach(function (release) { release(); });
    }
    function isolateBranch(node, allowed) {
      if (!node || node.nodeType !== 1 || isFrameworkFocusGuard(node)) return;
      if (nodeInsideAllowed(node, allowed)) return;
      if (nodeContainsAllowed(node, allowed) && node.children && node.children.length) {
        Array.prototype.slice.call(node.children).forEach(function (child) { isolateBranch(child, allowed); });
        return;
      }
      releases.push(isolateNode(node));
    }
    function applyIsolation() {
      if (!active || destroyed || applying) return false;
      applying = true;
      try {
        clearIsolation();
        var boundary = settings.boundary || doc && doc.body;
        if (!boundary || !boundary.children) return false;
        var allowed = containers();
        Array.prototype.slice.call(boundary.children).forEach(function (child) { isolateBranch(child, allowed); });
        return true;
      } finally { applying = false; }
    }
    function startObserver() {
      if (stopObserver || settings.observe === false) return;
      var boundary = settings.boundary || doc && doc.body;
      if (!boundary) return;
      stopObserver = ObserverHub.mutation(boundary, function () { if (active && !applying) applyIsolation(); }, {
        schedule: 'mutate',
        observeOptions: { childList: true, subtree: true }
      });
    }
    function stopObserving() { if (stopObserver) { stopObserver(); stopObserver = null; } }
    function activate() {
      if (destroyed || active) return false;
      active = true;
      activeIsolations += 1;
      applyIsolation();
      startObserver();
      return true;
    }
    function deactivate() {
      if (!active) return false;
      active = false;
      activeIsolations = Math.max(0, activeIsolations - 1);
      stopObserving();
      clearIsolation();
      return true;
    }
    function refresh() { return active ? applyIsolation() : false; }
    function destroy() { if (destroyed) return false; deactivate(); destroyed = true; isolationsDestroyed += 1; return true; }
    var api = { activate: activate, deactivate: deactivate, refresh: refresh, destroy: destroy, getContainers: containers };
    Object.defineProperties(api, {
      active: { enumerable: true, get: function () { return active; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });
    return Object.freeze(api);
  }

export const InteractionIsolation = Object.freeze({ create, getStats: function () { return Object.freeze({ created: isolationsCreated, destroyed: isolationsDestroyed, liveIsolations: Math.max(0, isolationsCreated - isolationsDestroyed), active: activeIsolations }); } });
export { create };
