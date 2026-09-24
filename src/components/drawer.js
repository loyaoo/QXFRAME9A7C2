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

var PLACEMENTS = Object.freeze(['left', 'right', 'top', 'bottom']);
var ANIMATIONS = Object.freeze(['slide', 'expand']);
var IMMUTABLE_OPTIONS = Object.freeze(['id', 'document', 'portalContainer']);
var CALLBACKS = Object.freeze(['onConfirm', 'onCancel', 'onBeforeOpen', 'onBeforeClose', 'onOpen', 'onClose', 'onOpenChange', 'afterOpenChange', 'onDestroy']);
var own = Utils.own;
function bool(value, fallback, label) { return Utils.booleanValue(value, fallback, 'Drawer ' + label); }
function enumValue(value, allowed, fallback, label) { return Utils.enumValue(value, allowed, fallback, 'Drawer ' + label); }
function finite(value, fallback, label) { return Utils.finiteAtLeast(value, fallback, 0, 'Drawer ' + label); }
function durationPair(input) {
  var configured = input.duration;
  var list = Array.isArray(configured) ? configured : [configured, configured];
  var enter = own(input, 'enterDuration') ? input.enterDuration : (list[0] !== undefined ? list[0] : 240);
  var leave = own(input, 'leaveDuration') ? input.leaveDuration : (list[1] !== undefined ? list[1] : (list[0] !== undefined ? list[0] : 200));
  return [finite(enter, 240, 'enterDuration'), finite(leave, 200, 'leaveDuration')];
}
function easingPair(input) {
  var configured = input.easing;
  var list = Array.isArray(configured) ? configured : [configured, configured];
  return [
    input.enterEasing !== undefined ? String(input.enterEasing) : String(list[0] || 'cubic-bezier(.08,.82,.17,1)'),
    input.leaveEasing !== undefined ? String(input.leaveEasing) : String(list[1] || list[0] || 'cubic-bezier(.6,.04,.98,.34)')
  ];
}
var overlayButtonPolicy = Object.freeze({ owner:'Drawer', dangerType:'error', closeOnClickDefault:true, autoLoadingDefault:true, classNamePolicy:true });
function resolveButtons(opts) { return OverlayFramePolicy.resolveButtons(opts, Utils.mergeOwn( overlayButtonPolicy, { requireExplicitFooter:true })); }
function validRenderable(value) {
  return value === undefined || value === null || typeof value === 'boolean' || typeof value === 'function' || typeof value === 'string' || typeof value === 'number' || Renderer.isNodeLike(value);
}
function normalize(input, previous) {
  var incoming = input || {};
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new TypeError('[QXFRAME9A7C2] Drawer options must be an object.');
    var next = Utils.mergeOwn( previous || {}, incoming);
  next.placement = enumValue(next.placement, PLACEMENTS, 'right', 'placement');
  var closable = OverlayFramePolicy.normalizeClosable(own(incoming, 'closable') ? incoming.closable : undefined, previous, { owner:'Drawer', placements:['start','end'] });
  next.closable = closable.visible;
  next.closeOptions = closable.options;
  ['showMask', 'closeOnMask', 'closeOnEscape', 'destroyOnHidden', 'lockScroll', 'focusTrap', 'restoreFocus', 'forceRender', 'autoOpen', 'respectReducedMotion'].forEach(function (key) {
    var defaults = { showMask: true, closeOnMask: true, closeOnEscape: true, destroyOnHidden: false, lockScroll: true, focusTrap: true, restoreFocus: true, forceRender: false, autoOpen: true, respectReducedMotion: true };
    next[key] = bool(next[key], defaults[key], key);
  });
  if (next.header !== undefined && typeof next.header !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Drawer header must be boolean.');
  if (!validRenderable(next.footer)) throw new TypeError('[QXFRAME9A7C2] Drawer footer must be boolean, renderable content, or function.');
  if (next.buttons !== undefined && !Array.isArray(next.buttons)) throw new TypeError('[QXFRAME9A7C2] Drawer buttons must be an array.');
  CALLBACKS.forEach(function (key) { if (next[key] != null && typeof next[key] !== 'function') throw new TypeError('[QXFRAME9A7C2] Drawer ' + key + ' must be a function.'); });
  if (next.autoFocus !== undefined && next.autoFocus !== false && typeof next.autoFocus !== 'string' && typeof next.autoFocus !== 'function' && !(next.autoFocus && next.autoFocus.nodeType === 1)) throw new TypeError('[QXFRAME9A7C2] Drawer autoFocus must be false, selector, Element, or function.');
  if (next.zIndex !== undefined && next.zIndex !== null && next.zIndex !== '' && !Number.isFinite(Number(next.zIndex))) throw new TypeError('[QXFRAME9A7C2] Drawer zIndex must be a finite number.');
  next.zIndex = next.zIndex === undefined || next.zIndex === null || next.zIndex === '' ? null : Math.floor(Number(next.zIndex));
  ['width', 'height'].forEach(function (key) {
    if (next[key] !== undefined && next[key] !== null && next[key] !== '' && typeof next[key] !== 'string' && !Number.isFinite(Number(next[key]))) throw new TypeError('[QXFRAME9A7C2] Drawer ' + key + ' must be a number or string.');
  });
  if (next.animation !== false) next.animation = enumValue(next.animation, ANIMATIONS, 'slide', 'animation');
  durationPair(next);
  easingPair(next);
  next.title = next.title === undefined ? '' : next.title;
  next.content = next.content === undefined ? '' : next.content;
  next.className = next.className == null ? '' : String(next.className);
  next.maskClassName = next.maskClassName == null ? '' : String(next.maskClassName);
  return next;
}
function px(value) { return typeof value === 'number' ? value + 'px' : (value || ''); }
    
function createDrawerController(instance, options) {
  var opts = normalize(Utils.assignOwn({
    title: '', content: '', placement: 'right', closable: true, showMask: true,
    closeOnMask: true, closeOnEscape: true, destroyOnHidden: false, lockScroll: true,
    focusTrap: true, restoreFocus: true, forceRender: false, autoOpen: true,
    respectReducedMotion: true, animation: 'slide'
  }, options || {}));
  var doc = opts.document || globalThis.document;
  if (!doc || typeof doc.createElement !== 'function') throw new Error('[QXFRAME9A7C2] Drawer requires a browser document.');
  opts.document = doc;
  var portalContainer = opts.portalContainer || doc.body;
  if (!portalContainer || typeof portalContainer.appendChild !== 'function') throw new TypeError('[QXFRAME9A7C2] Drawer portalContainer must be an Element.');
  opts.portalContainer = portalContainer;
    
  var emitter = Object.freeze({
    emit: function (type, detail) { return instance.emit(type, detail); },
    on: function (type, listener) { return instance.on(type, listener); },
    once: function (type, listener) { return instance.once(type, listener); },
    dispose: function () {}
  });
  var scope = Lifecycle.createScope();
  var id = opts.id ? String(opts.id) : IdManager.next('drawer');
  var root = doc.createElement('div');
  var mask = doc.createElement('div');
  var wrap = doc.createElement('div');
  var panel = doc.createElement('div');
  var header = doc.createElement('div');
  var title = doc.createElement('span');
  var closeButton = doc.createElement('button');
  var body = doc.createElement('div');
  var footer = doc.createElement('div');
  root.className = 'qxframe9a7c2-drawer-root';
  mask.className = 'qxframe9a7c2-drawer-mask';
  wrap.className = 'qxframe9a7c2-drawer-wrap';
  panel.className = 'qxframe9a7c2-drawer';
  header.className = 'qxframe9a7c2-drawer-header';
  title.className = 'qxframe9a7c2-drawer-title';
  closeButton.className = 'qxframe9a7c2-button is-text is-sm qxframe9a7c2-drawer-close';
  body.className = 'qxframe9a7c2-drawer-body';
  footer.className = 'qxframe9a7c2-drawer-footer';
  title.id = id + '-title';
  panel.tabIndex = -1;
  closeButton.type = 'button';
  body.appendChild(doc.createElement('span'));
  wrap.appendChild(panel);
  root.appendChild(mask);
  root.appendChild(wrap);
    
  var scroll = Scroll.create({ container: body, axis: 'y', wheelPropagation: true, scrollbarVisibility: opts.scrollbarVisibility || 'auto', document: doc });
  var contentHost = scroll.getContentElement();
  var destroyed = false;
  var opened = false;
  var api = instance;
  var overlay = null;
  var surface = null;
  var panelTransition = null;
  var maskTransition = null;
  var buttons = [];
  var beforeOpenGuard = false;
  var leaveMaskDone = true;
  var leavePanelDone = true;
  var pendingLeaveDetail = null;
  var hiddenContentDestroyed = false;
  var frameShell = OverlayFrameShell.create({ document:doc, portalContainer:portalContainer, root:root, wrap:wrap, surface:panel, header:header, title:title, body:body, footer:footer, closeButton:closeButton, componentType:'Drawer', closePlacement:true, getOptions:function(){return opts;}, getApi:function(){return api;}, getButtons:function(){return buttons;} , setButtons:function(value){buttons=Array.isArray(value)?value:[];}, close:function(reason,event){return close(reason,event);}, invokeCallback:function(eventName,data){return callback(eventName,data);}, isDestroyed:function(){return destroyed;}, emitActionError:function(detail){emitter.emit('actionError',detail);}, isOpen:function(){return opened;}, beforeClose:function(reason,event){return callback('onBeforeClose',payload(reason,event));}, acceptClose:function(reason,event){return closeAccepted(reason,event);}, getContentHost:function(){return contentHost;}, getScope:function(){return scope;}, getScroll:function(){return scroll;}, getSurface:function(){return surface;}, getOverlay:function(){return overlay;}, getEmitter:function(){return emitter;}, afterDestroy:function(reason){callback('onDestroy',{instance:api,reason:reason});} });
    
  function callback(name) {
    var fn = opts[name];
    if (typeof fn !== 'function') return undefined;
    return fn.apply(null, Array.prototype.slice.call(arguments, 1));
  }
  function payload(reason, event) {
    return { instance: api, source: DOM.activationSource(event), reason: reason || 'api', event: event || null, root: root, mask: mask, wrap: wrap, panel: panel, body: body, title: title, footer: footer, side: opts.placement, overlayRuntime: overlay };
  }
  function transitionEnabled() {
    return opts.animation !== false && Config.motionEnabled(root, undefined, opts.respectReducedMotion !== false);
  }
  function durations() {
    var pair = durationPair(opts);
    return transitionEnabled() ? pair : [0, 0];
  }
  function transformDescriptor(hidden, origin) {
    return {
      type: 'transition',
      appear: { from: { style: { transform: hidden, transformOrigin: origin } }, active: { style: { transition: 'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-out-circ)' } }, to: { style: { transform: 'translate3d(0,0,0) scale(1)' } } },
      enter: { from: { style: { transform: hidden, transformOrigin: origin } }, active: { style: { transition: 'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-out-circ)' } }, to: { style: { transform: 'translate3d(0,0,0) scale(1)' } } },
      leave: { from: { style: { transform: 'translate3d(0,0,0) scale(1)', transformOrigin: origin } }, active: { style: { transition: 'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-in-out-circ)' } }, to: { style: { transform: hidden } } }
    };
  }
  function panelMotion() {
    var origin = opts.placement === 'left' ? 'left center' : opts.placement === 'right' ? 'right center' : opts.placement === 'top' ? 'center top' : 'center bottom';
    if (opts.animation === 'expand') {
      return transformDescriptor(opts.placement === 'left' || opts.placement === 'right' ? 'scaleX(0)' : 'scaleY(0)', origin);
    }
    var hidden = opts.placement === 'left' ? 'translate3d(-100%,0,0)' : opts.placement === 'right' ? 'translate3d(100%,0,0)' : opts.placement === 'top' ? 'translate3d(0,-100%,0)' : 'translate3d(0,100%,0)';
    return transformDescriptor(hidden, origin);
  }
  function transitionState() {
    if (destroyed) return 'destroyed';
    var state = panelTransition ? panelTransition.getState() : { phase: 'hidden' };
    if (state.phase === 'entering') return 'showing';
    if (state.phase === 'shown') return 'shown';
    if (state.phase === 'leaving') return 'hiding';
    return 'hidden';
  }
  function applyVisualOptions(showing) {
    var pair = durations();
    var ease = easingPair(opts);
    var index = showing === false ? 1 : 0;
    root.className = 'qxframe9a7c2-drawer-root';
    mask.className = ('qxframe9a7c2-drawer-mask ' + opts.maskClassName).trim();
    wrap.className = ('qxframe9a7c2-drawer-wrap is-' + opts.placement).trim();
    panel.className = ('qxframe9a7c2-drawer qxframe9a7c2-drawer-' + opts.placement + ' ' + opts.className).trim();
    root.dataset.placement = opts.placement;
    wrap.dataset.placement = opts.placement;
    panel.dataset.placement = opts.placement;
    DOM.setPrivate(root, 'animation', opts.animation === false ? 'none' : opts.animation);
    mask.style.setProperty('--qxframe9a7c2-motion-duration-mid', pair[index] + 'ms');
    panel.style.setProperty('--qxframe9a7c2-motion-duration-mid', pair[index] + 'ms');
    mask.style.setProperty('--qxframe9a7c2-motion-ease-out-circ', ease[index]);
    mask.style.setProperty('--qxframe9a7c2-motion-ease-in-out-circ', ease[index]);
    panel.style.setProperty('--qxframe9a7c2-motion-ease-out-circ', ease[index]);
    panel.style.setProperty('--qxframe9a7c2-motion-ease-in-out-circ', ease[index]);
    mask.classList.toggle('is-maskless', opts.showMask === false);
    if (opts.placement === 'left' || opts.placement === 'right') {
      panel.style.width = px(opts.width);
      panel.style.height = '';
    } else {
      panel.style.height = px(opts.height);
      panel.style.width = '';
    }
    if (own(opts, 'maskColor')) mask.style.background = opts.maskColor || '';
    var customFooter = opts.footer !== undefined && opts.footer !== true && opts.footer !== false && opts.footer !== null && !Array.isArray(opts.footer);
    var showFooter = opts.footer !== false && opts.footer !== null && (buttons.length > 0 || customFooter);
    panel.classList.toggle('is-headerless', opts.header === false);
    panel.classList.toggle('is-footerless', !showFooter);
    frameShell.applyStyle(panel, opts.style);
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
    frameShell.clearActions(); buttons = [];
    Renderer.replace(title, '', doc); Renderer.replace(contentHost, '', doc); Renderer.replace(footer, '', doc);
    hiddenContentDestroyed = true; syncChrome(); return true;
  }
  function ensureHiddenContent() {
    if (!hiddenContentDestroyed) return false;
    hiddenContentDestroyed = false; renderTitle(); renderContent(); renderFooter(); syncChrome(); return true;
  }
  var closeConfig = frameShell.closeConfig;
  var syncCloseButton = frameShell.syncCloseButton;
  var syncChrome = frameShell.syncChrome;
  var initialFocus = frameShell.initialFocus;
  function overlayOptions() { return frameShell.overlayOptions({ onDismiss:function(detail){return requestClose(detail.reason, detail.originalEvent);} }); }
  function finalizeLeave() {
    if (destroyed || opened || !leaveMaskDone || !leavePanelDone || !pendingLeaveDetail) return false;
    var detail = pendingLeaveDetail;
    pendingLeaveDetail = null;
    surface.hide(detail);
    overlay.deactivate(detail);
    destroyHiddenContent();
    callback('afterOpenChange', false, payload(detail.reason, detail.originalEvent));
    if (destroyed || opened) return true;
    emitter.emit('afterOpenChange', { open: false, source: DOM.activationSource(detail.originalEvent), reason: detail.reason, originalEvent: detail.originalEvent });
    return true;
  }
  var requestClose = frameShell.requestClose;
  function closeAccepted(reason, event) {
    opened = false;
    callback('onOpenChange', false, payload(reason, event));
    if (destroyed || opened) return api;
    callback('onClose', payload(reason, event));
    if (destroyed || opened) return api;
    emitter.emit('openChange', { open: false, source: DOM.activationSource(event), reason: reason || 'close', originalEvent: event || null });
    if (destroyed || opened) return api;
    applyVisualOptions(false);
    var pair = durations();
    pendingLeaveDetail = { reason: reason || 'close', originalEvent: event || null };
    leaveMaskDone = false;
    leavePanelDone = false;
    maskTransition.setVisible(false, {
      reason: reason || 'close',
      originalEvent: event || null,
      immediate: pair[1] <= 0
    });
    panelTransition.setVisible(false, {
      reason: reason || 'close',
      originalEvent: event || null,
      immediate: pair[1] <= 0
    });
    return api;
  }
  function open(reason, event) {
    reason = reason || 'open';
    if (reason && typeof reason === 'object' && reason.type) { event = reason; reason = 'event'; }
    if (destroyed || beforeOpenGuard || frameShell.isClosing() || (opened && transitionState() !== 'hiding')) return api;
    ensureHiddenContent();
    beforeOpenGuard = true;
    var accepted;
    try { accepted = callback('onBeforeOpen', payload(reason, event)) !== false && !destroyed; }
    finally { beforeOpenGuard = false; }
    if (!accepted || destroyed) return api;
    pendingLeaveDetail = null;
    leaveMaskDone = true;
    leavePanelDone = true;
    overlay.mount();
    opened = true;
    applyVisualOptions(true);
    surface.show({ reason: reason, originalEvent: event || null });
    var pair = durations();
    maskTransition.setVisible(true, {
      reason: reason,
      originalEvent: event || null,
      immediate: pair[0] <= 0
    });
    panelTransition.setVisible(true, {
      reason: reason,
      originalEvent: event || null,
      immediate: pair[0] <= 0
    });
    if (!destroyed && opened && !overlay.getState().active) overlay.activate({ reason: reason, originalEvent: event || null });
    return api;
  }
  function close(reason, event) { requestClose(reason || 'close', event || null); return api; }
  function setOpen(next, reason, event) { return next ? open(reason || 'setOpen', event) : close(reason || 'setOpen', event); }
  function updateOverlayOptions() {
    overlay.updateOptions({
      closeOnEscape: opts.closeOnEscape, trapFocus: opts.focusTrap, lockScroll: opts.lockScroll,
      restoreFocus: opts.restoreFocus, destroyOnDeactivate: opts.destroyOnHidden === true, zIndex: opts.zIndex,
      initialFocus: initialFocus, focusOnActivate: opts.autoFocus !== false
    });
  }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var incoming = nextOptions || {};
    IMMUTABLE_OPTIONS.forEach(function (key) { if (own(incoming, key) && incoming[key] !== opts[key]) throw new Error('[QXFRAME9A7C2] Drawer ' + key + ' is immutable; destroy and recreate to change it.'); });
    opts = normalize(incoming, opts);
    if (hiddenContentDestroyed && opts.destroyOnHidden !== true) ensureHiddenContent();
    if (!hiddenContentDestroyed || opened) { renderTitle(); renderContent(); renderFooter(); }
    applyVisualOptions(opened); syncChrome(); updateOverlayOptions();
    if (!opened && opts.destroyOnHidden === true) destroyHiddenContent();
    return api;
  }
  function destroy(reason) {
    if (destroyed) return false;
    opened = false;
    destroyed = true;
    if (maskTransition) maskTransition.destroy();
    if (panelTransition) panelTransition.destroy();
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
    transition: MotionPresets.fade,
    appear: true,
    onAfterLeave: function () {
      leaveMaskDone = true;
      finalizeLeave();
    },
    reducedMotion: function () { return !Config.motionEnabled(root, undefined, opts.respectReducedMotion !== false); },
    disabled: function () { return opts.animation === false; }
  });
  panelTransition = Transition.create({
    element: panel,
    transition: panelMotion,
    appear: true,
    reducedMotion: function () { return !Config.motionEnabled(root, undefined, opts.respectReducedMotion !== false); },
    disabled: function () { return opts.animation === false; },
    onBeforeEnter: function (context) {
      if (destroyed || !opened) return;
      var reason = context.reason || 'open', event = context.originalEvent || null;
      callback('onOpenChange', true, payload(reason, event));
      callback('onOpen', payload(reason, event));
      emitter.emit('openChange', { open: true, source: DOM.activationSource(event), reason: reason, originalEvent: event });
    },
    onAfterEnter: function (context) {
      if (destroyed || !opened) return;
      scroll.refresh();
      var reason = context.reason || 'open', event = context.originalEvent || null;
      callback('afterOpenChange', true, payload(reason, event));
      emitter.emit('afterOpenChange', { open: true, source: DOM.activationSource(event), reason: reason, originalEvent: event });
    },
    onAfterLeave: function () {
      leavePanelDone = true;
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
    getState: function () { var state = overlay.getState(), config = closeConfig(); return Object.freeze({ open: opened, mounted: state.mounted, overlayActive: state.active, transitionState: transitionState(), destroyed: destroyed, placement: opts.placement, side: opts.placement, headerVisible: opts.header !== false, footerVisible: !footer.hidden, closable: opts.closable, closeDisabled: config.disabled === true, closePlacement: config.placement || 'end', showMask: opts.showMask, lockScroll: opts.lockScroll, buttonCount: buttons.length, contentMounted: !hiddenContentDestroyed }); },
    getRootElement: function () { return root; },
    getMaskElement: function () { return mask; },
    getWrapElement: function () { return wrap; },
    getPanelElement: function () { return panel; },
    getBodyElement: function () { return body; },
    getOverlayRuntime: function () { return overlay; },
    getScroll: function () { return scroll; },
    on: emitter.on, once: emitter.once,
    destroy: destroy
  });
        
  renderTitle();
  renderContent();
  renderFooter();
  applyVisualOptions(true);
  syncChrome();
  if (opts.destroyOnHidden && !opts.autoOpen) destroyHiddenContent();
  scope.add(DOM.listen(closeButton, 'click', function (event) { if (!closeButton.disabled) close('x', event); }));
  scope.add(DOM.listen(mask, 'mousedown', function (event) { if (event.target === mask && opts.closeOnMask) close('mask', event); }));
  if (globalThis.addEventListener) scope.add(DOM.listen(globalThis, 'resize', function () { if (opened) scroll.refresh(); }));
    
    
    
  if (opts.forceRender && !opts.autoOpen) overlay.mount();
  if (opts.autoOpen) open('autoOpen', null);
  return controller;
}
    

export class Drawer extends OverlayComponent {
    static options = Object.freeze({ title:'', content:'', placement:'right', closable:true, showMask:true, closeOnMask:true, closeOnEscape:true, destroyOnHidden:false, lockScroll:true, focusTrap:true, restoreFocus:true, forceRender:false, autoOpen:true, respectReducedMotion:true, animation:'slide' });
    static immutableOptions = Object.freeze(['id','document','portalContainer']);
    static contract = ComponentContracts.get('Drawer');
    static placements = PLACEMENTS.slice();
    static animations = ANIMATIONS.slice();

    constructor(options = {}) {
        super(options);
        this.adoptOverlayFamilyController(createDrawerController(this, this.options));
    }

    getPanelElement() { const c = this.getOverlayFamilyController(); return c && c.getPanelElement ? c.getPanelElement() : null; }
}

export { PLACEMENTS, ANIMATIONS };
