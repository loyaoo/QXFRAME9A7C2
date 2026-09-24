
import { Utils } from '../utils/utils.js';
import { IdManager } from '../utils/id.js';
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { DOMProjection } from './domProjection.js';
import { DismissableLayer } from './dismissableLayer.js';
import { LayerManager } from './layerManager.js';
import { FocusManager } from './focusManager.js';
import { FocusScope } from './focusScope.js';
import { InteractionIsolation } from './interactionIsolation.js';
import { ScrollLock } from './scrollLock.js';
import { PositionAdapter } from './position.js';

const global = globalThis;
const LAYER_ID_PROPERTY = LayerManager.LAYER_ID_PROPERTY || '__qxframe9a7c2LayerId';

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function create(options) {
  var settings = Utils.mergeOwn(options || {});
  var reference = settings.reference || null;
  var floating = settings.floating;
  if (!floating || floating.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] OverlayRuntime floating must be an Element.');

  var documentRef = settings.document || floating.ownerDocument || (reference && reference.ownerDocument) || global.document;
  var sharedLayerManager = LayerManager.getShared(documentRef);
  var initialParent = floating.parentNode || null;
  var initialNextSibling = floating.nextSibling || null;
  var portalContainer = settings.portalContainer || initialParent || (documentRef && documentRef.body);
  if (!documentRef || !documentRef.createElement || !portalContainer || !portalContainer.appendChild) {
    throw new TypeError('[QXFRAME9A7C2] OverlayRuntime requires a document and portal container.');
  }

  if (floating.parentNode) floating.parentNode.removeChild(floating);

  var positioner = settings.positionAdapter || PositionAdapter.create({ floating: settings.floatingApi });
  var focusManager = settings.focusManager || FocusManager.create({ document: documentRef });
  var popupHost = null;
  var dismissLayer = null;
  var focusScope = null;
  var interactionIsolation = null;
  var scrollLock = null;
  var positionMount = null;
  var active = false;
  var interactionActive = false;
  var destroyed = false;
  var zIndexProjection = null;
  var previousLayerMarker = floating[LAYER_ID_PROPERTY] || null;
  if (settings.manageLayer !== false) {
    if (!settings.layerId) settings.layerId = IdManager.next('overlay-runtime');
    try { floating[LAYER_ID_PROPERTY] = String(settings.layerId); } catch (_) {}
  }

  function activeLayerManager() { return settings.manageLayer === false ? null : (settings.layerManager || sharedLayerManager); }

  function resolvedParentLayerId() {
    if (settings.parentLayerId === false) return null;
    if (settings.parentLayerId !== undefined && settings.parentLayerId !== null && settings.parentLayerId !== '') return String(settings.parentLayerId);
    var manager = activeLayerManager();
    return manager && manager.findParentId ? manager.findParentId(reference) : null;
  }

  function resolvedZIndex() {
    // Public zIndex is a relative offset owned by LayerManager, never an absolute global layer.
    return dismissLayer && dismissLayer.zIndex !== null ? dismissLayer.zIndex : null;
  }
  function projectZIndex() {
    if (!floating.style || settings.manageZIndex === false) return;
    if (!zIndexProjection) zIndexProjection = DOMProjection.create();
    var value = resolvedZIndex();
    if (value !== null) zIndexProjection.setStyle(floating, 'z-index', String(value));
  }
  function clearProjectedZIndex() {
    if (!zIndexProjection) return;
    zIndexProjection.destroy();
    zIndexProjection = null;
  }
  var api = null;

  function ensureTransport() {
    if (popupHost && popupHost.parentNode === portalContainer && floating.parentNode === popupHost) return popupHost;
    popupHost = documentRef.createElement('div');
    try { popupHost.__qxframe9a7c2PopupHost = true; } catch (_) {}
    portalContainer.appendChild(popupHost);
    popupHost.appendChild(floating);
    return popupHost;
  }

  function unmountTransport(restoreInitial) {
    if (active) throw new Error('[QXFRAME9A7C2] OverlayRuntime cannot unmount transport while active.');
    if (popupHost && floating.parentNode === popupHost) popupHost.removeChild(floating);
    if (popupHost && popupHost.parentNode) popupHost.parentNode.removeChild(popupHost);
    popupHost = null;
    if (restoreInitial === true && initialParent) {
      if (initialNextSibling && initialNextSibling.parentNode === initialParent && initialParent.insertBefore) initialParent.insertBefore(floating, initialNextSibling);
      else initialParent.appendChild(floating);
    }
    return true;
  }

  function resolveTabExitTarget(meta) {
    var value = Utils.isFunction(settings.tabExitTarget) ? settings.tabExitTarget(meta || {}) : settings.tabExitTarget;
    return value || reference || null;
  }

  function resolvedFocusScopeMode() {
    if (settings.trapFocus === true) return 'trap';
    var value = settings.focusScope;
    if (value === undefined || value === null || value === '' || value === 'auto') return settings.closeOnTabExit === true ? 'exit' : 'none';
    return FocusScope.normalizeMode(value);
  }

  function popupTreeElements() {
    var manager = activeLayerManager();
    var id = dismissLayer && dismissLayer.layerId;
    var values = manager && id && manager.getTreeElements ? manager.getTreeElements(id) : [floating];
    if (!Array.isArray(values)) values = [values];
    if (values.indexOf(floating) < 0) values.unshift(floating);
    return values.filter(function (node, index, list) { return !!node && node.nodeType === 1 && list.indexOf(node) === index; });
  }

  function focusScopeContainers() {
    var mode = resolvedFocusScopeMode();
    var values = popupTreeElements();
    if (mode !== 'trap' && reference && values.indexOf(reference) < 0) values.unshift(reference);
    return values;
  }

  function focusScopeContainsTarget(target) {
    var mode = resolvedFocusScopeMode();
    if (mode !== 'trap' && reference && (target === reference || (reference.contains && reference.contains(target)))) return true;
    var manager = activeLayerManager();
    var id = dismissLayer && dismissLayer.layerId;
    if (manager && id && manager.containsTarget && manager.containsTarget(id, target)) return true;
    return mode !== 'trap' && Utils.isFunction(settings.containsTarget) && settings.containsTarget(target) === true;
  }

  function focusOnScopeActivate() {
    return resolvedFocusScopeMode() === 'trap' ? settings.focusOnActivate !== false : settings.focusOnActivate === true;
  }

  function createFocusScope() {
    var mode = resolvedFocusScopeMode();
    if (mode === 'none' || focusScope) return focusScope;
    focusScope = FocusScope.create({
      root: mode === 'trap' ? floating : (reference || floating),
      mode: mode,
      document: documentRef,
      focusManager: focusManager,
      captureFocus: false,
      getContainers: focusScopeContainers,
      getExitContainers: focusScopeContainers,
      containsTarget: focusScopeContainsTarget,
      initialFocus: function () { return Utils.isFunction(settings.initialFocus) ? settings.initialFocus() : settings.initialFocus; },
      fallbackFocus: function () {
        var candidate = Utils.isFunction(settings.fallbackFocus) ? settings.fallbackFocus() : settings.fallbackFocus;
        return candidate || (Utils.isFunction(settings.initialFocus) ? settings.initialFocus() : settings.initialFocus) || resolveTabExitTarget({ reason:'focus-scope-fallback' }) || floating;
      },
      focusOnActivate: focusOnScopeActivate,
      restoreFocus: false,
      onExit: function (payload) {
        if (!dismissLayer) return false;
        var event = payload && payload.originalEvent || null;
        var accepted = dismissLayer.requestDismiss('tab-exit', event);
        if (accepted !== true) return false;
        var current = payload && payload.current || null;
        var currentInReference = !!(reference && current && (current === reference || (reference.contains && reference.contains(current))));
        // When real focus is already on the authored reference/control, do not synchronously
        // refocus it during Tab exit. Let the browser advance naturally after the popup closes.
        // Only a real focus that lives inside a portaled popup needs a reference handoff first.
        if (!currentInReference) {
          var target = resolveTabExitTarget({ reason: 'tab-exit', originalEvent: event, direction: payload && payload.direction || 'forward' });
          if (target) focusManager.focus(target);
        }
        return true;
      }
    });
    return focusScope;
  }

  function rebuildFocusScope() {
    if (focusScope) { focusScope.destroy(); focusScope = null; }
    if (!active || !interactionActive || resolvedFocusScopeMode() === 'none') return null;
    createFocusScope();
    if (focusScope) focusScope.activate();
    return focusScope;
  }

  function releaseResources() {
    if (dismissLayer) { dismissLayer.deactivate(); dismissLayer.destroy(); dismissLayer = null; }
    if (focusScope) { focusScope.destroy(); focusScope = null; }
    if (interactionIsolation) { interactionIsolation.destroy(); interactionIsolation = null; }
    if (scrollLock) { scrollLock.destroy(); scrollLock = null; }
  }

  function hasManagedFocusReturn() {
    return settings.restoreFocusOnDeactivate !== undefined && settings.restoreFocusOnDeactivate !== false;
  }

  function shouldRestoreFocus(meta) {
    if (!hasManagedFocusReturn()) return false;
    if (Utils.isFunction(settings.restoreFocusOnDeactivate)) return settings.restoreFocusOnDeactivate(meta || {}) === true;
    return settings.restoreFocusOnDeactivate === true;
  }

  function resolveRestoreTarget(meta) {
    var value = Utils.isFunction(settings.restoreFocusTarget) ? settings.restoreFocusTarget(meta || {}) : settings.restoreFocusTarget;
    return value || reference || null;
  }

  function ensureResources() {
    if (!dismissLayer) {
      dismissLayer = DismissableLayer.create({
        root: floating,
        document: documentRef,
        layerManager: activeLayerManager(),
        parentId: resolvedParentLayerId(),
        id: settings.layerId,
        kind: settings.layerKind || 'popup',
        componentType: settings.componentType || null,
        group: settings.group === undefined ? null : settings.group,
        zIndexOffset: settings.zIndex,
        exclude: [reference].concat(settings.exclude || []),
        containsTarget: settings.containsTarget,
        closeOnOutsidePress: settings.closeOnOutsidePress !== false,
        closeOnFocusOutside: settings.closeOnFocusOutside === true,
        closeOnEscape: settings.closeOnEscape !== false,
        onDismiss: function (payload) {
          if (Utils.isFunction(settings.onDismiss)) return settings.onDismiss(payload) !== false;
          return true;
        },
        onTeardown: function (payload) {
          if (Utils.isFunction(settings.onDismiss)) { try { settings.onDismiss(payload); } catch (_) {} }
          if (active) deactivate({ reason: payload && payload.reason || 'parent-teardown', originalEvent: payload && payload.originalEvent || null, restoreFocus: false, structural: true });
          return true;
        }
      });
    }
    if (resolvedFocusScopeMode() !== 'none' && !focusScope) createFocusScope();
    if (resolvedFocusScopeMode() === 'trap' && settings.isolateInteractions !== false && !interactionIsolation) {
      interactionIsolation = InteractionIsolation.create({ root: popupHost || floating, document: documentRef, boundary: portalContainer, getContainers: function () { return [popupHost || floating].concat(popupTreeElements()); } });
    }
    if (settings.lockScroll === true && !scrollLock) {
      scrollLock = ScrollLock.create({
        document: documentRef,
        window: settings.window || global,
        target: settings.scrollLockTarget,
        compensateScrollbar: settings.compensateScrollbar !== false
      });
    }
  }

  function mountPosition() {
    var positionReference = settings.positionReference || reference;
    if (!active || !positionReference || settings.position === false) return;
    positionMount = positioner.mount(positionReference, floating, {
      placement: settings.placement || 'bottom-start',
      strategy: settings.strategy || 'absolute',
      offset: settings.offset,
      middleware: settings.middleware,
      flipOnOverflow: settings.flipOnOverflow === true,
      matchReferenceWidth: settings.matchReferenceWidth === true,
      autoUpdate: settings.autoUpdate !== false,
      autoUpdateOptions: settings.autoUpdateOptions,
      useTransformPosition: settings.useTransformPosition === true,
      inlinePositioning: settings.inlinePositioning === true,
      inlinePositioningOptions: settings.inlinePositioningOptions,
      arrow: settings.arrow === true,
      arrowElement: settings.arrowElement || null,
      arrowPadding: settings.arrowPadding,
      apply: settings.applyPosition,
      onUpdate: settings.onPositionUpdate,
      onError: settings.onPositionError
    });
  }

  function rebuildDismissLayer() {
    if (dismissLayer) { dismissLayer.deactivate(); dismissLayer.destroy(); dismissLayer = null; }
    if (!active) return;
    ensureResources();
    if (interactionActive) dismissLayer.activate();
    rebuildFocusScope();
    projectZIndex();
  }

  function mount() {
    if (destroyed) return false;
    ensureTransport();
    return true;
  }

  function activateInteraction(meta) {
    if (destroyed || !active || interactionActive) return false;
    interactionActive = true;
    ensureResources();
    if (dismissLayer) dismissLayer.activate();
    if (focusScope) focusScope.activate();
    else if (resolvedFocusScopeMode() !== 'none') { createFocusScope(); if (focusScope) focusScope.activate(); }
    if (scrollLock) scrollLock.lock();
    if (interactionIsolation) interactionIsolation.activate();
    if (Utils.isFunction(settings.onInteractionActivate)) settings.onInteractionActivate(meta || null, api);
    return true;
  }

  function deactivateInteraction(meta) {
    if (!active || !interactionActive) return false;
    interactionActive = false;
    if (dismissLayer) dismissLayer.deactivate();
    if (focusScope) focusScope.deactivate({ restoreFocus: false });
    if (interactionIsolation) interactionIsolation.deactivate();
    if (scrollLock) scrollLock.unlock();
    if (Utils.isFunction(settings.onInteractionDeactivate)) settings.onInteractionDeactivate(meta || null, api);
    return true;
  }

  function activate(meta) {
    if (destroyed || active) return false;
    ensureTransport();
    ensureResources();
    active = true;
    interactionActive = true;
    dismissLayer.activate();
    projectZIndex();
    if (scrollLock) scrollLock.lock();
    if (interactionIsolation) interactionIsolation.activate();
    mountPosition();
    var shouldCaptureFocus = hasManagedFocusReturn() || (focusOnScopeActivate() && settings.restoreFocus !== false);
    if (shouldCaptureFocus) focusManager.capture();
    if (focusScope) focusScope.activate();
    else if (settings.focusOnActivate === true) {
      var initial = Utils.isFunction(settings.initialFocus) ? settings.initialFocus() : settings.initialFocus;
      if (initial) focusManager.focus(initial);
      else focusManager.focusFirst(floating);
    }
    if (Utils.isFunction(settings.onActivate)) settings.onActivate(meta || null, api);
    return true;
  }

  function deactivate(meta) {
    if (!active) return false;
    var detail = meta || {};
    deactivateInteraction(detail);
    active = false;
    if (positionMount) { positionMount.destroy(); positionMount = null; }
    clearProjectedZIndex();
    if (shouldRestoreFocus(detail)) {
      var restoreTarget = resolveRestoreTarget(detail);
      if (!restoreTarget || !focusManager.focus(restoreTarget)) focusManager.restore();
    } else if (focusOnScopeActivate() && settings.restoreFocus !== false) {
      focusManager.restore();
    }
    if (Utils.isFunction(settings.onDeactivate)) settings.onDeactivate(detail, api);
    if (settings.destroyOnDeactivate !== false) {
      releaseResources();
      unmountTransport(false);
    }
    return true;
  }

  function updatePosition(reason) {
    if (!active || !positionMount) return false;
    return positionMount.update(reason || 'api');
  }

  function preparePosition(reason) {
    if (!active || !positionMount || !positionMount.flush) return Promise.resolve(null);
    return positionMount.flush(reason || 'motion-prepare');
  }

  function setPositionSuspended(suspended, reason) {
    if (!active || !positionMount || !positionMount.setSuspended) return false;
    return positionMount.setSuspended(suspended === true, reason || (suspended ? 'motion-suspend' : 'motion-resume'));
  }

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    var referenceChanged = own(next, 'reference') && next.reference !== reference;
    if (referenceChanged && settings.allowReferenceUpdate !== true && next.allowReferenceUpdate !== true) throw new Error('[QXFRAME9A7C2] OverlayRuntime reference is immutable; destroy and recreate to change it.');
    if (referenceChanged && (!next.reference || next.reference.nodeType !== 1)) throw new TypeError('[QXFRAME9A7C2] OverlayRuntime mutable reference must be an Element.');
    if (own(next, 'floating') && next.floating !== floating) throw new Error('[QXFRAME9A7C2] OverlayRuntime floating is immutable; destroy and recreate to change it.');
    if (own(next, 'document') && next.document !== documentRef) throw new Error('[QXFRAME9A7C2] OverlayRuntime document is immutable; destroy and recreate to change it.');
    if (own(next, 'portalContainer') && next.portalContainer !== portalContainer) throw new Error('[QXFRAME9A7C2] OverlayRuntime portalContainer is immutable; destroy and recreate to change it.');
    if (active && ['focusManager', 'positionAdapter'].some(function (key) { return own(next, key) && next[key] !== settings[key]; })) {
      throw new Error('[QXFRAME9A7C2] OverlayRuntime injected resource owners are immutable while active; deactivate before updating them.');
    }

    var focusScopeChanged = ['trapFocus', 'focusScope', 'closeOnTabExit'].some(function (key) { return own(next, key) && next[key] !== settings[key]; });
    var lockChanged = own(next, 'lockScroll') && next.lockScroll !== settings.lockScroll;
    var dismissKeys = ['manageLayer', 'layerManager', 'parentLayerId', 'layerId', 'layerKind', 'componentType', 'group', 'zIndex', 'exclude', 'containsTarget', 'closeOnOutsidePress', 'closeOnFocusOutside', 'closeOnEscape', 'onDismiss'];
    var positionKeys = ['position', 'positionReference', 'placement', 'strategy', 'offset', 'middleware', 'flipOnOverflow', 'matchReferenceWidth', 'autoUpdate', 'autoUpdateOptions', 'useTransformPosition', 'inlinePositioning', 'inlinePositioningOptions', 'arrow', 'arrowElement', 'arrowPadding', 'applyPosition', 'onPositionUpdate', 'onPositionError'];
    var dismissChanged = referenceChanged || dismissKeys.some(function (key) { return own(next, key) && next[key] !== settings[key]; });
    var positionChanged = referenceChanged || positionKeys.some(function (key) { return own(next, key) && next[key] !== settings[key]; });
    if (referenceChanged) reference = next.reference;
    Utils.copyOwn(settings, next);
    if (active && lockChanged) {
      if (scrollLock) { scrollLock.destroy(); scrollLock = null; }
      if (settings.lockScroll === true) { ensureResources(); if (scrollLock && interactionActive) scrollLock.lock(); }
    }
    if (dismissChanged) rebuildDismissLayer();
    else if (active && focusScopeChanged) rebuildFocusScope();
    if (active && positionChanged) {
      if (positionMount) { positionMount.destroy(); positionMount = null; }
      mountPosition();
    }
    if (!active && own(next, 'destroyOnDeactivate') && settings.destroyOnDeactivate !== false) {
      releaseResources();
      if (popupHost) unmountTransport(false);
    }
    return api;
  }

  function destroy() {
    if (destroyed) return false;
    if (active) deactivate({ reason: 'destroy', restoreFocus: false });
    if (positionMount) { positionMount.destroy(); positionMount = null; }
    releaseResources();
    if (!settings.positionAdapter) positioner.destroy();
    if (!settings.focusManager) focusManager.destroy();
    clearProjectedZIndex();
    if (popupHost) unmountTransport(true);
    else if (initialParent && floating.parentNode !== initialParent) {
      if (initialNextSibling && initialNextSibling.parentNode === initialParent && initialParent.insertBefore) initialParent.insertBefore(floating, initialNextSibling);
      else initialParent.appendChild(floating);
    }
    if (settings.manageLayer !== false) {
      try {
        if (previousLayerMarker) floating[LAYER_ID_PROPERTY] = previousLayerMarker;
        else delete floating[LAYER_ID_PROPERTY];
      } catch (_) {}
    }
    destroyed = true;
    return true;
  }

  api = Object.freeze({
    mount: mount,
    activate: activate,
    activateInteraction: activateInteraction,
    deactivateInteraction: deactivateInteraction,
    deactivate: deactivate,
    updatePosition: updatePosition,
    preparePosition: preparePosition,
    setPositionSuspended: setPositionSuspended,
    updateOptions: updateOptions,
    getState: function () {
      return Object.freeze({
        active: active,
        interactionActive: interactionActive,
        mounted: !!(popupHost && popupHost.parentNode && floating.parentNode === popupHost),
        layerId: dismissLayer ? dismissLayer.layerId : (settings.manageLayer !== false ? String(settings.layerId || '') || null : null),
        parentLayerId: resolvedParentLayerId(),
        focusScope: resolvedFocusScopeMode(),
        destroyed: destroyed
      });
    },
    destroy: destroy
  });
  return api;
}

export const OverlayRuntime = Object.freeze({ create });
export { create };
