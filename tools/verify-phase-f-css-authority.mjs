import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Config } from '../src/core/config.js';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const configSource=read('src/core/config.js');
const overlaySource=read('src/core/overlayRuntime.js');
const menuSource=read('src/components/menu.js');
const colorPickerSource=read('src/components/color-picker.js');
const contractsSource=read('src/core/componentContracts.js');
const css=read('src/qxframe9a7c2.css');
const postbuild=read('tools/postbuild-release.mjs');
const tokenDocs=read('docs/assets/qxframe9a7c2-token-reference.js');
const siteDocs=read('docs/assets/qxframe9a7c2-component-site.js');
const cssOrder=JSON.parse(read('tools/manifests/css-order.json'));

assert.equal(fs.existsSync(path.join(root,'src/css')),false,'src/css split mirror must be removed; src/qxframe9a7c2.css is the sole CSS source.');
assert.equal(cssOrder.files.length,1,'CSS order manifest must expose one physical source.');
assert.equal(cssOrder.files[0].file,'src/qxframe9a7c2.css','CSS order manifest must point at canonical CSS.');
assert.match(postbuild,/path\.join\(root,\s*['"]src\/qxframe9a7c2\.css['"]\)/,'release build must copy the canonical CSS source.');
assert.doesNotMatch(postbuild,/src\/css|00-foundation|10-compatibility/,'release build must not consume split CSS mirrors.');

for(const pattern of [
  /\btheme\s*:/,
  /\btokens\s*:/,
  /\bgetToken\s*:/,
  /\bcaptureContext\s*:/,
  /\bprojectContext\s*:/,
  /data-qxframe9a7c2-theme/,
  /style\.setProperty\s*\(/
]) assert.doesNotMatch(configSource,pattern,'Core.Config must not own/project Theme or Token state.');
assert.deepEqual(Object.keys(Config.defaults).sort(),['focusOutline','motion','size','triggerCloseDelay','triggerOpenDelay','variant'].sort(),'Config defaults must contain runtime behavior settings only.');
assert.throws(()=>Config.configure({theme:'dark'}),/does not accept unknown option/,'Config.theme must be rejected.');
assert.throws(()=>Config.configure({tokens:{}}),/does not accept unknown option/,'Config.tokens must be rejected.');

assert.doesNotMatch(overlaySource,/from ['"]\.\/config\.js['"]/,'OverlayRuntime must not depend on Config theme context.');
assert.doesNotMatch(overlaySource,/captureContext|projectContext|data-qxframe9a7c2-theme|contextProjection|contextObserver/,'OverlayRuntime must not copy theme/token context into portals.');
assert.doesNotMatch(menuSource,/from ['"]\.\.\/core\/config\.js['"]/,'Menu must not import Config for theme projection.');
assert.doesNotMatch(menuSource,/themeScopes|syncThemeScope|Config\.createScope/,'Menu must not own theme scopes.');
const menuContract=contractsSource.match(/"Menu": Object\.freeze\([\s\S]*?\n\s*"Message":/);
assert.ok(menuContract,'Menu contract block missing.');
assert.doesNotMatch(menuContract[0],/["']theme["']\s*[,\]]/,'Menu.theme must not remain a runtime option.');
assert.match(menuSource,/Menu item\.theme was removed/,'Nested item.theme must fail explicitly instead of becoming a silent no-op.');

assert.doesNotMatch(colorPickerSource,/getComputedStyle\([^)]*documentElement|--qxframe9a7c2-palette-['"]?\s*\+/,'ColorPicker default preset values must not read CSS token state.');
assert.doesNotMatch(tokenDocs,/Config\.configure\(\{\s*\\n\s*theme:|\['theme'|\['tokens'/,'Token docs must not advertise Config theme/tokens.');
assert.doesNotMatch(siteDocs,/menu\.updateOptions\(\{\s*theme:|theme:\s*theme\(\)/,'Docs Menu must inherit CSS theme instead of runtime theme options.');

assert.doesNotMatch(css,/@layer\b|:is\(|:where\(/,'Canonical CSS must not use forbidden @layer/:is()/:where().');
assert.match(css,/\[data-qxframe9a7c2-theme="light"\]/,'Canonical CSS must contain light theme selector.');
assert.match(css,/\[data-qxframe9a7c2-theme="dark"\]/,'Canonical CSS must contain dark theme selector.');

const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome'].filter(Boolean).find(fs.existsSync);
if(!browser){console.log(JSON.stringify({ok:true,structural:true,browserSkipped:true,reason:'chromium not found'}));process.exit(0);}
const WebSocketClient=await getWebSocketConstructor();
const safeCss=css.replace(/<\/style/gi,'<\\/style');
const html=`<!doctype html><meta charset=utf-8><style>${safeCss}</style><div id=light style="background:var(--qxframe9a7c2-color-bg);color:var(--qxframe9a7c2-color-text)"></div><div id=scope data-qxframe9a7c2-theme=dark><div id=dark style="background:var(--qxframe9a7c2-color-bg);color:var(--qxframe9a7c2-color-text)"></div></div><div id=result>pending</div><script>try{const light=document.getElementById('light'),dark=document.getElementById('dark'),scope=document.getElementById('scope'),cs=e=>getComputedStyle(e);document.documentElement.setAttribute('data-qxframe9a7c2-theme','light');const l={bg:cs(light).backgroundColor,color:cs(light).color,scheme:cs(document.documentElement).colorScheme};const d={bg:cs(dark).backgroundColor,color:cs(dark).color,scheme:cs(scope).colorScheme};if(!l.bg||!d.bg||l.bg===d.bg)throw new Error('light/dark background must differ through CSS only: '+JSON.stringify({l,d}));if(l.scheme!=='light'||d.scheme!=='dark')throw new Error('scoped color-scheme mismatch: '+JSON.stringify({l,d}));document.documentElement.setAttribute('data-qxframe9a7c2-theme','dark');const rootDark=cs(light).backgroundColor;if(rootDark!==d.bg)throw new Error('root dark selector must resolve same CSS theme as scoped dark');document.getElementById('result').textContent='F1:'+JSON.stringify({ok:true,l,d,rootDark});}catch(e){document.getElementById('result').textContent='F1:'+JSON.stringify({ok:false,error:String(e&&e.stack||e)})}</script>`;
const profile='/tmp/qx-f1-'+process.pid+'-'+Date.now();
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
  let payload=null,until=Date.now()+15000;
  while(Date.now()<until){const r=await call('Runtime.evaluate',{expression:"(document.getElementById('result')||{}).textContent||''",returnByValue:true},sessionId);const text=r?.result?.value;if(typeof text==='string'&&text.startsWith('F1:')){payload=JSON.parse(text.slice(3));break;}await new Promise(r=>setTimeout(r,80));}
  if(!payload)throw new Error('result timeout');if(!payload.ok)throw new Error(payload.error);
  console.log(JSON.stringify({...payload,structural:true,frameworkJsLoaded:false}));
}finally{
  if(targetId)await call('Target.closeTarget',{targetId}).catch(()=>{});
  try{socket.close()}catch{};try{child.kill('SIGKILL')}catch{};try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}
}
