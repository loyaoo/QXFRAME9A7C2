import { PickerComponent, pickerHooks } from './picker.js';
import { PickerField } from './picker-field.js';
import { WheelPanel } from './wheel-panel.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { StateController } from '../core/stateController.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { DOM } from '../core/dom.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { WheelMetrics } from '../utils/wheelMetrics.js';
import { Utils } from '../utils/utils.js';

const runtimeState = new WeakMap();
const WHEEL_PICKER_DEFAULTS = Object.freeze({
  value:undefined, defaultValue:[], visibleItemCount:7, scrollbarVisibility:'auto', wheelPropagation:true,
  snapBehavior:'smooth', snapDuration:220, scrollIdleDelay:100, loop:false, size:'md', disabled:false, readOnly:false,
  clearable:false, placeholder:'请选择', needConfirm:false, showCancel:false, closeOnSelect:false, separator:' / ', trigger:'click', open:false
});

var STRUCTURAL_OPTIONS = Object.freeze(['target', 'container', 'formField', 'elements', 'createDOM', 'document', 'portalContainer', 'reference', 'triggerTarget', 'valueTarget', 'draftValueTarget', 'inputTarget', 'formTarget', 'renderControl', 'headless']);
var own = Utils.own;
function cloneValue(value) { return Array.isArray(value) ? value.slice() : []; }
function equalValue(left, right) { return ValueEquality.array(left, right); }
function assertValue(value, label) {
  if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] WheelPicker ' + label + ' must be an array aligned to columns.');
  return value.map(function (item) { return item === null || item === undefined ? null : String(item); });
}
function setupWheelPickerRuntime(instance, fieldInit) {
var incoming = fieldInit.options;
var itemHeightExplicit = own(incoming, 'itemHeight');
var opts = Utils.mergeOwn( instance.options);
if (!Array.isArray(opts.columns) || opts.columns.length === 0) throw new TypeError('[QXFRAME9A7C2] WheelPicker columns must be a non-empty array.');
if (opts.value !== undefined) opts.value = assertValue(opts.value, 'value');
opts.defaultValue = assertValue(opts.defaultValue || [], 'defaultValue');
if (typeof opts.loop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] WheelPicker loop must be boolean.');
PickerField.validateHeadlessOptions(opts, 'WheelPicker');
var doc = fieldInit.document || opts.document || (opts.container && opts.container.ownerDocument) || (opts.formField && opts.formField.ownerDocument) || globalThis.document;
opts.document = doc;

var emitter = Object.freeze({ emit: function (type, payload) { return instance.emit(type, payload); } });
var destroyed = false;
var field = null;
var panel = null;
var api = instance;
var panelSelectionDepth = 0;
var draft = StateController.create({
  value: opts.value !== undefined ? cloneValue(opts.value) : cloneValue(opts.defaultValue),
  copyValue: cloneValue,
  normalizeValue: function (value) { return assertValue(value || [], 'value'); },
  equals: equalValue,
  onValueChange: function (value, detail) { syncField(false, { panelSynced: panelSelectionDepth > 0, commitMeta: { source: detail.source || 'value-draft', reason: detail.reason || 'value-change' } }); if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(cloneValue(value), Utils.mergeOwn( detail, { value: cloneValue(value), previousValue: cloneValue(detail.previousValue), wheelPicker: api })); if (detail.silent !== true) { var payload = { value: cloneValue(value), reason: detail.reason, source: detail.source, wheelPicker: api }; if (Utils.isFunction(opts.onChange)) opts.onChange(cloneValue(value), payload); emitter.emit('change', payload); } },
  onDraftChange: function (value, detail) { syncField(field && field.getState().open && opts.needConfirm === true, { panelSynced: panelSelectionDepth > 0 }); if (Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(cloneValue(value), Utils.mergeOwn( detail, { value: cloneValue(draft.value), draftValue: cloneValue(value), wheelPicker: api })); }
});
    
function formatDisplay(useDraft) {
  if (!panel) return '';
  var target = useDraft ? draft.draftValue : draft.value;
  if (!target || !target.length) return '';
  var selected = panel.getSelectedItemsForValue(target);
  if (Utils.isFunction(opts.formatValue)) return String(opts.formatValue(selected.slice(), cloneValue(target), { wheelPicker: api }));
  return selected.filter(Boolean).map(function (item) { return item.label; }).join(String(opts.separator == null ? ' / ' : opts.separator));
}
    
function syncField(useDraft, config) {
  if (!field || !panel) return;
  var value = useDraft ? draft.draftValue : draft.value;
  if (!(config && config.panelSynced === true)) {
    panel.setValue(value || [], { silent: true, source: 'field-sync', reason: 'field-sync' });
  }
  field.setDisplayValue(field.getState().hasDraftValueTarget ? (draft.value && draft.value.length ? formatDisplay(false) : '') : (value && value.length ? formatDisplay(useDraft) : ''));
  field.setDraftDisplayValue(useDraft && draft.dirty && draft.draftValue && draft.draftValue.length ? formatDisplay(true) : '');
  field.setDraftVisual(useDraft && draft.dirty && !field.getState().hasDraftValueTarget);
  field.setClearVisible(opts.clearable === true && !!(draft.value && draft.value.length));
  field.setCommittedValue(draft.value, config && config.commitMeta || { silent: true, source: 'value-draft', reason: 'projection' });
}
    
function emitOpen(opened, detail) {
  if (!opened) syncField(false);
  if (opened && detail && (detail.source === 'keyboard' || /keyboard/i.test(String(detail.reason || ''))) && panel && panel.setActiveColumn) panel.setActiveColumn(0, { source:'keyboard', reason:'wheel-picker-open', originalEvent:detail.originalEvent || null });
  return OpenStateBridge.dispatch(opened, detail, {
    emitter: emitter,
    eventName: 'open-change',
    decorate: function () { return { wheelPicker: api }; },
    onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); }
  });
}
    
