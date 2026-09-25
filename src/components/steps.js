import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Collection } from '../core/collection.js';
import { ActiveItem } from '../core/activeItem.js';
import { Renderer } from '../core/renderer.js';
import { StateController } from '../core/stateController.js';
import { FocusController } from '../core/focusController.js';
import { CapabilityController } from '../core/capabilityController.js';
import { FeedbackController } from '../core/feedbackController.js';
import { RovingProjection } from '../core/rovingProjection.js';
import { Utils } from '../utils/utils.js';
import { Item } from './item.js';

export const STEPS_DIRECTIONS = Object.freeze(['horizontal', 'vertical']);
export const STEPS_STATUSES = Object.freeze(['wait', 'process', 'finish', 'error']);
export const STEPS_TYPES = Object.freeze(['default', 'navigation', 'inline']);
export const STEPS_LABEL_PLACEMENTS = Object.freeze(['horizontal', 'vertical']);
export const STEPS_SIZES = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl']);
const state = new WeakMap();
const own = Utils.own;

function enumValue(value, allowed, fallback, label) { return Utils.enumValue(value, allowed, fallback, 'Steps ' + label); }
function booleanValue(value, fallback, label) { return Utils.booleanValue(value, fallback, 'Steps ' + label); }
function finiteNumber(value, fallback, label) { return Utils.finiteAtLeast(value, fallback, undefined, 'Steps ' + label); }
function clampPercent(value) { return Math.min(100, Math.max(0, finiteNumber(value, 0, 'percent'))); }
function normalizeItems(items) {
    if (!Array.isArray(items)) throw new TypeError('[QXFRAME9A7C2] Steps items must be an array.');
    const seen = Object.create(null);
    return items.map((item, index) => {
        let next;
        if (item == null || typeof item === 'string' || typeof item === 'number') {
            next = { key: 'step-' + index, title: item == null ? 'Step ' + (index + 1) : String(item) };
        } else {
            if (typeof item !== 'object' || Array.isArray(item) || Renderer.isNodeLike(item)) throw new TypeError('[QXFRAME9A7C2] Steps item ' + index + ' must be a primitive title or object.');
            next = Utils.mergeOwn( item);
            if (next.key === undefined || next.key === null || next.key === '') next.key = 'step-' + index;
            else next.key = String(next.key);
            if (own(next, 'status')) next.status = enumValue(next.status, STEPS_STATUSES, 'wait', 'item.status');
            if (own(next, 'disabled') && typeof next.disabled !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Steps item.disabled must be boolean.');
        }
        next.key = String(next.key);
        if (seen[next.key]) throw new TypeError('[QXFRAME9A7C2] Steps item keys must be unique: ' + next.key + '.');
        seen[next.key] = true;
        return next;
    });
}
function renderOutput(host, value, context, doc) {
    const output = typeof value === 'function' ? value(context) : value;
    Renderer.replace(host, output == null ? '' : output, doc);
}
function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Steps instance.');
    return record;
}

export class Steps extends Component {
    static profile = Object.freeze({
        name:'Steps',
        value:Object.freeze({ mode:'current-index' }),
        focus:Object.freeze({ mode:'step-navigation' }),
        interaction:Object.freeze({ mode:'keyboard-navigation' }),
        capability:Object.freeze({ mode:'step-activation-policy' }),
        feedback:Object.freeze({ mode:'root-state-projection' }),
        ownership:Object.freeze({ value:'ValueController', focus:'FocusController', interaction:'InteractionController', capability:'CapabilityController', feedback:'FeedbackController' })
    });
    static options = Object.freeze({
        items: [], current: 0, initial: 0, direction: 'horizontal', status: 'process', type: 'default',
        labelPlacement: 'horizontal', progressDot: false, responsive: true, clickable: false,
        disabled: false, allowCurrentClick: false, size: 'md', className: ''
    });
    static immutableOptions = Object.freeze(['container', 'document']);
    static optionNormalizers = Object.freeze({
        items: normalizeItems,
        current: value => Math.max(0, Math.floor(finiteNumber(value, 0, 'current'))),
        initial: value => Math.floor(finiteNumber(value, 0, 'initial')),
        direction: value => enumValue(value, STEPS_DIRECTIONS, 'horizontal', 'direction'),
        status: value => enumValue(value, STEPS_STATUSES, 'process', 'status'),
        type: value => enumValue(value, STEPS_TYPES, 'default', 'type'),
        labelPlacement: value => enumValue(value, STEPS_LABEL_PLACEMENTS, 'horizontal', 'labelPlacement'),
        size: value => enumValue(value, STEPS_SIZES, 'md', 'size'),
        responsive: value => booleanValue(value, true, 'responsive'),
        clickable: value => booleanValue(value, false, 'clickable'),
        disabled: value => booleanValue(value, false, 'disabled'),
        allowCurrentClick: value => booleanValue(value, false, 'allowCurrentClick'),
        progressDot: value => {
            if (value !== false && value !== true && typeof value !== 'function') throw new TypeError('[QXFRAME9A7C2] Steps progressDot must be boolean or function.');
            return value;
        },
        percent: value => value === undefined ? undefined : clampPercent(value),
        onChange: value => { if (value != null && typeof value !== 'function') throw new TypeError('[QXFRAME9A7C2] Steps onChange must be a function.'); return value; },
        itemRender: value => { if (value != null && typeof value !== 'function') throw new TypeError('[QXFRAME9A7C2] Steps itemRender must be a function.'); return value; },
        className: value => value == null ? '' : String(value)
    });
    static contract = ComponentContracts.get('Steps');

