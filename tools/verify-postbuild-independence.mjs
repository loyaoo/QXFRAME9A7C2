import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { runPostbuild } from './postbuild-release.mjs';
import { generateMigrationManifest } from './generate-release-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-postbuild-'));
const target = path.join(tempRoot, 'dist-from-empty');
try {
    await runPostbuild({ root, distDir:target });
    const required = [
        'qxframe9a7c2.css',
        'qxframe9a7c2.d.ts',
        'qxframe9a7c2-api.json',
        'qxframe9a7c2-module-manifest.json',
        'qxframe9a7c2-migration.json',
        'esm/components/index.d.ts',
        'esm/core/index.d.ts',
        'esm/utils/index.d.ts'
    ];
    const missing = required.filter(file => !fs.existsSync(path.join(target, file)));
    assert.deepEqual(missing, [], 'postbuild from an empty target missed release files: ' + missing.join(', '));
    assert.ok(fs.readdirSync(path.join(target, 'fonts')).length > 0, 'postbuild must copy fonts into an empty target');
    assert.equal(JSON.parse(fs.readFileSync(path.join(target, 'qxframe9a7c2-api.json'), 'utf8')).components.length, 40);
    assert.equal(JSON.parse(fs.readFileSync(path.join(target, 'qxframe9a7c2-module-manifest.json'), 'utf8')).modules.length, 72);
    const migration = JSON.parse(fs.readFileSync(path.join(target, 'qxframe9a7c2-migration.json'), 'utf8'));
    const expectedMigration = generateMigrationManifest({ root });
    assert.deepEqual(migration, expectedMigration, 'postbuild migration metadata must be generated from current canonical contracts/manifests.');
    assert.ok(migration.entries.some(entry => entry && entry.kind === 'option' && entry.component === 'Menu' && entry.name === 'theme' && entry.apiParityAction === 'remove'), 'Phase F Menu.theme migration record is missing.');

    const source = fs.readFileSync(path.join(root, 'tools/postbuild-release.mjs'), 'utf8');
    assert.ok(!/docs\/generated\/component-api\.json/.test(source), 'release postbuild must not copy API metadata from generated docs');
    assert.ok(!/currentDist|migrationSource/.test(source), 'release postbuild must not read metadata from an existing dist');
    console.log(JSON.stringify({ ok:true, emptyTarget:true, css:true, fonts:true, rootTypes:true, preserveTypes:true, metadata:true, existingDistInput:false }));
} finally {
    fs.rmSync(tempRoot, { recursive:true, force:true });
}
