import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const source=fs.readFileSync(path.join(root,'src/components/tags.js'),'utf8');
assert.match(source,/selectionController\.js/,'Tags must enter selection authority through SelectionController.');
assert.doesNotMatch(source,/from ['"]\.\.\/core\/selection\.js['"]/,'Tags must not import Selection directly.');
assert.match(source,/SelectionController\.create\s*\(/,'Tags must create SelectionController.');
assert.match(source,/getSelectionController/,'Tags must expose SelectionController.');
assert.match(source,/selection:\s*['"]SelectionController['"]/,'Tags profile must declare SelectionController ownership.');
assert.match(source,/advanceDataRevision\(['"]selected['"]\)/,'Tags item mutations must advance selection dataset revision.');

const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
if(!browser){console.log(JSON.stringify({ok:true,structural:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;let src=fs.readFileSync(file,'utf8');const specs=[];for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(src)))if(m[1].startsWith('.'))specs.push(m[1]);}files.set(file,src);for(const spec of specs)collect(resolve(file,spec));}
collect(path.join(root,'src/components/tags.js'));
const imports={};
for(const [file,raw] of files){let src=raw;for(const re of [depRe,dynamicRe])src=src.replace(re,(full,spec)=>{const resolved=resolve(file,spec);return resolved?full.replace(spec,'qx:/'+normalize(resolved)):full;});src+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(src).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`import {Tags} from 'qx:/src/components/tags.js';
const out=document.getElementById('result');function a(v,m){if(!v)throw new Error(m)}function host(){const h=document.createElement('div');document.body.appendChild(h);return h;}
try{
const tags=Tags.create({document,container:host(),items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}],checkable:true,defaultValue:['a']});
const sc=tags.getSelectionController();a(!!sc&&sc.selected===tags.getSelection(),'Tags selected channel identity');a(tags.getState().value.join(',')==='a','initial defaultValue');
sc.setAnchor('selected','a');const rev=sc.getDataRevision('selected');
tags.setItems([{key:'b',value:'b',label:'B'},{key:'c',value:'c',label:'C'}],{silent:true,source:'verify',reason:'replace'});
a(sc.getDataRevision('selected')>rev,'Tags data revision advances on silent item replacement');a(sc.getAnchor('selected')===null,'Tags stale anchor invalidated');a(tags.getSelection().values.length===0,'Tags selection pruned to current items');tags.destroy();
let proposal=null;
const controlled=Tags.create({document,container:host(),items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}],checkable:true,value:['a'],onChange(v,d){proposal={value:v.slice(),controlled:d&&d.valueControlled===true,proposed:Array.isArray(d&&d.proposedValue)?d.proposedValue.slice():null};}});
const csc=controlled.getSelectionController();a(csc.selected===controlled.getSelection(),'controlled Tags channel identity');
controlled.toggle('b',true,{user:true,source:'keyboard',reason:'verify'});
a(controlled.getState().value.join(',')==='a','controlled Tags must not internally commit');
a(proposal&&proposal.value.join(',')==='a,b'&&proposal.controlled&&proposal.proposed.join(',')==='a,b','controlled Tags proposal semantics');
controlled.updateOptions({value:['a','b']});a(controlled.getSelection().values.join(',')==='a,b','external sync projects into controller channel');controlled.destroy();
out.textContent='D4TAGS:'+JSON.stringify({ok:true,modules:${files.size}});
}catch(e){out.textContent='D4TAGS:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile='/tmp/qx-d4-tags-'+process.pid+'-'+Date.now();
const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});
const deadline=Date.now()+30000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout');
const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});
let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};
function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const msg={id:n,method,params};if(sessionId)msg.sessionId=sessionId;socket.send(JSON.stringify(msg));});}
let targetId=null;
try{
  ({targetId}=await call('Target.createTarget',{url:'about:blank'}));
  const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});
  await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);
  const tree=await call('Page.getFrameTree',{},sessionId);
  await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);
  let payload=null;const until=Date.now()+20000;
  while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r?.result?.value;if(typeof text==='string'&&text.startsWith('D4TAGS:')){payload=JSON.parse(text.slice(7));break;}await new Promise(r=>setTimeout(r,100));}
  if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);
  console.log(JSON.stringify({...payload,structural:true}));
}finally{
  if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});
  try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
}
