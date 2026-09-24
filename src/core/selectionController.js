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

function create(options) {
  var settings = options || {};
  var channelSpecs = settings.channels && typeof settings.channels === 'object'
    ? settings.channels : { selected: settings.selection || {} };
  var channels = new Map();
  var anchors = new Map();
  var revisionSources = new Map();
  var localRevisions = new Map();
  var destroyed = false;
  var defaultRevisionSource = isRevisionSource(settings.revisionSource) ? settings.revisionSource : null;
  var configuredRevisionSources = settings.revisionSources && typeof settings.revisionSources === 'object' ? settings.revisionSources : null;

  Object.keys(channelSpecs).forEach(function (rawName) {
    var name = normalizeChannelName(rawName);
    var spec = channelSpecs[rawName] || {};
    channels.set(name, Selection.create(spec));
  });
  if (!channels.size) channels.set('selected', Selection.create({}));

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
    return Object.freeze({
      channels: Object.freeze(channelState),
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
    return true;
  }

  var api = {
    getChannel: requireChannel,
    hasChannel: function (name) { return !destroyed && channels.has(String(name || defaultChannelName())); },
    channelNames: function () { return Array.from(channels.keys()); },
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
