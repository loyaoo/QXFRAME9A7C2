import { DOM } from '../core/dom.js';
import { NoticeService } from '../core/noticeService.js';
import { FeedbackController } from '../core/feedbackController.js';
import { NoticePreset } from '../core/noticePreset.js';
const U = NoticeService.utils;

var TYPES = Object.freeze(['info', 'success', 'warning', 'error', 'loading']);
var PLACEMENTS = Object.freeze(['top-left', 'top', 'top-right', 'left-center', 'center', 'right-center', 'bottom-left', 'bottom', 'bottom-right']);
var REMOVED_OPTIONS = Object.freeze(['target', 'el', 'mount', 'message', 'description', 'text', 'position', 'timeout', 'appendTo', 'collapseOverflow', 'expandOnHover', 'newestOnTop', 'expandedMaxHeight']);
var SUPPORTED_OPTIONS = Object.freeze([
  'key', 'content', 'title', 'type', 'icon', 'actions', 'placement', 'duration', 'closable', 'closeOnClick',
  'pauseOnHover', 'pauseOnHoverScope', 'maxCount', 'stack', 'showProgress', 'class',
  'style', 'width', 'minWidth', 'maxWidth', 'zIndex', 'document',
  'onOpen', 'onAction', 'onBeforeClose', 'onClose', 'onUpdate'
]);
var CALLBACKS = Object.freeze(['onOpen', 'onAction', 'onBeforeClose', 'onClose', 'onUpdate']);
    
var DEFAULTS = {
  placement: 'top-right', type: 'info', duration: 4500, closable: true, closeOnClick: false,
  pauseOnHover: true, pauseOnHoverScope: 'stack', maxCount: 0, stack: { threshold: 3, offset: 8, scale: 0.95 },
  showProgress: false, zIndex: null
};
var preset = NoticePreset.create({ owner:'Notification', allowedConfigure:['placement','type','duration','closable','closeOnClick','pauseOnHover','pauseOnHoverScope','maxCount','stack','showProgress','zIndex'] });
    
function rejectUnsupported(input) {
  Object.keys(input || {}).forEach(function (key) {
    if (REMOVED_OPTIONS.indexOf(key) >= 0) throw new TypeError('[QXFRAME9A7C2] Notification removed option "' + key + '" is not supported.');
    if (SUPPORTED_OPTIONS.indexOf(key) < 0) throw new TypeError('[QXFRAME9A7C2] Notification unsupported option "' + key + '".');
  });
}
    
function normalize(input, previous) {
  var incoming = input || {};
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) throw new TypeError('[QXFRAME9A7C2] Notification options must be an object.');
  rejectUnsupported(incoming);
  var source = U.mergeOwn(DEFAULTS, previous, incoming);
  source.key = source.key === undefined || source.key === null || source.key === '' ? '' : String(source.key);
  source.type = U.enumValue(source.type, TYPES, 'info', 'type', 'Notification');
  source.placement = U.enumValue(source.placement, PLACEMENTS, 'top-right', 'placement', 'Notification');
  source.duration = U.finite(source.duration, DEFAULTS.duration, 0, 'duration', 'Notification');
  source.maxCount = Math.floor(U.finite(source.maxCount, DEFAULTS.maxCount, 0, 'maxCount', 'Notification'));
  source.stack = preset.normalizeStack(source.stack);
  source.zIndex = source.zIndex === undefined || source.zIndex === null || source.zIndex === '' ? null : Math.floor(U.finite(source.zIndex, 0, 0, 'zIndex', 'Notification'));
  ['closable', 'closeOnClick', 'pauseOnHover', 'showProgress'].forEach(function (key) {
    source[key] = U.bool(source[key], DEFAULTS[key], key, 'Notification');
  });
  source.pauseOnHoverScope = U.enumValue(source.pauseOnHoverScope, ['item', 'stack'], DEFAULTS.pauseOnHoverScope, 'pauseOnHoverScope', 'Notification');
  if (source.actions === undefined || source.actions === null) source.actions = [];
  if (!Array.isArray(source.actions)) throw new TypeError('[QXFRAME9A7C2] Notification actions must be an array.');
  source.actions = source.actions.map(function (action, index) { return U.normalizeAction(action, index, 'Notification'); });
  CALLBACKS.forEach(function (key) {
    if (source[key] != null && typeof source[key] !== 'function') throw new TypeError('[QXFRAME9A7C2] Notification ' + key + ' must be a function.');
  });
  source.width = U.cssLength(source.width, '', 'width', 'Notification');
  source.minWidth = U.cssLength(source.minWidth, '', 'minWidth', 'Notification');
  source.maxWidth = U.cssLength(source.maxWidth, '', 'maxWidth', 'Notification');
  return source;
}
    
