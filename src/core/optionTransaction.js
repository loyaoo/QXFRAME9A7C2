
import { Utils } from '../utils/utils.js';

function createOptionTransaction(initial, normalizers, validate) {
  var rules = normalizers || {};
  var validator = Utils.isFunction(validate) ? validate : null;
  function resolve(current, next) {
    var candidate = Utils.immutablePatch(current || {}, next || {}, rules);
    if (validator) validator(candidate, next || {}, current || {});
    return candidate;
  }
  var value = resolve({}, initial || {});
  return Object.freeze({
    get:function(){return value;},
    update:function(next){var candidate=resolve(value,next||{});value=candidate;return value;},
    restore:function(previous){value=previous;return value;}
  });
}
function rejectImmutable(next, names, owner) {
  var source=next||{}, blocked=Array.isArray(names)?names:[];
  blocked.forEach(function(name){ if(Utils.own(source,name)) throw new Error('[QXFRAME9A7C2] ' + String(owner||'Component') + ' option "' + name + '" is immutable; destroy and recreate to change it.'); });
  return source;
}
function patchOptions(current, next, normalizers) { return Utils.immutablePatch(current||{}, next||{}, normalizers||{}); }

export const OptionTransaction = Object.freeze({ create: createOptionTransaction, rejectImmutable, patch: patchOptions });
export { createOptionTransaction, rejectImmutable, patchOptions };
