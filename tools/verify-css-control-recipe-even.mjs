import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource} from './theme-v2-geometry-contract.mjs';
import {DENSITIES,normalizeGeometryConfig} from '../docs/assets/theme-generator/geometry-engine-v2.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=verifyGeometryRuleSource(root);
assert.equal(contract.evenLengths,true);
assert.equal(contract.legacyFiveSizeOverrides,false);

for(const density of DENSITIES){
  const {geometry}=normalizeGeometryConfig({style:'vega',options:{density}});
  for(const role of ['control-min-block-md','control-font-size-md','control-line-box-md','control-padding-inline-md','control-gap-md','control-icon-md']){
    const px=Number(geometry[role].slice(0,-3))*16;
    assert.ok(Number.isInteger(px/2),'Control md geometry must resolve to an even reference length: '+density+'/'+role+'/'+geometry[role]);
  }
}

console.log(JSON.stringify({ok:true,densities:DENSITIES,geometryAuthority:'qx-md-2',evenControlInputs:true,fiveSizeThemeTable:false}));
