import { DOM } from '../core/dom.js';
import { Scheduler } from '../core/scheduler.js';
import { Control } from './control.js';
import { Utils } from '../utils/utils.js';

const instances = typeof WeakMap === 'function' ? new WeakMap() : null;
const hasOwn = Utils.own;
function isElement(value) { return !!value && value.nodeType === 1; }
function resolve(value, doc) { return DOM.resolveElement(value, doc); }
function isTextEditor(node) {
    const tag = node && String(node.tagName || '').toLowerCase();
    if (tag === 'textarea') return true;
    if (tag !== 'input') return false;
    const type = String(node.type || 'text').toLowerCase();
    return !['hidden', 'checkbox', 'radio', 'file', 'button', 'submit', 'reset', 'range', 'color'].includes(type);
}
function boolAttr(node, name) { return !!(node && node.hasAttribute && node.hasAttribute(name)); }
function finiteLength(value) {
    if (value === undefined || value === null || value === '') return null;
    const number = Math.floor(Number(value));
    return Number.isFinite(number) && number >= 0 ? number : null;
}

function enhance(source, options) {
    const opts = Utils.assignOwn({ clearable: undefined, count: undefined, clearVisibility: 'interaction', lengthMode: 'native', limitMode: 'hard' }, options || {});
    const doc = opts.document || (isElement(source) && source.ownerDocument) || globalThis.document;
    let field = resolve(source, doc);
    if (!isTextEditor(field)) throw new TypeError('[QXFRAME9A7C2] TextField.enhance requires a text-like input or textarea.');
    if (instances && instances.has(field)) return instances.get(field);
    const parent = field.parentNode, nextSibling = field.nextSibling;
    if (!parent) throw new TypeError('[QXFRAME9A7C2] TextField.enhance requires the field to be connected to a parent.');
    const classSnapshot = field.getAttribute('class'), maxLengthSnapshot = field.getAttribute('maxlength'), minLengthSnapshot = field.getAttribute('minlength');
    let clearable = opts.clearable === undefined ? boolAttr(field, 'data-qxframe9a7c2-clear') : opts.clearable === true;
    let countEnabled = opts.count === undefined ? boolAttr(field, 'data-qxframe9a7c2-count') : opts.count === true;
    let root = doc.createElement('div');
    root.className = 'qxframe9a7c2-input qxframe9a7c2-text-field' + (String(field.tagName).toLowerCase() === 'textarea' ? ' is-textarea' : '');
    parent.insertBefore(root, field); root.appendChild(field);
    let destroyed = false, api = null, control = null;
    function dispatchNative(type) {
        const EventCtor = doc.defaultView && doc.defaultView.Event || globalThis.Event;
        if (EventCtor && field && field.dispatchEvent) field.dispatchEvent(new EventCtor(type, { bubbles: true }));
    }
    const controlOptions = Utils.mergeOwn( opts, {
        elements: { root, input: field }, document: doc, mode: 'input', editor: String(field.tagName).toLowerCase() === 'textarea' ? 'textarea' : 'input',
        clearable, count: countEnabled, inputValue: field.value, disabled: field.disabled === true, readOnly: field.readOnly === true, required: field.required === true,
        placeholder: field.placeholder || '', minLength: field.hasAttribute('minlength') ? field.minLength : null, maxLength: field.hasAttribute('maxlength') ? field.maxLength : null,
        onClearRequest(event) { if (!field) return; field.value = ''; dispatchNative('input'); dispatchNative('change'); if (typeof opts.onClear === 'function') opts.onClear(event, api); }
    });
    delete controlOptions.container; delete controlOptions.target; delete controlOptions.formField; delete controlOptions.name;
    control = Control.create(controlOptions);
    const resetDelay = Scheduler.createDelayScheduler(() => { if (destroyed || !control || !field) return; control.updateOptions({ disabled: field.disabled === true, readOnly: field.readOnly === true, required: field.required === true, inputValue: field.value }); control.setInputValue(field.value); });
    const form = field.form || (field.closest ? field.closest('form') : null);
    let stopReset = form ? DOM.listen(form, 'reset', () => resetDelay.request(0, 'form-reset')) : null;
    api = Object.freeze({
        sync() { if (destroyed) return api; control.updateOptions({ disabled: field.disabled === true, readOnly: field.readOnly === true, required: field.required === true, clearable, count: countEnabled, inputValue: field.value }); control.setInputValue(field.value); return api; },
        clear() { if (destroyed) return api; const clear = control.getClearElement(); if (clear && typeof clear.click === 'function') clear.click(); else { field.value = ''; dispatchNative('input'); dispatchNative('change'); } return api; },
        focus() { return destroyed ? false : control.focus(); },
        updateOptions(next) {
            if (destroyed) return api; const patch = next || {};
            if (hasOwn(patch, 'clearable')) clearable = patch.clearable === true;
            if (hasOwn(patch, 'count')) countEnabled = patch.count === true;
            if (hasOwn(patch, 'maxLength')) { const max = finiteLength(patch.maxLength); if (max === null) field.removeAttribute('maxlength'); else field.maxLength = max; }
            if (hasOwn(patch, 'minLength')) { const min = finiteLength(patch.minLength); if (min === null) field.removeAttribute('minlength'); else field.minLength = min; }
            Utils.copyOwn(opts, patch);
            control.updateOptions(Utils.mergeOwn( patch, { clearable, count: countEnabled, minLength: field.hasAttribute('minlength') ? field.minLength : null, maxLength: field.hasAttribute('maxlength') ? field.maxLength : null }));
            return api;
        },
        getState() { const current = control.getState(); return Object.freeze({ value: field.value, count: current.count, focused: current.focused, hovered: current.focused ? false : root.classList.contains('is-hovered'), disabled: field.disabled === true, readOnly: field.readOnly === true, destroyed }); },
        getRootElement() { return root; }, getInputElement() { return field; }, getSuffixElement() { return control.getSuffixElement(); }, getClearElement() { return control.getClearElement(); }, getCountElement() { return control.getCountElement(); },
        destroy() {
            if (destroyed) return false; destroyed = true; if (stopReset) stopReset(); stopReset = null; resetDelay.dispose(); if (control) control.destroy(); control = null;
            if (parent && field) parent.insertBefore(field, nextSibling && nextSibling.parentNode === parent ? nextSibling : null);
            if (field) { if (classSnapshot === null) field.removeAttribute('class'); else field.setAttribute('class', classSnapshot); if (maxLengthSnapshot === null) field.removeAttribute('maxlength'); else field.setAttribute('maxlength', maxLengthSnapshot); if (minLengthSnapshot === null) field.removeAttribute('minlength'); else field.setAttribute('minlength', minLengthSnapshot); }
            if (root && root.parentNode) root.parentNode.removeChild(root); if (instances && field) instances.delete(field); root = field = null; return true;
        }
    });
    if (instances) instances.set(field, api);
    return api;
}

function init(container) {
    const root = container || globalThis.document;
    if (!root || !root.querySelectorAll) return [];
    const nodes = Array.from(root.querySelectorAll('input[data-qxframe9a7c2-clear],input[data-qxframe9a7c2-count],textarea[data-qxframe9a7c2-clear],textarea[data-qxframe9a7c2-count]'));
    if (isTextEditor(root) && (boolAttr(root, 'data-qxframe9a7c2-clear') || boolAttr(root, 'data-qxframe9a7c2-count'))) nodes.unshift(root);
    return nodes.filter((node, index) => nodes.indexOf(node) === index && isTextEditor(node)).map(node => enhance(node));
}

export const TextField = Object.freeze({ enhance, init, getInstance(field) { return instances && instances.get(field) || null; } });
