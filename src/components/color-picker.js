import { PickerComponent, pickerHooks } from './picker.js';
import { PickerField } from './picker-field.js';
import { ColorPanel } from './color-panel.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { StateController } from '../core/stateController.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { PointerSession } from '../core/pointerSession.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { DOM } from '../core/dom.js';
import { Utils } from '../utils/utils.js';

const runtimeState = new WeakMap();
const COLOR_PICKER_DEFAULTS = Object.freeze({
  mode:'solid', gradient:false, format:'hex', showAlpha:true, clearable:true, needConfirm:false, showCancel:false,
  disabled:false, readOnly:false, size:'md', placement:'bottom-start', trigger:'click', open:false,
  placeholder:'选择颜色', indicatorPlacement:'start', gradientAngle:90, swatchOnly:false
});
const COLOR_PICKER_IMMUTABLE = Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless']);

var MODES = Object.freeze(['solid', 'gradient']);

var DEFAULT_PRESET_TOKENS = Object.freeze([
  Object.freeze({ name: 'blue-6', fallback: 'rgb(89, 147, 255)' }),
  Object.freeze({ name: 'cyan-6', fallback: 'rgb(69, 195, 217)' }),
  Object.freeze({ name: 'teal-6', fallback: 'rgb(55, 204, 159)' }),
  Object.freeze({ name: 'green-6', fallback: 'rgb(91, 207, 110)' }),
  Object.freeze({ name: 'lime-6', fallback: 'rgb(167, 212, 61)' }),
  Object.freeze({ name: 'yellow-6', fallback: 'rgb(255, 184, 51)' }),
  Object.freeze({ name: 'orange-6', fallback: 'rgb(255, 136, 57)' }),
  Object.freeze({ name: 'red-6', fallback: 'rgb(246, 113, 113)' }),
  Object.freeze({ name: 'pink-6', fallback: 'rgb(246, 106, 155)' }),
  Object.freeze({ name: 'purple-6', fallback: 'rgb(210, 117, 233)' })
]);
function defaultPresetColors(doc) {
  var view = doc && doc.defaultView || globalThis;
  var style = null;
  try { style = view && view.getComputedStyle && doc && doc.documentElement ? view.getComputedStyle(doc.documentElement) : null; } catch (error) { style = null; }
  return DEFAULT_PRESET_TOKENS.map(function (entry) {
    var raw = style && style.getPropertyValue ? String(style.getPropertyValue('--qxframe9a7c2-palette-' + entry.name) || '').trim() : '';
    var value = /^\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?\s*,\s*\d+(?:\.\d+)?$/.test(raw) ? 'rgb(' + raw + ')' : entry.fallback;
    return { label: entry.name, value: value };
  });
}
var own = Utils.own;
function normalizeMode(value) {
  var mode = String(value || 'solid').toLowerCase();
  if (MODES.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] ColorPicker mode must be solid or gradient.');
  return mode;
}
function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value) || 0)); }

function supportedSolid(value) {
  if (value === null || value === undefined || value === '') return true;
  if (value && typeof value === 'object') {
    var hsv = value.h !== undefined && value.s !== undefined && value.v !== undefined;
    var hsl = value.h !== undefined && value.s !== undefined && value.l !== undefined;
    var rgb = value.r !== undefined && value.g !== undefined && value.b !== undefined;
    if (!hsv && !hsl && !rgb) return false;
    var fields = hsv ? ['h','s','v','a'] : (hsl ? ['h','s','l','a'] : ['r','g','b','a']);
    return fields.every(function (name) { return value[name] === undefined || Number.isFinite(Number(value[name])); });
  }
  var text = String(value).trim();
  if (/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(text)) return true;
  if (/^rgba?\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i.test(text)) return true;
  return /^hsla?\(\s*[\d.]+(?:deg)?\s*[, ]\s*[\d.]+%\s*[, ]\s*[\d.]+%(?:\s*[,/]\s*[\d.]+%?)?\s*\)$/i.test(text);
}
function isGradient(value) { return !!(value && typeof value === 'object' && value.type === 'gradient'); }
function supportedGradient(value) {
  if (!isGradient(value) || !Array.isArray(value.stops) || value.stops.length < 2) return false;
  if (value.angle !== undefined && !Number.isFinite(Number(value.angle))) return false;
  return value.stops.every(function (stop) {
    return !!stop && typeof stop === 'object' && Number.isFinite(Number(stop.offset)) && Number(stop.offset) >= 0 && Number(stop.offset) <= 1 && supportedSolid(stop.color);
  });
}
function cloneGradient(value) {
  if (!value) return null;
  return ValueEquality.copyDeep({ type: 'gradient', angle: Number(value.angle === undefined ? 90 : value.angle), stops: value.stops.map(function (stop) { return { offset: Number(stop.offset), color: stop.color }; }) });
}
function cloneModel(value) { return isGradient(value) ? cloneGradient(value) : value == null ? null : String(value); }
function modelEquals(left, right) { return ValueEquality.deep(left, right); }
function gradientCSS(value) {
  if (!isGradient(value)) return '';
  var stops = value.stops.slice().sort(function (a, b) { return Number(a.offset) - Number(b.offset); }).map(function (stop) { return String(stop.color) + ' ' + Math.round(clamp(stop.offset, 0, 1) * 1000) / 10 + '%'; });
  return 'linear-gradient(' + Number(value.angle === undefined ? 90 : value.angle) + 'deg, ' + stops.join(', ') + ')';
}

