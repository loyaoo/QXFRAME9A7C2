
import { FocusScope } from './focusScope.js';

function create(options) {
    var settings = Object.assign({}, options || {}, { mode: 'trap' });
    if (settings.focusOnActivate === undefined) settings.focusOnActivate = true;
    return FocusScope.create(settings);
  }

export const FocusTrap = Object.freeze({ create });
export { create };
