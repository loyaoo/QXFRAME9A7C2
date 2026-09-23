import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { ComponentContracts } from '../core/componentContracts.js';
import { Scheduler } from '../core/scheduler.js';
import { DOMProjection } from '../core/domProjection.js';
import { OverlayRuntime } from '../core/overlayRuntime.js';
import { PopupSurface } from '../core/popupSurface.js';
import { Transition } from '../core/transition.js';
import { MotionPresets } from '../core/motionPresets.js';
import { Renderer } from '../core/renderer.js';
import { Utils } from '../utils/utils.js';
import { Progress } from './progress.js';

const SIZES = Object.freeze(['xs', 'sm', 'md', 'lg', 'xl']);
const state = new WeakMap();
const own = Utils.own;

function bool(value, fallback, label) { return Utils.booleanValue(value, fallback, 'Loading ' + label); }
function finiteNumber(value, fallback, label) { return Utils.finiteAtLeast(value, fallback, undefined, 'Loading ' + label); }
function normalizeDelay(value, fallback = 0) {
    const number = finiteNumber(value, fallback, 'delay');
    if (number < 0) throw new TypeError('[QXFRAME9A7C2] Loading delay must be a non-negative finite number.');
    return number;
}
function normalizeProgress(value) {
    if (value === undefined || value === null || value === false) return null;
    const number = finiteNumber(value, 0, 'progress');
    return Math.min(100, Math.max(0, number));
}
function normalizeSize(value, fallback = 'md') { return Utils.normalizeEnum(value === undefined || value === null || value === '' ? fallback : value, SIZES, undefined, 'Loading size'); }
function styleObject(value, label) {
    if (value === undefined || value === null) return null;
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('[QXFRAME9A7C2] Loading ' + label + ' must be an object.');
    return Utils.mergeOwn( value);
}
function applyStyle(element, style) {
    if (!element || !style) return;
    Object.keys(style).forEach(key => { if (Utils.safeOwnKey(key)) element.style[key] = style[key] == null ? '' : String(style[key]); });
}
function clearStyle(element, style) {
    if (!element || !style) return;
    Object.keys(style).forEach(key => { if (Utils.safeOwnKey(key)) element.style[key] = ''; });
}
function normalizeBlur(value) {
    if (value === undefined || value === null || value === false || value === 0 || value === '') return '';
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || value < 0) throw new TypeError('[QXFRAME9A7C2] Loading maskBlur must be a non-negative number or CSS length.');
        return value + 'px';
    }
    if (typeof value !== 'string') throw new TypeError('[QXFRAME9A7C2] Loading maskBlur must be a non-negative number or CSS length.');
    return value;
}
function isElement(value) { return !!(value && value.nodeType === 1 && value.style); }
function liveRenderable(value) { return value; }
function recordFor(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid Loading instance.');
    return record;
}
function contextualOptions(options) {
    const input = options === undefined ? {} : options;
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new TypeError('[QXFRAME9A7C2] Loading options must be an object.');
    const fallbackDoc = globalThis.document;
    const target = own(input, 'target') ? input.target : fallbackDoc && fallbackDoc.body;
    if (!isElement(target)) throw new TypeError('[QXFRAME9A7C2] Loading target must be an Element.');
    const doc = target.ownerDocument || fallbackDoc;
    if (!doc || !doc.body || !doc.documentElement) throw new Error('[QXFRAME9A7C2] Loading requires document.body.');
    const isGlobal = target === doc.body || target === doc.documentElement;
    const fullscreen = input.fullscreen === undefined ? isGlobal : bool(input.fullscreen, isGlobal, 'fullscreen');
    if (fullscreen !== isGlobal) {
        throw new Error('[QXFRAME9A7C2] Loading fullscreen must match target scope; omit target or use document.body/documentElement for fullscreen, and use a non-global target for container loading.');
    }
    return Utils.mergeOwn( input, { target, fullscreen });
}

