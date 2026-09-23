import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebSocketConstructor } from '../websocket-client.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const origin=process.env.DEMO_ORIGIN||'http://127.0.0.1:4173';
const browser=[process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].filter(Boolean).find(fs.existsSync);
if(!browser)throw new Error('[QXFRAME9A7C2 canonical docs browser] Chromium/Chrome is required.');
const WebSocketClient=await getWebSocketConstructor();

const componentDir=path.join(root,'docs','components');
const componentPages=fs.readdirSync(componentDir).filter(name=>name.endsWith('.html')).sort().map(name=>'/docs/components/'+name);
const pages=[
  ...componentPages,
  '/docs/admin-dashboard-static.html',
  '/docs/admin-form-static.html',
  '/docs/admin-list-static.html',
  '/docs/index.html',
  '/docs/theme-playground.html',
  '/docs/tokens.html'
];
if(componentPages.length!==66||pages.length!==72)throw new Error('[QXFRAME9A7C2 canonical docs browser] expected 66 component / 72 canonical pages.');

function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
function launch(){
  return new Promise((resolve,reject)=>{
    const profile=path.join('/tmp','qx-canonical-docs-'+process.pid+'-'+Date.now());
    const child=cp.spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
    let stderr='',done=false;
    const timer=setTimeout(()=>finish(new Error('CDP endpoint timeout')),30000);
    function finish(error,endpoint){if(done)return;done=true;clearTimeout(timer);if(error){try{child.kill('SIGKILL')}catch{};fs.rmSync(profile,{recursive:true,force:true});reject(error);}else resolve({child,profile,endpoint});}
    child.stderr.setEncoding('utf8');
    child.stderr.on('data',chunk=>{stderr+=chunk;const match=stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match)finish(null,match[1]);});
    child.once('error',finish);
    child.once('exit',(code,signal)=>{if(!done)finish(new Error('Chromium exited before DevTools was ready: '+code+'/'+signal+'\n'+stderr.slice(-1200)));});
  });
}
async function connect(endpoint){
  const socket=new WebSocketClient(endpoint);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=()=>reject(new Error('CDP connect failed'));});
  let id=0;const pending=new Map();
  socket.onmessage=event=>{const message=JSON.parse(event.data);if(!message.id||!pending.has(message.id))return;const p=pending.get(message.id);pending.delete(message.id);message.error?p.reject(new Error(message.error.message||JSON.stringify(message.error))):p.resolve(message.result);};
  return{socket,call(method,params={},sessionId){return new Promise((resolve,reject)=>{const callId=++id;pending.set(callId,{resolve,reject});const message={id:callId,method,params};if(sessionId)message.sessionId=sessionId;socket.send(JSON.stringify(message));});}};
}

const launched=await launch();
const cdp=await connect(launched.endpoint);
let targetId=null;
try{
  ({targetId}=await cdp.call('Target.createTarget',{url:'about:blank'}));
  const {sessionId}=await cdp.call('Target.attachToTarget',{targetId,flatten:true});
  await cdp.call('Page.enable',{},sessionId);
  await cdp.call('Runtime.enable',{},sessionId);
  await cdp.call('Page.addScriptToEvaluateOnNewDocument',{source:`
    window.__QX_CANONICAL_ERRORS=[];
    window.addEventListener('error',function(event){window.__QX_CANONICAL_ERRORS.push(String(event.message||event.error||event));});
    window.addEventListener('unhandledrejection',function(event){window.__QX_CANONICAL_ERRORS.push(String(event.reason&&event.reason.stack||event.reason||event));});
  `},sessionId);
  const failures=[];
  for(const pathname of pages){
    await cdp.call('Page.navigate',{url:new URL(pathname,origin).href},sessionId);
    const deadline=Date.now()+7000;
    while(Date.now()<deadline){
      const ready=await cdp.call('Runtime.evaluate',{expression:'document.readyState',returnByValue:true},sessionId);
      if(ready&&ready.result&&ready.result.value==='complete')break;
      await wait(50);
    }
    await wait(pathname==='/docs/theme-playground.html'?350:180);
    const result=await cdp.call('Runtime.evaluate',{expression:`(function(){
      var component=document.body&&document.body.getAttribute('data-qxframe9a7c2-component');
      var app=document.getElementById('qxframe9a7c2-docs-app');
      var errors=(window.__QX_CANONICAL_ERRORS||[]).slice();
      var demoErrors=Array.prototype.slice.call(document.querySelectorAll('.qxframe9a7c2-play-card-error')).map(function(node){return (node.textContent||'').trim();}).filter(Boolean);
      return {
        href:location.href,
        framework:typeof window.QXFRAME9A7C2,
        component:component||null,
        appChildren:app?app.children.length:null,
        errors:errors,
        demoErrors:demoErrors
      };
    })()`,returnByValue:true},sessionId);
    const value=result&&result.result&&result.result.value||{};
    const reasons=[];
    if(value.framework!=='object')reasons.push('framework runtime missing');
    if(pathname.indexOf('/docs/components/')===0){
      if(!value.component)reasons.push('component identity missing');
      if(!(value.appChildren>0))reasons.push('component docs app did not mount');
    }
    if(Array.isArray(value.errors)&&value.errors.length)reasons.push('window errors: '+value.errors.join(' | '));
    if(Array.isArray(value.demoErrors)&&value.demoErrors.length)reasons.push('demo errors: '+value.demoErrors.join(' | '));
    if(reasons.length)failures.push({page:pathname,reasons});
  }
  if(failures.length)throw new Error('[QXFRAME9A7C2 canonical docs browser] '+JSON.stringify(failures));
  console.log(JSON.stringify({ok:true,componentPages:componentPages.length,canonicalPages:pages.length,origin}));
}finally{
  if(targetId)await cdp.call('Target.closeTarget',{targetId}).catch(()=>{});
  try{cdp.socket.close()}catch{}
  try{launched.child.kill('SIGKILL')}catch{}
  try{fs.rmSync(launched.profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}
}
