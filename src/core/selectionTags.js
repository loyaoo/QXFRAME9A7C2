
import { Utils } from '../utils/utils.js';
import { ItemAccessors } from './itemAccessors.js';

function createSelectionTags(options) {
  var opts = options || {};
  function values() { var source = Utils.isFunction(opts.getValues) ? opts.getValues() : opts.values; return Array.isArray(source) ? source : []; }
  function keyOf(value, index) { return String(Utils.isFunction(opts.keyOf) ? opts.keyOf(value, index) : (value instanceof Date ? value.getTime() : ItemAccessors.key(value, index))); }
  function toTag(value, index) {
    var key = keyOf(value, index);
    var tag = {
      key: key,
      value: Utils.isFunction(opts.valueOf) ? opts.valueOf(value, index) : value,
      label: Utils.isFunction(opts.labelOf) ? opts.labelOf(value, index) : String(ItemAccessors.label(value, index)),
      disabled: Utils.isFunction(opts.disabledOf) ? opts.disabledOf(value, index) === true : false,
      removable: !Utils.isFunction(opts.removableOf) || opts.removableOf(value, index) !== false
    };
    if (Utils.isFunction(opts.decorate)) tag = Object.assign(tag, opts.decorate(tag, value, index) || {});
    return Object.freeze(tag);
  }
  function tags() { return values().map(toTag); }
  function remove(key, meta) {
    if (!Utils.isFunction(opts.onRemove)) return false;
    var list = tags(), found = null;
    for (var i = 0; i < list.length; i += 1) if (list[i].key === String(key)) { found = list[i]; break; }
    if (!found || found.disabled || !found.removable) return false;
    return opts.onRemove(found.value, found, meta || {}) !== false;
  }
  return Object.freeze({ values: values, tags: tags, keyOf: keyOf, remove: remove, reconcileKey: function (key) { var list = tags(); if (!list.length) return null; for (var i=0;i<list.length;i+=1) if(list[i].key===String(key)) return list[i].key; return list[list.length-1].key; } });
}

export const SelectionTags = Object.freeze({ create: createSelectionTags });
export { createSelectionTags };
