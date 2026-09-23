
import { Utils } from '../utils/utils.js';
import { Scheduler } from './scheduler.js';
import { Config } from './config.js';
import { MotionPresets } from './motionPresets.js';

const global = globalThis;

var STATUS = Object.freeze(['none', 'appear', 'enter', 'leave']);
var STEPS = Object.freeze(['idle', 'prepare', 'start', 'active']);
var TYPES = Object.freeze(['auto', 'transition', 'animation', 'both']);
var motionsCreated = 0, motionsDestroyed = 0, activeMotions = 0, hookErrors = 0;
var REVERSAL_FALLBACK_PROPERTIES = Object.freeze(['opacity', 'transform', 'translate', 'scale', 'rotate', 'filter', 'clip-path', 'background-color', 'color', 'border-color', 'border-radius', 'box-shadow', 'height', 'width', 'max-height', 'max-width', 'top', 'right', 'bottom', 'left']);

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function noop() {}
function isFunction(value) { return typeof value === 'function'; }
function viewOfElement(element) { var doc = element && element.ownerDocument; return doc && doc.defaultView || global; }
function asBoolean(value, fallback) { return value === undefined ? fallback : value === true; }
function finiteNumber(value) { var number = Number(value); return Number.isFinite(number) ? number : null; }
function resolveDuration(source, direction, ctx) {
  var value = isFunction(source) ? source(ctx) : source;
  if (value == null || value === '') return null;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (own(value, direction)) value = value[direction];
    else if (direction === 'appear' && own(value, 'enter')) value = value.enter;
    else return null;
    if (isFunction(value)) value = value(ctx);
  }
  if (value == null || value === '') return null;
  var number = finiteNumber(value);
  if (number === null || number < 0) throw new TypeError('[QXFRAME9A7C2] MotionCore duration must be a finite non-negative millisecond value.');
  return number;
}
function normalizeType(value, fallback) {
  var next = value == null || value === '' ? (fallback || 'auto') : String(value);
  if (TYPES.indexOf(next) < 0) throw new TypeError('[QXFRAME9A7C2] MotionCore type must be auto, transition, animation, or both.');
  return next;
}
function classList(value) {
  if (!value) return [];
  var values = Array.isArray(value) ? value : String(value).split(/\s+/);
  var seen = Object.create(null);
  return values.map(function (name) { return String(name || '').trim(); }).filter(function (name) {
    if (!name || seen[name]) return false;
    seen[name] = true;
    return true;
  });
}
function propertyList(value) {
  if (value == null || value === '') return null;
  var values = Array.isArray(value) ? value : String(value).split(/[\s,]+/);
  var seen = Object.create(null);
  var output = values.map(function (name) { return cssName(String(name || '').trim()); }).filter(function (name) {
    if (!name || seen[name]) return false;
    seen[name] = true;
    return true;
  });
  return output.length ? Object.freeze(output) : null;
}
function phaseProperties(from, to, explicit) {
  var declared = propertyList(explicit);
  if (declared) return declared;
  var names = Object.create(null);
  [from, to].forEach(function (patch) {
    if (!patch || !patch.style) return;
    Object.keys(patch.style).forEach(function (key) {
      var name = cssName(key);
      if (name === 'transition' || name.indexOf('transition-') === 0 || name === 'animation' || name.indexOf('animation-') === 0 || name === 'will-change') return;
      names[name] = true;
    });
  });
  var output = Object.keys(names);
  return output.length ? Object.freeze(output) : null;
}
function cloneStyle(value) {
  if (!value) return null;
  if (typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] MotionCore patch.style must be an object.');
  var output = {};
  Utils.copyOwn(output, value);
  return output;
}
function normalizePatch(value) {
  if (!value) return Object.freeze({ className: Object.freeze([]), style: null });
  if (typeof value === 'string' || Array.isArray(value)) {
    return Object.freeze({ className: Object.freeze(classList(value)), style: null });
  }
  if (typeof value !== 'object') throw new TypeError('[QXFRAME9A7C2] MotionCore patch must be a class name, array, or object.');
  return Object.freeze({
    className: Object.freeze(classList(value.className || value.class || value.classes)),
    style: cloneStyle(value.style)
  });
}
function resolveMotionName(name) {
  var value = String(name || '').trim();
  try {
    var presets = MotionPresets;
    if (presets && typeof presets.resolve === 'function') return presets.resolve(value);
  } catch (_) {}
  return value;
}
function namedPhase(name, status, type) {
  name = resolveMotionName(name);
  var from = normalizePatch(name + '-' + status + '-from');
  var active = normalizePatch(name + '-' + status + '-active');
  var to = normalizePatch(name + '-' + status + '-to');
  return Object.freeze({
    type: normalizeType(type, 'auto'),
    from: from,
    active: active,
    to: to,
    properties: null
  });
}
function normalizePhase(value, status, inheritedType) {
  if (typeof value === 'string') return namedPhase(value, status, inheritedType);
  if (!value || typeof value !== 'object') {
    return Object.freeze({ type: normalizeType(inheritedType, 'auto'), from: normalizePatch(null), active: normalizePatch(null), to: normalizePatch(null), properties: null });
  }
  if (value.name) {
    var named = namedPhase(String(value.name), status, value.type || inheritedType);
    var namedFrom = own(value, 'from') ? normalizePatch(value.from) : named.from;
    var namedActive = own(value, 'active') ? normalizePatch(value.active) : named.active;
    var namedTo = own(value, 'to') ? normalizePatch(value.to) : named.to;
    return Object.freeze({
      type: normalizeType(value.type, named.type),
      from: namedFrom,
      active: namedActive,
      to: namedTo,
      properties: phaseProperties(namedFrom, namedTo, value.properties)
    });
  }
  var from = normalizePatch(value.from);
  var active = normalizePatch(value.active);
  var to = normalizePatch(value.to);
  return Object.freeze({
    type: normalizeType(value.type, inheritedType || 'auto'),
    from: from,
    active: active,
    to: to,
    properties: phaseProperties(from, to, value.properties)
  });
}
function normalizeMotion(value) {
  if (typeof value === 'string') {
    return Object.freeze({
      appear: namedPhase(value, 'appear', 'auto'),
      enter: namedPhase(value, 'enter', 'auto'),
      leave: namedPhase(value, 'leave', 'auto')
    });
  }
  if (!value || typeof value !== 'object') throw new TypeError('[QXFRAME9A7C2] MotionCore requires a motion name or descriptor.');
  var type = normalizeType(value.type, 'auto');
  if (value.name) {
    var name = String(value.name);
    return Object.freeze({
      appear: normalizePhase(value.appear || { name: name, type: type }, 'appear', type),
      enter: normalizePhase(value.enter || { name: name, type: type }, 'enter', type),
      leave: normalizePhase(value.leave || { name: name, type: type }, 'leave', type)
    });
  }
  var enter = normalizePhase(value.enter || value.appear, 'enter', type);
  return Object.freeze({
    appear: normalizePhase(value.appear || value.enter, 'appear', type),
    enter: enter,
    leave: normalizePhase(value.leave, 'leave', type)
  });
}
function resolveMotion(source, context) {
  return normalizeMotion(isFunction(source) ? source(context) : source);
}

