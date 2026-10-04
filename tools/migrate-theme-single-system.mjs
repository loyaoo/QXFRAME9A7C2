import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const write=(rel,text)=>fs.writeFileSync(path.join(root,rel),text);

const scoped=[
  'src/styles/theme/_visual-v2.scss',
  'src/styles/theme/_visual-v2-consumers.scss',
  'src/styles/theme/_visual-v2-style.scss',
  'src/styles/theme/_visual-v2-style-consumers.scss'
];
for(const rel of scoped){
  let text=read(rel);
  text=text.replaceAll('@scope ([data-qxframe9a7c2-visual="2"])','@scope (:root)');
  text=text.replaceAll('[data-qxframe9a7c2-visual="2"][data-qxframe9a7c2-style=', '[data-qxframe9a7c2-style=');
  text=text.replaceAll(' representative chain. Opt-in until Phase H.',' canonical chain.');
  text=text.replaceAll('Versioned v1.5 opt-in chain','Canonical v1.5 Theme chain');
  write(rel,text);
}

let semantic=read('docs/assets/theme-generator/semantic-engine.mjs');
semantic=semantic.replaceAll('[data-qxframe9a7c2-visual="2"][data-qxframe9a7c2-theme="light"]','[data-qxframe9a7c2-theme="light"]')
  .replaceAll('[data-qxframe9a7c2-visual="2"][data-qxframe9a7c2-theme="dark"]','[data-qxframe9a7c2-theme="dark"]');
write('docs/assets/theme-generator/semantic-engine.mjs',semantic);

let engine=read('docs/assets/theme-generator/engine-v2.mjs');
engine=engine.replace("const selector='[data-qxframe9a7c2-visual=\"2\"][data-qxframe9a7c2-theme]';","const selector=':root, [data-qxframe9a7c2-theme]';");
write('docs/assets/theme-generator/engine-v2.mjs',engine);

let entry=read('src/styles/qxframe9a7c2.scss');
entry=entry.replace('@use "theme/default";\n','').replace('@use "theme/family";\n','');
entry=entry.replace('// Versioned v1.5 opt-in chain. Removed/reordered only at final migration.','// Canonical v1.5 Theme chain. Legacy Theme/default and Theme/family are retired.');
write('src/styles/qxframe9a7c2.scss',entry);

const manifestPath='tools/manifests/css-order.json';
const manifest=JSON.parse(read(manifestPath));
manifest.version=Number(manifest.version||0)+1;
manifest.policy='src/styles/qxframe9a7c2.scss is the sole production CSS source entry. Theme v1.5 is the only public Theme token system; retired Schema1 theme/default and theme/family are not compiled.';
manifest.physicalOrder=(manifest.physicalOrder||[]).filter(value=>!['theme-default','theme-family-category'].includes(value));
manifest.sourceModules=manifest.sourceModules.filter(rel=>!['src/styles/theme/_default.scss','src/styles/theme/_family.scss'].includes(rel));
write(manifestPath,JSON.stringify(manifest,null,2)+'\n');

console.log(JSON.stringify({ok:true,scope:'canonical',removed:['theme/default','theme/family'],publicTheme:'theme-v2'}));
