import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const theme=fs.readFileSync(path.join(root,'src/styles/main/theme-visual-v2.css'),'utf8');
const components=readCanonicalComponentStyleSource({root});
const lines=components.split(/\r?\n/);

// v1.5 public color inputs are complete CSS <color> values. Component CSS must
// not consume the retired physical Palette API or wrap full colors as channels.
const physical=[];
for(let i=0;i<lines.length;i++)if(/var\(\s*--qxframe9a7c2-palette-/i.test(lines[i]))physical.push({line:i+1,text:lines[i].trim()});
assert.deepEqual(physical,[],'Components must not consume retired physical Palette variables.');
assert.doesNotMatch(theme,/--qxframe9a7c2-palette-/,'Canonical Theme must not recreate a public Palette layer.');
assert.doesNotMatch(theme,/rgb\(\s*var\(\s*--qxframe9a7c2-theme-v2-/,'Full-color Theme inputs must not be wrapped as RGB channels.');
assert.doesNotMatch(components,/rgb\(\s*var\(\s*--qxframe9a7c2-theme-v2-/,'Components must consume full-color Theme values directly.');

// Hard-coded component paint is limited to intrinsic color-model UI (the
// ColorPanel spectra / ColorPicker gradient handles). Business/status colors
// must resolve through semantic/shared roles.
const hard=[];
for(let i=0;i<lines.length;i++){
  // Neutral ink (pure black / white with alpha: shadow ink, media scrims) is mode-independent and not a
  // business color; v3 stage 2b inlined it from the retired :root palettes into its single consumer.
  const line=lines[i],scrub=line.replace(/--_?qxframe9a7c2-[a-z0-9-]+\s*:[^;]+;/ig,'').replace(/rgb\((?:0 0 0|255 255 255) \/ \.\d+\)/g,'');
  if(/#[0-9a-f]{3,8}\b|rgba?\(\s*(?:\d|\.)/i.test(scrub))hard.push({line:i+1,text:line.trim()});
}
const unexpectedHard=hard.filter(({text})=>!/^\.qxframe9a7c2-color-panel(?:-|\b)/.test(text)&&!/^\.qxframe9a7c2-color-picker-gradient-stop(?:\b|\.)/.test(text));
assert.deepEqual(unexpectedHard,[],'Hard-coded component colors must be limited to intrinsic color-model/contrast data.');

for(const role of ['--_qxframe9a7c2-semantic-overlay-base','--_qxframe9a7c2-semantic-overlay-text','--_qxframe9a7c2-semantic-focus'])assert.ok(theme.includes(role+':'),'Canonical Theme must own shared semantic paint role '+role);
assert.ok(hard.some(({text})=>text.startsWith('.qxframe9a7c2-color-panel-hue{')),'ColorPanel intrinsic hue spectrum classification is missing.');
assert.ok(hard.some(({text})=>text.startsWith('.qxframe9a7c2-color-panel-saturation{')),'ColorPanel intrinsic saturation surface classification is missing.');
assert.ok(hard.some(({text})=>text.startsWith('.qxframe9a7c2-color-picker-gradient-stop{')),'ColorPicker gradient-stop contrast affordance classification is missing.');

console.log(JSON.stringify({ok:true,publicColorModel:'complete-css-color',directPhysicalPaletteConsumers:0,classifiedFunctionalHardColorLines:hard.length,neutralInkAllowed:true,unexpectedHardColorLines:0}));
