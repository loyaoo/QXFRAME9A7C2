import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const preset=read('src/styles/preset/_foundation.scss');
const themeDefault=read('src/styles/theme/_default.scss');
const themeFamily=read('src/styles/theme/_family.scss');
const components=read('src/styles/components/_components.scss');
const manifest=JSON.parse(read('tools/manifests/css-font-size-normalization-decisions.json'));
const all=[preset,themeDefault,themeFamily,components].join('\n');
const byId=id=>manifest.decisions.find(item=>item.id===id);

assert.equal(manifest.policy.automaticNormalization,false);
for(const id of ['font-9-badge-xs-count','font-15-control-lg','font-17-unused']){
  assert.equal(byId(id)?.approved,true,'Implemented decision must be approved: '+id);
  assert.equal(byId(id)?.status,'implemented','Implemented decision must be recorded: '+id);
}
for(const id of ['font-11-small-labels','font-13-global-sm','font-13-control-sm']){
  assert.equal(byId(id)?.approved,false,'Unresolved decision must remain unapproved: '+id);
  assert.equal(byId(id)?.finalTarget,null,'Unresolved decision must not have a final target: '+id);
}
for(const px of [9,15,17]) assert.doesNotMatch(preset,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:'),'Retired odd preset must be absent: '+px);
for(const px of [11,13]) assert.match(preset,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:\\s*[0-9.]+rem\\s*;'),'Unresolved odd preset must remain explicit: '+px);
assert.doesNotMatch(themeDefault,/--qxframe9a7c2-theme-font-size-9\s*:/);
assert.match(themeDefault,/--qxframe9a7c2-theme-font-size-10:\s*var\(--qxframe9a7c2-font-size-10\)/);
assert.match(components,/--qxframe9a7c2-badge-xs-count-font-size:var\(--qxframe9a7c2-theme-font-size-10\)/);
assert.match(themeFamily,/\.is-lg\s*\{[\s\S]*?--_qxframe9a7c2-size-control-font-size:\s*var\(--qxframe9a7c2-font-size-16\)/);
for(const px of [9,15,17]){
  const refs=(all.match(new RegExp('var\\(\\s*--qxframe9a7c2-font-size-'+px+'\\s*\\)','g'))||[]).length;
  assert.equal(refs,0,'Retired odd preset must have zero references: '+px);
}
console.log(JSON.stringify({ok:true,implemented:['9->10 Badge XS count','15->16 LG Control','17 removed'],remainingOddFontPresets:[11,13]}));
