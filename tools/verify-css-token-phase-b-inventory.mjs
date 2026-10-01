import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persistedPath=path.join(root,'tools/manifests/css-token-phase-b-inventory.json');
assert.ok(fs.existsSync(persistedPath),'Phase B baseline inventory manifest is missing.');
const persisted=JSON.parse(fs.readFileSync(persistedPath,'utf8'));

assert.equal(persisted.schemaVersion,1);
assert.equal(persisted.source.entry,'src/styles/qxframe9a7c2.scss');
assert.deepEqual(
  persisted.summary,
  {oddPx:45,decimalPx:14,forbiddenViewportUnits:54,frUnits:21,cssGridMatches:436,jsGeometryCouplingSites:154},
  'Frozen Phase B baseline counts changed unexpectedly.'
);
assert.equal(persisted.policy.inventoryOnly,true);
assert.equal(persisted.policy.automaticReplacement,false);

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'qx-phase-b-current-'));
const tempPath=path.join(tempDir,'current.json');
try{
  cp.execFileSync(process.execPath,[path.join(root,'tools/audit-css-token-phase-b.mjs'),'--write='+tempPath],{cwd:root,stdio:'pipe'});
  const current=JSON.parse(fs.readFileSync(tempPath,'utf8'));
  assert.equal(current.schemaVersion,1,'Current Phase B audit generator must remain readable after migration.');
  console.log(JSON.stringify({ok:true,baselineFrozen:true,baselineSummary:persisted.summary,currentSummary:current.summary}));
}finally{
  fs.rmSync(tempDir,{recursive:true,force:true});
}
