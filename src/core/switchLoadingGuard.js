import { DOM } from './dom.js';
import { PressInteraction } from './pressInteraction.js';

const installed = new WeakSet();

export function installSwitchLoadingGuard(doc = globalThis.document) {
    if (!doc || installed.has(doc)) return false;
    installed.add(doc);
    function loadingSwitch(target) { return target && target.closest ? target.closest('.qxframe9a7c2-switch.is-loading') : null; }
    function guard(event) {
        if (!loadingSwitch(event.target)) return false;
        return PressInteraction.guard(event, {
            state: { loading: true },
            capabilities: { preserveFocusWhileLoading: true, tabbableWhileLoading: true },
            stopImmediatePropagationWhenBlocked: true
        });
    }
    DOM.listen(doc, 'click', guard, true);
    DOM.listen(doc, 'keydown', event => {
        if (DOM.isComposingEvent(event)) return;
        if (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter') return;
        guard(event);
    }, true);
    return true;
}
