
import { Utils } from '../utils/utils.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { Events } from './events.js';
import { InteractionDetails } from './interactionDetails.js';
import { mergeOptions } from './options.js';
import { ControllableStateCore } from './controllableStateCore.js';

function create(options) {
  var opts = mergeOptions({}, options);
  var emitter = Events.createEmitter();
  var destroyed = false;
  var revision = 0;
  var api = null;
  var ownershipCore = ControllableStateCore.create({
    controlled: opts.controlled === true,
    allowOwnershipTransition: true
  });

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
  var previewValue;
  var hasPreview = false;
  var rawInput = opts.rawInput === undefined || opts.rawInput === null ? '' : String(opts.rawInput);
  var rawInputActive = opts.rawInputActive === true;
  var sessionActive = false;

  function payload(base, meta) {
    var merged = mergeOptions(mergeOptions({
      value: committedValue,
      draftValue: draftValue,
      dirty: !equals(committedValue, draftValue),
      previewValue: hasPreview ? previewValue : undefined,
      hasPreview: hasPreview,
      rawInput: rawInput,
      rawInputActive: rawInputActive,
      sessionActive: sessionActive,
      revision: revision,
      source: 'api',
      controller: api
    }, base), meta);
    return InteractionDetails.create(merged.reason || 'state-change', merged.originalEvent || null, merged);
  }

function setPreview(next, meta) {
if (destroyed) return false;
var cfg = meta || {};
var normalized = normalize(next, cfg);
var changed = !hasPreview || !equals(previewValue, normalized);
if (!changed) return true;
var previousPreview = hasPreview ? previewValue : undefined;
previewValue = copy(normalized);
hasPreview = true;
revision += 1;
var detail = payload({ previousPreviewValue: previousPreview, reason: 'preview-change' }, cfg);
detail.previewValue = previewValue;
detail.revision = revision;
if (Utils.isFunction(opts.onPreviewChange)) opts.onPreviewChange(previewValue, detail);
if (detail.silent !== true) emitter.emit('preview-change', detail);
return true;
}

function clearPreview(meta) {
if (destroyed) return false;
if (!hasPreview) return true;
var previousPreview = previewValue;
previewValue = undefined;
hasPreview = false;
revision += 1;
var detail = payload({ previousPreviewValue: previousPreview, reason: 'preview-clear' }, meta);
detail.previewValue = undefined;
detail.revision = revision;
if (Utils.isFunction(opts.onPreviewChange)) opts.onPreviewChange(undefined, detail);
if (detail.silent !== true) emitter.emit('preview-change', detail);
return true;
}

function setRawInput(next, meta) {
if (destroyed) return false;
var cfg = meta || {};
var value = next === undefined || next === null ? '' : String(next);
var active = Object.prototype.hasOwnProperty.call(cfg, 'active') ? cfg.active === true : true;
if (rawInput === value && rawInputActive === active) return true;
var previousRawInput = rawInput, previousRawInputActive = rawInputActive;
rawInput = value;
rawInputActive = active;
revision += 1;
var detail = payload({ previousRawInput: previousRawInput, previousRawInputActive: previousRawInputActive, reason: 'raw-input-change' }, cfg);
detail.rawInput = rawInput;
detail.rawInputActive = rawInputActive;
detail.revision = revision;
if (Utils.isFunction(opts.onRawInputChange)) opts.onRawInputChange(rawInput, detail);
if (detail.silent !== true) emitter.emit('raw-input-change', detail);
return true;
}

function clearRawInput(meta) {
return setRawInput('', mergeOptions({ active:false, reason:'raw-input-clear' }, meta));
}

function setSessionActive(next, meta) {
if (destroyed) return false;
var active = next === true;
if (sessionActive === active) return true;
var previousSessionActive = sessionActive;
sessionActive = active;
revision += 1;
var detail = payload({ previousSessionActive: previousSessionActive, reason: active ? 'session-begin' : 'session-end' }, meta);
detail.sessionActive = sessionActive;
detail.revision = revision;
if (Utils.isFunction(opts.onSessionChange)) opts.onSessionChange(sessionActive, detail);
if (detail.silent !== true) emitter.emit('session-change', detail);
return true;
}

function endSession(meta) {
if (destroyed) return false;
var cfg = meta || {};
clearPreview({ silent:true, source:cfg.source || 'session', reason:'session-end-preview' });
setRawInput(rawInput, { silent:true, active:false, source:cfg.source || 'session', reason:'session-end-raw-input' });
return setSessionActive(false, mergeOptions({ reason:'session-end' }, cfg));
}

function projection(config) {
var cfg = config || {};
var channel = 'committed', value = committedValue;
if (cfg.open === true) {
  if (rawInputActive && cfg.rawInputActive !== false) { channel = 'rawInput'; value = rawInput; }
  else if (hasPreview && cfg.previewControl === true) { channel = 'preview'; value = previewValue; }
  else if (!equals(committedValue, draftValue) && cfg.draftControl !== false) { channel = 'draft'; value = draftValue; }
}
return Object.freeze({ channel:channel, value:channel === 'rawInput' ? value : copy(value), revision:revision });
}

function setDraft(next, meta) {
if (destroyed) return false;
var cfg = meta || {};
if (rawInputActive && cfg.source !== 'input' && cfg.preserveRawInput !== true) {
  setRawInput(rawInput, { silent:true, active:false, source:cfg.source || 'draft', reason:'draft-channel' });
}
var normalized = normalize(next, cfg);
if (equals(draftValue, normalized)) return true;
var previousDraft = draftValue;
var detail = payload({
  nextDraftValue: normalized,
  previousDraftValue: previousDraft,
  reason: 'draft-change'
}, cfg);
var versionBefore = revision;
if (Utils.isFunction(opts.beforeDraftChange) && opts.beforeDraftChange(detail) === false) return false;
if (revision !== versionBefore) return false;
draftValue = copy(normalized);
revision += 1;
detail.draftValue = draftValue;
detail.dirty = !equals(committedValue, draftValue);
detail.revision = revision;
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
var versionBefore = revision;
if (valueChanged && Utils.isFunction(opts.beforeValueChange) && opts.beforeValueChange(detail) === false) return false;
if (revision !== versionBefore) return false;
committedValue = copy(normalized);
draftValue = copy(normalized);
if (valueChanged || draftChanged) revision += 1;
detail.value = committedValue;
detail.draftValue = draftValue;
detail.dirty = false;
detail.valueChanged = valueChanged;
detail.draftChanged = draftChanged;
detail.revision = revision;
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
var cfg = meta || {};
clearPreview({ silent:true, source:cfg.source || 'session', reason:'begin-preview-clear' });
setRawInput(rawInput, { silent:true, active:false, source:cfg.source || 'session', reason:'begin-raw-input-release' });
setSessionActive(true, mergeOptions({ silent:cfg.silent === true, source:cfg.source || 'session', reason:'begin' }, cfg));
var previousDraft = draftValue;
var nextDraft = Object.prototype.hasOwnProperty.call(cfg, 'draftSeed') ? normalize(cfg.draftSeed, cfg) : committedValue;
draftValue = copy(nextDraft);
var draftChanged = !equals(previousDraft, draftValue);
if (draftChanged) revision += 1;
var detail = payload({
  previousDraftValue: previousDraft,
  reason: 'begin'
}, cfg);
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
var versionBefore = revision;
if (Utils.isFunction(opts.beforeCommit) && opts.beforeCommit(detail) === false) return false;
if (revision !== versionBefore) return false;
var valueChanged = !equals(previousValue, draftValue);
if (valueChanged) { committedValue = copy(draftValue); revision += 1; }
detail.value = committedValue;
detail.draftValue = draftValue;
detail.dirty = false;
detail.changed = valueChanged;
detail.valueChanged = valueChanged;
detail.draftChanged = false;
clearPreview({ silent:true, source:detail.source || 'commit', reason:'commit-preview-clear' });
setRawInput(rawInput, { silent:true, active:false, source:detail.source || 'commit', reason:'commit-raw-input-release' });
detail.previewValue = undefined;
detail.hasPreview = false;
detail.rawInput = rawInput;
detail.rawInputActive = false;
detail.revision = revision;
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
if (draftChanged) revision += 1;
var detail = payload({
  previousDraftValue: previousDraft,
  reason: 'cancel'
}, meta);
detail.draftChanged = draftChanged;
clearPreview({ silent:true, source:detail.source || 'cancel', reason:'cancel-preview-clear' });
setRawInput(rawInput, { silent:true, active:false, source:detail.source || 'cancel', reason:'cancel-raw-input' });
detail.previewValue = undefined;
detail.hasPreview = false;
detail.rawInput = rawInput;
detail.rawInputActive = false;
detail.revision = revision;
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
var previousValue = committedValue;
var previousDraft = draftValue;
if (isControlled()) {
  draftValue = copy(committedValue);
} else {
  var target = opts.resetValue !== undefined ? opts.resetValue : initial;
  var normalized = normalize(target, meta);
  committedValue = copy(normalized);
  draftValue = copy(normalized);
}
var detail = payload({
  previousValue: previousValue,
  previousDraftValue: previousDraft,
  reason: 'reset'
}, meta);
var valueChanged = !equals(previousValue, committedValue);
var draftChanged = !equals(previousDraft, draftValue);
if (valueChanged || draftChanged) revision += 1;
detail.changed = valueChanged;
detail.valueChanged = valueChanged;
detail.draftChanged = draftChanged;
clearPreview({ silent:true, source:detail.source || 'reset', reason:'reset-preview-clear' });
setRawInput('', { silent:true, active:false, source:detail.source || 'reset', reason:'reset-raw-input' });
detail.previewValue = undefined;
detail.hasPreview = false;
detail.rawInput = rawInput;
detail.rawInputActive = false;
detail.revision = revision;
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
    if (Object.keys(Object(next)).length) revision += 1;
    opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'controlled')) setControlled(next.controlled === true);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) {
      if (isControlled()) syncExternal(next.value, { silent: true, reason: 'options', source: 'options' });
      else setValue(next.value, { silent: true, reason: 'options', source: 'options' });
    }
    if (Object.prototype.hasOwnProperty.call(Object(next), 'draftValue')) {
      setDraft(next.draftValue, { silent: true, reason: 'options-draft', source: 'options' });
    }
    return api;
  }

  function destroy() {
    if (destroyed) return false;
    revision += 1;
    destroyed = true;
    committedValue = undefined;
    draftValue = undefined;
    previewValue = undefined;
    hasPreview = false;
    rawInput = '';
    rawInputActive = false;
    sessionActive = false;
    emitter.dispose();
    ownershipCore.destroy({ source: 'programmatic', reason: 'value-controller-destroy' });
    return true;
  }

  function isControlled() { return ownershipCore.getState().controlled; }

  function requestChange(next, meta) {
    if (destroyed) return false;
    var normalized = normalize(next, meta);
    var detail = payload({
      nextValue: normalized,
      previousValue: committedValue,
      reason: 'request-change'
    }, meta);
    if (Utils.isFunction(opts.beforeChangeRequest) && opts.beforeChangeRequest(detail) === false) return false;
    var ownershipRequest = isControlled() ? ownershipCore.requestChange(detail) : null;
    if (Utils.isFunction(opts.onChangeRequest)) opts.onChangeRequest(normalized, detail);
    if (detail.silent !== true) emitter.emit('change-request', detail);
    if (isControlled()) {
      if (!ownershipRequest) ownershipCore.requestChange(detail);
      return true;
    }
    return setValue(normalized, mergeOptions({ reason: detail.reason || 'request-change' }, meta));
  }

  function syncExternal(next, meta) {
    if (destroyed) return false;
    var cfg = mergeOptions({ silent: true, reason: 'external-sync', source: 'external' }, meta);
    if (cfg.preserveDraft !== true || equals(committedValue, draftValue)) {
      var directResult = setValue(next, cfg);
      if (directResult && isControlled()) ownershipCore.syncExternal(cfg, { requestId: cfg.requestId });
      return directResult;
    }
    var normalized = normalize(next, cfg);
    var previousValue = committedValue;
    if (equals(previousValue, normalized)) {
      if (isControlled()) ownershipCore.syncExternal(cfg, { requestId: cfg.requestId });
      return true;
    }
    var detail = payload({ nextValue: normalized, previousValue: previousValue, previousDraftValue: draftValue, reason: cfg.reason }, cfg);
    var versionBefore = revision;
    if (Utils.isFunction(opts.beforeValueChange) && opts.beforeValueChange(detail) === false) return false;
    if (revision !== versionBefore) return false;
    committedValue = copy(normalized);
    revision += 1;
    detail.value = committedValue;
    detail.draftValue = draftValue;
    detail.dirty = !equals(committedValue, draftValue);
    detail.valueChanged = true;
    detail.draftChanged = false;
    if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(committedValue, detail);
    if (detail.silent !== true) emitter.emit('value-change', detail);
    if (isControlled()) ownershipCore.syncExternal(cfg, { requestId: cfg.requestId });
    return true;
  }

  function setControlled(value) {
    ownershipCore.transitionOwnership(value === true ? 'external' : 'internal', { source: 'programmatic', reason: 'set-controlled' });
    return api;
  }

  api = {
    begin: begin,
    endSession: endSession,
    setDraft: setDraft,
    preview: setPreview,
    setPreview: setPreview,
    clearPreview: clearPreview,
    setRawInput: setRawInput,
    clearRawInput: clearRawInput,
    projection: projection,
    setValue: setValue,
    requestChange: requestChange,
    syncExternal: syncExternal,
    setControlled: setControlled,
    getOwnershipState: function () { return ownershipCore.getState(); },
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
        previewValue: hasPreview ? copy(previewValue) : undefined,
        hasPreview: hasPreview,
        rawInput: rawInput,
        rawInputActive: rawInputActive,
        sessionActive: sessionActive,
        revision: revision,
        controlled: isControlled(),
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
    previewValue: { enumerable: true, get: function () { return hasPreview ? copy(previewValue) : undefined; } },
    hasPreview: { enumerable: true, get: function () { return hasPreview; } },
    rawInput: { enumerable: true, get: function () { return rawInput; } },
    rawInputActive: { enumerable: true, get: function () { return rawInputActive; } },
    sessionActive: { enumerable: true, get: function () { return sessionActive; } },
    revision: { enumerable: true, get: function () { return revision; } },
    controlled: { enumerable: true, get: function () { return isControlled(); } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });

  return api;
}

