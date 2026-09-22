import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const result = spawnSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
assert.equal(result.status, 0, `npm pack --dry-run failed:\n${result.stderr}`);
const payload = JSON.parse(result.stdout)[0];
const files = new Set((payload.files || []).map(record => record.path));
const required = [
  'package.json',
  'README.md',
  'THIRD_PARTY_NOTICES.md',
  'dist/qxframe9a7c2.js',
  'dist/qxframe9a7c2.js.map',
  'dist/qxframe9a7c2.esm.js',
  'dist/qxframe9a7c2.esm.js.map',
  'dist/esm/index.js',
  'dist/esm/components/index.js',
  'dist/esm/components/index.d.ts',
  'dist/esm/components/date-picker.d.ts',
  'dist/esm/core/index.js',
  'dist/esm/core/index.d.ts',
  'dist/esm/core/component.d.ts',
  'dist/esm/utils/index.js',
  'dist/esm/utils/index.d.ts',
  'dist/esm/utils/treeQuery.d.ts',
  'dist/qxframe9a7c2.css',
  'dist/qxframe9a7c2.d.ts'
];
function walkPublicSource(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkPublicSource(absolute));
    else if (entry.isFile() && entry.name.endsWith('.js')) out.push(absolute);
  }
  return out;
}
const publicSourceFiles = ['components', 'core', 'utils']
  .flatMap(name => walkPublicSource(path.join(root, 'src', name)));
const publicReleaseFiles = publicSourceFiles.flatMap(sourceFile => {
  const relative = path.relative(path.join(root, 'src'), sourceFile).replaceAll(path.sep, '/');
  const js = `dist/esm/${relative}`;
  return [js, `${js}.map`, js.replace(/\.js$/, '.d.ts')];
});
const missing = [...required, ...publicReleaseFiles].filter(file => !files.has(file));
assert.deepEqual(missing, [], `npm package is missing required release files: ${missing.join(', ')}`);
for (const file of files) {
  assert.ok(!file.startsWith('node_modules/'), `npm package must not contain node_modules: ${file}`);
  assert.ok(!file.startsWith('src/modules/'), `npm package must not contain legacy src/modules: ${file}`);
  assert.ok(!file.startsWith('src/compat/'), `npm package must not contain legacy src/compat: ${file}`);
}
console.log(JSON.stringify({ ok: true, package: `${payload.name}@${payload.version}`, files: files.size, requiredReleaseFiles: required.length, publicSubpaths: publicSourceFiles.length, publicSubpathFiles: publicReleaseFiles.length, legacyPaths: 0 }));
