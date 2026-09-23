import { Utils } from '../utils/utils.js';


var AXES = Object.freeze(['x', 'y', 'both']);
  var ALIGNS = Object.freeze(['start', 'center', 'end', 'nearest']);
  var EPSILON = 0.5;

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizeAxis(value) {
    var axis = String(value || 'y').toLowerCase();
    if (AXES.indexOf(axis) < 0) throw new TypeError('[QXFRAME9A7C2] ScrollVisibility axis must be x, y, or both.');
    return axis;
  }

  function normalizeAlign(value) {
    var align = String(value || 'nearest').toLowerCase();
    if (ALIGNS.indexOf(align) < 0) throw new TypeError('[QXFRAME9A7C2] ScrollVisibility align must be start, center, end, or nearest.');
    return align;
  }

  function assertElement(value, name) {
    if (!value || typeof value.getBoundingClientRect !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] ScrollVisibility ' + name + ' must be an Element-like scroll geometry owner.');
    }
  }

  function assertOwnedTarget(owner, target) {
    assertElement(owner, 'owner');
    assertElement(target, 'target');
    if (owner === target) return;
    if (typeof owner.contains !== 'function' || !owner.contains(target)) {
      throw new TypeError('[QXFRAME9A7C2] ScrollVisibility target must be inside the explicit owner.');
    }
  }

  function offsetFor(value, axis) {
    if (value && typeof value === 'object') return finite(value[axis], 0);
    return finite(value, 0);
  }

  function axisVisualScale(owner, rectSize, horizontal) {
    var layoutBorderSize = finite(horizontal ? owner.offsetWidth : owner.offsetHeight, 0);
    if (!(layoutBorderSize > 0) || !(rectSize > 0)) return 1;
    var scale = rectSize / layoutBorderSize;
    return Number.isFinite(scale) && scale > 0 ? scale : 1;
  }

  function axisGeometry(owner, ownerRect, targetRect, axis, options) {
    var horizontal = axis === 'x';
    var clientBorder = finite(horizontal ? owner.clientLeft : owner.clientTop, 0);
    var rectStart = finite(horizontal ? ownerRect.left : ownerRect.top, 0);
    var rectSize = finite(horizontal ? ownerRect.width : ownerRect.height, 0);
    var clientSize = finite(horizontal ? owner.clientWidth : owner.clientHeight, rectSize);
    if (clientSize < 0) clientSize = 0;
    // getBoundingClientRect() is visual-space geometry and therefore includes ancestor
    // popup transforms. scrollTop/scrollLeft are layout-space pixels. Convert visual
    // deltas back through the explicit owner's scale so snap/center alignment remains
    // stable while a popup is entering/leaving with scale transforms.
    var visualScale = axisVisualScale(owner, rectSize, horizontal);
    var viewportStart = rectStart + clientBorder * visualScale;
    var viewportEnd = viewportStart + clientSize * visualScale;
    var targetStart = finite(horizontal ? targetRect.left : targetRect.top, viewportStart);
    var targetEnd = finite(horizontal ? targetRect.right : targetRect.bottom, targetStart);
    var currentKey = horizontal ? 'currentX' : 'currentY';
    var maxKey = horizontal ? 'maxX' : 'maxY';
    var current = Number.isFinite(Number(options[currentKey]))
      ? Number(options[currentKey])
      : finite(horizontal ? owner.scrollLeft : owner.scrollTop, 0);
    var scrollSize = finite(horizontal ? owner.scrollWidth : owner.scrollHeight, clientSize);
    var max = Number.isFinite(Number(options[maxKey]))
      ? Math.max(0, Number(options[maxKey]))
      : Math.max(0, scrollSize - clientSize);
    current = Math.max(0, Math.min(current, max));

    var target = current;
    if (options.align === 'start') {
      target = current + (targetStart - viewportStart) / visualScale;
    } else if (options.align === 'center') {
      target = current + (((targetStart + targetEnd) / 2) - ((viewportStart + viewportEnd) / 2)) / visualScale;
    } else if (options.align === 'end') {
      target = current + (targetEnd - viewportEnd) / visualScale;
    } else if (targetStart < viewportStart && targetEnd > viewportEnd) {
      target = current;
    } else if (targetStart < viewportStart) {
      target = current + (targetStart - viewportStart) / visualScale;
    } else if (targetEnd > viewportEnd) {
      target = current + (targetEnd - viewportEnd) / visualScale;
    }

    target += offsetFor(options.offset, axis);
    target = Math.max(0, Math.min(target, max));
    return { value: target, changed: Math.abs(target - current) > EPSILON };
  }

  function calculateElementScroll(owner, target, local) {
    assertOwnedTarget(owner, target);
    var options = local && typeof local === 'object' ? Utils.mergeOwn(local) : {};
    options.axis = normalizeAxis(options.axis);
    options.align = normalizeAlign(options.align);

    var ownerRect = owner.getBoundingClientRect();
    var targetRect = target.getBoundingClientRect();
    var currentX = Number.isFinite(Number(options.currentX)) ? Number(options.currentX) : finite(owner.scrollLeft, 0);
    var currentY = Number.isFinite(Number(options.currentY)) ? Number(options.currentY) : finite(owner.scrollTop, 0);
    var x = currentX;
    var y = currentY;
    var changedX = false;
    var changedY = false;

    if (options.axis === 'x' || options.axis === 'both') {
      var horizontal = axisGeometry(owner, ownerRect, targetRect, 'x', options);
      x = horizontal.value;
      changedX = horizontal.changed;
    }
    if (options.axis === 'y' || options.axis === 'both') {
      var vertical = axisGeometry(owner, ownerRect, targetRect, 'y', options);
      y = vertical.value;
      changedY = vertical.changed;
    }

    return Object.freeze({ x: x, y: y, changedX: changedX, changedY: changedY });
  }

  function ensureVisible(owner, target, local) {
    var point = calculateElementScroll(owner, target, local);
    if (point.changedX) owner.scrollLeft = point.x;
    if (point.changedY) owner.scrollTop = point.y;
    return point.changedX || point.changedY;
  }

export const ScrollVisibility = Object.freeze({ calculateElementScroll, ensureVisible, axes: AXES, alignments: ALIGNS });
export { calculateElementScroll, ensureVisible };
