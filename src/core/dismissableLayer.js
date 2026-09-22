
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { InteractionDetails } from './interactionDetails.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

function create(options) {
    var settings = options || {};
    var root = settings.root;
    var doc = settings.document || global.document;
    if (!root) throw new TypeError('[QXFRAME9A7C2] DismissableLayer root is required.');

    var scope = null;
    var active = false;
    var destroyed = false;
    var handle = null;
    var excludes = Array.isArray(settings.exclude) ? settings.exclude.slice() : [];

    function resolve(value) { return Utils.isFunction(value) ? value() : value; }

    function contains(target) {
      if (!target) return false;
      if (target === root || (root.contains && root.contains(target))) return true;
      for (var i = 0; i < excludes.length; i += 1) {
        var node = resolve(excludes[i]);
        if (node && (node === target || (node.contains && node.contains(target)))) return true;
      }
      if (Utils.isFunction(settings.containsTarget) && settings.containsTarget(target) === true) return true;
      return false;
    }

    function isTop() { return !handle || handle.isTop(); }

    function dispatchDismiss(reason, event, requireTop) {
      if (!active || destroyed || (requireTop !== false && !isTop())) return false;
      var detail = InteractionDetails.create(reason, event || null, { layer: api, currentTarget: root });
      if (Utils.isFunction(settings.onDismiss) && settings.onDismiss(detail) === false) detail.cancel();
      return detail.cancelled !== true;
    }
    function dismiss(reason, event) { return dispatchDismiss(reason, event, true); }
    function requestDismiss(reason, event) { return dispatchDismiss(reason, event, false); }

    function onPointerDown(event) {
      if (!active || !isTop() || !event || contains(event.target)) return;
      if (Utils.isFunction(settings.onPointerDownOutside)) {
        if (settings.onPointerDownOutside({
          originalEvent: event,
          target: event.target,
          layer: api
        }) === false) return;
      }
      if (settings.closeOnOutsidePress !== false) dismiss('outside', event);
    }

    function onFocusIn(event) {
      if (!active || !isTop() || !event || contains(event.target)) return;
      if (settings.closeOnFocusOutside !== true) return;
      if (Utils.isFunction(settings.onFocusOutside)) {
        if (settings.onFocusOutside({ originalEvent: event, target: event.target, layer: api }) === false) return;
      }
      dismiss('focus-outside', event);
    }

    function onKeyDown(event) {
      if (!active || !isTop() || !event || event.key !== 'Escape') return;
      if (DOM.isComposingEvent(event)) return;
      if (settings.closeOnEscape === false) return;
      if (Utils.isFunction(settings.onEscapeKeyDown)) {
        if (settings.onEscapeKeyDown({ originalEvent: event, layer: api }) === false) return;
      }
      dismiss('escape', event);
    }

    function activate() {
      if (destroyed || active) return false;
      active = true;
      scope = Lifecycle.createScope();
      if (settings.layerManager) {
        handle = settings.layerManager.register(root, {
          id: settings.id,
          parentId: settings.parentId,
          kind: settings.kind || 'popup',
          componentType: settings.componentType || null,
          group: settings.group === undefined ? null : settings.group,
          zIndexOffset: settings.zIndexOffset,
          requestDismiss: function (payload) { return requestDismiss(payload && payload.reason || 'layer-manager', payload && payload.originalEvent || null); },
          requestTeardown: function (payload) {
            if (Utils.isFunction(settings.onTeardown)) { settings.onTeardown(payload || {}); return true; }
            requestDismiss(payload && payload.reason || 'parent-teardown', payload && payload.originalEvent || null);
            return true;
          }
        });
      }
      if (doc) {
        scope.add(DOM.listen(doc, 'pointerdown', onPointerDown, true));
        scope.add(DOM.listen(doc, 'focusin', onFocusIn, true));
        scope.add(DOM.listen(doc, 'keydown', onKeyDown, true));
      }
      return true;
    }

    function deactivate() {
      if (!active) return false;
      active = false;
      if (scope) {
        scope.dispose();
        scope = null;
      }
      if (handle) {
        handle.unregister();
        handle = null;
      }
      return true;
    }

    function destroy() {
      if (destroyed) return false;
      deactivate();
      destroyed = true;
      return true;
    }

    var api = { activate: activate, deactivate: deactivate, contains: contains, dismiss: dismiss, requestDismiss: requestDismiss, destroy: destroy };
    Object.defineProperties(api, {
      active: { enumerable: true, get: function () { return active; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } },
      layerId: { enumerable: true, get: function () { return handle ? handle.id : null; } },
      zIndex: { enumerable: true, get: function () { return handle ? handle.getZIndex() : null; } }
    });
    return api;
  }

export const DismissableLayer = Object.freeze({ create });
export { create };
