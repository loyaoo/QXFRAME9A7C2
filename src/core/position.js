// Canonical ESM position adapter.
// Floating UI is imported from the vendored ESM authority; callers may still override `options.floating` for testing or custom adapters.

import { Scheduler } from './scheduler.js';
import { Utils } from '../utils/utils.js';
import { FloatingUIDOM } from '../vendor/floating-ui.js';

function create(options) {
  var settings = options || {};
  var floatingApi = settings.floating || FloatingUIDOM || null;
  var destroyed = false;

  function requireApi() {
    if (!floatingApi || !Utils.isFunction(floatingApi.computePosition)) {
      throw new Error(
        '[QXFRAME9A7C2] Floating UI DOM API is unavailable.'
      );
    }
    return floatingApi;
  }

  function prepareMiddleware(api, floating, local, matchWidthState) {
    var middleware = [];
    if (local.offset !== undefined && local.offset !== null && local.offset !== false) {
      if (!Utils.isFunction(api.offset)) throw new Error('[QXFRAME9A7C2] FloatingUIDOM.offset is required for popup main-axis offset.');
      middleware.push(api.offset(local.offset));
    }
    if (local.inlinePositioning === true) {
      if (!Utils.isFunction(api.inline)) throw new Error('[QXFRAME9A7C2] FloatingUIDOM.inline is required when inlinePositioning is enabled.');
      middleware.push(api.inline(local.inlinePositioningOptions || {}));
    }
    if (local.flipOnOverflow === true) {
      if (!Utils.isFunction(api.flip)) throw new Error('[QXFRAME9A7C2] FloatingUIDOM.flip is required for canonical popup overflow reversal.');
      middleware.push(api.flip());
    }
    if (Array.isArray(local.middleware)) middleware = middleware.concat(local.middleware);
    else if (local.middleware !== undefined && local.middleware !== null) middleware.push(local.middleware);

    if (local.matchReferenceWidth === true) {
      if (!Utils.isFunction(api.size)) {
        throw new Error('[QXFRAME9A7C2] FloatingUIDOM.size is required when matchReferenceWidth is enabled.');
      }
      middleware.push(api.size({
        apply: function (state) {
          var rects = state && state.rects;
          var width = rects && rects.reference ? Number(rects.reference.width) : 0;
          var element = state && state.elements && state.elements.floating
            ? state.elements.floating : floating;
          if (element && element.style) {
            var nextMinWidth = width > 0 ? Math.ceil(width) + 'px' : '';
            element.style.minWidth = nextMinWidth;
            if (matchWidthState) matchWidthState.applied = element.style.minWidth;
          }
        }
      }));
    }
    if (local.arrow === true && local.arrowElement) {
      if (!Utils.isFunction(api.arrow)) throw new Error('[QXFRAME9A7C2] FloatingUIDOM.arrow is required when popup arrow positioning is enabled.');
      middleware.push(api.arrow({ element: local.arrowElement, padding: local.arrowPadding === undefined ? 8 : local.arrowPadding }));
    }
    return middleware;
  }

  function compute(reference, floating, config, matchWidthState) {
    if (destroyed) {
      return Promise.reject(new Error('[QXFRAME9A7C2] PositionAdapter is destroyed.'));
    }
    if (!reference || !floating) {
      return Promise.reject(new TypeError('[QXFRAME9A7C2] reference and floating are required.'));
    }

    var api = requireApi();
    var local = config || {};
    return api.computePosition(reference, floating, {
      placement: local.placement,
      strategy: local.strategy,
      middleware: prepareMiddleware(api, floating, local, matchWidthState)
    });
  }

  function applyArrow(result, local, arrowStyleState) {
    var arrow = local && local.arrow === true ? local.arrowElement : null;
    if (!arrow || !arrow.style) return;
    function setArrowStyle(name, value) {
      arrow.style[name] = value;
      if (arrowStyleState) arrowStyleState.applied[name] = arrow.style[name];
    }
    var data = result && result.middlewareData && result.middlewareData.arrow;
    if (!data) {
      setArrowStyle('left', '');
      setArrowStyle('top', '');
      setArrowStyle('marginLeft', '');
      setArrowStyle('marginTop', '');
      return;
    }
    var side = String(result.placement || local.placement || 'bottom').split('-')[0];
    if (side === 'top' || side === 'bottom') {
      setArrowStyle('left', data.x === undefined || data.x === null ? '' : Math.round(Number(data.x) || 0) + 'px');
      setArrowStyle('top', '');
      setArrowStyle('marginLeft', '0px');
      setArrowStyle('marginTop', '');
    } else {
      setArrowStyle('left', '');
      setArrowStyle('top', data.y === undefined || data.y === null ? '' : Math.round(Number(data.y) || 0) + 'px');
      setArrowStyle('marginLeft', '');
      setArrowStyle('marginTop', '0px');
    }
  }

  function apply(floating, result, local, positionStyleState) {
    if (!floating || !floating.style || !result) return result;
    var nextPosition = result.strategy || 'absolute';
    floating.style.position = nextPosition;
    if (positionStyleState) positionStyleState.applied.position = floating.style.position;
    var x = Math.round(Number(result.x) || 0);
    var y = Math.round(Number(result.y) || 0);
    if (local && local.useTransformPosition === true) {
      floating.style.left = '0px';
      floating.style.top = '0px';
      var nextTransform = 'translate3d(' + x + 'px, ' + y + 'px, 0)';
      floating.style.transform = nextTransform;
      if (positionStyleState) { positionStyleState.applied.left = floating.style.left; positionStyleState.applied.top = floating.style.top; positionStyleState.applied.transform = floating.style.transform; }
    } else {
      var nextLeft = String(x) + 'px';
      var nextTop = String(y) + 'px';
      floating.style.left = nextLeft;
      floating.style.top = nextTop;
      if (positionStyleState) { positionStyleState.applied.left = floating.style.left; positionStyleState.applied.top = floating.style.top; }
    }
    applyArrow(result, local || {}, positionStyleState && positionStyleState.arrow);
    return result;
  }

  function mount(reference, floating, config) {
    if (destroyed) throw new Error('[QXFRAME9A7C2] PositionAdapter is destroyed.');
    var api = requireApi();
    var local = config || {};
    var active = true;
    var matchWidthState = { original: floating && floating.style ? floating.style.minWidth : '', applied: null };
    var arrowElement = local && local.arrowElement && local.arrowElement.style ? local.arrowElement : null;
    var positionStyleState = {
      original: floating && floating.style ? { position: floating.style.position, left: floating.style.left, top: floating.style.top, transform: floating.style.transform } : { position:'', left:'', top:'', transform:'' },
      applied: { position:null, left:null, top:null, transform:null },
      arrow: arrowElement ? {
        element: arrowElement,
        original: { left:arrowElement.style.left, top:arrowElement.style.top, marginLeft:arrowElement.style.marginLeft, marginTop:arrowElement.style.marginTop },
        applied: { left:null, top:null, marginLeft:null, marginTop:null }
      } : null
    };
    var lastResult = null;
    var lastError = null;
    var pending = null;
    var computing = false;
    var rerun = false;
    var rerunReason = null;
    var computeCount = 0;
    var deferredCount = 0;
    var suspended = false;
    var dirtyWhileSuspended = false;
    var suspendedReason = null;

    var frame = Scheduler.createFrameScheduler(function (_, reason) {
      if (!active) return;
      if (suspended) {
        dirtyWhileSuspended = true;
        suspendedReason = reason || suspendedReason || 'suspended';
        return;
      }
      if (computing) {
        rerun = true;
        rerunReason = reason || 'coalesced-during-compute';
        deferredCount += 1;
        return;
      }
      computing = true;
      computeCount += 1;
      pending = compute(reference, floating, local, matchWidthState).then(function (result) {
        if (!active) return result;
        lastResult = result;
        lastError = null;
        if (Utils.isFunction(local.apply)) local.apply(result, floating);
        else apply(floating, result, local, positionStyleState);
        if (Utils.isFunction(local.onUpdate)) local.onUpdate(result);
        return result;
      }).catch(function (error) {
        if (!active) return null;
        lastError = error;
        if (Utils.isFunction(local.onError)) {
          local.onError(error);
          return null;
        }
        throw error;
      }).then(function (result) {
        computing = false;
        if (active && rerun) {
          var nextReason = rerunReason || 'coalesced-after-compute';
          rerun = false;
          rerunReason = null;
          update(nextReason);
        }
        return result;
      }, function (error) {
        computing = false;
        if (active && rerun) {
          var nextReason = rerunReason || 'coalesced-after-error';
          rerun = false;
          rerunReason = null;
          update(nextReason);
        }
        throw error;
      });
    });

    function update(reason) {
      if (!active) return false;
      if (suspended) {
        dirtyWhileSuspended = true;
        suspendedReason = reason || suspendedReason || 'suspended';
        deferredCount += 1;
        return false;
      }
      return frame.request(reason || 'manual');
    }

    function flush(reason) {
      if (!active) return Promise.resolve(lastResult);
      // A motion prepare is allowed to perform exactly one positioning pass while normal
      // auto-update requests remain suspended. The compute itself is async, but all later
      // auto-update requests are coalesced into dirtyWhileSuspended until resume().
      var wasSuspended = suspended;
      suspended = false;
      update(reason || 'flush');
      frame.flush();
      suspended = wasSuspended;
      return pending && typeof pending.then === 'function' ? pending : Promise.resolve(lastResult);
    }

    function setSuspended(next, reason) {
      var value = next === true;
      if (!active || suspended === value) return false;
      suspended = value;
      if (suspended) {
        if (frame.pending) {
          frame.cancel();
          dirtyWhileSuspended = true;
          suspendedReason = reason || suspendedReason || 'suspend';
        }
      } else if (dirtyWhileSuspended) {
        var resumeReason = suspendedReason || reason || 'resume';
        dirtyWhileSuspended = false;
        suspendedReason = null;
        update(resumeReason);
      }
      return true;
    }

    var cleanupAuto = null;
    if (local.autoUpdate !== false && Utils.isFunction(api.autoUpdate)) {
      cleanupAuto = api.autoUpdate(reference, floating, function () {
        update('floating-auto-update');
      }, local.autoUpdateOptions);
    }

    update('mount');

    function destroyMount() {
      if (!active) return false;
      active = false;
      if (Utils.isFunction(cleanupAuto)) cleanupAuto();
      cleanupAuto = null;
      frame.dispose();
      if (floating && floating.style) {
        if (matchWidthState.applied !== null && floating.style.minWidth === matchWidthState.applied) floating.style.minWidth = matchWidthState.original;
        ['position','left','top','transform'].forEach(function (name) {
          var appliedValue = positionStyleState.applied[name];
          if (appliedValue !== null && floating.style[name] === appliedValue) floating.style[name] = positionStyleState.original[name];
        });
      }
      var arrowState = positionStyleState.arrow;
      if (arrowState && arrowState.element && arrowState.element.style) {
        ['left','top','marginLeft','marginTop'].forEach(function (name) {
          var appliedArrowValue = arrowState.applied[name];
          if (appliedArrowValue !== null && arrowState.element.style[name] === appliedArrowValue) arrowState.element.style[name] = arrowState.original[name];
        });
      }
      return true;
    }

    return {
      update: update,
      flush: flush,
      setSuspended: setSuspended,
      destroy: destroyMount,
      getLastResult: function () { return lastResult; },
      getLastError: function () { return lastError; },
      getPendingPromise: function () { return pending; },
      getRequestCount: function () { return frame.requestCount; },
      getRunCount: function () { return frame.runCount; },
      getComputeCount: function () { return computeCount; },
      getDeferredCount: function () { return deferredCount; },
      isComputing: function () { return computing; },
      isSuspended: function () { return suspended; },
      isDirtyWhileSuspended: function () { return dirtyWhileSuspended; }
    };
  }

  function destroy() {
    if (destroyed) return false;
    floatingApi = null;
    destroyed = true;
    return true;
  }

  return { compute: compute, apply: apply, mount: mount, destroy: destroy };
}

export const PositionAdapter = Object.freeze({ create });
export { create };
