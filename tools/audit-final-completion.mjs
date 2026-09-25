import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateComponentApi, generateModuleManifest } from './generate-release-metadata.mjs';
import { DOMProjection } from '../src/core/domProjection.js';
import { DOM } from '../src/core/dom.js';
import { ComponentContracts } from '../src/core/componentContracts.js';
import { Utils } from '../src/utils/utils.js';

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
const secretScanFiles=[
  ...srcFiles,
  ...walk(path.join(root,'tools'),f=>/\.(?:js|mjs|json|ya?ml|md)$/.test(f)),
  ...walk(path.join(root,'.github/workflows'),f=>/\.ya?ml$/.test(f)),
  ...walk(path.join(root,'docs'),f=>/\.(?:js|json|html|md)$/.test(f)),
  ...['package.json','package-lock.json','README.md','AGENTS.md','AI_WORK_STATE.md','QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md'].map(name=>path.join(root,name)).filter(fs.existsSync)
];
const secretFilePaths=secretScanFiles.map(f=>posix(path.relative(root,f))).filter(rel=>/(^|\/)(?:\.env(?:\.|$)|[^/]+\.(?:pem|key|p12|pfx)|id_rsa|credentials|secrets?\.json)$/i.test(rel));
const secretPatterns=[
  ['private-key',/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  ['github-token',/\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})\b/g],
  ['openai-key',/\bsk-[A-Za-z0-9_-]{20,}\b/g],
  ['aws-access-key',/\bAKIA[0-9A-Z]{16}\b/g]
];
const secretFindings=[];
for(const file of secretScanFiles){
  const rel=posix(path.relative(root,file));
  const text=fs.readFileSync(file,'utf8');
  for(const [kind,re] of secretPatterns){
    re.lastIndex=0; let m;
    while((m=re.exec(text))) secretFindings.push({file:rel,kind,index:m.index});
  }
}
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
const dynamicAttributeSinks=[];
const cssTextSinks=[];
const dynamicAttributeApprovals={
  'src/components/control.js':'restores the exact pre-existing form-field attribute snapshot; newly transferred attributes use Core.DOM safe projection',
  'src/core/dom.js':'canonical safe-attribute authority validates attribute names, executable attributes and URL schemes before writes',
  'src/core/domProjection.js':'canonical projection validates executable/URL attributes before every write and restores its own original snapshot',
  'src/core/formBridge.js':'restores the exact pre-existing authored form-control attribute snapshot'
};
for(const [file,text] of source){
  const attr=/([A-Za-z_$][A-Za-z0-9_$]*)\.setAttribute\s*\(\s*([^,\n]+),/g;
  let m;
  while((m=attr.exec(text))){
    const receiver=m[1], first=m[2].trim();
    if(['projection'].includes(receiver)) continue;
    if(!/^['"`][^'"`]+['"`]$/.test(first)) dynamicAttributeSinks.push({file,receiver,expression:first.slice(0,120),approved:!!dynamicAttributeApprovals[file],reason:dynamicAttributeApprovals[file]||''});
  }
  const cssAssignments=[...text.matchAll(/\.style\.cssText\s*=\s*([^;]+);/g)].map(match=>match[1].trim());
  const styleAttributes=occurrences(text,/setAttribute\s*\(\s*['"]style['"]/g).length;
  const cssCount=cssAssignments.length+styleAttributes;
  if(cssCount){
    const tagsClearOnly=file==='src/components/tags.js' && styleAttributes===0 && cssAssignments.every(value=>value==="''"||value==='""');
    const approved=tagsClearOnly || file==='src/core/focusScope.js';
    cssTextSinks.push({file,count:cssCount,approved,reason:tagsClearOnly?'only clears inline style before canonical style projection':file==='src/core/focusScope.js'?'framework-owned static focus-guard CSS':''});
  }
}

function fakeAttributeNode(tagName='A'){
  const attrs=new Map();
  return {
    tagName,
    getAttribute:name=>attrs.has(name)?attrs.get(name):null,
    hasAttribute:name=>attrs.has(name),
    setAttribute:(name,value)=>attrs.set(String(name),String(value)),
    removeAttribute:name=>attrs.delete(String(name))
  };
}
const securityProjection=DOMProjection.create();
const projectionNode=fakeAttributeNode('A');
let projectionSecurity={eventAttributeRejected:false,javascriptUrlRejected:false,obfuscatedJavascriptRejected:false,httpsAccepted:false};
try{securityProjection.setAttribute(projectionNode,'onclick','alert(1)');}catch{projectionSecurity.eventAttributeRejected=true;}
try{securityProjection.setAttribute(projectionNode,'href','javascript:alert(1)');}catch{projectionSecurity.javascriptUrlRejected=true;}
try{securityProjection.setAttribute(projectionNode,'href','java\u000Ascript:alert(1)');}catch{projectionSecurity.obfuscatedJavascriptRejected=true;}
projectionSecurity.httpsAccepted=securityProjection.setAttribute(projectionNode,'href','https://example.com/')===true && projectionNode.getAttribute('href')==='https://example.com/';
securityProjection.destroy();

const safeAttributeNode=fakeAttributeNode('A');
const safeAttributeSecurity={
  eventAttributeRejected:DOM.setSafeAttribute(safeAttributeNode,'onclick','alert(1)')===false && !safeAttributeNode.hasAttribute('onclick'),
  javascriptUrlRejected:DOM.setSafeAttribute(safeAttributeNode,'href','javascript:alert(1)')===false && !safeAttributeNode.hasAttribute('href'),
  obfuscatedJavascriptRejected:DOM.setSafeAttribute(safeAttributeNode,'href','java\u000Ascript:alert(1)')===false && !safeAttributeNode.hasAttribute('href'),
  styleAttributeRejected:DOM.setSafeAttribute(safeAttributeNode,'style','background:url(https://example.invalid/)')===false && !safeAttributeNode.hasAttribute('style'),
  httpsAccepted:DOM.setSafeAttribute(safeAttributeNode,'href','https://example.com/')===true && safeAttributeNode.getAttribute('href')==='https://example.com/'
};
const prototypeProbe=JSON.parse('{"__proto__":{"polluted":true},"constructor":{"polluted":true},"prototype":{"polluted":true},"safe":1}');
const patchedProbe=Utils.immutablePatch({},prototypeProbe,{});
const prototypeSecurity={
  prototypeIntact:Object.getPrototypeOf(patchedProbe)===Object.prototype,
  noDangerousOwnKeys:!Object.prototype.hasOwnProperty.call(patchedProbe,'__proto__')&&!Object.prototype.hasOwnProperty.call(patchedProbe,'constructor')&&!Object.prototype.hasOwnProperty.call(patchedProbe,'prototype'),
  safeKeyPreserved:patchedProbe.safe===1,
  globalPrototypeClean:Object.prototype.polluted===undefined
};
const contractPrototypeSecurity = {
  components: ComponentContracts.names.length,
  rejected: 0,
  failures: []
};
for (const name of ComponentContracts.names) {
  const contract = ComponentContracts.get(name);
  for (const key of ['__proto__','prototype','constructor']) {
    const input = JSON.parse('{"' + key + '":{"qxframePolluted":true}}');
    let rejected = false;
    try { ComponentContracts.validate(contract, input, name); } catch (_) { rejected = true; }
    if (rejected) contractPrototypeSecurity.rejected += 1;
    else contractPrototypeSecurity.failures.push({ name, key });
  }
}
const pollutionProbe = JSON.parse('{"__proto__":{"qxframePolluted":true},"constructor":{"prototype":{"qxframePolluted":true}},"safe":1}');
const mergedPollutionProbe = Utils.mergeOwn(pollutionProbe);
contractPrototypeSecurity.utilitySafe =
  mergedPollutionProbe.safe === 1 &&
  !Object.prototype.hasOwnProperty.call(mergedPollutionProbe,'__proto__') &&
  !Object.prototype.hasOwnProperty.call(mergedPollutionProbe,'constructor') &&
  Object.prototype.qxframePolluted === undefined;

const urlSinks=[];
for(const [file,text] of source){
  const sink=/(?:\.\s*(?:href|src|formAction)\s*=|setAttribute\s*\(\s*['"](?:href|src|action|formaction)['"])/g;
  const hits=occurrences(text,sink);
  if(!hits.length) continue;
  urlSinks.push({file,count:hits.length,urlPolicy:/\bURLPolicy\b/.test(text)});
}
const prototypeMergeCandidates=[];
for(const [file,text] of source){
  if(file.startsWith('src/vendor/')) continue;
  text.split(/\r?\n/).forEach((line,index)=>{
    if(/Object\.assign\s*\(/.test(line) || /Object\.keys\s*\([^\n]+\)\.forEach\s*\([^\n]+\[[^\]]+\]\s*=(?!=)/.test(line)) {
      prototypeMergeCandidates.push({file,line:index+1,text:line.trim().slice(0,260)});
    }
  });
}
function classifyPrototypeMerge(candidate){
  var file=candidate.file, fileText=source.get(file)||'', fullLine=(fileText.split(/\r?\n/)[candidate.line-1]||candidate.text), line=fullLine.trim();
  if(/Object\.assign\s*\(/.test(line)) return {approved:false,reason:'Object.assign is forbidden in owned source; use Utils.assignOwn/copyOwn.'};
  if(line.indexOf('Utils.safeOwnKey(')>=0) return {approved:true,reason:'dynamic key is guarded by canonical Utils.safeOwnKey'};
  if(file==='src/core/domTemplate.js') return {approved:true,reason:'refs/slots targets are null-prototype maps built from static DOMTemplate markers'};
  if(file==='src/core/motion.js' && line.indexOf('names[cssName(key)]')>=0) return {approved:true,reason:'motion property target is an Object.create(null) map'};
  if(file==='src/core/motionPresets.js') return {approved:true,reason:'keys come from the frozen framework-owned PRESETS constant'};
  if(file==='src/components/progress.js') return {approved:true,reason:'gradient keys are restricted to from/to/direction or percentage stops'};
  return {approved:false,reason:'unclassified dynamic object write'};
}
const classifiedPrototypeMergeCandidates=prototypeMergeCandidates.map(function(candidate){return Utils.assignOwn({},candidate,classifyPrototypeMerge(candidate));});
const unexpectedPrototypeMergeCandidates=classifiedPrototypeMergeCandidates.filter(function(candidate){return candidate.approved!==true;});
const rawPrimitives=[];
const asyncPrimitiveCandidates=[];
const asyncPrimitiveRules=[
  ['setTimeout',/\b(?:globalThis\.|global\.)?setTimeout\s*\(/g,['src/core/scheduler.js','src/core/motion.js','src/vendor/floating-ui.js']],
  ['setTimeout-reference',/\b(?:globalThis|global)\.setTimeout\b/g,['src/core/scheduler.js','src/core/motion.js','src/vendor/floating-ui.js']],
  ['clearTimeout',/\b(?:globalThis\.|global\.)?clearTimeout\s*\(/g,['src/core/scheduler.js','src/core/motion.js','src/vendor/floating-ui.js']],
  ['clearTimeout-reference',/\b(?:globalThis|global)\.clearTimeout\b/g,['src/core/scheduler.js','src/core/motion.js','src/vendor/floating-ui.js']],
  ['setInterval',/\b(?:globalThis\.|global\.)?setInterval\s*\(/g,[]],
  ['setInterval-reference',/\b(?:globalThis|global)\.setInterval\b/g,[]],
  ['clearInterval',/\b(?:globalThis\.|global\.)?clearInterval\s*\(/g,[]],
  ['clearInterval-reference',/\b(?:globalThis|global)\.clearInterval\b/g,[]],
  ['requestAnimationFrame',/\b(?:globalThis\.|global\.)?requestAnimationFrame\s*\(/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
  ['requestAnimationFrame-reference',/\b(?:globalThis|global)\.requestAnimationFrame\b/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
  ['cancelAnimationFrame-reference',/\b(?:globalThis|global)\.cancelAnimationFrame\b/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
  ['AbortController',/\bnew\s+(?:globalThis\.|global\.)?AbortController\s*\(/g,['src/core/motion.js']],
  ['AbortController-reference',/\b(?:globalThis|global)\.AbortController\b/g,['src/core/asyncTask.js','src/core/motion.js']],
  ['fetch',/\b(?:globalThis\.|global\.)?fetch\s*\(/g,[]],
  ['fetch-reference',/\b(?:globalThis|global)\.fetch\b/g,[]]
];
for(const [file,text] of source){
  for(const [kind,re,allowed] of asyncPrimitiveRules){
    const count=occurrences(text,re).length;
    if(count && !allowed.includes(file)) asyncPrimitiveCandidates.push({file,kind,count});
  }
}
const primitiveRules=[
 ['ResizeObserver',/new\s+(?:global(?:This)?\.)?ResizeObserver\s*\(/g,['src/core/observerHub.js','src/vendor/floating-ui.js']],
 ['MutationObserver',/new\s+(?:global(?:This)?\.)?MutationObserver\s*\(/g,['src/core/observerHub.js']],
 ['IntersectionObserver',/new\s+(?:global(?:This)?\.)?IntersectionObserver\s*\(/g,['src/core/observerHub.js','src/vendor/floating-ui.js']],
 ['requestAnimationFrame',/\brequestAnimationFrame\s*\(/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
 ['cancelAnimationFrame',/\bcancelAnimationFrame\s*\(/g,['src/core/scheduler.js','src/vendor/floating-ui.js']],
 ['addEventListener',/\.addEventListener\s*\(/g,['src/core/dom.js','src/core/motion.js','src/core/observerHub.js','src/vendor/floating-ui.js']],
 ['removeEventListener',/\.removeEventListener\s*\(/g,['src/core/dom.js','src/core/motion.js','src/core/observerHub.js','src/vendor/floating-ui.js']]
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
    if(/Migration[- ]stage|Runtime consumers remain on the legacy registry until Rollup cutover|TEMP-ESM-BRIDGE|\bStage\s+\d+\s*→\s*\d+|legacy-tail|extracted from (?:the )?frozen HOTFIX6/i.test(line)) staleComments.push({file,line:i+1,text:line.trim()});
  });
}
const activeMetadataFiles=[
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
const baselineApi=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/legacy-hotfix6/qxframe9a7c2-api.json'),'utf8'));
const baselineModules=JSON.parse(fs.readFileSync(path.join(root,'tools/fixtures/legacy-hotfix6/qxframe9a7c2-module-manifest.json'),'utf8'));
const currentApi=generateComponentApi({root});
const currentModules=generateModuleManifest({root});
const compatibility=JSON.parse(fs.readFileSync(path.join(root,'tools/manifests/compatibility.json'),'utf8'));
const json=v=>JSON.stringify(v);
const expectedApi=JSON.parse(JSON.stringify(baselineApi));
const authorizedApiRemovals=[];
for(const entry of compatibility.entries||[]){
  if(entry&&entry.kind==='option'&&entry.apiParityAction==='remove'){
    const component=(expectedApi.components||[]).find(record=>record&&record.name===entry.component);
    if(!component||!component.schema||!Object.prototype.hasOwnProperty.call(component.schema,entry.name)) throw new Error('Authorized API removal is absent from frozen baseline: '+entry.component+'.'+entry.name);
    delete component.schema[entry.name];
    authorizedApiRemovals.push(entry.component+'.'+entry.name);
  }
}
const comparableApi=JSON.parse(JSON.stringify(currentApi));
const addedApiOptions=[];
for(const component of comparableApi.components||[]){
  const expected=(expectedApi.components||[]).find(record=>record&&record.name===component.name);
  if(!expected||!component.schema||!expected.schema) continue;
  for(const name of Object.keys(component.schema)){
    if(Object.prototype.hasOwnProperty.call(expected.schema,name)) continue;
    addedApiOptions.push(component.name+'.'+name);
    delete component.schema[name];
  }
}
const apiParity=json(expectedApi)===json(comparableApi);
const moduleParity=json(baselineModules)===json(currentModules);

const oldBrowser=fs.readFileSync(path.join(root,'tools/fixtures/legacy-hotfix6/verify-browser.log'),'utf8');
const currentBrowser=fs.readFileSync(path.join(root,'tools/verify-browser-smoke.html'),'utf8');
const oldChecks=new Set([...oldBrowser.matchAll(/"name":"([^"]+)"/g)].map(m=>m[1]));
const currentChecks=new Set([...currentBrowser.matchAll(/(?:assert|record)\(\s*['"]([^'"]+)['"]/g)].map(m=>m[1]));
const missingBehavior=[...oldChecks].filter(x=>!currentChecks.has(x)).sort();
const addedBehavior=[...currentChecks].filter(x=>!oldChecks.has(x)).sort();

const duplicateBlocks=new Map();
for(const [file,text] of source){
  if(file.startsWith('src/vendor/')) continue;
  const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x && !x.startsWith('//') && !x.startsWith('/*') && !x.startsWith('*') && !x.startsWith('import '));
  for(let i=0;i+7<lines.length;i++){
    const block=lines.slice(i,i+8).join(' ').replace(/\s+/g,' ');
    if(block.length<360) continue;
    const key=block;
    let list=duplicateBlocks.get(key); if(!list) duplicateBlocks.set(key,list=[]);
    if(!list.some(x=>x.file===file)) list.push({file,line:i+1});
  }
}
const duplicates=[...duplicateBlocks.entries()].filter(([,locs])=>locs.length>1).map(([block,locs])=>({locs,preview:block.slice(0,220)})).slice(0,80);

const duplicateRegions=[];
for (const duplicate of duplicates) {
  const locs=duplicate.locs.slice().sort((a,b)=>a.file.localeCompare(b.file));
  const signature=locs.map(x=>x.file).join('|');
  let region=duplicateRegions.find(candidate=>{
    if(candidate.signature!==signature) return false;
    return locs.every(loc=>{
      const range=candidate.ranges[loc.file];
      return range && loc.line<=range.end+8 && loc.line>=range.start-8;
    });
  });
  if(!region){
    region={signature,files:locs.map(x=>x.file),ranges:{},windows:0,preview:duplicate.preview};
    locs.forEach(loc=>{region.ranges[loc.file]={start:loc.line,end:loc.line+7};});
    duplicateRegions.push(region);
  } else {
    locs.forEach(loc=>{
      const range=region.ranges[loc.file];
      range.start=Math.min(range.start,loc.line);
      range.end=Math.max(range.end,loc.line+7);
    });
  }
  region.windows+=1;
}
const allowedFamilyDuplicatePairs=new Map([
  ['src/components/drawer.js|src/components/modal.js','Modal and Drawer intentionally retain family-local transition/open-close orchestration while sharing OverlayFrameShell, OverlayFramePolicy, OverlayRuntime, Transition and Scroll canonical owners.']
]);
const allowedDuplicateRegions=duplicateRegions.filter(region=>allowedFamilyDuplicatePairs.has(region.signature)).map(function(region){
  return Utils.assignOwn({},region,{reason:allowedFamilyDuplicatePairs.get(region.signature)});
});
const unexpectedDuplicateRegions=duplicateRegions.filter(region=>!allowedFamilyDuplicatePairs.has(region.signature));

const report={
  ok:false,
  files:srcFiles.length,
  security:{htmlCodeSinks:security,dangerousProtocol,urlSinks,dynamicAttributeSinks,cssTextSinks,projectionSecurity,safeAttributeSecurity,prototypeSecurity,contractPrototypeSecurity,secretFilePaths,secretFindings},
  duplicateCapabilityCandidates:rawPrimitives,
  prototypeMergeCandidates:classifiedPrototypeMergeCandidates,
  unexpectedPrototypeMergeCandidates:unexpectedPrototypeMergeCandidates,
  asyncPrimitiveCandidates,
  staleMigrationComments:staleComments,
  staleActiveMetadata:staleMetadata,
  parity:{
    api:apiParity,
    authorizedApiRemovals,
    addedApiOptions,
    modules:moduleParity,
    baselineBrowserChecks:oldChecks.size,
    currentBrowserChecks:currentChecks.size,
    missingBehaviorChecks:missingBehavior,
    addedBehaviorChecks:addedBehavior
  },
  exactDuplicateBlocks:duplicates,
  duplicateRegions:duplicateRegions,
  allowedDuplicateRegions:allowedDuplicateRegions,
  unexpectedDuplicateRegions:unexpectedDuplicateRegions
};
report.ok=secretFilePaths.length===0&&secretFindings.length===0&&security.every(x=>x.approved)&&dangerousProtocol.length===0&&dynamicAttributeSinks.every(x=>x.approved)&&cssTextSinks.every(x=>x.approved)&&Object.values(projectionSecurity).every(Boolean)&&Object.values(safeAttributeSecurity).every(Boolean)&&Object.values(prototypeSecurity).every(Boolean)&&contractPrototypeSecurity.failures.length===0&&contractPrototypeSecurity.utilitySafe===true&&contractPrototypeSecurity.rejected===contractPrototypeSecurity.components*3&&urlSinks.every(x=>x.urlPolicy)&&unexpectedPrototypeMergeCandidates.length===0&&rawPrimitives.length===0&&asyncPrimitiveCandidates.length===0&&staleComments.length===0&&staleMetadata.length===0&&unexpectedDuplicateRegions.length===0&&apiParity&&moduleParity&&missingBehavior.length===0;
console.log(JSON.stringify(report,null,2));
if(!report.ok) process.exitCode=2;
