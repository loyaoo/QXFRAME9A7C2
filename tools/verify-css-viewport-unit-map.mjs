import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateViewportUnitMap } from './audit-css-viewport-unit-map.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const persisted=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-viewport-unit-conversion-map.json'),'utf8'));
const current=generateViewportUnitMap({rootDir:root});
assert.deepEqual(persisted.summary,current.summary,'Viewport-unit classification summary is stale.');
assert.deepEqual(persisted.consumers,current.consumers,'Viewport-unit consumer map is stale.');
assert.equal(current.summary.total,0,'Viewport closeout requires zero vw/vh/vmin/vmax occurrences in canonical framework CSS.');
assert.equal(current.policy.automaticReplacementApproved,false);
assert.deepEqual(current.consumers,[],'Viewport closeout must not retain classified consumers.');
console.log(JSON.stringify({ok:true,...current.summary}));
