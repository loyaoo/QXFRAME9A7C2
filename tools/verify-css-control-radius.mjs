import fs from 'node:fs';
import { readEffectiveControlRecipes } from './css-control-recipe-source.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
const family=readEffectiveControlRecipes(root);
const plan=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-control-radius-normalization.json'),'utf8'));
const esc=value=>value.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');

for(const [name,preset] of [['xs','xs'],['sm','sm'],['md','md'],['lg','lg'],['xl','xl']]){
  const themeToken='--qxframe9a7c2-theme-radius-'+name;
  assert.match(theme,new RegExp(esc(themeToken)+'\\s*:\\s*var\\(\\s*--qxframe9a7c2-radius-'+preset+'\\s*\\)'),'Missing Theme radius slot: '+themeToken);
}
assert.doesNotMatch(family,/--_qxframe9a7c2-size-control-radius:\s*(?:3|4|5)px\s*;/,'Control recipe must not retain raw radius pixels.');
for(const item of plan.mappings){
  assert.ok(Math.abs(item.deltaPx)<=1,'Control radius normalization must stay within ±1px: '+item.size);
}
const expected=[
  '--_qxframe9a7c2-size-control-radius: var(--qxframe9a7c2-theme-radius-sm);',
  '--_qxframe9a7c2-size-control-radius: var(--qxframe9a7c2-theme-radius-xs);',
  '--_qxframe9a7c2-size-control-radius: var(--qxframe9a7c2-theme-radius-sm);',
  '--_qxframe9a7c2-size-control-radius: var(--qxframe9a7c2-theme-radius-sm);',
  '--_qxframe9a7c2-size-control-radius: var(--qxframe9a7c2-theme-radius-md);'
];
let cursor=0;
for(const declaration of expected){
  const index=family.indexOf(declaration,cursor);
  assert.ok(index>=cursor,'Missing ordered control-radius declaration: '+declaration);
  cursor=index+declaration.length;
}
assert.deepEqual(plan.mappings.map(x=>x.afterPx),[2,4,4,4,6]);
console.log(JSON.stringify({ok:true,mappings:plan.mappings}));
