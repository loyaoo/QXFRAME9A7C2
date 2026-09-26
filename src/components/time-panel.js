// Canonical ESM TimePanel building block.
import { DOMTemplate } from '../core/domTemplate.js';
import { Events } from '../core/events.js';
import { Scheduler } from '../core/scheduler.js';
import { DOMBinding } from '../core/domBinding.js';
import { CapabilityController } from '../core/capabilityController.js';
import { FocusController } from '../core/focusController.js';
import { Utils } from '../utils/utils.js';
import { TimeUnit } from '../utils/timeUnit.js';
import { WheelMetrics } from '../utils/wheelMetrics.js';
import { mergeOptions } from '../core/options.js';
import { WheelPanel } from './wheel-panel.js';

let DOMFactory;
var blueprint=DOMTemplate.staticHTML`<div class="qxframe9a7c2-time-panel-root" data-qxframe9a7c2-ref="root"><div class="qxframe9a7c2-time-panel-wrapper" data-qxframe9a7c2-ref="columns"></div></div>`;
function createDefaultDOM(context){var instance=blueprint.instantiate(context.document);return{root:instance.root,refs:instance.refs};}
DOMFactory = Object.freeze({createDefaultDOM:createDefaultDOM,blueprint:blueprint});

var own = Utils.own;

function disabledSetFor(options, kind, current) {
  var key = kind === 'hour' ? 'disabledHours' : (kind === 'minute' ? 'disabledMinutes' : 'disabledSeconds');
  var source = options[key];
  if (typeof source === 'function') source = source(TimeUnit.clone(current));
  return Array.isArray(source) ? source.map(Number) : [];
}
function optionItemsFor(options, kind, max, step, current) {
  var disabled = disabledSetFor(options, kind, current);
  var output = [];
  var normalizedStep = Math.max(1, Math.floor(Number(step) || 1));
  for (var i = 0; i <= max; i += normalizedStep) {
    var isDisabled = disabled.indexOf(i) >= 0;
    if (options.hideDisabledOptions === true && isDisabled) continue;
    output.push({ key: kind + ':' + i, value: String(i), label: TimeUnit.pad(i), disabled: isDisabled });
  }
  return output;
}
function hour12ItemsFor(options, current) {
  var meridiem = TimeUnit.meridiem(current.hour);
  var disabled = disabledSetFor(options, 'hour', current);
  var output = [];
  var step = Math.max(1, Math.floor(Number(options.hourStep) || 1));
  for (var h = 1; h <= 12; h += step) {
    var hour24 = TimeUnit.to24(h, meridiem);
    var isDisabled = disabled.indexOf(hour24) >= 0;
    if (options.hideDisabledOptions === true && isDisabled) continue;
    output.push({ key: 'hour12:' + h, value: String(h), label: TimeUnit.pad(h), disabled: isDisabled });
  }
  return output;
}
function availableColumnsFor(options, current) {
  var columns = [];
  if (options.use12Hours === true) {
    columns.push({ key:'hour', label:'Hour', items:hour12ItemsFor(options, current) });
    columns.push({ key:'meridiem', label:'AM/PM', items:[
      { key:'meridiem:AM', value:'AM', label:'AM' },
      { key:'meridiem:PM', value:'PM', label:'PM' }
    ] });
  } else columns.push({ key:'hour', label:'Hour', items:optionItemsFor(options, 'hour', 23, options.hourStep, current) });
  columns.push({ key:'minute', label:'Minute', items:optionItemsFor(options, 'minute', 59, options.minuteStep, current) });
  if (options.showSecond !== false) columns.push({ key:'second', label:'Second', items:optionItemsFor(options, 'second', 59, options.secondStep, current) });
  return columns;
}
function wheelValueFor(options, current) {
  var output = [];
  if (options.use12Hours === true) output.push(String(TimeUnit.displayHour(current.hour)), TimeUnit.meridiem(current.hour));
  else output.push(String(current.hour));
  output.push(String(current.minute));
  if (options.showSecond !== false) output.push(String(current.second));
  return output;
}
function valueFromWheelFor(options, next, current) {
  var cursor = 0;
  var result = TimeUnit.clone(current);
  if (options.use12Hours === true) {
    var hour12 = Number(next[cursor++]);
    var meridiem = String(next[cursor++] || TimeUnit.meridiem(current.hour));
    result.hour = TimeUnit.to24(hour12, meridiem);
  } else result.hour = TimeUnit.clamp(Number(next[cursor++]), 0, 23);
  result.minute = TimeUnit.clamp(Number(next[cursor++]), 0, 59);
  if (options.showSecond !== false) result.second = TimeUnit.clamp(Number(next[cursor++]), 0, 59);
  return result;
}
function firstEnabledValue(items, target) {
  var wanted = target === undefined || target === null ? null : String(target);
  var fallback = null;
  for (var i = 0; i < items.length; i += 1) {
    if (items[i].disabled === true) continue;
    if (fallback === null) fallback = items[i].value;
    if (wanted !== null && String(items[i].value) === wanted) return items[i].value;
  }
  return fallback;
}
function normalizeAvailableValue(next, options) {
  var current = TimeUnit.normalizeClamped(next);
  var opts = options || {};
  for (var pass = 0; pass < 3; pass += 1) {
    var columns = availableColumnsFor(opts, current);
    var requested = wheelValueFor(opts, current);
    var selected = columns.map(function (column, index) { return firstEnabledValue(column.items || [], requested[index]); });
    var normalized = valueFromWheelFor(opts, selected, current);
    if (TimeUnit.equal(normalized, current)) return current;
    current = normalized;
  }
  return current;
}

