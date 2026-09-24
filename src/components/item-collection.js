// ESM authority: ItemCollection building block.
// Migrated from the frozen HOTFIX6 implementation without changing runtime semantics.

import { Events } from '../core/events.js';
import { DOM } from '../core/dom.js';
import { URLPolicy } from '../utils/url.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { Utils } from '../utils/utils.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { Collection } from '../core/collection.js';
import { SelectionController } from '../core/selectionController.js';
import { ActiveItem } from '../core/activeItem.js';
import { AsyncTask } from '../core/asyncTask.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { SearchState } from '../core/searchState.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { InteractionModality } from '../core/interactionModality.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { EmptyProjection } from '../core/emptyProjection.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { mergeOptions } from '../core/options.js';
import { VirtualList } from './virtual-list.js';
import { Item } from './item.js';

var DOMFactory;
// Optional chrome is demand-projected by ItemCollection. The default DOM keeps only
// the always-required collection body so disabled/empty capabilities do not leave
// inert header/search/status/load-more/footer nodes in the rendered tree.
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-item-collection" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-item-collection-body" data-qxframe9a7c2-ref="body"></div>
  </div>`;
var viewportBlueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-item-collection-viewport" tabindex="0" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-item-collection-content" data-qxframe9a7c2-ref="content"></div>
  </div>`;
function createDefaultDOM(context) { var instance = blueprint.instantiate(context.document); return {root: instance.root, refs: instance.refs}; }
function createViewport(context) { var instance = viewportBlueprint.instantiate(context.document); return {viewport: instance.root, content: instance.refs.content}; }
function createRow(context) { var row = context.document.createElement('div'); row.className = 'qxframe9a7c2-item-collection-item'; return row; }
DOMFactory = Object.freeze({ createDefaultDOM: createDefaultDOM, createViewport: createViewport, createRow: createRow, blueprint: blueprint });

var SIZE_PX = Object.freeze({ xs: 24, sm: 28, md: 32, lg: 36, xl: 40 });
var LEGACY_OPTIONS = Object.freeze([
  'target', 'el', 'mount', 'type', 'mode', 'selectionMode', 'values', 'selectedValue', 'selectedValues',
  'defaultValues', 'defaultSearchValue', 'activeValue', 'fieldNames', 'filterOption', 'filterSort',
  'optionFilterProp', 'searchField', 'filterField', 'maxSelected', 'virtualItemSize',
  'virtualEstimatedItemSize', 'virtualOverscan', 'itemHeight',
  'checkAppearance', 'checkPosition', 'checkColumn', 'activeOnPointerMove', 'renderItem', 'bordered'
]);
var hasOwn = Utils.own;
function assertCanonicalOptions(options) {
  LEGACY_OPTIONS.forEach(function (name) {
    if (hasOwn(options, name)) throw new TypeError('[QXFRAME9A7C2] ItemCollection does not accept legacy/non-canonical option "' + name + '".');
  });
}
function normalizeOwnerPrefix(value, fallback) {
  return String(value || fallback || 'item-collection').replace(/[^a-z0-9_-]+/gi, '-');
}
    
