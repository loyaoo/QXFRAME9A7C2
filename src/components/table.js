import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { Utils } from '../utils/utils.js';
import { CapabilityController } from '../core/capabilityController.js';
import { InteractionController } from '../core/interactionController.js';
import { ValueController } from '../core/valueController.js';
import { FeedbackController } from '../core/feedbackController.js';
import { FormBridge } from '../core/formBridge.js';
import { FormController } from '../core/formController.js';
import { OperationResult } from '../core/operationResult.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { IdManager } from '../utils/id.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { TableModel } from '../core/tableModel.js';
import { AsyncTask } from '../core/asyncTask.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { EmptyProjection } from '../core/emptyProjection.js';
import { Virtualizer } from '../core/virtualizer.js';
import { FocusController } from '../core/focusController.js';
import { InteractionModality } from '../core/interactionModality.js';
import { ObserverHub } from '../core/observerHub.js';
import { PointerSession } from '../core/pointerSession.js';
import { ReorderInteraction } from '../core/reorderInteraction.js';
import { Trigger } from './trigger.js';
import { Pagination } from './pagination.js';

const global = globalThis;

var SIZES = Object.freeze(['xs','sm','md','lg','xl']);
var VIEW_STATE_VERSION = 1;
var VIEW_STATE_SCHEMA = 'qxframe9a7c2.table';
var own = Utils.own;
function normalizeSize(value) { return Utils.normalizeEnum(value == null ? 'md' : value, SIZES, undefined, 'Table size'); }
function normalizeAlign(value) {
  if (value === undefined || value === null || value === '') return null;
  var align = String(value).toLowerCase();
  if (['start','center','end'].indexOf(align) < 0) throw new TypeError('[QXFRAME9A7C2] Table column align must be start, center, or end.');
  return align;
}
function normalizeFixed(value) {
  if (value === undefined || value === null || value === '' || value === false) return null;
  var fixed = String(value).toLowerCase();
  if (fixed === 'left') fixed = 'start';
  if (fixed === 'right') fixed = 'end';
  if (fixed !== 'start' && fixed !== 'end') throw new TypeError('[QXFRAME9A7C2] Table column fixed must be start or end.');
  return fixed;
}
function normalizeResponsive(value) {
  if (value === undefined || value === null || value === '' || value === false) return null;
  var responsive = String(value).toLowerCase();
  if (responsive !== 'sm' && responsive !== 'md') throw new TypeError('[QXFRAME9A7C2] Table column responsive must be sm or md.');
  return responsive;
}
function normalizeResponsiveMode(value) {
  var mode = String(value == null ? 'hide' : value).toLowerCase();
  if (mode === 'details') throw new TypeError('[QXFRAME9A7C2] Table responsiveMode="details" is not supported by the current row renderer; use renderExpanded/details composition instead of a partial automatic details system.');
  if (mode !== 'hide' && mode !== 'scroll') throw new TypeError('[QXFRAME9A7C2] Table responsiveMode must be hide or scroll.');
  return mode;
}
function normalizeColumnOverflow(column) {
  var raw = column && column.overflow;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) raw = raw.mode;
  if (raw === undefined || raw === null || raw === '') {
    if (column && column.ellipsis === true) return 'ellipsis';
    if (column && column.nowrap === true) return 'nowrap';
    return 'wrap';
  }
  var mode = String(raw).toLowerCase();
  if (mode === 'tooltip') throw new TypeError('[QXFRAME9A7C2] Table column overflow="tooltip" is not a core Table mode yet; compose the existing Tooltip with cell content instead of creating a second Table overlay system.');
  if (mode === 'expand') throw new TypeError('[QXFRAME9A7C2] Table column overflow="expand" is not a core Table mode; use renderExpanded/details composition so expanded identity remains row-keyed.');
  if (['wrap','nowrap','ellipsis'].indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Table column overflow must be wrap, nowrap, or ellipsis.');
  return mode;
}
function normalizeKeyboardNavigation(value) {
  if (value === undefined || value === null || value === false) return false;
  if (value === true) return true;
  throw new TypeError('[QXFRAME9A7C2] Table keyboardNavigation must be boolean.');
}
function normalizeRemoteSelectionScope(value) {
  var normalized = String(value == null ? 'page' : value).toLowerCase();
  if (['page','loaded','query'].indexOf(normalized) < 0) throw new TypeError('[QXFRAME9A7C2] Table remoteSelectionScope must be page, loaded, or query.');
  return normalized;
}
function normalizeScrollPolicy(value) {
  var allowed = ['preserve','reset','reset-y','preserve-x-reset-y'];
  if (value === undefined || value === null || value === 'auto') return Object.freeze({
    page: 'reset-y', 'page-size': 'reset-y', pagination: 'reset-y', filter: 'reset-y', filters: 'reset-y', search: 'reset-y', sort: 'preserve-x-reset-y',
    refresh: 'preserve', data: 'preserve', items: 'preserve', 'remote-result': 'preserve', options: 'preserve', default: 'preserve'
  });
  if (typeof value === 'string') {
    var mode = String(value).toLowerCase();
    if (mode === 'preserve') return Object.freeze({ default: 'preserve' });
    if (mode === 'reset') return Object.freeze({ default: 'reset' });
    throw new TypeError('[QXFRAME9A7C2] Table scrollPolicy must be auto, preserve, reset, or an object.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Table scrollPolicy must be auto, preserve, reset, or an object.');
  var aliases = { onPage: 'page', onPageSize: 'page-size', onFilter: 'filter', onFilters: 'filters', onSearch: 'search', onSort: 'sort', onRefresh: 'refresh', onItems: 'data', pagination: 'page', items: 'data' };
  var out = { default: 'preserve' };
  Object.keys(value).forEach(function (key) {
    var normalizedKey = aliases[key] || key;
    var mode = String(value[key] == null ? '' : value[key]).toLowerCase();
    if (allowed.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Table scrollPolicy values must be preserve, reset, reset-y, or preserve-x-reset-y.');
    out[normalizedKey] = mode;
  });
  return Object.freeze(out);
}
function normalizeVirtual(value) {
  if (value === undefined || value === null || value === false) return false;
  if (value === true) return true;
  if (String(value).toLowerCase() === 'auto') return 'auto';
  throw new TypeError('[QXFRAME9A7C2] Table virtual must be false, true, or auto.');
}
function normalizePositiveNumber(value, name, fallback) {
  var number = Number(value === undefined || value === null || value === '' ? fallback : value);
  if (!Number.isFinite(number) || !(number > 0)) throw new TypeError('[QXFRAME9A7C2] Table ' + name + ' must be a positive finite number.');
  return number;
}
function normalizeNonNegativeInteger(value, name, fallback) {
  var number = Number(value === undefined || value === null || value === '' ? fallback : value);
  if (!Number.isFinite(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] Table ' + name + ' must be a non-negative finite number.');
  return Math.floor(number);
}
function normalizePositiveInteger(value, name, fallback) {
  var number = normalizeNonNegativeInteger(value, name, fallback);
  if (!(number > 0)) throw new TypeError('[QXFRAME9A7C2] Table ' + name + ' must be a positive integer.');
  return number;
}
function normalizeColumns(columns) {
  if (!Array.isArray(columns)) throw new TypeError('[QXFRAME9A7C2] Table columns must be an array.');
  return columns.map(function (column) {
    if (!column || typeof column !== 'object') throw new TypeError('[QXFRAME9A7C2] Table columns must be objects.');
    var copy = Utils.mergeOwn(column);
    if (Array.isArray(column.children) && column.children.length) throw new TypeError('[QXFRAME9A7C2] Table group-header columns are unsupported by the current single-row header renderer.');
    copy.key = String(column.key == null ? '' : column.key);
    if (!copy.key) throw new TypeError('[QXFRAME9A7C2] Table column.key is required.');
    copy.align = normalizeAlign(copy.align);
    copy.fixed = normalizeFixed(copy.fixed);
    copy.responsive = normalizeResponsive(copy.responsive);
    copy.overflow = normalizeColumnOverflow(copy);
    if (copy.editable !== undefined && typeof copy.editable !== 'boolean' && typeof copy.editable !== 'function') throw new TypeError('[QXFRAME9A7C2] Table column.editable must be boolean or function.');
    if (copy.flex !== undefined && copy.flex !== null && copy.flex !== '') {
      copy.flex = Number(copy.flex);
      if (!Number.isFinite(copy.flex) || copy.flex <= 0) throw new TypeError('[QXFRAME9A7C2] Table column.flex must be a positive finite number.');
    } else copy.flex = null;
    if (copy.minWidth !== undefined && copy.minWidth !== null && copy.minWidth !== '') {
      copy.minWidth = Number(copy.minWidth);
      if (!Number.isFinite(copy.minWidth) || copy.minWidth < 0) throw new TypeError('[QXFRAME9A7C2] Table column.minWidth must be a non-negative finite number.');
    }
    if (copy.maxWidth !== undefined && copy.maxWidth !== null && copy.maxWidth !== '') {
      copy.maxWidth = Number(copy.maxWidth);
      if (!Number.isFinite(copy.maxWidth) || copy.maxWidth <= 0) throw new TypeError('[QXFRAME9A7C2] Table column.maxWidth must be a positive finite number.');
    }
    if (copy.minWidth != null && copy.maxWidth != null && copy.maxWidth < copy.minWidth) throw new TypeError('[QXFRAME9A7C2] Table column.maxWidth cannot be smaller than minWidth.');
    if (copy.label !== undefined && copy.label !== null && typeof copy.label !== 'string') copy.label = String(copy.label);
    if (copy.exportLabel !== undefined && copy.exportLabel !== null && typeof copy.exportLabel !== 'string') copy.exportLabel = String(copy.exportLabel);
    if (copy.filterOptions !== undefined && !Array.isArray(copy.filterOptions)) throw new TypeError('[QXFRAME9A7C2] Table column.filterOptions must be an array.');
    if (copy.filterSearch !== undefined && copy.filterSearch !== true && copy.filterSearch !== false && typeof copy.filterSearch !== 'function') throw new TypeError('[QXFRAME9A7C2] Table column.filterSearch must be boolean or function.');
    if (copy.filterMode !== undefined && copy.filterMode !== 'menu' && copy.filterMode !== 'tree') throw new TypeError('[QXFRAME9A7C2] Table column.filterMode must be menu or tree.');
    if (copy.filterDropdownOpen !== undefined && typeof copy.filterDropdownOpen !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Table column.filterDropdownOpen must be boolean when provided.');
    if (copy.filterDropdown !== undefined && copy.filterDropdown !== null && typeof copy.filterDropdown !== 'function' && !(copy.filterDropdown && copy.filterDropdown.nodeType)) throw new TypeError('[QXFRAME9A7C2] Table column.filterDropdown must be a function, DOM Node, or null.');
    if (copy.filterIcon !== undefined && copy.filterIcon !== null && typeof copy.filterIcon !== 'function' && !(copy.filterIcon && copy.filterIcon.nodeType) && typeof copy.filterIcon !== 'string') throw new TypeError('[QXFRAME9A7C2] Table column.filterIcon must be a function, DOM Node, string, or null.');
    if (copy.getEditTarget !== undefined && copy.getEditTarget !== null && typeof copy.getEditTarget !== 'function') throw new TypeError('[QXFRAME9A7C2] Table column.getEditTarget must be a function or null.');
    return copy;
  });
}
function requiresStableRowIdentity(options) {
  return !!(options && (typeof options.load === 'function' || options.virtual === true || options.virtual === 'auto' || options.rowReorder || options.preserveSelectedKeys === true || typeof options.renderExpanded === 'function' || (Array.isArray(options.expandedKeys) && options.expandedKeys.length)));
}
function assertStableRowIdentity(items, options) {
  if (!requiresStableRowIdentity(options) || typeof options.getKey === 'function') return true;
  var unstable = (items || []).some(function (item) { return !item || typeof item !== 'object' || item.key === undefined || item.key === null || item.key === ''; });
  if (unstable) throw new TypeError('[QXFRAME9A7C2] Table advanced remote/virtual/reorder/expanded features require stable row keys through getKey or item.key.');
  return true;
}

function validateFeatureCombination(options) {
  if (options && typeof options.load === 'function' && options.rowReorder === true) {
    throw new TypeError('[QXFRAME9A7C2] Table remote + rowReorder is unsupported: remote rows are server-ordered. Persist reordering through an application/server action instead.');
  }
  return true;
}

function renderOutput(host, output, doc) {
  var value = output;
  Renderer.replace(host, value == null ? '' : value, doc);
}
function applyAttributes(node, attributes) {
  DOM.applySafeAttributes(node, attributes);
}
    
const TABLE_DEFAULTS = Object.freeze({
  items: [], columns: [], getKey: null, isItemDisabled: null,
  selectionMode: 'none', selectedKeys: [], expandedKeys: [], preserveSelectedKeys: false, remoteSelectionScope: 'page', forceRenderExpanded: false,
  sortKey: null, sortOrder: null, filters: {}, searchValue: '', searchMatcher: null, load: null, total: null, filteredTotal: null, keepStaleData: true, page: 1, pageSize: 0, pager: {},
  size: 'md', bordered: false, borderless: false, shadow: false, striped: false, hover: true, fixedLayout: false,
  stickyHeader: false, stickySummary: false, disabled: false, readOnly: false,
  loading: false, loadingText: 'Loading…', emptyText: 'No data', errorText: 'Failed to load data',
  toolbar: null, toolbarStart: null, toolbarEnd: null, footerStart: null, footerEnd: null,
  responsiveMode: 'hide', keyboardNavigation: false, editEnterBehavior: 'commit', columnReorder: false, rowReorder: false,
  virtual: false, virtualThreshold: 100, rowHeight: 44, overscan: 4, height: null, maxHeight: null, scrollPolicy: 'auto'
});
const tableState = new WeakMap();

function normalizeEditEnterBehavior(value) {
  var normalized = String(value == null ? 'commit' : value).toLowerCase();
  if (['commit','native'].indexOf(normalized) < 0) throw new TypeError('[QXFRAME9A7C2] Table editEnterBehavior must be commit or native.');
  return normalized;
}
function normalizeTableInitial(source) {
  var next = normalizeTablePatch(source || {}, TABLE_DEFAULTS);
  if (!next.container || next.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Table container must be an Element.');
  return next;
}
function normalizeTableValue(value) {
  if (value === undefined || value === null) return [];
  var source = Array.isArray(value) ? value : [value];
  return source.map(function (key) { return String(key); });
}
function normalizeTablePatch(patch, current) {
  var next = Utils.mergeOwn(patch || {});
  if (own(next, 'value')) next.selectedKeys = normalizeTableValue(next.value);
  if (own(next, 'size')) next.size = normalizeSize(next.size);
  if (own(next, 'columns')) next.columns = normalizeColumns(next.columns);
  if (own(next, 'responsiveMode')) next.responsiveMode = normalizeResponsiveMode(next.responsiveMode);
  if (own(next, 'keyboardNavigation')) next.keyboardNavigation = normalizeKeyboardNavigation(next.keyboardNavigation);
  if (own(next, 'editEnterBehavior')) next.editEnterBehavior = normalizeEditEnterBehavior(next.editEnterBehavior);
  if (own(next, 'virtual')) next.virtual = normalizeVirtual(next.virtual);
  if (own(next, 'virtualThreshold')) next.virtualThreshold = normalizePositiveInteger(next.virtualThreshold, 'virtualThreshold', current.virtualThreshold);
  if (own(next, 'rowHeight')) next.rowHeight = normalizePositiveNumber(next.rowHeight, 'rowHeight', current.rowHeight);
  if (own(next, 'overscan')) next.overscan = normalizeNonNegativeInteger(next.overscan, 'overscan', current.overscan);
  if (own(next, 'load') && next.load !== null && next.load !== undefined && typeof next.load !== 'function') throw new TypeError('[QXFRAME9A7C2] Table load must be a function or null.');
  if (own(next, 'searchMatcher') && next.searchMatcher !== null && next.searchMatcher !== undefined && typeof next.searchMatcher !== 'function') throw new TypeError('[QXFRAME9A7C2] Table searchMatcher must be a function or null.');
  if (own(next, 'searchValue')) next.searchValue = next.searchValue == null ? '' : String(next.searchValue);
  if (own(next, 'remoteSelectionScope')) next.remoteSelectionScope = normalizeRemoteSelectionScope(next.remoteSelectionScope);
  if (own(next, 'scrollPolicy')) next.scrollPolicy = normalizeScrollPolicy(next.scrollPolicy);
  var candidate = Utils.mergeOwn(TABLE_DEFAULTS, current || {}, next);
  assertStableRowIdentity(candidate.items, candidate);
  validateFeatureCombination(candidate);
  return next;
}

function setupTable(instance) {
  var opts = Utils.mergeOwn(TABLE_DEFAULTS, instance.options);
  var initialColumns = opts.columns.map(function (column) { return Utils.mergeOwn(column); });
  var doc = opts.document || opts.container.ownerDocument || global.document;
  var tableId = IdManager.next('table');
  var scope = Lifecycle.createScope();
  var root = doc.createElement('div');
  var title = doc.createElement('div');
  var toolbar = doc.createElement('div');
  var toolbarStart = doc.createElement('div');
  var toolbarEnd = doc.createElement('div');
  var table = doc.createElement('table');
  var caption = doc.createElement('caption');
  var thead = doc.createElement('thead');
  var tbody = doc.createElement('tbody');
  var tfoot = doc.createElement('tfoot');
  var footer = doc.createElement('div');
  var footerStart = doc.createElement('div');
  var footerEnd = doc.createElement('div');
  var pager = doc.createElement('div');
  var loading = doc.createElement('div');
  var errorPanel = doc.createElement('div');
  var delegation = null;
  var virtualizer = null;
  var filterTrigger = null;
  var filterPopup = null;
  var filterColumnKey = null;
  var filterDraftValues = [];
  var filterSearchValue = '';
  var destroyed = false;
  var api = instance;
  var renderProjection = null;
  var virtualizerSyncing = false;
  var keyboard = null;
  var focusController = null;
  var interactionController = null;
  var capabilityController = null;
  var filterInteractionLease = null;
  var filterKeydownCleanup = null;
  var cellDomain = null;
  var headerDomain = null;
  var pagination = null;
  var syncingPagination = false;
  var editTransaction = null;
  var editTransactionEpoch = 0;
  var pendingCellVisibilityKey = null;
  var navigationProjection = null;
  var geometryMeasureCancel = null;
  var geometryMutateCancel = null;
  var geometryObserver = null;
  var fixedGeometrySignature = '';
  var solvedColumnWidths = Object.create(null);
  var solvedColumnWidthTotal = 0;
  var bodyRowRecords = new Map();
  var deferredEditRows = new Set();
  var virtualMeasureCancel = null;
  var remoteTask = null;
  var remoteEpoch = 0;
  var remoteProcessing = false;
  var remoteError = null;
  var remoteSummary = null;
  var selectionController = null;
  var remoteSelectionChannel = null;
  var valueBinding = null;
  var feedbackController = null;
  var formBridge = null;
  var formController = null;
  var formRegistration = null;
  var formBindingConfig = null;
  var formResetting = false;
  var columnResizeSessions = [];
  var activeColumnResize = null;
  var columnReorderInteraction = null;
  var rowReorderInteraction = null;
  var initialViewState = null;
  var tableDiagnostics = { rowRenders: 0, cellRenders: 0 };
  capabilityController = CapabilityController.create({
    getState:function(){ return { disabled:opts.disabled===true, readOnly:opts.readOnly===true, loading:opts.loading===true||remoteProcessing===true }; },
    getCapabilities:function(){ return { navigable:opts.loading!==true&&remoteProcessing!==true, editable:true, selectable:true }; }
  });
  interactionController = InteractionController.create();
  var initialSelectedValue = normalizeTableValue(own(instance.options,'value') ? instance.options.value : opts.selectedKeys);
  valueBinding = ValueController.createValueBinding({
    value:initialSelectedValue,
    controlled:own(instance.options,'value'),
    normalizeValue:normalizeTableValue,
    copyValue:function(value){ return normalizeTableValue(value); }
  });
  opts.selectedKeys = valueBinding.value.slice();
  opts.value = valueBinding.value.slice();

  function applyFeedbackProjection(record){
    root.classList.toggle('is-loading',record.status==='pending'||record.status==='progress');
    root.classList.toggle('is-error',record.status==='error');
    root.classList.toggle('is-warning',record.status==='warning');
    root.classList.toggle('is-success',record.status==='success');
    return root;
  }
  var feedbackProjector = Object.freeze({
    show:applyFeedbackProjection,
    update:function(_handle,record){ return applyFeedbackProjection(record); },
    close:function(){
      root.classList.remove('is-loading','is-error','is-warning','is-success');
      return true;
    }
  });
  feedbackController = FeedbackController.createForProjector(feedbackProjector,{ ownerId:instance.id },'local');

  function syncFormBridge(meta) {
    if (!formBridge) return false;
    formBridge.setValue(valueBinding.value,{ silent:!(meta&&meta.emitNative===true) });
    return true;
  }
  function notifyFormValue(meta) {
    if (!formRegistration) return false;
    return formRegistration.notifyValue(Utils.assignOwn({ source:'table', reason:'selection' },meta||{}));
  }
  function reconcileCommittedSelectionFromModel(meta) {
    if (!model || valueBinding.controlled) return valueBinding.value.slice();
    var next=normalizeTableValue(model.getState().selectedKeys);
    valueBinding.write(next,Utils.assignOwn({ silent:true, source:'table-model', reason:'selection-reconcile' },meta||{}));
    opts.selectedKeys=valueBinding.value.slice();
    opts.value=valueBinding.value.slice();
    syncFormBridge(meta);
    if(!formResetting) notifyFormValue(meta);
    return valueBinding.value.slice();
  }
  function syncCommittedSelection(keys,meta) {
    var normalized=normalizeTableValue(keys), controlled=valueBinding.controlled;
    valueBinding.write(normalized,Utils.assignOwn({ silent:true, source:'table', reason:'selection' },meta||{}),controlled);
    opts.selectedKeys=valueBinding.value.slice();
    opts.value=valueBinding.value.slice();
    if(controlled)return valueBinding.value.slice();
    syncFormBridge(meta);
    if(!formResetting) notifyFormValue(meta);
    return valueBinding.value.slice();
  }
  function createFormBridge() {
    if (formBridge) formBridge.destroy();
    formBridge = FormBridge.create({
      root:root,
      target:opts.formTarget||null,
      formField:opts.formField||null,
      document:doc,
      name:opts.name||'',
      disabled:opts.disabled===true,
      readOnly:opts.readOnly===true,
      required:opts.required===true,
      value:valueBinding.value,
      onNativeChange:function(value){ record.setSelectedKeys(normalizeTableValue(value),{ source:'form-field', reason:'native-change' }); },
      onReset:function(){ resetCommittedSelection({ source:'form', reason:'native-reset' }); }
    });
    return formBridge;
  }
  function resetCommittedSelection(meta) {
    var context=meta&&meta.context||null;
    if(valueBinding.controlled){
      model.setSelectedKeys(initialSelectedValue.slice(),{ source:'form', reason:'reset-request', requestId:meta&&meta.requestId });
      return OperationResult.requested(context||{actionId:String(meta&&meta.requestId||instance.id+'-table-reset')},{ reason:'controlled-reset-requested', requestId:meta&&meta.requestId, targetValue:initialSelectedValue.slice() });
    }
    formResetting=true;
    try{
      valueBinding.getValueController().reset(Utils.assignOwn({ silent:true },meta||{}));
      var next=valueBinding.value.slice();
      opts.selectedKeys=next.slice(); opts.value=next.slice();
      resetRemoteSelection();
      model.setSelectedKeys(next,Utils.assignOwn({ silent:false },meta||{}));
      syncFormBridge(meta);
      return next;
    } finally { formResetting=false; }
  }
  scope.add(function(){
    if(formRegistration){ formRegistration.unregister({ source:'component', reason:'destroy' }); formRegistration=null; }
    formController=null; formBindingConfig=null;
    if(formBridge){ formBridge.destroy(); formBridge=null; }
    if(feedbackController){ feedbackController.destroy(); feedbackController=null; }
    if(valueBinding){ valueBinding.destroy(); valueBinding=null; }
  });
  interactionController.registerScope({ id:'table', root:root, document:doc, profile:{ allowEditableKeys:['F6','Escape','Enter'] }, resolveAction:resolveTableInteractionAction, onAction:handleTableInteractionAction });
  interactionController.registerScope({ id:'table-resize', parentId:'table', root:doc, document:doc, resolveAction:function(event){ return event&&event.key==='Escape'?'CANCEL_RESIZE':null; }, onAction:function(action,context){ if(action!=='CANCEL_RESIZE'||!activeColumnResize)return 'pass'; activeColumnResize.session.cancel('escape'); return 'handled'; } });
    
  title.className = 'qxframe9a7c2-table-title';
  toolbar.className = 'qxframe9a7c2-table-toolbar';
  toolbarStart.className = 'qxframe9a7c2-table-toolbar-start';
  toolbarEnd.className = 'qxframe9a7c2-table-toolbar-end';
  toolbar.appendChild(toolbarStart); toolbar.appendChild(toolbarEnd);
  table.className = 'qxframe9a7c2-table';
  caption.className = 'qxframe9a7c2-table-caption';
  tfoot.className = 'qxframe9a7c2-table-summary';
  footer.className = 'qxframe9a7c2-table-footer';
  footerStart.className = 'qxframe9a7c2-table-footer-start';
  footerEnd.className = 'qxframe9a7c2-table-footer-end';
  footer.appendChild(footerStart); footer.appendChild(footerEnd);
  pager.className = 'qxframe9a7c2-table-pagination';
  loading.className = 'qxframe9a7c2-table-loading';
  errorPanel.className = 'qxframe9a7c2-table-error';
  table.appendChild(thead); table.appendChild(tbody);
  root.appendChild(table);
  opts.container.appendChild(root);
  scope.add(function () {
    if (geometryMeasureCancel) geometryMeasureCancel();
    if (geometryMutateCancel) geometryMutateCancel();
    geometryMeasureCancel = null; geometryMutateCancel = null;
  });
  scope.add(function () { if (virtualMeasureCancel) virtualMeasureCancel(); virtualMeasureCancel = null; bodyRowRecords.clear(); deferredEditRows.clear(); });
  if ((doc.defaultView && doc.defaultView.ResizeObserver) || global.ResizeObserver) {
    geometryObserver = ObserverHub.resize([root, table], function () { requestFixedGeometry('table-resize'); });
    scope.add(function () { if (geometryObserver) geometryObserver(); geometryObserver = null; });
  } else if (doc.defaultView) {
    scope.add(DOM.listen(doc.defaultView, 'resize', function () { requestFixedGeometry('window-resize'); }));
  }
    
  function modelOptions() {
    return {
      items: opts.items,
      columns: opts.columns,
      getKey: opts.getKey,
      isItemDisabled: opts.isItemDisabled,
      selectionMode: opts.selectionMode,
      selectedKeys: valueBinding.value,
      expandedKeys: opts.expandedKeys,
      preserveSelectedKeys: opts.preserveSelectedKeys === true,
      sortKey: opts.sortKey,
      sortOrder: opts.sortOrder,
      filters: opts.filters,
      searchValue: opts.searchValue,
      searchMatcher: opts.searchMatcher,
      remote: typeof opts.load === 'function',
      total: opts.total,
      filteredTotal: opts.filteredTotal,
      page: opts.page,
      pageSize: opts.pageSize,
      onSelectionChange: function (values, detail) {
        var proposed=normalizeTableValue(values), committed=syncCommittedSelection(proposed,detail);
        if(valueBinding.controlled){
          model.setSelectedKeys(committed,{ silent:true, source:'external-owner', reason:'controlled-reconcile' });
          renderSelectionProjection({ reason:'selection', source:'controlled-reconcile' });
        }
        if (typeof opts.onSelectionChange === 'function') opts.onSelectionChange(proposed.slice(), Utils.mergeOwn( detail, { instance: api, controlled:valueBinding.controlled, committedValue:committed.slice(), selection: selectionStateSnapshot() }));
      },
      onChange: function (state, detail) {
        if (destroyed) return;
        if (detail && ['sort','filter','filters','search'].indexOf(String(detail.reason || '')) >= 0) syncRemoteSelectionQuery();
        withProjection(function () {
          if (detail && detail.reason === 'selection') renderSelectionProjection(detail);
          else renderTransaction(detail);
        }, detail && detail.projection);
        if (detail && detail.reason !== 'selection') applyScrollPolicy(detail.reason);
        if (detail && detail.restoreFilterFocusKey) {
          if (opts.keyboardNavigation && keyboard && headerDomain) {
            DOM.focusElement(root, { preventScroll: true });
            var filterKey = headerActionKey('filter', String(detail.restoreFilterFocusKey));
            var modality = keyboard.virtualFocus.getState().modality;
            headerDomain.activate(filterKey, { source: modality, reason: 'table-filter-focus-restore', ensureVisible: false });
          } else {
            var restoredFilterReference = DOM.findPrivate(thead, 'tableFilter', String(detail.restoreFilterFocusKey));
            if (restoredFilterReference) DOM.focusElement(restoredFilterReference, { preventScroll: true });
          }
        }
        if (typeof opts.onChange === 'function') opts.onChange(state, Utils.mergeOwn( detail, { instance: api }));
        if (destroyed) return;
        if (isRemoteQueryReason(detail && detail.reason)) requestRemote(detail && detail.reason || 'query');
      }
    };
  }
  var model = TableModel.create(modelOptions());
  selectionController = model.selectionController;
  remoteSelectionChannel = selectionController.getRemoteChannel('allMatching');
  createFormBridge();

  function isRemote() { return typeof opts.load === 'function'; }
  function isRemoteQueryReason(reason) { return isRemote() && ['sort','filter','filters','page','page-size','search','options'].indexOf(String(reason || '')) >= 0; }
  function remoteQuery() {
    var state = model.getState();
    return Object.freeze({
      page: state.page,
      pageSize: state.pageSize,
      search: state.searchValue || '',
      sorters: state.sortKey && state.sortOrder ? Object.freeze([{ key: state.sortKey, order: state.sortOrder }]) : Object.freeze([]),
      filters: Object.freeze(Object.keys(state.filters || {}).reduce(function (out, key) { out[key] = Object.freeze((state.filters[key] || []).slice()); return out; }, {}))
    });
  }
  function remoteQueryFingerprint() {
    var query = remoteQuery();
    var orderedFilters = Object.keys(query.filters || {}).sort().reduce(function (out, key) { out[key] = (query.filters[key] || []).slice(); return out; }, {});
    return global.JSON.stringify({ search: query.search || '', sorters: query.sorters || [], filters: orderedFilters });
  }
  function querySelectionActive() {
    return isRemote() && opts.remoteSelectionScope === 'query' && !!remoteSelectionChannel && remoteSelectionChannel.allMatching === true && remoteSelectionChannel.queryKey === remoteQueryFingerprint();
  }
  function resetRemoteSelection() {
    return remoteSelectionChannel ? remoteSelectionChannel.clear({ silent:true, source:'table', reason:'remote-selection-reset' }) : false;
  }
  function syncRemoteSelectionQuery() {
    if (!remoteSelectionChannel || !remoteSelectionChannel.allMatching) return false;
    return remoteSelectionChannel.reconcileQuery(remoteQueryFingerprint(), { silent:true, source:'table', reason:'query-revision' });
  }
  function isKeySelected(key, state) {
    var normalized = String(key);
    if (querySelectionActive()) return remoteSelectionChannel.isSelected(normalized);
    return (state || currentState()).selectedKeys.indexOf(normalized) >= 0;
  }
  function selectionStateSnapshot() {
    var state = currentState();
    var queryMode = querySelectionActive();
    var remoteState = remoteSelectionChannel ? remoteSelectionChannel.snapshot() : null;
    return Object.freeze({
      scope: isRemote() ? opts.remoteSelectionScope : 'page',
      mode: queryMode ? 'all-matching' : 'explicit',
      allMatching: queryMode,
      selectedKeys: Object.freeze(state.selectedKeys.slice()),
      excludedKeys: Object.freeze(queryMode && remoteState ? remoteState.excludedKeys.slice() : []),
      queryFingerprint: queryMode && remoteState ? remoteState.queryKey : null,
      knownCount: queryMode && remoteState ? remoteState.knownCount : null,
      queryRevision: queryMode && remoteState ? remoteState.revision : null,
      dataRevision: selectionController ? selectionController.getDataRevision('selected') : 0
    });
  }
  function emitSelectionChange(meta) {
    if (typeof opts.onSelectionChange !== 'function') return;
    var entries = projectedEntries();
    var values = entries.filter(function (entry) { return isKeySelected(entry.key); }).map(function (entry) { return entry.key; });
    opts.onSelectionChange(values, Utils.assignOwn({ instance: api, selection: selectionStateSnapshot() }, meta || {}));
  }
  function setQuerySelectionAll(selected, meta) {
    if (!isRemote() || opts.remoteSelectionScope !== 'query' || !remoteSelectionChannel) return false;
    var detail = Utils.assignOwn({ source:'table', reason:'selection', selectionReason:'query-all' }, meta || {});
    if (selected !== false) {
      remoteSelectionChannel.setAllMatching(remoteQueryFingerprint(), true, Utils.assignOwn({ silent:true }, detail));
      remoteSelectionChannel.setKnownCount(currentState().filteredTotal, { silent:true, source:'table', reason:'query-count' });
    } else remoteSelectionChannel.clear(Utils.assignOwn({ silent:true }, detail));
    renderSelectionProjection(detail);
    emitSelectionChange(detail);
    return true;
  }
  function toggleQuerySelection(key, selected, meta) {
    if (!querySelectionActive() || !remoteSelectionChannel) return false;
    var normalized = String(key);
    var detail = Utils.assignOwn({ source:'table', reason:'selection', selectionReason:'query-exclusion', key: normalized }, meta || {});
    if (!remoteSelectionChannel.toggle(normalized, selected, Utils.assignOwn({ silent:true }, detail))) return false;
    renderSelectionProjection(detail);
    emitSelectionChange(detail);
    return true;
  }
  function normalizeRemoteResult(result) {
    if (!result || typeof result !== 'object' || !Array.isArray(result.items)) throw new TypeError('[QXFRAME9A7C2] Table load() must resolve to { items, total }.');
    var total = Number(result.total);
    if (!Number.isFinite(total) || total < 0) throw new TypeError('[QXFRAME9A7C2] Table load() result.total must be a non-negative finite number.');
    var filteredTotal = result.filteredTotal == null ? total : Number(result.filteredTotal);
    if (!Number.isFinite(filteredTotal) || filteredTotal < 0) throw new TypeError('[QXFRAME9A7C2] Table load() result.filteredTotal must be a non-negative finite number.');
    return { items: result.items, total: Math.floor(total), filteredTotal: Math.floor(filteredTotal), summary: own(result, 'summary') ? result.summary : null };
  }
  remoteTask = AsyncTask.create({
    task: function (query, context) {
      return Promise.resolve(opts.load(query, Object.freeze({ signal: context.signal, requestId: context.requestId, source: context.source, instance: api }))).then(normalizeRemoteResult);
    },
    onStateChange: function (state, detail) {
      if (destroyed) return;
      remoteProcessing = state.state === 'pending';
      remoteError = state.state === 'error' ? state.error : (state.state === 'pending' || state.state === 'success' ? null : remoteError);
      syncRoot();
      if (state.state === 'error' && typeof opts.onLoadError === 'function') opts.onLoadError(state.error, Object.freeze({ requestId: detail && detail.requestId, instance: api }));
    }
  });
  scope.add(function () { if (remoteTask) remoteTask.destroy(); remoteTask = null; });
  function invalidateRemoteRequest(reason) {
    remoteEpoch += 1;
    if (remoteTask && remoteTask.pending) remoteTask.cancel(reason || 'remote-data-owner-replaced');
    remoteProcessing = false;
    remoteError = null;
  }
  function requestRemote(reason) {
    if (destroyed || !isRemote() || !remoteTask) return Promise.resolve(false);
    var query = remoteQuery();
    var epoch = ++remoteEpoch;
    return remoteTask.run(query, { source: reason || 'refresh' }).then(function (result) {
      if (destroyed || epoch !== remoteEpoch || !remoteTask || remoteTask.state !== 'success') return false;
      var normalized = result;
      opts.items = normalized.items; opts.total = normalized.total; opts.filteredTotal = normalized.filteredTotal; remoteSummary = normalized.summary;
      model.setRemoteData(normalized.items, { total: normalized.total, filteredTotal: normalized.filteredTotal }, { source: 'remote', reason: 'remote-result', origin: reason || 'remote-load' });
      if (querySelectionActive() && remoteSelectionChannel) remoteSelectionChannel.setKnownCount(normalized.filteredTotal, { silent:true, source:'remote', reason:'query-count' });
      if (typeof opts.onLoad === 'function') opts.onLoad(normalized, Object.freeze({ query: query, instance: api }));
      return normalized;
    }).catch(function (error) {
      if (error && error.name === 'AbortError') return false;
      return false;
    });
  }
    
  function withProjection(callback, suppliedProjection) {
    var previous = renderProjection;
    if (!renderProjection) renderProjection = suppliedProjection || model.getProjection();
    try { return callback(renderProjection); }
    finally { renderProjection = previous; }
  }
  function currentState() { return renderProjection ? renderProjection.state : model.getState(); }
  function viewBlocked() { return destroyed || !capabilityController || !capabilityController.can('navigate'); }
  function mutationLocked() { return destroyed || !capabilityController || !capabilityController.can('edit'); }
  function allColumns() { return renderProjection ? renderProjection.state.columns : model.columns; }
  function currentColumns() { return allColumns().filter(function (column) { return column.visible !== false; }); }
  function columnByKey(key) { var normalized = String(key); return allColumns().filter(function (column) { return column.key === normalized; })[0] || null; }
  function projectedEntries() { return renderProjection ? renderProjection.entries : model.getProjectedEntries(); }
  function scrollModeFor(reason) {
    var policy = opts.scrollPolicy || normalizeScrollPolicy('auto');
    return policy[String(reason || '')] || policy.default || 'preserve';
  }
  function applyScrollPolicy(reason) {
    var mode = scrollModeFor(reason);
    if (mode === 'preserve') return false;
    var left = Number(root.scrollLeft) || 0;
    if (mode === 'reset') { root.scrollLeft = 0; root.scrollTop = 0; return true; }
    if (mode === 'reset-y' || mode === 'preserve-x-reset-y') { root.scrollTop = 0; if (mode === 'preserve-x-reset-y') root.scrollLeft = left; return true; }
    return false;
  }
  function filterValuesFor(column) {
    var state = currentState();
    return state.filters[column.key] || [];
  }
  function columnValue(entry, column) { return model.getCellValue(entry.item, column, entry.sourceIndex); }
  function rowContext(entry, pageIndex, visibleIndex) {
    var state = currentState();
    return Object.freeze({
      row: entry.item,
      key: entry.key,
      meta: Object.freeze({
        sourceIndex: entry.sourceIndex,
        selected: isKeySelected(entry.key, state),
        expanded: state.expandedKeys.indexOf(entry.key) >= 0,
        disabled: isEntryDisabled(entry)
      }),
      view: Object.freeze({
        pageIndex: Number.isInteger(pageIndex) ? pageIndex : -1,
        visibleIndex: Number.isInteger(visibleIndex) ? visibleIndex : (Number.isInteger(pageIndex) ? pageIndex : -1)
      }),
      state: state,
      instance: api
    });
  }
  function columnContext(entry, column, pageIndex, visibleIndex) {
    var rowView = rowContext(entry, pageIndex, visibleIndex);
    return Object.freeze({ row: rowView.row, key: rowView.key, meta: rowView.meta, view: rowView.view, column: column, columnKey: column.key, state: rowView.state, instance: api });
  }
  function isEntryDisabled(entry) {
    return !!(opts.disabled === true || (opts.isItemDisabled && opts.isItemDisabled(entry.item, entry.sourceIndex, api) === true) || (entry.item && entry.item.disabled === true));
  }
  function navigationColumns() {
    var state = currentState(), result = [];
    if (state.selectionMode !== 'none') result.push({ kind: 'selection', key: '' });
    if (typeof opts.renderExpanded === 'function') result.push({ kind: 'expand', key: '' });
    currentColumns().forEach(function (column) { result.push({ kind: 'data', key: column.key }); });
    return result;
  }
  function navigationCellKey(rowKey, column) {
    return global.JSON.stringify([String(rowKey), String(column.kind), String(column.key || '')]);
  }
  function decodeNavigationCellKey(key) {
    try {
      var value = global.JSON.parse(String(key || ''));
      if (!Array.isArray(value) || value.length !== 3) return null;
      if (value[1] !== 'selection' && value[1] !== 'expand' && value[1] !== 'data') return null;
      return { rowKey: String(value[0]), kind: String(value[1]), columnKey: String(value[2] || '') };
    } catch (_) { return null; }
  }
  function rebuildNavigationProjection() {
    var allEntries = projectedEntries();
    var entries = [], columns = navigationColumns();
    var rowIndexByKey = Object.create(null), projectedIndexByKey = Object.create(null), entryByKey = Object.create(null), columnIndexByIdentity = Object.create(null);
    allEntries.forEach(function (entry, projectedIndex) {
      projectedIndexByKey[entry.key] = projectedIndex;
      if (isEntryDisabled(entry)) return;
      rowIndexByKey[entry.key] = entries.length;
      entryByKey[entry.key] = entry;
      entries.push(entry);
    });
    columns.forEach(function (column, index) { columnIndexByIdentity[column.kind + '\u0000' + column.key] = index; });
    navigationProjection = { entries: entries, columns: columns, rowIndexByKey: rowIndexByKey, projectedIndexByKey: projectedIndexByKey, entryByKey: entryByKey, columnIndexByIdentity: columnIndexByIdentity };
    return navigationProjection;
  }
  function currentNavigationProjection() { return navigationProjection || rebuildNavigationProjection(); }
  function findNavigationCell(key) { return DOM.findPrivate(tbody, 'tableNavigationCell', String(key)); }
  function reconcileNavigationCell(key) {
    var projection = rebuildNavigationProjection();
    if (!projection.entries.length || !projection.columns.length) return null;
    var decoded = decodeNavigationCellKey(key);
    var rowKey = decoded && own(projection.rowIndexByKey, decoded.rowKey) ? decoded.rowKey : projection.entries[0].key;
    var identity = decoded ? decoded.kind + '\u0000' + decoded.columnKey : '';
    var columnIndex = own(projection.columnIndexByIdentity, identity) ? projection.columnIndexByIdentity[identity] : 0;
    return navigationCellKey(rowKey, projection.columns[columnIndex]);
  }
  function ensureNavigationCellVisible(key) {
    var projection = currentNavigationProjection(), decoded = decodeNavigationCellKey(key);
    if (!decoded || !own(projection.rowIndexByKey, decoded.rowKey)) return false;
    var entryIndex = projection.projectedIndexByKey[decoded.rowKey];
    if (!Number.isInteger(entryIndex) || entryIndex < 0) return false;
    if (virtualizer && virtualizer.enabled) virtualizer.scrollToIndex(entryIndex, { align: 'nearest' });
    var cell = findNavigationCell(key);
    if (!cell) { pendingCellVisibilityKey = String(key); return true; }
    pendingCellVisibilityKey = null;
    return ScrollVisibility.ensureVisible(root, cell, { axis: 'both', align: 'nearest' });
  }
  function completePendingCellVisibility() {
    if (!pendingCellVisibilityKey || !cellDomain || !keyboard) return false;
    var state = keyboard.virtualFocus.getState();
    if (state.domain !== cellDomain.name || String(state.key || '') !== String(pendingCellVisibilityKey)) { pendingCellVisibilityKey = null; return false; }
    var cell = findNavigationCell(pendingCellVisibilityKey);
    if (!cell) return false;
    var key = pendingCellVisibilityKey;
    pendingCellVisibilityKey = null;
    ScrollVisibility.ensureVisible(root, cell, { axis: 'both', align: 'nearest' });
    return !!key;
  }
  function activateNavigationCell(rowIndex, columnIndex, reason, event) {
    var projection = currentNavigationProjection();
    if (!projection.entries.length || !projection.columns.length || !cellDomain) return false;
    rowIndex = Math.max(0, Math.min(projection.entries.length - 1, rowIndex));
    columnIndex = Math.max(0, Math.min(projection.columns.length - 1, columnIndex));
    if (focusController) focusController.setActiveRegion('cells', { source:'keyboard', reason:reason || 'table-cell-nav', originalEvent:event || null });
    return cellDomain.activate(navigationCellKey(projection.entries[rowIndex].key, projection.columns[columnIndex]), { source: 'keyboard', reason: reason || 'table-cell-nav', originalEvent: event || null, ensureVisible: true });
  }
  function currentNavigationCoordinates() {
    if (!keyboard || !cellDomain) return null;
    var state = keyboard.virtualFocus.getState();
    if (state.domain !== cellDomain.name) return null;
    var decoded = decodeNavigationCellKey(state.key), projection = currentNavigationProjection();
    if (!decoded || !own(projection.rowIndexByKey, decoded.rowKey)) return null;
    var identity = decoded.kind + '\u0000' + decoded.columnKey;
    if (!own(projection.columnIndexByIdentity, identity)) return null;
    return { row: projection.rowIndexByKey[decoded.rowKey], column: projection.columnIndexByIdentity[identity], key: String(state.key) };
  }
  function moveNavigationCell(rowDelta, columnDelta, reason, event, edge) {
    var projection = currentNavigationProjection();
    if (!projection.entries.length || !projection.columns.length) return false;
    var current = currentNavigationCoordinates();
    var row = current ? current.row : (rowDelta < 0 ? projection.entries.length - 1 : 0);
    var column = current ? current.column : (columnDelta < 0 ? projection.columns.length - 1 : 0);
    if (!current && !edge) return activateNavigationCell(row, column, reason, event);
    if (edge === 'row-start') column = 0;
    else if (edge === 'row-end') column = projection.columns.length - 1;
    else if (edge === 'table-start') { row = 0; column = 0; }
    else if (edge === 'table-end') { row = projection.entries.length - 1; column = projection.columns.length - 1; }
    else { row += rowDelta || 0; column += columnDelta || 0; }
    return activateNavigationCell(row, column, reason, event);
  }
  function pageNavigationCell(delta, event) {
    var viewportRows = Math.max(1, Math.floor((Number(root.clientHeight) || opts.rowHeight * 8) / Math.max(1, opts.rowHeight)) - 1);
    return moveNavigationCell(delta * viewportRows, 0, delta < 0 ? 'table-page-up' : 'table-page-down', event);
  }
  function resolveDataCellContext(key) {
    var decoded = decodeNavigationCellKey(key);
    if (!decoded || decoded.kind !== 'data') return null;
    var projection = currentNavigationProjection(), entry = projection.entryByKey[decoded.rowKey];
    if (!entry) return null;
    var column = currentColumns().filter(function (candidate) { return candidate.key === decoded.columnKey; })[0];
    var cell = findNavigationCell(key);
    if (!column || !cell) return null;
    var rowIndex = projection.projectedIndexByKey[entry.key];
    return { decoded: decoded, entry: entry, column: column, cell: cell, context: columnContext(entry, column, rowIndex) };
  }
  function columnEditable(detail) {
    if (!detail || !detail.column || typeof detail.column.getEditTarget !== 'function') return false;
    if (detail.column.editable === false) return false;
    if (typeof detail.column.editable === 'function') return detail.column.editable(detail.entry.item, detail.column, Object.freeze(detail.context)) === true;
    return true;
  }
  function resolveEditTarget(key) {
    var detail = resolveDataCellContext(key);
    if (!detail || !columnEditable(detail)) return null;
    var target = detail.column.getEditTarget(detail.cell, Object.freeze(Utils.mergeOwn( detail.context, { cell: detail.cell })));
    if (target == null) return null;
    if (!target.nodeType || (target !== detail.cell && !detail.cell.contains(target))) throw new TypeError('[QXFRAME9A7C2] Table column.getEditTarget must return a descendant Element or null.');
    if (typeof target.focus !== 'function') throw new TypeError('[QXFRAME9A7C2] Table column.getEditTarget must return a focusable descendant Element or null.');
    return target;
  }
  function editorValue(target) {
    if (!target) return undefined;
    if (target.type === 'checkbox' || target.type === 'radio') return target.checked === true;
    if ('value' in target) return target.value;
    if (target.isContentEditable === true) return target.textContent;
    return undefined;
  }
  function restoreEditorValue(target, value) {
    if (!target) return false;
    if (target.type === 'checkbox' || target.type === 'radio') { target.checked = value === true; return true; }
    if ('value' in target) { target.value = value == null ? '' : String(value); return true; }
    if (target.isContentEditable === true) { target.textContent = value == null ? '' : String(value); return true; }
    return false;
  }
  function editKey() { return editTransaction ? editTransaction.key : null; }
  function editStateSnapshot() {
    if (!editTransaction) return null;
    var decoded = decodeNavigationCellKey(editTransaction.key);
    return Object.freeze({ rowKey: decoded ? decoded.rowKey : null, columnKey: decoded && decoded.kind === 'data' ? decoded.columnKey : null, status: editTransaction.status, draft: editTransaction.draftValue, initial: editTransaction.initialValue, error: editTransaction.error || null, reason: editTransaction.reason || null });
  }
  function finalizeEditTransaction(reason, event, restoreFocus) {
    if (!editTransaction) return false;
    var transaction = editTransaction, key = transaction.key;
    editTransaction = null;
    if (focusController) focusController.endEdit({ restore: restoreFocus !== false, reason: reason || 'table-edit-exit', originalEvent: event || null });
    else if (restoreFocus !== false) DOM.focusElement(root, { preventScroll: true });
    if (focusController) focusController.setActiveRegion('cells', { source:'keyboard', reason:reason || 'table-edit-exit', originalEvent:event || null });
    if (cellDomain) cellDomain.activate(key, { source: 'keyboard', reason: reason || 'table-edit-exit', originalEvent: event || null, ensureVisible: restoreFocus !== false });
    var decoded = decodeNavigationCellKey(key);
    if (decoded && deferredEditRows.has(decoded.rowKey)) { deferredEditRows.delete(decoded.rowKey); render('edit-reconcile'); }
    return true;
  }
  function failEditTransaction(error, reason) {
    if (!editTransaction) return false;
    editTransaction.status = 'error'; editTransaction.error = error || new Error('[QXFRAME9A7C2] Table edit validation failed.'); editTransaction.reason = reason || 'edit-error';
    var target = editTransaction.target;
    if (target && target.isConnected) DOM.focusElement(target, { preventScroll: true });
    return true;
  }
  function commitEditTransaction(reason, event, restoreFocus) {
    if (!editTransaction || editTransaction.status === 'validating') return false;
    var transaction = editTransaction;
    transaction.draftValue = editorValue(transaction.target);
    transaction.status = 'validating'; transaction.reason = reason || 'edit-commit'; transaction.error = null;
    var detail = Object.freeze({ value: transaction.draftValue, initialValue: transaction.initialValue, row: transaction.row, context: transaction.context, reason: transaction.reason, originalEvent: event || null, instance: api });
    var validation;
    try { validation = transaction.column && typeof transaction.column.validateEdit === 'function' ? transaction.column.validateEdit(transaction.draftValue, transaction.row, detail) : true; }
    catch (error) { return failEditTransaction(error, 'edit-validation-error'); }
    function validated(result) {
      if (!editTransaction || editTransaction.epoch !== transaction.epoch) return false;
      if (result === false || typeof result === 'string') return failEditTransaction(result === false ? null : new Error(result), 'edit-invalid');
      var saved;
      try { saved = transaction.column && typeof transaction.column.onEditCommit === 'function' ? transaction.column.onEditCommit(transaction.draftValue, transaction.row, detail) : true; }
      catch (error) { return failEditTransaction(error, 'edit-save-error'); }
      if (saved && typeof saved.then === 'function') {
        saved.then(function (value) { if (!editTransaction || editTransaction.epoch !== transaction.epoch) return; if (value === false) failEditTransaction(null, 'edit-save-error'); else finalizeEditTransaction(transaction.reason, event, restoreFocus); }, function (error) { if (editTransaction && editTransaction.epoch === transaction.epoch) failEditTransaction(error, 'edit-save-error'); });
        return true;
      }
      if (saved === false) return failEditTransaction(null, 'edit-save-error');
      return finalizeEditTransaction(transaction.reason, event, restoreFocus);
    }
    if (validation && typeof validation.then === 'function') {
      validation.then(validated, function (error) { if (editTransaction && editTransaction.epoch === transaction.epoch) failEditTransaction(error, 'edit-validation-error'); });
      return true;
    }
    return validated(validation);
  }
  function cancelEditTransaction(reason, event, restoreFocus) {
    if (!editTransaction) return false;
    var transaction = editTransaction;
    restoreEditorValue(transaction.target, transaction.initialValue);
    transaction.status = 'cancelled'; transaction.reason = reason || 'edit-cancel';
    if (transaction.column && typeof transaction.column.onEditCancel === 'function') {
      try { transaction.column.onEditCancel(transaction.initialValue, transaction.row, Object.freeze({ reason: transaction.reason, originalEvent: event || null, context: transaction.context, instance: api })); } catch (_) {}
    }
    return finalizeEditTransaction(transaction.reason, event, restoreFocus);
  }
  function enterCellEdit(key, reason, event) {
    if (mutationLocked()) return false;
    var target = resolveEditTarget(key);
    if (!target || target.disabled === true) return false;
    if (Number(target.tabIndex) >= 0) throw new Error('[QXFRAME9A7C2] Table Hybrid Edit target must be authored with tabIndex=-1 so Navigation Mode keeps one Tab stop.');
    var detail = resolveDataCellContext(key);
    if (!detail) return false;
    editTransaction = { key: String(key), status: 'begin', initialValue: editorValue(target), draftValue: editorValue(target), target: target, row: detail.entry.item, context: detail.context, column: detail.column, error: null, reason: reason || 'edit-begin', epoch: ++editTransactionEpoch };
    if (focusController) {
      focusController.setActiveRegion('cells', { source:'keyboard', reason:reason || 'edit-begin', originalEvent:event || null });
      focusController.beginEdit(target, { source:'table', reason:reason || 'edit-begin' });
    }
    if (!DOM.focusElement(target, { preventScroll: true }) || doc.activeElement !== target) { if (focusController) focusController.endEdit({ restore:false, reason:'table-edit-focus-failed' }); editTransaction = null; return false; }
    editTransaction.status = 'draft';
    if (detail.column && typeof detail.column.onEditBegin === 'function') { try { detail.column.onEditBegin(editTransaction.draftValue, detail.entry.item, Object.freeze({ reason: reason || 'edit-begin', originalEvent: event || null, context: detail.context, instance: api })); } catch (_) {} }
    return true;
  }
  function exitCellEdit(reason, event, restoreFocus) {
    if (!editTransaction) return false;
    return String(reason || '').indexOf('escape') >= 0 ? cancelEditTransaction(reason, event, restoreFocus) : commitEditTransaction(reason, event, restoreFocus);
  }
  function activateCurrentCell(event) {
    if (!keyboard || !cellDomain) return false;
    var state = keyboard.virtualFocus.getState(), decoded = state.domain === cellDomain.name ? decodeNavigationCellKey(state.key) : null;
    if (!decoded) return moveNavigationCell(0, 0, 'table-cell-seed', event);
    var cell = findNavigationCell(state.key);
    if (!cell) return false;
    if (decoded.kind === 'selection') {
      var select = DOM.findPrivate(cell, 'tableSelect', decoded.rowKey);
      if (!select || select.disabled) return false;
      select.click(); return true;
    }
    if (decoded.kind === 'expand') {
      var expand = DOM.findPrivate(cell, 'tableExpand', decoded.rowKey);
      if (!expand || expand.disabled) return false;
      expand.click(); return true;
    }
    return enterCellEdit(state.key, 'table-edit-enter', event);
  }
  function headerActionKey(kind, columnKey) { return global.JSON.stringify([String(kind), String(columnKey || '')]); }
  function decodeHeaderActionKey(key) { try { var value = global.JSON.parse(String(key || '')); return Array.isArray(value) && value.length === 2 ? { kind: String(value[0]), columnKey: String(value[1] || '') } : null; } catch (_) { return null; } }
  function headerActionKeys() {
    var state = currentState(), keys = [];
    if (state.selectionMode === 'multiple') keys.push(headerActionKey('select-all', ''));
    currentColumns().forEach(function (column) {
      if (column.sortable) keys.push(headerActionKey('sort', column.key));
      if ((Array.isArray(column.filterOptions) && column.filterOptions.length) || column.filterDropdown) keys.push(headerActionKey('filter', column.key));
    });
    return keys;
  }
  function headerActionElement(key) {
    var decoded = decodeHeaderActionKey(key);
    if (!decoded) return null;
    if (decoded.kind === 'select-all') return DOM.findPrivate(thead, 'tableSelectAll', 'true');
    if (decoded.kind === 'sort') return DOM.findPrivate(thead, 'tableSort', decoded.columnKey);
    if (decoded.kind === 'filter') return DOM.findPrivate(thead, 'tableFilter', decoded.columnKey);
    return null;
  }
  function headerReconcile(key) {
    var keys = headerActionKeys().filter(function (candidate) { var element = headerActionElement(candidate); return element && element.disabled !== true; });
    if (!keys.length) return null;
    return keys.indexOf(String(key || '')) >= 0 ? String(key) : keys[0];
  }
  function moveHeader(delta, edge, event) {
    if (!headerDomain) return false;
    var keys = headerActionKeys().filter(function (candidate) { var element = headerActionElement(candidate); return element && element.disabled !== true; });
    if (!keys.length) return false;
    var state = keyboard.virtualFocus.getState(), index = state.domain === headerDomain.name ? keys.indexOf(String(state.key || '')) : -1;
    if (edge === 'first') index = 0; else if (edge === 'last') index = keys.length - 1;
    else if (index < 0) index = delta < 0 ? keys.length - 1 : 0; else index = Math.max(0, Math.min(keys.length - 1, index + delta));
    if (focusController) focusController.setActiveRegion('header', { source:'keyboard', reason:'table-header-nav', originalEvent:event || null });
    return headerDomain.activate(keys[index], { source: 'keyboard', reason: 'table-header-nav', originalEvent: event || null, ensureVisible: true });
  }
  function focusFilterEditor() {
    if (!filterPopup) return false;
    var target = filterPopup.querySelector('input:not(:disabled),textarea:not(:disabled),select:not(:disabled),button:not(:disabled),[contenteditable="true"]');
    return target ? DOM.focusElement(target, { preventScroll: true }) : false;
  }
  function activateHeaderAction(event) {
    if (!headerDomain || !keyboard) return false;
    var state = keyboard.virtualFocus.getState(), element = state.domain === headerDomain.name ? headerActionElement(state.key) : null;
    if (!element || element.disabled) return false;
    var decoded = decodeHeaderActionKey(state.key);
    element.click();
    if (decoded && decoded.kind === 'filter' && filterPopup) focusFilterEditor();
    return true;
  }
  function regionAvailable(domain) {
    if (domain === cellDomain) { var p = rebuildNavigationProjection(); return !!(p.entries.length && p.columns.length); }
    if (domain === headerDomain) return headerActionKeys().some(function (key) { var element = headerActionElement(key); return element && !element.disabled; });
    return false;
  }
  function activateRegion(domain, backward, event) {
    if (domain === cellDomain) { var p = rebuildNavigationProjection(); return activateNavigationCell(backward ? p.entries.length - 1 : 0, backward ? p.columns.length - 1 : 0, 'table-region-cell', event); }
    if (domain === headerDomain) return moveHeader(0, backward ? 'last' : 'first', event);
    return false;
  }
  function cycleNavigationRegion(backward, event) {
    var domains = [cellDomain, headerDomain].filter(function (domain) { return domain && regionAvailable(domain); });
    if (!domains.length) return false;
    var state = keyboard.virtualFocus.getState(), currentIndex = -1;
    domains.forEach(function (domain, index) { if (state.domain === domain.name) currentIndex = index; });
    var nextIndex = currentIndex < 0 ? (backward ? domains.length - 1 : 0) : (currentIndex + (backward ? -1 : 1) + domains.length) % domains.length;
    return activateRegion(domains[nextIndex], backward, event);
  }
  function refreshNavigationDomains(reconcile) {
    navigationProjection = null;
    if (!keyboard) return false;
    if (cellDomain) cellDomain.refresh({ reconcile: reconcile === true });
    if (headerDomain) headerDomain.refresh({ reconcile: reconcile === true });
    completePendingCellVisibility();
    return true;
  }
  function resolveTableInteractionAction(event) {
    if (!event) return null;
    if (event.key === 'F6') return 'CYCLE_REGION';
    if (event.key === 'Escape') return 'CANCEL_EDIT';
    if (event.key === 'F2') return 'ENTER_EDIT';
    if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && event.key === 'Home') return 'MOVE_FIRST';
    if (event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey && event.key === 'End') return 'MOVE_LAST';
    return InteractionController.resolveKeyboardAction(event);
  }
  function dispatchTableInteraction(event) {
    if (!interactionController || !event) return false;
    return interactionController.dispatch(event, { ownerId:'table' }) !== 'pass';
  }
  function handleTableInteractionAction(action, context) {
    var event = context && context.originalEvent || null;
    if (!event) return 'pass';
    if (action === 'CANCEL_EDIT') return editTransaction && cancelEditTransaction('table-edit-escape', event, true) ? 'handled' : 'pass';
    if (action === 'CYCLE_REGION') {
      if (!capabilityController || !capabilityController.can('navigate')) return 'blocked';
      if (editTransaction) exitCellEdit('table-edit-f6', event, true);
      return cycleNavigationRegion(event.shiftKey === true, event) ? 'handled' : 'pass';
    }
    if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT' || action === 'MOVE_UP' || action === 'MOVE_DOWN' || action === 'MOVE_FIRST' || action === 'MOVE_LAST' || action === 'PAGE_PREVIOUS' || action === 'PAGE_NEXT') {
      if (!capabilityController || !capabilityController.can('navigate')) return 'blocked';
      var state=keyboard&&keyboard.virtualFocus?keyboard.virtualFocus.getState():null;
      if (!state) return 'pass';
      if (action === 'MOVE_LEFT') return (state.domain===headerDomain.name?moveHeader(-1,null,event):moveNavigationCell(0,-1,'table-arrow-left',event))?'handled':'pass';
      if (action === 'MOVE_RIGHT') return (state.domain===headerDomain.name?moveHeader(1,null,event):moveNavigationCell(0,1,'table-arrow-right',event))?'handled':'pass';
      if (action === 'MOVE_UP') return (state.domain===cellDomain.name||!state.domain)&&moveNavigationCell(-1,0,'table-arrow-up',event)?'handled':'pass';
      if (action === 'MOVE_DOWN') return (state.domain===cellDomain.name||!state.domain)&&moveNavigationCell(1,0,'table-arrow-down',event)?'handled':'pass';
      if (action === 'MOVE_FIRST') {
        if (state.domain===headerDomain.name) return moveHeader(0,'first',event)?'handled':'pass';
        return moveNavigationCell(0,0,'table-home',event,event.ctrlKey?'table-start':'row-start')?'handled':'pass';
      }
      if (action === 'MOVE_LAST') {
        if (state.domain===headerDomain.name) return moveHeader(0,'last',event)?'handled':'pass';
        return moveNavigationCell(0,0,'table-end',event,event.ctrlKey?'table-end':'row-end')?'handled':'pass';
      }
      if (action === 'PAGE_PREVIOUS') return pageNavigationCell(-1,event)?'handled':'pass';
      if (action === 'PAGE_NEXT') return pageNavigationCell(1,event)?'handled':'pass';
    }
    if (action === 'ENTER_EDIT') {
      if (!capabilityController || !capabilityController.can('edit')) return 'blocked';
      var editState=keyboard&&keyboard.virtualFocus?keyboard.virtualFocus.getState():null;
      return editState&&editState.domain===cellDomain.name&&enterCellEdit(editState.key,'table-edit-f2',event)?'handled':'pass';
    }
    if (action === 'ACTIVATE') {
      if (editTransaction) {
        var editTarget=editTransaction.target, tag=String(editTarget&&editTarget.tagName||'').toLowerCase();
        if (opts.editEnterBehavior==='native'||tag==='textarea'||(editTarget&&editTarget.isContentEditable===true)) return 'pass';
        if (!capabilityController || !capabilityController.can('edit')) return 'blocked';
        return exitCellEdit('table-edit-enter-commit',event,true)?'handled':'pass';
      }
      if (!capabilityController || !capabilityController.can('navigate')) return 'blocked';
      var activeState=keyboard&&keyboard.virtualFocus?keyboard.virtualFocus.getState():null;
      if (!activeState) return 'pass';
      if (activeState.domain===headerDomain.name) return activateHeaderAction(event)?'handled':'pass';
      if (event.key===' '||event.key==='Spacebar') {
        var decoded=activeState.domain===cellDomain.name?decodeNavigationCellKey(activeState.key):null;
        return decoded&&(decoded.kind==='selection'||decoded.kind==='expand')&&activateCurrentCell(event)?'handled':'pass';
      }
      return activateCurrentCell(event)?'handled':'pass';
    }
    return 'pass';
  }
  function destroyKeyboardNavigation() {
    editTransaction = null; pendingCellVisibilityKey = null; navigationProjection = null;
    if (focusController) focusController.destroy();
    focusController = null; keyboard = null; cellDomain = null; headerDomain = null;
    return true;
  }
  function installKeyboardNavigation() {
    if (keyboard || !opts.keyboardNavigation) return false;
    focusController = FocusController.create({
      root: root,
      document: doc,
      disabled: opts.disabled === true,
      activeRegion: 'cells',
      navigation: {
        focusRoot: root,
        editableKeys: ['F6','Escape','Enter'],
        shouldHandle: function (ctx) {
          if (editTransaction) return ctx.target === editTransaction.target;
          return ctx.target === root;
        },
        handlers: FocusController.forwardHandlers(['F6','Escape','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown','Enter',' ','F2'], dispatchTableInteraction)
      }
    });
    keyboard = focusController.keyboard;
    var cellBinding = focusController.bindVirtualFocus({ controller:focusController.virtualFocus, hosted:false, domain:{ name:'table-cells-' + tableId, getElement:findNavigationCell, reconcile:reconcileNavigationCell, ensureVisible:ensureNavigationCellVisible } });
    cellDomain = cellBinding ? cellBinding.domain : null;
    var headerBinding = focusController.bindVirtualFocus({ controller:focusController.virtualFocus, hosted:false, domain:{ name:'table-header-' + tableId, getElement:headerActionElement, reconcile:headerReconcile, ensureVisible:function (key) { var element=headerActionElement(key); return element?ScrollVisibility.ensureVisible(root,element,{axis:'both',align:'nearest'}):false; } } });
    headerDomain = headerBinding ? headerBinding.domain : null;
    return true;
  }
  function syncKeyboardNavigation() {
    if (opts.keyboardNavigation) {
      installKeyboardNavigation();
      if (focusController) focusController.setDisabled(opts.disabled === true);
    } else if (keyboard || focusController) destroyKeyboardNavigation();
    return !!keyboard;
  }
  function setColumnGeometry(cell, column, offsets) {
    if (own(solvedColumnWidths, column.key)) {
      var solvedWidth = solvedColumnWidths[column.key] + 'px';
      cell.style.width = solvedWidth; cell.style.minWidth = solvedWidth; cell.style.maxWidth = solvedWidth;
    } else if (column.width !== undefined && column.width !== null && column.width !== '' && column.width !== 'auto') {
      var width = typeof column.width === 'number' ? column.width + 'px' : String(column.width);
      cell.style.width = width; cell.style.minWidth = width;
    }
    if (column.align) cell.classList.add('qxframe9a7c2-table-cell-align-' + column.align);
    if (column.responsive && opts.responsiveMode === 'hide') cell.classList.add('qxframe9a7c2-table-col-hide-' + column.responsive);
    if (column.fixed) {
      cell.classList.add('is-fixed-' + column.fixed);
      var offset = offsets[column.key] || 0;
      cell.style.setProperty('--qxframe9a7c2-table-fixed-' + column.fixed, offset + 'px');
      if (offsets.boundaryStart === column.key) cell.classList.add('is-last');
      if (offsets.boundaryEnd === column.key) cell.classList.add('is-first');
    }
    if (column.className) cell.classList.add.apply(cell.classList, String(column.className).split(/\s+/).filter(Boolean));
  }
  function configuredPixelWidth(column) {
    if (!column) return 120;
    if (own(solvedColumnWidths, column.key)) return solvedColumnWidths[column.key];
    if (column.width === undefined || column.width === null || column.width === '' || column.width === 'auto') return 120;
    if (typeof column.width === 'number' && Number.isFinite(column.width) && column.width > 0) return column.width;
    var match = /^([0-9]+(?:\.[0-9]+)?)px$/i.exec(String(column.width).trim());
    return match ? Number(match[1]) : 120;
  }
  function parseManagedColumnWidth(column, availableWidth) {
    if (!column || column.width === undefined || column.width === null || column.width === '' || String(column.width).toLowerCase() === 'auto') return null;
    if (typeof column.width === 'number' && Number.isFinite(column.width) && column.width > 0) return column.width;
    var raw = String(column.width).trim();
    var px = /^([0-9]+(?:\.[0-9]+)?)px$/i.exec(raw);
    if (px) return Number(px[1]);
    var percent = /^([0-9]+(?:\.[0-9]+)?)%$/.exec(raw);
    if (percent) return Math.max(0, availableWidth * Number(percent[1]) / 100);
    return NaN;
  }
  function solveManagedColumnWidths(columns, availableWidth) {
    if (opts.fixedLayout !== true || !(availableWidth > 0) || !columns.length) return null;
    var widths = Object.create(null), flexible = [], total = 0, hasFlexible = false, invalid = false;
    columns.forEach(function (column) {
      var bounds = columnWidthBounds(column);
      var configured = parseManagedColumnWidth(column, availableWidth);
      if (Number.isNaN(configured)) { invalid = true; return; }
      if (configured !== null) {
        var fixed = Math.max(bounds.min, Math.min(bounds.max, configured));
        widths[column.key] = fixed; total += fixed; return;
      }
      hasFlexible = true;
      var minimum = bounds.min;
      widths[column.key] = minimum; total += minimum;
      flexible.push({ key: column.key, weight: column.flex || 1, max: bounds.max });
    });
    if (invalid || !hasFlexible) return null;
    var remaining = Math.max(0, availableWidth - total), active = flexible.slice(), guard = 0;
    while (remaining > 0.01 && active.length && guard++ < columns.length + 2) {
      var weightTotal = active.reduce(function (sum, entry) { return sum + entry.weight; }, 0) || active.length;
      var distributed = 0, next = [];
      active.forEach(function (entry) {
        var capacity = entry.max - widths[entry.key];
        if (!(capacity > 0)) return;
        var share = remaining * (entry.weight / weightTotal);
        var add = Math.min(capacity, share);
        if (add > 0) { widths[entry.key] += add; distributed += add; }
        if (capacity - add > 0.01) next.push(entry);
      });
      if (!(distributed > 0.01)) break;
      remaining -= distributed; active = next;
    }
    var view = doc.defaultView || global, dpr = Math.max(1, Number(view && view.devicePixelRatio) || 1);
    total = 0;
    columns.forEach(function (column) {
      widths[column.key] = Math.round(widths[column.key] * dpr) / dpr;
      total += widths[column.key];
    });
    return { widths: widths, total: Math.round(total * dpr) / dpr, available: availableWidth };
  }
  function restoreTableMinWidth() {
    table.style.removeProperty('width');
    if (opts.minWidth != null) table.style.minWidth = typeof opts.minWidth === 'number' ? opts.minWidth + 'px' : String(opts.minWidth);
    else table.style.removeProperty('min-width');
  }
  function applyManagedColumnWidths(solution, columns) {
    if (!solution) {
      var hadSolution = solvedColumnWidthTotal > 0 || Object.keys(solvedColumnWidths).length > 0;
      solvedColumnWidths = Object.create(null); solvedColumnWidthTotal = 0;
      if (!hadSolution) return false;
      var byKey = Object.create(null); columns.forEach(function (column) { byKey[column.key] = column; });
      DOM.findAllPrivate(table, 'tableColumn').forEach(function (cell) {
        var column = byKey[String(DOM.getPrivate(cell, 'tableColumn'))]; if (!column) return;
        cell.style.removeProperty('max-width');
        if (column.width !== undefined && column.width !== null && column.width !== '' && column.width !== 'auto') {
          var authored = typeof column.width === 'number' ? column.width + 'px' : String(column.width);
          cell.style.width = authored; cell.style.minWidth = authored;
        } else { cell.style.removeProperty('width'); cell.style.removeProperty('min-width'); }
      });
      restoreTableMinWidth();
      return true;
    }
    solvedColumnWidths = solution.widths; solvedColumnWidthTotal = solution.total;
    DOM.findAllPrivate(table, 'tableColumn').forEach(function (cell) {
      var key = String(DOM.getPrivate(cell, 'tableColumn')); if (!own(solution.widths, key)) return;
      var width = solution.widths[key] + 'px'; cell.style.width = width; cell.style.minWidth = width; cell.style.maxWidth = width;
    });
    table.style.width = solution.total + 'px';
    var authoredMin = null;
    if (typeof opts.minWidth === 'number') authoredMin = opts.minWidth;
    else if (opts.minWidth != null) { var match = /^([0-9]+(?:\.[0-9]+)?)px$/i.exec(String(opts.minWidth).trim()); if (match) authoredMin = Number(match[1]); }
    table.style.minWidth = Math.max(solution.total, authoredMin || 0) + 'px';
    return true;
  }
  function fixedOffsets(columns) {
    var result = Object.create(null), start = 0, end = 0, i;
    var startKeys = columns.filter(function (column) { return column.fixed === 'start'; }).map(function (column) { return column.key; });
    var endKeys = columns.filter(function (column) { return column.fixed === 'end'; }).map(function (column) { return column.key; });
    result.boundaryStart = startKeys.length ? startKeys[startKeys.length - 1] : null;
    result.boundaryEnd = endKeys.length ? endKeys[0] : null;
    for (i = 0; i < columns.length; i += 1) {
      var column = columns[i];
      if (column.fixed !== 'start') continue;
      result[column.key] = start;
      start += configuredPixelWidth(column);
    }
    for (i = columns.length - 1; i >= 0; i -= 1) {
      var rightColumn = columns[i];
      if (rightColumn.fixed !== 'end') continue;
      result[rightColumn.key] = end;
      end += configuredPixelWidth(rightColumn);
    }
    return result;
  }
  function measureFixedGeometry() {
    if (destroyed || !table.isConnected) return null;
    var columns = currentColumns();
    var byKey = Object.create(null);
    columns.forEach(function (column) { byKey[column.key] = column; });
    var headers = Object.create(null);
    DOM.findAllPrivate(thead, 'tableColumn').forEach(function (cell) {
      var key = DOM.getPrivate(cell, 'tableColumn');
      if (key != null && !headers[String(key)]) headers[String(key)] = cell;
    });
    var view = doc.defaultView || global;
    function columnIsRendered(column) {
      var cell = headers[column.key];
      if (!cell) return true;
      if (view && typeof view.getComputedStyle === 'function') {
        var style = view.getComputedStyle(cell);
        if (style && (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse')) return false;
      }
      return true;
    }
    var rootRect = root.getBoundingClientRect ? root.getBoundingClientRect() : null;
    var availableWidth = Math.max(0, Number(root.clientWidth) || (rootRect && rootRect.width) || 0);
    var layoutColumns = columns.filter(columnIsRendered);
    var widthSolution = solveManagedColumnWidths(layoutColumns, availableWidth);
    function visibleWidth(column) {
      var cell = headers[column.key];
      if (!cell || !columnIsRendered(column)) return 0;
      if (widthSolution && own(widthSolution.widths, column.key)) return widthSolution.widths[column.key];
      var rect = cell.getBoundingClientRect ? cell.getBoundingClientRect() : null;
      return rect && rect.width > 0 ? rect.width : configuredPixelWidth(column);
    }
    var offsets = Object.create(null), start = 0, end = 0;
    var visibleStart = [], visibleEnd = [];
    columns.forEach(function (column) {
      if (column.fixed !== 'start') return;
      var width = visibleWidth(column);
      offsets[column.key] = start;
      if (width > 0) { visibleStart.push(column.key); start += width; }
    });
    for (var i = columns.length - 1; i >= 0; i -= 1) {
      var column = columns[i];
      if (column.fixed !== 'end') continue;
      var width = visibleWidth(column);
      offsets[column.key] = end;
      if (width > 0) { visibleEnd.unshift(column.key); end += width; }
    }
    var boundaryStart = visibleStart.length ? visibleStart[visibleStart.length - 1] : null;
    var boundaryEnd = visibleEnd.length ? visibleEnd[0] : null;
    var dpr = Math.max(1, Number(view && view.devicePixelRatio) || 1);
    var epsilon = 0.5 / dpr;
    function normalizedGeometry(value) { return Math.round((Number(value) || 0) * dpr) / dpr; }
    var normalizedOffsets = Object.create(null);
    var widthToken = widthSolution ? 'managed:' + layoutColumns.map(function (column) { return column.key + '=' + widthSolution.widths[column.key]; }).join(',') + ':total=' + widthSolution.total : 'native';
    var signatureParts = [boundaryStart || '', boundaryEnd || '', widthToken];
    columns.forEach(function (column) {
      if (!column.fixed) return;
      normalizedOffsets[column.key] = normalizedGeometry(offsets[column.key] || 0);
      signatureParts.push(column.key + ':' + column.fixed + ':' + normalizedOffsets[column.key]);
    });
    var signature = signatureParts.join('|');
    if (fixedGeometrySignature && signature === fixedGeometrySignature) return null;
    if (fixedGeometrySignature) {
      var previousParts = fixedGeometrySignature.split('|'), previousOffsets = Object.create(null);
      previousParts.slice(3).forEach(function (part) { var pieces = part.split(':'); if (pieces.length >= 3) previousOffsets[pieces[0]] = Number(pieces[2]); });
      var materiallyChanged = previousParts[2] !== widthToken || columns.some(function (column) { return column.fixed && Math.abs((previousOffsets[column.key] || 0) - (normalizedOffsets[column.key] || 0)) >= epsilon; });
      if (!materiallyChanged && previousParts[0] === (boundaryStart || '') && previousParts[1] === (boundaryEnd || '')) return null;
    }
    return { columns: columns, byKey: byKey, offsets: normalizedOffsets, boundaryStart: boundaryStart, boundaryEnd: boundaryEnd, widthSolution: widthSolution, signature: signature };
  }
  function applyFixedGeometry(measurement) {
    if (!measurement || destroyed) return false;
    fixedGeometrySignature = measurement.signature;
    applyManagedColumnWidths(measurement.widthSolution, measurement.columns);
    DOM.findAllPrivate(table, 'tableColumn').forEach(function (cell) {
      var key = String(DOM.getPrivate(cell, 'tableColumn'));
      var column = measurement.byKey[key];
      if (!column || !column.fixed) return;
      cell.style.setProperty('--qxframe9a7c2-table-fixed-' + column.fixed, String(measurement.offsets[key] || 0) + 'px');
      cell.classList.toggle('is-last', column.fixed === 'start' && key === measurement.boundaryStart);
      cell.classList.toggle('is-first', column.fixed === 'end' && key === measurement.boundaryEnd);
    });
    return true;
  }
  function requestFixedGeometry(reason) {
    if (destroyed) return false;
    if (reason === 'columns' || reason === 'column-resize' || reason === 'table-reflow') fixedGeometrySignature = '';
    if (geometryMeasureCancel) return false;
    geometryMeasureCancel = Scheduler.measure(function () {
      geometryMeasureCancel = null;
      var measurement = measureFixedGeometry();
      if (!measurement || destroyed) return;
      if (geometryMutateCancel) geometryMutateCancel();
      geometryMutateCancel = Scheduler.mutate(function () {
        geometryMutateCancel = null;
        applyFixedGeometry(measurement);
      });
    });
    return true;
  }
  function destroyColumnResizeSessions() {
    columnResizeSessions.splice(0).forEach(function (session) { try { session.destroy(); } catch (_) {} });
    activeColumnResize = null;
  }
  function columnWidthBounds(column) {
    var min = Number(column.minWidth); if (!Number.isFinite(min) || min < 0) min = 40;
    var max = Number(column.maxWidth); if (!Number.isFinite(max) || max <= 0) max = Infinity;
    if (max < min) max = min;
    return { min: min, max: max };
  }
  function clampColumnWidth(column, width) { var bounds = columnWidthBounds(column); return Math.max(bounds.min, Math.min(bounds.max, Number(width) || bounds.min)); }
  function previewColumnWidth(columnKey, width) {
    var value = Math.max(0, Number(width) || 0) + 'px';
    DOM.findAllPrivate(table, 'tableColumn').forEach(function (cell) {
      if (String(DOM.getPrivate(cell, 'tableColumn')) !== String(columnKey)) return;
      cell.style.width = value; cell.style.minWidth = value; cell.style.maxWidth = value;
    });
    requestFixedGeometry('column-resize');
  }
  function commitColumnWidth(columnKey, width, meta) {
    var key = String(columnKey), changed = false;
    var nextColumns = allColumns().map(function (column) {
      if (column.key !== key) return column;
      var nextWidth = clampColumnWidth(column, width);
      if (Number(column.width) === nextWidth) return column;
      changed = true;
      return Utils.mergeOwn(column, { width: nextWidth });
    });
    if (!changed) return true;
    opts.columns = normalizeColumns(nextColumns);
    return model.setColumns(opts.columns, Utils.assignOwn({ source: 'column-resize', reason: 'columns' }, meta || {}));
  }
  function installColumnResize(th, column) {
    if (column.resizable !== true || mutationLocked()) return;
    th.classList.add('is-resizable');
    var handle = doc.createElement('span');
    handle.className = 'qxframe9a7c2-table-resize-handle';
    handle.tabIndex = -1;
    DOM.setPrivate(handle, 'tableResize', column.key);
    th.appendChild(handle);
    var startWidth = 0, previewWidth = 0;
    var session = PointerSession.create({
      target: handle, document: doc, axis: 'x', threshold: 0,
      getState: function () { return { disabled: opts.disabled === true || column.disabled === true, readOnly: opts.readOnly === true }; },
      canStart: function () {
        var rect = th.getBoundingClientRect ? th.getBoundingClientRect() : null;
        startWidth = rect && rect.width > 0 ? rect.width : configuredPixelWidth(column);
        previewWidth = clampColumnWidth(column, startWidth);
        activeColumnResize = { key: column.key, session: session, startWidth: previewWidth };
        root.classList.add('is-column-resizing');
        return true;
      },
      onMove: function (detail) {
        if (destroyed) return;
        previewWidth = clampColumnWidth(column, startWidth + detail.deltaX);
        previewColumnWidth(column.key, previewWidth);
        if (typeof opts.onColumnResize === 'function') opts.onColumnResize(column.key, previewWidth, Object.freeze({ column: column, source: 'pointer', originalEvent: detail.originalEvent || null, instance: api }));
      },
      onEnd: function (detail) {
        root.classList.remove('is-column-resizing'); activeColumnResize = null;
        commitColumnWidth(column.key, previewWidth, { source: 'pointer', originalEvent: detail.originalEvent || null });
        if (typeof opts.onColumnResizeEnd === 'function') opts.onColumnResizeEnd(column.key, previewWidth, Object.freeze({ column: column, cancelled: false, originalEvent: detail.originalEvent || null, instance: api }));
      },
      onCancel: function (detail) {
        root.classList.remove('is-column-resizing'); activeColumnResize = null;
        previewColumnWidth(column.key, startWidth);
        if (typeof opts.onColumnResizeEnd === 'function') opts.onColumnResizeEnd(column.key, startWidth, Object.freeze({ column: column, cancelled: true, originalEvent: detail.originalEvent || null, instance: api }));
      }
    });
    columnResizeSessions.push(session);
  }
  function reorderConfig(name) { var value = opts[name]; return value && typeof value === 'object' ? value : {}; }
  function validFixedColumnOrder(columns) {
    var phase = 'start';
    for (var i = 0; i < columns.length; i += 1) {
      var fixed = columns[i].fixed || null;
      if (phase === 'start' && fixed !== 'start') phase = fixed === 'end' ? 'end' : 'middle';
      else if (phase === 'middle' && fixed === 'start') return false;
      else if (phase === 'middle' && fixed === 'end') phase = 'end';
      else if (phase === 'end' && fixed !== 'end') return false;
    }
    return true;
  }
  function reorderColumnsByKey(key, toIndex, meta) {
    var all = allColumns().slice(), visible = all.filter(function (column) { return column.visible !== false; }), sourceIndex = -1;
    for (var i = 0; i < visible.length; i += 1) if (visible[i].key === String(key)) { sourceIndex = i; break; }
    if (sourceIndex < 0) return false;
    var moving = visible[sourceIndex];
    if (moving.reorderable === false) return false;
    visible.splice(sourceIndex, 1);
    var at = Math.max(0, Math.min(visible.length, Number(toIndex) || 0));
    visible.splice(at, 0, moving);
    var visibleIndex = 0;
    var columns = all.map(function (column) { return column.visible === false ? column : visible[visibleIndex++]; });
    if (!validFixedColumnOrder(columns.filter(function (column) { return column.visible !== false; }))) return false;
    opts.columns = normalizeColumns(columns);
    var changed = model.setColumns(opts.columns, Utils.assignOwn({ source: 'column-reorder', reason: 'column-reorder' }, meta || {}));
    if (changed && typeof opts.onColumnReorder === 'function') opts.onColumnReorder(moving.key, sourceIndex, at, Object.freeze({ columns: opts.columns.slice(), instance: api }));
    return changed;
  }
  function setColumnVisible(key, visible, meta) {
    var normalized = String(key), found = false, changed = false;
    var columns = allColumns().map(function (column) {
      if (column.key !== normalized) return column;
      found = true;
      var nextVisible = visible !== false;
      if ((column.visible !== false) === nextVisible) return column;
      changed = true;
      return Utils.mergeOwn(column, { visible: nextVisible });
    });
    if (!found) return false;
    if (!changed) return true;
    opts.columns = normalizeColumns(columns);
    return model.setColumns(opts.columns, Utils.assignOwn({ source: 'api', reason: 'column-visibility' }, meta || {}));
  }
  function setColumnOrder(keys, meta) {
    if (!Array.isArray(keys)) throw new TypeError('[QXFRAME9A7C2] Table setColumnOrder() keys must be an array.');
    var columns = allColumns().slice(), byKey = Object.create(null), seen = Object.create(null), ordered = [];
    columns.forEach(function (column) { byKey[column.key] = column; });
    keys.forEach(function (raw) {
      var key = String(raw);
      if (!byKey[key]) throw new TypeError('[QXFRAME9A7C2] Table setColumnOrder() received unknown column key: ' + key + '.');
      if (seen[key]) throw new TypeError('[QXFRAME9A7C2] Table setColumnOrder() keys must be unique: ' + key + '.');
      seen[key] = true; ordered.push(byKey[key]);
    });
    columns.forEach(function (column) { if (!seen[column.key]) ordered.push(column); });
    if (!validFixedColumnOrder(ordered.filter(function (column) { return column.visible !== false; }))) return false;
    if (ordered.every(function (column, index) { return column.key === columns[index].key; })) return true;
    opts.columns = normalizeColumns(ordered);
    return model.setColumns(opts.columns, Utils.assignOwn({ source: 'api', reason: 'column-reorder' }, meta || {}));
  }
  function columnStateSnapshot() {
    return allColumns().map(function (column, index) { return Object.freeze({ key: column.key, visible: column.visible !== false, width: column.width == null ? null : column.width, flex: column.flex == null ? null : column.flex, order: index, fixed: column.fixed || null }); });
  }
  function applyColumnState(state, meta) {
    var input = Array.isArray(state) ? state : (state && Array.isArray(state.columns) ? state.columns : null);
    if (!input) throw new TypeError('[QXFRAME9A7C2] Table applyColumnState() requires a column-state array.');
    var updates = Object.create(null), order = Object.create(null);
    input.forEach(function (entry, index) {
      if (!entry || entry.key === undefined || entry.key === null || entry.key === '') return;
      var key = String(entry.key); updates[key] = entry;
      order[key] = Number.isFinite(Number(entry.order)) ? Number(entry.order) : index;
    });
    var columns = allColumns().map(function (column) {
      var entry = updates[column.key]; if (!entry) return column;
      var patch = {};
      if (own(entry, 'visible')) patch.visible = entry.visible !== false;
      if (own(entry, 'width')) {
        if (entry.width === null || entry.width === undefined || entry.width === '') patch.width = null;
        else if (typeof entry.width === 'number') patch.width = clampColumnWidth(column, entry.width);
        else patch.width = String(entry.width);
      }
      if (own(entry, 'flex')) {
        if (entry.flex === null || entry.flex === undefined || entry.flex === '') patch.flex = null;
        else { var flex = Number(entry.flex); if (!Number.isFinite(flex) || flex <= 0) throw new TypeError('[QXFRAME9A7C2] Table column state flex must be a positive finite number.'); patch.flex = flex; }
      }
      if (own(entry, 'fixed')) patch.fixed = normalizeFixed(entry.fixed);
      return Utils.mergeOwn(column, patch);
    });
    columns.sort(function (a, b) {
      var ao = own(order, a.key) ? order[a.key] : Number.MAX_SAFE_INTEGER;
      var bo = own(order, b.key) ? order[b.key] : Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return allColumns().findIndex(function (column) { return column.key === a.key; }) - allColumns().findIndex(function (column) { return column.key === b.key; });
    });
    if (!validFixedColumnOrder(columns.filter(function (column) { return column.visible !== false; }))) throw new TypeError('[QXFRAME9A7C2] Table column state violates fixed start/middle/end ordering.');
    opts.columns = normalizeColumns(columns);
    return model.setColumns(opts.columns, Utils.assignOwn({ source: 'api', reason: 'column-state' }, meta || {}));
  }
  function resetColumnState(meta) {
    opts.columns = normalizeColumns(initialColumns);
    return model.setColumns(opts.columns, Utils.assignOwn({ source: 'api', reason: 'column-state-reset' }, meta || {}));
  }
  function canRowReorder() {
    if (!opts.rowReorder || isRemote() || mutationLocked()) return false;
    var state = currentState();
    return !state.sortKey && !state.searchValue && Object.keys(state.filters || {}).length === 0;
  }
  function reorderRowsByKey(key, toIndex, meta) {
    if (!canRowReorder()) return false;
    var entries = projectedEntries();
    var sourceKey = String(key), remainingVisible = entries.filter(function (entry) { return entry.key !== sourceKey; });
    var items = model.items, sourceEntry = model.getEntry(sourceKey), sourceIndex = sourceEntry ? sourceEntry.sourceIndex : -1;
    if (sourceIndex < 0) return false;
    var moving = items[sourceIndex];
    var targetEntry = remainingVisible[Math.max(0, Math.min(remainingVisible.length, Number(toIndex) || 0))] || null;
    items.splice(sourceIndex, 1);
    var insertAt;
    if (targetEntry) {
      var target = model.getEntry(targetEntry.key);
      insertAt = target ? target.sourceIndex : items.length;
      if (sourceIndex < insertAt) insertAt -= 1;
    } else if (remainingVisible.length) {
      var last = model.getEntry(remainingVisible[remainingVisible.length - 1].key);
      insertAt = last ? last.sourceIndex + (sourceIndex < last.sourceIndex ? 0 : 1) : items.length;
    } else insertAt = Math.min(items.length, sourceIndex);
    insertAt = Math.max(0, Math.min(items.length, insertAt));
    items.splice(insertAt, 0, moving);
    opts.items = items;
    var changed = model.setItems(items, Utils.assignOwn({ source: 'row-reorder', reason: 'items' }, meta || {}));
    if (changed && typeof opts.onRowReorder === 'function') opts.onRowReorder(sourceKey, sourceIndex, insertAt, Object.freeze({ items: items.slice(), instance: api }));
    return changed;
  }
  function syncReorderInteractions() {
    if (opts.columnReorder && !columnReorderInteraction) {
      columnReorderInteraction = ReorderInteraction.create({
        root: thead, document: doc, rowSelector: '.qxframe9a7c2-table-column-draggable', orientation: 'horizontal', handleSelector: '.qxframe9a7c2-table-column-reorder-handle',
        disabled: function () { return mutationLocked(); },
        getItems: function () { return currentColumns().map(function (column) { return { key: column.key, disabled: column.disabled === true || column.reorderable === false }; }); },
        getRowElement: function (key) { return DOM.findPrivate(thead, 'tableColumn', String(key)); },
        getKeyFromRow: function (row) { return DOM.getPrivate(row, 'tableColumn'); },
        getDataVersion: function () { return currentColumns().map(function (column) { return column.key; }).join('\u0000'); },
        canDrop: function (detail) {
          var columns = currentColumns().slice(), from = columns.findIndex(function (column) { return column.key === detail.sourceKey; });
          if (from < 0) return false; var moving = columns.splice(from, 1)[0]; columns.splice(Math.max(0, Math.min(columns.length, detail.toIndex)), 0, moving); return validFixedColumnOrder(columns);
        },
        onMove: function (detail) { return reorderColumnsByKey(detail.sourceKey, detail.toIndex, { originalEvent: detail.originalEvent }); },
        onDragStart: function () { root.classList.add('is-column-reordering'); },
        onDragEnd: function () { root.classList.remove('is-column-reordering'); },
        onDragCancel: function () { root.classList.remove('is-column-reordering'); },
        getInstance: function () { return api; }
      });
    } else if (!opts.columnReorder && columnReorderInteraction) { columnReorderInteraction.destroy(); columnReorderInteraction = null; }
    if (opts.rowReorder && !rowReorderInteraction) {
      var rowConfig = reorderConfig('rowReorder');
      rowReorderInteraction = ReorderInteraction.create({
        root: tbody, document: doc, rowSelector: '.qxframe9a7c2-table-row-draggable', orientation: 'vertical', handleSelector: rowConfig.handleSelector || null,
        disabled: function () { return !canRowReorder(); },
        getItems: function () { return projectedEntries().map(function (entry) { return { key: entry.key, disabled: isEntryDisabled(entry) }; }); },
        getRowElement: function (key) { return DOM.findPrivate(tbody, 'tableRow', String(key)); },
        getKeyFromRow: function (row) { return DOM.getPrivate(row, 'tableRow'); },
        getDataVersion: function () { return model.getProjectionVersion(); },
        canStart: function () { return canRowReorder(); },
        onMove: function (detail) { return reorderRowsByKey(detail.sourceKey, detail.toIndex, { originalEvent: detail.originalEvent }); },
        onDragStart: function () { root.classList.add('is-row-reordering'); },
        onDragEnd: function () { root.classList.remove('is-row-reordering'); },
        onDragCancel: function () { root.classList.remove('is-row-reordering'); },
        getInstance: function () { return api; }
      });
    } else if (!opts.rowReorder && rowReorderInteraction) { rowReorderInteraction.destroy(); rowReorderInteraction = null; }
  }
  function destroyReorderInteractions() {
    if (columnReorderInteraction) columnReorderInteraction.destroy();
    if (rowReorderInteraction) rowReorderInteraction.destroy();
    columnReorderInteraction = null; rowReorderInteraction = null;
  }
  function setOptionalNode(node, parent, present, before) {
    if (!present) { if (node.parentNode) node.parentNode.removeChild(node); return false; }
    if (node.parentNode !== parent || (before && node.nextSibling !== before)) parent.insertBefore(node, before || null);
    return true;
  }
  function hasRenderedOutput(node) { return node.childNodes.length > 0; }
  function resolveChromeValue(value) { return typeof value === 'function' ? value(currentState(), api) : value; }
  function syncChromeOrder() {
    if (title.parentNode === root) root.insertBefore(title, table);
    if (toolbar.parentNode === root) root.insertBefore(toolbar, table);
    [footer, pager, errorPanel, loading].forEach(function (node) { if (node.parentNode === root) root.appendChild(node); });
  }
  function renderTitleFooterCaption() {
    var titleValue = opts.title !== undefined && opts.title !== null && opts.title !== false ? resolveChromeValue(opts.title) : null;
    var captionValue = opts.caption !== undefined && opts.caption !== null && opts.caption !== false ? resolveChromeValue(opts.caption) : null;
    var toolbarValue = opts.toolbar !== undefined && opts.toolbar !== null && opts.toolbar !== false ? resolveChromeValue(opts.toolbar) : null;
    var toolbarStartValue = opts.toolbarStart !== undefined && opts.toolbarStart !== null && opts.toolbarStart !== false ? resolveChromeValue(opts.toolbarStart) : null;
    var toolbarEndValue = opts.toolbarEnd !== undefined && opts.toolbarEnd !== null && opts.toolbarEnd !== false ? resolveChromeValue(opts.toolbarEnd) : null;
    var footerValue = opts.footer !== undefined && opts.footer !== null && opts.footer !== false ? resolveChromeValue(opts.footer) : null;
    var footerStartValue = opts.footerStart !== undefined && opts.footerStart !== null && opts.footerStart !== false ? resolveChromeValue(opts.footerStart) : null;
    var footerEndValue = opts.footerEnd !== undefined && opts.footerEnd !== null && opts.footerEnd !== false ? resolveChromeValue(opts.footerEnd) : null;
    renderOutput(title, titleValue, doc); renderOutput(caption, captionValue, doc);
    renderOutput(toolbarStart, toolbarValue != null ? toolbarValue : toolbarStartValue, doc); renderOutput(toolbarEnd, toolbarValue != null ? null : toolbarEndValue, doc);
    if (footerValue != null) { renderOutput(footerStart, footerValue, doc); renderOutput(footerEnd, null, doc); }
    else { renderOutput(footerStart, footerStartValue, doc); renderOutput(footerEnd, footerEndValue, doc); }
    setOptionalNode(title, root, hasRenderedOutput(title), table);
    setOptionalNode(toolbar, root, hasRenderedOutput(toolbarStart) || hasRenderedOutput(toolbarEnd), table);
    setOptionalNode(footer, root, hasRenderedOutput(footerStart) || hasRenderedOutput(footerEnd), null);
    setOptionalNode(caption, table, hasRenderedOutput(caption), thead);
    syncChromeOrder();
  }
  function filterPortal() {
    if (opts.portalContainer && opts.portalContainer.nodeType === 1) return opts.portalContainer;
    if (typeof opts.portalContainer === 'string') return DOM.resolveElement(opts.portalContainer, doc) || doc.body;
    return doc.body;
  }
  function destroyFilterPopup(reason) {
    if (filterKeydownCleanup) { filterKeydownCleanup(); filterKeydownCleanup = null; }
    if (filterInteractionLease) { filterInteractionLease.release(); filterInteractionLease = null; }
    if (filterTrigger) filterTrigger.destroy(reason || 'table-filter-popup-destroy');
    filterTrigger = null;
    if (filterPopup) { Renderer.dispose(filterPopup); DOM.removeNode(filterPopup); }
    filterPopup = null; filterColumnKey = null; filterDraftValues = []; filterSearchValue = '';
  }
  function filterOptionValue(option) { return option && typeof option === 'object' ? option.value : option; }
  function filterOptionLabel(option) { return option && typeof option === 'object' && option.label !== undefined ? option.label : (option && typeof option === 'object' && option.text !== undefined ? option.text : filterOptionValue(option)); }
  function filterOptionChildren(option) { return option && typeof option === 'object' && Array.isArray(option.children) ? option.children : []; }
  function filterOptionMatches(column, option, query) {
    if (!query) return true;
    if (typeof column.filterSearch === 'function') return column.filterSearch(query, option) === true;
    return String(filterOptionLabel(option) == null ? '' : filterOptionLabel(option)).toLowerCase().indexOf(String(query).toLowerCase()) >= 0;
  }
  function filterOpenControlled(column) { return column && own(column, 'filterDropdownOpen'); }
  function emitFilterOpenRequest(column, opened, reason, event) {
    if (typeof column.onFilterDropdownOpenChange === 'function') column.onFilterDropdownOpenChange(opened, Object.freeze({ column: column, reason: reason || 'filter-open', originalEvent: event || null, instance: api }));
  }
  function sameFilterValue(left, right) { return String(left) === String(right); }
  function openFilterPopup(reference, column, event) {
    destroyFilterPopup('table-filter-popup-replace');
    filterColumnKey = column.key;
    filterDraftValues = filterValuesFor(column).slice();
    filterPopup = doc.createElement('div');
    filterPopup.className = 'qxframe9a7c2-table-filter-popup qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset';
    filterPopup.hidden = true;
    if (opts.keyboardNavigation && interactionController) {
      filterInteractionLease = interactionController.registerScope({
        id:'table-filter', parentId:'table', root:filterPopup, document:doc, profile:{ allowEditableKeys:['F6'] },
        resolveAction:function(filterEvent){ return filterEvent&&filterEvent.key==='F6'?'CYCLE_REGION':null; },
        onAction:function(action,context){
          if(action!=='CYCLE_REGION'||!capabilityController||!capabilityController.can('navigate'))return action==='CYCLE_REGION'?'blocked':'pass';
          var filterEvent=context.originalEvent, backward=filterEvent&&filterEvent.shiftKey===true;
          if(filterTrigger)filterTrigger.close('table-filter-f6',filterEvent);
          DOM.focusElement(root,{preventScroll:true});
          cycleNavigationRegion(backward,filterEvent);
          return 'handled';
        }
      });
      filterKeydownCleanup = DOM.listen(filterPopup,'keydown',function(filterEvent){ if(!filterEvent.defaultPrevented) interactionController.dispatch(filterEvent,{ownerId:'table-filter'}); });
    }
    function setSelectedValues(values) { filterDraftValues = Array.isArray(values) ? values.slice() : (values === null || values === undefined || values === '' ? [] : [values]); return filterDraftValues.slice(); }
    function confirm(meta) {
      if (destroyed) return false;
      var values = filterDraftValues.slice();
      var closeDropdown = !meta || meta.closeDropdown !== false;
      var closeReason = meta && meta.reason || 'filter-confirm';
      var closeEvent = meta && meta.originalEvent || null;
      if (closeDropdown && filterTrigger && filterTrigger.getState().open) {
        var closed = filterTrigger.close(closeReason, closeEvent);
        if (!closed && filterTrigger.getState().open) closeDropdown = false;
      }
      var changed = model.setFilter(column.key, values, { source: meta && meta.source || 'filter-popup', reason: closeReason, originalEvent: closeEvent, restoreFilterFocusKey: closeDropdown ? column.key : null });
      if (!changed && closeDropdown) destroyFilterPopup('table-filter-confirm');
      return changed;
    }
    function clearFilters(meta) {
      setSelectedValues([]);
      if (!meta || meta.confirm !== false) return confirm({ source: meta && meta.source || 'filter-popup', reason: 'filter-clear', originalEvent: meta && meta.originalEvent || null, closeDropdown: !meta || meta.closeDropdown !== false });
      renderFilterContent();
      return true;
    }
    function close() { if (filterTrigger) return filterTrigger.close('filter-close'); return false; }
    function renderDefault() {
      if (column.filterSearch) {
        var searchWrap = doc.createElement('div'); searchWrap.className = 'qxframe9a7c2-table-filter-search';
        var searchInput = doc.createElement('input'); searchInput.type = 'search'; searchInput.className = 'qxframe9a7c2-input-control'; DOM.configureTextInput(searchInput, 'search'); searchInput.value = filterSearchValue; searchInput.placeholder = column.filterSearchPlaceholder || 'Search filters';
        scope.add(DOM.listen(searchInput, 'input', function () { filterSearchValue = searchInput.value; renderFilterContent(); var next = filterPopup.querySelector('.qxframe9a7c2-table-filter-search input'); if (next) { DOM.focusElement(next, { preventScroll: true }); next.setSelectionRange(filterSearchValue.length, filterSearchValue.length); } }));
        searchWrap.appendChild(searchInput); filterPopup.appendChild(searchWrap);
      }
      var list = doc.createElement('div'); list.className = 'qxframe9a7c2-table-filter-options' + (column.filterMode === 'tree' ? ' is-tree' : '');
      var multiple = column.filterMultiple !== false;
      function renderOptions(options, depth) {
        (options || []).forEach(function (option, index) {
          var children = filterOptionChildren(option);
          var selfMatch = filterOptionMatches(column, option, filterSearchValue);
          var childMatch = children.some(function walk(child) { return filterOptionMatches(column, child, filterSearchValue) || filterOptionChildren(child).some(walk); });
          if (!selfMatch && !childMatch) return;
          var value = filterOptionValue(option), label = filterOptionLabel(option);
          var row = doc.createElement('label'); row.className = 'qxframe9a7c2-table-filter-option'; row.style.setProperty('--qxframe9a7c2-table-filter-depth', String(depth));
          if (children.length) row.classList.add('has-children');
          if (value !== undefined && value !== null && value !== '') {
            var input = doc.createElement('input'); input.type = multiple ? 'checkbox' : 'radio'; input.name = multiple ? '' : 'qxframe9a7c2-table-filter-' + tableId + '-' + column.key; input.value = String(value);
            input.checked = filterDraftValues.some(function (current) { return sameFilterValue(current, value); });
            input.disabled = option && typeof option === 'object' && option.disabled === true;
            scope.add(DOM.listen(input, 'change', function () {
              if (multiple) {
                if (input.checked && !filterDraftValues.some(function (current) { return sameFilterValue(current, value); })) filterDraftValues.push(value);
                if (!input.checked) filterDraftValues = filterDraftValues.filter(function (current) { return !sameFilterValue(current, value); });
              } else filterDraftValues = input.checked ? [value] : [];
            }));
            row.appendChild(input);
          } else {
            var spacer = doc.createElement('span'); spacer.className = 'qxframe9a7c2-table-filter-option-spacer'; row.appendChild(spacer);
          }
          var text = doc.createElement('span'); text.textContent = label == null ? String(index + 1) : String(label); row.appendChild(text); list.appendChild(row);
          if (children.length) renderOptions(children, depth + 1);
        });
      }
      renderOptions(column.filterOptions || [], 0);
      filterPopup.appendChild(list);
      var actions = doc.createElement('div'); actions.className = 'qxframe9a7c2-table-filter-actions';
      var reset = doc.createElement('button'); reset.type='button'; reset.className='qxframe9a7c2-button is-default is-filled'; reset.textContent=column.filterResetText||'Reset'; scope.add(DOM.listen(reset,'click',function(e){clearFilters({source:DOM.activationSource(e),originalEvent:e});}));
      var apply = doc.createElement('button'); apply.type='button'; apply.className='qxframe9a7c2-button is-primary is-solid'; apply.textContent=column.filterConfirmText||'Apply'; scope.add(DOM.listen(apply,'click',function(e){confirm({source:DOM.activationSource(e),originalEvent:e});}));
      actions.appendChild(reset); actions.appendChild(apply); filterPopup.appendChild(actions);
    }
    function renderFilterContent() {
      filterPopup.textContent = '';
      if (column.filterDropdown) {
        var context = Object.freeze({ column: column, selectedValues: filterDraftValues.slice(), setSelectedValues: setSelectedValues, confirm: confirm, clearFilters: clearFilters, close: close, instance: api });
        var output = typeof column.filterDropdown === 'function' ? column.filterDropdown(context) : column.filterDropdown;
        Renderer.append(filterPopup, output, doc);
      } else renderDefault();
    }
    renderFilterContent();
    var portal = filterPortal();
    portal.appendChild(filterPopup);
    filterTrigger = Trigger.create({ reference: reference, triggerTarget: reference, floating: filterPopup, portalContainer: portal, document: doc, trigger: 'manual', placement: column.filterPlacement || 'bottom-end', closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: true, tabExitTarget: opts.keyboardNavigation ? root : reference, closeOnEscape: true, restoreFocusOnDismiss: true, restoreFocusTarget: opts.keyboardNavigation ? root : reference, restoreFocusOnClose: function (detail) { var reason = String(detail && detail.reason || ''); return reason === 'filter-confirm' || reason === 'filter-clear' || reason === 'filter-close' || reason === 'api-close'; }, destroyOnClose: false, transition: null, beforeClose: function (detail) { if (filterOpenControlled(column) && column.filterDropdownOpen === true) { emitFilterOpenRequest(column, false, detail && detail.reason || 'filter-close-request', detail && detail.originalEvent || null); return false; } return true; }, onOpenChange: function (opened, detail) { if (!filterOpenControlled(column)) emitFilterOpenRequest(column, opened, detail && detail.reason || 'filter-open-change', detail && detail.originalEvent || null); } });
    filterTrigger.open('filter', event || null);
    return true;
  }
    
  function renderHead() {
    destroyColumnResizeSessions();
    destroyReorderInteractions();
    Renderer.dispose(thead);
    while (thead.firstChild) thead.removeChild(thead.firstChild);
    var columns = currentColumns();
    var offsets = fixedOffsets(columns);
    var state = currentState();
    var row = doc.createElement('tr');
    if (state.selectionMode !== 'none') {
      var selectCell = doc.createElement('th');
      selectCell.className = 'qxframe9a7c2-table-cell-check';
      if (state.selectionMode === 'multiple') {
        var selectAll = doc.createElement('input');
        selectAll.type = 'checkbox';
        selectAll.className = 'qxframe9a7c2-form-check-input';
        DOM.setPrivate(selectAll, 'tableSelectAll', 'true');
        var entries = projectedEntries().filter(function (entry) { return !(opts.isItemDisabled && opts.isItemDisabled(entry.item, entry.sourceIndex, api) === true) && !(entry.item && entry.item.disabled === true); });
        var count = entries.filter(function (entry) { return isKeySelected(entry.key, state); }).length;
        selectAll.checked = entries.length > 0 && count === entries.length;
        selectAll.indeterminate = count > 0 && count < entries.length;
        selectAll.disabled = mutationLocked() || !entries.length;
        if (opts.keyboardNavigation) selectAll.tabIndex = -1;
        var selectAllWrap = doc.createElement('label');
        selectAllWrap.className = 'qxframe9a7c2-form-check is-' + opts.size + ' qxframe9a7c2-table-selection-choice';
        selectAllWrap.appendChild(selectAll);
        selectCell.appendChild(selectAllWrap);
      }
      row.appendChild(selectCell);
    }
    if (typeof opts.renderExpanded === 'function') {
      var expandHead = doc.createElement('th');
      expandHead.className = 'qxframe9a7c2-table-cell-check';
      row.appendChild(expandHead);
    }
    columns.forEach(function (column) {
      var th = doc.createElement('th');
      var header = doc.createElement('span');
      header.className = 'qxframe9a7c2-table-header-content qxframe9a7c2-table-cell-' + column.overflow;
      setColumnGeometry(th, column, offsets);
      DOM.setPrivate(th, 'tableColumn', column.key);
      var headerSource = own(column, 'header') ? column.header : column.title;
      var headerFallback = column.label == null || column.label === '' ? column.key : column.label;
      renderOutput(header, typeof headerSource === 'function' ? headerSource({ column: column, state: state, instance: api }) : (headerSource === undefined ? headerFallback : headerSource), doc);
      if (column.sortable) {
        var sorter = doc.createElement('button');
        var indicator = doc.createElement('span');
        sorter.type = 'button';
        sorter.className = 'qxframe9a7c2-table-sorter';
        DOM.setPrivate(sorter, 'tableSort', column.key);
        sorter.disabled = viewBlocked() || column.disabled === true;
        if (opts.keyboardNavigation) sorter.tabIndex = -1;
        if (state.sortKey === column.key && state.sortOrder === 'ascend') sorter.classList.add('is-asc');
        if (state.sortKey === column.key && state.sortOrder === 'descend') sorter.classList.add('is-desc');
        indicator.className = 'qxframe9a7c2-table-sort-indicator';
        var sortUp = doc.createElement('span'), sortDown = doc.createElement('span');
        sortUp.className = 'qxframe9a7c2-table-sort-caret is-up';
        sortDown.className = 'qxframe9a7c2-table-sort-caret is-down';
        indicator.appendChild(sortUp); indicator.appendChild(sortDown);
        sorter.appendChild(header); sorter.appendChild(indicator); th.appendChild(sorter);
      } else th.appendChild(header);
      if ((Array.isArray(column.filterOptions) && column.filterOptions.length) || column.filterDropdown) {
        var filter = doc.createElement('button');
        var active = filterValuesFor(column);
        filter.type = 'button';
        filter.className = 'qxframe9a7c2-table-filter' + (active.length ? ' is-active' : '');
        DOM.setPrivate(filter, 'tableFilter', column.key);
        filter.disabled = viewBlocked() || column.disabled === true;
        if (opts.keyboardNavigation) filter.tabIndex = -1;
        var filterGlyph = column.filterIcon !== undefined && column.filterIcon !== null ? (typeof column.filterIcon === 'function' ? column.filterIcon(active.length > 0, Object.freeze({ column: column, instance: api })) : column.filterIcon) : null;
        if (filterGlyph === null || filterGlyph === undefined) { var defaultFilterGlyph = doc.createElement('span'); defaultFilterGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-filter is-line is-round is-stroke-3'; filter.appendChild(defaultFilterGlyph); }
        else Renderer.append(filter, filterGlyph, doc);
        th.appendChild(filter);
      }
      if (opts.columnReorder && column.reorderable !== false) {
        th.classList.add('qxframe9a7c2-table-column-draggable'); th.draggable = !mutationLocked() && column.disabled !== true;
        var reorderHandle = doc.createElement('span'); reorderHandle.className = 'qxframe9a7c2-table-sort-handle qxframe9a7c2-table-column-reorder-handle';
        var reorderGlyph = doc.createElement('span'); reorderGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-drag-vertical is-line is-round is-stroke-3 is-sm';
        reorderHandle.appendChild(reorderGlyph); th.insertBefore(reorderHandle, th.firstChild);
      }
      installColumnResize(th, column);
      row.appendChild(th);
    });
    thead.appendChild(row);
    for (var controlledIndex = 0; controlledIndex < columns.length; controlledIndex += 1) {
      var controlledColumn = columns[controlledIndex];
      if (controlledColumn.filterDropdownOpen === true && ((Array.isArray(controlledColumn.filterOptions) && controlledColumn.filterOptions.length) || controlledColumn.filterDropdown)) {
        var controlledReference = DOM.findPrivate(thead, 'tableFilter', controlledColumn.key);
        if (controlledReference) openFilterPopup(controlledReference, controlledColumn, null);
        break;
      }
    }
  }
  function disposeRenderedSubtree(node) {
    if (!node) return false;
    return Renderer.dispose(node);
  }
  function removeRenderedNode(node) {
    if (!node) return false;
    disposeRenderedSubtree(node);
    DOM.removeNode(node);
    return true;
  }
  function syncRowShell(target, source) {
    if (!target || !source || target === source) return target;
    disposeRenderedSubtree(target);
    Array.prototype.slice.call(target.attributes || []).forEach(function (attribute) { target.removeAttribute(attribute.name); });
    Array.prototype.slice.call(source.attributes || []).forEach(function (attribute) { DOM.setSafeAttribute(target, attribute.name, attribute.value); });
    while (target.firstChild) target.removeChild(target.firstChild);
    while (source.firstChild) target.appendChild(source.firstChild);
    return target;
  }
  function syncExistingRowState(row, entry) {
    if (!row) return false;
    var state = currentState();
    var disabled = isEntryDisabled(entry);
    row.classList.toggle('is-selected', isKeySelected(entry.key, state));
    row.classList.toggle('is-disabled', disabled);
    var select = DOM.findPrivate(row, 'tableSelect', entry.key);
    if (select) { select.checked = isKeySelected(entry.key, state); select.disabled = mutationLocked() || disabled; }
    var expand = DOM.findPrivate(row, 'tableExpand', entry.key);
    if (expand) {
      var expanded = state.expandedKeys.indexOf(entry.key) >= 0;
      expand.disabled = viewBlocked() || disabled;
      var glyph = expand.firstElementChild;
      if (glyph) glyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + (expanded ? 'minus' : 'plus') + ' is-line is-round is-stroke-3';
    }
    return true;
  }
  function editingRowKey() { var decoded = editTransaction ? decodeNavigationCellKey(editTransaction.key) : null; return decoded ? decoded.rowKey : null; }
  function contentRenderRequired(reason) { return ['init','items','row-update','row-insert','row-remove','columns','options','edit-reconcile'].indexOf(String(reason || '')) >= 0; }
  function renderDataRow(entry, rowIndex, visibleIndex, columns, offsets) {
    var state = currentState();
    var row = doc.createElement('tr');
    tableDiagnostics.rowRenders += 1;
    var context = rowContext(entry, rowIndex, visibleIndex);
    var disabled = opts.disabled === true || (opts.isItemDisabled && opts.isItemDisabled(entry.item, entry.sourceIndex, api) === true) || (entry.item && entry.item.disabled === true);
    DOM.setPrivate(row, 'tableRow', entry.key);
    if (opts.rowReorder) { row.classList.add('qxframe9a7c2-table-row-draggable'); row.draggable = canRowReorder() && !disabled; }
    if (isKeySelected(entry.key, state)) row.classList.add('is-selected');
    if (disabled) row.classList.add('is-disabled');
    if (entry.item && entry.item.status) row.classList.add('is-' + String(entry.item.status));
    if (typeof opts.onRowClick === 'function') row.classList.add('is-clickable');
    if (typeof opts.rowClassName === 'function') {
      var rowClass = opts.rowClassName(entry.item, context);
      if (rowClass) row.classList.add.apply(row.classList, String(rowClass).split(/\s+/).filter(Boolean));
    } else if (opts.rowClassName) row.classList.add.apply(row.classList, String(opts.rowClassName).split(/\s+/).filter(Boolean));
    if (typeof opts.onRow === 'function') {
      var rowProps = opts.onRow(entry.item, context) || {};
      if (rowProps.className) row.classList.add.apply(row.classList, String(rowProps.className).split(/\s+/).filter(Boolean));
      applyAttributes(row, rowProps.attributes || rowProps);
    }
    if (state.selectionMode !== 'none') {
      var selectionCell = doc.createElement('td');
      var input = doc.createElement('input');
      input.type = state.selectionMode === 'multiple' ? 'checkbox' : 'radio';
      input.className = 'qxframe9a7c2-form-check-input';
      input.name = state.selectionMode === 'single' ? 'qxframe9a7c2-table-selection-' + (root.id || 'default') : '';
      DOM.setPrivate(input, 'tableSelect', entry.key);
      input.checked = isKeySelected(entry.key, state);
      input.disabled = mutationLocked() || disabled;
      selectionCell.className = 'qxframe9a7c2-table-cell-check';
      DOM.setPrivate(selectionCell, 'tableNavigationCell', navigationCellKey(entry.key, { kind: 'selection', key: '' }));
      if (opts.keyboardNavigation) input.tabIndex = -1;
      var selectionWrap = doc.createElement('label');
      selectionWrap.className = 'qxframe9a7c2-form-check is-' + opts.size + ' qxframe9a7c2-table-selection-choice';
      selectionWrap.appendChild(input);
      selectionCell.appendChild(selectionWrap); row.appendChild(selectionCell);
    }
    if (typeof opts.renderExpanded === 'function') {
      var expandCell = doc.createElement('td');
      var canExpand = typeof opts.rowExpandable === 'function' ? opts.rowExpandable(entry.item, context) !== false : true;
      expandCell.className = 'qxframe9a7c2-table-cell-check';
      DOM.setPrivate(expandCell, 'tableNavigationCell', navigationCellKey(entry.key, { kind: 'expand', key: '' }));
      if (canExpand) {
        var expand = doc.createElement('button');
        var expanded = state.expandedKeys.indexOf(entry.key) >= 0;
        expand.type = 'button';
        expand.className = 'qxframe9a7c2-table-expand-trigger';
        DOM.setPrivate(expand, 'tableExpand', entry.key);
        expand.disabled = viewBlocked() || disabled;
        if (opts.keyboardNavigation) expand.tabIndex = -1;
        var expandGlyph = doc.createElement('span');
        expandGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + (expanded ? 'minus' : 'plus') + ' is-line is-round is-stroke-3';
        expand.appendChild(expandGlyph);
        expandCell.appendChild(expand);
      }
      row.appendChild(expandCell);
    }
    columns.forEach(function (column) {
      var td = doc.createElement('td');
      var cellContext = columnContext(entry, column, rowIndex, visibleIndex);
      var value = columnValue(entry, column);
      setColumnGeometry(td, column, offsets);
      DOM.setPrivate(td, 'tableColumn', column.key);
      DOM.setPrivate(td, 'tableNavigationCell', navigationCellKey(entry.key, { kind: 'data', key: column.key }));
      if (columnEditable({ entry: entry, column: column, context: cellContext, cell: td })) td.classList.add('qxframe9a7c2-table-cell-editable');
      var cellContent = doc.createElement('div');
      cellContent.className = 'qxframe9a7c2-table-cell-content qxframe9a7c2-table-cell-' + column.overflow;
      if (typeof column.onCell === 'function') {
        var cellProps = column.onCell(entry.item, cellContext) || {};
        if (cellProps.className) cellContent.classList.add.apply(cellContent.classList, String(cellProps.className).split(/\s+/).filter(Boolean));
        if (cellProps.style && typeof cellProps.style === 'object') Object.keys(cellProps.style).forEach(function (property) { var styleValue = cellProps.style[property]; if (styleValue === undefined || styleValue === null) cellContent.style.removeProperty(property); else cellContent.style.setProperty(property, String(styleValue)); });
        applyAttributes(td, cellProps.attributes || cellProps);
      }
      tableDiagnostics.cellRenders += 1;
      renderOutput(cellContent, typeof column.render === 'function' ? column.render(value, entry.item, cellContext) : (value == null ? '' : value), doc);
      td.appendChild(cellContent);
      row.appendChild(td);
    });
    return row;
  }
  function renderExpandedRow(entry, rowIndex, visibleIndex, columnCount) {
    var state = currentState();
    var expanded = state.expandedKeys.indexOf(entry.key) >= 0;
    if (typeof opts.renderExpanded !== 'function' || (!expanded && opts.forceRenderExpanded !== true)) return null;
    var row = doc.createElement('tr');
    var cell = doc.createElement('td');
    var content = doc.createElement('div');
    row.className = 'qxframe9a7c2-table-expanded-row';
    row.hidden = !expanded;
    DOM.setPrivate(row, 'tableExpandedRow', entry.key);
    cell.colSpan = columnCount;
    content.className = 'qxframe9a7c2-table-expanded-content';
    renderOutput(content, opts.renderExpanded(entry.item, rowContext(entry, rowIndex, visibleIndex)), doc);
    cell.appendChild(content); row.appendChild(cell);
    return row;
  }
  function renderBody(reason) {
    var entries = projectedEntries();
    var columns = currentColumns();
    var offsets = fixedOffsets(columns);
    var state = currentState();
    var extraColumns = (state.selectionMode !== 'none' ? 1 : 0) + (typeof opts.renderExpanded === 'function' ? 1 : 0);
    var totalColumns = columns.length + extraColumns;
    var desiredNodes = [];
    var desiredKeys = new Set();
    var activeEditRow = editingRowKey();
    var forceContent = contentRenderRequired(reason);
    if (!entries.length) {
      bodyRowRecords.clear();
      var emptyRow = DOM.findPrivate(tbody, 'tableEmpty', 'true');
      if (!emptyRow) {
        emptyRow = doc.createElement('tr');
        DOM.setPrivate(emptyRow, 'tableEmpty', 'true');
        emptyRow.className = 'qxframe9a7c2-table-empty';
        emptyRow.appendChild(doc.createElement('td'));
      }
      var emptyCell = emptyRow.firstElementChild;
      emptyCell.colSpan = Math.max(1, totalColumns);
      EmptyProjection.render(emptyCell, { variant: 'default', description: typeof opts.emptyText === 'function' ? opts.emptyText(state, api) : opts.emptyText, document: doc });
      desiredNodes.push(emptyRow);
      Array.prototype.slice.call(tbody.children).forEach(function (node) { if (node !== emptyRow) removeRenderedNode(node); });
      if (emptyRow.parentNode !== tbody || tbody.lastChild !== emptyRow) tbody.appendChild(emptyRow);
      requestFixedGeometry('table-empty');
      return;
    }
    var useVirtual = !!(virtualizer && virtualizer.enabled);
    var variableVirtual = useVirtual && virtualizer.itemSize === 0;
    var start = 0, end = entries.length - 1;
    if (useVirtual) {
      var range = virtualizer.getRange();
      start = Math.max(0, range.start); end = Math.min(entries.length - 1, range.end);
      if (start > 0) {
        var topRow = doc.createElement('tr'), topCell = doc.createElement('td');
        topRow.className = 'qxframe9a7c2-table-virtual-spacer'; topCell.colSpan = Math.max(1, totalColumns);
        topCell.style.height = virtualizer.getItemOffset(start) + 'px'; topRow.appendChild(topCell); desiredNodes.push(topRow);
      }
    }
    var measureRows = [];
    for (var i = start; i <= end; i += 1) {
      var entry = entries[i];
      desiredKeys.add(entry.key);
      var record = bodyRowRecords.get(entry.key);
      var dataRow = record && record.row;
      var itemChanged = !record || record.item !== entry.item || record.sourceIndex !== entry.sourceIndex;
      var preserveEditingDOM = activeEditRow === entry.key && dataRow && (forceContent || itemChanged);
      if (!dataRow) dataRow = renderDataRow(entry, i, i - start, columns, offsets);
      else if ((forceContent || itemChanged) && !preserveEditingDOM) syncRowShell(dataRow, renderDataRow(entry, i, i - start, columns, offsets));
      else if (preserveEditingDOM) deferredEditRows.add(entry.key);
      DOM.setPrivate(dataRow, 'tableRow', entry.key);
      syncExistingRowState(dataRow, entry);
      desiredNodes.push(dataRow);

      var needsExpanded = typeof opts.renderExpanded === 'function' && (state.expandedKeys.indexOf(entry.key) >= 0 || opts.forceRenderExpanded === true);
      var expandedRow = record && record.expandedRow;
      if (needsExpanded) {
        var freshExpanded = (forceContent || itemChanged || !expandedRow) ? renderExpandedRow(entry, i, i - start, totalColumns) : null;
        if (!expandedRow) expandedRow = freshExpanded;
        else if (freshExpanded && activeEditRow !== entry.key) syncRowShell(expandedRow, freshExpanded);
        if (expandedRow) { expandedRow.hidden = state.expandedKeys.indexOf(entry.key) < 0; DOM.setPrivate(expandedRow, 'tableExpandedRow', entry.key); desiredNodes.push(expandedRow); }
      } else expandedRow = null;
      bodyRowRecords.set(entry.key, { row: dataRow, expandedRow: expandedRow, item: entry.item, sourceIndex: entry.sourceIndex, visibleIndex: i - start });
      if (variableVirtual) measureRows.push({ index: i, row: dataRow, expandedRow: expandedRow });
    }
    Array.from(bodyRowRecords.keys()).forEach(function (key) { if (!desiredKeys.has(key)) bodyRowRecords.delete(key); });
    if (useVirtual && end < entries.length - 1) {
      var bottomRow = doc.createElement('tr'), bottomCell = doc.createElement('td');
      var bottomStart = virtualizer.getItemOffset(end + 1);
      bottomRow.className = 'qxframe9a7c2-table-virtual-spacer'; bottomCell.colSpan = Math.max(1, totalColumns);
      bottomCell.style.height = Math.max(0, virtualizer.getTotalSize() - bottomStart) + 'px'; bottomRow.appendChild(bottomCell); desiredNodes.push(bottomRow);
    }
    desiredNodes.forEach(function (node) { tbody.appendChild(node); });
    var keep = new Set(desiredNodes);
    Array.prototype.slice.call(tbody.children).forEach(function (node) { if (!keep.has(node)) removeRenderedNode(node); });

    if (virtualMeasureCancel) { virtualMeasureCancel(); virtualMeasureCancel = null; }
    if (variableVirtual && measureRows.length) {
      virtualMeasureCancel = Scheduler.measure(function () {
        if (destroyed || !virtualizer) return;
        var sizes = measureRows.map(function (sample) {
          var dataRect = sample.row && sample.row.getBoundingClientRect ? sample.row.getBoundingClientRect() : null;
          var dataHeight = dataRect && dataRect.height > 0 ? dataRect.height : opts.rowHeight;
          var expandedHeight = 0;
          if (sample.expandedRow && !sample.expandedRow.hidden) {
            var expandedRect = sample.expandedRow.getBoundingClientRect ? sample.expandedRow.getBoundingClientRect() : null;
            expandedHeight = expandedRect && expandedRect.height > 0 ? expandedRect.height : 0;
          }
          return { index: sample.index, size: Math.max(1, dataHeight + expandedHeight) };
        });
        virtualMeasureCancel = Scheduler.mutate(function () {
          virtualMeasureCancel = null;
          if (destroyed || !virtualizer) return;
          sizes.forEach(function (sample) { virtualizer.measure(sample.index, sample.size); });
        });
      });
    }
    navigationProjection = null;
    if (cellDomain) cellDomain.refresh({ reconcile: true });
    completePendingCellVisibility();
    if (editTransaction) {
      var editTarget = editTransaction.target;
      if (editTarget && editTarget.isConnected && editTransaction.status !== 'validating') DOM.focusElement(editTarget, { preventScroll: true });
      else if ((!editTarget || !editTarget.isConnected) && editTransaction.status !== 'validating') {
        if (reason === 'row-remove') cancelEditTransaction('table-edit-row-remove', null, false);
        else commitEditTransaction('table-edit-projection-change', null, false);
      }
    }
    requestFixedGeometry(reason || 'table-body');
  }
  function renderSummary() {
    Renderer.dispose(tfoot);
    while (tfoot.firstChild) tfoot.removeChild(tfoot.firstChild);
    if (typeof opts.summary !== 'function') { setOptionalNode(tfoot, table, false); return; }
    var state = currentState();
    var summaryState = isRemote() ? Object.freeze(Utils.mergeOwn( state, { summary: remoteSummary, summaryScope: remoteSummary == null ? 'page' : 'remote' })) : Object.freeze(Utils.mergeOwn( state, { summary: null, summaryScope: 'local' }));
    var output = opts.summary(state.visibleItems.slice(), summaryState, api);
    if (output === undefined || output === null || output === false || output === '') { setOptionalNode(tfoot, table, false); return; }
    setOptionalNode(tfoot, table, true, null);
    if (Renderer.isNodeLike(output)) { tfoot.appendChild(output); return; }
    var row = doc.createElement('tr');
    var cells = Array.isArray(output) ? output : [output];
    var expected = currentColumns().length + (state.selectionMode !== 'none' ? 1 : 0) + (typeof opts.renderExpanded === 'function' ? 1 : 0);
    cells.forEach(function (value) { var td = doc.createElement('td'); renderOutput(td, value, doc); row.appendChild(td); });
    if (row.children.length && row.children.length < expected) row.lastElementChild.colSpan = expected - row.children.length + 1;
    tfoot.appendChild(row);
  }
  function paginationOptions(state, includeStructure) {
    var local = opts.pager && typeof opts.pager === 'object' ? Utils.mergeOwn(opts.pager) : {};
    delete local.container; delete local.document; delete local.elements;
    var next = Utils.mergeOwn(local, {
      count: state.filteredTotal === undefined ? state.total : state.filteredTotal,
      current: state.page, pageSize: state.pageSize, size: local.size || opts.size,
      disabled: viewBlocked(), hideOnSinglePage: true,
      onChange: function (current, pageSize, detail) {
        if (syncingPagination || destroyed) return;
        var meta = { source: detail && detail.source || 'pagination', reason: detail && detail.reason || 'pagination', originalEvent: detail && detail.originalEvent || null };
        var pageSizeChanged = Number(pageSize) !== Number(model.pageSize);
        var pageChanged = Number(current) !== Number(model.page);
        if (pageSizeChanged && pageChanged) model.updateOptions({ pageSize: pageSize, page: current });
        else if (pageSizeChanged) model.setPageSize(pageSize, meta);
        else if (pageChanged) model.setPage(current, meta);
      }
    });
    if (includeStructure === true) { next.container = pager; next.document = doc; }
    return next;
  }
  function renderPager() {
    var state = currentState();
    var showPager = opts.pager !== false && state.pageSize > 0 && state.pageCount > 1;
    setOptionalNode(pager, root, showPager, null);
    if (!showPager) {
      if (pagination) { pagination.destroy(); pagination = null; }
      return;
    }
    syncingPagination = true;
    try {
      if (!pagination) pagination = Pagination.create(paginationOptions(state, true));
      else pagination.updateOptions(paginationOptions(state, false));
    } finally { syncingPagination = false; }
  }
  function syncRoot() {
    var feedbackClasses=['is-loading','is-error','is-warning','is-success'].filter(function(name){return root.classList.contains(name);}).map(function(name){return ' '+name;}).join('');
    root.className = 'qxframe9a7c2-table-wrap' +
      (opts.borderless ? ' is-borderless' : '') + (opts.shadow ? ' is-shadow' : '') +
      (opts.stickyHeader ? ' is-sticky-header' : '') + (opts.stickySummary ? ' is-sticky-summary' : '') +
      feedbackClasses + (isRemote() ? ' is-remote-' + remoteStatus() : '') + (opts.disabled ? ' is-disabled' : '') + (opts.keyboardNavigation ? ' is-keyboard-navigation' : '') + (opts.className ? ' ' + opts.className : '');
    table.className = 'qxframe9a7c2-table is-' + opts.size + (opts.bordered ? ' is-bordered' : '') +
      (opts.striped ? ' is-striped' : '') + (opts.hover ? ' is-hover' : '') + (opts.fixedLayout ? ' is-fixed' : '');
    if (opts.keyboardNavigation) { if (focusController) focusController.setDisabled(opts.disabled === true); else root.tabIndex = opts.disabled === true ? -1 : 0; } else root.removeAttribute('tabindex');
    if (opts.height != null) root.style.height = typeof opts.height === 'number' ? opts.height + 'px' : String(opts.height); else root.style.removeProperty('height');
    if (opts.maxHeight != null) root.style.maxHeight = typeof opts.maxHeight === 'number' ? opts.maxHeight + 'px' : String(opts.maxHeight); else root.style.removeProperty('max-height');
    if ((opts.virtual === true || opts.virtual === 'auto') && opts.height == null && opts.maxHeight == null) root.style.maxHeight = '320px';
    if (opts.minWidth != null) table.style.minWidth = typeof opts.minWidth === 'number' ? opts.minWidth + 'px' : String(opts.minWidth); else table.style.removeProperty('min-width');
    var busy = opts.loading === true || remoteProcessing;
    if(feedbackController){
      feedbackController.publish({
        operation:'table-status',
        requestId:'table-status',
        status:busy?'pending':(remoteError?'error':'idle'),
        message:remoteError?String(remoteError&&remoteError.message||remoteError):(busy?'Loading':''),
        target:'local'
      });
    }
    setOptionalNode(loading, root, busy, null);
    if (busy) renderOutput(loading, typeof opts.loadingText === 'function' ? opts.loadingText(currentState(), api) : opts.loadingText, doc);
    setOptionalNode(errorPanel, root, !!remoteError && !busy, null);
    if (remoteError && !busy) renderOutput(errorPanel, typeof opts.errorText === 'function' ? opts.errorText(remoteError, currentState(), api) : opts.errorText, doc);
  }
  function ensureVirtualizer(reason) {
    var entries = projectedEntries();
    var requested = opts.virtual === true || opts.virtual === 'auto';
    var enabled = opts.virtual === true || (opts.virtual === 'auto' && entries.length >= opts.virtualThreshold);
    var state = currentState();
    var expandedKeys = state.expandedKeys.length ? new Set(state.expandedKeys) : null;
    var variableSize = enabled && typeof opts.renderExpanded === 'function' && !!expandedKeys && entries.some(function (entry) { return expandedKeys.has(entry.key); });
    if (!requested) {
      if (virtualizer) {
        virtualizerSyncing = true;
        try { virtualizer.updateOptions({ enabled: false, count: entries.length, itemKeys: entries.map(function (entry) { return entry.key; }), itemSize: opts.rowHeight, estimateSize: opts.rowHeight, overscan: opts.overscan }); }
        finally { virtualizerSyncing = false; }
      }
      return;
    }
    if (!virtualizer && !enabled) return;
    virtualizerSyncing = true;
    try {
      if (!virtualizer) {
        var created = Virtualizer.create({
          viewport: root,
          count: entries.length,
          itemKeys: entries.map(function (entry) { return entry.key; }),
          enabled: enabled,
          itemSize: variableSize ? 0 : opts.rowHeight,
          estimateSize: opts.rowHeight,
          overscan: opts.overscan,
          onChange: function () {
            if (destroyed || virtualizerSyncing || !virtualizer) return;
            withProjection(function () { renderBody('virtualizer'); });
          }
        });
        virtualizer = created;
        scope.add(function () { if (virtualizer) virtualizer.destroy(); });
      } else {
        virtualizer.updateOptions({ count: entries.length, itemKeys: entries.map(function (entry) { return entry.key; }), enabled: enabled, itemSize: variableSize ? 0 : opts.rowHeight, estimateSize: opts.rowHeight, overscan: opts.overscan });
        if (variableSize && reason !== 'virtualizer') virtualizer.resetMeasurements('table-projection');
      }
    } finally { virtualizerSyncing = false; }
  }
  function renderSelectionProjection(detail) {
    return withProjection(function () {
      var state = currentState();
      var entries = projectedEntries();
      var entryByKey = Object.create(null);
      entries.forEach(function (entry) { entryByKey[entry.key] = entry; });
      Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (row) {
        var key = DOM.getPrivate(row, 'tableRow');
        if (key === undefined || key === null) return;
        key = String(key);
        row.classList.toggle('is-selected', isKeySelected(key, state));
        var select = DOM.findPrivate(row, 'tableSelect', key);
        if (!select) return;
        var entry = entryByKey[key];
        var disabled = !entry || opts.disabled === true || (opts.isItemDisabled && opts.isItemDisabled(entry.item, entry.sourceIndex, api) === true) || (entry.item && entry.item.disabled === true);
        select.checked = isKeySelected(key, state);
        select.disabled = mutationLocked() || disabled;
      });
      var selectAll = DOM.findPrivate(thead, 'tableSelectAll', 'true');
      if (selectAll) {
        var enabledEntries = entries.filter(function (entry) { return !(opts.isItemDisabled && opts.isItemDisabled(entry.item, entry.sourceIndex, api) === true) && !(entry.item && entry.item.disabled === true); });
        var selectedCount = enabledEntries.filter(function (entry) { return isKeySelected(entry.key, state); }).length;
        selectAll.checked = enabledEntries.length > 0 && selectedCount === enabledEntries.length;
        selectAll.indeterminate = selectedCount > 0 && selectedCount < enabledEntries.length;
      }
      DOM.setPrivate(root, 'tableRenderReason', String(detail && detail.reason || 'selection'));
      return true;
    });
  }
    
  function renderPreservingInteractionSurface(detail) {
    return withProjection(function () {
      syncRoot();
      renderTitleFooterCaption();
      ensureVirtualizer(detail && detail.reason || 'filter');
      renderBody(detail && detail.reason || 'filter');
      renderSummary();
      renderPager();
      refreshNavigationDomains(true);
      syncChromeOrder();
      var activeFilter = filterColumnKey ? DOM.findPrivate(thead, 'tableFilter', filterColumnKey) : null;
      if (activeFilter) activeFilter.classList.toggle('is-active', filterValuesFor(currentColumns().filter(function (entry) { return entry.key === filterColumnKey; })[0] || {}).length > 0);
      var selectAll = DOM.findPrivate(thead, 'tableSelectAll', 'true');
      if (selectAll) {
        var state = currentState();
        var enabledEntries = projectedEntries().filter(function (entry) { return !(opts.isItemDisabled && opts.isItemDisabled(entry.item, entry.sourceIndex, api) === true) && !(entry.item && entry.item.disabled === true); });
        var selectedCount = enabledEntries.filter(function (entry) { return isKeySelected(entry.key, state); }).length;
        selectAll.checked = enabledEntries.length > 0 && selectedCount === enabledEntries.length;
        selectAll.indeterminate = selectedCount > 0 && selectedCount < enabledEntries.length;
      }
      if (filterTrigger && filterTrigger.reposition) filterTrigger.reposition('filter-model-update');
      DOM.setPrivate(root, 'tableRenderReason', String(detail && detail.reason || 'filter'));
      return true;
    });
  }
    
  function captureInteractionState() {
    var filterState = null;
    if (filterTrigger && filterPopup && filterColumnKey && filterTrigger.getState && filterTrigger.getState().open) {
      filterState = Object.freeze({ columnKey:String(filterColumnKey), draftValues:filterDraftValues.slice(), searchValue:filterSearchValue });
    }
    return Object.freeze({ filter:filterState, editKey:editTransaction ? editTransaction.key : null });
  }
  function canPreserveInteractionSurface(snapshot, reason) {
    if (!snapshot || !snapshot.filter) return false;
    var filterColumn = currentColumns().filter(function (entry) { return entry.key === snapshot.filter.columnKey; })[0];
    if (!filterColumn) return false;
    return ['filter','filter-confirm','filter-clear','filters','data','items','row-update','row-insert','row-remove','remote-result','pagination','expand','search'].indexOf(String(reason || '')) >= 0;
  }
  function renderTransaction(detail) {
    var reason = detail && detail.reason || 'model';
    var snapshot = captureInteractionState();
    if (canPreserveInteractionSurface(snapshot, reason)) return renderPreservingInteractionSurface(detail || { reason:reason });
    return render(reason);
  }

  function render(reason) {
    if (destroyed) return false;
    return withProjection(function () {
      if (filterTrigger || filterPopup) destroyFilterPopup('table-render');
      syncRoot(); renderTitleFooterCaption(); renderHead(); syncReorderInteractions(); ensureVirtualizer(reason || 'render'); renderBody(reason || 'render'); renderSummary(); renderPager(); refreshNavigationDomains(true); syncChromeOrder(); requestFixedGeometry(reason || 'render');
      DOM.setPrivate(root, 'tableRenderReason', String(reason || 'render'));
      return true;
    });
  }
    
  delegation = EventDelegation.create({ root: root });
  scope.add(function () { delegation.destroy(); });
  scope.add(DOM.listen(doc, 'keydown', function (event) {
    if (!activeColumnResize || event.defaultPrevented) return;
    interactionController.dispatch(event, { ownerId:'table-resize' });
  }, true));
  delegation.on('pointerdown', DOM.privateMatcher('tableNavigationCell'), function (detail) {
    if (!keyboard || !cellDomain) return;
    var key = DOM.getPrivate(detail.target, 'tableNavigationCell');
    if (key != null) { if (focusController) focusController.setActiveRegion('cells', { source:'pointer', reason:'table-cell-pointer', originalEvent:detail.event }); cellDomain.activate(String(key), { source: 'table-cell-pointer', modality: 'pointer', reason: 'table-cell-pointer', originalEvent: detail.event, ensureVisible: false }); }
  });
  scope.add(DOM.listen(root, 'focusin', function (event) {
    if (!keyboard) return;
    if (event.target === root) {
      if (InteractionModality.isKeyboard(doc)) {
        var state = keyboard.virtualFocus.getState();
        if (!state.domain) cycleNavigationRegion(false, event);
        else keyboard.virtualFocus.refresh({ reason:'table-region-enter' });
      }
      return;
    }
    var cell = DOM.closestPrivate(event.target, root, 'tableNavigationCell');
    if (!cell) return;
    var key = DOM.getPrivate(cell, 'tableNavigationCell');
    var target = key != null ? resolveEditTarget(String(key)) : null;
    if (target && (event.target === target || (target.contains && target.contains(event.target)))) {
      if (!editTransaction || editTransaction.key !== String(key)) enterCellEdit(String(key), 'table-edit-pointer', event);
      if (cellDomain && editTransaction) cellDomain.activate(editTransaction.key, { source: 'table-edit-pointer', modality: 'pointer', reason: 'table-edit-pointer', originalEvent: event, ensureVisible: false });
    }
  }));
  scope.add(DOM.listen(root, 'focusout', function () {
    Promise.resolve().then(function () {
      if (!editTransaction || destroyed || editTransaction.status === 'validating') return;
      var target = editTransaction.target;
      if (!target || (doc.activeElement !== target && !(target.contains && target.contains(doc.activeElement)))) commitEditTransaction('table-edit-blur', null, false);
    });
  }));
  scope.add(DOM.listen(root, 'input', function (event) {
    if (!editTransaction || editTransaction.status === 'validating') return;
    var target = editTransaction.target;
    if (event.target !== target && !(target && target.contains && target.contains(event.target))) return;
    editTransaction.draftValue = editorValue(target);
    editTransaction.status = 'draft'; editTransaction.error = null;
  }, true));
  delegation.on('click', DOM.privateMatcher('tableSort'), function (detail) {
    if (viewBlocked()) return;
    var key = DOM.getPrivate(detail.target, 'tableSort'), state = currentState(), next = 'ascend';
    if (state.sortKey === key && state.sortOrder === 'ascend') next = 'descend';
    else if (state.sortKey === key && state.sortOrder === 'descend') next = null;
    model.setSort(next ? key : null, next, { source: DOM.activationSource(detail.event), originalEvent: detail.event });
  });
  delegation.on('click', DOM.privateMatcher('tableFilter'), function (detail) {
    if (viewBlocked()) return;
    var key = DOM.getPrivate(detail.target, 'tableFilter');
    var column = currentColumns().filter(function (entry) { return entry.key === key; })[0];
    if (!column || (!(Array.isArray(column.filterOptions) && column.filterOptions.length) && !column.filterDropdown)) return;
    if (filterOpenControlled(column)) {
      emitFilterOpenRequest(column, column.filterDropdownOpen !== true, 'filter-trigger', detail.event);
      return;
    }
    if (filterColumnKey === column.key && filterTrigger && filterTrigger.getState && filterTrigger.getState().open) filterTrigger.close('filter-trigger', detail.event);
    else openFilterPopup(detail.target, column, detail.event);
  });
  delegation.on('click', DOM.privateMatcher('tableSelectAll'), function (detail) {
    if (mutationLocked()) return;
    var meta = { source: DOM.activationSource(detail.event), originalEvent: detail.event };
    if (isRemote() && opts.remoteSelectionScope === 'query') setQuerySelectionAll(detail.target.checked, meta);
    else model.selectVisible(detail.target.checked, meta);
  });
  delegation.on('click', DOM.privateMatcher('tableSelect'), function (detail) {
    if (mutationLocked()) return;
    var key = DOM.getPrivate(detail.target, 'tableSelect');
    var meta = { source: DOM.activationSource(detail.event), originalEvent: detail.event };
    if (!toggleQuerySelection(key, detail.target.checked, meta)) model.toggleSelected(key, detail.target.checked, meta);
  });
  delegation.on('click', DOM.privateMatcher('tableExpand'), function (detail) {
    if (viewBlocked()) return;
    var key = DOM.getPrivate(detail.target, 'tableExpand');
    model.toggleExpanded(key, undefined, { source: DOM.activationSource(detail.event), originalEvent: detail.event });
  });
  function dispatchRowEvent(detail, rowPropName, optionName) {
    if (viewBlocked()) return false;
    var row = detail.target;
    if (DOM.closest(detail.event && detail.event.target, 'button,input,a,select,textarea,[contenteditable="true"],[data-qx-action]', row)) return false;
    var entry = model.getEntry(DOM.getPrivate(row, 'tableRow'));
    if (!entry) return false;
    var entries = projectedEntries(), rowIndex = -1;
    for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) if (entries[entryIndex].key === entry.key) { rowIndex = entryIndex; break; }
    var record = bodyRowRecords.get(entry.key);
    var context = rowContext(entry, rowIndex, record && Number.isInteger(record.visibleIndex) ? record.visibleIndex : rowIndex);
    if (typeof opts.onRow === 'function') {
      var rowProps = opts.onRow(entry.item, context) || {};
      if (typeof rowProps[rowPropName] === 'function') rowProps[rowPropName](detail.event, context);
      if (destroyed) return true;
    }
    if (typeof opts[optionName] === 'function') opts[optionName](entry.item, Utils.mergeOwn( context, { originalEvent: detail.event }));
    return true;
  }
  delegation.on('click', DOM.privateMatcher('tableRow'), function (detail) { dispatchRowEvent(detail, 'onClick', 'onRowClick'); });
  delegation.on('dblclick', DOM.privateMatcher('tableRow'), function (detail) { dispatchRowEvent(detail, 'onDoubleClick', 'onRowDoubleClick'); });
  delegation.on('contextmenu', DOM.privateMatcher('tableRow'), function (detail) { dispatchRowEvent(detail, 'onContextMenu', 'onRowContextMenu'); });
    
  function viewStateSnapshot() {
    var state = currentState(), columns = Object.create(null);
    allColumns().forEach(function (column, index) {
      columns[column.key] = Object.freeze({
        visible: column.visible !== false,
        width: column.width == null ? null : column.width,
        flex: column.flex == null ? null : column.flex,
        order: index,
        fixed: column.fixed || null
      });
    });
    return Object.freeze({
      version: VIEW_STATE_VERSION,
      schemaKey: VIEW_STATE_SCHEMA,
      page: state.page,
      pageSize: state.pageSize,
      search: state.searchValue || '',
      sort: Object.freeze({ key: state.sortKey || null, order: state.sortOrder || null }),
      filters: Object.freeze(Object.keys(state.filters || {}).reduce(function (out, key) { out[key] = Object.freeze((state.filters[key] || []).slice()); return out; }, {})),
      columns: Object.freeze(columns),
      size: opts.size
    });
  }
  function applyViewState(viewState, meta) {
    if (!viewState || typeof viewState !== 'object' || Array.isArray(viewState)) throw new TypeError('[QXFRAME9A7C2] Table applyViewState() requires a view-state object.');
    if (viewState.schemaKey !== undefined && viewState.schemaKey !== VIEW_STATE_SCHEMA) throw new TypeError('[QXFRAME9A7C2] Table view state schemaKey is not supported.');
    if (viewState.version !== undefined && Number(viewState.version) > VIEW_STATE_VERSION) throw new TypeError('[QXFRAME9A7C2] Table view state version is newer than this runtime.');
    var current = allColumns(), byKey = Object.create(null), stateColumns = viewState.columns && typeof viewState.columns === 'object' ? viewState.columns : {};
    current.forEach(function (column) {
      var saved = stateColumns[column.key];
      if (!saved || typeof saved !== 'object') { byKey[column.key] = Utils.mergeOwn(column); return; }
      var patch = {};
      if (own(saved, 'visible')) patch.visible = saved.visible !== false;
      if (own(saved, 'width')) patch.width = saved.width == null || saved.width === '' ? null : clampColumnWidth(column, saved.width);
      if (own(saved, 'fixed')) patch.fixed = normalizeFixed(saved.fixed);
      byKey[column.key] = Utils.mergeOwn(column, patch);
    });
    var nextColumns = current.slice().sort(function (a, b) {
      var aSaved = stateColumns[a.key], bSaved = stateColumns[b.key];
      var ao = aSaved && Number.isFinite(Number(aSaved.order)) ? Number(aSaved.order) : current.indexOf(a);
      var bo = bSaved && Number.isFinite(Number(bSaved.order)) ? Number(bSaved.order) : current.indexOf(b);
      return ao - bo;
    }).map(function (column) { return byKey[column.key]; });
    if (!validFixedColumnOrder(nextColumns.filter(function (column) { return column.visible !== false; }))) throw new TypeError('[QXFRAME9A7C2] Table view state violates fixed start/middle/end ordering.');
    nextColumns = normalizeColumns(nextColumns);
    var columnKeys = Object.create(null); nextColumns.forEach(function (column) { columnKeys[column.key] = true; });
    var filters = {};
    if (viewState.filters && typeof viewState.filters === 'object' && !Array.isArray(viewState.filters)) Object.keys(viewState.filters).forEach(function (key) {
      if (columnKeys[key] && Array.isArray(viewState.filters[key])) filters[key] = viewState.filters[key].slice();
    });
    var sort = viewState.sort && typeof viewState.sort === 'object' ? viewState.sort : {};
    var sortKey = sort.key != null && columnKeys[String(sort.key)] ? String(sort.key) : null;
    var sortOrder = sortKey && (sort.order === 'ascend' || sort.order === 'descend') ? sort.order : null;
    if (!sortOrder) sortKey = null;
    var patch = {
      columns: nextColumns,
      page: normalizePositiveInteger(viewState.page == null ? 1 : viewState.page, 'page', 1),
      pageSize: normalizeNonNegativeInteger(viewState.pageSize == null ? currentState().pageSize : viewState.pageSize, 'pageSize', currentState().pageSize),
      searchValue: viewState.search == null ? '' : String(viewState.search),
      sortKey: sortKey,
      sortOrder: sortOrder,
      filters: filters
    };
    var previousOpts = opts;
    var candidate = Utils.mergeOwn(opts, { columns: nextColumns, page: patch.page, pageSize: patch.pageSize, searchValue: patch.searchValue, sortKey: patch.sortKey, sortOrder: patch.sortOrder, filters: patch.filters });
    if (viewState.size !== undefined) candidate.size = normalizeSize(viewState.size);
    opts = candidate;
    try {
      var changed = model.updateOptions(patch);
      if (viewState.size !== undefined && previousOpts.size !== candidate.size && !changed) render('view-state');
      return changed || previousOpts.size !== candidate.size;
    } catch (error) {
      opts = previousOpts;
      throw error;
    }
  }
  function exportColumnTitle(column) {
    var title = own(column, 'exportLabel') ? column.exportLabel : (own(column, 'exportTitle') ? column.exportTitle : (own(column, 'label') ? column.label : column.title));
    if (typeof title === 'function' || (title && typeof title === 'object')) return column.key;
    return title == null || title === '' ? column.key : String(title);
  }
  function exportValue(entry, column) {
    var raw = model.getCellValue(entry.item, column, entry.sourceIndex);
    if (typeof column.exportValue === 'function') return column.exportValue(raw, entry.item, entry.sourceIndex, api);
    return model.getOrthogonalValue('export', entry.item, column, entry.sourceIndex);
  }
  function exportEntries(scopeName) {
    var scope = String(scopeName || 'visible').toLowerCase();
    if (['visible','filtered','selected','all'].indexOf(scope) < 0) throw new TypeError('[QXFRAME9A7C2] Table export scope must be visible, filtered, selected, or all.');
    if (scope === 'visible') return projectedEntries();
    if (isRemote() && (scope === 'all' || scope === 'filtered')) throw new TypeError('[QXFRAME9A7C2] Remote Table cannot enumerate server-wide export scope. Use the remote query with a server/export adapter.');
    var entries = scope === 'all' ? model.getAllEntries() : model.getOrderedEntries();
    if (scope !== 'selected') return entries;
    var selection = selectionStateSnapshot();
    if (isRemote() && selection.allMatching) throw new TypeError('[QXFRAME9A7C2] Remote query-wide selection cannot be materialized client-side for export.');
    var selected = new Set(selection.selectedKeys);
    var filtered = entries.filter(function (entry) { return selected.has(entry.key); });
    if (isRemote() && filtered.length !== selected.size) throw new TypeError('[QXFRAME9A7C2] Remote selected export contains unloaded rows. Use a server/export adapter.');
    return filtered;
  }
  function remoteStatus() {
    var count = currentState().items.length;
    if (!isRemote()) return 'local';
    if (remoteProcessing) return count ? 'refreshing' : 'initial-loading';
    if (remoteError) return count ? 'error-with-stale-data' : 'error-empty';
    return count ? 'ready' : 'empty';
  }
  function escapeCSVCell(value, delimiter, escapeFormula) {
    if (value === undefined || value === null) return '';
    var text = String(value);
    var numericScalar = typeof value === 'number' || typeof value === 'bigint';
    if (escapeFormula !== false && !numericScalar && /^[=+\-@\t\r\n]/.test(text)) text = "'" + text;
    if (text.indexOf('"') >= 0) text = text.replace(/"/g, '""');
    return (text.indexOf('"') >= 0 || text.indexOf('\n') >= 0 || text.indexOf('\r') >= 0 || text.indexOf(delimiter) >= 0) ? '"' + text + '"' : text;
  }
  function getExportCSV(config) {
    var local = config || {}, delimiter = local.delimiter == null ? ',' : String(local.delimiter), escapeFormula = local.escapeFormula !== false;
    if (!delimiter) throw new TypeError('[QXFRAME9A7C2] Table CSV delimiter must not be empty.');
    var data = getExportData(local);
    var lines = [data.headers.map(function (value) { return escapeCSVCell(value, delimiter, escapeFormula); }).join(delimiter)];
    data.rows.forEach(function (row) { lines.push(row.map(function (value) { return escapeCSVCell(value, delimiter, escapeFormula); }).join(delimiter)); });
    return (local.bom === true ? '\ufeff' : '') + lines.join(local.newline == null ? '\r\n' : String(local.newline));
  }
  function getExportData(config) {
    var local = config || {};
    var columnsMode = String(local.columns || 'visible').toLowerCase();
    if (columnsMode !== 'visible' && columnsMode !== 'all') throw new TypeError('[QXFRAME9A7C2] Table export columns must be visible or all.');
    var columns = allColumns().filter(function (column) { return column.exportable !== false && (columnsMode === 'all' || column.visible !== false); });
    var entries = exportEntries(local.scope || 'visible');
    return Object.freeze({
      headers: Object.freeze(columns.map(exportColumnTitle)),
      rows: Object.freeze(entries.map(function (entry) { return Object.freeze(columns.map(function (column) { return exportValue(entry, column); })); })),
      columns: Object.freeze(columns.map(function (column) { return Object.freeze({ key: column.key, title: exportColumnTitle(column), field: column.field == null ? column.key : column.field }); })),
      scope: String(local.scope || 'visible').toLowerCase()
    });
  }
  function reflow(reason) {
    if (destroyed) return false;
    if (virtualizer) virtualizer.refresh(reason || 'table-reflow');
    requestFixedGeometry(reason || 'table-reflow');
    if (filterTrigger && filterTrigger.reposition) filterTrigger.reposition(reason || 'table-reflow');
    return true;
  }
  function applyOptions(nextOptions, patch) {
    if (destroyed) return api;
    var next = patch || {};
    var loaderChanged = own(next, 'load') && next.load !== opts.load;
    var candidate = Utils.mergeOwn(opts, next);
    candidate.size = normalizeSize(candidate.size);
    candidate.columns = normalizeColumns(candidate.columns);
    candidate.responsiveMode = normalizeResponsiveMode(candidate.responsiveMode);
    candidate.keyboardNavigation = normalizeKeyboardNavigation(candidate.keyboardNavigation);
    candidate.editEnterBehavior = normalizeEditEnterBehavior(candidate.editEnterBehavior);
    candidate.virtual = normalizeVirtual(candidate.virtual);
    candidate.virtualThreshold = normalizePositiveInteger(candidate.virtualThreshold, 'virtualThreshold', 100);
    candidate.rowHeight = normalizePositiveNumber(candidate.rowHeight, 'rowHeight', 44);
    candidate.overscan = normalizeNonNegativeInteger(candidate.overscan, 'overscan', 4);
    candidate.searchValue = candidate.searchValue == null ? '' : String(candidate.searchValue);
    candidate.remoteSelectionScope = normalizeRemoteSelectionScope(candidate.remoteSelectionScope);
    candidate.scrollPolicy = normalizeScrollPolicy(candidate.scrollPolicy);
    assertStableRowIdentity(candidate.items, candidate);
    validateFeatureCombination(candidate);
    if(own(next,'value')) candidate.selectedKeys=normalizeTableValue(next.value);
    var remoteSelectionContractChanged = own(next, 'remoteSelectionScope') || own(next, 'selectedKeys') || own(next,'value') || (own(next, 'load') && typeof candidate.load !== 'function');
    opts = candidate;
    if(own(next,'value')||own(next,'selectedKeys')){
      valueBinding.syncExternal(own(next,'value')?next.value:next.selectedKeys,{ silent:true, source:'options', reason:'selection-options' });
      opts.selectedKeys=valueBinding.value.slice(); opts.value=valueBinding.value.slice();
      syncFormBridge({ source:'options', reason:'selection-options' });
    }
    if(formBridge && (own(next,'name')||own(next,'disabled')||own(next,'readOnly')||own(next,'required'))){
      formBridge.updateOptions({ name:opts.name||'', disabled:opts.disabled===true, readOnly:opts.readOnly===true, required:opts.required===true });
    }
    if(own(next,'formField')||own(next,'formTarget')) createFormBridge();
    if(formRegistration&&formController&&own(next,'name')&&!(formBindingConfig&&own(formBindingConfig,'name'))){
      var rebound=formController,config=Utils.mergeOwn(formBindingConfig||{});
      record.unbindFormController({source:'options',reason:'name-change'});
      record.bindFormController(rebound,config);
    }
    if (capabilityController) capabilityController.updateOptions({});
    if (remoteSelectionContractChanged) resetRemoteSelection();
    if (loaderChanged || own(next, 'items')) invalidateRemoteRequest(loaderChanged ? 'load-options-replaced' : 'items-options-replaced');
    syncKeyboardNavigation();
    syncReorderInteractions();
    var modelPatch = {};
    ['items','columns','getKey','isItemDisabled','selectionMode','selectedKeys','expandedKeys','preserveSelectedKeys','sortKey','sortOrder','filters','searchValue','searchMatcher','page','pageSize','total','filteredTotal'].forEach(function (name) {
      if (own(next, name)) modelPatch[name] = name==='selectedKeys' ? valueBinding.value : opts[name];
    });
    if (own(next, 'value')) modelPatch.selectedKeys = valueBinding.value;
    if (own(next, 'load')) modelPatch.remote = typeof opts.load === 'function';
    if (Object.keys(modelPatch).length) {
      model.updateOptions(modelPatch);
      if(own(next,'items')||own(next,'getKey')||own(next,'isItemDisabled')||own(next,'preserveSelectedKeys')) reconcileCommittedSelectionFromModel({source:'options',reason:'selection-reconcile'});
    } else render('options');
    return api;
  }
  function destroyRuntime() {
    if (destroyed) return false;
    destroyed = true;
    remoteEpoch += 1;
    if (editTransaction) cancelEditTransaction('table-edit-destroy', null, false);
    destroyFilterPopup('table-destroy');
    destroyColumnResizeSessions();
    destroyReorderInteractions();
    if (pagination) { pagination.destroy(); pagination = null; }
    destroyKeyboardNavigation();
    if (interactionController) { interactionController.destroy(); interactionController = null; }
    if (capabilityController) { capabilityController.destroy(); capabilityController = null; }
    scope.dispose();
    Renderer.dispose(root);
    model.destroy();
    DOM.removeNode(root);
    return true;
  }
    
  var record = {
    setItems: function (items, meta) { invalidateRemoteRequest('table-items-replaced'); opts.items = items; var result=model.setItems(items, meta); reconcileCommittedSelectionFromModel(meta); return result; },
    updateRow: function (key, updater, meta) { return model.updateRow(key, updater, meta); },
    insertRows: function (index, rows, meta) { var result=model.insertRows(index, rows, meta); reconcileCommittedSelectionFromModel(meta); return result; },
    removeRows: function (keys, meta) { var result=model.removeRows(keys, meta); reconcileCommittedSelectionFromModel(meta); return result; },
    setColumns: function (columns, meta) { opts.columns = normalizeColumns(columns); return model.setColumns(opts.columns, meta); },
    setColumnWidth: function (key, width, meta) { return commitColumnWidth(key, width, Utils.assignOwn({ source:'api', reason:'column-resize' }, meta || {})); },
    setColumnVisible:setColumnVisible, setColumnOrder:setColumnOrder, applyColumnState:applyColumnState, resetColumnState:resetColumnState,
    reorderColumn:function(key,toIndex,meta){return reorderColumnsByKey(key,toIndex,Utils.assignOwn({source:'api'},meta||{}));},
    reorderRow:function(key,toIndex,meta){return reorderRowsByKey(key,toIndex,Utils.assignOwn({source:'api'},meta||{}));},
    getColumnState:columnStateSnapshot,
    setSort:function(){return model.setSort.apply(model,arguments);},
    setFilter:function(){return model.setFilter.apply(model,arguments);},
    setFilters:function(){return model.setFilters.apply(model,arguments);},
    setSearchValue:function(value,meta){opts.searchValue=value==null?'':String(value);if(typeof opts.onSearchChange==='function')opts.onSearchChange(opts.searchValue,Utils.assignOwn({instance:api},meta||{}));if(destroyed)return false;return model.setSearchValue(opts.searchValue,meta);},
    setSelectedKeys:function(keys,meta){resetRemoteSelection();return model.setSelectedKeys(normalizeTableValue(keys),meta);},
    getValue:function(){return valueBinding.value.slice();},
    getValueController:function(){return valueBinding.getValueController();},
    getFeedbackController:function(){return feedbackController;},
    getOverlayController:function(){return filterTrigger&&filterTrigger.getOverlayController?filterTrigger.getOverlayController():null;},
    getFormBridge:function(){return formBridge;},
    bindFormController:function(controller,config){
      if(formRegistration){formRegistration.unregister({source:'component',reason:'form-rebind'});formRegistration=null;}
      formController=null;
      if(!controller)return null;
      var local=config&&typeof config==='object'?config:{};
      formBindingConfig=Utils.mergeOwn(local);
      var fieldId=String(local.fieldId||instance.id);
      var name=own(local,'name')?String(local.name||''):String(opts.name||'');
      formRegistration=FormController.bindField(controller,{
        fieldId:fieldId,
        name:name,
        adapter:{
          getValue:function(){return valueBinding.value.slice();},
          getSerializedValue:function(){return formBridge?formBridge.getSerializedValue():valueBinding.value.slice();},
          getOwnershipState:function(){return valueBinding.getOwnershipState();},
          reset:function(context){
            var result=resetCommittedSelection({source:'form',reason:'form-reset',requestId:context&&context.requestId,context:context});
            return OperationResult.isOperationResult(result)?result:true;
          },
          focus:function(){return focusController?focusController.focus({preventScroll:true}):false;}
        },
        metadata:local.metadata||null
      });
      formController=controller;
      return formRegistration;
    },
    unbindFormController:function(meta){if(!formRegistration)return false;var result=formRegistration.unregister(meta||{source:'component',reason:'form-unbind'});formRegistration=null;formController=null;formBindingConfig=null;return result;},
    getFormController:function(){return formController;},
    getFormRegistration:function(){return formRegistration;},
    toggleSelected:function(key,desired,meta){if(toggleQuerySelection(key,desired,meta))return true;return model.toggleSelected(key,desired,meta);},
    selectVisible:function(desired,meta){if(isRemote()&&opts.remoteSelectionScope==='query')return setQuerySelectionAll(desired,meta);return model.selectVisible(desired,meta);},
    getSelectionState:selectionStateSnapshot,
    setExpandedKeys:function(){return model.setExpandedKeys.apply(model,arguments);},
    toggleExpanded:function(){return model.toggleExpanded.apply(model,arguments);},
    setPage:function(){return model.setPage.apply(model,arguments);},
    setPageSize:function(){return model.setPageSize.apply(model,arguments);},
    refresh:function(meta){return isRemote()?requestRemote(meta&&meta.reason||'refresh'):(render('refresh'),Promise.resolve(true));},
    retry:function(){return isRemote()?requestRemote('retry'):Promise.resolve(false);},
    scrollToRow:function(key,config){
      var entries=projectedEntries(),index=-1;
      for(var i=0;i<entries.length;i+=1)if(entries[i].key===String(key)){index=i;break;}
      if(index<0)return false;
      if(virtualizer&&virtualizer.enabled)return virtualizer.scrollToIndex(index,config||{align:'nearest'});
      var row=DOM.findPrivate(root,'tableRow',String(key));if(!row)return false;
      var local=config||{};return ScrollVisibility.ensureVisible(root,row,{axis:'y',align:local.align||'nearest',offset:local.offset});
    },
    focusCell:function(rowKey,columnKey,config){
      if(!keyboard||!cellDomain)return false;
      var projection=rebuildNavigationProjection(),row=String(rowKey),column=String(columnKey);
      if(!own(projection.rowIndexByKey,row)||!own(projection.columnIndexByIdentity,'data\u0000'+column))return false;
      var key=navigationCellKey(row,{kind:'data',key:column}),local=config||{};
      if(local.focusOwner!==false){if(focusController)focusController.focus();else DOM.focusElement(root,{preventScroll:true});}
      return cellDomain.activate(key,{source:local.source||'keyboard',reason:local.reason||'table-focus-cell',originalEvent:local.originalEvent||null,ensureVisible:local.ensureVisible!==false});
    },
    enterEdit:function(rowKey,columnKey){
      if(rowKey!==undefined&&columnKey!==undefined&&!record.focusCell(rowKey,columnKey,{reason:'table-enter-edit',ensureVisible:true}))return false;
      if(!keyboard||!cellDomain)return false;
      var current=keyboard.virtualFocus.getState();return current.domain===cellDomain.name?enterCellEdit(current.key,'table-enter-edit',null):false;
    },
    exitEdit:function(){return exitCellEdit('table-exit-edit',null,true);},
    getCellElement:function(rowKey,columnKey){return findNavigationCell(navigationCellKey(String(rowKey),{kind:'data',key:String(columnKey)}));},
    getViewState:viewStateSnapshot, applyViewState:applyViewState,
    resetViewState:function(meta){return applyViewState(initialViewState,Utils.assignOwn({source:'api',reason:'view-state-reset'},meta||{}));},
    getExportData:getExportData, getExportCSV:getExportCSV, reflow:reflow, resize:reflow, applyOptions:applyOptions,
    getState:function(){var state=currentState(),focusState=keyboard?keyboard.virtualFocus.getState():null,decoded=focusState&&cellDomain&&focusState.domain===cellDomain.name?decodeNavigationCellKey(focusState.key):null;return Object.freeze(Utils.mergeOwn(state,{value:valueBinding.value.slice(),virtual:!!virtualizer&&virtualizer.enabled,keyboardNavigation:opts.keyboardNavigation===true,activeCell:decoded?Object.freeze({rowKey:decoded.rowKey,kind:decoded.kind,columnKey:decoded.kind==='data'?decoded.columnKey:null}):null,editingCell:editStateSnapshot(),forceRenderExpanded:opts.forceRenderExpanded===true,disabled:opts.disabled===true,readOnly:opts.readOnly===true,loading:opts.loading===true||remoteProcessing,processing:remoteProcessing,remoteStatus:remoteStatus(),loadError:remoteError,remoteSummary:remoteSummary,remote:isRemote(),query:isRemote()?remoteQuery():null,requestEpoch:remoteEpoch,selection:selectionStateSnapshot(),destroyed:destroyed}));},
    getDiagnostics:function(){return Object.freeze(Utils.mergeOwn(model.getDiagnostics?model.getDiagnostics():{},tableDiagnostics));},
    getModel:function(){return model;}, getRootElement:function(){return root;}, getTableElement:function(){return table;},
    getVirtualizer:function(){return virtualizer;}, getKeyboardNavigation:function(){return keyboard;}, getFocusController:function(){return focusController;}, getInteractionController:function(){return interactionController;}, getCapabilityController:function(){return capabilityController;}, getSelectionController:function(){return selectionController;}, getFilterPopup:function(){return filterPopup;},
    openFilter:function(key){var column=currentColumns().filter(function(entry){return entry.key===String(key);})[0];if(!column)return false;var reference=DOM.findPrivate(thead,'tableFilter',column.key);if(!reference)return false;if(filterOpenControlled(column)&&column.filterDropdownOpen!==true){emitFilterOpenRequest(column,true,'api-open',null);return false;}return openFilterPopup(reference,column,null);},
    closeFilter:function(){if(!filterTrigger||!filterColumnKey)return false;var column=currentColumns().filter(function(entry){return entry.key===filterColumnKey;})[0];if(column&&filterOpenControlled(column)&&column.filterDropdownOpen===true){emitFilterOpenRequest(column,false,'api-close',null);return false;}return filterTrigger.close('api-close');}
  };
  tableState.set(instance, record);
  instance.own(destroyRuntime);
  initialViewState = viewStateSnapshot();
  syncKeyboardNavigation();
  render('init');
  if (isRemote()) requestRemote('init');
  return root;
}

function recordForTable(instance) {
  var record = tableState.get(instance);
  if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Table instance.');
  return record;
}

export class Table extends Component {
  static profile = Object.freeze({
    name:'Table',
    value:Object.freeze({ mode:'explicit-selected-keys' }),
    focus:Object.freeze({ mode:'virtual-navigation', editLease:'cell-editor', regions:Object.freeze(['cells','header']) }),
    interaction:Object.freeze({ keymap:'table' }),
    capability:Object.freeze({ operations:Object.freeze(['navigate','edit','select']) }),
    selection:Object.freeze({ channels:Object.freeze(['selected','allMatching']), remote:'query-allMatching' }),
    overlay:Object.freeze({ mode:'filter-trigger' }),
    feedback:Object.freeze({ mode:'remote-load-status' }),
    form:Object.freeze({ mode:'selected-keys' }),
    ownership:Object.freeze({ value:'ValueController', focus:'FocusController', interaction:'InteractionController', capability:'CapabilityController', selection:'SelectionController', overlay:'OverlayController', feedback:'FeedbackController', form:'FormController' })
  });
  static contract = ComponentContracts.get('Table');
  static immutableOptions = Object.freeze(['container','document']);
  static sizes = SIZES.slice();

  constructor(options = {}) { super(normalizeTableInitial(options)); }
  updateOptions(nextOptions = {}) {
    var next=Utils.mergeOwn(nextOptions||{});
    if(own(next,'container')){
      if(next.container!==this.options.container)throw new TypeError('[QXFRAME9A7C2] Table container is immutable.');
      delete next.container;
    }
    if(own(next,'document')){
      var doc=this.options.document||(this.options.container&&this.options.container.ownerDocument)||global.document;
      if(next.document!==this.options.document&&next.document!==doc)throw new TypeError('[QXFRAME9A7C2] Table document is immutable.');
      delete next.document;
    }
    return super.updateOptions(normalizeTablePatch(next,this.options));
  }

  [componentHooks.render]() {
    var record = tableState.get(this);
    return record ? record.getRootElement() : setupTable(this);
  }
  [componentHooks.optionsUpdated](next, _previous, patch) {
    var record = tableState.get(this);
    if (record) record.applyOptions(next, patch);
  }

  setItems(items,meta){return recordForTable(this).setItems(items,meta);}
  updateRow(key,updater,meta){return recordForTable(this).updateRow(key,updater,meta);}
  insertRows(index,rows,meta){return recordForTable(this).insertRows(index,rows,meta);}
  removeRows(keys,meta){return recordForTable(this).removeRows(keys,meta);}
  setColumns(columns,meta){return recordForTable(this).setColumns(columns,meta);}
  setColumnWidth(key,width,meta){return recordForTable(this).setColumnWidth(key,width,meta);}
  setColumnVisible(key,visible,meta){return recordForTable(this).setColumnVisible(key,visible,meta);}
  setColumnOrder(keys,meta){return recordForTable(this).setColumnOrder(keys,meta);}
  applyColumnState(state,meta){return recordForTable(this).applyColumnState(state,meta);}
  resetColumnState(meta){return recordForTable(this).resetColumnState(meta);}
  reorderColumn(key,toIndex,meta){return recordForTable(this).reorderColumn(key,toIndex,meta);}
  reorderRow(key,toIndex,meta){return recordForTable(this).reorderRow(key,toIndex,meta);}
  getColumnState(){return recordForTable(this).getColumnState();}
  setSort(){return recordForTable(this).setSort.apply(null,arguments);}
  setFilter(){return recordForTable(this).setFilter.apply(null,arguments);}
  setFilters(){return recordForTable(this).setFilters.apply(null,arguments);}
  setSearchValue(value,meta){return recordForTable(this).setSearchValue(value,meta);}
  setValue(keys,meta){return recordForTable(this).setSelectedKeys(keys,meta);}
  getValue(){return recordForTable(this).getValue();}
  setSelectedKeys(keys,meta){return recordForTable(this).setSelectedKeys(keys,meta);}
  toggleSelected(key,desired,meta){return recordForTable(this).toggleSelected(key,desired,meta);}
  selectVisible(desired,meta){return recordForTable(this).selectVisible(desired,meta);}
  getSelectionState(){return recordForTable(this).getSelectionState();}
  setExpandedKeys(){return recordForTable(this).setExpandedKeys.apply(null,arguments);}
  toggleExpanded(){return recordForTable(this).toggleExpanded.apply(null,arguments);}
  setPage(){return recordForTable(this).setPage.apply(null,arguments);}
  setPageSize(){return recordForTable(this).setPageSize.apply(null,arguments);}
  refresh(meta){return recordForTable(this).refresh(meta);}
  retry(){return recordForTable(this).retry();}
  scrollToRow(key,config){return recordForTable(this).scrollToRow(key,config);}
  focusCell(rowKey,columnKey,config){return recordForTable(this).focusCell(rowKey,columnKey,config);}
  enterEdit(rowKey,columnKey){return recordForTable(this).enterEdit(rowKey,columnKey);}
  exitEdit(){return recordForTable(this).exitEdit();}
  getCellElement(rowKey,columnKey){return recordForTable(this).getCellElement(rowKey,columnKey);}
  getViewState(){return recordForTable(this).getViewState();}
  applyViewState(state,meta){return recordForTable(this).applyViewState(state,meta);}
  resetViewState(meta){return recordForTable(this).resetViewState(meta);}
  getExportData(config){return recordForTable(this).getExportData(config);}
  getExportCSV(config){return recordForTable(this).getExportCSV(config);}
  reflow(reason){return recordForTable(this).reflow(reason);}
  resize(reason){return recordForTable(this).resize(reason);}
  getState(){return recordForTable(this).getState();}
  getDiagnostics(){return recordForTable(this).getDiagnostics();}
  getModel(){return recordForTable(this).getModel();}
  getRootElement(){return recordForTable(this).getRootElement();}
  getTableElement(){return recordForTable(this).getTableElement();}
  getVirtualizer(){return recordForTable(this).getVirtualizer();}
  getKeyboardNavigation(){return recordForTable(this).getKeyboardNavigation();}
  getValueController(){return recordForTable(this).getValueController();}
  getFocusController(){return recordForTable(this).getFocusController();}
  getInteractionController(){return recordForTable(this).getInteractionController();}
  getCapabilityController(){return recordForTable(this).getCapabilityController();}
  getSelectionController(){return recordForTable(this).getSelectionController();}
  getOverlayController(){return recordForTable(this).getOverlayController();}
  getFeedbackController(){return recordForTable(this).getFeedbackController();}
  getFormBridge(){return recordForTable(this).getFormBridge();}
  bindFormController(controller,config){return recordForTable(this).bindFormController(controller,config);}
  unbindFormController(meta){return recordForTable(this).unbindFormController(meta);}
  getFormController(){return recordForTable(this).getFormController();}
  getFormRegistration(){return recordForTable(this).getFormRegistration();}
  getFilterPopup(){return recordForTable(this).getFilterPopup();}
  openFilter(key){return recordForTable(this).openFilter(key);}
  closeFilter(){return recordForTable(this).closeFilter();}
}

export { SIZES as TABLE_SIZES };
export default Table;