function setupColorPickerRuntime(instance, fieldInit) {
     var source = fieldInit.options;
     if (fieldInit.formField && !own(source, 'value') && !own(source, 'defaultValue')) source.value = fieldInit.nativeValue;
        var initialRaw = source.value !== undefined ? source.value : source.defaultValue;
     var mode = own(source, 'mode') ? normalizeMode(source.mode) : 'solid';
     if (own(source, 'gradient') && typeof source.gradient !== 'boolean') throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient must be boolean.');
     var gradientEnabled = source.gradient === true || (own(source, 'mode') && mode === 'gradient');
     var opts = Object.assign({
       mode: mode, gradient: false, format: 'hex', showAlpha: true, clearable: true, needConfirm: false, showCancel: false,
       disabled: false, readOnly: false, size: 'md', placement: 'bottom-start', trigger: 'click', open: false,
       placeholder: '选择颜色', presets: null, indicatorPlacement: 'start', gradientAngle: 90, swatchOnly: false
     }, source);
     opts.gradient = gradientEnabled;
     PickerField.validateHeadlessOptions(opts, 'ColorPicker');
     if (['start','end'].indexOf(String(opts.indicatorPlacement || 'start')) < 0) throw new TypeError('[QXFRAME9A7C2] ColorPicker indicatorPlacement must be start or end.');
     if (isGradient(initialRaw) && !supportedGradient(initialRaw)) throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient value is invalid.');
     if (isGradient(initialRaw) && !gradientEnabled) throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient support is disabled by default; pass gradient:true or mode:"gradient".');
     if (!isGradient(initialRaw) && initialRaw !== null && initialRaw !== undefined && initialRaw !== '' && !supportedSolid(initialRaw)) throw new TypeError('[QXFRAME9A7C2] ColorPicker value uses an unsupported color format.');
     if (mode === 'solid' && isGradient(initialRaw)) throw new TypeError('[QXFRAME9A7C2] ColorPicker solid mode cannot initialize from a gradient value.');

     var doc = fieldInit.document || opts.document || globalThis.document;
     if (!own(source, 'presets')) opts.presets = defaultPresetColors(doc);
     var swatch = doc.createElement('span');
     swatch.className = 'qxframe9a7c2-color-picker-swatch';
     function fieldPrefixContent() { return String(opts.indicatorPlacement || 'start') === 'start' ? [swatch, opts.prefix].filter(function (item) { return item !== undefined && item !== null && item !== false; }) : opts.prefix; }
     function fieldSuffixContent() { return String(opts.indicatorPlacement || 'start') === 'end' ? [opts.suffix, swatch].filter(function (item) { return item !== undefined && item !== null && item !== false; }) : opts.suffix; }

     var emitter = Object.freeze({ emit: function (type, payload) { return instance.emit(type, payload); } });
     var destroyed = false;
     var field = null;
     var panel = null;
     var draft = null;
     var api = instance;
     var activeStopIndex = 0;
     var modeHost = null;
     var solidModeButton = null;
     var gradientModeButton = null;
     var gradientHost = null;
     var gradientTrack = null;
     var gradientStops = null;
     var gradientAngleInput = null;
     var gradientAddButton = null;
     var gradientRemoveButton = null;
     var gradientHint = null;
     var gradientDragSession = null;
     var gradientDragSnapshot = null;
     var gradientDragIndex = -1;
     var gradientClickHandler = null;
     var gradientInputHandler = null;
     var gradientPointerHandler = null;
     var gradientStopStructureKey = '';
     var gradientListenerCleanups = [];

     function emitOpen(opened, detail) {
       if (!opened && draft) syncField(false);
       if (opened && panel) activateColorVirtualFocus('color-picker-open');
       return OpenStateBridge.dispatch(opened, detail, {
         emitter: emitter,
         eventName: 'openChange',
         decorate: function () { return { colorPicker: api }; },
         onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); }
       });
     }
     function canonicalSolid(value) {
       if (value === null || value === undefined || value === '') return null;
       if (!supportedSolid(value)) return undefined;
       var parsed = ColorPanel.parseColor(value);
       if (!parsed) return undefined;
       return ColorPanel.formatColor(parsed, opts.format, opts.showAlpha !== false);
     }
     function normalizeGradient(value) {
       if (!supportedGradient(value)) return undefined;
       var output = { type: 'gradient', angle: Number(value.angle === undefined ? opts.gradientAngle : value.angle), stops: [] };
       for (var i = 0; i < value.stops.length; i += 1) {
         var color = canonicalSolid(value.stops[i].color);
         if (!color) return undefined;
         output.stops.push({ offset: clamp(value.stops[i].offset, 0, 1), color: color });
       }
       output.stops.sort(function (a, b) { return a.offset - b.offset; });
       return output;
     }
     function seedSolid() { return canonicalSolid(opts.defaultPickerValue || '#1677FF') || '#1677FF'; }
     function seedGradient(color) {
       var solid = canonicalSolid(color || opts.defaultPickerValue || '#1677FF') || '#1677FF';
       return { type: 'gradient', angle: Number(opts.gradientAngle === undefined ? 90 : opts.gradientAngle), stops: [{ offset: 0, color: solid }, { offset: 1, color: solid }] };
     }
     function seedValue() { return mode === 'gradient' ? seedGradient() : seedSolid(); }
     function normalizeModel(value) {
       if (value === null || value === undefined || value === '') return null;
       if (isGradient(value)) return normalizeGradient(value);
       var solid = canonicalSolid(value);
       if (solid === undefined) return undefined;
       if (mode === 'gradient') return seedGradient(solid);
       return solid;
     }
     function visualValue(preferDraft) { return preferDraft && draft && draft.dirty ? draft.draftValue : (draft ? draft.value : null); }
     function activeColor(value) {
       if (!isGradient(value)) return value;
       if (!value.stops.length) return null;
       activeStopIndex = Math.max(0, Math.min(value.stops.length - 1, activeStopIndex));
       return value.stops[activeStopIndex].color;
     }
     function syncPanelFromModel(value, reason) {
       if (!panel) return;
       var color = activeColor(value) || seedSolid();
       panel.setValue(color, { silent: true, source: reason || 'sync', reason: reason || 'sync' });
       panel.setFormat(opts.format);
     }
     function fieldDisplay(value) { return isGradient(value) ? gradientCSS(value) : (value || ''); }
     function emitInteractionComplete(value, detail) {
       var payload = { value: cloneModel(value), color: isGradient(value) ? activeColor(value) : value, activeStopIndex: mode === 'gradient' ? activeStopIndex : null, rgba: detail && detail.rgba, hsv: detail && detail.hsv, source: detail && detail.source || 'api', reason: detail && detail.reason || 'change-complete', complete: true, cancelled: !!(detail && detail.cancelled), rolledBack: !!(detail && detail.rolledBack), colorPicker: api };
       if (Utils.isFunction(opts.onChangeComplete)) opts.onChangeComplete(cloneModel(value), payload);
       emitter.emit('changeComplete', payload);
     }
     function syncField(preferDraft, meta) {
       if (!field || !draft) return;
       var value = visualValue(preferDraft);
       var display = fieldDisplay(value);
       field.setDisplayValue(opts.swatchOnly === true && opts.renderControl !== false && opts.headless !== true ? '' : (field.getState().hasDraftValueTarget ? fieldDisplay(draft.value) : display));
       field.setDraftDisplayValue(preferDraft && draft.dirty ? fieldDisplay(draft.draftValue) : '');
       field.setDraftVisual(preferDraft && draft.dirty && !field.getState().hasDraftValueTarget);
       field.setClearVisible(!!draft.value);
       field.setCommittedValue(draft.value, meta || { silent: true, source: 'value-draft', reason: 'projection' });
       swatch.style.background = display || 'transparent';
       renderGradientEditor(value);
     }
     function bindColorVirtualFocus() {
       if (!field || !panel || !field.getKeyboardNavigation || !panel.bindVirtualFocus) return false;
       var keyboard = field.getKeyboardNavigation();
       if (!keyboard || !keyboard.virtualFocus) return false;
       panel.bindVirtualFocus(keyboard.virtualFocus, true);
       return true;
     }
     function activateColorVirtualFocus(reason) {
       if (!panel || !panel.getVirtualFocusDomain) return false;
       var domain = panel.getVirtualFocusDomain();
       if (!domain) return false;
       return domain.activate('saturation', { source:'keyboard', reason:reason || 'color-picker', ensureVisible:true });
     }
     function handleColorKeydown(event) {
       if (!event || !field || !field.getState().open || !panel || !panel.handleKeydown) return false;
       var handled = panel.handleKeydown(event) === true;
       if (handled) activateColorVirtualFocus(event.key || 'color-keyboard');
       return handled;
     }

     var initialCanonical = null;
     if (initialRaw !== null && initialRaw !== undefined && initialRaw !== '') {
       initialCanonical = isGradient(initialRaw) ? normalizeGradient(initialRaw) : canonicalSolid(initialRaw);
       if (mode === 'gradient' && !isGradient(initialCanonical)) initialCanonical = seedGradient(initialCanonical);
     }

     field = PickerField.create({
       container: opts.container, headless: opts.headless === true, renderControl: opts.renderControl !== false, reference: opts.reference, triggerTarget: opts.triggerTarget, valueTarget: opts.valueTarget, draftValueTarget: opts.draftValueTarget, inputTarget: opts.inputTarget, formTarget: opts.formTarget, formField: opts.formField, committedValue: initialCanonical, serializeValue: fieldDisplay, elements: opts.elements, createDOM: opts.createDOM,
       document: opts.document, portalContainer: opts.portalContainer,
       className: 'qxframe9a7c2-color-picker', panelClass: 'qxframe9a7c2-color-picker-panel',
       size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: fieldPrefixContent(), suffix: fieldSuffixContent(), required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, editable: false,
       clearable: opts.clearable, placeholder: opts.placeholder, placement: opts.placement, trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay,
       closeOnOutsidePress: opts.closeOnOutsidePress !== false, closeOnEscape: opts.closeOnEscape !== false, focusScope: opts.needConfirm === true ? 'contain' : 'exit', destroyOnClose: opts.destroyOnClose !== false,
       beforeOpen: function (detail) { if (Utils.isFunction(opts.beforeOpen) && opts.beforeOpen(detail) === false) return false; return !destroyed && opts.disabled !== true; },
       beforeClose: function (detail) { var forcedDisabled = !!(detail && detail.forceClose === 'disabled'); var vetoed = Utils.isFunction(opts.beforeClose) && opts.beforeClose(detail) === false; if (destroyed) return false; if (vetoed && !forcedDisabled) return false; },
       onOpen: function (detail) { if (pickerSession) pickerSession.open(detail); if (panel && detail && (detail.source === 'keyboard' || /keyboard/i.test(String(detail.reason || '')))) activateColorVirtualFocus('color-picker-open'); },
       onClose: function (detail) { if (pickerSession) pickerSession.close(detail); },
       onOpenChange: emitOpen,
       onKeydown: handleColorKeydown,
       onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
     });
  instance.adoptPickerField(field);

     if (opts.renderControl !== false && opts.headless !== true) { var fieldRoot = field.getRootElement(); fieldRoot.classList.toggle('is-swatch-only', opts.swatchOnly === true); fieldRoot.classList.toggle('is-swatch-start', String(opts.indicatorPlacement || 'start') === 'start'); fieldRoot.classList.toggle('is-swatch-end', String(opts.indicatorPlacement || 'start') === 'end'); }
     modeHost = doc.createElement('div');
     modeHost.className = 'qxframe9a7c2-color-picker-mode';
     solidModeButton = doc.createElement('button');
     solidModeButton.type = 'button'; solidModeButton.tabIndex = 0; solidModeButton.className = 'qxframe9a7c2-color-picker-mode-button'; solidModeButton.textContent = '纯色'; solidModeButton.title = '使用纯色'; DOM.setPrivate(solidModeButton, 'colorMode', 'solid');
     gradientModeButton = doc.createElement('button');
     gradientModeButton.type = 'button'; gradientModeButton.tabIndex = 0; gradientModeButton.className = 'qxframe9a7c2-color-picker-mode-button'; gradientModeButton.textContent = '渐变'; gradientModeButton.title = '创建多色渐变'; DOM.setPrivate(gradientModeButton, 'colorMode', 'gradient');
     modeHost.appendChild(solidModeButton); modeHost.appendChild(gradientModeButton);

     gradientHost = doc.createElement('div');
     gradientHost.className = 'qxframe9a7c2-color-picker-gradient';
     gradientHint = doc.createElement('div');
     gradientHint.className = 'qxframe9a7c2-color-picker-gradient-hint';
     gradientHint.textContent = 'Gradient stops · click the bar to add a color, drag a dot to reposition it, then edit the selected color below.';
     gradientTrack = doc.createElement('div');
     gradientTrack.className = 'qxframe9a7c2-color-picker-gradient-track';
     gradientStops = doc.createElement('div');
     gradientStops.className = 'qxframe9a7c2-color-picker-gradient-stops';
     gradientAngleInput = doc.createElement('input');
     gradientAngleInput.type = 'number'; gradientAngleInput.tabIndex = 0; gradientAngleInput.min = '0'; gradientAngleInput.max = '360'; gradientAngleInput.step = '1';
     gradientAngleInput.className = 'qxframe9a7c2-color-picker-gradient-angle';
  gradientAngleInput.title = 'Gradient angle (degrees)';
     gradientAddButton = doc.createElement('button');
     gradientAddButton.type = 'button'; gradientAddButton.tabIndex = 0; gradientAddButton.className = 'qxframe9a7c2-color-picker-gradient-add';
  gradientAddButton.title = 'Add gradient stop'; var gradientAddGlyph = doc.createElement('span'); gradientAddGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-plus is-line is-round is-stroke-3'; gradientAddButton.appendChild(gradientAddGlyph);
     gradientRemoveButton = doc.createElement('button');
     gradientRemoveButton.type = 'button'; gradientRemoveButton.tabIndex = 0; gradientRemoveButton.className = 'qxframe9a7c2-color-picker-gradient-remove';
  gradientRemoveButton.title = 'Remove selected gradient stop'; var gradientRemoveGlyph = doc.createElement('span'); gradientRemoveGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-minus is-line is-round is-stroke-3'; gradientRemoveButton.appendChild(gradientRemoveGlyph);
     gradientHost.appendChild(gradientHint); gradientHost.appendChild(gradientTrack); gradientTrack.appendChild(gradientStops); gradientHost.appendChild(gradientAngleInput); gradientHost.appendChild(gradientAddButton); gradientHost.appendChild(gradientRemoveButton);

     panel = ColorPanel.create({
       container: field.getPanelHost(),
       value: isGradient(initialRaw) && initialRaw.stops[0] ? initialRaw.stops[0].color : (initialRaw || '#1677FF'),
       format: opts.format,
       showAlpha: opts.showAlpha !== false,
       presets: Array.isArray(opts.presets) ? opts.presets.slice() : [],
       disabled: opts.disabled === true,
       readOnly: opts.readOnly === true,
       keyboard: opts.keyboard !== false,
       eyeDropper: opts.eyeDropper !== false,
       onEscape: function (event) { if (field && field.getState().open) field.close('escape', event); },
       onInvalid: function (value, detail) { if (Utils.isFunction(opts.onInvalid)) opts.onInvalid(value, Utils.mergeOwn( detail, { colorPicker: api })); },
       onError: function (error, detail) { if (Utils.isFunction(opts.onError)) opts.onError(error, Utils.mergeOwn( detail, { colorPicker: api })); },
       onFormatChange: function (format, detail) {
         if (api) api.setFormat(format); else opts.format = format;
         var payload = Utils.mergeOwn( detail, { format: format, colorPicker: api });
         if (Utils.isFunction(opts.onFormatChange)) opts.onFormatChange(format, payload);
         emitter.emit('formatChange', payload);
       },
       onChange: function (value, detail) {
         if (!draft) return;
         var next;
         if (mode === 'gradient') {
           next = cloneGradient(isGradient(draft.draftValue) ? draft.draftValue : (isGradient(draft.value) ? draft.value : seedGradient(value)));
           activeStopIndex = Math.max(0, Math.min(next.stops.length - 1, activeStopIndex));
           next.stops[activeStopIndex].color = value;
         } else next = value;
         // ColorPanel emits live preview changes with complete:false and exactly one completed
         // change at the end of the keyboard/pointer interaction. Keep the hot path in draft
         // projection; only the completed interaction may advance the committed value.
         draft.setDraft(next, { source: detail.source, reason: detail.reason || 'panel-change' });
         var payload = { value: cloneModel(next), color: value, activeStopIndex: mode === 'gradient' ? activeStopIndex : null, rgba: detail.rgba, hsv: detail.hsv, source: detail.source, reason: detail.reason, complete: detail.complete === true, colorPicker: api };
         if (Utils.isFunction(opts.onInput)) opts.onInput(cloneModel(next), payload);
         emitter.emit('input', payload);
         if (opts.needConfirm !== true && detail.complete === true) draft.commit({ source: detail.source, reason: 'panel-commit' });
       },
       onChangeComplete: function (value, detail) {
         if (!draft) return;
         emitInteractionComplete(draft.draftValue, detail || { source: 'panel', reason: 'panel-complete' });
       }
     });

     bindColorVirtualFocus();

     draft = StateController.create({
       value: initialCanonical,
       normalizeValue: function (value) {
         var normalized = normalizeModel(value);
         if (normalized === undefined) throw new TypeError('[QXFRAME9A7C2] ColorPicker value is invalid for the current color model.');
         return cloneModel(normalized);
       },
       copyValue: cloneModel,
       equals: modelEquals,
       onValueChange: function (value, detail) { syncField(false, { source: detail.source || 'value-draft', reason: detail.reason || 'value-change' }); if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(cloneModel(value), Utils.mergeOwn( detail, { value: cloneModel(value), previousValue: cloneModel(detail.previousValue), mode: mode, colorPicker: api })); if (detail.silent !== true) { var payload = { value: cloneModel(value), previousValue: cloneModel(detail.previousValue), mode: mode, reason: detail.reason, source: detail.source || 'api', colorPicker: api }; if (Utils.isFunction(opts.onChange)) opts.onChange(cloneModel(value), payload); emitter.emit('change', payload); } },
       onDraftChange: function (value, detail) { if (!(detail && detail.valueChanged === true && opts.needConfirm !== true)) syncField(field && field.getState().open && opts.needConfirm === true); if (Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(cloneModel(value), Utils.mergeOwn( detail, { value: cloneModel(draft.value), draftValue: cloneModel(value), mode: mode, colorPicker: api })); }
     });

     var pickerSession = instance.setupPickerSession({
       controller: draft,
       rollbackDirtyOnClose: true,
       canCommit: function () { return !destroyed; },
       onOpenDraft: function (controller) { syncPanelFromModel(controller.draftValue || seedValue(), 'open-sync'); syncField(true); },
       onCommit: function () { syncField(false); },
       onCancel: function (_controller, detail) { syncPanelFromModel(draft.value || seedValue(), detail && detail.source === 'popup' ? 'close-restore' : 'cancel-sync'); syncField(false); },
       onCloseDraft: function (_controller, detail) { if (!detail.rolledBack) syncField(false); }
     });
     function commit(meta) { return instance.commit(meta || {}); }
     function cancel(meta) { return instance.cancel(meta || {}); }
     function clear(meta) {
       if (destroyed || InteractionPolicy.mutationLocked(opts)) return false;
       var changed = !!draft.value;
       draft.setValue(null, Object.assign({ source: 'api', reason: 'clear' }, meta || {}));
       syncField(false);
       var payload = { value: null, reason: meta && meta.reason || 'clear', colorPicker: api };
       if (Utils.isFunction(opts.onClear)) opts.onClear(payload);
       emitter.emit('clear', payload);
       return changed;
     }
     function setValue(value, meta) {
       if (destroyed) return false;
       if (isGradient(value) && !gradientEnabled) throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient support is disabled; enable it before setting a gradient value.');
       if (isGradient(value) && mode !== 'gradient') mode = 'gradient';
       else if (!isGradient(value) && value !== null && value !== undefined && value !== '' && mode !== 'solid' && !(meta && meta.preserveMode)) mode = 'solid';
       opts.mode = mode;
       var canonical = normalizeModel(value);
       if (canonical === undefined) return false;
       var result = draft.setValue(canonical, Object.assign({ source: 'api', reason: 'set-value' }, meta || {}));
       syncPanelFromModel(canonical || seedValue(), 'set-value-sync');
       syncField(false); return result;
     }
     function setPickerValue(value, meta) {
       if (destroyed) return false;
       if (isGradient(value) && !gradientEnabled) throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient support is disabled; enable it before setting a gradient value.');
       var canonical = normalizeModel(value);
       if (canonical === undefined) return false;
       var result = draft.setDraft(canonical, Object.assign({ source: 'api', reason: 'set-picker-value' }, meta || {}));
       syncPanelFromModel(canonical || seedValue(), 'picker-sync');
       syncField(true); return result;
     }
     function setAlpha(value, meta) {
       if (destroyed) return false;
       panel.setAlpha(value, { silent: true, source: 'api', reason: 'alpha' });
       var color = panel.getState().value;
       var next;
       if (mode === 'gradient') {
         next = cloneGradient(isGradient(draft.draftValue) ? draft.draftValue : (isGradient(draft.value) ? draft.value : seedGradient(color)));
         activeStopIndex = Math.max(0, Math.min(next.stops.length - 1, activeStopIndex));
         next.stops[activeStopIndex].color = color;
       } else next = color;
       draft.setDraft(next, Object.assign({ source: 'api', reason: 'alpha' }, meta || {}));
       if (opts.needConfirm !== true) draft.commit(Object.assign({ source: 'api', reason: 'alpha-commit' }, meta || {}));
       syncField(opts.needConfirm === true && field.getState().open); return true;
     }
     function canonicalizeModelForFormat(value) {
       if (!value) return null;
       if (!isGradient(value)) return canonicalSolid(value);
       var next = cloneGradient(value);
       next.stops.forEach(function (stop) { stop.color = canonicalSolid(stop.color); });
       return next;
     }
     function setFormat(value) {
       if (destroyed) return api;
       var committedBefore = cloneModel(draft.value), draftBefore = cloneModel(draft.draftValue);
       var nextFormat = String(value || 'hex').toLowerCase();
       panel.setFormat(nextFormat); opts.format = nextFormat;
       var committedAfter = canonicalizeModelForFormat(committedBefore);
       var draftAfter = canonicalizeModelForFormat(draftBefore);
       draft.setValue(committedAfter, { source: 'format', reason: 'format-value' });
       draft.setDraft(draftAfter, { silent: true, source: 'format', reason: 'format-draft' });
       syncPanelFromModel(draftAfter || committedAfter || seedValue(), 'format-panel');
       syncField(field.getState().open && opts.needConfirm === true); return api;
     }
     function setMode(value, meta) {
       var nextMode = normalizeMode(value);
       if (destroyed || nextMode === mode) return api;
       if (nextMode === 'gradient' && !gradientEnabled) throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient support is disabled; pass gradient:true before switching to gradient mode.');
       var current = cloneModel(draft.value || seedValue());
       var converted;
       if (nextMode === 'gradient') converted = isGradient(current) ? current : seedGradient(current || seedSolid());
       else converted = isGradient(current) ? (activeColor(current) || seedSolid()) : current;
       mode = nextMode; opts.mode = nextMode; activeStopIndex = 0;
       draft.setValue(converted, Object.assign({ silent: true, source: 'api', reason: 'mode-change' }, meta || {}));
       draft.setDraft(converted, { silent: true, source: 'api', reason: 'mode-draft' });
       syncPanelFromModel(converted, 'mode-sync'); syncField(false); return api;
     }
     function currentGradient(preferDraft) {
       var value = visualValue(preferDraft === true || (field && field.getState().open && opts.needConfirm === true));
       return isGradient(value) ? cloneGradient(value) : seedGradient(value || seedSolid());
     }
     function applyGradient(next, meta) {
       if (!gradientEnabled) return false;
       if (mode !== 'gradient') setMode('gradient', { silent: true });
       var detail = Object.assign({ source: 'api', reason: 'gradient-change' }, meta || {});
       draft.setDraft(next, detail);
       syncPanelFromModel(next, 'gradient-sync');
       if (detail.preview === true) {
         var previewPayload = { value: cloneModel(next), color: activeColor(next), activeStopIndex: activeStopIndex, source: detail.source, reason: detail.reason, complete: false, colorPicker: api };
         if (Utils.isFunction(opts.onInput)) opts.onInput(cloneModel(next), previewPayload);
         emitter.emit('input', previewPayload);
       } else if (opts.needConfirm !== true) draft.commit(Utils.mergeOwn( detail, { reason: detail.reason || 'gradient-commit' }));
       syncField(opts.needConfirm === true && field.getState().open);
       if (detail.complete === true) emitInteractionComplete(next, detail);
       return true;
     }
     function setActiveStop(index) {
       if (mode !== 'gradient' || destroyed) return false;
       var value = currentGradient();
       var next = Number(index);
       if (!Number.isInteger(next) || next < 0 || next >= value.stops.length) throw new RangeError('[QXFRAME9A7C2] ColorPicker gradient stop index is out of range.');
       activeStopIndex = next; syncPanelFromModel(value, 'gradient-stop'); renderGradientEditor(value); return true;
     }
     function setGradientAngle(angle, meta) {
       if (destroyed || !gradientEnabled) return false;
       var next = currentGradient(); next.angle = Number(angle);
       if (!Number.isFinite(next.angle)) return false;
       return applyGradient(next, Object.assign({ reason: 'gradient-angle' }, meta || {}));
     }
     function setGradientStop(index, color, offset, meta) {
       if (destroyed || !gradientEnabled) return false;
       var next = currentGradient();
       var position = Number(index);
       if (!Number.isInteger(position) || position < 0 || position >= next.stops.length) return false;
       var canonical = canonicalSolid(color);
       if (!canonical) return false;
       next.stops[position].color = canonical;
       if (offset !== undefined) next.stops[position].offset = clamp(offset, 0, 1);
       next.stops.sort(function (a, b) { return a.offset - b.offset; });
       activeStopIndex = next.stops.findIndex(function (stop) { return stop.color === canonical && (offset === undefined || Math.abs(stop.offset - clamp(offset, 0, 1)) < 1e-9); });
       if (activeStopIndex < 0) activeStopIndex = 0;
       return applyGradient(next, Object.assign({ reason: 'gradient-stop' }, meta || {}));
     }
     function addGradientStop(offset, color, meta) {
       if (destroyed || !gradientEnabled) return false;
       var next = currentGradient();
       var base = color || activeColor(next) || seedSolid();
       var canonical = canonicalSolid(base); if (!canonical) return false;
       next.stops.push({ offset: clamp(offset === undefined ? 0.5 : offset, 0, 1), color: canonical });
       next.stops.sort(function (a, b) { return a.offset - b.offset; });
       activeStopIndex = next.stops.findIndex(function (stop) { return stop.color === canonical && Math.abs(stop.offset - clamp(offset === undefined ? 0.5 : offset, 0, 1)) < 1e-9; });
       return applyGradient(next, Object.assign({ reason: 'gradient-add-stop' }, meta || {}));
     }
     function removeGradientStop(index, meta) {
       if (destroyed || !gradientEnabled) return false;
       var next = currentGradient();
       if (next.stops.length <= 2) return false;
       var position = Number(index);
       if (!Number.isInteger(position) || position < 0 || position >= next.stops.length) return false;
       next.stops.splice(position, 1); activeStopIndex = Math.max(0, Math.min(next.stops.length - 1, activeStopIndex));
       return applyGradient(next, Object.assign({ reason: 'gradient-remove-stop' }, meta || {}));
     }

     function stopOffsetFromPointer(event) {
       var rect = gradientTrack.getBoundingClientRect();
       if (!rect.width) return 0.5;
       return clamp((Number(event.clientX) - rect.left) / rect.width, 0, 1);
     }
     function createGradientDragSession() {
       return PointerSession.create({
         target: gradientHost,
         document: doc,
         axis: 'x',
         threshold: 0,
         getState: function () { return { disabled: opts.disabled === true, readOnly: opts.readOnly === true }; },
         canStart: function (detail) {
           if (InteractionPolicy.mutationLocked(opts)) return false;
           var event = detail.originalEvent;
           var stopNode = event && event.target ? DOM.closestPrivate(event.target, gradientHost, 'gradientStop') : null;
           if (!stopNode || !gradientHost.contains(stopNode)) return false;
           gradientDragIndex = Number(DOM.getPrivate(stopNode, 'gradientStop'));
           if (!Number.isInteger(gradientDragIndex) || gradientDragIndex < 0) return false;
           setActiveStop(gradientDragIndex);
           gradientDragSnapshot = currentGradient(true);
           if (event.preventDefault) event.preventDefault();
           return true;
         },
         onMove: function (detail) {
           var gradient = currentGradient(true);
           if (!gradient.stops[gradientDragIndex]) return;
           var offset = stopOffsetFromPointer(detail.originalEvent);
           gradient.stops[gradientDragIndex].offset = offset;
           var tracked = gradient.stops[gradientDragIndex];
           gradient.stops.sort(function (a, b) { return a.offset - b.offset; });
           activeStopIndex = gradient.stops.indexOf(tracked);
           gradientDragIndex = activeStopIndex;
           applyGradient(gradient, { source: 'pointer', reason: 'gradient-stop-drag', originalEvent: detail.originalEvent, preview: true });
         },
         onEnd: function (detail) {
           var finalGradient = currentGradient(true);
           applyGradient(finalGradient, { source: 'pointer', reason: 'gradient-stop-drag-complete', originalEvent: detail.originalEvent || null, complete: true });
           gradientDragSnapshot = null;
           gradientDragIndex = -1;
         },
         onCancel: function (detail) {
           if (gradientDragSnapshot) {
             draft.setDraft(gradientDragSnapshot, { silent: true, source: 'pointer', reason: 'gradient-stop-drag-cancel' });
             syncPanelFromModel(gradientDragSnapshot, 'gradient-drag-cancel');
             syncField(opts.needConfirm === true && field.getState().open);
             renderGradientEditor(gradientDragSnapshot);
             emitInteractionComplete(draft.draftValue, { source: 'pointer', reason: 'gradient-stop-drag-cancel', originalEvent: detail.originalEvent || null, cancelled: true, rolledBack: true });
           }
           gradientDragSnapshot = null;
           gradientDragIndex = -1;
         }
       });
     }
     gradientClickHandler = function (event) {
       if (InteractionPolicy.mutationLocked(opts)) return;
       var modeTarget = event.target ? DOM.closestPrivate(event.target, modeHost, 'colorMode') : null;
       if (modeTarget && modeHost.contains(modeTarget)) { setMode(DOM.getPrivate(modeTarget, 'colorMode'), { source: DOM.activationSource(event), reason: 'mode-button', originalEvent: event }); return; }
       var target = event.target;
       if (target === gradientAddButton || gradientAddButton.contains(target)) { addGradientStop(0.5, null, { source: DOM.activationSource(event), originalEvent: event, complete: true }); return; }
       if (target === gradientRemoveButton || gradientRemoveButton.contains(target)) { removeGradientStop(activeStopIndex, { source: DOM.activationSource(event), originalEvent: event, complete: true }); return; }
       var stop = target ? DOM.closestPrivate(target, gradientHost, 'gradientStop') : null;
       if (stop && gradientHost.contains(stop)) { setActiveStop(Number(DOM.getPrivate(stop, 'gradientStop'))); return; }
       if (target === gradientTrack || target === gradientStops) addGradientStop(stopOffsetFromPointer(event), null, { source: 'pointer', reason: 'gradient-track-add', originalEvent: event, complete: true });
     };
     gradientInputHandler = function (event) {
       if (event.target === gradientAngleInput) setGradientAngle(Number(gradientAngleInput.value), { source: 'input', originalEvent: event, complete: true });
     };
     gradientListenerCleanups.push(DOM.listen(modeHost, 'click', gradientClickHandler));
     gradientListenerCleanups.push(DOM.listen(gradientHost, 'click', gradientClickHandler));
     gradientDragSession = createGradientDragSession();
     gradientListenerCleanups.push(DOM.listen(gradientHost, 'change', gradientInputHandler));

     function renderGradientEditor(value) {
       if (!gradientHost) return;
       var panelHost = field.getPanelHost();
       var colorPanelRoot = panel && panel.getRootElement ? panel.getRootElement() : null;
       if (gradientEnabled && mode === 'gradient') { if (gradientHost.parentNode !== panelHost || gradientHost.nextSibling !== colorPanelRoot) panelHost.insertBefore(gradientHost, colorPanelRoot); }
       else if (gradientHost.parentNode) gradientHost.parentNode.removeChild(gradientHost);
       if (gradientEnabled) {
         var modeBefore = gradientHost.parentNode === panelHost ? gradientHost : colorPanelRoot;
         if (modeHost.parentNode !== panelHost || modeHost.nextSibling !== modeBefore) panelHost.insertBefore(modeHost, modeBefore);
       } else if (modeHost.parentNode) modeHost.parentNode.removeChild(modeHost);
       if (solidModeButton && gradientModeButton) {
         solidModeButton.classList.toggle('is-active', mode === 'solid'); gradientModeButton.classList.toggle('is-active', mode === 'gradient');

         solidModeButton.disabled = InteractionPolicy.mutationLocked(opts); gradientModeButton.disabled = InteractionPolicy.mutationLocked(opts);
       }
       if (!gradientEnabled || mode !== 'gradient') return;
       var gradient = isGradient(value) ? cloneGradient(value) : currentGradient();
       activeStopIndex = Math.max(0, Math.min(gradient.stops.length - 1, activeStopIndex));
       gradientTrack.style.background = gradientCSS(gradient);
       gradientAngleInput.value = String(Number(gradient.angle));
       gradientAngleInput.disabled = InteractionPolicy.mutationLocked(opts);
       gradientAddButton.disabled = InteractionPolicy.mutationLocked(opts);
       gradientRemoveButton.disabled = InteractionPolicy.mutationLocked(opts) || gradient.stops.length <= 2;
       var structureKey = gradient.stops.map(function (stop) { return String(Math.round(clamp(stop.offset, 0, 1) * 100000) / 100000); }).join('|');
       var reuseStops = gradientStopStructureKey === structureKey && gradientStops.children.length === gradient.stops.length;
       if (!reuseStops) {
         gradientStops.textContent = '';
         gradient.stops.forEach(function () {
           var button = doc.createElement('button');
           button.type = 'button'; button.tabIndex = -1; button.className = 'qxframe9a7c2-color-picker-gradient-stop';
           gradientStops.appendChild(button);
         });
         gradientStopStructureKey = structureKey;
       }
       gradient.stops.forEach(function (stop, index) {
         var button = gradientStops.children[index];
         DOM.setPrivate(button, 'gradientStop', String(index));
         button.title = 'Stop ' + (index + 1) + ' · ' + Math.round(clamp(stop.offset, 0, 1) * 100) + '%';
         button.style.setProperty('--qxframe9a7c2-gradient-stop-offset', String(clamp(stop.offset, 0, 1) * 100) + '%');
         button.style.background = String(stop.color);
         button.disabled = InteractionPolicy.mutationLocked(opts);
         button.classList.toggle('is-active', index === activeStopIndex);
         button.tabIndex = !button.disabled && index === activeStopIndex ? 0 : -1;
       });
     }

     function rebuildFooter() {
       instance.createConfirmFooter({
         footer: opts.footer, needConfirm: opts.needConfirm, showCancel: opts.showCancel,
         startContent: opts.footerStart, endContent: opts.footerEnd,
         cancelLabel: opts.cancelText, confirmLabel: opts.confirmText, confirmDisabled: opts.confirmDisabled === true
       });
     }
     rebuildFooter(); syncPanelFromModel(draft.value || seedValue(), 'init'); syncField(false);

     function applyOptions(nextOptions) {
       if (destroyed) return api;
       var next = nextOptions || {};
            OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless'], 'ColorPicker field binding');
       if (own(next, 'indicatorPlacement') && ['start','end'].indexOf(String(next.indicatorPlacement)) < 0) throw new TypeError('[QXFRAME9A7C2] ColorPicker indicatorPlacement must be start or end.');
       if (own(next, 'gradient') && typeof next.gradient !== 'boolean') throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient must be boolean.');
       var nextMode = own(next, 'mode') ? normalizeMode(next.mode) : mode;
       var nextGradientEnabled = own(next, 'gradient') ? next.gradient === true : gradientEnabled;
       if (own(next, 'mode') && nextMode === 'gradient') nextGradientEnabled = true;
       if (!nextGradientEnabled && nextMode === 'gradient') nextMode = 'solid';
       Object.keys(next).forEach(function (key) { opts[key] = next[key]; });
       gradientEnabled = nextGradientEnabled;
       opts.gradient = gradientEnabled;
       field.updateOptions({ size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: fieldPrefixContent(), suffix: fieldSuffixContent(), required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, clearable: opts.clearable, placeholder: opts.placeholder, placement: opts.placement, trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay, focusScope: opts.needConfirm === true ? 'contain' : 'exit', destroyOnClose: opts.destroyOnClose !== false });
       if (opts.renderControl !== false && opts.headless !== true) { var fieldRoot = field.getRootElement(); fieldRoot.classList.toggle('is-swatch-only', opts.swatchOnly === true); fieldRoot.classList.toggle('is-swatch-start', String(opts.indicatorPlacement || 'start') === 'start'); fieldRoot.classList.toggle('is-swatch-end', String(opts.indicatorPlacement || 'start') === 'end'); }
       panel.updateOptions({ format: opts.format, showAlpha: opts.showAlpha !== false, presets: Array.isArray(opts.presets) ? opts.presets.slice() : [], disabled: opts.disabled === true, readOnly: opts.readOnly === true, keyboard: opts.keyboard !== false, eyeDropper: opts.eyeDropper !== false });
       if (nextMode !== mode) setMode(nextMode, { silent: true, source: 'options' });
       if (own(next, 'value')) setValue(next.value, { silent: true, source: 'options', reason: 'controlled', preserveMode: own(next, 'mode') });
       if (own(next, 'format')) setFormat(opts.format);
       rebuildFooter(); syncField(field.getState().open && opts.needConfirm === true); renderGradientEditor(visualValue(field.getState().open && opts.needConfirm === true));
       if (own(next, 'open')) field.setOpen(next.open === true, 'update-options');
       return api;
     }
     function getState() {
       return Object.freeze({
         open: field.getState().open,
         headless: opts.headless === true,
         mode: mode,
         gradient: gradientEnabled,
         value: cloneModel(draft.value),
         draftValue: cloneModel(draft.draftValue),
         dirty: draft.dirty,
         activeStopIndex: mode === 'gradient' ? activeStopIndex : null,
         format: String(opts.format || 'hex'),
         showAlpha: opts.showAlpha !== false,
         disabled: opts.disabled === true,
         readOnly: opts.readOnly === true,
         needConfirm: opts.needConfirm === true,
         destroyed: destroyed
       });
     }
     function disposeRuntime(reason) {
       if (destroyed) return false;
       destroyed = true;
       gradientListenerCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
       if (gradientDragSession) gradientDragSession.destroy(); gradientDragSession = null;
       gradientDragSnapshot = null; gradientDragIndex = -1;
       if (field) field.destroy(reason || 'color-picker-destroy');
       if (panel) panel.destroy(reason || 'color-picker-destroy');
       if (draft) draft.destroy();
       panel = field = draft = modeHost = solidModeButton = gradientModeButton = gradientHost = gradientTrack = gradientStops = gradientAngleInput = gradientAddButton = gradientRemoveButton = gradientHint = null;
       gradientClickHandler = gradientInputHandler = gradientPointerHandler = null;
       return true;
     }

   
     var formControl = field && field.getControl ? field.getControl() : null;
     if (formControl && formControl.onFormReset) formControl.onFormReset(function () {
       draft.reset({ silent: true, source: 'form', reason: 'reset' });
       syncPanelFromModel(draft.value || seedValue(), 'form-reset');
       syncField(false);
     });
     if (opts.open === true) field.open('initial');
     return Object.freeze({ root:field.getRootElement(), panel:field.getPanelElement(), field:field, colorPanel:panel, gradientElement:gradientHost, clear:clear, setValue:setValue, setPickerValue:setPickerValue, setAlpha:setAlpha, setFormat:setFormat, setMode:setMode, setActiveStop:setActiveStop, setGradientAngle:setGradientAngle, setGradientStop:setGradientStop, addGradientStop:addGradientStop, removeGradientStop:removeGradientStop, applyOptions:applyOptions, getState:getState, dispose:disposeRuntime });
}


