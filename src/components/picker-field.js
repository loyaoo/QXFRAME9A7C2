// Canonical ESM PickerField runtime shared by PickerComponent family.
import { DOMTemplate } from '../core/domTemplate.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { FieldHost } from '../core/fieldHost.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { CapabilityController } from '../core/capabilityController.js';
import { FocusController } from '../core/focusController.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { Utils } from '../utils/utils.js';
import { Control } from './control.js';
import { PopupFrame, PopupRuntime } from './popup.js';

let DOMFactory;
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-picker-field qxframe9a7c2-picker-field-control qxframe9a7c2-input qxframe9a7c2-group-control" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-picker-field-prefix qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
    <span class="qxframe9a7c2-picker-field-value-host qxframe9a7c2-input-values" data-qxframe9a7c2-ref="value-host"></span>
    <span class="qxframe9a7c2-picker-field-segments qxframe9a7c2-input-segments" data-qxframe9a7c2-ref="segments"></span>
    <input class="qxframe9a7c2-picker-field-input qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
    <span class="qxframe9a7c2-picker-field-suffix qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix">
      <button class="qxframe9a7c2-picker-field-clear qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button>
      <span class="qxframe9a7c2-picker-field-toggle qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span>
    </span>
  </div>`;

var dualBlueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-picker-field qxframe9a7c2-picker-range-dual" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-picker-range-control is-start" data-qxframe9a7c2-ref="range-start"></span>
    <span class="qxframe9a7c2-picker-range-separator" data-qxframe9a7c2-ref="range-separator"></span>
    <span class="qxframe9a7c2-picker-range-control is-end" data-qxframe9a7c2-ref="range-end"></span>
  </div>`;

function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  instance.refs.control = instance.root;
  return { root: instance.root, refs: instance.refs };
}
function createDualDOM(context) {
  var instance = dualBlueprint.instantiate(context.document);
  return { root:instance.root, refs:instance.refs };
}

DOMFactory = Object.freeze({ createDefaultDOM:createDefaultDOM, createDualDOM:createDualDOM, blueprint:blueprint, dualBlueprint:dualBlueprint });

function resolvePortal(value, doc) {
  if (value === undefined || value === null) return doc && doc.body ? doc.body : null;
  return DOM.resolveElement(value, doc);
}

var SIZES = ['xs','sm','md','lg','xl'];
function sizeName(value) { return Utils.normalizeSize(value, 'md'); }
function validateHeadlessOptions(options, label) { return FieldHost.validateHeadless(options || {}, label || 'PickerField'); }

