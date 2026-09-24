import { PickerComponent, pickerHooks } from './picker.js';
import { PickerField } from './picker-field.js';
import { TimePanel } from './time-panel.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { ValueController } from '../core/valueController.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { TimeUnit } from '../utils/timeUnit.js';
import { Scheduler } from '../core/scheduler.js';
import { DOM } from '../core/dom.js';
import { Utils } from '../utils/utils.js';

const runtimeState = new WeakMap();
const TIME_PICKER_DEFAULTS = Object.freeze({
  selection:'single', showSecond:true, needConfirm:false, showCancel:false, closeOnSelect:false,
  commitInputOnBlur:true, preserveInvalidOnBlur:false, clearable:true, disabled:false, readOnly:false,
  size:'md', placement:'bottom-start', trigger:'click', open:false, placeholder:'选择时间', rangeSeparator:' ~ ', order:true,
  showNow:true, hideDisabledOptions:false, changeOnScroll:false, previewValue:'hover'
});
const TIME_PICKER_IMMUTABLE = Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless','selection']);

var SELECTIONS = Object.freeze(['single', 'range']);
var own = Utils.own;
function normalizeSelectionName(value) {
  var selection = String(value || 'single').toLowerCase();
  if (SELECTIONS.indexOf(selection) < 0) throw new TypeError('[QXFRAME9A7C2] TimePicker selection must be single or range.');
  return selection;
}


