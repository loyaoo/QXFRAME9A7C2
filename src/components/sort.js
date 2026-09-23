import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Collection } from '../core/collection.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { EventDelegation } from '../core/eventDelegation.js';
import { Renderer } from '../core/renderer.js';
import { TransitionGroup } from '../core/transitionGroup.js';
import { ReorderInteraction } from '../core/reorderInteraction.js';
import { Utils } from '../utils/utils.js';
import { Control } from './control.js';

const state = new WeakMap();
const own = Utils.own;

function normalizeOrientation(value) {
    const next = String(value == null ? 'vertical' : value).toLowerCase();
    if (next !== 'vertical' && next !== 'horizontal') throw new TypeError('[QXFRAME9A7C2] Sort orientation must be "vertical" or "horizontal".');
    return next;
}

function normalizeItems(items) {
    if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] Sort items must be an array.');
    const seen = Object.create(null);
    return items.map(item => {
        if (!item || typeof item !== 'object') throw new TypeError('[QXFRAME9A7C2] Sort items must be objects.');
        ['id','value','title'].forEach(name => { if (own(item, name)) throw new TypeError('[QXFRAME9A7C2] Sort item uses canonical key/label/content fields only; "' + name + '" is not accepted.'); });
        if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] Sort item.key is required.');
        if (item.label === undefined || item.label === null) throw new TypeError('[QXFRAME9A7C2] Sort item.label is required.');
        const key = String(item.key);
        if (seen[key]) throw new TypeError('[QXFRAME9A7C2] Sort item.key must be unique: ' + key + '.');
        seen[key] = true;
        return Utils.mergeOwn( item, { key, label: item.label, disabled: item.disabled === true });
    });
}

function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Sort instance.');
    return record;
}

function applyNativeOrder(incoming, fieldInit) {
    if (!fieldInit.hasNativeValue || !Array.isArray(incoming.items)) return incoming;
    const nativeOrder = String(fieldInit.nativeValue == null ? '' : fieldInit.nativeValue).split(',').filter(key => key !== '');
    if (!nativeOrder.length) return incoming;
    const nativeRank = Object.create(null);
    nativeOrder.forEach((key, index) => { nativeRank[String(key)] = index; });
    incoming.items = incoming.items.map((item, index) => ({ item, index })).sort((left, right) => {
        const leftKey = left.item && left.item.key != null ? String(left.item.key) : '';
        const rightKey = right.item && right.item.key != null ? String(right.item.key) : '';
        const leftRank = own(nativeRank, leftKey) ? nativeRank[leftKey] : Infinity;
        const rightRank = own(nativeRank, rightKey) ? nativeRank[rightKey] : Infinity;
        return leftRank === rightRank ? left.index - right.index : leftRank - rightRank;
    }).map(entry => entry.item);
    return incoming;
}

export class Sort extends Component {
    static options = Object.freeze({
        items: [], disabled: false, readOnly: false, required: false, draggable: true,
        showHandle: true, handleOnly: true, showActions: true, orientation: 'vertical', keyboard: true
    });
    static immutableOptions = Object.freeze(['target', 'container', 'formField']);
    static optionNormalizers = Object.freeze({ orientation: normalizeOrientation, items: normalizeItems });
    static contract = ComponentContracts.get('Sort');

    static create(source = {}, overrides) { return new this(source, overrides).render(); }
    static enhance(input, options) { return this.create(input, options || {}); }

    constructor(source = {}, overrides) {
        const fieldInit = Control.resolveFieldOptions(source, overrides);
        const incoming = applyNativeOrder(fieldInit.options, fieldInit);
        if (!incoming.container && !incoming.formField) throw new TypeError('[QXFRAME9A7C2] Sort requires target/container or formField.');
        const doc = fieldInit.document || incoming.document || (incoming.container && incoming.container.ownerDocument) || (incoming.formField && incoming.formField.ownerDocument) || globalThis.document;
        super(Utils.mergeOwn( incoming, { document: doc }));
        state.set(this, {
            fieldInit, doc, root: null, rowByKey: new Map(), collection: null, transitionGroup: null,
            delegation: null, reorderInteraction: null, formBridge: null, initialItems: []
        });
    }

