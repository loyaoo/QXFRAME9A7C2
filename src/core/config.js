import { Events } from './events.js';
import { ObserverHub } from './observerHub.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

var SIZES = ['xs','sm','md','lg','xl'];
var VARIANTS = ['outlined','filled','borderless','underlined'];
var DEFAULTS = Object.freeze({
  size:'md',
  variant:'outlined',
  focusOutline:true,
  motion:true,
  triggerOpenDelay:0,
  triggerCloseDelay:80
});
var state = {
  size:DEFAULTS.size,
  variant:DEFAULTS.variant,
  focusOutline:DEFAULTS.focusOutline,
  motion:DEFAULTS.motion,
  triggerOpenDelay:DEFAULTS.triggerOpenDelay,
  triggerCloseDelay:DEFAULTS.triggerCloseDelay
};
var emitter = Events.createEmitter();
var motionEmitter = Events.createEmitter();
var scopedConfigs = typeof WeakMap === 'function' ? new WeakMap() : null;
var reducedMotion = false;

function own(object,key){return Object.prototype.hasOwnProperty.call(object||{},key);}
function isPlainObject(value){if(!value||Object.prototype.toString.call(value)!=='[object Object]')return false;var proto=Object.getPrototypeOf(value);return proto===Object.prototype||proto===null;}
function snapshot(){return Object.freeze(Utils.copyOwn({},state));}
function nonNegativeDelay(value,name){var number=Number(value);if(!Number.isFinite(number)||number<0)throw new TypeError('[QXFRAME9A7C2] Config '+name+' must be a finite non-negative number.');return number;}
function emitMotionChange(source,event,root){
  motionEmitter.emit('change',Object.freeze({source:source||'config',originalEvent:event||null,root:root||null,reducedMotion:reducedMotion===true}));
}

ObserverHub.media('(prefers-reduced-motion: reduce)',function(media,event){
  reducedMotion=!!(media&&media.matches);
  if(event)emitMotionChange('media',event,null);
},{schedule:'sync',immediate:true,window:global});

function validate(next){
  var out={};
  if(own(next,'size')){out.size=String(next.size).toLowerCase();if(SIZES.indexOf(out.size)<0)throw new TypeError('[QXFRAME9A7C2] Config size must be xs, sm, md, lg, or xl.');}
  if(own(next,'variant')){out.variant=String(next.variant).toLowerCase();if(VARIANTS.indexOf(out.variant)<0)throw new TypeError('[QXFRAME9A7C2] Config variant must be outlined, filled, borderless, or underlined.');}
  ['focusOutline','motion'].forEach(function(key){if(own(next,key)){if(typeof next[key]!=='boolean')throw new TypeError('[QXFRAME9A7C2] Config '+key+' must be boolean.');out[key]=next[key];}});
  if(own(next,'triggerOpenDelay'))out.triggerOpenDelay=nonNegativeDelay(next.triggerOpenDelay,'triggerOpenDelay');
  if(own(next,'triggerCloseDelay'))out.triggerCloseDelay=nonNegativeDelay(next.triggerCloseDelay,'triggerCloseDelay');
  Object.keys(next||{}).forEach(function(key){
    if(['size','variant','focusOutline','motion','triggerOpenDelay','triggerCloseDelay'].indexOf(key)<0){
      throw new TypeError('[QXFRAME9A7C2] Config does not accept unknown option: '+key+'. Theme and token styling is CSS-only.');
    }
  });
  return out;
}

function applyDocument(){
  var doc=global.document,root=doc&&doc.documentElement;
  if(root&&root.classList)root.classList.toggle('qxframe9a7c2-motion-disabled',state.motion===false);
}

function configure(next){
  if(!isPlainObject(next||{}))throw new TypeError('[QXFRAME9A7C2] Config configure expects a plain object.');
  var patch=validate(next||{}),previous=snapshot();
  Object.keys(patch).forEach(function(key){if(Utils.safeOwnKey(key))state[key]=patch[key];});
  applyDocument();
  var current=snapshot(),changed=Object.keys(patch);
  emitter.emit('change',{previous:previous,current:current,changed:changed});
  if(changed.indexOf('motion')>=0)emitMotionChange('config',null,null);
  return current;
}
function reset(){return configure(Utils.copyOwn({},DEFAULTS));}
function get(name){if(!own(state,name))throw new TypeError('[QXFRAME9A7C2] Unknown Config key: '+name);return state[name];}
function scopedPatchAt(element){return scopedConfigs&&element&&element.nodeType===1?scopedConfigs.get(element)||null:null;}
function resolveScoped(name,element){
  var node=element&&element.nodeType===1?element:null;
  while(node){
    var scoped=scopedPatchAt(node);
    if(scoped&&own(scoped,name))return scoped[name];
    node=node.parentElement;
  }
  return get(name);
}
function resolve(name,explicitValue,element){return explicitValue===undefined||explicitValue===null?resolveScoped(name,element):explicitValue;}
function prefersReducedMotion(){return reducedMotion===true;}
function motionEnabled(element,explicitValue,respectReducedMotion){
  if(resolve('motion',explicitValue,element)===false)return false;
  return respectReducedMotion===false?true:!prefersReducedMotion();
}
function createScope(root,options){
  if(!root||root.nodeType!==1)throw new TypeError('[QXFRAME9A7C2] Config scope root must be an Element.');
  if(!scopedConfigs)throw new Error('[QXFRAME9A7C2] Config scopes require WeakMap support.');
  var destroyed=false,current=validate(options||{});
  var originalMotionDisabled=!!(root.classList&&root.classList.contains('qxframe9a7c2-motion-disabled'));
  function projectMotion(){
    if(!root.classList)return;
    if(own(current,'motion'))root.classList.toggle('qxframe9a7c2-motion-disabled',current.motion===false);
    else root.classList.toggle('qxframe9a7c2-motion-disabled',originalMotionDisabled);
  }
  function snapshotScope(){return Object.freeze(Utils.copyOwn({},current));}
  function update(next){
    if(destroyed)return false;
    var patch=validate(next||{}),hadMotion=own(patch,'motion');
    current=Utils.mergeOwn(current,patch);
    scopedConfigs.set(root,current);
    projectMotion();
    if(hadMotion)emitMotionChange('scope',null,root);
    return snapshotScope();
  }
  function destroy(){
    if(destroyed)return false;
    var hadMotion=own(current,'motion');
    destroyed=true;
    scopedConfigs.delete(root);
    if(root.classList)root.classList.toggle('qxframe9a7c2-motion-disabled',originalMotionDisabled);
    if(hadMotion)emitMotionChange('scope-destroy',null,root);
    return true;
  }
  scopedConfigs.set(root,current);
  projectMotion();
  return Object.freeze({root:root,update:update,getState:snapshotScope,destroy:destroy});
}

applyDocument();

var api=Object.freeze({
  defaults:DEFAULTS,
  get:get,
  resolve:resolve,
  resolveScoped:resolveScoped,
  getState:snapshot,
  configure:configure,
  update:configure,
  reset:reset,
  createScope:createScope,
  prefersReducedMotion:prefersReducedMotion,
  motionEnabled:motionEnabled,
  onChange:function(handler){return emitter.on('change',handler);},
  onMotionChange:function(handler){return motionEmitter.on('change',handler);}
});

export const Config = api;
