
import { Utils } from '../utils/utils.js';


function valueAt(item, key, fallback) {
  if (item && typeof item === 'object' && item[key] !== undefined) return item[key];
  return fallback;
}
function defaultItemKey(item, index) {
  var value = valueAt(item, 'key', valueAt(item, 'value', valueAt(item, 'id', item)));
  return value === undefined || value === null ? String(index == null ? '' : index) : String(value);
}
function defaultItemValue(item, index) { return valueAt(item, 'value', valueAt(item, 'key', valueAt(item, 'id', item === undefined || item === null ? index : item))); }
function defaultItemLabel(item, index) { return valueAt(item, 'label', valueAt(item, 'title', valueAt(item, 'name', valueAt(item, 'value', valueAt(item, 'key', index))))); }
function defaultItemChildren(item) { var value = item && typeof item === 'object' ? (item.children !== undefined ? item.children : item.items) : null; return Array.isArray(value) ? value : []; }
function defaultItemDisabled(item) { return !!(item && typeof item === 'object' && item.disabled === true); }
function createItemAccessors(options) {
  var opts = options || {};
  var getKey = Utils.isFunction(opts.getKey) ? opts.getKey : defaultItemKey;
  var getValue = Utils.isFunction(opts.getValue) ? opts.getValue : defaultItemValue;
  var getLabel = Utils.isFunction(opts.getLabel) ? opts.getLabel : defaultItemLabel;
  var getChildren = Utils.isFunction(opts.getChildren) ? opts.getChildren : (Utils.isFunction(opts.getItems) ? opts.getItems : defaultItemChildren);
  var getDisabled = Utils.isFunction(opts.isDisabled) ? opts.isDisabled : (Utils.isFunction(opts.isItemDisabled) ? opts.isItemDisabled : defaultItemDisabled);
  function key(item, index) { var value = getKey(item, index); return value === undefined || value === null ? '' : String(value); }
  function value(item, index) { return getValue(item, index); }
  function label(item, index) { var output = getLabel(item, index); return output === undefined || output === null ? '' : output; }
  function children(item, index) { var output = getChildren(item, index); return Array.isArray(output) ? output : []; }
  function disabled(item, index) { return getDisabled(item, index) === true; }
  return Object.freeze({ key:key, value:value, label:label, children:children, disabled:disabled });
}
var ItemAccessors = Object.freeze({
  key: defaultItemKey,
  value: defaultItemValue,
  label: defaultItemLabel,
  children: defaultItemChildren,
  disabled: defaultItemDisabled,
  create: createItemAccessors
});

export { ItemAccessors, createItemAccessors };
