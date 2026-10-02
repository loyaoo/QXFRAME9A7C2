import fs from 'node:fs';
import { readEffectiveControlRecipes } from './css-control-recipe-source.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readEffectiveControlRecipes(root);
const m=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-control-recipe-even.json'),'utf8'));
for(const item of m.mappings){
  assert.equal(css.includes(item.from),false,'Retired odd control literal remains: '+item.from);
  assert.ok(css.includes(item.to),'Expected even Size Tree control mapping missing: '+item.to);
  assert.ok(Math.abs(item.deltaPx)<=1,'Control normalization delta must be <=1px.');
}
const heightNodes={xs:12,sm:14,md:16,lg:18,xl:20};
for(const [size,node] of Object.entries(heightNodes)){
  const marker=size==='md'?':root,.is-md':'.is-'+size;
  const start=css.indexOf(marker);
  assert.ok(start>=0,'Missing control size block: '+size);
  const slice=css.slice(start,start+900);
  assert.ok(slice.includes('--_qxframe9a7c2-size-control-height: var(--qxframe9a7c2-size-'+node+');'),'Control height changed for '+size);
}
console.log(JSON.stringify({ok:true,mappings:m.mappings,fixedControlHeightsPx:m.fixedControlHeightsPx}));
