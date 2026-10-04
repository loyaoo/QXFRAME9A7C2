import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const abs=rel=>path.join(root,rel);
const read=rel=>fs.readFileSync(abs(rel),'utf8');
const write=(rel,text)=>{fs.mkdirSync(path.dirname(abs(rel)),{recursive:true});fs.writeFileSync(abs(rel),text);};

const foundationPath='src/styles/preset/_foundation.scss';
const defaultPath='src/styles/theme/_default.scss';
const familyPath='src/styles/theme/_family.scss';
const foundation=read(foundationPath);
const oldDefault=read(defaultPath);
const oldFamily=read(familyPath);

const foundationNames=[...foundation.matchAll(/(^|\s)(--qxframe9a7c2-[a-z0-9-]+)\s*:/gim)].map(match=>match[2]);
foundationNames.sort((a,b)=>b.length-a.length);
const foundationMap=new Map(foundationNames.map(name=>[name,name.replace('--qxframe9a7c2-','--_qxframe9a7c2-')]));

const visualRecipeNames=[
  'choice-radio-radius','choice-checkbox-radius','compact-shape-radius','identity-shape-radius','range-progress-radius',
  'switch-track-radius','switch-thumb-radius','slider-rail-radius','slider-handle-radius','menu-item-radius','item-radius',
  'card-font-size','card-border-width','card-shadow'
];
const visualRecipeMap=new Map(visualRecipeNames.map(name=>['--qxframe9a7c2-'+name,'--_qxframe9a7c2-'+name]));

function replaceExact(text,map){
  for(const [from,to] of map)text=text.replaceAll(from,to);
  return text;
}
function privatize(text){
  text=replaceExact(text,foundationMap);
  text=replaceExact(text,visualRecipeMap);
  text=text.replace(/--qxframe9a7c2-theme-(?!v2-)([a-z0-9-]+)/gi,'--_qxframe9a7c2-fixed-$1');
  text=text.replace(/--qxframe9a7c2-family-([a-z0-9-]+)/gi,'--_qxframe9a7c2-family-$1');
  text=text.replace(/--qxframe9a7c2-typography-([a-z0-9-]+)/gi,'--_qxframe9a7c2-typography-$1');
  text=text.replace(/--qxframe9a7c2-menu-recipe-([a-z0-9-]+)/gi,'--_qxframe9a7c2-menu-recipe-$1');
  text=text.replace(/--qxframe9a7c2-menu-context-([a-z0-9-]+)/gi,'--_qxframe9a7c2-menu-context-$1');
  return text;
}
function walk(dir){
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):[path.join(dir,entry.name)]);
}

const internalFoundation='/* Private framework constants. Not Theme inputs and not generator configuration. */\n'+privatize(foundation);
const fixedValues='/* Private fixed fallback values retained while component geometry is progressively expressed by v1.5 shared rules.\n * These custom properties are implementation details, not a second public Theme system. */\n'+privatize(oldDefault+'\n'+oldFamily);
write('src/styles/internal/_foundation.scss',internalFoundation);
write('src/styles/internal/_fixed-values.scss',fixedValues);

for(const file of walk(abs('src/styles')).filter(file=>file.endsWith('.scss'))){
  const rel=path.relative(root,file).replaceAll('\\','/');
  if([foundationPath,defaultPath,familyPath,'src/styles/internal/_foundation.scss','src/styles/internal/_fixed-values.scss'].includes(rel))continue;
  const before=fs.readFileSync(file,'utf8'),after=privatize(before);
  if(after!==before)fs.writeFileSync(file,after);
}

let entry=read('src/styles/qxframe9a7c2.scss');
entry=entry.replace('@use "preset/foundation";','@use "internal/foundation";\n@use "internal/fixed-values";');
write('src/styles/qxframe9a7c2.scss',entry);

const manifestPath='tools/manifests/css-order.json';
const manifest=JSON.parse(read(manifestPath));
manifest.version=Number(manifest.version||0)+1;
manifest.policy='src/styles/qxframe9a7c2.scss is the sole production CSS source entry. Theme v1.5 is the only public Theme input system. Foundation and retired Theme fallback values are private framework implementation constants.';
manifest.physicalOrder=(manifest.physicalOrder||[]).map(value=>value==='preset'?'internal-foundation':value);
if(!manifest.physicalOrder.includes('internal-fixed-values'))manifest.physicalOrder.splice(2,0,'internal-fixed-values');
manifest.sourceModules=manifest.sourceModules.map(rel=>rel===foundationPath?'src/styles/internal/_foundation.scss':rel).filter(rel=>![defaultPath,familyPath].includes(rel));
const foundationIndex=manifest.sourceModules.indexOf('src/styles/internal/_foundation.scss');
if(foundationIndex>=0&&!manifest.sourceModules.includes('src/styles/internal/_fixed-values.scss'))manifest.sourceModules.splice(foundationIndex+1,0,'src/styles/internal/_fixed-values.scss');
write(manifestPath,JSON.stringify(manifest,null,2)+'\n');

for(const rel of [foundationPath,defaultPath,familyPath])fs.unlinkSync(abs(rel));

const preflight='tools/verify-release-preflight.mjs';
let pre=read(preflight);
pre=pre.replace('npm run build && npm run verify && npm run verify:browser && npm run verify:theme-studio-browser && npm run verify:theme-visual-v2-browser && npm run verify:theme-studio-v2-browser && npm run verify:legacy-browser && npm run verify:release && npm run verify:package','npm run build && npm run verify && npm run verify:browser && npm run verify:theme-visual-v2-browser && npm run verify:theme-studio-v2-browser && npm run verify:legacy-browser && npm run verify:release && npm run verify:package');
pre=pre.replace('Release must run current browser verification, Theme Studio HTTP/Chromium acceptance, v2 Studio user-flow acceptance, and the strict HOTFIX6-derived Phase C compatibility smoke before artifact/package gates.','Release must run current browser verification, the sole Theme Studio user-flow acceptance, and the strict HOTFIX6-derived Phase C compatibility smoke before artifact/package gates.');
write(preflight,pre);

console.log(JSON.stringify({ok:true,foundationTokensPrivatized:foundationMap.size,oldThemeModulesDeleted:true,visualRecipePublicInputsPrivatized:visualRecipeMap.size}));
