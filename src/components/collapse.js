import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Disclosure } from '../core/disclosure.js';
import { ActiveItem } from '../core/activeItem.js';
import { KeyboardNavigation } from '../core/keyboardNavigation.js';
import { RovingProjection } from '../core/rovingProjection.js';
import { Renderer } from '../core/renderer.js';
import { Transition } from '../core/transition.js';
import { Utils } from '../utils/utils.js';

const SIZES = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl']);
const COLLAPSIBLE = Object.freeze(['header', 'icon', 'disabled']);
const state = new WeakMap();
const hasOwn = Utils.own;

function normalizeCollapsible(value, fallback) {
    const next = String(value == null ? (fallback || 'header') : value).toLowerCase();
    if (COLLAPSIBLE.indexOf(next) < 0) throw new TypeError('[QXFRAME9A7C2] Collapse collapsible must be "header", "icon", or "disabled".');
    return next;
}
function normalizeItems(items) {
    const seen = Object.create(null);
    return (Array.isArray(items) ? items : []).map(item => {
        if (!item || typeof item !== 'object') throw new TypeError('[QXFRAME9A7C2] Collapse items must be objects.');
        if (hasOwn(item, 'title') || hasOwn(item, 'children')) throw new TypeError('[QXFRAME9A7C2] Collapse item uses canonical key/label/content fields only.');
        if (item.key === undefined || item.key === null || item.key === '') throw new TypeError('[QXFRAME9A7C2] Collapse item.key is required.');
        if (item.label === undefined || item.label === null) throw new TypeError('[QXFRAME9A7C2] Collapse item.label is required.');
        const key = String(item.key);
        if (seen[key]) throw new TypeError('[QXFRAME9A7C2] Collapse item.key must be unique: ' + key + '.');
        seen[key] = true;
        return {
            key,
            label: item.label,
            content: item.content,
            extra: item.extra,
            disabled: item.disabled === true,
            collapsible: item.collapsible == null ? null : normalizeCollapsible(item.collapsible),
            className: item.className || ''
        };
    });
}
function sizeName(value) { return Utils.normalizeEnum(value == null || value === '' ? 'md' : value, SIZES, undefined, 'Collapse size'); }
function indicatorPosition(value) {
    const next = String(value == null ? 'start' : value);
    if (next !== 'start' && next !== 'end') throw new TypeError('[QXFRAME9A7C2] Collapse indicatorPosition must be "start" or "end".');
    return next;
}
function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Collapse instance.');
    return record;
}

export class Collapse extends Component {
    static options = Object.freeze({
        items: [],
        accordion: false,
        bordered: true,
        ghost: false,
        destroyInactive: false,
        indicatorPosition: 'start',
        collapsible: 'header',
        size: 'md',
        animation: true
    });
    static optionNormalizers = Object.freeze({
        items: normalizeItems,
        collapsible: value => normalizeCollapsible(value),
        size: sizeName,
        indicatorPosition
    });
    static immutableOptions = Object.freeze(['container']);
    static contract = ComponentContracts.get('Collapse');

