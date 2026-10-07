// Owner rule (v3 stage 0): the framework, its docs and createApp depend on no UI framework.
// The only third-party runtime code is the vendored Floating UI. React-based code may exist only
// in tools/qa/ref (the shadcn reference renderer used for measurement), which never ships.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BANNED = /^(?:react(?:-dom)?(?:\/.*)?|preact(?:\/.*)?|vue(?:\/.*)?|svelte(?:\/.*)?|solid-js(?:\/.*)?|@angular\/.*|@radix-ui\/.*|@base-ui\/.*|@base-ui-components\/.*|lucide-react|recharts|react-day-picker|jquery|tailwindcss|next(?:\/.*)?)$/;
const VENDOR = 'src/vendor/floating-ui.js';
const VENDOR_ALLOWED = /^@floating-ui\//;
// Module specifiers only: a quoted token without whitespace or quotes.
const SPEC = `['"]([@\\w./:-][^'"\\s]*)['"]`;
const SPECIFIER = new RegExp(`\\bfrom\\s*${SPEC}|\\bimport\\s*\\(\\s*${SPEC}\\s*\\)|\\bimport\\s+${SPEC}|\\brequire\\(\\s*${SPEC}\\s*\\)`, 'g');
const RUNTIME_MARKERS = /\bReact\.createElement\b|\breact\/jsx-runtime\b|__REACT_DEVTOOLS_GLOBAL_HOOK__|\bReactDOM\b|data-reactroot/;

function walk(dir, exts) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap(e => {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) return walk(rel, exts);
    return exts.includes(path.extname(e.name)) ? [rel] : [];
  });
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
for (const field of ['dependencies', 'peerDependencies', 'optionalDependencies', 'bundleDependencies', 'bundledDependencies']) {
  const deps = pkg[field];
  assert.ok(!deps || Object.keys(deps).length === 0, `package.json ${field} must stay empty; Floating UI is vendored.`);
}
const bannedDev = Object.keys(pkg.devDependencies || {}).filter(name => BANNED.test(name));
assert.deepEqual(bannedDev, [], 'UI framework packages must not be dev dependencies: ' + bannedDev.join(', '));
assert.ok(!(pkg.files || []).some(f => f === 'tools' || f.startsWith('tools/')), 'tools/ (including tools/qa/ref) must never ship in the npm package.');

const offenders = [];
const files = [...walk('src', ['.js', '.mjs']), ...walk('docs', ['.js', '.mjs', '.html']), ...walk('dist', ['.js', '.mjs'])];
for (const rel of files) {
  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  for (const m of text.matchAll(SPECIFIER)) {
    const spec = m[1] || m[2] || m[3] || m[4];
    if (/^(?:\.{1,2}\/|\/|https?:\/\/|data:)/.test(spec)) continue;
    // The vendored Floating UI UMD wrapper names its own sub-package; it is bundled, not resolved.
    if (VENDOR_ALLOWED.test(spec) && (rel === VENDOR || rel.startsWith('dist/'))) continue;
    if (BANNED.test(spec) || rel.startsWith('src/') || rel.startsWith('dist/')) offenders.push(`${rel}: '${spec}'`);
  }
  if (RUNTIME_MARKERS.test(text)) offenders.push(`${rel}: UI framework runtime marker`);
}
assert.deepEqual(offenders, [], 'Framework code must not import third-party or UI framework modules:\n' + offenders.join('\n'));

console.log(JSON.stringify({ ok: true, scannedFiles: files.length, runtimeDependencies: 0, vendored: [VENDOR] }));