function setupTimePickerRuntime(instance, fieldInit) {
  var source = fieldInit.options;
  var selection = normalizeSelectionName(source.selection);
  var derivedNeedConfirm = selection === 'range';
  var opts = Utils.assignOwn({
    selection: selection,
    showSecond: true, needConfirm: derivedNeedConfirm, showCancel: derivedNeedConfirm, closeOnSelect: false,
    commitInputOnBlur: true, preserveInvalidOnBlur: false, clearable: true,
    disabled: false, readOnly: false, size: 'md', placement: 'bottom-start', trigger: 'click', open: false,
    placeholder: selection === 'range' ? '选择时间范围' : '选择时间', rangeSeparator: ' ~ ', order: true,
    showNow: true, hideDisabledOptions: false, changeOnScroll: false, previewValue: 'hover'
  }, source);
  if (!own(source, 'needConfirm')) opts.needConfirm = derivedNeedConfirm;
  if (!own(source, 'showCancel')) opts.showCancel = opts.needConfirm === true;
  PickerField.validateHeadlessOptions(opts, 'TimePicker');
  var doc = fieldInit.document || opts.document || (opts.container && opts.container.ownerDocument) || (opts.formField && opts.formField.ownerDocument) || globalThis.document;
  opts.document = doc;
  if (selection === 'range' && String(opts.rangeSeparator || '') === '') throw new TypeError('[QXFRAME9A7C2] TimePicker rangeSeparator must not be empty in range selection.');
  if (opts.previewValue !== false && opts.previewValue !== 'hover') throw new TypeError("[QXFRAME9A7C2] TimePicker previewValue must be false or 'hover'.");

  var emitter = Object.freeze({ emit: function (type, payload) { return instance.emit(type, payload); } });
  var destroyed = false;
  var field = null;
  var panel = null;
  var nowButton = null;
  var nowButtonOff = null;
  var nowHandler = null;
  var panelScrollSettleOff = null;
  var api = instance;
  var activeRangePart = 0;
  var dependentPanelSyncScheduler = Scheduler.createDelayScheduler(function (_timestamp, reason) {
    if (!destroyed) syncPanel(reason || 'time-picker-dependent-idle');
  });

  function cloneValue(value) { return selection === 'single' ? TimeUnit.clone(value) : [TimeUnit.clone(value && value[0]), TimeUnit.clone(value && value[1])]; }
  function emptyValue() { return selection === 'single' ? null : [null, null]; }
  function hasValue(value) { return selection === 'single' ? !!value : !!(value && (value[0] || value[1])); }
  function complete(value) { return selection === 'single' ? !!value : !!(value && value[0] && value[1]); }
  function sameValue(a, b) { return ValueEquality.deep(a, b); }
  function normalizeValue(value) {
    if (selection === 'single') {
      var one = TimeUnit.normalizeStrict(value);
      if (value !== null && value !== undefined && value !== '' && !one) throw new TypeError('[QXFRAME9A7C2] TimePicker value is invalid.');
      return one;
    }
    if (value === null || value === undefined || value === '') return [null, null];
    if (!Array.isArray(value) || value.length !== 2) throw new TypeError('[QXFRAME9A7C2] TimePicker range value must be a two-item array.');
    var start = TimeUnit.normalizeStrict(value[0]), end = TimeUnit.normalizeStrict(value[1]);
    if ((value[0] !== null && value[0] !== undefined && value[0] !== '' && !start) || (value[1] !== null && value[1] !== undefined && value[1] !== '' && !end)) throw new TypeError('[QXFRAME9A7C2] TimePicker range contains an invalid value.');
    if (opts.order !== false && start && end && TimeUnit.seconds(start) > TimeUnit.seconds(end)) return [end, start];
    return [start, end];
  }
  function formatValue(value) {
    if (selection === 'single') return TimeUnit.format(value, { showSecond:opts.showSecond, use12Hours:opts.use12Hours });
    var left = TimeUnit.format(value && value[0], { showSecond:opts.showSecond, use12Hours:opts.use12Hours });
    var right = TimeUnit.format(value && value[1], { showSecond:opts.showSecond, use12Hours:opts.use12Hours });
    if (!left && !right) return '';
    return left + String(opts.rangeSeparator) + right;
  }
  function splitValidatedRange(sourceText) {
    var source = String(sourceText || '').trim();
    var sep = String(opts.rangeSeparator);
    if (!sep) return null;
    var match = null;
    var from = 0;
    while (from <= source.length) {
      var index = source.indexOf(sep, from);
      if (index < 0) break;
      var leftText = source.slice(0, index).trim();
      var rightText = source.slice(index + sep.length).trim();
      var left = leftText ? TimeUnit.parse(leftText, { showSecond:opts.showSecond, use12Hours:opts.use12Hours }) : null;
      var right = rightText ? TimeUnit.parse(rightText, { showSecond:opts.showSecond, use12Hours:opts.use12Hours }) : null;
      if (left && right) {
        if (match) return null;
        match = [left, right];
      }
      from = index + Math.max(1, sep.length);
    }
    return match;
  }
  function parseTextValue(text) {
    var sourceText = String(text || '').trim();
    if (!sourceText) return { valid: true, value: emptyValue() };
    if (selection === 'single') {
      var one = TimeUnit.parse(sourceText, { showSecond:opts.showSecond, use12Hours:opts.use12Hours });
      return { valid: !!one, value: one };
    }
    var pair = splitValidatedRange(text);
    if (!pair) return { valid: false, value: null };
    var value = pair;
    if (opts.order !== false && TimeUnit.seconds(value[0]) > TimeUnit.seconds(value[1])) value = [value[1], value[0]];
    return { valid: true, value: value };
  }
  function panelValue(value) {
    if (selection === 'single') return value;
    return value && (value[activeRangePart] || value[activeRangePart === 0 ? 1 : 0]);
  }

  if (fieldInit.formField && !own(source, 'value') && !own(source, 'defaultValue')) {
    var nativeInitial = parseTextValue(fieldInit.nativeValue);
    if (nativeInitial.valid) opts.value = nativeInitial.value;
  }
  var draft = ValueController.create({
    value: opts.value !== undefined ? opts.value : opts.defaultValue,
    normalizeValue: normalizeValue,
    copyValue: cloneValue,
    equals: sameValue,
    onValueChange: function (value, detail) { syncField(false, { source: detail.source || 'value-draft', reason: detail.reason || 'value-change' }); if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(cloneValue(value), Utils.mergeOwn( detail, { value: cloneValue(value), previousValue: cloneValue(detail.previousValue), timePicker: api })); if (detail.silent !== true) { var payload = { value: cloneValue(value), previousValue: cloneValue(detail.previousValue), reason: detail.reason, source: detail.source || 'api', timePicker: api }; if (Utils.isFunction(opts.onChange)) opts.onChange(cloneValue(value), payload); emitter.emit('change', payload); } },
    onDraftChange: function (value, detail) { if (!(detail && detail.source === 'input' && detail.reason === 'typing')) syncField(field && field.getState().open); if (field && field.getState().open) rebuildFooter(); if (Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(cloneValue(value), Utils.mergeOwn( detail, { value: cloneValue(draft.value), draftValue: cloneValue(value), timePicker: api })); }
  });

  function syncField(preferDraft, meta) {
    if (!field) return;
    var open = preferDraft === true && field.getState().open;
    var projection = draft.projection({ open: open, previewControl: opts.previewValue !== false, draftControl: true });
    var committedText = formatValue(draft.value);
    var draftText = formatValue(draft.draftValue);
    var projectedText = projection.channel === 'rawInput' ? String(projection.value || '') : formatValue(projection.value);
    var hasDraftTarget = field.getState().hasDraftValueTarget;
    var displayText = hasDraftTarget && projection.channel !== 'rawInput' && projection.channel !== 'preview' ? committedText : projectedText;
    field.setDisplayValue(displayText);
    field.setPlaceholder(!hasDraftTarget && open && projection.channel === 'draft' ? (committedText || String(opts.placeholder || '')) : opts.placeholder);
    field.setDraftDisplayValue(open && draft.dirty ? draftText : '');
    field.setDraftVisual(open && draft.dirty && !hasDraftTarget);
    field.setClearVisible(hasValue(draft.value));
    field.setCommittedValue(draft.value, meta || { silent: true, source: 'value-controller', reason: 'projection' });
  }
  function emitOpen(opened, detail) {
    if (!opened) syncField(false);
    if (opened && detail && (detail.source === 'keyboard' || /keyboard/i.test(String(detail.reason || ''))) && panel && panel.setActiveColumn) panel.setActiveColumn(0, { source:'keyboard', reason:'time-picker-open', originalEvent:detail.originalEvent || null });
    return OpenStateBridge.dispatch(opened, detail, {
      emitter: emitter,
      eventName: 'openChange',
      decorate: function () { return { timePicker: api }; },
      onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); }
    });
  }
  function panelSeed() { return panelValue(draft.draftValue) || panelValue(draft.value) || TimeUnit.normalizeStrict(opts.defaultPickerValue) || TimeUnit.now(); }
  function previewSelection(value) {
    if (!value) return null;
    if (selection === 'single') return TimeUnit.clone(value);
    var next = cloneValue(draft.draftValue);
    next[activeRangePart] = TimeUnit.clone(value);
    if (opts.order !== false && next[0] && next[1] && TimeUnit.seconds(next[0]) > TimeUnit.seconds(next[1])) next = [next[1], next[0]];
    return next;
  }
  function handlePanelHover(value, detail) {
    var preview = opts.previewValue === false ? null : previewSelection(value);
    if (preview === null) draft.clearPreview({ silent:true, source:detail && detail.source || 'pointer', reason:detail && detail.reason || 'hover-leave' });
    else draft.setPreview(preview, { silent:true, source:detail && detail.source || 'pointer', reason:detail && detail.reason || 'hover' });
    if (field && field.getState().open) syncField(true);
    var previewValue = draft.hasPreview ? cloneValue(draft.previewValue) : null;
    var payload = { value: TimeUnit.clone(value), previewValue: previewValue, source: detail && detail.source || 'pointer', reason: detail && detail.reason || (value ? 'hover' : 'hover-leave'), originalEvent: detail && detail.originalEvent || null, timePicker: api };
    if (Utils.isFunction(opts.onPreviewChange)) opts.onPreviewChange(previewValue, payload);
    emitter.emit('previewChange', payload);
  }
  function resolvedPanelOptions(value) {
    var resolved = {
      showSecond: opts.showSecond !== false,
      use12Hours: opts.use12Hours === true,
      hourStep: opts.hourStep,
      minuteStep: opts.minuteStep,
      secondStep: opts.secondStep,
      disabledHours: opts.disabledHours,
      disabledMinutes: opts.disabledMinutes,
      disabledSeconds: opts.disabledSeconds,
      changeOnScroll: opts.changeOnScroll === true,
      cellRender: opts.cellRender,
      onHoverChange: handlePanelHover,
      hideDisabledOptions: opts.hideDisabledOptions === true,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      size: opts.size
    };
    if (Utils.isFunction(opts.disabledTime)) {
      var extra = opts.disabledTime(TimeUnit.clone(value), Object.freeze({ selection: selection, activeRangePart: selection === 'range' ? activeRangePart : null, timePicker: api })) || {};
      if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
        ['disabledHours','disabledMinutes','disabledSeconds','hideDisabledOptions'].forEach(function (key) { if (own(extra, key)) resolved[key] = extra[key]; });
      }
    }
    return resolved;
  }
  function syncPanel(reason) {
    if (!panel) return;
    var value = panelSeed();
    panel.updateOptions(Utils.mergeOwn( resolvedPanelOptions(value), { value: value }));
    if (panel.refresh) panel.refresh(reason || 'time-picker-sync');
  }
  var pickerSession = instance.setupPickerSession({
    controller: draft,
    needConfirm: function () { return opts.needConfirm === true; },
    canCommit: function (controller) { return !destroyed && complete(controller.draftValue); },
    onOpenDraft: function (controller) {
      controller.clearPreview({ silent:true, source:'popup', reason:'open-preview-clear' });
      controller.clearRawInput({ silent:true, source:'popup', reason:'open-raw-input-clear' });
      if (selection === 'range') activeRangePart = controller.draftValue && !controller.draftValue[0] ? 0 : (controller.draftValue && !controller.draftValue[1] ? 1 : 0);
      syncPanel('time-picker-open-sync');
      syncField(true);
    },
    onCancel: function (_controller, detail) {
      if (selection === 'range') activeRangePart = 0;
      syncPanel(detail && detail.source === 'popup' ? 'time-picker-close-restore' : 'time-picker-cancel-sync');
      syncField(false);
    },
    onCloseDraft: function (_controller, detail) {
      if (!detail.rolledBack) syncField(false);
    }
  });
  function commit(meta) { return instance.commit(meta || {}); }
  function cancel(meta) { return instance.cancel(meta || {}); }
  function clear(meta) {
    if (destroyed || InteractionPolicy.mutationLocked(opts)) return false;
    var changed = hasValue(draft.value);
    draft.setValue(emptyValue(), Utils.assignOwn({ source: 'api', reason: 'clear' }, meta || {}));
    activeRangePart = 0;
    syncPanel('time-picker-clear-sync');
    syncField(false);
    var payload = { value: cloneValue(draft.value), reason: meta && meta.reason || 'clear', timePicker: api };
    if (Utils.isFunction(opts.onClear)) opts.onClear(payload);
    emitter.emit('clear', payload);
    return changed;
  }
  function applyPanelValue(value, detail) {
    draft.clearPreview({ silent:true, source:detail.source || 'panel', reason:'selection-preview-clear' });
    var next;
    var selectedPart = selection === 'range' ? activeRangePart : null;
    var previousRangePart = activeRangePart;
    if (selection === 'single') next = TimeUnit.clone(value);
    else {
      next = cloneValue(draft.draftValue);
      next[activeRangePart] = TimeUnit.clone(value);
      if (opts.order !== false && next[0] && next[1] && TimeUnit.seconds(next[0]) > TimeUnit.seconds(next[1])) {
        next = [next[1], next[0]];
        selectedPart = activeRangePart === 0 ? 1 : 0;
      }
    }
    draft.setDraft(next, { source: detail.source, reason: 'time-select' });
    var payload = { selectedValue: TimeUnit.clone(value), value: cloneValue(draft.draftValue), activeRangePart: selectedPart, unit: detail.unit, source: detail.source, reason: detail.reason, timePicker: api };
    if (Utils.isFunction(opts.onSelect)) opts.onSelect(TimeUnit.clone(value), payload);
    emitter.emit('select', payload);
    if (selection === 'range') {
      if (activeRangePart === 0 && draft.draftValue && !draft.draftValue[1]) activeRangePart = 1;
      else if (draft.draftValue && draft.draftValue[0] && draft.draftValue[1] && selectedPart !== null) activeRangePart = selectedPart;
    }
    if (opts.needConfirm !== true && complete(draft.draftValue)) {
      var selectedCommit = instance.commit({ source: detail.source, reason: 'select-commit', originalEvent: detail.originalEvent || null });
      if (selectedCommit !== false && opts.closeOnSelect === true) field.close('select', detail.originalEvent || null);
    }
    var panelSource = detail && detail.panelOrigin === true;
    var rangePartChanged = selection === 'range' && activeRangePart !== previousRangePart;
    // Mounted TimePanel already owns the live value projection. Never rebuild it synchronously
    // from its own keyboard/pointer callback. A range-part handoff is a real structural switch
    // and may resync immediately; disabledTime context is coalesced until interaction idle.
    if (!panelSource || rangePartChanged) syncPanel('time-picker-select-sync');
    else if (Utils.isFunction(opts.disabledTime)) dependentPanelSyncScheduler.request(120, 'time-picker-disabled-time-idle');
    return true;
  }
  function setNow(value, meta) {
    if (destroyed || InteractionPolicy.mutationLocked(opts)) return false;
    var now = TimeUnit.normalizeStrict(value === undefined || value === null ? TimeUnit.now() : value);
    if (!now) return false;
    var detail = Utils.assignOwn({ source: 'now', reason: 'now' }, meta || {});
    return applyPanelValue(now, detail);
  }
  function setActiveRangePart(index) {
    if (selection !== 'range' || destroyed) return false;
    var next = Number(index);
    if (next !== 0 && next !== 1) throw new TypeError('[QXFRAME9A7C2] TimePicker active range part must be 0 or 1.');
    activeRangePart = next;
    syncPanel('time-picker-range-part');
    syncField(true);
    return true;
  }
  function handleInput(text, event) {
    draft.clearPreview({ silent:true, source:'input', reason:'typing-preview-clear' });
    var rawInput = String(text || '');
    draft.setRawInput(rawInput, { silent:true, active:true, source:'input', reason:'typing' });
    var parsed = parseTextValue(rawInput);
    if (parsed.valid && hasValue(parsed.value)) {
      draft.setDraft(parsed.value, { silent: true, source: 'input', reason: 'typing' });
      syncPanel('time-picker-input-sync');
    }
    var payload = { text: rawInput, value: parsed.valid ? cloneValue(parsed.value) : null, valid: parsed.valid, originalEvent: event, timePicker: api };
    if (Utils.isFunction(opts.onInput)) opts.onInput(rawInput, payload);
    emitter.emit('input', payload);
  }
  function handleBlur(event) {
    if (opts.readOnly === true || opts.disabled === true) return;
    var currentInput = field && field.getInputElement ? field.getInputElement() : null;
    var rawInput = currentInput && currentInput.value !== undefined ? String(currentInput.value || '') : draft.rawInput;
    draft.setRawInput(rawInput, { silent:true, active:true, source:'input', reason:'blur-read' });
    var trimmed = rawInput.trim();
    if (!trimmed) { draft.setRawInput('', { silent:true, active:false, source:'input', reason:'blur-empty' }); if (field.getState().open) syncField(true); else syncField(false); return; }
    var parsed = parseTextValue(trimmed);
    if (!parsed.valid || !complete(parsed.value)) {
      if (opts.preserveInvalidOnBlur !== true) { draft.setRawInput(rawInput, { silent:true, active:false, source:'input', reason:'blur-invalid-restore' }); syncField(field.getState().open); }
      return;
    }
    draft.setDraft(parsed.value, { silent: true, source: 'input', reason: 'blur-parse' });
    syncPanel('time-picker-blur-sync');
    if (opts.commitInputOnBlur !== false && opts.needConfirm !== true) instance.commit({ source: 'input', reason: 'blur-commit', originalEvent: event || null });
    draft.setRawInput('', { silent:true, active:false, source:'input', reason:'blur-complete' });
    syncField(field.getState().open);
  }

  field = PickerField.create({
    container: opts.container, headless: opts.headless === true, renderControl: opts.renderControl !== false, reference: opts.reference, triggerTarget: opts.triggerTarget, valueTarget: opts.valueTarget, draftValueTarget: opts.draftValueTarget, inputTarget: opts.inputTarget, formTarget: opts.formTarget, formField: opts.formField, committedValue: draft.value, serializeValue: function (value) { if (selection === 'single') return TimeUnit.format(value, { showSecond:opts.showSecond, use12Hours:opts.use12Hours }); return (value || []).map(function (entry) { return TimeUnit.format(entry, { showSecond:opts.showSecond, use12Hours:opts.use12Hours }); }); }, elements: opts.elements, createDOM: opts.createDOM,
    document: opts.document, portalContainer: opts.portalContainer,
    className: 'qxframe9a7c2-time-picker', panelClass: 'qxframe9a7c2-time-picker-panel',
    size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, editable: true,
    clearable: opts.clearable, placeholder: opts.placeholder, placement: opts.placement, trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay,
    closeOnOutsidePress: opts.closeOnOutsidePress !== false, closeOnEscape: opts.closeOnEscape !== false, destroyOnClose: opts.destroyOnClose !== false,
    beforeOpen: function (detail) { if (Utils.isFunction(opts.beforeOpen) && opts.beforeOpen(detail) === false) return false; return !destroyed && opts.disabled !== true; },
    beforeClose: function (detail) { var forcedDisabled = !!(detail && detail.forceClose === 'disabled'); var vetoed = Utils.isFunction(opts.beforeClose) && opts.beforeClose(detail) === false; if (destroyed) return false; if (vetoed && !forcedDisabled) return false; },
    onOpen: function (detail) {
      var openDetail = detail || {};
      var openInput = field && field.getInputElement ? field.getInputElement() : null;
      var openText = openInput && openInput.value !== undefined ? String(openInput.value || '') : draft.rawInput;
      var parsedOpen = openText.trim() ? parseTextValue(openText) : null;
      if (parsedOpen && parsedOpen.valid && hasValue(parsedOpen.value)) openDetail = Utils.assignOwn({}, openDetail, { draftSeed: parsedOpen.value });
      pickerSession.open(openDetail);
      if (panel && detail && (detail.source === 'keyboard' || /keyboard/i.test(String(detail.reason || '')))) panel.setActiveColumn(0, { source:'keyboard', reason:'time-picker-open', originalEvent:detail.originalEvent || null });
    },
    onClose: function (detail) { pickerSession.close(detail); },
    onOpenChange: emitOpen, onInput: handleInput, onBlur: handleBlur,
    onKeydown: function (event) { return field && field.getState().open && panel ? panel.handleKeydown(event) : false; },
    onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
  });
  instance.adoptPickerField(field);

  panel = TimePanel.create(Utils.mergeOwn( resolvedPanelOptions(panelSeed()), {
    container: field.getPanelHost(),
    value: panelSeed(),
    onSelect: function (value, detail) { applyPanelValue(value, Utils.assignOwn({ panelOrigin: true }, detail || {})); }
  }));
  if (field.getKeyboardNavigation && field.getKeyboardNavigation()) panel.bindVirtualFocus(field.getKeyboardNavigation().virtualFocus, true);
  panelScrollSettleOff = panel.on('scrollSettle', function () {
    if (destroyed || opts.changeOnScroll !== true) return;
    syncPanel('time-picker-scroll-settle');
  });

  nowButton = doc.createElement('button');
  nowButton.type = 'button'; nowButton.tabIndex = -1;
  nowButton.className = 'qxframe9a7c2-time-picker-now';
  nowButton.textContent = opts.nowText || '此刻';
  nowHandler = function (event) { setNow(undefined, { source: DOM.activationSource(event), reason: 'now-button', originalEvent: event }); };
  nowButtonOff = DOM.listen(nowButton, 'click', nowHandler);

  function syncNowButton() {
    if (!nowButton) return;
    var panelHost = field.getPanelHost();
    var inFooter = opts.footer !== false && opts.needConfirm === true && opts.showNow !== false;
    if (inFooter) {
      nowButton.classList.add('is-footer-action');
    } else {
      nowButton.classList.remove('is-footer-action');
      if (opts.showNow !== false) { if (nowButton.parentNode !== panelHost) panelHost.appendChild(nowButton); }
      else if (nowButton.parentNode) nowButton.parentNode.removeChild(nowButton);
    }
    nowButton.disabled = InteractionPolicy.mutationLocked(opts);
    nowButton.tabIndex = opts.showNow !== false && !nowButton.disabled ? 0 : -1;
    nowButton.textContent = opts.nowText || '此刻';
  }
  function rebuildFooter() {
    instance.createConfirmFooter({
      footer: opts.footer, needConfirm: opts.needConfirm, showCancel: opts.showCancel,
      startContent: opts.footerStart, actionStartContent: opts.showNow !== false ? nowButton : null, endContent: opts.footerEnd,
      cancelLabel: opts.cancelText, confirmLabel: opts.confirmText,
      confirmDisabled: opts.confirmDisabled === true || !complete(draft.draftValue)
    });
  }
  rebuildFooter(); syncNowButton(); syncField(false);

  function setValue(value, meta) {
    if (destroyed) return false;
    var normalized;
    try { normalized = normalizeValue(value); } catch (_) { return false; }
    var result = draft.setValue(normalized, Utils.assignOwn({ source: 'api', reason: 'set-value' }, meta || {}));
    if (selection === 'range') activeRangePart = normalized && !normalized[0] ? 0 : (normalized && !normalized[1] ? 1 : 0);
    syncPanel('time-picker-set-value');
    syncField(false); return result;
  }
  function setPickerValue(value, meta) {
    if (destroyed) return false;
    var normalized;
    try { normalized = normalizeValue(value); } catch (_) { return false; }
    var result = draft.setDraft(normalized, Utils.assignOwn({ source: 'api', reason: 'set-picker-value' }, meta || {}));
    if (selection === 'range') activeRangePart = normalized && !normalized[0] ? 0 : (normalized && !normalized[1] ? 1 : activeRangePart);
    syncPanel('time-picker-set-picker-value');
    syncField(true); return result;
  }
  function applyOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
      OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless'], 'TimePicker field binding');
    if (own(next, 'selection') && normalizeSelectionName(next.selection) !== selection) throw new Error('[QXFRAME9A7C2] TimePicker selection is immutable.');
    var previous = Utils.mergeOwn( opts);
    Utils.copyOwn(opts, next);
    if (selection === 'range' && String(opts.rangeSeparator || '') === '') { opts = previous; throw new TypeError('[QXFRAME9A7C2] TimePicker rangeSeparator must not be empty in range selection.'); }
    if (opts.previewValue !== false && opts.previewValue !== 'hover') { opts = previous; throw new TypeError("[QXFRAME9A7C2] TimePicker previewValue must be false or 'hover'."); }
    dependentPanelSyncScheduler.cancel();
    field.updateOptions({ size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, clearable: opts.clearable, placeholder: opts.placeholder, placement: opts.placement, trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay, destroyOnClose: opts.destroyOnClose !== false });
    if (own(next, 'value')) setValue(next.value, { silent: true, source: 'options', reason: 'controlled' });
    else syncPanel('time-picker-options');
    if (opts.previewValue === false) draft.clearPreview({ silent:true, source:'options', reason:'preview-disabled' });
    rebuildFooter(); syncNowButton(); syncField(field.getState().open);
    if (own(next, 'open')) field.setOpen(next.open === true, 'update-options');
    return api;
  }
  function getState() {
    return Object.freeze({
      open: field.getState().open,
      headless: opts.headless === true,
      selection: selection,
      value: cloneValue(draft.value),
      draftValue: cloneValue(draft.draftValue),
      dirty: draft.dirty,
      text: field.getState().displayValue,
      activeRangePart: selection === 'range' ? activeRangePart : null,
      hideDisabledOptions: opts.hideDisabledOptions === true,
      changeOnScroll: opts.changeOnScroll === true,
      previewValue: draft.hasPreview ? cloneValue(draft.previewValue) : null,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      needConfirm: opts.needConfirm === true,
      destroyed: destroyed
    });
  }
  function disposeRuntime(reason) {
    if (destroyed) return false;
    destroyed = true;
    if (nowButtonOff) { nowButtonOff(); nowButtonOff = null; }
    if (panelScrollSettleOff) panelScrollSettleOff();
    panelScrollSettleOff = null;
    dependentPanelSyncScheduler.dispose();
    if (field) field.destroy(reason || 'time-picker-destroy');
    if (panel) panel.destroy(reason || 'time-picker-destroy');
    draft.destroy();
    panel = field = nowButton = nowHandler = panelScrollSettleOff = null;
    return true;
  }


  var formControl = field && field.getControl ? field.getControl() : null;
  if (formControl && formControl.onFormReset) formControl.onFormReset(function () {
    draft.reset({ silent: true, source: 'form', reason: 'reset' }); syncField(false); rebuildFooter();
  });
  if (opts.open === true) field.open('initial');
  return Object.freeze({ root:field.getRootElement(), panel:field.getPanelElement(), field:field, timePanel:panel, nowButton:nowButton, clear:clear, setValue:setValue, setPickerValue:setPickerValue, setNow:setNow, setActiveRangePart:setActiveRangePart, applyOptions:applyOptions, getState:getState, dispose:disposeRuntime });
}


