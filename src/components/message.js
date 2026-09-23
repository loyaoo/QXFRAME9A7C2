import { NoticeService } from '../core/noticeService.js';
import { NoticePreset } from '../core/noticePreset.js';

var U = NoticeService.utils;
var TYPES = Object.freeze(['info', 'success', 'warning', 'error', 'loading']);
var PLACEMENTS = Object.freeze(['top', 'bottom']);
var REMOVED_OPTIONS = Object.freeze(['target', 'el', 'mount', 'message', 'text', 'position', 'timeout', 'appendTo', 'collapseOverflow', 'expandOnHover', 'newestOnTop', 'expandedMaxHeight']);
var NOTIFICATION_ONLY_OPTIONS = Object.freeze(['title', 'actions', 'onAction']);
var SUPPORTED_OPTIONS = Object.freeze([
  'key', 'content', 'type', 'icon', 'placement', 'duration', 'closable', 'closeOnClick', 'pauseOnHover', 'pauseOnHoverScope',
  'maxCount', 'stack', 'showProgress', 'className', 'style',
  'stackClassName', 'stackStyle', 'enterDuration', 'leaveDuration', 'moveDuration', 'easing',
  'zIndex', 'document', 'onOpen', 'onBeforeClose', 'onClose', 'onUpdate'
]);
var CALLBACKS = Object.freeze(['onOpen', 'onBeforeClose', 'onClose', 'onUpdate']);
    
var DEFAULTS = {
  placement: 'top', type: 'info', duration: 3000, closable: false, closeOnClick: false,
  pauseOnHover: true, pauseOnHoverScope: 'stack', maxCount: 0, stack: { threshold: 3, offset: 8, scale: 0.95 },
  showProgress: false, enterDuration: 500, leaveDuration: 220, moveDuration: 500,
  easing: 'cubic-bezier(.22,1,.36,1)', zIndex: null
};
var preset = NoticePreset.create({ owner:'Message', allowedConfigure:['placement','type','duration','closable','closeOnClick','pauseOnHover','pauseOnHoverScope','maxCount','stack','showProgress','enterDuration','leaveDuration','moveDuration','easing','zIndex'] });
    
function rejectUnsupported(input) {
  Object.keys(input || {}).forEach(function (key) {
    if (REMOVED_OPTIONS.indexOf(key) >= 0) throw new TypeError('[QXFRAME9A7C2] Message removed option "' + key + '" is not supported.');
    if (NOTIFICATION_ONLY_OPTIONS.indexOf(key) >= 0) throw new TypeError('[QXFRAME9A7C2] Message option "' + key + '" belongs to Notification.');
    if (SUPPORTED_OPTIONS.indexOf(key) < 0) throw new TypeError('[QXFRAME9A7C2] Message unsupported option "' + key + '".');
  });
}
    