    constructor(options = {}) {
        if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('[QXFRAME9A7C2] Steps options must be an object.');
        if (!options.container || options.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Steps container must be an Element.');
        const doc = options.document || options.container.ownerDocument || globalThis.document;
        super(Utils.mergeOwn( options, { document: doc }));
    }

    [componentHooks.render]() {
        if (state.has(this)) { this.#renderItems(); return recordFor(this).root; }
        const opts = this.options;
        const doc = opts.document;
        const root = doc.createElement('ol');
        const initialCurrent = Math.min(Math.max(0, opts.items.length - 1), opts.current);
        const record = {
            doc, root, valueState: null, collection: null, activeItem: null, rovingProjection: null,
            keyboard: null, focusController: null, capabilityController: null, feedbackController: null, feedbackStatus: 'idle'
        };
        record.valueState = this.own(StateController.create({
            value: initialCurrent,
            controlled: false,
            normalizeValue: value => Math.min(Math.max(0, Math.max(0, this.options.items.length - 1)), Math.max(0, Math.floor(finiteNumber(value, 0, 'current'))))
        }));
        Object.defineProperty(record, 'current', { enumerable:true, get:() => record.valueState.value });
        state.set(this, record);
        opts.container.appendChild(root);
        this.own(() => DOM.removeNode(root));

        record.collection = this.own(Collection.create({
            items: opts.items,
            getKey: item => item.key,
            getLabel: (item, index) => item.title === undefined ? 'Step ' + (index + 1) : item.title,
            isDisabled: item => this.options.disabled === true || item.disabled === true
        }));
        record.activeItem = this.own(ActiveItem.create({
            getEntries: () => record.collection.items,
            getKey: item => item.key,
            isDisabled: item => this.options.disabled === true || item.disabled === true || !(this.options.clickable || typeof this.options.onChange === 'function'),
            loop: false
        }));
        record.rovingProjection = this.own(RovingProjection.create({
            getEntries: () => root ? Array.prototype.slice.call(DOM.findAllPrivate(root, 'stepKey')) : [],
            getKey: node => DOM.getPrivate(node, 'stepKey'), getElement: node => node, getActiveKey: () => record.activeItem.activeKey,
            isDisabled: (_node, _index, element) => !element || element.disabled === true, ensureOne: false
        }));

        record.capabilityController = this.own(CapabilityController.create({
            getState: () => ({ disabled:this.destroyed || this.options.disabled === true }),
            getCapabilities: () => {
                const interactive = this.options.clickable === true || typeof this.options.onChange === 'function';
                return { focusable:interactive, navigable:interactive, activatable:interactive };
            }
        }));
        const syncFeedbackClasses = () => {
            root.classList.toggle('is-loading', record.feedbackStatus === 'pending' || record.feedbackStatus === 'progress');
            root.classList.toggle('is-error', record.feedbackStatus === 'error');
            root.classList.toggle('is-warning', record.feedbackStatus === 'warning');
            root.classList.toggle('is-success', record.feedbackStatus === 'success');
        };
        const feedbackProjector = Object.freeze({
            show: snapshot => { record.feedbackStatus = snapshot.status; syncFeedbackClasses(); return root; },
            update: (_handle, snapshot) => { record.feedbackStatus = snapshot.status; syncFeedbackClasses(); return root; },
            close: () => { record.feedbackStatus = 'idle'; syncFeedbackClasses(); return true; }
        });
        record.feedbackController = this.own(FeedbackController.createForProjector(feedbackProjector, { ownerId:this.id }, 'local'));

        this.own(DOM.listen(root, 'click', event => {
            const node = event.target ? DOM.closestPrivate(event.target, root, 'stepAction') : null;
            if (!node || !root.contains(node)) return;
            event.preventDefault();
            const index = Number(DOM.getPrivate(node, 'stepAction'));
            const item = this.options.items[index];
            if (!item || !this.#interactive(item) || !record.capabilityController.can('activate')) return;
            if (index === record.current && this.options.allowCurrentClick !== true) return;
            const source = DOM.activationSource(event);
            record.activeItem.set(item.key, { silent: true, source, reason: 'click' });
            this.setCurrent(index, { reason: 'click', source, event, originalEvent: event, focus: true, notifySame: this.options.allowCurrentClick === true });
        }));
        this.own(DOM.listen(root, 'focusin', event => {
            const node = event.target ? DOM.closestPrivate(event.target, root, 'stepKey') : null;
            if (!node || !root.contains(node)) return;
            record.activeItem.set(DOM.getPrivate(node, 'stepKey'), { silent: true, source: 'focus', reason: 'focusin' });
            this.#syncRoving();
        }));
        record.focusController = this.own(FocusController.create({
            root,
            document: doc,
            manageTabIndex: false,
            navigation: {
                activeItem: record.activeItem,
                orientation: 'both',
                shouldHandle: detail => {
                    const key = detail.eventKey, current = this.options;
                    if (!record.capabilityController.can('navigate')) return false;
                    if (key === 'Home' || key === 'End') return true;
                    if (current.direction === 'vertical') return key === 'ArrowUp' || key === 'ArrowDown';
                    return key === 'ArrowLeft' || key === 'ArrowRight';
                },
                onNavigate: () => { this.#syncRoving(); this.#focusActive(); }
            }
        }));
        record.keyboard = record.focusController.keyboard;
        this.#renderItems();
        return root;
    }

    [componentHooks.optionsUpdated](next, _previous, patch) {
        const record = recordFor(this);
        const maxCurrent = Math.max(0, next.items.length - 1);
        const projectedCurrent = own(patch, 'current') ? Math.min(maxCurrent, next.current) : Math.min(maxCurrent, record.current);
        record.valueState.syncExternal(projectedCurrent, { silent:true, source:'options', reason:own(patch, 'current') ? 'current' : 'items-clamp' });
        record.collection.updateOptions({ items: next.items, isDisabled: item => next.disabled === true || item.disabled === true });
        record.focusController.setDisabled(next.disabled === true);
        record.activeItem.updateOptions({ isDisabled: item => next.disabled === true || item.disabled === true || !(next.clickable || typeof next.onChange === 'function') });
        this.#renderItems();
    }

    #currentKey() { const r = recordFor(this), item = this.options.items[r.current]; return item ? item.key : ''; }
    #itemStatus(item, index) { const r = recordFor(this), opts = this.options; if (item && item.status) return item.status; if (index < r.current) return 'finish'; if (index === r.current) return opts.status; return 'wait'; }
    #contextFor(item, index, status, element, details) {
        const r = recordFor(this), opts = this.options;
        return Item.createContext(item, Utils.assignOwn({
            index, key: item && item.key, value: item && item.key, element: element || null, component: this, controller: this,
            status, title: item && item.title, description: item && item.description, item, instance: this,
            disabled: opts.disabled === true || !!(item && item.disabled), selected: index === r.current, active: !!(item && item.key === r.activeItem.activeKey)
        }, details || {}));
    }
    #renderDefaultIcon(holder, status, index) {
        const { doc } = recordFor(this);
        if (status === 'finish' || status === 'error') {
            const node = doc.createElement('span');
            node.className = 'qxframe9a7c2-steps-status-icon';
            node.classList.add('qxframe9a7c2-icon', 'qxframe9a7c2-icon-' + (status === 'finish' ? 'check' : 'close'), 'is-line', 'is-round', 'is-stroke-3');
            holder.appendChild(node); return;
        }
        holder.appendChild(doc.createTextNode(String(this.options.initial + index + 1)));
    }
    #renderDot(holder, item, index, status) {
        const { doc } = recordFor(this), opts = this.options;
        const dot = doc.createElement('span'); dot.className = 'qxframe9a7c2-steps-dot';
        if (typeof opts.progressDot !== 'function') { holder.appendChild(dot); return; }
        const output = opts.progressDot(dot, this.#contextFor(item, index, status));
        if (output === undefined || output === null || output === false || output === dot) { holder.appendChild(dot); return; }
        const custom = doc.createElement('span'); custom.className = 'qxframe9a7c2-steps-dot-custom'; Renderer.replace(custom, output, doc); holder.appendChild(custom);
    }
    #interactive(item) { const opts = this.options; return !opts.disabled && item.disabled !== true && (opts.clickable || typeof opts.onChange === 'function'); }
    #syncRoving() { const r = recordFor(this); if (r.root) r.rovingProjection.sync(); }
    #ensureActive() { const r = recordFor(this), key = this.#currentKey(); if (key && r.activeItem.set(key, { silent: true, source: 'steps', reason: 'current' })) return true; return r.activeItem.ensureValid({ silent: true, source: 'steps', reason: 'ensure' }); }
    #focusActive() {
        const r = recordFor(this); if (!r.root || !r.activeItem.activeKey) return false;
        let node = null;
        Array.prototype.some.call(DOM.findAllPrivate(r.root, 'stepKey'), candidate => { if (DOM.getPrivate(candidate, 'stepKey') !== r.activeItem.activeKey) return false; node = candidate; return true; });
        if (!node || node.disabled || !node.focus) return false;
        DOM.focusElement(node); return r.doc.activeElement === node;
    }
    #renderItems() {
        if (this.destroyed) return false;
        const r = recordFor(this), opts = this.options, { root, doc } = r;
        root.className = 'qxframe9a7c2-steps is-' + opts.direction + ' is-' + opts.type + ' is-' + opts.size +
            (opts.progressDot || opts.labelPlacement === 'vertical' ? ' is-label-vertical' : '') +
            (opts.responsive ? ' is-responsive' : '') +
            (opts.responsive && opts.direction === 'horizontal' && opts.type === 'default' ? ' is-responsive-stack' : '') +
            (opts.disabled ? ' is-disabled' : '') + (opts.className ? ' ' + opts.className : '');
        this.#ensureActive();
        while (root.firstChild) root.removeChild(root.firstChild);
        opts.items.forEach((item, index) => {
            const status = this.#itemStatus(item, index), disabled = opts.disabled || item.disabled === true, clickable = this.#interactive(item);
            const step = doc.createElement('li'), connector = doc.createElement('span'), main = doc.createElement(clickable ? 'button' : 'div');
            const icon = doc.createElement('span'), content = doc.createElement('span'), heading = doc.createElement('span'), title = doc.createElement('span');
            step.className = 'qxframe9a7c2-steps-item is-' + status + (disabled ? ' is-disabled' : '') + (index === r.current ? ' is-current' : '') + (item.key === r.activeItem.activeKey ? ' is-active' : '');
            DOM.setPrivate(step, 'stepIndex', String(index)); DOM.setPrivate(step, 'stepLast', index === opts.items.length - 1 ? 'true' : 'false');
            connector.className = 'qxframe9a7c2-steps-connector qxframe9a7c2-steps-item-rail'; main.className = 'qxframe9a7c2-steps-main qxframe9a7c2-steps-item-wrapper';
            if (clickable) { main.type = 'button'; DOM.setPrivate(main, 'stepAction', String(index)); DOM.setPrivate(main, 'stepKey', item.key); }
            icon.className = 'qxframe9a7c2-steps-icon';
            const ctx = this.#contextFor(item, index, status, main);
            if (opts.progressDot) this.#renderDot(icon, item, index, status); else if (item.icon !== undefined) renderOutput(icon, item.icon, ctx, doc); else this.#renderDefaultIcon(icon, status, index);
            if (index === r.current && opts.percent !== undefined && opts.type === 'default' && !opts.progressDot) { icon.classList.add('has-progress'); icon.style.setProperty('--qxframe9a7c2-step-percent', String(opts.percent * 3.6) + 'deg'); }
            content.className = 'qxframe9a7c2-steps-content qxframe9a7c2-steps-item-section'; heading.className = 'qxframe9a7c2-steps-heading qxframe9a7c2-steps-item-header'; title.className = 'qxframe9a7c2-steps-title';
            renderOutput(title, item.title === undefined ? 'Step ' + (index + 1) : item.title, ctx, doc); heading.appendChild(title);
            if (item.subTitle !== undefined) { const subTitle = doc.createElement('span'); subTitle.className = 'qxframe9a7c2-steps-subtitle'; renderOutput(subTitle, item.subTitle, ctx, doc); heading.appendChild(subTitle); }
            if (typeof opts.itemRender === 'function') {
                const customSlot = doc.createElement('span'); customSlot.className = 'qxframe9a7c2-steps-item-content'; let iconClaimed = false;
                const itemCtx = this.#contextFor(item, index, status, main, { parts: Item.createParts({ icon: () => { iconClaimed = true; return icon; } }) });
                Renderer.append(customSlot, opts.itemRender(item, itemCtx)); while (heading.firstChild) heading.removeChild(heading.firstChild); heading.appendChild(customSlot); while (content.firstChild) content.removeChild(content.firstChild); content.appendChild(heading); if (!iconClaimed) main.appendChild(icon); main.appendChild(content);
            } else {
                content.appendChild(heading);
                if (item.description !== undefined && opts.type !== 'inline') { const description = doc.createElement('span'); description.className = 'qxframe9a7c2-steps-description'; renderOutput(description, item.description, ctx, doc); content.appendChild(description); }
                main.appendChild(icon); main.appendChild(content);
            }
            step.appendChild(main); if (index !== opts.items.length - 1) step.appendChild(connector); root.appendChild(step);
        });
        this.#syncRoving();
        root.classList.toggle('is-loading', r.feedbackStatus === 'pending' || r.feedbackStatus === 'progress');
        root.classList.toggle('is-error', r.feedbackStatus === 'error');
        root.classList.toggle('is-warning', r.feedbackStatus === 'warning');
        root.classList.toggle('is-success', r.feedbackStatus === 'success');
        return this;
    }

