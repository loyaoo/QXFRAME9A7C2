
import { Events } from './events.js';
import { mergeOptions } from './options.js';

var KEYS = Object.freeze(['scale', 'rotate', 'flipX', 'flipY', 'x', 'y']);
var LEGACY_OPTIONS = Object.freeze(['transform', 'zoom', 'rotation', 'translateX', 'translateY']);

function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function rejectLegacy(options) {
  LEGACY_OPTIONS.forEach(function (key) {
    if (own(options, key)) throw new TypeError('[QXFRAME9A7C2] TransformModel does not accept legacy option "' + key + '".');
  });
}
function finite(value, fallback, label) {
  var number = Number(value == null ? fallback : value);
  if (!Number.isFinite(number)) throw new TypeError('[QXFRAME9A7C2] TransformModel ' + label + ' must be finite.');
  return number;
}
function flipValue(value, fallback, label) {
  var number = finite(value, fallback, label);
  if (number !== 1 && number !== -1) throw new TypeError('[QXFRAME9A7C2] TransformModel ' + label + ' must be 1 or -1.');
  return number;
}
function same(left, right) {
  return KEYS.every(function (key) { return Object.is(left[key], right[key]); });
}

function create(options) {
  var opts = mergeOptions({ minScale: 0.01, maxScale: Infinity, constrain: null, onChange: null }, options || {});
  rejectLegacy(opts);
  var emitter = Events.createEmitter();
  var destroyed = false;
  var api = null;

  function normalizeBounds() {
    opts.minScale = finite(opts.minScale, 0.01, 'minScale');
    opts.maxScale = opts.maxScale === Infinity ? Infinity : finite(opts.maxScale, Infinity, 'maxScale');
    if (opts.minScale <= 0) throw new TypeError('[QXFRAME9A7C2] TransformModel minScale must be > 0.');
    if (opts.maxScale < opts.minScale) throw new TypeError('[QXFRAME9A7C2] TransformModel maxScale must be >= minScale.');
    if (opts.constrain != null && typeof opts.constrain !== 'function') throw new TypeError('[QXFRAME9A7C2] TransformModel constrain must be a function.');
    if (opts.onChange != null && typeof opts.onChange !== 'function') throw new TypeError('[QXFRAME9A7C2] TransformModel onChange must be a function.');
  }
  normalizeBounds();

  function normalizeState(value, base, skipConstraint) {
    var input = value || {};
    var previous = base || { scale: 1, rotate: 0, flipX: 1, flipY: 1, x: 0, y: 0 };
    var next = {
      scale: finite(own(input, 'scale') ? input.scale : previous.scale, 1, 'scale'),
      rotate: finite(own(input, 'rotate') ? input.rotate : previous.rotate, 0, 'rotate'),
      flipX: flipValue(own(input, 'flipX') ? input.flipX : previous.flipX, 1, 'flipX'),
      flipY: flipValue(own(input, 'flipY') ? input.flipY : previous.flipY, 1, 'flipY'),
      x: finite(own(input, 'x') ? input.x : previous.x, 0, 'x'),
      y: finite(own(input, 'y') ? input.y : previous.y, 0, 'y')
    };
    next.scale = Math.max(opts.minScale, Math.min(opts.maxScale, next.scale));
    if (!skipConstraint && typeof opts.constrain === 'function') {
      var constrained = opts.constrain(Object.freeze(Object.assign({}, next)), api);
      if (constrained !== undefined && constrained !== null) {
        if (!constrained || typeof constrained !== 'object' || Array.isArray(constrained)) {
          throw new TypeError('[QXFRAME9A7C2] TransformModel constrain must return an object, null, or undefined.');
        }
        next = normalizeState(Object.assign({}, next, constrained), next, true);
        next.scale = Math.max(opts.minScale, Math.min(opts.maxScale, next.scale));
      }
    }
    return next;
  }

  var initial = normalizeState(opts.value || opts.defaultValue || {}, null);
  var state = initial;

  function snapshot() {
    return Object.freeze({
      scale: state.scale,
      rotate: state.rotate,
      flipX: state.flipX,
      flipY: state.flipY,
      x: state.x,
      y: state.y,
      destroyed: destroyed
    });
  }
  function commit(next, meta) {
    if (destroyed) return false;
    var previous = state;
    var normalized = normalizeState(next, previous);
    var changed = !same(previous, normalized);
    if (!changed && !(meta && meta.force === true)) return true;
    state = normalized;
    var detail = mergeOptions({ reason: 'set', source: 'api', previous: Object.freeze(Object.assign({}, previous)), state: snapshot(), controller: api, changed: changed }, meta);
    if (detail.silent !== true) {
      if (typeof opts.onChange === 'function') opts.onChange(detail.state, detail);
      emitter.emit('change', detail);
    }
    return true;
  }
  function set(next, meta) {
    if (!next || typeof next !== 'object' || Array.isArray(next)) throw new TypeError('[QXFRAME9A7C2] TransformModel set(next) requires an object.');
    return commit(next, mergeOptions({ reason: 'set' }, meta));
  }
  function zoomBy(delta, meta) { return commit({ scale: state.scale + finite(delta, 0, 'zoom delta') }, mergeOptions({ reason: 'zoom' }, meta)); }
  function rotateBy(delta, meta) { return commit({ rotate: state.rotate + finite(delta, 0, 'rotate delta') }, mergeOptions({ reason: 'rotate' }, meta)); }
  function flip(axis, meta) {
    var key = String(axis || 'x').toLowerCase();
    if (key !== 'x' && key !== 'y') throw new TypeError('[QXFRAME9A7C2] TransformModel flip axis must be x or y.');
    var patch = {}; patch[key === 'y' ? 'flipY' : 'flipX'] = state[key === 'y' ? 'flipY' : 'flipX'] * -1;
    return commit(patch, mergeOptions({ reason: 'flip-' + key }, meta));
  }
  function moveTo(x, y, meta) { return commit({ x: finite(x, state.x, 'x'), y: finite(y, state.y, 'y') }, mergeOptions({ reason: 'move' }, meta)); }
  function moveBy(x, y, meta) { return commit({ x: state.x + finite(x, 0, 'x delta'), y: state.y + finite(y, 0, 'y delta') }, mergeOptions({ reason: 'move' }, meta)); }
  function reset(meta) { return commit(initial, mergeOptions({ reason: 'reset' }, meta)); }
  function refresh(meta) { return commit(state, mergeOptions({ reason: 'refresh', force: true }, meta)); }
  function updateOptions(nextOptions, meta) {
    if (destroyed) return api;
    var next = nextOptions || {};
    rejectLegacy(next);
    opts = mergeOptions(opts, next);
    normalizeBounds();
    commit(state, mergeOptions({ reason: 'options', force: true }, meta));
    return api;
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    emitter.dispose();
    return true;
  }

  api = Object.freeze({
    set: set,
    zoomBy: zoomBy,
    rotateBy: rotateBy,
    flip: flip,
    moveTo: moveTo,
    moveBy: moveBy,
    reset: reset,
    refresh: refresh,
    updateOptions: updateOptions,
    snapshot: snapshot,
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  });
  return api;
}

export const TransformModel = Object.freeze({ create });
export { create };
