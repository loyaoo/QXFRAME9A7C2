// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { MotionCore } from './motion.js';
import { MotionPresets } from './motionPresets.js';

var LEGACY_OPTIONS = Object.freeze(['motion', 'target', 'el']);

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function rejectLegacy(settings) {
  LEGACY_OPTIONS.forEach(function (key) {
    if (own(settings, key)) throw new TypeError('[QXFRAME9A7C2] Transition does not accept legacy/internal option "' + key + '".');
  });
}
function create(options) {
  var settings = options || {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
    throw new TypeError('[QXFRAME9A7C2] Transition.create(options) requires an object.');
  }
  rejectLegacy(settings);
  if (!own(settings, 'transition') || !settings.transition) {
    throw new TypeError('[QXFRAME9A7C2] Transition.create(options) requires transition.');
  }

  var core = MotionCore.create({
    element: settings.element || null,
    mount: settings.mount,
    unmount: settings.unmount,
    motion: settings.transition,
    visible: settings.visible === true,
    appear: settings.appear,
    enter: settings.enter,
    leave: settings.leave,
    reducedMotion: settings.reducedMotion,
    disabled: settings.disabled,
    duration: settings.duration,
    deadlinePadding: settings.deadlinePadding,
    onStateChange: settings.onStateChange,
    onPrepare: settings.onPrepare,
    onPrepareError: settings.onPrepareError,
    onStart: settings.onStart,
    onActive: settings.onActive,
    onBeforeEnter: settings.onBeforeEnter,
    onAfterEnter: settings.onAfterEnter,
    onBeforeLeave: settings.onBeforeLeave,
    onAfterLeave: settings.onAfterLeave,
    onVisibleChanged: settings.onVisibleChanged,
    onInterrupt: settings.onInterrupt
  });

  return Object.freeze({
    setVisible: function (visible, meta) { return core.setVisible(visible === true, meta); },
    getState: core.getState,
    whenSettled: core.whenSettled,
    destroy: core.destroy
  });
}


export const Transition = Object.freeze({ create, normalizeTransition: MotionCore.normalizeMotion, detectTransition: MotionCore.detectMotion, waitTransitionEnd: MotionCore.waitMotionEnd, presets: MotionPresets, presetNames: MotionPresets.names(), STATUS: MotionCore.STATUS, STEPS: MotionCore.STEPS });
export { create };
