import { DOMProjection } from './domProjection.js';
import { Utils } from '../utils/utils.js';

const PHASES = Object.freeze(['appear','enter','leave']);

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function plain(value) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function elementLike(value) { return !!value && typeof value === 'object' && value.nodeType === 1; }
function uniqueNames(values) {
  const out = [];
  (values || []).forEach(value => {
    const name = String(value || '').trim();
    if (name && !out.includes(name)) out.push(name);
  });
  return Object.freeze(out);
}
function normalizeElement(value, name) {
  if (value === undefined || value === null) return null;
  if (elementLike(value)) return value;
  if (Array.isArray(value)) {
    const out = [];
    value.forEach(node => {
      if (!elementLike(node)) throw new TypeError('[QXFRAME9A7C2] Semantic element "' + name + '" must contain Elements only.');
      if (!out.includes(node)) out.push(node);
    });
    return Object.freeze(out);
  }
  throw new TypeError('[QXFRAME9A7C2] Semantic element "' + name + '" must be an Element, Element[], or null.');
}
function targets(value) { return Array.isArray(value) ? value.slice() : (value ? [value] : []); }
function normalizeElementContexts(value, semanticValue, name) {
  if (value === undefined || value === null) return null;
  const count = targets(semanticValue).length;
  if (typeof value === 'function') return value;
  if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Semantic element context "' + name + '" must be a resolver, context array, or null.');
  if (value.length !== count) throw new TypeError('[QXFRAME9A7C2] Semantic element context "' + name + '" must align with its Element[] length.');
  return Object.freeze(value.map((entry, index) => {
    if (entry === undefined || entry === null) return null;
    if (!plain(entry)) throw new TypeError('[QXFRAME9A7C2] Semantic element context "' + name + '[' + index + ']" must be a plain object or null.');
    return Object.freeze({ ...entry });
  }));
}
function styleName(value) {
  const name = String(value || '').trim();
  if (!name) return '';
  if (name.indexOf('--') === 0) return name;
  return name.replace(/[A-Z]/g, letter => '-' + letter.toLowerCase());
}
function classTokens(value, label) {
  const out = [];
  function append(input) {
    if (input === undefined || input === null || input === '') return;
    if (typeof input === 'string') {
      input.split(/\s+/).forEach(name => { if (name && !out.includes(name)) out.push(name); });
      return;
    }
    if (Array.isArray(input)) { input.forEach(append); return; }
    throw new TypeError('[QXFRAME9A7C2] ' + label + ' must resolve to a string, string[], null, or undefined.');
  }
  append(value);
  return out;
}
function semanticContext(instance, name, element, options, extra) {
  const context = { instance: instance || null, name, element, options: Object.freeze(options || {}) };
  if (extra) Object.keys(extra).forEach(key => { if (Utils.safeOwnKey(key)) context[key] = extra[key]; });
  return Object.freeze(context);
}
function resolveClassMap(input, names, defaultSlot) {
  if (input === undefined || input === null || input === '') return Object.freeze({});
  if (typeof input === 'string' || Array.isArray(input) || typeof input === 'function') {
    if (!defaultSlot) throw new TypeError('[QXFRAME9A7C2] Component does not declare a default class semantic element.');
    return Object.freeze({ [defaultSlot]: input });
  }
  if (!plain(input)) throw new TypeError('[QXFRAME9A7C2] Component class must be a string, string[], resolver, or semantic element map.');
  const out = {};
  Object.keys(input).forEach(name => {
    if (!names.includes(name)) throw new TypeError('[QXFRAME9A7C2] Component class contains unknown semantic element "' + name + '".');
    const value = input[name];
    if (value !== undefined && value !== null && typeof value !== 'string' && !Array.isArray(value) && typeof value !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] Component class.' + name + ' must be a string, string[], resolver, null, or undefined.');
    }
    out[name] = value;
  });
  return Object.freeze(out);
}
function styleMapKind(input, names) {
  const keys = Object.keys(input);
  const semantic = keys.filter(key => names.includes(key));
  if (semantic.length) {
    if (semantic.length !== keys.length) throw new TypeError('[QXFRAME9A7C2] Component style cannot mix CSS properties with semantic element keys.');
    return 'semantic';
  }
  if (keys.some(key => plain(input[key]) || typeof input[key] === 'function')) return 'semantic';
  return 'flat';
}
function resolveStyleMap(input, names, defaultSlot) {
  if (input === undefined || input === null) return Object.freeze({});
  if (typeof input === 'function') {
    if (!defaultSlot) throw new TypeError('[QXFRAME9A7C2] Component does not declare a default style semantic element.');
    return Object.freeze({ [defaultSlot]: input });
  }
  if (!plain(input)) throw new TypeError('[QXFRAME9A7C2] Component style must be a style object, resolver, or semantic element map.');
  if (styleMapKind(input, names) === 'flat') {
    if (!defaultSlot) throw new TypeError('[QXFRAME9A7C2] Component does not declare a default style semantic element.');
    return Object.freeze({ [defaultSlot]: input });
  }
  const out = {};
  Object.keys(input).forEach(name => {
    if (!names.includes(name)) throw new TypeError('[QXFRAME9A7C2] Component style contains unknown semantic element "' + name + '".');
    const value = input[name];
    if (value !== undefined && value !== null && !plain(value) && typeof value !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] Component style.' + name + ' must be a style object, resolver, null, or undefined.');
    }
    out[name] = value;
  });
  return Object.freeze(out);
}
function durationAtom(value, context, label) {
  const resolved = typeof value === 'function' ? value(context) : value;
  if (resolved === undefined || resolved === null || resolved === '') return null;
  if (typeof resolved === 'number') {
    if (!Number.isFinite(resolved) || resolved < 0) throw new TypeError('[QXFRAME9A7C2] ' + label + ' must resolve to a finite non-negative duration.');
    return String(resolved) + 'ms';
  }
  if (typeof resolved === 'string') return resolved;
  throw new TypeError('[QXFRAME9A7C2] ' + label + ' must resolve to a number, CSS time string, CSS variable, null, or undefined.');
}
function phaseObject(value) {
  if (!plain(value)) return false;
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every(key => PHASES.includes(key));
}
function validatePhaseObject(value, label) {
  Object.keys(value).forEach(key => {
    const atom = value[key];
    if (atom !== undefined && atom !== null && typeof atom !== 'number' && typeof atom !== 'string' && typeof atom !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] ' + label + '.' + key + ' must be a duration atom.');
    }
  });
  return value;
}
function resolveDurationMap(input, names, motionSlots, defaultMotionSlot) {
  if (input === undefined || input === null || input === '') return Object.freeze({});
  const isAtom = typeof input === 'number' || typeof input === 'string' || typeof input === 'function';
  if (isAtom || phaseObject(input)) {
    if (!defaultMotionSlot) throw new TypeError('[QXFRAME9A7C2] Component does not declare a default motion semantic element.');
    return Object.freeze({ [defaultMotionSlot]: isAtom ? input : validatePhaseObject(input, 'duration') });
  }
  if (!plain(input)) throw new TypeError('[QXFRAME9A7C2] Component duration must be a duration atom, phase map, or semantic element map.');
  const keys = Object.keys(input);
  if (keys.some(key => PHASES.includes(key))) throw new TypeError('[QXFRAME9A7C2] Component duration cannot mix phase keys with semantic element keys.');
  const out = {};
  keys.forEach(name => {
    if (!names.includes(name)) throw new TypeError('[QXFRAME9A7C2] Component duration contains unknown semantic element "' + name + '".');
    if (!own(motionSlots, name)) throw new TypeError('[QXFRAME9A7C2] Component duration semantic element "' + name + '" is not a Motion participant.');
    const value = input[name];
    const atom = typeof value === 'number' || typeof value === 'string' || typeof value === 'function' || value === null || value === undefined;
    if (!atom && !phaseObject(value)) throw new TypeError('[QXFRAME9A7C2] Component duration.' + name + ' must be a duration atom or phase map.');
    out[name] = phaseObject(value) ? validatePhaseObject(value, 'duration.' + name) : value;
  });
  return Object.freeze(out);
}
function phaseValue(value, phase) {
  if (!phaseObject(value)) return value;
  if (phase === 'appear') return own(value, 'appear') ? value.appear : value.enter;
  return value[phase];
}
function tokenFor(mapping, phase) {
  if (!mapping) return null;
  return mapping[phase] || (phase === 'appear' ? mapping.enter : null) || null;
}

