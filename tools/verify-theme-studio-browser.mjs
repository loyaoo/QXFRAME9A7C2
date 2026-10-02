import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import WebSocket from 'ws';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const browser=[
  process.env.CHROMIUM_BIN,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable'
].filter(Boolean).find(fs.existsSync);
if(!browser)throw new Error('Theme Studio browser verification requires Chromium/Chrome.');

const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};

function serve(){
  return new Promise((resolve,reject)=>{
    const server=http.createServer((req,res)=>{
      try{
        const url=new URL(req.url,'http://127.0.0.1');
        let pathname=decodeURIComponent(url.pathname);
        if(pathname==='/')pathname='/docs/theme-playground.html';
        const file=path.resolve(root,'.'+pathname);
        if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return;}
        if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end('Not found');return;}
        res.writeHead(200,{'content-type':types[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
        fs.createReadStream(file).pipe(res);
      }catch(error){res.writeHead(500);res.end(String(error));}
    });
    server.once('error',reject);
    server.listen(0,'127.0.0.1',()=>resolve({server,port:server.address().port}));
  });
}
function launch(){
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'qx-theme-studio-'));
  const child=spawn(browser,[
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'
  ],{stdio:['ignore','ignore','pipe']});
  return new Promise((resolve,reject)=>{
    let buffer='',settled=false;
    const timer=setTimeout(()=>{if(!settled){settled=true;child.kill('SIGKILL');reject(new Error('Chromium DevTools endpoint timed out.'));}},15000);
    child.stderr.on('data',chunk=>{
      buffer+=chunk.toString();
      const match=buffer.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if(match&&!settled){settled=true;clearTimeout(timer);resolve({child,profile,endpoint:match[1]});}
    });
    child.once('exit',code=>{if(!settled){settled=true;clearTimeout(timer);reject(new Error('Chromium exited before DevTools endpoint: '+code+'\n'+buffer));}});
  });
}
class CDP{
  constructor(url){this.url=url;this.id=0;this.pending=new Map();this.ws=null;}
  async open(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{this.ws.once('open',resolve);this.ws.once('error',reject);});
    this.ws.on('message',raw=>{
      const msg=JSON.parse(String(raw));
      if(msg.id&&this.pending.has(msg.id)){
        const pair=this.pending.get(msg.id);this.pending.delete(msg.id);
        if(msg.error)pair.reject(new Error(msg.error.message||JSON.stringify(msg.error)));else pair.resolve(msg.result||{});
      }
    });
  }
  call(method,params={},sessionId){
    const id=++this.id,payload={id,method,params};if(sessionId)payload.sessionId=sessionId;
    return new Promise((resolve,reject)=>{this.pending.set(id,{resolve,reject});this.ws.send(JSON.stringify(payload),error=>{if(error){this.pending.delete(id);reject(error);}});});
  }
  close(){try{this.ws&&this.ws.close();}catch(_){}}
}
async function waitFor(cdp,sessionId,expression,timeout=30000){
  const deadline=Date.now()+timeout;
  while(Date.now()<deadline){
    const result=await cdp.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);
    if(result.result&&result.result.value)return result.result.value;
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error('Theme Studio wait timed out: '+expression);
}
async function evaluate(cdp,sessionId,expression){
  const result=await cdp.call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true},sessionId);
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Browser evaluation failed');
  return result.result&&result.result.value;
}

