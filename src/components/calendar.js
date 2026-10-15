import { Events } from '../core/events.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { ActiveItem } from '../core/activeItem.js';
import { ValueController } from '../core/valueController.js';
import { TemporalGrid } from '../core/temporalGrid.js';
import { FocusController } from '../core/focusController.js';
import { InteractionController } from '../core/interactionController.js';
import { CapabilityController } from '../core/capabilityController.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { mergeOptions } from '../core/options.js';
import { DateUnit } from '../utils/dateUnit.js';
import { WheelMetrics } from '../utils/wheelMetrics.js';

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
function createCell(context) {
  // The original button remains the event/value/focus owner. These inner
  // wrappers have layout-only responsibility; the range strip is ::before on
  // the button itself (no independent range DOM or event handlers).
  var cell=context.document.createElement('button');
  cell.type='button';
  cell.className='qxframe9a7c2-calendar-cell';
  var view=context.document.createElement('div');
  view.className='qxframe9a7c2-calendar-cell-view';
  var inner=context.document.createElement('div');
  inner.className='qxframe9a7c2-calendar-cell-inner';
  view.appendChild(inner);
  cell.appendChild(view);
  return cell;
}
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
  var opts = mergeOptions({ size:'md' }, options);
  function applyCellSize() {
    if (!root) return;
    // Standalone Calendar defaults to the canonical Wheel size for this Size.
    // An explicit numeric cellSize customizes Calendar without mutating WheelPanel.
    root.style.setProperty('--_qxframe9a7c2-calendar-default-cell-size', String(WheelMetrics.itemHeight(opts.size)) + 'px');
    if (opts.cellSize !== undefined && opts.cellSize !== null) {
      var custom = Number(opts.cellSize);
      if (!Number.isFinite(custom) || custom <= 0) throw new TypeError('[QXFRAME9A7C2] Calendar cellSize must be a positive pixel number.');
      root.style.setProperty('--qxframe9a7c2-calendar-cell-size', String(custom) + 'px');
    } else root.style.removeProperty('--qxframe9a7c2-calendar-cell-size');
  }

  /* A single Calendar state and renderer: unit changes only the data/view policy. */
  var unit=String(opts.unit||'date').toLowerCase();
  if(!['date','week','month','quarter','year'].includes(unit))throw new TypeError('[QXFRAME9A7C2] Calendar unit must be date, week, month, quarter or year.');
  var valueUnit=unit==='week'?'date':unit;
  // The immutable value precision is independent of the currently rendered grid.
  var viewMode=String(opts.viewMode||(unit==='week'?'date':unit)).toLowerCase();
  if(!['date','month','quarter','year','decade'].includes(viewMode))throw new TypeError('[QXFRAME9A7C2] Invalid Calendar viewMode.');
  var periodUnit=viewMode==='decade'?'year':viewMode,isPeriod=periodUnit!=='date';
  function parseCommitted(v){return DateUnit.parse(v,{unit:valueUnit});}
  function normalizeCommitted(v){return !v?null:valueUnit==='date'?stripTime(v):DateUnit.start(v,valueUnit,0,false);}
  function sameCommitted(a,b){return (!a&&!b)||!!a&&!!b&&DateUnit.same(a,b,valueUnit,0);}
  function canOpenTitle(kind){
    if(opts.disabled===true)return false;
    if(kind==='month')return (unit==='date'||unit==='week')&&viewMode==='date'&&opts.allowMonthView!==false;
    if(kind==='year'||kind==='period'){
      if(unit==='date'||unit==='week')return viewMode!=='year'&&viewMode!=='decade'&&opts.allowYearView!==false;
      return kind==='period'&&typeof opts.onTitleRequest==='function';
    }
    return false;
  }
  function parseDate(v){return DateUnit.parse(v,{unit:periodUnit});}
  function keyOf(v){return DateUnit.key(v,periodUnit,0);}
  function sameDay(a,b){return DateUnit.same(a,b,periodUnit,0);}
  function normalizeValue(v){return !v?null:(isPeriod?DateUnit.start(v,periodUnit,0,false):stripTime(v));}
  function startMonth(v){return !isPeriod?new Date(v.getFullYear(),v.getMonth(),1):periodUnit==='year'?new Date(Math.floor(v.getFullYear()/10)*10,0,1):new Date(v.getFullYear(),0,1);}
  function sameMonth(a,b){return !!a&&!!b&&startMonth(a).getTime()===startMonth(b).getTime();}
  function addPage(v,n){return !isPeriod?addMonths(v,n):new Date(v.getFullYear()+n*(periodUnit==='year'?10:1),v.getMonth(),1);}
  function addUnit(v,n){var d=cloneDate(v);if(!d)return null;if(periodUnit==='year')d.setFullYear(d.getFullYear()+n);else if(periodUnit==='quarter')d.setMonth(d.getMonth()+3*n);else d.setMonth(d.getMonth()+n);return normalizeValue(d);}
  function periodLabel(v){return periodUnit==='year'?String(v.getFullYear()):periodUnit==='quarter'?'Q'+DateUnit.quarter(v):String(v.getMonth()+1).padStart(2,'0');}
  function periodTitle(v){return periodUnit==='year'?v.getFullYear()+'–'+(v.getFullYear()+9):String(v.getFullYear());}
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
  var capabilityController = CapabilityController.create({ getState:function () { return opts; } });
  var interactionController = null;
  scope.add(function () { if (capabilityController) capabilityController.destroy(); capabilityController = null; });
  var cells = [];
  var initialCommitted = parseCommitted(opts.value !== undefined ? opts.value : opts.defaultValue);
  var valueState = ValueController.create({
    value: initialCommitted,
    controlled: opts.controlled === true,
    normalizeValue: function (next) { return next == null || next === '' ? null : parseCommitted(next); },
    equals: sameCommitted,
    copyValue: cloneDate
  });
  scope.add(function () { valueState.destroy(); });
  var viewValue = startMonth(parseDate(opts.viewValue || opts.defaultViewValue) || valueState.value || stripTime(new Date()));
  var initialActive = parseDate(opts.activeValue) || valueState.value || new Date(viewValue.getFullYear(), viewValue.getMonth(), 1);
  var activeItem = null;
  var hoveredKey = null;
  var api = null;
    
  function weekStartsOn() { var n = Number(opts.weekStartsOn); return Number.isFinite(n) ? ((n % 7) + 7) % 7 : 0; }
  // Week is a single Calendar value with a seven-day visual projection;
  // selection, Hover and Range share the existing Cell and ::before strip.
  function weekBounds(value) {
    if (!value) return null;
    var start = stripTime(value);
    start.setDate(start.getDate() - (start.getDay() - weekStartsOn() + 7) % 7);
    return { start:start, end:addDays(start,6) };
  }
  function isDisabledDate(date) { var guard=isPeriod?(opts.disabledValue||opts.disabledDate):opts.disabledDate;return opts.disabled===true||(typeof guard==='function'&&guard(cloneDate(date),Object.freeze({unit:unit,calendar:api}))===true); }
  function isReadOnly() { return opts.readOnly === true; }
  function canNavigate() { return capabilityController.can('navigate'); }
  function canSelect() { return capabilityController.can('select'); }
    
  function buildCells(){
    var output=[];
    if(isPeriod){
      var page=startMonth(viewValue),count=periodUnit==='quarter'?4:12,year=periodUnit==='year'?page.getFullYear()-1:page.getFullYear();
      for(var i=0;i<count;i++){
        var date=periodUnit==='year'?new Date(year+i,0,1):periodUnit==='quarter'?new Date(year,i*3,1):new Date(year,i,1);
        output.push({key:keyOf(date),date:date,label:periodLabel(date),disabled:isDisabledDate(date),outside:periodUnit==='year'&&(i===0||i===11)});
      }
    }else{
      var first=startMonth(viewValue),offset=(first.getDay()-weekStartsOn()+7)%7,start=addDays(first,-offset);
      for(var j=0;j<42;j++){var day=addDays(start,j);output.push({key:keyOf(day),date:day,disabled:isDisabledDate(day),outside:!sameMonth(day,viewValue)});}
    }
    cells=output;return output;
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
    syncCellStates();
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
    root.classList.add('qxframe9a7c2-calendar','is-unit-'+unit);root.classList.toggle('is-period',isPeriod);root.tabIndex = 0;
    applyCellSize();
    if (domBinding.refs.header) domBinding.refs.header.classList.add('qxframe9a7c2-calendar-header');
    if (domBinding.refs.prev) { domBinding.refs.prev.classList.add('qxframe9a7c2-button','is-default','is-text','is-square','qxframe9a7c2-calendar-nav'); DOM.setPrivate(domBinding.refs.prev, 'calendarNav', '-1'); domBinding.refs.prev.tabIndex = -1; }
    if (domBinding.refs.next) { domBinding.refs.next.classList.add('qxframe9a7c2-button','is-default','is-text','is-square','qxframe9a7c2-calendar-nav'); DOM.setPrivate(domBinding.refs.next, 'calendarNav', '1'); domBinding.refs.next.tabIndex = -1; }
    title.classList.add('qxframe9a7c2-calendar-title');
    if (domBinding.refs.yearTitle) { domBinding.refs.yearTitle.tabIndex = 0; domBinding.refs.yearTitle.classList.add('qxframe9a7c2-calendar-title-button','qxframe9a7c2-calendar-year'); DOM.setPrivate(domBinding.refs.yearTitle, 'calendarTitle', isPeriod?'period':'year'); }
    if (domBinding.refs.monthTitle) { domBinding.refs.monthTitle.tabIndex = 0; domBinding.refs.monthTitle.classList.add('qxframe9a7c2-calendar-title-button','qxframe9a7c2-calendar-month'); DOM.setPrivate(domBinding.refs.monthTitle, 'calendarTitle', 'month'); }
    if (domBinding.refs.weekdays) {
      domBinding.refs.weekdays.classList.add('qxframe9a7c2-calendar-weekdays');
      var weekdayNodes = domBinding.refs.weekdays.children || [];
      for (var wi = 0; wi < weekdayNodes.length; wi += 1) weekdayNodes[wi].classList.add('qxframe9a7c2-calendar-weekday');
    }
    grid.classList.add('qxframe9a7c2-calendar-grid');if(domBinding.refs.weekdays)domBinding.refs.weekdays.hidden=isPeriod;
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
      if (!canNavigate()) return;
      changeView(addPage(viewValue, Number(DOM.getPrivate(payload.target, 'calendarNav'))), { source: DOM.activationSource(payload.event), reason: 'nav' });
      focusKeyboardHost();
    });
    delegation.on('click', DOM.privateMatcher('calendarTitle'), function (payload) {
      if(canNavigate())requestTitle(String(DOM.getPrivate(payload.target,'calendarTitle')||''),payload.event,DOM.activationSource(payload.event));
    });
    delegation.on('click', DOM.privateMatcher('calendarDate'), function (payload) {
      if (opts.disabled === true) return;
      var date = parseDate(DOM.getPrivate(payload.target, 'calendarDate'));
      if (!date || isDisabledDate(date)) { focusKeyboardHost(); return; }
      setActiveDate(date, { source: DOM.activationSource(payload.event), reason: 'cell' });
      selectDate(date, { source: DOM.activationSource(payload.event), reason: 'cell', originalEvent: payload.event });
      focusKeyboardHost();
    });
    interactionController = InteractionController.create();
    interactionController.registerScope({
      id:'calendar', root:root, document:doc, profile:{ allowEditableKeys:true },
      onAction:function (action, context) { return handleInteractionAction(action, context.originalEvent) ? 'handled' : 'pass'; }
    });
    scope.add(function () { if (interactionController) interactionController.destroy(); interactionController = null; });
    keyboardRegion = FocusController.create({
      root: root,
      hosted: false,
      disabled: opts.disabled === true,
      activeRegion: 'calendar',
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
    if(isPeriod){
      var present=cells.find(function(e){return e.key===activeItem.activeKey&&!e.disabled;});
      if(present)return true;
      var committed=cells.find(function(e){return !e.disabled&&sameDay(e.date,valueState.value);});
      var first=committed||cells.find(function(e){return !e.disabled&&!e.outside;})||cells.find(function(e){return !e.disabled;});
      return first?activeItem.set(first.key,{silent:true,source:meta&&meta.source||'view',reason:'period-reconcile'}):activeItem.clear({silent:true});
    }
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
    root.classList.toggle('is-period',isPeriod);
    if(domBinding.refs.weekdays)domBinding.refs.weekdays.hidden=isPeriod;
    if(domBinding.refs.yearTitle)DOM.setPrivate(domBinding.refs.yearTitle,'calendarTitle',isPeriod?'period':'year');
    buildCells();
    if(domBinding&&domBinding.refs.yearTitle&&domBinding.refs.monthTitle){
      domBinding.refs.yearTitle.textContent=isPeriod?periodTitle(viewValue):String(viewValue.getFullYear());
      domBinding.refs.monthTitle.textContent=String(viewValue.getMonth()+1).padStart(2,'0');
      domBinding.refs.yearTitle.disabled=!canOpenTitle(isPeriod?'period':'year');
      domBinding.refs.monthTitle.disabled=!canOpenTitle('month');
      domBinding.refs.monthTitle.hidden=isPeriod;
    }else title.textContent=isPeriod?periodTitle(viewValue):viewValue.getFullYear()+'-'+String(viewValue.getMonth()+1).padStart(2,'0');
    grid.textContent = '';
    var fragment = doc.createDocumentFragment();
    cells.forEach(function (entry) {
      var button = DOMFactory.createCell({ document: doc, options: opts, entry: entry });
      button.classList.add('qxframe9a7c2-calendar-cell','qxframe9a7c2-date-panel-cell');
      // Render only the visible inner square; do not remove the style wrappers
      // or move the calendarDate private key/event delegation off the button.
      var cellInner = button.firstElementChild.firstElementChild;
      var cellOutput=typeof opts.renderCell==='function'&&(!isPeriod||valueUnit!=='date')?opts.renderCell(cloneDate(entry.date),{entry:entry,unit:unit,viewMode:viewMode,calendar:api}):(isPeriod?entry.label:String(entry.date.getDate()));
      Renderer.append(cellInner, cellOutput);
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
    var today = normalizeValue(new Date());
    var selectedWeek = unit === 'week' ? weekBounds(valueState.value) : null;
    var hoveredWeek = unit === 'week' ? weekBounds(hoveredKey ? parseDate(hoveredKey) : null) : null;
    for (var i = 0; i < nodes.length; i += 1) {
      var date = parseDate(DOM.getPrivate(nodes[i], 'calendarDate'));
      var getState=isPeriod&&valueUnit==='date'?null:opts.getCellState||opts.getItemState;
      var external=typeof getState==='function'?getState(cloneDate(date),{unit:unit,calendar:api,entry:cells.find(function(c){return sameDay(c.date,date);})||null}):null;
      var state = external && typeof external === 'object' ? external : {};
      var weekSelected = !!(selectedWeek && date >= selectedWeek.start && date <= selectedWeek.end);
      var weekHovered = !!(hoveredWeek && date >= hoveredWeek.start && date <= hoveredWeek.end);
      var weekStart = !!((weekSelected && sameDay(date, selectedWeek.start)) || (weekHovered && sameDay(date, hoveredWeek.start)));
      var weekEnd = !!((weekSelected && sameDay(date, selectedWeek.end)) || (weekHovered && sameDay(date, hoveredWeek.end)));
      var selected = Object.prototype.hasOwnProperty.call(state, 'selected') ? state.selected === true
        : unit === 'week' ? weekSelected && (sameDay(date,selectedWeek.start) || sameDay(date,selectedWeek.end))
        : sameDay(date, valueState.value);
      nodes[i].classList.toggle('is-selected', selected);
      nodes[i].classList.toggle('is-today', !isPeriod&&sameDay(date,today));
      nodes[i].classList.toggle('is-current', isPeriod&&sameDay(date,today));
      nodes[i].classList.toggle('is-week-selected', weekSelected);
      nodes[i].classList.toggle('is-week-hover', weekHovered);
      nodes[i].classList.toggle('is-in-range', state.inRange === true || weekSelected || weekHovered);
      nodes[i].classList.toggle('is-range-start', state.rangeStart === true || weekStart);
      nodes[i].classList.toggle('is-range-end', state.rangeEnd === true || weekEnd);
      var visualActiveOwner = !hostedVirtualFocus || (virtualFocusController && virtualFocusDomain && virtualFocusController.getState().domain === virtualFocusDomain.name);
      nodes[i].classList.toggle('is-active', visualActiveOwner && DOM.getPrivate(nodes[i], 'calendarDate') === activeItem.activeKey);
      nodes[i].classList.toggle('is-hover', state.hover === true || (unit === 'week' ? weekHovered : DOM.getPrivate(nodes[i], 'calendarDate') === hoveredKey));
      nodes[i];
    }
  }
    
  function setViewMode(next,meta){
    if(destroyed)return false;
    var mode=String(next||'').toLowerCase();
    if(!['date','month','quarter','year','decade'].includes(mode))throw new TypeError('[QXFRAME9A7C2] Invalid Calendar viewMode.');
    if(valueUnit!=='date'&&mode!==unit)throw new Error('[QXFRAME9A7C2] Calendar period unit fixes its selection view.');
    if(mode===viewMode)return true;
    var previous=viewMode;
    viewMode=mode;periodUnit=mode==='decade'?'year':mode;isPeriod=periodUnit!=='date';
    opts.viewMode=mode;viewValue=startMonth(viewValue);hoveredKey=null;
    render(meta);
    if(!(meta&&meta.silent)){
      var detail={viewMode:mode,previousViewMode:previous,viewValue:cloneDate(viewValue),source:meta&&meta.source||'api',reason:meta&&meta.reason||'view-mode',calendar:api};
      if(typeof opts.onViewModeChange==='function')opts.onViewModeChange(mode,detail);
      emitter.emit('viewModeChange',detail);
    }
    return true;
  }
  function requestTitle(kind,event,source){
    if(!canOpenTitle(kind))return false;
    var detail={unit:kind==='period'?periodUnit:kind,viewMode:viewMode,viewValue:cloneDate(viewValue),originalEvent:event||null,source:source||'api',reason:'title',calendar:api};
    if(kind==='month'){
      if(typeof opts.onMonthRequest==='function')opts.onMonthRequest(cloneDate(viewValue),detail);
      else setViewMode('month',detail);
    }else if((unit==='date'||unit==='week')&&(kind==='year'||kind==='period')){
      if(typeof opts.onYearRequest==='function')opts.onYearRequest(cloneDate(viewValue),detail);
      else setViewMode('year',detail);
    }else if(kind==='period'&&typeof opts.onTitleRequest==='function'){
      opts.onTitleRequest(cloneDate(viewValue),detail);emitter.emit('titleRequest',detail);
    }
    return true;
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
    if (destroyed || !canSelect()) return false;
    var parsed = parseDate(next); if (!parsed || isDisabledDate(parsed)) return false;
    if(valueUnit==='date'&&isPeriod){
      var drill={viewMode:viewMode,viewValue:cloneDate(viewValue),source:meta&&meta.source||'api',reason:meta&&meta.reason||'drill-select',originalEvent:meta&&meta.originalEvent||null,calendar:api};
      if(typeof opts.onDrillSelect==='function')opts.onDrillSelect(cloneDate(parsed),drill);
      else{
        setViewMode(periodUnit==='year'?'month':'date',{silent:true,source:drill.source});
        changeView(parsed,{silent:true,source:drill.source});
      }
      emitter.emit('drillSelect',drill);
      return true;
    }
    var selected = normalizeCommitted(parsed);
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
    var parsed = next === null || next === undefined || next === '' ? null : parseCommitted(next); if (next !== null && next !== undefined && next !== '' && !parsed) return false;
    var previous = cloneDate(valueState.value);
    valueState.setValue(parsed ? normalizeCommitted(parsed) : null, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-value', originalEvent: meta && meta.originalEvent || null });
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
    
  function handleInteractionAction(actionName, event) {
    if (!event || !canNavigate()) return false;
    var target = event.target || null;
    var navTarget = target ? DOM.closestPrivate(target, root, 'calendarNav') : null;
    var titleTarget = target ? DOM.closestPrivate(target, root, 'calendarTitle') : null;
    if (navTarget && actionName === 'ACTIVATE') return false;
    if (titleTarget) {
      var titleUnit = String(DOM.getPrivate(titleTarget, 'calendarTitle') || '');
      if (actionName === 'ACTIVATE') {
        return requestTitle(titleUnit,event,'keyboard');
      }
      if (['MOVE_LEFT','MOVE_RIGHT','MOVE_UP','MOVE_DOWN'].indexOf(actionName) >= 0) {
        var direction = actionName === 'MOVE_LEFT' || actionName === 'MOVE_UP' ? -1 : 1;
        if(titleUnit==='period'){
          changeView(addPage(viewValue,direction),{source:'keyboard',reason:'title-'+periodUnit+'-step',originalEvent:event});return true;
        }
        var monthDelta = titleUnit === 'year' ? direction * 12 : direction;
        if (titleUnit !== 'year' && titleUnit !== 'month') return false;
        changeView(addMonths(viewValue, monthDelta), { source:'keyboard', reason:'title-' + titleUnit + '-step', originalEvent:event });
        return true;
      }
      return false;
    }
    var key = InteractionController.keyboardKeyForAction(actionName);
    if (!key) return false;
    var activeDate = parseDate(activeItem.activeKey);
    var committedInView = valueState.value && sameMonth(valueState.value, viewValue) ? valueState.value : null;
    var current = activeDate && sameMonth(activeDate, viewValue) ? activeDate : (committedInView || new Date(viewValue.getFullYear(), viewValue.getMonth(), 1));
    var gridAction = TemporalGrid.keyAction(key, { columns:isPeriod?4:7 });
    if (!gridAction) return false;
    if(isPeriod){
      if(gridAction.type==='activate'){if(canSelect())selectDate(current,{source:'keyboard',reason:'activate',originalEvent:event});return true;}
      if(gridAction.type==='page')return changeView(addPage(viewValue,gridAction.amount),{source:'keyboard',reason:key,originalEvent:event});
      if(gridAction.type==='home'||gridAction.type==='end'){
        var options=cells.filter(function(e){return !e.disabled&&!e.outside;});
        var selected=gridAction.type==='home'?options[0]:options[options.length-1];
        return selected?setActiveDate(selected.date,{source:'keyboard',reason:key,originalEvent:event}):true;
      }
      if(gridAction.type==='step'){
        var step=gridAction.amount,next=addUnit(current,step),count=0;
        while(next&&isDisabledDate(next)&&count++<240)next=addUnit(next,step<0?-1:1);
        return next&&count<240?setActiveDate(next,{source:'keyboard',reason:key,originalEvent:event}):true;
      }
      return false;
    }
    if (gridAction.type === 'activate') { if (canSelect()) selectDate(current, { source:'keyboard', reason:'activate', originalEvent:event }); return true; }
    var next = TemporalGrid.moveDateByKey(current, key, { columns:7, weekStartsOn:weekStartsOn() });
    var guard = 0, backward = gridAction.action === 'left' || gridAction.action === 'up' || gridAction.action === 'home' || gridAction.action === 'page-up';
    while (next && isDisabledDate(next) && guard < 370) { next = addDays(next, backward ? -1 : 1); guard += 1; }
    if (next && guard < 370) setActiveDate(next, { source: 'keyboard', reason: key, originalEvent:event });
    return true;
  }
  function onKeydown(event) {
    if (!event || !interactionController) return false;
    return interactionController.dispatch(event, { ownerId:'calendar' }) === 'handled';
  }
    
  function getCellElement(key) {
    if (!grid) return null;
    var nodes = DOM.findAllPrivate(grid, 'calendarDate');
    for (var i = 0; i < nodes.length; i += 1) if (String(DOM.getPrivate(nodes[i], 'calendarDate')) === String(key)) return nodes[i];
    return null;
  }
  function bindVirtualFocus(controller, hosted) {
    var binding = keyboardRegion.bindVirtualFocus({
      controller: controller,
      previousDomain: virtualFocusDomain,
      hosted: hosted,
      activeKey: activeItem.activeKey,
      activation: { reason:'calendar-bind', ensureVisible:false },
      domain: {
        name:virtualFocusDomainName,
        getElement:function(key){ return getCellElement(key); },
        reconcile:function(key){ var cell=cells.find(function(entry){return entry.key===String(key)&&entry.disabled!==true;}); if(cell)return cell.key; return activeItem.activeKey || null; },
        ensureVisible:function(key){var el=getCellElement(key);return isPeriod&&el&&grid?ScrollVisibility.ensureVisible(grid,el,{axis:'both',align:'nearest'}):true;}
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
    var next=nextOptions||{};if(Object.prototype.hasOwnProperty.call(next,'unit')&&String(next.unit)!==unit)throw new Error('[QXFRAME9A7C2] Calendar unit is immutable.');opts=mergeOptions(opts,next);
    if(Object.prototype.hasOwnProperty.call(next,'viewMode'))setViewMode(next.viewMode,{silent:true,source:'options'});
    capabilityController.updateOptions({});
    if (Object.prototype.hasOwnProperty.call(Object(next), 'controlled')) valueState.setControlled(opts.controlled === true);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) { setValue(next.value, { source: 'options', reason: 'options-value', silent: true }); }
    if (Object.prototype.hasOwnProperty.call(Object(next), 'viewValue')) changeView(next.viewValue, { source: 'options', reason: 'controlled-view', silent: true });
    if (keyboardRegion) keyboardRegion.setDisabled(opts.disabled === true);
    applyCellSize();
    render();
    return api;
  }
    
  function destroy() {
    if (destroyed) return false; destroyed = true; valueState.destroy(); if (virtualFocusDomain) virtualFocusDomain.destroy(); virtualFocusDomain=null; virtualFocusController=null; scope.dispose(); keyboardRegion = null; keyboard = null; activeItem.destroy(); emitter.dispose(); if (domBinding) domBinding.release(); domBinding = null; root = null; grid = null; title = null; cells = []; hoveredKey = null; return true;
  }
    
  api = {
    setValue: setValue,
    clear: function (meta) { return setValue(null, meta); },
    setViewValue: changeView,
    setViewMode: setViewMode,
    prev: function () { return changeView(addPage(viewValue, -1), { source: 'api', reason: 'prev' }); },
    next: function () { return changeView(addPage(viewValue, 1), { source: 'api', reason: 'next' }); },
    setActiveDate: setActiveDate,
    setActiveValue: setActiveDate,
    focus: function () { return hostedVirtualFocus ? false : !!(keyboardRegion && keyboardRegion.focus()); },
    handleKeydown: onKeydown,
    bindVirtualFocus: bindVirtualFocus,
    getVirtualFocusDomain: function () { return virtualFocusDomain; },
    refresh: function () { render(); return api; },
    refreshStates: function () { syncCellStates(); return api; },
    updateOptions: updateOptions,
    getState: function () {return Object.freeze({unit:unit,viewMode:viewMode,value:cloneDate(valueState.value),viewValue:cloneDate(viewValue),activeKey:activeItem.activeKey,activeValue:parseDate(activeItem.activeKey),hoverValue:parseDate(hoveredKey),disabled:opts.disabled===true,readOnly:isReadOnly(),destroyed:destroyed});},
    getItems: function(){return cells.map(function(c){return {key:c.key,date:cloneDate(c.date),label:c.label||String(c.date.getDate()),disabled:c.disabled};});},
    getRootElement: function () { return root; },
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    getCells: function () { return cells.map(function (entry) { return { key: entry.key, date: cloneDate(entry.date), disabled: entry.disabled, outside: entry.outside }; }); },
    getEventDelegation: function () { return delegation; },
    getKeyboardNavigation: function () { return keyboard; },
    getKeyboardRegion: function () { return keyboardRegion && keyboardRegion.getKeyboardRegion ? keyboardRegion.getKeyboardRegion() : keyboardRegion; },
    getFocusController: function () { return keyboardRegion; },
    getInteractionController: function () { return interactionController; },
    getCapabilityController: function () { return capabilityController; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
  mount();
  return api;
}
    

export const Calendar = Object.freeze({ create, parseDate, keyOf, createDefaultDOM: DOMFactory.createDefaultDOM });
