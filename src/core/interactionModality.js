
import { DOM } from './dom.js';

const global = globalThis;

var states = typeof WeakMap === 'function' ? new WeakMap() : null;
var MODALITIES = Object.freeze(['keyboard', 'pointer', 'touch', 'programmatic']);
function normalizeModality(value) {
  var normalized = String(value || 'pointer').toLowerCase();
  return MODALITIES.indexOf(normalized) >= 0 ? normalized : 'pointer';
}

  function setup(doc) {
    doc = doc || global.document;
    if (!doc) return null;
    var existing = states && states.get(doc);
    if (existing) return existing;
    var root = doc.documentElement;
    var listeners = [];
    var modality = root && root.classList && root.classList.contains('qxframe9a7c2-keyboard-modality') ? 'keyboard' : 'pointer';
    function project() { if (root && root.classList) root.classList.toggle('qxframe9a7c2-keyboard-modality', modality === 'keyboard'); }
    function set(next, event) {
      var value = normalizeModality(next);
      if (modality === value) { project(); return false; }
      modality = value; project();
      listeners.slice().forEach(function (handler) { handler(modality, event || null); });
      return true;
    }
    var cleanups = [
      DOM.listen(doc, 'keydown', function (event) { if (!event.metaKey && !event.ctrlKey && !event.altKey) set('keyboard', event); }, true),
      DOM.listen(doc, 'pointerdown', function (event) { set(event && event.pointerType === 'touch' ? 'touch' : 'pointer', event); }, true),
      DOM.listen(doc, 'mousedown', function (event) { set('pointer', event); }, true),
      DOM.listen(doc, 'touchstart', function (event) { set('touch', event); }, true)
    ];
    var state = {
      get: function () { return modality; },
      isKeyboard: function () { return modality === 'keyboard'; },
      set: set,
      onChange: function (handler) {
        if (typeof handler !== 'function') throw new TypeError('[QXFRAME9A7C2] InteractionModality onChange handler must be a function.');
        listeners.push(handler); var active = true;
        return function () { if (!active) return false; active = false; var index = listeners.indexOf(handler); if (index >= 0) listeners.splice(index, 1); return index >= 0; };
      },
      destroy: function () { cleanups.splice(0).forEach(function (cleanup) { cleanup(); }); listeners.length = 0; if (root && root.classList) root.classList.remove('qxframe9a7c2-keyboard-modality'); if (states) states.delete(doc); }
    };
    if (states) states.set(doc, state);
    project();
    return state;
  }
  function current(doc) { var state = setup(doc); return state ? state.get() : 'pointer'; }
  function isKeyboard(doc) { var state = setup(doc); return !!(state && state.isKeyboard()); }
  function onChange(handler, doc) { var state = setup(doc); return state ? state.onChange(handler) : function () {}; }
  function set(value, doc, event) { var state = setup(doc); return state ? state.set(value, event) : false; }
  function destroy(doc) { doc = doc || global.document; var state = states && doc ? states.get(doc) : null; if (!state) return false; state.destroy(); return true; }

  function bootstrapInteractionModality(doc) { return current(doc || global.document); }

export const InteractionModality = Object.freeze({ current, isKeyboard, onChange, set, destroy, modalities: MODALITIES });
export const InputModality = InteractionModality;
export { current, isKeyboard, onChange, set, destroy, bootstrapInteractionModality };