    [componentHooks.render]() {
        const existing = state.get(this);
        if (existing && existing.root) return existing.root;
        const opts = this.options;
        if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Collapse container must be an Element.');
        const doc = opts.document || opts.container.ownerDocument || globalThis.document;
        const root = doc.createElement('div');
        root.className = 'qxframe9a7c2-collapse';
        opts.container.appendChild(root);

        const record = {
            doc,
            root,
            items: opts.items,
            disclosure: null,
            active: null,
            records: Object.create(null),
            headers: Object.create(null),
            rovingProjection: null,
            keyboard: null,
            render: null,
            setValue: null,
            toggle: null,
            applyOptions: null
        };
        state.set(this, record);

        record.disclosure = Disclosure.create({
            value: hasOwn(opts, 'value') ? opts.value : (hasOwn(opts, 'defaultValue') ? opts.defaultValue : []),
            accordion: opts.accordion === true
        });
        record.active = ActiveItem.create({
            getEntries: () => record.items,
            getKey: item => item.key,
            isDisabled: item => effectiveCollapsible(item) === 'disabled',
            loop: true
        });
        record.rovingProjection = RovingProjection.create({
            getEntries: () => Object.keys(record.headers).map(key => ({ key, element: record.headers[key] })),
            getKey: entry => entry.key,
            getElement: entry => entry.element,
            getActiveKey: () => record.active.activeKey,
            isDisabled: (_entry, _index, element) => !element || element.disabled === true,
            ensureOne: false
        });

        const effectiveCollapsible = item => {
            if (!item || item.disabled) return 'disabled';
            return normalizeCollapsible(item.collapsible, this.options.collapsible);
        };
        const itemByKey = key => {
            const normalized = String(key);
            for (let i = 0; i < record.items.length; i += 1) if (record.items[i].key === normalized) return record.items[i];
            return null;
        };
        const syncRoving = () => record.rovingProjection.sync();
        const focusActive = () => {
            const key = record.active.activeKey;
            const node = record.headers[key];
            syncRoving();
            DOM.focusElement(node);
        };

        record.keyboard = KeyboardNavigation.create({
            root,
            activeItem: record.active,
            orientation: 'vertical',
            onNavigate: () => focusActive()
        });

        const renderPart = (host, value, item) => {
            host.textContent = '';
            const output = typeof value === 'function' ? value(item, this) : value;
            Renderer.append(host, output);
        };
        const renderIndicator = (itemRecord, open) => {
            const item = itemRecord.item;
            const current = this.options;
            let output;
            if (typeof current.renderIndicator === 'function') output = current.renderIndicator({ key: item.key, item, open, instance: this });
            else {
                output = doc.createElement('span');
                output.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + (open ? 'caret-down' : 'caret-right') + ' is-line is-round is-stroke-3';
            }
            itemRecord.indicator.textContent = '';
            Renderer.append(itemRecord.indicator, output);
        };
        const transitionDescriptor = () => this.options.transition || 'qxframe9a7c2-collapse-transition';
        const createRecord = (item, initialOpen) => {
            const section = doc.createElement('section');
            const header = doc.createElement('div');
            const indicator = doc.createElement('button');
            const main = doc.createElement('button');
            const title = doc.createElement('span');
            const extra = doc.createElement('span');
            const panel = doc.createElement('div');
            const content = doc.createElement('div');
            const headerId = 'qxframe9a7c2-collapse-header-' + item.key;
            const panelId = 'qxframe9a7c2-collapse-panel-' + item.key;

            section.className = 'qxframe9a7c2-collapse-item';
            header.className = 'qxframe9a7c2-collapse-header';
            indicator.className = 'qxframe9a7c2-collapse-indicator';
            indicator.type = 'button';
            main.className = 'qxframe9a7c2-collapse-main';
            main.type = 'button';
            header.id = headerId;
            title.className = 'qxframe9a7c2-collapse-title';
            extra.className = 'qxframe9a7c2-collapse-extra';
            panel.className = 'qxframe9a7c2-collapse-panel';
            panel.id = panelId;
            content.className = 'qxframe9a7c2-collapse-content';
            main.appendChild(title);
            panel.appendChild(content);
            section.appendChild(header);
            section.appendChild(panel);

            const itemRecord = { item, section, header, indicator, main, title, extra, panel, content, transition: null, open: null, contentRendered: false, cleanups: [] };
            itemRecord.transition = Transition.create({
                element: panel,
                transition: transitionDescriptor,
                visible: false,
                appear: false,
                reducedMotion: () => this.options.animation === false,
                onBeforeEnter: () => { if (itemRecord.panel) { itemRecord.panel.hidden = false; itemRecord.panel.style.setProperty('--qxframe9a7c2-collapse-motion-height', itemRecord.panel.scrollHeight + 'px'); } },
                onBeforeLeave: () => { if (itemRecord.panel) itemRecord.panel.style.setProperty('--qxframe9a7c2-collapse-motion-height', itemRecord.panel.scrollHeight + 'px'); },
                onAfterLeave: () => {
                    if (!itemRecord.panel) return;
                    itemRecord.panel.hidden = true;
                    if (this.options.destroyInactive === true) { itemRecord.content.textContent = ''; itemRecord.contentRendered = false; }
                }
            });
            itemRecord.cleanups.push(DOM.listen(main, 'focus', () => { record.active.set(itemRecord.item.key, { silent: true, reason: 'focus', source: 'dom' }); syncRoving(); }));
            itemRecord.cleanups.push(DOM.listen(indicator, 'focus', () => { record.active.set(itemRecord.item.key, { silent: true, reason: 'focus', source: 'dom' }); syncRoving(); }));
            itemRecord.cleanups.push(DOM.listen(main, 'click', event => {
                if (effectiveCollapsible(itemRecord.item) !== 'header') return;
                record.toggle(itemRecord.item.key, { reason: 'click', source: DOM.activationSource(event), originalEvent: event });
            }));
            itemRecord.cleanups.push(DOM.listen(indicator, 'click', event => {
                event.stopPropagation();
                if (effectiveCollapsible(itemRecord.item) === 'disabled') return;
                record.toggle(itemRecord.item.key, { reason: 'indicator-click', source: DOM.activationSource(event), originalEvent: event });
            }));
            return itemRecord;
        };
        const destroyRecord = itemRecord => {
            if (!itemRecord) return;
            if (itemRecord.transition) itemRecord.transition.destroy();
            (itemRecord.cleanups || []).forEach(cleanup => { if (typeof cleanup === 'function') cleanup(); });
            DOM.removeNode(itemRecord.section);
            itemRecord.panel = null;
        };
        const syncRecord = (itemRecord, item, open, reason) => {
            const current = this.options;
            const previousItem = itemRecord.item;
            itemRecord.item = item;
            const mode = effectiveCollapsible(item);
            itemRecord.section.className = 'qxframe9a7c2-collapse-item' + (open ? ' is-open' : '') + (mode === 'disabled' ? ' is-disabled' : '') + (item.className ? ' ' + item.className : '');
            itemRecord.header.classList.toggle('is-icon-only', mode === 'icon');
            itemRecord.header.removeAttribute('tabindex');
            itemRecord.main.disabled = mode !== 'header';
            itemRecord.main.tabIndex = -1;
            itemRecord.indicator.disabled = mode === 'disabled';
            itemRecord.indicator.tabIndex = -1;
            renderPart(itemRecord.title, item.label, item);
            const hasExtra = item.extra !== undefined && item.extra !== null && item.extra !== false && item.extra !== '';
            renderPart(itemRecord.extra, hasExtra ? item.extra : '', item);
            renderIndicator(itemRecord, open);
            itemRecord.header.textContent = '';
            if (String(current.indicatorPosition) === 'start') itemRecord.header.appendChild(itemRecord.indicator);
            itemRecord.header.appendChild(itemRecord.main);
            if (hasExtra) itemRecord.header.appendChild(itemRecord.extra);
            if (String(current.indicatorPosition) === 'end') itemRecord.header.appendChild(itemRecord.indicator);
            const contentChanged = !previousItem || previousItem.content !== item.content;
            const structuralRefresh = reason === 'options' || reason === 'set-items';
            if ((open || current.destroyInactive !== true) && !itemRecord.contentRendered) { renderPart(itemRecord.content, item.content, item); itemRecord.contentRendered = true; }
            else if (itemRecord.contentRendered && current.destroyInactive !== true && (contentChanged || structuralRefresh)) renderPart(itemRecord.content, item.content, item);
            if (itemRecord.open === null) {
                itemRecord.open = open;
                itemRecord.panel.hidden = !open;
                if (open) itemRecord.transition.setVisible(true, { reason: 'initial', immediate: true });
            } else if (itemRecord.open !== open) {
                itemRecord.open = open;
                if (open) itemRecord.panel.hidden = false;
                else if (current.destroyInactive === true) { itemRecord.content.textContent = ''; itemRecord.contentRendered = false; }
                itemRecord.transition.setVisible(open, { reason: reason || 'collapse-toggle' });
            } else if (open) itemRecord.panel.hidden = false;
            record.headers[item.key] = mode === 'icon' ? itemRecord.indicator : (mode === 'header' ? itemRecord.main : null);
        };
        record.render = reason => {
            const current = this.options;
            const live = Object.create(null);
            record.headers = Object.create(null);
            SIZES.forEach(size => root.classList.remove('is-' + size));
            root.classList.add('is-' + sizeName(current.size));
            root.classList.toggle('is-borderless', current.bordered === false);
            root.classList.toggle('is-ghost', current.ghost === true);
            root.classList.toggle('is-accordion', current.accordion === true);
            root.classList.toggle('is-indicator-end', String(current.indicatorPosition) === 'end');
            const disclosureState = record.disclosure.getState();
            record.items.forEach(item => {
                const open = disclosureState.value.indexOf(item.key) >= 0;
                const itemRecord = record.records[item.key] || createRecord(item, open);
                record.records[item.key] = itemRecord;
                live[item.key] = true;
                syncRecord(itemRecord, item, open, reason);
                root.appendChild(itemRecord.section);
            });
            Object.keys(record.records).forEach(key => { if (!live[key]) { destroyRecord(record.records[key]); delete record.records[key]; } });
            record.active.updateOptions({ entries: record.items });
            record.active.ensureValid({ silent: true, reason: 'render' });
            syncRoving();
            return this;
        };
        const pruneDisclosure = reason => {
            const allowed = Object.create(null);
            record.items.forEach(item => { allowed[item.key] = true; });
            const current = record.disclosure.getState().value;
            const pruned = current.filter(key => allowed[key] === true);
            if (pruned.length !== current.length) record.disclosure.setValue(pruned, { silent: true, reason: reason || 'items-prune', source: 'items' });
        };
        const emit = (previous, meta) => {
            const onChange = this.options.onChange;
            if (typeof onChange === 'function') onChange(record.disclosure.getState().value.slice(), Utils.assignOwn({ previousValue: previous, instance: this }, meta || {}));
        };
        record.setValue = (next, meta) => {
            if (this.destroyed) return false;
            const previous = record.disclosure.getState().value.slice();
            if (!record.disclosure.setValue(next, Utils.assignOwn({ silent: true }, meta))) return false;
            pruneDisclosure('set-value');
            record.render(meta && meta.reason || 'set-value');
            if (!(meta && meta.silent)) emit(previous, meta);
            return this;
        };
        record.toggle = (key, meta) => {
            if (this.destroyed) return false;
            const item = itemByKey(key);
            if (!item || effectiveCollapsible(item) === 'disabled') return false;
            const previous = record.disclosure.getState().value.slice();
            const open = previous.indexOf(item.key) < 0;
            const payload = Utils.assignOwn({ key: item.key, item, open, instance: this }, meta || {});
            if (typeof this.options.beforeChange === 'function' && this.options.beforeChange(payload) === false) return false;
            record.disclosure.set(item.key, open, { silent: true, reason: payload.reason, source: payload.source });
            record.render(payload.reason || 'toggle');
            emit(previous, payload);
            const header = record.headers[item.key];
            if (header && payload.originalEvent) DOM.focusElement(header);
            return this;
        };
        record.applyOptions = (next, patch) => {
            const candidateItems = hasOwn(patch, 'items') ? next.items : record.items;
            const candidateValue = hasOwn(patch, 'value') ? next.value : record.disclosure.getState().value;
            if (!Array.isArray(candidateValue)) throw new TypeError('[QXFRAME9A7C2] Collapse value must be an array of keys.');
            record.items = candidateItems;
            record.disclosure.updateOptions({ accordion: next.accordion === true, value: candidateValue });
            pruneDisclosure('options-items');
            record.render('options');
        };

        // Resource ownership mirrors the frozen destroy ordering while keeping Component.destroy as the only public lifecycle owner.
        this.own(() => { DOM.removeNode(root); record.root = null; record.headers = Object.create(null); });
        this.own(() => { Object.keys(record.records).forEach(key => destroyRecord(record.records[key])); record.records = Object.create(null); });
        this.own(record.disclosure);
        this.own(record.active);
        this.own(record.rovingProjection);
        this.own(record.keyboard);

        pruneDisclosure('initial-items');
        record.render('initial');
        return root;
    }

