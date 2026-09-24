import { IdManager } from '../utils/id.js';
import { ActionContext } from './actionContext.js';
import { OperationResult } from './operationResult.js';

function ensureContext(context, reason) {
  if (ActionContext.isContext(context)) return context;
  return ActionContext.create(reason, context || { source: 'programmatic' });
}

function create(options) {
  var opts = options || {};
  var ownership = opts.controlled === true || opts.ownership === 'external' ? 'external' : 'internal';
  var allowOwnershipTransition = opts.allowOwnershipTransition === true;
  var revision = Number.isInteger(opts.revision) && opts.revision >= 0 ? opts.revision : 0;
  var pending = new Map();
  var destroyed = false;

  function disposed(context) {
    return OperationResult.disposed(context, { reason: 'disposed', revision: revision });
  }

  function commitInternal(context) {
    var action = ensureContext(context, 'internal-commit');
    if (destroyed) return disposed(action);
    if (ownership !== 'internal') return OperationResult.blocked(action, { reason: 'external-owner', revision: revision });
    revision += 1;
    return OperationResult.applied(action, { revision: revision });
  }

  function requestChange(context, options) {
    var action = ensureContext(context, 'request-change');
    if (destroyed) return disposed(action);
    if (ownership !== 'external') return OperationResult.blocked(action, { reason: 'internal-owner', revision: revision });
    var local = options || {};
    var requestId = String(local.requestId || IdManager.next('request'));
    pending.set(requestId, Object.freeze({ requestId: requestId, actionId: action.actionId, baseRevision: revision }));
    return OperationResult.requested(action, { requestId: requestId, revision: revision });
  }

  function syncExternal(context, options) {
    var action = ensureContext(context, 'external-sync');
    if (destroyed) return disposed(action);
    if (ownership !== 'external') return OperationResult.blocked(action, { reason: 'internal-owner', revision: revision });
    var requestId = options && options.requestId !== undefined ? String(options.requestId) : '';
    revision += 1;
    if (requestId) pending.delete(requestId);
    Array.from(pending.keys()).forEach(function (id) {
      var record = pending.get(id);
      if (record && record.baseRevision < revision) pending.delete(id);
    });
    return OperationResult.applied(action, { requestId: requestId || undefined, revision: revision });
  }

  function acknowledge(requestId, context) {
    var action = ensureContext(context, 'request-ack');
    if (destroyed) return disposed(action);
    var id = String(requestId || '');
    var record = pending.get(id);
    if (!record) return OperationResult.stale(action, { reason: 'unknown-request', requestId: id, revision: revision });
    pending.delete(id);
    return OperationResult.unchanged(action, { reason: 'acknowledged', requestId: id, revision: revision });
  }

  function reject(requestId, context, reason) {
    var action = ensureContext(context, 'request-reject');
    if (destroyed) return disposed(action);
    var id = String(requestId || '');
    if (!pending.has(id)) return OperationResult.stale(action, { reason: 'unknown-request', requestId: id, revision: revision });
    pending.delete(id);
    return OperationResult.blocked(action, { reason: reason || 'rejected', requestId: id, revision: revision });
  }

  function transitionOwnership(nextOwnership, context) {
    var action = ensureContext(context, 'ownership-transition');
    if (destroyed) return disposed(action);
    var next = nextOwnership === true || nextOwnership === 'external' ? 'external' : (nextOwnership === false || nextOwnership === 'internal' ? 'internal' : '');
    if (!next) return OperationResult.invalid(action, { reason: 'invalid-ownership', revision: revision });
    if (next === ownership) return OperationResult.unchanged(action, { reason: 'same-ownership', revision: revision });
    if (!allowOwnershipTransition) return OperationResult.blocked(action, { reason: 'ownership-frozen', revision: revision });
    ownership = next;
    pending.clear();
    revision += 1;
    return OperationResult.applied(action, { reason: 'ownership-transition', revision: revision });
  }

  function getState() {
    return Object.freeze({
      ownership: ownership,
      controlled: ownership === 'external',
      revision: revision,
      pendingRequestIds: Object.freeze(Array.from(pending.keys())),
      destroyed: destroyed
    });
  }

  function destroy(context) {
    var action = ensureContext(context, 'destroy');
    if (destroyed) return disposed(action);
    pending.clear();
    destroyed = true;
    return OperationResult.applied(action, { reason: 'destroy', revision: revision });
  }

  return Object.freeze({
    commitInternal,
    requestChange,
    syncExternal,
    acknowledge,
    reject,
    transitionOwnership,
    getState,
    destroy
  });
}

export const ControllableStateCore = Object.freeze({ create });
export { create };
