
import { Utils } from '../utils/utils.js';
import { Events } from './events.js';

function dispatchOpenState(opened, detail, options) {
  var opts = options || {}, info = Object.assign({ open:opened === true, source:'api', reason:opened === true ? 'open' : 'close', originalEvent:null }, detail || {});
  info.open = opened === true;
  if (Utils.isFunction(opts.decorate)) info = Object.assign(info, opts.decorate(info) || {});
  function current() {
    if (Utils.isFunction(opts.isCurrent) && opts.isCurrent(info) === false) return false;
    if (Utils.isFunction(opts.shouldEmit) && opts.shouldEmit(info) === false) return false;
    return true;
  }
  if (Utils.isFunction(opts.beforeChange) && opts.beforeChange(info) === false) return info;
  if (info.open && Utils.isFunction(opts.onOpen)) opts.onOpen(info);
  if (!current()) return info;
  if (!info.open && Utils.isFunction(opts.onClose)) opts.onClose(info);
  if (!current()) return info;
  if (Utils.isFunction(opts.onChange)) opts.onChange(info.open, info);
  if (!current()) return info;
  if (opts.emitter && Utils.isFunction(opts.emitter.emit)) {
    if (opts.emitPhase === true) {
      opts.emitter.emit(info.open ? (opts.openEventName || 'open') : (opts.closeEventName || 'close'), info);
      if (!current()) return info;
    }
    opts.emitter.emit(opts.eventName || 'openChange', info);
  }
  return info;
}
function createOpenStateBridge(options) {
  var opts = options || {}, emitter = opts.emitter || Events.createEmitter(), ownsEmitter = !opts.emitter, value = opts.open === true, destroyed=false;
  function emit(next, detail) {
    if (destroyed) return false;
    value = next === true;
    var info = Object.assign({ open:value, source:'api', reason:value?'open':'close', originalEvent:null }, detail || {});
    if (Utils.isFunction(opts.decorate)) info = Object.assign(info, opts.decorate(info) || {});
    if (Utils.isFunction(opts.onChange)) opts.onChange(value, info);
    emitter.emit(opts.eventName || 'openChange', info);
    return info;
  }
  return Object.freeze({ emit:emit, open:function(detail){return emit(true,detail);}, close:function(detail){return emit(false,detail);}, get:function(){return value;}, destroy:function(){if(destroyed)return false;destroyed=true;if(ownsEmitter)emitter.dispose();return true;} });
}

export const OpenStateBridge = Object.freeze({ create: createOpenStateBridge, dispatch: dispatchOpenState });
export { createOpenStateBridge, dispatchOpenState };
