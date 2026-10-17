// Deterministic Chromium B0↔candidate CSS smoke and negative-control fixture.
// Strictly supplemental to full canonical pages/interaction/screenshot verification.
// Usage: node tools/qa/css-refactor/compare-smoke.mjs --baseline=<B0/dist.css> --candidate=<HEAD/dist.css> --out=<report.json>
// Always proves baseline self/self AND intentional mutation detection first.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const MIME={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff'};
let activeVariant='baseline';
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
  mutant: baseline + '\nhtml,body { background-color: rgb(13, 79, 211) !important; } .qxframe9a7c2-card { background-color: rgb(13, 79, 211) !important; box-shadow: 0 0 0 30px rgb(13, 79, 211) !important; }\n'
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
<div id="card-sizes">
  <div id="card-xs" class="qxframe9a7c2-card is-xs"><div class="qxframe9a7c2-card-header"><h3 class="qxframe9a7c2-card-title">XS</h3></div><div class="qxframe9a7c2-card-description">Small description</div></div>
  <div id="card-sm" class="qxframe9a7c2-card is-sm"><div class="qxframe9a7c2-card-body">Small</div></div>
  <div id="card-md" class="qxframe9a7c2-card is-md"><div class="qxframe9a7c2-card-body">Medium</div></div>
  <div id="card-lg" class="qxframe9a7c2-card is-lg"><div class="qxframe9a7c2-card-body">Large</div></div>
  <div id="card-xl" class="qxframe9a7c2-card is-xl"><div class="qxframe9a7c2-card-body">Extra large</div></div>
</div>
<div id="card-state-matrix">
  <div id="card-outlined" class="qxframe9a7c2-card is-outlined"><div class="qxframe9a7c2-card-title">Outline</div></div>
  <div id="card-elevated" class="qxframe9a7c2-card is-elevated">Elevated</div>
  <div id="card-selected" class="qxframe9a7c2-card is-selected">Selected</div>
  <div id="card-loading" class="qxframe9a7c2-card is-loading is-hoverable">Loading + hoverable</div>
  <div id="card-hover" class="qxframe9a7c2-card is-hoverable is-hover-shadow">Hoverable</div>
  <div id="card-divided" class="qxframe9a7c2-card is-divided"><div class="qxframe9a7c2-card-header">Divided</div><div class="qxframe9a7c2-card-content">Content</div><div class="qxframe9a7c2-card-footer">Footer</div></div>
  <div id="card-grid" class="qxframe9a7c2-card"><div class="qxframe9a7c2-card-grid"><div class="qxframe9a7c2-card-grid-item">Cell 1</div><div class="qxframe9a7c2-card-grid-item">Cell 2</div></div></div>
</div>
<div id="card-ancestor-overrides" style="--qxframe9a7c2-card-shadow:none;--qxframe9a7c2-card-padding:1.25rem;--qxframe9a7c2-card-border-color:rgb(123,45,67)">
  <div id="card-inherited" class="qxframe9a7c2-card is-sm"><h3 class="qxframe9a7c2-card-title">Ancestor override</h3><div class="qxframe9a7c2-card-description">Description</div></div>
  <div id="card-local-override" class="qxframe9a7c2-card" style="--qxframe9a7c2-card-shadow:0 0 0 2px rgb(25,88,144);--qxframe9a7c2-card-padding:0">Local override</div>
