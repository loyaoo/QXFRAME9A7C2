import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import {GEOMETRY_RULE_VERSION,GEOMETRY_ROLES,normalizeGeometryConfig} from '../docs/assets/theme-generator/geometry-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=verifyGeometryRuleSource(root);
assert.equal(GEOMETRY_RULE_VERSION,'qx-md-2');
assert.equal(contract.inputNames,GEOMETRY_ROLES.length);

for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
  const resolved=normalizeGeometryConfig({style,textStyle:style==='sera'?'editorial':'standard'});
  assert.equal(Object.keys(resolved.geometry).length,GEOMETRY_ROLES.length,'Every Style must resolve the same md geometry roles: '+style);
}

console.log(JSON.stringify({ok:true,geometryAuthority:GEOMETRY_RULE_VERSION,mdInputs:GEOMETRY_ROLES.length,fiveSizeThemeTable:false,fiveSizeOutputsDerived:true}));
