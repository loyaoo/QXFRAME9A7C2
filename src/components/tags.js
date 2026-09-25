import { ComponentContracts } from '../core/componentContracts.js';
import { componentHooks } from '../core/componentHooks.js';
import { fieldHooks } from '../core/fieldHooks.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { DOM } from '../core/dom.js';
import { URLPolicy } from '../utils/url.js';
import { Utils } from '../utils/utils.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { FocusController } from '../core/focusController.js';
import { TagNavigation } from '../core/tagNavigation.js';
import { ObserverHub } from '../core/observerHub.js';
import { ResponsiveOverflow } from '../core/responsiveOverflow.js';
import { FormBridge } from '../core/formBridge.js';
import { Renderer } from '../core/renderer.js';
import { TokenInput } from '../core/tokenInput.js';
import { CapabilityController } from '../core/capabilityController.js';
import { InteractionController } from '../core/interactionController.js';
import { SelectionController } from '../core/selectionController.js';
import { StateController } from '../core/stateController.js';
import { FieldComponent } from './field.js';
import { Scroll } from './scroll.js';
import { Popover } from './popover.js';

const global = globalThis;

const TAGS_DEFAULTS = Object.freeze({
  items: [], value: [], editable: false, closable: true, checkable: false, multiple: true, variant: 'filled',
  overflow: 'wrap', maxVisible: 0, showOverflowPopover: true, hosted: false, controlled: false, creatable: true,
  formField: null, name: '', overflowTrigger: 'hover', overflowPlacement: 'bottom-start', overflowMaxHeight: 240,
  scrollbarVisibility: 'auto', size: 'md', disabled: false, readOnly: false, required: false,
  inputValue: '', tokenSeparators: [','], tokenizeOnPaste: true, addOnEnter: true, addOnTab: false, addOnBlur: true,
  unique: true, maxCount: 0, maxTagLength: 0, tagRemoveContent: null, classes: null, styles: null
});
const tagsState = new WeakMap();

