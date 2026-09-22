
import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { mergeOptions } from './options.js';

const global = globalThis;

var createdTasks = 0, destroyedTasks = 0, pendingTasks = 0;

function create(options) {
  var opts = mergeOptions({ ignoreStale: true }, options);
  if (!Utils.isFunction(opts.task)) throw new TypeError('[QXFRAME9A7C2] AsyncTask task must be a function.');
  var emitter = Events.createEmitter();
  var destroyed = false;
  var state = 'idle';
  var value;
  var error = null;
  var requestId = 0;
  var active = null;
  var api = null;
  createdTasks += 1;

  function snapshot() {
    return Object.freeze({ state: state, value: value, error: error, requestId: requestId, pending: state === 'pending', destroyed: destroyed });
  }

  function report(error, detail) {
    try {
      if (Utils.isFunction(opts.onError)) opts.onError(error, detail || {});
      else if (global.console && Utils.isFunction(global.console.error)) global.console.error(error);
    } catch (_) {}
  }
  function emit(name, detail) {
    if (destroyed) return;
    var payload = detail || {};
    if (Utils.isFunction(opts.onStateChange)) {
      try { opts.onStateChange(snapshot(), payload); }
      catch (callbackError) { report(callbackError, { phase: 'state-change', event: name, detail: payload, controller: api }); }
    }
    if (destroyed) return;
    emitter.emit(name, payload);
    if (destroyed) return;
    emitter.emit('state-change', { state: snapshot(), detail: payload, controller: api });
  }

  function cancel(reason) {
    if (destroyed || !active) return false;
    var current = active;
    active = null;
    pendingTasks = Math.max(0, pendingTasks - 1);
    if (current.controller && Utils.isFunction(current.controller.abort)) {
      try { current.controller.abort(reason); } catch (_) {}
    }
    state = 'cancelled';
    error = null;
    emit('cancel', { requestId: current.id, reason: reason || 'cancel', controller: api });
    return true;
  }

  function run(input, meta) {
    if (destroyed) return Promise.reject(new Error('[QXFRAME9A7C2] AsyncTask is destroyed.'));
    var id = ++requestId;
    var Controller = opts.AbortController || global.AbortController;
    var controller = typeof Controller === 'function' ? new Controller() : null;
    if (active) cancel('replace');
    active = { id: id, controller: controller };
    pendingTasks += 1;
    state = 'pending';
    error = null;
    var detail = { requestId: id, input: input, source: meta && meta.source || 'api', controller: api };
    emit('pending', detail);

    var context = {
      requestId: id,
      signal: controller ? controller.signal : undefined,
      source: detail.source,
      controller: api,
      isCurrent: function () { return !destroyed && !!active && active.id === id; }
    };

    var promise;
    try { promise = Promise.resolve(opts.task(input, context)); }
    catch (caught) { promise = Promise.reject(caught); }

    return promise.then(function (result) {
      if (destroyed) return result;
      if (opts.ignoreStale !== false && (!active || active.id !== id)) return result;
      active = null;
      pendingTasks = Math.max(0, pendingTasks - 1);
      state = 'success';
      value = result;
      error = null;
      emit('success', { requestId: id, value: result, controller: api });
      return result;
    }, function (caught) {
      if (destroyed) throw caught;
      if (opts.ignoreStale !== false && (!active || active.id !== id)) throw caught;
      active = null;
      pendingTasks = Math.max(0, pendingTasks - 1);
      if (caught && caught.name === 'AbortError') {
        state = 'cancelled';
        error = null;
        emit('cancel', { requestId: id, reason: 'abort', error: caught, controller: api });
      } else {
        state = 'error';
        error = caught;
        emit('error', { requestId: id, error: caught, controller: api });
      }
      throw caught;
    });
  }

  function reset() {
    if (destroyed) return false;
    if (active) cancel('reset');
    state = 'idle';
    value = undefined;
    error = null;
    emit('reset', { controller: api });
    return true;
  }

  function destroy() {
    if (destroyed) return false;
    if (active && active.controller && Utils.isFunction(active.controller.abort)) {
      try { active.controller.abort('destroy'); } catch (_) {}
    }
    if (active) pendingTasks = Math.max(0, pendingTasks - 1);
    active = null;
    destroyed = true;
    destroyedTasks += 1;
    state = 'idle';
    value = undefined;
    error = null;
    emitter.dispose();
    return true;
  }

  api = { run: run, cancel: cancel, reset: reset, snapshot: snapshot, on: emitter.on, once: emitter.once, destroy: destroy };
  Object.defineProperties(api, {
    state: { enumerable: true, get: function () { return state; } },
    value: { enumerable: true, get: function () { return value; } },
    error: { enumerable: true, get: function () { return error; } },
    requestId: { enumerable: true, get: function () { return requestId; } },
    pending: { enumerable: true, get: function () { return state === 'pending'; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });
  return api;
}

function getStats() { return Object.freeze({ createdTasks: createdTasks, destroyedTasks: destroyedTasks, activeTasks: Math.max(0, createdTasks - destroyedTasks), pendingTasks: pendingTasks }); }

export const AsyncTask = Object.freeze({ create, getStats });
export { create, getStats };
