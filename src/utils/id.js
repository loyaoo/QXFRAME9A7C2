// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

let counters = Object.create(null);
function normalizePrefix(prefix) {
  var value = String(prefix || 'id').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  return value || 'id';
}
function next(prefix) {
  var key = normalizePrefix(prefix);
  counters[key] = (counters[key] || 0) + 1;
  return 'qxframe9a7c2-' + key + '-' + counters[key];
}
function ensure(element, prefix) {
  if (!element || element.nodeType !== 1) throw new TypeError('[QXFRAME9A7C2] IdManager.ensure requires an Element.');
  if (element.id) return element.id;
  element.id = next(prefix);
  return element.id;
}
function resetForTests() { counters = Object.create(null); }

export const IdManager = Object.freeze({ next, ensure, resetForTests });
export { next, ensure, resetForTests };
