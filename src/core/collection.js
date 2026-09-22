// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';
import { Events } from './events.js';
import { mergeOptions } from './options.js';

function defaultKey(item, index) {
    if (item && typeof item === 'object') {
      if (item.key !== undefined) return item.key;
      if (item.value !== undefined) return item.value;
      if (item.id !== undefined) return item.id;
    }
    return item === undefined || item === null ? index : item;
  }

  function defaultLabel(item, index) {
    if (item && typeof item === 'object') {
      if (item.label !== undefined) return item.label;
      if (item.title !== undefined) return item.title;
      if (item.name !== undefined) return item.name;
    }
    return defaultKey(item, index);
  }

  function defaultValue(item, index) {
    if (item && typeof item === 'object' && item.value !== undefined) return item.value;
    return defaultKey(item, index);
  }

  function defaultChildren(item) {
    if (!item || typeof item !== 'object') return [];
    var children = item.children !== undefined ? item.children : item.items;
    return Array.isArray(children) ? children : [];
  }

  function create(options) {
    var opts = mergeOptions({}, options);
    var localItems = Array.isArray(opts.items) ? opts.items.slice() : [];
    var emitter = Events.createEmitter();
    var destroyed = false;
    var mutationVersion = 0;
    var api = null;

    function currentItems() {
      if (destroyed) return [];
      var source = Utils.isFunction(opts.getItems) ? opts.getItems() : localItems;
      return Array.isArray(source) ? source : [];
    }

    function keyOf(item, index) {
      var getter = Utils.isFunction(opts.getKey) ? opts.getKey : defaultKey;
      var raw = getter(item, index);
      return raw === undefined || raw === null ? String(index) : String(raw);
    }

    function labelOf(item, index) {
      var getter = Utils.isFunction(opts.getLabel) ? opts.getLabel : defaultLabel;
      return getter(item, index);
    }

    function valueOf(item, index) {
      var getter = Utils.isFunction(opts.getValue) ? opts.getValue : defaultValue;
      return getter(item, index);
    }

    function childrenOf(item, index) {
      var getter = Utils.isFunction(opts.getChildren) ? opts.getChildren : defaultChildren;
      var value = getter(item, index);
      return Array.isArray(value) ? value : [];
    }

    function disabledOf(item, index) {
      if (Utils.isFunction(opts.isDisabled)) return opts.isDisabled(item, index) === true;
      return !!(item && typeof item === 'object' && item.disabled === true);
    }

    function entryAt(index) {
      var source = currentItems();
      if (!Number.isInteger(index) || index < 0 || index >= source.length) return null;
      var item = source[index];
      return Object.freeze({
        item: item,
        index: index,
        key: keyOf(item, index),
        label: labelOf(item, index),
        value: valueOf(item, index),
        children: childrenOf(item, index).slice(),
        disabled: disabledOf(item, index)
      });
    }

    function entries() {
      return currentItems().map(function (_, index) { return entryAt(index); });
    }

    function indexOf(key) {
      var normalized = String(key);
      var source = currentItems();
      for (var index = 0; index < source.length; index += 1) {
        if (keyOf(source[index], index) === normalized) return index;
      }
      return -1;
    }

    function commitItems(nextItems, meta) {
      if (destroyed) return { changed: false, reason: 'destroyed' };
      if (Utils.isFunction(opts.getItems) && !Utils.isFunction(opts.setItems)) {
        return { changed: false, reason: 'readonly' };
      }

      var previous = currentItems().slice();
      var next = Array.isArray(nextItems) ? nextItems.slice() : [];
      var payload = mergeOptions({
        previousItems: previous,
        items: next.slice(),
        reason: 'set-items',
        source: 'api',
        controller: api
      }, meta);

      var versionBefore = mutationVersion;
      if (Utils.isFunction(opts.beforeItemsChange) && opts.beforeItemsChange(payload) === false) {
        payload.changed = false;
        payload.reason = payload.reason || 'cancelled';
        return payload;
      }
      if (mutationVersion !== versionBefore) {
        payload.changed = false;
        payload.reason = 'stale-transaction';
        return payload;
      }

      if (Utils.isFunction(opts.setItems)) opts.setItems(next.slice(), payload);
      else localItems = next;
      mutationVersion += 1;

      payload.changed = true;
      payload.items = next.slice();
      if (payload.silent !== true) {
        if (Utils.isFunction(opts.onItemsChange)) opts.onItemsChange(payload.items.slice(), payload);
        emitter.emit('items-change', payload);
      }
      return payload;
    }

    function move(from, to, meta) {
      if (destroyed) return { changed: false, reason: 'destroyed' };
      var source = currentItems().slice();
      if (!source.length) return { changed: false, reason: 'empty' };

      var fromIndex = typeof from === 'number' && Number.isFinite(from)
        ? Math.trunc(from) : indexOf(from);
      var toIndex = typeof to === 'number' && Number.isFinite(to)
        ? Math.trunc(to) : indexOf(to);

      if (fromIndex < 0 || fromIndex >= source.length) return { changed: false, reason: 'missing' };
      toIndex = Math.max(0, Math.min(source.length - 1, toIndex));
      if (fromIndex === toIndex) {
        return { changed: false, reason: 'same', fromIndex: fromIndex, toIndex: toIndex };
      }

      var item = source[fromIndex];
      var payload = mergeOptions({
        item: item,
        key: keyOf(item, fromIndex),
        fromIndex: fromIndex,
        toIndex: toIndex,
        previousItems: source.slice(),
        reason: 'move',
        source: 'api',
        controller: api
      }, meta);

      if (disabledOf(item, fromIndex)) {
        payload.changed = false;
        payload.reason = 'disabled';
        return payload;
      }
      var versionBeforeMove = mutationVersion;
      if (Utils.isFunction(opts.beforeMove) && opts.beforeMove(payload) === false) {
        payload.changed = false;
        payload.reason = payload.reason || 'cancelled';
        return payload;
      }
      if (mutationVersion !== versionBeforeMove) {
        payload.changed = false;
        payload.reason = 'stale-transaction';
        return payload;
      }

      source.splice(fromIndex, 1);
      source.splice(toIndex, 0, item);
      var committed = commitItems(source, mergeOptions(payload, { silent: true }));
      if (!committed.changed) return committed;

      payload.items = source.slice();
      payload.changed = true;
      if (payload.silent !== true) {
        if (Utils.isFunction(opts.onMove)) opts.onMove(payload);
        emitter.emit('move', payload);
        if (Utils.isFunction(opts.onItemsChange)) opts.onItemsChange(payload.items.slice(), payload);
        emitter.emit('items-change', payload);
      }
      return payload;
    }

    function updateOptions(nextOptions) {
      if (destroyed) return api;
      var next = nextOptions || {};
      if (Object.keys(Object(next)).length) mutationVersion += 1;
      opts = mergeOptions(opts, next);
      if (Object.prototype.hasOwnProperty.call(Object(next), 'items')) {
        localItems = Array.isArray(next.items) ? next.items.slice() : [];
        mutationVersion += 1;
      }
      return api;
    }

    function destroy() {
      if (destroyed) return false;
      mutationVersion += 1;
      destroyed = true;
      localItems = [];
      emitter.dispose();
      return true;
    }

    api = {
      keyOf: keyOf,
      labelOf: labelOf,
      valueOf: valueOf,
      childrenOf: childrenOf,
      disabledOf: disabledOf,
      entryAt: entryAt,
      entries: entries,
      enabledEntries: function () {
        return entries().filter(function (entry) { return entry && !entry.disabled; });
      },
      indexOf: indexOf,
      itemByKey: function (key) {
        var index = indexOf(key);
        return index < 0 ? null : currentItems()[index];
      },
      setItems: commitItems,
      move: move,
      moveBy: function (key, delta, meta) {
        var index = indexOf(key);
        return move(index, index + Number(delta || 0), meta);
      },
      moveToStart: function (key, meta) { return move(key, 0, meta); },
      moveToEnd: function (key, meta) { return move(key, Math.max(0, currentItems().length - 1), meta); },
      updateOptions: updateOptions,
      on: emitter.on,
      once: emitter.once,
      destroy: destroy
    };

    Object.defineProperties(api, {
      items: { enumerable: true, get: function () { return currentItems().slice(); } },
      keys: {
        enumerable: true,
        get: function () {
          return currentItems().map(function (item, index) { return keyOf(item, index); });
        }
      },
      size: { enumerable: true, get: function () { return currentItems().length; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });

    return api;
  }

export const Collection = Object.freeze({ create });
export { create };