function create(options) {
  var opts = Utils.assignOwn({
    size: 'md', disabled: false, readOnly: false, editable: false, clearable: false, draftVisual: false, controlMode: 'input', tags: [], tokenSeparators: [],
    placeholder: '', placement: 'bottom-start', open: false, trigger: 'click',
    closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: false, closeOnEscape: true, focusScope: 'contain', matchReferenceWidth: false, renderControl: true, headless: false
  }, options || {});
  var doc = opts.document || globalThis.document;
  var host = opts.container || null;
  var headlessMode = opts.headless === true;
  var projectionMode = !headlessMode && opts.renderControl === false;
  var dualMode = !headlessMode && !projectionMode && String(opts.controlMode || 'input') === 'dual';
  var portal = resolvePortal(opts.portalContainer, doc);
  if (!portal || !portal.appendChild) throw new TypeError('[QXFRAME9A7C2] PickerField portalContainer must resolve to an Element.');

  var scope = Lifecycle.createScope();
  var binding = null, root = null, controlElement = null, input = null, clearButton = null, toggleElement = null, prefix = null, suffix = null, valueHost = null, segmentsHost = null, triggerTarget = null, draftValueTarget = null;
  var rangeStartHost = null, rangeEndHost = null, rangeSeparatorHost = null;
  var fieldHost = FieldHost.resolve({
    owner:'PickerField', options:opts, document:doc, host:host,
    bindingOptions:{ elements:opts.elements, createDOM:opts.createDOM },
    requiredRefs:dualMode?['root','rangeStart','rangeEnd','rangeSeparator']:['root','input','clear','toggle'],
    defaultFactory:dualMode?DOMFactory.createDualDOM:DOMFactory.createDefaultDOM,
    projectionRefs:[{ref:'valueHost',option:'valueTarget'},{ref:'draftValueTarget',option:'draftValueTarget'},{ref:'input',option:'inputTarget'}]
  });
  binding=fieldHost.binding; root=fieldHost.root; triggerTarget=fieldHost.triggerTarget;
  if (projectionMode) {
    valueHost=fieldHost.refs.valueHost||null; draftValueTarget=fieldHost.refs.draftValueTarget||null; input=fieldHost.refs.input||null;
  } else if (!headlessMode) {
    controlElement=root;
    if (dualMode) {
      rangeStartHost=fieldHost.refs.rangeStart; rangeEndHost=fieldHost.refs.rangeEnd; rangeSeparatorHost=fieldHost.refs.rangeSeparator;
    } else {
      input=fieldHost.refs.input; clearButton=fieldHost.refs.clear; toggleElement=fieldHost.refs.toggle; prefix=fieldHost.refs.prefix||null; suffix=fieldHost.refs.suffix||null; valueHost=fieldHost.refs.valueHost||null; segmentsHost=fieldHost.refs.segments||null;
      if (!host && opts.formField && binding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
      if (!valueHost) { valueHost = doc.createElement('span'); valueHost.className = 'qxframe9a7c2-picker-field-value-host qxframe9a7c2-input-values'; root.insertBefore(valueHost, segmentsHost || input); }
    }
  }
  var panel = doc.createElement('div'), body = doc.createElement('div'), footer = doc.createElement('div');
  var popupFrame = PopupFrame.create({ panel: panel, document: doc });
  scope.add(function () { if (popupFrame) popupFrame.destroy(); popupFrame = null; });
  var triggerSession = null, control = null, focusController = null, keyboard = null, destroyed = false, api = null;
  var displayValue = opts.displayValue == null ? '' : String(opts.displayValue);
  var draftDisplayValue = opts.draftDisplayValue == null ? '' : String(opts.draftDisplayValue);
  var displayPlaceholder = opts.placeholder == null ? '' : String(opts.placeholder);
  var committedValue = opts.committedValue;
  var draftValueSnapshot = draftValueTarget ? (/^(input|textarea|select)$/i.test(String(draftValueTarget.tagName || '')) ? { kind: 'value', value: draftValueTarget.value } : { kind: 'text', value: draftValueTarget.textContent }) : null;
  var tags = Array.isArray(opts.tags) ? opts.tags.slice() : [];
  var rangeDisplayValues = Array.isArray(opts.rangeDisplayValues) ? [String(opts.rangeDisplayValues[0] || ''),String(opts.rangeDisplayValues[1] || '')] : ['', ''];
  var clearVisible = opts.clearVisible === true;
  var footerCleanups = [], footerActionButtons = [];
  var interactionGeneration = 0, navigationActive = false, editorSnapshot = null, editorPointerPending = false, suppressOpenEvent = null;

  if (!projectionMode && !headlessMode) { root.classList.add('qxframe9a7c2-picker-field'); if (dualMode) root.classList.add('is-dual-control'); if (opts.className) root.classList.add(String(opts.className)); }
  panel.className = 'qxframe9a7c2-picker-field-panel qxframe9a7c2-popup-surface is-' + sizeName(opts.size) + (opts.panelClass ? ' ' + String(opts.panelClass) : '');
  panel.hidden = true; body.className = 'qxframe9a7c2-picker-field-body'; footer.className = 'qxframe9a7c2-picker-field-footer';
  panel.appendChild(body);

  function dualSeparator() { return String(opts.rangeSeparator != null ? opts.rangeSeparator : (opts.segmentSeparator != null ? opts.segmentSeparator : ' ~ ')); }
  function dualPlaceholders() {
    var values=Array.isArray(opts.rangePlaceholders)?opts.rangePlaceholders:[];
    return [String(values[0] == null ? '开始日期' : values[0]),String(values[1] == null ? '结束日期' : values[1])];
  }
  function createDualControl() {
    if (!rangeStartHost || !rangeEndHost) throw new TypeError('[QXFRAME9A7C2] PickerField dual control requires start/end hosts.');
    var placeholders=dualPlaceholders();
    if (rangeSeparatorHost) rangeSeparatorHost.textContent=dualSeparator().trim() || '–';
    var startControl=null,endControl=null;
    function common(index) {
      return {
        document:doc, size:opts.size, variant:opts.variant, focusOutline:opts.focusOutline, class:opts.class, style:opts.style, status:opts.status,
        required:opts.required===true, busy:opts.busy===true, disabled:opts.disabled, readOnly:opts.readOnly, editable:opts.editable,
        clearVisibility:'interaction', draftVisual:opts.draftVisual===true, placeholder:placeholders[index], inputValue:rangeDisplayValues[index] || '',
        expanded:false
      };
    }
    var startOptions=Utils.assignOwn(common(0),{
      container:rangeStartHost, formField:opts.formField, committedValue:opts.committedValue, serializeValue:opts.serializeValue, name:opts.name,
      prefix:opts.prefix, clearable:false, toggleVisible:false,
      onInput:function(value,event){rangeDisplayValues[0]=String(value||'');displayValue=rangeDisplayValues.join(dualSeparator());if(typeof opts.onInput==='function')opts.onInput(displayValue,event,api);},
      onFocus:function(event){if(typeof opts.onRangePartFocus==='function')opts.onRangePartFocus(0,event,api);if(typeof opts.onFocus==='function')opts.onFocus(event,api);},
      onBlur:function(event){if(typeof opts.onBlur==='function')opts.onBlur(event,api);}
    });
    var endOptions=Utils.assignOwn(common(1),{
      container:rangeEndHost, suffix:opts.suffix, clearable:opts.clearable, toggleVisible:true, toggle:opts.toggle,
      onInput:function(value,event){rangeDisplayValues[1]=String(value||'');displayValue=rangeDisplayValues.join(dualSeparator());if(typeof opts.onInput==='function')opts.onInput(displayValue,event,api);},
      onFocus:function(event){if(typeof opts.onRangePartFocus==='function')opts.onRangePartFocus(1,event,api);if(typeof opts.onFocus==='function')opts.onFocus(event,api);},
      onBlur:function(event){if(typeof opts.onBlur==='function')opts.onBlur(event,api);},
      onClearRequest:function(event){if(typeof opts.onClearRequest==='function')opts.onClearRequest(event,api);}
    });
    startControl=Control.create(startOptions); endControl=Control.create(endOptions);
    function inputs(){return [startControl.getInputElement(),endControl.getInputElement()].filter(Boolean);}
    function focusTarget(){var active=doc&&doc.activeElement;var list=inputs();return list.indexOf(active)>=0?active:(list[0]||null);}
    function setRange(values){rangeDisplayValues=Array.isArray(values)?[String(values[0]||''),String(values[1]||'')]:['',''];startControl.setInputValue(rangeDisplayValues[0]);endControl.setInputValue(rangeDisplayValues[1]);return facade;}
    function updateDual(next) {
      var n=next||{}, ph=dualPlaceholders();
      var commonNext={size:n.size,variant:n.variant,focusOutline:n.focusOutline,class:n.class,style:n.style,status:n.status,required:n.required,busy:n.busy,disabled:n.disabled,readOnly:n.readOnly,editable:n.editable,draftVisual:n.draftVisual,expanded:n.expanded};
      Object.keys(commonNext).forEach(function(k){if(commonNext[k]===undefined)delete commonNext[k];});
      startControl.updateOptions(Utils.assignOwn(commonNext,{prefix:opts.prefix,placeholder:ph[0],clearable:false,toggleVisible:false}));
      endControl.updateOptions(Utils.assignOwn(commonNext,{suffix:opts.suffix,placeholder:ph[1],clearable:opts.clearable,hasValue:clearVisible,toggleVisible:true,toggle:opts.toggle}));
      if(rangeSeparatorHost)rangeSeparatorHost.textContent=dualSeparator().trim()||'–';
      return facade;
    }
    var facade={
      focus:function(options){var target=focusTarget();return !!(target&&DOM.focusElement(target,options||{preventScroll:true}));},
      blur:function(){var target=focusTarget();if(!target||!target.blur)return false;target.blur();return true;},
      setDisplayValue:function(value){displayValue=value==null?'':String(value);return facade;},
      setInputValue:function(value){displayValue=value==null?'':String(value);return facade;},
      setRangeValues:setRange,setSegmentValues:setRange,setTags:function(){return facade;},
      setCommittedValue:function(value,meta){startControl.setCommittedValue(value,meta);return facade;},
      onValueChange:function(listener){return startControl.onValueChange(listener);},onFormReset:function(listener){return startControl.onFormReset(listener);},
      setCustomValidity:function(message){startControl.setCustomValidity(message);return facade;},checkValidity:function(){return startControl.checkValidity();},reportValidity:function(){return startControl.reportValidity();},
      setHasValue:function(value){clearVisible=value===true;startControl.setHasValue(false);endControl.setHasValue(clearVisible);return facade;},
      setExpanded:function(value){startControl.setExpanded(value);endControl.setExpanded(value);return facade;},
      setDraftDisplayValue:function(){return facade;},setDraftVisual:function(value){opts.draftVisual=value===true;startControl.setDraftVisual(opts.draftVisual);endControl.setDraftVisual(opts.draftVisual);return facade;},
      updateOptions:updateDual,getCommittedValue:function(){return startControl.getCommittedValue();},getSerializedValue:function(){return startControl.getSerializedValue();},getFormField:function(){return startControl.getFormField();},
      getState:function(){return Object.freeze({mode:'dual',rangeValues:rangeDisplayValues.slice(),draftVisual:opts.draftVisual===true});},
      getRootElement:function(){return root;},getControlElement:function(){return root;},getFocusElement:focusTarget,getInputElement:focusTarget,getInputElements:inputs,
      getTags:function(){return null;},getDOMSource:function(){return 'picker-dual';},
      destroy:function(reason){var a=startControl&&startControl.destroy(reason),b=endControl&&endControl.destroy(reason);startControl=endControl=null;return !!(a||b);}
    };
    return facade;
  }

  control = headlessMode ? null : projectionMode ? Control.createProjection({
    document: doc, reference: root, valueTarget: valueHost, inputTarget: input, formTarget: opts.formTarget, formField: opts.formField, name: opts.name, committedValue: opts.committedValue, serializeValue: opts.serializeValue,
    mode: opts.controlMode || 'input', tags: tags, displayValue: displayValue, inputValue: displayValue, editable: opts.editable === true, disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true, draftDisplayValue: draftDisplayValue, draftVisual: opts.draftVisual === true, placeholder: displayPlaceholder,
    onInput: function (value, event) { displayValue = value; if (typeof opts.onInput === 'function') opts.onInput(value, event, api); },
    onBlur: function (event) { if (typeof opts.onBlur === 'function') opts.onBlur(event, api); },
  }) : dualMode ? createDualControl() : Control.create({
    elements: { root: root, valueHost: valueHost, segments:segmentsHost, input: input, clear: clearButton, toggle: toggleElement, prefix: prefix, suffix: suffix },
    document: doc, formField: opts.formField, committedValue: opts.committedValue, serializeValue: opts.serializeValue, mode: opts.controlMode || 'input', tags: tags, creatableTags:opts.creatableTags===true,tagsControlled:true, tokenSeparators: opts.tokenSeparators, tokenizeOnPaste: opts.tokenizeOnPaste !== false, addOnEnter: opts.addOnEnter !== false, addOnTab: opts.addOnTab === true, addOnBlur: opts.addOnBlur === true,
    segments:opts.segments,segmentValues:opts.segmentValues,segmentSeparator:opts.segmentSeparator,valueAdapter:opts.valueAdapter,formatSegment:opts.formatSegment,
    size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, class:opts.class, style:opts.style, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, editable: opts.editable,
    clearable: opts.clearable, clearVisibility: 'interaction', hasValue: clearVisible, draftDisplayValue: draftDisplayValue, draftVisual: opts.draftVisual === true, inputValue: displayValue,
    placeholder: displayPlaceholder, expanded: false, toggleVisible: true, toggle: opts.toggle,
    onInput: function (value, event) { displayValue = value; if (typeof opts.onInput === 'function') opts.onInput(value, event, api); },
    onSegmentInput:function(values,detail){rangeDisplayValues=values.slice();displayValue=rangeDisplayValues.join(String(opts.segmentSeparator==null?'':opts.segmentSeparator));if(typeof opts.onInput==='function')opts.onInput(displayValue,detail&&detail.originalEvent||null,api);if(typeof opts.onSegmentInput==='function')opts.onSegmentInput(values,detail,api);},
    onSegmentFocus:function(detail){if(typeof opts.onRangePartFocus==='function')opts.onRangePartFocus(detail.index,detail.originalEvent,api);},
    onFocus:function(event){if(typeof opts.onFocus==='function')opts.onFocus(event,api);},
    onBlur: function (event) { if (typeof opts.onBlur === 'function') opts.onBlur(event, api); },
    onTagRemove: function (tag, detail) { tags = detail && Array.isArray(detail.tags) ? detail.tags.slice() : tags; if (typeof opts.onTagRemove === 'function') opts.onTagRemove(tag, detail, api); },
    onClearRequest: function (event) { if (typeof opts.onClearRequest === 'function') opts.onClearRequest(event, api); }
  });


  function interactionPolicy() {
    return CapabilityController.resolve({ disabled: opts.disabled === true, readOnly: opts.readOnly === true, loading: opts.busy === true }, {
      activateWhenReadOnly: true,
      preserveFocusWhileLoading: true,
      tabbableWhileLoading: true
    });
  }
  function canActivatePicker() { return interactionPolicy().activatable; }
  function canEditSelector() { return opts.editable === true && interactionPolicy().editable; }

  function focusElement() {
    if (control && control.getFocusElement) return control.getFocusElement();
    return triggerTarget || root || null;
  }
  function editorElements() {
    if (control && control.getInputElements) return control.getInputElements();
    var editor=control&&control.getInputElement?control.getInputElement():input;
    return editor?[editor]:[];
  }
  function editorElement() {
    var list=editorElements(),active=doc&&doc.activeElement;
    return list.indexOf(active)>=0?active:(list[0]||null);
  }
  function isSelectorEditor(target) { return editorElements().indexOf(target)>=0; }
  function captureEditorSnapshot() {
    var editor = editorElement();
    if (!editor || editor.value === undefined) return null;
    var snapshot = { value:String(editor.value || ''), selectionStart:null, selectionEnd:null, selectionDirection:null };
    try {
      snapshot.selectionStart = typeof editor.selectionStart === 'number' ? editor.selectionStart : null;
      snapshot.selectionEnd = typeof editor.selectionEnd === 'number' ? editor.selectionEnd : null;
      snapshot.selectionDirection = editor.selectionDirection || null;
    } catch (_) {}
    return snapshot;
  }
  function restoreSelection(snapshot) {
    var editor = editorElement();
    if (!editor || !snapshot || snapshot.selectionStart === null || !Utils.isFunction(editor.setSelectionRange)) return false;
    var length = String(editor.value || '').length;
    var start = Math.max(0, Math.min(length, Number(snapshot.selectionStart) || 0));
    var end = Math.max(start, Math.min(length, Number(snapshot.selectionEnd) || start));
    try { editor.setSelectionRange(start, end, snapshot.selectionDirection || 'none'); return true; } catch (_) { return false; }
  }
  function projectDisplayValue(value) {
    var text = value == null ? '' : String(value);
    if (!control) { var editor = editorElement(); if (editor && editor.value !== undefined) editor.value = text; return; }
    control.setDisplayValue(text);
    if (!projectionMode && (String(opts.controlMode || 'input') === 'input' || String(opts.controlMode || 'input') === 'tags')) control.setInputValue(text);
    else if (projectionMode && editorElement() && opts.editable === true) control.setInputValue(text);
  }
  function projectNavigationVisual(value) {
    if (!navigationActive || projectionMode || !control) return false;
    // Token/tag controls project candidate values through their tag collection. Writing a
    // formatted aggregate value into the token editor creates a second, incorrect visual
    // projection (draft tags + summary text) and can overwrite an in-progress editor buffer.
    if (String(opts.controlMode || 'input') === 'tags') return false;
    var editor = editorElement();
    if (!editor || editor.value === undefined) return false;
    var text = value == null ? '' : String(value);
    // Keep Control's internal input projection in sync with the visible navigation draft.
    // A raw DOM write is transient and can be overwritten by the next Control projection.
    if (control.setInputValue) control.setInputValue(text);
    else if (String(editor.value || '') !== text) editor.value = text;
    return true;
  }
  function beginNavigationInteraction() {
    if (navigationActive) return false;
    interactionGeneration += 1;
    editorSnapshot = captureEditorSnapshot();
    navigationActive = true;
    return true;
  }
  function preserveEditorForReason(reason) {
    var value = String(reason || '');
    return value === 'escape' || value === 'cancel' || value === 'editor-intent' || value === 'editor-pointer' || value === 'editor-context' || (canEditSelector() && (value === 'outside' || value === 'focus-outside'));
  }
  function endNavigationInteraction(detail) {
    if (!navigationActive) return false;
    var snapshot = editorSnapshot;
    navigationActive = false;
    var closeReason = String(detail && detail.reason || '');
    if (closeReason !== 'editor-pointer') editorPointerPending = false;
    // Same-gesture suppression is only needed for pointerdown -> click. Never retain
    // a ContextMenuEvent beyond the logical close lifecycle.
    suppressOpenEvent = null;
    if (preserveEditorForReason(closeReason) && snapshot) {
      projectDisplayValue(snapshot.value);
      restoreSelection(snapshot);
    } else {
      projectDisplayValue(displayValue);
    }
    editorSnapshot = null;
    return true;
  }
  function navigationOwnsEvent(event) {
    return !!(navigationActive && triggerSession && triggerSession.getState().open && event && isSelectorEditor(event.target));
  }
  function editorIntentKeydown(event) {
    if (!event || !navigationOwnsEvent(event) || !canEditSelector() || KeyboardNavigation.isComposing(event)) return false;
    var key = String(event.key || '');
    if (key === 'Backspace' || key === 'Delete') return true;
    if ((event.ctrlKey || event.metaKey || event.altKey) && (key.indexOf('Arrow') === 0 || key === 'Home' || key === 'End')) return true;
    if ((event.ctrlKey || event.metaKey) && ['a','A','z','Z','y','Y','x','X','v','V'].indexOf(key) >= 0) return true;
    return false;
  }
  function pointerWillMoveFocus(target) {
    var node = target && target.nodeType === 1 ? target : target && target.parentElement;
    while (node && node !== doc.body) {
      var tag = String(node.tagName || '').toLowerCase();
      if (node.disabled !== true) {
        if (node.tabIndex >= 0 || tag === 'button' || tag === 'select' || tag === 'textarea' || (tag === 'input' && String(node.type || '').toLowerCase() !== 'hidden') || (tag === 'a' && node.hasAttribute && node.hasAttribute('href')) || node.isContentEditable === true) return true;
      }
      node = node.parentElement;
    }
    return false;
  }
  function shouldRestoreFocus(detail) {
    if (!detail) return false;
    var reason = String(detail.reason || '');
    if (reason === 'focus-outside' || reason === 'tab-exit') return false;
    if (reason === 'escape') return true;
    if (reason === 'outside') return !pointerWillMoveFocus(detail.originalEvent && detail.originalEvent.target);
    var active = doc && doc.activeElement;
    return !!(active && panel && (active === panel || (panel.contains && panel.contains(active))));
  }
  function restoreFocusAfterLogicalClose(detail) {
    if (destroyed || !shouldRestoreFocus(detail)) return false;
    var target = focusElement();
    if (!target) return false;
    return DOM.focusElement(target, { preventScroll: true });
  }

  function emitOpen(opened, detail) {
    if (!projectionMode && !headlessMode) root.classList.toggle('is-open', opened);
    if (control) control.setExpanded(opened);
    return OpenStateBridge.dispatch(opened, detail, {
      decorate:function(){return {field:api};},
      onChange:function(value,payload){if(typeof opts.onOpenChange==='function')opts.onOpenChange(value,payload);}
    });
  }

  var popupRuntime = PopupRuntime.create({
    reference: root,
    triggerTarget: headlessMode ? triggerTarget : (projectionMode ? triggerTarget : (triggerTarget || root)),
    floating: panel,
    document: doc,
    portalContainer: portal,
    trigger: opts.trigger,
    keyboardActivation: false,
    placement: opts.placement,
    transition: PopupRuntime.motion.popupPlacement,
    strategy: opts.strategy || 'absolute',
    middleware: opts.middleware,
    matchReferenceWidth: opts.matchReferenceWidth === true,
    autoUpdate: opts.autoUpdate !== false,
    closeOnOutsidePress: opts.closeOnOutsidePress !== false,
    closeOnFocusOutside: opts.closeOnFocusOutside !== false,
    closeOnTabExit: opts.closeOnTabExit === true,
    focusScope: opts.focusScope,
    tabExitTarget: focusElement,
    closeOnEscape: opts.closeOnEscape !== false,
    restoreFocus: false,
    destroyOnClose: opts.destroyOnClose !== false,
    openDelay: opts.openDelay,
    closeDelay: opts.closeDelay,
    disabled: !canActivatePicker(),
    beforeOpen: function (detail) {
      if (destroyed || !canActivatePicker()) return false;
      if (suppressOpenEvent && detail && detail.originalEvent === suppressOpenEvent) { suppressOpenEvent = null; return false; }
      if (typeof opts.beforeOpen === 'function') return opts.beforeOpen(detail);
    },
    beforeClose: function (detail) { if (typeof opts.beforeClose === 'function') return opts.beforeClose(detail); },
    onOpen: function (detail) { beginNavigationInteraction(); if (typeof opts.onOpen === 'function') opts.onOpen(detail); if (!destroyed) emitOpen(true, detail); },
    onClose: function (detail) { if (typeof opts.onClose === 'function') opts.onClose(detail); if (!destroyed) { endNavigationInteraction(detail); if (keyboard && keyboard.virtualFocus) keyboard.virtualFocus.clear({ modality:keyboard.virtualFocus.getState().modality }); restoreFocusAfterLogicalClose(detail); emitOpen(false, detail); } },
    afterOpen: function (detail) { if (typeof opts.afterOpen === 'function') opts.afterOpen(detail); },
    afterClose: function (detail) { if (typeof opts.afterClose === 'function') opts.afterClose(detail); },
    popupFrame: popupFrame
  });
  triggerSession = popupRuntime.trigger;

  if (root) scope.add(DOM.listen(root, 'click', function (event) {
    if (!editorPointerPending || !isSelectorEditor(event.target)) return;
    suppressOpenEvent = event;
    editorPointerPending = false;
  }, true));
  editorElements().forEach(function(selectorEditor){
    scope.add(DOM.listen(selectorEditor, 'pointerdown', function (event) {
      editorPointerPending = false;
      if (!navigationOwnsEvent(event) || !canEditSelector()) return;
      editorPointerPending = true;
      close('editor-pointer', event);
    }));
    scope.add(DOM.listen(selectorEditor, 'pointercancel', function () { editorPointerPending = false; suppressOpenEvent = null; }));
    scope.add(DOM.listen(selectorEditor, 'beforeinput', function (event) { if (navigationOwnsEvent(event) && canEditSelector()) close('editor-intent', event); }));
    scope.add(DOM.listen(selectorEditor, 'compositionstart', function (event) { if (navigationOwnsEvent(event) && canEditSelector()) close('editor-intent', event); }));
    scope.add(DOM.listen(selectorEditor, 'paste', function (event) { if (navigationOwnsEvent(event) && canEditSelector()) close('editor-intent', event); }));
    scope.add(DOM.listen(selectorEditor, 'cut', function (event) { if (navigationOwnsEvent(event) && canEditSelector()) close('editor-intent', event); }));
    scope.add(DOM.listen(selectorEditor, 'contextmenu', function (event) { if (navigationOwnsEvent(event) && canEditSelector()) close('editor-context', event); }));
    scope.add(DOM.listen(selectorEditor, 'keydown', function (event) { if (editorIntentKeydown(event)) close('editor-intent', event); }));
  });

  function routeOwnedNavigation(detail) {
    if (typeof opts.onKeydown === 'function') opts.onKeydown(detail.originalEvent, api);
    return true;
  }

  function clearFromKeyboard(detail) {
    var event = detail && detail.originalEvent;
    if (!event || opts.editable === true || opts.clearable !== true || clearVisible !== true) return false;
    if (interactionPolicy().clearable !== true || typeof opts.onClearRequest !== 'function') return false;
    opts.onClearRequest(event, api);
    return true;
  }

  focusController = FocusController.create({
    root: dualMode ? root : focusElement(),
    focusRoot: focusElement,
    manageTabIndex: false,
    navigation: {
    editableKeys: ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Backspace','Delete','Enter','Escape','Home','End','PageUp','PageDown','F6'],
    allowEditableKey: function (key, detail) {
      var event = detail && detail.originalEvent;
      if (!event) return false;
      if (navigationOwnsEvent(event)) {
        if (key === 'Backspace' || key === 'Delete') return opts.editable !== true && opts.clearable === true && clearVisible === true && interactionPolicy().clearable === true;
        if ((event.ctrlKey || event.metaKey || event.altKey) && (key.indexOf('Arrow') === 0 || key === 'Home' || key === 'End')) return false;
        return true;
      }
      if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Backspace' || key === 'Delete' || key === 'Home' || key === 'End') return opts.editable !== true || !KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target);
      return true;
    },
    handlers: {
      ArrowDown: function (detail) { if (!triggerSession.getState().open && canActivatePicker()) return open('keyboard-down', detail.originalEvent); return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      ArrowUp: function (detail) { if (!triggerSession.getState().open && canActivatePicker()) return open('keyboard-up', detail.originalEvent); return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      Escape: function (detail) { if (triggerSession.getState().open && opts.closeOnEscape !== false) return close('escape', detail.originalEvent); return typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false; },
      ArrowLeft: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      ArrowRight: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      Backspace: function (detail) { return clearFromKeyboard(detail); },
      Delete: function (detail) { return clearFromKeyboard(detail); },
      Enter: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      Home: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      End: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      PageUp: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      PageDown: function (detail) { return navigationOwnsEvent(detail.originalEvent) ? routeOwnedNavigation(detail) : (typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false); },
      F6: function (detail) { return typeof opts.onKeydown === 'function' ? opts.onKeydown(detail.originalEvent, api) === true : false; }
    }
  }
  });
  keyboard = focusController.keyboard;
  scope.add(function () { if (focusController) focusController.destroy(); focusController = null; keyboard = null; });

  function syncControl() {
    if (!control) return;
    var editorValue = navigationActive && editorSnapshot ? editorSnapshot.value : displayValue;
    var controlOptions={ tags:tags,creatableTags:opts.creatableTags===true,tagsControlled:true,tokenSeparators:opts.tokenSeparators,tokenizeOnPaste:opts.tokenizeOnPaste!==false,addOnEnter:opts.addOnEnter!==false,addOnTab:opts.addOnTab===true,addOnBlur:opts.addOnBlur===true,size:opts.size,variant:opts.variant,focusOutline:opts.focusOutline,class:opts.class, style:opts.style,status:opts.status,prefix:opts.prefix,suffix:opts.suffix,required:opts.required===true,name:opts.name,busy:opts.busy===true,disabled:opts.disabled,readOnly:opts.readOnly,editable:opts.editable,clearable:opts.clearable,clearVisibility:'interaction',draftDisplayValue:draftDisplayValue,draftVisual:opts.draftVisual===true,placeholder:displayPlaceholder,hasValue:clearVisible,toggleVisible:true,toggle:opts.toggle,expanded:!!(triggerSession&&triggerSession.getState().open)};
    if(!dualMode){controlOptions.mode=opts.controlMode||'input';controlOptions.inputValue=editorValue;}
    control.updateOptions(controlOptions);
    if (navigationActive) projectNavigationVisual(opts.draftVisual === true ? draftDisplayValue : displayValue);
  }
  function writeExternalValue(target, value) { if (!target) return; var text = value == null ? '' : String(value); if (/^(input|textarea|select)$/i.test(String(target.tagName || ''))) target.value = text; else target.textContent = text; }
  function setRangeDisplayValues(values) {
    rangeDisplayValues=Array.isArray(values)?[String(values[0]||''),String(values[1]||'')]:['',''];
    if(control&&control.setRangeValues)control.setRangeValues(rangeDisplayValues);
    else if(control&&control.setSegmentValues)control.setSegmentValues(rangeDisplayValues);
    return api;
  }
  function setDisplayValue(value) {
    displayValue = value == null ? '' : String(value);
    // Built-in controls protect their editor caret through projectNavigationVisual().
    // Authored projection controls have no framework-owned editor mirror, so their
    // valueTarget/inputTarget must keep following the live picker visual projection.
    if (!navigationActive || projectionMode) projectDisplayValue(displayValue);
    return api;
  }
  function setDraftDisplayValue(value) {
    draftDisplayValue = value == null ? '' : String(value);
    if (projectionMode) writeExternalValue(draftValueTarget, draftDisplayValue);
    else if (control && control.setDraftDisplayValue) control.setDraftDisplayValue(draftDisplayValue);
    if (!projectionMode && navigationActive && opts.draftVisual === true) projectNavigationVisual(draftDisplayValue);
    return api;
  }
  function setPlaceholder(value) { displayPlaceholder = value == null ? '' : String(value); if (control) control.updateOptions({ placeholder: displayPlaceholder }); return api; }
  function setCommittedValue(value, meta) {
    var detail = meta || { silent: true, source: 'picker', reason: 'projection' };
    committedValue = value;
    if (navigationActive && editorSnapshot && String(detail.reason || 'projection') !== 'projection') {
      editorSnapshot.value = displayValue;
      var nextLength = editorSnapshot.value.length;
      editorSnapshot.selectionStart = nextLength;
      editorSnapshot.selectionEnd = nextLength;
      editorSnapshot.selectionDirection = 'none';
    }
    if (control) control.setCommittedValue(value, detail);
    return api;
  }
  function setTags(value) { tags = Array.isArray(value) ? value.slice() : []; if (control) control.setTags(tags); return api; }
  function setClearVisible(value) { clearVisible = value === true; if (control) control.setHasValue(clearVisible); return api; }
  function setDraftVisual(value) {
    opts.draftVisual = value === true;
    if (control && control.setDraftVisual) control.setDraftVisual(opts.draftVisual);
    if (navigationActive) projectNavigationVisual(opts.draftVisual ? draftDisplayValue : displayValue);
    return api;
  }
  function open(reason, event) { return destroyed || !canActivatePicker() ? false : triggerSession.open(reason || 'api', event || null); }
  function close(reason, event) { return destroyed ? false : triggerSession.close(reason || 'api', event || null); }
  function setOpen(value, reason, event) { return value === true ? open(reason || 'set-open', event) : close(reason || 'set-open', event); }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    var previousConfiguredPlaceholder = opts.placeholder == null ? '' : String(opts.placeholder);
    OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless'], 'PickerField field binding');
    Utils.copyOwn(opts, next);
    SIZES.forEach(function (size) { panel.classList.remove('is-' + size); });
    panel.classList.add('is-' + sizeName(opts.size));
    if (Object.prototype.hasOwnProperty.call(next, 'placeholder') && displayPlaceholder === previousConfiguredPlaceholder) displayPlaceholder = opts.placeholder == null ? '' : String(opts.placeholder);
    if (Object.prototype.hasOwnProperty.call(next, 'displayValue')) displayValue = next.displayValue == null ? '' : String(next.displayValue);
    if (Object.prototype.hasOwnProperty.call(next, 'draftDisplayValue')) setDraftDisplayValue(next.draftDisplayValue);
    if (Object.prototype.hasOwnProperty.call(next, 'tags')) tags = Array.isArray(next.tags) ? next.tags.slice() : [];
    if (Object.prototype.hasOwnProperty.call(next, 'clearVisible')) clearVisible = next.clearVisible === true;
    triggerSession.updateOptions({
      trigger: opts.trigger, keyboardActivation: false,
      placement: opts.placement,
      strategy: opts.strategy || 'absolute',
      middleware: opts.middleware,
      matchReferenceWidth: opts.matchReferenceWidth === true,
      autoUpdate: opts.autoUpdate !== false,
      closeOnOutsidePress: opts.closeOnOutsidePress !== false,
      closeOnFocusOutside: opts.closeOnFocusOutside !== false,
      closeOnTabExit: opts.closeOnTabExit === true,
      focusScope: opts.focusScope,
      tabExitTarget: focusElement,
      closeOnEscape: opts.closeOnEscape !== false,
      restoreFocus: false,
      destroyOnClose: opts.destroyOnClose !== false,
      openDelay: opts.openDelay,
      closeDelay: opts.closeDelay,
      disabled: !canActivatePicker()
    });
    syncFooterTabStops();
    syncControl();
    if (Object.prototype.hasOwnProperty.call(next, 'committedValue')) setCommittedValue(next.committedValue, { silent: true, source: 'options', reason: 'options-committed-value' });
    if (Object.prototype.hasOwnProperty.call(next, 'open')) setOpen(next.open === true, 'update-options');
    else if (!canActivatePicker() && triggerSession.getState().open) close(opts.busy === true ? 'loading' : 'disabled');
    else if (triggerSession.getState().open) triggerSession.reposition('options');
    return api;
  }
  function footerActionTabIndex() { return opts.focusScope && opts.focusScope !== 'none' ? 0 : -1; }
  function syncFooterTabStops() { footerActionButtons.forEach(function (button) { if (button && button.isConnected !== false) button.tabIndex = footerActionTabIndex(); }); }
  function appendFooterContent(parent, content) {
    if (content === undefined || content === null || content === false) return;
    if (content && content.nodeType) { parent.appendChild(content); return; }
    if (Array.isArray(content)) { content.forEach(function (item) { appendFooterContent(parent, item); }); return; }
    var span = doc.createElement('span'); span.textContent = String(content); parent.appendChild(span);
  }
  function createFooter(actions) {
    footerCleanups.splice(0).forEach(function (cleanup) { cleanup(); }); footerActionButtons = []; footer.textContent = '';
    var config = actions || {};
    function keepFieldFocus(event) { if (event && event.preventDefault) event.preventDefault(); }
    function bindAction(button, handler) {
      footerCleanups.push(DOM.listen(button, 'mousedown', keepFieldFocus));
      footerCleanups.push(DOM.listen(button, 'click', handler));
    }
    if (config.startContent !== undefined && config.startContent !== null && config.startContent !== false) {
      var start = doc.createElement('div'); start.className = 'qxframe9a7c2-picker-field-footer-start'; appendFooterContent(start, config.startContent); footer.appendChild(start);
    }
    var actionsHost = doc.createElement('div'); actionsHost.className = 'qxframe9a7c2-picker-field-footer-actions';
    if (config.actionStartContent !== undefined && config.actionStartContent !== null && config.actionStartContent !== false) appendFooterContent(actionsHost, config.actionStartContent);
    if (config.cancel) { var cancel = doc.createElement('button'); cancel.type='button'; cancel.tabIndex=footerActionTabIndex(); footerActionButtons.push(cancel); cancel.className='qxframe9a7c2-button is-default is-outlined is-' + sizeName(opts.size); cancel.textContent=config.cancelLabel===undefined?'取消':String(config.cancelLabel); bindAction(cancel,function(event){config.cancel(event);}); actionsHost.appendChild(cancel); }
    if (config.confirm) { var confirm = doc.createElement('button'); confirm.type='button'; confirm.tabIndex=footerActionTabIndex(); footerActionButtons.push(confirm); confirm.className='qxframe9a7c2-button is-primary is-solid is-' + sizeName(opts.size); confirm.textContent=config.confirmLabel===undefined?'确认':String(config.confirmLabel); confirm.disabled=config.confirmDisabled===true; bindAction(confirm,function(event){if (!confirm.disabled) config.confirm(event);}); actionsHost.appendChild(confirm); }
    if (actionsHost.firstChild) footer.appendChild(actionsHost);
    if (config.endContent !== undefined && config.endContent !== null && config.endContent !== false) {
      var end = doc.createElement('div'); end.className = 'qxframe9a7c2-picker-field-footer-end'; appendFooterContent(end, config.endContent); footer.appendChild(end);
    }
    if (footer.firstChild) panel.appendChild(footer); else if (footer.parentNode) footer.parentNode.removeChild(footer);
    return footer;
  }
  function createConfirmFooter(config) {
    var value = config || {}, visible = value.footer !== false, needsConfirm = value.needConfirm === true;
    return createFooter({
      startContent: visible ? value.startContent : null,
      actionStartContent: visible && needsConfirm ? value.actionStartContent : null,
      endContent: visible ? value.endContent : null,
      cancel: visible && (value.showCancel === true || needsConfirm) ? value.cancel : null,
      confirm: visible && needsConfirm ? value.confirm : null,
      cancelLabel: value.cancelLabel === undefined ? '取消' : value.cancelLabel,
      confirmLabel: value.confirmLabel === undefined ? '确认' : value.confirmLabel,
      confirmDisabled: value.confirmDisabled === true
    });
  }

  api = Object.freeze({
    open: open, close: close, toggle: function (reason,event) { return destroyed || !canActivatePicker() ? false : triggerSession.toggle(reason || 'api', event || null); }, setOpen: setOpen,
    setDisplayValue:setDisplayValue, setRangeDisplayValues:setRangeDisplayValues, setDraftDisplayValue:setDraftDisplayValue, setPlaceholder:setPlaceholder, setCommittedValue:setCommittedValue, setTags:setTags, setClearVisible:setClearVisible, setDraftVisual:setDraftVisual, createFooter:createFooter, createConfirmFooter:createConfirmFooter,
    reposition: function () { return destroyed ? false : triggerSession.reposition('api'); }, updateOptions: updateOptions, focus: function () { if (control) return control.focus(); return DOM.focusElement(triggerTarget || root, { preventScroll: true }); },
    getState: function () { return Object.freeze({ open: !!(triggerSession && triggerSession.getState().open), displayValue: displayValue, draftDisplayValue: draftDisplayValue, placeholder: displayPlaceholder, draftVisual: opts.draftVisual === true, hasDraftValueTarget: !!draftValueTarget, renderControl: !projectionMode && !headlessMode, projection: projectionMode, headless: headlessMode, disabled: opts.disabled === true, readOnly: opts.readOnly === true, loading: opts.busy === true, focusScope: opts.focusScope, interactionMode: navigationActive ? 'navigation' : 'text', keyboardOwner: navigationActive ? 'picker' : 'editor', editorSuspended: navigationActive, interactionGeneration: interactionGeneration, destroyed: destroyed }); },
    getRootElement:function(){return root;}, getControlElement:function(){return control?control.getControlElement():controlElement;}, getInputElement:function(){return editorElement();}, getInputElements:function(){return editorElements();}, getDraftValueElement:function(){return draftValueTarget;},
    getPanelElement: function () { return panel; }, getPanelHost: function () { return body; }, getFooterElement: function () { return footer; },
    getPopupFrame: function () { return popupFrame; }, getPopupScroll: function () { return popupFrame ? popupFrame.getPrimaryScroll() : null; },
    getControl: function () { return control; }, getKeyboardNavigation: function () { return keyboard; }, getFocusController: function () { return focusController; }, getFormField: function () { return control ? control.getFormField() : null; }, getCommittedValue: function () { return control ? control.getCommittedValue() : committedValue; }, getTrigger: function () { return triggerSession; },
    destroy: function (reason) {
      if (destroyed) return false; scope.dispose(); footerCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
      if (triggerSession) triggerSession.destroy(reason || 'picker-field-destroy'); triggerSession = null;
      destroyed = true;
      if (control) control.destroy(reason || 'picker-field-destroy'); control = null; DOM.removeNode(panel); if (binding) binding.release(); binding = null;
      if (draftValueTarget && draftValueSnapshot) { if (draftValueSnapshot.kind === 'value') draftValueTarget.value = draftValueSnapshot.value; else draftValueTarget.textContent = draftValueSnapshot.value; }
      navigationActive = false; editorSnapshot = null; editorPointerPending = false; suppressOpenEvent = null;
      root = controlElement = valueHost = segmentsHost = input = clearButton = toggleElement = body = footer = panel = triggerTarget = draftValueTarget = rangeStartHost = rangeEndHost = rangeSeparatorHost = null; draftValueSnapshot = null; return true;
    }
  });

  syncControl(); setDraftDisplayValue(draftDisplayValue); if (opts.open === true) open('initial'); return api;
}

export const PickerField = Object.freeze({ create, validateHeadlessOptions, createDefaultDOM: DOMFactory.createDefaultDOM });