function cssName(key) {
  if (key.indexOf('--') === 0) return key;
  return key.replace(/[A-Z]/g, function (letter) { return '-' + letter.toLowerCase(); });
}
function setStyle(style, key, value, priority) {
  var name = cssName(key);
  if (name.indexOf('--') === 0 || name.indexOf('-') >= 0) style.setProperty(name, value == null ? '' : String(value), priority || '');
  else style[key] = value == null ? '' : String(value);
}
function getInline(style, key) {
  var name = cssName(key);
  return { value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) };
}
function applyPatch(element, patch) {
  var classes = patch && patch.className ? patch.className.slice() : [];
  var saved = Object.create(null);
  var style = patch && patch.style;
  classes.forEach(function (name) { element.classList.add(name); });
  if (style) Object.keys(style).forEach(function (key) {
    saved[key] = getInline(element.style, key);
    setStyle(element.style, key, style[key], '');
  });
  var active = true;
  return function cleanupPatch() {
    if (!active) return false;
    active = false;
    classes.forEach(function (name) { element.classList.remove(name); });
    Object.keys(saved).forEach(function (key) { setStyle(element.style, key, saved[key].value, saved[key].priority); });
    return true;
  };
}

function splitList(value) { return String(value || '').split(',').map(function (part) { return part.trim(); }); }
function parseTime(value, allowNegative) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return 0;
  var number = /ms$/i.test(text) ? parseFloat(text) : /s$/i.test(text) ? (parseFloat(text) * 1000) : parseFloat(text);
  if (!Number.isFinite(number)) return 0;
  return allowNegative ? number : Math.max(0, number);
}
function listValue(list, index, fallback) {
  if (!list.length) return fallback;
  return list[index % list.length];
}
function motionTiming(element, properties) {
  var propertyFilter = propertyList(properties);
  var motionView = viewOfElement(element);
  var computed = motionView && motionView.getComputedStyle ? motionView.getComputedStyle(element) : null;
  if (!computed) return { transition: [], animation: [], maxTransition: 0, maxAnimation: 0 };
  var transitionProperties = splitList(computed.transitionProperty);
  var tDurations = splitList(computed.transitionDuration).map(function (value) { return parseTime(value, false); });
  var tDelays = splitList(computed.transitionDelay).map(function (value) { return parseTime(value, true); });
  var transition = [];
  var tLength = Math.max(transitionProperties.length, tDurations.length, tDelays.length);
  for (var ti = 0; ti < tLength; ti += 1) {
    var prop = listValue(transitionProperties, ti, 'all');
    var total = Math.max(0, listValue(tDurations, ti, 0) + listValue(tDelays, ti, 0));
    if (prop && prop !== 'none' && total > 0 && (!propertyFilter || prop === 'all' || propertyFilter.indexOf(cssName(prop)) >= 0)) transition.push({ name: prop, total: total });
  }
  var names = splitList(computed.animationName);
  var aDurations = splitList(computed.animationDuration).map(function (value) { return parseTime(value, false); });
  var aDelays = splitList(computed.animationDelay).map(function (value) { return parseTime(value, true); });
  var iterations = splitList(computed.animationIterationCount);
  var animation = [];
  var aLength = Math.max(names.length, aDurations.length, aDelays.length, iterations.length);
  for (var ai = 0; ai < aLength; ai += 1) {
    var name = listValue(names, ai, 'none');
    var iterationText = listValue(iterations, ai, '1');
    var parsedCount = parseFloat(iterationText);
    var count = iterationText === 'infinite' ? Infinity : Number.isFinite(parsedCount) ? Math.max(0, parsedCount) : 1;
    var duration = listValue(aDurations, ai, 0);
    var aTotal = count === Infinity ? 0 : Math.max(0, duration * count + listValue(aDelays, ai, 0));
    if (name && name !== 'none' && aTotal > 0) animation.push({ name: name, total: aTotal });
  }
  function max(items) { return items.reduce(function (value, item) { return Math.max(value, item.total); }, 0); }
  return { transition: transition, animation: animation, maxTransition: max(transition), maxAnimation: max(animation) };
}
function eventTotal(items, name) {
  var match = 0;
  items.forEach(function (item) {
    if (item.name === name || item.name === 'all') match = Math.max(match, item.total);
  });
  return match;
}
function selectedMax(timing, type) {
  if (type === 'transition') return timing.maxTransition;
  if (type === 'animation') return timing.maxAnimation;
  return Math.max(timing.maxTransition, timing.maxAnimation);
}
function waitsForKind(type, kind) {
  return type === 'auto' || type === 'both' || type === kind;
}
function waitMotionEnd(element, type, options, done) {
  var settings = options || {};
  type = normalizeType(type, 'auto');
  var timing = motionTiming(element, settings.properties);
  var explicitDuration = settings.duration == null || settings.duration === '' ? null : finiteNumber(settings.duration);
  if (explicitDuration !== null && explicitDuration < 0) throw new TypeError('[QXFRAME9A7C2] MotionCore wait duration must be a finite non-negative millisecond value.');
  if (settings.duration != null && settings.duration !== '' && explicitDuration === null) throw new TypeError('[QXFRAME9A7C2] MotionCore wait duration must be a finite non-negative millisecond value.');
  var max = explicitDuration === null ? selectedMax(timing, type) : explicitDuration;
  if (settings.immediate || max <= 0) { done(explicitDuration === null ? 'instant' : 'duration', timing); return noop; }
  var finished = false;
  var tolerance = 20;
  var timer = 0;
  var startedAt = global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
  var transitionDone = timing.maxTransition <= 0;
  var animationDone = timing.maxAnimation <= 0;
  function elapsed() {
    var now = global.performance && typeof global.performance.now === 'function' ? global.performance.now() : Date.now();
    return Math.max(0, now - startedAt);
  }
  function finish(reason) {
    if (finished) return;
    finished = true;
    element.removeEventListener('transitionend', onTransitionEnd);
    element.removeEventListener('animationend', onAnimationEnd);
    if (timer) global.clearTimeout(timer);
    done(reason, timing);
  }
  function maybeFinishBoth(reason) {
    if (type === 'both') { if (transitionDone && animationDone) finish(reason); return; }
    finish(reason);
  }
  function onTransitionEnd(event) {
    if (explicitDuration !== null || event.target !== element || !waitsForKind(type, 'transition')) return;
    var total = eventTotal(timing.transition, event.propertyName || 'all');
    if (total < timing.maxTransition - tolerance || elapsed() < timing.maxTransition - tolerance) return;
    transitionDone = true;
    if (type === 'auto' && timing.maxTransition + tolerance < timing.maxAnimation) return;
    maybeFinishBoth('transitionend');
  }
  function onAnimationEnd(event) {
    if (explicitDuration !== null || event.target !== element || !waitsForKind(type, 'animation')) return;
    var total = eventTotal(timing.animation, event.animationName || '');
    if (total < timing.maxAnimation - tolerance || elapsed() < timing.maxAnimation - tolerance) return;
    animationDone = true;
    if (type === 'auto' && timing.maxAnimation + tolerance < timing.maxTransition) return;
    maybeFinishBoth('animationend');
  }
  if (explicitDuration === null) {
    element.addEventListener('transitionend', onTransitionEnd);
    element.addEventListener('animationend', onAnimationEnd);
    timer = global.setTimeout(function () { finish('deadline'); }, max + Math.max(32, Number(settings.deadlinePadding) || 80));
  } else {
    timer = global.setTimeout(function () { finish('duration'); }, explicitDuration);
  }
  return function cancelWait() {
    if (finished) return false;
    finished = true;
    element.removeEventListener('transitionend', onTransitionEnd);
    element.removeEventListener('animationend', onAnimationEnd);
    if (timer) global.clearTimeout(timer);
    return true;
  };
}

