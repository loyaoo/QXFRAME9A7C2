// Canonical utility barrel. Keep implementations in dedicated owner modules; this file only re-exports.
export { Utils, isFunction, noop, own, normalizeEnum, normalizeSize, finiteNumber, positiveInt, nonNegativeInt, booleanValue, enumValue, finiteAtLeast, copyOwn, immutablePatch } from './utils.js';
export { IdManager } from './id.js';
export { URLPolicy } from './url.js';
export { ValueEquality } from './valueEquality.js';
export { DateUnit } from './dateUnit.js';
export { TimeUnit } from './timeUnit.js';
export { WheelMetrics } from './wheelMetrics.js';
export { TreeQuery } from './treeQuery.js';
export { SemanticStyles } from './semanticStyles.js';
