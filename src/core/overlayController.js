import { OverlayRuntime } from './overlayRuntime.js';

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }

const CLOSE_REASONS = Object.freeze(['select','confirm','cancel','escape','outside-pointer','focus-outside','tab-exit','programmatic','ancestor-close','destroy','reopen']);

function normalizeReason(reason) {
  var value = String(reason == null || reason === '' ? 'programmatic' : reason);
  if (value === 'outside') return 'outside-pointer';
  if (value === 'api' || value === 'set-open') return 'programmatic';
  if (value === 'parent-teardown' || value === 'layer-manager') return 'ancestor-close';
  return value;
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
    Object.keys(settings).forEach(function (key) { if (key !== 'runtime' && key !== 'ownsRuntime') runtimeOptions[key] = settings[key]; });
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

export const OverlayController = Object.freeze({ create:create, normalizeReason:normalizeReason, CLOSE_REASONS:CLOSE_REASONS });
export { create, normalizeReason, CLOSE_REASONS };
