import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const popupSource=read('src/components/popup.js');
const popupFieldSource=read('src/components/popup-field.js');
const overlaySource=read('src/components/overlay.js');
const modalSource=read('src/components/modal.js');
const drawerSource=read('src/components/drawer.js');

assert.match(popupSource,/getOverlayController\(\)[\s\S]{0,180}this\.getTrigger\(\)/,'PopupComponent must forward OverlayController through getTrigger().');
assert.match(popupSource,/getMotionController\(\)[\s\S]{0,180}this\.getTrigger\(\)/,'PopupComponent must forward MotionController through getTrigger().');
assert.match(popupFieldSource,/getOverlayController\(\)[\s\S]{0,180}this\.getTrigger\(\)/,'PopupFieldComponent must forward OverlayController through getTrigger().');
assert.match(popupFieldSource,/getMotionController\(\)[\s\S]{0,180}this\.getTrigger\(\)/,'PopupFieldComponent must forward MotionController through getTrigger().');
assert.match(overlaySource,/adoptOverlayFamilyController\(/,'OverlayComponent must name the family logical controller explicitly.');
assert.match(overlaySource,/getOverlayFamilyController\(\)/,'OverlayComponent must expose the family logical controller explicitly.');
assert.match(overlaySource,/getOverlayResourceController\(\)/,'OverlayComponent must reserve a distinct physical resource-controller accessor.');
assert.match(overlaySource,/getOverlayController\(\)\s*\{\s*return this\.getOverlayFamilyController\(\);\s*\}/,'Legacy getOverlayController must stay a compatibility alias for the family controller.');
assert.doesNotMatch(modalSource,/this\.adoptOverlayController\(/,'Modal internals must not use the ambiguous legacy adoptOverlayController name.');
assert.doesNotMatch(drawerSource,/this\.adoptOverlayController\(/,'Drawer internals must not use the ambiguous legacy adoptOverlayController name.');
assert.match(modalSource,/this\.adoptOverlayFamilyController\(/,'Modal must use explicit family-controller naming.');
assert.match(drawerSource,/this\.adoptOverlayFamilyController\(/,'Drawer must use explicit family-controller naming.');

const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
if(!browser){console.log(JSON.stringify({ok:true,structural:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const depRe=/(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe=/\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files=new Map();
function normalize(file){return path.relative(root,file).split(path.sep).join('/');}
function resolve(from,spec){if(!spec.startsWith('.'))return null;let file=path.resolve(path.dirname(from),spec);if(!path.extname(file))file+='.js';return file;}
function collect(file){file=path.resolve(file);if(files.has(file))return;let source=fs.readFileSync(file,'utf8');const specs=[];for(const re of [depRe,dynamicRe]){re.lastIndex=0;let m;while((m=re.exec(source)))if(m[1].startsWith('.'))specs.push(m[1]);}files.set(file,source);for(const spec of specs)collect(resolve(file,spec));}
for(const rel of ['src/components/popover.js','src/components/tooltip.js','src/components/dropdown.js','src/components/select.js','src/components/modal.js','src/components/drawer.js']) collect(path.join(root,rel));
const imports={};
for(const [file,raw] of files){let source=raw;for(const re of [depRe,dynamicRe])source=source.replace(re,(full,spec)=>{const resolved=resolve(file,spec);return resolved?full.replace(spec,'qx:/'+normalize(resolved)):full;});source+='\n//# sourceURL=qx:/'+normalize(file);imports['qx:/'+normalize(file)]='data:text/javascript;base64,'+Buffer.from(source).toString('base64');}
const importMap=JSON.stringify({imports}).replace(/</g,'\\u003c');
const test=`import {Popover} from 'qx:/src/components/popover.js';
import {Tooltip} from 'qx:/src/components/tooltip.js';
import {Dropdown} from 'qx:/src/components/dropdown.js';
import {Select} from 'qx:/src/components/select.js';
import {Modal} from 'qx:/src/components/modal.js';
import {Drawer} from 'qx:/src/components/drawer.js';
const out=document.getElementById('result');function a(v,m){if(!v)throw new Error(m)}function button(label){const el=document.createElement('button');el.textContent=label;document.body.appendChild(el);return el;}function host(){const el=document.createElement('div');document.body.appendChild(el);return el;}try{
const pr=button('popover');const po=Popover.create({document,reference:pr,portalContainer:document.body,trigger:'manual',autoUpdate:false,destroyOnClose:false,content:'P'});a(po.getOverlayController()===po.getTrigger().getOverlayController(),'popover overlay identity');a(po.getMotionController()===po.getTrigger().getMotionController(),'popover motion identity');po.destroy();
const tr=button('tooltip');const tt=Tooltip.create({document,reference:tr,portalContainer:document.body,trigger:'manual',autoUpdate:false,destroyOnClose:false,content:'T'});a(tt.getOverlayController()===tt.getTrigger().getOverlayController(),'tooltip overlay identity');a(tt.getMotionController()===tt.getTrigger().getMotionController(),'tooltip motion identity');tt.destroy();
const dr=button('dropdown');const dd=Dropdown.create({document,reference:dr,portalContainer:document.body,trigger:'manual',autoUpdate:false,destroyOnClose:false,items:[{key:'a',value:'a',label:'A'}]});a(dd.getOverlayController()===dd.getTrigger().getOverlayController(),'dropdown overlay identity through overridden getTrigger');a(dd.getMotionController()===dd.getTrigger().getMotionController(),'dropdown motion identity through overridden getTrigger');dd.destroy();
const se=Select.create({document,container:host(),items:[{key:'a',value:'a',label:'A'}],trigger:'manual',autoUpdate:false,destroyOnClose:false});a(se.getOverlayController()===se.getTrigger().getOverlayController(),'select popup-field overlay identity');a(se.getMotionController()===se.getTrigger().getMotionController(),'select popup-field motion identity');se.destroy();
const modal=Modal.create({document,portalContainer:document.body,autoOpen:false,duration:0,maskDuration:0,content:'M'});a(modal.getOverlayFamilyController()===modal.getOverlayController(),'modal legacy alias');a(modal.getOverlayResourceController()===null,'modal resource controller intentionally pending direct migration');a(!!modal.getOverlayRuntime(),'modal runtime compatibility');modal.open('verify');a(modal.getState().open===true,'modal family logical controller still owns open');modal.close('verify');modal.destroy();
const drawer=Drawer.create({document,portalContainer:document.body,autoOpen:false,duration:0,animation:false,content:'D'});a(drawer.getOverlayFamilyController()===drawer.getOverlayController(),'drawer legacy alias');a(drawer.getOverlayResourceController()===null,'drawer resource controller intentionally pending direct migration');a(!!drawer.getOverlayRuntime(),'drawer runtime compatibility');drawer.destroy();
out.textContent='E2POP:'+JSON.stringify({ok:true,modules:${files.size}})}catch(e){out.textContent='E2POP:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}`;
const html=`<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile=path.join('/tmp','qx-e2-popup-'+process.pid+'-'+Date.now());
const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});let stderr='',endpoint=null;child.stderr.setEncoding('utf8');child.stderr.on('data',c=>{stderr+=c;const m=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m)endpoint=m[1];});
const deadline=Date.now()+30000;while(!endpoint&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));if(!endpoint)throw new Error('CDP endpoint timeout');
const socket=new WebSocketClient(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=()=>j(new Error('CDP connect failed'));});let id=0;const pending=new Map();socket.onmessage=e=>{const m=JSON.parse(e.data);if(!m.id||!pending.has(m.id))return;const p=pending.get(m.id);pending.delete(m.id);m.error?p.j(new Error(m.error.message)):p.r(m.result);};function call(method,params={},sessionId){return new Promise((r,j)=>{const n=++id;pending.set(n,{r,j});const msg={id:n,method,params};if(sessionId)msg.sessionId=sessionId;socket.send(JSON.stringify(msg));});}
let targetId=null;try{({targetId}=await call('Target.createTarget',{url:'about:blank'}));const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true});await call('Page.enable',{},sessionId);await call('Runtime.enable',{},sessionId);const tree=await call('Page.getFrameTree',{},sessionId);await call('Page.setDocumentContent',{frameId:tree.frameTree.frame.id,html},sessionId);let payload=null;const until=Date.now()+20000;while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:`(document.getElementById('result')||{}).textContent||''`,returnByValue:true},sessionId);const text=r&&r.result&&r.result.value;if(typeof text==='string'&&text.startsWith('E2POP:')){payload=JSON.parse(text.slice(6));break;}await new Promise(r=>setTimeout(r,100));}if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);console.log(JSON.stringify({...payload,structural:true}));}finally{if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}}