export class Loading extends Component {
    static options = Object.freeze({
        text: '加载中...', indicator: null, size: 'md', progress: null, delay: 0,
        showMask: true, blocking: true, className: '', maskColor: '', maskBlur: '', open: true
    });
    static optionNormalizers = Object.freeze({
        size: value => normalizeSize(value, 'md'),
        progress: normalizeProgress,
        delay: value => normalizeDelay(value, 0),
        showMask: value => bool(value, true, 'showMask'),
        lockScroll: value => value === undefined ? undefined : bool(value, true, 'lockScroll'),
        blocking: value => bool(value, true, 'blocking'),
        className: value => value == null ? '' : String(value),
        style: value => styleObject(value, 'style'),
        boxStyle: value => styleObject(value, 'boxStyle'),
        maskColor: value => value == null ? '' : String(value),
        maskBlur: normalizeBlur,
        open: value => bool(value, true, 'open'),
        fullscreen: value => bool(value, false, 'fullscreen')
    });
    static contract = ComponentContracts.get('Loading');

    constructor(options = {}) { super(contextualOptions(options)); }

    [componentHooks.beforeOptionsUpdate](patch, current) {
        if (own(patch, 'target') && patch.target !== current.target) {
            throw new Error('[QXFRAME9A7C2] Loading target is immutable; destroy and recreate to change it.');
        }
        if (own(patch, 'fullscreen') && bool(patch.fullscreen, current.fullscreen, 'fullscreen') !== current.fullscreen) {
            throw new Error('[QXFRAME9A7C2] Loading fullscreen is immutable with target scope; destroy and recreate to change it.');
        }
    }

