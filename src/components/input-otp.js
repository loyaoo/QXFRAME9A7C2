import { FieldComponent, fieldHooks } from './field.js';
import { Control } from './control.js';
import { componentHooks } from '../core/componentHooks.js';
import { getContract } from '../core/componentContracts.js';
import { Scheduler } from '../core/scheduler.js';
import { StateController } from '../core/stateController.js';
import { DOM } from '../core/dom.js';
import { Utils } from '../utils/utils.js';

const state = new WeakMap();
const own = Utils.own;

function normalizeMask(value) {
    if (value === false || value === undefined || value === null || value === '') return false;
    if (value === true) return true;
    if (typeof value === 'string') return Array.from(value)[0] || false;
    throw new TypeError('[QXFRAME9A7C2] InputOTP mask must be false, true, or a non-empty string.');
}
function matcher(accept) {
    if (accept instanceof RegExp) return char => { accept.lastIndex = 0; return accept.test(char); };
    if (typeof accept === 'function') return (char, context) => accept(char, context) === true;
    const kind = String(accept || 'digits').toLowerCase();
    if (kind === 'digits') return char => /^\d$/.test(char);
    if (kind === 'alphanumeric') return char => /^[0-9a-z]$/i.test(char);
    if (kind === 'letters') return char => /^[a-z]$/i.test(char);
    throw new TypeError('[QXFRAME9A7C2] InputOTP accept must be "digits", "alphanumeric", "letters", RegExp, or function.');
}

export class InputOTP extends FieldComponent {
    static contract = getContract('InputOTP');
    static immutableOptions = Object.freeze(['target', 'container', 'formField']);

    static create(source, overrides) { return new this(source, overrides).render(); }
    static enhance(input, options) { return this.create(input, options || {}); }

    constructor(source = {}, overrides) {
        const authored = source && source.nodeType === 1 ? (overrides || {}) : { ...(source || {}), ...(overrides || {}) };
        const authoredMinLength = own(authored, 'minLength');
        const authoredMaxLength = own(authored, 'maxLength');
        const fieldInit = Control.resolveFieldOptions(source, overrides);
        const incoming = fieldInit.options;
        if (fieldInit.formField) {
            if (!own(incoming, 'value')) incoming.value = fieldInit.nativeValue;
            if (!own(incoming, 'length') && fieldInit.formField.maxLength > 0) incoming.length = fieldInit.formField.maxLength;
            if (!authoredMinLength) delete incoming.minLength;
            if (!authoredMaxLength) delete incoming.maxLength;
        }
        const opts = { length: 6, accept: 'digits', mask: false, separator: '', ...incoming };
        if (!opts.container && !opts.formField) throw new TypeError('[QXFRAME9A7C2] InputOTP requires target/container or formField.');
        opts.length = Math.max(1, Math.min(24, Math.floor(Number(opts.length) || 6)));
        opts.mask = normalizeMask(opts.mask);
        super(opts);
        state.set(this, {
            fieldInit,
            length: opts.length,
            match: matcher(opts.accept),
            control: null,
            valueState: null,
            autoFocusScheduler: null,
            lastCompleteValue: '',
            rendered: false
        });
    }

