import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import {RADII,STYLE_GEOMETRY,normalizeGeometryConfig} from '../docs/assets/theme-generator/geometry-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=verifyGeometryRuleSource(root);
assert.equal(contract.evenLengths,true);
assert.deepEqual(RADII,['none','xs','sm','md','lg','xl']);

for(const [style,profile] of Object.entries(STYLE_GEOMETRY)){
  assert.ok(RADII.includes(profile.radius),'Style radius default must use the finite radius profile: '+style);
  const {geometry}=normalizeGeometryConfig({style});
  const radii=['radius-control-md','radius-action-md','radius-choice-md','radius-surface-md','radius-popup-md'].map(role=>geometry[role]);
  assert.equal(new Set(radii).size,1,'One selected radius profile must feed the shared md radius roles: '+style);
  const px=Number(radii[0].slice(0,-3))*16;
  assert.ok(px===0||Number.isInteger(px/2),'Radius must obey even reference lengths: '+style+'/'+radii[0]);
}

console.log(JSON.stringify({ok:true,radiusProfiles:RADII,styles:Object.keys(STYLE_GEOMETRY).length,authority:'theme-v2-md-radius+shape-policy'}));
