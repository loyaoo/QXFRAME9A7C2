function normalizeRevision(value) {
  var revision = Number(value);
  if (!Number.isInteger(revision) || revision < 0) throw new TypeError('[QXFRAME9A7C2] DataRevision must be a non-negative integer.');
  return revision;
}

function createRef(key, dataRevision) {
  if (key === undefined || key === null) throw new TypeError('[QXFRAME9A7C2] CollectionRef requires a stable key.');
  return Object.freeze({ key: key, dataRevision: normalizeRevision(dataRevision) });
}

function create(initialRevision) {
  var revision = initialRevision === undefined ? 0 : normalizeRevision(initialRevision);
  var destroyed = false;

  function current() { return revision; }
  function advance() {
    if (destroyed) return revision;
    revision += 1;
    return revision;
  }
  function capture(key) {
    if (destroyed) throw new Error('[QXFRAME9A7C2] DataRevision tracker is destroyed.');
    return createRef(key, revision);
  }
  function isCurrent(ref) {
    return !!(ref && !destroyed && Number(ref.dataRevision) === revision);
  }
  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    return true;
  }
  return Object.freeze({
    current,
    advance,
    capture,
    isCurrent,
    destroy,
    get destroyed() { return destroyed; }
  });
}

export const DataRevision = Object.freeze({ create, createRef, normalizeRevision });
export { create, createRef, normalizeRevision };
