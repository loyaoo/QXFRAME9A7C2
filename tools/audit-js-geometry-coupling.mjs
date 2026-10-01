import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function classify(x){
  const file=x.file;
  if(file.startsWith('src/core/'))return {owner:'canonical-core',action:'preserve-and-retest',risk:'low'};
  if(file==='src/components/scroll.js')return {owner:'canonical-scroll',action:'preserve-scroll-geometry',risk:'low'};
  if(/observer/i.test(x.kind))return {owner:'observer-boundary',action:'verify-observerhub-delegation',risk:'medium'};
  if(x.kind==='computed-style')return {owner:'css-runtime-contract',action:'verify-token-or-layout-read',risk:'medium'};
  if(/(?:image|modal|drawer|popup|popover|tooltip|ripple|color-panel|color-picker|slider|rate)\.js$/.test(file))return {owner:'interaction-overlay-geometry',action:'preserve-runtime-measurement',risk:'medium'};
  if(/(?:carousel|collapse|menu|tabs|table|upload|transfer|date-picker|time-panel|wheel-panel)\.js$/.test(file))return {owner:'component-layout-measurement',action:'retest-after-css-layout-change',risk:'medium'};
  return {owner:'component-geometry-review',action:'review-for-shared-geometry-facade',risk:'medium'};
}
export function generateGeometryCouplingMap({rootDir=root}={}){
 const phase=JSON.parse(fs.readFileSync(path.join(rootDir,'tools/manifests/css-token-phase-b-inventory.json'),'utf8'));
 const mapped=phase.tables.jsGeometryCoupling.map(x=>({...x,...classify(x),approvedChange:false,finalAction:null}));
 const countBy=k=>{const out={};for(const x of mapped)out[x[k]]=(out[x[k]]||0)+1;return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));};
 return {schemaVersion:1,generatedAt:'2026-10-01',source:'tools/manifests/css-token-phase-b-inventory.json#tables.jsGeometryCoupling',policy:{inventoryOnly:true,automaticRefactorApproved:false,note:'Geometry reads are not bugs by themselves. Preserve canonical scroll/overlay/interaction measurements; review component-local ownership only when a shared geometry authority exists. Every CSS size/layout migration must re-test affected sites.'},summary:{total:mapped.length,byKind:countBy('kind'),byOwner:countBy('owner'),byAction:countBy('action'),byRisk:countBy('risk')},sites:mapped};
}
const arg=process.argv.find(x=>x.startsWith('--write='));
if(arg){const target=path.resolve(root,arg.slice('--write='.length)),report=generateGeometryCouplingMap();fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,wrote:path.relative(root,target).replaceAll('\\','/'),summary:report.summary}));}
else console.log(JSON.stringify({ok:true,summary:generateGeometryCouplingMap().summary}));
