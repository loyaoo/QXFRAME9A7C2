
import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { AsyncTask } from './asyncTask.js';
import { mergeOptions } from './options.js';

const global = globalThis;

var LIST_IGNORE = Object.freeze({ __qxframe9a7c2UploadListIgnore: true });
  var uidSeed = 0;

  function own(object, key) { return Object.prototype.hasOwnProperty.call(Object(object), key); }
  function asArray(value) { return Array.isArray(value) ? value : (value == null ? [] : [value]); }
  function nextUid() { uidSeed += 1; return 'qxframe9a7c2-upload-' + Date.now().toString(36) + '-' + uidSeed.toString(36); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, Number(value || 0))); }
  function statusName(value) {
    var status = String(value || 'ready').toLowerCase();
    if (status === 'done' || status === 'success') return 'success';
    if (status === 'uploading') return 'uploading';
    if (status === 'error' || status === 'failed') return 'error';
    return 'ready';
  }
  function sourceFile(value) {
    if (!value) return null;
    if (typeof global.File === 'function' && value instanceof global.File) return value;
    if (typeof global.Blob === 'function' && value instanceof global.Blob) return value;
    if (value.file && ((typeof global.File === 'function' && value.file instanceof global.File) || (typeof global.Blob === 'function' && value.file instanceof global.Blob))) return value.file;
    return null;
  }
  function normalizeRecord(input, patch) {
    var source = input || {};
    var file = sourceFile(source);
    var record = {
      uid: source.uid != null ? String(source.uid) : nextUid(),
      name: source.name || (file && file.name) || 'file',
      size: Number(source.size != null ? source.size : (file && file.size) || 0),
      type: source.type || (file && file.type) || '',
      status: statusName(source.status),
      percent: clamp(source.percent, 0, 100),
      url: source.url || '',
      thumbUrl: source.thumbUrl || '',
      crossOrigin: source.crossOrigin || '',
      relativePath: source.relativePath || (file && file.webkitRelativePath) || '',
      response: source.response,
      error: source.error || null,
      file: file,
      skipAutoUpload: source.skipAutoUpload === true
    };
    Utils.copyOwn(record, patch || {});
    record.status = statusName(record.status);
    record.percent = clamp(record.percent, 0, 100);
    return record;
  }
  function snapshotRecord(record) {
    return Object.freeze({
      uid: record.uid, name: record.name, size: record.size, type: record.type,
      status: record.status, percent: record.percent, url: record.url,
      thumbUrl: record.thumbUrl, crossOrigin: record.crossOrigin, relativePath: record.relativePath,
      response: record.response, error: record.error, file: record.file,
      skipAutoUpload: record.skipAutoUpload === true
    });
  }
  function acceptFile(file, accept) {
    if (!accept) return true;
    var name = String(file && file.name || '').toLowerCase();
    var type = String(file && file.type || '').toLowerCase();
    return String(accept).split(',').some(function (token) {
      var rule = token.trim().toLowerCase();
      if (!rule) return false;
      if (rule.charAt(0) === '.') return name.slice(-rule.length) === rule;
      if (rule.slice(-2) === '/*') return type.indexOf(rule.slice(0, -1)) === 0;
      return type === rule;
    });
  }

  function create(options) {
    var supplied = options || {};
    var opts = mergeOptions({ multiple: false, autoUpload: true, maxCount: 0, maxSize: 0 }, supplied);
    var emitter = Events.createEmitter();
    var destroyed = false;
    var controlled = supplied.controlled === true;
    var records = asArray(own(supplied, 'value') ? supplied.value : supplied.defaultValue).map(function (item) { return normalizeRecord(item); });
    var tasks = Object.create(null);
    var mutationGeneration = 0;
    var valueRevision = 0;
    var api = null;

    function invalidatePendingMutations() {
      mutationGeneration += 1;
      return mutationGeneration;
    }

    function snapshotList(list) { return (list || []).map(snapshotRecord); }
    function snapshots() { return snapshotList(records); }
    function proposalMeta(meta, list) {
      var value = snapshotList(list);
      return mergeOptions(mergeOptions({}, meta), { value: value, proposedValue: value.slice(), controlled: true });
    }
    function findIndex(target) {
      if (typeof target === 'number' && isFinite(target)) return Math.trunc(target);
      var uid = target && typeof target === 'object' ? target.uid : target;
      uid = uid == null ? '' : String(uid);
      for (var index = 0; index < records.length; index += 1) if (records[index].uid === uid) return index;
      return -1;
    }
    function findRecord(target) { var index = findIndex(target); return index >= 0 && index < records.length ? records[index] : null; }
    function emit(reason, record, meta) {
      if (destroyed) return;
      // `operation` is the stable lifecycle verb. `reason` remains semantic metadata and
      // may be refined by an interaction owner (for example drag-sort -> drag).
      var detail = mergeOptions({ operation: reason, reason: reason, file: record ? snapshotRecord(record) : null, value: snapshots(), controlled: controlled, controller: api }, meta);
      if (detail.silent !== true) {
        if (Utils.isFunction(opts.onChange)) opts.onChange(detail.value.slice(), detail);
        emitter.emit('change', detail);
        emitter.emit(reason, detail);
      }
    }
    function reject(file, reason, extra) {
      var detail = mergeOptions({ reason: reason, file: file, controller: api }, extra);
      if (Utils.isFunction(opts.onReject)) opts.onReject(file, detail);
      emitter.emit('reject', detail);
      return detail;
    }
    function cancelTask(uid, reason) {
      var task = tasks[uid];
      if (!task) return false;
      task.cancel(reason || 'abort');
      task.destroy();
      delete tasks[uid];
      return true;
    }
    function patchRecord(record, patch, reason, meta) {
      if (!record) return null;
      Utils.copyOwn(record, patch || {});
      record.status = statusName(record.status);
      record.percent = clamp(record.percent, 0, 100);
      emit(reason || 'update', record, meta);
      return record;
    }
    function setValue(next, meta) {
      if (destroyed) return api;
      if (!(meta && meta.preservePending === true)) invalidatePendingMutations();
      var incoming = asArray(next).map(function (item) { return normalizeRecord(item); });
      var incomingUids = Object.create(null);
      incoming.forEach(function (record) { incomingUids[record.uid] = true; });
      // Controlled value reconciliation must not mean "abort everything". Only requests
      // whose uid disappeared from the controlled list lose ownership. Active request
      // records keep their object identity so late progress/completion still targets the
      // canonical record instead of a detached pre-reconcile object.
      Object.keys(tasks).forEach(function (uid) { if (!incomingUids[uid]) cancelTask(uid, 'set-value-remove'); });
      var previousByUid = Object.create(null);
      records.forEach(function (record) { previousByUid[record.uid] = record; });
      records = incoming.map(function (nextRecord) {
        var current = previousByUid[nextRecord.uid];
        var activeTask = tasks[nextRecord.uid];
        if (!current || !activeTask) return nextRecord;
        var live = { status: current.status, percent: current.percent, response: current.response, error: current.error, file: current.file };
        Utils.copyOwn(current, nextRecord);
        current.status = 'uploading';
        current.percent = live.percent;
        current.response = live.response;
        current.error = live.error;
        if (!current.file) current.file = live.file;
        return current;
      });
      valueRevision += 1;
      emit('set-value', null, meta);
      return api;
    }
    function requestValue(next, meta) {
      if (destroyed) return api;
      if (!controlled) return setValue(next, meta);
      var proposed = asArray(next).map(function (item) { return normalizeRecord(item); });
      var detail = proposalMeta(meta, proposed);
      detail.requested = true;
      detail.silent = false;
      emit('request-value', null, detail);
      return api;
    }
    function requestFor(record) {
      if (!Utils.isFunction(opts.request)) return null;
      var task = AsyncTask.create({ task: function (_, context) {
        var transformed = record.file;
        function abortError() { var error = new Error('[QXFRAME9A7C2] Upload request aborted.'); error.name = 'AbortError'; return error; }
        if (context.signal && context.signal.aborted) throw abortError();
        var transformPromise = Utils.isFunction(opts.transformFile) ? Promise.resolve(opts.transformFile(record.file, snapshotRecord(record))) : Promise.resolve(record.file);
        return transformPromise.then(function (result) {
          if (context.signal && context.signal.aborted) throw abortError();
          if (result != null) transformed = result;
          return opts.request({
            file: transformed,
            record: snapshotRecord(record),
            signal: context.signal,
            progress: function (value) {
              // A request may ignore AbortSignal and call progress after abort/retry. Only
              // the task that currently owns this uid may project progress.
              if (destroyed || !findRecord(record.uid) || tasks[record.uid] !== task) return;
              var percent = typeof value === 'number' ? value : Number(value && value.percent || 0);
              patchRecord(record, { status: 'uploading', percent: percent }, 'progress');
              if (Utils.isFunction(opts.onProgress)) opts.onProgress(percent, snapshotRecord(record), api);
            }
          });
        });
      }});
      tasks[record.uid] = task;
      return task;
    }
    function upload(target, meta) {
      if (destroyed) return Promise.reject(new Error('[QXFRAME9A7C2] UploadLifecycle is destroyed.'));
      if (target == null || target === 'all') {
        return Promise.all(records.filter(function (record) { return record.status !== 'success'; }).map(function (record) { return upload(record.uid, meta); }));
      }
      var record = findRecord(target);
      if (!record || !record.file || record.status === 'uploading') return Promise.resolve(record ? snapshotRecord(record) : null);
      if (!Utils.isFunction(opts.request)) return Promise.resolve(snapshotRecord(record));
      cancelTask(record.uid, 'restart');
      patchRecord(record, { status: 'uploading', percent: 0, error: null }, 'upload-start', meta);
      var task = requestFor(record);
      return task.run(record.file, { source: meta && meta.source || 'api' }).then(function (response) {
        if (destroyed || !findRecord(record.uid) || tasks[record.uid] !== task) return snapshotRecord(record);
        task.destroy(); delete tasks[record.uid];
        patchRecord(record, { status: 'success', percent: 100, response: response, error: null }, 'success', meta);
        if (Utils.isFunction(opts.onSuccess)) opts.onSuccess(response, snapshotRecord(record), api);
        return snapshotRecord(record);
      }, function (error) {
        if (destroyed || !findRecord(record.uid) || tasks[record.uid] !== task) throw error;
        task.destroy(); delete tasks[record.uid];
        if (error && error.name === 'AbortError') patchRecord(record, { status: 'ready', error: null }, 'abort', meta);
        else {
          patchRecord(record, { status: 'error', error: error }, 'error', meta);
          if (Utils.isFunction(opts.onError)) opts.onError(error, snapshotRecord(record), api);
        }
        throw error;
      });
    }
    function prepareFile(file, meta, sourceGeneration, workingState) {
      if (!file) return Promise.resolve(null);
      if (!acceptFile(file, opts.accept)) { reject(file, 'accept', { accept: opts.accept }); return Promise.resolve(null); }
      if (Number(opts.maxSize || 0) > 0 && Number(file.size || 0) > Number(opts.maxSize)) { reject(file, 'maxSize', { maxSize: Number(opts.maxSize) }); return Promise.resolve(null); }
      var initial = normalizeRecord(file);
      var generation = sourceGeneration === undefined ? mutationGeneration : sourceGeneration;
      var targetRecords = workingState && workingState.records ? workingState.records : records;
      var before = Utils.isFunction(opts.beforeUpload) ? Promise.resolve().then(function () { return opts.beforeUpload(file, snapshotList(targetRecords)); }) : Promise.resolve(undefined);
      return before.then(function (result) {
        if (destroyed || generation !== mutationGeneration) return null;
        if (controlled && workingState && workingState.valueRevision !== valueRevision) {
          workingState.records = records.slice();
          workingState.valueRevision = valueRevision;
          targetRecords = workingState.records;
        }
        if (result === LIST_IGNORE) return null;
        if (result === false) initial.skipAutoUpload = true;
        else if (result && ((typeof global.File === 'function' && result instanceof global.File) || (typeof global.Blob === 'function' && result instanceof global.Blob))) {
          initial = normalizeRecord(result, { uid: initial.uid, name: result.name || initial.name });
        }
        var max = Number(opts.maxCount || 0);
        if (max === 1) {
          if (!controlled) targetRecords.slice().forEach(function (old) { cancelTask(old.uid, 'replace'); });
          targetRecords.splice(0, targetRecords.length);
        } else if (max > 0 && targetRecords.length >= max) {
          reject(file, 'maxCount', { maxCount: max });
          return null;
        }
        if (opts.multiple !== true && max !== 1 && targetRecords.length) {
          if (!controlled) targetRecords.slice().forEach(function (old) { cancelTask(old.uid, 'replace'); });
          targetRecords.splice(0, targetRecords.length);
        }
        targetRecords.push(initial);
        emit('add', initial, controlled ? proposalMeta(meta, targetRecords) : meta);
        if (!controlled && opts.autoUpload !== false && !initial.skipAutoUpload && Utils.isFunction(opts.request)) {
          return upload(initial.uid, mergeOptions({ source: 'auto' }, meta)).then(function () { return snapshotRecord(initial); }, function () { return snapshotRecord(initial); });
        }
        return snapshotRecord(initial);
      }, function (error) {
        if (destroyed || generation !== mutationGeneration) return null;
        reject(file, 'beforeUpload', { error: error });
        if (Utils.isFunction(opts.onError)) opts.onError(error, snapshotRecord(initial), api);
        return null;
      });
    }
    function addFiles(files, meta) {
      if (destroyed || opts.disabled === true) return Promise.resolve([]);
      var list = Array.prototype.slice.call(files || []);
      var accepted = [];
      var generation = mutationGeneration;
      var workingState = controlled ? { records:records.slice(), valueRevision:valueRevision } : { records:records, valueRevision:valueRevision };
      var chain = Promise.resolve();
      list.forEach(function (file) {
        chain = chain.then(function () {
          if (opts.multiple !== true && accepted.length) return null;
          return prepareFile(file, meta, generation, workingState).then(function (record) { if (record) accepted.push(record); });
        });
      });
      return chain.then(function () { return accepted.slice(); });
    }
    function remove(target, meta) {
      var index = findIndex(target);
      if (index < 0 || opts.disabled === true) return false;
      var record = records[index];
      if (controlled) {
        var proposed = records.slice();
        proposed.splice(index, 1);
        emit('remove', record, proposalMeta(meta, proposed));
        return true;
      }
      cancelTask(record.uid, 'remove');
      records.splice(index, 1);
      emit('remove', record, meta);
      return true;
    }
    function move(from, to, meta) {
      var fromIndex = findIndex(from);
      var toIndex = typeof to === 'number' ? Math.trunc(to) : findIndex(to);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex || opts.disabled === true) return false;
      toIndex = Math.max(0, Math.min(records.length - 1, toIndex));
      var proposed = controlled ? records.slice() : records;
      var record = proposed.splice(fromIndex, 1)[0];
      proposed.splice(toIndex, 0, record);
      emit('move', record, controlled ? proposalMeta(mergeOptions({ fromIndex: fromIndex, toIndex: toIndex }, meta), proposed) : mergeOptions({ fromIndex: fromIndex, toIndex: toIndex }, meta));
      return true;
    }
    function abort(target, meta) {
      if (target == null || target === 'all') {
        Object.keys(tasks).forEach(function (uid) {
          var record = findRecord(uid);
          if (cancelTask(uid, 'abort') && record && record.status === 'uploading') patchRecord(record, { status: 'ready', error: null }, 'abort', meta);
        });
        return true;
      }
      var record = findRecord(target);
      if (!record) return false;
      var cancelled = cancelTask(record.uid, 'abort');
      if (cancelled && record.status === 'uploading') patchRecord(record, { status: 'ready', error: null }, 'abort', meta);
      return cancelled;
    }
    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      var previousUids = Object.create(null);
      records.forEach(function (record) { previousUids[record.uid] = true; });
      opts = mergeOptions(opts, next);
      if (own(next, 'controlled')) controlled = opts.controlled === true;
      if (own(next, 'value')) {
        setValue(next.value, { source: 'options', silent: true, preservePending: controlled === true });
        if (opts.autoUpload !== false && Utils.isFunction(opts.request)) {
          records.forEach(function (record) {
            if (previousUids[record.uid] || !record.file || record.skipAutoUpload || record.status === 'uploading' || record.status === 'success') return;
            upload(record.uid, { source: 'controlled-sync', reason: 'controlled-sync' }).catch(function () {});
          });
        }
      }
      return api;
    }
    function destroy() {
      if (destroyed) return false;
      invalidatePendingMutations();
      Object.keys(tasks).forEach(function (uid) { cancelTask(uid, 'destroy'); });
      records = [];
      destroyed = true;
      emitter.dispose();
      return true;
    }

    api = {
      addFiles: addFiles, upload: upload, retry: upload, abort: abort, remove: remove, move: move,
      setValue: setValue, requestValue: requestValue, getValue: snapshots, find: function (target) { var record = findRecord(target); return record ? snapshotRecord(record) : null; },
      updateOptions: updateOptions, on: emitter.on, once: emitter.once, destroy: destroy,
      getState: function () { return Object.freeze({ value: snapshots(), controlled: controlled, uploading: Object.keys(tasks).length, disabled: opts.disabled === true, mutationGeneration: mutationGeneration, valueRevision:valueRevision, destroyed: destroyed }); }
    };
    return api;
  }

export const UploadLifecycle = Object.freeze({ create, LIST_IGNORE });
export { create, LIST_IGNORE };
