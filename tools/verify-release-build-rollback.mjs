import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

function hashTree(dir) {
    const hash = crypto.createHash('sha256');
    const walk = current => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            const full = path.join(current, entry.name);
            const relative = path.relative(dir, full).split(path.sep).join('/');
            hash.update(relative + '\0');
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile()) hash.update(fs.readFileSync(full));
        }
    };
    walk(dir);
    return hash.digest('hex');
}

const before = hashTree(dist);
const result = spawnSync(process.execPath, ['tools/build-release.mjs'], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, QXFRAME_ROLLUP_PROVIDER: './tools/fixtures/mock-rollup-provider.mjs' }
});
assert.notEqual(result.status, 0, 'Mock incomplete Rollup build must fail release verification.');
const combined = `${result.stdout}\n${result.stderr}`;
assert.match(combined, /Missing release artifacts/, 'Mock build failed for an unexpected reason.');
const after = hashTree(dist);
assert.equal(after, before, 'Failed staged release build modified the committed dist tree.');
assert.ok(!fs.existsSync(path.join(root, '.release-stage')), 'Failed release build leaked .release-stage.');
assert.ok(!fs.existsSync(path.join(root, '.release-dist-backup')), 'Failed release build leaked .release-dist-backup.');
console.log(JSON.stringify({ ok: true, injectedProvider: true, expectedBuildFailure: true, distHashStable: true, stagingLeak: false, backupLeak: false }));
