import { Utils } from '../utils/utils.js';

import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { EventDelegation } from './eventDelegation.js';
import { OverlayController } from './overlayController.js';

const global = globalThis;

function normalizeOrientation(value) {
  var next = String(value == null ? 'vertical' : value).toLowerCase();
  if (next !== 'vertical' && next !== 'horizontal') throw new TypeError('[QXFRAME9A7C2] ReorderInteraction orientation must be "vertical" or "horizontal".');
  return next;
}
function create(options) {
var source = options || {};
var root = source.root;
if (!root || root.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] ReorderInteraction root must be an Element.');
if (typeof source.getItems !== 'function' || typeof source.getRowElement !== 'function' || typeof source.onMove !== 'function') {
  throw new TypeError('[QXFRAME9A7C2] ReorderInteraction requires getItems, getRowElement, and onMove.');
}
var doc = source.document || root.ownerDocument || global.document;
var view = doc && doc.defaultView || global;
var scope = Lifecycle.createScope();
var delegation = EventDelegation.create({ root: root });
var session = null;
var destroyed = false;
var api = null;
var rowSelector = source.rowSelector || '.qxframe9a7c2-sort-item';
  
function option(name, fallback) {
  var value = source[name];
  return typeof value === 'function' ? value() : (value === undefined ? fallback : value);
}
function orientation() { return normalizeOrientation(option('orientation', 'vertical')); }
function locked() { return destroyed || option('disabled', false) === true || option('readOnly', false) === true; }
function draggable() { return option('draggable', true) !== false; }
function dataVersion() { return typeof source.getDataVersion === 'function' ? source.getDataVersion() : null; }
function handleSelector() {
  var value = option('handleSelector', null);
  return value == null || value === '' ? null : String(value);
}
function entries() {
  var raw = source.getItems() || [];
  return Array.prototype.slice.call(raw).map(function (item, index) {
    var rawKey = typeof source.getKey === 'function' ? source.getKey(item, index) : (item && item.key !== undefined && item.key !== null ? item.key : index);
    var key = String(rawKey);
    return { key: key, disabled: !!(item && item.disabled === true), item: item };
  });
}
function rowForKey(key) { return source.getRowElement(String(key)) || null; }
function keyOfRow(row) {
  if (typeof source.getKeyFromRow === 'function') return String(source.getKeyFromRow(row));
  return String(row && row.dataset ? DOM.getPrivate(row, 'sortKey') : '');
}
function indexOfKey(key) {
  var list = entries();
  for (var i = 0; i < list.length; i += 1) if (list[i].key === String(key)) return i;
  return -1;
}
function entryForKey(key) {
  var list = entries();
  for (var i = 0; i < list.length; i += 1) if (list[i].key === String(key)) return list[i];
  return null;
}
function notify(name, detail) {
  if (typeof source[name] !== 'function') return;
  source[name](Utils.assignOwn({ instance: typeof source.getInstance === 'function' ? source.getInstance() : null }, detail || {}));
}
function axisConfig() {
  return orientation() === 'horizontal'
    ? { coordinate: 'clientX', scroll: 'scrollLeft', client: 'clientWidth', size: 'scrollWidth', start: 'left', end: 'right', overflow: 'overflowX' }
    : { coordinate: 'clientY', scroll: 'scrollTop', client: 'clientHeight', size: 'scrollHeight', start: 'top', end: 'bottom', overflow: 'overflowY' };
}
function scrollableAncestors() {
  var axis = axisConfig();
  var output = [];
  var node = root;
  while (node && node.nodeType === 1) {
    var canScroll = Number(node[axis.size] || 0) > Number(node[axis.client] || 0) + 1;
    var style = view && view.getComputedStyle ? view.getComputedStyle(node) : null;
    var overflow = style ? String(style[axis.overflow] || '') : '';
    if (canScroll && /^(?:auto|scroll|overlay)$/.test(overflow)) output.push(node);
    node = node.parentElement;
  }
  var scrolling = doc.scrollingElement || doc.documentElement;
  if (scrolling && output.indexOf(scrolling) < 0 && Number(scrolling[axis.size] || 0) > Number(scrolling[axis.client] || 0) + 1) output.push(scrolling);
  return output;
}
function autoScroll(event) {
  if (!session || !session.scrollContainers || !session.scrollContainers.length) return false;
  var axis = axisConfig();
  var point = Number(event[axis.coordinate] || 0);
  var threshold = 44;
  for (var i = 0; i < session.scrollContainers.length; i += 1) {
    var container = session.scrollContainers[i];
    var rect;
    if (container === doc.scrollingElement || container === doc.documentElement || container === doc.body) {
      var viewportWidth = view.innerWidth || doc.documentElement.clientWidth || 0;
      var viewportHeight = view.innerHeight || doc.documentElement.clientHeight || 0;
      rect = { top: 0, left: 0, right: viewportWidth, bottom: viewportHeight };
    } else if (container.getBoundingClientRect) rect = container.getBoundingClientRect();
    if (!rect) continue;
    var start = Number(rect[axis.start] || 0);
    var end = Number(rect[axis.end] || 0);
    if (point < start || point > end) continue;
    var fromStart = point - start;
    var fromEnd = end - point;
    var direction = fromStart < threshold ? -1 : (fromEnd < threshold ? 1 : 0);
    if (!direction) continue;
    var current = Number(container[axis.scroll] || 0);
    var max = Math.max(0, Number(container[axis.size] || 0) - Number(container[axis.client] || 0));
    if ((direction < 0 && current <= 0) || (direction > 0 && current >= max)) continue;
    var distance = direction < 0 ? fromStart : fromEnd;
    var strength = Math.max(0, Math.min(1, (threshold - distance) / threshold));
    var delta = direction * Math.max(6, Math.round(22 * strength));
    var next = Math.max(0, Math.min(max, current + delta));
    container[axis.scroll] = next;
    if (Number(container[axis.scroll] || 0) !== current) return true;
  }
  return false;
}
function clearVisual() {
  entries().forEach(function (entry) {
    var row = rowForKey(entry.key);
    if (!row) return;
    row.classList.remove('is-dragging','is-drag-before','is-drag-after');
  });
}
function dropSlot(event) {
  var axis = axisConfig();
  var point = Number(event[axis.coordinate] || 0);
  var remaining = entries().filter(function (entry) { return entry.key !== session.key; }).map(function (entry) {
    return { key: entry.key, row: rowForKey(entry.key) };
  }).filter(function (entry) { return !!entry.row; });
  var slot = remaining.length;
  for (var i = 0; i < remaining.length; i += 1) {
    var rect = remaining[i].row.getBoundingClientRect();
    var midpoint = (Number(rect[axis.start] || 0) + Number(rect[axis.end] || 0)) / 2;
    if (point < midpoint) { slot = i; break; }
  }
  return {
    targetIndex: slot,
    markerRow: remaining.length ? (slot < remaining.length ? remaining[slot].row : remaining[remaining.length - 1].row) : null,
    before: slot < remaining.length
  };
}
function fallbackDropSlot(event) {
  var target = event && event.target && event.target.closest ? event.target.closest(rowSelector) : null;
  if (!target || !root.contains(target)) return null;
  var key = keyOfRow(target);
  if (!key || key === session.key) return null;
  var remaining = entries().filter(function (entry) { return entry.key !== session.key; });
  for (var i = 0; i < remaining.length; i += 1) {
    if (remaining[i].key === key) return { targetIndex: i, markerRow: target, before: true };
  }
  return null;
}
function createOverlay(row, event) {
  if (!row || !doc.body) return null;
  var rect = row.getBoundingClientRect ? row.getBoundingClientRect() : { width:0, height:0 };
  var overlay = row.cloneNode(true);
  overlay.classList.add('qxframe9a7c2-sort-overlay');
  overlay.classList.remove('is-dragging','is-drag-before','is-drag-after');
  overlay.removeAttribute('draggable');
  overlay.removeAttribute('id');
  overlay.removeAttribute('name');
  overlay.removeAttribute('form');
  overlay.setAttribute('inert', '');
  try { overlay.inert = true; } catch (_) {}
  overlay.tabIndex = -1;
  if (overlay.querySelectorAll) Array.prototype.forEach.call(overlay.querySelectorAll('[id],[name],[form],[tabindex],button,input,select,textarea,a[href],[contenteditable]'), function (node) {
    if (node.removeAttribute) { node.removeAttribute('id'); node.removeAttribute('name'); node.removeAttribute('form'); node.removeAttribute('contenteditable'); }
    if ('disabled' in node) try { node.disabled = true; } catch (_) {}
    if ('tabIndex' in node) try { node.tabIndex = -1; } catch (_) {}
  });
  overlay.style.width = Math.max(0, Number(rect.width) || row.offsetWidth || 0) + 'px';
  overlay.style.height = Math.max(0, Number(rect.height) || row.offsetHeight || 0) + 'px';
  doc.body.appendChild(overlay);
  var layerLease = OverlayController.createLayerLease({
    element: overlay,
    document: doc,
    kind: 'drag',
    componentType: String(source.componentType || 'sort'),
    zIndexOffset: Number(option('zIndexOffset', 0)) || 0
  });
  positionOverlay(overlay, event);
  return { element:overlay, layerLease:layerLease };
}
function positionOverlay(overlay, event) {
  if (!overlay || !event) return;
  var x = Number(event.clientX), y = Number(event.clientY);
  if (!Number.isFinite(x) || !Number.isFinite(y) || (!x && !y)) return;
  overlay.style.left = (x + 12) + 'px';
  overlay.style.top = (y + 12) + 'px';
}
function removeOverlay(active) {
  if (!active) return;
  if (active.overlayLease) {
    active.overlayLease.destroy();
    active.overlayLease = null;
  }
  if (active.overlay) {
    DOM.removeNode(active.overlay);
    active.overlay = null;
  }
}
function cancelDrag(reason, event) {
  if (!session) return false;
  var active = session;
  session = null;
  removeOverlay(active);
  clearVisual();
  notify('onDragCancel', { key: active.key, fromIndex: active.fromIndex, reason: reason || 'cancel', originalEvent: event || null });
  return true;
}
function beginDrag(event, row) {
  if (locked() || !draggable()) { if (event.preventDefault) event.preventDefault(); return false; }
  var key = keyOfRow(row);
  var index = indexOfKey(key);
  var entry = entryForKey(key);
  if (index < 0 || !entry || entry.disabled) { if (event.preventDefault) event.preventDefault(); return false; }
  if (typeof source.canStart === 'function' && source.canStart({ key: key, item: entry.item, fromIndex: index, originalEvent: event, instance: api }) === false) { if (event.preventDefault) event.preventDefault(); return false; }
  var requiredHandle = handleSelector();
  if (requiredHandle) {
    var handle = event.target && event.target.closest ? event.target.closest(requiredHandle) : null;
    if (!handle || !row.contains(handle)) { if (event.preventDefault) event.preventDefault(); return false; }
  }
  var ghost = createOverlay(row, event);
  session = { key: key, fromIndex: index, targetIndex: index, before: true, hasPointerSlot: false, dropAllowed: true, dataVersion: dataVersion(), scrollContainers: scrollableAncestors(), overlay: ghost && ghost.element || null, overlayLease: ghost && ghost.layerLease || null };
  row.classList.add('is-dragging');
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    try { event.dataTransfer.setData('text/plain', key); } catch (_) {}
  }
  notify('onDragStart', { key: key, item: entry.item, fromIndex: index, originalEvent: event });
  return true;
}
function updateDrag(event) {
  if (!session) return false;
  if (event.preventDefault) event.preventDefault();
  if (option('stopPropagation', false) === true && event.stopPropagation) event.stopPropagation();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  autoScroll(event);
  positionOverlay(session.overlay, event);
  if (session.dataVersion !== dataVersion()) { cancelDrag('data-version', event); return false; }
  var slot = dropSlot(event);
  var targetKey = slot.markerRow ? keyOfRow(slot.markerRow) : null;
  var dropDetail = { key: session.key, sourceKey: session.key, fromIndex: session.fromIndex, toIndex: slot.targetIndex, targetIndex: slot.targetIndex, targetKey: targetKey, before: slot.before, originalEvent: event, instance: api };
  session.dropAllowed = typeof source.canDrop !== 'function' || source.canDrop(dropDetail) !== false;
  var changedSlot = session.targetIndex !== slot.targetIndex || session.before !== slot.before;
  session.targetIndex = slot.targetIndex;
  session.before = slot.before;
  session.hasPointerSlot = true;
  clearVisual();
  var moving = rowForKey(session.key);
  if (moving) { moving.classList.add('is-dragging'); }
  if (slot.markerRow && session.dropAllowed) slot.markerRow.classList.add(slot.before ? 'is-drag-before' : 'is-drag-after');
  if (typeof source.onPreview === 'function') source.onPreview(Utils.mergeOwn( dropDetail, { allowed: session.dropAllowed }));
  if (changedSlot) notify('onDragMove', { key: session.key, fromIndex: session.fromIndex, toIndex: slot.targetIndex, allowed: session.dropAllowed, originalEvent: event });
  return true;
}
function finishDrag(event) {
  if (!session) return false;
  if (session.dataVersion !== dataVersion()) return cancelDrag('data-version', event);
  if (session.dropAllowed === false) return cancelDrag('forbidden-drop', event);
  if (event && event.preventDefault) event.preventDefault();
  if (option('stopPropagation', false) === true && event && event.stopPropagation) event.stopPropagation();
  if (!session.hasPointerSlot) {
    var fallback = fallbackDropSlot(event);
    if (fallback) { session.targetIndex = fallback.targetIndex; session.before = fallback.before; }
  }
  var active = session;
  session = null;
  removeOverlay(active);
  clearVisual();
  if (active.targetIndex === active.fromIndex) {
    notify('onDragEnd', { key: active.key, fromIndex: active.fromIndex, toIndex: active.fromIndex, changed: false, originalEvent: event || null });
    return false;
  }
  var commitDetail = { key: active.key, sourceKey: active.key, fromIndex: active.fromIndex, toIndex: active.targetIndex, source: 'pointer', reason: 'drag', originalEvent: event || null };
  var changed = source.onMove(commitDetail) !== false;
  if (changed && typeof source.onCommit === 'function') source.onCommit(Utils.mergeOwn( commitDetail));
  var finalIndex = changed ? indexOfKey(active.key) : active.fromIndex;
  notify('onDragEnd', { key: active.key, fromIndex: active.fromIndex, toIndex: finalIndex < 0 ? active.targetIndex : finalIndex, changed: changed, originalEvent: event || null });
  return changed;
}
  