function effectProperties(element, phase) {
  var names = Object.create(null);
  (phase.properties || []).forEach(function (name) { names[name] = true; });
  [phase.from, phase.to].forEach(function (patch) {
    if (!patch || !patch.style) return;
    Object.keys(patch.style).forEach(function (key) { names[cssName(key)] = true; });
  });
  var timing = motionTiming(element);
  timing.transition.forEach(function (item) {
    if (item.name && item.name !== 'all' && item.name !== 'none') names[item.name] = true;
  });
  if (!Object.keys(names).length || timing.transition.some(function (item) { return item.name === 'all'; })) {
    REVERSAL_FALLBACK_PROPERTIES.forEach(function (name) { names[name] = true; });
  }
  return Object.keys(names);
}
function captureVisual(element, properties) {
  var motionView = viewOfElement(element);
  var computed = motionView && motionView.getComputedStyle ? motionView.getComputedStyle(element) : null;
  var style = {};
  if (!computed) return normalizePatch({ style: style });
  properties.forEach(function (name) {
    var value = computed.getPropertyValue(name);
    if (value !== '') style[name] = value;
  });
  return normalizePatch({ style: style });
}
function prefersReducedMotion(settings) {
  var reduced = isFunction(settings.reducedMotion) ? settings.reducedMotion() : settings.reducedMotion;
  if (reduced === true) return true;
  if (reduced === false) return false;
  if (settings.disabled === true || (isFunction(settings.disabled) && settings.disabled())) return true;
  return Config.prefersReducedMotion();
}

