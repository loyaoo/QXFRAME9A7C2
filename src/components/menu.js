import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Config } from '../core/config.js';
import { IdManager } from '../utils/id.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { Utils } from '../utils/utils.js';
import { ScrollVisibility } from '../core/scrollVisibility.js';
import { Selection } from '../core/selection.js';
import { ItemSchema } from '../core/itemSchema.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { DOMBinding } from '../core/domBinding.js';
import { FocusController } from '../core/focusController.js';
import { ObserverHub } from '../core/observerHub.js';
import { ResponsiveOverflow } from '../core/responsiveOverflow.js';
import { Transition } from '../core/transition.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { TreeQuery } from '../utils/treeQuery.js';
import { Trigger } from './trigger.js';
import { Item } from './item.js';

const global=globalThis;
const blueprint=DOMTemplate.staticHTML`<nav class="qxframe9a7c2-menu" data-qxframe9a7c2-ref="root"><ul class="qxframe9a7c2-menu-level qxframe9a7c2-menu-root-level" data-qxframe9a7c2-ref="level"></ul></nav>`;
function createDefaultDOM(context){var instance=blueprint.instantiate(context.document);return{root:instance.root,refs:instance.refs};}
function createSubmenuPanel(context){var panel=context.document.createElement('div');panel.className='qxframe9a7c2-menu-submenu-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset';panel.hidden=true;return panel;}
const DOMFactory=Object.freeze({createDefaultDOM,createSubmenuPanel,blueprint});

var MODES = Object.freeze(['vertical', 'horizontal', 'inline']);
var SUBMENU_TRIGGERS = Object.freeze(['hover', 'click']);
var SUBMENU_MODES = Object.freeze(['popup', 'expand']);
var ITEM_DISPLAYS = Object.freeze(['icon', 'icon-label']);
var THEMES = Object.freeze(['inherit', 'light', 'dark']);
var ITEM_THEMES = Object.freeze(['light', 'dark']);
var NON_CANONICAL_OPTIONS = Object.freeze([
  'value', 'defaultValue', 'values', 'searchable', 'searchValue', 'defaultSearchValue',
  'closeOnSelect', 'virtual', 'virtualThreshold', 'height', 'maxHeight', 'target', 'el', 'mount'
]);
var own = Utils.own;
function rejectNonCanonical(options) {
  NON_CANONICAL_OPTIONS.forEach(function (name) {
    if (own(options, name)) throw new TypeError('[QXFRAME9A7C2] Menu does not accept non-navigation option "' + name + '".');
  });
}
function normalizeMode(value) {
  var mode = String(value || 'vertical').toLowerCase();
  if (MODES.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Menu mode must be vertical, horizontal, or inline.');
  return mode;
}
function normalizeSubmenuMode(value) {
  var mode = String(value || 'popup').toLowerCase();
  if (SUBMENU_MODES.indexOf(mode) < 0) throw new TypeError('[QXFRAME9A7C2] Menu submenuMode must be popup or expand.');
  return mode;
}
function normalizeItemDisplay(value) {
  var display = String(value || 'icon-label').toLowerCase();
  if (ITEM_DISPLAYS.indexOf(display) < 0) throw new TypeError('[QXFRAME9A7C2] Menu itemDisplay must be icon or icon-label.');
  return display;
}
function normalizeTheme(value) {
  var theme = String(value == null || value === '' ? 'inherit' : value).toLowerCase();
  if (THEMES.indexOf(theme) < 0) throw new TypeError('[QXFRAME9A7C2] Menu theme must be inherit, light, or dark.');
  return theme;
}
function normalizeItemTheme(value) {
  var theme = String(value || '').toLowerCase();
  if (ITEM_THEMES.indexOf(theme) < 0) throw new TypeError('[QXFRAME9A7C2] Menu item.theme must be light or dark.');
  return theme;
}
function normalizeBoolean(value, name, fallback) {
  if (value === undefined) return fallback === true;
  if (value !== true && value !== false) throw new TypeError('[QXFRAME9A7C2] Menu ' + name + ' must be boolean.');
  return value === true;
}
function normalizePositiveNumber(value, name, fallback, allowZero) {
  if (value === undefined || value === null || value === '') return fallback;
  var number = Number(value);
  if (!Number.isFinite(number) || number < 0 || (!allowZero && number === 0)) throw new TypeError('[QXFRAME9A7C2] Menu ' + name + ' must be ' + (allowZero ? 'a non-negative' : 'a positive') + ' number.');
  return number;
}
function normalizeSubmenuTrigger(value) {
  var trigger = String(value || 'hover').toLowerCase();
  if (SUBMENU_TRIGGERS.indexOf(trigger) < 0) throw new TypeError('[QXFRAME9A7C2] Menu submenuTrigger must be hover or click.');
  return trigger;
}
function normalizeKeys(value) {
  if (value === undefined || value === null || value === '') return [];
  return (Array.isArray(value) ? value : [value]).map(String).filter(function (key, index, list) { return key && list.indexOf(key) === index; });
}
function sameKeys(a, b) {
  if (a.length !== b.length) return false;
  for (var index = 0; index < a.length; index += 1) if (a[index] !== b[index]) return false;
  return true;
}
function itemType(item) {
  var type = item && item.type !== undefined ? String(item.type).toLowerCase() : 'item';
  if (['item','group','divider'].indexOf(type) < 0) throw new TypeError('[QXFRAME9A7C2] Menu item.type must be item, group, or divider.');
  return type;
}
function validateItems(items) {
  return ItemSchema.validate(items, {
    label: 'Menu items',
    keyOf: function (item) { return item.key; },
    childrenOf: function (item) { return item.items; },
    validateItem: function (item) {
      if (item.id !== undefined) throw new TypeError('[QXFRAME9A7C2] Menu item.id is not canonical. Use item.key.');
      if (item.value !== undefined) throw new TypeError('[QXFRAME9A7C2] Menu items do not use item.value. Use item.key as navigation identity.');
      if (item.children !== undefined || item.options !== undefined) throw new TypeError('[QXFRAME9A7C2] Menu nested items use item.items only.');
      var type = itemType(item);
      if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] Menu item.key is required.');
      if (type !== 'divider' && (item.label === undefined || item.label === null)) throw new TypeError('[QXFRAME9A7C2] Menu item.label is required.');
      if (type === 'divider' && item.items !== undefined) throw new TypeError('[QXFRAME9A7C2] Menu divider items cannot contain item.items.');
      if (type === 'group' && item.items !== undefined && !Array.isArray(item.items)) throw new TypeError('[QXFRAME9A7C2] Menu group item.items must be an array.');
      if (item.theme !== undefined) normalizeItemTheme(item.theme);
      if (item.popupClassName !== undefined && typeof item.popupClassName !== 'string') throw new TypeError('[QXFRAME9A7C2] Menu item.popupClassName must be a string.');
    }
  });
}

var DEFAULT_OVERFLOW_INDICATOR = Object.freeze({ kind: 'qxframe9a7c2-menu-default-overflow' });

const MENU_DEFAULTS = Object.freeze({
  items: [], mode: 'vertical', selectedKey: undefined, selectedKeys: undefined, openKeys: undefined,
  multiple: false, selectable: true, submenuMode: undefined, itemDisplay: 'icon-label', collapsed: false,
  disabled: false, size: 'md', submenuTrigger: 'hover', submenuOpenDelay: 0, submenuLeaveDelay: 100, submenuOffset: 8,
  placement: undefined, selectionAppearance: 'highlight', inlineIndent: 24, collapsedWidth: 80,
  theme: 'inherit', forceSubMenuRender: false, disabledOverflow: false, overflowedIndicator: DEFAULT_OVERFLOW_INDICATOR, tooltip: true
});
const menuState = new WeakMap();
const menuIntent = new WeakMap();

function normalizeMenuOptions(input, intent) {
  var supplied = intent || {};
  var opts = Utils.mergeOwn(MENU_DEFAULTS, input || {});
  rejectNonCanonical(supplied);
  validateItems(opts.items);
  opts.mode = normalizeMode(opts.mode);
  opts.submenuTrigger = normalizeSubmenuTrigger(opts.submenuTrigger);
  opts.submenuMode = normalizeSubmenuMode(opts.submenuMode === undefined ? (opts.mode === 'inline' ? 'expand' : 'popup') : opts.submenuMode);
  opts.itemDisplay = normalizeItemDisplay(opts.itemDisplay);
  opts.collapsed = normalizeBoolean(opts.collapsed, 'collapsed', false);
  opts.multiple = normalizeBoolean(opts.multiple, 'multiple', false);
  opts.selectable = normalizeBoolean(opts.selectable, 'selectable', true);
  opts.forceSubMenuRender = normalizeBoolean(opts.forceSubMenuRender, 'forceSubMenuRender', false);
  opts.disabledOverflow = normalizeBoolean(opts.disabledOverflow, 'disabledOverflow', false);
  opts.theme = normalizeTheme(opts.theme);
  opts.inlineIndent = normalizePositiveNumber(opts.inlineIndent, 'inlineIndent', 24, true);
  opts.collapsedWidth = normalizePositiveNumber(opts.collapsedWidth, 'collapsedWidth', 80, false);
  opts.selectionAppearance = Item.normalizeSelectionAppearance(opts.selectionAppearance);
  return opts;
}

