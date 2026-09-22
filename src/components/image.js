// Stage 88→92/legacy-tail: canonical ESM image authority extracted from frozen HOTFIX6.
import { DOM } from '../core/dom.js';
import { URLPolicy } from '../utils/url.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Config } from '../core/config.js';
import { TransformModel } from '../core/transformModel.js';
import { Renderer } from '../core/renderer.js';
import { OverlayRuntime } from '../core/overlayRuntime.js';
import { PopupSurface } from '../core/popupSurface.js';
import { Transition } from '../core/transition.js';
import { PointerSession } from '../core/pointerSession.js';
import { Utils } from '../utils/utils.js';

const global = globalThis;

var FITS = Object.freeze(['fill', 'contain', 'cover', 'none', 'scale-down']);
var REMOVED_OPTIONS = Object.freeze(['target', 'el', 'mount', 'previewList', 'previewGroup', 'previewSrc']);
var REMOVED_PREVIEW_ITEM_FIELDS = Object.freeze(['url', 'name']);
var PREVIEW_TRANSITION = Object.freeze({
  enter: Object.freeze({
    type: 'transition',
    from: Object.freeze({ style: Object.freeze({ opacity: '0', transform: 'translate3d(var(--_qxframe9a7c2-image-preview-origin-x,0px),var(--_qxframe9a7c2-image-preview-origin-y,0px),0) scale(var(--_qxframe9a7c2-image-preview-origin-scale-x,.94),var(--_qxframe9a7c2-image-preview-origin-scale-y,.94))' }) }),
    active: Object.freeze({ style: Object.freeze({ transitionProperty: 'opacity, transform', transitionDuration: 'var(--qxframe9a7c2-motion-duration-mid)', transitionTimingFunction: 'var(--qxframe9a7c2-easing-standard)' }) }),
    to: Object.freeze({ style: Object.freeze({ opacity: '1', transform: 'translate3d(0,0,0) scale(1,1)' }) })
  }),
  leave: Object.freeze({
    type: 'transition',
    from: Object.freeze({ style: Object.freeze({ opacity: '1', transform: 'translate3d(0,0,0) scale(1,1)' }) }),
    active: Object.freeze({ style: Object.freeze({ transitionProperty: 'opacity, transform', transitionDuration: 'var(--qxframe9a7c2-motion-duration-mid)', transitionTimingFunction: 'var(--qxframe9a7c2-easing-standard)' }) }),
    to: Object.freeze({ style: Object.freeze({ opacity: '0', transform: 'translate3d(var(--_qxframe9a7c2-image-preview-origin-x,0px),var(--_qxframe9a7c2-image-preview-origin-y,0px),0) scale(var(--_qxframe9a7c2-image-preview-origin-scale-x,.94),var(--_qxframe9a7c2-image-preview-origin-scale-y,.94))' }) })
  })
});
var own = Utils.own;
function call(fn) {
  if (typeof fn !== 'function') return undefined;
  return fn.apply(null, Array.prototype.slice.call(arguments, 1));
}
function rejectRemoved(options) {
  REMOVED_OPTIONS.forEach(function (name) {
    if (own(options, name)) throw new TypeError('[QXFRAME9A7C2] Image removed option "' + name + '".');
  });
}
function finite(value, fallback, label, minimum) {
  var number = Number(value == null ? fallback : value);
  if (!Number.isFinite(number) || number < minimum) {
    throw new TypeError('[QXFRAME9A7C2] Image ' + label + ' must be a finite number >= ' + minimum + '.');
  }
  return number;
}
function previewExtension(src) {
  var clean = String(src || '').split(/[?#]/)[0].toLowerCase();
  var match = clean.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : '';
}
function previewType(value, src) {
  var raw = String(value || '').toLowerCase();
  if (raw.indexOf('image/') === 0) return 'image';
  if (raw.indexOf('video/') === 0) return 'video';
  if (raw.indexOf('audio/') === 0) return 'audio';
  if (raw === 'image' || raw === 'video' || raw === 'audio') return raw;
  var ext = previewExtension(src);
  if (/^(mp4|webm|mov|m4v|ogv|avi|mkv)$/.test(ext)) return 'video';
  if (/^(mp3|wav|ogg|m4a|aac|flac|opus)$/.test(ext)) return 'audio';
  return 'image';
}
function previewPolicy(type) { return type === 'image' ? 'image' : 'media'; }
function sanitizePreviewSource(src, type) { return src == null ? '' : URLPolicy.sanitize(src, previewPolicy(type)); }
function normalizePreviewItem(item, index) {
  if (typeof item === 'string') {
    var stringType = previewType('', item);
    return Object.freeze({ type: stringType, src: sanitizePreviewSource(item, stringType), alt: '', title: '', downloadName: '', poster: '' });
  }
  if (!item || typeof item !== 'object' || Renderer.isNodeLike(item) || Array.isArray(item)) {
    throw new TypeError('[QXFRAME9A7C2] Image preview item ' + index + ' must be a string or object.');
  }
  REMOVED_PREVIEW_ITEM_FIELDS.forEach(function (name) {
    if (own(item, name)) throw new TypeError('[QXFRAME9A7C2] Image preview item ' + index + ' removed field "' + name + '".');
  });
  if (!own(item, 'src')) throw new TypeError('[QXFRAME9A7C2] Image preview item ' + index + ' requires src.');
  var type = previewType(item.type || item.kind || item.mediaType || '', item.src);
  return Object.freeze({
    type: type,
    src: sanitizePreviewSource(item.src, type),
    alt: item.alt == null ? '' : String(item.alt),
    title: item.title == null ? '' : String(item.title),
    downloadName: item.downloadName == null ? '' : String(item.downloadName),
    poster: item.poster == null ? '' : URLPolicy.sanitize(item.poster, 'image')
  });
}
function normalizePreview(value) {
  if (value === false || value == null) return false;
  if (value === true) return true;
  if (typeof value !== 'object' || Array.isArray(value) || Renderer.isNodeLike(value)) {
    throw new TypeError('[QXFRAME9A7C2] Image preview must be true, false, or an object.');
  }
  var next = Object.assign({}, value);
  if (own(next, 'previewList') || own(next, 'previewGroup')) {
    throw new TypeError('[QXFRAME9A7C2] Image preview does not accept legacy list aliases.');
  }
  if (own(next, 'items')) {
    if (!Array.isArray(next.items)) throw new TypeError('[QXFRAME9A7C2] Image preview.items must be an array.');
    next.items = next.items.map(normalizePreviewItem);
  }
  return next;
}
function normalizeOptions(options) {
  var next = Object.assign({}, options || {});
  rejectRemoved(next);
  next.fit = String(next.fit == null ? 'cover' : next.fit).toLowerCase();
  if (FITS.indexOf(next.fit) < 0) throw new TypeError('[QXFRAME9A7C2] Image fit must be one of: ' + FITS.join(', ') + '.');
  next.preview = normalizePreview(next.preview);
  next.minScale = finite(next.minScale, 0.2, 'minScale', 0.01);
  next.maxScale = finite(next.maxScale, 5, 'maxScale', 0.01);
  if (next.maxScale < next.minScale) throw new TypeError('[QXFRAME9A7C2] Image maxScale must be >= minScale.');
  next.scaleStep = finite(next.scaleStep, 0.25, 'scaleStep', 0.01);
  next.rotateStep = finite(next.rotateStep, 90, 'rotateStep', 0);
  next.maskOpacity = finite(next.maskOpacity, 0.82, 'maskOpacity', 0);
  if (next.maskOpacity > 1) throw new TypeError('[QXFRAME9A7C2] Image maskOpacity must be <= 1.');
  return next;
}
function render(container, output, doc) {
  var value = output;
  Renderer.replace(container, value == null ? '' : value, doc);
}
function create(options) {
  var source = options || {};
  var opts = normalizeOptions(Object.assign({
    src: '', alt: '', fit: 'cover', lazy: false, fallback: '', placeholder: null, errorContent: null,
    rounded: false, circle: false, width: null, height: null, preview: false, previewMask: true,
    previewMaskText: 'Preview', disabled: false, maskClosable: true, maskOpacity: 0.82, maskColor: '',
    keyboard: true, wheelZoom: true, doubleClickZoom: true, draggable: true, destroyOnClose: true, minScale: 0.2, maxScale: 5,
    scaleStep: 0.25, rotateStep: 90, showToolbar: true, showNavigation: true, showClose: true,
    showTitle: true, showCounter: true, showZoom: true, showRotate: true, showFlip: true, showReset: true,
    download: false
  }, source));
  if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Image container must be an Element.');
    
  var doc = opts.document || opts.container.ownerDocument || global.document;
  var scope = Lifecycle.createScope();
  var destroyed = false;
  var loading = false;
  var error = false;
  var fallbackTried = false;
  var previewIndex = 0;
  var previewOpen = false;
  var drag = null;
  var transformModel = null;
  var overlay = null;
  var surface = null;
  var presence = null;
  var previewMotionActive = false;
  var previewTransformDirty = false;
  var maskPresence = null;
  var pendingOpenDetail = null;
  var pendingCloseDetail = null;
  var leaveMaskDone = true;
  var leaveContentDone = true;
  var previewRoot = null;
  var previewMask = null;
  var previewStage = null;
  var previewMotion = null;
  var previewImage = null;
  var previewVideo = null;
  var previewAudio = null;
  var previewMedia = null;
  var panMetrics = null;
  var api = null;
  var previewActionByNode = typeof WeakMap === 'function' ? new WeakMap() : null;
  var previewChromeNodes = [];
    
  var root = doc.createElement('span');
  var image = doc.createElement('img');
  var placeholder = doc.createElement('span');
  var errorLayer = doc.createElement('span');
  var previewTrigger = doc.createElement('button');
  var mask = doc.createElement('span');
  root.className = 'qxframe9a7c2-image';
  image.className = 'qxframe9a7c2-image-img';
  placeholder.className = 'qxframe9a7c2-image-placeholder';
  errorLayer.className = 'qxframe9a7c2-image-error';
  previewTrigger.type = 'button';
  previewTrigger.className = 'qxframe9a7c2-image-preview-trigger';
  mask.className = 'qxframe9a7c2-image-mask';
  image.alt = opts.alt == null ? '' : String(opts.alt);
  root.appendChild(placeholder);
  root.appendChild(image);
  root.appendChild(errorLayer);
  opts.container.appendChild(root);
    
  function previewConfig() { return opts.preview && typeof opts.preview === 'object' ? opts.preview : null; }
  function cfg(name, fallback) {
    var config = previewConfig();
    return config && own(config, name) ? config[name] : (own(opts, name) ? opts[name] : fallback);
  }
  function controlsConfig() { var config = previewConfig(); return config && own(config, 'controls') ? config.controls : opts.controls; }
  function controlEnabled(name, fallback) {
    var controls = controlsConfig();
    if (controls === false) return false;
    if (controls && typeof controls === 'object' && own(controls, name)) return controls[name] !== false;
    var aliases = { toolbar: 'showToolbar', navigation: 'showNavigation', close: 'showClose', title: 'showTitle', counter: 'showCounter', zoom: 'showZoom', rotate: 'showRotate', flip: 'showFlip', reset: 'showReset', download: 'download' };
    var optionName = aliases[name];
    return optionName ? cfg(optionName, fallback) !== false : fallback !== false;
  }
  function previewable() { return opts.preview === true || !!previewConfig(); }
  function previewItems() {
    var config = previewConfig();
    if (config && Array.isArray(config.items) && config.items.length) return config.items.slice();
    var src = config && own(config, 'src') ? config.src : opts.src;
    return [Object.freeze({ type: 'image', src: src == null ? '' : URLPolicy.sanitize(src, 'image'), alt: opts.alt == null ? '' : String(opts.alt), title: opts.alt == null ? '' : String(opts.alt), downloadName: '', poster: '' })];
  }
  function currentPreviewItem() { return previewItems()[previewIndex] || null; }
  function currentPreviewType() { var item = currentPreviewItem(); return item && item.type ? item.type : 'image'; }
  function imagePreviewActive() { return currentPreviewType() === 'image'; }
  function previewTitle(item) { return item ? (item.title || item.alt || (opts.alt == null ? '' : String(opts.alt))) : ''; }
  function normalizeIndex(index) {
    var count = previewItems().length;
    if (!count) return 0;
    var value = Number(index);
    if (!Number.isFinite(value)) throw new TypeError('[QXFRAME9A7C2] Image preview index must be a finite number.');
    value = Math.trunc(value);
    return (value % count + count) % count;
  }
  function renderPlaceholder() {
    if (opts.placeholder != null && opts.placeholder !== false) render(placeholder, typeof opts.placeholder === 'function' ? opts.placeholder(api) : opts.placeholder, doc);
    else render(placeholder, 'Image', doc);
  }
  function renderError() {
    if (opts.errorContent != null && opts.errorContent !== false) render(errorLayer, typeof opts.errorContent === 'function' ? opts.errorContent(api) : opts.errorContent, doc);
    else render(errorLayer, 'Image unavailable', doc);
  }
  function renderMask() {
    var present = previewable() && opts.previewMask !== false && cfg('mask', true) !== false;
    if (!present) { render(mask, '', doc); if (mask.parentNode) mask.parentNode.removeChild(mask); return; }
    var output = cfg('maskContent', opts.previewMaskText);
    render(mask, typeof output === 'function' ? output(api) : output, doc);
    if (mask.parentNode !== root) root.appendChild(mask);
  }
  function syncRoot() {
    root.classList.toggle('is-rounded', opts.rounded === true);
    root.classList.toggle('is-circle', opts.circle === true);
    root.classList.toggle('is-previewable', previewable() && opts.disabled !== true);
    root.classList.toggle('is-loading', loading);
    root.classList.toggle('is-error', error);
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.style.setProperty('--qxframe9a7c2-image-fit', opts.fit);
    root.style.width = opts.width == null || opts.width === '' ? '' : (typeof opts.width === 'number' ? String(opts.width) + 'px' : String(opts.width));
    root.style.height = opts.height == null || opts.height === '' ? '' : (typeof opts.height === 'number' ? String(opts.height) + 'px' : String(opts.height));
    if (previewable()) { if (previewTrigger.parentNode !== root) root.insertBefore(previewTrigger, mask.parentNode === root ? mask : null); } else if (previewTrigger.parentNode) previewTrigger.parentNode.removeChild(previewTrigger);
    previewTrigger.disabled = opts.disabled === true || !previewable();
    previewTrigger.tabIndex = previewable() && opts.disabled !== true ? 0 : -1;
    image.alt = opts.alt == null ? '' : String(opts.alt);
    if (opts.lazy) image.loading = 'lazy'; else image.removeAttribute('loading');
  }
  function setSource(src) {
    fallbackTried = false;
    error = false;
    var value = src == null ? '' : URLPolicy.sanitize(src, 'image');
    loading = !!value;
    if (value) image.setAttribute('src', value);
    else {
      image.removeAttribute('src');
      loading = false;
      error = true;
    }
    syncRoot();
    return api;
  }
  function onLoad(event) {
    loading = false;
    error = false;
    syncRoot();
    call(opts.onLoad, event, Object.freeze({ src: image.currentSrc || image.src || '', instance: api }));
  }
  function onError(event) {
    var fallback = opts.fallback == null ? '' : URLPolicy.sanitize(opts.fallback, 'image');
    if (!fallbackTried && fallback) {
      fallbackTried = true;
      image.setAttribute('src', fallback);
      call(opts.onFallback, fallback, Object.freeze({ event: event, instance: api }));
      return;
    }
    loading = false;
    error = true;
    syncRoot();
    call(opts.onError, event, Object.freeze({ src: image.getAttribute('src') || '', instance: api }));
  }
    
  function measurePanMetrics() {
    if (!previewImage || !previewStage || !imagePreviewActive()) return null;
    var width = Number(previewImage.offsetWidth || previewImage.clientWidth || 0);
    var height = Number(previewImage.offsetHeight || previewImage.clientHeight || 0);
    var viewportWidth = Number(previewStage.clientWidth || (doc.documentElement && doc.documentElement.clientWidth) || (doc.defaultView && doc.defaultView.innerWidth) || 0);
    var viewportHeight = Number(previewStage.clientHeight || (doc.documentElement && doc.documentElement.clientHeight) || (doc.defaultView && doc.defaultView.innerHeight) || 0);
    if (!(width > 0 && height > 0 && viewportWidth > 0 && viewportHeight > 0)) return null;
    panMetrics = { width: width, height: height, viewportWidth: viewportWidth, viewportHeight: viewportHeight };
    return panMetrics;
  }
  function panBounds(state) {
    var metrics = panMetrics || measurePanMetrics();
    if (!metrics) return { x: 0, y: 0 };
    var radians = Number(state.rotate || 0) * Math.PI / 180;
    var cos = Math.abs(Math.cos(radians));
    var sin = Math.abs(Math.sin(radians));
    var scaledWidth = metrics.width * state.scale;
    var scaledHeight = metrics.height * state.scale;
    var projectedWidth = cos * scaledWidth + sin * scaledHeight;
    var projectedHeight = sin * scaledWidth + cos * scaledHeight;
    return {
      x: Math.max(0, (projectedWidth - metrics.viewportWidth) / 2),
      y: Math.max(0, (projectedHeight - metrics.viewportHeight) / 2)
    };
  }
  function constrainTransform(state) {
    var bounds = panBounds(state);
    return {
      x: Math.max(-bounds.x, Math.min(bounds.x, Number(state.x) || 0)),
      y: Math.max(-bounds.y, Math.min(bounds.y, Number(state.y) || 0))
    };
  }
  function transformValue() {
    var state = transformModel.snapshot();
    return Object.freeze({ scale: state.scale, rotate: state.rotate, flipX: state.flipX, flipY: state.flipY, x: state.x, y: state.y });
  }
  function projectTransform(state, detail) {
    if (!previewImage || !imagePreviewActive()) return api;
    previewImage.style.setProperty('--qxframe9a7c2-image-preview-scale', String(state.scale));
    previewImage.style.setProperty('--qxframe9a7c2-image-preview-rotate', String(state.rotate) + 'deg');
    previewImage.style.setProperty('--qxframe9a7c2-image-preview-flip-x', String(state.flipX));
    previewImage.style.setProperty('--qxframe9a7c2-image-preview-flip-y', String(state.flipY));
    previewImage.style.setProperty('--qxframe9a7c2-image-preview-x', String(state.x) + 'px');
    previewImage.style.setProperty('--qxframe9a7c2-image-preview-y', String(state.y) + 'px');
    previewImage.style.transform = 'translate3d(' + state.x + 'px,' + state.y + 'px,0) rotate(' + state.rotate + 'deg) scale(' + (state.scale * state.flipX) + ',' + (state.scale * state.flipY) + ')';
    previewImage.classList.toggle('is-zoomed', state.scale > 1.001);
    previewImage.classList.toggle('is-flipped-x', state.flipX < 0);
    previewImage.classList.toggle('is-flipped-y', state.flipY < 0);
    call(cfg('onTransform', opts.onTransform), Object.freeze(Object.assign({ reason: detail && detail.reason || 'api' }, transformValue())), Object.freeze({ index: previewIndex, item: currentPreviewItem(), instance: api }));
    return api;
  }
  transformModel = TransformModel.create({
    minScale: Number(cfg('minScale', opts.minScale)),
    maxScale: Number(cfg('maxScale', opts.maxScale)),
    constrain: constrainTransform,
    onChange: projectTransform
  });
  function resetTransform(reason) { transformModel.reset({ reason: reason || 'reset' }); return api; }
  function zoomBy(delta, reason) { if (imagePreviewActive()) transformModel.zoomBy(Number(delta || 0), { reason: reason || 'zoom' }); return api; }
  function rotateBy(delta, reason) { if (imagePreviewActive()) transformModel.rotateBy(Number(delta || 0), { reason: reason || 'rotate' }); return api; }
  function flip(axis) { if (imagePreviewActive()) transformModel.flip(axis || 'x', { reason: 'flip-' + (axis || 'x') }); return api; }
  function refreshTransform(reason) {
    if (previewMotionActive) { previewTransformDirty = true; return api; }
    transformModel.refresh({ reason: reason || 'refresh' }); return api;
  }
  function reconcilePreviewTransform(reason) {
    if (!previewTransformDirty) return api;
    previewTransformDirty = false;
    transformModel.refresh({ reason: reason || 'motion-reconcile' });
    return api;
  }
    
  function iconNameForAction(action) {
    return ({
      close: 'close', prev: 'arrow-left', next: 'arrow-right',
      'zoom-out': 'zoom-out', 'zoom-in': 'zoom-in',
      'rotate-left': 'refresh', 'rotate-right': 'refresh',
      'flip-x': 'align-horizontal', 'flip-y': 'align-vertical',
      reset: 'repeat', download: 'download'
    })[String(action)] || 'circle';
  }
  function makeButton(action, label, extraClass) {
    var button = doc.createElement('button');
    button.type = 'button';
    button.className = 'qxframe9a7c2-image-preview-tool' + (extraClass ? ' ' + extraClass : '') + ' is-action-' + String(action);
    if (previewActionByNode) previewActionByNode.set(button, action);
    button.title = label;
    var glyph = doc.createElement('span');
    glyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + iconNameForAction(action) + ' is-line is-round is-stroke-3 is-md';
    button.appendChild(glyph);
    previewChromeNodes.push(button);
    return button;
  }
  function actionContext() {
    return Object.freeze({
      zoomIn: function () { return zoomBy(Number(cfg('scaleStep', opts.scaleStep)), 'zoom-in'); },
      zoomOut: function () { return zoomBy(-Number(cfg('scaleStep', opts.scaleStep)), 'zoom-out'); },
      rotateLeft: function () { return rotateBy(-Number(cfg('rotateStep', opts.rotateStep)), 'rotate-left'); },
      rotateRight: function () { return rotateBy(Number(cfg('rotateStep', opts.rotateStep)), 'rotate-right'); },
      flipX: function () { return flip('x'); }, flipY: function () { return flip('y'); },
      reset: function () { return resetTransform('reset'); }, download: downloadPreview,
      index: previewIndex, item: currentPreviewItem(), instance: api
    });
  }
  function clearChrome() {
    if (!previewRoot) return;
    previewChromeNodes.forEach(function (node) { DOM.removeNode(node); });
    previewChromeNodes = [];
  }
  function renderChrome() {
    if (!previewRoot) return;
    clearChrome();
    var items = previewItems();
    var item = currentPreviewItem();
    var count = items.length;
    if (controlEnabled('title', true) && previewTitle(item)) {
      var title = doc.createElement('div');
      title.className = 'qxframe9a7c2-image-preview-title';
      previewChromeNodes.push(title);
      title.textContent = previewTitle(item);
      previewRoot.appendChild(title);
    }
    if (controlEnabled('counter', true) && count > 1) {
      var counter = doc.createElement('div');
      counter.className = 'qxframe9a7c2-image-preview-counter';
      previewChromeNodes.push(counter);
      counter.textContent = String(previewIndex + 1) + ' / ' + String(count);
      previewRoot.appendChild(counter);
    }
    if (controlEnabled('close', true)) previewRoot.appendChild(makeButton('close', 'Close preview', 'qxframe9a7c2-image-preview-close'));
    if (controlEnabled('navigation', true) && count > 1) {
      previewRoot.appendChild(makeButton('prev', 'Previous media', 'qxframe9a7c2-image-preview-nav qxframe9a7c2-image-preview-prev'));
      previewRoot.appendChild(makeButton('next', 'Next media', 'qxframe9a7c2-image-preview-nav qxframe9a7c2-image-preview-next'));
    }
    if (controlEnabled('toolbar', true)) {
      var toolbar = doc.createElement('div');
      toolbar.className = 'qxframe9a7c2-image-preview-toolbar';
      previewChromeNodes.push(toolbar);
      var custom = cfg('toolbar', null);
      if (typeof custom === 'function') render(toolbar, custom(actionContext()), doc);
      else {
        if (imagePreviewActive() && controlEnabled('zoom', true)) {
          toolbar.appendChild(makeButton('zoom-out', 'Zoom out'));
          toolbar.appendChild(makeButton('zoom-in', 'Zoom in'));
        }
        if (imagePreviewActive() && controlEnabled('rotate', true)) {
          toolbar.appendChild(makeButton('rotate-left', 'Rotate left'));
          toolbar.appendChild(makeButton('rotate-right', 'Rotate right'));
        }
        if (imagePreviewActive() && controlEnabled('flip', true)) {
          toolbar.appendChild(makeButton('flip-x', 'Flip horizontal'));
          toolbar.appendChild(makeButton('flip-y', 'Flip vertical'));
        }
        if (imagePreviewActive() && controlEnabled('reset', true)) toolbar.appendChild(makeButton('reset', 'Reset transform'));
        if (controlEnabled('download', false)) toolbar.appendChild(makeButton('download', 'Download media'));
      }
      if (toolbar.childNodes.length) previewRoot.appendChild(toolbar);
    }
  }
  function pausePreviewMedia() {
    [previewVideo, previewAudio].forEach(function (node) {
      if (!node) return;
      try { node.pause(); } catch (_) {}
    });
  }
  function syncPreviewMedia(reason) {
    if (!previewImage || !previewVideo || !previewAudio) return api;
    var item = currentPreviewItem();
    var type = item && item.type ? item.type : 'image';
    DOM.setPrivate(previewRoot, 'previewIndex', previewIndex);
    DOM.setPrivate(previewRoot, 'previewCount', previewItems().length);
    DOM.setPrivate(previewRoot, 'previewType', type);
    panMetrics = null;
    pausePreviewMedia();
    previewImage.hidden = type !== 'image';
    previewVideo.hidden = type !== 'video';
    previewAudio.hidden = type !== 'audio';
    previewRoot.classList.toggle('is-media-image', type === 'image');
    previewRoot.classList.toggle('is-media-video', type === 'video');
    previewRoot.classList.toggle('is-media-audio', type === 'audio');
    previewMotion.classList.toggle('is-media-image', type === 'image');
    previewMotion.classList.toggle('is-media-video', type === 'video');
    previewMotion.classList.toggle('is-media-audio', type === 'audio');
    if (type === 'image') {
      previewMedia = previewImage;
      previewImage.src = item && item.src ? sanitizePreviewSource(item.src, 'image') : '';
      previewImage.alt = item && item.alt ? item.alt : (opts.alt == null ? '' : String(opts.alt));
    } else if (type === 'video') {
      previewMedia = previewVideo;
      previewVideo.src = item && item.src ? sanitizePreviewSource(item.src, 'video') : '';
      previewVideo.poster = item && item.poster ? item.poster : '';
      previewVideo.title = item && (item.title || item.alt) ? (item.title || item.alt) : '';
      previewVideo.load();
    } else {
      previewMedia = previewAudio;
      previewAudio.src = item && item.src ? sanitizePreviewSource(item.src, 'audio') : '';
      previewAudio.title = item && (item.title || item.alt) ? (item.title || item.alt) : '';
      previewAudio.load();
    }
    resetTransform(reason || 'preview-change');
    renderChrome();
    call(cfg('onChange', opts.onPreviewChange), previewIndex, Object.freeze({ item: item, type: type, reason: reason || 'api', instance: api }));
    return api;
  }
  function setPreviewIndex(index, reason) {
    previewIndex = normalizeIndex(index);
    if (previewImage) syncPreviewMedia(reason || 'set-index');
    return api;
  }
  function nextPreview() { return setPreviewIndex(previewIndex + 1, 'next'); }
  function prevPreview() { return setPreviewIndex(previewIndex - 1, 'prev'); }
  function downloadPreview() {
    var item = currentPreviewItem();
    if (!item || !item.src) return api;
    if (call(cfg('onDownload', opts.onDownload), item, Object.freeze({ url: item.src, index: previewIndex, instance: api })) === false) return api;
    var link = doc.createElement('a');
    var safeDownload = URLPolicy.sanitize(item.src, 'download');
    if (!safeDownload) return api;
    link.href = safeDownload;
    link.download = item.downloadName || '';
    link.rel = 'noopener';
    doc.body.appendChild(link);
    link.click();
    DOM.removeNode(link);
    return api;
  }
    
  function previewDetail(reason, event) {
    return { source: DOM.activationSource(event), reason: reason || 'api', originalEvent: event || null, index: previewIndex, item: currentPreviewItem(), instance: api };
  }
  function previewViewportSize() {
    var view = doc.defaultView || global;
    return { width: Number(previewStage && previewStage.clientWidth || view.innerWidth || 0), height: Number(previewStage && previewStage.clientHeight || view.innerHeight || 0) };
  }
  function previewNaturalSize() {
    if (!imagePreviewActive()) return { width: 0, height: 0 };
    var nw = Number(previewImage && previewImage.naturalWidth || image && image.naturalWidth || 0);
    var nh = Number(previewImage && previewImage.naturalHeight || image && image.naturalHeight || 0);
    if (!(nw > 0 && nh > 0)) {
      var rect = image && image.getBoundingClientRect ? image.getBoundingClientRect() : null;
      nw = Number(rect && rect.width || 1); nh = Number(rect && rect.height || 1);
    }
    return { width: nw, height: nh };
  }
  function lockPreviewTrajectoryGeometry() {
    if (!previewMotion || !previewImage || !imagePreviewActive() || cfg('trajectory', true) === false) return false;
    var viewport = previewViewportSize(), natural = previewNaturalSize();
    if (!(viewport.width > 0 && viewport.height > 0 && natural.width > 0 && natural.height > 0)) return false;
    var maxWidth = Math.min(viewport.width * .94, 1800);
    var maxHeight = viewport.height * .92;
    var ratio = Math.min(1, maxWidth / natural.width, maxHeight / natural.height);
    var width = Math.max(1, natural.width * ratio), height = Math.max(1, natural.height * ratio);
    previewMotion.style.width = width.toFixed(3) + 'px';
    previewMotion.style.height = height.toFixed(3) + 'px';
    previewMotion.classList.add('is-trajectory-active');
    previewMotionActive = true;
    return true;
  }
  function releasePreviewTrajectoryGeometry(reason) {
    if (!previewMotion) return;
    previewMotion.classList.remove('is-trajectory-active');
    previewMotion.style.width = '';
    previewMotion.style.height = '';
    previewMotionActive = false;
    panMetrics = null;
    reconcilePreviewTransform(reason || 'motion-complete');
  }
  function preparePreviewTrajectory() {
    if (!previewMotion || !root || !previewRoot || previewRoot.hidden || !imagePreviewActive() || cfg('trajectory', true) === false) return false;
    lockPreviewTrajectoryGeometry();
    var sourceRect = image && image.getBoundingClientRect ? image.getBoundingClientRect() : root.getBoundingClientRect();
    var targetRect = previewMotion.getBoundingClientRect();
    var valid = sourceRect && targetRect && sourceRect.width > 0 && sourceRect.height > 0 && targetRect.width > 0 && targetRect.height > 0;
    var dx = 0, dy = 0, sx = .94, sy = .94;
    if (valid) {
      dx = sourceRect.left + sourceRect.width / 2 - (targetRect.left + targetRect.width / 2);
      dy = sourceRect.top + sourceRect.height / 2 - (targetRect.top + targetRect.height / 2);
      sx = Math.max(.02, Math.min(20, sourceRect.width / targetRect.width));
      sy = Math.max(.02, Math.min(20, sourceRect.height / targetRect.height));
    }
    previewMotion.style.setProperty('--_qxframe9a7c2-image-preview-origin-x', dx.toFixed(3) + 'px');
    previewMotion.style.setProperty('--_qxframe9a7c2-image-preview-origin-y', dy.toFixed(3) + 'px');
    previewMotion.style.setProperty('--_qxframe9a7c2-image-preview-origin-scale-x', String(sx));
    previewMotion.style.setProperty('--_qxframe9a7c2-image-preview-origin-scale-y', String(sy));
    return valid;
  }
  function finalizePreviewLeave(context) {
    if (previewOpen || destroyed || !leaveMaskDone || !leaveContentDone || !pendingCloseDetail) return false;
    var detail = pendingCloseDetail || previewDetail(context && context.reason || 'close', context && context.originalEvent || null);
    pendingCloseDetail = null;
    drag = null;
    previewStage.classList.remove('is-dragging');
    if (previewImage) previewImage.classList.remove('is-dragging');
    pausePreviewMedia();
    releasePreviewTrajectoryGeometry('leave-complete');
    surface.hide(detail);
    root.classList.remove('is-previewing');
    root.classList.remove('is-preview-source-hidden');
    overlay.deactivate(detail);
    call(cfg('onVisibleChange', opts.onPreviewVisibleChange), false, Object.freeze({ source: detail.source || 'api', reason: detail.reason, event: detail.originalEvent, index: previewIndex, item: currentPreviewItem(), instance: api }));
    return true;
  }
  function closePreview(reason, event) {
    if (!previewOpen || !presence) return api;
    previewOpen = false;
    pendingOpenDetail = null;
    pendingCloseDetail = previewDetail(reason || 'api', event || null);
    leaveMaskDone = false;
    leaveContentDone = false;
    preparePreviewTrajectory();
    // Cross-fade ownership returns to the authored source at the same time preview leave starts.
    root.classList.remove('is-preview-source-hidden');
    // Preview chrome leaves on the same lifecycle clock as mask/trajectory. The root remains
    // mounted until both presence owners complete, so title/toolbar/close never disappear early.
    if (previewRoot) previewRoot.classList.remove('is-chrome-visible');
    // The public reason is metadata, not teardown authority. Actual destroy owns its
    // own direct presence/overlay teardown below, so closePreview('destroy') must not
    // be able to impersonate an immediate structural destroy.
    if (maskPresence) maskPresence.setVisible(false, { reason: pendingCloseDetail.reason, originalEvent: pendingCloseDetail.originalEvent, immediate: false });
    presence.setVisible(false, { reason: pendingCloseDetail.reason, originalEvent: pendingCloseDetail.originalEvent, immediate: false });
    return api;
  }
  function handlePreviewAction(action, event) {
    if (action === 'close') closePreview('close', event);
    else if (action === 'prev') prevPreview();
    else if (action === 'next') nextPreview();
    else if (action === 'zoom-in') zoomBy(Number(cfg('scaleStep', opts.scaleStep)), 'zoom-in');
    else if (action === 'zoom-out') zoomBy(-Number(cfg('scaleStep', opts.scaleStep)), 'zoom-out');
    else if (action === 'rotate-left') rotateBy(-Number(cfg('rotateStep', opts.rotateStep)), 'rotate-left');
    else if (action === 'rotate-right') rotateBy(Number(cfg('rotateStep', opts.rotateStep)), 'rotate-right');
    else if (action === 'flip-x') flip('x');
    else if (action === 'flip-y') flip('y');
    else if (action === 'reset') resetTransform('reset');
    else if (action === 'download') downloadPreview();
  }
  function ensurePreview() {
    if (previewRoot) return;
    previewRoot = doc.createElement('div');
    previewMask = doc.createElement('div');
    previewStage = doc.createElement('div');
    previewMotion = doc.createElement('div');
    previewImage = doc.createElement('img');
    previewVideo = doc.createElement('video');
    previewAudio = doc.createElement('audio');
    previewRoot.className = 'qxframe9a7c2-image-preview-root';
    previewMask.className = 'qxframe9a7c2-image-preview-mask';
    previewStage.className = 'qxframe9a7c2-image-preview-stage';
    previewMotion.className = 'qxframe9a7c2-image-preview-motion';
    previewImage.className = 'qxframe9a7c2-image-preview-media qxframe9a7c2-image-preview-image';
    previewVideo.className = 'qxframe9a7c2-image-preview-media qxframe9a7c2-image-preview-video';
    previewAudio.className = 'qxframe9a7c2-image-preview-media qxframe9a7c2-image-preview-audio';
    previewRoot.tabIndex = -1;
    previewImage.draggable = false;
    previewVideo.controls = true; previewVideo.preload = 'metadata'; previewVideo.playsInline = true; previewVideo.hidden = true;
    previewAudio.controls = true; previewAudio.preload = 'metadata'; previewAudio.hidden = true;
    previewMotion.appendChild(previewImage);
    previewMotion.appendChild(previewVideo);
    previewMotion.appendChild(previewAudio);
    previewMedia = previewImage;
    previewStage.appendChild(previewMotion);
    previewRoot.appendChild(previewMask);
    previewRoot.appendChild(previewStage);
    
    scope.add(DOM.listen(previewRoot, 'click', function (event) {
      var actionNode = event.target && event.target.closest ? event.target.closest('.qxframe9a7c2-image-preview-tool') : null;
      if (actionNode && previewRoot.contains(actionNode) && previewActionByNode && previewActionByNode.has(actionNode)) {
        event.preventDefault();
        event.stopPropagation();
        handlePreviewAction(previewActionByNode.get(actionNode), event);
        return;
      }
    }));
    scope.add(DOM.listen(previewMask, 'click', function (event) {
      if (cfg('maskClosable', opts.maskClosable) !== false) closePreview('mask', event);
    }));
    scope.add(DOM.listen(previewRoot, 'keydown', function (event) {
      if (cfg('keyboard', opts.keyboard) === false || !previewOpen) return;
      // Preserve native video/audio keyboard controls. Escape is owned by OverlayRuntime.
      if (event.target === previewVideo || event.target === previewAudio) return;
      var handled = true;
      if (event.key === 'ArrowLeft') prevPreview();
      else if (event.key === 'ArrowRight') nextPreview();
      else if (imagePreviewActive() && (event.key === '+' || event.key === '=')) zoomBy(Number(cfg('scaleStep', opts.scaleStep)), 'keyboard');
      else if (imagePreviewActive() && event.key === '-') zoomBy(-Number(cfg('scaleStep', opts.scaleStep)), 'keyboard');
      else if (imagePreviewActive() && event.key === '0') resetTransform('keyboard');
      else handled = false;
      if (handled) event.preventDefault();
    }));
    scope.add(DOM.listen(previewStage, 'wheel', function (event) {
      if (cfg('wheelZoom', opts.wheelZoom) === false || !previewOpen || !imagePreviewActive()) return;
      event.preventDefault();
      zoomBy((event.deltaY < 0 ? 1 : -1) * Number(cfg('scaleStep', opts.scaleStep)), 'wheel');
    }, { passive: false }));
    scope.add(DOM.listen(previewImage, 'load', function () { panMetrics = null; refreshTransform('preview-load'); }));
    scope.add(DOM.listen(doc.defaultView || global, 'resize', function () { panMetrics = null; if (previewOpen) refreshTransform('viewport-resize'); }));
    scope.add(DOM.listen(previewImage, 'dblclick', function (event) {
      if (cfg('doubleClickZoom', opts.doubleClickZoom) === false) return;
      event.preventDefault();
      event.stopPropagation();
      if (transformValue().scale > 1.001) resetTransform('double-click-reset');
      else zoomBy(Math.max(1, Number(cfg('scaleStep', opts.scaleStep)) * 4), 'double-click-zoom');
    }));
    var previewDragSession = PointerSession.create({
      target: previewImage,
      threshold: 0,
      getState: function () { var current = transformValue(); return { disabled: cfg('draggable', opts.draggable) === false || current.scale <= 1.001 }; },
      capabilities: { draggable: true },
      canStart: function (detail) {
        var currentTransform = transformValue();
        if (cfg('draggable', opts.draggable) === false || currentTransform.scale <= 1.001) return false;
        var event = detail.originalEvent;
        if (event && event.preventDefault) event.preventDefault();
        if (event && event.stopPropagation) event.stopPropagation();
        drag = { ox: currentTransform.x, oy: currentTransform.y };
        return true;
      },
      onStart: function () { previewStage.classList.add('is-dragging'); previewImage.classList.add('is-dragging'); },
      onMove: function (detail) { if (drag) transformModel.set({ x: drag.ox + detail.deltaX, y: drag.oy + detail.deltaY }, { reason: 'drag' }); },
      onEnd: function () { drag = null; previewStage.classList.remove('is-dragging'); previewImage.classList.remove('is-dragging'); },
      onCancel: function () { drag = null; previewStage.classList.remove('is-dragging'); previewImage.classList.remove('is-dragging'); }
    });
    scope.add(function () { previewDragSession.destroy(); });
    
    surface = PopupSurface.create({
      element: previewRoot,
      setVisible: function (visible) {
      }
    });
    surface.hide({ reason: 'initial' });
    overlay = OverlayRuntime.create({
      reference: root,
      floating: previewRoot,
      document: doc,
      portalContainer: doc.body,
      position: false,
      trapFocus: true,
      lockScroll: true,
      closeOnOutsidePress: false,
      closeOnEscape: cfg('keyboard', opts.keyboard) !== false,
      restoreFocus: true,
      destroyOnDeactivate: cfg('destroyOnClose', opts.destroyOnClose) !== false,
      layerKind: 'modal',
      componentType: 'ImagePreview',
      zIndex: cfg('zIndex', opts.zIndex),
      onDismiss: function (payload) {
        if (!previewOpen) return false;
        closePreview(payload.reason, payload.originalEvent);
        return true;
      }
    });
    maskPresence = Transition.create({
      element: previewMask,
      transition: 'fade',
      visible: false,
      appear: false,
      reducedMotion: function () { return Config.resolve('motion', undefined, root) === false ? true : undefined; },
      onAfterLeave: function (context) {
        leaveMaskDone = true;
        finalizePreviewLeave(context);
      }
    });
    presence = Transition.create({
      element: previewMotion,
      transition: PREVIEW_TRANSITION,
      visible: false,
      appear: false,
      reducedMotion: function () { return Config.resolve('motion', undefined, root) === false ? true : undefined; },
      onAfterEnter: function (context) {
        if (!previewOpen || destroyed) return;
        releasePreviewTrajectoryGeometry('enter-complete');
        var detail = pendingOpenDetail || previewDetail(context && context.reason || 'preview', context && context.originalEvent || null);
        pendingOpenDetail = null;
        call(cfg('onVisibleChange', opts.onPreviewVisibleChange), true, Object.freeze({ source: detail.source || 'api', reason: detail.reason, event: detail.originalEvent, index: previewIndex, item: currentPreviewItem(), instance: api }));
      },
      onAfterLeave: function (context) {
        leaveContentDone = true;
        finalizePreviewLeave(context);
      }
    });
  }
  function openPreview(index, event) {
    if (!previewable() || opts.disabled === true || destroyed || previewOpen) return api;
    var items = previewItems();
    if (!items.length || !items.some(function (item) { return !!item.src; })) return api;
    ensurePreview();
    previewIndex = normalizeIndex(index == null ? Number(cfg('initialIndex', 0)) : index);
    previewMask.style.setProperty('--qxframe9a7c2-image-preview-mask-opacity', String(Number(cfg('maskOpacity', opts.maskOpacity)) * 100) + '%');
    var maskColor = cfg('maskColor', opts.maskColor);
    if (maskColor) previewMask.style.setProperty('--qxframe9a7c2-image-preview-mask-color', String(maskColor));
    else previewMask.style.removeProperty('--qxframe9a7c2-image-preview-mask-color');
    syncPreviewMedia('open');
    overlay.updateOptions({ closeOnEscape: cfg('keyboard', opts.keyboard) !== false, destroyOnDeactivate: cfg('destroyOnClose', opts.destroyOnClose) !== false });
    previewOpen = true;
    pendingCloseDetail = null;
    leaveMaskDone = true;
    leaveContentDone = true;
    pendingOpenDetail = previewDetail('preview', event || null);
    overlay.mount();
    surface.show(pendingOpenDetail);
    // Commit the newly mounted portal before starting presence motion. Without this
    // boundary Chromium can coalesce the mask/chrome `from` and `to` values into the first
    // painted frame, making the fade visually disappear even though Transition runs.
    previewRoot.classList.remove('is-chrome-visible');
    void previewRoot.offsetWidth;
    previewRoot.classList.add('is-chrome-visible');
    preparePreviewTrajectory();
    // Hide the authored source while the physical preview copy owns the trajectory.
    // This prevents the two-image ghosting visible during open/close handoff.
    root.classList.add('is-previewing');
    root.classList.add('is-preview-source-hidden');
    if (!overlay.getState().active) overlay.activate(pendingOpenDetail);
    maskPresence.setVisible(true, { reason: pendingOpenDetail.reason, originalEvent: pendingOpenDetail.originalEvent });
    presence.setVisible(true, { reason: pendingOpenDetail.reason, originalEvent: pendingOpenDetail.originalEvent });
    return api;
  }
    
  scope.add(DOM.listen(image, 'load', onLoad));
  scope.add(DOM.listen(image, 'error', onError));
  scope.add(DOM.listen(previewTrigger, 'click', function (event) {
    if (!previewable() || opts.disabled === true) return;
    event.preventDefault();
    openPreview(undefined, event);
  }));
    
  api = Object.freeze({
    openPreview: openPreview,
    closePreview: closePreview,
    next: nextPreview,
    prev: prevPreview,
    setPreviewIndex: setPreviewIndex,
    zoomIn: function () { return zoomBy(Number(cfg('scaleStep', opts.scaleStep)), 'api'); },
    zoomOut: function () { return zoomBy(-Number(cfg('scaleStep', opts.scaleStep)), 'api'); },
    rotateLeft: function () { return rotateBy(-Number(cfg('rotateStep', opts.rotateStep)), 'api'); },
    rotateRight: function () { return rotateBy(Number(cfg('rotateStep', opts.rotateStep)), 'api'); },
    flipX: function () { return flip('x'); },
    flipY: function () { return flip('y'); },
    reset: function () { return resetTransform('api'); },
    setSrc: function (src) { opts.src = src == null ? '' : String(src); return setSource(opts.src); },
    setPreviewItems: function (items) {
      if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] Image preview items must be an array.');
      var normalized = items.map(normalizePreviewItem);
      var config = previewConfig();
      opts.preview = Object.assign({}, config || {}, { items: normalized });
      previewIndex = 0;
      if (previewImage) syncPreviewMedia('set-items');
      return api;
    },
    updateOptions: function (nextOptions) {
      if (destroyed) return false;
      var next = nextOptions || {};
      rejectRemoved(next);
      if (own(next, 'container') && next.container !== opts.container) throw new Error('[QXFRAME9A7C2] Image container is immutable.');
      if (own(next, 'document') && next.document !== doc) throw new Error('[QXFRAME9A7C2] Image document is immutable.');
      var candidate = normalizeOptions(Object.assign({}, opts, next));
      var sourceChanged = own(next, 'src');
      opts = candidate;
      renderPlaceholder();
      renderError();
      renderMask();
      syncRoot();
      if (sourceChanged) setSource(opts.src);
      if (!previewable() && previewOpen) closePreview('preview-disabled');
      if (overlay) overlay.updateOptions({ closeOnEscape: cfg('keyboard', opts.keyboard) !== false, destroyOnDeactivate: cfg('destroyOnClose', opts.destroyOnClose) !== false });
      transformModel.updateOptions({ minScale: Number(cfg('minScale', opts.minScale)), maxScale: Number(cfg('maxScale', opts.maxScale)) }, { reason: 'options' });
      if (previewRoot) {
            renderChrome();
        refreshTransform('options');
      }
      return api;
    },
    getState: function () {
      return Object.freeze({
        src: image.getAttribute('src') || '', loading: loading, error: error, fallbackTried: fallbackTried,
        previewOpen: previewOpen, previewPresent: !!(presence && presence.getState().present), previewIndex: previewIndex, previewCount: previewItems().length,
        previewMounted: !!(overlay && overlay.getState().mounted), overlayActive: !!(overlay && overlay.getState().active), previewType: currentPreviewType(),
        disabled: opts.disabled === true, fit: opts.fit, destroyed: destroyed,
        transform: transformValue()
      });
    },
    getRootElement: function () { return root; },
    getImageElement: function () { return image; },
    getPreviewElement: function () { return previewRoot; },
    getPreviewMaskElement: function () { return previewMask; },
    getPreviewStageElement: function () { return previewStage; },
    getPreviewMediaElement: function () { return previewMedia; },
    getPreviewOverlayRuntime: function () { return overlay; },
    destroy: function () {
      if (destroyed) return false;
      var wasOpen = previewOpen;
      var destroyDetail = previewDetail('destroy', null);
      destroyed = true;
      previewOpen = false;
      drag = null;
      if (maskPresence) maskPresence.destroy();
      if (presence) presence.destroy();
      if (surface) surface.hide(destroyDetail);
      if (overlay) overlay.destroy();
      if (surface) surface.destroy();
      if (transformModel) transformModel.destroy();
      if (wasOpen) call(cfg('onVisibleChange', opts.onPreviewVisibleChange), false, Object.freeze({ source: 'api', reason: 'destroy', event: null, index: previewIndex, item: currentPreviewItem(), instance: api }));
      overlay = null;
      surface = null;
      presence = null;
      previewRoot = null;
      previewMask = null;
      previewStage = null;
      previewMotion = null;
      previewImage = null;
      previewVideo = null;
      previewAudio = null;
      previewMedia = null;
      panMetrics = null;
      scope.dispose();
      DOM.removeNode(root);
      return true;
    }
  });
    
  renderPlaceholder();
  renderError();
  renderMask();
  syncRoot();
  setSource(opts.src);
  return api;
}
    
function createPreview(options) {
  var source = Object.assign({}, options || {});
  var doc = source.document || global.document;
  if (!doc || !doc.createElement || !doc.body) throw new TypeError('[QXFRAME9A7C2] Image.createPreview requires a document with body.');
  var items = Array.isArray(source.items) ? source.items : [];
  var host = doc.createElement('span');
  host.className = 'qxframe9a7c2-image-preview-controller-host';
  host.hidden = true;
  doc.body.appendChild(host);
  var previewOptions = Object.assign({}, source, { items: items, initialIndex: source.initialIndex == null ? 0 : source.initialIndex, trajectory: source.trajectory === true });
  delete previewOptions.document;
  delete previewOptions.container;
  delete previewOptions.portalContainer;
  var owner = create({
    container: host,
    document: doc,
    src: '',
    alt: '',
    placeholder: false,
    errorContent: false,
    previewMask: false,
    preview: previewOptions,
    destroyOnClose: source.destroyOnClose !== false
  });
  var destroyed = false;
  var api = Object.freeze({
    open: function (index, event) { owner.openPreview(index, event); return api; },
    openPreview: function (index, event) { owner.openPreview(index, event); return api; },
    close: function (reason, event) { owner.closePreview(reason, event); return api; },
    closePreview: function (reason, event) { owner.closePreview(reason, event); return api; },
    next: owner.next,
    prev: owner.prev,
    setIndex: owner.setPreviewIndex,
    setPreviewIndex: owner.setPreviewIndex,
    setItems: owner.setPreviewItems,
    setPreviewItems: owner.setPreviewItems,
    zoomIn: owner.zoomIn,
    zoomOut: owner.zoomOut,
    rotateLeft: owner.rotateLeft,
    rotateRight: owner.rotateRight,
    flipX: owner.flipX,
    flipY: owner.flipY,
    reset: owner.reset,
    updateOptions: function (next) {
      var config = Object.assign({}, previewOptions, next || {});
      if (own(config, 'items')) owner.setPreviewItems(config.items);
      owner.updateOptions({ preview: config });
      previewOptions = config;
      return api;
    },
    getState: owner.getState,
    getPreviewElement: owner.getPreviewElement,
    getPreviewMaskElement: owner.getPreviewMaskElement,
    getPreviewStageElement: owner.getPreviewStageElement,
    getPreviewMediaElement: owner.getPreviewMediaElement,
    getPreviewOverlayRuntime: owner.getPreviewOverlayRuntime,
    destroy: function () {
      if (destroyed) return false;
      destroyed = true;
      owner.destroy();
      DOM.removeNode(host);
      return true;
    }
  });
  return api;
}

export const Image = Object.freeze({
    definition: Object.freeze({ initializer: Object.freeze({ mode: 'create', bind: 'container' }) }),
    create,
    createPreview
});
export { create, createPreview };
export default Image;
