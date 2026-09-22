import { PopupFieldComponent, popupFieldHooks } from './popup-field.js';
import { Control } from './control.js';
import { ItemCollection } from './item-collection.js';
import { Item } from './item.js';
import { Scroll } from './scroll.js';
import { Trigger } from './trigger.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { Selection } from '../core/selection.js';
import { AsyncTaskGroup } from '../core/asyncTaskGroup.js';
import { ItemSchema } from '../core/itemSchema.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { SelectionTags } from '../core/selectionTags.js';
import { HierarchicalSelection } from '../core/hierarchicalSelection.js';
import { SearchState } from '../core/searchState.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { TreeQuery } from '../utils/treeQuery.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { FieldHost } from '../core/fieldHost.js';
import { Renderer } from '../core/renderer.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { TagNavigation } from '../core/tagNavigation.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Utils } from '../utils/utils.js';

const blueprint=DOMTemplate.staticHTML`
<div class="qxframe9a7c2-cascader qxframe9a7c2-cascader-control qxframe9a7c2-input" data-qxframe9a7c2-ref="root">
<span class="qxframe9a7c2-cascader-prefix qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
<div class="qxframe9a7c2-cascader-values qxframe9a7c2-input-values" data-qxframe9a7c2-ref="values"></div>
<input class="qxframe9a7c2-cascader-input qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
<span class="qxframe9a7c2-cascader-suffix qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix"><button class="qxframe9a7c2-cascader-clear qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button><span class="qxframe9a7c2-cascader-toggle qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span></span></div>`;
function createDefaultDOM(context){const instance=blueprint.instantiate(context.document);instance.refs.control=instance.root;return{root:instance.root,refs:instance.refs};}
const CASCADER_DEFAULTS=Object.freeze({items:[],multiple:false,clearable:false,disabled:false,readOnly:false,placeholder:'',separator:' / ',placement:'bottom-start',open:false,trigger:'click',expandTrigger:'click',closeOnSelect:undefined,changeOnSelect:false,searchable:false,checkedStrategy:'child',maxVisibleTags:0,renderTag:null,renderTagOverflow:null,popupRender:null,itemStyles:null,tagClasses:null,tagStyles:null,matchReferenceWidth:false,selectionAppearance:undefined,renderControl:true,headless:false});
const runtimeState=new WeakMap();
const own=Utils.own;
function validateCascaderOptions(opts){if(['click','hover'].indexOf(String(opts.expandTrigger||'click'))<0)throw new TypeError('[QXFRAME9A7C2] Cascader expandTrigger must be click or hover.');if(['child','parent','all'].indexOf(String(opts.checkedStrategy||'child'))<0)throw new TypeError('[QXFRAME9A7C2] Cascader checkedStrategy must be "child", "parent", or "all".');if(opts.maxVisibleTags!=='responsive'&&opts.maxVisibleTags!=null&&(!Number.isFinite(Number(opts.maxVisibleTags))||Number(opts.maxVisibleTags)<0))throw new TypeError('[QXFRAME9A7C2] Cascader maxVisibleTags must be a non-negative number or "responsive".');if(opts.popupRender!=null&&!Utils.isFunction(opts.popupRender))throw new TypeError('[QXFRAME9A7C2] Cascader popupRender must be a function or null.');validateItems(opts.items);return opts;}
function prepareOptions(source,overrides){const fieldInit=Control.resolveFieldOptions(source,overrides);const incoming=fieldInit.options;if(fieldInit.formField&&!Utils.own(incoming,'value')&&!Utils.own(incoming,'defaultValue'))incoming.value=fieldInit.nativeValue;rejectObsolete(incoming);return{fieldInit,opts:validateCascaderOptions(Object.assign({},CASCADER_DEFAULTS,incoming))};}

function normalizeValues(value, multiple) {
  if (value === undefined || value === null || value === '') return [];
  var values = (Array.isArray(value) ? value : [value]).map(String);
  return multiple ? values.filter(function (entry, index, list) { return list.indexOf(entry) === index; }) : values.slice(0, 1);
}
function validateItems(items) {
  return ItemSchema.validate(items, {
    label: 'Cascader items',
    keyOf: function (item) { return item.key; },
    childrenOf: function (item) { return item.items; },
    validateItem: function (item) {
      if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] Cascader item.key is required.');
      if (item.label === undefined || item.label === null) throw new TypeError('[QXFRAME9A7C2] Cascader item.label is required.');
      if (item.value === undefined || item.value === null) throw new TypeError('[QXFRAME9A7C2] Cascader item.value is required.');
      if (item.id !== undefined) throw new TypeError('[QXFRAME9A7C2] Cascader item.id is not canonical. Use item.key.');
      if (item.children !== undefined) throw new TypeError('[QXFRAME9A7C2] Cascader item.children is not canonical. Use item.items.');
    }
  });
}
function rejectObsolete(options) {
  ['options','submenuTrigger','submenuOpenDelay','submenuLeaveDelay','showSearch','loadData','showCheckedStrategy','displayRender','valueRender','draftValueRender'].forEach(function (name) {
    if (own(options, name)) throw new TypeError('[QXFRAME9A7C2] Cascader single-panel mode does not accept obsolete option "' + name + '".');
  });
}
    

