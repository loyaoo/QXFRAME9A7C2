import { Selection } from './selection.js';
import { HierarchicalSelection } from './hierarchicalSelection.js';
import { DataRevision } from './dataRevision.js';
import { Utils } from '../utils/utils.js';

function isRevisionSource(value) {
  return !!(value && Utils.isFunction(value.createRef) && Utils.isFunction(value.isCurrentRef));
}

function normalizeChannelName(value) {
  var name = String(value == null ? '' : value).trim();
  if (!name) throw new TypeError('[QXFRAME9A7C2] SelectionController channel name must not be empty.');
  return name;
}

function createRemoteChannel(options) {
  var opts = options || {};
  var excluded = Selection.create({ multiple:true, values:Array.isArray(opts.excludedKeys) ? opts.excludedKeys : [] });
  var revision = DataRevision.create();
  var destroyed = false;
  var allMatching = opts.allMatching === true;
  var queryKey = allMatching && opts.queryKey != null ? String(opts.queryKey) : null;
  var knownCount = Number.isFinite(Number(opts.knownCount)) ? Math.max(0, Math.floor(Number(opts.knownCount))) : null;
  var api = null;

  function notify(meta) {
    if (destroyed) return false;
    revision.advance();
    if (Utils.isFunction(opts.onChange) && !(meta && meta.silent === true)) opts.onChange(api.snapshot(), meta || {});
    return true;
  }
  function clear(meta) {
    if (destroyed) return false;
    var changed = allMatching || queryKey !== null || excluded.size > 0 || knownCount !== null;
    allMatching = false;
    queryKey = null;
    knownCount = null;
    excluded.clear({ silent:true, source:'remote-selection', reason:'clear' });
    if (changed) notify(meta);
    return true;
  }
  function setAllMatching(nextQueryKey, selected, meta) {
    if (destroyed) return false;
    if (selected === false) return clear(meta);
    var normalized = nextQueryKey == null ? '' : String(nextQueryKey);
    var changed = !allMatching || queryKey !== normalized || excluded.size > 0;
    allMatching = true;
    queryKey = normalized;
    excluded.clear({ silent:true, source:'remote-selection', reason:'all-matching' });
    if (changed) notify(meta);
    return true;
  }
  function reconcileQuery(nextQueryKey, meta) {
    if (destroyed || !allMatching) return false;
    var normalized = nextQueryKey == null ? '' : String(nextQueryKey);
    if (queryKey === normalized) return false;
    clear(meta);
    return true;
  }
  function toggle(key, selected, meta) {
    if (destroyed || !allMatching) return false;
    var normalized = key == null ? '' : String(key);
    if (!normalized) return false;
    var shouldSelect = selected === undefined ? excluded.has(normalized) : selected !== false;
    var changed = shouldSelect ? excluded.has(normalized) : !excluded.has(normalized);
    if (!changed) return true;
    if (shouldSelect) excluded.deselect(normalized, { silent:true, source:'remote-selection', reason:'include' });
    else excluded.select(normalized, { silent:true, source:'remote-selection', reason:'exclude' });
    notify(meta);
    return true;
  }
  function setKnownCount(value, meta) {
    if (destroyed) return false;
    var next = value == null || value === '' || !Number.isFinite(Number(value)) ? null : Math.max(0, Math.floor(Number(value)));
    if (knownCount === next) return true;
    knownCount = next;
    notify(meta);
    return true;
  }
  function snapshot() {
    return Object.freeze({
      allMatching:allMatching,
      queryKey:allMatching ? queryKey : null,
      excludedKeys:Object.freeze(allMatching ? excluded.values.slice() : []),
      knownCount:knownCount,
      revision:revision.current(),
      destroyed:destroyed
    });
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    excluded.destroy();
    revision.destroy();
    return true;
  }

  api = Object.freeze({
    setAllMatching:setAllMatching,
    clear:clear,
    reconcileQuery:reconcileQuery,
    toggle:toggle,
    isSelected:function (key) { return !destroyed && allMatching && !excluded.has(String(key)); },
    setKnownCount:setKnownCount,
    snapshot:snapshot,
    destroy:destroy,
    get excluded() { return destroyed ? null : excluded; },
    get allMatching() { return allMatching; },
    get queryKey() { return allMatching ? queryKey : null; },
    get knownCount() { return knownCount; },
    get revision() { return revision.current(); },
    get destroyed() { return destroyed; }
  });
  return api;
}

