
import { Utils } from '../utils/utils.js';

const global = globalThis;

var createdSchedulers = 0;
var disposedSchedulers = 0;
var pendingSchedulers = 0;
var callbackRequests = 0;
var callbackRuns = 0;
var callbackErrors = 0;
var schedulerErrorHandler = null;

function reportSchedulerError(error, detail) {
  callbackErrors += 1;
  try {
    if (Utils.isFunction(schedulerErrorHandler)) schedulerErrorHandler(error, detail || {});
    else if (global.console && Utils.isFunction(global.console.error)) global.console.error(error);
  } catch (_) {}
}

function createSharedHub() {
  var requestFrame = global.requestAnimationFrame;
  var cancelFrame = global.cancelAnimationFrame;
  var queue = [];
  var scheduled = false;
  var frameId = null;
  var nativeRequestCount = 0;
  var nativeCancelCount = 0;
  var nativeRunCount = 0;
  var taskRunCount = 0;

  function compact() {
    if (!queue.length) return;
    queue = queue.filter(function (task) { return task && task.queued === true; });
  }

  function activeCount() {
    var count = 0;
    queue.forEach(function (task) { if (task && task.queued === true) count += 1; });
    return count;
  }

  function ensureFrame() {
    if (scheduled) return true;
    if (!Utils.isFunction(requestFrame) || !Utils.isFunction(cancelFrame)) {
      throw new Error('[QXFRAME9A7C2] requestAnimationFrame/cancelAnimationFrame are required for shared FrameScheduler.');
    }
    scheduled = true;
    nativeRequestCount += 1;
    try {
      frameId = requestFrame(run);
    } catch (error) {
      scheduled = false;
      frameId = null;
      throw error;
    }
    return true;
  }

  function run(timestamp) {
    scheduled = false;
    frameId = null;
    nativeRunCount += 1;
    var batch = queue;
    queue = [];
    batch.forEach(function (task) {
      if (!task || task.queued !== true) return;
      task.queued = false;
      taskRunCount += 1;
      try { task.run(timestamp); }
      catch (error) { reportSchedulerError(error, { phase: 'frame-task', timestamp: timestamp }); }
    });
    compact();
    if (activeCount() > 0) ensureFrame();
  }

  function request(task) {
    if (!task || task.queued === true) return false;
    task.queued = true;
    queue.push(task);
    try { ensureFrame(); }
    catch (error) {
      task.queued = false;
      compact();
      throw error;
    }
    return true;
  }

  function cancel(task) {
    if (!task || task.queued !== true) return false;
    task.queued = false;
    if (scheduled && activeCount() === 0) {
      cancelFrame(frameId);
      nativeCancelCount += 1;
      scheduled = false;
      frameId = null;
      queue = [];
    }
    return true;
  }

  function getStats() {
    return Object.freeze({
      pendingTasks: activeCount(),
      framePending: scheduled,
      nativeRequestCount: nativeRequestCount,
      nativeCancelCount: nativeCancelCount,
      nativeRunCount: nativeRunCount,
      taskRunCount: taskRunCount
    });
  }

  return Object.freeze({ request: request, cancel: cancel, getStats: getStats });
}

var sharedHub = createSharedHub();

function createLocalBackend(requestFrame, cancelFrame) {
  return {
    schedule: function (task) {
      task.queued = true;
      task.frameId = requestFrame(function (timestamp) {
        if (!task.queued) return;
        task.queued = false;
        task.frameId = null;
        try { task.run(timestamp); }
        catch (error) { reportSchedulerError(error, { phase: 'frame-task', timestamp: timestamp }); }
      });
      return true;
    },
    cancel: function (task) {
      if (!task.queued) return false;
      var id = task.frameId;
      task.queued = false;
      task.frameId = null;
      cancelFrame(id);
      return true;
    }
  };
}

