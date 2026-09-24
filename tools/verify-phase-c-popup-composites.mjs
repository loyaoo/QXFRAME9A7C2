import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { getWebSocketConstructor } from './websocket-client.mjs';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
const assert=(value,message)=>{if(!value)throw new Error(message);};
for(const rel of ['src/components/tree-select.js','src/components/cascader.js']){
  const text=fs.readFileSync(path.join(root,rel),'utf8');
  assert(/InteractionController\.create\s*\(/.test(text),rel+' must create InteractionController');
  assert(/CapabilityController\.create\s*\(/.test(text),rel+' must create CapabilityController');
  assert(/getInteractionController/.test(text)&&/getCapabilityController/.test(text),rel+' must expose Interaction/Capability owners');
  assert(/interaction:\s*['"]InteractionController['"]/.test(text)&&/capability:\s*['"]CapabilityController['"]/.test(text),rel+' profile ownership missing');
  assert(/FocusController\.forwardHandlers/.test(text),rel+' FocusController must forward to InteractionController');
  assert(!/onKeydown\s*:\s*function\s*\(event\)\s*\{\s*return\s+handleControlKeydown/.test(text),rel+' Control must not keep a parallel business keydown path');
  assert(!/CapabilityController\.mutationLocked\s*\(opts\)/.test(text),rel+' must not use static mutationLocked as local owner');
}
const cascaderSource=fs.readFileSync(path.join(root,'src/components/cascader.js'),'utf8');
assert(!/function handlePanelKeydown\s*\(/.test(cascaderSource),'Cascader stale panel keydown path must be removed');
if(!browser){console.log(JSON.stringify({ok:true,structural:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;let source=fs.readFileSync(file,'utf8');const specs=[];for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(source)))if(m[1].startsWith('.'))specs.push(m[1]);}files.set(file,source);for(const spec of specs)collect(resolve(file,spec));}
for(const f of ['src/components/tree-select.js','src/components/cascader.js']) collect(path.join(root,f));
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe])source=source.replace(re,(full,spec)=>{const resolved=resolve(file,spec);return resolved?full.replace(spec,'qx:/'+normalize(resolved)):full;});source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`import {TreeSelect} from 'qx:/src/components/tree-select.js';
import {Cascader} from 'qx:/src/components/cascader.js';
const out=document.getElementById('result');
function a(v,m){if(!v)throw new Error(m)}
function key(el,k,extra={}){const e=new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...extra});el.dispatchEvent(e);return e;}
function host(){const h=document.createElement('div');document.body.appendChild(h);return h;}
const treeItems=[{key:'a',value:'a',label:'Alpha'},{key:'b',value:'b',label:'Beta'},{key:'c',value:'c',label:'Gamma'}];
const cascadeItems=[{key:'a',value:'a',label:'A',items:[{key:'a1',value:'a1',label:'A1'}]},{key:'b',value:'b',label:'B'}];
try{
const tr=TreeSelect.create({document,container:host(),items:treeItems,defaultValue:'a',searchable:true,readOnly:true});const tri=tr.getInputElement();a(!!tr.getInteractionController()&&!!tr.getCapabilityController(),'tree controllers');a(tr.getCapabilityController().can('navigate')&&!tr.getCapabilityController().can('select'),'tree readonly capabilities');tri.focus();let e=key(tri,'ArrowDown');a(e.defaultPrevented&&tr.getState().open===true,'tree readonly opens');tr.getTree().setActiveKey('b',{source:'test'});const trv=tr.getState().value;e=key(tri,'Enter');a(e.defaultPrevented&&tr.getState().value===trv,'tree readonly selection blocked');tr.destroy();
const tl=TreeSelect.create({document,container:host(),items:treeItems,defaultValue:'a',searchable:true,busy:true});const tli=tl.getInputElement();tli.focus();key(tli,'ArrowDown');tl.getTree().setActiveKey('b',{source:'test'});const tlv=tl.getState().value;e=key(tli,'Enter');a(e.defaultPrevented&&tl.getState().value===tlv,'tree busy selection blocked');tl.destroy();
const td=TreeSelect.create({document,container:host(),items:treeItems,defaultValue:'a',disabled:true});const tdi=td.getInputElement();key(tdi,'ArrowDown');a(td.getState().open===false,'tree disabled cannot open');td.destroy();
const tm=TreeSelect.create({document,container:host(),items:treeItems,multiple:true,defaultValue:[],searchable:true});const tmi=tm.getInputElement();tmi.focus();key(tmi,'ArrowDown');tm.getTree().setActiveKey('a',{source:'test'});key(tmi,'Enter');a(tm.getState().value.includes('a'),'tree enter checks');tm.getTree().setActiveKey('b',{source:'test'});key(tmi,' ');a(tm.getState().value.includes('b'),'tree space checks');tm.destroy();
let treeProposal=null;const tc=TreeSelect.create({document,container:host(),items:treeItems,value:'a',searchable:true,onChange(v,d){treeProposal={v,controlled:d&&d.controlled===true};}});const tci=tc.getInputElement();tci.focus();key(tci,'ArrowDown');tc.getTree().setActiveKey('b',{source:'test'});key(tci,'Enter');a(tc.getState().value==='a'&&treeProposal&&treeProposal.v==='b'&&treeProposal.controlled===true,'tree controlled proposal only');tc.destroy();
const cr=Cascader.create({document,container:host(),items:cascadeItems,readOnly:true,searchable:true});const cri=cr.getControl().getFocusElement();a(!!cr.getInteractionController()&&!!cr.getCapabilityController(),'cascader controllers');cri.focus();e=key(cri,'ArrowDown');a(e.defaultPrevented&&cr.getState().open===true,'cascader readonly opens');e=key(cri,'Enter');a(e.defaultPrevented&&cr.getState().activeColumnIndex===1,'cascader readonly can enter child column');const crv=cr.getState().value;e=key(cri,'Enter');a(e.defaultPrevented&&cr.getState().value===crv,'cascader readonly leaf selection blocked');cr.destroy();
const cl=Cascader.create({document,container:host(),items:cascadeItems,busy:true});const cli=cl.getControl().getFocusElement();cli.focus();key(cli,'ArrowDown');key(cli,'Enter');const clv=cl.getState().value;e=key(cli,'Enter');a(e.defaultPrevented&&cl.getState().value===clv,'cascader loading leaf selection blocked');cl.destroy();
const cd=Cascader.create({document,container:host(),items:cascadeItems,disabled:true});const cdi=cd.getControl().getFocusElement();key(cdi,'ArrowDown');a(cd.getState().open===false,'cascader disabled cannot open');cd.destroy();
const rep=Cascader.create({document,container:host(),items:cascadeItems});const ri=rep.getControl().getFocusElement();ri.focus();e=key(ri,'Enter',{repeat:true});a(rep.getState().open===false&&!e.defaultPrevented,'cascader repeat activation suppressed');rep.destroy();
const cc=Cascader.create({document,container:host(),items:[{key:'b',value:'b',label:'B'}],value:'b'});const cci=cc.getControl().getFocusElement();cci.focus();key(cci,'ArrowDown');key(cci,'Enter');a(cc.getState().value==='b','cascader controlled value remains external');cc.destroy();
out.textContent='C4POP:'+JSON.stringify({ok:true,modules:${files.size}});
}catch(e){out.textContent='C4POP:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile='/tmp/qx-c4-pop-'+process.pid+'-'+Date.now();const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});const deadline=Date.now()+30000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout');const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const msg={id:n,method,params};if(sessionId)msg.sessionId=sessionId;socket.send(JSON.stringify(msg));});}let targetId=null;try{({targetId}=await call('Target.createTarget',{url:'about:blank'}));const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);const tree=await call('Page.getFrameTree',{},sessionId);await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);let payload=null;const until=Date.now()+20000;while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r?.result?.value;if(typeof text==='string'&&text.startsWith('C4POP:')){payload=JSON.parse(text.slice(6));break;}await new Promise(r=>setTimeout(r,100));}if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);console.log(JSON.stringify({...payload,structural:true}));}finally{if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
