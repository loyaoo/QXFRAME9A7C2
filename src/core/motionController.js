import { MotionCore } from './motion.js';

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }

function create(options) {
  var settings = options || {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('[QXFRAME9A7C2] MotionController.create(options) requires an object.');
  var core = settings.core || null;
  if (core) {
    if (typeof core.setVisible !== 'function' || typeof core.getState !== 'function' || typeof core.whenSettled !== 'function' || typeof core.destroy !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] MotionController core must expose MotionCore-compatible methods.');
    }
  } else {
    var coreOptions = {};
    Object.keys(settings).forEach(function (key) { if (key !== 'core' && key !== 'ownsCore') coreOptions[key] = settings[key]; });
    core = MotionCore.create(coreOptions);
  }
  var ownsCore = own(settings, 'ownsCore') ? settings.ownsCore !== false : !settings.core;

  function setVisible(visible, meta) { return core.setVisible(visible === true, meta); }
  function show(meta) { return setVisible(true, meta); }
  function hide(meta) { return setVisible(false, meta); }
  function retarget(visible, meta) { return setVisible(visible === true, meta); }
  function reverse(meta) {
    var state = core.getState();
    if (!state || state.destroyed) return false;
    return setVisible(state.visible !== true, meta);
  }
  function cancel(meta) { return typeof core.cancel === 'function' ? core.cancel(meta) : false; }
  function destroy() { return ownsCore ? core.destroy() : false; }

  return Object.freeze({
    show:show,
    hide:hide,
    setVisible:setVisible,
    retarget:retarget,
    reverse:reverse,
    cancel:cancel,
    whenSettled:core.whenSettled,
    getState:core.getState,
    getCore:function () { return core; },
    destroy:destroy
  });
}

export const MotionController = Object.freeze({
  create:create,
  normalizeMotion:MotionCore.normalizeMotion,
  detectMotion:MotionCore.detectMotion,
  waitMotionEnd:MotionCore.waitMotionEnd,
  getStats:MotionCore.getStats,
  STATUS:MotionCore.STATUS,
  STEPS:MotionCore.STEPS
});
export { create };