var pickerSession = instance.setupPickerSession({
  controller: draft,
  needConfirm: function () { return opts.needConfirm === true; },
  canCommit: function () { return !destroyed; },
  onOpenDraft: function (controller) {
    panel.setValue(controller.draftValue || [], { silent: true, source: 'open', reason: 'open-sync' });
    controller.setDraft(panel.getState().value, { silent: true, source: 'open', reason: 'open-normalize' });
    syncField(opts.needConfirm === true);
  },
  beforeCommit: function () {
    if (panel && field && field.getState().open) {
      var settled = panel.settleSelection('confirm-settle');
      if (!equalValue(draft.draftValue, settled)) draft.setDraft(settled, { source: 'panel', reason: 'confirm-settle' });
    }
    return true;
  },
  onCommit: function () { syncField(false); },
  onCancel: function (_controller, detail) {
    panel.setValue(draft.value || [], { silent: true, source: detail && detail.source || 'api', reason: detail && detail.source === 'popup' ? 'close-restore' : 'cancel-sync' });
    syncField(false);
  }
});
function commit(meta) { return instance.commit(meta || {}); }
function cancel(meta) { return instance.cancel(meta || {}); }
    
function clear(meta) {
  if (destroyed || InteractionPolicy.mutationLocked(opts)) return false;
  var changed = !!(draft.value && draft.value.length);
  draft.setValue([], Utils.assignOwn({ source: 'api', reason: 'clear' }, meta || {}));
  panel.setValue([], { silent: true, source: 'api', reason: 'clear-sync' });
  syncField(false);
  var payload = { value: [], reason: meta && meta.reason || 'clear', wheelPicker: api };
  if (Utils.isFunction(opts.onClear)) opts.onClear(payload);
  emitter.emit('clear', payload);
  return changed;
}
    
