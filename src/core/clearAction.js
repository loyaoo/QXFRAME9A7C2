
import { Utils } from '../utils/utils.js';
import { InteractionPolicy } from './interactionPolicy.js';

function clearAllowed(options, capabilities) { return InteractionPolicy.resolve(InteractionPolicy.stateFromOptions(options), Object.assign({ clearable:true }, capabilities || {})).clearable; }
function clearRequest(options, capabilities, callback, detail) { if(!clearAllowed(options,capabilities)) return false; return Utils.isFunction(callback) ? callback(detail||{}) !== false : true; }

export const ClearAction = Object.freeze({ allowed: clearAllowed, request: clearRequest });
export { clearAllowed, clearRequest };
