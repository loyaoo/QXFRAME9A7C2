import { Events } from './events.js';

const CODES = Object.freeze({
  DUPLICATE_VALUE_OWNER: 'duplicate-value-owner',
  DUPLICATE_SELECTION_TRUTH: 'duplicate-selection-truth',
  DUPLICATE_ACTIVE_KEY_OWNER: 'duplicate-active-key-owner',
  STALE_GENERATION_PUBLISH: 'stale-generation-publish',
  CONTROLLER_AFTER_DISPOSE: 'controller-after-dispose',
  DUPLICATE_STABLE_KEY: 'duplicate-stable-key',
  OVERLAY_ORPHAN_LAYER: 'overlay-orphan-layer',
  FOCUS_RESTORE_DISCONNECTED: 'focus-restore-disconnected',
  MOTION_HANDLE_UNSETTLED: 'motion-handle-unsettled',
  FORM_CARRIER_DUPLICATE: 'form-carrier-duplicate',
  DOUBLE_MUTATION_ACTION: 'double-mutation-action',
  UNMANAGED_GLOBAL_LISTENER: 'unmanaged-global-listener'
});
const CODE_SET = new Set(Object.keys(CODES).map(function (key) { return CODES[key]; }));

function create(options) {
  var opts = options || {};
  var emitter = Events.createEmitter();
  var reports = [];
  var destroyed = false;

  function report(code, detail) {
    var normalized = String(code || '');
    if (!CODE_SET.has(normalized)) throw new TypeError('[QXFRAME9A7C2] Unknown diagnostic code: ' + normalized);
    if (destroyed || opts.enabled === false) return null;
    var record = Object.freeze({
      code: normalized,
      detail: detail || null,
      timestamp: typeof opts.now === 'function' ? opts.now() : Date.now()
    });
    reports.push(record);
    if (typeof opts.onReport === 'function') opts.onReport(record);
    emitter.emit('report', record);
    return record;
  }

  function getReports(code) {
    if (code === undefined) return reports.slice();
    var normalized = String(code);
    return reports.filter(function (record) { return record.code === normalized; });
  }

  function clear() {
    var count = reports.length;
    reports.length = 0;
    return count;
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    clear();
    emitter.dispose();
    return true;
  }

  return Object.freeze({
    report,
    getReports,
    clear,
    onReport: function (handler) { return emitter.on('report', handler); },
    destroy,
    get destroyed() { return destroyed; }
  });
}

export const Diagnostics = Object.freeze({ create, codes: CODES });
export { create };
