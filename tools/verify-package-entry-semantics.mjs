import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

assert.equal(pkg.type, 'module');
assert.equal(pkg.main, './dist/esm/index.js');
assert.equal(pkg.module, './dist/esm/index.js');
assert.equal(pkg.browser, undefined, 'browser must not redirect bundlers to the IIFE build.');
assert.equal(pkg.unpkg, './dist/qxframe9a7c2.js');
assert.equal(pkg.jsdelivr, './dist/qxframe9a7c2.js');
assert.equal(pkg.exports['.'].import, './dist/esm/index.js');
assert.equal(pkg.exports['.'].default, './dist/esm/index.js');
assert.equal(pkg.exports['./bundle'].import, './dist/qxframe9a7c2.esm.js');
assert.equal(pkg.exports['./dist/qxframe9a7c2.esm.js'], './dist/qxframe9a7c2.esm.js');
assert.ok(!Object.prototype.hasOwnProperty.call(pkg.exports['.'], 'require'), 'Package is ESM-only; do not expose the IIFE as a CommonJS require target.');
assert.equal(pkg.exports['./dist/qxframe9a7c2.js'], './dist/qxframe9a7c2.js');
assert.equal(pkg.exports['./css'], './dist/qxframe9a7c2.css');

// Validate Node package-name resolution and, crucially, root/subpath module identity.
// Root and component subpaths must resolve through the same preserveModules graph;
// otherwise consumers mixing imports would get duplicate singleton/class instances.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'qxframe-package-entry-'));
try {
    const packageDir = path.join(tmp, 'node_modules', pkg.name);
    fs.mkdirSync(path.join(packageDir, 'dist', 'esm', 'components'), { recursive: true });
    fs.mkdirSync(path.join(packageDir, 'dist'), { recursive: true });
    fs.writeFileSync(path.join(packageDir, 'package.json'), JSON.stringify({
        name: pkg.name,
        version: pkg.version,
        type: pkg.type,
        main: pkg.main,
        module: pkg.module,
        exports: {
            '.': pkg.exports['.'],
            './bundle': pkg.exports['./bundle'],
            './components/*': pkg.exports['./components/*']
        }
    }, null, 2));
    fs.writeFileSync(path.join(packageDir, 'dist', 'esm', 'components', 'date-picker.js'), 'export class DatePicker {}\n');
    fs.writeFileSync(path.join(packageDir, 'dist', 'esm', 'index.js'), "export { DatePicker } from './components/date-picker.js'; export default { graph: 'preserve' };\n");
    fs.writeFileSync(path.join(packageDir, 'dist', 'qxframe9a7c2.esm.js'), "export class DatePicker {}; export default { graph: 'bundle' };\n");
    fs.writeFileSync(path.join(packageDir, 'dist', 'qxframe9a7c2.d.ts'), 'export declare class DatePicker {}; declare const x: unknown; export default x;\n');
    const probe = path.join(tmp, 'probe.mjs');
    fs.writeFileSync(probe, `
import rootApi, { DatePicker as RootDatePicker } from ${JSON.stringify(pkg.name)};
import { DatePicker as DirectDatePicker } from ${JSON.stringify(pkg.name + '/components/date-picker')};
import bundleApi, { DatePicker as BundledDatePicker } from ${JSON.stringify(pkg.name + '/bundle')};
if (rootApi.graph !== 'preserve') throw new Error('root did not resolve to preserveModules entry');
if (RootDatePicker !== DirectDatePicker) throw new Error('root/subpath module identity split');
if (bundleApi.graph !== 'bundle') throw new Error('explicit bundle entry did not resolve to single-file ESM bundle');
if (BundledDatePicker === RootDatePicker) throw new Error('fixture did not distinguish explicit bundle graph');
`);
    const result = spawnSync(process.execPath, [probe], { encoding: 'utf8' });
    assert.equal(result.status, 0, `Installed package entry semantics failed:\n${result.stderr}`);
} finally {
    fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(JSON.stringify({
    ok: true,
    packageRoot: 'preserveModules',
    rootSubpathIdentity: 'shared',
    explicitSingleFileEsmBundle: true,
    bundlerBrowserRedirect: false,
    cdnIifeEntries: ['unpkg', 'jsdelivr'],
    commonJsIifeAlias: false
}));
