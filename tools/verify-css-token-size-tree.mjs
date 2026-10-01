import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateSizeTreeAudit, sizeTreeNodes } from './audit-css-token-size-tree.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persisted=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-token-size-tree-candidates.json'),'utf8'));
const current=generateSizeTreeAudit({rootDir:root});

assert.equal(sizeTreeNodes().length,46,'Size Tree v1 must contain exactly 46 nodes.');
assert.deepEqual(persisted.sizeTree,current.sizeTree,'Persisted Size Tree nodes are stale.');
assert.deepEqual(persisted.summary,current.summary,'Persisted Size Tree candidate summary is stale.');
assert.deepEqual(persisted.consumers,current.consumers,'Persisted Size Tree consumer table is stale.');
assert.equal(persisted.policy.automaticOddRounding,false);
assert.ok(persisted.consumers.every(x=>x.approved===false&&x.finalTarget===null),'Audit branch must not pre-approve migration targets.');
console.log(JSON.stringify({ok:true,nodes:46,...current.summary}));
