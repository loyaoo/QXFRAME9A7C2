import { Utils } from '../utils/utils.js';
import { Component } from '../core/component.js';
import { Trigger } from './trigger.js';
import { Scroll } from './scroll.js';

const popupState = new WeakMap();

export const popupHooks = Object.freeze({
    beforeOpen: Symbol('QXFRAME9A7C2.Popup.beforeOpen'),
    afterOpen: Symbol('QXFRAME9A7C2.Popup.afterOpen'),
    beforeClose: Symbol('QXFRAME9A7C2.Popup.beforeClose'),
    afterClose: Symbol('QXFRAME9A7C2.Popup.afterClose')
});

function requireState(instance) {
    const record = popupState.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid PopupComponent instance.');
    return record;
}

function createPopupFrame(options = {}) {
    const settings = { ...(options || {}) };
    const panel = settings.panel || settings.popup || null;
    if (!panel || panel.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] PopupFrame panel must be an Element.');
    const doc = settings.document || panel.ownerDocument || globalThis.document;
    const scrollDefaults = { ...(settings.scrollDefaults || {}) };
    const scrolls = new Set();
    let destroyed = false;

    function assertOwnedSurface(node, label) {
        if (!node || node.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] PopupFrame ' + label + ' must be an Element.');
        if (node !== panel && !(panel.contains && panel.contains(node))) {
            throw new TypeError('[QXFRAME9A7C2] PopupFrame ' + label + ' must belong to its popup panel.');
        }
        return node;
    }

    function track(surface) {
        if (surface) scrolls.add(surface);
        return surface;
    }

    function attachViewport(config = {}) {
        if (destroyed) throw new Error('[QXFRAME9A7C2] PopupFrame is destroyed.');
        const input = { ...scrollDefaults, ...(config || {}) };
        assertOwnedSurface(input.root, 'scroll root');
        assertOwnedSurface(input.viewport, 'scroll viewport');
        if (input.content != null) assertOwnedSurface(input.content, 'scroll content');
        input.document = input.document || doc;
        return track(Scroll.attachViewport(input));
    }

    function createScroll(config = {}) {
        if (destroyed) throw new Error('[QXFRAME9A7C2] PopupFrame is destroyed.');
        const input = { ...scrollDefaults, ...(config || {}) };
        input.container = input.container || panel;
        assertOwnedSurface(input.container, 'scroll container');
        input.document = input.document || doc;
        return track(Scroll.create(input));
    }

    function createAdapter(defaults = {}) {
        const base = { ...(defaults || {}) };
        return function popupScrollAdapter(config) {
            return attachViewport({ ...base, ...(config || {}) });
        };
    }

    function refresh(reason = 'popup-frame') {
        if (destroyed) return false;
        scrolls.forEach(function (surface) {
            try { if (surface && Utils.isFunction(surface.refresh)) surface.refresh(reason); } catch (_) {}
        });
        return true;
    }

    function destroy() {
        if (destroyed) return false;
        destroyed = true;
        Array.from(scrolls).reverse().forEach(function (surface) {
            try { if (surface && Utils.isFunction(surface.destroy)) surface.destroy(); } catch (_) {}
        });
        scrolls.clear();
        return true;
    }

    return Object.freeze({
        attachViewport,
        createScroll,
        createAdapter,
        refresh,
        getPanelElement: function () { return panel; },
        getScrolls: function () { return Array.from(scrolls); },
        getPrimaryScroll: function () { const list = Array.from(scrolls); return list.length ? list[0] : null; },
        getState: function () { return Object.freeze({ destroyed: destroyed, scrollCount: scrolls.size }); },
        destroy
    });
}

function createPopupRuntime(options = {}) {
    const config = { ...(options || {}) };
    let frame = config.popupFrame || null;
    let ownsFrame = config.ownsPopupFrame === true;
    const scrollDefaults = config.scrollDefaults;
    delete config.popupFrame;
    delete config.ownsPopupFrame;
    delete config.scrollDefaults;
    if (!frame && config.floating) {
        frame = createPopupFrame({ panel: config.floating, document: config.document, scrollDefaults: scrollDefaults });
        ownsFrame = true;
    }
    const trigger = Trigger.create(config);
    return Object.freeze({ trigger, frame, ownsFrame });
}

export const PopupFrame = Object.freeze({ create: createPopupFrame });
export const PopupRuntime = Object.freeze({ create: createPopupRuntime, motion: Trigger.motion });

export class PopupComponent extends Component {
    constructor(options = {}) {
        super(options);
        popupState.set(this, { trigger: null, reference: null, popup: null, frame: null });
    }

    setupPopupFrame(options = {}) {
        const record = requireState(this);
        if (record.frame) return record.frame;
        const panel = options.panel || options.popup || record.popup;
        if (!panel) throw new TypeError('[QXFRAME9A7C2] PopupComponent setupPopupFrame requires a popup panel.');
        if (!record.popup) record.popup = panel;
        const frame = PopupFrame.create({ ...options, panel });
        record.frame = this.own(frame);
        return record.frame;
    }

