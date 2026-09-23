import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { DOM } from '../core/dom.js';
import { Scheduler } from '../core/scheduler.js';
import { Renderer } from '../core/renderer.js';
import { SemanticStyles } from '../utils/semanticStyles.js';

const NS = 'http://www.w3.org/2000/svg';
const circle = 'M7.238500000000002,43.3493A36.1108,36.1108 0,1,1 79.4601,43.3493A36.1108,36.1108 0,1,1 7.238500000000002,43.3493';
const definitions = Object.freeze({
    success:{viewBox:'0 0 86.6986 86.6986',nodes:[['path',{class:'qxframe9a7c2-result-line result-bg',d:circle}],['path',{class:'qxframe9a7c2-result-line result-out',d:circle}],['path',{class:'qxframe9a7c2-result-line result-in-1',d:'M26.316,42.859L37.9984,54.5414L60.3826,32.1572'}]]},
    error:{viewBox:'0 0 86.6986 86.6986',nodes:[['path',{class:'qxframe9a7c2-result-line result-bg',d:circle}],['path',{class:'qxframe9a7c2-result-line result-out',d:circle}],['path',{class:'qxframe9a7c2-result-line result-in-1',d:'M28.774,57.9246L57.9247,28.7739'}],['path',{class:'qxframe9a7c2-result-line result-in-2',d:'M57.9246,57.9246L28.7739,28.7739'}]]},
    warning:{viewBox:'0 0 86.6986 86.6986',nodes:[['path',{class:'qxframe9a7c2-result-line result-bg',d:'M43.4611 7.24c2.8081,0.0924 4.39,1.7 5.3045,3.1159l17.4543 29.9414 17.3445 29.7538c0.5448,1.0193 1.596,4.0544 0.1109,6.4168 -1.4849,2.3626 -3.6815,2.9155 -5.3768,2.992l-34.9082 0.0002 -34.6892 -0.0002c-1.1636,-0.0421 -4.3433,-0.6583 -5.6666,-3.1131 -1.3232,-2.4549 -0.7085,-4.6157 0.0723,-6.1078l17.454 -29.9417 17.3449 -29.7537c0.6185,-0.977 2.7471,-3.396 5.5554,-3.3036z'}],['path',{class:'qxframe9a7c2-result-line result-out',d:'M43.4611 7.24c2.8081,0.0924 4.39,1.7 5.3045,3.1159l17.4543 29.9414 17.3445 29.7538c0.5448,1.0193 1.596,4.0544 0.1109,6.4168 -1.4849,2.3626 -3.6815,2.9155 -5.3768,2.992l-34.9082 0.0002 -34.6892 -0.0002c-1.1636,-0.0421 -4.3433,-0.6583 -5.6666,-3.1131 -1.3232,-2.4549 -0.7085,-4.6157 0.0723,-6.1078l17.454 -29.9417 17.3449 -29.7537c0.6185,-0.977 2.7471,-3.396 5.5554,-3.3036z'}],['path',{class:'qxframe9a7c2-result-line result-in-1',d:'M43.3493,27.8713L43.3493,57.2858'}],['circle',{class:'qxframe9a7c2-result-circle result-in-2',cx:'43.3492',cy:'64.3337',r:'3.8'}]]},
    question:{viewBox:'0 0 86.6986 86.6986',nodes:[['path',{class:'qxframe9a7c2-result-line result-bg',d:circle}],['path',{class:'qxframe9a7c2-result-line result-out',d:circle}],['path',{class:'qxframe9a7c2-result-line result-in-1',d:'M32.3757 35.7255c-0.2203,-11.823 12.5789,-14.1087 18.4056,-9.4189 5.4663,4.3995 4.7426,12.804 -3.1088,17.9938 -3.0015,1.9839 -3.0003,3.8403 -3.0003,10.1707'}],['circle',{class:'qxframe9a7c2-result-circle result-in-2',cx:'44.6612',cy:'60.5502',r:'3.8'}]]},
    info:{viewBox:'0 0 86.6986 86.6986',nodes:[['path',{class:'qxframe9a7c2-result-line result-bg',d:circle}],['path',{class:'qxframe9a7c2-result-line result-out',d:circle}],['path',{class:'qxframe9a7c2-result-line result-in-1',d:'M43.3493,65.0602L43.3493,30.9723'}],['circle',{class:'qxframe9a7c2-result-circle result-in-2',cx:'43.3492',cy:'23.5856',r:'3.8'}]]},
    loading:{viewBox:'0 0 86.6986 86.6986',nodes:[['g',{class:'result-spin'},[['path',{class:'qxframe9a7c2-result-line result-bg',d:circle}]]]]},
    close:{viewBox:'0 0 86.6986 86.6986',nodes:[['path',{class:'qxframe9a7c2-result-line result-in-1',d:'M28.774,57.9246L57.9247,28.7739'}],['path',{class:'qxframe9a7c2-result-line result-in-2',d:'M57.9246,57.9246L28.7739,28.7739'}]]}
});
const names = Object.freeze(Object.keys(definitions));
const sizes = Object.freeze(['xs','sm','md','lg','xl']);
const state = new WeakMap();

