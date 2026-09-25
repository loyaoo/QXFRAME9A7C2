import { Utils } from '../utils/utils.js';
import { PopupFieldComponent, popupFieldHooks } from './popup-field.js';
import { PickerSession } from '../core/pickerSession.js';
import { DOM } from '../core/dom.js';
import { SelectionController } from '../core/selectionController.js';

const state = new WeakMap();

export const pickerHooks = Object.freeze({
    optionsUpdated: Symbol('QXFRAME9A7C2.Picker.optionsUpdated'),
    clear: Symbol('QXFRAME9A7C2.Picker.clear'),
    now: Symbol('QXFRAME9A7C2.Picker.now')
});

function requireState(instance) {
    const record = state.get(instance);
    if (!record) throw new TypeError('[QXFRAME9A7C2] Invalid PickerComponent instance.');
    return record;
}

export class PickerComponent extends PopupFieldComponent {
    constructor(options = {}) {
        super(options);
        state.set(this, { field: null, controller: null, session: null, selectionController: null });
    }

    setupPickerSelection(options = {}) {
        const record = requireState(this);
        if (record.selectionController) throw new Error('[QXFRAME9A7C2] Picker selection controller is already initialized.');
        const multiple = options.multiple === true;
        const controller = SelectionController.create({
            channels: { selected: { multiple: multiple, values: Array.isArray(options.values) ? options.values : [] } }
        });
        record.selectionController = this.own(controller);
        return controller;
    }

    syncPickerSelection(keys, meta = {}) {
        const controller = requireState(this).selectionController;
        if (!controller) return false;
        const selected = controller.getChannel('selected');
        return selected.set(Array.isArray(keys) ? keys : (keys == null || keys === '' ? [] : [keys]), Utils.assignOwn({ silent:true, source:'picker', reason:'picker-selection-sync' }, meta));
    }

    setupPickerSession(options = {}) {
        const record = requireState(this);
        if (record.session) throw new Error('[QXFRAME9A7C2] Picker session is already initialized.');
        if (!options.controller) throw new TypeError('[QXFRAME9A7C2] PickerComponent requires a draft controller.');
        record.controller = options.controller;
        record.session = PickerSession.create({
            controller: options.controller,
            needConfirm: () => this.options.needConfirm === true,
            rollbackDirtyOnClose: options.rollbackDirtyOnClose,
            beforeCommit: typeof options.beforeCommit === 'function' ? (_controller, detail) => options.beforeCommit(detail) : null,
            canCommit: (controller, detail) => !this.destroyed && (typeof options.canCommit !== 'function' || options.canCommit(controller, detail) !== false),
            onOpenDraft: options.onOpenDraft,
            onCommit: options.onCommit,
            onCancel: options.onCancel,
            onCloseDraft: options.onCloseDraft
        });
        return record.session;
    }

    adoptPickerField(field) {
        const record = requireState(this);
        if (!field || typeof field.getTrigger !== 'function' || typeof field.getPanelElement !== 'function') {
            throw new TypeError('[QXFRAME9A7C2] PickerComponent requires a PickerField-compatible runtime.');
        }
        if (record.field && record.field !== field) throw new Error('[QXFRAME9A7C2] Picker field is already initialized.');
        record.field = field;
        const trigger = field.getTrigger();
        if (trigger && !this.getTrigger()) {
            this.adoptPopupFieldRuntime(trigger, {
                reference: field.getRootElement(),
                popup: field.getPanelElement(),
                tabExitTarget: field.getInputElement ? field.getInputElement() : field.getRootElement(),
                owned: false
            });
        }
        if (field.getInputElement) this.bindFocusTarget(field.getInputElement() || field.getRootElement());
        const control = field.getControl && field.getControl();
        if (control && !this.getFeedbackController()) this.bindFeedbackControl(control);
        return field;
    }

    open(reason, originalEvent) {
        const field = requireState(this).field;
        return !this.destroyed && field ? field.open(reason || 'api', originalEvent || null) : false;
    }

    toggle(reason, originalEvent) {
        const field = requireState(this).field;
        return !this.destroyed && field ? field.toggle(reason || 'api', originalEvent || null) : false;
    }