    [componentHooks.render]() {
        const current = state.get(this);
        if (current && current.root) return current.root;
        const instance = this;
        let opts = this.options;
        const target = opts.target;
        const doc = target.ownerDocument || globalThis.document;
        const view = doc.defaultView || globalThis;
        const isGlobal = target === doc.body || target === doc.documentElement;
        const fullscreen = opts.fullscreen;
        const portalContainer = isGlobal ? doc.body : target;
        const scrollLockTarget = isGlobal ? doc.documentElement : target;

        const root = doc.createElement('div');
        const mask = doc.createElement('div');
        const box = doc.createElement('div');
        const indicatorHost = doc.createElement('span');
        const spinner = doc.createElement('span');
        const content = doc.createElement('span');
        const text = doc.createElement('span');
        const progressHost = doc.createElement('span');
        root.className = 'qxframe9a7c2-loading-root';
        mask.className = 'qxframe9a7c2-loading-mask';
        box.className = 'qxframe9a7c2-loading-box';
        indicatorHost.className = 'qxframe9a7c2-loading-indicator';
        spinner.className = 'qxframe9a7c2-loading-spinner';
        content.className = 'qxframe9a7c2-loading-content';
        text.className = 'qxframe9a7c2-loading-text';
        progressHost.className = 'qxframe9a7c2-loading-progress';
        indicatorHost.appendChild(spinner);
        root.appendChild(mask);
        root.appendChild(box);

        const record = {
            root, mask, box, indicatorHost, spinner, content, text, progressHost,
            target, doc, view, isGlobal, fullscreen, portalContainer, scrollLockTarget,
            overlay: null, surface: null, presence: null, progress: null, delayScheduler: null,
            opened: false, pendingCloseReason: null, appliedMaskStyle: null, appliedBoxStyle: null,
            targetPositionProjection: null, methodPatch: null, setOptions: next => { opts = next; }
        };
        state.set(this, record);

        const isOpen = () => record.opened;
        const effectiveLockScroll = () => opts.lockScroll === undefined ? opts.showMask : opts.lockScroll;
        const payload = reason => Object.freeze({ instance, element: root, mask, target, reason: reason || 'api', open: isOpen() });
        const prepareTarget = () => {
            if (isGlobal || record.targetPositionProjection) return;
            const computed = typeof view.getComputedStyle === 'function' ? view.getComputedStyle(target) : null;
            if (!computed || computed.position === 'static') {
                record.targetPositionProjection = DOMProjection.create();
                record.targetPositionProjection.setStyle(target, 'position', 'relative');
            }
        };
        const releaseTarget = () => {
            if (!record.targetPositionProjection) return;
            record.targetPositionProjection.destroy();
            record.targetPositionProjection = null;
        };
        const getOptionsSnapshot = () => ({
            target, fullscreen, text: opts.text, indicator: opts.indicator, size: opts.size,
            progress: opts.progress, delay: opts.delay, showMask: opts.showMask,
            lockScroll: effectiveLockScroll(), blocking: opts.blocking, className: opts.className,
            maskColor: opts.maskColor, maskBlur: opts.maskBlur
        });
        const syncContentHost = () => {
            const present = text.parentNode === content || progressHost.parentNode === content;
            if (present) { if (content.parentNode !== box) box.appendChild(content); }
            else if (content.parentNode) content.parentNode.removeChild(content);
        };
        const renderText = () => {
            const value = typeof opts.text === 'function' ? opts.text({ instance, options: Object.freeze(getOptionsSnapshot()) }) : opts.text;
            const present = value !== null && value !== undefined && value !== '';
            Renderer.replace(text, liveRenderable(present ? value : ''), doc);
            if (present) content.insertBefore(text, progressHost.parentNode === content ? progressHost : null);
            else if (text.parentNode) text.parentNode.removeChild(text);
            syncContentHost();
        };
        const renderIndicator = () => {
            const value = typeof opts.indicator === 'function' ? opts.indicator({ instance, options: Object.freeze(getOptionsSnapshot()) }) : opts.indicator;
            if (value === undefined || value === null) {
                Renderer.replace(indicatorHost, spinner, doc);
                if (indicatorHost.parentNode !== box) box.insertBefore(indicatorHost, content.parentNode === box ? content : null);
                return;
            }
            if (value === false || value === '') {
                Renderer.replace(indicatorHost, '', doc);
                if (indicatorHost.parentNode) indicatorHost.parentNode.removeChild(indicatorHost);
                return;
            }
            Renderer.replace(indicatorHost, liveRenderable(value), doc);
            if (indicatorHost.parentNode !== box) box.insertBefore(indicatorHost, content.parentNode === box ? content : null);
        };
        const renderProgress = () => {
            if (opts.progress === null) {
                if (record.progress) { record.progress.destroy(); record.progress = null; }
                if (progressHost.parentNode) progressHost.parentNode.removeChild(progressHost);
                syncContentHost();
                return;
            }
            if (progressHost.parentNode !== content) content.appendChild(progressHost);
            syncContentHost();
            if (!record.progress) {
                record.progress = Progress.create({ container: progressHost, document: doc, percent: opts.progress, type: 'line', size: opts.size, showInfo: true });
            } else record.progress.updateOptions({ percent: opts.progress, size: opts.size, showInfo: true });
        };
        const applyVisualOptions = () => {
            clearStyle(mask, record.appliedMaskStyle);
            clearStyle(box, record.appliedBoxStyle);
            record.appliedMaskStyle = opts.style ? Utils.mergeOwn( opts.style) : null;
            record.appliedBoxStyle = opts.boxStyle ? Utils.mergeOwn( opts.boxStyle) : null;
            root.className = ('qxframe9a7c2-loading-root ' + (isGlobal ? 'is-global' : 'is-local') + ' is-' + opts.size + (opts.blocking ? '' : ' is-nonblocking') + (opts.className ? ' ' + opts.className : '')).trim();
            mask.className = 'qxframe9a7c2-loading-mask' + (opts.showMask ? '' : ' is-maskless');
            mask.style.background = opts.maskColor || '';
            mask.style.backdropFilter = opts.maskBlur ? 'blur(' + opts.maskBlur + ')' : '';
            applyStyle(mask, record.appliedMaskStyle);
            applyStyle(box, record.appliedBoxStyle);
            renderIndicator();
            renderText();
            renderProgress();
        };
        const syncOverlayOptions = () => record.overlay.updateOptions({ lockScroll: effectiveLockScroll(), scrollLockTarget, compensateScrollbar: isGlobal });
        const setVisibleState = visible => root.classList.toggle('is-present', visible === true);

        record.surface = PopupSurface.create({ element: root, setVisible: setVisibleState });
        record.surface.hide({ reason: 'initial' });
        record.overlay = OverlayRuntime.create({
            floating: root, document: doc, portalContainer, position: false,
            closeOnOutsidePress: false, closeOnEscape: false, trapFocus: false,
            focusOnActivate: false, restoreFocusOnDeactivate: false,
            lockScroll: effectiveLockScroll(), scrollLockTarget, compensateScrollbar: isGlobal,
            manageLayer: isGlobal, layerKind: 'blocking', componentType: 'Loading', destroyOnDeactivate: true
        });
        const finalizeClose = context => {
            if (record.opened || this.destroyed) return false;
            const reason = record.pendingCloseReason || (context && context.reason) || 'close';
            record.pendingCloseReason = null;
            record.surface.hide({ reason });
            record.overlay.deactivate({ reason });
            releaseTarget();
            return true;
        };
        record.presence = Transition.create({ element: root, transition: MotionPresets.fade, visible: false, appear: true, onAfterLeave: finalizeClose });

        const commitOpen = reasonInput => {
            if (this.destroyed || isOpen()) return this;
            const reason = reasonInput || 'api';
            record.opened = true;
            record.pendingCloseReason = null;
            prepareTarget();
            applyVisualOptions();
            syncOverlayOptions();
            record.overlay.mount();
            const overlayState = record.overlay.getState ? record.overlay.getState() : null;
            if (!(overlayState && overlayState.active) && !record.overlay.activate({ reason })) {
                record.opened = false;
                record.surface.hide({ reason });
                releaseTarget();
                return this;
            }
            record.surface.show({ reason });
            void root.offsetWidth;
            record.presence.setVisible(true, { reason });
            if (typeof opts.onOpen === 'function') opts.onOpen(payload(reason));
            return this;
        };
        record.delayScheduler = Scheduler.createDelayScheduler((_timestamp, reason) => commitOpen(reason || 'delay'));

        record.applyVisualOptions = applyVisualOptions;
        record.syncOverlayOptions = syncOverlayOptions;
        record.releaseTarget = releaseTarget;
        record.commitOpen = commitOpen;

        this.own(record.surface);
        this.own(record.overlay);
        this.own(record.presence);
        this.own(record.delayScheduler);
        this.own(() => { if (record.progress) { record.progress.destroy(); record.progress = null; } });
        this.own(releaseTarget);

        applyVisualOptions();
        if (opts.open) this.open('init');
        return root;
    }

