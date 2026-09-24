import { OverlayRuntime } from './overlayRuntime.js';
import { LayerManager } from './layerManager.js';
import { Utils } from '../utils/utils.js';

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }

const CLOSE_REASONS = Object.freeze(['select','confirm','cancel','escape','outside-pointer','focus-outside','tab-exit','programmatic','ancestor-close','destroy','reopen']);

function normalizeReason(reason) {
  var value = String(reason == null || reason === '' ? 'programmatic' : reason);
  if (value === 'outside') return 'outside-pointer';
  if (value === 'api' || value === 'set-open') return 'programmatic';
  if (value === 'parent-teardown' || value === 'layer-manager') return 'ancestor-close';
  return value;
}


function createLayerLease(options) {
  var settings = options || {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('[QXFRAME9A7C2] OverlayController.createLayerLease(options) requires an object.');
  var element = settings.element || null;
  if (!element || element.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] OverlayController layer lease requires an Element.');
  var documentRef = settings.document || element.ownerDocument || globalThis.document;
  var manager = settings.layerManager || (documentRef ? LayerManager.getShared(documentRef) : null);
  if (!manager || typeof manager.register !== 'function') throw new TypeError('[QXFRAME9A7C2] OverlayController layer lease requires a LayerManager-compatible owner.');
  var entry = {
    id: settings.id,
    parentId: settings.parentId,
    kind: settings.kind,
    componentType: settings.componentType,
    group: settings.group,
    zIndexOffset: own(settings, 'zIndexOffset') ? settings.zIndexOffset : settings.zIndex,
    requestDismiss: settings.requestDismiss,
    requestTeardown: settings.requestTeardown
  };
  Object.keys(entry).forEach(function (key) { if (entry[key] === undefined) delete entry[key]; });
  var handle = manager.register(element, entry);
  var destroyed = false;
  var api = Object.freeze({
    update:function (next) {
      if (destroyed) return false;
      handle.update(next || {});
      return api;
    },
    bringToFront:function () { return !destroyed && handle.bringToFront ? handle.bringToFront() : false; },
    getZIndex:function () { return !destroyed && handle.getZIndex ? handle.getZIndex() : null; },
    getState:function () { return !destroyed && handle.getState ? handle.getState() : null; },
    destroy:function () {
      if (destroyed) return false;
      destroyed = true;
      if (handle.destroy) return handle.destroy();
      if (handle.unregister) return handle.unregister();
      return false;
    }
  });
  return api;
}

function create(options) {
  var settings = options || {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('[QXFRAME9A7C2] OverlayController.create(options) requires an object.');
  var runtime = settings.runtime || null;
  if (runtime) {
    if (typeof runtime.activate !== 'function' || typeof runtime.deactivate !== 'function' || typeof runtime.getState !== 'function' || typeof runtime.destroy !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] OverlayController runtime must expose OverlayRuntime-compatible methods.');
    }
  } else {
    var runtimeOptions = {};
    Utils.copyOwn(runtimeOptions, settings);
    delete runtimeOptions.runtime;
    delete runtimeOptions.ownsRuntime;
    runtime = OverlayRuntime.create(runtimeOptions);
  }
  var ownsRuntime = own(settings, 'ownsRuntime') ? settings.ownsRuntime !== false : !settings.runtime;

  var api = Object.freeze({
    mount:function () { return runtime.mount.apply(runtime, arguments); },
    activate:function () { return runtime.activate.apply(runtime, arguments); },
    activateInteraction:function () { return runtime.activateInteraction.apply(runtime, arguments); },
    deactivateInteraction:function () { return runtime.deactivateInteraction.apply(runtime, arguments); },
    deactivate:function () { return runtime.deactivate.apply(runtime, arguments); },
    updatePosition:function () { return runtime.updatePosition.apply(runtime, arguments); },
    preparePosition:function () { return runtime.preparePosition.apply(runtime, arguments); },
    setPositionSuspended:function () { return runtime.setPositionSuspended.apply(runtime, arguments); },
    updateOptions:function () { runtime.updateOptions.apply(runtime, arguments); return api; },
    getState:runtime.getState,
    getRuntime:function () { return runtime; },
    destroy:function () { return ownsRuntime ? runtime.destroy() : false; }
  });
  return api;
}

export const OverlayController = Object.freeze({ create:create, createLayerLease:createLayerLease, normalizeReason:normalizeReason, CLOSE_REASONS:CLOSE_REASONS });
export { create, createLayerLease, normalizeReason, CLOSE_REASONS };
