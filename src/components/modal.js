import { OverlayComponent } from './overlay.js';
import { OverlayFrameRuntime } from './overlay-frame-runtime.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { Utils } from '../utils/utils.js';
import { DOM } from '../core/dom.js';
import { Config } from '../core/config.js';
import { OverlayFramePolicy } from '../core/overlayFramePolicy.js';
import { Renderer } from '../core/renderer.js';
import { MotionPresets } from '../core/motionPresets.js';

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
function resolveButtons(opts) { return OverlayFramePolicy.resolveButtons(opts, Utils.mergeOwn(overlayButtonPolicy, { requireExplicitFooter:false })); }
function normalize(input, previous) {
  var incoming = input || {};
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new TypeError('[QXFRAME9A7C2] Modal options must be an object.');
  rejectRemoved(incoming);
  var next = Utils.mergeOwn(previous || {}, incoming);
  next.placement = enumValue(next.placement, PLACEMENTS, 'center', 'placement');
  var closable = OverlayFramePolicy.normalizeClosable(own(incoming, 'closable') ? incoming.closable : undefined, previous, { owner:'Modal' });
  next.closable = closable.visible;
  next.closeOptions = closable.options;
  if (next.closeOptions.onClose != null && typeof next.closeOptions.onClose !== 'function') throw new TypeError('[QXFRAME9A7C2] Modal closable.onClose must be a function.');
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
  var initial = normalize(Utils.assignOwn({
    title:'提示', content:'', closable:true, showMask:true, closeOnMask:true,
    closeOnEscape:true, destroyOnHidden:false, lockScroll:true, focusTrap:true,
    restoreFocus:true, forceRender:false, autoOpen:true, placement:'center',
    animation:'zoom-origin', maskAnimation:'fade', fullscreen:false, center:false
  }, options || {}));
  var recentPointer = null;

  function motionDisabled(ctx) { return !Config.motionEnabled(ctx.root); }
  function durations(ctx) {
    var opts = ctx.options();
    var modal = durationPair(opts, 'enterDuration', 'leaveDuration', 240, 180);
    var mask = durationPair(opts, 'maskEnterDuration', 'maskLeaveDuration', modal[0], modal[1]);
    if (motionDisabled(ctx)) { modal = [0,0]; mask = [0,0]; }
    else {
      if (opts.animation === false) modal = [0,0];
      if (opts.maskAnimation === false) mask = [0,0];
    }
    return { modal:modal, mask:mask };
  }
  function eventPoint(event) {
    if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
    if (event.clientX === 0 && event.clientY === 0 && event.detail === 0) return null;
    return { x:event.clientX, y:event.clientY };
  }
  function originPoint(ctx, event) {
    var direct = eventPoint(event);
    if (direct) return direct;
    var opts = ctx.options();
    var origin = typeof opts.origin === 'function' ? opts.origin(ctx.api) : opts.origin;
    if (origin && origin.nodeType === 1 && origin.getBoundingClientRect) {
      var rect = origin.getBoundingClientRect();
      return { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 };
    }
    if (recentPointer && Date.now() - recentPointer.time <= 200) return { x:recentPointer.x, y:recentPointer.y };
    return null;
  }
  function measureSurfaceRect(ctx) {
    var style = ctx.surface.style;
    var transform = style.getPropertyValue('transform');
    var transformPriority = style.getPropertyPriority('transform');
    var transition = style.getPropertyValue('transition');
    var transitionPriority = style.getPropertyPriority('transition');
    style.setProperty('transition', 'none', 'important');
    style.setProperty('transform', 'none', 'important');
    var rect = ctx.surface.getBoundingClientRect();
    if (transform) style.setProperty('transform', transform, transformPriority); else style.removeProperty('transform');
    if (transition) style.setProperty('transition', transition, transitionPriority); else style.removeProperty('transition');
    return rect;
  }
  function applyMotion(ctx, showing, event) {
    var timing = durations(ctx);
    var modalDuration = showing ? timing.modal[0] : timing.modal[1];
    var maskDuration = showing ? timing.mask[0] : timing.mask[1];
    ctx.surface.style.setProperty('--qxframe9a7c2-motion-duration-slow', modalDuration + 'ms');
    ctx.surface.style.setProperty('--qxframe9a7c2-motion-duration-mid', modalDuration + 'ms');
    ctx.mask.style.setProperty('--qxframe9a7c2-motion-duration-mid', maskDuration + 'ms');
    if (!showing) return;
    var point = originPoint(ctx, event);
    var rect = measureSurfaceRect(ctx);
    ctx.surface.style.transformOrigin = point && rect.width > 0 && rect.height > 0
      ? Math.round(point.x - rect.left) + 'px ' + Math.round(point.y - rect.top) + 'px'
      : '50% 50%';
  }
  function dialogMotion(ctx) {
    var opts = ctx.options();
    if (opts.animation === false) return { type:'transition', appear:{from:null,active:null,to:null}, enter:{from:null,active:null,to:null}, leave:{from:null,active:null,to:null} };
    var name = opts.animation || 'zoom-origin';
    if (name !== 'zoom-origin' && name !== 'zoom' && name !== 'zoomIn') return MotionPresets.resolve(name);
    return {
      type:'transition',
      appear:{ from:{style:{transform:'scale(.2)',opacity:'0'}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ), opacity var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ)'}}, to:{style:{transform:'scale(1)',opacity:'1'}} },
      enter:{ from:{style:{transform:'scale(.2)',opacity:'0'}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ), opacity var(--qxframe9a7c2-motion-duration-slow) var(--qxframe9a7c2-motion-ease-out-circ)'}}, to:{style:{transform:'scale(1)',opacity:'1'}} },
      leave:{ from:{style:{transform:'scale(1)',opacity:'1'}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-in-out-circ), opacity var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-in-out-circ)'}}, to:{style:{transform:'scale(.2)',opacity:'0'}} }
    };
  }

  return OverlayFrameRuntime.create({
    instance,
    options:initial,
    normalizeOptions:normalize,
    immutableOptions:IMMUTABLE_OPTIONS,
    componentType:'Modal',
    idPrefix:'modal',
    closePlacement:false,
    surfacePayloadKey:'dialog',
    motionSurfaceKey:'dialog',
    classes:{
      root:'qxframe9a7c2-modal-root',
      mask:'qxframe9a7c2-modal-mask',
      wrap:'qxframe9a7c2-modal-wrapper',
      surface:'qxframe9a7c2-modal-container',
      header:'qxframe9a7c2-modal-header',
      title:'qxframe9a7c2-modal-title',
      close:'qxframe9a7c2-button is-text is-sm qxframe9a7c2-modal-close',
      body:'qxframe9a7c2-modal-body',
      footer:'qxframe9a7c2-modal-footer'
    },
    resolveButtons,
    applyVisualOptions(ctx) {
      var opts = ctx.options(), dialog = ctx.surface;
      ctx.root.className = 'qxframe9a7c2-modal-root';
      ctx.mask.className = ('qxframe9a7c2-modal-mask ' + opts.maskClassName).trim();
      ctx.wrap.className = 'qxframe9a7c2-modal-wrapper';
      dialog.className = ('qxframe9a7c2-modal-container ' + opts.className).trim();
      ctx.root.dataset.placement = opts.placement;
      ctx.wrap.dataset.placement = opts.placement;
      DOM.setPrivate(ctx.mask, 'maskAnimation', opts.maskAnimation === false ? 'none' : (opts.maskAnimation || 'fade'));
      DOM.setPrivate(dialog, 'animation', opts.animation === false ? 'none' : (opts.animation || 'zoom-origin'));
      dialog.classList.toggle('is-fullscreen', opts.fullscreen === true);
      dialog.classList.toggle('is-center', opts.center === true);
      ctx.mask.classList.toggle('is-maskless', opts.showMask === false);
      if (own(opts, 'width')) dialog.style.width = px(opts.width);
      if (own(opts, 'maxWidth')) dialog.style.maxWidth = px(opts.maxWidth);
      if (own(opts, 'maskColor')) ctx.mask.style.background = opts.maskColor || '';
      if (own(opts, 'maskBlur')) ctx.mask.style.backdropFilter = opts.maskBlur ? 'blur(' + px(opts.maskBlur) + ')' : '';
      ctx.frameShell.applyStyle(dialog, opts.style);
      ctx.frameShell.applyStyle(ctx.mask, opts.maskStyle);
    },
    beforePresence(ctx, showing, _reason, event) { applyMotion(ctx, showing, event); },
    maskTransition(ctx) {
      return {
        transition:function () { var opts=ctx.options(); return opts.maskAnimation === false ? 'fade' : (opts.maskAnimation || 'fade'); },
        appear:true,
        reducedMotion:function () { return motionDisabled(ctx); }
      };
    },
    surfaceTransition(ctx) {
      return { transition:function () { return dialogMotion(ctx); }, appear:true, reducedMotion:function () { return motionDisabled(ctx); } };
    },
    presenceOptions(ctx, kind, showing) {
      var timing = durations(ctx), opts = ctx.options(), index = showing ? 0 : 1;
      return { immediate:kind === 'mask' ? (timing.mask[index] <= 0 || opts.maskAnimation === false) : (timing.modal[index] <= 0 || opts.animation === false) };
    },
    afterAcceptedClose(ctx, reason, event) {
      var close = ctx.closeConfig();
      if (typeof close.onClose === 'function') close.onClose(reason || 'close', event || null, ctx.api);
    },
    afterFinalClose(ctx, detail) {
      var close = ctx.closeConfig();
      if (typeof close.afterClose === 'function') close.afterClose(ctx.payload(detail.reason, detail.originalEvent));
    },
    setup(ctx) {
      ctx.scope.add(DOM.listen(ctx.document, 'pointerdown', function (event) {
        var point = eventPoint(event);
        if (point) recentPointer = { x:point.x, y:point.y, time:Date.now() };
      }, true));
    }
  });
}

export class Modal extends OverlayComponent {
    static profile = Object.freeze({
        name:'Modal',
        focus:Object.freeze({ mode:'overlay-scope' }),
        interaction:Object.freeze({ mode:'frame-actions' }),
        capability:Object.freeze({ mode:'frame-actions' }),
        motion:Object.freeze({ mode:'dual-presence' }),
        overlay:Object.freeze({ mode:'modal-layer' }),
        feedback:Object.freeze({ mode:'action-feedback' }),
        ownership:Object.freeze({
            focus:'FocusController', interaction:'InteractionController', capability:'CapabilityController',
            motion:'MotionController', overlay:'OverlayController', feedback:'FeedbackController'
        })
    });
    static options = Object.freeze({ title:'提示', content:'', closable:true, showMask:true, closeOnMask:true, closeOnEscape:true, destroyOnHidden:false, lockScroll:true, focusTrap:true, restoreFocus:true, forceRender:false, autoOpen:true, placement:'center', animation:'zoom-origin', maskAnimation:'fade', fullscreen:false, center:false });
    static immutableOptions = Object.freeze(['id','document','portalContainer']);
    static contract = ComponentContracts.get('Modal');
    static placements = PLACEMENTS.slice();

    constructor(options = {}) {
        super(options);
        this.adoptOverlayFamilyController(createModalController(this, this.options));
    }

    getDialogElement() { const c = this.getOverlayFamilyController(); return c && c.getDialogElement ? c.getDialogElement() : null; }
}

export { PLACEMENTS };
