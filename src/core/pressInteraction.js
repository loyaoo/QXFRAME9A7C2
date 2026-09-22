
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { InteractionDetails } from './interactionDetails.js';
import { InteractionPolicy } from './interactionPolicy.js';

const global = globalThis;

function guard(event, options) {
    var opts = options || {};
    var resolved = opts.policy || InteractionPolicy.resolve(typeof opts.getState === 'function' ? (opts.getState() || {}) : (opts.state || {}), opts.capabilities || {});
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
    function policy() { return InteractionPolicy.resolve(state(), opts.capabilities || {}); }
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
      scope.add(DOM.listen(target, 'keydown', function (event) {
        // A nested keyboard owner (Input/Select/virtual composite/etc.) gets first refusal.
        // Trigger/Press may live on an ancestor shell, so honoring defaultPrevented here
        // prevents one Enter/Space from both committing the child action and toggling
        // the ancestor trigger a second time.
        if (event && event.defaultPrevented === true) return;
        if (DOM.isComposingEvent(event)) return;
        var key = event.key;
        var allowEnter = opts.enter !== false;
        var allowSpace = opts.space !== false;
        var activationKey = (key === 'Enter' && allowEnter) || ((key === ' ' || key === 'Spacebar') && allowSpace);
        if (!activationKey) return;
        if (!event.repeat) startVisual(event, 'keyboard', key === 'Enter' ? 'enter-start' : 'space-start');
        if (synthesizeKeyboard && !event.repeat) {
          if (opts.preventDefaultOnKeyboard !== false && event.preventDefault) event.preventDefault();
          keyboardActivationPending = true;
          press(event, 'keyboard', key === 'Enter' ? 'enter' : 'space');
        }
      }));
      scope.add(DOM.listen(target, 'keyup', function (event) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') endVisual(event, event.key === 'Enter' ? 'enter-end' : 'space-end');
      }));
    }
    function destroy() { if (destroyed) return false; if (visualActive) cancelVisual(null, 'destroy'); destroyed = true; scope.dispose(); target = null; return true; }
    return Object.freeze({ press: press, pressStart: startVisual, pressEnd: endVisual, cancel: cancelVisual, canActivate: function () { return !destroyed && policy().activatable; }, getPolicy: policy, getState: function () { return Object.freeze({ active: visualActive, source: visualSource, destroyed: destroyed }); }, destroy: destroy });
  }

export const PressInteraction = Object.freeze({ create, guard, isNativeActivationTarget });
export { create, guard, isNativeActivationTarget };
