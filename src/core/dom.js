// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';

const global = globalThis;

var listenerAdds = 0;
  var listenerRemoves = 0;
  var activeListeners = 0;
  var privateState = typeof WeakMap === 'function' ? new WeakMap() : null;

  function privateBucket(node, create) {
    if (!node || !privateState) return null;
    var bucket = privateState.get(node);
    if (!bucket && create) { bucket = Object.create(null); privateState.set(node, bucket); }
    return bucket || null;
  }

  function setPrivate(node, key, value) {
    var name = String(key || '').trim();
    if (!node || !name) return node;
    var bucket = privateBucket(node, true);
    if (bucket) bucket[name] = value;
    return node;
  }

  function getPrivate(node, key) {
    var bucket = privateBucket(node, false);
    return bucket ? bucket[String(key || '')] : undefined;
  }

  function hasPrivate(node, key) {
    var bucket = privateBucket(node, false), name = String(key || '');
    return !!(bucket && Object.prototype.hasOwnProperty.call(bucket, name));
  }

  function deletePrivate(node, key) {
    var bucket = privateBucket(node, false), name = String(key || '');
    if (!bucket || !Object.prototype.hasOwnProperty.call(bucket, name)) return false;
    delete bucket[name];
    return true;
  }

  function closestPrivate(target, boundary, key, expected) {
    var node = target, hasExpected = arguments.length >= 4;
    while (node) {
      if (hasPrivate(node, key) && (!hasExpected || getPrivate(node, key) === expected)) return node;
      if (node === boundary) break;
      node = node.parentNode;
    }
    return null;
  }

  function findAllPrivate(root, key, expected) {
    var out = [], hasExpected = arguments.length >= 3;
    if (!root) return out;
    var nodes = [root];
    if (Utils.isFunction(root.querySelectorAll)) nodes = nodes.concat(Array.prototype.slice.call(root.querySelectorAll('*')));
    nodes.forEach(function (node) {
      if (!hasPrivate(node, key)) return;
      if (!hasExpected || getPrivate(node, key) === expected) out.push(node);
    });
    return out;
  }

  function findPrivate(root, key, expected) {
    var nodes = arguments.length >= 3 ? findAllPrivate(root, key, expected) : findAllPrivate(root, key);
    return nodes.length ? nodes[0] : null;
  }

  function privateMatcher(key, expected) {
    var hasExpected = arguments.length >= 2;
    return function (node) {
      return hasPrivate(node, key) && (!hasExpected || getPrivate(node, key) === expected);
    };
  }

  function query(root, selector) {
    var scope = root || global.document;
    if (!scope || !Utils.isFunction(scope.querySelector) || typeof selector !== 'string') return null;
    var value = selector.trim();
    if (!value) return null;
    try { return scope.querySelector(value); } catch (_) { return null; }
  }

  function queryAll(root, selector) {
    var scope = root || global.document;
    if (!scope || !Utils.isFunction(scope.querySelectorAll) || typeof selector !== 'string') return [];
    var value = selector.trim();
    if (!value) return [];
    try { return Array.prototype.slice.call(scope.querySelectorAll(value)); } catch (_) { return []; }
  }

  function matches(node, selector) {
    if (!node || !Utils.isFunction(node.matches) || typeof selector !== 'string' || !selector.trim()) return false;
    try { return node.matches(selector.trim()); } catch (_) { return false; }
  }

  function closest(node, selector, boundary) {
    var current = node && node.nodeType === 1 ? node : null;
    while (current) {
      if (matches(current, selector)) return current;
      if (current === boundary) break;
      current = current.parentElement;
    }
    return null;
  }

  function documentOf(value) {
    if (value && value.nodeType === 9) return value;
    return value && value.ownerDocument || global.document || null;
  }
  function viewOf(value) { var doc = documentOf(value); return doc && doc.defaultView || global; }

  function resolveElement(value, root) {
    if (value === undefined || value === null || value === '') return null;
    if (value && value.nodeType === 1) return value;
    if (typeof value === 'string') return query(root || global.document, value);
    return null;
  }

  function requireElement(value, root, label) {
    var element = resolveElement(value, root);
    if (!element) throw new TypeError('[QXFRAME9A7C2] ' + String(label || 'element') + ' must resolve to an Element.');
    return element;
  }

  function listen(target, eventName, handler, options) {
    if (!target || !Utils.isFunction(target.addEventListener) || !Utils.isFunction(target.removeEventListener)) {
      throw new TypeError('[QXFRAME9A7C2] DOM.listen target must support addEventListener/removeEventListener.');
    }
    var name = String(eventName || '').trim();
    if (!name) throw new TypeError('[QXFRAME9A7C2] DOM.listen event name must not be empty.');
    if (!Utils.isFunction(handler)) throw new TypeError('[QXFRAME9A7C2] DOM.listen handler must be a function.');

    target.addEventListener(name, handler, options);
    listenerAdds += 1;
    activeListeners += 1;
    var active = true;
    return function removeListener() {
      if (!active) return false;
      active = false;
      target.removeEventListener(name, handler, options);
      listenerRemoves += 1;
      activeListeners = Math.max(0, activeListeners - 1);
      return true;
    };
  }

  function hiddenByTree(node) {
    var current = node && node.nodeType === 1 ? node : null;
    var view = node && node.ownerDocument && node.ownerDocument.defaultView;
    while (current) {
      if (current.hidden === true || current.inert === true || (current.hasAttribute && current.hasAttribute('inert'))) return true;
      if (view && Utils.isFunction(view.getComputedStyle)) {
        var style = view.getComputedStyle(current);
        if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse')) return true;
      }
      current = current.parentElement;
    }
    return false;
  }

  function canFocus(node) {
    if (!(node && Utils.isFunction(node.focus)) || node.disabled === true) return false;
    if ('isConnected' in node && node.isConnected === false) return false;
    return !hiddenByTree(node);
  }

  function focusElement(node, focusOptions) {
    if (!canFocus(node)) return false;
    var options = arguments.length >= 2 ? focusOptions : { preventScroll: true };
    try {
      if (options === null) node.focus();
      else node.focus(options);
    } catch (_) {
      try { node.focus(); } catch (_) { return false; }
    }
    var doc = node.ownerDocument || global.document;
    if (!doc) return true;
    if (doc.activeElement === node) return true;
    if (node.shadowRoot && node.shadowRoot.activeElement) return true;
    return false;
  }

  function configureTextInput(input, policy) {
    if (!input || input.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] DOM.configureTextInput requires an Element.');
    var local = typeof policy === 'string' ? { mode: policy } : Object.assign({}, policy || {});
    var mode = String(local.mode || 'text').toLowerCase();
    var presets = {
      search: { autocomplete: 'off', spellcheck: false, autocapitalize: 'none', autocorrect: 'off', inputMode: 'search' },
      text: { autocomplete: 'off', spellcheck: false, autocapitalize: 'sentences', autocorrect: 'off', inputMode: 'text' },
      numeric: { autocomplete: 'off', spellcheck: false, autocapitalize: 'none', autocorrect: 'off', inputMode: 'decimal' },
      otp: { autocomplete: 'one-time-code', spellcheck: false, autocapitalize: 'none', autocorrect: 'off', inputMode: 'numeric' },
      email: { autocomplete: 'email', spellcheck: false, autocapitalize: 'none', autocorrect: 'off', inputMode: 'email' },
      freeform: { autocomplete: 'off', spellcheck: true, autocapitalize: 'sentences', autocorrect: 'on', inputMode: 'text' }
    };
    if (!presets[mode]) throw new TypeError('[QXFRAME9A7C2] DOM.configureTextInput mode must be search, text, numeric, otp, email, or freeform.');
    var resolved = Object.assign({}, presets[mode], local);
    delete resolved.mode;
    if (resolved.autocomplete != null) input.autocomplete = String(resolved.autocomplete);
    if (resolved.spellcheck != null) input.spellcheck = resolved.spellcheck === true;
    if (resolved.autocapitalize != null) input.setAttribute('autocapitalize', String(resolved.autocapitalize));
    if (resolved.autocorrect != null) input.setAttribute('autocorrect', String(resolved.autocorrect));
    if (resolved.inputMode != null) input.inputMode = String(resolved.inputMode);
    if (resolved.enterKeyHint != null && 'enterKeyHint' in input) input.enterKeyHint = String(resolved.enterKeyHint);
    return input;
  }

  function isComposingEvent(event) {
    return !!(event && (event.isComposing === true || event.keyCode === 229));
  }

  function activationSource(event) {
    if (!event) return 'api';
    var type = String(event.type || '').toLowerCase();
    if (event.isTrusted === false) return 'api';
    if (type.indexOf('key') === 0) return 'keyboard';
    if (type === 'click') {
      if (event.pointerType) return 'pointer';
      return Number(event.detail || 0) === 0 ? 'keyboard' : 'pointer';
    }
    if (type.indexOf('pointer') === 0 || type.indexOf('mouse') === 0 || type.indexOf('touch') === 0) return 'pointer';
    return 'api';
  }

  function removeNode(node) {
    if (!node) return false;
    if (Utils.isFunction(node.remove)) {
      node.remove();
      return true;
    }
    if (node.parentNode && Utils.isFunction(node.parentNode.removeChild)) {
      node.parentNode.removeChild(node);
      return true;
    }
    return false;
  }

  function setText(node, value) {
    if (!node || !('textContent' in node)) {
      throw new TypeError('[QXFRAME9A7C2] DOM.setText requires a textContent-capable node.');
    }
    node.textContent = value === undefined || value === null ? '' : String(value);
    return node;
  }

  function getStats() {
    return Object.freeze({
      listenerAdds: listenerAdds,
      listenerRemoves: listenerRemoves,
      activeListeners: activeListeners
    });
  }

export const DOM = Object.freeze({
  listen, query, queryAll, matches, closest, documentOf, viewOf, resolveElement, requireElement,
  canFocus, focusElement, configureTextInput, activationSource, isComposingEvent, removeNode, setText,
  setPrivate, getPrivate, hasPrivate, deletePrivate, closestPrivate, findPrivate, findAllPrivate, privateMatcher, getStats
});
