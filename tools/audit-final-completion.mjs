import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateComponentApi, generateModuleManifest } from './generate-release-metadata.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const posix=p=>p.split(path.sep).join('/');
function walk(dir, test=()=>true){
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const f=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(f,test));
    else if(e.isFile()&&test(f)) out.push(f);
  }
  return out;
}
const srcFiles=walk(path.join(root,'src'),f=>/\.(?:js|mjs)$/.test(f));
const source=new Map(srcFiles.map(f=>[posix(path.relative(root,f)),fs.readFileSync(f,'utf8')]));
const occurrences=(text,re)=>{const out=[];let m;re.lastIndex=0;while((m=re.exec(text)))out.push({index:m.index,match:m[0]});return out;};
const security=[];
const htmlSinks=/\b(?:eval\s*\(|new\s+Function\b|document\.write\s*\(|\.outerHTML\s*=|\.insertAdjacentHTML\s*\(|createContextualFragment\s*\(|\bsrcdoc\s*=|\.innerHTML\s*=)/g;
for(const [file,text] of source){
  for(const hit of occurrences(text,htmlSinks)){
    const approved=file==='src/core/domTemplate.js' && /\.innerHTML\s*=/.test(hit.match);
    security.push({file,kind:'html-code-sink',match:hit.match,approved});
  }
}
const dangerousProtocol=[];
for(const [file,text] of source){
  if(file==='src/utils/url.js') continue;
  for(const hit of occurrences(text,/['"`]\s*javascript\s*:/ig)) dangerousProtocol.push({file,match:hit.match});
}
const urlSinks=[];
for(const [file,text] of source){
  const sink=/(?:\.\s*(?:href|src|action|formAction)\s*=|setAttribute\s*\(\s*['"](?:href|src|action|formaction)['"])/g;
  const hits=occurrences(text,sink);
  if(!hits.length) continue;
  urlSinks.push({file,count:hits.length,urlPolicy:/\bURLPolicy\b/.test(text)});
}
const rawPrimitives=[];
const primitiveRules=[
 ['ResizeObserver',/new\s+(?:global(?:This)?\.)?ResizeObserver\s*\(/g,['src/core/observerHub.js']],
 ['MutationObserver',/new\s+(?:global(?:This)?\.)?MutationObserver\s*\(/g,['src/core/observerHub.js']],
 ['IntersectionObserver',/new\s+(?:global(?:This)?\.)?IntersectionObserver\s*\(/g,['src/core/observerHub.js']],
 ['requestAnimationFrame',/\brequestAnimationFrame\s*\(/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
 ['cancelAnimationFrame',/\bcancelAnimationFrame\s*\(/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
 ['addEventListener',/\.addEventListener\s*\(/g,['src/core/dom.js','src/vendor/floating-ui.js']],
 ['removeEventListener',/\.removeEventListener\s*\(/g,['src/core/dom.js','src/vendor/floating-ui.js']]
];
for(const [file,text] of source){
  for(const [kind,re,allowed] of primitiveRules){
    const count=occurrences(text,re).length;
    if(count && !allowed.includes(file)) rawPrimitives.push({file,kind,count});
  }
}
const staleComments=[];
for(const [file,text] of source){
  const lines=text.split(/\r?\n/);
  lines.forEach((line,i)=>{
    if(/Migration stage|Runtime consumers remain on the legacy registry until Rollup cutover|TEMP-ESM-BRIDGE/i.test(line)) staleComments.push({file,line:i+1,text:line.trim()});
  });
}
const activeMetadataFiles=[
 'README.md','QXFRAME9A7C2-重构开发规范手册-整合重写版.md','MIGRATION-src-dist-unified.md','HARDENING-v2.19.81.md',
 ...walk(path.join(root,'tools/manifests'),f=>f.endsWith('.json')).map(f=>posix(path.relative(root,f)))
];
const staleMetadata=[];
for(const rel of activeMetadataFiles){
  const abs=path.join(root,rel); if(!fs.existsSync(abs)) continue;
  const text=fs.readFileSync(abs,'utf8');
  text.split(/\r?\n/).forEach((line,i)=>{
    if(/src\/manifests\//.test(line)||(/src\/modules\//.test(line)&&!/no `src\/modules/.test(line))||/Runtime consumers remain on the legacy registry until Rollup cutover/i.test(line)) staleMetadata.push({file:rel,line:i+1,text:line.trim()});
  });
}
const baselineApi=JSON.parse(fs.readFileSync(path.join(root,'migration/baseline-hotfix6-2026-09-22/qxframe9a7c2-api.json'),'utf8'));
const baselineModules=JSON.parse(fs.readFileSync(path.join(root,'migration/baseline-hotfix6-2026-09-22/qxframe9a7c2-module-manifest.json'),'utf8'));
const currentApi=generateComponentApi({root});
const currentModules=generateModuleManifest({root});
const json=v=>JSON.stringify(v);
const apiParity=json(baselineApi)===json(currentApi);
const moduleParity=json(baselineModules)===json(currentModules);

const oldBrowser=fs.readFileSync(path.join(root,'migration/baseline-hotfix6-2026-09-22/verify-browser.log'),'utf8');
const currentBrowser=fs.readFileSync(path.join(root,'tools/verify-browser-smoke.html'),'utf8');
const oldChecks=new Set([...oldBrowser.matchAll(/"name":"([^"]+)"/g)].map(m=>m[1]));
const currentChecks=new Set([...currentBrowser.matchAll(/(?:assert|record)\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]));
const missingBehavior=[...oldChecks].filter(x=>!currentChecks.has(x)).sort();
const addedBehavior=[...currentChecks].filter(x=>!oldChecks.has(x)).sort();

const duplicateBlocks=new Map();
for(const [file,text] of source){
  if(file.startsWith('src/vendor/')) continue;
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x && !x.startsWith('//') && !x.startsWith('/*') && !x.startsWith('*'));
  for(let i=0;i+7<lines.length;i++){
    const block=lines.slice(i,i+8).join(' ').replace(/\s+/g,' ');
    if(block.length<360) continue;
    const key=block;
    let list=duplicateBlocks.get(key); if(!list) duplicateBlocks.set(key,list=[]);
    if(!list.some(x=>x.file===file)) list.push({file,line:i+1});
  }
}
const duplicates=[...duplicateBlocks.entries()].filter(([,locs])=>locs.length>1).map(([block,locs])=>({locs,preview:block.slice(0,220)})).slice(0,80);

const report={
  ok:false,
  files:srcFiles.length,
  security:{htmlCodeSinks:security,dangerousProtocol,urlSinks},
  duplicateCapabilityCandidates:rawPrimitives,
  staleMigrationComments:staleComments,
  staleActiveMetadata:staleMetadata,
  parity:{
    api:apiParity,
    modules:moduleParity,
    baselineBrowserChecks:oldChecks.size,
    currentBrowserChecks:currentChecks.size,
    missingBehaviorChecks:missingBehavior,
    addedBehaviorChecks:addedBehavior
  },
  exactDuplicateBlocks:duplicates
};
report.ok=security.every(x=>x.approved)&&dangerousProtocol.length===0&&apiParity&&moduleParity&&missingBehavior.length===0;
console.log(JSON.stringify(report,null,2));
if(!report.ok) process.exitCode=2;
