
import { Utils } from '../utils/utils.js';
import { AsyncTask } from './asyncTask.js';
import { mergeOptions } from './options.js';

function create(options) {
  var opts = mergeOptions({}, options || {});
  if (!Utils.isFunction(opts.task)) throw new TypeError('[QXFRAME9A7C2] AsyncTaskGroup task must be a function.');
  var tasks = new Map(), destroyed = false, dataVersion = 0;
  function keyOf(value) { return value == null ? '__default__' : value; }
  function ensure(key) {
    var normalized = keyOf(key), task = tasks.get(normalized);
    if (task) return task;
    task = AsyncTask.create({
      ignoreStale: opts.ignoreStale !== false,
      AbortController: opts.AbortController,
      task: function (input, context) { return opts.task(input, Utils.mergeOwn( context, { key: key, dataVersion: dataVersion, group: api })); },
      onStateChange: opts.onStateChange
    });
    tasks.set(normalized, task);
    return task;
  }
  function run(key, input, meta) {
    if (destroyed) return Promise.reject(new Error('[QXFRAME9A7C2] AsyncTaskGroup is destroyed.'));
    var version = dataVersion;
    return ensure(key).run(input, Utils.mergeOwn( meta || {}, { dataVersion: version }));
  }
  function cancel(key, reason) { var task = tasks.get(keyOf(key)); return !!(task && task.cancel(reason || 'cancel')); }
  function cancelAll(reason) { var count = 0; tasks.forEach(function (task) { if (task.cancel(reason || 'cancel-all')) count += 1; }); return count; }
  function invalidate(reason) { dataVersion += 1; cancelAll(reason || 'data-version'); return dataVersion; }
  function snapshot() { var out = {}; tasks.forEach(function (task, key) { out[String(key)] = task.snapshot(); }); return Object.freeze({ dataVersion: dataVersion, destroyed: destroyed, tasks: Object.freeze(out) }); }
  function destroy() { if (destroyed) return false; cancelAll('destroy'); tasks.forEach(function (task) { task.destroy(); }); tasks.clear(); destroyed = true; return true; }
  var api = Object.freeze({ run: run, cancel: cancel, cancelAll: cancelAll, invalidate: invalidate, snapshot: snapshot, destroy: destroy });
  return api;
}

export const AsyncTaskGroup = Object.freeze({ create });
export { create };
