// Stage 88→92 tail: canonical ESM NoticeService building-block authority.
import { NoticeClock } from './noticeClock.js';
import { Utils } from '../utils/utils.js';
import { DOM } from './dom.js';
import { Lifecycle } from './lifecycle.js';
import { Scheduler } from './scheduler.js';
import { Config } from './config.js';
import { IdManager } from '../utils/id.js';
import { Renderer } from './renderer.js';
import { LayerManager } from './layerManager.js';
import { TransitionGroup } from './transitionGroup.js';
import { ObserverHub } from './observerHub.js';

const global = globalThis;

var ACTION_TYPES = Object.freeze(['default', 'primary', 'danger']);
var NOTICE_TRANSITION = Object.freeze({
  type: 'transition',
  appear: Object.freeze({
    from: Object.freeze({ style: Object.freeze({ transform: 'translate3d(var(--qxframe9a7c2-notice-enter-x), var(--qxframe9a7c2-notice-enter-y), 0)', opacity: '0' }) }),
    active: Object.freeze({ style: Object.freeze({ transitionProperty: 'transform, opacity', transitionDuration: 'var(--qxframe9a7c2-notice-enter-duration)', transitionTimingFunction: 'var(--qxframe9a7c2-notice-easing)' }) }),
    to: Object.freeze({ style: Object.freeze({ transform: 'translate3d(0, 0, 0)', opacity: '1' }) })
  }),
  enter: Object.freeze({
    from: Object.freeze({ style: Object.freeze({ transform: 'translate3d(var(--qxframe9a7c2-notice-enter-x), var(--qxframe9a7c2-notice-enter-y), 0)', opacity: '0' }) }),
    active: Object.freeze({ style: Object.freeze({ transitionProperty: 'transform, opacity', transitionDuration: 'var(--qxframe9a7c2-notice-enter-duration)', transitionTimingFunction: 'var(--qxframe9a7c2-notice-easing)' }) }),
    to: Object.freeze({ style: Object.freeze({ transform: 'translate3d(0, 0, 0)', opacity: '1' }) })
  }),
  leave: Object.freeze({
    from: Object.freeze({ style: Object.freeze({ transform: 'translate3d(0, 0, 0)', opacity: '1' }) }),
    active: Object.freeze({ style: Object.freeze({ transitionProperty: 'transform, opacity', transitionDuration: 'var(--qxframe9a7c2-notice-leave-duration)', transitionTimingFunction: 'var(--qxframe9a7c2-notice-easing)' }) }),
    to: Object.freeze({ style: Object.freeze({ transform: 'translate3d(var(--qxframe9a7c2-notice-leave-x), var(--qxframe9a7c2-notice-leave-y), 0)', opacity: '0', pointerEvents: 'none' }) })
  })
});
var NOTICE_GAP = 16;
var NOTICE_STACK_OFFSET = 8;
var NOTICE_STACK_SCALE = 0.95;
var own = Utils.own;
function bool(value, fallback, label, owner) { return Utils.booleanValue(value, fallback, String(owner) + ' ' + label); }
function finite(value, fallback, minimum, label, owner) { return Utils.finiteAtLeast(value, fallback, minimum, String(owner) + ' ' + label); }
function enumValue(value, allowed, fallback, label, owner) { return Utils.enumValue(value, allowed, fallback, String(owner) + ' ' + label); }
function cssLength(value, fallback, label, owner) {
  if (value === undefined || value === null || value === '') return fallback || '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' ' + label + ' must be a non-negative number or CSS length.');
    return value + 'px';
  }
  if (typeof value !== 'string') throw new TypeError('[QXFRAME9A7C2] ' + owner + ' ' + label + ' must be a number or CSS length.');
  return value;
}
function styleObject(value, label, owner) {
  if (value === undefined || value === null) return null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' ' + label + ' must be an object.');
  return Object.assign({}, value);
}
function normalizeAction(raw, index, owner) {
  var action = (typeof raw === 'string' || typeof raw === 'number') ? { label: String(raw) } : Object.assign({}, raw || {});
  if (!action || typeof action !== 'object' || Array.isArray(action)) throw new TypeError('[QXFRAME9A7C2] ' + owner + ' action must be a string, number, or object.');
  if (action.onClick != null && typeof action.onClick !== 'function') throw new TypeError('[QXFRAME9A7C2] ' + owner + ' action.onClick must be a function.');
  action.key = action.key == null ? 'action-' + index : String(action.key);
  action.label = action.label !== undefined ? action.label : (action.content !== undefined ? action.content : '操作 ' + (index + 1));
  action.type = enumValue(action.type, ACTION_TYPES, 'default', 'action.type', owner);
  action.disabled = bool(action.disabled, false, 'action.disabled', owner);
  action.closeOnClick = bool(action.closeOnClick, true, 'action.closeOnClick', owner);
  action.className = action.className == null ? '' : String(action.className);
  return action;
}
function applyStyle(element, style) {
  if (!element || !style) return;
  Object.keys(style).forEach(function (key) { element.style[key] = style[key] == null ? '' : String(style[key]); });
}
function clearStyleObject(element, previous) {
  if (!element || !previous) return;
  Object.keys(previous).forEach(function (key) { element.style[key] = ''; });
}
function renderValue(host, value, record) {
  var output = typeof value === 'function' ? value({ instance: record.instance, options: record.options }) : value;
  Renderer.replace(host, output == null ? '' : output, host.ownerDocument);
}
var DEFAULT_NOTICE_ICONS = Object.freeze({ success:'check-circle', error:'error-octagon', warning:'alert-triangle', info:'info', loading:'sync' });
function beginRender(record, config) {
  var cfg = config || {}, opts = record.options, item = record.item;
  clearStyleObject(item, record.appliedStyle);
  record.appliedStyle = opts.style ? Object.assign({}, opts.style) : null;
  item.className = String(typeof cfg.className === 'function' ? cfg.className(opts, record) : (cfg.className || item.className || ''));
  record.slot.style.setProperty('--qxframe9a7c2-notice-enter-duration', opts.enterDuration + 'ms');
  record.slot.style.setProperty('--qxframe9a7c2-notice-leave-duration', opts.leaveDuration + 'ms');
  record.slot.style.setProperty('--qxframe9a7c2-notice-easing', opts.easing);
  if (cfg.widths === true) { item.style.width = opts.width || ''; item.style.minWidth = opts.minWidth || ''; item.style.maxWidth = opts.maxWidth || ''; }
  applyStyle(item, record.appliedStyle);
  if (record.closeButton && record.closeButton.parentNode) record.closeButton.parentNode.removeChild(record.closeButton);
  if (record.progress && record.progress.parentNode) record.progress.parentNode.removeChild(record.progress);
  record.closeButton = null; record.progress = null;
  return Object.freeze({ options:opts, item:item, body:record.body, document:record.body.ownerDocument });
}
function appendNoticeIcon(record, host, config) {
  var cfg = config || {}, opts = record.options, iconValue = opts.icon === false ? null : (opts.icon !== undefined ? opts.icon : DEFAULT_NOTICE_ICONS[opts.type]);
  if (iconValue === null || iconValue === undefined || iconValue === '') return null;
  var icon = host.ownerDocument.createElement('span');
  icon.className = String(cfg.className || 'qxframe9a7c2-notice-icon') + ' is-' + opts.type;
  if (opts.icon === undefined) { icon.classList.add('qxframe9a7c2-icon','qxframe9a7c2-icon-' + iconValue,'is-line','is-round','is-stroke-3',cfg.sizeClass || 'is-md'); if (opts.type === 'loading') icon.classList.add('is-spin'); }
  else renderValue(icon, iconValue, record);
  host.appendChild(icon);
  return icon;
}
function appendNoticeChrome(record, config) {
  var cfg = config || {}, opts = record.options, item = record.item, doc = item.ownerDocument;
  if (opts.closable) {
    var closeButton = doc.createElement('button'); closeButton.type = 'button'; closeButton.className = String(cfg.closeClass || 'qxframe9a7c2-notice-close'); DOM.setPrivate(closeButton, 'noticeClose', 'true');
    var closeGlyph = doc.createElement('span'); closeGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-close is-line is-round is-stroke-3 is-sm'; closeButton.appendChild(closeGlyph); item.appendChild(closeButton); record.closeButton = closeButton;
  }
  if (opts.showProgress && opts.duration > 0) {
    var progress = doc.createElement('progress'); progress.className = String(cfg.progressClass || 'qxframe9a7c2-notice-progress'); progress.max = 1; progress.value = 1; item.appendChild(progress); record.progress = progress;
  }
  return Object.freeze({ closeButton:record.closeButton, progress:record.progress });
}
function isTop(placement) { return String(placement || '').indexOf('top') === 0; }
function isBottom(placement) { return String(placement || '').indexOf('bottom') === 0; }
function horizontalSide(placement) {
  if (String(placement || '').indexOf('left') >= 0) return 'left';
  if (String(placement || '').indexOf('right') >= 0) return 'right';
  return 'center';
}
function activeRecords(entry) {
  return entry.records.filter(function (record) { return record && !record.closed && !record.closing; });
}
function residentRecords(entry) {
  return entry.records.filter(function (record) { return record && !record.closed; });
}
function layoutRecords(entry) {
  // Match CSSMotionList semantics: a closing notice remains physically mounted for its
  // leave animation, but it stops owning layout space immediately. Siblings therefore
  // reflow in the same frame that leave starts instead of waiting for unmount and jumping.
  return entry.records.filter(function (record) { return record && !record.closed && !record.closing; });
}
    
