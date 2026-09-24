
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { InteractionDetails } from './interactionDetails.js';
import { CapabilityController } from './capabilityController.js';
import { InteractionController } from './interactionController.js';
import { IdManager } from '../utils/id.js';

const global = globalThis;

function guard(event, options) {
    var opts = options || {};
    var resolved = opts.policy || CapabilityController.resolve(typeof opts.getState === 'function' ? (opts.getState() || {}) : (opts.state || {}), opts.capabilities || {});
    if (resolved.activatable) return false;
    if (opts.preventDefaultWhenBlocked !== false && event && event.preventDefault) event.preventDefault();
    if (opts.stopImmediatePropagationWhenBlocked === true && event && event.stopImmediatePropagation) event.stopImmediatePropagation();
    else if (opts.stopPropagationWhenBlocked === true && event && event.stopPropagation) event.stopPropagation();
    return true;
  }

  function isNativeActivationTarget(target) {
    if (!target || target.nodeType !== 1) return false;
    var tag = String(target.tagName || '').toLowerCase();
    if (tag === 'button' || tag === 'select' || tag === 'textarea') return true;
    if (tag === 'input') {
      var type = String(target.type || 'text').toLowerCase();
      return ['button','submit','reset','checkbox','radio','file','image'].indexOf(type) >= 0;
    }
    return tag === 'a' && !!target.getAttribute('href');
  }

  function create(options) {
    var opts = options || {};
    var target = opts.target;
    if (!target || !target.addEventListener) throw new TypeError('[QXFRAME9A7C2] PressInteraction target is required.');
    var doc = opts.document || target.ownerDocument || global.document;
    var scope = Lifecycle.createScope();
    var destroyed = false;
    var keyboardActivationPending = false;
    var visualActive = false;
    var visualSource = null;
    var synthesizeKeyboard = opts.keyboard === false ? false : (opts.keyboard === true ? true : !isNativeActivationTarget(target));
    function state() { return typeof opts.getState === 'function' ? (opts.getState() || {}) : (opts.state || {}); }
    var ownsCapability = !opts.capabilityController;
    var capability = opts.capabilityController || CapabilityController.create({ getState: state, getCapabilities: function () { return opts.capabilities || {}; } });
    var ownsInteractionController = !opts.interactionController;
    var interactionController = opts.interactionController || InteractionController.create();
    var interactionScopeId = String(opts.interactionScopeId || IdManager.next('press'));
    var interactionScope = null;
    function policy() { return capability.getState(); }
    function blocked(event) { return guard(event, { policy: policy(), preventDefaultWhenBlocked: opts.preventDefaultWhenBlocked, stopPropagationWhenBlocked: opts.stopPropagationWhenBlocked, stopImmediatePropagationWhenBlocked: opts.stopImmediatePropagationWhenBlocked }); }
    function detailFor(reason, event, source) { return InteractionDetails.create(reason, event || null, { source: source || DOM.activationSource(event), trigger: target, currentTarget: target }); }
    function press(event, source, reason) {
      if (destroyed || blocked(event)) return false;
      var detail = detailFor(reason || 'press', event, source);
      if (typeof opts.onPress === 'function') opts.onPress(detail);
      return detail.cancelled !== true;
    }
    function startVisual(event, source, reason) {
      if (destroyed || visualActive || blocked(event)) return false;
      visualActive = true;
      visualSource = source || DOM.activationSource(event);
      var detail = detailFor(reason || 'press-start', event, visualSource);
      if (typeof opts.onPressStart === 'function') opts.onPressStart(detail);
      return detail.cancelled !== true;
    }
    function endVisual(event, reason) {
      if (destroyed || !visualActive) return false;
      var source = visualSource;
      visualActive = false;
      visualSource = null;
      var detail = detailFor(reason || 'press-end', event, source);
      if (typeof opts.onPressEnd === 'function') opts.onPressEnd(detail);
      return true;
    }
    function cancelVisual(event, reason) {
      if (destroyed || !visualActive) return false;
      var source = visualSource;
      visualActive = false;
      visualSource = null;
      var detail = detailFor(reason || 'press-cancel', event, source);
      if (typeof opts.onPressCancel === 'function') opts.onPressCancel(detail);
      return true;
    }
    scope.add(DOM.listen(target, 'pointerdown', function (event) { startVisual(event, DOM.activationSource(event), 'pointer-start'); }));
    scope.add(DOM.listen(target, 'pointerup', function (event) { endVisual(event, 'pointer-end'); }));
    scope.add(DOM.listen(target, 'pointercancel', function (event) { cancelVisual(event, 'pointer-cancel'); }));
    scope.add(DOM.listen(target, 'pointerleave', function (event) { if (visualSource !== 'keyboard') cancelVisual(event, 'pointer-leave'); }));
    if (doc) scope.add(DOM.listen(doc, 'pointerup', function (event) { if (visualActive && visualSource !== 'keyboard') endVisual(event, 'document-pointer-end'); }, true));
    scope.add(DOM.listen(target, 'click', function (event) {
      if (keyboardActivationPending && event.detail === 0) { keyboardActivationPending = false; return; }
      keyboardActivationPending = false;
      press(event, DOM.activationSource(event), 'click');
    }));
    if (opts.keyboard !== false) {
      interactionScope = interactionController.registerScope({
        id: interactionScopeId,
        root: target,
        capability: capability,
        resolveAction: function (event) {
          if (!event) return null;
          var key = event.key;
          if (key === 'Enter' && opts.enter !== false) return 'ACTIVATE';
          if ((key === ' ' || key === 'Spacebar') && opts.space !== false) return 'ACTIVATE';
          return null;
        },
        onAction: function (action, context) {
          if (action !== 'ACTIVATE') return 'pass';
          var event = context && context.originalEvent || null;
          var key = event && event.key;
          if (!event || event.repeat === true) return 'pass';
          startVisual(event, 'keyboard', key === 'Enter' ? 'enter-start' : 'space-start');
          if (!synthesizeKeyboard) return 'pass';
          keyboardActivationPending = true;
          press(event, 'keyboard', key === 'Enter' ? 'enter' : 'space');
          return opts.preventDefaultOnKeyboard === false ? 'pass' : 'handled';
        }
      });
      scope.add(DOM.listen(target, 'keydown', function (event) {
        // A nested keyboard owner gets first refusal; InteractionController owns the
        // semantic ACTIVATE mapping while PressInteraction retains pointer/visual execution.
        if (event && event.defaultPrevented === true) return;
        var outcome = interactionController.dispatch(event, { ownerId: interactionScopeId, source: 'keyboard' });
        if (outcome === 'blocked') blocked(event);
      }));
      scope.add(DOM.listen(target, 'keyup', function (event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') endVisual(event, event.key === 'Enter' ? 'enter-end' : 'space-end');
      }));
    }
    function destroy() {
      if (destroyed) return false;
      if (visualActive) cancelVisual(null, 'destroy');
      destroyed = true;
      scope.dispose();
      if (interactionScope) { interactionScope.release(); interactionScope = null; }
      if (ownsInteractionController) interactionController.destroy();
      if (ownsCapability) capability.destroy();
      target = null;
      return true;
    }
    return Object.freeze({
      press: press, pressStart: startVisual, pressEnd: endVisual, cancel: cancelVisual,
      canActivate: function () { return !destroyed && capability.can('activate'); },
      getPolicy: policy,
      getCapabilityController: function () { return capability; },
      getInteractionController: function () { return interactionController; },
      getState: function () { return Object.freeze({ active: visualActive, source: visualSource, destroyed: destroyed }); },
      destroy: destroy
    });
  }

export const PressInteraction = Object.freeze({ create, guard, isNativeActivationTarget });
export { create, guard, isNativeActivationTarget };