    [componentHooks.render]() {
        const r = recordFor(this);
        if (r.root) { this.#renderRows(); return r.root; }
        const opts = this.options;
        const root = r.doc.createElement('div');
        root.className = 'qxframe9a7c2-sort';
        if (opts.container) opts.container.appendChild(root); else Control.placeFieldRoot(root, null, opts.formField);
        r.root = root;
        this.own(() => DOM.removeNode(root));

        r.collection = this.own(Collection.create({
            items: normalizeItems(opts.items),
            getKey: item => item.key,
            getLabel: item => item.label,
            isDisabled: item => item.disabled === true,
            beforeMove: detail => typeof this.options.beforeMove !== 'function' || this.options.beforeMove(Utils.mergeOwn( detail, { instance: this })) !== false
        }));

        r.transitionGroup = this.own(TransitionGroup.create({
            container: root,
            appear: false,
            transition: {
                enter: { from:{style:{opacity:'1'}}, active:{style:{transitionProperty:'opacity',transitionDuration:'0ms'}}, to:{style:{opacity:'1'}} },
                leave: { from:{style:{opacity:'1'}}, active:{style:{transitionProperty:'opacity',transitionDuration:'0ms'}}, to:{style:{opacity:'1'}} }
            },
            move: { type:'transition', active:{style:{transitionProperty:'transform',transitionDuration:'160ms',transitionTimingFunction:'cubic-bezier(.2,.8,.2,1)'}} },
            reducedMotion: () => this.options.animation === false,
            onAfterLeave: context => {
                const key = String(context.key);
                if (r.collection.indexOf(key) >= 0) return;
                if (r.rowByKey.get(key) === context.element) r.rowByKey.delete(key);
            }
        }));

        r.delegation = this.own(EventDelegation.create({ root }));
        this.own(r.delegation.on('click', '.qxframe9a7c2-sort-action', detail => {
            if (this.#locked()) return;
            const button = detail.target, row = button.closest('.qxframe9a7c2-sort-item');
            if (!row) return;
            const delta = DOM.getPrivate(button, 'sortAction') === 'up' ? -1 : 1;
            this.#moveByKey(DOM.getPrivate(row, 'sortKey'), delta, { source: DOM.activationSource(detail.event), reason: delta < 0 ? 'action-up' : 'action-down', originalEvent: detail.event });
        }));
        this.own(r.delegation.on('keydown', '.qxframe9a7c2-sort-item', detail => {
            const optsNow = this.options;
            if (optsNow.keyboard === false || optsNow.disabled === true) return;
            const event = detail.event, row = detail.target, keyValue = DOM.getPrivate(row, 'sortKey'), key = String(event.key || '');
            const backward = key === 'ArrowUp' || key === 'ArrowLeft', forward = key === 'ArrowDown' || key === 'ArrowRight';
            const modified = event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
            if (modified && !optsNow.readOnly && (backward || forward || key === 'Home' || key === 'End')) {
                event.preventDefault();
                if (key === 'Home') this.move(keyValue, 0, { source: 'keyboard', reason: 'keyboard-home', originalEvent: event });
                else if (key === 'End') this.move(keyValue, Math.max(0, r.collection.size - 1), { source: 'keyboard', reason: 'keyboard-end', originalEvent: event });
                else this.#moveByKey(keyValue, backward ? -1 : 1, { source: 'keyboard', reason: 'keyboard', originalEvent: event });
                return;
            }
            if (backward || forward || key === 'Home' || key === 'End') {
                event.preventDefault();
                if (key === 'Home') this.#focusBoundary(false);
                else if (key === 'End') this.#focusBoundary(true);
                else this.#focusRelative(keyValue, backward ? -1 : 1);
            }
        }));

        r.reorderInteraction = this.own(ReorderInteraction.create({
            root,
            document: r.doc,
            rowSelector: '.qxframe9a7c2-sort-item',
            handleSelector: () => this.#effectiveHandleOnly() ? '.qxframe9a7c2-sort-handle' : null,
            orientation: () => this.options.orientation,
            disabled: () => this.options.disabled === true,
            readOnly: () => this.options.readOnly === true,
            draggable: () => this.options.draggable !== false,
            getItems: () => this.#items().map(item => ({ key: item.key, disabled: item.disabled === true, item })),
            getRowElement: key => this.getRowElement(key),
            getKeyFromRow: row => DOM.getPrivate(row, 'sortKey'),
            getInstance: () => this,
            onMove: detail => this.move(detail.fromIndex, detail.toIndex, { source: detail.source, reason: detail.reason, originalEvent: detail.originalEvent }),
            onDragStart: detail => { if (typeof this.options.onDragStart === 'function') this.options.onDragStart(detail); },
            onDragMove: detail => { if (typeof this.options.onDragMove === 'function') this.options.onDragMove(detail); },
            onDragEnd: detail => { if (typeof this.options.onDragEnd === 'function') this.options.onDragEnd(detail); },
            onDragCancel: detail => { if (typeof this.options.onDragCancel === 'function') this.options.onDragCancel(detail); }
        }));

        r.initialItems = this.#items();
        r.formBridge = this.own(Control.createFormFieldBridge({
            root, target: opts.container, formField: opts.formField, document: r.doc, name: opts.name,
            disabled: opts.disabled === true, readOnly: opts.readOnly === true, required: opts.required === true,
            value: r.initialItems.map(item => item.key), serializeValue: opts.serializeValue,
            getValue: () => this.#items().map(item => item.key),
            onReset: () => this.setItems(r.initialItems, { silent: true, source: 'form', reason: 'reset' })
        }));

        this.#renderRows();
        return root;
    }

    [componentHooks.beforeOptionsUpdate](patch) {
        const r = recordFor(this);
        if (r.reorderInteraction && r.reorderInteraction.getState().dragging && (own(patch,'disabled') || own(patch,'readOnly') || own(patch,'items'))) r.reorderInteraction.cancelDrag('options');
    }

    [componentHooks.optionsUpdated](next, _previous, patch) {
        const r = recordFor(this);
        if (own(patch, 'items')) {
            const normalized = normalizeItems(next.items);
            r.collection.setItems(normalized, { silent: true, source: 'api', reason: 'options-items' });
        }
        this.#renderRows();
        if (r.formBridge) r.formBridge.updateOptions({ name: next.name, disabled: next.disabled === true, readOnly: next.readOnly === true, required: next.required === true, serializeValue: next.serializeValue });
    }

    [componentHooks.afterDestroy]() {
        const r = state.get(this);
        if (!r) return;
        r.rowByKey.clear();
        r.root = r.collection = r.transitionGroup = r.delegation = r.reorderInteraction = r.formBridge = null;
    }

    #locked() { return this.destroyed || InteractionPolicy.mutationLocked(this.options); }
    #effectiveHandleOnly() { return this.options.handleOnly !== false && this.options.showHandle !== false; }
    #items() { return recordFor(this).collection.items; }
    #renderOutput(host, value, item) { const output = typeof value === 'function' ? value(item, this) : value; Renderer.replace(host, output == null ? '' : output, recordFor(this).doc); }
    #focusRelative(key, delta) { const keys = recordFor(this).collection.enabledEntries().map(entry => entry.key); if (!keys.length) return false; let index = keys.indexOf(String(key)); if (index < 0) index = delta < 0 ? keys.length : -1; index = Math.max(0, Math.min(keys.length - 1, index + delta)); return this.#focusRow(keys[index]); }
    #focusBoundary(last) { const keys = recordFor(this).collection.enabledEntries().map(entry => entry.key); return keys.length ? this.#focusRow(keys[last ? keys.length - 1 : 0]) : false; }
    #focusRow(key) { const r = recordFor(this), row = this.getRowElement(key); if (!row || !row.focus) return false; DOM.focusElement(row); return r.doc.activeElement === row; }
    #createHandle() { const { doc } = recordFor(this); const handle = doc.createElement('span'), glyph = doc.createElement('span'); handle.className = 'qxframe9a7c2-sort-handle'; glyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-drag-vertical is-line is-round is-stroke-3 is-sm'; handle.appendChild(glyph); return handle; }
    #createActions() {
        const { doc } = recordFor(this), actions = doc.createElement('span'), up = doc.createElement('button'), down = doc.createElement('button');
        actions.className = 'qxframe9a7c2-sort-actions'; up.className = 'qxframe9a7c2-sort-action qxframe9a7c2-button is-default is-outlined is-square'; down.className = up.className; up.type = 'button'; down.type = 'button';
        DOM.setPrivate(up, 'sortAction', 'up'); DOM.setPrivate(down, 'sortAction', 'down'); up.tabIndex = -1; down.tabIndex = -1;
        const upGlyph = doc.createElement('span'), downGlyph = doc.createElement('span'); upGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-arrow-up is-line is-round is-stroke-3 is-sm'; downGlyph.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-arrow-down is-line is-round is-stroke-3 is-sm';
        up.appendChild(upGlyph); down.appendChild(downGlyph); actions.appendChild(up); actions.appendChild(down); return actions;
    }
    #createRow(key) { const r = recordFor(this), row = r.doc.createElement('div'), handle = this.#createHandle(), label = r.doc.createElement('span'), actions = this.#createActions(); row.className = 'qxframe9a7c2-sort-item qxframe9a7c2-item-surface'; label.className = 'qxframe9a7c2-sort-label'; row.appendChild(handle); row.appendChild(label); row.appendChild(actions); DOM.setPrivate(row, 'sortKey', key); r.rowByKey.set(key, row); return row; }
    #renderRows() {
        if (this.destroyed) return this;
        const r = recordFor(this), opts = this.options, current = this.#items(), entries = [];
        r.root.classList.toggle('is-disabled', opts.disabled === true); r.root.classList.toggle('is-readonly', opts.readOnly === true); r.root.classList.toggle('is-horizontal', opts.orientation === 'horizontal'); r.root.classList.toggle('is-vertical', opts.orientation !== 'horizontal');
        current.forEach((item, index) => {
            const key = item.key, row = this.getRowElement(key) || this.#createRow(key); let handle = row.querySelector('.qxframe9a7c2-sort-handle'), label = row.querySelector('.qxframe9a7c2-sort-label'), actions = row.querySelector('.qxframe9a7c2-sort-actions');
            if (!label) { label = r.doc.createElement('span'); label.className = 'qxframe9a7c2-sort-label'; row.appendChild(label); }
            if (opts.showHandle !== false && !handle) { handle = this.#createHandle(); row.insertBefore(handle, label); }
            if (opts.showActions !== false && !actions) { actions = this.#createActions(); row.appendChild(actions); }
            const up = actions ? DOM.findPrivate(actions, 'sortAction', 'up') : null, down = actions ? DOM.findPrivate(actions, 'sortAction', 'down') : null, rowLocked = this.#locked() || item.disabled === true;
            DOM.setPrivate(row, 'sortIndex', String(index)); row.tabIndex = opts.disabled === true || item.disabled === true ? -1 : 0; row.classList.toggle('is-disabled', item.disabled === true || opts.disabled === true); row.classList.toggle('is-readonly', opts.readOnly === true); row.draggable = opts.draggable !== false && !rowLocked && !this.#effectiveHandleOnly();
            if (opts.showHandle === false) { if (handle && handle.parentNode) handle.parentNode.removeChild(handle); }
            else { if (handle.parentNode !== row) row.insertBefore(handle, label); handle.draggable = opts.draggable !== false && !rowLocked && this.#effectiveHandleOnly(); }
            if (opts.showActions === false) { if (actions && actions.parentNode) actions.parentNode.removeChild(actions); }
            else { if (actions.parentNode !== row) row.appendChild(actions); if (up) up.disabled = rowLocked || index === 0; if (down) down.disabled = rowLocked || index === current.length - 1; }
            this.#renderOutput(label, item.content !== undefined ? item.content : item.label, item); entries.push({ key, element: row });
        });
        r.transitionGroup.sync(entries, { reason: 'sort-render' });
        if (r.formBridge) r.formBridge.setValue(current.map(item => item.key), { silent: true, source: 'sort', reason: 'render' });
        return this;
    }
    #emitChange(previousItems, detail = {}) {
        const r = recordFor(this), next = this.#items();
        if (r.formBridge) r.formBridge.setValue(next.map(item => item.key), { forceEvent: true, source: detail.source || 'api', reason: detail.reason || 'change' });
        if (typeof this.options.onChange === 'function') this.options.onChange(next.slice(), Utils.assignOwn({ items: next.slice(), order: next.map(item => item.key), previousItems: previousItems.slice(), instance: this }, detail));
    }
    #moveByKey(key, delta, meta) { const index = recordFor(this).collection.indexOf(String(key)); return index < 0 ? false : this.move(index, index + delta, meta); }

    move(from, to, meta = {}) {
        if (this.destroyed || this.#locked()) return false;
        const r = recordFor(this), previous = this.#items();
        const result = r.collection.move(from, to, { silent: true, source: meta.source || 'api', reason: meta.reason || 'move', originalEvent: meta.originalEvent || null });
        if (!result.changed) return false;
        this.#renderRows(); this.#focusRow(result.key);
        if (meta.silent !== true) this.#emitChange(previous, { reason: result.reason || meta.reason || 'move', source: meta.source || 'api', originalEvent: meta.originalEvent || null, moved: Object.freeze({ key: result.key, fromIndex: result.fromIndex, toIndex: result.toIndex }) });
        return true;
    }
    moveUp(key, meta) { return this.#moveByKey(key, -1, Utils.assignOwn({ reason: 'move-up' }, meta || {})); }
    moveDown(key, meta) { return this.#moveByKey(key, 1, Utils.assignOwn({ reason: 'move-down' }, meta || {})); }
    setItems(next, meta = {}) {
        if (this.destroyed) return false;
        const r = recordFor(this); if (r.reorderInteraction && r.reorderInteraction.getState().dragging) r.reorderInteraction.cancelDrag('set-items');
        const previous = this.#items(), result = r.collection.setItems(normalizeItems(next), { silent: true, source: meta.source || 'api', reason: meta.reason || 'set-items' });
        if (!result.changed) return false;
        this.#renderRows(); if (meta.silent !== true) this.#emitChange(previous, { source: meta.source || 'api', reason: meta.reason || 'set-items', moved: null }); return true;
    }
    setDisabled(value) { this.updateOptions({ disabled: value === true }); return this; }
    setReadOnly(value) { this.updateOptions({ readOnly: value === true }); return this; }
    cancelDrag(reason) { const r = recordFor(this); return r.reorderInteraction ? r.reorderInteraction.cancelDrag(reason || 'api') : false; }
    focus(key) { return key == null ? this.#focusBoundary(false) : this.#focusRow(String(key)); }
    getRootElement() { return recordFor(this).root; }
    getFormField() { const r = recordFor(this); return r.formBridge ? r.formBridge.getFormField() : null; }
    getFormBridge() { return recordFor(this).formBridge; }
    getCollection() { return recordFor(this).collection; }
    getRowElement(key) { return recordFor(this).rowByKey.get(String(key)) || null; }
    getState() { const r = recordFor(this), opts = this.options, items = this.#items(); return Object.freeze({ items, order: items.map(item => item.key), disabled: opts.disabled === true, readOnly: opts.readOnly === true, draggable: opts.draggable !== false, showHandle: opts.showHandle !== false, handleOnly: this.#effectiveHandleOnly(), showActions: opts.showActions !== false, orientation: opts.orientation, dragging: r.reorderInteraction ? r.reorderInteraction.getState().dragging : false, dragOverlay: r.reorderInteraction ? r.reorderInteraction.getState().dragOverlay : false, movingKeys: r.transitionGroup ? r.transitionGroup.getState().movingKeys.slice() : [], destroyed: this.destroyed }); }
}

export default Sort;
