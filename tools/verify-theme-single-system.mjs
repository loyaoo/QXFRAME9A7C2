import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {getCanonicalStyleModulePaths} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));

const retiredGenerator=[
  'docs/assets/theme-generator/engine.mjs','docs/assets/theme-generator/generator.mjs','docs/assets/theme-generator/visual-engine.mjs',
  'docs/assets/theme-generator/recipe-engine.mjs','docs/assets/theme-generator/design-engine.mjs','docs/assets/theme-generator/audit-engine.mjs',
  'docs/assets/theme-generator/advanced-engine.mjs','docs/assets/theme-generator/io.mjs','docs/assets/theme-generator/presets.mjs',
  'docs/assets/qxframe9a7c2-theme-studio.js','docs/assets/qxframe9a7c2-theme-studio.css'
];
for(const rel of retiredGenerator)assert.equal(exists(rel),false,'Retired Theme system file must not exist: '+rel);

const manifest=JSON.parse(read('tools/manifests/css-order.json'));
for(const rel of manifest.sourceModules)assert.doesNotMatch(rel,/(?:^|\/)_?(?:theme-)?(?:default|family)\.s?css$/,'Legacy Theme module remains canonical: '+rel);
for(const rel of ['src/styles/theme/_default.scss','src/styles/theme/_family.scss','src/styles/main/theme-default.css','src/styles/main/theme-family.css'])assert.equal(exists(rel),false,'Legacy Theme module must not exist: '+rel);

const modules=getCanonicalStyleModulePaths({root});
const legacyPublic=[];
const visualOptIn=[];
for(const rel of modules){
  const text=read(rel);
  for(const match of text.matchAll(/--qxframe9a7c2-theme-(?!v2-)[a-z0-9-]+/gi))legacyPublic.push(rel+': '+match[0]);
  if(/data-qxframe9a7c2-visual=["']2["']/.test(text))visualOptIn.push(rel);
}
assert.deepEqual(legacyPublic.slice(0,50),[],`Old public Theme tokens remain in canonical CSS (${legacyPublic.length} occurrences):\n${legacyPublic.slice(0,50).join('\n')}`);
assert.deepEqual(visualOptIn,[],'The sole Theme system must not require the retired visual=2 opt-in: '+visualOptIn.join(', '));

const foundation='src/styles/preset/_foundation.scss';
if(exists(foundation)){
  const publicFoundation=[...read(foundation).matchAll(/(^|\s)(--qxframe9a7c2-[a-z0-9-]+)\s*:/gim)].map(match=>match[2]);
  assert.deepEqual(publicFoundation.slice(0,50),[],`Preset/Foundation public token layer remains (${publicFoundation.length} definitions). v1.5 permits private framework constants, not a second public token system.`);
}

const semantic=read('docs/assets/theme-generator/semantic-engine.mjs');
const engine=read('docs/assets/theme-generator/engine-v2.mjs');
assert.doesNotMatch(semantic,/data-qxframe9a7c2-visual/,'Generated color CSS must be canonical, not opt-in.');
assert.doesNotMatch(engine,/data-qxframe9a7c2-visual/,'Generated geometry/style CSS must be canonical, not opt-in.');
assert.match(semantic,/--qxframe9a7c2-theme-v2-/,'Canonical Theme generator must emit the new public Theme inputs.');

console.log(JSON.stringify({task:'THEME-VISUAL-V2-001',singlePublicTheme:true,retiredGeneratorFiles:retiredGenerator.length,canonicalModules:modules.length,legacyThemeOccurrences:legacyPublic.length,visualOptInModules:visualOptIn.length}));
