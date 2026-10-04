import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {SHAPE_POLICIES,normalizeStyleConfig} from '../docs/assets/theme-generator/style-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/styles/theme/_visual-v2.scss'),'utf8');

assert.deepEqual(SHAPE_POLICIES,['follow','intrinsic','square']);
assert.doesNotMatch(source,/\b999px\b/,'Numeric pill sentinels must not return.');
assert.match(source,/100rem/,'Canonical Theme must retain a semantic pill/intrinsic radius sentinel.');

for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
  const resolved=normalizeStyleConfig({style});
  for(const role of ['shape-toggle-track-radius','shape-toggle-thumb-radius','shape-range-track-radius','shape-range-thumb-radius','shape-compact-radius','shape-identity-radius','shape-progress-radius']){
    assert.ok(resolved.style[role]!=null,'Shape policy must resolve '+style+'/'+role);
  }
}

console.log(JSON.stringify({ok:true,shapePolicies:SHAPE_POLICIES,semanticPill:'100rem',numericPillSentinels:0}));
