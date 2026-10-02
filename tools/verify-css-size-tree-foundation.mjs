import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalComponentStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/styles/preset/_foundation.scss'),'utf8');
const theme=fs.readFileSync(path.join(root,'src/styles/theme/_default.scss'),'utf8');
const components=readCanonicalComponentStyleSource({root});
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
assert.deepEqual(manifest.preserved.oddFontSizePx,[],'No odd numeric font preset should remain preserved.');
for(const px of [9,11,13,15,17]) assert.doesNotMatch(css,new RegExp('--qxframe9a7c2-font-size-'+px+'\\s*:'),'Completed odd font preset must not remain: '+px+'px');
assert.match(css,/--qxframe9a7c2-radius-pill:\s*100rem\s*;/);
assert.match(css,/--qxframe9a7c2-radius-circle:\s*50%\s*;/);
assert.doesNotMatch(css,/--qxframe9a7c2-motion-(?:duration|easing)[^:]*:\s*var\(\s*--qxframe9a7c2-size-/);
assert.equal((css.match(/--qxframe9a7c2-size-\d+\s*:/g)||[]).length,46,'Size Tree must have exactly 46 definitions.');
const spacingPresetNodes=[1,2,3,4,5,6,7,8,10,12,14,16];
for(let i=1;i<=12;i++){
  assert.ok(theme.includes(`--qxframe9a7c2-theme-space-${i}: var(--qxframe9a7c2-space-${i});`),`Theme spacing token ${i} must bridge Preset spacing into Component CSS.`);
}
const scalableSpacingPx=new Set([2,4,6,8,10,12,14,16,20,24,28,32]);
const rawSpacing=[];
components.replace(/([-\\w]+)\\s*:\\s*([^;{}]+)(;?)/g,(all,prop,value)=>{
  const isSpacing=/^(?:padding(?:-.+)?|margin(?:-.+)?|gap|row-gap|column-gap)$/.test(prop)||/^--[^:]*-(?:padding|gap|margin)(?:-|$)/.test(prop);
  if(!isSpacing)return all;
  for(const match of value.matchAll(/(-?\\d*\\.?\\d+)(rem|px)\\b/g)){
    const numeric=Number(match[1]);
    if(numeric<0)continue;
    const px=match[2]==='rem'?numeric*16:numeric;
    if(scalableSpacingPx.has(px))rawSpacing.push({prop,raw:match[0]});
  }
  return all;
});
assert.deepEqual(rawSpacing,[],'Component spacing that matches the Preset spacing scale must consume Theme spacing tokens.');
const semanticGeometry={
  'icon-size':{xs:6,sm:7,md:8,lg:10,xl:12},
  'avatar-size':{xs:12,sm:15,md:18,lg:24,xl:28},
  'progress-line-size':{xs:2,sm:3,md:4,lg:6,xl:8},
  'progress-circle-size':{xs:28,sm:32,md:37,lg:40,xl:42},
  'switch-height':{xs:8,sm:9,md:10,lg:12,xl:14},
  'switch-width':{xs:14,sm:16,md:18,lg:22,xl:25},
  'switch-padding':{xs:1,sm:1,md:1,lg:1,xl:2}
};
for(const [family,slots] of Object.entries(semanticGeometry)){
  for(const [slot,node] of Object.entries(slots)){
    assert.ok(css.includes(`--qxframe9a7c2-${family}-${slot}: var(--qxframe9a7c2-size-${node});`),`Preset ${family}-${slot} must resolve through Size Tree node ${node}.`);
    assert.ok(theme.includes(`--qxframe9a7c2-theme-${family}-${slot}: var(--qxframe9a7c2-${family}-${slot});`),`Theme ${family}-${slot} must bridge the semantic geometry preset.`);
  }
}
for(const slot of ['xs','sm','md','lg','xl']){
  assert.match(components,new RegExp('\\.qxframe9a7c2-icon\\.is-'+slot+' \\{ --qxframe9a7c2-icon-size: var\\(--qxframe9a7c2-theme-icon-size-'+slot+'\\); \\}'));
  assert.match(components,new RegExp('var\\(--qxframe9a7c2-avatar-'+slot+'-size,var\\(--qxframe9a7c2-theme-avatar-size-'+slot+'\\)\\)'));
  assert.match(components,new RegExp('var\\(--qxframe9a7c2-progress-'+slot+'-line-size,var\\(--qxframe9a7c2-theme-progress-line-size-'+slot+'\\)\\)'));
  assert.match(components,new RegExp('var\\(--qxframe9a7c2-progress-'+slot+'-circle-size,var\\(--qxframe9a7c2-theme-progress-circle-size-'+slot+'\\)\\)'));
  assert.match(components,new RegExp('\\.qxframe9a7c2-switch\\.is-'+slot+'\\{--_qxframe9a7c2-switch-height-default:var\\(--qxframe9a7c2-theme-switch-height-'+slot+'\\);--_qxframe9a7c2-switch-width-default:var\\(--qxframe9a7c2-theme-switch-width-'+slot+'\\);--_qxframe9a7c2-switch-padding-default:var\\(--qxframe9a7c2-theme-switch-padding-'+slot+'\\)\\}'));
}
console.log(JSON.stringify({ok:true,nodes:46,oddNumericFontPresetsRemaining:0,completedOddFontDecisions:manifest.completedOddFontDecisions.length}));
