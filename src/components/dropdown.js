// Stage 50→58 migration: Dropdown family member backed by PopupComponent.
import { PopupComponent } from './popup.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Utils } from '../utils/utils.js';
import { Selection } from '../core/selection.js';
import { ItemSchema } from '../core/itemSchema.js';
import { HierarchicalSelection } from '../core/hierarchicalSelection.js';
import { ItemAccessors } from '../core/itemAccessors.js';
import { TreeQuery } from '../utils/treeQuery.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { ItemCollection } from './item-collection.js';
import { Trigger } from './trigger.js';
import { Scroll } from './scroll.js';

const state = new WeakMap();
const own = Utils.own;
function resolveElement(value, documentRef, label) { return DOM.requireElement(value, documentRef, 'Dropdown ' + label); }
function validateItems(items) {
  return ItemSchema.validate(items, {
    label: 'Dropdown items', keyOf: function (item) { return item.key; }, childrenOf: function (item) { return item.items; },
    validateItem: function (item) {
      if (item.id !== undefined) throw new TypeError('[QXFRAME9A7C2] Dropdown item.id is not canonical. Use item.key.');
      if (item.children !== undefined || item.options !== undefined) throw new TypeError('[QXFRAME9A7C2] Dropdown nested actions use item.items only.');
      if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] Dropdown item.key is required.');
      if (item.type !== 'divider' && item.type !== 'title' && item.type !== 'group') {
        if (item.value === undefined || item.value === null) throw new TypeError('[QXFRAME9A7C2] Dropdown leaf/action item.value is required.');
        if (item.label === undefined || item.label === null) throw new TypeError('[QXFRAME9A7C2] Dropdown item.label is required.');
      }
    }
  });
}
function requireState(instance) { const record = state.get(instance); if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Dropdown instance.'); return record; }

function initializeDropdown(instance, options) {
  var opts = Object.assign({
    trigger: 'click', placement: 'bottom-start', closeOnSelect: undefined,
    searchable: false, selectable: true, multiple: false, disabled: false, readOnly: false,
    size: 'md', selectionAppearance: 'check-start', showArrow: false, arrowPadding: 8, flipOnOverflow: true, open: false, openDelay: undefined, closeDelay: undefined,
    submenuTrigger: 'hover', submenuOpenDelay: 80, submenuLeaveDelay: 120, submenuOffset: 8
  }, options || {});
  validateItems(opts.items);
  var doc = opts.document || globalThis.document;
  var reference = resolveElement(opts.reference, doc, 'reference');
  var portalContainer = opts.portalContainer ? resolveElement(opts.portalContainer, doc, 'portalContainer') : doc.body;
  if (!portalContainer) throw new TypeError('[QXFRAME9A7C2] Dropdown requires document.body or portalContainer.');
      
  var scope = Lifecycle.createScope();
  var selection = Selection.create({ multiple: opts.multiple === true, value: opts.value !== undefined ? opts.value : opts.defaultValue });
  scope.add(function () { selection.destroy(); });
  var panel = doc.createElement('div');
  var arrow = doc.createElement('div');
  panel.className = 'qxframe9a7c2-dropdown-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset'; panel.hidden = true;
  arrow.className = 'qxframe9a7c2-dropdown-arrow';
  var triggerSession = null;
  var rootSurface = null;
  var allSurfaces = [];
  var childTriggerRecords = [];
  var initialSelectionValues = selection.values;
  var selectionAnchorValue = initialSelectionValues.length ? initialSelectionValues[initialSelectionValues.length - 1] : null;
  var destroyed = false;
  var api = instance;
  var keyboard = null;
      
  function childrenOf(item) { return item && Array.isArray(item.items) ? item.items : []; }
  var itemAccessors=ItemAccessors.create({
    getKey:function(item){return item && item.key;},
    getValue:function(item){return item && item.value;},
    getLabel:function(item){return item && item.label;},
    getChildren:childrenOf,
    isDisabled:function(item){return !item || item.disabled===true;}
  });
  function hasChildren(item) { return childrenOf(item).length > 0; }
  var hierarchy = HierarchicalSelection.create({
    childrenOf:childrenOf, keyOf:function(item){return rawValue(item && item.value);},
    disabledOf:function(item){return !item || item.disabled===true || item.type==='divider' || item.type==='title' || item.type==='group';},
    isLeaf:function(item,_index,children){return !!item && item.value!==undefined && children.length===0 && item.type!=='divider' && item.type!=='title' && item.type!=='group';}
  });
  function isLocked() { return InteractionPolicy.mutationLocked(opts); }
  function shouldCloseOnSelect() { return opts.closeOnSelect !== undefined ? opts.closeOnSelect !== false : opts.multiple !== true; }
  function rawValue(value) { return value === undefined || value === null ? '' : String(value); }
  function hasSelectedDescendant(item) { return hierarchy.stateFor(item, selection.values).selectedCount > 0; }
  function branchLeafValues(item) { return hierarchy.leafKeys(item); }
  function branchCheckState(item) {
    var values=branchLeafValues(item);
    if(!values.length) return {checked:!!(item&&item.value!==undefined&&selection.has(rawValue(item.value))),indeterminate:false};
    var state=hierarchy.stateFor(item, selection.values);
    return {checked:state.checked,indeterminate:state.indeterminate};
  }
      
  function pathForItem(target) { return TreeQuery.findPath(opts.items, target, { accessors:itemAccessors, by:'item' }); }
      
  function pathByValue(value) { return TreeQuery.findPath(opts.items, rawValue(value), { accessors:itemAccessors, by:'value' }); }
      
  function selectedAnchorPath() {
    var values = selection.values, path = selectionAnchorValue === null ? [] : pathByValue(selectionAnchorValue);
    if (path.length && values.some(function (value) { return rawValue(value) === rawValue(selectionAnchorValue); })) return path;
    for (var i = values.length - 1; i >= 0; i -= 1) {
      path = pathByValue(values[i]);
      if (path.length) { selectionAnchorValue = values[i]; return path; }
    }
    selectionAnchorValue = null;
    return [];
  }
      
  function surfaceDepth(surface) {
    var depth = 0, current = surface;
    while (current && current.parentRecord) { depth += 1; current = current.parentRecord.parentSurface; }
    return depth;
  }
      
  function clearSurfaceActives(exceptSurface, source) {
    allSurfaces.forEach(function (surface) {
      if (surface !== exceptSurface && surface.list) surface.list.resetActive({ source: source || 'api', reason: 'dropdown-single-cursor', silent: true });
    });
    refreshSelectionSurfaces();
  }
      
  function prepareSurfaceCursor(surface, config) {
    if (!surface || !surface.list) return false;
    var cfg = config || {}, path = selectedAnchorPath(), depth = surfaceDepth(surface), preferred = path[depth], source = cfg.source || 'api';
    clearSurfaceActives(surface, source);
    if (preferred && (surface.items || []).some(function (item) { return String(item.key) === String(preferred.key) && item.disabled !== true; })) {
      surface.list.setActiveKey(String(preferred.key), { source: source, reason: cfg.reason || 'dropdown-selected-anchor', silent: true });
      refreshSelectionSurfaces();
      return true;
    }
    return surface.list.prepareOpen({ strategy: cfg.strategy || 'none', source: source, reason: cfg.reason || 'dropdown-open' });
  }
      
  function refreshSelectionSurfaces() {
    allSurfaces.forEach(function (surface) {
      if (surface && surface.list && surface.list.refreshItemStates) surface.list.refreshItemStates();
    });
  }
      
  function renderActionItem(item, ctx) {
    var fragment = doc.createDocumentFragment();
    if (item && item.icon !== undefined && item.icon !== null && item.icon !== '') {
      var icon = doc.createElement('span'); icon.className = 'qxframe9a7c2-dropdown-action-icon';
      if (item.icon && typeof item.icon === 'object' && item.icon.nodeType) icon.appendChild(item.icon); else icon.textContent = String(item.icon);
      fragment.appendChild(icon);
    }
    var label = doc.createElement('span'); label.className = 'qxframe9a7c2-dropdown-action-label'; label.textContent = item && item.label !== undefined ? String(item.label) : ''; fragment.appendChild(label);
    if (item && item.shortcut !== undefined) { var shortcut = doc.createElement('span'); shortcut.className = 'qxframe9a7c2-dropdown-action-shortcut'; shortcut.textContent = String(item.shortcut); fragment.appendChild(shortcut); }
    if (ctx && ctx.parts && typeof ctx.parts.arrow === 'function') { var arrow = ctx.parts.arrow(); if (arrow) fragment.appendChild(arrow); }
    return fragment;
  }
      
  function surfaceByTrigger(trigger) {
    for (var i = 0; i < allSurfaces.length; i += 1) if (allSurfaces[i].trigger === trigger) return allSurfaces[i];
    return null;
  }
      
  function findChildRecord(surface, key) {
    for (var i = 0; i < childTriggerRecords.length; i += 1) {
      var record = childTriggerRecords[i];
      if (record.parentSurface === surface && record.key === key) return record;
    }
    return null;
  }
      
  function emitAction(item, detail) {
    var path = pathForItem(item);
    var payload = {
      key: String(item.key), value: item.value, item: item, pathItems: path.slice(), pathKeys: path.map(function (entry) { return String(entry.key); }),
      pathValues: path.map(function (entry) { return entry.value; }), pathLabels: path.map(function (entry) { return String(entry.label); }),
      reason: detail && detail.reason || 'action', source: detail && detail.source || 'api', originalEvent: detail && detail.originalEvent || null,
      dropdown: api, defaultPrevented: false, preventDefault: function () { payload.defaultPrevented = true; }
    };
    if (Utils.isFunction(item.onAction) && item.onAction(payload) === false) payload.defaultPrevented = true;
    if (Utils.isFunction(opts.onAction) && opts.onAction(payload) === false) payload.defaultPrevented = true;
    instance.emit('action', payload);
    return payload;
  }
      
  function emitSelection(item, actionPayload) {
    if (opts.selectable === false || isLocked() || actionPayload.defaultPrevented) return false;
    var value = rawValue(item.value);
    var selected = opts.multiple === true ? !selection.has(value) : true;
    var changed = selected ? selection.select(value, { source: actionPayload.source, reason: actionPayload.reason }) : selection.deselect(value, { source: actionPayload.source, reason: actionPayload.reason });
    if (!changed && opts.multiple !== true && selection.has(value)) changed = true;
    if (selection.has(value)) selectionAnchorValue = value;
    else if (selectionAnchorValue !== null && rawValue(selectionAnchorValue) === value) { var values = selection.values; selectionAnchorValue = values.length ? values[values.length - 1] : null; }
    refreshSelectionSurfaces();
    var detail = Object.assign({}, actionPayload, { selected: selection.has(value), value: item.value, values: selection.values.slice(), valueState: selection.value });
    if (Utils.isFunction(opts.onSelect)) opts.onSelect(detail);
    instance.emit(detail.selected ? 'select' : 'deselect', detail);
    if (Utils.isFunction(opts.onChange)) opts.onChange(opts.multiple === true ? selection.values.slice() : selection.value, detail);
    instance.emit('change', detail);
    return changed;
  }
      
  function activateLeaf(item, detail) {
    if (!item || hasChildren(item) || item.disabled === true || opts.disabled === true) return false;
    var actionPayload = emitAction(item, detail || {});
    if (actionPayload.defaultPrevented) return true;
    emitSelection(item, actionPayload);
    if (shouldCloseOnSelect()) triggerSession.closeTree('select', actionPayload.originalEvent || null);
    return true;
  }
  function activateBranch(item, detail) {
    if (!item || !hasChildren(item) || item.disabled === true || opts.disabled === true || opts.multiple !== true || opts.selectable === false || isLocked()) return false;
    var actionPayload = emitAction(item, detail || {});
    if (actionPayload.defaultPrevented) return true;
    var branchValues = branchLeafValues(item);
    if (!branchValues.length) return true;
    var state = branchCheckState(item);
    var selectBranch = !state.checked;
    var next = selection.values.filter(function (value) { return branchValues.indexOf(rawValue(value)) < 0; });
    if (selectBranch) branchValues.forEach(function (value) { if (next.indexOf(value) < 0) next.push(value); });
    selection.set(next, { source: actionPayload.source, reason: selectBranch ? 'branch-select' : 'branch-deselect' });
    selectionAnchorValue = selectBranch && branchValues.length ? branchValues[branchValues.length - 1] : (selection.values.length ? selection.values[selection.values.length - 1] : null);
    refreshSelectionSurfaces();
    var checked = branchCheckState(item);
    var result = Object.assign({}, actionPayload, { selected: checked.checked, checked: checked.checked, indeterminate: checked.indeterminate, value: item.value, values: selection.values.slice(), valueState: selection.value, branch: true });
    if (Utils.isFunction(opts.onSelect)) opts.onSelect(result);
    instance.emit(result.selected ? 'select' : 'deselect', result);
    if (Utils.isFunction(opts.onChange)) opts.onChange(selection.values.slice(), result);
    instance.emit('change', result);
    return true;
  }
      
  function openChild(surface, key, reason, originalEvent, focusChild) {
    var record = findChildRecord(surface, String(key)); if (!record) return false;
    record.trigger.closeSiblings('dropdown-sibling', originalEvent || null);
    var opened = record.trigger.open(reason || 'submenu-open', originalEvent || null);
    if (focusChild && record.surface && record.surface.list) {
      prepareSurfaceCursor(record.surface, { strategy: 'first', source: 'keyboard', reason: reason || 'submenu-open' });
      var childDomain = record.surface.list.getVirtualFocusDomain && record.surface.list.getVirtualFocusDomain();
      var childState = record.surface.list.getState();
      if (childDomain && childState.activeKey) childDomain.activate(childState.activeKey, { source:'keyboard', reason:reason || 'submenu-open', originalEvent:originalEvent || null, ensureVisible:true });
    }
    return opened !== false;
  }
      
  function handleSurfaceKeydown(surface, event) {
    if (!surface || !surface.list) return;
    var state = surface.list.getState(); var activeKey = state.activeKey; var item = null;
    (surface.items || []).some(function (entry) { if (String(entry.key) === String(activeKey)) { item = entry; return true; } return false; });
    if (event.key === 'ArrowRight' && item && hasChildren(item)) {
      if (openChild(surface, activeKey, 'keyboard-right', event, true) && event.preventDefault) event.preventDefault();
    } else if (event.key === 'ArrowLeft' && surface.parentRecord) {
      surface.parentRecord.trigger.closeTree('keyboard-left', event);
      clearSurfaceActives(surface.parentRecord.parentSurface, 'keyboard');
      surface.list.resetActive({ source: 'keyboard', reason: 'return-parent-leave', silent: true });
      surface.parentRecord.parentSurface.list.setActiveKey(surface.parentRecord.key, { source: 'keyboard', reason: 'return-parent', silent: true });
      refreshSelectionSurfaces();
      var parentDomain = surface.parentRecord.parentSurface.list.getVirtualFocusDomain && surface.parentRecord.parentSurface.list.getVirtualFocusDomain();
      if (parentDomain) parentDomain.activate(surface.parentRecord.key, { source:'keyboard', reason:'return-parent', originalEvent:event, ensureVisible:true });
      if (event.preventDefault) event.preventDefault();
    } else if (event.key === 'Escape') {
      triggerSession.closeTree('escape', event);
      if (event.preventDefault) event.preventDefault();
    }
  }
      
  function buildSurface(targetPanel, items, parentTrigger, parentRecord, isRoot) {
    var host = doc.createElement('div'); host.className = 'qxframe9a7c2-dropdown-list-host'; targetPanel.appendChild(host);
    var surface = { panel: targetPanel, host: host, items: items, list: null, trigger: parentTrigger, parentRecord: parentRecord || null, childRecords: [], disposeKeyboard: null };
    allSurfaces.push(surface);
    surface.list = ItemCollection.create({
      ownerPrefix: 'dropdown',
    itemSemanticClasses: function () { return ['qxframe9a7c2-dropdown-item']; },
      itemClassParts: ['item'],
      classes: opts.classes,
      styles: opts.styles,
      container: host, keyboardFocusOwner: reference, scrollAdapter:function(config){return Scroll.attachViewport(config);}, items: items, selectable: false, searchable: isRoot && opts.searchable === true,
      searchValue: isRoot ? String(opts.searchValue || '') : '', disabled: opts.disabled === true, readOnly: opts.readOnly === true,
      size: opts.size, virtual: false, itemRender: renderActionItem,
      selectionAppearance: opts.selectable === false ? 'highlight' : opts.selectionAppearance,
      getCheckState: function (item) { return hasChildren(item) && opts.multiple === true ? branchCheckState(item) : { checked: !!(item && item.value !== undefined && selection.has(rawValue(item.value))), indeterminate: false }; },
      getItemState: function (item) {
        var childRecord = item ? findChildRecord(surface, String(item.key)) : null;
        return {
          open: !!(childRecord && childRecord.trigger && childRecord.trigger.getState().open),
          descendantSelected: opts.selectable !== false && hasSelectedDescendant(item)
        };
      },
      onActivate: function (detail) {
        var item = detail.item;
        if (!item || item.disabled === true) return;
        if (hasChildren(item)) {
          if (opts.multiple === true && opts.selectable !== false) activateBranch(item, detail);
          else openChild(surface, String(item.key), detail.reason || 'activate', detail.originalEvent || null, detail.source === 'keyboard');
        } else activateLeaf(item, detail);
      },
      onSearch: isRoot ? function (searchValue, detail) {
        opts.searchValue = searchValue;
        var payload = { searchValue: searchValue, reason: detail && detail.reason || 'search', originalEvent: detail && detail.originalEvent || null, dropdown: api };
        if (Utils.isFunction(opts.onSearch)) opts.onSearch(searchValue, payload); instance.emit('search', payload);
      } : undefined,
      onActiveChange: function (detail) {
        if (detail && detail.key) clearSurfaceActives(surface, detail.source || 'api');
        var payload = Object.assign({}, detail, { dropdown: api });
        if (Utils.isFunction(opts.onActiveChange)) opts.onActiveChange(payload); instance.emit('activeChange', payload);
      }
    });
    if (keyboard && keyboard.virtualFocus) surface.list.bindVirtualFocus(keyboard.virtualFocus);
      
    (items || []).forEach(function (item) {
      if (!hasChildren(item)) return;
      var row = surface.list && typeof surface.list.getItemElement === 'function' ? surface.list.getItemElement(String(item.key)) : null;
      if (!row) return;
      row.classList.add('has-submenu');
      var childPanel = doc.createElement('div'); childPanel.className = 'qxframe9a7c2-dropdown-submenu-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset'; childPanel.hidden = true;
      var childRecord = { key: String(item.key), item: item, trigger: null, surface: null, panel: childPanel, parentSurface: surface };
      var childTrigger = Trigger.create({
        reference: row, floating: childPanel, document: doc, portalContainer: portalContainer, trigger: opts.submenuTrigger || 'hover', placement: 'right-start', arrow: false, offset: own(item, 'submenuOffset') ? item.submenuOffset : opts.submenuOffset, transition: Trigger.motion.popupPlacement, strategy: opts.strategy || 'absolute',
        middleware: opts.middleware, flipOnOverflow: opts.flipOnOverflow !== false, autoUpdate: opts.autoUpdate !== false, closeOnOutsidePress: true, closeOnFocusOutside: true, closeOnTabExit: true, closeOnEscape: true, destroyOnClose: opts.destroyOnClose !== false, restoreFocus: false,
        openDelay: opts.submenuOpenDelay, closeDelay: opts.submenuLeaveDelay, disabled: opts.disabled === true || item.disabled === true, parent: parentTrigger,
        onOpen: function () { row; if (surface.list) surface.list.refreshItemStates(); },
        onClose: function () { row; if (surface.list) surface.list.refreshItemStates(); if (childTrigger) childTrigger.closeChildren('submenu-close'); }
      });
      childRecord.trigger = childTrigger; childTriggerRecords.push(childRecord); surface.childRecords.push(childRecord);
      childRecord.surface = buildSurface(childPanel, childrenOf(item), childTrigger, childRecord, false);
    });
    refreshSelectionSurfaces();
    return surface;
  }
      
  function destroyActionSurfaces() {
    childTriggerRecords.slice().reverse().forEach(function (record) { if (record.trigger) record.trigger.destroy('dropdown-rebuild'); if (record.panel) DOM.removeNode(record.panel); });
    childTriggerRecords = [];
    allSurfaces.slice().reverse().forEach(function (surface) { if (surface.disposeKeyboard) surface.disposeKeyboard(); surface.disposeKeyboard = null; if (surface.list) surface.list.destroy(); });
    allSurfaces = []; rootSurface = null;
    while (panel.firstChild) panel.removeChild(panel.firstChild);
  }
      
  function rebuildActionSurfaces() {
    destroyActionSurfaces();
    rootSurface = buildSurface(panel, Array.isArray(opts.items) ? opts.items.slice() : [], triggerSession, null, true);
    syncFloatingView();
    refreshSelectionSurfaces();
  }
      
  function syncFloatingView() {
    panel.classList.toggle('has-arrow', opts.showArrow === true);
    if (opts.showArrow === true) { if (arrow.parentNode !== panel) panel.appendChild(arrow); }
    else if (arrow.parentNode) arrow.parentNode.removeChild(arrow);
    panel.setAttribute('data-placement', String(opts.placement || 'bottom-start'));
  }
      
  function emitOpen(opened, detail) {
    panel.classList.toggle('is-open', opened);
    return OpenStateBridge.dispatch(opened, detail, {
      emitter: { emit: function (type, payload) { return instance.emit(type, payload); } },
      emitPhase: true,
      decorate: function () { return { dropdown: api }; },
      onOpen: function (payload) { if (Utils.isFunction(opts.onOpen)) opts.onOpen(payload); },
      onClose: function (payload) { if (Utils.isFunction(opts.onClose)) opts.onClose(payload); },
      onChange: function (value, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(value, payload); },
      isCurrent: function () { return !triggerSession || triggerSession.getState().open === opened; }
    });
  }
      
  function shouldRestoreReference(detail) {
    if (!detail) return false;
    if (detail.reason === 'escape') return true;
    if (detail.reason !== 'select') return false;
    var event = detail.originalEvent;
    return !!(event && /^key/.test(event.type || ''));
  }
      
  function deepestOpenSurface() {
    var current = rootSurface;
    var moved = true;
    while (current && moved) {
      moved = false;
      for (var i = 0; i < current.childRecords.length; i += 1) {
        var record = current.childRecords[i];
        if (record.trigger && record.trigger.getState().open) { current = record.surface; moved = true; break; }
      }
    }
    return current || rootSurface;
  }
  function routeKeyboard(event) {
    if (!event || opts.disabled === true) return false;
    if (!triggerSession || !triggerSession.getState().open) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') return open(event.key === 'ArrowUp' ? 'keyboard-up' : 'keyboard-down', event);
      return false;
    }
    var surface = deepestOpenSurface();
    if (!surface || !surface.list) return false;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Escape') {
      var before = event.defaultPrevented;
      handleSurfaceKeydown(surface, event);
      return event.defaultPrevented !== before || event.key === 'Escape';
    }
    if (['ArrowDown','ArrowUp','Home','End','PageDown','PageUp','Enter',' ','F6'].indexOf(event.key) >= 0) return surface.list.handleKeydown(event) === true;
    return false;
  }
      
  keyboard = KeyboardNavigation.create({
    root: reference,
    focusRoot: reference,
    editableKeys: true,
    handlers: {
      ArrowDown:function(detail){ return routeKeyboard(detail.originalEvent); },
      ArrowUp:function(detail){ return routeKeyboard(detail.originalEvent); },
      ArrowRight:function(detail){ return routeKeyboard(detail.originalEvent); },
      ArrowLeft:function(detail){ return routeKeyboard(detail.originalEvent); },
      Home:function(detail){ return routeKeyboard(detail.originalEvent); },
      End:function(detail){ return routeKeyboard(detail.originalEvent); },
      PageDown:function(detail){ return routeKeyboard(detail.originalEvent); },
      PageUp:function(detail){ return routeKeyboard(detail.originalEvent); },
      Enter:function(detail){ return routeKeyboard(detail.originalEvent); },
      ' ':function(detail){ return routeKeyboard(detail.originalEvent); },
      Escape:function(detail){ return routeKeyboard(detail.originalEvent); },
      F6:function(detail){ return routeKeyboard(detail.originalEvent); }
    }
  });
  scope.add(function(){ if (keyboard) keyboard.destroy(); keyboard = null; });
      
  triggerSession = Trigger.create({
    reference: reference, floating: panel, document: doc, portalContainer: portalContainer, trigger: opts.trigger, placement: opts.placement, arrow: opts.showArrow === true, arrowElement: arrow, arrowPadding: opts.arrowPadding, offset: opts.offset, transition: Trigger.motion.popupPlacement, strategy: opts.strategy || 'absolute', middleware: opts.middleware,
    flipOnOverflow: opts.flipOnOverflow !== false,
    autoUpdate: opts.autoUpdate !== false, closeOnOutsidePress: opts.closeOnOutsidePress !== false, closeOnFocusOutside: true, closeOnTabExit: true, tabExitTarget: reference, closeOnEscape: opts.closeOnEscape !== false, destroyOnClose: opts.destroyOnClose !== false,
    restoreFocusTarget: reference,
    restoreFocusOnClose: shouldRestoreReference,
    openDelay: opts.openDelay, closeDelay: opts.closeDelay, disabled: opts.disabled === true,
    beforeOpen: function (detail) { if (destroyed || opts.disabled === true) return false; if (Utils.isFunction(opts.beforeOpen)) return opts.beforeOpen(detail); },
    beforeClose: function (detail) { if (Utils.isFunction(opts.beforeClose)) return opts.beforeClose(detail); },
    onOpen: function (detail) {
      if (rootSurface && rootSurface.list) {
        var eventType = detail && detail.originalEvent && detail.originalEvent.type || '';
        var reason = String(detail && detail.reason || '');
        var keyboardOpen = /^key/.test(eventType) || /keyboard/.test(reason);
        var hasSelectionAnchor = selectedAnchorPath().length > 0;
        prepareSurfaceCursor(rootSurface, { strategy: hasSelectionAnchor ? 'none' : (keyboardOpen ? (/up/.test(reason) ? 'last' : 'first') : 'none'), source: keyboardOpen ? 'keyboard' : (detail && detail.source || 'api'), reason: keyboardOpen ? 'dropdown-keyboard-open' : 'dropdown-open' });
        DOM.focusElement(reference, { preventScroll:true });
        var rootDomain = rootSurface.list.getVirtualFocusDomain && rootSurface.list.getVirtualFocusDomain();
        var rootState = rootSurface.list.getState();
        if (rootDomain && rootState.activeKey) rootDomain.activate(rootState.activeKey, { source:keyboardOpen ? 'keyboard' : 'pointer', modality:keyboardOpen ? 'keyboard' : 'pointer', reason:keyboardOpen ? 'dropdown-keyboard-open' : 'dropdown-open', originalEvent:detail && detail.originalEvent || null, ensureVisible:keyboardOpen });
      }
      emitOpen(true, detail);
    },
    onClose: function (detail) {
      if (triggerSession) triggerSession.closeChildren('dropdown-close', detail && detail.originalEvent || null);
      emitOpen(false, detail);
    }
  });
  var ownedTrigger = triggerSession;
  instance.adoptPopupRuntime(Object.freeze({
    open: function (reason, event) { return ownedTrigger.open(reason, event); },
    close: function (reason, event) { return ownedTrigger.closeTree(reason, event); },
    toggle: function (reason, event) { return ownedTrigger.toggle(reason, event); },
    reposition: function (reason) { return ownedTrigger.reposition(reason); },
    getState: function () { return ownedTrigger.getState(); },
    updateOptions: function (patch) { return ownedTrigger.updateOptions(patch); },
    destroy: function (reason) { return ownedTrigger.destroy(reason || 'dropdown-destroy'); }
  }), { reference: reference, popup: panel, owned: true });
      
  rebuildActionSurfaces();
      
  function syncReference() {
       reference.classList.toggle('is-disabled', opts.disabled === true);
  }
  function open(reason, originalEvent) { return instance.open(reason || 'api', originalEvent || null); }
  function close(reason, originalEvent) { return instance.close(reason || 'api', originalEvent || null); }
  function setOpen(value, reason, originalEvent) { return instance.setOpen(value, reason || 'set-open', originalEvent); }
  function setItems(items) { if (destroyed) return api; validateItems(items); opts.items = Array.isArray(items) ? items.slice() : []; rebuildActionSurfaces(); if (triggerSession.getState().open) triggerSession.reposition('items'); return api; }
  function setValue(value, meta) {
    if (destroyed) return api; selection.set(value, { source: meta && meta.source || 'api', reason: meta && meta.reason || 'dropdown-set-value' }); var values = selection.values; selectionAnchorValue = values.length ? values[values.length - 1] : null; opts.value = opts.multiple === true ? values.slice() : selection.value; refreshSelectionSurfaces();
    if (!(meta && meta.silent)) { var detail = { value: selection.value, values: selection.values.slice(), reason: meta && meta.reason || 'set-value', source: meta && meta.source || 'api', dropdown: api }; if (Utils.isFunction(opts.onChange)) opts.onChange(opts.multiple === true ? selection.values.slice() : selection.value, detail); instance.emit('change', detail); }
    return api;
  }
  function clear(meta) { var had = selection.values.length > 0; setValue([], meta || { reason: 'dropdown-clear' }); return had; }
  function setSearch(value) { if (rootSurface && rootSurface.list) rootSurface.list.setSearch(value); return api; }
  function applyOptions(nextOptions) {
    if (destroyed) return api; var next = nextOptions || {};
    if (own(next, 'reference') && resolveElement(next.reference, doc, 'reference') !== reference) throw new Error('[QXFRAME9A7C2] Dropdown reference is immutable; destroy and recreate to change it.');
    if (own(next, 'portalContainer') && resolveElement(next.portalContainer, doc, 'portalContainer') !== portalContainer) throw new Error('[QXFRAME9A7C2] Dropdown portalContainer is immutable; destroy and recreate to change it.');
    if (own(next, 'items')) validateItems(next.items);
    if (own(next, 'multiple') && next.multiple !== opts.multiple) throw new Error('[QXFRAME9A7C2] Dropdown multiple is immutable; destroy and recreate to change selection shape.');
    var rebuild = ['items','searchable','selectable','readOnly','size','selectionAppearance'].some(function (name) { return own(next, name); });
    Object.keys(next).forEach(function (key) { opts[key] = next[key]; });
    if (own(next, 'value')) { selection.set(next.value, { silent: true, source: 'options', reason: 'options-value' }); var values = selection.values; selectionAnchorValue = values.length ? values[values.length - 1] : null; }
    if (own(next, 'showArrow')) syncFloatingView();
    triggerSession.updateOptions({ trigger: opts.trigger, placement: opts.placement, arrow: opts.showArrow === true, arrowElement: arrow, arrowPadding: opts.arrowPadding, offset: opts.offset, strategy: opts.strategy || 'absolute', middleware: opts.middleware, flipOnOverflow: opts.flipOnOverflow !== false, autoUpdate: opts.autoUpdate !== false, closeOnOutsidePress: opts.closeOnOutsidePress !== false, closeOnFocusOutside: true, closeOnTabExit: true, tabExitTarget: reference, closeOnEscape: opts.closeOnEscape !== false, destroyOnClose: opts.destroyOnClose !== false, openDelay: opts.openDelay, closeDelay: opts.closeDelay, disabled: opts.disabled === true });
    if (rebuild) rebuildActionSurfaces(); else {
      if (['submenuTrigger','submenuOpenDelay','submenuLeaveDelay','submenuOffset','strategy','middleware','flipOnOverflow','autoUpdate','destroyOnClose','disabled'].some(function (name) { return own(next, name); })) {
        childTriggerRecords.forEach(function (record) {
          if (!record.trigger) return;
          record.trigger.updateOptions({
            trigger: opts.submenuTrigger || 'hover',
            offset: own(record.item, 'submenuOffset') ? record.item.submenuOffset : opts.submenuOffset,
            strategy: opts.strategy || 'absolute',
            middleware: opts.middleware,
            flipOnOverflow: opts.flipOnOverflow !== false,
            autoUpdate: opts.autoUpdate !== false,
            destroyOnClose: opts.destroyOnClose !== false,
            openDelay: opts.submenuOpenDelay,
            closeDelay: opts.submenuLeaveDelay,
            disabled: opts.disabled === true || record.item.disabled === true
          });
        });
      }
      refreshSelectionSurfaces();
    }
    syncFloatingView();
    syncReference();
    if (own(next, 'open')) setOpen(next.open === true, 'update-options'); else if (opts.disabled === true && triggerSession.getState().open) close('disabled');
    return api;
  }
  function getState() {
    var listState = rootSurface && rootSurface.list ? rootSurface.list.getState() : { activeKey: null, searchValue: '' };
    var openDepth = 0; childTriggerRecords.forEach(function (record) { if (record.trigger && record.trigger.getState().open) openDepth += 1; });
    return Object.freeze({ open: triggerSession.getState().open, value: selection.value, values: selection.values.slice(), activeKey: listState.activeKey, selectionAnchorValue: selectionAnchorValue, searchValue: listState.searchValue, openDepth: openDepth, multiple: opts.multiple === true, selectable: opts.selectable !== false, showArrow: opts.showArrow === true, flipOnOverflow: triggerSession.getState().flipOnOverflow, focusOnOpen: opts.focusOnOpen !== false, disabled: opts.disabled === true, destroyed: destroyed });
  }
  function destroyRuntime() {
    if (destroyed) return false; destroyed = true; destroyActionSurfaces(); scope.dispose(); triggerSession = null; DOM.removeNode(panel); reference.classList.remove('is-disabled'); return true;
  }
      
  function focusFirst() { if (!rootSurface || !rootSurface.list) return false; var a=(rootSurface.items || []).filter(function(i){return i && i.disabled!==true && i.type!=='divider' && i.type!=='title' && i.type!=='group';}); var k=a.length?a[0].key:null; if(k!==null)rootSurface.list.setActiveKey(k, {source:'keyboard',reason:'focus-first'}); var d=rootSurface.list.getVirtualFocusDomain(); var st=rootSurface.list.getState(); return !!(d&&st.activeKey&&d.activate(st.activeKey,{source:'keyboard',reason:'focus-first',ensureVisible:true})); }
  function focusLast() { if (!rootSurface || !rootSurface.list) return false; var a=(rootSurface.items || []).filter(function(i){return i && i.disabled!==true && i.type!=='divider' && i.type!=='title' && i.type!=='group';}); var k=a.length?a[a.length-1].key:null; if(k!==null)rootSurface.list.setActiveKey(k,{source:'keyboard',reason:'focus-last'}); var d=rootSurface.list.getVirtualFocusDomain(); var st=rootSurface.list.getState(); return !!(d&&st.activeKey&&d.activate(st.activeKey,{source:'keyboard',reason:'focus-last',ensureVisible:true})); }

  syncReference(); if (opts.open === true) instance.open('initial');
  return Object.freeze({
    panel: panel, reference: reference, trigger: ownedTrigger,
    setItems: setItems, setValue: setValue, clear: clear, setSearch: setSearch, focusFirst: focusFirst, focusLast: focusLast,
    getState: getState, getList: function () { return rootSurface ? rootSurface.list : null; },
    applyOptions: applyOptions, destroyRuntime: destroyRuntime
  });
}

