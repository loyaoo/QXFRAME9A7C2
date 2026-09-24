import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { FeedbackController } from '../core/feedbackController.js';
import { Renderer } from '../core/renderer.js';
import { IdManager } from '../utils/id.js';
import { Utils } from '../utils/utils.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const TYPES = Object.freeze(['line', 'circle', 'dashboard']);
const STATUSES = Object.freeze(['normal', 'active', 'success', 'exception']);
const LINECAPS = Object.freeze(['round', 'butt', 'square']);
const DIRECTIONS = Object.freeze(['horizontal', 'vertical']);
const GAPS = Object.freeze(['top', 'bottom', 'left', 'right']);
const SIZES = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl']);
const COLORS = Object.freeze(['grey', 'gray', 'cyan', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'pink', 'purple', 'blue', 'azure', 'primary', 'white', 'black', 'success', 'warning', 'error', 'info']);
const state = new WeakMap();
const own = Utils.own;

function clamp(value, min, max) {
    let number = Number(value);
    if (!Number.isFinite(number)) number = 0;
    return Math.min(max, Math.max(min, number));
}
function enumValue(value, allowed, fallback, label) { return Utils.enumValue(value, allowed, fallback, 'Progress ' + label); }
function normalizeSize(size) {
    if (size === undefined || size === null || size === '') return 'md';
    if (typeof size === 'string') return Utils.normalizeEnum(size, SIZES, undefined, 'Progress size');
    if (typeof size === 'number') {
        if (!Number.isFinite(size) || size <= 0) throw new TypeError('[QXFRAME9A7C2] Progress numeric size must be greater than 0.');
        return size;
    }
    if (size && typeof size === 'object' && !Array.isArray(size)) {
        const output = {};
        if (own(size, 'width')) {
            if ((typeof size.width !== 'number' && typeof size.width !== 'string') || size.width === '') throw new TypeError('[QXFRAME9A7C2] Progress size.width must be a number or CSS length.');
            output.width = size.width;
        }
        if (own(size, 'height')) {
            if ((typeof size.height !== 'number' && typeof size.height !== 'string') || size.height === '') throw new TypeError('[QXFRAME9A7C2] Progress size.height must be a number or CSS length.');
            output.height = size.height;
        }
        if (!own(output, 'width') && !own(output, 'height')) throw new TypeError('[QXFRAME9A7C2] Progress size object requires width or height.');
        return Object.freeze(output);
    }
    throw new TypeError('[QXFRAME9A7C2] Progress size must be a semantic size, number, or {width,height}.');
}
function normalizeSteps(steps) {
    if (steps === undefined || steps === null || steps === false) return null;
    let count, gap;
    if (typeof steps === 'number') { count = steps; gap = 2; }
    else if (steps && typeof steps === 'object' && !Array.isArray(steps)) { count = steps.count; gap = steps.gap === undefined ? 2 : steps.gap; }
    else throw new TypeError('[QXFRAME9A7C2] Progress steps must be a positive number or {count,gap}.');
    count = Number(count);
    gap = Number(gap);
    if (!Number.isFinite(count) || count <= 0) throw new TypeError('[QXFRAME9A7C2] Progress steps.count must be greater than 0.');
    if (!Number.isFinite(gap) || gap < 0) throw new TypeError('[QXFRAME9A7C2] Progress steps.gap must be 0 or greater.');
    return Object.freeze({ count: Math.max(1, Math.floor(count)), gap });
}
function normalizeSuccess(success) {
    if (success === undefined || success === null || success === false) return Object.freeze({ percent: 0, strokeColor: '' });
    if (!success || typeof success !== 'object' || Array.isArray(success)) throw new TypeError('[QXFRAME9A7C2] Progress success must be {percent, strokeColor?}.');
    return Object.freeze({ percent: clamp(success.percent, 0, 100), strokeColor: success.strokeColor == null ? '' : String(success.strokeColor) });
}
function normalizeStrokeColor(value) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return Object.freeze(value.map(String));
    if (value && typeof value === 'object') {
        const output = {};
        Object.keys(value).forEach(key => { if (key === 'from' || key === 'to' || key === 'direction' || /%$/.test(key)) output[key] = String(value[key]); });
        return Object.freeze(output);
    }
    throw new TypeError('[QXFRAME9A7C2] Progress strokeColor must be a string, string array, or gradient object.');
}
function normalizeNullableFunction(value, label) {
    if (value === undefined || value === null) return value;
    if (typeof value !== 'function') throw new TypeError('[QXFRAME9A7C2] Progress ' + label + ' must be a function.');
    return value;
}
function lengthValue(value) { return typeof value === 'number' ? value + 'px' : String(value); }
function gradientValue(value, vertical) {
    if (Array.isArray(value)) return value.length ? value[0] : '';
    if (!value || typeof value !== 'object') return value || '';
    if (value.from || value.to) return 'linear-gradient(' + (value.direction || (vertical ? 'to top' : 'to right')) + ', ' + (value.from || value.to) + ', ' + (value.to || value.from) + ')';
    const stops = Object.keys(value).filter(key => /%$/.test(key)).sort((a, b) => Number(a.slice(0, -1)) - Number(b.slice(0, -1))).map(key => value[key] + ' ' + key);
    return stops.length ? 'linear-gradient(' + (vertical ? 'to top' : 'to right') + ', ' + stops.join(', ') + ')' : '';
}
function effectiveStatus(opts) {
    if (opts.status === 'exception' || opts.status === 'active') return opts.status;
    if (opts.status === 'success' || opts.percent >= 100) return 'success';
    return 'normal';
}
function circleRotation(gapPlacement) {
    if (gapPlacement === 'top') return 135;
    if (gapPlacement === 'left') return 45;
    if (gapPlacement === 'right') return 225;
    return -45;
}
function requireState(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Progress instance.');
    return record;
}
function statusIcon(record, name) {
    const icon = record.doc.createElement('span');
    icon.className = 'qxframe9a7c2-icon qxframe9a7c2-icon-' + name + ' is-line is-round is-stroke-3';
    return icon;
}
function formatOutput(instance, record, status) {
    const opts = instance.options;
    if (typeof opts.format === 'function') return opts.format(opts.percent, opts.success.percent, { status, instance });
    if (status === 'success') return statusIcon(record, 'check');
    if (status === 'exception') return statusIcon(record, 'close');
    return Math.round(opts.percent) + '%';
}
function applyRoot(instance, record, status) {
    const opts = instance.options;
    record.root.className = 'qxframe9a7c2-progress qxframe9a7c2-progress-' + opts.type + ' is-' + status + (opts.color ? ' is-' + opts.color : '') + (opts.direction === 'vertical' && opts.type === 'line' ? ' is-vertical' : '');
    if (typeof opts.size === 'string') record.root.classList.add('is-' + opts.size);
}
function makeInfo(record) {
    const info = record.doc.createElement('span');
    info.className = 'qxframe9a7c2-progress-info';
    return info;
}
function buildLine(instance, record) {
    const opts = instance.options;
    const outer = record.doc.createElement('div');
    const inner = record.doc.createElement('div');
    outer.className = 'qxframe9a7c2-progress-outer' + (opts.direction === 'vertical' ? ' is-vertical' : '');
    inner.className = 'qxframe9a7c2-progress-inner';
    outer.appendChild(inner);
    record.root.appendChild(outer);
    const built = { type: 'line', outer, inner, info: makeInfo(record) };
    if (opts.steps) {
        inner.classList.add('is-steps');
        built.segments = [];
        for (let index = 0; index < opts.steps.count; index += 1) {
            const segment = record.doc.createElement('span');
            segment.className = 'qxframe9a7c2-progress-step qxframe9a7c2-progress-segment';
            inner.appendChild(segment);
            built.segments.push(segment);
        }
    } else {
        const rail = record.doc.createElement('div');
        const bars = record.doc.createElement('div');
        const success = record.doc.createElement('div');
        const bar = record.doc.createElement('div');
        rail.className = 'qxframe9a7c2-progress-rail';
        bars.className = 'qxframe9a7c2-progress-bars';
        success.className = 'qxframe9a7c2-progress-bar qxframe9a7c2-progress-success';
        bar.className = 'qxframe9a7c2-progress-bar qxframe9a7c2-progress-primary';
        bars.appendChild(success);
        bars.appendChild(bar);
        inner.appendChild(rail);
        inner.appendChild(bars);
        built.rail = rail;
        built.success = success;
        built.bar = bar;
    }
    record.root.appendChild(built.info);
    return built;
}
function makeCircle(instance, record, className, strokeWidth, rotation) {
    const circle = record.doc.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('class', className);
    circle.setAttribute('cx', '50');
    circle.setAttribute('cy', '50');
    circle.setAttribute('r', String(50 - strokeWidth / 2));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke-width', String(strokeWidth));
    circle.setAttribute('transform', 'rotate(' + rotation + ' 50 50)');
    circle.setAttribute('stroke-linecap', instance.options.strokeLinecap);
    return circle;
}
function buildCircle(instance, record) {
    const opts = instance.options;
    const holder = record.doc.createElement('div');
    const svg = record.doc.createElementNS(SVG_NS, 'svg');
    const rotation = opts.type === 'dashboard' ? circleRotation(opts.gapPlacement) : -90;
    holder.className = 'qxframe9a7c2-progress-circle-holder';
    svg.setAttribute('class', 'qxframe9a7c2-progress-circle-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    const rail = makeCircle(instance, record, 'qxframe9a7c2-progress-circle-rail', opts.strokeWidth, rotation);
    const success = makeCircle(instance, record, 'qxframe9a7c2-progress-circle-success', opts.strokeWidth, rotation);
    const bar = makeCircle(instance, record, 'qxframe9a7c2-progress-circle-bar', opts.strokeWidth, rotation);
    svg.appendChild(rail);
    svg.appendChild(success);
    svg.appendChild(bar);
    holder.appendChild(svg);
    const info = makeInfo(record);
    holder.appendChild(info);
    record.root.appendChild(holder);
    return { type: 'circle', holder, svg, rail, success, bar, info, gradient: null };
}
function ensureProjection(instance, record) {
    const opts = instance.options;
    const key = [opts.type, opts.direction, opts.steps ? opts.steps.count : 0].join('|');
    if (record.projection && record.projectionKey === key) return record.projection;
    record.root.textContent = '';
    record.projection = opts.type === 'line' ? buildLine(instance, record) : buildCircle(instance, record);
    record.projectionKey = key;
    return record.projection;
}
function applySize(instance, view) {
    const opts = instance.options;
    const size = opts.size;
    if (view.type === 'line') {
        view.outer.style.width = '';
        view.outer.style.height = '';
        view.inner.style.height = '';
        view.inner.style.width = '';
        if (typeof size === 'string') return;
        if (typeof size === 'number') {
            view.outer.style.width = lengthValue(size);
            if (opts.direction === 'vertical') view.inner.style.width = lengthValue(size);
            else view.inner.style.height = lengthValue(size);
        } else {
            if (own(size, 'width')) view.outer.style.width = lengthValue(size.width);
            if (own(size, 'height')) {
                if (opts.direction === 'vertical') view.inner.style.width = lengthValue(size.height);
                else view.inner.style.height = lengthValue(size.height);
            }
        }
    } else {
        view.holder.style.width = '';
        view.holder.style.height = '';
        view.svg.style.width = '';
        view.svg.style.height = '';
        if (typeof size === 'string') return;
        const width = typeof size === 'number' ? size : (own(size, 'width') ? size.width : 120);
        const height = typeof size === 'number' ? size : (own(size, 'height') ? size.height : width);
        view.holder.style.width = lengthValue(width);
        view.holder.style.height = lengthValue(height);
        view.svg.style.width = lengthValue(width);
        view.svg.style.height = lengthValue(height);
    }
}
function updateLine(instance, view, status) {
    const opts = instance.options;
    applySize(instance, view);
    if (opts.steps) {
        view.inner.style.gap = opts.steps.gap + 'px';
        const filled = Math.round((opts.percent / 100) * opts.steps.count);
        const successFilled = Math.round((opts.success.percent / 100) * opts.steps.count);
        view.segments.forEach((segment, index) => {
            segment.classList.toggle('is-success', index < successFilled);
            segment.classList.toggle('is-active', index >= successFilled && index < filled);
            segment.style.background = index < successFilled && opts.success.strokeColor
                ? opts.success.strokeColor
                : (index >= successFilled && index < filled && Array.isArray(opts.strokeColor) && opts.strokeColor.length ? opts.strokeColor[index % opts.strokeColor.length] : '');
        });
        return;
    }
    view.rail.style.background = opts.railColor || '';
    view.success.style.background = opts.success.strokeColor || '';
    view.bar.style.background = gradientValue(opts.strokeColor, opts.direction === 'vertical') || '';
    view.bar.classList.toggle('is-active', status === 'active');
    const successValue = opts.success.percent;
    const mainValue = Math.max(0, opts.percent - successValue);
    if (opts.direction === 'vertical') {
        view.success.style.width = '';
        view.bar.style.width = '';
        view.bar.style.left = '';
        view.success.style.height = successValue + '%';
        view.bar.style.height = mainValue + '%';
        view.bar.style.bottom = successValue + '%';
    } else {
        view.success.style.height = '';
        view.bar.style.height = '';
        view.bar.style.bottom = '';
        view.success.style.width = successValue + '%';
        view.bar.style.width = mainValue + '%';
        view.bar.style.left = successValue + '%';
    }
    view.inner.classList.toggle('is-square-cap', opts.strokeLinecap === 'butt' || opts.strokeLinecap === 'square');
}
function findFirstTag(node, tagName) {
    const target = String(tagName || '').toUpperCase();
    const children = node && node.childNodes ? node.childNodes : [];
    for (const child of children) {
        if (String(child.tagName || '').toUpperCase() === target) return child;
        const nested = findFirstTag(child, target);
        if (nested) return nested;
    }
    return null;
}
function ensureGradient(instance, record, view) {
    const color = instance.options.strokeColor;
    const query = typeof view.svg.querySelector === 'function' ? selector => view.svg.querySelector(selector) : selector => selector === 'defs' ? findFirstTag(view.svg, 'defs') : null;
    if (!color || typeof color !== 'object' || Array.isArray(color)) {
        const oldDefs = query('defs');
        if (oldDefs) oldDefs.remove();
        view.gradient = null;
        return '';
    }
    let defs = query('defs');
    if (defs) defs.remove();
    defs = record.doc.createElementNS(SVG_NS, 'defs');
    const gradient = record.doc.createElementNS(SVG_NS, 'linearGradient');
    const id = IdManager.next('progress-gradient');
    gradient.setAttribute('id', id);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '100%');
    const stops = color.from || color.to
        ? [['0%', color.from || color.to], ['100%', color.to || color.from]]
        : Object.keys(color).filter(key => /%$/.test(key)).sort((a, b) => Number(a.slice(0, -1)) - Number(b.slice(0, -1))).map(key => [key, color[key]]);
    stops.forEach(entry => {
        const stop = record.doc.createElementNS(SVG_NS, 'stop');
        stop.setAttribute('offset', entry[0]);
        stop.setAttribute('stop-color', entry[1]);
        gradient.appendChild(stop);
    });
    defs.appendChild(gradient);
    view.svg.insertBefore(defs, view.svg.firstChild);
    view.gradient = gradient;
    return 'url(#' + id + ')';
}
function updateCircle(instance, record, view) {
    const opts = instance.options;
    applySize(instance, view);
    const radius = 50 - opts.strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;
    const gapDegree = opts.type === 'dashboard' ? opts.gapDegree : 0;
    const available = circumference * ((360 - gapDegree) / 360);
    const successValue = Math.min(opts.success.percent, opts.percent);
    const mainValue = Math.max(0, opts.percent - successValue);
    const rotation = opts.type === 'dashboard' ? circleRotation(opts.gapPlacement) : -90;
    [view.rail, view.success, view.bar].forEach(circle => {
        circle.setAttribute('r', String(radius));
        circle.setAttribute('stroke-width', String(opts.strokeWidth));
        circle.setAttribute('transform', 'rotate(' + rotation + ' 50 50)');
        circle.setAttribute('stroke-linecap', opts.strokeLinecap);
    });
    if (opts.steps) {
        const segment = Math.max(.1, (available / opts.steps.count) - opts.steps.gap);
        const dash = segment + ' ' + Math.max(.1, circumference / opts.steps.count - segment);
        [view.rail, view.success, view.bar].forEach(circle => circle.setAttribute('stroke-dasharray', dash));
        view.rail.setAttribute('stroke-dashoffset', '0');
        view.success.setAttribute('stroke-dashoffset', String(-available * (1 - successValue / 100)));
        view.bar.setAttribute('stroke-dashoffset', String(-available * (1 - mainValue / 100 + successValue / 100)));
    } else {
        view.rail.setAttribute('stroke-dasharray', available + ' ' + circumference);
        view.rail.setAttribute('stroke-dashoffset', '0');
        view.success.setAttribute('stroke-dasharray', (available * (successValue / 100)) + ' ' + circumference);
        view.success.setAttribute('stroke-dashoffset', '0');
        view.bar.setAttribute('stroke-dasharray', (available * (mainValue / 100)) + ' ' + circumference);
        view.bar.setAttribute('stroke-dashoffset', String(-available * (successValue / 100)));
    }
    if (opts.railColor) view.rail.setAttribute('stroke', opts.railColor); else view.rail.removeAttribute('stroke');
    if (opts.success.strokeColor) view.success.setAttribute('stroke', opts.success.strokeColor); else view.success.removeAttribute('stroke');
    const gradient = ensureGradient(instance, record, view);
    if (gradient) view.bar.setAttribute('stroke', gradient);
    else if (Array.isArray(opts.strokeColor) && opts.strokeColor.length) view.bar.setAttribute('stroke', opts.strokeColor[0]);
    else if (typeof opts.strokeColor === 'string' && opts.strokeColor) view.bar.setAttribute('stroke', opts.strokeColor);
    else view.bar.removeAttribute('stroke');
}
function renderProgress(instance) {
    const record = requireState(instance);
    if (instance.destroyed || !record.root) return false;
    const opts = instance.options;
    const status = effectiveStatus(opts);
    const output = formatOutput(instance, record, status);
    applyRoot(instance, record, status);
    const view = ensureProjection(instance, record);
    if (view.type === 'line') updateLine(instance, view, status); else updateCircle(instance, record, view);
    if (opts.showInfo !== false) {
        const infoParent = view.type === 'line' ? record.root : view.holder;
        if (view.info.parentNode !== infoParent) infoParent.appendChild(view.info);
        Renderer.replace(view.info, output, record.doc);
    } else {
        view.info.textContent = '';
        if (view.info.parentNode) view.info.parentNode.removeChild(view.info);
    }
    return instance;
}

