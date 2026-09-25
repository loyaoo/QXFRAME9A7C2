import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { fieldHooks } from '../core/fieldHooks.js';
import { FormBridge } from '../core/formBridge.js';
import { FormController } from '../core/formController.js';
import { FeedbackController } from '../core/feedbackController.js';
import { DOM } from '../core/dom.js';
import { CapabilityController } from '../core/capabilityController.js';
import { FocusController } from '../core/focusController.js';
import { InteractionController } from '../core/interactionController.js';
import { ValueController } from '../core/valueController.js';
import { ValueEquality } from '../utils/valueEquality.js';

const fieldState = new WeakMap();
const own = (value, key) => Object.prototype.hasOwnProperty.call(Object(value), key);
const cloneValue = value => Array.isArray(value) ? value.slice() : value;
const SIMPLE_FIELD_OWNERSHIP = Object.freeze({ value:'ValueController', focus:'FocusController', interaction:'InteractionController', capability:'CapabilityController', feedback:'FeedbackController', form:'FormController' });
export function createSimpleFieldProfile(name) {
    return Object.freeze({
        name: String(name || ''),
        value: Object.freeze({ mode:'committed' }),
        focus: Object.freeze({ mode:'field-surface' }),
        interaction: Object.freeze({ mode:'semantic-actions' }),
        capability: Object.freeze({ mode:'field-policy' }),
        feedback: Object.freeze({ mode:'local-status-projection' }),
        form: Object.freeze({ mode:'field-registration' }),
        ownership: SIMPLE_FIELD_OWNERSHIP
    });
}

const readCommittedValue = record => {
    if (!record || !record.valueController) return undefined;
    const value = record.valueController.value;
    return cloneValue(typeof record.valueProjector === 'function' ? record.valueProjector(value) : value);
};

function currentValue(options) {
    if (own(options, 'value')) return cloneValue(options.value);
    if (own(options, 'defaultValue')) return cloneValue(options.defaultValue);
    return undefined;
}

function createFormAdapter(instance, record, config) {
    const adapter = {
        getValue: typeof config.getValue === 'function' ? () => config.getValue(instance) : () => readCommittedValue(record),
        getSerializedValue: typeof config.getSerializedValue === 'function' ? () => config.getSerializedValue(instance) : () => record.bridge ? record.bridge.getSerializedValue() : readCommittedValue(record),
        focus: () => instance.focus()
    };
    if (typeof config.reset === 'function') adapter.reset = context => config.reset(context, instance);
    if (typeof config.validateSync === 'function') adapter.validateSync = (value, context) => config.validateSync(value, context, instance);
    if (typeof config.validateAsync === 'function') adapter.validateAsync = (value, context) => config.validateAsync(value, context, instance);
    if (typeof config.getOwnershipState === 'function') adapter.getOwnershipState = () => config.getOwnershipState(instance);
    if (typeof config.isDirty === 'function') adapter.isDirty = () => config.isDirty(instance) === true;
    if (typeof config.reveal === 'function') adapter.reveal = context => config.reveal(context, instance);
    return Object.freeze(adapter);
}

function releaseFormRegistration(record, meta) {
    const registration = record.formRegistration;
    record.formRegistration = null;
    if (!registration || typeof registration.unregister !== 'function') return false;
    return registration.unregister(meta || { source:'component', reason:'form-unbind' });
}

export class FieldComponent extends Component {
    constructor(options = {}) {
        super(options);
        const valueController = ValueController.create({
            value: currentValue(this.options),
            controlled: this.options.controlled === true,
            copyValue: cloneValue,
            equals: ValueEquality.deep
        });
        const record = { valueController, ownsValueController: true, valueProjector: null, syncExternalValue: true, bridge: null, focusTarget: null, focusController: null, interactionBinding: null, capabilityController: null, formController: null, formRegistration: null, formBindingOptions: null, feedbackController: null, feedbackControl: null };
        fieldState.set(this, record);
        this.own(() => {
            releaseFormRegistration(record, { source:'component', reason:'destroy' });
            if (record.ownsValueController && record.valueController && typeof record.valueController.destroy === 'function') record.valueController.destroy();
            record.valueController = null;
            record.ownsValueController = false;
            record.valueProjector = null;
            if (record.interactionBinding && typeof record.interactionBinding.destroy === 'function') record.interactionBinding.destroy();
            if (record.focusController && typeof record.focusController.destroy === 'function') record.focusController.destroy();
            if (record.capabilityController && typeof record.capabilityController.destroy === 'function') record.capabilityController.destroy();
            record.interactionBinding = null;
            record.focusController = null;
            record.capabilityController = null;
            record.formController = null;
            record.formBindingOptions = null;
            record.feedbackController = null;
            record.feedbackControl = null;
        });
    }

