import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CANONICAL_STYLE_ENTRY, getCanonicalStyleModulePaths, readCanonicalStyleSource } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=readCanonicalStyleSource({root});
const modules=getCanonicalStyleModulePaths({root});
const jsRoot=path.join(root,'src');

function lineStarts(text){
  const starts=[0];
  for(let i=0;i<text.length;i+=1) if(text.charCodeAt(i)===10) starts.push(i+1);
  return starts;
}
const starts=lineStarts(css);
function lineOf(index){
  let lo=0,hi=starts.length;
  while(lo<hi){const mid=(lo+hi)>>1;if(starts[mid]<=index)lo=mid+1;else hi=mid;}
  return lo;
}
const lines=css.split(/\r?\n/);
function context(line){
  const i=Math.max(0,line-1);
  return {
    before:(lines[i-1]||'').trim().slice(0,220),
    text:(lines[i]||'').trim().slice(0,520),
    after:(lines[i+1]||'').trim().slice(0,220)
  };
}
function selectorHint(line){
  for(let i=Math.max(0,line-4);i<=line;i+=1){
    const s=(lines[i]||'').trim();
    if(!s||s.startsWith('/*')||s.startsWith('*')) continue;
    const brace=s.indexOf('{');
    if(brace>=0) return s.slice(0,brace).trim().slice(0,280);
  }
  return null;
}
function classifyPx(value,text){
  const abs=Math.abs(value);
  if(abs===1) return 'hairline';
  if(/@media\b/.test(text)) return 'breakpoint-boundary';
  if(/border-radius\s*:\s*999px/.test(text)) return 'pill-radius-sentinel';
  if(/(?:top|bottom|left|right|margin|inset)[^;]*-\d/.test(text)) return 'positional-offset';
  if(/border(?:-[a-z]+)?\s*:/.test(text)) return 'border-thickness-or-radius';
  if(/shadow/i.test(text)) return 'shadow-geometry';
  return 'visual-geometry';
}
function collect(re,kind,mapValue){
  const out=[]; let m;
  while((m=re.exec(css))){
    const line=lineOf(m.index);
    const ctx=context(line);
    const value=mapValue(m);
    out.push({kind,value,line,selector:selectorHint(line),classification:kind==='px'?classifyPx(Number(value),ctx.text):null,...ctx});
    if(m[0]==='') re.lastIndex+=1;
  }
  return out;
}
const px=collect(/(-?\d*\.?\d+)px\b/g,'px',m=>Number(m[1]));
const oddPx=px.filter(x=>Number.isInteger(x.value)&&Math.abs(x.value)>1&&Math.abs(x.value)%2===1);
const decimalPx=px.filter(x=>!Number.isInteger(x.value));
const viewport=collect(/(-?\d*\.?\d+)(vw|vh|vmin|vmax)\b/g,'viewport-unit',m=>m[0]);
const fr=collect(/(-?\d*\.?\d+)fr\b/g,'fr',m=>m[0]);
const grid=collect(/\bdisplay\s*:\s*(?:inline-)?grid\b|\bgrid-(?:template|column|row|area|auto|gap)[a-z-]*\s*:[^;}]+/gi,'css-grid',m=>m[0]);

function walk(dir){
  const out=[];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else if(entry.isFile()&&entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}
const jsGeometry=[];
const geometryPatterns=[
  ['rect',/getBoundingClientRect\s*\(/g],
  ['box-metric',/\b(?:offsetWidth|offsetHeight|clientWidth|clientHeight|scrollWidth|scrollHeight)\b/g],
  ['computed-style',/getComputedStyle\s*\(/g],
  ['resize-observer',/ResizeObserver\b/g],
  ['intersection-observer',/IntersectionObserver\b/g]
];
for(const file of walk(jsRoot)){
  const rel=path.relative(root,file).replaceAll('\\','/');
  const source=fs.readFileSync(file,'utf8').split(/\r?\n/);
  source.forEach((text,index)=>{
    for(const [kind,re] of geometryPatterns){
      re.lastIndex=0;
      if(re.test(text)) jsGeometry.push({file:rel,line:index+1,kind,text:text.trim().slice(0,420)});
    }
  });
}

function group(items,keyFn){
  const map=new Map();
  for(const item of items){
    const key=keyFn(item)||'unclassified';
    if(!map.has(key)) map.set(key,[]);
    map.get(key).push(item);
  }
  return Object.fromEntries([...map.entries()].sort((a,b)=>a[0].localeCompare(b[0])));
}

const report={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  source:{entry:CANONICAL_STYLE_ENTRY,modules,lines:lines.length},
  summary:{
    oddPx:oddPx.length,
    decimalPx:decimalPx.length,
    forbiddenViewportUnits:viewport.length,
    frUnits:fr.length,
    cssGridMatches:grid.length,
    jsGeometryCouplingSites:jsGeometry.length
  },
  tables:{
    oddPx,
    decimalPx,
    viewportUnits:viewport,
    frUnits:fr,
    cssGrid:grid,
    jsGeometryCoupling:jsGeometry
  },
  grouped:{
    oddPxByClassification:group(oddPx,x=>x.classification),
    viewportBySelector:group(viewport,x=>x.selector),
    gridBySelector:group(grid,x=>x.selector),
    jsGeometryByKind:group(jsGeometry,x=>x.kind)
  },
  policy:{
    inventoryOnly:true,
    automaticReplacement:false,
    protected:['24-column Flex Grid math','responsive breakpoints','interaction/focus/value state','overlay positioning','icon-font mapping','motion lifecycle'],
    note:'Phase B classifies consumers. It does not authorize value changes.'
  }
};
const arg=process.argv.find(x=>x.startsWith('--write='));
if(arg){
  const target=path.resolve(root,arg.slice('--write='.length));
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({ok:true,wrote:path.relative(root,target).replaceAll('\\','/'),summary:report.summary}));
}else{
  console.log(JSON.stringify({ok:true,summary:report.summary,groups:{
    oddPx:Object.fromEntries(Object.entries(report.grouped.oddPxByClassification).map(([k,v])=>[k,v.length])),
    jsGeometry:Object.fromEntries(Object.entries(report.grouped.jsGeometryByKind).map(([k,v])=>[k,v.length]))
  }}));
}
