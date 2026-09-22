import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const externalCwd = fs.mkdtempSync(path.join(os.tmpdir(), 'qxframe-cwd-'));
try {
    let result = spawnSync(process.execPath, [path.join(root, 'tools/verify-package-entry-semantics.mjs')], { cwd: externalCwd, encoding: 'utf8' });
    assert.equal(result.status, 0, `package-entry verifier depends on caller cwd:\n${result.stdout}\n${result.stderr}`);

    result = spawnSync(process.execPath, [path.join(root, 'tools/verify-package-contents.mjs')], { cwd: externalCwd, encoding: 'utf8' });
    if (result.status !== 0) {
        const combined = `${result.stdout}\n${result.stderr}`;
        assert.match(combined, /npm package is missing required release files/, `package-contents verifier used caller cwd instead of project root:\n${combined}`);
    }

    const provider = path.join(root, 'tools/fixtures/mock-rollup-provider-cwd.mjs');
    result = spawnSync(process.execPath, [path.join(root, 'tools/build-release.mjs')], {
        cwd: externalCwd,
        encoding: 'utf8',
        env: { ...process.env, QXFRAME_ROLLUP_PROVIDER: provider }
    });
    assert.notEqual(result.status, 0, 'incomplete cwd fixture build must fail release artifact verification');
    const combined = `${result.stdout}\n${result.stderr}`;
    assert.match(combined, /Missing release artifacts/, `build from external cwd failed before release verification:\n${combined}`);
    assert.doesNotMatch(combined, /not absolute|does not exist|Could not resolve entry|preserveModulesRoot/i, `Rollup source/output paths still depend on caller cwd:\n${combined}`);
    assert.ok(!fs.existsSync(path.join(root, '.release-stage')), 'external-cwd build leaked release staging');
    assert.ok(!fs.existsSync(path.join(root, '.release-dist-backup')), 'external-cwd build leaked recovery backup');

    console.log(JSON.stringify({ ok: true, externalCwd: true, packageEntry: true, packageContentsRooted: true, rollupInputsRooted: true, preserveModulesRootRooted: true }));
} finally {
    fs.rmSync(externalCwd, { recursive: true, force: true });
}
