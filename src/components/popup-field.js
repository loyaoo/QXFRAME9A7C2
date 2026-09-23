import { Utils } from '../utils/utils.js';
import { FieldComponent } from './field.js';
import { fieldHooks } from '../core/fieldHooks.js';
import { componentHooks } from '../core/componentHooks.js';
import { Trigger } from './trigger.js';
import { DOM } from '../core/dom.js';

const state = new WeakMap();

export const popupFieldHooks = Object.freeze({
    beforeOpen: Symbol('QXFRAME9A7C2.PopupField.beforeOpen'),
    afterOpen: Symbol('QXFRAME9A7C2.PopupField.afterOpen'),
    beforeClose: Symbol('QXFRAME9A7C2.PopupField.beforeClose'),
    afterClose: Symbol('QXFRAME9A7C2.PopupField.afterClose'),
    optionsUpdated: Symbol('QXFRAME9A7C2.PopupField.optionsUpdated')
});

function requireState(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid PopupFieldComponent instance.');
    return record;
}

export function popupOpenContext(detail = {}) {
    const originalEvent = detail && detail.originalEvent || null;
    const eventType = String(originalEvent && originalEvent.type || '');
    const reason = String(detail && detail.reason || '');
    const keyboard = /^key/.test(eventType) || /keyboard/.test(reason);
    const pointer = /^(?:mouse|pointer|click)/.test(eventType) || reason === 'control-click';
    return Object.freeze({
        originalEvent,
        eventType,
        reason,
        keyboard,
        pointer,
        source: detail && detail.source || (keyboard ? 'keyboard' : (pointer ? 'pointer' : 'instance'))
    });
}

export function popupSelectionOpenPlan(detail, options = {}) {
    const context = popupOpenContext(detail);
    const hasSelection = options.hasSelection === true;
    const passiveFirst = options.passiveFirst === true;
    const inputFirst = options.inputFirst !== false;
    const strategy = hasSelection
        ? 'selected'
        : (context.keyboard ? (/up/.test(context.reason) ? 'last' : 'first') : ((inputFirst && context.reason === 'input') || passiveFirst ? 'first' : 'none'));
    return Object.freeze({
        ...context,
        strategy,
        fallback: context.keyboard || (inputFirst && context.reason === 'input') ? 'first' : 'none'
    });
}

export function createPopupFieldTriggerSettings(options = {}, context = {}, overrides = {}) {
    const opts = options || {};
    const ctx = context || {};
    return Utils.assignOwn({
        trigger: opts.trigger,
        keyboardActivation: false,
        openDelay: opts.openDelay,
        closeDelay: opts.closeDelay,
        reference: ctx.reference || null,
        triggerTarget: ctx.triggerTarget || null,
        floating: ctx.floating || null,
        document: ctx.document,
        portalContainer: ctx.portalContainer,
        placement: opts.placement,
        transition: Trigger.motion.popupPlacement,
        strategy: opts.strategy || 'absolute',
        middleware: opts.middleware,
        flipOnOverflow: opts.flipOnOverflow !== false,
        matchReferenceWidth: opts.matchReferenceWidth === true,
        autoUpdate: opts.autoUpdate !== false,
        closeOnOutsidePress: true,
        closeOnFocusOutside: true,
        closeOnTabExit: true,
        closeOnEscape: true,
        destroyOnClose: opts.destroyOnClose !== false
    }, overrides || {});
}

export class PopupFieldComponent extends FieldComponent {
    constructor(options = {}) {
        super(options);
        state.set(this, { trigger: null, reference: null, popup: null, tabExitTarget: null });
    }

    setupPopupFieldRuntime(options = {}) {
        const record = requireState(this);
        if (record.trigger) throw new Error('[QXFRAME9A7C2] PopupField runtime is already initialized.');
        const config = Utils.mergeOwn( options);
        record.reference = config.reference || null;
        record.popup = config.floating || null;
        record.tabExitTarget = config.tabExitTarget || null;
        const beforeOpen = config.beforeOpen;
        const beforeClose = config.beforeClose;
        const onOpen = config.onOpen;
        const onClose = config.onClose;
        config.beforeOpen = detail => {
            if (!this.canActivate({ preserveFocusWhileLoading: true })) return false;
            const hook = this[popupFieldHooks.beforeOpen];
            if (typeof hook === 'function' && hook.call(this, detail) === false) return false;
            return typeof beforeOpen === 'function' ? beforeOpen(detail) : undefined;
        };
        config.beforeClose = detail => {
            const hook = this[popupFieldHooks.beforeClose];
            if (typeof hook === 'function' && hook.call(this, detail) === false) return false;
            return typeof beforeClose === 'function' ? beforeClose(detail) : undefined;
        };
        config.onOpen = detail => {
            if (typeof onOpen === 'function') onOpen(detail);
            const hook = this[popupFieldHooks.afterOpen];
            if (typeof hook === 'function') hook.call(this, detail);
        };
        config.onClose = detail => {
            if (typeof onClose === 'function') onClose(detail);
            const hook = this[popupFieldHooks.afterClose];
            if (typeof hook === 'function') hook.call(this, detail);
        };
        return this.adoptPopupFieldRuntime(Trigger.create(config), { reference: record.reference, popup: record.popup, tabExitTarget: record.tabExitTarget, owned: true });
    }