function create(options = {}) {
  const instance = options.instance || null;
  const names = uniqueNames(options.names);
  const nameSet = new Set(names);
  const defaultClassSlot = options.defaultClassSlot == null ? null : String(options.defaultClassSlot);
  const defaultStyleSlot = options.defaultStyleSlot == null ? null : String(options.defaultStyleSlot);
  const defaultMotionSlot = options.defaultMotionSlot == null ? null : String(options.defaultMotionSlot);
  const motionSlots = plain(options.motionSlots) ? options.motionSlots : {};
  [defaultClassSlot, defaultStyleSlot, defaultMotionSlot].forEach(name => {
    if (name && !nameSet.has(name)) throw new TypeError('[QXFRAME9A7C2] Default semantic element "' + name + '" is not declared.');
  });
  Object.keys(motionSlots).forEach(name => {
    if (!nameSet.has(name)) throw new TypeError('[QXFRAME9A7C2] Motion participant "' + name + '" is not a declared semantic element.');
    if (!plain(motionSlots[name])) throw new TypeError('[QXFRAME9A7C2] Motion participant "' + name + '" requires an explicit phase-to-CSS-variable map.');
  });

  const elements = Object.create(null);
  const elementContexts = Object.create(null);
  names.forEach(name => { elements[name] = null; elementContexts[name] = null; });
  let destroyed = false;
  let currentOptions = {};
  let projection = DOMProjection.create();

  function assertName(name) {
    const normalized = String(name || '').trim();
    if (!nameSet.has(normalized)) throw new TypeError('[QXFRAME9A7C2] Unknown semantic element "' + normalized + '".');
    return normalized;
  }
  function snapshotValue(value) { return Array.isArray(value) ? Object.freeze(value.slice()) : value; }
  function getElement(name) {
    if (arguments.length) {
      const normalized = String(name || '').trim();
      return nameSet.has(normalized) ? snapshotValue(elements[normalized]) : null;
    }
    const out = {};
    names.forEach(key => { out[key] = snapshotValue(elements[key]); });
    return Object.freeze(out);
  }
  function elementExtra(name, semanticValue, node, index) {
    const base = { elements: snapshotValue(semanticValue), index };
    const source = elementContexts[name];
    let extra = null;
    if (typeof source === 'function') {
      extra = source(Object.freeze({ instance: instance || null, name, element: node, elements: base.elements, index, options: Object.freeze(currentOptions || {}) }));
    } else if (Array.isArray(source)) extra = source[index];
    if (extra !== undefined && extra !== null) {
      if (!plain(extra)) throw new TypeError('[QXFRAME9A7C2] Semantic element context resolver for "' + name + '" must return a plain object, null, or undefined.');
      Object.keys(extra).forEach(key => {
        if (['instance','name','element','elements','index','options','phase'].includes(key)) return;
        base[key] = extra[key];
      });
    }
    return base;
  }
  function clearProjection() {
    projection.destroy();
    projection = DOMProjection.create();
  }
  function rebuild() {
    if (destroyed) return;
    clearProjection();
    if (!names.length) return;

    const classMap = resolveClassMap(currentOptions.class, names, defaultClassSlot);
    Object.keys(classMap).forEach(name => {
      const semanticValue = elements[name];
      targets(semanticValue).forEach((node, index) => {
        const context = semanticContext(instance, name, node, currentOptions, elementExtra(name, semanticValue, node, index));
        const raw = typeof classMap[name] === 'function' ? classMap[name](context) : classMap[name];
        classTokens(raw, 'class.' + name).forEach(token => projection.addClass(node, token));
      });
    });

    const styleMap = resolveStyleMap(currentOptions.style, names, defaultStyleSlot);
    Object.keys(styleMap).forEach(name => {
      const semanticValue = elements[name];
      targets(semanticValue).forEach((node, index) => {
        const context = semanticContext(instance, name, node, currentOptions, elementExtra(name, semanticValue, node, index));
        const raw = typeof styleMap[name] === 'function' ? styleMap[name](context) : styleMap[name];
        if (raw === undefined || raw === null) return;
        if (!plain(raw)) throw new TypeError('[QXFRAME9A7C2] style.' + name + ' resolver must return a style object, null, or undefined.');
        Object.keys(raw).forEach(rawName => {
          const prop = styleName(rawName);
          if (!prop) return;
          const value = raw[rawName];
          if (value !== undefined && value !== null && (typeof value === 'object' || typeof value === 'function')) {
            throw new TypeError('[QXFRAME9A7C2] style.' + name + '.' + rawName + ' must be a CSS-compatible scalar value.');
          }
          projection.setStyle(node, prop, value == null ? '' : String(value));
        });
      });
    });

    const durationMap = resolveDurationMap(currentOptions.duration, names, motionSlots, defaultMotionSlot);
    Object.keys(durationMap).forEach(name => {
      const semanticValue = elements[name];
      const mapping = motionSlots[name];
      PHASES.forEach(phase => {
        const token = tokenFor(mapping, phase);
        if (!token) return;
        const context = semanticContext(instance, name, snapshotValue(semanticValue), currentOptions, { phase });
        const value = durationAtom(phaseValue(durationMap[name], phase), context, 'duration.' + name + '.' + phase);
        if (value === null) return;
        targets(semanticValue).forEach(node => projection.setStyle(node, token, value));
      });
    });
  }
  function setElement(name, value, contexts) {
    if (destroyed) return false;
    const normalized = assertName(name);
    const semanticValue = normalizeElement(value, normalized);
    elements[normalized] = semanticValue;
    elementContexts[normalized] = normalizeElementContexts(contexts, semanticValue, normalized);
    rebuild();
    return true;
  }
  function setElements(next, contexts) {
    if (destroyed) return false;
    if (!plain(next)) throw new TypeError('[QXFRAME9A7C2] Semantic element registry update must be an object.');
    if (contexts !== undefined && contexts !== null && !plain(contexts)) throw new TypeError('[QXFRAME9A7C2] Semantic element context registry update must be an object.');
    Object.keys(next).forEach(name => {
      const normalized = assertName(name);
      const semanticValue = normalizeElement(next[name], normalized);
      elements[normalized] = semanticValue;
      elementContexts[normalized] = normalizeElementContexts(contexts && contexts[name], semanticValue, normalized);
    });
    rebuild();
    return true;
  }
  function sync(nextOptions) {
    if (destroyed) return false;
    currentOptions = nextOptions && typeof nextOptions === 'object' ? nextOptions : {};
    rebuild();
    return true;
  }
  function clear() {
    if (destroyed) return false;
    clearProjection();
    return true;
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    projection.destroy();
    names.forEach(name => { elements[name] = null; elementContexts[name] = null; });
    currentOptions = {};
    return true;
  }
  function getState() {
    return Object.freeze({
      names,
      defaultClassSlot,
      defaultStyleSlot,
      defaultMotionSlot,
      motionSlots: Object.freeze({ ...motionSlots }),
      destroyed
    });
  }

  currentOptions = options.options && typeof options.options === 'object' ? options.options : {};
  rebuild();
  return Object.freeze({ getElement, setElement, setElements, sync, clear, destroy, getState });
}

export const SemanticProjection = Object.freeze({ create });
export { create };
