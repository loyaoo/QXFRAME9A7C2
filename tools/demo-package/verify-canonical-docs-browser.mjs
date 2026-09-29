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
  '/docs/admin/register.html',
  '/docs/admin/register-result.html',
  ...adminViewPages,
  '/docs/index.html',
  '/docs/theme-playground.html',
  '/docs/tokens.html'
];
if(componentPages.length!==66||adminViewPages.length!==36||pages.length!==112)throw new Error('[QXFRAME9A7C2 canonical docs browser] expected 66 component / 36 admin view / 112 canonical pages.');

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
    var result={tabsMounted:false,overflowList:false,tabFontSize:0,tabsKeyboardSwitchFocus:false,tabsKeyboardRemoveFocus:false,collapsedMenuFits:false,collapsedGroupsHidden:false,collapsedIconCentered:false,searchOpened:false,searchClosedFromFrame:false};
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
    var activeAction=tabs&&tabs.querySelector('.qxframe9a7c2-tabs-tab.is-active .qxframe9a7c2-tabs-tab-action');
    if(activeAction){
      activeAction.focus();
      activeAction.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));
      await sleep(100);
      var switched=document.activeElement;
      result.tabsKeyboardSwitchFocus=!!(switched&&switched!==activeAction&&switched.classList&&switched.classList.contains('qxframe9a7c2-tabs-tab-action'));
      if(result.tabsKeyboardSwitchFocus){
        switched.dispatchEvent(new KeyboardEvent('keydown',{key:'Delete',bubbles:true,cancelable:true}));
        await sleep(140);
        var removedFallback=document.activeElement;
        result.tabsKeyboardRemoveFocus=!!(removedFallback&&removedFallback.classList&&removedFallback.classList.contains('qxframe9a7c2-tabs-tab-action'));
      }
    }
    var shellRoot=document.querySelector('.qx-admin-shell');
    var collapse=document.getElementById('qx-admin-collapse');
    if(shellRoot&&collapse&&!shellRoot.classList.contains('is-collapsed'))collapse.click();
    await sleep(140);
    var menuHost=document.getElementById('qx-admin-menu');
    var menuRoot=menuHost&&menuHost.querySelector('.qxframe9a7c2-menu.is-inline.is-collapsed');
    var groupLabels=menuRoot?Array.prototype.slice.call(menuRoot.querySelectorAll('.qxframe9a7c2-menu-group-label')):[];
    result.collapsedMenuFits=!!(menuHost&&menuRoot&&menuHost.scrollWidth<=menuHost.clientWidth+1&&menuRoot.scrollWidth<=menuRoot.clientWidth+1);
    result.collapsedGroupsHidden=groupLabels.length>0&&groupLabels.every(function(node){return getComputedStyle(node).display==='none';});
    var menuItem=menuRoot&&menuRoot.querySelector('.qxframe9a7c2-menu-item');
    var menuIcon=menuItem&&menuItem.querySelector('.qxframe9a7c2-menu-icon');
    if(menuItem&&menuIcon){
      var itemRect=menuItem.getBoundingClientRect(),iconRect=menuIcon.getBoundingClientRect();
      result.collapsedIconCentered=Math.abs((itemRect.left+itemRect.width/2)-(iconRect.left+iconRect.width/2))<=2;
    }
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
  if(!shellValue.tabsMounted||!shellValue.overflowList||shellValue.tabFontSize<12||!shellValue.tabsKeyboardSwitchFocus||!shellValue.tabsKeyboardRemoveFocus||!shellValue.collapsedMenuFits||!shellValue.collapsedGroupsHidden||!shellValue.collapsedIconCentered||!shellValue.searchOpened||!shellValue.searchClosedFromFrame){
    throw new Error('[QXFRAME9A7C2 canonical docs browser] admin shell regression '+JSON.stringify(shellValue));
  }

  await navigateCanonical('/docs/admin-form-static.html',420);
  const popupFieldRegression=await cdp.call('Runtime.evaluate',{expression:`(async function(){
    function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
    var result={selectFound:false,selectToggleAndClear:false,selectBeforeValue:false,selectOpened:false,selectAfterValue:false,selectValueKept:false,selectPanelHidden:null,selectOwnerState:null,cascaderFound:false,cascaderToggleAndClear:false,cascaderBeforeValue:false,cascaderOpened:false,cascaderAfterValue:false,cascaderValueKept:false,cascaderPanelHidden:null,cascaderOwnerState:null};
    async function probe(root){
      if(!root)return null;
      root.dispatchEvent(new PointerEvent('pointerenter'));
      await sleep(30);
      var clear=root.querySelector('.qxframe9a7c2-input-clear');
      var toggle=root.querySelector('.qxframe9a7c2-input-toggle');
      var before=root.classList.contains('has-value');
      var both=!!(clear&&toggle&&!clear.hidden&&!toggle.hidden&&getComputedStyle(clear).display!=='none'&&getComputedStyle(toggle).display!=='none');
      root.click();
      await sleep(150);
      return {before:before,both:both,opened:root.classList.contains('is-open'),afterValue:root.classList.contains('has-value'),valueKept:before&&root.classList.contains('has-value')};
    }
    var selectRoot=document.querySelector('#admin-content-type-select .qxframe9a7c2-select');
    result.selectFound=!!selectRoot;
    var selectProbe=await probe(selectRoot);
    if(selectProbe){
      result.selectToggleAndClear=selectProbe.both;
      result.selectBeforeValue=selectProbe.before;
      result.selectOpened=selectProbe.opened;
      result.selectAfterValue=selectProbe.afterValue;
      result.selectValueKept=selectProbe.valueKept;
      var selectPanel=document.querySelector('.qxframe9a7c2-select-panel');
      result.selectPanelHidden=selectPanel?selectPanel.hidden:null;
    }
    var cascaderRoot=document.querySelector('#admin-category-cascader .qxframe9a7c2-cascader');
    result.cascaderFound=!!cascaderRoot;
    var cascaderProbe=await probe(cascaderRoot);
    if(cascaderProbe){
      result.cascaderToggleAndClear=cascaderProbe.both;
      result.cascaderBeforeValue=cascaderProbe.before;
      result.cascaderOpened=cascaderProbe.opened;
      result.cascaderAfterValue=cascaderProbe.afterValue;
      result.cascaderValueKept=cascaderProbe.valueKept;
      var cascaderPanel=document.querySelector('.qxframe9a7c2-cascader-panel');
      result.cascaderPanelHidden=cascaderPanel?cascaderPanel.hidden:null;
    }
    var demo=window.QXFRAME9A7C2_ADMIN_DEMO;
    var owners=demo&&demo.getOwners?demo.getOwners():[];
    owners.forEach(function(owner){
      if(!owner||typeof owner.getState!=='function')return;
      try{
        var state=owner.getState();
        if(state&&Object.prototype.hasOwnProperty.call(state,'defaultActiveFirstOption'))result.selectOwnerState=state;
        if(state&&Object.prototype.hasOwnProperty.call(state,'checkedStrategy'))result.cascaderOwnerState=state;
      }catch(_){}
    });
    return result;
  })()`,awaitPromise:true,returnByValue:true},sessionId);
  const popupFieldValue=popupFieldRegression&&popupFieldRegression.result&&popupFieldRegression.result.value||{};
  if(!popupFieldValue.selectFound||!popupFieldValue.selectToggleAndClear||!popupFieldValue.selectOpened||!popupFieldValue.selectValueKept||!popupFieldValue.cascaderFound||!popupFieldValue.cascaderToggleAndClear||!popupFieldValue.cascaderOpened||!popupFieldValue.cascaderValueKept){
    throw new Error('[QXFRAME9A7C2 canonical docs browser] popup field clear/toggle regression '+JSON.stringify(popupFieldValue));
  }

  await navigateCanonical('/docs/admin-list-static.html',380);
  const tableRegression=await cdp.call('Runtime.evaluate',{expression:`(async function(){
    function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
    var host=document.getElementById('admin-list-table');
    var wrap=host&&host.querySelector('.qxframe9a7c2-table-wrap');
    var result={found:false,noOverflowShadowHidden:false,overflowState:false,startShadowAfterScroll:false,fixedHeaderAbove:false,nativeControlStyled:false,selectGroupCheckedAbove:false,cardRadiusSynced:false};
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
    var group=document.createElement('div');
    group.className='qxframe9a7c2-form-selectgroup is-buttons';
    group.innerHTML='<label class="qxframe9a7c2-form-selectgroup-item"><input class="qxframe9a7c2-form-selectgroup-input" type="radio" name="zprobe" checked><span class="qxframe9a7c2-form-selectgroup-label">A</span></label><label class="qxframe9a7c2-form-selectgroup-item"><input class="qxframe9a7c2-form-selectgroup-input" type="radio" name="zprobe"><span class="qxframe9a7c2-form-selectgroup-label">B</span></label>';
    document.body.appendChild(group);
    var groupItems=group.querySelectorAll('.qxframe9a7c2-form-selectgroup-item');
    result.selectGroupCheckedAbove=groupItems.length===2&&(parseFloat(getComputedStyle(groupItems[0]).zIndex)||0)>(parseFloat(getComputedStyle(groupItems[1]).zIndex)||0);
    group.remove();
    var card=document.createElement('article');
    card.className='qxframe9a7c2-card';
    var header=document.createElement('div');
    header.className='qxframe9a7c2-card-header';
    var body=document.createElement('div');
    body.className='qxframe9a7c2-card-body';
    var footer=document.createElement('div');
    footer.className='qxframe9a7c2-card-footer';
    card.appendChild(header);card.appendChild(body);card.appendChild(footer);document.body.appendChild(card);
    var cardStyle=getComputedStyle(card),headerStyle=getComputedStyle(header),footerStyle=getComputedStyle(footer);
    var cr=parseFloat(cardStyle.borderTopLeftRadius)||0,hr=parseFloat(headerStyle.borderTopLeftRadius)||0,fr=parseFloat(footerStyle.borderBottomLeftRadius)||0;
    result.cardRadiusSynced=cr>0&&hr>0&&fr>0&&Math.abs(cr-hr)<=2&&Math.abs(cr-fr)<=2;
    card.remove();
    return result;
  })()`,awaitPromise:true,returnByValue:true},sessionId);
  const tableValue=tableRegression&&tableRegression.result&&tableRegression.result.value||{};
  if(!tableValue.found||!tableValue.noOverflowShadowHidden||!tableValue.overflowState||!tableValue.startShadowAfterScroll||!tableValue.fixedHeaderAbove||!tableValue.nativeControlStyled||!tableValue.selectGroupCheckedAbove||!tableValue.cardRadiusSynced){
    throw new Error('[QXFRAME9A7C2 canonical docs browser] admin/Table/CSS regression '+JSON.stringify(tableValue));
  }

  console.log(JSON.stringify({ok:true,componentPages:componentPages.length,adminViewPages:adminViewPages.length,canonicalPages:pages.length,origin,adminShell:shellValue,popupFields:popupFieldValue,tableCss:tableValue}));
}finally{
  if(targetId)await cdp.call('Target.closeTarget',{targetId}).catch(()=>{});
  try{cdp.socket.close()}catch{}
  try{launched.child.kill('SIGKILL')}catch{}
  try{fs.rmSync(launched.profile,{recursive:true,force:true,maxRetries:3,retryDelay:50})}catch{}
}