function applyFeedback(instance, record) {
    const patch = {};
    if (record.progress !== null) patch.percent = clamp(record.progress, 0, 100);
    if (record.status === 'success') {
        patch.status = 'success';
        if (record.progress === null) patch.percent = 100;
    } else if (record.status === 'error') patch.status = 'exception';
    else if (record.status === 'pending' || record.status === 'progress') patch.status = 'active';
    else patch.status = 'normal';
    instance.updateOptions(patch);
    return instance;
}
function feedbackProjector(instance) {
    return Object.freeze({
        show: record => applyFeedback(instance, record),
        update: (_handle, record) => applyFeedback(instance, record),
        close: () => true
    });
}

export class Progress extends Component {
    static profile = Object.freeze({
        name: 'Progress',
        feedback: Object.freeze({ mode: 'status-progress-projection' }),
        ownership: Object.freeze({ feedback: 'FeedbackController' })
    });
    static options = Object.freeze({
        percent: 0,
        type: 'line',
        status: 'normal',
        showInfo: true,
        strokeLinecap: 'round',
        strokeWidth: 6,
        gapDegree: 75,
        gapPlacement: 'bottom',
        direction: 'horizontal',
        size: 'md',
        color: '',
        success: null,
        steps: null,
        strokeColor: '',
        railColor: ''
    });
    static optionNormalizers = Object.freeze({
        percent: value => clamp(value, 0, 100),
        type: value => enumValue(value, TYPES, 'line', 'type'),
        status: value => enumValue(value, STATUSES, 'normal', 'status'),
        showInfo: value => value !== false,
        strokeLinecap: value => enumValue(value, LINECAPS, 'round', 'strokeLinecap'),
        strokeWidth: value => clamp(value === undefined ? 6 : value, 1, 30),
        gapDegree: value => clamp(value === undefined ? 75 : value, 0, 295),
        gapPlacement: value => enumValue(value, GAPS, 'bottom', 'gapPlacement'),
        direction: value => enumValue(value, DIRECTIONS, 'horizontal', 'direction'),
        size: normalizeSize,
        color: value => value === undefined || value === null || value === '' ? '' : enumValue(value, COLORS, '', 'color'),
        success: normalizeSuccess,
        steps: normalizeSteps,
        strokeColor: normalizeStrokeColor,
        railColor: value => value == null ? '' : String(value),
        format: value => normalizeNullableFunction(value, 'format'),
        onChange: value => normalizeNullableFunction(value, 'onChange'),
        onUpdate: value => normalizeNullableFunction(value, 'onUpdate')
    });
    static immutableOptions = Object.freeze(['container', 'document']);
    static contract = ComponentContracts.get('Progress');