function setupMenu(instance) {
  var menuInstanceId = IdManager.next('menu').replace('qxframe9a7c2-menu-', '');
  var intent = menuIntent.get(instance) || { supplied: {}, submenuModeAuto: true };
  var supplied = intent.supplied;
  var submenuModeAuto = intent.submenuModeAuto;
  var opts = Utils.mergeOwn(instance.options);

  function initialSelected() {
    var hasSingle = own(supplied, 'selectedKey') || own(supplied, 'defaultSelectedKey');
    var hasArray = own(supplied, 'selectedKeys') || own(supplied, 'defaultSelectedKeys');
    if (opts.multiple && hasSingle) throw new TypeError('[QXFRAME9A7C2] Menu multiple mode uses selectedKeys/defaultSelectedKeys, not selectedKey/defaultSelectedKey.');
    if (!opts.multiple && hasSingle && hasArray) throw new TypeError('[QXFRAME9A7C2] Menu single mode accepts one selection input contract at a time.');
    var keys;
    if (opts.multiple) keys = normalizeKeys(own(supplied, 'selectedKeys') ? supplied.selectedKeys : supplied.defaultSelectedKeys);
    else if (hasArray) keys = normalizeKeys(own(supplied, 'selectedKeys') ? supplied.selectedKeys : supplied.defaultSelectedKeys);
    else keys = normalizeKeys(own(supplied, 'selectedKey') ? supplied.selectedKey : supplied.defaultSelectedKey);
    if (!opts.multiple && keys.length > 1) throw new TypeError('[QXFRAME9A7C2] Menu single mode selectedKeys/defaultSelectedKeys may contain at most one key.');
    return keys;
  }

  var doc = opts.document || global.document;
  var view = doc && doc.defaultView || global;
  var host = opts.container || null;
  if (!host && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] Menu container is required unless options.elements supplies existing DOM.');
  var portalContainer = opts.portalContainer;
  if (portalContainer && typeof portalContainer === 'string') portalContainer = DOM.resolveElement(portalContainer, doc);
  if (!portalContainer) portalContainer = doc.body;
  if (!portalContainer || !portalContainer.appendChild) throw new TypeError('[QXFRAME9A7C2] Menu portalContainer must be an Element.');

  var scope = Lifecycle.createScope();
  var destroyed = false;
  var focusSyncScheduler = null;
  var overflowLayout = null;
  var api = instance;
  var keyboard = null;
  var focusController = null;
  var virtualFocusDomain = null;
  var binding = DOMBinding.resolve({ options: opts, target: host, component: api, requiredRefs: ['root', 'level'], defaultFactory: DOMFactory.createDefaultDOM });
  var root = binding.refs.root;
  var rootLevel = binding.refs.level;
  var selection = Selection.create({ values: initialSelected(), multiple: opts.multiple === true });
  scope.add(function () { if (selection) selection.destroy(); selection = null; });
  var activeKey = '';
  var activeOverflow = false;
  var hoverKey = '';
  var openKeys = new Set(normalizeKeys(opts.openKeys !== undefined ? opts.openKeys : opts.defaultOpenKeys));
  var inlineExpandedOpenKeys = new Set();
  var inlineCollapsedOpenKeys = new Set();
  if (opts.mode === 'inline') {
    if (opts.collapsed === true) inlineCollapsedOpenKeys = new Set(openKeys);
    else inlineExpandedOpenKeys = new Set(openKeys);
  }
  var itemByKey = new Map();
  var parentKeyByKey = new Map();
  var pathByKey = new Map();
  var buttonByKey = new Map();
  var buttonMeta = new Map();
  var levelPresentation = typeof WeakMap === 'function' ? new WeakMap() : null;
  var selectionIndicatorByButton = typeof WeakMap === 'function' ? new WeakMap() : null;
  var scrollOwnerByLevel = new Map();
  var triggerByKey = new Map();
  var panelByKey = new Map();
  var panelLevelByKey = new Map();
  var inlineTransitionByKey = new Map();
  var triggerOpenSync = false;
  var rootEntryNodes = [];
  var overflowLi = null;
  var overflowButton = null;
  var overflowPanel = null;
  var overflowLevel = null;
  var overflowTrigger = null;
  var overflowedKeys = new Set();
  var themeScopes = new Map();

  function childrenOf(item) { return item && Array.isArray(item.items) ? item.items : []; }
  var itemAccessors=ItemAccessors.create({
    getKey:function(item){return item && item.key;},
    getLabel:function(item){return item && item.label;},
    getChildren:childrenOf,
    isDisabled:function(item){return !item || item.disabled===true;}
  });
  function isDisabledItem(item) { return opts.disabled === true || !!(item && item.disabled === true); }
  function hasChildren(item) { return itemType(item) === 'item' && childrenOf(item).length > 0; }
  function sizeName() { return Utils.normalizeSize(opts.size, 'md'); }
  function inlineCollapsed() { return opts.mode === 'inline' && opts.collapsed === true; }
  function popupMode() { return opts.mode === 'horizontal' || inlineCollapsed() || opts.submenuMode === 'popup'; }
  function cloneKeySet(set) { return new Set(Array.from(set || [])); }
  function rememberInlineOpenKeys() {
    if (opts.mode !== 'inline') return;
    if (inlineCollapsed()) inlineCollapsedOpenKeys = cloneKeySet(openKeys);
    else inlineExpandedOpenKeys = cloneKeySet(openKeys);
  }
  function switchInlineOpenProjection(modeBefore, collapsedBefore) {
    if (modeBefore !== 'inline' || opts.mode !== 'inline' || collapsedBefore === inlineCollapsed()) return;
    if (collapsedBefore) inlineCollapsedOpenKeys = cloneKeySet(openKeys);
    else inlineExpandedOpenKeys = cloneKeySet(openKeys);
    openKeys = cloneKeySet(inlineCollapsed() ? inlineCollapsedOpenKeys : inlineExpandedOpenKeys);
  }
  function selectedArray() { return selection ? selection.values.slice() : []; }
  function selectedKeyValue() { var values = selectedArray(); return values.length ? values[0] : ''; }
  function isSelected(key) { return !!selection && selection.has(String(key)); }
  function allPanels() {
    var panels = Array.from(panelByKey.values());
    if (overflowPanel) panels.push(overflowPanel);
    return panels;
  }
  function targetInPanels(target) { return !!(target && allPanels().some(function (panel) { return panel && (target === panel || (panel.contains && panel.contains(target))); })); }
  function focusTargetBelongsToMenu(target) {
    if (!target) return false;
    if (root && (target === root || (root.contains && root.contains(target)))) return true;
    return targetInPanels(target);
  }
  function scheduleFocusSync(event) {
    if (event && !focusTargetBelongsToMenu(event.target)) return;
    if (!focusSyncScheduler) {
      focusSyncScheduler = Scheduler.createDelayScheduler(function () { if (!destroyed) syncClasses(); });
      scope.add(function () { if (focusSyncScheduler) focusSyncScheduler.dispose(); focusSyncScheduler = null; });
    }
    focusSyncScheduler.request(0, 'focusout');
  }

  function indexItems() {
    itemByKey.clear(); parentKeyByKey.clear(); pathByKey.clear();
    TreeQuery.visit(opts.items,function(record){
      var item=record.item,type=itemType(item);
      if(type==='divider')return TreeQuery.SKIP_CHILDREN;
      if(type==='group')return;
      var nextPath=record.path.filter(function(entry){return itemType(entry)==='item';}).map(function(entry){return String(entry.key);});
      var key=String(item.key),parentKey=nextPath.length>1?nextPath[nextPath.length-2]:'';
      itemByKey.set(key,item);parentKeyByKey.set(key,parentKey);pathByKey.set(key,nextPath);
    },{accessors:itemAccessors});
    var retainedSelection = selectedArray().filter(function (key) { return itemByKey.has(key); });
    if (!opts.multiple && retainedSelection.length > 1) retainedSelection = retainedSelection.slice(0, 1);
    selection.set(retainedSelection, { silent: true, source: 'menu', reason: 'items-prune' });
    function pruneOpenSet(set) {
      Array.from(set).forEach(function (key) { if (!itemByKey.has(key) || !hasChildren(itemByKey.get(key))) set.delete(key); });
    }
    pruneOpenSet(openKeys);
    pruneOpenSet(inlineExpandedOpenKeys);
    pruneOpenSet(inlineCollapsedOpenKeys);
  }

  function appendContent(target, content, context) {
    var output = Utils.isFunction(content) ? content(context || {}) : content;
    if (output === undefined || output === null || output === false) return null;
    if (output && typeof output === 'object' && typeof output.nodeType === 'number') {
      target.appendChild(output);
      return output;
    }
    target.appendChild(doc.createTextNode(String(output)));
    return output;
  }
  function iconNode(item) {
    if (!item || item.icon === undefined || item.icon === null || item.icon === '') return null;
    var node = doc.createElement('span');
    node.className = 'qxframe9a7c2-menu-icon';
    appendContent(node, item.icon, { item: item, menu: api });
    return node;
  }
  function expandIconNode(item, key) {
    var node = doc.createElement('span');
    node.className = 'qxframe9a7c2-menu-submenu-arrow';
    var content = item.expandIcon !== undefined ? item.expandIcon : opts.expandIcon;
    if (content === undefined) { content = doc.createElement('span'); content.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-caret-right is-line is-round is-stroke-3'; }
    appendContent(node, content, { item: item, key: key, open: openKeys.has(key), mode: opts.mode, collapsed: inlineCollapsed(), isSubMenu: true, menu: api });
    return node;
  }
  function titleText(item) {
    if (item.title === false || opts.tooltip === false) return '';
    if (item.title !== undefined && item.title !== null) return typeof item.title === 'string' ? item.title : '';
    return typeof item.label === 'string' || typeof item.label === 'number' ? String(item.label) : '';
  }

  function emitOpenChange(reason, originalEvent, source) {
    var keys = Array.from(openKeys);
    var detail = { openKeys: keys.slice(), source: source || DOM.activationSource(originalEvent), reason: reason || 'open-change', originalEvent: originalEvent || null, menu: api };
    if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(keys.slice(), detail);
    if (!destroyed) api.emit('openChange', detail);
  }
  function removeDescendantOpenKeys(key) {
    var prefix = pathByKey.get(key) || [];
    Array.from(openKeys).forEach(function (candidate) {
      var path = pathByKey.get(candidate) || [];
      if (candidate === key || (path.length > prefix.length && prefix.every(function (entry, index) { return path[index] === entry; }))) openKeys.delete(candidate);
    });
  }
  function ownsBrowserFocus() {
    var active = doc && doc.activeElement;
    return focusTargetBelongsToMenu(active);
  }
  function visibleActiveKey() { return ownsBrowserFocus() ? activeKey : ''; }

  function resolvedPanelTheme(itemTheme) {
    if (itemTheme !== undefined && itemTheme !== null && itemTheme !== '') return normalizeItemTheme(itemTheme);
    if (opts.theme === 'light' || opts.theme === 'dark') return opts.theme;
    return null;
  }
  function syncThemeScope(element, theme) {
    if (!element) return;
    var normalized = theme === 'light' || theme === 'dark' ? theme : null;
    var scopeHandle = themeScopes.get(element) || null;
    if (!normalized) { if (scopeHandle) { scopeHandle.destroy(); themeScopes.delete(element); } return; }
    if (scopeHandle) scopeHandle.update({ theme: normalized });
    else themeScopes.set(element, Config.createScope(element, { theme: normalized }));
  }
  function syncPanelContext(panel, itemTheme) {
    if (!panel || !panel.classList) return;
    ['xs','sm','md','lg','xl'].forEach(function (size) { panel.classList.remove('is-' + size); });
    panel.classList.add('is-' + sizeName());
    syncThemeScope(panel, resolvedPanelTheme(itemTheme));
  }

  function applyRootUserStyle() {
    root.style.setProperty('--qxframe9a7c2-menu-inline-indent', String(opts.inlineIndent) + 'px');
    root.style.setProperty('--qxframe9a7c2-menu-collapsed-width', String(opts.collapsedWidth) + 'px');
    if (opts.style && typeof opts.style === 'object') Object.keys(opts.style).forEach(function (name) { if (Utils.safeOwnKey(name)) root.style[name] = opts.style[name]; });
  }
  function syncClasses() {
    if (!root) return;
    root.className = 'qxframe9a7c2-menu is-' + opts.mode + ' is-' + sizeName();
    if (opts.className) String(opts.className).split(/\s+/).filter(Boolean).forEach(function (name) { root.classList.add(name); });
    syncThemeScope(root, opts.theme === 'inherit' ? null : opts.theme);
    root.classList.toggle('is-icon-only', opts.itemDisplay === 'icon');
    root.classList.toggle('is-collapsed', inlineCollapsed());
    root.classList.toggle('is-submenu-expand', !popupMode());
    root.classList.toggle('is-disabled', opts.disabled === true);
    if (focusController) focusController.setDisabled(opts.disabled === true); else root.tabIndex = opts.disabled === true ? -1 : 0;
    applyRootUserStyle();
    panelByKey.forEach(function (panel, key) { var item = itemByKey.get(key); syncPanelContext(panel, item && item.theme); });
    if (overflowPanel) syncPanelContext(overflowPanel, null);

    var selectedPaths = selectedArray().map(function (key) { return pathByKey.get(key) || []; });
    buttonByKey.forEach(function (button, key) {
      var item = itemByKey.get(key);
      if (!item) return;
      var opened = openKeys.has(key);
      var selected = isSelected(key);
      var descendantSelected = !selected && selectedPaths.some(function (path) { return path.indexOf(key) >= 0; });
      Item.applySelectionAppearance(button, opts.selectionAppearance);
      Item.syncState(button, {
        selected: selected,
        active: key === visibleActiveKey(),
        hover: key === hoverKey,
        open: opened,
        descendantSelected: descendantSelected,
        disabled: isDisabledItem(item)
      });
      button.classList.toggle('is-danger', item.danger === true);
      button.disabled = isDisabledItem(item);
      if (inlineCollapsed() && (pathByKey.get(key) || []).length === 1) {
        var nativeTitle = titleText(item);
        if (nativeTitle) button.setAttribute('title', nativeTitle); else button.removeAttribute('title');
      } else if (item.title !== undefined && typeof item.title === 'string') button.setAttribute('title', item.title);
      else button.removeAttribute('title');
      var selectionIndicator = selectionIndicatorByButton && selectionIndicatorByButton.get(button);
      if (selectionIndicator) Item.syncSelectionIndicator(selectionIndicator, { appearance: opts.selectionAppearance, checked: selected, disabled: isDisabledItem(item) });
      var arrow = button.querySelector('.qxframe9a7c2-menu-submenu-arrow');
      if (arrow && Utils.isFunction(item.expandIcon !== undefined ? item.expandIcon : opts.expandIcon)) {
        while (arrow.firstChild) arrow.removeChild(arrow.firstChild);
        appendContent(arrow, item.expandIcon !== undefined ? item.expandIcon : opts.expandIcon, { item: item, key: key, open: opened, mode: opts.mode, collapsed: inlineCollapsed(), isSubMenu: true, menu: api });
      }
    });
    panelLevelByKey.forEach(function (level, key) {
      var opened = openKeys.has(key);
      var presentation = (levelPresentation && levelPresentation.get(level)) || 'popup';
      if (presentation === 'expand') {
        var inlineTransition = inlineTransitionByKey.get(key);
        // Transition is the sole presence/geometry owner for inline expand levels.
        // Business sync only requests visibility; hooks own hidden/is-open throughout
        // enter, leave and rapid reversal.
        if (inlineTransition) inlineTransition.setVisible(opened, { source:'menu', reason:opened ? 'submenu-open' : 'submenu-close' });
        else { level.classList.toggle('is-open', opened); level.hidden = !opened; }
      } else {
        level.hidden = !opened;
      }
    });
    if (overflowButton) {
      overflowButton.classList.toggle('is-active', activeOverflow && ownsBrowserFocus());
      overflowButton.classList.toggle('is-open', !!(overflowTrigger && overflowTrigger.getState().open));
    }
    syncTabStops();
    if (virtualFocusDomain) virtualFocusDomain.refresh({ reconcile:true });
  }

  function closeSiblingPopups(key, reason, originalEvent) {
    var parentKey = parentKeyByKey.get(key) || '';
    triggerByKey.forEach(function (trigger, candidate) {
      if (candidate !== key && (parentKeyByKey.get(candidate) || '') === parentKey && trigger.getState().open) trigger.closeTree(reason || 'menu-sibling', originalEvent || null);
    });
  }
  function onTriggerOpenChange(key, opened, detail) {
    if (destroyed || triggerOpenSync) return;
    var before = Array.from(openKeys);
    if (opened) {
      closeSiblingPopups(key, 'menu-sibling', detail && detail.originalEvent);
      openKeys.add(key);
    } else removeDescendantOpenKeys(key);
    rememberInlineOpenKeys();
    syncClasses();
    if (!sameKeys(before, Array.from(openKeys))) emitOpenChange(detail && detail.reason || (opened ? 'submenu-open' : 'submenu-close'), detail && detail.originalEvent || null, detail && detail.source || null);
  }

  function createButton(item, level, parentTrigger, parentKey, path) {
    var key = String(item.key);
    var depth = (path || []).length;
    var li = doc.createElement('li');
    li.className = 'qxframe9a7c2-menu-item-wrap';
    var button = doc.createElement('button');
    button.type = 'button';
    button.className = 'qxframe9a7c2-menu-item qxframe9a7c2-item-surface';
    if (item.className) String(item.className).split(/\s+/).filter(Boolean).forEach(function (name) { button.classList.add(name); });
    button.tabIndex = -1;
    button.id = 'qxframe9a7c2-menu-' + menuInstanceId + '-item-' + key.replace(/[^a-zA-Z0-9_-]/g, '-');
    button.style.setProperty('--qxframe9a7c2-menu-depth', String(depth));
    if (item.style && typeof item.style === 'object') Object.keys(item.style).forEach(function (name) { if (Utils.safeOwnKey(name)) button.style[name] = item.style[name]; });
    Item.applySelectionAppearance(button, opts.selectionAppearance);
    var selectionIndicator = Item.createSelectionIndicator({ document: doc, appearance: opts.selectionAppearance, checked: isSelected(key), disabled: isDisabledItem(item) });
    if (selectionIndicatorByButton && selectionIndicator) selectionIndicatorByButton.set(button, selectionIndicator);
    if (selectionIndicator && Item.selectionPosition(opts.selectionAppearance) === 'start') button.appendChild(selectionIndicator);
    var icon = iconNode(item); if (icon) button.appendChild(icon);
    var label = doc.createElement('span');
    label.className = 'qxframe9a7c2-menu-label';
    if (!icon && inlineCollapsed() && depth === 0 && (typeof item.label === 'string' || typeof item.label === 'number')) {
      var collapsedLabel = doc.createElement('span');
      collapsedLabel.className = 'qxframe9a7c2-menu-collapsed-noicon';
      collapsedLabel.textContent = String(item.label).charAt(0);
      button.appendChild(collapsedLabel);
    }
    appendContent(label, item.label, { item: item, key: key, menu: api });
    button.appendChild(label);
    if (item.extra !== undefined && item.extra !== null) {
      var extra = doc.createElement('span');
      extra.className = 'qxframe9a7c2-menu-extra';
      appendContent(extra, item.extra, { item: item, key: key, menu: api });
      button.appendChild(extra);
    }
    if (selectionIndicator && Item.selectionPosition(opts.selectionAppearance) === 'end') button.appendChild(selectionIndicator);
    if (hasChildren(item)) {
      button.appendChild(expandIconNode(item, key));
    }
    li.appendChild(button);
    level.appendChild(li);
    buttonByKey.set(key, button);
    buttonMeta.set(button, { key: key, item: item, level: level, parentTrigger: parentTrigger, parentKey: parentKey || '', path: path.slice(), overflowParent: false });

    if (hasChildren(item)) {
      if (!popupMode()) {
        var inlineLevel = doc.createElement('ul');
        inlineLevel.className = 'qxframe9a7c2-menu-level qxframe9a7c2-menu-inline-level';
        if (levelPresentation) levelPresentation.set(inlineLevel, 'expand');
        scrollOwnerByLevel.set(inlineLevel, root);
        var initiallyOpen = openKeys.has(key);
        inlineLevel.classList.toggle('is-open', initiallyOpen);
        inlineLevel.hidden = !initiallyOpen;
        li.appendChild(inlineLevel);
        panelLevelByKey.set(key, inlineLevel);
        buildLevel(childrenOf(item), inlineLevel, null, key, path.concat(key));
        var inlineTransition = Transition.create({
          element: inlineLevel,
          transition: 'qxframe9a7c2-menu-inline-transition',
          visible: initiallyOpen,
          appear: false,
          onBeforeEnter: function () {
            if (!inlineLevel) return;
            inlineLevel.hidden = false;
            inlineLevel.classList.remove('is-open');
            inlineLevel.style.setProperty('--qxframe9a7c2-menu-inline-motion-height', inlineLevel.scrollHeight + 'px');
          },
          onBeforeLeave: function () {
            if (!inlineLevel) return;
            inlineLevel.hidden = false;
            inlineLevel.classList.remove('is-open');
            inlineLevel.style.setProperty('--qxframe9a7c2-menu-inline-motion-height', inlineLevel.scrollHeight + 'px');
          },
          onAfterEnter: function () {
            if (!inlineLevel) return;
            inlineLevel.classList.add('is-open');
            inlineLevel.style.removeProperty('--qxframe9a7c2-menu-inline-motion-height');
          },
          onAfterLeave: function () {
            if (!inlineLevel) return;
            inlineLevel.classList.remove('is-open');
            inlineLevel.hidden = true;
            inlineLevel.style.removeProperty('--qxframe9a7c2-menu-inline-motion-height');
          }
        });
        inlineTransitionByKey.set(key, inlineTransition);
      } else {
        var panel = DOMFactory.createSubmenuPanel({ document: doc });
        syncPanelContext(panel, item.theme);
        if (item.popupClassName) String(item.popupClassName).split(/\s+/).filter(Boolean).forEach(function (name) { panel.classList.add(name); });
        var popupLevel = doc.createElement('ul');
        popupLevel.className = 'qxframe9a7c2-menu-level qxframe9a7c2-menu-popup-level';
        if (levelPresentation) levelPresentation.set(popupLevel, 'popup');
        panel.appendChild(popupLevel);
        scrollOwnerByLevel.set(popupLevel, panel);
        panelByKey.set(key, panel); panelLevelByKey.set(key, popupLevel);
        var placement = opts.mode === 'horizontal' && !parentKey ? 'bottom-start' : 'right-start';
        var trigger = Trigger.create({
          reference: button, floating: panel, document: doc, portalContainer: portalContainer, trigger: opts.submenuTrigger,
          placement: item.placement || opts.placement || placement, transition: Trigger.motion.popupPlacement, strategy: opts.strategy || 'absolute', offset: own(item, 'submenuOffset') ? item.submenuOffset : opts.submenuOffset, middleware: item.middleware || opts.middleware,
          flipOnOverflow: opts.flipOnOverflow !== false, autoUpdate: opts.autoUpdate !== false, closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: true, closeOnEscape: true,
          destroyOnClose: opts.forceSubMenuRender === true ? false : opts.destroyOnClose !== false, forceRender: opts.forceSubMenuRender === true, restoreFocus: false,
          openDelay: item.submenuOpenDelay !== undefined ? item.submenuOpenDelay : opts.submenuOpenDelay,
          closeDelay: item.submenuLeaveDelay !== undefined ? item.submenuLeaveDelay : opts.submenuLeaveDelay,
          disabled: isDisabledItem(item), parent: parentTrigger || null,
          onOpenChange: function (opened, detail) { onTriggerOpenChange(key, opened, detail); }
        });
        triggerByKey.set(key, trigger);
        buildLevel(childrenOf(item), popupLevel, trigger, key, path.concat(key));
      }
    }
    return button;
  }

  function buildLevel(items, level, parentTrigger, parentKey, path) {
    (items || []).forEach(function (item) {
      var type = itemType(item);
      if (type === 'divider') {
        var divider = doc.createElement('li');
        divider.className = 'qxframe9a7c2-menu-divider';
        divider.classList.toggle('is-dashed', item.dashed === true);
        level.appendChild(divider);
        return;
      }
      if (type === 'group') {
        var marker = doc.createElement('li');
        marker.className = 'qxframe9a7c2-menu-group-label';
        appendContent(marker, item.label, { item: item, key: String(item.key), menu: api });
        level.appendChild(marker);
        buildLevel(childrenOf(item), level, parentTrigger, parentKey, path || []);
        return;
      }
      createButton(item, level, parentTrigger, parentKey, path || []);
    });
  }

  function destroyOverflow() {
    if (overflowTrigger) { overflowTrigger.destroy('menu-rebuild'); overflowTrigger = null; }
    if (overflowPanel) DOM.removeNode(overflowPanel);
    overflowPanel = overflowLevel = overflowLi = overflowButton = null;
    overflowedKeys.clear();
    activeOverflow = false;
  }
  function destroySubmenuResources() {
    destroyOverflow();
    triggerByKey.forEach(function (trigger) { trigger.destroy('menu-rebuild'); });
    triggerByKey.clear();
    inlineTransitionByKey.forEach(function (transition) { transition.destroy(); });
    inlineTransitionByKey.clear();
    panelByKey.forEach(function (panel) { DOM.removeNode(panel); });
    panelByKey.clear(); panelLevelByKey.clear(); buttonByKey.clear(); buttonMeta.clear();
    scrollOwnerByLevel.clear();
    rootEntryNodes = [];
  }

  function createOverflowControl() {
    if (opts.mode !== 'horizontal' || opts.disabledOverflow === true) return;
    overflowLi = doc.createElement('li');
    overflowLi.className = 'qxframe9a7c2-menu-item-wrap qxframe9a7c2-menu-overflow-wrap';
    overflowButton = doc.createElement('button');
    overflowButton.type = 'button';
    overflowButton.className = 'qxframe9a7c2-menu-item qxframe9a7c2-item-surface qxframe9a7c2-menu-overflow';
    overflowButton.id = 'qxframe9a7c2-menu-' + menuInstanceId + '-overflow';
    overflowButton.tabIndex = -1;
    if (opts.overflowedIndicator === DEFAULT_OVERFLOW_INDICATOR) {
      var overflowGlyph = doc.createElement('span');
      overflowGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-more-horizontal is-line is-round is-stroke-3';
      overflowButton.appendChild(overflowGlyph);
    } else appendContent(overflowButton, opts.overflowedIndicator, { menu: api, overflow: true });
    overflowLi.appendChild(overflowButton);
    rootLevel.appendChild(overflowLi);
    buttonMeta.set(overflowButton, { overflow: true, level: rootLevel, parentKey: '', overflowParent: false });
    overflowPanel = DOMFactory.createSubmenuPanel({ document: doc });
    overflowPanel.classList.add('qxframe9a7c2-menu-overflow-panel');
    syncPanelContext(overflowPanel, null);
    overflowLevel = doc.createElement('ul');
    overflowLevel.className = 'qxframe9a7c2-menu-level qxframe9a7c2-menu-popup-level qxframe9a7c2-menu-overflow-level';
    overflowPanel.appendChild(overflowLevel);
    scrollOwnerByLevel.set(overflowLevel, overflowPanel);
    overflowTrigger = Trigger.create({
      reference: overflowButton, floating: overflowPanel, document: doc, portalContainer: portalContainer,
      trigger: opts.submenuTrigger, placement: 'bottom-end', transition: Trigger.motion.popupPlacement, strategy: opts.strategy || 'absolute', offset: opts.submenuOffset, middleware: opts.middleware,
      flipOnOverflow: opts.flipOnOverflow !== false, autoUpdate: opts.autoUpdate !== false, closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: true, closeOnEscape: true,
      destroyOnClose: opts.forceSubMenuRender === true ? false : opts.destroyOnClose !== false, forceRender: opts.forceSubMenuRender === true, restoreFocus: false,
      openDelay: opts.submenuOpenDelay, closeDelay: opts.submenuLeaveDelay, disabled: opts.disabled === true,
      onOpenChange: function () { syncClasses(); }
    });
    overflowLi.hidden = true;
  }
  function entryButton(node) { return node && node.querySelector ? node.querySelector(':scope > .qxframe9a7c2-menu-item') : null; }
  function setEntryLevel(node, level, inOverflow) {
    var button = entryButton(node);
    if (!button) return;
    var meta = buttonMeta.get(button);
    if (meta) { meta.level = level; meta.overflowParent = inOverflow === true; }
    var key = (buttonMeta.get(button) && buttonMeta.get(button).key) || '';
    var trigger = triggerByKey.get(key);
    if (trigger) trigger.updateOptions({ parent: inOverflow && overflowTrigger ? overflowTrigger : null });
    if (inOverflow && key) overflowedKeys.add(key); else if (key) overflowedKeys.delete(key);
  }
  function restoreOverflowEntries() {
    if (!overflowLi) return;
    rootEntryNodes.forEach(function (node) {
      rootLevel.insertBefore(node, overflowLi);
      setEntryLevel(node, rootLevel, false);
    });
    while (overflowLevel && overflowLevel.firstChild) overflowLevel.removeChild(overflowLevel.firstChild);
    overflowedKeys.clear();
  }
  function elementWidth(node) {
    if (!node) return 0;
    var rect = node.getBoundingClientRect ? node.getBoundingClientRect() : null;
    var width = rect && rect.width ? rect.width : node.offsetWidth;
    return Math.max(0, Number(width) || 0);
  }
  function horizontalGap() {
    var computed = view.getComputedStyle ? view.getComputedStyle(rootLevel) : null;
    return Math.max(0, Number(computed && parseFloat(computed.columnGap || computed.gap) || 0));
  }
  function refreshOverflow(reason) {
    if (destroyed || opts.mode !== 'horizontal' || !overflowLi || !overflowLevel) return false;
    restoreOverflowEntries();
    overflowLi.hidden = false;
    overflowLi.style.visibility = 'hidden';
    var available = elementWidth(rootLevel) || elementWidth(root);
    var widths = rootEntryNodes.map(elementWidth);
    var moreWidth = elementWidth(overflowLi);
    var gap = horizontalGap();
    if (!(available > 0) || ResponsiveOverflow.requiredSize(widths, widths.length, gap, []) <= available) {
      overflowLi.hidden = true;
      overflowLi.style.visibility = '';
      if (overflowTrigger) overflowTrigger.closeTree('overflow-clear');
      syncClasses();
      api.emit('overflow', { reason: reason || 'refresh', overflowedKeys: [], visibleCount: rootEntryNodes.length, menu: api });
      return true;
    }
    var visibleCount = ResponsiveOverflow.fitPrefix({ lengths:widths, available:available, gap:gap, tailWidths:[moreWidth] });
    rootEntryNodes.slice(visibleCount).forEach(function (node) {
      overflowLevel.appendChild(node);
      setEntryLevel(node, overflowLevel, true);
    });
    overflowLi.hidden = false;
    overflowLi.style.visibility = '';
    syncClasses();
    api.emit('overflow', { reason: reason || 'refresh', overflowedKeys: Array.from(overflowedKeys), visibleCount: visibleCount, menu: api });
    return true;
  }
  function scheduleOverflow(reason) { if (overflowLayout && opts.mode === 'horizontal' && opts.disabledOverflow !== true) overflowLayout.request(reason || 'layout'); }
  function syncResizeObserver() {
    var enabled=opts.mode === 'horizontal' && opts.disabledOverflow !== true;
    if(!overflowLayout){ overflowLayout=ResponsiveOverflow.create({element:root,enabled:enabled,onMeasure:refreshOverflow}); scope.add(function(){if(overflowLayout)overflowLayout.destroy();overflowLayout=null;}); }
    else overflowLayout.setEnabled(enabled).setElement(root);
  }

  function syncTriggerDisabled() {
    triggerByKey.forEach(function (trigger, key) {
      var item = itemByKey.get(key);
      trigger.setDisabled(opts.disabled === true || !!(item && item.disabled === true));
    });
    if (overflowTrigger) overflowTrigger.setDisabled(opts.disabled === true);
  }
  function syncPopupTriggerRuntime() {
    triggerByKey.forEach(function (trigger, key) {
      var item = itemByKey.get(key);
      if (!trigger || !item) return;
      var parentKey = parentKeyByKey.get(key) || '';
      var fallbackPlacement = opts.mode === 'horizontal' && !parentKey ? 'bottom-start' : 'right-start';
      trigger.updateOptions({
        trigger: opts.submenuTrigger || 'hover',
        placement: item.placement || opts.placement || fallbackPlacement,
        offset: own(item, 'submenuOffset') ? item.submenuOffset : opts.submenuOffset,
        strategy: opts.strategy || 'absolute',
        middleware: item.middleware || opts.middleware,
        flipOnOverflow: opts.flipOnOverflow !== false,
        autoUpdate: opts.autoUpdate !== false,
        destroyOnClose: opts.forceSubMenuRender === true ? false : opts.destroyOnClose !== false,
        openDelay: item.submenuOpenDelay !== undefined ? item.submenuOpenDelay : opts.submenuOpenDelay,
        closeDelay: item.submenuLeaveDelay !== undefined ? item.submenuLeaveDelay : opts.submenuLeaveDelay,
        disabled: isDisabledItem(item)
      });
    });
    if (overflowTrigger) overflowTrigger.updateOptions({
      trigger: opts.submenuTrigger || 'hover',
      offset: opts.submenuOffset,
      strategy: opts.strategy || 'absolute',
      middleware: opts.middleware,
      flipOnOverflow: opts.flipOnOverflow !== false,
      autoUpdate: opts.autoUpdate !== false,
      destroyOnClose: opts.forceSubMenuRender === true ? false : opts.destroyOnClose !== false,
      openDelay: opts.submenuOpenDelay,
      closeDelay: opts.submenuLeaveDelay,
      disabled: opts.disabled === true
    });
  }
  function syncOpenTriggers() {
    if (!popupMode()) return;
    triggerOpenSync = true;
    var entries = Array.from(triggerByKey.keys()).sort(function (a, b) { return (pathByKey.get(a) || []).length - (pathByKey.get(b) || []).length; });
    entries.forEach(function (key) {
      var trigger = triggerByKey.get(key);
      if (!trigger) return;
      if (openKeys.has(key) && !trigger.getState().open) trigger.open('menu-sync');
      else if (!openKeys.has(key) && trigger.getState().open) trigger.closeTree('menu-sync');
    });
    triggerOpenSync = false;
  }
  function ensureButtonVisible(button) {
    if (destroyed || !button || button.hidden || button.disabled) return false;
    var meta = buttonMeta.get(button);
    if (!meta) return false;
    if (meta.overflowParent && overflowTrigger && !overflowTrigger.getState().open) return false;
    if (opts.mode === 'horizontal' && meta.level === rootLevel) return false;
    var owner = scrollOwnerByLevel.get(meta.level);
    if (!owner) return false;
    return ScrollVisibility.ensureVisible(owner, button, { axis: 'y', align: 'nearest' });
  }

  function rebuild() {
    var previousTriggerOpenSync = triggerOpenSync;
    triggerOpenSync = true;
    try { destroySubmenuResources(); }
    finally { triggerOpenSync = previousTriggerOpenSync; }
    while (rootLevel.firstChild) rootLevel.removeChild(rootLevel.firstChild);
    scrollOwnerByLevel.clear();
    scrollOwnerByLevel.set(rootLevel, root);
    indexItems();
    buildLevel(opts.items, rootLevel, null, '', []);
    rootEntryNodes = Array.prototype.slice.call(rootLevel.children || []);
    createOverflowControl();
    syncOpenTriggers();
    if (activeKey && (!buttonByKey.has(activeKey) || isDisabledItem(itemByKey.get(activeKey)))) activeKey = '';
    syncClasses();
    syncResizeObserver();
    scheduleOverflow('rebuild');
  }

  function visibleButtons(level) {
    if (!level || level.hidden || (level.classList && level.classList.contains('qxframe9a7c2-menu-inline-level') && !level.classList.contains('is-open'))) return [];
    return Array.prototype.filter.call(level.children || [], function (li) {
      if (li && li.hidden) return false;
      var button = li && li.querySelector ? li.querySelector(':scope > .qxframe9a7c2-menu-item') : null;
      return !!(button && !button.disabled);
    }).map(function (li) { return li.querySelector(':scope > .qxframe9a7c2-menu-item'); });
  }
  function rovingCandidate(button) {
    if (!button || button.disabled || opts.disabled === true) return false;
    var meta = buttonMeta.get(button);
    if (!meta) return false;
    if (meta.overflow && overflowLi && overflowLi.hidden) return false;
    if (meta.overflowParent && (!overflowTrigger || !overflowTrigger.getState().open)) return false;
    if (meta.parentTrigger && !meta.parentTrigger.getState().open) return false;
    return visibleButtons(meta.level).indexOf(button) >= 0;
  }
  function preferredTabStop() {
    var active = activeOverflow ? overflowButton : (activeKey ? buttonByKey.get(activeKey) : null);
    if (rovingCandidate(active)) return active;
    var selectedKey = selectedKeyValue();
    var selectedPath = selectedKey ? (pathByKey.get(selectedKey) || []) : [];
    if (selectedPath.length) {
      var selectedRootKey = selectedPath[0];
      if (overflowedKeys.has(selectedRootKey) && rovingCandidate(overflowButton)) return overflowButton;
      var selectedRoot = buttonByKey.get(selectedRootKey);
      if (rovingCandidate(selectedRoot)) return selectedRoot;
    }
    var rootButtons = visibleButtons(rootLevel);
    for (var index = 0; index < rootButtons.length; index += 1) if (rovingCandidate(rootButtons[index])) return rootButtons[index];
    return rovingCandidate(overflowButton) ? overflowButton : null;
  }
  function syncTabStops() {
    buttonByKey.forEach(function (button) { button.tabIndex = -1; });
    if (overflowButton) overflowButton.tabIndex = -1;
    if (root) { if (focusController) focusController.setDisabled(opts.disabled === true); else root.tabIndex = opts.disabled === true ? -1 : 0; }
  }
  function focusButton(button, meta) {
    if (!button || button.disabled) return false;
    var local = meta || {};
    var virtualKey;
    if (button === overflowButton || !!(buttonMeta.get(button) && buttonMeta.get(button).overflow)) {
      activeOverflow = true;
      activeKey = '';
      virtualKey = '__overflow__';
    } else {
      activeOverflow = false;
      activeKey = (buttonMeta.get(button) && buttonMeta.get(button).key) || '';
      virtualKey = activeKey;
    }
    syncClasses();
    if (root && doc.activeElement !== root) DOM.focusElement(root, { preventScroll:true });
    if (virtualFocusDomain && virtualKey) virtualFocusDomain.activate(virtualKey, {
      source: local.source || 'keyboard',
      modality: local.source === 'pointer' ? 'pointer' : 'keyboard',
      reason: local.reason || 'menu-focus',
      originalEvent: local.originalEvent || null,
      ensureVisible: local.ensureVisible !== false
    });
    else if (local.ensureVisible !== false) ensureButtonVisible(button);
    return true;
  }
  function focusSibling(button, delta) {
    var meta = buttonMeta.get(button); if (!meta) return false;
    var buttons = visibleButtons(meta.level); if (!buttons.length) return false;
    var index = buttons.indexOf(button); if (index < 0) index = 0;
    return focusButton(buttons[(index + delta + buttons.length) % buttons.length]);
  }
  function focusEdge(button, last) {
    var meta = buttonMeta.get(button); if (!meta) return false;
    var buttons = visibleButtons(meta.level); return buttons.length ? focusButton(buttons[last ? buttons.length - 1 : 0]) : false;
  }
  function inlineVisibleButtons() {
    if (popupMode() || opts.mode === 'horizontal') return [];
    var buttons = [];
    buttonByKey.forEach(function (button, key) {
      var meta = buttonMeta.get(button);
      if (!meta || !button || button.disabled || meta.overflow || meta.overflowParent) return;
      var path = Array.isArray(meta.path) ? meta.path : [];
      for (var i = 0; i < path.length; i += 1) if (!openKeys.has(String(path[i]))) return;
      if (button.hidden || (button.offsetParent === null && button.getClientRects && button.getClientRects().length === 0)) return;
      buttons.push(button);
    });
    return buttons;
  }
  function focusInlineLinear(button, delta) {
    var buttons = inlineVisibleButtons();
    if (!buttons.length) return false;
    var index = buttons.indexOf(button);
    if (index < 0) index = delta < 0 ? buttons.length : -1;
    var next = index + delta;
    if (next < 0) next = opts.loop === true ? buttons.length - 1 : 0;
    if (next >= buttons.length) next = opts.loop === true ? 0 : buttons.length - 1;
    if (next === index) return false;
    return focusButton(buttons[next], { source:'keyboard', reason:delta < 0 ? 'menu-tree-up' : 'menu-tree-down' });
  }
  function focusInlineEdge(last) {
    var buttons = inlineVisibleButtons();
    return buttons.length ? focusButton(buttons[last ? buttons.length - 1 : 0], { source:'keyboard', reason:last ? 'menu-tree-end' : 'menu-tree-home' }) : false;
  }
  function focusFirstChild(key, last) {
    var level = panelLevelByKey.get(key); if (!level) return false;
    var buttons = visibleButtons(level); if (!buttons.length) return false;
    var selectedKey = selectedKeyValue();
    var selectedPath = selectedKey ? (pathByKey.get(selectedKey) || []) : [];
    var parentPath = pathByKey.get(String(key)) || [];
    var preferredKey = selectedPath.length > parentPath.length && selectedPath.slice(0, parentPath.length).join('\u0000') === parentPath.join('\u0000') ? selectedPath[parentPath.length] : '';
    var preferred = preferredKey ? buttonByKey.get(preferredKey) : null;
    return focusButton(preferred && !preferred.disabled ? preferred : buttons[last ? buttons.length - 1 : 0]);
  }

  function openSubmenu(key, reason, originalEvent, focusChild) {
    key = String(key || '');
    var item = itemByKey.get(key); if (!item || !hasChildren(item) || isDisabledItem(item)) return false;
    if (!popupMode()) {
      var before = openKeys.has(key);
      openKeys.add(key); rememberInlineOpenKeys(); syncClasses();
      if (!before) emitOpenChange(reason || 'submenu-open', originalEvent || null);
      if (focusChild) focusFirstChild(key, false);
      return true;
    }
    closeSiblingPopups(key, 'menu-sibling', originalEvent || null);
    var trigger = triggerByKey.get(key); if (!trigger) return false;
    var changed = trigger.open(reason || 'submenu-open', originalEvent || null);
    openKeys.add(key); rememberInlineOpenKeys(); syncClasses();
    if (focusChild) focusFirstChild(key, false);
    return changed !== false;
  }
  function closeSubmenu(key, reason, originalEvent) {
    key = String(key || '');
    if (!itemByKey.has(key)) return false;
    var wasOpen = openKeys.has(key);
    if (popupMode()) { var trigger = triggerByKey.get(key); if (trigger) trigger.closeTree(reason || 'submenu-close', originalEvent || null); }
    removeDescendantOpenKeys(key); rememberInlineOpenKeys(); syncClasses();
    if (!popupMode() && wasOpen) emitOpenChange(reason || 'submenu-close', originalEvent || null);
    return wasOpen;
  }
  function toggleSubmenu(key, reason, originalEvent) { return openKeys.has(String(key)) ? closeSubmenu(key, reason || 'submenu-toggle', originalEvent) : openSubmenu(key, reason || 'submenu-toggle', originalEvent); }

  function selectionDetail(key, meta, previousKeys, nextKeys) {
    var item = key ? itemByKey.get(key) : null;
    var pathKeys = key ? (pathByKey.get(key) || [key]).slice() : [];
    return {
      key: key || null, item: item || null, href: item && item.href !== undefined ? item.href : null,
      pathKeys: pathKeys, keyPath: pathKeys.slice().reverse(), selectedKey: nextKeys.length ? nextKeys[0] : null,
      selectedKeys: nextKeys.slice(), previousSelectedKeys: previousKeys.slice(),
      source: meta && meta.source || 'api', reason: meta && meta.reason || 'selection-change', originalEvent: meta && meta.originalEvent || null,
      menu: api, defaultPrevented: false,
      preventDefault: function () { this.defaultPrevented = true; }
    };
  }
  function commitSelectedKeys(keys, meta) {
    if (destroyed) return api;
    var next = normalizeKeys(keys);
    if (!opts.multiple && next.length > 1) throw new RangeError('[QXFRAME9A7C2] Menu single mode accepts at most one selected key.');
    next.forEach(function (key) { if (!itemByKey.has(key)) throw new RangeError('[QXFRAME9A7C2] Menu selectedKeys must reference item keys.'); });
    var previous = selectedArray();
    if (sameKeys(previous, next)) return api;
    selection.set(next, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'selection-change' });
    if (meta && meta.source === 'keyboard' && next.length) { activeKey = next[next.length - 1]; activeOverflow = false; }
    syncClasses();
    if (!(meta && meta.silent)) {
      var changedKey = meta && meta.key ? String(meta.key) : (next.length ? next[next.length - 1] : (previous.length ? previous[previous.length - 1] : ''));
      var detail = selectionDetail(changedKey, meta, previous, next);
      if (Utils.isFunction(opts.onSelectedKeysChange)) opts.onSelectedKeysChange(next.slice(), detail);
      if (destroyed) return api;
      api.emit('selectedKeysChange', detail);
      if (destroyed) return api;
      var previousSingle = previous.length ? previous[0] : '';
      var nextSingle = next.length ? next[0] : '';
      if (!opts.multiple && previousSingle !== nextSingle) {
        var scalarDetail = Utils.mergeOwn( detail, { previousKey: previousSingle || null, key: nextSingle || null, item: nextSingle ? itemByKey.get(nextSingle) : null });
        if (Utils.isFunction(opts.onSelectedKeyChange)) opts.onSelectedKeyChange(nextSingle, scalarDetail);
        if (!destroyed) api.emit('selectedKeyChange', scalarDetail);
      }
    }
    return api;
  }
  function commitSelectedKey(key, meta) {
    if (opts.multiple) throw new Error('[QXFRAME9A7C2] Menu setSelectedKey is only available when multiple is false.');
    var next = key === undefined || key === null || key === '' ? [] : [String(key)];
    return commitSelectedKeys(next, meta || null);
  }
  function runItemClick(key, meta) {
    var item = itemByKey.get(key);
    var previous = selectedArray();
    var detail = selectionDetail(key, meta, previous, previous);
    if (Utils.isFunction(item.onClick) && item.onClick(detail) === false) detail.defaultPrevented = true;
    if (destroyed) { detail.defaultPrevented = true; return detail; }
    if (Utils.isFunction(opts.onClick) && opts.onClick(detail) === false) detail.defaultPrevented = true;
    if (destroyed) { detail.defaultPrevented = true; return detail; }
    api.emit('click', detail);
    if (destroyed) detail.defaultPrevented = true;
    return detail;
  }
  function navigate(detail) {
    if (destroyed || detail.defaultPrevented) return false;
    if (Utils.isFunction(opts.onNavigate)) opts.onNavigate(detail);
    if (destroyed) return false;
    api.emit('navigate', detail);
    return !destroyed;
  }
  function closeLeafPopupTree(key, reason, originalEvent, source) {
    var button = buttonByKey.get(String(key || ''));
    var meta = button && buttonMeta.get(button);
    if (!meta) return false;
    var trigger = meta.parentTrigger || (meta.overflowParent ? overflowTrigger : null);
    if (!trigger || !trigger.closeTree) return false;
    var rootTrigger = trigger;
    var parent = rootTrigger.getParent && rootTrigger.getParent();
    while (parent) {
      rootTrigger = parent;
      parent = rootTrigger.getParent && rootTrigger.getParent();
    }
    var reference = rootTrigger.getReferenceElement ? rootTrigger.getReferenceElement() : null;
    var changed = rootTrigger.closeTree(reason || 'menu-item-activate', originalEvent || null) !== false;
    if (source !== 'api' && reference) focusButton(reference);
    return changed;
  }
  function finishLeafActivation(key, detail) {
    if (!navigate(detail)) return false;
    closeLeafPopupTree(key, 'menu-item-activate', detail && detail.originalEvent || null, detail && detail.source || 'api');
    return true;
  }
  function selectKey(key, meta) {
    key = String(key || '');
    var item = itemByKey.get(key);
    if (!item || isDisabledItem(item)) return false;
    var clickDetail = runItemClick(key, meta);
    if (destroyed || clickDetail.defaultPrevented) return false;
    if (!opts.selectable) return finishLeafActivation(key, clickDetail);

    var previous = selectedArray();
    var next = previous.slice();
    var selected = selection.has(key);
    if (opts.multiple && selected) {
      next = next.filter(function (entry) { return entry !== key; });
      var deselectDetail = selectionDetail(key, meta, previous, next);
      if (Utils.isFunction(item.onDeselect) && item.onDeselect(deselectDetail) === false) deselectDetail.defaultPrevented = true;
      if (destroyed) return false;
      if (Utils.isFunction(opts.onDeselect) && opts.onDeselect(deselectDetail) === false) deselectDetail.defaultPrevented = true;
      if (destroyed || deselectDetail.defaultPrevented) return false;
      commitSelectedKeys(next, { source: meta && meta.source || 'api', reason: meta && meta.reason || 'deselect', originalEvent: meta && meta.originalEvent || null, key: key });
      if (destroyed) return false;
      deselectDetail.selectedKeys = selectedArray(); deselectDetail.selectedKey = selectedKeyValue() || null;
      api.emit('deselect', deselectDetail);
      return destroyed ? false : finishLeafActivation(key, deselectDetail);
    }
    next = opts.multiple ? previous.concat(key).filter(function (entry, index, list) { return list.indexOf(entry) === index; }) : [key];
    var selectDetail = selectionDetail(key, meta, previous, next);
    if (Utils.isFunction(item.onSelect) && item.onSelect(selectDetail) === false) selectDetail.defaultPrevented = true;
    if (destroyed) return false;
    if (Utils.isFunction(opts.onSelect) && opts.onSelect(selectDetail) === false) selectDetail.defaultPrevented = true;
    if (destroyed || selectDetail.defaultPrevented) return false;
    commitSelectedKeys(next, { source: meta && meta.source || 'api', reason: meta && meta.reason || 'select', originalEvent: meta && meta.originalEvent || null, key: key });
    if (destroyed) return false;
    selectDetail.selectedKeys = selectedArray(); selectDetail.selectedKey = selectedKeyValue() || null;
    api.emit('select', selectDetail);
    return destroyed ? false : finishLeafActivation(key, selectDetail);
  }

  function emitTitleClick(key, item, event, source) {
    var detail = { key: key, item: item, open: openKeys.has(key), openKeys: Array.from(openKeys), source: source || DOM.activationSource(event), reason: 'submenu-title', originalEvent: event || null, menu: api };
    if (Utils.isFunction(item.onTitleClick)) item.onTitleClick(detail);
    if (destroyed) return false;
    if (Utils.isFunction(opts.onTitleClick)) opts.onTitleClick(detail);
    if (destroyed) return false;
    api.emit('titleClick', detail);
    return !destroyed;
  }
  function handleButtonClick(event) {
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (!button || (!root.contains(button) && !targetInPanels(button))) return;
    var source = DOM.activationSource(event);
    if (button === overflowButton || !!(buttonMeta.get(button) && buttonMeta.get(button).overflow)) {
      if (opts.submenuTrigger !== 'click' && overflowTrigger) overflowTrigger.open('overflow-activate', event);
      syncClasses();
      return;
    }
    var key = (buttonMeta.get(button) && buttonMeta.get(button).key) || '';
    var item = itemByKey.get(key); if (!item || isDisabledItem(item)) return;
    if (hasChildren(item)) {
      if (emitTitleClick(key, item, event, source) === false || destroyed) return;
      if (!popupMode()) toggleSubmenu(key, 'submenu-activate', event);
      else if (opts.submenuTrigger !== 'click') openSubmenu(key, 'submenu-activate', event);
      syncClasses();
      return;
    }
    selectKey(key, { source: source, reason: 'item-activate', originalEvent: event });
  }

  var typeahead = '';
  var typeaheadScheduler = null;
  function typeaheadSearch(character, currentButton) {
    if (!character || character.length !== 1 || /\s/.test(character)) return false;
    typeahead += character.toLowerCase();
    if (!typeaheadScheduler) {
      typeaheadScheduler = Scheduler.createDelayScheduler(function () { typeahead = ''; });
      scope.add(function () { if (typeaheadScheduler) typeaheadScheduler.dispose(); typeaheadScheduler = null; });
    }
    typeaheadScheduler.request(500, 'typeahead-reset');
    var meta = buttonMeta.get(currentButton);
    var level = meta && meta.level ? meta.level : rootLevel;
    var buttons = visibleButtons(level).filter(function (button) { return button !== overflowButton; });
    if (!buttons.length) return false;
    var start = Math.max(0, buttons.indexOf(currentButton));
    for (var offset = 1; offset <= buttons.length; offset += 1) {
      var candidate = buttons[(start + offset) % buttons.length];
      var label = candidate.querySelector('.qxframe9a7c2-menu-label');
      if (label && String(label.textContent || '').trim().toLowerCase().indexOf(typeahead) === 0) return focusButton(candidate);
    }
    return false;
  }
  function handleKeydown(event) {
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (!button && activeOverflow && overflowButton) button = overflowButton;
    if (!button && !activeKey && ['ArrowDown','ArrowUp','Home','End','ArrowRight','ArrowLeft'].indexOf(event.key) >= 0) {
      var rootButtons = visibleButtons(rootLevel);
      var selectedKey = selectedKeyValue();
      var selectedPath = selectedKey ? (pathByKey.get(selectedKey) || []) : [];
      var selectedRoot = selectedPath.length ? buttonByKey.get(selectedPath[0]) : null;
      if (selectedRoot && overflowedKeys.has(selectedPath[0])) selectedRoot = null;
      var seedButton = selectedRoot && !selectedRoot.disabled ? selectedRoot : rootButtons[(event.key === 'ArrowUp' || event.key === 'End' || event.key === 'ArrowLeft') ? rootButtons.length - 1 : 0];
      if (seedButton && focusButton(seedButton, { source:'keyboard', reason:'menu-seed', originalEvent:event })) { if (event.preventDefault) event.preventDefault(); return true; }
    }
    if (!button) button = buttonByKey.get(activeKey) || null;
    if (!button) return false;
    var meta = buttonMeta.get(button); if (!meta) return false;
    var handled = false;
    if (meta.overflow) {
      if (event.key === 'ArrowRight') handled = focusSibling(button, 1);
      else if (event.key === 'ArrowLeft') handled = focusSibling(button, -1);
      else if (event.key === 'ArrowDown') {
        if (overflowTrigger) { overflowTrigger.open('keyboard-overflow', event); handled = true; var overflowButtons = visibleButtons(overflowLevel); if (overflowButtons.length) focusButton(overflowButtons[0]); }
      } else if (event.key === 'Enter' || event.key === ' ') { if (overflowTrigger) { overflowTrigger.open('keyboard-overflow-activate', event); handled = true; } } else if (event.key === 'Escape') { if (overflowTrigger) overflowTrigger.closeTree('escape', event); handled = true; }
      if (handled && event.preventDefault) event.preventDefault();
      return handled;
    }
    var key = meta.key, item = meta.item, parentKey = meta.parentKey;
    if (isDisabledItem(item)) return false;
    var isRootLevel = parentKey === '' && !meta.overflowParent;
    var inlineTreeNavigation = !popupMode() && opts.mode !== 'horizontal';
    if (event.key === 'Home') handled = inlineTreeNavigation ? focusInlineEdge(false) : focusEdge(button, false);
    else if (event.key === 'End') handled = inlineTreeNavigation ? focusInlineEdge(true) : focusEdge(button, true);
    else if (opts.mode === 'horizontal' && isRootLevel && event.key === 'ArrowRight') handled = focusSibling(button, 1);
    else if (opts.mode === 'horizontal' && isRootLevel && event.key === 'ArrowLeft') handled = focusSibling(button, -1);
    else if (event.key === 'ArrowDown') {
      if (opts.mode === 'horizontal' && isRootLevel && hasChildren(item)) handled = openSubmenu(key, 'keyboard-down', event, true);
      else handled = inlineTreeNavigation ? focusInlineLinear(button, 1) : focusSibling(button, 1);
    } else if (event.key === 'ArrowUp') {
      if (opts.mode === 'horizontal' && isRootLevel && hasChildren(item)) { handled = openSubmenu(key, 'keyboard-up', event); if (handled) focusFirstChild(key, true); }
      else handled = inlineTreeNavigation ? focusInlineLinear(button, -1) : focusSibling(button, -1);
    } else if (event.key === 'ArrowRight') {
      if (hasChildren(item)) handled = openSubmenu(key, 'keyboard-right', event, !inlineTreeNavigation);
    } else if (event.key === 'ArrowLeft') {
      if (inlineTreeNavigation) {
        if (hasChildren(item) && openKeys.has(key)) handled = closeSubmenu(key, 'keyboard-left', event);
        else handled = false;
      } else
      if (parentKey) {
        closeSubmenu(parentKey, 'keyboard-left', event); handled = focusButton(buttonByKey.get(parentKey));
      } else if (meta.overflowParent && overflowTrigger) {
        overflowTrigger.closeTree('keyboard-left', event); handled = focusButton(overflowButton);
      } else if (hasChildren(item) && openKeys.has(key)) handled = closeSubmenu(key, 'keyboard-left', event);
    } else if (event.key === 'Enter' || event.key === ' ') {
      if (hasChildren(item)) {
        emitTitleClick(key, item, event, 'keyboard');
        handled = popupMode() ? openSubmenu(key, 'keyboard-activate', event, true) : toggleSubmenu(key, 'keyboard-activate', event);
      } else handled = selectKey(key, { source:'keyboard', reason:'item-activate', originalEvent:event }) !== false;
    } else if (event.key === 'Escape') {
      if (parentKey) { closeSubmenu(parentKey, 'escape', event); handled = focusButton(buttonByKey.get(parentKey), { source:'keyboard', reason:'escape-parent', originalEvent:event }); }
      else if (meta.overflowParent && overflowTrigger) { overflowTrigger.closeTree('escape', event); handled = focusButton(overflowButton, { source:'keyboard', reason:'escape-overflow', originalEvent:event }); }
      else { Array.from(openKeys).forEach(function (openKey) { closeSubmenu(openKey, 'escape', event); }); handled = true; }
    } else if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key && event.key.length === 1) handled = typeaheadSearch(event.key, button);
    if (handled && event.preventDefault) event.preventDefault();
    return handled;
  }

  function handlePointerOver(event) {
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (!button || button === overflowButton) return;
    var key = (buttonMeta.get(button) && buttonMeta.get(button).key) || '';
    if (!buttonByKey.has(key)) return;
    hoverKey = key;
    syncClasses();
  }
  function handlePointerOut(event) {
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (!button || button === overflowButton) return;
    var related = event.relatedTarget;
    if (related && button.contains && button.contains(related)) return;
    if (hoverKey === ((buttonMeta.get(button) && buttonMeta.get(button).key) || '')) { hoverKey = ''; syncClasses(); }
  }

  focusController = FocusController.create({
    activeRegion: 'menu',
    root: root,
    disabled: opts.disabled === true,
    navigation: {
      focusRoot: root,
      editableKeys: true,
      handlers: {
        ArrowDown:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        ArrowUp:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        ArrowRight:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        ArrowLeft:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        Home:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        End:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        Enter:function(detail){ return handleKeydown(detail.originalEvent) === true; },
        ' ':function(detail){ return handleKeydown(detail.originalEvent) === true; },
        Escape:function(detail){ return handleKeydown(detail.originalEvent) === true; }
      },
      beforeHandle:function(detail){
        var event = detail && detail.originalEvent;
        if (!event || event.isComposing === true || event.keyCode === 229) return false;
        if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key && event.key.length === 1 && event.key !== ' ') { var typed=handleKeydown(event)===true; if(typed&&event.preventDefault)event.preventDefault(); return false; }
        return true;
      }
    },
    onEnter:function(detail){
      var preferred = preferredTabStop();
      if (preferred) focusButton(preferred, { source:'keyboard', reason:'menu-region-enter', originalEvent:detail.originalEvent, ensureVisible:false });
    }
  });
  keyboard = focusController.keyboard;
  var menuFocusBinding = focusController.bindVirtualFocus({
    controller: focusController.virtualFocus,
    previousDomain: virtualFocusDomain,
    hosted: false,
    domain: {
      name:'menu',
      getElement:function(key){ return key === '__overflow__' ? overflowButton : buttonByKey.get(String(key)) || null; },
      reconcile:function(key){
        if (key === '__overflow__' && rovingCandidate(overflowButton)) return '__overflow__';
        var button = buttonByKey.get(String(key));
        if (rovingCandidate(button)) return String(key);
        var candidate = preferredTabStop();
        if (!candidate) return null;
        return candidate === overflowButton ? '__overflow__' : ((buttonMeta.get(candidate) && buttonMeta.get(candidate).key) || null);
      },
      ensureVisible:function(key){ var button=key === '__overflow__' ? overflowButton : buttonByKey.get(String(key)); return !!(button && ensureButtonVisible(button)); }
    }
  });
  virtualFocusDomain = menuFocusBinding ? menuFocusBinding.domain : null;
  scope.add(function(){ virtualFocusDomain=null; if(focusController) focusController.destroy(); focusController=null; keyboard=null; });
  function handleNavigationPointerDown(event) {
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (!button || (!root.contains(button) && !targetInPanels(button))) return;
    if (event.button !== undefined && event.button !== 0) return;
    if (event.preventDefault) event.preventDefault();
    if (root && doc.activeElement !== root) DOM.focusElement(root, { preventScroll:true });
    if (button === overflowButton) focusButton(button, { source:'pointer', reason:'menu-pointer', originalEvent:event, ensureVisible:false });
    else {
      var meta = buttonMeta.get(button);
      if (meta && meta.key) focusButton(button, { source:'pointer', reason:'menu-pointer', originalEvent:event, ensureVisible:false });
    }
  }
  scope.add(DOM.listen(root, 'pointerdown', handleNavigationPointerDown));
  scope.add(DOM.listen(portalContainer, 'pointerdown', function(event){ if(targetInPanels(event.target)) handleNavigationPointerDown(event); }));

  scope.add(DOM.listen(root, 'pointerover', handlePointerOver));
  scope.add(DOM.listen(root, 'pointerout', handlePointerOut));
  scope.add(DOM.listen(root, 'click', handleButtonClick));
  scope.add(DOM.listen(portalContainer, 'pointerover', function (event) { if (targetInPanels(event.target)) handlePointerOver(event); }));
  scope.add(DOM.listen(portalContainer, 'pointerout', function (event) { if (targetInPanels(event.target)) handlePointerOut(event); }));
  scope.add(DOM.listen(portalContainer, 'click', function (event) { if (targetInPanels(event.target)) handleButtonClick(event); }));
  scope.add(DOM.listen(root, 'focusin', function (event) {
    if (event.target === root) return;
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (button) syncClasses();
  }));
  scope.add(DOM.listen(portalContainer, 'focusin', function (event) {
    var button = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-menu-item') : null;
    if (button && targetInPanels(button)) syncClasses();
  }));
  scope.add(DOM.listen(doc, 'focusin', function (event) { if (focusTargetBelongsToMenu(event && event.target) || focusTargetBelongsToMenu(event && event.relatedTarget)) syncClasses(); }));
  scope.add(DOM.listen(doc, 'focusout', scheduleFocusSync));

  function setSelectedKey(key, meta) {
    if (destroyed) return api;
    return commitSelectedKey(key, meta || null);
  }
  function setSelectedKeys(keys, meta) {
    if (destroyed) return api;
    return commitSelectedKeys(keys, meta || null);
  }
  function setOpenKeys(keys, meta) {
    if (destroyed) return api;
    var next = new Set(normalizeKeys(keys));
    next.forEach(function (key) { var item = itemByKey.get(key); if (!item || !hasChildren(item)) throw new RangeError('[QXFRAME9A7C2] Menu openKeys must reference submenu keys.'); });
    var before = Array.from(openKeys);
    openKeys = next; rememberInlineOpenKeys(); syncOpenTriggers(); syncClasses();
    if (!(meta && meta.silent) && !sameKeys(before, Array.from(openKeys))) emitOpenChange(meta && meta.reason || 'set-open-keys', meta && meta.originalEvent || null);
    return api;
  }
  function setActiveKey(key, meta) {
    if (destroyed) return false;
    var next = String(key || ''); var button = buttonByKey.get(next); if (!button || button.disabled) return false;
    activeKey = next; activeOverflow = false; syncClasses();
    if (!(meta && meta.focus === false)) focusButton(button, { source:meta && meta.source || 'keyboard', reason:meta && meta.reason || 'set-active', originalEvent:meta && meta.originalEvent || null });
    else if (virtualFocusDomain) virtualFocusDomain.activate(next, { source:meta && meta.source || 'api', modality:meta && meta.source === 'pointer' ? 'pointer' : (keyboard ? keyboard.virtualFocus.getState().modality : 'pointer'), reason:meta && meta.reason || 'set-active', ensureVisible:false });
    return true;
  }
  function applyOptions(nextOptions, patch) {
    if (destroyed) return api;
    var next = Utils.mergeOwn(patch || {});
    var modeBefore = opts.mode;
    var collapsedBefore = inlineCollapsed();
    var popupBefore = popupMode();
    var multipleBefore = opts.multiple;
    if (own(next, 'multiple') && next.multiple !== opts.multiple && selection.size > 1 && next.multiple === false) throw new Error('[QXFRAME9A7C2] Menu cannot switch to single mode while multiple keys are selected.');
    if (own(next, 'selectedKey') && own(next, 'selectedKeys')) throw new TypeError('[QXFRAME9A7C2] Menu updateOptions accepts selectedKey or selectedKeys, not both.');
    if (own(next, 'selectedKey') && (own(next, 'multiple') ? next.multiple : opts.multiple)) throw new TypeError('[QXFRAME9A7C2] Menu multiple mode uses selectedKeys.');
    var selectedUpdate = own(next, 'selectedKey') || own(next, 'selectedKeys');
    var nextSelected = selectedUpdate ? (own(next, 'selectedKeys') ? normalizeKeys(next.selectedKeys) : normalizeKeys(next.selectedKey)) : selectedArray();
    var openUpdate = own(next, 'openKeys');
    var explicitNextOpen = openUpdate ? new Set(normalizeKeys(next.openKeys)) : null;
    opts = Utils.assignOwn(nextOptions);
    submenuModeAuto = (menuIntent.get(instance) || {}).submenuModeAuto === true;
    switchInlineOpenProjection(modeBefore, collapsedBefore);
    var popupAfter = popupMode();
    var structural = ['items','mode','submenuMode','itemDisplay','selectionAppearance','theme','forceSubMenuRender','disabledOverflow','overflowedIndicator','expandIcon','collapsed'].some(function (name) { return own(next, name); }) || popupBefore !== popupAfter || modeBefore !== opts.mode || multipleBefore !== opts.multiple;
    if (structural) {
      selection.updateOptions({ multiple: opts.multiple === true, values: nextSelected });
      if (openUpdate) { openKeys = explicitNextOpen; rememberInlineOpenKeys(); }
      rebuild();
    } else {
      if (['disabled','submenuTrigger','placement','submenuOffset','strategy','middleware','flipOnOverflow','autoUpdate','destroyOnClose','submenuOpenDelay','submenuLeaveDelay'].some(function (name) { return own(next, name); })) syncPopupTriggerRuntime();
      if (selectedUpdate) commitSelectedKeys(nextSelected, { silent: true, reason: 'update-options' });
      if (openUpdate) setOpenKeys(Array.from(explicitNextOpen), { silent: true, reason: 'update-options' });
      syncClasses();
      if (own(next, 'inlineIndent') || own(next, 'collapsedWidth')) applyRootUserStyle();
      scheduleOverflow('update-options');
    }
    return api;
  }

  function containsSurface(target) {
    if (!target) return false;
    if (root === target || (root.contains && root.contains(target))) return true;
    var found = targetInPanels(target);
    if (!found) triggerByKey.forEach(function (trigger) { if (!found && trigger.containsElement(target)) found = true; });
    if (!found && overflowTrigger && overflowTrigger.containsElement(target)) found = true;
    return found;
  }
  function getState() {
    return Object.freeze({
      selectedKey: selectedKeyValue() || null, selectedKeys: selectedArray(), multiple: opts.multiple === true, selectable: opts.selectable === true,
      activeKey: activeKey || null, openKeys: Array.from(openKeys), mode: opts.mode, submenuMode: opts.submenuMode,
      itemDisplay: opts.itemDisplay, collapsed: inlineCollapsed(), inlineIndent: opts.inlineIndent, collapsedWidth: opts.collapsedWidth,
      theme: opts.theme, overflowedKeys: Array.from(overflowedKeys), disabled: opts.disabled === true, destroyed: destroyed
    });
  }
  function destroyRuntime(reason) {
    if (destroyed) return false;
    destroyed = true; destroySubmenuResources(); themeScopes.forEach(function (themeScope) { themeScope.destroy(); }); themeScopes.clear(); scope.dispose(); if (binding) binding.release(); binding = null; root = rootLevel = null; return true;
  }

  var record = {
    setSelectedKey: setSelectedKey, setSelectedKeys: setSelectedKeys, setOpenKeys: setOpenKeys, setActiveKey: setActiveKey,
    applyOptions: applyOptions,
    openSubmenu: function (key, reason, event) { return openSubmenu(key, reason || 'api', event || null); },
    closeSubmenu: function (key, reason, event) { return closeSubmenu(key, reason || 'api', event || null); },
    toggleSubmenu: function (key, reason, event) { return toggleSubmenu(key, reason || 'api', event || null); },
    focus: function () {
      var selectedKey = selectedKeyValue();
      var selectedPath = selectedKey ? (pathByKey.get(selectedKey) || []) : [];
      var candidate = buttonByKey.get(activeKey) || (selectedPath.length && !overflowedKeys.has(selectedPath[0]) ? buttonByKey.get(selectedPath[0]) : null) || visibleButtons(rootLevel)[0] || null;
      return focusButton(candidate, { source:'keyboard', reason:'menu-focus-api' });
    },
    refreshOverflow: function () { return refreshOverflow('api'); },
    containsSurface: containsSurface, getState: getState,
    getRootElement: function () { return root; }, getListElement: function () { return rootLevel; },
    getButtonElement: function (key) { return buttonByKey.get(String(key)) || null; },
    findItem: function (query) { var key = query && typeof query === 'object' ? query.key : query; return itemByKey.get(String(key || '')) || null; },
    getSubmenuElement: function (key) { return panelByKey.get(String(key)) || panelLevelByKey.get(String(key)) || null; },
    getTrigger: function (key) { return triggerByKey.get(String(key)) || null; },
    getOverflowElement: function () { return overflowButton; }, getOverflowTrigger: function () { return overflowTrigger; },
    getFocusController: function () { return focusController; }
  };
  menuState.set(instance, record);
  instance.own(destroyRuntime);


  indexItems(); rebuild();
  return root;
}

