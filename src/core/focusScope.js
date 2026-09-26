
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { InteractionDetails } from './interactionDetails.js';
import { FocusManager } from './focusManager.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

var MODES = ['none', 'exit', 'contain', 'trap'];
  var focusScopesCreated = 0, focusScopesDestroyed = 0, activeFocusScopes = 0;
  var scopeStacks = typeof WeakMap === 'function' ? new WeakMap() : null;
  function stackFor(doc) { var stack = scopeStacks && scopeStacks.get(doc); if (!stack) { stack = []; if (scopeStacks) scopeStacks.set(doc, stack); } return stack; }

  function normalizeMode(value) {
    if (value === true) return 'contain';
    if (value === false || value === undefined || value === null || value === '') return 'none';
    var mode = String(value).toLowerCase();
    if (MODES.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] FocusScope mode must be none, exit, contain, or trap.');
    return mode;
  }

  function uniqueElements(values) {
    var out = [];
    (Array.isArray(values) ? values : [values]).forEach(function (node) {
      if (!node || node.nodeType !== 1 || out.indexOf(node) >= 0) return;
      out.push(node);
    });
    return out;
  }

  function create(options) {
    focusScopesCreated += 1;
    var settings = Utils.mergeOwn(options || {});
    var root = settings.root;
    var doc = settings.document || global.document;
    if (!root || root.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] FocusScope root is required.');

    var manager = settings.focusManager || FocusManager.create({ document: doc });
    var mode = normalizeMode(settings.mode);
    var listenerScope = null;
    var active = false;
    var redirectingFocus = false;
    var destroyed = false;
    var beforeGuard = null, afterGuard = null;

    function resolvedContainers(kind) {
      var getter = kind === 'exit' && typeof settings.getExitContainers === 'function' ? settings.getExitContainers : settings.getContainers;
      var values = typeof getter === 'function' ? getter() : [root];
      var list = uniqueElements(values);
      if (kind !== 'exit' && settings.includeRoot !== false && list.indexOf(root) < 0) list.unshift(root);
      return list;
    }

    function tabbables(kind) {
      var out = [];
      resolvedContainers(kind).forEach(function (container) {
        if (manager.isTabbable && manager.isTabbable(container) && out.indexOf(container) < 0) out.push(container);
        manager.tabbable(container).forEach(function (node) {
          if (node && node.isConnected !== false && out.indexOf(node) < 0) out.push(node);
        });
      });
      return out;
    }

    function containsIn(target, kind) {
      if (!target) return false;
      if (kind !== 'exit' && typeof settings.containsTarget === 'function' && settings.containsTarget(target) === true) return true;
      return resolvedContainers(kind).some(function (container) {
        return target === container || !!(container.contains && container.contains(target));
      });
    }

    function containsTarget(target) { return containsIn(target, 'scope'); }

    function fallbackTarget() {
      var candidate = typeof settings.fallbackFocus === 'function' ? settings.fallbackFocus() : settings.fallbackFocus;
      if (!candidate) candidate = typeof settings.initialFocus === 'function' ? settings.initialFocus() : settings.initialFocus;
      return candidate || root;
    }

    function routeContainedTab(event) {
      var current = doc && doc.activeElement || event.target;
      if (!containsTarget(current)) {
        if (mode === 'trap') {
          if (event.preventDefault) event.preventDefault();
          var outsideNodes = tabbables('scope');
          manager.focus(event.shiftKey && outsideNodes.length ? outsideNodes[outsideNodes.length - 1] : (outsideNodes[0] || fallbackTarget()), { origin:'keyboard', source:'focus-scope-tab' });
          return true;
        }
        return false;
      }

      var nodes = tabbables('scope');
      if (!nodes.length) {
        if (event.preventDefault) event.preventDefault();
        manager.focus(fallbackTarget());
        return true;
      }

      var index = nodes.indexOf(current);
      var nextIndex = event.shiftKey
        ? (index <= 0 ? nodes.length - 1 : index - 1)
        : (index < 0 || index >= nodes.length - 1 ? 0 : index + 1);
      if (event.preventDefault) event.preventDefault();
      manager.focus(nodes[nextIndex], { origin:'keyboard', source:'focus-scope-tab' });
      return true;
    }

    function routeExitTab(event) {
      var current = doc && doc.activeElement || event.target;
      if (!containsIn(current, 'exit')) return false;
      var nodes = tabbables('exit');
      var index = nodes.indexOf(current);
      var boundary = !nodes.length || index < 0 || (event.shiftKey ? index === 0 : index === nodes.length - 1);
      if (!boundary) {
        var nextIndex = event.shiftKey ? index - 1 : index + 1;
        if (event.preventDefault) event.preventDefault();
        manager.focus(nodes[nextIndex]);
        return true;
      }
      if (typeof settings.onExit !== 'function') return false;
      var detail = InteractionDetails.create('tab-exit', event, {
        source: 'keyboard',
        direction: event.shiftKey ? 'backward' : 'forward',
        current: current || null,
        currentTarget: root,
        scope: api
      });
      return settings.onExit(detail) === true && detail.cancelled !== true;
    }

    function isTopScope() { var stack = stackFor(doc); return !stack.length || stack[stack.length - 1] === api; }

    function onKeyDown(event) {
      if (!active || !isTopScope() || !event || event.defaultPrevented === true || event.key !== 'Tab') return;
      if (mode === 'contain' || mode === 'trap') routeContainedTab(event);
      else if (mode === 'exit') routeExitTab(event);
    }

    function redirectFocusInside() {
      if (!active || redirectingFocus) return false;
      redirectingFocus = true;
      try {
        var nodes = tabbables('scope');
        return nodes.length ? manager.focus(nodes[0]) : manager.focus(fallbackTarget());
      } finally { redirectingFocus = false; }
    }

    function removeGuards() {
      [beforeGuard, afterGuard].forEach(function (guard) { if (guard && guard.parentNode) guard.parentNode.removeChild(guard); });
      beforeGuard = afterGuard = null;
    }
    function createGuards() {
      removeGuards();
      if (mode !== 'trap' || settings.guards === false || !root.parentNode || !doc || !doc.createElement) return;
      function makeGuard(direction) {
        var guard = doc.createElement('span');
        guard.className = 'qxframe9a7c2-focus-guard';
        guard.tabIndex = 0;
        guard.setAttribute('data-qxframe9a7c2-focus-guard', direction);
        guard.style.position = 'fixed'; guard.style.width = '1px'; guard.style.height = '1px'; guard.style.overflow = 'hidden'; guard.style.opacity = '0'; guard.style.pointerEvents = 'none';
        return guard;
      }
      beforeGuard = makeGuard('before'); afterGuard = makeGuard('after');
      root.parentNode.insertBefore(beforeGuard, root);
      if (root.nextSibling) root.parentNode.insertBefore(afterGuard, root.nextSibling); else root.parentNode.appendChild(afterGuard);
      listenerScope.add(DOM.listen(beforeGuard, 'focus', function () { if (!active || !isTopScope()) return; var nodes = tabbables('scope'); manager.focus(nodes[nodes.length - 1] || fallbackTarget()); }));
      listenerScope.add(DOM.listen(afterGuard, 'focus', function () { if (!active || !isTopScope()) return; var nodes = tabbables('scope'); manager.focus(nodes[0] || fallbackTarget()); }));
    }

    function onFocusIn(event) {
      if (!active || !isTopScope() || mode !== 'trap' || redirectingFocus || !event || !event.target) return;
      if (containsTarget(event.target)) return;
      redirectFocusInside();
    }

    function activate() {
      if (destroyed || active || mode === 'none') return false;
      active = true;
      activeFocusScopes += 1;
      var activeStack = stackFor(doc);
      if (activeStack.indexOf(api) < 0) activeStack.push(api);
      if (settings.captureFocus !== false) manager.capture();
      listenerScope = Lifecycle.createScope();
      if (doc) {
        listenerScope.add(DOM.listen(doc, 'keydown', onKeyDown, true));
        if (mode === 'trap') listenerScope.add(DOM.listen(doc, 'focusin', onFocusIn, true));
      }
      createGuards();
      var focusOnActivate = typeof settings.focusOnActivate === 'function'
        ? settings.focusOnActivate() !== false
        : settings.focusOnActivate === true;
      if (focusOnActivate) {
        var initial = typeof settings.initialFocus === 'function' ? settings.initialFocus() : settings.initialFocus;
        if (!initial || !manager.focus(initial)) redirectFocusInside();
      }
      if (typeof settings.onActivate === 'function') settings.onActivate(api);
      return true;
    }

    function deactivate(options) {
      if (!active) return false;
      active = false;
      activeFocusScopes = Math.max(0, activeFocusScopes - 1);
      var activeStack = stackFor(doc);
      var stackIndex = activeStack.lastIndexOf(api);
      if (stackIndex >= 0) activeStack.splice(stackIndex, 1);
      if (listenerScope) { listenerScope.dispose(); listenerScope = null; }
      removeGuards();
      var local = options || {};
      if (local.restoreFocus !== false && settings.restoreFocus !== false && settings.captureFocus !== false) manager.restore();
      if (typeof settings.onDeactivate === 'function') settings.onDeactivate(api);
      return true;
    }

    function destroy() {
      if (destroyed) return false;
      deactivate({ restoreFocus: settings.restoreFocus !== false });
      if (!settings.focusManager) manager.destroy();
      destroyed = true;
      focusScopesDestroyed += 1;
      return true;
    }

    var api = {
      activate: activate,
      deactivate: deactivate,
      containsTarget: containsTarget,
      getMode: function () { return mode; },
      getTabbableElements: function () { return tabbables('scope').slice(); },
      destroy: destroy
    };
    Object.defineProperties(api, {
      active: { enumerable: true, get: function () { return active; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });
    return api;
  }

export const FocusScope = Object.freeze({ create, normalizeMode, getStats: function () { return Object.freeze({ created: focusScopesCreated, destroyed: focusScopesDestroyed, liveScopes: Math.max(0, focusScopesCreated - focusScopesDestroyed), active: activeFocusScopes }); } });
export { create, normalizeMode };
