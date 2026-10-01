import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateGeometryCouplingMap } from './audit-js-geometry-coupling.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persisted=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/js-geometry-coupling-map.json'),'utf8'));
const current=generateGeometryCouplingMap({rootDir:root});
assert.deepEqual(persisted.summary,current.summary,'JS geometry classification summary is stale.');
assert.deepEqual(persisted.sites,current.sites,'JS geometry classification map is stale.');
assert.equal(current.summary.total,154);
assert.equal(current.policy.automaticRefactorApproved,false);
assert.ok(current.sites.every(x=>x.approvedChange===false&&x.finalAction===null),'Audit must not pre-approve JS geometry changes.');
console.log(JSON.stringify({ok:true,...current.summary}));