    setCurrent(next, config = {}) {
        if (this.destroyed) return false;
        const r = recordFor(this), max = Math.max(0, this.options.items.length - 1), value = Math.min(max, Math.max(0, Math.floor(finiteNumber(next, 0, 'current')))), previous = r.current;
        this.updateOptions({ current: value });
        if (config.focus === true) this.#focusActive();
        const notifySame = previous === r.current && config.notifySame === true;
        if ((previous !== r.current || notifySame) && !config.silent && typeof this.options.onChange === 'function') {
            this.options.onChange(r.current, { previous, reason: config.reason || 'api', source: config.source || 'api', event: config.event || config.originalEvent || null, originalEvent: config.originalEvent || config.event || null, item: this.options.items[r.current], instance: this });
        }
        return this;
    }
    next(config) { return this.setCurrent(recordFor(this).current + 1, Utils.assignOwn({ reason: 'next' }, config || {})); }
    prev(config) { return this.setCurrent(recordFor(this).current - 1, Utils.assignOwn({ reason: 'prev' }, config || {})); }
    setItems(items) { if (this.destroyed) return false; this.updateOptions({ items }); return this; }
    getState() { const r = recordFor(this), opts = this.options; return Object.freeze({ current: r.current, activeKey: r.activeItem.activeKey || null, count: opts.items.length, status: opts.items.length ? this.#itemStatus(opts.items[r.current] || {}, r.current) : opts.status, direction: opts.direction, type: opts.type, labelPlacement: opts.labelPlacement, progressDot: opts.progressDot !== false, responsive: opts.responsive, disabled: opts.disabled, size: opts.size, destroyed: this.destroyed }); }
    getRootElement() { return recordFor(this).root; }
    getItems() { return this.options.items.map(item => Utils.mergeOwn( item)); }
    getCollection() { return recordFor(this).collection; }
    getActiveItem() { return recordFor(this).activeItem; }
    getValueController() { return recordFor(this).valueState; }
    getFocusController() { return recordFor(this).focusController; }
    getCapabilityController() { return recordFor(this).capabilityController; }
    getFeedbackController() { return recordFor(this).feedbackController; }
    getKeyboardNavigation() { return recordFor(this).keyboard; }
}

export default Steps;
