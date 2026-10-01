import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/theme/_family.scss'),'utf8');
const m=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-theme-control-size-tree.json'),'utf8'));
for(const item of m.mappings){assert.doesNotMatch(css,new RegExp(item.from.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&')),'Retired exact literal remains: '+item.from);assert.ok(css.includes(item.to),'Expected Size Tree mapping missing: '+item.to);}
assert.match(css,/\.is-sm[\s\S]*--_qxframe9a7c2-size-control-icon-size:\s*\.8125rem;/,'13px SM icon size must remain explicit.');
assert.match(css,/\.is-sm[\s\S]*--_qxframe9a7c2-size-control-padding-block:\s*\.3125rem;/,'5px SM block padding must remain explicit.');
assert.match(css,/\.is-lg[\s\S]*--_qxframe9a7c2-size-control-padding-block:\s*\.4375rem;/,'7px LG block padding must remain explicit.');
console.log(JSON.stringify({ok:true,mappings:m.mappings.length,preserved:m.preserved}));
