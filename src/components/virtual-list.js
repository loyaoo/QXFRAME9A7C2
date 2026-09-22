// Stage 84→88 migration: canonical VirtualList component.
import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { DOM } from '../core/dom.js';
import { DOMBinding } from '../core/domBinding.js';
import { DOMTemplate } from '../core/domTemplate.js';
import { Renderer } from '../core/renderer.js';
import { Virtualizer } from '../core/virtualizer.js';
import { Utils } from '../utils/utils.js';
import { Item } from './item.js';

const state = new WeakMap();
const own = Utils.own;

const blueprint = DOMTemplate.staticHTML`
  <div class="qxframe9a7c2-virtual-list" data-qxframe9a7c2-ref="root">
    <div class="qxframe9a7c2-virtual-list-viewport" data-qxframe9a7c2-ref="viewport">
      <div class="qxframe9a7c2-virtual-list-spacer" data-qxframe9a7c2-ref="spacer"></div>
      <div class="qxframe9a7c2-virtual-list-layer" data-qxframe9a7c2-ref="layer"></div>
    </div>
  </div>`;

export const VirtualListDOM = Object.freeze({
    createDefaultDOM(context) {
        const instance = blueprint.instantiate(context.document);
        if ((context.options || {}).horizontal === true || (context.options || {}).orientation === 'horizontal') instance.root.classList.add('is-horizontal');
        return { root: instance.root, refs: instance.refs };
    },
    createItem(context) {
        const node = context.document.createElement('div');
        node.className = 'qxframe9a7c2-virtual-list-item';
        return node;
    },
    blueprint
});

function defaultKey(item, index) {
    if (item && typeof item === 'object') {
        if (item.key !== undefined) return item.key;
        if (item.value !== undefined) return item.value;
        if (item.id !== undefined) return item.id;
    }
    return index;
}

function defaultRenderItem(item) {
    if (item && typeof item === 'object') {
        if (item.label !== undefined) return item.label;
        if (item.title !== undefined) return item.title;
        if (item.value !== undefined) return item.value;
    }
    return item === undefined || item === null ? '' : String(item);
}

function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid VirtualList instance.');
    return record;
}

export class VirtualList extends Component {
    static immutableOptions = Object.freeze(['container', 'elements', 'createDOM', 'document']);

    static create(options = {}) {
        const instance = new this(options);
        instance.render();
        if (instance.options.container || instance.options.elements) instance.mount(instance.options.container || null);
        return instance;
    }

    static createDefaultDOM(context) { return VirtualListDOM.createDefaultDOM(context); }

