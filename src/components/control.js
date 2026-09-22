// Canonical ESM Control building block. Tags is a direct static ESM dependency.
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { Config } from '../core/config.js';
import { Renderer } from '../core/renderer.js';
import { FormBridge } from '../core/formBridge.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { InteractionModality } from '../core/interactionModality.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ClearAction } from '../core/clearAction.js';
import { SegmentedInput } from '../core/segmentedInput.js';
import { TextInputBehavior } from '../core/textInputBehavior.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { SemanticStyles } from '../utils/semanticStyles.js';
import { IdManager } from '../utils/id.js';
import { Utils } from '../utils/utils.js';
import { mergeOptions } from '../core/options.js';
import { Tags } from './tags.js';

var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-input qxframe9a7c2-group-control" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
    <span class="qxframe9a7c2-input-values" data-qxframe9a7c2-ref="value-host"></span>
    <span class="qxframe9a7c2-input-segments" data-qxframe9a7c2-ref="segments"></span>
    <input class="qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
    <span class="qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix">
      <button class="qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button>
      <span class="qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span>
      <span class="qxframe9a7c2-input-loading is-hidden" hidden data-qxframe9a7c2-ref="loading"><span class="qxframe9a7c2-button-spinner"></span></span>
      <span class="qxframe9a7c2-input-count is-hidden" hidden data-qxframe9a7c2-ref="count"></span>
    </span>
  </div>`;
    
function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  instance.refs.control = instance.root;
  return { root: instance.root, refs: instance.refs };
}
    
const DOMFactory = Object.freeze({ createDefaultDOM: createDefaultDOM, blueprint: blueprint });

var SIZES = ['xs','sm','md','lg','xl'];
var STATUSES = ['default','error','warning'];
var VDOMNTS = ['outlined','filled','borderless','underlined'];
var CLEAR_VISIBILITY = ['always','interaction'];
var MODES = ['input','value','tags','segments'];
var EDITORS = ['input','textarea'];
var hasOwn = Utils.own;
function sizeName(value) { return Utils.normalizeSize(value, 'md'); }
function statusName(value) { var status = String(value || 'default').toLowerCase(); return STATUSES.indexOf(status) >= 0 ? status : 'default'; }
function variantName(value) { var variant = String(value || 'outlined').toLowerCase(); if (VDOMNTS.indexOf(variant) < 0) throw new TypeError('[QXFRAME9A7C2] Control variant must be outlined, filled, borderless, or underlined.'); return variant; }
function editorName(value) { var editor = String(value || 'input').toLowerCase(); if (EDITORS.indexOf(editor) < 0) throw new TypeError('[QXFRAME9A7C2] Control editor must be \"input\" or \"textarea\".'); return editor; }
function modeName(value) { var mode = String(value || 'input').toLowerCase(); if (MODES.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Control mode must be "input", "value", "tags", or "segments".'); return mode; }
function clearVisibilityName(value) { var mode = String(value || 'interaction').toLowerCase(); if (CLEAR_VISIBILITY.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Control clearVisibility must be "always" or "interaction".'); return mode; }
function isInteractiveTarget(node, root) { if (!node || node === root || !node.closest) return false; return !!node.closest('button,a,input,textarea,select,[contenteditable="true"],[tabindex]:not([tabindex="-1"])'); }
function renderContent(element, content) { if (!element) return; element.textContent = ''; if (content === undefined || content === null || content === false) return; Renderer.append(element, content); }
function setHiddenState(element, hidden) { if (!element) return; var value = hidden === true; element.hidden = value; if (element.classList) element.classList.toggle('is-hidden', value); }
function stringValue(value) { return value === undefined || value === null ? '' : String(value); }
function isElement(value) { return !!value && value.nodeType === 1; }
function isInputElement(value){var tag=isElement(value)?String(value.tagName||'').toLowerCase():'';return tag==='input'||tag==='textarea';}
function isFormFieldElement(value){return FormBridge.isFormField(value);}
function isValueElement(value) { var tag = isElement(value) ? String(value.tagName || '').toLowerCase() : ''; return tag === 'input' || tag === 'textarea' || tag === 'select'; }
function resolveElement(value, doc, label) {
  if (value === undefined || value === null || value === '') return null;
  return DOM.requireElement(value, doc, label);
}
function cloneCommitted(value) { return ValueEquality.copy(value); }
function sameCommitted(left, right) { return Array.isArray(left) || Array.isArray(right) ? ValueEquality.array(left, right) : ValueEquality.equals(left, right); }
function nativeAttribute(input, name) { return input && input.hasAttribute && input.hasAttribute(name) ? input.getAttribute(name) : undefined; }
function resolveFieldOptions(source, overrides) {
  var directElement = source && source.nodeType === 1 ? source : null;
  if (!directElement && typeof source === 'string') directElement = resolveElement(source, overrides && overrides.document || globalThis.document, 'source');
  var base = directElement ? {} : (source || {});
  var raw = mergeOptions(base, overrides || {});
  if (hasOwn(raw, 'nameInput')) throw new TypeError('[QXFRAME9A7C2] nameInput was removed; use formField.');
  var doc = raw.document || (directElement && directElement.ownerDocument) || globalThis.document;
  var target = resolveElement(raw.target || raw.container, doc, 'target');
  var formField = resolveElement(raw.formField, doc, 'formField');
  if (directElement) {
    if (isFormFieldElement(directElement)) {
      if (formField && formField !== directElement) throw new TypeError('[QXFRAME9A7C2] Direct form field source conflicts with options.formField.');
      formField = directElement;
    } else if (!target) target = directElement;
  }
  if (target && isFormFieldElement(target)) throw new TypeError('[QXFRAME9A7C2] target/container must be a non-field Element; use formField or pass the native field directly.');
  if (formField && !isFormFieldElement(formField)) throw new TypeError('[QXFRAME9A7C2] formField must resolve to an input, textarea, or select Element.');
  if (target && formField && target === formField) throw new TypeError('[QXFRAME9A7C2] target/container and formField must be different Elements.');
  var options = mergeOptions(raw, {});
  delete options.target;
  if (target) options.container = target; else if (!hasOwn(raw, 'container')) delete options.container;
  if (formField) options.formField = formField; else delete options.formField;
  var nativeValue;
  if (formField) {
    var adapter = FormBridge.createAdapter(formField);
    nativeValue = adapter.read();
    if (!hasOwn(options, 'name') && formField.name) options.name = formField.name;
    if (!hasOwn(options, 'disabled')) options.disabled = formField.disabled === true;
    if (!hasOwn(options, 'readOnly') && 'readOnly' in formField) options.readOnly = formField.readOnly === true;
    if (!hasOwn(options, 'required')) options.required = formField.required === true;
    if (!hasOwn(options, 'placeholder') && 'placeholder' in formField && formField.placeholder) options.placeholder = formField.placeholder;
    if (!hasOwn(options, 'autocomplete')) { var autocomplete = nativeAttribute(formField, 'autocomplete'); if (autocomplete !== undefined) options.autocomplete = autocomplete; }
    if (!hasOwn(options, 'inputMode')) { var inputMode = nativeAttribute(formField, 'inputmode'); if (inputMode !== undefined) options.inputMode = inputMode; }
    if (!hasOwn(options, 'minLength') && typeof formField.minLength === 'number' && formField.minLength >= 0) options.minLength = formField.minLength;
    if (!hasOwn(options, 'maxLength') && typeof formField.maxLength === 'number' && formField.maxLength >= 0) options.maxLength = formField.maxLength;
    if (!hasOwn(options, 'editor') && String(formField.tagName || '').toLowerCase() === 'textarea') options.editor = 'textarea';
  }
  return { options: options, target: target, formField: formField, document: doc, hasNativeValue: !!formField, nativeValue: nativeValue };
}
    
function snapshotFormField(input) {
  if (!input) return null;
  var attrs = Object.create(null);
  Array.prototype.forEach.call(input.attributes || [], function (attr) { attrs[attr.name] = attr.value; });
  return { attrs: attrs, value: input.value, disabled: input.disabled === true, readOnly: input.readOnly === true, required: input.required === true, parent: input.parentNode || null, nextSibling: input.nextSibling || null, form: input.form || null, generatedForm: null };
}
function moveFormFieldIntoRoot(input, root, snapshot) {
  if (!input || !root || input.parentNode === root) return;
  var originalForm = snapshot && snapshot.form || input.form || null;
  root.appendChild(input);
  if (originalForm && input.form !== originalForm) {
    if (!originalForm.id) {
      originalForm.id = IdManager.next('form');
      if (snapshot) snapshot.generatedForm = originalForm;
    }
    input.setAttribute('form', originalForm.id);
  }
}
function restoreFormField(input, snapshot) {
  if (!input || !snapshot) return;
  if (snapshot.parent) snapshot.parent.insertBefore(input, snapshot.nextSibling && snapshot.nextSibling.parentNode === snapshot.parent ? snapshot.nextSibling : null);
  Array.prototype.slice.call(input.attributes || []).forEach(function (attr) { if (!hasOwn(snapshot.attrs, attr.name)) input.removeAttribute(attr.name); });
  Object.keys(snapshot.attrs).forEach(function (name) { input.setAttribute(name, snapshot.attrs[name]); });
  input.value = snapshot.value; input.disabled = snapshot.disabled; input.readOnly = snapshot.readOnly; input.required = snapshot.required;
  if (snapshot.generatedForm && snapshot.generatedForm.id && snapshot.generatedForm.id.indexOf('qxframe9a7c2-form-') === 0) snapshot.generatedForm.removeAttribute('id');
}
var ROOT_LAYOUT_STYLES = Object.freeze({
  display:1,width:1,'min-width':1,'max-width':1,height:1,'min-height':1,'max-height':1,margin:1,'margin-top':1,'margin-right':1,'margin-bottom':1,'margin-left':1,
  flex:1,'flex-grow':1,'flex-shrink':1,'flex-basis':1,'align-self':1,'justify-self':1,'place-self':1,order:1,
  'grid-area':1,'grid-column':1,'grid-column-start':1,'grid-column-end':1,'grid-row':1,'grid-row-start':1,'grid-row-end':1,
  position:1,inset:1,top:1,right:1,bottom:1,left:1,'z-index':1,float:1,clear:1,'vertical-align':1
});
function placeFieldRoot(root, target, formField) {
  if (!root || root.parentNode || target) return root;
  if (!formField || !formField.parentNode) throw new TypeError('[QXFRAME9A7C2] A direct formField must be connected to a parent or paired with target/container.');
  formField.parentNode.insertBefore(root, formField);
  return root;
}
function projectFormFieldLayout(input, root) {
  if (!input || !root) return;
  Array.prototype.forEach.call(input.classList || [], function (name) { if (name) root.classList.add(name); });
  var style = input.style;
  if (!style) return;
  for (var i = 0; i < style.length; i += 1) {
    var prop = style[i];
    if (prop.indexOf('--') !== 0 && !ROOT_LAYOUT_STYLES[prop]) continue;
    var value = style.getPropertyValue(prop);
    if (prop === 'display' && String(value).trim().toLowerCase() === 'none') continue;
    root.style.setProperty(prop, value, style.getPropertyPriority(prop));
  }
}
    
function createFormFieldBridge(options) { return FormBridge.create(options || {}); }
    
function createProjection(options) {
  var opts = Object.assign({ disabled: false, readOnly: false, required: false, editable: false, draftVisual: false, mode: 'input', tags: [], displayValue: '', inputValue: '' }, options || {});
  opts.mode = modeName(opts.mode);
  var doc = opts.document || globalThis.document;
  var reference = resolveElement(opts.reference, doc, 'reference');
  var valueTarget = resolveElement(opts.valueTarget, doc, 'valueTarget');
  var inputTarget = resolveElement(opts.inputTarget, doc, 'inputTarget');
  var formTarget = resolveElement(opts.formTarget, doc, 'formTarget');
  if (!reference) throw new TypeError('[QXFRAME9A7C2] Control.createProjection requires reference as the popup/field anchor.');
  var scope = Lifecycle.createScope();
  var destroyed = false, focused = false, expanded = false;
  var displayValue = stringValue(opts.displayValue), inputValue = stringValue(opts.inputValue);
  var tags = Array.isArray(opts.tags) ? opts.tags.slice() : [];
  var committedValue = cloneCommitted(opts.committedValue);
  var resetListeners = [];
  var refDraftClassSnapshot = !!(reference.classList && reference.classList.contains('is-draft-value'));
  var valueSnapshot = valueTarget ? (isValueElement(valueTarget) ? { kind:'value', value:valueTarget.value } : { kind:'nodes', nodes:Array.prototype.map.call(valueTarget.childNodes || [], function (node) { return node.cloneNode(true); }) }) : null;
  var inputSnapshot = inputTarget ? { value: inputTarget.value, disabled: inputTarget.disabled === true, readOnly: inputTarget.readOnly === true, required: inputTarget.required === true, placeholder: inputTarget.getAttribute ? inputTarget.getAttribute('placeholder') : null } : null;
  var bridge = createFormFieldBridge({ document: doc, root: reference, target: formTarget || reference.parentNode || reference, formField: opts.formField || null, name: opts.name, value: committedValue, serializeValue: opts.serializeValue, disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true, moveIntoRoot:false, onNativeChange:function(value,detail){ if(typeof opts.onFormFieldChange==='function') opts.onFormFieldChange(value,detail,api); }, onReset: function (detail) { resetListeners.slice().forEach(function (listener) { listener(detail); }); } });
  var api = null;
    
  function tagText(tag) {
    if (tag === undefined || tag === null) return '';
    if (typeof tag === 'object') return stringValue(tag.label !== undefined ? tag.label : (tag.value !== undefined ? tag.value : tag.key));
    return stringValue(tag);
  }
  function effectiveDisplay() {
    if (displayValue !== '') return displayValue;
    if (String(opts.mode || 'input') === 'tags' && tags.length) return tags.map(tagText).join(opts.tagSeparator === undefined ? ', ' : String(opts.tagSeparator));
    return '';
  }
  function writeTarget(target, value, context) {
    if (!target) return;
    if (isValueElement(target)) target.value = stringValue(value);
    else renderContent(target, stringValue(value));
  }
  function sync() {
    if (destroyed) return;
    var display = effectiveDisplay();
    if (valueTarget) writeTarget(valueTarget, display, { kind: 'display' });
    if (inputTarget) {
      var inputDisplay = expanded && opts.editable === true ? inputValue : (inputTarget === valueTarget ? (inputValue !== '' && opts.editable === true ? inputValue : display) : inputValue);
      if (inputTarget !== valueTarget || isValueElement(inputTarget)) inputTarget.value = stringValue(inputDisplay);
      inputTarget.disabled = opts.disabled === true;
      if ('readOnly' in inputTarget) inputTarget.readOnly = opts.readOnly === true || opts.editable !== true;
      if ('required' in inputTarget) inputTarget.required = opts.required === true;
      if (inputTarget.setAttribute) {
        if (opts.placeholder !== undefined && opts.placeholder !== null) inputTarget.setAttribute('placeholder', String(opts.placeholder || ''));
      }
    }
    if (reference && reference.classList) reference.classList.toggle('is-draft-value', opts.draftVisual === true);
    bridge.updateOptions({ name: opts.name, serializeValue: opts.serializeValue, disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true });
  }
  function setDisplayValue(value) { displayValue = stringValue(value); sync(); return api; }
  function setInputValue(value) { inputValue = stringValue(value); sync(); return api; }
  function setTags(value) { tags = Array.isArray(value) ? value.slice() : []; sync(); return api; }
  function setCommittedValue(value, meta) { committedValue = cloneCommitted(value); bridge.setValue(committedValue, meta || { silent:true, source:'projection', reason:'projection' }); sync(); return api; }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    ['reference','valueTarget','inputTarget','formField','formTarget','document'].forEach(function (name) { if (hasOwn(next, name)) throw new Error('[QXFRAME9A7C2] Control projection structural option "' + name + '" is immutable; destroy and recreate.'); });
    if (hasOwn(next, 'mode')) next.mode = modeName(next.mode);
    Object.keys(next).forEach(function (key) { opts[key] = next[key]; });
    if (hasOwn(next, 'displayValue')) displayValue = stringValue(next.displayValue);
    if (hasOwn(next, 'inputValue')) inputValue = stringValue(next.inputValue);
    if (hasOwn(next, 'tags')) tags = Array.isArray(next.tags) ? next.tags.slice() : [];
    if (hasOwn(next, 'committedValue')) { committedValue = cloneCommitted(next.committedValue); bridge.setValue(committedValue, { silent:true, source:'options', reason:'projection-options' }); }
    sync(); return api;
  }
  function restore() {
    if (valueTarget && valueSnapshot) {
      if (valueSnapshot.kind === 'value') valueTarget.value = valueSnapshot.value;
      else { valueTarget.textContent = ''; valueSnapshot.nodes.forEach(function (node) { valueTarget.appendChild(node); }); }
    }
    if (inputTarget && inputSnapshot) {
      inputTarget.value = inputSnapshot.value; inputTarget.disabled = inputSnapshot.disabled; if ('readOnly' in inputTarget) inputTarget.readOnly = inputSnapshot.readOnly; if ('required' in inputTarget) inputTarget.required = inputSnapshot.required;
      if (inputTarget.setAttribute) { if (inputSnapshot.placeholder === null) inputTarget.removeAttribute('placeholder'); else inputTarget.setAttribute('placeholder', inputSnapshot.placeholder); }
    }
    if (reference && reference.classList) reference.classList.toggle('is-draft-value', refDraftClassSnapshot);
  }
  if (inputTarget) {
    scope.add(DOM.listen(inputTarget, 'input', function (event) { inputValue = inputTarget.value; displayValue = inputTarget === valueTarget ? inputValue : displayValue; if (typeof opts.onInput === 'function') opts.onInput(inputValue, event, api); }));
    scope.add(DOM.listen(inputTarget, 'focus', function (event) { focused = true; if (typeof opts.onFocus === 'function') opts.onFocus(event, api); }));
    scope.add(DOM.listen(inputTarget, 'blur', function (event) { focused = false; if (typeof opts.onBlur === 'function') opts.onBlur(event, api); }));
    scope.add(DOM.listen(inputTarget, 'keydown', function (event) { if (typeof opts.onKeydown === 'function') opts.onKeydown(event, api); }));
  }
  api = Object.freeze({
    focus: function (focusOptions) { if (destroyed || opts.disabled === true) return false; var target = opts.mode === 'value' ? reference : (inputTarget || reference); return !!(target && target.focus && DOM.focusElement(target, focusOptions || { preventScroll:true })); },
    blur: function () { var target = opts.mode === 'value' ? reference : (inputTarget || reference); if (!target || !target.blur) return false; target.blur(); return true; },
    setDisplayValue: setDisplayValue, setInputValue: setInputValue, setTags: setTags, setSegmentValues: function () { return false; }, setCommittedValue: setCommittedValue,
    onValueChange: function () { return function () {}; }, onFormReset: function (listener) { if (typeof listener !== 'function') return function () {}; resetListeners.push(listener); return function () { var index = resetListeners.indexOf(listener); if (index >= 0) resetListeners.splice(index,1); }; },
    setCustomValidity: function (message) { var field = bridge.getFormField(); if (field && field.setCustomValidity) field.setCustomValidity(String(message || '')); return api; },
    checkValidity: function () { var field = bridge.getFormField(); return field && field.checkValidity ? field.checkValidity() : true; }, reportValidity: function () { var field = bridge.getFormField(); return field && field.reportValidity ? field.reportValidity() : true; },
    setHasValue: function (value) { opts.hasValue = value === true; sync(); return api; }, setExpanded: function (value) { expanded = value === true; sync(); return api; }, setDraftVisual: function (value) { opts.draftVisual = value === true; sync(); return api; }, setIndicatorColor: function () { return api; },
    setDisabled: function (value) { opts.disabled = value === true; sync(); return api; }, setReadOnly: function (value) { opts.readOnly = value === true; sync(); return api; }, setRequired: function (value) { opts.required = value === true; sync(); return api; }, setStatus: function (value) { opts.status = value; return api; }, updateOptions: updateOptions,
    getCommittedValue: function () { return cloneCommitted(committedValue); }, getSerializedValue: bridge.getSerializedValue, getFormField: bridge.getFormField,
    getState: function () { return Object.freeze({ mode:String(opts.mode || 'input'), inputValue:inputValue, tags:tags.slice(), committedValue:cloneCommitted(committedValue), serializedValue:bridge.getSerializedValue(), hasValue:opts.hasValue === true, focused:focused, expanded:expanded, draftVisual:opts.draftVisual === true, disabled:opts.disabled === true, readOnly:opts.readOnly === true, required:opts.required === true, projection:true, destroyed:destroyed }); },
    getRootElement: function () { return reference; }, getControlElement: function () { return null; }, getFocusElement: function () { return opts.mode === 'value' ? reference : (inputTarget || reference); }, getInputElement: function () { return opts.mode === 'value' ? null : inputTarget; }, getInputElements: function () { return opts.mode === 'value' ? [] : (inputTarget ? [inputTarget] : []); }, getValueHost: function () { return valueTarget; }, getContentElement: function () { return null; }, getTrailingElement: function () { return null; }, getSegmentsElement: function () { return null; }, getPrefixElement: function () { return null; }, getSuffixElement: function () { return null; }, getClearElement: function () { return null; }, getArrowElement: function () { return null; }, getIndicatorElement: function () { return null; }, getTags:function(){return null;},getSegmentedInput: function () { return null; }, getDOMSource: function () { return 'projection'; },
    destroy: function () { if (destroyed) return false; destroyed = true; scope.dispose(); resetListeners.length = 0; restore(); bridge.destroy(); reference = valueTarget = inputTarget = formTarget = null; return true; }
  });
  sync();
  return api;
}
    
function create(source, overrides) {
  var fieldInit = resolveFieldOptions(source, overrides);
  var rawOptions = fieldInit.options;
  if (fieldInit.hasNativeValue && (!hasOwn(rawOptions, 'mode') || modeName(rawOptions.mode) === 'input') && !hasOwn(rawOptions, 'inputValue') && !hasOwn(rawOptions, 'committedValue')) rawOptions.inputValue = fieldInit.nativeValue;
  if (hasOwn(rawOptions, 'showArrow') && !hasOwn(rawOptions, 'toggleVisible')) rawOptions.toggleVisible = rawOptions.showArrow === true;
  var configElement = fieldInit.target || fieldInit.formField || (source && source.nodeType === 1 ? source : null);
  var opts = mergeOptions({
    mode: 'input', editor: 'input', size: Config.resolve('size', undefined, configElement), variant: Config.resolve('variant', undefined, configElement), focusOutline: Config.resolve('focusOutline', undefined, configElement), status: 'default', disabled: false, readOnly: false, required: false,
    editable: true, clearable: false, clearVisibility: 'interaction', clearReplacesToggle: true, clearContent: null, toggleContent: undefined, hasValue: false, draftVisual: false,
    placeholder: '', inputValue: '', displayValue: null, inputType: 'text', autocomplete: 'off', minLength: null, maxLength: null, count: false, lengthMode: 'native', limitMode: 'hard',
    toggleVisible: false, toggle: null, busy: false, busyIndicator: null,
    tags:[],creatableTags:false,tagsControlled:false,tokenSeparators: [], tokenizeOnPaste: true, addOnEnter: true, addOnTab: false, addOnBlur: false,
    maxVisibleTags: 0, tagInputMinWidth: 0, renderTag: null, renderTagOverflow: null, tagRemoveContent: null, tagOverflowInteractive: false, tagClasses: null, tagStyles: null,
    measureAvailableWidth: null, measureTagWidth: null, measureTagOverflowWidth: null, onTagProjectionChange: null,
    segments: [], segmentSeparator: '', segmentValues: [], segmentFocusIndex: null
  }, rawOptions);
  // Consumer components intentionally forward shared field options even when they are
  // unspecified. Treat explicit `undefined` as "inherit the live Config default" so
  // Select/Autocomplete/Pickers/InputNumber/InputOTP/TagInput do not accidentally mask
  // global size / variant / focusOutline configuration at Control composition time.
  if (opts.size === undefined) opts.size = Config.resolve('size', undefined, configElement);
  if (opts.variant === undefined) opts.variant = Config.resolve('variant', undefined, configElement);
  if (opts.focusOutline === undefined) opts.focusOutline = Config.resolve('focusOutline', undefined, configElement);
  if (hasOwn(opts, 'allowClear')) throw new TypeError('[QXFRAME9A7C2] Control does not accept legacy option "allowClear".');
  var mode = modeName(opts.mode);
  variantName(opts.variant);
  clearVisibilityName(opts.clearVisibility);
  editorName(opts.editor);
  if (opts.maxVisibleTags !== 'responsive' && opts.maxVisibleTags !== undefined && opts.maxVisibleTags !== null && (!Number.isFinite(Number(opts.maxVisibleTags)) || Number(opts.maxVisibleTags) < 0)) throw new TypeError('[QXFRAME9A7C2] Control maxVisibleTags must be a non-negative number or \"responsive\".');
    
  var doc = fieldInit.document || opts.document || globalThis.document;
  var host = fieldInit.target || opts.container || null;
  var formField = fieldInit.formField || null;
  if (!host && opts.elements == null && !formField) throw new TypeError('[QXFRAME9A7C2] Control requires target/container, formField, or options.elements.');
  var binding = DOMBinding.resolve({ options: opts, target: host, component: null, requiredRefs: ['root','input'], defaultFactory: DOMFactory.createDefaultDOM });
  var refs = binding.refs;
  var root = refs.root;
  var legacyControl = refs.control && refs.control !== root ? refs.control : null;
  var control = root;
  var input = refs.input;
  if (editorName(opts.editor) === 'textarea' && String(input.tagName || '').toLowerCase() !== 'textarea') {
    if (binding.source === 'external') throw new TypeError('[QXFRAME9A7C2] Control editor="textarea" requires a textarea in external DOM.');
    var textarea = doc.createElement('textarea');
    Array.prototype.forEach.call(input.attributes || [], function (attr) { if (attr.name !== 'type') textarea.setAttribute(attr.name, attr.value); });
    input.parentNode.replaceChild(textarea, input); input = textarea; refs.input = input;
  }
  if (!host && formField && binding.source !== 'external') placeFieldRoot(root, host, formField);
  var prefix = refs.prefix || null;
  var suffix = refs.suffix || null;
  var valueHost = refs.valueHost || refs.values || null;
  var clearButton = refs.clear || null;
  var toggle = refs.toggle || refs.arrow || null;
  var loading = refs.loading || null;
  var countNode = refs.count || null;
  var content = null;
  var trailing = null;
  var segmentsHost = refs.segments || null;
  var valueHostIsStructural = binding.source !== 'default-factory' && !!valueHost;
  var suffixAuthoredNodes = [];
  var formBridge = null;
  var scope = Lifecycle.createScope();
  var focused = false;
  var hovered = false;
  var destroyed = false;
  var api = null;
  var tagsInstance = null;
  var segmentedInput = null;
  var segmentInputs = [];
  var segmentMasks = [];
  var modeCleanups = [];
  var valueListeners = [];
  var resetListeners = [];
  var dirty = false;
  var touched = false;
  var invalid = false;
  var customValidityMessage = '';
  var baselineReady = false;
  var initialCommittedValue;
  var initialDisplayState = null;
  var resetEvent = null;
  var inputValue = stringValue(opts.inputValue);
  var displayValue = opts.displayValue;
  var hasValue = opts.hasValue === true || inputValue !== '' || (mode === 'value' && displayValue !== undefined && displayValue !== null && displayValue !== '');
  var expanded = opts.expanded === true;
  var resetDelay = Scheduler.createDelayScheduler(function () {
    if (destroyed) return;
    var event = resetEvent;
    resetEvent = null;
    var detail = Object.freeze({ source: 'form', reason: 'reset', originalEvent: event || null, control: api });
    if (!resetListeners.length) restoreOwnDisplayState();
    resetListeners.slice().forEach(function (listener) { listener(detail); });
    applyCommittedValue(initialCommittedValue, { silent: true, source: 'form', reason: 'reset' }, true);
    dirty = false; touched = false; refreshValidityState(); syncView();
  });
  scope.add(function () { resetDelay.dispose(); });
  var semanticStyles = null;
  var rootTabIndexSnapshot = root.hasAttribute && root.hasAttribute('tabindex') ? root.getAttribute('tabindex') : null;
  var textBehavior = null;
  var externalCommitted = hasOwn(rawOptions, 'committedValue');
  var committedValue = externalCommitted ? cloneCommitted(rawOptions.committedValue) : undefined;
    
  function ensurePart(node, className) {
    if (node) return node;
    node = doc.createElement('span'); node.className = className; return node;
  }
  function detach(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }
  function hasChildContent(node) { return !!(node && node.childNodes && node.childNodes.length); }
  function ensureStructure() {
    if (legacyControl) Array.prototype.forEach.call(legacyControl.classList || [], function (name) { if (name) root.classList.add(name); });
    prefix = ensurePart(prefix, 'qxframe9a7c2-input-prefix');
    valueHost = ensurePart(valueHost, 'qxframe9a7c2-input-values');
    segmentsHost = ensurePart(segmentsHost, 'qxframe9a7c2-input-segments');
    suffix = ensurePart(suffix, 'qxframe9a7c2-input-suffix');
    clearButton = clearButton || (function () { var button = doc.createElement('button'), icon = doc.createElement('span'); button.type = 'button'; icon.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3'; button.appendChild(icon); return button; })();
    toggle = toggle || (function () { var node = doc.createElement('span'), icon = doc.createElement('span'); icon.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3'; node.appendChild(icon); return node; })();
    loading = loading || (function () { var node = doc.createElement('span'), spinner = doc.createElement('span'); spinner.className = 'qxframe9a7c2-button-spinner'; node.appendChild(spinner); return node; })();
    countNode = countNode || doc.createElement('span');
    if (input.parentNode !== root) root.appendChild(input);
    if (legacyControl && legacyControl.parentNode) legacyControl.parentNode.removeChild(legacyControl);
  }
  function isFrameworkSuffixNode(node) { return node === clearButton || node === toggle || node === loading || node === countNode; }
  function isMeaningfulAuthoredNode(node) {
    return !!(node && !(node.nodeType === 3 && String(node.nodeValue || '').trim() === ''));
  }
  function captureAuthoredSuffixNodes() {
    Array.prototype.slice.call(suffix.childNodes || []).forEach(function (node) {
      if (node && node.nodeType === 3 && String(node.nodeValue || '').trim() === '' && node.parentNode === suffix) suffix.removeChild(node);
    });
    suffixAuthoredNodes = Array.prototype.slice.call(suffix.childNodes || []).filter(function (node) { return !isFrameworkSuffixNode(node) && isMeaningfulAuthoredNode(node); });
  }
  function renderSuffixContent(contentValue) {
    suffixAuthoredNodes.splice(0).forEach(function (node) { if (node && node.parentNode === suffix) suffix.removeChild(node); });
    if (contentValue === undefined || contentValue === null || contentValue === false) return;
    var fragment = doc.createDocumentFragment(); Renderer.append(fragment, contentValue);
    suffixAuthoredNodes = Array.prototype.slice.call(fragment.childNodes || []).filter(isMeaningfulAuthoredNode);
    suffix.appendChild(fragment);
  }
  function renderSystemActionContent(node, contentValue, flagName, iconClass) {
    if (!node) return;
    if (contentValue === undefined) return;
    if (contentValue === null || contentValue === false) {
      if (node[flagName] !== true) return;
      node.textContent = '';
      var fallback = doc.createElement('span');
      fallback.className = iconClass;
      node.appendChild(fallback);
      node[flagName] = false;
      return;
    }
    if (Renderer.isNodeLike(contentValue) && node.childNodes.length === 1 && node.firstChild === contentValue) { node[flagName] = true; return; }
    if (!Renderer.isNodeLike(contentValue) && node.childNodes.length === 1 && node.firstChild.nodeType === 3 && node.firstChild.nodeValue === String(contentValue)) { node[flagName] = true; return; }
    node.textContent = '';
    Renderer.append(node, contentValue);
    node[flagName] = true;
  }
  function syncSystemActionContent() {
    renderSystemActionContent(clearButton, opts.clearContent, '__qxframe9a7c2CustomClear', 'qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3');
    var toggleValue = opts.toggleContent !== undefined ? opts.toggleContent : opts.toggle;
    renderSystemActionContent(toggle, toggleValue, '__qxframe9a7c2CustomToggle', 'qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3');
  }
  function renderBusyIndicator(contentValue) {
    if (!loading) return;
    loading.textContent = '';
    if (contentValue !== undefined && contentValue !== null && contentValue !== false) { Renderer.append(loading, contentValue); return; }
    var spinner = doc.createElement('span');
    spinner.className = 'qxframe9a7c2-button-spinner';
    loading.appendChild(spinner);
  }
  function syncStructure() {
    var wantsPrefix = hasChildContent(prefix);
    var wantsValueHost = valueHostIsStructural || mode === 'tags' || mode === 'value';
    var wantsSegments = mode === 'segments';
    var wantsInput = mode === 'input';
    var wantsClear = opts.clearable === true;
    var wantsToggle = opts.toggleVisible === true;
    var wantsLoading = opts.busy === true;
    var wantsCount = opts.count === true && mode === 'input';
    
    if (wantsClear) { if (clearButton.parentNode !== suffix) suffix.appendChild(clearButton); } else detach(clearButton);
    if (wantsToggle) { if (toggle.parentNode !== suffix) suffix.appendChild(toggle); } else detach(toggle);
    if (wantsLoading) { if (loading.parentNode !== suffix) suffix.appendChild(loading); } else detach(loading);
    if (wantsCount) { if (countNode.parentNode !== suffix) suffix.appendChild(countNode); } else detach(countNode);
    
    var wantsSuffix = suffixAuthoredNodes.some(function (node) { return node && node.parentNode === suffix; }) || wantsClear || wantsToggle || wantsLoading || wantsCount;
    var standard = [prefix, valueHost, segmentsHost, input, suffix];
    var wanted = [];
    if (wantsPrefix) wanted.push(prefix); else detach(prefix);
    if (wantsValueHost) wanted.push(valueHost); else detach(valueHost);
    if (wantsSegments) wanted.push(segmentsHost); else detach(segmentsHost);
    if (wantsInput) wanted.push(input); else detach(input);
    if (wantsSuffix) wanted.push(suffix); else detach(suffix);
    
    var anchor = null;
    Array.prototype.some.call(root.childNodes || [], function (node) {
      if (standard.indexOf(node) >= 0) return false;
      anchor = node; return true;
    });
    // Preserve DOM identity for already-correct slots. Re-inserting a focused editor
    // during syncView() makes browsers drop focus even when the visual order is unchanged.
    var cursor = anchor;
    for (var index = wanted.length - 1; index >= 0; index -= 1) {
      var wantedNode = wanted[index];
      if (wantedNode.parentNode !== root || wantedNode.nextSibling !== cursor) root.insertBefore(wantedNode, cursor);
      cursor = wantedNode;
    }
  }
  ensureStructure();
  captureAuthoredSuffixNodes();
  renderBusyIndicator(opts.busyIndicator);
    
  root.classList.add('qxframe9a7c2-input', 'qxframe9a7c2-group-control');
  input.classList.add('qxframe9a7c2-input-control');
  prefix.classList.add('qxframe9a7c2-input-prefix');
  suffix.classList.add('qxframe9a7c2-input-suffix');
  valueHost.classList.add('qxframe9a7c2-input-values');
  segmentsHost.classList.add('qxframe9a7c2-input-segments');
  clearButton.classList.add('qxframe9a7c2-input-clear');
  toggle.classList.add('qxframe9a7c2-input-toggle');
  loading.classList.add('qxframe9a7c2-input-loading');
  countNode.classList.add('qxframe9a7c2-input-count');
    
  semanticStyles = SemanticStyles.create({
    slots: { root: root, input: input, valueHost: valueHost, prefix: prefix, suffix: suffix, clear: clearButton, toggle: toggle, loading: loading, count: countNode, segments: segmentsHost },
    classNames: opts.classNames, styles: opts.styles
  });
  formBridge = createFormFieldBridge({ document:doc, root:root, target:host, formField:formField, name:opts.name, value:committedValue, serializeValue:opts.serializeValue, disabled:opts.disabled===true, readOnly:opts.readOnly===true, required:opts.required===true, projectLayout:projectFormFieldLayout, moveIntoRoot:true, onNativeChange:function(value,detail){ if(typeof opts.onFormFieldChange==='function') opts.onFormFieldChange(value,detail,api); else if(mode==='input'&&!externalCommitted){ inputValue=stringValue(Array.isArray(value)?value[0]:value); committedValue=cloneCommitted(value); syncView(); } }, onReset:handleFormReset });
  formField = formBridge.getFormField();
    
  function clearModeListeners() { while (modeCleanups.length) { try { modeCleanups.pop()(); } catch (_) {} } }
  scope.add(clearModeListeners);
    
  function tagsOptions(includeItems) {
    var responsive = opts.maxVisibleTags === 'responsive';
    var numeric = responsive ? 0 : Math.max(0, Math.floor(Number(opts.maxVisibleTags) || 0));
    var config={
      container:valueHost,hosted:true,controlled:opts.tagsControlled===true,size:opts.size,
      items:Array.isArray(opts.tags)?opts.tags:[],inputValue:inputValue,
      editable: opts.editable !== false, creatable: opts.creatableTags === true,
      unique: opts.uniqueTags !== false, tokenSeparators: opts.tokenSeparators, tokenizeOnPaste: opts.tokenizeOnPaste !== false,
      addOnEnter: opts.addOnEnter !== false, addOnTab: opts.addOnTab === true, addOnBlur: opts.addOnBlur === true,
      maxCount: opts.maxTags, maxTagLength: opts.maxTagLength, normalizeTag: opts.normalizeTag, validateTag: opts.validateTag,
      beforeAdd:opts.beforeTagAdd,beforeEdit:opts.beforeTagEdit,beforeRemove:opts.beforeTagRemove, disabled: opts.disabled, readOnly: opts.readOnly === true || opts.busy === true,
      overflow: responsive ? 'responsive' : (numeric > 0 ? 'collapse' : 'wrap'), maxVisible: numeric,
      inputMinWidth: Math.max(0, Number(opts.tagInputMinWidth) || 0), showOverflowPopover: true,
      measureAvailableWidth: typeof opts.measureAvailableWidth === 'function' ? function () { return opts.measureAvailableWidth({ root:root, values:valueHost, input:tagsInstance&&tagsInstance.getInputElement(), control:api }); } : null,
      measureItemWidth: typeof opts.measureTagWidth === 'function' ? function (item,index,detail) { return opts.measureTagWidth(item,index,{ element:detail.element, root:root, values:valueHost, input:tagsInstance&&tagsInstance.getInputElement(), control:api }); } : null,
      measureOverflowWidth: typeof opts.measureTagOverflowWidth === 'function' ? function (hiddenItems) { return opts.measureTagOverflowWidth(hiddenItems.slice(),{ root:root, values:valueHost, input:tagsInstance&&tagsInstance.getInputElement(), control:api }); } : null,
      renderTag: opts.renderTag,
      renderOverflow: typeof opts.renderTagOverflow === 'function' ? function (context) { return opts.renderTagOverflow(context.hiddenItems.slice(), { visibleTags: context.items.slice(0, context.items.length-context.hiddenItems.length), tags: context.items.slice(), hiddenCount: context.count, controller: api }); } : null,
      tagRemoveContent: opts.tagRemoveContent,
      tagClassName: opts.tagClassName, tagTextClassName: opts.tagTextClassName, tagRemoveClassName: opts.tagRemoveClassName, tagOverflowClassName: opts.tagOverflowClassName,
      classes: opts.tagClasses, styles: opts.tagStyles,
      onAddRequest: function (tag, detail) { if (typeof opts.onTagAdd === 'function') opts.onTagAdd(tag, detail, api); },
      onRemoveRequest: function (tag, detail) { if (typeof opts.onTagRemove === 'function') opts.onTagRemove(tag, detail, api); },
      onAdd: function (tag, detail) { syncDerivedValue(); if (typeof opts.onTagAdd === 'function') opts.onTagAdd(tag, detail, api); },
      onEdit:function(tag,detail){syncDerivedValue();if(typeof opts.onTagEdit==='function')opts.onTagEdit(tag,detail,api);},
      onRemove:function(tag,detail){syncDerivedValue();if(typeof opts.onTagRemove==='function')opts.onTagRemove(tag,detail,api);},
      onItemsChange:function(items,detail){if(opts.tagsControlled!==true)opts.tags=items.slice();syncDerivedValue({source:detail&&detail.source||'tags',reason:detail&&detail.reason||'items-change'}); if (typeof opts.onTagsChange === 'function') opts.onTagsChange(items, detail, api); },
      onInvalid: function (detail) { if (typeof opts.onTagInvalid === 'function') opts.onTagInvalid(detail, api); },
      onKeydown: function (event, detail) { return typeof opts.onKeydown === 'function' ? opts.onKeydown(event, api, detail) === true : false; },
      onInput: function (value, detail) { inputValue = value; hasValue = (tagsInstance ? tagsInstance.getItems().length : 0) > 0 || inputValue !== ''; if (typeof opts.onInput === 'function') opts.onInput(value, detail && detail.originalEvent || null, api); syncDerivedValue({ source: detail && detail.source || 'input', reason: detail && detail.reason || 'input' }); },
      onOverflow:function(detail){if(typeof opts.onTagProjectionChange==='function')opts.onTagProjectionChange({tags:tagsInstance?tagsInstance.getItems():[],visibleTags:tagsInstance?tagsInstance.getItems().slice(0,detail.visibleCount):[],hiddenTags:tagsInstance?tagsInstance.getItems().slice(detail.visibleCount):[],visibleCount:detail.visibleCount,responsive:responsive,overflowElement:tagsInstance?tagsInstance.getOverflowElement():null,controller:api});}
    };if(includeItems===false)delete config.items;return config;
  }
    
  function segmentOptions() {
    return {
      segments: opts.segments, segmentValues: opts.segmentValues, value: opts.value,
      defaultValue: opts.defaultValue, valueAdapter: opts.valueAdapter, formatSegment: opts.formatSegment,
      onInput: function (values, detail) { syncSegmentsFromState(); syncDerivedValue({ source: detail && detail.source || 'segment', reason: detail && detail.reason || 'segment-input' }); if (typeof opts.onSegmentInput === 'function') opts.onSegmentInput(values, detail, api); },
      onChange: function (value, detail) { if (typeof opts.onChange === 'function') opts.onChange(value, detail, api); },
      onComplete: function (value, detail) { if (typeof opts.onComplete === 'function') opts.onComplete(value, detail, api); }
    };
  }
    
  function renderDisplayValue() {
    if (!valueHost || mode !== 'value') return;
    if (displayValue === undefined || displayValue === null || displayValue === '') {
      valueHost.textContent = '';
      if (opts.placeholder !== undefined && opts.placeholder !== null && String(opts.placeholder) !== '') {
        var placeholderNode = doc.createElement('span');
        placeholderNode.className = 'qxframe9a7c2-input-value-placeholder';
        placeholderNode.textContent = String(opts.placeholder);
        valueHost.appendChild(placeholderNode);
      }
      return;
    }
    renderContent(valueHost, displayValue);
  }
    
  function initializeMode(nextMode) {
    clearModeListeners();
    if (tagsInstance) { tagsInstance.destroy(); tagsInstance = null; }
    if (segmentedInput) { segmentedInput.destroy(); segmentedInput = null; }
    segmentInputs = [];
    segmentMasks = [];
    segmentsHost.textContent = '';
    mode = modeName(nextMode);
    if (mode === 'tags') { tagsInstance=Tags.create(tagsOptions(true)); }
    if (mode === 'segments') { segmentedInput = SegmentedInput.create(segmentOptions()); renderSegments(); }
    if (mode === 'value') renderDisplayValue();
    if(mode!=='tags')renderTags();
  }
    
  function interactionPolicy() {
    return InteractionPolicy.resolve({ disabled: opts.disabled === true, readOnly: opts.readOnly === true, loading: opts.busy === true }, {
      preserveFocusWhileLoading: true,
      tabbableWhileLoading: true,
      editable: opts.editable !== false,
      clearable: opts.clearable === true
    });
  }
  function clearVisible() {
    var policy = interactionPolicy();
    if (opts.clearable !== true || !hasValue || !policy.clearable) return false;
    return clearVisibilityName(opts.clearVisibility) === 'always' || focused || hovered;
  }
    
  function derivedCommittedValue() {
    if (mode === 'tags' && tagsInstance) return tagsInstance.getValue();
    if (mode === 'segments' && segmentedInput) return segmentedInput.getState().value;
    return inputValue;
  }
  function serializedCommittedValue() {
    var value = cloneCommitted(committedValue);
    return typeof opts.serializeValue === 'function' ? opts.serializeValue(value, api) : value;
  }
  function syncFormField() {
    if (!formBridge) return;
    formBridge.updateOptions({ name:opts.name, disabled:opts.disabled===true, readOnly:opts.readOnly===true, required:opts.required===true, serializeValue:opts.serializeValue });
    formBridge.setValue(committedValue, { silent:true, source:'control', reason:'sync-form-field' });
    formField = formBridge.getFormField();
    var adapter = formBridge.getAdapter(); if (adapter) adapter.setCustomValidity(customValidityMessage);
  }
  function refreshValidityState() { var adapter=formBridge&&formBridge.getAdapter(); invalid=!!(adapter&&adapter.element&&adapter.element.validity&&adapter.element.validity.valid===false); return !invalid; }
  function notifyCommitted(previous, meta) {
    var detail = Object.freeze({ value: cloneCommitted(committedValue), previousValue: cloneCommitted(previous), source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-committed-value', control: api });
    if (!(meta && meta.silent) && typeof opts.onValueChange === 'function') opts.onValueChange(cloneCommitted(committedValue), detail);
    if (!(meta && meta.silent)) valueListeners.slice().forEach(function (listener) { listener(cloneCommitted(committedValue), detail); });
  }
  function applyCommittedValue(value, meta, external) {
    var next = cloneCommitted(value);
    var previous = cloneCommitted(committedValue);
    if (external === true) externalCommitted = true;
    committedValue = next;
    if (formBridge) formBridge.setValue(committedValue, meta || {});
    formField = formBridge ? formBridge.getFormField() : formField;
    if (baselineReady) dirty = !sameCommitted(initialCommittedValue, next);
    refreshValidityState();
    if (!sameCommitted(previous, next)) notifyCommitted(previous, meta || {});
    if (api) syncView();
    return api;
  }
  function setCommittedValue(value, meta) { return applyCommittedValue(value, meta || {}, true); }
  function subscribe(list, listener, label) {
    if (typeof listener !== 'function') throw new TypeError('[QXFRAME9A7C2] Control ' + label + ' listener must be a function.');
    list.push(listener);
    var active = true;
    return function () { if (!active) return false; active = false; var index = list.indexOf(listener); if (index >= 0) list.splice(index, 1); return true; };
  }
  function onValueChange(listener) { return subscribe(valueListeners, listener, 'onValueChange'); }
  function onFormReset(listener) { return subscribe(resetListeners, listener, 'onFormReset'); }
  function setCustomValidity(message) {
    customValidityMessage = stringValue(message);
    var adapter = formBridge && formBridge.getAdapter();
    if (adapter) adapter.setCustomValidity(customValidityMessage);
    refreshValidityState(); if (api) syncView(); return api;
  }
  function checkValidity() {
    var adapter = formBridge && formBridge.getAdapter();
    if (!adapter) return true;
    var valid = adapter.checkValidity(); refreshValidityState(); if (api) syncView(); return valid;
  }
  function reportValidity() {
    var valid = checkValidity();
    if (!valid) focus({ preventScroll: true });
    return valid;
  }
    
  function normalizedSegmentFocusIndex() { if (opts.segmentFocusIndex === null || opts.segmentFocusIndex === undefined || opts.segmentFocusIndex === '') return null; var index = Math.floor(Number(opts.segmentFocusIndex)); if (!Number.isFinite(index) || !segmentInputs.length) return null; return Math.max(0, Math.min(segmentInputs.length - 1, index)); }
  function primaryInput() { if (mode === 'value') return root; if (mode === 'tags' && tagsInstance) return tagsInstance.getInputElement() || tagsInstance.getAddTriggerElement() || root; if (mode === 'input') return input; var focusIndex = normalizedSegmentFocusIndex(); return segmentInputs[focusIndex === null ? 0 : focusIndex] || input; }
  function syncRootFocusPolicy() {
    if (!root || !root.setAttribute) return;
    var rootOwnsFocus = mode === 'value' || (mode === 'tags' && opts.editable === false);
    if (rootOwnsFocus) { root.tabIndex = interactionPolicy().tabbable ? 0 : -1; return; }
    if (rootTabIndexSnapshot === null) root.removeAttribute('tabindex'); else root.setAttribute('tabindex', rootTabIndexSnapshot);
  }
  function syncSegmentFocusPolicy() { var focusIndex = normalizedSegmentFocusIndex(); segmentInputs.forEach(function (node, index) { node.tabIndex = node.disabled ? -1 : (focusIndex === null || index === focusIndex ? 0 : -1); }); }
  function redirectSegmentFocus(index, event) { var focusIndex = normalizedSegmentFocusIndex(); if (focusIndex === null || focusIndex === index || !segmentInputs[focusIndex]) return false; if (event && event.preventDefault) event.preventDefault(); DOM.focusElement(segmentInputs[focusIndex], { preventScroll:true }); if (segmentInputs[focusIndex].select) segmentInputs[focusIndex].select(); return true; }
    
  function syncDerivedValue(meta) {
    if (mode === 'tags' && tagsInstance) { var tagState = tagsInstance.getState(); inputValue = tagState.inputValue; hasValue = tagState.items.length > 0 || inputValue !== ''; }
    else if (mode === 'segments' && segmentedInput) { var segmentState = segmentedInput.getState(); hasValue = segmentState.values.some(function (value) { return value !== ''; }); }
    else if (mode === 'value') hasValue = opts.hasValue === true || (displayValue !== undefined && displayValue !== null && displayValue !== '');
    else hasValue = opts.hasValue === true || inputValue !== '';
    if (!externalCommitted) {
      var commitMeta = meta ? Object.assign({ source: 'control', reason: 'derived-value' }, meta) : { silent: true, source: 'control', reason: 'derived-value' };
      applyCommittedValue(derivedCommittedValue(), commitMeta, false);
    }
    syncView();
  }
    
  function isResponsiveTagLimit() { return mode === 'tags' && opts.maxVisibleTags === 'responsive'; }
  function syncResponsiveTagObserver() { return false; }
  function refreshTagOverflow() { return !!(tagsInstance && tagsInstance.refreshOverflow('control-refresh')); }
  function renderTags() {
    if (mode !== 'tags' || !tagsInstance) return;
    tagsInstance.updateOptions(tagsOptions(false));
  }
    
  function separatorContent(index) {
    var separator = opts.segmentSeparator;
    if (typeof separator === 'function') return separator(index, segmentedInput ? segmentedInput.getState() : null, api);
    return separator;
  }
    
  function renderSegments() {
    segmentsHost.textContent = '';
    segmentInputs = [];
    clearModeListeners();
    if (mode !== 'segments' || !segmentedInput) return;
    var state = segmentedInput.getState();
    state.segments.forEach(function (segment, index) {
      if (index > 0) {
        var sep = doc.createElement('span'); sep.className = 'qxframe9a7c2-input-segment-separator'; renderContent(sep, separatorContent(index - 1)); segmentsHost.appendChild(sep);
      }
      var field = doc.createElement('span'), segmentInput = doc.createElement('input'), mask = doc.createElement('span');
      field.className = 'qxframe9a7c2-input-segment-field' + (segment.mask ? ' has-mask' : '');
      segmentInput.className = 'qxframe9a7c2-input-segment-input'; DOM.setPrivate(segmentInput, 'controlSegment', segment.key);
      segmentInput.type = segment.type; DOM.configureTextInput(segmentInput, { mode: segment.inputMode === 'numeric' || segment.inputMode === 'decimal' ? 'numeric' : 'text', inputMode: segment.inputMode, autocomplete: segment.autocomplete }); segmentInput.placeholder = segment.placeholder;
      if (segment.maxLength) segmentInput.maxLength = segment.maxLength;
      segmentInput.disabled = opts.disabled === true || segment.disabled === true; segmentInput.readOnly = opts.readOnly === true || segment.readOnly === true;
      segmentInput.value = state.values[index] || '';
      mask.className = 'qxframe9a7c2-input-segment-mask';
      if (segment.mask) mask.textContent = segment.mask.repeat(Array.from(segmentInput.value).length);
      field.classList.toggle('has-mask-value', !!segment.mask && segmentInput.value !== '');
      field.appendChild(segmentInput); if (segment.mask) field.appendChild(mask); segmentsHost.appendChild(field); segmentInputs.push(segmentInput); segmentMasks.push(segment.mask ? mask : null);
      modeCleanups.push(DOM.listen(segmentInput, 'input', function (event) {
        var raw = segmentInput.value;
        if (raw.length > 1 && segment.maxLength === 1) {
          var last = segmentedInput.distribute(index, raw, { reason: 'distribute', source: 'input', originalEvent: event }); syncSegmentsFromState(); var target = segmentInputs[Math.min(last + 1, segmentInputs.length - 1)]; if (target) DOM.focusElement(target);
        } else {
          segmentedInput.patch(index, raw, { reason: 'input', source: 'input', originalEvent: event }); syncSegmentsFromState();
          if (segment.maxLength && raw.length >= segment.maxLength && index < segmentInputs.length - 1) DOM.focusElement(segmentInputs[index + 1]);
        }
      }));
      modeCleanups.push(DOM.listen(segmentInput, 'keydown', function (event) {
        if (event.key === 'Backspace' && segmentInput.value === '' && index > 0) {
          if (segmentedInput.erasePrevious(index, { originalEvent: event })) { if (event.preventDefault) event.preventDefault(); syncSegmentsFromState(); DOM.focusElement(segmentInputs[index - 1]); }
        } else if (event.key === 'ArrowLeft' && segmentInput.selectionStart === 0 && index > 0) { if (event.preventDefault) event.preventDefault(); DOM.focusElement(segmentInputs[index - 1]); }
        else if (event.key === 'ArrowRight' && segmentInput.selectionStart === segmentInput.value.length && index < segmentInputs.length - 1) { if (event.preventDefault) event.preventDefault(); DOM.focusElement(segmentInputs[index + 1]); }
        if (typeof opts.onKeydown === 'function') opts.onKeydown(event, api);
      }));
      modeCleanups.push(DOM.listen(segmentInput, 'paste', function (event) {
        var text = event.clipboardData && event.clipboardData.getData ? event.clipboardData.getData('text') : '';
        if (!text) return;
        var last = segmentedInput.distribute(index, text, { reason: 'paste', source: 'paste', originalEvent: event }); if (event.preventDefault) event.preventDefault(); syncSegmentsFromState(); var target = segmentInputs[Math.min(last + 1, segmentInputs.length - 1)]; if (target) DOM.focusElement(target);
      }));
      modeCleanups.push(DOM.listen(segmentInput, 'pointerdown', function (event) { redirectSegmentFocus(index, event); }));
      modeCleanups.push(DOM.listen(segmentInput, 'focus', function (event) { syncSegmentsFromState(); if (typeof opts.onSegmentFocus === 'function') opts.onSegmentFocus({ index: index, key: segment.key, originalEvent: event, control: api }); }));
      modeCleanups.push(DOM.listen(segmentInput, 'blur', function () { syncSegmentsFromState(); }));
      modeCleanups.push(DOM.listen(segmentInput, 'click', function (event) { if (redirectSegmentFocus(index, event)) return; if (typeof opts.onSegmentClick === 'function') opts.onSegmentClick({ index: index, key: segment.key, originalEvent: event, control: api }); }));
    });
  }
    
  function syncSegmentsFromState() {
    if (!segmentedInput) return;
    var state = segmentedInput.getState();
    segmentInputs.forEach(function (node, index) {
      var value = state.values[index] || '', segment = state.segments[index], mask = segmentMasks[index], field = node.parentNode;
      if (node.value !== value) node.value = value;
      if (mask) mask.textContent = segment && segment.mask ? segment.mask.repeat(Array.from(value).length) : '';
      if (field && field.classList) { field.classList.toggle('has-mask-value', !!(segment && segment.mask && value !== '')); field.classList.toggle('qxframe9a7c2-segment-keyboard-focus', InteractionModality.isKeyboard(doc) && node === doc.activeElement && node.matches && node.matches(':focus-visible')); }
    });
    syncSegmentFocusPolicy();
  }
    
  function syncTextBehaviorOptions() {
    if (!textBehavior) return;
    textBehavior.updateOptions({ count: opts.count === true, maxLength: opts.maxLength, minLength: opts.minLength, lengthMode: opts.lengthMode || 'native', limitMode: opts.limitMode || 'hard' });
  }
  function syncView() {
    if (destroyed) return;
    // Focus styling is a projection of browser focus ownership, not an independent latch.
    // This also clears stale focus when a focused removable tag button is synchronously
    // removed before the browser can dispatch a blur event for that detached node.
    var activeFocus = doc.activeElement;
    focused = !!(activeFocus && control.contains(activeFocus));
    var keyboardFocused = !!(focused && InteractionModality.isKeyboard(doc) && activeFocus && activeFocus.matches && activeFocus.matches(':focus-visible'));
    SIZES.forEach(function (name) { root.classList.remove('is-' + name); });
    STATUSES.forEach(function (name) { if (name !== 'default') root.classList.remove('is-' + name); });
    MODES.forEach(function (name) { root.classList.remove('is-' + name); });
    VDOMNTS.forEach(function (name) { root.classList.remove('is-variant-' + name); });
    root.classList.add('is-' + sizeName(opts.size)); root.classList.add('is-' + mode); root.classList.add('is-variant-' + variantName(opts.variant));
    var status = statusName(opts.status); if (status !== 'default') root.classList.add('is-' + status);
    var policy = interactionPolicy();
    var hoverVisible = hovered && !policy.disabled && opts.readOnly !== true && !focused && !expanded;
    root.classList.toggle('is-textarea', editorName(opts.editor) === 'textarea');
    root.classList.toggle('is-focused', focused); root.classList.toggle('is-keyboard-focus', keyboardFocused); root.classList.toggle('is-hovered', hoverVisible); root.classList.toggle('is-expanded', expanded);
    root.classList.toggle('is-disabled', opts.disabled === true); root.classList.toggle('is-readonly', opts.readOnly === true); root.classList.toggle('is-required', opts.required === true); root.classList.toggle('is-focus-outline-disabled', opts.focusOutline === false); root.classList.toggle('has-value', hasValue); root.classList.toggle('has-input-value', inputValue !== ''); root.classList.toggle('is-busy', opts.busy === true);
    root.classList.toggle('is-clearable', opts.clearable === true); root.classList.toggle('is-clear-visible', clearVisible()); root.classList.toggle('is-draft-value', opts.draftVisual === true);
    root.classList.toggle('is-dirty', dirty); root.classList.toggle('is-touched', touched); root.classList.toggle('is-invalid', invalid);
    input.disabled = policy.disabled; input.readOnly = !policy.editable; input.required = opts.required === true;
    if (String(input.tagName || '').toLowerCase() === 'input') input.type = String(opts.inputType || 'text');
    var nativeInputMode = String(opts.inputType || 'text').toLowerCase();
    if (nativeInputMode !== 'search' && nativeInputMode !== 'email') nativeInputMode = 'text';
    DOM.configureTextInput(input, { mode: nativeInputMode, autocomplete: opts.autocomplete || 'off', inputMode: opts.inputMode === undefined || opts.inputMode === null ? (nativeInputMode === 'search' ? 'search' : nativeInputMode) : String(opts.inputMode) });
    input.placeholder = String(opts.placeholder || '');
    var minLength = opts.minLength === null || opts.minLength === undefined || opts.minLength === '' ? null : Math.max(0, Math.floor(Number(opts.minLength) || 0));
    var maxLength = opts.maxLength === null || opts.maxLength === undefined || opts.maxLength === '' ? null : Math.max(0, Math.floor(Number(opts.maxLength) || 0));
    if (minLength === null) input.removeAttribute('minlength'); else input.minLength = minLength;
    if (maxLength === null) input.removeAttribute('maxlength'); else input.maxLength = maxLength;
    if (input.value !== inputValue) input.value = inputValue;
    var showClear = clearVisible();
    setHiddenState(clearButton, !showClear); clearButton.disabled = !policy.clearable; clearButton.tabIndex = -1;
    var showToggle = opts.toggleVisible === true && !(showClear && opts.clearReplacesToggle !== false);
    setHiddenState(toggle, !showToggle);
    setHiddenState(loading, opts.busy !== true);
    syncSystemActionContent();
    if (textBehavior) { var countState = textBehavior.sync(); setHiddenState(countNode, !(opts.count === true && mode === 'input')); if (!countNode.hidden) { countNode.textContent = textBehavior.formatCount(); countNode.classList.toggle('is-over-limit', countState.overMax); } }
    else setHiddenState(countNode, true);
    syncRootFocusPolicy();
    syncStructure();
    segmentInputs.forEach(function (node, index) { var segment = segmentedInput && segmentedInput.getState().segments[index]; node.disabled = policy.disabled || !!(segment && segment.disabled); node.readOnly = !policy.editable || !!(segment && segment.readOnly); node.required = opts.required === true; });
    syncSegmentFocusPolicy();
    syncFormField();
  }
    
  function focus(focusOptions) {
    if (destroyed || !interactionPolicy().focusable) return false;
    var target = primaryInput();
    if (!target || !target.focus) return false;
    var didFocus = DOM.focusElement(target, focusOptions || { preventScroll: true });
    var active = doc.activeElement;
    var ownsFocus = !!(didFocus && active && control.contains(active));
    // A native focus request can return without throwing for a non-focusable root. Focus
    // projection must follow browser focus truth, otherwise non-searchable tags/selects
    // can enter is-focused without any future blur event capable of clearing it.
    if (ownsFocus && !focused) { focused = true; syncView(); }
    else if (!ownsFocus && focused && (!active || !control.contains(active))) { focused = false; syncView(); }
    return ownsFocus;
  }
  function blur() {
    if (destroyed) return false;
    var active = doc.activeElement;
    if (active && control.contains(active) && active.blur) { active.blur(); return true; }
    var list = mode === 'segments' ? segmentInputs : [input];
    list.forEach(function (node) { if (node && node.blur) node.blur(); });
    return true;
  }
  function setInputValue(value) { inputValue = stringValue(value); if (tagsInstance) tagsInstance.setInputValue(inputValue, { silent:true, reason:'control-set-input', source:'control' }); syncDerivedValue({ source:'api', reason:'set-input-value' }); return api; }
  function setDisplayValue(value) { displayValue = value; if (mode === 'input') inputValue = stringValue(value); if (mode === 'value') renderDisplayValue(); if (opts.autoHasValue !== false && (mode === 'value' || mode === 'input')) hasValue = value !== undefined && value !== null && value !== ''; syncView(); return api; }
  function setTags(tags) { if (!tagsInstance) return false; opts.tags=Array.isArray(tags)?tags.slice():[]; tagsInstance.setItems(opts.tags, { silent:true, reason:'control-set-tags', source:'control' }); syncDerivedValue({ source:'api', reason:'set-tags' }); return api; }
  function setSegmentValues(values) { if (!segmentedInput) return false; segmentedInput.setValues(values, { silent: true, reason: 'control-set-segments', source: 'control' }); syncSegmentsFromState(); syncDerivedValue({ source: 'api', reason: 'set-segment-values' }); return api; }
  function setSegmentFocusIndex(index) { opts.segmentFocusIndex = index === null || index === undefined ? null : Math.floor(Number(index)); syncSegmentFocusPolicy(); return api; }
  function setHasValue(value) { hasValue = value === true; opts.hasValue = hasValue; syncView(); return api; }
  function setExpanded(value) { expanded = value === true; syncView(); return api; }
  function setDraftVisual(value) { opts.draftVisual = value === true; syncView(); return api; }
  function setDisabled(value) { opts.disabled=value===true; if(tagsInstance)tagsInstance.updateOptions({disabled:opts.disabled,readOnly:opts.readOnly}); syncView(); return api; }
  function setReadOnly(value) { opts.readOnly=value===true; if(tagsInstance)tagsInstance.updateOptions({disabled:opts.disabled,readOnly:opts.readOnly}); syncView(); return api; }
  function setRequired(value) { opts.required = value === true; syncView(); return api; }
  function setStatus(value) { opts.status = statusName(value); syncView(); return api; }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (hasOwn(next, 'size') && next.size === undefined) next.size = Config.resolve('size', undefined, root);
    if (hasOwn(next, 'variant') && next.variant === undefined) next.variant = Config.resolve('variant', undefined, root);
    if (hasOwn(next, 'focusOutline') && next.focusOutline === undefined) next.focusOutline = Config.resolve('focusOutline', undefined, root);
    ['allowClear'].forEach(function (name) { if (hasOwn(next, name)) throw new TypeError('[QXFRAME9A7C2] Control does not accept legacy option "' + name + '".'); });
    ['target','container','formField','nameInput','elements','document'].forEach(function (name) { if (hasOwn(next, name)) throw new Error('[QXFRAME9A7C2] Control structural option "' + name + '" is immutable; destroy and recreate to change field binding.'); });
    if (hasOwn(next, 'clearVisibility')) clearVisibilityName(next.clearVisibility);
    if (hasOwn(next, 'variant')) variantName(next.variant);
    if (hasOwn(next, 'editor') && editorName(next.editor) !== editorName(opts.editor)) throw new Error('[QXFRAME9A7C2] Control editor is structural; destroy and recreate to change it.');
    if (hasOwn(next, 'limitMode') && String(next.limitMode || 'hard').toLowerCase() !== 'hard') throw new TypeError('[QXFRAME9A7C2] Control limitMode currently supports only "hard".');
    if (hasOwn(next, 'maxVisibleTags') && next.maxVisibleTags !== 'responsive' && next.maxVisibleTags !== undefined && next.maxVisibleTags !== null && (!Number.isFinite(Number(next.maxVisibleTags)) || Number(next.maxVisibleTags) < 0)) throw new TypeError('[QXFRAME9A7C2] Control maxVisibleTags must be a non-negative number or \"responsive\".');
    if (hasOwn(next, 'showArrow') && !hasOwn(next, 'toggleVisible')) next.toggleVisible = next.showArrow === true;
    var nextMode = hasOwn(next, 'mode') ? modeName(next.mode) : mode;
    var modeChanged = nextMode !== mode;
    Object.keys(next).forEach(function (name) { if (name !== 'committedValue') opts[name] = next[name]; });
    if (hasOwn(next, 'inputValue')) inputValue = stringValue(next.inputValue);
    if (hasOwn(next, 'displayValue')) displayValue = next.displayValue;
    if (hasOwn(next, 'hasValue')) hasValue = next.hasValue === true;
    if (hasOwn(next, 'expanded')) expanded = next.expanded === true;
    if (hasOwn(next, 'prefix')) renderContent(prefix, opts.prefix);
    if (hasOwn(next, 'suffix')) renderSuffixContent(opts.suffix);
    if (hasOwn(next, 'busyIndicator')) renderBusyIndicator(opts.busyIndicator);
    if (hasOwn(next, 'clearContent') || hasOwn(next, 'toggleContent') || hasOwn(next, 'toggle')) syncSystemActionContent();
    if ((hasOwn(next, 'classNames') || hasOwn(next, 'styles')) && semanticStyles) semanticStyles.update({ classNames: opts.classNames, styles: opts.styles });
    if (modeChanged) initializeMode(nextMode);
    else if (mode === 'value' && (hasOwn(next, 'displayValue') || hasOwn(next, 'placeholder'))) renderDisplayValue();
    else if (mode === 'tags' && tagsInstance) { if(hasOwn(next,'tags')) opts.tags=Array.isArray(next.tags)?next.tags.slice():[]; tagsInstance.updateOptions(tagsOptions(hasOwn(next,'tags'))); }
    else if (mode === 'segments' && segmentedInput) {
      var segmentNext = segmentOptions();
      delete segmentNext.segments;
      if (hasOwn(next, 'value')) {
        delete segmentNext.segmentValues;
        segmentNext.value = opts.value;
      } else {
        delete segmentNext.value;
        segmentNext.segmentValues = hasOwn(next, 'segmentValues') ? opts.segmentValues : segmentedInput.getState().values;
      }
      segmentedInput.updateOptions(segmentNext);
      syncSegmentsFromState();
    }
    syncResponsiveTagObserver();
    if (hasOwn(next, 'committedValue')) applyCommittedValue(next.committedValue, { source: 'api', reason: 'update-options' }, true);
    syncTextBehaviorOptions();
    syncDerivedValue(); if (binding && binding.syncClasses) binding.syncClasses(opts.classes); return api;
  }
    
  function captureDisplayState() {
    return { inputValue:inputValue, displayValue:displayValue, tags:tagsInstance?tagsInstance.getItems():[], segmentValues:segmentedInput?segmentedInput.getState().values:[] };
  }
  function restoreOwnDisplayState() {
    if (!initialDisplayState) return;
    if (mode==='tags'&&tagsInstance) { tagsInstance.setItems(initialDisplayState.tags||[],{silent:true,source:'form',reason:'reset'}); inputValue=initialDisplayState.inputValue||''; tagsInstance.setInputValue(inputValue,{silent:true,source:'form',reason:'reset'}); }
    else if (mode === 'segments' && segmentedInput) { segmentedInput.setValues(initialDisplayState.segmentValues || [], { silent: true, source: 'form', reason: 'reset' }); syncSegmentsFromState(); }
    else if (mode === 'value') { displayValue = initialDisplayState.displayValue; renderDisplayValue(); }
    else inputValue = stringValue(initialDisplayState.inputValue);
    hasValue = mode === 'tags' && tagsInstance ? tagsInstance.getItems().length > 0 || inputValue !== '' : (mode === 'segments' && segmentedInput ? segmentedInput.getState().values.some(function (value) { return value !== ''; }) : (mode === 'value' ? displayValue !== undefined && displayValue !== null && displayValue !== '' : inputValue !== ''));
  }
  function handleFormReset(event) {
    resetEvent = event || null;
    resetDelay.request(0, 'form-reset');
  }
  function bindNativeBridge() {
    var bridge=formBridge&&formBridge.getFormField(); if(!bridge)return;
    scope.add(DOM.listen(bridge,'invalid',function(event){invalid=true;if(event&&event.preventDefault)event.preventDefault();syncView();focus({preventScroll:true});}));
    scope.add(DOM.listen(bridge,'click',function(){if(!destroyed)focus({preventScroll:true});}));
  }
    
  textBehavior = TextInputBehavior.create({
    getValue: function () { return inputValue; },
    setValue: function (value) { setInputValue(value); },
    requestClear: function () { setInputValue(''); },
    isDisabled: function () { return opts.disabled === true; },
    isReadOnly: function () { return opts.readOnly === true; },
    requestFocus: function () { focus({ preventScroll: true }); }
  }, { count: opts.count === true, maxLength: opts.maxLength, minLength: opts.minLength, lengthMode: opts.lengthMode || 'native', limitMode: opts.limitMode || 'hard' });
  scope.add(function () { if (textBehavior) textBehavior.destroy(); });
    
  scope.add(DOM.listen(root, 'pointerenter', function () { hovered = true; syncView(); }));
  scope.add(DOM.listen(root, 'pointerleave', function () { hovered = false; syncView(); }));
  scope.add(DOM.listen(control, 'focus', function (event) { var wasFocused = focused; focused = true; syncView(); if (!wasFocused && typeof opts.onFocus === 'function') opts.onFocus(event, api); }, true));
  scope.add(DOM.listen(control, 'blur', function (event) { var next = event.relatedTarget; if (next && control.contains(next)) return; focused = false; touched = true; syncView(); if (typeof opts.onBlur === 'function') opts.onBlur(event, api); }, true));
  scope.add(DOM.listen(input,'input',function(event){ if(mode==='tags')return; inputValue=input.value;if(textBehavior)textBehavior.sync();if(opts.autoHasValue!==false)hasValue=inputValue!=='';syncDerivedValue({source:'input',reason:'input'});if(typeof opts.onInput==='function')opts.onInput(inputValue,event,api);}));
  scope.add(DOM.listen(input, 'compositionstart', function () { if (textBehavior) textBehavior.setComposing(true); }));
  scope.add(DOM.listen(input, 'compositionend', function () { if (textBehavior) textBehavior.setComposing(false); inputValue = input.value; syncDerivedValue({ source: 'input', reason: 'composition-end' }); }));
  scope.add(DOM.listen(input,'keydown',function(event){ if(mode==='tags')return; if(typeof opts.onKeydown==='function')opts.onKeydown(event,api); }));
  scope.add(DOM.listen(control, 'pointerdown', function (event) { if (event.button !== undefined && event.button !== 0) return; if (!interactionPolicy().focusable) return; if (isInteractiveTarget(event.target, control)) return; if (event.preventDefault) event.preventDefault(); focus({ preventScroll: true }); if (typeof opts.onControlPointerDown === 'function') opts.onControlPointerDown(event, api); }));
  scope.add(DOM.listen(control, 'click', function (event) { if (event.target !== input && isInteractiveTarget(event.target, control)) return; if (typeof opts.onControlClick === 'function') opts.onControlClick(event, api); }));
  if (clearButton) {
    scope.add(DOM.listen(clearButton, 'pointerdown', function (event) { if (event.preventDefault) event.preventDefault(); }));
    scope.add(DOM.listen(clearButton, 'click', function (event) {
      if (event.preventDefault) event.preventDefault(); if (event.stopPropagation) event.stopPropagation();
      ClearAction.request(opts, { clearable:opts.clearable === true, preserveFocusWhileLoading:true, tabbableWhileLoading:true }, function () {
        if (typeof opts.onClearRequest === 'function') opts.onClearRequest(event, api);
        else if(mode==='tags'&&tagsInstance){tagsInstance.clear({reason:'clear-button',source:DOM.activationSource(event),originalEvent:event});syncDerivedValue();}
        else if (mode === 'segments' && segmentedInput) { segmentedInput.setValues([], { reason: 'clear-button', source: DOM.activationSource(event), originalEvent: event }); syncSegmentsFromState(); syncDerivedValue(); }
        else if (textBehavior) textBehavior.clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); else setInputValue('');
        focus({ preventScroll: true }); return true;
      }, { event:event, control:api });
    }));
  }
    
  if (opts.prefix !== undefined) renderContent(prefix, opts.prefix);
  if (opts.suffix !== undefined) renderSuffixContent(opts.suffix);
  initializeMode(mode);
  syncResponsiveTagObserver();
  syncDerivedValue();
    
  api = Object.freeze({
    focus: focus, blur: blur,
    setDisplayValue: setDisplayValue, setInputValue: setInputValue, setTags: setTags, setSegmentValues: setSegmentValues, setSegmentFocusIndex: setSegmentFocusIndex,
    setCommittedValue: setCommittedValue, onValueChange: onValueChange, onFormReset: onFormReset,
    setCustomValidity: setCustomValidity, checkValidity: checkValidity, reportValidity: reportValidity,
    setHasValue: setHasValue, setExpanded: setExpanded, setDraftVisual: setDraftVisual,
    setDisabled: setDisabled, setReadOnly: setReadOnly, setRequired: setRequired, setStatus: setStatus, refreshTagOverflow: refreshTagOverflow, updateOptions: updateOptions,
    getCommittedValue: function () { return cloneCommitted(committedValue); }, getSerializedValue: function () { return cloneCommitted(serializedCommittedValue()); }, getFormField:function(){return formBridge?formBridge.getFormField():formField;},
    getState: function () { return Object.freeze({ mode: mode, editor: editorName(opts.editor), inputValue: inputValue, displayValue: displayValue, tags: tagsInstance ? tagsInstance.getItems() : [], segmentValues: segmentedInput ? segmentedInput.getState().values : [], value: mode === 'value' ? cloneCommitted(committedValue) : (segmentedInput ? segmentedInput.getState().value : (tagsInstance ? tagsInstance.getValue() : inputValue)), committedValue: cloneCommitted(committedValue), serializedValue: cloneCommitted(serializedCommittedValue()), hasValue: hasValue, focused: focused, expanded: expanded, draftVisual: opts.draftVisual === true, size: sizeName(opts.size), variant: variantName(opts.variant), focusOutline: opts.focusOutline !== false, status: statusName(opts.status), disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true, dirty: dirty, touched: touched, valid: !invalid, validationMessage:formBridge&&formBridge.getAdapter()?formBridge.getAdapter().getValidationMessage():'', clearVisible: clearVisible(), count: textBehavior ? textBehavior.getState() : null, maxVisibleTags: opts.maxVisibleTags === 'responsive' ? 'responsive' : Math.max(0, Math.floor(Number(opts.maxVisibleTags) || 0)), responsiveVisibleTags: tagsInstance ? tagsInstance.getState().visibleCount : null, destroyed: destroyed }); },
    getRootElement: function () { return root; }, getControlElement: function () { return root; }, getFocusElement: primaryInput, getInputElement:function(){return mode==='value'?null:(mode==='tags'&&tagsInstance?tagsInstance.getInputElement():primaryInput());},
    getInputElements:function(){return mode==='value'?[]:(mode==='segments'?segmentInputs.slice():(mode==='tags'&&tagsInstance?[tagsInstance.getInputElement()].filter(Boolean):[input]));}, getValueHost: function () { return valueHost; },
    getContentElement: function () { return null; }, getTrailingElement: function () { return suffix; }, getSegmentsElement: function () { return segmentsHost; },
    getPrefixElement: function () { return prefix; }, getSuffixElement: function () { return suffix; }, getClearElement: function () { return clearButton; }, getToggleElement: function () { return toggle; }, getArrowElement: function () { return toggle; }, getLoadingElement: function () { return loading; }, getCountElement: function () { return countNode; },
    getTags: function () { return tagsInstance; }, getSegmentedInput: function () { return segmentedInput; }, getDOMSource: function () { return binding ? binding.source : null; },
    destroy: function () {
      if (destroyed) return false;
      destroyed=true;clearModeListeners();valueListeners.length=0; resetListeners.length = 0;
      if(tagsInstance)tagsInstance.destroy();if(segmentedInput)segmentedInput.destroy();
      if (semanticStyles) semanticStyles.destroy(); semanticStyles = null; scope.dispose();
      if(formBridge)formBridge.destroy();formBridge=null;
      if (binding) binding.release(); binding = null;
      root = control = input = prefix = suffix = valueHost = content = trailing = segmentsHost = clearButton = toggle = loading = countNode = null;
      formField = null; textBehavior = null; segmentInputs = []; segmentMasks = []; return true;
    }
  });
  initialCommittedValue = cloneCommitted(committedValue);
  initialDisplayState = captureDisplayState();
  baselineReady = true; dirty = false; touched = false; refreshValidityState();
  bindNativeBridge(); syncView();
  return api;
}
    
function enhance(input, options) {
  var doc = options && options.document || (isElement(input) && input.ownerDocument) || globalThis.document;
  var element = resolveElement(input, doc, 'formField');
  if(!isFormFieldElement(element))throw new TypeError('[QXFRAME9A7C2] Control.enhance requires input, textarea, or select.');
  return create(element, options || {});
}
    

export const Control = Object.freeze({
    create, enhance, resolveFieldOptions, resolveElement, createProjection, createFormFieldBridge,
    placeFieldRoot, projectFormFieldLayout, createDefaultDOM: DOMFactory.createDefaultDOM
});
