import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=fs.readFileSync(path.join(root,'src/qxframe9a7c2.css'),'utf8');
const lines=css.split(/\r?\n/);
const componentStart=1300;

const physical=[];
for(let i=componentStart;i<lines.length;i++){
  if(/var\(\s*--qxframe9a7c2-palette-(?:grey|gray|cyan|teal|green|lime|yellow|orange|red|pink|purple|blue|azure|white|black)\b/i.test(lines[i])){
    physical.push({line:i+1,text:lines[i].trim()});
  }
}
assert.deepEqual(physical,[],'Component/family CSS must not consume physical palette variables directly; route color meaning through semantic/family owners.');

const hard=[];
for(let i=componentStart;i<lines.length;i++){
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

const required=[
  ['badge ribbon shadow',/\.qxframe9a7c2-badge-ribbon\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 18%,transparent\)/],
  ['card elevation',/--qxframe9a7c2-card-shadow:[^;]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 6%,transparent\)[^;]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 5%,transparent\)/],
  ['switch thumb shadow',/\.qxframe9a7c2-switch-thumb\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 24%,transparent\)/],
  ['table fixed shadow',/\.qxframe9a7c2-table \.is-fixed-start\.is-last::after\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 24%,transparent\)/],
  ['upload preview mask',/\.qxframe9a7c2-upload-preview-mask\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 58%,transparent\)/],
  ['carousel caption',/--_qxframe9a7c2-carousel-caption-bg:[^;]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-base\) 46%,transparent\)/],
  ['carousel inactive dot',/\.qxframe9a7c2-carousel-dot-bar\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-text\) 52%,transparent\)/],
  ['carousel active dot',/\.qxframe9a7c2-carousel-dot\.is-active \.qxframe9a7c2-carousel-dot-bar\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-text\) 98%,transparent\)/],
  ['image preview video backing',/\.qxframe9a7c2-image-preview-video\{[^}]*background:var\(--_qxframe9a7c2-semantic-overlay-base\)/],
  ['image preview hover chrome',/\.qxframe9a7c2-image-preview-toolbar \.qxframe9a7c2-image-preview-tool:hover\{[^}]*color-mix\(in srgb,var\(--_qxframe9a7c2-semantic-overlay-text\) 14%,transparent\)/]
];
for(const [name,pattern] of required) assert.match(css,pattern,name+' must remain on the semantic overlay channel.');

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
