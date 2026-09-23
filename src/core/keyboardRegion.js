
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { KeyboardNavigation } from './keyboardNavigation.js';
import { InteractionModality } from './interactionModality.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

function bindVirtualFocus(options) {
    var settings = Utils.mergeOwn(options || {});
    var controller = settings.controller;
    if (!controller || !Utils.isFunction(controller.registerDomain)) return null;
    var previous = settings.previousDomain;
    if (previous && Utils.isFunction(previous.destroy)) previous.destroy();
    var keyboard = settings.keyboard || (settings.region && settings.region.keyboard) || null;
    var hosted = settings.hosted !== false && (!keyboard || controller !== keyboard.virtualFocus);
    if (settings.region && Utils.isFunction(settings.region.setHosted)) settings.region.setHosted(hosted);
    else if (settings.root) settings.root.tabIndex = hosted ? -1 : 0;
    var domain = controller.registerDomain(settings.domain || {});
    var activeKey = Utils.isFunction(settings.getActiveKey) ? settings.getActiveKey() : settings.activeKey;
    var state = Utils.isFunction(controller.getState) ? controller.getState() : null;
    if (activeKey !== null && activeKey !== undefined && activeKey !== '' && state && state.modality === 'keyboard') {
      domain.activate(activeKey, Utils.mergeOwn({ source:'keyboard', reason:'keyboard-region-bind', ensureVisible:true }, settings.activation || {}));
    }
    return Object.freeze({ controller:controller, domain:domain, hosted:hosted });
  }

function forwardHandlers(keys, handler) {
    if (!Array.isArray(keys)) throw new TypeError('[QXFRAME9A7C2] KeyboardRegion.forwardHandlers keys must be an array.');
    if (!Utils.isFunction(handler)) throw new TypeError('[QXFRAME9A7C2] KeyboardRegion.forwardHandlers handler must be a function.');
    var handlers = {};
    keys.forEach(function (key) {
      handlers[String(key)] = function (detail) { return handler(detail.originalEvent, detail); };
    });
    return handlers;
  }

function create(options) {
    var settings = options || {};
    var root = settings.root;
    if (!root) throw new TypeError('[QXFRAME9A7C2] KeyboardRegion root is required.');
    var documentRef = settings.document || root.ownerDocument || global.document;
    var scope = Lifecycle.createScope();
    var hosted = settings.hosted === true;
    var disabled = settings.disabled === true;
    var destroyed = false;
    var navigationOptions = Utils.mergeOwn(settings.navigation || {}, {
      root: root,
      focusRoot: settings.focusRoot || (settings.navigation && settings.navigation.focusRoot) || root
    });
    var keyboard = KeyboardNavigation.create(navigationOptions);
    scope.add(function () { keyboard.destroy(); });

    function syncTabIndex() {
      if (settings.manageTabIndex === false) return;
      root.tabIndex = disabled || hosted ? -1 : (Number.isInteger(settings.tabIndex) ? settings.tabIndex : 0);
    }

    function onFocusIn(event) {
      if (destroyed || disabled || hosted || event.target !== root || !InteractionModality.isKeyboard(documentRef)) return;
      keyboard.virtualFocus.keyboard();
      if (Utils.isFunction(settings.onEnter)) settings.onEnter({
        source: 'keyboard',
        reason: 'keyboard-region-enter',
        originalEvent: event,
        region: api,
        keyboard: keyboard
      });
      keyboard.virtualFocus.refresh({ reason: 'keyboard-region-enter' });
    }

    scope.add(DOM.listen(root, 'focusin', onFocusIn));
    syncTabIndex();

    function update(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      if (Object.prototype.hasOwnProperty.call(next, 'hosted')) hosted = next.hosted === true;
      if (Object.prototype.hasOwnProperty.call(next, 'disabled')) disabled = next.disabled === true;
      syncTabIndex();
      return api;
    }

    function focus(options) {
      if (destroyed || disabled || hosted) return false;
      return DOM.focusElement(root, Utils.mergeOwn({ preventScroll: true }, options || {}));
    }

    function destroy() {
      if (destroyed) return false;
      destroyed = true;
      scope.dispose();
      return true;
    }

    var api = {
      keyboard: keyboard,
      virtualFocus: keyboard.virtualFocus,
      setHosted: function (value) { hosted = value === true; syncTabIndex(); return api; },
      setDisabled: function (value) { disabled = value === true; syncTabIndex(); return api; },
      update: update,
      focus: focus,
      destroy: destroy
    };
    Object.defineProperties(api, {
      hosted: { enumerable: true, get: function () { return hosted; } },
      disabled: { enumerable: true, get: function () { return disabled; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });
    return api;
  }

export const KeyboardRegion = Object.freeze({ create, bindVirtualFocus, forwardHandlers });
export { create, bindVirtualFocus, forwardHandlers };
