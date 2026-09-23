
import { Utils } from '../utils/utils.js';

function createNoticePreset(options) {
  var opts=options||{}, owner=String(opts.owner||'Notice'), allowed=opts.allowedConfigure||[], stackDefaults=Utils.mergeOwn({threshold:3,offset:8,scale:0.95},opts.stackDefaults);
  function normalizeStack(value) {
    if(value===undefined||value===false)return false;
    if(value===true)return true;
    if(!value||typeof value!=='object'||Array.isArray(value))throw new TypeError('[QXFRAME9A7C2] '+owner+' stack must be boolean or { threshold, offset, scale }.');
    Object.keys(value).forEach(function(key){if(['threshold','offset','scale'].indexOf(key)<0)throw new TypeError('[QXFRAME9A7C2] '+owner+' stack unsupported option "'+key+'".');});
    var scale=Utils.finiteAtLeast(value.scale,stackDefaults.scale,0.01,owner+' stack.scale');
    if(scale>1)throw new TypeError('[QXFRAME9A7C2] '+owner+' stack.scale must be <= 1.');
    return {threshold:Math.max(1,Math.floor(Utils.finiteAtLeast(value.threshold,stackDefaults.threshold,1,owner+' stack.threshold'))),offset:Utils.finiteAtLeast(value.offset,stackDefaults.offset,0,owner+' stack.offset'),scale:scale};
  }
  function configure(target, next, normalize) {
    if(next===undefined) return Object.freeze(Utils.mergeOwn(target));
    if(!next||typeof next!=='object'||Array.isArray(next)) throw new TypeError('[QXFRAME9A7C2] '+owner+' configure() requires an object.');
    Object.keys(next).forEach(function(key){if(allowed.indexOf(key)<0) throw new TypeError('[QXFRAME9A7C2] '+owner+' configure() unsupported option "'+key+'".');});
    var normalized=normalize(Utils.mergeOwn(target,next));
    allowed.forEach(function(key){target[key]=normalized[key];});
    return Object.freeze(Object.assign({},target));
  }
  function createTyped(type, input, channel) {
    if(!input||typeof input!=='object'||Array.isArray(input)||input.nodeType) throw new TypeError('[QXFRAME9A7C2] '+owner+'.'+type+'() requires a canonical options object.');
    return channel.create(Utils.mergeOwn(input,{type:type}));
  }
  return Object.freeze({ configure:configure, createTyped:createTyped, normalizeStack:normalizeStack });
}

export const NoticePreset = Object.freeze({ create: createNoticePreset });
export { createNoticePreset };
