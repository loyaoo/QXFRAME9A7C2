// Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel.
// Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools/verify-esm-core-parity.mjs.

function compact(value) { return String(value == null ? '' : value).trim().replace(/[\u0000-\u001F\u007F\s]+/g, ''); }
function schemeOf(value) {
  var text = compact(value);
  var match = /^([a-z][a-z0-9+.-]*):/i.exec(text);
  return match ? match[1].toLowerCase() : '';
}
function relative(value) {
  var text = String(value == null ? '' : value).trim();
  return !!text && !schemeOf(text);
}
function allowed(kind) {
  if (kind === 'image') return ['http','https','blob','data'];
  if (kind === 'media') return ['http','https','blob','data'];
  if (kind === 'download') return ['http','https','blob','data'];
  if (kind === 'document') return ['http','https','blob'];
  return ['http','https','mailto','tel'];
}
function safeData(value, kind) {
  var text = compact(value).toLowerCase();
  if (kind === 'image') return /^data:image\/(?:png|gif|jpeg|jpg|webp|avif|bmp|x-icon|vnd\.microsoft\.icon)(?:;[^,]*)?,/i.test(text);
  if (kind === 'media') return /^data:(?:audio|video)\/[a-z0-9.+-]+(?:;[^,]*)?,/i.test(text);
  if (kind === 'download') return /^data:(?:application\/octet-stream|text\/plain)(?:;[^,]*)?,/i.test(text);
  return false;
}
function isSafe(value, kind) {
  var text = String(value == null ? '' : value).trim();
  if (!text) return true;
  var mode = String(kind || 'navigation').toLowerCase();
  var scheme = schemeOf(text);
  if (!scheme) return relative(text);
  if (scheme === 'data') return safeData(text, mode);
  return allowed(mode).indexOf(scheme) >= 0;
}
function sanitize(value, kind) {
  var text = String(value == null ? '' : value).trim();
  return isSafe(text, kind) ? text : '';
}
function assertSafe(value, kind) {
  var text = String(value == null ? '' : value).trim();
  if (!isSafe(text, kind)) throw new TypeError('[QXFRAME9A7C2] Unsafe ' + String(kind || 'navigation') + ' URL scheme.');
  return text;
}

export const URLPolicy = Object.freeze({ isSafe, sanitize, assertSafe, schemeOf });
export { isSafe, sanitize, assertSafe, schemeOf };
