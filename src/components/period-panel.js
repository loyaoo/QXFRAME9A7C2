import { Events } from '../core/events.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { TemporalGrid } from '../core/temporalGrid.js';
import { CapabilityController } from '../core/capabilityController.js';
import { FocusController } from '../core/focusController.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { mergeOptions } from '../core/options.js';
import { DateUnit } from '../utils/dateUnit.js';

let DOMFactory;
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-period-panel qxframe9a7c2-date-panel" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-period-panel-header qxframe9a7c2-date-panel-header" data-qxframe9a7c2-ref="header">
      <button type="button" class="qxframe9a7c2-button is-default is-text is-square qxframe9a7c2-period-panel-nav qxframe9a7c2-date-panel-nav" data-qxframe9a7c2-ref="prev"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-left is-line is-round is-stroke-3"></span></button>
      <button type="button" class="qxframe9a7c2-period-panel-title qxframe9a7c2-date-panel-title qxframe9a7c2-date-panel-title-action" data-qxframe9a7c2-ref="title"></button>
      <button type="button" class="qxframe9a7c2-button is-default is-text is-square qxframe9a7c2-period-panel-nav qxframe9a7c2-date-panel-nav" data-qxframe9a7c2-ref="next"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-right is-line is-round is-stroke-3"></span></button>
    </div>
    <div class="qxframe9a7c2-period-panel-grid" data-qxframe9a7c2-ref="grid"></div>
  </div>`;
    
function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  return { root: instance.root, refs: instance.refs };
}
function createCell(context) {
  var cell = context.document.createElement('button');
  cell.type = 'button';
  cell.className = 'qxframe9a7c2-period-panel-cell qxframe9a7c2-date-panel-cell';
  return cell;
}
    
DOMFactory = Object.freeze({ createDefaultDOM: createDefaultDOM, createCell: createCell, blueprint: blueprint });

function clone(value) { return DateUnit.clone(value); }
function normalizeUnit(value) {
  var unit = String(value || 'month').toLowerCase();
  if (['month', 'quarter', 'year'].indexOf(unit) < 0) {
    throw new TypeError('[QXFRAME9A7C2] PeriodPanel unit must be month, quarter, or year.');
  }
  return unit;
}
function pageStart(value, unit) {
  var date = DateUnit.start(value, unit, 0, false) || new Date();
  if (unit === 'year') return new Date(Math.floor(date.getFullYear() / 10) * 10, 0, 1);
  return new Date(date.getFullYear(), 0, 1);
}
function addPage(value, unit, amount) {
  var next = clone(value);
  if (!next) return null;
  if (unit === 'year') next.setFullYear(next.getFullYear() + Number(amount || 0) * 10);
  else next.setFullYear(next.getFullYear() + Number(amount || 0));
  return pageStart(next, unit);
}
function addUnit(value, unit, amount) {
  var next = clone(value);
  var n = Number(amount || 0);
  if (!next) return null;
  if (unit === 'year') next.setFullYear(next.getFullYear() + n);
  else if (unit === 'quarter') next.setMonth(next.getMonth() + n * 3);
  else next.setMonth(next.getMonth() + n);
  return DateUnit.start(next, unit, 0, false);
}
function labelFor(value, unit) {
  if (unit === 'year') return String(value.getFullYear());
  if (unit === 'quarter') return 'Q' + String(DateUnit.quarter(value));
  return String(value.getMonth() + 1).padStart(2, '0');
}
    
function create(options) {
  var opts = mergeOptions({ unit: 'month' }, options);
  var doc = opts.document || (opts.container && opts.container.ownerDocument) || globalThis.document;
  var unit = normalizeUnit(opts.unit);
  var emitter = Events.createEmitter();
  var scope = Lifecycle.createScope();
  var destroyed = false;
  var domBinding = null;
  var root = null;
  var title = null;
  var grid = null;
  var keyboard = null, keyboardRegion = null, virtualFocusController = null, virtualFocusDomain = null, hostedVirtualFocus = false;
  var delegation = null;
  var items = [];
  var value = DateUnit.start(opts.value !== undefined ? DateUnit.parse(opts.value, { unit: unit }) : null, unit, 0, false);
  var viewValue = pageStart(DateUnit.parse(opts.viewValue || opts.defaultViewValue, { unit: unit }) || value || new Date(), unit);
  var activeValue = DateUnit.start(DateUnit.parse(opts.activeValue, { unit: unit }) || value || viewValue, unit, 0, false);
  var hoveredKey = null;
  var api = null;
    
  function isDisabled(date) {
    return opts.disabled === true || (typeof opts.disabledValue === 'function' && opts.disabledValue(clone(date), Object.freeze({ unit: unit, periodPanel: api })) === true);
  }
  function itemState(date) {
    var state = typeof opts.getItemState === 'function'
      ? opts.getItemState(clone(date), Object.freeze({ unit: unit, periodPanel: api }))
      : null;
    return state && typeof state === 'object' ? state : {};
  }
  function buildItems() {
    var output = [];
    var count = unit === 'year' ? 12 : (unit === 'quarter' ? 4 : 12);
    var start = pageStart(viewValue, unit);
    for (var i = 0; i < count; i += 1) {
      var date = unit === 'year'
        ? new Date(start.getFullYear() + i, 0, 1)
        : (unit === 'quarter' ? new Date(start.getFullYear(), i * 3, 1) : new Date(start.getFullYear(), i, 1));
      output.push({ key: DateUnit.key(date, unit, 0), date: date, label: labelFor(date, unit), disabled: isDisabled(date) });
    }
    items = output;
    return output;
  }
  function titleText() {
    if (unit === 'year') return viewValue.getFullYear() + '–' + (viewValue.getFullYear() + 11);
    return String(viewValue.getFullYear());
  }
  function syncStates() {
    if (!grid) return;
    var nodes = DOM.findAllPrivate(grid, 'periodKey');
    for (var i = 0; i < nodes.length; i += 1) {
      var key = DOM.getPrivate(nodes[i], 'periodKey');
      var entry = items.find(function (candidate) { return candidate.key === key; });
      if (!entry) continue;
      var state = itemState(entry.date);
      var selected = Object.prototype.hasOwnProperty.call(state, 'selected') ? state.selected === true : DateUnit.same(entry.date, value, unit, 0);
      nodes[i].classList.toggle('is-selected', selected);
      nodes[i].classList.toggle('is-current', DateUnit.same(entry.date, new Date(), unit, 0));
      nodes[i].classList.toggle('is-in-range', state.inRange === true);
      nodes[i].classList.toggle('is-range-start', state.rangeStart === true);
      nodes[i].classList.toggle('is-range-end', state.rangeEnd === true);
      nodes[i].classList.toggle('is-active', !!activeValue && DateUnit.same(entry.date, activeValue, unit, 0));
    }
    if (virtualFocusDomain) virtualFocusDomain.refresh({ reconcile: true });
  }
  function render() {
    if (!root || destroyed) return;
    buildItems();
    title.textContent = titleText();
    title.disabled = opts.disabled === true || typeof opts.onTitleRequest !== 'function';
    grid.textContent = '';
    var fragment = doc.createDocumentFragment();
    items.forEach(function (entry) {
      var button = DOMFactory.createCell({ document: doc, options: opts, entry: entry });
      button.textContent = entry.label;
      DOM.setPrivate(button, 'periodKey', entry.key);
      button.disabled = entry.disabled === true;
      button.tabIndex = -1;
      fragment.appendChild(button);
    });
    grid.appendChild(fragment);
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    syncStates();
  }
  function changeView(next, meta) {
    if (destroyed) return false;
    var parsed = DateUnit.parse(next, { unit: unit });
    if (!parsed) return false;
    var previous = clone(viewValue);
    viewValue = pageStart(parsed, unit);
    render();
    var detail = { viewValue: clone(viewValue), previousViewValue: previous, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-view', periodPanel: api };
    if (!(meta && meta.silent)) {
      if (typeof opts.onViewChange === 'function') opts.onViewChange(clone(viewValue), detail);
      emitter.emit('viewChange', detail);
    }
    return true;
  }
  function setActiveValue(next, meta) {
    if (destroyed) return false;
    var parsed = DateUnit.parse(next, { unit: unit });
    if (!parsed || isDisabled(parsed)) return false;
    activeValue = DateUnit.start(parsed, unit, 0, false);
    var currentPage = pageStart(activeValue, unit);
    if (currentPage.getTime() !== pageStart(viewValue, unit).getTime()) changeView(activeValue, { source: meta && meta.source || 'api', reason: 'active-view', silent: true });
    syncStates();
    var activeKey = DateUnit.key(activeValue, unit, 0);
    if (virtualFocusDomain && activeKey) virtualFocusDomain.activate(activeKey, {
      source: meta && meta.source || 'api',
      modality: meta && meta.source === 'keyboard' ? 'keyboard' : (meta && meta.source === 'pointer' ? 'pointer' : (virtualFocusController ? virtualFocusController.getState().modality : 'pointer')),
      reason: meta && meta.reason || 'period-active',
      originalEvent: meta && meta.originalEvent || null,
      ensureVisible: meta && meta.source === 'keyboard'
    });
    var detail = { value: clone(activeValue), source: meta && meta.source || 'api', reason: meta && meta.reason || 'active', periodPanel: api };
    if (!(meta && meta.silent)) {
      if (typeof opts.onActiveChange === 'function') opts.onActiveChange(clone(activeValue), detail);
      emitter.emit('activeChange', detail);
    }
    return true;
  }
  function select(next, meta) {
    if (destroyed || CapabilityController.mutationLocked(opts)) return false;
    var parsed = DateUnit.parse(next, { unit: unit });
    if (!parsed || isDisabled(parsed)) return false;
    var normalized = DateUnit.start(parsed, unit, 0, false);
    var previous = clone(value);
    value = normalized;
    setActiveValue(normalized, { source: meta && meta.source || 'api', reason: 'select-active', silent: true });
    syncStates();
    var detail = { value: clone(value), previousValue: previous, source: meta && meta.source || 'api', reason: meta && meta.reason || 'select', originalEvent: meta && meta.originalEvent || null, periodPanel: api };
    if (typeof opts.onSelect === 'function') opts.onSelect(clone(value), detail);
    emitter.emit('select', detail);
    if (!DateUnit.same(previous, value, unit, 0)) {
      if (typeof opts.onChange === 'function') opts.onChange(clone(value), detail);
      emitter.emit('change', detail);
    }
    return true;
  }
  function setValue(next, meta) {
    if (destroyed) return false;
    var parsed = next === null || next === undefined || next === '' ? null : DateUnit.parse(next, { unit: unit });
    if (next !== null && next !== undefined && next !== '' && !parsed) return false;
    var previous = clone(value);
    value = parsed ? DateUnit.start(parsed, unit, 0, false) : null;
    if (value) {
      activeValue = clone(value);
      if (!(meta && meta.syncView === false)) viewValue = pageStart(value, unit);
    }
    render();
    if (!(meta && meta.silent) && !DateUnit.same(previous, value, unit, 0)) {
      var detail = { value: clone(value), previousValue: previous, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-value', periodPanel: api };
      if (typeof opts.onChange === 'function') opts.onChange(clone(value), detail);
      emitter.emit('change', detail);
    }
    return true;
  }
  function moveActive(amount, meta) {
    var current = activeValue || value || viewValue;
    var next = addUnit(current, unit, amount);
    var guard = 0;
    while (next && isDisabled(next) && guard < 240) { next = addUnit(next, unit, amount < 0 ? -1 : 1); guard += 1; }
    if (!next || guard >= 240) return false;
    return setActiveValue(next, meta);
  }
  function onKeydown(event) {
    if (!event || opts.disabled === true) return false;
    var eventTarget = event.target || null;
    var navTarget = eventTarget ? DOM.closestPrivate(eventTarget, root, 'periodNav') : null;
    var titleTarget = eventTarget ? DOM.closestPrivate(eventTarget, root, 'periodTitle') : null;
    if (navTarget && (event.key === 'Enter' || event.key === ' ')) return false;
    if (titleTarget) {
      if ((event.key === 'Enter' || event.key === ' ') && typeof opts.onTitleRequest === 'function') {
        var titleDetail = { unit:unit, viewValue:clone(viewValue), source:'keyboard', reason:'title-keyboard', originalEvent:event, periodPanel:api };
        opts.onTitleRequest(clone(viewValue), titleDetail);
        emitter.emit('titleRequest', titleDetail);
        return true;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') return changeView(addPage(viewValue, unit, -1), { source:'keyboard', reason:'title-page-prev', originalEvent:event });
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') return changeView(addPage(viewValue, unit, 1), { source:'keyboard', reason:'title-page-next', originalEvent:event });
      return false;
    }
    var action = TemporalGrid.keyAction(event.key, { columns:4 });
    if (!action) return false;
    if (action.type === 'step') return moveActive(action.amount, { source:'keyboard', reason:event.key });
    if (action.type === 'page') return changeView(addPage(viewValue, unit, action.amount), { source:'keyboard', reason:event.key, originalEvent:event });
    if (action.type === 'home') return setActiveValue(items[0] && items[0].date, { source:'keyboard', reason:'Home' });
    if (action.type === 'end') return setActiveValue(items[items.length - 1] && items[items.length - 1].date, { source:'keyboard', reason:'End' });
    if (action.type === 'activate') return select(activeValue || value || viewValue, { source:'keyboard', reason:'activate', originalEvent:event });
    return false;
  }
  function setHoverValue(next, meta) {
    if (destroyed) return false;
    var parsed = next === null || next === undefined || next === '' ? null : DateUnit.parse(next, { unit: unit });
    var normalized = parsed ? DateUnit.start(parsed, unit, 0, false) : null;
    var nextKey = normalized ? DateUnit.key(normalized, unit, 0) : null;
    if (nextKey === hoveredKey) return false;
    hoveredKey = nextKey;
    var detail = { value: clone(normalized), unit: unit, source: meta && meta.source || 'pointer', reason: meta && meta.reason || (normalized ? 'hover' : 'hover-leave'), originalEvent: meta && meta.originalEvent || null, periodPanel: api };
    if (typeof opts.onHoverChange === 'function') opts.onHoverChange(clone(normalized), detail);
    emitter.emit('hoverChange', detail);
    return true;
  }
    
  function mount() {
    var host = opts.container || null;
    if (!host && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] PeriodPanel container is required unless options.elements supplies existing DOM.');
    domBinding = DOMBinding.resolve({
      options: opts,
      target: host,
      component: api,
      requiredRefs: ['root', 'title', 'grid', 'prev', 'next'],
      defaultFactory: DOMFactory.createDefaultDOM
    });
    root = domBinding.refs.root;
    title = domBinding.refs.title;
    grid = domBinding.refs.grid;
    root.tabIndex = hostedVirtualFocus ? -1 : 0;
    domBinding.refs.prev.tabIndex = -1;
    domBinding.refs.next.tabIndex = -1;
    title.tabIndex = typeof opts.onTitleRequest === 'function' && opts.disabled !== true ? 0 : -1;
    DOM.setPrivate(domBinding.refs.prev, 'periodNav', '-1');
    DOM.setPrivate(domBinding.refs.next, 'periodNav', '1');
    DOM.setPrivate(title, 'periodTitle', 'title');
    delegation = EventDelegation.create({ root: root });
    scope.add(function () { delegation.destroy(); });
    scope.add(DOM.listen(root, 'pointerdown', function (event) {
      var target = event && event.target ? (DOM.closestPrivate(event.target, root, 'periodKey') || DOM.closestPrivate(event.target, root, 'periodNav') || DOM.closestPrivate(event.target, root, 'periodTitle')) : null;
      if (target && root.contains(target) && event.preventDefault) event.preventDefault();
    }));
    scope.add(DOM.listen(root, 'pointermove', function (event) {
      var target = event && event.target ? DOM.closestPrivate(event.target, root, 'periodKey') : null;
      var entry = target ? items.find(function (candidate) { return candidate.key === DOM.getPrivate(target, 'periodKey'); }) : null;
      if (entry && !entry.disabled) setHoverValue(entry.date, { source: 'pointer', reason: 'cell-hover', originalEvent: event });
      else if (hoveredKey !== null) setHoverValue(null, { source: 'pointer', reason: 'cell-hover-clear', originalEvent: event });
    }));
    scope.add(DOM.listen(root, 'pointerleave', function (event) {
      if (hoveredKey !== null) setHoverValue(null, { source: 'pointer', reason: 'panel-leave', originalEvent: event });
    }));
    delegation.on('click', DOM.privateMatcher('periodNav'), function (payload) {
      if (opts.disabled === true) return;
      changeView(addPage(viewValue, unit, Number(DOM.getPrivate(payload.target, 'periodNav'))), { source: DOM.activationSource(payload.event), reason: 'nav' });
      if (!hostedVirtualFocus) DOM.focusElement(root);
    });
    delegation.on('click', DOM.privateMatcher('periodTitle'), function (payload) {
      if (opts.disabled === true || typeof opts.onTitleRequest !== 'function') return;
      var detail = { unit:unit, viewValue:clone(viewValue), source:DOM.activationSource(payload.event), reason:'title', originalEvent:payload.event, periodPanel:api };
      opts.onTitleRequest(clone(viewValue), detail);
      emitter.emit('titleRequest', detail);
      if (!hostedVirtualFocus) DOM.focusElement(root);
    });
    delegation.on('click', DOM.privateMatcher('periodKey'), function (payload) {
      var entry = items.find(function (candidate) { return candidate.key === DOM.getPrivate(payload.target, 'periodKey'); });
      if (!entry) return;
      select(entry.date, { source: DOM.activationSource(payload.event), reason: 'cell', originalEvent: payload.event });
      if (!hostedVirtualFocus) DOM.focusElement(root);
    });
    keyboardRegion = FocusController.create({
      root: root,
      hosted: false,
      disabled: opts.disabled === true,
      activeRegion: 'period',
      navigation: {
        handlers: FocusController.forwardHandlers(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','Enter',' '], onKeydown)
      },
      onEnter: function (detail) {
        var key = activeValue ? DateUnit.key(activeValue, unit, 0) : null;
        if (!key && items.length) { var firstEnabled = items.find(function (entry) { return entry.disabled !== true; }); key = firstEnabled ? firstEnabled.key : null; }
        if (virtualFocusDomain && key) virtualFocusDomain.activate(key, { source:'keyboard', modality:'keyboard', reason:'period-region-enter', originalEvent:detail.originalEvent, ensureVisible:true });
      }
    });
    keyboard = keyboardRegion.keyboard;
    scope.add(function () { if (keyboardRegion) keyboardRegion.destroy(); keyboardRegion = null; keyboard = null; });
    bindVirtualFocus(keyboard.virtualFocus, false);
    render();
  }
  function getItemElement(key) {
    if (!grid) return null;
    var nodes = DOM.findAllPrivate(grid, 'periodKey');
    for (var i = 0; i < nodes.length; i += 1) if (String(DOM.getPrivate(nodes[i], 'periodKey')) === String(key)) return nodes[i];
    return null;
  }
  function ensureItemVisible(key) {
    var element = getItemElement(key);
    return element && grid ? ScrollVisibility.ensureVisible(grid, element, { axis:'both', align:'nearest' }) : false;
  }
  function bindVirtualFocus(controller, hosted) {
    var currentKey = activeValue ? DateUnit.key(activeValue, unit, 0) : null;
    var binding = keyboardRegion.bindVirtualFocus({
      controller: controller,
      previousDomain: virtualFocusDomain,
      hosted: hosted,
      activeKey: currentKey,
      activation: { reason:'period-bind', ensureVisible:true },
      domain: {
        name:'period-' + unit,
        getElement:function(key){ return getItemElement(key); },
        reconcile:function(key){
          var match = items.find(function(entry){ return entry.key === String(key) && entry.disabled !== true; });
          if (match) return match.key;
          var activeKey = activeValue ? DateUnit.key(activeValue, unit, 0) : null;
          var current = activeKey && items.find(function(entry){ return entry.key === activeKey && entry.disabled !== true; });
          if (current) return current.key;
          var first = items.find(function(entry){ return entry.disabled !== true; });
          return first ? first.key : null;
        },
        ensureVisible:function(key){ return ensureItemVisible(key); }
      }
    });
    if (!binding) return null;
    virtualFocusController = binding.controller;
    hostedVirtualFocus = binding.hosted;
    virtualFocusDomain = binding.domain;
    return virtualFocusDomain;
  }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (Object.prototype.hasOwnProperty.call(next, 'unit') && normalizeUnit(next.unit) !== unit) throw new Error('[QXFRAME9A7C2] PeriodPanel unit is immutable.');
    opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(next, 'value')) setValue(next.value, { silent: true, source: 'options', reason: 'controlled' });
    if (Object.prototype.hasOwnProperty.call(next, 'viewValue')) changeView(next.viewValue, { silent: true, source: 'options', reason: 'controlled-view' });
    if (keyboardRegion) keyboardRegion.setDisabled(opts.disabled === true);
    if (title) title.tabIndex = typeof opts.onTitleRequest === 'function' && opts.disabled !== true ? 0 : -1;
    render();
    if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
    return api;
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    if (virtualFocusDomain) virtualFocusDomain.destroy(); virtualFocusDomain = null; virtualFocusController = null;
    scope.dispose();
    keyboardRegion = null;
    keyboard = null;
    emitter.dispose();
    if (domBinding) domBinding.release();
    domBinding = null;
    root = title = grid = null;
    items = [];
    hoveredKey = null;
    return true;
  }
    
  api = {
    setValue: setValue,
    clear: function (meta) { return setValue(null, meta); },
    setViewValue: changeView,
    setActiveValue: setActiveValue,
    prev: function () { return changeView(addPage(viewValue, unit, -1), { source: 'api', reason: 'prev' }); },
    next: function () { return changeView(addPage(viewValue, unit, 1), { source: 'api', reason: 'next' }); },
    refresh: function () { render(); return api; },
    refreshStates: function () { syncStates(); return api; },
    focus: function () { return hostedVirtualFocus ? false : !!(keyboardRegion && keyboardRegion.focus()); },
    handleKeydown: onKeydown,
    bindVirtualFocus: bindVirtualFocus,
    getKeyboardRegion: function () { return keyboardRegion && keyboardRegion.getKeyboardRegion ? keyboardRegion.getKeyboardRegion() : keyboardRegion; },
    getFocusController: function () { return keyboardRegion; },
    getVirtualFocusDomain: function () { return virtualFocusDomain; },
    updateOptions: updateOptions,
    getState: function () { var hoverValue = hoveredKey ? items.filter(function (entry) { return entry.key === hoveredKey; }).map(function (entry) { return clone(entry.date); })[0] || null : null; return Object.freeze({ unit: unit, value: clone(value), viewValue: clone(viewValue), activeValue: clone(activeValue), hoverValue: hoverValue, disabled: opts.disabled === true, readOnly: opts.readOnly === true, destroyed: destroyed }); },
    getItems: function () { return items.map(function (entry) { return { key: entry.key, date: clone(entry.date), label: entry.label, disabled: entry.disabled }; }); },
    getRootElement: function () { return root; },
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
    
  mount();
  return api;
}
    

export const PeriodPanel = Object.freeze({ create });
