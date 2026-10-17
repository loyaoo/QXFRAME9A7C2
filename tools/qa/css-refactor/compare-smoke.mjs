// Deterministic Chromium B0↔candidate CSS smoke and negative-control fixture.
// Strictly supplemental to full canonical pages/interaction/screenshot verification.
// Usage: node tools/qa/css-refactor/compare-smoke.mjs --baseline=<B0/dist.css> --candidate=<HEAD/dist.css> --out=<report.json>
// Always proves baseline self/self AND intentional mutation detection first.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { getWebSocketConstructor } from '../../websocket-client.mjs';

const arg = name => process.argv.find(v => v.startsWith('--' + name + '='))?.slice(name.length + 3);
const baselineFile = arg('baseline'), candidateFile = arg('candidate');
if (!baselineFile || !candidateFile) throw new Error('Missing --baseline and/or --candidate');
const baseline = fs.readFileSync(path.resolve(baselineFile), 'utf8');
const candidate = fs.readFileSync(path.resolve(candidateFile), 'utf8');
const b0Digest = crypto.createHash('sha256').update(baseline).digest('hex');
const expected = '93d2eeba7cce1af8a6e461c514d0e4b1d38886717b98c10fe13fd1444745187e';
if (b0Digest !== expected) throw new Error('B0 CSS bytes do not match exact-tree official artifact: ' + b0Digest);
const css = {
  baseline,
  candidate,
  mutant: baseline + '\nhtml,body { background-color: rgb(13, 79, 211) !important; }\n'
};
const fixture = (which, mode) => `<!doctype html><html class="${mode==='dark'?'dark':''}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="/style.css?which=${which}"></head><body>
<section id="primary" class="qxframe9a7c2-stack">
<button id="button" class="qxframe9a7c2-button">Example Button</button>
<button id="button-selected" class="qxframe9a7c2-button is-selected">Selected Button</button>
<button id="button-disabled" class="qxframe9a7c2-button is-disabled" disabled>Disabled Button</button>
<div id="card" class="qxframe9a7c2-card"><div id="card-header" class="qxframe9a7c2-card-header">Header</div><div id="card-body" class="qxframe9a7c2-card-body">Content</div></div>
<input id="input" class="qxframe9a7c2-input" placeholder="Text" value="Sample">
<label id="check-host" class="qxframe9a7c2-field"><input id="checkbox" type="checkbox" checked>Check</label>
<span id="badge" class="qxframe9a7c2-badge is-success">Success</span>
<div id="menu" class="qxframe9a7c2-menu"><div id="menu-item" class="qxframe9a7c2-menu-item is-selected">Item</div></div>
<div id="local-dark" class="dark"><button id="nested-button" class="qxframe9a7c2-button">Nested dark</button></div>
<div id="public-overrides" style="--qxframe9a7c2-card-shadow:none;--qxframe9a7c2-button-radius:0">
<div id="override-card" class="qxframe9a7c2-card">Local public override</div></div>
</section></body></html>`;

