
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { PressInteraction } from './pressInteraction.js';
import { Utils } from '../utils/utils.js';
import { Scheduler } from './scheduler.js';

const global = globalThis;

var SUPPORTED_TRIGGERS = ['click', 'hover', 'focus', 'contextMenu'];

  function normalizeTriggers(value) {
    var source = Array.isArray(value) ? value.slice() : String(value || 'click').split(/\s+/);
    var result = [];
    source.forEach(function (item) {
      var name = String(item || '').trim();
      if (!name) return;
      if (SUPPORTED_TRIGGERS.indexOf(name) < 0) throw new TypeError('[QXFRAME9A7C2] TriggerInteraction trigger must use click, hover, focus, or contextMenu.');
      if (result.indexOf(name) < 0) result.push(name);
    });
    return result;
  }

  function resolveDelay(value) {
    if (Utils.isFunction(value)) value = value();
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
  }

  function create(options) {
    var settings = options || {};
    var reference = settings.reference;
    if (!reference) throw new TypeError('[QXFRAME9A7C2] TriggerInteraction reference is required.');

    var scope = Lifecycle.createScope();
    var triggers = normalizeTriggers(settings.trigger);
    var destroyed = false;
    var openDelay = Scheduler.createDelayScheduler(function (_timestamp, payload) {
      if (!payload) return;
      emitIntent('onOpenIntent', payload.reason, payload.event);
    });
    var closeDelay = Scheduler.createDelayScheduler(function (_timestamp, payload) {
      if (!payload) return;
      emitIntent('onCloseIntent', payload.reason, payload.event);
    });
    scope.add(function () { openDelay.dispose(); closeDelay.dispose(); });

    function clearOpenTimer() { return openDelay.cancel(); }
    function clearCloseTimer() { return closeDelay.cancel(); }
    function clearTimers() { clearOpenTimer(); clearCloseTimer(); }

    function containsLogicalTarget(target) {
      if (!target) return false;
      if (Utils.isFunction(settings.containsTarget)) return settings.containsTarget(target) === true;
      var floating = settings.floating;
      return reference === target || (reference.contains && reference.contains(target)) || !!(floating && (floating === target || (floating.contains && floating.contains(target))));
    }

    function interactionEnter(event) {
      clearCloseTimer();
      if (Utils.isFunction(settings.onInteractionEnter)) settings.onInteractionEnter(event || null);
    }

    function withinInteractiveBorder(event) {
      var border = Math.max(0, Number(settings.interactiveBorder) || 0);
      if (!border || !event || !Number.isFinite(Number(event.clientX)) || !Number.isFinite(Number(event.clientY))) return false;
      var x = Number(event.clientX), y = Number(event.clientY);
      var candidates = [reference, settings.floating];
      for (var index = 0; index < candidates.length; index += 1) {
        var node = candidates[index];
        if (!node || !Utils.isFunction(node.getBoundingClientRect)) continue;
        var rect = node.getBoundingClientRect();
        if (x >= Number(rect.left || 0) - border && x <= Number(rect.right || 0) + border && y >= Number(rect.top || 0) - border && y <= Number(rect.bottom || 0) + border) return true;
      }
      return false;
    }

    function emitIntent(name, reason, event) {
      var fn = settings[name];
      if (!Utils.isFunction(fn)) return false;
      return fn(reason, event || null) !== false;
    }

    function delayedOpen(reason, event) {
      if (destroyed) return;
      interactionEnter(event);
      clearOpenTimer();
      var delay = resolveDelay(settings.openDelay);
      if (delay === 0) { emitIntent('onOpenIntent', reason, event); return; }
      openDelay.request(delay, { reason: reason, event: event || null });
    }

    function delayedClose(reason, event, notifyLeave) {
      if (destroyed) return;
      var relatedTarget = event && event.relatedTarget;
      if (relatedTarget && containsLogicalTarget(relatedTarget)) { interactionEnter(event); return; }
      if (withinInteractiveBorder(event)) { interactionEnter(event); return; }
      clearOpenTimer();
      clearCloseTimer();
      if (notifyLeave !== false && Utils.isFunction(settings.onInteractionLeave)) settings.onInteractionLeave(reason, event || null);
      var delay = resolveDelay(settings.closeDelay) + Math.max(0, Number(settings.interactiveDebounce) || 0);
      if (delay === 0) { emitIntent('onCloseIntent', reason, event); return; }
      closeDelay.request(delay, { reason: reason, event: event || null });
    }

    function requestClose(reason, event) {
      if (destroyed || triggers.indexOf('hover') < 0) return false;
      delayedClose(reason || 'logical-descendant-leave', event || null, false);
      return true;
    }

    if (triggers.indexOf('click') >= 0) {
      var press = PressInteraction.create({
        target: reference,
        keyboard: settings.keyboard !== false,
        getState: function () { return { disabled: settings.disabled === true, loading: settings.loading === true, readOnly: settings.readOnly === true }; },
        capabilities: { activateWhenReadOnly: settings.activateWhenReadOnly !== false, preserveFocusWhileLoading: true, tabbableWhileLoading: true },
        onPress: function (detail) {
          var event = detail.originalEvent || null;
          interactionEnter(event);
          emitIntent('onToggleIntent', detail.reason === 'enter' ? 'trigger-enter' : (detail.reason === 'space' ? 'trigger-space' : 'trigger-click'), event);
        }
      });
      scope.add(function () { press.destroy(); });
    }
    if (triggers.indexOf('contextMenu') >= 0) {
      scope.add(DOM.listen(reference, 'contextmenu', function (event) {
        interactionEnter(event);
        if (event && event.preventDefault) event.preventDefault();
        emitIntent('onToggleIntent', 'trigger-context-menu', event);
      }));
    }
    if (triggers.indexOf('focus') >= 0) {
      scope.add(DOM.listen(reference, 'focusin', function (event) { delayedOpen('trigger-focus', event); }));
      scope.add(DOM.listen(reference, 'focusout', function (event) { delayedClose('trigger-focusout', event); }));
    }
    if (triggers.indexOf('hover') >= 0) {
      scope.add(DOM.listen(reference, 'pointerenter', function (event) { delayedOpen('trigger-hover', event); }));
      scope.add(DOM.listen(reference, 'pointerleave', function (event) { delayedClose('trigger-hover-leave', event); }));
      if (settings.floating) {
        scope.add(DOM.listen(settings.floating, 'pointerenter', function (event) { interactionEnter(event); }));
        scope.add(DOM.listen(settings.floating, 'pointerleave', function (event) { delayedClose('popup-hover-leave', event); }));
      }
    }

    function destroy() {
      if (destroyed) return false;
      clearTimers();
      scope.dispose();
      destroyed = true;
      return true;
    }

    var api = Object.freeze({
      destroy: destroy,
      cancelOpen: function () { clearOpenTimer(); return true; },
      cancelClose: function () { clearCloseTimer(); return true; },
      requestClose: requestClose,
      getState: function () { return Object.freeze({ trigger: triggers.slice(), destroyed: destroyed }); }
    });
    return api;
  }

export const TriggerInteraction = Object.freeze({ create });
export { create };
