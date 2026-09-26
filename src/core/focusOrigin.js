import { DOM } from './dom.js';
import { Scheduler } from './scheduler.js';

const global = globalThis;
const ORIGINS = Object.freeze(['pointer', 'touch', 'keyboard', 'programmatic']);
const records = typeof WeakMap === 'function' ? new WeakMap() : null;

function normalize(value, fallback = 'programmatic') {
  const origin = String(value || fallback).toLowerCase();
  return ORIGINS.includes(origin) ? origin : fallback;
}
function documentOf(value) {
  if (!value) return global.document || null;
  if (value.nodeType === 9) return value;
  return value.ownerDocument || null;
}
function sameOwner(owner, target) { return !!(owner && target && (owner === target || (owner.contains && owner.contains(target)))); }
function relatedOwner(a, b) { return sameOwner(a, b) || sameOwner(b, a); }
function isDiscreteActionTarget(target) {
  if (!target || target.nodeType !== 1) return false;
  var tag = String(target.tagName || '').toLowerCase();
  if (tag === 'button') return true;
  if (tag === 'input') return ['button','checkbox','radio','submit','reset'].indexOf(String(target.type || '').toLowerCase()) >= 0;
  var role = target.getAttribute && String(target.getAttribute('role') || '').toLowerCase();
  return ['button','checkbox','radio','switch'].indexOf(role) >= 0;
}
function createRecord(doc) {
  const listeners = [], cleanups = [];
  const state = { element:doc && doc.activeElement && doc.activeElement.nodeType === 1 ? doc.activeElement : null, origin:'programmatic', pending:null, revision:0, listeners, cleanups };
  const pendingExpiry = Scheduler.createDelayScheduler(function (_timestamp, pending) { if (state.pending === pending) state.pending = null; }, { view:doc && doc.defaultView || global });
  cleanups.push(function () { pendingExpiry.dispose(); });
  function publish(element, origin, source, event, preservePending = false) {
    const next = normalize(origin), changed = state.element !== element || state.origin !== next;
    state.element = element || null; state.origin = next;
    if (!preservePending) state.pending = null;
    if (!changed) return false;
    state.revision += 1;
    const snapshot = getState(doc);
    listeners.slice().forEach(handler => handler(snapshot, { source:source || next, originalEvent:event || null }));
    return true;
  }
  function expirePending(pending) { pendingExpiry.request(0, pending); }
  function setEventIntent(target, origin, source) {
    const pending = { target:target || null, origin:normalize(origin), source:source || origin, revision:state.revision + 1 };
    state.pending = pending; expirePending(pending); return pending;
  }
  function point(origin, event) {
    const target = event && event.target && event.target.nodeType === 1 ? event.target : null;
    setEventIntent(target, origin, event && event.type || origin);
    const active = doc && doc.activeElement;
    const documentShell = active && (active === doc.body || active === doc.documentElement);
    if (active && active.nodeType === 1 && !documentShell && relatedOwner(active, target)) {
      // Reclassify the current real-focus owner immediately. If the pointer target
      // is a different related node, keep the intent until the browser's ensuing
      // focusin so ancestor -> descendant focus handoff remains pointer-origin.
      publish(active, origin, event && event.type, event, active !== target);
    }
  }
  if (doc) {
    cleanups.push(DOM.listen(doc, 'pointerdown', event => point(event && event.pointerType === 'touch' ? 'touch' : 'pointer', event), true));
    cleanups.push(DOM.listen(doc, 'mousedown', event => point('pointer', event), true));
    cleanups.push(DOM.listen(doc, 'touchstart', event => point('touch', event), true));
    cleanups.push(DOM.listen(doc, 'keydown', event => {
      if (!event || event.defaultPrevented || event.isComposing) return;
      if (event.key === 'Tab') { setEventIntent(null, 'keyboard', 'tab'); return; }
      if ((event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') && isDiscreteActionTarget(event.target) && doc.activeElement === event.target) publish(event.target, 'keyboard', 'keyboard-activation', event);
    }, true));
    cleanups.push(DOM.listen(doc, 'focusin', event => {
      const target = event && event.target && event.target.nodeType === 1 ? event.target : null;
      if (!target) return;
      const pending = state.pending;
      const matchesPending = !!(pending && (!pending.target || relatedOwner(target, pending.target)));
      const origin = matchesPending ? pending.origin : (state.element === target ? state.origin : 'programmatic');
      publish(target, origin, matchesPending && pending.source || 'focusin', event);
    }, true));
  }
  state.publish = publish; state.expirePending = expirePending;
  return state;
}
function setup(value) {
  const doc = documentOf(value) || global.document;
  if (!doc) return null;
  let record = records && records.get(doc);
  if (!record) { record = createRecord(doc); if (records) records.set(doc, record); }
  return record;
}
function getState(value) {
  const doc = documentOf(value) || value || global.document, record = setup(doc);
  if (!record) return Object.freeze({ element:null, origin:'programmatic', revision:0, pending:null });
  const active = doc && doc.activeElement && doc.activeElement.nodeType === 1 ? doc.activeElement : null;
  if (active && active !== record.element && !record.pending) { record.element=active; record.origin='programmatic'; record.revision+=1; }
  return Object.freeze({ element:record.element || null, origin:record.origin, revision:record.revision, pending:record.pending ? Object.freeze({ target:record.pending.target || null, origin:record.pending.origin, source:record.pending.source, revision:record.pending.revision }) : null });
}
function originOf(element) { if (!element || element.nodeType !== 1) return null; const state=getState(element.ownerDocument); return state.element===element ? state.origin : null; }
function isKeyboard(value) { if (value && value.nodeType === 1) return originOf(value)==='keyboard'; return getState(value).origin==='keyboard'; }
function prepare(target, origin, meta = {}) {
  if (!target || target.nodeType !== 1) return false;
  const record=setup(target.ownerDocument); if(!record)return false;
  const pending={ target, origin:normalize(origin), source:meta.source || 'programmatic-focus', revision:record.revision + 1 };
  record.pending=pending; if(record.expirePending)record.expirePending(pending); return true;
}
function cancelPending(target) { const doc=documentOf(target)||target||global.document, record=setup(doc); if(!record||!record.pending)return false; if(target&&target.nodeType===1&&record.pending.target&&record.pending.target!==target)return false; record.pending=null; return true; }
function set(target, origin, meta = {}) { if(!target||target.nodeType!==1)return false; const record=setup(target.ownerDocument); return record ? record.publish(target,normalize(origin),meta.source||'explicit',meta.originalEvent||null) : false; }
function inherited(value, fallback='programmatic') { const state=getState(value); return normalize(state&&state.origin,fallback); }
function capture(value) { const doc=documentOf(value)||value||global.document, state=getState(doc), element=doc&&doc.activeElement&&doc.activeElement.nodeType===1?doc.activeElement:state.element; return Object.freeze({ element:element||null, origin:element&&state.element===element?state.origin:'programmatic' }); }
function onChange(handler,value){ if(typeof handler!=='function')throw new TypeError('[QXFRAME9A7C2] FocusOrigin onChange handler must be a function.'); const record=setup(value); if(!record)return()=>false; record.listeners.push(handler); let active=true; return function(){if(!active)return false;active=false;const index=record.listeners.indexOf(handler);if(index>=0)record.listeners.splice(index,1);return index>=0;}; }
function destroy(value){ const doc=documentOf(value)||value||global.document, record=records&&doc?records.get(doc):null; if(!record)return false; record.cleanups.splice(0).forEach(cleanup=>{try{cleanup();}catch(_){}}); record.listeners.length=0; records.delete(doc); return true; }

export const FocusOrigin=Object.freeze({setup,getState,originOf,isKeyboard,prepare,cancelPending,set,inherited,capture,onChange,destroy,origins:ORIGINS});
export {setup,getState,originOf,isKeyboard,prepare,cancelPending,set,inherited,capture,onChange,destroy};
