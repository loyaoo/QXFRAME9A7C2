import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
const css=fs.readFileSync(path.join(root,'src/styles/components/_components.scss'),'utf8');
const plan=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-overlay-arrow-geometry.json'),'utf8'));

assert.match(theme,/--qxframe9a7c2-theme-overlay-arrow-size:\s*var\(--qxframe9a7c2-size-5\)/);
const arrowLines=css.split(/\r?\n/).filter(line=>line.includes('popover-arrow')||line.includes('dropdown-arrow'));
assert.equal(arrowLines.some(line=>/\b10px\b|:-5px\b/.test(line)),false,'Overlay arrows must not retain 10px/-5px literals.');
assert.match(css,/--_qxframe9a7c2-popover-arrow-half:calc\(var\(--_qxframe9a7c2-popover-arrow-size\) \* -\.5\)/);
assert.match(css,/--_qxframe9a7c2-dropdown-arrow-half:calc\(var\(--_qxframe9a7c2-dropdown-arrow-size\) \* -\.5\)/);
assert.match(css,/\.qxframe9a7c2-popover-arrow\{width:var\(--_qxframe9a7c2-popover-arrow-size\);height:var\(--_qxframe9a7c2-popover-arrow-size\)/);
assert.match(css,/\.qxframe9a7c2-dropdown-arrow\{position:absolute;width:var\(--_qxframe9a7c2-dropdown-arrow-size\);height:var\(--_qxframe9a7c2-dropdown-arrow-size\)/);
for(const line of css.split(/\r?\n/).filter(line=>line.includes('dropdown-panel[data-placement'))){
  if(line.includes('dropdown-arrow')) assert.match(line,/(?:top|bottom|left|right):-6px/,'Dropdown placement depth must remain -6px.');
}
console.log(JSON.stringify({ok:true,sizePx:plan.sizePx,components:plan.components.map(x=>x.component),dropdownPlacementDepthPx:plan.preserved.dropdownPlacementDepthPx}));
