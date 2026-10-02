import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalComponentStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
const css=readCanonicalComponentStyleSource({root});
const plan=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-drop-indicator-geometry.json'),'utf8'));

assert.match(theme,/--qxframe9a7c2-theme-drop-indicator-size:\s*var\(--qxframe9a7c2-size-1\)/);
for(const item of plan.components){
  const pub=item.publicToken.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const priv=item.privateToken.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  assert.match(css,new RegExp(priv+'\\s*:\\s*var\\(\\s*'+pub+',\\s*var\\(\\s*--qxframe9a7c2-theme-drop-indicator-size\\s*\\)\\s*\\)'));
}
const dragLines=css.split(/\r?\n/).filter(line=>line.includes('sort-item.is-drag')||line.includes('upload-item.is-drag'));
assert.equal(dragLines.some(line=>/(?:^|[^0-9])3px\b|:-3px\b/.test(line)),false,'Drag indicators must not retain 3/-3px literals.');
assert.match(css,/height:var\(--_qxframe9a7c2-sort-drop-indicator-size\)/);
assert.match(css,/width:var\(--_qxframe9a7c2-sort-drop-indicator-size\)/);
assert.match(css,/calc\(var\(--_qxframe9a7c2-sort-drop-indicator-size\) \* -1\)/);
assert.match(css,/height:var\(--_qxframe9a7c2-upload-drop-indicator-size\)/);
assert.match(css,/calc\(var\(--_qxframe9a7c2-upload-drop-indicator-size\) \* -1\)/);
console.log(JSON.stringify({ok:true,themeToken:plan.themeToken,beforePx:plan.beforePx,afterPx:plan.afterPx,components:plan.components.map(x=>x.component)}));