field = PickerField.create({
  container: opts.container,
  headless: opts.headless === true, renderControl: opts.renderControl !== false, reference: opts.reference, triggerTarget: opts.triggerTarget, valueTarget: opts.valueTarget, draftValueTarget: opts.draftValueTarget, inputTarget: opts.inputTarget, formTarget: opts.formTarget,
  formField: opts.formField,
  committedValue: draft.value,
  serializeValue: cloneValue,
  elements: opts.elements,
  createDOM: opts.createDOM,
  document: opts.document,
  portalContainer: opts.portalContainer,
  className: 'qxframe9a7c2-wheel-picker',
  panelClass: 'qxframe9a7c2-wheel-picker-popup',
  size: opts.size,
  variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles,
  status: opts.status,
  prefix: opts.prefix,
  suffix: opts.suffix,
  required: opts.required === true,
  name: opts.name,
  busy: opts.busy === true,
  disabled: opts.disabled,
  readOnly: opts.readOnly,
  editable: false,
  clearable: opts.clearable,
  placeholder: opts.placeholder,
  placement: opts.placement,
  trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay,
  matchReferenceWidth: opts.matchReferenceWidth === true,
  closeOnOutsidePress: opts.closeOnOutsidePress !== false,
  closeOnEscape: opts.closeOnEscape !== false,
  focusScope: opts.needConfirm === true ? 'contain' : 'exit',
  destroyOnClose: opts.destroyOnClose !== false,
  beforeOpen: function (detail) {
    if (Utils.isFunction(opts.beforeOpen) && opts.beforeOpen(detail) === false) return false;
    return !destroyed && opts.disabled !== true;
  },
  beforeClose: function (detail) {
    var forcedDisabled = !!(detail && detail.forceClose === 'disabled');
    var vetoed = Utils.isFunction(opts.beforeClose) && opts.beforeClose(detail) === false;
    if (destroyed) return false;
    if (vetoed && !forcedDisabled) return false;
  },
  onOpen: function (detail) { pickerSession.open(detail); if (panel && detail && (detail.source === 'keyboard' || /keyboard/i.test(String(detail.reason || '')))) panel.setActiveColumn(0, { source:'keyboard', reason:'wheel-picker-open', originalEvent:detail.originalEvent || null }); },
  onClose: function (detail) { pickerSession.close(detail); },
  afterOpen: function (detail) { panel.refreshVisible('open'); if (Utils.isFunction(opts.afterOpen)) opts.afterOpen(detail); },
  afterClose: function (detail) { if (Utils.isFunction(opts.afterClose)) opts.afterClose(detail); },
  onOpenChange: emitOpen,
  onKeydown: function (event) { return field && field.getState().open && panel ? panel.handleKeydown(event) : false; },
  onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
});
instance.adoptPickerField(field);
    
panel = WheelPanel.create({
  container: field.getPanelHost(),
  document: doc,
  columns: opts.columns,
  value: draft.draftValue || [],
  visibleItemCount: opts.visibleItemCount,
  itemHeight: opts.itemHeight,
  scrollbarVisibility: opts.scrollbarVisibility,
  wheelPropagation: opts.wheelPropagation,
  snapBehavior: opts.snapBehavior,
  snapDuration: opts.snapDuration,
  scrollIdleDelay: opts.scrollIdleDelay,
  loop: opts.loop === true,
  size: opts.size,
  disabled: opts.disabled === true,
  readOnly: opts.readOnly === true,
  onSelect: function (value, detail) {
    panelSelectionDepth += 1;
    try {
      draft.setDraft(value, { source: detail.source, reason: 'wheel-select' });
      var payload = { value: cloneValue(value), selectedItems: detail.selectedItems.slice(), columnIndex: detail.columnIndex, columnKey: detail.columnKey, item: detail.item, source: detail.source, reason: detail.reason, wheelPicker: api };
      if (Utils.isFunction(opts.onSelect)) opts.onSelect(cloneValue(value), payload);
      emitter.emit('select', payload);
      if (opts.needConfirm !== true) {
        draft.commit({ source: detail.source, reason: 'select-commit' });
        if (opts.closeOnSelect === true && value.length === opts.columns.length && value.every(function (entry) { return entry !== null; })) field.close('select', detail.originalEvent || null);
      } else {
        syncField(true, { panelSynced: true });
      }
    } finally {
      panelSelectionDepth -= 1;
    }
  }
});
if (field.getKeyboardNavigation && field.getKeyboardNavigation()) panel.bindVirtualFocus(field.getKeyboardNavigation().virtualFocus, true);
    