    get value() {
        const record = fieldState.get(this);
        return readCommittedValue(record);
    }
    get disabled() { return this.options.disabled === true; }
    get readOnly() { return this.options.readOnly === true; }
    get busy() { return this.options.busy === true || this.options.loading === true; }

    interactionPolicy(capabilities = {}) {
        return CapabilityController.resolve(CapabilityController.stateFromOptions(this.options), capabilities);
    }

    canMutate(capabilities = {}) { return !CapabilityController.mutationLocked(this.options, capabilities); }
    canActivate(capabilities = {}) { return !CapabilityController.activationLocked(this.options, capabilities); }
    canOpen(capabilities = {}) { return CapabilityController.allows('open', CapabilityController.stateFromOptions(this.options), capabilities); }

    focus(options) {
        if (this.destroyed || !this.interactionPolicy({ preserveFocusWhileLoading: true }).focusable) return false;
        const state = fieldState.get(this);
        const hook = this[fieldHooks.focusElement];
        const target = typeof hook === 'function' ? hook.call(this) : (state.focusTarget || this.root);
        if (!target) return false;
        return arguments.length ? DOM.focusElement(target, options) : DOM.focusElement(target);
    }

    blur() {
        if (this.destroyed) return false;
        const state = fieldState.get(this);
        const hook = this[fieldHooks.focusElement];
        const target = typeof hook === 'function' ? hook.call(this) : (state.focusTarget || this.root);
        if (!target || typeof target.blur !== 'function') return false;
        target.blur();
        return true;
    }

    bindFocusTarget(target) {
        if (target != null && typeof target !== 'object') throw new TypeError('[QXFRAME9A7C2] FieldComponent focus target must be an Element-like object.');
        fieldState.get(this).focusTarget = target || null;
        return this;
    }

    bindCapabilityController(options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind CapabilityController to a destroyed FieldComponent.');
        const record = fieldState.get(this), settings = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
        if (record.capabilityController) record.capabilityController.destroy();
        const controller = CapabilityController.create({
            getState: () => ({ disabled:this.destroyed || this.disabled, readOnly:this.readOnly, loading:this.busy }),
            getCapabilities: typeof settings.getCapabilities === 'function' ? () => settings.getCapabilities(this) || {} : undefined,
            capabilities: settings.capabilities || {}
        });
        record.capabilityController = this.own(controller);
        return controller;
    }

    getCapabilityController() { return fieldState.get(this).capabilityController; }

    bindFocusController(root, options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind FocusController to a destroyed FieldComponent.');
        if (!root || root.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] FieldComponent FocusController root must be an Element.');
        const record = fieldState.get(this), settings = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
        if (record.focusController) record.focusController.destroy();
        const controller = FocusController.create({ ...settings, root, manageTabIndex: settings.manageTabIndex === undefined ? false : settings.manageTabIndex });
        controller.setDisabled(this.disabled);
        record.focusController = this.own(controller);
        return controller;
    }

    getFocusController() { return fieldState.get(this).focusController; }

    bindInteractionController(root, options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind InteractionController to a destroyed FieldComponent.');
        if (!root || root.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] FieldComponent InteractionController root must be an Element.');
        const record = fieldState.get(this), settings = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
        if (record.interactionBinding) record.interactionBinding.destroy();
        const controller = InteractionController.create(settings.controllerOptions || {});
        const scopeId = String(settings.id || (this.id + '-field-interaction'));
        const lease = controller.registerScope({
            id: scopeId, root, document: root.ownerDocument, owner: this,
            profile: settings.profile || null,
            resolveAction: settings.resolveAction,
            operationOf: settings.operationOf,
            capability: settings.capabilityController || record.capabilityController || null,
            onAction: settings.onAction
        });
        const unlisten = settings.listen === false ? (() => {}) : DOM.listen(root, 'keydown', event => controller.dispatch(event, { ownerId:scopeId, source:'keyboard' }));
        let destroyed = false;
        const binding = {
            controller,
            destroy() {
                if (destroyed) return false;
                destroyed = true;
                try { unlisten(); } catch (_) {}
                try { lease.release(); } catch (_) {}
                controller.destroy();
                return true;
            }
        };
        record.interactionBinding = this.own(binding);
        return controller;
    }

    getInteractionController() {
        const binding = fieldState.get(this).interactionBinding;
        return binding ? binding.controller : null;
    }

