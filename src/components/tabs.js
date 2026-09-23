import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { DOM } from '../core/dom.js';
import { IdManager } from '../utils/id.js';
import { Utils } from '../utils/utils.js';
import { Collection } from '../core/collection.js';
import { ActiveItem } from '../core/activeItem.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { Renderer } from '../core/renderer.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { RovingProjection } from '../core/rovingProjection.js';
import { Transition } from '../core/transition.js';
import { ObserverHub } from '../core/observerHub.js';
import { ResponsiveOverflow } from '../core/responsiveOverflow.js';
import { Scroll } from './scroll.js';
import { Popover } from './popover.js';

const global=globalThis;

const TABS_DEFAULTS = Object.freeze({
  items: [], orientation: 'horizontal', placement: 'top', type: 'line', activationMode: 'auto',
  destroyInactive: false, overflow: true, edgeShadow: true, wheelPropagation: true,
  editable: false, addable: undefined, closable: false, disabled: false, readOnly: false,
  stretch: false, centered: false, indicator: null, animated: undefined, overflowPopupRender: null,
  transition: 'qxframe9a7c2-tabs-transition', size: 'md', className: ''
});
const tabsState = new WeakMap();

var ORIENTATIONS = Object.freeze(['horizontal', 'vertical']);
var PLACEMENTS = Object.freeze(['top', 'right', 'bottom', 'left']);
var TYPES = Object.freeze(['line', 'card', 'segmented']);
var ACTIVATION_MODES = Object.freeze(['auto', 'manual']);
var INDICATOR_ALIGNS = Object.freeze(['start', 'center', 'end']);
var SIZES = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl']);
var IMMUTABLE_OPTIONS = Object.freeze(['container', 'document']);
var own = Utils.own;
function oneOf(value, values, fallback, label) { return Utils.normalizeEnum(value == null ? fallback : value, values, undefined, 'Tabs ' + label); }
function normalizeSize(value) { return oneOf(value, SIZES, 'md', 'size'); }
function normalizeAnimated(value) {
  if (value === undefined || value === null) return Object.freeze({ indicator:true, panel:false });
  if (typeof value === 'boolean') return Object.freeze({ indicator:value === true, panel:value === true });
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Tabs animated must be boolean or { indicator, panel }.');
  if (value.indicator !== undefined && typeof value.indicator !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Tabs animated.indicator must be boolean.');
  if (value.panel !== undefined && typeof value.panel !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Tabs animated.panel must be boolean.');
  return Object.freeze({ indicator:value.indicator !== false, panel:value.panel === true });
}
function normalizeIndicator(value) {
  if (value === undefined || value === null || value === false) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value) || Renderer.isNodeLike(value)) throw new TypeError('[QXFRAME9A7C2] Tabs indicator must be an object, false, or null.');
  var align = oneOf(value.align, INDICATOR_ALIGNS, 'center', 'indicator.align');
  var size = value.size;
  if (size === undefined || size === null || size === '') size = null;
  else { size = Number(size); if (!Number.isFinite(size) || size <= 0) throw new TypeError('[QXFRAME9A7C2] Tabs indicator.size must be a positive finite pixel number.'); }
  return Object.freeze({ align: align, size: size });
}
function normalizeItem(item, index) {
  if (item == null || typeof item === 'string' || typeof item === 'number') {
    return { key: String(item == null ? index : item), label: String(item == null ? '' : item), content: '' };
  }
  if (typeof item !== 'object' || Array.isArray(item) || Renderer.isNodeLike(item)) {
    throw new TypeError('[QXFRAME9A7C2] Tabs item ' + index + ' must be a primitive label or object.');
  }
  var next = Utils.mergeOwn( item);
  if (next.key === undefined || next.key === null) next.key = String(index);
  next.key = String(next.key);
  if (next.label === undefined || next.label === null) next.label = next.key;
  return next;
}
function normalizeItems(items) {
  if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] Tabs items must be an array.');
  var seen = Object.create(null);
  return items.map(function (item, index) {
    var next = normalizeItem(item, index);
    if (seen[next.key]) throw new TypeError('[QXFRAME9A7C2] Tabs item keys must be unique: ' + next.key + '.');
    seen[next.key] = true;
    return next;
  });
}
function normalizeOptions(input, intent) {
  var opts = input;
  var explicit = intent || {};
  var hasPlacement = own(explicit, 'placement');
  var hasOrientation = own(explicit, 'orientation');
  if (hasPlacement) {
    opts.placement = oneOf(opts.placement, PLACEMENTS, 'top', 'placement');
    var placementOrientation = opts.placement === 'left' || opts.placement === 'right' ? 'vertical' : 'horizontal';
    if (hasOrientation && oneOf(opts.orientation, ORIENTATIONS, 'horizontal', 'orientation') !== placementOrientation) {
      throw new TypeError('[QXFRAME9A7C2] Tabs orientation conflicts with placement "' + opts.placement + '".');
    }
    opts.orientation = placementOrientation;
  } else if (hasOrientation) {
    opts.orientation = oneOf(opts.orientation, ORIENTATIONS, 'horizontal', 'orientation');
    opts.placement = opts.orientation === 'vertical' ? 'left' : 'top';
  } else {
    opts.orientation = oneOf(opts.orientation, ORIENTATIONS, 'horizontal', 'orientation');
    opts.placement = oneOf(opts.placement, PLACEMENTS, opts.orientation === 'vertical' ? 'left' : 'top', 'placement');
    var normalizedOrientation = opts.placement === 'left' || opts.placement === 'right' ? 'vertical' : 'horizontal';
    if (normalizedOrientation !== opts.orientation) opts.placement = opts.orientation === 'vertical' ? 'left' : 'top';
  }
  opts.type = oneOf(opts.type, TYPES, 'line', 'type');
  opts.activationMode = oneOf(opts.activationMode, ACTIVATION_MODES, 'auto', 'activationMode');
  opts.size = normalizeSize(opts.size);
  if (opts.centered !== undefined && typeof opts.centered !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Tabs centered must be boolean.');
  if (opts.overflowPopupRender !== null && opts.overflowPopupRender !== undefined && typeof opts.overflowPopupRender !== 'function') throw new TypeError('[QXFRAME9A7C2] Tabs overflowPopupRender must be a function or null.');
  opts.centered = opts.centered === true;
  opts.animated = normalizeAnimated(opts.animated);
  opts.indicator = normalizeIndicator(opts.indicator);
  opts.items = normalizeItems(opts.items || []);
  return opts;
}
function renderOutput(host, value, item, api, slot, doc) {
  var output = typeof value === 'function' ? value(item, api, slot) : value;
  Renderer.replace(host, output == null ? '' : output, doc);
}

function setupTabs(instance) {
  var source = instance.options;
  var opts = normalizeOptions(Utils.mergeOwn(source), source);
  if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Tabs container must be an Element.');

  var doc = opts.document || opts.container.ownerDocument || global.document;
  var view = doc && doc.defaultView || global;
  var scope = Lifecycle.createScope();
  var destroyed = false;
  var api = instance;
  var items = opts.items.slice();
  var collection = Collection.create({
    items: items,
    getKey: function (item) { return item.key; },
    getLabel: function (item) { return item.label; },
    isDisabled: function (item) { return item.disabled === true; }
  });

  var root = doc.createElement('div');
  var nav = doc.createElement('div');
  var scrollHost = doc.createElement('div');
  var moreButton = doc.createElement('button');
  var overflowContentHost = doc.createElement('div');
  var overflowScrollHost = doc.createElement('div');
  var overflowPanel = doc.createElement('div');
  var addButton = doc.createElement('button');
  var panels = doc.createElement('div');
  var indicator = doc.createElement('div');
  root.className = 'qxframe9a7c2-tabs';
  nav.className = 'qxframe9a7c2-tabs-nav';
  scrollHost.className = 'qxframe9a7c2-tabs-scroll-host';
  moreButton.className = 'qxframe9a7c2-tabs-more';
  overflowContentHost.className = 'qxframe9a7c2-tabs-overflow-popup-content';
  overflowScrollHost.className = 'qxframe9a7c2-tabs-overflow-scroll-host qxframe9a7c2-overflow-scroll-host';
  overflowPanel.className = 'qxframe9a7c2-tabs-overflow-panel qxframe9a7c2-overflow-list';
  addButton.className = 'qxframe9a7c2-tabs-add';
  panels.className = 'qxframe9a7c2-tabs-panels';
  indicator.className = 'qxframe9a7c2-tabs-indicator';
  moreButton.type = 'button';
  addButton.type = 'button';
  var moreGlyph = doc.createElement('span'); moreGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-more-horizontal is-line is-round is-stroke-3'; moreButton.appendChild(moreGlyph);
  var addGlyph = doc.createElement('span'); addGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-plus is-line is-round is-stroke-3'; addButton.appendChild(addGlyph);
  overflowScrollHost.appendChild(overflowPanel);
  overflowContentHost.appendChild(overflowScrollHost);
  nav.appendChild(scrollHost);
  root.appendChild(nav);
  root.appendChild(panels);
  opts.container.appendChild(root);

  var scroll = Scroll.create({
    container: scrollHost,
    axis: opts.orientation === 'vertical' ? 'y' : 'x',
    wheelAxis: opts.orientation === 'vertical' ? 'y' : 'x',
    wheelPropagation: opts.wheelPropagation !== false,
    scrollbarVisibility: 'hidden',
    edgeShadow: opts.edgeShadow !== false,
    keyboard: false,
    focusable: false,
    disabled: opts.disabled === true,
    readOnly: opts.readOnly === true
  });
  var tabList = scroll.getContentElement();
  var scrollRoot = scroll.getRootElement();
  scrollRoot.classList.add('qxframe9a7c2-tabs-scroll');
  tabList.classList.add('qxframe9a7c2-tabs-list');
  tabList.appendChild(indicator);

  var overflowScroll = Scroll.create({
    container: overflowScrollHost,
    axis: 'y',
    wheelAxis: 'y',
    wheelPropagation: true,
    scrollbarVisibility: 'auto',
    edgeShadow: true,
    keyboard: false,
    focusable: false,
    disabled: opts.disabled === true,
    readOnly: opts.readOnly === true
  });

  var overflowPopover = Popover.create({
    reference: moreButton,
    content: overflowContentHost,
    trigger: 'manual',
    placement: opts.placement === 'right' ? 'left-start' : (opts.placement === 'left' ? 'right-start' : (opts.placement === 'bottom' ? 'top-end' : 'bottom-end')),
    showArrow: false,
    size: opts.size,
    closeOnOutsidePress: true,
    closeOnEscape: true,
    disabled: opts.disabled === true,
    onOpenChange: function (open) {
      moreButton.classList.toggle('is-active', open === true);
      if (open === true) overflowScroll.refresh('tabs-overflow-open');
    }
  });

  var tabByKey = new Map();
  var tabShellByKey = new Map();
  var tabPartsByKey = new Map();
  var panelByKey = new Map();
  var panelTransitionByKey = new Map();
  var renderedPanelContent = new Set();
  var activeKey = '';
  var overflowKeys = [];
  var overflowRowsByKey = new Map();
  var overflowLayout = null;
  var keyboardNavigation = null;
  var indicatorMeasureCancel = null;
  var indicatorMutateCancel = null;

  function itemByKey(key) { return collection.itemByKey(String(key)); }
  function enabledEntries() { return collection.enabledEntries(); }
  function firstEnabledKey() {
    var entries = enabledEntries();
    return entries.length ? entries[0].key : '';
  }
  function validActive(candidate) {
    var item = candidate == null ? null : itemByKey(String(candidate));
    return item && item.disabled !== true ? String(candidate) : firstEnabledKey();
  }
  activeKey = validActive(own(source, 'activeKey') ? source.activeKey : source.defaultActiveKey);
  var activeItem = ActiveItem.create({
    getEntries: function () { return items; },
    getKey: function (item) { return item.key; },
    isDisabled: function (item) { return !item || item.disabled === true; },
    loop: true,
    activeKey: activeKey
  });
  var rovingProjection = RovingProjection.create({
    getEntries:function(){return Array.from(tabByKey.entries());}, getKey:function(entry){return entry[0];}, getElement:function(entry){return entry[1];},
    getActiveKey:function(){return activeItem.activeKey;}, isDisabled:function(entry){var item=itemByKey(entry[0]);return opts.disabled===true||!item||item.disabled===true;}, ensureOne:false
  });


  function userLocked(meta) {
    var sourceName = meta && meta.source ? meta.source : 'api';
    return sourceName !== 'api' && opts.disabled === true;
  }
  function editLocked(meta) {
    return !(meta && meta.force === true) && (InteractionPolicy.mutationLocked(opts));
  }
  function itemIndex(key) { return collection.indexOf(String(key)); }
  function tabId(key) { return root.id + '-tab-' + encodeURIComponent(String(key)).replace(/%/g, '_'); }
  function panelId(key) { return root.id + '-panel-' + encodeURIComponent(String(key)).replace(/%/g, '_'); }

  root.id = String(opts.id || opts.container.id || IdManager.next('tabs'));

  function syncTabRoving() {
    tabByKey.forEach(function (tab, key) {
      var item = itemByKey(key);
      var parts = tabPartsByKey.get(key);
      var surface = parts && parts.surface;
      var disabled = opts.disabled === true || !item || item.disabled === true;
      var selected = key === activeKey;
      tab.disabled = disabled;
      tab.classList.toggle('is-active', selected);
      tab.classList.toggle('is-disabled', disabled);
      tab.classList.toggle('is-readonly', opts.readOnly === true);
      if (surface) {
        surface.classList.toggle('is-active', selected);
        surface.classList.toggle('is-disabled', disabled);
        surface.classList.toggle('is-readonly', opts.readOnly === true);
      }
    });
    rovingProjection.sync();
  }

  function createTab(item) {
    var key = item.key;
    var shell = doc.createElement('div');
    var surface = doc.createElement('div');
    var tab = doc.createElement('button');
    var icon = doc.createElement('span');
    var label = doc.createElement('span');
    var badge = doc.createElement('span');
    var close = doc.createElement('button');
    shell.className = 'qxframe9a7c2-tabs-tab-shell';
    surface.className = 'qxframe9a7c2-tabs-tab';
    tab.className = 'qxframe9a7c2-tabs-tab-action';
    icon.className = 'qxframe9a7c2-tabs-icon';
    label.className = 'qxframe9a7c2-tabs-label';
    badge.className = 'qxframe9a7c2-tabs-badge';
    close.className = 'qxframe9a7c2-tabs-close';
    close.type = 'button';
    close.tabIndex = -1;
    tab.type = 'button';
    DOM.setPrivate(tab, 'tabsKey', key);
    tab.id = tabId(key);
    DOM.setPrivate(close, 'tabsClose', key);
    var closeGlyph = doc.createElement('span'); closeGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3'; close.appendChild(closeGlyph);
    tab.appendChild(label);
    surface.appendChild(tab);
    shell.appendChild(surface);
    tabByKey.set(key, tab);
    tabShellByKey.set(key, shell);
    tabPartsByKey.set(key, { surface: surface, icon: icon, label: label, badge: badge, close: close });
    return tab;
  }

  function updateTab(tab, item) {
    var parts = tabPartsByKey.get(item.key);
    var shell = tabShellByKey.get(item.key);
    if (!parts || !shell) return;
    var surface = parts.surface, icon = parts.icon, label = parts.label, badge = parts.badge, close = parts.close;
    var hasIcon = item.icon !== undefined && item.icon !== null && item.icon !== '';
    var hasBadge = item.badge !== undefined && item.badge !== null && item.badge !== '';
    if (hasIcon) { renderOutput(icon, item.icon, item, api, 'icon', doc); tab.insertBefore(icon, label); }
    else { icon.textContent = ''; if (icon.parentNode) icon.parentNode.removeChild(icon); }
    renderOutput(label, item.label, item, api, 'label', doc);
    if (hasBadge) { renderOutput(badge, item.badge, item, api, 'badge', doc); tab.appendChild(badge); }
    else { badge.textContent = ''; if (badge.parentNode) badge.parentNode.removeChild(badge); }
    var canClose = (opts.editable === true || opts.closable === true) && item.closable !== false && item.disabled !== true && opts.disabled !== true && opts.readOnly !== true;
    if (canClose) surface.appendChild(close); else if (close.parentNode) close.parentNode.removeChild(close);
    surface.classList.toggle('has-close', canClose);
    shell.classList.toggle('has-close', canClose);
  }

  function syncTabs() {
    var live = new Set();
    items.forEach(function (item) {
      var key = item.key;
      live.add(key);
      var tab = tabByKey.get(key) || createTab(item);
      updateTab(tab, item);
      tabList.appendChild(tabShellByKey.get(key) || tab);
    });
    Array.from(tabByKey.keys()).forEach(function (key) {
      if (live.has(key)) return;
      var tab = tabByKey.get(key);
      var shell = tabShellByKey.get(key);
      if (shell && shell.parentNode) shell.parentNode.removeChild(shell);
      else if (tab && tab.parentNode) tab.parentNode.removeChild(tab);
      tabByKey.delete(key);
      tabShellByKey.delete(key);
      tabPartsByKey.delete(key);
    });
    if (indicator.parentNode !== tabList) tabList.appendChild(indicator);
    syncTabRoving();
  }

  function cancelIndicatorLayout() {
    if (indicatorMeasureCancel) { indicatorMeasureCancel(); indicatorMeasureCancel = null; }
    if (indicatorMutateCancel) { indicatorMutateCancel(); indicatorMutateCancel = null; }
  }
  function scheduleIndicator(reason) {
    cancelIndicatorLayout();
    if (destroyed || opts.type !== 'line') { indicator.hidden = true; return; }
    var shell = tabShellByKey.get(String(activeKey));
    var surface = tabPartsByKey.get(String(activeKey));
    surface = surface && surface.surface;
    if (!shell || !surface || shell.hidden) { indicator.hidden = true; return; }
    indicatorMeasureCancel = Scheduler.measure(function () {
      indicatorMeasureCancel = null;
      if (destroyed || !indicator || !tabList || !surface || !surface.isConnected) return;
      var listRect = tabList.getBoundingClientRect();
      var surfaceRect = surface.getBoundingClientRect();
      var vertical = opts.orientation === 'vertical';
      var configured = opts.indicator && opts.indicator.size !== null ? opts.indicator.size : null;
      var align = opts.indicator ? opts.indicator.align : 'stretch';
      var length = configured !== null ? Math.min(configured, vertical ? surfaceRect.height : surfaceRect.width) : (vertical ? surfaceRect.height : surfaceRect.width);
      var offset = vertical ? surfaceRect.top - listRect.top : surfaceRect.left - listRect.left;
      var available = vertical ? surfaceRect.height : surfaceRect.width;
      if (align === 'center') offset += (available - length) / 2;
      else if (align === 'end') offset += available - length;
      var geometry = { vertical:vertical, offset:offset, length:length, reason:reason || 'sync' };
      indicatorMutateCancel = Scheduler.mutate(function () {
        indicatorMutateCancel = null;
        if (destroyed || !indicator) return;
        indicator.hidden = false;
        indicator.style.width = geometry.vertical ? '2px' : Math.max(0, geometry.length) + 'px';
        indicator.style.height = geometry.vertical ? Math.max(0, geometry.length) + 'px' : '2px';
        indicator.style.transform = geometry.vertical ? ('translate3d(0,' + geometry.offset + 'px,0)') : ('translate3d(' + geometry.offset + 'px,0,0)');
      });
    });
  }

  function panelContentValue(item) {
    return own(item, 'content') ? item.content : (own(item, 'children') ? item.children : '');
  }
  function destroyPanel(key) {
    var normalized = String(key);
    var transition = panelTransitionByKey.get(normalized);
    if (transition) transition.destroy();
    panelTransitionByKey.delete(normalized);
    var panel = panelByKey.get(normalized);
    if (panel && panel.parentNode) panel.parentNode.removeChild(panel);
    panelByKey.delete(normalized);
    renderedPanelContent.delete(normalized);
  }
  function createPanel(item, selected) {
    var panel = doc.createElement('div');
    panel.className = 'qxframe9a7c2-tabs-panel';
    panel.id = panelId(item.key);
    panel.tabIndex = -1;
    panel.hidden = !selected;
    panelByKey.set(item.key, panel);
    var transition = Transition.create({
      element: panel,
      transition: function () { return opts.transition || 'qxframe9a7c2-tabs-transition'; },
      visible: selected === true,
      appear: false,
      reducedMotion: function () { return opts.animated.panel !== true; },
      onBeforeEnter: function () { if (panel) panel.hidden = false; },
      onAfterLeave: function () { if (panel) panel.hidden = true; }
    });
    panelTransitionByKey.set(item.key, transition);
    return panel;
  }
  function renderPanelContent(panel, item, force) {
    if (!force && renderedPanelContent.has(item.key)) return;
    renderOutput(panel, panelContentValue(item), item, api, 'content', doc);
    renderedPanelContent.add(item.key);
  }
  function syncPanels(forceContent) {
    var live = new Set(items.map(function (item) { return item.key; }));
    Array.from(panelByKey.keys()).forEach(function (key) {
      if (live.has(key) && !(opts.destroyInactive === true && key !== activeKey)) return;
      destroyPanel(key);
    });
    items.forEach(function (item) {
      var selected = item.key === activeKey;
      if (opts.destroyInactive === true && !selected) return;
      var panel = panelByKey.get(item.key) || createPanel(item, selected);
      var transition = panelTransitionByKey.get(item.key);
      panel.classList.toggle('is-active', selected);
      if (selected) panel.hidden = false;
      renderPanelContent(panel, item, forceContent === true);
      panels.appendChild(panel);
      if (transition) transition.setVisible(selected, { source: 'tabs', reason: selected ? 'active-panel' : 'inactive-panel' });
      else panel.hidden = !selected;
    });
  }

  function syncRoot() {
    root.className = 'qxframe9a7c2-tabs is-' + opts.orientation + ' is-placement-' + opts.placement + ' is-' + opts.type + ' is-' + opts.size;
    if (opts.className) String(opts.className).split(/\s+/).filter(Boolean).forEach(function (name) { root.classList.add(name); });
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    root.classList.toggle('is-stretch', opts.stretch === true);
    root.classList.toggle('is-centered', opts.centered === true);
    root.classList.toggle('is-animated', opts.animated.indicator === true || opts.animated.panel === true);
    root.classList.toggle('is-animated-indicator', opts.animated.indicator === true);
    root.classList.toggle('is-animated-panel', opts.animated.panel === true);
    ['stretch','center','start','end'].forEach(function (align) { root.classList.toggle('is-indicator-' + align, (opts.indicator ? opts.indicator.align : 'stretch') === align); });
    if (opts.indicator && opts.indicator.size !== null) root.style.setProperty('--qxframe9a7c2-tabs-indicator-size', opts.indicator.size + 'px');
    else root.style.removeProperty('--qxframe9a7c2-tabs-indicator-size');
    var showAdd = (opts.editable === true || opts.addable === true) && opts.addable !== false && opts.disabled !== true && opts.readOnly !== true;
    if (showAdd) nav.appendChild(addButton); else if (addButton.parentNode) addButton.parentNode.removeChild(addButton);
    scroll.updateOptions({
      axis: opts.orientation === 'vertical' ? 'y' : 'x',
      wheelAxis: opts.orientation === 'vertical' ? 'y' : 'x',
      wheelPropagation: opts.wheelPropagation !== false,
      edgeShadow: opts.edgeShadow !== false,
      focusable: false,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true
    });
    overflowScroll.updateOptions({
      axis: 'y',
      wheelAxis: 'y',
      focusable: false,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true
    });
    overflowPopover.updateOptions({
      placement: opts.placement === 'right' ? 'left-start' : (opts.placement === 'left' ? 'right-start' : (opts.placement === 'bottom' ? 'top-end' : 'bottom-end')),
      size: opts.size,
      disabled: opts.disabled === true
    });
  }

  function setOverflowShellVisibility(hiddenKeys) {
    var hidden = new Set(hiddenKeys || []);
    tabShellByKey.forEach(function (shell, key) { if (shell) shell.hidden = hidden.has(key); });
  }

  function measureAvailableLength() {
    var viewport = scroll.getViewportElement();
    if (!viewport) return 0;
    var vertical = opts.orientation === 'vertical';
    var rect = viewport.getBoundingClientRect ? viewport.getBoundingClientRect() : null;
    var measured = Number(rect && (vertical ? rect.height : rect.width));
    if (!(measured > 0)) measured = Number(vertical ? viewport.clientHeight : viewport.clientWidth) || 0;
    return Math.max(0, measured);
  }

  function measureShellLength(shell) {
    if (!shell) return 0;
    var vertical = opts.orientation === 'vertical';
    var rect = shell.getBoundingClientRect ? shell.getBoundingClientRect() : null;
    var length = Math.max(0, Number(rect && (vertical ? rect.height : rect.width) || (vertical ? shell.offsetHeight : shell.offsetWidth) || 0));
    var computed = view.getComputedStyle ? view.getComputedStyle(shell) : null;
    if (computed) {
      var before = parseFloat(vertical ? computed.marginTop : computed.marginLeft);
      var after = parseFloat(vertical ? computed.marginBottom : computed.marginRight);
      if (Number.isFinite(before)) length += before;
      if (Number.isFinite(after)) length += after;
    }
    return Math.max(0, length);
  }

  function tabListGap() {
    var computed = view.getComputedStyle ? view.getComputedStyle(tabList) : null;
    if (!computed) return 0;
    var value = opts.orientation === 'vertical' ? (computed.rowGap || computed.gap) : (computed.columnGap || computed.gap);
    return Math.max(0, Number(parseFloat(value)) || 0);
  }

  // Tabs follows the mature Tags responsive projection: measure complete stable shells,
  // reserve the disclosure in the real flex layout, then hide a trailing shell suffix.
  // Tabs keeps its own active/navigation semantics, so sharing a second state owner with
  // Tags would violate the one-owner rule; only the measurement/projection algorithm is shared.
  function responsiveVisibleCount() {
    var shells = items.map(function (item) { return tabShellByKey.get(item.key); });
    shells.forEach(function (shell) { if (shell) shell.hidden = false; });
    if (opts.overflow === false || !items.length) return items.length;
    if (moreButton.parentNode === nav) moreButton.parentNode.removeChild(moreButton);
    var gap = tabListGap();
    var lengths = shells.map(measureShellLength);
    var available = measureAvailableLength();
    if (!(available > 0) || ResponsiveOverflow.requiredSize(lengths, lengths.length, gap, []) <= available) return items.length;

    // Insert the actual disclosure before measuring the final Scroll viewport. This lets the
    // nav flex layout reserve add/more controls exactly once instead of duplicating width math.
    nav.insertBefore(moreButton, addButton.parentNode === nav ? addButton : null);
    available = measureAvailableLength();
    return ResponsiveOverflow.fitPrefix({ lengths:lengths, available:available, gap:gap, tolerance:0.5 });
  }

  function syncOverflowPopupContent() {
    if (!overflowContentHost) return;
    if (typeof opts.overflowPopupRender !== 'function') {
      while (overflowContentHost.firstChild && overflowContentHost.firstChild !== overflowScrollHost) overflowContentHost.removeChild(overflowContentHost.firstChild);
      if (overflowScrollHost.parentNode !== overflowContentHost) overflowContentHost.appendChild(overflowScrollHost);
      return;
    }
    var output = opts.overflowPopupRender(overflowScrollHost, { keys:overflowKeys.slice(), items:overflowKeys.map(itemByKey).filter(Boolean), activeKey:activeKey, close:closeOverflow, tabs:api });
    if (output === undefined || output === null || output === false) output = overflowScrollHost;
    Renderer.replace(overflowContentHost, output, doc);
  }

  function createOverflowRow(item) {
    var row = doc.createElement('div');
    var button = doc.createElement('button');
    var label = doc.createElement('span');
    var close = doc.createElement('button');
    row.className = 'qxframe9a7c2-tabs-overflow-item qxframe9a7c2-overflow-item';
    button.type = 'button';
    button.className = 'qxframe9a7c2-tabs-overflow-action qxframe9a7c2-overflow-action';
    label.className = 'qxframe9a7c2-tabs-overflow-label qxframe9a7c2-overflow-label';
    close.type = 'button';
    close.tabIndex = -1;
    close.className = 'qxframe9a7c2-tabs-overflow-close qxframe9a7c2-overflow-close';
    var closeGlyph = doc.createElement('span'); closeGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3'; close.appendChild(closeGlyph);
    button.appendChild(label);
    row.appendChild(button);
    var record = { key: item.key, item: item, row: row, button: button, label: label, close: close };
    patchOverflowRow(record, item);
    return record;
  }

  function patchOverflowRow(record, item) {
    record.item = item;
    record.key = item.key;
    DOM.setPrivate(record.row, 'tabsOverflowRow', item.key);
    DOM.setPrivate(record.button, 'tabsOverflowKey', item.key);
    DOM.setPrivate(record.close, 'tabsOverflowClose', item.key);
    record.row.setAttribute('data-qxframe9a7c2-tabs-overflow-key', item.key);
    record.row.classList.toggle('is-selected', item.key === activeKey);
    record.button.disabled = opts.disabled === true || item.disabled === true;
    renderOutput(record.label, item.label, item, api, 'overflow-label', doc);
    var canClose = (opts.editable === true || opts.closable === true) && item.closable !== false && item.disabled !== true && opts.disabled !== true && opts.readOnly !== true;
    if (canClose) {
      if (record.close.parentNode !== record.row) record.row.appendChild(record.close);
    } else if (record.close.parentNode) record.close.parentNode.removeChild(record.close);
  }

  function reconcileOverflowRows() {
    var seen = new Set();
    overflowKeys.forEach(function (key) {
      var item = itemByKey(key);
      if (!item) return;
      var record = overflowRowsByKey.get(key);
      if (!record) { record = createOverflowRow(item); overflowRowsByKey.set(key, record); }
      else patchOverflowRow(record, item);
      seen.add(key);
    });
    Array.from(overflowRowsByKey.keys()).forEach(function (key) {
      if (seen.has(key)) return;
      var record = overflowRowsByKey.get(key);
      if (record && record.row.parentNode) record.row.parentNode.removeChild(record.row);
      overflowRowsByKey.delete(key);
    });
    var cursor = overflowPanel.firstChild;
    overflowKeys.forEach(function (key) {
      var record = overflowRowsByKey.get(key);
      if (!record) return;
      if (record.row !== cursor) overflowPanel.insertBefore(record.row, cursor);
      cursor = record.row.nextSibling;
    });
  }

  function syncOverflowPanel() {
    reconcileOverflowRows();
    var maxHeight = Number(opts.overflowMaxHeight);
    if (!Number.isFinite(maxHeight) || maxHeight <= 0) maxHeight = 240;
    overflowScrollHost.style.height = Math.min(maxHeight, Math.max(32, overflowKeys.length * 36)) + 'px';
    syncOverflowPopupContent();
    overflowScroll.refresh('tabs-overflow-content');
  }

  function refreshOverflow(reason) {
    if (destroyed) return;
    setOverflowShellVisibility([]);
    var visibleCount = responsiveVisibleCount();
    var showMore = opts.overflow !== false && visibleCount < items.length;
    overflowKeys = showMore ? items.slice(visibleCount).map(function (item) { return item.key; }) : [];
    if (showMore) nav.insertBefore(moreButton, addButton.parentNode === nav ? addButton : null);
    else if (moreButton.parentNode) moreButton.parentNode.removeChild(moreButton);
    setOverflowShellVisibility(overflowKeys);
    scheduleIndicator('overflow');
    scroll.refresh('tabs-overflow');
    syncOverflowPanel();
    if (!showMore) closeOverflow();
  }
  overflowLayout = ResponsiveOverflow.create({ element:[nav, scroll.getViewportElement()], enabled:true, onMeasure:refreshOverflow });
  scope.add(function(){ if(overflowLayout) overflowLayout.destroy(); overflowLayout=null; });
  function scheduleOverflow(reason) { if(overflowLayout) overflowLayout.request(reason || 'tabs-overflow'); return api; }
  function openOverflow() {
    if (destroyed || moreButton.parentNode !== nav || opts.disabled === true) return false;
    return overflowPopover.open('tabs-overflow');
  }
  function closeOverflow() {
    if (destroyed) return false;
    return overflowPopover.close('tabs-overflow');
  }
  function ensureActiveVisible() {
    var tab = tabByKey.get(activeKey);
    if (tab) scroll.scrollToElement(tabShellByKey.get(String(activeKey)) || tab, { axis: opts.orientation === 'vertical' ? 'y' : 'x', align: 'nearest' });
    scheduleOverflow('active-visible');
  }

  function emitChange(previousKey, meta) {
    var item = itemByKey(activeKey);
    var detail = {
      activeKey: activeKey, previousActiveKey: previousKey, item: item,
      source: meta && meta.source || 'api', reason: meta && meta.reason || 'change',
      originalEvent: meta && meta.originalEvent || null, instance: api
    };
    if (typeof opts.onChange === 'function') opts.onChange(activeKey, detail);
    if (!destroyed) api.emit('change', detail);
    return detail;
  }
  function setActiveKey(next, meta) {
    if (destroyed || userLocked(meta)) return false;
    var key = String(next);
    var item = itemByKey(key);
    if (!item || item.disabled === true) return false;
    var previous = activeKey;
    if (previous === key) {
      activeItem.set(key, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'active-sync' });
      syncTabRoving();
      if (meta && meta.focus === true) focusTab(key, meta);
      return false;
    }
    var detail = {
      activeKey: key, previousActiveKey: previous, item: item,
      source: meta && meta.source || 'api', reason: meta && meta.reason || 'set-active',
      originalEvent: meta && meta.originalEvent || null, instance: api
    };
    if (typeof opts.onBeforeChange === 'function') {
      var allowed = opts.onBeforeChange(key, previous, detail);
      if (destroyed || allowed === false) return false;
    }
    activeKey = key;
    activeItem.set(key, { silent: true, source: detail.source, reason: 'active-sync', originalEvent: detail.originalEvent });
    syncTabRoving();
    scheduleIndicator('active');
    syncPanels(false);
    syncOverflowPanel();
    ensureActiveVisible();
    if (meta && meta.focus === true) focusTab(key, meta);
    if (!meta || meta.silent !== true) emitChange(previous, meta);
    return true;
  }

  function focusTab(key, meta) {
    var normalized = String(key);
    var tab = tabByKey.get(normalized);
    var item = itemByKey(normalized);
    if (!tab || !item || item.disabled === true) return false;
    activeItem.set(normalized, { silent: true, source: meta && meta.source || 'api', reason: meta && meta.reason || 'focus' });
    syncTabRoving();
    if (tab.disabled) return false;
    DOM.focusElement(tab);
    return doc.activeElement === tab;
  }
  function ensureKeyVisible(key) {
    var tab = tabByKey.get(String(key));
    if (tab) scroll.scrollToElement(tab, { axis: opts.orientation === 'vertical' ? 'y' : 'x', align: 'nearest' });
    scheduleOverflow('focus-visible');
  }
  function installKeyboardNavigation() {
    if (keyboardNavigation) keyboardNavigation.destroy();
    keyboardNavigation = KeyboardNavigation.create({
      root: tabList,
      activeItem: activeItem,
      orientation: opts.orientation,
      ensureVisible: function (key) { ensureKeyVisible(key); },
      shouldHandle: function (context) {
        if (opts.disabled === true) return false;
        var target = context && context.target;
        var tab = target ? DOM.closestPrivate(target, tabList, 'tabsKey') : null;
        return !!(tab && tabList.contains(tab) && tab.disabled !== true);
      },
      onNavigate: function (context) {
        var key = activeItem.activeKey;
        if (!key) return;
        focusTab(key, { source: 'keyboard', reason: context && context.reason || 'navigate', originalEvent: context && context.originalEvent || null });
        if (opts.activationMode === 'auto') {
          setActiveKey(key, { source: 'keyboard', reason: context && context.reason || 'navigate', originalEvent: context && context.originalEvent || null });
        }
      },
      handlers: {
        Delete: function (context) {
          if (!(opts.editable === true || opts.closable === true)) return false;
          return remove(activeItem.activeKey, { source: 'keyboard', reason: 'remove', originalEvent: context && context.originalEvent || null });
        },
        Backspace: function (context) {
          if (!(opts.editable === true || opts.closable === true)) return false;
          return remove(activeItem.activeKey, { source: 'keyboard', reason: 'remove', originalEvent: context && context.originalEvent || null });
        }
      }
    });
  }

  function emitEdit(action, item, index, meta) {
    var detail = {
      action: action, key: item ? item.key : '', item: item || null, index: index,
      items: items.slice(), source: meta && meta.source || 'api', reason: meta && meta.reason || action,
      originalEvent: meta && meta.originalEvent || null, instance: api
    };
    var callbackResult;
    if (typeof opts.onEdit === 'function') callbackResult = opts.onEdit(item ? item.key : undefined, action, detail);
    if (!destroyed) api.emit('edit', detail);
    return { detail: detail, callbackResult: callbackResult };
  }
  function beforeEdit(action, item, index, meta) {
    var detail = {
      action: action, key: item ? item.key : '', item: item || null, index: index,
      items: items.slice(), source: meta && meta.source || 'api', reason: meta && meta.reason || action,
      originalEvent: meta && meta.originalEvent || null, instance: api
    };
    if (typeof opts.onBeforeEdit !== 'function') return true;
    var allowed = opts.onBeforeEdit(detail);
    return !destroyed && allowed !== false;
  }
  function syncCollection(nextItems) {
    items = nextItems.slice();
    collection.setItems(items, { silent: true, source: 'tabs', reason: 'tabs-items' });
  }
  function chooseFallback(index) {
    var enabled = items.filter(function (item) { return item.disabled !== true; });
    if (!enabled.length) return '';
    var right = items[index] && items[index].disabled !== true ? items[index] : null;
    if (right) return right.key;
    for (var i = Math.min(index, items.length - 1); i >= 0; i -= 1) if (items[i] && items[i].disabled !== true) return items[i].key;
    return enabled[0].key;
  }
  function remove(key, meta) {
    if (destroyed || editLocked(meta)) return false;
    var normalized = String(key);
    var index = itemIndex(normalized);
    if (index < 0) return false;
    var item = items[index];
    if (item.disabled === true || item.closable === false || !(opts.editable === true || opts.closable === true)) return false;
    if (!beforeEdit('remove', item, index, meta)) return false;
    var previousActive = activeKey;
    var next = items.slice();
    next.splice(index, 1);
    syncCollection(next);
    if (!itemByKey(activeKey) || activeKey === normalized) activeKey = chooseFallback(index);
    activeItem.set(activeKey, { silent: true, source: 'tabs', reason: 'remove-fallback' });
    render(true);
    emitEdit('remove', item, index, meta);
    if (destroyed) return false;
    if (previousActive !== activeKey && (!meta || meta.silent !== true)) emitChange(previousActive, Utils.mergeOwn( meta || {}, { reason: 'remove' }));
    return !destroyed;
  }
  function add(item, meta) {
    if (destroyed || editLocked(meta)) return false;
    var nextItem = normalizeItem(item, items.length);
    if (itemByKey(nextItem.key)) throw new TypeError('[QXFRAME9A7C2] Tabs item keys must be unique: ' + nextItem.key + '.');
    syncCollection(items.concat([nextItem]));
    render(true);
    if (!meta || meta.activate !== false) setActiveKey(nextItem.key, Utils.mergeOwn( meta || {}, { reason: meta && meta.reason || 'add' }));
    return true;
  }
  function setItems(nextItems, meta) {
    var previousActive = activeKey;
    syncCollection(normalizeItems(nextItems || []));
    activeKey = validActive(activeKey);
    if (!itemByKey(activeItem.activeKey) || itemByKey(activeItem.activeKey).disabled === true) activeItem.set(activeKey, { silent: true, source: 'tabs', reason: 'items-fallback' });
    render(true);
    if (previousActive !== activeKey && (!meta || meta.silent !== true)) emitChange(previousActive, Utils.mergeOwn( meta || {}, { reason: meta && meta.reason || 'set-items' }));
    return api;
  }

  function render(forcePanelContent) {
    if (destroyed) return api;
    syncRoot();
    syncTabs();
    syncPanels(forcePanelContent === true);
    scheduleIndicator('render');
    installKeyboardNavigation();
    scheduleOverflow('render');
    return api;
  }

  function applyOptions(nextOptions, patch) {
    if (destroyed) return api;
    var next = patch || {};
    var candidate = normalizeOptions(Utils.mergeOwn(nextOptions, { items: own(next, 'items') ? nextOptions.items : items }), next);
    var nextItems = candidate.items.slice();
    candidate.items = nextItems;
    opts = candidate;
    syncCollection(nextItems);
    if (own(next, 'activeKey')) {
      activeKey = validActive(next.activeKey);
      activeItem.set(activeKey, { silent: true, source: 'tabs', reason: 'options-active' });
    } else {
      activeKey = validActive(activeKey);
      if (!itemByKey(activeItem.activeKey) || itemByKey(activeItem.activeKey).disabled === true) activeItem.set(activeKey, { silent: true, source: 'tabs', reason: 'options-fallback' });
    }
    render(own(next, 'items'));
    return api;
  }

  scope.add(DOM.listen(tabList, 'pointerdown', function (event) {
    var close = event.target ? DOM.closestPrivate(event.target, tabList, 'tabsClose') : null;
    if (close && tabList.contains(close) && event.preventDefault) event.preventDefault();
  }));
  scope.add(DOM.listen(tabList, 'click', function (event) {
    var close = event.target ? DOM.closestPrivate(event.target, tabList, 'tabsClose') : null;
    if (close && tabList.contains(close)) {
      event.preventDefault();
      event.stopPropagation();
      remove(DOM.getPrivate(close, 'tabsClose'), { source: DOM.activationSource(event), reason: 'remove', originalEvent: event });
      return;
    }
    var tab = event.target ? DOM.closestPrivate(event.target, tabList, 'tabsKey') : null;
    if (!tab || !tabList.contains(tab)) return;
    setActiveKey(DOM.getPrivate(tab, 'tabsKey'), { source: DOM.activationSource(event), reason: 'click', originalEvent: event, focus: true });
  }));
  scope.add(DOM.listen(tabList, 'focusin', function (event) {
    var tab = event.target ? DOM.closestPrivate(event.target, tabList, 'tabsKey') : null;
    if (!tab || !tabList.contains(tab) || tab.disabled) return;
    tabPartsByKey.forEach(function (parts) { if (parts && parts.surface) parts.surface.classList.remove('is-keyboard-focus'); });
    var parts = tabPartsByKey.get(String(DOM.getPrivate(tab, 'tabsKey')));
    if (parts && parts.surface && tab.matches && tab.matches(':focus-visible')) parts.surface.classList.add('is-keyboard-focus');
    activeItem.set(DOM.getPrivate(tab, 'tabsKey'), { silent: true, source: 'dom', reason: 'focus' });
    syncTabRoving();
  }));
  scope.add(DOM.listen(tabList, 'focusout', function (event) {
    var tab = event.target ? DOM.closestPrivate(event.target, tabList, 'tabsKey') : null;
    if (!tab) return;
    var parts = tabPartsByKey.get(String(DOM.getPrivate(tab, 'tabsKey')));
    if (parts && parts.surface) parts.surface.classList.remove('is-keyboard-focus');
  }));
  scope.add(DOM.listen(moreButton, 'click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    if (overflowPopover.getState().open) closeOverflow(); else openOverflow();
  }));
  scope.add(DOM.listen(overflowPanel, 'pointerdown', function (event) {
    var close = event.target ? DOM.closestPrivate(event.target, overflowPanel, 'tabsOverflowClose') : null;
    if (close && overflowPanel.contains(close) && event.preventDefault) event.preventDefault();
  }));
  scope.add(DOM.listen(overflowPanel, 'click', function (event) {
    event.stopPropagation();
    var close = event.target ? DOM.closestPrivate(event.target, overflowPanel, 'tabsOverflowClose') : null;
    if (close && overflowPanel.contains(close)) {
      event.preventDefault();
      var closeKey = DOM.getPrivate(close, 'tabsOverflowClose');
      remove(closeKey, { source: DOM.activationSource(event), reason: 'overflow-close', originalEvent: event });
      closeOverflow();
      return;
    }
    var button = event.target ? DOM.closestPrivate(event.target, overflowPanel, 'tabsOverflowKey') : null;
    if (!button || !overflowPanel.contains(button)) return;
    var key = DOM.getPrivate(button, 'tabsOverflowKey');
    setActiveKey(key, { source: DOM.activationSource(event), reason: 'overflow', originalEvent: event, focus: true });
    closeOverflow();
  }));
  scope.add(DOM.listen(addButton, 'click', function (event) {
    if (InteractionPolicy.mutationLocked(opts)) return;
    var detail = { action: 'add', items: items.slice(), source: DOM.activationSource(event), reason: 'add-button', originalEvent: event, instance: api };
    if (typeof opts.onBeforeEdit === 'function') {
      var allowed = opts.onBeforeEdit(detail);
      if (destroyed || allowed === false) return;
    }
    var candidate;
    if (typeof opts.createItem === 'function') candidate = opts.createItem(detail);
    if (destroyed) return;
    if (candidate === undefined && typeof opts.onAdd === 'function') candidate = opts.onAdd(detail);
    if (destroyed) return;
    var editResult = emitEdit('add', null, items.length, { source: DOM.activationSource(event), reason: 'add-button', originalEvent: event });
    if (destroyed) return;
    if (candidate === undefined && editResult.callbackResult && typeof editResult.callbackResult === 'object') candidate = editResult.callbackResult;
    if (candidate !== undefined && candidate !== null) add(candidate, { source: DOM.activationSource(event), reason: 'add-button', originalEvent: event });
  }));
  scope.add(scroll.on('scroll', function () { scheduleOverflow('scroll'); }));
  scope.add(scroll.on('refresh', function (detail) { if (detail && detail.reason === 'tabs-overflow') return; scheduleOverflow('scroll-refresh'); }));

  scope.add(DOM.listen(nav, 'transitionend', function(){ scheduleIndicator('resize'); }));

  function getState() {
    return Object.freeze({
      activeKey: activeKey,
      focusKey: activeItem.activeKey,
      placement: opts.placement,
      animated: { indicator:opts.animated.indicator === true, panel:opts.animated.panel === true },
      items: items.slice(),
      orientation: opts.orientation,
      type: opts.type,
      activationMode: opts.activationMode,
      centered: opts.centered === true,
      indicator: opts.indicator ? { align: opts.indicator.align, size: opts.indicator.size } : null,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      overflowOpen: overflowPopover.getState().open,
      overflowKeys: overflowKeys.slice(),
      overflowPopupCustomized: typeof opts.overflowPopupRender === 'function',
      destroyed: destroyed
    });
  }
  function destroyRuntime() {
    if (destroyed) return false;
    destroyed = true;
    scope.dispose();
    if (keyboardNavigation) keyboardNavigation.destroy();
    keyboardNavigation = null;
    cancelIndicatorLayout();
    panelTransitionByKey.forEach(function (transition) { transition.destroy(); });
    panelTransitionByKey.clear();
    rovingProjection.destroy();
    activeItem.destroy();
    overflowScroll.destroy();
    overflowPopover.destroy();
    scroll.destroy();
    collection.destroy();
    tabByKey.clear();
    tabShellByKey.clear();
    overflowRowsByKey.clear();
    panelByKey.clear();
    renderedPanelContent.clear();
    if (root && root.parentNode) root.parentNode.removeChild(root);
    root = nav = scrollHost = moreButton = overflowContentHost = overflowScrollHost = overflowPanel = addButton = panels = tabList = scrollRoot = indicator = null;
    overflowScroll = overflowPopover = null;
    return true;
  }

  var record = {
    setActiveKey: function (key, meta) { setActiveKey(key, meta); return api; },
    remove: function (key, meta) { remove(key, meta); return api; },
    add: function (item, meta) { add(item, meta); return api; },
    setItems: setItems,
    applyOptions: applyOptions,
    setDisabled: function (value) { return api.updateOptions({ disabled: value === true }); },
    setReadOnly: function (value) { return api.updateOptions({ readOnly: value === true }); },
    openOverflow: function () { openOverflow(); return api; },
    closeOverflow: function () { closeOverflow(); return api; },
    refreshOverflow: function () { scheduleOverflow('api'); return api; },
    getState: getState,
    getItems: function () { return items.slice(); },
    getActiveItem: function () { return activeItem; },
    getKeyboardNavigation: function () { return keyboardNavigation; },
    getScroll: function () { return scroll; },
    getOverflowScroll: function () { return overflowScroll; },
    getOverflowPopover: function () { return overflowPopover; },
    getRootElement: function () { return root; },
    getNavElement: function () { return nav; },
    getTabListElement: function () { return tabList; },
    getPanelsElement: function () { return panels; },
    getOverflowButton: function () { return moreButton; },
    getOverflowPanel: function () { return overflowPopover ? overflowPopover.getPopupElement() : null; },
    getOverflowListElement: function () { return overflowPanel; },
    getOverflowOriginElement: function () { return overflowScrollHost; },
    getTabElement: function (key) { return tabByKey.get(String(key)) || null; },
    getPanelElement: function (key) { return panelByKey.get(String(key)) || null; },
    getPanelTransition: function (key) { return panelTransitionByKey.get(String(key)) || null; },
    getActiveKey: function () { return activeKey; },
    isDisabled: function () { return opts.disabled === true; },
    isReadOnly: function () { return opts.readOnly === true; }
  };
  tabsState.set(instance, record);
  instance.own(destroyRuntime);


  render(true);
  return root;
}

