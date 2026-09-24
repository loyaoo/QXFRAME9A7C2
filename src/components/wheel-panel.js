// Canonical ESM WheelPanel runtime.
import { Utils } from '../utils/utils.js';
import { Events } from '../core/events.js';
import { DOM } from '../core/dom.js';
import { IdManager } from '../utils/id.js';
import { Scheduler } from '../core/scheduler.js';
import { ValueEquality } from '../utils/valueEquality.js';
import { WheelMetrics } from '../utils/wheelMetrics.js';
import { CapabilityController } from '../core/capabilityController.js';
import { Renderer } from '../core/renderer.js';
import { FocusController } from '../core/focusController.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { Scroll } from './scroll.js';

var own = Utils.own;
function cloneArray(value) { return Array.isArray(value) ? ValueEquality.copy(value) : []; }
function equalArray(left, right) { return ValueEquality.array(left, right); }
function normalizePositiveInteger(value, fallback, label) {
  var number = Math.floor(Number(value));
  if (!Number.isFinite(number) || number <= 0) {
    if (fallback !== undefined) return fallback;
    throw new TypeError('[QXFRAME9A7C2] WheelPanel ' + label + ' must be a positive integer.');
  }
  return number;
}
function normalizeEnum(value, allowed, fallback, label) {
  var normalized = value === undefined || value === null || value === '' ? fallback : String(value);
  if (allowed.indexOf(normalized) < 0) throw new TypeError('[QXFRAME9A7C2] WheelPanel ' + label + ' must be one of: ' + allowed.join(', ') + '.');
  return normalized;
}
function normalizeVisibleCount(value) {
  var count = normalizePositiveInteger(value, 5, 'visibleItemCount');
  if (count < 3) count = 3;
  if (count % 2 === 0) throw new TypeError('[QXFRAME9A7C2] WheelPanel visibleItemCount must be odd so the selected row has one center line.');
  return count;
}
function normalizeItem(item, columnKey, index) {
  if (!item || typeof item !== 'object') throw new TypeError('[QXFRAME9A7C2] WheelPanel item must be an object.');
  if (!own(item, 'key') || !own(item, 'value') || !own(item, 'label')) {
    throw new TypeError('[QXFRAME9A7C2] WheelPanel items require canonical key / value / label fields.');
  }
  var key = String(item.key);
  var value = String(item.value);
  if (!key) throw new TypeError('[QXFRAME9A7C2] WheelPanel item key cannot be empty.');
  return Object.freeze({
    key: key,
    value: value,
    label: String(item.label),
    disabled: item.disabled === true,
    source: item,
    columnKey: columnKey,
    index: index
  });
}
function normalizeColumn(column, index) {
  if (!column || typeof column !== 'object') throw new TypeError('[QXFRAME9A7C2] WheelPanel columns must be objects.');
  if (own(column, 'wheelStepInterval')) throw new TypeError('[QXFRAME9A7C2] WheelPanel column wheelStepInterval was removed; continuous step targeting is owned by Scroll.');
  if (own(column, 'loop') && typeof column.loop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] WheelPanel column loop must be boolean.');
  var key = own(column, 'key') ? String(column.key) : '';
  if (!key) throw new TypeError('[QXFRAME9A7C2] WheelPanel column key is required.');
  var hasItems = Array.isArray(column.items);
  var hasGetter = Utils.isFunction(column.getItems);
  if (hasItems === hasGetter) {
    throw new TypeError('[QXFRAME9A7C2] WheelPanel column ' + key + ' must define exactly one of items or getItems(context).');
  }
  return Object.freeze({
    key: key,
    label: column.label === undefined || column.label === null ? '' : String(column.label),
    items: hasItems ? column.items.slice() : null,
    getItems: hasGetter ? column.getItems : null,
    itemHeight: column.itemHeight === undefined ? null : normalizePositiveInteger(column.itemHeight, undefined, 'column itemHeight'),
    visibleItemCount: column.visibleItemCount === undefined ? null : normalizeVisibleCount(column.visibleItemCount),
    scrollbarVisibility: column.scrollbarVisibility === undefined ? null : normalizeEnum(column.scrollbarVisibility, ['auto','always','hidden'], 'auto', 'column scrollbarVisibility'),
    wheelPropagation: column.wheelPropagation === undefined ? null : column.wheelPropagation !== false,
    snapDuration: column.snapDuration === undefined ? null : Math.max(0, Number(column.snapDuration) || 0),
    snapBehavior: column.snapBehavior === undefined ? null : normalizeEnum(column.snapBehavior, ['auto','smooth'], 'smooth', 'column snapBehavior'),
    loop: column.loop === undefined ? null : column.loop === true,
    source: column,
    index: index
  });
}
function normalizeColumns(value) {
  if (!Array.isArray(value) || value.length === 0) throw new TypeError('[QXFRAME9A7C2] WheelPanel columns must be a non-empty array.');
  var seen = Object.create(null);
  return value.map(function (column, index) {
    var normalized = normalizeColumn(column, index);
    if (seen[normalized.key]) throw new TypeError('[QXFRAME9A7C2] WheelPanel column keys must be unique: ' + normalized.key + '.');
    seen[normalized.key] = true;
    return normalized;
  });
}


