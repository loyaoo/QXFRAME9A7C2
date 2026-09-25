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
import { Trigger } from './trigger.js';

let DOMFactory;
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-picker-field qxframe9a7c2-picker-field-control qxframe9a7c2-input qxframe9a7c2-group-control" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-picker-field-prefix qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
    <span class="qxframe9a7c2-picker-field-value-host qxframe9a7c2-input-values" data-qxframe9a7c2-ref="value-host"></span>
    <input class="qxframe9a7c2-picker-field-input qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
    <span class="qxframe9a7c2-picker-field-suffix qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix">
      <button class="qxframe9a7c2-picker-field-clear qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button>
      <span class="qxframe9a7c2-picker-field-toggle qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span>
    </span>
  </div>`;

function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  instance.refs.control = instance.root;
  return { root: instance.root, refs: instance.refs };
}

DOMFactory = Object.freeze({ createDefaultDOM: createDefaultDOM, blueprint: blueprint });

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
  var portal = resolvePortal(opts.portalContainer, doc);
  if (!portal || !portal.appendChild) throw new TypeError('[QXFRAME9A7C2] PickerField portalContainer must resolve to an Element.');

  var scope = Lifecycle.createScope();
  var binding = null, root = null, controlElement = null, input = null, clearButton = null, toggleElement = null, prefix = null, suffix = null, valueHost = null, triggerTarget = null, draftValueTarget = null;
  var fieldHost = FieldHost.resolve({
    owner:'PickerField', options:opts, document:doc, host:host,
    bindingOptions:{ elements:opts.elements, createDOM:opts.createDOM }, requiredRefs:['root','input','clear','toggle'], defaultFactory:DOMFactory.createDefaultDOM,
    projectionRefs:[{ref:'valueHost',option:'valueTarget'},{ref:'draftValueTarget',option:'draftValueTarget'},{ref:'input',option:'inputTarget'}]
  });
  binding=fieldHost.binding; root=fieldHost.root; triggerTarget=fieldHost.triggerTarget;
  if (projectionMode) {
    valueHost=fieldHost.refs.valueHost||null; draftValueTarget=fieldHost.refs.draftValueTarget||null; input=fieldHost.refs.input||null;
  } else if (!headlessMode) {
    controlElement=root; input=fieldHost.refs.input; clearButton=fieldHost.refs.clear; toggleElement=fieldHost.refs.toggle; prefix=fieldHost.refs.prefix||null; suffix=fieldHost.refs.suffix||null; valueHost=fieldHost.refs.valueHost||null;
    if (!host && opts.formField && binding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
    if (!valueHost) { valueHost = doc.createElement('span'); valueHost.className = 'qxframe9a7c2-picker-field-value-host qxframe9a7c2-input-values'; root.insertBefore(valueHost, input); }
  }
  var panel = doc.createElement('div'), body = doc.createElement('div'), footer = doc.createElement('div');
  var triggerSession = null, control = null, focusController = null, keyboard = null, destroyed = false, api = null;
  var displayValue = opts.displayValue == null ? '' : String(opts.displayValue);
  var draftDisplayValue = opts.draftDisplayValue == null ? '' : String(opts.draftDisplayValue);
  var displayPlaceholder = opts.placeholder == null ? '' : String(opts.placeholder);
  var committedValue = opts.committedValue;
  var draftValueSnapshot = draftValueTarget ? (/^(input|textarea|select)$/i.test(String(draftValueTarget.tagName || '')) ? { kind: 'value', value: draftValueTarget.value } : { kind: 'text', value: draftValueTarget.textContent }) : null;
  var tags = Array.isArray(opts.tags) ? opts.tags.slice() : [];
  var clearVisible = opts.clearVisible === true;
  var footerCleanups = [], footerActionButtons = [];
  var interactionGeneration = 0, navigationActive = false, editorSnapshot = null, editorPointerPending = false, suppressOpenEvent = null;

  if (!projectionMode && !headlessMode) { root.classList.add('qxframe9a7c2-picker-field'); if (opts.className) root.classList.add(String(opts.className)); }
  panel.className = 'qxframe9a7c2-picker-field-panel qxframe9a7c2-popup-surface is-' + sizeName(opts.size) + (opts.panelClass ? ' ' + String(opts.panelClass) : '');
  panel.hidden = true; body.className = 'qxframe9a7c2-picker-field-body'; footer.className = 'qxframe9a7c2-picker-field-footer';
  panel.appendChild(body);

  control = headlessMode ? null : projectionMode ? Control.createProjection({
    document: doc, reference: root, valueTarget: valueHost, inputTarget: input, formTarget: opts.formTarget, formField: opts.formField, name: opts.name, committedValue: opts.committedValue, serializeValue: opts.serializeValue,
    mode: opts.controlMode || 'input', tags: tags, displayValue: displayValue, inputValue: displayValue, editable: opts.editable === true, disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true, draftDisplayValue: draftDisplayValue, draftVisual: opts.draftVisual === true, placeholder: displayPlaceholder,
    onInput: function (value, event) { displayValue = value; if (typeof opts.onInput === 'function') opts.onInput(value, event, api); },
    onBlur: function (event) { if (typeof opts.onBlur === 'function') opts.onBlur(event, api); },
  }) : Control.create({
    elements: { root: root, valueHost: valueHost, input: input, clear: clearButton, toggle: toggleElement, prefix: prefix, suffix: suffix },
    document: doc, formField: opts.formField, committedValue: opts.committedValue, serializeValue: opts.serializeValue, mode: opts.controlMode || 'input', tags: tags, creatableTags:opts.creatableTags===true,tagsControlled:true, tokenSeparators: opts.tokenSeparators, tokenizeOnPaste: opts.tokenizeOnPaste !== false, addOnEnter: opts.addOnEnter !== false, addOnTab: opts.addOnTab === true, addOnBlur: opts.addOnBlur === true,
    tagClassName: opts.tagClassName, tagTextClassName: opts.tagTextClassName, tagRemoveClassName: opts.tagRemoveClassName,
    size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, editable: opts.editable,
    clearable: opts.clearable, clearVisibility: 'interaction', hasValue: clearVisible, draftDisplayValue: draftDisplayValue, draftVisual: opts.draftVisual === true, inputValue: displayValue,
    placeholder: displayPlaceholder, expanded: false, toggleVisible: true, toggle: opts.toggle,
    onInput: function (value, event) { displayValue = value; if (typeof opts.onInput === 'function') opts.onInput(value, event, api); },
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
  function editorElement() {
    return control && control.getInputElement ? control.getInputElement() : input;
  }
  function isSelectorEditor(target) {
    var editor = editorElement();
    return !!(editor && target === editor);
  }
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

  triggerSession = Trigger.create({
    reference: root,
    triggerTarget: headlessMode ? triggerTarget : (projectionMode ? triggerTarget : (triggerTarget || root)),
    floating: panel,
    document: doc,
    portalContainer: portal,
    trigger: opts.trigger,
    keyboardActivation: false,
    placement: opts.placement,
    transition: Trigger.motion.popupPlacement,
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
    afterClose: function (detail) { if (typeof opts.afterClose === 'function') opts.afterClose(detail); }
  });

  if (root) scope.add(DOM.listen(root, 'click', function (event) {
    if (!editorPointerPending || !isSelectorEditor(event.target)) return;
    suppressOpenEvent = event;
    editorPointerPending = false;
  }, true));
  var selectorEditor = editorElement();
  if (selectorEditor) {
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
  }

  function routeOwnedNavigation(detail) {
    if (typeof opts.onKeydown === 'function') opts.onKeydown(detail.originalEvent, api);
    return true;
  }

  focusController = FocusController.create({
    root: focusElement(),
    focusRoot: focusElement,
    manageTabIndex: false,
    navigation: {
    editableKeys: ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Backspace','Delete','Enter','Escape','Home','End','PageUp','PageDown','F6'],
    allowEditableKey: function (key, detail) {
      var event = detail && detail.originalEvent;
      if (!event) return false;
      if (navigationOwnsEvent(event)) {
        if (key === 'Backspace' || key === 'Delete') return false;
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
      Backspace: function (detail) { return false; },
      Delete: function (detail) { return false; },
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
    control.updateOptions({ mode: opts.controlMode || 'input', tags: tags, creatableTags:opts.creatableTags===true,tagsControlled:true, tokenSeparators: opts.tokenSeparators, tokenizeOnPaste: opts.tokenizeOnPaste !== false, addOnEnter: opts.addOnEnter !== false, addOnTab: opts.addOnTab === true, addOnBlur: opts.addOnBlur === true, tagClassName: opts.tagClassName, tagTextClassName: opts.tagTextClassName, tagRemoveClassName: opts.tagRemoveClassName, size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, editable: opts.editable, clearable: opts.clearable, clearVisibility: 'interaction', draftDisplayValue: draftDisplayValue, draftVisual: opts.draftVisual === true, placeholder: displayPlaceholder, inputValue: editorValue, hasValue: clearVisible, toggleVisible: true, toggle: opts.toggle, expanded: !!(triggerSession && triggerSession.getState().open) });
    if (navigationActive) projectNavigationVisual(opts.draftVisual === true ? draftDisplayValue : displayValue);
  }
  function writeExternalValue(target, value) { if (!target) return; var text = value == null ? '' : String(value); if (/^(input|textarea|select)$/i.test(String(target.tagName || ''))) target.value = text; else target.textContent = text; }
  function setDisplayValue(value) {
    displayValue = value == null ? '' : String(value);
    // While the picker owns navigation, component draft projection must never rewrite
    // the selector editor buffer/caret. The final committed/cancelled text is projected
    // exactly once when the logical picker interaction ends.
    if (!navigationActive) projectDisplayValue(displayValue);
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
    if (binding && binding.syncClasses) binding.syncClasses(opts.classes);
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
    if (config.cancel) { var cancel = doc.createElement('button'); cancel.type='button'; cancel.tabIndex=footerActionTabIndex(); footerActionButtons.push(cancel); cancel.className='qxframe9a7c2-button is-default is-outlined is-' + sizeName(opts.size); cancel.textContent=config.cancelLabel||'取消'; bindAction(cancel,function(event){config.cancel(event);}); actionsHost.appendChild(cancel); }
    if (config.confirm) { var confirm = doc.createElement('button'); confirm.type='button'; confirm.tabIndex=footerActionTabIndex(); footerActionButtons.push(confirm); confirm.className='qxframe9a7c2-button is-primary is-solid is-' + sizeName(opts.size); confirm.textContent=config.confirmLabel||'确认'; confirm.disabled=config.confirmDisabled===true; bindAction(confirm,function(event){if (!confirm.disabled) config.confirm(event);}); actionsHost.appendChild(confirm); }
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
      cancelLabel: value.cancelLabel || '取消',
      confirmLabel: value.confirmLabel || '确认',
      confirmDisabled: value.confirmDisabled === true
    });
  }

  api = Object.freeze({
    open: open, close: close, toggle: function (reason,event) { return destroyed || !canActivatePicker() ? false : triggerSession.toggle(reason || 'api', event || null); }, setOpen: setOpen,
    setDisplayValue: setDisplayValue, setDraftDisplayValue: setDraftDisplayValue, setPlaceholder: setPlaceholder, setCommittedValue: setCommittedValue, setTags: setTags, setClearVisible: setClearVisible, setDraftVisual: setDraftVisual, createFooter: createFooter, createConfirmFooter: createConfirmFooter,
    reposition: function () { return destroyed ? false : triggerSession.reposition('api'); }, updateOptions: updateOptions, focus: function () { if (control) return control.focus(); return DOM.focusElement(triggerTarget || root, { preventScroll: true }); },
    getState: function () { return Object.freeze({ open: !!(triggerSession && triggerSession.getState().open), displayValue: displayValue, draftDisplayValue: draftDisplayValue, placeholder: displayPlaceholder, draftVisual: opts.draftVisual === true, hasDraftValueTarget: !!draftValueTarget, renderControl: !projectionMode && !headlessMode, projection: projectionMode, headless: headlessMode, disabled: opts.disabled === true, readOnly: opts.readOnly === true, loading: opts.busy === true, focusScope: opts.focusScope, interactionMode: navigationActive ? 'navigation' : 'text', keyboardOwner: navigationActive ? 'picker' : 'editor', editorSuspended: navigationActive, interactionGeneration: interactionGeneration, destroyed: destroyed }); },
    getRootElement: function () { return root; }, getControlElement: function () { return control ? control.getControlElement() : controlElement; }, getInputElement: function () { return control && control.getInputElement ? control.getInputElement() : input; }, getDraftValueElement: function () { return draftValueTarget; },
    getPanelElement: function () { return panel; }, getPanelHost: function () { return body; }, getFooterElement: function () { return footer; },
    getControl: function () { return control; }, getKeyboardNavigation: function () { return keyboard; }, getFocusController: function () { return focusController; }, getFormField: function () { return control ? control.getFormField() : null; }, getCommittedValue: function () { return control ? control.getCommittedValue() : committedValue; }, getTrigger: function () { return triggerSession; },
    destroy: function (reason) {
      if (destroyed) return false; scope.dispose(); footerCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
      if (triggerSession) triggerSession.destroy(reason || 'picker-field-destroy'); triggerSession = null;
      destroyed = true;
      if (control) control.destroy(reason || 'picker-field-destroy'); control = null; DOM.removeNode(panel); if (binding) binding.release(); binding = null;
      if (draftValueTarget && draftValueSnapshot) { if (draftValueSnapshot.kind === 'value') draftValueTarget.value = draftValueSnapshot.value; else draftValueTarget.textContent = draftValueSnapshot.value; }
      navigationActive = false; editorSnapshot = null; editorPointerPending = false; suppressOpenEvent = null;
      root = controlElement = valueHost = input = clearButton = toggleElement = body = footer = panel = triggerTarget = draftValueTarget = null; draftValueSnapshot = null; return true;
    }
  });

  syncControl(); setDraftDisplayValue(draftDisplayValue); if (opts.open === true) open('initial'); return api;
}

export const PickerField = Object.freeze({ create, validateHeadlessOptions, createDefaultDOM: DOMFactory.createDefaultDOM });
