import { Scheduler } from './scheduler.js';
import { EnvironmentPort } from './environmentPort.js';

const global = globalThis;

var observerStats = { resize: 0, mutation: 0, intersection: 0, media: 0 };

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function nodesOf(target) {
  if (!target) return [];
  if (Array.isArray(target)) return target.filter(Boolean);
  if (typeof target.length === 'number' && !target.nodeType && typeof target !== 'string') return Array.prototype.slice.call(target).filter(Boolean);
  return [target];
}
function environmentOf(target, settings, observerName) {
  var local = settings || {};
  if (EnvironmentPort.isPort(local.environment)) return local.environment;
  var doc = local.document || (target && target.ownerDocument) || global.document || null;
  var win = local.window || (doc && doc.defaultView) || global.window || global;
  var envOptions = { document: doc, window: win };
  if (observerName) {
    var injected = own(local, observerName) ? local[observerName] : (own(local, 'constructor') ? local.constructor : undefined);
    var Ctor = injected !== undefined ? injected : (win ? win[observerName] : global[observerName]);
    if (typeof Ctor !== 'function') Ctor = null;
    envOptions[observerName] = Ctor;
  }
  if (own(local, 'matchMedia')) envOptions.matchMedia = local.matchMedia;
  return EnvironmentPort.create(envOptions);
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
  var environment = environmentOf(nodes[0], settings, 'ResizeObserver');
  var deliver = scheduledCallback(callback, settings.schedule === undefined ? 'measure' : settings.schedule);
  var observer = environment.createResizeObserver(function (entries, instance) { deliver(entries, instance); });
  if (!observer) { if (deliver.cancel) deliver.cancel(); return function () {}; }
  nodes.forEach(function (node) { observer.observe(node, settings.observeOptions); });
  observerStats.resize += 1;
  var active = true;
  return function () { if (!active) return false; active = false; observerStats.resize = Math.max(0, observerStats.resize - 1); if (deliver.cancel) deliver.cancel(); observer.disconnect(); observer = null; return true; };
}
function observeMutation(target, callback, options) {
  var nodes = nodesOf(target);
  if (!nodes.length || typeof callback !== 'function') return function () {};
  var settings = options || {};
  var environment = environmentOf(nodes[0], settings, 'MutationObserver');
  var deliver = scheduledCallback(callback, settings.schedule === undefined ? 'measure' : settings.schedule);
  var observer = environment.createMutationObserver(function (entries, instance) { deliver(entries, instance); });
  if (!observer) { if (deliver.cancel) deliver.cancel(); return function () {}; }
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
  var environment = environmentOf(nodes[0], settings, 'IntersectionObserver');
  var deliver = scheduledCallback(callback, settings.schedule === undefined ? 'measure' : settings.schedule);
  var observer = environment.createIntersectionObserver(function (entries, instance) { deliver(entries, instance); }, settings.observerOptions || settings);
  if (!observer) { if (deliver.cancel) deliver.cancel(); return function () {}; }
  nodes.forEach(function (node) { observer.observe(node); });
  observerStats.intersection += 1;
  var active = true;
  return function () { if (!active) return false; active = false; observerStats.intersection = Math.max(0, observerStats.intersection - 1); if (deliver.cancel) deliver.cancel(); observer.disconnect(); observer = null; return true; };
}
function observeMedia(query, callback, options) {
  if (typeof callback !== 'function') return function () {};
  var settings = options || {};
  var environment = environmentOf(null, settings, '');
  var media = environment.matchMedia(String(query || ''));
  if (!media) return function () {};
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