function setupCascaderRuntime(instance,fieldInit){
        var opts=Object.assign({},instance.options);
        var doc=opts.document||globalThis.document;
        var host=opts.container||null;
        var headlessMode=opts.headless===true;
        var projectionMode=!headlessMode&&opts.renderControl===false;
        var portalContainer=opts.portalContainer;if(portalContainer&&typeof portalContainer==='string')portalContainer=DOM.resolveElement(portalContainer,doc);if(!portalContainer)portalContainer=doc.body;if(!portalContainer||!portalContainer.appendChild)throw new TypeError('[QXFRAME9A7C2] Cascader portalContainer must be an Element.');
var emitter=Object.freeze({emit:function(type,payload){return instance.emit(type,payload);}});
        var scope = Lifecycle.createScope();
                var destroyed=false,api=instance;
var binding = null, root = null, controlElement = null, valuesNode = null, input = null, clearButton = null, arrow = null, prefix = null, suffix = null, valueTarget = null, triggerTarget = null;
        var fieldHost = FieldHost.resolve({
          owner:'Cascader', options:opts, document:doc, host:host, component:instance,
          requiredRefs:['root','values','input','clear','toggle'], defaultFactory:createDefaultDOM,
          projectionRefs:[{ref:'values',option:'valueTarget'},{ref:'input',option:'inputTarget'}]
        });
        binding=fieldHost.binding; root=fieldHost.root; triggerTarget=fieldHost.triggerTarget;
        if (projectionMode) { valueTarget=fieldHost.refs.values||null; input=fieldHost.refs.input||null; }
        else if (!headlessMode) {
          controlElement=root; valuesNode=fieldHost.refs.values; input=fieldHost.refs.input; clearButton=fieldHost.refs.clear; arrow=fieldHost.refs.toggle;
          prefix=fieldHost.refs.prefix||null; suffix=fieldHost.refs.suffix||null; valueTarget=valuesNode;
          if (!host && opts.formField && binding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
        }
        var panel = doc.createElement('div'); panel.className = 'qxframe9a7c2-cascader-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-flush'; panel.hidden = true; panel.tabIndex = -1;
        var popupContentHost = doc.createElement('div'); popupContentHost.className = 'qxframe9a7c2-cascader-popup-content'; panel.appendChild(popupContentHost);
        var columnsHost = doc.createElement('div'); columnsHost.className = 'qxframe9a7c2-cascader-columns'; popupContentHost.appendChild(columnsHost);
        var fieldControl = null, triggerSession = null, searchList = null, keyboard = null, tagNavigation = null;
        var searchState = SearchState.create({ query:'', onChange:function(value,meta){ if(destroyed)return; if(triggerSession&&triggerSession.getState().open)renderColumns(); syncControl(); var payload={searchValue:value,reason:meta.reason||'search',originalEvent:meta.originalEvent||null,cascader:instance}; if(meta.notify!==false&&Utils.isFunction(opts.onSearch))opts.onSearch(value,payload); if(!destroyed&&meta.silent!==true)emitter.emit('search',payload); } });
        var loadedChildren = new Map(), loadedKeys = new Set((Array.isArray(opts.loadedKeys) ? opts.loadedKeys : []).map(String)), loadingKeys = new Set();
        var loadTasks = AsyncTaskGroup.create({
          task: function (request, context) {
            var item = request.item, meta = request.meta || {};
            return new Promise(function (resolve) {
              var settled = false;
              function complete(items) {
                if (settled) return;
                settled = true;
                resolve({ items: Array.isArray(items) ? items.slice() : [], isCurrent: context.isCurrent });
              }
              try {
                var payload = { key: String(item.key), item: item, reason: meta.reason || 'load-children', originalEvent: meta.originalEvent || null, signal: context.signal, cascader: instance };
                var returned = opts.loadChildren(item, complete, payload);
                if (returned && Utils.isFunction(returned.then)) returned.then(complete, function (error) {
                  if (settled) return; settled = true; resolve({ error: error, isCurrent: context.isCurrent });
                });
                else if (Array.isArray(returned)) complete(returned);
                else if (returned !== undefined && returned !== null) {
                  settled = true; resolve({ error: new TypeError('[QXFRAME9A7C2] Cascader loadChildren must call done(items), return an items array, return a Promise, or return undefined.'), isCurrent: context.isCurrent });
                }
              } catch (error) { if (!settled) { settled = true; resolve({ error: error, isCurrent: context.isCurrent }); } }
            });
          }
        });
        var selection = Selection.create({ multiple: opts.multiple === true, value: opts.value !== undefined ? opts.value : opts.defaultValue });
        scope.add(function () { selection.destroy(); });
        var columnRecords = [];
        var activePathKeys = [];
        var activeColumnIndex = 0;
        var initialSelectionValues = selection.values;
        var selectionAnchorValue = initialSelectionValues.length ? initialSelectionValues[initialSelectionValues.length - 1] : null;
        var keyboardCursorKey = '';
    
        function childrenOf(item) {
          if (!item) return [];
          var key = item.key === undefined || item.key === null ? '' : String(item.key);
          if (key && loadedChildren.has(key)) return loadedChildren.get(key).slice();
          return Array.isArray(item.items) ? item.items : [];
        }
        var itemAccessors = ItemAccessors.create({
          getKey:function(item){return item && item.key;},
          getValue:function(item){return item && item.value;},
          getLabel:function(item){return item && item.label;},
          getChildren:childrenOf,
          isDisabled:function(item){return !item || item.disabled===true;}
        });
        function isLazyExpandable(item) {
          if (!item || !Utils.isFunction(opts.loadChildren) || item.leaf !== false) return false;
          var key = String(item.key);
          return !loadedKeys.has(key) && childrenOf(item).length === 0;
        }
        function hasChildren(item) { return childrenOf(item).length > 0 || isLazyExpandable(item); }
        var hierarchy = HierarchicalSelection.create({
          childrenOf:childrenOf, keyOf:function(item){return String(item && item.value);}, disabledOf:function(item){return !item || item.disabled===true;},
          isLeaf:function(item,_index,children){return !!item && item.disabled!==true && children.length===0 && !isLazyExpandable(item);}
        });
        function isLocked() { return InteractionPolicy.mutationLocked(opts); }
        function shouldCloseOnSelect() { return opts.closeOnSelect !== undefined ? opts.closeOnSelect !== false : opts.multiple !== true; }
        function loadChildrenFor(item, meta) {
          if (!isLazyExpandable(item) || loadingKeys.has(String(item.key))) return Promise.resolve(childrenOf(item));
          var key = String(item.key);
          loadingKeys.add(key);
          renderColumns();
          return loadTasks.run(key, { item: item, meta: meta || {} }, { source: meta && meta.source || 'instance' }).then(function (result) {
            if (!result || !result.isCurrent || !result.isCurrent() || destroyed) return [];
            loadingKeys.delete(key);
            if (result.error) {
              var errorDetail = { key: key, item: item, error: result.error, reason: 'load-error', cascader: instance };
              if (Utils.isFunction(opts.onLoadError)) opts.onLoadError(result.error, errorDetail);
              if (destroyed) return [];
              emitter.emit('loadError', errorDetail);
              if (destroyed) return [];
              renderColumns();
              return [];
            }
            var normalized = Array.isArray(result.items) ? result.items.slice() : [];
            try { validateItems(normalized); }
            catch (error) {
              var validationDetail = { key: key, item: item, error: error, reason: 'load-error', cascader: instance };
              if (Utils.isFunction(opts.onLoadError)) opts.onLoadError(error, validationDetail);
              if (destroyed) return [];
              emitter.emit('loadError', validationDetail);
              if (destroyed) return [];
              renderColumns();
              return [];
            }
            loadedChildren.set(key, normalized); loadedKeys.add(key);
            var payload = { key: key, item: item, items: normalized.slice(), loadedKeys: Array.from(loadedKeys), reason: meta && meta.reason || 'load-children', originalEvent: meta && meta.originalEvent || null, cascader: instance };
            if (Utils.isFunction(opts.onLoad)) opts.onLoad(normalized.slice(), payload);
            if (destroyed) return [];
            emitter.emit('load', payload);
            if (destroyed) return [];
            renderColumns();
            return normalized.slice();
          });
        }

        function findPathByValue(value) {
          if (value === undefined || value === null) return [];
          return TreeQuery.findPath(opts.items, value, { accessors:itemAccessors, by:'value' });
        }
        function selectableLeafValues(item) { return hierarchy.leafKeys(item); }
        function normalizeAssociatedValues(values) {
          if (opts.multiple !== true) return normalizeValues(values, false);
          var output = [], seen = Object.create(null);
          normalizeValues(values, true).forEach(function (value) {
            var path = findPathByValue(value);
            if (!path.length) return;
            var item = path[path.length - 1];
            var targets = hasChildren(item) ? selectableLeafValues(item) : (item.disabled === true ? [] : [String(item.value)]);
            targets.forEach(function (target) { if (!seen[target]) { seen[target] = true; output.push(target); } });
          });
          return output;
        }
        function cascadeCheckState(item) {
          if (!item) return { checked:false, indeterminate:false, descendantSelected:false };
          if (!hasChildren(item)) return { checked:selection.has(String(item.value)), indeterminate:false, descendantSelected:false };
          var state=hierarchy.stateFor(item, selection.values);
          return { checked:state.checked, indeterminate:state.indeterminate, descendantSelected:state.selectedCount>0 };
        }
        function isSelectionIndicatorEvent(detail) {
          var target = detail && detail.originalEvent && detail.originalEvent.target;
          return !!(target && target.closest && target.closest('.qxframe9a7c2-item-selection-indicator'));
        }
        function pathByKeys(keys) { return TreeQuery.findPathByKeys(opts.items, keys, { accessors:itemAccessors }); }
        function selectedPaths() { return selection.values.map(findPathByValue).filter(function (path) { return path.length > 0; }); }
        function selectedAnchorPath() {
          var values = selection.values;
          var path = selectionAnchorValue === null ? [] : findPathByValue(selectionAnchorValue);
          if (path.length && values.some(function (value) { return String(value) === String(selectionAnchorValue); })) return path;
          for (var i = values.length - 1; i >= 0; i -= 1) {
            path = findPathByValue(values[i]);
            if (path.length) { selectionAnchorValue = values[i]; return path; }
          }
          selectionAnchorValue = null;
          return [];
        }
        function tagFromPath(path, targets) {
          var leaf = path[path.length - 1];
          return { key: String(leaf.key), value: String(leaf.value), label: path.map(function (item) { return String(item.label); }).join(String(opts.separator || ' / ')), selectionValues: targets.slice(), removable: !isLocked(), disabled: false };
        }
        function projectedTagPaths() {
          var strategy = String(opts.checkedStrategy || 'child');
          if (strategy === 'child') return selectedPaths().map(function (path) { return { path: path, targets: [String(path[path.length - 1].value)] }; });
          var selected = new Set(selection.values.map(String)), output = [];
          TreeQuery.visit(opts.items, function(record) {
            var item=record.item;
            if (!item || item.disabled === true) return TreeQuery.SKIP_CHILDREN;
            var leaves=selectableLeafValues(item), nested=record.children;
            var full=leaves.length > 0 && leaves.every(function(value){return selected.has(value);});
            if (strategy === 'all' && full) output.push({ path:record.path.slice(), targets:leaves.slice() });
            if (strategy === 'parent' && full && (nested.length || isLazyExpandable(item))) { output.push({ path:record.path.slice(), targets:leaves.slice() }); return TreeQuery.SKIP_CHILDREN; }
            if (!nested.length && selected.has(String(item.value)) && !(strategy === 'all' && full)) output.push({ path:record.path.slice(), targets:[String(item.value)] });
          }, { accessors:itemAccessors });
          return output;
        }
        var selectionTags = SelectionTags.create({
          getValues: projectedTagPaths,
          keyOf:function(entry){var leaf=entry.path[entry.path.length-1];return String(leaf.key);},
          valueOf:function(entry){var leaf=entry.path[entry.path.length-1];return String(leaf.value);},
          labelOf:function(entry){return entry.path.map(function(item){return String(item.label);}).join(String(opts.separator || ' / '));},
          removableOf:function(){return !isLocked();},
          decorate:function(tag,entry){return { selectionValues:entry.targets.slice() };}
        });
        function tagSelectionTargets(value) {
          var needle = String(value), projected = projectedTagPaths();
          for (var index = 0; index < projected.length; index += 1) {
            var entry = projected[index], leaf = entry.path && entry.path[entry.path.length - 1];
            if (leaf && String(leaf.value) === needle) return entry.targets.map(String);
          }
          return [needle];
        }
        function renderSelectedTag(tag, detail) {
          var path = findPathByValue(tag.value);
          if (!Utils.isFunction(opts.renderTag)) return tag.label;
          return opts.renderTag(path.slice(), { value:String(tag.value), label:tag.label, tag:tag, index:detail.index, cascader:instance });
        }
        function renderSelectedTagOverflow(hiddenTags, detail) {
          if (!Utils.isFunction(opts.renderTagOverflow)) return '+' + hiddenTags.length;
          return opts.renderTagOverflow(hiddenTags.map(function (tag) { return { value:String(tag.value), label:tag.label, path:findPathByValue(tag.value) }; }), { hiddenCount:hiddenTags.length, visibleCount:detail.visibleTags.length, values:selection.values.slice(), cascader:instance });
        }
        function syncPopupContent() {
          if (!popupContentHost) return;
          while (popupContentHost.firstChild) popupContentHost.removeChild(popupContentHost.firstChild);
          var output = columnsHost;
          if (Utils.isFunction(opts.popupRender)) {
            output = opts.popupRender(columnsHost, { values:selection.values.slice(), searchValue:searchState.query, cascader:instance });
            if (output === undefined || output === null || output === false) output = columnsHost;
          }
          Renderer.append(popupContentHost, output, doc);
        }
        function displayPath() {
          if (opts.multiple === true) return [];
          var value = selection.value; return value === undefined || value === null ? [] : findPathByValue(value);
        }
    
        function renderRichPath(path) {
          if (projectionMode || !valuesNode) return false;
          while (valuesNode.firstChild) valuesNode.removeChild(valuesNode.firstChild);
          var enabled = opts.multiple !== true && searchState.query === '' && path.length > 0 && Utils.isFunction(opts.renderPath) && !(opts.searchable === true && triggerSession && triggerSession.getState().open);
          root.classList.toggle('has-rich-path', enabled);
          if (!enabled) return false;
          var output = opts.renderPath(path.slice(), { value: selection.value, cascader: instance });
          if (output === undefined || output === null || output === false) return false;
          Renderer.append(valuesNode, output); return true;
        }
        function pathSearchText(path) { return path.map(function (item) { return String(item.label); }).join(String(opts.separator || ' / ')); }
        function searchPaths() {
          var query = searchState.query.trim().toLocaleLowerCase(), output = [];
          if (!query) return output;
          TreeQuery.visit(opts.items, function(record) {
            var item=record.item, path=record.path, expandable=hasChildren(item), text=pathSearchText(path);
            var allowed=Utils.isFunction(opts.filterPath) ? opts.filterPath(searchState.query, path.slice(), { cascader:instance }) !== false : text.toLocaleLowerCase().indexOf(query) >= 0;
            if (allowed && item.disabled !== true && (!expandable || opts.changeOnSelect === true)) output.push({ key:'search:' + record.pathKeys.join('/'), value:String(item.value), label:text, item:item, path:path.slice() });
          }, { accessors:itemAccessors });
          return output;
        }
        function setSearch(value, meta) { if (destroyed || opts.searchable !== true) return instance; searchState.set(value, meta || {}); return instance; }
    
        function syncControl(commitMeta) {
          var values = selection.values.slice();
          if (!fieldControl) return;
          if (projectionMode) {
            var pTags = opts.multiple === true ? selectionTags.tags() : [];
            var pPath = opts.multiple === true ? [] : displayPath();
            var pDisplay = opts.multiple === true ? pTags.map(function (tag) { return String(tag.label || tag.value || ''); }).join(', ') : pathSearchText(pPath);
            var pEditing = opts.multiple !== true && opts.searchable === true && !!(triggerSession && triggerSession.getState().open);
            var pInput = pEditing ? searchState.query : pDisplay;
            var pPlaceholder = pEditing ? (pDisplay || String(opts.placeholder || '')) : String(opts.placeholder || '');
            fieldControl.updateOptions({ mode:opts.multiple === true ? 'tags':(opts.searchable === true ? 'input':'value'), tags:pTags, displayValue:pDisplay, inputValue:pInput, editable:opts.searchable === true, disabled:opts.disabled === true, readOnly:opts.readOnly === true, required:opts.required === true, name:opts.name, placeholder:pPlaceholder, hasValue:values.length > 0, expanded:!!(triggerSession && triggerSession.getState().open) });
            fieldControl.setDisplayValue(pDisplay); fieldControl.setInputValue(pInput); fieldControl.setDraftVisual(pEditing && searchState.query !== ''); fieldControl.setCommittedValue(opts.multiple === true ? values.slice() : selection.value, commitMeta || { silent:true, source:'selection', reason:'projection' });
            return;
          }
          if (opts.multiple === true) {
            root.classList.remove('has-rich-path');
            fieldControl.updateOptions({
              mode: 'tags', tags: selectionTags.tags(), creatableTags:false,tagsControlled:true, maxVisibleTags:opts.maxVisibleTags, tagInputMinWidth:opts.searchable === true ? 32 : 0, renderTag:renderSelectedTag, renderTagOverflow:renderSelectedTagOverflow, tagClasses:opts.tagClasses, tagStyles:opts.tagStyles, tagOverflowClassName:'qxframe9a7c2-cascader-tag qxframe9a7c2-cascader-tag-overflow', inputValue: opts.searchable === true && triggerSession && triggerSession.getState().open ? searchState.query : '', placeholder: values.length ? '' : String(opts.placeholder || ''),
              tagClassName: 'qxframe9a7c2-cascader-tag', tagTextClassName: 'qxframe9a7c2-cascader-tag-text', tagRemoveClassName: 'qxframe9a7c2-cascader-tag-remove'
            });
          } else {
            var path = displayPath();
            var openSearch = opts.searchable === true && triggerSession && triggerSession.getState().open;
            var pathText = pathSearchText(path);
            if (opts.searchable === true) {
              var rich = renderRichPath(path);
              fieldControl.updateOptions({ mode: 'input', tags: [], inputValue: openSearch ? searchState.query : (rich ? '' : pathText), placeholder: openSearch ? (pathText || String(opts.placeholder || '')) : (rich ? '' : String(opts.placeholder || '')) });
            } else {
              while (valuesNode.firstChild) valuesNode.removeChild(valuesNode.firstChild);
              root.classList.toggle('has-rich-path', path.length > 0 && Utils.isFunction(opts.renderPath));
              var displayContent = path.length > 0 && Utils.isFunction(opts.renderPath) ? opts.renderPath(path.slice(), { value:selection.value, cascader:instance }) : pathText;
              fieldControl.updateOptions({ mode:'value', tags:[], inputValue:'', displayValue:displayContent, placeholder:path.length ? '' : String(opts.placeholder || '') });
            }
            fieldControl.setDraftVisual(openSearch && searchState.query !== '');
          }
          fieldControl.updateOptions({
            size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true,
            disabled: opts.disabled === true, readOnly: opts.readOnly === true, editable: opts.searchable === true, clearable: opts.clearable === true, hasValue: values.length > 0,
            expanded: !!(triggerSession && triggerSession.getState().open), toggleVisible: true});
          fieldControl.setCommittedValue(opts.multiple === true ? values.slice() : selection.value, commitMeta || { silent: true, source: 'selection', reason: 'projection' });
          root.classList.toggle('has-value', values.length > 0); root.classList.toggle('is-multiple', opts.multiple === true); root.classList.toggle('is-open', !!(triggerSession && triggerSession.getState().open));
        }
    
        function renderColumnItem(item, ctx, columnIndex, searchMode) {
          if (Utils.isFunction(opts.itemRender)) {
            var path = searchMode && item && Array.isArray(item.path) ? item.path.slice() : pathByKeys(activePathKeys).slice(0, Math.max(0, Number(columnIndex) || 0));
            if (!searchMode) path.push(item);
            return opts.itemRender(item, Item.createContext(item, Object.assign({}, ctx || {}, { component:instance, controller:instance, columnIndex:Number(columnIndex) || 0, path:path, search:searchMode === true, searchValue:searchState.query })));
          }
          var label = doc.createElement('span');
          label.className = 'qxframe9a7c2-cascader-option-label';
          label.textContent = String(item.label);
          return label;
        }
    
        function refreshSelectionSurfaces() {
          columnRecords.forEach(function (record) {
            if (record && record.list && record.list.refreshItemStates) record.list.refreshItemStates();
          });
        }
    
        function destroyColumns() {
          columnRecords.forEach(function (record) { if (record.list) record.list.destroy(); });
          columnRecords = [];
          while (columnsHost.firstChild) columnsHost.removeChild(columnsHost.firstChild);
        }
    
        function ensureColumnVisible(record) {
          if (!record || !record.host || !columnsHost) return false;
          var column = record.host, viewport = columnsHost;
          var left = column.offsetLeft, right = left + column.offsetWidth;
          var viewLeft = viewport.scrollLeft, viewRight = viewLeft + viewport.clientWidth;
          if (left < viewLeft) viewport.scrollLeft = left;
          else if (right > viewRight) viewport.scrollLeft = Math.max(0, right - viewport.clientWidth);
          return true;
        }
        function bindListVirtualFocus(record) {
          if (!record || !record.list || !keyboard || !keyboard.virtualFocus || !record.list.bindVirtualFocus) return null;
          var domain = record.list.bindVirtualFocus(keyboard.virtualFocus);
          record.virtualDomain = domain || (record.list.getVirtualFocusDomain && record.list.getVirtualFocusDomain());
          return record.virtualDomain;
        }
        function activateRecordVirtualFocus(record, reason, event) {
          if (!record || !record.list || !keyboard || !keyboard.virtualFocus) return false;
          var domain = record.virtualDomain || (record.list.getVirtualFocusDomain && record.list.getVirtualFocusDomain());
          var key = record.list.getState().activeKey;
          if (!domain || !key) return false;
          ensureColumnVisible(record);
          domain.activate(String(key), { source:'keyboard', reason:reason || 'cascader-active', originalEvent:event || null, ensureVisible:true });
          return true;
        }
    
        function controlFocusElement() {
          return fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (input || triggerTarget || root);
        }
        function recordActiveItem(record) {
          if (!record || !record.list) return null;
          var activeKey = record.list.getState().activeKey;
          var found = null;
          (record.items || []).some(function (entry) {
            if (String(entry.key) === String(activeKey)) { found = entry; return true; }
            return false;
          });
          return found;
        }
    
        function seedColumnActive(record, preferredKey, meta) {
          if (!record || !record.list) return null;
          var candidate = null;
          var entries = record.items || [];
          if (preferredKey !== undefined && preferredKey !== null && preferredKey !== '') {
            entries.some(function (entry) {
              if (entry.disabled !== true && String(entry.key) === String(preferredKey)) { candidate = entry; return true; }
              return false;
            });
          }
          if (!candidate && meta && meta.strategy === 'last') {
            for (var reverseIndex = entries.length - 1; reverseIndex >= 0; reverseIndex -= 1) {
              if (entries[reverseIndex] && entries[reverseIndex].disabled !== true) { candidate = entries[reverseIndex]; break; }
            }
          }
          if (!candidate) {
            entries.some(function (entry) { if (entry.disabled !== true) { candidate = entry; return true; } return false; });
          }
          if (!candidate) {
            keyboardCursorKey = '';
            record.list.resetActive({ source: meta && meta.source || 'instance', reason: meta && meta.reason || 'cascader-empty-column', silent: true });
            refreshSelectionSurfaces();
            return null;
          }
          keyboardCursorKey = String(candidate.key);
          record.list.setActiveKey(keyboardCursorKey, { source: meta && meta.source || 'keyboard', reason: meta && meta.reason || 'cascader-column-active', silent: true });
          refreshSelectionSurfaces();
          return candidate;
        }
    
        function enterChildColumn(columnIndex, item, detail) {
          if (!item || !hasChildren(item)) return false;
          var currentPath = pathByKeys(activePathKeys.slice(0, columnIndex));
          var nextPath = currentPath.concat(item);
          activePathKeys = nextPath.map(function (entry) { return String(entry.key); });
          activeColumnIndex = columnIndex + 1;
          if (isLazyExpandable(item)) {
            loadChildrenFor(item, detail).then(function () { if (destroyed) return; renderColumns(); var record = columnRecords[activeColumnIndex]; seedColumnActive(record, null, { source: 'keyboard', reason: detail && detail.reason || 'cascader-enter-child' }); activateRecordVirtualFocus(record, detail && detail.reason || 'cascader-enter-child', detail && detail.originalEvent || null); });
          } else { renderColumns(); var record = columnRecords[activeColumnIndex]; seedColumnActive(record, null, { source: 'keyboard', reason: detail && detail.reason || 'cascader-enter-child' }); activateRecordVirtualFocus(record, detail && detail.reason || 'cascader-enter-child', detail && detail.originalEvent || null); }
          return true;
        }
    
        function notifySelectionCallbacks(selectValue, changeValue, payload) {
          if (Utils.isFunction(opts.onSelect)) opts.onSelect(selectValue, payload);
          if (destroyed) return false;
          emitter.emit('select', payload);
          if (destroyed) return false;
          if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(changeValue, payload);
          if (destroyed) return false;
          if (Utils.isFunction(opts.onChange)) opts.onChange(changeValue, payload);
          if (destroyed) return false;
          emitter.emit('change', payload);
          return !destroyed;
        }

        function toggleAssociatedSelection(item, nextPath, detail) {
          if (!item || opts.multiple !== true || isLocked() || item.disabled === true) return false;
          var targets = hasChildren(item) ? selectableLeafValues(item) : [String(item.value)];
          if (!targets.length) return false;
          var state = cascadeCheckState(item);
          var targetMap = Object.create(null); targets.forEach(function (value) { targetMap[value] = true; });
          var nextValues = selection.values.filter(function (value) { return !targetMap[value]; });
          if (!state.checked) targets.forEach(function (value) { if (nextValues.indexOf(value) < 0) nextValues.push(value); });
          selection.set(nextValues, { source: detail && detail.source || 'instance', reason: detail && detail.reason || 'cascade-check' });
          var currentValues = selection.values;
          if (!state.checked) selectionAnchorValue = targets.length ? targets[targets.length - 1] : (currentValues.length ? currentValues[currentValues.length - 1] : null);
          else if (selectionAnchorValue !== null && targets.some(function (value) { return String(value) === String(selectionAnchorValue); })) selectionAnchorValue = currentValues.length ? currentValues[currentValues.length - 1] : null;
          opts.value = currentValues.slice();
          refreshSelectionSurfaces(); syncControl({ source: detail && detail.source || 'instance', reason: detail && detail.reason || 'cascade-check' });
          var payload = { value: item.value, values: selection.values.slice(), item: item, checked: !state.checked, indeterminate: false, pathItems: nextPath.slice(), pathKeys: nextPath.map(function (entry) { return String(entry.key); }), pathLabels: nextPath.map(function (entry) { return String(entry.label); }), reason: detail && detail.reason || 'cascade-check', originalEvent: detail && detail.originalEvent || null, cascader: instance };
          notifySelectionCallbacks(item.value, selection.values.slice(), payload);
          return true;
        }
    
        function activateAt(columnIndex, item, detail) {
          if (!item || item.disabled === true || opts.disabled === true) return false;
          if (detail && detail.source === 'pointer') keyboardCursorKey = '';
          var currentPath = pathByKeys(activePathKeys.slice(0, columnIndex));
          var nextPath = currentPath.concat(item);
          activePathKeys = nextPath.map(function (entry) { return String(entry.key); });
          if (hasChildren(item)) {
            if (opts.multiple === true && ((detail && detail.reason === 'space') || isSelectionIndicatorEvent(detail))) return toggleAssociatedSelection(item, nextPath, detail);
            if (opts.multiple !== true && opts.changeOnSelect === true && !isLocked()) {
              selection.set(String(item.value), { source: detail && detail.source || 'instance', reason: 'change-on-select' }); selectionAnchorValue = String(item.value); opts.value = selection.value; syncControl({ source: detail && detail.source || 'instance', reason: 'change-on-select' });
              var branchPayload = { value: item.value, values: selection.values.slice(), item: item, pathItems: nextPath.slice(), pathKeys: activePathKeys.slice(), pathLabels: nextPath.map(function (entry) { return String(entry.label); }), reason: 'change-on-select', originalEvent: detail && detail.originalEvent || null, cascader: instance };
              notifySelectionCallbacks(item.value, item.value, branchPayload);
              if (destroyed) return true;
            }
            activeColumnIndex = columnIndex;
            if (isLazyExpandable(item)) loadChildrenFor(item, detail); else renderColumns();
            return true;
          }
          if (isLocked()) return false;
          var value = String(item.value);
          if (opts.multiple === true) return toggleAssociatedSelection(item, nextPath, detail);
          else selection.set(value, { source: detail && detail.source || 'instance', reason: detail && detail.reason || 'select' });
          selectionAnchorValue = value;
          opts.value = opts.multiple === true ? selection.values.slice() : selection.value;
          refreshSelectionSurfaces(); syncControl({ source: detail && detail.source || 'instance', reason: detail && detail.reason || 'select' });
          var payload = { value: item.value, values: selection.values.slice(), item: item, pathItems: nextPath.slice(), pathKeys: activePathKeys.slice(), pathLabels: nextPath.map(function (entry) { return String(entry.label); }), reason: detail && detail.reason || 'select', originalEvent: detail && detail.originalEvent || null, cascader: instance };
          notifySelectionCallbacks(item.value, opts.multiple === true ? selection.values.slice() : item.value, payload);
          if (!destroyed && shouldCloseOnSelect()) triggerSession.close('select', payload.originalEvent);
          return true;
        }
    
        function handlePanelKeydown(event) {
          if (!event || !triggerSession || !triggerSession.getState().open) return false;
          if (event.key === 'Escape') {
            triggerSession.close('escape', event);
            if (event.preventDefault) event.preventDefault();
            return true;
          }
          var record = columnRecords[activeColumnIndex] || columnRecords[0];
          if (!record || !record.list) return false;
          if (event.key === 'ArrowRight') {
            var item = recordActiveItem(record);
            if (item && hasChildren(item)) {
              enterChildColumn(record.index, item, { source: 'keyboard', reason: 'arrow-right', originalEvent: event });
              if (event.preventDefault) event.preventDefault();
              return true;
            }
            return false;
          }
          if (event.key === 'ArrowLeft') {
            if (activeColumnIndex > 0) {
              var leavingIndex = activeColumnIndex;
              activeColumnIndex -= 1;
              var previous = columnRecords[activeColumnIndex];
              var pathItem = pathByKeys(activePathKeys)[activeColumnIndex];
              if (columnRecords[leavingIndex] && columnRecords[leavingIndex].list) columnRecords[leavingIndex].list.resetActive({ source: 'keyboard', reason: 'arrow-left-leave', silent: true });
              keyboardCursorKey = pathItem ? String(pathItem.key) : '';
              if (previous && pathItem) previous.list.setActiveKey(keyboardCursorKey, { source: 'keyboard', reason: 'arrow-left', silent: true });
              refreshSelectionSurfaces();
              activateRecordVirtualFocus(previous, 'arrow-left', event);
              if (event.preventDefault) event.preventDefault();
              return true;
            }
            return false;
          }
          if (['ArrowDown','ArrowUp','Home','End','PageDown','PageUp','Enter',' '].indexOf(event.key) >= 0) {
            var handled = record.list.handleKeydown(event);
            if (handled !== false) activateRecordVirtualFocus(record, 'cascader-' + String(event.key || '').toLowerCase(), event);
            return handled !== false;
          }
          return false;
        }
    
        function activateSearchResult(result, detail) {
          if (!result || !result.item) return false;
          activePathKeys = result.path.map(function (entry) { return String(entry.key); });
          activeColumnIndex = Math.max(0, activePathKeys.length - 1);
          var item = result.item;
          if (opts.multiple === true) toggleAssociatedSelection(item, result.path, detail || { source: 'keyboard', reason: 'search-select' });
          else {
            selection.set(String(item.value), { source: detail && detail.source || 'instance', reason: 'search-select' }); selectionAnchorValue = String(item.value); opts.value = selection.value;
            var payload = { value: item.value, values: selection.values.slice(), item: item, pathItems: result.path.slice(), pathKeys: activePathKeys.slice(), pathLabels: result.path.map(function (entry) { return String(entry.label); }), reason: 'search-select', originalEvent: detail && detail.originalEvent || null, cascader: instance };
            notifySelectionCallbacks(item.value, item.value, payload);
            if (!destroyed && shouldCloseOnSelect()) triggerSession.close('select', payload.originalEvent);
          }
          if (destroyed) return true;
          searchState.set('', {silent:true,notify:false,source:'popup',reason:'close-search'}); syncControl({ source: detail && detail.source || 'instance', reason: 'search-select' }); return true;
        }
        function destroySearchList() { if (searchList) searchList.destroy('cascader-search-refresh'); searchList = null; }
        function renderSearchResults() {
          destroyColumns(); destroySearchList();
          var hostNode = doc.createElement('div'); hostNode.className = 'qxframe9a7c2-cascader-search-results'; columnsHost.appendChild(hostNode);
          var results = searchPaths();
          searchList = ItemCollection.create({ container: hostNode, scrollAdapter:function(config){return Scroll.attachViewport(config);}, items: results, selectable: false, disabled: opts.disabled === true, readOnly: opts.readOnly === true, size: opts.size, virtual: opts.virtual, virtualThreshold: opts.virtualThreshold, height: opts.height, maxHeight: opts.maxHeight,
            keyboardFocusOwner: controlFocusElement, getKey: function (entry) { return entry.key; }, getLabel: function (entry) { return entry.label; }, getValue: function (entry) { return entry.value; }, ownerPrefix: 'cascader', itemSemanticClasses: function () { return ['qxframe9a7c2-cascader-item','qxframe9a7c2-cascader-option']; }, itemClassParts:['item','option'], classes:opts.classes, styles:opts.itemStyles, itemRender: function (entry, ctx) { return renderColumnItem(entry, ctx, 0, true); },
            onActivate: function (detail) { activateSearchResult(detail.item, detail); }
          });
          columnRecords = [{ index: 0, items: results, host: hostNode, list: searchList, search: true }]; activeColumnIndex = 0;
          bindListVirtualFocus(columnRecords[0]);
          if (results.length) { searchList.prepareOpen({ strategy: 'first', source: 'keyboard', reason: 'cascader-search' }); activateRecordVirtualFocus(columnRecords[0], 'cascader-search', null); }
        }
    
        function renderColumns() {
          if (opts.searchable === true && searchState.query.trim()) { renderSearchResults(); return; }
          destroySearchList(); destroyColumns();
          var currentItems = Array.isArray(opts.items) ? opts.items : [];
          var pathItems = pathByKeys(activePathKeys);
          var levels = [currentItems];
          for (var p = 0; p < pathItems.length; p += 1) { var nested = childrenOf(pathItems[p]); if (nested.length) levels.push(nested); else break; }
          levels.forEach(function (items, index) {
            var column = doc.createElement('div'); column.className = 'qxframe9a7c2-cascader-column'; DOM.setPrivate(column, 'cascaderColumn', String(index)); columnsHost.appendChild(column);
            var record = { index: index, items: items, host: column, list: null };
            record.list = ItemCollection.create({
              container: column, items: items, selectable: false, disabled: opts.disabled === true, readOnly: opts.readOnly === true, size: opts.size, virtual: false,
              keyboardFocusOwner: controlFocusElement,
              ownerPrefix: 'cascader', itemSemanticClasses: function () { return ['qxframe9a7c2-cascader-item','qxframe9a7c2-cascader-option']; }, itemClassParts:['item','option'], classes:opts.classes, styles:opts.itemStyles,
              itemRender: function (entry, ctx) { return renderColumnItem(entry, ctx, index, false); }, selectionAppearance: opts.selectionAppearance || (opts.multiple === true ? 'checkbox' : 'highlight'),
              getCheckState: function (entry) { return cascadeCheckState(entry); },
              getItemState: function (entry) {
                var check = cascadeCheckState(entry);
                return {
                  open: hasChildren(entry) && String(activePathKeys[index] || '') === String(entry.key) && columnRecords.length > index + 1,
                  descendantSelected: check.descendantSelected === true
                };
              },
              onActivate: function (detail) {
                activeColumnIndex = index;
                if (detail && detail.source === 'keyboard' && detail.reason !== 'space' && hasChildren(detail.item)) enterChildColumn(index, detail.item, detail);
                else activateAt(index, detail.item, detail);
              },
              onActiveChange: function (detail) {
                activeColumnIndex = index;
                keyboardCursorKey = detail && detail.key ? String(detail.key) : '';
              },
              onHoverChange: function (detail) {
                if (String(opts.expandTrigger || 'click') !== 'hover' || !detail || !detail.key) return;
                var item = null; items.some(function (entry) { if (String(entry.key) === String(detail.key)) { item = entry; return true; } return false; });
                if (item && hasChildren(item)) activateAt(index, item, { source: 'pointer', reason: 'hover-expand', originalEvent: detail.originalEvent || null });
              }
            });
            columnRecords.push(record);
            bindListVirtualFocus(record);
          });
          if (columnRecords.length) activeColumnIndex = Math.max(0, Math.min(activeColumnIndex, columnRecords.length - 1));
          var activeRecord = columnRecords[activeColumnIndex];
          if (activeRecord && keyboardCursorKey) { activeRecord.list.setActiveKey(keyboardCursorKey, { source: 'instance', reason: 'restore-keyboard-cursor', silent: true }); if (keyboard && keyboard.virtualFocus && keyboard.virtualFocus.getState().modality === 'keyboard') activateRecordVirtualFocus(activeRecord, 'restore-keyboard-cursor', null); }
          refreshSelectionSurfaces();
        }
    
        function emitOpen(opened, detail) {
          syncControl();
          return OpenStateBridge.dispatch(opened, detail, {
            emitter: emitter,
            eventName: 'openChange',
            decorate: function () { return { cascader: instance }; },
            onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); },
            shouldEmit: function () { return !triggerSession || triggerSession.getState().open === opened; }
          });
        }
    
    
        function hostedTags() { return fieldControl && fieldControl.getTags ? fieldControl.getTags() : null; }
        function bindCompositeVirtualFocus() {
          if (!keyboard || !keyboard.virtualFocus) return;
          columnRecords.forEach(bindListVirtualFocus);
          if (tagNavigation) { tagNavigation.destroy(); tagNavigation = null; }
          if (opts.multiple !== true || !hostedTags()) return;
          tagNavigation = TagNavigation.create({
            keyboard:keyboard,
            domainName:'cascader-tags',
            owner:hostedTags,
            getInputElement:controlFocusElement,
            isLocked:isLocked
          });
        }
        function consumeKey(event) { if (event && event.preventDefault) event.preventDefault(); return true; }
        function handleHostedTagKeydown(event) { if (event && event.key === 'Escape' && triggerSession && triggerSession.getState().open) return false; return tagNavigation ? tagNavigation.handleKeydown(event) : false; }
        function handleHorizontalKey(event) {
          if (!event || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return false;
          if (KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target)) return false;
          if (triggerSession && triggerSession.getState().open) {
            var record = columnRecords[activeColumnIndex] || columnRecords[0];
            if (record && !record.search) {
              if (event.key === 'ArrowRight') {
                var item = recordActiveItem(record);
                if (item && hasChildren(item)) { enterChildColumn(record.index, item, { source:'keyboard', reason:'arrow-right', originalEvent:event }); var nextRecord = columnRecords[activeColumnIndex]; if (nextRecord) activateRecordVirtualFocus(nextRecord, 'arrow-right', event); return consumeKey(event); }
              } else if (activeColumnIndex > 0) {
                var leavingIndex = activeColumnIndex; activeColumnIndex -= 1;
                var previous = columnRecords[activeColumnIndex]; var pathItem = pathByKeys(activePathKeys)[activeColumnIndex];
                if (columnRecords[leavingIndex] && columnRecords[leavingIndex].list) columnRecords[leavingIndex].list.resetActive({ source:'keyboard', reason:'arrow-left-leave', silent:true });
                keyboardCursorKey = pathItem ? String(pathItem.key) : '';
                if (previous && pathItem) previous.list.setActiveKey(keyboardCursorKey, { source:'keyboard', reason:'arrow-left', silent:true });
                refreshSelectionSurfaces(); activateRecordVirtualFocus(previous, 'arrow-left', event); return consumeKey(event);
              }
            }
          }
          return handleHostedTagKeydown(event);
        }
        function handleControlKeydown(event) {
          if (!event) return false;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return handleHorizontalKey(event);
          if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') return handleHostedTagKeydown(event);
          return false;
        }
    
        fieldControl = headlessMode ? null : projectionMode ? Control.createProjection({
          document:doc, reference:root, valueTarget:valueTarget, inputTarget:input, formTarget:opts.formTarget, formField:opts.formField, name:opts.name, committedValue:opts.multiple === true ? selection.values.slice() : selection.value,
          mode:opts.multiple === true ? 'tags':(opts.searchable===true?'input':'value'), tags:opts.multiple === true ? selectionTags.tags():[], editable:opts.searchable === true, disabled:opts.disabled === true, readOnly:opts.readOnly === true, required:opts.required === true, placeholder:opts.placeholder,
          onInput:function(value,event){ if (opts.searchable === true && !isLocked()) { setSearch(value,{source:'input',reason:'input',originalEvent:event}); if (!destroyed && triggerSession && !triggerSession.getState().open) triggerSession.open('input',event); } },
          onKeydown:function(event){ return handleControlKeydown(event); }
        }) : Control.create({
          elements: { root: root, valueHost: valuesNode, input: input, clear: clearButton, toggle: arrow, prefix: prefix, suffix: suffix }, document: doc, formField: opts.formField, committedValue: opts.multiple === true ? selection.values.slice() : selection.value,
          mode: opts.multiple === true ? 'tags' : (opts.searchable === true ? 'input' : 'value'), tags: opts.multiple === true ? selectionTags.tags() : [], creatableTags:false,tagsControlled:true,
          maxVisibleTags: opts.maxVisibleTags, tagInputMinWidth:opts.searchable === true ? 32 : 0, renderTag: renderSelectedTag, renderTagOverflow: renderSelectedTagOverflow, tagClasses:opts.tagClasses, tagStyles:opts.tagStyles, tagOverflowClassName:'qxframe9a7c2-cascader-tag qxframe9a7c2-cascader-tag-overflow',
          tagClassName: 'qxframe9a7c2-cascader-tag', tagTextClassName: 'qxframe9a7c2-cascader-tag-text', tagRemoveClassName: 'qxframe9a7c2-cascader-tag-remove',
          size: opts.size, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true,
          disabled: opts.disabled === true, readOnly: opts.readOnly === true, editable: opts.searchable === true, clearable: opts.clearable === true, clearVisibility: 'interaction', hasValue: selection.values.length > 0,
          inputValue: '', placeholder: opts.placeholder, expanded: false, toggleVisible: true,
          onTagRemove: function (tag, detail) {
            if (opts.multiple !== true || isLocked()) return;
            var removeTargets = tagSelectionTargets(tag.value);
            selection.set(selection.values.filter(function (value) { return removeTargets.indexOf(String(value)) < 0; }), { source: detail.source || 'control', reason: detail.reason || 'tag-remove' });
            var values = selection.values; selectionAnchorValue = values.length ? values[values.length - 1] : null;
            opts.value = values.slice(); syncControl({ source: detail && detail.source || 'control', reason: detail && detail.reason || 'tag-remove' }); refreshSelectionSurfaces();
            var payload = { value: selection.values.slice(), values: selection.values.slice(), removedValue: tag.value, reason: detail.reason || 'tag-remove', originalEvent: detail.originalEvent || null, cascader: instance };
            if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(selection.values.slice(), payload);
            if (destroyed) return;
            if (Utils.isFunction(opts.onChange)) opts.onChange(selection.values.slice(), payload);
            if (destroyed) return;
            emitter.emit('change', payload);
          },
          onInput: function (value, event) { if (opts.searchable === true && !isLocked()) { setSearch(value, { source: 'input', reason: 'input', originalEvent: event }); if (!destroyed && triggerSession && !triggerSession.getState().open) triggerSession.open('input', event); } },
          onKeydown: function (event) { return handleControlKeydown(event); },
          onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
        });
    
        triggerSession = instance.setupPopupFieldRuntime({
          reference:root, triggerTarget: headlessMode ? triggerTarget : (projectionMode ? triggerTarget : (triggerTarget || root)), floating: panel, document: doc, portalContainer: portalContainer, trigger: opts.trigger, keyboardActivation: false, openDelay: opts.openDelay, closeDelay: opts.closeDelay, placement: opts.placement, transition: Trigger.motion.popupPlacement, strategy: opts.strategy || 'absolute', middleware: opts.middleware,
          matchReferenceWidth: opts.matchReferenceWidth === true, autoUpdate: opts.autoUpdate !== false, closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: true, focusScope: 'exit', tabExitTarget: controlFocusElement, closeOnEscape: true, destroyOnClose: opts.destroyOnClose !== false,
          restoreFocus: false, disabled: opts.disabled === true,
          beforeOpen: function () { if (destroyed || opts.disabled === true) return false; },
          onOpen: function (detail) {
            var eventType = detail && detail.originalEvent && detail.originalEvent.type || '';
            var reason = String(detail && detail.reason || '');
            var keyboardOpen = /^key/.test(eventType) || /keyboard/.test(reason);
            var anchorPath = selectedAnchorPath();
            if (anchorPath.length) {
              activePathKeys = anchorPath.map(function (entry) { return String(entry.key); });
              activeColumnIndex = Math.max(0, anchorPath.length - 1);
              keyboardCursorKey = String(anchorPath[anchorPath.length - 1].key);
            } else {
              activePathKeys = [];
              activeColumnIndex = 0;
              keyboardCursorKey = '';
            }
            renderColumns();
            syncPopupContent();
            var record = columnRecords[activeColumnIndex] || columnRecords[0];
            if (!anchorPath.length && keyboardOpen && record) {
              seedColumnActive(record, null, { source: 'keyboard', reason: 'cascader-open', strategy: /up/.test(reason) ? 'last' : 'first' });
              activateRecordVirtualFocus(record, 'cascader-open', detail && detail.originalEvent || null);
            }
            syncControl();
            emitOpen(true, detail);
          },
          onClose: function (detail) { if (destroyed) return; searchState.set('', {silent:true,notify:false,source:'popup',reason:'close-search'}); if (keyboard && keyboard.virtualFocus) keyboard.virtualFocus.clear({ modality:keyboard.virtualFocus.getState().modality }); renderColumns(); emitOpen(false, detail); }
        });
    
    
        var keyboardTarget = headlessMode ? triggerTarget : controlFocusElement();
        keyboard = keyboardTarget ? KeyboardNavigation.create({
          root: keyboardTarget,
          focusRoot: controlFocusElement,
          editableKeys:['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Backspace','Delete','Enter','Escape','Home','End','PageUp','PageDown',' '],
          allowEditableKey:function(key, detail){
            var event=detail&&detail.originalEvent;
            if (!event) return false;
            if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Backspace' || key === 'Delete' || key === 'Home' || key === 'End') return !KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target);
            return true;
          },
          handlers:{
            Escape:function(detail){ return triggerSession.getState().open ? triggerSession.close('escape', detail.originalEvent) : handleHostedTagKeydown(detail.originalEvent); },
            ArrowDown:function(detail){ if (!triggerSession.getState().open) { triggerSession.open('keyboard-down', detail.originalEvent); return true; } var record=columnRecords[activeColumnIndex]||columnRecords[0]; if (!record || !record.list) return false; if (!recordActiveItem(record)) { var seeded=seedColumnActive(record,null,{source:'keyboard',reason:'arrow-down',strategy:'first'}); if (seeded) { activateRecordVirtualFocus(record,'arrow-down',detail.originalEvent); if (detail.originalEvent&&detail.originalEvent.preventDefault) detail.originalEvent.preventDefault(); return true; } } return record.list.handleKeydown(detail.originalEvent)!==false; },
            ArrowUp:function(detail){ if (!triggerSession.getState().open) { triggerSession.open('keyboard-up', detail.originalEvent); return true; } var record=columnRecords[activeColumnIndex]||columnRecords[0]; if (!record || !record.list) return false; if (!recordActiveItem(record)) { var seeded=seedColumnActive(record,null,{source:'keyboard',reason:'arrow-up',strategy:'last'}); if (seeded) { activateRecordVirtualFocus(record,'arrow-up',detail.originalEvent); if (detail.originalEvent&&detail.originalEvent.preventDefault) detail.originalEvent.preventDefault(); return true; } } return record.list.handleKeydown(detail.originalEvent)!==false; },
            ArrowLeft:function(detail){ return handleHorizontalKey(detail.originalEvent); },
            ArrowRight:function(detail){ return handleHorizontalKey(detail.originalEvent); },
            Backspace:function(detail){ return handleHostedTagKeydown(detail.originalEvent); },
            Delete:function(detail){ return handleHostedTagKeydown(detail.originalEvent); },
            Home:function(detail){ var record=triggerSession.getState().open&&(columnRecords[activeColumnIndex]||columnRecords[0]); return record && record.list ? record.list.handleKeydown(detail.originalEvent) : false; },
            End:function(detail){ var record=triggerSession.getState().open&&(columnRecords[activeColumnIndex]||columnRecords[0]); return record && record.list ? record.list.handleKeydown(detail.originalEvent) : false; },
            PageUp:function(detail){ var record=triggerSession.getState().open&&(columnRecords[activeColumnIndex]||columnRecords[0]); return record && record.list ? record.list.handleKeydown(detail.originalEvent) : false; },
            PageDown:function(detail){ var record=triggerSession.getState().open&&(columnRecords[activeColumnIndex]||columnRecords[0]); return record && record.list ? record.list.handleKeydown(detail.originalEvent) : false; },
            Enter:function(detail){
              if (!triggerSession.getState().open) { triggerSession.open('keyboard-enter', detail.originalEvent); return true; }
              var record=columnRecords[activeColumnIndex]||columnRecords[0]; return record && record.list ? record.list.handleKeydown(detail.originalEvent) : false;
            },
            ' ':function(detail){
              if (!triggerSession.getState().open || opts.multiple !== true) return false;
              var record=columnRecords[activeColumnIndex]||columnRecords[0], item=recordActiveItem(record);
              return record && item ? activateAt(record.index, item, { source:'keyboard', reason:'space', originalEvent:detail.originalEvent }) : false;
            }
          }
        }) : null;
        if (keyboard) { bindCompositeVirtualFocus(); scope.add(function(){ if (tagNavigation) { tagNavigation.destroy(); tagNavigation=null; } keyboard.destroy(); }); }
    
        function normalizeSelection() {
          var valid = opts.multiple === true ? normalizeAssociatedValues(selection.values) : selection.values.filter(function (value) { return findPathByValue(value).length > 0; }).slice(0, 1);
          selection.set(valid, { silent: true, source: 'normalize', reason: 'items' });
          var values = selection.values;
          if (selectionAnchorValue === null || !values.some(function (value) { return String(value) === String(selectionAnchorValue); })) selectionAnchorValue = values.length ? values[values.length - 1] : null;
          if (!activePathKeys.length) { var seedPath = selectedAnchorPath(); if (seedPath.length) activePathKeys = seedPath.map(function (item) { return String(item.key); }); }
        }
        function setValue(next, meta) {
          if (destroyed) return instance;
          selection.set(opts.multiple === true ? normalizeAssociatedValues(next) : normalizeValues(next, false), { source: meta && meta.source || 'instance', reason: meta && meta.reason || 'cascader-set-value' }); normalizeSelection();
          opts.value = opts.multiple === true ? selection.values.slice() : selection.value;
          var values = selection.values; selectionAnchorValue = values.length ? values[values.length - 1] : null;
          var seedPath = selectedAnchorPath(); activePathKeys = seedPath.map(function (item) { return String(item.key); });
          activeColumnIndex = activePathKeys.length ? activePathKeys.length - 1 : 0;
          keyboardCursorKey = seedPath.length ? String(seedPath[seedPath.length - 1].key) : '';
          if (triggerSession.getState().open) renderColumns(); syncControl({ silent: !!(meta && meta.silent), source: meta && meta.source || 'instance', reason: meta && meta.reason || 'set-value' });
          var payload = { value: opts.value, values: selection.values.slice(), reason: meta && meta.reason || 'set-value', source: meta && meta.source || 'instance', silent: !!(meta && meta.silent), originalEvent: meta && meta.originalEvent || null, cascader: instance };
          if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(opts.value, payload);
          if (destroyed) return instance;
          if (!(meta && meta.silent)) {
            if (Utils.isFunction(opts.onChange)) opts.onChange(opts.value, payload);
            if (destroyed) return instance;
            emitter.emit('change', payload);
          }
          return instance;
        }
        function clear(meta) {
          if (destroyed || isLocked()) return false; var had = selection.values.length > 0;
          selection.clear({ source: meta && meta.source || 'instance', reason: meta && meta.reason || 'clear' }); opts.value = opts.multiple === true ? [] : undefined; activePathKeys = []; activeColumnIndex = 0; selectionAnchorValue = null; keyboardCursorKey = '';
          if (triggerSession.getState().open) renderColumns(); syncControl({ silent: !!(meta && meta.silent), source: meta && meta.source || 'instance', reason: meta && meta.reason || 'clear' });
          var payload = { value: opts.value, values: [], reason: meta && meta.reason || 'clear', originalEvent: meta && meta.originalEvent || null, cascader: instance };
          if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(opts.value, payload);
          if (destroyed) return had;
          if (Utils.isFunction(opts.onChange)) opts.onChange(opts.value, payload);
          if (destroyed) return had;
          emitter.emit('change', payload);
          if (destroyed) return had;
          if (Utils.isFunction(opts.onClear)) opts.onClear(payload);
          if (destroyed) return had;
          emitter.emit('clear', payload);
          return had;
        }
        function replaceItems(items, meta) {
          validateItems(items);
          loadTasks.invalidate('cascader-dataset');
          opts.items = Array.isArray(items) ? items.slice() : [];
          loadedChildren.clear();
          loadedKeys = new Set((meta && Array.isArray(meta.loadedKeys) ? meta.loadedKeys : []).map(String));
          loadingKeys.clear();
          activePathKeys = [];
          activeColumnIndex = 0;
          keyboardCursorKey = '';
          normalizeSelection();
        }
        function setItems(items) { if (destroyed) return instance; replaceItems(items, { loadedKeys: [] }); if (triggerSession.getState().open) renderColumns(); syncControl(); return instance; }
        function applyOptions(nextOptions) {
          if (destroyed) return instance; var next = nextOptions || {}; rejectObsolete(next);
          OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless'], 'Cascader field binding');
          if (own(next, 'portalContainer')) throw new Error('[QXFRAME9A7C2] Cascader portalContainer is immutable; destroy and recreate to change it.');
          if (own(next, 'multiple') && next.multiple !== opts.multiple) throw new Error('[QXFRAME9A7C2] Cascader multiple is immutable; destroy and recreate to change value shape.');
          if (own(next, 'items')) validateItems(next.items);
          if (own(next, 'expandTrigger') && ['click','hover'].indexOf(String(next.expandTrigger)) < 0) throw new TypeError('[QXFRAME9A7C2] Cascader expandTrigger must be click or hover.');
          var proposedStrategy = own(next, 'checkedStrategy') ? next.checkedStrategy : opts.checkedStrategy; if (['child','parent','all'].indexOf(String(proposedStrategy || 'child')) < 0) throw new TypeError('[QXFRAME9A7C2] Cascader checkedStrategy must be "child", "parent", or "all".');
          var proposedVisibleTags = own(next, 'maxVisibleTags') ? next.maxVisibleTags : opts.maxVisibleTags; if (proposedVisibleTags !== 'responsive' && proposedVisibleTags !== undefined && proposedVisibleTags !== null && (!Number.isFinite(Number(proposedVisibleTags)) || Number(proposedVisibleTags) < 0)) throw new TypeError('[QXFRAME9A7C2] Cascader maxVisibleTags must be a non-negative number or \"responsive\".');
          var proposedPopupRender = own(next, 'popupRender') ? next.popupRender : opts.popupRender; if (proposedPopupRender !== null && proposedPopupRender !== undefined && !Utils.isFunction(proposedPopupRender)) throw new TypeError('[QXFRAME9A7C2] Cascader popupRender must be a function or null.');
          Object.keys(next).forEach(function (name) { if (name !== 'items') opts[name] = next[name]; });
          if (own(next, 'loadChildren') && !own(next, 'items')) { loadTasks.invalidate('cascader-loader'); loadingKeys.clear(); }
          if (own(next, 'items')) replaceItems(next.items, { loadedKeys: own(next, 'loadedKeys') ? next.loadedKeys : [] });
          else if (own(next, 'loadedKeys')) loadedKeys = new Set((Array.isArray(opts.loadedKeys) ? opts.loadedKeys : []).map(String));
          if (own(next, 'value')) selection.set(opts.multiple === true ? normalizeAssociatedValues(next.value) : normalizeValues(next.value, false), { silent: true, source: 'options', reason: 'options-value' });
          normalizeSelection(); triggerSession.updateOptions({ trigger: opts.trigger, openDelay: opts.openDelay, closeDelay: opts.closeDelay, placement: opts.placement, strategy: opts.strategy || 'absolute', middleware: opts.middleware, matchReferenceWidth: opts.matchReferenceWidth === true, autoUpdate: opts.autoUpdate !== false, destroyOnClose: opts.destroyOnClose !== false, disabled: opts.disabled === true });
          if (triggerSession.getState().open) { renderColumns(); syncPopupContent(); } syncControl(); if (own(next, 'open')) triggerSession.setOpen(next.open === true, 'update-options'); if (binding && binding.syncClasses) binding.syncClasses(opts.classes);
          return instance;
        }
        function getState() {
          var path = opts.multiple === true ? [] : displayPath();
          return Object.freeze({ value: opts.multiple === true ? selection.values.slice() : selection.value, values: selection.values.slice(), searchValue: searchState.query, checkedStrategy: String(opts.checkedStrategy || 'child'), changeOnSelect: opts.changeOnSelect === true, searchable: opts.searchable === true, maxVisibleTags:opts.maxVisibleTags === 'responsive' ? 'responsive' : Math.max(0, Math.floor(Number(opts.maxVisibleTags) || 0)), popupCustomized:Utils.isFunction(opts.popupRender), loadedKeys: Array.from(loadedKeys), loadingKeys: Array.from(loadingKeys), pathKeys: path.map(function (item) { return String(item.key); }), pathLabels: path.map(function (item) { return String(item.label); }), activePathKeys: activePathKeys.slice(), activeColumnIndex: activeColumnIndex, keyboardCursorKey: keyboardCursorKey, selectionAnchorValue: selectionAnchorValue, keyboardHostStable: !triggerSession.getState().open || doc.activeElement === controlFocusElement(), open: triggerSession.getState().open, headless: headlessMode, projection: projectionMode, multiple: opts.multiple === true, disabled: opts.disabled === true, readOnly: opts.readOnly === true, destroyed: destroyed });
        }
        function disposeRuntime(reason) {
          if (destroyed) return false; destroyed = true; loadTasks.destroy(); if (searchState) searchState.destroy(); destroySearchList(); destroyColumns(); loadedChildren.clear(); loadedKeys.clear(); loadingKeys.clear(); triggerSession = null; scope.dispose(); if (fieldControl) fieldControl.destroy(reason || 'cascader-destroy'); fieldControl = null; DOM.removeNode(panel); if (binding) binding.release(); binding = null; root = controlElement = valuesNode = input = clearButton = arrow = panel = popupContentHost = columnsHost = null; return true;
        }
    
        var initialFormValue = opts.multiple === true ? selection.values.slice() : selection.value;
        if (fieldControl && fieldControl.onFormReset) fieldControl.onFormReset(function () {
          setValue(initialFormValue, { silent: true, source: 'form', reason: 'reset' });
        });
    
    
        normalizeSelection(); syncControl();
        instance.bindFocusTarget(fieldControl&&fieldControl.getFocusElement?fieldControl.getFocusElement():(input||triggerTarget||root));
        instance.setFieldValue(opts.multiple===true?selection.values.slice():selection.value,{silent:true,force:true});
        if (opts.open === true) instance.open('initial');
        return Object.freeze({
          root:root,input:input,panel:panel,columnsHost:columnsHost,triggerTarget:triggerTarget,
          setItems:setItems,setValue:setValue,setSearch:setSearch,clear:clear,getState:getState,
          loadChildren:function(key,meta){var path=pathByKeys([key]);var item=path[0]||null;if(!item){var found=findPathByValue(key);item=found.length?found[found.length-1]:null;}return item?loadChildrenFor(item,meta):Promise.resolve([]);},
          getControl:function(){return fieldControl;},getColumns:function(){return columnRecords.map(function(record){return record.list;});},
          applyOptions:applyOptions,dispose:disposeRuntime
        });
      
}


