
import { Utils } from '../utils/utils.js';
import { Events } from './events.js';

function createSearchState(options) {
  var opts = options || {}, query = String(opts.query || ''), destroyed = false, emitter = Events.createEmitter();
  function normalize(value) { return Utils.isFunction(opts.normalize) ? String(opts.normalize(value)) : String(value == null ? '' : value); }
  function set(next, meta) {
    if (destroyed) return false;
    var value = normalize(next);
    if (value === query) return true;
    var previous = query; query = value;
    var detail = Object.assign({ query: query, previousQuery: previous, source: 'api', reason: 'search' }, meta || {});
    if (detail.notify !== false && Utils.isFunction(opts.onChange)) opts.onChange(query, detail);
    if (detail.silent !== true) emitter.emit('change', detail);
    return true;
  }
  function match(text, item, context) {
    if (!query) return true;
    if (Utils.isFunction(opts.filter)) return opts.filter(query, text, item, context || {}) !== false;
    return String(text == null ? '' : text).toLowerCase().indexOf(query.toLowerCase()) >= 0;
  }
  function destroy() { if (destroyed) return false; destroyed = true; emitter.dispose(); return true; }
  function updateOptions(next) { if (destroyed) return api; opts = Object.assign({}, opts, next || {}); return api; }
  function filter(items, textOf, contextOf) {
    var source = Array.isArray(items) ? items : [];
    if (!query) return source.slice();
    return source.filter(function (item, index) {
      var text = Utils.isFunction(textOf) ? textOf(item, index) : item;
      var context = Utils.isFunction(contextOf) ? contextOf(item, index) : { index:index };
      return match(text, item, context);
    });
  }
  var api = { set: set, clear: function (meta) { return set('', Object.assign({ reason: 'clear-search' }, meta || {})); }, match: match, filter:filter, updateOptions:updateOptions, on: emitter.on, destroy: destroy };
  Object.defineProperties(api, { query: { enumerable: true, get: function () { return query; } }, destroyed: { enumerable: true, get: function () { return destroyed; } } });
  return api;
}

export const SearchState = Object.freeze({ create: createSearchState });
export { createSearchState };
