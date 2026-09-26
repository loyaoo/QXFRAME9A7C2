import { DOM } from './dom.js';
import { PressInteraction } from './pressInteraction.js';

const installed = new WeakMap();

export function installSwitchLoadingGuard(doc = globalThis.document) {
    if (!doc || installed.has(doc)) return false;
    function loadingSwitch(target) { return target && target.closest ? target.closest('.qxframe9a7c2-switch.is-loading') : null; }
    function guard(event) {
        if (!loadingSwitch(event.target)) return false;
        return PressInteraction.guard(event, {
            state: { loading: true },
            capabilities: { preserveFocusWhileLoading: true, tabbableWhileLoading: true },
            stopImmediatePropagationWhenBlocked: true
        });
    }
    const cleanups = [
        DOM.listen(doc, 'click', guard, true),
        DOM.listen(doc, 'keydown', event => {
            if (DOM.isComposingEvent(event)) return;
            if (event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Enter') return;
            guard(event);
        }, true)
    ];
    installed.set(doc, cleanups);
    return true;
}

export function uninstallSwitchLoadingGuard(doc = globalThis.document) {
    const cleanups = doc && installed.get(doc);
    if (!cleanups) return false;
    installed.delete(doc);
    cleanups.splice(0).forEach(cleanup => { try { cleanup(); } catch (_) {} });
    return true;
}