function appendNode(parent, spec, doc) {
    const node = doc.createElementNS(NS, spec[0]);
    Object.keys(spec[1] || {}).forEach(key => {
        const value = spec[1][key];
        if (key === 'class') node.setAttribute('class', value);
        else if (key === 'd') node.setAttribute('d', value);
        else if (key === 'cx') node.setAttribute('cx', value);
        else if (key === 'cy') node.setAttribute('cy', value);
        else if (key === 'r') node.setAttribute('r', value);
        else throw new TypeError('[QXFRAME9A7C2] Result internal SVG attribute is not allowed: ' + key);
    });
    (spec[2] || []).forEach(child => appendNode(node, child, doc));
    parent.appendChild(node);
    return node;
}
function normalizeName(name) {
    const value = String(name || 'question');
    if (names.indexOf(value) < 0) throw new TypeError('[QXFRAME9A7C2] Result name must be one of: ' + names.join(', ') + '.');
    return value;
}
function normalizeBoolean(value, fallback, name) {
    if (value === undefined || value === null) return fallback;
    if (typeof value !== 'boolean') throw new TypeError('[QXFRAME9A7C2] Result ' + name + ' must be boolean.');
    return value;
}
function applySize(svg, size) {
    sizes.forEach(name => svg.classList.remove('is-' + name));
    if (size === undefined || size === null || size === '') { svg.style.width = ''; svg.style.height = ''; return; }
    let value = String(size);
    if (sizes.indexOf(value) >= 0) { svg.classList.add('is-' + value); svg.style.width = ''; svg.style.height = ''; return; }
    if (typeof size === 'number' && Number.isFinite(size)) value = size + 'px';
    svg.style.width = value;
    svg.style.height = value;
}
function build(doc, name, opts) {
    const definition = definitions[name];
    const svg = doc.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', opts.viewBox || definition.viewBox);
    svg.classList.add('qxframe9a7c2-result', 'qxframe9a7c2-result-' + name);
    applySize(svg, opts.size);
    svg.classList.toggle('is-visible', opts.visible === true);
    definition.nodes.forEach(node => appendNode(svg, node, doc));
    return svg;
}
function data(instance) {
    const value = state.get(instance);
    if (!value) throw new TypeError('[QXFRAME9A7C2] Invalid Result instance.');
    return value;
}

export class Result extends Component {
    static options = Object.freeze({ name: 'question', visible: false });
    static optionNormalizers = Object.freeze({
        name: normalizeName,
        visible: value => normalizeBoolean(value, false, 'visible')
    });
    static immutableOptions = Object.freeze(['container', 'document']);
    static contract = ComponentContracts.get('Result');
    static names = names;

    [componentHooks.render]() {
        const opts = this.options;
        if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Result container must be an Element.');
        const current = state.get(this);
        if (current && current.root) return current.root;
        const doc = opts.document || opts.container.ownerDocument || globalThis.document;
        if (!doc || typeof doc.createElement !== 'function' || typeof doc.createElementNS !== 'function') throw new TypeError('[QXFRAME9A7C2] Result requires a document.');

        const root = doc.createElement('div');
        const icon = doc.createElement('div');
        const title = doc.createElement('div');
        const subtitle = doc.createElement('div');
        const extra = doc.createElement('div');
        root.className = 'qxframe9a7c2-result-surface';
        icon.className = 'qxframe9a7c2-result-icon';
        title.className = 'qxframe9a7c2-result-title';
        subtitle.className = 'qxframe9a7c2-result-subtitle';
        extra.className = 'qxframe9a7c2-result-extra';
        root.appendChild(icon);
        opts.container.appendChild(root);

        const record = {
            doc, root, icon, title, subtitle, extra,
            svg: null, iconMode: '', iconKey: '', iconValue: undefined,
            name: opts.name, visible: opts.visible === true,
            semanticStyles: null, scheduler: null
        };
        state.set(this, record);

        this.own(() => { DOM.removeNode(root); record.root = null; record.svg = null; });
        record.semanticStyles = SemanticStyles.create({ slots: Object.freeze({ root, icon, title, subtitle, extra }), classNames: opts.classNames, styles: opts.styles });
        this.own(record.semanticStyles);
        record.scheduler = Scheduler.createFrameScheduler(() => {
            if (this.destroyed) return;
            this.updateOptions({ visible: true });
        });
        this.own(record.scheduler);
        this.#renderContent();
        return root;
    }

