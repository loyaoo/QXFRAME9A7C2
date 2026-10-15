// Stage 5 explicit user authorization: InputOTP root semantics, Overlay/Modal
// lifecycle, Cascader geometry, Popconfirm compact buttons, Tabs segmented default,
// DatePicker geometry and Calendar date-cell visual wrappers (2026-10-14 owner request).
// Added canonical DatePicker header capability contract and shared WheelMetrics
// five-size mapping (2026-10-15 owner approval); no unrelated JS deviations.
// Calendar click/hover/key handlers and Tree, TreeSelect and Controller sources stay unchanged.
// All unrelated JS sources must still match main exactly.
// Verify all other JS sources, enforce exact allowlist, and compare two builds
// of this HEAD byte-for-byte (rather than incorrectly claiming JS == main).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const refArg=process.argv.find(x=>x.startsWith('--reference='));
if(!refArg){console.error('usage: --reference=<main checkout>/dist');process.exit(2)}
const reference=path.resolve(refArg.slice('--reference='.length));
const mainRoot=path.dirname(reference),dist=path.join(root,'dist');
const EXCLUDED=new Set(['qxframe9a7c2.css']);
const AUTHORIZED=new Set(['src/components/input-otp.js','src/components/modal.js','src/components/overlay-frame-runtime.js','src/components/cascader.js','src/components/popconfirm.js','src/components/tabs.js','src/components/date-picker.js','src/components/calendar.js','src/components/period-panel.js','src/components/image.js','src/components/tags.js','src/components/dropdown.js','src/core/componentContracts.js','src/utils/wheelMetrics.js']);
function walk(dir,base=dir){
 if(!fs.existsSync(dir))return[];
 return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
   const full=path.join(dir,e.name);
   return e.isDirectory()?walk(full,base):[path.relative(base,full).replaceAll('\\','/')];
 }).sort();
}
function bytes(p){return fs.existsSync(p)?fs.readFileSync(p):null}
const names=(arr)=>arr.filter(x=>!EXCLUDED.has(x));
const ours=names(walk(dist)),theirs=names(walk(reference));
const missing=theirs.filter(x=>!ours.includes(x)),extra=ours.filter(x=>!theirs.includes(x));
const changed=ours.filter(x=>theirs.includes(x)&&!bytes(path.join(dist,x)).equals(bytes(path.join(reference,x))));
const sourcePaths=new Set([...walk(path.join(root,'src')).filter(x=>x.endsWith('.js')),...walk(path.join(mainRoot,'src')).filter(x=>x.endsWith('.js'))]);
const sourceChanges=[...sourcePaths].filter(x=>{
 const a=bytes(path.join(root,'src',x)),b=bytes(path.join(mainRoot,'src',x));
 return !a||!b||!a.equals(b);
}).map(x=>'src/'+x).sort();
// Tree and TreeSelect are identical to main; do not authorize runtime/schema deviations.
const unauthorized=sourceChanges.filter(x=>!AUTHORIZED.has(x));

let repeatable=true;
if(sourceChanges.length){
 const first=new Map(ours.map(x=>[x,bytes(path.join(dist,x))]));
 const build=spawnSync(process.execPath,[path.join(root,'tools/build-release.mjs')],{cwd:root,encoding:'utf8',timeout:180000});
 if(build.status!==0){repeatable=false;console.error('[js-build] second current-HEAD build failed',build.stderr?.slice(-2000),build.stdout?.slice(-2000))}
 else {
  const again=names(walk(dist));
  repeatable=again.length===ours.length&&ours.every(x=>again.includes(x)&&first.get(x).equals(bytes(path.join(dist,x))));
 }
}
for(const p of unauthorized)console.error('[js-build] unauthorized JS source difference: '+p);
for(const p of missing)console.error('[js-build] missing vs main: '+p);
for(const p of extra)console.error('[js-build] extra vs main: '+p);
if(!sourceChanges.length)for(const p of changed)console.error('[js-build] differs from main without authorized source: '+p);
const ok=!missing.length&&!extra.length&&!unauthorized.length&&ours.length>0&&repeatable&&(!changed.length||sourceChanges.length>0);
console.log(JSON.stringify({ok,compared:ours.length,missing:missing.length,extra:extra.length,changed:changed.length,sourceChanges,unauthorized,repeatable}));
process.exit(ok?0:1);