function create(options) {
  motionsCreated += 1;
  var settings = options || {};
  if (!settings || typeof settings !== 'object') throw new TypeError('[QXFRAME9A7C2] MotionCore.create(options) requires an object.');
  if (!settings.motion) throw new TypeError('[QXFRAME9A7C2] MotionCore.create(options) requires motion.');
  var element = settings.element || null;
  if (element && (!element.style || !element.classList)) throw new TypeError('[QXFRAME9A7C2] MotionCore element must be a DOM Element.');
  if (!element && !isFunction(settings.mount)) throw new TypeError('[QXFRAME9A7C2] MotionCore requires element or mount().');

  var visible = false;
  var present = false;
  var status = 'none';
  var step = 'idle';
  var phase = 'hidden';
  var disposed = false;
  var initialConsumed = false;
  var generation = 0;
  var frame = null;
  var cancelWait = noop;
  var cleanupFrom = noop;
  var cleanupActive = noop;
  var cleanupTo = noop;
  var cleanupSnapshot = noop;
  var currentDirection = null;
  var currentContext = null;
  var mountedByCore = false;
  var settleWaiters = [];
  var lifecycleAbortController = null;

  function reportHookError(error, name, ctx) {
    hookErrors += 1;
    try {
      if (name === 'onPrepare' && isFunction(settings.onPrepareError)) settings.onPrepareError(error, ctx || context());
      else if (isFunction(settings.onHookError)) settings.onHookError(error, Object.freeze({ hook: name, context: ctx || context(), controller: api || null }));
      else if (global.console && isFunction(global.console.error)) global.console.error(error);
    } catch (nested) {
      try { if (global.console && isFunction(global.console.error)) global.console.error(nested); } catch (_) {}
    }
  }
  function callHook(name, args, fallbackContext) {
    var hook = settings[name];
    if (!isFunction(hook)) return undefined;
    try { return hook.apply(null, args || []); }
    catch (error) { reportHookError(error, name, fallbackContext); return undefined; }
  }

  function isSettled() { return currentDirection === null && (phase === 'shown' || phase === 'hidden'); }
  function state() {
    return Object.freeze({ visible: visible, present: present, status: status, step: step, phase: phase, settled: isSettled(), destroyed: disposed });
  }
  function resolveSettleWaiters(runGeneration) {
    if (!disposed && (runGeneration !== generation || !isSettled())) return false;
    if (!settleWaiters.length) return true;
    var snapshot = state();
    var waiters = settleWaiters.slice();
    settleWaiters.length = 0;
    waiters.forEach(function (resolve) { resolve(snapshot); });
    return true;
  }
  function whenSettled() {
    var snapshot = state();
    if (snapshot.settled || disposed) return Promise.resolve(snapshot);
    return new Promise(function (resolve) { settleWaiters.push(resolve); });
  }
  function context(extra) {
    var base = {
      element: element,
      visible: visible,
      present: present,
      status: status,
      step: step,
      phase: phase,
      initial: status === 'appear',
      generation: generation,
      signal: lifecycleAbortController ? lifecycleAbortController.signal : null,
      reason: currentContext && currentContext.reason || 'api',
      originalEvent: currentContext && currentContext.originalEvent || null
    };
    if (extra) Utils.copyOwn(base, extra);
    return Object.freeze(base);
  }
  function emit(extra) {
    callHook('onStateChange', [state(), context(extra)], context(extra));
  }
  function setEngineState(nextStatus, nextStep, nextPhase, extra) {
    status = nextStatus;
    step = nextStep;
    phase = nextPhase;
    emit(extra);
  }
  function ensureElement() {
    if (element) return element;
    element = settings.mount();
    if (!element || !element.style || !element.classList) throw new Error('[QXFRAME9A7C2] MotionCore mount() must return a DOM Element.');
    mountedByCore = true;
    return element;
  }
  function releaseElement() {
    if (!element) return false;
    var target = element;
    var ownedByCore = mountedByCore;
    // Relinquish a lazy-mounted target before invoking public unmount code. The callback
    // is a re-entrant lifecycle edge: if it synchronously reopens the Transition, the new
    // generation must call mount() and receive a fresh element rather than reclaiming the
    // element that is currently being physically released.
    if (ownedByCore) { element = null; mountedByCore = false; }
    if (isFunction(settings.unmount)) callHook('unmount', [target], context({ reason: 'unmount' }));
    else if (ownedByCore && target.parentNode) target.parentNode.removeChild(target);
    return true;
  }
  function cancelFrame() {
    if (!frame) return;
    frame.dispose();
    frame = null;
  }
  function cleanupVisual() {
    cleanupSnapshot(); cleanupSnapshot = noop;
    cleanupTo(); cleanupTo = noop;
    cleanupFrom(); cleanupFrom = noop;
    cleanupActive(); cleanupActive = noop;
  }
  function cancelRuntime() {
    cancelFrame();
    cancelWait(); cancelWait = noop;
    cleanupVisual();
  }
  function finish(runGeneration, direction, completionReason) {
    if (disposed || runGeneration !== generation || currentDirection !== direction) return false;
    cancelFrame();
    cancelWait(); cancelWait = noop;
    cleanupVisual();
    currentDirection = null;
    activeMotions = Math.max(0, activeMotions - 1);
    if (direction === 'leave') {
      present = false;
      setEngineState('none', 'idle', 'hidden', { completion: completionReason });
      if (disposed || runGeneration !== generation || visible !== false || currentDirection !== null) return true;
      var leaveContext = context({ completion: completionReason, status: 'leave', initial: false });
      callHook('onAfterLeave', [leaveContext], leaveContext);
      // Completion hooks are intentionally re-entrant: a consumer may reopen or destroy
      // from onAfterLeave. Never publish a stale visible-complete signal or unmount the
      // element that a newer generation has already reclaimed.
      if (disposed || runGeneration !== generation || visible !== false) return true;
      callHook('onVisibleChanged', [false, leaveContext], leaveContext);
      if (disposed || runGeneration !== generation || visible !== false) return true;
      releaseElement();
      if (disposed || runGeneration !== generation || visible !== false || currentDirection !== null) return true;
      resolveSettleWaiters(runGeneration);
    } else {
      present = true;
      setEngineState('none', 'idle', 'shown', { completion: completionReason });
      if (disposed || runGeneration !== generation || visible !== true || currentDirection !== null) return true;
      var enterContext = context({ completion: completionReason, status: direction, initial: direction === 'appear' });
      callHook('onAfterEnter', [enterContext], enterContext);
      // The same guard prevents an onAfterEnter-triggered close from being followed by a
      // stale visible:true completion notification for the superseded generation.
      if (disposed || runGeneration !== generation || visible !== true) return true;
      callHook('onVisibleChanged', [true, enterContext], enterContext);
      if (disposed || runGeneration !== generation || visible !== true || currentDirection !== null) return true;
      resolveSettleWaiters(runGeneration);
    }
    return true;
  }
  function beginCompletion(runGeneration, direction, phaseDescriptor, immediate) {
    var reduced = prefersReducedMotion(settings);
    cancelWait = waitMotionEnd(element, phaseDescriptor.type, {
      immediate: immediate || reduced,
      deadlinePadding: settings.deadlinePadding,
      duration: resolveDuration(settings.duration, direction, context({ status: direction })),
      properties: phaseDescriptor.properties
    }, function (reason) { finish(runGeneration, direction, reason); });
  }
  function activeTarget(runGeneration, direction, phaseDescriptor, immediate, reversal) {
    if (disposed || runGeneration !== generation) return;
    cleanupSnapshot(); cleanupSnapshot = noop;
    cleanupFrom(); cleanupFrom = noop;
    cleanupTo = applyPatch(element, phaseDescriptor.to);
    setEngineState(direction, 'active', direction === 'leave' ? 'leaving' : 'entering', { reversal: reversal === true });
    if (disposed || runGeneration !== generation || currentDirection !== direction) return;
    callHook('onActive', [context({ status: direction, reversal: reversal === true })], context({ status: direction, reversal: reversal === true }));
    // onActive is a public lifecycle edge and may synchronously reverse/destroy. The old
    // generation must not install a waiter after a newer transition has taken ownership.
    if (disposed || runGeneration !== generation || currentDirection !== direction) return;
    beginCompletion(runGeneration, direction, phaseDescriptor, immediate);
  }
  function scheduleFreshFrame(runGeneration, callback, reason) {
    frame = Scheduler.createFrameScheduler(function () {
      if (frame) { frame.dispose(); frame = null; }
      if (disposed || runGeneration !== generation) return;
      callback();
    });
    frame.request(reason);
  }
  function runPrepare(runGeneration, direction, reversal, callback) {
    if (!isFunction(settings.onPrepare)) { callback(); return; }
    var prepareContext = context({ status: direction, reversal: reversal === true });
    var prepared = callHook('onPrepare', [prepareContext], prepareContext);
    if (!prepared || typeof prepared.then !== 'function') { callback(); return; }
    Promise.resolve(prepared).then(function () {
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      callback();
    }, function (error) {
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      reportHookError(error, 'onPrepare', context({ status: direction, reversal: reversal === true }));
      callback();
    });
  }

  function startFresh(direction, phaseDescriptor, immediate) {
    var runGeneration = generation;
    var reduced = prefersReducedMotion(settings);
    setEngineState(direction, 'prepare', direction === 'leave' ? 'leaving' : 'entering');
    if (disposed || runGeneration !== generation || currentDirection !== direction) return;
    cleanupFrom = applyPatch(element, phaseDescriptor.from);
    if (direction === 'leave') {
      callHook('onBeforeLeave', [context()], context());
    } else callHook('onBeforeEnter', [context()], context());
    // before hooks are allowed to close/reopen/destroy. Do not run prepare work for a
    // generation that the hook has already superseded.
    if (disposed || runGeneration !== generation || currentDirection !== direction) return;
    runPrepare(runGeneration, direction, false, function () {
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      if (immediate || reduced) {
        cleanupActive = applyPatch(element, phaseDescriptor.active);
        void element.offsetWidth;
        setEngineState(direction, 'start', direction === 'leave' ? 'leaving' : 'entering');
        if (disposed || runGeneration !== generation || currentDirection !== direction) return;
        callHook('onStart', [context({ status: direction, reversal: false })], context({ status: direction, reversal: false }));
        if (disposed || runGeneration !== generation || currentDirection !== direction) return;
        activeTarget(runGeneration, direction, phaseDescriptor, true, false);
        return;
      }
      // A newly mounted appear/enter needs two browser frame boundaries: the first
      // commits `from` and activates transition/animation rules, the second applies
      // `to`. Leave starts from an already-painted presence, so one boundary is enough.
      scheduleFreshFrame(runGeneration, function () {
        cleanupActive = applyPatch(element, phaseDescriptor.active);
        void element.offsetWidth;
        setEngineState(direction, 'start', direction === 'leave' ? 'leaving' : 'entering');
        if (disposed || runGeneration !== generation || currentDirection !== direction) return;
        callHook('onStart', [context({ status: direction, reversal: false })], context({ status: direction, reversal: false }));
        if (disposed || runGeneration !== generation || currentDirection !== direction) return;
        if (direction === 'leave') activeTarget(runGeneration, direction, phaseDescriptor, false, false);
        else scheduleFreshFrame(runGeneration, function () {
          activeTarget(runGeneration, direction, phaseDescriptor, false, false);
        }, 'motion-active');
      }, 'motion-start');
    });
  }
  function startReversal(direction, phaseDescriptor, immediate, fromDirection) {
    var visual = captureVisual(element, effectProperties(element, phaseDescriptor));
    cancelRuntime();
    var runGeneration = generation;
    cleanupSnapshot = applyPatch(element, visual);
    setEngineState(direction, 'prepare', direction === 'leave' ? 'leaving' : 'entering', { reversal: true });
    if (disposed || runGeneration !== generation || currentDirection !== direction) return;
    callHook('onInterrupt', [context({ from: fromDirection, to: direction, reversal: true })], context({ from: fromDirection, to: direction, reversal: true }));
    if (direction === 'leave') {
      callHook('onBeforeLeave', [context({ reversal: true })], context({ reversal: true }));
    } else callHook('onBeforeEnter', [context({ reversal: true })], context({ reversal: true }));
    if (disposed || runGeneration !== generation || currentDirection !== direction) return;
    runPrepare(runGeneration, direction, true, function () {
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      // Freeze the computed reversal origin only for the synchronous retarget commit.
      // Keeping transition:none across an async prepare would itself create a second timing
      // authority and could suppress the next native transition.
      var cleanupFreeze = applyPatch(element, { style: { transition: 'none', animation: 'none' } });
      void element.offsetWidth;
      cleanupFreeze();
      cleanupActive = applyPatch(element, phaseDescriptor.active);
      void element.offsetWidth;
      setEngineState(direction, 'start', direction === 'leave' ? 'leaving' : 'entering', { reversal: true });
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      callHook('onStart', [context({ status: direction, reversal: true })], context({ status: direction, reversal: true }));
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      cleanupSnapshot(); cleanupSnapshot = noop;
      cleanupFrom(); cleanupFrom = noop;
      cleanupTo = applyPatch(element, phaseDescriptor.to);
      setEngineState(direction, 'active', direction === 'leave' ? 'leaving' : 'entering', { reversal: true });
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      callHook('onActive', [context({ status: direction, reversal: true })], context({ status: direction, reversal: true }));
      if (disposed || runGeneration !== generation || currentDirection !== direction) return;
      beginCompletion(runGeneration, direction, phaseDescriptor, immediate || prefersReducedMotion(settings));
    });
  }
  function renewLifecycleSignal() {
    if (lifecycleAbortController) {
      try { lifecycleAbortController.abort(); } catch (_) {}
    }
    lifecycleAbortController = typeof global.AbortController === 'function' ? new global.AbortController() : null;
  }

  function setVisible(nextVisible, meta) {
    if (disposed) return false;
    var next = nextVisible === true;
    if (next === visible && ((next && (phase === 'shown' || phase === 'entering')) || (!next && (phase === 'hidden' || phase === 'leaving')))) return false;
    currentContext = meta && typeof meta === 'object' ? meta : {};
    var previousDirection = currentDirection;
    if (previousDirection === null) activeMotions += 1;
    var reversing = (previousDirection === 'enter' || previousDirection === 'appear') && !next || previousDirection === 'leave' && next;
    visible = next;
    generation += 1;
    renewLifecycleSignal();
    var runGeneration = generation;
    ensureElement();
    if (next) present = true;
    var resolved = resolveMotion(settings.motion, context({ requestedVisible: next }));
    var direction;
    if (next) {
      direction = !initialConsumed && asBoolean(settings.appear, true) ? 'appear' : 'enter';
      initialConsumed = true;
    } else direction = 'leave';
    currentDirection = direction;
    var descriptor = resolved[direction] || resolved.enter;
    if (!descriptor) throw new Error('[QXFRAME9A7C2] MotionCore descriptor missing ' + direction + '.');
    var immediate = !!(currentContext && currentContext.immediate) || (direction === 'enter' && settings.enter === false) || (direction === 'leave' && settings.leave === false);
    if (reversing && present) startReversal(direction, descriptor, immediate, previousDirection);
    else {
      cancelRuntime();
      currentDirection = direction;
      if (runGeneration !== generation) return false;
      startFresh(direction, descriptor, immediate);
    }
    return true;
  }
  function destroy() {
    if (disposed) return false;
    disposed = true;
    generation += 1;
    if (lifecycleAbortController) { try { lifecycleAbortController.abort(); } catch (_) {} lifecycleAbortController = null; }
    cancelRuntime();
    if (currentDirection !== null) activeMotions = Math.max(0, activeMotions - 1);
    currentDirection = null;
    motionsDestroyed += 1;
    if (mountedByCore) releaseElement();
    resolveSettleWaiters(generation);
    return true;
  }

  var api = Object.freeze({ setVisible: setVisible, getState: state, whenSettled: whenSettled, destroy: destroy });
  // `appear:false` means an element that is already logically visible at construction
  // commits directly to its entered state. A later hidden -> visible request still uses
  // the normal enter motion, matching Vue/React Transition appear semantics.
  if (settings.visible === true) setVisible(true, { reason: 'initial', immediate: settings.appear === false });
  return api;
}

export const MotionCore = Object.freeze({ create, normalizeMotion, detectMotion: motionTiming, waitMotionEnd, getStats: function () { return Object.freeze({ created: motionsCreated, destroyed: motionsDestroyed, liveMotions: Math.max(0, motionsCreated - motionsDestroyed), active: activeMotions, hookErrors }); }, STATUS, STEPS });
export { create, normalizeMotion, motionTiming as detectMotion, waitMotionEnd, STATUS, STEPS };
