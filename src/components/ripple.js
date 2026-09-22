import { Lifecycle } from '../core/lifecycle.js';
import { DOM } from '../core/dom.js';
import { Config } from '../core/config.js';
import { ObserverHub } from '../core/observerHub.js';
import { PressInteraction } from '../core/pressInteraction.js';

var instances = new WeakMap();
var waveCleanups = new WeakMap();
var autoInstances = new WeakSet();
var AUTO_SELECTOR = '.qxframe9a7c2-button.is-ripple';
var AUTO_INSIDE_CLASS = 'is-ripple-inside';
var AUTO_OUTSIDE_CLASS = 'is-ripple-outside';
var DEFAULTS = Object.freeze({ inside: true, outside: false, color: null });
function tone(value, fallback, label) {
  if (value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string' && value.trim()) return value;
  throw new TypeError('[QXFRAME9A7C2] Ripple ' + label + ' must be boolean or non-empty color string.');
}
function color(value, fallback) {
  if (value === undefined) return fallback;
  if (value === null) return null;
  if (typeof value === 'string' && value.trim()) return value;
  throw new TypeError('[QXFRAME9A7C2] Ripple color must be null or a non-empty string.');
}
function normalize(next, previous) {
  if (next === undefined || next === null) next = {};
  var base = previous || DEFAULTS;
  return { inside: tone(next.inside, base.inside, 'inside'), outside: tone(next.outside, base.outside, 'outside'), color: color(next.color, base.color) };
}
function pressPosition(event, rect) {
  var touch = event && ((event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]));
  var clientX = touch ? touch.clientX : event && Number.isFinite(event.clientX) ? event.clientX : rect.left + rect.width / 2;
  var clientY = touch ? touch.clientY : event && Number.isFinite(event.clientY) ? event.clientY : rect.top + rect.height / 2;
  return { x: clientX - rect.left, y: clientY - rect.top };
}
function waveDiameter(x, y, rect) {
  var dx = Math.max(x, rect.width - x), dy = Math.max(y, rect.height - y);
  return Math.max(48, Math.sqrt(dx * dx + dy * dy) * 2);
}
    
