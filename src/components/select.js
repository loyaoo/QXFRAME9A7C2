import { PopupFieldComponent, popupFieldHooks, createPopupFieldTriggerSettings, popupSelectionOpenPlan } from './popup-field.js';
import { Control } from './control.js';
import { OptionList } from './option-list.js';
import { Item } from './item.js';
import { Scroll } from './scroll.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { SearchState } from '../core/searchState.js';
import { StateController } from '../core/stateController.js';
import { SelectionTags } from '../core/selectionTags.js';
import { ItemAccessors } from '../core/itemAccessors.js';
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
  <div class="qxframe9a7c2-select qxframe9a7c2-select-control qxframe9a7c2-input qxframe9a7c2-group-control" data-qxframe9a7c2-ref="root">
    <span class="qxframe9a7c2-select-prefix qxframe9a7c2-input-prefix" data-qxframe9a7c2-ref="prefix"></span>
    <div class="qxframe9a7c2-select-values qxframe9a7c2-input-values" data-qxframe9a7c2-ref="values"></div>
    <input class="qxframe9a7c2-select-input qxframe9a7c2-input-control" type="text" autocomplete="off" data-qxframe9a7c2-ref="input">
    <span class="qxframe9a7c2-select-suffix qxframe9a7c2-input-suffix" data-qxframe9a7c2-ref="suffix">
      <button class="qxframe9a7c2-select-clear qxframe9a7c2-input-clear is-hidden" type="button" hidden data-qxframe9a7c2-ref="clear"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3"></span></button>
      <span class="qxframe9a7c2-select-toggle qxframe9a7c2-input-toggle is-hidden" hidden data-qxframe9a7c2-ref="toggle"><span class="qxframe9a7c2-icon qxframe9a7c2-icon-caret-down is-line is-round is-stroke-3"></span></span>
    </span>
  </div>`;
function createDefaultDOM(context){const instance=blueprint.instantiate(context.document);instance.refs.control=instance.root;return{root:instance.root,refs:instance.refs};}
const SELECT_DEFAULTS=Object.freeze({items:[],multiple:false,searchable:false,clearable:false,disabled:false,readOnly:false,size:'md',placement:'bottom-start',trigger:'click',open:false,placeholder:'',hideSelectedOptions:false,clearSearchOnSelect:true,creatable:false,tokenSeparators:[],defaultActiveFirstOption:false,maxCount:0,maxVisibleTags:0,tagTextMaxLength:0,searchFields:null,tagInputMinWidth:32,popupRender:null,loadingIcon:null,itemStyles:null,tagClasses:null,tagStyles:null,matchReferenceWidth:true,renderControl:true,headless:false});
const runtimeState=new WeakMap();
const hasOwn=Utils.own;
function validateSelectOptions(opts){
 if(opts.creatable===true&&opts.multiple!==true)throw new TypeError('[QXFRAME9A7C2] Select creatable requires multiple:true.');
 if(opts.creatable===true&&opts.searchable!==true)throw new TypeError('[QXFRAME9A7C2] Select creatable requires searchable:true so Control owns one editable token input path.');
 if(!Array.isArray(opts.tokenSeparators)&&!Utils.isFunction(opts.tokenSeparators))throw new TypeError('[QXFRAME9A7C2] Select tokenSeparators must be an array or tokenizer function.');
 if(opts.maxCount!=null&&(!Number.isFinite(Number(opts.maxCount))||Number(opts.maxCount)<0))throw new TypeError('[QXFRAME9A7C2] Select maxCount must be a non-negative number.');
 if(opts.maxVisibleTags!=='responsive'&&opts.maxVisibleTags!=null&&(!Number.isFinite(Number(opts.maxVisibleTags))||Number(opts.maxVisibleTags)<0))throw new TypeError('[QXFRAME9A7C2] Select maxVisibleTags must be a non-negative number or "responsive".');
 if(opts.tagTextMaxLength!=null&&(!Number.isFinite(Number(opts.tagTextMaxLength))||Number(opts.tagTextMaxLength)<0))throw new TypeError('[QXFRAME9A7C2] Select tagTextMaxLength must be a non-negative number.');
 if(opts.searchFields!=null){const fields=Array.isArray(opts.searchFields)?opts.searchFields:[opts.searchFields];if(!fields.every(field=>typeof field==='string'&&field.trim()!==''))throw new TypeError('[QXFRAME9A7C2] Select searchFields must be a field name or array of field names.');}
 if(opts.popupRender!=null&&!Utils.isFunction(opts.popupRender))throw new TypeError('[QXFRAME9A7C2] Select popupRender must be a function or null.');
 return opts;
}
function prepareOptions(source,overrides){const fieldInit=Control.resolveFieldOptions(source,overrides);const incoming=fieldInit.options;const authoredSelect=fieldInit.formField&&String(fieldInit.formField.tagName||'').toLowerCase()==='select'?fieldInit.formField:null;if(authoredSelect){if(!Object.prototype.hasOwnProperty.call(incoming,'multiple'))incoming.multiple=authoredSelect.multiple===true;if(!Object.prototype.hasOwnProperty.call(incoming,'items'))incoming.items=nativeSelectItems(authoredSelect);}if(fieldInit.formField&&!Object.prototype.hasOwnProperty.call(incoming,'value')&&!Object.prototype.hasOwnProperty.call(incoming,'defaultValue'))incoming.value=fieldInit.nativeValue;const opts=validateSelectOptions(Utils.mergeOwn(SELECT_DEFAULTS,incoming));return{fieldInit,opts};}

function labelOf(item, fallback) {
  if (item && typeof item === 'object' && item.label !== undefined) return String(item.label);
  return fallback === undefined || fallback === null ? '' : String(fallback);
}
    
function sizeName(value) { return Utils.normalizeSize(value, 'md'); }
    
function asValues(value, multiple) {
  if (value === undefined || value === null || value === '') return [];
  var values = Array.isArray(value) ? value.slice() : [value];
  values = values.map(String);
  return multiple ? values : values.slice(0, 1);
}
    
function nativeSelectItems(select) {
  function optionItem(option, groupDisabled) { return { key:String(option.value), value:String(option.value), label:String(option.textContent || option.label || option.value), disabled:groupDisabled===true || option.disabled===true }; }
  var output=[];
  Array.prototype.forEach.call(select.children||[],function(child,index){var tag=String(child.tagName||'').toLowerCase();if(tag==='optgroup'){var group={key:'optgroup:'+index+':'+String(child.label||''),label:String(child.label||''),selectable:false,disabled:child.disabled===true,items:[]};Array.prototype.forEach.call(child.children||[],function(option){if(String(option.tagName||'').toLowerCase()==='option')group.items.push(optionItem(option,child.disabled===true));});output.push(group);}else if(tag==='option')output.push(optionItem(child,false));});
  return output;
}
function nativeSelectFlatItems(items) { var output=[]; (items||[]).forEach(function(item){if(item&&Array.isArray(item.items))Array.prototype.push.apply(output,nativeSelectFlatItems(item.items));else output.push(item);}); return output; }

function setupSelectRuntime(instance,fieldInit){
        var opts=Utils.mergeOwn(instance.options);
        var doc=opts.document||globalThis.document;
        var host=opts.container||null;
        var headlessMode=opts.headless===true;
        var projectionMode=!headlessMode&&opts.renderControl===false;
var emitter = Object.freeze({ emit:function(type,payload){return instance.emit(type,payload);} });
        var scope = Lifecycle.createScope();
        var itemAccessors = ItemAccessors.create({
          getValue:function(item,index){return Utils.isFunction(opts.getValue)?opts.getValue(item,index):(item&&typeof item==='object'&&item.value!==undefined?item.value:item);},
          getLabel:function(item,index){return Utils.isFunction(opts.getLabel)?opts.getLabel(item,index):(item&&typeof item==='object'&&item.label!==undefined?item.label:(item&&typeof item==='object'&&item.value!==undefined?item.value:item));},
          getChildren:function(item){return item&&Array.isArray(item.items)?item.items:[];},
          isDisabled:function(item,index){return Utils.isFunction(opts.isItemDisabled)?opts.isItemDisabled(item,index)===true:!!(item&&typeof item==='object'&&item.disabled===true);}
        });
        var destroyed = false;
        var domBinding = null;
        var root = null;
        var control = null;
        var valuesNode = null;
        var input = null;
        var clearButton = null;
        var arrow = null;
        var prefix = null;
        var suffix = null;
        var valueTarget = null;
        var triggerTarget = null;
        var panel = null;
        var optionHost = null;
        var optionList = null;
        var triggerSession = null;
        var keyboard = null;
        var tagNavigation = null;
        var fieldControl = null;
        var searchState = SearchState.create({ query:'' });
        var draftValue = '';
        var draftActive = false;
        var draftDirty = false;
        var valueState = null;
        function normalizeApiValue(value) {
          var values = asValues(value, opts.multiple === true);
          return opts.multiple === true ? values : values[0];
        }
        function copyApiValue(value) { return Array.isArray(value) ? value.slice() : value; }
        valueState = StateController.create({
          value: normalizeApiValue(opts.value !== undefined ? opts.value : opts.defaultValue),
          controlled: hasOwn(fieldInit.options, 'value'),
          normalizeValue: normalizeApiValue,
          equals: StateController.deepEquals,
          copyValue: copyApiValue
        });
        scope.add(function () { if (valueState) valueState.destroy(); valueState = null; });
        function apiValue() { return valueState ? copyApiValue(valueState.value) : normalizeApiValue(undefined); }
        function writeApiValue(next, meta, request) {
          if (!valueState) return false;
          var cfg = Utils.assignOwn({ silent:true, source:'api', reason:request === true ? 'request-change' : 'set-value' }, meta || {});
          var normalized = normalizeApiValue(next);
          if (StateController.deepEquals(valueState.value, normalized)) return false;
          if (request === true && valueState.controlled) return valueState.requestChange(normalized, cfg);
          return valueState.setValue(normalized, cfg);
        }
        function restoreOptionListFromApiValue(reason) {
          if (!optionList || !valueState || !valueState.controlled) return false;
          optionList.setValue(apiValue(), { silent:true, source:'controlled', reason:reason || 'controlled-restore' });
          return true;
        }
                var api = instance;
var controlHost = FieldHost.resolvePickerControl({
          owner: 'Select', options: opts, document: doc, host: host, component: instance, defaultFactory: createDefaultDOM
        });
        var fieldHost = controlHost.host;
        domBinding = controlHost.binding; root = controlHost.root; triggerTarget = controlHost.triggerTarget;
        control = controlHost.controlElement; valuesNode = controlHost.valuesNode; input = controlHost.input; clearButton = controlHost.clearButton; arrow = controlHost.toggle;
        prefix = controlHost.prefix; suffix = controlHost.suffix; valueTarget = controlHost.valueTarget;
        if (!headlessMode && !projectionMode && !host && opts.formField && domBinding.source !== 'external') Control.placeFieldRoot(root, host, opts.formField);
    
        var portalContainer = opts.portalContainer;
        if (portalContainer && typeof portalContainer === 'string') portalContainer = DOM.resolveElement(portalContainer, doc);
        if (!portalContainer) portalContainer = doc.body;
        if (!portalContainer || !portalContainer.appendChild) throw new TypeError('[QXFRAME9A7C2] Select portalContainer must be an Element.');
    
        panel = doc.createElement('div');
        panel.className = 'qxframe9a7c2-select-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset';
        panel.hidden = true;
        optionHost = doc.createElement('div');
        optionHost.className = 'qxframe9a7c2-select-option-host';
        panel.appendChild(optionHost);
    
        function syncPopupProjection() {
          if (!panel || !optionHost) return false;
          var output = optionHost;
          if (Utils.isFunction(opts.popupRender)) {
            var rendered = opts.popupRender(optionHost, Object.freeze({ select: instance, originNode: optionHost }));
            if (rendered !== undefined) output = rendered;
          }
          panel.replaceChildren();
          Renderer.append(panel, output, doc);
          return true;
        }
    
        function selectedValues() {
          return asValues(apiValue(), opts.multiple === true);
        }
    
        function selectedItem(value) {
          return optionList ? optionList.getOptionByValue(value) : null;
        }
    
        function optionLocation(target) { return TreeQuery.location(opts.items, target, { accessors:itemAccessors }); }
        function optionValue(item, index) {
          if (item && item.__qxframe9a7c2CreatedOption === true) return String(item.value);
          var value = Utils.isFunction(opts.getValue) ? opts.getValue(item, index || 0) : (item && typeof item === 'object' && item.value !== undefined ? item.value : item);
          return value === undefined || value === null ? '' : String(value);
        }
        function optionLabel(item, index, fallback) {
          if (item && item.__qxframe9a7c2CreatedOption === true) return String(item.label);
          var label = Utils.isFunction(opts.getLabel) ? opts.getLabel(item, index || 0) : (item && typeof item === 'object' && item.label !== undefined ? item.label : fallback);
          return label === undefined || label === null ? String(fallback == null ? '' : fallback) : String(label);
        }
        function optionDisabled(item, index) { return item ? itemAccessors.disabled(item, index || 0) : false; }
        function selectedLabel(item, fallback) {
          var location = optionLocation(item);
          return optionLabel(item, location ? location.index : 0, fallback);
        }
        function findOptionByToken(token) {
          var needle = String(token == null ? '' : token).trim();
          var record = TreeQuery.find(opts.items, function (entry) {
            if (entry.children.length) return false;
            var value = optionValue(entry.item, entry.index), label = optionLabel(entry.item, entry.index, value);
            return value === needle || label === needle;
          }, { accessors:itemAccessors });
          if (!record) return null;
          var value = optionValue(record.item, record.index), label = optionLabel(record.item, record.index, value);
          return { item:record.item, index:record.index, value:value, label:label, disabled:optionDisabled(record.item, record.index) };
        }
        function tokenizeSelectInput(text) {
          var inputText = String(text == null ? '' : text);
          if (Utils.isFunction(opts.tokenSeparators)) {
            var custom = opts.tokenSeparators(inputText);
            if (!Array.isArray(custom)) throw new TypeError('[QXFRAME9A7C2] Select tokenSeparators function must return an array.');
            var tokens = custom.map(String).map(function (entry) { return entry.trim(); }).filter(Boolean);
            return tokens.length ? { tokens:tokens, remainder:'' } : null;
          }
          var separators = (Array.isArray(opts.tokenSeparators) ? opts.tokenSeparators : []).map(String).filter(Boolean);
          if (!separators.length) return null;
          var escaped = separators.map(function (entry) { return entry.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
          var parts = inputText.split(new RegExp('(?:' + escaped.join('|') + ')'));
          if (parts.length <= 1) return null;
          var remainder = parts.pop();
          return { tokens:parts.map(function (entry) { return String(entry).trim(); }).filter(Boolean), remainder:remainder };
        }
        function applyExistingOptionTokens(text, event) {
          if (opts.multiple !== true || opts.creatable === true) return false;
          var split = tokenizeSelectInput(text);
          if (!split) return false;
          var values = selectedValues();
          var selectedMatches = [];
          split.tokens.forEach(function (token) {
            var match = findOptionByToken(token);
            if (!match || match.disabled || values.indexOf(match.value) >= 0) return;
            if (Math.max(0, Number(opts.maxCount) || 0) && values.length >= Math.max(0, Number(opts.maxCount) || 0)) return;
            values.push(match.value); selectedMatches.push(match);
          });
          if (selectedMatches.length) {
            setValue(values, { reason:'input-token', source:'input', originalEvent:event || null });
            selectedMatches.forEach(function (match) {
              var payload = { value:match.value, item:match.item, selected:true, source:'input', reason:'input-token', originalEvent:event || null, select:instance };
              if (Utils.isFunction(opts.onSelect)) opts.onSelect(match.value, payload);
              emitter.emit('select', payload);
            });
          }
          searchState.set(String(split.remainder == null ? '' : split.remainder), { silent:true, notify:false, source:'input', reason:'input-token' });
          optionList.setSearch(searchState.query);
          renderValues();
          emitSearch({ reason:'input-token', originalEvent:event || null });
          return true;
        }
    
        function optionGetter(name) {
          var getter = opts[name];
          if (!Utils.isFunction(getter)) return null;
          return function (item, index) {
            if (item && item.__qxframe9a7c2CreatedOption === true) {
              if (name === 'getKey') return item.key;
              if (name === 'getLabel') return item.label;
              if (name === 'getValue') return item.value;
            }
            return getter(item, index);
          };
        }
    
        function ensureCreatedOption(tag) {
          if (!tag || !optionList) return null;
          var value = String(tag.value);
          var existing = optionList.getOptionByValue(value);
          if (existing) return existing;
          var created = { key:String(tag.key || value), value:value, label:String(tag.label == null ? value : tag.label) };
          Object.defineProperty(created, '__qxframe9a7c2CreatedOption', { value:true, enumerable:false });
          opts.items = (Array.isArray(opts.items) ? opts.items.slice() : []).concat([created]);
          optionList.setItems(opts.items);
          if (triggerSession && triggerSession.getState().open) triggerSession.reposition('creatable-option');
          return created;
        }
    
        function committedSingleDisplay() {
          if (opts.multiple === true) return '';
          var values = selectedValues();
          if (!values.length) return '';
          return selectedLabel(selectedItem(values[0]), values[0]);
        }
    
        function beginSingleDraft(meta) {
          if (opts.multiple === true || opts.searchable !== true) return false;
          if (!draftActive) {
            draftActive = true;
            draftValue = '';
            draftDirty = false;
            searchState.clear({ silent:true, notify:false, source:'draft', reason:'begin-single-draft' });
            if (optionList) optionList.setSearch('');
          }
          if (fieldControl) fieldControl.setDraftVisual(true);
          return true;
        }
    
        function setSingleDraft(value, meta) {
          if (opts.multiple === true || opts.searchable !== true) return false;
          if (!draftActive) {
            // A searchable single draft is an open-popup transaction. Public setSearch/input
            // must not manufacture a hidden draft session while the logical picker is closed.
            if (!triggerSession || !triggerSession.getState().open) return false;
            beginSingleDraft(meta);
          }
          draftValue = value === undefined || value === null ? '' : String(value);
          draftDirty = draftValue !== '';
          searchState.set(draftValue, { silent:true, notify:false, source:meta && meta.source || 'draft', reason:meta && meta.reason || 'single-draft' });
          if (optionList) optionList.setSearch(searchState.query);
          return true;
        }
    
        function cancelSingleDraft(meta) {
          if (opts.multiple === true || opts.searchable !== true) return false;
          draftActive = false;
          draftValue = '';
          draftDirty = false;
          searchState.clear({ silent:true, notify:false, source:meta && meta.source || 'draft', reason:meta && meta.reason || 'cancel-single-draft' });
          if (optionList) optionList.setSearch('');
          return true;
        }
    
        function emitOpen(opened, detail) {
          if (!projectionMode && !headlessMode) root.classList.toggle('is-open', opened);
          if (fieldControl) fieldControl.setExpanded(opened);
          return OpenStateBridge.dispatch(opened, detail, {
            emitter: emitter,
            eventName: 'openChange',
            decorate: function () { return { select: instance }; },
            onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); },
            shouldEmit: function () { return !triggerSession || triggerSession.getState().open === opened; }
          });
        }
    
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
            var plan = popupSelectionOpenPlan(detail, { hasSelection:selectedValues().length > 0, passiveFirst:opts.defaultActiveFirstOption === true });
            optionList.prepareOpen({ strategy:plan.strategy, fallback:plan.fallback, source:plan.keyboard || plan.reason === 'input' ? 'keyboard' : plan.source, reason:'select-open-' + plan.strategy });
            // Logical open owns business/query/cursor readiness. Physical afterOpen is animation-only.
            beginSingleDraft({ reason: 'picker-opened', source: detail && detail.source || 'trigger' });
            renderValues();
            emitOpen(true, detail);
          },
          onClose: function (detail) {
            // Draft/search mutation belongs to the accepted logical close commit, never preflight.
            if (opts.multiple !== true) cancelSingleDraft({ reason: detail && detail.reason || 'picker-close', source: detail && detail.source || 'trigger' });
            else if (searchState.query !== '') { searchState.clear({ silent:true, notify:false, source:'popup', reason:'close-search' }); if (optionList) optionList.setSearch(''); }
            if (optionList && optionList.getVirtualFocusDomain) {
              var optionDomain = optionList.getVirtualFocusDomain();
              if (optionDomain) optionDomain.clear({ modality: keyboard && keyboard.virtualFocus ? keyboard.virtualFocus.getState().modality : 'pointer' });
            }
            renderValues(); emitOpen(false, detail);
          }
        });
        triggerSession = instance.setupPopupFieldRuntime(triggerSettings);
    
        function userMutationLocked() { return InteractionPolicy.mutationLocked(opts); }
    
        function removeSelectedTagValue(value, detail) {
          if (opts.multiple !== true || userMutationLocked()) return false;
          var needle = String(value);
          var values = selectedValues();
          var index = values.indexOf(needle);
          if (index < 0) return false;
          values.splice(index, 1);
          var item = selectedItem(needle);
          var changed = optionList.setValue(values, {
            source: detail && detail.source || 'control',
            reason: detail && detail.reason || 'tag-remove',
            originalEvent: detail && detail.originalEvent || null
          }) !== false;
          if (changed) {
            var payload = Utils.mergeOwn( detail || {}, { value:needle, item:item, selected:false, select:instance });
            if (Utils.isFunction(opts.onDeselect)) opts.onDeselect(needle, payload);
            emitter.emit('deselect', payload);
          }
          return changed;
        }
        var selectionTags = SelectionTags.create({
          getValues: selectedValues,
          keyOf: function (value) { return String(value); },
          valueOf: function (value) { return String(value); },
          labelOf: function (value) { var item = selectedItem(value); return selectedLabel(item, value); },
          disabledOf: function (value) { var item=selectedItem(value), location=optionLocation(item); return optionDisabled(item, location ? location.index : 0); },
          removableOf: function (value) { var item=selectedItem(value), location=optionLocation(item); return !userMutationLocked() && !optionDisabled(item, location ? location.index : 0); },
          onRemove: function (value, _tag, detail) { return removeSelectedTagValue(value, detail); }
        });

    
        function hostedTags() {
          return fieldControl && fieldControl.getTags ? fieldControl.getTags() : null;
        }
    
        function inputCaretStart() {
          var target = fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : input;
          if (!target || typeof target.setSelectionRange !== 'function') return false;
          try { target.setSelectionRange(0, 0); return true; } catch (_) { return false; }
        }
    
        function bindCompositeVirtualFocus() {
          if (!keyboard || !keyboard.virtualFocus) return;
          optionList.bindVirtualFocus(keyboard.virtualFocus);
          if (tagNavigation) { tagNavigation.destroy(); tagNavigation = null; }
          if (opts.multiple !== true || !hostedTags()) return;
          tagNavigation = TagNavigation.create({
            keyboard:keyboard,
            domainName:'select-tags',
            owner:hostedTags,
            getInputElement:function(){ return fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : input; },
            isLocked:userMutationLocked
          });
        }

        function clearOptionVirtualFocus() {
          var domain = optionList && optionList.getVirtualFocusDomain ? optionList.getVirtualFocusDomain() : null;
          if (domain) domain.clear({ modality: keyboard && keyboard.virtualFocus ? keyboard.virtualFocus.getState().modality : 'pointer' });
        }

        function handleHostedTagKeydown(event) {
          if (!tagNavigation) return false;
          if (event && event.key === 'Escape' && triggerSession && triggerSession.getState().open) return false;
          if (tagNavigation.handleKeydown(event)) return true;
          if (!event || event.defaultPrevented) return true;
          if (String(event.key || '') !== 'Enter' || !triggerSession || !triggerSession.getState().open) return false;
          var state = optionList.getState();
          if (state.activeKey) return optionList.handleKeydown(event);
          // A creatable draft with no virtual option cursor belongs to the hosted
          // Tags/TokenInput owner. Enter must not manufacture an option cursor.
          if (opts.creatable === true && String(input && input.value || '').trim() !== '') return false;
          if (!state.activeKey && state.visibleItemCount > 0) {
            optionList.prepareOpen({ strategy:'first', fallback:'first', source:'keyboard', reason:'select-tag-input-enter' });
            state = optionList.getState();
          }
          if (state.activeKey) return optionList.handleKeydown(event);
          return false;
        }

        function renderSingleValue(item, value) {
          var enabled = value !== undefined;
          var rich = enabled && Utils.isFunction(opts.renderValue);
          root.classList.toggle('has-single-value', enabled);
          root.classList.toggle('has-rich-value', rich);
          var output = null;
          if (enabled) {
            var label = selectedLabel(item, value);
            output = rich ? opts.renderValue(item, { value: String(value), label: label, select: instance }) : label;
            if (output === undefined || output === null || output === false) output = null;
          }
          if (fieldControl && fieldControl.getState && fieldControl.getState().mode === 'value') fieldControl.setDisplayValue(output);
          else {
            while (valuesNode.firstChild) valuesNode.removeChild(valuesNode.firstChild);
            if (output !== null) Renderer.append(valuesNode, output);
          }
          return output !== null;
        }
    
        function defaultTagDisplayLabel(label) {
          var text = label === undefined || label === null ? '' : String(label);
          var max = Math.floor(Number(opts.tagTextMaxLength));
          if (!Number.isFinite(max) || max <= 0) return text;
          var chars = typeof Array.from === 'function' ? Array.from(text) : text.split('');
          return chars.length > max ? chars.slice(0, max).join('') + '...' : text;
        }
    
        function configuredSearchFields() {
          if (opts.searchFields === undefined || opts.searchFields === null || opts.searchFields === '') return [];
          return (Array.isArray(opts.searchFields) ? opts.searchFields : [opts.searchFields]).map(function (field) { return String(field).trim(); }).filter(Boolean);
        }
    
        function selectFilterItem() {
          if (Utils.isFunction(opts.filterItem)) return opts.filterItem;
          var fields = configuredSearchFields();
          if (!fields.length) return null;
          return function (query, item) {
            var needle = String(query === undefined || query === null ? '' : query).toLocaleLowerCase();
            if (!needle) return true;
            if (!item || typeof item !== 'object') return false;
            return fields.some(function (field) {
              var value = item[field];
              if (Array.isArray(value)) return value.some(function (entry) { return String(entry === undefined || entry === null ? '' : entry).toLocaleLowerCase().indexOf(needle) >= 0; });
              return String(value === undefined || value === null ? '' : value).toLocaleLowerCase().indexOf(needle) >= 0;
            });
          };
        }
    
        function renderSelectedTag(tag, detail) {
          var item = selectedItem(tag.value);
          if (!Utils.isFunction(opts.renderTag)) return defaultTagDisplayLabel(tag.label);
          return opts.renderTag(item, { value: tag.value, label: tag.label, tag: tag, index: detail.index, select: instance });
        }
    
        function renderSelectedTagOverflow(hiddenTags, detail) {
          if (!Utils.isFunction(opts.renderTagOverflow)) return '+' + hiddenTags.length;
          return opts.renderTagOverflow(hiddenTags.map(function (tag) { return { value: tag.value, label: tag.label, item: selectedItem(tag.value) }; }), { hiddenCount: hiddenTags.length, visibleCount: detail.visibleTags.length, values: selectedValues(), select: instance });
        }
    
    
        function renderValues(commitMeta) {
          if (destroyed) return;
          var values = selectedValues();
          var multiple = opts.multiple === true;
          if (headlessMode) return;
    
          if (projectionMode && fieldControl) {
            var projectionTags = multiple ? selectionTags.tags() : [];
            var projectionDisplay = values.map(function (entry) { return selectedLabel(selectedItem(entry), entry); }).join(', ');
            var projectionEditing = !multiple && opts.searchable === true && draftActive;
            var projectionInput = projectionEditing ? draftValue : (multiple ? searchState.query : projectionDisplay);
            var projectionPlaceholder = projectionEditing ? (projectionDisplay || String(opts.placeholder || '')) : String(opts.placeholder || '');
            var projectionHasValue = values.length > 0;
            fieldControl.updateOptions({ mode: multiple ? 'tags' : (opts.searchable === true ? 'input' : 'value'), tags: projectionTags, displayValue: projectionDisplay, inputValue: projectionInput, placeholder: projectionPlaceholder, disabled: opts.disabled === true, readOnly: opts.readOnly === true, editable: opts.searchable === true, required: opts.required === true, name: opts.name, expanded: !!(triggerSession && triggerSession.getState().open), hasValue: projectionHasValue });
            fieldControl.setDisplayValue(projectionDisplay);
            fieldControl.setInputValue(projectionInput);
            fieldControl.setDraftVisual(projectionEditing && draftValue !== '');
            fieldControl.setCommittedValue(multiple ? values.slice() : values[0], commitMeta || { silent:true, source:'selection', reason:'projection' });
            return;
          }
    
          if (fieldControl) {
            if (multiple) {
              var projectedTags = selectionTags.tags();
              fieldControl.updateOptions({
                mode: 'tags',
                tags: projectedTags,
                creatableTags: opts.creatable === true,
                tokenSeparators: opts.tokenSeparators,
                maxTags: opts.maxCount,
                maxTagLength: opts.maxTagLength,
                normalizeTag: opts.normalizeTag,
                validateTag: opts.validateTag,
                addOnEnter: opts.addOnEnter !== false,
                addOnTab: opts.addOnTab === true,
                addOnBlur: opts.addOnBlur === true,
                maxVisibleTags:opts.maxVisibleTags, tagsControlled:true,
                tagInputMinWidth: opts.searchable === true ? Math.max(0, Number(opts.tagInputMinWidth) || 32) : 0,
                measureAvailableWidth: Utils.isFunction(opts.measureAvailableWidth) ? function () { return opts.measureAvailableWidth({ root: root, values: valuesNode, input: input, select: instance }); } : null,
                measureTagWidth: Utils.isFunction(opts.measureTagWidth) ? function (tag, index, detail) { return opts.measureTagWidth(tag, index, { element: detail.element, root: root, values: valuesNode, input: input, select: instance }); } : null,
                measureTagOverflowWidth: Utils.isFunction(opts.measureTagOverflowWidth) ? function (hiddenTags) { return opts.measureTagOverflowWidth(hiddenTags.slice(), { root: root, values: valuesNode, input: input, select: instance }); } : null,
                renderTag: renderSelectedTag,
                renderTagOverflow: renderSelectedTagOverflow,
                tagClasses: opts.tagClasses,
                tagStyles: opts.tagStyles,
                inputValue: searchState.query,
                placeholder: values.length ? '' : String(opts.placeholder || ''),
                tagClassName: 'qxframe9a7c2-select-tag',
                tagTextClassName: 'qxframe9a7c2-select-tag-text',
                tagRemoveClassName: 'qxframe9a7c2-select-tag-remove',
                tagRemoveContent: opts.tagRemoveContent,
                tagOverflowClassName: 'qxframe9a7c2-select-tag qxframe9a7c2-select-tag-overflow',
                tagOverflowInteractive: true
              });
              if (!projectionMode) root.classList.remove('has-rich-value');
            } else {
              var value = values[0];
              var item = value === undefined ? null : selectedItem(value);
              var editingDraft = opts.searchable === true && draftActive;
              var committedDisplay = value === undefined ? '' : selectedLabel(item, value);
              var singleInputValue = editingDraft ? draftValue : committedDisplay;
              var singlePlaceholder = editingDraft ? (committedDisplay || String(opts.placeholder || '')) : (value === undefined ? String(opts.placeholder || '') : '');
              fieldControl.updateOptions({ mode: opts.searchable === true ? 'input' : 'value', tags: [], inputValue: opts.searchable === true ? singleInputValue : '', placeholder: singlePlaceholder });
              renderSingleValue(item, value);
              fieldControl.setDraftVisual(editingDraft && draftValue !== '');
              root.classList.toggle('is-searching', editingDraft);
            }
          } else {
            while (valuesNode.firstChild) valuesNode.removeChild(valuesNode.firstChild);
            var fallbackCommitted = values[0] === undefined ? '' : selectedLabel(selectedItem(values[0]), values[0]);
            input.value = multiple ? searchState.query : (opts.searchable === true && draftActive ? draftValue : fallbackCommitted);
            input.placeholder = multiple ? (values.length ? '' : String(opts.placeholder || '')) : (opts.searchable === true && draftActive ? (fallbackCommitted || String(opts.placeholder || '')) : (values.length ? '' : String(opts.placeholder || '')));
          }
    
          if (fieldControl) fieldControl.updateOptions({
            size: opts.size, variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles, tagClasses: opts.tagClasses, tagStyles: opts.tagStyles, status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true || opts.loading === true, busyIndicator: opts.loadingIcon,
            disabled: opts.disabled === true, readOnly: opts.readOnly === true, editable: opts.searchable === true, clearable: opts.clearable === true, clearContent: opts.clearContent, toggleContent: opts.toggleContent, tagRemoveContent: opts.tagRemoveContent, hasValue: values.length > 0, expanded: !!(triggerSession && triggerSession.getState().open), toggleVisible: true,
          });
          if (fieldControl && multiple) fieldControl.setDraftVisual(searchState.query !== '');
          if (fieldControl) fieldControl.setCommittedValue(opts.multiple === true ? values.slice() : values[0], commitMeta || { silent: true, source: 'selection', reason: 'projection' });
          if (!projectionMode) {
            root.classList.toggle('has-value', values.length > 0);
            root.classList.toggle('is-multiple', multiple);
            root.classList.toggle('is-searchable', opts.searchable === true);
            if (multiple) root.classList.remove('is-searching', 'has-single-value', 'has-rich-value');
          }
        }
    
        function syncView(commitMeta) {
          if (!projectionMode && !headlessMode) root.classList.add('qxframe9a7c2-select');
          renderValues(commitMeta);
        }
    
        function handleOptionSelect(detail) {
          var payload = Utils.mergeOwn( detail, { select: instance });
          if (detail && detail.selected === false) {
            if (Utils.isFunction(opts.onDeselect)) opts.onDeselect(detail.value, payload);
            if (destroyed) return;
            emitter.emit('deselect', payload);
            if (destroyed) return;
            return;
          }
          if (Utils.isFunction(opts.onSelect)) opts.onSelect(detail.value, payload);
          if (destroyed) return;
          emitter.emit('select', payload);
          if (destroyed) return;
          if (opts.multiple !== true) {
            draftValue = selectedLabel(detail.item, detail.value);
            draftDirty = false;
            searchState.clear({ silent:true, notify:false, source:'selection', reason:'clear-search-on-select' });
            optionList.setSearch('');
            triggerSession.close('select', detail.originalEvent || null);
          } else if (opts.clearSearchOnSelect !== false) {
            searchState.clear({ silent:true, notify:false, source:'selection', reason:'clear-search-on-select' });
            optionList.setSearch('');
          }
        }
    
        function handleOptionChange(value, detail) {
          var cfg = detail || {};
          var proposed = normalizeApiValue(value);
          var changed = writeApiValue(proposed, { silent:true, source:cfg.source || 'selection', reason:cfg.reason || 'change', originalEvent:cfg.originalEvent || null }, true);
          restoreOptionListFromApiValue('controlled-option-change');
          if (opts.multiple !== true && opts.searchable === true) {
            draftValue = '';
            draftDirty = false;
            searchState.clear({ silent:true, notify:false, source:'selection', reason:'clear-search-on-select' });
            optionList.setSearch('');
          }
          renderValues({ silent: !!cfg.silent, source: cfg.source || 'selection', reason: cfg.reason || 'change' });
          if (!changed) return;
          var payload = Utils.mergeOwn(cfg, { value: copyApiValue(proposed), controlled:!!valueState.controlled, select: instance });
          if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(copyApiValue(proposed), payload);
          if (destroyed) return;
          if (!cfg.silent) {
            if (Utils.isFunction(opts.onChange)) opts.onChange(copyApiValue(proposed), payload);
            if (destroyed) return;
            emitter.emit('change', payload);
          }
        }
    
        optionList = OptionList.create({
          ownerPrefix: 'select',
          itemSemanticClasses: function () { return ['qxframe9a7c2-select-item','qxframe9a7c2-select-list-item','qxframe9a7c2-select-option']; },
          itemClassParts: ['item','listItem','option'],
          classes: opts.classes,
          styles: opts.itemStyles,
          container: optionHost,
          scrollAdapter: function (config) { return Scroll.attachViewport(config); },
          items: Array.isArray(opts.items) ? opts.items.slice() : [],
          value: apiValue(),
          multiple: opts.multiple === true,
          maxCount: opts.maxCount,
          searchable: false,
          hideSelectedOptions: opts.hideSelectedOptions === true,
          readOnly: opts.readOnly === true,
          disabled: opts.disabled === true,
          size: opts.size,
          virtual: opts.virtual,
          virtualThreshold: opts.virtualThreshold,
          itemSize: opts.itemSize,
          overscan: opts.overscan,
          height: opts.height,
          maxHeight: opts.maxHeight,
          getKey: optionGetter('getKey'),
          getLabel: optionGetter('getLabel'),
          getValue: optionGetter('getValue'),
          isItemDisabled: opts.isItemDisabled,
          selectionAppearance: opts.selectionAppearance,
          itemRender: Utils.isFunction(opts.itemRender) ? function (item, ctx) { return opts.itemRender(item, Item.createContext(item, Utils.mergeOwn( ctx || {}, { component:instance, controller:instance, searchValue:searchState.query, multiple:opts.multiple === true }))); } : null,
          filterItem: selectFilterItem(),
          sortItems: opts.sortItems,
          loading: opts.loading === true,
          loadingText: opts.loadingText,
          emptyText: opts.emptyText,
          error: opts.error,
          errorText: opts.errorText,
          keyboardFocusOwner: function () { return fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (fieldControl && fieldControl.getInputElement ? fieldControl.getInputElement() : input); },
          onSelect: handleOptionSelect,
          onChange: handleOptionChange,
          onActiveChange: function (detail) {
            var payload = Utils.mergeOwn( detail, { select: instance });
            if (Utils.isFunction(opts.onActiveChange)) opts.onActiveChange(payload);
            if (detail && detail.item && detail.source !== 'pointer' && Utils.isFunction(opts.onActive)) { var location = optionLocation(detail.item); opts.onActive(optionValue(detail.item, location ? location.index : 0), payload); }
            emitter.emit('activeChange', payload);
          },
          onHoverChange: function (detail) {
            if (!detail || !detail.item || !Utils.isFunction(opts.onActive)) return;
            var location = optionLocation(detail.item);
            opts.onActive(optionValue(detail.item, location ? location.index : 0), Utils.mergeOwn( detail, { select:instance }));
          }
        });
    
        scope.add(DOM.listen(panel, 'scroll', function (event) {
          var payload = { originalEvent:event, select:instance };
          if (Utils.isFunction(opts.onPopupScroll)) opts.onPopupScroll(event, payload);
          emitter.emit('popupScroll', payload);
        }, true));
    
        if (opts.multiple !== true && opts.searchable === true) {
          draftValue = '';
          draftDirty = false;
        }
    
        fieldControl = headlessMode ? null : projectionMode ? Control.createProjection({
          document: doc, reference: root, valueTarget: valueTarget, inputTarget: input, formTarget: opts.formTarget, formField: opts.formField, name: opts.name,
          committedValue:opts.multiple===true?selectedValues():selectedValues()[0], onFormFieldChange:function(value){setValue(value,{source:'form-field',reason:'native-change'});}, mode:opts.multiple === true ? 'tags' : (opts.searchable === true ? 'input' : 'value'), tags:opts.multiple === true ? selectionTags.tags() : [], editable:opts.searchable === true, disabled:opts.disabled === true, readOnly:opts.readOnly === true, required:opts.required === true, busy:opts.busy === true || opts.loading === true, busyIndicator:opts.loadingIcon, placeholder:opts.placeholder,
          onInput: function (value, event) {
            if (opts.searchable !== true || userMutationLocked()) return;
            if (!triggerSession.getState().open && !open('input', event)) return;
            if (opts.multiple !== true) {
              setSingleDraft(value, { reason:'input', originalEvent:event });
              renderValues();
              emitSearch({ reason:'input', originalEvent:event });
            } else if (!applyExistingOptionTokens(value, event)) setSearch(value, { reason:'input', originalEvent:event });
          }
        }) : Control.create({
          elements: { root: root, valueHost: valuesNode, input: input, clear: clearButton, toggle: arrow, prefix: prefix, suffix: suffix },
          document:doc,formField:opts.formField,committedValue:opts.multiple===true?selectedValues():selectedValues()[0],onFormFieldChange:function(value){setValue(value,{source:'form-field',reason:'native-change'});},
          mode: opts.multiple === true ? 'tags' : (opts.searchable === true ? 'input' : 'value'),
          tags: opts.multiple === true ? selectionTags.tags() : [],
          creatableTags: opts.multiple === true && opts.creatable === true,
          tokenSeparators: opts.tokenSeparators,
          maxTags: opts.maxCount,
          maxTagLength: opts.maxTagLength,
          normalizeTag: opts.normalizeTag,
          validateTag: opts.validateTag,
          addOnEnter: opts.addOnEnter !== false,
          addOnTab: opts.addOnTab === true,
          addOnBlur: opts.addOnBlur === true,
          maxVisibleTags:opts.maxVisibleTags,
          tagsControlled:true,
          renderTag: renderSelectedTag,
          renderTagOverflow: renderSelectedTagOverflow,
          tagClasses: opts.tagClasses,
          tagStyles: opts.tagStyles,
          tagOverflowClassName: 'qxframe9a7c2-select-tag qxframe9a7c2-select-tag-overflow',
          tagOverflowInteractive: true,
          tagClassName: 'qxframe9a7c2-select-tag',
          tagTextClassName: 'qxframe9a7c2-select-tag-text',
          tagRemoveClassName: 'qxframe9a7c2-select-tag-remove',
          tagRemoveContent: opts.tagRemoveContent,
          size: opts.size,
          variant: opts.variant, focusOutline: opts.focusOutline, classNames: opts.classNames, styles: opts.styles,
          status: opts.status, prefix: opts.prefix, suffix: opts.suffix, required: opts.required === true, name: opts.name, busy: opts.busy === true || opts.loading === true, busyIndicator: opts.loadingIcon, clearContent: opts.clearContent, toggleContent: opts.toggleContent,
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
          beforeTagAdd: function (tag, detail) {
            var existing = findOptionByToken(tag && tag.value);
            if (existing && existing.disabled) {
              var invalidPayload = Utils.mergeOwn( detail || {}, { candidate:String(tag.value), invalidReason:'disabled-option', item:existing.item, select:instance });
              if (Utils.isFunction(opts.onTagInvalid)) opts.onTagInvalid(invalidPayload);
              emitter.emit('tagInvalid', invalidPayload);
              return false;
            }
            return true;
          },
          onTagAdd: function (tag, detail) {
            if (opts.multiple !== true || opts.creatable !== true || userMutationLocked()) return;
            ensureCreatedOption(tag);
            searchState.clear({ silent:true, notify:false, source:'selection', reason:'clear-search-on-select' });
            optionList.setSearch('');
            var nextValues = selectedValues();
            if (nextValues.indexOf(String(tag.value)) < 0) nextValues.push(String(tag.value));
            setValue(nextValues, { reason: detail.reason || 'tag-add', source: detail.source || 'control', originalEvent: detail.originalEvent || null });
            var createdItem = selectedItem(tag.value);
            var selectPayload = Utils.mergeOwn( detail || {}, { value:String(tag.value), item:createdItem, selected:true, select:instance });
            if (Utils.isFunction(opts.onSelect)) opts.onSelect(String(tag.value), selectPayload);
            emitter.emit('select', selectPayload);
          },
          onTagInvalid: function (detail) {
            if (Utils.isFunction(opts.onTagInvalid)) opts.onTagInvalid(Utils.mergeOwn( detail, { select: instance }));
            emitter.emit('tagInvalid', Utils.mergeOwn( detail, { select: instance }));
          },
          onTagRemove: function (tag, detail) {
            return removeSelectedTagValue(tag.value, detail);
          },
          onInput: function (value, event) {
            if (opts.searchable !== true || userMutationLocked()) return;
            if (!triggerSession.getState().open && !open('input', event)) return;
            if (opts.multiple !== true) {
              setSingleDraft(value, { reason: 'input', originalEvent: event });
              renderValues();
              emitSearch({ reason: 'input', originalEvent: event });
            } else if (!applyExistingOptionTokens(value, event)) setSearch(value, { reason: 'input', originalEvent: event });
          },
          onFocus:function(event){if(Utils.isFunction(opts.onFocus))opts.onFocus(event,{select:instance});},
          onBlur:function(event){if(Utils.isFunction(opts.onBlur))opts.onBlur(event,{select:instance});},
          onKeydown: function (event) { if (Utils.isFunction(opts.onInputKeyDown)) opts.onInputKeyDown(event, { select:instance }); return handleHostedTagKeydown(event); },
          onClearRequest: function (event) { clear({ reason: 'clear-button', source: DOM.activationSource(event), originalEvent: event }); }
        });
    
        var callbackFocusRoot = headlessMode ? (triggerTarget || root) : root;
        if ((projectionMode || headlessMode) && callbackFocusRoot) {
          scope.add(DOM.listen(callbackFocusRoot, 'focus', function (event) {
            var previous = event.relatedTarget;
            if (previous && callbackFocusRoot.contains && callbackFocusRoot.contains(previous)) return;
            if (Utils.isFunction(opts.onFocus)) opts.onFocus(event, { select:instance });
          }, true));
          scope.add(DOM.listen(callbackFocusRoot, 'blur', function (event) {
            var next = event.relatedTarget;
            if (next && callbackFocusRoot.contains && callbackFocusRoot.contains(next)) return;
            if (Utils.isFunction(opts.onBlur)) opts.onBlur(event, { select:instance });
          }, true));
          scope.add(DOM.listen(callbackFocusRoot, 'keydown', function (event) {
            var currentInput = fieldControl && fieldControl.getInputElement ? fieldControl.getInputElement() : input;
            if (currentInput && event.target === currentInput && Utils.isFunction(opts.onInputKeyDown)) opts.onInputKeyDown(event, { select:instance });
          }));
        }
    
        function open(reason, originalEvent) {
          if (destroyed || opts.disabled === true) return false;
          return triggerSession.open(reason || 'instance', originalEvent || null);
        }
        function close(reason, originalEvent) {
          if (destroyed) return false;
          return triggerSession.close(reason || 'instance', originalEvent || null);
        }
        function setOpen(value, reason, originalEvent) { return instance.setOpen(value, reason || 'set-open', originalEvent); }
        function emitSearch(meta) {
          var payload = { searchValue: searchState.query, draftValue: draftValue, reason: meta && meta.reason || 'instance', originalEvent: meta && meta.originalEvent || null, select: instance };
          if (Utils.isFunction(opts.onSearch)) opts.onSearch(searchState.query, payload);
          emitter.emit('search', payload);
          return payload;
        }
        function setSearch(value, meta) {
          if (destroyed) return instance;
          if (opts.multiple !== true && opts.searchable === true) {
            // Closed single-search has no draft session by contract. Call open() first when
            // a programmatic query is intended to participate in the picker transaction.
            if (!setSingleDraft(value, meta)) return instance;
          } else { searchState.set(value, { silent:true, notify:false, source:meta && meta.source || 'instance', reason:meta && meta.reason || 'search' }); optionList.setSearch(searchState.query); }
          renderValues();
          emitSearch(meta);
          return instance;
        }
        function setItems(items) {
          if (destroyed) return instance;
          opts.items = Array.isArray(items) ? items.slice() : [];
          optionList.setItems(opts.items);
          renderValues();
          if (triggerSession.getState().open) triggerSession.reposition('items');
          return instance;
        }
        function setValue(value, meta) {
          if (destroyed) return instance;
          var cfg = meta || {};
          var previousValue = apiValue();
          var nextValue = normalizeApiValue(value);
          var changed = writeApiValue(nextValue, { silent:true, source:cfg.source || 'instance', reason:cfg.reason || 'select-set-value', originalEvent:cfg.originalEvent || null }, false);
          var canonical = apiValue();
          optionList.setValue(canonical, { silent:true, source:cfg.source || 'instance', reason:cfg.reason || 'select-set-value' });
          renderValues({ silent:!!cfg.silent, source:cfg.source || 'instance', reason:cfg.reason || 'select-set-value' });
          if (changed) {
            var payload = { value:copyApiValue(canonical), previousValue:copyApiValue(previousValue), source:cfg.source || 'instance', reason:cfg.reason || 'select-set-value', silent:!!cfg.silent, controlled:!!valueState.controlled, select:instance };
            if (Utils.isFunction(opts.onValueChange)) opts.onValueChange(copyApiValue(canonical), payload);
            if (!cfg.silent) {
              if (Utils.isFunction(opts.onChange)) opts.onChange(copyApiValue(canonical), payload);
              if (!destroyed) emitter.emit('change', payload);
            }
          }
          return instance;
        }
        function clear(meta) {
          if (destroyed || userMutationLocked()) return false;
          var changed = optionList.clear(meta || { reason: 'select-clear', source: 'instance' });
          searchState.clear({ silent:true, notify:false, source:meta && meta.source || 'instance', reason:meta && meta.reason || 'clear' });
          draftValue = '';
          draftDirty = false;
          optionList.setSearch('');
          renderValues();
          var payload = { reason: meta && meta.reason || 'clear', select: instance };
          if (Utils.isFunction(opts.onClear)) opts.onClear(payload);
          emitter.emit('clear', payload);
          return changed;
        }
    
    
        var keyboardTarget = headlessMode ? triggerTarget : (fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (input || triggerTarget || root));
        keyboard = keyboardTarget ? KeyboardNavigation.create({
          root: keyboardTarget,
          shouldHandle: function (detail) { return !(detail.originalEvent && detail.originalEvent.defaultPrevented); },
          editableKeys: ['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Backspace','Delete','Enter','Escape','Home','End','PageUp','PageDown'],
          allowEditableKey: function (key, detail) {
            if ((key === 'Home' || key === 'End') && triggerSession.getState().open) return true;
            if (['ArrowLeft','ArrowRight','Backspace','Delete','Home','End'].indexOf(key) >= 0 && KeyboardNavigation.shouldPreserveNativeTextEditing(detail.originalEvent, detail.target)) return false;
            return true;
          },
          handlers: {
            Escape: function (detail) { if (triggerSession.getState().open) return close('escape', detail.originalEvent); return handleHostedTagKeydown(detail.originalEvent); },
            ArrowLeft: function (detail) { return handleHostedTagKeydown(detail.originalEvent); },
            ArrowRight: function (detail) { return handleHostedTagKeydown(detail.originalEvent); },
            Backspace: function (detail) { return handleHostedTagKeydown(detail.originalEvent); },
            Delete: function (detail) { return handleHostedTagKeydown(detail.originalEvent); },
            ArrowDown: function (detail) {
              if (!triggerSession.getState().open) return open('keyboard-down', detail.originalEvent) === true;
              return optionList.handleKeydown(detail.originalEvent);
            },
            ArrowUp: function (detail) {
              if (!triggerSession.getState().open) return open('keyboard-up', detail.originalEvent) === true;
              return optionList.handleKeydown(detail.originalEvent);
            },
            Enter: function (detail) { return triggerSession.getState().open ? optionList.handleKeydown(detail.originalEvent) : open('keyboard-enter', detail.originalEvent); },
            Home: function () { if (!triggerSession.getState().open) return false; optionList.focusFirst(); return true; },
            End: function () { if (!triggerSession.getState().open) return false; optionList.focusLast(); return true; },
            PageUp: function (detail) { return triggerSession.getState().open ? optionList.handleKeydown(detail.originalEvent) : false; },
            PageDown: function (detail) { return triggerSession.getState().open ? optionList.handleKeydown(detail.originalEvent) : false; },
            ' ': function (detail) { return opts.searchable === true ? false : (triggerSession.getState().open ? optionList.handleKeydown(detail.originalEvent) : open('keyboard-space', detail.originalEvent)); }
          }
        }) : null;
        if (keyboard) {
          bindCompositeVirtualFocus();
          scope.add(function () { if (tagNavigation) tagNavigation.destroy(); tagNavigation = null; });
          scope.add(function () { keyboard.destroy(); });
        }
    
        function applyOptions(nextOptions) {
          if (destroyed) return instance;
          var next = nextOptions || {};
                    var proposed = Utils.mergeOwn( opts, next);
          if (proposed.creatable === true && proposed.multiple !== true) throw new TypeError('[QXFRAME9A7C2] Select creatable requires multiple:true.');
          if (proposed.creatable === true && proposed.searchable !== true) throw new TypeError('[QXFRAME9A7C2] Select creatable requires searchable:true so Control owns one editable token input path.');
          if (!Array.isArray(proposed.tokenSeparators) && !Utils.isFunction(proposed.tokenSeparators)) throw new TypeError('[QXFRAME9A7C2] Select tokenSeparators must be an array or tokenizer function.');
          if (proposed.maxCount !== undefined && proposed.maxCount !== null && (!Number.isFinite(Number(proposed.maxCount)) || Number(proposed.maxCount) < 0)) throw new TypeError('[QXFRAME9A7C2] Select maxCount must be a non-negative number.');
          if (proposed.maxVisibleTags !== 'responsive' && proposed.maxVisibleTags !== undefined && proposed.maxVisibleTags !== null && (!Number.isFinite(Number(proposed.maxVisibleTags)) || Number(proposed.maxVisibleTags) < 0)) throw new TypeError('[QXFRAME9A7C2] Select maxVisibleTags must be a non-negative number or \"responsive\".');
          if (proposed.tagTextMaxLength !== undefined && proposed.tagTextMaxLength !== null && (!Number.isFinite(Number(proposed.tagTextMaxLength)) || Number(proposed.tagTextMaxLength) < 0)) throw new TypeError('[QXFRAME9A7C2] Select tagTextMaxLength must be a non-negative number.');
          if (proposed.searchFields !== undefined && proposed.searchFields !== null) {
            var proposedSearchFields = Array.isArray(proposed.searchFields) ? proposed.searchFields : [proposed.searchFields];
            if (!proposedSearchFields.every(function (field) { return typeof field === 'string' && field.trim() !== ''; })) throw new TypeError('[QXFRAME9A7C2] Select searchFields must be a field name or array of field names.');
          }
          if (proposed.popupRender !== null && proposed.popupRender !== undefined && !Utils.isFunction(proposed.popupRender)) throw new TypeError('[QXFRAME9A7C2] Select popupRender must be a function or null.');
          OptionTransaction.rejectImmutable(next, ['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless'], 'Select field binding');
          if (Object.prototype.hasOwnProperty.call(next, 'portalContainer')) {
            var nextPortal = typeof next.portalContainer === 'string' ? DOM.resolveElement(next.portalContainer, doc) : next.portalContainer;
            if (nextPortal !== portalContainer) throw new Error('[QXFRAME9A7C2] Select portalContainer is immutable; destroy and recreate to change it.');
          }
          Utils.copyOwn(opts, next);
          if (hasOwn(next, 'value')) {
            valueState.setControlled(true);
            valueState.syncExternal(opts.value, { silent:true, source:'options', reason:'options-value', preserveDraft:true });
          } else if (hasOwn(next, 'multiple')) {
            valueState.setValue(apiValue(), { silent:true, source:'options', reason:'options-mode-normalize' });
          }
          var listOptions = {
            multiple: opts.multiple === true,
            maxCount: opts.maxCount,
            hideSelectedOptions: opts.hideSelectedOptions === true,
            readOnly: opts.readOnly === true,
            disabled: opts.disabled === true,
            size: opts.size,
            classes: opts.classes,
            styles: opts.itemStyles,
            virtual: opts.virtual,
            virtualThreshold: opts.virtualThreshold,
            itemSize: opts.itemSize,
            overscan: opts.overscan,
            height: opts.height,
            maxHeight: opts.maxHeight,
            getKey: optionGetter('getKey'),
            getLabel: optionGetter('getLabel'),
            getValue: optionGetter('getValue'),
            isItemDisabled: opts.isItemDisabled,
            selectionAppearance: opts.selectionAppearance,
            itemRender: Utils.isFunction(opts.itemRender) ? function (item, ctx) { return opts.itemRender(item, Item.createContext(item, Utils.mergeOwn( ctx || {}, { component:instance, controller:instance, searchValue:searchState.query, multiple:opts.multiple === true }))); } : null,
            filterItem: selectFilterItem(),
            sortItems: opts.sortItems,
            loading: opts.loading === true,
            loadingText: opts.loadingText,
            emptyText: opts.emptyText,
            error: opts.error,
            errorText: opts.errorText
          };
          if (hasOwn(next, 'items')) listOptions.items = Array.isArray(opts.items) ? opts.items.slice() : [];
          if (hasOwn(next, 'value') || hasOwn(next, 'multiple')) listOptions.value = apiValue();
          optionList.updateOptions(listOptions);
          if (hasOwn(next, 'popupRender')) syncPopupProjection();
          restoreOptionListFromApiValue('options-controlled');
          if (opts.multiple !== true && hasOwn(next, 'value')) {
            draftValue = ''; draftDirty = false; searchState.clear({ silent:true, notify:false, source:'options', reason:'value-update' }); optionList.setSearch('');
          }
          if (opts.disabled === true && triggerSession.getState().open) close('disabled');
          syncView();
          if (Object.prototype.hasOwnProperty.call(next, 'open')) setOpen(next.open === true, 'update-options');
          else if (triggerSession.getState().open) triggerSession.reposition('options');
          if (domBinding && domBinding.syncClasses) domBinding.syncClasses(opts.classes);
          return instance;
        }
    
        function getState() {
          var state = optionList.getState();
          var current = apiValue();
          var values = asValues(current, opts.multiple === true);
          return Object.freeze({
            open: !!triggerSession.getState().open,
            value: opts.multiple === true ? values.slice() : values[0],
            values: values.slice(),
            controlled: !!(valueState && valueState.controlled),
            searchValue: searchState.query,
            draftValue: opts.multiple === true ? searchState.query : draftValue,
            draftActive: opts.multiple === true ? !!triggerSession.getState().open : draftActive,
            draftDirty: opts.multiple === true ? searchState.query !== '' : draftDirty,
            activeKey: state.activeKey,
            multiple: opts.multiple === true,
            searchable: opts.searchable === true,
            creatable: opts.creatable === true,
            maxCount: Math.max(0, Number(opts.maxCount) || 0),
            maxVisibleTags: opts.maxVisibleTags === 'responsive' ? 'responsive' : Math.max(0, Number(opts.maxVisibleTags) || 0),
            defaultActiveFirstOption: opts.defaultActiveFirstOption === true,
            responsiveVisibleTags: fieldControl && fieldControl.getState ? fieldControl.getState().responsiveVisibleTags : null,
            disabled: opts.disabled === true,
            readOnly: opts.readOnly === true,
            loading: opts.loading === true,
            popupCustomized: Utils.isFunction(opts.popupRender),
            headless: headlessMode,
            projection: projectionMode,
            destroyed: destroyed
          });
        }
    
        function disposeRuntime(reason) {
          if (destroyed) return false;
          destroyed = true;
          scope.dispose();
          if (optionList) optionList.destroy(reason || 'select-destroy');
          optionList = null;
                    if (searchState) searchState.destroy();
          triggerSession = null;
          if (fieldControl) fieldControl.destroy(reason || 'select-destroy');
          fieldControl = null;
          DOM.removeNode(panel);
          if (domBinding) domBinding.release();
          domBinding = null;
          root = control = valuesNode = input = clearButton = arrow = panel = optionHost = null;
          return true;
        }
    
        var initialFormValue = opts.multiple === true ? selectedValues().slice() : selectedValues()[0];
        if (fieldControl && fieldControl.onFormReset) fieldControl.onFormReset(function () {
          searchState.clear({ silent:true, notify:false, source:'form', reason:'reset' }); draftActive = false; draftDirty = false; optionList.setSearch(''); setValue(initialFormValue, { silent: true, source: 'form', reason: 'reset' }); draftValue = committedSingleDisplay();
        });
    
    
    
        syncPopupProjection();
        syncView();
        instance.bindFocusTarget(fieldControl && fieldControl.getFocusElement ? fieldControl.getFocusElement() : (input || triggerTarget || root));
        instance.setFieldValue(opts.multiple === true ? selectedValues().slice() : selectedValues()[0], { silent:true, force:true });
        if (opts.open === true) open('initial');
        return Object.freeze({
          root:root,input:input,panel:panel,optionHost:optionHost,triggerTarget:triggerTarget,
          getState:getState,setItems:setItems,setValue:setValue,setSearch:setSearch,clear:clear,
          refreshTagOverflow:function(){return !destroyed&&fieldControl&&fieldControl.refreshTagOverflow?fieldControl.refreshTagOverflow():false;},
          getOptionList:function(){return optionList;},getControl:function(){return fieldControl;},
          getTagOverflowPopover:function(){var tags=fieldControl&&fieldControl.getTags?fieldControl.getTags():null;return tags&&tags.getOverflowPopover?tags.getOverflowPopover():null;},
          getTagOverflowScroll:function(){var tags=fieldControl&&fieldControl.getTags?fieldControl.getTags():null;return tags&&tags.getOverflowScroll?tags.getOverflowScroll():null;},
          getTagOverflowReference:function(){var tags=fieldControl&&fieldControl.getTags?fieldControl.getTags():null;return tags&&tags.getOverflowElement?tags.getOverflowElement():null;},
          getRefs:function(){return domBinding?domBinding.refs:null;},applyOptions:applyOptions,dispose:disposeRuntime
        });
      
}


export class Select extends PopupFieldComponent {
 static contract=getContract('Select');
 static immutableOptions=Object.freeze(['target','container','formField','reference','triggerTarget','valueTarget','inputTarget','formTarget','renderControl','headless']);
 static create(source,overrides){return new this(source,overrides).render();}
 static enhance(input,options){return this.create(input,options||{});}
 static createDefaultDOM=createDefaultDOM;
 constructor(source={},overrides){const prepared=prepareOptions(source,overrides);super(prepared.opts);runtimeState.set(this,{fieldInit:prepared.fieldInit,runtime:null});}
 [componentHooks.render](){const record=runtimeState.get(this);if(record.runtime)return record.runtime.root;const runtime=setupSelectRuntime(this,record.fieldInit);record.runtime=runtime;this.own(()=>runtime.dispose('select-destroy'));return runtime.root;}
 [popupFieldHooks.optionsUpdated](next,previous,patch){const record=runtimeState.get(this);if(record.runtime)record.runtime.applyOptions(patch);}
 setItems(items){const r=runtimeState.get(this).runtime;return r?r.setItems(items):this;}
 setValue(value,meta){const r=runtimeState.get(this).runtime;return r?r.setValue(value,meta):this;}
 setSearch(value,meta){const r=runtimeState.get(this).runtime;return r?r.setSearch(value,meta):this;}
 clear(meta){const r=runtimeState.get(this).runtime;return r?r.clear(meta):false;}
 refreshTagOverflow(){const r=runtimeState.get(this).runtime;return r?r.refreshTagOverflow():false;}
 getState(){const r=runtimeState.get(this).runtime;return r?r.getState():Object.freeze({open:false,destroyed:this.destroyed});}
 getOptionList(){const r=runtimeState.get(this).runtime;return r?r.getOptionList():null;}
 getControl(){const r=runtimeState.get(this).runtime;return r?r.getControl():null;}
 getTagOverflowPopover(){const r=runtimeState.get(this).runtime;return r?r.getTagOverflowPopover():null;}
 getTagOverflowScroll(){const r=runtimeState.get(this).runtime;return r?r.getTagOverflowScroll():null;}
 getTagOverflowReference(){const r=runtimeState.get(this).runtime;return r?r.getTagOverflowReference():null;}
 getRootElement(){const r=runtimeState.get(this).runtime;return r?r.root:this.root;}
 getPopupElement(){const r=runtimeState.get(this).runtime;return r?r.panel:super.getPopupElement();}
 getPopupOriginElement(){const r=runtimeState.get(this).runtime;return r?r.optionHost:null;}
 getInputElement(){const r=runtimeState.get(this).runtime;return r?r.input:null;}
 getRefs(){const r=runtimeState.get(this).runtime;return r?r.getRefs():null;}
}
