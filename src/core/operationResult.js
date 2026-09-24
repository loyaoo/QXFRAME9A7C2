const STATUSES = Object.freeze(['applied', 'requested', 'unchanged', 'blocked', 'invalid', 'stale', 'disposed']);

function create(status, context, extras) {
  var normalized = String(status || '');
  if (STATUSES.indexOf(normalized) < 0) throw new TypeError('[QXFRAME9A7C2] Invalid OperationResult status: ' + normalized);
  var local = extras || {};
  var actionId = local.actionId || (context && context.actionId);
  if (!actionId) throw new TypeError('[QXFRAME9A7C2] OperationResult requires an actionId.');
  var result = { status: normalized, actionId: String(actionId) };
  ['reason', 'requestId', 'revision', 'generation'].forEach(function (key) {
    if (local[key] !== undefined) result[key] = local[key];
  });
  return Object.freeze(result);
}

function helper(status) {
  return function (context, extras) { return create(status, context, extras); };
}

function isOperationResult(value) {
  return !!(value && typeof value === 'object' && STATUSES.indexOf(value.status) >= 0 && typeof value.actionId === 'string');
}

export const OperationResult = Object.freeze({
  statuses: STATUSES,
  create,
  isOperationResult,
  applied: helper('applied'),
  requested: helper('requested'),
  unchanged: helper('unchanged'),
  blocked: helper('blocked'),
  invalid: helper('invalid'),
  stale: helper('stale'),
  disposed: helper('disposed')
});
export { create, isOperationResult };
