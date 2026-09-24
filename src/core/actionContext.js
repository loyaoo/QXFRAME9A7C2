import { IdManager } from '../utils/id.js';
import { InteractionDetails } from './interactionDetails.js';

const SOURCES = Object.freeze(['keyboard', 'pointer', 'touch', 'native', 'programmatic', 'external']);
const MODALITIES = Object.freeze(['keyboard', 'pointer', 'touch', 'programmatic']);

function normalizeSource(source, event) {
  var value = source === undefined || source === null ? '' : String(source).toLowerCase();
  if (SOURCES.indexOf(value) >= 0) return value;
  if (value === 'api') return 'programmatic';
  if (value === 'form' || value === 'form-field' || value === 'focus' || value === 'input' || value === 'event') return 'native';
  var inferred = InteractionDetails.inferSource(event || null);
  if (inferred === 'keyboard' || inferred === 'pointer' || inferred === 'touch') return inferred;
  if (inferred === 'api') return 'programmatic';
  return 'native';
}

function normalizeModality(value, source) {
  var normalized = value === undefined || value === null ? '' : String(value).toLowerCase();
  if (MODALITIES.indexOf(normalized) >= 0) return normalized;
  if (source === 'keyboard' || source === 'pointer' || source === 'touch') return source;
  return 'programmatic';
}

function create(reason, options) {
  var opts = options || {};
  var event = opts.originalEvent || opts.event || null;
  var source = normalizeSource(opts.source, event);
  var actionId = String(opts.actionId || IdManager.next('action'));
  var normalizedReason = String(reason || opts.reason || '').trim();
  if (!normalizedReason) throw new TypeError('[QXFRAME9A7C2] ActionContext reason must not be empty.');
  var context = {
    actionId: actionId,
    source: source,
    reason: normalizedReason,
    inputModality: normalizeModality(opts.inputModality, source)
  };
  if (opts.parentActionId !== undefined && opts.parentActionId !== null) context.parentActionId = String(opts.parentActionId);
  if (opts.scopeId !== undefined && opts.scopeId !== null) context.scopeId = String(opts.scopeId);
  if (opts.ownerId !== undefined && opts.ownerId !== null) context.ownerId = String(opts.ownerId);
  if (event) context.originalEvent = event;
  return Object.freeze(context);
}

function derive(parent, reason, patch) {
  if (!isContext(parent)) throw new TypeError('[QXFRAME9A7C2] ActionContext.derive requires a parent ActionContext.');
  var opts = Object.assign({}, patch || {});
  opts.parentActionId = parent.actionId;
  if (opts.scopeId === undefined && parent.scopeId !== undefined) opts.scopeId = parent.scopeId;
  if (opts.ownerId === undefined && parent.ownerId !== undefined) opts.ownerId = parent.ownerId;
  if (opts.source === undefined) opts.source = parent.source;
  if (opts.inputModality === undefined) opts.inputModality = parent.inputModality;
  return create(reason, opts);
}

function snapshot(context) {
  if (!isContext(context)) throw new TypeError('[QXFRAME9A7C2] ActionContext.snapshot requires an ActionContext.');
  var output = {};
  Object.keys(context).forEach(function (key) {
    if (key !== 'originalEvent') output[key] = context[key];
  });
  return Object.freeze(output);
}

function isContext(value) {
  return !!(value && typeof value === 'object' && typeof value.actionId === 'string' && typeof value.reason === 'string' && SOURCES.indexOf(value.source) >= 0);
}

export const ActionContext = Object.freeze({ create, derive, snapshot, isContext, sources: SOURCES, modalities: MODALITIES, normalizeSource });
export { create, derive, snapshot, isContext, normalizeSource };
