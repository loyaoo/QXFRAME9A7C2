
import { ValueEquality } from '../utils/valueEquality.js';
import { mergeOptions } from './options.js';
import { ValueDraft } from './valueDraft.js';

function create(options) {
    const opts = mergeOptions({}, options);
    if (!Object.prototype.hasOwnProperty.call(opts, 'controlled')) opts.controlled = Object.prototype.hasOwnProperty.call(opts, 'value');
    return ValueDraft.create(opts);
}

function createValueBinding(options) {
    const opts = mergeOptions({}, options);
    const normalizeValue = typeof opts.normalizeValue === 'function' ? opts.normalizeValue : value => value;
    const copyValue = typeof opts.copyValue === 'function' ? opts.copyValue : value => Array.isArray(value) ? value.slice() : value;
    const equals = typeof opts.equals === 'function' ? opts.equals : ValueEquality.deep;
    const controller = create({ ...opts, normalizeValue, copyValue, equals });

    function write(next, meta, request) {
        const cfg = mergeOptions({ silent: true, source: 'api', reason: request === true ? 'request-change' : 'set-value' }, meta);
        const normalized = normalizeValue(next, cfg);
        if (equals(controller.value, normalized)) return false;
        if (request === true && controller.controlled) return controller.requestChange(normalized, cfg);
        return controller.setValue(normalized, cfg);
    }

    return Object.freeze({
        get value() { return copyValue(controller.value); },
        get controlled() { return controller.controlled; },
        write,
        syncExternal(next, meta) { return controller.syncExternal(next, meta); },
        setControlled(value) { controller.setControlled(value); return this; },
        destroy() { return controller.destroy(); }
    });
}

export const StateController = Object.freeze({
    create,
    createValueBinding,
    equals: ValueEquality.equals,
    deepEquals: ValueEquality.deep,
    arrayEquals: ValueEquality.array
});

export { create, createValueBinding };