function recordForMenu(instance) {
  var record = menuState.get(instance);
  if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Menu instance.');
  return record;
}
function normalizeMenuPatch(instance, nextOptions) {
  var next = Utils.mergeOwn(nextOptions || {});
  rejectNonCanonical(next);
  if (own(next, 'items')) validateItems(next.items);
  if (own(next, 'mode')) next.mode = normalizeMode(next.mode);
  if (own(next, 'submenuTrigger')) next.submenuTrigger = normalizeSubmenuTrigger(next.submenuTrigger);
  var meta = menuIntent.get(instance) || { submenuModeAuto:true };
  if (own(next, 'submenuMode')) {
    next.submenuMode = normalizeSubmenuMode(next.submenuMode);
  } else if (own(next, 'mode') && meta.submenuModeAuto) {
    next.submenuMode = next.mode === 'inline' ? 'expand' : 'popup';
  }
  if (own(next, 'itemDisplay')) next.itemDisplay = normalizeItemDisplay(next.itemDisplay);
  if (own(next, 'collapsed')) next.collapsed = normalizeBoolean(next.collapsed, 'collapsed', false);
  if (own(next, 'multiple')) next.multiple = normalizeBoolean(next.multiple, 'multiple', false);
  if (own(next, 'selectable')) next.selectable = normalizeBoolean(next.selectable, 'selectable', true);
  if (own(next, 'forceSubMenuRender')) next.forceSubMenuRender = normalizeBoolean(next.forceSubMenuRender, 'forceSubMenuRender', false);
  if (own(next, 'disabledOverflow')) next.disabledOverflow = normalizeBoolean(next.disabledOverflow, 'disabledOverflow', false);
  if (own(next, 'theme')) next.theme = normalizeTheme(next.theme);
  if (own(next, 'inlineIndent')) next.inlineIndent = normalizePositiveNumber(next.inlineIndent, 'inlineIndent', 24, true);
  if (own(next, 'collapsedWidth')) next.collapsedWidth = normalizePositiveNumber(next.collapsedWidth, 'collapsedWidth', 80, false);
  if (own(next, 'selectionAppearance')) next.selectionAppearance = Item.normalizeSelectionAppearance(next.selectionAppearance);
  return next;
}

