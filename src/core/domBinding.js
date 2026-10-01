
import { DOM } from './dom.js';

const global = globalThis;

function isNodeLike(value) {
    return !!value && typeof value === 'object' && typeof value.nodeType === 'number';
  }

  function resolveOne(value, lookupRoot, documentRef) {
    if (value == null) return null;
    if (typeof value === 'function') return resolveOne(value(Object.freeze({ root: lookupRoot || null, document: documentRef || null })), lookupRoot, documentRef);
    if (isNodeLike(value)) return value;
    if (typeof value === 'string') {
      var scope = lookupRoot && typeof lookupRoot.querySelector === 'function' ? lookupRoot : documentRef;
      return DOM.resolveElement(value, scope);
    }
    throw new TypeError('DOMBinding element refs must be Nodes, selectors, resolver functions, or null');
  }

  function normalizeElements(elements, lookupRoot, documentRef) {
    if (isNodeLike(elements) || typeof elements === 'string' || typeof elements === 'function') {
      return { root: resolveOne(elements, lookupRoot, documentRef) };
    }
    if (!elements || typeof elements !== 'object') {
      throw new TypeError('options.elements must be a Node, selector, resolver function, or refs object');
    }

    var refs = {};
    var root = resolveOne(elements.root, lookupRoot, documentRef);
    refs.root = root;
    Object.keys(elements).forEach(function (key) {
      if (key === 'root') return;
      refs[key] = resolveOne(elements[key], root || lookupRoot, documentRef);
    });
    return refs;
  }

  function normalizeFactoryResult(result) {
    if (isNodeLike(result)) {
      return { root: result, refs: { root: result }, ownedRoot: true };
    }
    if (!result || typeof result !== 'object') {
      throw new TypeError('DOM factory must return a Node or { root, refs }');
    }

    var refs = result.refs && typeof result.refs === 'object' ? result.refs : {};
    var root = result.root || refs.root;
    if (!isNodeLike(root)) {
      throw new TypeError('DOM factory result requires a root Node');
    }
    if (!refs.root) refs.root = root;

    return {
      root: root,
      refs: refs,
      ownedRoot: result.ownedRoot !== false
    };
  }

  function validateRefs(refs, requiredRefs, source) {
    (requiredRefs || ['root']).forEach(function (name) {
      if (!isNodeLike(refs[name])) {
        throw new Error('DOMBinding source "' + source + '" is missing required ref: ' + name);
      }
    });
  }

  function resolve(config) {
    config = config || {};
    var options = config.options || {};
    var documentRef = config.document || global.document;
    var rawTarget = config.target || options.target || options.container || null;
    var target = resolveOne(rawTarget, options.lookupRoot || documentRef, documentRef);
    var lookupRoot = resolveOne(options.lookupRoot, target || documentRef, documentRef) || target || documentRef;
    var hasElements = options.elements != null;
    var hasFactory = typeof options.createDOM === 'function';

    if (hasElements && hasFactory) {
      throw new Error('Conflicting DOM sources: use either options.elements or options.createDOM, not both');
    }

    var source;
    var normalized;
    if (hasElements) {
      source = 'external';
      var externalRefs = normalizeElements(options.elements, lookupRoot, documentRef);
      normalized = {
        root: externalRefs.root,
        refs: externalRefs,
        ownedRoot: false
      };
    } else {
      var factory = hasFactory ? options.createDOM : config.defaultFactory;
      if (typeof factory !== 'function') {
        throw new Error('DOMBinding requires a defaultFactory when no external DOM source is supplied');
      }
      source = hasFactory ? 'custom-factory' : 'default-factory';
      normalized = normalizeFactoryResult(factory(Object.freeze({
        document: documentRef,
        target: target,
        options: options,
        component: config.component || null
      })));
    }

    validateRefs(normalized.refs, config.requiredRefs, source);

    if (source !== 'external' && target && !normalized.root.parentNode) {
      target.appendChild(normalized.root);
    }

    var released = false;
    var binding = {
      source: source,
      root: normalized.root,
      refs: normalized.refs,
      ownedRoot: source === 'external' ? false : normalized.ownedRoot,
      release: function () {
        if (released) return;
        released = true;
        if (binding.ownedRoot && binding.root && binding.root.parentNode) {
          binding.root.parentNode.removeChild(binding.root);
        }
      }
    };

    return Object.freeze(binding);
  }

export const DOMBinding = Object.freeze({ resolve, normalizeElements, isNodeLike });
export { resolve, normalizeElements, isNodeLike };
