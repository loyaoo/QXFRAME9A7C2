import { Scheduler } from './scheduler.js';
import { ActionContext } from './actionContext.js';
import { OperationResult } from './operationResult.js';

function ensureContext(context, reason) {
  return ActionContext.isContext(context) ? context : ActionContext.create(reason, context || { source: 'programmatic' });
}

function normalizeSnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') throw new TypeError('[QXFRAME9A7C2] ProjectionSnapshot must be an object.');
  var revision = Number(snapshot.revision);
  if (!Number.isInteger(revision) || revision < 0) throw new TypeError('[QXFRAME9A7C2] ProjectionSnapshot revision must be a non-negative integer.');
  return Object.freeze(Object.assign({}, snapshot, { revision: revision }));
}

function create(options) {
  var opts = options || {};
  var schedule = opts.schedule === 'frame' ? 'frame' : 'sync';
  var defaultProject = typeof opts.project === 'function' ? opts.project : function () {};
  var acceptedRevision = -1;
  var projectedRevision = -1;
  var acceptedSnapshot = null;
  var pending = null;
  var destroyed = false;
  var lastResult = null;
  var frame = null;

  function projectTask(task) {
    if (!task) return null;
    if (destroyed) return OperationResult.disposed(task.context, { reason: 'disposed', revision: task.snapshot.revision });
    if (task.snapshot.revision < acceptedRevision) return OperationResult.stale(task.context, { reason: 'superseded-projection', revision: task.snapshot.revision });
    task.project(task.snapshot, task.context);
    projectedRevision = task.snapshot.revision;
    return OperationResult.applied(task.context, { reason: 'projected', revision: projectedRevision });
  }

  if (schedule === 'frame') {
    frame = Scheduler.createFrameScheduler(function () {
      var task = pending;
      pending = null;
      lastResult = projectTask(task);
    }, opts.schedulerOptions || {});
  }

  function submit(snapshot, context, projector) {
    var action = ensureContext(context, 'projection');
    if (destroyed) return OperationResult.disposed(action, { reason: 'disposed', revision: acceptedRevision });
    var next = normalizeSnapshot(snapshot);
    if (next.revision < acceptedRevision) return OperationResult.stale(action, { reason: 'stale-revision', revision: next.revision });
    if (next.revision === acceptedRevision && acceptedSnapshot) return OperationResult.unchanged(action, { reason: 'same-revision', revision: next.revision });
    acceptedRevision = next.revision;
    acceptedSnapshot = next;
    var task = { snapshot: next, context: ActionContext.snapshot(action), project: typeof projector === 'function' ? projector : defaultProject };
    if (schedule === 'sync') {
      lastResult = projectTask(task);
      return lastResult;
    }
    pending = task;
    frame.request('projection-revision-' + next.revision);
    return OperationResult.requested(action, { reason: 'projection-scheduled', revision: next.revision });
  }

  function flush() {
    if (destroyed || !frame) return false;
    return frame.flush();
  }

  function getState() {
    return Object.freeze({
      acceptedRevision: acceptedRevision,
      projectedRevision: projectedRevision,
      pendingRevision: pending ? pending.snapshot.revision : null,
      snapshot: acceptedSnapshot,
      lastResult: lastResult,
      destroyed: destroyed
    });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    pending = null;
    if (frame) frame.dispose();
    frame = null;
    acceptedSnapshot = null;
    return true;
  }

  return Object.freeze({ submit, flush, getState, destroy });
}

export const ProjectionScheduler = Object.freeze({ create, normalizeSnapshot });
export { create, normalizeSnapshot };
