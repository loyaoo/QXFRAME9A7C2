import { PopupFieldComponent, popupFieldHooks, createPopupFieldTriggerSettings, popupSelectionOpenPlan } from './popup-field.js';
import { Control } from './control.js';
import { Tree } from './tree.js';
import { Scroll } from './scroll.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ValueController } from '../core/valueController.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { SelectionTags } from '../core/selectionTags.js';
import { ItemSchema } from '../core/itemSchema.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { SearchState } from '../core/searchState.js';
import { FieldHost } from '../core/fieldHost.js';
import { Renderer } from '../core/renderer.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { TagNavigation } from '../core/tagNavigation.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Utils } from '../utils/utils.js';
import { TreeQuery } from '../utils/treeQuery.js';

const blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-tree-select qxframe9a7c2-tree-select-control qxframe9a7c2-input" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-tree-select-prefix qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
    <div class="qxframe9a7c2-tree-select-values qxframe9a7c2-input-values" data-qxframe9a7c2-ref="values"></div>
    <input class="qxframe9a7c2-tree-select-input qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
    <span class="qxframe9a7c2-tree-select-suffix qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix">
      <button class="qxframe9a7c2-tree-select-clear qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button>
      <span class="qxframe9a7c2-tree-select-toggle qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span>
    </span>
  </div>`;
    
function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  instance.refs.control = instance.root;
  return { root: instance.root, refs: instance.refs };
}
    

var hasOwn = Utils.own;
function asValues(value, multiple) {
  if (value === undefined || value === null || value === '') return [];
  var values = Array.isArray(value) ? value.slice() : [value];
  values = values.map(String);
  return multiple ? values : values.slice(0, 1);
}
    
function validateItems(items, opts) {
  return ItemSchema.validate(items, {
    label: 'TreeSelect items',
    uniqueKeys: !Utils.isFunction(opts.getKey),
    keyOf: function (item, index) { return Utils.isFunction(opts.getKey) ? opts.getKey(item, index) : item.key; },
    childrenOf: function (item) {
      if (Utils.isFunction(opts.getItems)) return opts.getItems(item);
      if (item.children !== undefined) throw new TypeError('[QXFRAME9A7C2] TreeSelect item.children is not canonical. Use item.items or explicit getItems().');
      return item.items;
    },
    validateItem: function (item) {
      if (!Utils.isFunction(opts.getKey)) {
        if (item.id !== undefined) throw new TypeError('[QXFRAME9A7C2] TreeSelect item.id is not canonical. Use item.key or explicit getKey().');
        if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] TreeSelect item.key is required unless getKey is supplied.');
      }
      if (!Utils.isFunction(opts.getLabel) && (item.label === undefined || item.label === null)) throw new TypeError('[QXFRAME9A7C2] TreeSelect item.label is required unless getLabel is supplied.');
      if (!Utils.isFunction(opts.getValue) && (item.value === undefined || item.value === null)) throw new TypeError('[QXFRAME9A7C2] TreeSelect item.value is required unless getValue is supplied.');
    }
  });
}


const TREE_SELECT_DEFAULTS=Object.freeze({items:[],multiple:false,checkable:false,checkStrictly:false,checkedStrategy:'child',searchable:true,clearable:false,maxCount:0,maxVisibleTags:0,renderTag:null,renderTagOverflow:null,popupRender:null,itemStyles:null,tagClasses:null,tagStyles:null,disabled:false,readOnly:false,size:'md',placeholder:'',trigger:'click',placement:'bottom-start',closeOnSelect:undefined,matchReferenceWidth:true,renderControl:true,headless:false});
const runtimeState=new WeakMap();
function validateTreeSelectOptions(opts){validateItems(opts.items,opts);if(['child','parent','all'].indexOf(String(opts.checkedStrategy||'child'))<0)throw new TypeError('[QXFRAME9A7C2] TreeSelect checkedStrategy must be "child", "parent", or "all".');if(opts.maxCount!=null&&(!Number.isFinite(Number(opts.maxCount))||Number(opts.maxCount)<0))throw new TypeError('[QXFRAME9A7C2] TreeSelect maxCount must be a non-negative number.');if(opts.maxVisibleTags!=='responsive'&&opts.maxVisibleTags!=null&&(!Number.isFinite(Number(opts.maxVisibleTags))||Number(opts.maxVisibleTags)<0))throw new TypeError('[QXFRAME9A7C2] TreeSelect maxVisibleTags must be a non-negative number or "responsive".');if(opts.popupRender!=null&&!Utils.isFunction(opts.popupRender))throw new TypeError('[QXFRAME9A7C2] TreeSelect popupRender must be a function or null.');return opts;}
function prepareOptions(source,overrides){const fieldInit=Control.resolveFieldOptions(source,overrides);const incoming=fieldInit.options;if(fieldInit.formField&&!hasOwn(incoming,'value')&&!hasOwn(incoming,'defaultValue'))incoming.value=fieldInit.nativeValue;return{fieldInit,opts:validateTreeSelectOptions(Utils.mergeOwn(TREE_SELECT_DEFAULTS,incoming))};}

function setupTreeSelectRuntime(instance,fieldInit) {
        var opts = Utils.mergeOwn( instance.options);
        validateItems(opts.items, opts);
        if (['child','parent','all'].indexOf(String(opts.checkedStrategy || 'child')) < 0) throw new TypeError('[QXFRAME9A7C2] TreeSelect checkedStrategy must be "child", "parent", or "all".');
        if (opts.maxCount !== undefined && opts.maxCount !== null && (!Number.isFinite(Number(opts.maxCount)) || Number(opts.maxCount) < 0)) throw new TypeError('[QXFRAME9A7C2] TreeSelect maxCount must be a non-negative number.');
        if (opts.maxVisibleTags !== 'responsive' && opts.maxVisibleTags !== undefined && opts.maxVisibleTags !== null && (!Number.isFinite(Number(opts.maxVisibleTags)) || Number(opts.maxVisibleTags) < 0)) throw new TypeError('[QXFRAME9A7C2] TreeSelect maxVisibleTags must be a non-negative number or "responsive".');
        if (opts.popupRender !== null && opts.popupRender !== undefined && !Utils.isFunction(opts.popupRender)) throw new TypeError('[QXFRAME9A7C2] TreeSelect popupRender must be a function or null.');

        var doc = opts.document || globalThis.document;
        var host = opts.container || null;
        var headlessMode = opts.headless === true;
        var projectionMode = !headlessMode && opts.renderControl === false;
    
        var emitter = Object.freeze({ emit:function(type,payload){return instance.emit(type,payload);} });
        var scope = Lifecycle.createScope();
        var destroyed = false;
        var api = instance;
        var binding = null, root = null, controlElement = null, valuesNode = null, input = null, clearButton = null, arrow = null, prefix = null, suffix = null, valueTarget = null, triggerTarget = null;
        var controlHost = FieldHost.resolvePickerControl({
          owner:'TreeSelect', options:opts, document:doc, host:host, component:instance, defaultFactory:createDefaultDOM
        });
        var fieldHost=controlHost.host;
        binding=controlHost.binding; root=controlHost.root; triggerTarget=controlHost.triggerTarget;
        controlElement=controlHost.controlElement; valuesNode=controlHost.valuesNode; input=controlHost.input; clearButton=controlHost.clearButton; arrow=controlHost.toggle;
        prefix=controlHost.prefix; suffix=controlHost.suffix; valueTarget=controlHost.valueTarget;
        if (!headlessMode && !projectionMode && !host && opts.formField && binding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
    
        var portalContainer = opts.portalContainer;
        if (portalContainer && typeof portalContainer === 'string') portalContainer = DOM.resolveElement(portalContainer, doc);
        if (!portalContainer) portalContainer = doc.body;
        if (!portalContainer || !portalContainer.appendChild) throw new TypeError('[QXFRAME9A7C2] TreeSelect portalContainer must be an Element.');
    
        var panel = doc.createElement('div');
        var popupContentHost = doc.createElement('div');
        var treeHost = doc.createElement('div');
        panel.className = 'qxframe9a7c2-tree-select-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset';
        panel.hidden = true;
        popupContentHost.className = 'qxframe9a7c2-tree-select-popup-content';
        treeHost.className = 'qxframe9a7c2-tree-select-tree-host';
        popupContentHost.appendChild(treeHost);
        panel.appendChild(popupContentHost);
    
        var tree = null;
        var triggerSession = null;
        var keyboard = null;
        var fieldControl = null;
        var tagNavigation = null;
        var searchState = SearchState.create({ query:'' });
        var valueState = null;
    
        function multipleMode() { return opts.multiple === true || opts.checkable === true; }
        function hierarchicalCheckMode(config) {
          var source = config || opts;
          return source.multiple === true || source.checkable === true;
        }
        function normalizeApiValue(value) {
          var values = asValues(value, hierarchicalCheckMode());
          return hierarchicalCheckMode() ? values : values[0];
        }
        valueState = ValueController.createOptionValueBinding(opts, fieldInit.options, normalizeApiValue);
        scope.add(function () { if (valueState) valueState.destroy(); valueState = null; });
        function apiValue() { return valueState ? valueState.value : normalizeApiValue(undefined); }
        function restoreTreeFromApiValue(reason) {
          if (!tree || !valueState || !valueState.controlled) return;
          var committed = apiValue();
          if (hierarchicalCheckMode()) tree.setCheckedKeys(checkedKeysForValues(committed), { silent:true, source:'controlled', reason:reason || 'controlled-restore' });
          else tree.setValue(asValues(committed, false)[0], { silent:true, source:'controlled', reason:reason || 'controlled-restore' });
        }
        var itemAccessors = ItemAccessors.create({
          getKey:function(item,index){return Utils.isFunction(opts.getKey)?opts.getKey(item,index):(item&&item.key);},
          getItems:function(item,index){return Utils.isFunction(opts.getItems)?opts.getItems(item,index):(item&&item.items);},
          getLabel:function(item,index){return Utils.isFunction(opts.getLabel)?opts.getLabel(item,index):(item&&item.label);},
          getValue:function(item,index){return Utils.isFunction(opts.getValue)?opts.getValue(item,index):(item&&item.value);},
          isItemDisabled:function(item,index){return Utils.isFunction(opts.isItemDisabled)?opts.isItemDisabled(item,index)===true:!!(item&&item.disabled===true);}
        });
        function keyOf(item, index) { return itemAccessors.key(item,index); }
        function itemsOf(item, index) { return itemAccessors.children(item,index); }
        function labelOf(item, index) { return itemAccessors.label(item,index); }
        function valueOf(item, index) { return itemAccessors.value(item,index); }
        function itemByValue(value) {
          var needle=String(value);
          if (tree && tree.getModel) {
            var records=tree.getModel().records||[];
            for (var r=0;r<records.length;r+=1) if (String(valueOf(records[r].item,records[r].index))===needle) return records[r].item;
          }
          var record=TreeQuery.findByValue(opts.items,value,{accessors:itemAccessors});
          return record ? record.item : null;
        }
        function keyByValue(value) {
          var needle=String(value);
          if (tree && tree.getModel) {
            var records=tree.getModel().records||[];
            for (var r=0;r<records.length;r+=1) if (String(valueOf(records[r].item,records[r].index))===needle) return records[r].key;
          }
          var record=TreeQuery.findByValue(opts.items,value,{accessors:itemAccessors});
          return record ? record.key : null;
        }
        function checkedKeysForValues(value) {
          return asValues(value, true).map(keyByValue).filter(function (key) { return key !== null && key !== undefined && key !== ''; }).map(String);
        }
        function disabledSelectedValues(value) {
          return asValues(value, true).filter(function (entry) {
            var key = keyByValue(entry);
            if (key === null || key === undefined || key === '' || !tree) return false;
            var record = tree.getRecord(String(key));
            if (!record) return false;
            if (Utils.isFunction(opts.isItemDisabled)) return opts.isItemDisabled(record.item, record.index) === true;
            return !!(record.item && record.item.disabled === true);
          }).map(String);
        }
        function mergeRetainedDisabledValues(values) {
          var output = (Array.isArray(values) ? values : []).map(String);
          disabledSelectedValues(apiValue()).forEach(function (value) { if (output.indexOf(value) < 0) output.push(value); });
          return output;
        }
        function projectedCheckedKeys() {
          if (!tree) return checkedKeysForValues(apiValue());
          var checked = tree.getCheckedKeys(false).map(String);
          if (String(opts.checkedStrategy || 'child') === 'all') return checked;
          if (String(opts.checkedStrategy || 'child') === 'child') return tree.getCheckedKeys(true).map(String);
          var checkedSet = new Set(checked);
          return checked.filter(function (key) {
            var record = tree.getRecord(key);
            if (!record) return false;
            var parent = tree.getModel().getParent(key);
            while (parent) {
              if (checkedSet.has(parent.key)) return false;
              parent = tree.getModel().getParent(parent.key);
            }
            return true;
          });
        }
        function checkedValues() {
          if (!tree) return asValues(apiValue(), true);
          var projected = projectedCheckedKeys().map(function (key) {
            var record = tree.getRecord(key);
            return record ? String(valueOf(record.item, record.index)) : null;
          }).filter(function (value) { return value !== null; });
          // Disabled nodes are intentionally excluded from Tree's mutable checked Selection.
          // Preserve disabled values supplied by the external TreeSelect value owner so a
          // controlled SHOW_PARENT-style projection cannot silently drop them on unrelated
          // enabled-node checks or option updates.
          return mergeRetainedDisabledValues(projected);
        }
        function selectedValues() {
          if (hierarchicalCheckMode()) return checkedValues();
          if (tree) {
            var state = tree.getState();
            return multipleMode() ? state.values.slice() : (state.value === undefined || state.value === null ? [] : [String(state.value)]);
          }
          return asValues(apiValue(), multipleMode());
        }
        function mutationLocked() { return InteractionPolicy.mutationLocked(opts); }
        var selectionTags = SelectionTags.create({
          getValues:selectedValues,
          keyOf:function(value){return String(value);}, valueOf:function(value){return String(value);},
          labelOf:function(value){var item=itemByValue(value);return String(item ? labelOf(item,0) : value);},
          disabledOf:function(value){return disabledSelectedValues([value]).length>0;},
          removableOf:function(value){return !mutationLocked() && disabledSelectedValues([value]).length===0;}
        });
        function renderSelectedTag(tag, detail) {
          var item = itemByValue(tag.value);
          if (!Utils.isFunction(opts.renderTag)) return tag.label;
          return opts.renderTag(item, { value:String(tag.value), label:tag.label, tag:tag, index:detail.index, treeSelect:api });
        }
        function renderSelectedTagOverflow(hiddenTags, detail) {
          if (!Utils.isFunction(opts.renderTagOverflow)) return '+' + hiddenTags.length;
          return opts.renderTagOverflow(hiddenTags.map(function (tag) { return { value:String(tag.value), label:tag.label, item:itemByValue(tag.value) }; }), { hiddenCount:hiddenTags.length, visibleCount:detail.visibleTags.length, values:selectedValues(), treeSelect:api });
        }
        function syncPopupContent() {
          if (!popupContentHost) return;
          while (popupContentHost.firstChild) popupContentHost.removeChild(popupContentHost.firstChild);
          var output = treeHost;
          if (Utils.isFunction(opts.popupRender)) {
            output = opts.popupRender(treeHost, { values:selectedValues(), searchValue:searchState.query, tree:tree, treeSelect:api });
            if (output === undefined || output === null || output === false) output = treeHost;
          }
          Renderer.append(popupContentHost, output, doc);
        }
        function maxCountLimit() { return Math.max(0, Math.floor(Number(opts.maxCount) || 0)); }
        function maxCountApplies() {
          var strategy = String(opts.checkedStrategy || 'child');
          return multipleMode() && maxCountLimit() > 0 && (strategy === 'child' || (strategy === 'all' && opts.checkStrictly === true));
        }
        function recordCheckable(record) {
          if (!record) return false;
          if (Utils.isFunction(opts.isItemDisabled) && opts.isItemDisabled(record.item, record.index) === true) return false;
          if (record.item && record.item.disabled === true) return false;
          if (record.item && record.item.checkable === false) return false;
          return true;
        }
        function wouldExceedMaxCount(shouldCheck, detail) {
          if (!shouldCheck || !maxCountApplies() || !tree || !detail) return false;
          var model = tree.getModel(), record = model && model.getRecord(String(detail.key));
          if (!record || !recordCheckable(record)) return false;
          var candidate = new Set((detail.checkedKeys || []).map(String));
          if (opts.checkStrictly === true) candidate.add(record.key);
          else [record].concat(model.getDescendants(record.key)).forEach(function (entry) { if (recordCheckable(entry)) candidate.add(entry.key); });
          var strategy = String(opts.checkedStrategy || 'child');
          var count = Array.from(candidate).filter(function (key) { return strategy === 'all' || !model.hasChildren(key); }).length;
          var retainedDisabled = disabledSelectedValues(apiValue()).filter(function (value) { var key = keyByValue(value); return key === null || key === undefined || !candidate.has(String(key)); }).length;
          return count + retainedDisabled > maxCountLimit();
        }
        function beforeTreeCheck(shouldCheck, detail) {
          if (wouldExceedMaxCount(shouldCheck, detail)) return false;
          return !Utils.isFunction(opts.beforeCheck) || opts.beforeCheck(shouldCheck, detail) !== false;
        }
    
        function renderValues(commitMeta) {
          var values = selectedValues();
          var inputValue = '';
          var placeholder = String(opts.placeholder || '');
          if (multipleMode()) {
            inputValue = searchState.query;
            placeholder = values.length ? '' : placeholder;
          } else {
            var value = values[0];
            var item = value === undefined ? null : itemByValue(value);
            if (opts.searchable === true && triggerSession && triggerSession.getState().open) {
              inputValue = searchState.query;
              placeholder = value === undefined ? placeholder : String(item ? labelOf(item, 0) : value);
            } else inputValue = value === undefined ? '' : String(item ? labelOf(item, 0) : value);
          }
    
          if (headlessMode) return;
          if (projectionMode && fieldControl) {
            var projectionTags = multipleMode() ? selectionTags.tags() : [];
            var projectionDisplay = multipleMode() ? projectionTags.map(function (tag) { return String(tag.label || tag.value || ''); }).join(', ') : (values[0] === undefined ? '' : String((itemByValue(values[0]) ? labelOf(itemByValue(values[0]), 0) : values[0])));
            var projectionInput = opts.searchable === true && triggerSession && triggerSession.getState().open ? searchState.query : projectionDisplay;
            fieldControl.updateOptions({ mode:multipleMode() ? 'tags':(opts.searchable === true ? 'input':'value'), tags:projectionTags, displayValue:projectionDisplay, inputValue:projectionInput, editable:opts.searchable === true, disabled:opts.disabled === true, readOnly:opts.readOnly === true, required:opts.required === true, name:opts.name, placeholder:placeholder, hasValue:values.length > 0, expanded:!!(triggerSession && triggerSession.getState().open) });
            fieldControl.setDisplayValue(projectionDisplay); fieldControl.setInputValue(projectionInput); fieldControl.setDraftVisual(!multipleMode() && opts.searchable === true && !!(triggerSession && triggerSession.getState().open) && searchState.query !== ''); fieldControl.setCommittedValue(multipleMode() ? values.slice() : values[0], commitMeta || { silent:true, source:'selection', reason:'projection' });
            return;
          }
          if (fieldControl) fieldControl.updateOptions({
            mode: multipleMode() ? 'tags' : (opts.searchable === true ? 'input' : 'value'),
            tags: multipleMode() ? selectionTags.tags() : [],
            displayValue: !multipleMode() && opts.searchable !== true ? inputValue : null,
            creatableTags:false,tagsControlled:true,
            maxVisibleTags: opts.maxVisibleTags, tagInputMinWidth: opts.searchable === true ? 32 : 0,
            renderTag: renderSelectedTag,
            renderTagOverflow: renderSelectedTagOverflow,
            tagClasses: opts.tagClasses, tagStyles: opts.tagStyles,
            tagOverflowClassName: 'qxframe9a7c2-tree-select-tag qxframe9a7c2-tree-select-tag-overflow',
            tagClassName: 'qxframe9a7c2-tree-select-tag',
            tagTextClassName: 'qxframe9a7c2-tree-select-tag-text',
            tagRemoveClassName: 'qxframe9a7c2-tree-select-tag-remove',
            size: opts.size,
            variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles,
            status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true,
            disabled: opts.disabled === true,
            readOnly: opts.readOnly === true,
            editable: opts.searchable === true,
            clearable: opts.clearable === true,
            hasValue: values.length > 0,
            inputValue: inputValue,
            placeholder: placeholder,
            expanded: !!(triggerSession && triggerSession.getState().open),
            toggleVisible: true
          });
          if (fieldControl) { fieldControl.setDraftVisual(!multipleMode() && opts.searchable === true && !!(triggerSession && triggerSession.getState().open) && searchState.query !== ''); fieldControl.setCommittedValue(multipleMode() ? values.slice() : values[0], commitMeta || { silent: true, source: 'selection', reason: 'projection' }); }
          else { input.value = inputValue; input.placeholder = placeholder; }
          if (!projectionMode) { root.classList.add('qxframe9a7c2-tree-select'); root.classList.toggle('has-value', values.length > 0); root.classList.toggle('is-multiple', multipleMode()); }
        }
    
        function syncView(commitMeta) { renderValues(commitMeta); }
        function emitOpen(opened, detail) {
          if (!projectionMode && !headlessMode) root.classList.toggle('is-open', opened);
          if (fieldControl) fieldControl.setExpanded(opened);
          return OpenStateBridge.dispatch(opened, detail, {
            emitter: emitter,
            eventName: 'openChange',
            decorate: function () { return { treeSelect: api }; },
            onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); },
            shouldEmit: function () { return !triggerSession || triggerSession.getState().open === opened; }
          });
        }
        function emitChange(value, detail) {
          var suppliedValues = detail && Array.isArray(detail.values) ? detail.values.slice() : null;
          var payload = Utils.mergeOwn( detail || {}, { value: valueState.copy(value), values: suppliedValues || selectedValues(), controlled:!!(valueState && valueState.controlled), treeSelect: api });
          if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(valueState.copy(value), payload);
          if (destroyed) return false;
          if (Utils.isFunction(opts.onChange)) opts.onChange(valueState.copy(value), payload);
          if (destroyed) return false;
          emitter.emit('change', payload);
          return !destroyed;
        }
    
        tree = Tree.create({
          container: treeHost,
          items: Array.isArray(opts.items) ? opts.items.slice() : [],
          value: hierarchicalCheckMode() ? undefined : apiValue(),
          multiple: false,
          selectable: !hierarchicalCheckMode(),
          selectionAppearance: 'highlight',
          checkable: hierarchicalCheckMode(),
          checkStrictly: opts.checkStrictly === true,
          checkedKeys: hierarchicalCheckMode() ? checkedKeysForValues(apiValue()) : undefined,
          expandedKeys: opts.expandedKeys,
          defaultExpandedKeys: opts.defaultExpandedKeys,
          size: opts.size,
          disabled: opts.disabled === true,
          readOnly: opts.readOnly === true,
          virtual: opts.virtual,
          virtualThreshold: opts.virtualThreshold,
          height: opts.height,
          maxHeight: opts.maxHeight,
          scrollAdapter: function (config) { return Scroll.attachViewport(config); },
          keyboardFocusOwner: function () { return fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : input; },
          getKey: opts.getKey,
          getItems: opts.getItems,
          getLabel: opts.getLabel,
          getValue: opts.getValue,
          isItemDisabled: opts.isItemDisabled,
          filterItem: opts.filterItem,
          loadChildren: opts.loadChildren,
          loadedKeys: opts.loadedKeys,
          beforeCheck: beforeTreeCheck,
          beforeExpand: opts.beforeExpand,
          itemRender: opts.itemRender,
          styles: opts.itemStyles,
          renderIcon: opts.renderIcon,
          showLine: opts.showLine,
          indent: opts.indent,
          onLoad: opts.onLoad,
          onLoadError: opts.onLoadError,
          onSelect: function (detail) {
            var payload = Utils.mergeOwn( detail, { treeSelect: api });
            if (Utils.isFunction(opts.onSelect)) opts.onSelect(detail.value, payload);
            emitter.emit('select', payload);
          },
          onCheck: function (keys, detail) {
            if (!hierarchicalCheckMode()) return;
            var values = checkedValues();
            var changed = valueState.write(values, Utils.mergeOwn( detail, { reason:'check', source:detail && detail.source || 'tree' }), true);
            restoreTreeFromApiValue('controlled-check');
            searchState.clear({ silent:true, notify:false, source:'tree', reason:'selection' });
            tree.setSearch('');
            syncView({ source: detail && detail.source || 'tree', reason: 'check' });
            var payload = Utils.mergeOwn( detail, { checkedKeys: keys.slice(), values: values.slice(), value: values.slice(), controlled:!!(valueState && valueState.controlled), treeSelect: api });
            if (Utils.isFunction(opts.onCheck)) opts.onCheck(values.slice(), payload);
            emitter.emit('check', payload);
            if (changed) emitChange(values.slice(), Utils.mergeOwn( detail, { reason: 'check', checkedKeys: keys.slice(), values:values.slice() }));
          },
          onChange: function (value, detail) {
            if (hierarchicalCheckMode()) return;
            var proposed = opts.multiple === true ? tree.getState().values.slice() : value;
            var changed = valueState.write(proposed, Utils.mergeOwn( detail, { reason:'select', source:detail && detail.source || 'tree' }), true);
            restoreTreeFromApiValue('controlled-select');
            searchState.clear({ silent:true, notify:false, source:'tree', reason:'selection' });
            tree.setSearch('');
            syncView({ source: detail && detail.source || 'tree', reason: 'select' });
            if (changed) emitChange(proposed, Utils.mergeOwn( detail, { reason: 'select', values:asValues(proposed, multipleMode()) }));
            var shouldClose = opts.closeOnSelect !== undefined ? opts.closeOnSelect !== false : opts.multiple !== true;
            if (shouldClose && triggerSession) triggerSession.close('select', detail && detail.originalEvent || null);
          },
          onExpand: function (keys, detail) {
            var payload = Utils.mergeOwn( detail, { expandedKeys: keys.slice(), treeSelect: api });
            if (Utils.isFunction(opts.onExpand)) opts.onExpand(keys.slice(), payload);
            emitter.emit('expand', payload);
          }
        });
    
        var triggerSettings = createPopupFieldTriggerSettings(opts, {
          reference: root,
          triggerTarget: triggerTarget || root,
          floating: panel,
          document: doc,
          portalContainer: portalContainer
        }, {
          focusScope: 'exit',
          tabExitTarget: function () { return fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (input || triggerTarget || root); },
          onOpen: function (detail) {
            var plan = popupSelectionOpenPlan(detail, { hasSelection:selectedValues().length > 0 });
            tree.prepareOpen({ strategy:plan.strategy, fallback:plan.fallback, source:plan.keyboard || plan.reason === 'input' ? 'keyboard' : (detail && detail.source || 'api'), reason:'tree-select-open-' + plan.strategy });
            syncPopupContent();
            syncView();
            emitOpen(true, detail);
          },
          onClose: function (detail) { searchState.clear({ silent:true, notify:false, source:'popup', reason:'close-search' }); if (tree) { tree.setSearch(''); var domain = tree.getVirtualFocusDomain && tree.getVirtualFocusDomain(); if (domain) domain.clear({ modality:keyboard && keyboard.virtualFocus ? keyboard.virtualFocus.getState().modality : 'pointer' }); } syncView(); emitOpen(false, detail); }
        });
        triggerSession = instance.setupPopupFieldRuntime(triggerSettings);
    
        function open(reason, event) { return destroyed || opts.disabled === true ? false : instance.open(reason || 'api', event || null); }
        function close(reason, event) { return destroyed ? false : instance.close(reason || 'api', event || null); }
        function setSearch(value, meta) {
          if (destroyed) return api;
          searchState.set(value, { silent:true, notify:false, source:meta && meta.source || 'api', reason:meta && meta.reason || 'tree-select-search' });
          tree.setSearch(searchState.query, { source: meta && meta.source || 'api', reason: meta && meta.reason || 'tree-select-search' });
          renderValues();
          var payload = { searchValue: searchState.query, reason: meta && meta.reason || 'search', originalEvent: meta && meta.originalEvent || null, treeSelect: api };
          if (Utils.isFunction(opts.onSearch)) opts.onSearch(searchState.query, payload);
          if (destroyed) return api;
          emitter.emit('search', payload);
          return api;
        }
        function setValue(value, meta) {
          if (destroyed) return api;
          var cfg = meta || {};
          var desired = normalizeApiValue(value);
          var changed = valueState.write(desired, { silent:true, source:cfg.source || 'api', reason:cfg.reason || 'tree-select-set-value', originalEvent:cfg.originalEvent || null }, false);
          var canonical = apiValue();
          if (hierarchicalCheckMode()) tree.setCheckedKeys(checkedKeysForValues(canonical), { silent: true, source: cfg.source || 'api', reason: cfg.reason || 'tree-select-set-value' });
          else tree.setValue(asValues(canonical, false)[0], { silent:true, source:cfg.source || 'api', reason:cfg.reason || 'tree-select-set-value' });
          if (hierarchicalCheckMode() && !valueState.controlled) valueState.write(checkedValues(), { silent:true, source:cfg.source || 'api', reason:cfg.reason || 'tree-select-set-value-normalize' }, false);
          searchState.clear({ silent:true, notify:false, source:cfg.source || 'api', reason:cfg.reason || 'set-value' });
          tree.setSearch('');
          syncView({ silent: !!cfg.silent, source: cfg.source || 'api', reason: cfg.reason || 'set-value' });
          if (changed) {
            var current = apiValue();
            if (cfg.silent) { if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(valueState.copy(current), { value:valueState.copy(current), values:selectedValues(), reason:cfg.reason || 'set-value', source:cfg.source || 'api', silent:true, controlled:!!valueState.controlled, treeSelect:api }); }
            else emitChange(current, { reason: cfg.reason || 'set-value', source: cfg.source || 'api', originalEvent: cfg.originalEvent || null });
          }
          return api;
        }
        function clear(meta) {
          if (destroyed || mutationLocked()) return false;
          var cfg = meta || {};
          var had = selectedValues().length > 0;
          var nextValue = multipleMode() ? [] : undefined;
          if (hierarchicalCheckMode()) tree.setCheckedKeys([], { silent: true, source: cfg.source || 'api', reason: 'tree-select-clear' });
          else tree.clear({ silent:true, source:cfg.source || 'api', reason:'tree-select-clear', originalEvent:cfg.originalEvent || null });
          var changed = valueState.write(nextValue, { silent:true, source:cfg.source || 'api', reason:cfg.reason || 'clear', originalEvent:cfg.originalEvent || null }, true);
          restoreTreeFromApiValue('controlled-clear');
          searchState.clear({ silent:true, notify:false, source:cfg.source || 'api', reason:cfg.reason || 'set-value' });
          tree.setSearch('');
          syncView({ silent: !!cfg.silent, source: cfg.source || 'api', reason: cfg.reason || 'clear' });
          if (changed && !cfg.silent) emitChange(nextValue, { reason: cfg.reason || 'clear', source: cfg.source || 'api', originalEvent:cfg.originalEvent || null, values:asValues(nextValue, multipleMode()) });
          if (changed && Utils.isFunction(opts.onClear)) opts.onClear({ treeSelect: api, reason: cfg.reason || 'clear' });
          if (changed) emitter.emit('clear', { treeSelect: api, reason: cfg.reason || 'clear' });
          return had && changed;
        }
    
    
        function hostedTags() { return fieldControl && fieldControl.getTags ? fieldControl.getTags() : null; }
        function bindCompositeVirtualFocus() {
          if (!keyboard || !keyboard.virtualFocus) return;
          tree.bindVirtualFocus(keyboard.virtualFocus);
          if (tagNavigation) { tagNavigation.destroy(); tagNavigation = null; }
          if (!multipleMode() || !hostedTags()) return;
          tagNavigation = TagNavigation.create({
            keyboard:keyboard,
            domainName:'tree-select-tags',
            owner:hostedTags,
            getInputElement:function(){ return fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : input; },
            isLocked:mutationLocked
          });
        }
        function activateTreeVirtualFocus(reason, event) {
          if (!keyboard || !keyboard.virtualFocus || !tree || !tree.getVirtualFocusDomain) return false;
          var domain = tree.getVirtualFocusDomain();
          var state = tree.getState();
          var key = state && state.activeKey;
          if (!domain || !key) return false;
          domain.activate(String(key), { source:'keyboard', reason:reason || 'tree-select-tree', originalEvent:event || null, ensureVisible:true });
          return true;
        }
        function consumeKey(event) { if (event && event.preventDefault) event.preventDefault(); return true; }
        function handleHostedTagKeydown(event) { if (event && event.key === 'Escape' && triggerSession && triggerSession.getState().open) return false; return tagNavigation ? tagNavigation.handleKeydown(event) : false; }
        function handleCompositeHorizontal(event) {
          if (!event || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return false;
          if (KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target)) return false;
          if (triggerSession && triggerSession.getState().open && tree.handleExpandCollapseKeydown(event)) {
            activateTreeVirtualFocus(event.key === 'ArrowLeft' ? 'tree-collapse' : 'tree-expand', event);
            return consumeKey(event);
          }
          return handleHostedTagKeydown(event);
        }
        function handleControlKeydown(event) {
          if (!event) return false;
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') return handleCompositeHorizontal(event);
          if (event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Escape') return handleHostedTagKeydown(event);
          return false;
        }
    
        fieldControl = headlessMode ? null : projectionMode ? Control.createProjection({
          document:doc, reference:root, valueTarget:valueTarget, inputTarget:input, formTarget:opts.formTarget, formField:opts.formField, name:opts.name, committedValue:multipleMode() ? selectedValues():selectedValues()[0], mode:multipleMode() ? 'tags':(opts.searchable===true?'input':'value'), tags:multipleMode() ? selectionTags.tags():[], editable:opts.searchable === true, disabled:opts.disabled === true, readOnly:opts.readOnly === true, required:opts.required === true, placeholder:opts.placeholder,
          onInput:function(value,event){ if (!mutationLocked() && opts.searchable === true) { setSearch(value,{source:'input',reason:'input',originalEvent:event}); if (!triggerSession.getState().open) open('input',event); } },
          onKeydown:function(event){ return handleControlKeydown(event); }
        }) : Control.create({
          elements: { root: root, valueHost: valuesNode, input: input, clear: clearButton, toggle: arrow, prefix: prefix, suffix: suffix },
          document: doc, formField: opts.formField, committedValue: multipleMode() ? selectedValues() : selectedValues()[0],
          mode: multipleMode() ? 'tags' : (opts.searchable === true ? 'input' : 'value'),
          tags: multipleMode() ? selectionTags.tags() : [],
          creatableTags:false,tagsControlled:true,
          maxVisibleTags: opts.maxVisibleTags, tagInputMinWidth: opts.searchable === true ? 32 : 0,
          renderTag: renderSelectedTag,
          renderTagOverflow: renderSelectedTagOverflow,
          tagClasses: opts.tagClasses, tagStyles: opts.tagStyles,
          tagOverflowClassName: 'qxframe9a7c2-tree-select-tag qxframe9a7c2-tree-select-tag-overflow',
          tagClassName: 'qxframe9a7c2-tree-select-tag',
          tagTextClassName: 'qxframe9a7c2-tree-select-tag-text',
          tagRemoveClassName: 'qxframe9a7c2-tree-select-tag-remove',
          size: opts.size,
          variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles,
          status: opts.status, prefix: opts.prefix, suffix: opts.suffix,
          required: opts.required === true, name: opts.name, busy: opts.busy === true,
          disabled: opts.disabled === true,
          readOnly: opts.readOnly === true,
          editable: opts.searchable === true,
          clearable: opts.clearable === true,
          clearVisibility: 'interaction',
          hasValue: selectedValues().length > 0,
          inputValue: '',
          placeholder: opts.placeholder,
          expanded: false,
          toggleVisible: true,
          onTagRemove: function (tag, detail) {
            if (!multipleMode() || mutationLocked()) return;
            var values = detail.tags.map(function (entry) { return entry.value; });
            setValue(values, { source: detail.source || 'control', reason: detail.reason || 'tag-remove', originalEvent: detail.originalEvent || null });
            if (Utils.isFunction(opts.onRemove)) opts.onRemove(tag.value, { value: tag.value, values: values.slice(), originalEvent: detail.originalEvent || null, treeSelect: api });
          },
          onInput: function (value, event) { if (!mutationLocked() && opts.searchable === true) { setSearch(value, { source: 'input', reason: 'input', originalEvent: event }); if (!destroyed && triggerSession && !triggerSession.getState().open) open('input', event); } },
          onKeydown: function (event) { return handleControlKeydown(event); },
          onClearRequest: function (event) { clear({ source: DOM.activationSource(event), reason: 'clear-button', originalEvent: event }); }
        });
    
    
        var keyboardTarget = headlessMode ? triggerTarget : (fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (input || triggerTarget || root));
        keyboard = keyboardTarget ? KeyboardNavigation.create({
          root: keyboardTarget,
          focusRoot: function () { return headlessMode ? triggerTarget : (fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : keyboardTarget); },
          editableKeys: ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Backspace','Delete','Enter',' ','Escape','Home','End','PageUp','PageDown'],
          allowEditableKey: function (key, detail) {
            var event = detail && detail.originalEvent;
            if (!event) return false;
            if (key === ' ') {
              if (!triggerSession.getState().open || !hierarchicalCheckMode()) return false;
              // A searchable editor owns spaces once the user has started typing. With an
              // empty query Space remains a useful checkbox shortcut for the active tree row.
              return opts.searchable !== true || String(searchState.query || '').length === 0;
            }
            if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Backspace' || key === 'Delete' || key === 'Home' || key === 'End') return !KeyboardNavigation.shouldPreserveNativeTextEditing(event, event.target);
            return true;
          },
          handlers: {
            Escape: function (detail) { return triggerSession.getState().open ? close('escape', detail.originalEvent) : handleHostedTagKeydown(detail.originalEvent); },
            ArrowDown: function (detail) { if (!triggerSession.getState().open) return open('keyboard-down', detail.originalEvent) === true; return tree.handleKeydown(detail.originalEvent); },
            ArrowUp: function (detail) { if (!triggerSession.getState().open) return open('keyboard-up', detail.originalEvent) === true; return tree.handleKeydown(detail.originalEvent); },
            ArrowLeft: function (detail) { return handleCompositeHorizontal(detail.originalEvent); },
            ArrowRight: function (detail) { return handleCompositeHorizontal(detail.originalEvent); },
            Backspace: function (detail) { return handleHostedTagKeydown(detail.originalEvent); },
            Delete: function (detail) { return handleHostedTagKeydown(detail.originalEvent); },
            Enter: function (detail) {
              if (!triggerSession.getState().open) return open('keyboard-enter', detail.originalEvent);
              if (hierarchicalCheckMode()) {
                var active = tree.getState().activeKey;
                return active ? tree.check(active, undefined, { source:'keyboard', reason:'enter-check', originalEvent:detail.originalEvent }) : false;
              }
              return tree.handleKeydown(detail.originalEvent);
            },
            ' ': function (detail) {
              if (!triggerSession.getState().open || !hierarchicalCheckMode()) return false;
              return tree.handleKeydown(detail.originalEvent);
            },
            Home: function (detail) { return triggerSession.getState().open ? tree.handleKeydown(detail.originalEvent) : false; },
            End: function (detail) { return triggerSession.getState().open ? tree.handleKeydown(detail.originalEvent) : false; },
            PageUp: function (detail) { return triggerSession.getState().open ? tree.handleKeydown(detail.originalEvent) : false; },
            PageDown: function (detail) { return triggerSession.getState().open ? tree.handleKeydown(detail.originalEvent) : false; }
          }
        }) : null;
        if (keyboard) {
          bindCompositeVirtualFocus();
          scope.add(function () { if (tagNavigation) { tagNavigation.destroy(); tagNavigation = null; } keyboard.destroy(); });
        }
    
        function setItems(items) {
          if (destroyed) return api;
          validateItems(items, opts);
          opts.items = Array.isArray(items) ? items.slice() : [];
          tree.setItems(opts.items);
          syncView();
          if (triggerSession.getState().open) triggerSession.reposition('items');
          return api;
        }
        function applyOptions(nextOptions) {
          if (destroyed) return api;
          var next = nextOptions || {};
                    OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless'], 'TreeSelect field binding');
          if (hasOwn(next, 'portalContainer')) {
            var nextPortal = typeof next.portalContainer === 'string' ? DOM.resolveElement(next.portalContainer, doc) : next.portalContainer;
            if (nextPortal !== portalContainer) throw new Error('[QXFRAME9A7C2] TreeSelect portalContainer is immutable; destroy and recreate to change it.');
          }
          var candidate = Utils.mergeOwn( opts, next);
          if (['child','parent','all'].indexOf(String(candidate.checkedStrategy || 'child')) < 0) throw new TypeError('[QXFRAME9A7C2] TreeSelect checkedStrategy must be "child", "parent", or "all".');
          if (candidate.maxCount !== undefined && candidate.maxCount !== null && (!Number.isFinite(Number(candidate.maxCount)) || Number(candidate.maxCount) < 0)) throw new TypeError('[QXFRAME9A7C2] TreeSelect maxCount must be a non-negative number.');
          if (candidate.maxVisibleTags !== 'responsive' && candidate.maxVisibleTags !== undefined && candidate.maxVisibleTags !== null && (!Number.isFinite(Number(candidate.maxVisibleTags)) || Number(candidate.maxVisibleTags) < 0)) throw new TypeError('[QXFRAME9A7C2] TreeSelect maxVisibleTags must be a non-negative number or \"responsive\".');
          if (candidate.popupRender !== null && candidate.popupRender !== undefined && !Utils.isFunction(candidate.popupRender)) throw new TypeError('[QXFRAME9A7C2] TreeSelect popupRender must be a function or null.');
          if (hasOwn(next, 'items') || hasOwn(next, 'getKey') || hasOwn(next, 'getItems') || hasOwn(next, 'getLabel') || hasOwn(next, 'getValue')) validateItems(candidate.items, candidate);
          Utils.copyOwn(opts, next);
          var checkMode = hierarchicalCheckMode();
          var treeOptions = {
            multiple: false, selectable: !checkMode,
            selectionAppearance: 'highlight',
            checkable: checkMode, checkStrictly: opts.checkStrictly === true,
            size: opts.size, disabled: opts.disabled === true, readOnly: opts.readOnly === true,
            virtual: opts.virtual, virtualThreshold: opts.virtualThreshold, height: opts.height, maxHeight: opts.maxHeight,
            getKey: opts.getKey, getItems: opts.getItems, getLabel: opts.getLabel, getValue: opts.getValue, isItemDisabled: opts.isItemDisabled,
            filterItem: opts.filterItem, loadChildren: opts.loadChildren, beforeCheck: beforeTreeCheck, beforeExpand: opts.beforeExpand,
            itemRender: opts.itemRender, styles: opts.itemStyles, renderIcon: opts.renderIcon, showLine: opts.showLine, indent: opts.indent,
            onLoad: opts.onLoad, onLoadError: opts.onLoadError
          };
          if (hasOwn(next, 'items')) treeOptions.items = Array.isArray(opts.items) ? opts.items.slice() : [];
          if (hasOwn(next, 'loadedKeys')) treeOptions.loadedKeys = opts.loadedKeys;
          if (hasOwn(next, 'value')) {
            valueState.setControlled(true);
            valueState.syncExternal(opts.value, { silent:true, source:'options', reason:'options-value', preserveDraft:true });
            if (checkMode) treeOptions.checkedKeys = checkedKeysForValues(apiValue());
            else treeOptions.value = asValues(apiValue(), false)[0];
          } else if (hasOwn(next, 'multiple') || hasOwn(next, 'checkable') || hasOwn(next, 'checkStrictly')) {
            valueState.setValue(apiValue(), { silent:true, source:'options', reason:'options-mode-normalize' });
            treeOptions.checkedKeys = checkMode ? checkedKeysForValues(apiValue()) : [];
            if (!checkMode) treeOptions.value = asValues(apiValue(), false)[0];
          }
          if (hasOwn(next, 'expandedKeys')) treeOptions.expandedKeys = opts.expandedKeys;
          tree.updateOptions(treeOptions);
          if (checkMode && !valueState.controlled) valueState.write(checkedValues(), { silent:true, source:'options', reason:'options-check-normalize' }, false);
          else restoreTreeFromApiValue('options-controlled');
          if (opts.disabled === true && triggerSession.getState().open) close('disabled');
          if (hasOwn(next, 'popupRender') || triggerSession.getState().open) syncPopupContent();
          syncView();
          if (binding && binding.syncClasses) binding.syncClasses(opts.classes);
          return api;
        }
        function getState() {
          var state = tree.getState();
          var current = apiValue();
          var values = asValues(current, multipleMode());
          return Object.freeze({ open: !!triggerSession.getState().open, value: multipleMode() ? values.slice() : values[0], values: values.slice(), controlled:!!(valueState && valueState.controlled), searchValue: searchState.query, activeKey: state.activeKey, expandedKeys: state.expandedKeys.slice(), checkedKeys: state.checkedKeys.slice(), loadedKeys: state.loadedKeys.slice(), loadingKeys: state.loadingKeys.slice(), multiple: multipleMode(), checkable: hierarchicalCheckMode(), checkStrictly: opts.checkStrictly === true, checkedStrategy: String(opts.checkedStrategy || 'child'), searchable: opts.searchable === true, maxCount:maxCountLimit(), maxVisibleTags:opts.maxVisibleTags === 'responsive' ? 'responsive' : Math.max(0, Math.floor(Number(opts.maxVisibleTags) || 0)), popupCustomized:Utils.isFunction(opts.popupRender), headless: headlessMode, projection: projectionMode, disabled: opts.disabled === true, readOnly: opts.readOnly === true, destroyed: destroyed });
        }
        function disposeRuntime(reason) {
          if (destroyed) return false;
          destroyed = true;
          scope.dispose();
          if (searchState) searchState.destroy();
          triggerSession = null;
          if (tree) tree.destroy(reason || 'tree-select-destroy');
          tree = null;
          if (fieldControl) fieldControl.destroy(reason || 'tree-select-destroy');
          fieldControl = null;
          DOM.removeNode(panel);
          if (binding) binding.release();
          binding = null;
          root = controlElement = valuesNode = input = clearButton = arrow = panel = popupContentHost = treeHost = null;
          return true;
        }
    
        var initialFormValue = multipleMode() ? selectedValues().slice() : selectedValues()[0];
        if (fieldControl && fieldControl.onFormReset) fieldControl.onFormReset(function () {
          setValue(initialFormValue, { silent: true, source: 'form', reason: 'reset' });
        });
    

    
        syncView();
        instance.bindFocusTarget(fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (input || triggerTarget || root));
        instance.setFieldValue(multipleMode() ? selectedValues().slice() : selectedValues()[0], { silent:true, force:true });
        if (opts.open === true) instance.open('initial');
        return Object.freeze({
          root:root,input:input,panel:panel,treeHost:treeHost,triggerTarget:triggerTarget,
          setItems:setItems,setValue:setValue,setSearch:setSearch,clear:clear,
          setCheckedKeys:function(keys,meta){if(destroyed||!hierarchicalCheckMode())return instance;tree.setCheckedKeys(keys,meta||{source:'api',reason:'tree-select-set-checked-keys'});return instance;},
          check:function(key,next,meta){return destroyed||!hierarchicalCheckMode()?false:tree.check(key,next,meta||{source:'api',reason:'tree-select-check'});},
          setExpandedKeys:function(keys,meta){if(!destroyed)tree.setExpandedKeys(keys,meta);return instance;},
          expand:function(key,meta){return destroyed?false:tree.expand(key,meta);}, collapse:function(key,meta){return destroyed?false:tree.collapse(key,meta);},
          focus:function(){if(fieldControl)return fieldControl.focus();return DOM.focusElement(triggerTarget||root,{preventScroll:true});},
          getState:getState,getTree:function(){return tree;},getControl:function(){return fieldControl;},
          getInputElement:function(){return fieldControl&&fieldControl.getInputElement?fieldControl.getInputElement():input;},
          applyOptions:applyOptions,dispose:disposeRuntime
        });
      
}

export class TreeSelect extends PopupFieldComponent {
  static profile=Object.freeze({
    name:'TreeSelect',
    value:Object.freeze({mode:'controlled-or-default',channels:Object.freeze(['committed'])}),
    focus:Object.freeze({mode:'virtual-navigation'}),
    interaction:Object.freeze({keymap:'tree-select'}),
    overlay:Object.freeze({mode:'popup'}),
    form:Object.freeze({serialize:true}),
    ownership:Object.freeze({value:'ValueController'})
  });
  static contract=getContract('TreeSelect');
  static immutableOptions=Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless']);
  static create(source,overrides){return new this(source,overrides).render();}
  static enhance(input,options){return this.create(input,options||{});}
  static createDefaultDOM=createDefaultDOM;
  constructor(source={},overrides){const prepared=prepareOptions(source,overrides);super(prepared.opts);runtimeState.set(this,{fieldInit:prepared.fieldInit,runtime:null});}
  [componentHooks.render](){const record=runtimeState.get(this);if(record.runtime)return record.runtime.root;const runtime=setupTreeSelectRuntime(this,record.fieldInit);record.runtime=runtime;this.own(()=>runtime.dispose('tree-select-destroy'));return runtime.root;}
  [popupFieldHooks.optionsUpdated](next,previous,patch){const record=runtimeState.get(this);if(record.runtime)record.runtime.applyOptions(patch);}
  setItems(items){const r=runtimeState.get(this).runtime;return r?r.setItems(items):this;}
  setValue(value,meta){const r=runtimeState.get(this).runtime;return r?r.setValue(value,meta):this;}
  setSearch(value,meta){const r=runtimeState.get(this).runtime;return r?r.setSearch(value,meta):this;}
  setCheckedKeys(keys,meta){const r=runtimeState.get(this).runtime;return r?r.setCheckedKeys(keys,meta):this;}
  check(key,next,meta){const r=runtimeState.get(this).runtime;return r?r.check(key,next,meta):false;}
  setExpandedKeys(keys,meta){const r=runtimeState.get(this).runtime;return r?r.setExpandedKeys(keys,meta):this;}
  expand(key,meta){const r=runtimeState.get(this).runtime;return r?r.expand(key,meta):false;}
  collapse(key,meta){const r=runtimeState.get(this).runtime;return r?r.collapse(key,meta):false;}
  clear(meta){const r=runtimeState.get(this).runtime;return r?r.clear(meta):false;}
  focus(){const r=runtimeState.get(this).runtime;return r?r.focus():this.focusReference();}
  getState(){const r=runtimeState.get(this).runtime;return r?r.getState():Object.freeze({open:false,destroyed:this.destroyed});}
  getTree(){const r=runtimeState.get(this).runtime;return r?r.getTree():null;}
  getControl(){const r=runtimeState.get(this).runtime;return r?r.getControl():null;}
  getRootElement(){const r=runtimeState.get(this).runtime;return r?r.root:this.root;}
  getInputElement(){const r=runtimeState.get(this).runtime;return r?r.getInputElement():null;}
  getPopupElement(){const r=runtimeState.get(this).runtime;return r?r.panel:super.getPopupElement();}
  getPopupOriginElement(){const r=runtimeState.get(this).runtime;return r?r.treeHost:null;}
}

export default TreeSelect;