function rebuildFooter() {
  instance.createConfirmFooter({
    footer: opts.footer, needConfirm: opts.needConfirm, showCancel: opts.showCancel,
    startContent: opts.footerStart, endContent: opts.footerEnd,
    cancelLabel: opts.cancelText, confirmLabel: opts.confirmText, confirmDisabled: opts.confirmDisabled === true
  });
}
    
function setValue(next, meta) {
  if (destroyed) return false;
  var normalized = assertValue(next || [], 'value');
  panel.setValue(normalized, { silent: true, source: 'api', reason: 'set-value-normalize' });
  normalized = panel.getState().value;
  var result = draft.setValue(normalized, Utils.assignOwn({ source: 'api', reason: 'set-value' }, meta || {}));
  panel.setValue(draft.value || [], { silent: true, source: 'api', reason: 'set-value-sync' });
  syncField(false);
  return result;
}
    
function applyOptions(nextOptions) {
  if (destroyed) return instance;
    var next = nextOptions || {};
  if (own(next, 'itemHeight')) itemHeightExplicit = true;
  if (!itemHeightExplicit && own(next, 'size')) next.itemHeight = WheelMetrics.itemHeight(next.size);
  STRUCTURAL_OPTIONS.forEach(function (key) {
    if (own(next, key) && next[key] !== opts[key]) throw new Error('[QXFRAME9A7C2] WheelPicker ' + key + ' is immutable; destroy and recreate to change it.');
  });
  if (own(next, 'value')) next.value = assertValue(next.value || [], 'value');
  if (own(next, 'defaultValue')) next.defaultValue = assertValue(next.defaultValue || [], 'defaultValue');
  if (own(next, 'loop') && typeof next.loop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] WheelPicker loop must be boolean.');
  Utils.copyOwn(opts, next);
  field.updateOptions({ size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, clearable: opts.clearable, placeholder: opts.placeholder, placement: opts.placement, trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay, matchReferenceWidth: opts.matchReferenceWidth === true, focusScope: opts.needConfirm === true ? 'contain' : 'exit', destroyOnClose: opts.destroyOnClose !== false });
  panel.updateOptions({ columns: opts.columns, visibleItemCount: opts.visibleItemCount, itemHeight: opts.itemHeight, scrollbarVisibility: opts.scrollbarVisibility, wheelPropagation: opts.wheelPropagation, snapBehavior: opts.snapBehavior, snapDuration: opts.snapDuration, scrollIdleDelay: opts.scrollIdleDelay, loop: opts.loop === true, size: opts.size, disabled: opts.disabled === true, readOnly: opts.readOnly === true, value: own(next, 'value') ? next.value : draft.draftValue });
  if (own(next, 'value')) {
    var normalized = panel.getState().value;
    draft.setValue(normalized, { silent: true, source: 'options', reason: 'controlled' });
  } else if (own(next, 'columns')) {
    var previousDraft = cloneValue(draft.draftValue);
    panel.setValue(draft.value || [], { silent: true, source: 'options', reason: 'columns-normalize-value' });
    var normalizedValue = panel.getState().value;
    panel.setValue(previousDraft || [], { silent: true, source: 'options', reason: 'columns-normalize-draft' });
    var normalizedDraft = panel.getState().value;
    draft.setValue(normalizedValue, { silent: true, source: 'options', reason: 'columns-normalize-value' });
    draft.setDraft(normalizedDraft, { silent: true, source: 'options', reason: 'columns-normalize-draft' });
    panel.setValue(normalizedDraft, { silent: true, source: 'options', reason: 'columns-normalize-final' });
  }
  rebuildFooter();
  syncField(field.getState().open && opts.needConfirm === true);
  if (own(next, 'open')) field.setOpen(next.open === true, 'update-options');
  return instance;
}
    
