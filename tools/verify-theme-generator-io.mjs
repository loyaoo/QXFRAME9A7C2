import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {importConfigJson,exportArtifacts,safeName} from '../docs/assets/theme-generator/io.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

const imported=importConfigJson(JSON.stringify({
  schema:1,
  name:'Acme Theme',
  style:'soft',
  baseColor:'zinc',
  roles:{primary:'#7c3aed'},
  chart:{preset:'warm'},
  typography:{body:'inter',heading:'humanist',mono:'system-mono',baseSize:16},
  radius:'small',
  density:'compact',
  components:{menu:{color:'primary',appearance:'soft',accent:'balanced'}}
}));
assert.equal(imported.name,'Acme Theme');
assert.equal(imported.style,'soft');
assert.equal(imported.radius,'small');
assert.equal(imported.density,'compact');

const theme=generateTheme(manifest,recipes,imported);
const artifacts=exportArtifacts(theme);
assert.equal(artifacts.css.filename,'qxframe-theme-acme-theme.css');
assert.equal(artifacts.config.filename,'qxframe-theme-acme-theme.json');
assert.match(artifacts.css.content,/Theme Schema: 1/);
assert.match(artifacts.config.content,/"schema": 1/);
assert.equal(generateTheme(manifest,recipes,importConfigJson(artifacts.config.content)).css,theme.css,'config JSON must reproduce the exact CSS');
assert.ok(!artifacts.css.content.includes('Generated:'),'deterministic CSS must not contain wall-clock timestamps');

const legacy=importConfigJson(JSON.stringify({
  preset:'violet',
  base:'gray',
  font:'inter',
  radius:10,
  mode:'dark'
}));
assert.equal(legacy.schema,1);
assert.equal(legacy.roles.primary,'#7c3aed');
assert.equal(legacy.baseColor,'zinc');
assert.equal(legacy.typography.body,'inter');
assert.equal(legacy.radius,'large');
assert.equal(legacy.density,'default');

assert.equal(safeName(' Hello / Theme '),'hello-theme');
assert.throws(()=>importConfigJson('not json'),/invalid/);
assert.throws(()=>importConfigJson('{"unknown":true}'),/missing schema/);
assert.throws(()=>importConfigJson('{"schema":2}'),/Unsupported Theme Config schema/);

console.log(JSON.stringify({
  phase:'TG-F-import-export',
  configSourceOfTruth:true,
  legacyPlaygroundMigration:true,
  deterministicCss:true,
  deterministicFilenames:true
}));
