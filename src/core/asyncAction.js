
import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { AsyncTask } from './asyncTask.js';
import { mergeOptions } from './options.js';

const global = globalThis;

var createdActions = 0, destroyedActions = 0;

function create(options) {
  var opts = mergeOptions({ cancelPrevious: true }, options || {});
  if (!Utils.isFunction(opts.action)) throw new TypeError('[QXFRAME9A7C2] AsyncAction action must be a function.');
  var emitter = Events.createEmitter();
  var destroyed = false;
  var task = null;
  var api = null;
  createdActions += 1;

  function stateName() { return destroyed ? 'destroyed' : task.state; }
  function snapshot() {
    var current = task ? task.snapshot() : { value: undefined, error: null, requestId: 0, pending: false };
    return Object.freeze({
      state: stateName(), value: current.value, error: current.error,
      requestId: current.requestId, pending: !destroyed && current.pending === true,
      destroyed: destroyed
    });
  }
  function report(error, detail) {
    try {
      if (Utils.isFunction(opts.onError)) opts.onError(error, detail || {});
      else if (global.console && Utils.isFunction(global.console.error)) global.console.error(error);
    } catch (_) {}
  }
  function notify(state, detail) {
    if (destroyed) return;
    var payload = Object.freeze(Object.assign({ state: state, action: api }, detail || {}));
    if (Utils.isFunction(opts.onStateChange)) {
      try { opts.onStateChange(snapshot(), payload); }
      catch (error) { report(error, { phase: 'state-change', state: state, action: api }); }
    }
    if (destroyed) return;
    if (state === 'error' && Utils.isFunction(opts.onError)) {
      try { opts.onError(detail && detail.error, payload); }
      catch (error) { report(error, { phase: 'error-handler', state: state, action: api }); }
    }
    if (destroyed) return;
    emitter.emit(state, payload);
    if (destroyed) return;
    emitter.emit('state-change', { state: snapshot(), detail: payload, action: api });
  }

  task = AsyncTask.create({
    ignoreStale: opts.cancelPrevious !== false,
    AbortController: opts.AbortController,
    task: function (input, context) { return opts.action(input, Object.assign({}, context, { action: api })); },
    onStateChange: function (state, detail) {
      var name = state.state;
      if (name === 'pending' || name === 'success' || name === 'error' || name === 'cancelled' || name === 'idle') notify(name, detail || {});
    },
    onError: report
  });

  function run(input, meta) {
    if (destroyed) return Promise.reject(new Error('[QXFRAME9A7C2] AsyncAction is destroyed.'));
    return task.run(input, meta || {});
  }
  function cancel(reason) { return !destroyed && task.cancel(reason || 'cancel'); }
  function reset() { return !destroyed && task.reset(); }
  function updateOptions(nextOptions) {
    if (destroyed) return false;
    var next = nextOptions || {};
    if (Object.prototype.hasOwnProperty.call(next, 'action') && !Utils.isFunction(next.action)) throw new TypeError('[QXFRAME9A7C2] AsyncAction action must be a function.');
    opts = mergeOptions(opts, next);
    return api;
  }
  function destroy() {
    if (destroyed) return false;
    task.destroy();
    destroyed = true;
    destroyedActions += 1;
    emitter.dispose();
    return true;
  }

  api = Object.freeze({ run: run, cancel: cancel, reset: reset, updateOptions: updateOptions, snapshot: snapshot, on: emitter.on, once: emitter.once, destroy: destroy });
  return api;
}
function getStats() { return Object.freeze({ createdActions: createdActions, destroyedActions: destroyedActions, activeActions: Math.max(0, createdActions - destroyedActions) }); }

export const AsyncAction = Object.freeze({ create, getStats });
export { create, getStats };
