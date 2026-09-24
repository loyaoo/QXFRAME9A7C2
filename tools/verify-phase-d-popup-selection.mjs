import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
for(const rel of ['src/components/select.js','src/components/tree-select.js','src/components/cascader.js']){
  const source=fs.readFileSync(path.join(root,rel),'utf8');
  assert.match(source,/getSelectionController/,(rel+' must expose SelectionController'));
  assert.match(source,/selection:\s*['"]SelectionController['"]/,(rel+' must declare SelectionController ownership'));
}
const cascaderSource=fs.readFileSync(path.join(root,'src/components/cascader.js'),'utf8');
assert.match(cascaderSource,/SelectionController\.create\s*\(/,'Cascader must create SelectionController');
assert.doesNotMatch(cascaderSource,/from ['"]\.\.\/core\/(?:selection|hierarchicalSelection)\.js['"]/,'Cascader must not import direct Selection/HierarchicalSelection owners');
assert.match(cascaderSource,/selectionController\.createHierarchy\s*\(/,'Cascader hierarchy must delegate through SelectionController');
assert.doesNotMatch(cascaderSource,/var\s+selectionAnchorValue\b/,'Cascader must not retain component-local selection anchor truth');
assert.match(cascaderSource,/advanceDataRevision\(['"]selected['"]\)/,'Cascader data/lazy changes must advance selection revision');

const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
if(!browser){console.log(JSON.stringify({ok:true,structural:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;let source=fs.readFileSync(file,'utf8');const specs=[];for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(source)))if(m[1].startsWith('.'))specs.push(m[1]);}files.set(file,source);for(const spec of specs)collect(resolve(file,spec));}
for(const file of ['src/components/select.js','src/components/tree-select.js','src/components/cascader.js']) collect(path.join(root,file));
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe])source=source.replace(re,(full,spec)=>{const resolved=resolve(file,spec);return resolved?full.replace(spec,'qx:/'+normalize(resolved)):full;});source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`import {Select} from 'qx:/src/components/select.js';
import {TreeSelect} from 'qx:/src/components/tree-select.js';
import {Cascader} from 'qx:/src/components/cascader.js';
const out=document.getElementById('result');function a(v,m){if(!v)throw new Error(m)}function host(){const h=document.createElement('div');document.body.appendChild(h);return h;}
try{
const sel=Select.create({document,container:host(),items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}],defaultValue:'a'});
a(sel.getSelectionController()===sel.getOptionList().getSelectionController(),'Select must reuse OptionList controller');
a(sel.getSelectionController().selected===sel.getOptionList().getSelection(),'Select selected store identity');sel.destroy();

const tree=TreeSelect.create({document,container:host(),items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}],checkable:true,multiple:true,defaultValue:['a']});
a(tree.getSelectionController()===tree.getTree().getSelectionController(),'TreeSelect must reuse Tree controller');
a(tree.getSelectionController().hasChannel('selected')&&tree.getSelectionController().hasChannel('checked'),'TreeSelect selected/checked channels');tree.destroy();

const casc=Cascader.create({document,container:host(),items:[{key:'a',value:'a',label:'A'},{key:'b',value:'b',label:'B'}],defaultValue:'a'});
const sc=casc.getSelectionController();a(!!sc&&sc.hasChannel('selected'),'Cascader selected channel');
sc.setAnchor('selected','a');const rev=sc.getDataRevision('selected');
casc.setItems([{key:'b',value:'b',label:'B'},{key:'c',value:'c',label:'C'}]);
a(sc.getDataRevision('selected')>rev,'Cascader dataset revision advances');
a(sc.getAnchor('selected')===null,'Cascader stale anchor invalidated');
a(casc.getState().selectionAnchorValue===null||casc.getState().selectionAnchorValue==='b'||casc.getState().selectionAnchorValue==='c','Cascader state anchor comes from controller');
casc.destroy();
out.textContent='D5:'+JSON.stringify({ok:true,modules:${files.size}});
}catch(e){out.textContent='D5:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile='/tmp/qx-d5-'+process.pid+'-'+Date.now();
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
  while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r?.result?.value;if(typeof text==='string'&&text.startsWith('D5:')){payload=JSON.parse(text.slice(3));break;}await new Promise(r=>setTimeout(r,100));}
  if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);
  console.log(JSON.stringify({...payload,structural:true}));
}finally{
  if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});
  try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
}
