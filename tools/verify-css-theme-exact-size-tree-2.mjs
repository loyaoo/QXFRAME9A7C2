import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('tools/manifests/css-theme-exact-size-tree-2.json'));
const files=new Map([
 ['src/styles/theme/_default.scss',read('src/styles/theme/_default.scss')],
 ['src/styles/theme/_family.scss',read('src/styles/theme/_family.scss')]
]);
for(const item of manifest.mappings){
  const css=files.get(item.file);
  assert.ok(css.includes(item.to),'Expected Size Tree mapping missing: '+item.to);
  assert.equal(css.includes(item.from),false,'Retired exact literal remains: '+item.from);
}
const family=files.get('src/styles/theme/_family.scss');
const theme=files.get('src/styles/theme/_default.scss');
assert.match(theme,/--qxframe9a7c2-focus-ring:\s*0 0 0 0\.1875rem/,'3px focus ring remains explicit.');
assert.equal(manifest.supersededPreservation.length,3,'Odd control preservation must be delegated to css-control-recipe-even.');
console.log(JSON.stringify({ok:true,mappings:manifest.mappings.length,preserved:manifest.preserved}));
