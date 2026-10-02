import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateTheme} from '../docs/assets/theme-generator/generator.mjs';
import {importConfigJson,exportArtifacts,safeName} from '../docs/assets/theme-generator/io.mjs';

const manifest=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-public-schema-v1.json',import.meta.url),'utf8'));
const recipes=JSON.parse(fs.readFileSync(new URL('../docs/generated/theme-color-recipes-v1.json',import.meta.url),'utf8'));

const imported=importConfigJson(JSON.stringify({
  schema:1,name:'Acme Theme',style:'luma',baseColor:'zinc',roles:{primary:'#7c3aed'},chart:{color:'purple'},
  typography:{body:'inter',heading:'humanist',mono:'system-mono',baseSize:16},radius:'small',
  components:{menu:{color:'primary',appearance:'soft',accent:'balanced'}},advanced:{overrides:{}}
}));
assert.equal(imported.name,'Acme Theme');assert.equal(imported.style,'luma');assert.equal(imported.radius,'small');assert.equal(imported.chart.color,'purple');
assert.equal(Object.prototype.hasOwnProperty.call(imported,'density'),false);

const theme=generateTheme(manifest,recipes,imported),artifacts=exportArtifacts(theme);
assert.equal(artifacts.css.filename,'qxframe-theme-acme-theme.css');
assert.equal(artifacts.config.filename,'qxframe-theme-acme-theme.json');
assert.match(artifacts.css.content,/Theme Schema: 1/);
assert.equal(generateTheme(manifest,recipes,importConfigJson(artifacts.config.content)).css,theme.css);
assert.ok(!artifacts.css.content.includes('color(srgb'));

const previousStudio=importConfigJson(JSON.stringify({
  schema:1,name:'Previous Studio',style:'soft',baseColor:'neutral',roles:{primary:'blue',success:'green',warning:'orange',error:'red',info:'cyan'},
  chart:{preset:'cool'},typography:{body:'system-ui',heading:'inherit',mono:'ui-monospace',baseSize:14},radius:'large',density:'comfortable',
  components:{menu:{color:'default',appearance:'solid',accent:'subtle'}},palette:{},advanced:{overrides:{}}
}));
assert.equal(previousStudio.style,'luma');
assert.equal(previousStudio.chart.color,'blue');
assert.equal(previousStudio.radius,'large');
assert.equal(Object.prototype.hasOwnProperty.call(previousStudio,'density'),false);

const legacy=importConfigJson(JSON.stringify({preset:'violet',base:'gray',font:'inter',radius:10,mode:'dark'}));
assert.equal(legacy.schema,1);assert.equal(legacy.style,'nova');assert.equal(legacy.roles.primary,'#7c3aed');assert.equal(legacy.baseColor,'zinc');assert.equal(legacy.radius,'medium');assert.equal(legacy.chart.color,'primary');
assert.equal(safeName(' Hello / Theme '),'hello-theme');
assert.throws(()=>importConfigJson('not json'),/invalid/);assert.throws(()=>importConfigJson('{"unknown":true}'),/missing schema/);assert.throws(()=>importConfigJson('{"schema":2}'),/Unsupported Theme Config schema/);

console.log(JSON.stringify({phase:'TG-F-import-export',configSourceOfTruth:true,previousStudioMigration:true,legacyPlaygroundMigration:true,deterministicCss:true,deterministicFilenames:true}));
