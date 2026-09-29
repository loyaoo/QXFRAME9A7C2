import { Utils } from '../utils/utils.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { IdManager } from '../utils/id.js';
import { Renderer } from '../core/renderer.js';
import { OverlayController } from '../core/overlayController.js';
import { OverlayFrameShell } from '../core/overlayFrameShell.js';
import { PopupSurface } from '../core/popupSurface.js';
import { Transition } from '../core/transition.js';
import { Scroll } from './scroll.js';

function create(config = {}) {
  const instance = config.instance;
  if (!instance) throw new TypeError('[QXFRAME9A7C2] OverlayFrameRuntime instance is required.');
  let opts = config.options || {};
  const doc = opts.document || config.document || globalThis.document;
  if (!doc || typeof doc.createElement !== 'function') throw new Error('[QXFRAME9A7C2] OverlayFrameRuntime requires a browser document.');
  const portalContainer = opts.portalContainer || config.portalContainer || doc.body;
  if (!portalContainer || typeof portalContainer.appendChild !== 'function') throw new TypeError('[QXFRAME9A7C2] OverlayFrameRuntime portalContainer must be an Element.');
  opts.document = doc;
  opts.portalContainer = portalContainer;

  const emitter = Object.freeze({
    emit(type, detail) { return instance.emit(type, detail); },
    on(type, listener) { return instance.on(type, listener); },
    once(type, listener) { return instance.once(type, listener); },
    dispose() {}
  });
  const scope = Lifecycle.createScope();
  const classes = config.classes || {};
  const id = opts.id ? String(opts.id) : IdManager.next(config.idPrefix || String(config.componentType || 'overlay').toLowerCase());

  const root = doc.createElement('div');
  const mask = doc.createElement('div');
  const wrap = doc.createElement('div');
  const surfaceNode = doc.createElement('div');
  const header = doc.createElement('div');
  const title = doc.createElement('span');
  const closeButton = doc.createElement('button');
  const body = doc.createElement('div');
  const footer = doc.createElement('div');

  root.className = classes.root || '';
  mask.className = classes.mask || '';
  wrap.className = classes.wrap || '';
  surfaceNode.className = classes.surface || '';
  header.className = classes.header || '';
  title.className = classes.title || '';
  closeButton.className = classes.close || 'qxframe9a7c2-button is-text is-sm';
  body.className = classes.body || '';
  footer.className = classes.footer || '';
  title.id = id + '-title';
  surfaceNode.tabIndex = -1;
  closeButton.type = 'button';
  body.appendChild(doc.createElement('span'));
  wrap.appendChild(surfaceNode);
  root.appendChild(mask);
  root.appendChild(wrap);

  const scroll = Scroll.create({
    container: body,
    axis: 'y',
    wheelPropagation: true,
    scrollbarVisibility: opts.scrollbarVisibility || 'auto',
    keyboard: false,
    focusable: false,
    document: doc
  });
  const contentHost = scroll.getContentElement();

  let destroyed = false;
  let opened = false;
  let overlay = null;
  let popupSurface = null;
  let maskTransition = null;
  let surfaceTransition = null;
  let buttons = [];
  let beforeOpenGuard = false;
  let leaveMaskDone = true;
  let leaveSurfaceDone = true;
  let pendingLeaveDetail = null;
  let hiddenContentDestroyed = false;
  let frameShell = null;
  let controller = null;

  function options() { return opts; }
  function callback(name, ...args) {
    const fn = opts[name];
    return typeof fn === 'function' ? fn.apply(null, args) : undefined;
  }
  function payload(reason, event) {
    const base = {
      instance: controller || instance,
      source: DOM.activationSource(event),
      reason: reason || 'api',
      event: event || null,
      root, mask, wrap, body, title, footer,
      overlayRuntime: overlay && overlay.getRuntime ? overlay.getRuntime() : null
    };
    base[config.surfacePayloadKey || 'surface'] = surfaceNode;
    if (typeof config.payloadExtras === 'function') return Utils.assignOwn(base, config.payloadExtras(context(), reason, event) || {});
    return base;
  }
  function context() {
    return {
      instance,
      api: controller || instance,
      document: doc,
      portalContainer,
      scope,
      options,
      root,
      mask,
      wrap,
      surface: surfaceNode,
      header,
      title,
      closeButton,
      body,
      footer,
      contentHost,
      scroll,
      frameShell,
      overlay,
      popupSurface,
      maskTransition,
      surfaceTransition,
      buttons: () => buttons.slice(),
      closeConfig: () => frameShell ? frameShell.closeConfig() : {},
      callback,
      payload,
      isOpen: () => opened,
      isDestroyed: () => destroyed,
      close
    };
  }

  function renderTitle() { frameShell.renderValue(title, opts.title, { instance: controller || instance, close }); }
  function renderContent() {
    frameShell.renderValue(contentHost, opts.content, { instance: controller || instance, close, scroll });
    scroll.refresh('overlay-frame-content');
  }
  function renderFooter() {
    buttons = frameShell.renderFooter(typeof config.resolveButtons === 'function' ? config.resolveButtons : function () { return []; });
  }
  function destroyHiddenContent() {
    if (!opts.destroyOnHidden || hiddenContentDestroyed) return false;
    frameShell.clearActions();
    buttons = [];
    Renderer.replace(title, '', doc);
    Renderer.replace(contentHost, '', doc);
    Renderer.replace(footer, '', doc);
    hiddenContentDestroyed = true;
    frameShell.syncChrome();
    return true;
  }
  function ensureHiddenContent() {
    if (!hiddenContentDestroyed) return false;
    hiddenContentDestroyed = false;
    renderTitle();
    renderContent();
    renderFooter();
    frameShell.syncChrome();
    return true;
  }
  function applyVisualOptions(showing) {
    if (typeof config.applyVisualOptions === 'function') config.applyVisualOptions(context(), showing);
    if (!overlay || !overlay.getState().active) root.style.zIndex = '';
  }
  function transitionState() {
    if (destroyed) return 'destroyed';
    const state = surfaceTransition ? surfaceTransition.getState() : { phase: 'hidden' };
    if (state.phase === 'entering') return 'showing';
    if (state.phase === 'shown') return 'shown';
    if (state.phase === 'leaving') return 'hiding';
    return 'hidden';
  }
  function overlayOptions() {
    return frameShell.overlayOptions({
      onDismiss(detail) { return frameShell.requestClose(detail.reason, detail.originalEvent); }
    });
  }
  function updateOverlayOptions() {
    overlay.updateOptions({
      closeOnEscape: opts.closeOnEscape,
      trapFocus: opts.focusTrap,
      lockScroll: opts.lockScroll,
      restoreFocus: opts.restoreFocus,
      destroyOnDeactivate: opts.destroyOnHidden === true,
      initialFocus: frameShell.initialFocus,
      focusOnActivate: opts.autoFocus !== false,
      zIndex: opts.zIndex
    });
  }
  function presenceOptions(kind, showing, reason, event) {
    return typeof config.presenceOptions === 'function'
      ? (config.presenceOptions(context(), kind, showing, reason, event) || {})
      : {};
  }
  function finalizeLeave() {
    if (destroyed || opened || !leaveMaskDone || !leaveSurfaceDone || !pendingLeaveDetail) return false;
    const detail = pendingLeaveDetail;
    pendingLeaveDetail = null;
    popupSurface.hide(detail);
    overlay.deactivate(detail);
    destroyHiddenContent();
    callback('afterOpenChange', false, payload(detail.reason, detail.originalEvent));
    if (typeof config.afterFinalClose === 'function') config.afterFinalClose(context(), detail);
    if (destroyed || opened) return true;
    emitter.emit('afterOpenChange', { open:false, source:DOM.activationSource(detail.originalEvent), reason:detail.reason, originalEvent:detail.originalEvent });
    return true;
  }
  function closeAccepted(reason, event) {
    opened = false;
    callback('onOpenChange', false, payload(reason, event));
    if (destroyed || opened) return controller;
    callback('onClose', payload(reason, event));
    if (destroyed || opened) return controller;
    if (typeof config.afterAcceptedClose === 'function') config.afterAcceptedClose(context(), reason, event);
    if (destroyed || opened) return controller;
    emitter.emit('openChange', { open:false, source:DOM.activationSource(event), reason:reason || 'close', originalEvent:event || null });
    if (destroyed || opened) return controller;
    applyVisualOptions(false);
    if (typeof config.beforePresence === 'function') config.beforePresence(context(), false, reason, event);
    pendingLeaveDetail = { reason:reason || 'close', originalEvent:event || null };
    leaveMaskDone = false;
    leaveSurfaceDone = false;
    maskTransition.setVisible(false, Utils.assignOwn({ reason:reason || 'close', originalEvent:event || null }, presenceOptions('mask', false, reason, event)));
    surfaceTransition.setVisible(false, Utils.assignOwn({ reason:reason || 'close', originalEvent:event || null }, presenceOptions('surface', false, reason, event)));
    return controller;
  }

  frameShell = OverlayFrameShell.create({
    document: doc,
    portalContainer,
    root,
    wrap,
    surface: surfaceNode,
    header,
    title,
    body,
    footer,
    closeButton,
    componentType: config.componentType || 'Overlay',
    closePlacement: config.closePlacement === true,
    getOptions: options,
    getApi() { return controller || instance; },
    getButtons() { return buttons; },
    setButtons(value) { buttons = Array.isArray(value) ? value : []; },
    close(reason, event) { return close(reason, event); },
    invokeCallback(eventName, data) { return callback(eventName, data); },
    isDestroyed() { return destroyed; },
    emitActionError(detail) { emitter.emit('actionError', detail); },
    isOpen() { return opened; },
    beforeClose(reason, event) { return callback('onBeforeClose', payload(reason, event)); },
    acceptClose: closeAccepted,
    getContentHost() { return contentHost; },
    getScope() { return scope; },
    getScroll() { return scroll; },
    getSurface() { return popupSurface; },
    getOverlay() { return overlay; },
    getEmitter() { return emitter; },
    afterDestroy(reason) { callback('onDestroy', { instance:controller || instance, reason }); }
  });

  popupSurface = PopupSurface.create({ element:root, setVisible() {} });
  popupSurface.hide({ reason:'initial' });
  overlay = OverlayController.create(overlayOptions());

  const maskTransitionOptions = typeof config.maskTransition === 'function' ? (config.maskTransition(context()) || {}) : {};
  maskTransition = Transition.create({
    ...maskTransitionOptions,
    element: mask,
    appear: maskTransitionOptions.appear !== false,
    onAfterLeave() {
      if (typeof maskTransitionOptions.onAfterLeave === 'function') maskTransitionOptions.onAfterLeave.apply(null, arguments);
      leaveMaskDone = true;
      finalizeLeave();
    }
  });
  const surfaceTransitionOptions = typeof config.surfaceTransition === 'function' ? (config.surfaceTransition(context()) || {}) : {};
  surfaceTransition = Transition.create({
    ...surfaceTransitionOptions,
    element: surfaceNode,
    appear: surfaceTransitionOptions.appear !== false,
    onBeforeEnter(transitionContext) {
      if (typeof surfaceTransitionOptions.onBeforeEnter === 'function') surfaceTransitionOptions.onBeforeEnter(transitionContext);
      if (destroyed || !opened) return;
      const reason = transitionContext.reason || 'open', event = transitionContext.originalEvent || null;
      callback('onOpenChange', true, payload(reason, event));
      if (destroyed || !opened) return;
      callback('onOpen', payload(reason, event));
      if (destroyed || !opened) return;
      emitter.emit('openChange', { open:true, source:DOM.activationSource(event), reason, originalEvent:event });
    },
    onAfterEnter(transitionContext) {
      if (typeof surfaceTransitionOptions.onAfterEnter === 'function') surfaceTransitionOptions.onAfterEnter(transitionContext);
      if (destroyed || !opened) return;
      scroll.refresh('overlay-frame-open');
      const reason = transitionContext.reason || 'open', event = transitionContext.originalEvent || null;
      callback('afterOpenChange', true, payload(reason, event));
      if (destroyed || !opened) return;
      emitter.emit('afterOpenChange', { open:true, source:DOM.activationSource(event), reason, originalEvent:event });
    },
    onAfterLeave() {
      if (typeof surfaceTransitionOptions.onAfterLeave === 'function') surfaceTransitionOptions.onAfterLeave.apply(null, arguments);
      leaveSurfaceDone = true;
      finalizeLeave();
    }
  });

  function open(reason, event) {
    if (typeof config.normalizeOpenRequest === 'function') {
      const normalized = config.normalizeOpenRequest(reason, event) || {};
      reason = normalized.reason;
      event = normalized.event;
    }
    reason = reason || 'open';
    if (destroyed || beforeOpenGuard || frameShell.isClosing() || (opened && transitionState() !== 'hiding')) return controller;
    ensureHiddenContent();
    beforeOpenGuard = true;
    let accepted;
    try { accepted = callback('onBeforeOpen', payload(reason, event)) !== false && !destroyed; }
    finally { beforeOpenGuard = false; }
    if (!accepted || destroyed) return controller;
    pendingLeaveDetail = null;
    leaveMaskDone = true;
    leaveSurfaceDone = true;
    overlay.mount();
    opened = true;
    applyVisualOptions(true);
    popupSurface.show(payload(reason, event));
    if (typeof config.beforePresence === 'function') config.beforePresence(context(), true, reason, event);
    maskTransition.setVisible(true, Utils.assignOwn({ reason, originalEvent:event || null }, presenceOptions('mask', true, reason, event)));
    surfaceTransition.setVisible(true, Utils.assignOwn({ reason, originalEvent:event || null }, presenceOptions('surface', true, reason, event)));
    if (!destroyed && opened && !overlay.getState().active) overlay.activate({ reason, originalEvent:event || null });
    return controller;
  }
  function close(reason, event) {
    frameShell.requestClose(reason || 'close', event || null);
    return controller;
  }
  function setOpen(next, reason, event) { return next ? open(reason || 'setOpen', event) : close(reason || 'setOpen', event); }
  function updateOptions(nextOptions) {
    if (destroyed) return controller;
    const incoming = nextOptions || {};
    (config.immutableOptions || []).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(incoming, key) && incoming[key] !== opts[key]) throw new Error('[QXFRAME9A7C2] ' + String(config.componentType || 'Overlay') + ' ' + key + ' is immutable; destroy and recreate to change it.');
    });
    opts = typeof config.normalizeOptions === 'function' ? config.normalizeOptions(incoming, opts) : Utils.mergeOwn(opts, incoming);
    if (hiddenContentDestroyed && opts.destroyOnHidden !== true) ensureHiddenContent();
    if (!hiddenContentDestroyed || opened) { renderTitle(); renderContent(); renderFooter(); }
    applyVisualOptions(opened);
    frameShell.syncChrome();
    updateOverlayOptions();
    if (typeof config.afterOptionsUpdated === 'function') config.afterOptionsUpdated(context(), incoming);
    if (!opened && opts.destroyOnHidden === true) destroyHiddenContent();
    return controller;
  }
  function destroy(reason) {
    if (destroyed) return false;
    opened = false;
    destroyed = true;
    if (maskTransition) maskTransition.destroy();
    if (surfaceTransition) surfaceTransition.destroy();
    frameShell.disposeFrame(reason || 'destroy');
    return true;
  }

  controller = Object.freeze({
    setOpen, open, close,
    setTitle(value) { return updateOptions({ title:value }); },
    setContent(value) { return updateOptions({ content:value }); },
    setButtons(value) { return updateOptions({ buttons:Array.isArray(value) ? value : [] }); },
    setHeaderVisible(value) { return updateOptions({ header:value !== false }); },
    setFooterVisible(value) { return updateOptions({ footer:value !== false }); },
    setClosable(value) { return updateOptions({ closable:value }); },
    updateOptions,
    getState() {
      const state = overlay.getState(), close = frameShell.closeConfig();
      const base = {
        open:opened, mounted:state.mounted, overlayActive:state.active, transitionState:transitionState(), destroyed,
        headerVisible:opts.header !== false, footerVisible:!footer.hidden, closable:opts.closable,
        closeDisabled:close.disabled === true, lockScroll:opts.lockScroll, showMask:opts.showMask,
        placement:opts.placement, buttonCount:buttons.length, contentMounted:!hiddenContentDestroyed
      };
      return Object.freeze(typeof config.stateExtras === 'function' ? Utils.assignOwn(base, config.stateExtras(context()) || {}) : base);
    },
    getRootElement() { return root; },
    getMaskElement() { return mask; },
    getWrapElement() { return wrap; },
    getSurfaceElement() { return surfaceNode; },
    getDialogElement() { return surfaceNode; },
    getPanelElement() { return surfaceNode; },
    getBodyElement() { return body; },
    getOverlayResourceController() { return overlay; },
    getOverlayRuntime() { return overlay && overlay.getRuntime ? overlay.getRuntime() : null; },
    getMotionControllers() {
      const key = config.motionSurfaceKey || 'surface';
      const result = { mask:maskTransition && maskTransition.getMotionController ? maskTransition.getMotionController() : null };
      result[key] = surfaceTransition && surfaceTransition.getMotionController ? surfaceTransition.getMotionController() : null;
      return Object.freeze(result);
    },
    getInteractionController() { return frameShell.getInteractionController(); },
    getCapabilityControllers() { return frameShell.getCapabilityControllers(); },
    getFeedbackControllers() { return frameShell.getFeedbackControllers(); },
    getScroll() { return scroll; },
    on:emitter.on,
    once:emitter.once,
    destroy
  });

  renderTitle();
  renderContent();
  renderFooter();
  applyVisualOptions(true);
  frameShell.syncChrome();
  if (opts.destroyOnHidden && !opts.autoOpen) destroyHiddenContent();
  scope.add(DOM.listen(mask, 'mousedown', function (event) { if (event.target === mask && opts.closeOnMask) close('mask', event); }));
  if (globalThis.addEventListener) scope.add(DOM.listen(globalThis, 'resize', function () { if (opened) scroll.refresh('overlay-frame-resize'); }));
  if (typeof config.setup === 'function') config.setup(context());
  if (opts.forceRender && !opts.autoOpen) overlay.mount();
  if (opts.autoOpen) open('autoOpen', null);
  return controller;
}

export const OverlayFrameRuntime = Object.freeze({ create });
export { create };
