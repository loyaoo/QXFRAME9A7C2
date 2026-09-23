import { Component } from '../core/component.js';
import { componentHooks } from '../core/componentHooks.js';
import { fieldHooks } from '../core/fieldHooks.js';
import { FormBridge } from '../core/formBridge.js';
import { InteractionPolicy } from '../core/interactionPolicy.js';
import { ValueEquality } from '../utils/valueEquality.js';

const fieldState = new WeakMap();
const own = (value, key) => Object.prototype.hasOwnProperty.call(Object(value), key);
const cloneValue = value => Array.isArray(value) ? value.slice() : value;

function currentValue(options) {
    if (own(options, 'value')) return cloneValue(options.value);
    if (own(options, 'defaultValue')) return cloneValue(options.defaultValue);
    return undefined;
}

export class FieldComponent extends Component {
    constructor(options = {}) {
        super(options);
        fieldState.set(this, { value: currentValue(this.options), bridge: null, focusTarget: null });
    }

    get value() { return cloneValue(fieldState.get(this).value); }
    get disabled() { return this.options.disabled === true; }
    get readOnly() { return this.options.readOnly === true; }
    get busy() { return this.options.busy === true || this.options.loading === true; }

    interactionPolicy(capabilities = {}) {
        return InteractionPolicy.resolve(InteractionPolicy.stateFromOptions(this.options), capabilities);
    }

    canMutate(capabilities = {}) { return !InteractionPolicy.mutationLocked(this.options, capabilities); }
    canActivate(capabilities = {}) { return !InteractionPolicy.activationLocked(this.options, capabilities); }

    focus(options) {
        if (this.destroyed || !this.interactionPolicy({ preserveFocusWhileLoading: true }).focusable) return false;
        const state = fieldState.get(this);
        const hook = this[fieldHooks.focusElement];
        const target = typeof hook === 'function' ? hook.call(this) : (state.focusTarget || this.root);
        if (!target || typeof target.focus !== 'function') return false;
        target.focus(options);
        return true;
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

    bindFormBridge(options = {}) {
        const state = fieldState.get(this);
        if (state.bridge) state.bridge.destroy();
        const bridge = FormBridge.create({
            ...options,
            value: own(options, 'value') ? options.value : state.value,
            disabled: own(options, 'disabled') ? options.disabled : this.disabled,
            readOnly: own(options, 'readOnly') ? options.readOnly : this.readOnly,
            required: own(options, 'required') ? options.required : this.options.required === true
        });
        state.bridge = this.own(bridge);
        return bridge;
    }

    getFormBridge() { return fieldState.get(this).bridge; }

    setFieldValue(value, detail = {}) {
        if (this.destroyed) return false;
        if (detail.force !== true && !this.canMutate(detail.capabilities || {})) return false;
        const state = fieldState.get(this);
        const previous = cloneValue(state.value);
        const next = cloneValue(value);
        if (ValueEquality.deep(previous, next) && detail.forceEvent !== true) return false;
        state.value = next;
        if (state.bridge) state.bridge.setValue(next, { silent: detail.silent === true, forceEvent: detail.forceEvent === true });
        const hook = this[fieldHooks.valueChanged];
        if (typeof hook === 'function') hook.call(this, cloneValue(next), cloneValue(previous), detail);
        if (detail.silent !== true) this.emit('change', { instance: this, value: cloneValue(next), previous: cloneValue(previous), detail });
        return true;
    }

    [componentHooks.optionsUpdated](next, previous, patch) {
        const state = fieldState.get(this);
        if (own(patch, 'value')) state.value = cloneValue(next.value);
        if (state.bridge) {
            const bridgePatch = {};
            for (const key of ['name', 'disabled', 'readOnly', 'required', 'serializeValue']) if (own(patch, key)) bridgePatch[key] = next[key];
            if (Object.keys(bridgePatch).length) state.bridge.updateOptions(bridgePatch);
            if (own(patch, 'value')) state.bridge.setValue(state.value, { silent: true });
        }
        const hook = this[fieldHooks.fieldOptionsUpdated];
        if (typeof hook === 'function') hook.call(this, next, previous, patch);
    }
}

export { fieldHooks };
