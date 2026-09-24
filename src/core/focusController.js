import { DOM } from './dom.js';
import { FocusManager } from './focusManager.js';
import { FocusScope } from './focusScope.js';
import { KeyboardRegion } from './keyboardRegion.js';
import { Utils } from '../utils/utils.js';

function resolveElement(value) {
  var node = Utils.isFunction(value) ? value() : value;
  return node && node.nodeType === 1 ? node : null;
}

function create(options) {
  var settings = Utils.mergeOwn(options || {});
  var root = resolveElement(settings.root);
  if (!root) throw new TypeError('[QXFRAME9A7C2] FocusController root is required.');
  var documentRef = settings.document || root.ownerDocument || globalThis.document;
  var ownsRegion = !settings.region;
  var region = settings.region || KeyboardRegion.create(settings);
  var activeRegion = settings.activeRegion === undefined || settings.activeRegion === null ? null : String(settings.activeRegion);
  var returnTarget = settings.returnTarget || null;
  var editLease = null;
  var revision = 0;
  var destroyed = false;
  var api = null;

  function setActiveRegion(next, meta) {
    if (destroyed) return false;
    var normalized = next === undefined || next === null || next === '' ? null : String(next);
    if (normalized === activeRegion) return true;
    var previous = activeRegion;
    activeRegion = normalized;
    revision += 1;
    if (Utils.isFunction(settings.onRegionChange)) settings.onRegionChange(activeRegion, Object.freeze({
      activeRegion: activeRegion,
      previousRegion: previous,
      source: meta && meta.source || 'api',
      reason: meta && meta.reason || 'region-change',
      originalEvent: meta && meta.originalEvent || null,
      focusController: api
    }));
    return true;
  }

  function setReturnTarget(next) {
    if (destroyed) return false;
    if (next !== null && next !== undefined && !Utils.isFunction(next) && !(next && next.nodeType === 1)) {
      throw new TypeError('[QXFRAME9A7C2] FocusController returnTarget must be an Element, function, or null.');
    }
    if (returnTarget === next) return true;
    returnTarget = next || null;
    revision += 1;
    return true;
  }

  function restoreFocus(options) {
    if (destroyed) return false;
    var target = resolveElement(returnTarget);
    return !!target && DOM.focusElement(target, Utils.mergeOwn({ preventScroll:true }, options || {}));
  }

  function beginEdit(target, meta) {
    if (destroyed) return false;
    var editor = resolveElement(target);
    if (!editor) throw new TypeError('[QXFRAME9A7C2] FocusController edit lease requires an Element.');
    if (editLease && editLease.target === editor) return editLease;
    editLease = Object.freeze({
      target: editor,
      region: activeRegion,
      source: meta && meta.source || 'api',
      reason: meta && meta.reason || 'edit-begin'
    });
    revision += 1;
    return editLease;
  }

  function endEdit(meta) {
    if (destroyed || !editLease) return false;
    var previous = editLease;
    editLease = null;
    revision += 1;
    if (meta && meta.restore === true && previous.target) DOM.focusElement(root, { preventScroll:true });
    return true;
  }

  function bindVirtualFocus(options) {
    if (destroyed) return null;
    var local = Utils.mergeOwn(options || {});
    if (!local.controller) local.controller = region.virtualFocus;
    local.region = region;
    local.keyboard = region.keyboard;
    if (!local.root) local.root = root;
    return KeyboardRegion.bindVirtualFocus(local);
  }

  function update(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    if (Object.prototype.hasOwnProperty.call(next, 'activeRegion')) setActiveRegion(next.activeRegion, { source:'options', reason:'active-region' });
    if (Object.prototype.hasOwnProperty.call(next, 'returnTarget')) setReturnTarget(next.returnTarget);
    region.update(next);
    return api;
  }

  function getState() {
    var virtualState = region && region.virtualFocus && Utils.isFunction(region.virtualFocus.getState) ? region.virtualFocus.getState() : null;
    return Object.freeze({
      activeRegion: activeRegion,
      activeKey: virtualState && virtualState.key || null,
      domain: virtualState && virtualState.domain || null,
      modality: virtualState && virtualState.modality || null,
      realFocusOwned: !!(documentRef && documentRef.activeElement === root),
      hosted: !!(region && region.hosted === true),
      disabled: !!(region && region.disabled === true),
      editLease: editLease,
      editLeaseActive: !!editLease,
      revision: revision,
      destroyed: destroyed
    });
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    editLease = null;
    returnTarget = null;
    revision += 1;
    if (ownsRegion && region) region.destroy();
    region = null;
    return true;
  }

  api = {
    keyboard: region.keyboard,
    virtualFocus: region.virtualFocus,
    bindVirtualFocus: bindVirtualFocus,
    setActiveRegion: setActiveRegion,
    setReturnTarget: setReturnTarget,
    restoreFocus: restoreFocus,
    beginEdit: beginEdit,
    endEdit: endEdit,
    update: update,
    setHosted: function (value) { if (!destroyed) region.setHosted(value === true); return api; },
    setDisabled: function (value) { if (!destroyed) region.setDisabled(value === true); return api; },
    focus: function (focusOptions) { return !destroyed && region ? region.focus(focusOptions) : false; },
    getState: getState,
    destroy: destroy
  };

  Object.defineProperties(api, {
    activeRegion: { enumerable:true, get:function () { return activeRegion; } },
    activeKey: { enumerable:true, get:function () { var state=getState(); return state.activeKey; } },
    hosted: { enumerable:true, get:function () { return !!(region && region.hosted); } },
    disabled: { enumerable:true, get:function () { return !!(region && region.disabled); } },
    destroyed: { enumerable:true, get:function () { return destroyed; } }
  });
  return api;
}

export const FocusController = Object.freeze({
  create,
  bindVirtualFocus: KeyboardRegion.bindVirtualFocus,
  forwardHandlers: KeyboardRegion.forwardHandlers,
  createManager: FocusManager.create,
  createScope: FocusScope.create
});
export { create };
