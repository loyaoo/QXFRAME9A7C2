import { DOM } from '../core/dom.js';
import { Events } from '../core/events.js';
import { Config } from '../core/config.js';
import { OpenStateBridge } from '../core/openStateBridge.js';
import { OverlayRuntime } from '../core/overlayRuntime.js';
import { PopupSurface } from '../core/popupSurface.js';
import { TriggerInteraction } from '../core/triggerInteraction.js';
import { Transition } from '../core/transition.js';
import { MotionPresets } from '../core/motionPresets.js';
import { LogicalOwnership } from '../core/logicalOwnership.js';
import { ComponentContracts, validateContractOptions } from '../core/componentContracts.js';
import { Utils } from '../utils/utils.js';

var TRIGGERS = Object.freeze(['click', 'hover', 'focus', 'contextMenu', 'manual']);
var INSTANCES = typeof WeakMap === 'function' ? new WeakMap() : null;
var IMMEDIATE_TRANSITION = Object.freeze({
  enter: Object.freeze({
    from: Object.freeze({ style: Object.freeze({}) }),
    active: Object.freeze({ style: Object.freeze({ transitionDuration: '0ms' }) }),
    to: Object.freeze({ style: Object.freeze({}) })
  }),
  leave: Object.freeze({
    from: Object.freeze({ style: Object.freeze({}) }),
    active: Object.freeze({ style: Object.freeze({ transitionDuration: '0ms' }) }),
    to: Object.freeze({ style: Object.freeze({}) })
  })
});
var own = Utils.own;
function resolveOptionalElement(value, documentRef, label) {
  if (value === undefined || value === null || value === '') return null;
  return resolveElement(value, documentRef, label);
}
function resolveElement(value, documentRef, label) { return DOM.requireElement(value, documentRef, 'Trigger ' + label); }
function normalizeTriggers(value) {
  var source = Array.isArray(value) ? value.slice() : String(value === undefined || value === null ? 'click' : value).split(/\s+/);
  var result = [];
  source.forEach(function (item) {
    var name = String(item || '').trim();
    if (!name) return;
    if (TRIGGERS.indexOf(name) < 0) throw new TypeError('[QXFRAME9A7C2] Trigger trigger must use click, hover, focus, contextMenu, or manual.');
    if (result.indexOf(name) < 0) result.push(name);
  });
  if (!result.length) result.push('click');
  if (result.indexOf('manual') >= 0 && result.length > 1) throw new TypeError('[QXFRAME9A7C2] Trigger manual mode cannot be combined with event triggers.');
  return result;
}
    
function resolvedDelay(value, configKey, element) {
  var resolved = Config.resolve(configKey, value, element || null);
  var number = Number(resolved);
  return Number.isFinite(number) && number > 0 ? number : 0;
}
    
