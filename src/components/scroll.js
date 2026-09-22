// ESM authority: Scroll runtime.
// Migrated from the frozen HOTFIX6 implementation without changing public behavior.

import { Utils } from '../utils/utils.js';
import { Events } from '../core/events.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { DOM } from '../core/dom.js';
import { Config } from '../core/config.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { ObserverHub } from '../core/observerHub.js';
import { PointerSession } from '../core/pointerSession.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ComponentContracts, validateContractOptions } from '../core/componentContracts.js';

var DOMFactory;
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-scroll" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-scroll-viewport" data-qxframe9a7c2-ref="viewport">
      <div class="qxframe9a7c2-scroll-content" data-qxframe9a7c2-ref="content"></div>
    </div>
    <div class="qxframe9a7c2-scroll-track qxframe9a7c2-scroll-track-y" data-qxframe9a7c2-ref="track-y">
      <div class="qxframe9a7c2-scroll-thumb qxframe9a7c2-scroll-thumb-y" data-qxframe9a7c2-ref="thumb-y"></div>
    </div>
    <div class="qxframe9a7c2-scroll-track qxframe9a7c2-scroll-track-x" data-qxframe9a7c2-ref="track-x">
      <div class="qxframe9a7c2-scroll-thumb qxframe9a7c2-scroll-thumb-x" data-qxframe9a7c2-ref="thumb-x"></div>
    </div>
    <div class="qxframe9a7c2-scroll-edge-shadow is-top" data-qxframe9a7c2-ref="shadow-top"></div>
    <div class="qxframe9a7c2-scroll-edge-shadow is-bottom" data-qxframe9a7c2-ref="shadow-bottom"></div>
    <div class="qxframe9a7c2-scroll-edge-shadow is-left" data-qxframe9a7c2-ref="shadow-left"></div>
    <div class="qxframe9a7c2-scroll-edge-shadow is-right" data-qxframe9a7c2-ref="shadow-right"></div>
  </div>`;
    
function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  return { root: instance.root, refs: instance.refs };
}
    
DOMFactory = Object.freeze({ createDefaultDOM: createDefaultDOM, blueprint: blueprint });

var STRUCTURAL_OPTIONS = Object.freeze(['container', 'elements', 'createDOM', 'document']);
var AXES = Object.freeze(['x', 'y', 'both']);
var WHEEL_AXES = Object.freeze(['auto', 'x', 'y']);
var VISIBILITIES = Object.freeze(['auto', 'always', 'hidden']);
var SNAP_ALIGNS = Object.freeze(['start', 'center', 'end', 'nearest']);
var WHEEL_BEHAVIORS = Object.freeze(['pixel', 'snap-step']);
var SNAP_BEHAVIORS = Object.freeze(['auto', 'smooth']);
var EPSILON = 0.5;
var own = Utils.own;
    
function normalizeEnum(value, allowed, fallback, label) {
  var normalized = value === undefined || value === null || value === '' ? fallback : String(value);
  if (allowed.indexOf(normalized) < 0) {
    throw new TypeError('[QXFRAME9A7C2] Scroll ' + label + ' must be one of: ' + allowed.join(', ') + '.');
  }
  return normalized;
}
    
function ensureElement(value, label) {
  if (!value || value.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Scroll ' + label + ' must be an Element.');
  return value;
}
    
function normalizeScrollOptions(value, label) {
  if (value === undefined || value === null) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('[QXFRAME9A7C2] Scroll ' + label + ' requires an options object.');
  }
  return value;
}
    
function normalizeSnapTargets(value) {
  var source = Utils.isFunction(value) ? value(api) : value;
  if (source === undefined || source === null) return [];
  var array;
  if (Array.isArray(source)) array = source.slice();
  else if (typeof source.length === 'number') array = Array.prototype.slice.call(source);
  else throw new TypeError('[QXFRAME9A7C2] Scroll snapTargets must be an array-like collection of Elements or a function returning one.');
  return array.map(function (item) { return ensureElement(item, 'snap target'); });
}
    
function axisEnabled(axis, requested) {
  return requested === axis || requested === 'both';
}
    
function assertAxisCompatibility(axis, wheelAxis, snapAxis) {
  if (axis !== 'both' && wheelAxis !== 'auto' && wheelAxis !== axis) {
    throw new TypeError('[QXFRAME9A7C2] Scroll wheelAxis must be auto or match the enabled axis.');
  }
  if (axis !== 'both' && snapAxis !== 'auto' && snapAxis !== axis) {
    throw new TypeError('[QXFRAME9A7C2] Scroll snapAxis must be auto or match the enabled axis.');
  }
}
    
function attachViewport(options) {
  var input = Object.assign({}, options || {});
  var doc = input.document || (input.root && input.root.ownerDocument) || globalThis.document;
  var root = ensureElement(input.root, 'attachViewport root');
  var viewport = ensureElement(input.viewport, 'attachViewport viewport');
  var content = input.content == null ? viewport : ensureElement(input.content, 'attachViewport content');
  if (viewport !== root && !(root.contains && root.contains(viewport))) throw new TypeError('[QXFRAME9A7C2] Scroll attachViewport viewport must be inside root.');
  if (content !== viewport && !(viewport.contains && viewport.contains(content))) throw new TypeError('[QXFRAME9A7C2] Scroll attachViewport content must be inside viewport.');
    
  var owned = [];
  function addOwnedClass(node, name) {
    if (!node.classList.contains(name)) { node.classList.add(name); owned.push([node, name]); }
  }
  function div(className) { var node = doc.createElement('div'); node.className = className; return node; }
  addOwnedClass(root, 'qxframe9a7c2-scroll');
  addOwnedClass(viewport, 'qxframe9a7c2-scroll-viewport');
  if (content !== viewport) addOwnedClass(content, 'qxframe9a7c2-scroll-content');
    
  var trackY = div('qxframe9a7c2-scroll-track qxframe9a7c2-scroll-track-y');
  var thumbY = div('qxframe9a7c2-scroll-thumb qxframe9a7c2-scroll-thumb-y');
  var trackX = div('qxframe9a7c2-scroll-track qxframe9a7c2-scroll-track-x');
  var thumbX = div('qxframe9a7c2-scroll-thumb qxframe9a7c2-scroll-thumb-x');
  var shadowTop = div('qxframe9a7c2-scroll-edge-shadow is-top');
  var shadowBottom = div('qxframe9a7c2-scroll-edge-shadow is-bottom');
  var shadowLeft = div('qxframe9a7c2-scroll-edge-shadow is-left');
  var shadowRight = div('qxframe9a7c2-scroll-edge-shadow is-right');
  trackY.appendChild(thumbY); trackX.appendChild(thumbX);
  root.appendChild(trackY); root.appendChild(trackX); root.appendChild(shadowTop); root.appendChild(shadowBottom); root.appendChild(shadowLeft); root.appendChild(shadowRight);
  var decorations = [trackY, trackX, shadowTop, shadowBottom, shadowLeft, shadowRight];
  var originalTabindex = root.getAttribute('tabindex');
    
  delete input.root; delete input.viewport; delete input.content; delete input.controller;
  input.document = doc;
  input.elements = { root:root, viewport:viewport, content:content, trackX:trackX, trackY:trackY, thumbX:thumbX, thumbY:thumbY, shadowTop:shadowTop, shadowBottom:shadowBottom, shadowLeft:shadowLeft, shadowRight:shadowRight };
  if (input.axis === undefined) input.axis = 'y';
  if (input.focusable === undefined) input.focusable = false;
  if (input.keyboard === undefined) input.keyboard = false;
  if (input.scrollbarVisibility === undefined) input.scrollbarVisibility = 'auto';
  var instance = create(input);
  var destroyed = false;
  var proxy = Object.create(instance);
  Object.defineProperty(proxy, 'destroy', { enumerable:true, value:function () {
    if (destroyed) return false;
    destroyed = true;
    var result = instance.destroy();
    decorations.forEach(function (node) { if (node.parentNode) node.parentNode.removeChild(node); });
    owned.forEach(function (entry) { entry[0].classList.remove(entry[1]); });
    ['is-axis-x','is-axis-y','is-axis-both','is-scrollbar-auto','is-scrollbar-always','is-scrollbar-hidden','is-scrollbar-interactive','is-scrollbar-manual-show','is-scrollbar-manual-hide','has-edge-shadow','is-disabled','is-readonly','is-scrollbar-active','can-scroll-up','can-scroll-down','can-scroll-left','can-scroll-right'].forEach(function (name) { root.classList.remove(name); });
    if (originalTabindex === null) root.removeAttribute('tabindex'); else root.setAttribute('tabindex', originalTabindex);
    return result;
  }});
  return Object.freeze(proxy);
}
    
function create(options) {
  validateContractOptions(ComponentContracts.get('Scroll'), options || {}, 'Scroll');
  var opts = Object.assign({
    axis: 'y',
    wheelAxis: 'auto',
    wheelPropagation: true,
    scrollbarVisibility: 'auto',
    scrollbarInteractive: true,
    scrollbarHideDelay: 1000,
    edgeShadow: false,
    edgeShadowSize: 16,
    keyboard: true,
    focusable: true,
    disabled: false,
    readOnly: false,
    wheelBehavior: 'pixel',
    snapTargets: null,
    snapAxis: 'auto',
    snapAlign: 'nearest',
    snapBehavior: 'auto',
    snapDuration: 220,
    snapOnIdle: false,
    snapLoop: false,
    scrollIdleDelay: 100
  }, options || {});
    
  var doc = opts.document || globalThis.document;
  var view = doc && doc.defaultView || globalThis;
  if (!doc || !Utils.isFunction(doc.createElement)) throw new Error('[QXFRAME9A7C2] Scroll requires a browser document.');
  var mountContainer = opts.container || null;
  if (opts.elements == null) ensureElement(mountContainer, 'container');
    
  opts.axis = normalizeEnum(opts.axis, AXES, 'y', 'axis');
  opts.wheelAxis = normalizeEnum(opts.wheelAxis, WHEEL_AXES, 'auto', 'wheelAxis');
  opts.scrollbarVisibility = normalizeEnum(opts.scrollbarVisibility, VISIBILITIES, 'auto', 'scrollbarVisibility');
  opts.snapAxis = normalizeEnum(opts.snapAxis, WHEEL_AXES, 'auto', 'snapAxis');
  opts.snapAlign = normalizeEnum(opts.snapAlign, SNAP_ALIGNS, 'nearest', 'snapAlign');
  opts.wheelBehavior = normalizeEnum(opts.wheelBehavior, WHEEL_BEHAVIORS, 'pixel', 'wheelBehavior');
  opts.snapBehavior = normalizeEnum(opts.snapBehavior, SNAP_BEHAVIORS, 'auto', 'snapBehavior');
  assertAxisCompatibility(opts.axis, opts.wheelAxis, opts.snapAxis);
    
  if (typeof opts.snapLoop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Scroll snapLoop must be boolean.');
  if (typeof opts.focusable !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Scroll focusable must be boolean.');
  opts.scrollbarHideDelay = Number(opts.scrollbarHideDelay);
  if (!Number.isFinite(opts.scrollbarHideDelay) || opts.scrollbarHideDelay < 0) throw new TypeError('[QXFRAME9A7C2] Scroll scrollbarHideDelay must be a non-negative finite millisecond value.');
  var emitter = Events.createEmitter();
  var scope = null;
  var domBinding = null;
  var root = null;
  var viewport = null;
  var content = null;
  var trackX = null;
  var trackY = null;
  var thumbX = null;
  var thumbY = null;
  var shadowTop = null;
  var shadowBottom = null;
  var shadowLeft = null;
  var shadowRight = null;
  var destroyed = false;
  var manualScrollbarVisibility = null;
  var thumbXSession = null;
  var thumbYSession = null;
  var lastSnap = -1;
  var lastScrollState = null;
  var scrolling = false;
  var snapSettling = false;
  var idleSuppressUntil = -Infinity;
  var snapStepGesture = null;
  var snapStepMotion = null;
  var motion = null;
  var api = null;
    
  domBinding = DOMBinding.resolve({
    options: opts,
    document: doc,
    target: mountContainer,
    component: null,
    requiredRefs: ['root', 'viewport', 'content', 'trackX', 'trackY', 'thumbX', 'thumbY', 'shadowTop', 'shadowBottom', 'shadowLeft', 'shadowRight'],
    defaultFactory: DOMFactory.createDefaultDOM
  });
  root = domBinding.refs.root;
  viewport = domBinding.refs.viewport;
  content = domBinding.refs.content;
  trackX = domBinding.refs.trackX;
  trackY = domBinding.refs.trackY;
  thumbX = domBinding.refs.thumbX;
  thumbY = domBinding.refs.thumbY;
  shadowTop = domBinding.refs.shadowTop;
  shadowBottom = domBinding.refs.shadowBottom;
  shadowLeft = domBinding.refs.shadowLeft;
  shadowRight = domBinding.refs.shadowRight;
    
  if (domBinding.source !== 'external' && mountContainer) {
    Array.prototype.slice.call(mountContainer.childNodes).forEach(function (node) {
      if (node === root) return;
      content.appendChild(node);
    });
  }
    
  scope = Lifecycle.createScope();
  if (!root.hasAttribute('tabindex')) root.tabIndex = 0;
    
  var scrollbarHideDelay = Scheduler.createDelayScheduler(function () { setInteractionClass(false); });
  var scrollIdleDelay = Scheduler.createDelayScheduler(function (_, reason) {
    if (destroyed || snapSettling || motion) return;
    if (opts.snapOnIdle === true && getSnapTargets().length) settleNearestSnap(reason || 'scroll-idle');
    else emitScrollEnd(reason || 'scroll-idle');
  });
  var snapStepGestureDelay = Scheduler.createDelayScheduler(function () { finishSnapStepGesture(); });
  scope.add(function () { scrollbarHideDelay.dispose(); scrollIdleDelay.dispose(); snapStepGestureDelay.dispose(); });

  function clearHideTimer() { scrollbarHideDelay.cancel(); }
    
  function setInteractionClass(active) {
    if (!root) return;
    root.classList.toggle('is-scrollbar-active', active === true);
  }
    
  function scheduleScrollbarHide() {
    clearHideTimer();
    if (opts.scrollbarVisibility !== 'auto' || manualScrollbarVisibility !== null) return;
    var delay = Math.max(0, Number(opts.scrollbarHideDelay) || 0);
    scrollbarHideDelay.request(delay, 'scrollbar-hide');
  }
    
  function activateScrollbar() {
    if (opts.scrollbarVisibility !== 'auto' || manualScrollbarVisibility === false) return;
    setInteractionClass(true);
    scheduleScrollbarHide();
  }
    
  function holdScrollbarVisible() {
    if (opts.scrollbarVisibility !== 'auto' || manualScrollbarVisibility === false || opts.scrollbarInteractive === false) return;
    clearHideTimer();
    setInteractionClass(true);
  }
    
    
  function maxScrollX() {
    return Math.max(0, (Number(viewport.scrollWidth) || 0) - (Number(viewport.clientWidth) || 0));
  }
    
  function readScrollX(max) {
    var limit = max === undefined ? maxScrollX() : Math.max(0, Number(max) || 0);
    var raw = Number(viewport.scrollLeft) || 0;
    return Math.max(0, Math.min(raw, limit));
  }
    
  function writeScrollX(value, max) {
    var limit = max === undefined ? maxScrollX() : Math.max(0, Number(max) || 0);
    var logical = Math.max(0, Math.min(Number(value) || 0, limit));
    viewport.scrollLeft = logical;
    return logical;
  }
    
  function motionEnabled() {
    return Config.motionEnabled(root);
  }
    
  function applyRootOptions() {
    if (!root) return;
    AXES.forEach(function (axis) { root.classList.remove('is-axis-' + axis); });
    root.classList.add('is-axis-' + opts.axis);
    VISIBILITIES.forEach(function (visibility) { root.classList.remove('is-scrollbar-' + visibility); });
    root.classList.add('is-scrollbar-' + opts.scrollbarVisibility);
    root.classList.toggle('is-scrollbar-interactive', opts.scrollbarInteractive !== false && opts.disabled !== true && opts.readOnly !== true);
    root.classList.toggle('is-scrollbar-manual-show', manualScrollbarVisibility === true);
    root.classList.toggle('is-scrollbar-manual-hide', manualScrollbarVisibility === false);
    root.classList.toggle('has-edge-shadow', opts.edgeShadow === true);
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    root.tabIndex = opts.disabled === true || opts.focusable === false ? -1 : 0;
    var size = Math.max(0, Number(opts.edgeShadowSize) || 0) + 'px';
    shadowTop.style.height = size;
    shadowBottom.style.height = size;
    shadowLeft.style.width = size;
    shadowRight.style.width = size;
  }
    
  function getMetrics() {
    var maxX = maxScrollX();
    var x = readScrollX(maxX);
    var y = Number(viewport.scrollTop) || 0;
    var maxY = Math.max(0, (Number(viewport.scrollHeight) || 0) - (Number(viewport.clientHeight) || 0));
    return {
      x: x,
      y: Math.max(0, Math.min(y, maxY)),
      maxX: maxX,
      maxY: maxY,
      canScrollX: axisEnabled('x', opts.axis) && maxX > EPSILON,
      canScrollY: axisEnabled('y', opts.axis) && maxY > EPSILON
    };
  }
    
  function setOptionalPresence(node, present) {
    if (!node || !root) return;
    if (present) { if (node.parentNode !== root) root.appendChild(node); }
    else if (node.parentNode) node.parentNode.removeChild(node);
  }
  function syncEdgeShadowDOM(metrics) {
    var enabled = opts.edgeShadow === true;
    setOptionalPresence(shadowTop, enabled && metrics.canScrollY);
    setOptionalPresence(shadowBottom, enabled && metrics.canScrollY);
    setOptionalPresence(shadowLeft, enabled && metrics.canScrollX);
    setOptionalPresence(shadowRight, enabled && metrics.canScrollX);
  }
    
  function setThumbGeometry(axis, metrics) {
    var horizontal = axis === 'x';
    var track = horizontal ? trackX : trackY;
    var thumb = horizontal ? thumbX : thumbY;
    var canScroll = horizontal ? metrics.canScrollX : metrics.canScrollY;
    if (!canScroll || (opts.scrollbarVisibility === 'hidden' && manualScrollbarVisibility !== true)) {
      setOptionalPresence(track, false);
      return;
    }
    setOptionalPresence(track, true);
    var trackSize = Number(horizontal ? track.clientWidth : track.clientHeight) || 0;
    var viewportSize = Number(horizontal ? viewport.clientWidth : viewport.clientHeight) || 0;
    var scrollSize = Number(horizontal ? viewport.scrollWidth : viewport.scrollHeight) || 0;
    var max = horizontal ? metrics.maxX : metrics.maxY;
    var current = horizontal ? metrics.x : metrics.y;
    if (!(trackSize > 0) || !(scrollSize > 0)) return;
    var thumbSize = Math.max(18, Math.min(trackSize, trackSize * viewportSize / scrollSize));
    var travel = Math.max(0, trackSize - thumbSize);
    var offset = max > 0 ? travel * current / max : 0;
    if (horizontal) {
      thumb.style.width = thumbSize + 'px';
      thumb.style.transform = 'translate3d(' + offset + 'px,0,0)';
    } else {
      thumb.style.height = thumbSize + 'px';
      thumb.style.transform = 'translate3d(0,' + offset + 'px,0)';
    }
  }
    
  function resolveSnapAxis() {
    if (opts.snapAxis === 'x' || opts.snapAxis === 'y') return opts.snapAxis;
    if (opts.axis === 'x') return 'x';
    return 'y';
  }
    
  function assertScrollTarget(element) {
    ensureElement(element, 'scrollToElement element');
    if (!(content === element || (content.contains && content.contains(element)))) {
      throw new TypeError('[QXFRAME9A7C2] Scroll target element must be inside the Scroll content.');
    }
  }
    
  function targetScrollForElement(element, axis, align, extraOffset) {
    assertScrollTarget(element);
    var point = ScrollVisibility.calculateElementScroll(viewport, element, {
      axis: axis,
      align: align,
      offset: extraOffset,
      currentX: readScrollX(),
      currentY: Number(viewport.scrollTop) || 0,
      maxX: maxScrollX(),
      maxY: Math.max(0, (Number(viewport.scrollHeight) || 0) - (Number(viewport.clientHeight) || 0))
    });
    return axis === 'x' ? point.x : point.y;
  }
    
  function getSnapTargets() {
    return normalizeSnapTargets(opts.snapTargets).filter(function (element) {
      return content === element || !!(content.contains && content.contains(element));
    });
  }
    
  function computeCurrentSnap(metrics) {
    var targets = getSnapTargets();
    if (!targets.length) return -1;
    var axis = resolveSnapAxis();
    var current = axis === 'x' ? metrics.x : metrics.y;
    var best = -1;
    var bestDistance = Infinity;
    targets.forEach(function (element, index) {
      var candidate = targetScrollForElement(element, axis, opts.snapAlign, 0);
      var distance = Math.abs(candidate - current);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return best;
  }
    
  function updateProjection(reason, emitScroll) {
    if (destroyed) return null;
    var metrics = getMetrics();
    setThumbGeometry('x', metrics);
    setThumbGeometry('y', metrics);
    syncEdgeShadowDOM(metrics);
    root.classList.toggle('can-scroll-up', metrics.canScrollY && metrics.y > EPSILON);
    root.classList.toggle('can-scroll-down', metrics.canScrollY && metrics.y < metrics.maxY - EPSILON);
    root.classList.toggle('can-scroll-left', metrics.canScrollX && metrics.x > EPSILON);
    root.classList.toggle('can-scroll-right', metrics.canScrollX && metrics.x < metrics.maxX - EPSILON);
    var snap = computeCurrentSnap(metrics);
    var state = Object.freeze({
      x: metrics.x,
      y: metrics.y,
      maxX: metrics.maxX,
      maxY: metrics.maxY,
      canScrollX: metrics.canScrollX,
      canScrollY: metrics.canScrollY,
      currentSnap: snap,
      axis: opts.axis,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      focusable: opts.focusable !== false,
      scrollbarHideDelay: opts.scrollbarHideDelay,
      motionEnabled: motionEnabled(),
      destroyed: destroyed
    });
    lastScrollState = state;
    if (snap !== lastSnap) {
      lastSnap = snap;
      emitter.emit('snap-change', { index: snap, state: state, reason: reason || 'refresh', controller: api });
    }
    if (emitScroll === true) {
      var detail = { state: state, reason: reason || 'scroll', controller: api };
      if (Utils.isFunction(opts.onScroll)) opts.onScroll(detail);
      emitter.emit('scroll', detail);
    }
    return state;
  }
    
  var frame = Scheduler.createFrameScheduler(function (_, reason) {
    updateProjection(reason || 'frame', reason === 'scroll' || reason === 'wheel' || reason === 'programmatic' || reason === 'motion');
  }, typeof view.requestAnimationFrame === 'function' && typeof view.cancelAnimationFrame === 'function' ? { requestFrame: view.requestAnimationFrame.bind(view), cancelFrame: view.cancelAnimationFrame.bind(view) } : undefined);
  scope.add(function () { frame.dispose(); });
    
  function requestProjection(reason) {
    frame.request(reason || 'refresh');
  }
    
  function now() {
    return view.performance && Utils.isFunction(view.performance.now) ? view.performance.now() : Date.now();
  }
    
  function clearScrollIdleTimer() { scrollIdleDelay.cancel(); }
    
  function emitScrollStart(reason) {
    if (scrolling) return;
    scrolling = true;
    var detail = { state: getState(), reason: reason || 'scroll', controller: api };
    if (Utils.isFunction(opts.onScrollStart)) opts.onScrollStart(detail);
    emitter.emit('scroll-start', detail);
  }
    
  function emitScrollEnd(reason) {
    if (!scrolling) return;
    scrolling = false;
    var detail = { state: getState(), reason: reason || 'scroll-end', controller: api };
    if (Utils.isFunction(opts.onScrollEnd)) opts.onScrollEnd(detail);
    emitter.emit('scroll-end', detail);
  }
    
  function emitSnapSettle(index, reason) {
    var targets = getSnapTargets();
    var element = index >= 0 && index < targets.length ? targets[index] : null;
    var detail = { index: index, element: element, state: getState(), reason: reason || 'snap-settle', controller: api };
    if (Utils.isFunction(opts.onSnapSettle)) opts.onSnapSettle(detail);
    emitter.emit('snap-settle', detail);
  }
    
  var motionFrame = Scheduler.createFrameScheduler(function (timestamp) {
    if (!motion || destroyed) return;
    var duration = Math.max(0, Number(motion.duration) || 0);
    var progress = duration <= 0 ? 1 : Math.max(0, Math.min(1, (timestamp - motion.startedAt) / duration));
    var eased = 1 - Math.pow(1 - progress, 3);
    writeScrollX(motion.fromX + (motion.toX - motion.fromX) * eased);
    viewport.scrollTop = motion.fromY + (motion.toY - motion.fromY) * eased;
    requestProjection('motion');
    if (progress < 1) {
      motionFrame.request('motion');
      return;
    }
    var completed = motion;
    motion = null;
    snapSettling = false;
    idleSuppressUntil = now() + 32;
    requestProjection('motion-end');
    if (completed.snapIndex !== null && completed.snapIndex !== undefined) emitSnapSettle(completed.snapIndex, completed.reason || 'snap-motion');
    emitScrollEnd(completed.reason || 'motion-end');
  });
  scope.add(function () { motionFrame.dispose(); });
    
  var snapStepFrame = Scheduler.createFrameScheduler(function (timestamp) {
    if (!snapStepMotion || destroyed) return;
    var elapsed = Math.max(8, Math.min(40, timestamp - snapStepMotion.lastFrameAt));
    snapStepMotion.lastFrameAt = timestamp;
    var settled = advanceSnapStepMotion(snapStepMotion, elapsed);
    if (settled) {
      if (snapStepMotion.finalizing) completeSnapStepMotion();
      return;
    }
    snapStepFrame.request('wheel-step-follow');
  });
  scope.add(function () { snapStepFrame.dispose(); });
    
  function clearSnapStepGestureTimer() { snapStepGestureDelay.cancel(); }
    
  function cancelSnapStepSequence() {
    clearSnapStepGestureTimer();
    snapStepGesture = null;
    snapStepMotion = null;
    snapStepFrame.cancel();
    snapSettling = false;
  }
    
  function snapPointAt(index, axis) {
    var targets = getSnapTargets();
    if (!targets.length || index < 0 || index >= targets.length) return null;
    var resolvedAxis = axis || resolveSnapAxis();
    var target = targetScrollForElement(targets[index], resolvedAxis, opts.snapAlign, 0);
    return {
      index: index,
      element: targets[index],
      axis: resolvedAxis,
      x: resolvedAxis === 'x' ? target : readScrollX(),
      y: resolvedAxis === 'y' ? target : Number(viewport.scrollTop) || 0
    };
  }
    
  function advanceSnapStepMotion(activeMotion, elapsed) {
    if (!activeMotion || snapStepMotion !== activeMotion || destroyed) return true;
    var currentX = readScrollX();
    var currentY = Number(viewport.scrollTop) || 0;
    var dx = activeMotion.targetX - currentX;
    var dy = activeMotion.targetY - currentY;
    var distance = activeMotion.axis === 'x' ? Math.abs(dx) : Math.abs(dy);
    if (!motionEnabled() || opts.snapBehavior !== 'smooth' || Math.max(0, Number(opts.snapDuration) || 0) <= 0 || distance <= 1.05) {
      writeScrollX(activeMotion.targetX);
      viewport.scrollTop = activeMotion.targetY;
      requestProjection('wheel-step-follow');
      return true;
    }
    var responseBase = Math.max(0, Number(opts.snapDuration) || 0) || 180;
    var response = Math.max(30, Math.min(72, responseBase * 0.18));
    var progress = Math.max(0.08, Math.min(0.72, 1 - Math.exp(-Math.max(1, elapsed) / response)));
    var nextX = currentX + dx * progress;
    var nextY = currentY + dy * progress;
    if (Math.abs(activeMotion.targetX - nextX) <= 1.05 || (Math.abs(nextX - currentX) < 0.5 && Math.abs(dx) <= 2)) nextX = activeMotion.targetX;
    if (Math.abs(activeMotion.targetY - nextY) <= 1.05 || (Math.abs(nextY - currentY) < 0.5 && Math.abs(dy) <= 2)) nextY = activeMotion.targetY;
    writeScrollX(nextX);
    viewport.scrollTop = nextY;
    requestProjection('wheel-step-follow');
    return Math.abs(activeMotion.targetX - nextX) <= 1.05 && Math.abs(activeMotion.targetY - nextY) <= 1.05;
  }
    
  function retargetSnapStepMotion(point) {
    if (!point) return;
    if (!snapStepMotion) {
      snapStepMotion = {
        targetIndex: point.index,
        targetX: point.x,
        targetY: point.y,
        axis: point.axis,
        finalizing: false,
        lastFrameAt: now()
      };
      snapSettling = true;
    } else {
      snapStepMotion.targetIndex = point.index;
      snapStepMotion.targetX = point.x;
      snapStepMotion.targetY = point.y;
      snapStepMotion.axis = point.axis;
      snapStepMotion.finalizing = false;
    }
    var settled = advanceSnapStepMotion(snapStepMotion, 16);
    if (!settled) snapStepFrame.request('wheel-step-follow');
  }
    
  function completeSnapStepMotion() {
    var completed = snapStepMotion;
    if (!completed) return;
    snapStepMotion = null;
    snapStepFrame.cancel();
    writeScrollX(completed.targetX);
    viewport.scrollTop = completed.targetY;
    snapSettling = false;
    idleSuppressUntil = now() + 96;
    updateProjection('wheel-step-settle', false);
    emitSnapSettle(completed.targetIndex, 'wheel-step');
    emitScrollEnd('wheel-step');
  }
    
  function finishSnapStepGesture() {
    clearSnapStepGestureTimer();
    var gesture = snapStepGesture;
    snapStepGesture = null;
    if (!gesture) return;
    var point = snapPointAt(gesture.targetIndex, gesture.axis);
    if (!point) { cancelSnapStepSequence(); emitScrollEnd('wheel-step'); return; }
    if (!snapStepMotion) {
      snapStepMotion = { targetIndex: point.index, targetX: point.x, targetY: point.y, axis: point.axis, finalizing: true, lastFrameAt: now() };
    } else {
      snapStepMotion.targetIndex = point.index;
      snapStepMotion.targetX = point.x;
      snapStepMotion.targetY = point.y;
      snapStepMotion.axis = point.axis;
      snapStepMotion.finalizing = true;
    }
    var settled = advanceSnapStepMotion(snapStepMotion, 16);
    if (settled) completeSnapStepMotion();
    else snapStepFrame.request('wheel-step-finalize');
  }
    
  function scheduleSnapStepGestureEnd() {
    clearSnapStepGestureTimer();
    var delay = Math.max(40, Number(opts.scrollIdleDelay) || 100);
    snapStepGestureDelay.request(delay, 'wheel-step-gesture-end');
  }
    
  function cancelMotion() {
    if (!motion) return false;
    motion = null;
    snapSettling = false;
    motionFrame.cancel();
    return true;
  }
    
  function setScrollPosition(left, top, behavior, reason, snapIndex) {
    if (destroyed) return false;
    cancelSnapStepSequence();
    var nextLeft = axisEnabled('x', opts.axis) && left !== undefined ? Number(left) : readScrollX();
    var nextTop = axisEnabled('y', opts.axis) && top !== undefined ? Number(top) : Number(viewport.scrollTop) || 0;
    if (!Number.isFinite(nextLeft)) nextLeft = readScrollX();
    if (!Number.isFinite(nextTop)) nextTop = Number(viewport.scrollTop) || 0;
    cancelMotion();
    if (behavior === 'smooth' && motionEnabled() && Math.max(0, Number(opts.snapDuration) || 0) > 0) {
      emitScrollStart(reason || 'programmatic');
      snapSettling = snapIndex !== null && snapIndex !== undefined;
      motion = {
        fromX: readScrollX(),
        fromY: Number(viewport.scrollTop) || 0,
        toX: nextLeft,
        toY: nextTop,
        startedAt: now(),
        duration: Math.max(0, Number(opts.snapDuration) || 0),
        reason: reason || 'programmatic',
        snapIndex: snapIndex === undefined ? null : snapIndex
      };
      motionFrame.request('motion');
      return true;
    }
    writeScrollX(nextLeft);
    viewport.scrollTop = nextTop;
    requestProjection(reason || 'programmatic');
    if (snapIndex !== null && snapIndex !== undefined) { idleSuppressUntil = now() + 32; emitSnapSettle(snapIndex, reason || 'snap'); emitScrollEnd(reason || 'snap'); }
    return true;
  }
    
  function scrollTo(local) {
    var settings = normalizeScrollOptions(local, 'scrollTo');
    return setScrollPosition(settings.x, settings.y, settings.behavior, 'programmatic');
  }
    
  function scrollBy(local) {
    var settings = normalizeScrollOptions(local, 'scrollBy');
    var x = readScrollX();
    var y = Number(viewport.scrollTop) || 0;
    return setScrollPosition(x + (Number(settings.x) || 0), y + (Number(settings.y) || 0), settings.behavior, 'programmatic');
  }
    
  function scrollToElement(element, local) {
    var settings = normalizeScrollOptions(local, 'scrollToElement');
    var axis = normalizeEnum(settings.axis, WHEEL_AXES, 'auto', 'scrollToElement axis');
    if (axis === 'auto') axis = opts.axis === 'x' ? 'x' : 'y';
    var align = normalizeEnum(settings.align, SNAP_ALIGNS, 'nearest', 'scrollToElement align');
    var target = targetScrollForElement(element, axis, align, settings.offset);
    if (axis === 'x') return setScrollPosition(target, undefined, settings.behavior, 'programmatic');
    return setScrollPosition(undefined, target, settings.behavior, 'programmatic');
  }
    
  function goToSnap(index, local) {
    var targets = getSnapTargets();
    var numeric = Math.floor(Number(index));
    if (!Number.isFinite(numeric) || numeric < 0 || numeric >= targets.length) return false;
    var settings = Object.assign({}, normalizeScrollOptions(local, 'goToSnap'), {
      axis: resolveSnapAxis(),
      align: opts.snapAlign
    });
    var target = targetScrollForElement(targets[numeric], settings.axis, settings.align, settings.offset);
    var behavior = settings.behavior || opts.snapBehavior;
    if (settings.axis === 'x') return setScrollPosition(target, undefined, behavior, settings.reason || 'snap', numeric);
    return setScrollPosition(undefined, target, behavior, settings.reason || 'snap', numeric);
  }
    
  function getCurrentSnap() {
    return computeCurrentSnap(getMetrics());
  }
    
  function settleSnap(local) {
    if (destroyed) return -1;
    var settings = local && typeof local === 'object' ? local : { reason: local };
    var targets = getSnapTargets();
    if (!targets.length) return -1;
    var index = -1;
    if (snapStepGesture && Number.isInteger(snapStepGesture.targetIndex)) index = snapStepGesture.targetIndex;
    else if (snapStepMotion && Number.isInteger(snapStepMotion.targetIndex)) index = snapStepMotion.targetIndex;
    else if (motion && motion.snapIndex !== null && motion.snapIndex !== undefined) index = Number(motion.snapIndex);
    else index = getCurrentSnap();
    if (!Number.isInteger(index) || index < 0 || index >= targets.length) return -1;
    
    clearScrollIdleTimer();
    clearSnapStepGestureTimer();
    snapStepGesture = null;
    snapStepMotion = null;
    snapStepFrame.cancel();
    motion = null;
    motionFrame.cancel();
    snapSettling = false;
    
    var point = snapPointAt(index, resolveSnapAxis());
    if (!point) return -1;
    writeScrollX(point.x);
    viewport.scrollTop = point.y;
    idleSuppressUntil = now() + 96;
    updateProjection('snap-settle-now', false);
    emitSnapSettle(index, settings.reason || 'snap-settle-now');
    emitScrollEnd(settings.reason || 'snap-settle-now');
    return index;
  }
    
  function nextSnap(local) {
    var targets = getSnapTargets();
    if (!targets.length) return false;
    return goToSnap(Math.min(targets.length - 1, Math.max(0, getCurrentSnap() + 1)), local);
  }
    
  function prevSnap(local) {
    var targets = getSnapTargets();
    if (!targets.length) return false;
    var current = getCurrentSnap();
    return goToSnap(Math.max(0, current < 0 ? 0 : current - 1), local);
  }
    
  function userInteractionBlocked() {
    return InteractionPolicy.mutationLocked(opts);
  }
    
  function wheelDelta(event) {
    var wheelAxis = opts.wheelAxis;
    if (wheelAxis === 'auto') {
      if (opts.axis === 'x') wheelAxis = 'x';
      else if (opts.axis === 'y') wheelAxis = 'y';
      else wheelAxis = Math.abs(Number(event.deltaX) || 0) > Math.abs(Number(event.deltaY) || 0) ? 'x' : 'y';
    }
    var value = wheelAxis === 'x'
      ? ((Number(event.deltaX) || 0) || (Number(event.deltaY) || 0))
      : ((Number(event.deltaY) || 0) || (Number(event.deltaX) || 0));
    return { axis: wheelAxis, value: value };
  }
    
  function canConsumeWheel(axis, delta, metrics) {
    if (!delta) return false;
    if (axis === 'x') {
      if (!metrics.canScrollX) return false;
      return delta < 0 ? metrics.x > EPSILON : metrics.x < metrics.maxX - EPSILON;
    }
    if (!metrics.canScrollY) return false;
    return delta < 0 ? metrics.y > EPSILON : metrics.y < metrics.maxY - EPSILON;
  }
    
  function onWheel(event) {
    if (destroyed) return;
    if (userInteractionBlocked()) return;
    var routed = wheelDelta(event);
    if (!axisEnabled(routed.axis, opts.axis)) return;
    
    if (opts.wheelBehavior === 'snap-step' && getSnapTargets().length) {
      var direction = routed.value < 0 ? -1 : (routed.value > 0 ? 1 : 0);
      if (!direction) return;
      var targets = getSnapTargets();
      var current = snapStepGesture ? snapStepGesture.targetIndex : (snapStepMotion ? snapStepMotion.targetIndex : getCurrentSnap());
      if (current < 0) current = direction > 0 ? 0 : targets.length - 1;
      var rawNext = current + direction;
      var next = opts.snapLoop === true ? (rawNext + targets.length) % targets.length : Math.max(0, Math.min(targets.length - 1, rawNext));
      if (next === current) {
        if (opts.wheelPropagation === false) { event.preventDefault(); event.stopPropagation(); }
        scheduleSnapStepGestureEnd();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      activateScrollbar();
      clearScrollIdleTimer();
      cancelMotion();
      emitScrollStart('wheel-step');
      var axis = resolveSnapAxis();
      if (!snapStepGesture) snapStepGesture = { startIndex: current, targetIndex: current, axis: axis, count: 0, lastEventAt: now() };
      snapStepGesture.targetIndex = next;
      snapStepGesture.axis = axis;
      snapStepGesture.count += 1;
      snapStepGesture.lastEventAt = now();
      retargetSnapStepMotion(snapPointAt(next, axis));
      scheduleSnapStepGestureEnd();
      return;
    }
    
    var metrics = getMetrics();
    var canConsume = canConsumeWheel(routed.axis, routed.value, metrics);
    if (!canConsume) {
      if (opts.wheelPropagation === false) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    activateScrollbar();
    cancelMotion();
    emitScrollStart('wheel');
    if (routed.axis === 'x') setScrollPosition(metrics.x + routed.value, undefined, 'auto', 'wheel');
    else setScrollPosition(undefined, metrics.y + routed.value, 'auto', 'wheel');
  }
    
  function settleNearestSnap(reason) {
    var targets = getSnapTargets();
    if (!targets.length) { emitScrollEnd(reason || 'scroll-idle'); return false; }
    var index = getCurrentSnap();
    if (index < 0) { emitScrollEnd(reason || 'scroll-idle'); return false; }
    snapSettling = true;
    return goToSnap(index, { behavior: opts.snapBehavior, reason: reason || 'scroll-idle-snap' });
  }
    
  function scheduleScrollIdle(reason) {
    if (snapSettling || motion || now() < idleSuppressUntil) return;
    clearScrollIdleTimer();
    var delay = Math.max(0, Number(opts.scrollIdleDelay) || 0);
    scrollIdleDelay.request(delay, reason || 'scroll-idle');
  }
    
  function onKeyDown(event) {
    if (destroyed || opts.keyboard === false || userInteractionBlocked()) return;
    var target = event.target;
    if (target && target !== root && target.closest && target.closest('input,textarea,select,button,[contenteditable="true"]')) return;
    var metrics = getMetrics();
    var x = metrics.x;
    var y = metrics.y;
    var handled = true;
    var pageY = Math.max(1, Number(viewport.clientHeight) || 1) * 0.9;
    var pageX = Math.max(1, Number(viewport.clientWidth) || 1) * 0.9;
    switch (event.key) {
      case 'ArrowDown': if (!axisEnabled('y', opts.axis)) handled = false; else y += 40; break;
      case 'ArrowUp': if (!axisEnabled('y', opts.axis)) handled = false; else y -= 40; break;
      case 'ArrowRight': if (!axisEnabled('x', opts.axis)) handled = false; else x += 40; break;
      case 'ArrowLeft': if (!axisEnabled('x', opts.axis)) handled = false; else x -= 40; break;
      case 'PageDown': if (!axisEnabled('y', opts.axis)) handled = false; else y += pageY; break;
      case 'PageUp': if (!axisEnabled('y', opts.axis)) handled = false; else y -= pageY; break;
      case 'Home': if (opts.axis === 'x') x = 0; else y = 0; break;
      case 'End': if (opts.axis === 'x') x = metrics.maxX; else y = metrics.maxY; break;
      case ' ': if (!axisEnabled('y', opts.axis)) handled = false; else y += event.shiftKey ? -pageY : pageY; break;
      default: handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    activateScrollbar();
    setScrollPosition(x, y, 'auto', 'keyboard');
  }
    
  function createThumbDragSession(axis, thumb) {
    var horizontal = axis === 'x';
    var startPointer = 0, startScroll = 0, max = 0, travel = 1;
    return PointerSession.create({
      target: thumb,
      document: doc,
      axis: horizontal ? 'x' : 'y',
      threshold: 0,
      getState: function () { return { disabled: destroyed || userInteractionBlocked() || opts.scrollbarInteractive === false }; },
      canStart: function (detail) {
        if (destroyed || userInteractionBlocked() || opts.scrollbarInteractive === false) return false;
        var event = detail.originalEvent;
        if (event && event.preventDefault) event.preventDefault();
        if (event && event.stopPropagation) event.stopPropagation();
        return true;
      },
      onStart: function (detail) {
        activateScrollbar();
        var metrics = getMetrics();
        var track = horizontal ? trackX : trackY;
        startPointer = Number(horizontal ? detail.x : detail.y) || 0;
        startScroll = horizontal ? metrics.x : metrics.y;
        max = horizontal ? metrics.maxX : metrics.maxY;
        var trackSize = Number(horizontal ? track.clientWidth : track.clientHeight) || 0;
        var thumbSize = Number(horizontal ? thumb.offsetWidth : thumb.offsetHeight) || 0;
        travel = Math.max(1, trackSize - thumbSize);
      },
      onMove: function (detail) {
        var currentPointer = Number(horizontal ? detail.x : detail.y) || 0;
        var next = startScroll + (currentPointer - startPointer) * max / travel;
        if (horizontal) setScrollPosition(next, undefined, 'auto', 'thumb');
        else setScrollPosition(undefined, next, 'auto', 'thumb');
      },
      onEnd: function () { scheduleScrollbarHide(); },
      onCancel: function () { scheduleScrollbarHide(); }
    });
  }
    
  function onTrackPointerDown(axis, event) {
    if (destroyed || userInteractionBlocked() || opts.scrollbarInteractive === false) return;
    var thumb = axis === 'x' ? thumbX : thumbY;
    if (event.target === thumb || (thumb.contains && thumb.contains(event.target))) return;
    event.preventDefault();
    activateScrollbar();
    var track = axis === 'x' ? trackX : trackY;
    var trackSize = Number(axis === 'x' ? track.clientWidth : track.clientHeight) || 0;
    var pointer = axis === 'x' ? Number(event.offsetX) || 0 : Number(event.offsetY) || 0;
    var metrics = getMetrics();
    var max = axis === 'x' ? metrics.maxX : metrics.maxY;
    var target = trackSize > 0 ? max * pointer / trackSize : 0;
    if (axis === 'x') setScrollPosition(target, undefined, 'auto', 'track');
    else setScrollPosition(undefined, target, 'auto', 'track');
  }
    
  function showScrollbar() {
    manualScrollbarVisibility = true;
    clearHideTimer();
    setInteractionClass(true);
    applyRootOptions();
    updateProjection('scrollbar-show', false);
    return api;
  }
    
  function hideScrollbar() {
    manualScrollbarVisibility = false;
    clearHideTimer();
    setInteractionClass(false);
    applyRootOptions();
    updateProjection('scrollbar-hide', false);
    return api;
  }
    
  function resetScrollbarVisibility() {
    manualScrollbarVisibility = null;
    applyRootOptions();
    if (opts.scrollbarVisibility === 'auto') scheduleScrollbarHide();
    updateProjection('scrollbar-reset', false);
    return api;
  }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    validateContractOptions(ComponentContracts.get('Scroll'), nextOptions || {}, 'Scroll');
    var next = nextOptions || {};
    STRUCTURAL_OPTIONS.forEach(function (key) {
      if (!own(next, key)) return;
      var current = key === 'container' ? mountContainer : (key === 'document' ? doc : opts[key]);
      if (next[key] !== current) {
        throw new Error('[QXFRAME9A7C2] Scroll ' + key + ' is immutable; destroy and recreate to change it.');
      }
    });
    var candidate = Object.assign({}, opts, next);
    candidate.axis = normalizeEnum(candidate.axis, AXES, 'y', 'axis');
    candidate.wheelAxis = normalizeEnum(candidate.wheelAxis, WHEEL_AXES, 'auto', 'wheelAxis');
    candidate.scrollbarVisibility = normalizeEnum(candidate.scrollbarVisibility, VISIBILITIES, 'auto', 'scrollbarVisibility');
    candidate.snapAxis = normalizeEnum(candidate.snapAxis, WHEEL_AXES, 'auto', 'snapAxis');
    candidate.snapAlign = normalizeEnum(candidate.snapAlign, SNAP_ALIGNS, 'nearest', 'snapAlign');
    candidate.wheelBehavior = normalizeEnum(candidate.wheelBehavior, WHEEL_BEHAVIORS, 'pixel', 'wheelBehavior');
    candidate.snapBehavior = normalizeEnum(candidate.snapBehavior, SNAP_BEHAVIORS, 'auto', 'snapBehavior');
    if (typeof candidate.snapLoop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Scroll snapLoop must be boolean.');
    if (typeof candidate.focusable !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Scroll focusable must be boolean.');
    candidate.scrollbarHideDelay = Number(candidate.scrollbarHideDelay);
    if (!Number.isFinite(candidate.scrollbarHideDelay) || candidate.scrollbarHideDelay < 0) throw new TypeError('[QXFRAME9A7C2] Scroll scrollbarHideDelay must be a non-negative finite millisecond value.');
    assertAxisCompatibility(candidate.axis, candidate.wheelAxis, candidate.snapAxis);
    var preservedX = getMetrics().x;
    var hideDelayChanged = candidate.scrollbarHideDelay !== opts.scrollbarHideDelay;
    var hadPendingScrollbarHide = scrollbarHideDelay.pending;
    opts = candidate;
    // Option changes can alter observable state (for example axis) before the
    // scheduled geometry projection runs. Invalidate the cached snapshot so
    // an immediate getState() observes the canonical options, not stale state.
    lastScrollState = null;
    applyRootOptions();
    if (opts.scrollbarVisibility !== 'auto' || manualScrollbarVisibility !== null) clearHideTimer();
    else if (hideDelayChanged && hadPendingScrollbarHide) scheduleScrollbarHide();
    writeScrollX(preservedX);
    requestProjection('options');
    if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
    return api;
  }
    
  function finishActiveMotionForReducedMotion() {
    if (destroyed || motionEnabled()) return;
    if (motion) {
      var completed = motion;
      motion = null;
      motionFrame.cancel();
      writeScrollX(completed.toX);
      viewport.scrollTop = completed.toY;
      snapSettling = false;
      idleSuppressUntil = now() + 32;
      updateProjection('reduced-motion', false);
      if (completed.snapIndex !== null && completed.snapIndex !== undefined) emitSnapSettle(completed.snapIndex, completed.reason || 'snap-motion');
      emitScrollEnd(completed.reason || 'motion-end');
    }
    if (snapStepMotion) {
      var settled = advanceSnapStepMotion(snapStepMotion, 16);
      if (settled && snapStepMotion && snapStepMotion.finalizing) completeSnapStepMotion();
      else if (settled) snapStepFrame.cancel();
    }
    requestProjection('reduced-motion');
  }
    
  function refresh(reason) {
    if (destroyed) return null;
    var state = updateProjection(reason || 'refresh', false);
    emitter.emit('refresh', { state: state, reason: reason || 'refresh', controller: api });
    return state;
  }
    
  function getState() {
    return lastScrollState || updateProjection('state', false);
  }
    
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    clearHideTimer();
    clearScrollIdleTimer();
    cancelSnapStepSequence();
    cancelMotion();
    if (scope) scope.dispose();
    emitter.dispose();
    if (domBinding && domBinding.source !== 'external' && mountContainer && content) {
      Array.prototype.slice.call(content.childNodes).forEach(function (node) {
        mountContainer.insertBefore(node, root);
      });
    }
    if (domBinding) domBinding.release();
    domBinding = null;
    root = viewport = content = trackX = trackY = thumbX = thumbY = null;
    shadowTop = shadowBottom = shadowLeft = shadowRight = null;
    return true;
  }
    
  api = Object.freeze({
    scrollTo: scrollTo,
    scrollBy: scrollBy,
    scrollToElement: scrollToElement,
    goToSnap: goToSnap,
    nextSnap: nextSnap,
    prevSnap: prevSnap,
    getCurrentSnap: getCurrentSnap,
    settleSnap: settleSnap,
    showScrollbar: showScrollbar,
    hideScrollbar: hideScrollbar,
    resetScrollbarVisibility: resetScrollbarVisibility,
    refresh: refresh,
    updateOptions: updateOptions,
    setDisabled: function (value) { return updateOptions({ disabled: value === true }); },
    setReadOnly: function (value) { return updateOptions({ readOnly: value === true }); },
    setFocusable: function (value) { return updateOptions({ focusable: value !== false }); },
    focus: function () { if (!destroyed && opts.disabled !== true && opts.focusable !== false && root && Utils.isFunction(root.focus)) { DOM.focusElement(root); } return api; },
    getState: getState,
    getRootElement: function () { return root; },
    getViewportElement: function () { return viewport; },
    getContentElement: function () { return content; },
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  });
    
  scope.add(DOM.listen(viewport, 'scroll', function () {
    requestProjection('scroll');
    if (!snapSettling && !motion && now() >= idleSuppressUntil) {
      emitScrollStart('scroll');
      scheduleScrollIdle('scroll-idle');
    }
  }, { passive: true }));
  scope.add(DOM.listen(root, 'wheel', onWheel, { passive: false }));
  scope.add(DOM.listen(root, 'keydown', onKeyDown));
  scope.add(DOM.listen(root, 'pointerleave', function () { scheduleScrollbarHide(); }));
  scope.add(DOM.listen(root, 'focusout', function (event) {
    if (!root.contains(event.relatedTarget)) scheduleScrollbarHide();
  }));
  thumbXSession = createThumbDragSession('x', thumbX);
  thumbYSession = createThumbDragSession('y', thumbY);
  scope.add(function () { if (thumbXSession) thumbXSession.destroy(); thumbXSession = null; if (thumbYSession) thumbYSession.destroy(); thumbYSession = null; });
  scope.add(DOM.listen(trackX, 'pointerenter', holdScrollbarVisible));
  scope.add(DOM.listen(trackY, 'pointerenter', holdScrollbarVisible));
  scope.add(DOM.listen(trackX, 'pointerleave', function () { scheduleScrollbarHide(); }));
  scope.add(DOM.listen(trackY, 'pointerleave', function () { scheduleScrollbarHide(); }));
  scope.add(DOM.listen(trackX, 'pointerdown', function (event) { onTrackPointerDown('x', event); }));
  scope.add(DOM.listen(trackY, 'pointerdown', function (event) { onTrackPointerDown('y', event); }));
  scope.add(Config.onMotionChange(function () { finishActiveMotionForReducedMotion(); }));
    
  var resizeObserver = ObserverHub.resize([viewport, content], function () { requestProjection('resize'); });
  scope.add(function () { if (resizeObserver) resizeObserver(); });
    
  applyRootOptions();
  refresh('mount');
  return api;
}
    

export const Scroll = Object.freeze({ create, attachViewport, createDefaultDOM: DOMFactory.createDefaultDOM });
