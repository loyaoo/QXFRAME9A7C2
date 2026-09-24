import { Utils } from '../utils/utils.js';
import { Component } from '../core/component.js';
import { Trigger } from './trigger.js';

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

export class PopupComponent extends Component {
    constructor(options = {}) {
        super(options);
        popupState.set(this, { trigger: null, reference: null, popup: null });
    }

    setupPopupRuntime(options = {}) {
        const record = requireState(this);
        if (record.trigger) throw new Error('[QXFRAME9A7C2] Popup runtime is already initialized.');
        const config = Utils.mergeOwn( options);
        record.reference = config.reference || null;
        record.popup = config.floating || null;
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
        };
        config.onClose = detail => {
            if (typeof onClose === 'function') onClose(detail);
            const hook = this[popupHooks.afterClose];
            if (typeof hook === 'function') hook.call(this, detail);
        };
        const trigger = Trigger.create(config);
        return this.adoptPopupRuntime(trigger, { reference: record.reference, popup: record.popup, owned: true });
    }

    adoptPopupRuntime(trigger, options = {}) {
        const record = requireState(this);
        if (record.trigger) throw new Error('[QXFRAME9A7C2] Popup runtime is already initialized.');
        if (!trigger || typeof trigger.open !== 'function' || typeof trigger.close !== 'function' || typeof trigger.getState !== 'function') throw new TypeError('[QXFRAME9A7C2] PopupComponent requires a Trigger-compatible runtime.');
        if (Object.prototype.hasOwnProperty.call(options, 'reference')) record.reference = options.reference;
        if (Object.prototype.hasOwnProperty.call(options, 'popup')) record.popup = options.popup;
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
    getPopupRuntimeState() {
        const trigger = requireState(this).trigger;
        return trigger ? trigger.getState() : Object.freeze({ open: false, destroyed: this.destroyed });
    }
}
