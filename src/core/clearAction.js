
import { Utils } from '../utils/utils.js';
import { CapabilityController } from './capabilityController.js';

function clearAllowed(options, capabilities) { return CapabilityController.resolve(CapabilityController.stateFromOptions(options), Utils.assignOwn({ clearable:true }, capabilities || {})).clearable; }
function clearRequest(options, capabilities, callback, detail) { if(!clearAllowed(options,capabilities)) return false; return Utils.isFunction(callback) ? callback(detail||{}) !== false : true; }

export const ClearAction = Object.freeze({ allowed: clearAllowed, request: clearRequest });
export { clearAllowed, clearRequest };
