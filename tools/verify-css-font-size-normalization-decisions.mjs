import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const preset=read('src/styles/preset/_foundation.scss');
const themeDefault=read('src/styles/theme/_default.scss');
const themeFamily=read('src/styles/theme/_family.scss');
const components=read('src/styles/components/_components.scss');
const manifest=JSON.parse(read('tools/manifests/css-font-size-normalization-decisions.json'));
const all=[preset,themeDefault,themeFamily,components].join('\n');

assert.equal(manifest.policy.automaticNormalization,false);
assert.ok(manifest.decisions.every(item=>item.approved===false&&item.finalTarget===null),'Decision audit must not pre-approve odd-font normalization.');
for(const px of [9,11,13,15,17]) assert.match(preset,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:\\s*[0-9.]+rem\\s*;'),'Odd numeric font token must remain unchanged until approval: '+px);
assert.match(themeDefault,/--qxframe9a7c2-theme-font-size-9:\s*var\(--qxframe9a7c2-font-size-9\)/);
assert.match(themeDefault,/--qxframe9a7c2-theme-font-size-11:\s*var\(--qxframe9a7c2-font-size-11\)/);
assert.match(preset,/--qxframe9a7c2-font-size-sm:\s*var\(--qxframe9a7c2-font-size-13\)/);
assert.match(themeFamily,/\.is-sm\s*\{[\s\S]*?--_qxframe9a7c2-size-control-font-size:\s*var\(--qxframe9a7c2-font-size-13\)/);
assert.match(themeFamily,/\.is-lg\s*\{[\s\S]*?--_qxframe9a7c2-size-control-font-size:\s*var\(--qxframe9a7c2-font-size-15\)/);
const refs17=(all.match(/var\(\s*--qxframe9a7c2-font-size-17\s*\)/g)||[]).length;
assert.equal(refs17,0,'17px numeric font preset must remain unused before retirement approval.');
console.log(JSON.stringify({ok:true,decisions:manifest.decisions.length,approved:0,unused17Refs:refs17}));