    adoptPopupFieldRuntime(trigger, options = {}) {
        const record = requireState(this);
        if (record.trigger) throw new Error('[QXFRAME9A7C2] PopupField runtime is already initialized.');
        if (!trigger || typeof trigger.open !== 'function' || typeof trigger.close !== 'function' || typeof trigger.getState !== 'function') throw new TypeError('[QXFRAME9A7C2] PopupFieldComponent requires a Trigger-compatible runtime.');
        if (Object.prototype.hasOwnProperty.call(options, 'reference')) record.reference = options.reference;
        if (Object.prototype.hasOwnProperty.call(options, 'popup')) record.popup = options.popup;
        if (Object.prototype.hasOwnProperty.call(options, 'tabExitTarget')) record.tabExitTarget = options.tabExitTarget;
        record.trigger = options.owned === true ? this.own(trigger) : trigger;
        return trigger;
    }

    open(reason, originalEvent) {
        if (this.destroyed || !this.canActivate({ preserveFocusWhileLoading: true })) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.open(reason || 'api', originalEvent || null) : false;
    }
    close(reason, originalEvent) {
        if (this.destroyed) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.close(reason || 'api', originalEvent || null) : false;
    }
    toggle(reason, originalEvent) {
        if (this.destroyed || !this.canActivate({ preserveFocusWhileLoading: true })) return false;
        const trigger = requireState(this).trigger;
        return trigger ? trigger.toggle(reason || 'api', originalEvent || null) : false;
    }
    setOpen(value, reason, originalEvent) { return value === true ? this.open(reason || 'set-open', originalEvent) : this.close(reason || 'set-open', originalEvent); }
    reposition(reason = 'api') { const trigger = requireState(this).trigger; return !this.destroyed && trigger ? trigger.reposition(reason) : false; }

    focusReference(options) {
        const reference = requireState(this).reference || this.root;
        return DOM.focusElement(reference, options || { preventScroll: true });
    }
    focusPopup(options) {
        const popup = requireState(this).popup;
        if (!popup) return false;
        const target = popup.querySelector && popup.querySelector('[tabindex="0"],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])');
        return DOM.focusElement(target || popup, options || { preventScroll: true });
    }

    getTrigger() { return requireState(this).trigger; }
    getReferenceElement() { return requireState(this).reference; }
    getPopupElement() { return requireState(this).popup; }
    getTabExitTarget() { return requireState(this).tabExitTarget; }
    getPopupState() { const trigger = requireState(this).trigger; return trigger ? trigger.getState() : Object.freeze({ open: false, destroyed: this.destroyed }); }

    [componentHooks.beforeDestroy]() {
        const record = requireState(this);
        if (record.trigger && typeof record.trigger.destroy === 'function') record.trigger.destroy('component-destroy');
        record.trigger = null;
        record.reference = null;
        record.popup = null;
        record.tabExitTarget = null;
    }

    [fieldHooks.fieldOptionsUpdated](next, previous, patch) {
        const record = requireState(this);
        if (record.trigger) {
            const triggerPatch = {};
            for (const key of ['disabled','trigger','openDelay','closeDelay','placement','strategy','middleware','matchReferenceWidth','flipOnOverflow','autoUpdate','closeOnEscape','closeOnOutsidePress','closeOnTabExit','destroyOnClose','zIndex']) {
                if (Object.prototype.hasOwnProperty.call(patch, key)) triggerPatch[key] = next[key];
            }
            if (Object.keys(triggerPatch).length) record.trigger.updateOptions(triggerPatch);
        }
        const hook = this[popupFieldHooks.optionsUpdated];
        if (typeof hook === 'function') hook.call(this, next, previous, patch);
    }
}
