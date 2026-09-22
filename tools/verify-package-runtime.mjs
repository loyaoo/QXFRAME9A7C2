import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const required = [
    'dist/esm/index.js',
    'dist/esm/components/date-picker.js',
    'dist/esm/core/component.js',
    'dist/esm/utils/treeQuery.js',
    'dist/qxframe9a7c2.esm.js',
    'dist/qxframe9a7c2.d.ts'
];
const missing = required.filter(relative => !fs.existsSync(path.join(root, relative)));
assert.deepEqual(missing, [], `Package runtime verification requires a completed Rollup release build. Missing: ${missing.join(', ')}`);
assert.equal(Object.keys(pkg.dependencies || {}).length, 0, 'Published package must not require runtime npm dependencies for the current vendored runtime graph.');
assert.equal(Object.keys(pkg.optionalDependencies || {}).length, 0, 'Build-only fallback providers must not leak into published optionalDependencies.');

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-package-runtime-'));
try {
    const packDir = path.join(sandbox, 'pack');
    const consumer = path.join(sandbox, 'consumer');
    fs.mkdirSync(packDir, { recursive: true });
    fs.mkdirSync(consumer, { recursive: true });
    fs.writeFileSync(path.join(consumer, 'package.json'), JSON.stringify({ name: 'qxframe-runtime-consumer', private: true, type: 'module' }, null, 2));

    let result = spawnSync('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', packDir], { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });
    assert.equal(result.status, 0, `npm pack failed:\n${result.stdout}\n${result.stderr}`);
    const packed = JSON.parse(result.stdout)[0];
    const tarball = path.join(packDir, packed.filename);
    assert.ok(fs.existsSync(tarball), `npm pack tarball was not created: ${tarball}`);

    result = spawnSync('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', '--omit=dev', tarball], { cwd: consumer, encoding: 'utf8', shell: process.platform === 'win32' });
    assert.equal(result.status, 0, `Installing packed artifact failed:\n${result.stdout}\n${result.stderr}`);

    const probe = path.join(consumer, 'probe.mjs');
    fs.writeFileSync(probe, `
import QX, { DatePicker, Component, TreeQuery, Components, QXFRAME9A7C2 } from ${JSON.stringify(pkg.name)};
import { DatePicker as DirectDatePicker } from ${JSON.stringify(pkg.name + '/components/date-picker')};
import { Component as DirectComponent } from ${JSON.stringify(pkg.name + '/core/component')};
import { TreeQuery as DirectTreeQuery } from ${JSON.stringify(pkg.name + '/utils/treeQuery')};
import BundleQX, { DatePicker as BundledDatePicker } from ${JSON.stringify(pkg.name + '/bundle')};
if (QX !== QXFRAME9A7C2) throw new Error('root default/named runtime identity mismatch');
if (DatePicker !== DirectDatePicker) throw new Error('root/components subpath class identity split');
if (Component !== DirectComponent) throw new Error('root/core subpath class identity split');
if (TreeQuery !== DirectTreeQuery) throw new Error('root/utils subpath capability identity split');
if (!Components.DatePicker || typeof Components.DatePicker.create !== 'function') throw new Error('root Components adapter missing DatePicker');
if (!BundleQX || typeof BundledDatePicker !== 'function') throw new Error('explicit single-file ESM bundle export failed');
if (BundledDatePicker === DatePicker) throw new Error('explicit bundle fixture unexpectedly shares preserveModules module identity');
console.log(JSON.stringify({ ok:true, rootSubpathIdentity:true, explicitBundle:true, components:Object.keys(QX.Components).length, modules:QX.ModuleManifest.list().length }));
`);
    result = spawnSync(process.execPath, [probe], { cwd: consumer, encoding: 'utf8' });
    assert.equal(result.status, 0, `Installed package runtime imports failed:\n${result.stdout}\n${result.stderr}`);
    const payload = JSON.parse(result.stdout.trim());
    assert.equal(payload.components, 40);
    assert.equal(payload.modules, 72);

    console.log(JSON.stringify({ ok: true, packedInstall: true, rootSubpathIdentity: true, explicitBundle: true, components: payload.components, modules: payload.modules }));
} finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
}
