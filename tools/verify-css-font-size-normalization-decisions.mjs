import fs from 'node:fs';
import { readEffectiveControlRecipes } from './css-control-recipe-source.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalComponentStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const preset=read('src/styles/preset/_foundation.scss');
const themeDefault=read('src/styles/theme/_default.scss');
const themeFamily=readEffectiveControlRecipes(root);
const components=readCanonicalComponentStyleSource({root});
const manifest=JSON.parse(read('tools/manifests/css-font-size-normalization-decisions.json'));
const all=[preset,themeDefault,themeFamily,components].join('\n');
const byId=id=>manifest.decisions.find(item=>item.id===id);

assert.equal(manifest.policy.automaticNormalization,false);
for(const id of ['font-9-badge-xs-count','font-11-small-labels','font-13-global-sm','font-13-control-sm','font-15-control-lg','font-17-unused']){
  assert.equal(byId(id)?.approved,true,'Completed odd-font decision must be approved: '+id);
  assert.equal(byId(id)?.status,'implemented','Completed odd-font decision must be recorded: '+id);
}
for(const px of [9,11,13,15,17]) assert.doesNotMatch(preset,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:'),'No odd numeric font preset may remain: '+px);
assert.doesNotMatch(themeDefault,/--qxframe9a7c2-theme-font-size-(?:9|11)\s*:/);
assert.match(themeDefault,/--qxframe9a7c2-theme-font-size-xs:\s*var\(--qxframe9a7c2-font-size-xs\)/);
assert.match(themeDefault,/--qxframe9a7c2-theme-font-size-sm:\s*var\(--qxframe9a7c2-font-size-sm\)/);
assert.match(preset,/--qxframe9a7c2-font-size-sm:\s*var\(--qxframe9a7c2-font-size-14\)/);
assert.match(components,/var\(--qxframe9a7c2-badge-sm-font-size,var\(--qxframe9a7c2-theme-font-size-xs\)\)/);
assert.match(components,/\.qxframe9a7c2-descriptions\.is-xs\{[^}]*--_qxframe9a7c2-descriptions-size-label-font-size:var\(--qxframe9a7c2-theme-font-size-xs\)/);
assert.match(themeFamily,/\.is-sm\s*\{[\s\S]*?--_qxframe9a7c2-size-control-font-size:\s*var\(--qxframe9a7c2-font-size-12\)/);
for(const px of [9,11,13,15,17]){
  const refs=(all.match(new RegExp('var\\(\\s*--qxframe9a7c2-font-size-'+px+'\\s*\\)','g'))||[]).length;
  assert.equal(refs,0,'Retired odd font preset must have zero references: '+px);
}
console.log(JSON.stringify({ok:true,oddNumericFontPresetsRemaining:0,implementedDecisions:manifest.decisions.length}));