function createFrameScheduler(callback, options) {
  if (!Utils.isFunction(callback)) throw new TypeError('[QXFRAME9A7C2] FrameScheduler callback must be a function.');

  var settings = options || {};
  var hasCustomBackend = settings.requestFrame !== undefined || settings.cancelFrame !== undefined;
  var requestFrame = settings.requestFrame || global.requestAnimationFrame;
  var cancelFrame = settings.cancelFrame || global.cancelAnimationFrame;
  if (hasCustomBackend && (!Utils.isFunction(requestFrame) || !Utils.isFunction(cancelFrame))) {
    throw new Error('[QXFRAME9A7C2] requestFrame and cancelFrame must both be functions when a custom FrameScheduler backend is supplied.');
  }

  var backend = hasCustomBackend ? createLocalBackend(requestFrame, cancelFrame) : null;
  var pending = false;
  var disposed = false;
  var latestReason;
  var requestCount = 0;
  var runCount = 0;
  var task = null;

  createdSchedulers += 1;

  function run(timestamp) {
    if (disposed || !pending) return;
    pending = false;
    pendingSchedulers = Math.max(0, pendingSchedulers - 1);
    var reason = latestReason;
    latestReason = undefined;
    runCount += 1;
    callbackRuns += 1;
    callback(timestamp, reason);
  }

  task = { queued: false, frameId: null, run: run };

  function request(reason) {
    if (disposed) return false;
    latestReason = reason;
    requestCount += 1;
    callbackRequests += 1;
    if (pending) return false;
    pending = true;
    pendingSchedulers += 1;
    try {
      if (backend) backend.schedule(task);
      else sharedHub.request(task);
    } catch (error) {
      task.queued = false;
      task.frameId = null;
      pending = false;
      pendingSchedulers = Math.max(0, pendingSchedulers - 1);
      throw error;
    }
    return true;
  }

  function cancel() {
    if (!pending || disposed) return false;
    if (backend) backend.cancel(task);
    else sharedHub.cancel(task);
    pending = false;
    pendingSchedulers = Math.max(0, pendingSchedulers - 1);
    latestReason = undefined;
    return true;
  }

  function flush() {
    if (!pending || disposed) return false;
    if (backend) backend.cancel(task);
    else sharedHub.cancel(task);
    var now = global.performance && Utils.isFunction(global.performance.now)
      ? global.performance.now() : Date.now();
    run(now);
    return true;
  }

  function dispose() {
    if (disposed) return false;
    if (pending) cancel();
    disposed = true;
    latestReason = undefined;
    disposedSchedulers += 1;
    return true;
  }

  var api = { request: request, cancel: cancel, flush: flush, dispose: dispose };
  Object.defineProperties(api, {
    pending: { enumerable: true, get: function () { return pending; } },
    disposed: { enumerable: true, get: function () { return disposed; } },
    requestCount: { enumerable: true, get: function () { return requestCount; } },
    runCount: { enumerable: true, get: function () { return runCount; } },
    shared: { enumerable: true, get: function () { return !hasCustomBackend; } }
  });
  return api;
}

function createDelayScheduler(callback, options) {
  if (!Utils.isFunction(callback)) throw new TypeError('[QXFRAME9A7C2] DelayScheduler callback must be a function.');

  var settings = options || {};
  var setTimer = settings.setTimer || global.setTimeout;
  var clearTimer = settings.clearTimer || global.clearTimeout;
  if (!Utils.isFunction(setTimer) || !Utils.isFunction(clearTimer)) {
    throw new Error('[QXFRAME9A7C2] setTimeout/clearTimeout are required for DelayScheduler.');
  }

  var pending = false;
  var disposed = false;
  var timerId = null;
  var latestReason;
  var requestCount = 0;
  var runCount = 0;

  createdSchedulers += 1;

  function now() {
    return global.performance && Utils.isFunction(global.performance.now) ? global.performance.now() : Date.now();
  }

  function run() {
    if (disposed || !pending) return;
    pending = false;
    timerId = null;
    pendingSchedulers = Math.max(0, pendingSchedulers - 1);
    var reason = latestReason;
    latestReason = undefined;
    runCount += 1;
    callbackRuns += 1;
    try { callback(now(), reason); }
    catch (error) { reportSchedulerError(error, { phase: 'delay-task', reason: reason }); }
  }

  function request(delay, reason) {
    if (disposed) return false;
    var wait = Number(delay);
    if (!Number.isFinite(wait) || wait < 0) throw new TypeError('[QXFRAME9A7C2] DelayScheduler delay must be a non-negative finite number.');
    latestReason = reason;
    requestCount += 1;
    callbackRequests += 1;
    if (pending) clearTimer(timerId);
    else { pending = true; pendingSchedulers += 1; }
    timerId = setTimer(run, wait);
    return true;
  }

  function cancel() {
    if (!pending || disposed) return false;
    clearTimer(timerId);
    timerId = null;
    pending = false;
    pendingSchedulers = Math.max(0, pendingSchedulers - 1);
    latestReason = undefined;
    return true;
  }

  function flush() {
    if (!pending || disposed) return false;
    clearTimer(timerId);
    timerId = null;
    run();
    return true;
  }

  function dispose() {
    if (disposed) return false;
    if (pending) cancel();
    disposed = true;
    latestReason = undefined;
    disposedSchedulers += 1;
    return true;
  }

  var api = { request: request, cancel: cancel, flush: flush, dispose: dispose };
  Object.defineProperties(api, {
    pending: { enumerable: true, get: function () { return pending; } },
    disposed: { enumerable: true, get: function () { return disposed; } },
    requestCount: { enumerable: true, get: function () { return requestCount; } },
    runCount: { enumerable: true, get: function () { return runCount; } }
  });
  return api;
}