export class TimePicker extends PickerComponent {
  static contract = getContract('TimePicker');
  static profile = Object.freeze({
    name:'TimePicker',
    value:Object.freeze({ mode:'picker-session', channels:Object.freeze(['committed','draft','preview','rawInput']) }),
    focus:Object.freeze({ mode:'virtual-navigation' }),
    interaction:Object.freeze({ keymap:'picker' }),
    overlay:Object.freeze({ mode:'popup' }),
    form:Object.freeze({ serialize:true }),
    ownership:Object.freeze({ value:'ValueController' })
  });
  static options = TIME_PICKER_DEFAULTS;
  static immutableOptions = TIME_PICKER_IMMUTABLE;
  static create(source, overrides) { return new this(source, overrides).render(); }
  static enhance(input, options) { return this.create(input, options || {}); }
  static formatTime(value, showSecond, use12Hours) { return TimeUnit.format(value, { showSecond:showSecond, use12Hours:use12Hours }); }
  static parseTime(value, showSecond, use12Hours) { return TimeUnit.parse(value, { showSecond:showSecond, use12Hours:use12Hours }); }

  constructor(source = {}, overrides) {
    const fieldInit = Control.resolveFieldOptions(source, overrides);
    const incoming = fieldInit.options;
    const selection = normalizeSelectionName(incoming.selection);
    const derivedNeedConfirm = selection === 'range';
    incoming.selection = selection;
    if (!own(incoming, 'needConfirm')) incoming.needConfirm = derivedNeedConfirm;
    if (!own(incoming, 'showCancel')) incoming.showCancel = incoming.needConfirm === true;
    if (!own(incoming, 'placeholder')) incoming.placeholder = selection === 'range' ? '选择时间范围' : '选择时间';
    super(incoming);
    runtimeState.set(this, { fieldInit, runtime:null });
  }

