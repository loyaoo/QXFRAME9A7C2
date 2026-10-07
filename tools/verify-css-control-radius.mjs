import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {verifyGeometryRuleSource,GEOMETRY_TOKENS} from './theme-v2-geometry-contract.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=await verifyGeometryRuleSource(root);
assert.equal(contract.evenLengths,true);
// Every style's compiled radius roles resolve to even reference lengths (or 0 / pill).
const model=await import(pathToFileURL(path.join(root,'docs/create/model.js')).href);
const STYLES=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
for(const style of STYLES){
  const body=model.compileTheme(model.normalizeConfig({style})).body;
  for(const m of body.matchAll(/--qxframe9a7c2-theme-radius[a-z-]*: ([0-9.]+)rem;/g)){
    const px=Number(m[1])*16;
    // shadcn measured checkbox radii (Luma/Rhea rounded-[5px]) are source values and keep their exact px (v3 §4.2).
    if(/radius-choice:/.test(m[0])&&px===5)continue;
    assert.ok(px===0||Number.isInteger(px/2)||px===1000,'Radius must obey even reference lengths: '+style+'/'+m[0]);
  }
}
console.log(JSON.stringify({ok:true,styles:STYLES.length,authority:'createapp-v3-radius-allocation'}));