function recordForTabs(instance) {
  var record = tabsState.get(instance);
  if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Tabs instance.');
  return record;
}
function canonicalTabsOptions(source, previousItems) {
  var input = source || {};
  var items = own(input, 'items') ? input.items : (previousItems || TABS_DEFAULTS.items);
  return normalizeOptions(Utils.mergeOwn(TABS_DEFAULTS, input, { items: items }), input);
}

export class Tabs extends Component {
  static options = TABS_DEFAULTS;
  static immutableOptions = IMMUTABLE_OPTIONS;
  static contract = ComponentContracts.get('Tabs');

  constructor(options = {}) { super(canonicalTabsOptions(options)); }

  updateOptions(nextOptions = {}) {
    var next = nextOptions || {};
    var record = tabsState.get(this);
    var currentItems = record ? record.getItems() : this.options.items;
    var candidate = normalizeOptions(Utils.mergeOwn(this.options, next, { items: own(next, 'items') ? next.items : currentItems }), next);
    var patch = Utils.mergeOwn(next);
    ['type','activationMode','size','centered','animated','indicator','items'].forEach(function (key) { if (own(next, key)) patch[key] = candidate[key]; });
    if (own(next, 'placement') || own(next, 'orientation')) { patch.placement = candidate.placement; patch.orientation = candidate.orientation; }
    return super.updateOptions(patch);
  }