export class Menu extends Component {
  static profile = Object.freeze({
    name:'Menu',
    focus:Object.freeze({ mode:'virtual-navigation', host:'composite-root' }),
    interaction:Object.freeze({ keymap:'menu' }),
    selection:Object.freeze({ mode:'menu-selection' }),
    ownership:Object.freeze({ focus:'FocusController', selection:'SelectionController' })
  });
  static options = MENU_DEFAULTS;
  static immutableOptions = Object.freeze(['container','portalContainer']);
  static contract = ComponentContracts.get('Menu');
  static createDefaultDOM = DOMFactory.createDefaultDOM;

  constructor(options = {}) {
    var supplied = Utils.mergeOwn(options || {});
    var canonical = Utils.mergeOwn(supplied);
    if (!own(canonical, 'selectedKey') && own(canonical, 'defaultSelectedKey')) canonical.selectedKey = canonical.defaultSelectedKey;
    if (!own(canonical, 'selectedKeys') && own(canonical, 'defaultSelectedKeys')) canonical.selectedKeys = canonical.defaultSelectedKeys;
    delete canonical.defaultSelectedKey;
    delete canonical.defaultSelectedKeys;
    var auto = !own(supplied, 'submenuMode');
    super(normalizeMenuOptions(canonical, canonical));
    menuIntent.set(this, { supplied:supplied, submenuModeAuto:auto });
  }