    [componentHooks.optionsUpdated](next, previous, patch) {
        const record = state.get(this);
        if (!record || !record.root) return;
        record.setOptions(next);
        const methodPatch = record.methodPatch;
        record.methodPatch = null;
        if (methodPatch === 'text') {
            const value = typeof next.text === 'function' ? next.text({ instance: this, options: Object.freeze({ target: record.target, fullscreen: record.fullscreen, text: next.text, indicator: next.indicator, size: next.size, progress: next.progress, delay: next.delay, showMask: next.showMask, lockScroll: next.lockScroll === undefined ? next.showMask : next.lockScroll, blocking: next.blocking, className: next.className, maskColor: next.maskColor, maskBlur: next.maskBlur }) }) : next.text;
            const present = value !== null && value !== undefined && value !== '';
            Renderer.replace(record.text, liveRenderable(present ? value : ''), record.doc);
            if (present) record.content.insertBefore(record.text, record.progressHost.parentNode === record.content ? record.progressHost : null);
            else if (record.text.parentNode) record.text.parentNode.removeChild(record.text);
            const contentPresent = record.text.parentNode === record.content || record.progressHost.parentNode === record.content;
            if (contentPresent) { if (record.content.parentNode !== record.box) record.box.appendChild(record.content); }
            else if (record.content.parentNode) record.content.parentNode.removeChild(record.content);
            return;
        }
        if (methodPatch === 'progress') {
            if (next.progress === null) {
                if (record.progress) { record.progress.destroy(); record.progress = null; }
                if (record.progressHost.parentNode) record.progressHost.parentNode.removeChild(record.progressHost);
            } else {
                if (record.progressHost.parentNode !== record.content) record.content.appendChild(record.progressHost);
                if (!record.progress) record.progress = Progress.create({ container: record.progressHost, document: record.doc, percent: next.progress, type: 'line', size: next.size, showInfo: true });
                else record.progress.updateOptions({ percent: next.progress, size: next.size, showInfo: true });
            }
            const contentPresent = record.text.parentNode === record.content || record.progressHost.parentNode === record.content;
            if (contentPresent) { if (record.content.parentNode !== record.box) record.box.appendChild(record.content); }
            else if (record.content.parentNode) record.content.parentNode.removeChild(record.content);
            return;
        }
        const wasPending = record.delayScheduler.pending;
        record.applyVisualOptions();
        record.syncOverlayOptions();
        if (own(patch, 'open')) {
            if (wasPending) record.delayScheduler.cancel();
            next.open ? this.open('update-options') : this.close('update-options');
        } else if (own(patch, 'delay') && wasPending) {
            record.delayScheduler.cancel();
            this.open('delay-update');
        }
    }

