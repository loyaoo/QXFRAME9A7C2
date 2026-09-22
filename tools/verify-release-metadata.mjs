import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateComponentApi, generateMigrationManifest, generateModuleManifest, writeReleaseMetadata } from './generate-release-metadata.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const api = generateComponentApi({ root });
const migration = generateMigrationManifest({ root });
const modules = generateModuleManifest({ root });

assert.deepEqual(api, readJSON(path.join(root, 'docs/generated/component-api.json')), 'generated component API must match the frozen public API snapshot');
assert.deepEqual(migration, readJSON(path.join(root, 'dist/qxframe9a7c2-migration.json')), 'generated migration metadata must match the archival migration snapshot');
assert.deepEqual(modules, readJSON(path.join(root, 'dist/qxframe9a7c2-module-manifest.json')), 'generated module manifest must match the archival module snapshot');

const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-release-metadata-'));
try {
    writeReleaseMetadata({ root, distDir:temp });
    for (const file of ['qxframe9a7c2-api.json','qxframe9a7c2-module-manifest.json','qxframe9a7c2-migration.json']) assert.ok(fs.existsSync(path.join(temp, file)), 'missing generated release metadata: ' + file);
} finally { fs.rmSync(temp, { recursive:true, force:true }); }

console.log(JSON.stringify({ ok:true, componentApiParity:true, migrationParity:true, moduleManifestParity:true, components:api.components.length, modules:modules.modules.length, migrationEntries:migration.entries.length, oldDistInputRequired:false }));