    [componentHooks.render]() {
        const opts = this.options;
        if (!opts.container || opts.container.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] Progress container must be an Element.');
        const current = state.get(this);
        if (current && current.root) return current.root;
        const doc = opts.document || opts.container.ownerDocument || globalThis.document;
        if (!doc || typeof doc.createElement !== 'function' || typeof doc.createElementNS !== 'function') throw new TypeError('[QXFRAME9A7C2] Progress requires a document.');
        const root = doc.createElement('div');
        const record = { doc, root, projection: null, projectionKey: '', updateKind: '' };
        state.set(this, record);
        opts.container.appendChild(root);
        this.own(() => {
            if (root.parentNode) root.parentNode.removeChild(root);
            record.root = null;
            record.projection = null;
            record.projectionKey = '';
        });
        renderProgress(this);
        return root;
    }

    [componentHooks.optionsUpdated](next, previous) {
        const record = state.get(this);
        if (!record || !record.root) return;
        const oldKey = [previous.type, previous.direction, previous.steps ? previous.steps.count : 0].join('|');
        const newKey = [next.type, next.direction, next.steps ? next.steps.count : 0].join('|');
        if (oldKey !== newKey) record.projectionKey = '';
        renderProgress(this);
        if (!record.updateKind && typeof next.onUpdate === 'function') next.onUpdate(this.getState(), { instance: this });
    }

