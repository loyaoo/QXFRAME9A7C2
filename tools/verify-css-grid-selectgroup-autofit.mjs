import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';
import fs from 'node:fs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalComponentStyleSource({root});
const docs=fs.readFileSync(path.join(root,'docs/assets/qxframe9a7c2-component-demo-supplements.js'),'utf8');
assert.match(css,/\.qxframe9a7c2-selectgroup\{display:flex;flex-wrap:wrap/,'SelectGroup uses Flex');
assert.match(css,/\.qxframe9a7c2-selectgroup-item\{position:relative/,'Item is independent of group layout');
for(const mode of ['is-image-grid','is-boxes','is-color-grid','is-pill','is-toolbar','is-filled','is-buttons']){
  assert.doesNotMatch(css,new RegExp('\\.qxframe9a7c2-selectgroup\\.'+mode+'\\b'),'retired scene mode must have no CSS owner: '+mode);
  assert.doesNotMatch(docs,new RegExp('selectgroup '+mode+'\\b'),'retired scene mode must have no docs consumer: '+mode);
}
assert.match(css,/\.qxframe9a7c2-selectgroup\.is-connected\.is-outline/,'connected is a separate shared seam contract');
assert.doesNotMatch(css,/\.qxframe9a7c2-selectgroup\{[^}]*display:grid/);
console.log(JSON.stringify({ok:true,batch:'selectgroup-composable-layout',removedSceneModes:7,connectedShared:true}));
