import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalComponentStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const family=fs.readFileSync(path.join(root,'src/styles/theme/_family.scss'),'utf8');
const components=readCanonicalComponentStyleSource({root});
const css=family+'\n'+components;
const lines=css.split(/\r?\n/);

const physical=[];
for(let i=0;i<lines.length;i++){
  if(/var\(\s*--qxframe9a7c2-palette-(?:grey|gray|cyan|teal|green|lime|yellow|orange|red|pink|purple|blue|azure|white|black)\b/i.test(lines[i])){
    physical.push({line:i+1,text:lines[i].trim()});
  }
}
assert.deepEqual(physical,[],'Component/family CSS must not consume physical palette variables directly; route color meaning through semantic/family owners.');

const hard=[];
for(let i=0;i<lines.length;i++){
  const line=lines[i];
  const scrub=line.replace(/--_?qxframe9a7c2-[a-z0-9-]+\s*:[^;]+;/ig,'');
  if(/#[0-9a-f]{3,8}\b|rgba?\(\s*(?:\d|\.)/i.test(scrub)) hard.push({line:i+1,text:line.trim()});
}
const unexpectedHard=hard.filter(entry=>{
  const text=entry.text;
  return !/^\.qxframe9a7c2-color-panel(?:-|\b)/.test(text)
    && !/^\.qxframe9a7c2-color-picker-gradient-stop(?:\b|\.)/.test(text);
});
assert.deepEqual(unexpectedHard,[],'Hard-coded component colors must be limited to classified color-model/contrast functional data.');

const baseline=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/css-static-color-baseline.json'),'utf8'));
const roleFor=(base,weight)=>{
  const normalized='color-mix(insrgb,var(--_qxframe9a7c2-semantic-'+base+')'+weight+'%,transparent)';
  const entry=baseline.entries.find(e=>e.normalized===normalized);
  assert.ok(entry,'Missing retired semantic overlay decision: '+normalized);
  return 'var('+entry.resolvedToken+')';
};
const required=[
  ['badge ribbon shadow','.qxframe9a7c2-badge-ribbon{','overlay-base',18],
  ['card elevation','.qxframe9a7c2-card.is-shadow{','overlay-base',6],
  ['card second elevation','.qxframe9a7c2-card.is-shadow{','overlay-base',5],
  ['switch thumb shadow','.qxframe9a7c2-switch-thumb{','overlay-base',24],
  ['table fixed shadow','.qxframe9a7c2-table .is-fixed-start.is-last::after{','overlay-base',24],
  ['upload preview mask','.qxframe9a7c2-upload-preview-mask{','overlay-base',58],
  ['carousel caption','.qxframe9a7c2-carousel{','overlay-base',46],
  ['carousel inactive dot','.qxframe9a7c2-carousel-dot-bar{','overlay-text',52],
  ['carousel active dot','.qxframe9a7c2-carousel-dot.is-active .qxframe9a7c2-carousel-dot-bar{','overlay-text',98],
  ['image preview hover chrome','.qxframe9a7c2-image-preview-toolbar .qxframe9a7c2-image-preview-tool:hover{','overlay-text',14]
];
for(const [name,selector,base,weight] of required){
  const rules=css.split(selector).slice(1).map(body=>body.slice(0,body.indexOf('}')));
  assert.ok(rules.length,'Missing semantic consumer: '+name);
  assert.ok(rules.some(rule=>rule.includes(roleFor(base,weight))),name+' must consume the static Theme role for its original semantic overlay channel.');
}
assert.match(css,/\.qxframe9a7c2-image-preview-video\{[^}]*background:var\(--_qxframe9a7c2-semantic-overlay-base\)/);

const functionalHard=hard.map(entry=>entry.text);
assert.ok(functionalHard.some(text=>text.startsWith('.qxframe9a7c2-color-panel-hue{')),'ColorPanel intrinsic hue spectrum classification is missing.');
assert.ok(functionalHard.some(text=>text.startsWith('.qxframe9a7c2-color-panel-saturation{')),'ColorPanel intrinsic saturation surface classification is missing.');
assert.ok(functionalHard.some(text=>text.startsWith('.qxframe9a7c2-color-picker-gradient-stop{')),'ColorPicker gradient-stop contrast affordance classification is missing.');

console.log(JSON.stringify({
  ok:true,
  directPhysicalPaletteConsumers:physical.length,
  classifiedFunctionalHardColorLines:hard.length,
  unexpectedHardColorLines:unexpectedHard.length,
  semanticOverlayChannels:true
}));
