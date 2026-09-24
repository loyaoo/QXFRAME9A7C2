import { ComponentContracts } from '../core/componentContracts.js';
import { ComponentProfile } from '../core/componentProfile.js';
import { DOM } from '../core/dom.js';
import { ObserverHub } from '../core/observerHub.js';
import { InstanceRegistry } from '../core/instanceRegistry.js';
import { Utils } from '../utils/utils.js';

const definitions = Object.create(null);
let components = Object.create(null);
const instanceBindings = typeof WeakMap === 'function' ? new WeakMap() : null;

function normalize(name) {
    const key = String(name || '').trim();
    if (!/^[A-Z][A-Za-z0-9]*$/.test(key)) throw new TypeError('[QXFRAME9A7C2] Invalid component name: ' + key);
    return key;
}
function isOptionBag(value) { return !!value && typeof value === 'object' && !Array.isArray(value) && value.nodeType !== 1; }
function resolveElement(target) {
    if (target && target.nodeType === 1) return target;
    if (typeof target !== 'string' || !globalThis.document) return null;
    return globalThis.document.getElementById(target) || null;
}
function rootOf(instance) {
    if (!instance) return null;
    if (typeof instance.getRootElement === 'function') { try { return instance.getRootElement(); } catch (_) {} }
    try { return instance.root && instance.root.nodeType === 1 ? instance.root : null; } catch (_) { return null; }
}
function instanceIsDestroyed(instance) {
    if (!instance || typeof instance !== 'object') return true;
    try { if (instance.destroyed === true) return true; } catch (_) {}
    if (typeof instance.getState === 'function') { try { const state = instance.getState(); if (state && state.destroyed === true) return true; } catch (_) {} }
    return false;
}
function rememberBinding(instance, element, name) {
    if (!instance || !element || element.nodeType !== 1) return;
    DOM.setPrivate(element, 'componentInstance', instance);
    DOM.setPrivate(element, 'renderOwner', instance);
    DOM.setPrivate(element, 'componentName', name || null);
    if (instanceBindings) {
        let bindings = instanceBindings.get(instance);
        if (!bindings) { bindings = []; instanceBindings.set(instance, bindings); }
        if (!bindings.includes(element)) bindings.push(element);
    }
}
function clearBindings(instance) {
    const bindings = instanceBindings && instanceBindings.get(instance) || [];
    bindings.forEach(element => {
        if (!element) return;
        DOM.deletePrivate(element, 'componentInstance');
        DOM.deletePrivate(element, 'renderOwner');
        DOM.deletePrivate(element, 'componentName');
    });
    if (instanceBindings) instanceBindings.delete(instance);
}
function trackInstance(instance, name, bindingElement) {
    if (!instance || typeof instance !== 'object') return instance;
    const root = rootOf(instance);
    if (root) rememberBinding(instance, root, name);
    if (bindingElement && bindingElement !== root) rememberBinding(instance, bindingElement, name);
    return instance;
}
function normalizedProfile(name, profile) {
    if (!profile) return null;
    const defined = ComponentProfile.define(profile);
    if (defined.name !== name) throw new TypeError('[QXFRAME9A7C2] ComponentProfile name must match runtime component name "' + name + '".');
    return defined;
}
function definitionFrom(name, api) {
    const contract = ComponentContracts.get(name) || {};
    const explicit = api && api.definition && typeof api.definition === 'object' ? api.definition : {};
    const profile = normalizedProfile(name, explicit.profile || (api && api.profile));
    return Object.freeze({
        defaults: Object.freeze(Utils.mergeOwn(explicit.defaults || api && api.defaults || {})),
        schema: contract.schema || Object.freeze({}),
        immutable: Object.freeze((explicit.immutable || api && api.immutableOptions || []).slice ? (explicit.immutable || api && api.immutableOptions || []).slice() : []),
        legacy: contract.legacy || Object.freeze([]),
        optionImpact: Object.freeze(Utils.mergeOwn(explicit.optionImpact || api && api.optionImpact || {})),
        profile: profile,
        initializer: Object.prototype.hasOwnProperty.call(explicit, 'initializer') ? explicit.initializer : (api && Object.prototype.hasOwnProperty.call(api, 'initializer') ? api.initializer : null),
        allowUnknown: contract.allowUnknown !== false
    });
}
function describe(name) { return definitions[normalize(name)] || null; }
function profileFor(name) { const definition = describe(name); return definition ? definition.profile : null; }
function validateOptions(name, options = {}) {
    const key = normalize(name);
    const contract = ComponentContracts.get(key);
    return ComponentContracts.validate(contract, options || {}, key);
}
function mergeOptions(name, options) { const d = describe(name); return Utils.mergeOwn(d && d.defaults || {}, validateOptions(name, options || {})); }
function setDefaults(name, patch) {
    const key = normalize(name), current = definitions[key] || definitionFrom(key, components[key]);
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('[QXFRAME9A7C2] Component defaults patch must be an object.');
    definitions[key] = Object.freeze(Utils.mergeOwn(current, { defaults: Object.freeze(Utils.mergeOwn(current.defaults || {}, patch)) }));
    return definitions[key];
}
function getDefaults(name) { const d = describe(name); return Object.freeze(Utils.mergeOwn(d && d.defaults || {})); }
function impactFor(name, patch) {
    const d = describe(name), priority = { state:0, data:1, layout:2, structure:3 };
    let impact = 'state';
    Object.keys(patch || {}).forEach(key => { const candidate = d && d.optionImpact && d.optionImpact[key] || 'state'; if ((priority[candidate] || 0) > (priority[impact] || 0)) impact = candidate; });
    return impact;
}
function getInstance(name, target) {
    const key = normalize(name), element = resolveElement(target);
    let instance = element ? (DOM.getPrivate(element, 'componentInstance') || DOM.getPrivate(element, 'renderOwner')) : InstanceRegistry.get(target);
    if (!instance || instanceIsDestroyed(instance)) { if (instance) clearBindings(instance); return null; }
    const owner = element && DOM.getPrivate(element, 'componentName');
    return owner && owner !== key ? null : instance;
}
function applyUpdate(name, instance, patch) {
    if (!instance || instanceIsDestroyed(instance)) return false;
    const key = normalize(name), input = validateOptions(key, patch || {}), d = describe(key);
    for (const option of d && d.immutable || []) if (Object.prototype.hasOwnProperty.call(input, option)) throw new Error('[QXFRAME9A7C2] ' + key + ' option "' + option + '" is immutable; destroy and recreate the instance.');
    const impact = impactFor(key, input);
    if (impact === 'data' && typeof instance.updateData === 'function') return instance.updateData(input.data !== undefined ? input.data : input);
    if (impact === 'structure' && typeof instance.reconfigure === 'function') return instance.reconfigure(input);
    const updated = typeof instance.updateOptions === 'function' ? instance.updateOptions(input) : false;
    if (impact === 'layout' && typeof instance.refresh === 'function') instance.refresh({ reason:'runtime-layout-options', options:input });
    return updated;
}
function destroyInstance(name, target) {
    const instance = getInstance(name, target);
    if (!instance || typeof instance.destroy !== 'function') return false;
    const result = instance.destroy(); clearBindings(instance); return result !== false;
}
function getOrCreateInstance(name, target, options) {
    const key = normalize(name), binding = resolveElement(target), existing = getInstance(key, binding || target);
    if (existing) { if (options && Object.keys(options).length) applyUpdate(key, existing, options); return existing; }
    const api = components[key];
    if (!api) throw new Error('[QXFRAME9A7C2] Visible Component not loaded: ' + key);
    const d = describe(key), initializer = d && d.initializer;
    if (initializer === false) throw new TypeError('[QXFRAME9A7C2] Component ' + key + ' does not support declarative/getOrCreate initialization from an Element.');
    const next = mergeOptions(key, options || {}), mode = initializer && initializer.mode || (typeof api.enhance === 'function' ? 'enhance' : 'create'), bind = initializer && initializer.bind || null;
    let instance;
    if (mode === 'enhance') instance = api.enhance(target, next);
    else {
        if (bind === 'source') instance = api.create(target, next);
        else { if (bind && binding && next[bind] === undefined) next[bind] = binding; instance = api.create(next); }
    }
    return trackInstance(instance, key, binding);
}
function readDeclarativeOptions(element) {
    const raw = element && element.getAttribute && element.getAttribute('data-qx-options');
    if (!raw) return {};
    try { const parsed = JSON.parse(raw); if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(); return parsed; }
    catch (_) { throw new TypeError('[QXFRAME9A7C2] data-qx-options must be valid JSON object.'); }
}
function initialize(root) {
    const container = root && root.nodeType ? root : globalThis.document;
    if (!container || !container.querySelectorAll) return [];
    const nodes = container.nodeType === 1 && container.hasAttribute('data-qx-component') ? [container] : [];
    nodes.push(...container.querySelectorAll('[data-qx-component]'));
    return nodes.map(element => {
        const name = element.getAttribute('data-qx-component');
        return name ? getOrCreateInstance(name, element, readDeclarativeOptions(element)) : null;
    }).filter(Boolean);
}
function observe(root, options = {}) {
    const container = root && root.nodeType ? root : globalThis.document;
    if (!container) return () => false;
    if (options.initialize !== false) initialize(container);
    let stopped = false;
    const target = container.nodeType === 9 ? container.documentElement : container;
    const stop = ObserverHub.mutation(target, records => {
        if (stopped) return;
        for (const record of records) {
            if (record.type === 'attributes') { const el = record.target; if (el && el.getAttribute('data-qx-component')) initialize(el); continue; }
            for (const node of record.addedNodes || []) if (node && node.nodeType === 1) initialize(node);
        }
    }, { schedule:'mutate', observeOptions:{ childList:true, subtree:true, attributes:true, attributeFilter:['data-qx-component','data-qx-options'] } });
    return () => { if (stopped) return false; stopped = true; if (stop) stop(); return true; };
}
function configureComponents(next) {
    components = next || Object.create(null);
    for (const name of Object.keys(components)) definitions[name] = definitionFrom(name, components[name]);
    return ComponentRuntime;
}
function validatePublicCallArgs(name, method, argsLike) {
    const args = Array.from(argsLike || []); let index = -1;
    if (method === 'enhance') index = isOptionBag(args[1]) ? 1 : -1;
    else if (isOptionBag(args[0])) index = 0; else if (isOptionBag(args[1])) index = 1;
    if (index >= 0) args[index] = validateOptions(name, args[index]);
    return args;
}
export function publishComponentApi(name, api) {
    const key = normalize(name), source = api || {}, published = Object.create(null);
    Utils.copyOwn(published, source);
    if (source.profile) published.profile = normalizedProfile(key, source.profile);
    if (typeof source.create === 'function') published.create = function () { const raw = arguments, args = validatePublicCallArgs(key, 'create', raw); return trackInstance(source.create.apply(source, args), key, resolveElement(raw[0])); };
    if (typeof source.enhance === 'function') published.enhance = function () { const raw = arguments, args = validatePublicCallArgs(key, 'enhance', raw); return trackInstance(source.enhance.apply(source, args), key, resolveElement(raw[0])); };
    published.getInstance ??= target => getInstance(key, target);
    published.getOrCreateInstance ??= (target, options) => getOrCreateInstance(key, target, options);
    published.destroyInstance ??= target => destroyInstance(key, target);
    published.update ??= (target, patch) => applyUpdate(key, getInstance(key, target), patch);
    published.updateData ??= (target, data) => { const instance = getInstance(key, target); return instance && typeof instance.updateData === 'function' ? instance.updateData(data) : applyUpdate(key, instance, { data }); };
    published.refresh ??= (target, meta) => { const instance = getInstance(key, target); return !!(instance && typeof instance.refresh === 'function' && instance.refresh(meta)); };
    return Object.freeze(published);
}

export const ComponentRuntime = Object.freeze({
    describe, profileFor, validateOptions, mergeOptions, impactFor, setDefaults, getDefaults, getInstance, getOrCreateInstance, destroyInstance,
    updateInstance:(name,target,patch)=>applyUpdate(name,getInstance(name,target),patch),
    updateData:(name,target,data)=>{ const instance=getInstance(name,target); return instance&&typeof instance.updateData==='function'?instance.updateData(data):applyUpdate(name,instance,{data}); },
    refresh:(name,target,meta)=>{ const instance=getInstance(name,target); return !!(instance&&typeof instance.refresh==='function'&&instance.refresh(meta)); },
    initialize, observe, readDeclarativeOptions,
    getStats:()=>Object.freeze({ definitions:Object.keys(definitions).length, components:Object.keys(components).length, activeInstances:InstanceRegistry.size(), tracked:InstanceRegistry.size() })
});
export const ComponentInitializer = Object.freeze({ initialize, observe, readOptions:readDeclarativeOptions });
export { configureComponents };
