
import { KeyboardNavigation } from './keyboardNavigation.js';
import { Utils } from '../utils/utils.js';

var sequence = 0;

  function create(options) {
    var settings = options || {};
    var keyboard = settings.keyboard;
    if (!keyboard || !keyboard.virtualFocus) throw new TypeError('[QXFRAME9A7C2] TagNavigation keyboard with virtualFocus is required.');
    var destroyed = false;
    function owner() { return Utils.isFunction(settings.owner) ? settings.owner() : settings.owner; }
    function input() { return Utils.isFunction(settings.getInputElement) ? settings.getInputElement() : settings.input || null; }
    function locked() { return Utils.isFunction(settings.isLocked) ? settings.isLocked() === true : settings.disabled === true; }
    function canEnter(event) { return !Utils.isFunction(settings.canEnter) || settings.canEnter(event, api) !== false; }
    function consume(event) { if (event && Utils.isFunction(event.preventDefault)) event.preventDefault(); return true; }
    function focusInputStart() {
      var target = input();
      if (!target) return false;
      if (Utils.isFunction(target.setSelectionRange)) { try { target.setSelectionRange(0, 0); } catch (_) {} }
      return true;
    }
    function currentKey() {
      var state = keyboard.virtualFocus.getState();
      return state.domain === domain.name ? state.key : null;
    }
    function activate(key, reason, event) {
      if (key === null || key === undefined || key === '') return false;
      return domain.activate(String(key), { source:'keyboard', reason:reason || 'tag-keyboard', originalEvent:event || null, ensureVisible:true });
    }
    var domain = keyboard.virtualFocus.registerDomain({
      name: String(settings.domainName || ('tag-navigation-' + (++sequence))),
      getElement: function (key) { var value = owner(); return value && value.getVirtualTagElement ? value.getVirtualTagElement(key) : null; },
      reconcile: function (key) { var value = owner(); return value && value.reconcileVirtualTagKey ? value.reconcileVirtualTagKey(key) : null; },
      ensureVisible: function (key) { var value = owner(); return value && value.ensureVirtualTagVisible ? value.ensureVirtualTagVisible(key) : false; }
    });

    function handleKeydown(event) {
      if (!event || destroyed || locked()) return false;
      if (KeyboardNavigation.isComposing && KeyboardNavigation.isComposing(event)) return false;
      var value = owner();
      if (!value) return false;
      var key = String(event.key || '');
      var current = currentKey();
      var navigationKey = key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Backspace' || key === 'Delete';
      if (!current && navigationKey && !canEnter(event)) return false;

      if (key === 'ArrowLeft' || key === 'ArrowRight') {
        if (!current && KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target)) return false;
        var delta = key === 'ArrowLeft' ? -1 : 1;
        var next = value.moveVirtualTag ? value.moveVirtualTag(current, delta) : null;
        if (next === null || next === undefined || next === '') {
          if (current && delta > 0 && settings.exitRight !== false) {
            keyboard.virtualFocus.clear({ modality:'keyboard', reason:'tag-exit-right' });
            focusInputStart();
            if (Utils.isFunction(settings.onExitRight)) settings.onExitRight(event, api);
            return consume(event);
          }
          return false;
        }
        activate(next, key === 'ArrowLeft' ? 'tag-left' : 'tag-right', event);
        return consume(event);
      }

      if (key === 'Backspace' || key === 'Delete') {
        if (!current && KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target)) return false;
        if (!current) {
          if (key === 'Backspace') {
            var last = value.moveVirtualTag ? value.moveVirtualTag(null, -1) : null;
            if (last) { activate(last, 'tag-backspace-arm', event); return consume(event); }
          }
          return false;
        }
        var preferred = value.moveVirtualTag ? value.moveVirtualTag(current, key === 'Delete' ? 1 : -1) : null;
        if (!value.removeVirtualTag || !value.removeVirtualTag(current, { user:true, source:'keyboard', reason:'tag-keyboard-remove', originalEvent:event })) return false;
        var reconciled = preferred && value.reconcileVirtualTagKey ? value.reconcileVirtualTagKey(preferred) : null;
        if (!reconciled && value.reconcileVirtualTagKey) reconciled = value.reconcileVirtualTagKey(current);
        if (reconciled) activate(reconciled, 'tag-remove-reconcile', event);
        else keyboard.virtualFocus.clear({ modality:'keyboard', reason:'tag-remove-empty' });
        return consume(event);
      }

      if (key === 'Escape' && current && settings.clearOnEscape !== false) {
        keyboard.virtualFocus.clear({ modality:'keyboard', reason:'tag-escape' });
        return consume(event);
      }
      return false;
    }

    function destroy() {
      if (destroyed) return false;
      destroyed = true;
      domain.destroy();
      return true;
    }
    var api = { domain:domain, handleKeydown:handleKeydown, currentKey:currentKey, activate:activate, destroy:destroy };
    return api;
  }

export const TagNavigation = Object.freeze({ create });
export { create };