function getStats() {
  var hub = sharedHub.getStats();
  return Object.freeze({
    createdSchedulers: createdSchedulers,
    disposedSchedulers: disposedSchedulers,
    activeSchedulers: Math.max(0, createdSchedulers - disposedSchedulers),
    pendingSchedulers: pendingSchedulers,
    callbackRequests: callbackRequests,
    callbackRuns: callbackRuns,
    callbackErrors: callbackErrors,
    layoutPendingTasks: layoutMeasures.filter(function (task) { return task.active; }).length + layoutMutations.filter(function (task) { return task.active; }).length,
    sharedFramePending: hub.framePending,
    sharedPendingTasks: hub.pendingTasks,
    sharedFrameRequestCount: hub.nativeRequestCount,
    sharedFrameCancelCount: hub.nativeCancelCount,
    sharedFrameRunCount: hub.nativeRunCount,
    sharedTaskRunCount: hub.taskRunCount
  });
}

var layoutMeasures = [];
var layoutMutations = [];
var layoutScheduled = false;
var layoutFrame = null;
function runLayoutTasks(tasks, timestamp, phase) {
  tasks.forEach(function (task) {
    if (!task || !task.active) return;
    task.active = false;
    try { task.callback(timestamp); }
    catch (error) { reportSchedulerError(error, { phase: phase, timestamp: timestamp }); }
  });
}
function scheduleLayoutFrame() {
  if (layoutScheduled) return;
  var request = global.requestAnimationFrame;
  if (!Utils.isFunction(request)) throw new Error('[QXFRAME9A7C2] requestAnimationFrame is required for layout scheduling.');
  layoutScheduled = true;
  try {
    layoutFrame = request(function (timestamp) {
      layoutScheduled = false; layoutFrame = null;
      var measures = layoutMeasures.splice(0);
      var mutations = layoutMutations.splice(0);
      runLayoutTasks(measures, timestamp, 'measure');
      runLayoutTasks(mutations, timestamp, 'mutate');
      if (layoutMeasures.some(function (task) { return task.active; }) || layoutMutations.some(function (task) { return task.active; })) scheduleLayoutFrame();
    });
  } catch (error) {
    layoutScheduled = false;
    layoutFrame = null;
    reportSchedulerError(error, { phase: 'layout-schedule' });
    throw error;
  }
}
function enqueueLayout(queue, callback) {
  if (!Utils.isFunction(callback)) throw new TypeError('[QXFRAME9A7C2] Layout scheduler callback must be a function.');
  var task = { active: true, callback: callback };
  queue.push(task); scheduleLayoutFrame();
  return function cancelLayoutTask() { if (!task.active) return false; task.active = false; return true; };
}
function measure(callback) { return enqueueLayout(layoutMeasures, callback); }
function mutate(callback) { return enqueueLayout(layoutMutations, callback); }

export const Scheduler = Object.freeze({
    createFrameScheduler,
    createDelayScheduler,
    measure,
    mutate,
    setErrorHandler: function (handler) { schedulerErrorHandler = Utils.isFunction(handler) ? handler : null; },
    getStats
});

export { createFrameScheduler, createDelayScheduler, measure, mutate, getStats };