function create(options) {
  validateContractOptions(ComponentContracts.get('Trigger'), options || {}, 'Trigger');
  var opts = Utils.assignOwn({
    trigger: 'click', placement: 'bottom-start', strategy: 'absolute', offset: 8, arrow: false, arrowElement: null, arrowPadding: 8, open: false, disabled: false,
    openDelay: undefined, closeDelay: undefined, autoUpdate: true, closeOnOutsidePress: true, closeOnFocusOutside: false, closeOnTabExit: false, closeOnEscape: true, focusScope: 'auto',
    restoreFocusOnDismiss: false, flipOnOverflow: true, destroyOnClose: true, forceRender: false, keyboardActivation: true, transition: MotionPresets.popupPlacement
  }, options || {});
  var offsetExplicit = own(options, 'offset') && options.offset !== undefined && options.offset !== null;
  if (!offsetExplicit) opts.offset = opts.arrow === true ? 12 : 8;
  if (!INSTANCES) throw new Error('[QXFRAME9A7C2] Trigger requires WeakMap support.');
    
  var doc = opts.document || globalThis.document;
  var reference = resolveElement(opts.reference, doc, 'reference');
  var triggerTargetExplicit = own(options, 'triggerTarget');
  var triggerTarget = triggerTargetExplicit ? resolveOptionalElement(opts.triggerTarget, doc, 'triggerTarget') : reference;
  var floating = resolveElement(opts.floating, doc, 'floating');
  var transitionElement = own(options, 'transitionElement') ? resolveElement(opts.transitionElement, doc, 'transitionElement') : floating;
  var portalContainer = opts.portalContainer ? resolveElement(opts.portalContainer, doc, 'portalContainer') : (floating.parentNode || doc.body);
  if (!portalContainer) throw new TypeError('[QXFRAME9A7C2] Trigger requires document.body or portalContainer.');
    
  var triggers = normalizeTriggers(opts.trigger);
  var emitter = Events.createEmitter();
  var surface = PopupSurface.create({ element: floating, setVisible: opts.setVisible });
  var runtime = null;
  var transition = null;
  var interaction = null;
  var logicalNode = null;
  var opened = false;
  var destroyed = false;
  var destroying = false;
  var destroyCloseGuard = false;
  var beforeOpenGuard = false;
  var beforeCloseGuard = false;
  var treeCloseDepth = 0;
  var pendingDisabledClose = false;
  var pendingOpenDetail = null;
  var pendingCloseDetail = null;
  var motionActive = false;
  var motionPreparing = false;
  var api = null;
    
  function projectMotionPlacement(placement) {
    var value = String(placement || opts.placement || 'bottom-start');
    floating.setAttribute('data-placement', value);
    if (transitionElement !== floating) transitionElement.setAttribute('data-placement', value);
    return value;
  }
    
  projectMotionPlacement(opts.placement);
  surface.hide({ reason: 'initial' });
    
  function isTriggerInstance(value) { return !!(value && INSTANCES.has(value)); }
  function getChildren() {
    if (!logicalNode) return [];
    return logicalNode.getChildren().map(function (node) { return node.owner; }).filter(isTriggerInstance);
  }
  function getParent() {
    var node = logicalNode && logicalNode.getParent();
    return node && isTriggerInstance(node.owner) ? node.owner : null;
  }
  function containsOwnElement(target) {
    if (!target) return false;
    return reference === target || triggerTarget === target || floating === target || !!(reference.contains && reference.contains(target)) || !!(triggerTarget && triggerTarget.contains && triggerTarget.contains(target)) || !!(floating.contains && floating.contains(target));
  }
  function containsElement(target) {
    if (containsOwnElement(target)) return true;
    var children = getChildren();
    for (var index = 0; index < children.length; index += 1) if (children[index].containsElement(target)) return true;
    return Utils.isFunction(opts.containsTarget) ? opts.containsTarget(target, api) === true : false;
  }
  function getLogicalRootOwner() {
    var owner = api;
    var parent = owner && owner.getParent ? owner.getParent() : null;
    while (parent) { owner = parent; parent = owner.getParent(); }
    return owner || api;
  }
  function resolveTabExitTarget(meta) {
    var custom = Utils.isFunction(opts.tabExitTarget) ? opts.tabExitTarget(meta || {}, api) : opts.tabExitTarget;
    if (custom) return custom;
    var owner = getLogicalRootOwner();
    return owner && (owner.getTriggerElement() || owner.getReferenceElement()) || triggerTarget || reference;
  }
  function dismissRootForTarget(target) {
    var owner = api;
    var parent = owner && owner.getParent ? owner.getParent() : null;
    while (parent && !parent.containsElement(target)) { owner = parent; parent = owner.getParent(); }
    return owner || api;
  }
  function handleRuntimeDismiss(payload) {
    var reason = payload && payload.reason || 'dismiss';
    var event = payload && payload.originalEvent || null;
    if (reason === 'tab-exit') return runCloseTransaction([getLogicalRootOwner()], reason, event, null);
    if (reason === 'outside' || reason === 'focus-outside') {
      return runCloseTransaction([dismissRootForTarget(event && event.target)], reason, event, null);
    }
    return close(reason, event);
  }
  function pointerWillMoveFocus(target) {
    var node = target && target.nodeType === 1 ? target : target && target.parentElement;
    while (node && node !== doc.body) {
      var tag = String(node.tagName || '').toLowerCase();
      if (node.disabled !== true && (node.tabIndex >= 0 || tag === 'button' || tag === 'select' || tag === 'textarea' || (tag === 'input' && String(node.type || '').toLowerCase() !== 'hidden') || (tag === 'a' && node.hasAttribute && node.hasAttribute('href')) || node.isContentEditable === true)) return true;
      node = node.parentElement;
    }
    return false;
  }
  function dismissFocusReturn(info) {
    if (!info) return false;
    var reason = String(info.reason || '');
    if (reason === 'focus-outside' || reason === 'tab-exit') return false;
    if (reason === 'escape') return true;
    if (reason === 'outside') return !pointerWillMoveFocus(info.originalEvent && info.originalEvent.target);
    return false;
  }
  function shouldRestoreFocusOnLogicalClose(info) {
    if (opts.restoreFocusOnDismiss === true && dismissFocusReturn(info)) return true;
    if (Utils.isFunction(opts.restoreFocusOnClose)) return opts.restoreFocusOnClose(info || {}, api) === true;
    return opts.restoreFocusOnClose === true;
  }
  function restoreFocusOnLogicalClose(info) {
    if (!shouldRestoreFocusOnLogicalClose(info)) return false;
    var target = Utils.isFunction(opts.restoreFocusTarget) ? opts.restoreFocusTarget(info || {}, api) : opts.restoreFocusTarget;
    target = target || reference || triggerTarget;
    return !!(target && DOM.focusElement(target, { preventScroll: true }));
  }
  function detail(reason, originalEvent, forceClose) {
    return { source: DOM.activationSource(originalEvent), reason: reason || 'api', originalEvent: originalEvent || null, trigger: api, state: { open: opened }, forceClose: forceClose || null };
  }
  function emitOpen(value, info) {
    return OpenStateBridge.dispatch(value, Utils.assignOwn({ source:DOM.activationSource(info && info.originalEvent) }, info || {}), {
      emitter: emitter,
      emitPhase: true,
      decorate: function () { return { trigger:api }; },
      onOpen: function (payload) { if (Utils.isFunction(opts.onOpen)) opts.onOpen(payload); },
      onClose: function (payload) { if (Utils.isFunction(opts.onClose)) opts.onClose(payload); },
      onChange: function (next, payload) { if (Utils.isFunction(opts.onOpenChange)) opts.onOpenChange(next, payload); },
      isCurrent: function () { return !destroyed && opened === value; }
    });
  }
  function hasDestroyingAncestor() {
    if (!logicalNode) return false;
    var ancestors = logicalNode.ancestors();
    for (var index = 0; index < ancestors.length; index += 1) {
      var owner = ancestors[index] && ancestors[index].owner;
      var record = owner && INSTANCES.get(owner);
      if (record && record.destroying === true) return true;
    }
    return false;
  }
  function beforeOpen(info) {
    if (destroyed || destroying || destroyCloseGuard || hasDestroyingAncestor() || opts.disabled === true || beforeOpenGuard) return false;
    beforeOpenGuard = true;
    var accepted = true;
    try {
      if (Utils.isFunction(opts.beforeOpen)) accepted = opts.beforeOpen(info, api) !== false;
    } finally {
      beforeOpenGuard = false;
    }
    return accepted && !destroyed && !destroying && !destroyCloseGuard && !hasDestroyingAncestor() && !opened && opts.disabled !== true;
  }
  function beforeClose(info, forceClose) {
    if (forceClose === 'destroy') return true;
    if (destroyed || beforeCloseGuard) return false;
    var forced = forceClose === 'disabled';
    beforeCloseGuard = true;
    var accepted = true;
    try {
      if (Utils.isFunction(opts.beforeClose)) accepted = opts.beforeClose(info, api) !== false;
    } finally {
      beforeCloseGuard = false;
    }
    return (forced || accepted) && !destroyed && opened;
  }
    
  function handlePositionUpdate(result) {
    var resolvedPlacement = result && result.placement ? String(result.placement) : String(opts.placement || 'bottom-start');
    floating.setAttribute('data-placement', resolvedPlacement);
    // Split positioning/motion DOMs (Tooltip) may keep tracking the anchor, but the
    // presence node keeps one placement direction for the duration of a motion run.
    if (transitionElement !== floating && !motionActive && !motionPreparing) {
      transitionElement.setAttribute('data-placement', resolvedPlacement);
    }
    if (Utils.isFunction(opts.onPositionUpdate)) opts.onPositionUpdate(result);
  }
    
  function runtimeOptions() {
    return {
      reference: reference, floating: floating, document: doc, portalContainer: portalContainer, allowReferenceUpdate: opts.allowReferenceUpdate === true,
      placement: opts.placement, strategy: opts.strategy || 'absolute', offset: opts.offset, middleware: opts.middleware,
      arrow: opts.arrow === true, arrowElement: opts.arrowElement || null, arrowPadding: opts.arrowPadding,
      flipOnOverflow: opts.flipOnOverflow !== false, matchReferenceWidth: opts.matchReferenceWidth === true,
      autoUpdate: opts.autoUpdate !== false, autoUpdateOptions: opts.autoUpdateOptions,
      closeOnOutsidePress: opts.closeOnOutsidePress !== false, closeOnFocusOutside: opts.closeOnFocusOutside === true, closeOnTabExit: opts.closeOnTabExit === true, closeOnEscape: opts.closeOnEscape !== false,
      focusScope: opts.focusScope, trapFocus: opts.trapFocus === true, lockScroll: opts.lockScroll === true, scrollLockTarget: opts.scrollLockTarget,
      compensateScrollbar: opts.compensateScrollbar !== false, restoreFocus: opts.restoreFocus !== false,
      restoreFocusTarget: opts.restoreFocusTarget, restoreFocusOnDeactivate: false, tabExitTarget: resolveTabExitTarget,
      focusOnActivate: opts.focusOnOpen === true, initialFocus: opts.initialFocus,
      position: opts.position !== false, manageZIndex: opts.manageZIndex !== false,
      positionReference: opts.positionReference || null, useTransformPosition: opts.useTransformPosition === true, inlinePositioning: opts.inlinePositioning === true, inlinePositioningOptions: opts.inlinePositioningOptions,
      destroyOnDeactivate: opts.destroyOnClose !== false, parentLayerId: opts.parentLayerId, layerKind: opts.layerKind || 'popup', componentType: opts.componentType || null, group: opts.group, zIndex: opts.zIndex, exclude: opts.exclude,
      containsTarget: function (target) { return containsElement(target); },
      applyPosition: opts.applyPosition, onPositionUpdate: handlePositionUpdate, onPositionError: opts.onPositionError,
      onDismiss: handleRuntimeDismiss
    };
  }
    
  runtime = OverlayRuntime.create(runtimeOptions());
  transition = Transition.create({
    element: transitionElement,
    transition: opts.transition || IMMEDIATE_TRANSITION,
    visible: false,
    appear: false,
    onBeforeEnter: function () {
      motionActive = true;
    },
    onPrepare: function (context) {
      if (!context || (context.status !== 'enter' && context.status !== 'appear')) return null;
      motionPreparing = true;
      if (transitionElement === floating && opts.position !== false) {
        runtime.setPositionSuspended(true, 'motion-enter-prepare');
      }
      return Promise.resolve(runtime.preparePosition('motion-enter-prepare')).catch(function () { return null; }).then(function () {
        var livePlacement = floating.getAttribute('data-placement') || opts.placement;
        if (transitionElement !== floating) transitionElement.setAttribute('data-placement', String(livePlacement || 'bottom-start'));
        motionPreparing = false;
      });
    },
    onBeforeLeave: function () {
      motionPreparing = false;
      motionActive = true;
      if (transitionElement === floating && opts.position !== false) {
        runtime.setPositionSuspended(true, 'motion-leave');
      }
    },
    onAfterEnter: function () {
      motionPreparing = false;
      motionActive = false;
      runtime.setPositionSuspended(false, 'motion-enter-complete');
      var livePlacement = floating.getAttribute('data-placement') || opts.placement;
      if (transitionElement !== floating) transitionElement.setAttribute('data-placement', String(livePlacement || 'bottom-start'));
      if (!opened || destroyed) return;
      var pending = pendingOpenDetail || { reason: 'transition-enter', originalEvent: null };
      var info = detail(pending.reason, pending.originalEvent, pending.forceClose || null);
      pendingOpenDetail = null;
      if (Utils.isFunction(opts.afterOpen)) opts.afterOpen(info, api);
    },
    onAfterLeave: function () {
      motionPreparing = false;
      motionActive = false;
      if (opened || destroyed) return;
      var pending = pendingCloseDetail || { reason: 'transition-leave', originalEvent: null };
      var info = detail(pending.reason, pending.originalEvent);
      pendingCloseDetail = null;
      surface.hide(info);
      runtime.deactivate(info);
      if (Utils.isFunction(opts.afterClose)) opts.afterClose(info, api);
    }
  });
    
  function cancelClose() { if (interaction && interaction.cancelClose) interaction.cancelClose(); return api; }
  function cancelCloseCascade() {
    cancelClose();
    var ancestors = logicalNode ? logicalNode.ancestors() : [];
    ancestors.forEach(function (node) { if (isTriggerInstance(node.owner)) node.owner.cancelClose(); });
    return api;
  }
  function requestAncestorHoverClose(event) {
    var relatedTarget = event && event.relatedTarget;
    var ancestors = logicalNode ? logicalNode.ancestors() : [];
    ancestors.forEach(function (node) {
      var owner = node.owner;
      if (!isTriggerInstance(owner)) return;
      if (relatedTarget && owner.containsElement(relatedTarget)) { owner.cancelClose(); return; }
      var record = INSTANCES.get(owner);
      if (record && record.interaction && record.interaction.requestClose) record.interaction.requestClose('logical-descendant-leave', event || null);
    });
  }
    
  function rebuildInteraction() {
    if (interaction) interaction.destroy();
    interaction = null;
    if (api && INSTANCES.has(api)) INSTANCES.get(api).interaction = null;
    triggers = normalizeTriggers(opts.trigger);
    if (destroyed || opts.disabled === true || triggers.indexOf('manual') >= 0 || !triggerTarget) return;
    interaction = TriggerInteraction.create({
      reference: triggerTarget,
      floating: floating,
      trigger: triggers,
      keyboard: opts.keyboardActivation !== false,
      openDelay: function () { return resolvedDelay(opts.openDelay, 'triggerOpenDelay', reference); },
      closeDelay: function () { return resolvedDelay(opts.closeDelay, 'triggerCloseDelay', reference); },
      containsTarget: function (target) { return containsElement(target); },
      onOpenIntent: function (reason, event) { return open(reason, event); },
      onCloseIntent: function (reason, event) { return close(reason, event); },
      onToggleIntent: function (reason, event) { return opened ? close(reason, event) : open(reason, event); },
      onInteractionEnter: function (event) {
        cancelCloseCascade();
        if (Utils.isFunction(opts.onInteractionEnter)) opts.onInteractionEnter(event, api);
      },
      interactiveBorder: opts.interactiveBorder,
      interactiveDebounce: opts.interactiveDebounce,
      onInteractionLeave: function (reason, event) {
        if (/hover/.test(String(reason || ''))) requestAncestorHoverClose(event);
        if (Utils.isFunction(opts.onInteractionLeave)) opts.onInteractionLeave(event, api);
      }
    });
    if (api && INSTANCES.has(api)) INSTANCES.get(api).interaction = interaction;
  }
    
  function open(reason, originalEvent) {
    if (destroyed || destroying || destroyCloseGuard || treeCloseDepth > 0 || hasDestroyingAncestor() || opened || opts.disabled === true) return false;
    cancelCloseCascade();
    var openReason = reason || 'api';
    var openEvent = originalEvent || null;
    var beforeInfo = detail(openReason, openEvent);
    if (!beforeOpen(beforeInfo)) return false;
    if (destroyed || destroying || destroyCloseGuard || treeCloseDepth > 0 || hasDestroyingAncestor() || opened || opts.disabled === true) return false;
    opened = true;
    var info = detail(openReason, openEvent);
    pendingCloseDetail = null;
    pendingOpenDetail = info;
    runtime.mount();
    surface.show(info);
    if (!runtime.getState().active) runtime.activate(info);
    else if (runtime.activateInteraction) runtime.activateInteraction(info);
    emitOpen(true, info);
    // A logical callback may synchronously close or destroy this Trigger.
    if (destroyed || !opened) return true;
    transition.setVisible(true, { reason: info.reason, originalEvent: info.originalEvent, immediate: !opts.transition });
    return true;
  }
  function preflightClose(reason, originalEvent, forceClose, treeTransaction) {
    if (destroyed || !opened || (treeCloseDepth > 0 && forceClose !== 'destroy' && treeTransaction !== true)) return null;
    var closeReason = reason || 'api';
    var closeEvent = originalEvent || null;
    var closeForce = forceClose || null;
    var beforeInfo = detail(closeReason, closeEvent, closeForce);
    if (!beforeClose(beforeInfo, closeForce)) return null;
    if (destroyed || !opened) return null;
    // Keep transaction authority and canonical metadata outside the user-visible hook
    // detail. Hook mutation must never rewrite the close that was actually preflighted.
    return { reason: closeReason, originalEvent: closeEvent, forceClose: closeForce };
  }
  function commitClose(preflight) {
    if (destroyed || !opened || !preflight) return false;
    var forceClose = preflight.forceClose || null;
    opened = false;
    var info = detail(preflight.reason, preflight.originalEvent, forceClose);
    pendingOpenDetail = null;
    pendingCloseDetail = info;
    if (forceClose === 'destroy') destroyCloseGuard = true;
    try {
      // Trigger owns logical focus return for dismissible popups. Physical leave/presence
      // must never delay or later override the focus decision made by this close transaction.
      restoreFocusOnLogicalClose(info);
      emitOpen(false, info);
    } finally {
      if (forceClose === 'destroy') destroyCloseGuard = false;
    }
    // A logical callback may synchronously reopen or destroy this Trigger. Only the
    // internal destroy authority is guarded; a public reason string cannot spoof teardown.
    if (destroyed || opened) return true;
    if (runtime.deactivateInteraction) runtime.deactivateInteraction(info);
    transition.setVisible(false, { reason: info.reason, originalEvent: info.originalEvent, immediate: !opts.transition || forceClose === 'destroy' });
    return true;
  }
  function closeInternal(reason, originalEvent, forceClose) {
    var beforeInfo = preflightClose(reason || 'api', originalEvent || null, forceClose || null);
    return beforeInfo ? commitClose(beforeInfo) : false;
  }
  function close(reason, originalEvent) { return closeInternal(reason || 'api', originalEvent || null, null); }
  function enterTreeClose() { treeCloseDepth += 1; }
  function leaveTreeClose() {
    treeCloseDepth = Math.max(0, treeCloseDepth - 1);
    if (treeCloseDepth === 0 && pendingDisabledClose) {
      pendingDisabledClose = false;
      if (!destroyed && opts.disabled === true && opened) runCloseTransaction([api], 'disabled', null, 'disabled');
    }
  }
  function isTreeClosing() { return treeCloseDepth > 0; }
  function collectClosePlan(owner, plan, seen) {
    if (!isTriggerInstance(owner) || seen.has(owner)) return;
    seen.add(owner);
    var record = INSTANCES.get(owner);
    if (!record) return;
    var state = owner.getState();
    plan.push({ owner: owner, record: record, beforeInfo: null, wasOpen: state.open === true });
    var children = owner.getChildren().slice();
    for (var index = 0; index < children.length; index += 1) collectClosePlan(children[index], plan, seen);
  }
  function releaseClosePlan(plan) {
    for (var index = plan.length - 1; index >= 0; index -= 1) plan[index].record.leaveTreeClose();
  }
  function runCloseTransaction(roots, reason, originalEvent, forceClose) {
    var plan = [];
    var seen = new Set();
    for (var collectIndex = 0; collectIndex < roots.length; collectIndex += 1) collectClosePlan(roots[collectIndex], plan, seen);
    if (!plan.length) return true;
    if (forceClose !== 'destroy' && plan.some(function (item) { return item.record.isTreeClosing(); })) return false;
    for (var guardIndex = 0; guardIndex < plan.length; guardIndex += 1) plan[guardIndex].record.enterTreeClose();
    try {
      // Every planned node is guarded before the first user preflight runs. A parent or
      // earlier sibling hook therefore cannot close/reopen a later descendant/sibling.
      for (var preflightIndex = 0; preflightIndex < plan.length; preflightIndex += 1) {
        var candidate = plan[preflightIndex];
        if (!candidate.wasOpen) continue;
        candidate.beforeInfo = candidate.record.preflightClose(reason, originalEvent, forceClose || null, true);
        if (!candidate.beforeInfo) return false;
      }
      for (var checkIndex = 0; checkIndex < plan.length; checkIndex += 1) {
        var pending = plan[checkIndex];
        if (pending.wasOpen && (pending.owner.getState().destroyed || !pending.owner.getState().open)) return false;
      }
      for (var commitIndex = plan.length - 1; commitIndex >= 0; commitIndex -= 1) {
        var item = plan[commitIndex];
        if (item.beforeInfo && !item.record.commitClose(item.beforeInfo) && item.owner.getState().open) return false;
      }
      return plan.every(function (item) { return item.owner.getState().open === false; });
    } finally {
      releaseClosePlan(plan);
    }
  }
  function closeChildren(reason, originalEvent, except) {
    var children = getChildren().filter(function (child) { return child !== except; });
    runCloseTransaction(children, reason || 'parent-close', originalEvent || null, null);
    return api;
  }
  function closeTree(reason, originalEvent) {
    if (destroyed) return false;
    var wasOpen = opened;
    var accepted = runCloseTransaction([api], reason || 'tree-close', originalEvent || null, null);
    return wasOpen && accepted && !opened;
  }
  function closeSiblings(reason, originalEvent) {
    var parent = getParent();
    if (!parent) return api;
    runCloseTransaction(parent.getChildren().filter(function (sibling) { return sibling !== api; }), reason || 'sibling-close', originalEvent || null, null);
    return api;
  }
  function setParent(nextParent) {
    if (destroyed) return api;
    if (nextParent !== null && nextParent !== undefined && !isTriggerInstance(nextParent)) throw new TypeError('[QXFRAME9A7C2] Trigger parent must be another Trigger instance or null.');
    var next = nextParent || null;
    if (next === api) throw new TypeError('[QXFRAME9A7C2] Trigger cannot parent itself.');
    logicalNode.setParent(next ? INSTANCES.get(next).node : null);
    return api;
  }
  function addChild(child) { if (!isTriggerInstance(child)) throw new TypeError('[QXFRAME9A7C2] Trigger child must be another Trigger instance.'); child.setParent(api); return api; }
  function removeChild(child) { if (isTriggerInstance(child) && child.getParent() === api) child.setParent(null); return api; }
    
  function syncRuntimeSettings(next) {
    var keys = ['reference','allowReferenceUpdate','placement','strategy','offset','middleware','arrow','arrowElement','arrowPadding','flipOnOverflow','matchReferenceWidth','autoUpdate','autoUpdateOptions','closeOnOutsidePress','closeOnFocusOutside','closeOnTabExit','closeOnEscape','focusScope','trapFocus','lockScroll','scrollLockTarget','compensateScrollbar','restoreFocus','restoreFocusTarget','initialFocus','position','manageZIndex','parentLayerId','layerKind','componentType','group','zIndex','positionReference','useTransformPosition','inlinePositioning','inlinePositioningOptions','exclude','applyPosition','onPositionUpdate','onPositionError'];
    var patch = {};
    keys.forEach(function (key) {
      if (!own(next, key)) return;
      if (key === 'onPositionUpdate') patch[key] = handlePositionUpdate;
      else if (key === 'reference') patch[key] = reference;
      else patch[key] = opts[key];
    });
    if (own(next, 'placement') && !motionActive && !motionPreparing) projectMotionPlacement(opts.placement);
    if (own(next, 'tabExitTarget')) patch.tabExitTarget = resolveTabExitTarget;
    if (own(next, 'focusOnOpen')) patch.focusOnActivate = opts.focusOnOpen === true;
    if (own(next, 'destroyOnClose')) patch.destroyOnDeactivate = opts.destroyOnClose !== false;
    if (own(next, 'containsTarget')) patch.containsTarget = function (target) { return containsElement(target); };
    if (Object.keys(patch).length) runtime.updateOptions(patch);
    if (own(next, 'setVisible')) surface.updateOptions({ setVisible: opts.setVisible });
  }
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    validateContractOptions(ComponentContracts.get('Trigger'), nextOptions || {}, 'Trigger');
    var next = nextOptions || {};
    var nextReference = own(next, 'reference') ? resolveElement(next.reference, doc, 'reference') : reference;
    var referenceChanged = nextReference !== reference;
    if (referenceChanged && opts.allowReferenceUpdate !== true && next.allowReferenceUpdate !== true) throw new Error('[QXFRAME9A7C2] Trigger reference is immutable; destroy and recreate to change it.');
    if (own(next, 'triggerTarget') && resolveOptionalElement(next.triggerTarget, doc, 'triggerTarget') !== triggerTarget) throw new Error('[QXFRAME9A7C2] Trigger triggerTarget is immutable; destroy and recreate to change it.');
    if (own(next, 'transitionElement') && resolveElement(next.transitionElement, doc, 'transitionElement') !== transitionElement) throw new Error('[QXFRAME9A7C2] Trigger transitionElement is immutable; destroy and recreate to change it.');
    if (own(next, 'floating') && resolveElement(next.floating, doc, 'floating') !== floating) throw new Error('[QXFRAME9A7C2] Trigger floating is immutable; destroy and recreate to change it.');
    if (own(next, 'document') && next.document !== doc) throw new Error('[QXFRAME9A7C2] Trigger document is immutable; destroy and recreate to change it.');
    if (own(next, 'portalContainer') && resolveElement(next.portalContainer, doc, 'portalContainer') !== portalContainer) throw new Error('[QXFRAME9A7C2] Trigger portalContainer is immutable; destroy and recreate to change it.');
    if (own(next, 'transition') && next.transition !== opts.transition) throw new Error('[QXFRAME9A7C2] Trigger transition is immutable; destroy and recreate to change it.');
    var interactionChanged = referenceChanged || ['trigger','openDelay','closeDelay','disabled','interactiveBorder','interactiveDebounce','keyboardActivation'].some(function (key) { return own(next, key); });
    if (referenceChanged) { reference = nextReference; if (!triggerTargetExplicit) triggerTarget = nextReference; }
    if (own(next, 'offset')) offsetExplicit = next.offset !== undefined && next.offset !== null;
    Utils.copyOwn(opts, next);
    if (!offsetExplicit && (own(next, 'arrow') || own(next, 'offset'))) opts.offset = opts.arrow === true ? 12 : 8;
    triggers = normalizeTriggers(opts.trigger);
    syncRuntimeSettings(next);
    if (interactionChanged) rebuildInteraction();
    if (own(next, 'parent')) setParent(opts.parent || null);
    // Disabled is structural authority and wins over a simultaneous open:true patch.
    // During an outer tree preflight the forced close is deferred until that guard exits,
    // so a re-entrant setDisabled(true) cannot leave disabled + open behind.
    if (opts.disabled === true && opened) {
      if (treeCloseDepth > 0) pendingDisabledClose = true;
      else runCloseTransaction([api], 'disabled', null, 'disabled');
    } else {
      if (opts.disabled !== true) pendingDisabledClose = false;
      if (own(next, 'open')) {
        if (next.open === true) open('update-options');
        else close('update-options');
      } else if (opened && ['placement','strategy','offset','middleware','arrow','arrowElement','arrowPadding','flipOnOverflow','matchReferenceWidth','autoUpdate','autoUpdateOptions'].some(function (key) { return own(next, key); })) runtime.updatePosition('options');
    }
    return api;
  }
    
  function getState() {
    var transitionState = transition.getState();
    var runtimeState = runtime.getState();
    return Object.freeze({
      open: opened,
      present: transitionState.present,
      transition: transitionState,
      overlayActive: runtimeState.active,
      overlayInteractionActive: runtimeState.interactionActive === true,
      mounted: runtimeState.mounted,
      disabled: opts.disabled === true,
      trigger: triggers.slice(),
      hasTriggerTarget: !!triggerTarget,
      openDelay: resolvedDelay(opts.openDelay, 'triggerOpenDelay', reference),
      closeDelay: resolvedDelay(opts.closeDelay, 'triggerCloseDelay', reference),
      placement: String(opts.placement || 'bottom-start'),
      strategy: String(opts.strategy || 'absolute'),
      offset: opts.offset === undefined ? (opts.arrow === true ? 12 : 8) : opts.offset,
      arrow: opts.arrow === true,
      arrowPadding: opts.arrowPadding === undefined ? 8 : opts.arrowPadding,
      flipOnOverflow: opts.flipOnOverflow !== false,
      autoUpdate: opts.autoUpdate !== false,
      inlinePositioning: opts.inlinePositioning === true,
      layerId: runtimeState.layerId || null,
      parentLayerId: runtimeState.parentLayerId || null,
      closeOnFocusOutside: opts.closeOnFocusOutside === true,
      closeOnTabExit: opts.closeOnTabExit === true,
      focusScope: opts.trapFocus === true ? 'trap' : String(opts.focusScope == null || opts.focusScope === '' ? 'auto' : opts.focusScope),
      restoreFocusOnDismiss: opts.restoreFocusOnDismiss === true,
      destroyOnClose: opts.destroyOnClose !== false,
      childCount: getChildren().length,
      logicalDepth: logicalNode ? logicalNode.ancestors().length : 0,
      destroyed: destroyed
    });
  }
    
  function destroy(reason) {
    if (destroyed || destroying) return false;
    destroying = true;
    var instanceRecord = api && INSTANCES.get(api);
    if (instanceRecord) instanceRecord.destroying = true;
    // Destruction is a non-vetoable transport teardown. Propagate the canonical
    // destroy reason so descendant beforeClose hooks cannot leave open orphan overlays.
    // Descendants also observe the ancestor destroying flag, preventing synchronous
    // close callbacks from reopening this teardown tree while sibling closes continue.
    runCloseTransaction(getChildren(), 'destroy', null, 'destroy');
    if (interaction) interaction.destroy();
    interaction = null;
    if (opened) closeInternal('destroy', null, 'destroy');
    transition.destroy();
    runtime.destroy();
    surface.hide({ reason: 'destroy' });
    surface.destroy();
    if (logicalNode) logicalNode.destroy();
    logicalNode = null;
    emitter.dispose();
    destroyed = true;
    destroying = false;
    if (instanceRecord) instanceRecord.destroying = false;
    triggerTarget = null;
    return true;
  }
    
  api = Object.freeze({
    open: open,
    close: close,
    closeTree: closeTree,
    closeChildren: closeChildren,
    closeSiblings: closeSiblings,
    toggle: function (reason, originalEvent) { return destroyed || opts.disabled === true ? false : (opened ? close(reason || 'api', originalEvent || null) : open(reason || 'api', originalEvent || null)); },
    setOpen: function (value, reason, originalEvent) { return value === true ? open(reason || 'set-open', originalEvent) : close(reason || 'set-open', originalEvent); },
    reposition: function (reason) { return destroyed ? false : runtime.updatePosition(reason || 'api'); },
    updateOptions: updateOptions,
    setDisabled: function (value) { return updateOptions({ disabled: value === true }); },
    containsOwnElement: containsOwnElement,
    containsElement: containsElement,
    cancelClose: cancelClose,
    cancelCloseCascade: cancelCloseCascade,
    addChild: addChild,
    removeChild: removeChild,
    setParent: setParent,
    getParent: getParent,
    getChildren: getChildren,
    getLogicalNode: function () { return logicalNode; },
    getState: getState,
    getReferenceElement: function () { return reference; },
    getTriggerElement: function () { return triggerTarget; },
    getPopupElement: function () { return floating; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  });
    
  logicalNode = LogicalOwnership.createNode({ owner: api });
  INSTANCES.set(api, { node: logicalNode, interaction: null, destroying: false, preflightClose: preflightClose, commitClose: commitClose, enterTreeClose: enterTreeClose, leaveTreeClose: leaveTreeClose, isTreeClosing: isTreeClosing });
  if (opts.parent) setParent(opts.parent);
  rebuildInteraction();
  if (opts.forceRender === true) runtime.mount();
  if (opts.open === true) open('initial');
  return api;
}

export const Trigger = Object.freeze({
  definition: Object.freeze({ initializer: Object.freeze({ mode: 'create', bind: 'reference' }) }),
  create: create,
  motion: MotionPresets
});

export { create, normalizeTriggers };