var SIZES = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl']);
var OVERFLOWS = Object.freeze(['wrap', 'scroll', 'collapse', 'responsive']);
var COLORS = Object.freeze(['default', 'grey', 'gray', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'azure', 'primary', 'white', 'black', 'success', 'processing', 'warning', 'error', 'info']);
var VDOMNTS = Object.freeze(['filled', 'solid', 'outlined']);
var own = Utils.own;
function normalizeSize(value) { return Utils.normalizeEnum(value == null ? 'md' : value, SIZES, undefined, 'Tags size'); }
function normalizeOverflow(value) {
  var mode = String(value == null ? 'wrap' : value).toLowerCase();
  if (OVERFLOWS.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Tags overflow must be one of: ' + OVERFLOWS.join(', ') + '.');
  return mode;
}
function normalizeVariant(value) {
  var variant = String(value == null ? 'filled' : value).toLowerCase();
  if (VDOMNTS.indexOf(variant) < 0) throw new TypeError('[QXFRAME9A7C2] Tags variant must be one of: ' + VDOMNTS.join(', ') + '.');
  return variant;
}
function normalizeMaxVisible(value) {
  if (value == null || value === '') return 0;
  var number = Number(value);
  if (!Number.isInteger(number) || number < 0) throw new TypeError('[QXFRAME9A7C2] Tags maxVisible must be a non-negative integer.');
  return number;
}
function normalizeStringArray(value, label) {
  if (value == null || value === '') return [];
  if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Tags ' + label + ' must be an array.');
  var seen = Object.create(null);
  var result = [];
  value.forEach(function (entry) {
    var item = String(entry);
    if (!item || seen[item]) return;
    seen[item] = true;
    result.push(item);
  });
  return result;
}
function cloneNodeLike(value) {
  return value && typeof value === 'object' && typeof value.nodeType === 'number' && typeof value.cloneNode === 'function' ? value.cloneNode(true) : null;
}
function resolveClasses(value, item, context) {
  if (Utils.isFunction(value)) value = value(item, context || {});
  var output = [];
  function append(entry) {
    if (!entry) return;
    if (typeof entry === 'string') { entry.split(/\s+/).forEach(function (name) { if (name && output.indexOf(name) < 0) output.push(name); }); return; }
    if (Array.isArray(entry)) { entry.forEach(append); return; }
    if (typeof entry === 'object') { Object.keys(entry).forEach(function (name) { if (entry[name]) append(name); }); }
  }
  append(value);
  return output;
}
function applyClasses(node, resolver, item, context) {
  if (!node || !node.classList) return;
  resolveClasses(resolver, item, context).forEach(function (name) { node.classList.add(name); });
}
function applyStyles(node, resolver, item, context) {
  if (!node || !node.style) return;
  var value = Utils.isFunction(resolver) ? resolver(item, context || {}) : resolver;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  Object.keys(value).forEach(function (name) {
    var styleValue = value[name];
    if (styleValue === undefined || styleValue === null || styleValue === false) return;
    var property = String(name).replace(/[A-Z]/g, function (letter) { return '-' + letter.toLowerCase(); });
    node.style.setProperty(property, String(styleValue));
  });
}
function itemCore(item) {
  return {
    key: item.key,
    value: item.value,
    label: item.label,
    removable: item.removable !== false,
    disabled: item.disabled === true
  };
}
function copyPublicItem(item) {
  var output = itemCore(item);
  if (item.color) output.color = item.color;
  if (item.icon !== undefined) output.icon = item.icon;
  if (item.href) output.href = item.href;
  if (item.className) output.className = item.className;
  return Object.freeze(output);
}
function normalizeItems(value) {
  if (!Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Tags items must be an array.');
  var keys = Object.create(null);
  var values = Object.create(null);
  return value.map(function (raw) {
    if (!raw || typeof raw !== 'object') throw new TypeError('[QXFRAME9A7C2] Tags items must contain objects.');
    if (raw.key === undefined || raw.key === null || raw.key === '') throw new TypeError('[QXFRAME9A7C2] Tags item.key is required.');
    if (raw.value === undefined || raw.value === null || raw.value === '') throw new TypeError('[QXFRAME9A7C2] Tags item.value is required.');
    if (raw.label === undefined || raw.label === null) throw new TypeError('[QXFRAME9A7C2] Tags item.label is required.');
    var item = {
      key: String(raw.key),
      value: String(raw.value),
      label: String(raw.label),
      removable: raw.removable !== false,
      disabled: raw.disabled === true,
      color: raw.color == null || raw.color === '' ? '' : String(raw.color).toLowerCase(),
      icon: raw.icon,
      href: raw.href == null || raw.href === '' ? '' : URLPolicy.sanitize(raw.href, 'navigation'),
      className: raw.className == null ? '' : String(raw.className)
    };
    if (keys[item.key]) throw new TypeError('[QXFRAME9A7C2] Tags item.key values must be unique.');
    if (values[item.value]) throw new TypeError('[QXFRAME9A7C2] Tags item.value values must be unique.');
    if (item.color && COLORS.indexOf(item.color) < 0) throw new TypeError('[QXFRAME9A7C2] Tags item.color must be one of: ' + COLORS.join(', ') + '.');
    keys[item.key] = true;
    values[item.value] = true;
    return item;
  });
}
    
function setupTags(instance) {
  var state = tagsState.get(instance);
  if (!state) throw new TypeError('[QXFRAME9A7C2] Invalid Tags instance.');
  var source = state.source;
  var opts = Utils.mergeOwn(instance.options);
  var doc = state.document;
  var view = doc && doc.defaultView || global;
  var formField = state.formField;
  var container = state.container;
  var ownsContainer = false;
  if (!container && formField && formField.parentNode) {
    container = doc.createElement('span');
    formField.parentNode.insertBefore(container, formField);
    ownsContainer = true;
  }
  if (!container || container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Tags requires container or a connected formField.');
  state.container = container;
  opts.container = container;
  opts.formField = formField;
  var normalized = normalizeItems(opts.items || []);
  var scope = Lifecycle.createScope();
  var destroyed = false;
  var root = doc.createElement('div');
  var surface = doc.createElement('div');
  var input = doc.createElement('input');
  var scrollHost = null;
  var containerScroll = null;
  var summary = null;
  var overflowPopover = null;
  var overflowScroll = null;
  var overflowScrollHost = null;
  var overflowList = null;
  var tagRecordsByKey = Object.create(null);
  var overflowRowsByKey = Object.create(null);
  var overflowPopoverConfig = null;
  var addEditorWidth = 0;
  var overflowLayout = null;
  var visibleCount = normalized.length;
  var metadataByKey = Object.create(null);
  var api = instance;
  var syncingItems = false;
  var composing=false;
  var formBridge=null;
  var keyboard=null;
  var focusController=null;
  var interactionController=null;
  var capabilityController=CapabilityController.create({ getState:function(){ return opts; } });
  var standaloneTagDomain=null;
  var standaloneTagNavigation=null;
  var editorProjectionMutation=false;
  var ADD_VIRTUAL_KEY='__qxframe9a7c2_tags_add__';
  scope.add(function(){ if(capabilityController) capabilityController.destroy(); capabilityController=null; });
    
  root.className='qxframe9a7c2-tags'+(opts.hosted===true?' is-hosted':'');
  surface.className = 'qxframe9a7c2-tags-surface';
  input.className='qxframe9a7c2-tags-input';
  var addTrigger=doc.createElement('button');addTrigger.type='button';addTrigger.className='qxframe9a7c2-tags-add';addTrigger.textContent=String(opts.addLabel||'+ Add Tag');
  var adding=opts.hosted===true&&opts.editable===true;
  input.type = 'text';
  addTrigger.tabIndex = -1;
  container.appendChild(root);
    
  function itemExtras(item) {
    return {
      color: item.color || '',
      icon: item.icon,
      href: item.href || '',
      className: item.className || ''
    };
  }
  function rebuildMetadata(items) {
    metadataByKey = Object.create(null);
    items.forEach(function (item) {
      metadataByKey[item.key] = itemExtras(item);
    });
  }
  rebuildMetadata(normalized);
    
  function coreTags() {
    return tokenInput.getState().tags;
  }
  function publicItems() {
    return coreTags().map(function (tag) {
      return copyPublicItem(Utils.mergeOwn(tag, metadataByKey[tag.key]));
    });
  }
  function itemByValue(value) {
    var key = String(value);
    var tags = coreTags();
    for (var index = 0; index < tags.length; index += 1) {
      if (tags[index].value === key) return Utils.mergeOwn(metadataByKey[tags[index].key], tags[index]);
    }
    return null;
  }
  function itemIndexByValue(value) {
    var key = String(value);
    var tags = coreTags();
    for (var index = 0; index < tags.length; index += 1) if (tags[index].value === key) return index;
    return -1;
  }
  function mutationLocked(meta) {
    return !!(meta && meta.user === true && (!capabilityController || !capabilityController.can('edit')));
  }
  function itemUserRemovable(item) {
    return !!item && opts.closable !== false && item.removable !== false && item.disabled !== true && !!capabilityController && capabilityController.can('remove');
  }
    
  function emitItemsChange(detail){
    syncFormBridge(detail);
    var items=publicItems();
    var payload = Utils.assignOwn({ items: items.slice(), reason: 'items', source: 'api', instance: api }, detail || {});
    if (payload.silent !== true && Utils.isFunction(opts.onItemsChange)) opts.onItemsChange(items.slice(), payload);
    if (payload.silent !== true && !destroyed) api.emit('itemsChange', payload);
  }
  function emitSelection(values,detail){
    syncFormBridge(detail);
    var payload = Utils.assignOwn({ value: values.slice(), reason: 'selection', source: 'api', valueControlled:!!(selectionValueState && selectionValueState.controlled), instance: api }, detail || {});
    if (payload.silent !== true && Utils.isFunction(opts.onChange)) opts.onChange(values.slice(), payload);
    if (payload.silent !== true && !destroyed) api.emit('change', payload);
  }
  function normalizeSelectionValue(value) {
    var values = normalizeStringArray(value, 'value');
    return opts.multiple === false ? values.slice(0, 1) : values;
  }
  var selectionValueState = StateController.createOptionValueBinding(opts, source, normalizeSelectionValue, { controlled:opts.controlled === true });
  scope.add(function () { if (selectionValueState) selectionValueState.destroy(); selectionValueState = null; });
  function selectionValue() { return selectionValueState ? selectionValueState.value : normalizeSelectionValue([]); }
  function syncSelectionProjection(reason) {
    if (!selection || !selectionValueState) return false;
    selection.set(selectionValue(), { silent:true, source:selectionValueState.controlled ? 'controlled' : 'state', reason:reason || 'value-sync' });
    return true;
  }
    
  var selectionController = SelectionController.create({
    channels: {
      selected: {
        multiple: opts.multiple !== false,
        values: selectionValue(),
        onChange: function (values, detail) {
          if (!syncingItems) render('selection');
          emitSelection(values, detail);
        }
      }
    }
  });
  var selection = selectionController.selected;
  scope.add(function () { if (selectionController) selectionController.destroy(); selectionController = null; selection = null; });
    
  function pruneSelection(meta) {
    var allowed = Object.create(null);
    coreTags().forEach(function (tag) { allowed[tag.value] = true; });
    var next = selection.values.filter(function (value) { return !!allowed[value]; });
    if (next.length === selection.values.length) return;
    var detail = Utils.assignOwn({ reason: 'items-prune', source: 'items' }, meta || {});
    selection.set(next, detail);
    if (selectionValueState && !selectionValueState.controlled) selectionValueState.write(selection.values, { silent:true, source:detail.source, reason:detail.reason }, false);
  }
    
  var tokenInput = TokenInput.create({
    tags: normalized.map(itemCore),
    inputValue: opts.inputValue,
    creatable: opts.creatable !== false,
    unique: opts.unique !== false,
    tokenSeparators: opts.tokenSeparators,
    tokenizeOnPaste: opts.tokenizeOnPaste !== false,
    addOnEnter: opts.addOnEnter !== false,
    addOnTab: opts.addOnTab === true,
    addOnBlur: opts.addOnBlur === true,
    maxTags: opts.maxCount,
    maxTagLength: opts.maxTagLength,
    disabled: opts.disabled === true,
    readOnly: opts.readOnly === true,
    normalizeTag: opts.normalizeTag,
    validateTag: opts.validateTag,
    beforeTagAdd:function(tag,detail){var item=copyPublicItem(tag);if(Utils.isFunction(opts.beforeAdd)&&opts.beforeAdd(item,Utils.mergeOwn(detail,{instance:api}))===false)return false;if(opts.controlled===true){if(detail&&detail.originalEvent&&detail.originalEvent.preventDefault)detail.originalEvent.preventDefault();var proposed=publicItems().concat([item]);if(Utils.isFunction(opts.onAddRequest))opts.onAddRequest(item,Utils.mergeOwn(detail,{items:proposed,tags:proposed,instance:api}));return TokenInput.REQUEST_HANDLED;}},
    beforeTagEdit:function(tag,detail){var current=Utils.mergeOwn(tag,metadataByKey[tag.key]);if(Utils.isFunction(opts.beforeEdit))return opts.beforeEdit(copyPublicItem(current),Utils.mergeOwn(detail,{instance:api}))!==false;},
    beforeTagRemove:function(tag,detail){var current=Utils.mergeOwn(tag,metadataByKey[tag.key]||{}),item=copyPublicItem(current);if(detail&&detail.user===true&&!itemUserRemovable(current))return false;if(Utils.isFunction(opts.beforeRemove)&&opts.beforeRemove(item,Utils.mergeOwn(detail,{instance:api}))===false)return false;if(opts.controlled===true){var proposed=publicItems().filter(function(entry){return entry.key!==item.key;});if(Utils.isFunction(opts.onRemoveRequest))opts.onRemoveRequest(item,Utils.mergeOwn(detail,{items:proposed,tags:proposed,instance:api}));return TokenInput.REQUEST_HANDLED;}},
    onTagAdd: function (tag, detail) {
      var item = Utils.assignOwn({ color: '', icon: undefined, href: '', className: '' }, tag);
      metadataByKey[tag.key] = itemExtras(item);
      if (Utils.isFunction(opts.onAdd)) opts.onAdd(copyPublicItem(item), Utils.mergeOwn( detail, { instance: api }));
    },
    onTagEdit:function(tag,detail){var item=Utils.mergeOwn(tag,metadataByKey[tag.key]);if(Utils.isFunction(opts.onEdit))opts.onEdit(copyPublicItem(item),Utils.mergeOwn(detail,{instance:api}));},
    onTagRemove: function (tag, detail) {
      var item = Utils.mergeOwn(tag, metadataByKey[tag.key]);
      delete metadataByKey[tag.key];
      if (Utils.isFunction(opts.onRemove)) opts.onRemove(copyPublicItem(item), Utils.mergeOwn( detail, { instance: api }));
      if (destroyed) return;
      if (Utils.isFunction(opts.onClose)) opts.onClose(copyPublicItem(item), Utils.mergeOwn( detail, { instance: api }));
    },
    onTagsChange: function (_tags, detail) {
      if (selectionController) selectionController.advanceDataRevision('selected');
      syncingItems = true;
      pruneSelection({ silent: detail && detail.silent, reason: 'items-prune', source: detail && detail.source || 'items' });
      syncingItems = false;
      render('items');
      emitItemsChange(detail);
    },
    onInputChange: function (value, detail) {
      opts.inputValue = value;
      if (input.value !== value) input.value = value;
      var payload = Utils.mergeOwn( detail, { instance: api });
      if (Utils.isFunction(opts.onInput)) opts.onInput(value, payload);
      if (destroyed) return;
      if (Utils.isFunction(opts.onSearch)) opts.onSearch(value, payload);
      if (!destroyed) api.emit('input', Utils.assignOwn({ value: value }, payload));
    },
    onTagInvalid: function (detail) {
      if (Utils.isFunction(opts.onInvalid)) opts.onInvalid(Utils.mergeOwn( detail, { instance: api }));
    }
  });
  scope.add(function () { tokenInput.destroy(); });

  function tokenValues(tags) {
    return (Array.isArray(tags) ? tags : []).map(function(tag){ return String(tag.value); });
  }
  function bindCanonicalValueController() {
    if (opts.checkable === true) {
      var controller = selectionValueState.getValueController();
      api.bindValueController(controller, { owned:false, syncExternal:false });
      return controller;
    }
    var controller = tokenInput.getValueController();
    api.bindValueController(controller, { owned:false, syncExternal:false, projectValue:tokenValues });
    return controller;
  }
  bindCanonicalValueController();
    
  function destroyTagRecord(record) {
    if (!record) return;
    if (record.closeDispose) { record.closeDispose(); record.closeDispose = null; }
    if (record.scope) record.scope.dispose();
    if (record.shell && record.shell.parentNode) record.shell.parentNode.removeChild(record.shell);
  }
  function destroyTagRecords() {
    Object.keys(tagRecordsByKey).forEach(function (key) { destroyTagRecord(tagRecordsByKey[key]); });
    tagRecordsByKey = Object.create(null);
  }
  function destroyOverflowRow(record) {
    if (!record) return;
    if (record.closeDispose) { record.closeDispose(); record.closeDispose = null; }
    if (record.scope) record.scope.dispose();
    if (record.row && record.row.parentNode) record.row.parentNode.removeChild(record.row);
  }
  function destroyOverflowRows() {
    Object.keys(overflowRowsByKey).forEach(function (key) { destroyOverflowRow(overflowRowsByKey[key]); });
    overflowRowsByKey = Object.create(null);
  }
  function destroyOverflowPopup(reason) {
    destroyOverflowRows();
    if (overflowScroll) overflowScroll.destroy();
    overflowScroll = null;
    overflowScrollHost = null;
    overflowList = null;
    if (overflowPopover) overflowPopover.destroy(reason || 'tags-overflow-destroy');
    overflowPopover = null;
    overflowPopoverConfig = null;
  }
  function destroyOverflow() {
    var previousSummary = summary;
    destroyOverflowPopup('tags-overflow-render');
    summary = null;
    if (previousSummary && previousSummary.parentNode) previousSummary.parentNode.removeChild(previousSummary);
  }
  function destroyContainerScroll() {
    var previousHost = scrollHost;
    if (containerScroll) containerScroll.destroy();
    containerScroll = null;
    scrollHost = null;
    if (previousHost && surface.parentNode === previousHost) previousHost.removeChild(surface);
    if (previousHost && previousHost.parentNode) previousHost.parentNode.removeChild(previousHost);
  }
    
  function setSizeClasses() {
    SIZES.forEach(function (size) { root.classList.remove('is-' + size); surface.classList.remove('is-' + size); });
    root.classList.add('is-' + opts.size);
    surface.classList.add('is-' + opts.size);
  }
  function applyRootState() {
    root.classList.toggle('is-hosted',opts.hosted===true);
    if (focusController) {
      focusController.setDisabled(opts.disabled === true);
      focusController.setHosted(opts.hosted === true || adding === true);
      if (adding !== true && focusController.getState().editLeaseActive) focusController.endEdit({ restore:false, reason:'tags-edit-release' });
    } else root.tabIndex = opts.hosted === true || opts.disabled === true || adding === true ? -1 : 0;
    input.tabIndex = opts.hosted === true || adding === true ? 0 : -1;
    // Standalone Tags uses one real focus owner (root). + Add participates only in
    // the virtual tag cursor and must never add another Tab stop.
    addTrigger.tabIndex = -1;
    root.classList.toggle('is-adding',adding===true);
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    root.classList.toggle('is-checkable', opts.checkable === true);
    root.classList.toggle('is-editable', opts.editable === true);
    root.classList.toggle('is-overflow-scroll', opts.overflow === 'scroll');
    root.classList.toggle('is-overflow-collapse', opts.overflow === 'collapse');
    root.classList.toggle('is-overflow-responsive', opts.overflow === 'responsive');
    VDOMNTS.forEach(function (variant) { root.classList.toggle('is-variant-' + variant, opts.variant === variant); });
    root.classList.toggle('is-single-check', opts.checkable === true && opts.multiple === false);
    setSizeClasses();
  }
    
  function focusWithoutScroll(element) {
    if (!element || !Utils.isFunction(element.focus)) return;
    DOM.focusElement(element);
  }
  function tagHostElement(tag) {
    if (!tag) return null;
    var parent = tag.parentNode;
    return parent && parent.classList && parent.classList.contains('qxframe9a7c2-tag-shell') ? parent : tag;
  }
  function navigableTagElements() {
    if (opts.disabled === true) return [];
    return publicItems().map(function (item) {
      var record = tagRecordsByKey[item.key];
      return item.disabled === true ? null : record && record.tag;
    }).filter(function (tag) {
      var host = tagHostElement(tag);
      return !!tag && !!host && host.hidden !== true;
    });
  }
  function syncTagTabStops(activeKey) {
    var key = activeKey == null ? '' : String(activeKey);
    if (!key && keyboard) {
      var state = keyboard.virtualFocus.getState();
      if (state.domain === 'tags' && state.key) key = String(state.key);
    }
    Object.keys(tagRecordsByKey).forEach(function (recordKey) {
      var record = tagRecordsByKey[recordKey];
      if (!record) return;
      if (record.tag) record.tag.tabIndex = -1;
      if (record.shell) record.shell.tabIndex = -1;
      if (record.close) record.close.tabIndex = -1;
      if (record.link) record.link.tabIndex = -1;
    });
  }
  function activeInside(node) {
    var active = doc.activeElement;
    return !!node && !!active && (active === node || (node.contains && node.contains(active)));
  }
  function currentEditorElement() {
    if (opts.editable !== true) return null;
    return opts.hosted === true || adding ? input : addTrigger;
  }
  function removeTagRecordWithFocus(record, meta) {
    if (!record || !record.item) return false;
    var hadFocus = activeInside(record.tag);
    var before = hadFocus ? virtualTagEntries() : [];
    var index = before.findIndex(function (entry) { return entry.key === record.key; });
    if (hadFocus && opts.hosted === true && doc.activeElement && doc.activeElement.blur) doc.activeElement.blur();
    var result = remove(record.item.value, meta);
    if (opts.hosted === true || !hadFocus || tagRecordsByKey[record.key]) return result;
    var after = virtualTagEntries();
    focusWithoutScroll(root);
    var target = after.length ? after[Math.min(Math.max(index, 0), after.length - 1)] : null;
    if (target) activateStandaloneTag(target.key, 'tag-remove-focus-reconcile', meta && meta.originalEvent || null);
    else syncTagTabStops('');
    return result;
  }
  function focusOverflowAfterRemoval(index) {
    if (overflowPopover && overflowPopover.getState().open && overflowList) {
      var rows = Array.prototype.slice.call(overflowList.children || []);
      if (rows.length) {
        var start = Math.min(Math.max(index, 0), rows.length - 1);
        for (var offset = 0; offset < rows.length; offset += 1) {
          var forward = rows[start + offset];
          var backward = rows[start - offset];
          var close = forward && forward.querySelector && forward.querySelector('.qxframe9a7c2-overflow-close');
          if (!close && backward && backward !== forward && backward.querySelector) close = backward.querySelector('.qxframe9a7c2-overflow-close');
          if (close) { focusWithoutScroll(close); return close; }
        }
      }
    }
    var tags = navigableTagElements();
    var fallback = tags.length ? tags[tags.length - 1] : currentEditorElement();
    if (fallback && fallback.isConnected !== false) focusWithoutScroll(fallback);
    return fallback || null;
  }
    
  function virtualAddAvailable() { return opts.hosted !== true && opts.editable === true && adding !== true && !!capabilityController && capabilityController.can('edit') && !!addTrigger.parentNode; }
  function virtualTagEntries() {
    var entries = publicItems().map(function (item) {
      var record = tagRecordsByKey[item.key];
      var host = record && tagHostElement(record.tag);
      return item.disabled === true || !record || !record.tag || !host || host.hidden === true ? null : { key:item.key, value:item.value, item:item, element:host, add:false };
    }).filter(Boolean);
    if (virtualAddAvailable()) entries.push({ key:ADD_VIRTUAL_KEY, value:null, item:null, element:addTrigger, add:true });
    return entries;
  }
  function getVirtualTagElement(key) {
    if (String(key || '') === ADD_VIRTUAL_KEY) return virtualAddAvailable() ? addTrigger : null;
    var record = tagRecordsByKey[String(key || '')];
    var host = record && tagHostElement(record.tag);
    return record && record.tag && host && host.hidden !== true ? host : null;
  }
  function moveVirtualTag(currentKey, delta) {
    var entries = virtualTagEntries();
    if (!entries.length) return null;
    var direction = Number(delta) < 0 ? -1 : 1;
    if (currentKey === undefined || currentKey === null || currentKey === '') return direction < 0 ? entries[entries.length - 1].key : null;
    var index = entries.findIndex(function (entry) { return entry.key === String(currentKey); });
    if (index < 0) return direction < 0 ? entries[entries.length - 1].key : null;
    var next = index + direction;
    if (next < 0) return entries[0].key;
    if (next >= entries.length) return null;
    return entries[next].key;
  }
  function moveVirtualTagSpatial(currentKey, direction) {
    var entries = virtualTagEntries();
    if (!entries.length) return null;
    var current = entries.find(function (entry) { return entry.key === String(currentKey || ''); });
    if (!current) return direction < 0 ? entries[entries.length - 1].key : entries[0].key;
    var currentRect = current.element.getBoundingClientRect ? current.element.getBoundingClientRect() : null;
    if (!currentRect) return moveVirtualTag(currentKey, direction);
    var currentX = currentRect.left + currentRect.width / 2;
    var currentY = currentRect.top + currentRect.height / 2;
    var candidates = entries.filter(function (entry) {
      if (entry === current || !entry.element.getBoundingClientRect) return false;
      var rect = entry.element.getBoundingClientRect();
      var centerY = rect.top + rect.height / 2;
      return direction < 0 ? centerY < currentY - 1 : centerY > currentY + 1;
    }).map(function (entry) {
      var rect = entry.element.getBoundingClientRect();
      return {
        entry: entry,
        dy: Math.abs((rect.top + rect.height / 2) - currentY),
        dx: Math.abs((rect.left + rect.width / 2) - currentX)
      };
    }).sort(function (left, right) { return left.dy - right.dy || left.dx - right.dx; });
    return candidates.length ? candidates[0].entry.key : null;
  }
  function preferredVirtualTagKey() {
    var entries = virtualTagEntries();
    if (!entries.length) return null;
    for (var i = 0; i < entries.length; i += 1) {
      if (entries[i].item && selection.has(entries[i].item.value)) return entries[i].key;
    }
    return entries[0].key;
  }
  function reconcileVirtualTagKey(key) {
    var entries = virtualTagEntries();
    if (!entries.length) return null;
    var needle = String(key || '');
    if (entries.some(function (entry) { return entry.key === needle; })) return needle;
    // Preserve the historical tag fallback when a tag disappears/gets collapsed.
    // + Add is a navigation endpoint, not the default reconciliation target.
    for (var index = entries.length - 1; index >= 0; index -= 1) if (!entries[index].add) return entries[index].key;
    return entries[entries.length - 1].key;
  }
  function ensureVirtualTagVisible(key) {
    var element = getVirtualTagElement(key);
    if (!element) return false;
    if (containerScroll && containerScroll.getViewportElement) {
      var viewport = containerScroll.getViewportElement();
      return viewport ? ScrollVisibility.ensureVisible(viewport, element, { axis:'x', align:'nearest' }) : false;
    }
    return true;
  }
  function removeVirtualTag(key, meta) {
    if (String(key || '') === ADD_VIRTUAL_KEY) return false;
    var record = tagRecordsByKey[String(key || '')];
    if (!record || !record.item || !itemUserRemovable(record.item)) return false;
    return remove(record.item.value, meta || { user:true, source:'keyboard', reason:'virtual-tag-remove' });
  }
    
  function renderParts(output) {
    var parts = [];
    var valid = true;
    function collect(value) {
      if (!valid || value == null || value === false) return;
      if (Array.isArray(value)) { value.forEach(collect); return; }
      if (Renderer.isNodeLike(value)) {
        // Renderer.append() consumes DocumentFragment children. A reusable fragment
        // therefore has no stable post-render identity to reconcile; preserve the
        // canonical Renderer fallback for that case.
        if (value.nodeType === 11) { valid = false; return; }
        parts.push({ node: value });
        return;
      }
      parts.push({ text: String(value) });
    }
    collect(output);
    return valid ? parts : null;
  }
  function renderNodeContent(target, output) {
    var parts = renderParts(output);
    if (!parts) return Renderer.replace(target, output, doc);
    var cursor = target.firstChild;
    parts.forEach(function (part) {
      if (part.node) {
        if (part.node !== cursor) target.insertBefore(part.node, cursor);
        cursor = part.node.nextSibling;
        return;
      }
      if (cursor && cursor.nodeType === 3) {
        if (cursor.nodeValue !== part.text) cursor.nodeValue = part.text;
        cursor = cursor.nextSibling;
        return;
      }
      var textNode = doc.createTextNode(part.text);
      target.insertBefore(textNode, cursor);
      cursor = textNode.nextSibling;
    });
    while (cursor) {
      var next = cursor.nextSibling;
      target.removeChild(cursor);
      cursor = next;
    }
    return target;
  }
  function appendMeasurementContent(target, output) {
    if (output == null || output === false) return target;
    if (Array.isArray(output)) { output.forEach(function (part) { appendMeasurementContent(target, part); }); return target; }
    if (Renderer.isNodeLike(output)) {
      if (typeof output.cloneNode === 'function') target.appendChild(output.cloneNode(true));
      else if (output.textContent != null) target.appendChild(doc.createTextNode(String(output.textContent)));
      return target;
    }
    target.appendChild(doc.createTextNode(String(output)));
    return target;
  }
  function reconcileChildOrder(parent, nodes) {
    if (!parent) return parent;
    var cursor = parent.firstChild;
    nodes.forEach(function (node) {
      if (!node) return;
      if (node !== cursor) parent.insertBefore(node, cursor);
      cursor = node.nextSibling;
    });
    return parent;
  }
  function syncRecordIcon(record, value) {
    var present = value !== undefined && value !== null && value !== '';
    if (!present) {
      if (record.icon && record.icon.parentNode) record.icon.parentNode.removeChild(record.icon);
      record.icon = null;
      record.iconSource = undefined;
      return null;
    }
    if (record.icon && record.iconSource === value) return record.icon;
    if (record.icon && record.icon.parentNode) record.icon.parentNode.removeChild(record.icon);
    record.icon = cloneNodeLike(value);
    if (!record.icon) {
      record.icon = doc.createElement('span');
      record.icon.textContent = String(value);
    }
    record.icon.classList.add('qxframe9a7c2-tag-icon');
    record.iconSource = value;
    return record.icon;
  }
  function syncCloseContent(close, publicItem, projection) {
    var configured = opts.tagRemoveContent;
    var output = Utils.isFunction(configured) ? configured(publicItem, projection || {}) : configured;
    if (output === undefined || output === null || output === false) {
      if (close.__qxframe9a7c2DefaultClose === true && close.childNodes.length === 1) return close;
      close.textContent = '';
      var closeGlyph = doc.createElement('span');
      closeGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3';
      close.appendChild(closeGlyph);
      close.__qxframe9a7c2DefaultClose = true;
      return close;
    }
    renderNodeContent(close, output);
    close.__qxframe9a7c2DefaultClose = false;
    return close;
  }
  function createCloseButton(publicItem, projection, overflow) {
    var close = doc.createElement('button');
    close.type = 'button';
    close.tabIndex = -1;
    close.className=(overflow?'qxframe9a7c2-tag-close qxframe9a7c2-overflow-close':'qxframe9a7c2-tag-close')+(opts.tagRemoveClassName?' '+String(opts.tagRemoveClassName):'');
    syncCloseContent(close, publicItem, Utils.mergeOwn( projection || {}, { overflow: overflow === true }));
    if (!overflow) {
      applyClasses(close, opts.classes && opts.classes.close, publicItem, projection);
      applyStyles(close, opts.styles && opts.styles.close, publicItem, projection);
    }
    return close;
  }
  function createTagRecord(item, index, projectionItems) {
    var record = {
      key: item.key,
      item: item,
      index: index,
      shell: doc.createElement('span'),
      tag: doc.createElement('span'),
      content: doc.createElement('span'),
      link: null,
      icon: null,
      iconSource: undefined,
      close: null,
      closeDispose: null,
      scope: Lifecycle.createScope()
    };
    record.shell.className = 'qxframe9a7c2-tag-shell';
    record.tag.className = 'qxframe9a7c2-tag';
    record.content.className = 'qxframe9a7c2-tag-label qxframe9a7c2-tag-content';
    record.shell.appendChild(record.tag);
    record.scope.add(DOM.listen(record.tag, 'pointerdown', function (event) {
      if (opts.hosted === true || opts.disabled === true) return;
      if (event.preventDefault) event.preventDefault();
      focusWithoutScroll(root);
      if (standaloneTagDomain && record.item) standaloneTagDomain.activate(record.item.key, { source:'pointer', reason:'tag-pointerdown', originalEvent:event, ensureVisible:false });
    }));
    record.scope.add(DOM.listen(record.tag, 'click', function (event) {
      var current = record.item;
      if (!current) return;
      if (opts.hosted !== true && standaloneTagDomain) {
        focusWithoutScroll(root);
        standaloneTagDomain.activate(current.key, { source:'pointer', reason:'tag-pointer', originalEvent:event, ensureVisible:false });
      }
      if (opts.checkable !== true) return;
      toggle(current.value, undefined, { user: true, source: DOM.activationSource(event), reason: 'toggle', originalEvent: event });
    }));
    patchTagRecord(record, item, index, projectionItems);
    return record;
  }
  function syncTagClose(record, publicItem, projection) {
    var removable = itemUserRemovable(record.item);
    record.shell.classList.toggle('has-close', removable);
    record.tag.classList.toggle('has-close', removable);
    if (!removable) {
      if (record.closeDispose) { record.closeDispose(); record.closeDispose = null; }
      if (record.close && record.close.parentNode) record.close.parentNode.removeChild(record.close);
      record.close = null;
      return;
    }
    if (!record.close) {
      record.close = createCloseButton(publicItem, projection, false);
      record.scope.add(DOM.listen(record.close, 'pointerdown', function (event) {
        if (opts.hosted === true || opts.disabled === true) return;
        if (event.preventDefault) event.preventDefault();
        focusWithoutScroll(root);
        if (standaloneTagDomain && record.item) standaloneTagDomain.activate(record.item.key, { source:'pointer', reason:'tag-close-pointerdown', originalEvent:event, ensureVisible:false });
      }));
      record.closeDispose = DOM.listen(record.close, 'click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var current = record.item;
        if (current) removeTagRecordWithFocus(record, { user: true, source: DOM.activationSource(event), reason: 'close', originalEvent: event });
      });
    } else {
      record.close.className='qxframe9a7c2-tag-close'+(opts.tagRemoveClassName?' '+String(opts.tagRemoveClassName):'');
      syncCloseContent(record.close, publicItem, projection);
      record.close.removeAttribute('style');
      applyClasses(record.close, opts.classes && opts.classes.close, publicItem, projection);
      applyStyles(record.close, opts.styles && opts.styles.close, publicItem, projection);
    }
    if (record.close.parentNode !== record.tag) record.tag.appendChild(record.close);
  }
  function syncTagLink(record) {
    var item = record.item;
    if (!item.href) {
      if (record.link) {
        if (record.icon) record.tag.insertBefore(record.icon, record.link);
        record.tag.insertBefore(record.content, record.link);
        record.link.remove();
        record.link = null;
      }
      return record.tag;
    }
    if (!record.link) {
      record.link = doc.createElement('a');
      record.link.className = 'qxframe9a7c2-tag-link';
    }
    if (item.disabled === true || opts.disabled === true) {
      record.link.removeAttribute('href');
    } else {
      record.link.setAttribute('href', item.href);
    }
    record.link.tabIndex = -1;
    if (record.link.parentNode !== record.tag) record.tag.insertBefore(record.link, record.close || null);
    return record.link;
  }
  function patchTagRecord(record, item, index, projectionItems) {
    record.item = item;
    record.index = index;
    var publicItem = copyPublicItem(item);
    var projection = Object.freeze({
      index:index, key:item.key, value:item.value, label:item.label,
      selected:selection.has(item.value), disabled:item.disabled === true || opts.disabled === true,
      readOnly:opts.readOnly === true, removable:itemUserRemovable(item), items:projectionItems || Object.freeze(publicItems()), instance:api
    });
    
    record.shell.className = 'qxframe9a7c2-tag-shell';
    record.shell.removeAttribute('style');
    record.shell.setAttribute('data-tags-shell-value', item.value);
    record.shell.setAttribute('data-tags-shell-key', item.key);
    applyClasses(record.shell, opts.classes && opts.classes.shell, publicItem, projection);
    applyStyles(record.shell, opts.styles && opts.styles.shell, publicItem, projection);
    
    record.tag.className='qxframe9a7c2-tag'+(opts.tagClassName?' '+String(opts.tagClassName):'');
    record.tag.removeAttribute('style');
    if (item.color) record.tag.classList.add('is-colored', 'is-' + item.color);
    if (item.disabled) record.tag.classList.add('is-disabled');
    if (selection.has(item.value)) record.tag.classList.add('is-checked', 'is-selected');
    if (item.className) String(item.className).split(/\s+/).filter(Boolean).forEach(function (name) { record.tag.classList.add(name); });
    record.tag.setAttribute('data-tags-value', item.value);
    record.tag.setAttribute('data-tags-key', item.key);
    record.tag.tabIndex = -1;
    applyClasses(record.tag, opts.classes && opts.classes.tag, publicItem, projection);
    applyStyles(record.tag, opts.styles && opts.styles.tag, publicItem, projection);
    
    syncRecordIcon(record, item.icon);
    
    record.content.className='qxframe9a7c2-tag-label qxframe9a7c2-tag-content'+(opts.tagTextClassName?' '+String(opts.tagTextClassName):'');
    record.content.removeAttribute('style');
    var rendered = Utils.isFunction(opts.renderTag) ? opts.renderTag(publicItem, projection) : item.label;
    renderNodeContent(record.content, rendered);
    applyClasses(record.content, opts.classes && opts.classes.content, publicItem, projection);
    applyStyles(record.content, opts.styles && opts.styles.content, publicItem, projection);
    
    syncTagClose(record, publicItem, projection);
    var contentParent = syncTagLink(record);
    reconcileChildOrder(contentParent, [record.icon, record.content]);
    if (record.link) reconcileChildOrder(record.tag, [record.link, record.close]);
    else reconcileChildOrder(record.tag, [record.icon, record.content, record.close]);
    return record;
  }
  function reconcileTags(items) {
    var seen = Object.create(null);
    var projectionItems = Object.freeze(items.slice());
    items.forEach(function (item, index) {
      var record = tagRecordsByKey[item.key];
      if (!record) {
        record = createTagRecord(item, index, projectionItems);
        tagRecordsByKey[item.key] = record;
      } else patchTagRecord(record, item, index, projectionItems);
      seen[item.key] = true;
    });
    Object.keys(tagRecordsByKey).forEach(function (key) {
      if (seen[key]) return;
      destroyTagRecord(tagRecordsByKey[key]);
      delete tagRecordsByKey[key];
    });
    var cursor = surface.firstChild;
    items.forEach(function (item) {
      var record = tagRecordsByKey[item.key];
      if (!record) return;
      if (record.shell !== cursor) surface.insertBefore(record.shell, cursor);
      cursor = record.shell.nextSibling;
    });
  }
    
  function createOverflowRowRecord(item) {
    var record = {
      key: item.key,
      item: item,
      row: doc.createElement('div'),
      label: doc.createElement('span'),
      icon: null,
      iconSource: undefined,
      close: null,
      closeDispose: null,
      pointerCloseHandled: false,
      scope: Lifecycle.createScope()
    };
    record.row.className = 'qxframe9a7c2-tags-overflow-item qxframe9a7c2-overflow-item';
    record.label.className = 'qxframe9a7c2-tags-overflow-label qxframe9a7c2-overflow-label';
    patchOverflowRow(record, item);
    return record;
  }
  function syncOverflowClose(record) {
    if (!itemUserRemovable(record.item)) {
      if (record.closeDispose) { record.closeDispose(); record.closeDispose = null; }
      if (record.close && record.close.parentNode) record.close.parentNode.removeChild(record.close);
      record.close = null;
      return;
    }
    if (!record.close) {
      record.close = createCloseButton(copyPublicItem(record.item), {}, true);
      function removeFromOverflow(event) {
        var current = record.item;
        if (!current) return false;
        var hadFocus = activeInside(record.row);
        var rowIndex = overflowList ? Array.prototype.indexOf.call(overflowList.children || [], record.row) : -1;
        var result = remove(current.value, { user: true, source: DOM.activationSource(event), reason: 'overflow-close', originalEvent: event });
        if (hadFocus && !overflowRowsByKey[record.key]) focusOverflowAfterRemoval(rowIndex);
        return result;
      }
      var disposePointer = DOM.listen(record.close, 'pointerdown', function (event) {
        if (event.button !== undefined && event.button !== 0) return;
        record.pointerCloseHandled = true;
        if (event.preventDefault) event.preventDefault();
        if (event.stopPropagation) event.stopPropagation();
        removeFromOverflow(event);
      });
      var disposeClick = DOM.listen(record.close, 'click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if (record.pointerCloseHandled) { record.pointerCloseHandled = false; return; }
        removeFromOverflow(event);
      });
      record.closeDispose = function () { disposePointer(); disposeClick(); };
    } else {
      record.close.className='qxframe9a7c2-tag-close qxframe9a7c2-overflow-close'+(opts.tagRemoveClassName?' '+String(opts.tagRemoveClassName):'');
      syncCloseContent(record.close, copyPublicItem(record.item), { overflow:true, instance:api });
    }
    if (record.close.parentNode !== record.row) record.row.appendChild(record.close);
  }
  function patchOverflowRow(record, item) {
    record.item = item;
    record.row.setAttribute('data-tags-overflow-key', item.key);
    record.row.setAttribute('data-tags-overflow-value', item.value);
    syncRecordIcon(record, item.icon);
    if (record.label.textContent !== item.label) record.label.textContent = item.label;
    syncOverflowClose(record);
    reconcileChildOrder(record.row, [record.icon, record.label, record.close]);
  }
  function reconcileOverflowRows(hiddenItems) {
    if (!overflowList) return;
    var seen = Object.create(null);
    hiddenItems.forEach(function (item) {
      var record = overflowRowsByKey[item.key];
      if (!record) {
        record = createOverflowRowRecord(item);
        overflowRowsByKey[item.key] = record;
      } else patchOverflowRow(record, item);
      seen[item.key] = true;
    });
    Object.keys(overflowRowsByKey).forEach(function (key) {
      if (seen[key]) return;
      destroyOverflowRow(overflowRowsByKey[key]);
      delete overflowRowsByKey[key];
    });
    var cursor = overflowList.firstChild;
    hiddenItems.forEach(function (item) {
      var record = overflowRowsByKey[item.key];
      if (!record) return;
      if (record.row !== cursor) overflowList.insertBefore(record.row, cursor);
      cursor = record.row.nextSibling;
    });
  }
  function ensureOverflowPopup(hiddenItems) {
    if (opts.showOverflowPopover === false) {
      if (overflowPopover || overflowScrollHost) destroyOverflowPopup('tags-overflow-disabled');
      return;
    }
    if (!overflowScrollHost) {
      overflowScrollHost = doc.createElement('div');
      overflowScrollHost.className = 'qxframe9a7c2-tags-overflow-scroll-host qxframe9a7c2-overflow-scroll-host';
      overflowList = doc.createElement('div');
      overflowList.className = 'qxframe9a7c2-tags-overflow-list qxframe9a7c2-overflow-list';
      overflowScrollHost.appendChild(overflowList);
      overflowScroll = Scroll.create({
        container: overflowScrollHost,
        axis: 'y',
        wheelAxis: 'y',
        scrollbarVisibility: opts.scrollbarVisibility,
        edgeShadow: true,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true
      });
    }
    reconcileOverflowRows(hiddenItems);
    var maxHeight = Number(opts.overflowMaxHeight);
    if (Number.isFinite(maxHeight) && maxHeight > 0) overflowScrollHost.style.height = Math.min(maxHeight, Math.max(32, hiddenItems.length * 34)) + 'px';
    else overflowScrollHost.style.height = '';
    overflowScroll.updateOptions({
      scrollbarVisibility: opts.scrollbarVisibility,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true
    });
    overflowScroll.refresh('tags-overflow-items');
    
    var nextConfig = {
      placement: String(opts.overflowPlacement || 'bottom-start'),
      size: String(opts.size || 'md'),
      disabled: opts.disabled === true
    };
    if (!overflowPopover) {
      overflowPopover = Popover.create({
        reference: summary,
        content: overflowScrollHost,
        trigger: 'hover',
        placement: nextConfig.placement,
        showArrow: false,
        size: nextConfig.size,
        closeOnOutsidePress: true,
        closeOnEscape: true,
        disabled: nextConfig.disabled
      });
      overflowPopoverConfig = nextConfig;
    } else {
      var patch = {};
      if (!overflowPopoverConfig || overflowPopoverConfig.placement !== nextConfig.placement) patch.placement = nextConfig.placement;
      if (!overflowPopoverConfig || overflowPopoverConfig.size !== nextConfig.size) patch.size = nextConfig.size;
      if (!overflowPopoverConfig || overflowPopoverConfig.disabled !== nextConfig.disabled) patch.disabled = nextConfig.disabled;
      var hasPatch = Object.keys(patch).length > 0;
      if (hasPatch) overflowPopover.updateOptions(patch);
      overflowPopoverConfig = nextConfig;
      if (!hasPatch && overflowPopover.getState().open) overflowPopover.reposition('overflow-items');
    }
  }
    
  function ensureSummary(hiddenItems, allItems) {
    if (!hiddenItems.length) { destroyOverflow(); return null; }
    if (!summary) summary = doc.createElement('span');
    summary.className='qxframe9a7c2-tag qxframe9a7c2-tag-overflow is-summary'+(opts.tagOverflowClassName?' '+String(opts.tagOverflowClassName):'');
    summary.tabIndex = -1;
    summary.setAttribute('data-tags-overflow', String(hiddenItems.length));
    renderNodeContent(summary, overflowLabel(hiddenItems, allItems));
    var editor = opts.editable ? (opts.hosted === true || adding ? input : addTrigger) : null;
    if (summary.parentNode !== surface || summary.nextSibling !== editor) surface.insertBefore(summary, editor);
    ensureOverflowPopup(hiddenItems);
    return summary;
  }
    
  function overflowLabel(hiddenItems, allItems) {
    var context = Object.freeze({ count: hiddenItems.length, hiddenItems: Object.freeze(hiddenItems.slice()), items: allItems || Object.freeze(publicItems()), instance: api });
    if (Utils.isFunction(opts.renderOverflow)) return opts.renderOverflow(context);
    return '+' + hiddenItems.length;
  }
  function measureAvailableWidth() {
    if (Utils.isFunction(opts.measureAvailableWidth)) {
      var measured = Number(opts.measureAvailableWidth({ root: root, surface: surface, input: input, instance: api }));
      if (Number.isFinite(measured) && measured >= 0) return measured;
    }
    var rect = root.getBoundingClientRect ? root.getBoundingClientRect() : null;
    return Math.max(0, Number(rect && rect.width || root.clientWidth || 0));
  }
  function measureDomOuterWidth(element) {
    if (!element) return 0;
    var rect = element.getBoundingClientRect ? element.getBoundingClientRect() : null;
    var width = Math.max(0, Number(rect && rect.width || element.offsetWidth || 0));
    var computed = view.getComputedStyle ? view.getComputedStyle(element) : null;
    if (computed) {
      var marginLeft = parseFloat(computed.marginLeft);
      var marginRight = parseFloat(computed.marginRight);
      if (Number.isFinite(marginLeft)) width += marginLeft;
      if (Number.isFinite(marginRight)) width += marginRight;
    }
    return Math.max(0, width);
  }
  function measureElementWidth(element, item, index) {
    if (Utils.isFunction(opts.measureItemWidth)) {
      var measured = Number(opts.measureItemWidth(item, index, { element: element, root: root, surface: surface, instance: api }));
      if (Number.isFinite(measured) && measured >= 0) return measured;
    }
    return measureDomOuterWidth(element);
  }
  function measureSummary(hiddenItems, allItems) {
    if (Utils.isFunction(opts.measureOverflowWidth)) {
      var measured = Number(opts.measureOverflowWidth(hiddenItems.slice(), { root: root, surface: surface, instance: api }));
      if (Number.isFinite(measured) && measured >= 0) return measured;
    }
    var probe = doc.createElement('span');
    probe.className='qxframe9a7c2-tag qxframe9a7c2-tag-overflow is-summary'+(opts.tagOverflowClassName?' '+String(opts.tagOverflowClassName):'');
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.pointerEvents = 'none';
    probe.setAttribute('inert', '');
    try { probe.inert = true; } catch (_) {}
    probe.tabIndex = -1;
    appendMeasurementContent(probe, overflowLabel(hiddenItems, allItems));
    surface.appendChild(probe);
    var width = measureElementWidth(probe, null, -1);
    probe.remove();
    return width;
  }
  function surfaceGap() {
    var computed = view.getComputedStyle ? view.getComputedStyle(surface) : null;
    return Math.max(0, Number(computed && parseFloat(computed.columnGap || computed.gap) || 0));
  }
  function responsiveVisibleCount(items, nodes, allItems) {
    if (!items.length) return 0;
    var available = measureAvailableWidth();
    if (!(available > 0)) return items.length;
    var gap = surfaceGap();
    var widths = nodes.map(function (node, index) { return measureElementWidth(node, items[index], index); });
    var inputWidth = 0;
    if (opts.editable) {
      inputWidth = Math.max(0, Number(opts.inputMinWidth) || 76);
      if (opts.hosted !== true) {
        var editor = adding ? input : addTrigger;
        var editorWidth = measureDomOuterWidth(editor);
        if (editorWidth > 0) inputWidth = editorWidth;
      }
    }
    var editorTail = opts.editable ? [inputWidth] : [];
    if (ResponsiveOverflow.requiredSize(widths, widths.length, gap, editorTail) <= available) return items.length;
    return ResponsiveOverflow.fitPrefix({
      lengths: widths,
      available: available,
      gap: gap,
      maxCount: items.length - 1,
      tailWidths: function (candidate) {
        var tail = [measureSummary(items.slice(candidate), allItems || items)];
        if (opts.editable) tail.push(inputWidth);
        return tail;
      }
    });
  }
    
  function refreshOverflow(reason) {
    if (destroyed) return false;
    var items = publicItems();
    var itemsSnapshot = Object.freeze(items.slice());
    var nodes = items.map(function (item) {
      var record = tagRecordsByKey[item.key];
      return record && record.shell;
    });
    nodes.forEach(function (node) { if (node) node.hidden = false; });
    visibleCount = items.length;
    if (opts.overflow === 'collapse') visibleCount = Math.min(items.length, opts.maxVisible);
    else if (opts.overflow === 'responsive') visibleCount = responsiveVisibleCount(items, nodes, itemsSnapshot);
    if (visibleCount < items.length) {
      nodes.forEach(function (node, index) { if (node) node.hidden = index >= visibleCount; });
      ensureSummary(items.slice(visibleCount), itemsSnapshot);
    } else destroyOverflow();
    syncTagTabStops();
    if (containerScroll) containerScroll.refresh('tags-' + (reason || 'overflow'));
    var overflowDetail={reason:reason||'refresh',visibleCount:visibleCount,hiddenCount:Math.max(0,items.length-visibleCount),instance:api};api.emit('overflow',overflowDetail);if(Utils.isFunction(opts.onOverflow))opts.onOverflow(overflowDetail);
    return true;
  }
  function scheduleOverflow(reason) { if (overflowLayout && opts.overflow === 'responsive') overflowLayout.request(reason || 'responsive'); }
  function syncResizeObserver() {
    if (!overflowLayout) { overflowLayout = ResponsiveOverflow.create({ element:root, enabled:opts.overflow === 'responsive', onMeasure:refreshOverflow }); scope.add(function(){ if(overflowLayout)overflowLayout.destroy(); overflowLayout=null; }); }
    else overflowLayout.setEnabled(opts.overflow === 'responsive').setElement(root);
  }
    
  function syncContainerScroll() {
    if (opts.overflow !== 'scroll') {
      if (containerScroll || scrollHost) destroyContainerScroll();
      if (surface.parentNode !== root) root.appendChild(surface);
      return;
    }
    if (!scrollHost) {
      scrollHost = doc.createElement('div');
      scrollHost.className = 'qxframe9a7c2-tags-scroll-host';
    }
    if (scrollHost.parentNode !== root) root.appendChild(scrollHost);
    if (!containerScroll) {
      if (surface.parentNode !== scrollHost) scrollHost.appendChild(surface);
      containerScroll = Scroll.create({
        container: scrollHost,
        axis: 'x',
        wheelAxis: 'x',
        scrollbarVisibility: opts.scrollbarVisibility,
        edgeShadow: true,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true
      });
    } else {
      containerScroll.updateOptions({
        scrollbarVisibility: opts.scrollbarVisibility,
        disabled: opts.disabled === true,
        readOnly: opts.readOnly === true
      });
    }
    containerScroll.refresh('tags-render');
  }
    
  function render(reason) {
    if (destroyed) return false;
    applyRootState();
    
    var items = publicItems();
    reconcileTags(items);
    if (opts.editable) {
      input.value=tokenInput.getState().inputValue;
      input.placeholder=String(opts.placeholder||'');
      input.disabled=opts.disabled===true;
      input.readOnly=opts.readOnly===true;
      addTrigger.disabled=opts.disabled===true||opts.readOnly===true;
      var editor = opts.hosted===true||adding ? input : addTrigger;
      var inactiveEditor = editor === input ? addTrigger : input;
      editorProjectionMutation=true;
      try{
        if (inactiveEditor.parentNode === surface) surface.removeChild(inactiveEditor);
        if (editor.parentNode !== surface || editor.nextSibling !== null) surface.appendChild(editor);
      }finally{editorProjectionMutation=false;}
      if (opts.hosted!==true && adding && addEditorWidth > 0) root.style.setProperty('--_qxframe9a7c2-tags-add-editor-width',addEditorWidth+'px');
    } else {
      if (input.parentNode === surface) input.parentNode.removeChild(input);
      if (addTrigger.parentNode === surface) addTrigger.parentNode.removeChild(addTrigger);
    }
    syncContainerScroll();
    syncResizeObserver();
    if (opts.overflow === 'collapse' || opts.overflow === 'responsive') refreshOverflow(reason || 'render');
    else {
      visibleCount = items.length;
      items.forEach(function (item) { var record=tagRecordsByKey[item.key]; if(record) record.shell.hidden=false; });
      destroyOverflow();
      syncTagTabStops();
    }
    if (keyboard && keyboard.virtualFocus) keyboard.virtualFocus.refresh({ reason:'tags-render' });
    return true;
  }
    
  function setValue(value, meta) {
    if (destroyed) return false;
    var values = normalizeSelectionValue(value);
    var allowed = Object.create(null);
    coreTags().forEach(function (tag) { allowed[tag.value] = true; });
    values.forEach(function (entry) {
      if (!allowed[entry]) throw new TypeError('[QXFRAME9A7C2] Tags value entries must match an existing item.value.');
    });
    var detail = Utils.assignOwn({ reason: 'set-value', source: 'api' }, meta || {});
    selectionValueState.write(values, { silent:true, source:detail.source, reason:detail.reason, originalEvent:detail.originalEvent || null }, false);
    var changed = selection.set(selectionValue(), detail);
    if (changed !== false) syncFormBridge(meta);
    return changed;
  }
  function toggle(value, desired, meta) {
    if (destroyed || opts.checkable !== true) return false;
    var item = itemByValue(value);
    if (!item || item.disabled === true || mutationLocked(meta)) return false;
    var detail = Utils.assignOwn({ reason: 'toggle', source: 'api' }, meta || {});
    var current = selection.values.slice();
    var key = String(item.value), selected = current.indexOf(key) >= 0;
    var nextSelected = desired === undefined ? !selected : desired !== false;
    var proposed = current.filter(function (entry) { return entry !== key; });
    if (nextSelected) {
      if (opts.multiple === false) proposed = [key];
      else proposed.push(key);
    }
    proposed = normalizeSelectionValue(proposed);
    var changed = selectionValueState.write(proposed, { silent:true, source:detail.source, reason:detail.reason, originalEvent:detail.originalEvent || null }, true);
    if (!changed) return false;
    if (selectionValueState.controlled) {
      syncSelectionProjection('controlled-toggle');
      render('selection');
      emitSelection(proposed, Utils.assignOwn(detail, { valueControlled:true, proposedValue:proposed.slice() }));
      return true;
    }
    selection.set(selectionValue(), detail);
    syncFormBridge(meta);
    return true;
  }
  function remove(value, meta) {
    if (destroyed || mutationLocked(meta)) return false;
    var index = itemIndexByValue(value);
    if (index < 0) return false;
    var item = itemByValue(value);
    if (meta && meta.user === true && !itemUserRemovable(item)) return false;
    var detail = Utils.assignOwn({ reason: 'remove', source: 'api' }, meta || {});
    var changed = tokenInput.removeAt(index, detail);
    if (changed) syncSilentTokenMutation(detail, 'remove');
    return changed;
  }
  function add(text, meta) {
    if (destroyed || mutationLocked(meta)) return false;
    var detail = Utils.assignOwn({ reason: 'add', source: 'api' }, meta || {});
    var changed = tokenInput.add(text, detail);
    if (changed) syncSilentTokenMutation(detail, 'add');
    return changed;
  }
  function addMany(values, meta) {
    if (!Array.isArray(values)) throw new TypeError('[QXFRAME9A7C2] Tags addMany values must be an array.');
    var changed = false;
    values.forEach(function (value) { if (add(value, meta)) changed = true; });
    return changed;
  }
  function beginAdd() { if (destroyed || opts.editable !== true || !capabilityController || !capabilityController.can('edit')) return false; if(opts.hosted!==true){var rect=addTrigger.getBoundingClientRect?addTrigger.getBoundingClientRect():null;addEditorWidth=Math.max(0,Number(rect&&rect.width||addTrigger.offsetWidth||0));if(addEditorWidth>0)root.style.setProperty('--_qxframe9a7c2-tags-add-editor-width',addEditorWidth+'px');} adding=true; if (standaloneTagDomain) standaloneTagDomain.clear({ reason:'begin-edit' }); render('begin-add'); if(focusController&&input)focusController.beginEdit(input,{source:'tags',reason:'begin-add'}); if(input)DOM.focusElement(input,{preventScroll:true}); return true; }
  function cancelAdd() { if (destroyed || opts.hosted === true) return false; adding=false; tokenInput.setInputValue('',{silent:true,reason:'cancel-add',source:'tags'}); opts.inputValue=''; render('cancel-add'); return true; }
  function canonicalFormValue() { return opts.checkable === true ? selection.values.slice() : coreTags().map(function(tag){return tag.value;}); }
  function syncFormBridge(meta) {
    var value = canonicalFormValue();
    var registration = api.getFormRegistration && api.getFormRegistration();
    if (registration && registration.notifyValue) registration.notifyValue(Utils.assignOwn({source:'tags',reason:'sync'},meta||{}));
    if (formBridge) formBridge.setValue(value, Utils.assignOwn({silent:true,source:'tags',reason:'sync'},meta||{}));
  }
  function syncSilentTokenMutation(meta, reason) {
    if (!(meta && meta.silent === true)) return false;
    if (selectionController) selectionController.advanceDataRevision('selected');
    var live = Object.create(null);
    tokenInput.getState().tags.forEach(function (tag) {
      live[tag.key] = true;
      if (!metadataByKey[tag.key]) metadataByKey[tag.key] = itemExtras(tag);
    });
    Object.keys(metadataByKey).forEach(function (key) { if (!live[key]) delete metadataByKey[key]; });
    pruneSelection(Utils.assignOwn({ silent:true, reason:'items-prune', source:reason || 'silent-token' }, meta || {}));
    opts.inputValue = tokenInput.getState().inputValue;
    if (input && input.value !== opts.inputValue) input.value = opts.inputValue;
    render(reason || 'silent-token');
    syncFormBridge(meta);
    return true;
  }
  function setItems(items, meta) {
    if (destroyed) return false;
    var next = normalizeItems(items);
    rebuildMetadata(next);
    syncingItems = true;
    var detail = Utils.assignOwn({ reason: 'set-items', source: 'api' }, meta || {});
    tokenInput.setTags(next.map(itemCore), detail);
    syncingItems = false;
    syncSilentTokenMutation(detail, 'set-items');
    return api;
  }
  function clear(meta) {
    if (destroyed || mutationLocked(meta)) return false;
    var detail = Utils.assignOwn({ reason: 'clear', source: 'api' }, meta || {});
    var changed = tokenInput.clear(detail);
    if (changed) syncSilentTokenMutation(detail, 'clear');
    return changed;
  }
  function setInputValue(value, meta) {
    if (destroyed) return false;
    var changed = tokenInput.setInputValue(value, Utils.assignOwn({ reason: 'set-input', source: 'api' }, meta || {}));
    opts.inputValue = tokenInput.getState().inputValue;
    if (input && input.value !== opts.inputValue) input.value = opts.inputValue;
    return changed;
  }
  function commitInput(reason,event){if(destroyed||opts.editable!==true)return false;var committed=tokenInput.commitInput({reason:reason||'commit-input',source:'api',originalEvent:event||null});if(committed&&opts.hosted!==true){adding=false;render('commit-add');}return committed;}
  function applyOptions(nextOptions, patch) {
    if (destroyed) return api;
    var next = patch || {};
    var nextSize = normalizeSize(own(next, 'size') ? next.size : opts.size);
    var nextOverflow = normalizeOverflow(own(next, 'overflow') ? next.overflow : opts.overflow);
    var nextMaxVisible = normalizeMaxVisible(own(next, 'maxVisible') ? next.maxVisible : opts.maxVisible);
    var nextVariant = normalizeVariant(own(next, 'variant') ? next.variant : opts.variant);
    var nextOverflowTrigger = String(own(next, 'overflowTrigger') ? next.overflowTrigger : opts.overflowTrigger || 'hover').trim();
    if (nextOverflowTrigger !== 'hover') throw new TypeError('[QXFRAME9A7C2] Tags overflowTrigger is hover-only; click/focus overflow toggles are not supported.');
    var itemList = own(next, 'items') ? normalizeItems(next.items) : null;
    var values = own(next, 'value') ? normalizeStringArray(next.value, 'value') : null;
    if (values) {
      var allowed = Object.create(null);
      (itemList || publicItems()).forEach(function (item) { allowed[item.value] = true; });
      values.forEach(function (entry) {
        if (!allowed[entry]) throw new TypeError('[QXFRAME9A7C2] Tags value entries must match an existing item.value.');
      });
    }
    var runtimeInputValue = tokenInput.getState().inputValue;
    opts = Utils.mergeOwn(nextOptions);
    if (capabilityController) capabilityController.updateOptions({});
    opts.size = nextSize;
    opts.overflow = nextOverflow;
    opts.maxVisible = nextMaxVisible;
    opts.variant = nextVariant;
    opts.overflowTrigger = 'hover';
    if (!own(next, 'inputValue')) opts.inputValue = runtimeInputValue;
    if (own(next, 'checkable')) bindCanonicalValueController();
    selection.updateOptions({ multiple: opts.multiple !== false });
    if (own(next, 'multiple')) {
      var modeValue = normalizeSelectionValue(selectionValue());
      if (selectionValueState.controlled) selectionValueState.syncExternal(modeValue, { silent:true, source:'options', reason:'options-mode' });
      else selectionValueState.write(modeValue, { silent:true, source:'options', reason:'options-mode' }, false);
      syncSelectionProjection('options-mode');
    }
    tokenInput.updateOptions({
      unique: opts.unique !== false,
      tokenSeparators: opts.tokenSeparators,
      tokenizeOnPaste: opts.tokenizeOnPaste !== false,
      addOnEnter: opts.addOnEnter !== false,
      addOnTab: opts.addOnTab === true,
      addOnBlur: opts.addOnBlur === true,
      maxTags: opts.maxCount,
      maxTagLength: opts.maxTagLength,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      normalizeTag: opts.normalizeTag,
      validateTag: opts.validateTag,
      creatable: opts.creatable !== false
    });
    if (own(next, 'items')) {
      if (selectionController) selectionController.advanceDataRevision('selected');
      rebuildMetadata(itemList);
      syncingItems = true;
      tokenInput.setTags(itemList.map(itemCore), { silent:true, reason:'options-items', source:'options' });
      pruneSelection({ silent:true, reason:'items-prune', source:'options' });
      syncingItems = false;
    }
    if (own(next, 'controlled')) selectionValueState.setControlled(opts.controlled === true);
    if (own(next, 'value')) {
      selectionValueState.syncExternal(values, { silent:true, source:'options', reason:'options-value' });
      syncSelectionProjection('options-value');
    }
    if (own(next,'inputValue')) tokenInput.setInputValue(next.inputValue,{silent:true,reason:'options-input',source:'options'});
    if (formBridge) formBridge.updateOptions({name:opts.name,disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true});
    syncFormBridge({silent:true,source:'options',reason:'options'});
    render('options');
    return api;
  }

  function getState() {
    var items = publicItems();
    return Object.freeze({
      items: items,
      value: selectionValue(),
      inputValue:tokenInput.getState().inputValue,formValue:canonicalFormValue(),hosted:opts.hosted===true,controlled:opts.controlled===true,valueControlled:!!selectionValueState.controlled,adding:adding===true,
      checkable: opts.checkable === true,
      multiple: opts.multiple !== false,
      variant: opts.variant,
      editable: opts.editable === true,
      overflow: opts.overflow,
      visibleCount: visibleCount,
      hiddenCount: Math.max(0, items.length - visibleCount),
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      destroyed: destroyed
    });
  }
  function activateStandaloneTag(key, reason, event) {
    if (!standaloneTagDomain || !key) return false;
    standaloneTagDomain.activate(key, { source:'keyboard', reason:reason || 'tag-keyboard', originalEvent:event || null, ensureVisible:true });
    syncTagTabStops(key);
    return true;
  }
  function handleStandaloneTagKeydown(event) {
    if (opts.hosted === true || adding === true || opts.disabled === true || event.defaultPrevented) return false;
    var key = event.key;
    var current = keyboard.virtualFocus.getState();
    var currentKey = current.domain === 'tags' ? current.key : null;
    if (event.target !== root) {
      if (key === 'Escape' && currentKey) {
        focusWithoutScroll(root);
        activateStandaloneTag(currentKey, 'tag-action-exit', event);
        return true;
      }
      return false;
    }
    if ((key === 'Backspace' || key === 'Delete') && !currentKey) return false;
    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Backspace' || key === 'Delete' || key === 'Escape') {
      var delegated = standaloneTagNavigation ? standaloneTagNavigation.handleKeydown(event) : false;
      if (delegated) {
        syncTagTabStops(standaloneTagNavigation.currentKey() || '');
        return true;
      }
      // Standalone Tags has no right-side real-focus destination. Clamp the virtual
      // cursor at the final visible tag/+ Add instead of clearing it into nowhere.
      if (currentKey && key === 'ArrowRight') return true;
      return false;
    }
    if (key === 'ArrowUp' || key === 'ArrowDown') {
      var spatial = moveVirtualTagSpatial(currentKey, key === 'ArrowUp' ? -1 : 1);
      return spatial ? activateStandaloneTag(spatial, key === 'ArrowUp' ? 'tag-up' : 'tag-down', event) : false;
    }
    if ((key === 'Enter' || key === ' ') && currentKey) {
      if (currentKey === ADD_VIRTUAL_KEY) return key === 'Enter' ? beginAdd() : false;
      var record = tagRecordsByKey[currentKey];
      var item = record && record.item;
      if (!item || item.disabled === true) return false;
      if (opts.checkable === true) { toggle(item.value, undefined, { user:true, source:'keyboard', reason:'toggle', originalEvent:event }); return true; }
      if (key === 'Enter' && item.href && record.link) { record.link.click(); return true; }
      return false;
    }
    if (key === 'Enter' && opts.editable === true && !currentKey) return beginAdd();
    return false;
  }
  function resolveStandaloneInteractionAction(event) {
    var current = standaloneTagNavigation ? standaloneTagNavigation.currentKey() : null;
    if (event && event.target === root && current === ADD_VIRTUAL_KEY && !event.ctrlKey && !event.metaKey && !event.altKey && !event.isComposing && event.key && event.key.length === 1 && event.key !== ' ') return 'START_EDIT';
    return InteractionController.resolveKeyboardAction(event, { keymap:{ Backspace:'REMOVE', Delete:'REMOVE', Escape:'DISMISS' } });
  }
  function dispatchStandaloneInteraction(event) {
    if (!interactionController || !event) return false;
    return interactionController.dispatch(event, { ownerId:'tags' }) !== 'pass';
  }
  function handleStandaloneInteractionAction(action, context) {
    var event = context && context.originalEvent || null;
    if (!event) return 'pass';
    var current = standaloneTagNavigation ? standaloneTagNavigation.currentKey() : null;
    if (action === 'START_EDIT') {
      if (!capabilityController || !capabilityController.can('edit')) return 'blocked';
      if (current !== ADD_VIRTUAL_KEY || event.target !== root) return 'pass';
      var key = String(event.key || '');
      if (key.length !== 1 || key === ' ') return 'pass';
      if (!beginAdd()) return 'pass';
      tokenInput.handleInput(key, { user:true, source:'keyboard', reason:'add-printable-key', originalEvent:event });
      input.value = tokenInput.getState().inputValue;
      return 'handled';
    }
    if (action === 'MOVE_LEFT' || action === 'MOVE_RIGHT' || action === 'MOVE_UP' || action === 'MOVE_DOWN') {
      if (!capabilityController || !capabilityController.can('navigate')) return 'blocked';
      return handleStandaloneTagKeydown(event) ? 'handled' : 'pass';
    }
    if (action === 'REMOVE') {
      if (!capabilityController || !capabilityController.can('remove')) return 'blocked';
      return handleStandaloneTagKeydown(event) ? 'handled' : 'pass';
    }
    if (action === 'DISMISS') return handleStandaloneTagKeydown(event) ? 'handled' : 'pass';
    if (action === 'ACTIVATE') {
      if (current === ADD_VIRTUAL_KEY || (!current && opts.editable === true)) {
        if (!capabilityController || !capabilityController.can('edit')) return 'blocked';
      } else if (current && opts.checkable === true) {
        if (!capabilityController || !capabilityController.can('select')) return 'blocked';
      } else if (!capabilityController || !capabilityController.can('activate')) return 'blocked';
      return handleStandaloneTagKeydown(event) ? 'handled' : 'pass';
    }
    return 'pass';
  }
  if (opts.hosted !== true) {
    interactionController = InteractionController.create();
    interactionController.registerScope({ id:'tags', root:root, document:doc, profile:{ allowEditableKeys:true }, resolveAction:resolveStandaloneInteractionAction, onAction:handleStandaloneInteractionAction });
    scope.add(function(){ if(interactionController) interactionController.destroy(); interactionController=null; });
    focusController = FocusController.create({
      root: root,
      document: doc,
      activeRegion: 'tags',
      disabled: opts.disabled === true,
      hosted: adding === true,
      navigation: {
        focusRoot: function () { return adding === true ? input : root; },
        handlers: FocusController.forwardHandlers(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Backspace','Delete','Enter',' ','Escape'], dispatchStandaloneInteraction),
        beforeHandle:function(detail){
          var event=detail&&detail.originalEvent;
          if(!event||event.defaultPrevented||event.isComposing===true||event.keyCode===229)return false;
          if(event.target===root&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&event.key&&event.key.length===1&&event.key!==' '){ var handled=dispatchStandaloneInteraction(event); if(handled&&event.preventDefault)event.preventDefault(); return false; }
          return true;
        },
        editableKeys:['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Backspace','Delete','Enter',' ','Escape'],
        allowEditableKey:function(){ return adding !== true; }
      },
      onEnter:function(detail){
        var state = keyboard.virtualFocus.getState();
        var key = state.domain === 'tags' && state.key ? state.key : preferredVirtualTagKey();
        if (key) activateStandaloneTag(key, 'tags-region-enter', detail.originalEvent);
      }
    });
    keyboard = focusController.keyboard;
    standaloneTagNavigation = TagNavigation.create({
      keyboard:keyboard,
      domainName:'tags',
      owner:{
        getVirtualTagElement:getVirtualTagElement,
        moveVirtualTag:moveVirtualTag,
        reconcileVirtualTagKey:reconcileVirtualTagKey,
        ensureVirtualTagVisible:ensureVirtualTagVisible,
        removeVirtualTag:removeVirtualTag
      },
      isLocked:function(){ return opts.hosted === true || adding === true || opts.disabled === true; },
      exitRight:false
    });
    standaloneTagDomain = standaloneTagNavigation.domain;
    scope.add(function () { if (standaloneTagNavigation) standaloneTagNavigation.destroy(); standaloneTagNavigation=null; standaloneTagDomain=null; if (focusController) focusController.destroy(); focusController=null; keyboard=null; });
  }
    
  function destroyRuntime() {
    if (destroyed) return false;
    destroyed = true;
    destroyOverflow();
    destroyTagRecords();
    destroyContainerScroll();
    if (overflowLayout) overflowLayout.destroy();
    overflowLayout = null;
    scope.dispose();
    if(formBridge)formBridge.destroy();formBridge=null;
    if(root.parentNode)root.parentNode.removeChild(root);if(ownsContainer&&container&&container.parentNode)container.parentNode.removeChild(container);
    return true;
  }
    
  function focusRuntime() {
    if (opts.hosted === true) { if (opts.editable) focusWithoutScroll(input); return api; }
    if (adding === true) focusWithoutScroll(input);
    else if (focusController) focusController.focus();
    else focusWithoutScroll(root);
    return api;
  }
  function blurRuntime() {
    var active = doc.activeElement;
    if (active && root.contains(active) && Utils.isFunction(active.blur)) active.blur();
    return api;
  }
  var record = {
    add:add, addMany:addMany, remove:remove, toggle:toggle, setItems:setItems, setValue:setValue, clear:clear,
    has:function(value){return itemIndexByValue(value)>=0;}, getValue:canonicalFormValue, getItems:publicItems,
    beginAdd:beginAdd, cancelAdd:cancelAdd,
    editAt:function(index,text,meta){var detail=Utils.assignOwn({reason:'edit',source:'api'},meta||{}),changed=tokenInput.editAt(index,text,detail);if(changed)syncSilentTokenMutation(detail,'edit');return changed;},
    removeAt:function(index,meta){var detail=Utils.assignOwn({reason:'remove',source:'api'},meta||{}),changed=tokenInput.removeAt(index,detail);if(changed)syncSilentTokenMutation(detail,'remove');return changed;},
    setInputValue:setInputValue, commitInput:commitInput,
    refreshOverflow:function(){return refreshOverflow('api');}, applyOptions:applyOptions,
    focus:focusRuntime, blur:blurRuntime, getState:getState,
    getRootElement:function(){return root;}, getSurfaceElement:function(){return surface;},
    getInputElement:function(){return opts.editable&&(opts.hosted===true||adding)?input:null;},
    getAddTriggerElement:function(){return opts.editable&&opts.hosted!==true&&!adding?addTrigger:null;},
    getOverflowElement:function(){return summary;}, getFormField:function(){return formBridge?formBridge.getFormField():null;},
    getTokenInput:function(){return tokenInput;}, getSelection:function(){return selection;}, getSelectionController:function(){return selectionController;},
    getKeyboardNavigation:function(){return keyboard;}, getKeyboardRegion:function(){return focusController&&focusController.getKeyboardRegion?focusController.getKeyboardRegion():null;}, getFocusController:function(){return focusController;}, getInteractionController:function(){return interactionController;}, getCapabilityController:function(){return capabilityController;},
    getVirtualTagElement:getVirtualTagElement, moveVirtualTag:moveVirtualTag,
    reconcileVirtualTagKey:reconcileVirtualTagKey, ensureVirtualTagVisible:ensureVirtualTagVisible,
    removeVirtualTag:removeVirtualTag, getScroll:function(){return containerScroll;},
    getOverflowPopover:function(){return overflowPopover;}, getOverflowScroll:function(){return overflowScroll;},
    getOverlayController:function(){return overflowPopover&&overflowPopover.getOverlayController?overflowPopover.getOverlayController():null;}
  };
  state.runtime = record;
  api.own(destroyRuntime);
  api.bindFocusTarget(root);

  scope.add(DOM.listen(addTrigger,'click',function(event){if(event.preventDefault)event.preventDefault();beginAdd();}));
  scope.add(DOM.listen(input, 'compositionstart', function () { composing = true; }));
  scope.add(DOM.listen(input, 'compositionend', function (event) {
    composing = false;
    tokenInput.handleInput(input.value, { reason: 'compositionend', source: 'input', originalEvent: event });
  }));
  scope.add(DOM.listen(input, 'input', function (event) {
    if (composing) return;
    tokenInput.handleInput(input.value, { reason: 'input', source: 'input', originalEvent: event });
  }));
  scope.add(DOM.listen(input,'keydown',function(event){
    if (opts.hosted !== true && adding === true && event.key === 'Escape') {
      if (event.preventDefault) event.preventDefault();
      cancelAdd();
      focusWithoutScroll(root);
      activateStandaloneTag(ADD_VIRTUAL_KEY, 'cancel-add', event);
      return;
    }
    if (opts.hosted !== true && adding === true && event.key === 'Enter' && !String(tokenInput.getState().inputValue || '').trim()) {
      if (event.preventDefault) event.preventDefault();
      cancelAdd();
      focusWithoutScroll(root);
      activateStandaloneTag(ADD_VIRTUAL_KEY, 'empty-add', event);
      return;
    }
    var keyDetail={value:tokenInput.getState().inputValue,tags:publicItems(),hosted:opts.hosted===true,controlled:opts.controlled===true,instance:api,originalEvent:event};
    if(Utils.isFunction(opts.onKeydown)){var ownerHandled=opts.onKeydown(event,keyDetail)===true;if(destroyed||ownerHandled||event.defaultPrevented)return;}
    var beforeTokenCount=tokenInput.getState().tags.length,beforePublicCount=publicItems().length;
    var handled=tokenInput.handleKeydown(event,{user:true,source:'keyboard',originalEvent:event});
    var externallyHandled=opts.controlled===true&&publicItems().length!==beforePublicCount;
    if(externallyHandled&&event.preventDefault)event.preventDefault();
    if((handled||externallyHandled)&&opts.hosted!==true&&tokenInput.getState().tags.length!==beforeTokenCount){adding=false;render('keyboard-add');if(event.key!=='Tab'){focusWithoutScroll(root);activateStandaloneTag(ADD_VIRTUAL_KEY,'add-committed',event);}}
  }));
  scope.add(DOM.listen(input, 'paste', function (event) {
    if (opts.tokenizeOnPaste === false) return;
    var text = event.clipboardData && event.clipboardData.getData ? event.clipboardData.getData('text') : '';
    if (tokenInput.handlePaste(text, { user: true, source: 'paste', originalEvent: event })) event.preventDefault();
  }));
  scope.add(DOM.listen(input,'blur',function(event){
    var draft=tokenInput.getState().inputValue;
    if(opts.addOnBlur===true){
      if(draft)tokenInput.commitInput({user:true,source:'blur',reason:'blur',originalEvent:event});
      if(opts.hosted!==true){
        adding=false;
        if(tokenInput.getState().inputValue!=='')tokenInput.setInputValue('',{silent:true,reason:'blur-reset',source:'tags'});
        opts.inputValue='';
      }
    }else if(opts.hosted!==true&&!draft)adding=false;
    if(!editorProjectionMutation)render('blur');
    if(Utils.isFunction(opts.onBlur))opts.onBlur(event,api);
  }));
  scope.add(DOM.listen(input, 'focus', function (event) { if (Utils.isFunction(opts.onFocus)) opts.onFocus(event, api); }));
    
  var initialItemsSnapshot=publicItems(),initialSelectionSnapshot=selection.values.slice();
  if(opts.hosted!==true&&(formField||opts.name)){formBridge=FormBridge.create({document:doc,root:root,target:container,formField:formField,name:opts.name,value:canonicalFormValue(),disabled:opts.disabled===true,readOnly:opts.readOnly===true,required:opts.required===true,moveIntoRoot:false,onNativeChange:function(value){var values=Array.isArray(value)?value.slice():(value===''?[]:[value]);if(opts.checkable===true)setValue(values,{silent:true,source:'form-field',reason:'native-change'});else setItems(values.map(function(entry){var label=String(entry);if(formField&&String(formField.tagName||'').toLowerCase()==='select'){var option=Array.prototype.find.call(formField.options||[],function(o){return String(o.value)===String(entry);});if(option)label=String(option.textContent||option.label||option.value);}return {key:String(entry),value:String(entry),label:label};}),{silent:true,source:'form-field',reason:'native-change'});},onReset:function(){setItems(initialItemsSnapshot,{silent:true,source:'form',reason:'reset'});if(opts.checkable===true)setValue(initialSelectionSnapshot,{silent:true,source:'form',reason:'reset'});}});}
  api.bindFeedbackProjector(Object.freeze({
    show:function(snapshot){ return applyFeedbackSnapshot(snapshot); },
    update:function(_handle,snapshot){ return applyFeedbackSnapshot(snapshot); },
    close:function(){ return applyFeedbackSnapshot({status:'idle'}); }
  }));
  function applyFeedbackSnapshot(snapshot) {
    var status=String(snapshot&&snapshot.status||'idle');
    root.classList.toggle('is-error',status==='error');
    root.classList.toggle('is-warning',status==='warning');
    root.classList.toggle('is-loading',status==='pending'||status==='progress');
    return root;
  }
  render('mount');syncFormBridge({silent:true});
  return root;
}

function resolveTagsOptions(options) {
  var source = Utils.mergeOwn(options || {});
  var opts = Utils.mergeOwn(TAGS_DEFAULTS, source);
  var doc = opts.document || (opts.formField && opts.formField.ownerDocument) || (opts.container && opts.container.ownerDocument) || global.document;
  var formField = opts.formField || null;
  if (formField && typeof formField === 'string') formField = DOM.query(doc, formField);
  if (formField && !FormBridge.isFormField(formField)) throw new TypeError('[QXFRAME9A7C2] Tags formField must resolve to input, textarea, or select.');
  var container = opts.container || null;
  if (container && typeof container === 'string') container = DOM.query(doc, container);
  if (formField) {
    if (!own(source,'name') && formField.name) opts.name=formField.name;
    if (!own(source,'disabled')) opts.disabled=formField.disabled===true;
    if (!own(source,'readOnly') && 'readOnly' in formField) opts.readOnly=formField.readOnly===true;
    if (!own(source,'required')) opts.required=formField.required===true;
  }
  opts.size=normalizeSize(opts.size);
  opts.overflow=normalizeOverflow(opts.overflow);
  opts.maxVisible=normalizeMaxVisible(opts.maxVisible);
  opts.variant=normalizeVariant(opts.variant);
  if (String(opts.overflowTrigger || 'hover').trim() !== 'hover') throw new TypeError('[QXFRAME9A7C2] Tags overflowTrigger is hover-only; click/focus overflow toggles are not supported.');
  opts.overflowTrigger='hover';
  opts.value=normalizeStringArray(own(source,'value')?source.value:(own(source,'defaultValue')?source.defaultValue:[]),'value');
  var normalized=normalizeItems(opts.items||[]);
  if((!Array.isArray(source.items)||source.items.length===0)&&formField){
    var nativeInitial=FormBridge.read(formField),nativeValues=Array.isArray(nativeInitial)?nativeInitial.slice():(nativeInitial===''?[]:[nativeInitial]);
    normalized=nativeValues.map(function(value){
      var label=String(value);
      if(String(formField.tagName||'').toLowerCase()==='select'){
        var option=Array.prototype.find.call(formField.options||[],function(entry){return String(entry.value)===String(value);});
        if(option)label=String(option.textContent||option.label||option.value);
      }
      return {key:String(value),value:String(value),label:label,removable:true,disabled:false,color:'',icon:undefined,href:'',className:''};
    });
  }
  if(!own(source,'value')&&!own(source,'defaultValue')&&formField&&opts.checkable===true){
    var nativeChecked=FormBridge.read(formField);
    opts.value=normalizeStringArray(Array.isArray(nativeChecked)?nativeChecked:(nativeChecked===''?[]:[nativeChecked]),'value');
  }
  var initialValues=Object.create(null);
  normalized.forEach(function(item){initialValues[item.value]=true;});
  opts.value.forEach(function(value){if(!initialValues[value])throw new TypeError('[QXFRAME9A7C2] Tags value entries must match an existing item.value.');});
  opts.items=normalized;
  opts.document=doc;
  opts.container=container;
  opts.formField=formField;
  return { source:source, options:opts, document:doc, formField:formField, container:container, initialFieldValue:opts.checkable===true?opts.value.slice():normalized.map(function(item){return item.value;}) };
}
function recordForTags(instance) {
  var state=tagsState.get(instance), record=state&&state.runtime;
  if(!record) throw new TypeError('[QXFRAME9A7C2] Invalid Tags instance.');
  return record;
}

export class Tags extends FieldComponent {
  static profile = Object.freeze({
    name:'Tags',
    value:Object.freeze({ mode:'tag-values-or-check-selection' }),
    focus:Object.freeze({ mode:'virtual-navigation', editLease:'input' }),
    interaction:Object.freeze({ keymap:'tags' }),
    capability:Object.freeze({ mode:'tag-mutation-policy' }),
    selection:Object.freeze({ channels:Object.freeze(['selected']), valueOwner:'ValueController/StateController binding' }),
    overlay:Object.freeze({ mode:'overflow-popover-via-Popover' }),
    feedback:Object.freeze({ mode:'local-status-projection' }),
    form:Object.freeze({ serialize:true }),
    ownership:Object.freeze({ value:'ValueController', focus:'FocusController', interaction:'InteractionController', capability:'CapabilityController', selection:'SelectionController', overlay:'OverlayController', feedback:'FeedbackController', form:'FormController' })
  });
  static options = TAGS_DEFAULTS;
  static contract = ComponentContracts.get('Tags');
  static immutableOptions = Object.freeze(['container','document','formField','hosted']);

  constructor(options = {}) {
    var resolved=resolveTagsOptions(options);
    super(resolved.options);
    tagsState.set(this,{source:resolved.source,document:resolved.document,formField:resolved.formField,container:resolved.container,runtime:null});
    this.setFieldValue(resolved.initialFieldValue,{silent:true,force:true});
  }

  updateOptions(nextOptions = {}) {
    var next=Utils.mergeOwn(nextOptions||{});
    var state=tagsState.get(this)||{};
    var immutableCurrent={container:state.container,document:state.document,formField:state.formField,hosted:this.options.hosted};
    ['container','document','formField','hosted'].forEach(function(name){
      if(!own(next,name))return;
      if(next[name]!==immutableCurrent[name])throw new Error('[QXFRAME9A7C2] Tags option "'+name+'" is immutable; destroy and recreate to change it.');
      delete next[name];
    });
    if(own(next,'size'))next.size=normalizeSize(next.size);
    if(own(next,'overflow'))next.overflow=normalizeOverflow(next.overflow);
    if(own(next,'maxVisible'))next.maxVisible=normalizeMaxVisible(next.maxVisible);
    if(own(next,'variant'))next.variant=normalizeVariant(next.variant);
    if(own(next,'overflowTrigger')&&String(next.overflowTrigger||'hover').trim()!=='hover')throw new TypeError('[QXFRAME9A7C2] Tags overflowTrigger is hover-only; click/focus overflow toggles are not supported.');
    if(own(next,'overflowTrigger'))next.overflowTrigger='hover';
    if(own(next,'items'))next.items=normalizeItems(next.items);
    if(own(next,'value')){
      next.value=normalizeStringArray(next.value,'value');
      var record=tagsState.get(this)&&tagsState.get(this).runtime;
      var items=own(next,'items')?next.items:(record?record.getItems():this.options.items);
      var allowed=Object.create(null);(items||[]).forEach(function(item){allowed[item.value]=true;});
      next.value.forEach(function(value){if(!allowed[value])throw new TypeError('[QXFRAME9A7C2] Tags value entries must match an existing item.value.');});
    }
    return super.updateOptions(next);
  }

  [componentHooks.render]() {
    var state=tagsState.get(this);
    return state.runtime?state.runtime.getRootElement():setupTags(this);
  }
  [fieldHooks.fieldOptionsUpdated](next,_previous,patch) {
    var state=tagsState.get(this);
    if(state&&state.runtime)state.runtime.applyOptions(next,patch);
  }

  add(text,meta){return recordForTags(this).add(text,meta);}
  addMany(values,meta){return recordForTags(this).addMany(values,meta);}
  remove(value,meta){return recordForTags(this).remove(value,meta);}
  toggle(value,desired,meta){return recordForTags(this).toggle(value,desired,meta);}
  setItems(items,meta){return recordForTags(this).setItems(items,meta);}
  setValue(value,meta){return recordForTags(this).setValue(value,meta);}
  clear(meta){return recordForTags(this).clear(meta);}
  has(value){return recordForTags(this).has(value);}
  getValue(){return recordForTags(this).getValue();}
  getItems(){return recordForTags(this).getItems();}
  beginAdd(){return recordForTags(this).beginAdd();}
  cancelAdd(){return recordForTags(this).cancelAdd();}
  editAt(index,text,meta){return recordForTags(this).editAt(index,text,meta);}
  removeAt(index,meta){return recordForTags(this).removeAt(index,meta);}
  setInputValue(value,meta){return recordForTags(this).setInputValue(value,meta);}
  commitInput(reason,event){return recordForTags(this).commitInput(reason,event);}
  refreshOverflow(){return recordForTags(this).refreshOverflow();}
  setDisabled(value){return this.updateOptions({disabled:value===true});}
  setReadOnly(value){return this.updateOptions({readOnly:value===true});}
  focus(){return recordForTags(this).focus();}
  blur(){return recordForTags(this).blur();}
  getState(){return recordForTags(this).getState();}
  getRootElement(){return recordForTags(this).getRootElement();}
  getSurfaceElement(){return recordForTags(this).getSurfaceElement();}
  getInputElement(){return recordForTags(this).getInputElement();}
  getAddTriggerElement(){return recordForTags(this).getAddTriggerElement();}
  getOverflowElement(){return recordForTags(this).getOverflowElement();}
  getFormField(){return recordForTags(this).getFormField();}
  getTokenInput(){return recordForTags(this).getTokenInput();}
  getSelection(){return recordForTags(this).getSelection();}
  getKeyboardNavigation(){return recordForTags(this).getKeyboardNavigation();}
  getKeyboardRegion(){return recordForTags(this).getKeyboardRegion();}
  getFocusController(){return recordForTags(this).getFocusController();}
  getInteractionController(){return recordForTags(this).getInteractionController();}
  getCapabilityController(){return recordForTags(this).getCapabilityController();}
  getSelectionController(){return recordForTags(this).getSelectionController();}
  getOverlayController(){return recordForTags(this).getOverlayController();}
  getVirtualTagElement(key){return recordForTags(this).getVirtualTagElement(key);}
  moveVirtualTag(key,step){return recordForTags(this).moveVirtualTag(key,step);}
  reconcileVirtualTagKey(key){return recordForTags(this).reconcileVirtualTagKey(key);}
  ensureVirtualTagVisible(key){return recordForTags(this).ensureVirtualTagVisible(key);}
  removeVirtualTag(key,meta){return recordForTags(this).removeVirtualTag(key,meta);}
  getScroll(){return recordForTags(this).getScroll();}
  getOverflowPopover(){return recordForTags(this).getOverflowPopover();}
  getOverflowScroll(){return recordForTags(this).getOverflowScroll();}
}

export default Tags;
