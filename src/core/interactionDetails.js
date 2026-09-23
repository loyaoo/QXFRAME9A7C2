
import { Utils } from '../utils/utils.js';
function inferSource(event) {
  if (!event) return 'api';
  var type = String(event.type || '').toLowerCase();
  if (event.isTrusted === false) return 'api';
  if (type.indexOf('key') === 0) return 'keyboard';
  if (type === 'click') {
    if (event.pointerType) return 'pointer';
    return Number(event.detail || 0) === 0 ? 'keyboard' : 'pointer';
  }
  if (type.indexOf('pointer') === 0 || type.indexOf('mouse') === 0) return 'pointer';
  if (type.indexOf('touch') === 0) return 'touch';
  if (type === 'contextmenu') return 'pointer';
  if (type === 'focus' || type === 'focusin' || type === 'focusout' || type === 'blur') return 'focus';
  if (type === 'input' || type === 'beforeinput' || type === 'change' || type.indexOf('composition') === 0) return 'input';
  return 'event';
}

function create(reason, event, extras) {
  var source = extras && extras.source ? String(extras.source) : inferSource(event);
  var detail = {
    reason: String(reason || 'unknown'),
    source: source,
    originalEvent: event || null,
    trigger: extras && extras.trigger || null,
    currentTarget: extras && extras.currentTarget || null,
    cancelled: false,
    propagationAllowed: false
  };
  if (extras) Object.keys(extras).forEach(function (key) { if (Utils.safeOwnKey(key) && !(key in detail)) detail[key] = extras[key]; });
  detail.cancel = function () {
    if (detail.cancelled) return false;
    detail.cancelled = true;
    if (detail.originalEvent && detail.originalEvent.preventDefault) detail.originalEvent.preventDefault();
    return true;
  };
  detail.allowPropagation = function () { detail.propagationAllowed = true; return detail; };
  detail.stopPropagation = function () {
    detail.propagationAllowed = false;
    if (detail.originalEvent && detail.originalEvent.stopPropagation) detail.originalEvent.stopPropagation();
    return detail;
  };
  return detail;
}

export const InteractionDetails = Object.freeze({ create, inferSource });
export { create, inferSource };
