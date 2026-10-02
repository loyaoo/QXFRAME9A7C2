import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateSizeTreeAudit, sizeTreeNodes } from './audit-css-token-size-tree.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persisted=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-token-size-tree-candidates.json'),'utf8'));
const current=generateSizeTreeAudit({rootDir:root});
const stableConsumerSemantics=items=>items.map(({line,text,...rest})=>rest);

assert.equal(sizeTreeNodes().length,46,'Size Tree v1 must contain exactly 46 nodes.');
assert.deepEqual(persisted.sizeTree,current.sizeTree,'Persisted Size Tree nodes are stale.');
assert.deepEqual(persisted.summary,current.summary,'Persisted Size Tree candidate summary changed; regenerate before changing size migration decisions.');
assert.deepEqual(stableConsumerSemantics(persisted.consumers),stableConsumerSemantics(current.consumers),'Persisted Size Tree dimensional semantics changed; diagnostic line/text drift is ignored.');
assert.equal(persisted.policy.automaticOddRounding,false);
assert.ok(persisted.consumers.every(x=>x.approved===false&&x.finalTarget===null),'Audit branch must not pre-approve migration targets.');
assert.equal(current.summary.exactNodeCandidates,0,'Size Tree closeout must not retain exact-node actionable consumers.');
assert.equal(current.summary.needsReview,0,'Size Tree closeout must not retain ordinary needs-review consumers.');
assert.ok(current.consumers.every(x=>x.domain==='breakpoint-boundary'||x.domain==='pill-radius-sentinel'),'Only true responsive breakpoints and the approved pill sentinel may remain after Size Tree closeout.');
console.log(JSON.stringify({ok:true,nodes:46,lineDriftIgnored:true,...current.summary}));