function create(options) {
  var settings = options || {};
  var channelSpecs = settings.channels && typeof settings.channels === 'object'
    ? settings.channels : { selected: settings.selection || {} };
  var channels = new Map();
  var anchors = new Map();
  var revisionSources = new Map();
  var localRevisions = new Map();
  var remoteChannels = new Map();
  var destroyed = false;
  var defaultRevisionSource = isRevisionSource(settings.revisionSource) ? settings.revisionSource : null;
  var configuredRevisionSources = settings.revisionSources && typeof settings.revisionSources === 'object' ? settings.revisionSources : null;

  Object.keys(channelSpecs).forEach(function (rawName) {
    var name = normalizeChannelName(rawName);
    var spec = channelSpecs[rawName] || {};
    channels.set(name, Selection.create(spec));
  });
  if (!channels.size) channels.set('selected', Selection.create({}));
  if (settings.remoteChannels && typeof settings.remoteChannels === 'object') {
    Object.keys(settings.remoteChannels).forEach(function (rawName) {
      var name = normalizeChannelName(rawName);
      remoteChannels.set(name, createRemoteChannel(settings.remoteChannels[rawName] || {}));
    });
  }

  function requireChannel(name) {
    if (destroyed) throw new Error('[QXFRAME9A7C2] SelectionController is destroyed.');
    var normalized = normalizeChannelName(name || defaultChannelName());
    var channel = channels.get(normalized);
    if (!channel) throw new RangeError('[QXFRAME9A7C2] Unknown SelectionController channel: ' + normalized);
    return channel;
  }

  function defaultChannelName() {
    if (channels.has('selected')) return 'selected';
    var iterator = channels.keys().next();
    return iterator.done ? 'selected' : iterator.value;
  }

  function configureRevision(name, source) {
    var normalized = normalizeChannelName(name);
    requireChannel(normalized);
    if (source != null && !isRevisionSource(source)) throw new TypeError('[QXFRAME9A7C2] SelectionController revisionSource must expose createRef/isCurrentRef.');
    anchors.delete(normalized);
    var local = localRevisions.get(normalized) || null;
    if (local) local.destroy();
    localRevisions.delete(normalized);
    revisionSources.delete(normalized);
    if (source) revisionSources.set(normalized, source);
    else localRevisions.set(normalized, DataRevision.create());
    return true;
  }

  channels.forEach(function (_, name) {
    var source = defaultRevisionSource;
    if (configuredRevisionSources && Object.prototype.hasOwnProperty.call(configuredRevisionSources, name)) source = configuredRevisionSources[name];
    if (source != null && !isRevisionSource(source)) throw new TypeError('[QXFRAME9A7C2] SelectionController revisionSources.' + name + ' must expose createRef/isCurrentRef.');
    if (source) revisionSources.set(name, source);
    else localRevisions.set(name, DataRevision.create());
  });

  function currentDataRevision(channelName) {
    if (destroyed) return 0;
    var name = normalizeChannelName(channelName || defaultChannelName());
    requireChannel(name);
    var source = revisionSources.get(name) || null;
    if (source) {
      if (Number.isInteger(source.dataRevision)) return source.dataRevision;
      if (Utils.isFunction(source.current)) return Number(source.current()) || 0;
    }
    var local = localRevisions.get(name) || null;
    return local ? local.current() : 0;
  }

  function captureAnchor(channelName, key) {
    var name = normalizeChannelName(channelName || defaultChannelName());
    requireChannel(name);
    var normalized = key == null ? '' : String(key);
    if (!normalized) return null;
    var source = revisionSources.get(name) || null;
    if (source) return source.createRef(normalized);
    var local = localRevisions.get(name) || null;
    return local ? local.capture(normalized) : null;
  }

  function anchorCurrent(channelName, ref) {
    if (!ref) return false;
    var name = normalizeChannelName(channelName || defaultChannelName());
    requireChannel(name);
    var source = revisionSources.get(name) || null;
    if (source) return source.isCurrentRef(ref);
    var local = localRevisions.get(name) || null;
    return !!(local && local.isCurrent(ref));
  }

  function setRevisionSource(channelName, source) {
    if (destroyed) return false;
    if (arguments.length < 2) {
      source = channelName;
      if (source != null && !isRevisionSource(source)) throw new TypeError('[QXFRAME9A7C2] SelectionController revisionSource must expose createRef/isCurrentRef.');
      channels.forEach(function (_, name) { configureRevision(name, source == null ? null : source); });
      return true;
    }
    return configureRevision(channelName || defaultChannelName(), source == null ? null : source);
  }

  function getRevisionSource(channelName) {
    if (destroyed) return null;
    var name = normalizeChannelName(channelName || defaultChannelName());
    requireChannel(name);
    return revisionSources.get(name) || null;
  }

  function setAnchor(channelName, key) {
    var name = normalizeChannelName(channelName || defaultChannelName());
    requireChannel(name);
    if (key === undefined || key === null || key === '') {
      anchors.delete(name);
      return null;
    }
    var ref = captureAnchor(name, key);
    anchors.set(name, ref);
    return ref;
  }

  function getAnchor(channelName) {
    var name = normalizeChannelName(channelName || defaultChannelName());
    requireChannel(name);
    var ref = anchors.get(name) || null;
    if (!ref) return null;
    if (!anchorCurrent(name, ref)) {
      anchors.delete(name);
      return null;
    }
    return String(ref.key);
  }

  function clearAnchor(channelName) {
    if (destroyed) return false;
    return anchors.delete(normalizeChannelName(channelName || defaultChannelName()));
  }

  function advanceChannelRevision(name) {
    var normalized = normalizeChannelName(name || defaultChannelName());
    requireChannel(normalized);
    var source = revisionSources.get(normalized) || null;
    if (source) return currentDataRevision(normalized);
    anchors.delete(normalized);
    var local = localRevisions.get(normalized) || null;
    return local ? local.advance() : 0;
  }

  function advanceDataRevision(channelName) {
    if (destroyed) return 0;
    if (channelName !== undefined && channelName !== null && channelName !== '') return advanceChannelRevision(channelName);
    if (channels.size === 1) return advanceChannelRevision(defaultChannelName());
    channels.forEach(function (_, name) { if (!revisionSources.has(name)) advanceChannelRevision(name); });
    return currentDataRevision(defaultChannelName());
  }

  function dataRevisionsSnapshot() {
    var output = {};
    channels.forEach(function (_, name) { output[name] = currentDataRevision(name); });
    return Object.freeze(output);
  }

  function snapshot() {
    var channelState = {};
    channels.forEach(function (channel, name) { channelState[name] = channel.snapshot(); });
    var anchorState = {};
    channels.forEach(function (_, name) {
      var anchor = getAnchor(name);
      if (anchor !== null) anchorState[name] = anchor;
    });
    var remoteState = {};
    remoteChannels.forEach(function (channel, name) { remoteState[name] = channel.snapshot(); });
    return Object.freeze({
      channels: Object.freeze(channelState),
      remoteChannels: Object.freeze(remoteState),
      anchors: Object.freeze(anchorState),
      dataRevision: currentDataRevision(defaultChannelName()),
      dataRevisions: dataRevisionsSnapshot(),
      destroyed: destroyed
    });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    anchors.clear();
    channels.forEach(function (channel) { channel.destroy(); });
    channels.clear();
    localRevisions.forEach(function (revision) { revision.destroy(); });
    localRevisions.clear();
    revisionSources.clear();
    remoteChannels.forEach(function (channel) { channel.destroy(); });
    remoteChannels.clear();
    return true;
  }

  var api = {
    getChannel: requireChannel,
    hasChannel: function (name) { return !destroyed && channels.has(String(name || defaultChannelName())); },
    channelNames: function () { return Array.from(channels.keys()); },
    getRemoteChannel: function (name) {
      if (destroyed) throw new Error('[QXFRAME9A7C2] SelectionController is destroyed.');
      var normalized = normalizeChannelName(name);
      var channel = remoteChannels.get(normalized);
      if (!channel) throw new RangeError('[QXFRAME9A7C2] Unknown SelectionController remote channel: ' + normalized);
      return channel;
    },
    hasRemoteChannel: function (name) { return !destroyed && remoteChannels.has(String(name || '')); },
    remoteChannelNames: function () { return Array.from(remoteChannels.keys()); },
    setRevisionSource: setRevisionSource,
    getRevisionSource: getRevisionSource,
    getDataRevision: currentDataRevision,
    setAnchor: setAnchor,
    getAnchor: getAnchor,
    clearAnchor: clearAnchor,
    advanceDataRevision: advanceDataRevision,
    createHierarchy: function (hierarchyOptions) { return HierarchicalSelection.create(hierarchyOptions || {}); },
    snapshot: snapshot,
    destroy: destroy
  };

  Object.defineProperties(api, {
    selected: { enumerable:true, get:function () { return destroyed ? null : (channels.get('selected') || null); } },
    checked: { enumerable:true, get:function () { return destroyed ? null : (channels.get('checked') || null); } },
    dataRevision: { enumerable:true, get:function () { return currentDataRevision(defaultChannelName()); } },
    dataRevisions: { enumerable:true, get:dataRevisionsSnapshot },
    destroyed: { enumerable:true, get:function () { return destroyed; } }
  });

  return api;
}

export const SelectionController = Object.freeze({ create });
export { create };
