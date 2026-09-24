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
  var destroyed = false;
  var revisionSource = isRevisionSource(settings.revisionSource) ? settings.revisionSource : null;
  var localRevision = revisionSource ? null : DataRevision.create();

  Object.keys(channelSpecs).forEach(function (rawName) {
    var name = normalizeChannelName(rawName);
    var spec = channelSpecs[rawName] || {};
    channels.set(name, Selection.create(spec));
  });
  if (!channels.size) channels.set('selected', Selection.create({}));

  function requireChannel(name) {
    if (destroyed) throw new Error('[QXFRAME9A7C2] SelectionController is destroyed.');
    var normalized = normalizeChannelName(name || 'selected');
    var channel = channels.get(normalized);
    if (!channel) throw new RangeError('[QXFRAME9A7C2] Unknown SelectionController channel: ' + normalized);
    return channel;
  }

  function currentDataRevision() {
    if (revisionSource) {
      if (Number.isInteger(revisionSource.dataRevision)) return revisionSource.dataRevision;
      if (Utils.isFunction(revisionSource.current)) return Number(revisionSource.current()) || 0;
    }
    return localRevision ? localRevision.current() : 0;
  }

  function captureAnchor(key) {
    var normalized = key == null ? '' : String(key);
    if (!normalized) return null;
    return revisionSource ? revisionSource.createRef(normalized) : localRevision.capture(normalized);
  }

  function anchorCurrent(ref) {
    if (!ref) return false;
    return revisionSource ? revisionSource.isCurrentRef(ref) : localRevision.isCurrent(ref);
  }

  function setRevisionSource(source) {
    if (destroyed) return false;
    if (source != null && !isRevisionSource(source)) throw new TypeError('[QXFRAME9A7C2] SelectionController revisionSource must expose createRef/isCurrentRef.');
    anchors.clear();
    if (localRevision) localRevision.destroy();
    revisionSource = source || null;
    localRevision = revisionSource ? null : DataRevision.create();
    return true;
  }

  function setAnchor(channelName, key) {
    var name = normalizeChannelName(channelName || 'selected');
    requireChannel(name);
    if (key === undefined || key === null || key === '') {
      anchors.delete(name);
      return null;
    }
    var ref = captureAnchor(key);
    anchors.set(name, ref);
    return ref;
  }

  function getAnchor(channelName) {
    var name = normalizeChannelName(channelName || 'selected');
    requireChannel(name);
    var ref = anchors.get(name) || null;
    if (!ref) return null;
    if (!anchorCurrent(ref)) {
      anchors.delete(name);
      return null;
    }
    return String(ref.key);
  }

  function clearAnchor(channelName) {
    if (destroyed) return false;
    return anchors.delete(normalizeChannelName(channelName || 'selected'));
  }

  function advanceDataRevision() {
    if (destroyed || revisionSource || !localRevision) return currentDataRevision();
    anchors.clear();
    return localRevision.advance();
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
      dataRevision: currentDataRevision(),
      destroyed: destroyed
    });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    anchors.clear();
    channels.forEach(function (channel) { channel.destroy(); });
    channels.clear();
    if (localRevision) localRevision.destroy();
    localRevision = null;
    revisionSource = null;
    return true;
  }

  var api = {
    getChannel: requireChannel,
    hasChannel: function (name) { return !destroyed && channels.has(String(name || 'selected')); },
    channelNames: function () { return Array.from(channels.keys()); },
    setRevisionSource: setRevisionSource,
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
    dataRevision: { enumerable:true, get:currentDataRevision },
    destroyed: { enumerable:true, get:function () { return destroyed; } }
  });

  return api;
}

export const SelectionController = Object.freeze({ create });
export { create };
