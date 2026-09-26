
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { InteractionController } from './interactionController.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

var KEYBOARD_FOCUS_CLASS = 'is-keyboard-focus';
  var pointerModalityRecords = [];

  function subscribePointerModality(documentRef, handler) {
    if (!documentRef || !Utils.isFunction(handler)) return function () {};
    var record = null;
    for (var i = 0; i < pointerModalityRecords.length; i += 1) {
      if (pointerModalityRecords[i].document === documentRef) { record = pointerModalityRecords[i]; break; }
    }
    if (!record) {
      record = { document: documentRef, handlers: [], dispose: null };
      record.dispose = DOM.listen(documentRef, 'pointerdown', function () {
        record.handlers.slice().forEach(function (callback) { callback(); });
      }, true);
      pointerModalityRecords.push(record);
    }
    record.handlers.push(handler);
    var disposed = false;
    return function () {
      if (disposed) return false;
      disposed = true;
      var index = record.handlers.indexOf(handler);
      if (index >= 0) record.handlers.splice(index, 1);
      if (!record.handlers.length) {
        if (Utils.isFunction(record.dispose)) record.dispose();
        var recordIndex = pointerModalityRecords.indexOf(record);
        if (recordIndex >= 0) pointerModalityRecords.splice(recordIndex, 1);
      }
      return true;
    };
  }

  function isEditableTarget(target) {
    if (!target) return false;
    if (target.isContentEditable === true) return true;
    var tagName = String(target.tagName || '').toLowerCase();
    if (tagName === 'textarea' || tagName === 'select') return true;
    if (tagName === 'input') {
      var type = String(target.type || 'text').toLowerCase();
      return ['button', 'checkbox', 'radio', 'range', 'submit', 'reset', 'file', 'color'].indexOf(type) < 0;
    }
    if (Utils.isFunction(target.getAttribute)) {
      var editable = target.getAttribute('contenteditable');
      if (editable === '' || editable === 'true') return true;
    }
    return false;
  }

  function isComposing(event) {
    return DOM.isComposingEvent(event);
  }

  function textSelection(target) {
    if (!target || !isEditableTarget(target)) return null;
    var tagName = String(target.tagName || '').toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea') return null;
    var start = Number(target.selectionStart), end = Number(target.selectionEnd);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
    return { start: start, end: end, length: String(target.value || '').length };
  }

  function shouldPreserveNativeTextEditing(event, target) {
    var node = target || (event && event.target);
    if (!isEditableTarget(node)) return false;
    if (isComposing(event)) return true;
    if (event && (event.metaKey || event.ctrlKey || event.altKey)) return true;
    var key = String(event && event.key || '');
    var tagName = String(node && node.tagName || '').toLowerCase();
    var selection = textSelection(node);

    if (key === 'Home' || key === 'End') return true;
    if (key === ' ' || (key === 'Enter' && (tagName === 'textarea' || node.isContentEditable === true))) return true;
    if (key !== 'ArrowLeft' && key !== 'ArrowRight' && key !== 'Backspace' && key !== 'Delete') return false;

    // ContentEditable/non-text controls own their native editing model. The composite
    // must not guess caret boundaries that the browser already knows how to handle.
    if (!selection) return true;
    if (selection.start !== selection.end) return true;
    if (key === 'ArrowLeft' || key === 'Backspace') return selection.start > 0;
    if (key === 'ArrowRight' || key === 'Delete') return selection.end < selection.length;
    return false;
  }

  function normalizeEditableKeys(value) {
    if (value === true) return null;
    if (!Array.isArray(value)) return [];
    var map = Object.create(null);
    value.forEach(function (key) { map[String(key)] = true; });
    return map;
  }

  function createVirtualFocusController(rootSource, scope) {
    var domains = [];
    var api = null;
    var activeDomain = null;
    var activeKey = null;
    var modality = 'pointer';
    var projectedElement = null;
    var projectedRoot = null;
    var destroyed = false;
    function focusRoot() { var value = Utils.isFunction(rootSource) ? rootSource() : rootSource; return value && value.nodeType === 1 ? value : null; }
    var initialRoot = focusRoot();
    var documentRef = initialRoot && initialRoot.ownerDocument ? initialRoot.ownerDocument : global.document;
    var domainSequence = 0;

    function ownsRealFocus() {
      var active = documentRef && documentRef.activeElement;
      var root = focusRoot();
      return !!(root && active && (root === active || (root.contains && root.contains(active))));
    }

    function clearProjected() {
      if (projectedElement && projectedElement.classList) projectedElement.classList.remove(KEYBOARD_FOCUS_CLASS);
      if (projectedRoot && projectedRoot.classList) projectedRoot.classList.remove('is-virtual-focus-owner');
      projectedElement = null;
      projectedRoot = null;
    }

    function resolveElement() {
      if (!activeDomain || activeKey === null || activeKey === undefined || activeKey === '') return null;
      var config = activeDomain._config;
      if (!config || !Utils.isFunction(config.getElement)) return null;
      var element = config.getElement(activeKey, activeDomain);
      return element && element.nodeType === 1 ? element : null;
    }

    function shouldProjectVisualFocus() {
      if (destroyed || modality !== 'keyboard') return false;
      var root = focusRoot();
      var active = documentRef && documentRef.activeElement;
      /* Virtual focus is only the visual owner while the composite host itself owns
         real DOM focus. A nested real control (button/input/etc.) becomes the sole
         focus-visible owner and temporarily suspends the parent active-item ring. */
      return !!(root && active && active === root);
    }

    function project() {
      clearProjected();
      if (!shouldProjectVisualFocus()) return null;
      var root = focusRoot();
      var element = resolveElement();
      if (!element || element.isConnected === false || !element.classList) return null;
      element.classList.add(KEYBOARD_FOCUS_CLASS);
      if (root && root.classList) { root.classList.add('is-virtual-focus-owner'); projectedRoot = root; }
      projectedElement = element;
      return element;
    }

    function setModality(value) {
      var next = value === 'keyboard' ? 'keyboard' : 'pointer';
      if (modality === next) {
        project();
        return false;
      }
      modality = next;
      project();
      return true;
    }

    function findDomain(handle) {
      if (!handle || handle.destroyed === true) return null;
      return domains.indexOf(handle) >= 0 ? handle : null;
    }

    function normalizeKey(domain, key, context) {
      if (!domain) return null;
      var config = domain._config;
      if (!config || !Utils.isFunction(config.reconcile)) return key;
      var result = config.reconcile(key, context || {});
      return result === undefined ? key : result;
    }

    function ensureVisible(domain, key, context) {
      if (!domain || key === null || key === undefined || key === '') return false;
      var config = domain._config;
      if (!config || !Utils.isFunction(config.ensureVisible)) return false;
      return config.ensureVisible(key, context || {}) !== false;
    }

    function activate(domainHandle, key, options) {
      if (destroyed) return false;
      var domain = findDomain(domainHandle);
      if (!domain) throw new TypeError('[QXFRAME9A7C2] VirtualFocus activate requires a registered domain.');
      var local = options || {};
      var nextModality = local.modality || (local.source === 'pointer' || local.reason === 'pointer' ? 'pointer' : 'keyboard');
      var context = {
        domain: domain,
        root: focusRoot(),
        source: local.source || nextModality,
        reason: local.reason || 'activate',
        originalEvent: local.originalEvent || null,
        controller: api
      };
      var nextKey = local.reconcile === false ? key : normalizeKey(domain, key, context);
      clearProjected();
      activeDomain = nextKey === null || nextKey === undefined || nextKey === '' ? null : domain;
      activeKey = activeDomain ? nextKey : null;
      modality = nextModality === 'keyboard' ? 'keyboard' : 'pointer';
      if (activeDomain && local.ensureVisible !== false && modality === 'keyboard') ensureVisible(activeDomain, activeKey, context);
      project();
      return !!activeDomain;
    }

    function clear(options) {
      if (destroyed) return false;
      var hadState = !!activeDomain || projectedElement !== null;
      clearProjected();
      activeDomain = null;
      activeKey = null;
      if (options && options.modality) modality = options.modality === 'keyboard' ? 'keyboard' : 'pointer';
      return hadState;
    }

    function reconcile(options) {
      if (!activeDomain) return false;
      var local = options || {};
      var context = {
        domain: activeDomain,
        root: focusRoot(),
        source: local.source || 'programmatic',
        reason: local.reason || 'reconcile',
        originalEvent: local.originalEvent || null,
        controller: api
      };
      var next = normalizeKey(activeDomain, activeKey, context);
      if (next === null || next === undefined || next === '') return clear({ modality: modality });
      activeKey = next;
      if (local.ensureVisible === true && modality === 'keyboard') ensureVisible(activeDomain, activeKey, context);
      project();
      return true;
    }

    function refresh(options) {
      if (destroyed) return false;
      var local = options || {};
      if (local.reconcile === true) reconcile(local);
      else project();
      return true;
    }

    function registerDomain(config) {
      if (destroyed) throw new Error('[QXFRAME9A7C2] VirtualFocus is destroyed.');
      var local = config || {};
      if (!Utils.isFunction(local.getElement)) throw new TypeError('[QXFRAME9A7C2] VirtualFocus domain getElement is required.');
      var name = String(local.name || ('domain-' + (++domainSequence)));
      var dead = false;
      var handle = {
        name: name,
        _config: local,
        activate: function (key, options) { return activate(handle, key, options); },
        clear: function (options) { return activeDomain === handle ? clear(options) : false; },
        reconcile: function (options) { return activeDomain === handle ? reconcile(options) : false; },
        refresh: function (options) { return activeDomain === handle ? refresh(options) : false; },
        ensureVisible: function (key, options) { return ensureVisible(handle, key, options || {}); },
        getElement: function (key) { return local.getElement(key, handle) || null; },
        destroy: function () {
          if (dead) return false;
          if (activeDomain === handle) clear();
          var index = domains.indexOf(handle);
          if (index >= 0) domains.splice(index, 1);
          dead = true;
          return true;
        }
      };
      Object.defineProperty(handle, 'destroyed', { enumerable: true, get: function () { return dead; } });
      domains.push(handle);
      return handle;
    }

    function getState() {
      return Object.freeze({
        domain: activeDomain ? activeDomain.name : null,
        key: activeKey,
        modality: modality,
        visible: !!projectedElement,
        element: projectedElement || null
      });
    }

    function destroy() {
      if (destroyed) return false;
      clearProjected();
      activeDomain = null;
      activeKey = null;
      domains.splice(0).forEach(function (domain) { if (domain && domain.destroy) domain.destroy(); });
      destroyed = true;
      return true;
    }

    api = {
      registerDomain: registerDomain,
      activate: activate,
      clear: clear,
      reconcile: reconcile,
      refresh: refresh,
      setModality: setModality,
      keyboard: function () { return setModality('keyboard'); },
      pointer: function () { return setModality('pointer'); },
      ownsRealFocus: ownsRealFocus,
      shouldProjectVisualFocus: shouldProjectVisualFocus,
      getState: getState,
      destroy: destroy
    };

    if (documentRef) {
      scope.add(subscribePointerModality(documentRef, function () { setModality('pointer'); }));
      /* Real descendant focus always outranks projected virtual focus. Refresh on every
         focus handoff so the host/item visual ownership cannot leave a stale double ring. */
      scope.add(DOM.listen(documentRef, 'focusin', function () { project(); }, true));
      scope.add(DOM.listen(documentRef, 'focusout', function () { Promise.resolve().then(function () { if (!destroyed) project(); }); }, true));
    }
    return api;
  }

  function create(options) {
    var settings = options || {};
    var root = settings.root;
    if (!root) throw new TypeError('[QXFRAME9A7C2] KeyboardNavigation root is required.');
    var activeItem = settings.activeItem || null;
    var handlers = settings.handlers || settings.keyMap || Object.create(null);
    var scope = Lifecycle.createScope();
    var orientation = settings.orientation || 'vertical';
    var rtl = settings.rtl === true;
    var pageStep = Math.max(1, Math.floor(Number(settings.pageStep) || 10));
    var editableKeys = normalizeEditableKeys(settings.editableKeys);
    var destroyed = false;
    var api = null;
    var virtualFocus = createVirtualFocusController(settings.focusRoot || root, scope);

    function meta(reason, event) {
      return { source: 'keyboard', reason: reason, originalEvent: event };
    }

    function context(event, reason) {
      return {
        key: activeItem ? activeItem.activeKey : (event && event.key || ''),
        activeKey: activeItem ? activeItem.activeKey : '',
        eventKey: event && event.key || '',
        event: event,
        originalEvent: event,
        root: root,
        target: event && event.target || null,
        editable: isEditableTarget(event && event.target),
        composing: isComposing(event),
        activeItem: activeItem,
        source: 'keyboard',
        reason: reason || 'keydown',
        controller: api,
        virtualFocus: virtualFocus
      };
    }

    function editableKeyAllowed(key, event) {
      if (!isEditableTarget(event && event.target)) return true;
      if (isComposing(event)) return false;
      if (Utils.isFunction(settings.allowEditableKey)) {
        return settings.allowEditableKey(key, context(event, 'editable-key')) === true;
      }
      if (editableKeys === null) return true;
      return !!editableKeys[key];
    }

    function ensureVisible(event, reason) {
      if (activeItem && Utils.isFunction(settings.ensureVisible) && activeItem.activeKey) {
        settings.ensureVisible(activeItem.activeKey, context(event, reason));
      }
    }

    function notifyNavigate(event, reason) {
      if (Utils.isFunction(settings.onNavigate)) settings.onNavigate(context(event, reason));
    }

    function navigate(action, reason, event) {
      if (!activeItem || !Utils.isFunction(action)) return false;
      action();
      ensureVisible(event, reason);
      notifyNavigate(event, reason);
      return true;
    }

    function movePage(delta, event) {
      if (!activeItem) return false;
      for (var i = 0; i < pageStep; i += 1) activeItem.move(delta, meta(delta < 0 ? 'page-up' : 'page-down', event));
      ensureVisible(event, delta < 0 ? 'page-up' : 'page-down');
      notifyNavigate(event, delta < 0 ? 'page-up' : 'page-down');
      return true;
    }

    function invokeCustom(event) {
      var handler = handlers && handlers[event.key];
      if (!Utils.isFunction(handler)) return false;
      return handler(context(event, 'custom')) !== false;
    }

    function invokeDefault(event) {
      if (!activeItem) return false;
      var action = InteractionController.resolveKeyboardAction(event, { keymap: settings.defaultActions, repeatActions: settings.repeatActions });
      if (action === 'MOVE_FIRST') return navigate(function () { activeItem.first(meta('home', event)); }, 'home', event);
      if (action === 'MOVE_LAST') return navigate(function () { activeItem.last(meta('end', event)); }, 'end', event);
      if (action === 'PAGE_PREVIOUS') return movePage(-1, event);
      if (action === 'PAGE_NEXT') return movePage(1, event);
      if ((orientation === 'vertical' || orientation === 'both') && action === 'MOVE_DOWN') return navigate(function () { activeItem.next(meta('arrow-down', event)); }, 'arrow-down', event);
      if ((orientation === 'vertical' || orientation === 'both') && action === 'MOVE_UP') return navigate(function () { activeItem.previous(meta('arrow-up', event)); }, 'arrow-up', event);
      if ((orientation === 'horizontal' || orientation === 'both') && action === 'MOVE_RIGHT') return navigate(function () {
        (rtl ? activeItem.previous : activeItem.next)(meta('arrow-right', event));
      }, 'arrow-right', event);
      if ((orientation === 'horizontal' || orientation === 'both') && action === 'MOVE_LEFT') return navigate(function () {
        (rtl ? activeItem.next : activeItem.previous)(meta('arrow-left', event));
      }, 'arrow-left', event);
      if (action === 'ACTIVATE' && Utils.isFunction(settings.onActivate)) {
        return settings.onActivate(context(event, event.key === 'Enter' ? 'enter' : 'space')) !== false;
      }
      return false;
    }

    function handle(event) {
      if (destroyed || !event || event.defaultPrevented === true) return false;
      var key = String(event.key || '');
      if (!key) return false;
      if (isComposing(event)) return false;
      if (event.repeat === true && (key === 'Enter' || key === ' ' || key === 'Spacebar') && settings.allowActivationRepeat !== true) return false;
      if (Utils.isFunction(settings.shouldHandle) && settings.shouldHandle(context(event, 'should-handle')) === false) return false;
      if (!editableKeyAllowed(key, event)) return false;

      var handled = false;
      if (Utils.isFunction(settings.beforeHandle)) {
        var beforeResult = settings.beforeHandle(context(event, 'before-handle'));
        if (beforeResult === false) return false;
      }

      handled = invokeCustom(event);
      if (!handled) handled = invokeDefault(event);

      if (handled) {
        virtualFocus.keyboard();
        if (settings.preventDefault !== false && Utils.isFunction(event.preventDefault)) event.preventDefault();
        if (settings.stopPropagation === true && Utils.isFunction(event.stopPropagation)) event.stopPropagation();
        if (Utils.isFunction(settings.onHandled)) settings.onHandled(context(event, 'handled'));
      }
      return handled;
    }

    scope.add(DOM.listen(root, 'keydown', handle, settings.capture === true));
    scope.add(DOM.listen(root, 'focusin', function () { virtualFocus.refresh(); }));
    scope.add(DOM.listen(root, 'focusout', function () {
      Promise.resolve().then(function () { if (!destroyed) virtualFocus.refresh(); });
    }));

    function destroy() {
      if (destroyed) return false;
      virtualFocus.destroy();
      scope.dispose();
      destroyed = true;
      return true;
    }

    api = {
      handle: handle,
      isEditableTarget: isEditableTarget,
      shouldPreserveNativeTextEditing: shouldPreserveNativeTextEditing,
      virtualFocus: virtualFocus,
      destroy: destroy
    };
    Object.defineProperty(api, 'destroyed', { enumerable: true, get: function () { return destroyed; } });
    return api;
  }

export const KeyboardNavigation = Object.freeze({ create, isEditableTarget, isComposing, shouldPreserveNativeTextEditing, keyboardFocusClass: KEYBOARD_FOCUS_CLASS });
export { create, isEditableTarget, isComposing, shouldPreserveNativeTextEditing };
