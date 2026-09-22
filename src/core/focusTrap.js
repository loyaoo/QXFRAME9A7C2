// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { FocusScope } from './focusScope.js';

function create(options) {
    var settings = Object.assign({}, options || {}, { mode: 'trap' });
    if (settings.focusOnActivate === undefined) settings.focusOnActivate = true;
    return FocusScope.create(settings);
  }

export const FocusTrap = Object.freeze({ create });
export { create };
