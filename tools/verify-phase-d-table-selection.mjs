import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { TableModel } from '../src/core/tableModel.js';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const selectionControllerSource=fs.readFileSync(path.join(root,'src/core/selectionController.js'),'utf8');
const tableModelSource=fs.readFileSync(path.join(root,'src/core/tableModel.js'),'utf8');
const tableSource=fs.readFileSync(path.join(root,'src/components/table.js'),'utf8');
assert.match(selectionControllerSource,/remoteChannels/,'SelectionController must support remote semantic channels.');
assert.match(selectionControllerSource,/excluded\s*=\s*Selection\.create/,'remote exclusions must reuse Selection rather than a second selected-key Set.');
assert.doesNotMatch(selectionControllerSource,/excluded\s*=\s*new\s+Set/,'SelectionController remote channel must not create a Set truth.');
assert.match(tableModelSource,/SelectionController\.create\s*\(/,'TableModel must enter selection authority through SelectionController.');
assert.doesNotMatch(tableModelSource,/from ['"]\.\/selection\.js['"]/,'TableModel must not import Selection directly after migration.');
assert.match(tableModelSource,/DataRevision\.create\s*\(/,'TableModel must own dataset DataRevision.');
assert.match(tableSource,/model\.selectionController/,'Table must reuse TableModel SelectionController.');
assert.doesNotMatch(tableSource,/remoteSelection\s*=\s*\{[^}]*excludedKeys:\s*new\s+Set/,'Table must not retain component-local remote selection truth.');
assert.match(tableSource,/getSelectionController/,'Table must expose SelectionController.');
assert.match(tableSource,/selection:\s*['"]SelectionController['"]/,'Table ComponentProfile must declare SelectionController ownership.');

const model=TableModel.create({
  items:[{key:'a',name:'A'},{key:'b',name:'B'}],
  columns:[{key:'name',field:'name'}],
  selectionMode:'multiple'
});
assert.equal(model.selectionController.selected,model.selection,'TableModel selected store must be the controller channel identity.');
model.selectionController.setAnchor('selected','a');
const revision=model.dataRevision;
model.setItems([{key:'a',name:'A2'},{key:'c',name:'C'}],{silent:true});
assert.ok(model.dataRevision>revision,'TableModel dataset replacement must advance DataRevision.');
assert.equal(model.selectionController.getAnchor('selected'),null,'Table dataset revision must invalidate the old selection anchor.');
const remote=model.selectionController.getRemoteChannel('allMatching');
remote.setAllMatching('query-1',true,{silent:true});
remote.setKnownCount(100,{silent:true});
remote.toggle('a',false,{silent:true});
assert.deepEqual(remote.snapshot().excludedKeys,['a']);
assert.equal(remote.isSelected('a'),false);
assert.equal(remote.isSelected('z'),true);
assert.equal(remote.snapshot().knownCount,100);
assert.equal(remote.reconcileQuery('query-2',{silent:true}),true);
assert.equal(remote.snapshot().allMatching,false,'query revision changes must invalidate allMatching semantic state.');
model.destroy();

const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
if(!browser){console.log(JSON.stringify({ok:true,structural:true,node:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;let source=fs.readFileSync(file,'utf8');const specs=[];for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(source)))if(m[1].startsWith('.'))specs.push(m[1]);}files.set(file,source);for(const spec of specs)collect(resolve(file,spec));}
collect(path.join(root,'src/components/table.js'));
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe])source=source.replace(re,(full,spec)=>{const resolved=resolve(file,spec);return resolved?full.replace(spec,'qx:/'+normalize(resolved)):full;});source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`import {Table} from 'qx:/src/components/table.js';
const out=document.getElementById('result');const delay=ms=>new Promise(r=>setTimeout(r,ms));function a(v,m){if(!v)throw new Error(m)}
try{
const h=document.createElement('div');document.body.appendChild(h);let loads=0;const table=Table.create({document,container:h,selectionMode:'multiple',remoteSelectionScope:'query',pageSize:2,load:async q=>{loads++;await delay(5);return {items:q.search?[{key:'x',name:'X'}]:[{key:'a',name:'A'},{key:'b',name:'B'}],total:q.search?1:5,filteredTotal:q.search?1:5};},columns:[{key:'name',field:'name',title:'Name'}]});await delay(60);a(table.getSelectionController()===table.getModel().selectionController,'table/controller identity');a(table.getSelectionController().selected===table.getModel().selection,'table selected channel identity');table.selectVisible(true,{source:'test'});let state=table.getSelectionState();a(state.allMatching===true&&state.mode==='all-matching'&&state.knownCount===5,'query allMatching semantic');table.toggleSelected('a',false,{source:'test'});state=table.getSelectionState();a(state.excludedKeys.join(',')==='a'&&state.selectedKeys.length===0,'query exclusions do not materialize selectedKeys');table.setSearchValue('x',{source:'test'});state=table.getSelectionState();a(state.allMatching===false&&state.excludedKeys.length===0,'query fingerprint change invalidates allMatching');await delay(60);a(loads>=2,'remote reload after query change');table.destroy();
out.textContent='D3:'+JSON.stringify({ok:true,modules:${files.size}})}catch(e){out.textContent='D3:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile='/tmp/qx-d3-'+process.pid+'-'+Date.now();const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});const deadline=Date.now()+60000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout: '+stderr.slice(-1200));const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const msg={id:n,method,params};if(sessionId)msg.sessionId=sessionId;socket.send(JSON.stringify(msg));});}let targetId=null;try{({targetId}=await call('Target.createTarget',{url:'about:blank'}));const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);const tree=await call('Page.getFrameTree',{},sessionId);await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);let payload=null;const until=Date.now()+20000;while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r?.result?.value;if(typeof text==='string'&&text.startsWith('D3:')){payload=JSON.parse(text.slice(3));break;}await new Promise(r=>setTimeout(r,100));}if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);console.log(JSON.stringify({...payload,structural:true,node:true}));}finally{if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
