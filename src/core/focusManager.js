// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOM } from './dom.js';

const global = globalThis;

var selector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(',');

  function create(options) {
    var settings = options || {};
    var doc = settings.document || global.document;
    var captured = null;
    var destroyed = false;

    function canFocus(node) {
      return !destroyed && DOM.canFocus(node);
    }

    function focus(node, focusOptions) {
      if (destroyed) return false;
      return DOM.focusElement(node, focusOptions || { preventScroll: true });
    }

    function capture() {
      if (destroyed) return null;
      captured = doc && doc.activeElement ? doc.activeElement : null;
      return captured;
    }

    function isTabbable(node) {
      if (!node || typeof node.matches !== 'function') return false;
      var explicitTabIndex = node.getAttribute && node.getAttribute('tabindex');
      if (explicitTabIndex !== null && Number(explicitTabIndex) < 0) return false;
      if (!node.matches(selector)) return false;
      if (!canFocus(node) || node.hidden === true) return false;
      return true;
    }

    function tabbable(container) {
      if (!container || typeof container.querySelectorAll !== 'function') return [];
      return Array.prototype.slice.call(container.querySelectorAll(selector)).filter(isTabbable);
    }

    function focusFirst(container) {
      var nodes = tabbable(container);
      return nodes.length ? focus(nodes[0]) : focus(container);
    }

    function focusLast(container) {
      var nodes = tabbable(container);
      return nodes.length ? focus(nodes[nodes.length - 1]) : focus(container);
    }

    function restore() {
      if (destroyed || !captured) return false;
      var target = captured;
      captured = null;
      if ('isConnected' in target && target.isConnected === false) return false;
      return focus(target);
    }

    function destroy() {
      if (destroyed) return false;
      captured = null;
      destroyed = true;
      return true;
    }

    return {
      capture: capture,
      focus: focus,
      isTabbable: isTabbable,
      tabbable: tabbable,
      focusFirst: focusFirst,
      focusLast: focusLast,
      restore: restore,
      destroy: destroy
    };
  }

export const FocusManager = Object.freeze({ create });
export { create };