</div>
<div id="card-dark-nested" class="dark"><div id="card-nested-dark" class="qxframe9a7c2-card is-xs">Nested scheme card</div></div>
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
  // Real canonical docs/Card route: serve unchanged JS/DOM from this exact tree,
  // swapping ONLY the dist CSS source. Prevent directory traversal and missing-file silence.
  const pathname=decodeURIComponent(u.pathname);
  const file=path.resolve(projectRoot,'.'+pathname);
  if (!file.startsWith(projectRoot+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.writeHead(404); return res.end();
  }
  if (pathname==='/dist/qxframe9a7c2.css') {
    res.writeHead(200,{'Content-Type':'text/css','Cache-Control':'no-store'});
    return res.end(css[activeVariant]);
  }
  res.writeHead(200,{'Content-Type':MIME[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
  res.end(fs.readFileSync(file));
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
async function sample(which,mode,route='synthetic') {
  const errorsStart=runtimeErrors.length, networkStart=httpErrors.length;
  activeVariant=which;
  const actualDoc=route==='card-doc';
  await s('Page.navigate',{url: actualDoc ? origin+'/docs/components/card.html' : origin+'/fixture?which='+which+'&mode='+mode});
  if (actualDoc) {
    await waitFor('document.readyState==="complete" && document.body.dataset.qxframe9a7c2Component==="Card" && document.querySelectorAll(".qxframe9a7c2-card").length>=1','real Card docs mount');
    // Use the docs site's own mode API. Merely adding .dark leaves its
    // qxframe9a7c2-theme-light class and data-theme="light" contradictory.
    const applied=await evalJs("(() => { const api=window.QXFRAME9A7C2_DOCS_THEME; if(!api)throw Error('Docs Theme runtime missing'); const state=api.setState({mode:"+JSON.stringify(mode)+"},{persist:false,emit:true}); const root=document.documentElement; return {mode:state.effectiveMode,dark:root.classList.contains('dark'),themeDark:root.classList.contains('qxframe9a7c2-theme-dark'),attr:root.getAttribute('data-theme')}; })()");
    if(applied.mode!==mode || applied.dark!==(mode==='dark') || applied.themeDark!==(mode==='dark') || applied.attr!==mode)
      throw Error('Docs Theme mode not applied: '+JSON.stringify(applied));
    await sleep(200);
  } else {
    await waitFor('document.readyState==="complete" && !!document.querySelector("#override-card")','fixture load');
  }
  await evalJs('document.fonts.ready.then(()=>true)');
  // Capture at an identical animation timeline, without changing the source
  // CSS animation-name/duration/keyframes or suppressing animation assertions.
  // WAAPI freezing at time 0 avoids Card Skeleton background-position drift.
  // This is a deterministic snapshot mode, NOT motion playback acceptance.
  const animationEvidence=await evalJs(`(() => {
    const all=document.getAnimations({subtree:true});
    const initial={running:all.filter(a=>a.playState==='running').length,
      skeleton:all.filter(a=>a.effect?.target?.classList?.contains('qxframe9a7c2-card-skeleton-line')).length,
      withKeyframes:all.filter(a=>Array.isArray(a.effect?.getKeyframes?.()) && a.effect.getKeyframes().length>0).length};
    for(const a of all){a.pause();a.currentTime=0;}
    return {count:all.length,initial};
  })()`);
  await sleep(40);
  const snapshot = await evalJs(`(() => {
    const rows=[];
    const realDoc=!!document.body.dataset.qxframe9a7c2Component;
    const all=realDoc ?
      [document.documentElement,document.body,...[...document.querySelectorAll('.qxframe9a7c2-card,.qxframe9a7c2-card *')].slice(0,250)] :
      [document.documentElement,document.body,...document.querySelectorAll('body *')];
    const domPath=el=>{
      const out=[];
      while(el && el.nodeType===1){
        let n=1; for(let x=el.previousElementSibling;x;x=x.previousElementSibling)if(x.tagName===el.tagName)n++;
        out.unshift(el.tagName.toLowerCase()+':nth-of-type('+n+')'); el=el.parentElement;
      }
      return out.join('>');
    };
    for (const el of all) {
      const name=domPath(el);
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
  if (snapshot.styleSheets === 0 || snapshot.rows.length < (actualDoc ? 25 : 45))
    throw new Error('Incomplete '+route+': '+JSON.stringify({sheets:snapshot.styleSheets,rows:snapshot.rows.length}));
  const image=actualDoc ? Buffer.from((await s('Page.captureScreenshot',{format:'png',captureBeyondViewport:true})).data,'base64') : null;
  const errors=runtimeErrors.slice(errorsStart), http=httpErrors.slice(networkStart);
  return {snapshot,errors,http,image,animationEvidence};

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
const report={realDocCoverage:'docs/components/card.html, same-source JS/HTML, native docs Theme state API, deterministic WAAPI t=0 sampling and CSS swap',baselineSha256:b0Digest,candidateSha256:crypto.createHash('sha256').update(candidate).digest('hex'),source:'real Chromium CSSOM/computedStyle/getBoundingClientRect',cases:[],selfPassed:false,negativePassed:false,realCandidatePassed:false,errors:[],warnings:['Expanded synthetic fixture covers Card size xs–xl, states, public ancestor/root overrides and local dark, but is not a replacement for pointer-hover/keyboard/112-config/portal acceptance.']};
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
  // Real source Card docs: repeat self, poison, and candidate in the same Chromium.
  // A large CSS difference must fail on both actual DOM/computed values and pixels.
  report.realDocs=[];
  const artifactDir=arg('out') ? path.join(path.dirname(path.resolve(arg('out'))),'css-refactor-card-screenshots') : null;
  if(artifactDir)fs.mkdirSync(artifactDir,{recursive:true});
  for(const mode of ['light','dark']) {
    const base=await sample('baseline',mode,'card-doc');
    const again=await sample('baseline',mode,'card-doc');
    const mutant=await sample('mutant',mode,'card-doc');
    const head=await sample('candidate',mode,'card-doc');
    const self=compare(base,again,mode+'-docs-self'),neg=compare(base,mutant,mode+'-docs-poison'),cand=compare(base,head,mode+'-docs-candidate');
    const pngHash = img => crypto.createHash('sha256').update(img).digest('hex');
    const imageHashes={baseline:pngHash(base.image),self:pngHash(again.image),negative:pngHash(mutant.image),candidate:pngHash(head.image)};
    const errors=[...base.errors,...again.errors,...mutant.errors,...head.errors,...base.http,...again.http,...mutant.http,...head.http];
    const record={mode,elements:base.snapshot.rows.length,cssSheets:base.snapshot.styleSheets,
      animationEvidence:{baseline:base.animationEvidence,candidate:head.animationEvidence},
      selfDiffs:self.length,negativeDiffs:neg.length,candidateDiffs:cand.length,
      imageHashes,selfPixelsEqual:imageHashes.baseline===imageHashes.self,
      negativePixelsDetected:imageHashes.baseline!==imageHashes.negative,
      candidatePixelsEqual:imageHashes.baseline===imageHashes.candidate,
      errors,negativeSamples:neg.slice(0,3),candidateSamples:cand.slice(0,8)};
    if(artifactDir){for(const [key,object] of Object.entries({baseline:base,negative:mutant,candidate:head}))fs.writeFileSync(path.join(artifactDir,'card-'+mode+'-'+key+'.png'),object.image);}
    report.realDocs.push(record);
  }
  report.selfPassed=report.cases.every(x=>x.selfDiffCount===0 && x.errors.length===0);
  report.negativePassed=report.cases.every(x=>x.negativeDiffCount>0);
  report.realCandidatePassed=report.cases.every(x=>x.candidateDiffCount===0);
  report.realDocsPassed=report.realDocs.every(r=>r.elements>=25 && r.errors.length===0 && r.selfDiffs===0 && r.negativeDiffs>0 && r.candidateDiffs===0 && r.selfPixelsEqual && r.negativePixelsDetected && r.candidatePixelsEqual);
  report.ok=report.selfPassed&&report.negativePassed&&report.realCandidatePassed&&report.realDocsPassed;
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