  [componentHooks.render]() {
    const record = runtimeState.get(this);
    if (record.runtime) return record.runtime.root;
    const runtime = setupTimePickerRuntime(this, record.fieldInit);
    record.runtime = runtime;
    this.own(() => runtime.dispose('time-picker-destroy'));
    this.setFieldValue(runtime.getState().value, { silent:true, force:true });
    return runtime.root;
  }

  [pickerHooks.optionsUpdated](next, previous, patch) { const r=runtimeState.get(this).runtime; if (r) r.applyOptions(patch); }
  [pickerHooks.clear](meta) { const r=runtimeState.get(this).runtime; return r ? r.clear(meta) : false; }
  [pickerHooks.now](meta) { const r=runtimeState.get(this).runtime; return r ? r.setNow(undefined, meta) : false; }
  setValue(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setValue(value, meta) : false; }
  setPickerValue(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setPickerValue(value, meta) : false; }
  setNow(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setNow(value, meta) : false; }
  setActiveRangePart(index) { const r=runtimeState.get(this).runtime; return r ? r.setActiveRangePart(index) : false; }
  getState() { const r=runtimeState.get(this).runtime; return r ? r.getState() : Object.freeze({ open:false, destroyed:this.destroyed }); }
  getTimePanel() { const r=runtimeState.get(this).runtime; return r ? r.timePanel : null; }
  getNowElement() { const r=runtimeState.get(this).runtime; return r ? r.nowButton : null; }
}
