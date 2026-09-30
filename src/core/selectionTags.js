
import { Utils } from '../utils/utils.js';
import { ItemAccessors } from './itemAccessors.js';

function tagForSemanticNode(node, list, fallbackIndex) {
  var key = '';
  if (node && typeof node.getAttribute === 'function') key = node.getAttribute('data-tags-shell-key') || '';
  if (!key && node && typeof node.closest === 'function') {
    var shell = node.closest('[data-tags-shell-key]');
    if (shell) key = shell.getAttribute('data-tags-shell-key') || '';
  }
  if (key) {
    for (var i = 0; i < list.length; i += 1) if (String(list[i].key) === String(key)) return list[i];
  }
  return list[fallbackIndex] || null;
}
function projectHostedSemantic(hostedTags, selectionTags, elements, contexts) {
  if (!hostedTags || typeof hostedTags.getElement !== 'function') return false;
  var list = selectionTags && typeof selectionTags.tags === 'function' ? selectionTags.tags() : (Array.isArray(selectionTags) ? selectionTags : []);
  ['tagShell','tag','tagContent','tagClose'].forEach(function (name) {
    var value = hostedTags.getElement(name);
    elements[name] = Array.isArray(value) ? value : [];
    contexts[name] = elements[name].map(function (node, index) {
      var tag = tagForSemanticNode(node, list, index);
      return { item:tag, state:Object.freeze({ selected:true, disabled:!!(tag && tag.disabled), removable:!!(tag && tag.removable) }) };
    });
  });
  elements.tagOverflow = hostedTags.getElement('overflow');
  return true;
}

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
    if (Utils.isFunction(opts.decorate)) tag = Utils.assignOwn(tag, opts.decorate(tag, value, index) || {});
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

export const SelectionTags = Object.freeze({ create: createSelectionTags, projectHostedSemantic: projectHostedSemantic });
export { createSelectionTags, projectHostedSemantic };