function render(record, previous) {
  var context = U.beginRender(record, { widths:true, className:function (opts) { return ('qxframe9a7c2-notice qxframe9a7c2-notification-root is-' + opts.type).trim(); } });
  var opts = context.options, wrapper = context.body, doc = context.document;
  while (wrapper.firstChild) wrapper.removeChild(wrapper.firstChild);
  U.appendNoticeIcon(record, wrapper, { className:'qxframe9a7c2-notification-icon', sizeClass:'is-lg' });
  var section = doc.createElement('div');
  section.className = 'qxframe9a7c2-notification-section';
  var titleNode = null, contentNode = null, actionHost = null, actionButtons = [], actionContexts = [];
  if (opts.title !== undefined && opts.title !== null && opts.title !== '') {
    var title = doc.createElement('div');
    title.className = 'qxframe9a7c2-notification-title';
    U.renderValue(title, opts.title, record);
    section.appendChild(title); titleNode = title;
  }
  if (opts.content !== undefined && opts.content !== null && opts.content !== '') {
    var content = doc.createElement('div');
    content.className = 'qxframe9a7c2-notification-content';
    U.renderValue(content, opts.content, record);
    section.appendChild(content); contentNode = content;
  }
  if (opts.actions.length) {
    actionHost = doc.createElement('div');
    actionHost.className = 'qxframe9a7c2-notification-actions';
    opts.actions.forEach(function (action, index) {
      var button = doc.createElement('button');
      button.type = 'button';
      var actionTone = action.type === 'primary' ? 'is-primary is-solid' : (action.type === 'danger' ? 'is-error is-solid' : 'is-default is-outlined');
      button.className = ('qxframe9a7c2-button is-sm qxframe9a7c2-notification-action ' + actionTone).trim();
      var actionClass = action.class;
      if (Array.isArray(actionClass)) actionClass.map(String).filter(Boolean).forEach(function(name){button.classList.add(name);});
      else if (actionClass) String(actionClass).split(/\s+/).filter(Boolean).forEach(function(name){button.classList.add(name);});
      button.disabled = action.disabled;
      DOM.setPrivate(button, 'noticeAction', String(index));
      U.renderValue(button, action.label, record);
      actionHost.appendChild(button);
      actionButtons.push(button);
      actionContexts.push({ item:action, state:Object.freeze({ disabled:action.disabled===true, type:action.type }) });
    });
    section.appendChild(actionHost);
  }
  wrapper.appendChild(section);
  U.setSemanticElements(record, { section:section, title:titleNode, content:contentNode, actions:actionHost, action:actionButtons }, { action:actionContexts });
  U.appendNoticeChrome(record, { closeClass:'qxframe9a7c2-notification-close', progressClass:'qxframe9a7c2-notice-progress qxframe9a7c2-notification-progress' });
}
    
var channel = NoticeService.createChannel({ name: 'Notification', slug: 'notification', semanticElements:['section','title','content','actions','action'], collapsedVisible: 3, fixedStackGeometry: true, normalize: normalize, render: render });
    
function configure(next) { return preset.configure(DEFAULTS, next, normalize); }
    
var createFeedbackController = FeedbackController.bindNoticeChannel(channel);

function createTyped(type, options) { return preset.createTyped(type, options, channel); }

export const Notification = Object.freeze({
    definition: Object.freeze({ initializer: false }),
    profile: Object.freeze({
      name: 'Notification',
      motion: Object.freeze({ mode: 'notice-presence' }),
      overlay: Object.freeze({ mode: 'notice-layer' }),
      feedback: Object.freeze({ global: true }),
      ownership: Object.freeze({ motion: 'MotionController', overlay: 'OverlayController', feedback: 'FeedbackController' })
    }),
    createFeedbackController: createFeedbackController,
    create: channel.create,
    info: function (input) { return createTyped('info', input); },
    success: function (input) { return createTyped('success', input); },
    warning: function (input) { return createTyped('warning', input); },
    error: function (input) { return createTyped('error', input); },
    loading: function (input) { return createTyped('loading', input); },
    close: channel.close,
    closeAll: channel.closeAll,
    configure,
    getFrameElement: channel.getFrameElement,
    getViewportElement: channel.getViewportElement,
    getState: channel.getState,
    placements: PLACEMENTS.slice(),
    types: TYPES.slice()
});
export default Notification;
