import { bootstrapInteractionModality, destroy as destroyInteractionModality } from './core/interactionModality.js';
import { FocusOrigin } from './core/focusOrigin.js';
import { startAutoEnhance as startRippleAutoEnhance } from './components/ripple.js';
import { installSwitchLoadingGuard, uninstallSwitchLoadingGuard } from './core/switchLoadingGuard.js';

const initializedDocuments = new WeakMap();
function resolveDocument(target) {
    if (target && target.nodeType === 9) return target;
    return target && target.document || null;
}
export function initializeRuntime(target = globalThis) {
    const doc = resolveDocument(target);
    if (!doc || initializedDocuments.has(doc)) return false;
    bootstrapInteractionModality(doc);
    FocusOrigin.setup(doc);
    installSwitchLoadingGuard(doc);
    const rippleRuntime = startRippleAutoEnhance(doc);
    initializedDocuments.set(doc, Object.freeze({ document:doc, rippleRuntime:rippleRuntime || null }));
    return true;
}
export function destroyRuntime(target = globalThis) {
    const doc = resolveDocument(target), record = doc && initializedDocuments.get(doc);
    if (!doc || !record) return false;
    initializedDocuments.delete(doc);
    if (record.rippleRuntime && typeof record.rippleRuntime.destroy === 'function') record.rippleRuntime.destroy();
    uninstallSwitchLoadingGuard(doc);
    FocusOrigin.destroy(doc);
    destroyInteractionModality(doc);
    return true;
}
export function initializeGlobal(api, target = globalThis) {
    const runtime = api && (api.QXFRAME9A7C2 || api.default);
    if (!runtime) throw new Error('QXFRAME9A7C2 API is unavailable.');
    const current = target.QXFRAME9A7C2;
    if (current && current !== runtime) throw new Error('QXFRAME9A7C2 global namespace is already initialized by a different runtime.');
    if (!current) target.QXFRAME9A7C2 = runtime;
    initializeRuntime(target);
    return runtime;
}
export function initializeInteractionModality(target = globalThis) { return bootstrapInteractionModality(resolveDocument(target)); }