    bindFormBridge(options = {}) {
        const state = fieldState.get(this);
        if (state.bridge) state.bridge.destroy();
        const bridge = FormBridge.create({
            ...options,
            value: own(options, 'value') ? options.value : readCommittedValue(state),
            disabled: own(options, 'disabled') ? options.disabled : this.disabled,
            readOnly: own(options, 'readOnly') ? options.readOnly : this.readOnly,
            required: own(options, 'required') ? options.required : this.options.required === true
        });
        state.bridge = this.own(bridge);
        return bridge;
    }

    getFormBridge() { return fieldState.get(this).bridge; }

    getValueController() {
        const record = fieldState.get(this);
        return record ? record.valueController : null;
    }

    bindValueController(controller, options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind ValueController to a destroyed FieldComponent.');
        if (!controller || typeof controller.setValue !== 'function' || typeof controller.snapshot !== 'function') throw new TypeError('[QXFRAME9A7C2] FieldComponent value controller must be ValueController-compatible.');
        const record = fieldState.get(this);
        const settings = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
        if (settings.projectValue != null && typeof settings.projectValue !== 'function') throw new TypeError('[QXFRAME9A7C2] FieldComponent value projection must be a function.');
        const previous = record.valueController;
        const previousValue = previous ? readCommittedValue(record) : undefined;
        if (previous !== controller) {
            if (record.ownsValueController && previous && typeof previous.destroy === 'function') previous.destroy();
            record.valueController = controller;
            record.ownsValueController = settings.owned === true;
        }
        record.valueProjector = typeof settings.projectValue === 'function' ? settings.projectValue : null;
        record.syncExternalValue = settings.syncExternal !== false;
        if (settings.syncFromField === true && !ValueEquality.deep(readCommittedValue(record), previousValue)) controller.setValue(previousValue, { silent:true, source:'field', reason:'bind-value-controller' });
        if (record.bridge) record.bridge.setValue(readCommittedValue(record), { silent:true });
        return controller;
    }

    bindFeedbackProjector(projector, options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind FeedbackController to a destroyed FieldComponent.');
        if (!projector || typeof projector.show !== 'function' || typeof projector.update !== 'function' || typeof projector.close !== 'function') throw new TypeError('[QXFRAME9A7C2] FieldComponent feedback projector must expose show/update/close.');
        const record = fieldState.get(this);
        if (record.feedbackController) record.feedbackController.destroy();
        record.feedbackController = null;
        const settings = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
        record.feedbackControl = settings.control || null;
        const controller = FeedbackController.createForProjector(projector, { ownerId: String(settings.ownerId || this.id) }, 'local');
        record.feedbackController = this.own(controller);
        return controller;
    }

    bindFeedbackControl(control, options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind FeedbackController to a destroyed FieldComponent.');
        if (!control || (typeof control.updateOptions !== 'function' && typeof control.setStatus !== 'function')) throw new TypeError('[QXFRAME9A7C2] FieldComponent feedback control must expose updateOptions() or setStatus().');
        const instance = this;
        const settings = options && typeof options === 'object' && !Array.isArray(options) ? options : {};
        const apply = snapshot => {
            const status = String(snapshot && snapshot.status || 'idle');
            const authoredStatus = instance.options.status || 'default';
            const authoredBusy = instance.options.busy === true || instance.options.loading === true;
            const patch = {
                status: status === 'error' ? 'error' : (status === 'warning' ? 'warning' : authoredStatus),
                busy: status === 'pending' || status === 'progress' ? true : authoredBusy
            };
            if (typeof control.updateOptions === 'function') control.updateOptions(patch);
            else if (typeof control.setStatus === 'function') control.setStatus(patch.status);
            return control;
        };
        const projector = Object.freeze({
            show: snapshot => apply(snapshot),
            update: (_handle, snapshot) => apply(snapshot),
            close: () => {
                const patch = { status: instance.options.status || 'default', busy: instance.options.busy === true || instance.options.loading === true };
                if (typeof control.updateOptions === 'function') control.updateOptions(patch);
                else if (typeof control.setStatus === 'function') control.setStatus(patch.status);
                return true;
            }
        });
        return this.bindFeedbackProjector(projector, { ...settings, control });
    }

    getFeedbackController() { return fieldState.get(this).feedbackController; }

    bindFormController(controller, options = {}) {
        if (this.destroyed) throw new Error('[QXFRAME9A7C2] Cannot bind FormController to a destroyed FieldComponent.');
        if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('[QXFRAME9A7C2] FieldComponent form binding options must be an object.');
        const record = fieldState.get(this);
        releaseFormRegistration(record, { source:'component', reason:'form-rebind' });
        record.formController = null;
        const config = { ...options };
        const fieldId = String(config.fieldId || this.id);
        const name = own(config, 'name') ? config.name : (this.options.name || '');
        const registration = FormController.bindField(controller, {
            fieldId,
            name,
            adapter: createFormAdapter(this, record, config),
            metadata: config.metadata || null
        });
        record.formController = controller;
        record.formRegistration = registration;
        record.formBindingOptions = Object.freeze(config);
        return registration;
    }