    [componentHooks.optionsUpdated](next) {
        const record = state.get(this);
        if (!record || !record.root) return;
        record.name = next.name;
        record.visible = next.visible === true;
        record.semanticStyles.update({ classNames: next.classNames, styles: next.styles });
        this.#renderContent();
    }

    show() { if (this.destroyed) return false; this.updateOptions({ visible: true }); return this; }
    hide() { if (this.destroyed) return false; this.updateOptions({ visible: false }); return this; }
    restart() {
        if (this.destroyed) return false;
        this.updateOptions({ visible: false });
        data(this).scheduler.request('result-restart');
        return this;
    }
    setName(next) { if (this.destroyed) return false; this.updateOptions({ name: next }); return this; }
    getState() {
        const record = data(this);
        const opts = this.options;
        return Object.freeze({
            name: record.name,
            visible: record.visible,
            customIcon: opts.icon !== undefined && opts.icon !== null,
            hasTitle: !!(record.title && record.title.parentNode === record.root),
            hasSubtitle: !!(record.subtitle && record.subtitle.parentNode === record.root),
            hasExtra: !!(record.extra && record.extra.parentNode === record.root),
            destroyed: this.destroyed
        });
    }
    getRootElement() { return this.root; }
    getIconElement() { const record = state.get(this); return record ? record.icon : null; }

    #hasCustomIcon() {
        const opts = this.options;
        return opts.icon !== undefined && opts.icon !== null;
    }
    #defaultIconKey() {
        const opts = this.options;
        return [data(this).name, String(opts.size === undefined || opts.size === null ? '' : opts.size), String(opts.viewBox || '')].join('|');
    }
    #applyVisibility() {
        const record = data(this);
        record.root.classList.toggle('is-visible', record.visible);
        if (record.svg) record.svg.classList.toggle('is-visible', record.visible);
    }
    #syncStatusClass() {
        const record = data(this);
        names.forEach(item => record.root.classList.remove('is-' + item));
        record.root.classList.add('is-' + record.name);
    }
    #renderIcon(force) {
        const record = data(this);
        const opts = this.options;
        if (this.#hasCustomIcon()) {
            if (force || record.iconMode !== 'custom' || record.iconValue !== opts.icon) Renderer.replace(record.icon, opts.icon, record.doc);
            record.svg = null;
            record.iconMode = 'custom';
            record.iconValue = opts.icon;
            record.iconKey = '';
            return;
        }
        const key = this.#defaultIconKey();
        if (force || record.iconMode !== 'default' || !record.svg || record.iconKey !== key) {
            record.svg = build(record.doc, record.name, Object.assign({}, opts, { visible: record.visible }));
            Renderer.replace(record.icon, record.svg, record.doc);
            record.iconMode = 'default';
            record.iconValue = undefined;
            record.iconKey = key;
        }
        this.#applyVisibility();
    }
    #setContentNode(node, value, before) {
        const record = data(this);
        const present = !(value === undefined || value === null || value === false || value === '');
        Renderer.replace(node, present ? value : '', record.doc);
        if (!present) { if (node.parentNode) node.parentNode.removeChild(node); return false; }
        if (node.parentNode !== record.root || node.nextSibling !== before) record.root.insertBefore(node, before || null);
        return true;
    }
    #renderContent() {
        const record = data(this);
        const opts = this.options;
        this.#syncStatusClass();
        this.#renderIcon(false);
        const extraPresent = this.#setContentNode(record.extra, opts.extra, null);
        const subtitlePresent = this.#setContentNode(record.subtitle, opts.subtitle, extraPresent ? record.extra : null);
        this.#setContentNode(record.title, opts.title, subtitlePresent ? record.subtitle : (extraPresent ? record.extra : null));
        this.#applyVisibility();
    }
}

export { names as RESULT_NAMES };
export default Result;
