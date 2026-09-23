import { Events } from '../core/events.js';
import { DOM } from '../core/dom.js';
import { Lifecycle } from '../core/lifecycle.js';
import { Scheduler } from '../core/scheduler.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { DOMBinding } from '../core/domBinding.js';
import { PointerSession } from '../core/pointerSession.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { mergeOptions } from '../core/options.js';
import { Utils } from '../utils/utils.js';

let DOMFactory;
var blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-color-panel" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-color-panel-saturation" tabindex="0" data-qxframe9a7c2-ref="saturation">
      <div class="qxframe9a7c2-color-panel-saturation-white" data-qxframe9a7c2-ref="saturation-white"></div>
      <div class="qxframe9a7c2-color-panel-saturation-black" data-qxframe9a7c2-ref="saturation-black"></div>
      <span class="qxframe9a7c2-color-panel-thumb" data-qxframe9a7c2-ref="saturation-thumb"></span>
    </div>
    <div class="qxframe9a7c2-color-panel-controls" data-qxframe9a7c2-ref="controls">
      <span class="qxframe9a7c2-color-panel-preview" data-qxframe9a7c2-ref="preview"></span>
      <div class="qxframe9a7c2-color-panel-sliders" data-qxframe9a7c2-ref="sliders">
        <input class="qxframe9a7c2-color-panel-hue" type="range" min="0" max="359" step="1" data-qxframe9a7c2-ref="hue">
      </div>
    </div>
    <div class="qxframe9a7c2-color-panel-fields" data-qxframe9a7c2-ref="fields">
      <button class="qxframe9a7c2-color-panel-format" type="button" data-qxframe9a7c2-ref="format">HEX</button>
      <input class="qxframe9a7c2-color-panel-input" type="text" autocomplete="off" spellcheck="false" data-qxframe9a7c2-ref="input">
    </div>
  </div>`;
    
function createDefaultDOM(context) {
  var instance = blueprint.instantiate(context.document);
  return { root: instance.root, refs: instance.refs };
}
    
    
function createAlpha(context) {
  var input = context.document.createElement('input');
  input.className = 'qxframe9a7c2-color-panel-alpha'; input.type = 'range'; input.min = '0'; input.max = '1'; input.step = '0.01';
  return input;
}
function createEye(context) {
  var button = context.document.createElement('button');
  button.type = 'button'; button.className = 'qxframe9a7c2-color-panel-eye';
  var icon = context.document.createElement('span'); icon.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-eyedropper is-line is-round is-stroke-3'; button.appendChild(icon);
  return button;
}
function createPresets(context) {
  var node = context.document.createElement('div'); node.className = 'qxframe9a7c2-color-panel-presets'; return node;
}
    
function createPreset(context) {
  var button = context.document.createElement('button');
  button.type = 'button';
  button.className = 'qxframe9a7c2-color-panel-preset';
  return button;
}
    
DOMFactory = Object.freeze({ createDefaultDOM: createDefaultDOM, createAlpha: createAlpha, createEye: createEye, createPresets: createPresets, createPreset: createPreset, blueprint: blueprint });

var FORMATS = ['hex','rgb','hsl'];
var hasOwn = Utils.own;
function clamp(value, min, max) { var number = Number(value); return Math.max(min, Math.min(max, Number.isFinite(number) ? number : 0)); }
function padHex(value) { return Math.round(clamp(value, 0, 255)).toString(16).padStart(2, '0').toUpperCase(); }
function formatName(value) {
  var name = String(value || 'hex').toLowerCase();
  if (FORMATS.indexOf(name) < 0) throw new TypeError('[QXFRAME9A7C2] ColorPanel format must be "hex", "rgb", or "hsl".');
  return name;
}
    
function rgbToHsv(r, g, b) {
  r = clamp(r, 0, 255) / 255; g = clamp(g, 0, 255) / 255; b = clamp(b, 0, 255) / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, h = 0;
  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h: h, s: max ? delta / max : 0, v: max };
}
    
function hsvToRgb(h, s, v) {
  h = ((Number(h) % 360) + 360) % 360;
  s = clamp(s, 0, 1); v = clamp(v, 0, 1);
  var c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  var r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
}
    
function rgbToHsl(r, g, b) {
  r = clamp(r, 0, 255) / 255; g = clamp(g, 0, 255) / 255; b = clamp(b, 0, 255) / 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b), lightness = (max + min) / 2, delta = max - min;
  var h = 0, s = 0;
  if (delta) {
    s = delta / (1 - Math.abs(2 * lightness - 1));
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h: h, s: s, l: lightness };
}
    
function hueToRgb(p, q, value) {
  var t = value;
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
    
function hslToRgb(h, s, l) {
  h = (((Number(h) % 360) + 360) % 360) / 360;
  s = clamp(s, 0, 1); l = clamp(l, 0, 1);
  var r = l, g = l, b = l;
  if (s) {
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}
    
function parseColor(value) {
  if (value && typeof value === 'object') {
    if (value.h !== undefined && value.s !== undefined && value.v !== undefined) {
      var hs = Number(value.s), hv = Number(value.v);
      if (![Number(value.h), hs, hv].every(Number.isFinite)) return null;
      return { h: Number(value.h), s: hs > 1 ? hs / 100 : hs, v: hv > 1 ? hv / 100 : hv, a: value.a === undefined ? 1 : clamp(value.a, 0, 1) };
    }
    if (value.r !== undefined && value.g !== undefined && value.b !== undefined) {
      if (![Number(value.r), Number(value.g), Number(value.b)].every(Number.isFinite)) return null;
      return Object.assign(rgbToHsv(Number(value.r), Number(value.g), Number(value.b)), { a: value.a === undefined ? 1 : clamp(value.a, 0, 1) });
    }
    if (value.h !== undefined && value.s !== undefined && value.l !== undefined) {
      var hslS = Number(value.s), hslL = Number(value.l);
      if (![Number(value.h), hslS, hslL].every(Number.isFinite)) return null;
      if (hslS > 1) hslS /= 100;
      if (hslL > 1) hslL /= 100;
      var hslRgb = hslToRgb(Number(value.h), hslS, hslL);
      return Object.assign(rgbToHsv(hslRgb.r, hslRgb.g, hslRgb.b), { a: value.a === undefined ? 1 : clamp(value.a, 0, 1) });
    }
    return null;
  }
    
  var text = String(value === undefined || value === null ? '' : value).trim();
  if (!text) return null;
  var match = text.match(/^#([\da-f]{3,8})$/i);
  if (match) {
    var hex = match[1];
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map(function (character) { return character + character; }).join('');
    if (hex.length === 6 || hex.length === 8) {
      var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
      var a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
      return Object.assign(rgbToHsv(r, g, b), { a: a });
    }
    return null;
  }
    
  match = text.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/i);
  if (match) {
    var rr = Number(match[1]), gg = Number(match[2]), bb = Number(match[3]);
    if (![rr,gg,bb].every(Number.isFinite) || rr < 0 || rr > 255 || gg < 0 || gg > 255 || bb < 0 || bb > 255) return null;
    return Object.assign(rgbToHsv(rr, gg, bb), { a: match[4] === undefined ? 1 : clamp(Number(match[4]) > 1 ? Number(match[4]) / 100 : Number(match[4]), 0, 1) });
  }
    
  match = text.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[, ]\s*([\d.]+)%\s*[, ]\s*([\d.]+)%(?:\s*[,/]\s*([\d.]+)%?)?\s*\)$/i);
  if (match) {
    var hh = Number(match[1]), ss = Number(match[2]), ll = Number(match[3]);
    if (![hh,ss,ll].every(Number.isFinite) || ss < 0 || ss > 100 || ll < 0 || ll > 100) return null;
    var rgb = hslToRgb(hh, ss / 100, ll / 100);
    return Object.assign(rgbToHsv(rgb.r, rgb.g, rgb.b), { a: match[4] === undefined ? 1 : clamp(Number(match[4]) > 1 ? Number(match[4]) / 100 : Number(match[4]), 0, 1) });
  }
  return null;
}
    
function formatColor(state, format, showAlpha) {
  var rgb = hsvToRgb(state.h, state.s, state.v);
  var alpha = clamp(state.a, 0, 1);
  var mode = formatName(format);
  if (mode === 'rgb') {
    return showAlpha !== false && alpha < 1
      ? 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', ' + (Math.round(alpha * 1000) / 1000) + ')'
      : 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')';
  }
  if (mode === 'hsl') {
    var hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    return showAlpha !== false && alpha < 1
      ? 'hsla(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%, ' + (Math.round(alpha * 1000) / 1000) + ')'
      : 'hsl(' + Math.round(hsl.h) + ', ' + Math.round(hsl.s * 100) + '%, ' + Math.round(hsl.l * 100) + '%)';
  }
  return '#' + padHex(rgb.r) + padHex(rgb.g) + padHex(rgb.b) + (showAlpha !== false && alpha < 1 ? padHex(alpha * 255) : '');
}
    
function cloneState(state) { return { h: state.h, s: state.s, v: state.v, a: state.a }; }
    
function create(options) {
  var incoming = options || {};
  ['colorFormat','predefine'].forEach(function (name) {
    if (hasOwn(incoming, name)) throw new TypeError('[QXFRAME9A7C2] ColorPanel does not accept legacy/non-canonical option "' + name + '".');
  });
  var opts = mergeOptions({
    value: '#1677FF', format: 'hex', showAlpha: true, presets: [],
    disabled: false, readOnly: false, keyboard: true, eyeDropper: true
  }, incoming);
  opts.format = formatName(opts.format);
    
  var initial = parseColor(opts.value);
  if (!initial) throw new TypeError('[QXFRAME9A7C2] ColorPanel value is not a supported color.');
    
  var doc = opts.document || globalThis.document;
  var host = opts.container || null;
  if (!host && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] ColorPanel container is required unless options.elements supplies existing DOM.');
    
  var emitter = Events.createEmitter();
  var scope = Lifecycle.createScope();
  var binding = DOMBinding.resolve({
    options: opts,
    target: host,
    component: null,
    requiredRefs: ['root','saturation','saturationThumb','preview','hue','format','input'],
    defaultFactory: DOMFactory.createDefaultDOM
  });
  var refs = binding.refs;
  var root = refs.root, saturation = refs.saturation, saturationThumb = refs.saturationThumb;
  var preview = refs.preview, hue = refs.hue, formatButton = refs.format;
  var controls = refs.controls || preview.parentNode, sliders = refs.sliders || hue.parentNode, fields = refs.fields || formatButton.parentNode;
  var input = refs.input;
  var alpha = refs.alpha || DOMFactory.createAlpha({ document: doc, options: opts });
  var eye = refs.eye || DOMFactory.createEye({ document: doc, options: opts });
  var presets = refs.presets || DOMFactory.createPresets({ document: doc, options: opts });
  refs.alpha = alpha; refs.eye = eye; refs.presets = presets;
  var state = initial;
  var dragging = false;
  var dragSnapshot = null;
  var keyboardSnapshot = null;
  var virtualFocusController = null, virtualFocusDomain = null, hostedVirtualFocus = false;
  var destroyed = false;
  var api = null;
  var delegation = EventDelegation.create({ root: presets });
  var presetCleanups = [];
  var presetStateFrame = Scheduler.createFrameScheduler(function () { if (!destroyed) syncPresetState(); });
  var valueProjectionFrame = Scheduler.createFrameScheduler(function () { if (!destroyed) syncValueProjection(true); });
  scope.add(function () { delegation.destroy(); });
  scope.add(function () { valueProjectionFrame.dispose(); });
    
  function attachAfter(parent, node, after) {
    if (!parent || !node) return;
    var before = after ? after.nextSibling : parent.firstChild;
    if (node.parentNode === parent && node === before) return;
    parent.insertBefore(node, before);
  }
  function detach(node) { if (node && node.parentNode) node.parentNode.removeChild(node); }
  function syncOptionalDOM() {
    if (opts.showAlpha !== false) attachAfter(sliders, alpha, hue); else detach(alpha);
    if (typeof globalThis.EyeDropper === 'function' && opts.eyeDropper !== false) fields.appendChild(eye); else detach(eye);
  }
    
  function locked() { return InteractionPolicy.mutationLocked(opts); }
  function syncInteractionLock() {
    if (!root) return;
    var disabled = opts.disabled === true;
    root.inert = disabled;
    if (disabled) root.setAttribute('inert', ''); else root.removeAttribute('inert');
  }
  function current() { return formatColor(state, opts.format, opts.showAlpha !== false); }
  function rgbaState() {
    var rgb = hsvToRgb(state.h, state.s, state.v);
    return { r: rgb.r, g: rgb.g, b: rgb.b, a: state.a };
  }
  function detail(previous, meta, complete) {
    var rgb = rgbaState();
    return {
      value: current(),
      rgba: rgb,
      hsv: { h: state.h, s: state.s * 100, v: state.v * 100 },
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      previousValue: previous ? formatColor(previous, opts.format, opts.showAlpha !== false) : null,
      source: meta && meta.source || 'api',
      reason: meta && meta.reason || 'change',
      complete: complete === true,
      colorPanel: api
    };
  }
  function emitInteractionComplete(previous, meta) {
    var payload = detail(previous, meta, true);
    if (meta && meta.cancelled === true) payload.cancelled = true;
    if (meta && meta.rolledBack === true) payload.rolledBack = true;
    if (typeof opts.onChangeComplete === 'function') opts.onChangeComplete(payload.value, payload);
    emitter.emit('changeComplete', payload);
  }
  function emitChange(previous, meta, complete) {
    var payload = detail(previous, meta, complete);
    if (typeof opts.onChange === 'function') opts.onChange(payload.value, payload);
    emitter.emit('change', payload);
    if (complete === true) emitInteractionComplete(previous, meta);
  }
    
  function renderPresets() {
    presetCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
    presets.textContent = '';
    var list = Array.isArray(opts.presets) ? opts.presets : [];
    if (!list.length) { detach(presets); return; }
    if (presets.parentNode !== root) root.appendChild(presets);
    list.forEach(function (entry) {
      var raw = entry && typeof entry === 'object' && hasOwn(entry, 'value') ? entry.value : entry;
      var label = entry && typeof entry === 'object' && hasOwn(entry, 'label') ? entry.label : raw;
      var parsed = parseColor(raw);
      if (!parsed) throw new TypeError('[QXFRAME9A7C2] ColorPanel preset value is not a supported color: ' + String(raw));
      var button = DOMFactory.createPreset({ document: doc, options: opts, entry: entry });
      DOM.setPrivate(button, 'colorPreset', String(raw));
      DOM.setPrivate(button, 'colorPresetHex', formatColor(parsed, 'hex', true).toUpperCase());
      button.style.background = formatColor(parsed, 'hex', true);
      if (typeof opts.renderPreset === 'function') {
        button.textContent = '';
        Renderer.append(button, opts.renderPreset(entry, { value: raw, label: label, colorPanel: api }));
      }
      presets.appendChild(button);
    });
  }
    
  function syncPresetState() {
    var buttons = DOM.findAllPrivate(presets, 'colorPreset');
    var activeHex = formatColor(state, 'hex', true).toUpperCase();
    var roving = null;
    Array.prototype.forEach.call(buttons, function (button) {
      var active = DOM.getPrivate(button, 'colorPresetHex') === activeHex;
      button.classList.toggle('is-active', active);
      button.disabled = opts.disabled === true;
      if (!button.disabled && !roving && active) roving = button;
    });
    if (!roving) {
      for (var i = 0; i < buttons.length; i += 1) {
        if (!buttons[i].disabled) { roving = buttons[i]; break; }
      }
    }
    Array.prototype.forEach.call(buttons, function (button) { button.tabIndex = button === roving ? 0 : -1; });
  }
    
  function syncValueProjection(deferPresetState) {
    if (destroyed || !root) return;
    var hueRgb = hsvToRgb(state.h, 1, 1);
    var rgb = rgbaState();
    saturation.style.backgroundColor = 'rgb(' + hueRgb.r + ', ' + hueRgb.g + ', ' + hueRgb.b + ')';
    saturationThumb.style.left = (state.s * 100) + '%';
    saturationThumb.style.top = ((1 - state.v) * 100) + '%';
    saturation.tabIndex = hostedVirtualFocus || locked() ? -1 : 0;
    hue.value = String(Math.round(state.h));
    alpha.value = String(state.a);
    hue.disabled = opts.disabled === true;
    alpha.disabled = opts.disabled === true;
    hue.tabIndex = opts.disabled === true ? -1 : 0;
    alpha.tabIndex = opts.disabled === true ? -1 : 0;
    preview.style.background = current();
    root.style.setProperty('--qxframe9a7c2-component-color-panel-alpha-color', 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')');
    input.value = current();
    input.disabled = opts.disabled === true;
    input.readOnly = opts.readOnly === true;
    input.tabIndex = opts.disabled === true ? -1 : 0;
    formatButton.textContent = String(opts.format).toUpperCase();
    formatButton.disabled = opts.disabled === true;
    formatButton.tabIndex = opts.disabled === true ? -1 : 0;
    eye.disabled = opts.disabled === true;
    eye.tabIndex = opts.disabled === true ? -1 : 0;
    root.classList.toggle('is-disabled', opts.disabled === true);
    root.classList.toggle('is-readonly', opts.readOnly === true);
    syncInteractionLock();
    if (deferPresetState === true) presetStateFrame.request('value');
    else { presetStateFrame.cancel(); syncPresetState(); }
  }
    
  function requestValueProjection(reason) { if (!destroyed) valueProjectionFrame.request(reason || 'color-value'); }
  function flushValueProjection(reason) {
    if (destroyed) return;
    if (!valueProjectionFrame.flush()) syncValueProjection(true);
  }
  function sync() {
    if (destroyed || !root) return;
    valueProjectionFrame.cancel();
    syncOptionalDOM();
    syncValueProjection(false);
  }
    
  function updateFromPoint(event, complete, previousOverride) {
    if (locked()) return false;
    var rect = saturation.getBoundingClientRect();
    var width = Number(rect && rect.width) || 0;
    var height = Number(rect && rect.height) || 0;
    if (width <= 0 || height <= 0) return false;
    var previous = previousOverride ? cloneState(previousOverride) : cloneState(state);
    state.s = clamp((Number(event.clientX) - Number(rect.left || 0)) / width, 0, 1);
    state.v = clamp(1 - (Number(event.clientY) - Number(rect.top || 0)) / height, 0, 1);
    if (complete === true) flushValueProjection('saturation-complete'); else requestValueProjection('saturation-preview');
    emitChange(previous, { source: DOM.activationSource(event), reason: 'saturation', originalEvent: event }, complete === true);
    return true;
  }
    
  var saturationPointer = PointerSession.create({
    target: saturation,
    threshold: 0,
    getState: function () { return { disabled: opts.disabled === true, readOnly: opts.readOnly === true, loading: false }; },
    capabilities: { draggable: true },
    canStart: function () { return !locked(); },
    onStart: function (detail) {
      var event = detail.originalEvent;
      if (event && event.preventDefault) event.preventDefault();
      dragging = true;
      dragSnapshot = cloneState(state);
      updateFromPoint(event, false);
      if (virtualFocusDomain) virtualFocusDomain.activate('saturation', { source:'pointer', modality:'pointer', reason:'saturation-pointer', originalEvent:event, ensureVisible:false });
      if (!hostedVirtualFocus) DOM.focusElement(saturation);
    },
    onMove: function (detail) { if (dragging) updateFromPoint(detail.originalEvent, false); },
    onEnd: function (detail) {
      if (!dragging) return;
      dragging = false;
      updateFromPoint(detail.originalEvent, true, dragSnapshot);
      dragSnapshot = null;
    },
    onCancel: function (detail) {
      if (!dragging) return;
      dragging = false;
      var event = detail.originalEvent;
      if (dragSnapshot) {
        var preview = cloneState(state);
        state = cloneState(dragSnapshot);
        dragSnapshot = null;
        flushValueProjection('saturation-cancel');
        var cancelMeta = { source: DOM.activationSource(event), reason: 'saturation-cancel', originalEvent: event, cancelled: true, rolledBack: true };
        emitChange(preview, cancelMeta, false);
        emitInteractionComplete(preview, cancelMeta);
      }
    }
  });
  scope.add(function () { saturationPointer.destroy(); });
  function isDirectionalKey(key) { return key === 'ArrowLeft' || key === 'ArrowRight' || key === 'ArrowUp' || key === 'ArrowDown'; }
  function finishKeyboardInteraction(event, reason) {
    if (!keyboardSnapshot) return false;
    var previous = cloneState(keyboardSnapshot);
    keyboardSnapshot = null;
    flushValueProjection('saturation-keyboard-complete');
    emitChange(previous, { source: DOM.activationSource(event), reason: reason || 'saturation-keyboard-complete', originalEvent: event }, true);
    return true;
  }
  function rollbackKeyboardInteraction(event) {
    if (!keyboardSnapshot) return false;
    var preview = cloneState(state);
    state = cloneState(keyboardSnapshot);
    keyboardSnapshot = null;
    flushValueProjection('saturation-keyboard-cancel');
    var cancelMeta = { source: DOM.activationSource(event), reason: 'saturation-keyboard-cancel', originalEvent: event, cancelled: true, rolledBack: true };
    emitChange(preview, cancelMeta, false);
    emitInteractionComplete(preview, cancelMeta);
    return true;
  }
  function handleKeydown(event) {
    if (!event || locked() || opts.keyboard === false) return false;
    var step = event.shiftKey ? 0.1 : 0.02;
    if (event.key === 'Escape') {
      rollbackKeyboardInteraction(event);
      if (typeof opts.onEscape === 'function') opts.onEscape(event, api);
      return true;
    }
    if (!isDirectionalKey(event.key)) return false;
    if (!keyboardSnapshot) keyboardSnapshot = cloneState(state);
    var previous = cloneState(state);
    if (event.key === 'ArrowLeft') state.s = clamp(state.s - step, 0, 1);
    else if (event.key === 'ArrowRight') state.s = clamp(state.s + step, 0, 1);
    else if (event.key === 'ArrowUp') state.v = clamp(state.v + step, 0, 1);
    else if (event.key === 'ArrowDown') state.v = clamp(state.v - step, 0, 1);
    requestValueProjection('saturation-keyboard');
    emitChange(previous, { source: DOM.activationSource(event), reason: 'saturation-keyboard', originalEvent: event }, false);
    if (virtualFocusDomain) virtualFocusDomain.activate('saturation', { source:'keyboard', modality:'keyboard', reason:'saturation-keyboard', originalEvent:event, ensureVisible:true });
    return true;
  }
  scope.add(DOM.listen(saturation, 'keydown', function (event) {
    if (!handleKeydown(event)) return;
    if (event.preventDefault) event.preventDefault();
  }));
  scope.add(DOM.listen(saturation, 'keyup', function (event) {
    if (!isDirectionalKey(event && event.key)) return;
    finishKeyboardInteraction(event, 'saturation-keyboard-complete');
  }));
  if (globalThis && globalThis.addEventListener) scope.add(DOM.listen(globalThis, 'blur', function (event) {
    finishKeyboardInteraction(event, 'saturation-keyboard-blur');
    if (dragging) { dragging = false; if (dragSnapshot) { var initialDrag = cloneState(dragSnapshot); dragSnapshot = null; emitChange(initialDrag, { source: 'blur', reason: 'saturation-pointer-blur', originalEvent: event }, true); } }
  }));
    
  function restoreLockedNativeRange(event) {
    if (!locked()) return false;
    if (event && event.preventDefault) event.preventDefault();
    syncValueProjection(false);
    return true;
  }
  [hue, alpha].forEach(function (range) {
    scope.add(DOM.listen(range, 'pointerdown', function (event) { if (opts.readOnly === true) restoreLockedNativeRange(event); }, true));
    scope.add(DOM.listen(range, 'keydown', function (event) {
      if (opts.readOnly !== true) return;
      if (['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'].indexOf(event.key) >= 0) restoreLockedNativeRange(event);
    }, true));
  });
  scope.add(DOM.listen(hue, 'input', function (event) {
    if (restoreLockedNativeRange(event)) return;
    var previous = cloneState(state); state.h = clamp(event.target.value, 0, 359); requestValueProjection('hue-input'); emitChange(previous, { source: 'input', reason: 'hue', originalEvent: event }, false);
  }));
  scope.add(DOM.listen(hue, 'change', function (event) { if (!locked()) { flushValueProjection('hue-change'); emitChange(null, { source: 'input', reason: 'hue', originalEvent: event }, true); } else restoreLockedNativeRange(event); }));
  scope.add(DOM.listen(alpha, 'input', function (event) {
    if (restoreLockedNativeRange(event)) return;
    var previous = cloneState(state); state.a = clamp(event.target.value, 0, 1); requestValueProjection('alpha-input'); emitChange(previous, { source: 'input', reason: 'alpha', originalEvent: event }, false);
  }));
  scope.add(DOM.listen(alpha, 'change', function (event) { if (!locked()) { flushValueProjection('alpha-change'); emitChange(null, { source: 'input', reason: 'alpha', originalEvent: event }, true); } else restoreLockedNativeRange(event); }));
  scope.add(DOM.listen(formatButton, 'click', function (event) {
    if (locked()) return;
    var index = FORMATS.indexOf(opts.format);
    opts.format = FORMATS[(index + 1) % FORMATS.length];
    sync();
    var detail = { format: opts.format, source: DOM.activationSource(event), reason: 'format-button', originalEvent: event, colorPanel: api };
    if (typeof opts.onFormatChange === 'function') opts.onFormatChange(opts.format, detail);
    emitter.emit('formatChange', detail);
  }));
    
  function commitInput(event) {
    if (locked()) return false;
    var parsed = parseColor(input.value);
    if (!parsed) {
      var invalid = input.value;
      input.value = current();
      if (typeof opts.onInvalid === 'function') opts.onInvalid(invalid, { value: invalid, originalEvent: event || null, colorPanel: api });
      emitter.emit('invalid', { value: invalid, originalEvent: event || null, colorPanel: api });
      return false;
    }
    var previous = cloneState(state);
    state = parsed;
    sync();
    emitChange(previous, { source: 'input', reason: 'value-input', originalEvent: event || null }, true);
    return true;
  }
  scope.add(DOM.listen(input, 'change', commitInput));
  scope.add(DOM.listen(input, 'keydown', function (event) {
    if (event.key === 'Enter') { if (event.preventDefault) event.preventDefault(); commitInput(event); }
    else if (event.key === 'Escape' && typeof opts.onEscape === 'function') { if (event.preventDefault) event.preventDefault(); opts.onEscape(event, api); }
  }));
    
  scope.add(DOM.listen(eye, 'click', function (event) {
    if (locked() || typeof globalThis.EyeDropper !== 'function' || opts.eyeDropper === false) return;
    var request;
    try { request = new globalThis.EyeDropper().open(); }
    catch (error) { if (typeof opts.onError === 'function') opts.onError(error, { originalEvent: event, colorPanel: api }); return; }
    Promise.resolve(request).then(function (result) {
      if (!result || destroyed) return;
      setValue(result.sRGBHex, { source: 'eyedropper', reason: 'eyedropper', originalEvent: event, complete: true });
    }).catch(function (error) {
      if (error && error.name === 'AbortError') return;
      if (typeof opts.onError === 'function') opts.onError(error, { originalEvent: event, colorPanel: api });
    });
  }));
    
  delegation.on('click', DOM.privateMatcher('colorPreset'), function (payload) {
    if (locked()) return;
    setValue(DOM.getPrivate(payload.target, 'colorPreset'), { source: DOM.activationSource(payload.event), reason: 'preset', originalEvent: payload.event, complete: true });
  });
      scope.add(DOM.listen(presets, 'keydown', function (event) {
    if (!event || opts.disabled === true || ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].indexOf(event.key) < 0) return;
    var target = event.target ? DOM.closestPrivate(event.target, presets, 'colorPreset') : null;
    if (!target) return;
    var buttons = Array.prototype.filter.call(DOM.findAllPrivate(presets, 'colorPreset'), function (button) { return !button.disabled; });
    if (!buttons.length) return;
    var index = buttons.indexOf(target);
    if (index < 0) index = 0;
    var nextIndex = index;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (index - 1 + buttons.length) % buttons.length;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (index + 1) % buttons.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = buttons.length - 1;
    buttons.forEach(function (button, buttonIndex) { button.tabIndex = buttonIndex === nextIndex ? 0 : -1; });
    DOM.focusElement(buttons[nextIndex], { preventScroll:true });
    if (event.preventDefault) event.preventDefault();
  }));


  function bindVirtualFocus(controller, hosted) {
    if (!controller || !controller.registerDomain) return null;
    if (virtualFocusDomain) virtualFocusDomain.destroy();
    virtualFocusController = controller;
    hostedVirtualFocus = hosted !== false;
    saturation.tabIndex = hostedVirtualFocus || locked() ? -1 : 0;
    [hue, alpha, formatButton, input, eye].forEach(function (node) { if (node) node.tabIndex = opts.disabled === true ? -1 : 0; });
    syncPresetState();
    virtualFocusDomain = controller.registerDomain({
      name:'color-saturation',
      getElement:function(key){ return key === 'saturation' ? saturation : null; },
      reconcile:function(key){ return key === 'saturation' ? 'saturation' : 'saturation'; },
      ensureVisible:function(){ return true; }
    });
    return virtualFocusDomain;
  }
    
  function setValue(next, meta) {
    if (destroyed) return false;
    var parsed = parseColor(next);
    if (!parsed) {
      if (typeof opts.onInvalid === 'function') opts.onInvalid(next, { value: next, originalEvent: meta && meta.originalEvent || null, colorPanel: api });
      emitter.emit('invalid', { value: next, originalEvent: meta && meta.originalEvent || null, colorPanel: api });
      return false;
    }
    var previous = cloneState(state);
    state = parsed;
    sync();
    if (!(meta && meta.silent)) emitChange(previous, meta, meta && meta.complete === true);
    return true;
  }
  function setAlpha(next, meta) {
    if (destroyed) return false;
    var previous = cloneState(state);
    state.a = clamp(next, 0, 1);
    sync();
    if (!(meta && meta.silent)) emitChange(previous, mergeOptions({ reason: 'alpha' }, meta), meta && meta.complete === true);
    return true;
  }
  function setFormat(next) {
    if (destroyed) return api;
    opts.format = formatName(next);
    sync();
    return api;
  }
  function focus() {
    if (destroyed || opts.disabled === true || hostedVirtualFocus || !saturation.focus) return false;
    DOM.focusElement(saturation);
    return true;
  }
  function updateOptions(nextOptions) {
    if (destroyed) return api;
    var next = nextOptions || {};
    ['colorFormat','predefine'].forEach(function (name) { if (hasOwn(next, name)) throw new TypeError('[QXFRAME9A7C2] ColorPanel does not accept legacy/non-canonical option "' + name + '".'); });
    if (hasOwn(next, 'container') && next.container !== host) throw new Error('[QXFRAME9A7C2] ColorPanel container is immutable; destroy and recreate to change it.');
    var candidateOptions = Utils.mergeOwn( opts, next);
    candidateOptions.format = formatName(candidateOptions.format);
    var candidateState = hasOwn(next, 'value') ? parseColor(next.value) : null;
    if (hasOwn(next, 'value') && !candidateState) throw new TypeError('[QXFRAME9A7C2] ColorPanel value is not a supported color.');
    opts = candidateOptions;
    if (candidateState) state = candidateState;
    if (hasOwn(next, 'presets')) renderPresets();
    sync();
    if (binding && binding.syncClasses) binding.syncClasses(opts.classes);
    return api;
  }
  function getState() {
    var rgb = rgbaState();
    return Object.freeze({
      value: current(),
      format: opts.format,
      rgba: rgb,
      hsv: { h: state.h, s: state.s * 100, v: state.v * 100 },
      hsl: rgbToHsl(rgb.r, rgb.g, rgb.b),
      showAlpha: opts.showAlpha !== false,
      disabled: opts.disabled === true,
      readOnly: opts.readOnly === true,
      destroyed: destroyed
    });
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    dragging = false;
    if (virtualFocusDomain) virtualFocusDomain.destroy(); virtualFocusDomain = null; virtualFocusController = null;
    presetCleanups.splice(0).forEach(function (cleanup) { cleanup(); });
    if (presetStateFrame) presetStateFrame.dispose();
    scope.dispose();
    emitter.dispose();
    if (binding) binding.release();
    binding = null;
    root = saturation = saturationThumb = preview = hue = alpha = formatButton = input = eye = presets = null;
    return true;
  }
    
  api = Object.freeze({
    setValue: setValue,
    setAlpha: setAlpha,
    setFormat: setFormat,
    focus: focus,
    handleKeydown: handleKeydown,
    bindVirtualFocus: bindVirtualFocus,
    getVirtualFocusDomain: function () { return virtualFocusDomain; },
    updateOptions: updateOptions,
    getValue: current,
    getState: getState,
    getRootElement: function () { return root; },
    getSaturationElement: function () { return saturation; },
    getInputElement: function () { return input; },
    getRefs: function () { return binding ? binding.refs : null; },
    getDOMSource: function () { return binding ? binding.source : null; },
    getEventDelegation: function () { return delegation; },
    on: emitter.on,
    once: emitter.once,
    destroy: destroy
  });
    
  renderPresets();
  sync();
  return api;
}
    

export const ColorPanel = Object.freeze({ create, parseColor, formatColor, hsvToRgb, rgbToHsv, rgbToHsl, hslToRgb, createDefaultDOM: DOMFactory.createDefaultDOM });
