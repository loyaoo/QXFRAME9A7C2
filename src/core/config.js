
import { Events } from './events.js';
import { DOMProjection } from './domProjection.js';
import { ObserverHub } from './observerHub.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

var THEMES = ['light','dark'];
  var SIZES = ['xs','sm','md','lg','xl'];
  var VDOMNTS = ['outlined','filled','borderless','underlined'];
  var DEFAULTS = Object.freeze({ theme: 'light', size: 'md', variant: 'outlined', focusOutline: true, motion: true, triggerOpenDelay: 0, triggerCloseDelay: 80 });
  function initialTheme() {
    var doc = global.document, root = doc && doc.documentElement;
    if (!root) return DEFAULTS.theme;
    var dataTheme = root.getAttribute && root.getAttribute('data-qxframe9a7c2-theme');
    if (dataTheme === 'dark' || dataTheme === 'light') return dataTheme;
    /* Legacy theme classes are input adapters only: normalize once into the canonical data boundary. */
    var legacyTheme = root.classList && root.classList.contains('qxframe9a7c2-theme-dark') ? 'dark' : (root.classList && root.classList.contains('qxframe9a7c2-theme-light') ? 'light' : '');
    if (legacyTheme) { root.setAttribute('data-qxframe9a7c2-theme', legacyTheme); root.classList.remove('qxframe9a7c2-theme-light', 'qxframe9a7c2-theme-dark'); return legacyTheme; }
    return DEFAULTS.theme;
  }
  var state = { theme: initialTheme(), size: DEFAULTS.size, variant: DEFAULTS.variant, focusOutline: DEFAULTS.focusOutline, motion: DEFAULTS.motion, triggerOpenDelay: DEFAULTS.triggerOpenDelay, triggerCloseDelay: DEFAULTS.triggerCloseDelay, tokens: Object.create(null) };
  var emitter = Events.createEmitter();
  var motionEmitter = Events.createEmitter();
  function isPlainObject(value) { if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false; var proto = Object.getPrototypeOf(value); return proto === Object.prototype || proto === null; }
  var tokenOriginals = Object.create(null);
  var scopedConfigs = typeof WeakMap === 'function' ? new WeakMap() : null;
  var reducedMotion = false;
  function emitMotionChange(source, event, root) {
    motionEmitter.emit('change', Object.freeze({ source: source || 'config', originalEvent: event || null, root: root || null, reducedMotion: reducedMotion === true }));
  }
  ObserverHub.media('(prefers-reduced-motion: reduce)', function (media, event) {
    reducedMotion = !!(media && media.matches);
    if (event) emitMotionChange('media', event, null);
  }, { schedule:'sync', immediate:true, window:global });
  function own(object, key) { return Object.prototype.hasOwnProperty.call(object || {}, key); }
  function cloneTokens(tokens) { var out = {}; Object.keys(tokens || {}).forEach(function (key) { out[key] = tokens[key]; }); return out; }
  function snapshot() { return Object.freeze({ theme: state.theme, size: state.size, variant: state.variant, focusOutline: state.focusOutline, motion: state.motion, triggerOpenDelay: state.triggerOpenDelay, triggerCloseDelay: state.triggerCloseDelay, tokens: Object.freeze(cloneTokens(state.tokens)) }); }
  function nonNegativeDelay(value, name) { var number = Number(value); if (!Number.isFinite(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] Config ' + name + ' must be a finite non-negative number.'); return number; }
  function validateTokens(value) {
    if (value == null) return Object.create(null);
    if (!isPlainObject(value)) throw new TypeError('[QXFRAME9A7C2] Config tokens must be a plain object.');
    var out = Object.create(null);
    Object.keys(value).forEach(function (key) {
      if (!/^--qxframe9a7c2-[a-z0-9-]+$/i.test(key)) throw new TypeError('[QXFRAME9A7C2] Config token keys must use canonical --qxframe9a7c2-* names: ' + key);
      if (value[key] === undefined || value[key] === null) return;
      out[key] = String(value[key]);
    });
    return out;
  }
  function validate(next) {
    var out = {};
    if (own(next,'theme')) { out.theme=String(next.theme).toLowerCase(); if (THEMES.indexOf(out.theme)<0) throw new TypeError('[QXFRAME9A7C2] Config theme must be light or dark.'); }
    if (own(next,'size')) { out.size=String(next.size).toLowerCase(); if (SIZES.indexOf(out.size)<0) throw new TypeError('[QXFRAME9A7C2] Config size must be xs, sm, md, lg, or xl.'); }
    if (own(next,'variant')) { out.variant=String(next.variant).toLowerCase(); if (VDOMNTS.indexOf(out.variant)<0) throw new TypeError('[QXFRAME9A7C2] Config variant must be outlined, filled, borderless, or underlined.'); }
    ['focusOutline','motion'].forEach(function (key) { if (own(next,key)) { if (typeof next[key] !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Config ' + key + ' must be boolean.'); out[key]=next[key]; } });
    if (own(next,'triggerOpenDelay')) out.triggerOpenDelay=nonNegativeDelay(next.triggerOpenDelay,'triggerOpenDelay');
    if (own(next,'triggerCloseDelay')) out.triggerCloseDelay=nonNegativeDelay(next.triggerCloseDelay,'triggerCloseDelay');
    if (own(next,'tokens')) out.tokens=validateTokens(next.tokens);
    Object.keys(next || {}).forEach(function (key) { if (['theme','size','variant','focusOutline','motion','triggerOpenDelay','triggerCloseDelay','tokens'].indexOf(key)<0) throw new TypeError('[QXFRAME9A7C2] Config does not accept unknown option: ' + key + '.'); });
    return out;
  }
  function applyDocument() {
    var doc = global.document, root = doc && doc.documentElement;
    if (!root) return;
    root.setAttribute('data-qxframe9a7c2-theme', state.theme);
    root.classList.remove('qxframe9a7c2-theme-light', 'qxframe9a7c2-theme-dark');
    root.classList.toggle('qxframe9a7c2-motion-disabled', state.motion === false);
    Object.keys(tokenOriginals).forEach(function (key) {
      if (own(state.tokens,key)) return;
      var original=tokenOriginals[key];
      if (original.had) root.style.setProperty(key,original.value,original.priority); else root.style.removeProperty(key);
      delete tokenOriginals[key];
    });
    Object.keys(state.tokens).forEach(function (key) {
      if (!tokenOriginals[key]) tokenOriginals[key]={had:root.style.getPropertyValue(key)!=='',value:root.style.getPropertyValue(key),priority:root.style.getPropertyPriority(key)};
      root.style.setProperty(key,state.tokens[key]);
    });
  }
  function configure(next) {
    if (!isPlainObject(next || {})) throw new TypeError('[QXFRAME9A7C2] Config configure expects a plain object.');
    var patch=validate(next || {}), previous=snapshot();
    Object.keys(patch).forEach(function (key) { state[key]=key==='tokens'?validateTokens(patch[key]):patch[key]; });
    applyDocument();
    var current=snapshot(), changed=Object.keys(patch);
    emitter.emit('change',{previous:previous,current:current,changed:changed});
    if (changed.indexOf('motion') >= 0) emitMotionChange('config',null,null);
    return current;
  }
  function reset() { return configure({theme:DEFAULTS.theme,size:DEFAULTS.size,variant:DEFAULTS.variant,focusOutline:DEFAULTS.focusOutline,motion:DEFAULTS.motion,triggerOpenDelay:DEFAULTS.triggerOpenDelay,triggerCloseDelay:DEFAULTS.triggerCloseDelay,tokens:{}}); }
  function get(name) { if (name === 'tokens') return Object.freeze(cloneTokens(state.tokens)); if (!own(state,name)) throw new TypeError('[QXFRAME9A7C2] Unknown Config key: '+name); return state[name]; }
  function scopedPatchAt(element) { return scopedConfigs && element && element.nodeType === 1 ? scopedConfigs.get(element) || null : null; }
  function resolveScoped(name, element) {
    var node = element && element.nodeType === 1 ? element : null;
    while (node) {
      var scoped = scopedPatchAt(node);
      if (scoped) {
        if (name === 'tokens' && scoped.tokens) return Object.freeze(cloneTokens(scoped.tokens));
        if (own(scoped, name)) return scoped[name];
      }
      node = node.parentElement;
    }
    return get(name);
  }
  function resolve(name, explicitValue, element) { return explicitValue === undefined || explicitValue === null ? resolveScoped(name, element) : explicitValue; }
  function prefersReducedMotion() { return reducedMotion === true; }
  function motionEnabled(element, explicitValue, respectReducedMotion) {
    if (resolve('motion', explicitValue, element) === false) return false;
    return respectReducedMotion === false ? true : !prefersReducedMotion();
  }
  function getToken(name, fallback, element) {
    var key=String(name||''); if (!/^--qxframe9a7c2-/.test(key)) throw new TypeError('[QXFRAME9A7C2] Config getToken requires a canonical --qxframe9a7c2-* name.');
    var node=element&&element.nodeType===1?element:null;
    while(node){var scoped=scopedPatchAt(node);if(scoped&&scoped.tokens&&own(scoped.tokens,key))return scoped.tokens[key];node=node.parentElement;}
    return own(state.tokens,key)?state.tokens[key]:fallback;
  }
  function createScope(root, options) {
    if (!root || root.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Config scope root must be an Element.');
    if (!scopedConfigs) throw new Error('[QXFRAME9A7C2] Config scopes require WeakMap support.');
    var destroyed=false, current=validate(options||{}), tokenOriginals=Object.create(null);
    var originalTheme = root.getAttribute ? root.getAttribute('data-qxframe9a7c2-theme') : null;
    var originalClasses={ motionDisabled:!!(root.classList&&root.classList.contains('qxframe9a7c2-motion-disabled')) };
    function restoreToken(key){var original=tokenOriginals[key];if(!original)return;if(original.had)root.style.setProperty(key,original.value,original.priority);else root.style.removeProperty(key);delete tokenOriginals[key];}
    function projectScope(){
      if(own(current,'theme')) root.setAttribute('data-qxframe9a7c2-theme',current.theme);
      else if(originalTheme===null) root.removeAttribute('data-qxframe9a7c2-theme'); else root.setAttribute('data-qxframe9a7c2-theme',originalTheme);
      if(root.classList){
        if(own(current,'motion'))root.classList.toggle('qxframe9a7c2-motion-disabled',current.motion===false);
        else root.classList.toggle('qxframe9a7c2-motion-disabled',originalClasses.motionDisabled);
      }
      Object.keys(tokenOriginals).forEach(function(key){if(!(current.tokens&&own(current.tokens,key)))restoreToken(key);});
      Object.keys(current.tokens||{}).forEach(function(key){
        if(!tokenOriginals[key])tokenOriginals[key]={had:root.style.getPropertyValue(key)!=='',value:root.style.getPropertyValue(key),priority:root.style.getPropertyPriority(key)};
        root.style.setProperty(key,current.tokens[key]);
      });
    }
    scopedConfigs.set(root,current);projectScope();
    function update(next){if(destroyed)return false;var patch=validate(next||{}),hadMotion=own(patch,'motion');current=Object.assign({},current,patch);scopedConfigs.set(root,current);projectScope();if(hadMotion)emitMotionChange('scope',null,root);return snapshotScope();}
    function snapshotScope(){var out=Object.assign({},current);if(out.tokens)out.tokens=Object.freeze(cloneTokens(out.tokens));return Object.freeze(out);}
    function destroy(){if(destroyed)return false;var hadMotion=own(current,'motion');destroyed=true;scopedConfigs.delete(root);Object.keys(tokenOriginals).forEach(restoreToken);if(originalTheme===null)root.removeAttribute('data-qxframe9a7c2-theme');else root.setAttribute('data-qxframe9a7c2-theme',originalTheme);if(root.classList)root.classList.toggle('qxframe9a7c2-motion-disabled',originalClasses.motionDisabled);if(hadMotion)emitMotionChange('scope-destroy',null,root);return true;}
    return Object.freeze({root:root,update:update,getState:snapshotScope,destroy:destroy});
  }
  function captureContext(element) {
    var tokens = Object.create(null), chain = [], node = element && element.nodeType === 1 ? element : null;
    while (node) { chain.unshift(node); node = node.parentElement; }
    chain.forEach(function (currentNode) { var scoped = scopedPatchAt(currentNode); if (scoped && scoped.tokens) Object.keys(scoped.tokens).forEach(function (key) { tokens[key] = scoped.tokens[key]; }); });
    Object.keys(state.tokens).forEach(function (key) { if (!own(tokens,key)) tokens[key] = state.tokens[key]; });
    return Object.freeze({ theme: resolveScoped('theme', element), size: resolveScoped('size', element), variant: resolveScoped('variant', element), motion: resolveScoped('motion', element), tokens: Object.freeze(cloneTokens(tokens)) });
  }
  function projectContext(snapshotValue, target) {
    if (!target || target.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Config.projectContext target must be an Element.');
    var context = snapshotValue || captureContext(null), projection = DOMProjection.create();
    projection.setAttribute(target, 'data-qxframe9a7c2-theme', context.theme || DEFAULTS.theme);
    Object.keys(context.tokens || {}).forEach(function (key) { projection.setStyle(target, key, context.tokens[key]); });
    return projection;
  }
  var api=Object.freeze({ defaults: DEFAULTS, get:get, resolve:resolve, resolveScoped:resolveScoped, getToken:getToken, getState:snapshot, configure:configure, update:configure, reset:reset, createScope:createScope, captureContext:captureContext, projectContext:projectContext, prefersReducedMotion:prefersReducedMotion, motionEnabled:motionEnabled, onChange:function(handler){return emitter.on('change',handler);}, onMotionChange:function(handler){return motionEmitter.on('change',handler);} });

export const Config = api;
