import { PickerComponent, pickerHooks } from './picker.js';
import { PickerField } from './picker-field.js';
import { Calendar } from './calendar.js';
import { PeriodPanel } from './period-panel.js';
import { TimePanel } from './time-panel.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { StateController } from '../core/stateController.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { SelectionTags } from '../core/selectionTags.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { TagNavigation } from '../core/tagNavigation.js';
import { DateUnit } from '../utils/dateUnit.js';
import { DOM } from '../core/dom.js';
import { Events } from '../core/events.js';
import { Utils } from '../utils/utils.js';

const runtimeState = new WeakMap();
const DATE_PICKER_DEFAULTS = Object.freeze({
  selection:'single', unit:'date', time:false, clearable:true, needConfirm:false, showCancel:false, closeOnSelect:true,
  commitInputOnBlur:true, preserveInvalidOnBlur:false, disabled:false, readOnly:false, size:'md', placement:'bottom-start',
  trigger:'click', open:false, placeholder:'选择日期', rangeSeparator:' ~ ', multipleSeparator:', ', order:true, panelCount:1,
  presets:[], previewValue:'hover', panelRender:null, weekStartsOn:1
});
const DATE_PICKER_IMMUTABLE = Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless','selection','unit','panelCount']);

var SELECTIONS = Object.freeze(['single', 'range', 'multiple']);
var own = Utils.own;
function normalizeSelectionName(value) {
  var selection = String(value || 'single').toLowerCase();
  if (SELECTIONS.indexOf(selection) < 0) throw new TypeError('[QXFRAME9A7C2] DatePicker selection must be single, range, or multiple.');
  return selection;
}
function timeConfig(value) {
  if (value === true) return {};
  if (value && typeof value === 'object' && !Array.isArray(value)) return Utils.mergeOwn( value);
  if (value === false || value === undefined || value === null) return null;
  throw new TypeError('[QXFRAME9A7C2] DatePicker time must be false, true, or an options object.');
}
function cloneDate(value) { return DateUnit.clone(value); }
function cloneValue(value, selection) {
  if (selection === 'single') return cloneDate(value);
  if (selection === 'range') return [cloneDate(value && value[0]), cloneDate(value && value[1])];
  return Array.isArray(value) ? value.map(cloneDate).filter(Boolean) : [];
}
function hasValue(value, selection) {
  if (selection === 'single') return !!value;
  if (selection === 'range') return !!(value && (value[0] || value[1]));
  return Array.isArray(value) && value.length > 0;
}
function emptyValue(selection) {
  if (selection === 'single') return null;
  if (selection === 'range') return [null, null];
  return [];
}
function valueEquals(left, right, selection, unit, weekStartsOn, withTime) {
  function sameOne(a, b) {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (withTime === true && unit === 'date') return a.getTime() === b.getTime();
    return DateUnit.same(a, b, unit, weekStartsOn);
  }
  if (selection === 'single') return sameOne(left, right);
  if (selection === 'range') return sameOne(left && left[0], right && right[0]) && sameOne(left && left[1], right && right[1]);
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  return left.every(function (value, index) { return sameOne(value, right[index]); });
}
function compareChronological(left, right) {
  if (!left || !right) return 0;
  return left.getTime() - right.getTime();
}
var addMonths = DateUnit.addMonths;
function dateTimeFrom(date, time) {
  var next = cloneDate(date);
  if (!next) return null;
  var source = time || { hour: 0, minute: 0, second: 0 };
  next.setHours(Number(source.hour || 0), Number(source.minute || 0), Number(source.second || 0), 0);
  return next;
}
function timeFromDate(date, fallback) {
  if (date) return { hour: date.getHours(), minute: date.getMinutes(), second: date.getSeconds() };
  if (fallback && typeof fallback === 'object') return { hour: Number(fallback.hour || 0), minute: Number(fallback.minute || 0), second: Number(fallback.second || 0) };
  return { hour: 0, minute: 0, second: 0 };
}

