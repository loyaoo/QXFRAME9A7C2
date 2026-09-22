import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
if(!browser){console.log(JSON.stringify({ok:true,skipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient = await getWebSocketConstructor();

const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;const source=fs.readFileSync(file,'utf8');files.set(file,source);for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(source)))if(m[1].startsWith('.'))collect(resolve(file,m[1]));}}
const publicSubpaths=[];
for(const section of ['components','core','utils']){
  const dir=path.join(root,'src',section);
  for(const name of fs.readdirSync(dir).filter(name=>name.endsWith('.js')).sort()){
    const file=path.join(dir,name);
    publicSubpaths.push('qx:/'+normalize(file));
    collect(file);
  }
}
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe]){source=source.replace(re,(full,spec)=>{const target=resolve(file,spec);return target?full.replace(spec,'qx:/'+normalize(target)):full;});}source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const directImports=JSON.stringify(publicSubpaths);
const test=`
import { Control } from 'qx:/src/components/control.js';
import { Transfer } from 'qx:/src/components/transfer.js';
const out=document.getElementById('result');
function a(v,m){if(!v)throw new Error(m)}
try{
 const directPaths=${directImports};
 const directModules=await Promise.all(directPaths.map(specifier=>import(specifier)));
 a(directModules.length===directPaths.length,'all public preserveModules subpaths import independently');
 a(!('configureControlDependencies' in (await import('qx:/src/components/control.js'))),'Control migration injector removed');
 a(!('configureTransferDependencies' in (await import('qx:/src/components/transfer.js'))),'Transfer migration injector removed');
 const ch=document.createElement('div');document.body.appendChild(ch);
 const control=Control.create({document,container:ch,mode:'tags',tags:[{key:'a',value:'a',label:'A'}]});
 a(control.getTags()&&control.getTags().getItems().length===1,'Control direct subpath tags dependency');
 control.destroy();
 const th=document.createElement('div');document.body.appendChild(th);
 const transfer=Transfer.create({document,container:th,items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}],value:['b'],pagination:{pageSize:1},table:true});
 const state=transfer.getState();
 a(state.sourcePagination&&state.targetPagination,'Transfer direct subpath pagination dependency');
 a(state.sourceProjection==='table'&&state.targetProjection==='table','Transfer direct subpath table dependency');
 a(transfer.getSourceTable()&&transfer.getTargetTable(),'Transfer table controllers');
 transfer.destroy();
 out.textContent='QX_SUBPATH:'+JSON.stringify({ok:true,modules:${files.size},publicSubpaths:directPaths.length,controlTags:true,transferPagination:true,transferTable:true,runtimeAssemblyRequired:false});
}catch(e){out.textContent='QX_SUBPATH:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)});}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile=path.join('/tmp','qx-subpath-'+process.pid+'-'+Date.now());
const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});
const deadline=Date.now()+30000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout: '+stderr);
const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const m={id:n,method,params};if(sessionId)m.sessionId=sessionId;socket.send(JSON.stringify(m));});}
let targetId=null;try{({targetId}=await call('Target.createTarget',{url:'about:blank'}));const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);const tree=await call('Page.getFrameTree',{},sessionId);await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);let payload=null;const until=Date.now()+20000;while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r&&r.result&&r.result.value;if(typeof text==='string'&&text.startsWith('QX_SUBPATH:')){payload=JSON.parse(text.slice(11));break;}await new Promise(r=>setTimeout(r,100));}if(!payload)throw new Error('preserve-subpath browser result timeout');if(!payload.ok)throw new Error(payload.error);console.log(JSON.stringify(payload));}finally{if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}}
