import { Utils } from '../utils/utils.js';
import { Scheduler } from './scheduler.js';
import { Lifecycle } from './lifecycle.js';
import { DOM } from './dom.js';
import { DOMProjection } from './domProjection.js';
import { AsyncTask } from './asyncTask.js';
import { AsyncAction } from './asyncAction.js';
import { ObserverHub } from './observerHub.js';
import { LayerManager } from './layerManager.js';
import { FocusScope } from './focusScope.js';
import { ScrollLock } from './scrollLock.js';
import { InteractionIsolation } from './interactionIsolation.js';
import { MotionCore } from './motion.js';
import { LogicalOwnership } from './logicalOwnership.js';
import { ComponentRuntime } from '../runtime/componentRuntime.js';

function cloneStats(value) { return Object.freeze(Utils.mergeOwn( value || {})); }
function stats(api) { return api && typeof api.getStats === 'function' ? cloneStats(api.getStats()) : Object.freeze({}); }
function now() { return globalThis.performance && typeof globalThis.performance.now === 'function' ? globalThis.performance.now() : Date.now(); }
function snapshot(label) {
    return Object.freeze({
        label:label === undefined ? '' : String(label), timestamp:now(),
        scheduler:stats(Scheduler), lifecycle:stats(Lifecycle), dom:stats(DOM), domProjection:stats(DOMProjection), componentRuntime:stats(ComponentRuntime),
        asyncTask:stats(AsyncTask), asyncAction:stats(AsyncAction), observerHub:stats(ObserverHub), layerManager:stats(LayerManager), focusScope:stats(FocusScope),
        scrollLock:stats(ScrollLock), interactionIsolation:stats(InteractionIsolation), motion:stats(MotionCore), logicalOwnership:stats(LogicalOwnership)
    });
}
function subtractGroup(before, after) {
    const output = {}, keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);
    for (const key of keys) { const a=Number(before&&before[key]), b=Number(after&&after[key]); if (Number.isFinite(a)&&Number.isFinite(b)) output[key]=b-a; }
    return Object.freeze(output);
}
function diff(before, after) {
    if (!before || !after) throw new TypeError('[QXFRAME9A7C2] PerformanceDiagnostics.diff requires two snapshots.');
    const output={elapsed:Number(after.timestamp||0)-Number(before.timestamp||0)};
    for (const group of ['scheduler','lifecycle','dom','domProjection','componentRuntime','asyncTask','asyncAction','observerHub','layerManager','focusScope','scrollLock','interactionIsolation','motion','logicalOwnership']) output[group]=subtractGroup(before[group],after[group]);
    return Object.freeze(output);
}
function balanceFailures(before, after) {
    const delta=diff(before,after), failures=[];
    const expect=(group,key)=>{ if (delta[group]&&Number(delta[group][key]||0)!==0) failures.push(group+'.'+key+'='+String(delta[group][key])); };
    for (const [group,key] of [['lifecycle','activeScopes'],['lifecycle','activeResources'],['dom','activeListeners'],['domProjection','activeProjections'],['domProjection','activeEntries'],['scheduler','activeSchedulers'],['scheduler','pendingSchedulers'],['scheduler','layoutPendingTasks'],['componentRuntime','activeInstances'],['asyncTask','activeTasks'],['asyncTask','pendingTasks'],['asyncAction','activeActions'],['observerHub','activeObservers'],['layerManager','activeManagers'],['layerManager','activeLayers'],['focusScope','liveScopes'],['focusScope','active'],['scrollLock','liveLocks'],['scrollLock','activeLocks'],['interactionIsolation','liveIsolations'],['interactionIsolation','active'],['motion','liveMotions'],['motion','active'],['logicalOwnership','activeNodes']]) expect(group,key);
    return failures;
}
export const PerformanceDiagnostics=Object.freeze({ snapshot, diff, balanced:(before,after)=>balanceFailures(before,after).length===0, assertBalanced(before,after){ const failures=balanceFailures(before,after); if(failures.length) throw new Error('[QXFRAME9A7C2] Diagnostics resource imbalance: '+failures.join(', ')); return true; } });
export default PerformanceDiagnostics;