function normalize(input, previous) {
  var incoming = input || {};
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new TypeError('[QXFRAME9A7C2] Message options must be an object.');
  rejectUnsupported(incoming);
  var source = U.mergeOwn(DEFAULTS, previous, incoming);
  source.key = source.key === undefined || source.key === null || source.key === '' ? '' : String(source.key);
  source.type = U.enumValue(source.type, TYPES, 'info', 'type', 'Message');
  source.placement = U.enumValue(source.placement, PLACEMENTS, 'top', 'placement', 'Message');
  source.duration = U.finite(source.duration, DEFAULTS.duration, 0, 'duration', 'Message');
  source.enterDuration = U.finite(source.enterDuration, DEFAULTS.enterDuration, 0, 'enterDuration', 'Message');
  source.leaveDuration = U.finite(source.leaveDuration, DEFAULTS.leaveDuration, 0, 'leaveDuration', 'Message');
  source.moveDuration = U.finite(source.moveDuration, DEFAULTS.moveDuration, 0, 'moveDuration', 'Message');
  source.maxCount = Math.floor(U.finite(source.maxCount, DEFAULTS.maxCount, 0, 'maxCount', 'Message'));
  source.stack = preset.normalizeStack(source.stack);
  source.zIndex = source.zIndex === undefined || source.zIndex === null || source.zIndex === '' ? null : Math.floor(U.finite(source.zIndex, 0, 0, 'zIndex', 'Message'));
  ['closable', 'closeOnClick', 'pauseOnHover', 'showProgress'].forEach(function (key) {
    source[key] = U.bool(source[key], DEFAULTS[key], key, 'Message');
  });
  source.pauseOnHoverScope = U.enumValue(source.pauseOnHoverScope, ['item', 'stack'], DEFAULTS.pauseOnHoverScope, 'pauseOnHoverScope', 'Message');
  CALLBACKS.forEach(function (key) {
    if (source[key] != null && typeof source[key] !== 'function') throw new TypeError('[QXFRAME9A7C2] Message ' + key + ' must be a function.');
  });
  source.className = source.className == null ? '' : String(source.className);
  source.stackClassName = source.stackClassName == null ? '' : String(source.stackClassName);
  source.easing = source.easing == null || source.easing === '' ? DEFAULTS.easing : String(source.easing);
  source.style = U.styleObject(source.style, 'style', 'Message');
  source.stackStyle = U.styleObject(source.stackStyle, 'stackStyle', 'Message');
  source.actions = [];
  return source;
}
    
function render(record, previous) {
  var context = U.beginRender(record, { className:function (opts) { return ('qxframe9a7c2-notice qxframe9a7c2-message-root is-' + opts.type + (opts.className ? ' ' + opts.className : '')).trim(); } });
  var opts = context.options, wrapper = context.body, doc = context.document;
  while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
  U.appendNoticeIcon(record, wrapper, { className:'qxframe9a7c2-message-icon', sizeClass:'is-md' });
  var section = doc.createElement('div');
  section.className = 'qxframe9a7c2-message-section';
  var content = doc.createElement('div');
  content.className = 'qxframe9a7c2-message-content';
  U.renderValue(content, opts.content, record);
  section.appendChild(content);
  wrapper.appendChild(section);
  U.appendNoticeChrome(record, { closeClass:'qxframe9a7c2-message-close', progressClass:'qxframe9a7c2-notice-progress qxframe9a7c2-message-progress' });
}
    
var channel = NoticeService.createChannel({ name: 'Message', slug: 'message', collapsedVisible: 3, fixedStackGeometry: true, normalize: normalize, render: render });
    
function configure(next) { return preset.configure(DEFAULTS, next, normalize); }
    
function createTyped(type, content, options) {
  if (content && typeof content === 'object' && !Array.isArray(content) && !content.nodeType) {
    throw new TypeError('[QXFRAME9A7C2] Message.' + type + '() accepts (content, options?) only; options-object shorthand was removed.');
  }
  if (options !== undefined && (!options || typeof options !== 'object' || Array.isArray(options) || options.nodeType)) {
    throw new TypeError('[QXFRAME9A7C2] Message.' + type + '() options must be an object.');
  }
  var input = U.mergeOwn(options, { content: content, type: type });
  return channel.create(input);
}

export const Message = Object.freeze({
    definition: Object.freeze({ initializer: false }),
    create: channel.create,
    info: function (value, options) { return createTyped('info', value, options); },
    success: function (value, options) { return createTyped('success', value, options); },
    warning: function (value, options) { return createTyped('warning', value, options); },
    error: function (value, options) { return createTyped('error', value, options); },
    loading: function (value, options) { return createTyped('loading', value, options); },
    close: channel.close,
    closeAll: channel.closeAll,
    configure,
    getFrameElement: channel.getFrameElement,
    getViewportElement: channel.getViewportElement,
    getState: channel.getState,
    placements: PLACEMENTS.slice(),
    types: TYPES.slice()
});
export default Message;
