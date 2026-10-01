import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCanonicalStyleModulePaths } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

function family(selector){
  const m=selector&&selector.match(/\.qxframe9a7c2-([a-z0-9-]+)/i);
  if(!m)return 'other';
  const n=m[1],known=['image-preview','image','modal','drawer','popup','popover','tooltip','date-picker','time-picker','color-picker','carousel','table','upload','loading','menu','select','tree-select','cascader','notification','message','result','empty','card'];
  return known.find(x=>n.startsWith(x))||n.split('-')[0];
}
function selectorHint(lines,line){
  for(let j=line;j>=Math.max(0,line-12);j--){
    const s=lines[j].trim();
    if(!s||s.startsWith('/*')||s.startsWith('*'))continue;
    const k=s.indexOf('{');
    if(k>=0&&!s.startsWith('@'))return s.slice(0,k).trim().slice(0,500);
  }
  return null;
}
function propertyForOffset(lineText,offset){
  const before=lineText.slice(0,offset),start=Math.max(before.lastIndexOf(';'),before.lastIndexOf('{'))+1,chunk=lineText.slice(start),colon=chunk.indexOf(':');
  return colon>=0?chunk.slice(0,colon).trim():null;
}
function strategy(property,raw,text){
  const prop=String(property||'').toLowerCase();
  if(/vmin|vmax/i.test(raw))return {strategy:'manual-axis-independent-geometry',risk:'high'};
  if(/max-width|min-width|width|inline-size/.test(prop))return {strategy:'container-inline-percentage-or-token-cap',risk:'medium'};
  if(/max-height|min-height|height|block-size/.test(prop))return {strategy:'container-block-percentage-or-token-cap',risk:'medium'};
  if(/inset|top|right|bottom|left/.test(prop))return {strategy:'container-relative-positioning',risk:'medium'};
  if(/font-size/.test(prop))return {strategy:'size-tree-or-theme-typography',risk:'high'};
  if(/translate|transform/.test(prop)||/calc\(/i.test(text))return {strategy:'manual-container-geometry',risk:'high'};
  return {strategy:'manual-container-geometry',risk:'medium'};
}
export function generateViewportUnitMap({rootDir=root}={}){
  const consumers=[];
  for(const rel of getCanonicalStyleModulePaths({root:rootDir})){
    const lines=fs.readFileSync(path.join(rootDir,rel),'utf8').split(/\r?\n/);
    const layer=rel.includes('/preset/')?'preset':rel.includes('/theme/')?'theme':rel.includes('/components/')?'component':'base';
    for(let i=0;i<lines.length;i++){
      const line=lines[i];
      for(const match of line.matchAll(/(-?\d*\.?\d+)(vw|vh|vmin|vmax)\b/ig)){
        const selector=selectorHint(lines,i),property=propertyForOffset(line,match.index),decision=strategy(property,match[0],line);
        consumers.push({module:rel,layer,line:i+1,selector,family:family(selector),property,raw:match[0],value:Number(match[1]),unit:match[2].toLowerCase(),suggestedStrategy:decision.strategy,risk:decision.risk,text:line.trim().slice(0,650),approved:false,finalReplacement:null});
      }
    }
  }
  const countBy=key=>{const out={};for(const item of consumers)out[item[key]||'unclassified']=(out[item[key]||'unclassified']||0)+1;return Object.fromEntries(Object.entries(out).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])));};
  return {schemaVersion:1,generatedAt:'2026-10-01',policy:{finalRule:'Canonical framework CSS must not contain vw/vh/vmin/vmax.',automaticReplacementApproved:false,protected:'Responsive breakpoint contracts and JS overlay geometry behavior must be preserved.',note:'Strategies are planning hints only. Container-relative percentages require an established containing block; otherwise use existing overlay/layout geometry and token caps.'},summary:{total:consumers.length,byUnit:countBy('unit'),byRisk:countBy('risk'),byStrategy:countBy('suggestedStrategy'),byFamily:countBy('family'),byLayer:countBy('layer')},consumers};
}
const arg=process.argv.find(x=>x.startsWith('--write='));
if(arg){const target=path.resolve(root,arg.slice('--write='.length)),report=generateViewportUnitMap();fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({ok:true,wrote:path.relative(root,target).replaceAll('\\','/'),summary:report.summary}));}
else console.log(JSON.stringify({ok:true,summary:generateViewportUnitMap().summary}));
