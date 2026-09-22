// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { DOM } from './dom.js';
import { DOMProjection } from './domProjection.js';

const global = globalThis;

var records = new WeakMap();
  var locksCreated = 0, locksDestroyed = 0, activeLocks = 0;

  function getRecord(target) {
    var record = records.get(target);
    if (!record) {
      record = { count: 0, projection: null };
      records.set(target, record);
    }
    return record;
  }
  function numberStyle(win, node, name) {
    if (!win || typeof win.getComputedStyle !== 'function') return 0;
    return parseFloat(win.getComputedStyle(node).getPropertyValue(name)) || 0;
  }
  function scrollbarWidth(target, doc, win) {
    if (!target || !doc || !win) return 0;
    if (target === doc.documentElement || target === doc.body) {
      return Math.max(0, Number(win.innerWidth || 0) - Number(doc.documentElement.clientWidth || 0));
    }
    var borders = numberStyle(win, target, 'border-left-width') + numberStyle(win, target, 'border-right-width');
    return Math.max(0, Number(target.offsetWidth || 0) - Number(target.clientWidth || 0) - borders);
  }
  function resolveNodes(value, doc) {
    if (!value || !doc) return [];
    if (typeof value === 'function') value = value();
    if (typeof value === 'string') return DOM.queryAll(doc, value);
    if (value.nodeType === 1) return [value];
    return Array.isArray(value) ? value.filter(function (node) { return node && node.nodeType === 1; }) : [];
  }

  function create(options) {
    locksCreated += 1;
    var settings = options || {};
    var doc = settings.document || global.document;
    var win = settings.window || global;
    var target = settings.target || (doc && doc.documentElement);
    if (!target || !target.style) throw new TypeError('[QXFRAME9A7C2] ScrollLock target with style is required.');

    var locked = false;
    var destroyed = false;

    function compensateNode(node, property, delta, record) {
      if (!node || !node.style || !record.projection) return;
      var priority = node.style.getPropertyPriority(property);
      var current = numberStyle(win, node, property);
      record.projection.setStyle(node, property, String(current + delta) + 'px', priority);
    }

    function lock() {
      if (destroyed || locked) return false;
      var record = getRecord(target);
      if (record.count === 0) {
        record.projection = DOMProjection.create();
        var width = settings.compensateScrollbar === false ? 0 : scrollbarWidth(target, doc, win);
        if (width > 0) {
          var current = numberStyle(win, target, 'padding-inline-end');
          record.projection.setStyle(target, 'padding-inline-end', String(current + width) + 'px', target.style.getPropertyPriority('padding-inline-end'));
          if (target === doc.documentElement || target === doc.body) {
            var fixed = resolveNodes(settings.fixedTargets || '[data-qxframe9a7c2-scroll-lock-fixed]', doc);
            var sticky = resolveNodes(settings.stickyTargets || '[data-qxframe9a7c2-scroll-lock-sticky],.qxframe9a7c2-layout.is-fixed-header>.qxframe9a7c2-layout-header', doc);
            fixed.forEach(function (node) { compensateNode(node, 'padding-inline-end', width, record); });
            sticky.forEach(function (node) { compensateNode(node, 'margin-inline-end', -width, record); });
          }
        }
        record.projection.setStyle(target, 'overflow', 'hidden', target.style.getPropertyPriority('overflow'));
      }
      record.count += 1;
      locked = true;
      activeLocks += 1;
      return true;
    }

    function unlock() {
      if (!locked) return false;
      var record = getRecord(target);
      record.count = Math.max(0, record.count - 1);
      locked = false;
      activeLocks = Math.max(0, activeLocks - 1);
      if (record.count === 0 && record.projection) {
        record.projection.destroy();
        record.projection = null;
      }
      return true;
    }

    function destroy() {
      if (destroyed) return false;
      unlock();
      destroyed = true;
      locksDestroyed += 1;
      return true;
    }

    var api = { lock: lock, unlock: unlock, destroy: destroy };
    Object.defineProperties(api, {
      locked: { enumerable: true, get: function () { return locked; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });
    return api;
  }

export const ScrollLock = Object.freeze({ create, getStats: function () { return Object.freeze({ created: locksCreated, destroyed: locksDestroyed, liveLocks: Math.max(0, locksCreated - locksDestroyed), activeLocks: activeLocks }); } });
export { create };
