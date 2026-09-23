// Canonical ESM owner for the Item building block.
// Pure DOM/item projection capability; intentionally not a Component subclass because it has no instance lifecycle.
import { Utils } from '../utils/utils.js';
import { DOM } from '../core/dom.js';
import { DOMProjection } from '../core/domProjection.js';

      let CLASS_PROJECTION = typeof WeakMap === 'function' ? new WeakMap() : null;
      let STYLE_PROJECTION = typeof WeakMap === 'function' ? new WeakMap() : null;
      let APPEARANCES = Object.freeze(['checkbox', 'check-start', 'check-end', 'highlight']);
      let APPEARANCE_BY_NODE = typeof WeakMap === 'function' ? new WeakMap() : null;
      let STATE_CLASSES = Object.freeze({
        hover: 'is-hover',
        active: 'is-active',
        selected: 'is-selected',
        open: 'is-open',
        indeterminate: 'is-indeterminate',
        descendantSelected: 'is-descendant-selected',
        disabled: 'is-disabled',
        readOnly: 'is-readonly'
      });
    
      function normalizeSelectionAppearance(value, fallback) {
        let appearance = String(value === undefined || value === null || value === '' ? (fallback || 'highlight') : value).toLowerCase();
        if (APPEARANCES.indexOf(appearance) < 0) {
          throw new TypeError('[QXFRAME9A7C2] selectionAppearance must be checkbox, check-start, check-end, or highlight.');
        }
        return appearance;
      }
    
      function selectionPosition(appearance) {
        let normalized = normalizeSelectionAppearance(appearance);
        if (normalized === 'check-end') return 'end';
        if (normalized === 'highlight') return 'none';
        return 'start';
      }
    
      function applySelectionAppearance(node, appearance) {
        if (!node) return null;
        let normalized = normalizeSelectionAppearance(appearance);
        if (APPEARANCE_BY_NODE) APPEARANCE_BY_NODE.set(node, normalized);
        APPEARANCES.forEach(function (name) { node.classList.toggle('is-selection-' + name, name === normalized); });
        node.classList.add('qxframe9a7c2-item-surface');
        return node;
      }
    
    
      function syncState(node, state) {
        if (!node) return null;
        let next = state || {};
        Object.keys(STATE_CLASSES).forEach(function (name) {
          if (!Object.prototype.hasOwnProperty.call(Object(next), name)) return;
          node.classList.toggle(STATE_CLASSES[name], next[name] === true);
        });
        return node;
      }
    
      function createSelectionIndicator(options) {
        let opts = options || {};
        let doc = opts.document || globalThis.document;
        let appearance = normalizeSelectionAppearance(opts.appearance);
        if (appearance === 'highlight') return null;
        let checkbox = appearance === 'checkbox';
        let node = doc.createElement('span');
        node.className = 'qxframe9a7c2-item-selection-indicator ' + (checkbox ? 'is-checkbox' : 'is-check') + ' is-' + selectionPosition(appearance);
        if (APPEARANCE_BY_NODE) APPEARANCE_BY_NODE.set(node, appearance);
        if (!checkbox) {
          let glyph = doc.createElement('span');
          glyph.className = 'qxframe9a7c2-item-selection-icon';
          node.appendChild(glyph);
        }
        syncSelectionIndicator(node, opts);
        return node;
      }
    
      function syncSelectionIndicator(node, options) {
        if (!node) return null;
        let opts = options || {};
        let appearance = normalizeSelectionAppearance(opts.appearance || (APPEARANCE_BY_NODE && APPEARANCE_BY_NODE.get(node)) || 'highlight');
        if (APPEARANCE_BY_NODE) APPEARANCE_BY_NODE.set(node, appearance);
        let checked = opts.checked === true;
        let indeterminate = opts.indeterminate === true;
        node.classList.toggle('is-checked', checked);
        node.classList.toggle('is-indeterminate', indeterminate);
        node.classList.toggle('is-disabled', opts.disabled === true);
        let iconNames = ['qxframe9a7c2-icon','qxframe9a7c2-icon-minus','qxframe9a7c2-icon-check','is-line','is-round','is-stroke-3'];
        iconNames.forEach(function (name) { node.classList.remove(name); });
        let selectionIcon = node.querySelector('.qxframe9a7c2-item-selection-icon');
        if (appearance === 'checkbox') {
          if (selectionIcon && selectionIcon.parentNode === node) node.removeChild(selectionIcon);
          // One pseudo-element in the shared Choice surface paints checkbox state.
        } else {
          if (!selectionIcon) {
            selectionIcon = (node.ownerDocument || globalThis.document).createElement('span');
            selectionIcon.className = 'qxframe9a7c2-item-selection-icon';
            node.appendChild(selectionIcon);
          }
          selectionIcon.className = 'qxframe9a7c2-item-selection-icon';
          if (indeterminate || checked) selectionIcon.classList.add('qxframe9a7c2-icon','qxframe9a7c2-icon-' + (indeterminate ? 'minus' : 'check'),'is-line','is-round','is-stroke-3');
        }
        return node;
      }
    
    
      function normalizeClasses(value, item, ctx) {
        if (typeof value === 'function') value = value(item, ctx || {});
        let result = [];
        function append(input) {
          if (!input) return;
          if (typeof input === 'string') { input.split(/\s+/).forEach(function (name) { if (name && result.indexOf(name) < 0) result.push(name); }); return; }
          if (Array.isArray(input)) { input.forEach(append); return; }
          if (typeof input === 'object') { Object.keys(input).forEach(function (name) { if (input[name]) append(name); }); return; }
          append(String(input));
        }
        append(value);
        return result;
      }
    
      function projectionMap(store, node) {
        if (!store) return null;
        let map = store.get(node);
        if (!map) { map = Object.create(null); store.set(node, map); }
        return map;
      }

      function replaceProjection(store, node, key, apply) {
        let map = projectionMap(store, node);
        if (!map) return null;
        if (map[key]) map[key].destroy();
        let lease = DOMProjection.create();
        apply(lease);
        map[key] = lease;
        return lease;
      }

      function clearProjection(store, node, slot) {
        if (!node || !store) return;
        let map = store.get(node); if (!map) return;
        let keys = slot === undefined ? Object.keys(map) : [String(slot)];
        keys.forEach(function (key) { if (map[key]) map[key].destroy(); delete map[key]; });
        if (!Object.keys(map).length) store.delete(node);
      }

      function projectClasses(node, resolver, item, ctx, slot) {
        if (!node || !node.classList) return [];
        let key = String(slot || 'default');
        let next = normalizeClasses(resolver, item, ctx || {});
        if (!next.length) { clearProjection(CLASS_PROJECTION, node, key); return next; }
        replaceProjection(CLASS_PROJECTION, node, key, function (lease) {
          next.forEach(function (name) { lease.addClass(node, name); });
        });
        return next;
      }
    
      function clearProjectedClasses(node, slot) { clearProjection(CLASS_PROJECTION, node, slot); }
    
      function normalizeStyles(value, item, ctx) {
        if (typeof value === 'function') value = value(item, ctx || {});
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        let result = {};
        Object.keys(value).forEach(function (name) {
          let styleValue = value[name];
          if (styleValue === undefined || styleValue === null || styleValue === false) return;
          let property = String(name).replace(/[A-Z]/g, function (letter) { return '-' + letter.toLowerCase(); });
          result[property] = String(styleValue);
        });
        return result;
      }
    
      function projectStyles(node, resolver, item, ctx, slot) {
        if (!node || !node.style) return {};
        let key = String(slot || 'default');
        let next = normalizeStyles(resolver, item, ctx || {});
        let properties = Object.keys(next);
        if (!properties.length) { clearProjection(STYLE_PROJECTION, node, key); return next; }
        replaceProjection(STYLE_PROJECTION, node, key, function (lease) {
          properties.forEach(function (property) { lease.setStyle(node, property, next[property]); });
        });
        return next;
      }
    
      function clearProjectedStyles(node, slot) { clearProjection(STYLE_PROJECTION, node, slot); }

      function clearProjections(node, deep) {
        if (!node) return;
        clearProjection(CLASS_PROJECTION, node);
        clearProjection(STYLE_PROJECTION, node);
        if (deep === true && node.querySelectorAll) {
          Array.prototype.forEach.call(node.querySelectorAll('*'), function (child) {
            clearProjection(CLASS_PROJECTION, child);
            clearProjection(STYLE_PROJECTION, child);
          });
        }
      }
    
      function createParts(factories, options) {
        let source = factories || {};
        let claimed = Object.create(null);
        let parts = {};
        Object.keys(source).forEach(function (name) {
          if (typeof source[name] !== 'function') return;
          parts[name] = function (argument) {
            let claimKey = name + (name === 'action' && argument !== undefined ? ':' + String(argument) : '');
            if (claimed[claimKey]) return null;
            claimed[claimKey] = true;
            return source[name](argument, options || {});
          };
        });
        return Object.freeze(parts);
      }
    
      function createContext(item, details) {
        let source = details || {};
        let context = {};
        Utils.copyOwn(context, source);
        context.index = Number.isFinite(Number(source.index)) ? Number(source.index) : 0;
        context.key = source.key === undefined || source.key === null ? '' : String(source.key);
        context.element = source.element || null;
        context.component = source.component || source.controller || null;
        context.controller = source.controller || source.component || null;
        context.disabled = source.disabled === true;
        context.selected = source.selected === true;
        context.active = source.active === true;
        context.parts = source.parts && typeof source.parts === 'object' ? source.parts : Object.freeze({});
        return Object.freeze(context);
      }
    

export const Item = Object.freeze({
        appearances: APPEARANCES,
        normalizeSelectionAppearance: normalizeSelectionAppearance,
        selectionPosition: selectionPosition,
        applySelectionAppearance: applySelectionAppearance,
        createSelectionIndicator: createSelectionIndicator,
        syncSelectionIndicator: syncSelectionIndicator,
        syncState: syncState,
        normalizeClasses: normalizeClasses,
        projectClasses: projectClasses,
        clearProjectedClasses: clearProjectedClasses,
        normalizeStyles: normalizeStyles,
        projectStyles: projectStyles,
        clearProjectedStyles: clearProjectedStyles,
        clearProjections: clearProjections,
        createParts: createParts,
        createContext: createContext,
        stateClasses: STATE_CLASSES
      });

export default Item;