export class Dropdown extends PopupComponent {
  static contract = ComponentContracts.get('Dropdown');
  static options = Object.freeze({
    trigger: 'click', placement: 'bottom-start', closeOnSelect: undefined, searchable: false, selectable: true, multiple: false, disabled: false, readOnly: false,
    size: 'md', selectionAppearance: 'check-start', showArrow: false, arrowPadding: 8, flipOnOverflow: true, open: false, openDelay: undefined, closeDelay: undefined,
    submenuTrigger: 'hover', submenuOpenDelay: 80, submenuLeaveDelay: 120, submenuOffset: 8
  });

  [componentHooks.beforeOptionsUpdate](patch) {
    const record = requireState(this);
    if (own(patch, 'reference') && resolveElement(patch.reference, record.doc, 'reference') !== record.runtime.reference) throw new Error('[QXFRAME9A7C2] Dropdown reference is immutable; destroy and recreate to change it.');
    if (own(patch, 'portalContainer') && resolveElement(patch.portalContainer, record.doc, 'portalContainer') !== record.portalContainer) throw new Error('[QXFRAME9A7C2] Dropdown portalContainer is immutable; destroy and recreate to change it.');
    if (own(patch, 'items')) validateItems(patch.items);
    if (own(patch, 'multiple') && patch.multiple !== this.options.multiple) throw new Error('[QXFRAME9A7C2] Dropdown multiple is immutable; destroy and recreate to change selection shape.');
  }

  [componentHooks.render](options) {
    validateItems(options.items);
    const runtime = initializeDropdown(this, options);
    const doc = options.document || globalThis.document;
    const portalContainer = options.portalContainer ? resolveElement(options.portalContainer, doc, 'portalContainer') : doc.body;
    state.set(this, { runtime, doc, portalContainer });
    return runtime.panel;
  }

  [componentHooks.optionsUpdated](options, previous, patch) { requireState(this).runtime.applyOptions(patch); }
  [componentHooks.beforeDestroy]() { const record = state.get(this); if (record) record.runtime.destroyRuntime(); state.delete(this); }

  setItems(items) { requireState(this).runtime.setItems(items); return this; }
  setValue(value, meta) { requireState(this).runtime.setValue(value, meta); return this; }
  clear(meta) { return requireState(this).runtime.clear(meta); }
  setSearch(value) { requireState(this).runtime.setSearch(value); return this; }
  focusFirst() { return requireState(this).runtime.focusFirst(); }
  focusLast() { return requireState(this).runtime.focusLast(); }
  getState() { return requireState(this).runtime.getState(); }
  getList() { return requireState(this).runtime.getList(); }
  getTrigger() { const record = state.get(this); return record ? record.runtime.trigger : super.getTrigger(); }
}