function createValueBinding(options) {
  const opts = mergeOptions({}, options);
  const normalizeValue = typeof opts.normalizeValue === 'function' ? opts.normalizeValue : value => value;
  const copyValue = typeof opts.copyValue === 'function' ? opts.copyValue : value => Array.isArray(value) ? value.slice() : value;
  const equals = typeof opts.equals === 'function' ? opts.equals : ValueEquality.deep;
  const controller = create({ ...opts, normalizeValue, copyValue, equals });

  function write(next, meta, request) {
    const cfg = mergeOptions({ silent:true, source:'api', reason:request === true ? 'request-change' : 'set-value' }, meta);
    const normalized = normalizeValue(next, cfg);
    if (equals(controller.value, normalized)) return false;
    if (request === true) return controller.requestChange(normalized, cfg);
    return controller.setValue(normalized, cfg);
  }

  return Object.freeze({
    get value() { return copyValue(controller.value); },
    get controlled() { return controller.controlled; },
    get ownership() { return controller.getOwnershipState().ownership; },
    getOwnershipState() { return controller.getOwnershipState(); },
    getValueController() { return controller; },
    copy(value) { return copyValue(value); },
    write,
    syncExternal(next, meta) { return controller.syncExternal(next, meta); },
    setControlled(value) { controller.setControlled(value); return this; },
    destroy() { return controller.destroy(); }
  });
}

function createOptionValueBinding(options, authoredOptions, normalizeValue, config = {}) {
  const source = options || {};
  const normalize = typeof normalizeValue === 'function' ? normalizeValue : value => value;
  const initial = Object.prototype.hasOwnProperty.call(source, 'value') ? source.value : source.defaultValue;
  return createValueBinding({
    ...config,
    value: normalize(initial),
    controlled: config.controlled === true,
    normalizeValue: normalize
  });
}

export const ValueController = Object.freeze({
  create,
  createValueBinding,
  createOptionValueBinding,
  equals: ValueEquality.equals,
  deepEquals: ValueEquality.deep,
  arrayEquals: ValueEquality.array
});
export { create, createValueBinding, createOptionValueBinding };