function enhance(element, options) {
  if (!element || element.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Ripple.enhance requires Element.');
  var existing = instances.get(element);
  if (existing) return existing;
    
  var scope = Lifecycle.createScope(), state = normalize(options), destroyed = false;
  var doc = element.ownerDocument || globalThis.document;
    
  function motionEnabled() { return Config.motionEnabled(element); }
  function isDisabled() {
    return destroyed || element.classList.contains('is-disabled') || element.classList.contains('is-loading') || element.hasAttribute('disabled');
  }
  function addWaveListener(wave, eventName, handler) {
    var remove = DOM.listen(wave, eventName, handler), list = waveCleanups.get(wave) || [];
    list.push(remove); waveCleanups.set(wave, list); return remove;
  }
  function disposeWave(wave) {
    var list = waveCleanups.get(wave) || [];
    list.splice(0).forEach(function (remove) { remove(); });
    waveCleanups.delete(wave); DOM.removeNode(wave);
  }
  function clear() {
    if (destroyed) return false;
    Array.prototype.forEach.call(element.querySelectorAll('.qxframe9a7c2-ripple-wave'), disposeWave);
    return true;
  }
  function createWave(event, type) {
    if (destroyed || isDisabled() || !motionEnabled() || !state[type]) return null;
    var rect = element.getBoundingClientRect(), position = pressPosition(event, rect), diameter = waveDiameter(position.x, position.y, rect);
    var wave = doc.createElement('span');
    wave.className = 'qxframe9a7c2-ripple-wave is-' + type; DOM.setPrivate(wave, 'filled', false);
    wave.style.setProperty('--qxframe9a7c2-ripple-top', (position.y - diameter / 2) + 'px');
    wave.style.setProperty('--qxframe9a7c2-ripple-left', (position.x - diameter / 2) + 'px');
    wave.style.setProperty('--qxframe9a7c2-ripple-width', diameter + 'px');
    wave.style.setProperty('--qxframe9a7c2-ripple-height', diameter + 'px');
    if (typeof state[type] === 'string') {
      wave.style.setProperty('--qxframe9a7c2-ripple-' + type + '-color', state[type]);
      wave.style.setProperty(type === 'inside' ? '--qxframe9a7c2-ripple-opacity' : '--qxframe9a7c2-ripple-outside-opacity', '1');
    } else if (state.color) {
      wave.style.setProperty('--qxframe9a7c2-ripple-' + type + '-color', state.color);
      wave.style.setProperty(type === 'inside' ? '--qxframe9a7c2-ripple-opacity' : '--qxframe9a7c2-ripple-outside-opacity', type === 'inside' ? '.58' : '.78');
    }
    if (state.color) wave.style.setProperty('--qxframe9a7c2-ripple-color', state.color);
    element.appendChild(wave); void wave.clientLeft;
    var enterName = 'qxframe9a7c2-ripple-' + type + '-enter';
    var removeEnter = addWaveListener(wave, 'animationend', function onEnter(eventObject) {
      if (eventObject.animationName !== enterName) return;
      DOM.setPrivate(wave, 'filled', true); removeEnter(); if (type === 'outside') disposeWave(wave);
    });
    return wave;
  }
  function endInside() {
    if (destroyed) return false;
    var waves = Array.prototype.filter.call(element.querySelectorAll('.qxframe9a7c2-ripple-wave.is-inside'), function (wave) { return DOM.getPrivate(wave, 'removing') !== true; });
    if (!waves.length) return false;
    waves.forEach(function (wave) {
      DOM.setPrivate(wave, 'removing', true);
      function leave() {
        if (!wave.isConnected) return;
        wave.classList.add('is-leave');
        var removeLeave = addWaveListener(wave, 'animationend', function (eventObject) {
          if (eventObject.animationName !== 'qxframe9a7c2-ripple-inside-leave') return;
          removeLeave(); disposeWave(wave);
        });
      }
      if (DOM.getPrivate(wave, 'filled') === true) leave();
      else {
        var removeWait = addWaveListener(wave, 'animationend', function (eventObject) {
          if (eventObject.animationName !== 'qxframe9a7c2-ripple-inside-enter') return;
          removeWait(); DOM.setPrivate(wave, 'filled', true); leave();
        });
      }
    });
    return true;
  }
  function pressEvent(detail) { return detail && detail.originalEvent || null; }
    
  element.classList.add('qxframe9a7c2-ripple-host');
  var pressInteraction = PressInteraction.create({
    target: element,
    document: doc,
    keyboard: true,
    preventDefaultOnKeyboard: false,
    preventDefaultWhenBlocked: false,
    getState: function () { return { disabled: isDisabled() }; },
    onPressStart: function (detail) { createWave(pressEvent(detail), 'inside'); },
    onPressEnd: function (detail) { endInside(); createWave(pressEvent(detail), 'outside'); },
    onPressCancel: function () { endInside(); }
  });
  scope.add(function () { if (pressInteraction) pressInteraction.destroy(); pressInteraction = null; });
  scope.add(Config.onMotionChange(function () { if (!motionEnabled()) clear(); }));
  var observer = ObserverHub.resize(element, function () { clear(); });
  scope.add(function () { if (observer) observer(); observer = null; });
    
  var api = Object.freeze({
    element: element, clear: clear,
    updateOptions: function (next) { if (destroyed) return false; state = normalize(next, state); return api.getState(); },
    getState: function () { return Object.freeze({ inside:state.inside, outside:state.outside, color:state.color, waveCount:destroyed?0:element.querySelectorAll('.qxframe9a7c2-ripple-wave').length, disabled:isDisabled(), motionEnabled:motionEnabled(), destroyed:destroyed }); },
    getRootElement: function () { return element; },
    destroy: function () {
      if (destroyed) return false;
      clear(); destroyed = true; scope.dispose(); element.classList.remove('qxframe9a7c2-ripple-host'); instances.delete(element); return true;
    }
  });
  instances.set(element, api); return api;
}
    
/*
 * .qxframe9a7c2-button.is-ripple is the declarative auto-enhance contract.
 * Optional modifiers:
 *   .is-ripple-inside  -> inside only
 *   .is-ripple-outside -> outside only
 *   both               -> inside + outside
 * Plain .is-ripple remains inside-only for backward compatibility.
 * Ripple remains the only press-wave owner; Button does not create a second wave system.
 * Auto ownership is tracked separately so removing .is-ripple only destroys instances
 * that were created by this declarative contract, never manually enhanced instances.
 */
function matchesAuto(element) {
  return !!(element && element.nodeType === 1 && element.matches && element.matches(AUTO_SELECTOR));
}
function autoOptions(element) {
  var inside = element.classList.contains(AUTO_INSIDE_CLASS);
  var outside = element.classList.contains(AUTO_OUTSIDE_CLASS);
  /* Plain .is-ripple preserves the original default: inside only. */
  if (!inside && !outside) inside = true;
  return { inside: inside, outside: outside };
}
function ensureAuto(element) {
  if (!matchesAuto(element)) return null;
  var existing = instances.get(element);
  if (existing) {
    if (autoInstances.has(element)) existing.updateOptions(autoOptions(element));
    return existing;
  }
  var api = enhance(element, autoOptions(element));
  autoInstances.add(element);
  return api;
}
function releaseAuto(element) {
  if (!element || element.nodeType !== 1 || !autoInstances.has(element)) return false;
  var api = instances.get(element);
  autoInstances.delete(element);
  if (api) api.destroy();
  return true;
}
function syncAuto(element) {
  if (!element || element.nodeType !== 1) return;
  if (matchesAuto(element)) ensureAuto(element);
  else releaseAuto(element);
}
function scanAuto(root) {
  if (!root) return;
  if (root.nodeType === 1) syncAuto(root);
  if (!root.querySelectorAll) return;
  Array.prototype.forEach.call(root.querySelectorAll(AUTO_SELECTOR), ensureAuto);
}
function releaseAutoTree(root) {
  if (!root) return;
  if (root.nodeType === 1) releaseAuto(root);
  if (!root.querySelectorAll) return;
  Array.prototype.forEach.call(root.querySelectorAll(AUTO_SELECTOR), releaseAuto);
}
function startAutoEnhance() {
  var doc = globalThis.document;
  if (!doc || !doc.documentElement) return;
  scanAuto(doc);
  var observer = ObserverHub.mutation(doc.documentElement, function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === 'attributes') { syncAuto(mutation.target); return; }
      Array.prototype.forEach.call(mutation.removedNodes || [], releaseAutoTree);
      Array.prototype.forEach.call(mutation.addedNodes || [], scanAuto);
    });
  }, { schedule: 'mutate', observeOptions: { subtree: true, childList: true, attributes: true, attributeFilter: ['class'] } });
  if (!observer) {
    if (doc.readyState === 'loading') DOM.listen(doc, 'DOMContentLoaded', function () { scanAuto(doc); });
    return;
  }
  if (doc.readyState === 'loading') DOM.listen(doc, 'DOMContentLoaded', function () { scanAuto(doc); });
}
    

export const Ripple = Object.freeze({
    definition: Object.freeze({ initializer: Object.freeze({ mode: 'enhance' }) }),
    defaults: DEFAULTS,
    enhance
});
export { startAutoEnhance };
