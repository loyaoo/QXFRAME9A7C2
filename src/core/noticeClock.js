// Canonical ESM notice timer service extracted from the frozen NoticeClock building block.
const DEFAULT_WATCHDOG_GRACE = 160;
    
function now(view) {
  var realm = view || globalThis;
  return realm.performance && typeof realm.performance.now === 'function'
    ? realm.performance.now()
    : Date.now();
}
    
function finiteDuration(value) {
  var number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}
    
function create(options) {
  var opts = options || {};
  var view = opts.view || (opts.document && opts.document.defaultView) || globalThis;
  var setTimeoutFn = typeof view.setTimeout === 'function' ? view.setTimeout.bind(view) : globalThis.setTimeout.bind(globalThis);
  var clearTimeoutFn = typeof view.clearTimeout === 'function' ? view.clearTimeout.bind(view) : globalThis.clearTimeout.bind(globalThis);
  var requestFrameFn = typeof view.requestAnimationFrame === 'function' ? view.requestAnimationFrame.bind(view) : null;
  var cancelFrameFn = typeof view.cancelAnimationFrame === 'function' ? view.cancelAnimationFrame.bind(view) : null;
  function currentNow() { return now(view); }
  var duration = finiteDuration(opts.duration);
  var remaining = duration;
  var deadline = 0;
  var running = false;
  var finished = false;
  var destroyed = false;
  var frameUpdates = opts.frameUpdates === true;
  var frame = 0;
  var watchdog = 0;
  var watchdogGrace = Number.isFinite(Number(opts.watchdogGrace))
    ? Math.max(0, Number(opts.watchdogGrace))
    : DEFAULT_WATCHDOG_GRACE;
  var onTick = typeof opts.onTick === 'function' ? opts.onTick : null;
  var onFinish = typeof opts.onFinish === 'function' ? opts.onFinish : null;
    
  function clearFrame() {
    if (!frame) return;
    if (cancelFrameFn) cancelFrameFn(frame);
    else clearTimeoutFn(frame);
    frame = 0;
  }
    
  function clearWatchdog() {
    if (!watchdog) return;
    clearTimeoutFn(watchdog);
    watchdog = 0;
  }
    
  function syncRemaining(timestamp) {
    if (running && deadline > 0) remaining = Math.max(0, deadline - (timestamp == null ? currentNow() : timestamp));
    return remaining;
  }
    
  function snapshot(timestamp) {
    var current = syncRemaining(timestamp);
    var total = Math.max(0, duration);
    var ratio = total > 0 ? Math.max(0, Math.min(1, current / total)) : 0;
    return Object.freeze({
      duration: total,
      remaining: current,
      elapsed: Math.max(0, total - current),
      ratio: ratio,
      running: running,
      finished: finished,
      destroyed: destroyed
    });
  }
    
  function project(timestamp) {
    var state = snapshot(timestamp);
    if (onTick) onTick(state);
    return state;
  }
    
  function complete(timestamp) {
    if (destroyed || finished) return false;
    syncRemaining(timestamp);
    remaining = 0;
    deadline = 0;
    running = false;
    finished = true;
    clearFrame();
    clearWatchdog();
    var state = project(timestamp);
    if (onFinish) onFinish(state);
    return true;
  }
    
  function scheduleFrame() {
    if (destroyed || finished || !running || !frameUpdates || frame) return;
    var step = function (timestamp) {
      frame = 0;
      if (destroyed || finished || !running) return;
      var state = project(typeof timestamp === 'number' ? timestamp : currentNow());
      if (state.remaining <= 0) { complete(timestamp); return; }
      scheduleFrame();
    };
    frame = requestFrameFn
      ? requestFrameFn(step)
      : setTimeoutFn(function () { step(currentNow()); }, 16);
  }
    
  function armWatchdog() {
    clearWatchdog();
    if (destroyed || finished || !running || remaining <= 0) return;
    // The watchdog is intentionally late. It never owns progress; it only guarantees
    // completion if requestAnimationFrame is throttled or unavailable.
    watchdog = setTimeoutFn(function () {
      watchdog = 0;
      if (!destroyed && !finished && running) complete(currentNow());
    }, remaining + (frameUpdates ? watchdogGrace : 0));
  }
    
  function resume() {
    if (destroyed || finished || running || remaining <= 0) return false;
    deadline = currentNow() + remaining;
    running = true;
    project();
    scheduleFrame();
    armWatchdog();
    return true;
  }
    
  function pause() {
    if (destroyed || finished) return false;
    if (running) syncRemaining();
    running = false;
    deadline = 0;
    clearFrame();
    clearWatchdog();
    project();
    return true;
  }
    
  function restart(nextDuration, autoStart) {
    if (destroyed) return false;
    clearFrame();
    clearWatchdog();
    duration = finiteDuration(nextDuration);
    remaining = duration;
    deadline = 0;
    running = false;
    finished = false;
    project();
    if (autoStart !== false && remaining > 0) resume();
    return true;
  }
    
  function setFrameUpdates(value) {
    if (destroyed) return false;
    var next = value === true;
    if (frameUpdates === next) {
      project();
      return false;
    }
    frameUpdates = next;
    clearFrame();
    clearWatchdog();
    project();
    if (running) {
      scheduleFrame();
      armWatchdog();
    }
    return true;
  }
    
  function getState() {
    return snapshot();
  }
    
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    running = false;
    deadline = 0;
    clearFrame();
    clearWatchdog();
    onTick = null;
    onFinish = null;
    return true;
  }
    
  const api = Object.freeze({
    pause: pause,
    resume: resume,
    restart: restart,
    setFrameUpdates: setFrameUpdates,
    getState: getState,
    destroy: destroy
  });
    
  project();
  if (opts.autoStart === true && remaining > 0) resume();
  return api;
}
    

export const NoticeClock = Object.freeze({ create, now });
