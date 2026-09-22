
import { DOM } from './dom.js';
import { InteractionDetails } from './interactionDetails.js';
import { Utils } from '../utils/utils.js';

function create(options) {
    var settings = options || {};
    var root = settings.root;
    if (!root) throw new TypeError('[QXFRAME9A7C2] EventDelegation root is required.');
    var destroyed = false;
    var buckets = Object.create(null);
    var nextId = 1;
    var api = null;

    function pathFor(event) {
      if (event && Utils.isFunction(event.composedPath)) {
        var path = event.composedPath();
        if (Array.isArray(path) && path.length) return path;
      }
      var output = [];
      var node = event && event.target;
      while (node) {
        output.push(node);
        if (node === root) break;
        node = node.parentNode;
      }
      return output;
    }

    function matches(node, matcher, event) {
      if (!node) return false;
      if (Utils.isFunction(matcher)) return matcher(node, event, root) === true;
      if (typeof matcher === 'string') return Utils.isFunction(node.matches) && node.matches(matcher);
      return node === matcher;
    }

    function resolve(event, matcher) {
      var path = pathFor(event);
      for (var i = 0; i < path.length; i += 1) {
        var node = path[i];
        if (node === root) return matches(node, matcher, event) ? node : null;
        if (matches(node, matcher, event)) return node;
      }
      return null;
    }

    function signature(type, options) {
      var capture = options && options.capture === true;
      var passive = options && options.passive === true;
      return type + '|' + (capture ? '1' : '0') + '|' + (passive ? '1' : '0');
    }

    function on(type, matcher, handler, options) {
      if (destroyed) return function () { return false; };
      var eventType = String(type || '').trim();
      if (!eventType) throw new TypeError('[QXFRAME9A7C2] EventDelegation event type is required.');
      if (!Utils.isFunction(handler)) throw new TypeError('[QXFRAME9A7C2] EventDelegation handler must be a function.');
      if (!matcher) throw new TypeError('[QXFRAME9A7C2] EventDelegation matcher is required.');
      var local = options || {};
      var key = signature(eventType, local);
      var bucket = buckets[key];
      if (!bucket) {
        bucket = buckets[key] = { registrations: [], remove: null };
        bucket.remove = DOM.listen(root, eventType, function (event) {
          bucket.registrations.slice().forEach(function (entry) {
            if (!entry.active) return;
            var matched = resolve(event, entry.matcher);
            if (!matched) return;
            entry.handler({
              event: event,
              target: matched,
              root: root,
              controller: api,
              detail: InteractionDetails.create(eventType, event, { trigger: matched, currentTarget: root, target: matched, delegateRoot: root })
            });
          });
        }, { capture: local.capture === true, passive: local.passive === true });
      }
      var entry = { id: nextId++, matcher: matcher, handler: handler, active: true };
      bucket.registrations.push(entry);
      return function off() {
        if (!entry.active) return false;
        entry.active = false;
        var index = bucket.registrations.indexOf(entry);
        if (index >= 0) bucket.registrations.splice(index, 1);
        if (!bucket.registrations.length) {
          bucket.remove();
          delete buckets[key];
        }
        return true;
      };
    }

    function destroy() {
      if (destroyed) return false;
      Object.keys(buckets).forEach(function (key) {
        var bucket = buckets[key];
        bucket.registrations.forEach(function (entry) { entry.active = false; });
        bucket.registrations.length = 0;
        bucket.remove();
        delete buckets[key];
      });
      destroyed = true;
      return true;
    }

    api = { on: on, resolve: resolve, destroy: destroy };
    Object.defineProperties(api, {
      listenerCount: { enumerable: true, get: function () { return Object.keys(buckets).length; } },
      destroyed: { enumerable: true, get: function () { return destroyed; } }
    });
    return api;
  }

export const EventDelegation = Object.freeze({ create });
export { create };
