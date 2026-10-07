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

// createApp v3 §5: the sole public Theme inputs are the registered --qxframe9a7c2-theme-* closed list
// (docs/create/tokens.js); the retired THEME-VISUAL-V2 names (--qxframe9a7c2-theme-v2-*) and any
// unregistered theme name are legacy.
const {THEME_TOKEN_NAMES}=await import(new URL('../docs/create/tokens.js',import.meta.url).href);
const registered=new Set(THEME_TOKEN_NAMES);
const modules=getCanonicalStyleModulePaths({root});
const legacyPublic=[];
const visualOptIn=[];
for(const rel of modules){
  const text=read(rel);
  for(const match of text.matchAll(/--qxframe9a7c2-theme-[a-z0-9-]+/gi))if(!registered.has(match[0]))legacyPublic.push(rel+': '+match[0]);
  if(/data-qxframe9a7c2-visual=["']2["']/.test(text))visualOptIn.push(rel);
}
assert.deepEqual(legacyPublic.slice(0,50),[],`Unregistered / retired public Theme tokens remain in canonical CSS (${legacyPublic.length} occurrences):\n${legacyPublic.slice(0,50).join('\n')}`);
assert.deepEqual(visualOptIn,[],'The sole Theme system must not require the retired visual=2 opt-in: '+visualOptIn.join(', '));

const foundation='src/styles/preset/_foundation.scss';
if(exists(foundation)){
  const publicFoundation=[...read(foundation).matchAll(/(^|\s)(--qxframe9a7c2-[a-z0-9-]+)\s*:/gim)].map(match=>match[2]);
  assert.deepEqual(publicFoundation.slice(0,50),[],`Preset/Foundation public token layer remains (${publicFoundation.length} definitions). v1.5 permits private framework constants, not a second public token system.`);
}

// The canonical generator is the createApp compiler; it writes only registered names.
const compiler=read('docs/create/compiler.js');
assert.doesNotMatch(compiler,/data-qxframe9a7c2-visual|--qxframe9a7c2-theme-v2-/,'createApp compiler must emit the closed --qxframe9a7c2-theme-* list only.');
assert.match(compiler,/THEME_TOKENS/,'createApp compiler must emit every registered token.');

console.log(JSON.stringify({task:'CREATEAPP-V3-S2A',singlePublicTheme:true,retiredGeneratorFiles:retiredGenerator.length,canonicalModules:modules.length,legacyThemeOccurrences:legacyPublic.length,visualOptInModules:visualOptIn.length}));
