import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persistedPath=path.join(root,'tools/manifests/css-token-phase-b-inventory.json');
assert.ok(fs.existsSync(persistedPath),'Phase B inventory manifest is missing.');

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'qx-phase-b-'));
const tempPath=path.join(tempDir,'current.json');
try{
  cp.execFileSync(process.execPath,[path.join(root,'tools/audit-css-token-phase-b.mjs'),'--write='+tempPath],{cwd:root,stdio:'pipe'});
  const current=JSON.parse(fs.readFileSync(tempPath,'utf8'));
  const persisted=JSON.parse(fs.readFileSync(persistedPath,'utf8'));
  delete current.generatedAt;
  delete persisted.generatedAt;
  assert.deepEqual(current,persisted,'Persisted Phase B consumer inventory is stale. Regenerate it before changing token/layout migration decisions.');
  console.log(JSON.stringify({ok:true,summary:current.summary,stable:true}));
} finally {
  fs.rmSync(tempDir,{recursive:true,force:true});
}