    unbindFormController(meta = {}) {
        const record = fieldState.get(this);
        const result = releaseFormRegistration(record, { source:meta.source || 'component', reason:meta.reason || 'form-unbind' });
        record.formController = null;
        record.formBindingOptions = null;
        return result;
    }

    getFormController() { return fieldState.get(this).formController; }
    getFormRegistration() { return fieldState.get(this).formRegistration; }
    markFormTouched(value = true, meta = {}) {
        const registration = fieldState.get(this).formRegistration;
        return registration ? registration.markTouched(value, meta) : false;
    }
    validateFormField(meta = {}) {
        const registration = fieldState.get(this).formRegistration;
        return registration ? registration.validate(meta) : Promise.resolve(false);
    }
    acknowledgeFormReset(requestId, meta = {}) {
        const registration = fieldState.get(this).formRegistration;
        return registration ? registration.acknowledgeReset(requestId, meta) : false;
    }

    setFieldValue(value, detail = {}) {
        if (this.destroyed) return false;
        if (detail.force !== true && !this.canMutate(detail.capabilities || {})) return false;
        const state = fieldState.get(this);
        const controller = state.valueController;
        const previous = readCommittedValue(state);
        const next = cloneValue(value);
        const same = ValueEquality.deep(previous, next);
        if (same && detail.forceEvent !== true && detail.sync !== true) return false;
        if (!same && detail.sync !== true) {
            if (detail.source === 'external' || detail.source === 'options') controller.syncExternal(next, { silent:true, source:detail.source, reason:detail.reason || 'field-value' });
            else controller.setValue(next, { silent:true, source:detail.source || 'component', reason:detail.reason || 'field-value' });
        }
        const committed = readCommittedValue(state);
        if (state.bridge) state.bridge.setValue(committed, { silent: detail.silent === true, forceEvent: detail.forceEvent === true });
        if (state.formRegistration && detail.notifyForm !== false) {
            const formMeta = { source:detail.source || 'component', reason:detail.reason || 'field-value' };
            if (own(detail, 'dirty')) formMeta.dirty = detail.dirty === true;
            else if (formMeta.source === 'external' || formMeta.source === 'options' || formMeta.source === 'form') formMeta.dirty = false;
            state.formRegistration.notifyValue(formMeta);
        }
        const hook = this[fieldHooks.valueChanged];
        if (typeof hook === 'function') hook.call(this, cloneValue(committed), cloneValue(previous), detail);
        if (detail.silent !== true) this.emit('change', { instance: this, value: cloneValue(committed), previous: cloneValue(previous), detail });
        return true;
    }

    [componentHooks.optionsUpdated](next, previous, patch) {
        const state = fieldState.get(this);
        if (own(patch, 'value') && state.valueController && state.syncExternalValue !== false) state.valueController.syncExternal(next.value, { silent:true, source:'options', reason:'options' });
        if (state.bridge) {
            const bridgePatch = {};
            for (const key of ['name', 'disabled', 'readOnly', 'required', 'serializeValue']) if (own(patch, key)) bridgePatch[key] = next[key];
            if (Object.keys(bridgePatch).length) state.bridge.updateOptions(bridgePatch);
            if (own(patch, 'value')) state.bridge.setValue(readCommittedValue(state), { silent: true });
        }
        if (own(patch, 'name') && state.formRegistration && state.formController && !(state.formBindingOptions && own(state.formBindingOptions, 'name'))) {
            this.bindFormController(state.formController, state.formBindingOptions || {});
        }
        if (state.focusController && own(patch, 'disabled')) state.focusController.setDisabled(next.disabled === true);
        if (state.feedbackControl && (own(patch, 'status') || own(patch, 'busy') || own(patch, 'loading'))) {
            const feedbackState = state.feedbackController && state.feedbackController.snapshot ? state.feedbackController.snapshot() : null;
            const active = feedbackState && Array.isArray(feedbackState.records) ? feedbackState.records.length > 0 : false;
            if (!active && typeof state.feedbackControl.updateOptions === 'function') {
                state.feedbackControl.updateOptions({ status: next.status || 'default', busy: next.busy === true || next.loading === true });
            }
        }
        const hook = this[fieldHooks.fieldOptionsUpdated];
        if (typeof hook === 'function') hook.call(this, next, previous, patch);
    }
}

export { fieldHooks };