function create(options) {
  var incoming = options || {};
  var itemHeightExplicit = own(incoming, 'itemHeight');
  var opts = mergeOptions({
    showSecond: true,
    use12Hours: false,
    hourStep: 1,
    minuteStep: 1,
    secondStep: 1,
    hideDisabledOptions: false,
    visibleItemCount: 7,
    size: 'md',
    scrollbarVisibility: 'auto',
    snapBehavior: 'smooth',
    snapDuration: 180,
    scrollIdleDelay: 90,
    changeOnScroll: false,
    disabled: false,
    readOnly: false
  }, incoming);
  if (!itemHeightExplicit) opts.itemHeight = WheelMetrics.itemHeight(opts.size);
  var doc = opts.document || (opts.container && opts.container.ownerDocument) || globalThis.document;
  var emitter = Events.createEmitter();
  var value = normalizeAvailableValue(opts.value !== undefined ? opts.value : opts.defaultValue, opts);
  var destroyed = false;
  var root = null;
  var columnsHost = null;
  var domBinding = null;
  var wheel = null;
  var focusController = null;
  var capabilityController = CapabilityController.create({ getState:function () { return opts; } });
  var columnIndex = Object.create(null);
  var api = null;
  var structuralRefreshScheduler = Scheduler.createDelayScheduler(function (_timestamp, reason) {
    if (!destroyed) refreshWheel(reason || 'time-panel-structural-idle');
  });

  function buildColumns(currentValue) {
    var columns = availableColumnsFor(opts, currentValue || value);
    columnIndex = Object.create(null);
    columns.forEach(function (column, index) { columnIndex[column.key] = index; });
    return columns;
  }
  function renderWheelItem(item, context) {
    if (typeof opts.cellRender !== 'function') return item.label;
    var origin = doc.createElement('span');
    origin.className = 'qxframe9a7c2-time-panel-cell-origin';
    origin.textContent = String(item.label);
    var subType = context && context.columnKey === 'meridiem' ? 'meridiem' : (context && context.columnKey || 'hour');
    var current = subType === 'meridiem' ? item.value : Number(item.value);
    return opts.cellRender(current, Object.freeze({ originNode: origin, subType: subType, timePanel: api }));
  }
  function wheelValue(currentValue) { return wheelValueFor(opts, currentValue || value); }
  function valueFromWheel(next, currentValue) { return valueFromWheelFor(opts, next, currentValue || value); }
  function normalizeAvailable(next) { return normalizeAvailableValue(next, opts); }
  function hasDependentColumns() { return opts.use12Hours === true || typeof opts.disabledHours === 'function' || typeof opts.disabledMinutes === 'function' || typeof opts.disabledSeconds === 'function'; }
  function unitFromColumn(key) { return key === 'meridiem' ? 'hour' : key; }
  function hoverValue(item, detail) {
    if (!item) return null;
    var next = TimeUnit.clone(value);
    var key = detail && detail.columnKey || '';
    if (key === 'meridiem') next.hour = TimeUnit.to24(TimeUnit.displayHour(next.hour), String(item.value));
    else if (key === 'hour') next.hour = opts.use12Hours === true ? TimeUnit.to24(Number(item.value), TimeUnit.meridiem(next.hour)) : TimeUnit.clamp(Number(item.value), 0, 23);
    else if (key === 'minute') next.minute = TimeUnit.clamp(Number(item.value), 0, 59);
    else if (key === 'second') next.second = TimeUnit.clamp(Number(item.value), 0, 59);
    return next;
  }
  function handleItemHover(item, detail) {
    var preview = hoverValue(item, detail);
    var payload = { value: preview ? TimeUnit.clone(preview) : null, unit: unitFromColumn(detail && detail.columnKey || 'hour'), source: detail && detail.source || 'pointer', reason: detail && detail.reason || (preview ? 'hover' : 'hover-leave'), originalEvent: detail && detail.originalEvent || null, timePanel: api };
    if (typeof opts.onHoverChange === 'function') opts.onHoverChange(preview ? TimeUnit.clone(preview) : null, payload);
    emitter.emit('hoverChange', payload);
  }
  function syncClass() {
    if (!root) return;
    ['xs','sm','md','lg','xl'].forEach(function (size) { root.classList.remove('is-' + size); });
    root.classList.add('is-' + (['xs','sm','md','lg','xl'].indexOf(String(opts.size || 'md')) >= 0 ? String(opts.size || 'md') : 'md'));
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
  }
  function mount() {
    var host = opts.container || null;
    if (!host && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] TimePanel container is required unless options.elements supplies existing DOM.');
    domBinding = DOMBinding.resolve({ options: opts, target: host, component: api, requiredRefs: ['root','columns'], defaultFactory: DOMFactory.createDefaultDOM });
    root = domBinding.refs.root;
    columnsHost = domBinding.refs.columns;
    root.classList.add('qxframe9a7c2-time-panel-root');
    columnsHost.classList.add('qxframe9a7c2-time-panel-wrapper');
    focusController = FocusController.create({
      root: root,
      document: doc,
      disabled: opts.disabled === true,
      activeRegion: 'column',
      navigation: {
        editableKeys: true,
        handlers: FocusController.forwardHandlers(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'], function (event) {
          return wheel ? wheel.handleKeydown(event) : false;
        })
      },
      onEnter: function (detail) {
        if (!wheel) return;
        var wheelState = wheel.getState();
        wheel.setActiveColumn(wheelState.activeColumnIndex || 0, { source:'keyboard', reason:'time-panel-region-enter', originalEvent:detail.originalEvent || null });
      }
    });
    wheel = WheelPanel.create({
      container: columnsHost,
      document: doc,
      columns: buildColumns(),
      value: wheelValue(),
      visibleItemCount: opts.visibleItemCount,
      itemHeight: opts.itemHeight,
      size: opts.size,
      scrollbarVisibility: opts.scrollbarVisibility || 'auto',
      wheelPropagation: opts.wheelPropagation !== false,
      snapBehavior: opts.snapBehavior || 'smooth',
      snapDuration: opts.snapDuration,
      scrollIdleDelay: opts.scrollIdleDelay,
      loop: opts.loop === true,
      changeOnScroll: opts.changeOnScroll === true,
      renderItem: renderWheelItem,
      onItemHover: handleItemHover,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      loading: opts.loading === true || opts.busy === true,
      onChange: function (next, detail) {
        if (destroyed || !capabilityController.can('select')) return;
        var previous = TimeUnit.clone(value);
        value = valueFromWheel(next);
        if (hasDependentColumns()) value = normalizeAvailable(value);
        if (TimeUnit.equal(previous, value)) return;
        var unit = unitFromColumn(detail && detail.columnKey || 'hour');
        var payload = { value: TimeUnit.clone(value), previousValue: previous, unit: unit, source: detail && detail.source || 'user', reason: detail && detail.reason || 'select', originalEvent: detail && detail.originalEvent || null, timePanel: api };
        if (typeof opts.onSelect === 'function') opts.onSelect(TimeUnit.clone(value), payload);
        if (typeof opts.onChange === 'function') opts.onChange(TimeUnit.clone(value), payload);
        emitter.emit('select', payload); emitter.emit('change', payload);
        // Dependent columns may change after a selection, but the active wheel must not
        // destroy itself inside the same keyboard/pointer callback. Coalesce structural
        // refresh until interaction idle; repeated Arrow/key-repeat therefore keeps the
        // active column DOM + VirtualFocus identity stable for the whole burst.
        if (hasDependentColumns()) structuralRefreshScheduler.request(120, 'time-panel-dependent-columns');
      }
    });
    wheel.bindVirtualFocus(focusController.virtualFocus, true);
    wheel.on('scrollSettle', function (detail) {
      if (destroyed || opts.changeOnScroll !== true) return;
      emitter.emit('scrollSettle', {
        value: TimeUnit.clone(value), unit: unitFromColumn(detail && detail.columnKey || 'hour'),
        source: detail && detail.source || 'scroll', reason: detail && detail.reason || 'snap', timePanel: api
      });
    });
    syncClass();
  }
  function refreshWheel(reason) {
    if (!wheel) return false;
    value = normalizeAvailable(value);
    wheel.updateOptions({
      columns: buildColumns(value),
      value: wheelValue(value),
      visibleItemCount: opts.visibleItemCount,
      itemHeight: opts.itemHeight,
      size: opts.size,
      scrollbarVisibility: opts.scrollbarVisibility || 'auto',
      wheelPropagation: opts.wheelPropagation !== false,
      snapBehavior: opts.snapBehavior || 'smooth',
      snapDuration: opts.snapDuration,
      scrollIdleDelay: opts.scrollIdleDelay,
      loop: opts.loop === true,
      changeOnScroll: opts.changeOnScroll === true,
      renderItem: renderWheelItem,
      onItemHover: handleItemHover,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      loading: opts.loading === true || opts.busy === true
    });
    syncClass();
    return true;
  }
  function changeUnit(unit, next, detail) {
    if (destroyed || !capabilityController.can('select')) return false;
    var previous = TimeUnit.clone(value);
    value[unit] = TimeUnit.clamp(Number(next), 0, unit === 'hour' ? 23 : 59);
    value = normalizeAvailable(value);
    if (TimeUnit.equal(previous, value)) return true;
    refreshWheel('time-panel-set-' + unit);
    var payload = { value: TimeUnit.clone(value), previousValue: previous, unit: unit, source: detail && detail.source || 'api', reason: detail && detail.reason || 'select', timePanel: api };
    if (typeof opts.onSelect === 'function') opts.onSelect(TimeUnit.clone(value), payload);
    if (typeof opts.onChange === 'function') opts.onChange(TimeUnit.clone(value), payload);
    emitter.emit('select', payload); emitter.emit('change', payload); return true;
  }
  function setValue(next, meta) {
    if (destroyed) return false;
    var normalized = normalizeAvailable(next); var previous = TimeUnit.clone(value); value = normalized;
    refreshWheel('time-panel-set-value');
    if (!(meta && meta.silent) && !TimeUnit.equal(previous, value)) {
      var payload = { value: TimeUnit.clone(value), previousValue: previous, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-value', timePanel: api };
      if (typeof opts.onChange === 'function') opts.onChange(TimeUnit.clone(value), payload); emitter.emit('change', payload);
    }
    return true;
  }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (own(next, 'itemHeight')) itemHeightExplicit = true;
    opts = mergeOptions(opts, next);
    capabilityController.updateOptions({});
    if (!itemHeightExplicit && own(next, 'size')) opts.itemHeight = WheelMetrics.itemHeight(opts.size);
    value = normalizeAvailable(Object.prototype.hasOwnProperty.call(Object(next), 'value') ? next.value : value);
    structuralRefreshScheduler.cancel();
    refreshWheel('time-panel-options');
    if (focusController) focusController.setDisabled(opts.disabled === true);
    if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
    return api;
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    structuralRefreshScheduler.dispose();
    if (wheel) wheel.destroy(); wheel = null;
    if (focusController) focusController.destroy(); focusController = null;
    if (capabilityController) capabilityController.destroy(); capabilityController = null;
    emitter.dispose();
    if (domBinding) domBinding.release();
    domBinding = null; columnsHost = root = null;
    return true;
  }

  api = {
    setValue: setValue,
    setHour: function (next) { return changeUnit('hour', next, { source: 'api', reason: 'set-hour' }); },
    setMinute: function (next) { return changeUnit('minute', next, { source: 'api', reason: 'set-minute' }); },
    setSecond: function (next) { return changeUnit('second', next, { source: 'api', reason: 'set-second' }); },
    refresh: function (reason) { return refreshWheel(reason || 'time-panel-refresh'); },
    updateOptions: updateOptions,
    getState: function () { return Object.freeze({ value: TimeUnit.clone(value), text: TimeUnit.format24(value, opts.showSecond !== false), activeKeys: wheel ? wheel.getState().value.slice() : [], focus: focusController ? focusController.getState() : null, hideDisabledOptions: opts.hideDisabledOptions === true, changeOnScroll: opts.changeOnScroll === true, disabled: opts.disabled === true, readOnly: opts.readOnly === true, destroyed: destroyed }); },
    getRootElement: function () { return root; },
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    getWheelPanel: function () { return wheel; },
    getFocusController: function () { return focusController; },
    getInteractionController: function () { return wheel && wheel.getInteractionController ? wheel.getInteractionController() : null; },
    getCapabilityController: function () { return capabilityController; },
    setActiveColumn: function (index, meta) { if (wheel) wheel.setActiveColumn(index, meta); return api; },
    handleKeydown: function (event) { return wheel ? wheel.handleKeydown(event) : false; },
    focus: function () { return focusController ? focusController.focus() : false; },
    bindVirtualFocus: function (controller, hosted) {
      if (!wheel || !focusController) return null;
      var targetController = controller || focusController.virtualFocus;
      var externalHost = targetController !== focusController.virtualFocus;
      focusController.setHosted(hosted === true || externalHost);
      return wheel.bindVirtualFocus(targetController, true);
    },
    getVirtualFocusDomain: function () { return wheel ? wheel.getVirtualFocusDomain() : null; },
    getColumnItems: function (name) { var index = columnIndex[String(name)]; return index === undefined || !wheel ? [] : wheel.getColumnItems(index); },
    getColumnScroll: function (name) { var index = columnIndex[String(name)]; return index === undefined || !wheel ? null : wheel.getColumnScroll(index); },
    on: emitter.on, once: emitter.once, destroy: destroy
  };
  mount();
  return api;
}

export const TimePanel = Object.freeze({ create, normalize:TimeUnit.normalizeClamped, normalizeAvailable:normalizeAvailableValue, format:TimeUnit.format24, createDefaultDOM: DOMFactory.createDefaultDOM });
