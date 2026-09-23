import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { mergeOptions } from '../core/options.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { TreeModel } from '../core/treeModel.js';
import { SearchState } from '../core/searchState.js';
import { ItemSchema } from '../core/itemSchema.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { HierarchicalSelection } from '../core/hierarchicalSelection.js';
import { Selection } from '../core/selection.js';
import { Disclosure } from '../core/disclosure.js';
import { AsyncTaskGroup } from '../core/asyncTaskGroup.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { Renderer } from '../core/renderer.js';
import { ItemCollection } from './item-collection.js';
import { Item } from './item.js';
import { URLPolicy } from '../utils/url.js';
import { Utils } from '../utils/utils.js';

const LEGACY_OPTIONS = Object.freeze([
  'target','el','mount','nodes','data','treeData','expandedIds','selectedId','selectedIds','checkedIds','checkedValues',
  'defaultCheckedKeys','defaultExpandedIds','activeId','focusedId','loadData','load','allowDrag','allowDrop','droppable',
  'fieldNames','nodeKey','props','showCheckbox','expandOnClickNode','checkOnClickNode','autoExpandSelectedParents','expandSelectedPath'
]);
const hasOwn = Utils.own;
function assertCanonicalOptions(options) {
  const source = options || {};
  LEGACY_OPTIONS.forEach(name => { if (hasOwn(source, name)) throw new TypeError('[QXFRAME9A7C2] Tree does not accept legacy/non-canonical option "' + name + '".'); });
}