    [componentHooks.beforeDestroy]() {
        const record = state.get(this);
        if (!record) return;
        if (record.delayScheduler && record.delayScheduler.pending) record.delayScheduler.cancel();
        if (record.opened) this.#closeInternal('destroy', true);
    }

    open(reason = 'api') {
        const record = recordFor(this);
        if (this.destroyed || record.opened || record.delayScheduler.pending) return this;
        if (this.options.delay > 0) { record.delayScheduler.request(this.options.delay, reason); return this; }
        return record.commitOpen(reason);
    }
    #closeInternal(reason = 'api', forceDestroy = false) {
        const record = recordFor(this);
        if (this.destroyed) return this;
        if (record.delayScheduler.pending) record.delayScheduler.cancel();
        if (!record.opened) return this;
        record.opened = false;
        record.pendingCloseReason = reason;
        const opts = this.options;
        if (forceDestroy !== true && typeof opts.onClose === 'function') {
            opts.onClose(Object.freeze({ instance: this, element: record.root, mask: record.mask, target: record.target, reason, open: false }));
        }
        if (this.destroyed || record.opened) return this;
        record.presence.setVisible(false, { reason, immediate: forceDestroy === true });
        return this;
    }
    close(reason = 'api') { return this.#closeInternal(reason, false); }
    setText(value) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot update a destroyed Loading.');
        const record = recordFor(this); record.methodPatch = 'text';
        try { return this.updateOptions({ text: value }); } finally { record.methodPatch = null; }
    }
    setProgress(value) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot update a destroyed Loading.');
        const record = recordFor(this); record.methodPatch = 'progress';
        try { return this.updateOptions({ progress: value }); } finally { record.methodPatch = null; }
    }
    setOpen(value, reason) { return bool(value, false, 'open') ? this.open(reason || 'set-open') : this.close(reason || 'set-open'); }
    setVisible(value, reason) { return bool(value, false, 'visible') ? this.open(reason || 'set-visible') : this.close(reason || 'set-visible'); }
    setMask(value) { return this.updateOptions({ showMask: bool(value, false, 'showMask') }); }
    getState() {
        const record = recordFor(this);
        const overlayState = record.overlay.getState();
        const opts = this.options;
        return Object.freeze({
            open: record.opened,
            present: record.presence ? record.presence.getState().present : false,
            pending: record.delayScheduler.pending,
            mounted: overlayState.mounted,
            overlayActive: overlayState.active,
            destroyed: this.destroyed,
            global: record.isGlobal,
            fullscreen: record.fullscreen,
            size: opts.size,
            progress: opts.progress,
            delay: opts.delay,
            showMask: opts.showMask,
            lockScroll: opts.lockScroll === undefined ? opts.showMask : opts.lockScroll,
            blocking: opts.blocking
        });
    }
    getElement() { return this.root; }
    getMaskElement() { const record = state.get(this); return record ? record.mask : null; }
    getBoxElement() { const record = state.get(this); return record ? record.box : null; }
    getIndicatorElement() { const record = state.get(this); return record ? record.indicatorHost : null; }
    getTextElement() { const record = state.get(this); return record ? record.text : null; }
    getProgress() { const record = state.get(this); return record ? record.progress : null; }
    getDelayScheduler() { const record = state.get(this); return record ? record.delayScheduler : null; }
    getOverlayRuntime() { const record = state.get(this); return record ? record.overlay : null; }
    getTarget() { const record = state.get(this); return record ? record.target : this.options.target; }
}

export const LOADING_SIZES = SIZES;