  updateOptions(nextOptions = {}) {
    var next = normalizeMenuPatch(this, nextOptions);
    var hadExplicitSubmenu = own(nextOptions || {}, 'submenuMode');
    var result = super.updateOptions(next);
    if (hadExplicitSubmenu) {
      var meta = menuIntent.get(this) || {};
      meta.submenuModeAuto = false;
      menuIntent.set(this, meta);
    }
    return result;
  }

  [componentHooks.render]() { var record = menuState.get(this); return record ? record.getRootElement() : setupMenu(this); }
  [componentHooks.optionsUpdated](next, _previous, patch) { var record = menuState.get(this); if (record) record.applyOptions(next, patch); }

  setItems(items) { validateItems(items); return this.updateOptions({ items:Array.isArray(items) ? items.slice() : [] }); }
  setSelectedKey(key, meta) { return recordForMenu(this).setSelectedKey(key, meta); }
  setSelectedKeys(keys, meta) { return recordForMenu(this).setSelectedKeys(keys, meta); }
  setOpenKeys(keys, meta) { return recordForMenu(this).setOpenKeys(keys, meta); }
  setActiveKey(key, meta) { return recordForMenu(this).setActiveKey(key, meta); }
  setCollapsed(value) { return this.updateOptions({ collapsed:normalizeBoolean(value, 'collapsed', false) }); }
  setDisabled(value) { return this.updateOptions({ disabled:value === true }); }
  setSelectable(value) { return this.updateOptions({ selectable:normalizeBoolean(value, 'selectable', true) }); }
  openSubmenu(key, reason, event) { return recordForMenu(this).openSubmenu(key, reason, event); }
  closeSubmenu(key, reason, event) { return recordForMenu(this).closeSubmenu(key, reason, event); }
  toggleSubmenu(key, reason, event) { return recordForMenu(this).toggleSubmenu(key, reason, event); }
  focus() { return recordForMenu(this).focus(); }
  refreshOverflow() { return recordForMenu(this).refreshOverflow(); }
  containsSurface(target) { return recordForMenu(this).containsSurface(target); }
  getState() { return recordForMenu(this).getState(); }
  getRootElement() { return recordForMenu(this).getRootElement(); }
  getListElement() { return recordForMenu(this).getListElement(); }
  getButtonElement(key) { return recordForMenu(this).getButtonElement(key); }
  findItem(query) { return recordForMenu(this).findItem(query); }
  getSubmenuElement(key) { return recordForMenu(this).getSubmenuElement(key); }
  getTrigger(key) { return recordForMenu(this).getTrigger(key); }
  getOverflowElement() { return recordForMenu(this).getOverflowElement(); }
  getOverflowTrigger() { return recordForMenu(this).getOverflowTrigger(); }
  getFocusController() { return recordForMenu(this).getFocusController(); }
}

export { createDefaultDOM };
export default Menu;