let serverInfo,launched,cdp,targetId;
try{
  serverInfo=await serve();
  launched=await launch();
  cdp=new CDP(launched.endpoint);await cdp.open();
  const target=await cdp.call('Target.createTarget',{url:'http://127.0.0.1:'+serverInfo.port+'/docs/theme-playground.html'});targetId=target.targetId;
  const attached=await cdp.call('Target.attachToTarget',{targetId,flatten:true});const sessionId=attached.sessionId;
  await cdp.call('Page.enable',{},sessionId);await cdp.call('Runtime.enable',{},sessionId);

  await waitFor(cdp,sessionId,'Boolean(window.QXFRAME9A7C2_THEME_STUDIO&&document.querySelector(\'style[data-qxframe9a7c2-generated-theme]\'))',45000);
  const initial=await evaluate(cdp,sessionId,'(function(){var style=document.querySelector(\'style[data-qxframe9a7c2-generated-theme]\');var scenes=document.querySelectorAll(\'.qxframe9a7c2-studio-scene\');var mounts=Array.prototype.slice.call(document.querySelectorAll(\'[data-studio-mount]\')).map(function(host){return {name:host.getAttribute(\'data-studio-mount\'),children:host.children.length,error:!!host.querySelector(\'.qxframe9a7c2-studio-runtime-error\')};});return {scenes:scenes.length,generated:style?style.textContent.length:0,declarations:style?(style.textContent.match(/^  --qxframe9a7c2-[^:]+:/gm)||[]).length:0,mode:document.documentElement.getAttribute(\'data-qxframe9a7c2-theme\'),inlineTheme:/--_?qxframe9a7c2-/.test(document.documentElement.getAttribute(\'style\')||\'\'),config:window.QXFRAME9A7C2_THEME_STUDIO.getConfig(),mounts:mounts,cards:document.querySelectorAll(\'.qxframe9a7c2-play-card\').length,commercial:!!document.querySelector(\'[data-qxframe9a7c2-studio-commercial]\')};})()');
  assert.ok(initial.commercial);
  assert.ok(initial.scenes>=20,'Expected 20+ commercial scenes.');
  assert.equal(initial.declarations,8056);
  assert.ok(initial.generated>100000,'Complete Theme CSS should be substantial.');
  assert.equal(initial.inlineTheme,false,'Generated Theme must not depend on root inline Theme tokens.');
  assert.ok(initial.cards>0,'Canonical all-component gallery must remain mounted.');
  assert.equal(initial.mounts.length,7);
  for(const mount of initial.mounts){assert.ok(mount.children>0,'Runtime mount is empty: '+mount.name);assert.equal(mount.error,false,'Runtime mount failed: '+mount.name);}

  const before=await evaluate(cdp,sessionId,'(function(){var s=document.querySelector(\'style[data-qxframe9a7c2-generated-theme]\');return {css:s.textContent,radius:window.QXFRAME9A7C2_THEME_STUDIO.getConfig().radius,density:window.QXFRAME9A7C2_THEME_STUDIO.getConfig().density};})()');
  await evaluate(cdp,sessionId,'(function(){var select=document.querySelector(\'[data-studio-input="primary"]\');select.value=\'purple\';select.dispatchEvent(new Event(\'change\',{bubbles:true}));return true;})()');
  await waitFor(cdp,sessionId,'window.QXFRAME9A7C2_THEME_STUDIO.getConfig().roles.primary===\'purple\'',5000);
  const after=await evaluate(cdp,sessionId,'(function(){var s=document.querySelector(\'style[data-qxframe9a7c2-generated-theme]\');var c=window.QXFRAME9A7C2_THEME_STUDIO.getConfig();return {css:s.textContent,radius:c.radius,density:c.density,primary:c.roles.primary};})()');
  assert.notEqual(after.css,before.css,'Primary change must replace generated stylesheet content.');
  assert.equal(after.radius,before.radius,'Primary change must not reset Radius.');
  assert.equal(after.density,before.density,'Primary change must not reset Density.');
  assert.equal(after.primary,'purple');

  await evaluate(cdp,sessionId,'(function(){document.querySelector(\'[data-studio-mode="dark"]\').click();return true;})()');
  await waitFor(cdp,sessionId,'document.documentElement.getAttribute(\'data-qxframe9a7c2-theme\')===\'dark\'',5000);
  const dark=await evaluate(cdp,sessionId,'(function(){return {mode:document.documentElement.getAttribute(\'data-qxframe9a7c2-theme\'),generated:document.querySelector(\'style[data-qxframe9a7c2-generated-theme]\').textContent.includes(\'[data-qxframe9a7c2-theme="dark"]\')};})()');
  assert.equal(dark.mode,'dark');assert.equal(dark.generated,true);

  console.log(JSON.stringify({
    phase:'TG-G-studio-browser',
    commercialScenes:initial.scenes,
    completeDeclarations:initial.declarations,
    runtimeMounts:initial.mounts.map(x=>x.name),
    canonicalCards:initial.cards,
    primaryOrthogonality:true,
    lightDarkPreview:true,
    rootInlineTheme:false
  }));
}finally{
  try{if(cdp&&targetId)await cdp.call('Target.closeTarget',{targetId});}catch(_){}
  try{cdp&&cdp.close();}catch(_){}
  try{launched&&launched.child.kill('SIGKILL');}catch(_){}
  try{launched&&fs.rmSync(launched.profile,{recursive:true,force:true});}catch(_){}
  await new Promise(resolve=>serverInfo?serverInfo.server.close(resolve):resolve());
}