export class ColorPicker extends PickerComponent {
  static contract = getContract('ColorPicker');
  static options = COLOR_PICKER_DEFAULTS;
  static immutableOptions = COLOR_PICKER_IMMUTABLE;
  static create(source, overrides) { return new this(source, overrides).render(); }
  static enhance(input, options) { return this.create(input, options || {}); }
  static gradientCSS(value) { return gradientCSS(value); }

  constructor(source = {}, overrides) {
    const fieldInit = Control.resolveFieldOptions(source, overrides);
    const incoming = fieldInit.options;
    if (fieldInit.formField && !own(incoming, 'value') && !own(incoming, 'defaultValue')) incoming.value = fieldInit.nativeValue;
    const mode = own(incoming, 'mode') ? normalizeMode(incoming.mode) : 'solid';
    if (own(incoming, 'gradient') && typeof incoming.gradient !== 'boolean') throw new TypeError('[QXFRAME9A7C2] ColorPicker gradient must be boolean.');
    if (!own(incoming, 'mode')) incoming.mode = mode;
    if (incoming.gradient === true || mode === 'gradient') incoming.gradient = true;
    super(incoming);
    runtimeState.set(this, { fieldInit, runtime:null });
  }

  [componentHooks.render]() {
    const record = runtimeState.get(this);
    if (record.runtime) return record.runtime.root;
    const runtime = setupColorPickerRuntime(this, record.fieldInit);
    record.runtime = runtime;
    this.own(() => runtime.dispose('color-picker-destroy'));
    this.setFieldValue(runtime.getState().value, { silent:true, force:true });
    return runtime.root;
  }

