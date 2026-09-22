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
collect(path.join(root,'src/index.js'));
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe]){source=source.replace(re,(full,spec)=>{const target=resolve(file,spec);return target?full.replace(spec,'qx:/'+normalize(target)):full;});}source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`
import {QXFRAME9A7C2,Image,JSON as JSONView,Message,Notification,Pagination,Table,Tags,Upload} from 'qx:/src/index.js';
import {NoticeService} from 'qx:/src/core/noticeService.js';
const out=document.getElementById('result');
function a(v,m){if(!v)throw new Error(m)}
try{
 a(QXFRAME9A7C2.Components.Image.createPreview===Image.createPreview,'Image registry identity');
 a(QXFRAME9A7C2.Components.JSON.definition===JSONView.definition,'JSON registry identity');
 a(QXFRAME9A7C2.Components.Pagination.createDefaultDOM===Pagination.createDefaultDOM,'Pagination registry identity');
 a(QXFRAME9A7C2.Components.Table.sizes.join(',')===Table.sizes.join(','),'Table registry identity');
 a(QXFRAME9A7C2.Components.Tags.definition===Tags.definition,'Tags registry identity');
 a(QXFRAME9A7C2.Components.Upload.LIST_IGNORE===Upload.LIST_IGNORE,'Upload registry identity');
 a(QXFRAME9A7C2.Components.Message.info===Message.info,'Message registry identity');
 a(QXFRAME9A7C2.Components.Notification.info===Notification.info,'Notification registry identity');
 a(QXFRAME9A7C2.BuildingBlocks.NoticeService.utils===NoticeService.utils,'NoticeService registry identity');

 const ih=document.createElement('div');document.body.appendChild(ih);const image=Image.create({document,container:ih,src:'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==',preview:false});a(image.getRootElement().classList.contains('qxframe9a7c2-image'),'Image create');image.destroy();
 const jh=document.createElement('div');document.body.appendChild(jh);const json=JSONView.create({document,container:jh,data:{a:1,b:[2]}});a(json.getState().data.a===1,'JSON state');json.destroy();
 const ph=document.createElement('div');document.body.appendChild(ph);const pagination=Pagination.create({document,container:ph,count:45,current:2,pageSize:10});a(pagination.getState().current===2&&pagination.getState().pageCount===5,'Pagination state');pagination.setCurrent(3);a(pagination.getState().current===3,'Pagination setCurrent');pagination.destroy();
 const th=document.createElement('div');document.body.appendChild(th);const tags=Tags.create({document,container:th,items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}]});a(tags.getItems().length===2,'Tags items');tags.remove('a');a(tags.getItems().length===1,'Tags remove');tags.destroy();
 const uh=document.createElement('div');document.body.appendChild(uh);const upload=Upload.create({document,container:uh,autoUpload:false,value:[{uid:'u1',name:'a.txt',status:'success',url:'https://example.test/a.txt'}]});a(upload.getState().value.length===1,'Upload state');upload.clear();await Promise.resolve();a(upload.getState().value.length===0,'Upload clear');upload.destroy();
 const tabh=document.createElement('div');document.body.appendChild(tabh);const table=Table.create({document,container:tabh,columns:[{key:'name',field:'name',title:'Name'}],items:[{key:'r1',name:'Alpha'}]});a(table.getExportData().rows.length===1,'Table rows');a(table.getRootElement().classList.contains('qxframe9a7c2-table-wrap'),'Table root');table.destroy();
 const msg=Message.info('Hello',{document,duration:0});a(!!msg,'Message create');a(Message.getState().activeCount>=1,'Message state');Message.closeAll('verify');
 const note=Notification.info({document,content:'Notice',duration:0});a(!!note,'Notification create');a(Notification.getState().activeCount>=1,'Notification state');Notification.closeAll('verify');
 out.textContent='QX_TAIL:'+JSON.stringify({ok:true,modules:${files.size},image:true,json:true,pagination:true,tags:true,upload:true,table:true,message:true,notification:true,noticeService:true});
}catch(e){out.textContent='QX_TAIL:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)});}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile=path.join('/tmp','qx-tail-'+process.pid+'-'+Date.now());
const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});
const deadline=Date.now()+30000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout');
const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const m={id:n,method,params};if(sessionId)m.sessionId=sessionId;socket.send(JSON.stringify(m));});}
let targetId=null;try{({targetId}=await call('Target.createTarget',{url:'about:blank'}));const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);const tree=await call('Page.getFrameTree',{},sessionId);await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);let payload=null;const until=Date.now()+20000;while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r&&r.result&&r.result.value;if(typeof text==='string'&&text.startsWith('QX_TAIL:')){payload=JSON.parse(text.slice(8));break;}await new Promise(r=>setTimeout(r,100));}if(!payload)throw new Error('tail browser result timeout');if(!payload.ok)throw new Error(payload.error);console.log(JSON.stringify(payload));}finally{if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}}