function create(options) {
  var itemHeightExplicit = own(options || {}, 'itemHeight');
  if (own(options || {}, 'wheelStepInterval')) throw new TypeError('[QXFRAME9A7C2] WheelPanel wheelStepInterval was removed; continuous step targeting is owned by Scroll.');
  var opts = Utils.assignOwn({
    columns: null,
    value: [],
    visibleItemCount: 7,
    scrollbarVisibility: 'auto',
    wheelPropagation: true,
    snapBehavior: 'smooth',
    snapDuration: 220,
    scrollIdleDelay: 100,
    loop: false,
    changeOnScroll: false,
    size: 'md',
    disabled: false,
    readOnly: false
  }, options || {});
  if (typeof opts.loop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] WheelPanel loop must be boolean.');
  var doc = opts.document || globalThis.document;
  var host = opts.container || null;
  if (!host || host.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] WheelPanel container must be an Element.');
  var columns = normalizeColumns(opts.columns);
  var visibleItemCount = normalizeVisibleCount(opts.visibleItemCount);
  opts.size = WheelMetrics.normalizeSize(opts.size);
  var itemHeight = normalizePositiveInteger(itemHeightExplicit ? opts.itemHeight : WheelMetrics.itemHeight(opts.size), undefined, 'itemHeight');
  opts.scrollbarVisibility = normalizeEnum(opts.scrollbarVisibility, ['auto','always','hidden'], 'auto', 'scrollbarVisibility');
  opts.snapBehavior = normalizeEnum(opts.snapBehavior, ['auto','smooth'], 'smooth', 'snapBehavior');
  opts.snapDuration = Math.max(0, Number(opts.snapDuration) || 0);
  opts.scrollIdleDelay = Math.max(0, Number(opts.scrollIdleDelay) || 0);

  var emitter = Events.createEmitter();
  var root = doc.createElement('div');
  var columnsHost = doc.createElement('div');
  var panelId = IdManager.next('wheel').replace('qxframe9a7c2-wheel-', '');
  var columnRecords = [];
  var value = [];
  var selectedItems = [];
  var destroyed = false;
  var syncing = false;
  var visibleRefreshPass = 0;
  var virtualFocusController = null, virtualFocusDomain = null, activeColumnIndex = 0;
  var keyboardRegion = null, hostedVirtualFocus = false;
  var api = null;

  root.className = 'qxframe9a7c2-wheel-panel is-' + opts.size;
  root.style.setProperty('--qxframe9a7c2-wheel-item-height', String(itemHeight) + 'px');
  columnsHost.className = 'qxframe9a7c2-wheel-panel-columns';
  root.appendChild(columnsHost);
  host.appendChild(root);

  var visibleRefreshFrame = Scheduler.createFrameScheduler(function () {
    if (destroyed || visibleRefreshPass <= 0) return;
    refresh('visible-layout-' + visibleRefreshPass);
    if (visibleRefreshPass === 1) {
      visibleRefreshPass = 2;
      visibleRefreshFrame.request('visible-layout-2');
    } else visibleRefreshPass = 0;
  });

  function contextFor(index, values, items, sourceColumns) {
    var activeColumns = sourceColumns || columns;
    return Object.freeze({
      columnIndex: index,
      columnKey: activeColumns[index].key,
      value: cloneArray(values),
      selectedValues: cloneArray(values),
      selectedItems: items.slice()
    });
  }

  function resolveItems(index, values, items, sourceColumns) {
    var activeColumns = sourceColumns || columns;
    var column = activeColumns[index];
    var raw = column.getItems ? column.getItems(contextFor(index, values, items, activeColumns)) : column.items;
    if (!Array.isArray(raw)) throw new TypeError('[QXFRAME9A7C2] WheelPanel column ' + column.key + ' items source must return an array.');
    var seen = Object.create(null);
    return raw.map(function (item, itemIndex) {
      var normalized = normalizeItem(item, column.key, itemIndex);
      if (seen[normalized.key]) throw new TypeError('[QXFRAME9A7C2] WheelPanel item keys must be unique within column ' + column.key + ': ' + normalized.key + '.');
      seen[normalized.key] = true;
      return normalized;
    });
  }

  function firstEnabled(items) {
    for (var i = 0; i < items.length; i += 1) if (!items[i].disabled) return items[i];
    return null;
  }

  function findEnabledByValue(items, target) {
    var stringTarget = target === undefined || target === null ? null : String(target);
    if (stringTarget === null) return null;
    for (var i = 0; i < items.length; i += 1) if (!items[i].disabled && items[i].value === stringTarget) return items[i];
    return null;
  }

  function normalizeValueForColumns(next, sourceColumns) {
    if (!Array.isArray(next)) throw new TypeError('[QXFRAME9A7C2] WheelPanel value must be an array aligned to columns.');
    var activeColumns = sourceColumns || columns;
    var values = new Array(activeColumns.length);
    var items = new Array(activeColumns.length);
    for (var i = 0; i < activeColumns.length; i += 1) {
      var available = resolveItems(i, values, items, activeColumns);
      var selected = findEnabledByValue(available, next[i]) || firstEnabled(available);
      values[i] = selected ? selected.value : null;
      items[i] = selected;
    }
    return { value: values, selectedItems: items };
  }
  function normalizeValue(next) { return normalizeValueForColumns(next, columns); }

  function clearColumnRecord(record) {
    if (!record) return;
    if (record.offSnap) record.offSnap();
    if (record.offSnapChange) record.offSnapChange();
    if (record.offKey) record.offKey();
    if (record.offClick) record.offClick();
    if (record.offHoverMove) record.offHoverMove();
    if (record.offHoverLeave) record.offHoverLeave();
    if (record.scroll) record.scroll.destroy('wheel-panel-column-rebuild');
    if (record.wrap && record.wrap.parentNode) record.wrap.parentNode.removeChild(record.wrap);
  }

  function destroyColumns(fromIndex) {
    var start = Math.max(0, Number(fromIndex) || 0);
    for (var i = columnRecords.length - 1; i >= start; i -= 1) {
      clearColumnRecord(columnRecords[i]);
      columnRecords.splice(i, 1);
    }
  }

  function itemIndexForValue(items, selectedValue) {
    for (var i = 0; i < items.length; i += 1) if (items[i].value === selectedValue) return i;
    return -1;
  }

  function snapIndexForItem(record, itemIndex) {
    if (!record || !record.itemElements[itemIndex]) return -1;
    return record.enabledSnapTargets.indexOf(record.itemElements[itemIndex]);
  }

  function centerRecordItem(record, itemIndex, behavior, reason) {
    var snapIndex = snapIndexForItem(record, itemIndex);
    if (snapIndex < 0) return false;
    return record.scroll.goToSnap(snapIndex, { behavior: behavior || 'auto', reason: reason || 'wheel-panel-center' });
  }


  function virtualKey(columnIndex, itemIndex) {
    var record = columnRecords[columnIndex];
    var item = record && record.items[itemIndex];
    return item ? JSON.stringify([Number(columnIndex), String(item.key)]) : null;
  }
  function parseVirtualKey(key) {
    try { var parsed = JSON.parse(String(key || '')); return Array.isArray(parsed) && parsed.length === 2 ? { columnIndex:Number(parsed[0]), itemKey:String(parsed[1]) } : null; } catch (_) { return null; }
  }
  function virtualLocation(key) {
    var parsed = parseVirtualKey(key); if (!parsed || !Number.isInteger(parsed.columnIndex)) return null;
    var record = columnRecords[parsed.columnIndex]; if (!record) return null;
    var itemIndex = record.items.findIndex(function(item){ return item && String(item.key) === parsed.itemKey && item.disabled !== true; });
    return itemIndex >= 0 ? { columnIndex:parsed.columnIndex, itemIndex:itemIndex, record:record } : null;
  }
  function ensureColumnVisible(index) {
    var record = columnRecords[index]; if (!record || !record.wrap || !columnsHost) return false;
    return ScrollVisibility.ensureVisible(columnsHost, record.wrap, { axis:'x', align:'nearest' });
  }
  function activateVirtualAt(columnIndex, itemIndex, meta) {
    activeColumnIndex = Math.max(0, Math.min(Number(columnIndex) || 0, Math.max(0, columnRecords.length - 1)));
    if (!virtualFocusDomain) return false;
    var key = virtualKey(activeColumnIndex, itemIndex); if (!key) return false;
    var source = meta && meta.source || 'keyboard';
    return virtualFocusDomain.activate(key, { source:source, modality:source === 'keyboard' ? 'keyboard' : 'pointer', reason:meta && meta.reason || 'wheel-active', originalEvent:meta && meta.originalEvent || null, ensureVisible:source === 'keyboard' });
  }
  function bindVirtualFocus(controller, hosted) {
    if (!controller || !Utils.isFunction(controller.registerDomain) || !keyboardRegion) return null;
    var record=columnRecords[activeColumnIndex] || columnRecords[0];
    var selectedIndex=record ? itemIndexForValue(record.items, value[activeColumnIndex]) : -1;
    if (record && selectedIndex < 0) selectedIndex=nearestEnabledIndex(record.items, 0);
    var activeKey=record && selectedIndex >= 0 ? virtualKey(activeColumnIndex, selectedIndex) : null;
    var binding=keyboardRegion.bindVirtualFocus({
      controller:controller,
      previousDomain:virtualFocusDomain,
      hosted:hosted,
      activeKey:activeKey,
      activation:{ reason:'bind-virtual-focus', ensureVisible:true },
      domain:{
        name:'wheel-panel-' + panelId,
        getElement:function(key){ var location=virtualLocation(key); return location ? location.record.itemElements[location.itemIndex] || null : null; },
        reconcile:function(key){
          var location=virtualLocation(key); if (location) return key;
          var normalizedColumn=Math.max(0,Math.min(activeColumnIndex,Math.max(0,columnRecords.length-1)));
          var currentRecord=columnRecords[normalizedColumn]; if (!currentRecord) return null;
          activeColumnIndex=normalizedColumn;
          var currentIndex=itemIndexForValue(currentRecord.items, value[normalizedColumn]);
          if (currentIndex < 0) currentIndex=nearestEnabledIndex(currentRecord.items, 0);
          return currentIndex >= 0 ? virtualKey(normalizedColumn, currentIndex) : null;
        },
        ensureVisible:function(key){
          var location=virtualLocation(key); if (!location) return false;
          ensureColumnVisible(location.columnIndex);
          return centerRecordItem(location.record, location.itemIndex, 'auto', 'virtual-focus');
        }
      }
    });
    if (!binding) return null;
    virtualFocusController=binding.controller;
    hostedVirtualFocus=binding.hosted;
    virtualFocusDomain=binding.domain;
    return virtualFocusDomain;
  }
  function setActiveColumn(index, meta) {
    var next=Math.max(0, Math.min(Math.floor(Number(index)||0), Math.max(0,columnRecords.length-1)));
    var record=columnRecords[next]; if (!record) return false;
    activeColumnIndex=next;
    var selectedIndex=itemIndexForValue(record.items, value[next]); if (selectedIndex < 0) selectedIndex=nearestEnabledIndex(record.items,0);
    if (selectedIndex < 0) return false;
    return activateVirtualAt(next, selectedIndex, meta || { source:'keyboard', reason:'set-active-column' });
  }
  function handleKeydown(event) {
    if (destroyed || !event || opts.disabled === true) return false;
    var readOnly = opts.readOnly === true;
    var index=Math.max(0, Math.min(activeColumnIndex, Math.max(0,columnRecords.length-1)));
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      var nextColumn=event.key === 'ArrowLeft' ? index-1 : index+1;
      if (!columnRecords[nextColumn]) {
        setActiveColumn(index, { source:'keyboard', reason:event.key + '-boundary', originalEvent:event });
        return true;
      }
      setActiveColumn(nextColumn, { source:'keyboard', reason:event.key, originalEvent:event });
      return true;
    }
    var record=columnRecords[index]; if (!record) return false;
    var enabled=[]; record.items.forEach(function(item,itemIndex){ if(!item.disabled) enabled.push(itemIndex); }); if(!enabled.length) return false;
    var current=itemIndexForValue(record.items,value[index]);
    if (virtualFocusController && virtualFocusDomain) {
      var vfState=virtualFocusController.getState ? virtualFocusController.getState() : null;
      if (vfState && vfState.domain === virtualFocusDomain.name && vfState.key) {
        var location=virtualLocation(vfState.key);
        if (location && location.columnIndex === index) current=location.itemIndex;
      }
    }
    var position=enabled.indexOf(current); if(position<0) position=0;
    var next=position;
    if(event.key==='ArrowDown') next=record.loop?(position+1)%enabled.length:Math.min(enabled.length-1,position+1);
    else if(event.key==='ArrowUp') next=record.loop?(position-1+enabled.length)%enabled.length:Math.max(0,position-1);
    else if(event.key==='PageDown') next=record.loop?(position+5)%enabled.length:Math.min(enabled.length-1,position+5);
    else if(event.key==='PageUp') next=record.loop?(position-(5%enabled.length)+enabled.length)%enabled.length:Math.max(0,position-5);
    else if(event.key==='Home') next=0;
    else if(event.key==='End') next=enabled.length-1;
    else return false;
    var target=enabled[next]; if(target===undefined) return false;
    if (!readOnly) selectIndex(index,target,{source:'keyboard',reason:event.key,originalEvent:event});
    activateVirtualAt(index,target,{source:'keyboard',reason:event.key,originalEvent:event});
    // Recognized navigation remains owned by the open Picker even when the target is
    // already selected at a boundary or the Picker is read-only.
    return true;
  }

  function renderColumn(index) {
    var column = columns[index];
    var columnItemHeight = column.itemHeight || itemHeight;
    var columnVisibleItemCount = column.visibleItemCount || visibleItemCount;
    var columnScrollbarVisibility = column.scrollbarVisibility || opts.scrollbarVisibility;
    var columnWheelPropagation = column.wheelPropagation === null ? opts.wheelPropagation !== false : column.wheelPropagation;
    var columnSnapDuration = column.snapDuration === null ? opts.snapDuration : column.snapDuration;
    var columnSnapBehavior = column.snapBehavior || opts.snapBehavior;
    var columnLoop = column.loop === null ? opts.loop === true : column.loop === true;
    var items = resolveItems(index, value, selectedItems);
    var selected = findEnabledByValue(items, value[index]) || firstEnabled(items);
    value[index] = selected ? selected.value : null;
    selectedItems[index] = selected;

    var wrap = doc.createElement('div');
    wrap.className = 'qxframe9a7c2-wheel-panel-column';
    wrap.style.setProperty('--qxframe9a7c2-wheel-item-height', String(columnItemHeight) + 'px');
    DOM.setPrivate(wrap, 'wheelColumn', column.key);
    if (column.label) {
      var title = doc.createElement('div');
      title.className = 'qxframe9a7c2-wheel-panel-column-title';
      title.textContent = column.label;
      wrap.appendChild(title);
    }
    var scrollMount = doc.createElement('div');
    scrollMount.className = 'qxframe9a7c2-wheel-panel-scroll';
    scrollMount.style.height = String(columnVisibleItemCount * columnItemHeight) + 'px';
    var pad = doc.createElement('div');
    pad.className = 'qxframe9a7c2-wheel-panel-pad';
    pad.style.height = String(((columnVisibleItemCount - 1) / 2) * columnItemHeight) + 'px';
    scrollMount.appendChild(pad);
    var itemElements = [];
    items.forEach(function (item, itemIndex) {
      var node = doc.createElement('div');
      node.className = 'qxframe9a7c2-wheel-panel-item';
      node.style.height = String(columnItemHeight) + 'px';
      node.style.lineHeight = String(columnItemHeight) + 'px';
      node.id = 'qxframe9a7c2-wheel-' + panelId + '-' + index + '-' + itemIndex;
      DOM.setPrivate(node, 'wheelItem', item.key);
      node.setAttribute('data-wheel-index', String(itemIndex));
      if (item.disabled) node.classList.add('is-disabled');
      if (selected && item.value === selected.value) { node.classList.add('is-selected'); }
      else node;
      var itemOutput = Utils.isFunction(opts.renderItem)
        ? opts.renderItem(item.source, Object.freeze({ item: item, column: column.source, columnKey: column.key, columnIndex: index, itemIndex: itemIndex, wheelPanel: api }))
        : item.label;
      Renderer.append(node, itemOutput, doc);
      scrollMount.appendChild(node);
      itemElements.push(node);
    });
    var endPad = pad.cloneNode(false);
    scrollMount.appendChild(endPad);
    wrap.appendChild(scrollMount);
    columnsHost.appendChild(wrap);

    var enabledSnapTargets = itemElements.filter(function (node, itemIndex) { return !items[itemIndex].disabled; });
    var scroll = Scroll.create({
      container: scrollMount,
      document: doc,
      axis: 'y',
      wheelAxis: 'y',
      wheelPropagation: columnWheelPropagation,
      wheelBehavior: 'snap-step',
      scrollbarVisibility: columnScrollbarVisibility,
      scrollbarInteractive: true,
      edgeShadow: false,
      keyboard: false,
      focusable: false,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      snapTargets: enabledSnapTargets,
      snapAxis: 'y',
      snapAlign: 'center',
      snapBehavior: columnSnapBehavior,
      snapDuration: columnSnapDuration,
      snapOnIdle: true,
      snapLoop: columnLoop,
      scrollIdleDelay: opts.scrollIdleDelay
    });

    var guide = doc.createElement('div');
    guide.className = 'qxframe9a7c2-wheel-panel-center-guide';
    scrollMount.appendChild(guide);
    var record = { wrap: wrap, scroll: scroll, items: items, itemElements: itemElements, enabledSnapTargets: enabledSnapTargets, snapBehavior: columnSnapBehavior, loop: columnLoop, guide: guide, offSnap: null, offSnapChange: null, offKey: null, offClick: null, offHoverMove: null, offHoverLeave: null, hoveredIndex: -1 };
    columnRecords[index] = record;

    record.offSnapChange = scroll.on('snap-change', function (detail) {
      if (destroyed || syncing || opts.changeOnScroll !== true) return;
      var snapIndex = detail && Number(detail.index);
      if (!Number.isInteger(snapIndex) || snapIndex < 0 || snapIndex >= record.enabledSnapTargets.length) return;
      var node = record.enabledSnapTargets[snapIndex];
      var itemIndex = node && node.getAttribute ? Number(node.getAttribute('data-wheel-index')) : -1;
      if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= record.items.length || record.items[itemIndex].disabled) return;
      selectIndex(index, itemIndex, { source: 'scroll', reason: 'snap-change' });
    });

    record.offSnap = scroll.on('snap-settle', function (detail) {
      if (destroyed || syncing) return;
      var node = detail && detail.element;
      var itemIndex = node && node.getAttribute ? Number(node.getAttribute('data-wheel-index')) : -1;
      if (!Number.isInteger(itemIndex) || itemIndex < 0 || itemIndex >= record.items.length || record.items[itemIndex].disabled) return;
      var source = detail.reason === 'wheel-step' ? 'wheel' : 'scroll';
      selectIndex(index, itemIndex, { source: source, reason: detail.reason || 'snap' });
      if (opts.changeOnScroll === true) emitter.emit('scrollSettle', {
        value: cloneArray(value), selectedItems: selectedItems.slice(), columnIndex: index,
        columnKey: columns[index] ? columns[index].key : null, item: selectedItems[index] || null,
        source: source, reason: detail.reason || 'snap', wheelPanel: api
      });
    });
    record.offClick = DOM.listen(scroll.getRootElement(), 'click', function (event) {
      if (destroyed || CapabilityController.mutationLocked(opts)) return;
      var node = event.target && event.target.closest ? event.target.closest('[data-wheel-index]') : null;
      if (!node || !scroll.getRootElement().contains(node)) return;
      var target = Number(node.getAttribute('data-wheel-index'));
      if (!Number.isInteger(target) || !record.items[target] || record.items[target].disabled) return;
      selectIndex(index, target, { source: 'pointer', reason: 'click', originalEvent: event });
      activateVirtualAt(index, target, { source:'pointer', reason:'click', originalEvent:event });
    });
    record.offHoverMove = DOM.listen(scroll.getRootElement(), 'pointermove', function (event) {
      if (destroyed || opts.disabled === true) return;
      var node = event.target && event.target.closest ? event.target.closest('[data-wheel-index]') : null;
      var target = node && scroll.getRootElement().contains(node) ? Number(node.getAttribute('data-wheel-index')) : -1;
      if (!Number.isInteger(target) || target < 0 || !record.items[target] || record.items[target].disabled) target = -1;
      if (target === record.hoveredIndex) return;
      record.hoveredIndex = target;
      var item = target >= 0 ? record.items[target] : null;
      var payload = { value: cloneArray(value), selectedItems: selectedItems.slice(), columnIndex: index, columnKey: column.key, item: item, source: 'pointer', reason: item ? 'item-hover' : 'item-hover-clear', originalEvent: event, wheelPanel: api };
      if (Utils.isFunction(opts.onItemHover)) opts.onItemHover(item ? item.source : null, payload);
      emitter.emit('itemHover', payload);
    });
    record.offHoverLeave = DOM.listen(scroll.getRootElement(), 'pointerleave', function (event) {
      if (record.hoveredIndex < 0) return;
      record.hoveredIndex = -1;
      var payload = { value: cloneArray(value), selectedItems: selectedItems.slice(), columnIndex: index, columnKey: column.key, item: null, source: 'pointer', reason: 'column-leave', originalEvent: event, wheelPanel: api };
      if (Utils.isFunction(opts.onItemHover)) opts.onItemHover(null, payload);
      emitter.emit('itemHover', payload);
    });

    var initialIndex = selected ? itemIndexForValue(items, selected.value) : -1;
    if (initialIndex >= 0) {
      syncing = true;
      centerRecordItem(record, initialIndex, 'auto', 'wheel-panel-init');
      syncing = false;
    }
    projectSelected(index);
  }

  function nearestEnabledIndex(items, start) {
    if (!items.length) return -1;
    if (items[start] && !items[start].disabled) return start;
    for (var distance = 1; distance < items.length; distance += 1) {
      var before = start - distance, after = start + distance;
      if (before >= 0 && items[before] && !items[before].disabled) return before;
      if (after < items.length && items[after] && !items[after].disabled) return after;
    }
    return -1;
  }

  function projectSelected(index) {
    var record = columnRecords[index];
    if (!record) return;
    var activeId = '';
    record.itemElements.forEach(function (node, itemIndex) {
      var selected = record.items[itemIndex] && record.items[itemIndex].value === value[index];
      node.classList.toggle('is-selected', selected);
      if (selected) activeId = node.id;
    });
    if (activeId) record.scroll.getRootElement();
    else record.scroll.getRootElement();
  }

  function rebuildFrom(index) {
    var start = Math.max(0, Number(index) || 0);
    destroyColumns(start);
    for (var i = start; i < columns.length; i += 1) renderColumn(i);
    activeColumnIndex = Math.max(0, Math.min(activeColumnIndex, Math.max(0, columnRecords.length - 1)));
    if (virtualFocusDomain) virtualFocusDomain.refresh({ reconcile:true });
  }

  function emitChange(previous, index, meta) {
    var payload = {
      value: cloneArray(value),
      previousValue: cloneArray(previous),
      selectedItems: selectedItems.slice(),
      columnIndex: index,
      columnKey: columns[index] ? columns[index].key : null,
      item: selectedItems[index] || null,
      source: meta && meta.source || 'api',
      reason: meta && meta.reason || 'select',
      originalEvent: meta && meta.originalEvent || null
    };
    if (Utils.isFunction(opts.onSelect)) opts.onSelect(payload.value.slice(), payload);
    if (Utils.isFunction(opts.onChange)) opts.onChange(payload.value.slice(), payload);
    emitter.emit('select', payload);
    emitter.emit('change', payload);
  }

  function selectIndex(columnIndex, itemIndex, meta) {
    if (destroyed || CapabilityController.mutationLocked(opts)) return false;
    var record = columnRecords[columnIndex];
    if (!record || !record.items[itemIndex] || record.items[itemIndex].disabled) return false;
    if (meta && (meta.source === 'keyboard' || meta.source === 'pointer')) activeColumnIndex = columnIndex;
    var previous = cloneArray(value);
    var item = record.items[itemIndex];
    var preservePhysicalPosition = !!(meta && (meta.source === 'wheel' || meta.source === 'scroll'));
    if (value[columnIndex] === item.value) {
      if (!preservePhysicalPosition) {
        syncing = true;
        centerRecordItem(record, itemIndex, meta && meta.source === 'api' ? 'auto' : record.snapBehavior, 'wheel-panel-select');
        syncing = false;
      }
      return true;
    }
    value[columnIndex] = item.value;
    selectedItems[columnIndex] = item;
    if (!preservePhysicalPosition) {
      syncing = true;
      centerRecordItem(record, itemIndex, meta && meta.source === 'api' ? 'auto' : record.snapBehavior, 'wheel-panel-select');
      syncing = false;
    }
    projectSelected(columnIndex);
    if (columnIndex + 1 < columns.length) {
      for (var i = columnIndex + 1; i < columns.length; i += 1) { value[i] = null; selectedItems[i] = null; }
      rebuildFrom(columnIndex + 1);
    }
    if (!(meta && meta.silent) && !equalArray(previous, value)) emitChange(previous, columnIndex, meta);
    return true;
  }

  function getSelectedItemsForValue(next) {
    if (destroyed) return [];
    return normalizeValue(next || []).selectedItems.slice();
  }

  function settleSelection(reason) {
    if (destroyed) return cloneArray(value);
    var index = 0;
    while (index < columns.length) {
      var record = columnRecords[index];
      if (record && record.scroll && Utils.isFunction(record.scroll.settleSnap)) {
        var settledSnap = record.scroll.settleSnap({ reason: reason || 'wheel-panel-settle' });
        if (Number.isInteger(settledSnap) && settledSnap >= 0 && settledSnap < record.enabledSnapTargets.length) {
          var node = record.enabledSnapTargets[settledSnap];
          var itemIndex = node && node.getAttribute ? Number(node.getAttribute('data-wheel-index')) : -1;
          if (Number.isInteger(itemIndex) && itemIndex >= 0 && itemIndex < record.items.length && !record.items[itemIndex].disabled) {
            selectIndex(index, itemIndex, { source: 'scroll', reason: reason || 'wheel-panel-settle' });
          }
        }
      }
      index += 1;
    }
    return cloneArray(value);
  }

  function setValue(next, meta) {
    if (destroyed) return false;
    var normalized = normalizeValue(next);
    var previous = cloneArray(value);
    value = normalized.value;
    selectedItems = normalized.selectedItems;
    rebuildFrom(0);
    refreshVisible(meta && meta.reason || 'wheel-panel-set-value');
    if (!(meta && meta.silent) && !equalArray(previous, value)) emitChange(previous, -1, Utils.assignOwn({ source: 'api', reason: 'set-value' }, meta || {}));
    return true;
  }

  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = Utils.mergeOwn( nextOptions || {});
    if (own(next, 'wheelStepInterval')) throw new TypeError('[QXFRAME9A7C2] WheelPanel wheelStepInterval was removed; continuous step targeting is owned by Scroll.');
    if (own(next, 'container') && next.container !== host) throw new Error('[QXFRAME9A7C2] WheelPanel container is immutable.');
    if (own(next, 'document') && next.document !== doc) throw new Error('[QXFRAME9A7C2] WheelPanel document is immutable.');

    var candidateColumns = own(next, 'columns') ? normalizeColumns(next.columns) : columns;
    var candidateVisibleItemCount = own(next, 'visibleItemCount') ? normalizeVisibleCount(next.visibleItemCount) : visibleItemCount;
    var candidateItemHeightExplicit = itemHeightExplicit || own(next, 'itemHeight');
    var candidateSize = own(next, 'size') ? WheelMetrics.normalizeSize(next.size) : WheelMetrics.normalizeSize(opts.size);
    var candidateItemHeight = itemHeight;
    if (own(next, 'itemHeight')) candidateItemHeight = normalizePositiveInteger(next.itemHeight, undefined, 'itemHeight');
    else if (!candidateItemHeightExplicit && own(next, 'size')) candidateItemHeight = WheelMetrics.itemHeight(candidateSize);
    if (own(next, 'scrollbarVisibility')) next.scrollbarVisibility = normalizeEnum(next.scrollbarVisibility, ['auto','always','hidden'], 'auto', 'scrollbarVisibility');
    if (own(next, 'snapBehavior')) next.snapBehavior = normalizeEnum(next.snapBehavior, ['auto','smooth'], 'smooth', 'snapBehavior');
    if (own(next, 'snapDuration')) next.snapDuration = Math.max(0, Number(next.snapDuration) || 0);
    if (own(next, 'scrollIdleDelay')) next.scrollIdleDelay = Math.max(0, Number(next.scrollIdleDelay) || 0);
    if (own(next, 'loop') && typeof next.loop !== 'boolean') throw new TypeError('[QXFRAME9A7C2] WheelPanel loop must be boolean.');
    if (own(next, 'changeOnScroll') && typeof next.changeOnScroll !== 'boolean') throw new TypeError('[QXFRAME9A7C2] WheelPanel changeOnScroll must be boolean.');
    if (own(next, 'size')) next.size = candidateSize;
    var candidateOptions = Utils.mergeOwn( opts, next);
    var requestedValue = own(next, 'value') ? next.value : value;
    var candidateValue = normalizeValueForColumns(requestedValue, candidateColumns);

    columns = candidateColumns;
    visibleItemCount = candidateVisibleItemCount;
    itemHeightExplicit = candidateItemHeightExplicit;
    itemHeight = candidateItemHeight;
    opts = candidateOptions;
    value = candidateValue.value;
    selectedItems = candidateValue.selectedItems;
    root.style.setProperty('--qxframe9a7c2-wheel-item-height', String(itemHeight) + 'px');
    ['xs','sm','md','lg','xl'].forEach(function (size) { root.classList.remove('is-' + size); });
    root.classList.add('is-' + WheelMetrics.normalizeSize(opts.size));
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    if (keyboardRegion) keyboardRegion.update({ disabled: opts.disabled === true, hosted: hostedVirtualFocus });
    rebuildFrom(0);
    refreshVisible('wheel-panel-update-options');
    return api;
  }

  function refresh(reason) {
    if (destroyed) return false;
    syncing = true;
    columnRecords.forEach(function (record, index) {
      record.scroll.refresh(reason || 'wheel-panel-refresh');
      var current = itemIndexForValue(record.items, value[index]);
      if (current >= 0) centerRecordItem(record, current, 'auto', 'wheel-panel-refresh');
    });
    syncing = false;
    return true;
  }

  function refreshVisible(reason) {
    if (destroyed) return false;
    refresh(reason || 'visible');
    visibleRefreshPass = 1;
    visibleRefreshFrame.request('visible-layout-1');
    return true;
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    visibleRefreshFrame.dispose();
    if (virtualFocusDomain) virtualFocusDomain.destroy(); virtualFocusDomain = null; virtualFocusController = null;
    if (keyboardRegion) keyboardRegion.destroy(); keyboardRegion = null;
    destroyColumns(0);
    emitter.dispose();
    if (root.parentNode) root.parentNode.removeChild(root);
    root = columnsHost = null;
    value = [];
    selectedItems = [];
    return true;
  }

  api = Object.freeze({
    setValue: setValue,
    settleSelection: settleSelection,
    getSelectedItemsForValue: getSelectedItemsForValue,
    updateOptions: updateOptions,
    refresh: refresh,
    refreshVisible: refreshVisible,
    getState: function () { return Object.freeze({ value: cloneArray(value), selectedItems: selectedItems.slice(), columnCount: columns.length, activeColumnIndex: activeColumnIndex, visibleItemCount: visibleItemCount, itemHeight: itemHeight, loop: opts.loop === true, disabled: opts.disabled === true, readOnly: opts.readOnly === true, destroyed: destroyed }); },
    getRootElement: function () { return root; },
    getColumnElement: function (index) { return columnRecords[index] ? columnRecords[index].wrap : null; },
    getColumnItems: function (index) { return columnRecords[index] ? columnRecords[index].items.slice() : []; },
    getColumnScroll: function (index) { return columnRecords[index] ? columnRecords[index].scroll : null; },
    setActiveColumn: function (index, meta) { setActiveColumn(index, meta); return api; },
    handleKeydown: handleKeydown,
    bindVirtualFocus: bindVirtualFocus,
    focus: function () { return keyboardRegion ? keyboardRegion.focus() : false; },
    getKeyboardNavigation: function () { return keyboardRegion ? keyboardRegion.keyboard : null; },
    getFocusController: function () { return keyboardRegion; },
    getVirtualFocusDomain: function () { return virtualFocusDomain; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  });

  root.classList.toggle('is-disabled', opts.disabled === true);
  root.classList.toggle('is-readonly', opts.readOnly === true);
  var initial = normalizeValue(opts.value || []);
  value = initial.value;
  selectedItems = initial.selectedItems;
  rebuildFrom(0);
  keyboardRegion = FocusController.create({
    root: root,
    document: doc,
    disabled: opts.disabled === true,
    hosted: false,
    activeRegion: 'column',
    navigation: {
      editableKeys: true,
      handlers: {
        ArrowLeft: function (detail) { return handleKeydown(detail.originalEvent); },
        ArrowRight: function (detail) { return handleKeydown(detail.originalEvent); },
        ArrowUp: function (detail) { return handleKeydown(detail.originalEvent); },
        ArrowDown: function (detail) { return handleKeydown(detail.originalEvent); },
        PageUp: function (detail) { return handleKeydown(detail.originalEvent); },
        PageDown: function (detail) { return handleKeydown(detail.originalEvent); },
        Home: function (detail) { return handleKeydown(detail.originalEvent); },
        End: function (detail) { return handleKeydown(detail.originalEvent); }
      }
    },
    onEnter: function () {
      var record = columnRecords[activeColumnIndex] || columnRecords[0];
      if (!record) return;
      var selectedIndex = itemIndexForValue(record.items, value[activeColumnIndex]);
      if (selectedIndex < 0) selectedIndex = nearestEnabledIndex(record.items, 0);
      if (selectedIndex >= 0) activateVirtualAt(activeColumnIndex, selectedIndex, { source:'keyboard', reason:'wheel-region-enter' });
    }
  });
  bindVirtualFocus(keyboardRegion.virtualFocus, false);
  return api;
}

export const WheelPanel = Object.freeze({ create });
