import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { QXFRAME9A7C2 } from '../src/index.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const api=JSON.parse(fs.readFileSync(path.join(root,'docs/generated/component-api.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/public-module-manifest-baseline.json'),'utf8'));
const expectedComponents=(api.components||[]).map(record=>record.name).sort();
const sourceComponents=Object.keys(QXFRAME9A7C2.Components).sort();
assert.deepEqual(sourceComponents,expectedComponents,'Static Components namespace drifted from generated public component inventory.');
const normalizeManifest=list=>list.map(record=>({name:record.name,modules:(record.modules||[]).slice(),capabilities:record.capabilities||{}}));
assert.deepEqual(JSON.parse(JSON.stringify(normalizeManifest(QXFRAME9A7C2.ModuleManifest.list()))),JSON.parse(JSON.stringify(normalizeManifest(baseline.modules||[]))),'Static ModuleManifest drifted from frozen public metadata baseline.');
for(const key of ['CoreRegistry','HeadlessRegistry','DOMHeadlessRegistry','ComponentRegistry','BuildingBlockRegistry','defineModule','load','use']) assert.ok(!(key in QXFRAME9A7C2),`Legacy runtime key still exists: ${key}`);

const probe=spawnSync(process.execPath,['--input-type=module','-e',`delete globalThis.QXFRAME9A7C2; await import(${JSON.stringify(pathToFileURL(path.join(root,'src/index.js')).href)}); if ('QXFRAME9A7C2' in globalThis) throw new Error('source entry leaked global'); console.log('ok');`],{encoding:'utf8'});
assert.equal(probe.status,0,`src/index.js must be global-side-effect free:\n${probe.stderr}`);
const child=spawnSync(process.execPath,['--input-type=module','-e',`import ${JSON.stringify(pathToFileURL(path.join(root,'src/index.umd.js')).href)}; const q=globalThis.QXFRAME9A7C2; if(!q) throw new Error('global missing'); const forbidden=['CoreRegistry','HeadlessRegistry','DOMHeadlessRegistry','ComponentRegistry','BuildingBlockRegistry','defineModule','load','use']; for(const k of forbidden) if(k in q) throw new Error('legacy key '+k); console.log(JSON.stringify({components:Object.keys(q.Components).length,modules:q.ModuleManifest.list().length}));`],{encoding:'utf8'});
assert.equal(child.status,0,`src/index.umd.js global entry failed:\n${child.stderr}`);
const childResult=JSON.parse(child.stdout.trim().split(/\r?\n/).pop());
assert.equal(childResult.components,40);assert.equal(childResult.modules,72);
console.log(JSON.stringify({ok:true,componentParity:'40/40',moduleManifestParity:'72/72',sourceGlobalSideEffectFree:true,umdSourceGlobal:true,legacyGlobalKeys:0}));