function getState() {
  var panelState = panel.getState();
  return Object.freeze({
    open: field.getState().open,
    headless: opts.headless === true,
    value: cloneValue(draft.value),
    draftValue: cloneValue(draft.draftValue),
    selectedItems: draft.draftValue && draft.draftValue.length ? panel.getSelectedItemsForValue(draft.draftValue) : [],
    text: field.getState().displayValue,
    dirty: draft.dirty,
    columnCount: panelState.columnCount,
    loop: opts.loop === true,
    disabled: opts.disabled === true,
    readOnly: opts.readOnly === true,
    needConfirm: opts.needConfirm === true,
    destroyed: destroyed
  });
}
    
function disposeRuntime(reason) {
  if (destroyed) return false;
  destroyed = true;
  panel.destroy(reason || 'wheel-picker-destroy');
  draft.destroy();
  field.destroy(reason || 'wheel-picker-destroy');
  panel = field = null;
  return true;
}
    
    
rebuildFooter();
panel.setValue(draft.value || [], { silent: true, source: 'init', reason: 'init-sync' });
if (draft.value && draft.value.length) draft.setValue(panel.getState().value, { silent: true, source: 'init', reason: 'init-normalize' });
syncField(false);
var formControl = field && field.getControl ? field.getControl() : null;
if (formControl && formControl.onFormReset) formControl.onFormReset(function () {
  draft.reset({ silent: true, source: 'form', reason: 'reset' });
  panel.setValue(draft.value || [], { silent: true, source: 'form', reason: 'reset' }); syncField(false, { panelSynced: true });
});
if (opts.open === true) field.open('initial');
return Object.freeze({ root:field.getRootElement(), panel:field.getPanelElement(), field:field, wheelPanel:panel, setValue:setValue, clear:clear, applyOptions:applyOptions, getState:getState, dispose:disposeRuntime });
      
}


export class WheelPicker extends PickerComponent {
  static contract = getContract('WheelPicker');
  static options = WHEEL_PICKER_DEFAULTS;
  static immutableOptions = STRUCTURAL_OPTIONS;
  static create(source, overrides) { return new this(source, overrides).render(); }
  static enhance(input, options) { return this.create(input, options || {}); }

  constructor(source = {}, overrides) {
    const fieldInit = Control.resolveFieldOptions(source, overrides);
    const incoming = fieldInit.options;
    if (fieldInit.formField && !own(incoming, 'value') && !own(incoming, 'defaultValue')) incoming.value = fieldInit.nativeValue === '' ? [] : [fieldInit.nativeValue];
    if (!own(incoming, 'itemHeight')) incoming.itemHeight = WheelMetrics.itemHeight(incoming.size || 'md');
    super(incoming);
    runtimeState.set(this, { fieldInit, runtime:null });
  }

  [componentHooks.render]() {
    const record = runtimeState.get(this);
    if (record.runtime) return record.runtime.root;
    const runtime = setupWheelPickerRuntime(this, record.fieldInit);
    record.runtime = runtime;
    this.own(() => runtime.dispose('wheel-picker-destroy'));
    this.setFieldValue(runtime.getState().value, { silent:true, force:true });
    return runtime.root;
  }

  [pickerHooks.optionsUpdated](next, previous, patch) { const r=runtimeState.get(this).runtime; if (r) r.applyOptions(patch); }
  [pickerHooks.clear](meta) { const r=runtimeState.get(this).runtime; return r ? r.clear(meta) : false; }
  setValue(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setValue(value, meta) : false; }
  getState() { const r=runtimeState.get(this).runtime; return r ? r.getState() : Object.freeze({ open:false, destroyed:this.destroyed }); }
  getWheelPanel() { const r=runtimeState.get(this).runtime; return r ? r.wheelPanel : null; }
}
