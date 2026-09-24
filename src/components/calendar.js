import { Events } from '../core/events.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { ActiveItem } from '../core/activeItem.js';
import { StateController } from '../core/stateController.js';
import { TemporalGrid } from '../core/temporalGrid.js';
import { FocusController } from '../core/focusController.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { mergeOptions } from '../core/options.js';
import { DateUnit } from '../utils/dateUnit.js';

let DOMFactory;
var WEEKDAYS = ['日','一','二','三','四','五','六'];
var calendarDomainSequence = 0;
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-calendar qxframe9a7c2-date-panel" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-calendar-header qxframe9a7c2-date-panel-header" data-qxframe9a7c2-ref="header">
      <button type="button" class="qxframe9a7c2-button is-default is-text is-square qxframe9a7c2-calendar-nav qxframe9a7c2-date-panel-nav" data-qxframe9a7c2-ref="prev"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-left is-line is-round is-stroke-3"></span></button>
      <div class="qxframe9a7c2-calendar-title qxframe9a7c2-date-panel-title" data-qxframe9a7c2-ref="title"><button type="button" class="qxframe9a7c2-calendar-title-button qxframe9a7c2-date-panel-title-action qxframe9a7c2-calendar-year" data-qxframe9a7c2-ref="year-title"></button><button type="button" class="qxframe9a7c2-calendar-title-button qxframe9a7c2-date-panel-title-action qxframe9a7c2-calendar-month" data-qxframe9a7c2-ref="month-title"></button></div>
      <button type="button" class="qxframe9a7c2-button is-default is-text is-square qxframe9a7c2-calendar-nav qxframe9a7c2-date-panel-nav" data-qxframe9a7c2-ref="next"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-right is-line is-round is-stroke-3"></span></button>
    </div>
    <div class="qxframe9a7c2-calendar-weekdays" data-qxframe9a7c2-ref="weekdays"></div>
    <div class="qxframe9a7c2-calendar-grid" data-qxframe9a7c2-ref="grid"></div>
  </div>`;
function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document); var refs = instance.refs;
  var weekStartsOn = Number((context.options || {}).weekStartsOn) || 0;
  for (var i=0;i<7;i+=1) { var weekday=context.document.createElement('div'); weekday.className='qxframe9a7c2-calendar-weekday'; weekday.textContent=WEEKDAYS[(i+weekStartsOn)%7]; refs.weekdays.appendChild(weekday); }
  return {root: instance.root, refs: refs};
}
function createCell(context) { var cell=context.document.createElement('button'); cell.type='button'; cell.className='qxframe9a7c2-calendar-cell'; return cell; }
DOMFactory = Object.freeze({createDefaultDOM:createDefaultDOM,createCell:createCell,blueprint:blueprint});

var validDate = DateUnit.isValidDate;
var cloneDate = DateUnit.clone;
var stripTime = DateUnit.stripTime;
function parseDate(value) { return DateUnit.parse(value, { unit:'date' }); }
function keyOf(date) { return DateUnit.key(date, 'date'); }
function sameDay(a, b) { return DateUnit.same(a, b, 'date'); }
function sameNullableDay(a, b) { return a == null && b == null ? true : sameDay(a, b); }
var addDays = DateUnit.addDays;
var addMonths = DateUnit.addMonths;
function startMonth(value) { return new Date(value.getFullYear(), value.getMonth(), 1); }
function sameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
    
function create(options) {
  var opts = mergeOptions({}, options);
  var doc = opts.document || (opts.container && opts.container.ownerDocument) || globalThis.document;
  var emitter = Events.createEmitter();
  var virtualFocusDomainName = 'calendar-' + (++calendarDomainSequence);
  var scope = Lifecycle.createScope();
  var destroyed = false;
  var root = null;
  var domBinding = null;
  var title = null;
  var grid = null;
  var delegation = null;
  var keyboard = null, keyboardRegion = null, virtualFocusController = null, virtualFocusDomain = null, hostedVirtualFocus = false;
  var cells = [];
  var initialCommitted = parseDate(opts.value !== undefined ? opts.value : opts.defaultValue);
  var valueState = StateController.create({
    value: initialCommitted,
    controlled: Object.prototype.hasOwnProperty.call(Object(opts), 'value'),
    normalizeValue: function (next) { return next == null || next === '' ? null : parseDate(next); },
    equals: sameNullableDay,
    copyValue: cloneDate
  });
  scope.add(function () { valueState.destroy(); });
  var viewValue = startMonth(parseDate(opts.viewValue || opts.defaultViewValue) || valueState.value || stripTime(new Date()));
  var initialActive = parseDate(opts.activeValue) || valueState.value || new Date(viewValue.getFullYear(), viewValue.getMonth(), 1);
  var activeItem = null;
  var hoveredKey = null;
  var api = null;
    
  function weekStartsOn() { var n = Number(opts.weekStartsOn); return Number.isFinite(n) ? ((n % 7) + 7) % 7 : 0; }
  function isDisabledDate(date) { return opts.disabled === true || (typeof opts.disabledDate === 'function' && opts.disabledDate(cloneDate(date)) === true); }
  function isReadOnly() { return opts.readOnly === true; }
    
  function buildCells() {
    var first = startMonth(viewValue);
    var offset = (first.getDay() - weekStartsOn() + 7) % 7;
    var start = addDays(first, -offset);
    var output = [];
    for (var i = 0; i < 42; i += 1) {
      var date = addDays(start, i);
      output.push({ key: keyOf(date), date: date, disabled: isDisabledDate(date), outside: !sameMonth(date, viewValue) });
    }
    cells = output;
    return output;
  }
    
  activeItem = ActiveItem.create({
    getEntries: function () { return cells; },
    getKey: function (entry) { return entry.key; },
    isDisabled: function (entry) { return entry.disabled === true; },
    activeKey: keyOf(initialActive),
    onChange: function (key, detail) {
      if (virtualFocusDomain && virtualFocusController && key) {
        var activeSource = detail && detail.source || 'api';
        var controllerState = virtualFocusController.getState();
        var ownsDomain = controllerState && controllerState.domain === virtualFocusDomain.name;
        // Hosted calendars share one real-focus owner (for example DatePicker dual panels).
        // Silent/programmatic view reconciliation must not steal the shared virtual-focus
        // domain from the panel the user is actually navigating.
        if (!hostedVirtualFocus || activeSource === 'keyboard' || activeSource === 'pointer') {
          virtualFocusDomain.activate(String(key), { source:activeSource, modality:activeSource === 'keyboard' ? 'keyboard' : (activeSource === 'pointer' ? 'pointer' : controllerState.modality), reason:detail && detail.reason || 'calendar-active', originalEvent:detail && detail.originalEvent || null, ensureVisible:false });
        } else if (ownsDomain) virtualFocusDomain.refresh({ reconcile:true, source:activeSource, reason:detail && detail.reason || 'calendar-active-sync' });
      }
      syncCellStates();
      var date = parseDate(key);
      var payload = { key: key, date: cloneDate(date), source: detail && detail.source || 'api', reason: detail && detail.reason || 'active', calendar: api };
      if (typeof opts.onActiveChange === 'function') opts.onActiveChange(payload);
      emitter.emit('activeChange', payload);
    }
  });
    
  function setHoverDate(next, meta) {
    if (destroyed) return false;
    var parsed = next === null || next === undefined || next === '' ? null : parseDate(next);
    var nextKey = parsed ? keyOf(parsed) : null;
    if (nextKey === hoveredKey) return false;
    hoveredKey = nextKey;
    var detail = { value: cloneDate(parsed), source: meta && meta.source || 'pointer', reason: meta && meta.reason || (parsed ? 'hover' : 'hover-leave'), originalEvent: meta && meta.originalEvent || null, calendar: api };
    if (typeof opts.onHoverChange === 'function') opts.onHoverChange(cloneDate(parsed), detail);
    emitter.emit('hoverChange', detail);
    return true;
  }
    
  function mount() {
    if (root) return root;
    var host = opts.container || null;
    if (!host && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] Calendar container is required unless options.elements supplies existing DOM.');
    domBinding = DOMBinding.resolve({
      options: opts,
      target: host,
      component: api,
      requiredRefs: ['root', 'title', 'grid'],
      defaultFactory: DOMFactory.createDefaultDOM
    });
    root = domBinding.refs.root;
    title = domBinding.refs.title;
    grid = domBinding.refs.grid;
    root.classList.add('qxframe9a7c2-calendar'); root.tabIndex = 0;
    if (domBinding.refs.header) domBinding.refs.header.classList.add('qxframe9a7c2-calendar-header');
    if (domBinding.refs.prev) { domBinding.refs.prev.classList.add('qxframe9a7c2-button','is-default','is-text','is-square','qxframe9a7c2-calendar-nav'); DOM.setPrivate(domBinding.refs.prev, 'calendarNav', '-1'); domBinding.refs.prev.tabIndex = -1; }
    if (domBinding.refs.next) { domBinding.refs.next.classList.add('qxframe9a7c2-button','is-default','is-text','is-square','qxframe9a7c2-calendar-nav'); DOM.setPrivate(domBinding.refs.next, 'calendarNav', '1'); domBinding.refs.next.tabIndex = -1; }
    title.classList.add('qxframe9a7c2-calendar-title');
    if (domBinding.refs.yearTitle) { domBinding.refs.yearTitle.tabIndex = 0; domBinding.refs.yearTitle.classList.add('qxframe9a7c2-calendar-title-button','qxframe9a7c2-calendar-year'); DOM.setPrivate(domBinding.refs.yearTitle, 'calendarTitle', 'year'); }
    if (domBinding.refs.monthTitle) { domBinding.refs.monthTitle.tabIndex = 0; domBinding.refs.monthTitle.classList.add('qxframe9a7c2-calendar-title-button','qxframe9a7c2-calendar-month'); DOM.setPrivate(domBinding.refs.monthTitle, 'calendarTitle', 'month'); }
    if (domBinding.refs.weekdays) {
      domBinding.refs.weekdays.classList.add('qxframe9a7c2-calendar-weekdays');
      var weekdayNodes = domBinding.refs.weekdays.children || [];
      for (var wi = 0; wi < weekdayNodes.length; wi += 1) weekdayNodes[wi].classList.add('qxframe9a7c2-calendar-weekday');
    }
    grid.classList.add('qxframe9a7c2-calendar-grid');
    delegation = EventDelegation.create({ root: root });
    scope.add(function () { delegation.destroy(); });
    function focusKeyboardHost() {
      if (hostedVirtualFocus) return true;
      if (!root || !root.focus) return false;
      if (!doc || doc.activeElement !== root) DOM.focusElement(root);
      return true;
    }
    scope.add(DOM.listen(root, 'pointerdown', function (event) {
      var target = event && event.target ? (DOM.closestPrivate(event.target, root, 'calendarDate') || DOM.closestPrivate(event.target, root, 'calendarNav') || DOM.closestPrivate(event.target, root, 'calendarTitle')) : null;
      if (target && root.contains(target) && event.preventDefault) event.preventDefault();
    }));
    scope.add(DOM.listen(root, 'pointermove', function (event) {
      var target = event && event.target ? DOM.closestPrivate(event.target, root, 'calendarDate') : null;
      var date = target ? parseDate(DOM.getPrivate(target, 'calendarDate')) : null;
      if (date && !isDisabledDate(date)) setHoverDate(date, { source: 'pointer', reason: 'cell-hover', originalEvent: event });
      else if (hoveredKey !== null) setHoverDate(null, { source: 'pointer', reason: 'cell-hover-clear', originalEvent: event });
    }));
    scope.add(DOM.listen(root, 'pointerleave', function (event) {
      if (hoveredKey !== null) setHoverDate(null, { source: 'pointer', reason: 'panel-leave', originalEvent: event });
    }));
    delegation.on('click', DOM.privateMatcher('calendarNav'), function (payload) {
      if (opts.disabled === true) return;
      changeView(addMonths(viewValue, Number(DOM.getPrivate(payload.target, 'calendarNav'))), { source: DOM.activationSource(payload.event), reason: 'nav' });
      focusKeyboardHost();
    });
    delegation.on('click', DOM.privateMatcher('calendarTitle'), function (payload) {
      if (opts.disabled === true) return;
      var unit = String(DOM.getPrivate(payload.target, 'calendarTitle') || '');
      var detail = { unit: unit, viewValue: cloneDate(viewValue), originalEvent: payload.event, source: DOM.activationSource(payload.event), reason: 'title', calendar: api };
      if (unit === 'year' && typeof opts.onYearRequest === 'function') opts.onYearRequest(cloneDate(viewValue), detail);
      if (unit === 'month' && typeof opts.onMonthRequest === 'function') opts.onMonthRequest(cloneDate(viewValue), detail);
    });
    delegation.on('click', DOM.privateMatcher('calendarDate'), function (payload) {
      if (opts.disabled === true) return;
      var date = parseDate(DOM.getPrivate(payload.target, 'calendarDate'));
      if (!date || isDisabledDate(date)) { focusKeyboardHost(); return; }
      setActiveDate(date, { source: DOM.activationSource(payload.event), reason: 'cell' });
      selectDate(date, { source: DOM.activationSource(payload.event), reason: 'cell', originalEvent: payload.event });
      focusKeyboardHost();
    });
    keyboardRegion = FocusController.create({
      root: root,
      hosted: false,
      disabled: opts.disabled === true,
      navigation: {
        handlers: FocusController.forwardHandlers(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','Enter',' '], onKeydown)
      },
      onEnter: function (detail) {
        var key = activeItem && activeItem.activeKey ? activeItem.activeKey : null;
        if (virtualFocusDomain && key) virtualFocusDomain.activate(key, { source:'keyboard', modality:'keyboard', reason:'calendar-region-enter', originalEvent:detail.originalEvent, ensureVisible:true });
      }
    });
    keyboard = keyboardRegion.keyboard;
    scope.add(function () { if (keyboardRegion) keyboardRegion.destroy(); keyboardRegion = null; keyboard = null; });
    bindVirtualFocus(keyboard.virtualFocus, false);
    render();
    return root;
  }
    
  function reconcileActiveToView(meta) {
    if (!activeItem) return false;
    var current = parseDate(activeItem.activeKey);
    var currentEntry = current && sameMonth(current, viewValue)
      ? cells.find(function (entry) { return entry.key === activeItem.activeKey && entry.disabled !== true && sameMonth(entry.date, viewValue); })
      : null;
    if (currentEntry) return true;

    var preferred = current || (valueState.value && sameMonth(valueState.value, viewValue) ? valueState.value : null) || viewValue;
    var lastDay = new Date(viewValue.getFullYear(), viewValue.getMonth() + 1, 0).getDate();
    var target = new Date(viewValue.getFullYear(), viewValue.getMonth(), Math.min(preferred.getDate(), lastDay));
    var enabled = cells.filter(function (entry) { return entry.disabled !== true && sameMonth(entry.date, viewValue); });
    var candidate = enabled.find(function (entry) { return sameDay(entry.date, target); }) || null;
    if (!candidate && enabled.length) {
      candidate = enabled.reduce(function (best, entry) {
        if (!best) return entry;
        var distance = Math.abs(entry.date.getTime() - target.getTime());
        var bestDistance = Math.abs(best.date.getTime() - target.getTime());
        return distance < bestDistance ? entry : best;
      }, null);
    }

    var detail = {
      silent: true,
      source: meta && meta.source || 'view',
      reason: meta && meta.reason || 'view-active-reconcile',
      originalEvent: meta && meta.originalEvent || null
    };
    if (!candidate) return activeItem.clear(detail);
    return activeItem.set(candidate.key, detail);
  }

  function render(meta) {
    if (!root || destroyed) return;
    buildCells();
    if (domBinding && domBinding.refs.yearTitle && domBinding.refs.monthTitle) {
      domBinding.refs.yearTitle.textContent = String(viewValue.getFullYear());
      domBinding.refs.monthTitle.textContent = String(viewValue.getMonth() + 1).padStart(2, '0');
      domBinding.refs.yearTitle.disabled = opts.disabled === true || typeof opts.onYearRequest !== 'function';
      domBinding.refs.monthTitle.disabled = opts.disabled === true || typeof opts.onMonthRequest !== 'function';
      domBinding.refs.yearTitle;
      domBinding.refs.monthTitle;
    } else title.textContent = viewValue.getFullYear() + '-' + String(viewValue.getMonth() + 1).padStart(2, '0');
    grid.textContent = '';
    var fragment = doc.createDocumentFragment();
    cells.forEach(function (entry) {
      var button = DOMFactory.createCell({ document: doc, options: opts, entry: entry });
      button.classList.add('qxframe9a7c2-calendar-cell','qxframe9a7c2-date-panel-cell');
      button.textContent = '';
      var cellOutput = typeof opts.renderCell === 'function' ? opts.renderCell(cloneDate(entry.date), { entry: entry, calendar: api }) : String(entry.date.getDate());
      Renderer.append(button, cellOutput);
      DOM.setPrivate(button, 'calendarDate', entry.key);
      button.tabIndex = -1;
      button.disabled = entry.disabled === true;
      button.classList.toggle('is-outside', entry.outside === true);
      fragment.appendChild(button);
    });
    grid.appendChild(fragment);
    reconcileActiveToView(meta);
    syncCellStates();
    if (virtualFocusDomain) virtualFocusDomain.refresh({
      reconcile:true,
      source: meta && meta.source || 'render',
      reason: meta && meta.reason || 'calendar-render',
      originalEvent: meta && meta.originalEvent || null
    });
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', isReadOnly());
  }
    
  function syncCellStates() {
    if (!grid) return;
    var nodes = DOM.findAllPrivate(grid, 'calendarDate');
    var today = stripTime(new Date());
    for (var i = 0; i < nodes.length; i += 1) {
      var date = parseDate(DOM.getPrivate(nodes[i], 'calendarDate'));
      var external = typeof opts.getCellState === 'function'
        ? opts.getCellState(cloneDate(date), { calendar: api, entry: cells.find(function (candidate) { return sameDay(candidate.date, date); }) || null })
        : null;
      var state = external && typeof external === 'object' ? external : {};
      var selected = Object.prototype.hasOwnProperty.call(state, 'selected') ? state.selected === true : sameDay(date, valueState.value);
      nodes[i].classList.toggle('is-selected', selected);
      nodes[i].classList.toggle('is-today', sameDay(date, today));
      nodes[i].classList.toggle('is-in-range', state.inRange === true);
      nodes[i].classList.toggle('is-range-start', state.rangeStart === true);
      nodes[i].classList.toggle('is-range-end', state.rangeEnd === true);
      var visualActiveOwner = !hostedVirtualFocus || (virtualFocusController && virtualFocusDomain && virtualFocusController.getState().domain === virtualFocusDomain.name);
      nodes[i].classList.toggle('is-active', visualActiveOwner && DOM.getPrivate(nodes[i], 'calendarDate') === activeItem.activeKey);
      nodes[i].classList.toggle('is-hover', state.hover === true);
      nodes[i];
    }
  }
    
  function changeView(next, meta) {
    if (destroyed) return false;
    var parsed = parseDate(next); if (!parsed) return false;
    var previous = cloneDate(viewValue); viewValue = startMonth(parsed); render(meta);
    var detail = { viewValue: cloneDate(viewValue), previousViewValue: previous, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-view', originalEvent: meta && meta.originalEvent || null, calendar: api };
    if (!(meta && meta.silent)) { if (typeof opts.onViewChange === 'function') opts.onViewChange(cloneDate(viewValue), detail); emitter.emit('viewChange', detail); }
    return true;
  }
    
  function setActiveDate(next, meta) {
    if (destroyed) return false;
    var parsed = parseDate(next); if (!parsed || isDisabledDate(parsed)) return false;
    if (!hostedVirtualFocus && meta && meta.source === 'keyboard' && root && root.focus && doc && doc.activeElement !== root) DOM.focusElement(root);
    if (!sameMonth(parsed, viewValue)) changeView(parsed, { source: meta && meta.source || 'api', reason: 'active-view-sync', silent: meta && meta.silent });
    buildCells();
    return activeItem.set(keyOf(parsed), meta || {});
  }
    
  function selectDate(next, meta) {
    if (destroyed || isReadOnly() || opts.disabled === true) return false;
    var parsed = parseDate(next); if (!parsed || isDisabledDate(parsed)) return false;
    var selected = stripTime(parsed);
    var previous = cloneDate(valueState.value);
    var stateMeta = { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'select', originalEvent: meta && meta.originalEvent || null };
    if (valueState.controlled) valueState.requestChange(selected, stateMeta); else valueState.setValue(selected, stateMeta);
    setActiveDate(selected, { source: stateMeta.source, reason: 'select-active', silent: true });
    syncCellStates();
    var detail = { value: cloneDate(selected), previousValue: previous, source: stateMeta.source, reason: stateMeta.reason, originalEvent: stateMeta.originalEvent, controlled: valueState.controlled, calendar: api };
    if (typeof opts.onSelect === 'function') opts.onSelect(cloneDate(selected), detail);
    emitter.emit('select', detail);
    if (!sameNullableDay(previous, selected)) { if (typeof opts.onChange === 'function') opts.onChange(cloneDate(selected), detail); emitter.emit('change', detail); }
    return true;
  }
    
  function setValue(next, meta) {
    if (destroyed) return false;
    var parsed = next === null || next === undefined || next === '' ? null : parseDate(next); if (next !== null && next !== undefined && next !== '' && !parsed) return false;
    var previous = cloneDate(valueState.value);
    valueState.setValue(parsed ? stripTime(parsed) : null, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-value', originalEvent: meta && meta.originalEvent || null });
    var committed = valueState.value;
    var preserveView = !!(meta && meta.syncView === false);
    if (committed && !preserveView) changeView(committed, { source: meta && meta.source || 'api', reason: 'value-view-sync', silent: true });
    if (committed) {
      if (!preserveView) setActiveDate(committed, { source: meta && meta.source || 'api', reason: 'value-active-sync', silent: true });
      else {
        // A controlled value update may change selection without navigating the calendar.
        // Composite owners such as range DatePicker keep independent consecutive panel views.
        buildCells();
        var committedKey = keyOf(committed);
        var rendered = cells.some(function (entry) { return entry.key === committedKey && entry.disabled !== true; });
        if (rendered) activeItem.set(committedKey, { source: meta && meta.source || 'api', reason: 'value-active-preserve-view', silent: true });
      }
    }
    syncCellStates();
    if (!(meta && meta.silent) && !sameNullableDay(previous, committed)) { var detail = { value: cloneDate(committed), previousValue: previous, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-value', calendar: api }; if (typeof opts.onChange === 'function') opts.onChange(cloneDate(committed), detail); emitter.emit('change', detail); }
    return true;
  }
    
  function onKeydown(event) {
    if (!event || opts.disabled === true) return false;
    var target = event.target || null;
    var navTarget = target ? DOM.closestPrivate(target, root, 'calendarNav') : null;
    var titleTarget = target ? DOM.closestPrivate(target, root, 'calendarTitle') : null;
    if (navTarget && (event.key === 'Enter' || event.key === ' ')) return false;
    if (titleTarget) {
      var titleUnit = String(DOM.getPrivate(titleTarget, 'calendarTitle') || '');
      if (event.key === 'Enter' || event.key === ' ') {
        var requestDetail = { unit:titleUnit, viewValue:cloneDate(viewValue), originalEvent:event, source:'keyboard', reason:'title-keyboard', calendar:api };
        if (titleUnit === 'year' && typeof opts.onYearRequest === 'function') opts.onYearRequest(cloneDate(viewValue), requestDetail);
        else if (titleUnit === 'month' && typeof opts.onMonthRequest === 'function') opts.onMonthRequest(cloneDate(viewValue), requestDetail);
        else return false;
        return true;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        var direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
        var monthDelta = titleUnit === 'year' ? direction * 12 : direction;
        if (titleUnit !== 'year' && titleUnit !== 'month') return false;
        changeView(addMonths(viewValue, monthDelta), { source:'keyboard', reason:'title-' + titleUnit + '-step', originalEvent:event });
        return true;
      }
      return false;
    }
    var activeDate = parseDate(activeItem.activeKey);
    var committedInView = valueState.value && sameMonth(valueState.value, viewValue) ? valueState.value : null;
    var current = activeDate && sameMonth(activeDate, viewValue) ? activeDate : (committedInView || new Date(viewValue.getFullYear(), viewValue.getMonth(), 1));
    var action = TemporalGrid.keyAction(event.key, { columns:7 });
    if (!action) return false;
    if (action.type === 'activate') { selectDate(current, { source:'keyboard', reason:'activate', originalEvent:event }); return true; }
    var next = TemporalGrid.moveDateByKey(current, event.key, { columns:7, weekStartsOn:weekStartsOn() });
    var guard = 0, backward = action.action === 'left' || action.action === 'up' || action.action === 'home' || action.action === 'page-up';
    while (next && isDisabledDate(next) && guard < 370) { next = addDays(next, backward ? -1 : 1); guard += 1; }
    if (next && guard < 370) setActiveDate(next, { source: 'keyboard', reason: event.key });
    return true;
  }
    
  function getCellElement(key) {
    if (!grid) return null;
    var nodes = DOM.findAllPrivate(grid, 'calendarDate');
    for (var i = 0; i < nodes.length; i += 1) if (String(DOM.getPrivate(nodes[i], 'calendarDate')) === String(key)) return nodes[i];
    return null;
  }
  function bindVirtualFocus(controller, hosted) {
    var binding = FocusController.bindVirtualFocus({
      controller: controller,
      previousDomain: virtualFocusDomain,
      keyboard: keyboard,
      region: keyboardRegion,
      root: root,
      hosted: hosted,
      activeKey: activeItem.activeKey,
      activation: { reason:'calendar-bind', ensureVisible:false },
      domain: {
        name:virtualFocusDomainName,
        getElement:function(key){ return getCellElement(key); },
        reconcile:function(key){ var cell=cells.find(function(entry){return entry.key===String(key)&&entry.disabled!==true;}); if(cell)return cell.key; return activeItem.activeKey || null; },
        ensureVisible:function(){ return true; }
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
    var next = nextOptions || {}; opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) { valueState.setControlled(true); setValue(next.value, { source: 'options', reason: 'controlled', silent: true }); }
    if (Object.prototype.hasOwnProperty.call(Object(next), 'viewValue')) changeView(next.viewValue, { source: 'options', reason: 'controlled-view', silent: true });
    if (keyboardRegion) keyboardRegion.setDisabled(opts.disabled === true);
    render(); if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
    return api;
  }
    
  function destroy() {
    if (destroyed) return false; destroyed = true; valueState.destroy(); if (virtualFocusDomain) virtualFocusDomain.destroy(); virtualFocusDomain=null; virtualFocusController=null; scope.dispose(); keyboardRegion = null; keyboard = null; activeItem.destroy(); emitter.dispose(); if (domBinding) domBinding.release(); domBinding = null; root = null; grid = null; title = null; cells = []; hoveredKey = null; return true;
  }
    
  api = {
    setValue: setValue,
    clear: function (meta) { return setValue(null, meta); },
    setViewValue: changeView,
    prev: function () { return changeView(addMonths(viewValue, -1), { source: 'api', reason: 'prev' }); },
    next: function () { return changeView(addMonths(viewValue, 1), { source: 'api', reason: 'next' }); },
    setActiveDate: setActiveDate,
    focus: function () { return hostedVirtualFocus ? false : !!(keyboardRegion && keyboardRegion.focus()); },
    handleKeydown: onKeydown,
    bindVirtualFocus: bindVirtualFocus,
    getVirtualFocusDomain: function () { return virtualFocusDomain; },
    refresh: function () { render(); return api; },
    refreshStates: function () { syncCellStates(); return api; },
    updateOptions: updateOptions,
    getState: function () { return Object.freeze({ value: cloneDate(valueState.value), viewValue: cloneDate(viewValue), activeKey: activeItem.activeKey, hoverValue: parseDate(hoveredKey), disabled: opts.disabled === true, readOnly: isReadOnly(), destroyed: destroyed }); },
    getRootElement: function () { return root; },
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    getCells: function () { return cells.map(function (entry) { return { key: entry.key, date: cloneDate(entry.date), disabled: entry.disabled, outside: entry.outside }; }); },
    getEventDelegation: function () { return delegation; },
    getKeyboardNavigation: function () { return keyboard; },
    getKeyboardRegion: function () { return keyboardRegion && keyboardRegion.getKeyboardRegion ? keyboardRegion.getKeyboardRegion() : keyboardRegion; },
    getFocusController: function () { return keyboardRegion; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
  mount();
  return api;
}
    

export const Calendar = Object.freeze({ create, parseDate, keyOf, createDefaultDOM: DOMFactory.createDefaultDOM });
