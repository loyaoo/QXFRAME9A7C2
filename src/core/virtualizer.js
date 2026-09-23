
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { Scheduler } from './scheduler.js';
import { ObserverHub } from './observerHub.js';
import { Utils } from '../utils/utils.js';

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
  function normalizeCount(value) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] Virtualizer count must be a non-negative finite number.');
    return Math.floor(number);
  }
  function normalizeOverscan(value) {
    var number = Number(value == null || value === '' ? 0 : value);
    if (!Number.isFinite(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] Virtualizer overscan must be a non-negative finite number.');
    return Math.floor(number);
  }
  function normalizeItemSize(value) {
    if (value === undefined || value === null || value === '') return 0;
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] Virtualizer itemSize must be a non-negative finite number. Use 0 for measured/variable size mode.');
    return number;
  }
  function normalizeEstimateSize(value, fallback) {
    var number = Number(value === undefined || value === null || value === '' ? fallback : value);
    if (!Number.isFinite(number) || !(number > 0)) throw new TypeError('[QXFRAME9A7C2] Virtualizer estimateSize must be a positive finite number.');
    return number;
  }

  function create(options) {
    var settings = Utils.mergeOwn(options || {});
    var viewport = settings.viewport;
    if (!viewport) throw new TypeError('[QXFRAME9A7C2] Virtualizer viewport is required.');

    var horizontal = settings.horizontal === true;
    var count = normalizeCount(settings.count == null || settings.count === '' ? 0 : settings.count);
    var overscan = normalizeOverscan(settings.overscan);
    var fixedSize = normalizeItemSize(settings.itemSize);
    var estimateSize = normalizeEstimateSize(settings.estimateSize, fixedSize || 32);
    var enabled = settings.enabled !== false;
    var destroyed = false;
    var sizes = new Map();
    function normalizeItemKeys(value, expectedCount) {
      if (value === undefined || value === null) return null;
      if (!Array.isArray(value) || value.length !== expectedCount) throw new TypeError('[QXFRAME9A7C2] Virtualizer itemKeys must be an array matching count.');
      var seen = Object.create(null);
      return value.map(function (key, index) {
        var normalized = key === undefined || key === null || key === '' ? String(index) : String(key);
        if (seen[normalized]) throw new TypeError('[QXFRAME9A7C2] Virtualizer itemKeys must be unique: ' + normalized + '.');
        seen[normalized] = true;
        return normalized;
      });
    }
    var itemKeys = normalizeItemKeys(settings.itemKeys, count);
    function keyFor(index) { return itemKeys ? itemKeys[index] : index; }
    function pruneMeasurements() {
      if (!itemKeys) {
        sizes.forEach(function (_, key) { if (typeof key === 'number' && key >= count) sizes.delete(key); });
        return;
      }
      var valid = new Set(itemKeys);
      sizes.forEach(function (_, key) { if (!valid.has(String(key))) sizes.delete(key); });
    }
    var prefix = null;
    var dirtyFrom = 0;
    var range = { start: 0, end: count ? 0 : -1, visibleStart: 0, visibleEnd: count ? 0 : -1, total: count };
    var scope = Lifecycle.createScope();
    var api = null;

    function readScroll() {
      return horizontal ? Number(viewport.scrollLeft || 0) : Number(viewport.scrollTop || 0);
    }
    function writeScroll(value) {
      if (horizontal) viewport.scrollLeft = value;
      else viewport.scrollTop = value;
    }
    function readViewportSize() {
      return horizontal ? Number(viewport.clientWidth || 0) : Number(viewport.clientHeight || 0);
    }
    function sizeFor(index) {
      if (fixedSize > 0) return fixedSize;
      var measured = sizes.get(keyFor(index));
      return measured > 0 ? measured : estimateSize;
    }

    function ensurePrefix() {
      if (fixedSize > 0) return;
      if (!prefix || prefix.length !== count + 1) {
        prefix = new Array(count + 1);
        prefix[0] = 0;
        dirtyFrom = 0;
      }
      var start = clamp(dirtyFrom, 0, count);
      if (start === 0) prefix[0] = 0;
      for (var i = start; i < count; i += 1) prefix[i + 1] = prefix[i] + sizeFor(i);
      dirtyFrom = count;
    }

    function getItemOffset(index) {
      if (!count) return 0;
      var i = clamp(Math.floor(Number(index) || 0), 0, count - 1);
      if (fixedSize > 0) return i * fixedSize;
      ensurePrefix();
      return prefix[i] || 0;
    }

    function getTotalSize() {
      if (fixedSize > 0) return count * fixedSize;
      ensurePrefix();
      return prefix[count] || 0;
    }

    function findIndexAtOffset(offset) {
      if (!count) return 0;
      var value = Math.max(0, Number(offset) || 0);
      if (fixedSize > 0) return clamp(Math.floor(value / fixedSize), 0, count - 1);

      ensurePrefix();
      var low = 0;
      var high = count;
      while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (prefix[mid + 1] <= value) low = mid + 1;
        else high = mid;
      }
      return clamp(low, 0, count - 1);
    }

    function calculateRange() {
      if (!count) return { start: 0, end: -1, visibleStart: 0, visibleEnd: -1, total: 0 };
      if (!enabled) {
        return { start: 0, end: count - 1, visibleStart: 0, visibleEnd: count - 1, total: count };
      }

      var scroll = Math.max(0, readScroll());
      var viewportSize = Math.max(0, readViewportSize());
      var visibleStart = findIndexAtOffset(scroll);
      var visibleEnd = findIndexAtOffset(Math.max(scroll, scroll + Math.max(0, viewportSize - 1)));
      return {
        start: Math.max(0, visibleStart - overscan),
        end: Math.min(count - 1, visibleEnd + overscan),
        visibleStart: visibleStart,
        visibleEnd: visibleEnd,
        total: count
      };
    }

    function getVirtualItems() {
      var items = [];
      for (var i = range.start; i <= range.end; i += 1) {
        if (i < 0 || i >= count) continue;
        var start = getItemOffset(i);
        var size = sizeFor(i);
        items.push({ index: i, start: start, size: size, end: start + size });
      }
      return items;
    }

    function snapshot(reason) {
      return {
        reason: reason || 'update',
        range: {
          start: range.start,
          end: range.end,
          visibleStart: range.visibleStart,
          visibleEnd: range.visibleEnd,
          total: range.total
        },
        items: getVirtualItems(),
        totalSize: getTotalSize(),
        scrollOffset: readScroll(),
        viewportSize: readViewportSize(),
        enabled: enabled
      };
    }

    function emit(reason) {
      range = calculateRange();
      var state = snapshot(reason);
      if (Utils.isFunction(settings.onChange)) settings.onChange(state, api);
      return state;
    }

    var frame = Scheduler.createFrameScheduler(function () {
      if (!destroyed) emit('frame');
    });

    function request(reason) {
      if (destroyed) return false;
      return frame.request(reason || 'request');
    }

    function refresh(reason) {
      if (destroyed) return null;
      frame.cancel();
      return emit(reason || 'refresh');
    }

    function setCount(nextCount) {
      if (destroyed) return false;
      var normalized = normalizeCount(nextCount);
      if (normalized === count) return false;
      count = normalized;
      if (itemKeys && itemKeys.length !== count) { itemKeys = null; sizes.clear(); }
      else pruneMeasurements();
      prefix = null;
      dirtyFrom = 0;
      refresh('count');
      return true;
    }

    function setEnabled(value) {
      if (destroyed) return false;
      var next = value !== false;
      if (enabled === next) return false;
      enabled = next;
      refresh('enabled');
      return true;
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      if (own(next, 'viewport') && next.viewport !== viewport) throw new Error('[QXFRAME9A7C2] Virtualizer viewport is immutable; destroy and recreate to change it.');
      if (own(next, 'horizontal') && (next.horizontal === true) !== horizontal) throw new Error('[QXFRAME9A7C2] Virtualizer horizontal axis is immutable; destroy and recreate to change it.');

      var nextCount = own(next, 'count') ? normalizeCount(next.count) : count;
      var nextOverscan = own(next, 'overscan') ? normalizeOverscan(next.overscan) : overscan;
      var nextFixedSize = own(next, 'itemSize') ? normalizeItemSize(next.itemSize) : fixedSize;
      var nextEstimateSize = own(next, 'estimateSize') ? normalizeEstimateSize(next.estimateSize, estimateSize) : estimateSize;
      if (own(next, 'itemSize') && !own(next, 'estimateSize') && nextFixedSize > 0) nextEstimateSize = nextFixedSize;
      var nextEnabled = own(next, 'enabled') ? next.enabled !== false : enabled;
      var nextItemKeys = own(next, 'itemKeys') ? normalizeItemKeys(next.itemKeys, nextCount) : (nextCount === count ? itemKeys : null);
      var keysChanged = !!(itemKeys || nextItemKeys) && (!itemKeys || !nextItemKeys || itemKeys.length !== nextItemKeys.length || itemKeys.some(function (key, index) { return key !== nextItemKeys[index]; }));
      var geometryChanged = nextCount !== count || nextFixedSize !== fixedSize || nextEstimateSize !== estimateSize || keysChanged;
      var changed = geometryChanged || nextOverscan !== overscan || nextEnabled !== enabled;
      var anchor = count ? clamp(range.visibleStart, 0, count - 1) : 0;
      var oldAnchorKey = count ? keyFor(anchor) : null;
      var oldScroll = readScroll();
      var oldAnchorOffset = count ? getItemOffset(anchor) : 0;
      var oldAnchorInnerOffset = oldScroll - oldAnchorOffset;
      var fixedModeChanged = (fixedSize > 0) !== (nextFixedSize > 0);

      count = nextCount;
      itemKeys = nextItemKeys;
      if (fixedModeChanged) sizes.clear();
      else pruneMeasurements();
      fixedSize = nextFixedSize;
      estimateSize = nextEstimateSize;
      overscan = nextOverscan;
      enabled = nextEnabled;
      if (geometryChanged) { prefix = null; dirtyFrom = 0; }
      if (own(next, 'preserveScrollAnchor')) settings.preserveScrollAnchor = next.preserveScrollAnchor;
      if (own(next, 'onChange')) settings.onChange = next.onChange;

      if (geometryChanged && count && settings.preserveScrollAnchor !== false) {
        var nextAnchor = clamp(anchor, 0, count - 1);
        if (oldAnchorKey !== null && itemKeys) {
          var keyedAnchor = itemKeys.indexOf(String(oldAnchorKey));
          if (keyedAnchor >= 0) nextAnchor = keyedAnchor;
        }
        var newAnchorOffset = getItemOffset(nextAnchor);
        writeScroll(Math.max(0, newAnchorOffset + oldAnchorInnerOffset));
      }
      if (changed) refresh('options');
      return api;
    }

    function resetMeasurements(reason) {
      if (destroyed || fixedSize > 0 || !sizes.size) return false;
      var anchor = count ? clamp(range.visibleStart, 0, count - 1) : 0;
      var oldScroll = readScroll();
      var oldAnchorOffset = count ? getItemOffset(anchor) : 0;
      sizes.clear();
      prefix = null;
      dirtyFrom = 0;
      if (count && settings.preserveScrollAnchor !== false) {
        var newAnchorOffset = getItemOffset(anchor);
        var delta = newAnchorOffset - oldAnchorOffset;
        if (delta) writeScroll(Math.max(0, oldScroll + delta));
      }
      refresh(reason || 'measurements-reset');
      return true;
    }

    function measure(index, size) {
      if (destroyed || fixedSize > 0) return false;

      var i = Math.floor(Number(index));
      var nextSize = Number(size);
      if (!Number.isFinite(i) || i < 0 || i >= count || !(nextSize > 0)) return false;

      var previousSize = sizeFor(i);
      if (Math.abs(previousSize - nextSize) < 0.5) return false;

      var anchor = range.visibleStart;
      var oldAnchorOffset = count ? getItemOffset(anchor) : 0;

      sizes.set(keyFor(i), nextSize);
      dirtyFrom = Math.min(dirtyFrom, i);

      var newAnchorOffset = count ? getItemOffset(anchor) : 0;
      if (settings.preserveScrollAnchor !== false && i < anchor) {
        var delta = newAnchorOffset - oldAnchorOffset;
        if (delta) writeScroll(readScroll() + delta);
      }

      request('measure');
      return true;
    }

    function measureElement(index, element) {
      if (!element || typeof element.getBoundingClientRect !== 'function') return false;
      var rect = element.getBoundingClientRect();
      return measure(index, horizontal ? rect.width : rect.height);
    }

    function scrollToOffset(offset) {
      if (destroyed) return false;
      writeScroll(Math.max(0, Number(offset) || 0));
      request('scrollToOffset');
      return true;
    }

    function scrollToIndex(index, options) {
      if (destroyed || !count) return false;
      var i = clamp(Math.floor(Number(index) || 0), 0, count - 1);
      var local = options || {};
      var align = local.align || 'start';
      if (['start', 'center', 'end', 'nearest'].indexOf(align) < 0) {
        throw new TypeError('[QXFRAME9A7C2] Virtualizer align must be start, center, end, or nearest.');
      }
      var viewportSize = readViewportSize();
      var start = getItemOffset(i);
      var size = sizeFor(i);
      var offset = Number(local.offset) || 0;
      var target = start;

      if (align === 'center') target = start - (viewportSize - size) / 2;
      else if (align === 'end') target = start - viewportSize + size;
      else if (align === 'nearest') {
        var current = readScroll();
        if (start >= current && start + size <= current + viewportSize) {
          if (!offset) return false;
          target = current;
        } else {
          target = start < current ? start : start - viewportSize + size;
        }
      }
      target += offset;
      return scrollToOffset(Math.max(0, target));
    }

    function ensureVisible(index, options) {
      var local = options || {};
      return scrollToIndex(index, { align: local.align || 'nearest', offset: local.offset });
    }

    function getRange() {
      return {
        start: range.start,
        end: range.end,
        visibleStart: range.visibleStart,
        visibleEnd: range.visibleEnd,
        total: range.total
      };
    }

    function destroy() {
      if (destroyed) return false;
      scope.dispose();
      frame.dispose();
      sizes.clear();
      prefix = null;
      destroyed = true;
      return true;
    }

    if (typeof viewport.addEventListener === 'function') {
      scope.add(DOM.listen(viewport, 'scroll', function () {
        request('scroll');
      }, { passive: true }));
    }

    if (settings.observeResize !== false) {
      scope.add(ObserverHub.resize(viewport, function () { request('resize'); }, { ResizeObserver: settings.ResizeObserver, schedule: 'measure' }));
    }

    api = {
      refresh: refresh,
      request: request,
      setCount: setCount,
      setEnabled: setEnabled,
      updateOptions: updateOptions,
      resetMeasurements: resetMeasurements,
      measure: measure,
      measureElement: measureElement,
      getItemOffset: getItemOffset,
      getTotalSize: getTotalSize,
      getRange: getRange,
      getVirtualItems: getVirtualItems,
      scrollToOffset: scrollToOffset,
      scrollToIndex: scrollToIndex,
      ensureVisible: ensureVisible,
      destroy: destroy
    };

    Object.defineProperties(api, {
      count: { enumerable: true, get: function () { return count; } },
      enabled: { enumerable: true, get: function () { return enabled; } },
      itemSize: { enumerable: true, get: function () { return fixedSize; } },
      estimateSize: { enumerable: true, get: function () { return estimateSize; } },
      overscan: { enumerable: true, get: function () { return overscan; } },
      itemKeys: { enumerable: true, get: function () { return itemKeys ? itemKeys.slice() : null; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } },
      requestCount: { enumerable: true, get: function () { return frame.requestCount; } },
      renderCount: { enumerable: true, get: function () { return frame.runCount; } }
    });

    refresh('init');
    return api;
  }

export const Virtualizer = Object.freeze({ create });
export { create };