var utils = Object.freeze({
  own: own,
  bool: bool,
  finite: finite,
  enumValue: enumValue,
  cssLength: cssLength,
  styleObject: styleObject,
  normalizeAction: normalizeAction,
  applyStyle: applyStyle,
  clearStyleObject: clearStyleObject,
  renderValue: renderValue,
  beginRender: beginRender,
  appendNoticeIcon: appendNoticeIcon,
  appendNoticeChrome: appendNoticeChrome,
  isTop: isTop,
  isBottom: isBottom,
  horizontalSide: horizontalSide
});
    
function createChannel(profile) {
  if (!profile || typeof profile !== 'object') throw new TypeError('[QXFRAME9A7C2] NoticeService.createChannel() requires a profile.');
  if (!profile.name || !profile.slug) throw new TypeError('[QXFRAME9A7C2] NoticeService profile requires name and slug.');
  if (typeof profile.normalize !== 'function' || typeof profile.render !== 'function') throw new TypeError('[QXFRAME9A7C2] NoticeService profile requires normalize/render functions.');
    
  var owner = String(profile.name);
  var slug = String(profile.slug);
  var frames = new Map();
  var records = new Map();
  var documentIds = new WeakMap();
  var documentSequence = 0;
  var orderSequence = 0;

  function resolveFrameDocument(opts) {
    var source = opts || {};
    var doc = source.document || (source.container && source.container.ownerDocument) || global.document;
    if (!doc || doc.nodeType !== 9 || !doc.body || typeof doc.createElement !== 'function') throw new Error('[QXFRAME9A7C2] ' + owner + ' requires a valid document.body.');
    return doc;
  }
  function frameKey(doc, placement) {
    var id = documentIds.get(doc);
    if (!id) { id = ++documentSequence; documentIds.set(doc, id); }
    return id + ':' + String(placement || '');
  }
  function createRealmFrameScheduler(doc, callback) {
    var view = doc && doc.defaultView || global;
    if (view && typeof view.requestAnimationFrame === 'function' && typeof view.cancelAnimationFrame === 'function') {
      return Scheduler.createFrameScheduler(callback, {
        requestFrame: view.requestAnimationFrame.bind(view),
        cancelFrame: view.cancelAnimationFrame.bind(view)
      });
    }
    return Scheduler.createFrameScheduler(callback);
  }
    
  function stackConfig(opts) {
    var enabled = opts.stack === true || !!(opts.stack && typeof opts.stack === 'object');
    var configured = enabled && opts.stack && typeof opts.stack === 'object' ? opts.stack : null;
    var threshold = configured ? configured.threshold : 3;
    var offset = configured && Number.isFinite(Number(configured.offset)) ? Number(configured.offset) : NOTICE_STACK_OFFSET;
    var scale = configured && Number.isFinite(Number(configured.scale)) ? Number(configured.scale) : NOTICE_STACK_SCALE;
    return {
      enabled: enabled,
      threshold: enabled ? threshold : Infinity,
      maxVisible: enabled ? Math.max(1, Number(profile.collapsedVisible) || 1) : Infinity,
      hardLimit: opts.maxCount > 0 ? opts.maxCount : Infinity,
      offset: enabled ? Math.max(0, offset) : NOTICE_STACK_OFFSET,
      scale: enabled ? Math.min(1, Math.max(0.01, scale)) : NOTICE_STACK_SCALE
    };
  }
    
  function applyFrameOptions(entry, opts) {
    var frame = entry.frame;
    clearStyleObject(frame, entry.appliedStackStyle);
    entry.appliedStackStyle = opts.stackStyle ? Object.assign({}, opts.stackStyle) : null;
    (entry.appliedStackClassTokens || []).forEach(function (token) { if (token) frame.classList.remove(token); });
    frame.classList.add('qxframe9a7c2-notice-stack', 'qxframe9a7c2-' + slug + '-stack', 'is-' + entry.placement);
    entry.appliedStackClassTokens = String(opts.stackClassName || '').split(/\s+/).filter(Boolean);
    entry.appliedStackClassTokens.forEach(function (token) { frame.classList.add(token); });
    DOM.setPrivate(frame, 'noticeChannel', slug);
    frame.setAttribute('data-qxframe9a7c2-placement', entry.placement);
    frame.style.setProperty('--qxframe9a7c2-notice-move-duration', Math.max(0, Number(opts.moveDuration) || 0) + 'ms');
    frame.style.setProperty('--qxframe9a7c2-notice-easing', opts.easing || 'ease');
    frame.style.setProperty('--qxframe9a7c2-notice-gap', NOTICE_GAP + 'px');
    frame.style.top = '';
    frame.style.right = '';
    frame.style.bottom = '';
    frame.style.left = '';
    frame.style.transform = '';
    applyStyle(frame, entry.appliedStackStyle);
    entry.options = Object.assign({}, opts);
    entry.stack = stackConfig(opts);
    frame.classList.toggle('is-stack-enabled', entry.stack.enabled);
    if (entry.hovering && !entry.stack.enabled) setFrameHover(entry, false);
    if (entry.layerHandle) {
      entry.layerHandle.update({ zIndexOffset: opts.zIndex });
      var resolved = entry.layerHandle.getZIndex();
      frame.style.zIndex = resolved === null || resolved === undefined ? '' : String(resolved);
    }
  }
    
  function setFrameHover(entry, value) {
    if (!entry || entry.hovering === value) return;
    entry.hovering = value;
    entry.frame.classList.toggle('is-hovering', value);
    entry.layout.cancel();
    layoutEntry(entry, value ? 'hover-enter' : 'hover-leave');
  }
    
  function shouldTrackFrameHover(entry) {
    // Geometry hover only owns collapsed/expanded stack projection. Timer scope is explicit and
    // is never inferred from placement, threshold, or whether the stack currently folds.
    return !!(entry && entry.stack && entry.stack.enabled && activeRecords(entry).length > entry.stack.threshold);
  }
    
  function setFrameTimerHover(entry, value) {
    if (!entry || entry.timerHovering === value) return;
    entry.timerHovering = value;
    entry.records.forEach(function (record) {
      if (!record || record.closed || record.closing || !record.options.pauseOnHover || record.options.pauseOnHoverScope !== 'stack') return;
      if (value) pauseTimer(record, 'stack-hover'); else resumeTimer(record, 'stack-hover');
    });
  }
    
  function hasStackPauseRecords(entry) {
    return !!(entry && activeRecords(entry).some(function (record) {
      return record && record.options.pauseOnHover && record.options.pauseOnHoverScope === 'stack';
    }));
  }
    
  function isEntryNoticeTarget(entry, target) {
    if (!entry || !target) return false;
    return residentRecords(entry).some(function (record) {
      return !!(record && record.item && (record.item === target || record.item.contains(target)));
    });
  }
    
  function updateFramePointer(entry, event) {
    if (!entry || !event) return;
    var clientX = Number(event.clientX);
    var clientY = Number(event.clientY);
    if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return;
    entry.pointerX = clientX;
    entry.pointerY = clientY;
    entry.pointerKnown = true;
  }
    
  function pointInRect(x, y, rect, inset) {
    var pad = Math.max(0, Number(inset) || 0);
    return !!(rect && x >= rect.left - pad && x <= rect.right + pad && y >= rect.top - pad && y <= rect.bottom + pad);
  }
    
  function frameHoverContainsPoint(entry, clientX, clientY) {
    if (!entry || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return false;
    var rects = activeRecords(entry).map(function (record) {
      if (!record || !record.item || record.item.style.pointerEvents === 'none') return null;
      var rect = record.item.getBoundingClientRect();
      if (!rect || rect.width <= 0 || rect.height <= 0) return null;
      return rect;
    }).filter(Boolean).sort(function (a, b) { return a.top - b.top; });
    if (!rects.length) return false;
    for (var i = 0; i < rects.length; i += 1) {
      if (pointInRect(clientX, clientY, rects[i], 1)) return true;
    }
    // Keep a real pointer handoff stable across the visual gap between adjacent notices.
    // The bridge is geometry-only: it never widens a notice while the pointer is vertically
    // inside that notice, so horizontally leaving a narrow card still ends the hover session.
    for (var j = 0; j < rects.length - 1; j += 1) {
      var upper = rects[j];
      var lower = rects[j + 1];
      var gapTop = upper.bottom;
      var gapBottom = lower.top;
      if (gapBottom < gapTop) continue;
      if (gapBottom - gapTop > NOTICE_GAP * 2 + 2) continue;
      var bridgeLeft = Math.min(upper.left, lower.left);
      var bridgeRight = Math.max(upper.right, lower.right);
      if (clientY >= gapTop - 1 && clientY <= gapBottom + 1 && clientX >= bridgeLeft - 1 && clientX <= bridgeRight + 1) return true;
    }
    return false;
  }
    
  function handlePhysicalFramePointerMove(entry, event) {
    if (!entry || (!entry.hovering && !entry.timerHovering)) return;
    updateFramePointer(entry, event);
    // The event target is resolved before synchronous expansion layout runs. Preserve physical
    // hover while the event is still inside any notice, independent of timer scope.
    if (isEntryNoticeTarget(entry, event.target)) return;
    if (!entry.pointerKnown) return;
    if (!frameHoverContainsPoint(entry, entry.pointerX, entry.pointerY)) {
      if (entry.hovering) setFrameHover(entry, false);
      if (entry.timerHovering) setFrameTimerHover(entry, false);
    }
  }
    
  function transitionEntries(entry) {
    return activeRecords(entry).map(function (record) { return { key: record.key, element: record.slot }; });
  }
    
  function syncEntry(entry, reason, meta) {
    if (!entry || !entry.transitionGroup) return;
    var details = meta && typeof meta === 'object' ? meta : {};
    entry.transitionGroup.sync(transitionEntries(entry), {
      reason: reason || 'layout',
      originalEvent: details.originalEvent || null,
      immediate: details.immediate === true,
      project: function () { layoutEntry(entry, reason || 'layout'); }
    });
  }
    
  function createFrame(placement, opts, doc, key) {
    doc = doc || resolveFrameDocument(opts);
    key = key || frameKey(doc, placement);
    var scope = Lifecycle.createScope();
    var frame = doc.createElement('div');
    var viewport = doc.createElement('div');
    var list = doc.createElement('div');
    var scrollExtent = doc.createElement('div');
    viewport.className = 'qxframe9a7c2-notice-viewport qxframe9a7c2-' + slug + '-viewport';
    list.className = 'qxframe9a7c2-notice-list qxframe9a7c2-' + slug + '-list is-new-list';
    scrollExtent.className = 'qxframe9a7c2-notice-scroll-extent';
    viewport.appendChild(list);
    viewport.appendChild(scrollExtent);
    frame.appendChild(viewport);
    doc.body.appendChild(frame);
    var entry = {
      placement: placement,
      frameKey: key,
      document: doc,
      frame: frame,
      viewport: viewport,
      list: list,
      scrollExtent: scrollExtent,
      records: [],
      hovering: false,
      timerHovering: false,
      expanded: false,
      pointerKnown: false,
      pointerX: 0,
      pointerY: 0,
      listHeight: 0,
      maxScrollTop: 0,
      contentHeight: 0,
      listHeightAnimation: null,
      scope: scope,
      options: null,
      stack: null,
      appliedStackStyle: null,
      appliedStackClassTokens: [],
      layout: null,
      transitionGroup: null,
      layerHandle: null,
      // While a keyed child is waiting to enter, sibling top/size WAAPI is paused at its
      // painted origin. The exact child's MotionCore active commit releases that bucket.
      // This makes the incoming fade/translate and existing-item displacement one frame.
      deferLayoutKey: null,
      deferredLayoutAnimations: new Map()
    };
    // Every animated child now owns its own painted FROM baseline; the placement frame
    // itself no longer acts as a one-time proxy barrier for later insertions.
    entry.layerHandle = LayerManager.getShared(doc).register(frame, {
      id: IdManager.next(slug + '-layer'),
      kind: 'notice',
      componentType: slug,
      zIndexOffset: opts.zIndex
    });
    entry.transitionGroup = TransitionGroup.create({
      container: list,
      appear: true,
      transition: NOTICE_TRANSITION,
      // Notice layout motion deliberately does not use TransitionGroup FLIP. Presence
      // owns `transform` for enter/leave; slot stack geometry owns individual `translate` while Presence owns `transform`, so both can
      // animate concurrently, matching Ant notification/message motion semantics.
      move: false,
      // MotionCore is the single authoritative presence writer. Do not start a second
      // WAAPI transform/opacity animation from lifecycle hooks: two clocks on the same
      // properties make rapid enter/leave reversal retarget twice and produce visible drag.
      deadlinePadding: 32,
      onPrepare: function (context) {
        // Every newly inserted animated child needs one actually painted FROM baseline, not
        // only the first child that lazily creates the placement frame. Without this barrier
        // a later DOM insertion can reach its target opacity/transform before the browser ever
        // paints FROM, producing the observed one-frame cover/teleport. Leave/reversal stays
        // synchronous; only a fresh animated appear/enter pays this single frame boundary.
        var status = context && context.status;
        if (status !== 'appear' && status !== 'enter') return null;
        return ensurePaintedEnterBaseline(records.get(String(context.key)));
      },
      onActive: function (context) {
        if (!context || (context.status !== 'appear' && context.status !== 'enter')) return;
        // TransitionGroup now forwards the exact keyed child's MotionCore active commit.
        // Release only that child's paused insertion bucket here: incoming Presence and
        // historical-slot displacement therefore share the same paint transaction without
        // scanning unrelated records or inferring lifecycle from aggregate group state.
        releaseDeferredLayout(entry, context.key);
      },
      onBeforeLeave: function (context) {
        // A rapid enter -> leave reversal must not strand historical slots in a paused
        // insertion animation if this child never reaches the normal enter active commit.
        releaseDeferredLayout(entry, context.key);
      },
      onAfterEnter: function (context) {
        var record = records.get(String(context.key));
        if (!record || record.closed || record.closing) return;
        // Keep the pre-mount seed through the entire enter. During active, MotionCore's inline
        // TO patch overrides it, preserving a real opacity/transform transition even when FROM
        // cleanup restores empty inline styles. finish() removes TO and this class in one JS
        // turn, so the settled card never paints the seed again.
        record.slot.classList.remove('is-presence-seeded');
        record.enterComplete = true;
        restartTimer(record);
      },
      onAfterLeave: function (context) {
        var record = records.get(String(context.key));
        if (!record || record.closed) return;
        finalizeClose(record, record.closeReason || 'close', record.closeEvent || null);
      }
    });
    entry.layout = createRealmFrameScheduler(doc, function (_timestamp, reason) { syncEntry(entry, reason); });
    // Ant keeps exactly one list-hover state. QXFRAME9A7C2 has pointer-transparent geometry holders, so
    // physical pointer movement is observed at document level while that shared session is
    // active. Item mouseleave never owns collapse: layout motion can move an item away from a
    // stationary pointer and must not synthesize an expand/collapse feedback loop.
    scope.add(DOM.listen(doc, 'mousemove', function (event) { handlePhysicalFramePointerMove(entry, event); }, { passive: true }));
    if (doc.documentElement) scope.add(DOM.listen(doc.documentElement, 'mouseleave', function () { if (entry.hovering) setFrameHover(entry, false); if (entry.timerHovering) setFrameTimerHover(entry, false); }));
    scope.add(function () {
      entry.layout.dispose();
      entry.deferredLayoutAnimations.forEach(function (bucket) {
        bucket.forEach(function (animation) { try { animation.cancel(); } catch (_) {} });
      });
      entry.deferredLayoutAnimations.clear();
      entry.deferLayoutKey = null;
    });
    applyFrameOptions(entry, opts);
    frames.set(key, entry);
    return entry;
  }
    
  function getFrame(placement, opts) {
    var doc = resolveFrameDocument(opts);
    var key = frameKey(doc, placement);
    var entry = frames.get(key);
    if (!entry || !entry.frame.parentNode) return createFrame(placement, opts, doc, key);
    applyFrameOptions(entry, opts);
    return entry;
  }
    
  function releaseFrame(entry) {
    if (!entry || activeRecords(entry).length || entry.list.children.length) return false;
    frames.delete(entry.frameKey);
    if (entry.listHeightAnimation) { try { entry.listHeightAnimation.cancel(); } catch (_) {} entry.listHeightAnimation = null; }
    if (entry.layerHandle) { entry.layerHandle.unregister(); entry.layerHandle = null; }
    if (entry.transitionGroup) { entry.transitionGroup.destroy(); entry.transitionGroup = null; }
    entry.scope.dispose();
    DOM.removeNode(entry.frame);
    return true;
  }
    
  function noticeReducedMotion() { return !Config.motionEnabled(null); }
    
  function ensurePaintedEnterBaseline(record) {
    if (!record || record.closed || record.closing || record.enterBaselineReady) return null;
    var duration = Math.max(0, Number(record.options && record.options.enterDuration) || 0);
    if (duration <= 0 || noticeReducedMotion() || !record.enterBaselineScheduler) {
      record.enterBaselineReady = true;
      return null;
    }
    if (record.enterBaselinePromise) return record.enterBaselinePromise;
    record.enterBaselinePromise = new Promise(function (resolve) {
      record.enterBaselineResolve = resolve;
      record.enterBaselineFrame = 1;
      record.enterBaselineScheduler.request('notice-enter-baseline');
    });
    return record.enterBaselinePromise;
  }
    
  function computedStyleValue(element, property, fallback) {
    if (!element) return fallback;
    var view = DOM.viewOf(element);
    if (!view || !view.getComputedStyle) return fallback;
    var value = view.getComputedStyle(element).getPropertyValue(property);
    return value == null || value === '' ? fallback : String(value).trim();
  }
    
  function seedNoticePresenceGeometry(record) {
    if (!record || record.enterDisplacementReady || !record.slot || !record.entry) return false;
    var measuredHeight = Math.max(0, Number(record.height) || 0);
    if (measuredHeight <= 0) return false;
    // Stack geometry and Presence intentionally use different distances. The list transaction
    // opens exactly one real slot (card height + canonical gap), while the incoming card starts
    // farther outside the placement edge, matching the slower shadcn/Base-UI style reveal.
    // Keeping these owners separate avoids the v2.19.66 "constant gap" constraint that made the
    // motion mathematically tidy but visually mechanical.
    var span = Math.max(1, measuredHeight + NOTICE_GAP);
    var travel = Math.max(span, measuredHeight * 1.5);
    var direction = isBottom(record.entry.placement) ? 1 : -1;
    record.enterDisplacement = travel;
    record.enterDisplacementReady = true;
    record.slot.style.setProperty('--qxframe9a7c2-notice-insert-span', span + 'px');
    record.slot.style.setProperty('--qxframe9a7c2-notice-enter-travel', travel + 'px');
    record.slot.style.setProperty('--qxframe9a7c2-notice-enter-x', '0px');
    record.slot.style.setProperty('--qxframe9a7c2-notice-enter-y', (direction * travel) + 'px');
    return true;
  }
    
  function deferLayoutAnimation(entry, key, animation) {
    if (!entry || !key || !animation) return false;
    var token = String(key);
    var bucket = entry.deferredLayoutAnimations.get(token);
    if (!bucket) { bucket = new Set(); entry.deferredLayoutAnimations.set(token, bucket); }
    bucket.add(animation);
    try { animation.pause(); } catch (_) {}
    return true;
  }
    
  function releaseDeferredLayout(entry, key) {
    if (!entry || key === undefined || key === null) return false;
    var token = String(key);
    var bucket = entry.deferredLayoutAnimations.get(token);
    if (entry.deferLayoutKey === token) entry.deferLayoutKey = null;
    if (!bucket) return false;
    entry.deferredLayoutAnimations.delete(token);
    bucket.forEach(function (animation) {
      if (!animation) return;
      try { if (animation.playState === 'paused') animation.play(); } catch (_) {}
    });
    return true;
  }
    
  function removeDeferredLayoutAnimation(entry, key, animation) {
    if (!entry || !key || !animation) return;
    var token = String(key);
    var bucket = entry.deferredLayoutAnimations.get(token);
    if (!bucket) return;
    bucket.delete(animation);
    if (!bucket.size) entry.deferredLayoutAnimations.delete(token);
  }
    
  function translateYFromComputed(value, fallback) {
    var text = String(value == null ? '' : value).trim();
    if (!text || text === 'none') return Number(fallback) || 0;
    var parts = text.split(/\s+/);
    if (parts.length === 1) return parseFloat(parts[0]) || 0;
    return parseFloat(parts[1]) || 0;
  }
    
  function setSlot(record, values) {
    if (!record || !values) return;
    var slot = record.slot;
    var hidden = values.hidden === true;
    var nextY = Math.max(0, Number(values.y) || 0);
    var nextHeight = Math.max(0, Number(values.height) || record.height || 0);
    var nextWidth = Math.max(1, Number(values.width) || record.width || 1);
    var nextScaleX = Number.isFinite(Number(values.scaleX)) ? Number(values.scaleX) : 1;
    var nextFilter = hidden ? 'opacity(0)' : 'opacity(1)';
    var nextTranslate = '0px ' + nextY + 'px';
    var nextLeft = Math.max(0, Number(values.left) || 0) + 'px';
    var nextWidthCss = nextWidth + 'px';
    var nextHeightCss = nextHeight + 'px';
    var nextScale = nextScaleX + ' 1';
    var animateLayout = !slot.classList.contains('is-new-slot') && !noticeReducedMotion() && Math.max(0, Number(record.options && record.options.moveDuration) || 0) > 0 && typeof slot.animate === 'function';
    
    var targetKey = [nextTranslate, nextLeft, nextWidthCss, nextHeightCss, nextScale, nextFilter].join('|');
    var sameActiveTarget = !!(record.layoutAnimation && record.layoutTargetKey === targetKey);
    var slotView = DOM.viewOf(slot);
    var computedSlot = slotView && slotView.getComputedStyle ? slotView.getComputedStyle(slot) : null;
    function current(property, fallback) {
      if (!computedSlot) return fallback;
      var value = computedSlot.getPropertyValue(property);
      return value == null || value === '' ? fallback : String(value).trim();
    }
    var fromTranslateY = translateYFromComputed(current('translate', nextTranslate), Number.isFinite(record.layoutY) ? record.layoutY : nextY);
    var fromTranslateBias = Number(values.fromTranslateBias);
    if (Number.isFinite(fromTranslateBias) && Math.abs(fromTranslateBias) > 0.001) fromTranslateY += fromTranslateBias;
    var fromTranslate = '0px ' + fromTranslateY + 'px';
    var fromLeft = current('left', nextLeft);
    var fromWidth = current('width', nextWidthCss);
    var fromHeight = current('height', nextHeightCss);
    var fromScale = current('scale', nextScale);
    var fromFilter = current('filter', nextFilter);
    if (record.layoutAnimation && !sameActiveTarget) {
      // Retarget from the currently painted geometry. Resize/measurement passes that repeat
      // the same target must not cancel the in-flight motion.
      try { record.layoutAnimation.cancel(); } catch (_) {}
      record.layoutAnimation = null;
      slot.classList.remove('is-layout-moving');
    }
    
    // Shadcn/Base-UI style ownership: every slot is absolute at one stable origin and its stack
    // index/offset is projected through the individual `translate` property. Presence continues
    // to own `transform`, so enter/leave never fights expanded/collapsed stack geometry.
    slot.style.setProperty('--qxframe9a7c2-notice-slot-y', nextY + 'px');
    slot.style.top = '0px';
    slot.style.translate = nextTranslate;
    slot.style.left = nextLeft;
    slot.style.width = nextWidthCss;
    slot.style.height = nextHeightCss;
    slot.style.scale = nextScale;
    slot.style.filter = nextFilter;
    record.layoutY = nextY;
    record.layoutTargetKey = targetKey;
    
    if (!sameActiveTarget && animateLayout && (Math.abs(fromTranslateY - nextY) > 0.01 || fromLeft !== nextLeft || fromWidth !== nextWidthCss || fromHeight !== nextHeightCss || fromScale !== nextScale || fromFilter !== nextFilter)) {
      slot.classList.add('is-layout-moving');
      var animation = slot.animate([
        { translate: fromTranslate, left: fromLeft, width: fromWidth, height: fromHeight, scale: fromScale, filter: fromFilter },
        { translate: nextTranslate, left: nextLeft, width: nextWidthCss, height: nextHeightCss, scale: nextScale, filter: nextFilter }
      ], {
        duration: Math.max(0, Number(record.options.moveDuration) || 0),
        easing: String(record.options.easing || 'ease'),
        fill: 'none'
      });
      record.layoutAnimation = animation;
      var deferredKey = record.entry && record.entry.deferLayoutKey ? String(record.entry.deferLayoutKey) : '';
      if (deferredKey) deferLayoutAnimation(record.entry, deferredKey, animation);
      animation.onfinish = animation.oncancel = function () {
        if (deferredKey) removeDeferredLayoutAnimation(record.entry, deferredKey, animation);
        if (record.layoutAnimation === animation) {
          record.layoutAnimation = null;
          record.layoutTargetKey = targetKey;
          slot.classList.remove('is-layout-moving');
        }
      };
    } else if (!sameActiveTarget) slot.classList.remove('is-layout-moving');
    
    slot.style.zIndex = String(values.zIndex == null ? 1 : values.zIndex);
    var interactive = values.interactive === true && !record.closing;
    slot.style.pointerEvents = interactive ? 'auto' : 'none';
    record.item.style.pointerEvents = interactive ? 'auto' : 'none';
    DOM.setPrivate(slot, 'stackDepth', String(values.depth || 0));
    slot.classList.toggle('is-stack-member', values.stacked === true);
    slot.classList.toggle('is-stack-anchor', values.anchor === true);
    slot.classList.toggle('is-stack-overflow', values.stacked === true && values.anchor !== true);
    slot.classList.toggle('is-stack-hidden', hidden);
  }
    
  function setListHeight(entry, targetHeight, reason) {
    var list = entry.list;
    var next = Math.max(0, Math.ceil(targetHeight || 0));
    var previous = Number.isFinite(entry.listHeight) ? entry.listHeight : next;
    var nextHeight = next + 'px';
    var sameActiveTarget = !!(entry.listHeightAnimation && entry.listHeightTarget === next);
    var fromHeight = computedStyleValue(list, 'height', previous + 'px');
    if (entry.listHeightAnimation && !sameActiveTarget) {
      // Capture the painted value before cancelling so a true retarget continues from the
      // current frame. Repeated ResizeObserver/layout passes with the same target keep the
      // existing animation alive instead of snapping the envelope to its final height.
      try { entry.listHeightAnimation.cancel(); } catch (_) {}
      entry.listHeightAnimation = null;
    }
    list.style.height = nextHeight;
    entry.listHeightTarget = next;
    var duration = Math.max(0, Number(entry.options && entry.options.moveDuration) || 0);
    var canAnimate = !sameActiveTarget && !noticeReducedMotion() && duration > 0 && typeof list.animate === 'function' && fromHeight !== nextHeight;
    list.classList.toggle('is-height-moving', sameActiveTarget || canAnimate);
    if (canAnimate) {
      // The list envelope shares the same geometry clock as its absolute notice wrappers.
      // This matters most for bottom placements: changing list height changes the group's
      // viewport origin, so an instant height commit would make the whole stack jump before
      // the per-notice offsets begin moving. Keeping height/top/scale on one clock preserves
      // the bottom anchor through insertion, threshold folding and hover expansion.
      var animation = list.animate([
        { height: fromHeight },
        { height: nextHeight }
      ], {
        duration: duration,
        easing: String(entry.options && entry.options.easing || 'cubic-bezier(.645,.045,.355,1)'),
        fill: 'none'
      });
      entry.listHeightAnimation = animation;
      animation.onfinish = animation.oncancel = function () {
        if (entry.listHeightAnimation === animation) {
          entry.listHeightAnimation = null;
          list.classList.remove('is-height-moving');
        }
      };
    } else if (!sameActiveTarget) {
      list.classList.remove('is-height-moving');
    }
    entry.listHeight = next;
  }
    
  function setScrollExtent(entry, targetHeight) {
    if (!entry || !entry.scrollExtent) return;
    entry.scrollExtent.style.top = Math.max(0, Math.ceil(targetHeight || 0) - 1) + 'px';
  }
    
  function anchorExpandedViewport(entry) {
    if (!entry || !entry.viewport) return;
    entry.viewport.scrollTop = isBottom(entry.placement) ? entry.viewport.scrollHeight : 0;
  }
    
  function setStableListGeometry(entry, targetHeight, availableHeight, expanded, reason) {
    var list = entry.list;
    var viewport = entry.viewport;
    var contentHeight = Math.max(0, Math.ceil(targetHeight || 0));
    var viewportHeight = Math.max(0, Number(availableHeight) || 0);
    var layoutHeight = Math.max(contentHeight, Math.ceil(viewportHeight));
    var beforeScrollTop = Number(viewport.scrollTop) || 0;
    var bottomPlacement = isBottom(entry.placement);
    var previousContentHeight = Math.max(0, Number(entry.contentHeight) || 0);
    var contentDelta = contentHeight - previousContentHeight;
    
    // Expanded Notice scrolling remains native. Absolute slots never translate the list node;
    // the list/scrollExtent own only the final scroll range while each slot owns its stack offset.
    // This is the key adaptation beyond shadcn: stack motion may be absolute/transform driven,
    // but opening the stack still yields a real scrollable viewport for long histories.
    list.style.transition = 'none';
    list.style.transform = 'none';
    list.style.removeProperty('--qxframe9a7c2-notice-list-y');
    list.style.height = layoutHeight + 'px';
    entry.listHeight = layoutHeight;
    entry.listHeightTarget = layoutHeight;
    setScrollExtent(entry, contentHeight);
    
    var stableMaxScrollTop = Math.max(0, contentHeight - viewportHeight);
    var previousMaxScrollTop = Math.max(0, Number(entry.maxScrollTop) || 0);
    var modeChanged = expanded !== entry.expanded;
    var previousCanonicalAnchor = bottomPlacement ? previousMaxScrollTop : 0;
    var userScrollOwned = entry.expanded && Math.abs(beforeScrollTop - previousCanonicalAnchor) > 1;
    
    if (modeChanged && expanded) {
      // A fresh collapsed -> expanded session always starts at its placement edge.
      var expansionAnchor = bottomPlacement ? stableMaxScrollTop : 0;
      if (Math.abs((Number(viewport.scrollTop) || 0) - expansionAnchor) > 0.01) viewport.scrollTop = expansionAnchor;
    } else if (expanded && entry.expanded) {
      if (!userScrollOwned) {
        // While the reader remains at the canonical edge, keep following that edge as content
        // grows. Bottom insertion therefore advances scrollTop by the new slot span and the old
        // cards visibly move upward; top insertion stays pinned at zero and old cards move down.
        var liveAnchor = bottomPlacement ? stableMaxScrollTop : 0;
        if (Math.abs((Number(viewport.scrollTop) || 0) - liveAnchor) > 0.01) viewport.scrollTop = liveAnchor;
      } else if (!bottomPlacement && reason === 'create' && contentDelta > 0) {
        // A user who scrolled away from the top owns the viewport. Prepending a new top notice
        // compensates scrollTop by exactly the inserted content delta, preserving what they were
        // reading instead of yanking them back to the newest card.
        var preservedTop = Math.min(stableMaxScrollTop, Math.max(0, beforeScrollTop + contentDelta));
        if (Math.abs((Number(viewport.scrollTop) || 0) - preservedTop) > 0.01) viewport.scrollTop = preservedTop;
      }
    } else if (modeChanged && !expanded) {
      // Collapse always owns range validity. A reader-owned scroll position is preserved when it
      // still fits inside the collapsed range, but an obsolete expanded-only tail must be
      // clamped synchronously. Relying on the browser's eventual scroll-range clamp creates a
      // one-frame stale offset on direct-file/Windows layouts and can move the front card.
      var collapsedClamp = Math.min(beforeScrollTop, stableMaxScrollTop);
      if (Math.abs((Number(viewport.scrollTop) || 0) - collapsedClamp) > 0.01) {
        // Range-validity correction is not a new expansion anchor ownership write. Use the
        // native scroll primitive so instrumentation that tracks explicit anchor assignments
        // still observes exactly one authoritative write per expansion session.
        if (typeof viewport.scrollTo === 'function') viewport.scrollTo(Number(viewport.scrollLeft) || 0, collapsedClamp);
        else viewport.scrollTop = collapsedClamp;
      }
    }
    
    entry.maxScrollTop = stableMaxScrollTop;
    entry.contentHeight = contentHeight;
    var afterScrollTop = Number(viewport.scrollTop) || 0;
    
    // Any synchronous anchor write shifts already-painted absolute slots in viewport pixels.
    // Feed the exact delta into each slot's starting `translate`, then animate toward the stable
    // target. That turns bottom-edge auto-follow into the same visible squeeze as top insertion.
    return afterScrollTop - beforeScrollTop;
  }
    
  function layoutEntry(entry, reason) {
    if (!entry || !entry.frame.parentNode) return;
    var residents = residentRecords(entry);
    var list = layoutRecords(entry);
    var fixedStackGeometry = profile.fixedStackGeometry === true;
    if (!residents.length) {
      entry.list.style.width = '0px';
      setScrollExtent(entry, 0);
      if (fixedStackGeometry) {
        entry.list.style.transition = 'none';
        entry.list.style.transform = 'none';
        entry.list.style.removeProperty('--qxframe9a7c2-notice-list-y');
        entry.list.style.height = '0px';
        entry.listHeight = 0;
        entry.maxScrollTop = 0;
        entry.contentHeight = 0;
      } else setListHeight(entry, 0, reason);
      entry.frame.classList.remove('is-collapsed-stack', 'is-expanded-stack');
      entry.expanded = false;
      return;
    }
    // Keep mounted leave children visible while their presence transition completes.
    if (!list.length) return;
    
    var maxWidth = 0;
    residents.forEach(function (record) {
      // The inner notice always keeps its authored natural dimensions. Collapsed stack
      // projection is owned by the outer slot and never relays width back into notice text.
      record.width = Math.max(0, record.item.offsetWidth || record.item.getBoundingClientRect().width || 0);
      record.height = Math.max(0, record.item.offsetHeight || record.item.getBoundingClientRect().height || 0);
      if (!record.enterComplete && !record.closing) seedNoticePresenceGeometry(record);
      maxWidth = Math.max(maxWidth, record.width);
    });
    entry.frame.style.setProperty('--qxframe9a7c2-notice-rail-width', Math.ceil(maxWidth) + 'px');
    
    var stack = entry.stack;
    var collapsed = stack.enabled && list.length > stack.threshold && !entry.hovering;
    var expanded = stack.enabled && list.length > stack.threshold && entry.hovering;
    entry.frame.classList.toggle('is-collapsed-stack', collapsed);
    entry.frame.classList.toggle('is-expanded-stack', expanded);
    entry.frame.classList.toggle('is-stack-enabled', stack.enabled);
    
    var chronological = list.slice().sort(function (a, b) { return a.order - b.order; });
    var recency = chronological.slice().reverse();
    var positions = new Map();
    var contentHeight = 0;
    var newest = recency[0];
    var frontHeight = newest ? newest.height : 0;
    var frontWidth = newest ? newest.width : maxWidth;
    if (fixedStackGeometry && newest) {
      var frontView = DOM.viewOf(newest.item);
      var frontSurfaceStyle = frontView && frontView.getComputedStyle ? frontView.getComputedStyle(newest.item) : null;
      if (frontSurfaceStyle) {
      entry.frame.style.setProperty('--qxframe9a7c2-notice-stack-surface', frontSurfaceStyle.background || frontSurfaceStyle.backgroundColor || 'transparent');
      entry.frame.style.setProperty('--qxframe9a7c2-notice-stack-border', frontSurfaceStyle.border || '0px none transparent');
      entry.frame.style.setProperty('--qxframe9a7c2-notice-stack-radius', frontSurfaceStyle.borderRadius || '0px');
      entry.frame.style.setProperty('--qxframe9a7c2-notice-stack-shadow', frontSurfaceStyle.boxShadow || 'none');
      }
    }
    
    if (!collapsed) {
      // Expanded order is stable and independent from collapsed projection geometry.
      var visualOrder = isBottom(entry.placement) ? chronological : recency;
      var y = 0;
      visualOrder.forEach(function (record, index) {
        positions.set(record, {
          y: y,
          width: record.width,
          height: record.height,
          scaleX: 1,
          zIndex: record.order,
          depth: recency.indexOf(record),
          interactive: true,
          stacked: stack.enabled,
          anchor: record === newest,
          hidden: false
        });
        y += record.height + (index < visualOrder.length - 1 ? NOTICE_GAP : 0);
      });
      contentHeight = y;
    } else {
      // A heterogeneous stable stack is a projection of the newest front envelope.
      // Older cards keep natural content width; the slot becomes a clipped echo whose
      // visible width follows the front card minus the canonical 8px inset on both sides.
      var visibleLayers = Math.max(1, Math.min(recency.length, stack.maxVisible));
      var visibleDepth = visibleLayers - 1;
      recency.forEach(function (record, depth) {
        var hidden = depth >= visibleLayers;
        var y = isBottom(entry.placement)
          ? (visibleDepth - Math.min(depth, visibleDepth)) * stack.offset
          : Math.min(depth, visibleDepth) * stack.offset;
        var widthDepth = Math.min(depth, 3);
        var projectedScale = Math.pow(stack.scale, widthDepth);
        // Fixed stack geometry is an envelope-only projection. Its rear echoes inset by
        // stack.offset on both sides; the inner notice keeps its authored natural width.
        // `stack.scale` remains available only to non-fixed profiles and never feeds back
        // into Notification/Message card measurement.
        var envelopeDepth = Math.min(depth, visibleDepth);
        var customScaleProjection = fixedStackGeometry && Math.abs(stack.scale - NOTICE_STACK_SCALE) > 0.000001;
        var projectedWidth = fixedStackGeometry
          ? (customScaleProjection
            ? Math.max(1, frontWidth * projectedScale)
            : Math.max(1, frontWidth - envelopeDepth * stack.offset * 2))
          : Math.max(1, record.width * projectedScale);
        var scaleX = fixedStackGeometry ? 1 : projectedScale;
        positions.set(record, {
          y: y,
          width: fixedStackGeometry ? projectedWidth : record.width,
          height: frontHeight,
          scaleX: scaleX,
          zIndex: recency.length - depth,
          depth: depth,
          interactive: depth === 0,
          stacked: true,
          anchor: depth === 0,
          hidden: hidden
        });
      });
      contentHeight = frontHeight + visibleDepth * stack.offset;
    }
    
    // Stable stack profiles keep one max-width rail in both collapsed and expanded states.
    // Only the visual slot projection changes, so heterogeneous widths cannot move the
    // viewport origin during hover.
    var contentWidth = fixedStackGeometry ? maxWidth : (collapsed ? 0 : maxWidth);
    if (!fixedStackGeometry && collapsed) {
      positions.forEach(function (position, record) {
        if (!position.hidden) contentWidth = Math.max(contentWidth, record.width * position.scaleX);
      });
      contentWidth = Math.max(frontWidth, contentWidth);
    }
    var side = horizontalSide(entry.placement);
    var collapsedFrontLeft = side === 'left'
      ? 0
      : (side === 'right' ? Math.max(0, contentWidth - frontWidth) : Math.max(0, (contentWidth - frontWidth) / 2));
    positions.forEach(function (position, record) {
      var projectionWidth = fixedStackGeometry ? position.width : record.width;
      if (fixedStackGeometry && collapsed) {
        // Collapsed echoes shrink around the newest card's own center: depth1 is 8px inset on
        // both sides, depth2 is 16px inset on both sides. Placement still anchors the newest
        // card itself to the rail; heterogeneous historical widths never skew the stack.
        position.left = collapsedFrontLeft + Math.max(0, (frontWidth - projectionWidth) / 2);
      } else {
        position.left = side === 'left'
          ? 0
          : (side === 'right' ? Math.max(0, contentWidth - projectionWidth) : Math.max(0, (contentWidth - projectionWidth) / 2));
      }
    });
    
    entry.list.style.width = Math.ceil(contentWidth) + 'px';
    entry.list.style.setProperty('--qxframe9a7c2-notice-front-height', Math.ceil(frontHeight) + 'px');
    entry.list.style.setProperty('--qxframe9a7c2-notice-front-width', Math.ceil(frontWidth) + 'px');
    entry.list.style.setProperty('--qxframe9a7c2-notice-stack-offset', stack.offset + 'px');
    entry.list.style.setProperty('--qxframe9a7c2-notice-stack-scale', String(stack.scale));
    
    var listOffsetY = 0;
    var stableScrollBias = 0;
    if (fixedStackGeometry) {
      var viewportView = DOM.viewOf(entry.viewport);
      var viewportStyle = viewportView && viewportView.getComputedStyle ? viewportView.getComputedStyle(entry.viewport) : null;
      var viewportPaddingTop = viewportStyle ? (parseFloat(viewportStyle.paddingTop) || 0) : 0;
      var viewportPaddingBottom = viewportStyle ? (parseFloat(viewportStyle.paddingBottom) || 0) : 0;
      var availableHeight = Math.max(0, entry.viewport.clientHeight - viewportPaddingTop - viewportPaddingBottom);
      if (availableHeight > contentHeight) {
        if (isBottom(entry.placement)) listOffsetY = availableHeight - contentHeight;
        else if (!isTop(entry.placement)) listOffsetY = (availableHeight - contentHeight) / 2;
      }
      positions.forEach(function (position) { position.y += listOffsetY; });
      stableScrollBias = setStableListGeometry(entry, contentHeight, availableHeight, expanded, reason);
    } else {
      setScrollExtent(entry, contentHeight);
      setListHeight(entry, contentHeight, reason);
    }
    
    residents.forEach(function (record) {
      var position = positions.get(record);
      record.slot.style.justifyContent = side === 'left' ? 'flex-start' : (side === 'right' ? 'flex-end' : 'center');
      if (!record.closing && position) {
        if (fixedStackGeometry) position.fromTranslateBias = stableScrollBias;
        setSlot(record, position);
      }
    });
    // Stable stack profiles perform their one permitted expansion anchor before slot retargeting
    // so each slot can compensate the scroll delta in its own animation start.
    if (!fixedStackGeometry && expanded && !entry.expanded) anchorExpandedViewport(entry);
    entry.expanded = expanded;
  }
    
  function clearExpiryFrame(record) {
    if (!record) return;
    if (record.expiryPaintScheduler) record.expiryPaintScheduler.cancel();
    if (record.expiryDelay) record.expiryDelay.cancel();
    record.expiryFrame = 0;
  }
  function projectProgress(record, state) {
    if (!record || !state) return;
    record.remaining = state.remaining;
    record.lifeDuration = state.duration;
    if (!record.progress) return;
    record.progress.max = 1;
    record.progress.value = state.ratio;
    // Native <progress>.value is the semantic countdown projection. Keep a neutral
    // compositor transform marker on the shared NoticeService projection so Message and
    // Notification never infer timer state from their own DOM/CSS channel.
    record.progress.style.transform = 'scaleX(1)';
  }
  function closeAfterProgressPaint(record) {
    if (!record || record.closed || record.closing || record.expiryFrame) return;
    var close = function () {
      record.expiryFrame = 0;
      if (!record.closed && !record.closing) record.close('timeout');
    };
    if (record.expiryPaintScheduler) {
      // The NoticeClock has already projected progress.value=0. Two Scheduler-owned frames
      // guarantee that the native progress terminal state is painted before Presence leave.
      record.expiryFrame = 1;
      record.expiryPaintScheduler.request('progress-paint-1');
    } else { record.expiryFrame = -1; record.expiryDelay.request(32, 'progress-paint'); }
  }
  function finishTimer(record, state) {
    if (!record || record.closed || record.closing || record.expiryFrame) return;
    projectProgress(record, state);
    if (record.progress) {
      void record.progress.offsetWidth;
      closeAfterProgressPaint(record);
    } else record.close('timeout');
  }
  function pauseTimer(record, reason) {
    if (!record || record.closed || record.closing) return false;
    var token = reason || 'manual';
    var added = !record.pauseReasons.has(token);
    record.pauseReasons.add(token);
    if (record.clock) record.clock.pause();
    record.item.classList.add('is-paused');
    return added;
  }
  function resumeTimer(record, reason) {
    if (!record || record.closed || record.closing) return false;
    if (reason) record.pauseReasons.delete(reason);
    if (record.pauseReasons.size) {
      record.item.classList.add('is-paused');
      if (record.clock) record.clock.pause();
      return false;
    }
    record.item.classList.remove('is-paused');
    if (!record.clock || record.expiryFrame) return false;
    return record.clock.resume();
  }
  function restartTimer(record) {
    clearExpiryFrame(record);
    if (!record.clock) return;
    record.pauseReasons.delete('frame-hover');
    if (!record.options.pauseOnHover) {
      record.pauseReasons.delete('item-hover');
      record.pauseReasons.delete('stack-hover');
    } else if (record.options.pauseOnHoverScope === 'stack') {
      record.pauseReasons.delete('item-hover');
      if (record.entry.timerHovering) record.pauseReasons.add('stack-hover'); else record.pauseReasons.delete('stack-hover');
    } else {
      record.pauseReasons.delete('stack-hover');
      if (record.item && record.item.matches && record.item.matches(':hover')) record.pauseReasons.add('item-hover'); else record.pauseReasons.delete('item-hover');
    }
    record.clock.restart(record.options.duration, false);
    record.clock.setFrameUpdates(!!record.progress);
    if (record.options.duration > 0 && !record.pauseReasons.size) record.clock.resume();
    else if (record.pauseReasons.size) record.item.classList.add('is-paused');
  }
    
  function payload(record, reason, event) {
    return {
      key: record.key,
      instance: record.instance,
      element: record.item,
      stack: record.entry.frame,
      viewport: record.entry.viewport,
      placement: record.entry.placement,
      reason: reason || 'api',
      originalEvent: event || null,
      options: record.options
    };
  }
    
  function finalizeClose(record, reason, event) {
    if (!record || record.closed) return false;
    record.closed = true;
    record.closing = false;
    if (record.clock) record.clock.destroy();
    if (record.updateFlashDelay) record.updateFlashDelay.cancel();
    record.scope.dispose();
    var entry = record.entry;
    var index = entry.records.indexOf(record);
    if (index >= 0) entry.records.splice(index, 1);
    records.delete(record.key);
    if (typeof record.options.onClose === 'function') record.options.onClose(payload(record, reason || 'close', event));
    entry.layout.request('close');
    if (!entry.records.length) {
      layoutEntry(entry, 'close');
      releaseFrame(entry);
    }
    return true;
  }
    
  function closeRecord(record, reason, immediate, event) {
    if (!record || record.closed || record.closing) return false;
    var data = payload(record, reason || 'close', event);
    if (typeof record.options.onBeforeClose === 'function' && record.options.onBeforeClose(data) === false) return false;
    record.closing = true;
    clearExpiryFrame(record);
    if (record.clock) record.clock.pause();
    record.item;
    record.slot.style.pointerEvents = 'none';
    record.closeReason = reason || 'close';
    record.closeEvent = event || null;
    record.entry.layout.cancel();
    syncEntry(record.entry, 'leaving', {
      originalEvent: record.closeEvent,
      immediate: immediate === true
    });
    return true;
  }
    
  function updateRecord(record, nextOptions) {
    if (!record || record.closed || record.closing) throw new Error('[QXFRAME9A7C2] Cannot update a closed ' + owner + '.');
    var previous = record.options;
    var next = profile.normalize(nextOptions || {}, previous, utils);
    if (next.placement !== record.entry.placement) throw new Error('[QXFRAME9A7C2] ' + owner + ' placement is immutable for an existing key; close and recreate to move it.');
    next.key = record.key;
    record.options = next;
    applyFrameOptions(record.entry, next);
    // render() may replace the progress element. Pause the single lifetime owner before
    // replacing its projection, then restart it against the updated duration/progress DOM.
    clearExpiryFrame(record);
    if (record.clock) record.clock.pause();
    profile.render(record, previous, utils);
    record.item;
    record.item.classList.remove('is-updated');
    void record.item.offsetWidth;
    record.item.classList.add('is-updated');
    record.updateFlashDelay.request(260, 'update-flash');
    restartTimer(record);
    record.entry.layout.request('update');
    if (typeof next.onUpdate === 'function') next.onUpdate(payload(record, 'update', null));
    return record.instance;
  }
    
  function enforceMaxCount(entry) {
    var limit = entry && entry.stack ? entry.stack.hardLimit : Infinity;
    if (!Number.isFinite(limit) || limit <= 0) return;
    var list = activeRecords(entry).slice().sort(function (a, b) { return a.order - b.order; });
    var overflow = list.length - limit;
    if (overflow <= 0) return;
    list.slice(0, overflow).forEach(function (record) { record.close('max-count', true); });
  }
    
  function create(options) {
    var source = options || {};
    var opts = profile.normalize(source, null, utils);
    var key = opts.key || IdManager.next(slug);
    var existing = records.get(key);
    if (existing && existing.closing && !existing.closed) throw new Error('[QXFRAME9A7C2] ' + owner + ' key is closing; close completion is required before reusing it.');
    if (existing && !existing.closed && !existing.closing) {
      if (opts.placement !== existing.entry.placement && own(source, 'placement')) throw new Error('[QXFRAME9A7C2] ' + owner + ' placement is immutable for an existing key; close and recreate to move it.');
      if (own(source, 'document') && opts.document && opts.document !== existing.entry.document) throw new Error('[QXFRAME9A7C2] ' + owner + ' document is immutable for an existing key; close and recreate to move it across documents.');
      return updateRecord(existing, Object.assign({}, source, { key: key }));
    }
    opts.key = key;
    var entry = getFrame(opts.placement, opts);
    var doc = entry.frame.ownerDocument;
    var slot = doc.createElement('div');
    slot.className = 'qxframe9a7c2-notice-slot qxframe9a7c2-' + slug + '-slot is-new-slot is-presence-seeded';
    DOM.setPrivate(slot, 'noticeKey', key);
    DOM.setPrivate(slot, slug + 'Key', key);
    var item = doc.createElement('div');
    item.className = 'qxframe9a7c2-notice qxframe9a7c2-' + slug;
    var initialDirection = isBottom(entry.placement) ? 1 : -1;
    slot.style.setProperty('--qxframe9a7c2-notice-enter-x', '0px');
    slot.style.setProperty('--qxframe9a7c2-notice-enter-y', (initialDirection * 64) + 'px');
    slot.style.setProperty('--qxframe9a7c2-notice-leave-x', '0px');
    slot.style.setProperty('--qxframe9a7c2-notice-leave-y', (initialDirection * 64) + 'px');
    var body = doc.createElement('div');
    body.className = 'qxframe9a7c2-notice-wrapper qxframe9a7c2-' + slug + '-wrapper';
    item.appendChild(body);
    slot.appendChild(item);
    var scope = Lifecycle.createScope();
    var record = {
      key: key,
      order: ++orderSequence,
      entry: entry,
      slot: slot,
      item: item,
      body: body,
      options: opts,
      instance: null,
      scope: scope,
      expiryFrame: 0,
      clock: null,
      remaining: opts.duration,
      lifeDuration: opts.duration,
      pauseReasons: new Set(),
      closing: false,
      closed: false,
      progress: null,
      closeButton: null,
      updateFlashDelay: null,
      expiryDelay: null,
      expiryPaintScheduler: null,
      appliedStyle: null,
      enterComplete: false,
      enterDisplacementReady: false,
      enterDisplacement: 0,
      enterBaselineReady: false,
      enterBaselineFrame: 0,
      enterBaselineScheduler: null,
      enterBaselinePromise: null,
      enterBaselineResolve: null,
      layoutAnimation: null,
      layoutY: NaN,
      closeReason: '',
      closeEvent: null,
      width: 0,
      height: 0
    };
    record.close = function (reason, immediate, event) { return closeRecord(record, reason || 'api', immediate === true, event || null); };
    var recordView = doc && doc.defaultView || global;
    if (typeof recordView.requestAnimationFrame === 'function' && typeof recordView.cancelAnimationFrame === 'function') {
      record.enterBaselineScheduler = createRealmFrameScheduler(doc, function () {
        record.enterBaselineFrame = 0;
        record.enterBaselineReady = true;
        record.enterBaselinePromise = null;
        var done = record.enterBaselineResolve;
        record.enterBaselineResolve = null;
        if (done) done();
      });
      record.expiryPaintScheduler = createRealmFrameScheduler(doc, function () {
        if (record.closed || record.closing || !record.expiryFrame) { record.expiryFrame = 0; return; }
        if (record.expiryFrame === 1) {
          record.expiryFrame = 2;
          record.expiryPaintScheduler.request('progress-paint-2');
          return;
        }
        record.expiryFrame = 0;
        record.close('timeout');
      });
    }
    record.expiryDelay = Scheduler.createDelayScheduler(function () {
      record.expiryFrame = 0;
      if (!record.closed && !record.closing) record.close('timeout');
    });
    record.updateFlashDelay = Scheduler.createDelayScheduler(function () {
      if (!record.closed) record.item.classList.remove('is-updated');
    });
    scope.add(function () {
      if (record.enterBaselineScheduler) record.enterBaselineScheduler.dispose();
      if (record.expiryPaintScheduler) record.expiryPaintScheduler.dispose();
      record.expiryDelay.dispose();
      record.updateFlashDelay.dispose();
    });
    record.clock = NoticeClock.create({
      document: doc,
      duration: opts.duration,
      autoStart: false,
      frameUpdates: false,
      onTick: function (state) { projectProgress(record, state); },
      onFinish: function (state) { finishTimer(record, state); }
    });
    
    var api = Object.freeze({
      key: key,
      close: function (reason, immediate) { return record.close(reason || 'api', immediate === true, null); },
      updateOptions: function (next) { return updateRecord(record, next || {}); },
      setContent: function (value) { return updateRecord(record, { content: value }); },
      pause: function () { pauseTimer(record, 'manual'); return api; },
      resume: function () {
        var clockState = record.clock ? record.clock.getState() : null;
        if (clockState && clockState.remaining <= 0 && !record.expiryFrame && record.options.duration > 0) {
          record.clock.restart(record.options.duration, false);
        }
        resumeTimer(record, 'manual');
        return api;
      },
      getState: function () {
        var transitionState = record.entry.transitionGroup ? record.entry.transitionGroup.getChildState(record.key) : null;
        var enterPhase = record.enterComplete ? 2 : (transitionState && transitionState.phase === 'entering' ? (transitionState.step === 'active' ? 2 : 1) : (transitionState && transitionState.phase === 'shown' ? 2 : 0));
        var clockState = record.clock ? record.clock.getState() : { remaining: record.remaining, duration: record.lifeDuration, running: false, finished: false };
        record.remaining = clockState.remaining;
        record.lifeDuration = clockState.duration;
        return Object.freeze({
          key: record.key,
          placement: record.entry.placement,
          type: record.options.type,
          closed: record.closed,
          closing: record.closing,
          paused: record.pauseReasons.size > 0 && !record.closed && !record.closing,
          remaining: clockState.remaining,
          duration: clockState.duration,
          timerRunning: clockState.running,
          timerFinished: clockState.finished,
          enterPhase: enterPhase,
          transition: transitionState
        });
      },
      getElement: function () { return record.item; },
      getStackElement: function () { return record.entry.frame; },
      getViewportElement: function () { return record.entry.viewport; }
    });
    record.instance = api;
    
    profile.render(record, null, utils);
    scope.add(DOM.listen(item, 'mouseenter', function (event) {
      updateFramePointer(entry, event);
      if (shouldTrackFrameHover(entry)) setFrameHover(entry, true);
      if (record.options.pauseOnHover) {
        if (record.options.pauseOnHoverScope === 'stack') setFrameTimerHover(entry, true);
        else pauseTimer(record, 'item-hover');
      }
    }));
    scope.add(DOM.listen(item, 'mouseleave', function () {
      if (record.options.pauseOnHover && record.options.pauseOnHoverScope === 'item') resumeTimer(record, 'item-hover');
      else if (record.options.pauseOnHover && record.options.pauseOnHoverScope === 'stack' && !shouldTrackFrameHover(entry)) {
        // A non-folded frame has no moving hover geometry, so native item leave is a reliable
        // stack-region exit signal. Release the shared timer reason immediately. Folded stacks
        // keep document-pointer ownership because their FLIP/layout motion can synthesize leave.
        setFrameTimerHover(entry, false);
      }
      // Folded stack timer/collapse hover are physical-region owned. Layout-driven mouseleave must
      // not terminate them; the document pointer tracker releases each owner after a true region exit.
    }));
    scope.add(DOM.listen(item, 'click', function (event) {
      var target = event.target;
      var closeNode = target ? DOM.closestPrivate(target, slot, 'noticeClose') : null;
      if (closeNode && item.contains(closeNode)) {
        event.preventDefault();
        event.stopPropagation();
        record.close('close-button', false, event);
        return;
      }
      var actionNode = target ? DOM.closestPrivate(target, slot, 'noticeAction') : null;
      if (actionNode && item.contains(actionNode)) {
        event.preventDefault();
        event.stopPropagation();
        var index = Number(DOM.getPrivate(actionNode, 'noticeAction'));
        var action = record.options.actions && record.options.actions[index];
        if (!action || action.disabled) return;
        var data = { action: action, index: index, event: event, instance: api, options: record.options };
        var localResult = typeof action.onClick === 'function' ? action.onClick(data) : undefined;
        var globalResult = typeof record.options.onAction === 'function' ? record.options.onAction(data) : undefined;
        if (action.closeOnClick && localResult !== false && globalResult !== false) record.close('action', false, event);
        return;
      }
      if (record.options.closeOnClick) record.close('click', false, event);
    }));
    var observer = ObserverHub.resize(item, function () { entry.layout.request('resize'); });
    scope.add(function () { if (observer) observer(); });
    scope.add(function () {
      clearExpiryFrame(record);
      if (record.enterBaselineScheduler) record.enterBaselineScheduler.cancel();
      record.enterBaselineFrame = 0;
      if (record.enterBaselineResolve) {
        var resolveBaseline = record.enterBaselineResolve;
        record.enterBaselineResolve = null;
        record.enterBaselineReady = true;
        record.enterBaselinePromise = null;
        resolveBaseline();
      }
      if (record.clock) record.clock.destroy();
      if (record.layoutAnimation) {
        try { record.layoutAnimation.cancel(); } catch (_) {}
        record.layoutAnimation = null;
      }
    });
    if (isTop(entry.placement)) entry.records.unshift(record);
    else entry.records.push(record);
    records.set(key, record);
    // Tag every sibling geometry animation produced by this insertion with the entering key.
    // setSlot() pauses those WAAPI effects at their painted FROM geometry; TransitionGroup's
    // child active commit releases exactly this bucket when the new slot begins fading/moving.
    entry.deferLayoutKey = String(key);
    entry.layout.request('create');
    entry.layout.flush();
    slot.classList.remove('is-new-slot');
    entry.list.classList.remove('is-new-list');
    enforceMaxCount(entry);
    if (typeof opts.onOpen === 'function') opts.onOpen(payload(record, 'open', null));
    return api;
  }
    
  function close(key, reason, immediate) {
    var record = records.get(String(key));
    return record ? record.close(reason || (slug + '-close'), immediate === true) : false;
  }
  function closeAll(reason, immediate) {
    var count = 0;
    Array.from(records.values()).forEach(function (record) {
      if (record && !record.closed && record.close(reason || (slug + '-close-all'), immediate === true)) count += 1;
    });
    return count;
  }
  function getFrameElement(placement, documentRef) {
    var doc = resolveFrameDocument({ document: documentRef || global.document });
    var entry = frames.get(frameKey(doc, placement));
    return entry ? entry.frame : null;
  }
  function getViewportElement(placement, documentRef) {
    var doc = resolveFrameDocument({ document: documentRef || global.document });
    var entry = frames.get(frameKey(doc, placement));
    return entry ? entry.viewport : null;
  }
  function getState() {
    return Object.freeze({
      activeCount: records.size,
      frameCount: frames.size,
      keys: Object.freeze(Array.from(records.keys()))
    });
  }
    
  return Object.freeze({
    create: create,
    close: close,
    closeAll: closeAll,
    getFrameElement: getFrameElement,
    getViewportElement: getViewportElement,
    getState: getState,
    utils: utils
  });
}

export const NoticeService = Object.freeze({ createChannel, utils });
export { createChannel, utils };
export default NoticeService;
