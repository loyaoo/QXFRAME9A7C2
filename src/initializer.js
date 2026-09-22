import { bootstrapInteractionModality } from './core/interactionModality.js';
import { startAutoEnhance as startRippleAutoEnhance } from './components/ripple.js';
import { installSwitchLoadingGuard } from './core/switchLoadingGuard.js';

let initializedDocument = null;
export function initializeRuntime(target = globalThis) {
    const doc = target && target.document;
    if (!doc || initializedDocument === doc) return false;
    bootstrapInteractionModality(doc);
    installSwitchLoadingGuard(doc);
    startRippleAutoEnhance();
    initializedDocument = doc;
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
export function initializeInteractionModality(target = globalThis) { return bootstrapInteractionModality(target && target.document); }
