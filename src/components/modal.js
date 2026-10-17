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
  next.title = next.title === undefined ? '提示' : next.title;
  return next;
}
function px(value) { return typeof value === 'number' ? value + 'px' : (value || ''); }

function createModalController(instance, options) {
  var initial = normalize(Utils.assignOwn({
    title:'提示', content:'', closable:true, showMask:true, closeOnMask:true,
    closeOnEscape:true, destroyOnHidden:false, lockScroll:true, focusTrap:true,
    restoreFocus:true, forceRender:false, autoOpen:true, placement:'center',
    animation:'zoom', maskAnimation:'fade', fullscreen:false, center:false
  }, options || {}));
  var recentPointer = null;

  function motionDisabled(ctx) { return !Config.motionEnabled(ctx.root); }
  function eventPoint(event) {
    if (!event || !Number.isFinite(event.clientX) || !Number.isFinite(event.clientY)) return null;
    if (event.clientX === 0 && event.clientY === 0 && event.detail === 0) return null;
    return { x:event.clientX, y:event.clientY };
  }
  function originPoint(ctx, event, reason) {
    var direct = eventPoint(event);
    if (direct) return direct;
    var opts = ctx.options();
    var origin = typeof opts.origin === 'function' ? opts.origin(ctx.api) : opts.origin;
    // triggerTarget remains stable before the first mount/measurement.
    if (!origin) origin = typeof opts.triggerTarget === 'function' ? opts.triggerTarget(ctx.api) : opts.triggerTarget;
    if (typeof origin === 'string' && origin.trim()) origin = ctx.document.querySelector(origin);
    if (origin && origin.nodeType === 1 && origin.getBoundingClientRect) {
      var rect = origin.getBoundingClientRect();
      return { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 };
    }
    if (reason === 'autoOpen') return null;
    if (recentPointer && Date.now() - recentPointer.time <= 2500 && (!recentPointer.target || recentPointer.target.isConnected)) {
      return { x:recentPointer.x, y:recentPointer.y };
    }
    var focused = ctx.document.activeElement;
    if (focused && focused !== ctx.document.body && focused !== ctx.document.documentElement && focused !== ctx.surface && !ctx.root.contains(focused) && focused.getBoundingClientRect) {
      var focusedRect = focused.getBoundingClientRect();
      if (focusedRect.width > 0 && focusedRect.height > 0) return { x:focusedRect.left + focusedRect.width / 2, y:focusedRect.top + focusedRect.height / 2 };
    }
    return null;
  }
  function applyMotion(ctx, showing, event, reason) {
    // Closing returns to the ORIGINAL trigger point, not the close button.
    if (!showing) return;
    var animation = ctx.options().animation;
    if (animation !== 'zoom' && animation !== 'zoom-origin' && animation !== 'zoomIn') return;
    var point = originPoint(ctx, event, reason);
    var x = 0, y = 0;
    if (point) {
      // Single read before presence; subsequent animation is compositor-only.
      var rect = ctx.surface.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        x = Math.round(point.x - rect.left - rect.width / 2);
        y = Math.round(point.y - rect.top - rect.height / 2);
      } else point = null;
    }
    ctx.surface.style.transformOrigin = '50% 50%';
    ctx.surface.style.setProperty('--_qxframe9a7c2-modal-motion-x', x + 'px');
    ctx.surface.style.setProperty('--_qxframe9a7c2-modal-motion-y', y + 'px');
    ctx.surface.style.setProperty('--_qxframe9a7c2-modal-motion-scale', point ? '.7' : '.86');
  }
  function dialogMotion(ctx) {
    var opts = ctx.options();
    if (opts.animation === false) return { type:'transition', appear:{from:null,active:null,to:null}, enter:{from:null,active:null,to:null}, leave:{from:null,active:null,to:null} };
    var name = opts.animation || 'zoom-origin';
    if (name !== 'zoom-origin' && name !== 'zoom' && name !== 'zoomIn') return MotionPresets.resolve(name);
    var from = 'translate3d(var(--_qxframe9a7c2-modal-motion-x,0px),var(--_qxframe9a7c2-modal-motion-y,0px),0) scale(var(--_qxframe9a7c2-modal-motion-scale,.94))';
    return {
      type:'transition',
      appear:{ from:{style:{transform:from,opacity:'0'}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-modal-dialog-enter-duration) var(--qxframe9a7c2-motion-modal-dialog-enter-easing), opacity var(--qxframe9a7c2-motion-modal-dialog-enter-duration) var(--qxframe9a7c2-motion-modal-dialog-enter-easing)'}}, to:{style:{transform:'scale(1)',opacity:'1'}} },
      enter:{ from:{style:{transform:from,opacity:'0'}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-modal-dialog-enter-duration) var(--qxframe9a7c2-motion-modal-dialog-enter-easing), opacity var(--qxframe9a7c2-motion-modal-dialog-enter-duration) var(--qxframe9a7c2-motion-modal-dialog-enter-easing)'}}, to:{style:{transform:'scale(1)',opacity:'1'}} },
      leave:{ from:{style:{transform:'scale(1)',opacity:'1'}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-modal-dialog-leave-duration) var(--qxframe9a7c2-motion-modal-dialog-leave-easing), opacity var(--qxframe9a7c2-motion-modal-dialog-leave-duration) var(--qxframe9a7c2-motion-modal-dialog-leave-easing)'}}, to:{style:{transform:from,opacity:'0'}} }
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
    },
    beforePresence(ctx, showing, reason, event) { applyMotion(ctx, showing, event, reason); },
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
    presenceOptions(ctx, kind) {
      var opts = ctx.options();
      return { immediate:kind === 'mask' ? opts.maskAnimation === false : opts.animation === false };
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
        if (point) recentPointer = { x:point.x, y:point.y, time:Date.now(), target:event.target && event.target.nodeType === 1 ? event.target : null };
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
    static options = Object.freeze({ title:'提示', content:'', closable:true, showMask:true, closeOnMask:true, closeOnEscape:true, destroyOnHidden:false, lockScroll:true, focusTrap:true, restoreFocus:true, forceRender:false, autoOpen:true, placement:'center', animation:'zoom', maskAnimation:'fade', fullscreen:false, center:false });
    static semanticElements = Object.freeze(['root','mask','wrapper','dialog','header','title','body','footer','close']);
    static defaultClassSlot = 'dialog';
    static defaultStyleSlot = 'dialog';
    static defaultMotionSlot = 'dialog';
    static motionSlots = Object.freeze({
        dialog:Object.freeze({
            appear:'--qxframe9a7c2-motion-modal-dialog-enter-duration',
            enter:'--qxframe9a7c2-motion-modal-dialog-enter-duration',
            leave:'--qxframe9a7c2-motion-modal-dialog-leave-duration'
        }),
        mask:Object.freeze({
            appear:'--qxframe9a7c2-motion-modal-mask-enter-duration',
            enter:'--qxframe9a7c2-motion-modal-mask-enter-duration',
            leave:'--qxframe9a7c2-motion-modal-mask-leave-duration'
        })
    });
    static immutableOptions = Object.freeze(['id','document','portalContainer']);
    static contract = ComponentContracts.get('Modal');
    static placements = PLACEMENTS.slice();

    constructor(options = {}) {
        super(options);
        this.adoptOverlayFamilyController(createModalController(this, this.options));
    }

    getDialogElement() { return this.getElement('dialog'); }
}

export { PLACEMENTS };