  [pickerHooks.optionsUpdated](next, previous, patch) { const r=runtimeState.get(this).runtime; if (r) r.applyOptions(patch); }
  [pickerHooks.clear](meta) { const r=runtimeState.get(this).runtime; return r ? r.clear(meta) : false; }
  setValue(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setValue(value, meta) : false; }
  setPickerValue(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setPickerValue(value, meta) : false; }
  setAlpha(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setAlpha(value, meta) : false; }
  setFormat(value) { const r=runtimeState.get(this).runtime; return r ? r.setFormat(value) : false; }
  setMode(value, meta) { const r=runtimeState.get(this).runtime; return r ? r.setMode(value, meta) : false; }
  setActiveStop(index) { const r=runtimeState.get(this).runtime; return r ? r.setActiveStop(index) : false; }
  setGradientAngle(angle, meta) { const r=runtimeState.get(this).runtime; return r ? r.setGradientAngle(angle, meta) : false; }
  setGradientStop(index, color, offset, meta) { const r=runtimeState.get(this).runtime; return r ? r.setGradientStop(index, color, offset, meta) : false; }
  addGradientStop(offset, color, meta) { const r=runtimeState.get(this).runtime; return r ? r.addGradientStop(offset, color, meta) : false; }
  removeGradientStop(index, meta) { const r=runtimeState.get(this).runtime; return r ? r.removeGradientStop(index, meta) : false; }
  getState() { const r=runtimeState.get(this).runtime; return r ? r.getState() : Object.freeze({ open:false, destroyed:this.destroyed }); }
  getColorPanel() { const r=runtimeState.get(this).runtime; return r ? r.colorPanel : null; }
  getGradientElement() { const r=runtimeState.get(this).runtime; return r ? r.gradientElement : null; }
}
