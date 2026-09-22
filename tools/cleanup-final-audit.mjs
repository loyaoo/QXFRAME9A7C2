import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const posix=p=>p.split(path.sep).join('/');
function walk(dir,pred=()=>true){
  if(!fs.existsSync(dir)) return [];
  const out=[];
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const f=path.join(dir,e.name);
    if(e.isDirectory()) out.push(...walk(f,pred));
    else if(e.isFile()&&pred(f)) out.push(f);
  }
  return out;
}

// 1) Remove migration-only headers from canonical source.
let headerFiles=0, headerLines=0;
for(const base of ['src/core','src/utils']){
  for(const file of walk(path.join(root,base),f=>/\.js$/.test(f))){
    const before=fs.readFileSync(file,'utf8');
    const lines=before.split(/\r?\n/);
    const kept=[];
    let removed=0;
    for(let i=0;i<lines.length;i++){
      if(i<4 && /Migration stage 20→30: real ESM candidate extracted from the frozen HOTFIX6 kernel\.|Runtime consumers remain on the legacy registry until Rollup cutover; parity is enforced by tools\/verify-esm-core-parity\.mjs\./.test(lines[i])){
        removed++; continue;
      }
      kept.push(lines[i]);
    }
    while(kept.length>1 && kept[0]==='' && kept[1]==='') kept.shift();
    if(removed){
      fs.writeFileSync(file,kept.join('\n'));
      headerFiles++; headerLines+=removed;
    }
  }
}

// 2) Repair stale manifest references.
{
  const file=path.join(root,'tools/manifests/canonical-systems.json');
  const json=JSON.parse(fs.readFileSync(file,'utf8'));
  const owners=json.systems['Z-index']?.canonicalOwner||[];
  json.systems['Z-index'].canonicalOwner=owners.map(x=>x==='src/manifests/layers.json'?'tools/manifests/layers.json':x);
  fs.writeFileSync(file,JSON.stringify(json,null,2)+'\n');
}
{
  const file=path.join(root,'tools/manifests/family-capabilities.json');
  const json=JSON.parse(fs.readFileSync(file,'utf8'));
  const entry=json.capabilities.find(x=>x.id==='listener-lifecycle');
  if(!entry) throw new Error('listener-lifecycle capability missing');
  entry.consumers=['interactive component/core runtimes via Component.listen / Core.DOM.listen'];
  fs.writeFileSync(file,JSON.stringify(json,null,2)+'\n');
}

// 3) Archive obsolete root evidence after checking active code/tools do not depend on it.
const rootEntries=fs.readdirSync(root,{withFileTypes:true});
const candidates=rootEntries.filter(e=>e.isFile() && (/^FIX11-/.test(e.name)||(/^MIGRATION-ESM-/.test(e.name)))).map(e=>e.name);
const activeFiles=[
  ...walk(path.join(root,'src'),f=>/\.(?:js|mjs|json|css)$/.test(f)),
  ...walk(path.join(root,'tools'),f=>/\.(?:js|mjs|json)$/.test(f) && path.basename(f)!=='cleanup-final-audit.mjs'),
  path.join(root,'package.json'),path.join(root,'README.md'),path.join(root,'MIGRATION-src-dist-unified.md')
].filter(fs.existsSync);
const references=[];
for(const file of activeFiles){
  const text=fs.readFileSync(file,'utf8');
  for(const name of candidates) if(text.includes(name)) references.push({file:posix(path.relative(root,file)),name});
  if(text.includes('migration-logs/')) references.push({file:posix(path.relative(root,file)),name:'migration-logs/'});
}
if(references.length) throw new Error('Active files still reference historical evidence: '+JSON.stringify(references));

const archive=path.join(root,'archive/legacy-migration');
fs.mkdirSync(archive,{recursive:true});
for(const name of candidates) fs.renameSync(path.join(root,name),path.join(archive,name));
if(fs.existsSync(path.join(root,'migration-logs'))){
  const target=path.join(archive,'migration-logs');
  if(fs.existsSync(target)) fs.rmSync(target,{recursive:true,force:true});
  fs.renameSync(path.join(root,'migration-logs'),target);
}
fs.writeFileSync(path.join(archive,'README.md'),`# Legacy migration archive

This directory contains historical FIX11 / ESM migration reports, logs, hashes and patches.

It is **not** a source of current architecture, runtime behavior, API contracts, build rules or release truth.
Current authority is:

- \`src/\` for implementation;
- \`tools/manifests/\` for machine-readable architecture metadata;
- root \`README.md\` and \`QXFRAME9A7C2-重构开发规范手册-整合重写版.md\` for current maintenance rules;
- \`migration/baseline-hotfix6-2026-09-22/\` only for frozen legacy parity evidence.

The Git history preserves the original root locations.
`);

console.log(JSON.stringify({ok:true,headerFiles,headerLines,archivedRootFiles:candidates.length,migrationLogsArchived:fs.existsSync(path.join(archive,'migration-logs'))}));
