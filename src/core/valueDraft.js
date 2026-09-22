
import { Utils } from '../utils/utils.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { Events } from './events.js';
import { InteractionDetails } from './interactionDetails.js';
import { mergeOptions } from './options.js';

function create(options) {
  var opts = mergeOptions({}, options);
  var emitter = Events.createEmitter();
  var destroyed = false;
  var mutationVersion = 0;
  var api = null;

  function copy(value) {
    return Utils.isFunction(opts.copyValue) ? opts.copyValue(value) : value;
  }

  function normalize(value, meta) {
    return Utils.isFunction(opts.normalizeValue) ? opts.normalizeValue(value, meta || {}) : value;
  }

  function equals(left, right) {
    return ValueEquality.equals(left, right, opts.equals);
  }

  var initial = normalize(
    opts.value !== undefined ? opts.value : opts.defaultValue,
    { reason: 'init', source: 'init' }
  );
  var committedValue = copy(initial);
  var draftValue = opts.draftValue !== undefined
    ? copy(normalize(opts.draftValue, { reason: 'init-draft', source: 'init' }))
    : copy(committedValue);

  function payload(base, meta) {
    var merged = mergeOptions(mergeOptions({
      value: committedValue,
      draftValue: draftValue,
      dirty: !equals(committedValue, draftValue),
      source: 'api',
      controller: api
    }, base), meta);
    return InteractionDetails.create(merged.reason || 'state-change', merged.originalEvent || null, merged);
  }

function setDraft(next, meta) {
if (destroyed) return false;
var normalized = normalize(next, meta);
if (equals(draftValue, normalized)) return true;
var previousDraft = draftValue;
var detail = payload({
  nextDraftValue: normalized,
  previousDraftValue: previousDraft,
  reason: 'draft-change'
}, meta);
var versionBefore = mutationVersion;
if (Utils.isFunction(opts.beforeDraftChange) && opts.beforeDraftChange(detail) === false) return false;
if (mutationVersion !== versionBefore) return false;
draftValue = copy(normalized);
mutationVersion += 1;
detail.draftValue = draftValue;
detail.dirty = !equals(committedValue, draftValue);
if (Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(draftValue, detail);
if (detail.silent !== true) emitter.emit('draft-change', detail);
return true;
}

function setValue(next, meta) {
if (destroyed) return false;
var normalized = normalize(next, meta);
var previousValue = committedValue;
var previousDraft = draftValue;
var valueChanged = !equals(previousValue, normalized);
var draftChanged = !equals(previousDraft, normalized);
var detail = payload({
  nextValue: normalized,
  previousValue: previousValue,
  previousDraftValue: previousDraft,
  reason: 'set-value'
}, meta);
var versionBefore = mutationVersion;
if (valueChanged && Utils.isFunction(opts.beforeValueChange) && opts.beforeValueChange(detail) === false) return false;
if (mutationVersion !== versionBefore) return false;
committedValue = copy(normalized);
draftValue = copy(normalized);
if (valueChanged || draftChanged) mutationVersion += 1;
detail.value = committedValue;
detail.draftValue = draftValue;
detail.dirty = false;
detail.valueChanged = valueChanged;
detail.draftChanged = draftChanged;
if (valueChanged && Utils.isFunction(opts.onValueChange)) opts.onValueChange(committedValue, detail);
if (draftChanged && Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(draftValue, detail);
if (detail.silent !== true) {
  if (valueChanged) emitter.emit('value-change', detail);
  if (draftChanged) emitter.emit('draft-change', detail);
}
return true;
}

function begin(meta) {
if (destroyed) return false;
var previousDraft = draftValue;
draftValue = copy(committedValue);
var draftChanged = !equals(previousDraft, draftValue);
if (draftChanged) mutationVersion += 1;
var detail = payload({
  previousDraftValue: previousDraft,
  reason: 'begin'
}, meta);
detail.draftChanged = draftChanged;
if (draftChanged && Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(draftValue, detail);
if (detail.silent !== true) {
  emitter.emit('begin', detail);
  if (draftChanged) emitter.emit('draft-change', detail);
}
return true;
}

function commit(meta) {
if (destroyed) return false;
var previousValue = committedValue;
var detail = payload({
  nextValue: draftValue,
  previousValue: previousValue,
  reason: 'commit'
}, meta);
var versionBefore = mutationVersion;
if (Utils.isFunction(opts.beforeCommit) && opts.beforeCommit(detail) === false) return false;
if (mutationVersion !== versionBefore) return false;
var valueChanged = !equals(previousValue, draftValue);
if (valueChanged) { committedValue = copy(draftValue); mutationVersion += 1; }
detail.value = committedValue;
detail.draftValue = draftValue;
detail.dirty = false;
detail.changed = valueChanged;
detail.valueChanged = valueChanged;
detail.draftChanged = false;
if (valueChanged && Utils.isFunction(opts.onValueChange)) opts.onValueChange(committedValue, detail);
if (detail.silent !== true) {
  if (Utils.isFunction(opts.onCommit)) opts.onCommit(committedValue, detail);
  emitter.emit('commit', detail);
  if (valueChanged) emitter.emit('value-change', detail);
}
return true;
}

function cancel(meta) {
if (destroyed) return false;
var previousDraft = draftValue;
draftValue = copy(committedValue);
var draftChanged = !equals(previousDraft, draftValue);
if (draftChanged) mutationVersion += 1;
var detail = payload({
  previousDraftValue: previousDraft,
  reason: 'cancel'
}, meta);
detail.draftChanged = draftChanged;
if (draftChanged && Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(draftValue, detail);
if (detail.silent !== true) {
  if (Utils.isFunction(opts.onCancel)) opts.onCancel(detail);
  emitter.emit('cancel', detail);
  if (draftChanged) emitter.emit('draft-change', detail);
}
return true;
}

function reset(meta) {
if (destroyed) return false;
var target = opts.resetValue !== undefined ? opts.resetValue : initial;
var normalized = normalize(target, meta);
var previousValue = committedValue;
var previousDraft = draftValue;
committedValue = copy(normalized);
draftValue = copy(normalized);
var detail = payload({
  previousValue: previousValue,
  previousDraftValue: previousDraft,
  reason: 'reset'
}, meta);
var valueChanged = !equals(previousValue, committedValue);
var draftChanged = !equals(previousDraft, draftValue);
if (valueChanged || draftChanged) mutationVersion += 1;
detail.changed = valueChanged;
detail.valueChanged = valueChanged;
detail.draftChanged = draftChanged;
if (valueChanged && Utils.isFunction(opts.onValueChange)) opts.onValueChange(committedValue, detail);
if (draftChanged && Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(draftValue, detail);
if (detail.silent !== true) {
  if (Utils.isFunction(opts.onReset)) opts.onReset(detail);
  emitter.emit('reset', detail);
  if (valueChanged) emitter.emit('value-change', detail);
  if (draftChanged) emitter.emit('draft-change', detail);
}
return true;
}

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (Object.keys(Object(next)).length) mutationVersion += 1;
    opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) {
      setValue(next.value, { silent: true, reason: 'options', source: 'options' });
    }
    if (Object.prototype.hasOwnProperty.call(Object(next), 'draftValue')) {
      setDraft(next.draftValue, { silent: true, reason: 'options-draft', source: 'options' });
    }
    return api;
  }

  function destroy() {
    if (destroyed) return false;
    mutationVersion += 1;
    destroyed = true;
    committedValue = undefined;
    draftValue = undefined;
    emitter.dispose();
    return true;
  }

  var controlled = opts.controlled === true;

  function requestChange(next, meta) {
    if (destroyed) return false;
    var normalized = normalize(next, meta);
    var detail = payload({
      nextValue: normalized,
      previousValue: committedValue,
      reason: 'request-change'
    }, meta);
    if (Utils.isFunction(opts.beforeChangeRequest) && opts.beforeChangeRequest(detail) === false) return false;
    if (Utils.isFunction(opts.onChangeRequest)) opts.onChangeRequest(normalized, detail);
    if (detail.silent !== true) emitter.emit('change-request', detail);
    if (controlled) return true;
    return setValue(normalized, mergeOptions({ reason: detail.reason || 'request-change' }, meta));
  }

  function syncExternal(next, meta) {
    if (destroyed) return false;
    var cfg = mergeOptions({ silent: true, reason: 'external-sync', source: 'external' }, meta);
    if (cfg.preserveDraft !== true || equals(committedValue, draftValue)) return setValue(next, cfg);
    var normalized = normalize(next, cfg);
    var previousValue = committedValue;
    if (equals(previousValue, normalized)) return true;
    var detail = payload({ nextValue: normalized, previousValue: previousValue, previousDraftValue: draftValue, reason: cfg.reason }, cfg);
    var versionBefore = mutationVersion;
    if (Utils.isFunction(opts.beforeValueChange) && opts.beforeValueChange(detail) === false) return false;
    if (mutationVersion !== versionBefore) return false;
    committedValue = copy(normalized);
    mutationVersion += 1;
    detail.value = committedValue;
    detail.draftValue = draftValue;
    detail.dirty = !equals(committedValue, draftValue);
    detail.valueChanged = true;
    detail.draftChanged = false;
    if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(committedValue, detail);
    if (detail.silent !== true) emitter.emit('value-change', detail);
    return true;
  }

  function setControlled(value) { controlled = value === true; return api; }

  api = {
    begin: begin,
    setDraft: setDraft,
    setValue: setValue,
    requestChange: requestChange,
    syncExternal: syncExternal,
    setControlled: setControlled,
    commit: commit,
    cancel: cancel,
    rollback: cancel,
    reset: reset,
    updateOptions: updateOptions,
    snapshot: function () {
      return Object.freeze({
        value: committedValue,
        draftValue: draftValue,
        dirty: !destroyed && !equals(committedValue, draftValue),
        destroyed: destroyed
      });
    },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };

  Object.defineProperties(api, {
    value: { enumerable: true, get: function () { return committedValue; } },
    draftValue: { enumerable: true, get: function () { return draftValue; } },
    dirty: {
      enumerable: true,
      get: function () { return !destroyed && !equals(committedValue, draftValue); }
    },
    controlled: { enumerable: true, get: function () { return controlled; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });

  return api;
}

export const ValueDraft = Object.freeze({ create });
export { create };
