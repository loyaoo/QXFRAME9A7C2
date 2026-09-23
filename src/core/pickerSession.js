
import { Utils } from '../utils/utils.js';
import { StateController } from './stateController.js';
import { ValueEquality } from '../utils/valueEquality.js';

function createPickerSession(options) {
  var opts = options || {};
  var ownsController = !opts.controller;
  var controller = opts.controller || StateController.create({
    value: opts.value,
    controlled: opts.controlled === true,
    normalize: opts.normalize,
    copy: opts.copy || ValueEquality.copy,
    equals: opts.equals || ValueEquality.equals,
    onChange: opts.onChange,
    onValueChange: opts.onValueChange,
    onDraftChange: opts.onDraftChange
  });
  function resolveFlag(value, detail) { return Utils.isFunction(value) ? value(controller, detail || {}) === true : value === true; }
  function open(meta) {
    var detail = Utils.assignOwn({ silent:true, source:'popup', reason:'open' }, meta || {});
    controller.begin(detail);
    if (Utils.isFunction(opts.onOpenDraft)) opts.onOpenDraft(controller, detail);
    return true;
  }
  function commit(meta) {
    var detail = Utils.assignOwn({ source:'api', reason:'confirm' }, meta || {});
    if (Utils.isFunction(opts.canCommit) && opts.canCommit(controller, detail) === false) return false;
    var ok=controller.commit(detail);
    if(ok && Utils.isFunction(opts.onCommit)) opts.onCommit(controller, detail);
    return ok;
  }
  function cancel(meta) {
    var detail = Utils.assignOwn({ source:'api', reason:'cancel' }, meta || {});
    var ok=controller.cancel(detail);
    if(Utils.isFunction(opts.onCancel)) opts.onCancel(controller, detail);
    return ok;
  }
  function shouldRollback(detail) {
    if (opts.rollbackDirtyOnClose !== undefined) return resolveFlag(opts.rollbackDirtyOnClose, detail);
    return resolveFlag(opts.needConfirm, detail);
  }
  function close(detail) {
    var info = Utils.mergeOwn( detail || {}), rolledBack = false;
    if (controller.dirty && shouldRollback(info)) { rolledBack = cancel({ silent:true, source:'popup', reason: info.reason || 'close', originalEvent:info.originalEvent || null }) !== false; }
    info.rolledBack = rolledBack;
    info.dirty = controller.dirty === true;
    if (Utils.isFunction(opts.onCloseDraft)) opts.onCloseDraft(controller, info);
    return true;
  }
  function updateOptions(next) { opts = Utils.mergeOwn(opts, next || {}); return api; }
  var api = Object.freeze({ controller:controller, open:open, commit:commit, cancel:cancel, close:close, updateOptions:updateOptions, destroy:function(){return ownsController ? controller.destroy() : false;} });
  return api;
}

export const PickerSession = Object.freeze({ create: createPickerSession });
export { createPickerSession };