    constructor(options = {}) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('[QXFRAME9A7C2] VirtualList options must be an object.');
        const doc = options.document || (options.container && options.container.ownerDocument) || globalThis.document;
        super(Object.assign({}, options, { document: doc }));
        const items = Array.isArray(options.items) ? options.items.slice() : [];
        state.set(this, {
            doc, items, host: null, root: null, viewport: null, spacer: null, layer: null,
            virtualizer: null, domBinding: null, lastGeometry: '', lastRange: '', rendered: new Map(), renderCount: 0
        });
        this.#itemKeysFor(items);
    }

    [componentHooks.render]() { return undefined; }

    [componentHooks.beforeOptionsUpdate](patch, previous) {
        if (this.mounted && own(patch, 'horizontal') && (patch.horizontal === true) !== (previous.horizontal === true)) {
            throw new Error('[QXFRAME9A7C2] VirtualList horizontal axis is immutable after mount; destroy and recreate to change it.');
        }
    }

    [componentHooks.mount](target) {
        const r = recordFor(this), opts = this.options;
        if (r.domBinding) return r.root;
        const host = target || opts.container || null;
        if (!r.doc || !Utils.isFunction(r.doc.createElement)) throw new Error('[QXFRAME9A7C2] VirtualList requires a browser DOM to mount.');
        if (!host && opts.elements == null) throw new TypeError('[QXFRAME9A7C2] VirtualList mount container must be a DOM element unless options.elements supplies existing DOM.');
        if (host && !Utils.isFunction(host.appendChild)) throw new TypeError('[QXFRAME9A7C2] VirtualList mount container must be a DOM element.');

        r.host = host;
        r.domBinding = DOMBinding.resolve({
            options: opts,
            target: host,
            component: this,
            requiredRefs: ['root', 'viewport', 'spacer', 'layer'],
            defaultFactory: VirtualListDOM.createDefaultDOM
        });
        this.own(() => { if (r.domBinding) r.domBinding.release(); r.domBinding = null; });
        r.root = r.domBinding.refs.root;
        r.viewport = r.domBinding.refs.viewport;
        r.spacer = r.domBinding.refs.spacer;
        r.layer = r.domBinding.refs.layer;
        r.root.classList.add('qxframe9a7c2-virtual-list');
        r.viewport.classList.add('qxframe9a7c2-virtual-list-viewport');
        this.#syncFocusPolicy();
        r.spacer.classList.add('qxframe9a7c2-virtual-list-spacer');
        r.layer.classList.add('qxframe9a7c2-virtual-list-layer');
        if (opts.horizontal === true) r.root.classList.add('is-horizontal');
        if (r.domBinding.syncClasses) r.domBinding.syncClasses(opts.classes);
        if (opts.height !== undefined && opts.height !== null) r.root.style.height = typeof opts.height === 'number' ? opts.height + 'px' : String(opts.height);

        r.virtualizer = Virtualizer.create({
            viewport: r.viewport,
            count: r.items.length,
            itemKeys: this.#itemKeysFor(r.items),
            overscan: Math.max(0, Math.floor(Number(opts.overscan) || 4)),
            itemSize: Number(opts.itemSize) > 0 ? Number(opts.itemSize) : undefined,
            estimateSize: Math.max(1, Number(opts.estimateSize) || 32),
            horizontal: opts.horizontal === true,
            enabled: opts.enabled !== false,
            observeResize: opts.observeResize !== false,
            preserveScrollAnchor: opts.preserveScrollAnchor !== false,
            onChange: next => this.#renderVirtualState(next, false)
        });
        this.own(r.virtualizer);
        this.#renderVirtualState({ reason: 'mount', range: r.virtualizer.getRange(), items: r.virtualizer.getVirtualItems(), totalSize: r.virtualizer.getTotalSize() }, true);
        return r.root;
    }

    [componentHooks.optionsUpdated](next, _previous, patch) {
        const r = recordFor(this);
        const hasItems = own(patch, 'items');
        const candidateItems = hasItems ? (Array.isArray(patch.items) ? patch.items.slice() : []) : r.items;
        const candidateKeys = this.#itemKeysFor(candidateItems);
        if (hasItems) { r.items = candidateItems; r.lastRange = ''; }
        if (r.root && own(patch, 'height')) r.root.style.height = typeof next.height === 'number' ? next.height + 'px' : String(next.height || '');
        if (r.viewport && own(patch, 'focusable')) this.#syncFocusPolicy();
        r.lastGeometry = '';
        if (r.virtualizer) {
            r.virtualizer.updateOptions({
                count: r.items.length,
                itemKeys: candidateKeys,
                enabled: next.enabled !== false,
                itemSize: Number(next.itemSize) > 0 ? Number(next.itemSize) : 0,
                estimateSize: Math.max(1, Number(next.estimateSize) || (Number(next.itemSize) > 0 ? Number(next.itemSize) : 32)),
                overscan: Math.max(0, Math.floor(Number(next.overscan) || 0)),
                preserveScrollAnchor: next.preserveScrollAnchor !== false
            });
        }
    }

    [componentHooks.afterDestroy]() {
        const r = state.get(this);
        if (!r) return;
        r.rendered.clear();
        r.host = r.root = r.viewport = r.spacer = r.layer = r.virtualizer = r.domBinding = null;
    }

    #syncFocusPolicy() { const r = recordFor(this); if (r.viewport) r.viewport.tabIndex = this.options.focusable === false ? -1 : 0; }
    #keyOf(item, index) { const getter = Utils.isFunction(this.options.getKey) ? this.options.getKey : defaultKey; const value = getter(item, index); return value === undefined || value === null ? String(index) : String(value); }
    #itemKeysFor(list) {
        const seen = Object.create(null);
        return list.map((item, index) => { const key = this.#keyOf(item, index); if (seen[key]) throw new TypeError('[QXFRAME9A7C2] VirtualList item keys must be unique: ' + key + '.'); seen[key] = true; return key; });
    }
    #stateSnapshot(reason) {
        const r = recordFor(this), range = r.virtualizer ? r.virtualizer.getRange() : { start: 0, end: -1, visibleStart: 0, visibleEnd: -1, total: r.items.length };
        return Object.freeze({
            reason: reason || 'state', count: r.items.length, renderedCount: r.rendered.size, renderCount: r.renderCount,
            range: Object.freeze({ start: range.start, end: range.end, visibleStart: range.visibleStart, visibleEnd: range.visibleEnd, total: range.total }),
            totalSize: r.virtualizer ? r.virtualizer.getTotalSize() : 0,
            scrollOffset: r.viewport ? Number(this.options.horizontal === true ? r.viewport.scrollLeft : r.viewport.scrollTop) || 0 : 0,
            focusable: this.options.focusable !== false, mounted: this.mounted, destroyed: this.destroyed
        });
    }
    #geometrySignature(next) {
        const parts = [next.range.start, next.range.end, next.totalSize];
        next.items.forEach(item => parts.push(item.index, Math.round(item.start * 100) / 100, Math.round(item.size * 100) / 100));
        return parts.join('|');
    }
    #clearRendered() { const r = recordFor(this); r.rendered.clear(); if (r.layer) r.layer.textContent = ''; }
    #emitRange(reason) {
        const r = recordFor(this); if (!r.virtualizer) return;
        const range = r.virtualizer.getRange(), signature = [range.start, range.end, range.visibleStart, range.visibleEnd, range.total].join('|');
        if (signature === r.lastRange) return;
        r.lastRange = signature;
        const detail = { range, reason: reason || 'range', controller: this };
        if (Utils.isFunction(this.options.onRangeChange)) this.options.onRangeChange(detail);
        if (!this.destroyed) this.emit('range-change', detail);
    }
    #renderVirtualState(next, force) {
        const r = recordFor(this); if (this.destroyed || !r.root || !next) return false;
        const signature = this.#geometrySignature(next); this.#emitRange(next.reason); if (!force && signature === r.lastGeometry) return false; r.lastGeometry = signature;
        this.#clearRendered();
        r.spacer.style.width = this.options.horizontal === true ? next.totalSize + 'px' : '1px';
        r.spacer.style.height = this.options.horizontal === true ? '1px' : next.totalSize + 'px';
        const fragment = r.doc.createDocumentFragment(); let renderAborted = false;
        next.items.forEach(virtualItem => {
            if (renderAborted || this.destroyed) return;
            const index = virtualItem.index, item = r.items[index], key = this.#keyOf(item, index);
            const element = VirtualListDOM.createItem({ document: r.doc, options: this.options, item, index, virtualItem });
            element.classList.add('qxframe9a7c2-item', 'qxframe9a7c2-virtual-list-item');
            DOM.setPrivate(element, 'virtualIndex', String(index)); DOM.setPrivate(element, 'virtualKey', key); element.style.position = 'absolute';
            if (this.options.horizontal === true) { element.style.left = virtualItem.start + 'px'; element.style.top = '0'; element.style.width = virtualItem.size + 'px'; element.style.height = '100%'; }
            else { element.style.left = '0'; element.style.right = '0'; element.style.top = virtualItem.start + 'px'; if (Number(this.options.itemSize) > 0) element.style.height = virtualItem.size + 'px'; else element.style.minHeight = virtualItem.size + 'px'; }
            if (Utils.isFunction(this.options.decorateItem)) { this.options.decorateItem(element, item, index, { key, virtualItem, controller: this }); if (this.destroyed) return; }
            const renderer = Utils.isFunction(this.options.itemRender) ? this.options.itemRender : defaultRenderItem;
            const itemCtx = Item.createContext(item, { index, key, element, component: this, controller: this, disabled: item && item.disabled === true, selected: item && item.selected === true, active: false, virtualItem, parts: {} });
            Item.projectClasses(element, this.options.classes && this.options.classes.item, item, itemCtx, 'virtual-list:item');
            const renderedContent = renderer(item, itemCtx); if (this.destroyed) { renderAborted = true; return; }
            Renderer.append(element, renderedContent); r.rendered.set(key, element); fragment.appendChild(element);
        });
        if (this.destroyed || renderAborted) return false;
        r.layer.appendChild(fragment); r.renderCount += 1;
        if (r.virtualizer && !(Number(this.options.itemSize) > 0) && this.options.measureItems !== false) r.rendered.forEach(element => r.virtualizer.measureElement(Number(DOM.getPrivate(element, 'virtualIndex')), element));
        const detail = { state: this.#stateSnapshot(next.reason), reason: next.reason, controller: this };
        if (Utils.isFunction(this.options.onRender)) this.options.onRender(detail);
        if (!this.destroyed) this.emit('render', detail);
        return !this.destroyed;
    }

    setItems(nextItems) {
        if (this.destroyed) return false;
        const r = recordFor(this), candidateItems = Array.isArray(nextItems) ? nextItems.slice() : [], candidateKeys = this.#itemKeysFor(candidateItems);
        r.items = candidateItems; r.lastGeometry = ''; r.lastRange = '';
        if (r.virtualizer) r.virtualizer.updateOptions({ count: r.items.length, itemKeys: candidateKeys });
        return true;
    }
    refresh(reason) { const r = recordFor(this); if (!r.virtualizer || this.destroyed) return null; r.lastGeometry = ''; r.virtualizer.refresh(reason || 'refresh'); return this.#stateSnapshot(reason || 'refresh'); }
    setFocusable(value) { this.updateOptions({ focusable: value !== false }); return this; }
    scrollToIndex(index, local) { const r = recordFor(this); return r.virtualizer ? r.virtualizer.scrollToIndex(index, local) : false; }
    scrollToOffset(offset) { const r = recordFor(this); return r.virtualizer ? r.virtualizer.scrollToOffset(offset) : false; }
    ensureVisible(index, local) { const r = recordFor(this); return r.virtualizer ? r.virtualizer.ensureVisible(index, local) : false; }
    getVisibleRange() { const r = recordFor(this); return r.virtualizer ? r.virtualizer.getRange() : { start: 0, end: -1, visibleStart: 0, visibleEnd: -1, total: r.items.length }; }
    getState(reason) { return this.#stateSnapshot(reason); }
    getVirtualizer() { return recordFor(this).virtualizer; }
    getRootElement() { return recordFor(this).root; }
    getViewportElement() { return recordFor(this).viewport; }
    getRefs() { const r = recordFor(this); return r.domBinding ? r.domBinding.refs : null; }
    getDOMSource() { const r = recordFor(this); return r.domBinding ? r.domBinding.source : null; }
    getRenderedElement(key) { return recordFor(this).rendered.get(String(key)) || null; }
    once(type, listener) { let off = null; off = this.on(type, detail => { if (off) off(); listener(detail); }); return off; }
    get items() { return recordFor(this).items.slice(); }
}

export default VirtualList;