  [componentHooks.render]() { var record = tabsState.get(this); return record ? record.getRootElement() : setupTabs(this); }
  [componentHooks.optionsUpdated](next, _previous, patch) { var record = tabsState.get(this); if (record) record.applyOptions(next, patch); }

  setActiveKey(key, meta) { return recordForTabs(this).setActiveKey(key, meta); }
  remove(key, meta) { return recordForTabs(this).remove(key, meta); }
  add(item, meta) { return recordForTabs(this).add(item, meta); }
  setItems(items, meta) { return recordForTabs(this).setItems(items, meta); }
  setDisabled(value) { return this.updateOptions({ disabled: value === true }); }
  setReadOnly(value) { return this.updateOptions({ readOnly: value === true }); }
  openOverflow() { return recordForTabs(this).openOverflow(); }
  closeOverflow() { return recordForTabs(this).closeOverflow(); }
  refreshOverflow() { return recordForTabs(this).refreshOverflow(); }
  getState() { return recordForTabs(this).getState(); }
  getItems() { return recordForTabs(this).getItems(); }
  getActiveItem() { return recordForTabs(this).getActiveItem(); }
  getKeyboardNavigation() { return recordForTabs(this).getKeyboardNavigation(); }
  getScroll() { return recordForTabs(this).getScroll(); }
  getOverflowScroll() { return recordForTabs(this).getOverflowScroll(); }
  getOverflowPopover() { return recordForTabs(this).getOverflowPopover(); }
  getRootElement() { return recordForTabs(this).getRootElement(); }
  getNavElement() { return recordForTabs(this).getNavElement(); }
  getTabListElement() { return recordForTabs(this).getTabListElement(); }
  getPanelsElement() { return recordForTabs(this).getPanelsElement(); }
  getOverflowButton() { return recordForTabs(this).getOverflowButton(); }
  getOverflowPanel() { return recordForTabs(this).getOverflowPanel(); }
  getOverflowListElement() { return recordForTabs(this).getOverflowListElement(); }
  getOverflowOriginElement() { return recordForTabs(this).getOverflowOriginElement(); }
  getTabElement(key) { return recordForTabs(this).getTabElement(key); }
  getPanelElement(key) { return recordForTabs(this).getPanelElement(key); }
  getPanelTransition(key) { return recordForTabs(this).getPanelTransition(key); }
  get activeKey() { return recordForTabs(this).getActiveKey(); }
  get disabled() { return recordForTabs(this).isDisabled(); }
  get readOnly() { return recordForTabs(this).isReadOnly(); }
}

export default Tabs;
