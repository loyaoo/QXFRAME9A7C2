import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {SHAPE_POLICIES,SHAPE_FAMILIES,normalizeStyleConfig} from '../docs/assets/theme-generator/style-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');

assert.deepEqual(SHAPE_POLICIES,['follow','intrinsic','square']);
assert.deepEqual(SHAPE_FAMILIES,['choice','toggle','range','compact','identity']);
assert.doesNotMatch(source,/\b999px\b/,'Numeric pill sentinels must not return.');

let semanticPillOutputs=0;
for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
  const resolved=normalizeStyleConfig({style});
  for(const role of ['shape-toggle-track-radius','shape-toggle-thumb-radius','shape-range-track-radius','shape-range-thumb-radius','shape-compact-radius','shape-identity-radius','shape-progress-radius']){
    const value=resolved.style[role];
    assert.ok(value!=null,'Shape policy must resolve '+style+'/'+role);
    assert.doesNotMatch(String(value),/999px/,'Shape policy must not use numeric magic pill sentinels.');
    if(value==='100rem'||value==='50%')semanticPillOutputs++;
  }
  const intrinsic=normalizeStyleConfig({style,appearance:{shape:{choice:'intrinsic',toggle:'intrinsic',range:'intrinsic',compact:'intrinsic',identity:'intrinsic'}}});
  assert.equal(intrinsic.style['shape-choice-radio-radius'],'50%');
  assert.equal(intrinsic.style['shape-compact-radius'],'100rem');
  assert.equal(intrinsic.style['shape-identity-radius'],'50%');
  assert.equal(intrinsic.style['shape-progress-radius'],'100rem');
  semanticPillOutputs+=4;
}
assert.ok(semanticPillOutputs>0,'Intrinsic Shape Policy must resolve semantic circle/pill outputs.');

console.log(JSON.stringify({ok:true,shapePolicies:SHAPE_POLICIES,shapeFamilies:SHAPE_FAMILIES,semanticPillOutputs,numericPillSentinels:0}));
