import { OverlayComponent } from './overlay.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { Utils } from '../utils/utils.js';
import { DOM } from '../core/dom.js';
import { IdManager } from '../utils/id.js';
import { Events } from '../core/events.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Config } from '../core/config.js';
import { OverlayFramePolicy } from '../core/overlayFramePolicy.js';
import { Renderer } from '../core/renderer.js';
import { OverlayRuntime } from '../core/overlayRuntime.js';
import { OverlayFrameShell } from '../core/overlayFrameShell.js';
import { PopupSurface } from '../core/popupSurface.js';
import { Transition } from '../core/transition.js';
import { MotionPresets } from '../core/motionPresets.js';
import { Scroll } from './scroll.js';

var PLACEMENTS = Object.freeze(['center','top','top-left','top-right','left','right','bottom','bottom-left','bottom-right']);
var REMOVED_OPTIONS = Object.freeze(['target','el','mount','visible','defaultVisible','getContainer','popupContainer']);
var IMMUTABLE_OPTIONS = Object.freeze(['id','document','portalContainer']);
var CALLBACKS = Object.freeze(['onConfirm','onCancel','onBeforeOpen','onBeforeClose','onOpen','onClose','onOpenChange','afterOpenChange','onDestroy']);
var own = Utils.own;
function rejectRemoved(input) {
  REMOVED_OPTIONS.forEach(function (key) {
    if (own(input, key)) throw new TypeError('[QXFRAME9A7C2] Modal removed option "' + key + '".');
  });
}
function bool(value, fallback, label) { return Utils.booleanValue(value, fallback, 'Modal ' + label); }
function enumValue(value, allowed, fallback, label) { return Utils.enumValue(value, allowed, fallback, 'Modal ' + label); }
function finite(value, fallback, label) { return Utils.finiteAtLeast(value, fallback, 0, 'Modal ' + label); }
function durationPair(input, enterKey, leaveKey, fallbackEnter, fallbackLeave) {
  var configured = input.duration;
  if (enterKey.indexOf('mask') === 0) configured = input.maskDuration;
  var list = Array.isArray(configured) ? configured : [configured, configured];
  var enter = own(input, enterKey) ? input[enterKey] : (list[0] !== undefined ? list[0] : fallbackEnter);
  var leave = own(input, leaveKey) ? input[leaveKey] : (list[1] !== undefined ? list[1] : (list[0] !== undefined ? list[0] : fallbackLeave));
  return [finite(enter, fallbackEnter, enterKey), finite(leave, fallbackLeave, leaveKey)];
}
var overlayButtonPolicy = Object.freeze({ owner:'Modal', dangerType:'error', closeOnClickDefault:true, autoLoadingDefault:true, classNamePolicy:true });
function resolveButtons(opts) { return OverlayFramePolicy.resolveButtons(opts, Utils.mergeOwn( overlayButtonPolicy, { requireExplicitFooter:false })); }
function normalize(input, previous) {
  var incoming = input || {};
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new TypeError('[QXFRAME9A7C2] Modal options must be an object.');
  rejectRemoved(incoming);
  var next = Utils.mergeOwn( previous || {}, incoming);
  next.placement = enumValue(next.placement, PLACEMENTS, 'center', 'placement');
  var closable = OverlayFramePolicy.normalizeClosable(own(incoming, 'closable') ? incoming.closable : undefined, previous, { owner:'Modal' });
  next.closable = closable.visible;
  next.closeOptions = closable.options;
  ['showMask','closeOnMask','closeOnEscape','destroyOnHidden','lockScroll','focusTrap','restoreFocus','forceRender','autoOpen','fullscreen','center'].forEach(function (key) {
    var defaults = {showMask:true,closeOnMask:true,closeOnEscape:true,destroyOnHidden:false,lockScroll:true,focusTrap:true,restoreFocus:true,forceRender:false,autoOpen:true,fullscreen:false,center:false};
    next[key] = bool(next[key], defaults[key], key);
  });
  if (next.header !== undefined && typeof next.header !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Modal header must be boolean.');
  if (next.footer !== undefined && next.footer !== null && typeof next.footer !== 'boolean' && typeof next.footer !== 'function' && typeof next.footer !== 'string' && typeof next.footer !== 'number' && !Renderer.isNodeLike(next.footer)) throw new TypeError('[QXFRAME9A7C2] Modal footer must be boolean, renderable content, or function.');
  if (next.buttons !== undefined && !Array.isArray(next.buttons)) throw new TypeError('[QXFRAME9A7C2] Modal buttons must be an array.');
  CALLBACKS.forEach(function (key) { if (next[key] != null && typeof next[key] !== 'function') throw new TypeError('[QXFRAME9A7C2] Modal ' + key + ' must be a function.'); });
  if (next.autoFocus !== undefined && next.autoFocus !== false && typeof next.autoFocus !== 'string' && typeof next.autoFocus !== 'function' && !(next.autoFocus && next.autoFocus.nodeType === 1)) throw new TypeError('[QXFRAME9A7C2] Modal autoFocus must be false, selector, Element, or function.');
  if (next.width !== undefined && next.width !== null && typeof next.width !== 'string' && !Number.isFinite(Number(next.width))) throw new TypeError('[QXFRAME9A7C2] Modal width must be a number or string.');
  if (next.maxWidth !== undefined && next.maxWidth !== null && typeof next.maxWidth !== 'string' && !Number.isFinite(Number(next.maxWidth))) throw new TypeError('[QXFRAME9A7C2] Modal maxWidth must be a number or string.');
  if (next.zIndex !== undefined && next.zIndex !== null && next.zIndex !== '' && !Number.isFinite(Number(next.zIndex))) throw new TypeError('[QXFRAME9A7C2] Modal zIndex must be a finite number.');
  next.zIndex = next.zIndex === undefined || next.zIndex === null || next.zIndex === '' ? null : Math.floor(Number(next.zIndex));
  durationPair(next, 'enterDuration', 'leaveDuration', 240, 180);
  durationPair(next, 'maskEnterDuration', 'maskLeaveDuration', 240, 180);
  next.title = next.title === undefined ? '提示' : next.title;
  next.className = next.className == null ? '' : String(next.className);
  next.maskClassName = next.maskClassName == null ? '' : String(next.maskClassName);
  return next;
}
function px(value) { return typeof value === 'number' ? value + 'px' : (value || ''); }
    
function createModalController(instance, options) {
  var opts = normalize(Utils.assignOwn({
    title: '提示', content: '', closable: true, showMask: true, closeOnMask: true,
    closeOnEscape: true, destroyOnHidden: false, lockScroll: true, focusTrap: true,
    restoreFocus: true, forceRender: false, autoOpen: true, placement: 'center',
    animation: 'zoom-origin', maskAnimation: 'fade', fullscreen: false, center: false
  }, options || {}));
  var doc = opts.document || globalThis.document;
  if (!doc || typeof doc.createElement !== 'function') throw new Error('[QXFRAME9A7C2] Modal requires a browser document.');
  opts.document = doc;
  var portalContainer = opts.portalContainer || doc.body;
  if (!portalContainer || typeof portalContainer.appendChild !== 'function') throw new TypeError('[QXFRAME9A7C2] Modal portalContainer must be an Element.');
  opts.portalContainer = portalContainer;
    
  var emitter = Object.freeze({
    emit: function (type, detail) { return instance.emit(type, detail); },
    on: function (type, listener) { return instance.on(type, listener); },
    once: function (type, listener) { return instance.once(type, listener); },
    dispose: function () {}
  });
  var scope = Lifecycle.createScope();
  var id = opts.id ? String(opts.id) : IdManager.next('modal');
  var root = doc.createElement('div');
  var mask = doc.createElement('div');
  var wrap = doc.createElement('div');
  var dialog = doc.createElement('div');
  var header = doc.createElement('div');
  var title = doc.createElement('span');
  var closeButton = doc.createElement('button');
  var body = doc.createElement('div');
  var footer = doc.createElement('div');
  root.className = 'qxframe9a7c2-modal-root';
  mask.className = 'qxframe9a7c2-modal-mask';
  wrap.className = 'qxframe9a7c2-modal-wrapper';
  dialog.className = 'qxframe9a7c2-modal-container';
  header.className = 'qxframe9a7c2-modal-header';
  title.className = 'qxframe9a7c2-modal-title';
  closeButton.className = 'qxframe9a7c2-button is-text is-sm qxframe9a7c2-modal-close';
  body.className = 'qxframe9a7c2-modal-body';
  footer.className = 'qxframe9a7c2-modal-footer';
  title.id = id + '-title';
  dialog.tabIndex = -1;
  closeButton.type = 'button';
  body.appendChild(doc.createElement('span'));
  wrap.appendChild(dialog);
  root.appendChild(mask);
  root.appendChild(wrap);
  var scroll = Scroll.create({ container: body, axis: 'y', wheelPropagation: true, scrollbarVisibility: opts.scrollbarVisibility || 'auto', document: doc });
  var contentHost = scroll.getContentElement();
  var destroyed = false;
  var opened = false;
  var api = instance;
  var overlay = null;
  var surface = null;
  var maskTransition = null;
  var dialogTransition = null;
  var buttons = [];
  var lastMotion = null;
  var recentPointer = null;
  var beforeOpenGuard = false;
  var leaveMaskDone = true;
  var leaveDialogDone = true;
  var pendingLeaveDetail = null;
  var hiddenContentDestroyed = false;
  var frameShell = OverlayFrameShell.create({ document:doc, portalContainer:portalContainer, root:root, wrap:wrap, surface:dialog, header:header, title:title, body:body, footer:footer, closeButton:closeButton, componentType:'Modal', closePlacement:false, getOptions:function(){return opts;}, getApi:function(){return api;}, getButtons:function(){return buttons;} , setButtons:function(value){buttons=Array.isArray(value)?value:[];}, close:function(reason,event){return close(reason,event);}, invokeCallback:function(eventName,data){return callback(eventName,data);}, isDestroyed:function(){return destroyed;}, emitActionError:function(detail){emitter.emit('actionError',detail);}, isOpen:function(){return opened;}, beforeClose:function(reason,event){return callback('onBeforeClose',payload(reason,event));}, acceptClose:function(reason,event){return closeAccepted(reason,event);}, getContentHost:function(){return contentHost;}, getScope:function(){return scope;}, getScroll:function(){return scroll;}, getSurface:function(){return surface;}, getOverlay:function(){return overlay;}, getEmitter:function(){return emitter;}, afterDestroy:function(reason){callback('onDestroy',{instance:api,reason:reason});} });
    
  function motionDisabled() { return !Config.motionEnabled(root); }
  function durations() {
    var modal = durationPair(opts, 'enterDuration', 'leaveDuration', 240, 180);
    var maskDur = durationPair(opts, 'maskEnterDuration', 'maskLeaveDuration', modal[0], modal[1]);
    if (motionDisabled()) { modal = [0, 0]; maskDur = [0, 0]; }
    else {
      if (opts.animation === false) modal = [0, 0];
      if (opts.maskAnimation === false) maskDur = [0, 0];
    }
    return { enter: Math.max(modal[0], maskDur[0]), leave: Math.max(modal[1], maskDur[1]), modal: modal, mask: maskDur };
  }
  function transitionState() {
    if (destroyed) return 'destroyed';
    var state = dialogTransition ? dialogTransition.getState() : { phase: 'hidden' };
    if (state.phase === 'entering') return 'showing';
    if (state.phase === 'shown') return 'shown';
    if (state.phase === 'leaving') return 'hiding';
    return 'hidden';
  }
  function easing(configured, enterKey, leaveKey, enterFallback, leaveFallback) {
    var list = Array.isArray(configured) ? configured : [configured, configured];
    return [opts[enterKey] !== undefined ? opts[enterKey] : (list[0] || enterFallback), opts[leaveKey] !== undefined ? opts[leaveKey] : (list[1] || list[0] || leaveFallback)];
  }
  function callback(name) {
    var fn = opts[name];
    if (typeof fn !== 'function') return undefined;
    return fn.apply(null, Array.prototype.slice.call(arguments, 1));
  }
  function payload(reason, event) {
    return { instance: api, source: DOM.activationSource(event), reason: reason || 'api', event: event || null, root: root, mask: mask, wrap: wrap, dialog: dialog, body: body, title: title, footer: footer, overlayRuntime: overlay };
  }
  function eventPoint(event) {
    if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
    if (event.clientX === 0 && event.clientY === 0 && event.detail === 0) return null;
    return { x: event.clientX, y: event.clientY };
  }
  function originPoint(event) {
    var direct = eventPoint(event);
    if (direct) return direct;
    var origin = typeof opts.origin === 'function' ? opts.origin(api) : opts.origin;
    if (origin && origin.nodeType === 1 && origin.getBoundingClientRect) {
      var rect = origin.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }
    if (recentPointer && Date.now() - recentPointer.time <= 200) return { x: recentPointer.x, y: recentPointer.y };
    return null;
  }
  function measureDialogRect() {
    var style = dialog.style;
    var transform = style.getPropertyValue('transform');
    var transformPriority = style.getPropertyPriority('transform');
    var transition = style.getPropertyValue('transition');
    var transitionPriority = style.getPropertyPriority('transition');
    style.setProperty('transition', 'none', 'important');
    style.setProperty('transform', 'none', 'important');
    var rect = dialog.getBoundingClientRect();
    if (transform) style.setProperty('transform', transform, transformPriority);
    else style.removeProperty('transform');
    if (transition) style.setProperty('transition', transition, transitionPriority);
    else style.removeProperty('transition');
    return rect;
  }
  function applyMotion(showing, event) {
    var timing = durations();
    var modalDuration = showing ? timing.modal[0] : timing.modal[1];
    var maskDuration = showing ? timing.mask[0] : timing.mask[1];
    dialog.style.setProperty('--qxframe9a7c2-motion-duration-slow', modalDuration + 'ms');
    dialog.style.setProperty('--qxframe9a7c2-motion-duration-mid', modalDuration + 'ms');
    mask.style.setProperty('--qxframe9a7c2-motion-duration-mid', maskDuration + 'ms');
    if (!showing) return;
    var point = originPoint(event);
    var rect = measureDialogRect();
    if (point && rect.width > 0 && rect.height > 0) {
      dialog.style.transformOrigin = Math.round(point.x - rect.left) + 'px ' + Math.round(point.y - rect.top) + 'px';
    } else {
      dialog.style.transformOrigin = '50% 50%';
    }
  }
  function dialogMotion() {
    if (opts.animation === false) {
      return { type: 'transition', appear: { from: null, active: null, to: null }, enter: { from: null, active: null, to: null }, leave: { from: null, active: null, to: null } };
    }
    var name = opts.animation || 'zoom-origin';
    if (name !== 'zoom-origin' && name !== 'zoom' && name !== 'zoomIn') return MotionPresets.resolve(name);
    // The mask and dialog are sibling motion owners. The mask fades the backdrop;
    // the dialog owns its own opacity together with the existing trigger-origin scale.
    // Keeping both dialog properties in one Transition descriptor guarantees that enter,
    // leave, and reversal retarget the same painted element without an opacity handoff.
    return {
      type: 'transition',
      appear: {
        from: { style: { transform: 'scale(.2)', opacity: '0' } },
        active: { style: { transition: 'transform var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ), opacity var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ)' } },
        to: { style: { transform: 'scale(1)', opacity: '1' } }
      },
      enter: {
        from: { style: { transform: 'scale(.2)', opacity: '0' } },
        active: { style: { transition: 'transform var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ), opacity var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ)' } },
        to: { style: { transform: 'scale(1)', opacity: '1' } }
      },
      leave: {
        from: { style: { transform: 'scale(1)', opacity: '1' } },
        active: { style: { transition: 'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-in-out-circ), opacity var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-in-out-circ)' } },
        to: { style: { transform: 'scale(.2)', opacity: '0' } }
      }
    };
  }
  function maskMotion() {
    if (opts.maskAnimation === false) return 'fade';
    return opts.maskAnimation || 'fade';
  }
  function applyVisualOptions() {
    root.className = 'qxframe9a7c2-modal-root';
    mask.className = ('qxframe9a7c2-modal-mask ' + opts.maskClassName).trim();
    wrap.className = 'qxframe9a7c2-modal-wrapper';
    dialog.className = ('qxframe9a7c2-modal-container ' + opts.className).trim();
    root.dataset.placement = opts.placement;
    wrap.dataset.placement = opts.placement;
    DOM.setPrivate(mask, 'maskAnimation', opts.maskAnimation === false ? 'none' : (opts.maskAnimation || 'fade'));
    DOM.setPrivate(dialog, 'animation', opts.animation === false ? 'none' : (opts.animation || 'zoom-origin'));
    dialog.classList.toggle('is-fullscreen', opts.fullscreen === true);
    dialog.classList.toggle('is-center', opts.center === true);
    mask.classList.toggle('is-maskless', opts.showMask === false);
    if (own(opts, 'width')) dialog.style.width = px(opts.width);
    if (own(opts, 'maxWidth')) dialog.style.maxWidth = px(opts.maxWidth);
    if (own(opts, 'maskColor')) mask.style.background = opts.maskColor || '';
    if (own(opts, 'maskBlur')) mask.style.backdropFilter = opts.maskBlur ? 'blur(' + px(opts.maskBlur) + ')' : '';
    frameShell.applyStyle(dialog, opts.style);
    frameShell.applyStyle(mask, opts.maskStyle);
    // Global stacking is projected by LayerManager through OverlayRuntime. Public zIndex
    // remains a relative offset and is never written as an absolute component z-index.
    if (!overlay || !overlay.getState().active) root.style.zIndex = '';
  }
  function renderTitle() { frameShell.renderValue(title, opts.title, { instance: api, close: close }); }
  function renderContent() { frameShell.renderValue(contentHost, opts.content, { instance: api, close: close, scroll: scroll }); scroll.refresh(); }
  function renderFooter() { buttons = frameShell.renderFooter(resolveButtons); }
  function destroyHiddenContent() {
    if (!opts.destroyOnHidden || hiddenContentDestroyed) return false;
    frameShell.clearActions();
    buttons = [];
    Renderer.replace(title, '', doc);
    Renderer.replace(contentHost, '', doc);
    Renderer.replace(footer, '', doc);
    hiddenContentDestroyed = true;
    syncChrome();
    return true;
  }
  function ensureHiddenContent() {
    if (!hiddenContentDestroyed) return false;
    hiddenContentDestroyed = false;
    renderTitle();
    renderContent();
    renderFooter();
    syncChrome();
    return true;
  }
  var closeConfig = frameShell.closeConfig;
  var syncCloseButton = frameShell.syncCloseButton;
  var syncChrome = frameShell.syncChrome;
  var initialFocus = frameShell.initialFocus;
  function overlayOptions() { return frameShell.overlayOptions({ onDismiss:function(detail){return requestClose(detail.reason, detail.originalEvent);} }); }
  function finalizeLeave() {
    if (destroyed || opened || !leaveMaskDone || !leaveDialogDone || !pendingLeaveDetail) return false;
    var detail = pendingLeaveDetail;
    pendingLeaveDetail = null;
    surface.hide(detail);
    overlay.deactivate(detail);
    destroyHiddenContent();
    callback('afterOpenChange', false, payload(detail.reason, detail.originalEvent));
    var config = closeConfig();
    if (typeof config.afterClose === 'function') config.afterClose(payload(detail.reason, detail.originalEvent));
    if (destroyed || opened) return true;
    emitter.emit('afterOpenChange', { open: false, source: DOM.activationSource(detail.originalEvent), reason: detail.reason, originalEvent: detail.originalEvent });
    return true;
  }
  var requestClose = frameShell.requestClose;
  function closeAccepted(reason, event) {
    // Flip the logical state before public close callbacks. This makes close() re-entrant
    // safe: onOpenChange/onClose handlers cannot recursively start another close cycle.
    opened = false;
    callback('onOpenChange', false, payload(reason, event));
    if (destroyed || opened) return api;
    callback('onClose', payload(reason, event));
    if (destroyed || opened) return api;
    emitter.emit('openChange', { open: false, source: DOM.activationSource(event), reason: reason || 'close', originalEvent: event || null });
    if (destroyed || opened) return api;
    applyMotion(false, event);
    var timing = durations();
    pendingLeaveDetail = { reason: reason || 'close', originalEvent: event || null };
    leaveMaskDone = false;
    leaveDialogDone = false;
    maskTransition.setVisible(false, { reason: reason || 'close', originalEvent: event || null, immediate: timing.mask[1] <= 0 || opts.maskAnimation === false });
    dialogTransition.setVisible(false, { reason: reason || 'close', originalEvent: event || null, immediate: timing.modal[1] <= 0 || opts.animation === false });
    return api;
  }
  function open(reason, event) {
    reason = reason || 'open';
    if (destroyed || beforeOpenGuard || frameShell.isClosing() || (opened && transitionState() !== 'hiding')) return api;
    ensureHiddenContent();
    var openPayload = payload(reason, event);
    beforeOpenGuard = true;
    var accepted;
    try { accepted = callback('onBeforeOpen', openPayload) !== false && !destroyed; }
    finally { beforeOpenGuard = false; }
    if (!accepted || destroyed) return api;
    pendingLeaveDetail = null;
    leaveMaskDone = true;
    leaveDialogDone = true;
    overlay.mount();
    opened = true;
    applyVisualOptions();
    surface.show(openPayload);
    applyMotion(true, event);
    var timing = durations();
    maskTransition.setVisible(true, { reason: reason, originalEvent: event || null, immediate: timing.mask[0] <= 0 || opts.maskAnimation === false });
    dialogTransition.setVisible(true, { reason: reason, originalEvent: event || null, immediate: timing.modal[0] <= 0 || opts.animation === false });
    if (!destroyed && opened && !overlay.getState().active) overlay.activate({ reason: reason, originalEvent: event || null });
    return api;
  }
  function close(reason, event) { requestClose(reason || 'close', event || null); return api; }
  function setOpen(next, reason, event) { return next ? open(reason || 'setOpen', event) : close(reason || 'setOpen', event); }
  function updateOverlayOptions() {
    overlay.updateOptions({
      closeOnEscape: opts.closeOnEscape, trapFocus: opts.focusTrap, lockScroll: opts.lockScroll,
      restoreFocus: opts.restoreFocus, destroyOnDeactivate: opts.destroyOnHidden === true,
      initialFocus: initialFocus, focusOnActivate: opts.autoFocus !== false, zIndex: opts.zIndex
    });
  }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var incoming = nextOptions || {};
    IMMUTABLE_OPTIONS.forEach(function (key) { if (own(incoming, key) && incoming[key] !== opts[key]) throw new Error('[QXFRAME9A7C2] Modal ' + key + ' is immutable; destroy and recreate to change it.'); });
    var candidate = normalize(incoming, opts);
    opts = candidate;
    if (hiddenContentDestroyed && opts.destroyOnHidden !== true) ensureHiddenContent();
    if (!hiddenContentDestroyed || opened) { renderTitle(); renderContent(); renderFooter(); }
    applyVisualOptions(); syncChrome(); updateOverlayOptions();
    if (!opened && opts.destroyOnHidden === true) destroyHiddenContent();
    return api;
  }
  function destroy(reason) {
    if (destroyed) return false;
    opened = false;
    destroyed = true;
    if (maskTransition) maskTransition.destroy();
    if (dialogTransition) dialogTransition.destroy();
    frameShell.disposeFrame(reason || 'destroy');
    return true;
  }
    
  surface = PopupSurface.create({
    element: root,
    setVisible: function (visible) {
      if (visible) root;
      else root;
    }
  });
  surface.hide({ reason: 'initial' });
  overlay = OverlayRuntime.create(overlayOptions());
  maskTransition = Transition.create({
    element: mask,
    transition: function () { return maskMotion(); },
    appear: true,
    reducedMotion: function () { return motionDisabled(); },
    onAfterLeave: function () {
      leaveMaskDone = true;
      finalizeLeave();
    }
  });
  dialogTransition = Transition.create({
    element: dialog,
    transition: function () { return dialogMotion(); },
    appear: true,
    reducedMotion: function () { return motionDisabled(); },
    onBeforeEnter: function (context) {
      if (destroyed || !opened) return;
      var reason = context.reason || 'open', event = context.originalEvent || null;
      callback('onOpenChange', true, payload(reason, event));
      if (destroyed || !opened) return;
      callback('onOpen', payload(reason, event));
      if (destroyed || !opened) return;
      emitter.emit('openChange', { open: true, source: DOM.activationSource(event), reason: reason, originalEvent: event });
    },
    onAfterEnter: function (context) {
      if (destroyed || !opened) return;
      scroll.refresh();
      var reason = context.reason || 'open', event = context.originalEvent || null;
      callback('afterOpenChange', true, payload(reason, event));
      if (destroyed || !opened) return;
      emitter.emit('afterOpenChange', { open: true, source: DOM.activationSource(event), reason: reason, originalEvent: event });
    },
    onAfterLeave: function () {
      leaveDialogDone = true;
      finalizeLeave();
    }
  });
    
  var controller = Object.freeze({
    setOpen: setOpen, open: open, close: close,
    setTitle: function (value) { return updateOptions({ title: value }); },
    setContent: function (value) { return updateOptions({ content: value }); },
    setButtons: function (value) { return updateOptions({ buttons: Array.isArray(value) ? value : [] }); },
    setHeaderVisible: function (value) { return updateOptions({ header: value !== false }); },
    setFooterVisible: function (value) { return updateOptions({ footer: value !== false }); },
    setClosable: function (value) { return updateOptions({ closable: value }); },
    updateOptions: updateOptions,
    getState: function () { var state = overlay.getState(), config = closeConfig(); return Object.freeze({ open: opened, mounted: state.mounted, overlayActive: state.active, transitionState: transitionState(), destroyed: destroyed, headerVisible: opts.header !== false, footerVisible: !footer.hidden, closable: opts.closable, closeDisabled: config.disabled === true, lockScroll: opts.lockScroll, showMask: opts.showMask, placement: opts.placement, buttonCount: buttons.length, contentMounted: !hiddenContentDestroyed }); },
    getRootElement: function () { return root; },
    getMaskElement: function () { return mask; },
    getWrapElement: function () { return wrap; },
    getDialogElement: function () { return dialog; },
    getBodyElement: function () { return body; },
    getOverlayRuntime: function () { return overlay; },
    getScroll: function () { return scroll; },
    on: emitter.on, once: emitter.once,
    destroy: destroy
  });
        
  renderTitle();
  renderContent();
  renderFooter();
  applyVisualOptions();
  syncChrome();
  if (opts.destroyOnHidden && !opts.autoOpen) destroyHiddenContent();
  scope.add(DOM.listen(doc, 'pointerdown', function (event) {
    var point = eventPoint(event);
    if (point) recentPointer = { x: point.x, y: point.y, time: Date.now() };
  }, true));
  scope.add(DOM.listen(closeButton, 'click', function (event) { if (!closeButton.disabled) close('x', event); }));
  scope.add(DOM.listen(mask, 'mousedown', function (event) { if (event.target === mask && opts.closeOnMask) close('mask', event); }));
  if (globalThis.addEventListener) scope.add(DOM.listen(globalThis, 'resize', function () { if (opened) scroll.refresh(); }));
    
    
  if (opts.forceRender && !opts.autoOpen) overlay.mount();
  if (opts.autoOpen) open('autoOpen', null);
  return controller;
}
    

export class Modal extends OverlayComponent {
    static options = Object.freeze({ title:'提示', content:'', closable:true, showMask:true, closeOnMask:true, closeOnEscape:true, destroyOnHidden:false, lockScroll:true, focusTrap:true, restoreFocus:true, forceRender:false, autoOpen:true, placement:'center', animation:'zoom-origin', maskAnimation:'fade', fullscreen:false, center:false });
    static immutableOptions = Object.freeze(['id','document','portalContainer']);
    static contract = ComponentContracts.get('Modal');
    static placements = PLACEMENTS.slice();

    constructor(options = {}) {
        super(options);
        this.adoptOverlayController(createModalController(this, this.options));
    }

    getDialogElement() { const c = this.getOverlayController(); return c && c.getDialogElement ? c.getDialogElement() : null; }
}

export { PLACEMENTS };
