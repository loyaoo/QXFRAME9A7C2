import fs from 'node:fs';
import { readEffectiveControlRecipes } from './css-control-recipe-source.mjs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readEffectiveControlRecipes(root);
const m=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-theme-control-size-tree.json'),'utf8'));
for(const item of m.mappings){assert.doesNotMatch(css,new RegExp(item.from.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')),'Retired exact literal remains: '+item.from);assert.ok(css.includes(item.to),'Expected Size Tree mapping missing: '+item.to);}
assert.match(css,/--_qxframe9a7c2-control-border-width:\s*var\(--qxframe9a7c2-family-control-border-width,\s*1px\)/,'1px control border width remains a protected hairline.');
assert.equal(m.supersededPreservation.length,3,'Odd control preservation decisions must be delegated to css-control-recipe-even.');
console.log(JSON.stringify({ok:true,mappings:m.mappings.length,preserved:m.preserved}));
