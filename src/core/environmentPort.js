const global = globalThis;

function bindFunction(owner, value) {
  return typeof value === 'function' ? value.bind(owner) : null;
}

function validateObserver(observer, name) {
  if (observer === null || observer === undefined) return null;
  if (typeof observer.observe !== 'function' || typeof observer.disconnect !== 'function') {
    throw new TypeError('[QXFRAME9A7C2] ' + name + ' adapter must provide observe() and disconnect().');
  }
  return observer;
}

function create(options) {
  var opts = options || {};
  var doc = opts.document || null;
  var win = opts.window || (doc && doc.defaultView) || null;
  if (!doc && !opts.document && global.document) doc = global.document;
  if (!win && !opts.window && doc && doc.defaultView) win = doc.defaultView;
  if (!win && !opts.window && global.window) win = global.window;

  var requestFrame = opts.raf || bindFunction(win || global, (win || global).requestAnimationFrame);
  var cancelFrame = opts.cancelRaf || bindFunction(win || global, (win || global).cancelAnimationFrame);
  var computedStyle = opts.getComputedStyle || bindFunction(win || global, (win || global).getComputedStyle);
  var media = opts.matchMedia || bindFunction(win || global, (win || global).matchMedia);
  var resizeFactory = opts.createResizeObserver || null;
  var mutationFactory = opts.createMutationObserver || null;
  var intersectionFactory = opts.createIntersectionObserver || null;

  function raf(callback) {
    if (typeof requestFrame !== 'function') throw new Error('[QXFRAME9A7C2] EnvironmentPort requestAnimationFrame is unavailable.');
    return requestFrame(callback);
  }
  function cancelRaf(id) {
    if (typeof cancelFrame !== 'function') throw new Error('[QXFRAME9A7C2] EnvironmentPort cancelAnimationFrame is unavailable.');
    return cancelFrame(id);
  }
  function observerCtor(name) {
    if (Object.prototype.hasOwnProperty.call(opts, name)) return opts[name];
    return win ? win[name] : global[name];
  }
  function createResizeObserver(callback) {
    if (typeof resizeFactory === 'function') return validateObserver(resizeFactory(callback), 'ResizeObserver');
    var Ctor = observerCtor('ResizeObserver');
    return typeof Ctor === 'function' ? validateObserver(new Ctor(callback), 'ResizeObserver') : null;
  }
  function createMutationObserver(callback) {
    if (typeof mutationFactory === 'function') return validateObserver(mutationFactory(callback), 'MutationObserver');
    var Ctor = observerCtor('MutationObserver');
    return typeof Ctor === 'function' ? validateObserver(new Ctor(callback), 'MutationObserver') : null;
  }
  function createIntersectionObserver(callback, observerOptions) {
    if (typeof intersectionFactory === 'function') return validateObserver(intersectionFactory(callback, observerOptions), 'IntersectionObserver');
    var Ctor = observerCtor('IntersectionObserver');
    return typeof Ctor === 'function' ? validateObserver(new Ctor(callback, observerOptions), 'IntersectionObserver') : null;
  }
  function getComputedStyle(element) {
    if (typeof computedStyle !== 'function') throw new Error('[QXFRAME9A7C2] EnvironmentPort getComputedStyle is unavailable.');
    return computedStyle(element);
  }
  function matchMedia(query) {
    return typeof media === 'function' ? media(String(query || '')) : null;
  }
  function now() {
    var performanceObject = opts.performance || (win && win.performance) || global.performance;
    return performanceObject && typeof performanceObject.now === 'function' ? performanceObject.now() : Date.now();
  }

  return Object.freeze({
    __qxframe9a7c2EnvironmentPort: true,
    document: doc,
    window: win,
    raf,
    cancelRaf,
    createResizeObserver,
    createMutationObserver,
    createIntersectionObserver,
    getComputedStyle,
    matchMedia,
    now
  });
}

function isPort(value) {
  return !!(value && value.__qxframe9a7c2EnvironmentPort === true);
}

function resolve(value) {
  return isPort(value) ? value : create(value || {});
}

export const EnvironmentPort = Object.freeze({ create, resolve, isPort });
export { create, resolve, isPort };