export class Cascader extends PopupFieldComponent{
 static contract=getContract('Cascader');
 static immutableOptions=Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless','portalContainer','multiple']);
 static create(source,overrides){return new this(source,overrides).render();}
 static enhance(input,options){return this.create(input,options||{});}
 static createDefaultDOM=createDefaultDOM;
 constructor(source={},overrides){const prepared=prepareOptions(source,overrides);super(prepared.opts);runtimeState.set(this,{fieldInit:prepared.fieldInit,runtime:null});}
 [componentHooks.render](){const record=runtimeState.get(this);if(record.runtime)return record.runtime.root;const runtime=setupCascaderRuntime(this,record.fieldInit);record.runtime=runtime;this.own(()=>runtime.dispose('cascader-destroy'));return runtime.root;}
 [popupFieldHooks.optionsUpdated](next,previous,patch){const record=runtimeState.get(this);if(record.runtime)record.runtime.applyOptions(patch);}
 setItems(items){const r=runtimeState.get(this).runtime;return r?r.setItems(items):this;}
 setValue(value,meta){const r=runtimeState.get(this).runtime;return r?r.setValue(value,meta):this;}
 setSearch(value,meta){const r=runtimeState.get(this).runtime;return r?r.setSearch(value,meta):this;}
 loadChildren(key,meta){const r=runtimeState.get(this).runtime;return r?r.loadChildren(key,meta):Promise.resolve([]);}
 clear(meta){const r=runtimeState.get(this).runtime;return r?r.clear(meta):false;}
 getState(){const r=runtimeState.get(this).runtime;return r?r.getState():Object.freeze({open:false,destroyed:this.destroyed});}
 getControl(){const r=runtimeState.get(this).runtime;return r?r.getControl():null;}
 getColumns(){const r=runtimeState.get(this).runtime;return r?r.getColumns():[];}
 getRootElement(){const r=runtimeState.get(this).runtime;return r?r.root:this.root;}
 getInputElement(){const r=runtimeState.get(this).runtime;return r?r.input:null;}
 getPopupElement(){const r=runtimeState.get(this).runtime;return r?r.panel:super.getPopupElement();}
 getPopupOriginElement(){const r=runtimeState.get(this).runtime;return r?r.columnsHost:null;}
}
