// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

import { Utils } from '../utils/utils.js';
import { InteractionPolicy } from './interactionPolicy.js';

function clearAllowed(options, capabilities) { return InteractionPolicy.resolve(InteractionPolicy.stateFromOptions(options), Object.assign({ clearable:true }, capabilities || {})).clearable; }
function clearRequest(options, capabilities, callback, detail) { if(!clearAllowed(options,capabilities)) return false; return Utils.isFunction(callback) ? callback(detail||{}) !== false : true; }

export const ClearAction = Object.freeze({ allowed: clearAllowed, request: clearRequest });
export { clearAllowed, clearRequest };
