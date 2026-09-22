// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

var PREFIX = 'qxframe9a7c2-motion-';
var PRESETS = Object.freeze({
  fade: PREFIX + 'fade',
  fadeUp: PREFIX + 'fade-up',
  fadeDown: PREFIX + 'fade-down',
  fadeLeft: PREFIX + 'fade-left',
  fadeRight: PREFIX + 'fade-right',
  popupPlacement: PREFIX + 'popup-placement',

  zoom: PREFIX + 'zoom',
  zoomIn: PREFIX + 'zoom',
  zoomOut: PREFIX + 'zoom-out',
  zoomBig: PREFIX + 'zoom-big',
  zoomBigFast: PREFIX + 'zoom-big-fast',
  zoomUp: PREFIX + 'zoom-up',
  zoomDown: PREFIX + 'zoom-down',
  zoomLeft: PREFIX + 'zoom-left',
  zoomRight: PREFIX + 'zoom-right',

  slideUp: PREFIX + 'slide-up',
  slideDown: PREFIX + 'slide-down',
  slideLeft: PREFIX + 'slide-left',
  slideRight: PREFIX + 'slide-right',

  moveUp: PREFIX + 'move-up',
  moveDown: PREFIX + 'move-down',
  moveLeft: PREFIX + 'move-left',
  moveRight: PREFIX + 'move-right'
});

var ALIASES = Object.freeze({
  'fade-up': 'fadeUp', 'fade-down': 'fadeDown', 'fade-left': 'fadeLeft', 'fade-right': 'fadeRight',
  'zoom-in': 'zoomIn', 'zoom-out': 'zoomOut', 'zoom-big': 'zoomBig', 'zoom-big-fast': 'zoomBigFast',
  'zoom-up': 'zoomUp', 'zoom-down': 'zoomDown', 'zoom-left': 'zoomLeft', 'zoom-right': 'zoomRight',
  'slide-up': 'slideUp', 'slide-down': 'slideDown', 'slide-left': 'slideLeft', 'slide-right': 'slideRight',
  'move-up': 'moveUp', 'move-down': 'moveDown', 'move-left': 'moveLeft', 'move-right': 'moveRight'
});

function placementBase(value) { return String(value || 'bottom').split('-')[0].toLowerCase(); }
function popup(placement) {
  var side = placementBase(placement);
  if (side === 'top') return PRESETS.slideDown;
  if (side === 'left') return PRESETS.slideRight;
  if (side === 'right') return PRESETS.slideLeft;
  return PRESETS.slideUp;
}
function drawer(placement) {
  var side = placementBase(placement);
  if (side === 'top') return PRESETS.moveUp;
  if (side === 'bottom') return PRESETS.moveDown;
  if (side === 'left') return PRESETS.moveLeft;
  return PRESETS.moveRight;
}
function canonicalName(value) {
  var name = String(value || '').trim();
  return Object.prototype.hasOwnProperty.call(PRESETS, name) ? name : (ALIASES[name] || '');
}
function has(value) { return !!canonicalName(value); }
function resolve(value) {
  if (typeof value !== 'string') return value;
  var key = canonicalName(value);
  return key ? PRESETS[key] : value;
}
function get(value) {
  var key = canonicalName(value);
  return key ? PRESETS[key] : null;
}
function names() { return Object.freeze(Object.keys(PRESETS).filter(function (name) { return name !== 'zoom'; })); }

var api = {
  resolve: resolve,
  get: get,
  has: has,
  names: names,
  popup: popup,
  drawer: drawer
};
Object.keys(PRESETS).forEach(function (name) { api[name] = PRESETS[name]; });

export const MotionPresets = Object.freeze(api);
export { PRESETS, popup, drawer, resolve, names };
