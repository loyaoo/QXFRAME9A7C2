import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readCanonicalComponentStyleSource} from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const component=readCanonicalComponentStyleSource({root});
const theme=[read('src/styles/theme/_visual-v2.scss'),read('src/styles/theme/_visual-v2-style.scss'),read('src/styles/theme/_visual-v2-style-consumers.scss')].join('\n');
const fixed=read('src/styles/internal/_fixed-values.scss');

for(const retired of ['src/styles/preset/_foundation.scss','src/styles/theme/_default.scss','src/styles/theme/_family.scss'])assert.equal(exists(retired),false,'Retired public Theme layer must stay deleted: '+retired);
assert.equal(exists('tools/manifests/css-token-layer-bridge.json'),false,'Retired Preset→Theme bridge manifest must stay deleted.');

const defs=text=>new Set([...text.matchAll(/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:/ig)].map(m=>m[1]));
const refs=text=>[...text.matchAll(/var\(\s*(--_?qxframe9a7c2-[a-z0-9-]+)/ig)].map(m=>m[1]);
const themeDefs=defs(theme),componentDefs=defs(component),fixedDefs=defs(fixed);
const publicTheme=[...themeDefs].filter(name=>name.startsWith('--qxframe9a7c2-theme-'));
assert.ok(publicTheme.length>0,'Canonical Theme must expose public Theme inputs.');
assert.deepEqual(publicTheme.filter(name=>!name.startsWith('--qxframe9a7c2-theme-v2-')),[],'Only Theme v2 public inputs may exist.');
assert.deepEqual([...fixedDefs].filter(name=>name.startsWith('--qxframe9a7c2-theme-')),[],'Private fixed implementation constants must not expose a second public Theme layer.');

const legacyThemeRef=/^--qxframe9a7c2-theme-(?!v2-)/;
const paletteRef=/^--qxframe9a7c2-palette-/;
const componentLegacyRefs=[...new Set(refs(component).filter(name=>legacyThemeRef.test(name)||paletteRef.test(name)))].sort();
assert.deepEqual(componentLegacyRefs,[],'Component CSS must not consume retired public Theme/Palette inputs.');
const themeLegacyRefs=[...new Set(refs(theme).filter(name=>legacyThemeRef.test(name)||paletteRef.test(name)))].sort();
assert.deepEqual(themeLegacyRefs,[],'Canonical Theme modules must not bridge through retired Theme/Palette inputs.');

// Public Component tokens may default from canonical Theme/private implementation
// roles, but one public Component token may not alias another public Component token.
const declaration=/(--qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]*)(?:;|(?=}))/ig;
const publicCrossComponent=[];
let match;
while((match=declaration.exec(component))){
  const from=match[1],value=match[2];
  for(const to of refs(value)){
    if(to===from||to.startsWith('--qxframe9a7c2-theme-v2-'))continue;
    if(componentDefs.has(to)&&to.startsWith('--qxframe9a7c2-'))publicCrossComponent.push({from,to});
  }
}
assert.deepEqual(publicCrossComponent,[],'A public Component token must not read another public Component token.');

// The canonical layer is intentionally asymmetric: Theme is public, the
// framework's fixed algorithms are private, Component consumes both. No
// Preset→Theme compatibility bridge is permitted.
const componentThemeRefs=[...new Set(refs(component).filter(name=>name.startsWith('--qxframe9a7c2-theme-v2-'))].sort();
const componentPrivateRefs=[...new Set(refs(component).filter(name=>name.startsWith('--_qxframe9a7c2-'))].sort();
assert.ok(componentPrivateRefs.length>0,'Components must still have private implementation roles while migration proceeds.');

console.log(JSON.stringify({ok:true,publicThemeSystem:'v2-only',publicThemeInputs:publicTheme.length,componentThemeRefs:componentThemeRefs.length,componentPrivateRefs:componentPrivateRefs.length,retiredPresetBridge:true,legacyPublicRefs:0,publicCrossComponentEdges:0}));
