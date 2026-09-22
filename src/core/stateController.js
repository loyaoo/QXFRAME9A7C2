// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { ValueEquality } from '../utils/valueEquality.js';
import { mergeOptions } from './options.js';
import { ValueDraft } from './valueDraft.js';

function create(options) {
    const opts = mergeOptions({}, options);
    if (!Object.prototype.hasOwnProperty.call(opts, 'controlled')) opts.controlled = Object.prototype.hasOwnProperty.call(opts, 'value');
    return ValueDraft.create(opts);
}

export const StateController = Object.freeze({
    create,
    equals: ValueEquality.equals,
    deepEquals: ValueEquality.deep,
    arrayEquals: ValueEquality.array
});

export { create };