    setupPopupRuntime(options = {}) {
        const record = requireState(this);
        if (record.trigger) throw new Error('[QXFRAME9A7C2] Popup runtime is already initialized.');
        const config = Utils.mergeOwn(options);
        record.reference = config.reference || null;
        record.popup = config.floating || null;
        if (record.frame && !config.popupFrame) config.popupFrame = record.frame;
        const beforeOpen = config.beforeOpen;
        const beforeClose = config.beforeClose;
        const onOpen = config.onOpen;
        const onClose = config.onClose;
        config.beforeOpen = detail => {
            const hook = this[popupHooks.beforeOpen];
            if (typeof hook === 'function' && hook.call(this, detail) === false) return false;
            return typeof beforeOpen === 'function' ? beforeOpen(detail) : undefined;
        };
        config.beforeClose = detail => {
            const hook = this[popupHooks.beforeClose];
            if (typeof hook === 'function' && hook.call(this, detail) === false) return false;
            return typeof beforeClose === 'function' ? beforeClose(detail) : undefined;
        };
        config.onOpen = detail => {
            if (typeof onOpen === 'function') onOpen(detail);
            const hook = this[popupHooks.afterOpen];
            if (typeof hook === 'function') hook.call(this, detail);
            if (record.frame) record.frame.refresh('popup-open');
        };
        config.onClose = detail => {
            if (typeof onClose === 'function') onClose(detail);
            const hook = this[popupHooks.afterClose];
            if (typeof hook === 'function') hook.call(this, detail);
        };
        const runtime = PopupRuntime.create(config);
        if (!record.frame && runtime.frame) record.frame = runtime.ownsFrame ? this.own(runtime.frame) : runtime.frame;
        return this.adoptPopupRuntime(runtime.trigger, { reference: record.reference, popup: record.popup, popupFrame: record.frame, owned: true });
    }

    adoptPopupRuntime(trigger, options = {}) {
        const record = requireState(this);
        if (record.trigger) throw new Error('[QXFRAME9A7C2] Popup runtime is already initialized.');
        if (!trigger || typeof trigger.open !== 'function' || typeof trigger.close !== 'function' || typeof trigger.getState !== 'function') throw new TypeError('[QXFRAME9A7C2] PopupComponent requires a Trigger-compatible runtime.');
        if (Object.prototype.hasOwnProperty.call(options, 'reference')) record.reference = options.reference;
        if (Object.prototype.hasOwnProperty.call(options, 'popup')) record.popup = options.popup;
        if (Object.prototype.hasOwnProperty.call(options, 'popupFrame')) record.frame = options.popupFrame || null;
        record.trigger = options.owned === true ? this.own(trigger) : trigger;
        return trigger;
    }

    open(reason, originalEvent) {
        if (this.destroyed || this.options.disabled === true) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.open(reason || 'api', originalEvent || null) : false;
    }

    close(reason, originalEvent) {
        if (this.destroyed) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.close(reason || 'api', originalEvent || null) : false;
    }

    toggle(reason, originalEvent) {
        if (this.destroyed || this.options.disabled === true) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.toggle(reason || 'api', originalEvent || null) : false;
    }

    setOpen(value, reason, originalEvent) {
        return value === true ? this.open(reason || 'set-open', originalEvent) : this.close(reason || 'set-open', originalEvent);
    }

    reposition(reason = 'api') {
        if (this.destroyed) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.reposition(reason) : false;
    }

    getRootElement() { return this.root; }
    getTrigger() { return requireState(this).trigger; }
    getInteractionController() { const trigger = this.getTrigger(); return trigger && typeof trigger.getInteractionController === 'function' ? trigger.getInteractionController() : null; }
    getCapabilityController() { const trigger = this.getTrigger(); return trigger && typeof trigger.getCapabilityController === 'function' ? trigger.getCapabilityController() : null; }
    getOverlayController() { const trigger = this.getTrigger(); return trigger && typeof trigger.getOverlayController === 'function' ? trigger.getOverlayController() : null; }
    getMotionController() { const trigger = this.getTrigger(); return trigger && typeof trigger.getMotionController === 'function' ? trigger.getMotionController() : null; }
    getReferenceElement() { return requireState(this).reference; }
    getPopupElement() { return requireState(this).popup; }
    getPopupFrame() { return requireState(this).frame; }
    getPopupScroll() { const frame = this.getPopupFrame(); return frame ? frame.getPrimaryScroll() : null; }
    createPopupScrollAdapter(defaults = {}) {
        const frame = this.getPopupFrame();
        if (!frame) throw new Error('[QXFRAME9A7C2] Popup frame is not initialized.');
        return frame.createAdapter(defaults);
    }
    getPopupRuntimeState() {
        const trigger = requireState(this).trigger;
        return trigger ? trigger.getState() : Object.freeze({ open: false, destroyed: this.destroyed });
    }
}
