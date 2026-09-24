
import { Utils } from '../utils/utils.js';
import { MotionController } from './motionController.js';
import { Scheduler } from './scheduler.js';
import { Config } from './config.js';

const global = globalThis;

var LEGACY_OPTIONS = Object.freeze(['motion', 'target', 'el']);

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function isFunction(value) { return typeof value === 'function'; }
function noop() {}
function viewOfElement(element) { var doc = element && element.ownerDocument; return doc && doc.defaultView || global; }
function isElement(value) { return !!(value && value.nodeType === 1 && value.style && value.classList); }
function keyId(key) {
  var type = typeof key;
  if (type !== 'string' && type !== 'number') throw new TypeError('[QXFRAME9A7C2] TransitionGroup child key must be a string or number.');
  if (type === 'number' && !Number.isFinite(key)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup numeric child key must be finite.');
  return type + ':' + String(key);
}
function rejectLegacy(settings) {
  LEGACY_OPTIONS.forEach(function (key) {
    if (own(settings, key)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup does not accept legacy/internal option "' + key + '".');
  });
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
function cssName(key) {
  if (key.indexOf('--') === 0) return key;
  return key.replace(/[A-Z]/g, function (letter) { return '-' + letter.toLowerCase(); });
}
function setStyle(style, key, value, priority) {
  var name = cssName(key);
  style.setProperty(name, value == null ? '' : String(value), priority || '');
}
function inlineStyle(style, key) {
  var name = cssName(key);
  return { value: style.getPropertyValue(name), priority: style.getPropertyPriority(name) };
}
function normalizePatch(value) {
  if (!value) return Object.freeze({ className: Object.freeze([]), style: null });
  if (typeof value === 'string' || Array.isArray(value)) {
    return Object.freeze({ className: Object.freeze(classList(value)), style: null });
  }
  if (typeof value !== 'object') throw new TypeError('[QXFRAME9A7C2] TransitionGroup move patch must be a class name, array, or object.');
  var style = null;
  if (value.style !== undefined && value.style !== null) {
    if (typeof value.style !== 'object' || Array.isArray(value.style)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup move style must be an object.');
    style = {};
    Object.keys(value.style).forEach(function (key) {
      if (cssName(key) === 'transform') throw new TypeError('[QXFRAME9A7C2] TransitionGroup move patch cannot own transform; FLIP geometry owns that transient property.');
      style[key] = value.style[key];
    });
  }
  return Object.freeze({
    className: Object.freeze(classList(value.className || value.class || value.classes)),
    style: style && Object.freeze(style)
  });
}
function normalizeMove(source, context) {
  var value = isFunction(source) ? source(context) : source;
  if (value === false || value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || Array.isArray(value)) return normalizePatch(value);
  if (typeof value !== 'object') throw new TypeError('[QXFRAME9A7C2] TransitionGroup move must be a class/patch descriptor, function, or false.');
  if (own(value, 'type') && value.type !== 'transition') {
    throw new TypeError('[QXFRAME9A7C2] TransitionGroup FLIP move supports CSS transition completion only.');
  }
  return normalizePatch(own(value, 'active') ? value.active : value);
}
function applyPatch(element, patch) {
  if (!patch) return noop;
  var classes = patch.className ? patch.className.slice() : [];
  var saved = Object.create(null);
  classes.forEach(function (name) { element.classList.add(name); });
  if (patch.style) Object.keys(patch.style).forEach(function (key) {
    saved[key] = inlineStyle(element.style, key);
    setStyle(element.style, key, patch.style[key], '');
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
function freezeArray(values) { return Object.freeze(values.slice()); }
function rectOf(element) {
  var rect = element.getBoundingClientRect();
  return { left: Number(rect.left) || 0, top: Number(rect.top) || 0 };
}
function changed(before, after) {
  return Math.abs(before.left - after.left) > 0.25 || Math.abs(before.top - after.top) > 0.25;
}
function prefReduced(settings) {
  var value = isFunction(settings.reducedMotion) ? settings.reducedMotion() : settings.reducedMotion;
  if (value === true) return true;
  if (value === false) return false;
  var disabled = isFunction(settings.disabled) ? settings.disabled() : settings.disabled;
  if (disabled === true) return true;
  return Config.prefersReducedMotion();
}
function normalizeLeaveLayout(value) {
  if (value === undefined || value === null || value === false || value === '' || value === 'flow') return 'flow';
  if (value === true || value === 'absolute' || value === 'pop') return 'absolute';
  throw new TypeError('[QXFRAME9A7C2] TransitionGroup leaveLayout must be \"flow\", \"absolute\", boolean, or a resolver function.');
}

function normalizeEntries(entries, container, records) {
  if (!Array.isArray(entries)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup.sync(entries) requires an array.');
  var ids = Object.create(null);
  var elements = [];
  return entries.map(function (entry, index) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup entry must be { key, element }.');
    if (!own(entry, 'key') || !own(entry, 'element')) throw new TypeError('[QXFRAME9A7C2] TransitionGroup entry requires key and element.');
    var id = keyId(entry.key);
    if (ids[id]) throw new TypeError('[QXFRAME9A7C2] TransitionGroup child keys must be unique.');
    ids[id] = true;
    if (!isElement(entry.element)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup entry.element must be a DOM Element.');
    if (elements.indexOf(entry.element) >= 0) throw new TypeError('[QXFRAME9A7C2] TransitionGroup cannot bind one element to multiple keys.');
    elements.push(entry.element);
    if (entry.element.parentNode && entry.element.parentNode !== container) {
      throw new TypeError('[QXFRAME9A7C2] TransitionGroup can only manage detached elements or direct children of its container.');
    }
    var existing = records[id];
    if (existing && existing.element !== entry.element) {
      throw new TypeError('[QXFRAME9A7C2] TransitionGroup preserves element identity for an existing key.');
    }
    Object.keys(records).forEach(function (otherId) {
      if (otherId !== id && records[otherId] && records[otherId].element === entry.element) {
        throw new TypeError('[QXFRAME9A7C2] TransitionGroup preserves one key per managed element identity.');
      }
    });
    return Object.freeze({ id: id, key: entry.key, element: entry.element, index: index });
  });
}

function create(options) {
  var settings = options || {};
  if (!settings || typeof settings !== 'object' || Array.isArray(settings)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup.create(options) requires an object.');
  rejectLegacy(settings);
  if (!isElement(settings.container)) throw new TypeError('[QXFRAME9A7C2] TransitionGroup.create(options) requires container DOM Element.');
  if (!own(settings, 'transition') || !settings.transition) throw new TypeError('[QXFRAME9A7C2] TransitionGroup.create(options) requires transition.');

  var container = settings.container;
  var records = Object.create(null);
  var physicalOrder = [];
  var logicalOrder = [];
  var initialized = false;
  var destroyed = false;
  var syncGeneration = 0;
  var settleWaiters = [];
  var wasSettled = true;
  var wasAllRemoved = true;
  var api = null;

  function recordContext(record, coreContext, extra) {
    var base = {
      key: record.key,
      element: record.element,
      index: record.index,
      desired: record.desired,
      reason: coreContext && coreContext.reason || record.reason || 'sync',
      originalEvent: coreContext && coreContext.originalEvent || record.originalEvent || null,
      initial: !!(coreContext && coreContext.initial),
      status: coreContext && coreContext.status || (record.core ? record.core.getState().status : 'none'),
      step: coreContext && coreContext.step || (record.core ? record.core.getState().step : 'idle'),
      phase: record.core ? record.core.getState().phase : 'hidden',
      generation: coreContext && coreContext.generation != null ? coreContext.generation : null,
      reversal: !!(coreContext && coreContext.reversal),
      signal: coreContext && coreContext.signal || null
    };
    if (extra) Utils.copyOwn(base, extra);
    return Object.freeze(base);
  }
  function call(name, record, coreContext, extra) {
    if (isFunction(settings[name])) settings[name](recordContext(record, coreContext, extra));
  }
  function resolveTransition(record, coreContext) {
    return isFunction(settings.transition) ? settings.transition(recordContext(record, coreContext)) : settings.transition;
  }
  function resolveLeaveLayout(record) {
    var source = settings.leaveLayout;
    var value = isFunction(source) ? source(recordContext(record, null, { status: 'leave', step: 'prepare', phase: 'leaving' })) : source;
    return normalizeLeaveLayout(value);
  }
  function restoreLeaveLayout(record) {
    var snapshot = record && record.leaveLayoutSnapshot;
    if (!snapshot) return false;
    record.leaveLayoutSnapshot = null;
    Object.keys(snapshot).forEach(function (key) {
      setStyle(record.element.style, key, snapshot[key].value, snapshot[key].priority);
    });
    return true;
  }
  function popLeaveLayout(record) {
    if (!record || record.leaveLayoutSnapshot || resolveLeaveLayout(record) !== 'absolute') return false;
    if (record.element.parentNode !== container) return false;
    var containerView = viewOfElement(container);
    var computedContainer = containerView && containerView.getComputedStyle ? containerView.getComputedStyle(container) : null;
    if (computedContainer && computedContainer.position === 'static') {
      throw new Error('[QXFRAME9A7C2] TransitionGroup leaveLayout:\"absolute\" requires a positioned container (for example position:relative).');
    }
    var element = record.element;
    var keys = ['position','left','top','right','bottom','width','height','boxSizing','marginTop','marginRight','marginBottom','marginLeft'];
    var snapshot = Object.create(null);
    keys.forEach(function (key) { snapshot[key] = inlineStyle(element.style, key); });
    var left = Number(element.offsetLeft) || 0;
    var top = Number(element.offsetTop) || 0;
    var width = Number(element.offsetWidth) || 0;
    var height = Number(element.offsetHeight) || 0;
    record.leaveLayoutSnapshot = snapshot;
    setStyle(element.style, 'position', 'absolute', '');
    setStyle(element.style, 'left', left + 'px', '');
    setStyle(element.style, 'top', top + 'px', '');
    setStyle(element.style, 'right', 'auto', '');
    setStyle(element.style, 'bottom', 'auto', '');
    setStyle(element.style, 'width', width + 'px', '');
    setStyle(element.style, 'height', height + 'px', '');
    setStyle(element.style, 'boxSizing', 'border-box', '');
    setStyle(element.style, 'marginTop', '0px', '');
    setStyle(element.style, 'marginRight', '0px', '');
    setStyle(element.style, 'marginBottom', '0px', '');
    setStyle(element.style, 'marginLeft', '0px', '');
    return true;
  }
  function currentState() {
    var presentKeys = [];
    var enteringKeys = [];
    var leavingKeys = [];
    var movingKeys = [];
    var poppedKeys = [];
    physicalOrder.forEach(function (id) {
      var record = records[id];
      if (!record) return;
      presentKeys.push(record.key);
      var child = record.core && record.core.getState();
      if (child && child.phase === 'entering') enteringKeys.push(record.key);
      if (!record.desired || (child && child.phase === 'leaving')) leavingKeys.push(record.key);
      if (record.move) movingKeys.push(record.key);
      if (record.leaveLayoutSnapshot) poppedKeys.push(record.key);
    });
    return Object.freeze({
      keys: freezeArray(logicalOrder.map(function (id) { return records[id] && records[id].key; }).filter(function (key) { return key !== undefined; })),
      presentKeys: freezeArray(presentKeys),
      enteringKeys: freezeArray(enteringKeys),
      leavingKeys: freezeArray(leavingKeys),
      movingKeys: freezeArray(movingKeys),
      poppedKeys: freezeArray(poppedKeys),
      settled: enteringKeys.length === 0 && leavingKeys.length === 0 && movingKeys.length === 0,
      destroyed: destroyed
    });
  }
  function getChildState(key) {
    var record = records[keyId(key)];
    return record && record.core ? record.core.getState() : null;
  }
  function emit(reason) {
    var snapshot = currentState();
    var emissionGeneration = syncGeneration;
    var meta = Object.freeze({ reason: reason || 'sync', generation: emissionGeneration });
    var becameSettled = snapshot.settled && !wasSettled;
    var allRemoved = snapshot.keys.length === 0 && snapshot.presentKeys.length === 0;
    var becameAllRemoved = allRemoved && !wasAllRemoved;
    // Commit edge trackers before public callbacks. A callback may synchronously sync a
    // new collection; the nested emission must become the authoritative latest state and
    // must not be overwritten by this older emission when control returns.
    wasSettled = snapshot.settled;
    wasAllRemoved = allRemoved;
    if (isFunction(settings.onStateChange)) settings.onStateChange(snapshot, meta);
    if (destroyed || syncGeneration !== emissionGeneration) return;
    if (becameSettled) {
      if (isFunction(settings.onAllSettled)) settings.onAllSettled(snapshot, meta);
      // An aggregate completion callback may synchronously insert/remove children. In that
      // case keep existing whenSettled() waiters attached to the newer unsettled epoch.
      if (destroyed || syncGeneration !== emissionGeneration || !currentState().settled) return;
      var waiters = settleWaiters.slice();
      settleWaiters.length = 0;
      waiters.forEach(function (resolve) { resolve(snapshot); });
    }
    if (becameAllRemoved && isFunction(settings.onAllRemoved)) settings.onAllRemoved(snapshot, meta);
  }
  function whenSettled() {
    var snapshot = currentState();
    if (snapshot.settled || destroyed) return Promise.resolve(snapshot);
    return new Promise(function (resolve) { settleWaiters.push(resolve); });
  }
  function measure() {
    var output = Object.create(null);
    physicalOrder.forEach(function (id) {
      var record = records[id];
      if (!record || !record.element.parentNode || record.element.parentNode !== container) return;
      output[id] = rectOf(record.element);
    });
    return output;
  }
  function cancelMove(record, reason) {
    var run = record && record.move;
    if (!run) return false;
    record.move = null;
    if (run.scheduler) run.scheduler.dispose();
    if (run.cancelWait) run.cancelWait();
    if (run.cleanupActive) run.cleanupActive();
    setStyle(record.element.style, 'transform', run.savedTransform.value, run.savedTransform.priority);
    if (reason && isFunction(settings.onInterrupt)) call('onInterrupt', record, null, { kind: 'move', from: run.from, to: run.to, completion: 'cancelled', interruptReason: reason });
    return true;
  }
  function cancelAllMoves(reason, expectedGeneration) {
    var ids = physicalOrder.slice();
    for (var index = 0; index < ids.length; index += 1) {
      if (records[ids[index]]) cancelMove(records[ids[index]], reason);
      if (expectedGeneration != null && (destroyed || syncGeneration !== expectedGeneration)) return false;
    }
    return true;
  }
  function finishMove(record, token, reason) {
    var run = record.move;
    if (!run || run.token !== token) return false;
    record.move = null;
    if (run.scheduler) run.scheduler.dispose();
    if (run.cleanupActive) run.cleanupActive();
    setStyle(record.element.style, 'transform', run.savedTransform.value, run.savedTransform.priority);
    var emissionGeneration = syncGeneration;
    call('onAfterMove', record, null, { completion: reason || 'instant' });
    if (destroyed || syncGeneration !== emissionGeneration) return true;
    emit('move-end');
    return true;
  }
  function startMove(record, before, after, meta, expectedGeneration) {
    if (!record || !record.desired || !record.core || record.core.getState().phase !== 'shown' || !changed(before, after)) return false;
    if (expectedGeneration != null && (destroyed || syncGeneration !== expectedGeneration)) return false;
    var context = recordContext(record, null, { reason: meta && meta.reason || 'layout', from: before, to: after });
    var patch = normalizeMove(settings.move, context);
    if (!patch) return false;
    cancelMove(record, 'retarget');
    if (expectedGeneration != null && (destroyed || syncGeneration !== expectedGeneration)) return false;
    var dx = before.left - after.left;
    var dy = before.top - after.top;
    var immediate = !!(meta && meta.immediate === true);
    var reduced = prefReduced(settings);
    if (immediate || reduced) {
      var completion = immediate ? 'immediate' : 'reduced-motion';
      call('onBeforeMove', record, null, { from: before, to: after, deltaX: dx, deltaY: dy, reducedMotion: reduced, immediate: immediate });
      if (destroyed || (expectedGeneration != null && syncGeneration !== expectedGeneration)) return false;
      call('onAfterMove', record, null, { from: before, to: after, deltaX: dx, deltaY: dy, reducedMotion: reduced, immediate: immediate, completion: completion });
      return false;
    }
    var element = record.element;
    var elementView = viewOfElement(element);
    var computed = elementView && elementView.getComputedStyle ? elementView.getComputedStyle(element) : null;
    var baseTransform = computed && computed.transform && computed.transform !== 'none' ? computed.transform : 'none';
    var savedTransform = inlineStyle(element.style, 'transform');
    var savedTransition = inlineStyle(element.style, 'transition');
    var token = ++record.moveGeneration;
    setStyle(element.style, 'transition', 'none', '');
    setStyle(element.style, 'transform', 'translate3d(' + dx + 'px,' + dy + 'px,0)' + (baseTransform === 'none' ? '' : ' ' + baseTransform), '');
    void element.offsetWidth;
    setStyle(element.style, 'transition', savedTransition.value, savedTransition.priority);
    var cleanupActive = applyPatch(element, patch);
    void element.offsetWidth;
    var run = record.move = {
      token: token,
      from: before,
      to: after,
      savedTransform: savedTransform,
      cleanupActive: cleanupActive,
      scheduler: null,
      cancelWait: noop,
      syncGeneration: expectedGeneration == null ? syncGeneration : expectedGeneration
    };
    call('onBeforeMove', record, null, { from: before, to: after, deltaX: dx, deltaY: dy });
    // onBeforeMove may synchronously retarget/destroy the group. If that happened,
    // cancelMove already retired this run; do not create a stale scheduler afterwards.
    if (destroyed || record.move !== run || syncGeneration !== run.syncGeneration) return false;
    run.scheduler = Scheduler.createFrameScheduler(function () {
      if (!record.move || record.move.token !== token || destroyed || syncGeneration !== run.syncGeneration) return;
      setStyle(element.style, 'transform', baseTransform, '');
      run.cancelWait = MotionController.waitMotionEnd(element, 'transition', {
        immediate: prefReduced(settings),
        deadlinePadding: settings.deadlinePadding,
        properties: ['transform']
      }, function (completion) { finishMove(record, token, completion); });
    });
    run.scheduler.request('transition-group-move');
    return true;
  }
  function startMoves(before, after, meta, expectedGeneration) {
    var ids = Object.keys(before);
    for (var index = 0; index < ids.length; index += 1) {
      var id = ids[index];
      if (after[id] && records[id]) startMove(records[id], before[id], after[id], meta, expectedGeneration);
      if (expectedGeneration != null && (destroyed || syncGeneration !== expectedGeneration)) return false;
    }
    return true;
  }
  function removeRecord(record) {
    if (!record || record.desired || destroyed) return;
    var runGeneration = syncGeneration;
    var before = measure();
    if (!cancelAllMoves('leave-collapse', runGeneration) || destroyed || syncGeneration !== runGeneration || record.desired) return;
    if (record.element.parentNode === container) container.removeChild(record.element);
    restoreLeaveLayout(record);
    delete records[record.id];
    physicalOrder = physicalOrder.filter(function (id) { return id !== record.id; });
    var after = measure();
    if (!startMoves(before, after, { reason: 'leave-collapse' }, runGeneration) || destroyed || syncGeneration !== runGeneration) return;
    call('onAfterLeave', record, record.lastLeaveContext, { removed: true });
    if (destroyed || syncGeneration !== runGeneration) return;
    emit('leave-end');
  }
  function makeRecord(entry, initialBatch, meta) {
    var record = {
      id: entry.id,
      key: entry.key,
      element: entry.element,
      index: entry.index,
      desired: true,
      reason: meta && meta.reason || 'sync',
      originalEvent: meta && meta.originalEvent || null,
      core: null,
      lastLeaveContext: null,
      move: null,
      moveGeneration: 0,
      leaveLayoutSnapshot: null,
      initialBatch: initialBatch
    };
    record.core = MotionController.create({
      element: record.element,
      motion: function (coreContext) { return resolveTransition(record, coreContext); },
      appear: initialBatch && settings.appear !== false,
      enter: settings.enter,
      leave: settings.leave,
      reducedMotion: settings.reducedMotion,
      disabled: settings.disabled,
      duration: function (ctx) { return isFunction(settings.duration) ? settings.duration(recordContext(record, ctx)) : settings.duration; },
      deadlinePadding: settings.deadlinePadding,
      onPrepare: function (ctx) {
        return isFunction(settings.onPrepare) ? settings.onPrepare(recordContext(record, ctx)) : null;
      },
      onPrepareError: function (error, ctx) {
        if (isFunction(settings.onPrepareError)) settings.onPrepareError(error, recordContext(record, ctx));
      },
      onStateChange: function () { emit('child-transition'); },
      onStart: function (ctx) { call('onStart', record, ctx); },
      onActive: function (ctx) { call('onActive', record, ctx); },
      onBeforeEnter: function (ctx) { call('onBeforeEnter', record, ctx); },
      onAfterEnter: function (ctx) { call('onAfterEnter', record, ctx); },
      onBeforeLeave: function (ctx) { call('onBeforeLeave', record, ctx); },
      onAfterLeave: function (ctx) { record.lastLeaveContext = ctx; },
      onVisibleChanged: function (visible, ctx) { call('onVisibleChanged', record, ctx, { visible: visible }); },
      onInterrupt: function (ctx) { call('onInterrupt', record, ctx, { from: ctx.from, to: ctx.to, reversal: true }); },
      unmount: function () { removeRecord(record); }
    });
    return record;
  }
  function combinedOrder(previous, nextIds) {
    var nextSet = Object.create(null);
    nextIds.forEach(function (id) { nextSet[id] = true; });
    var queue = nextIds.slice();
    var output = [];
    previous.forEach(function (id) {
      var record = records[id];
      if (record && !nextSet[id]) output.push(id);
      else if (queue.length) output.push(queue.shift());
    });
    while (queue.length) output.push(queue.shift());
    var seen = Object.create(null);
    return output.filter(function (id) {
      if (seen[id]) return false;
      seen[id] = true;
      return !!records[id];
    });
  }
  function projectPhysicalOrder() {
    var nextElement = null;
    for (var index = physicalOrder.length - 1; index >= 0; index -= 1) {
      var record = records[physicalOrder[index]];
      if (!record || !record.element) continue;
      var element = record.element;
      if (element.parentNode !== container || element.nextSibling !== nextElement) {
        container.insertBefore(element, nextElement);
      }
      nextElement = element;
    }
  }
  function sync(entries, meta) {
    if (destroyed) throw new Error('[QXFRAME9A7C2] TransitionGroup is destroyed.');
    var normalized = normalizeEntries(entries, container, records);
    var nextIds = normalized.map(function (entry) { return entry.id; });
    var nextSet = Object.create(null);
    nextIds.forEach(function (id) { nextSet[id] = true; });
    var previous = physicalOrder.slice();
    var runGeneration = ++syncGeneration;
    var before = measure();
    if (!cancelAllMoves('sync', runGeneration) || destroyed || syncGeneration !== runGeneration) return api;
    var initialBatch = !initialized;
    var contextMeta = meta && typeof meta === 'object' ? meta : {};
    if (own(contextMeta, 'project') && !isFunction(contextMeta.project)) {
      throw new TypeError('[QXFRAME9A7C2] TransitionGroup sync meta.project must be a function.');
    }

    normalized.forEach(function (entry) {
      var record = records[entry.id];
      if (!record) {
        record = makeRecord(entry, initialBatch, contextMeta);
        records[entry.id] = record;
      } else if (!record.desired) {
        restoreLeaveLayout(record);
      }
      record.index = entry.index;
      record.desired = true;
      record.reason = contextMeta.reason || 'sync';
      record.originalEvent = contextMeta.originalEvent || null;
    });
    previous.forEach(function (id) {
      var record = records[id];
      if (record && !nextSet[id]) {
        record.desired = false;
        record.reason = contextMeta.reason || 'sync';
        record.originalEvent = contextMeta.originalEvent || null;
      }
    });
    // Vue-style list transitions commonly take leaving children out of normal flow so
    // retained leave DOM can animate while stable siblings FLIP into their new slots.
    // This is opt-in because tables, grids and external geometry owners may intentionally
    // need retained leaves to keep occupying layout space. Pop before the post-projection
    // measurement so sibling movement belongs to the same keyed collection transaction.
    previous.forEach(function (id) {
      var record = records[id];
      if (record && !record.desired) popLeaveLayout(record);
    });

    physicalOrder = combinedOrder(previous, nextIds);
    nextIds.forEach(function (id) { if (physicalOrder.indexOf(id) < 0) physicalOrder.push(id); });
    projectPhysicalOrder();
    logicalOrder = nextIds.slice();
    if (own(contextMeta, 'project')) {
      contextMeta.project(Object.freeze({
        container: container,
        reason: contextMeta.reason || 'sync',
        state: currentState()
      }));
      if (destroyed || syncGeneration !== runGeneration) return api;
    }
    var after = measure();
    if (!startMoves(before, after, { reason: contextMeta.reason || 'sync', immediate: contextMeta.immediate === true }, runGeneration) || destroyed || syncGeneration !== runGeneration) return api;

    for (var enterIndex = 0; enterIndex < normalized.length; enterIndex += 1) {
      var entry = normalized[enterIndex];
      var enterRecord = records[entry.id];
      if (!enterRecord) continue;
      var phase = enterRecord.core.getState().phase;
      if (phase === 'hidden' || phase === 'leaving') {
        enterRecord.core.setVisible(true, {
          reason: contextMeta.reason || (initialBatch ? 'initial' : 'enter'),
          originalEvent: contextMeta.originalEvent || null,
          immediate: contextMeta.immediate === true || (initialBatch && settings.appear === false)
        });
        if (destroyed || syncGeneration !== runGeneration) return api;
      }
    }
    for (var leaveIndex = 0; leaveIndex < previous.length; leaveIndex += 1) {
      var leaveRecord = records[previous[leaveIndex]];
      if (leaveRecord && !leaveRecord.desired) {
        leaveRecord.core.setVisible(false, {
          reason: contextMeta.reason || 'leave',
          originalEvent: contextMeta.originalEvent || null,
          immediate: contextMeta.immediate === true
        });
        if (destroyed || syncGeneration !== runGeneration) return api;
      }
    }
    if (destroyed || syncGeneration !== runGeneration) return api;
    initialized = true;
    emit('sync');
    return api;
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    syncGeneration += 1;
    cancelAllMoves('destroy');
    physicalOrder.slice().forEach(function (id) {
      var record = records[id];
      if (!record) return;
      record.core.destroy();
      if (!record.desired && record.element.parentNode === container) container.removeChild(record.element);
      restoreLeaveLayout(record);
    });
    records = Object.create(null);
    physicalOrder = [];
    logicalOrder = [];
    var finalState = currentState();
    var waiters = settleWaiters.slice();
    settleWaiters.length = 0;
    waiters.forEach(function (resolve) { resolve(finalState); });
    return true;
  }

  api = Object.freeze({ sync: sync, getState: currentState, getChildState: getChildState, whenSettled: whenSettled, destroy: destroy });
  return api;
}

export const TransitionGroup = Object.freeze({ create });
export { create };
