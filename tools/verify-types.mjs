import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as api from '../src/index.js';
import { generateTypes } from './generate-types.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localTsc = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'tsc.cmd' : 'tsc');
const tsc = fs.existsSync(localTsc) ? localTsc : 'tsc';
const tscProvider = fs.existsSync(localTsc) ? 'local-devDependency' : 'system-fallback';
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-types-'));
try {
    const distDir = path.join(sandbox, 'dist');
    const generated = await generateTypes({ root, distDir });
    assert.equal(generated.componentOptions, 40, 'Type generator must cover all 40 ComponentContracts.');
    const exportNames = Object.keys(api).filter(name => name !== 'default').sort();
    assert.equal(generated.rootExports, exportNames.length, 'Root declaration export inventory drifted.');

    const expectedSubpathTypes = ['components','core','utils'].flatMap(section =>
        fs.readdirSync(path.join(root, 'src', section)).filter(name => name.endsWith('.js')).map(name => path.join(distDir, 'esm', section, name.replace(/\.js$/, '.d.ts')))
    );
    const missing = expectedSubpathTypes.filter(file => !fs.existsSync(file));
    assert.deepEqual(missing, [], `Missing preserveModules declarations: ${missing.join(', ')}`);

    fs.writeFileSync(path.join(sandbox, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));
    const named = exportNames.join(', ');
    fs.writeFileSync(path.join(sandbox, 'types-smoke.ts'), `
import QX, { ${named} } from './dist/qxframe9a7c2.js';
import { DatePicker as DirectDatePicker } from './dist/esm/components/date-picker.js';
import { Component as DirectComponent } from './dist/esm/core/component.js';
import { TreeQuery as DirectTreeQuery } from './dist/esm/utils/treeQuery.js';
const base = new Component();
base.on('event', detail => void detail);
const picker = DatePicker.create({ selection: 'date', clearable: true });
picker.destroy();
new DatePicker({ selection: 'range' });
DirectDatePicker.create({ selection: 'range' });
Components.DatePicker.create({ selection: 'date' });
JSON.create({});
void DirectComponent; void DirectTreeQuery; void QX.Components; void [${named}];
initializeRuntime(globalThis);
`);
    fs.writeFileSync(path.join(sandbox, 'tsconfig.json'), JSON.stringify({
        compilerOptions: { noEmit: true, strict: true, target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', lib: ['ES2020','DOM'], skipLibCheck: false },
        include: ['types-smoke.ts', 'dist/**/*.d.ts']
    }, null, 2));
    let result = spawnSync(tsc, ['-p', 'tsconfig.json'], { cwd: sandbox, encoding: 'utf8', shell: process.platform === 'win32' });
    assert.equal(result.status, 0, `Generated declarations failed TypeScript compile:\n${result.stdout}\n${result.stderr}`);

    const installedRoot = path.join(sandbox, 'package-consumer', 'node_modules', 'qxframe9a7c2');
    fs.mkdirSync(installedRoot, { recursive: true });
    fs.cpSync(distDir, path.join(installedRoot, 'dist'), { recursive: true });
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    fs.writeFileSync(path.join(installedRoot, 'package.json'), JSON.stringify(packageJson, null, 2));
    const consumerRoot = path.join(sandbox, 'package-consumer');
    fs.writeFileSync(path.join(consumerRoot, 'package.json'), JSON.stringify({ type: 'module' }, null, 2));
    fs.writeFileSync(path.join(consumerRoot, 'consumer.ts'), `
import QX, { DatePicker, Component, Components } from 'qxframe9a7c2';
import { DatePicker as DirectDatePicker } from 'qxframe9a7c2/components/date-picker';
import { Component as DirectComponent } from 'qxframe9a7c2/core/component';
import { TreeQuery } from 'qxframe9a7c2/utils/treeQuery';
new DatePicker({ selection: 'date' });
DirectDatePicker.create({ selection: 'range' });
Components.DatePicker.create({ clearable: true });
const base = new Component(); base.destroy();
void DirectComponent; void TreeQuery; void QX.Components;
`);
    fs.writeFileSync(path.join(consumerRoot, 'tsconfig.json'), JSON.stringify({ compilerOptions: { noEmit: true, strict: true, target: 'ES2020', module: 'NodeNext', moduleResolution: 'NodeNext', lib: ['ES2020','DOM'], skipLibCheck: false }, include: ['consumer.ts'] }, null, 2));
    result = spawnSync(tsc, ['-p', 'tsconfig.json'], { cwd: consumerRoot, encoding: 'utf8', shell: process.platform === 'win32' });
    assert.equal(result.status, 0, `Package export type resolution failed:\n${result.stdout}\n${result.stderr}`);

    console.log(JSON.stringify({ ok: true, rootExports: exportNames.length, componentOptions: generated.componentOptions, preserveModuleDeclarations: expectedSubpathTypes.length, typescriptCompile: true, packageExportsResolution: true, tscProvider }));
} finally {
    fs.rmSync(sandbox, { recursive: true, force: true });
}
