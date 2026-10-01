import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCanonicalStyleModulePaths } from './style-source.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

export function sizeTreeNodes(){
  const nodes=[];let index=1;
  for(let px=2;px<=48;px+=2)nodes.push({name:'size-'+index++,px,rem:px/16});
  for(let px=52;px<=80;px+=4)nodes.push({name:'size-'+index++,px,rem:px/16});
  for(let px=88;px<=128;px+=8)nodes.push({name:'size-'+index++,px,rem:px/16});
  for(let px=144;px<=256;px+=16)nodes.push({name:'size-'+index++,px,rem:px/16});
  return nodes;
}
function classify(text,value,unit){
  const absPx=Math.abs(unit==='rem'?value*16:value);
  if(/@media\b/i.test(text)||/(?:min|max)-width\s*:/i.test(text))return 'breakpoint-boundary';
  if(absPx>=900&&/radius/i.test(text))return 'pill-radius-sentinel';
  if(value<0)return 'signed-offset';
  if(/font-size/i.test(text))return 'typography';
  if(/border-radius|radius/i.test(text))return 'radius';
  if(/\b(?:padding|margin|gap|row-gap|column-gap)\b/i.test(text))return 'spacing';
  if(/box-shadow|text-shadow|shadow/i.test(text))return 'shadow';
  if(/\b(?:top|right|bottom|left|inset)\b/i.test(text))return 'position';
  if(/\b(?:width|height|size)\b/i.test(text))return 'geometry';
  return 'visual-geometry';
}
function nearest(nodes,absPx){
  let lower=null,higher=null,exact=null;
  for(const node of nodes){
    if(Math.abs(node.px-absPx)<1e-9)exact=node;
    if(node.px<=absPx)lower=node;
    if(node.px>=absPx){higher=node;break;}
  }
  return {exact,lower,higher};
}
function selectorHint(lines,lineIndex){
  for(let j=lineIndex;j>=Math.max(0,lineIndex-8);j--){
    const text=lines[j].trim();
    if(!text||text.startsWith('/*')||text.startsWith('*'))continue;
    const brace=text.indexOf('{');
    if(brace>=0)return text.slice(0,brace).trim().slice(0,260);
  }
  return null;
}
export function generateSizeTreeAudit({rootDir=root}={}){
  const nodes=sizeTreeNodes();
  const consumers=[];
  for(const rel of getCanonicalStyleModulePaths({root:rootDir})){
    const lines=fs.readFileSync(path.join(rootDir,rel),'utf8').split(/\r?\n/);
    const layer=rel.includes('/preset/')?'preset':rel.includes('/theme/')?'theme':rel.includes('/components/')?'component':'base';
    for(let i=0;i<lines.length;i++){
      const text=lines[i];
      const matches=[
        ...[...text.matchAll(/(-?\d*\.?\d+)px\b/g)].map(m=>({unit:'px',value:Number(m[1]),raw:m[0]})),
        ...[...text.matchAll(/(-?\d*\.?\d+)rem\b/g)].map(m=>({unit:'rem',value:Number(m[1]),raw:m[0]}))
      ];
      for(const match of matches){
        const pxEquivalent=match.unit==='rem'?match.value*16:match.value;
        if(match.unit==='px'&&Math.abs(match.value)<=1)continue;
        if(match.unit==='rem'&&match.value===0)continue;
        const domain=classify(text,match.value,match.unit);
        const candidate=nearest(nodes,Math.abs(pxEquivalent));
        let status='needs-review';
        if(domain==='breakpoint-boundary')status='preserve-breakpoint';
        else if(domain==='pill-radius-sentinel')status='needs-review-sentinel';
        else if(candidate.exact)status='exact-node-candidate';
        consumers.push({
          module:rel,layer,line:i+1,raw:match.raw,unit:match.unit,value:match.value,
          pxEquivalent:Number(pxEquivalent.toFixed(6)),domain,status,
          exactNode:candidate.exact?.name||null,
          lowerNode:candidate.lower?{name:candidate.lower.name,px:candidate.lower.px}:null,
          upperNode:candidate.higher?{name:candidate.higher.name,px:candidate.higher.px}:null,
          selector:selectorHint(lines,i),text:text.trim().slice(0,520),finalTarget:null,approved:false
        });
      }
    }
  }
  const domains=[...new Set(consumers.map(x=>x.domain))].sort();
  return {
    schemaVersion:1,
    generatedAt:'2026-10-01',
    policy:{
      source:'QXFRAME9A7C2-CSS-Design-Token-System-Refactor-Execution-Guide-v1.6.md §4',
      defaultRootFontSizePx:16,automaticOddRounding:false,automaticApproval:false,
      note:'Candidate table only. finalTarget and approved remain unset until each consumer/domain decision is reviewed.'
    },
    sizeTree:nodes.map(n=>({name:n.name,px:n.px,rem:Number(n.rem.toFixed(6))})),
    summary:{
      totalCandidates:consumers.length,
      exactNodeCandidates:consumers.filter(x=>x.status==='exact-node-candidate').length,
      needsReview:consumers.filter(x=>x.status==='needs-review').length,
      signedOffsets:consumers.filter(x=>x.domain==='signed-offset').length,
      pillSentinels:consumers.filter(x=>x.domain==='pill-radius-sentinel').length,
      protectedBreakpoints:consumers.filter(x=>x.domain==='breakpoint-boundary').length,
      byLayer:Object.fromEntries(['base','preset','theme','component'].map(l=>[l,consumers.filter(x=>x.layer===l).length])),
      byDomain:Object.fromEntries(domains.map(d=>[d,consumers.filter(x=>x.domain===d).length]))
    },
    consumers
  };
}
const writeArg=process.argv.find(x=>x.startsWith('--write='));
if(writeArg){
  const target=path.resolve(root,writeArg.slice('--write='.length));
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,JSON.stringify(generateSizeTreeAudit(),null,2)+'\n');
  console.log(JSON.stringify({ok:true,wrote:path.relative(root,target).replaceAll('\\','/'),summary:generateSizeTreeAudit().summary}));
}else if(import.meta.url===new URL('file://'+process.argv[1].replaceAll('\\','/')).href){
  console.log(JSON.stringify({ok:true,summary:generateSizeTreeAudit().summary}));
}