    pickerOpen(detail) {
        const session = requireState(this).session;
        return session ? session.open(detail || {}) : false;
    }

    pickerClose(detail) {
        const session = requireState(this).session;
        return session ? session.close(detail || {}) : false;
    }

    commit(meta = {}) {
        const record = requireState(this);
        if (!record.session) return false;
        const detail = Utils.assignOwn({ source: 'api', reason: 'confirm' }, meta);
        return record.session.commit(detail);
    }

    cancel(meta = {}) {
        const session = requireState(this).session;
        return session ? session.cancel(Utils.assignOwn({ source: 'api', reason: 'cancel' }, meta)) : false;
    }

    confirmFromKeyboard(event) {
        if (!event || event.key !== 'Enter' || this.options.needConfirm !== true || event.isComposing === true || !this.canMutate()) return false;
        if (event.preventDefault) event.preventDefault();
        const committed = this.commit({ source: 'keyboard', reason: 'enter-confirm', originalEvent: event });
        if (committed !== false) this.close('confirm', event);
        return true;
    }

    clear(meta = {}) {
        if (this.destroyed || !this.canMutate()) return false;
        const hook = this[pickerHooks.clear];
        return typeof hook === 'function' ? hook.call(this, Utils.assignOwn({ source: 'api', reason: 'clear' }, meta)) : false;
    }

    now(meta = {}) {
        if (this.destroyed || !this.canMutate()) return false;
        const hook = this[pickerHooks.now];
        return typeof hook === 'function' ? hook.call(this, Utils.assignOwn({ source: 'api', reason: 'now' }, meta)) : false;
    }

    createConfirmFooter(options = {}) {
        const field = requireState(this).field;
        if (!field) return null;
        const opts = this.options;
        return field.createConfirmFooter({
            footer: Object.prototype.hasOwnProperty.call(options, 'footer') ? options.footer : opts.footer,
            needConfirm: Object.prototype.hasOwnProperty.call(options, 'needConfirm') ? options.needConfirm : opts.needConfirm,
            showCancel: Object.prototype.hasOwnProperty.call(options, 'showCancel') ? options.showCancel : opts.showCancel,
            startContent: Object.prototype.hasOwnProperty.call(options, 'startContent') ? options.startContent : opts.footerStart,
            actionStartContent: options.actionStartContent,
            endContent: Object.prototype.hasOwnProperty.call(options, 'endContent') ? options.endContent : opts.footerEnd,
            cancel: event => {
                this.cancel({ source: DOM.activationSource(event), reason: 'cancel-button', originalEvent: event });
                this.close('cancel', event);
            },
            confirm: event => {
                const committed = this.commit({ source: DOM.activationSource(event), reason: 'confirm-button', originalEvent: event });
                if (committed !== false) this.close('confirm', event);
            },
            cancelLabel: options.cancelLabel || opts.cancelText,
            confirmLabel: options.confirmLabel || opts.confirmText,
            confirmDisabled: Object.prototype.hasOwnProperty.call(options, 'confirmDisabled') ? options.confirmDisabled : opts.confirmDisabled === true
        });
    }

    getPickerField() { return requireState(this).field; }
    getPickerSession() { return requireState(this).session; }
    getSelectionController() { return requireState(this).selectionController; }
    getDraftController() { return requireState(this).controller; }
    getControl() { const field = requireState(this).field; return field ? field.getControl() : null; }
    getFocusController() { const field = requireState(this).field; return field && field.getFocusController ? field.getFocusController() : null; }
    getRootElement() { const field = requireState(this).field; return field ? field.getRootElement() : this.root; }
    getInputElement() { const field = requireState(this).field; return field && field.getInputElement ? field.getInputElement() : null; }
    getPopupElement() { const field = requireState(this).field; return field ? field.getPanelElement() : super.getPopupElement(); }

    [popupFieldHooks.optionsUpdated](next, previous, patch) {
        const hook = this[pickerHooks.optionsUpdated];
        if (typeof hook === 'function') hook.call(this, next, previous, patch);
    }
}
