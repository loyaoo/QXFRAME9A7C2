// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { mergeOptions } from './options.js';
import { Selection } from './selection.js';
import { PaginationModel } from './paginationModel.js';

var LEGACY_OPTIONS = Object.freeze(['target','el','mount','dataSource','rowKey','rowSelection','expandable','onChangePage']);
function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
function rejectLegacy(options) {
  LEGACY_OPTIONS.forEach(function (name) {
    if (own(options, name)) throw new TypeError('[QXFRAME9A7C2] TableModel does not accept legacy option "' + name + '".');
  });
}
function normalizeItems(items) {
  if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] TableModel items must be an array.');
  return items.slice();
}
function normalizeColumns(columns) {
  if (!Array.isArray(columns)) throw new TypeError('[QXFRAME9A7C2] TableModel columns must be an array.');
  var seen = Object.create(null);
  return columns.map(function (column) {
    if (!column || typeof column !== 'object') throw new TypeError('[QXFRAME9A7C2] TableModel columns must be objects.');
    if (column.key === undefined || column.key === null || column.key === '') throw new TypeError('[QXFRAME9A7C2] TableModel column.key is required.');
    var key = String(column.key);
    if (seen[key]) throw new TypeError('[QXFRAME9A7C2] TableModel column.key must be unique: ' + key + '.');
    seen[key] = true;
    if (column.sortable !== undefined && column.sortable !== true && column.sortable !== false && typeof column.sortable !== 'function') {
      throw new TypeError('[QXFRAME9A7C2] TableModel column.sortable must be boolean or function.');
    }
    if (column.filter !== undefined && typeof column.filter !== 'function') throw new TypeError('[QXFRAME9A7C2] TableModel column.filter must be a function.');
    return Object.assign({}, column, { key: key });
  });
}
function normalizeSelectionMode(value) {
  var mode = String(value == null ? 'none' : value).toLowerCase();
  if (['none','single','multiple'].indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] TableModel selectionMode must be none, single, or multiple.');
  return mode;
}
function normalizeSortOrder(value) {
  if (value === undefined || value === null || value === '' || value === false) return null;
  var order = String(value).toLowerCase();
  if (order === 'asc') order = 'ascend';
  if (order === 'desc') order = 'descend';
  if (order !== 'ascend' && order !== 'descend') throw new TypeError('[QXFRAME9A7C2] TableModel sortOrder must be ascend, descend, or null.');
  return order;
}
function normalizeFilters(value) {
  if (value === undefined || value === null) return Object.create(null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] TableModel filters must be an object keyed by column key.');
  var output = Object.create(null);
  Object.keys(value).forEach(function (key) {
    var current = value[key];
    if (current === undefined || current === null || current === '' || (Array.isArray(current) && !current.length)) return;
    output[String(key)] = Array.isArray(current) ? current.slice() : [current];
  });
  return output;
}
function positiveInt(value, fallback) {
  var number = Math.floor(Number(value));
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function create(options) {
  var source = options || {};
  rejectLegacy(source);
  var opts = mergeOptions({
    items: [], columns: [], getKey: null, isItemDisabled: null,
    selectionMode: 'none', selectedKeys: [], expandedKeys: [], preserveSelectedKeys: false,
    sortKey: null, sortOrder: null, filters: {}, searchValue: '', searchMatcher: null, remote: false, total: null, filteredTotal: null, page: 1, pageSize: 0
  }, source);
  var emitter = Events.createEmitter();
  var destroyed = false;
  var api = null;
  var items = normalizeItems(opts.items);
  var columns = normalizeColumns(opts.columns);
  var selectionMode = normalizeSelectionMode(opts.selectionMode);
  var sortKey = opts.sortKey == null || opts.sortKey === '' ? null : String(opts.sortKey);
  var sortOrder = normalizeSortOrder(opts.sortOrder);
  var filters = normalizeFilters(opts.filters);
  var searchValue = opts.searchValue == null ? '' : String(opts.searchValue);
  var remote = opts.remote === true;
  var remoteTotal = opts.total == null ? items.length : Math.max(0, Math.floor(Number(opts.total) || 0));
  var remoteFilteredTotal = opts.filteredTotal == null ? remoteTotal : Math.max(0, Math.floor(Number(opts.filteredTotal) || 0));
  var expanded = new Set((Array.isArray(opts.expandedKeys) ? opts.expandedKeys : []).map(String));
  var keyIndex = new Map();
  var columnIndex = new Map();
  var projectionVersion = 0;
  var cachedFilteredEntries = null;
  var cachedOrderedEntries = null;
  var cachedVisibleEntries = null;
  var cachedProjection = null;
  var projectionDiagnostics = { projectionBuilds: 0, filterRuns: 0, sortRuns: 0, pageRuns: 0, dataVersion: 0, filterVersion: 0, sortVersion: 0, pageVersion: 0, selectionVersion: 0 };
  var collator = typeof Intl !== 'undefined' && Intl.Collator ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;

  function invalidateProjection(stage) {
    projectionVersion += 1; cachedProjection = null;
    if (stage === 'state') return;
    if (stage === 'page') { projectionDiagnostics.pageVersion += 1; cachedVisibleEntries = null; return; }
    if (stage === 'sort') { projectionDiagnostics.sortVersion += 1; projectionDiagnostics.pageVersion += 1; cachedOrderedEntries = null; cachedVisibleEntries = null; return; }
    if (stage === 'filter') { projectionDiagnostics.filterVersion += 1; projectionDiagnostics.sortVersion += 1; projectionDiagnostics.pageVersion += 1; cachedFilteredEntries = null; cachedOrderedEntries = null; cachedVisibleEntries = null; return; }
    projectionDiagnostics.dataVersion += 1; projectionDiagnostics.filterVersion += 1; projectionDiagnostics.sortVersion += 1; projectionDiagnostics.pageVersion += 1;
    cachedFilteredEntries = null; cachedOrderedEntries = null; cachedVisibleEntries = null;
  }
  function keyOf(item, index) {
    var raw;
    if (Utils.isFunction(opts.getKey)) raw = opts.getKey(item, index);
    else if (item && typeof item === 'object' && item.key !== undefined) raw = item.key;
    else raw = index;
    if (raw === undefined || raw === null || raw === '') throw new TypeError('[QXFRAME9A7C2] TableModel item key must not be empty.');
    return String(raw);
  }
  function assertUniqueKeys(list) {
    var seen = Object.create(null);
    list.forEach(function (item, index) {
      var key = keyOf(item, index);
      if (seen[key]) throw new TypeError('[QXFRAME9A7C2] TableModel item keys must be unique: ' + key + '.');
      seen[key] = true;
    });
  }
  assertUniqueKeys(items);
  function rebuildIndexes() {
    keyIndex.clear();
    items.forEach(function (item, index) { keyIndex.set(keyOf(item, index), index); });
    columnIndex.clear();
    columns.forEach(function (column, index) { columnIndex.set(column.key, index); });
  }
  rebuildIndexes();

  function columnByKey(key) {
    var normalized = String(key == null ? '' : key);
    var index = columnIndex.get(normalized);
    return index === undefined ? null : columns[index];
  }
  function cellValue(item, column, index) {
    if (Utils.isFunction(column.value)) return column.value(item, index, api);
    if (Utils.isFunction(column.getValue)) return column.getValue(item, index, api);
    var field = column.field === undefined || column.field === null || column.field === '' ? column.key : column.field;
    if (item && typeof item === 'object') return item[field];
    return undefined;
  }
  function orthogonalValue(kind, item, column, index) {
    var raw = cellValue(item, column, index);
    var resolver = column && column[kind + 'Value'];
    return Utils.isFunction(resolver) ? resolver(raw, item, index, api) : raw;
  }
  function isDisabled(item, index) {
    if (Utils.isFunction(opts.isItemDisabled)) return opts.isItemDisabled(item, index, api) === true;
    return !!(item && typeof item === 'object' && item.disabled === true);
  }
  function defaultCompare(left, right) {
    if (left === right) return 0;
    if (left === undefined || left === null) return -1;
    if (right === undefined || right === null) return 1;
    if (typeof left === 'number' && typeof right === 'number') return left - right;
    return collator ? collator.compare(String(left), String(right)) : String(left).localeCompare(String(right));
  }
  function searchableColumns() { return columns.filter(function (column) { return column.searchable !== false; }); }
  function matchesSearch(entry) {
    if (!searchValue) return true;
    if (Utils.isFunction(opts.searchMatcher)) return opts.searchMatcher(searchValue, entry.item, entry.sourceIndex, api) !== false;
    var query = searchValue.toLocaleLowerCase ? searchValue.toLocaleLowerCase() : searchValue.toLowerCase();
    return searchableColumns().some(function (column) {
      var value = orthogonalValue('search', entry.item, column, entry.sourceIndex);
      var text = value == null ? '' : String(value);
      text = text.toLocaleLowerCase ? text.toLocaleLowerCase() : text.toLowerCase();
      return text.indexOf(query) >= 0;
    });
  }
  function filteredItems() {
    if (cachedFilteredEntries) return cachedFilteredEntries;
    projectionDiagnostics.filterRuns += 1;
    var base = items.map(function (item, index) { return { item: item, sourceIndex: index, key: keyOf(item, index) }; });
    if (remote) { cachedFilteredEntries = base; return cachedFilteredEntries; }
    var activeKeys = Object.keys(filters);
    if (!activeKeys.length && !searchValue) { cachedFilteredEntries = base; return cachedFilteredEntries; }
    cachedFilteredEntries = base.filter(function (entry) {
      if (!matchesSearch(entry)) return false;
      return activeKeys.every(function (key) {
        var column = columnByKey(key);
        if (!column) return true;
        var values = filters[key] || [];
        if (!values.length) return true;
        var value = orthogonalValue('filter', entry.item, column, entry.sourceIndex);
        if (Utils.isFunction(column.filter)) return values.some(function (filterValue) { return column.filter(filterValue, entry.item, value, api) !== false; });
        return values.some(function (filterValue) { return String(value) === String(filterValue); });
      });
    });
    return cachedFilteredEntries;
  }
  function orderedItems() {
    if (cachedOrderedEntries) return cachedOrderedEntries;
    projectionDiagnostics.sortRuns += 1;
    var projected = filteredItems();
    if (remote || !sortKey || !sortOrder) { cachedOrderedEntries = projected.slice(); return cachedOrderedEntries; }
    var column = columnByKey(sortKey);
    if (!column || column.sortable === false) { cachedOrderedEntries = projected.slice(); return cachedOrderedEntries; }
    var direction = sortOrder === 'descend' ? -1 : 1;
    cachedOrderedEntries = projected.map(function (entry, index) { return { entry: entry, stableIndex: index }; }).sort(function (a, b) {
      var result;
      if (Utils.isFunction(column.sortable)) result = column.sortable(a.entry.item, b.entry.item, api);
      else result = defaultCompare(orthogonalValue('sort', a.entry.item, column, a.entry.sourceIndex), orthogonalValue('sort', b.entry.item, column, b.entry.sourceIndex));
      result = Number(result) || 0;
      return result ? result * direction : a.stableIndex - b.stableIndex;
    }).map(function (wrapped) { return wrapped.entry; });
    return cachedOrderedEntries;
  }

  var pagination = PaginationModel.create({
    page: positiveInt(opts.page, 1),
    pageSize: positiveInt(opts.pageSize, Math.max(1, items.length || 1)),
    total: remote ? remoteFilteredTotal : items.length,
    onChange: function (_state, detail) {
      if (destroyed || detail.silent === true) return;
      invalidateProjection('page');
      notify(detail.reason === 'page-size' ? 'page-size' : 'page', detail.previousState, { source: detail.source || 'pagination', paginationReason: detail.reason });
    }
  });
  function paginationEnabled() { return positiveInt(opts.pageSize, 0) > 0; }
  function syncPaginationTotal(meta, knownTotal) {
    var total = remote ? remoteFilteredTotal : (knownTotal === undefined ? orderedItems().length : Math.max(0, Math.floor(Number(knownTotal) || 0)));
    pagination.setTotal(total, mergeOptions({ silent: true, source: 'table-model' }, meta));
    if (!paginationEnabled()) pagination.setPage(1, { silent: true, source: 'table-model' });
  }

  var selection = Selection.create({
    multiple: selectionMode === 'multiple',
    values: Array.isArray(opts.selectedKeys) ? opts.selectedKeys : [],
    isDisabled: function (key) {
      var entry = itemEntryByKey(key);
      return !entry || isDisabled(entry.item, entry.sourceIndex);
    },
    onChange: function (values, detail) {
      if (destroyed || detail.silent === true) return;
      projectionDiagnostics.selectionVersion += 1;
      invalidateProjection('state');
      var nextProjection = projection('selection');
      if (Utils.isFunction(opts.onSelectionChange)) opts.onSelectionChange(values.slice(), mergeOptions(detail, { state: nextProjection.state, projection: nextProjection, controller: api }));
      notify('selection', null, { source: detail.source || 'selection', selectionReason: detail.reason }, nextProjection);
    }
  });

  function itemEntryByKey(key) {
    var normalized = String(key == null ? '' : key);
    var index = keyIndex.get(normalized);
    return index === undefined ? null : { item: items[index], sourceIndex: index, key: normalized };
  }
  function projection(reason) {
    if (cachedProjection) return cachedProjection;
    projectionDiagnostics.projectionBuilds += 1;
    var all = orderedItems();
    syncPaginationTotal({ reason: reason || 'projection' }, all.length);
    var pageState = pagination.snapshot();
    var visible = cachedVisibleEntries;
    if (!visible) {
      projectionDiagnostics.pageRuns += 1;
      visible = remote ? all.slice() : (paginationEnabled() ? all.slice(pageState.startIndex, pageState.endIndex) : all.slice());
      cachedVisibleEntries = visible;
    }
    var state = Object.freeze({
      items: items.slice(),
      columns: columns.slice(),
      filteredCount: remote ? remoteFilteredTotal : all.length,
      visibleItems: visible.map(function (entry) { return entry.item; }),
      visibleKeys: visible.map(function (entry) { return entry.key; }),
      selectedKeys: selection.values.slice(),
      expandedKeys: Array.from(expanded),
      selectionMode: selectionMode,
      sortKey: sortKey,
      sortOrder: sortOrder,
      filters: Object.keys(filters).reduce(function (out, key) { out[key] = filters[key].slice(); return out; }, {}),
      searchValue: searchValue,
      remote: remote,
      page: paginationEnabled() ? pageState.page : 1,
      pageSize: paginationEnabled() ? pageState.pageSize : 0,
      pageCount: paginationEnabled() ? pageState.pageCount : (all.length ? 1 : 0),
      total: remote ? remoteTotal : items.length,
      filteredTotal: remote ? remoteFilteredTotal : all.length,
      projectionVersion: projectionVersion,
      destroyed: destroyed
    });
    cachedProjection = Object.freeze({ entries: Object.freeze(visible.slice()), state: state });
    return cachedProjection;
  }
  function projectedEntries() { return projection('project').entries.slice(); }
  function snapshot() { return projection('snapshot').state; }
  function notify(reason, previousState, meta, suppliedProjection) {
    var nextProjection = suppliedProjection || projection('notify');
    var detail = mergeOptions({ reason: reason, source: 'api', previousState: previousState || null }, meta);
    detail.reason = reason;
    detail.previousState = previousState || null;
    detail.state = nextProjection.state;
    detail.projection = nextProjection;
    detail.controller = api;
    if (detail.silent !== true) {
      if (Utils.isFunction(opts.onChange)) opts.onChange(detail.state, detail);
      emitter.emit('change', detail);
    }
    return true;
  }
  function setSort(key, order, meta) {
    if (destroyed) return false;
    var nextKey = key == null || key === '' ? null : String(key);
    var nextOrder = normalizeSortOrder(order);
    if (nextKey && !columnByKey(nextKey)) throw new TypeError('[QXFRAME9A7C2] TableModel sort key is not a current column: ' + nextKey + '.');
    var previous = snapshot();
    if (sortKey === nextKey && sortOrder === nextOrder) return true;
    sortKey = nextKey;
    sortOrder = nextOrder;
    pagination.setPage(1, { silent: true, source: 'table-model' });
    invalidateProjection('sort');
    return notify('sort', previous, meta);
  }
  function setFilter(key, value, meta) {
    if (destroyed) return false;
    var normalized = String(key == null ? '' : key);
    if (!columnByKey(normalized)) throw new TypeError('[QXFRAME9A7C2] TableModel filter key is not a current column: ' + normalized + '.');
    var previous = snapshot();
    var next = normalizeFilters((function () {
      var copy = Object.keys(filters).reduce(function (out, current) { out[current] = filters[current].slice(); return out; }, {});
      copy[normalized] = value;
      return copy;
    })());
    filters = next;
    pagination.setPage(1, { silent: true, source: 'table-model' });
    invalidateProjection('filter');
    return notify('filter', previous, meta);
  }
  function setFilters(nextFilters, meta) {
    if (destroyed) return false;
    var normalized = normalizeFilters(nextFilters);
    Object.keys(normalized).forEach(function (key) {
      if (!columnByKey(key)) throw new TypeError('[QXFRAME9A7C2] TableModel filter key is not a current column: ' + key + '.');
    });
    var previous = snapshot();
    filters = normalized;
    pagination.setPage(1, { silent: true, source: 'table-model' });
    invalidateProjection('filter');
    return notify('filters', previous, meta);
  }
  function setSearchValue(value, meta) {
    if (destroyed) return false;
    var normalized = value == null ? '' : String(value);
    if (searchValue === normalized) return true;
    var previous = snapshot();
    searchValue = normalized;
    pagination.setPage(1, { silent: true, source: 'table-model' });
    invalidateProjection('filter');
    return notify('search', previous, meta);
  }
  function setRemoteData(nextItems, totals, meta) {
    if (destroyed) return false;
    var normalized = normalizeItems(nextItems);
    assertUniqueKeys(normalized);
    var previous = snapshot();
    var info = totals && typeof totals === 'object' ? totals : {};
    items = normalized;
    remoteTotal = info.total == null ? remoteTotal : Math.max(0, Math.floor(Number(info.total) || 0));
    remoteFilteredTotal = info.filteredTotal == null ? (info.total == null ? remoteFilteredTotal : remoteTotal) : Math.max(0, Math.floor(Number(info.filteredTotal) || 0));
    rebuildIndexes();
    invalidateProjection();
    syncPaginationTotal({ reason: 'remote-data' });
    var keys = new Set(items.map(function (item, index) { return keyOf(item, index); }));
    if (opts.preserveSelectedKeys !== true) selection.set(selection.values.filter(function (key) { return keys.has(key); }), { silent: true, source: 'remote-data', reason: 'prune' });
    Array.from(expanded).forEach(function (key) { if (!keys.has(key)) expanded.delete(key); });
    return notify('remote-result', previous, mergeOptions({ source: 'remote' }, meta));
  }
  function setItems(nextItems, meta) {
    if (destroyed) return false;
    var normalized = normalizeItems(nextItems);
    assertUniqueKeys(normalized);
    var previous = snapshot();
    items = normalized;
    rebuildIndexes();
    invalidateProjection();
    var keys = new Set(items.map(function (item, index) { return keyOf(item, index); }));
    if (opts.preserveSelectedKeys !== true) selection.set(selection.values.filter(function (key) { return keys.has(key); }), { silent: true, source: 'items', reason: 'prune' });
    Array.from(expanded).forEach(function (key) { if (!keys.has(key)) expanded.delete(key); });
    return notify('data', previous, meta);
  }
  function updateRow(key, updater, meta) {
    if (destroyed) return false;
    var normalized = String(key == null ? '' : key);
    var index = keyIndex.get(normalized);
    if (index === undefined) return false;
    var previous = snapshot();
    var current = items[index];
    var nextItem = Utils.isFunction(updater) ? updater(current, index, api) : updater;
    if (nextItem === undefined) return false;
    if (Object.is(nextItem, current)) return true;
    var nextKey = keyOf(nextItem, index);
    if (nextKey !== normalized) throw new TypeError('[QXFRAME9A7C2] TableModel updateRow cannot change the stable row key. Use removeRows/insertRows instead.');
    items = items.slice(); items[index] = nextItem;
    rebuildIndexes(); invalidateProjection();
    return notify('row-update', previous, mergeOptions({ key: normalized, index: index }, meta));
  }
  function insertRows(index, rows, meta) {
    if (destroyed) return false;
    var additions = normalizeItems(Array.isArray(rows) ? rows : [rows]);
    if (!additions.length) return true;
    var at = Math.max(0, Math.min(items.length, Math.floor(Number(index) || 0)));
    var previous = snapshot();
    var nextItems = items.slice();
    nextItems.splice.apply(nextItems, [at, 0].concat(additions));
    assertUniqueKeys(nextItems);
    items = nextItems; rebuildIndexes(); invalidateProjection();
    return notify('row-insert', previous, mergeOptions({ index: at, count: additions.length }, meta));
  }
  function removeRows(keys, meta) {
    if (destroyed) return false;
    var removals = new Set((Array.isArray(keys) ? keys : [keys]).map(String));
    if (!removals.size) return true;
    var previous = snapshot();
    var nextItems = items.filter(function (item, index) { return !removals.has(keyOf(item, index)); });
    if (nextItems.length === items.length) return false;
    items = nextItems; rebuildIndexes(); invalidateProjection();
    if (opts.preserveSelectedKeys !== true) selection.set(selection.values.filter(function (key) { return !removals.has(String(key)); }), { silent: true, source: 'rows', reason: 'prune' });
    removals.forEach(function (key) { expanded.delete(String(key)); });
    return notify('row-remove', previous, mergeOptions({ keys: Array.from(removals) }, meta));
  }

  function setColumns(nextColumns, meta) {
    if (destroyed) return false;
    var normalized = normalizeColumns(nextColumns);
    var previous = snapshot();
    columns = normalized;
    rebuildIndexes();
    invalidateProjection();
    if (sortKey && !columnByKey(sortKey)) { sortKey = null; sortOrder = null; }
    Object.keys(filters).forEach(function (key) { if (!columnByKey(key)) delete filters[key]; });
    return notify('columns', previous, meta);
  }
  function setSelectedKeys(keys, meta) {
    if (destroyed || selectionMode === 'none') return false;
    var valid = (Array.isArray(keys) ? keys : []).map(String).filter(function (key) { return opts.preserveSelectedKeys === true || !!itemEntryByKey(key); });
    return selection.set(valid, mergeOptions({ source: 'api', reason: 'selection' }, meta));
  }
  function toggleSelected(key, desired, meta) {
    if (destroyed || selectionMode === 'none') return false;
    return selection.toggle(String(key), desired, mergeOptions({ source: 'api', reason: 'selection' }, meta));
  }
  function selectVisible(desired, meta) {
    if (destroyed || selectionMode !== 'multiple') return false;
    var visible = projectedEntries().filter(function (entry) { return !isDisabled(entry.item, entry.sourceIndex); });
    var keys = visible.map(function (entry) { return entry.key; });
    var current = selection.values.slice();
    var allSelected = keys.length > 0 && keys.every(function (key) { return current.indexOf(key) >= 0; });
    var shouldSelect = desired === undefined ? !allSelected : desired !== false;
    var next = shouldSelect
      ? current.concat(keys.filter(function (key) { return current.indexOf(key) < 0; }))
      : current.filter(function (key) { return keys.indexOf(key) < 0; });
    return selection.set(next, mergeOptions({ source: 'api', reason: 'visible-selection' }, meta));
  }
  function setExpandedKeys(keys, meta) {
    if (destroyed) return false;
    var previous = snapshot();
    expanded = new Set((Array.isArray(keys) ? keys : []).map(String).filter(function (key) { return !!itemEntryByKey(key); }));
    invalidateProjection('state');
    return notify('expand', previous, meta);
  }
  function toggleExpanded(key, desired, meta) {
    if (destroyed) return false;
    var normalized = String(key);
    var previous = snapshot();
    var next = desired === undefined ? !expanded.has(normalized) : desired !== false;
    if (next) expanded.add(normalized); else expanded.delete(normalized);
    invalidateProjection('state');
    return notify('expand', previous, mergeOptions({ key: normalized, expanded: next }, meta));
  }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    rejectLegacy(next);
    var candidateOpts = mergeOptions(opts, next);
    var candidateMode = own(next, 'selectionMode') ? normalizeSelectionMode(next.selectionMode) : selectionMode;
    var candidateItems = own(next, 'items') ? normalizeItems(next.items) : items;
    var candidateColumns = own(next, 'columns') ? normalizeColumns(next.columns) : columns;
    var candidateSortKey = own(next, 'sortKey') ? (next.sortKey == null || next.sortKey === '' ? null : String(next.sortKey)) : sortKey;
    var candidateSortOrder = own(next, 'sortOrder') ? normalizeSortOrder(next.sortOrder) : sortOrder;
    var candidateFilters = own(next, 'filters') ? normalizeFilters(next.filters) : filters;
    var candidateSearchValue = own(next, 'searchValue') ? (next.searchValue == null ? '' : String(next.searchValue)) : searchValue;
    var candidateRemote = own(next, 'remote') ? next.remote === true : remote;
    var candidateRemoteTotal = own(next, 'total') ? Math.max(0, Math.floor(Number(next.total) || 0)) : remoteTotal;
    var candidateRemoteFilteredTotal = own(next, 'filteredTotal') ? Math.max(0, Math.floor(Number(next.filteredTotal) || 0)) : (own(next, 'total') ? candidateRemoteTotal : remoteFilteredTotal);
    var candidateColumnKeys = Object.create(null);
    candidateColumns.forEach(function (column) { candidateColumnKeys[column.key] = true; });
    if (candidateSortKey && !candidateColumnKeys[candidateSortKey]) throw new TypeError('[QXFRAME9A7C2] TableModel sort key is not a current column: ' + candidateSortKey + '.');
    Object.keys(candidateFilters).forEach(function (key) { if (!candidateColumnKeys[key]) throw new TypeError('[QXFRAME9A7C2] TableModel filter key is not a current column: ' + key + '.'); });
    var candidateSeen = Object.create(null);
    candidateItems.forEach(function (item, index) {
      var raw = Utils.isFunction(candidateOpts.getKey) ? candidateOpts.getKey(item, index) : (item && typeof item === 'object' && item.key !== undefined ? item.key : index);
      if (raw === undefined || raw === null || raw === '') throw new TypeError('[QXFRAME9A7C2] TableModel item key must not be empty.');
      var key = String(raw);
      if (candidateSeen[key]) throw new TypeError('[QXFRAME9A7C2] TableModel item keys must be unique: ' + key + '.');
      candidateSeen[key] = true;
    });

    var previous = snapshot();
    opts = candidateOpts;
    selectionMode = candidateMode;
    items = candidateItems;
    columns = candidateColumns;
    sortKey = candidateSortKey;
    sortOrder = candidateSortOrder;
    filters = candidateFilters;
    searchValue = candidateSearchValue;
    remote = candidateRemote;
    remoteTotal = candidateRemoteTotal;
    remoteFilteredTotal = candidateRemoteFilteredTotal;
    rebuildIndexes();
    invalidateProjection();
    if (own(next, 'expandedKeys')) expanded = new Set((Array.isArray(next.expandedKeys) ? next.expandedKeys : []).map(String));
    expanded = new Set(Array.from(expanded).filter(function (key) { return !!candidateSeen[String(key)]; }));
    selection.updateOptions({ multiple: selectionMode === 'multiple' });
    if (selectionMode === 'none') selection.clear({ silent: true, source: 'options' });
    else {
      var requestedSelection = own(next, 'selectedKeys') ? (Array.isArray(next.selectedKeys) ? next.selectedKeys : []) : selection.values;
      selection.set(requestedSelection.map(String).filter(function (key) { return candidateOpts.preserveSelectedKeys === true || !!candidateSeen[key]; }), { silent: true, source: 'options', reason: 'reconcile' });
    }
    if (own(next, 'pageSize')) {
      opts.pageSize = positiveInt(next.pageSize, 0);
      pagination.setPageSize(positiveInt(next.pageSize, Math.max(1, items.length || 1)), { silent: true, source: 'options' });
    }
    syncPaginationTotal({ reason: 'options' });
    if (own(next, 'page')) pagination.setPage(positiveInt(next.page, 1), { silent: true, source: 'options' });
    notify('options', previous, { source: 'options' });
    return api;
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    selection.destroy();
    pagination.destroy();
    expanded.clear();
    keyIndex.clear(); columnIndex.clear(); cachedFilteredEntries = null; cachedOrderedEntries = null; cachedVisibleEntries = null; cachedProjection = null;
    emitter.dispose();
    return true;
  }

  api = {
    setItems: setItems,
    updateRow: updateRow,
    insertRows: insertRows,
    removeRows: removeRows,
    setColumns: setColumns,
    setSort: setSort,
    setFilter: setFilter,
    setFilters: setFilters,
    setSearchValue: setSearchValue,
    setRemoteData: setRemoteData,
    setSelectedKeys: setSelectedKeys,
    toggleSelected: toggleSelected,
    selectVisible: selectVisible,
    setExpandedKeys: setExpandedKeys,
    toggleExpanded: toggleExpanded,
    setPage: function (page, meta) { return pagination.setPage(page, mergeOptions({ source: 'api' }, meta)); },
    setPageSize: function (pageSize, meta) {
      opts.pageSize = positiveInt(pageSize, 0);
      if (!opts.pageSize) { pagination.setPage(1, { silent: true }); return notify('pagination', null, meta); }
      return pagination.setPageSize(opts.pageSize, mergeOptions({ source: 'api' }, meta));
    },
    getProjectionVersion: function () { return projectionVersion; },
    getDiagnostics: function () { return Object.freeze(Object.assign({}, projectionDiagnostics)); },
    getCellValue: function (item, columnOrKey, index) {
      var column = typeof columnOrKey === 'string' ? columnByKey(columnOrKey) : columnOrKey;
      return column ? cellValue(item, column, index == null ? items.indexOf(item) : index) : undefined;
    },
    getOrthogonalValue: function (kind, item, columnOrKey, index) {
      var column = typeof columnOrKey === 'string' ? columnByKey(columnOrKey) : columnOrKey;
      return column ? orthogonalValue(String(kind || ''), item, column, index == null ? items.indexOf(item) : index) : undefined;
    },
    getEntry: itemEntryByKey,
    getAllEntries: function () { return items.map(function (item, index) { return { item: item, sourceIndex: index, key: keyOf(item, index) }; }); },
    getOrderedEntries: function () { return orderedItems().slice(); },
    getProjectedEntries: projectedEntries,
    getProjection: function () { return projection('api-projection'); },
    getState: snapshot,
    updateOptions: updateOptions,
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
  Object.defineProperties(api, {
    items: { enumerable: true, get: function () { return items.slice(); } },
    columns: { enumerable: true, get: function () { return columns.slice(); } },
    selection: { enumerable: true, get: function () { return selection; } },
    pagination: { enumerable: true, get: function () { return pagination; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });
  syncPaginationTotal({ reason: 'init' });
  return api;
}

export const TableModel = Object.freeze({ create });
export { create };
