import { Utils } from '../utils/utils.js';

import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { InteractionDetails } from './interactionDetails.js';
import { CapabilityController } from './capabilityController.js';

const global = globalThis;

function create(options) {
    var opts = options || {};
    var target = opts.target;
    if (!target || !target.addEventListener) throw new TypeError('[QXFRAME9A7C2] PointerSession target is required.');
    var doc = opts.document || target.ownerDocument || global.document;
    var view = doc && doc.defaultView || global;
    var scope = Lifecycle.createScope();
    var activeScope = null;
    var active = false, dragging = false, destroyed = false, pointerId = null, startX = 0, startY = 0, lastX = 0, lastY = 0;
    function coordinate(event, axis, fallback) { return event && event[axis] !== undefined && event[axis] !== null ? Number(event[axis]) : fallback; }
    function state() { return typeof opts.getState === 'function' ? (opts.getState() || {}) : (opts.state || {}); }
    function policy() { return CapabilityController.resolve(state(), Utils.assignOwn({ draggable: true }, opts.capabilities || {})); }
    function payload(reason, event) {
      var x = coordinate(event, 'clientX', lastX), y = coordinate(event, 'clientY', lastY);
      var dx = x - startX, dy = y - startY;
      if (opts.axis === 'x') dy = 0; else if (opts.axis === 'y') dx = 0;
      return InteractionDetails.create(reason, event || null, { source: 'pointer', trigger: target, currentTarget: target, pointerId: pointerId, startX: startX, startY: startY, x: x, y: y, deltaX: dx, deltaY: dy, dragging: dragging });
    }
    function teardownActive() { if (activeScope) { activeScope.dispose(); activeScope = null; } var releasedPointerId = pointerId; active = false; dragging = false; pointerId = null; if (releasedPointerId !== null && target && target.releasePointerCapture) { try { if (!target.hasPointerCapture || target.hasPointerCapture(releasedPointerId)) target.releasePointerCapture(releasedPointerId); } catch (_) {} } }
    function finish(event, cancelled, reason) {
      if (!active) return false;
      if (event && pointerId !== null && event.pointerId !== undefined && event.pointerId !== pointerId) return false;
      lastX = coordinate(event, 'clientX', lastX); lastY = coordinate(event, 'clientY', lastY);
      var detail = payload(reason || (cancelled ? 'pointer-cancel' : 'pointer-end'), event);
      var wasDragging = dragging;
      teardownActive();
      if (cancelled) { if (typeof opts.onCancel === 'function') opts.onCancel(detail); }
      else if (typeof opts.onEnd === 'function') opts.onEnd(detail);
      if (!wasDragging && !cancelled && typeof opts.onTap === 'function') opts.onTap(detail);
      return true;
    }
    function move(event) {
      if (!active || (event.pointerId !== undefined && event.pointerId !== pointerId)) return;
      lastX = Number(event.clientX || 0); lastY = Number(event.clientY || 0);
      var dx = lastX - startX, dy = lastY - startY;
      var distance = opts.axis === 'x' ? Math.abs(dx) : (opts.axis === 'y' ? Math.abs(dy) : Math.sqrt(dx * dx + dy * dy));
      if (!dragging && distance >= Math.max(0, Number(opts.threshold == null ? 3 : opts.threshold))) {
        dragging = true;
        var startDetail = payload('drag-start', event);
        if (typeof opts.onStart === 'function' && opts.onStart(startDetail) === false) { finish(event, true, 'start-cancelled'); return; }
      }
      if (!dragging) return;
      if (opts.preventDefaultOnMove !== false && event.preventDefault) event.preventDefault();
      if (typeof opts.onMove === 'function') opts.onMove(payload('drag-move', event));
    }
    function begin(event) {
      if (destroyed || active || !event || (event.button !== undefined && event.button !== 0) || event.isPrimary === false || !policy().draggable) return false;
      pointerId = event.pointerId === undefined ? 1 : event.pointerId;
      startX = lastX = Number(event.clientX || 0); startY = lastY = Number(event.clientY || 0);
      var before = payload('pointer-start', event);
      if (typeof opts.canStart === 'function' && opts.canStart(before) === false) { pointerId = null; return false; }
      active = true; dragging = Number(opts.threshold || 0) <= 0;
      if (opts.capture !== false && target.setPointerCapture && event.pointerId !== undefined) { try { target.setPointerCapture(event.pointerId); } catch (_) {} }
      activeScope = Lifecycle.createScope();
      activeScope.add(DOM.listen(view, 'pointermove', move, true));
      activeScope.add(DOM.listen(view, 'pointerup', function (e) { finish(e, false, 'pointer-end'); }, true));
      activeScope.add(DOM.listen(view, 'pointercancel', function (e) { finish(e, true, 'pointer-cancel'); }, true));
      activeScope.add(DOM.listen(target, 'lostpointercapture', function (e) { if (active) finish(e, true, 'lost-pointer-capture'); }));
      if (dragging && typeof opts.onStart === 'function' && opts.onStart(payload('drag-start', event)) === false) { finish(event, true, 'start-cancelled'); return false; }
      return true;
    }
    scope.add(DOM.listen(target, 'pointerdown', begin));
    function cancel(reason) { return finish(null, true, reason || 'api-cancel'); }
    function destroy() { if (destroyed) return false; cancel('destroy'); destroyed = true; scope.dispose(); target = null; return true; }
    var api = { begin: begin, cancel: cancel, destroy: destroy, getPolicy: policy };
    Object.defineProperties(api, { active: { enumerable: true, get: function () { return active; } }, dragging: { enumerable: true, get: function () { return dragging; } }, destroyed: { enumerable: true, get: function () { return destroyed; } } });
    return Object.freeze(api);
  }

export const PointerSession = Object.freeze({ create });
export { create };
