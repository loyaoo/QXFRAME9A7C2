import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/preset/_foundation.scss'),'utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-size-tree-foundation.json'),'utf8'));
const esc=value=>value.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');

assert.equal(manifest.nodeCount,46);
assert.equal(manifest.nodes.length,46);
for(const node of manifest.nodes){
  assert.match(node.name,/^size-\d+$/);
  const token='--qxframe9a7c2-'+node.name;
  assert.match(css,new RegExp(esc(token)+'\\s*:\\s*'+esc(String(node.rem))+'rem\\s*;'),'Size Tree node must keep its rem default: '+token);
}
for(const group of ['spacing','evenFontSize','radius']){
  for(const item of manifest.mappings[group]) assert.match(css,new RegExp(esc(item.token)+'\\s*:\\s*var\\(\\s*'+esc(item.node)+'\\s*\\)'),'Preset token must resolve through Size Tree: '+item.token);
}
for(const px of manifest.preserved.oddFontSizePx){
  assert.match(css,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:\\s*[0-9.]+rem\\s*;'),'Unresolved odd font size must remain explicit: '+px+'px');
  assert.doesNotMatch(css,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:\\s*var\\(\\s*--qxframe9a7c2-size-'),'Unresolved odd font size must not be mechanically normalized: '+px+'px');
}
for(const px of [9,15,17]) assert.doesNotMatch(css,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:'),'Completed odd preset must not remain: '+px+'px');
assert.match(css,/--qxframe9a7c2-radius-pill:\s*100rem\s*;/);
assert.match(css,/--qxframe9a7c2-radius-circle:\s*50%\s*;/);
assert.doesNotMatch(css,/--qxframe9a7c2-motion-(?:duration|easing)[^:]*:\s*var\(\s*--qxframe9a7c2-size-/);
assert.equal((css.match(/--qxframe9a7c2-size-\d+\s*:/g)||[]).length,46,'Size Tree must have exactly 46 definitions.');
console.log(JSON.stringify({ok:true,nodes:46,remainingOddFontSizes:manifest.preserved.oddFontSizePx,completedOddFontDecisions:manifest.completedOddFontDecisions.length}));