function create(options) {
  assertCanonicalOptions(options);
  var opts = mergeOptions({}, options);
  var doc = opts.document || (opts.container && opts.container.ownerDocument) || globalThis.document;
  var emitter = Events.createEmitter();
  var scope = Lifecycle.createScope();
  var collection = Collection.create({
    items: Array.isArray(opts.items) ? opts.items : [],
    getKey: opts.getKey,
    getLabel: opts.getLabel,
    getValue: opts.getValue,
    getChildren: opts.getChildren,
    isDisabled: opts.isItemDisabled
  });
  var selectionChannel = String(opts.selectionChannel || 'selected');
  var selectionController = opts.selectionController || null;
  var ownsSelectionController = !selectionController;
  if (!selectionController) {
    var channelSpecs = {};
    channelSpecs[selectionChannel] = {
      multiple: opts.multiple === true,
      maxCount: opts.maxCount,
      value: opts.value !== undefined ? opts.value : opts.defaultValue
    };
    selectionController = SelectionController.create({ channels:channelSpecs, revisionSources:{ [selectionChannel]:collection } });
  } else {
    if (!Utils.isFunction(selectionController.getChannel) || !Utils.isFunction(selectionController.setAnchor)) throw new TypeError('[QXFRAME9A7C2] ItemCollection selectionController must be a SelectionController.');
    if (Utils.isFunction(selectionController.setRevisionSource)) selectionController.setRevisionSource(selectionChannel, collection);
  }
  var selection = selectionController.getChannel(selectionChannel);
  var activeItem = ActiveItem.create({
    getEntries: function () { return interactiveRows(); },
    getKey: function (row) { return row.key; },
    isDisabled: function (row) { return isComponentDisabled() || isRowDisabled(row); },
    loop: opts.loop === true,
    onChange: function (_, detail) {
      interactionSource = detail && detail.source ? detail.source : interactionSource;
      if (interactionSource === 'keyboard') { pointerKey = null; focusVisible = true; }
      else if (interactionSource === 'pointer') focusVisible = false;
      if (virtualFocusDomain && virtualFocusController) {
        var vfState = virtualFocusController.getState();
        virtualFocusDomain.activate(activeItem.activeKey, {
          source: interactionSource,
          modality: interactionSource === 'keyboard' ? 'keyboard' : (interactionSource === 'pointer' ? 'pointer' : vfState.modality),
          reason: detail && detail.reason || 'active-change',
          originalEvent: detail && detail.originalEvent || null,
          ensureVisible: false
        });
      }
      syncRowStates();
      emitActive(detail || {});
    }
  });
    
  var mounted = false;
  var destroyed = false;
  var host = null;
  var root = null;
  var searchWrap = null;
  var searchInput = null;
  var header = null;
  var body = null;
  var viewport = null;
  var content = null;
  var status = null;
  var loadMore = null;
  var footer = null;
  var searchBound = false;
  var delegation = null;
  var keyboard = null;
  var virtualFocusDomain = null;
  var virtualFocusController = null;
  var virtualList = null;
  var pendingVirtualEnsureKey = null;
  var scrollSurface = null;
  var scrollShell = null;
  var domBinding = null;
  var currentRows = [];
  var interactiveRowsCache = [];
  var rowByKeyMap = new Map();
  var rowByValueMap = new Map();
  var interactiveIndexByKey = new Map();
  var unpagedVisibleCount = 0;
  var searchState = SearchState.create({ query:opts.searchValue, onChange:function (value, meta) { handleSearchChange(value, meta || {}); } });
  var loadingValue = opts.loading === true;
  var errorValue = opts.error || null;
  var pointerKey = null;
  var interactionSource = 'api';
  var focusVisible = false;
  var initialSelectionValues = selection.values;
  selectionController.setAnchor(selectionChannel, initialSelectionValues.length ? initialSelectionValues[initialSelectionValues.length - 1] : null);
  var renderCount = 0;
  var rowMetaByNode = typeof WeakMap === 'function' ? new WeakMap() : null;
  var nodeByKey = new Map();
  var api = null;
  var ownerPrefix = normalizeOwnerPrefix(opts.ownerPrefix, 'item-collection');
  function ownerClass(part) { return 'qxframe9a7c2-' + ownerPrefix + '-' + part; }
  function semanticItemClasses(row, state) {
    var base = ['qxframe9a7c2-item', ownerClass('item')];
    var extra = Utils.isFunction(opts.itemSemanticClasses) ? opts.itemSemanticClasses(row.item, Object.freeze({ index: row.index, key: row.key, value: row.value, selected: state && state.checked === true, active: row.key === visibleActiveKey(), disabled: isRowDisabled(row), component: api })) : opts.itemSemanticClasses;
    if (Array.isArray(extra)) base = base.concat(extra); else if (extra) base.push(String(extra));
    return base;
  }
  function projectUserClasses(node, part, item, context) {
    if (!node || !Item || !Item.projectClasses) return;
    var resolver = opts.classes && opts.classes[part];
    Item.projectClasses(node, resolver, item, context || {}, ownerPrefix + ':' + part);
  }
  function projectUserStyles(node, part, item, context) {
    if (!node || !Item || !Item.projectStyles) return;
    var resolver = opts.styles && opts.styles[part];
    Item.projectStyles(node, resolver, item, context || {}, ownerPrefix + ':' + part);
  }
  function projectItemClassParts(node, row, context) {
    if (!node || !Item || !Item.projectClasses) return;
    var parts = Array.isArray(opts.itemClassParts) && opts.itemClassParts.length ? opts.itemClassParts.map(String) : ['item'];
    var previous = DOM.getPrivate(node, 'itemClassParts') || [];
    previous.forEach(function (part) {
      if (parts.indexOf(part) < 0 && Item.clearProjectedClasses) Item.clearProjectedClasses(node, ownerPrefix + ':item:' + part);
      if (parts.indexOf(part) < 0 && Item.clearProjectedStyles) Item.clearProjectedStyles(node, ownerPrefix + ':item:' + part);
    });
    parts.forEach(function (part) {
      var classResolver = opts.classes && opts.classes[part];
      var styleResolver = opts.styles && opts.styles[part];
      Item.projectClasses(node, classResolver, row && row.item, context || {}, ownerPrefix + ':item:' + part);
      if (Item.projectStyles) Item.projectStyles(node, styleResolver, row && row.item, context || {}, ownerPrefix + ':item:' + part);
    });
    DOM.setPrivate(node, 'itemClassParts', parts.slice());
  }
  var searchTask = AsyncTask.create({
    task: function (input, context) {
      if (!Utils.isFunction(opts.loadItems)) return [];
      return opts.loadItems(input.searchValue, {
        searchValue: input.searchValue,
        source: input.source,
        reason: input.reason,
        originalEvent: input.originalEvent || null,
        requestId: context.requestId,
        signal: context.signal,
        controller: api
      });
    }
  });
  scope.add(function () { searchTask.destroy(); });
  var searchDelayScheduler = null;
  var focusSyncScheduler = null;
  function ensureSearchDelayScheduler() {
    if (!searchDelayScheduler) {
      searchDelayScheduler = Scheduler.createDelayScheduler(function (_timestamp, meta) { runSearchLoad(meta || null); });
      scope.add(function () { searchDelayScheduler.dispose(); searchDelayScheduler = null; });
    }
    return searchDelayScheduler;
  }
  function focusEventBelongsToOwner(event) {
    var owner = keyboardFocusOwner();
    var target = event && event.target;
    return !!(owner && target && (target === owner || (owner.contains && owner.contains(target))));
  }
  function scheduleFocusSync(event) {
    if (event && !focusEventBelongsToOwner(event)) return;
    if (!focusSyncScheduler) {
      focusSyncScheduler = Scheduler.createDelayScheduler(function () { if (!destroyed) syncRowStates(); });
      scope.add(function () { focusSyncScheduler.dispose(); focusSyncScheduler = null; });
    }
    focusSyncScheduler.request(0, 'focusout');
  }
    
  function interactionPolicy() { return InteractionPolicy.resolve({ disabled: opts.disabled === true, readOnly: opts.readOnly === true }); }
  function isComponentDisabled() { return interactionPolicy().disabled; }
  function isReadOnly() { return interactionPolicy().readOnly; }
  function syncInteractionLock() {
    if (!root) return;
    root.inert = isComponentDisabled();
    if (isComponentDisabled()) root.setAttribute('inert', ''); else root.removeAttribute('inert');
  }
  function isSelectable() { return opts.selectable !== false; }
  function selectionLimitReached() {
    var max = Math.floor(Number(opts.maxCount));
    return opts.multiple === true && Number.isFinite(max) && max > 0 && selection.values.length >= max;
  }
  function isRowDisabled(row) {
    return !row || row.disabled === true || (selectionLimitReached() && !selection.has(row.value));
  }
  function sizeName() { return Utils.normalizeSize(opts.size, 'md'); }
  function syncRootClasses() {
    if (!root) return;
    root.classList.add('qxframe9a7c2-item-collection');
    ['xs', 'sm', 'md', 'lg', 'xl'].forEach(function (size) { root.classList.remove('is-' + size); });
    root.classList.add('is-' + sizeName());
    root.classList.toggle('is-split', opts.split === true);
    root.classList.toggle('is-vertical-layout', String(opts.itemLayout || 'horizontal') === 'vertical');
    root.classList.toggle('is-sticky-groups', opts.stickyGroups === true);
  }
    
  function textLabel(item, index) {
    var label = collection.labelOf(item, index);
    return label === undefined || label === null ? '' : String(label);
  }
    
  function valueOf(item, index) {
    var value = collection.valueOf(item, index);
    return value === undefined || value === null ? '' : String(value);
  }
    
  function keyOf(item, index, path) {
    var value = collection.keyOf(item, index);
    if (value === undefined || value === null || value === '') return path;
    return String(value);
  }
    
  function groupChildren(item, index) {
    var children = collection.childrenOf(item, index);
    if (Array.isArray(children)) return children;
    if (item && Array.isArray(item.items)) return item.items;
    return [];
  }
    
  function typeOf(item, index) {
    if (Utils.isFunction(opts.getType)) {
      var explicit = opts.getType(item, index);
      if (explicit !== undefined && explicit !== null && explicit !== '') return String(explicit).toLowerCase();
    }
    var type = item && typeof item === 'object' && item.type !== undefined ? String(item.type).toLowerCase() : '';
    if (type === 'divider' || type === 'separator') return 'divider';
    if (type === 'title' || type === 'header') return 'title';
    if (type === 'group') return 'group';
    return 'item';
  }
    
  function isGroup(item, index) {
    if (Utils.isFunction(opts.isGroup)) return opts.isGroup(item, index) === true;
    if (typeOf(item, index) === 'group') return true;
    if (!item || typeof item !== 'object') return false;
    return (Array.isArray(item.children) || Array.isArray(item.items)) && item.selectable === false;
  }
    
  function matchesSearch(item, index, label) {
    var query = searchState.query.trim();
    if (!query) return true;
    if (Utils.isFunction(opts.filterItem)) return opts.filterItem(query, item, { index: index, label: label, controller: api }) !== false;
    if (Utils.isFunction(opts.loadItems)) return true;
    var normalizedQuery = query.toLocaleLowerCase();
    var value = valueOf(item, index).toLocaleLowerCase();
    return label.toLocaleLowerCase().indexOf(normalizedQuery) >= 0 || value.indexOf(normalizedQuery) >= 0;
  }
    
  function orderedItems(items, depth) {
    var list = Array.isArray(items) ? items.slice() : [];
    if (!searchState.query || !Utils.isFunction(opts.sortItems)) return list;
    var sortable = list.every(function (item, index) { return !isGroup(item, index) && typeOf(item, index) === 'item'; });
    if (!sortable) return list;
    return list.sort(function (a, b) { return opts.sortItems(a, b, { searchValue: searchState.query, depth: depth, controller: api }); });
  }
    
  function pageSizeValue() {
    var value = Math.floor(Number(opts.pageSize));
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  function pageValue() {
    var value = Math.floor(Number(opts.page));
    return Number.isFinite(value) && value > 0 ? value : 1;
  }
  function projectPage(rows) {
    var list = Array.isArray(rows) ? rows : [];
    var interactive = list.filter(function (row) { return row.type === 'item'; });
    unpagedVisibleCount = interactive.length;
    var size = pageSizeValue();
    if (!size) return list;
    var pageCount = Math.max(1, Math.ceil(interactive.length / size));
    var current = Math.min(pageValue(), pageCount);
    var start = (current - 1) * size;
    var keys = new Set(interactive.slice(start, start + size).map(function (row) { return row.key; }));
    return list.filter(function (row) { return row.type === 'item' && keys.has(row.key); });
  }
    
  function buildRows() {
    var output = [];
    var source = collection.items;
    
    function visit(items, prefix, depth, forceVisible) {
      orderedItems(items, depth).forEach(function (item, index) {
        var path = prefix + index;
        var label = textLabel(item, index);
        var type = typeOf(item, index);
        if (isGroup(item, index)) {
          var groupMatch = !!searchState.query && matchesSearch(item, index, label);
          var childrenRows = [];
          var previousOutput = output;
          output = childrenRows;
          visit(groupChildren(item, index), path + '.', depth + 1, forceVisible || groupMatch);
          output = previousOutput;
          if (childrenRows.length) {
            output.push({ type: 'group', key: 'group:' + keyOf(item, index, path), label: label, item: item, depth: depth, disabled: true });
            Array.prototype.push.apply(output, childrenRows);
          } else if (!searchState.query && groupChildren(item, index).length === 0) {
            output.push({ type: 'group', key: 'group:' + keyOf(item, index, path), label: label, item: item, depth: depth, disabled: true });
          }
          return;
        }
        if (type === 'divider' || type === 'title') {
          if (!searchState.query) output.push({ type: type, key: type + ':' + keyOf(item, index, path), label: label, item: item, depth: depth, disabled: true });
          return;
        }
    
        var value = valueOf(item, index);
        if (opts.hideSelected === true && opts.multiple === true && selection.has(value)) return;
        if (!forceVisible && !matchesSearch(item, index, label)) return;
        output.push({
          type: 'item',
          key: keyOf(item, index, path),
          value: value,
          label: label,
          item: item,
          index: index,
          depth: depth,
          disabled: collection.disabledOf(item, index) === true
        });
      });
    }
    
    visit(source, '', 0, false);
    return projectPage(output);
  }
    
  function rebuildRowIndexes() {
    interactiveRowsCache = [];
    rowByKeyMap.clear();
    rowByValueMap.clear();
    interactiveIndexByKey.clear();
    currentRows.forEach(function (row) {
      if (!row || row.type !== 'item') return;
      var index = interactiveRowsCache.length;
      interactiveRowsCache.push(row);
      rowByKeyMap.set(row.key, row);
      if (!rowByValueMap.has(row.value)) rowByValueMap.set(row.value, row);
      interactiveIndexByKey.set(row.key, index);
    });
  }
    
  function interactiveRows() {
    return interactiveRowsCache;
  }
    
  function rowByKey(key) {
    var normalized = String(key === undefined || key === null ? '' : key);
    return rowByKeyMap.get(normalized) || null;
  }
    
  function rowByValue(value) {
    var normalized = String(value === undefined || value === null ? '' : value);
    return rowByValueMap.get(normalized) || null;
  }
    
  function sourceItemByValue(value) {
    var normalized = String(value === undefined || value === null ? '' : value);
    var found = null;
    function visit(items) {
      if (found || !Array.isArray(items)) return;
      for (var i = 0; i < items.length; i += 1) {
        var item = items[i];
        if (!isGroup(item, i) && typeOf(item, i) === 'item' && valueOf(item, i) === normalized) { found = item; return; }
        var children = groupChildren(item, i);
        if (children.length) visit(children);
        if (found) return;
      }
    }
    visit(collection.items);
    return found;
  }
    
  function activeIndex(key) {
    var normalized = String(key === undefined || key === null ? activeItem.activeKey : key);
    var index = interactiveIndexByKey.get(normalized);
    return index === undefined ? -1 : index;
  }
    
  function shouldVirtualize() {
    if (currentRows.some(function (row) { return row.type !== 'item'; })) return false;
    if (opts.virtual === false) return false;
    if (opts.virtual === true) return currentRows.length > 0;
    var threshold = Math.max(1, Math.floor(Number(opts.virtualThreshold) || 120));
    return currentRows.length >= threshold;
  }
    
  function selectionState(row) {
    var checked = selection.has(row.value);
    var indeterminate = false;
    var opened = false;
    var descendantSelected = false;
    if (Utils.isFunction(opts.getCheckState)) {
      var custom = opts.getCheckState(row.item, { value: row.value, checked: checked, values: selection.values, controller: api });
      if (custom && typeof custom === 'object') {
        if (custom.checked !== undefined) checked = custom.checked === true;
        indeterminate = custom.indeterminate === true;
      }
    } else if (row.item && typeof row.item === 'object') {
      indeterminate = row.item.indeterminate === true;
    }
    if (Utils.isFunction(opts.getItemState)) {
      var itemState = opts.getItemState(row.item, { value: row.value, checked: checked, indeterminate: indeterminate, values: selection.values, activeKey: activeItem.activeKey, controller: api });
      if (itemState && typeof itemState === 'object') {
        opened = itemState.open === true;
        descendantSelected = itemState.descendantSelected === true;
      }
    }
    return { checked: checked, indeterminate: indeterminate, open: opened, descendantSelected: descendantSelected };
  }
    
  function selectionAppearance() {
    return Item.normalizeSelectionAppearance(opts.selectionAppearance, opts.multiple === true ? 'checkbox' : 'highlight');
  }
    
  function createSelectionIndicator(row) {
    var state = selectionState(row);
    return Item.createSelectionIndicator({
      document: doc,
      appearance: selectionAppearance(),
      checked: state.checked,
      indeterminate: state.indeterminate,
      disabled: isComponentDisabled() || isRowDisabled(row)
    });
  }
    
  function renderIcon(item) {
    if (!item || typeof item !== 'object' || item.icon === undefined || item.icon === null || item.icon === '') return null;
    var node = doc.createElement('span');
    node.className = 'qxframe9a7c2-item-collection-icon ' + ownerClass('icon');
    var icon = item.icon;
    if (icon && typeof icon === 'object' && typeof icon.nodeType === 'number') node.appendChild(icon);
    else if (/^(?:https?:|data:|blob:|\/)/.test(String(icon))) {
      var image = doc.createElement('img'); image.src = URLPolicy.sanitize(icon, 'image'); image.alt = ''; node.appendChild(image);
    } else DOM.setText(node, icon);
    return node;
  }
    
  function appendRichValue(container, className, value) {
    if (value === undefined || value === null || value === '') return null;
    var node = doc.createElement('span');
    node.className = className;
    Renderer.append(node, Utils.isFunction(value) ? value() : value);
    container.appendChild(node);
    return node;
  }
    
  function renderRowContent(container, row) {
    if (row.type === 'divider') return;
    if (row.type === 'group' || row.type === 'title') { DOM.setText(container, row.label); return; }
    var item = row.item && typeof row.item === 'object' ? row.item : null;
    var appearance = selectionAppearance();
    var position = Item.selectionPosition(appearance);
    var state = selectionState(row);
    var indicator = createSelectionIndicator(row);
    var childArrow = null;
    if (item && groupChildren(item, row.index).length && opts.childrenIndicator !== false) {
      childArrow = doc.createElement('span');
      childArrow.className = 'qxframe9a7c2-item-collection-arrow ' + ownerClass('item-arrow');
    }
    var renderer = Utils.isFunction(opts.itemRender) ? opts.itemRender : null;
    if (renderer) {
      var customContent = doc.createElement('span');
      customContent.className = 'qxframe9a7c2-item-collection-content-slot qxframe9a7c2-item-collection-custom-content ' + ownerClass('content');
      var rendererParts = childArrow && Item.createParts ? Item.createParts({ arrow:function(){var claimed=childArrow;childArrow=null;return claimed;} }) : (Item.createParts ? Item.createParts({}) : {});
      var itemCtx = Item.createContext ? Item.createContext(row.item, {
        index: row.index, key: row.key, value: row.value, element: customContent, component: api, controller: api, active: row.key === visibleActiveKey(),
        selected: state.checked, indeterminate: state.indeterminate, open: state.open, descendantSelected: state.descendantSelected, disabled: isRowDisabled(row),
        parts: rendererParts
      }) : { index: row.index, key: row.key, value: row.value, element: customContent, component: api, controller: api, active: row.key === visibleActiveKey(), selected: state.checked, disabled: isRowDisabled(row), parts: rendererParts };
      Renderer.append(customContent, renderer(row.item, itemCtx));
      projectUserClasses(customContent, 'content', row.item, itemCtx);
      projectUserStyles(customContent, 'content', row.item, itemCtx);
      if (indicator && position === 'start') container.appendChild(indicator);
      container.appendChild(customContent);
    } else {
      if (indicator && position === 'start') container.appendChild(indicator);
      var icon = renderIcon(item);
      if (icon) container.appendChild(icon);
      var contentNode = doc.createElement('span');
      contentNode.className = 'qxframe9a7c2-item-collection-content-slot ' + ownerClass('content');
      var labelNode = doc.createElement('span');
      labelNode.className = 'qxframe9a7c2-item-collection-label ' + ownerClass('label');
      var labelCtx = { index: row.index, key: row.key, value: row.value, component: api, controller: api, element: labelNode };
      DOM.setText(labelNode, row.label); projectUserClasses(labelNode, 'label', row.item, labelCtx); projectUserStyles(labelNode, 'label', row.item, labelCtx);
      var contentCtx = { index: row.index, key: row.key, value: row.value, component: api, controller: api, element: contentNode };
      contentNode.appendChild(labelNode); projectUserClasses(contentNode, 'content', row.item, contentCtx); projectUserStyles(contentNode, 'content', row.item, contentCtx);
      if (item && item.meta !== undefined) appendRichValue(contentNode, 'qxframe9a7c2-item-collection-meta ' + ownerClass('meta'), item.meta);
      container.appendChild(contentNode);
      if (item) appendRichValue(container, 'qxframe9a7c2-item-collection-shortcut ' + ownerClass('shortcut'), item.shortcut);
      if (item && item.extra !== undefined) appendRichValue(container, 'qxframe9a7c2-item-collection-extra ' + ownerClass('extra'), item.extra);
      if (item && item.actions !== undefined) appendRichValue(container, 'qxframe9a7c2-item-collection-actions ' + ownerClass('actions'), item.actions);
    }
    if (indicator && position === 'end') container.appendChild(indicator);
    if (childArrow) container.appendChild(childArrow);
  }
    
  function keyboardFocusOwner() {
    var owner = Utils.isFunction(opts.keyboardFocusOwner) ? opts.keyboardFocusOwner(api) : opts.keyboardFocusOwner;
    return owner && owner.nodeType === 1 ? owner : root;
  }
    
  function syncRootTabStop() {
    if (!root) return;
    var owner = keyboardFocusOwner();
    root.tabIndex = !isComponentDisabled() && owner === root ? 0 : -1;
  }
    
  function ownsBrowserFocus() {
    var owner = keyboardFocusOwner();
    var focusDoc = owner && owner.ownerDocument ? owner.ownerDocument : doc;
    var active = focusDoc && focusDoc.activeElement;
    return !!(owner && active && (owner === active || (owner.contains && owner.contains(active))));
  }
    
  function visibleActiveKey() {
    return focusVisible && ownsBrowserFocus() ? activeItem.activeKey : '';
  }
    
  function setFocusVisible(value) {
    var next = value === true;
    if (focusVisible === next) return false;
    focusVisible = next;
    syncRowStates();
    return true;
  }
    
  function pointerTargetKeepsOwnFocus(target, rowElement) {
    if (!target || !rowElement || !Utils.isFunction(target.closest)) return false;
    var interactive = target.closest('button,input,select,textarea,a[href],[contenteditable],[tabindex]');
    return !!(interactive && interactive !== rowElement && rowElement.contains(interactive));
  }
    
  function rowMeta(node) { return rowMetaByNode && node ? rowMetaByNode.get(node) || null : null; }
  function rowKey(node) { var meta = rowMeta(node); return meta && meta.type === 'item' ? meta.key : ''; }
  function getItemElement(key) { return nodeByKey.get(String(key || '')) || null; }
    
  function decorateRow(element, row) {
    var previousMeta = rowMeta(element);
    if (previousMeta && previousMeta.key && nodeByKey.get(previousMeta.key) === element) nodeByKey.delete(previousMeta.key);
    ['qxframe9a7c2-item-collection-group','qxframe9a7c2-item-collection-title','qxframe9a7c2-item-collection-divider','qxframe9a7c2-item-collection-item',ownerClass('group'),ownerClass('title'),ownerClass('divider')].forEach(function (name) { element.classList.remove(name); });
    if (row.type !== 'item') {
      var typeClass = row.type === 'group' ? 'group' : (row.type === 'title' ? 'title' : 'divider');
      element.classList.add('qxframe9a7c2-item-collection-' + typeClass, ownerClass(typeClass));
      if (rowMetaByNode) rowMetaByNode.set(element, { type: row.type, key: row.key });
      element.tabIndex = -1;
      return element;
    }
    element.classList.add('qxframe9a7c2-item-collection-item');
    var oldSemantic = DOM.getPrivate(element, 'itemSemanticClasses');
    if (oldSemantic) String(oldSemantic).split(/\s+/).forEach(function (name) { if (name) element.classList.remove(name); });
    var semanticClasses = semanticItemClasses(row, selectionState(row));
    semanticClasses.forEach(function (name) { if (name) element.classList.add(name); });
    DOM.setPrivate(element, 'itemSemanticClasses', semanticClasses.join(' '));
    var classCtx = Item.createContext(row.item, { index:row.index, key:row.key, value:row.value, element:element, component:api, controller:api, selected:selection.has(row.value), active:row.key === visibleActiveKey(), disabled:isRowDisabled(row), parts:{} });
    projectItemClassParts(element, row, classCtx);
    Item.applySelectionAppearance(element, selectionAppearance());
    if (rowMetaByNode) rowMetaByNode.set(element, { type: 'item', key: row.key });
    nodeByKey.set(row.key, element);
    var state = selectionState(row);
    var externalCheckbox = !isSelectable() && selectionAppearance() === 'checkbox' && Utils.isFunction(opts.getCheckState);
    element.tabIndex = -1;
    
    Item.syncState(element, {
      disabled: isComponentDisabled() || isRowDisabled(row),
      readOnly: isReadOnly(),
      selected: state.checked,
      indeterminate: state.indeterminate,
      active: visibleActiveKey() === row.key,
      hover: interactionSource === 'pointer' && pointerKey === row.key && !isComponentDisabled() && !isRowDisabled(row),
      open: state.open,
      descendantSelected: state.descendantSelected
    });
    if (row.depth > 0) element.style.setProperty('--qxframe9a7c2-item-collection-depth', String(row.depth));
    else element.style.removeProperty('--qxframe9a7c2-item-collection-depth');
    return element;
  }
    
  function createRowElement(row) {
    var element = DOMFactory.createRow({ document: doc, options: opts, row: row });
    decorateRow(element, row);
    renderRowContent(element, row);
    return element;
  }
    
  function currentViewport() {
    if (virtualList) return virtualList.getViewportElement();
    return viewport;
  }
    
  function syncRowStates() {
    if (!root) return;
    var nodes = root.querySelectorAll('.qxframe9a7c2-item-collection-item');
    Array.prototype.forEach.call(nodes, function (node) {
      var key = rowKey(node);
      var row = rowByKey(key);
      if (!row) return;
      var state = selectionState(row);
      Item.applySelectionAppearance(node, selectionAppearance());
      var shellCtx = { index: row.index, key: row.key, value: row.value, selected: state.checked, active: key === visibleActiveKey(), disabled: isRowDisabled(row), component: api, controller: api, element: node };
      projectUserClasses(node, 'item', row.item, shellCtx);
      projectUserStyles(node, 'item', row.item, shellCtx);
      Item.syncState(node, {
        active: key === visibleActiveKey(),
        hover: pointerKey === key && !isComponentDisabled() && !isRowDisabled(row),
        selected: state.checked,
        indeterminate: state.indeterminate,
        open: state.open,
        descendantSelected: state.descendantSelected,
        disabled: isComponentDisabled() || isRowDisabled(row),
        readOnly: isReadOnly()
      });
      var externalCheckbox = !isSelectable() && selectionAppearance() === 'checkbox' && Utils.isFunction(opts.getCheckState);
    
      var indicator = node.querySelector('.qxframe9a7c2-item-selection-indicator');
      if (indicator) Item.syncSelectionIndicator(indicator, {
        appearance: selectionAppearance(), checked: state.checked, indeterminate: state.indeterminate, disabled: isComponentDisabled() || isRowDisabled(row)
      });
    });
  }
    
  function emitActive(meta) {
    var row = rowByKey(activeItem.activeKey);
    var detail = {
      key: activeItem.activeKey,
      item: row ? row.item : null,
      source: meta.source || interactionSource,
      reason: meta.reason || 'active',
      originalEvent: meta.originalEvent || null,
      controller: api
    };
    if (Utils.isFunction(opts.onActiveChange)) opts.onActiveChange(detail);
    emitter.emit('active-change', detail);
  }
    
  function emitHover(meta) {
    var row = rowByKey(pointerKey);
    var detail = {
      key: pointerKey || '',
      item: row ? row.item : null,
      source: 'pointer',
      reason: meta && meta.reason || (pointerKey ? 'pointermove' : 'pointerleave'),
      originalEvent: meta && meta.originalEvent || null,
      controller: api
    };
    if (Utils.isFunction(opts.onHoverChange)) opts.onHoverChange(detail);
    emitter.emit('hover-change', detail);
  }
    
  function selectionDetail(row, selected, meta) {
    return {
      key: row.key,
      value: row.value,
      item: row.item,
      selected: selected,
      values: selection.values,
      valueState: selection.value,
      source: meta && meta.source ? meta.source : 'api',
      reason: meta && meta.reason ? meta.reason : 'select',
      originalEvent: meta && meta.originalEvent ? meta.originalEvent : null,
      controller: api
    };
  }
    
  function emitSelectionChange(detail) {
    if (Utils.isFunction(opts.onChange)) opts.onChange(selection.value, detail);
    if (destroyed) return false;
    emitter.emit('change', detail);
    return !destroyed;
  }
    
  function callItemHandler(row, name, detail) {
    var item = row && row.item;
    return item && typeof item === 'object' && Utils.isFunction(item[name]) ? item[name](detail) : undefined;
  }
    
  function selectRow(row, desired, meta) {
    if (!row || row.type !== 'item' || isRowDisabled(row) || isComponentDisabled() || isReadOnly() || !isSelectable()) return false;
    var wasSelected = selection.has(row.value);
    var nextSelected = desired === undefined ? (opts.multiple === true ? !wasSelected : true) : desired !== false;
    var beforeDetail = selectionDetail(row, nextSelected, meta);
    var beforeName = nextSelected ? 'onBeforeSelect' : 'onBeforeDeselect';
    if (callItemHandler(row, beforeName, beforeDetail) === false || destroyed) return false;
    if (Utils.isFunction(opts[beforeName]) && opts[beforeName](beforeDetail) === false) return false;
    if (destroyed) return false;
    var beforeValues = selection.values.join('\u0000');
    var changed = nextSelected ? selection.select(row.value, meta) : selection.deselect(row.value, meta);
    if (!changed) return false;
    var selectionAnchorValue = selectionController.getAnchor(selectionChannel);
    if (selection.has(row.value)) selectionController.setAnchor(selectionChannel, row.value);
    else if (selectionAnchorValue !== null && String(selectionAnchorValue) === String(row.value)) {
      var remainingValues = selection.values;
      selectionController.setAnchor(selectionChannel, remainingValues.length ? remainingValues[remainingValues.length - 1] : null);
    }
    var afterValues = selection.values.join('\u0000');
    var detail = selectionDetail(row, selection.has(row.value), meta);
    callItemHandler(row, detail.selected ? 'onSelect' : 'onDeselect', detail);
    if (destroyed) return true;
    if (!detail.selected && Utils.isFunction(opts.onDeselect)) opts.onDeselect(detail);
    if (destroyed) return true;
    if (Utils.isFunction(opts.onSelect)) opts.onSelect(detail);
    if (destroyed) return true;
    emitter.emit(detail.selected ? 'select' : 'deselect', detail);
    if (destroyed) return true;
    if (beforeValues !== afterValues && !emitSelectionChange(detail)) return true;
    if (destroyed) return true;
    if (opts.hideSelected === true && opts.multiple === true && mounted) render('selection-hide');
    else syncRowStates();
    return true;
  }
    
  function activateRow(row, meta) {
    if (!row || row.type !== 'item' || isRowDisabled(row) || isComponentDisabled() || isReadOnly()) return false;
    var detail = {
      key: row.key,
      value: row.value,
      item: row.item,
      source: meta && meta.source ? meta.source : 'api',
      reason: meta && meta.reason ? meta.reason : 'activate',
      originalEvent: meta && meta.originalEvent ? meta.originalEvent : null,
      controller: api
    };
    if (Utils.isFunction(opts.onActivate) && opts.onActivate(detail) === false) {
      emitter.emit('activate', detail);
      return true;
    }
    emitter.emit('activate', detail);
    if (!isSelectable()) return true;
    selectRow(row, undefined, meta);
    return true;
  }
    
  function activateActive(meta) {
    var row = rowByKey(activeItem.activeKey);
    if (!row) return false;
    return activateRow(row, meta);
  }
    
  function ensureActiveVisible(key) {
    var row = rowByKey(key);
    if (!row) { if (pendingVirtualEnsureKey === String(key == null ? '' : key)) pendingVirtualEnsureKey = null; return false; }
    if (virtualList) {
      var index = activeIndex(row.key);
      if (index < 0) return false;
      pendingVirtualEnsureKey = virtualList.getRenderedElement(row.key) ? null : row.key;
      return virtualList.ensureVisible(index, { align: 'nearest' });
    }
    pendingVirtualEnsureKey = null;
    if (!root) return false;
    var element = null;
    var candidates = root.querySelectorAll('.qxframe9a7c2-item-collection-item');
    for (var candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      if (rowKey(candidates[candidateIndex]) === row.key) {
        element = candidates[candidateIndex];
        break;
      }
    }
    var vp = currentViewport();
    if (!element || !vp) return false;
    return ScrollVisibility.ensureVisible(vp, element, { axis: 'y', align: 'nearest' });
  }
    
  function bindVirtualFocus(controller) {
    var next = controller && Utils.isFunction(controller.registerDomain) ? controller : (keyboard && keyboard.virtualFocus ? keyboard.virtualFocus : null);
    if (!next) return null;
    if (virtualFocusDomain) virtualFocusDomain.destroy();
    virtualFocusController = next;
    virtualFocusDomain = next.registerDomain({
      name: ownerPrefix,
      getElement: function (key) { return getItemElement(key); },
      reconcile: function (key) {
        var current = rowByKey(key);
        if (current && !isRowDisabled(current)) return current.key;
        var rows = interactiveRows().filter(function (row) { return !isRowDisabled(row); });
        if (!rows.length) return null;
        var fallbackIndex = activeIndex();
        if (fallbackIndex < 0) fallbackIndex = 0;
        fallbackIndex = Math.min(fallbackIndex, rows.length - 1);
        return rows[fallbackIndex].key;
      },
      ensureVisible: function (key) { return ensureActiveVisible(key); }
    });
    if (activeItem.activeKey) {
      var state = next.getState();
      virtualFocusDomain.activate(activeItem.activeKey, { source: interactionSource, modality: state.modality, reason: 'bind-virtual-focus', ensureVisible: false });
    }
    return virtualFocusDomain;
  }
    
  function detachOptional(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }
  function hasChromeOutput(output) {
    if (output === undefined || output === null || output === false || output === '') return false;
    if (Array.isArray(output) && !output.length) return false;
    return true;
  }
  function ensureChromeNode(role) {
    var node = role === 'header' ? header : (role === 'load-more' ? loadMore : footer);
    if (node) return node;
    node = doc.createElement('div');
    node.classList.add('qxframe9a7c2-item-collection-' + role, ownerClass(role));
    projectUserClasses(node, role === 'load-more' ? 'loadMore' : role, null, { component: api, element: node });
    if (role === 'header') { header = node; domBinding.refs.header = node; }
    else if (role === 'load-more') { loadMore = node; domBinding.refs.loadMore = node; }
    else { footer = node; domBinding.refs.footer = node; }
    return node;
  }
  function ensureStatusNode() {
    if (status) return status;
    status = doc.createElement('div');
    status.classList.add('qxframe9a7c2-item-collection-status', ownerClass('status'));
    projectUserClasses(status, 'status', null, { component: api, element: status });
    domBinding.refs.status = status;
    return status;
  }
  function ensureSearchDOM() {
    if (!searchWrap) {
      searchWrap = doc.createElement('div');
      searchWrap.classList.add('qxframe9a7c2-item-collection-search', ownerClass('search'));
      projectUserClasses(searchWrap, 'search', null, { component: api, element: searchWrap });
      domBinding.refs.searchWrap = searchWrap;
    }
    if (!searchInput) {
      searchInput = doc.createElement('input');
      searchInput.classList.add('qxframe9a7c2-item-collection-search-input', ownerClass('search-input'));
      projectUserClasses(searchInput, 'searchInput', null, { component: api, element: searchInput });
      searchInput.type = 'text';
      searchWrap.appendChild(searchInput);
      domBinding.refs.searchInput = searchInput;
    } else if (searchInput.parentNode !== searchWrap) searchWrap.appendChild(searchInput);
    if (!searchBound) {
      scope.add(DOM.listen(searchInput, 'input', onSearchInput));
      scope.add(DOM.listen(searchInput, 'focus', function () { if (virtualFocusDomain) virtualFocusDomain.clear({ reason:'search-edit-focus' }); }));
      searchBound = true;
    }
    return searchWrap;
  }
  function syncChromeOrder() {
    if (!root || !body) return;
    var standard = [header, searchWrap, body, status, loadMore, footer].filter(Boolean);
    var wanted = standard.filter(function (node) { return node === body || node.parentNode === root; });
    var anchor = null;
    Array.prototype.some.call(root.childNodes || [], function (node) { if (standard.indexOf(node) >= 0) return false; anchor = node; return true; });
    var cursor = anchor;
    for (var index = wanted.length - 1; index >= 0; index -= 1) {
      var node = wanted[index];
      if (node.parentNode !== root || node.nextSibling !== cursor) root.insertBefore(node, cursor);
      cursor = node;
    }
  }
  function syncSearchDOM() {
    if (opts.searchable !== true) { detachOptional(searchWrap); return; }
    ensureSearchDOM();
    searchInput.value = searchState.query;
    searchInput.placeholder = opts.searchPlaceholder || '搜索';
    searchInput.disabled = isComponentDisabled();
    searchInput.tabIndex = -1;
    if (searchWrap.parentNode !== root) root.insertBefore(searchWrap, body);
    syncChromeOrder();
  }
  function renderChromePart(value, role) {
    var output = Utils.isFunction(value) ? value({ items:collection.items.slice(), rows:currentRows.slice(), controller:api }) : value;
    var current = role === 'header' ? header : (role === 'load-more' ? loadMore : footer);
    if (!hasChromeOutput(output)) { if (current) { current.textContent = ''; detachOptional(current); } return; }
    var node = ensureChromeNode(role);
    node.textContent = '';
    Renderer.append(node, output);
    node.classList.add('is-' + role);
    if (node.parentNode !== root) root.appendChild(node);
    syncChromeOrder();
  }
  function renderChrome() {
    syncSearchDOM();
    renderChromePart(opts.header, 'header');
    renderChromePart(opts.loadMore, 'load-more');
    renderChromePart(opts.footer, 'footer');
  }
    
  function renderStatus() {
    var show = false;
    var text = '';
    var empty = false;
    if (loadingValue) { show = true; text = opts.loadingText || '加载中…'; }
    else if (errorValue) { show = true; text = opts.errorText || (errorValue === true ? '加载失败' : String(errorValue && errorValue.message || errorValue)); }
    else if (!currentRows.length) { show = true; empty = true; }
    if (!show) { if (status) { status.textContent = ''; detachOptional(status); } return; }
    var node = ensureStatusNode();
    node.textContent = '';
    if (empty) EmptyProjection.render(node, { variant: 'simple', description: opts.emptyText || '暂无数据' });
    else DOM.setText(node, text);
    if (node.parentNode !== root) root.appendChild(node);
    syncChromeOrder();
  }
    
  function destroyScrollSurface() {
    if (scrollSurface && Utils.isFunction(scrollSurface.destroy)) scrollSurface.destroy();
    scrollSurface = null;
    if (scrollShell && scrollShell.parentNode) {
      if (viewport && viewport.parentNode === scrollShell) scrollShell.parentNode.insertBefore(viewport, scrollShell);
      scrollShell.parentNode.removeChild(scrollShell);
    }
    scrollShell = null;
  }
    
  function createScrollSurface(rootNode, viewportNode, contentNode) {
    if (!Utils.isFunction(opts.scrollAdapter)) return null;
    var created = opts.scrollAdapter({
      root: rootNode,
      viewport: viewportNode,
      content: contentNode || viewportNode,
      document: doc,
      axis: 'y',
      focusable: false,
      keyboard: false,
      scrollbarVisibility: opts.scrollbarVisibility || 'auto',
      edgeShadow: opts.scrollEdgeShadow === true,
      controller: api
    });
    if (!created || !Utils.isFunction(created.destroy) || !Utils.isFunction(created.refresh)) throw new TypeError('[QXFRAME9A7C2] ItemCollection scrollAdapter must return a Scroll-compatible instance.');
    scrollSurface = created;
    return created;
  }
    
  function ensureNonVirtualSurface() {
    if (virtualList) { destroyScrollSurface(); virtualList.destroy(); virtualList = null; if (Item.clearProjections) Item.clearProjections(body, true); body.textContent = ''; viewport = null; content = null; }
    if (!viewport || !content || !body.contains(viewport)) {
      destroyScrollSurface();
      if (Item.clearProjections) Item.clearProjections(body, true);
      body.textContent = '';
      var viewportDOM = DOMFactory.createViewport({ document: doc, options: opts });
      viewport = viewportDOM.viewport;
      content = viewportDOM.content;
      viewport.classList.add('qxframe9a7c2-item-collection-viewport', ownerClass('viewport'));
      content.classList.add('qxframe9a7c2-item-collection-content', ownerClass('content'));
      viewport.tabIndex = -1;
      if (Utils.isFunction(opts.scrollAdapter)) {
        scrollShell = doc.createElement('div');
        scrollShell.className = 'qxframe9a7c2-item-collection-scroll';
        scrollShell.appendChild(viewport);
        body.appendChild(scrollShell);
        createScrollSurface(scrollShell, viewport, content);
      } else body.appendChild(viewport);
    }
    viewport.style.height = opts.height !== undefined && opts.height !== null ? (typeof opts.height === 'number' ? opts.height + 'px' : String(opts.height)) : '';
    viewport.style.maxHeight = opts.maxHeight !== undefined && opts.maxHeight !== null ? (typeof opts.maxHeight === 'number' ? opts.maxHeight + 'px' : String(opts.maxHeight)) : '';
    if (scrollShell) {
      scrollShell.style.height = viewport.style.height;
      scrollShell.style.maxHeight = viewport.style.maxHeight;
    }
    return viewport;
  }
    
  function renderNonVirtual() {
    ensureNonVirtualSurface();
    if (Item.clearProjections) Item.clearProjections(content, true);
    content.textContent = '';
    var fragment = doc.createDocumentFragment();
    currentRows.forEach(function (row) { fragment.appendChild(createRowElement(row)); });
    content.appendChild(fragment);
  }
    
  function renderVirtual() {
    viewport = null;
    content = null;
    var explicitItemSize = hasOwn(opts, 'itemSize');
    var itemSizeNumber = Number(opts.itemSize);
    var itemSize = explicitItemSize && itemSizeNumber === 0 ? 0 : (itemSizeNumber > 0 ? itemSizeNumber : SIZE_PX[sizeName()]);
    var estimateSize = Math.max(1, Number(opts.estimateSize) || (itemSize > 0 ? itemSize : SIZE_PX[sizeName()]));
    if (!virtualList) {
      destroyScrollSurface();
      if (Item.clearProjections) Item.clearProjections(body, true);
      body.textContent = '';
      virtualList = VirtualList.create({
        container: body,
        items: currentRows,
        itemSize: itemSize,
        estimateSize: estimateSize,
        overscan: Math.max(0, Math.floor(Number(opts.overscan) || 4)),
        height: opts.height || opts.maxHeight || undefined,
        focusable: false,
        getKey: function (row) { return row.key; },
        itemRender: function (row) { var fragment = doc.createDocumentFragment(); renderRowContent(fragment, row); return fragment; },
        decorateItem: function (element, row) { decorateRow(element, row); },
        onRender: function () {
          nodeByKey.forEach(function (element, key) { if (!element || !body || !body.contains(element)) nodeByKey.delete(key); });
          syncRowStates();
          if (pendingVirtualEnsureKey) {
            var pendingKey = pendingVirtualEnsureKey;
            var pendingRow = rowByKey(pendingKey);
            var pendingIndex = pendingRow ? activeIndex(pendingRow.key) : -1;
            if (!pendingRow) pendingVirtualEnsureKey = null;
            else if (pendingIndex >= 0 && virtualList && virtualList.getRenderedElement(pendingKey)) {
              // First scroll for an unmounted variable-size target can only use
              // estimates. Once the target is mounted/measured, perform exactly
              // one measured nearest correction. Clearing before the write keeps
              // manual scrollbar movement from being fought on later renders.
              pendingVirtualEnsureKey = null;
              virtualList.ensureVisible(pendingIndex, { align: 'nearest' });
            }
          }
          if (virtualFocusDomain && virtualFocusDomain.refresh) virtualFocusDomain.refresh();
        },
        onRangeChange: function (detail) { emitter.emit('range-change', { range: detail.range, source: 'virtual-list', controller: api }); }
      });
      if (Utils.isFunction(opts.scrollAdapter)) createScrollSurface(virtualList.getRootElement(), virtualList.getViewportElement(), virtualList.getViewportElement());
    } else {
      virtualList.updateOptions({ items: currentRows, itemSize: itemSize, estimateSize: estimateSize, overscan: Math.max(0, Math.floor(Number(opts.overscan) || 4)), height: opts.height || opts.maxHeight || undefined, focusable: false });
    }
  }
    
  function render(reason) {
    if (destroyed || !mounted) return false;
    currentRows = buildRows();
    rebuildRowIndexes();
    if (pendingVirtualEnsureKey && !rowByKey(pendingVirtualEnsureKey)) pendingVirtualEnsureKey = null;
    activeItem.updateOptions({ loop: opts.loop === true });
    if (activeItem.activeKey && !rowByKey(activeItem.activeKey)) {
      activeItem.clear({ source: 'render', reason: 'active-removed' });
    }
    var pointerRow = pointerKey === null ? null : rowByKey(pointerKey);
    if (!pointerRow || pointerRow.disabled || isComponentDisabled()) pointerKey = null;
    renderChrome();
    renderStatus();
    if (status && status.parentNode === root) { ensureNonVirtualSurface(); if (Item.clearProjections) Item.clearProjections(content, true); content.textContent = ''; }
    else if (shouldVirtualize()) renderVirtual();
    else renderNonVirtual();
    if (scrollSurface && Utils.isFunction(scrollSurface.refresh)) scrollSurface.refresh('item-collection-' + (reason || 'render'));
    renderCount += 1;
    syncRowStates();
    if (virtualFocusDomain && virtualFocusDomain.refresh) virtualFocusDomain.refresh();
    var detail = { reason: reason || 'render', state: getState(), controller: api };
    if (Utils.isFunction(opts.onRender)) opts.onRender(detail);
    emitter.emit('render', detail);
    return true;
  }
    
  function buildDOM(target) {
    if (!doc || !Utils.isFunction(doc.createElement)) {
      throw new Error('[QXFRAME9A7C2] ItemCollection requires a browser DOM to mount.');
    }
    host = target || opts.container;
    if (!host && opts.elements == null) {
      throw new TypeError('[QXFRAME9A7C2] ItemCollection requires container/target or options.elements.');
    }
    
    domBinding = DOMBinding.resolve({
      options: opts,
      target: host,
      component: api,
      requiredRefs: ['root', 'body'],
      defaultFactory: DOMFactory.createDefaultDOM
    });
    root = domBinding.refs.root;
    syncRootTabStop();
    body = domBinding.refs.body;
    searchWrap = domBinding.refs.searchWrap || null;
    searchInput = domBinding.refs.searchInput || null;
    header = domBinding.refs.header || null;
    status = domBinding.refs.status || null;
    loadMore = domBinding.refs.loadMore || null;
    footer = domBinding.refs.footer || null;
    
    syncRootClasses();
    root.classList.add('qxframe9a7c2-item-collection', ownerClass('root'));
    projectUserClasses(root, 'root', null, { component: api, element: root }); projectUserStyles(root, 'root', null, { component: api, element: root });
    root.classList.toggle('is-disabled', isComponentDisabled());
    root.classList.toggle('is-readonly', isReadOnly());
    syncInteractionLock();
    body.classList.add('qxframe9a7c2-item-collection-body', ownerClass('body')); projectUserClasses(body, 'body', null, { component: api, element: body }); projectUserStyles(body, 'body', null, { component: api, element: body });
    if (header) { header.classList.add('qxframe9a7c2-item-collection-header', ownerClass('header')); projectUserClasses(header, 'header', null, { component: api, element: header }); }
    if (status) { status.classList.add('qxframe9a7c2-item-collection-status', ownerClass('status')); projectUserClasses(status, 'status', null, { component: api, element: status }); }
    if (loadMore) { loadMore.classList.add('qxframe9a7c2-item-collection-load-more', ownerClass('load-more')); projectUserClasses(loadMore, 'loadMore', null, { component: api, element: loadMore }); }
    if (footer) { footer.classList.add('qxframe9a7c2-item-collection-footer', ownerClass('footer')); projectUserClasses(footer, 'footer', null, { component: api, element: footer }); }
    if (searchWrap) { searchWrap.classList.add('qxframe9a7c2-item-collection-search', ownerClass('search')); projectUserClasses(searchWrap, 'search', null, { component: api, element: searchWrap }); }
    if (searchInput) { searchInput.classList.add('qxframe9a7c2-item-collection-search-input', ownerClass('search-input')); projectUserClasses(searchInput, 'searchInput', null, { component: api, element: searchInput }); searchInput.type = 'text'; }
    mounted = true;
    syncSearchDOM();
    if (header) detachOptional(header);
    if (status) detachOptional(status);
    if (loadMore) detachOptional(loadMore);
    if (footer) detachOptional(footer);
    syncChromeOrder();
    
    delegation = EventDelegation.create({ root: root });
    scope.add(function () { delegation.destroy(); });
    delegation.on('pointermove', '.qxframe9a7c2-item-collection-item', function (detail) {
      var key = rowKey(detail.target);
      var row = rowByKey(key);
      var previousPointerKey = pointerKey;
      interactionSource = 'pointer';
      pointerKey = (!isComponentDisabled() && row && !isRowDisabled(row)) ? key : null;
      syncRowStates();
      if (pointerKey !== previousPointerKey) emitHover({ reason: 'pointermove', originalEvent: detail.event });
    });
    delegation.on('pointerdown', '.qxframe9a7c2-item-collection-item', function (detail) {
      if (isComponentDisabled() || (detail.event && detail.event.button !== undefined && detail.event.button !== 0)) return;
      var key = rowKey(detail.target);
      var row = rowByKey(key);
      interactionSource = 'pointer';
      focusVisible = false;
      if (!row || isRowDisabled(row)) { pointerKey = null; syncRowStates(); return; }
      pointerKey = key;
      activeItem.set(key, { source: 'pointer', reason: 'pointer-active', originalEvent: detail.event });
      if (detail.event && !pointerTargetKeepsOwnFocus(detail.event.target, detail.target) && Utils.isFunction(detail.event.preventDefault)) detail.event.preventDefault();
      syncRowStates();
    });
    scope.add(InteractionModality.onChange(function (modality) { if (modality !== 'keyboard') setFocusVisible(false); }, root && root.ownerDocument || doc));
    scope.add(DOM.listen(doc, 'focusin', function (event) { if (focusEventBelongsToOwner(event)) syncRowStates(); }));
    scope.add(DOM.listen(doc, 'focusout', scheduleFocusSync));
    scope.add(DOM.listen(root, 'pointerleave', function (event) {
      if (pointerKey === null) return;
      pointerKey = null;
      syncRowStates();
      emitHover({ reason: 'pointerleave', originalEvent: event });
    }));
    delegation.on('click', '.qxframe9a7c2-item-collection-item', function (detail) {
      if (isComponentDisabled()) return;
      var key = rowKey(detail.target);
      var row = rowByKey(key);
      var source = DOM.activationSource(detail.event);
      if (!row || isRowDisabled(row)) { pointerKey = null; interactionSource = source === 'pointer' ? 'pointer' : interactionSource; if (source === 'pointer') focusVisible = false; syncRowStates(); return; }
      if (source === 'pointer') { interactionSource = 'pointer'; pointerKey = key; focusVisible = false; }
      var clickDetail = { key: key, value: row.value, item: row.item, source: source, originalEvent: detail.event, controller: api };
      if (callItemHandler(row, 'onClick', clickDetail) === false) return;
      if (Utils.isFunction(opts.onClick) && opts.onClick(clickDetail) === false) return;
      if (activeItem.activeKey !== key) activeItem.set(key, { source: source, reason: 'click-active-fallback', originalEvent: detail.event });
      emitter.emit('click', clickDetail);
      activateRow(row, { source: source, reason: 'click', originalEvent: detail.event });
      if (source === 'pointer' && !pointerTargetKeepsOwnFocus(detail.event && detail.event.target, detail.target)) focusWrap();
      syncRowStates();
    });
    
    keyboard = KeyboardNavigation.create({
      root: root,
      focusRoot: keyboardFocusOwner,
      activeItem: activeItem,
      orientation: 'vertical',
      loop: opts.loop === true,
      pageStep: Math.max(1, Math.floor(Number(opts.pageStep) || 10)),
      editableKeys: ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Enter', 'F6'],
      handlers: {
        F6: function (detail) {
          if (opts.searchable !== true || !searchInput || searchInput.disabled) return false;
          var owner = keyboardFocusOwner();
          if (detail.target === searchInput) {
            if (owner && owner !== searchInput) DOM.focusElement(owner, { preventScroll:true });
            if (virtualFocusDomain && activeItem.activeKey) virtualFocusDomain.activate(activeItem.activeKey, { source:'keyboard', reason:'search-edit-exit', originalEvent:detail.originalEvent, ensureVisible:true });
            return true;
          }
          if (virtualFocusDomain) virtualFocusDomain.clear({ reason:'search-edit-enter' });
          DOM.focusElement(searchInput, { preventScroll:true });
          return true;
        }
      },
      ensureVisible: function (key) { ensureActiveVisible(key); },
      onNavigate: function () {
        interactionSource = 'keyboard';
        pointerKey = null;
        focusVisible = true;
        syncRowStates();
      },
      onActivate: function (detail) {
        interactionSource = 'keyboard';
        pointerKey = null;
        focusVisible = true;
        syncRowStates();
        return activateActive({ source: 'keyboard', reason: detail.reason, originalEvent: detail.originalEvent });
      }
    });
    bindVirtualFocus(keyboard.virtualFocus);
    scope.add(DOM.listen(root, 'focusin', function (event) {
      if (event.target !== root || isComponentDisabled() || !InteractionModality.isKeyboard(doc)) return;
      interactionSource = 'keyboard';
      pointerKey = null;
      focusVisible = true;
      if (!activeItem.activeKey) activeItem.first({ source:'keyboard', reason:'collection-region-enter', originalEvent:event });
      if (virtualFocusDomain && activeItem.activeKey) virtualFocusDomain.activate(activeItem.activeKey, { source:'keyboard', modality:'keyboard', reason:'collection-region-enter', originalEvent:event, ensureVisible:true });
      syncRowStates();
    }));
    scope.add(function () { if (virtualFocusDomain) virtualFocusDomain.destroy(); virtualFocusDomain = null; virtualFocusController = null; });
    scope.add(function () { keyboard.destroy(); });
    
    render('mount');
    return api;
  }
    
  function onSearchInput(event) {
    setSearch(event.target.value, { source: 'input', reason: 'input', originalEvent: event });
  }
    
  function cancelSearchTimer() {
    if (searchDelayScheduler) searchDelayScheduler.cancel();
  }
  function invalidateSearchLoad(reason) {
    cancelSearchTimer();
    if (searchTask.pending) searchTask.cancel(reason || 'list-search-invalidated');
    loadingValue = false;
  }
    
  function runSearchLoad(meta) {
    if (!Utils.isFunction(opts.loadItems) || destroyed) return;
    if (searchTask.pending) searchTask.cancel('list-search-replaced');
    loadingValue = true;
    errorValue = null;
    if (mounted) render('search-loading');
    var promise = searchTask.run({
      searchValue: searchState.query,
      source: meta && meta.source || 'api',
      reason: meta && meta.reason || 'search',
      originalEvent: meta && meta.originalEvent || null
    }, { source: meta && meta.source || 'api' });
    var requestId = searchTask.requestId;
    promise.then(function (nextItems) {
      if (destroyed || searchTask.requestId !== requestId || searchTask.state !== 'success') return;
      loadingValue = false;
      errorValue = null;
      if (Array.isArray(nextItems)) collection.setItems(nextItems, { silent: true, source: 'search-load', reason: 'search-load' });
      if (mounted) render('search-load');
      var detail = { searchValue: searchState.query, items: Array.isArray(nextItems) ? nextItems.slice() : null, requestId: requestId, controller: api };
      if (Utils.isFunction(opts.onLoad)) opts.onLoad(detail);
      if (destroyed) return;
      emitter.emit('load', detail);
    }, function (error) {
      if (destroyed || searchTask.requestId !== requestId || searchTask.state !== 'error') return;
      loadingValue = false;
      errorValue = error || true;
      if (mounted) render('search-error');
      var detail = { searchValue: searchState.query, error: errorValue, requestId: requestId, controller: api };
      if (Utils.isFunction(opts.onLoadError)) opts.onLoadError(detail);
      if (destroyed) return;
      emitter.emit('load-error', detail);
    });
  }
    
  function scheduleSearchLoad(meta) {
    cancelSearchTimer();
    if (!Utils.isFunction(opts.loadItems)) return;
    if (searchTask.pending) searchTask.cancel('list-search-replaced');
    loadingValue = false;
    errorValue = null;
    var delay = Math.max(0, Number(opts.searchDebounce) || 0);
    if (!delay) { runSearchLoad(meta); return; }
    ensureSearchDelayScheduler().request(delay, meta || null);
  }
    
  function handleSearchChange(value, meta) {
    if (destroyed) return false;
    if (searchInput && searchInput.value !== value) searchInput.value = value;
    activeItem.clear({ source: meta.source || 'api', reason: 'search-reset' });
    if (mounted) render('search');
    var detail = { searchValue:value, source:meta.source || 'api', reason:meta.reason || 'search', originalEvent:meta.originalEvent || null, controller:api };
    if (meta.notify !== false && Utils.isFunction(opts.onSearch)) opts.onSearch(value, detail);
    if (destroyed) return false;
    if (meta.silent !== true) emitter.emit('search', detail);
    if (destroyed) return false;
    scheduleSearchLoad(meta);
    return true;
  }
  function setSearch(value, meta) { if (destroyed) return false; return searchState.set(value, meta || {}); }    
  function setItems(items, meta) {
    invalidateSearchLoad((meta && meta.reason) || 'list-items-replaced');
    var result = collection.setItems(Array.isArray(items) ? items : [], { silent: true, source: 'api', reason: 'list-items' });
    errorValue = null;
    if (mounted) render((meta && meta.reason) || 'items');
    return result;
  }
    
  function setValue(value, meta) {
    var before = selection.values.join('\u0000');
    var accepted = selection.set(value, { silent: true, source: (meta && meta.source) || 'api', reason: (meta && meta.reason) || 'set-value' });
    if (!accepted) return false;
    var currentValues = selection.values;
    selectionController.setAnchor(selectionChannel, currentValues.length ? currentValues[currentValues.length - 1] : null);
    var after = currentValues.join('\u0000');
    if (opts.hideSelected === true && opts.multiple === true && mounted) render('set-value-hide');
    else syncRowStates();
    if (before !== after && !(meta && meta.silent)) {
      var detail = {
        values: selection.values,
        value: selection.value,
        source: (meta && meta.source) || 'api',
        reason: (meta && meta.reason) || 'set-value',
        controller: api
      };
      emitSelectionChange(detail);
    }
    return true;
  }
    
  function selectValue(value, meta) {
    var row = rowByValue(value);
    return row ? selectRow(row, true, meta || { source: 'api', reason: 'select-value' }) : false;
  }
    
  function deselectValue(value, meta) {
    var row = rowByValue(value);
    if (!row) {
      var before = selection.values.join('\u0000');
      selection.deselect(value, meta);
      if (before !== selection.values.join('\u0000')) emitSelectionChange({ value: selection.value, values: selection.values, source: 'api', reason: 'deselect-value', controller: api });
      syncRowStates();
      return true;
    }
    return selectRow(row, false, meta || { source: 'api', reason: 'deselect-value' });
  }
    
  function toggleValue(value, meta) {
    var row = rowByValue(value);
    return row ? selectRow(row, undefined, meta || { source: 'api', reason: 'toggle-value' }) : false;
  }
    
  function focusWrap() {
    var owner = keyboardFocusOwner();
    if (!owner || !Utils.isFunction(owner.focus) || isComponentDisabled()) return false;
    DOM.focusElement(owner);
    syncRowStates();
    return ownsBrowserFocus();
  }
    
  function setActiveAndFocus(action, reason) {
    var changed = action({ source: 'api', reason: reason });
    if (changed) {
      ensureActiveVisible(activeItem.activeKey);
      focusWrap();
    }
    return changed;
  }
    
  function selectedAnchorRow() {
    var selectionAnchorValue = selectionController.getAnchor(selectionChannel);
    var row = selectionAnchorValue === null ? null : rowByValue(selectionAnchorValue);
    if (row && !isRowDisabled(row)) return row;
    var values = selection.values;
    for (var i = values.length - 1; i >= 0; i -= 1) {
      row = rowByValue(values[i]);
      if (row && !isRowDisabled(row)) {
        selectionController.setAnchor(selectionChannel, row.value);
        return row;
      }
    }
    selectionController.clearAnchor(selectionChannel);
    return null;
  }
    
  function focusSelected() {
    var row = selectedAnchorRow();
    if (row) {
      activeItem.set(row.key, { source: 'api', reason: 'focus-selected' });
      ensureActiveVisible(row.key);
      focusWrap();
      return true;
    }
    return setActiveAndFocus(activeItem.first, 'focus-selected-fallback');
  }
    
  function scrollTo(config) {
    if (destroyed || !mounted) return false;
    var local = config || {};
    if (!hasOwn(local, 'key')) throw new TypeError('[QXFRAME9A7C2] ItemCollection scrollTo requires { key }.');
    var key = String(local.key), index = -1;
    for (var i = 0; i < currentRows.length; i += 1) if (currentRows[i].key === key) { index = i; break; }
    if (index < 0) return false;
    var align = String(local.align || 'nearest');
    if (['start','center','end','nearest'].indexOf(align) < 0) throw new TypeError('[QXFRAME9A7C2] ItemCollection scrollTo align must be start, center, end, or nearest.');
    var offset = Number(local.offset) || 0;
    if (virtualList) {
      return virtualList.scrollToIndex(index, { align:align, offset:offset });
    }
    var node = getItemElement(key);
    if (!node) return false;
    var vp = currentViewport();
    if (!vp) return false;
    return ScrollVisibility.ensureVisible(vp, node, { axis: 'y', align: align, offset: offset });
  }
    
  function setActiveKey(key, meta) {
    var detail = meta || { source: 'api', reason: 'set-active-key' };
    if (detail.source === 'keyboard') { interactionSource = 'keyboard'; pointerKey = null; focusVisible = true; }
    else if (detail.source === 'pointer') { interactionSource = 'pointer'; focusVisible = false; }
    var changed = activeItem.set(key, detail);
    // ActiveItem silent suppresses public change callbacks, not the ItemCollection-owned
    // interaction modality projection. Keep row classes in sync for composed owners.
    if (detail.silent === true) syncRowStates();
    return changed;
  }
    
  function prepareOpen(config) {
    var cfg = config || {};
    var strategy = String(cfg.strategy || 'selected');
    var source = cfg.source || (strategy === 'none' ? 'api' : 'keyboard');
    var reason = cfg.reason || ('prepare-open-' + strategy);
    var row = null;
    
    if (strategy === 'none') {
      pointerKey = null;
      return activeItem.clear({ source: source, reason: reason });
    }
    
    if (strategy === 'selected') {
      row = selectedAnchorRow();
      if (row) {
        activeItem.set(row.key, { source: source, reason: reason });
        ensureActiveVisible(row.key);
        return true;
      }
      strategy = String(cfg.fallback || 'first');
      if (strategy === 'none') return activeItem.clear({ source: source, reason: reason + '-fallback-none' });
    }
    
    if (strategy === 'last') return activeItem.last({ source: source, reason: reason });
    if (strategy === 'first') return activeItem.first({ source: source, reason: reason });
    throw new TypeError('[QXFRAME9A7C2] ItemCollection prepareOpen strategy must be none, selected, first, or last.');
  }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    assertCanonicalOptions(nextOptions);
    if (hasOwn(nextOptions, 'ownerPrefix') && normalizeOwnerPrefix(nextOptions.ownerPrefix, ownerPrefix) !== ownerPrefix) {
      throw new Error('[QXFRAME9A7C2] ItemCollection ownerPrefix is immutable; destroy and recreate to change semantic ownership.');
    }
    if (hasOwn(nextOptions, 'selectionController') && nextOptions.selectionController !== selectionController) throw new Error('[QXFRAME9A7C2] ItemCollection selectionController is immutable.');
    if (hasOwn(nextOptions, 'selectionChannel') && String(nextOptions.selectionChannel || 'selected') !== selectionChannel) throw new Error('[QXFRAME9A7C2] ItemCollection selectionChannel is immutable.');
    var next = mergeOptions({}, nextOptions);
    if (hasOwn(next, 'items') || hasOwn(next, 'loadItems') || hasOwn(next, 'searchValue')) invalidateSearchLoad('list-options-replaced');
    opts = mergeOptions(opts, next);
    ownerPrefix = normalizeOwnerPrefix(opts.ownerPrefix, ownerPrefix);
    collection.updateOptions(next);
    selection.updateOptions({ multiple: opts.multiple === true, maxCount: opts.maxCount });
    if (Object.prototype.hasOwnProperty.call(Object(next), 'value')) setValue(next.value, { silent: true, source: 'options', reason: 'options-value' });
    if (Object.prototype.hasOwnProperty.call(Object(next), 'items')) collection.setItems(Array.isArray(next.items) ? next.items : [], { silent: true, source: 'options' });
    if (Object.prototype.hasOwnProperty.call(Object(next), 'searchValue')) searchState.set(next.searchValue, { silent:true, notify:false, source:'options', reason:'options-search' });
    if (hasOwn(next, 'loading')) loadingValue = next.loading === true;
    if (hasOwn(next, 'error')) errorValue = next.error || null;
    activeItem.updateOptions({ loop: opts.loop === true });
    if (root) {
      syncRootClasses();
      root.classList.toggle('is-disabled', isComponentDisabled());
      root.classList.toggle('is-readonly', isReadOnly());
      syncInteractionLock();
      syncRootTabStop();
      if (isComponentDisabled()) pointerKey = null;
      syncSearchDOM();
    }
    if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
    if (mounted) render('options');
    return api;
  }
    
  function getState() {
    var range = virtualList ? virtualList.getVisibleRange() : null;
    return Object.freeze({
      value: selection.value,
      values: selection.values,
      activeKey: activeItem.activeKey || null,
      pointerKey: pointerKey,
      interactionSource: interactionSource,
      focusVisible: focusVisible === true,
      visibleActiveKey: visibleActiveKey() || null,
      selectionAnchorValue: selectionController.getAnchor(selectionChannel),
      selectionDataRevision: Utils.isFunction(selectionController.getDataRevision) ? selectionController.getDataRevision(selectionChannel) : selectionController.dataRevision,
      searchValue: searchState.query,
      disabled: isComponentDisabled(),
      readOnly: isReadOnly(),
      loading: loadingValue,
      error: errorValue,
      virtual: !!virtualList,
      visibleCount: interactiveRows().length,
      unpagedVisibleCount: unpagedVisibleCount,
      page: pageValue(),
      pageSize: pageSizeValue(),
      renderedCount: root ? root.querySelectorAll('.qxframe9a7c2-item-collection-item').length : 0,
      range: range,
      renderCount: renderCount,
      selectionAppearance: selectionAppearance(),
      split: opts.split === true, itemLayout: String(opts.itemLayout || 'horizontal'), stickyGroups: opts.stickyGroups === true,
      mounted: mounted,
      destroyed: destroyed
    });
  }
    
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    cancelSearchTimer();
    if (searchTask.pending) searchTask.cancel('list-destroy');
    destroyScrollSurface();
    if (virtualList) virtualList.destroy();
    virtualList = null;
    scope.dispose();
    keyboard = null;
    delegation = null;
    activeItem.destroy();
    if (ownsSelectionController && selectionController) selectionController.destroy();
    selection = null;
    selectionController = null;
    collection.destroy();
    searchState.destroy();
    emitter.dispose();
    if (root && Item.clearProjections) Item.clearProjections(root, true);
    if (domBinding) domBinding.release();
    domBinding = null;
    host = null;
    root = null;
    searchWrap = null;
    searchInput = null;
    header = null;
    body = null;
    viewport = null;
    content = null;
    status = null;
    loadMore = null;
    footer = null;
    currentRows = [];
    interactiveRowsCache = [];
    rowByKeyMap.clear();
    rowByValueMap.clear();
    interactiveIndexByKey.clear();
    nodeByKey.clear();
    mounted = false;
    return true;
  }
    
  api = {
    mount: buildDOM,
    render: render,
    setItems: setItems,
    setSearch: setSearch,
    setValue: setValue,
    clear: function (meta) { return setValue([], meta || { source: 'api', reason: 'clear' }); },
    selectValue: selectValue,
    deselectValue: deselectValue,
    toggleValue: toggleValue,
    setActiveKey: setActiveKey,
    resetActive: function (meta) { return activeItem.clear(meta || { source: 'api', reason: 'reset-active' }); },
    prepareOpen: prepareOpen,
    focusFirst: function () { return setActiveAndFocus(activeItem.first, 'focus-first'); },
    focusLast: function () { return setActiveAndFocus(activeItem.last, 'focus-last'); },
    focusSelected: focusSelected,
    focusSearch: function () {
      if (!searchInput || !searchWrap || searchWrap.parentNode !== root || !Utils.isFunction(searchInput.focus)) return false;
      DOM.focusElement(searchInput);
      return true;
    },
    focusWrap: focusWrap,
    scrollTo: scrollTo,
    handleKeydown: function (event) { return keyboard ? keyboard.handle(event) : false; },
    refreshItemStates: function () { syncRowStates(); return api; },
    updateOptions: updateOptions,
    setDisabled: function (value) { return updateOptions({ disabled: value === true }); },
    setReadOnly: function (value) { return updateOptions({ readOnly: value === true }); },
    setLoading: function (value) { loadingValue = value === true; if (loadingValue) errorValue = null; if (mounted) render('loading'); return api; },
    setError: function (value) { errorValue = value || null; loadingValue = false; if (mounted) render('error'); return api; },
    getItems: function () { return collection.items.slice(); },
    getVisibleItems: function () { return interactiveRows().map(function (row) { return row.item; }); },
    getSelectedItems: function () { return selection.values.map(sourceItemByValue).filter(Boolean); },
    getState: getState,
    getCollection: function () { return collection; },
    getSelection: function () { return selection; },
    getSelectionController: function () { return selectionController; },
    getActiveItem: function () { return activeItem; },
    getVirtualList: function () { return virtualList; },
    getScroll: function () { return scrollSurface; },
    getEventDelegation: function () { return delegation; },
    getKeyboardNavigation: function () { return keyboard; },
    getVirtualFocusDomain: function () { return virtualFocusDomain; },
    bindVirtualFocus: bindVirtualFocus,
    getRootElement: function () { return root; },
    getViewportElement: currentViewport,
    getItemElement: getItemElement,
    getRefs: function () { return domBinding ? domBinding.refs : null; },
    getDOMSource: function () { return domBinding ? domBinding.source : null; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  };
    
  Object.defineProperties(api, {
    mounted: { enumerable: true, get: function () { return mounted; } },
    destroyed: { enumerable: true, get: function () { return destroyed; } }
  });
    
  currentRows = buildRows();
  rebuildRowIndexes();
  if (opts.container || opts.elements) buildDOM(opts.container || null);
  return api;
}

export const ItemCollection = Object.freeze({ create, createDefaultDOM: DOMFactory.createDefaultDOM });
