import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {verifyGeometryRuleSource,GEOMETRY_TOKENS} from './theme-v2-geometry-contract.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const contract=await verifyGeometryRuleSource(root);
import {pathToFileURL as toUrl} from 'node:url';
assert.equal(contract.evenLengths,true);
assert.equal(contract.legacyFiveSizeOverrides,false);
const model=await import(toUrl(path.join(root,'docs/create/model.js')).href);
for(const density of ['dense','compact','standard','loose','touch']){
  const body=model.compileTheme(model.normalizeConfig({style:'vega',ext:{density}})).body;
  for(const role of ['control-height','control-font-size','control-line-height','control-padding','control-gap','control-icon']){
    const value=(body.match(new RegExp('--qxframe9a7c2-theme-'+role+': ([0-9.]+)rem;'))||[])[1];
    assert.ok(value!==undefined,'missing '+role);
    assert.ok(Number.isInteger(Number(value)*16/2),'Control md geometry must resolve to an even reference length: '+density+'/'+role+'/'+value);
  }
}
console.log(JSON.stringify({ok:true,geometryAuthority:contract.rules,evenControlInputs:true,fiveSizeThemeTable:false}));