    [componentHooks.optionsUpdated](next, _previous, patch) {
        const record = state.get(this);
        if (record && record.root) record.applyOptions(next, patch);
    }

    setValue(next, meta) { return recordFor(this).setValue(next, meta); }
    toggle(key, meta) { return recordFor(this).toggle(key, meta); }
    open(key, meta) {
        const record = recordFor(this);
        if (record.disclosure.has(key)) return this;
        return record.toggle(key, Utils.assignOwn({ reason: 'open' }, meta || {}));
    }
    close(key, meta) {
        const record = recordFor(this);
        if (!record.disclosure.has(key)) return this;
        return record.toggle(key, Utils.assignOwn({ reason: 'close' }, meta || {}));
    }
    setItems(next) {
        if (this.destroyed) return false;
        const record = recordFor(this);
        record.items = normalizeItems(next);
        const allowed = Object.create(null);
        record.items.forEach(item => { allowed[item.key] = true; });
        const current = record.disclosure.getState().value;
        const pruned = current.filter(key => allowed[key] === true);
        if (pruned.length !== current.length) record.disclosure.setValue(pruned, { silent: true, reason: 'set-items', source: 'items' });
        record.render('set-items');
        return this;
    }
    focus(key) {
        if (this.destroyed) return false;
        const record = recordFor(this);
        const normalized = key ? String(key) : record.active.activeKey;
        if (normalized) record.active.set(normalized, { silent: true, reason: 'focus-api' });
        const node = record.headers[record.active.activeKey];
        record.rovingProjection.sync();
        DOM.focusElement(node);
        return !!(record.headers[record.active.activeKey] && record.doc.activeElement === record.headers[record.active.activeKey]);
    }
    getState() {
        const record = recordFor(this);
        const opts = this.options;
        return Object.freeze({
            value: record.disclosure.getState().value.slice(),
            accordion: opts.accordion === true,
            bordered: opts.bordered !== false,
            ghost: opts.ghost === true,
            collapsible: opts.collapsible,
            indicatorPosition: String(opts.indicatorPosition),
            size: sizeName(opts.size),
            destroyInactive: opts.destroyInactive === true,
            items: record.items.slice(),
            activeKey: record.active.activeKey,
            destroyed: this.destroyed
        });
    }
    getDisclosure() { return recordFor(this).disclosure; }
    getActiveItem() { return recordFor(this).active; }
    getRootElement() { return this.root; }
}

export { SIZES as COLLAPSE_SIZES, COLLAPSIBLE as COLLAPSE_MODES };
export default Collapse;
