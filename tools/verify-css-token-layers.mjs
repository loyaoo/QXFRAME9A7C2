import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { readCanonicalComponentStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const preset=read('src/styles/preset/_foundation.scss');
const theme=[read('src/styles/theme/_default.scss'),read('src/styles/theme/_family.scss')].join('\n');
const component=readCanonicalComponentStyleSource({root});
const manifest=JSON.parse(read('tools/manifests/css-token-layer-bridge.json'));

const defs=text=>new Set([...text.matchAll(/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:/ig)].map(m=>m[1]));
const refs=text=>[...text.matchAll(/var\(\s*(--_?qxframe9a7c2-[a-z0-9-]+)/ig)].map(m=>m[1]);
const escapeRegExp=value=>value.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
const presetDefs=defs(preset),themeDefs=defs(theme),componentDefs=defs(component);

const directPreset=refs(component).filter(name=>presetDefs.has(name)&&!themeDefs.has(name));
assert.deepEqual([...new Set(directPreset)].sort(),[],'Component SCSS must not read Preset tokens directly.');

for(const mapping of manifest.genericPresetMappings){
  assert.ok(presetDefs.has(mapping.source),'Generic bridge source must remain in Preset: '+mapping.source);
  assert.ok(themeDefs.has(mapping.theme),'Generic bridge target must exist in Theme: '+mapping.theme);
  assert.match(theme,new RegExp(escapeRegExp(mapping.theme)+'\\s*:\\s*var\\(\\s*'+escapeRegExp(mapping.source)+'\\s*\\)'),'Theme must select the declared Preset material: '+mapping.theme);
}

for(const mapping of manifest.componentMotionMappings){
  assert.equal(presetDefs.has(mapping.component),false,'Component-semantic motion token must not remain owned by Preset: '+mapping.component);
  assert.ok(themeDefs.has(mapping.theme),'Component-semantic motion default must exist in Theme: '+mapping.theme);
  assert.ok(componentDefs.has(mapping.component),'Component-semantic public token must be owned by Component: '+mapping.component);
  assert.match(component,new RegExp(escapeRegExp(mapping.component)+'\\s*:\\s*var\\(\\s*'+escapeRegExp(mapping.theme)+'\\s*\\)'),'Component token must default from Theme: '+mapping.component);
}

const declaration=/(--qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]*)(?:;|(?=}))/ig;
const publicCrossComponent=[];
let match;
while((match=declaration.exec(component))){
  const from=match[1],value=match[2];
  for(const to of refs(value)){
    if(to===from)continue;
    if(componentDefs.has(to)&&to.startsWith('--qxframe9a7c2-'))publicCrossComponent.push({from,to});
  }
}
assert.deepEqual(publicCrossComponent,[],'A public Component token must not read another public Component token.');

assert.equal(manifest.genericPresetBridgeCount,manifest.genericPresetMappings.length);
assert.equal(manifest.componentMotionTokenCount,49);
assert.equal(manifest.baseline.directPresetReferencesAfter,0);
console.log(JSON.stringify({ok:true,genericThemeBridgeTokens:manifest.genericPresetBridgeCount,componentMotionTokens:manifest.componentMotionTokenCount,directPresetRefs:0,publicCrossComponentEdges:0}));
