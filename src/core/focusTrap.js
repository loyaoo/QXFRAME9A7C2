
import { FocusScope } from './focusScope.js';
import { Utils } from '../utils/utils.js';

function create(options) {
    var settings = Utils.mergeOwn(options || {}, { mode: 'trap' });
    if (settings.focusOnActivate === undefined) settings.focusOnActivate = true;
    return FocusScope.create(settings);
  }

export const FocusTrap = Object.freeze({ create });
export { create };
