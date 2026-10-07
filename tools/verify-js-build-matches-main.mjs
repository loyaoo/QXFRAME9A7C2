// v3 section 2/8.4: qxframe.js is not modified in the createApp redesign. Compare every built
// artifact except the CSS bundle against a build of main.
//   node tools/verify-js-build-matches-main.mjs --reference=<main checkout>/dist
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const refArg = process.argv.find(a => a.startsWith('--reference='));
if (!refArg) { console.error('usage: --reference=<main build dist directory>'); process.exit(2); }
const reference = path.resolve(refArg.slice(12));
const dist = path.join(root, 'dist');
const EXCLUDED = new Set(['qxframe9a7c2.css']);

function walk(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? walk(full, base) : [path.relative(base, full).replaceAll('\\', '/')];
  }).filter(rel => !EXCLUDED.has(rel)).sort();
}

const ours = walk(dist), theirs = walk(reference);
const missing = theirs.filter(f => !ours.includes(f));
const extra = ours.filter(f => !theirs.includes(f));
const changed = ours.filter(f => theirs.includes(f) && !fs.readFileSync(path.join(dist, f)).equals(fs.readFileSync(path.join(reference, f))));
for (const f of missing) console.error(`[js-build] missing vs main: ${f}`);
for (const f of extra) console.error(`[js-build] extra vs main: ${f}`);
for (const f of changed) console.error(`[js-build] differs from main: ${f}`);
const ok = !missing.length && !extra.length && !changed.length && ours.length > 0;
console.log(JSON.stringify({ ok, compared: ours.length, missing: missing.length, extra: extra.length, changed: changed.length }));
process.exit(ok ? 0 : 1);
