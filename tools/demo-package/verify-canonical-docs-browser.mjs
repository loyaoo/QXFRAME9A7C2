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
const adminViewDir=path.join(root,'docs','admin','views');
const adminViewPages=fs.readdirSync(adminViewDir).filter(name=>name.endsWith('.html')).sort().map(name=>'/docs/admin/views/'+name);
const pages=[
  ...componentPages,
  '/docs/admin-dashboard-static.html',
  '/docs/admin-form-static.html',
  '/docs/admin-list-static.html',
  '/docs/admin/index.html',
  '/docs/admin/login.html',
  ...adminViewPages,
  '/docs/index.html',
  '/docs/theme-playground.html',
  '/docs/tokens.html'
];
if(componentPages.length!==66||adminViewPages.length!==11||pages.length!==85)throw new Error('[QXFRAME9A7C2 canonical docs browser] expected 66 component / 11 admin view / 85 canonical pages.');

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

  async function navigateCanonical(pathname,settle){
    await cdp.call('Page.navigate',{url:new URL(pathname,origin).href},sessionId);
    const deadline=Date.now()+7000;
    while(Date.now()<deadline){
      const ready=await cdp.call('Runtime.evaluate',{expression:'document.readyState',returnByValue:true},sessionId);
      if(ready&&ready.result&&ready.result.value==='complete')break;
      await wait(50);
    }
    await wait(settle||250);
  }

  await navigateCanonical('/docs/admin/index.html',500);
  const shellRegression=await cdp.call('Runtime.evaluate',{expression:`(async function(){
    function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
    var result={tabsMounted:false,overflowList:false,tabFontSize:0,searchOpened:false,searchClosedFromFrame:false};
    ['content-list','content-add','orders','users','roles','media','search','logs','settings','profile','result','404','500'].forEach(function(key){
      history.replaceState(null,'','#/'+key);
      window.dispatchEvent(new Event('hashchange'));
    });
    history.replaceState(null,'','#/dashboard');
    window.dispatchEvent(new Event('hashchange'));
    await sleep(250);
    var tabsHost=document.getElementById('qx-admin-tabs');
    var tabs=tabsHost&&tabsHost.querySelector('.qxframe9a7c2-tabs');
    var tab=tabs&&tabs.querySelector('.qxframe9a7c2-tabs-tab');
    result.tabsMounted=!!tabs;
    result.tabFontSize=tab?parseFloat(getComputedStyle(tab).fontSize)||0:0;
    if(tabsHost){tabsHost.style.flex='0 0 320px';tabsHost.style.width='320px';}
    await sleep(300);
    var more=tabsHost&&tabsHost.querySelector('.qxframe9a7c2-tabs-more');
    if(more&&more.isConnected){
      more.click();
      await sleep(160);
      result.overflowList=document.querySelectorAll('.qxframe9a7c2-tabs-overflow-item').length>0;
    }
    var searchHost=document.getElementById('qx-admin-global-search');
    var input=searchHost&&searchHost.querySelector('input');
    if(input){
      input.focus();
      input.value='订单';
      input.dispatchEvent(new Event('input',{bubbles:true}));
      await sleep(220);
      var panel=document.querySelector('.qxframe9a7c2-autocomplete-panel');
      result.searchOpened=!!(panel&&!panel.hidden);
      var frame=document.querySelector('.qx-admin-frame.is-active');
      if(frame&&frame.contentDocument&&frame.contentDocument.body){
        frame.contentDocument.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));
        await sleep(260);
        result.searchClosedFromFrame=!!(panel&&panel.hidden);
      }
    }
    return result;
  })()`,awaitPromise:true,returnByValue:true},sessionId);
  const shellValue=shellRegression&&shellRegression.result&&shellRegression.result.value||{};
  if(!shellValue.tabsMounted||!shellValue.overflowList||shellValue.tabFontSize<12||!shellValue.searchOpened||!shellValue.searchClosedFromFrame){
    throw new Error('[QXFRAME9A7C2 canonical docs browser] admin shell regression '+JSON.stringify(shellValue));
  }

  await navigateCanonical('/docs/admin-list-static.html',380);
  const tableRegression=await cdp.call('Runtime.evaluate',{expression:`(async function(){
    function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
    var host=document.getElementById('admin-list-table');
    var wrap=host&&host.querySelector('.qxframe9a7c2-table-wrap');
    var result={found:false,noOverflowShadowHidden:false,overflowState:false,startShadowAfterScroll:false,fixedHeaderAbove:false,nativeControlStyled:false,cardRadiusSynced:false};
    if(!wrap)return result;
    result.found=true;
    wrap.style.width='3000px';
    wrap.style.maxWidth='none';
    await sleep(240);
    var start=wrap.querySelector('thead th.is-fixed-start.is-last');
    var ordinary=Array.prototype.slice.call(wrap.querySelectorAll('thead th')).find(function(node){return !node.classList.contains('is-fixed-start')&&!node.classList.contains('is-fixed-end');});
    var noOverflow=wrap.scrollWidth<=wrap.clientWidth+1;
    var startOpacity=start?parseFloat(getComputedStyle(start,'::after').opacity)||0:0;
    result.noOverflowShadowHidden=noOverflow&&!wrap.classList.contains('has-horizontal-overflow')&&startOpacity===0;
    if(start&&ordinary){
      var fixedZ=parseFloat(getComputedStyle(start).zIndex)||0;
      var ordinaryZ=parseFloat(getComputedStyle(ordinary).zIndex)||0;
      result.fixedHeaderAbove=fixedZ>ordinaryZ;
    }
    wrap.style.width='480px';
    await sleep(240);
    result.overflowState=wrap.classList.contains('has-horizontal-overflow')&&wrap.classList.contains('can-scroll-end');
    wrap.scrollLeft=Math.min(120,Math.max(0,wrap.scrollWidth-wrap.clientWidth));
    wrap.dispatchEvent(new Event('scroll'));
    await sleep(80);
    result.startShadowAfterScroll=!!(start&&wrap.classList.contains('can-scroll-start')&&(parseFloat(getComputedStyle(start,'::after').opacity)||0)>0);
    var probe=document.createElement('input');
    probe.type='text';
    probe.value='native';
    document.body.appendChild(probe);
    var ps=getComputedStyle(probe);
    result.nativeControlStyled=parseFloat(ps.minHeight)>=28&&ps.borderStyle==='solid'&&parseFloat(ps.borderRadius)>0;
    probe.remove();
    var header=document.querySelector('.qxframe9a7c2-card-header');
    var card=header&&header.closest('.qxframe9a7c2-card');
    if(card&&header){
      var cr=parseFloat(getComputedStyle(card).borderTopLeftRadius)||0;
      var hr=parseFloat(getComputedStyle(header).borderTopLeftRadius)||0;
      result.cardRadiusSynced=cr>0&&hr>0&&Math.abs(cr-hr)<=2;
    }
    return result;
  })()`,awaitPromise:true,returnByValue:true},sessionId);
  const tableValue=tableRegression&&tableRegression.result&&tableRegression.result.value||{};
  if(!tableValue.found||!tableValue.noOverflowShadowHidden||!tableValue.overflowState||!tableValue.startShadowAfterScroll||!tableValue.fixedHeaderAbove||!tableValue.nativeControlStyled||!tableValue.cardRadiusSynced){
    throw new Error('[QXFRAME9A7C2 canonical docs browser] admin/Table/CSS regression '+JSON.stringify(tableValue));
  }

  console.log(JSON.stringify({ok:true,componentPages:componentPages.length,adminViewPages:adminViewPages.length,canonicalPages:pages.length,origin,adminShell:shellValue,tableCss:tableValue}));
}finally{
  if(targetId)await cdp.call('Target.closeTarget',{targetId}).catch(()=>{});
  try{cdp.socket.close()}catch{}
  try{launched.child.kill('SIGKILL')}catch{}
  try{fs.rmSync(launched.profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}
}
