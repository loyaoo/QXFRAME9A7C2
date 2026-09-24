import { ItemCollection } from './item-collection.js';
import { mergeOptions } from '../core/options.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { TreeQuery } from '../utils/treeQuery.js';

function create(options) {
  var opts = mergeOptions({ selectable: true }, options);
  var sourceItems = Array.isArray(opts.items) ? opts.items.slice() : [];
  var destroyed = false;
  var list = null;
  var api = null;
    
  var itemAccessors=ItemAccessors.create({
    getValue:function(item,index){
      if (typeof opts.getValue === 'function') return opts.getValue(item,index);
      if (item && typeof item === 'object' && item.value !== undefined) return item.value;
      return item;
    },
    getChildren:function(item){return item && Array.isArray(item.items) ? item.items : [];}
  });
  function valueOf(item, index) { return itemAccessors.value(item,index); }
    
  function currentValues() {
    if (!list) {
      var initial = opts.value !== undefined ? opts.value : opts.defaultValue;
      if (opts.multiple === true) return Array.isArray(initial) ? initial.slice() : (initial === undefined || initial === null ? [] : [initial]);
      return initial === undefined || initial === null ? [] : [initial];
    }
    var state = list.getState();
    return Array.isArray(state.values) ? state.values.slice() : (state.value === undefined ? [] : [state.value]);
  }
    
  function visibleItems() {
    if (opts.hideSelectedOptions !== true) return sourceItems.slice();
    var selected = currentValues().map(function (value) { return String(value); });
    return sourceItems.filter(function (item, index) {
      return selected.indexOf(String(valueOf(item, index))) < 0;
    });
  }
    
  function refreshVisibleItems(reason) {
    var previousState = list && list.getState ? list.getState() : {};
    var previousActive = previousState.activeKey;
    var items = visibleItems();
    list.setItems(items, { reason: reason || 'option-list-visible-items' });
    if (previousActive !== null && previousActive !== undefined && previousActive !== '' && list.getState().activeKey === null && items.length) {
      var handoffSource = previousState.focusVisible === true ? 'keyboard' : (previousState.interactionSource === 'pointer' ? 'pointer' : 'api');
      list.prepareOpen({ strategy: 'first', source: handoffSource, reason: (reason || 'option-list-visible-items') + '-active-handoff' });
    }
  }
    
  function listOptions(extra) {
    var local = mergeOptions(opts, extra);
    local.items = visibleItems();
    local.ownerPrefix = opts.ownerPrefix || 'option-list';
    local.selectable = true;
    local.onChange = function (value, detail) {
      if (opts.hideSelectedOptions === true) refreshVisibleItems('option-list-selection-hide');
      if (typeof opts.onChange === 'function') opts.onChange(value, detail);
    };
    return local;
  }
    
  list = ItemCollection.create(listOptions());
  if (list.getRootElement()) list.getRootElement().classList.add('qxframe9a7c2-option-list');
    
  function setItems(items) {
    if (destroyed) return api;
    sourceItems = Array.isArray(items) ? items.slice() : [];
    if (opts.hideSelectedOptions === true) refreshVisibleItems('option-list-items');
    else list.setItems(visibleItems(), { reason: 'option-list-items' });
    return api;
  }
    
  function setValue(value, meta) {
    if (destroyed) return false;
    var changed = list.setValue(value, meta);
    if (opts.hideSelectedOptions === true) refreshVisibleItems('option-list-set-value');
    return changed;
  }
    
  function clear(meta) {
    if (destroyed) return false;
    var changed = list.clear(meta);
    if (opts.hideSelectedOptions === true) refreshVisibleItems('option-list-clear');
    return changed;
  }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    opts = mergeOptions(opts, next);
    if (Object.prototype.hasOwnProperty.call(Object(next), 'items')) sourceItems = Array.isArray(next.items) ? next.items.slice() : [];
    list.updateOptions(listOptions(next));
    return api;
  }
    
  function getOptionByValue(value) {
    var needle=String(value);
    var record=TreeQuery.find(sourceItems,function(entry){return entry.children.length===0&&String(entry.value)===needle;},{accessors:itemAccessors});
    return record ? record.item : null;
  }
    
  function destroy(reason) {
    if (destroyed) return false;
    destroyed = true;
    sourceItems = [];
    if (list) list.destroy(reason || 'option-list-destroy');
    list = null;
    return true;
  }
    
  api = {
    setItems: setItems,
    setValue: setValue,
    clear: clear,
    setSearch: function (value) { return destroyed ? api : (list.setSearch(value), api); },
    prepareOpen: function (config) { return destroyed ? false : list.prepareOpen(config); },
    resetActive: function (meta) { return destroyed ? false : list.resetActive(meta); },
    focusFirst: function () { return destroyed ? false : list.focusFirst(); },
    focusLast: function () { return destroyed ? false : list.focusLast(); },
    focusSelected: function () { return destroyed ? false : list.focusSelected(); },
    focusSearch: function () { return destroyed ? false : list.focusSearch(); },
    focusWrap: function () { return destroyed ? false : list.focusWrap(); },
    setActiveKey: function (key, meta) { return destroyed ? false : list.setActiveKey(key, meta); },
    handleKeydown: function (event) { return destroyed ? false : list.handleKeydown(event); },
    bindVirtualFocus: function (controller) { return destroyed ? null : list.bindVirtualFocus(controller); },
    getVirtualFocusDomain: function () { return destroyed ? null : list.getVirtualFocusDomain(); },
    updateOptions: updateOptions,
    getOptionByValue: getOptionByValue,
    getItems: function () { return sourceItems.slice(); },
    getVisibleItems: function () { return destroyed || !list ? [] : list.getVisibleItems(); },
    getState: function () {
      var state = list ? list.getState() : {};
      return Object.freeze({
        value: state.value,
        values: Array.isArray(state.values) ? state.values.slice() : [],
        activeKey: state.activeKey || null,
        searchValue: state.searchValue || '',
        itemCount: sourceItems.length,
        visibleItemCount: list && list.getVisibleItems ? list.getVisibleItems().length : 0,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true,
        destroyed: destroyed
      });
    },
    getList: function () { return list; },
    getSelection: function () { return list && list.getSelection ? list.getSelection() : null; },
    getSelectionController: function () { return list && list.getSelectionController ? list.getSelectionController() : null; },
    getItemElement: function (key) { return list ? list.getItemElement(key) : null; },
    getRootElement: function () { return list ? list.getRootElement() : null; },
    getRefs: function () { return list && list.getRefs ? list.getRefs() : null; },
    getDOMSource: function () { return list && list.getDOMSource ? list.getDOMSource() : null; },
    getViewportElement: function () { return list ? list.getViewportElement() : null; },
    on: function (name, handler) { return list.on(name, handler); },
    once: function (name, handler) { return list.once(name, handler); },
    destroy: destroy
  };
    
  Object.defineProperty(api, 'destroyed', { enumerable: true, get: function () { return destroyed; } });
  return api;
}
    

export const OptionList = Object.freeze({ create, createDefaultDOM: ItemCollection.createDefaultDOM });
export { create };