    #applyFormatter(value, context) {
        const raw = String(value == null ? '' : value);
        const formatter = this.options.formatter;
        if (typeof formatter !== 'function') return raw;
        const output = formatter(raw, { instance: this, ...(context || {}) });
        if (output && typeof output.then === 'function') throw new TypeError('[QXFRAME9A7C2] InputOTP formatter must be synchronous.');
        return output == null ? '' : String(output);
    }
    #sanitize(value) {
        const record = state.get(this);
        return Array.from(this.#applyFormatter(value, { reason: 'value' }))
            .filter((char, index) => record.match(char, { index, instance: this }))
            .slice(0, record.length).join('');
    }
    #toSegments(value) {
        const record = state.get(this), text = this.#sanitize(value), output = [];
        for (let index = 0; index < record.length; index += 1) output.push(text.charAt(index) || '');
        return output;
    }
    #segmentPlaceholder(index) {
        const placeholder = this.options.placeholder;
        return Array.isArray(placeholder) ? String(placeholder[index] || '') : (placeholder == null ? '' : String(placeholder));
    }
    #segments() {
        const record = state.get(this), list = [];
        for (let index = 0; index < record.length; index += 1) {
            list.push({
                key: 'digit-' + (index + 1), maxLength: 1, placeholder: this.#segmentPlaceholder(index),
                inputMode: this.options.inputMode || (String(this.options.accept || 'digits').toLowerCase() === 'digits' ? 'numeric' : 'text'),
                autocomplete: index === 0 ? (this.options.autocomplete || 'one-time-code') : 'off',
                type: this.options.mask ? 'password' : 'text', mask: false
            });
        }
        return list;
    }
    #canonicalFocusIndex(values) {
        const record = state.get(this), list = Array.isArray(values) ? values : this.#toSegments(values);
        for (let index = 0; index < record.length; index += 1) if (!list[index]) return index;
        return Math.max(0, record.length - 1);
    }
    #syncFocusPolicy() {
        const record = state.get(this), current = record.control.getState();
        const index = this.#canonicalFocusIndex(current.segmentValues);
        record.control.setSegmentFocusIndex(index);
        return index;
    }

    [componentHooks.render]() {
        const record = state.get(this);
        if (record.rendered) return record.control && record.control.getRootElement();
        const initialValue = this.#sanitize(own(this.options, 'value') ? this.options.value : (own(this.options, 'defaultValue') ? this.options.defaultValue : ''));
        const valueState = this.own(StateController.create({ value: initialValue, controlled: own(this.options, 'value'), normalizeValue: value => this.#sanitize(value) }));
        record.valueState = valueState;
        this.bindValueController(valueState);
        const adapter = { toValue: values => values.join(''), toSegments: value => this.#toSegments(value) };
        const formatSegment = (raw, index) => {
            const formatted = this.#applyFormatter(raw, { reason: 'segment', index });
            const chars = Array.from(formatted).filter((char, offset) => record.match(char, { index, offset, instance: this }));
            return chars.length ? chars[chars.length - 1] : '';
        };
        const control = Control.create({
            container: this.options.container, formField: this.options.formField, mode: 'segments', segments: this.#segments(), segmentSeparator: this.options.separator,
            valueAdapter: adapter, value: initialValue, ...(valueState.controlled ? { committedValue: valueState.value } : {}), segmentFocusIndex: this.#canonicalFocusIndex(initialValue), formatSegment,
            disabled: this.disabled, readOnly: this.readOnly, required: this.options.required === true,
            size: this.options.size, status: this.options.status, variant: this.options.variant, focusOutline: this.options.focusOutline, name: this.options.name,
            onSegmentInput: (values, detail) => {
                control.setSegmentFocusIndex(this.#canonicalFocusIndex(values));
                if (typeof this.options.onInput === 'function') this.options.onInput(values.join(''), { ...detail, instance: this });
            },
            onChange: (value, detail) => {
                const proposed = this.#sanitize(value);
                const meta = { silent: true, source: detail && detail.source || 'control', reason: detail && detail.reason || 'change', originalEvent: detail && detail.originalEvent || null };
                valueState.requestChange(proposed, meta);
                if (valueState.controlled) control.updateOptions({ value: valueState.value, committedValue: valueState.value });
                else this.setFieldValue(valueState.value, { silent: true, force: true, sync: true, source: meta.source, reason: meta.reason });
                this.#syncFocusPolicy();
                const payload = { ...detail, controlled: valueState.controlled, proposedValue: proposed, instance: this };
                if (typeof this.options.onChange === 'function') this.options.onChange(proposed, payload);
                if (detail && detail.complete === true) {
                    if (proposed !== record.lastCompleteValue) {
                        record.lastCompleteValue = proposed;
                        if (typeof this.options.onComplete === 'function') this.options.onComplete(proposed, payload);
                    }
                } else record.lastCompleteValue = '';
            },
            onFocus: event => { if (typeof this.options.onFocus === 'function') this.options.onFocus(event, this); },
            onBlur: event => { if (typeof this.options.onBlur === 'function') this.options.onBlur(event, this); }
        });
        control.getRootElement().classList.add('qxframe9a7c2-input-otp');
        record.control = this.own(control);
        record.rendered = true;
        this.bindFocusTarget(control.getFocusElement ? control.getFocusElement() : null);
        this.setFieldValue(initialValue, { silent: true, force: true, sync: true, source: 'init', reason: 'otp-init' });
        if (this.options.autoFocus === true) {
            record.autoFocusScheduler = this.own(Scheduler.createDelayScheduler(() => { if (!this.destroyed) this.focus(); }));
            record.autoFocusScheduler.request(0, 'auto-focus');
        }
        return control.getRootElement();
    }

    [componentHooks.beforeOptionsUpdate](patch, previous) {
        for (const name of ['length','accept','mask','separator','placeholder','autocomplete','inputMode']) {
            if (own(patch, name) && patch[name] !== previous[name]) throw new Error('[QXFRAME9A7C2] InputOTP ' + name + ' is structural and immutable; destroy and recreate.');
        }
    }

    [fieldHooks.fieldOptionsUpdated](next, previous, patch) {
        const record = state.get(this);
        if (!record.control) return;
        const update = { disabled: next.disabled === true, readOnly: next.readOnly === true, required: next.required === true, size: next.size, status: next.status, variant: next.variant, focusOutline: next.focusOutline, name: next.name };
        if (own(patch, 'value')) {
            const external = this.#sanitize(next.value);
            record.valueState.setControlled(true);
            record.valueState.syncExternal(external, { silent: true, source: 'options', reason: 'external-sync' });
            this.setFieldValue(record.valueState.value, { silent: true, force: true, sync: true, source: 'options', reason: 'external-sync' });
            update.value = record.valueState.value;
            update.committedValue = record.valueState.value;
        }
        record.control.updateOptions(update);
        this.#syncFocusPolicy();
    }

    setValue(value) {
        if (this.destroyed) return false;
        const record = state.get(this), next = this.#sanitize(value);
        record.valueState.setValue(next, { silent: true, source: 'api', reason: 'set-value' });
        this.setFieldValue(record.valueState.value, { silent: true, force: true, sync: true, source: 'api', reason: 'set-value' });
        record.control.updateOptions(record.valueState.controlled ? { value: record.valueState.value, committedValue: record.valueState.value } : { value: record.valueState.value });
        this.#syncFocusPolicy();
        return this;
    }
    clear() { return this.setValue(''); }
    focus() {
        if (this.destroyed || this.disabled) return false;
        const record = state.get(this), inputs = record.control.getInputElements(), index = this.#syncFocusPolicy();
        if (!inputs[index]) return false;
        DOM.focusElement(inputs[index]);
        if (inputs[index].select) inputs[index].select();
        return true;
    }
    blur() { const record = state.get(this); return this.destroyed || !record.control ? false : record.control.blur(); }
    getState() {
        const record = state.get(this), current = record.control ? record.control.getState() : null;
        const value = record.valueState ? record.valueState.value : this.value;
        return Object.freeze({ value, complete: String(value == null ? '' : value).length === record.length, length: record.length, controlled: !!(record.valueState && record.valueState.controlled), disabled: current ? current.disabled : this.disabled, readOnly: current ? current.readOnly : this.readOnly, destroyed: this.destroyed });
    }
    getControl() { return state.get(this).control; }
    getRootElement() { const control = state.get(this).control; return control ? control.getRootElement() : this.root; }
    getInputElements() { const control = state.get(this).control; return control ? control.getInputElements() : []; }
}