function setupDatePickerRuntime(instance, fieldInit) {
  var sourceOptions = fieldInit.options;
  var selection = normalizeSelectionName(sourceOptions.selection);
  var unit = String(sourceOptions.unit || 'date').toLowerCase();
  if (DateUnit.units.indexOf(unit) < 0) throw new TypeError('[QXFRAME9A7C2] DatePicker unit must be date, week, month, quarter, or year.');
  var timeOptions = timeConfig(sourceOptions.time);
  var withTime = !!timeOptions;
  if (withTime && unit !== 'date') throw new TypeError('[QXFRAME9A7C2] DatePicker time composition is only valid when unit is date.');
  if (withTime && selection === 'multiple') throw new TypeError('[QXFRAME9A7C2] DatePicker multiple selection does not compose time.');

  var derivedNeedConfirm = selection !== 'single' || withTime;
  var closeOnSelectExplicit = own(sourceOptions, 'closeOnSelect');
  var opts = Utils.assignOwn({
    selection: selection,
    unit: unit,
    time: timeOptions || false,
    clearable: true,
    needConfirm: derivedNeedConfirm,
    showCancel: derivedNeedConfirm,
    closeOnSelect: selection === 'single' && !withTime,
    commitInputOnBlur: true,
    preserveInvalidOnBlur: false,
    disabled: false,
    readOnly: false,
    size: 'md',
    placement: 'bottom-start',
    trigger: 'click',
    open: false,
    placeholder: selection === 'range' ? '选择日期范围' : (selection === 'multiple' ? '选择多个日期' : '选择日期'),
    rangeSeparator: ' ~ ',
    multipleSeparator: ', ',
    order: true,
    panelCount: selection === 'range' && (unit === 'date' || unit === 'week') ? 2 : 1,
    presets: [],
    previewValue: 'hover',
    panelRender: null,
    weekStartsOn: 1
  }, sourceOptions);
  if (!own(sourceOptions, 'needConfirm')) opts.needConfirm = derivedNeedConfirm;
  if (!own(sourceOptions, 'showCancel')) opts.showCancel = opts.needConfirm === true;
  if (!own(sourceOptions, 'closeOnSelect')) opts.closeOnSelect = selection === 'single' && opts.needConfirm !== true && !withTime;
  if (!own(sourceOptions, 'format')) opts.format = DateUnit.defaultFormat(unit, withTime);
  PickerField.validateHeadlessOptions(opts, 'DatePicker');

  var emitter = Object.freeze({ emit: function (type, payload) { return instance.emit(type, payload); } });
  var destroyed = false;
  var field = null;
  var calendar = null;
  var calendarSecondary = null;
  var calendarGroup = null;
  var calendarPrimaryHost = null;
  var calendarSecondaryHost = null;
  var periodPanel = null;
  var yearPanel = null;
  var monthPanel = null;
  var calendarPanelMode = 'date';
  var timePanel = null;
  var panelShell = null;
  var selectionHost = null;
  var timeHost = null;
  var presetsHost = null;
  var presetCleanups = [];
  var panelCleanups = [];
  var api = instance;
  var rawInput = '';
  var activeRangePart = 0;
  var hoverPreviewValue = null;
  var panelProjection = null;
  var keyboardRegion = 'selection';
  var activeCalendarPanel = 'primary';
  var tagNavigation = null;

  function formatPatterns() {
    var patterns = Array.isArray(opts.format) ? opts.format.slice() : [opts.format];
    if (!patterns.length || patterns.some(function (pattern) { return typeof pattern !== 'string' && typeof pattern !== 'function'; })) {
      throw new TypeError('[QXFRAME9A7C2] DatePicker format must be a string/function or a non-empty array of string/functions.');
    }
    return patterns;
  }
  function displayFormat() { return formatPatterns()[0]; }
  function normalizeOne(value) {
    if (value === null || value === undefined || value === '') return null;
    var patterns = formatPatterns();
    for (var i = 0; i < patterns.length; i += 1) {
      var parsed = DateUnit.parse(value, {
        unit: unit,
        weekStartsOn: opts.weekStartsOn,
        withTime: withTime,
        format: patterns[i],
        parseInput: opts.parseInput
      });
      if (parsed) return parsed;
    }
    return null;
  }
  function normalizeValue(value) {
    if (selection === 'single') {
      var one = normalizeOne(value);
      if (value !== null && value !== undefined && value !== '' && !one) throw new TypeError('[QXFRAME9A7C2] DatePicker value is invalid for the current unit/format.');
      return one;
    }
    if (selection === 'range') {
      if (value === null || value === undefined || value === '') return [null, null];
      if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] DatePicker range value must be a two-item array.');
      var start = normalizeOne(value[0]);
      var end = normalizeOne(value[1]);
      if ((value[0] !== null && value[0] !== undefined && value[0] !== '' && !start) || (value[1] !== null && value[1] !== undefined && value[1] !== '' && !end)) {
        throw new TypeError('[QXFRAME9A7C2] DatePicker range contains an invalid value.');
      }
      if (opts.order !== false && start && end && compareChronological(start, end) > 0) return [end, start];
      return [start, end];
    }
    if (value === null || value === undefined || value === '') return [];
    if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] DatePicker multiple value must be an array.');
    var output = [];
    value.forEach(function (entry) {
      var parsed = normalizeOne(entry);
      if (!parsed) throw new TypeError('[QXFRAME9A7C2] DatePicker multiple value contains an invalid entry.');
      if (!output.some(function (current) { return DateUnit.same(current, parsed, unit, opts.weekStartsOn); })) output.push(parsed);
    });
    if (opts.order !== false) output.sort(compareChronological);
    return output;
  }
  function formatOne(value) {
    return DateUnit.format(value, displayFormat(), { unit: unit, weekStartsOn: opts.weekStartsOn, withTime: withTime });
  }
  function formatSelection(value) {
    if (selection === 'single') return formatOne(value);
    if (selection === 'range') {
      var left = formatOne(value && value[0]);
      var right = formatOne(value && value[1]);
      if (!left && !right) return '';
      return left + String(opts.rangeSeparator) + right;
    }
    return (value || []).map(formatOne).join(String(opts.multipleSeparator));
  }
  function splitValidatedPair(source, separator) {
    var sep = String(separator);
    if (!sep) return null;
    var matches = [];
    var from = 0;
    while (from <= source.length) {
      var index = source.indexOf(sep, from);
      if (index < 0) break;
      var leftText = source.slice(0, index).trim();
      var rightText = source.slice(index + sep.length).trim();
      var left = leftText ? normalizeOne(leftText) : null;
      var right = rightText ? normalizeOne(rightText) : null;
      if ((!leftText || left) && (!rightText || right)) matches.push([left, right]);
      if (matches.length > 1) return null;
      from = index + Math.max(1, sep.length);
    }
    return matches.length === 1 ? matches[0] : null;
  }
  function splitValidatedList(source, separator) {
    var sep = String(separator);
    if (!sep) return null;
    var memo = Object.create(null);
    function solve(offset) {
      if (memo[offset]) return memo[offset];
      var results = [];
      var tailText = source.slice(offset).trim();
      var tail = tailText ? normalizeOne(tailText) : null;
      if (tail) results.push([tail]);
      var search = offset;
      while (search <= source.length) {
        var index = source.indexOf(sep, search);
        if (index < 0) break;
        var headText = source.slice(offset, index).trim();
        var head = headText ? normalizeOne(headText) : null;
        if (head) {
          var tails = solve(index + sep.length);
          for (var i = 0; i < tails.length && results.length < 2; i += 1) results.push([head].concat(tails[i]));
        }
        if (results.length > 1) break;
        search = index + Math.max(1, sep.length);
      }
      memo[offset] = results.slice(0, 2);
      return memo[offset];
    }
    var candidates = solve(0);
    return candidates.length === 1 ? candidates[0] : null;
  }
  var dateTagValues = [];
  var dateTagProjection = SelectionTags.create({
    getValues:function(){return dateTagValues;}, keyOf:function(entry){return String(entry.getTime());}, valueOf:function(entry){return String(entry.getTime());},
    labelOf:function(entry){return formatOne(entry);}
  });
  function dateTags(value) {
    if (selection !== 'multiple') return [];
    dateTagValues = Array.isArray(value) ? value : [];
    return dateTagProjection.tags();
  }

  function parseTextSelection(text) {
    var source = String(text || '').trim();
    if (!source) return { valid: true, value: emptyValue(selection) };
    if (selection === 'single') {
      var parsed = normalizeOne(source);
      return { valid: !!parsed, value: parsed };
    }
    if (selection === 'range') {
      var pair = splitValidatedPair(source, opts.rangeSeparator);
      if (!pair) return { valid: false, value: null };
      return { valid: true, value: normalizeValue(pair) };
    }
    var parsedList = splitValidatedList(source, opts.multipleSeparator);
    if (!parsedList) return { valid: false, value: null };
    var values = [];
    for (var i = 0; i < parsedList.length; i += 1) {
      var item = parsedList[i];
      if (!values.some(function (current) { return DateUnit.same(current, item, unit, opts.weekStartsOn); })) values.push(item);
    }
    return { valid: true, value: values };
  }
  function selectionAnchor(value) {
    if (selection === 'single') return value;
    if (selection === 'range') return value && (value[activeRangePart] || value[1] || value[0]);
    return value && value.length ? value[value.length - 1] : null;
  }
  function allowEmptyParts() {
    if (selection !== 'range') return [false, false];
    if (Array.isArray(opts.allowEmpty)) return [opts.allowEmpty[0] === true, opts.allowEmpty[1] === true];
    if (opts.allowEmpty === true) return [true, true];
    return [false, false];
  }
  function rangeComplete(value) { return selection !== 'range' || !!(value && value[0] && value[1]); }
  function rangeCommitReady(value) {
    if (selection !== 'range') return true;
    var allow = allowEmptyParts();
    return !!(value && (value[0] || allow[0]) && (value[1] || allow[1]));
  }
  function normalizeBound(value, label) {
    if (value === null || value === undefined || value === '') return null;
    var parsed = normalizeOne(value);
    if (!parsed) throw new TypeError('[QXFRAME9A7C2] DatePicker ' + label + ' is invalid for the current unit/format.');
    return parsed;
  }
  function minBound() { return normalizeBound(opts.minDate, 'minDate'); }
  function maxBound() { return normalizeBound(opts.maxDate, 'maxDate'); }
  function periodEnd(value, targetUnit) {
    var start = DateUnit.start(value, targetUnit, opts.weekStartsOn, false);
    if (!start) return null;
    var end = cloneDate(start);
    if (targetUnit === 'year') end = new Date(start.getFullYear() + 1, 0, 1);
    else if (targetUnit === 'quarter') end = new Date(start.getFullYear(), start.getMonth() + 3, 1);
    else if (targetUnit === 'month') end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    else if (targetUnit === 'week') { end.setDate(end.getDate() + 7); }
    else { end.setDate(end.getDate() + 1); }
    end.setMilliseconds(end.getMilliseconds() - 1);
    return end;
  }
  function outsideBounds(value, targetUnit) {
    var parsed = cloneDate(value);
    if (!parsed) return false;
    var compareUnit = targetUnit || unit;
    var start = DateUnit.start(parsed, compareUnit, opts.weekStartsOn, false);
    var end = periodEnd(parsed, compareUnit);
    var min = minBound();
    var max = maxBound();
    if (min && end && end.getTime() < DateUnit.start(min, 'date', opts.weekStartsOn, false).getTime()) return true;
    if (max && start && start.getTime() > periodEnd(max, 'date').getTime()) return true;
    return false;
  }
  function disabledSelectionDate(date, info) {
    var targetUnit = info && info.unit ? String(info.unit) : unit;
    if (outsideBounds(date, targetUnit)) return true;
    return Utils.isFunction(opts.disabledDate) && opts.disabledDate(cloneDate(date), info) === true;
  }
  function pickerPanelValue() {
    if (!own(opts, 'pickerValue')) return null;
    var source = opts.pickerValue;
    if (selection === 'range' && Array.isArray(source)) source = source[activeRangePart] || source[0] || source[1];
    return normalizeBound(source, 'pickerValue');
  }
  function clampPanelValue(value) {
    var parsed = cloneDate(value) || pickerPanelValue() || normalizeOne(opts.defaultPickerValue) || new Date();
    var min = minBound(), max = maxBound();
    if (min && DateUnit.compare(parsed, min, 'month', opts.weekStartsOn) < 0) parsed = cloneDate(min);
    if (max && DateUnit.compare(parsed, max, 'month', opts.weekStartsOn) > 0) parsed = cloneDate(max);
    return parsed;
  }
  function validatePickerOptions() {
    var panelCount = Number(opts.panelCount);
    if (!Number.isInteger(panelCount) || (panelCount !== 1 && panelCount !== 2)) throw new TypeError('[QXFRAME9A7C2] DatePicker panelCount must be 1 or 2.');
    if (panelCount === 2 && !(selection === 'range' && (unit === 'date' || unit === 'week'))) throw new TypeError('[QXFRAME9A7C2] DatePicker panelCount:2 is only supported for range date/week selection.');
    if (selection === 'range' && String(opts.rangeSeparator || '') === '') throw new TypeError('[QXFRAME9A7C2] DatePicker rangeSeparator must not be empty in range selection.');
    if (selection === 'multiple' && String(opts.multipleSeparator || '') === '') throw new TypeError('[QXFRAME9A7C2] DatePicker multipleSeparator must not be empty in multiple selection.');
    if (selection === 'range' && own(opts, 'allowEmpty')) {
      var allow = opts.allowEmpty;
      var validAllow = typeof allow === 'boolean' || (Array.isArray(allow) && allow.length === 2 && typeof allow[0] === 'boolean' && typeof allow[1] === 'boolean');
      if (!validAllow) throw new TypeError('[QXFRAME9A7C2] DatePicker range allowEmpty must be boolean or [boolean, boolean].');
    }
    var min = minBound(), max = maxBound();
    if (min && max && DateUnit.compare(min, max, unit, opts.weekStartsOn) > 0) throw new RangeError('[QXFRAME9A7C2] DatePicker minDate cannot be after maxDate.');
    if (own(opts, 'pickerValue')) pickerPanelValue();
  }
  validatePickerOptions();
  if (opts.previewValue !== false && opts.previewValue !== 'hover') throw new TypeError("[QXFRAME9A7C2] DatePicker previewValue must be false or 'hover'.");
  if (opts.panelRender !== null && opts.panelRender !== undefined && !Utils.isFunction(opts.panelRender)) throw new TypeError('[QXFRAME9A7C2] DatePicker panelRender must be a function or null.');
  function visualValue() {
    if (field && field.getState().open && selection === 'range' && opts.previewValue !== false && hoverPreviewValue !== null) return hoverPreviewValue;
    if (field && field.getState().open) return draft.draftValue;
    return draft.value;
  }
  function stateForDate(date, info) {
    if (info && info.entry && info.entry.outside === true) return { selected: false, inRange: false, rangeStart: false, rangeEnd: false };
    var value = visualValue();
    if (selection === 'single') return { selected: DateUnit.same(date, value, unit, opts.weekStartsOn) };
    if (selection === 'multiple') return { selected: (value || []).some(function (entry) { return DateUnit.same(date, entry, unit, opts.weekStartsOn); }) };
    var start = value && value[0];
    var end = value && value[1];
    var rangeStart = !!start && DateUnit.same(date, start, unit, opts.weekStartsOn);
    var rangeEnd = !!end && DateUnit.same(date, end, unit, opts.weekStartsOn);
    var low = start, high = end;
    if (start && end && DateUnit.compare(start, end, unit, opts.weekStartsOn) > 0) { low = end; high = start; }
    var inRange = !!(low && high && DateUnit.compare(date, low, unit, opts.weekStartsOn) >= 0 && DateUnit.compare(date, high, unit, opts.weekStartsOn) <= 0);
    return { selected: rangeStart || rangeEnd, inRange: inRange, rangeStart: rangeStart, rangeEnd: rangeEnd };
  }
  function currentTime() {
    if (timePanel) return timePanel.getState().value;
    var anchor = selectionAnchor(draft ? draft.draftValue : null);
    return timeFromDate(anchor, timeOptions && timeOptions.defaultValue);
  }
  function applyPanelSelection(date) {
    var selected = DateUnit.start(date, unit, opts.weekStartsOn, false);
    if (!selected) return null;
    if (withTime) selected = dateTimeFrom(selected, currentTime());
    var current = cloneValue(draft.draftValue, selection);
    if (selection === 'single') return selected;
    if (selection === 'multiple') {
      var index = current.findIndex(function (entry) { return DateUnit.same(entry, selected, unit, opts.weekStartsOn); });
      if (index >= 0) current.splice(index, 1); else current.push(selected);
      return current;
    }
    if (!current[0] || current[1]) {
      activeRangePart = 1;
      return [selected, null];
    }
    var start = current[0];
    var selectedBeforeStart = compareChronological(selected, start) < 0;
    if (opts.order === false) {
      activeRangePart = 1;
      return [start, selected];
    }
    var output = selectedBeforeStart ? [selected, start] : [start, selected];
    // Keep subsequent time edits attached to the endpoint the user just selected.
    // If chronological ordering swaps the pair, that endpoint becomes start (0);
    // otherwise it remains end (1).
    activeRangePart = selectedBeforeStart ? 0 : 1;
    return output;
  }

  if (fieldInit.formField && !own(sourceOptions, 'value') && !own(sourceOptions, 'defaultValue')) {
    var nativeInitial = parseTextSelection(fieldInit.nativeValue);
    if (nativeInitial.valid) opts.value = nativeInitial.value;
  }
  var draft = StateController.create({
    value: opts.value !== undefined ? opts.value : opts.defaultValue,
    normalizeValue: normalizeValue,
    copyValue: function (value) { return cloneValue(value, selection); },
    equals: function (left, right) { return valueEquals(left, right, selection, unit, opts.weekStartsOn, withTime); },
    onValueChange: function (value, detail) {
      syncField(false, { source: detail.source || 'value-draft', reason: detail.reason || 'value-change' });
      syncSelectionPanel(false);
      syncTimePanel();
      if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(cloneValue(value, selection), Utils.mergeOwn( detail, { value: cloneValue(value, selection), previousValue: cloneValue(detail.previousValue, selection), datePicker: api }));
      if (detail.silent !== true) { var payload = { value: cloneValue(value, selection), previousValue: cloneValue(detail.previousValue, selection), reason: detail.reason, source: detail.source || 'api', datePicker: api }; if (Utils.isFunction(opts.onChange)) opts.onChange(cloneValue(value, selection), payload); emitter.emit('change', payload); }
    },
    onDraftChange: function (value, detail) {
      if (!(detail && detail.source === 'input' && detail.reason === 'typing')) syncField(field && field.getState().open);
      if (field && field.getState().open) { syncSelectionPanel(false); syncTimePanel(); rebuildFooter(); }
      if (Utils.isFunction(opts.onDraftChange)) opts.onDraftChange(cloneValue(value, selection), Utils.mergeOwn( detail, { value: cloneValue(draft.value, selection), draftValue: cloneValue(value, selection), datePicker: api }));
    }
  });
  var pickerSession = instance.setupPickerSession({
    controller: draft,
    needConfirm: function () { return opts.needConfirm === true; },
    canCommit: function (controller) { return rangeCommitReady(controller.draftValue); },
    onOpenDraft: function () {
      hoverPreviewValue = null;
      rawInput = '';
      if (selection === 'range') activeRangePart = draft.draftValue && !draft.draftValue[0] ? 0 : (draft.draftValue && !draft.draftValue[1] ? 1 : 0);
      else activeRangePart = 0;
      syncSelectionPanel(true);
      syncTimePanel();
      syncField(true);
    },
    onCancel: function () {
      syncSelectionPanel(true);
      syncTimePanel();
      syncField(false);
    },
    onCloseDraft: function (_controller, detail) {
      hoverPreviewValue = null;
      if (!detail || detail.rolledBack !== true) syncField(false);
    }
  });

  function syncField(preferDraft, meta) {
    if (!field) return;
    var draftSession = preferDraft === true;
    var previewing = field.getState().open && opts.previewValue !== false && hoverPreviewValue !== null && selection !== 'multiple';
    var value = previewing ? hoverPreviewValue : (draftSession && draft.dirty ? draft.draftValue : draft.value);
    var committedText = formatSelection(draft.value);
    var draftText = formatSelection(draft.draftValue);
    var previewText = previewing ? formatSelection(hoverPreviewValue) : '';
    var hasDraftTarget = field.getState().hasDraftValueTarget;
    if (selection === 'multiple') {
      field.setTags(dateTags(value));
      field.setDisplayValue(hasDraftTarget ? committedText : rawInput);
      field.setPlaceholder(opts.placeholder);
    } else if (hasDraftTarget) {
      field.setDisplayValue(previewing ? previewText : committedText);
      field.setPlaceholder(opts.placeholder);
    } else if (draftSession) {
      var visibleDraft = previewing ? previewText : (draft.dirty ? draftText : '');
      rawInput = visibleDraft;
      field.setDisplayValue(visibleDraft);
      field.setPlaceholder(committedText || String(opts.placeholder || ''));
    } else {
      rawInput = committedText;
      field.setDisplayValue(committedText);
      field.setPlaceholder(opts.placeholder);
    }
    field.setDraftDisplayValue(draftSession && draft.dirty ? draftText : '');
    field.setDraftVisual(draftSession && draft.dirty && !hasDraftTarget);
    field.setClearVisible(hasValue(draft.value, selection));
    field.setCommittedValue(draft.value, meta || { silent: true, source: 'value-draft', reason: 'projection' });
  }
  function previewSelection(date) {
    if (!date) return null;
    var selected = DateUnit.start(date, unit, opts.weekStartsOn, false);
    if (!selected) return null;
    if (withTime) selected = dateTimeFrom(selected, currentTime());
    if (selection === 'single') return selected;
    if (selection === 'multiple') return null;
    var current = cloneValue(draft.draftValue, selection);
    if (!current[0] || activeRangePart === 0) current[0] = selected; else current[1] = selected;
    if (opts.order !== false && current[0] && current[1] && compareChronological(current[0], current[1]) > 0) current = [current[1], current[0]];
    return current;
  }
  function handlePanelHover(value, detail) {
    hoverPreviewValue = opts.previewValue === false ? null : previewSelection(value);
    if (field && field.getState().open) syncField(true);
    if (calendar && calendar.refreshStates) calendar.refreshStates();
    if (calendarSecondary && calendarSecondary.refreshStates) calendarSecondary.refreshStates();
    if (periodPanel && periodPanel.refreshStates) periodPanel.refreshStates();
    var payload = { value: cloneDate(value), previewValue: cloneValue(hoverPreviewValue, selection), source: detail && detail.source || 'pointer', reason: detail && detail.reason || (value ? 'hover' : 'hover-leave'), originalEvent: detail && detail.originalEvent || null, datePicker: api };
    if (Utils.isFunction(opts.onPreviewChange)) opts.onPreviewChange(cloneValue(hoverPreviewValue, selection), payload);
    emitter.emit('previewChange', payload);
  }
  function emitPanelChange(value, detail, mode) {
    var nextValue = cloneDate(value);
    var payload = {
      pickerValue: nextValue,
      mode: mode || calendarPanelMode || unit,
      source: detail && detail.source || 'api',
      reason: detail && detail.reason || 'panel-change',
      originalEvent: detail && detail.originalEvent || null,
      datePicker: api
    };
    if (Utils.isFunction(opts.onPanelChange)) opts.onPanelChange(cloneDate(nextValue), payload.mode, payload);
    emitter.emit('panelChange', payload);
  }
  function dualCalendarEnabled() { return Number(opts.panelCount) === 2; }
  function dualPrimaryView(value) {
    var primary = clampPanelValue(value);
    if (!dualCalendarEnabled()) return primary;
    var max = maxBound();
    // Panel view geometry is not a value constraint. If the selectable bounds are only
    // one month wide, allow the leading panel to sit outside the bound so two physical
    // panels never collapse onto the same month. Cells remain disabled by bounds.
    if (max && DateUnit.compare(addMonths(primary, 1), max, 'month', opts.weekStartsOn) > 0) primary = addMonths(max, -1);
    return primary;
  }
  function dualSecondaryView(primary) { return addMonths(dualPrimaryView(primary), 1); }
  function syncCalendarPair(primary, meta) {
    if (!calendarSecondary) return;
    var settings = Utils.assignOwn({ silent: true, source: 'sync', reason: 'dual-panel-sync' }, meta || {});
    calendarSecondary.setViewValue(dualSecondaryView(primary), settings);
  }
  function restoreControlledPanelValue() {
    var requested = pickerPanelValue();
    if (!requested) return;
    var controlled = dualCalendarEnabled() ? dualPrimaryView(requested) : clampPanelValue(requested);
    if (calendar) calendar.setViewValue(controlled, { silent: true, source: 'controlled', reason: 'picker-value' });
    if (calendarSecondary) syncCalendarPair(controlled, { source: 'controlled', reason: 'picker-value-secondary' });
    if (periodPanel) periodPanel.setViewValue(controlled, { silent: true, source: 'controlled', reason: 'picker-value' });
    if (yearPanel) yearPanel.setViewValue(controlled, { silent: true, source: 'controlled', reason: 'picker-value' });
    if (monthPanel) monthPanel.setViewValue(controlled, { silent: true, source: 'controlled', reason: 'picker-value' });
  }
  function handlePanelViewChange(value, detail, mode) {
    var fromSecondary = !!(calendarSecondary && detail && detail.calendar === calendarSecondary);
    var requested = fromSecondary ? addMonths(value, -1) : value;
    var bounded = dualCalendarEnabled() ? dualPrimaryView(requested) : clampPanelValue(requested);
    var comparedValue = fromSecondary ? addMonths(bounded, 1) : bounded;
    var changedByClamp = DateUnit.compare(comparedValue, value, 'month', opts.weekStartsOn) !== 0;
    if (changedByClamp) {
      if (detail && detail.calendar) detail.calendar.setViewValue(comparedValue, { silent: true, source: 'bounds', reason: 'panel-bound' });
      if (detail && detail.periodPanel) detail.periodPanel.setViewValue(bounded, { silent: true, source: 'bounds', reason: 'panel-bound' });
      if (calendar) calendar.setViewValue(bounded, { silent: true, source: 'bounds', reason: 'panel-bound-primary' });
      if (calendarSecondary) syncCalendarPair(bounded, { source: 'bounds', reason: 'panel-bound-secondary' });
      restoreControlledPanelValue();
      return false;
    }
    if (calendar) calendar.setViewValue(bounded, { silent: true, source: 'sync', reason: fromSecondary ? 'secondary-panel-anchor' : 'primary-panel-anchor' });
    if (calendarSecondary) syncCalendarPair(bounded, { source: 'sync', reason: 'dual-panel-navigation' });
    var panelDetail = Utils.mergeOwn( detail || {}, { panelIndex: fromSecondary ? 1 : 0, panelViewValue: cloneDate(value) });
    emitPanelChange(bounded, panelDetail, mode);
    restoreControlledPanelValue();
    return true;
  }
  function syncSelectionPanel(syncView) {
    var anchor = selectionAnchor(draft.draftValue) || selectionAnchor(draft.value) || normalizeOne(opts.defaultPickerValue) || new Date();
    var controlledView = pickerPanelValue();
    var rawViewAnchor = controlledView || (syncView === true ? anchor : null) || normalizeOne(opts.defaultPickerValue) || anchor;
    var viewAnchor = dualCalendarEnabled() ? dualPrimaryView(rawViewAnchor) : clampPanelValue(rawViewAnchor);
    if (calendar) {
      calendar.updateOptions({
        disabledDate: disabledSelectionDate,
        renderCell: opts.renderCell,
        getCellState: stateForDate,
        onHoverChange: handlePanelHover,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true,
        weekStartsOn: opts.weekStartsOn
      });
      if (calendarSecondary) calendarSecondary.updateOptions({
        disabledDate: disabledSelectionDate,
        renderCell: opts.renderCell,
        getCellState: stateForDate,
        onHoverChange: handlePanelHover,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true,
        weekStartsOn: opts.weekStartsOn
      });
      if (anchor) {
        calendar.setValue(anchor, { silent: true, source: 'sync', reason: 'picker-sync', syncView: controlledView ? false : syncView !== false });
        if (syncView === true || controlledView) {
          calendar.setViewValue(viewAnchor, { silent: true, source: 'sync', reason: controlledView ? 'controlled-picker-view' : 'picker-view' });
          syncCalendarPair(viewAnchor, { source: 'sync', reason: controlledView ? 'controlled-picker-view-secondary' : 'picker-view-secondary' });
        }
      } else {
        calendar.clear({ silent: true, source: 'sync', reason: 'picker-clear' });
        if (calendarSecondary) calendarSecondary.clear({ silent: true, source: 'sync', reason: 'picker-clear-secondary' });
      }
      calendar.refresh();
      if (calendarSecondary) calendarSecondary.refresh();
    }
    if (periodPanel) {
      periodPanel.updateOptions({
        disabledValue: disabledSelectionDate,
        getItemState: stateForDate,
        onHoverChange: handlePanelHover,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true
      });
      if (anchor) {
        periodPanel.setValue(anchor, { silent: true, source: 'sync', reason: 'picker-sync', syncView: controlledView ? false : syncView !== false });
        if (syncView === true || controlledView) periodPanel.setViewValue(viewAnchor, { silent: true, source: 'sync', reason: controlledView ? 'controlled-picker-view' : 'picker-view' });
      } else periodPanel.clear({ silent: true, source: 'sync', reason: 'picker-clear' });
      periodPanel.refresh();
    }
    if (yearPanel) yearPanel.updateOptions({ disabledValue: disabledSelectionDate, onHoverChange: handlePanelHover, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (monthPanel) monthPanel.updateOptions({ disabledValue: disabledSelectionDate, onHoverChange: handlePanelHover, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (controlledView) restoreControlledPanelValue();
  }
  function setCalendarPanelMode(mode, anchorValue) {
    if (!calendar) return false;
    var nextMode = mode === 'year' || mode === 'month' ? mode : 'date';
    var previousMode = calendarPanelMode;
    var rawView = cloneDate(anchorValue) || cloneDate(calendar.getState().viewValue) || new Date();
    var view = dualCalendarEnabled() ? dualPrimaryView(rawView) : clampPanelValue(rawView);
    calendarPanelMode = nextMode;
    if (calendarGroup) calendarGroup.classList.toggle('is-date-picker-active', nextMode === 'date');
    if (calendar.getRootElement()) calendar.getRootElement().classList.toggle('is-date-picker-active', nextMode === 'date');
    if (calendarSecondary && calendarSecondary.getRootElement()) calendarSecondary.getRootElement().classList.toggle('is-date-picker-active', nextMode === 'date');
    if (yearPanel && yearPanel.getRootElement()) yearPanel.getRootElement().classList.toggle('is-date-picker-active', nextMode === 'year');
    if (monthPanel && monthPanel.getRootElement()) monthPanel.getRootElement().classList.toggle('is-date-picker-active', nextMode === 'month');
    if (yearPanel) {
      yearPanel.setViewValue(view, { silent: true, source: 'date-picker', reason: 'header-year-view' });
      yearPanel.setValue(view, { silent: true, source: 'date-picker', reason: 'header-year-value', syncView: false });
    }
    if (calendarSecondary && nextMode === 'date') syncCalendarPair(view, { source: 'date-picker', reason: 'panel-mode-secondary' });
    if (monthPanel) {
      monthPanel.setViewValue(view, { silent: true, source: 'date-picker', reason: 'header-month-view' });
      monthPanel.setValue(view, { silent: true, source: 'date-picker', reason: 'header-month-value', syncView: false });
    }
    if (field && field.getState().open) activateCurrentPanelVirtualFocus('mode-change');
    if (previousMode !== nextMode) emitPanelChange(view, { source: 'panel', reason: 'mode-change' }, nextMode);
    restoreControlledPanelValue();
    return true;
  }
  function focusFieldHost() {
    if (!field) return false;
    var target = field.getInputElement ? field.getInputElement() : null;
    if (!target && field.getControl) {
      var control = field.getControl();
      target = control && control.getFocusElement ? control.getFocusElement() : null;
    }
    if (!target && field.getRootElement) target = field.getRootElement();
    return DOM.focusElement(target, { preventScroll: true });
  }
  function requestCalendarYear(viewValue, detail) {
    var changed = setCalendarPanelMode('year', viewValue);
    if (changed && detail && detail.source === 'keyboard') focusFieldHost();
    return changed;
  }
  function requestCalendarMonth(viewValue, detail) {
    var changed = setCalendarPanelMode('month', viewValue);
    if (changed && detail && detail.source === 'keyboard') focusFieldHost();
    return changed;
  }
  function handleYearDrillSelect(selected, detail) {
    if (!calendar || !selected) return;
    var current = cloneDate(calendar.getState().viewValue) || new Date();
    current.setFullYear(selected.getFullYear());
    current.setDate(1);
    setCalendarPanelMode('month', current);
    if (detail && detail.source === 'keyboard') { focusFieldHost(); activateCurrentPanelVirtualFocus('year-drill-select'); }
  }
  function handleMonthDrillSelect(selected, detail) {
    if (!calendar || !selected) return;
    var source = detail && detail.source || 'api';
    calendar.setViewValue(dualCalendarEnabled() ? dualPrimaryView(selected) : selected, {
      silent: false,
      source: source,
      reason: 'header-month-select',
      originalEvent: detail && detail.originalEvent || null
    });
    if (calendarSecondary) syncCalendarPair(selected, { source: source, reason: 'header-month-secondary' });
    setCalendarPanelMode('date', selected);
    activeCalendarPanel = 'primary';
    // Returning from the year/month drill must also move the active date. Otherwise
    // Calendar.handleKeydown starts from the stale pre-drill activeKey and the first
    // arrow key jumps the view back to the previous year/month.
    calendar.setActiveDate(selected, { silent: true, source: source, reason: 'month-drill-active' });
    if (source === 'keyboard') focusFieldHost();
    activateCurrentPanelVirtualFocus('month-drill-select');
  }
  function resolvedTimeOptions(anchor) {
    var resolved = Utils.mergeOwn( timeOptions || {});
    resolved.size = opts.size;
    if (Utils.isFunction(opts.disabledTime)) {
      var extra = opts.disabledTime(cloneDate(anchor), Object.freeze({ selection: selection, activeRangePart: selection === 'range' ? activeRangePart : null, unit: unit, datePicker: api })) || {};
      if (extra && typeof extra === 'object' && !Array.isArray(extra)) {
        ['disabledHours','disabledMinutes','disabledSeconds','hideDisabledOptions'].forEach(function (key) {
          if (own(extra, key)) resolved[key] = extra[key];
        });
      }
    }
    return resolved;
  }
  function syncTimePanel() {
    if (!timePanel) return;
    var anchor = selectionAnchor(draft.draftValue) || selectionAnchor(draft.value);
    timePanel.updateOptions(Utils.mergeOwn( resolvedTimeOptions(anchor), { disabled: opts.disabled === true, readOnly: opts.readOnly === true }));
    timePanel.setValue(timeFromDate(anchor, timeOptions && timeOptions.defaultValue), { silent: true, source: 'sync', reason: 'date-time-sync' });
    if (timePanel && timePanel.refresh) timePanel.refresh('date-time-sync');
  }
  function emitOpen(opened, detail) {
    if (!opened) syncField(false);
    return OpenStateBridge.dispatch(opened, detail, {
      emitter: emitter,
      eventName: 'openChange',
      decorate: function () { return { datePicker: api }; },
      onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); }
    });
  }
  function commit(meta) {
    if (destroyed) return false;
    return pickerSession.commit(meta);
  }
  function cancel(meta) {
    if (destroyed) return false;
    return pickerSession.cancel(meta);
  }
  function clear(meta) {
    if (destroyed || InteractionPolicy.mutationLocked(opts)) return false;
    var changed = hasValue(draft.value, selection);
    draft.setValue(emptyValue(selection), Utils.assignOwn({ source: 'api', reason: 'clear' }, meta || {}));
    activeRangePart = 0;
    syncSelectionPanel(false);
    syncTimePanel();
    syncField(false);
    var payload = { value: cloneValue(draft.value, selection), reason: meta && meta.reason || 'clear', datePicker: api };
    if (Utils.isFunction(opts.onClear)) opts.onClear(payload);
    emitter.emit('clear', payload);
    return changed;
  }
  function handlePanelSelect(value, detail) {
    hoverPreviewValue = null;
    var next = applyPanelSelection(value);
    if (next === null) return;
    draft.setDraft(next, { source: detail.source, reason: unit + '-select' });
    var payload = { selectedValue: cloneDate(value), value: cloneValue(draft.draftValue, selection), source: detail.source, reason: detail.reason, originalEvent: detail.originalEvent || null, datePicker: api };
    if (Utils.isFunction(opts.onSelect)) opts.onSelect(cloneDate(value), payload);
    emitter.emit('select', payload);

    var complete = rangeCommitReady(draft.draftValue);
    if (opts.needConfirm !== true && complete) {
      draft.commit({ source: detail.source, reason: 'select-commit' });
      if (selection === 'single' && opts.closeOnSelect !== false) field.close('select', detail.originalEvent || null);
      else if (selection === 'range' && opts.closeOnSelect === true) field.close('select', detail.originalEvent || null);
    }
  }
  function handleTimeChange(value, detail) {
    if (!withTime || destroyed) return;
    var current = cloneValue(draft.draftValue, selection);
    if (selection === 'single') {
      if (!current) return;
      current = dateTimeFrom(current, value);
    } else {
      var part = current[activeRangePart] ? activeRangePart : (current[0] ? 0 : (current[1] ? 1 : -1));
      if (part < 0) return;
      current[part] = dateTimeFrom(current[part], value);
      var selectedPart = part;
      if (opts.order !== false && current[0] && current[1] && compareChronological(current[0], current[1]) > 0) {
        current = [current[1], current[0]];
        selectedPart = part === 0 ? 1 : 0;
      }
      // onDraftChange synchronizes the TimePanel immediately, so move endpoint
      // ownership before publishing the reordered draft. Otherwise the wheel jumps
      // to the other endpoint after a same-day time edit crosses the range boundary.
      activeRangePart = selectedPart;
    }
    draft.setDraft(current, { source: detail.source || 'time', reason: 'time-select' });
    if (opts.needConfirm !== true) draft.commit({ source: detail.source || 'time', reason: 'time-commit' });
  }
  function addMultipleInput(text, meta) {
    if (selection !== 'multiple') return false;
    var source = String(text || '').trim();
    if (!source) return true;
    var parsed = parseTextSelection(source);
    if (!parsed.valid) return false;
    var base = cloneValue(field && field.getState().open ? draft.draftValue : draft.value, selection);
    parsed.value.forEach(function (entry) {
      if (!base.some(function (current) { return DateUnit.same(current, entry, unit, opts.weekStartsOn); })) base.push(entry);
    });
    draft.setValue(base, Utils.assignOwn({ source: 'input', reason: 'multiple-input' }, meta || {}));
    rawInput = '';
    if (field) field.setDisplayValue('');
    syncSelectionPanel(true);
    return true;
  }

  function removeMultipleTag(tag, detail) {
    if (selection !== 'multiple' || InteractionPolicy.mutationLocked(opts)) return false;
    var target = tag && tag.key !== undefined ? String(tag.key) : '';
    var source = cloneValue(field && field.getState().open ? draft.draftValue : draft.value, selection);
    var next = source.filter(function (entry) { return String(entry.getTime()) !== target; });
    if (next.length === source.length) return false;
    draft.setValue(next, { source: detail && detail.source || 'control', reason: detail && detail.reason || 'tag-remove', originalEvent: detail && detail.originalEvent || null });
    rawInput = '';
    syncField(false);
    syncSelectionPanel(true);
    return true;
  }

  function currentSelectionKeyboardPanel() {
    if (calendar) {
      if (calendarPanelMode === 'year' && yearPanel) return yearPanel;
      if (calendarPanelMode === 'month' && monthPanel) return monthPanel;
      if (calendarSecondary && activeCalendarPanel === 'secondary') return calendarSecondary;
      return calendar;
    }
    return periodPanel;
  }
  function sameCalendarMonth(left, right) {
    return !!left && !!right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth();
  }
  function addCalendarDays(value, amount) {
    var next = cloneDate(value);
    if (!next) return null;
    next.setDate(next.getDate() + Number(amount || 0));
    return next;
  }
  function dualCalendarArrowTarget(event) {
    if (!calendarSecondary || calendarPanelMode !== 'date' || !event) return null;
    var delta = event.key === 'ArrowLeft' ? -1 : event.key === 'ArrowRight' ? 1 : event.key === 'ArrowUp' ? -7 : event.key === 'ArrowDown' ? 7 : 0;
    if (!delta) return null;
    var panel = activeCalendarPanel === 'secondary' ? calendarSecondary : calendar;
    var state = panel && panel.getState ? panel.getState() : null;
    var current = state && state.activeKey ? Calendar.parseDate(state.activeKey) : null;
    if (!current) current = state && (state.value || state.viewValue) ? cloneDate(state.value || state.viewValue) : null;
    if (!current) return null;
    var target = addCalendarDays(current, delta);
    var direction = delta < 0 ? -1 : 1;
    var guard = 0;
    while (target && disabledSelectionDate(target) && guard < 370) { target = addCalendarDays(target, direction); guard += 1; }
    if (!target || guard >= 370) return null;
    var primaryView = calendar.getState().viewValue;
    var secondaryView = calendarSecondary.getState().viewValue;
    if (activeCalendarPanel === 'primary' && sameCalendarMonth(target, secondaryView)) return { panel: calendarSecondary, name: 'secondary', date: target };
    if (activeCalendarPanel === 'secondary' && sameCalendarMonth(target, primaryView)) return { panel: calendar, name: 'primary', date: target };
    return null;
  }
  function activatePanelDomain(panel, reason) {
    if (!panel) return false;
    var domain = panel.getVirtualFocusDomain && panel.getVirtualFocusDomain();
    if (!domain) return false;
    var state = panel.getState ? panel.getState() : null;
    var key = state && state.activeKey;
    if (!key && state && state.activeValue) key = DateUnit.key(state.activeValue, state.unit || unit, 0);
    if (!key) return false;
    return domain.activate(String(key), { source:'keyboard', reason:reason || 'date-picker-panel', ensureVisible:true });
  }
  function activateCurrentPanelVirtualFocus(reason) {
    if (!field || !field.getKeyboardNavigation) return false;
    if (keyboardRegion === 'time' && timePanel) {
      var wheel = timePanel.getWheelPanel && timePanel.getWheelPanel();
      var wheelState = wheel && wheel.getState ? wheel.getState() : null;
      timePanel.setActiveColumn(wheelState ? wheelState.activeColumnIndex : 0, { source:'keyboard', reason:reason || 'date-picker-time' });
      return timePanel.focus ? timePanel.focus() : true;
    }
    return activatePanelDomain(currentSelectionKeyboardPanel(), reason || 'date-picker-selection');
  }
  function bindPickerVirtualFocus() {
    if (!field || !field.getKeyboardNavigation) return false;
    var keyboard = field.getKeyboardNavigation();
    var controller = keyboard && keyboard.virtualFocus;
    if (!controller) return false;
    [calendar, calendarSecondary, yearPanel, monthPanel, periodPanel].forEach(function (panel) {
      if (panel && panel.bindVirtualFocus) panel.bindVirtualFocus(controller, true);
    });
    if (tagNavigation) { tagNavigation.destroy(); tagNavigation = null; }
    if (selection === 'multiple') {
      tagNavigation = TagNavigation.create({
        keyboard:keyboard,
        domainName:'date-picker-tags',
        owner:function(){ var control=field&&field.getControl?field.getControl():null; return control&&control.getTags?control.getTags():null; },
        getInputElement:function(){ return field&&field.getInputElement?field.getInputElement():null; },
        isLocked:function(){ return destroyed || InteractionPolicy.mutationLocked(opts); },
        canEnter:function(){ return !field || !field.getState().open; }
      });
    }
    // TimePanel is a composite focus region of its own. Its columns/items are virtual;
    // only the WheelPanel root participates in Tab order, so do not host it on the field.
    return true;
  }
  function setKeyboardRegion(next, reason) {
    var region = next === 'time' && timePanel ? 'time' : 'selection';
    keyboardRegion = region;
    return activateCurrentPanelVirtualFocus(reason || 'region-change');
  }
  function handleFieldKeydown(event) {
    if (!event || InteractionPolicy.mutationLocked(opts)) return false;
    if (selection === 'multiple' && tagNavigation && tagNavigation.handleKeydown(event)) return true;
    if (event.key === 'F6' && withTime && timePanel && field && field.getState().open) {
      return setKeyboardRegion(keyboardRegion === 'selection' ? 'time' : 'selection', event.shiftKey ? 'Shift+F6' : 'F6');
    }
    if (selection === 'multiple' && event.key === 'Enter') {
      var input = field && field.getInputElement ? field.getInputElement() : null;
      var text = input && input.value !== undefined ? String(input.value || '') : rawInput;
      if (text.trim()) {
        var valid = addMultipleInput(text, { source: 'keyboard', reason: 'multiple-enter', originalEvent: event });
        if (!valid && opts.preserveInvalidOnBlur !== true) { rawInput = ''; if (field) field.setDisplayValue(''); }
        return true;
      }
    }
    if (!field || !field.getState().open) return false;
    if (keyboardRegion === 'selection') {
      var seam = dualCalendarArrowTarget(event);
      if (seam && seam.panel.setActiveDate(seam.date, { silent:true, source:'keyboard', reason:'dual-panel-' + event.key })) {
        activeCalendarPanel = seam.name;
        activatePanelDomain(seam.panel, 'dual-panel-' + event.key);
        return true;
      }
    }
    var panel = keyboardRegion === 'time' && timePanel ? timePanel : currentSelectionKeyboardPanel();
    if (!panel || !panel.handleKeydown) return false;
    var handled = panel.handleKeydown(event) === true;
    if (handled) activateCurrentPanelVirtualFocus(event.key || 'keyboard');
    return handled;
  }

  function handleInput(text, event) {
    hoverPreviewValue = null;
    rawInput = String(text || '');
    if (selection === 'multiple') {
      var additive = rawInput.trim() ? parseTextSelection(rawInput) : { valid: true, value: [] };
      var payloadMultiple = { text: rawInput, value: additive.valid ? cloneValue(additive.value, selection) : null, valid: additive.valid, additive: true, originalEvent: event, datePicker: api };
      if (Utils.isFunction(opts.onInput)) opts.onInput(rawInput, payloadMultiple);
      emitter.emit('input', payloadMultiple);
      return;
    }
    var parsed = parseTextSelection(rawInput);
    if (parsed.valid) {
      draft.setDraft(parsed.value, { silent: true, source: 'input', reason: 'typing' });
      syncSelectionPanel(true);
      syncTimePanel();
      // Panel synchronization must not replace the user's in-progress editor text.
      if (field) field.setDisplayValue(rawInput);
    }
    var payload = { text: rawInput, value: parsed.valid ? cloneValue(parsed.value, selection) : null, valid: parsed.valid, originalEvent: event, datePicker: api };
    if (Utils.isFunction(opts.onInput)) opts.onInput(rawInput, payload);
    emitter.emit('input', payload);
  }
  function handleBlur(event) {
    if (opts.readOnly === true || opts.disabled === true) return;
    // Tab from the field into Calendar/Period/Time controls is an internal picker
    // focus transition, not an editor commit. Re-parsing here used the completed
    // range's active end as selectionAnchor and shifted a dual Sep/Oct view to
    // Oct/Nov only for keyboard users. Pointer navigation never blurred the field,
    // which is why the bug was keyboard-only.
    var related = event && event.relatedTarget;
    var popup = field && field.getPanelElement ? field.getPanelElement() : null;
    if (related && popup && (related === popup || (popup.contains && popup.contains(related)))) return;
    var currentInput = field && field.getInputElement ? field.getInputElement() : null;
    if (currentInput && currentInput.value !== undefined) rawInput = String(currentInput.value || '');
    if (selection === 'multiple') {
      if (!rawInput.trim()) { syncField(field.getState().open); return; }
      var validMultiple = opts.commitInputOnBlur === false ? true : addMultipleInput(rawInput, { source: 'input', reason: 'multiple-blur', originalEvent: event });
      if (!validMultiple && opts.preserveInvalidOnBlur !== true) { rawInput = ''; field.setDisplayValue(''); }
      syncField(field.getState().open);
      return;
    }
    if (!rawInput.trim() && field.getState().open) { syncField(true); return; }
    var parsed = parseTextSelection(rawInput);
    if (!parsed.valid) {
      if (opts.preserveInvalidOnBlur !== true) syncField(field.getState().open);
      return;
    }
    draft.setDraft(parsed.value, { silent: true, source: 'input', reason: 'blur-parse' });
    if (opts.commitInputOnBlur !== false && opts.needConfirm !== true && rangeCommitReady(parsed.value)) draft.commit({ source: 'input', reason: 'blur-commit' });
    syncSelectionPanel(true);
    syncTimePanel();
    syncField(opts.needConfirm === true && field.getState().open);
  }

  field = PickerField.create({
    container: opts.container,
    headless: opts.headless === true, renderControl: opts.renderControl !== false, reference: opts.reference, triggerTarget: opts.triggerTarget, valueTarget: opts.valueTarget, draftValueTarget: opts.draftValueTarget, inputTarget: opts.inputTarget, formTarget: opts.formTarget,
    formField: opts.formField,
    committedValue: draft.value,
    serializeValue: function (value) { if (selection === 'single') return formatOne(value); return (value || []).map(formatOne); },
    elements: opts.elements,
    createDOM: opts.createDOM,
    document: opts.document,
    portalContainer: opts.portalContainer,
    className: 'qxframe9a7c2-date-picker',
    panelClass: 'qxframe9a7c2-date-picker-panel',
    size: opts.size,
    variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles,
    status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true,
    disabled: opts.disabled,
    readOnly: opts.readOnly,
    controlMode: selection === 'multiple' ? 'tags' : 'input',
    tags: selection === 'multiple' ? dateTags(draft.value) : [],
    creatableTags:false,tagsControlled:true,
    tagClassName: 'qxframe9a7c2-date-picker-tag',
    tagTextClassName: 'qxframe9a7c2-date-picker-tag-text',
    tagRemoveClassName: 'qxframe9a7c2-date-picker-tag-remove',
    editable: true,
    clearable: opts.clearable,
    placeholder: opts.placeholder,
    placement: opts.placement,
    trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay,
    closeOnOutsidePress: opts.closeOnOutsidePress !== false,
    closeOnEscape: opts.closeOnEscape !== false,
    focusScope: opts.needConfirm === true ? 'contain' : 'exit',
    destroyOnClose: opts.destroyOnClose !== false,
    matchReferenceWidth: false,
    beforeOpen: function (detail) { if (Utils.isFunction(opts.beforeOpen) && opts.beforeOpen(detail) === false) return false; return !destroyed && opts.disabled !== true; },
    beforeClose: function (detail) { var forcedDisabled = !!(detail && detail.forceClose === 'disabled'); var vetoed = Utils.isFunction(opts.beforeClose) && opts.beforeClose(detail) === false; if (destroyed) return false; if (vetoed && !forcedDisabled) return false; },
    onOpen: function (detail) { pickerSession.open(detail); keyboardRegion = 'selection'; activeCalendarPanel = 'primary'; if (calendar) setCalendarPanelMode('date', calendar.getState().viewValue); bindPickerVirtualFocus(); if (detail && (detail.source === 'keyboard' || /keyboard/i.test(String(detail.reason || '')))) activateCurrentPanelVirtualFocus('date-picker-open'); },
    onClose: function (detail) { pickerSession.close(detail); keyboardRegion = 'selection'; },
    afterOpen: function () { if (timePanel && timePanel.refresh) timePanel.refresh('date-picker-open'); var nav=field&&field.getKeyboardNavigation?field.getKeyboardNavigation():null; if(nav&&nav.virtualFocus&&nav.virtualFocus.getState().modality==='keyboard') activateCurrentPanelVirtualFocus('date-picker-after-open-refresh'); },
    onOpenChange: emitOpen,
    onInput: handleInput,
    onBlur: handleBlur,
    onKeydown: handleFieldKeydown,
    onTagRemove: removeMultipleTag,
    onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
  });
  instance.adoptPickerField(field);

  var doc = opts.document || globalThis.document;
  panelShell = doc.createElement('div');
  panelShell.className = 'qxframe9a7c2-date-picker-composite' + (withTime ? ' has-time' : '') + (Number(opts.panelCount) === 2 ? ' has-dual-calendar' : '');
  presetsHost = doc.createElement('div');
  presetsHost.className = 'qxframe9a7c2-date-picker-presets';
  selectionHost = doc.createElement('div');
  selectionHost.className = 'qxframe9a7c2-date-picker-selection-panel';
  panelShell.appendChild(selectionHost);
  if (withTime) {
    timeHost = doc.createElement('div');
    timeHost.className = 'qxframe9a7c2-date-picker-time-panel';
    panelShell.appendChild(timeHost);
  }
  field.getPanelHost().appendChild(panelShell);

  if (unit === 'date' || unit === 'week') {
    calendarGroup = doc.createElement('div');
    calendarGroup.className = 'qxframe9a7c2-date-picker-calendar-group' + (Number(opts.panelCount) === 2 ? ' is-dual' : '');
    calendarPrimaryHost = doc.createElement('div');
    calendarPrimaryHost.className = 'qxframe9a7c2-date-picker-calendar-host is-primary';
    calendarGroup.appendChild(calendarPrimaryHost);
    if (Number(opts.panelCount) === 2) {
      calendarSecondaryHost = doc.createElement('div');
      calendarSecondaryHost.className = 'qxframe9a7c2-date-picker-calendar-host is-secondary';
      calendarGroup.appendChild(calendarSecondaryHost);
    }
    selectionHost.appendChild(calendarGroup);
    var initialPrimaryView = Number(opts.panelCount) === 2
      ? dualPrimaryView(pickerPanelValue() || selectionAnchor(draft.draftValue) || opts.defaultPickerValue || new Date())
      : clampPanelValue(pickerPanelValue() || selectionAnchor(draft.draftValue) || opts.defaultPickerValue);
    calendar = Calendar.create({
      container: calendarPrimaryHost,
      value: selectionAnchor(draft.draftValue),
      viewValue: initialPrimaryView,
      weekStartsOn: opts.weekStartsOn,
      disabledDate: disabledSelectionDate,
      renderCell: opts.renderCell,
      getCellState: stateForDate,
      onHoverChange: handlePanelHover,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      onYearRequest: requestCalendarYear,
      onMonthRequest: requestCalendarMonth,
      onViewChange: function (value, detail) { handlePanelViewChange(value, detail, 'date'); },
      onSelect: handlePanelSelect
    });
    calendar.getRootElement().classList.add('qxframe9a7c2-date-picker-calendar-panel', 'is-primary-panel');
    if (calendarSecondaryHost) {
      calendarSecondary = Calendar.create({
        container: calendarSecondaryHost,
        value: null,
        viewValue: dualSecondaryView(initialPrimaryView),
        weekStartsOn: opts.weekStartsOn,
        disabledDate: disabledSelectionDate,
        renderCell: opts.renderCell,
        getCellState: stateForDate,
        onHoverChange: handlePanelHover,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true,
        onYearRequest: requestCalendarYear,
        onMonthRequest: requestCalendarMonth,
        onViewChange: function (value, detail) { handlePanelViewChange(value, detail, 'date'); },
        onSelect: handlePanelSelect
      });
      calendarSecondary.getRootElement().classList.add('qxframe9a7c2-date-picker-calendar-panel', 'is-secondary-panel');
      var primaryRefs = calendar.getRefs ? calendar.getRefs() : null;
      var secondaryRefs = calendarSecondary.getRefs ? calendarSecondary.getRefs() : null;
      if (primaryRefs && primaryRefs.next) primaryRefs.next.classList.add('qxframe9a7c2-date-picker-dual-inner-nav');
      if (secondaryRefs && secondaryRefs.prev) secondaryRefs.prev.classList.add('qxframe9a7c2-date-picker-dual-inner-nav');
    }
    yearPanel = PeriodPanel.create({
      container: selectionHost,
      unit: 'year',
      value: selectionAnchor(draft.draftValue),
      viewValue: clampPanelValue(pickerPanelValue() || selectionAnchor(draft.draftValue) || opts.defaultPickerValue),
      disabledValue: disabledSelectionDate,
      onHoverChange: handlePanelHover,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      onViewChange: function (value, detail) { handlePanelViewChange(value, detail, 'year'); },
      onSelect: handleYearDrillSelect
    });
    yearPanel.getRootElement().classList.add('qxframe9a7c2-date-picker-drill-panel');
    monthPanel = PeriodPanel.create({
      container: selectionHost,
      unit: 'month',
      value: selectionAnchor(draft.draftValue),
      viewValue: clampPanelValue(pickerPanelValue() || selectionAnchor(draft.draftValue) || opts.defaultPickerValue),
      disabledValue: disabledSelectionDate,
      onHoverChange: handlePanelHover,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      onViewChange: function (value, detail) { handlePanelViewChange(value, detail, 'month'); },
      onTitleRequest: function (viewValue, detail) { var changed = setCalendarPanelMode('year', viewValue); if (changed && detail && detail.source === 'keyboard') focusFieldHost(); },
      onSelect: handleMonthDrillSelect
    });
    monthPanel.getRootElement().classList.add('qxframe9a7c2-date-picker-drill-panel');
    setCalendarPanelMode('date', selectionAnchor(draft.draftValue) || opts.defaultPickerValue || new Date());
  } else {
    periodPanel = PeriodPanel.create({
      container: selectionHost,
      unit: unit,
      value: selectionAnchor(draft.draftValue),
      viewValue: clampPanelValue(pickerPanelValue() || selectionAnchor(draft.draftValue) || opts.defaultPickerValue),
      disabledValue: disabledSelectionDate,
      getItemState: stateForDate,
      onHoverChange: handlePanelHover,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      onViewChange: function (value, detail) { handlePanelViewChange(value, detail, unit); },
      onSelect: handlePanelSelect
    });
  }
  if (withTime) {
    timePanel = TimePanel.create(Utils.mergeOwn( resolvedTimeOptions(selectionAnchor(draft.draftValue)), {
      container: timeHost,
      value: timeFromDate(selectionAnchor(draft.draftValue), timeOptions.defaultValue),
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      onChange: handleTimeChange
    }));
  }

  bindPickerVirtualFocus();
  if (selectionHost) {
    panelCleanups.push(DOM.listen(selectionHost, 'pointerdown', function (event) {
      keyboardRegion = 'selection';
      if (calendarSecondary && calendarSecondary.getRootElement().contains(event.target)) activeCalendarPanel = 'secondary';
      else if (calendar && calendar.getRootElement().contains(event.target)) activeCalendarPanel = 'primary';
    }, true));
    panelCleanups.push(DOM.listen(selectionHost, 'focusin', function (event) {
      keyboardRegion = 'selection';
      if (calendarSecondary && calendarSecondary.getRootElement().contains(event.target)) activeCalendarPanel = 'secondary';
      else if (calendar && calendar.getRootElement().contains(event.target)) activeCalendarPanel = 'primary';
    }, true));
  }
  if (timeHost) {
    panelCleanups.push(DOM.listen(timeHost, 'pointerdown', function () { keyboardRegion = 'time'; }, true));
    panelCleanups.push(DOM.listen(timeHost, 'focusin', function () { keyboardRegion = 'time'; }, true));
  }

  function syncPanelProjection() {
    if (!field || !panelShell) return false;
    var host = field.getPanelHost();
    var output = panelShell;
    if (Utils.isFunction(opts.panelRender)) {
      var rendered = opts.panelRender(panelShell, Object.freeze({ datePicker: api, originNode: panelShell, selection: selection, unit: unit, time: withTime }));
      if (rendered !== undefined) output = rendered;
    }
    if (!output || !output.nodeType || (output !== panelShell && !(output.contains && output.contains(panelShell)))) throw new TypeError('[QXFRAME9A7C2] DatePicker panelRender must return the canonical origin node or a DOM wrapper containing it.');
    while (host.firstChild) host.removeChild(host.firstChild);
    host.appendChild(output);
    panelProjection = output;
    return true;
  }

  function rebuildPresets() {
    presetCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
    if (!presetsHost) return;
    presetsHost.textContent = '';
    var presets = Array.isArray(opts.presets) ? opts.presets : [];
    presets.forEach(function (preset, index) {
      if (!preset || typeof preset !== 'object' || !own(preset, 'value')) throw new TypeError('[QXFRAME9A7C2] DatePicker presets require objects with label and value.');
      var button = doc.createElement('button');
      button.type = 'button';
      button.tabIndex = 0;
      button.className = 'qxframe9a7c2-date-picker-preset';
      button.textContent = preset.label === undefined || preset.label === null ? ('预设 ' + String(index + 1)) : String(preset.label);
      button.disabled = InteractionPolicy.mutationLocked(opts) || preset.disabled === true;
      var handler = function (event) {
        if (button.disabled) return;
        var source = DOM.activationSource(event);
        var raw = Utils.isFunction(preset.value) ? preset.value(Object.freeze({ datePicker: api, selection: selection, unit: unit })) : preset.value;
        var normalized;
        try { normalized = normalizeValue(raw); } catch (_) { return; }
        draft.setDraft(normalized, { source: source, reason: 'preset-select', originalEvent: event });
        activeRangePart = selection === 'range' && normalized[1] ? 1 : 0;
        syncSelectionPanel(true); syncTimePanel(); syncField(true);
        if (opts.needConfirm !== true && rangeCommitReady(normalized)) {
          draft.commit({ source: source, reason: 'preset-commit', originalEvent: event });
          // A complete preset is an atomic immediate selection. Range calendar clicks keep
          // their historical non-closing default, but presets close unless the caller
          // explicitly opted out with closeOnSelect:false.
          if (!closeOnSelectExplicit || opts.closeOnSelect !== false) field.close('preset', event);
        }
        var payload = { value: cloneValue(normalized, selection), preset: preset, index: index, source: source, reason: 'preset-select', originalEvent: event, datePicker: api };
        if (Utils.isFunction(opts.onPreset)) opts.onPreset(cloneValue(normalized, selection), payload);
        emitter.emit('preset', payload);
      };
      presetCleanups.push(DOM.listen(button, 'click', handler));
      presetsHost.appendChild(button);
    });
    if (presets.length) { if (presetsHost.parentNode !== panelShell || presetsHost.nextSibling !== selectionHost) panelShell.insertBefore(presetsHost, selectionHost); }
    else if (presetsHost.parentNode) presetsHost.parentNode.removeChild(presetsHost);
  }

  function rebuildFooter() {
    instance.createConfirmFooter({
      footer: opts.footer, needConfirm: opts.needConfirm, showCancel: opts.showCancel,
      startContent: opts.footerStart, endContent: opts.footerEnd,
      cancelLabel: opts.cancelText, confirmLabel: opts.confirmText,
      confirmDisabled: !rangeCommitReady(draft.draftValue) || opts.confirmDisabled === true
    });
  }
  syncPanelProjection();
  rebuildPresets();
  rebuildFooter();
  syncSelectionPanel(false);
  syncTimePanel();
  syncField(false);

  function setValue(value, meta) {
    if (destroyed) return false;
    var normalized;
    try { normalized = normalizeValue(value); } catch (_) { return false; }
    var result = draft.setValue(normalized, Utils.assignOwn({ source: 'api', reason: 'set-value' }, meta || {}));
    activeRangePart = selection === 'range' && normalized[1] ? 1 : 0;
    syncSelectionPanel(true);
    syncTimePanel();
    syncField(false);
    return result;
  }
  function setPickerValue(value, meta) {
    if (destroyed) return false;
    var normalized;
    try { normalized = normalizeValue(value); } catch (_) { return false; }
    var result = draft.setDraft(normalized, Utils.assignOwn({ source: 'api', reason: 'set-picker-value' }, meta || {}));
    activeRangePart = selection === 'range' && normalized[1] ? 1 : 0;
    syncSelectionPanel(true);
    syncTimePanel();
    syncField(true);
    return result;
  }
  function setPanelValue(value, meta) {
    if (destroyed) return false;
    var normalized;
    try { normalized = clampPanelValue(normalizeBound(value, 'panel value')); } catch (_) { return false; }
    var settings = Utils.assignOwn({ source: 'api', reason: 'date-picker-panel-view' }, meta || {});
    if (calendar) return calendar.setViewValue(normalized, settings);
    if (periodPanel) return periodPanel.setViewValue(normalized, settings);
    return false;
  }
  function currentPanelValue() {
    if (calendar) return cloneDate(calendar.getState().viewValue);
    if (periodPanel) return cloneDate(periodPanel.getState().viewValue);
    return null;
  }
  function applyOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
      OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','draftValueTarget','inputTarget','formTarget','renderControl','headless'], 'DatePicker field binding');
    if (own(next, 'panelCount') && Number(next.panelCount) !== Number(opts.panelCount)) throw new Error('[QXFRAME9A7C2] DatePicker panelCount is immutable; destroy and recreate to change panel structure.');
    if (own(next, 'selection') && normalizeSelectionName(next.selection) !== selection) throw new Error('[QXFRAME9A7C2] DatePicker selection is immutable.');
    if (own(next, 'unit') && String(next.unit).toLowerCase() !== unit) throw new Error('[QXFRAME9A7C2] DatePicker unit is immutable.');
    var pendingTimeOptions = null;
    if (own(next, 'time')) {
      var nextTime = timeConfig(next.time);
      if (!!nextTime !== withTime) throw new Error('[QXFRAME9A7C2] DatePicker time composition is immutable.');
      if (withTime) pendingTimeOptions = nextTime;
    }
    var previousOptionValues = {};
    Object.keys(next).forEach(function (key) {
      previousOptionValues[key] = { present: own(opts, key), value: opts[key] };
      opts[key] = next[key];
    });
    try {
      validatePickerOptions();
      if (opts.previewValue !== false && opts.previewValue !== 'hover') throw new TypeError("[QXFRAME9A7C2] DatePicker previewValue must be false or 'hover'.");
      if (opts.panelRender !== null && opts.panelRender !== undefined && !Utils.isFunction(opts.panelRender)) throw new TypeError('[QXFRAME9A7C2] DatePicker panelRender must be a function or null.');
    } catch (error) {
      Object.keys(next).forEach(function (key) {
        if (previousOptionValues[key].present) opts[key] = previousOptionValues[key].value;
        else delete opts[key];
      });
      throw error;
    }
    if (pendingTimeOptions !== null) timeOptions = pendingTimeOptions;
    if (own(next, 'closeOnSelect')) closeOnSelectExplicit = true;
    field.updateOptions({ size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true, disabled: opts.disabled, readOnly: opts.readOnly, clearable: opts.clearable, placeholder: opts.placeholder, placement: opts.placement, trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay, focusScope: opts.needConfirm === true ? 'contain' : 'exit', destroyOnClose: opts.destroyOnClose !== false });
    if (calendar) calendar.updateOptions({ weekStartsOn: opts.weekStartsOn, disabledDate: disabledSelectionDate, renderCell: opts.renderCell, getCellState: stateForDate, onHoverChange: handlePanelHover, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (calendarSecondary) calendarSecondary.updateOptions({ weekStartsOn: opts.weekStartsOn, disabledDate: disabledSelectionDate, renderCell: opts.renderCell, getCellState: stateForDate, onHoverChange: handlePanelHover, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (periodPanel) periodPanel.updateOptions({ disabledValue: disabledSelectionDate, getItemState: stateForDate, onHoverChange: handlePanelHover, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (yearPanel) yearPanel.updateOptions({ disabledValue: disabledSelectionDate, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (monthPanel) monthPanel.updateOptions({ disabledValue: disabledSelectionDate, disabled: opts.disabled === true, readOnly: opts.readOnly === true });
    if (timePanel) { var timeAnchor = selectionAnchor(draft.draftValue) || selectionAnchor(draft.value); timePanel.updateOptions(Utils.mergeOwn( resolvedTimeOptions(timeAnchor), { disabled: opts.disabled === true, readOnly: opts.readOnly === true })); if (timePanel.refresh) timePanel.refresh('date-picker-options'); }
    if (own(next, 'value')) setValue(next.value, { silent: true, source: 'options', reason: 'controlled' });
    if (opts.previewValue === false) hoverPreviewValue = null;
    if (own(next, 'panelRender')) syncPanelProjection();
    rebuildPresets();
    rebuildFooter();
    syncSelectionPanel(false);
    syncTimePanel();
    syncField(field.getState().open);
    if (own(next, 'open')) field.setOpen(next.open === true, 'update-options');
    return api;
  }
  function getState() {
    return Object.freeze({
      open: field.getState().open,
      headless: opts.headless === true,
      selection: selection,
      unit: unit,
      time: withTime,
      value: cloneValue(draft.value, selection),
      draftValue: cloneValue(draft.draftValue, selection),
      dirty: draft.dirty,
      text: formatSelection(field.getState().open && opts.needConfirm === true ? draft.draftValue : draft.value),
      activeRangePart: selection === 'range' ? activeRangePart : null,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      needConfirm: opts.needConfirm === true,
      order: opts.order !== false,
      allowEmpty: selection === 'range' ? allowEmptyParts() : null,
      minDate: cloneDate(minBound()),
      maxDate: cloneDate(maxBound()),
      pickerValue: currentPanelValue(),
      previewValue: cloneValue(hoverPreviewValue, selection),
      panelCustomized: Utils.isFunction(opts.panelRender),
      panelMode: calendar ? calendarPanelMode : unit,
      panelCount: Number(opts.panelCount),
      format: Array.isArray(opts.format) ? opts.format.slice() : opts.format,
      presetCount: Array.isArray(opts.presets) ? opts.presets.length : 0,
      destroyed: destroyed
    });
  }
  function disposeRuntime(reason) {
    if (destroyed) return false;
    destroyed = true;
    presetCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
    panelCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
    var destroyReason = reason || 'date-picker-destroy';
    // Finish the outer popup/control lifecycle while composed state owners are
    // still readable by beforeClose/onOpenChange callbacks. Child panels and
    // StateController is released only after PickerField has completed teardown.
    if (tagNavigation) { tagNavigation.destroy(); tagNavigation = null; }
    if (field) field.destroy(destroyReason);
    if (timePanel) timePanel.destroy(destroyReason);
    if (calendarSecondary) calendarSecondary.destroy(destroyReason);
    if (calendar) calendar.destroy(destroyReason);
    if (periodPanel) periodPanel.destroy(destroyReason);
    if (yearPanel) yearPanel.destroy(destroyReason);
    if (monthPanel) monthPanel.destroy(destroyReason);
    draft.destroy();
  
    timePanel = calendarSecondary = calendar = periodPanel = yearPanel = monthPanel = field = panelShell = selectionHost = timeHost = presetsHost = panelProjection = calendarGroup = calendarPrimaryHost = calendarSecondaryHost = null;
    hoverPreviewValue = null;
    return true;
  }



  var formControl = field && field.getControl ? field.getControl() : null;
  if (formControl && formControl.onFormReset) formControl.onFormReset(function () {
    draft.reset({ silent: true, source: 'form', reason: 'reset' });
    rawInput = formatSelection(draft.value); syncField(false); syncSelectionPanel(false); syncTimePanel();
  });
  if (opts.open === true) field.open('initial');
  return Object.freeze({ root:field.getRootElement(), panel:field.getPanelElement(), field:field, calendar:calendar, calendarSecondary:calendarSecondary, periodPanel:periodPanel, yearPanel:yearPanel, monthPanel:monthPanel, timePanel:timePanel, panelShell:panelShell, presetsHost:presetsHost, clear:clear, setValue:setValue, setPickerValue:setPickerValue, setPanelValue:setPanelValue, applyOptions:applyOptions, getState:getState, dispose:disposeRuntime });
}


export class DatePicker extends PickerComponent {
  static contract = getContract('DatePicker');
  static options = DATE_PICKER_DEFAULTS;
  static immutableOptions = DATE_PICKER_IMMUTABLE;
  static create(source, overrides) { return new this(source, overrides).render(); }
  static enhance(input, options) { return this.create(input, options || {}); }
  static formatDate(value, format, options = {}) { return DateUnit.format(value, format, { unit:options.unit || 'date', weekStartsOn:options.weekStartsOn, withTime:!!options.time }); }
  static parseDate(value, format, options = {}) {
    const formats = Array.isArray(format) ? format : [format];
    for (let i=0;i<formats.length;i+=1) { const parsed=DateUnit.parse(value,{ unit:options.unit || 'date', weekStartsOn:options.weekStartsOn, withTime:!!options.time, format:formats[i] }); if (parsed) return parsed; }
    return null;
  }

  constructor(source = {}, overrides) {
    const fieldInit = Control.resolveFieldOptions(source, overrides);
    const incoming = fieldInit.options;
    const selection = normalizeSelectionName(incoming.selection);
    const unit = String(incoming.unit || 'date').toLowerCase();
    if (DateUnit.units.indexOf(unit) < 0) throw new TypeError('[QXFRAME9A7C2] DatePicker unit must be date, week, month, quarter, or year.');
    const resolvedTime = timeConfig(incoming.time);
    const withTime = !!resolvedTime;
    if (withTime && unit !== 'date') throw new TypeError('[QXFRAME9A7C2] DatePicker time composition is only valid when unit is date.');
    if (withTime && selection === 'multiple') throw new TypeError('[QXFRAME9A7C2] DatePicker multiple selection does not compose time.');
    const derivedNeedConfirm = selection !== 'single' || withTime;
    incoming.selection = selection; incoming.unit = unit; incoming.time = resolvedTime || false;
    if (!own(incoming, 'needConfirm')) incoming.needConfirm = derivedNeedConfirm;
    if (!own(incoming, 'showCancel')) incoming.showCancel = incoming.needConfirm === true;
    if (!own(incoming, 'closeOnSelect')) incoming.closeOnSelect = selection === 'single' && incoming.needConfirm !== true && !withTime;
    if (!own(incoming, 'placeholder')) incoming.placeholder = selection === 'range' ? '选择日期范围' : (selection === 'multiple' ? '选择多个日期' : '选择日期');
    if (!own(incoming, 'panelCount')) incoming.panelCount = selection === 'range' && (unit === 'date' || unit === 'week') ? 2 : 1;
    if (!own(incoming, 'format')) incoming.format = DateUnit.defaultFormat(unit, withTime);
    super(incoming);
    runtimeState.set(this, { fieldInit, runtime:null });
  }

  [componentHooks.render]() {
    const record=runtimeState.get(this);
    if (record.runtime) return record.runtime.root;
    const runtime=setupDatePickerRuntime(this,record.fieldInit);
    record.runtime=runtime;
    this.own(()=>runtime.dispose('date-picker-destroy'));
    this.setFieldValue(runtime.getState().value,{silent:true,force:true});
    return runtime.root;
  }

  [pickerHooks.optionsUpdated](next, previous, patch) { const r=runtimeState.get(this).runtime; if(r) r.applyOptions(patch); }
  [pickerHooks.clear](meta) { const r=runtimeState.get(this).runtime; return r ? r.clear(meta) : false; }
  setValue(value,meta) { const r=runtimeState.get(this).runtime; return r ? r.setValue(value,meta) : false; }
  setPickerValue(value,meta) { const r=runtimeState.get(this).runtime; return r ? r.setPickerValue(value,meta) : false; }
  setDraftValue(value,meta) { return this.setPickerValue(value,meta); }
  setPanelValue(value,meta) { const r=runtimeState.get(this).runtime; return r ? r.setPanelValue(value,meta) : false; }
  setViewValue(value,meta) { return this.setPanelValue(value,meta); }
  getState() { const r=runtimeState.get(this).runtime; return r ? r.getState() : Object.freeze({open:false,destroyed:this.destroyed}); }
  getCalendar() { const r=runtimeState.get(this).runtime; return r ? r.calendar : null; }
  getCalendars() { const r=runtimeState.get(this).runtime; return r ? [r.calendar,r.calendarSecondary].filter(Boolean) : []; }
  getSecondaryCalendar() { const r=runtimeState.get(this).runtime; return r ? r.calendarSecondary : null; }
  getPeriodPanel() { const r=runtimeState.get(this).runtime; return r ? r.periodPanel : null; }
  getYearPanel() { const r=runtimeState.get(this).runtime; return r ? r.yearPanel : null; }
  getMonthPanel() { const r=runtimeState.get(this).runtime; return r ? r.monthPanel : null; }
  getTimePanel() { const r=runtimeState.get(this).runtime; return r ? r.timePanel : null; }
  getSelectionPanel() { const r=runtimeState.get(this).runtime; return r ? (r.calendar || r.periodPanel) : null; }
  getPanelOriginElement() { const r=runtimeState.get(this).runtime; return r ? r.panelShell : null; }
  getPresetsElement() { const r=runtimeState.get(this).runtime; return r ? r.presetsHost : null; }
}