    #patchFromMethod(patch, kind) {
        if (this.destroyed) return false;
        const record = requireState(this);
        record.updateKind = kind;
        try { this.updateOptions(patch); }
        finally { record.updateKind = ''; }
        return this;
    }

    setPercent(percent, config) {
        const result = this.#patchFromMethod({ percent: clamp(percent, 0, 100) }, 'setPercent');
        if (result === false) return false;
        const opts = this.options;
        if (!(config && config.silent) && typeof opts.onChange === 'function') opts.onChange(opts.percent, { reason: config && config.reason || 'api', instance: this });
        return this;
    }
    setSuccessPercent(percent) {
        if (this.destroyed) return false;
        const opts = this.options;
        return this.#patchFromMethod({ success: { percent: clamp(percent, 0, 100), strokeColor: opts.success.strokeColor } }, 'setSuccessPercent');
    }
    setStatus(status) { return this.#patchFromMethod({ status: enumValue(status, STATUSES, 'normal', 'status') }, 'setStatus'); }
    createFeedbackController(options = {}) { return FeedbackController.createForProjector(feedbackProjector(this), Utils.mergeOwn({ ownerId: this.id }, options), 'local'); }
    getState() {
        const opts = this.options;
        return Object.freeze({
            percent: opts.percent,
            successPercent: opts.success.percent,
            status: effectiveStatus(opts),
            requestedStatus: opts.status,
            type: opts.type,
            direction: opts.direction,
            color: opts.color,
            showInfo: opts.showInfo,
            steps: opts.steps ? Object.freeze({ count: opts.steps.count, gap: opts.steps.gap }) : null,
            destroyed: this.destroyed
        });
    }
    getRootElement() { return this.root; }
}

export { TYPES as PROGRESS_TYPES, STATUSES as PROGRESS_STATUSES };
export default Progress;
