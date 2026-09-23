import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { URLPolicy } from '../utils/url.js';
import { Lifecycle } from '../core/lifecycle.js';
import { UploadLifecycle } from '../core/uploadLifecycle.js';
import { OptionTransaction } from '../core/optionTransaction.js';
import { Renderer } from '../core/renderer.js';
import { OverlayRuntime } from '../core/overlayRuntime.js';
import { ReorderInteraction } from '../core/reorderInteraction.js';
import { Utils } from '../utils/utils.js';
import { Image } from './image.js';
import { Control } from './control.js';
import { Item } from './item.js';

const global = globalThis;
const own = Utils.own;

function validateViewOptions(options) {
  if (options.progressView != null && (typeof options.progressView !== 'object' || Array.isArray(options.progressView))) throw new TypeError('[QXFRAME9A7C2] Upload progressView must be an object.');
  if (options.actionVisibility != null && (typeof options.actionVisibility !== 'object' || Array.isArray(options.actionVisibility))) throw new TypeError('[QXFRAME9A7C2] Upload actionVisibility must be an object.');
  ['renderTrigger','itemRender','renderExtra','renderFileIcon'].forEach(function (key) {
    if (options[key] != null && typeof options[key] !== 'function') throw new TypeError('[QXFRAME9A7C2] Upload ' + key + ' must be a function.');
  });
}
function listType(value) {
  var type = String(value || 'text').toLowerCase();
  if (['text','picture','picture-card','picture-circle'].indexOf(type) < 0) throw new TypeError('[QXFRAME9A7C2] Upload listType must be text, picture, picture-card, or picture-circle.');
  return type;
}
function formatSize(value) {
  var size = Number(value || 0);
  if (size < 1024) return size + ' B';
  if (size < 1024 * 1024) return (size / 1024).toFixed(size < 10240 ? 1 : 0) + ' KB';
  if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(size < 10 * 1024 * 1024 ? 1 : 0) + ' MB';
  return (size / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}
function extension(name) {
  var match = String(name || '').toLowerCase().match(/\.([^.]+)$/);
  return match ? match[1] : '';
}
function kindOf(record) {
  var file = record && record.file;
  var type = String(record && (record.type || (file && file.type)) || '').toLowerCase();
  var ext = extension(record && (record.name || record.url));
  if (type.indexOf('image/') === 0 || /^(png|jpe?g|gif|webp|bmp|svg|avif|ico)$/.test(ext)) return 'image';
  if (type.indexOf('video/') === 0 || /^(mp4|webm|mov|m4v|avi|mkv)$/.test(ext)) return 'video';
  if (type.indexOf('audio/') === 0 || /^(mp3|wav|ogg|m4a|aac|flac)$/.test(ext)) return 'audio';
  if (type === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (/^(zip|rar|7z|tar|gz|bz2)$/.test(ext)) return 'archive';
  if (/^(doc|docx|xls|xlsx|ppt|pptx|txt|md|csv|json|xml)$/.test(ext)) return 'document';
  return 'file';
}
function canPreview(record) { return !!(record && (record.url || record.thumbUrl || record.file)); }
function statusText(record) {
  if (record.status === 'uploading') return Math.round(record.percent || 0) + '%';
  if (record.status === 'success') return 'Uploaded';
  if (record.status === 'error') return record.error && record.error.message ? record.error.message : 'Upload failed';
  return record.skipAutoUpload ? 'Manual upload' : 'Ready';
}
    
function create(source, overrides) {
  var fieldInit = Control.resolveFieldOptions(source, overrides);
  var incoming = fieldInit.options;
  var opts = Utils.mergeOwn({
    multiple: false, disabled: false, drag: false, pastable: false, autoUpload: true,
    showList: true, listType: 'text', removable: true, previewable: true, downloadable: false,
    retryable: true, abortable: true, dragSort: false, openFileDialogOnClick: true,
    hideTriggerAtMax: true, previewTarget: 'modal', triggerText: 'Select files',
    dragText: 'Click or drop files here', dropHint: 'Drop, paste, or select files',
    progressView: { thickness: 6, showLabel: true }, actionVisibility: null
  }, incoming);
  ComponentContracts.validate(ComponentContracts.get('Upload'), opts, 'Upload');
  validateViewOptions(opts);
  if (!opts.container && !opts.formField) throw new TypeError('[QXFRAME9A7C2] Upload requires target/container or formField.');
  opts.listType = listType(opts.listType);
  var scope = Lifecycle.createScope();
  var destroyed = false;
  var api = null;
  var renderCleanups = [];
  var previewCleanups = [];
  var objectUrls = Object.create(null);
  var previewModal = null;
  var previewMask = null;
  var previewPanel = null;
  var previewOverlay = null;
  var previewMediaController = null;
  var previewUid = '';
  var reorderInteraction = null;
  var formBridge = null;
  var doc = fieldInit.document || opts.document || (opts.container && opts.container.ownerDocument) || (opts.formField && opts.formField.ownerDocument) || global.document;
    
  var root = doc.createElement('div');
  var input = doc.createElement('input');
  var trigger = doc.createElement('button');
  var list = doc.createElement('div');
  root.className = 'qxframe9a7c2-upload';
  input.className = 'qxframe9a7c2-upload-input';
  input.type = 'file';
  input.tabIndex = -1;
  trigger.className = opts.drag ? 'qxframe9a7c2-upload-dropzone' : 'qxframe9a7c2-upload-trigger qxframe9a7c2-button is-default is-outlined';
  trigger.type = 'button';
  list.className = 'qxframe9a7c2-upload-list';
  root.appendChild(input); root.appendChild(trigger); root.appendChild(list); if (opts.container) opts.container.appendChild(root); else Control.placeFieldRoot(root, null, opts.formField);
    
  function clearRenderListeners() { while (renderCleanups.length) { try { renderCleanups.pop()(); } catch (_) {} } }
  function clearPreviewListeners() { while (previewCleanups.length) { try { previewCleanups.pop()(); } catch (_) {} } }
  function revokeObjectUrl(uid) {
    var url = objectUrls[uid];
    if (!url) return;
    try { if (global.URL && typeof global.URL.revokeObjectURL === 'function') global.URL.revokeObjectURL(url); } catch (_) {}
    delete objectUrls[uid];
  }
  function reconcileObjectUrls(value) {
    var alive = Object.create(null);
    (value || []).forEach(function (record) { alive[record.uid] = true; });
    Object.keys(objectUrls).forEach(function (uid) { if (!alive[uid]) revokeObjectUrl(uid); });
    if (previewUid && !alive[previewUid]) closePreview('record-removed');
  }
  function getObjectUrl(record) {
    if (!record || !record.file) return '';
    if (!objectUrls[record.uid]) {
      try { if (global.URL && typeof global.URL.createObjectURL === 'function') objectUrls[record.uid] = global.URL.createObjectURL(record.file); } catch (_) { return ''; }
    }
    return objectUrls[record.uid] || '';
  }
  function previewUrl(record) {
    if (!record) return '';
    return record.thumbUrl || record.url || getObjectUrl(record);
  }
  function previewMediaUrl(record) {
    if (!record) return '';
    return record.url || getObjectUrl(record) || record.thumbUrl || '';
  }
  function isMediaPreviewKind(kind) { return kind === 'image' || kind === 'video' || kind === 'audio'; }
  function mediaPreviewState() {
    if (!previewMediaController) return null;
    try { return previewMediaController.getState(); } catch (_) { return null; }
  }
  function mediaPreviewOpen() { var state = mediaPreviewState(); return !!(state && state.previewOpen === true); }
  function mediaPreviewPresent() {
    var state = mediaPreviewState();
    return !!(state && (state.previewOpen === true || state.previewPresent === true || state.previewMounted === true));
  }
  function destroyMediaPreview(reason, event, notify) {
    if (!previewMediaController) return;
    var controller = previewMediaController;
    var state = mediaPreviewState();
    var wasOpen = !!(state && state.previewOpen === true);
    var wasPresent = !!(state && (state.previewOpen === true || state.previewPresent === true || state.previewMounted === true));
    var activeFile = lifecycle.find(previewUid) || null;
    previewMediaController = null;
    if (wasOpen) controller.closePreview(reason || 'replace', event || null);
    controller.destroy();
    if (wasPresent && notify === true && typeof opts.onPreviewVisibleChange === 'function') {
      opts.onPreviewVisibleChange(false, { source: DOM.activationSource(event), reason: reason || 'replace', event: event || null, originalEvent: event || null, file: activeFile, instance: api });
    }
  }
  function maxReached() {
    var max = Number(opts.maxCount || 0);
    return max > 0 && lifecycle.getValue().length >= max;
  }
  function defaultFormValue(value) {
    return (value || []).map(function (record) {
      if (!record) return '';
      if (record.formValue !== undefined && record.formValue !== null) return record.formValue;
      if (record.name !== undefined && record.name !== null) return record.name;
      if (record.file && record.file.name) return record.file.name;
      if (record.url) return record.url;
      return record.uid == null ? '' : record.uid;
    });
  }
  function serializeFormValue(value) { return typeof opts.serializeValue === 'function' ? opts.serializeValue(value, api) : defaultFormValue(value); }
  function lifecycleOptions(includeValue) {
    var next = {
      multiple: opts.multiple === true, disabled: opts.disabled === true, autoUpload: opts.autoUpload !== false,
      accept: opts.accept, maxCount: opts.maxCount, maxSize: opts.maxSize, beforeUpload: opts.beforeUpload,
      transformFile: opts.transformFile, request: opts.request,
      onProgress: function (percent, record) { if (typeof opts.onProgress === 'function') opts.onProgress(percent, record, api); },
      onReject: function (file, detail) { if (typeof opts.onReject === 'function') opts.onReject(file, Utils.mergeOwn( detail, { instance: api })); },
      onSuccess: function (response, record) { if (typeof opts.onSuccess === 'function') opts.onSuccess(response, record, api); },
      onError: function (error, record) { if (typeof opts.onError === 'function') opts.onError(error, record, api); },
      onChange: function (value, detail) {
        if (formBridge) formBridge.setValue(value, { silent: detail && detail.silent === true, source: detail && detail.source || 'upload', reason: detail && detail.reason || 'change' });
        reconcileObjectUrls(value);
        renderList();
        var enriched = Utils.mergeOwn( detail, { instance: api });
        if (detail.operation === 'move' && typeof opts.onSort === 'function') opts.onSort(value.slice(), enriched);
        if (detail.reason === 'remove' && typeof opts.onRemove === 'function') opts.onRemove(detail.file, enriched);
        if (typeof opts.onChange === 'function') opts.onChange(value, enriched);
      }
    };
    if (includeValue) {
      if (own(opts, 'value')) next.value = opts.value;
      else if (own(opts, 'defaultValue')) next.defaultValue = opts.defaultValue;
    }
    return next;
  }
  var lifecycle = UploadLifecycle.create(lifecycleOptions(true));
  reorderInteraction = ReorderInteraction.create({
    root: list,
    document: doc,
    rowSelector: '.qxframe9a7c2-upload-sort-row',
    handleSelector: null,
    orientation: 'vertical',
    disabled: function () { return opts.disabled === true || opts.dragSort !== true; },
    readOnly: false,
    draggable: function () { return opts.dragSort === true; },
    stopPropagation: true,
    getItems: function () { return lifecycle.getValue().map(function (record) { return { key: record.uid, disabled: false, item: record }; }); },
    getRowElement: function (key) {
      var nodes = DOM.findAllPrivate(list, 'sortKey');
      for (var i = 0; i < nodes.length; i += 1) if (DOM.getPrivate(nodes[i], 'sortKey') === String(key)) return nodes[i];
      return null;
    },
    getKeyFromRow: function (row) { return DOM.getPrivate(row, 'sortKey'); },
    getInstance: function () { return api; },
    onMove: function (detail) { return lifecycle.move(detail.key, detail.toIndex, { source: detail && detail.source || 'api', reason: detail && detail.reason || 'drag-sort', event:detail.originalEvent, originalEvent:detail.originalEvent }); }
  });
    
  function syncStructure() {
    root.className = 'qxframe9a7c2-upload is-' + opts.listType + (opts.drag ? ' is-drag' : '') + (opts.disabled ? ' is-disabled' : '') + (opts.pastable ? ' is-pastable' : '');
    list.className = 'qxframe9a7c2-upload-list is-' + opts.listType;
    if (opts.showList === false) { if (list.parentNode) list.parentNode.removeChild(list); }
    else if (list.parentNode !== root) root.appendChild(list);
    input.multiple = opts.multiple === true;
    input.tabIndex = -1;
    input.disabled = opts.disabled === true;
    input.name = opts.inputName || '';
    if (opts.accept) input.setAttribute('accept', opts.accept); else input.removeAttribute('accept');
    if (opts.capture) input.setAttribute('capture', opts.capture === true ? '' : String(opts.capture)); else input.removeAttribute('capture');
    if (opts.directory === true) { input.setAttribute('webkitdirectory',''); input.setAttribute('directory',''); } else { input.removeAttribute('webkitdirectory'); input.removeAttribute('directory'); }
    var showTrigger = !(opts.hideTrigger === true || (opts.hideTriggerAtMax !== false && maxReached()));
    if (showTrigger) root.insertBefore(trigger, list.parentNode === root ? list : null);
    else if (trigger.parentNode) trigger.parentNode.removeChild(trigger);
    trigger.disabled = opts.disabled === true;
    root.removeAttribute('tabindex');
    renderTriggerContent();
  }
  function renderTriggerContent() {
    var context = Object.freeze({ value: lifecycle.getValue(), listType: opts.listType, disabled: opts.disabled === true, drag: opts.drag === true, instance: api });
    if (typeof opts.renderTrigger === 'function') {
      Renderer.replace(trigger, opts.renderTrigger(context));
      return;
    }
    trigger.textContent = '';
    if (opts.drag) {
      var text = doc.createElement('span'); text.className = 'qxframe9a7c2-upload-drag-text'; text.textContent = opts.dragText;
      var hint = doc.createElement('span'); hint.className = 'qxframe9a7c2-upload-drag-hint'; hint.textContent = opts.dropHint || '';
      trigger.appendChild(text); if (hint.textContent) trigger.appendChild(hint);
    } else {
      var label = doc.createElement('span'); label.className = 'qxframe9a7c2-upload-trigger-text'; label.textContent = opts.triggerText; trigger.appendChild(label);
    }
  }
  scope.add(clearRenderListeners);
  scope.add(clearPreviewListeners);
    
  function actionAllowed(action, record, fallback) {
    var policy = opts.actionVisibility;
    if (!policy || typeof policy !== 'object' || !own(policy, action)) return fallback !== false;
    var value = policy[action];
    if (typeof value === 'function') return value(record, Object.freeze({ value: lifecycle.getValue(), instance: api })) !== false;
    return value !== false;
  }
  function actionButton(label, className, handler) {
    var button = doc.createElement('button');
    button.type = 'button';
    button.className = 'qxframe9a7c2-upload-action qxframe9a7c2-button is-default is-text is-sm is-' + className;
    button.textContent = label;
     button.title = label;
    button.disabled = opts.disabled === true;
    renderCleanups.push(DOM.listen(button,'click',function (event) { if (event.preventDefault) event.preventDefault(); if (event.stopPropagation) event.stopPropagation(); handler(event); }));
    return button;
  }
  function renderThumb(record, large) {
    var thumb = doc.createElement('span');
    thumb.className = 'qxframe9a7c2-upload-thumb' + (large ? ' is-large' : '') + ' is-' + kindOf(record);
    var url = previewUrl(record);
    if (kindOf(record) === 'image' && url) {
      var image = doc.createElement('img'); image.src = URLPolicy.sanitize(url, 'image'); image.alt = record.name || ''; image.loading = 'lazy'; image.draggable = false;
      if (record.crossOrigin) image.crossOrigin = record.crossOrigin;
      thumb.appendChild(image);
    } else if (kindOf(record) === 'video' && url && large) {
      var video = doc.createElement('video'); video.src = URLPolicy.sanitize(url, 'media'); video.muted = true; video.preload = 'metadata'; thumb.appendChild(video);
    } else {
      var icon = doc.createElement('span'); icon.className = 'qxframe9a7c2-upload-file-icon';
      var iconOutput = typeof opts.renderFileIcon === 'function' ? opts.renderFileIcon(Object.freeze({ record: record, kind: kindOf(record), listType: opts.listType, instance: api })) : kindOf(record).toUpperCase();
      Renderer.append(icon, iconOutput); thumb.appendChild(icon);
    }
    return thumb;
  }
  function renderProgress(record) {
    var config = opts.progressView && typeof opts.progressView === 'object' ? opts.progressView : {};
    var percent = Math.max(0, Math.min(100, Number(record.percent || 0)));
    var wrap = doc.createElement('div'); wrap.className = 'qxframe9a7c2-upload-progress-wrap';
    var progress = doc.createElement('progress'); progress.className = 'qxframe9a7c2-upload-progress'; progress.max = 100; progress.value = percent;
    var thickness = Math.max(2, Number(config.thickness || 6)); progress.style.height = thickness + 'px'; wrap.appendChild(progress);
    if (config.showLabel !== false) {
      var info = doc.createElement('span'); info.className = 'qxframe9a7c2-upload-progress-info';
      var formatted = typeof config.format === 'function' ? config.format(percent, record, api) : Math.round(percent) + '%';
      Renderer.append(info, formatted); wrap.appendChild(info);
    }
    return wrap;
  }
  function createDefaultItem(record, index) {
    var row = doc.createElement('div');
    var main = doc.createElement('div');
    var name = doc.createElement('span');
    var meta = doc.createElement('span');
    var actions = doc.createElement('span');
    var card = opts.listType === 'picture-card' || opts.listType === 'picture-circle';
    row.className = 'qxframe9a7c2-upload-item is-' + record.status + (card ? ' is-picture-tile' : '');
     DOM.setPrivate(row, 'uploadUid', record.uid);
    main.className = 'qxframe9a7c2-upload-main'; name.className = 'qxframe9a7c2-upload-name'; meta.className = 'qxframe9a7c2-upload-meta'; actions.className = 'qxframe9a7c2-upload-actions';
    name.textContent = record.relativePath || record.name; name.title = record.relativePath || record.name;
    meta.textContent = formatSize(record.size) + ' · ' + statusText(record);
    main.appendChild(name); main.appendChild(meta);
    if (record.status === 'uploading') main.appendChild(renderProgress(record));
    if (record.status === 'error' && record.error) { var error = doc.createElement('span'); error.className='qxframe9a7c2-upload-error'; error.textContent=record.error.message || String(record.error); main.appendChild(error); }
    if (typeof opts.renderExtra === 'function') {
      var extraOutput = opts.renderExtra(Object.freeze({ record: record, index: index, value: lifecycle.getValue(), instance: api }));
      if (extraOutput !== undefined && extraOutput !== null && extraOutput !== false) { var extra = doc.createElement('div'); extra.className='qxframe9a7c2-upload-extra'; Renderer.append(extra,extraOutput); main.appendChild(extra); }
    }
    if (opts.previewable !== false && canPreview(record) && actionAllowed('preview',record,true)) actions.appendChild(actionButton('Preview','preview',function (event) { api.preview(record.uid, event); }));
    if ((opts.downloadable === true || !!record.url) && canPreview(record) && actionAllowed('download',record,true)) actions.appendChild(actionButton('Download','download',function () { api.download(record.uid); }));
    if (record.status === 'error' && opts.retryable !== false && actionAllowed('retry',record,true)) actions.appendChild(actionButton('Retry','retry',function () { api.retry(record.uid); }));
    if (record.status === 'uploading' && opts.abortable !== false && actionAllowed('abort',record,true)) actions.appendChild(actionButton('Abort','abort',function () { api.abort(record.uid); }));
    if (opts.removable !== false && actionAllowed('remove',record,true)) actions.appendChild(actionButton('Remove','remove',function () { api.remove(record.uid); }));
    if (opts.listType === 'picture' || card) row.appendChild(renderThumb(record, card));
    row.appendChild(main); row.appendChild(actions);
    return row;
  }
  function renderList() {
    if (destroyed) return;
    clearRenderListeners();
    list.replaceChildren();
    var value = lifecycle.getValue();
    reconcileObjectUrls(value);
    value.forEach(function (record,index) {
      var node = createDefaultItem(record,index);
      if (typeof opts.itemRender === 'function') {
        var actions = Object.freeze({
          preview: function () { return api.preview(record.uid); }, download: function () { return api.download(record.uid); },
          remove: function () { return api.remove(record.uid); }, retry: function () { return api.retry(record.uid); }, abort: function () { return api.abort(record.uid); },
          move: function (to) { lifecycle.move(record.uid,to,{source:'render-item'}); return api; }
        });
        var main = node.querySelector('.qxframe9a7c2-upload-main');
        var actionNode = node.querySelector('.qxframe9a7c2-upload-actions');
        var parts = Item.createParts({
          actions: function () { if (actionNode && actionNode.parentNode) actionNode.parentNode.removeChild(actionNode); return actionNode; },
          thumbnail: function () { var thumb = node.querySelector('.qxframe9a7c2-upload-thumb'); if (thumb && thumb.parentNode) thumb.parentNode.removeChild(thumb); return thumb; }
        });
        var itemCtx = Item.createContext(record, { index:index, key:record.uid, element:node, component:api, controller:api, disabled:opts.disabled === true, selected:false, active:false, value:value.slice(), actions:actions, status:record.status, parts:parts });
        var custom = opts.itemRender(record, itemCtx);
        if (custom !== undefined && custom !== null && custom !== false) {
          if (main) { main.textContent = ''; Renderer.append(main, custom); }
        }
        Item.projectClasses(node, opts.classes && opts.classes.item, record, itemCtx, 'upload:item');
      }
      if (!DOM.hasPrivate(node, 'uploadUid')) DOM.setPrivate(node, 'uploadUid', record.uid);
      DOM.setPrivate(node, 'sortKey', record.uid);
      node.classList.add('qxframe9a7c2-upload-sort-row');
      node.classList.toggle('is-draggable', opts.dragSort === true && opts.disabled !== true);
      node.draggable = opts.dragSort === true && opts.disabled !== true;
      list.appendChild(node);
    });
    syncStructure();
  }
  function addFiles(files, meta) { return lifecycle.addFiles(files, meta).then(function (result) { input.value=''; return result; }); }
  function open() { if (!destroyed && !opts.disabled && opts.openFileDialogOnClick !== false) input.click(); return api; }
  function handleTrigger(event) { if (opts.disabled || opts.openFileDialogOnClick === false) return; if (event.preventDefault) event.preventDefault(); open(); }
  function handleDrag(event) {
    if (!opts.drag) return;
    if (event.preventDefault) event.preventDefault();
    if (event.type === 'dragenter' || event.type === 'dragover') root.classList.add('is-dragover'); else root.classList.remove('is-dragover');
    if (event.type === 'drop' && event.dataTransfer) { if (typeof opts.onDrop === 'function') opts.onDrop(event, api); addFiles(event.dataTransfer.files, { source: 'drop', event: event }); }
  }
  function handlePaste(event) {
    if (!opts.pastable || opts.disabled || !event.clipboardData) return;
    var files = Array.prototype.slice.call(event.clipboardData.files || []); if (!files.length) return;
    if (event.preventDefault) event.preventDefault(); if (typeof opts.onPaste === 'function') opts.onPaste(files, event, api); addFiles(files, { source: 'paste', event: event });
  }
  function closePreview(reason, event) {
    if (previewMediaController && mediaPreviewOpen()) {
      previewMediaController.closePreview(reason || 'close', event || null);
      return api;
    }
    if (!previewModal) return api;
    var node = previewModal;
    var overlayRuntime = previewOverlay;
    previewModal = null;
    previewMask = null;
    previewPanel = null;
    previewOverlay = null;
    previewUid = '';
    clearPreviewListeners();
    if (overlayRuntime) {
      if (overlayRuntime.getState().active) overlayRuntime.deactivate({ reason: reason || 'close', originalEvent: event || null });
      overlayRuntime.destroy();
    }
    if (node.parentNode) node.parentNode.removeChild(node);
    if (typeof opts.onPreviewVisibleChange === 'function') opts.onPreviewVisibleChange(false,{source:DOM.activationSource(event),reason:reason,event:event||null,instance:api});
    return api;
  }
  function openMediaPreview(record, url, event) {
    var value = lifecycle.getValue();
    var mediaRecords = [];
    var items = [];
    value.forEach(function (candidate) {
      var kind = kindOf(candidate);
      if (!isMediaPreviewKind(kind) || !canPreview(candidate)) return;
      var src = candidate.uid === record.uid && url ? url : previewMediaUrl(candidate);
      if (!src) return;
      mediaRecords.push(candidate);
      items.push({
        type: kind,
        src: src,
        alt: candidate.name || '',
        title: candidate.name || '',
        downloadName: candidate.name || '',
        poster: kind === 'video' && candidate.thumbUrl && candidate.thumbUrl !== src ? candidate.thumbUrl : ''
      });
    });
    if (!items.length) return api;
    var initialIndex = 0;
    for (var i = 0; i < mediaRecords.length; i += 1) if (mediaRecords[i].uid === record.uid) { initialIndex = i; break; }

    if (previewModal) closePreview('replace', event);
    if (previewMediaController) destroyMediaPreview('replace', event, mediaPreviewPresent());

    previewUid = record.uid;
    previewMediaController = Image.createPreview({
      document: doc,
      items: items,
      initialIndex: initialIndex,
      trajectory: false,
      zIndex: opts.zIndex,
      download: opts.downloadable === true,
      maskClosable: true,
      keyboard: true,
      onChange: function (index, detail) {
        var active = mediaRecords[index] || null;
        previewUid = active ? active.uid : '';
        if (typeof opts.onPreviewChange === 'function') opts.onPreviewChange(index, Utils.mergeOwn( detail, { file: active, instance: api, previewInstance: detail && detail.instance }));
      },
      onDownload: function (item, detail) {
        var active = mediaRecords[detail && detail.index || 0] || null;
        if (!active || typeof opts.onDownload !== 'function') return undefined;
        return opts.onDownload(active, { file: active, url: item && item.src || '', instance: api, previewInstance: detail && detail.instance });
      },
      onVisibleChange: function (visible, detail) {
        var index = detail && Number.isFinite(Number(detail.index)) ? Number(detail.index) : initialIndex;
        var active = mediaRecords[index] || null;
        if (!visible) previewUid = '';
        else if (active) previewUid = active.uid;
        if (typeof opts.onPreviewVisibleChange === 'function') {
          opts.onPreviewVisibleChange(visible, Utils.mergeOwn( detail || {}, {
            file: active,
            url: detail && detail.item ? detail.item.src : (active ? previewMediaUrl(active) : ''),
            instance: api,
            previewInstance: detail && detail.instance
          }));
        }
      }
    });
    previewMediaController.open(initialIndex, event || null);
    return api;
  }
  function preview(target, event) {
    var record = lifecycle.find(target);
    if (!record || opts.previewable === false) return Promise.resolve(api);
    var resolved = null;
    if (typeof opts.previewFile === 'function' && record.file) {
      try { resolved = opts.previewFile(record.file,record,api); } catch (_) { resolved = null; }
    }
    return Promise.resolve(resolved).catch(function () { return ''; }).then(function (customUrl) {
      var kind = kindOf(record);
      var url = customUrl || (isMediaPreviewKind(kind) ? previewMediaUrl(record) : previewUrl(record));
      var payload = { file:record,url:url,source:DOM.activationSource(event),reason:'preview',originalEvent:event||null,instance:api };
      if (typeof opts.onPreview === 'function' && opts.onPreview(record,payload) === false) return api;
      if (!url) return api;
      if (opts.previewTarget === 'window') { var safeWindowUrl=URLPolicy.sanitize(url,kind==='image'?'image':(kind==='video'||kind==='audio'?'media':'download')); if (safeWindowUrl && typeof global.open === 'function') global.open(safeWindowUrl,'_blank','noopener'); return api; }
      if (isMediaPreviewKind(kind)) return openMediaPreview(record, url, event);

      if (previewMediaController) destroyMediaPreview('replace', event, mediaPreviewPresent());
      closePreview('replace');
      previewUid = record.uid;
      previewModal = doc.createElement('div'); previewModal.className='qxframe9a7c2-upload-preview-root';
      previewMask=doc.createElement('div'); previewPanel=doc.createElement('div');
      var panel=previewPanel, head=doc.createElement('div'), title=doc.createElement('div'), close=doc.createElement('button'), body=doc.createElement('div');
      previewMask.className='qxframe9a7c2-upload-preview-mask';
      panel.className='qxframe9a7c2-upload-preview-panel is-'+kind; head.className='qxframe9a7c2-upload-preview-head'; title.className='qxframe9a7c2-upload-preview-title'; title.textContent=record.name; close.type='button'; close.className='qxframe9a7c2-upload-preview-close qxframe9a7c2-button is-default is-text is-sm'; close.textContent='Close'; body.className='qxframe9a7c2-upload-preview-body';
      head.appendChild(title); head.appendChild(close); panel.appendChild(head); panel.appendChild(body); previewModal.appendChild(previewMask); previewModal.appendChild(panel);
      var media;
      if (kind==='pdf') { media=doc.createElement('iframe'); media.src=URLPolicy.sanitize(url,'document'); media.title=record.name||'PDF'; media.setAttribute('sandbox','allow-same-origin allow-downloads'); body.appendChild(media); }
      else { var link=doc.createElement('a'); link.href=URLPolicy.sanitize(url,'download'); link.target='_blank'; link.rel='noopener noreferrer'; link.textContent='Open '+record.name; body.appendChild(link); }
      previewOverlay = OverlayRuntime.create({
        reference: root,
        floating: previewModal,
        document: doc,
        portalContainer: doc.body,
        position: false,
        closeOnOutsidePress: false,
        closeOnEscape: true,
        trapFocus: true,
        lockScroll: true,
        restoreFocus: true,
        destroyOnDeactivate: true,
        initialFocus: close,
        focusOnActivate: true,
        layerKind: 'modal',
        componentType: 'UploadPreview',
        zIndex: opts.zIndex,
        onDismiss: function (detail) {
          if (!previewModal) return false;
          closePreview(detail.reason, detail.originalEvent);
          return true;
        }
      });
      previewOverlay.mount();
      previewOverlay.activate({ reason: 'preview', originalEvent: event || null });
      previewCleanups.push(DOM.listen(close,'click',function (event) { closePreview('close',event); }));
      previewCleanups.push(DOM.listen(previewMask,'click',function (event) { closePreview('mask',event); }));
      if (typeof opts.onPreviewVisibleChange === 'function') opts.onPreviewVisibleChange(true,payload);
      return api;
    });
  }
  function download(target) {
    var record = lifecycle.find(target);
    if (!record || !(opts.downloadable === true || record.url)) return api;
    var url = record.url || previewUrl(record), payload={file:record,url:url,instance:api};
    if (typeof opts.onDownload === 'function' && opts.onDownload(record,payload) === false) return api;
    if (!url) return api;
    var anchor=doc.createElement('a'); var safeDownload=URLPolicy.sanitize(url,'download'); if(!safeDownload)return api; anchor.href=safeDownload; anchor.download=record.name||''; anchor.target='_blank'; anchor.rel='noopener noreferrer'; (doc.body || doc.documentElement).appendChild(anchor); anchor.click(); anchor.remove();
    return api;
  }
  function commitRemove(target, meta) { lifecycle.remove(target,meta||{source:'api'}); return api; }
  function remove(target, meta) {
    var record=lifecycle.find(target); if (!record || opts.disabled) return api;
    if (typeof opts.beforeRemove !== 'function') return commitRemove(record.uid,meta);
    var gate;
    try { gate=opts.beforeRemove(record,lifecycle.getValue(),api); } catch (error) { if (typeof opts.onError==='function') opts.onError(error,record,api); return api; }
    if (gate && typeof gate.then === 'function') return Promise.resolve(gate).then(function (allowed) { if (allowed!==false && lifecycle.find(record.uid)) commitRemove(record.uid,meta); return api; },function (error) { if (typeof opts.onError==='function') opts.onError(error,record,api); return api; });
    if (gate!==false) commitRemove(record.uid,meta); return api;
  }
  function clear() {
    if (typeof opts.beforeRemove !== 'function') { lifecycle.setValue([],{source:'clear'}); return api; }
    var ids=lifecycle.getValue().map(function (record) { return record.uid; });
    return ids.reduce(function (promise,uid) { return promise.then(function () { return remove(uid,{source:'clear'}); }); },Promise.resolve()).then(function () { return api; });
  }
    
  scope.add(DOM.listen(input,'change',function (event) { addFiles(input.files,{source:'input',event:event}); }));
  scope.add(DOM.listen(trigger,'click',handleTrigger));
  ['dragenter','dragover','dragleave','drop'].forEach(function (name) { scope.add(DOM.listen(root,name,handleDrag)); });
  scope.add(DOM.listen(root,'paste',handlePaste));
    
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {}; ComponentContracts.validate(ComponentContracts.get('Upload'), next, 'Upload');
    OptionTransaction.rejectImmutable(next, ['target','container','formField'], 'Upload field binding');
    if (own(next,'drag') && (next.drag === true) !== (opts.drag === true)) throw new Error('[QXFRAME9A7C2] Upload drag structure is immutable; destroy and recreate to change it.');
    if (reorderInteraction && reorderInteraction.getState().dragging && (own(next,'dragSort') || own(next,'disabled'))) reorderInteraction.cancelDrag('options');
    var candidate = Utils.mergeOwn(opts, next); candidate.listType = listType(candidate.listType); validateViewOptions(candidate); opts = candidate;
    lifecycle.updateOptions(Utils.assignOwn(lifecycleOptions(false), own(next,'value') ? { value: next.value } : {}));
    syncStructure(); renderList(); if (formBridge) { formBridge.updateOptions({ name: opts.name, disabled: opts.disabled === true, readOnly: false, required: opts.required === true, serializeValue: serializeFormValue }); formBridge.setValue(lifecycle.getValue(), { silent: true }); } return api;
  }
    
  var initialValue = lifecycle.getValue();
  formBridge = Control.createFormFieldBridge({ root: root, target: opts.container, formField: opts.formField, document: doc, name: opts.name, disabled: opts.disabled === true, readOnly: false, required: opts.required === true, value: lifecycle.getValue(), serializeValue: serializeFormValue, getValue: lifecycle.getValue, onReset: function () { lifecycle.setValue(initialValue, { silent: true, source: 'form', reason: 'reset' }); } });
    
  api = Object.freeze({
    open: open, addFiles: addFiles,
    upload: function (target) { return lifecycle.upload(target,{source:'api'}); },
    retry: function (target) { return lifecycle.retry(target,{source:'retry'}); },
    abort: function (target) { lifecycle.abort(target,{source:'api'}); return api; },
    remove: remove,
    move: function (from,to) { lifecycle.move(from,to,{source:'api'}); return api; },
    preview: preview, closePreview: closePreview, download: download,
    clear: clear,
    setValue: function (value) { lifecycle.setValue(value,{source:'api'}); return api; },
    getValue: lifecycle.getValue, updateOptions: updateOptions,
    getState: function () { var state=lifecycle.getState(); return Object.freeze({ value: state.value, uploading: state.uploading, disabled: opts.disabled===true, dragging: root.classList.contains('is-dragover'), listType: opts.listType, previewOpen: !!previewModal || mediaPreviewOpen(), previewType: previewMediaController && mediaPreviewOpen() ? (mediaPreviewState().previewType || 'media') : (previewModal ? 'document' : ''), destroyed: destroyed }); },
    getLifecycle: function () { return lifecycle; }, getFormField: function () { return formBridge ? formBridge.getFormField() : null; }, getFormBridge: function () { return formBridge; }, getReorderInteraction: function () { return reorderInteraction; }, getRootElement: function () { return root; }, getInputElement: function () { return input; }, getTriggerElement: function () { return trigger; }, getListElement: function () { return list; }, getPreviewElement: function () { return previewMediaController && mediaPreviewPresent() ? previewMediaController.getPreviewElement() : previewModal; }, getPreviewMaskElement: function () { return previewMediaController && mediaPreviewPresent() ? previewMediaController.getPreviewMaskElement() : previewMask; }, getPreviewPanelElement: function () { return previewMediaController && mediaPreviewPresent() ? previewMediaController.getPreviewStageElement() : previewPanel; }, getPreviewMediaElement: function () { return previewMediaController && mediaPreviewPresent() ? previewMediaController.getPreviewMediaElement() : null; }, getPreviewOverlayRuntime: function () { return previewMediaController && mediaPreviewPresent() ? previewMediaController.getPreviewOverlayRuntime() : previewOverlay; },
    destroy: function () { if (destroyed) return false; destroyed=true; if (previewModal) closePreview('destroy'); if (previewMediaController) { previewMediaController.destroy(); previewMediaController=null; previewUid=''; } Object.keys(objectUrls).forEach(revokeObjectUrl); if (reorderInteraction) reorderInteraction.destroy(); reorderInteraction=null; lifecycle.destroy(); scope.dispose(); if (formBridge) formBridge.destroy(); formBridge=null; root.remove(); return true; }
  });
  syncStructure(); renderList();
  return api;
}

export const Upload = Object.freeze({
    definition: Object.freeze({ initializer: Object.freeze({ mode: 'create', bind: 'source' }) }),
    create,
    enhance: function (input, options) { return create(input, options || {}); },
    LIST_IGNORE: UploadLifecycle.LIST_IGNORE
});
export { create };
export default Upload;