function setupTreeRuntime(instance) {
        var opts = Utils.mergeOwn( instance.options);
        validateItems(opts.items, opts);
    
        var doc = opts.document || (opts.container && opts.container.ownerDocument) || globalThis.document;
        var emitter = Object.freeze({ emit: function(type, detail) { return instance.emit(type, detail); } });
        var scope = Lifecycle.createScope();
        var model = null;
        var list = null;
        var root = null;
        var destroyed = false;
        var api = instance;
        var searchState = SearchState.create({ query:'', onChange:function(value,meta){ if (destroyed) return; refresh('search'); var payload={searchValue:value,source:meta.source||'api',reason:meta.reason||'search',tree:api}; if(meta.notify!==false&&Utils.isFunction(opts.onSearch))opts.onSearch(value,payload); if(meta.silent!==true)emitter.emit('search',payload); } });
        var loadedChildren = new Map();
        var loadingKeys = new Set();
        var toggleKeyByNode = typeof WeakMap === 'function' ? new WeakMap() : null;
        var checkKeyByNode = typeof WeakMap === 'function' ? new WeakMap() : null;
        var loadedKeys = new Set((Array.isArray(opts.loadedKeys) ? opts.loadedKeys : []).map(String));
        var loadTasks = AsyncTaskGroup.create({
          task: function (input, context) {
            var record = input.record, meta = input.meta || {};
            try {
              return Promise.resolve(opts.loadChildren(record.item, {
                key: record.key, source: meta.source || 'api', reason: meta.reason || 'expand', originalEvent: meta.originalEvent || null,
                signal: context.signal, tree: api
              })).then(function (children) { return { children: children, isCurrent: context.isCurrent }; }, function (error) { return { error: error, isCurrent: context.isCurrent }; });
            } catch (error) { return Promise.resolve({ error: error, isCurrent: context.isCurrent }); }
          }
        });
        var indeterminateKeys = new Set();
        var dragSession = null;
    
        var itemAccessors = ItemAccessors.create({
          getKey: function (item, index) {
            if (Utils.isFunction(opts.getKey)) return opts.getKey(item, index);
            if (item && typeof item === 'object' && item.id !== undefined) throw new TypeError('[QXFRAME9A7C2] Tree item.id is not canonical. Use item.key or explicit getKey().');
            return item && typeof item === 'object' ? item.key : undefined;
          },
          getItems: function (item, index) {
            if (Utils.isFunction(opts.getItems)) return opts.getItems(item, index);
            if (item && typeof item === 'object' && item.children !== undefined) throw new TypeError('[QXFRAME9A7C2] Tree item.children is not canonical. Use item.items or explicit getItems().');
            return item && typeof item === 'object' ? item.items : [];
          },
          getLabel: function (item, index) { return Utils.isFunction(opts.getLabel) ? opts.getLabel(item, index) : (item && typeof item === 'object' ? item.label : undefined); },
          getValue: function (item, index) { return Utils.isFunction(opts.getValue) ? opts.getValue(item, index) : (item && typeof item === 'object' ? item.value : undefined); },
          isItemDisabled: function (item, index) { return Utils.isFunction(opts.isItemDisabled) ? opts.isItemDisabled(item, index) === true : !!(item && typeof item === 'object' && item.disabled === true); }
        });
        function keyOf(item, index) { return itemAccessors.key(item, index); }
        function itemsOf(item, index) {
          var normalizedKey = keyOf(item, index);
          if (normalizedKey && loadedChildren.has(normalizedKey)) return loadedChildren.get(normalizedKey).slice();
          return itemAccessors.children(item, index);
        }
        function labelOf(item, index) { return itemAccessors.label(item, index); }
        function valueOf(item, index) { return itemAccessors.value(item, index); }
        function disabledOf(item, index) { return itemAccessors.disabled(item, index); }

        function selectableOf(item, index) {
          if (disabledOf(item, index)) return false;
          if (Utils.isFunction(opts.selectable)) return opts.selectable(item, index) !== false;
          if (item && typeof item === 'object' && item.selectable === false) return false;
          return opts.selectable !== false;
        }
    
        function checkableOf(item, index) {
          if (opts.checkable === false) return false;
          if (disabledOf(item, index)) return false;
          if (Utils.isFunction(opts.checkable)) return opts.checkable(item, index) !== false;
          if (item && typeof item === 'object' && item.checkable === false) return false;
          return opts.checkable === true;
        }
    
        function draggableOf(item, index) {
          if (InteractionPolicy.mutationLocked(opts) || disabledOf(item, index)) return false;
          if (Utils.isFunction(opts.draggable)) return opts.draggable(item, index) === true;
          if (item && typeof item === 'object' && item.draggable === false) return false;
          return opts.draggable === true;
        }
    
        function validateItems(items, config) {
          return ItemSchema.validate(items, {
            label: 'Tree items', uniqueKeys: false,
            keyOf: function (item, index) { return Utils.isFunction(config.getKey) ? config.getKey(item, index) : item.key; },
            childrenOf: function (item) {
              if (Utils.isFunction(config.getItems)) return config.getItems(item);
              if (item.children !== undefined) throw new TypeError('[QXFRAME9A7C2] Tree item.children is not canonical. Use item.items or explicit getItems().');
              return item.items;
            },
            validateItem: function (item) {
              if (!Utils.isFunction(config.getKey)) {
                if (item.id !== undefined) throw new TypeError('[QXFRAME9A7C2] Tree item.id is not canonical. Use item.key or explicit getKey().');
                if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] Tree item.key is required unless getKey is supplied.');
              }
              if (!Utils.isFunction(config.getLabel) && (item.label === undefined || item.label === null)) throw new TypeError('[QXFRAME9A7C2] Tree item.label is required unless getLabel is supplied.');
              if (!Utils.isFunction(config.getValue) && (item.value === undefined || item.value === null)) throw new TypeError('[QXFRAME9A7C2] Tree item.value is required unless getValue is supplied.');
            }
          });
        }

        model = TreeModel.create({
          items: Array.isArray(opts.items) ? opts.items : [],
          rootKey: opts.rootKey,
          maxNodes: opts.maxNodes,
          getKey: keyOf,
          getItems: itemsOf,
          getParentKey: opts.getParentKey
        });
        var checkHierarchy = HierarchicalSelection.create({
          childrenOf: function (record) { return record && model ? model.getChildren(record.key) : []; },
          keyOf: function (record) { return record && record.key; },
          disabledOf: function (record) { return !record || !checkableOf(record.item, record.index); }
        });
        function checkRoots() { return model ? model.getChildren(model.rootKey) : []; }
    
        function recordByValue(value) {
          var needle = value === undefined || value === null ? '' : String(value);
          for (var index = 0; index < model.records.length; index += 1) {
            var record = model.records[index];
            if (String(valueOf(record.item, record.index)) === needle) return record;
          }
          return null;
        }
    
        function initialExpandedKeys() {
          if (Array.isArray(opts.expandedKeys)) return opts.expandedKeys.map(String);
          if (Array.isArray(opts.defaultExpandedKeys)) return opts.defaultExpandedKeys.map(String);
          if (opts.defaultExpandAll === true) return model.records.filter(function (record) { return model.hasChildren(record.key); }).map(function (record) { return record.key; });
          return [];
        }
    
        var disclosure = Disclosure.create({ value: initialExpandedKeys() });
        var checkedSelection = Selection.create({ multiple: true, value: Array.isArray(opts.checkedKeys) ? opts.checkedKeys.map(String) : [] });
    
        function expandedKeys() { return disclosure.getState().value; }
        function expandedSet() { return new Set(expandedKeys()); }
        function isExpanded(key) { return disclosure.has(String(key)); }
    
        function isLazyExpandable(record) {
          if (!record || !Utils.isFunction(opts.loadChildren)) return false;
          if (record.item && record.item.leaf === true) return false;
          if (loadedKeys.has(record.key)) return false;
          return !model.hasChildren(record.key);
        }
    
        function canExpand(record) { return !!(record && (model.hasChildren(record.key) || isLazyExpandable(record))); }
    
        function rowOf(record) {
          var item = record.item;
          return {
            key: record.key,
            value: valueOf(item, record.index),
            label: labelOf(item, record.index),
            disabled: disabledOf(item, record.index),
            depth: record.depth,
            parentKey: record.parentKey,
            hasItems: canExpand(record),
            item: item,
            record: record
          };
        }
    
        function matchesRecord(record, query) {
          if (Utils.isFunction(opts.filterItem)) return opts.filterItem(query, record.item, { key: record.key, record: record, tree: api }) !== false;
          return String(labelOf(record.item, record.index)).toLocaleLowerCase().indexOf(query) >= 0;
        }
    
        function visibleRecords() {
          var query = searchState.query.trim().toLocaleLowerCase();
          if (!query) return model.flattenVisible(expandedSet());
          var visible = new Set();
          model.records.forEach(function (record) {
            if (!matchesRecord(record, query)) return;
            visible.add(record.key);
            model.getAncestors(record.key).forEach(function (ancestor) { visible.add(ancestor.key); });
          });
          return model.records.filter(function (record) { return visible.has(record.key); });
        }
    
        function rows() { return visibleRecords().map(rowOf); }
    
        function selectableDescendant(record, selectedValues) {
          if (!record) return false;
          var values = Array.isArray(selectedValues) ? selectedValues.map(String) : (list ? list.getSelection().values.map(String) : []);
          if (!values.length) return false;
          var selected = new Set(values);
          var nested = model.getDescendants(record.key);
          for (var index = 0; index < nested.length; index += 1) {
            if (selected.has(String(valueOf(nested[index].item, nested[index].index)))) return true;
          }
          return false;
        }
    
        function checkedSet() { return new Set(checkedSelection.values.map(String)); }

        function normalizeChecked(keys) {
          var normalized = checkHierarchy.normalizeCascade(checkRoots(), keys, { strict:opts.checkStrictly === true });
          indeterminateKeys = new Set(normalized.indeterminateKeys);
          return new Set(normalized.checkedKeys);
        }

        function applyChecked(keys, meta) {
          if (destroyed) return false;
          var before = checkedSelection.values.map(String);
          var next = normalizeChecked(keys);
          checkedSelection.set(Array.from(next), { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'tree-check' });
          var after = checkedSelection.values.map(String);
          var changed = before.join('\u0000') !== after.join('\u0000');
          if (list) { list.refreshItemStates(); syncTreeRows(); }
          if (changed && !(meta && meta.silent)) {
            var payload = {
              key: meta && meta.key || null,
              checked: meta && meta.checked,
              checkedKeys: after.slice(),
              indeterminateKeys: Array.from(indeterminateKeys),
              source: meta && meta.source || 'api',
              reason: meta && meta.reason || 'tree-check',
              originalEvent: meta && meta.originalEvent || null,
              tree: api
            };
            if (Utils.isFunction(opts.onCheck)) opts.onCheck(payload.checkedKeys.slice(), payload);
            emitter.emit('check', payload);
          }
          return changed;
        }
    
        function setCheckedKeys(keys, meta) {
          applyChecked(Array.isArray(keys) ? keys : [], mergeOptions({ reason: 'set-checked-keys' }, meta));
          return api;
        }
    
        function check(key, next, meta) {
          if (destroyed) return false;
          var record = model.getRecord(String(key));
          if (!record || !checkableOf(record.item, record.index)) return false;
          var current = checkedSet();
          var shouldCheck = next === undefined ? !current.has(record.key) : next === true;
          var beforePayload = { key: record.key, item: record.item, checked: shouldCheck, checkedKeys: Array.from(current), indeterminateKeys: Array.from(indeterminateKeys), source: meta && meta.source || 'api', reason: meta && meta.reason || 'check', originalEvent: meta && meta.originalEvent || null, tree: api };
          if (Utils.isFunction(opts.beforeCheck) && opts.beforeCheck(shouldCheck, beforePayload) === false) return false;
          var cascaded = checkHierarchy.toggleCascade(checkRoots(), record, current, shouldCheck, { strict:opts.checkStrictly === true });
          return applyChecked(cascaded.checkedKeys, mergeOptions({ key: record.key, checked: shouldCheck, reason: 'check' }, meta));
        }
    
        applyChecked(checkedSelection.values, { silent: true, reason: 'init-check' });
    
        function renderIcon(item) {
          var value = Utils.isFunction(opts.renderIcon) ? opts.renderIcon(item, { tree: api }) : (item && item.icon);
          if (value === undefined || value === null || value === '') return null;
          var node = doc.createElement('span');
          node.className = 'qxframe9a7c2-tree-icon';
          if (value && typeof value === 'object' && typeof value.nodeType === 'number') node.appendChild(value);
          else if (/^(?:https?:|data:|blob:|\/)/.test(String(value))) {
            var image = doc.createElement('img'); image.src = URLPolicy.sanitize(value, 'image'); image.alt = ''; node.appendChild(image);
          } else node.textContent = String(value);
          return node;
        }
    
        function isLastSibling(record) {
          if (!record) return true;
          var siblings = model.getChildren(record.parentKey);
          return !siblings.length || siblings[siblings.length - 1].key === record.key;
        }
    
        function renderTreeLines(row, indentSize) {
          if (opts.showLine !== true || !row || row.depth <= 0) return null;
          var lines = doc.createElement('span');
          lines.className = 'qxframe9a7c2-tree-lines';
          lines.style.width = String(row.depth * indentSize) + 'px';
    
          var ancestors = model.getAncestors(row.key).reverse();
          for (var level = 0; level < row.depth; level += 1) {
            var unit = doc.createElement('span');
            unit.className = 'qxframe9a7c2-tree-line-unit';
            unit.style.insetInlineStart = String(level * indentSize) + 'px';
            unit.style.width = String(indentSize) + 'px';
            if (level === row.depth - 1) {
              unit.classList.add('is-current');
              if (isLastSibling(row.record)) unit.classList.add('is-last');
            } else {
              unit.classList.add('is-ancestor');
              var ancestor = ancestors[level] || null;
              if (ancestor && !isLastSibling(ancestor)) unit.classList.add('is-continuation');
            }
            lines.appendChild(unit);
          }
          return lines;
        }
    
        function renderTreeRow(row, context) {
          var wrap = doc.createElement('span');
          var indentSize = Math.max(8, Number(opts.indent) || 18);
          wrap.className = 'qxframe9a7c2-tree-row-content';
          wrap.style.paddingInlineStart = String(Math.max(0, row.depth) * indentSize) + 'px';
          var lineProjection = renderTreeLines(row, indentSize);
          if (lineProjection) wrap.appendChild(lineProjection);
    
          function createToggle() {
            var toggle = doc.createElement('button');
            toggle.type = 'button'; toggle.className = 'qxframe9a7c2-tree-toggle'; toggle.tabIndex = -1;
            if (row.hasItems) {
              if (toggleKeyByNode) toggleKeyByNode.set(toggle, row.key);
              toggle.classList.toggle('is-loading', loadingKeys.has(row.key));
              var switcher = Utils.isFunction(opts.renderSwitcher) ? opts.renderSwitcher(row.item, { key:row.key, expanded:isExpanded(row.key), loading:loadingKeys.has(row.key), tree:api }) : null;
              if (switcher && typeof switcher === 'object' && typeof switcher.nodeType === 'number') toggle.appendChild(switcher);
              else if (switcher === undefined || switcher === null || switcher === '') { var toggleGlyph = doc.createElement('span'); toggleGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + (loadingKeys.has(row.key) ? 'sync' : (isExpanded(row.key) ? 'caret-down' : 'caret-right')) + ' is-line is-round is-stroke-3' + (loadingKeys.has(row.key) ? ' is-spin' : ''); toggle.appendChild(toggleGlyph); }
              else toggle.textContent = String(switcher);
            } else toggle.disabled = true;
            return toggle;
          }
          function createCheckbox() {
            if (opts.checkable === false) return null;
            var checkboxWrap = doc.createElement('span'); checkboxWrap.className = 'qxframe9a7c2-tree-check-wrap';
            var checkbox = doc.createElement('input'); checkbox.type = 'checkbox'; checkbox.className = 'qxframe9a7c2-tree-check'; checkbox.tabIndex = -1;
            if (checkKeyByNode) checkKeyByNode.set(checkbox, row.key);
            checkbox.checked = checkedSelection.has(row.key); checkbox.indeterminate = indeterminateKeys.has(row.key);
            checkbox.disabled = !checkableOf(row.item, row.record.index) || InteractionPolicy.mutationLocked(opts);
            var indicator = doc.createElement('span'); indicator.className = 'qxframe9a7c2-tree-check-indicator';
            checkboxWrap.appendChild(checkbox); checkboxWrap.appendChild(indicator); return checkboxWrap;
          }
          function createIconPart() { return renderIcon(row.item); }
          var toggle = createToggle(), checkbox = createCheckbox(), icon = createIconPart();
          var label = doc.createElement('span'); label.className = 'qxframe9a7c2-tree-label qxframe9a7c2-tree-content';
          if (Utils.isFunction(opts.itemRender)) {
            var rendererParts = Item.createParts ? Item.createParts({ arrow:function(){var claimed=toggle;toggle=null;return claimed;} }) : {};
            var itemCtx = Item.createContext(row.item, {
              index:context && context.index, key:row.key, value:row.value, element:label, component:api, controller:api,
              disabled:disabledOf(row.item, row.record.index), selected:context && context.selected === true, active:context && context.active === true,
              level:row.depth + 1, depth:row.depth, expanded:isExpanded(row.key), loading:loadingKeys.has(row.key), checked:checkedSelection.has(row.key),
              indeterminate:indeterminateKeys.has(row.key), isLeaf:!row.hasItems, hasItems:row.hasItems, parts:rendererParts
            });
            var rendered = opts.itemRender(row.item, itemCtx);
            Renderer.append(label, rendered === undefined || rendered === null ? String(row.label) : rendered);
          } else DOM.setText(label, row.label);
          if (toggle) wrap.appendChild(toggle);
          if (checkbox) wrap.appendChild(checkbox);
          if (icon) wrap.appendChild(icon);
          wrap.appendChild(label);
          return wrap;
        }
    
        function selectionPayload(detail) {
          var row = detail && detail.item;
          return {
            key: row ? row.key : detail && detail.key || '',
            value: detail && detail.value,
            values: detail && Array.isArray(detail.values) ? detail.values.slice() : [],
            item: row ? row.item : null,
            selected: detail && detail.selected,
            source: detail && detail.source || 'api',
            reason: detail && detail.reason || 'select',
            originalEvent: detail && detail.originalEvent || null,
            tree: api
          };
        }
    
        function treeKeyFromRowNode(node) {
          if (!node || !list || !model) return '';
          /* TreeModel exposes flattenVisible(), not getVisibleRecords(). Reuse Tree's
             own visibleRecords() projection so every rendered List row can be mapped
             back to its canonical record during live checked/indeterminate sync. */
          var visible = visibleRecords();
          for (var index = 0; index < visible.length; index += 1) {
            if (list.getItemElement && list.getItemElement(visible[index].key) === node) return visible[index].key;
          }
          return '';
        }
    
        function syncTreeRows() {
          if (!root || !model) return;
          root.classList.toggle('is-checkable', opts.checkable !== false);
          root.classList.toggle('is-draggable', opts.draggable !== false);
          root.classList.toggle('is-show-line', opts.showLine === true);
          root.classList.toggle('is-block-node', opts.blockNode === true);
          var nodes = root.querySelectorAll('.qxframe9a7c2-tree-item');
          Array.prototype.forEach.call(nodes, function (node) {
            var key = treeKeyFromRowNode(node);
            var record = model.getRecord(key);
            if (!record) return;
            var siblings = model.getChildren(record.parentKey);
            var position = siblings.findIndex(function (entry) { return entry.key === record.key; });
            var rowDisabled = disabledOf(record.item, record.index);
            var rowSelectable = selectableOf(record.item, record.index);
            node.draggable = draggableOf(record.item, record.index);
            var checkbox = node.querySelector('.qxframe9a7c2-tree-check');
            if (checkbox) {
              var isChecked = checkedSelection.has(record.key);
              var isMixed = indeterminateKeys.has(record.key);
              var canCheck = checkableOf(record.item, record.index);
              checkbox.checked = isChecked;
              checkbox.indeterminate = isMixed;
              checkbox.disabled = !canCheck || InteractionPolicy.mutationLocked(opts);
            }
          });
        }
    
        function refresh(reason) {
          if (destroyed || !list) return false;
          list.setItems(rows(), { reason: reason || 'tree-refresh' });
          if (root) root.classList.toggle('is-searching', !!searchState.query);
          syncTreeRows();
          return true;
        }
    
        function emitExpandChange(meta) {
          var payload = {
            key: meta && meta.key || null,
            expanded: meta && meta.expanded,
            expandedKeys: expandedKeys(),
            item: meta && meta.key ? model.getItem(meta.key) : null,
            source: meta && meta.source || 'api',
            reason: meta && meta.reason || 'expanded-keys',
            originalEvent: meta && meta.originalEvent || null,
            tree: api
          };
          if (Utils.isFunction(opts.onExpand)) opts.onExpand(payload.expandedKeys.slice(), payload);
          emitter.emit('expand', payload);
        }
    
        function loadRecord(record, meta) {
          if (!record || !isLazyExpandable(record) || loadingKeys.has(record.key)) return false;
          var key = record.key;
          loadingKeys.add(key);
          syncTreeRows();
          loadTasks.run(key, { record: record, meta: meta || {} }, { source: meta && meta.source || 'api' }).then(function (result) {
            if (!result || !result.isCurrent || !result.isCurrent() || destroyed) return;
            loadingKeys.delete(key);
            if (result.error) {
              syncTreeRows();
              var errorDetail = { key: key, item: record.item, error: result.error, tree: api };
              if (Utils.isFunction(opts.onLoadError)) opts.onLoadError(result.error, errorDetail);
              if (destroyed) return;
              emitter.emit('loadError', errorDetail);
              return;
            }
            var nextChildren = Array.isArray(result.children) ? result.children : [];
            try { validateItems(nextChildren, opts); }
            catch (error) {
              syncTreeRows();
              var validationDetail = { key: key, item: record.item, error: error, tree: api };
              if (Utils.isFunction(opts.onLoadError)) opts.onLoadError(error, validationDetail);
              if (destroyed) return;
              emitter.emit('loadError', validationDetail);
              return;
            }
            loadedKeys.add(key);
            loadedChildren.set(key, nextChildren.slice());
            model.updateOptions({ items: Array.isArray(opts.items) ? opts.items : [], getKey: keyOf, getItems: itemsOf, getParentKey: opts.getParentKey });
            pruneStateAfterModelChange();
            refresh('load-children');
            var detail = { key: key, item: record.item, items: nextChildren.slice(), loadedKeys: Array.from(loadedKeys), tree: api };
            if (Utils.isFunction(opts.onLoad)) opts.onLoad(nextChildren.slice(), detail);
            if (destroyed) return;
            emitter.emit('load', detail);
          });
          return true;
        }

        function expand(key, meta) {
          var normalized = String(key);
          var record = model.getRecord(normalized);
          if (destroyed || !canExpand(record) || isExpanded(normalized)) return false;
          if (Utils.isFunction(opts.beforeExpand) && opts.beforeExpand(true, { key: normalized, item: record.item, tree: api }) === false) return false;
          disclosure.set(normalized, true, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'expand' });
          refresh('expand');
          emitExpandChange({ key: normalized, expanded: true, source: meta && meta.source, reason: meta && meta.reason || 'expand', originalEvent: meta && meta.originalEvent });
          loadRecord(record, meta);
          return true;
        }
    
        function collapse(key, meta) {
          var normalized = String(key);
          var record = model.getRecord(normalized);
          if (destroyed || !isExpanded(normalized)) return false;
          if (Utils.isFunction(opts.beforeExpand) && opts.beforeExpand(false, { key: normalized, item: record ? record.item : null, tree: api }) === false) return false;
          disclosure.set(normalized, false, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'collapse' });
          refresh('collapse');
          emitExpandChange({ key: normalized, expanded: false, source: meta && meta.source, reason: meta && meta.reason || 'collapse', originalEvent: meta && meta.originalEvent });
          return true;
        }
    
        function toggleExpand(key, meta) { return isExpanded(key) ? collapse(key, meta) : expand(key, meta); }
    
        function setExpandedKeys(keys, meta) {
          if (destroyed) return api;
          var valid = (Array.isArray(keys) ? keys : []).map(String).filter(function (key) { return canExpand(model.getRecord(key)); });
          disclosure.setValue(valid, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-expanded-keys' });
          refresh('expanded-keys');
          emitExpandChange({ source: meta && meta.source, reason: meta && meta.reason || 'set-expanded-keys', originalEvent: meta && meta.originalEvent });
          valid.forEach(function (key) { loadRecord(model.getRecord(key), meta); });
          return api;
        }
    
        function expandAll(meta) {
          return setExpandedKeys(model.records.filter(canExpand).map(function (record) { return record.key; }), mergeOptions({ reason: 'expand-all' }, meta));
        }
    
        function collapseAll(meta) { return setExpandedKeys([], mergeOptions({ reason: 'collapse-all' }, meta)); }
    
        function expandAncestors(key, meta) {
          var record = model.getRecord(String(key));
          if (!record) return api;
          var next = new Set(expandedKeys());
          model.getAncestors(record.key).forEach(function (ancestor) { if (canExpand(ancestor)) next.add(ancestor.key); });
          if (meta && meta.includeSelf === true && canExpand(record)) next.add(record.key);
          return setExpandedKeys(Array.from(next), mergeOptions({ reason: 'expand-ancestors' }, meta));
        }
    
        function expandSelected(meta) {
          if (!list) return api;
          var next = new Set(expandedKeys());
          (list.getState().values || []).forEach(function (value) {
            var record = recordByValue(value);
            if (!record) return;
            model.getAncestors(record.key).forEach(function (ancestor) { if (canExpand(ancestor)) next.add(ancestor.key); });
            if (meta && meta.includeSelf === true && canExpand(record)) next.add(record.key);
          });
          return setExpandedKeys(Array.from(next), mergeOptions({ reason: 'expand-selected' }, meta));
        }
    
        function activeRecord() {
          if (!list) return null;
          var key = list.getState().activeKey;
          return key ? model.getRecord(key) : null;
        }
    
        function handleExpandCollapseKeydown(event) {
          if (destroyed || !event) return false;
          var record = activeRecord();
          if (!record) return false;
          var disclosureLocked = opts.disabled === true;
          if (event.key === 'ArrowRight') {
            if (!canExpand(record) || isExpanded(record.key) || disclosureLocked) return false;
            return expand(record.key, { source: 'keyboard', reason: 'hosted-arrow-right-expand', originalEvent: event });
          }
          if (event.key === 'ArrowLeft') {
            if (!canExpand(record) || !isExpanded(record.key) || disclosureLocked) return false;
            return collapse(record.key, { source: 'keyboard', reason: 'hosted-arrow-left-collapse', originalEvent: event });
          }
          return false;
        }
    
        function handleTreeKeydown(event) {
          if (destroyed || !event) return false;
          var record = activeRecord();
          if (!record) return false;
          var disclosureLocked = opts.disabled === true;
          var valueLocked = InteractionPolicy.mutationLocked(opts);
          if (event.key === 'ArrowRight') {
            if (!canExpand(record) || isExpanded(record.key) || disclosureLocked) return false;
            return expand(record.key, { source: 'keyboard', reason: 'arrow-right-expand', originalEvent: event });
          }
          if (event.key === 'ArrowLeft') {
            if (!canExpand(record) || !isExpanded(record.key) || disclosureLocked) return false;
            return collapse(record.key, { source: 'keyboard', reason: 'arrow-left-collapse', originalEvent: event });
          }
          /* Enter is activation/selection and intentionally falls through to List.
             Space is the Tree check contract. Disclosure stays exclusively on ←/→. */
          if ((event.key === ' ' || event.key === 'Spacebar') && opts.checkable !== false) {
            if (valueLocked) return false;
            return check(record.key, undefined, { source: 'keyboard', reason: 'space-check', originalEvent: event });
          }
          if ((event.ctrlKey || event.metaKey) && String(event.key).toLowerCase() === 'a' && opts.checkable !== false) {
            if (valueLocked) return false;
            var next = checkedSet();
            visibleRecords().forEach(function (entry) { if (checkableOf(entry.item, entry.index)) checkHierarchy.descendants(entry, true).forEach(function (key) { next.add(key); }); });
            return applyChecked(Array.from(next), { source: 'keyboard', reason: 'check-all-visible', originalEvent: event });
          }
          if (event.key === '*') {
            if (disclosureLocked) return false;
            var siblings = model.getChildren(record.parentKey).filter(canExpand);
            if (!siblings.length) return false;
            var keys = new Set(expandedKeys());
            siblings.forEach(function (sibling) { keys.add(sibling.key); });
            setExpandedKeys(Array.from(keys), { source: 'keyboard', reason: 'expand-siblings', originalEvent: event });
            return true;
          }
          return false;
        }
    
        function restoreSelectedExpansion() {
          if (!list || !model) return false;
          var next = new Set(expandedKeys());
          var before = next.size;
          (list.getState().values || []).forEach(function (value) {
            var record = recordByValue(value);
            if (!record) return;
            model.getAncestors(record.key).forEach(function (ancestor) { if (canExpand(ancestor)) next.add(ancestor.key); });
          });
          if (next.size === before) return false;
          disclosure.setValue(Array.from(next), { silent: true, source: 'api', reason: 'restore-selected-path' });
          refresh('restore-selected-path');
          return true;
        }
    
        function prepareOpen(config) {
          if (destroyed) return false;
          restoreSelectedExpansion();
          return list.prepareOpen(config);
        }
    
        function pruneStateAfterModelChange() {
          var validKeys = new Set(model.keys);
          disclosure.setValue(expandedKeys().filter(function (key) { return validKeys.has(key) && canExpand(model.getRecord(key)); }), { silent: true, reason: 'prune-expanded' });
          loadedKeys = new Set(Array.from(loadedKeys).filter(function (key) { return validKeys.has(key); }));
          loadingKeys = new Set(Array.from(loadingKeys).filter(function (key) { return validKeys.has(key); }));
          loadedChildren.forEach(function (_, key) { if (!validKeys.has(key)) loadedChildren.delete(key); });
          applyChecked(checkedSelection.values.filter(function (key) { return validKeys.has(String(key)); }), { silent: true, reason: 'prune-checked' });
        }
    
        function setItems(items) {
          if (destroyed) return api;
          validateItems(items, opts);
          opts.items = Array.isArray(items) ? items.slice() : [];
          loadedChildren.clear();
          loadingKeys.clear();
          loadedKeys.clear();
          loadTasks.invalidate('tree-items');
          model.setItems(opts.items, { silent: true, source: 'api', reason: 'tree-items' });
          pruneStateAfterModelChange();
          refresh('items');
          return api;
        }
    
        function setSearch(value, meta) { if (destroyed) return api; searchState.set(value, meta || {}); return api; }
    
        function dragPosition(event, row) {
          var rect = row.getBoundingClientRect();
          var height = Math.max(1, rect.height || 1);
          var offset = Number(event.clientY || 0) - rect.top;
          if (offset < height * 0.25) return 'before';
          if (offset > height * 0.75) return 'after';
          return 'inside';
        }
    
        function clearDragProjection() {
          if (!root) return;
          Array.prototype.forEach.call(root.querySelectorAll('.is-drop-before,.is-drop-after,.is-drop-inside,.is-dragging'), function (node) {
            node.classList.remove('is-drop-before','is-drop-after','is-drop-inside','is-dragging');
          });
        }
    
        function isDropAllowed(sourceKey, targetKey, position, event) {
          if (!sourceKey || !targetKey || sourceKey === targetKey) return false;
          var source = model.getRecord(sourceKey), target = model.getRecord(targetKey);
          if (!source || !target || disabledOf(target.item, target.index)) return false;
          if (model.getAncestors(target.key).some(function (ancestor) { return ancestor.key === source.key; })) return false;
          if (Utils.isFunction(opts.canDrop)) return opts.canDrop({ sourceKey: source.key, sourceItem: source.item, targetKey: target.key, targetItem: target.item, position: position, originalEvent: event, tree: api }) !== false;
          return true;
        }
    
        function setupRootEvents() {
          if (!root) return;
          scope.add(DOM.listen(root, 'click', function (event) {
            var toggle = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-tree-toggle') : null;
            var checkbox = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-tree-check') : null;
            if (toggle && root.contains(toggle)) {
              if (InteractionPolicy.mutationLocked(opts)) return;
              event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation();
              var toggleKey = toggleKeyByNode && toggleKeyByNode.get(toggle);
              if (toggleKey) list.setActiveKey(toggleKey, { source: DOM.activationSource(event), reason: 'toggle-active', originalEvent: event });
              toggleExpand(toggleKey, { source: DOM.activationSource(event), reason: 'toggle', originalEvent: event });
              list.focusWrap();
              return;
            }
            if (checkbox && root.contains(checkbox)) {
              if (InteractionPolicy.mutationLocked(opts)) return;
              /* Native checkbox activation flips .checked before click dispatch. Do not
                 preventDefault() here: cancelling the click would roll that native
                 activation back after Tree has already projected canonical state. */
              event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation();
              var checkboxKey = checkKeyByNode && checkKeyByNode.get(checkbox);
              if (checkboxKey) list.setActiveKey(checkboxKey, { source: DOM.activationSource(event), reason: 'checkbox-active', originalEvent: event });
              /* The canonical checked Selection owns the next state. A native checkbox's
                 transient .checked value is not a reliable command input during capture:
                 activation/default-action ordering can expose a value that is later
                 restored. Toggling canonical state also gives indeterminate parents the
                 correct meaning: partial -> fully checked (and therefore all descendants). */
              var checkboxNext = checkboxKey ? !checkedSelection.has(checkboxKey) : false;
              if (!check(checkboxKey, checkboxNext, { source: DOM.activationSource(event), reason: 'checkbox', originalEvent: event })) syncTreeRows();
              list.focusWrap();
            }
          }, true));
          scope.add(DOM.listen(root, 'keydown', function (event) {
            if (handleTreeKeydown(event)) {
              event.preventDefault(); event.stopPropagation(); if (event.stopImmediatePropagation) event.stopImmediatePropagation();
            }
          }, true));
          scope.add(DOM.listen(root, 'dragstart', function (event) {
            var row = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-tree-item') : null;
            if (!row || !root.contains(row) || !row.draggable) return;
            var key = treeKeyFromRowNode(row);
            var record = model.getRecord(key);
            if (!record || !draggableOf(record.item, record.index)) return;
            dragSession = { sourceKey: key, targetKey: null, position: null };
            row.classList.add('is-dragging');
            if (event.dataTransfer) { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', key); }
            var detail = { sourceKey: key, sourceItem: record.item, originalEvent: event, tree: api };
            if (Utils.isFunction(opts.onDragStart)) opts.onDragStart(detail);
            emitter.emit('dragStart', detail);
          }));
          scope.add(DOM.listen(root, 'dragover', function (event) {
            if (!dragSession) return;
            var row = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-tree-item') : null;
            if (!row || !root.contains(row)) return;
            var targetKey = treeKeyFromRowNode(row);
            var position = dragPosition(event, row);
            if (!isDropAllowed(dragSession.sourceKey, targetKey, position, event)) return;
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            clearDragProjection();
            var sourceNode = list && list.getItemElement ? list.getItemElement(dragSession.sourceKey) : null;
            if (sourceNode) sourceNode.classList.add('is-dragging');
            row.classList.add(position === 'before' ? 'is-drop-before' : (position === 'after' ? 'is-drop-after' : 'is-drop-inside'));
            dragSession.targetKey = targetKey;
            dragSession.position = position;
          }));
          scope.add(DOM.listen(root, 'drop', function (event) {
            if (!dragSession || !dragSession.targetKey || !dragSession.position) return;
            if (!isDropAllowed(dragSession.sourceKey, dragSession.targetKey, dragSession.position, event)) return;
            event.preventDefault();
            var source = model.getRecord(dragSession.sourceKey), target = model.getRecord(dragSession.targetKey);
            var detail = { sourceKey: source.key, sourceItem: source.item, targetKey: target.key, targetItem: target.item, position: dragSession.position, originalEvent: event, tree: api };
            clearDragProjection();
            dragSession = null;
            if (Utils.isFunction(opts.onMove)) opts.onMove(detail);
            emitter.emit('move', detail);
          }));
          scope.add(DOM.listen(root, 'dragend', function (event) {
            if (!dragSession) { clearDragProjection(); return; }
            var record = model.getRecord(dragSession.sourceKey);
            var detail = { sourceKey: dragSession.sourceKey, sourceItem: record ? record.item : null, originalEvent: event, tree: api };
            dragSession = null; clearDragProjection();
            if (Utils.isFunction(opts.onDragEnd)) opts.onDragEnd(detail);
            emitter.emit('dragEnd', detail);
          }));
        }
    
        list = ItemCollection.create({
          ownerPrefix: 'tree',
          container: opts.container,
          elements: opts.elements,
          items: rows(),
          value: opts.value !== undefined ? opts.value : opts.defaultValue,
          multiple: opts.multiple === true,
          selectable: opts.selectable !== false,
          selectionAppearance: opts.selectionAppearance || 'highlight',
          size: opts.size,
          disabled: opts.disabled === true,
          readOnly: opts.readOnly === true,
          virtual: opts.virtual,
          virtualThreshold: opts.virtualThreshold,
          height: opts.height,
          maxHeight: opts.maxHeight,
          scrollAdapter: opts.scrollAdapter,
          keyboardFocusOwner: opts.keyboardFocusOwner,
          getKey: function (row) { return row.key; },
          getLabel: function (row) { return row.label; },
          getValue: function (row) { return row.value; },
          isItemDisabled: function (row) { return row.disabled === true; },
          getItemState: function (row, context) { return { open: isExpanded(row.key), descendantSelected: selectableDescendant(row.record, context && context.values) }; },
          itemSemanticClasses: function () { return ['qxframe9a7c2-tree-item','qxframe9a7c2-tree-node']; },
          itemClassParts: ['item','node'],
          classes: opts.classes,
          styles: opts.styles,
          itemRender: renderTreeRow,
          beforeSelect: function (detail) {
            var row = detail && detail.item;
            if (!row || !selectableOf(row.item, row.record.index)) return false;
            if (Utils.isFunction(opts.beforeSelect)) return opts.beforeSelect(selectionPayload(detail)) !== false;
            return true;
          },
          beforeDeselect: function (detail) {
            var row = detail && detail.item;
            if (!row || !selectableOf(row.item, row.record.index)) return false;
            if (Utils.isFunction(opts.beforeSelect)) return opts.beforeSelect(selectionPayload(detail)) !== false;
            return true;
          },
          onClick: function (detail) {
            var row = detail && detail.item;
            if (!row || InteractionPolicy.mutationLocked(opts)) return true;
            var originalTarget = detail && detail.originalEvent && detail.originalEvent.target;
            var inlineControl = originalTarget && originalTarget.closest ? originalTarget.closest('.qxframe9a7c2-tree-toggle,.qxframe9a7c2-tree-check') : null;
            if (inlineControl && root && root.contains(inlineControl)) return false;
            if (opts.expandOnRowClick === true && canExpand(row.record)) toggleExpand(row.key, { source: 'pointer', reason: 'row-click-expand', originalEvent: detail.originalEvent });
            /* In multi-select Tree, row selection and checkbox checking are separate
               interaction owners. Pointer checking is checkbox-only even if a caller
               explicitly supplies checkOnRowClick:true. Single-select Tree keeps the
               opt-in row-check behavior for compatibility, but it is no longer the
               default contract. */
            if (opts.multiple !== true && opts.checkOnRowClick === true && opts.checkable !== false) {
              check(row.key, undefined, { source: 'pointer', reason: 'row-click-check', originalEvent: detail.originalEvent });
              return false;
            }
            return true;
          },
          onSelect: function (detail) {
            var payload = selectionPayload(detail);
            if (opts.expandSelectedAncestors === true && payload.selected === true) expandAncestors(payload.key, { source: payload.source, reason: 'select-ancestors', originalEvent: payload.originalEvent });
            if (Utils.isFunction(opts.onSelect)) opts.onSelect(payload);
            if (destroyed) return;
            emitter.emit('select', payload);
            if (destroyed) return;
            syncTreeRows();
          },
          onChange: function (value, detail) {
            var payload = selectionPayload(detail || {});
            payload.value = value;
            var state = list.getState();
            payload.values = Array.isArray(state.values) ? state.values.slice() : [];
            if (Utils.isFunction(opts.onChange)) opts.onChange(value, payload);
            if (destroyed) return;
            emitter.emit('change', payload);
            if (destroyed) return;
            syncTreeRows();
          },
          onActiveChange: function (detail) {
            var row = detail && detail.item;
            var payload = { key: detail && detail.key || '', item: row ? row.item : null, source: detail && detail.source || 'api', reason: detail && detail.reason || 'active', originalEvent: detail && detail.originalEvent || null, tree: api };
            if (Utils.isFunction(opts.onActiveChange)) opts.onActiveChange(payload);
            if (destroyed) return;
            emitter.emit('activeChange', payload);
            if (destroyed) return;
            syncTreeRows();
          }
        });
    
        root = list.getRootElement();
        if (root) {
          root.classList.add('qxframe9a7c2-tree');
          setupRootEvents();
          syncTreeRows();
        }
    
        if (opts.expandSelectedAncestors === true && list.getState().values.length) restoreSelectedExpansion();
    
        function scrollTo(config) {
          if (destroyed || !list || !model) return false;
          var local = config || {};
          if (!hasOwn(local, 'key')) throw new TypeError('[QXFRAME9A7C2] Tree scrollTo requires { key }.');
          var key = String(local.key), record = model.getRecord(key);
          if (!record) return false;
          if (local.expandAncestors !== false) {
            var next = expandedSet();
            model.getAncestors(key).forEach(function (ancestor) { if (canExpand(ancestor)) next.add(ancestor.key); });
            disclosure.setValue(Array.from(next), { silent:true, source:'api', reason:'scroll-to-ancestors' });
            refresh('scroll-to-ancestors');
          }
          return list.scrollTo({ key:key, align:local.align || 'nearest', offset:Number(local.offset) || 0 });
        }
    
        function applyOptions(nextOptions) {
          if (destroyed) return api;
          assertCanonicalOptions(nextOptions);
          var next = nextOptions || {};
          if (hasOwn(next, 'container') && next.container !== opts.container) throw new Error('[QXFRAME9A7C2] Tree container is immutable; destroy and recreate to change it.');
          var candidate = mergeOptions(opts, next);
          if (hasOwn(next, 'items') || hasOwn(next, 'getKey') || hasOwn(next, 'getItems') || hasOwn(next, 'getLabel') || hasOwn(next, 'getValue')) validateItems(candidate.items, candidate);
          var structuralChanged = hasOwn(next, 'items') || hasOwn(next, 'getKey') || hasOwn(next, 'getItems') || hasOwn(next, 'getParentKey');
          Utils.copyOwn(opts, next);
          if (structuralChanged) {
            loadTasks.invalidate('tree-structure'); loadedChildren.clear(); loadingKeys.clear();
            if (!hasOwn(next, 'loadedKeys')) loadedKeys.clear();
          }
          model.updateOptions({ items: Array.isArray(opts.items) ? opts.items : [], rootKey: opts.rootKey, maxNodes: opts.maxNodes, getKey: keyOf, getItems: itemsOf, getParentKey: opts.getParentKey });
          if (hasOwn(next, 'expandedKeys')) disclosure.setValue((Array.isArray(opts.expandedKeys) ? opts.expandedKeys : []).map(String), { silent: true, reason: 'options-expanded' });
          if (hasOwn(next, 'checkedKeys')) checkedSelection.set(Array.isArray(opts.checkedKeys) ? opts.checkedKeys.map(String) : [], { silent: true, reason: 'options-checked' });
          if (hasOwn(next, 'loadedKeys')) loadedKeys = new Set((Array.isArray(opts.loadedKeys) ? opts.loadedKeys : []).map(String));
          pruneStateAfterModelChange();
          var listOptions = {
            items: rows(), multiple: opts.multiple === true, selectable: opts.selectable !== false,
            selectionAppearance: opts.selectionAppearance || 'highlight', size: opts.size, disabled: opts.disabled === true, readOnly: opts.readOnly === true,
            virtual: opts.virtual, virtualThreshold: opts.virtualThreshold, height: opts.height, maxHeight: opts.maxHeight, classes: opts.classes, styles: opts.styles,
            getItemState: function (row, context) { return { open: isExpanded(row.key), descendantSelected: selectableDescendant(row.record, context && context.values) }; }
          };
          if (hasOwn(next, 'value')) listOptions.value = opts.value;
          list.updateOptions(listOptions);
          refresh('options');
          if (opts.expandSelectedAncestors === true && list.getState().values.length) restoreSelectedExpansion();
          return api;
        }
    
        function getState() {
          var state = list ? list.getState() : {};
          return Object.freeze({
            value: state.value,
            values: Array.isArray(state.values) ? state.values.slice() : [],
            activeKey: state.activeKey || null,
            expandedKeys: expandedKeys(),
            checkedKeys: checkedSelection.values.map(String),
            indeterminateKeys: Array.from(indeterminateKeys),
            loadedKeys: Array.from(loadedKeys),
            loadingKeys: Array.from(loadingKeys),
            visibleKeys: visibleRecords().map(function (record) { return record.key; }),
            searchValue: searchState.query,
            multiple: opts.multiple === true,
            selectable: opts.selectable !== false,
            checkable: opts.checkable !== false,
            checkStrictly: opts.checkStrictly === true,
            draggable: opts.draggable !== false,
            blockNode: opts.blockNode === true,
            showLine: opts.showLine === true,
            disabled: opts.disabled === true,
            readOnly: opts.readOnly === true,
            destroyed: destroyed
          });
        }
    
        function disposeRuntime(reason) {
          if (destroyed) return false;
          destroyed = true;
          loadTasks.destroy();
          searchState.destroy();
          scope.dispose();
          if (list) list.destroy(reason || 'tree-destroy');
          list = null;
          if (model) model.destroy();
          model = null;
          disclosure.destroy();
          checkedSelection.destroy();
          loadedChildren.clear(); loadingKeys.clear(); loadedKeys.clear(); indeterminateKeys.clear();
          dragSession = null; root = null;
          return true;
        }
    
    
    
        syncTreeRows();
        return Object.freeze({
          setItems:setItems,
          setValue:function(value,meta){ if(!destroyed){ list.setValue(value,meta||{source:'api',reason:'tree-set-value'}); syncTreeRows(); } return api; },
          clear:function(meta){ if(!destroyed){ list.clear(meta||{source:'api',reason:'tree-clear'}); syncTreeRows(); } return api; },
          setCheckedKeys:setCheckedKeys, check:check, setExpandedKeys:setExpandedKeys, expand:expand, collapse:collapse, expandAll:expandAll, collapseAll:collapseAll, expandAncestors:expandAncestors, expandSelected:expandSelected, toggleExpand:toggleExpand, isExpanded:isExpanded, setSearch:setSearch,
          setActiveKey:function(key,meta){ return destroyed?false:list.setActiveKey(key,meta); },
          focus:function(key){ if(destroyed)return false; if(key!==undefined&&key!==null&&key!=='')list.setActiveKey(String(key),{source:'api',reason:'tree-focus'}); return list.focusWrap(); },
          focusFirst:function(){return destroyed?false:list.focusFirst();}, focusLast:function(){return destroyed?false:list.focusLast();}, focusSelected:function(){return destroyed?false:list.focusSelected();}, focusWrap:function(){return destroyed?false:list.focusWrap();},
          scrollTo:scrollTo, prepareOpen:prepareOpen, handleKeydown:function(event){return destroyed?false:(handleTreeKeydown(event)||list.handleKeydown(event));}, handleExpandCollapseKeydown:function(event){return destroyed?false:handleExpandCollapseKeydown(event);},
          bindVirtualFocus:function(controller){return destroyed||!list||!list.bindVirtualFocus?false:list.bindVirtualFocus(controller);}, getVirtualFocusDomain:function(){return destroyed||!list||!list.getVirtualFocusDomain?null:list.getVirtualFocusDomain();},
          applyOptions:applyOptions, getState:getState, getModel:function(){return model;}, getDisclosure:function(){return disclosure;}, getCheckedSelection:function(){return checkedSelection;}, getList:function(){return list;}, getRootElement:function(){return root;},
          getItem:function(key){return model?model.getItem(key):null;}, getRecord:function(key){return model?model.getRecord(key):null;}, getVisibleItems:function(){return model?visibleRecords().map(function(record){return record.item;}):[];},
          getCheckedKeys:function(leafOnly){return checkedSelection.values.map(String).filter(function(key){var record=model&&model.getRecord(key);return !!record&&(!leafOnly||!model.hasChildren(key));});},
          getCheckedItems:function(leafOnly){return this.getCheckedKeys(leafOnly).map(function(key){return model.getItem(key);}).filter(Boolean);}, getLoadedKeys:function(){return Array.from(loadedKeys);}, dispose:disposeRuntime
        });
      
}

const runtimeState = new WeakMap();
function runtimeFor(instance) { const runtime = runtimeState.get(instance); if (!runtime) throw new Error('[QXFRAME9A7C2] Tree is not rendered.'); return runtime; }

export class Tree extends Component {
  static options = Object.freeze({ multiple:false, selectable:true, checkable:false, checkStrictly:false, expandOnRowClick:false, checkOnRowClick:false, expandSelectedAncestors:false, draggable:false, showLine:false, blockNode:false, size:'md' });
  static immutableOptions = Object.freeze(['container']);
  static createDefaultDOM = ItemCollection.createDefaultDOM;

  constructor(options = {}) { assertCanonicalOptions(options); super(options); }
  [componentHooks.render]() {
    if (runtimeState.has(this)) return runtimeFor(this).getRootElement();
    const runtime = setupTreeRuntime(this); runtimeState.set(this, runtime); this.own(() => runtime.dispose('tree-destroy')); return runtime.getRootElement();
  }
  [componentHooks.optionsUpdated](options, previous, patch) { if (runtimeState.has(this)) runtimeFor(this).applyOptions(patch); }
  setItems(items){return runtimeFor(this).setItems(items);}
  setValue(value,meta){return runtimeFor(this).setValue(value,meta);}
  clear(meta){return runtimeFor(this).clear(meta);}
  setCheckedKeys(keys,meta){return runtimeFor(this).setCheckedKeys(keys,meta);}
  check(key,checked,meta){return runtimeFor(this).check(key,checked,meta);}
  setExpandedKeys(keys,meta){return runtimeFor(this).setExpandedKeys(keys,meta);}
  expand(key,meta){return runtimeFor(this).expand(key,meta);}
  collapse(key,meta){return runtimeFor(this).collapse(key,meta);}
  expandAll(meta){return runtimeFor(this).expandAll(meta);}
  collapseAll(meta){return runtimeFor(this).collapseAll(meta);}
  expandAncestors(key,meta){return runtimeFor(this).expandAncestors(key,meta);}
  expandSelected(meta){return runtimeFor(this).expandSelected(meta);}
  toggleExpand(key,meta){return runtimeFor(this).toggleExpand(key,meta);}
  isExpanded(key){return runtimeFor(this).isExpanded(key);}
  setSearch(value,meta){return runtimeFor(this).setSearch(value,meta);}
  setActiveKey(key,meta){return runtimeFor(this).setActiveKey(key,meta);}
  focus(key){return runtimeFor(this).focus(key);}
  focusFirst(){return runtimeFor(this).focusFirst();}
  focusLast(){return runtimeFor(this).focusLast();}
  focusSelected(){return runtimeFor(this).focusSelected();}
  focusWrap(){return runtimeFor(this).focusWrap();}
  scrollTo(config){return runtimeFor(this).scrollTo(config);}
  prepareOpen(meta){return runtimeFor(this).prepareOpen(meta);}
  handleKeydown(event){return runtimeFor(this).handleKeydown(event);}
  handleExpandCollapseKeydown(event){return runtimeFor(this).handleExpandCollapseKeydown(event);}
  bindVirtualFocus(controller){return runtimeFor(this).bindVirtualFocus(controller);}
  getVirtualFocusDomain(){return runtimeFor(this).getVirtualFocusDomain();}
  getState(){return runtimeFor(this).getState();}
  getModel(){return runtimeFor(this).getModel();}
  getDisclosure(){return runtimeFor(this).getDisclosure();}
  getCheckedSelection(){return runtimeFor(this).getCheckedSelection();}
  getList(){return runtimeFor(this).getList();}
  getRootElement(){return runtimeFor(this).getRootElement();}
  getItem(key){return runtimeFor(this).getItem(key);}
  getRecord(key){return runtimeFor(this).getRecord(key);}
  getVisibleItems(){return runtimeFor(this).getVisibleItems();}
  getCheckedKeys(leafOnly){return runtimeFor(this).getCheckedKeys(leafOnly);}
  getCheckedItems(leafOnly){return runtimeFor(this).getCheckedItems(leafOnly);}
  getLoadedKeys(){return runtimeFor(this).getLoadedKeys();}
}

export default Tree;
