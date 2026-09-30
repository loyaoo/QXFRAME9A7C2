import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const page=read('docs/all-components-static.html');
const docsTheme=read('docs/assets/qxframe9a7c2-docs-theme-state.js');
const staticTool=read('docs/assets/qxframe9a7c2-all-components-static.js');
const css=read('src/qxframe9a7c2.css');

const scriptTags=[...page.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(match=>{
  const attrs=match[1]||'';
  const body=(match[2]||'').trim();
  const src=(attrs.match(/\bsrc=["']([^"']+)["']/i)||[])[1]||null;
  return {src,body};
});
assert.deepEqual(scriptTags.map(x=>x.src),[
  'assets/qxframe9a7c2-docs-theme-state.js',
  'assets/qxframe9a7c2-all-components-static.js'
],'Static component matrix may load docs-only helpers only.');
assert.ok(scriptTags.every(x=>x.src&&x.body===''),'Static component matrix must not carry inline runtime scripts.');
assert.match(page,/<link[^>]+href=["']\.\.\/dist\/qxframe9a7c2\.css["'][^>]*>/i,
  'Static component matrix must consume the final dist CSS.');
assert.doesNotMatch(page,/<script[^>]+src=["'][^"']*(?:\.\.\/dist\/qxframe9a7c2\.js|qxframe9a7c2(?:\.min)?\.js(?:\?|["']))/i,
  'Static component matrix must not load the framework runtime JS bundle.');

for(const state of ['is-hover','is-focus','is-active','is-disabled','is-loading','is-selected','is-error','is-warning','is-success','is-keyboard-focus']){
  assert.match(page,new RegExp('\\b'+state+'\\b'),'Static component matrix must author '+state+' directly in HTML.');
}
assert.doesNotMatch(page,/\*\s*\{[^}]*pointer-events\s*:\s*none/i,
  'Static component matrix must not disable pointer events globally.');

for(const source of [docsTheme,staticTool]){
  assert.doesNotMatch(source,/(?:\.\.\/dist\/qxframe9a7c2\.js|src\/components\/|src\/core\/)/,
    'Docs-only static helpers must not import framework runtime implementation.');
  assert.doesNotMatch(source,/QXFRAME9A7C2\s*\.\s*(?:Components|Core|Headless)|new\s+QXFRAME9A7C2\b/,
    'Docs-only static helpers must not instantiate or call framework runtime APIs.');
}

const componentStateMutation=/classList\.(?:add|remove|toggle)\([^\n]*(?:is-hover|is-focus|is-selected|is-disabled|is-loading|is-error|is-warning|is-success|is-keyboard-focus)/;
assert.doesNotMatch(staticTool,componentStateMutation,
  'Docs helper must not synthesize component visual states; those states belong in static HTML.');
assert.doesNotMatch(docsTheme,componentStateMutation,
  'Docs theme helper must not synthesize component visual states.');

const activeMutationLines=staticTool.split(/\r?\n/).filter(line=>/classList\.(?:add|remove|toggle)\([^\n]*is-active/.test(line));
assert.ok(activeMutationLines.every(line=>line.includes('data-sg-theme-preset')),
  'Any docs-tool is-active mutation must be limited to the Theme Inspector preset UI.');

assert.match(docsTheme,/setAttribute\(['"]data-qxframe9a7c2-theme['"],\s*mode\)/,
  'Docs theme helper must project mode through the canonical CSS theme selector.');
assert.doesNotMatch(docsTheme,/style\.setProperty\([^\n]*--_qxframe9a7c2-/,
  'Docs theme mode helper must not mirror private semantic/family/component CSS variables.');


const gridStart=css.indexOf('/* QXFRAME9A7C2 Static Grid');
const gridEnd=css.indexOf('/* Layout · CSS-only structural surface',gridStart);
assert.ok(gridStart>=0&&gridEnd>gridStart,'Canonical Grid block must exist before Layout.');
const grid=css.slice(gridStart,gridEnd);
assert.match(grid,/\.qxframe9a7c2-row\s*\{[\s\S]*?row-gap:\s*var\(--qxframe9a7c2-grid-gap-y,\s*0\)[\s\S]*?box-sizing:\s*border-box/,
  'Grid row must preserve the mature SCSS flex/gap/box-sizing contract.');
assert.match(grid,/\.qxframe9a7c2-col\s*\{[\s\S]*?max-width:\s*100%[\s\S]*?box-sizing:\s*border-box[\s\S]*?padding:\s*0 calc\(var\(--qxframe9a7c2-grid-gap-x,\s*0\) \* 0\.5\)/,
  'Grid col must preserve the mature SCSS sizing/gutter contract.');
for(const sample of [
  '.qxframe9a7c2-row-cols-24 > *',
  '.qxframe9a7c2-row-cols-xxl-24 > *',
  '.qxframe9a7c2-col-24',
  '.qxframe9a7c2-col-xxl-24',
  '.qxframe9a7c2-push-24',
  '.qxframe9a7c2-pull-md-24',
  '.qxframe9a7c2-offset-xl-24',
  '.qxframe9a7c2-order-xxl-last',
  '.qxframe9a7c2-hidden-xxl-only',
  '.qxframe9a7c2-visible-xl-only'
]) assert.ok(grid.includes(sample),'Grid contract missing '+sample);
assert.match(grid,/\.qxframe9a7c2-g-24,[\s\S]*?\.qxframe9a7c2-gx-24\s*\{\s*--qxframe9a7c2-grid-gap-x:\s*3rem/,
  'g/gx must cover 0..24 using the mature 0.125rem step.');
assert.match(grid,/\.qxframe9a7c2-g-md-8,[\s\S]*?\.qxframe9a7c2-gy-md-8\s*\{\s*--qxframe9a7c2-grid-gap-y:\s*1rem/,
  'responsive g/gy must preserve the same 0.125rem step.');
assert.match(grid,/@media screen and \(min-width:\s*1600px\)[\s\S]*?\.qxframe9a7c2-col-xxl-24/,
  'xxl Grid breakpoint must start at 1600px.');
assert.doesNotMatch(grid,/\.qxframe9a7c2-row-(?:[1-9]|1\d|2[0-4])\s*>/,
  'Legacy misnamed row-1..24 API must not replace row-cols-*.');
assert.doesNotMatch(grid,/\.qxframe9a7c2-col(?:-[a-z]+)?-0\b/,
  'Mature Grid contract does not expose col-0.');
assert.doesNotMatch(grid,/\.qxframe9a7c2-gutter(?:-|\b)/,
  'Canonical Grid gutter API must remain the short g/gx/gy form.');

console.log(JSON.stringify({
  ok:true,
  frameworkRuntimeScripts:0,
  docsOnlyScripts:scriptTags.length,
  staticStateMatrix:true,
  componentStateSynthesis:false,
  canonicalDistCss:true
}));