const server = http.createServer((req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  if (u.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
  if (u.pathname === '/style.css') {
    const value = css[u.searchParams.get('which')];
    if (value === undefined) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/css', 'Cache-Control': 'no-store' }); return res.end(value);
  }
  if (u.pathname === '/fixture') {
    const which = u.searchParams.get('which'), mode = u.searchParams.get('mode');
    if (!css[which] || !['light','dark'].includes(mode)) { res.writeHead(400); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' }); return res.end(fixture(which,mode));
  }
  res.writeHead(404); res.end();
});
await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
const bin = [process.env.CHROMIUM_BIN,'/usr/bin/chromium','/usr/bin/chromium-browser','/usr/bin/google-chrome','/usr/bin/google-chrome-stable'].filter(Boolean).find(p => fs.existsSync(p));
const profile = fs.mkdtempSync(path.join(os.tmpdir(),'qx-css-refactor-cdp-'));
let child, socket, cid=0;
const pending = new Map(), runtimeErrors = [], httpErrors = [];
let sessionId, endpoint='', stderr='';
function sleep(ms) { return new Promise(r => setTimeout(r,ms)); }
async function call(method,params={},session) {
  return new Promise((resolve,reject) => {
    const id=++cid;
    pending.set(id,{resolve,reject});
    socket.send(JSON.stringify({id,method,params,...(session?{sessionId:session}:{})}));
  });
}
const s = (method,params={}) => call(method,params,sessionId);
async function evalJs(expression) {
  const data = await s('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if (data.exceptionDetails) throw new Error('JS evaluation error: ' + (data.exceptionDetails.exception?.description || data.exceptionDetails.text));
  return data.result.value;
}
async function waitFor(expression,label) {
  for (let i=0;i<200;i++) {
    if (await evalJs(expression)) return;
    await sleep(50);
  }
  throw new Error('Timed out: '+label);
}
async function sample(which,mode) {
  const errorsStart=runtimeErrors.length, networkStart=httpErrors.length;
  await s('Page.navigate',{url:origin+'/fixture?which='+which+'&mode='+mode});
  await waitFor('document.readyState==="complete" && !!document.querySelector("#override-card")','fixture load');
  await evalJs('document.fonts.ready.then(()=>true)');
  const snapshot = await evalJs(`(() => {
    const rows=[];
    const all=[document.documentElement,document.body,...document.querySelectorAll('body *')];
    for (const el of all) {
      const name=el.id || (el===document.documentElement?'html':el===document.body?'body':el.tagName);
      const box=el.getBoundingClientRect();
      const geom=[box.x,box.y,box.width,box.height,el.scrollWidth,el.scrollHeight,el.clientWidth,el.clientHeight];
      const values={};
      for (const pseud of ['', '::before','::after']) {
        const cs=getComputedStyle(el,pseud), props={};
        for (let i=0;i<cs.length;i++) { const key=cs[i]; props[key]=cs.getPropertyValue(key); }
        values[pseud||'base']=props;
      }
      rows.push({name,tag:el.tagName,geom,values});
    }
    return {rows,styleSheets:document.styleSheets.length,scopeRuleCounts:[...document.styleSheets].map(sheet=>{try{return sheet.cssRules.length}catch{return -1}})};
  })()`);
  if (snapshot.styleSheets === 0 || snapshot.rows.length<10) throw new Error('Incomplete fixture: '+JSON.stringify({sheets:snapshot.styleSheets,rows:snapshot.rows.length}));
  const errors=runtimeErrors.slice(errorsStart), http=httpErrors.slice(networkStart);
  return {snapshot,errors,http};
}
function compare(a,b,label) {
  const out=[];
  for (const [i,node] of a.snapshot.rows.entries()) {
    const other=b.snapshot.rows[i];
    if (!other || node.name!==other.name || node.tag!==other.tag) {out.push({label,index:i,reason:'DOM',baseline:node.name,candidate:other?.name});continue;}
    if (JSON.stringify(node.geom)!==JSON.stringify(other.geom)) out.push({label,node:node.name,property:'raw-geometry',baseline:node.geom,candidate:other.geom});
    for (const pseudo of ['base','::before','::after']) {
      for (const [key,val] of Object.entries(node.values[pseudo])) {
        const newVal=other.values[pseudo]?.[key];
        if (val!==newVal) out.push({label,node:node.name,pseudo,property:key,baseline:val,candidate:newVal});
      }
    }
  }
  if (a.snapshot.rows.length!==b.snapshot.rows.length) out.push({label,reason:'element-count',baseline:a.snapshot.rows.length,candidate:b.snapshot.rows.length});
  return out;
}
const report={baselineSha256:b0Digest,candidateSha256:crypto.createHash('sha256').update(candidate).digest('hex'),source:'real Chromium CSSOM/computedStyle/getBoundingClientRect',cases:[],selfPassed:false,negativePassed:false,realCandidatePassed:false,errors:[],warnings:['Synthetic fixture smoke only; does not replace full docs screenshots, interaction or nested Portal acceptance']};
try {
  if (!bin) throw new Error('Chromium is required; set CHROMIUM_BIN');
  child=spawn(bin,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--remote-debugging-port=0','--window-size=1440,900','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
  child.stderr.setEncoding('utf8');
  child.stderr.on('data',d=>{stderr+=d;endpoint ||= (stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)||[])[1]||'';});
  for(let i=0;i<600 && !endpoint && child.exitCode===null;i++)await sleep(50);
  if(!endpoint)throw new Error('Cannot launch Chromium CDP: '+stderr.slice(-700));
  const WebSocketClient=await getWebSocketConstructor();
  socket=new WebSocketClient(endpoint);
  await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=()=>reject(new Error('CDP connection failed'));});
  socket.onmessage=event=>{
    const msg=JSON.parse(event.data);
    if(msg.id&&pending.has(msg.id)){const p=pending.get(msg.id);pending.delete(msg.id);return msg.error?p.reject(new Error(msg.error.message)):p.resolve(msg.result);}
    if(msg.sessionId===sessionId && msg.method==='Runtime.exceptionThrown')runtimeErrors.push(msg.params.exceptionDetails.text);
    if(msg.sessionId===sessionId && msg.method==='Network.responseReceived' && msg.params.response.status>=400)httpErrors.push(msg.params.response.status+' '+msg.params.response.url);
    if(msg.sessionId===sessionId && msg.method==='Network.loadingFailed' && !msg.params.canceled)httpErrors.push(msg.params.errorText);
  };
  const {targetId}=await call('Target.createTarget',{url:'about:blank'});
  ({sessionId}=await call('Target.attachToTarget',{targetId,flatten:true}));
  await s('Page.enable');await s('Runtime.enable');await s('Network.enable');
  await s('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  report.browser=(await call('Browser.getVersion')).product;
  for(const mode of ['light','dark']) {
    const a=await sample('baseline',mode), b=await sample('baseline',mode), bad=await sample('mutant',mode), fresh=await sample('candidate',mode);
    const selfDiff=compare(a,b,mode),negativeDiff=compare(a,bad,mode),candidateDiff=compare(a,fresh,mode);
    const errs=[...a.errors,...b.errors,...bad.errors,...fresh.errors,...a.http,...b.http,...bad.http,...fresh.http];
    report.cases.push({mode,styleElementCount:a.snapshot.rows.length,selfDiffCount:selfDiff.length,negativeDiffCount:negativeDiff.length,candidateDiffCount:candidateDiff.length,negativeSamples:negativeDiff.slice(0,3),candidateSamples:candidateDiff.slice(0,20),errors:errs});
  }
  report.selfPassed=report.cases.every(x=>x.selfDiffCount===0 && x.errors.length===0);
  report.negativePassed=report.cases.every(x=>x.negativeDiffCount>0);
  report.realCandidatePassed=report.cases.every(x=>x.candidateDiffCount===0);
  report.ok=report.selfPassed&&report.negativePassed&&report.realCandidatePassed;
}catch(e){report.ok=false;report.errors.push(String(e.stack||e));}
finally{
  if(socket)socket.close();
  if(child){child.kill('SIGTERM');await sleep(100);if(child.exitCode===null)child.kill('SIGKILL');}
  server.close();
  fs.rmSync(profile,{recursive:true,force:true});
}
if(arg('out')){fs.mkdirSync(path.dirname(path.resolve(arg('out'))),{recursive:true});fs.writeFileSync(path.resolve(arg('out')),JSON.stringify(report,null,2)+'\n');}
console.log(JSON.stringify({...report,cases:report.cases.map(x=>({...x,candidateSamples:x.candidateSamples.slice(0,3)}))}));
if(!report.ok)process.exitCode=1;
