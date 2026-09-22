// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { copyOwn } from '../utils/utils.js';

function mergeOptions(base, next) {
    const output = Object.create(null);
    copyOwn(output, base);
    copyOwn(output, next);
    return output;
}

export const Options = Object.freeze({ merge: mergeOptions });
export { mergeOptions };
