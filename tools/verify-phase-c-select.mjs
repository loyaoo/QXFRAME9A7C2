import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cp from 'node:child_process';
import { getWebSocketConstructor } from './websocket-client.mjs';
const __filename=fileURLToPath(import.meta.url);
const root=path.resolve(path.dirname(__filename),'..');
const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
const assert=(value,message)=>{if(!value)throw new Error(message);};
const source=fs.readFileSync(path.join(root,'src/components/select.js'),'utf8');
assert(/InteractionController\.create\s*\(/.test(source),'Select must create InteractionController');
assert(/CapabilityController\.create\s*\(/.test(source),'Select must create CapabilityController');
assert(/getInteractionController/.test(source)&&/getCapabilityController/.test(source),'Select must expose Interaction/Capability owners');
assert(/interaction:\s*['"]InteractionController['"]/.test(source)&&/capability:\s*['"]CapabilityController['"]/.test(source),'Select profile must declare Interaction/Capability ownership');
assert(!/CapabilityController\.mutationLocked\s*\(opts\)/.test(source),'Select must not use static mutationLocked as local authority');
assert(/FocusController\.forwardHandlers\([^\n]+dispatchInteraction/.test(source),'Select FocusController must forward semantic keyboard handling to InteractionController');
assert(!/handlers:\s*\{[\s\S]{0,1800}ArrowDown:\s*function/.test(source),'Select must not retain a parallel physical-key handler map');
const fieldSource=fs.readFileSync(path.join(root,'src/components/field.js'),'utf8');
assert(/canOpen\(capabilities = \{\}\).*CapabilityController\.allows\('open'/.test(fieldSource.replace(/\n/g,' ')),'FieldComponent must expose open capability semantics');
const popupFieldSource=fs.readFileSync(path.join(root,'src/components/popup-field.js'),'utf8');
assert(/this\.canOpen\(\)/.test(popupFieldSource)&&! /canActivate\(\{ preserveFocusWhileLoading: true \}\)/.test(popupFieldSource),'PopupField open lifecycle must use open capability rather than activation');
const policySource=fs.readFileSync(path.join(root,'src/core/interactionPolicy.js'),'utf8');
assert(/var expandable = !disabled && caps\.expandable !== false/.test(policySource),'loading/readOnly popup browsing must remain expandable unless disabled');
if(!browser){console.log(JSON.stringify({ok:true,structural:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;let source=fs.readFileSync(file,'utf8');const specs=[];for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(source)))if(m[1].startsWith('.'))specs.push(m[1]);}files.set(file,source);for(const spec of specs)collect(resolve(file,spec));}
collect(path.join(root,'src/components/select.js'));
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe]){source=source.replace(re,(full,spec)=>{const resolved=resolve(file,spec);return resolved?full.replace(spec,'qx:/'+normalize(resolved)):full;});}source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`import {Select} from 'qx:/src/components/select.js';
const out=document.getElementById('result');
function a(v,m){if(!v)throw new Error(m)}
function key(el,k,extra={}){const e=new KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...extra});el.dispatchEvent(e);return e;}
function host(){const h=document.createElement('div');document.body.appendChild(h);return h;}
function make(options={}){return Select.create({document,container:host(),items:[{key:'a',value:'a',label:'Alpha'},{key:'b',value:'b',label:'Beta'},{key:'c',value:'c',label:'Gamma'}],defaultValue:'a',searchable:true,...options});}
try{
const ro=make({readOnly:true});const roi=ro.getControl().getFocusElement();a(!!ro.getInteractionController()&&!!ro.getCapabilityController(),'select controllers');a(ro.getCapabilityController().can('navigate')&&!ro.getCapabilityController().can('select'),'readonly capabilities');roi.focus();let e=key(roi,'ArrowDown');a(e.defaultPrevented&&ro.getState().open===true,'readonly opens for browse');const roValue=ro.getState().value;const roActive0=ro.getState().activeKey;key(roi,'ArrowDown');a(ro.getState().activeKey!==roActive0,'readonly navigates options');e=key(roi,'Enter');a(e.defaultPrevented&&ro.getState().value===roValue,'readonly selection blocked');ro.destroy();
const busy=make({loading:true});const bi=busy.getControl().getFocusElement();bi.focus();e=key(bi,'ArrowDown');a(e.defaultPrevented&&busy.getState().open===true,'loading opens for browse');const busyValue=busy.getState().value;key(bi,'ArrowDown');const busyActive=busy.getState().activeKey;e=key(bi,'Enter');a(e.defaultPrevented&&busy.getState().value===busyValue&&busy.getState().activeKey===busyActive,'loading blocks select but preserves cursor');busy.destroy();
const dis=make({disabled:true});const di=dis.getControl().getFocusElement();e=key(di,'ArrowDown');a(dis.getState().open===false,'disabled cannot open');dis.destroy();
const rep=make();const ri=rep.getControl().getFocusElement();ri.focus();e=key(ri,'Enter',{repeat:true});a(rep.getState().open===false&&!e.defaultPrevented,'repeat activation suppressed while closed');e=key(ri,'Enter');a(rep.getState().open===true&&e.defaultPrevented,'normal Enter opens');const repValue=rep.getState().value;rep.getOptionList().focusLast();const beforeActive=rep.getState().activeKey;e=key(ri,'Enter',{repeat:true});a(rep.getState().value===repValue&&rep.getState().activeKey===beforeActive&&!e.defaultPrevented,'repeat activation suppressed while open');rep.destroy();
const ime=make();const ii=ime.getControl().getFocusElement();ii.focus();key(ii,'ArrowDown');const imeValue=ime.getState().value;ime.getOptionList().focusLast();e=key(ii,'Enter',{isComposing:true});a(ime.getState().value===imeValue&&!e.defaultPrevented,'IME Enter passes without commit');ime.destroy();
let proposed=null;const controlled=make({controlled:true,value:'a',defaultValue:undefined,onChange(value,detail){proposed={value,controlled:detail&&detail.controlled===true};}});const ci=controlled.getControl().getFocusElement();ci.focus();key(ci,'ArrowDown');controlled.getOptionList().focusLast();key(ci,'Enter');a(controlled.getState().value==='a'&&proposed&&proposed.value==='c'&&proposed.controlled===true,'controlled Select emits proposal without internal commit');controlled.updateOptions({value:'c'});a(controlled.getState().value==='c','controlled Select external sync remains canonical');controlled.destroy();
const native=make({multiple:true,defaultValue:['a','b']});const ni=native.getControl().getFocusElement();ni.focus();ni.value='xy';ni.setSelectionRange(1,1);const tagState0=native.getControl().getTags().getState();e=key(ni,'ArrowLeft');const tagState1=native.getControl().getTags().getState();a(!e.defaultPrevented&&JSON.stringify(tagState0)===JSON.stringify(tagState1),'native caret ArrowLeft preserved');native.destroy();
out.textContent='C4SELECT:'+JSON.stringify({ok:true,modules:${files.size}});
}catch(e){out.textContent='C4SELECT:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile='/tmp/qx-c4-select-'+process.pid+'-'+Date.now();const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});const deadline=Date.now()+30000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout');const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const msg={id:n,method,params};if(sessionId)msg.sessionId=sessionId;socket.send(JSON.stringify(msg));});}let targetId=null;try{({targetId}=await call('Target.createTarget',{url:'about:blank'}));const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);const tree=await call('Page.getFrameTree',{},sessionId);await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);let payload=null;const until=Date.now()+20000;while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r?.result?.value;if(typeof text==='string'&&text.startsWith('C4SELECT:')){payload=JSON.parse(text.slice(9));break;}await new Promise(r=>setTimeout(r,100));}if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);console.log(JSON.stringify({...payload,structural:true}));}finally{if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true})}catch{}}
