// Canonical ESM Transfer implementation with direct Pagination/Table dependencies.
import { CapabilityController } from '../core/capabilityController.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Utils } from '../utils/utils.js';
import { DOMBinding } from '../core/domBinding.js';
import { Renderer } from '../core/renderer.js';
import { Collection } from '../core/collection.js';
import { SelectionController } from '../core/selectionController.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { TreeQuery } from '../utils/treeQuery.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { componentHooks } from '../core/componentHooks.js';
import { fieldHooks } from '../core/fieldHooks.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { FieldComponent } from './field.js';
import { ItemCollection } from './item-collection.js';
import { Item } from './item.js';
import { Control } from './control.js';
import { Pagination } from './pagination.js';
import { Table } from './table.js';

const global=globalThis;

const transferState = new WeakMap();
const TRANSFER_DEFAULTS = Object.freeze({
  items: [], value: [], titles: ['Source', 'Target'], searchable: true, sortable: true,
  oneWay: false, disabled: false, readOnly: false, required: false, size: 'md',
  virtual: false, pagination: false, table: false, status: 'default'
});

const blueprint=DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-transfer" data-qxframe9a7c2-ref="root">
    <section class="qxframe9a7c2-transfer-panel qxframe9a7c2-transfer-source" data-qxframe9a7c2-ref="source-panel">
      <header class="qxframe9a7c2-transfer-header">
        <label class="qxframe9a7c2-transfer-header-main qxframe9a7c2-form-check"><input class="qxframe9a7c2-transfer-select-all qxframe9a7c2-form-check-input" type="checkbox" data-qxframe9a7c2-ref="source-select-all"><strong class="qxframe9a7c2-transfer-title qxframe9a7c2-form-check-label" data-qxframe9a7c2-ref="source-title"></strong></label>
        <span class="qxframe9a7c2-transfer-count" data-qxframe9a7c2-ref="source-count"></span>
      </header>
      <div class="qxframe9a7c2-transfer-list-host" data-qxframe9a7c2-ref="source-host"></div>
    </section>
    <div class="qxframe9a7c2-transfer-operations" data-qxframe9a7c2-ref="operations">
      <button class="qxframe9a7c2-transfer-operation qxframe9a7c2-button is-default is-outlined is-square" type="button" data-qxframe9a7c2-ref="right"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-arrow-right is-line is-round is-stroke-3"></span></button>
      <button class="qxframe9a7c2-transfer-operation qxframe9a7c2-button is-default is-outlined is-square" type="button" data-qxframe9a7c2-ref="left"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-arrow-left is-line is-round is-stroke-3"></span></button>
      <button class="qxframe9a7c2-transfer-operation qxframe9a7c2-button is-default is-outlined is-square" type="button" data-qxframe9a7c2-ref="up"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-arrow-up is-line is-round is-stroke-3"></span></button>
      <button class="qxframe9a7c2-transfer-operation qxframe9a7c2-button is-default is-outlined is-square" type="button" data-qxframe9a7c2-ref="down"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-arrow-down is-line is-round is-stroke-3"></span></button>
    </div>
    <section class="qxframe9a7c2-transfer-panel qxframe9a7c2-transfer-target" data-qxframe9a7c2-ref="target-panel">
      <header class="qxframe9a7c2-transfer-header">
        <label class="qxframe9a7c2-transfer-header-main qxframe9a7c2-form-check"><input class="qxframe9a7c2-transfer-select-all qxframe9a7c2-form-check-input" type="checkbox" data-qxframe9a7c2-ref="target-select-all"><strong class="qxframe9a7c2-transfer-title qxframe9a7c2-form-check-label" data-qxframe9a7c2-ref="target-title"></strong></label>
        <span class="qxframe9a7c2-transfer-count" data-qxframe9a7c2-ref="target-count"></span>
      </header>
      <div class="qxframe9a7c2-transfer-list-host" data-qxframe9a7c2-ref="target-host"></div>
    </section>
  </div>`;
function createDefaultDOM(context){var instance=blueprint.instantiate(context.document);return{root:instance.root,refs:instance.refs};}
const DOMFactory=Object.freeze({createDefaultDOM,blueprint});

var own = Utils.own;
function asArray(value) { return value === undefined || value === null ? [] : (Array.isArray(value) ? value.slice() : [value]); }
function normalizeValues(value) { return asArray(value).map(String); }
function sameArray(a, b) { return a.length === b.length && a.every(function (value, index) { return value === b[index]; }); }
function sizeName(value) { return Utils.normalizeSize(value, 'md'); }
function statusName(value) {
  var status = value === undefined || value === null || value === '' || value === 'default' ? 'default' : String(value).toLowerCase();
  if (['default','error','warning'].indexOf(status) < 0) throw new TypeError('[QXFRAME9A7C2] Transfer status must be default, error, or warning.');
  return status;
}
function positiveInt(value, fallback) { var number = Math.floor(Number(value)); return Number.isFinite(number) && number > 0 ? number : fallback; }
function paginationConfig(value, side) {
  if (value === undefined || value === null || value === false) return null;
  if (value === true) return { pageSize: 10, simple: false, responsive: true, hideOnSinglePage: true };
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Transfer pagination must be boolean or an object.');
  var base = {};
  Object.keys(value).forEach(function (key) { if (key !== 'source' && key !== 'target' && Utils.safeOwnKey(key)) base[key] = value[key]; });
  if (own(value, side)) {
    var scoped = value[side];
    if (scoped === false || scoped === null) return null;
    if (scoped !== true && (!scoped || typeof scoped !== 'object' || Array.isArray(scoped))) throw new TypeError('[QXFRAME9A7C2] Transfer pagination.' + side + ' must be boolean or an object.');
    if (scoped && scoped !== true) Utils.copyOwn(base, scoped);
  }
  base.pageSize = positiveInt(base.pageSize, 10);
  if (base.current !== undefined) base.current = positiveInt(base.current, 1);
  if (base.simple === undefined) base.simple = false;
  if (base.responsive === undefined) base.responsive = true;
  if (base.hideOnSinglePage === undefined) base.hideOnSinglePage = true;
  return base;
}
var TABLE_OWNERSHIP_OPTIONS = Object.freeze(['container','document','items','getKey','isItemDisabled','selectionMode','selectedKeys','sortKey','sortOrder','filters','page','pageSize','pagination','rowSelection','dataSource','rowKey']);
function tableConfig(value, side) {
  if (value === undefined || value === null || value === false) return null;
  if (value === true) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Transfer table must be boolean or an object.');
  var base = {};
  Object.keys(value).forEach(function (key) { if (key !== 'source' && key !== 'target' && Utils.safeOwnKey(key)) base[key] = value[key]; });
  if (own(value, side)) {
    var scoped = value[side];
    if (scoped === false || scoped === null) return null;
    if (scoped !== true && (!scoped || typeof scoped !== 'object' || Array.isArray(scoped))) throw new TypeError('[QXFRAME9A7C2] Transfer table.' + side + ' must be boolean or an object.');
    if (scoped && scoped !== true) Utils.copyOwn(base, scoped);
  }
  TABLE_OWNERSHIP_OPTIONS.forEach(function (name) {
    if (own(base, name)) throw new TypeError('[QXFRAME9A7C2] Transfer table projection does not own ' + name + '. Search/filter/selection/pagination remain owned by Transfer List/Pagination.');
  });
  if (base.columns !== undefined) {
    if (!Array.isArray(base.columns)) throw new TypeError('[QXFRAME9A7C2] Transfer table columns must be an array.');
    base.columns.forEach(function (column) {
      if (!column || typeof column !== 'object') throw new TypeError('[QXFRAME9A7C2] Transfer table columns must be objects.');
      if (column.sortable !== undefined || column.filter !== undefined || column.filterOptions !== undefined) {
        throw new TypeError('[QXFRAME9A7C2] Transfer table columns are projection-only; sort/filter remain owned by the Transfer List pipeline.');
      }
    });
    base.columns = base.columns.slice();
  }
  return base;
}

function setupTransfer(instance) {
  var state = transferState.get(instance);
  if (!state) throw new TypeError('[QXFRAME9A7C2] Invalid Transfer instance.');
  var fieldInit = state.fieldInit;
  var opts = Utils.mergeOwn(instance.options);
  var host = opts.container || null;
  var scope = Lifecycle.createScope();
  var domBinding = null;
  var root = null;
  var refs = null;
  var sourceList = null;
  var targetList = null;
  var targetOrder = null;
  var selectionController = null;
  var sourcePagination = null;
  var targetPagination = null;
  var sourceTable = null;
  var targetTable = null;
  var destroyed = false;
  var api = instance;
  var formBridge = null;
  var doc = fieldInit.document || opts.document || (host && host.ownerDocument) || (opts.formField && opts.formField.ownerDocument) || global.document;
  var items = [];
  var targetValues = [];
  var records = Object.create(null);
  var recordByItem = new WeakMap();

  var itemAccessors=ItemAccessors.create({
    getKey:function(item,index){if(Utils.isFunction(opts.getKey))return opts.getKey(item,index);if(item&&item.id!==undefined)throw new TypeError('[QXFRAME9A7C2] Transfer item.id is not canonical. Use item.key or explicit getKey().');return item&&item.key;},
    getValue:function(item,index){return Utils.isFunction(opts.getValue)?opts.getValue(item,index):(item&&item.value);},
    getLabel:function(item,index){return Utils.isFunction(opts.getLabel)?opts.getLabel(item,index):(item&&item.label);},
    getChildren:function(){return [];},
    isDisabled:function(item,index){return Utils.isFunction(opts.isItemDisabled)?opts.isItemDisabled(item,index)===true:!!(item&&item.disabled===true);}
  });
  function keyOf(item,index){return itemAccessors.key(item,index);}
  function valueOf(item,index){return itemAccessors.value(item,index);}
  function labelOf(item,index){return itemAccessors.label(item,index);}
  function disabledOf(item,index){return itemAccessors.disabled(item,index);}

  function indexItems(nextItems) {
    var nextRecords=Object.create(null),nextByItem=new WeakMap(),seenKeys=Object.create(null);
    var indexed=TreeQuery.index(Array.isArray(nextItems)?nextItems:[],{accessors:itemAccessors});
    indexed.records.forEach(function(record){
      var item=record.item,index=record.index;
      if(!item||typeof item!=='object')throw new TypeError('[QXFRAME9A7C2] Transfer items must be objects.');
      var key=keyOf(item,index),value=valueOf(item,index),label=labelOf(item,index);
      if(key===undefined||key===null||key==='')throw new TypeError('[QXFRAME9A7C2] Transfer item.key is required unless getKey is supplied.');
      if(value===undefined||value===null||value==='')throw new TypeError('[QXFRAME9A7C2] Transfer item.value is required unless getValue is supplied.');
      if(label===undefined||label===null)throw new TypeError('[QXFRAME9A7C2] Transfer item.label is required unless getLabel is supplied.');
      key=String(key);value=String(value);
      if(seenKeys[key])throw new TypeError('[QXFRAME9A7C2] Transfer item.key must be unique: '+key);
      if(nextRecords[value])throw new TypeError('[QXFRAME9A7C2] Transfer item.value must be unique: '+value);
      seenKeys[key]=true;
      nextRecords[value]={item:item,index:index,key:key,value:value,label:String(label),disabled:disabledOf(item,index)};
      nextByItem.set(item,nextRecords[value]);
    });
    records=nextRecords;recordByItem=nextByItem;
  }

  function validateTargetValues(nextValue) {
    var normalized = normalizeValues(nextValue);
    var seen = Object.create(null);
    normalized.forEach(function (value) {
      if (!records[value]) throw new RangeError('[QXFRAME9A7C2] Transfer value contains an unknown item value: ' + value);
      if (seen[value]) throw new TypeError('[QXFRAME9A7C2] Transfer value must not contain duplicates: ' + value);
      seen[value] = true;
    });
    return normalized;
  }

  function sourceItems() {
    var selected = new Set(targetValues);
    return items.filter(function (item, index) { return !selected.has(String(valueOf(item, index))); });
  }
  function targetItems() {
    return targetValues.map(function (value) { return records[value] && records[value].item; }).filter(Boolean);
  }
  function mutationLocked() { return destroyed || CapabilityController.mutationLocked(opts); }
  function selectedValues(list) { return list ? list.getState().values.slice() : []; }
  function ensureOptionalSurfaces() {
    function ensureSelectAll(side) {
      var refName = side + 'SelectAll';
      var title = refs[side + 'Title'];
      var input = refs[refName] || null;
      if (!input) {
        input = doc.createElement('input');
        input.type = 'checkbox';
        if (title && title.parentNode) title.parentNode.insertBefore(input, title);
        refs[refName] = input;
      }
      input.classList.add('qxframe9a7c2-transfer-select-all','qxframe9a7c2-form-check-input');
      if (title) title.classList.add('qxframe9a7c2-form-check-label');
      if (input.parentNode && input.parentNode.tagName === 'LABEL') input.parentNode.classList.add('qxframe9a7c2-form-check');
    }
    function ensureFooter(side) {
      var refName = side + 'Footer';
      if (refs[refName]) return;
      var panel = refs[side + 'Panel'];
      var footer = doc.createElement('footer');
      footer.className = 'qxframe9a7c2-transfer-footer';
      refs[refName] = footer;
    }
    function ensurePaginationHost(side) {
      var refName = side + 'Pagination';
      if (refs[refName]) return;
      var panel = refs[side + 'Panel'];
      var footer = refs[side + 'Footer'];
      var host = doc.createElement('div');
      host.className = 'qxframe9a7c2-transfer-pagination';
      refs[refName] = host;
    }
    function ensureTableHost(side) {
      var refName = side + 'Table';
      if (refs[refName]) return;
      var panel = refs[side + 'Panel'];
      var pager = refs[side + 'Pagination'];
      var footer = refs[side + 'Footer'];
      var host = doc.createElement('div');
      host.className = 'qxframe9a7c2-transfer-table-host';
      refs[refName] = host;
    }
    ensureSelectAll('source'); ensureSelectAll('target'); ensureFooter('source'); ensureFooter('target');
    ensurePaginationHost('source'); ensurePaginationHost('target'); ensureTableHost('source'); ensureTableHost('target');
    ['source','target'].forEach(function (side) { detachNode(refs[side + 'Footer']); detachNode(refs[side + 'Pagination']); detachNode(refs[side + 'Table']); });
  }
  function detachNode(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }
  function setSideSurfacePresence(side, kind, present) {
    var node = refs && refs[side + kind];
    var panel = refs && refs[side + 'Panel'];
    if (!node || !panel) return;
    if (!present) { detachNode(node); return; }
    var before = null;
    if (kind === 'Table') {
      var pager = refs[side + 'Pagination'], footer = refs[side + 'Footer'];
      before = pager && pager.parentNode === panel ? pager : (footer && footer.parentNode === panel ? footer : null);
    } else if (kind === 'Pagination') {
      var footerNode = refs[side + 'Footer'];
      before = footerNode && footerNode.parentNode === panel ? footerNode : null;
    }
    if (node.parentNode !== panel || node.nextSibling !== before) panel.insertBefore(node, before);
  }
  function syncOperationDOM() {
    var parent = refs && refs.operations;
    if (!parent) return;
    var desired = [refs.right];
    if (opts.oneWay !== true) desired.push(refs.left);
    if (opts.sortable === true) desired.push(refs.up, refs.down);
    [refs.right, refs.left, refs.up, refs.down].forEach(function (node) { if (node && desired.indexOf(node) < 0) detachNode(node); });
    var before = null;
    for (var i = desired.length - 1; i >= 0; i -= 1) {
      var node = desired[i]; if (!node) continue;
      if (node.parentNode !== parent || node.nextSibling !== before) parent.insertBefore(node, before);
      before = node;
    }
  }

  function listForSide(side) { return side === 'source' ? sourceList : targetList; }
  function tableForSide(side) { return side === 'source' ? sourceTable : targetTable; }
  function setTableForSide(side, table) { if (side === 'source') sourceTable = table; else targetTable = table; }
  function pagerForSide(side) { return side === 'source' ? sourcePagination : targetPagination; }
  function setPagerForSide(side, pager) { if (side === 'source') sourcePagination = pager; else targetPagination = pager; }
  function sideItems(side) { return side === 'source' ? sourceItems() : targetItems(); }
  function syncPaginationCount(side) {
    var pager = pagerForSide(side);
    var list = listForSide(side);
    var hostNode = refs && refs[side + 'Pagination'];
    if (!pager || !list) { setSideSurfacePresence(side, 'Pagination', false); return; }
    setSideSurfacePresence(side, 'Pagination', true);
    var listState = list.getState();
    pager.updateOptions({ count: listState.unpagedVisibleCount, disabled: opts.disabled === true, size: sizeName(opts.size) });
    var pagerState = pager.getState();
    if (listState.page !== pagerState.current || listState.pageSize !== pagerState.pageSize) {
      list.updateOptions({ page: pagerState.current, pageSize: pagerState.pageSize });
    }
  }
  function destroyPagination(side) {
    var pager = pagerForSide(side);
    if (pager) pager.destroy();
    setPagerForSide(side, null);
    var hostNode = refs && refs[side + 'Pagination'];
    if (hostNode) { detachNode(hostNode); hostNode.textContent = ''; }
  }
  function createPagination(side) {
    destroyPagination(side);
    var cfg = paginationConfig(opts.pagination, side);
    var hostNode = refs && refs[side + 'Pagination'];
    if (!cfg || !hostNode) return null;
    setSideSurfacePresence(side, 'Pagination', true);
    var userChange = cfg.onChange;
    var userSizeChange = cfg.onSizeChange;
    var initialCount = sideItems(side).length;
    var pager = Pagination.create(Utils.mergeOwn( cfg, {
      container: hostNode,
      count: initialCount,
      size: sizeName(opts.size),
      disabled: opts.disabled === true,
      onChange: function (current, pageSize, detail) {
        var list = listForSide(side);
        if (list) list.updateOptions({ page: current, pageSize: pageSize });
        syncHeader();
        var payload = { side: side, current: current, pageSize: pageSize, count: detail && detail.state ? detail.state.count : initialCount, originalEvent: detail && detail.originalEvent || null, transfer: api };
        if (Utils.isFunction(userChange)) userChange(current, pageSize, detail);
        if (destroyed) return;
        if (Utils.isFunction(opts.onPageChange)) opts.onPageChange(side, current, pageSize, payload);
        if (!destroyed) api.emit('page-change', payload);
      },
      onSizeChange: function (pageSize, detail) {
        if (Utils.isFunction(userSizeChange)) userSizeChange(pageSize, detail);
      }
    }));
    setPagerForSide(side, pager);
    return pager;
  }
  function syncPaginationControllers(recreate) {
    ['source','target'].forEach(function (side) {
      var cfg = paginationConfig(opts.pagination, side);
      var pager = pagerForSide(side);
      if (recreate || (!!cfg !== !!pager)) { createPagination(side); pager = pagerForSide(side); }
      if (pager) syncPaginationCount(side);
    });
  }
  function destroyTable(side) {
    var table = tableForSide(side);
    if (table) table.destroy();
    setTableForSide(side, null);
    var hostNode = refs && refs[side + 'Table'];
    var panel = refs && refs[side + 'Panel'];
    if (hostNode) { detachNode(hostNode); hostNode.textContent = ''; }
    if (panel) panel.classList.remove('is-table-projection');
  }
  function transferTableColumns(side, config) {
    if (Array.isArray(config.columns) && config.columns.length) return config.columns.slice();
    return [{ key: 'label', title: side === 'source' ? 'Available' : 'Selected', getValue: function (item) { var record = recordByItem.get(item); return record ? record.label : ''; } }];
  }
  function tableProjectionOptions(side, config) {
    var list = listForSide(side);
    var userRowClassName = config.rowClassName;
    var userRowClick = config.onRowClick;
    var output = Utils.mergeOwn( config);
    delete output.source; delete output.target;
    output.container = refs[side + 'Table'];
    output.document = doc;
    output.items = list ? list.getVisibleItems() : [];
    output.columns = transferTableColumns(side, config);
    output.getKey = function (item) { var record = recordByItem.get(item); return record ? record.value : ''; };
    output.isItemDisabled = function (item) { var record = recordByItem.get(item); return !!(record && record.disabled); };
    output.selectionMode = 'none';
    output.page = 1; output.pageSize = 0;
    output.size = sizeName(config.size === undefined ? opts.size : config.size);
    output.disabled = opts.disabled === true; output.readOnly = opts.readOnly === true;
    output.rowClassName = function (item, context) {
      var record = recordByItem.get(item);
      var classes = [];
      if (record && list && list.getSelection().has(record.value)) classes.push('is-transfer-selected');
      var custom = Utils.isFunction(userRowClassName) ? userRowClassName(item, context) : userRowClassName;
      if (custom) classes.push(String(custom));
      return classes.join(' ');
    };
    output.onRowClick = function (item, detail) {
      var record = recordByItem.get(item);
      if (record && !record.disabled && !mutationLocked() && list) {
        list.toggleValue(record.value, { source: 'pointer', reason: 'transfer-table-row', originalEvent: detail && detail.originalEvent || null });
      }
      if (Utils.isFunction(userRowClick)) userRowClick(item, Object.freeze(Utils.mergeOwn( detail || {}, { side: side, transfer: api })));
    };
    return output;
  }
  function syncTableProjection(side, reason) {
    if (!refs) return null;
    var config = tableConfig(opts.table, side);
    var table = tableForSide(side);
    var hostNode = refs[side + 'Table'];
    var panel = refs[side + 'Panel'];
    if (!config) { if (table) destroyTable(side); else { setSideSurfacePresence(side, 'Table', false); if (panel) panel.classList.remove('is-table-projection'); } return null; }
    setSideSurfacePresence(side, 'Table', true);
    if (panel) panel.classList.add('is-table-projection');
    var projection = tableProjectionOptions(side, config);
    if (!table) { table = Table.create(projection); setTableForSide(side, table); }
    else table.updateOptions(projection);
    if (table.getRootElement()) DOM.setPrivate(table.getRootElement(), 'transferProjectionReason', String(reason || 'sync'));
    return table;
  }
  function syncTableProjections(reason) { syncTableProjection('source', reason); syncTableProjection('target', reason); }

  function visibleEnabledValues(side) {
    var list = side === 'source' ? sourceList : targetList;
    if (!list) return [];
    return list.getVisibleItems().map(function (item) { var record = recordByItem.get(item); return record ? record.value : ''; })
      .filter(function (value) { return value && records[value] && !records[value].disabled; });
  }
  function syncSelectAll(side) {
    if (!refs) return;
    var input = refs[side + 'SelectAll'];
    var list = side === 'source' ? sourceList : targetList;
    if (!input || !list) return;
    var enabled = visibleEnabledValues(side);
    var selected = new Set(selectedValues(list));
    var count = enabled.filter(function (value) { return selected.has(value); }).length;
    input.checked = enabled.length > 0 && count === enabled.length;
    input.indeterminate = count > 0 && count < enabled.length;
    input.disabled = mutationLocked() || enabled.length === 0;
  }
  function renderTitle(side, fallback) {
    var host = refs[side + 'Title'];
    var output = Utils.isFunction(opts.renderTitle) ? opts.renderTitle(side, Object.freeze({ side: side, title: fallback, transfer: api })) : fallback;
    Renderer.replace(host, output == null ? '' : output, doc);
  }
  function syncFooter(side) {
    var host = refs[side + 'Footer'];
    if (!host) return;
    var renderer = opts.renderFooter;
    var output = Utils.isFunction(renderer) ? renderer(side, Object.freeze({
      side: side, items: (side === 'source' ? sourceItems() : targetItems()).slice(),
      visibleItems: (side === 'source' ? sourceList : targetList).getVisibleItems().slice(),
      selectedValues: selectedValues(side === 'source' ? sourceList : targetList), transfer: api
    })) : null;
    var present = !(output === undefined || output === null || output === false || output === '');
    Renderer.replace(host, present ? output : '', doc);
    setSideSurfacePresence(side, 'Footer', present);
  }

  function syncClasses() {
    if (!root) return;
    ['xs','sm','md','lg','xl'].forEach(function (size) { root.classList.remove('is-' + size); });
    root.classList.add('is-' + sizeName(opts.size));
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    root.classList.toggle('is-one-way', opts.oneWay === true);
    root.classList.toggle('is-status-error', opts.status === 'error');
    root.classList.toggle('is-status-warning', opts.status === 'warning');
    DOM.setPrivate(root, 'transferStatus', opts.status);
  }

  function syncHeader() {
    if (!refs) return;
    var titles = Array.isArray(opts.titles) ? opts.titles : [];
    var sourceTitle = titles[0] === undefined ? 'Source' : titles[0];
    var targetTitle = titles[1] === undefined ? 'Target' : titles[1];
    renderTitle('source', sourceTitle);
    renderTitle('target', targetTitle);
    DOM.setText(refs.sourceCount, String(sourceItems().length));
    DOM.setText(refs.targetCount, String(targetValues.length));
    syncSelectAll('source'); syncSelectAll('target');
    syncFooter('source'); syncFooter('target');
  }

  function canMoveSelection(side) {
    if (mutationLocked()) return false;
    if (side === 'target' && opts.oneWay === true) return false;
    var list = side === 'source' ? sourceList : targetList;
    return !!list && movable(selectedValues(list), side).length > 0;
  }

  function canMoveSelectedOrder(delta) {
    if (mutationLocked() || opts.sortable !== true || !targetOrder || !targetList || targetValues.length < 2) return false;
    var selected = selectedValues(targetList);
    if (!selected.length) return false;
    var selectedSet = new Set(selected);
    if (delta < 0) {
      for (var i = 1; i < targetValues.length; i += 1) {
        if (selectedSet.has(targetValues[i]) && !selectedSet.has(targetValues[i - 1])) return true;
      }
      return false;
    }
    for (var j = targetValues.length - 2; j >= 0; j -= 1) {
      if (selectedSet.has(targetValues[j]) && !selectedSet.has(targetValues[j + 1])) return true;
    }
    return false;
  }

  function syncOperations() {
    if (!refs || !sourceList || !targetList) return;
    syncOperationDOM();
    refs.right.disabled = !canMoveSelection('source');
    refs.left.disabled = !canMoveSelection('target');
    refs.up.disabled = !canMoveSelectedOrder(-1);
    refs.down.disabled = !canMoveSelectedOrder(1);
  }

  function listProjectionOptions(side) {
    var pager = pagerForSide(side);
    var state = pager ? pager.getState() : null;
    return {
      page: state ? state.current : 1,
      pageSize: state ? state.pageSize : 0,
      virtual: pager ? false : opts.virtual
    };
  }

  function itemRendererForSide(side) {
    if (!Utils.isFunction(opts.itemRender)) return null;
    return function (item, ctx) {
      return opts.itemRender(item, Item.createContext(item, Utils.mergeOwn( ctx || {}, { component:api, controller:api, side:side })));
    };
  }

  function filterItemForSide(side) {
    if (!Utils.isFunction(opts.filterItem)) return undefined;
    return function (query, item, context) {
      return opts.filterItem(query, item, Object.freeze({ side: side, index: context && context.index, label: context && context.label, transfer: api })) !== false;
    };
  }

  function listRuntimeOptions(side) {
    var projection = listProjectionOptions(side);
    return {
      classes: opts.classes,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      size: opts.size,
      searchable: opts.searchable === true,
      virtual: projection.virtual,
      page: projection.page,
      pageSize: projection.pageSize,
      virtualThreshold: opts.virtualThreshold,
      height: opts.height,
      maxHeight: opts.maxHeight,
      getKey: keyOf,
      getValue: valueOf,
      getLabel: labelOf,
      isItemDisabled: disabledOf,
      itemRender: itemRendererForSide(side),
      filterItem: filterItemForSide(side)
    };
  }

  function listOptions(side, listItems) {
    return Utils.assignOwn({
      ownerPrefix: 'transfer',
      itemSemanticClasses: function () { return ['qxframe9a7c2-transfer-item','qxframe9a7c2-transfer-' + side + '-item']; },
      itemClassParts: side === 'source' ? ['item','sourceItem'] : ['item','targetItem'],
      container: side === 'source' ? refs.sourceHost : refs.targetHost,
      items: listItems,
      multiple: true,
      selectionController: selectionController,
      selectionChannel: side === 'source' ? 'sourceChecked' : 'targetChecked',
      onChange: function () { syncOperations(); syncHeader(); syncTableProjection(side, 'selection'); },
      onSearch: function (searchValue, detail) {
        var source = detail && detail.source || 'api';
        var pager = pagerForSide(side);
        if (pager) pager.setCurrent(1, { source: source, reason: 'search-reset', originalEvent: detail && detail.originalEvent || null });
        var payload = { side: side, value: searchValue, source: source, reason: detail && detail.reason || 'search', originalEvent: detail && detail.originalEvent || null, transfer: api };
        if (Utils.isFunction(opts.onSearch)) opts.onSearch(side, searchValue, payload);
        if (destroyed) return;
        api.emit('search', payload);
        if (destroyed) return;
        syncHeader();
      }
    }, listRuntimeOptions(side));
  }

  function selectionForItems(listItems, values) {
    var allowed = new Set((listItems || []).map(function (item) {
      var record = recordByItem.get(item);
      return record ? record.value : '';
    }).filter(Boolean));
    return normalizeValues(values).filter(function (value) { return allowed.has(value); });
  }

  function refreshLists(reason, selectionPolicy) {
    if (!sourceList || !targetList) return;
    var previousSourceSelection = selectedValues(sourceList);
    var previousTargetSelection = selectedValues(targetList);
    var desiredSourceSelection = selectionPolicy && own(selectionPolicy, 'source') ? selectionPolicy.source : previousSourceSelection;
    var desiredTargetSelection = selectionPolicy && own(selectionPolicy, 'target') ? selectionPolicy.target : previousTargetSelection;
    var nextSourceItems = sourceItems();
    var nextTargetItems = targetItems();
    sourceList.updateOptions(Utils.assignOwn(listRuntimeOptions('source'), {
      items: nextSourceItems,
      value: selectionForItems(nextSourceItems, desiredSourceSelection)
    }));
    targetList.updateOptions(Utils.assignOwn(listRuntimeOptions('target'), {
      items: nextTargetItems,
      value: selectionForItems(nextTargetItems, desiredTargetSelection)
    }));
    syncHeader();
    syncOperations();
    syncTableProjections(reason || 'refresh');
    if (formBridge) formBridge.setValue(targetValues, { silent: true, source: 'transfer', reason: reason || 'refresh' });
  }

  function emitChange(previous, detail) {
    detail = detail || {};
    api.setFieldValue(targetValues, { silent: true, force: true });
    if (formBridge) formBridge.setValue(targetValues, { forceEvent: true, source: detail.source || 'api', reason: detail.reason || 'change' });
    var payload = {
      value: targetValues.slice(), previousValue: previous.slice(), direction: detail.direction || 'set',
      movedValues: (detail.movedValues || []).slice(), source: detail.source || 'api', reason: detail.reason || 'change',
      originalEvent: detail.originalEvent || null, transfer: api
    };
    if (Utils.isFunction(opts.onChange)) opts.onChange(targetValues.slice(), payload);
    if (destroyed) return;
    api.emit('change', payload);
  }

  function setValue(nextValue, meta) {
    if (destroyed) return api;
    var next = validateTargetValues(nextValue);
    if (sameArray(next, targetValues)) return api;
    var previous = targetValues.slice();
    targetValues = next;
    api.setFieldValue(targetValues, { silent: true, force: true });
    refreshLists(meta && meta.reason || 'set-value');
    if (!(meta && meta.silent === true)) emitChange(previous, Utils.assignOwn({ direction: 'set' }, meta || {}));
    return api;
  }

  function setItems(nextItems, meta) {
    if (destroyed) return api;
    if (!Array.isArray(nextItems)) throw new TypeError('[QXFRAME9A7C2] Transfer setItems() expects an array.');
    items = nextItems.slice();
    indexItems(items);
    var previous = targetValues.slice();
    targetValues = targetValues.filter(function (value) { return !!records[value]; });
    api.setFieldValue(targetValues, { silent: true, force: true });
    refreshLists(meta && meta.reason || 'set-items');
    if (!sameArray(previous, targetValues) && !(meta && meta.silent === true)) {
      emitChange(previous, { direction: 'set', movedValues: [], source: meta && meta.source || 'api', reason: meta && meta.reason || 'items-pruned' });
    }
    return api;
  }

  function movable(values, side) {
    var allowed = [];
    normalizeValues(values).forEach(function (value) {
      var record = records[value];
      if (!record || record.disabled) return;
      var inTarget = targetValues.indexOf(value) >= 0;
      if (side === 'source' && !inTarget) allowed.push(value);
      if (side === 'target' && inTarget) allowed.push(value);
    });
    return allowed;
  }

  function moveToRight(values, meta) {
    if (mutationLocked()) return false;
    var sourceSelection = selectedValues(sourceList);
    var targetSelection = selectedValues(targetList);
    var selected = values === undefined ? sourceSelection : normalizeValues(values);
    var moved = movable(selected, 'source');
    if (!moved.length) return false;
    var previous = targetValues.slice();
    var moving = new Set(moved);
    var selectedMoved = moved.filter(function (value) { return sourceSelection.indexOf(value) >= 0; });
    items.forEach(function (item, index) {
      var value = String(valueOf(item, index));
      if (moving.has(value) && targetValues.indexOf(value) < 0) targetValues.push(value);
    });
    refreshLists(meta && meta.reason || 'move-right', {
      source: sourceSelection.filter(function (value) { return !moving.has(value); }),
      target: targetSelection.concat(selectedMoved)
    });
    emitChange(previous, { direction: 'right', movedValues: moved, source: meta && meta.source || 'api', reason: meta && meta.reason || 'move-right', originalEvent: meta && meta.originalEvent });
    return true;
  }

  function moveToLeft(values, meta) {
    if (mutationLocked() || opts.oneWay === true) return false;
    var sourceSelection = selectedValues(sourceList);
    var targetSelection = selectedValues(targetList);
    var selected = values === undefined ? targetSelection : normalizeValues(values);
    var moved = movable(selected, 'target');
    if (!moved.length) return false;
    var previous = targetValues.slice();
    var moving = new Set(moved);
    var selectedMoved = moved.filter(function (value) { return targetSelection.indexOf(value) >= 0; });
    targetValues = targetValues.filter(function (value) { return !moving.has(value); });
    refreshLists(meta && meta.reason || 'move-left', {
      source: sourceSelection.concat(selectedMoved),
      target: targetSelection.filter(function (value) { return !moving.has(value); })
    });
    emitChange(previous, { direction: 'left', movedValues: moved, source: meta && meta.source || 'api', reason: meta && meta.reason || 'move-left', originalEvent: meta && meta.originalEvent });
    return true;
  }

  function move(value, toIndex, meta) {
    if (mutationLocked() || opts.sortable !== true || !targetOrder) return false;
    value = String(value);
    var index = Math.floor(Number(toIndex));
    if (!Number.isFinite(index)) return false;
    var previous = targetValues.slice();
    var result = targetOrder.move(value, index, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'sort', originalEvent: meta && meta.originalEvent });
    if (!result.changed) return false;
    refreshLists(meta && meta.reason || 'sort');
    emitChange(previous, { direction: 'sort', movedValues: [value], source: meta && meta.source || 'api', reason: meta && meta.reason || 'sort', originalEvent: meta && meta.originalEvent });
    return true;
  }

  function moveSelected(delta, meta) {
    if (!canMoveSelectedOrder(delta)) return false;
    var selected = selectedValues(targetList);
    var selectedSet = new Set(selected);
    var previous = targetValues.slice();
    if (delta < 0) {
      for (var i = 1; i < targetValues.length; i += 1) {
        var current = targetValues[i];
        if (selectedSet.has(current) && !selectedSet.has(targetValues[i - 1])) targetOrder.move(current, i - 1, { silent: true, source: 'transfer', reason: 'sort-selected-up' });
      }
    } else {
      for (var j = targetValues.length - 2; j >= 0; j -= 1) {
        var value = targetValues[j];
        if (selectedSet.has(value) && !selectedSet.has(targetValues[j + 1])) targetOrder.move(value, j + 1, { silent: true, source: 'transfer', reason: 'sort-selected-down' });
      }
    }
    if (sameArray(previous, targetValues)) return false;
    refreshLists(meta && meta.reason || 'sort-selected');
    emitChange(previous, { direction: 'sort', movedValues: selected, source: meta && meta.source || 'api', reason: meta && meta.reason || 'sort-selected', originalEvent: meta && meta.originalEvent });
    return true;
  }

  function selectAll(side, selected) {
    if (destroyed) return false;
    var list = side === 'source' ? sourceList : side === 'target' ? targetList : null;
    if (!list) throw new TypeError('[QXFRAME9A7C2] Transfer selectAll() side must be "source" or "target".');
    var visibleValues = visibleEnabledValues(side);
    var current = selectedValues(list);
    var visibleSet = new Set(visibleValues);
    // Select-all owns the current visible/filter/page projection only. Hidden selections
    // remain selected, regardless of whether Pagination is enabled. Treating the
    // no-pager case as a global replace makes a filtered header checkbox silently
    // erase selections that the user cannot currently see.
    var values = selected === false
      ? current.filter(function (value) { return !visibleSet.has(value); })
      : current.concat(visibleValues.filter(function (value) { return current.indexOf(value) < 0; }));
    list.setValue(values, { source: 'api', reason: selected === false ? 'select-none' : 'select-all' });
    syncOperations(); syncHeader(); syncTableProjection(side, selected === false ? 'select-none' : 'select-all');
    return true;
  }

  function setSearch(side, value) {
    var list = side === 'source' ? sourceList : side === 'target' ? targetList : null;
    if (!list) throw new TypeError('[QXFRAME9A7C2] Transfer setSearch() side must be "source" or "target".');
    list.setSearch(value, { source: 'api', reason: 'set-search' });
    return api;
  }

  function applyOptions(nextOptions, patch) {
    if (destroyed) return api;
    var next = patch || {};
    var candidate = Utils.mergeOwn(nextOptions);
    if (!Array.isArray(candidate.items)) throw new TypeError('[QXFRAME9A7C2] Transfer items must be an array.');
    if (!Array.isArray(candidate.value)) throw new TypeError('[QXFRAME9A7C2] Transfer value must be an array.');
    candidate.status = statusName(candidate.status);
    paginationConfig(candidate.pagination, 'source'); paginationConfig(candidate.pagination, 'target');
    tableConfig(candidate.table, 'source'); tableConfig(candidate.table, 'target');
    opts = candidate;
    var mappingChanged = own(next, 'getKey') || own(next, 'getValue') || own(next, 'getLabel') || own(next, 'isItemDisabled');
    if (own(next, 'items')) items = next.items.slice();
    if (own(next, 'items') || mappingChanged) {
      indexItems(items);
      targetValues = targetValues.filter(function (value) { return !!records[value]; });
    }
    if (own(next, 'value')) targetValues = validateTargetValues(next.value);
    api.setFieldValue(targetValues, { silent: true, force: true });
    syncClasses();
    if (own(next, 'pagination')) syncPaginationControllers(true);
    else syncPaginationControllers(false);
    refreshLists('options');
    syncTableProjections('options');
    if (formBridge) formBridge.updateOptions({ name: opts.name, disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true, serializeValue: opts.serializeValue });
    return api;
  }

  function getState() {
    return Object.freeze({
      value: targetValues.slice(),
      sourceValues: sourceItems().map(function (item) { var record = recordByItem.get(item); return record ? record.value : ''; }).filter(Boolean),
      sourceSelectedValues: selectedValues(sourceList),
      targetSelectedValues: selectedValues(targetList),
      sourceSearchValue: sourceList ? sourceList.getState().searchValue : '',
      targetSearchValue: targetList ? targetList.getState().searchValue : '',
      sourcePagination: sourcePagination ? sourcePagination.getState() : null,
      targetPagination: targetPagination ? targetPagination.getState() : null,
      sourceProjection: sourceTable ? 'table' : 'list',
      targetProjection: targetTable ? 'table' : 'list',
      status: opts.status,
      disabled: opts.disabled === true, readOnly: opts.readOnly === true, oneWay: opts.oneWay === true,
      destroyed: destroyed
    });
  }

  function destroyRuntime() {
    if (destroyed) return false;
    destroyed = true;
    destroyPagination('source');
    destroyPagination('target');
    destroyTable('source');
    destroyTable('target');
    if (sourceList) sourceList.destroy();
    if (targetList) targetList.destroy();
    if (targetOrder) targetOrder.destroy();
    if (selectionController) selectionController.destroy();
    sourceList = null; targetList = null; targetOrder = null; selectionController = null; sourcePagination = null; targetPagination = null; sourceTable = null; targetTable = null;
    scope.dispose();
    if (formBridge) formBridge.destroy(); formBridge = null;
    if (domBinding) domBinding.release();
    domBinding = null; root = null; refs = null; host = null;
    items = []; targetValues = []; records = Object.create(null); recordByItem = new WeakMap();
    return true;
  }

  domBinding = DOMBinding.resolve({
    options: opts, target: host, component: api,
    requiredRefs: ['root','sourcePanel','sourceTitle','sourceCount','sourceHost','operations','right','left','up','down','targetPanel','targetTitle','targetCount','targetHost'],
    defaultFactory: DOMFactory.createDefaultDOM
  });
  refs = domBinding.refs; root = refs.root;
  if (!host && opts.formField && domBinding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
  ensureOptionalSurfaces();
  items = opts.items.slice();
  indexItems(items);
  targetValues = validateTargetValues(opts.value);
  var initialValue = targetValues.slice();
  formBridge = Control.createFormFieldBridge({ root: root, target: host, formField: opts.formField, document: doc, moveIntoRoot: false, projectLayout: Control.projectFormFieldLayout, name: opts.name, disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true, value: targetValues, serializeValue: opts.serializeValue, getValue: function () { return targetValues.slice(); }, onReset: function () { setValue(initialValue, { silent: true, source: 'form', reason: 'reset' }); } });
  targetOrder = Collection.create({
    getItems: function () { return targetValues; },
    setItems: function (next) { targetValues = next.slice(); },
    getKey: function (value) { return String(value); }
  });
  createPagination('source');
  createPagination('target');
  selectionController = SelectionController.create({
    channels: {
      sourceChecked: { multiple: true, value: [] },
      targetChecked: { multiple: true, value: [] }
    }
  });
  sourceList = ItemCollection.create(listOptions('source', sourceItems()));
  targetList = ItemCollection.create(listOptions('target', targetItems()));
  scope.add(sourceList.on('render', function () { syncPaginationCount('source'); syncTableProjection('source', 'list-render'); }));
  scope.add(targetList.on('render', function () { syncPaginationCount('target'); syncTableProjection('target', 'list-render'); }));
  syncPaginationControllers(false);

  scope.add(DOM.listen(refs.right, 'click', function (event) { moveToRight(undefined, { source: DOM.activationSource(event), reason: 'move-right', originalEvent: event }); }));
  scope.add(DOM.listen(refs.left, 'click', function (event) { moveToLeft(undefined, { source: DOM.activationSource(event), reason: 'move-left', originalEvent: event }); }));
  scope.add(DOM.listen(refs.up, 'click', function (event) { moveSelected(-1, { source: DOM.activationSource(event), reason: 'move-up', originalEvent: event }); }));
  scope.add(DOM.listen(refs.down, 'click', function (event) { moveSelected(1, { source: DOM.activationSource(event), reason: 'move-down', originalEvent: event }); }));
  scope.add(DOM.listen(refs.sourceSelectAll, 'change', function (event) { selectAll('source', event.target.checked); }));
  scope.add(DOM.listen(refs.targetSelectAll, 'change', function (event) { selectAll('target', event.target.checked); }));



  var record = {
    move: move, moveToRight: moveToRight, moveToLeft: moveToLeft, selectAll: selectAll, setSearch: setSearch,
    setPage: function (side, current) {
      var pager = pagerForSide(side);
      if (!pager) throw new TypeError('[QXFRAME9A7C2] Transfer setPage() requires pagination for side "' + side + '".');
      pager.setCurrent(current, { source: 'api', reason: 'set-page' });
      return api;
    },
    setValue: setValue, setItems: setItems, applyOptions: applyOptions, getState: getState,
    getSourceList: function () { return sourceList; }, getTargetList: function () { return targetList; },
    getSelectionController: function () { return selectionController; },
    getSourcePagination: function () { return sourcePagination; }, getTargetPagination: function () { return targetPagination; },
    getSourceTable: function () { return sourceTable; }, getTargetTable: function () { return targetTable; },
    getRootElement: function () { return root; }, getFormField: function () { return formBridge ? formBridge.getFormField() : null; },
    getFormBridge: function () { return formBridge; }, getRefs: function () { return refs; }
  };
  state.runtime = record;
  api.own(destroyRuntime);
  api.bindFocusTarget(root);
  api.setFieldValue(targetValues, { silent: true, force: true });
  syncTableProjections('init');
  syncClasses(); syncHeader(); syncOperations();
  return root;
}

function resolveTransferOptions(source, overrides) {
  var fieldInit = Control.resolveFieldOptions(source, overrides);
  var incoming = Utils.mergeOwn(fieldInit.options);
  if (fieldInit.hasNativeValue && !own(incoming, 'value')) {
    var rawNative = String(fieldInit.nativeValue == null ? '' : fieldInit.nativeValue);
    incoming.value = rawNative === '' ? [] : rawNative.split(',').filter(function (value) { return value !== ''; });
  }
  var opts = Utils.mergeOwn(TRANSFER_DEFAULTS, incoming);
  if (!opts.container && opts.elements == null && !opts.formField) throw new TypeError('[QXFRAME9A7C2] Transfer requires target/container, formField, or options.elements.');
  if (!Array.isArray(opts.items)) throw new TypeError('[QXFRAME9A7C2] Transfer items must be an array.');
  if (!Array.isArray(opts.value)) throw new TypeError('[QXFRAME9A7C2] Transfer value must be an array.');
  opts.status = statusName(opts.status);
  paginationConfig(opts.pagination, 'source'); paginationConfig(opts.pagination, 'target');
  tableConfig(opts.table, 'source'); tableConfig(opts.table, 'target');
  return { fieldInit: fieldInit, options: opts };
}
function recordForTransfer(instance) {
  var state = transferState.get(instance), record = state && state.runtime;
  if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Transfer instance.');
  return record;
}

export class Transfer extends FieldComponent {
  static profile = Object.freeze({
    name:'Transfer',
    selection:Object.freeze({ channels:Object.freeze(['sourceChecked','targetChecked']), targetValueOwner:'Transfer/targetOrder' }),
    ownership:Object.freeze({ selection:'SelectionController' })
  });
  static contract = ComponentContracts.get('Transfer');
  static immutableOptions = Object.freeze(['target','container','formField']);
  static createDefaultDOM = DOMFactory.createDefaultDOM;
  static create(source = {}, overrides) { return new this(source, overrides).render(); }
  static enhance(input, options) { return this.create(input, options || {}); }

  constructor(source = {}, overrides) {
    var resolved = resolveTransferOptions(source, overrides);
    super(resolved.options);
    transferState.set(this, { fieldInit: resolved.fieldInit, runtime: null });
  }

  [componentHooks.render]() {
    var state = transferState.get(this);
    return state.runtime ? state.runtime.getRootElement() : setupTransfer(this);
  }
  [fieldHooks.fieldOptionsUpdated](next, _previous, patch) {
    var state = transferState.get(this);
    if (state && state.runtime) state.runtime.applyOptions(next, patch);
  }

  move(value, toIndex, meta) { return recordForTransfer(this).move(value, toIndex, meta); }
  moveToRight(values, meta) { return recordForTransfer(this).moveToRight(values, meta); }
  moveToLeft(values, meta) { return recordForTransfer(this).moveToLeft(values, meta); }
  selectAll(side, selected) { return recordForTransfer(this).selectAll(side, selected); }
  setSearch(side, value) { return recordForTransfer(this).setSearch(side, value); }
  setPage(side, current) { return recordForTransfer(this).setPage(side, current); }
  setValue(value, meta) { return recordForTransfer(this).setValue(value, meta); }
  setItems(items, meta) { return recordForTransfer(this).setItems(items, meta); }
  setDisabled(value) { return this.updateOptions({ disabled: value === true }); }
  setReadOnly(value) { return this.updateOptions({ readOnly: value === true }); }
  getState() { return recordForTransfer(this).getState(); }
  getSourceList() { return recordForTransfer(this).getSourceList(); }
  getTargetList() { return recordForTransfer(this).getTargetList(); }
  getSelectionController() { return recordForTransfer(this).getSelectionController(); }
  getSourcePagination() { return recordForTransfer(this).getSourcePagination(); }
  getTargetPagination() { return recordForTransfer(this).getTargetPagination(); }
  getSourceTable() { return recordForTransfer(this).getSourceTable(); }
  getTargetTable() { return recordForTransfer(this).getTargetTable(); }
  getRootElement() { return recordForTransfer(this).getRootElement(); }
  getFormField() { return recordForTransfer(this).getFormField(); }
  getFormBridge() { return recordForTransfer(this).getFormBridge(); }
  getRefs() { return recordForTransfer(this).getRefs(); }
}

export { createDefaultDOM };
export default Transfer;