scope.add(function () { delegation.destroy(); });
scope.add(delegation.on('dragstart', rowSelector, function (detail) { beginDrag(detail.event, detail.target); }));
scope.add(DOM.listen(root, 'dragover', function (event) { if (session) updateDrag(event); }));
scope.add(DOM.listen(root, 'drop', function (event) { if (session) finishDrag(event); }));
scope.add(delegation.on('dragend', rowSelector, function (detail) { if (session) cancelDrag('dragend', detail.event); }));
scope.add(DOM.listen(doc, 'keydown', function (event) {
  if (session && event.key === 'Escape') { event.preventDefault(); cancelDrag('escape', event); }
}, true));
scope.add(DOM.listen(doc, 'contextmenu', function (event) {
  if (!session) return;
  event.preventDefault();
  cancelDrag('contextmenu', event);
}, true));
  
api = Object.freeze({
  cancelDrag: function (reason) { return cancelDrag(reason || 'api'); },
  getState: function () { return Object.freeze({ dragging: !!session, dragOverlay: !!(session && session.overlay), key: session ? session.key : null, fromIndex: session ? session.fromIndex : -1, toIndex: session ? session.targetIndex : -1, destroyed: destroyed }); },
  destroy: function () {
    if (destroyed) return false;
    if (session) cancelDrag('destroy');
    destroyed = true;
    scope.dispose();
    return true;
  }
});
return api;
}

export const ReorderInteraction = Object.freeze({ create });
export { create };
