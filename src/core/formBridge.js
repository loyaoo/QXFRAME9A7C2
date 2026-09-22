// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOM } from './dom.js';
import { IdManager } from '../utils/id.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

function hasOwn(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
  function cloneValue(value) { return Array.isArray(value) ? value.slice() : value; }
  function stringValue(value) { return value === undefined || value === null ? '' : String(value); }
  function isFormField(element) {
    if (!element || element.nodeType !== 1) return false;
    var tag = String(element.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select';
  }
  function selectedValues(select) {
    return Array.prototype.filter.call(select.options || [], function (option) { return option.selected; }).map(function (option) { return String(option.value); });
  }
  function createAdapter(element) {
    if (!isFormField(element)) throw new TypeError('[QXFRAME9A7C2] FormFieldAdapter requires input, textarea, or select.');
    var tag = String(element.tagName || '').toLowerCase();
    var isSelect = tag === 'select';
    return Object.freeze({
      element: element,
      tagName: tag,
      multiple: isSelect && element.multiple === true,
      read: function () {
        if (isSelect && element.multiple === true) return selectedValues(element);
        return stringValue(element.value);
      },
      write: function (value) {
        if (isSelect) {
          var values = (Array.isArray(value) ? value : [value]).filter(function (entry) { return entry !== undefined && entry !== null; }).map(String);
          if (element.multiple === true) {
            Array.prototype.forEach.call(element.options || [], function (option) { option.selected = values.indexOf(String(option.value)) >= 0; });
          } else element.value = values.length ? values[0] : '';
          return;
        }
        if (String(element.type || '').toLowerCase() === 'file') return;
        element.value = stringValue(Array.isArray(value) ? value[0] : value);
      },
      setName: function (name) { element.name = name === undefined || name === null ? '' : String(name); },
      setDisabled: function (disabled) { element.disabled = disabled === true; },
      setReadOnly: function (readOnly) { if ('readOnly' in element) element.readOnly = readOnly === true; },
      setRequired: function (required) { element.required = required === true; },
      setCustomValidity: function (message) { if (element.setCustomValidity) element.setCustomValidity(stringValue(message)); },
      checkValidity: function () { return element.checkValidity ? element.checkValidity() : true; },
      reportValidity: function () { return element.reportValidity ? element.reportValidity() : (element.checkValidity ? element.checkValidity() : true); },
      getValidationMessage: function () { return stringValue(element.validationMessage); },
      getForm: function () { return element.form || (element.closest ? element.closest('form') : null); }
    });
  }
  function snapshot(element) {
    if (!element) return null;
    return {
      parent: element.parentNode || null,
      next: element.nextSibling || null,
      attributes: Array.prototype.map.call(element.attributes || [], function (attr) { return [attr.name, attr.value]; }),
      value: stringValue(element.value),
      selected: String(element.tagName || '').toLowerCase() === 'select' ? Array.prototype.map.call(element.options || [], function (option) { return option.selected === true; }) : null
    };
  }
  function restore(element, state) {
    if (!element || !state) return;
    Array.prototype.map.call(element.attributes || [], function (attr) { return attr.name; }).forEach(function (name) { element.removeAttribute(name); });
    state.attributes.forEach(function (entry) { element.setAttribute(entry[0], entry[1]); });
    if (state.selected) Array.prototype.forEach.call(element.options || [], function (option, index) { option.selected = state.selected[index] === true; });
    else if (String(element.type || '').toLowerCase() !== 'file') element.value = state.value;
    if (state.parent) state.parent.insertBefore(element, state.next && state.next.parentNode === state.parent ? state.next : null);
    else if (element.parentNode) element.parentNode.removeChild(element);
  }
  var generatedFormIds = typeof WeakMap === 'function' ? new WeakMap() : null;
  function ensureFormId(form, state) {
    if (!form) return '';
    var resource = generatedFormIds && generatedFormIds.get(form);
    if (resource) {
      resource.refs += 1;
      state.formIdResource = resource;
      state.generatedFormId = true;
      return resource.id;
    }
    if (form.id) return form.id;
    var id = IdManager.next('form');
    while (form.ownerDocument && form.ownerDocument.getElementById(id)) id = IdManager.next('form');
    form.id = id;
    resource = { id:id, refs:1, originalId:null };
    if (generatedFormIds) generatedFormIds.set(form, resource);
    state.formIdResource = resource;
    state.generatedFormId = true;
    return id;
  }
  function releaseFormId(form, state) {
    var resource = state && state.formIdResource;
    if (!form || !resource) return false;
    resource.refs = Math.max(0, resource.refs - 1);
    state.formIdResource = null;
    if (resource.refs > 0) return false;
    if (generatedFormIds) generatedFormIds.delete(form);
    if (form.id === resource.id) form.removeAttribute('id');
    return true;
  }
  function create(options) {
    var opts = Object.assign({ disabled:false, readOnly:false, required:false, value:'' }, options || {});
    var doc = opts.document || (opts.formField && opts.formField.ownerDocument) || (opts.root && opts.root.ownerDocument) || global.document;
    var root = opts.root || null, target = opts.target || null, formField = opts.formField || null;
    if (formField && !isFormField(formField)) throw new TypeError('[QXFRAME9A7C2] formField must be an input, textarea, or select Element.');
    var ownsFormField = false, fieldSnapshot = formField ? snapshot(formField) : null, originalForm = formField ? (formField.form || (formField.closest ? formField.closest('form') : null)) : null;
    var state = { generatedFormId:false, originalFormId: originalForm ? originalForm.getAttribute('id') : null, formIdResource:null };
    var extraFields = [], destroyed = false, dispatching = false, adapter = null, currentValue = cloneValue(opts.value);
    var resetCleanup = null, inputCleanup = null, changeCleanup = null;

    function ensureField() {
      if (formField || !opts.name) return formField;
      formField = doc.createElement('input'); formField.type = 'hidden'; formField.className = 'qxframe9a7c2-input-form-field'; formField.style.display = 'none'; ownsFormField = true;
      if (opts.moveIntoRoot === false && target) target.appendChild(formField); else if (root) root.appendChild(formField); else if (target) target.appendChild(formField);
      adapter = createAdapter(formField); return formField;
    }
    function clearExtras() { extraFields.splice(0).forEach(function (node) { if (node && node.parentNode) node.parentNode.removeChild(node); }); }
    function serialized(value) { return Utils.isFunction(opts.serializeValue) ? opts.serializeValue(cloneValue(value)) : cloneValue(value); }
    function bindNative() {
      if (!formField) return;
      if (!adapter) adapter = createAdapter(formField);
      var form = adapter.getForm();
      if (form && !resetCleanup) resetCleanup = DOM.listen(form, 'reset', function (event) {
        var schedule = global.setTimeout || function (fn) { fn(); };
        schedule(function () { if (destroyed) return; if (Utils.isFunction(opts.onReset)) opts.onReset({ source:'form', reason:'reset', originalEvent:event || null, bridge:api }); sync(); }, 0);
      });
      function nativeChanged(event) { if (destroyed || dispatching) return; currentValue = adapter.read(); if (Utils.isFunction(opts.onNativeChange)) opts.onNativeChange(cloneValue(currentValue), { source:'form-field', reason:event.type, originalEvent:event, bridge:api }); }
      if (!inputCleanup) inputCleanup = DOM.listen(formField, 'input', nativeChanged);
      if (!changeCleanup) changeCleanup = DOM.listen(formField, 'change', nativeChanged);
    }
    function prepareAuthoredField() {
      if (!formField) return;
      if (!adapter) adapter = createAdapter(formField);
      if (root && opts.projectLayout) opts.projectLayout(formField, root);
      var form = originalForm;
      if (root && formField.parentNode !== root && opts.moveIntoRoot !== false) {
        var rootForm = root.closest ? root.closest('form') : null;
        if (form && rootForm !== form) { var formId = ensureFormId(form, state); if (formId) formField.setAttribute('form', formId); }
        root.appendChild(formField);
      }
      formField.style.display = 'none'; formField.classList.add('qxframe9a7c2-input-form-field'); bindNative();
    }
    function sync() {
      clearExtras(); var field = ensureField(); if (!field) return false; if (!adapter) adapter = createAdapter(field); bindNative();
      var name = opts.name === undefined || opts.name === null ? '' : String(opts.name);
      adapter.setName(name); adapter.setDisabled(opts.disabled === true); adapter.setReadOnly(opts.readOnly === true); adapter.setRequired(opts.required === true);
      var raw = serialized(currentValue), values = Array.isArray(raw) ? raw.slice() : [raw]; if (!values.length) values = [''];
      adapter.write(adapter.multiple ? values : values[0]);
      if (!name || adapter.multiple || values.length < 2) return true;
      var parent = field.parentNode || root || target, cursor = field, formId = field.getAttribute ? field.getAttribute('form') : null;
      values.slice(1).forEach(function (value) { var hidden = doc.createElement('input'); hidden.type='hidden'; hidden.name=name; hidden.value=stringValue(value); hidden.disabled=opts.disabled===true; hidden.className='qxframe9a7c2-input-form-field'; if(formId) hidden.setAttribute('form',formId); if(parent){parent.insertBefore(hidden,cursor.nextSibling);cursor=hidden;} extraFields.push(hidden); });
      return true;
    }
    function dispatch(type) { if (!formField || !formField.dispatchEvent) return false; var EventCtor = doc && doc.defaultView && doc.defaultView.Event || global.Event; if (!EventCtor) return false; dispatching=true; try { formField.dispatchEvent(new EventCtor(type,{bubbles:true})); } finally { dispatching=false; } return true; }
    function setValue(value, meta) { if (destroyed) return api; var previous=cloneValue(currentValue); currentValue=cloneValue(value); sync(); var changed=!(Utils.isFunction(opts.equals) ? opts.equals(previous,currentValue) === true : ValueEquality.deep(previous,currentValue)); if (!(meta&&meta.silent) && (changed || (meta&&meta.forceEvent===true))) { dispatch('input'); dispatch('change'); } return api; }
    function updateOptions(nextOptions) { if (destroyed) return api; var next=nextOptions||{}; ['root','target','formField','document'].forEach(function(name){if(hasOwn(next,name))throw new Error('[QXFRAME9A7C2] FormBridge structural option "'+name+'" is immutable.');}); Object.keys(next).forEach(function(key){opts[key]=next[key];}); sync(); return api; }
    function destroy() { if (destroyed) return false; destroyed=true; clearExtras(); if(resetCleanup)resetCleanup(); if(inputCleanup)inputCleanup(); if(changeCleanup)changeCleanup(); resetCleanup=inputCleanup=changeCleanup=null; if(ownsFormField&&formField&&formField.parentNode)formField.parentNode.removeChild(formField); else if(formField&&fieldSnapshot)restore(formField,fieldSnapshot); if(originalForm&&state.generatedFormId) releaseFormId(originalForm,state); formField=null; adapter=null; root=null; target=null; return true; }
    var api=Object.freeze({setValue:setValue,updateOptions:updateOptions,sync:sync,dispatch:dispatch,getValue:function(){return cloneValue(currentValue);},getSerializedValue:function(){return cloneValue(serialized(currentValue));},getFormField:function(){return formField;},getAdapter:function(){return adapter;},getState:function(){return Object.freeze({value:cloneValue(currentValue),serializedValue:cloneValue(serialized(currentValue)),name:formField?formField.name:(opts.name||''),disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true,generated:ownsFormField,destroyed:destroyed});},destroy:destroy});
    if (formField) prepareAuthoredField(); ensureField(); sync(); return api;
  }

export const FormBridge = Object.freeze({ create, createAdapter, isFormField, read: function (element) { return createAdapter(element).read(); } });
export { create, createAdapter, isFormField };
