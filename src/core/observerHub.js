// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Scheduler } from './scheduler.js';

const global = globalThis;

var observerStats = { resize: 0, mutation: 0, intersection: 0, media: 0 };

  function nodesOf(target) {
    if (!target) return [];
    if (Array.isArray(target)) return target.filter(Boolean);
    if (typeof target.length === 'number' && !target.nodeType && typeof target !== 'string') return Array.prototype.slice.call(target).filter(Boolean);
    return [target];
  }
  function viewOf(target) { var doc = target && target.ownerDocument || global.document; return doc && doc.defaultView || global; }
  function observerConstructor(settings, name, view) {
    var injected = settings && Object.prototype.hasOwnProperty.call(settings, name) ? settings[name] : null;
    if (!injected && settings && Object.prototype.hasOwnProperty.call(settings, 'constructor')) injected = settings.constructor;
    return injected || (view && view[name]) || global[name];
  }
  function scheduledCallback(callback, schedule) {
    if (schedule === false || schedule === 'sync') return callback;
    var cancel = null, latestArgs = null;
    function run() { var args = latestArgs; latestArgs = null; cancel = null; callback.apply(null, args || []); }
    var wrapped = function () {
      latestArgs = arguments;
      if (cancel) return;
      cancel = schedule === 'mutate' ? Scheduler.mutate(run) : Scheduler.measure(run);
    };
    wrapped.cancel = function () { if (cancel) cancel(); cancel = null; latestArgs = null; };
    return wrapped;
  }
  function observeResize(target, callback, options) {
    var nodes = nodesOf(target);
    if (!nodes.length || typeof callback !== 'function') return function () {};
    var settings = options || {};
    var view = viewOf(nodes[0]);
    var Ctor = observerConstructor(settings, 'ResizeObserver', view);
    if (typeof Ctor !== 'function') return function () {};
    var deliver = scheduledCallback(callback, settings.schedule === undefined ? 'measure' : settings.schedule);
    var observer = new Ctor(function (entries, instance) { deliver(entries, instance); });
    nodes.forEach(function (node) { observer.observe(node, settings.observeOptions); });
    observerStats.resize += 1;
    var active = true;
    return function () { if (!active) return false; active = false; observerStats.resize = Math.max(0, observerStats.resize - 1); if (deliver.cancel) deliver.cancel(); observer.disconnect(); observer = null; return true; };
  }
  function observeMutation(target, callback, options) {
    var nodes = nodesOf(target);
    if (!nodes.length || typeof callback !== 'function') return function () {};
    var settings = options || {};
    var view = viewOf(nodes[0]);
    var Ctor = observerConstructor(settings, 'MutationObserver', view);
    if (typeof Ctor !== 'function') return function () {};
    var deliver = scheduledCallback(callback, settings.schedule === undefined ? 'measure' : settings.schedule);
    var observer = new Ctor(function (entries, instance) { deliver(entries, instance); });
    var observeOptions = settings.observeOptions || settings.mutationOptions || { childList: true, subtree: true };
    nodes.forEach(function (node) { observer.observe(node, observeOptions); });
    observerStats.mutation += 1;
    var active = true;
    return function () { if (!active) return false; active = false; observerStats.mutation = Math.max(0, observerStats.mutation - 1); if (deliver.cancel) deliver.cancel(); observer.disconnect(); observer = null; return true; };
  }
  function observeIntersection(target, callback, options) {
    var nodes = nodesOf(target);
    if (!nodes.length || typeof callback !== 'function') return function () {};
    var settings = options || {};
    var view = viewOf(nodes[0]);
    var Ctor = observerConstructor(settings, 'IntersectionObserver', view);
    if (typeof Ctor !== 'function') return function () {};
    var deliver = scheduledCallback(callback, settings.schedule === undefined ? 'measure' : settings.schedule);
    var observer = new Ctor(function (entries, instance) { deliver(entries, instance); }, settings.observerOptions || settings);
    nodes.forEach(function (node) { observer.observe(node); });
    observerStats.intersection += 1;
    var active = true;
    return function () { if (!active) return false; active = false; observerStats.intersection = Math.max(0, observerStats.intersection - 1); if (deliver.cancel) deliver.cancel(); observer.disconnect(); observer = null; return true; };
  }
  function observeMedia(query, callback, options) {
    if (typeof callback !== 'function') return function () {};
    var settings = options || {};
    var view = settings.window || global;
    if (!view || typeof view.matchMedia !== 'function') return function () {};
    var media = view.matchMedia(String(query || ''));
    var deliver = scheduledCallback(function (event) { callback(media, event || null); }, settings.schedule === undefined ? 'measure' : settings.schedule);
    function onChange(event) { deliver(event || null); }
    if (typeof media.addEventListener === 'function') media.addEventListener('change', onChange);
    else if (typeof media.addListener === 'function') media.addListener(onChange);
    if (settings.immediate !== false) callback(media, null);
    observerStats.media += 1;
    var active = true;
    return function () {
      if (!active) return false;
      active = false;
      observerStats.media = Math.max(0, observerStats.media - 1);
      if (deliver.cancel) deliver.cancel();
      if (typeof media.removeEventListener === 'function') media.removeEventListener('change', onChange);
      else if (typeof media.removeListener === 'function') media.removeListener(onChange);
      media = null;
      return true;
    };
  }
  function getStats() { return Object.freeze({ resize: observerStats.resize, mutation: observerStats.mutation, intersection: observerStats.intersection, media: observerStats.media, activeObservers: observerStats.resize + observerStats.mutation + observerStats.intersection + observerStats.media }); }

export const ObserverHub = Object.freeze({ resize: observeResize, mutation: observeMutation, intersection: observeIntersection, media: observeMedia, getStats });
export { observeResize, observeMutation, observeIntersection, observeMedia, getStats };
