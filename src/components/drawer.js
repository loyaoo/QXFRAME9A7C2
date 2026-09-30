import { OverlayComponent } from './overlay.js';
import { OverlayFrameRuntime } from './overlay-frame-runtime.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { Utils } from '../utils/utils.js';
import { DOM } from '../core/dom.js';
import { Config } from '../core/config.js';
import { OverlayFramePolicy } from '../core/overlayFramePolicy.js';
import { Renderer } from '../core/renderer.js';
import { MotionPresets } from '../core/motionPresets.js';

var PLACEMENTS = Object.freeze(['left','right','top','bottom']);
var ANIMATIONS = Object.freeze(['slide','expand']);
var IMMUTABLE_OPTIONS = Object.freeze(['id','document','portalContainer']);
var CALLBACKS = Object.freeze(['onConfirm','onCancel','onBeforeOpen','onBeforeClose','onOpen','onClose','onOpenChange','afterOpenChange','onDestroy']);
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
function resolveButtons(opts) { return OverlayFramePolicy.resolveButtons(opts, Utils.mergeOwn(overlayButtonPolicy, { requireExplicitFooter:true })); }
function validRenderable(value) {
  return value === undefined || value === null || typeof value === 'boolean' || typeof value === 'function' || typeof value === 'string' || typeof value === 'number' || Renderer.isNodeLike(value);
}
function normalize(input, previous) {
  var incoming = input || {};
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new TypeError('[QXFRAME9A7C2] Drawer options must be an object.');
  var next = Utils.mergeOwn(previous || {}, incoming);
  next.placement = enumValue(next.placement, PLACEMENTS, 'right', 'placement');
  var closable = OverlayFramePolicy.normalizeClosable(own(incoming, 'closable') ? incoming.closable : undefined, previous, { owner:'Drawer', placements:['start','end'] });
  next.closable = closable.visible;
  next.closeOptions = closable.options;
  ['showMask','closeOnMask','closeOnEscape','destroyOnHidden','lockScroll','focusTrap','restoreFocus','forceRender','autoOpen','respectReducedMotion'].forEach(function (key) {
    var defaults = {showMask:true,closeOnMask:true,closeOnEscape:true,destroyOnHidden:false,lockScroll:true,focusTrap:true,restoreFocus:true,forceRender:false,autoOpen:true,respectReducedMotion:true};
    next[key] = bool(next[key], defaults[key], key);
  });
  if (next.header !== undefined && typeof next.header !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Drawer header must be boolean.');
  if (!validRenderable(next.footer)) throw new TypeError('[QXFRAME9A7C2] Drawer footer must be boolean, renderable content, or function.');
  if (next.buttons !== undefined && !Array.isArray(next.buttons)) throw new TypeError('[QXFRAME9A7C2] Drawer buttons must be an array.');
  CALLBACKS.forEach(function (key) { if (next[key] != null && typeof next[key] !== 'function') throw new TypeError('[QXFRAME9A7C2] Drawer ' + key + ' must be a function.'); });
  if (next.autoFocus !== undefined && next.autoFocus !== false && typeof next.autoFocus !== 'string' && typeof next.autoFocus !== 'function' && !(next.autoFocus && next.autoFocus.nodeType === 1)) throw new TypeError('[QXFRAME9A7C2] Drawer autoFocus must be false, selector, Element, or function.');
  if (next.zIndex !== undefined && next.zIndex !== null && next.zIndex !== '' && !Number.isFinite(Number(next.zIndex))) throw new TypeError('[QXFRAME9A7C2] Drawer zIndex must be a finite number.');
  next.zIndex = next.zIndex === undefined || next.zIndex === null || next.zIndex === '' ? null : Math.floor(Number(next.zIndex));
  ['width','height'].forEach(function (key) {
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
  var initial = normalize(Utils.assignOwn({
    title:'', content:'', placement:'right', closable:true, showMask:true,
    closeOnMask:true, closeOnEscape:true, destroyOnHidden:false, lockScroll:true,
    focusTrap:true, restoreFocus:true, forceRender:false, autoOpen:true,
    respectReducedMotion:true, animation:'slide'
  }, options || {}));

  function transitionEnabled(ctx) {
    var opts = ctx.options();
    return opts.animation !== false && Config.motionEnabled(ctx.root, undefined, opts.respectReducedMotion !== false);
  }
  function durations(ctx) {
    var pair = durationPair(ctx.options());
    return transitionEnabled(ctx) ? pair : [0,0];
  }
  function transformDescriptor(hidden, origin) {
    return {
      type:'transition',
      appear:{ from:{style:{transform:hidden,transformOrigin:origin}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-out-circ)'}}, to:{style:{transform:'translate3d(0,0,0) scale(1)'}} },
      enter:{ from:{style:{transform:hidden,transformOrigin:origin}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-out-circ)'}}, to:{style:{transform:'translate3d(0,0,0) scale(1)'}} },
      leave:{ from:{style:{transform:'translate3d(0,0,0) scale(1)',transformOrigin:origin}}, active:{style:{transition:'transform var(--qxframe9a7c2-motion-duration-mid) var(--qxframe9a7c2-motion-ease-in-out-circ)'}}, to:{style:{transform:hidden}} }
    };
  }
  function panelMotion(ctx) {
    var opts = ctx.options();
    var origin = opts.placement === 'left' ? 'left center' : opts.placement === 'right' ? 'right center' : opts.placement === 'top' ? 'center top' : 'center bottom';
    if (opts.animation === 'expand') return transformDescriptor(opts.placement === 'left' || opts.placement === 'right' ? 'scaleX(0)' : 'scaleY(0)', origin);
    var hidden = opts.placement === 'left' ? 'translate3d(-100%,0,0)' : opts.placement === 'right' ? 'translate3d(100%,0,0)' : opts.placement === 'top' ? 'translate3d(0,-100%,0)' : 'translate3d(0,100%,0)';
    return transformDescriptor(hidden, origin);
  }

  return OverlayFrameRuntime.create({
    instance,
    options:initial,
    normalizeOptions:normalize,
    immutableOptions:IMMUTABLE_OPTIONS,
    componentType:'Drawer',
    idPrefix:'drawer',
    closePlacement:true,
    surfacePayloadKey:'panel',
    motionSurfaceKey:'panel',
    classes:{
      root:'qxframe9a7c2-drawer-root',
      mask:'qxframe9a7c2-drawer-mask',
      wrap:'qxframe9a7c2-drawer-wrap',
      surface:'qxframe9a7c2-drawer',
      header:'qxframe9a7c2-drawer-header',
      title:'qxframe9a7c2-drawer-title',
      close:'qxframe9a7c2-button is-text is-sm qxframe9a7c2-drawer-close',
      body:'qxframe9a7c2-drawer-body',
      footer:'qxframe9a7c2-drawer-footer'
    },
    resolveButtons,
    normalizeOpenRequest(reason, event) {
      return reason && typeof reason === 'object' && reason.type ? { reason:'event', event:reason } : { reason, event };
    },
    applyVisualOptions(ctx, showing) {
      var opts = ctx.options(), panel = ctx.surface;
      var pair = durations(ctx), ease = easingPair(opts), index = showing === false ? 1 : 0;
      ctx.root.className = 'qxframe9a7c2-drawer-root';
      ctx.mask.className = ('qxframe9a7c2-drawer-mask ' + opts.maskClassName).trim();
      ctx.wrap.className = ('qxframe9a7c2-drawer-wrap is-' + opts.placement).trim();
      panel.className = ('qxframe9a7c2-drawer qxframe9a7c2-drawer-' + opts.placement + ' ' + opts.className).trim();
      ctx.root.dataset.placement = opts.placement;
      ctx.wrap.dataset.placement = opts.placement;
      panel.dataset.placement = opts.placement;
      DOM.setPrivate(ctx.root, 'animation', opts.animation === false ? 'none' : opts.animation);
      ctx.mask.style.setProperty('--qxframe9a7c2-motion-duration-mid', pair[index] + 'ms');
      panel.style.setProperty('--qxframe9a7c2-motion-duration-mid', pair[index] + 'ms');
      ctx.mask.style.setProperty('--qxframe9a7c2-motion-ease-out-circ', ease[index]);
      ctx.mask.style.setProperty('--qxframe9a7c2-motion-ease-in-out-circ', ease[index]);
      panel.style.setProperty('--qxframe9a7c2-motion-ease-out-circ', ease[index]);
      panel.style.setProperty('--qxframe9a7c2-motion-ease-in-out-circ', ease[index]);
      ctx.mask.classList.toggle('is-maskless', opts.showMask === false);
      if (opts.placement === 'left' || opts.placement === 'right') {
        panel.style.width = px(opts.width);
        panel.style.height = '';
      } else {
        panel.style.height = px(opts.height);
        panel.style.width = '';
      }
      if (own(opts, 'maskColor')) ctx.mask.style.background = opts.maskColor || '';
      var customFooter = opts.footer !== undefined && opts.footer !== true && opts.footer !== false && opts.footer !== null && !Array.isArray(opts.footer);
      var showFooter = opts.footer !== false && opts.footer !== null && (ctx.buttons().length > 0 || customFooter);
      panel.classList.toggle('is-headerless', opts.header === false);
      panel.classList.toggle('is-footerless', !showFooter);
      ctx.frameShell.applyStyle(panel, opts.style);
      ctx.frameShell.applyStyle(ctx.mask, opts.maskStyle);
    },
    maskTransition(ctx) {
      return {
        transition:MotionPresets.fade,
        appear:true,
        reducedMotion:function () { var opts=ctx.options(); return !Config.motionEnabled(ctx.root, undefined, opts.respectReducedMotion !== false); },
        disabled:function () { return ctx.options().animation === false; }
      };
    },
    surfaceTransition(ctx) {
      return {
        transition:function () { return panelMotion(ctx); },
        appear:true,
        reducedMotion:function () { var opts=ctx.options(); return !Config.motionEnabled(ctx.root, undefined, opts.respectReducedMotion !== false); },
        disabled:function () { return ctx.options().animation === false; }
      };
    },
    presenceOptions(ctx, _kind, showing) {
      var pair = durations(ctx);
      return { immediate:pair[showing ? 0 : 1] <= 0 };
    },
    stateExtras(ctx) {
      var opts = ctx.options(), close = ctx.closeConfig();
      return { side:opts.placement, closePlacement:close.placement || 'end' };
    }
  });
}

export class Drawer extends OverlayComponent {
    static profile = Object.freeze({
        name:'Drawer',
        focus:Object.freeze({ mode:'overlay-scope' }),
        interaction:Object.freeze({ mode:'frame-actions' }),
        capability:Object.freeze({ mode:'frame-actions' }),
        motion:Object.freeze({ mode:'dual-presence' }),
        overlay:Object.freeze({ mode:'drawer-layer' }),
        feedback:Object.freeze({ mode:'action-feedback' }),
        ownership:Object.freeze({
            focus:'FocusController', interaction:'InteractionController', capability:'CapabilityController',
            motion:'MotionController', overlay:'OverlayController', feedback:'FeedbackController'
        })
    });
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
