// createApp browser gate (v3 §3): real pointer/keyboard interaction through CDP.
// The online qxframe.js URL is fulfilled from the local dist build (v3 §9).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ONLINE_JS = 'https://loyaoo.github.io/QXFRAME9A7C2/dist/qxframe9a7c2.js';
const browserBin = [process.env.CHROMIUM_BIN, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/opt/pw-browsers/chromium'].filter(Boolean).find(fs.existsSync);
if (!browserBin) { console.error('createApp browser gate requires Chromium (set CHROMIUM_BIN).'); process.exit(1); }
const localJs = fs.readFileSync(path.join(root, 'dist/qxframe9a7c2.js'));

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(root, url);
  if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(file));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-create-app-'));
const child = spawn(browserBin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--no-first-run', '--remote-debugging-port=0', '--window-size=1440,900', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
let endpoint = '', stderr = '';
child.stderr.setEncoding('utf8');
child.stderr.on('data', data => { stderr += data; endpoint = endpoint || (stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/) || [])[1] || ''; });

const results = [];
let socket;
try {
  const deadline = Date.now() + 30000;
  while (!endpoint && Date.now() < deadline && child.exitCode === null) await sleep(50);
  if (!endpoint) throw new Error('Chromium DevTools endpoint timed out: ' + stderr.slice(-800));
  const WebSocketClient = await getWebSocketConstructor();
  socket = new WebSocketClient(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('CDP connect failed')); });
  let id = 0;
  const pending = new Map();
  const listeners = [];
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const entry = pending.get(message.id); pending.delete(message.id);
      return message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
    }
    for (const listener of listeners) listener(message);
  };
  const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, { resolve, reject });
    socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
  const s = (method, params) => call(method, params, sessionId);
  listeners.push(message => {
    if (message.method === 'Fetch.requestPaused' && message.sessionId === sessionId) {
      s('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'text/javascript' }], body: localJs.toString('base64') });
    }
  });
  await s('Fetch.enable', { patterns: [{ urlPattern: ONLINE_JS }] });
  await s('Page.enable');
  await s('Runtime.enable');
  await s('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const errors = [];
  listeners.push(message => { if (message.method === 'Runtime.exceptionThrown' && message.sessionId === sessionId) errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text); });

  const evaluate = async expression => {
    const result = await s('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw new Error('evaluate failed: ' + (result.exceptionDetails.exception?.description || result.exceptionDetails.text));
    return result.result.value;
  };
  const waitFor = async (expression, label, timeout = 5000) => {
    const end = Date.now() + timeout;
    let last;
    while (Date.now() < end) { last = await evaluate(expression); if (last) return last; await sleep(40); }
    throw new Error('timed out waiting for ' + label + ' (last=' + JSON.stringify(last) + ')');
  };
  const center = async selectorExpression => evaluate(`(() => { const el = ${selectorExpression}; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  const mouse = (type, x, y) => s('Input.dispatchMouseEvent', { type, x, y, button: type === 'mouseMoved' ? 'none' : 'left', clickCount: type === 'mouseMoved' ? 0 : 1 });
  const click = async selectorExpression => {
    const p = await center(selectorExpression);
    assert.ok(p, 'element not found: ' + selectorExpression);
    await mouse('mouseMoved', p.x, p.y); await mouse('mousePressed', p.x, p.y); await mouse('mouseReleased', p.x, p.y);
  };
  const hover = async selectorExpression => {
    const p = await center(selectorExpression);
    assert.ok(p, 'element not found: ' + selectorExpression);
    await mouse('mouseMoved', p.x - 4, p.y); await mouse('mouseMoved', p.x, p.y);
  };
  const MOD = { alt: 1, ctrl: 2, meta: 4, shift: 8 };
  const key = async (keyName, modifiers = []) => {
    const mask = modifiers.reduce((sum, m) => sum + MOD[m], 0);
    const code = keyName.length === 1 ? 'Key' + keyName.toUpperCase() : keyName;
    const text = keyName.length === 1 && !modifiers.includes('ctrl') && !modifiers.includes('meta') ? (modifiers.includes('shift') ? keyName.toUpperCase() : keyName) : undefined;
    const vk = keyName === 'Escape' ? 27 : keyName.toUpperCase().charCodeAt(0);
    await s('Input.dispatchKeyEvent', { type: 'keyDown', key: modifiers.includes('shift') && keyName.length === 1 ? keyName.toUpperCase() : keyName, code, modifiers: mask, windowsVirtualKeyCode: vk, text });
    await s('Input.dispatchKeyEvent', { type: 'keyUp', key: keyName, code, modifiers: mask, windowsVirtualKeyCode: vk });
  };
  const step = async (name, fn) => { await fn(); results.push(name); };
  const state = () => evaluate('JSON.stringify({ config: window.QXFRAME9A7C2_CREATE.state.config, search: location.search })').then(JSON.parse);
  const frameAttr = attr => `(document.querySelector('[data-create-frame]').contentDocument || {}).documentElement && document.querySelector('[data-create-frame]').contentDocument.documentElement.getAttribute('${attr}')`;
  const menuItem = label => `[...document.querySelectorAll('.create-picker-menu .qxframe9a7c2-dropdown-item')].find(el => el.offsetParent && el.textContent.trim().startsWith(${JSON.stringify(label)}))`;

  await s('Page.navigate', { url: origin + '/docs/create/index.html' });
  await waitFor('!!(window.QXFRAME9A7C2_CREATE && document.querySelectorAll("[data-create-picker]").length > 30)', 'createApp boot');
  await waitFor(`${frameAttr('data-create-style')} === 'nova'`, 'preview ready');
  await evaluate('localStorage.clear()');

  await step('Card skeleton retains shimmer while shared Skeleton animation none disables both families',async()=>{
    const sample=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument;\n const h=d.documentElement,slot=d.createElement('section');\n slot.innerHTML='<div class=\"qxframe9a7c2-skeleton\" style=\"width:5rem;height:1rem\"></div><div class=\"qxframe9a7c2-card-skeleton\"><span class=\"qxframe9a7c2-card-skeleton-line is-title\"></span></div>';\n slot.style.cssText='position:absolute;left:-9999px;top:0';\n d.body.append(slot);\n const primitive=slot.querySelector('.qxframe9a7c2-skeleton'),card=slot.querySelector('.qxframe9a7c2-card-skeleton-line');\n const old=h.style.getPropertyValue('--qxframe9a7c2-theme-skeleton-animation');\n const initial={primitive:getComputedStyle(primitive).animationName,card:getComputedStyle(card).animationName};\n h.style.setProperty('--qxframe9a7c2-theme-skeleton-animation','none');\n const off={primitive:getComputedStyle(primitive).animationName,card:getComputedStyle(card).animationName};\n if(old)h.style.setProperty('--qxframe9a7c2-theme-skeleton-animation',old);else h.style.removeProperty('--qxframe9a7c2-theme-skeleton-animation');\n const restored={primitive:getComputedStyle(primitive).animationName,card:getComputedStyle(card).animationName};\n slot.remove();\n return {initial,off,restored};\n})()");
    assert.equal(sample.initial.primitive,'qxframe9a7c2-skeleton-pulse','base Skeleton retains pulse');
    assert.equal(sample.initial.card,'qxframe9a7c2-card-skeleton','Card retains shimmer, not pulse');
    assert.equal(sample.off.primitive,'none','global Skeleton none must stop base Skeleton');
    assert.equal(sample.off.card,'none','global Skeleton none must also stop Card shimmer');
    assert.deepEqual(sample.restored,sample.initial,'restoring the common Token restores both animation types');
  });

  await step('Input skin variants, symmetric Tag padding and Open/Checkbox Cascader columns: 8 Styles x light/dark',async()=>{
    const cases=await evaluate("(() => {\nconst api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,orig=api.state.config,wasDark=h.classList.contains('dark');\nconst host=d.createElement('section'),sheet=d.createElement('style');host.style.cssText='position:absolute;left:-10000px;top:0;width:26rem';\nhost.innerHTML='<div class=\"qxframe9a7c2-input is-tags\" data-compound><div class=\"qxframe9a7c2-tags is-hosted\"><div class=\"qxframe9a7c2-tags-surface\"><span class=\"qxframe9a7c2-tag\">Tag</span></div></div></div><div class=\"qxframe9a7c2-input qxframe9a7c2-select is-multiple\" data-multi><span class=\"qxframe9a7c2-tag\">Tag</span></div>'+\n'<div class=\"qxframe9a7c2-popup-surface\" data-popup><div class=\"qxframe9a7c2-item-surface is-hover\" data-hover>Hover</div><div class=\"qxframe9a7c2-item-surface is-open is-descendant-selected\" data-open>Open<span class=\"qxframe9a7c2-item-selection-indicator is-checkbox is-checked\" data-checkbox></span></div></div>'+\n'<div class=\"qxframe9a7c2-cascader-panel qxframe9a7c2-popup-surface\" style=\"position:relative;width:100%;--qxframe9a7c2-cascader-column-count:3\" data-cascader><div class=\"qxframe9a7c2-cascader-popup-content\"><div class=\"qxframe9a7c2-cascader-columns\">'+\n[0,1,2].map(i=>'<div class=\"qxframe9a7c2-cascader-column\"><div class=\"qxframe9a7c2-item-collection\">Level '+i+'</div></div>').join('')+'</div></div></div>';\nhost.insertAdjacentHTML('beforeend','<div class=\"qxframe9a7c2-tree\"><div class=\"qxframe9a7c2-item-surface qxframe9a7c2-tree-item is-open\" data-tree-open>Tree Open<span class=\"qxframe9a7c2-tree-check-indicator\" data-tree-check></span></div></div>');\nhost.insertAdjacentHTML('beforeend','<div class=\"qxframe9a7c2-menu\"><div class=\"qxframe9a7c2-menu-item is-hover\" data-menu-hover>Menu Hover</div><div class=\"qxframe9a7c2-menu-item is-open\" data-menu-open>Menu Open</div><div class=\"qxframe9a7c2-menu-item is-selected\" data-menu-selected>Menu Selected</div><div class=\"qxframe9a7c2-menu-item is-active\" data-menu-active>Menu Active</div></div>');\nhost.insertAdjacentHTML('beforeend','<div class=\"qxframe9a7c2-tree\"><div class=\"qxframe9a7c2-item-surface qxframe9a7c2-tree-item is-selected\" data-tree-selected>Selected</div><div class=\"qxframe9a7c2-item-surface qxframe9a7c2-tree-item is-descendant-selected\" data-tree-parent>Ancestor</div><span data-primary-ink style=\"color:var(--qxframe9a7c2-theme-primary)\">P</span></div>');\nd.head.append(sheet);d.body.append(host);\n// These computed-style probes must measure resolved paint, not an in-flight\n// transition from the preceding configuration (native Input and MenuItem\n// transition their painted backgrounds during Theme switches).\nhost.querySelectorAll('.qxframe9a7c2-input,.qxframe9a7c2-item-surface,.qxframe9a7c2-item-selection-indicator,.qxframe9a7c2-tree-check-indicator,.qxframe9a7c2-menu-item').forEach(x=>x.style.setProperty('transition','none','important'));\nconst css=s=>d.defaultView.getComputedStyle(host.querySelector(s));const cases=[];\nfor(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){\n h.classList.toggle('dark',dark);\n for(const look of ['outline','subtle','tinted','soft']){\n  sheet.textContent=api.compileTheme({...orig,style,ext:{...orig.ext,inputLook:look},menuAccent:'bold',menuColor:'inverted'},{generatedAt:''}).body;\n  const compound=css('[data-compound]'),multi=css('[data-multi]');\n  cases.push({style,dark,look,field:css('[data-compound]').backgroundColor,padX:compound.paddingInlineStart,padY:compound.paddingBlockStart,multiX:multi.paddingInlineStart,multiY:multi.paddingBlockStart});\n }\n for(const accent of ['subtle','bold']){\n  sheet.textContent=api.compileTheme({...orig,style,menuAccent:accent,menuColor:'inverted'},{generatedAt:''}).body;\n  const hover=css('[data-hover]'),open=css('[data-open]'),check=css('[data-checkbox]'),menu=css('[data-popup]');\n  const col=host.querySelector('.qxframe9a7c2-cascader-columns'),sizes=[...col.children].map(x=>x.getBoundingClientRect());\n  cases.push({style,dark,accent,hoverBg:hover.backgroundColor,openBg:open.backgroundColor,menuAccent:getComputedStyle(host.querySelector('[data-open]')).getPropertyValue('--qxframe9a7c2-theme-menu-accent'),openInk:open.color,checkBg:check.backgroundColor,checkInk:check.color,treeBg:css('[data-tree-open]').backgroundColor,treeInk:css('[data-tree-open]').color,treeLocalAccent:css('[data-tree-open]').getPropertyValue('--qxframe9a7c2-theme-menu-accent').trim(),treeLocalAccentFg:css('[data-tree-open]').getPropertyValue('--qxframe9a7c2-theme-menu-accent-foreground').trim(),treeCheckBg:css('[data-tree-check]').backgroundColor,menuOpenBg:css('[data-menu-open]').backgroundColor,menuOpenInk:css('[data-menu-open]').color,menuHoverBg:css('[data-menu-hover]').backgroundColor,menuSelectedInk:css('[data-menu-selected]').color,menuActiveInk:css('[data-menu-active]').color,menuHoverInk:css('[data-menu-hover]').color,navInk:css('.qxframe9a7c2-menu').color,treeSelectedBg:css('[data-tree-selected]').backgroundColor,treeSelectedInk:css('[data-tree-selected]').color,treeParentBg:css('[data-tree-parent]').backgroundColor,treeParentInk:css('[data-tree-parent]').color,treeNormalInk:css('[data-tree-open]').color,treePrimaryInk:css('[data-primary-ink]').color,menuLocalAccent:css('[data-menu-open]').getPropertyValue('--qxframe9a7c2-theme-menu-accent').trim(),menuLocalAccentFg:css('[data-menu-open]').getPropertyValue('--qxframe9a7c2-theme-menu-accent-foreground').trim(),hoverInk:hover.color,menuInk:menu.color,gapA:sizes[1].left-sizes[0].right,gapB:sizes[2].left-sizes[1].right,overflow:col.scrollWidth-col.clientWidth});\n }\n}\nh.classList.toggle('dark',wasDark);host.remove();sheet.remove();return cases;\n})()");
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){
      const group=cases.filter(x=>x.style===style&&x.dark===dark),id=style+'/'+dark;
      const fill=Object.fromEntries(group.filter(x=>x.look).map(x=>[x.look,x]));
      assert.equal(fill.outline.field,'rgba(0, 0, 0, 0)',id+' outlined Input must be transparent, including dark');
      assert.notEqual(fill.subtle.field,fill.tinted.field,id+' subtle and tinted backgrounds differ');
      assert.notEqual(fill.tinted.field,fill.soft.field,id+' tinted differs from soft fill');
      for(const skin of Object.values(fill)){
        assert.equal(skin.padX,skin.padY,id+' '+skin.look+' TagInput symmetric outer inset');
        assert.equal(skin.multiX,skin.multiY,id+' '+skin.look+' Multiple Select symmetric outer inset');
      }
      for(const x of group.filter(x=>x.accent)){
        assert.notEqual(x.openBg,x.hoverBg,id+'/'+x.accent+' Open differs from Hover');
        assert.equal(x.checkBg,x.openInk,id+'/'+x.accent+' Checkbox fill follows Open ink');
        assert.notEqual(x.treeBg,x.menuLocalAccent,id+'/'+x.accent+' official Tree Open uses shared Item paint, not Menu accent');
        if(x.accent==='bold')assert.notEqual(x.treeBg,x.treeLocalAccent,id+' Tree Open is independent of saturated accent');
        assert.notEqual(x.menuOpenBg,x.menuLocalAccent,id+'/'+x.accent+' standalone Navigation must not consume inverted Popup accent');
        for(const key of ['menuOpenInk','menuSelectedInk','menuActiveInk','menuHoverInk'])
          assert.equal(x[key],x.navInk,id+'/'+x.accent+' '+key+' follows Sidebar, not inverse Popup Menu ink');
        assert.notEqual(x.menuOpenBg,x.menuHoverBg,id+'/'+x.accent+' standalone Navigation Open differs from neutral Hover');
        assert.equal(x.treeSelectedBg,x.treeBg,id+'/'+x.accent+' selected Tree is not filled');
        assert.equal(x.treeParentBg,x.treeBg,id+'/'+x.accent+' ancestor Tree state is not filled');
        assert.equal(x.treeSelectedInk,x.treePrimaryInk,id+'/'+x.accent+' selected Tree keeps only Primary ink');
        assert.equal(x.treeParentInk,x.treeNormalInk,id+'/'+x.accent+' ancestor Tree text stays neutral');
        assert.notEqual(x.checkInk,x.checkBg,id+'/'+x.accent+' Checkbox mark ink contrasts with its foreground-colored fill');
        assert.ok(Math.abs(x.gapA)<=1&&Math.abs(x.gapB)<=1,id+' Cascader columns must be contiguous');
        assert.ok(x.overflow<=1,id+' Cascader must not horizontally overflow');
      }
    }
  });


  await step('Stage5 P1 real Message/Notification Radius and subtle ink in both modes',async()=>{
    const out=await evaluate(`(() => {
      const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument;
      const q=d.defaultView.QXFRAME9A7C2,orig=api.state.config,root=d.documentElement,wasDark=root.classList.contains('dark');
      if(!q?.Components?.Message?.create || !q?.Components?.Notification?.create)return {error:'Missing real Notice exports'};
      const theme=d.createElement('style'),override=d.createElement('style');
      d.head.append(theme,override);
      const message=q.Components.Message.create({content:'Radius QA Message',duration:0,closable:true,document:d});
      const notice=q.Components.Notification.create({title:'Radius QA',content:'Notification',duration:0,closable:true,document:d});
      const samples=[];
      const selectors=['.qxframe9a7c2-message-root','.qxframe9a7c2-notification-root','.qxframe9a7c2-message-stack .qxframe9a7c2-notice-slot','.qxframe9a7c2-notification-stack .qxframe9a7c2-notice-slot','.qxframe9a7c2-message-close','.qxframe9a7c2-notification-close'];
      for(const dark of [false,true]){
        root.classList.toggle('dark',dark);
        theme.textContent=api.compileTheme({...orig,style:'vega',menuAccent:'subtle'},{generatedAt:''}).body;
        for(const radius of ['0rem','0.875rem']){
          override.textContent=':root,.dark{--qxframe9a7c2-theme-radius-card:'+radius+' !important;--qxframe9a7c2-theme-radius-button:'+radius+' !important}';
          const values=selectors.map(selector=>{const el=d.querySelector(selector);return el?d.defaultView.getComputedStyle(el).borderTopLeftRadius:null});
          const probe=d.createElement('i');probe.style.cssText='color:var(--qxframe9a7c2-theme-menu-accent-foreground);background:var(--qxframe9a7c2-theme-menu-accent)';
          d.body.append(probe);
          const ink=d.defaultView.getComputedStyle(probe).color;
          probe.style.color='var(--qxframe9a7c2-theme-popover-foreground)';
          const expectedInk=d.defaultView.getComputedStyle(probe).color;probe.remove();
          samples.push({dark,radius,values,ink,expectedInk});
        }
      }
      try{q.Components.Message.closeAll();q.Components.Notification.closeAll()}catch(_){}
      root.classList.toggle('dark',wasDark);theme.remove();override.remove();
      return {samples};
    })()`);
    assert.ok(!out.error,out.error);
    assert.equal(out.samples.length,4,'both modes x zero/nonzero radius');
    for(const sample of out.samples){
      assert.equal(sample.values.length,6,'card, slot and close selectors');
      sample.values.forEach((radius,i)=>assert.equal(radius,sample.radius==='0rem'?'0px':'14px','Notice real shape '+i+'/'+JSON.stringify(sample)));
      assert.equal(sample.ink,sample.expectedInk,'subtle ink resolves to Popover foreground in actual CSS Color 4 syntax');
    }
  });

  await step('Menu inverse Picker descendants use readable local semantic roles (8 Styles x 2 modes x 4 Menu variants)',async()=>{
    const result=await evaluate("(() => {"+
      "const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;"+
      "const orig=api.state.config,wasDark=h.classList.contains('dark');"+
      "const host=d.createElement('div'),sheet=d.createElement('style');"+
      "host.style.cssText='position:absolute;left:-10000px;top:0;width:18rem';"+
      "host.innerHTML='<div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-picker-field-panel\">'+"+
      "'<div class=\"qxframe9a7c2-item-collection\"><div class=\"qxframe9a7c2-item-collection-group\">Group</div><input class=\"qxframe9a7c2-item-collection-search-input\" placeholder=\"Search\"><div class=\"qxframe9a7c2-item-surface is-hover\">Hover</div><div class=\"qxframe9a7c2-item-surface qxframe9a7c2-cascader-item is-open is-descendant-selected\">Open ancestor</div><div class=\"qxframe9a7c2-item-surface is-selected\">Selected</div></div>'+"+
      "'<div class=\"qxframe9a7c2-date-panel\"><button class=\"qxframe9a7c2-date-panel-cell is-plain\">Normal</button><button class=\"qxframe9a7c2-date-panel-cell is-hover\">Hover</button><button class=\"qxframe9a7c2-date-panel-cell is-today\">Today</button><button class=\"qxframe9a7c2-date-panel-cell is-selected\">Chosen</button><button class=\"qxframe9a7c2-date-panel-nav\">Next</button></div>'+"+
      "'<div class=\"qxframe9a7c2-period-panel\"><button class=\"qxframe9a7c2-date-panel-cell qxframe9a7c2-period-panel-cell is-selected\">Q4</button></div>'+"+
      "'<div class=\"qxframe9a7c2-wheel-panel\"><div class=\"qxframe9a7c2-wheel-panel-columns\"><div class=\"qxframe9a7c2-wheel-panel-column\"><div class=\"qxframe9a7c2-wheel-panel-item\">09</div><div class=\"qxframe9a7c2-wheel-panel-item is-selected\">10</div></div></div><div class=\"qxframe9a7c2-wheel-panel-center-guide\"></div></div>'+"+
      "'<button class=\"qxframe9a7c2-date-picker-preset\">Today</button>'+"+
      "'<div class=\"qxframe9a7c2-color-panel\"><i data-hue-rail-probe style=\"display:block;height:var(--_qxframe9a7c2-slider-rail,var(--qxframe9a7c2-slider-rail,0.25rem))\"></i><i data-hue-thumb-probe style=\"display:block;width:var(--_qxframe9a7c2-slider-handle-width,var(--qxframe9a7c2-slider-handle-width,var(--qxframe9a7c2-slider-handle,var(--qxframe9a7c2-slider-handle-width-md,1rem))))\"></i><input class=\"qxframe9a7c2-color-panel-input\" value=\"#ffffff\"><button class=\"qxframe9a7c2-color-panel-format\">HEX</button><button class=\"qxframe9a7c2-color-panel-eye\">Eye</button><button class=\"qxframe9a7c2-color-panel-preset is-hover\">Hover</button><button class=\"qxframe9a7c2-color-panel-preset is-active\">Active</button><input type=\"range\" class=\"qxframe9a7c2-color-panel-hue\" min=\"0\" max=\"360\" value=\"180\"></div><div class=\"qxframe9a7c2-slider\"><div class=\"qxframe9a7c2-slider-rail\"></div><button class=\"qxframe9a7c2-slider-handle\"></button></div><i data-menu-soft style=\"background:var(--_qxframe9a7c2-menu-hover-soft);border:1px solid var(--qxframe9a7c2-theme-field-border)\"></i></div>'+"+
      "'<div data-standalone-color class=\"qxframe9a7c2-color-panel\"><input class=\"qxframe9a7c2-color-panel-input\" value=\"#ffffff\"><button class=\"qxframe9a7c2-color-panel-format\">HEX</button><button class=\"qxframe9a7c2-color-panel-eye\">Eye</button></div>'+"+
      "'<div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-popover-container\"><span class=\"qxframe9a7c2-item-collection\">Popover</span></div>'+"+
      "'<i class=\"qxframe9a7c2-popup-surface\" data-menu-accent-soft style=\"background:var(--_qxframe9a7c2-menu-selected-soft)\"></i><i data-menu-solid style=\"color:oklch(from var(--qxframe9a7c2-theme-menu-accent) l c h / 1)\"></i><i data-menu-focus style=\"color:var(--qxframe9a7c2-theme-pointer-focus)\"></i><i data-menu-fg style=\"color:var(--qxframe9a7c2-theme-menu-foreground)\"></i><i data-menu-accent style=\"color:var(--qxframe9a7c2-theme-menu-accent-foreground);background:var(--qxframe9a7c2-theme-menu-accent)\"></i><i data-popover-fg style=\"color:var(--qxframe9a7c2-theme-popover-foreground)\"></i>';"+
      "d.head.append(sheet);d.body.append(host);"+
      "const panel=host.querySelector('.qxframe9a7c2-picker-field-panel');['accent-soft','solid','fg','accent'].forEach(name=>panel.append(host.querySelector('[data-menu-'+name+']')));"+
      "const css=(x,pseudo)=>d.defaultView.getComputedStyle(x,pseudo);const query=x=>host.querySelector(x);"+
      "const cases=[];for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true])for(const menuColor of ['default','default-translucent','inverted','inverted-translucent']){"+
      "h.classList.toggle('dark',dark);sheet.textContent=api.compileTheme({...orig,style,menuColor},{generatedAt:''}).body;"+
      "const menuFg=css(query('[data-menu-fg]')).color,accent=css(query('[data-menu-accent]')),popup=css(query('.qxframe9a7c2-picker-field-panel'));"+
      "cases.push({style,dark,menuColor,menuFg,rows:css(query('.qxframe9a7c2-item-collection')).color,collectionBg:css(query('.qxframe9a7c2-item-collection')).backgroundColor,group:css(query('.qxframe9a7c2-item-collection-group')).color,"+
      "search:css(query('.qxframe9a7c2-item-collection-search-input')).color,hover:css(query('.qxframe9a7c2-item-surface.is-hover')).color,hoverBg:css(query('.qxframe9a7c2-item-surface.is-hover')).backgroundColor,openBg:css(query('.qxframe9a7c2-cascader-item.is-open')).backgroundColor,openFg:css(query('.qxframe9a7c2-cascader-item.is-open')).color,softSelectedBg:css(query('[data-menu-accent-soft]')).backgroundColor,softBg:css(query('[data-menu-soft]')).backgroundColor,neutralBorder:css(query('[data-menu-soft]')).borderTopColor,selected:css(query('.qxframe9a7c2-item-surface.is-selected')).color,selectedBg:css(query('.qxframe9a7c2-item-surface.is-selected')).backgroundColor,"+
      "accentFg:accent.color,accentBg:accent.backgroundColor,menuSolid:css(query('[data-menu-solid]')).color,normal:css(query('.qxframe9a7c2-date-panel-cell.is-plain')).color,today:css(query('.qxframe9a7c2-date-panel-cell.is-today')).color,todayDot:css(query('.qxframe9a7c2-date-panel-cell.is-today'),'::after').backgroundColor,"+
      "dateHoverBg:css(query('.qxframe9a7c2-date-panel-cell.is-hover')).backgroundColor,dateSelected:css(query('.qxframe9a7c2-date-panel-cell.is-selected')).color,periodSelected:css(query('.qxframe9a7c2-period-panel-cell.is-selected')).color,"+
      "wheel:css(query('.qxframe9a7c2-wheel-panel-item.is-selected')).color,wheelBg:css(query('.qxframe9a7c2-wheel-panel-item.is-selected')).backgroundColor,wheelNormal:css(query('.qxframe9a7c2-wheel-panel-item:not(.is-selected)')).color,wheelRowsZ:css(query('.qxframe9a7c2-wheel-panel-columns')).zIndex,wheelGuideZ:css(query('.qxframe9a7c2-wheel-panel-center-guide')).zIndex,preset:css(query('.qxframe9a7c2-date-picker-preset')).color,"+
      "colorInput:css(query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-input')).color,colorInputBorder:css(query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-input')).borderTopColor,colorInputFocused:query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-input').matches(':focus'),focusBorder:css(query('[data-menu-focus]')).color,colorFormatBorder:css(query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-format')).borderTopColor,colorEyeBorder:css(query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-eye')).borderTopColor,presetHoverBorder:css(query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-preset.is-hover')).borderTopColor,presetActiveBorder:css(query('.qxframe9a7c2-picker-field-panel .qxframe9a7c2-color-panel-preset.is-active')).borderTopColor,standaloneInputBorder:css(query('[data-standalone-color] .qxframe9a7c2-color-panel-input')).borderTopColor,standaloneInputFocused:query('[data-standalone-color] .qxframe9a7c2-color-panel-input').matches(':focus'),standaloneFormatBorder:css(query('[data-standalone-color] .qxframe9a7c2-color-panel-format')).borderTopColor,standaloneEyeBorder:css(query('[data-standalone-color] .qxframe9a7c2-color-panel-eye')).borderTopColor,wheelGuideBorder:css(query('.qxframe9a7c2-wheel-panel-center-guide')).borderTopColor,wheelGuideBg:css(query('.qxframe9a7c2-wheel-panel-center-guide')).backgroundColor,hueRail:css(query('[data-hue-rail-probe]')).height,sliderRail:css(query('.qxframe9a7c2-slider-rail')).height,hueThumb:css(query('[data-hue-thumb-probe]')).width,sliderThumb:css(query('.qxframe9a7c2-slider-handle')).width,popover:css(query('.qxframe9a7c2-popover-container .qxframe9a7c2-item-collection')).color,popoverFg:css(query('[data-popover-fg]')).color});"+
      "}h.classList.toggle('dark',wasDark);host.remove();sheet.remove();return cases;})()");
    assert.equal(result.length,64,'8 Styles x 2 modes x 4 Menu modes');
    for(const r of result){
      const id=r.style+'/'+r.dark+'/'+r.menuColor;
      for(const field of ['rows','search','normal','today','wheelNormal','preset','colorInput'])
        assert.equal(r[field],r.menuFg,id+' '+field+' uses Menu foreground');
      assert.ok(Number(r.wheelRowsZ)>Number(r.wheelGuideZ),id+' wheel text layer must paint above selection guide');
      assert.equal(r.wheel,r.accentFg,id+' selected Wheel text pairs with Menu accent, not idle foreground');
      assert.equal(r.wheelBg,'rgba(0, 0, 0, 0)',id+' TimePicker leaves selected wheel background to TimePanel guide');
      assert.equal(r.collectionBg,'rgba(0, 0, 0, 0)',id+' nested collection is transparent; only Popup owns Menu backdrop opacity');
      assert.equal(r.hover,r.menuFg,id+' hover Item keeps Menu foreground');
      assert.equal(r.hoverBg,r.softBg,id+' hover Item uses neutral Menu mix, not selected paint');
      assert.equal(r.dateHoverBg,r.softBg,id+' Calendar hover uses the same neutral Menu mix');
      assert.equal(r.openFg,r.accentFg,id+' Cascader open ancestor uses Menu accent foreground');
      assert.equal(r.openBg,r.accentBg,id+' Cascader open ancestor uses theme-tinted or vivid Menu accent, never Hover');
      assert.equal(r.colorInputBorder,r.colorInputFocused?r.menuSolid:r.colorFormatBorder,id+' ColorPanel input focused border uses Menu Primary, idle shared border');
      assert.equal(r.colorEyeBorder,r.colorFormatBorder,id+' embedded ColorPanel eye and format must share the passive border owner');
      assert.equal(r.standaloneInputBorder,r.standaloneInputFocused?r.focusBorder:r.standaloneFormatBorder,id+' standalone ColorPanel input uses focus role only when focused; otherwise shared border (focus='+r.standaloneInputFocused+')');
      assert.equal(r.standaloneEyeBorder,r.standaloneFormatBorder,id+' standalone ColorPanel eye and format must share their border owner');
      if(!r.colorInputFocused)assert.notEqual(r.colorInputBorder,r.accentBg,id+' passive ColorPanel border never becomes Menu accent');
      assert.notEqual(r.presetHoverBorder,r.presetActiveBorder,id+' native ColorPanel preset hover border differs from selected');
      assert.equal(r.presetHoverBorder,r.neutralBorder,id+' ColorPanel preset hover uses neutral border');
      assert.equal(r.presetActiveBorder,r.menuSolid,id+' ColorPanel active preset border uses visible Menu Primary');
      assert.equal(r.wheelGuideBorder,r.accentBg,id+' WheelPanel guide border retains Menu accent');
      assert.equal(r.wheelGuideBg,r.accentBg,id+' guide fill uses one Menu accent: solid bold, tinted subtle');
      assert.equal(r.todayDot,r.menuSolid,id+' Today dot uses solid dark/inverted Menu Primary');
      // Chromium's computed pseudo-range height mirrors the host input, not its native track.
      // Probe the computed shared recipe; the source gate enforces pseudo-track consumption.
      assert.equal(r.hueRail,r.sliderRail,id+' ColorPanel native hue track recipe matches Slider rail');
      assert.equal(r.hueThumb,r.sliderThumb,id+' ColorPanel native hue thumb matches Slider handle');
      assert.equal(r.selected,r.accentFg,id+' selected Item uses Menu accent foreground');
      assert.equal(r.selectedBg,r.softSelectedBg,id+' selected Item uses shared alpha Menu accent overlay');
      assert.notEqual(r.selectedBg,r.accentBg,id+' selected Item cannot turn translucent Popup opaque');
      assert.equal(r.dateSelected,r.accentFg,id+' selected Date uses Menu accent foreground');
      assert.equal(r.periodSelected,r.accentFg,id+' selected Period uses Menu accent foreground');
      assert.equal(r.popover,r.popoverFg,id+' Popover is independent of Menu color');
      assert.notEqual(r.group,'rgba(0, 0, 0, 0)',id+' group label has paint');
    }
  });


  await step('TagInput and Multiple Select match Input single-row geometry; Cascader wraps without horizontal overflow',async()=>{
    const samples=await evaluate("(() => {\nconst api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,orig=api.state.config,wasDark=h.classList.contains('dark');\nconst host=d.createElement('div'),sheet=d.createElement('style');\nhost.style.cssText='position:absolute;left:-10000px;top:0;width:22rem';\nd.head.append(sheet);d.body.append(host);\nconst samples=[];\nfor(const size of ['sm','md','lg']){\nconst container=d.createElement('section');container.dataset.size=size;\nconst c='qxframe9a7c2-input is-'+size;\ncontainer.innerHTML='<div data-geo=\"input\" class=\"'+c+'\"><input class=\"qxframe9a7c2-input-control\" /></div>'+\n'<div data-geo=\"tagempty\" class=\"'+c+' qxframe9a7c2-tag-input is-tags\"><div class=\"qxframe9a7c2-tags is-hosted\"><div class=\"qxframe9a7c2-tags-surface\"><input class=\"qxframe9a7c2-tags-input\" /></div></div></div>'+\n'<div data-geo=\"tagfilled\" class=\"'+c+' qxframe9a7c2-tag-input is-tags has-value\"><div class=\"qxframe9a7c2-tags is-hosted\"><div class=\"qxframe9a7c2-tags-surface\"><span class=\"qxframe9a7c2-tag\">Alpha</span><input class=\"qxframe9a7c2-tags-input\" /></div></div></div>'+\n'<div data-geo=\"selectempty\" class=\"'+c+' qxframe9a7c2-select is-multiple\"><div class=\"qxframe9a7c2-select-values qxframe9a7c2-input-values\"></div><input class=\"qxframe9a7c2-input-control\" /></div>'+\n'<div data-geo=\"selectfilled\" class=\"'+c+' qxframe9a7c2-select is-multiple\"><div class=\"qxframe9a7c2-select-values qxframe9a7c2-input-values\"><span class=\"qxframe9a7c2-tag\">Alpha</span></div><input class=\"qxframe9a7c2-input-control\" /></div>';\nhost.append(container);\n}\nconst cas=d.createElement('div');cas.style.cssText='position:relative;width:18rem';\ncas.innerHTML='<div class=\"qxframe9a7c2-cascader-panel qxframe9a7c2-popup-surface\" style=\"position:relative\"><div class=\"qxframe9a7c2-cascader-popup-content qxframe9a7c2-scroll\"><div class=\"qxframe9a7c2-cascader-columns qxframe9a7c2-scroll-viewport\">'+\nArray.from({length:3},(_,i)=>'<div class=\"qxframe9a7c2-cascader-column\"><div class=\"qxframe9a7c2-item-collection\"><div class=\"qxframe9a7c2-item-surface\">Extended Cascader option '+i+'</div></div></div>').join('')+\n'</div></div></div>';host.append(cas);\nfor(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){\nh.classList.toggle('dark',dark);sheet.textContent=api.compileTheme({...orig,style,menuColor:'inverted-translucent'},{generatedAt:''}).body;\nconst measurements={};\nfor(const size of ['sm','md','lg']){\nconst section=host.querySelector('[data-size=\"'+size+'\"]');measurements[size]={};\nfor(const el of section.querySelectorAll('[data-geo]')){const cs=d.defaultView.getComputedStyle(el);measurements[size][el.dataset.geo]={height:el.getBoundingClientRect().height,paddingX:cs.paddingInlineStart,paddingY:cs.paddingBlockStart};}\nconst tagChip=d.defaultView.getComputedStyle(section.querySelector('[data-geo=tagfilled] .qxframe9a7c2-tag'));\nconst selectChip=d.defaultView.getComputedStyle(section.querySelector('[data-geo=selectfilled] .qxframe9a7c2-tag'));\nmeasurements[size].tagChipPaddingX=tagChip.paddingInlineStart;\nmeasurements[size].tagChipPaddingEnd=tagChip.paddingInlineEnd;\nmeasurements[size].selectChipPaddingX=selectChip.paddingInlineStart;\n}\nconst columns=cas.querySelector('.qxframe9a7c2-cascader-columns'),panel=cas.querySelector('.qxframe9a7c2-cascader-panel');\nsamples.push({style,dark,measurements,overflow:columns.scrollWidth-columns.clientWidth,panelWidth:panel.getBoundingClientRect().width,hostWidth:cas.getBoundingClientRect().width,smallestColumn:Math.min(...[...columns.children].map(x=>x.getBoundingClientRect().width))});\n}\nh.classList.toggle('dark',wasDark);host.remove();sheet.remove();return samples;\n})()");
    assert.equal(samples.length,16,'8 Styles x 2 mode compound-input and Cascader matrix');
    for(const r of samples){
      const id=r.style+'/'+r.dark;
      for(const [size,rows] of Object.entries(r.measurements)){
        for(const kind of ['tagempty','tagfilled','selectempty','selectfilled']){
          assert.ok(Math.abs(rows[kind].height-rows.input.height)<=.5,id+'/'+size+'/'+kind+' single-row height matches Input: '+rows[kind].height+' vs '+rows.input.height);
          assert.equal(rows[kind].paddingX,rows[kind].paddingY,id+'/'+size+'/'+kind+' equal outer inline/block compound insets');
          assert.equal(rows[kind].paddingY,rows.input.paddingY,id+'/'+size+'/'+kind+' vertical padding matches Input');
        }
        assert.ok(parseFloat(rows.tagChipPaddingX)>=2,id+'/'+size+' hosted Tag has visible left chip inset');
        assert.equal(rows.tagChipPaddingX,rows.tagChipPaddingEnd,id+'/'+size+' hosted Tag has symmetric chip insets');
        assert.equal(rows.tagChipPaddingX,rows.selectChipPaddingX,id+'/'+size+' hosted Tag padding matches Select multiple chip');
      }
      assert.ok(r.overflow<=1,id+' Cascader columns never exceed viewport width');
      assert.ok(r.panelWidth<=r.hostWidth,id+' Cascader Popup width fits local host');
      assert.ok(r.smallestColumn>=50,id+' Cascader columns shrink without clipping or horizontal scroll');
    }
  });


  await step('Tooltip and Popconfirm share arrow geometry, surface alpha and all placements: 8 Styles x 2 modes x 4 sides',async()=>{
    const rows=await evaluate("(() => {\n const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,orig=api.state.config,old=h.classList.contains('dark');\n const holder=d.createElement('div'),sheet=d.createElement('style');\n holder.style.cssText='position:absolute;left:-10000px;top:0;width:24rem;height:24rem';\n holder.innerHTML='<div class=\"qxframe9a7c2-popover-root\" data-popover-root style=\"width:10rem;height:4rem;--qxframe9a7c2-popover-bg:rgba(12,44,88,.64)\"><span class=\"qxframe9a7c2-popover-arrow\"></span><div class=\"qxframe9a7c2-popover-container qxframe9a7c2-popup-surface\">Popover</div></div>'+\n '<div class=\"qxframe9a7c2-tooltip-root\" data-tooltip-root style=\"width:10rem;height:4rem;--qxframe9a7c2-tooltip-bg:rgba(12,44,88,.64)\"><span class=\"qxframe9a7c2-tooltip-arrow\"></span><div class=\"qxframe9a7c2-tooltip-container qxframe9a7c2-popup-surface\">Tooltip</div></div>';\n d.head.append(sheet);d.body.append(holder);const rows=[];\n const get=(s)=>d.defaultView.getComputedStyle(holder.querySelector(s));\n try{\n  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){\n   sheet.textContent=api.compileTheme({...orig,style},{generatedAt:''}).body;h.classList.toggle('dark',dark);\n   for(const place of ['top','bottom','left','right']){\n    holder.querySelector('[data-popover-root]').dataset.placement=place;holder.querySelector('[data-tooltip-root]').dataset.placement=place;\n    const p=get('.qxframe9a7c2-popover-arrow'),t=get('.qxframe9a7c2-tooltip-arrow'),body=get('.qxframe9a7c2-tooltip-container');\n    const geom=x=>({width:x.width,height:x.height,transform:x.transform,top:x.top,bottom:x.bottom,left:x.left,right:x.right,marginLeft:x.marginLeft,marginTop:x.marginTop,borderTop:x.borderTopWidth,borderRight:x.borderRightWidth,borderBottom:x.borderBottomWidth,borderLeft:x.borderLeftWidth});\n    rows.push({style,dark,place,p:geom(p),t:geom(t),arrowBg:t.backgroundColor,bodyBg:body.backgroundColor,arrowOpacity:t.opacity,clip:t.clipPath});\n   }\n  }\n }finally{h.classList.toggle('dark',old);sheet.remove();holder.remove()}\n return rows;\n})()");
    assert.equal(rows.length,64,'exact 64 arrow equivalence cases');
    for(const r of rows){
      const key=r.style+'/'+r.dark+'/'+r.place;
      assert.equal(r.t.width,r.p.width,key+' identical arrow width');
      assert.equal(r.t.height,r.p.height,key+' identical arrow height');
      assert.equal(r.t.transform,r.p.transform,key+' same 45-degree square');
      for(const side of ['top','bottom','left','right','marginLeft','marginTop','borderTop','borderRight','borderBottom','borderLeft'])
        assert.equal(r.t[side],r.p[side],key+' placement and outer border match: '+side);
      assert.equal(r.clip,'none',key+' no Tooltip-only clip polygon');
      assert.equal(r.arrowBg,r.bodyBg,key+' Tooltip arrow matches surface background with identical alpha');
      assert.equal(r.arrowOpacity,'1',key+' no additional Arrow opacity loss');
    }
  });

  await step('Native CSS base-select picker dark and inverted Theme roles: 8 Styles x light/dark x four Menu colors',async()=>{
    const r=await evaluate("(() => {\n const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n const prevDark=h.classList.contains('dark'),orig=api.state.config;\n const host=d.createElement('div'),sheet=d.createElement('style');host.style.cssText='position:absolute;left:-10000px;top:0;width:20rem';\n host.innerHTML='<select class=\"qxframe9a7c2-form-select\" data-qa-native=\"authored\"><option value=\"a\" selected>m@shadcn.com</option><option value=\"b\">m@gmail.com</option><option value=\"c\" disabled>disabled</option></select><div class=\"qxframe9a7c2-native-form\"><select data-qa-native=\"scoped\"><option selected>Scoped</option><option>Two</option></select></div><select data-qa-native=\"bare\"><option selected>Bare</option><option>Two</option></select><select class=\"qxframe9a7c2-form-select\" size=\"3\" data-qa-native=\"multirow\"><option>One</option><option>Two</option><option>Three</option></select><i data-qa-color=\"fg\" style=\"color:var(--qxframe9a7c2-theme-menu-foreground)\"></i><i data-qa-color=\"accent\" style=\"color:var(--qxframe9a7c2-theme-menu-accent-foreground);background:var(--qxframe9a7c2-theme-menu-accent)\"></i><i data-qa-color=\"bg\" style=\"background:var(--qxframe9a7c2-theme-menu)\"></i>';\n d.head.append(sheet);d.body.append(host);\n const css=s=>getComputedStyle(s),cases=[];\n for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true])for(const menuColor of ['default','default-translucent','inverted','inverted-translucent']){\n   h.classList.toggle('dark',dark);\n   sheet.textContent=api.compileTheme({...orig,style,menuColor},{generatedAt:''}).body;\n   // The expected Menu palette is resolved in a separate CSS-only scheme probe.\n   // No color declaration on the native picker/option is ever changed.\n   const expectedScheme=menuColor.startsWith('inverted')?(dark?'light':'dark'):(dark?'dark':'light');\n   host.querySelectorAll('[data-qa-color]').forEach(el=>{el.style.colorScheme=expectedScheme;});\n   const theme={fg:css(host.querySelector('[data-qa-color=fg]')).color,bg:css(host.querySelector('[data-qa-color=bg]')).backgroundColor,\n    accentFg:css(host.querySelector('[data-qa-color=accent]')).color,accentBg:css(host.querySelector('[data-qa-color=accent]')).backgroundColor};\n   const samples={};\n   for(const kind of ['authored','scoped','bare']){\n     const el=host.querySelector('[data-qa-native=\"'+kind+'\"]'),pick=getComputedStyle(el,'::picker(select)'),selected=css(el.options[0]),unselected=css(el.options[1]),disabled=kind==='authored'?css(el.options[2]):null;\n     samples[kind]={appearance:css(el).appearance,pickerAppearance:pick.appearance,colorScheme:css(el).colorScheme,pickerBg:pick.backgroundColor,pickerFg:pick.color,pickerScheme:pick.colorScheme,pickerBorderRadius:pick.borderTopLeftRadius,\n       selectedFg:selected.color,selectedBg:selected.backgroundColor,optionFg:unselected.color,optionBg:unselected.backgroundColor,\n       disabledFg:disabled?.color,disabledOpacity:disabled?.opacity,iconDisplay:getComputedStyle(el,'::picker-icon').display};\n   }\n   const multirow=host.querySelector('[data-qa-native=multirow]');\n   cases.push({style,dark,menuColor,theme,samples,multirow:css(multirow).appearance});\n }\n h.classList.toggle('dark',prevDark);host.remove();sheet.remove();\n return {supported:CSS.supports('appearance','base-select'),cases};\n})()");
    assert.equal(r.supported,true,'Chromium must support native customizable select');
    assert.equal(r.cases.length,64,'8 Styles x 2 modes x 4 Menu colors');
    for(const c of r.cases){
      const id=c.style+'/'+c.dark+'/'+c.menuColor;
      const inverse=c.menuColor.startsWith('inverted'),expectedScheme=inverse?(c.dark?'light':'dark'):(c.dark?'dark':'light');
      for(const [type,select] of Object.entries(c.samples)){
        const label=id+'/'+type;
        assert.equal(select.appearance,'base-select',label+' control enabled');
        assert.equal(select.pickerAppearance,'base-select',label+' picker enabled');
        assert.equal(select.colorScheme,c.dark?'dark':'light',label+' CLOSED Select stays page scheme');
        assert.equal(select.pickerScheme,expectedScheme,label+' top-layer picker inverts via color-scheme ONLY');
        if(inverse)assert.notEqual(select.pickerScheme,select.colorScheme,label+' picker is inverted while closed control is unchanged');
        assert.equal(select.pickerBg,c.theme.bg,label+' normal picker background follows Menu color');
        assert.equal(select.pickerFg,c.theme.fg,label+' normal picker foreground follows Menu color');
        assert.equal(select.optionFg,c.theme.fg,label+' normal idle options follow Menu foreground');
        assert.equal(select.selectedFg,c.theme.accentFg,label+' normal selected option readable');
        assert.equal(select.selectedBg,c.theme.accentBg,label+' normal selected option has menu accent');
        assert.ok(select.pickerBorderRadius !== undefined,label+' picker radius computed');
        assert.equal(select.iconDisplay,'none',label+' no duplicated chevron');
        if(type==='authored'){
          assert.equal(select.disabledFg,c.theme.fg,label+' normal disabled option still uses menu foreground');
          assert.equal(select.disabledOpacity,'0.45',label+' disabled option faded');
        }
      }
      assert.notEqual(c.multirow,'base-select',id+' multirow native list is not converted to single picker');
    }
  });

  await step('Shared Select option padding grows with content; DatePicker Primary/shape roles match Button', async () => {
    const result = await evaluate(`(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const outer = doc.createElement('div');
      outer.className = 'qxframe9a7c2-select-option-host';
      outer.style.cssText = 'position:absolute;left:-9999px;top:0;width:20rem;visibility:hidden;pointer-events:none';
      const list = doc.createElement('div');
      list.className = 'qxframe9a7c2-item-collection';
      outer.appendChild(list);
      const add = (id, content) => {
        const row = doc.createElement('div');
        row.className = 'qxframe9a7c2-item-collection-item';
        row.dataset.qa = id;
        row.innerHTML = content;
        list.appendChild(row);
        return row;
      };
      const single = add('single','<span class="qxframe9a7c2-item-collection-content-slot"><span class="qxframe9a7c2-item-collection-label">Alpha</span></span>');
      const multiline = add('multiline','<span class="qxframe9a7c2-item-collection-content-slot">Line 1<br>Line 2</span>');
      const rich = add('rich','<span class="qxframe9a7c2-item-collection-content-slot qxframe9a7c2-item-collection-custom-content"><span style="width:100%">Custom 1</span><span style="width:100%">Custom 2</span></span>');
      const gauge = doc.createElement('div');
      gauge.style.cssText = 'height:var(--_qxframe9a7c2-control-height);width:1px';
      list.appendChild(gauge);
      const panel = doc.createElement('div');
      panel.className='qxframe9a7c2-date-panel';
      const day = doc.createElement('button');
      day.className='qxframe9a7c2-date-panel-cell is-selected';
      day.textContent='15';
      panel.appendChild(day);
      outer.appendChild(panel);
      const period = doc.createElement('div');
      period.className='qxframe9a7c2-period-panel qxframe9a7c2-date-panel';
      const month = doc.createElement('button');
      month.className='qxframe9a7c2-period-panel-cell qxframe9a7c2-date-panel-cell is-selected';
      month.textContent='October';
      period.appendChild(month);
      outer.appendChild(period);
      const button=doc.createElement('button');
      button.className='qxframe9a7c2-button is-primary is-solid';
      button.textContent='Button';
      outer.appendChild(button);
      const primary=doc.createElement('div');
      primary.style.background='var(--qxframe9a7c2-theme-primary)';
      primary.style.border='1px solid var(--qxframe9a7c2-theme-primary)';
      outer.appendChild(primary);
      doc.body.appendChild(outer);
      const dimensions=[];
      try {
        for(const size of ['is-sm','is-md','is-lg']){
          list.className='qxframe9a7c2-item-collection '+size;
          const h=el=>el.getBoundingClientRect().height;
          const css=getComputedStyle(single);
          dimensions.push({size,control:h(gauge),single:h(single),multiline:h(multiline),rich:h(rich),
            padding:css.paddingTop,overflow:css.overflow,whiteSpace:css.whiteSpace,
            clipped:[multiline,rich].some(el=>el.scrollHeight>el.clientHeight+1)});
        }
        const buttonRadius=getComputedStyle(button).borderRadius;
        const dateRadius=getComputedStyle(day).borderRadius;
        const monthRadius=getComputedStyle(month).borderRadius;
        const panelRadius=getComputedStyle(panel).borderRadius;
        const solid=getComputedStyle(primary).backgroundColor;
        const normal=getComputedStyle(day).backgroundColor;
        day.classList.add('is-hover');
        const hovered=getComputedStyle(day).backgroundColor;
        day.classList.remove('is-hover');
        month.classList.add('is-hover');
        const monthHover=getComputedStyle(month).backgroundColor;
        return {dimensions,buttonRadius,dateRadius,monthRadius,panelRadius,
          solid,normal,hovered,monthHover};
      } finally {outer.remove();}
    })()`);
    assert.equal(result?.dimensions?.length,3,'Select source size variants measured');
    for(const entry of result.dimensions){
      assert.ok(Math.abs(entry.single-entry.control)<=.6,'Select single option must match Control via natural padding: '+JSON.stringify(entry));
      assert.ok(entry.multiline>entry.single+8 && entry.rich>entry.single+8,'Select multiline and rendered item must expand: '+JSON.stringify(entry));
      assert.equal(entry.clipped,false,'Select rich and multiline options cannot be clipped');
      assert.equal(entry.whiteSpace,'normal','Select item must allow natural text wrapping');
    }
    assert.equal(result.dateRadius,result.buttonRadius,'DatePicker day radius follows Button action radius');
    assert.equal(result.monthRadius,result.buttonRadius,'PeriodPanel cell radius follows Button action radius');
    assert.equal(result.normal,result.solid,'Selected date uses solid Theme Primary');
    assert.equal(result.hovered,result.solid,'Selected DatePicker hover must not fade Theme Primary to 80%');
    assert.equal(result.monthHover,result.solid,'Selected PeriodPanel hover must not fade Theme Primary to 80%');
  });


  await step('Preview Empty is a QX composition with measured 32/14/16 geometry', async () => {
    const geometry = await evaluate(`(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const root = doc.querySelector('[data-card="empty-distribute-track"] .qxframe9a7c2-empty.is-composed');
      if (!root) return null;
      const media = root.querySelector('.qxframe9a7c2-empty-media.is-icon');
      const header = root.querySelector('.qxframe9a7c2-empty-header');
      const title = header?.querySelector('.qxframe9a7c2-empty-title');
      if (!media || !title) return null;
      return {
        media: getComputedStyle(media).width,
        title: getComputedStyle(title).fontSize,
        gap: getComputedStyle(root).rowGap,
        mediaOwnedByRoot: media.parentElement === root,
        titleOwnedByHeader: title.parentElement === header
      };
    })()`);
    assert.deepEqual(geometry, {
      media: '32px', title: '14px', gap: '16px',
      mediaOwnedByRoot: true, titleOwnedByHeader: true
    });
  });

  await step('hover previews a style without committing; leaving reverts', async () => {
    await click('document.querySelector(\'[data-create-picker="style"]\')');
    await waitFor(`!!(${menuItem('Luma')})`, 'style menu');
    await hover(menuItem('Luma'));
    await waitFor(`${frameAttr('data-create-style')} === 'luma'`, 'hover preview');
    assert.equal((await state()).config.style, 'nova');
    await mouse('mouseMoved', 1300, 850);
    await waitFor(`${frameAttr('data-create-style')} === 'nova'`, 'revert on leave');
  });

  await step('click commits, keeps the menu open and updates the URL', async () => {
    await hover(menuItem('Maia'));
    await click(menuItem('Maia'));
    await waitFor('window.QXFRAME9A7C2_CREATE.state.config.style === "maia"', 'commit');
    assert.match((await state()).search, /style=maia/);
    assert.ok(await evaluate(`!!(${menuItem('Maia')})`), 'menu stays open after selecting');
    await key('Escape');
  });

  await step('undo / redo shortcuts', async () => {
    await mouse('mousePressed', 1300, 20); await mouse('mouseReleased', 1300, 20);
    await key('z', ['ctrl']);
    await waitFor('window.QXFRAME9A7C2_CREATE.state.config.style === "nova"', 'undo');
    await key('z', ['ctrl', 'shift']);
    await waitFor('window.QXFRAME9A7C2_CREATE.state.config.style === "maia"', 'redo');
  });

  await step('locked options survive shuffle; extension axes untouched', async () => {
    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, ext: { density: "touch" } })');
    await hover('document.querySelector(\'[data-create-picker-root="style"]\')');
    await click('document.querySelector(\'[data-create-lock="style"]\')');
    await waitFor('window.QXFRAME9A7C2_CREATE.state.locks.has("style")', 'lock');
    for (let i = 0; i < 5; i++) {
      await key('r');
      await sleep(30);
    }
    const after = await state();
    assert.equal(after.config.style, 'maia');
    assert.deepEqual(after.config.ext, { density: 'touch' });
  });

  await step('D toggles light/dark for the page and the preview', async () => {
    const before = await evaluate('document.documentElement.classList.contains("dark") ? "dark" : "light"');
    await key('d');
    const expected = before === 'dark' ? 'light' : 'dark';
    await waitFor(`document.documentElement.classList.contains("dark") === ${expected === 'dark'}`, 'host mode');
    await waitFor(`!!(document.querySelector('[data-create-frame]').contentDocument.documentElement.classList.contains("dark")) === ${expected === 'dark'}`, 'preview mode');
  });

  await step('01/02 switch maps to preview-02 / preview pages', async () => {
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")', 'preview 02');
    assert.match((await state()).search, /item=02/);
  });

  await step('Stage5 Preview03 original QX business Cards: 18 live composites, actions and 16 visual modes',async()=>{
    await click('document.querySelector(\'[data-create-item="03"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-03.html")','Preview03 route',15000);
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.defaultView.QXFRAME9A7C2_PREVIEW3','Preview03 runtime',15000);
    const result=await evaluate("(() => {\n"+
      "const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,state=w.QXFRAME9A7C2_PREVIEW3;\n"+
      "const cards=[...d.querySelectorAll('[data-card]')],initial=state.componentCount,mountErrors=state.mountErrors.slice();\n"+
      "d.querySelector('[data-pv3-action=onboarding-next]').click();const progressed=d.querySelector('[data-card=onboarding-flow] [data-pv3-status]').textContent;\n"+
      "d.querySelector('[data-pv3-action=finance-submit]').click();const finance=d.querySelector('[data-card=finance-approval] [data-pv3-status]').textContent;\n"+
      "d.querySelector('[data-pv3-action=automation-test]').click();const automation=d.querySelector('[data-card=rules-automation] [data-pv3-status]').textContent;\n"+
      "const html=d.documentElement,existing=d.getElementById('qxframe9a7c2-create-theme'),oldCss=existing.textContent,oldDark=html.classList.contains('dark'),oldStyle=html.getAttribute('data-create-style');const samples=[];\n"+
      "for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){html.classList.toggle('dark',dark);html.setAttribute('data-create-style',style);existing.textContent=api.compileTheme({...api.state.config,style,ext:{...api.state.config.ext,motion:'standard'}},{generatedAt:''}).body;\n"+
      "const r=cards.map(c=>c.getBoundingClientRect()),bg=w.getComputedStyle(cards[0]).backgroundColor;\n"+
      "const ref=d.createElement('span');ref.style.fontFamily='var(--qxframe9a7c2-theme-font-heading)';d.body.append(ref);const expectedFont=w.getComputedStyle(ref).fontFamily;ref.remove();\n"+
      "const heroFont=w.getComputedStyle(d.querySelector('.pv3-hero h1')).fontFamily,sectionFont=w.getComputedStyle(d.querySelector('.pv3x-section-heading h2')).fontFamily;\n"+
      "const event=d.querySelector('[data-card=stream-animation] .pv3x-event-list>div'),process=d.querySelector('[data-card=state-transitions] .pv3x-process-chip');\n"+
      "const durations=[w.getComputedStyle(event).transitionDuration,w.getComputedStyle(process).transitionDuration];\n"+
      "existing.textContent=api.compileTheme({...api.state.config,style,ext:{...api.state.config.ext,motion:'none'}},{generatedAt:''}).body;\n"+
      "const noneDurations=[w.getComputedStyle(event).transitionDuration,w.getComputedStyle(process).transitionDuration];\n"+
      "samples.push({style,dark,visible:r.filter(x=>x.width>0&&x.height>0).length,bg,expectedFont,heroFont,sectionFont,durations,noneDurations});}\n"+
      "existing.textContent=oldCss;html.classList.toggle('dark',oldDark);html.setAttribute('data-create-style',oldStyle);\n"+
      "const flag=d.querySelector('[data-card=feature-flags]'),switchInputs=[...flag.querySelectorAll('.qxframe9a7c2-switch-input')],switchTracks=[...flag.querySelectorAll('.qxframe9a7c2-switch-track')];\n"+
      "const switchWidths=switchTracks.map(n=>w.getComputedStyle(n).width);const firstSwitchBefore=switchInputs[0].checked;switchInputs[0].click();const firstSwitchAfter=switchInputs[0].checked;switchInputs[0].click();\n"+
      "return {cardCount:cards.length,componentCount:initial,mountErrors,progressed,finance,automation,samples,switchCount:switchInputs.length,switchWidths,firstSwitchBefore,firstSwitchAfter};\n"+
      "})()");
    assert.equal(result.cardCount,66,'Preview03 contains all 66 commercial Cards');
    assert.equal(result.switchCount,3,'Feature flags render three framework Switch inputs');
    assert.ok(result.switchWidths.every(w=>parseFloat(w)>=20),'Feature flag controls render real switch tracks');
    assert.equal(result.firstSwitchBefore,true,'Audit logging starts checked');
    assert.equal(result.firstSwitchAfter,false,'Feature flag switch remains interactive');
    assert.ok(result.componentCount>=45,'Preview03 must mount at least 45 real QX component instances');
    assert.deepEqual(result.mountErrors,[],'No QX component may silently fail mounting');
    assert.match(result.progressed,/stage 3 of 4/,'Step controller advances live demo');
    assert.match(result.finance,/local budget limit/,'Finance draft checks without remote approval');
    assert.match(result.automation,/Dry test/,'Automation runs local dry test');
    assert.equal(result.samples.length,16,'8 Styles × light/dark');
    for(const sample of result.samples) {
      assert.equal(sample.visible,66,sample.style+'/'+sample.dark+' all Cards render');
      assert.ok(sample.bg&&sample.bg!=='rgba(0, 0, 0, 0)',sample.style+'/'+sample.dark+' Theme Card background');
      assert.equal(sample.heroFont,sample.expectedFont,sample.style+'/'+sample.dark+' hero font');
      assert.equal(sample.sectionFont,sample.expectedFont,sample.style+'/'+sample.dark+' section font');
      for(const duration of sample.durations)assert.ok(duration.split(',').some(s=>parseFloat(s)>0),sample.style+'/'+sample.dark+' standard motion');
      for(const duration of sample.noneDurations)assert.ok(duration.split(',').every(s=>parseFloat(s)===0),sample.style+'/'+sample.dark+' no motion');
    }
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")','restore existing Preview02',15000);
  });


  await step('Stage5 Preview03 expanded 48 Cards: real QX mounts, local actions and native choice across 16 modes',async()=>{
    await click('document.querySelector(\'[data-create-item="03"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.defaultView.QXFRAME9A7C2_PREVIEW3?.expanded','Preview03 expanded runtime',15000);
    const actual=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const w=d.defaultView, api=window.QXFRAME9A7C2_CREATE, root=d.documentElement;
      const state=w.QXFRAME9A7C2_PREVIEW3,expanded=state.expanded;
      const card=id=>d.querySelector('[data-card="'+id+'"]');
      const note=id=>card(id)?.querySelector('[data-pv3x-status]');
      const demo=[...d.querySelectorAll('[data-pv3x-demo]')];
      const result={newCards:expanded?.newCards,mounted:expanded?.mounted,
        mountErrors:state.mountErrors?.slice(),expandedErrors:expanded?.errors?.slice(),
        demoCount:demo.length};
      const url=d.location.href;
      result.demo=demo.map(button=>{
        button.click();
        const status=button.closest('[data-card]')?.querySelector('[data-pv3x-status]');
        return {label:button.textContent.trim(),visible:status&&!status.hidden, text:status?.textContent||''};
      });
      const checkbox=card('audit-checklist').querySelector('input[type="checkbox"]');
      const checkboxBefore=checkbox.checked;checkbox.click();
      result.checkbox={before:checkboxBefore,after:checkbox.checked,message:note('audit-checklist')?.textContent};
      checkbox.click();
      const radio=[...card('fraud-decision').querySelectorAll('input[type="radio"]')];
      const beforeRadio=radio.map(x=>x.checked);radio[0].click();
      result.radio={count:radio.length,before:beforeRadio,after:radio.map(x=>x.checked),message:note('fraud-decision')?.textContent};
      radio[1].click();
      const flags=[...card('feature-flags').querySelectorAll('input[type="checkbox"]')];
      const oldFlag=flags[1].checked;flags[1].click();
      result.switch={before:oldFlag,after:flags[1].checked,message:note('feature-flags')?.textContent};
      flags[1].click();
      const form=card('vendor-intake')?.querySelector('[data-pv3x-form]');
      if(form){form.requestSubmit();result.form={valid:form.checkValidity(),message:note('vendor-intake')?.textContent};
        const mail=form.querySelector('[type=email]'),old=mail.value;
        mail.value='not-a-valid-email';result.form.invalidRejected=!form.checkValidity();mail.value=old;
      }
      const events=d.querySelector('[data-pv3x-events]'),oldEvents=events?.children.length;
      d.querySelector('[data-pv3x-add-event]')?.click();
      result.events={before:oldEvents,after:events?.children.length,message:note('stream-animation')?.textContent};
      const transition=card('state-transitions'),active=()=>[...transition.querySelectorAll('.pv3x-process-chip')].findIndex(x=>x.classList.contains('is-current'));
      const first=active();transition.querySelector('[data-pv3x-transition]')?.click();
      result.transition={before:first,after:active(),message:note('state-transitions')?.textContent};
      result.sameUrl=d.location.href===url;
      const sheet=d.getElementById('qxframe9a7c2-create-theme'),oldCss=sheet.textContent;
      const oldDark=root.classList.contains('dark'),oldStyle=root.getAttribute('data-create-style');
      result.states=[];
      try{
        for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])
        for(const dark of [false,true]){
          root.classList.toggle('dark',dark);root.setAttribute('data-create-style',style);
          sheet.textContent=api.compileTheme({...api.state.config,style},{generatedAt:''}).body;
          const checked=radio[1],off=radio[0],checkedBox=checkbox;
          const trackOn=flags[0].nextElementSibling,trackOff=flags[1].nextElementSibling;
          const cs=node=>w.getComputedStyle(node);
          result.states.push({style,dark,radioChecked:checked.checked,radioUnselected:off.checked,
            radioSize:checked.getBoundingClientRect().width,radioOpacity:parseFloat(cs(checked).opacity),
            checkChecked:checkedBox.checked,checkSize:checkedBox.getBoundingClientRect().width,
            switchOn:flags[0].checked,switchOff:flags[1].checked,
            switchOnBackground:cs(trackOn).backgroundColor,switchOffBackground:cs(trackOff).backgroundColor,
            switchWidth:trackOn.getBoundingClientRect().width,
            switchThumbHeight:trackOn.querySelector('.qxframe9a7c2-switch-thumb')?.getBoundingClientRect().height});
        }
      }finally{
        sheet.textContent=oldCss;root.classList.toggle('dark',oldDark);
        if(oldStyle===null)root.removeAttribute('data-create-style');else root.setAttribute('data-create-style',oldStyle);
      }
      return result;
    })()`);
    assert.equal(actual.newCards,48,'48 added Preview03 Cards');
    assert.ok(actual.mounted>=20,'real QX component mounts in added Cards');
    assert.deepEqual(actual.mountErrors,[],'neither Preview03 baseline nor expanded runtime reports a mount failure');
    assert.deepEqual(actual.expandedErrors,[],'added runtime has no silent mount/empty-slot errors');
    assert.equal(actual.demoCount,6,'all six authored local actions exist');
    assert.ok(actual.demo.every(x=>x.visible&&x.text.includes(x.label)),'six local actions expose their own visible results: '+JSON.stringify(actual.demo));
    assert.equal(actual.checkbox.before,true,'audit checkbox initially checked');
    assert.equal(actual.checkbox.after,false,'checkbox pointer action changes native checked value');
    assert.match(actual.checkbox.message,/Selection updated locally/,'checkbox change feedback visible');
    assert.equal(actual.radio.count,3,'three native radio choices');
    assert.deepEqual(actual.radio.before,[false,true,false],'original radio choice');
    assert.deepEqual(actual.radio.after,[true,false,false],'radio activation keeps native exclusivity');
    assert.match(actual.radio.message,/Selection updated locally/,'radio change feedback visible');
    assert.equal(actual.switch.before,false,'switch starts unchecked');
    assert.equal(actual.switch.after,true,'native Switch input toggle updates checked');
    assert.match(actual.switch.message,/Selection updated locally/,'Switch status visible');
    assert.ok(actual.form.valid&&actual.form.invalidRejected,'vendor form retains actual browser validation');
    assert.match(actual.form.message,/validated locally/,'valid supplier form returns local result');
    assert.equal(actual.events.after,actual.events.before+1,'transition-group adds a real DOM event');
    assert.match(actual.events.message,/Event added/,'event stream reports local action');
    assert.notEqual(actual.transition.before,actual.transition.after,'transition changes actual active chip');
    assert.match(actual.transition.message,/Moved to next local workflow state/,'transition status feedback visible');
    assert.ok(actual.sameUrl,'all actions remain local without navigating or sending users elsewhere');
    assert.equal(actual.states.length,16,'8 Styles x Light/Dark native choice modes');
    for(const s of actual.states){
      const label=s.style+'/'+(s.dark?'dark':'light');
      assert.ok(s.radioChecked&&!s.radioUnselected&&s.checkChecked&&s.switchOn&&!s.switchOff,label+' true native checked state');
      assert.ok(s.radioSize>=12&&s.checkSize>=12&&s.radioOpacity>.5,label+' native Radio/Checkbox have usable visible dimensions');
      assert.ok(s.switchWidth>=20&&s.switchThumbHeight>=10,label+' Switch track and thumb remain physically visible');
      assert.notEqual(s.switchOnBackground,s.switchOffBackground,label+' checked Switch paints differently from unchecked Switch');
    }
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")','return from expanded-card state regression',15000);
  });

  await step('Stage5 Tabler static families / Kbd + Calendar year navigation in 8 Styles and light/dark',async()=>{
    await click('document.querySelector(\'[data-create-item="03"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.defaultView.QXFRAME9A7C2_PREVIEW3','Preview03 static family fixture',15000);
    const result=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,app=window.QXFRAME9A7C2_CREATE;
      const wrap=d.createElement('div'),theme=d.getElementById('qxframe9a7c2-create-theme'),original=theme.textContent;
      const oldDark=d.documentElement.classList.contains('dark'),oldStyle=d.documentElement.getAttribute('data-create-style');
      wrap.style.cssText='position:absolute;left:-7000px;top:0;width:65rem;display:flex;flex-wrap:wrap;gap:1rem';
      wrap.innerHTML='<div class="qxframe9a7c2-card is-stacked"><div class="qxframe9a7c2-card-stamp">S</div><div class="qxframe9a7c2-card-body">Card</div></div>'+
        '<span class="qxframe9a7c2-badge is-success is-soft">Healthy</span>'+
        '<span class="qxframe9a7c2-avatar is-primary">AB</span>'+
        '<div class="qxframe9a7c2-progress is-striped is-warning"><div class="qxframe9a7c2-progress-line"><div class="qxframe9a7c2-progress-outer"><div class="qxframe9a7c2-progress-inner"><div class="qxframe9a7c2-progress-primary" style="width:65%"></div></div></div></div></div>'+
        '<div class="qxframe9a7c2-tabs is-pills"><button class="qxframe9a7c2-tabs-tab is-active">Selected</button></div>'+
        '<span class="qxframe9a7c2-tag is-muted">Label</span><kbd class="qxframe9a7c2-kbd">Ctrl</kbd>'+
        '<div class="qxframe9a7c2-form-hint">Shortcut hint</div>';
      d.body.append(wrap);const calendarHost=d.createElement('div');wrap.append(calendarHost);
      const Calendar=w.QXFRAME9A7C2?.BuildingBlocks?.Calendar,cal=Calendar?.create({container:calendarHost,value:'2026-10-15',size:'md'});
      const rows=[],cs=sel=>w.getComputedStyle(wrap.querySelector(sel)),rect=sel=>wrap.querySelector(sel)?.getBoundingClientRect();
      const refs=cal?.getRefs?.(),prev=refs?.prevYear,next=refs?.nextYear;
      let years=null;
      try{
        if(prev&&next){
          const before=cal.getState().viewValue.getFullYear();prev.click();
          const previous=cal.getState().viewValue.getFullYear();next.click();
          const back=cal.getState().viewValue.getFullYear();years={before,previous,back};
        }
        for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])
        for(const dark of [false,true]){
          d.documentElement.classList.toggle('dark',dark);
          d.documentElement.setAttribute('data-create-style',style);
          theme.textContent=app.compileTheme({...app.state.config,style},{generatedAt:''}).body;
          rows.push({style,dark,kbd:rect('.qxframe9a7c2-kbd')?.height,stamp:rect('.qxframe9a7c2-card-stamp')?.width,
            badge:rect('.qxframe9a7c2-badge')?.height,avatar:rect('.qxframe9a7c2-avatar')?.height,
            progressBackground:cs('.qxframe9a7c2-progress-primary').backgroundImage,
            progressColor:cs('.qxframe9a7c2-progress-primary').backgroundColor,
            pillBackground:cs('.qxframe9a7c2-tabs-tab.is-active').backgroundColor,
            cardBackground:cs('.qxframe9a7c2-card').backgroundColor,
            mutedTagBackground:cs('.qxframe9a7c2-tag.is-muted').backgroundColor,
            hintFont:parseFloat(cs('.qxframe9a7c2-form-hint').fontSize)});
        }
        return {years,rows,navCount:cal?.getRootElement().querySelectorAll('.qxframe9a7c2-calendar-year-nav').length};
      }finally{
        cal?.destroy();wrap.remove();theme.textContent=original;
        d.documentElement.classList.toggle('dark',oldDark);
        if(oldStyle===null)d.documentElement.removeAttribute('data-create-style');
        else d.documentElement.setAttribute('data-create-style',oldStyle);
      }
    })()`);
    assert.deepEqual(result.years,{before:2026,previous:2025,back:2026},'Calendar delegated +/-12 month year nav');
    assert.equal(result.navCount,2,'Calendar has both year controls');
    assert.equal(result.rows.length,16,'8 Styles x light/dark');
    for(const s of result.rows){
      const label=s.style+'/'+(s.dark?'dark':'light');
      assert.ok(s.kbd>=20&&s.stamp>=60&&s.badge>=12&&s.avatar>=20,label+' real static variant dimensions '+JSON.stringify(s));
      assert.match(s.progressBackground,/repeating-linear-gradient/,label+' striped Progress gradient');
      assert.notEqual(s.pillBackground,s.cardBackground,label+' active Pill Tab distinct from Card background');
      assert.ok(s.mutedTagBackground&&s.hintFont<=14,label+' Tag and Form Theme text projection');
    }
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")','restore Preview02 from static family QA',15000);
  });

  await step('Stage5 real Cascader PopupFrame opens and expands three contiguous columns by item click',async()=>{
    await click('document.querySelector(\'[data-create-item="03"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.defaultView.QXFRAME9A7C2_PREVIEW3','real Cascader Preview03 runtime',15000);
    const probe=await evaluate(`(async()=>{
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const instance=d.defaultView.QXFRAME9A7C2_PREVIEW3.instances['routing-cascader'];
      const fail=reason=>({ok:false,reason});
      if(!instance||typeof instance.open!=='function')return fail('missing public QX Cascader runtime');
      instance.open('qa-actual-popup');
      await new Promise(resolve=>setTimeout(resolve,60));
      const panel=instance.getPopupElement();
      if(!panel||panel.hidden)return fail('real PopupFrame not visible after public open');
      for(const [index,label] of [[0,'United States'],[1,'East']]){
        const column=panel.querySelectorAll('.qxframe9a7c2-cascader-column')[index];
        if(!column)return fail('missing actual interactive Cascader column '+index);
        const item=[...column.querySelectorAll('.qxframe9a7c2-cascader-item,.qxframe9a7c2-cascader-option')]
          .find(node=>node.textContent.trim().startsWith(label));
        if(!item)return fail('missing real Cascader option '+label);
        item.click();
        await new Promise(resolve=>setTimeout(resolve,60));
      }
      const host=panel.querySelector('.qxframe9a7c2-cascader-columns');
      if(!host)return fail('missing public Cascader columns');
      const cols=[...host.querySelectorAll('.qxframe9a7c2-cascader-column')];
      const rects=cols.map(node=>node.getBoundingClientRect());
      const result={ok:true,open:instance.getState().open,pathKeys:instance.getState().activePathKeys,
        columnCount:cols.length,columnCountToken:panel.style.getPropertyValue('--qxframe9a7c2-cascader-column-count'),
        gaps:rects.slice(1).map((r,i)=>r.left-rects[i].right),widths:rects.map(r=>r.width),
        overflow:host.scrollWidth-host.clientWidth,display:getComputedStyle(host).display,
        flexWrap:getComputedStyle(host).flexWrap,overflowX:getComputedStyle(host).overflowX};
      instance.close('qa-actual-popup-finished');
      return result;
    })()`);
    assert.equal(probe.ok,true,'real Cascader interaction must be available: '+JSON.stringify(probe));
    assert.equal(probe.open,true,'real PopupFrame remains open while parent columns expand');
    assert.deepEqual(probe.pathKeys,['us','east'],'pointer activation expands genuine US > East cascade');
    assert.equal(probe.columnCount,3,'real Cascader shows exactly three levels');
    assert.equal(probe.columnCountToken,'3','runtime column count controls actual popup width');
    assert.equal(probe.display,'flex','actual columns use Flex layout');
    assert.equal(probe.flexWrap,'nowrap','real multicolumn Cascader never wraps');
    assert.ok(probe.gaps.every(gap=>Math.abs(gap)<=1),'real Popup columns have no gaps/cropping: '+JSON.stringify(probe));
    assert.ok(probe.widths.every(width=>width>=50),'real Popup columns remain legible: '+JSON.stringify(probe));
    assert.ok(probe.overflow<=1,'real Popup columns have no horizontal scrollbar: '+JSON.stringify(probe));
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")','restore Preview02 after real Cascader',15000);
  });

  await step('Stage5 shape parity: 8 styles × two modes × zero/default radius × 24 Theme-owned parts (official Tree exempt)',async()=>{
    await click('document.querySelector(\'[data-create-item="03"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-03.html")','shape Preview03');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.querySelector("[data-card=stakeholder-roster] .qxframe9a7c2-avatar")','shape avatars');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.getElementById("qxframe9a7c2-create-theme")','Preview03 theme CSS injection',15000);
    const result=await evaluate("(() => {\nconst api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,h=d.documentElement,sty=d.getElementById('qxframe9a7c2-create-theme');\nconst oldCss=sty.textContent,oldDark=h.classList.contains('dark'),oldStyle=h.getAttribute('data-create-style');\nconst host=d.createElement('div');host.style.cssText='position:absolute;left:-9000px;top:0;visibility:hidden';\nhost.innerHTML='<div class=\"qxframe9a7c2-menu\"><button class=\"qxframe9a7c2-menu-item\">M</button></div>'+\n'<div class=\"qxframe9a7c2-list\"><div class=\"qxframe9a7c2-list-group\">G</div></div>'+\n'<div class=\"qxframe9a7c2-steps\"><span class=\"qxframe9a7c2-steps-icon\">1</span><span class=\"qxframe9a7c2-steps-dot\"></span></div>'+\n'<div class=\"qxframe9a7c2-tree\"><button class=\"qxframe9a7c2-tree-toggle\">X</button></div>'+\n'<div class=\"qxframe9a7c2-carousel\"><button class=\"qxframe9a7c2-carousel-arrow\">X</button><span class=\"qxframe9a7c2-carousel-dot-bar\"></span></div>'+\n'<div class=\"qxframe9a7c2-progress\"><span class=\"qxframe9a7c2-progress-step\"></span></div>'+\n'<div class=\"qxframe9a7c2-image-preview\"><span class=\"qxframe9a7c2-image-preview-title\">X</span><span class=\"qxframe9a7c2-image-preview-counter\">2</span><div class=\"qxframe9a7c2-image-preview-toolbar\"><button class=\"qxframe9a7c2-image-preview-tool\">X</button></div></div>'+\n'<span class=\"qxframe9a7c2-card-skeleton-line\"></span><span class=\"qxframe9a7c2-badge\">A</span><div class=\"qxframe9a7c2-slider\"><span class=\"qxframe9a7c2-slider-dot\"></span></div>';\nhost.innerHTML+='<div class=\"qxframe9a7c2-tabs\"><span class=\"qxframe9a7c2-tabs-indicator\"></span><span class=\"qxframe9a7c2-tabs-badge\">2</span><button class=\"qxframe9a7c2-tabs-close\">X</button></div><div class=\"qxframe9a7c2-color-panel\"><input type=\"range\" class=\"qxframe9a7c2-color-panel-hue\"/><input type=\"range\" class=\"qxframe9a7c2-color-panel-alpha\"/></div><div class=\"qxframe9a7c2-color-picker-gradient\"><div class=\"qxframe9a7c2-color-picker-gradient-track\"></div></div>';\nd.body.append(host);\nfor(const [name,role]of [['shared-navigation','navigation'],['shared-data','data']]){const probe=d.createElement('span');probe.className='qxframe9a7c2-'+name;probe.style.borderTopLeftRadius='var(--_qxframe9a7c2-'+role+'-radius)';host.append(probe)}\nconst cases=[['shared-navigation','.qxframe9a7c2-shared-navigation','item'],['shared-data','.qxframe9a7c2-shared-data','item'],['menu','.qxframe9a7c2-menu-item','item'],['list','.qxframe9a7c2-list','item'],['list-group','.qxframe9a7c2-list-group','item'],['steps','.qxframe9a7c2-steps-icon','item'],['steps-dot','.qxframe9a7c2-steps-dot','item'],['carousel-arrow','.qxframe9a7c2-carousel-arrow','button'],['carousel-bar','.qxframe9a7c2-carousel-dot-bar','track'],['progress','.qxframe9a7c2-progress-step','track'],['image-title','.qxframe9a7c2-image-preview-title','popup'],['image-counter','.qxframe9a7c2-image-preview-counter','popup'],['image-toolbar','.qxframe9a7c2-image-preview-toolbar','popup'],['image-button','.qxframe9a7c2-image-preview-tool','button'],['skeleton','.qxframe9a7c2-card-skeleton-line','item'],['badge','.qxframe9a7c2-badge','badge'],['slider-dot','.qxframe9a7c2-slider-dot','thumb'],['avatar','[data-card=\"stakeholder-roster\"] .qxframe9a7c2-avatar','avatar'],['tabs-indicator','.qxframe9a7c2-tabs-indicator','track'],['tabs-badge','.qxframe9a7c2-tabs-badge','badge'],['tabs-close','.qxframe9a7c2-tabs-close','button'],['color-hue','.qxframe9a7c2-color-panel-hue','track'],['color-alpha','.qxframe9a7c2-color-panel-alpha','track'],['color-gradient','.qxframe9a7c2-color-picker-gradient-track','track']];\nconst probes={};for(const type of [...new Set(cases.map(x=>x[2]))]){const node=d.createElement('i');node.style.borderTopLeftRadius='var(--qxframe9a7c2-theme-radius-'+type+')';host.append(node);probes[type]=node}\nconst rows=[];\nfor(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true])for(const radius of ['none','default']){\nh.classList.toggle('dark',dark);h.setAttribute('data-create-style',style);sty.textContent=api.compileTheme({...api.state.config,style,radius},{generatedAt:''}).body;\nfor(const [label,selector,role]of cases){\nconst node=label==='avatar'?d.querySelector(selector):host.querySelector(selector);\nrows.push({style,dark,radius,label,actual:node&&w.getComputedStyle(node).borderTopLeftRadius,expected:w.getComputedStyle(probes[role]).borderTopLeftRadius});\n}}\nsty.textContent=oldCss;h.classList.toggle('dark',oldDark);h.setAttribute('data-create-style',oldStyle);host.remove();return rows;\n})()");
    assert.equal(result.length,768,'8 Styles × 2 modes × 2 radius settings × 24 Theme-owned parts');
    for(const row of result){const id=row.style+'/'+row.dark+'/'+row.radius+'/'+row.label;assert.ok(row.actual,id+' missing component');const a=parseFloat(row.actual),e=parseFloat(row.expected);assert.ok(Number.isFinite(a)&&Number.isFinite(e)&&Math.abs(a-e)<=0.6,id+' actual Theme radius mismatch: '+JSON.stringify(row));}
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")','restore Preview02 after visual check');
  });

  await step('Stage4 real Preview02 Codespaces nested QX Tabs and Appointment multiselect',async()=>{
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.querySelector("[data-card=codespaces-card] .qxframe9a7c2-tabs-tab")','Codespaces mounted QX Tabs');
    const actual=await evaluate("(function(){\n      const doc=document.querySelector('[data-create-frame]').contentDocument;\n      const codespaces=doc.querySelector('[data-card=\"codespaces-card\"]');\n      const appointment=doc.querySelector('[data-card=\"book-appointment\"]');\n      const panel=(name)=>codespaces.querySelector('[data-pv-tab-panel=\"'+name+'\"]');\n      const shown=name=>Boolean(panel(name)&&!panel(name).hidden);\n      const tab=(group,name)=>{\n        const host=codespaces.querySelector('[data-pv-tab-group=\"'+group+'\"]');\n        const button=[...host.querySelectorAll('.qxframe9a7c2-tabs-tab-action')].find(x=>x.textContent.trim()===name);\n        if(!button)throw new Error('Missing QX Tabs '+group+'/'+name);\n        button.click();\n      };\n      const first=[shown('codespaces'),shown('local')];\n      tab('codespaces','Local');\n      const local=[shown('codespaces'),shown('local'),shown('https'),shown('ssh'),shown('cli'),panel('https').querySelector('input').value];\n      tab('codespaces-local','SSH');\n      const ssh=[shown('https'),shown('ssh'),shown('cli'),panel('ssh').querySelector('input').value];\n      tab('codespaces-local','GitHub CLI');\n      const cli=[shown('https'),shown('ssh'),shown('cli'),panel('cli').querySelector('input').value];\n      tab('codespaces','Codespaces');\n      const back=[shown('codespaces'),shown('local')];\n      tab('codespaces','Local');\n      const reopen=[shown('local'),shown('cli')];\n      tab('codespaces','Codespaces');\n      const slots=[...appointment.querySelectorAll('[data-pv-multi-toggle=\"appointment\"] button')];\n      const snapshot=()=>slots.map(b=>({active:b.classList.contains('is-active'),pressed:b.getAttribute('aria-pressed')}));\n      const start=snapshot();\n      slots[1].click();const add=snapshot();\n      slots[0].click();const single=snapshot();\n      slots[1].click();const none=snapshot();\n      slots[2].click();slots[3].click();const multiple=snapshot();\n      return {first,local,ssh,cli,back,reopen,start,add,single,none,multiple,count:slots.length};\n    })()");
    assert.deepEqual(actual.first,[true,false],'Codespaces initial panel active');
    assert.deepEqual(actual.local,[false,true,true,false,false,'https://github.com/shadcn-ui/ui.git']);
    assert.deepEqual(actual.ssh,[false,true,false,'git@github.com:shadcn-ui/ui.git']);
    assert.deepEqual(actual.cli,[false,false,true,'gh repo clone shadcn-ui/ui']);
    assert.deepEqual(actual.back,[true,false]);
    assert.deepEqual(actual.reopen,[true,true],'nested CLI tab state survives outer hide/show');
    assert.equal(actual.count,4);
    const bools=s=>s.map(x=>x.active);
    assert.deepEqual(bools(actual.start),[true,false,false,false]);
    assert.deepEqual(bools(actual.add),[true,true,false,false]);
    assert.deepEqual(bools(actual.single),[false,true,false,false]);
    assert.deepEqual(bools(actual.none),[false,false,false,false]);
    assert.deepEqual(bools(actual.multiple),[false,false,true,true]);
    for(const group of [actual.start,actual.add,actual.single,actual.none,actual.multiple])
      for(const item of group)assert.equal(item.pressed,String(item.active),'multiselect class/semantic state synchronized');
  });

  await step('Stage4 Preview02 typography labels, QX Dialogs and Codespaces loading',async()=>{
    const result=await evaluate("(async function(){\n      const api=window.QXFRAME9A7C2_CREATE;\n      const doc=document.querySelector('[data-create-frame]').contentDocument;\n      const peek=()=>({\n        style:doc.querySelector('[data-card=\"style-overview\"] [data-pv-text=\"style-font\"]').textContent,\n        type:doc.querySelector('[data-card=\"typography-specimen\"] [data-pv-text=\"heading-body\"]').textContent\n      });\n      const before=peek();\n      const feedbackTrigger=doc.querySelector('[data-pv-dialog=\"feedback\"]');\n      const alertTrigger=doc.querySelector('[data-pv-dialog=\"alert\"]');\n      feedbackTrigger.click();\n      await new Promise(resolve=>setTimeout(resolve,180));\n      const modal=()=>[...doc.querySelectorAll('.qxframe9a7c2-modal-root')]\n        .find(el=>getComputedStyle(el).display!=='none'&&!el.hidden);\n      const feedback=modal();\n      const fb={open:!!feedback,title:feedback?.querySelector('.qxframe9a7c2-modal-title')?.textContent,\n        name:!!feedback?.querySelector('#pv-feedback-name'),email:!!feedback?.querySelector('#pv-feedback-email'),\n        category:!!feedback?.querySelector('#pv-feedback-category'),message:!!feedback?.querySelector('#pv-feedback-message')};\n      const cancel=feedback&&[...feedback.querySelectorAll('button')].find(b=>b.textContent.trim()==='Cancel');\n      if(cancel)cancel.click();\n      await new Promise(resolve=>setTimeout(resolve,280));\n      alertTrigger.click();\n      await new Promise(resolve=>setTimeout(resolve,180));\n      const alert=modal();\n      const al={open:!!alert,title:alert?.querySelector('.qxframe9a7c2-modal-title')?.textContent,\n        prompt:alert?.textContent.includes('USB accessory'),\n        buttons:alert?[...alert.querySelectorAll('button')].map(x=>x.textContent.trim()).filter(Boolean):[]};\n      const reject=alert&&[...alert.querySelectorAll('button')].find(b=>b.textContent.trim()===\"Don't allow\");\n      if(reject)reject.click();\n      await new Promise(resolve=>setTimeout(resolve,280));\n      const create=doc.querySelector('[data-pv-create-codespace]');\n      const state=()=>({disabled:create.disabled,loading:create.classList.contains('is-loading'),\n        spinner:!create.querySelector('.qxframe9a7c2-button-indicator').hidden});\n      const idle=state();create.click();const active=state();create.click();const still=state();\n      await new Promise(resolve=>setTimeout(resolve,2170));const done=state();\n      return {before,fb,al,idle,active,still,done};\n    })()");
    assert.ok(result.before.style.includes(' - '));
    assert.ok(result.before.type.includes(' - '));
    assert.ok(!/无衬线|等宽|跟随正文/.test(result.before.style+result.before.type),'English preview must not show missing Chinese glyph labels');
    assert.equal(result.fb.open,true,'Feedback Modal opens from QX Button');
    assert.equal(result.fb.title,'Share Feedback');
    for(const key of ['name','email','category','message'])assert.equal(result.fb[key],true,'Feedback includes '+key);
    assert.equal(result.al.open,true,'Alert Dialog opens from QX Button');
    assert.equal(result.al.title,'Allow accessory to connect?');
    assert.equal(result.al.prompt,true);
    assert.ok(result.al.buttons.includes("Don't allow")&&result.al.buttons.includes('Allow'),'Alert actions');
    assert.deepEqual(result.idle,{disabled:false,loading:false,spinner:false});
    assert.deepEqual(result.active,{disabled:true,loading:true,spinner:true});
    assert.deepEqual(result.still,result.active,'repeat click cannot retrigger loading');
    assert.deepEqual(result.done,result.idle,'loading ends and button is restored');
  });

  await step('Stage4 File Upload, Bug attachment and Invite Team use real local interactions',async()=>{
    const actual=await evaluate("(async function(){\n const doc=document.querySelector('[data-create-frame]').contentDocument;\n const upload=doc.querySelector('[data-card=\"file-upload\"]');\n const report=doc.querySelector('[data-card=\"report-bug\"]');\n const invite=doc.querySelector('[data-card=\"invite-team\"]');\n function setFile(input,file){\n  const transfer=new DataTransfer();transfer.items.add(file);\n  input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));\n }\n const upInput=upload.querySelector('[data-pv-upload-input]');\n setFile(upInput,new File(['test'],'diagram.png',{type:'image/png'}));\n const selected=upload.querySelector('[data-pv-upload-status]').textContent;\n setFile(upInput,new File(['bad'],'unsafe.exe',{type:'application/octet-stream'}));\n const invalid=upload.querySelector('[data-pv-upload-status]').textContent;\n const drop=new DataTransfer();drop.items.add(new File(['pdf'],'plan.pdf',{type:'application/pdf'}));\n upload.querySelector('[data-pv-file-drop]').dispatchEvent(new DragEvent('drop',{bubbles:true,cancelable:true,dataTransfer:drop}));\n const dropped=upload.querySelector('[data-pv-upload-status]').textContent;\n const bugInput=report.querySelector('[data-pv-bug-file-input]');\n setFile(bugInput,new File(['log'],'debug.txt',{type:'text/plain'}));\n const attached=report.querySelector('[data-pv-bug-file-status]').textContent;\n const before=invite.querySelectorAll('[data-pv-invite-rows]>div').length;\n invite.querySelector('[data-pv-invite-add]').click();\n const after=invite.querySelectorAll('[data-pv-invite-rows]>div').length;\n const newRow=invite.querySelector('[data-pv-invite-rows]>div:last-child');\n const hasRealSelect=!!newRow.querySelector('.qxframe9a7c2-select');\n const email=newRow.querySelector('input').placeholder;\n invite.querySelector('[data-pv-invite-copy]').click();\n await new Promise(resolve=>setTimeout(resolve,160));\n const copied=invite.querySelector('[data-pv-invite-copy-status]').textContent;\n return {selected,invalid,dropped,attached,before,after,hasRealSelect,email,copied};\n})()");
    assert.match(actual.selected,/Selected: diagram\.png.*not uploaded/,'file selection not presented as server upload');
    assert.match(actual.invalid,/Choose a PNG, JPG or PDF/,'file type validated');
    assert.match(actual.dropped,/Selected: plan\.pdf/,'drag and drop accepted');
    assert.match(actual.attached,/Attached locally: debug\.txt/,'bug attachment updates visible status');
    assert.equal(actual.before,2,'Invite Team has two original rows');
    assert.equal(actual.after,3,'Add another appends a third row');
    assert.equal(actual.hasRealSelect,true,'new row mounts QX Select');
    assert.equal(actual.email,'name@example.com');
    assert.match(actual.copied,/Invite link copied|Invite link selected; use Ctrl\+C/,'copy action gives truthful feedback');
    // This test deliberately clicked/focused inputs inside Preview 02 iframe.
    // Return keyboard origin to the Create host before the next test sends
    // the host-level "O" import shortcut; typing in iframe must NOT forward it.
    await evaluate('document.querySelector("button:not([disabled])").focus({preventScroll:true})');
    assert.equal(await evaluate('document.activeElement.tagName'),'BUTTON','host keyboard origin restored');
  });


  await step('Stage4 Shipping Address and Feedback Form validate and report local-only actions',async()=>{
    const actual=await evaluate("(function(){\n const doc=document.querySelector('[data-create-frame]').contentDocument;\n const address=doc.querySelector('[data-card=\"shipping-address\"]');\n const feedback=doc.querySelector('[data-card=\"feedback-form\"]');\n const street=address.querySelector('#pv-address-street');\n const city=address.querySelector('#pv-address-city');\n const zip=address.querySelector('#pv-address-zip');\n const save=address.querySelector('[data-pv-address-save]');\n const cancel=address.querySelector('[data-pv-address-cancel]');\n const addressStatus=address.querySelector('[data-pv-address-status]');\n save.click();\n const emptyAddress=addressStatus.textContent, firstFocused=doc.activeElement===street;\n street.value='1 Main Street';city.value='Chicago';zip.value='60601';\n save.click();\n const validAddress=addressStatus.textContent;\n const stateLabel=address.querySelector('label[for=\"pv-address-state\"]');\n stateLabel.click();\n const selectFocus=doc.activeElement?.id==='pv-address-state';\n cancel.click();\n const canceledAddress=addressStatus.textContent;\n const clear=street.value===''&&city.value===''&&zip.value===''&&address.querySelector('input[type=\"checkbox\"]').checked;\n const topic=feedback.querySelector('#pv-form-topic');\n const message=feedback.querySelector('#pv-form-message');\n const submit=feedback.querySelector('[data-pv-feedback-submit]');\n const status=feedback.querySelector('[data-pv-feedback-status]');\n submit.click();\n const emptyTopic=status.textContent,topicFocused=doc.activeElement===topic;\n topic.value='Billing';topic.dispatchEvent(new Event('change',{bubbles:true}));\n submit.click();const emptyMessage=status.textContent,messageFocused=doc.activeElement===message;\n message.value='Detailed user feedback';\n submit.click();const validFeedback=status.textContent;\n return {emptyAddress,firstFocused,validAddress,selectFocus,canceledAddress,clear,emptyTopic,topicFocused,emptyMessage,messageFocused,validFeedback};\n})()");
    assert.match(actual.emptyAddress,/required before saving/);
    assert.equal(actual.firstFocused,true,'invalid address focuses missing Street field');
    assert.match(actual.validAddress,/checked locally; not saved to a server/);
    assert.equal(actual.selectFocus,true,'State label forwards focus to actual QX Select root');
    assert.match(actual.canceledAddress,/discarded locally/);
    assert.equal(actual.clear,true,'Cancel restores unsaved fields');
    assert.match(actual.emptyTopic,/Select a topic/);
    assert.equal(actual.topicFocused,true,'missing topic is focused');
    assert.match(actual.emptyMessage,/Enter feedback/);
    assert.equal(actual.messageFocused,true,'missing feedback is focused');
    assert.match(actual.validFeedback,/validated locally; not submitted to a server/);
    await evaluate('document.querySelector("button:not([disabled])").focus({preventScroll:true})');
  });


  await step('Stage4 five Preview02 local-only action flows: validation, focus and state',async()=>{
    const actual=await evaluate("(() => {\n"+
      "const d=document.querySelector('[data-create-frame]').contentDocument,c=id=>d.querySelector('[data-card=\"'+id+'\"]');\n"+
      "const bug=c('report-bug'),title=bug.querySelector('[data-pv-bug-title]'),steps=bug.querySelector('[data-pv-bug-steps]'),bugButton=bug.querySelector('[data-pv-bug-submit]'),bs=bug.querySelector('[data-pv-report-bug-status]');\n"+
      "bugButton.click();const missingTitle=bs.textContent,titleFocus=d.activeElement===title;\n"+
      "title.value='Broken UI';bugButton.click();const missingSteps=bs.textContent,stepsFocus=d.activeElement===steps;\n"+
      "steps.value='Click save';bugButton.click();const validBug=bs.textContent;\n"+
      "const inv=c('invite-team'),emails=[...inv.querySelectorAll('[data-pv-invite-rows] input')],invButton=inv.querySelector('[data-pv-invite-send]'),iv=inv.querySelector('[data-pv-invite-team-status]');\n"+
      "emails[0].value='invalid';invButton.click();const invalidEmail=iv.textContent,emailFocus=d.activeElement===emails[0];\n"+
      "emails.forEach((e,i)=>e.value='person'+i+'@example.com');invButton.click();const validEmail=iv.textContent;\n"+
      "const profile=c('github-profile'),ps=profile.querySelector('[data-pv-github-profile-status]');profile.querySelector('[data-pv-profile-save]').click();const savedProfile=ps.textContent;profile.querySelector('input').dispatchEvent(new Event('input',{bubbles:true}));const clearedProfile=ps.hidden;\n"+
      "const activity=c('contributions-activity'),as=activity.querySelector('[data-pv-contributions-activity-status]'),privateInput=activity.querySelector('input[type=\"checkbox\"]');privateInput.checked=false;activity.querySelector('[data-pv-activity-save]').click();const publicState=as.textContent;privateInput.checked=true;privateInput.dispatchEvent(new Event('change',{bubbles:true}));const clearedActivity=as.hidden;activity.querySelector('[data-pv-activity-save]').click();const privateState=as.textContent;\n"+
      "const booking=c('book-appointment'),slots=[...booking.querySelectorAll('[data-pv-multi-toggle=\"appointment\"] button')],bookButton=booking.querySelector('[data-pv-appointment-book]'),bookStatus=booking.querySelector('[data-pv-book-appointment-status]');slots.forEach(b=>{if(b.classList.contains('is-active'))b.click()});bookButton.click();const missingBooking=bookStatus.textContent;slots[0].click();slots[2].click();bookButton.click();const validBooking=bookStatus.textContent;\n"+
      "return {missingTitle,titleFocus,missingSteps,stepsFocus,validBug,invalidEmail,emailFocus,validEmail,savedProfile,clearedProfile,publicState,clearedActivity,privateState,missingBooking,validBooking};\n"+
      "})()");
    assert.match(actual.missingTitle,/Enter a bug title/);
    assert.equal(actual.titleFocus,true);
    assert.match(actual.missingSteps,/steps to reproduce/);
    assert.equal(actual.stepsFocus,true);
    assert.match(actual.validBug,/validated locally; not submitted/);
    assert.match(actual.invalidEmail,/valid email/);
    assert.equal(actual.emailFocus,true);
    assert.match(actual.validEmail,/invitations validated locally; no invitations sent/);
    assert.match(actual.savedProfile,/not saved to a server/);
    assert.equal(actual.clearedProfile,true);
    assert.match(actual.publicState,/public.*not saved/);
    assert.equal(actual.clearedActivity,true);
    assert.match(actual.privateState,/private.*not saved/);
    assert.match(actual.missingBooking,/Select at least one/);
    assert.match(actual.validBooking,/2 appointment time\(s\) selected locally; no booking sent/);
    await evaluate('document.querySelector("button:not([disabled])").focus({preventScroll:true})');
  });

  await step('Stage4 real waveform microphone permission/lifecycle and InviteMembers navigation',async()=>{
    const actual=await evaluate("(async function(){\n const doc=document.querySelector('[data-create-frame]').contentDocument;\n const frame=doc.defaultView;\n const card=doc.querySelector('[data-card=\"live-waveform\"]');\n const buttons=Object.fromEntries(['listen','process','mode'].map(k=>[k,card.querySelector('[data-pv-wave-action=\"'+k+'\"]')]));\n const status=card.querySelector('[data-pv-wave-status]');\n const visual=card.querySelector('[data-pv-wave-visual]');\n const snapshot=()=>({\n  state:visual.getAttribute('data-pv-wave-state'),\n  mode:visual.getAttribute('data-pv-wave-mode'),\n  listen:buttons.listen.textContent.trim(),\n  process:buttons.process.textContent.trim(),\n  modeLabel:buttons.mode.textContent.trim(),\n  message:status.textContent\n });\n const initial=snapshot();\n let requests=0,stopped=0,closed=0;\n const media=frame.navigator.mediaDevices;\n const original=media?.getUserMedia;\n const OriginalContext=frame.AudioContext;\n if(!media)throw new Error('mediaDevices missing in localhost test');\n media.getUserMedia=()=>{requests++;return Promise.reject(Error('test permission denied'))};\n try{\n  buttons.listen.click();\n  await new Promise(r=>setTimeout(r,65));\n  const denied=snapshot(),afterDenied=requests;\n  media.getUserMedia=()=>{requests++;return Promise.resolve({getTracks:()=>[{stop(){stopped++}}]})};\n  frame.AudioContext=class {\n    createAnalyser(){return {frequencyBinCount:128,fftSize:256,smoothingTimeConstant:0.8,getByteFrequencyData(a){a.fill(90)}}}\n    createMediaStreamSource(){return {connect(){}}}\n    close(){closed++;return Promise.resolve()}\n  };\n  buttons.listen.click();\n  await new Promise(r=>setTimeout(r,65));\n  const live=snapshot();\n  const rect=card.querySelector('.pv-wave rect').getAttribute('height');\n  buttons.mode.click();\n  const scrolling=snapshot();\n  buttons.listen.click();\n  const stoppedState=snapshot();\n  buttons.process.click();\n  const idle=snapshot();\n  buttons.process.click();\n  const processing=snapshot();\n  let finishRequest;\n  media.getUserMedia=()=>{requests++;return new Promise(resolve=>{finishRequest=resolve})};\n  buttons.listen.click();\n  const pending=buttons.listen.disabled;\n  buttons.process.click();\n  const cancelRestored=!buttons.listen.disabled;\n  finishRequest({getTracks:()=>[{stop(){stopped++}}]});\n  await new Promise(r=>setTimeout(r,65));\n  const afterLateStream=snapshot();\n  const lateStreamStopped=stopped;\n  const invite=doc.querySelector('[data-pv-jump-invites]');\n  const target=doc.querySelector('[data-card=\"invite-team\"] [data-pv-invite-add]');\n  invite.click();\n  const focused=doc.activeElement===target;\n  return {initial,denied,afterDenied,live,rect,scrolling,stoppedState,idle,processing,requests,stopped,closed,focused,pending,cancelRestored,afterLateStream,lateStreamStopped};\n }finally{\n  media.getUserMedia=original;\n  frame.AudioContext=OriginalContext;\n }\n})()");
    assert.equal(actual.initial.state,'processing');
    assert.equal(actual.initial.mode,'static');
    assert.equal(actual.afterDenied,1,'microphone requested only on click');
    assert.equal(actual.denied.state,'processing','permission denied never claims live microphone');
    assert.match(actual.denied.message,/permission denied/,'error is visible');
    assert.equal(actual.live.state,'listening','actual stream and analyser were started');
    assert.equal(actual.live.listen,'Stop Listening');
    assert.match(actual.live.message,/Live microphone input.*not recorded or uploaded/);
    assert.equal(actual.requests,3,'two live attempts plus canceled pending microphone prompt');
    assert.equal(actual.scrolling.mode,'scrolling');
    assert.equal(actual.scrolling.modeLabel,'Scrolling');
    assert.equal(actual.stoppedState.state,'idle');
    assert.equal(actual.stopped,2,'stop releases live track and canceled late stream');
    assert.equal(actual.closed,1,'stop closes audio context');
    assert.equal(actual.idle.state,'processing');
    assert.equal(actual.processing.state,'idle');
    assert.equal(actual.pending,true,'permission pending disables Start');
    assert.equal(actual.cancelRestored,true,'canceling permission restores Start');
    assert.equal(actual.afterLateStream.state,'processing','late response cannot override state');
    assert.equal(actual.lateStreamStopped,2,'canceled late stream stops its track');
    assert.equal(actual.focused,true,'InviteMembers action focuses real InviteTeam button');
    // Leave host keyboard origin for existing CreateApp shortcuts.
    await evaluate('document.querySelector("button:not([disabled])").focus({preventScroll:true})');
  });


  await step('Stage4 ten-card batch: local PDF, environment draft, agent state, query modal, charts and 404 search',async()=>{
    const actual=await evaluate("(async function(){\nconst doc=document.querySelector('[data-create-frame]').contentDocument;\nconst card=id=>doc.querySelector('[data-card=\"'+id+'\"]');\nconst action=name=>doc.querySelector('[data-pv-action=\"'+name+'\"]');\nconst required=['invoice-pdf','invoice-pay','env-edit','env-deploy','agent-cancel','agent-enable','obs-query','anomaly-upgrade','traffic-report','sleep-detail','fitness-detail','analytics-detail','notfound-home'];\nconst hooks=required.map(name=>!!action(name));\nlet actualPdf='';\nconst win=doc.defaultView, originalCreate=win.URL.createObjectURL;\nwin.URL.createObjectURL=function(blob){blob.text().then(x=>actualPdf=x);return originalCreate.call(this,blob)};\ntry{action('invoice-pdf').click()}finally{win.URL.createObjectURL=originalCreate}\nawait new Promise(r=>setTimeout(r,80));\nconst invoice=card('invoice').querySelector('[data-pv-action-status]')?.textContent;\naction('env-edit').click();\nconst envInput=card('environment-variables').querySelector('[data-pv-env-api] input');\nconst editing=!!envInput;envInput.value='bad-url';action('env-edit').click();\nconst invalid=card('environment-variables').querySelector('[data-pv-action-status]').textContent;\nenvInput.value='https://api.qa.local';action('env-edit').click();\nconst saved=card('environment-variables').querySelector('[data-pv-env-api]').textContent;\naction('agent-cancel').click();const agent=card('activate-agent-dialog').querySelector('[data-pv-action-status]').textContent;\naction('obs-query').click();const query=!!doc.querySelector('#pv-obs-query-text');\nconst close=[...doc.querySelectorAll('.qxframe9a7c2-modal-root button')].find(x=>x.textContent.trim()==='Close');\nif(close)close.click();\nawait new Promise(resolve=>{const deadline=Date.now()+2500;function settled(){if(!doc.querySelector('.qxframe9a7c2-modal-root:not([hidden])')||Date.now()>deadline)return resolve();setTimeout(settled,20)}settled()});\naction('anomaly-upgrade').click();const focus=doc.activeElement===action('obs-query');\nconst search=card('not-found').querySelector('[data-pv-local-search]');\nsearch.value='sleep';search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));\nconst found=card('not-found').querySelector('[data-pv-action-status]')?.textContent;\nsearch.value='unlikely-xyz-card';search.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));\nconst missing=card('not-found').querySelector('[data-pv-action-status]')?.textContent;\nreturn {hooks,actualPdf,invoice,editing,invalid,saved,agent,query,focus,found,missing};\n})()");
    assert.ok(actual.hooks.every(Boolean),'all 13 actions are wired');
    assert.ok(actual.actualPdf.startsWith('%PDF-1.4'),'PDF bytes produced locally');
    assert.match(actual.invoice,/PDF generated locally/);
    assert.equal(actual.editing,true);
    assert.match(actual.invalid,/valid HTTPS/);
    assert.equal(actual.saved,'https://api.qa.local');
    assert.match(actual.agent,/not enabled/);
    assert.equal(actual.query,true);
    assert.equal(actual.focus,true);
    assert.match(actual.found,/sleep-report/);
    assert.match(actual.missing,/No matching/);
    await evaluate('document.querySelector("button:not([disabled])").focus({preventScroll:true})');
  });

  await step('import errors are reported and keep the current configuration', async () => {
    const before = JSON.stringify((await state()).config);
    await key('o');
    await waitFor('!!document.querySelector("[data-create-import-input]")', 'import dialog');
    await evaluate('document.querySelector("[data-create-import-input]").value = "not a theme"');
    await sleep(400); // let the dialog finish its enter motion before pointing at its footer
    await click('[...document.querySelectorAll(".qxframe9a7c2-modal-root:not([hidden]) button")].find(b => b.textContent.trim() === "导入")');
    await waitFor('!document.querySelector("[data-create-import-error]").hidden', 'error shown');
    assert.equal(JSON.stringify((await state()).config), before);
    await key('Escape');
  });

  await step('Shift+R asks, a second Shift+R resets (locks kept)', async () => {
    await sleep(300);
    await key('r', ['shift']);
    await waitFor('[...document.querySelectorAll(".qxframe9a7c2-modal-root:not([hidden])")].some(el => el.textContent.includes("恢复默认设置"))', 'reset dialog');
    await key('r', ['shift']);
    await waitFor('Object.keys(window.QXFRAME9A7C2_CREATE.state.config.ext).length === 0', 'reset');
    assert.equal((await state()).config.style, 'maia', 'locked style survives reset');
  });

  await step('URL restores the configuration on reload', async () => {
    await s('Page.navigate', { url: origin + '/docs/create/index.html?style=rhea&theme=teal&density=loose&item=02' });
    await waitFor('!!(window.QXFRAME9A7C2_CREATE && window.QXFRAME9A7C2_CREATE.state.config.style === "rhea")', 'reload');
    const restored = await state();
    assert.equal(restored.config.theme, 'teal');
    assert.equal(restored.config.ext.density, 'loose');
    await waitFor(`${frameAttr('data-create-style')} === 'rhea'`, 'preview follows URL');
  });

  await step('QX shape and InputGroup: theme radius / addon borders / Luma switch', async () => {
    // The current page is Preview 02; validate against the real iframe stylesheet.
    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "luma", radius: "default", ext: {} })');
    await waitFor(`${frameAttr('data-create-style')} === 'luma'`, 'Luma preview');
    // Width transitions when the theme changes. The iframe style marker is
    // updated synchronously, but the thumb's animated used width is not.
    // Poll actual geometry until it reaches the target; never skip the assertion.
    const lumaGeometry = `(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const thumb = doc?.querySelector('.qxframe9a7c2-switch-thumb');
      if (!thumb) return null;
      const style = doc.defaultView.getComputedStyle(thumb);
      const root = doc.defaultView.getComputedStyle(doc.documentElement);
      return {
        width: parseFloat(style.width),
        height: parseFloat(style.height),
        extra: root.getPropertyValue('--qxframe9a7c2-theme-switch-thumb-extra').trim()
      };
    })()`;
    await waitFor(`(() => {
      const g = ${lumaGeometry};
      return g && g.extra === '0.5rem' && g.width > g.height + 4;
    })()`, 'Luma switch capsule after CSS transition', 5000);
    const luma = await evaluate(lumaGeometry);
    assert.ok(luma && luma.width > luma.height + 4 && luma.extra === '0.5rem',
      'Luma switch thumb must reach a horizontal capsule: ' + JSON.stringify(luma));

    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, radius: "none" })');
    const zero = await evaluate(`(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const host = doc.createElement('div'); host.className = 'qxframe9a7c2-native-form';
      const radio = doc.createElement('input'); radio.type = 'radio'; radio.checked = true;
      host.append(radio); doc.body.append(host);
      const computed = doc.defaultView.getComputedStyle(radio);
      const dot = doc.defaultView.getComputedStyle(radio, '::before');
      const result = { outer: computed.borderTopLeftRadius, inner: dot.borderTopLeftRadius };
      host.remove();
      return result;
    })()`);
    assert.deepEqual(zero, { outer: '0px', inner: '0px' }, 'global zero radius applies to both radio rings');

    const group = await evaluate(`(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const root = doc.querySelector('.qxframe9a7c2-input-group:has(> .qxframe9a7c2-input-group-addon)');
      const addon = root?.querySelector(':scope > .qxframe9a7c2-input-group-addon');
      const field = root?.querySelector(':scope > .qxframe9a7c2-form-input');
      if (!root || !addon || !field) return null;
      const css = node => doc.defaultView.getComputedStyle(node);
      return { group: css(root).borderTopWidth, addon: css(addon).borderTopWidth, input: css(field).borderTopWidth };
    })()`);
    assert.ok(group && parseFloat(group.group) > 0 && group.addon === '0px' && group.input === '0px', 'addon must be INSIDE one outlined field: ' + JSON.stringify(group));

    const mixed = await evaluate(`(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const root = doc.createElement('div');
      root.className = 'qxframe9a7c2-input-group';
      root.style.width = '320px';
      root.innerHTML = '<span class="qxframe9a7c2-input-group-prefix">https://</span><div class="qxframe9a7c2-input-group-field"><span class="qxframe9a7c2-input-group-addon">#</span><input class="qxframe9a7c2-form-input" value="project"></div><span class="qxframe9a7c2-input-group-suffix">.com</span>';
      doc.body.append(root);
      const names = ['prefix','field','addon','input','suffix'];
      const els = [
        root.children[0],root.children[1],root.children[1].children[0],
        root.children[1].children[1],root.children[2]
      ];
      const result = Object.fromEntries(names.map((name,i) => {
        const cs = doc.defaultView.getComputedStyle(els[i]);
        return [name, { border: cs.borderTopWidth, leftRadius:cs.borderTopLeftRadius, rightRadius:cs.borderTopRightRadius }];
      }));
      result.rootBorder = doc.defaultView.getComputedStyle(root).borderTopWidth;
      root.remove();return result;
    })()`);
    assert.equal(mixed.rootBorder, '0px', 'external segments are not inside a shared root border');
    assert.ok(parseFloat(mixed.field.border)>0 && parseFloat(mixed.prefix.border)>0 && parseFloat(mixed.suffix.border)>0);
    assert.equal(mixed.addon.border,'0px');
    assert.equal(mixed.input.border,'0px');
    assert.equal(mixed.field.leftRadius,'0px');
    assert.equal(mixed.field.rightRadius,'0px');

  });

  await step('Empty geometry: source-locked 8 styles x light/dark', async () => {
    const expected = {
      vega: [48,40,18,28,10,10,24,16], nova: [24,32,14,20,14,10,16,10],
      maia: [48,40,18,28,10,10,24,16], lyra: [24,32,14,20,0,0,16,10],
      mira: [24,32,14,20,14,8,16,8], luma: [48,40,18,28,18,14,20,16],
      sera: [48,40,18,28,0,0,20,16], rhea: [48,40,18,28,22,14,20,16]
    };
    const approx = (actual, expectedValue, description) =>
      assert.ok(Number.isFinite(actual) && Math.abs(actual - expectedValue) <= 0.5,
        description + ': expected ' + expectedValue + 'px, got ' + actual);
    for (const [style, [inset, mediaSize, titleSize, titleLine, outerRadius, mediaRadius, glyphSize, contentGap]] of Object.entries(expected)) {
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "' + style + '", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style') + ' === "' + style + '"', style + ' Empty style');
      for (const mode of ['light','dark']) {
        const actual = await evaluate(`(() => {
          const doc = document.querySelector('[data-create-frame]').contentDocument;
          const root = doc.documentElement, previous = root.classList.contains('dark');
          root.classList.toggle('dark', ${mode === 'dark'});
          const empty = doc.querySelector('.qxframe9a7c2-empty.is-composed:has(> .qxframe9a7c2-empty-media.is-icon)');
          if (!empty) { root.classList.toggle('dark', previous); return null; }
          const media = empty.querySelector('.qxframe9a7c2-empty-media.is-icon');
          const title = empty.querySelector('.qxframe9a7c2-empty-title');
          const desc = empty.querySelector('.qxframe9a7c2-empty-description');
          const fixture = doc.createElement('div');
          fixture.className = 'qxframe9a7c2-empty is-composed is-bordered';
          fixture.innerHTML = '<div class="qxframe9a7c2-empty-content"><span>Alpha</span><span>Beta</span></div>';
          doc.body.append(fixture);
          const css = el => doc.defaultView.getComputedStyle(el);
          const read = value => parseFloat(value);
          const result = {
            inset: read(css(empty).paddingTop), gap: read(css(empty).rowGap),
            media: read(css(media).width), mediaRadius: read(css(media).borderTopLeftRadius),
            glyph: read(css(media.querySelector('svg')).width), contentGap: read(css(fixture.firstElementChild).rowGap),
            titleSize: read(css(title).fontSize), titleLine: read(css(title).lineHeight),
            titleWeight: read(css(title).fontWeight), descSize: read(css(desc).fontSize),
            descLine: read(css(desc).lineHeight),
            outerRadius: read(css(fixture).borderTopLeftRadius)
          };
          fixture.remove();
          root.classList.toggle('dark', previous);
          return result;
        })()`);
        assert.ok(actual, style + '/' + mode + ' missing Empty specimen');
        const label = style + '/' + mode + ' Empty';
        approx(actual.inset, inset, label + ' inset');
        approx(actual.gap, 16, label + ' gap');
        approx(actual.media, mediaSize, label + ' media');
        approx(actual.glyph, glyphSize, label + ' inner SVG (not media box)');
        approx(actual.contentGap, contentGap, label + ' EmptyContent children gap');
        approx(actual.mediaRadius, mediaRadius, label + ' media radius');
        approx(actual.titleSize, titleSize, label + ' title size');
        approx(actual.titleLine, titleLine, label + ' title line');
        approx(actual.outerRadius, outerRadius, label + ' outer radius');
        approx(actual.descSize, ['lyra','mira'].includes(style) ? 12 : 14, label + ' description size');
        approx(actual.descLine, ['lyra','mira'].includes(style) ? 19.5 : 22.75, label + ' description line');
        assert.equal(actual.titleWeight, style === 'sera' ? 600 : 500, label + ' title weight');
      }
    }
  });

  await step('Item and Field computed parity across 8 styles x light/dark', async () => {
    // Pinned source: tools/qa/spec.json; target only shared default-md layout,
    // leaving independent xs/sm geometry and nested Card acceptance for S3.
    const expected = {
      vega:[74.25,14,16,14,8,14,19.25,500,21,28,12,14,14,500,21],
      nova:[66.25,10,12,10,10,14,19.25,500,21,20,8,14,14,500,21],
      maia:[73.25,14,16,14,18,14,19.25,500,20,28,12,14,14,500,21],
      lyra:[61.5,10,12,10,0,12,16,500,19.5,20,8,12,12,400,18],
      mira:[62,10,12,10,8,12,16.5,500,19.5,16,8,12,12,500,18],
      luma:[73.25,14,16,14,18,14,19.25,500,20,28,12,14,14,500,21],
      sera:[73.25,14,16,14,0,12,16.5,600,22.75,40,12,12,19.5,600,21],
      rhea:[73.25,14,16,14,18,14,19.25,500,20,24,12,14,14,500,21]
    };
    const approx = (actual, expectedValue, name) =>
      assert.ok(Number.isFinite(actual) && Math.abs(actual-expectedValue) <= .5,
        name + ': expected ' + expectedValue + 'px, measured ' + actual + 'px');
    for (const [style, numbers] of Object.entries(expected)) {
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "' + style + '", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style') + ' === "' + style + '"', 'Item/Field preview ' + style);
      for (const mode of ['light','dark']) {
        const actual = await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const html=doc.documentElement, old=html.classList.contains('dark');
          html.classList.toggle('dark', ${mode === 'dark'});
          const host=doc.createElement('div');
          host.style.cssText='position:absolute;left:0;top:0;width:320px;visibility:hidden';
          host.innerHTML='<div class="qxframe9a7c2-item is-outline"><div class="qxframe9a7c2-item-content"><div class="qxframe9a7c2-item-title">Short item</div><p class="qxframe9a7c2-item-desc">A short note.</p></div></div><div class="qxframe9a7c2-field-group"><div class="qxframe9a7c2-form-field is-composed"><label class="qxframe9a7c2-form-label">Full name</label><input class="qxframe9a7c2-form-input" value="Example"><p class="qxframe9a7c2-form-description">Description</p></div><div class="qxframe9a7c2-form-field is-composed"><label class="qxframe9a7c2-form-label">Email</label><input class="qxframe9a7c2-form-input" value="example@mail.test"></div></div>';
          doc.body.append(host);
          const css=el=>doc.defaultView.getComputedStyle(el),n=v=>parseFloat(v);
          const item=host.querySelector('.qxframe9a7c2-item');
          const title=host.querySelector('.qxframe9a7c2-item-title');
          const itemDesc=host.querySelector('.qxframe9a7c2-item-desc');
          const fields=host.querySelector('.qxframe9a7c2-field-group');
          const field=fields.firstElementChild;
          const label=field.querySelector('.qxframe9a7c2-form-label');
          const formDesc=field.querySelector('.qxframe9a7c2-form-description');
          const values=[
            n(css(item).height),n(css(item).paddingTop),n(css(item).paddingLeft),n(css(item).columnGap),
            n(css(item).borderTopLeftRadius),n(css(title).fontSize),n(css(title).lineHeight),
            n(css(title).fontWeight),n(css(itemDesc).lineHeight),
            n(css(fields).rowGap),n(css(field).rowGap),n(css(label).fontSize),
            n(css(label).lineHeight),n(css(label).fontWeight),n(css(formDesc).lineHeight)
          ];
          host.remove(); html.classList.toggle('dark',old);
          return values;
        })()`);
        assert.ok(Array.isArray(actual), style + '/' + mode + ' fixture missing');
        const labels=['item height','item block padding','item inline padding','item gap',
          'item corner','title font','title line','title weight','item description line',
          'field-group gap','field gap','label font','label line','label weight','field description line'];
        for(let i=0;i<numbers.length;i++)
          approx(actual[i],numbers[i],style+'/'+mode+' '+labels[i]);
      }
    }
  });

  await step('Source-local FAQ, Empty and Preferences geometry in 16 themes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=empty-distribute-track]")', 'Preview 01 card fixtures');
    // Pinned source style-mira has AccordionTrigger p-2 (8px), yet
    // AccordionContentInner pb-4 (16px); the roles are independently sourced.
    const accordionTrigger={vega:16,nova:10,maia:16,lyra:10,mira:8,luma:16,sera:16,rhea:16};
    const accordionContent={vega:16,nova:10,maia:16,lyra:10,mira:16,luma:16,sera:16,rhea:16};
    const approx=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=.5,
      label+': expected '+expected+', observed '+actual);
    for(const [style,inset] of Object.entries(accordionTrigger)){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' FAQ fixtures');
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const html=doc.documentElement,prev=html.classList.contains('dark');
          html.classList.toggle('dark',${mode==='dark'});
          const css=el=>doc.defaultView.getComputedStyle(el),px=v=>parseFloat(v);
          const faq=doc.querySelector('[data-card="faq"]');
          const prefs=doc.querySelector('[data-card="preferences"]');
          const empty=doc.querySelector('[data-card="empty-distribute-track"] .qxframe9a7c2-empty.is-composed');
          const separators=[...prefs.querySelectorAll('.pv-divider-bleed')];
          const result={
            trigger: px(css(faq.querySelector('.qxframe9a7c2-collapse-item > summary')).paddingTop),
            content: px(css(faq.querySelector('.qxframe9a7c2-collapse-content')).paddingBottom),
            separatorCount: separators.length,
            separator: separators.map(el=>{
              const before=css(el);
              const values=[px(before.marginTop),px(before.marginBottom),px(before.height),
                before.backgroundColor,before.display,el.getBoundingClientRect().height];
              el.style.setProperty('--qxframe9a7c2-field-separator-display','block');
              values.push(css(el).display);
              el.style.removeProperty('--qxframe9a7c2-field-separator-display');
              return values;
            }),
            emptyPadding: px(css(empty).paddingTop),
            emptyMedia: px(css(empty.querySelector('.qxframe9a7c2-empty-media')).width),
            emptyMediaBottom: px(css(empty.querySelector('.qxframe9a7c2-empty-media')).marginBottom),
            emptyHeader: px(css(empty.querySelector('.qxframe9a7c2-empty-header')).rowGap)
          };
          html.classList.toggle('dark',prev);
          return result;
        })()`);
        const label=style+'/'+mode;
        approx(actual.trigger,inset,label+' Accordion trigger inset');
        approx(actual.content,accordionContent[style],label+' Accordion content inset');
        assert.equal(actual.separatorCount,2,label+' field separators');
        for(const pair of actual.separator){
          approx(pair[0],-16,label+' separator top margin');
          approx(pair[1],-16,label+' separator bottom margin');
          approx(pair[2],20,label+' source 20px separator slot');
          assert.ok(pair[3]==='rgba(0, 0, 0, 0)'||pair[3]==='transparent',
            label+' separator slot must be transparent except 1px center line');
          assert.equal(pair[4],style==='sera'?'none':'block',
            label+' source editorial FieldSeparator hidden only in Sera');
          approx(pair[5],style==='sera'?0:20,label+' displayed separator layout box');
          assert.equal(pair[6],'block',label+' local author override wins over Theme visibility');
        }
        approx(actual.emptyPadding,16,label+' Card Empty p-4');
        approx(actual.emptyMedia,(['nova','lyra','mira'].includes(style)?32:40),label+' media retains theme size');
        approx(actual.emptyMediaBottom,8,label+' media bottom gap');
        approx(actual.emptyHeader,style==='mira'?4:8,label+' Empty header gap');
      }
    }
  });

  await step('Upcoming Payments Calendar selects today using the original source runtime configuration', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=upcoming-payments] .qxframe9a7c2-calendar")', 'Upcoming Payments');
    const state=await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const host=doc.querySelector('[data-card="upcoming-payments"] [data-pv-calendar]');
      const today=new Date();
      const toKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
      return {authored:host?.getAttribute('data-value'),
        todayKey:toKey(today),
        selected:[...host.querySelectorAll('.qxframe9a7c2-calendar-cell.is-selected')].map(el=>({
          date:el.dataset.value||el.getAttribute('data-date')||el.getAttribute('title')||'',
          today:el.classList.contains('is-today')
        }))};
    })()`);
    assert.equal(state.authored,'today');
    assert.equal(state.selected.length,1,'UpcomingPayments original source initializes selected new Date()');
    assert.ok(state.selected[0].today,'live selected date matches Calendar own today state');
  });

  await step('Framed Radio Field and static SidebarMenuButton reproduce source box models', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=receiving-method]")','Receiving Method');
    for(const style of ['nova','maia','luma','sera']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Radio Field/Sidebar');
      const actual=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const css=e=>doc.defaultView.getComputedStyle(e),px=x=>parseFloat(x);
        const radio=doc.querySelector('[data-card="receiving-method"]');
        const choices=[...radio.querySelectorAll('.qxframe9a7c2-selectgroup-item')];
        const menu=doc.querySelector('[data-card="sidebar-nav"]');
        const button=menu.querySelector('.qxframe9a7c2-sidebar-menu-button');
        const groupTitle=menu.querySelector('.qxframe9a7c2-sidebar-group-label');
        return {choices:choices.map(c=>({top:px(css(c.querySelector('.qxframe9a7c2-selectgroup-label')).paddingTop),bottom:px(css(c.querySelector('.qxframe9a7c2-selectgroup-label')).paddingBottom),
          side:px(css(c.querySelector('.qxframe9a7c2-selectgroup-label')).paddingLeft),border:px(css(c.querySelector('.qxframe9a7c2-selectgroup-label')).borderTopWidth),height:c.getBoundingClientRect().height,
          titleLine:px(css(c.querySelector('.qxframe9a7c2-field-title')).lineHeight),
          contentHeight:c.querySelector('.qxframe9a7c2-field-content').getBoundingClientRect().height,
          titleHeight:c.querySelector('.qxframe9a7c2-field-title').getBoundingClientRect().height})),
          buttonHeight:button.getBoundingClientRect().height,buttonPad:px(css(button).paddingLeft),
          groupPad:px(css(groupTitle).paddingLeft)};
      })()`);
      assert.equal(actual.choices.length,2,style+' shared Radio Field rows');
      const inset={nova:10,maia:16,luma:16,sera:16}[style];
      for(const row of actual.choices){
        assert.equal(row.border,1,style+' FieldLabel outer border');
        assert.ok(Math.abs(row.top-inset)<=.5&&Math.abs(row.side-inset)<=.5,
          style+' source Radio Field p-x/p-t');
        assert.ok(Math.abs(row.bottom-10)<=.5,style+' source pb-2.5');
      }
      const menuHeight=['maia','luma','sera'].includes(style)?36:32;
      assert.ok(Math.abs(actual.buttonHeight-menuHeight)<=.5,style+' pinned SidebarMenuButton height');
      assert.ok(Math.abs(actual.buttonPad-(menuHeight===36?12:8))<=.5,style+' pinned SidebarMenuButton horizontal pad');
      assert.ok(Math.abs(actual.groupPad-(menuHeight===36?12:8))<=.5,style+' source SidebarGroupLabel inset');
      for(const row of actual.choices){
        const expectedHeight=Math.max(16,row.contentHeight)+row.top+row.bottom+row.border*2;
        assert.ok(Math.abs(row.height-expectedHeight)<=.5,
          style+' RadioField natural height tracks content and exact source insets: '+row.height+'/'+expectedHeight);
        assert.ok(row.titleHeight>=row.titleLine-.5,
          style+' source title owns at least one typographic line');
      }
      // The pinned 91.5px absolute comparison is checked under the *same*
      // Chromium+system-ui font as the source, inside preview-01-audit.mjs.
      // The browser theme-control test may use different font metrics.
    }
  });

  await step('Adaptive Calendar uses source-sized cells and visible month rows', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=upcoming-payments] .qxframe9a7c2-calendar")','Adaptive Calendar');
    for(const style of ['nova','mira','sera']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Adaptive Calendar');
      const actual=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const calendar=doc.querySelector('[data-card="upcoming-payments"] .qxframe9a7c2-calendar');
        const css=e=>doc.defaultView.getComputedStyle(e);
        const cells=[...calendar.querySelectorAll('.qxframe9a7c2-calendar-cell')];
        const first=cells.findIndex(c=>!c.classList.contains('is-outside'));
        const inside=cells.filter(c=>!c.classList.contains('is-outside')).length;
        const visible=cells.filter(c=>css(c).display!=='none').length;
        return {css:calendar.className,width:calendar.getBoundingClientRect().width,
          inset:parseFloat(css(calendar).paddingTop),border:parseFloat(css(calendar).borderTopWidth),
          cell:cells[0].getBoundingClientRect().width,nav:calendar.querySelector('.qxframe9a7c2-calendar-header').getBoundingClientRect().height,
          total:cells.length,visible,expected:Math.ceil((first+inside)/7)*7};
      })()`);
      const cell=style==='sera'?36:40,inset=style==='nova'?8:12;
      assert.ok(actual.css.includes('is-adaptive-month'),style+' variant');
      assert.ok(Math.abs(actual.width-(cell*7+inset*2))<=.5,style+' calendar width');
      assert.ok(Math.abs(actual.inset-inset)<=.5,style+' calendar inset');
      assert.equal(actual.border,0,style+' borderless calendar');
      assert.ok(Math.abs(actual.cell-cell)<=.5,style+' source day width');
      assert.ok(Math.abs(actual.nav-cell)<=.5,style+' source nav height');
      assert.equal(actual.total,42,style+' runtime calendar retains 42 state entries');
      assert.equal(actual.visible,actual.expected,style+' displays 4/5/6 actual month weeks');
    }
  });

  await step('Calendar outside-month muted colors and actual day height across 16 theme modes',async()=>{
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=upcoming-payments] .qxframe9a7c2-calendar-cell")','Calendar day cells');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','Calendar '+style);
      for(const mode of ['light','dark']){
        const r=await evaluate(`(()=>{
          const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;
          const prev=h.classList.contains('dark');h.classList.toggle('dark',${mode==='dark'});
          const cal=d.querySelector('[data-card="upcoming-payments"] .qxframe9a7c2-calendar');
          const cells=[...cal.querySelectorAll('.qxframe9a7c2-calendar-cell')];
          const css=e=>d.defaultView.getComputedStyle(e);
          const visible=e=>css(e).display!=='none';
          const outside=cells.find(e=>e.classList.contains('is-outside')&&!e.classList.contains('is-selected')&&visible(e));
          const inside=cells.find(e=>!e.classList.contains('is-outside')&&!e.classList.contains('is-selected')&&visible(e));
          const probe=d.createElement('span');probe.style.color='var(--qxframe9a7c2-theme-muted-foreground)';
          cal.append(probe);const muted=css(probe).color;probe.remove();
          const out={outside:!!outside,inside:!!inside,muted,
            outsideColor:outside?css(outside).color:null,insideColor:inside?css(inside).color:null,
            outsideWeight:outside?css(outside).fontWeight:null,insideWeight:inside?css(inside).fontWeight:null,
            outsideHeight:outside?outside.getBoundingClientRect().height:null,
            insideHeight:inside?inside.getBoundingClientRect().height:null,
            insideWidth:inside?inside.getBoundingClientRect().width:null};
          h.classList.toggle('dark',prev);return out;
        })()`);
        assert.ok(r.outside&&r.inside,style+'/'+mode+' current and outside-month dates');
        assert.equal(r.outsideColor,r.muted,style+'/'+mode+' outside day muted color');
        assert.notEqual(r.insideColor,r.muted,style+'/'+mode+' ordinary day foreground');
        assert.equal(r.outsideWeight,'400',style+'/'+mode+' outside day plain weight');
        assert.equal(r.insideWeight,'400',style+'/'+mode+' ordinary day plain weight');
        const cell=style==='sera'?36:40;
        assert.ok(Math.abs(r.outsideHeight-cell)<=.5,style+'/'+mode+' outside height '+r.outsideHeight);
        assert.ok(Math.abs(r.insideHeight-cell)<=.5,style+'/'+mode+' inside height '+r.insideHeight);
        assert.ok(Math.abs(r.insideWidth-cell)<=.5,style+'/'+mode+' day width '+r.insideWidth);
      }
    }
  });

  await step('Adaptive Calendar keyboard movement across the month remains visible', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=upcoming-payments] .qxframe9a7c2-calendar")','Calendar keyboard');
    const state=await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const root=doc.querySelector('[data-card="upcoming-payments"] .qxframe9a7c2-calendar');
      const cells=[...root.querySelectorAll('.qxframe9a7c2-calendar-cell')];
      const lastCurrent=cells.filter(el=>!el.classList.contains('is-outside')).at(-1);
      const before=root.querySelector('.qxframe9a7c2-calendar-title').textContent.trim();
      lastCurrent.click();
      root.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true,cancelable:true}));
      const after=root.querySelector('.qxframe9a7c2-calendar-title').textContent.trim();
      const hiddenActive=[...root.querySelectorAll('.qxframe9a7c2-calendar-cell.is-keyboard-focus,.qxframe9a7c2-calendar-cell.is-active')]
        .filter(el=>doc.defaultView.getComputedStyle(el).display==='none').length;
      return {before,after,hiddenActive};
    })()`);
    assert.notEqual(state.before,state.after,'ArrowDown from last visible week navigates into next month');
    assert.equal(state.hiddenActive,0,'adaptive trailing-week CSS must not create invisible active day');
  });

  await step('Display CardTitle uses pinned source leading for each style', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=claimable-balance]")','Claimable Card');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Claimable title');
      const row=await evaluate(`(() => {
        const d=document.querySelector('[data-create-frame]').contentDocument;
        const title=d.querySelector('[data-card="claimable-balance"] .qxframe9a7c2-card-title');
        const css=d.defaultView.getComputedStyle(title),r=title.getBoundingClientRect();
        return {display:title.classList.contains('is-display'),font:parseFloat(css.fontSize),
          line:parseFloat(css.lineHeight),height:r.height};
      })()`);
      const leading=style==='vega'?1.5:style==='nova'?1.375:1;
      assert.equal(row.display,true,style+' shared display variant');
      assert.ok(Math.abs(row.font-48)<=.5,style+' source text-5xl');
      assert.ok(Math.abs(row.line-48*leading)<=.5,style+' source line-height');
      assert.ok(Math.abs(row.height-48*leading)<=.5,style+' source title box height');
    }
  });

  await step('FAQ footer preserves two intrinsic non-shrinking full-width actions', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq]")','FAQ footer');
    for(const style of ['sera','lyra','maia','nova']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' FAQ Footer');
      const g=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const footer=doc.querySelector('[data-card="faq"] .qxframe9a7c2-card-footer');
        const elements=[...footer.querySelectorAll('.qxframe9a7c2-button')];
        const cs=e=>doc.defaultView.getComputedStyle(e),r=footer.getBoundingClientRect();
        return {gap:parseFloat(cs(footer).columnGap),footerHeight:r.height,
          buttons:elements.map(el=>({height:el.getBoundingClientRect().height,
            width:el.getBoundingClientRect().width,left:el.getBoundingClientRect().left-r.left,
            shrink:cs(el).flexShrink,text:el.querySelector('.qxframe9a7c2-button-label')?.getBoundingClientRect().height}))};
      })()`);
      assert.equal(g.gap,0,style+' source adjacent FAQ actions');
      assert.equal(g.buttons.length,2,style+' source two FAQ Buttons');
      for(const btn of g.buttons){
        assert.equal(btn.shrink,'0',style+' Button shrink-0');
        assert.ok(Math.abs(btn.height-g.buttons[0].height)<=.5,style+' FAQ Buttons share one row height');
      }
      assert.ok(Math.abs(g.buttons[1].left-(g.buttons[0].left+g.buttons[0].width))<=.5,
        style+' source full-width Buttons sit side by side without shrink/gap');
      assert.ok(Math.abs(g.buttons[0].width-(r=>r)(g.buttons[1].width))<=.5,
        style+' both actions consume same full-width card-content span');
      assert.ok(g.footerHeight>=g.buttons[0].height-.5,style+' footer retains natural action height');
    }
  });

  await step('Embedded Table uses collapsed Row borders, excluding final row', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=recent-transactions]")','Transaction rows');
    for(const style of ['vega','nova']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' source Table row');
      const rows=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const table=doc.querySelector('[data-card="recent-transactions"] .qxframe9a7c2-table.is-embedded');
        const css=x=>doc.defaultView.getComputedStyle(x);
        return {collapse:css(table).borderCollapse,items:[...table.querySelectorAll('tbody tr')].map(tr=>({
          row:parseFloat(css(tr).borderBottomWidth),
          cell:parseFloat(css(tr.querySelector('td')).borderBottomWidth),
          height:tr.getBoundingClientRect().height}))};
      })()`);
      assert.equal(rows.collapse,'collapse',style+' pinned source Table');
      assert.equal(rows.items.length,5,style+' five pinned transactions');
      rows.items.forEach((row,i)=>{
        assert.equal(row.cell,0,style+' Row not Cell owns border');
        assert.equal(row.row,i===4?0:1,style+' interrow border only');
        assert.ok(row.height>=55.5,style+' transaction Row natural media + padding size');
        // Exact 56.5/57/57/57/56.5px source rows are enforced in the
        // paired system-ui Chromium job, not under this browser's font.
      });
    }
  });

  await step('Small Item style tiers and Sera Preferences action width remain source-driven', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=preferences]")','Preferences footer');
    for(const style of ['vega','maia','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Item sm tier');
      const v=await evaluate(`(() => {
        const d=document.querySelector('[data-create-frame]').contentDocument,css=e=>d.defaultView.getComputedStyle(e),px=x=>parseFloat(x);
        const row=d.querySelector('[data-card="kitchen-island"] .qxframe9a7c2-item.is-sm');
        const footer=d.querySelector('[data-card="preferences"] .qxframe9a7c2-card-footer');
        const buttons=[...footer.querySelectorAll('.qxframe9a7c2-button')];
        return {sm:px(css(row).paddingTop),footerGap:px(css(footer).columnGap),
          heights:buttons.map(b=>b.getBoundingClientRect().height),
          widths:buttons.map(b=>b.getBoundingClientRect().width),
          intrinsicWidths:buttons.map(b=>b.querySelector('.qxframe9a7c2-button-label').getBoundingClientRect().width+
            px(css(b).paddingLeft)+px(css(b).paddingRight)+px(css(b).borderLeftWidth)+px(css(b).borderRightWidth))};
      })()`);
      assert.ok(Math.abs(v.sm-(style==='vega'?10:12))<=.5,style+' source small Item inset');
      assert.equal(v.footerGap,0,style+' Preferences Footer has no invented gap');
      if(style==='sera'){
        assert.ok(Math.abs(v.heights[1]-40)<=.5,'Sera Save Preferences must stay one line, 40px');
        assert.ok(v.widths[1]>=v.intrinsicWidths[1]-.5,
          'Sera Save Preferences must not shrink below one-line label plus padding');
        // 203.73px source width is accepted by the paired system-ui renderer,
        // since this interaction runner need not share that font.
      }
    }
  });

  await step('Source Card action gap, Item sm vertical insets and transaction zero Stack', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=kitchen-island]")','Kitchen Item');
    for(const style of ['vega','sera']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' source header/Item');
      const v=await evaluate(`(() => {
        const d=document.querySelector('[data-create-frame]').contentDocument,css=e=>d.defaultView.getComputedStyle(e),px=x=>parseFloat(x);
        const header=d.querySelector('[data-card="payout-threshold"] .qxframe9a7c2-card-header');
        const small=d.querySelector('[data-card="kitchen-island"] .qxframe9a7c2-item.is-sm');
        const stack=d.querySelector('[data-card="recent-transactions"] .qxframe9a7c2-stack.is-gap-0');
        const table=d.querySelector('[data-card="recent-transactions"] .qxframe9a7c2-table.is-embedded');
        const label=d.querySelector('[data-card="cover-art"] .qxframe9a7c2-form-label.is-artwork-meta');
        const desc=d.querySelector('[data-card="cover-art"] .qxframe9a7c2-card-description.is-artwork-meta');
        return {headerGap:px(css(header).columnGap),smPadding:px(css(small).paddingTop),
          stackGap:px(css(stack).rowGap),tableCollapse:css(table).borderCollapse,
          artLabel:px(css(label).lineHeight),artDesc:px(css(desc).lineHeight)};
      })()`);
      assert.ok(Math.abs(v.headerGap-(style==='sera'?6:4))<=.5,style+' pinned Header action gap');
      assert.ok(Math.abs(v.smPadding-(style==='vega'?10:12))<=.5,style+' pinned sm Item padding');
      assert.ok(Math.abs(v.stackGap)<=.01,style+' semantic gap-0 must be zero');
      assert.equal(v.tableCollapse,'collapse',style+' source Tailwind Table border collapse');
      if(style==='vega'){assert.ok(Math.abs(v.artLabel-12)<=.5);assert.ok(Math.abs(v.artDesc-16)<=.5)}
      if(style==='sera'){assert.ok(Math.abs(v.artLabel-19.5)<=.5);assert.ok(Math.abs(v.artDesc-19.5)<=.5)}
    }
  });

  await step('Pinned status Badge/Stock separator/Cover artwork consume shared recipes', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=cover-art]")','Cover Artwork');
    for(const style of ['vega','mira','sera']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' status/cover');
      const info=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const computed=e=>doc.defaultView.getComputedStyle(e),px=s=>parseFloat(s);
        const badge=doc.querySelector('[data-card="claimable-balance"] .qxframe9a7c2-badge');
        const stock=doc.querySelector('[data-card="stock-performance"] .qxframe9a7c2-divider');
        const cover=doc.querySelector('[data-card="cover-art"]'),item=cover.querySelector('.qxframe9a7c2-item.is-artwork');
        const svg=item.querySelector('.qxframe9a7c2-item-artwork-label svg'),footer=cover.querySelector('.qxframe9a7c2-card-footer');
        return {badgeHeight:badge.getBoundingClientRect().height,badgeFont:px(computed(badge).fontSize),
          badgeLine:px(computed(badge).lineHeight),badgeInset:px(computed(badge).paddingLeft),badgeBorder:px(computed(badge).borderLeftWidth),
          separatorDisplay:computed(stock).display,
          coverAspect:item.getBoundingClientRect().width/item.getBoundingClientRect().height,
          iconWidth:svg.getBoundingClientRect().width,footerGap:px(computed(footer).rowGap),
          footerColumn:computed(footer).flexDirection};
      })()`);
      const sourceHeight=style==='sera'?100/7+2:20;
      assert.ok(Math.abs(info.badgeHeight-sourceHeight)<=.5,style+' Badge intrinsic source height');
      assert.equal(info.badgeFont,style==='vega'?12:10,style+' Badge source typography');
      assert.ok(Math.abs(info.badgeInset-(style==='sera'?4:8))<=.5,style+' Badge corrected inline inset');
      assert.ok(Math.abs(info.badgeBorder-1)<=.5,style+' outlined Badge has a visible static 1px border');
      assert.equal(info.separatorDisplay,style==='sera'?'none':'block',style+' optional Stock separator visibility');
      assert.ok(Math.abs(info.coverAspect-1)<=.01,style+' Cover Art Item is square');
      assert.ok(Math.abs(info.iconWidth-40)<=.5,style+' Cover Art source placeholder icon');
      assert.equal(info.footerColumn,'column',style+' Cover footer semantic layout');
      assert.ok(Math.abs(info.footerGap-8)<=.5,style+' source Cover footer gap-2');
    }
  });

  await step('Syncing State uses symmetric Card insets and nested EmptyMedia in all themes', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=syncing-state]")','Syncing State composition');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Syncing composition');
      const result=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const card=doc.querySelector('[data-card="syncing-state"]');
        const content=card.querySelector('.qxframe9a7c2-card-content');
        const empty=content.querySelector('.qxframe9a7c2-empty');
        const header=empty.querySelector('.qxframe9a7c2-empty-header');
        const media=empty.querySelector('.qxframe9a7c2-empty-media');
        const desc=empty.querySelector('.qxframe9a7c2-empty-description');
        const c=el=>doc.defaultView.getComputedStyle(el);
        return {parented:media.parentElement===header,symmetric:parseFloat(c(card).paddingTop)-parseFloat(c(card).paddingBottom),
          inset:parseFloat(c(card).paddingTop),innerTop:parseFloat(c(content).paddingTop),
          innerBottom:parseFloat(c(content).paddingBottom),
          descOffset:parseFloat(c(desc).marginTop),descText:desc.textContent.trim(),
          descBalanced:c(desc).textWrap==='balance'&&desc.classList.contains('is-balanced'),
          mediaSize:media.getBoundingClientRect().width,
          mediaGlyphClass:media.classList.contains('is-glyph-sm'),
          iconSize:parseFloat(c(media.querySelector('svg')).width),
          iconHeight:parseFloat(c(media.querySelector('svg')).height)};
      })()`);
      const expectedInset=style==='sera'?32:style==='rhea'?20:style==='nova'||style==='lyra'||style==='mira'?16:24;
      assert.equal(result.descText,"We're pulling in your latest transactions. This usually takes a few seconds.",style+' source Empty description text');
      assert.equal(result.descBalanced,true,style+' source-balanced Empty description must use opt-in shared class');
      assert.equal(result.parented,true,style+' EmptyMedia must belong to EmptyHeader');
      assert.equal(result.mediaGlyphClass,true,style+' shared Empty compact glyph modifier');
      assert.ok(Math.abs(result.iconSize-16)<=.5&&Math.abs(result.iconHeight-16)<=.5,
        style+' source Empty glyph is 16px (independent of rotating SVG bounding box)');
      assert.ok(result.mediaSize>=32,style+' 32/40px Empty media remains independent of icon glyph');
      assert.ok(Math.abs(result.symmetric)<=.5,style+' source Card owns symmetric vertical insets');
      assert.ok(Math.abs(result.inset-expectedInset)<=.5,style+' source Card vertical padding');
      assert.ok(Math.abs(result.innerTop)<=.5&&Math.abs(result.innerBottom)<=.5,style+' sole CardContent is flush');
      assert.ok(Math.abs(result.descOffset-(style==='sera'?2:0))<=.5,style+' editorial EmptyDescription offset');
    }
  });

  await step('Source editorial ItemTitle text transformation is theme-driven, not a one-off wrap', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=dividend-income]")','Dividend titles');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Dividend text transformation');
      const titles=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        return [...doc.querySelectorAll('[data-card="dividend-income"] .qxframe9a7c2-item-title')]
          .map(el=>({transform:doc.defaultView.getComputedStyle(el).textTransform,
            nowrap:doc.defaultView.getComputedStyle(el).whiteSpace,
            forced:el.classList.contains('is-intrinsic-line')}));
      })()`);
      assert.equal(titles.length,4,style+' source titles');
      for(const title of titles){
        assert.equal(title.transform,style==='sera'?'uppercase':'none',style+' themed editorial title');
        assert.equal(title.nowrap,'normal',style+' title wrapping not artificially blocked');
        assert.equal(title.forced,false,style+' no one-off intrinsic title class');
      }
    }
  });

  await step('Dividend Income preserves the source Item flex sibling structure', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=dividend-income]")', 'Dividend Income');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Dividend Income');
      const actual=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const card=doc.querySelector('[data-card="dividend-income"]');
        const rows=[...card.querySelectorAll('.qxframe9a7c2-item-group > .qxframe9a7c2-item')];
        return rows.map(row=>{
          const chart=row.querySelector('.pv-mini-chart'),amount=row.querySelector('.pv-num');
          return {chartDirect:chart?.parentElement===row,amountDirect:amount?.parentElement===row,
            childCount:row.children.length,actions:row.querySelectorAll('.qxframe9a7c2-item-actions').length,
            contentMinWidth:doc.defaultView.getComputedStyle(row.querySelector('.qxframe9a7c2-item-content')).minWidth,
            contentBasis:doc.defaultView.getComputedStyle(row.querySelector('.qxframe9a7c2-item-content')).flexBasis,
            titleDisplay:doc.defaultView.getComputedStyle(row.querySelector('.qxframe9a7c2-item-title')).display};
        });
      })()`);
      assert.equal(actual.length,4,style+' dividend has four holdings');
      for(const [index,row] of actual.entries()){
        assert.ok(row.chartDirect&&row.amountDirect,style+' holding '+index+' requires source sibling layout');
        assert.equal(row.childCount,3,style+' holding '+index+' Item has three direct children');
        assert.equal(row.actions,0,style+' no extra ItemActions wrapper');
        assert.equal(row.contentMinWidth,'auto',style+' original flex min-content behavior');
        assert.equal(row.contentBasis,'0%',style+' pinned ItemContent flex-basis');
        assert.equal(row.titleDisplay,'flex',style+' source ItemTitle flex-wrap behavior');
      }
    }
  });

  await step('Kitchen Island uses 16px unboxed ItemMedia and 10px compact group gaps', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=kitchen-island]")', 'Kitchen Island');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Kitchen Island');
      const actual=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        const card=doc.querySelector('[data-card="kitchen-island"]');
        const group=card.querySelector('.qxframe9a7c2-item-group');
        const css=e=>doc.defaultView.getComputedStyle(e),n=v=>parseFloat(v);
        const gap=n(css(group).rowGap);
        group.style.setProperty('--qxframe9a7c2-item-group-gap','1.75rem');
        const overriddenGap=n(css(group).rowGap);
        group.style.removeProperty('--qxframe9a7c2-item-group-gap');
        const roller=doc.querySelector('[data-card="roller-shades"]');
        const rollerSlider=roller.querySelector('.qxframe9a7c2-slider');
        const rollerThumb=roller.querySelector('.qxframe9a7c2-slider-handle');
        return { gap,overriddenGap,
          rollerSliderHeight:n(css(rollerSlider).height),
          rollerThumbHeight:n(css(rollerThumb).height),
          rails:[...card.querySelectorAll('.pv-slider-item')].map(el=>{
            const rail=el.querySelector('.qxframe9a7c2-slider').getBoundingClientRect();
            const cardRect=card.getBoundingClientRect();
            return {x:rail.x-cardRect.x,w:rail.width,equal:el.classList.contains('is-actions-equal'),minWidth:css(el.querySelector('.qxframe9a7c2-slider')).minWidth};
          }),
          media:[...card.querySelectorAll('.pv-slider-item')].map(el=>{
            const icon=el.querySelector('.qxframe9a7c2-item-media.is-icon');
            const slider=el.querySelector('.qxframe9a7c2-slider');
            const handle=el.querySelector('.qxframe9a7c2-slider-handle');
            const title=el.querySelector('.qxframe9a7c2-item-title');
            return {count:el.querySelectorAll('.qxframe9a7c2-item-media').length,
              width:n(css(icon).width),height:n(css(icon).height),
              border:n(css(icon).borderTopWidth),
              slider:n(css(slider).height),handle:n(css(handle).height),
              title:n(css(title).lineHeight),row:el.getBoundingClientRect().height,
              chrome:n(css(el).paddingTop)+n(css(el).paddingBottom)+n(css(el).borderTopWidth)+n(css(el).borderBottomWidth)};
          })};
      })()`);
      assert.equal(actual.rails.length,4,style+' four slider rails');
      assert.ok(actual.rails.every(n=>n.equal),style+' equal ItemActions modifier on all rows');
      assert.ok(actual.rails.every(n=>n.minWidth==='0px'),style+' equal ItemActions Slider opts out of standalone 8rem minimum');
      assert.ok(Math.max(...actual.rails.map(n=>n.x))-Math.min(...actual.rails.map(n=>n.x))<=.5,
        style+' all Kitchen sliders must start together: '+JSON.stringify(actual.rails));
      assert.ok(actual&&actual.media.length===4,style+' has four Kitchen slider rows');
      assert.ok(Math.abs(actual.gap-10)<.5,style+' compact ItemGroup gap');
      assert.ok(Math.abs(actual.overriddenGap-28)<.5,style+' explicit ItemGroup gap wins');
      assert.ok(Math.abs(actual.rollerSliderHeight-actual.rollerThumbHeight)<=.5,
        style+' Roller Shades Slider root height follows source thumb rather than default button height');
      for(const media of actual.media){
        assert.equal(media.count,1,style+' must not duplicate ItemMedia DOM');
        assert.equal(media.width,16,style+' unboxed ItemMedia width');
        assert.equal(media.height,16,style+' unboxed ItemMedia height');
        assert.equal(media.border,0,style+' unboxed ItemMedia border');
        assert.ok(Math.abs(media.slider-media.handle)<=.5,style+' Slider footprint follows thumb size');
        assert.ok(Math.abs(media.row-(Math.max(media.title,media.handle)+media.chrome))<=.5,style+' row owns no extra Slider control height');
      }
    }
  });

  await step('Payments ItemContent shrinks without wrapping trailing chevrons', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=payments]")','Payments fixture');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Payments Item');
      const actual=await evaluate(`(() => {
        const doc=document.querySelector('[data-create-frame]').contentDocument;
        return [...doc.querySelectorAll('[data-card="payments"] .qxframe9a7c2-item')].map(el=>{
          const content=el.querySelector('.qxframe9a7c2-item-content');
          const svg=el.lastElementChild;
          const cr=content.getBoundingClientRect(),sr=svg.getBoundingClientRect(),ir=el.getBoundingClientRect();
          const css=doc.defaultView.getComputedStyle(content);
          return {basis:css.flexBasis,rootHeight:ir.height,
            centered:Math.abs((cr.top+cr.height/2)-(sr.top+sr.height/2))};
        });
      })()`);
      assert.equal(actual.length,4,style+' Payment rows');
      for(const row of actual){
        assert.equal(row.basis,'0px',style+' ItemContent zero basis');
        assert.ok(row.rootHeight<115,style+' item row did not wrap');
        assert.ok(row.centered<1,style+' trailing chevron stays on same row');
      }
    }
  });

  await step('Syncing State consumes source p-4 Empty inset in all 16 style modes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=syncing-state] .qxframe9a7c2-empty")','Syncing Empty ready');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','Syncing '+style);
      for(const dark of [false,true]){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const root=doc.documentElement,prev=root.classList.contains('dark');
          root.classList.toggle('dark',${dark});
          const empty=doc.querySelector('[data-card="syncing-state"] .qxframe9a7c2-empty');
          const css=doc.defaultView.getComputedStyle(empty);
          const result={top:parseFloat(css.paddingTop),right:parseFloat(css.paddingRight),bottom:parseFloat(css.paddingBottom),left:parseFloat(css.paddingLeft)};
          root.classList.toggle('dark',prev);return result;
        })()`);
        for(const [key,value] of Object.entries(actual)) assert.equal(value,16,style+'/'+dark+' Syncing Empty '+key+' inset follows pinned p-4');
      }
    }
  });
  await step('Loading Card matches pinned source height in eight styles and both modes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=loading-card]")','Loading Card source fixture');
    const height={vega:372,nova:348,maia:376,lyra:348,mira:348,luma:374,sera:398,rhea:362};
    for(const [style,pinnedHeight] of Object.entries(height)){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','Loading '+style);
      for(const dark of [false,true]){
        const got=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const root=doc.documentElement,previous=root.classList.contains('dark');
          root.classList.toggle('dark',${dark});
          const card=doc.querySelector('[data-card="loading-card"]');
          const stack=card.querySelector('.qxframe9a7c2-card-content > .qxframe9a7c2-stack');
          const row=card.querySelector('.qxframe9a7c2-card-content > .qxframe9a7c2-flex');
          const n=el=>parseFloat(doc.defaultView.getComputedStyle(el).rowGap);
          const data={height:card.getBoundingClientRect().height,stackGap:n(stack),buttonRowGap:n(row)};
          root.classList.toggle('dark',previous);return data;
        })()`);
        assert.ok(Math.abs(got.height-pinnedHeight)<=.5,style+' '+dark+' pinned Loading Card source height: '+JSON.stringify(got));
        assert.equal(got.stackGap,8,style+' Loading Stack uses shared gap-2');
        assert.equal(got.buttonRowGap,8,style+' Loading button row uses shared gap-2');
      }
    }
  });
  await step('Nova Claimable CardTitle and Payout Slider track match pinned source heights', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=claimable-balance]")','Claimable Card ready');
    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "nova", radius: "default", ext: {} })');
    await waitFor(frameAttr('data-create-style')+' === "nova"','Nova geometry');
    const result=await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const claim=doc.querySelector('[data-card="claimable-balance"]');
      const title=claim.querySelector('.qxframe9a7c2-card-title');
      const payout=doc.querySelector('[data-card="payout-threshold"]');
      const slider=payout.querySelector('.qxframe9a7c2-slider');
      const textarea=payout.querySelector('textarea');
      const rail=slider.querySelector('.qxframe9a7c2-slider-rail');
      return {claimableHeight:claim.getBoundingClientRect().height,titleHeight:title.getBoundingClientRect().height,
        titleLine:getComputedStyle(title).lineHeight,payoutHeight:payout.getBoundingClientRect().height,textareaHeight:textarea.getBoundingClientRect().height,textareaMinHeight:getComputedStyle(textarea).minHeight,sliderHeight:slider.getBoundingClientRect().height,
        sliderRailHeight:rail.getBoundingClientRect().height,trackVariant:slider.classList.contains('is-track-height')};
    })()`);
    assert.ok(Math.abs(result.titleHeight-66)<=.5,'pinned Nova text-5xl CardTitle uses 66px leading-snug: '+JSON.stringify(result));
    assert.ok(Math.abs(result.claimableHeight-374)<=.5,'source Claimable Balance first Card is 374px: '+JSON.stringify(result));
    assert.ok(Math.abs(result.sliderHeight-4)<=.5,'source Nova Payout Slider root follows 4px intrinsic rail: '+JSON.stringify(result));
    assert.ok(Math.abs(result.sliderRailHeight-4)<=.5);
    assert.equal(result.trackVariant,true);
    assert.ok(Math.abs(result.textareaHeight-100)<=.5,'pinned Notes Textarea min-height 100px must survive shared Theme sizing: '+JSON.stringify(result));
    assert.ok(Math.abs(result.payoutHeight-468)<=.5,'pinned Nova Payout Threshold Card is 468px: '+JSON.stringify(result));
  });
  await step('Payout Threshold live amount tracks QX Slider keyboard ValueController', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=payout-threshold] .qxframe9a7c2-slider-handle")','Payout Slider ready');
    const result=await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const card=doc.querySelector('[data-card="payout-threshold"]');
      const amount=card.querySelector('[data-pv-value-for="payout-threshold-amount"]');
      const slider=card.querySelector('[data-pv-output="payout-threshold-amount"]');
      const handle=slider.querySelector('.qxframe9a7c2-slider-handle');
      const before=amount.textContent;
      const send=k=>{
        handle.dispatchEvent(new doc.defaultView.KeyboardEvent('keydown',{key:k,code:k,bubbles:true,cancelable:true}));
        handle.dispatchEvent(new doc.defaultView.KeyboardEvent('keyup',{key:k,code:k,bubbles:true,cancelable:true}));
      };
      handle.focus();send('ArrowRight');const increased=amount.textContent;
      send('ArrowLeft');const restored=amount.textContent;
      return {before,increased,restored,sliderRoot:!!slider.querySelector('.qxframe9a7c2-slider')};
    })()`);
    assert.equal(result.before,'$2500.00');
    assert.equal(result.increased,'$2550.00','QX Slider keyboard input projects into source amount text');
    assert.equal(result.restored,'$2500.00','reverse keyboard change restores original amount');
    assert.equal(result.sliderRoot,true,'existing QX runtime Slider is the only Slider root');
  });
  await step('Payments source-locked Nova Item rows match same-browser geometry', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=payments]")','Payments comparison fixture');
    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "nova", radius: "default", ext: {} })');
    await waitFor(frameAttr('data-create-style')+' === "nova"', 'Nova same-browser Payments fixture');
    const geometry=await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const rows=[...doc.querySelectorAll('[data-card="payments"] .qxframe9a7c2-item')];
      const width=rows[0].parentNode.getBoundingClientRect().width;
      const font=doc.createElement('style');
      font.textContent='body,body *{font-family:system-ui,sans-serif!important}';
      doc.head.append(font);
      const css=doc.createElement('style');
      // Source contract: pinned ui/item.tsx + style-nova.css (Item/default,
      // ItemContent flex-1, ItemDescription line-clamp-2, ItemGroup gap-4).
      // Run in the SAME browser, using the SAME system-ui font as the QX rows.
      css.textContent=[
        '.qx-source-payments{box-sizing:border-box;display:flex;flex-direction:column;gap:16px;width:'+width+'px;font-family:system-ui,sans-serif}',
        '.qx-source-payments .src-item{box-sizing:border-box;display:flex;flex-wrap:wrap;align-items:center;width:100%;gap:10px;padding:10px 12px;border:1px solid transparent;font-size:14px}',
        '.qx-source-payments .src-media{display:flex;width:16px;height:16px;flex:0 0 auto;align-self:flex-start;transform:translateY(2px)}',
        '.qx-source-payments .src-content{display:flex;flex:1 1 0%;min-width:0;flex-direction:column;gap:4px}',
        '.qx-source-payments .src-title{display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;width:fit-content;max-width:100%;font-size:14px;font-weight:500;line-height:1.375}',
        '.qx-source-payments .src-desc{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin:0;font-size:14px;font-weight:400;line-height:1.5}',
        '.qx-source-payments .src-chevron{width:16px;height:16px;flex:0 0 16px}'
      ].join('');
      const host=doc.createElement('div');
      host.style.cssText='position:absolute;left:0;top:0;visibility:hidden;z-index:-1';
      host.innerHTML='<div class="qx-source-payments">'+rows.map(row=>
        '<div class="src-item"><div class="src-media"></div><div class="src-content"><div class="src-title">'+
        row.querySelector('.qxframe9a7c2-item-title').textContent+'</div><p class="src-desc">'+
        row.querySelector('.qxframe9a7c2-item-desc').textContent+'</p></div><div class="src-chevron"></div></div>'
      ).join('')+'</div>';
      doc.head.append(css);doc.body.append(host);
      const n=x=>+x.toFixed(3),measure=selector=>[...doc.querySelectorAll(selector)].map(row=>{
        const content=row.querySelector('.qxframe9a7c2-item-content,.src-content');
        const description=row.querySelector('.qxframe9a7c2-item-desc,.src-desc');
        const box=row.getBoundingClientRect(),c=content.getBoundingClientRect(),p=description.getBoundingClientRect();
        const st=doc.defaultView.getComputedStyle(description);
        return {height:n(box.height),width:n(box.width),contentWidth:n(c.width),descWidth:n(p.width),
          descHeight:n(p.height),line:n(parseFloat(st.lineHeight)),font:st.fontFamily,
          descLines:n(p.height/parseFloat(st.lineHeight))};
      });
      const actual=measure('[data-card="payments"] .qxframe9a7c2-item');
      const source=measure('.qx-source-payments .src-item');
      const systemFont=doc.defaultView.getComputedStyle(doc.body).fontFamily;
      const browser=doc.defaultView.navigator.userAgent;
      host.remove();css.remove();font.remove();return {actual,source,width,systemFont,browser};
    })()`);
    assert.equal(geometry.actual.length,4);assert.equal(geometry.source.length,4);
    for(let i=0;i<4;i++){
      const actual=geometry.actual[i],expected=geometry.source[i];
      for(const k of ['height','width','contentWidth','descWidth','descHeight','line','descLines'])
        assert.ok(Math.abs(actual[k]-expected[k])<=.5, 'Nova Payments source geometry row '+i+' '+k+': '+JSON.stringify({actual,expected}));
    }
    console.log('[payments-same-browser-source] '+JSON.stringify(geometry));
  });
  await step('SidebarNav follows pinned 8-style menu and group gaps', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=sidebar-nav]")','SidebarNav fixture');
    const gaps={vega:4,nova:0,maia:4,lyra:0,mira:1,luma:2,sera:2,rhea:2};
    const approx=(actual,expected,desc)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=.5,
      desc+': expected '+expected+'px, observed '+actual+'px');
    for(const [style,gap] of Object.entries(gaps)){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','SidebarNav '+style);
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const root=doc.documentElement,old=root.classList.contains('dark');
          root.classList.toggle('dark',${mode==='dark'});
          const style=el=>doc.defaultView.getComputedStyle(el),n=x=>parseFloat(x);
          const cards=[...doc.querySelectorAll('[data-card="sidebar-nav"] .pv-nav-card')];
          const out=cards.map(card=>{
            const group=card.querySelectorAll('.pv-nav-group'),lists=card.querySelectorAll('.pv-nav');
            return {gap:[...lists].map(x=>n(style(x).rowGap)),
              firstTop:n(style(group[0]).paddingTop),firstBottom:n(style(group[0]).paddingBottom),
              lastTop:n(style(group[1]).paddingTop),lastBottom:n(style(group[1]).paddingBottom)};
          });
          root.classList.toggle('dark',old);return out;
        })()`);
        assert.equal(actual.length,2,style+'/'+mode+' Sidebar cards');
        for(const card of actual){
          for(const val of card.gap)approx(val,gap,style+'/'+mode+' menu item gap');
          approx(card.firstTop,style==='mira'?4:8,style+'/'+mode+' top group');
          approx(card.firstBottom,4,style+'/'+mode+' pb-1 source');
          approx(card.lastTop,4,style+'/'+mode+' pt-1 source');
          approx(card.lastBottom,style==='mira'?4:8,style+'/'+mode+' last group');
        }
      }
    }
  });

  await step('FieldContent and Item text clamp calculated parity across 16 themes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=notification-settings]")','Form cards');
    const expected={vega:4,nova:2,maia:4,lyra:2,mira:2,luma:4,sera:4,rhea:4};
    for(const [style,expectedGap] of Object.entries(expected)){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' FieldContent');
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const html=doc.documentElement,prev=html.classList.contains('dark');
          html.classList.toggle('dark',${mode==='dark'});
          const css=el=>doc.defaultView.getComputedStyle(el),n=str=>parseFloat(str);
          const preference=[...doc.querySelectorAll('[data-card="preferences"] .qxframe9a7c2-field-content')];
          const notifications=[...doc.querySelectorAll('[data-card="notification-settings"] .qxframe9a7c2-field-content')];
          const host=doc.createElement('div');
          host.style.cssText='width:250px;position:absolute;left:0;top:0;visibility:hidden';
          host.innerHTML='<div class="qxframe9a7c2-item"><div class="qxframe9a7c2-item-content"><div class="qxframe9a7c2-item-title">A very long name of an individual item that should be truncated</div><p class="qxframe9a7c2-item-desc">Long description text that must be constrained across enough words to span several additional lines when natural wrapping would otherwise exceed two lines in this narrow fixture.</p></div></div>';
          doc.body.append(host);
          const item=host.querySelector('.qxframe9a7c2-item');
          const title=host.querySelector('.qxframe9a7c2-item-title');
          const desc=host.querySelector('.qxframe9a7c2-item-desc');
          const out={p:preference.map(el=>n(css(el).rowGap)),
            n:notifications.map(el=>n(css(el).rowGap)),
            itemWidth:n(css(item).width),hostWidth:host.getBoundingClientRect().width,
            titleClamp:css(title).webkitLineClamp,descClamp:css(desc).webkitLineClamp,
            descH:desc.getBoundingClientRect().height,descLine:n(css(desc).lineHeight)};
          host.remove();html.classList.toggle('dark',prev);return out;
        })()`);
        assert.equal(actual.p.length,2,style+'/'+mode+' Preferences FieldContent slots');
        assert.equal(actual.n.length,5,style+'/'+mode+' Notification FieldContent slots');
        for(const gap of [...actual.p,...actual.n])
          assert.ok(Math.abs(gap-expectedGap)<.5,style+'/'+mode+' FieldContent gap '+gap);
        assert.ok(Math.abs(actual.itemWidth-actual.hostWidth)<.5,style+'/'+mode+' full-width Item');
        assert.equal(actual.titleClamp,'1',style+'/'+mode+' title clamp');
        assert.equal(actual.descClamp,'2',style+'/'+mode+' description clamp');
        assert.ok(actual.descH<=actual.descLine*2+.5,style+'/'+mode+' description max two lines');
      }
    }
  });

  await step('Source FAQ segmented Tabs typography across eight styles and light/dark',async()=>{
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq] .qxframe9a7c2-tabs")','source FAQ Tabs');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({...window.QXFRAME9A7C2_CREATE.state.config,style:"'+style+'",radius:"default",ext:{}})');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','FAQ Tabs theme '+style);
      for(const mode of ['light','dark']){
        const a=await evaluate(`(()=>{
          const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;
          const old=h.classList.contains('dark');h.classList.toggle('dark',${mode==='dark'});
          const tabs=[...d.querySelectorAll('[data-card="faq"] .qxframe9a7c2-tabs.is-segmented .qxframe9a7c2-tabs-tab')];
          const out={weights:tabs.map(t=>Number(getComputedStyle(t).fontWeight)),active:tabs.filter(t=>t.classList.contains('is-active')).map(t=>Number(getComputedStyle(t).fontWeight)),radii:tabs.map(t=>parseFloat(getComputedStyle(t).borderTopLeftRadius))};
          h.classList.toggle('dark',old);return out;
        })()`);
        assert.ok(a.weights.length>=3,style+'/'+mode+' FAQ segmented triggers');
        assert.equal(a.active.length,1,style+'/'+mode+' exactly one current tab');
        const expected=style==='sera'?600:500;
        for(const w of a.weights)assert.equal(w,expected,style+'/'+mode+' source tab weight');
        const expectedRadius={vega:8,nova:8,maia:14,lyra:0,mira:8,luma:998,sera:0,rhea:18}[style];
        assert.equal(a.radii.length,a.weights.length,style+'/'+mode+' radius painter');
        for(const radius of a.radii)assert.ok(Math.abs(radius-expectedRadius)<.6,
          style+'/'+mode+' source-trigger corner '+expectedRadius+'px actual '+radius);
      }
    }
  });

  await step('FAQ segmented Tabs retain selected elevation through keyboard virtual-focus in 16 modes',async()=>{
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq] .qxframe9a7c2-tabs.is-segmented .qxframe9a7c2-tabs-tab.is-active")','FAQ segmented Tabs');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({...window.QXFRAME9A7C2_CREATE.state.config,style:"'+style+'",radius:"default",ext:{}})');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','FAQ elevation '+style);
      for(const mode of ['light','dark']){
        const m=await evaluate(`(()=>{
          const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,wasDark=h.classList.contains('dark');
          const wasShadow=h.style.getPropertyValue('--qxframe9a7c2-shadow-sm');
          h.classList.toggle('dark',${mode==='dark'});
          h.style.setProperty('--qxframe9a7c2-shadow-sm','0 2px 4px 0 rgb(53, 101, 211)');
          const tabs=[...d.querySelectorAll('[data-card="faq"] .qxframe9a7c2-tabs.is-segmented .qxframe9a7c2-tabs-tab')];
          const active=tabs.filter(t=>t.classList.contains('is-active'));
          const t=active[0],child=t?.querySelector('.qxframe9a7c2-tabs-tab-action');
          const priorTransition=t?.style.transition||'',wasFocus=t?.classList.contains('is-keyboard-focus');
          if(t){t.style.transition='none';t.classList.remove('is-keyboard-focus')}
          const before=t?getComputedStyle(t).boxShadow:null;
          if(t)t.classList.add('is-keyboard-focus');
          const css=t?getComputedStyle(t):null;
          const result={count:tabs.length,active:active.length,before,focused:css?.boxShadow,outline:css?.outlineStyle,width:css?.outlineWidth,offset:css?.outlineOffset,childOutline:child?getComputedStyle(child).outlineStyle:null};
          if(t){t.classList.toggle('is-keyboard-focus',!!wasFocus);t.style.transition=priorTransition}
          if(wasShadow)h.style.setProperty('--qxframe9a7c2-shadow-sm',wasShadow);else h.style.removeProperty('--qxframe9a7c2-shadow-sm');
          h.classList.toggle('dark',wasDark);return result;
        })()`);
        assert.ok(m.count>=3&&m.active===1,style+'/'+mode+' one selected FAQ Tab '+JSON.stringify(m));
        assert.ok(m.before.includes('53, 101, 211'),'selected Tab has active elevation before keyboard focus '+JSON.stringify(m));
        assert.equal(m.focused,m.before,style+'/'+mode+' keyboard outline must preserve selected Tab shadow');
        assert.equal(m.outline,'solid',style+'/'+mode+' outer Tab has keyboard focus outline');
        assert.equal(m.width,'2px',style+'/'+mode+' keyboard focus width');
        assert.equal(m.offset,'-1px',style+'/'+mode+' keyboard focus offset');
        if(m.childOutline)assert.equal(m.childOutline,'none',style+'/'+mode+' inner action has no duplicate outline');
      }
    }
  });

  await step('SelectGroup Hover cannot override Field feedback or focus, Outline and Muted in 16 themes',async()=>{
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=receiving-method]")','SelectGroup Preview');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({...window.QXFRAME9A7C2_CREATE.state.config,style:"'+style+'",radius:"default",ext:{}})');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','SelectGroup hover '+style);
      for(const mode of ['light','dark']){
        const point=await evaluate(`(()=>{
          const frame=document.querySelector('[data-create-frame]'),d=frame.contentDocument,h=d.documentElement;
          const wasDark=h.classList.contains('dark');
          h.classList.toggle('dark',__DARK__);
          const fixture=d.createElement('div');fixture.id='qx-s3-hover-fixture';
          fixture.style.cssText='position:fixed;left:18px;top:38px;z-index:99999;width:260px;height:64px';
          fixture.innerHTML='<div class="qxframe9a7c2-field is-warning"><div class="qxframe9a7c2-selectgroup is-outline"><label class="qxframe9a7c2-selectgroup-item"><input type="checkbox" class="qxframe9a7c2-selectgroup-input"><span class="qxframe9a7c2-selectgroup-label" style="width:250px;height:55px;transition:none">Test choice</span></label></div></div><i data-probe style="position:absolute;left:-9000px"></i>';
          fixture.dataset.previousDark=String(wasDark);
          d.body.append(fixture);
          h.style.setProperty('--qxframe9a7c2-theme-hover-border-strength','100%');
          h.style.setProperty('--qxframe9a7c2-theme-hover-background-strength','100%');
          h.style.setProperty('--qxframe9a7c2-theme-hover-color','rgb(34,45,219)');
          const x=frame.getBoundingClientRect(),r=fixture.querySelector('.qxframe9a7c2-selectgroup-label').getBoundingClientRect();
          return {x:x.left+r.left+30,y:x.top+r.top+25};
        })()`.replace('__DARK__',String(mode==='dark')));
        await mouse('mouseMoved',point.x,point.y);
        const data=await evaluate(`(()=>{
          const d=document.querySelector('[data-create-frame]').contentDocument,
            f=d.getElementById('qx-s3-hover-fixture'),h=d.documentElement,
            field=f.querySelector('.qxframe9a7c2-field'),group=f.querySelector('.qxframe9a7c2-selectgroup'),
            item=f.querySelector('.qxframe9a7c2-selectgroup-item'),input=f.querySelector('input'),
            label=f.querySelector('.qxframe9a7c2-selectgroup-label'),probe=f.querySelector('[data-probe]'),
            css=e=>d.defaultView.getComputedStyle(e),colors={};
          for(const [name,token] of [['is-warning','warning'],['is-invalid','destructive'],['is-valid','success'],['normal','border']]){
            probe.style.color='var(--qxframe9a7c2-theme-'+token+')';colors[name]=css(probe).color;
          }
          probe.style.backgroundColor='color-mix(in oklab,var(--qxframe9a7c2-theme-muted),rgb(34,45,219) 0%)';
          colors.muted=css(probe).backgroundColor;
          probe.style.backgroundColor='color-mix(in oklab,transparent,rgb(34,45,219) 0%)';
          colors.transparentHover=css(probe).backgroundColor;
          probe.style.backgroundColor='color-mix(in oklab,var(--qxframe9a7c2-theme-border),rgb(34,45,219) 100%)';
          colors.normalHoverBorder=css(probe).backgroundColor;
          const rows=[],hover=item.matches(':hover');
          for(const appearance of ['is-outline','is-muted']){
            group.className='qxframe9a7c2-selectgroup '+appearance;
            for(const status of ['is-warning','is-invalid','is-valid','normal']){
              field.className='qxframe9a7c2-field'+(status==='normal'?'':' '+status);
              input.disabled=false;input.checked=false;input.blur();
              const s=css(label),before={border:s.borderColor,bg:s.backgroundColor,hover:item.matches(':hover')};
              input.focus();
              const focused={border:css(label).borderColor,bg:css(label).backgroundColor,focusWithin:item.matches(':focus-within')};
              input.blur();
              rows.push({appearance,status,before,focused});
            }
            input.disabled=true;input.checked=false;
            rows.push({appearance,status:'disabled',before:{border:css(label).borderColor,bg:css(label).backgroundColor}});
            input.disabled=false;input.checked=true;
            rows.push({appearance,status:'checked',before:{border:css(label).borderColor,bg:css(label).backgroundColor}});
          }
          h.classList.toggle('dark',f.dataset.previousDark==='true');
          f.remove();for(const name of ['--qxframe9a7c2-theme-hover-border-strength','--qxframe9a7c2-theme-hover-background-strength','--qxframe9a7c2-theme-hover-color'])h.style.removeProperty(name);
          return {hover,colors,rows};
        })()`);
        assert.ok(data.hover,style+'/'+mode+' CDP mouse really hovered SelectGroup');
        for(const r of data.rows){
          const tag=style+'/'+mode+'/'+r.appearance+'/'+r.status+' '+JSON.stringify(r);
          if(['is-warning','is-invalid','is-valid'].includes(r.status)){
            if(r.appearance==='is-outline')assert.equal(r.before.border,data.colors[r.status],tag+' status border wins Hover');
            if(r.appearance==='is-muted')assert.equal(r.before.bg,data.colors.muted,tag+' status surface must not be tinted');
            assert.equal(r.focused.focusWithin,true,tag+' focus reached choice');
            if(r.appearance==='is-outline')assert.equal(r.focused.border,data.colors[r.status],tag+' status border wins Focus');
          } else if(r.status==='normal'){
            if(r.appearance==='is-outline')assert.equal(r.before.border,data.colors.normalHoverBorder,tag+' ordinary Hover remains theme-configurable');
            assert.equal(r.focused.focusWithin,true,tag+' focused choice must be focus-within');
            if(r.appearance==='is-outline')assert.notEqual(r.focused.border,data.colors.normalHoverBorder,tag+' Hover cannot override focus');
          }
        }
      }
    }
  });

  await step('FAQ Tabs pointer Focus preserves selected elevation and disables pointer ring in 16 modes',async()=>{
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq] .qxframe9a7c2-tabs-tab.is-active")','FAQ pointer shell');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({...window.QXFRAME9A7C2_CREATE.state.config,style:"'+style+'",radius:"default",ext:{}})');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','FAQ pointer '+style);
      for(const mode of ['light','dark']){
        // Use CDP's physical mouse in the Preview iframe. Programmatic
        // element.focus() after the keyboard test is NOT a pointer-focus probe:
        // Chromium may intentionally preserve :focus-visible on that path.
        const point=await evaluate(`(()=>{
          const frame=document.querySelector('[data-create-frame]');
          const t=frame.contentDocument.querySelector('[data-card="faq"] .qxframe9a7c2-tabs-tab.is-active');
          const action=t?.querySelector('.qxframe9a7c2-tabs-tab-action')||t;
          if(!action)return null;
          action.scrollIntoView({block:'center',inline:'nearest'});
          const outer=frame.getBoundingClientRect(),r=action.getBoundingClientRect();
          return {x:outer.left+r.left+r.width/2,y:outer.top+r.top+r.height/2};
        })()`);
        assert.ok(point,style+'/'+mode+' FAQ pointer target exists');
        await mouse('mouseMoved',point.x,point.y);
        await mouse('mousePressed',point.x,point.y);
        await mouse('mouseReleased',point.x,point.y);
        const m=await evaluate(`(()=>{
          const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;
          const t=d.querySelector('[data-card="faq"] .qxframe9a7c2-tabs-tab.is-active'),a=t?.querySelector('.qxframe9a7c2-tabs-tab-action')||t;
          const wasDark=h.classList.contains('dark'),wasKeyboard=h.classList.contains('qxframe9a7c2-keyboard-focus-origin');
          const vars=['--qxframe9a7c2-theme-pointer-shadow','--qxframe9a7c2-shadow-sm','--qxframe9a7c2-theme-pointer-width','--qxframe9a7c2-theme-pointer-offset'];
          const prior=vars.map(v=>h.style.getPropertyValue(v)),wasDisabled=t?.classList.contains('is-disabled'),wasKeyboardTab=t?.classList.contains('is-keyboard-focus');
          h.classList.toggle('dark',__DARK__);h.classList.remove('qxframe9a7c2-keyboard-focus-origin');
          h.style.setProperty(vars[0],'0 0 0 3px rgb(211, 67, 31)');
          h.style.setProperty(vars[1],'0 2px 4px 0 rgb(53, 101, 211)');
          h.style.setProperty(vars[2],'2px');h.style.setProperty(vars[3],'-1px');
          if(t)t.classList.remove('is-disabled');
          // Physical CDP mouse click above focuses the actual action and sets
          // the browser pointer modality. Do not call focus() programmatically.
          if(t)t.classList.remove('is-keyboard-focus');
          const s=t&&getComputedStyle(t),out={exists:!!t,focusWithin:!!t?.matches(':focus-within'),shadow:s?.boxShadow,outline:s?.outlineWidth,offset:s?.outlineOffset,childOutline:a&&a!==t?getComputedStyle(a).outlineStyle:null,keyboardClass:t?.classList.contains('is-keyboard-focus'),tabTag:t?.tagName,focusVisible:t?.matches(':focus-visible'),actionFocusVisible:a?.matches(':focus-visible'),outlineStyle:s?.outlineStyle,outlineColor:s?.outlineColor,activeTag:d.activeElement?.tagName};
          if(t)t.classList.add('is-disabled');
          out.disabledShadow=t?getComputedStyle(t).boxShadow:null;
          if(a)a.blur();if(t){t.classList.toggle('is-disabled',!!wasDisabled);t.classList.toggle('is-keyboard-focus',!!wasKeyboardTab)}
          vars.forEach((v,i)=>prior[i]?h.style.setProperty(v,prior[i]):h.style.removeProperty(v));
          h.classList.toggle('dark',wasDark);h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',wasKeyboard);return out;
        })()`.replace('__DARK__',String(mode==='dark')));
        assert.ok(m.exists&&m.focusWithin,style+'/'+mode+' pointer focus reached shell '+JSON.stringify(m));
        assert.ok(m.shadow?.includes('211, 67, 31'),style+'/'+mode+' explicit halo remains available '+JSON.stringify(m));
        assert.ok(m.shadow?.includes('53, 101, 211'),style+'/'+mode+' selected elevation retained '+JSON.stringify(m));
        assert.ok(!m.shadow?.includes('inset'),style+'/'+mode+' outline is never simulated by inset shadow');
        assert.equal(m.keyboardClass,false,style+'/'+mode+' pointer state excludes keyboard virtual-focus class');
        // Chromium may compute outline-width:medium (3px) with outline-style:none.
        // Width alone is not a painted outline; the strict visible-paint
        // contract is outline-style:none, plus no keyboard focus origin.
        assert.equal(m.outlineStyle,'solid',style+'/'+mode+' pointer outline uses genuine CSS outline '+JSON.stringify(m));
        assert.equal(m.focusVisible,false,style+'/'+mode+' pointer Tab must not be focus-visible');
        assert.equal(m.actionFocusVisible,false,style+'/'+mode+' pointer action must not be focus-visible');
        assert.ok(!m.disabledShadow?.includes('211, 67, 31'),style+'/'+mode+' disabled has no pointer shadow');
        if(m.childOutline)assert.equal(m.childOutline,'none',style+'/'+mode+' no inner outline');
      }
    }
  });

  await step('FieldContent label line and FAQ trigger gap follow source in 16 themes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq]")','FAQ and Notifications');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"','FAQ/Field '+style);
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const root=doc.documentElement,prev=root.classList.contains('dark');
          root.classList.toggle('dark',${mode==='dark'});
          const css=e=>doc.defaultView.getComputedStyle(e),px=x=>parseFloat(x);
          const labels=[...doc.querySelectorAll('[data-card="notification-settings"] .qxframe9a7c2-field-content>.qxframe9a7c2-form-label')];
          const faq=doc.querySelector('[data-card="faq"]'),summary=faq.querySelector('.qxframe9a7c2-collapse-item>summary');
          const accordionContent=faq.querySelector('.qxframe9a7c2-collapse-content');
          const faqTabs=faq.querySelector('.pv-tabs-full .qxframe9a7c2-tabs');
          const fields=[...doc.querySelectorAll('[data-card="notification-settings"] .qxframe9a7c2-selectgroup-item')];
          const ans={labelLines:labels.map(e=>px(css(e).lineHeight)),labelWeights:labels.map(e=>Number(css(e).fontWeight)),
            fieldGaps:fields.map(e=>px(css(e.querySelector('.qxframe9a7c2-flex')).columnGap)),
            expectedFieldGap:px(css(root).getPropertyValue('--qxframe9a7c2-theme-field-gap'))*16,
            expectedLine:px(css(root).getPropertyValue('--qxframe9a7c2-theme-field-label-line-height'))*16,
            faqTabsHeight:faqTabs.getBoundingClientRect().height,
            expectedFaqTabsHeight:Math.max(32,px(css(root).getPropertyValue('--qxframe9a7c2-theme-control-height'))*16),
            faqContentLine:px(css(accordionContent).lineHeight),
            expectedFaqContentLine:px(css(root).getPropertyValue('--qxframe9a7c2-theme-accordion-line-height'))*16,
            actualGap:px(css(summary).columnGap),
            accordionBorder:px(css(faq.querySelector('.qxframe9a7c2-collapse.is-native')).borderTopWidth),
            accordionInlinePadding:px(css(summary).paddingLeft),
            accordionTriggerBorder:px(css(summary).borderTopWidth),
            accordionIconOffset:px(css(summary.querySelector('.qxframe9a7c2-collapse-disclosure-icon')).marginTop),
            faqHeight:faq.getBoundingClientRect().height,
            notificationHeight:doc.querySelector('[data-card="notification-settings"]').getBoundingClientRect().height};
          root.classList.toggle('dark',prev);return ans;
        })()`);
        assert.equal(actual.labelLines.length,5,style+'/'+mode+' field labels');
        assert.equal(actual.fieldGaps.length,5,style+'/'+mode+' checkbox Field rows');
        for(const g of actual.fieldGaps)assert.ok(Math.abs(g-actual.expectedFieldGap)<=.5,
          style+'/'+mode+' checkbox Field consumes theme gap: '+g+'/'+actual.expectedFieldGap);
        assert.ok(Math.abs(actual.actualGap-(['maia','mira','luma','sera','rhea'].includes(style)?24:0))<=.5,
          style+'/'+mode+' source Accordion trigger gap');
        const framed=['maia','mira','luma','rhea'].includes(style);
        assert.ok(Math.abs(actual.accordionTriggerBorder-1)<=.5,style+'/'+mode+' source native Accordion trigger transparent border');
        assert.ok(Math.abs(actual.accordionIconOffset-(style==='lyra'?0:2))<=.5,
          style+'/'+mode+' pinned Accordion disclosure icon offset');
        assert.ok(Math.abs(actual.accordionBorder-(framed?1:0))<=.5,
          style+'/'+mode+' native Accordion outer border');
        assert.ok(Math.abs(actual.accordionInlinePadding-(framed?({maia:16,mira:8,luma:16,rhea:16}[style]):0))<=.5,
          style+'/'+mode+' native Accordion horizontal inset');
        assert.ok(Math.abs(actual.faqTabsHeight-actual.expectedFaqTabsHeight)<=.5,
          style+'/'+mode+' FAQ Tabs rail matches source control height: '+actual.faqTabsHeight+'/'+actual.expectedFaqTabsHeight);
        assert.ok(Math.abs(actual.faqContentLine-actual.expectedFaqContentLine)<=.5,
          style+'/'+mode+' FAQ content consumes source Accordion line-height: '+actual.faqContentLine+'/'+actual.expectedFaqContentLine);
        for(const line of actual.labelLines)assert.ok(Math.abs(line-actual.expectedLine)<=.5,
          style+'/'+mode+' FieldContent label line consumes role: '+line+'/'+actual.expectedLine);
        assert.ok(actual.labelWeights.every(Number.isFinite),style+'/'+mode+' valid Label font weights');
      }
    }
  });

  await step('Receiving Method uses 10px shared Radio Field rows in 16 modes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=receiving-method]")','Receiving Method');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' Receiving Method');
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const root=doc.documentElement,prior=root.classList.contains('dark');
          root.classList.toggle('dark',${mode==='dark'});
          const css=e=>doc.defaultView.getComputedStyle(e),num=x=>parseFloat(x);
          const card=doc.querySelector('[data-card="receiving-method"]');
          const rows=[...card.querySelectorAll('.qxframe9a7c2-selectgroup-item')];
          const group=card.querySelector('.qxframe9a7c2-choice-group');
          const sourceColumns=num(css(root).getPropertyValue('--qxframe9a7c2-theme-choice-group-columns'));
          const first=rows[0].getBoundingClientRect(),second=rows[1].getBoundingClientRect();
          group.style.setProperty('--qxframe9a7c2-choice-group-columns','1');
          const forcedSecond=rows[1].getBoundingClientRect();
          group.style.removeProperty('--qxframe9a7c2-choice-group-columns');
          const result={sourceColumns,firstTop:first.top,secondTop:second.top,firstBottom:first.bottom,
            secondWidth:second.width,groupWidth:group.getBoundingClientRect().width,
            forcedSecondTop:forcedSecond.top,
            items:rows.map(el=>{
            const st=css(el.querySelector('.qxframe9a7c2-selectgroup-label')),flex=el.querySelector('.qxframe9a7c2-flex'),inner=el.querySelector('.qxframe9a7c2-field-content');
            return {paddingBottom:num(st.paddingBottom),paddingTop:num(st.paddingTop),
              border:num(st.borderTopWidth),gap:num(css(flex).columnGap),
              contentGap:num(css(inner).rowGap),
              checked:el.querySelector('input[type=radio]').checked};
          }),
          themeChoiceInset:num(css(root).getPropertyValue('--qxframe9a7c2-theme-choice-field-inset'))*16,
          themeGap:num(css(root).getPropertyValue('--qxframe9a7c2-theme-field-gap'))*16,
          themeContentGap:num(css(root).getPropertyValue('--qxframe9a7c2-theme-field-content-gap'))*16};
          root.classList.toggle('dark',prior);
          return result;
        })()`);
        assert.equal(actual.items.length,2,style+'/'+mode+' has two radio Field rows');
        assert.equal(actual.items[0].checked,true,style+'/'+mode+' bank radio selected');
        assert.equal(actual.sourceColumns,style==='sera'?1:2,style+'/'+mode+' source ChoiceGroup columns');
        if(style==='sera')assert.ok(actual.secondTop>=actual.firstBottom,
          style+'/'+mode+' editorial choices stack on separate rows');
        else assert.ok(Math.abs(actual.secondTop-actual.firstTop)<=.5,
          style+'/'+mode+' regular choices sit side by side');
        assert.ok(actual.forcedSecondTop>=actual.firstBottom,
          style+'/'+mode+' public one-column override stacks rows');

        for(const row of actual.items){
          assert.ok(Math.abs(row.paddingBottom-10)<=.5,style+'/'+mode+' source pb-2.5');
          assert.ok(Math.abs(row.paddingTop-actual.themeChoiceInset)<=.5,
            style+'/'+mode+' upstream framed RadioField top inset');
          assert.equal(row.border,1,style+'/'+mode+' upstream FieldLabel border');
          assert.ok(Math.abs(row.gap-actual.themeGap)<=.5,style+'/'+mode+' Field gap role');
          assert.ok(Math.abs(row.contentGap-actual.themeContentGap)<=.5,
            style+'/'+mode+' FieldContent role');
        }
      }
    }
  });

  await step('ItemMedia description alignment matches pinned source in eight styles and both modes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=payments]")','Payment media fixture');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']) {
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' media style');
      for(const mode of ['light','dark']) {
        const expression = `(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          doc.documentElement.classList.toggle('dark', ${mode === 'dark'});
          const css=el=>doc.defaultView.getComputedStyle(el);
          return [...doc.querySelectorAll('[data-card="payments"] .qxframe9a7c2-item')].map(row=>{
            const media=row.querySelector('.qxframe9a7c2-item-media');
            const mr=media.getBoundingClientRect(),rr=row.getBoundingClientRect();
            return {alignment:css(media).alignSelf,transform:css(media).transform,gap:css(media).gap,
              top:mr.top-rr.top,border:parseFloat(css(row).borderTopWidth),padding:parseFloat(css(row).paddingTop)};
          });
        })()`;
        const metrics=await evaluate(expression);
        assert.equal(metrics.length,4,style+'/'+mode+' Payments descriptive rows');
        for(const item of metrics) {
          assert.equal(item.alignment,'flex-start',style+'/'+mode+' media is top-aligned');
          assert.equal(item.gap,'8px',style+'/'+mode+' media child gap');
          assert.match(item.transform,/matrix\(1, 0, 0, 1, 0, 2\)/,style+'/'+mode+' media offset +2px');
          assert.ok(Math.abs(item.top-(item.border+item.padding+2))<.5,
            style+'/'+mode+' media top follows pinned 2px offset and Item padding');
        }
      }
    }
  });
  await step('Audit InputGroup border/size/appearance and Item accent pairs in 16 modes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=payments]")','audit visual fixtures');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']) {
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' audit themes');
      for(const mode of ['light','dark']) {
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          doc.documentElement.classList.toggle('dark', ${mode === 'dark'});
          const host=doc.createElement('div');host.style.cssText='position:absolute;width:320px;visibility:hidden';
          host.innerHTML='<input class="qxframe9a7c2-form-input is-md" value="normal">'+
            '<div class="qxframe9a7c2-input-group is-md" data-case="flat"><span class="qxframe9a7c2-input-group-addon">$</span><input class="qxframe9a7c2-form-input is-md is-invalid" value="invalid"></div>'+
            '<div class="qxframe9a7c2-input-group is-md" data-case="mixed"><span class="qxframe9a7c2-input-group-prefix">$</span><div class="qxframe9a7c2-input-group-field"><span class="qxframe9a7c2-input-group-addon">@</span><input class="qxframe9a7c2-form-input is-md is-invalid" value="invalid"></div><span class="qxframe9a7c2-input-group-suffix">USD</span></div>'+
            '<div class="qxframe9a7c2-input-group is-separated is-md" data-case="separated"><span class="qxframe9a7c2-input-group-addon">$</span><input class="qxframe9a7c2-form-input" value="separate"></div>'+
            '<div class="qxframe9a7c2-input-group is-vertical is-md" data-case="vertical"><span class="qxframe9a7c2-input-group-addon">$</span><input class="qxframe9a7c2-form-input" value="vertical"></div>';
          doc.body.append(host);
          const cs=el=>doc.defaultView.getComputedStyle(el),rect=el=>el.getBoundingClientRect();
          const plain=host.firstElementChild,flat=host.querySelector('[data-case=flat]'),mixed=host.querySelector('[data-case=mixed]');
          const field=mixed.querySelector('.qxframe9a7c2-input-group-field');
          const sep=host.querySelector('[data-case=separated] .qxframe9a7c2-input-group-addon');
          const vert=host.querySelector('[data-case=vertical] .qxframe9a7c2-input-group-addon');
          const link=doc.querySelector('[data-card=payments] .qxframe9a7c2-item-link').cloneNode(true);
          link.classList.add('is-active');host.append(link);
          const desc=link.querySelector('.qxframe9a7c2-item-desc');
          const sample=doc.createElement('span');sample.style.color='var(--qxframe9a7c2-theme-accent-foreground)';
          sample.style.borderColor='var(--qxframe9a7c2-theme-destructive)';host.append(sample);
          const out={plainHeight:rect(plain).height,flatHeight:rect(flat).height,mixedHeight:rect(mixed).height,
            plainBg:cs(plain).backgroundColor,flatBg:cs(flat).backgroundColor,fieldBg:cs(field).backgroundColor,
            flatBorder:cs(flat).borderTopColor,fieldBorder:cs(field).borderTopColor,invalidBorder:cs(sample).borderTopColor,
            separatedWidth:cs(sep).borderTopWidth,verticalWidth:cs(vert).borderTopWidth,
            linkColor:cs(link).color,descColor:cs(desc).color,accentText:cs(sample).color};
          host.remove();return out;
        })()`);
        const label=style+'/'+mode;
        assert.ok(Math.abs(actual.flatHeight-actual.plainHeight)<=.5,label+' flat group same control height');
        assert.ok(Math.abs(actual.mixedHeight-actual.plainHeight)<=.5,label+' mixed group same control height');
        assert.equal(actual.flatBorder,actual.invalidBorder,label+' invalid flat border owner');
        assert.equal(actual.fieldBorder,actual.invalidBorder,label+' invalid inner field border owner');
        assert.equal(actual.flatBg,actual.plainBg,label+' group uses same input look surface');
        assert.equal(actual.fieldBg,actual.plainBg,label+' mixed field uses same input look surface');
        assert.equal(actual.separatedWidth,'1px',label+' separated addon still owns border');
        assert.equal(actual.verticalWidth,'1px',label+' vertical addon still owns border');
        assert.equal(actual.linkColor,actual.accentText,label+' Item accent foreground follows background');
        assert.equal(actual.descColor,actual.accentText,label+' Item muted description uses paired accent foreground');
      }
    }
  });
  await step('FAQ remains single-open and collapsible after switching questions', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq]")','FAQ toggle fixture');
    const states=await evaluate(`(() => {
      const items=[...document.querySelector('[data-create-frame]').contentDocument.querySelectorAll('[data-card=faq] details[name="qx-create-faq"]')];
      const opened=()=>items.map(x=>x.open);
      const initial=opened();
      items[1].querySelector('summary').click();const switched=opened();
      items[1].querySelector('summary').click();const collapsed=opened();
      items[0].querySelector('summary').click();const restored=opened();
      return {count:items.length,initial,switched,collapsed,restored};
    })()`);
    assert.equal(states.count,3);
    assert.deepEqual(states.initial,[true,false,false]);
    assert.deepEqual(states.switched,[false,true,false]);
    assert.deepEqual(states.collapsed,[false,false,false]);
    assert.deepEqual(states.restored,[true,false,false]);
  });
  await step('FAQ QX Tabs switches independent source-locked Billing and Goals panels', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq] .qxframe9a7c2-tabs-tab-action")', 'FAQ Tabs ready');
    const result = await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const faq=doc.querySelector('[data-card="faq"]');
      const actions=[...faq.querySelectorAll('.pv-tabs .qxframe9a7c2-tabs-tab-action')];
      const panels=[...faq.querySelectorAll('[data-pv-tab-panel]')];
      const bodyColors=[...faq.querySelectorAll('.qxframe9a7c2-collapse-content')].map(el=>doc.defaultView.getComputedStyle(el).color);
      const faqForeground=doc.defaultView.getComputedStyle(faq).color;
      const tabList=faq.querySelector('.qxframe9a7c2-tabs-list');
      const shells=[...faq.querySelectorAll('.qxframe9a7c2-tabs-tab-shell:not([hidden])')];
      const slotWidths=shells.map(node=>node.getBoundingClientRect().width);
      const listWidth=tabList.getBoundingClientRect().width;
      const slotGap=parseFloat(doc.defaultView.getComputedStyle(tabList).columnGap)||0;
      const hasEqualModifier=!!faq.querySelector('.qxframe9a7c2-tabs.is-equal');
      const snap=()=>({selected:actions.filter(e=>e.classList.contains('is-active')).map(e=>e.textContent.trim()),
        shown:panels.filter(e=>!e.hidden&&doc.defaultView.getComputedStyle(e).display!=='none').map(e=>e.getAttribute('data-pv-tab-panel')),
        questions:panels.filter(e=>!e.hidden).flatMap(e=>[...e.querySelectorAll('summary')].map(x=>x.textContent.trim()))});
      const initial=snap();
      actions[1].click(); const billing=snap();
      const billingItems=[...faq.querySelectorAll('[data-pv-tab-panel="billing"] details')];
      billingItems[1].querySelector('summary').click();
      const billingSingleOpen=billingItems.map(e=>e.open);
      actions[2].click(); const goals=snap();
      actions[0].click(); const restored=snap();
      return {tabs:actions.length,panels:panels.length,segmented:!!faq.querySelector('.pv-tabs .qxframe9a7c2-tabs.is-segmented'),hasEqualModifier,slotWidths,listWidth,slotGap,bodyColors,faqForeground,initial,billing,goals,restored,billingSingleOpen,
        names:[...faq.querySelectorAll('details')].map(e=>e.name)};
    })()`);
    assert.equal(result.tabs,3);
    assert.equal(result.panels,3);
    assert.equal(result.segmented,true,'source FAQ TabsList uses QX segmented style');
    assert.equal(result.hasEqualModifier,true,'FAQ must use reusable equal-width Tabs slots');
    assert.equal(result.slotWidths.length,3,'FAQ has three equal Tabs slots');
    assert.ok(Math.max(...result.slotWidths)-Math.min(...result.slotWidths)<=.5,
      'FAQ segmented slots must be equal width: '+JSON.stringify(result));
    assert.ok(Math.abs(result.slotWidths.reduce((sum,n)=>sum+n,0)+result.slotGap*2-result.listWidth)<=1.5,
      'FAQ three equal Tabs slots must fill available list width: '+JSON.stringify(result));
    assert.equal(result.bodyColors.length,9,'FAQ independent panels retain all nine descriptions');
    assert.ok(result.bodyColors.every(color=>color===result.faqForeground),
      'FAQ prose must consume regular Card foreground, not muted Collapse default: '+JSON.stringify(result));
    assert.deepEqual(result.initial.shown,['general']);
    assert.deepEqual(result.billing.shown,['billing']);
    assert.deepEqual(result.goals.shown,['goals']);
    assert.deepEqual(result.restored.shown,['general']);
    assert.ok(result.billing.questions[0].includes('Basic and Pro pricing tiers'));
    assert.ok(result.goals.questions[0].includes('custom financial goal'));
    assert.deepEqual(result.billingSingleOpen,[false,true,false]);
    assert.equal(result.names.length,9);
    assert.equal(new Set(result.names).size,3);
  });
  
  await step('Recent Transactions dates consume semantic muted Table cell foreground', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=recent-transactions] .qxframe9a7c2-table")', 'Transactions Table ready');
    const result=await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const table=doc.querySelector('[data-card="recent-transactions"] .qxframe9a7c2-table');
      const cells=[...table.querySelectorAll('tbody td.is-muted')];
      const probe=doc.createElement('span');
      probe.style.color='var(--qxframe9a7c2-theme-muted-foreground)';
      doc.body.appendChild(probe);
      const expected=doc.defaultView.getComputedStyle(probe).color;
      probe.remove();
      const actual=cells.map(el=>doc.defaultView.getComputedStyle(el).color);
      const normal=doc.defaultView.getComputedStyle(table.querySelector('tbody td:not(.is-muted)')).color;
      return {length:cells.length,actual,expected,normal};
    })()`);
    assert.equal(result.length,5,'all five transaction dates use the shared muted cell role');
    assert.ok(result.actual.every(color=>color===result.expected),
      'muted dates must use Theme muted foreground instead of Table row foreground: '+JSON.stringify(result));
  });

  await step('Motion none stops static Skeleton, Spinner and Accordion indicator in 16 modes', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq]")','Motion preview');
    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", ext: {motion: "none"} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' motion none');
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          doc.documentElement.classList.toggle('dark', ${mode === 'dark'});
          const cs=el=>doc.defaultView.getComputedStyle(el);
          const skeleton=doc.querySelector('.qxframe9a7c2-skeleton');
          const spinner=doc.querySelector('.qxframe9a7c2-spinner-icon');
          const chevron=doc.querySelector('[data-card=faq] .qxframe9a7c2-collapse-item>summary .pv-icon');
          return {skeleton:skeleton&&cs(skeleton).animationName,spinner:spinner&&cs(spinner).animationName,
            transition:chevron&&cs(chevron).transitionDuration,
            duration:cs(doc.documentElement).getPropertyValue('--qxframe9a7c2-theme-duration-md').trim()};
        })()`);
        assert.deepEqual(actual,{skeleton:'none',spinner:'none',transition:'0s',duration:'0ms'},style+'/'+mode+' stops motion');
      }
    }
    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "nova", ext: {} })');
  });

  await step('Static embedded Table recipes across eight styles and light/dark', async () => {
    const expected={vega:8,nova:8,maia:12,lyra:8,mira:8,luma:12,sera:12,rhea:8};
    for(const [style,inset] of Object.entries(expected)){
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "'+style+'", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style')+' === "'+style+'"',style+' embedded Table');
      for(const mode of ['light','dark']){
        const actual=await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const html=doc.documentElement,old=html.classList.contains('dark');
          html.classList.toggle('dark',${mode==='dark'});
          const host=doc.createElement('div');
          host.style.cssText='position:absolute;left:0;top:0;width:360px;visibility:hidden';
          host.innerHTML='<table class="qxframe9a7c2-table is-embedded is-hover"><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody><tr><td>Subscription</td><td>$10</td></tr><tr><td>Service</td><td>$20</td></tr></tbody></table>';
          doc.body.append(host);
          const table=host.firstElementChild,head=table.querySelector('th'),cell=table.querySelector('td');
          const sample=doc.createElement('span');
          sample.style.color='var(--qxframe9a7c2-theme-table-heading-foreground)';
          host.append(sample);
          const css=el=>doc.defaultView.getComputedStyle(el),px=value=>parseFloat(value);
          const result={inset:px(css(cell).paddingLeft),headerHeight:px(css(head).height),
            headerText:css(head).color,expectedText:css(sample).color,
            font:px(css(table).fontSize),headerFont:px(css(head).fontSize),line:px(css(cell).lineHeight),bodyBackground:css(cell).backgroundColor};
          host.remove();html.classList.toggle('dark',old);
          return result;
        })()`);
        const label=style+'/'+mode+' embedded Table';
        assert.ok(Math.abs(actual.inset-inset)<.51,label+' padding '+JSON.stringify(actual));
        assert.ok(Math.abs(actual.headerHeight-(24+2*inset))<.51,label+' header height '+JSON.stringify(actual));
        assert.equal(actual.headerText,actual.expectedText,label+' header semantic text');
        assert.ok(Math.abs(actual.font-(['lyra','mira'].includes(style)?12:14))<.51,label+' body size');
        assert.ok(Math.abs(actual.headerFont-(style==='sera'?12:actual.font))<.51,label+' head size');
        assert.ok(Math.abs(actual.line-(actual.font===12?16:20))<.51,label+' Tailwind table line box');
        assert.equal(actual.bodyBackground,'rgba(0, 0, 0, 0)',label+' unpainted cell');
      }
    }
  });

  await step('High-difference first-Card structural diagnostics (Nova)', async () => {
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq]")','first-Card diagnostics ready');
    await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "nova", radius: "default", ext: {} })');
    await waitFor(frameAttr('data-create-style')+' === "nova"','Nova diagnostic');
    const structure = await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const style=doc.createElement('style');
      style.textContent='body,body *{font-family:system-ui,sans-serif!important}*{animation:none;transition:none;content-visibility:visible!important}';
      doc.head.appendChild(style);
      const number=n=>+n.toFixed(2),get=el=>{
        if(!el)return null;
        const st=doc.defaultView.getComputedStyle(el),r=el.getBoundingClientRect();
        return {h:number(r.height),w:number(r.width),gap:st.rowGap,pt:st.paddingTop,pb:st.paddingBottom,
          mt:st.marginTop,mb:st.marginBottom,lh:st.lineHeight,children:el.children.length};
      };
      const result={};
      for(const name of ['faq','kitchen-island','payments','sidebar-nav','notification-settings']){
        const card=doc.querySelector('[data-card="'+name+'"]');
        if(!card)continue;
        const samples=[];
        const selectors=name==='faq'
          ? ['.qxframe9a7c2-card-content','.pv-tabs','.qxframe9a7c2-tabs','.qxframe9a7c2-tabs-list','.qxframe9a7c2-collapse','.qxframe9a7c2-collapse-item','summary','.qxframe9a7c2-collapse-content','.qxframe9a7c2-card-footer']
          : name==='kitchen-island'
          ? ['.qxframe9a7c2-card-header','.qxframe9a7c2-card-content','.pv-toggle-group','.qxframe9a7c2-item-group','.pv-slider-item','.qxframe9a7c2-item-content','.qxframe9a7c2-item-title','.qxframe9a7c2-item-actions','.pv-slider']
          : name==='payments'
          ? ['.qxframe9a7c2-card-header','.pv-breadcrumb','.qxframe9a7c2-card-content','.qxframe9a7c2-item-group','.qxframe9a7c2-item','.qxframe9a7c2-item-content','.qxframe9a7c2-item-title','.qxframe9a7c2-item-desc']
          : name==='sidebar-nav'
          ? ['.qxframe9a7c2-card','.pv-nav-group','.pv-nav-label','.pv-nav','.pv-nav-button','.qxframe9a7c2-divider']
          : ['.qxframe9a7c2-card-header','.qxframe9a7c2-card-content','.qxframe9a7c2-field-group','.qxframe9a7c2-selectgroup-item','.qxframe9a7c2-form-description','.qxframe9a7c2-card-footer'];
        for(const selector of selectors){const el=card.querySelector(selector);samples.push({selector,metrics:get(el)});}
        result[name]={root:get(card),samples};
        // Preserve per-row text-wrap evidence for Payments/FAQ before changing
        // fonts, glyph widths or the shared Item roles.
        if(name==='payments'){
          result[name].rows=[...card.querySelectorAll('.qxframe9a7c2-item')].map((row,i)=>{
            const content=row.querySelector('.qxframe9a7c2-item-content');
            const title=row.querySelector('.qxframe9a7c2-item-title');
            const desc=row.querySelector('.qxframe9a7c2-item-desc');
            const media=row.querySelector('.qxframe9a7c2-item-media');
            const glyph=row.lastElementChild, st=doc.defaultView.getComputedStyle(desc);
            return {index:i,row:get(row),content:get(content),title:get(title),
              desc:get(desc),media:get(media),glyph:get(glyph),
              descText:desc.textContent,fontSize:st.fontSize,fontWeight:st.fontWeight,
              letterSpacing:st.letterSpacing,whiteSpace:st.whiteSpace,
              descLines:+(desc.getBoundingClientRect().height/parseFloat(st.lineHeight)).toFixed(2),
              glyphStyle:doc.defaultView.getComputedStyle(glyph).flexShrink};
          });
        }
        if(name==='faq'){
          result[name].details=[...card.querySelectorAll('.qxframe9a7c2-collapse-item')].map((row,i)=>{
            const summary=row.querySelector('summary'),content=row.querySelector('.qxframe9a7c2-collapse-content');
            const st=doc.defaultView.getComputedStyle(content);
            return {index:i,open:row.open,row:get(row),summary:get(summary),content:get(content),
              text:content.textContent,whiteSpace:st.whiteSpace,fontSize:st.fontSize,
              fontWeight:st.fontWeight,letterSpacing:st.letterSpacing,
              contentLines:+(content.getBoundingClientRect().height/parseFloat(st.lineHeight)).toFixed(2)};
          });
        }
      }
      style.remove();return result;
    })()`);
    console.log('[preview-01-structure-nova] '+JSON.stringify(structure));
  });

  await step('Preview 01 refreshed first-Card height diagnostic against pinned source', async () => {
    const baseline = JSON.parse(fs.readFileSync(path.join(root, 'tools/qa/reports/stage-3/preview-01/report.json'), 'utf8'));
    assert.equal(baseline.source, '295a1f114a138f23b5dfee0e0c6812394dfeb90c');
    await click('document.querySelector("[data-create-item=\\"01\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=contribution-history]")', 'Preview 01 canvas', 7000);
    const rows = [];
    for (const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']) {
      await evaluate('window.QXFRAME9A7C2_CREATE.commit({ ...window.QXFRAME9A7C2_CREATE.state.config, style: "' + style + '", radius: "default", ext: {} })');
      await waitFor(frameAttr('data-create-style') + ' === "' + style + '"', style + ' Preview 01');
      for (const mode of ['light','dark']) {
        const actual = await evaluate(`(() => {
          const doc=document.querySelector('[data-create-frame]').contentDocument;
          const html=doc.documentElement, previous=html.classList.contains('dark');
          html.classList.toggle('dark', ${mode === 'dark'});
          let qa=doc.getElementById('qx-create-qa-measurement');
          if(!qa){
            qa=doc.createElement('style');qa.id='qx-create-qa-measurement';
            qa.textContent='body,body *{font-family:system-ui,sans-serif!important}*{animation:none;transition:none;content-visibility:visible!important}';
            doc.head.append(qa);
          }
          const values={};
          for(const group of doc.querySelectorAll('[data-card]')){
            if(!group.dataset.card || group.parentElement.closest('[data-card]'))continue;
            const card=group.classList.contains('qxframe9a7c2-card')?group:group.querySelector('.qxframe9a7c2-card');
            if(card){const rect=card.getBoundingClientRect();values[group.dataset.card]={height:rect.height,width:rect.width};}
          }
          html.classList.toggle('dark',previous);
          return values;
        })()`);
        for(const record of baseline.rows.filter(row=>row.style===style&&row.mode===mode)){
          const now=actual[record.card], reference=record.reference, prior=record.actual;
          rows.push({style,mode,card:record.card,
            referenceHeight:reference?.height??null,priorHeight:prior?.height??null,
            currentHeight:now?.height??null,referenceWidth:reference?.width??null,currentWidth:now?.width??null,
            delta:reference&&now?+(now.height-reference.height).toFixed(3):null});
        }
      }
    }
    assert.equal(rows.length, baseline.rows.length, 'every pinned first-Card row must be remeasured');
    assert.ok(rows.every(row=>row.currentHeight!==null),'a pinned reference Card is missing');
    const bad=row=>row.delta!==null&&Math.abs(row.delta)>.5;
    const oldBad=row=>row.referenceHeight!==null&&row.priorHeight!==null&&Math.abs(row.priorHeight-row.referenceHeight)>.5;
    const summary={source:baseline.source,font:'system-ui,sans-serif',scope:'first Card per example only; heights diagnostic, not acceptance',
      referenceCapturedOn:'Windows Chrome 154 (see tools/qa/reports/stage-3/README.md)',
      actualCapturedOn:process.platform,
      fontMetricParityUnverified:process.platform!=='win32',
      caution:'Cross-OS system-ui may resolve to different font faces. Treat text-wrap height differences as unverified until both sides run in the same browser.',
      renders:rows.length,previousOverTolerance:rows.filter(oldBad).length,currentOverTolerance:rows.filter(bad).length,
      improved:rows.filter(row=>row.delta!==null&&row.priorHeight!==null&&Math.abs(row.delta)<Math.abs(row.priorHeight-row.referenceHeight)-.5).length,
      worsened:rows.filter(row=>row.delta!==null&&row.priorHeight!==null&&Math.abs(row.delta)>Math.abs(row.priorHeight-row.referenceHeight)+.5).length,
      topNova:rows.filter(row=>row.style==='nova'&&row.mode==='light').sort((a,b)=>Math.abs(b.delta??0)-Math.abs(a.delta??0)).slice(0,10)};
    fs.writeFileSync(path.join(root,'tools/qa/reports/stage-3/preview-01/current-report.json'),
      JSON.stringify({...summary,rows},null,2)+'\n');
    console.log('[preview-01-first-card-diagnostic] '+JSON.stringify(summary));
  });


  await step('Preview 01 controlled ToggleGroup/Slider/Checkbox states match pinned source', async () => {
    await click('document.querySelector("[data-create-item=\\\"01\\\"]")');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=roller-shades] .qxframe9a7c2-slider")', 'interactive Preview 01');
    const state = await evaluate(`(() => {
      const doc=document.querySelector('[data-create-frame]').contentDocument;
      const card=id=>doc.querySelector('[data-card="'+id+'"]');
      const press=(root,index)=>root.querySelectorAll('.pv-toggle-group button')[index].click();
      const active=root=>[...root.querySelectorAll('.pv-toggle-group button')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent.trim());
      const kitchen=card('kitchen-island');
      press(kitchen,1);
      const scene=active(kitchen);
      const sceneValues=[...kitchen.querySelectorAll('.qxframe9a7c2-slider-handle')].map(h=>h.getAttribute('aria-valuenow')||h.style.left||h.style.bottom);
      const power=kitchen.querySelector('.qxframe9a7c2-switch-input');
      power.click();
      const sceneDisabled=[...kitchen.querySelectorAll('.pv-toggle-group button')].every(b=>b.disabled);
      const sliderDisabled=[...kitchen.querySelectorAll('.qxframe9a7c2-slider')].every(s=>s.classList.contains('is-disabled'));
      power.click();
      const sceneEnabled=[...kitchen.querySelectorAll('.pv-toggle-group button')].every(b=>!b.disabled);
      const roller=card('roller-shades');
      press(roller,2);
      const closed={active:active(roller),height:roller.querySelector('.pv-shade > div').style.height};
      press(roller,0);
      const open={active:active(roller),height:roller.querySelector('.pv-shade > div').style.height};
      const release=card('release-catalog');
      press(release,0);
      const stock={active:active(release),holdings:release.querySelectorAll('.qxframe9a7c2-item-group > .qxframe9a7c2-item').length};
      const notification=card('notification-settings');
      const check=[...notification.querySelectorAll('.qxframe9a7c2-selectgroup-item input[type=checkbox]')];
      const initial={checked:check[0].checked,indeterminate:check[0].indeterminate};
      check[0].click();
      const allChecked=check.every(c=>c.checked)&&!check[0].indeterminate;
      check[1].click();
      const partial={checked:check[0].checked,indeterminate:check[0].indeterminate};
      return {scene,sceneValues,sceneDisabled,sliderDisabled,sceneEnabled,closed,open,stock,initial,allChecked,partial};
    })()`);
    assert.deepEqual(state.scene,['Dining'],'Kitchen scene selection');
    assert.equal(state.sceneValues.length,4,'four actual QX Slider handles remain');
    assert.equal(state.sceneDisabled,true,'master switch disables four scene buttons');
    assert.equal(state.sliderDisabled,true,'master switch disables QX Sliders');
    assert.equal(state.sceneEnabled,true,'scene buttons re-enable');
    assert.deepEqual(state.closed,{active:['Closed'],height:'100%'},'Roller closed preset');
    assert.deepEqual(state.open,{active:['Open'],height:'0%'},'Roller open preset');
    assert.deepEqual(state.stock,{active:['Stocks'],holdings:4},'source ReleaseCatalog filter does not remove holdings');
    assert.deepEqual(state.initial,{checked:false,indeterminate:true},'source initial mixed state');
    assert.equal(state.allChecked,true,'all choices are checked from master');
    assert.deepEqual(state.partial,{checked:false,indeterminate:true},'individual choice restores mixed state');
  });


  await step('Preview 01 fifteen pinned native FieldLabels focus their controls', async () => {
    await click('document.querySelector(\'[data-create-item="01"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=receiving-method] input")', 'Preview native fields');
    const observations = await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const fields=[{"card":"payout-threshold","id":"payout-notes","kind":"textarea"},{"card":"savings-targets","id":"investment-amount","kind":"input"},{"card":"savings-targets","id":"investment-order-type","kind":"select"},{"card":"account-access","id":"email-address","kind":"input"},{"card":"account-access","id":"current-password","kind":"input"},{"card":"transfer-funds","id":"transfer-amount","kind":"input"},{"card":"receiving-method","id":"account-holder","kind":"input"},{"card":"receiving-method","id":"iban","kind":"input"},{"card":"new-milestone","id":"goal-name","kind":"input"},{"card":"new-milestone","id":"target-amount","kind":"input"},{"card":"new-milestone","id":"target-date","kind":"input"},{"card":"social-links","id":"spotify-url","kind":"input"},{"card":"social-links","id":"instagram-handle","kind":"input"},{"card":"social-links","id":"soundcloud-url","kind":"input"},{"card":"social-links","id":"website-url","kind":"input"}];
      return fields.map(({card,id,kind})=>{
        const target=d.querySelector('[data-card="'+card+'"]');
        const label=target?.querySelector('label[for="'+id+'"]');
        const focus=target?.querySelector('[id="'+id+'"]');
        if(!label||!focus)return {card,id,kind,error:'missing association'};
        label.click();
        return {card,id,kind,tag:focus.tagName.toLowerCase(),
          matches:label.control===focus,focused:d.activeElement===focus};
      });
    })()`);
    assert.equal(observations.length,15,'fifteen native Label associations');
    assert.deepEqual(observations.filter(x=>x.error||!x.matches||!x.focused),[],JSON.stringify(observations));
  });

  await step('Preview 01 five source Select FieldLabels focus existing QX Controller roots', async () => {
    await click('document.querySelector(\'[data-create-item="01"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=receiving-method] input")', 'Preview native fields');
    const cases = await evaluate("(() => {\n  const d=document.querySelector('[data-create-frame]').contentDocument;\n  const fields=[[\"payout-threshold\",\"preferred-currency\"],[\"preferences\",\"default-currency\"],[\"transfer-funds\",\"from-account\"],[\"transfer-funds\",\"to-account\"],[\"stock-performance\",\"stock-ticker\"]];\n  return fields.map(([card,id])=>{\n    const panel=d.querySelector('[data-card=\"'+card+'\"]');\n    const label=panel?.querySelector('label[for=\"'+id+'\"]');\n    const focus=panel?.querySelector('#'+id+'.qxframe9a7c2-select[tabindex]');\n    if(!label||!focus)return {card,id,error:'missing live label or QX root'};\n    const before=focus.textContent.trim();\n    label.click();\n    return {card,id,focused:d.activeElement===focus,\n      ownedClass:focus.classList.contains('is-focused'),\n      valueUnchanged:focus.textContent.trim()===before,\n      noFakeInput:!focus.querySelector('input'),\n      popupClosed:!panel.querySelector('.qxframe9a7c2-select-panel:not([hidden])')};\n  });\n})()");
    assert.equal(cases.length,5,'five QX Select labels');
    assert.deepEqual(cases.filter(x=>x.error||!x.focused||!x.ownedClass||!x.valueUnchanged||!x.noFakeInput||!x.popupClosed),[],JSON.stringify(cases));
  });

  await step('Pinned secondary Buttons and FAQ segmented Tabs match Theme roles in light and dark',async()=>{
    await click('document.querySelector(\'[data-create-item="01"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=faq] .qxframe9a7c2-tabs-tab.is-active")','Preview 01 Tab');
    const result=await evaluate("(() => {\n const doc=document.querySelector('[data-create-frame]').contentDocument;\n const root=doc.documentElement,initialDark=root.classList.contains('dark');\n const noTransition=doc.createElement('style');\n noTransition.textContent='.qxframe9a7c2-button,.qxframe9a7c2-tabs-tab{transition:none!important}';\n doc.head.appendChild(noTransition);\n const cards=[['qr-connect','Got it'],['cover-art','Upload Artwork'],['social-links','Discard']];\n const result=[];\n const probe=doc.createElement('span');\n probe.style.cssText='position:absolute;display:block;background:var(--qxframe9a7c2-theme-secondary);color:var(--qxframe9a7c2-theme-secondary-foreground)';\n doc.body.appendChild(probe);\n for(const dark of [false,true]){\n  root.classList.toggle('dark',dark);\n  const expectedBg=getComputedStyle(probe).backgroundColor,expectedText=getComputedStyle(probe).color;\n  for(const [card,name] of cards){\n   const el=doc.querySelector('[data-card=\"'+card+'\"] .qxframe9a7c2-button.is-secondary.is-solid');\n   if(!el){result.push({dark,card,error:'missing secondary button'});continue;}\n   const style=getComputedStyle(el);\n   result.push({dark,card,text:el.textContent.trim(),name,\n     bgMatch:style.backgroundColor===expectedBg,\n     fgMatch:style.color===expectedText});\n  }\n  const tabs=doc.querySelector('[data-card=\"faq\"] .qxframe9a7c2-tabs.is-segmented');\n  const active=tabs?.querySelector('.qxframe9a7c2-tabs-tab.is-active');\n  const inactive=tabs?.querySelector('.qxframe9a7c2-tabs-tab:not(.is-active)');\n  probe.style.color='var(--qxframe9a7c2-theme-foreground)';\n  const expectedFg=getComputedStyle(probe).color;\n  if(!active||!inactive)result.push({dark,card:'faq',error:'missing Tabs'});\n  else result.push({dark,card:'faq',sameWeight:getComputedStyle(active).fontWeight===getComputedStyle(inactive).fontWeight,\n   foregroundMatch:getComputedStyle(active).color===expectedFg});\n  probe.style.color='var(--qxframe9a7c2-theme-secondary-foreground)';\n }\n root.classList.toggle('dark',initialDark);\n probe.remove();noTransition.remove();\n return result;\n})()");
    assert.equal(result.length,8,'three Buttons + FAQ in both modes');
    assert.deepEqual(result.filter(x=>x.error||x.bgMatch===false||x.fgMatch===false||x.sameWeight===false||x.foregroundMatch===false),[],JSON.stringify(result));
  });

  await step('SelectGroup None preserves keyboard/focus, real checkbox and Flex cross axis',async()=>{
    await click('document.querySelector(\'[data-create-item="01"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=notification-settings] .qxframe9a7c2-selectgroup-item")','SelectGroup');
    const results=await evaluate("(() => { const d=document.querySelector('[data-create-frame]').contentDocument;const row=d.querySelector('[data-card=notification-settings] .qxframe9a7c2-selectgroup-item');const input=row.querySelector('.qxframe9a7c2-selectgroup-input'),surface=row.querySelector('.qxframe9a7c2-selectgroup-label'),flex=row.querySelector('.qxframe9a7c2-flex'),indicator=row.querySelector('.qxframe9a7c2-selectgroup-indicator');const css=e=>getComputedStyle(e);let defaultState={border:css(surface).borderTopWidth,bg:css(surface).backgroundColor,padding:css(surface).paddingTop,checked:input.checked,indicator:css(indicator).backgroundColor,align:css(flex).alignItems}; const modes={};for(const mode of ['start','center','end']){flex.classList.remove('is-start','is-center','is-end');flex.classList.add('is-'+mode);modes[mode]=css(flex).alignItems;}flex.classList.remove('is-start','is-center','is-end');flex.classList.add('is-start');return {defaultState,modes};})()");
    assert.equal(results.defaultState.border,'0px','None has no border');
    assert.equal(results.defaultState.padding,'0px','None has zero padding');
    assert.equal(results.defaultState.bg,'rgba(0, 0, 0, 0)','None background transparent');
    assert.deepEqual(results.modes,{start:'flex-start',center:'center',end:'flex-end'},'independent Flex controls alignment');
  });

  await step('Field and SelectGroup state priority, disabled hover, FormData and native reset',async()=>{
    const out=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,origin=h.classList.contains('qxframe9a7c2-keyboard-focus-origin'),dark=h.classList.contains('dark'),results=[];h.classList.remove('qxframe9a7c2-keyboard-focus-origin');for(const mode of [false,true]){h.classList.toggle('dark',mode);for(const feedback of ['is-invalid','is-warning','is-valid']){for(const appearance of ['is-outline','is-muted']){const form=d.createElement('form');form.className='qxframe9a7c2-field '+feedback;const group=d.createElement('div');group.className='qxframe9a7c2-selectgroup '+appearance;const flex=d.createElement('div');flex.className='qxframe9a7c2-flex is-gap-2';group.append(flex);form.append(group);for(const [value,disabled] of [['first',false],['second',false],['no',true]]){const label=d.createElement('label');label.className='qxframe9a7c2-selectgroup-item';label.innerHTML='<input type=\"radio\" class=\"qxframe9a7c2-selectgroup-input\" name=\"channel\" value=\"'+value+'\"'+(value==='first'?' checked required':'')+(disabled?' disabled':'')+'><span class=\"qxframe9a7c2-selectgroup-label\">'+value+'</span>';flex.append(label);}d.body.append(form);const inputs=Array.from(flex.querySelectorAll('input')),labels=Array.from(flex.querySelectorAll('.qxframe9a7c2-selectgroup-label'));labels.forEach(el=>el.style.transition='none');const disabledBefore=getComputedStyle(labels[2]).backgroundColor;inputs[2].parentElement.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));const disabledHover=getComputedStyle(labels[2]).backgroundColor;inputs[1].focus();const pointerBorder=getComputedStyle(labels[1]).borderTopColor;const expected=d.createElement('span');expected.style.color='var(--qxframe9a7c2-theme-'+(feedback==='is-invalid'?'destructive':feedback==='is-warning'?'warning':'success')+')';form.append(expected);const expectedBorder=getComputedStyle(expected).color;const before=Array.from(new FormData(form).entries());inputs[1].parentElement.click();const after=Array.from(new FormData(form).entries());form.reset();const reset=Array.from(new FormData(form).entries());results.push({mode,feedback,appearance,before,after,reset,disabledBefore,disabledHover,pointerBorder,expectedBorder,disabledCursor:getComputedStyle(inputs[2].parentElement).cursor,disabledChecked:inputs[2].checked});form.remove();}}}h.classList.toggle('dark',dark);h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',origin);return results;})()");
    assert.equal(out.length,12,'three feedback roles × two appearances × light/dark');
    for(const row of out){
      assert.deepEqual(row.before,[['channel','first']],'FormData starts with native radio');
      assert.deepEqual(row.after,[['channel','second']],'click changes the native FormData owner');
      assert.deepEqual(row.reset,[['channel','first']],'reset restores native default checked value');
      assert.equal(row.disabledBefore,row.disabledHover,'disabled hover never paints a new background');
      assert.equal(row.disabledCursor,'not-allowed','disabled native input also disables entire label');
      assert.equal(row.disabledChecked,false,'disabled input remains unchanged');
      if(row.appearance==='is-outline'&&row.feedback!=='is-valid')assert.equal(row.pointerBorder,row.expectedBorder,'feedback border wins over pointer focus '+JSON.stringify(row));
    }
  });

  await step('SelectGroup media Surface and independent Flex preserve native choice and connected seam', async()=>{
    const result=await evaluate("(() => { const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,prior=h.classList.contains('dark'),host=d.createElement('section'),out=[];host.style.cssText='position:absolute;left:0;top:0;z-index:9;width:560px';d.body.append(host);for(const dark of [false,true]){h.classList.toggle('dark',dark);for(const mode of ['none','outline','muted']){const group=d.createElement('div');group.className='qxframe9a7c2-selectgroup'+(mode==='none'?'':' is-'+mode);const flex=d.createElement('div');flex.className='qxframe9a7c2-flex is-wrap is-gap-2';group.append(flex);for(let j=0;j<2;j++){const item=d.createElement('label');item.className='qxframe9a7c2-selectgroup-item';item.style.width='10rem';item.innerHTML='<input class=\"qxframe9a7c2-selectgroup-input\" type=\"radio\" name=\"test-'+mode+'-'+dark+'\"'+(j===0?' checked':'')+'><span class=\"qxframe9a7c2-selectgroup-label\">'+(j===0?'<span>Text</span>':'<span class=\"qxframe9a7c2-selectgroup-image\"><span class=\"qxframe9a7c2-selectgroup-image-preview\">Media</span></span>')+'</span>';flex.append(item);}host.append(group);const items=Array.from(flex.children),surface=items.map(i=>i.querySelector('.qxframe9a7c2-selectgroup-label'));surface.forEach(el=>el.style.transition='none');const styles=surface.map(el=>getComputedStyle(el)),before=items.map(i=>i.querySelector('input').checked);items[1].click();out.push({kind:'media',dark,mode,display:styles.map(s=>s.display),padding:styles.map(s=>s.paddingTop),border:styles.map(s=>s.borderTopWidth),before,after:items.map(i=>i.querySelector('input').checked)});group.remove();}}for(const appearance of ['is-outline','is-muted'])for(const nested of [false,true]){const group=d.createElement('div');group.className='qxframe9a7c2-selectgroup is-connected '+appearance;const flex=d.createElement('div');flex.className='qxframe9a7c2-flex is-gap-3';const parent=nested?flex:group;if(nested)group.append(flex);for(let j=0;j<3;j++){const item=d.createElement('label');item.className='qxframe9a7c2-selectgroup-item';item.innerHTML='<input class=\"qxframe9a7c2-selectgroup-input\" type=\"radio\" name=\"test-connected-'+nested+'\"'+(j===0?' checked':'')+'><span class=\"qxframe9a7c2-selectgroup-label\">Option '+j+'</span>';parent.append(item);}host.append(group);const items=Array.from(parent.children),rects=items.map(i=>i.getBoundingClientRect()),s=items.map(i=>getComputedStyle(i.querySelector('.qxframe9a7c2-selectgroup-label')));items[2].click();out.push({kind:'connected',appearance,nested,gap:getComputedStyle(parent).gap,seam:rects[1].left-rects[0].right,first:s[0].borderTopLeftRadius,middle:s[1].borderTopLeftRadius,last:s[2].borderTopRightRadius,checked:items.map(i=>i.querySelector('input').checked)});group.remove();}h.classList.toggle('dark',prior);host.remove();return out;})()");
    for(const x of result){
      if(x.kind==='media'){
        assert.deepEqual(x.display,['flex','flex'],'image must not override universal Surface display: '+JSON.stringify(x));
        assert.equal(x.padding[0],x.padding[1],'image and plain choice share Appearance padding: '+JSON.stringify(x));
        if(x.mode==='none'){assert.deepEqual(x.padding,['0px','0px']);assert.deepEqual(x.border,['0px','0px']);}
        if(x.mode==='outline'){assert.ok(parseFloat(x.padding[0])>0);assert.deepEqual(x.border,['1px','1px']);}
        assert.deepEqual(x.before,[true,false]);assert.deepEqual(x.after,[false,true],'native radio mutual exclusion through label click');
      }else{
        assert.equal(x.gap,'0px','connected root/wrapper must have no gap: '+JSON.stringify(x));
        assert.ok(Math.abs(x.seam)<1.5,'connected adjacent borders overlap: '+JSON.stringify(x));
        assert.equal(x.middle,'0px','connected middle corner flush');
        assert.notEqual(x.first,'0px','connected first keeps Theme radius');
        assert.notEqual(x.last,'0px','connected last keeps Theme radius');
        assert.deepEqual(x.checked,[false,false,true]);
      }
    }
    assert.equal(result.length,10);
  });

  await step('Focus saturation deep/light is opaque and the two halo modes use blurred 20-percent alpha',async()=>{
    const samples=await evaluate(`(() => {
      const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView;
      const conf=api.state.config,root=d.documentElement,wasDark=root.classList.contains('dark');
      const sheet=d.createElement('style'),sample=d.createElement('span');sample.style.cssText='position:absolute;left:-5000px;top:0';
      d.head.append(sheet);d.body.append(sample);
      const cases=[];
      try{
        for(const dark of [false,true])for(const intensity of ['light','normal','deep']){
          root.classList.toggle('dark',dark);
          const options={...conf,baseColor:'mist',theme:'blue',ext:{...conf.ext,pointerFocus:'ring',keyboardFocus:'ring',pointerFocusColor:'theme',keyboardFocusColor:'theme',pointerFocusSaturation:intensity,keyboardFocusSaturation:intensity}};
          sheet.textContent=api.compileTheme(options,{generatedAt:''}).body;
          const colors={};
          for(const name of ['pointer-focus','focus']){
            sample.style.color='var(--qxframe9a7c2-theme-'+name+')';
            colors[name]=w.getComputedStyle(sample).color;
          }
          cases.push({dark,intensity,colors,pointerShadow:w.getComputedStyle(root).getPropertyValue('--qxframe9a7c2-theme-pointer-shadow').trim(),keyboardShadow:w.getComputedStyle(root).getPropertyValue('--qxframe9a7c2-theme-focus-shadow').trim()});
        }
      }finally{root.classList.toggle('dark',wasDark);sheet.remove();sample.remove();}
      return cases;
    })()`);
    assert.equal(samples.length,6,'three opaque tonal options in both modes');
    for(const dark of [false,true]){
      const roles=samples.filter(x=>x.dark===dark);
      for(const name of ['focus','pointer-focus']){
        assert.notEqual(roles[0].colors[name],roles[1].colors[name],name+' lighter tonal option visibly changes the opaque color');
        assert.notEqual(roles[2].colors[name],roles[1].colors[name],name+' deeper tonal option changes chroma/lightness');
        for(const v of roles)assert.doesNotMatch(v.colors[name],/\/(?:\s*0\.|\s*0\)|\s*0%)/,name+' color may not be translucent');
      }
      for(const v of roles){
        assert.ok(v.pointerShadow.includes('0 0 0.25rem 0.125rem')&&v.pointerShadow.includes(' 20%,transparent)'), 'pointer halo uses blurred spread with 20% shadow ink');
        assert.ok(v.keyboardShadow.includes('0 0 0.25rem 0.125rem')&&v.keyboardShadow.includes(' 20%,transparent)'), 'keyboard halo uses same blurred spread');
      }
    }
  });

  await step('Seven independent Hover/Focus axes: compiled themes and Chromium Focus Background paint',async()=>{
    const r=await evaluate("(() => {\n const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument;\n const conf={...api.state.config,ext:{...api.state.config.ext,hoverStyle:'both',hoverColor:'theme',keyboardFocus:'ring',keyboardFocusColor:'theme',pointerFocus:'outline',pointerFocusColor:'black-white',focusBackground:'parent-surface'}};\n const style=d.createElement('style');style.textContent=api.compileTheme(conf,{generatedAt:''}).body;d.head.append(style);\n const input=d.createElement('input');input.type='text';input.className='qxframe9a7c2-form-input';input.style.transition='none';d.body.append(input);\n const h=getComputedStyle(d.documentElement),keys=['hover-border-strength','hover-background-strength','focus-background-strength','hover-color','focus','pointer-focus'];\n const values=Object.fromEntries(keys.map(k=>[k,h.getPropertyValue('--qxframe9a7c2-theme-'+k).trim()]));\n const idle=getComputedStyle(input).backgroundImage;input.focus();\n const focused=getComputedStyle(input).backgroundImage;\n const layer=getComputedStyle(input).getPropertyValue('--_qxframe9a7c2-focused-parent-layer').trim();\n input.remove();style.remove();return {values,idle,focused,layer};\n})()");
    assert.equal(r.values['hover-border-strength'],'30%');
    assert.equal(r.values['hover-background-strength'],'15%');
    assert.equal(r.values['focus-background-strength'],'100%');
    assert.notEqual(r.values.focus,r.values['pointer-focus'],'Keyboard and Pointer colors independent');
    assert.notEqual(r.idle,r.focused,'Focus parent-surface overlays native input');
    assert.ok(r.layer && r.layer!=='transparent','Focus layer must resolve actual paint');
  });

  await step('JS Input seven-axis pointer/keyboard real V2 border, ring, and Field valid status',async()=>{
    const r=await evaluate("(() => {\n const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n const cfg={...api.state.config,ext:{...api.state.config.ext,inputLook:'outline',pointerFocus:'ring',pointerFocusColor:'theme',keyboardFocus:'ring',keyboardFocusColor:'black-white'}};\n const sheet=d.createElement('style');sheet.textContent=api.compileTheme(cfg,{generatedAt:''}).body;d.head.append(sheet);\n const host=d.createElement('div');host.style.cssText='position:absolute;left:-8000px;top:0;width:400px';host.innerHTML='<div class=\\\"qxframe9a7c2-input\\\" data-js-normal><input class=\\\"qxframe9a7c2-input-control\\\" type=\\\"text\\\"></div><div class=\\\"qxframe9a7c2-field is-valid\\\"><div class=\\\"qxframe9a7c2-input\\\" data-js-valid><input class=\\\"qxframe9a7c2-input-control\\\" type=\\\"text\\\"></div><input class=\\\"qxframe9a7c2-form-input\\\" data-native-valid type=\\\"text\\\"><div class=\\\"qxframe9a7c2-selectgroup is-outline\\\"><label class=\\\"qxframe9a7c2-selectgroup-item\\\"><input class=\\\"qxframe9a7c2-selectgroup-input\\\" type=\\\"radio\\\" name=\\\"valid\\\"><span class=\\\"qxframe9a7c2-selectgroup-label\\\" data-group-valid>Valid choice</span></label></div></div>';d.body.append(host);host.querySelectorAll('*').forEach(el=>{el.style.transition='none';el.style.animation='none'});\n const previous=h.classList.contains('qxframe9a7c2-keyboard-focus-origin'),results=[];\n for(const dark of [false,true]){const wasDark=h.classList.contains('dark');h.classList.toggle('dark',dark);const exp=key=>{const s=d.createElement('span');s.style.color='var(--qxframe9a7c2-theme-'+key+')';host.append(s);const val=getComputedStyle(s).color;s.remove();return val};const colors={pointer:exp('pointer-focus'),keyboard:exp('focus'),success:exp('success')};for(const keyboard of [false,true]){for(const name of ['normal','valid']){const node=host.querySelector('[data-js-'+name+']');const input=node.querySelector('input');input.focus({preventScroll:true});h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',keyboard);node.classList.toggle('is-keyboard-focus',keyboard);const cs=getComputedStyle(node);results.push({dark,keyboard,name,color:cs.borderBottomColor,shadow:cs.boxShadow,role:cs.getPropertyValue('--_qxframe9a7c2-v2-control-border').trim(),expected:name==='valid'?colors.success:keyboard?colors.keyboard:colors.pointer});node.classList.remove('is-keyboard-focus');}const native=host.querySelector('[data-native-valid]');native.focus({preventScroll:true});h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',keyboard);results.push({dark,keyboard,name:'native',color:getComputedStyle(native).borderBottomColor,expected:colors.success});const radio=host.querySelector('.qxframe9a7c2-selectgroup-input');radio.focus({preventScroll:true});h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',keyboard);results.push({dark,keyboard,name:'group',color:getComputedStyle(host.querySelector('[data-group-valid]')).borderBottomColor,expected:colors.success});}h.classList.toggle('dark',wasDark);}h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',previous);host.remove();sheet.remove();return results;\n})()");
    assert.equal(r.length,16,'2 themes by 2 focus origins by 4 surface kinds');
    for(const row of r){
      assert.equal(row.color,row.expected,'real border focus paint '+JSON.stringify(row));
      if(row.name==='normal')assert.notEqual(row.shadow,'none','real JS focus ring '+JSON.stringify(row));
    }
  });

  await step('FieldSet/Legend/Error/Description + vertical Connected and feedback focus in real Chromium',async()=>{
    const rows=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n const wasDark=h.classList.contains('dark'),wasOrigin=h.classList.contains('qxframe9a7c2-keyboard-focus-origin');\n const host=d.createElement('form');host.style.cssText='position:absolute;top:0;left:-9999px;width:20rem';\n host.innerHTML='<fieldset class=\"qxframe9a7c2-field-set\"><legend class=\"qxframe9a7c2-field-legend\">Notification options</legend><div class=\"qxframe9a7c2-field is-warning\"><p class=\"qxframe9a7c2-field-description\">Neutral description</p><input class=\"qxframe9a7c2-form-input\" value=\"Hello\"><div class=\"qxframe9a7c2-selectgroup is-connected is-outline\"><div class=\"qxframe9a7c2-stack\"><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"radio\" name=\"mode\" value=\"one\" checked required><span class=\"qxframe9a7c2-selectgroup-label\">One</span></label><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"radio\" name=\"mode\" value=\"two\" required><span class=\"qxframe9a7c2-selectgroup-label\">Two</span></label><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"radio\" name=\"mode\" value=\"disabled\" disabled><span class=\"qxframe9a7c2-selectgroup-label\">Disabled</span></label></div></div><p class=\"qxframe9a7c2-field-error\">Warning feedback</p></div></fieldset>';\n d.body.append(host);const out=[];\n for(const dark of [false,true]){h.classList.toggle('dark',dark);for(const appearance of ['is-outline','is-muted']){\n const group=host.querySelector('.qxframe9a7c2-selectgroup');group.className='qxframe9a7c2-selectgroup is-connected '+appearance;\n const stack=group.querySelector('.qxframe9a7c2-stack'),items=Array.from(stack.children),rects=items.map(x=>x.getBoundingClientRect()),surfaces=items.map(x=>getComputedStyle(x.querySelector('.qxframe9a7c2-selectgroup-label')));\n const field=host.querySelector('.qxframe9a7c2-field'),expect=d.createElement('span');expect.style.color='var(--qxframe9a7c2-theme-warning)';field.append(expect);const expected=getComputedStyle(expect).color;expect.remove();\n const pixels=color=>{const canvas=d.createElement('canvas');canvas.width=1;canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data);};\n const input=field.querySelector('.qxframe9a7c2-form-input');input.style.transition='none';for(const item of items)item.querySelector('.qxframe9a7c2-selectgroup-label').style.transition='none';h.classList.remove('qxframe9a7c2-keyboard-focus-origin');input.focus({preventScroll:true});const pointerInput=getComputedStyle(input).borderTopColor;h.classList.add('qxframe9a7c2-keyboard-focus-origin');const keyboardInput=getComputedStyle(input).borderTopColor;\n const before=Array.from(new FormData(host).entries()).filter(x=>x[0]==='mode');items[1].click();const after=Array.from(new FormData(host).entries()).filter(x=>x[0]==='mode');host.reset();const reset=Array.from(new FormData(host).entries()).filter(x=>x[0]==='mode');\n out.push({dark,appearance,gap:getComputedStyle(stack).rowGap,seam:rects[1].top-rects[0].bottom,first:surfaces[0].borderTopLeftRadius,firstBottom:surfaces[0].borderBottomLeftRadius,middle:surfaces[1].borderTopLeftRadius,last:surfaces[2].borderBottomRightRadius,lastTop:surfaces[2].borderTopRightRadius,disabled:getComputedStyle(items[2]).cursor,description:getComputedStyle(field.querySelector('.qxframe9a7c2-field-description')).color,error:getComputedStyle(field.querySelector('.qxframe9a7c2-field-error')).color,expected,pointerInput,keyboardInput,expectedPixels:pixels(expected),pointerPixels:pixels(pointerInput),keyboardPixels:pixels(keyboardInput),before,after,reset});\n }}\n h.classList.toggle('dark',wasDark);h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',wasOrigin);host.remove();return out;\n})()");
    assert.equal(rows.length,4,'two modes by two appearances');
    for(const r of rows){
      assert.equal(r.gap,'0px','Stack owns zero connected gap');
      assert.ok(Math.abs(r.seam)<1.5,'vertical shared border seam: '+JSON.stringify(r));
      assert.notEqual(r.first,'0px','top Theme corners retained');
      assert.equal(r.firstBottom,'0px','first lower corners flush');
      assert.equal(r.middle,'0px','middle corners flush');
      assert.notEqual(r.last,'0px','last bottom corners Theme');
      assert.equal(r.lastTop,'0px','last top corners flush');
      assert.equal(r.disabled,'not-allowed','native disabled cursor');
      assert.equal(r.error,r.expected,'FieldError warning matches Theme');
      assert.notEqual(r.description,r.expected,'FieldDescription stays muted');
      // Chromium serializes an identical OKLab color as oklab(...) or oklch(...)
      // depending on whether its source went through color-mix(). Compare in
      // the same color space, without 8-bit Canvas rounding or a weakened gate.
      const toLab=value=>{
        const m=/^(oklab|oklch)\(\s*([\d.+-]+)\s+([\d.+-]+)\s+([\d.+-]+)\s*\)$/.exec(value);
        assert.ok(m,'browser color must be OKLab/OKLCH: '+value);
        const l=Number(m[2]),a=Number(m[3]),b=Number(m[4]);
        return m[1]==='oklab'?[l,a,b]:[l,a*Math.cos(b*Math.PI/180),a*Math.sin(b*Math.PI/180)];
      };
      const expectedLab=toLab(r.expected);
      for(const [name,value] of [['pointer',r.pointerInput],['keyboard',r.keyboardInput]]){
        const received=toLab(value);
        assert.ok(received.every((channel,i)=>Math.abs(channel-expectedLab[i])<0.00001),
          name+' Focus must preserve exact warning paint: '+JSON.stringify({received,expectedLab,mode:r.dark,appearance:r.appearance}));
      }
      assert.deepEqual(r.before,[['mode','one']]);
      assert.deepEqual(r.after,[['mode','two']]);
      assert.deepEqual(r.reset,[['mode','one']]);
    }
  });

  await step('Seven-axis Hover paints actually change selectable Surface in Chromium',async()=>{
    const initial=await evaluate("(() => {\n const frame=document.querySelector('[data-create-frame]'),d=frame.contentDocument;\n const config={...window.QXFRAME9A7C2_CREATE.state.config,ext:{...window.QXFRAME9A7C2_CREATE.state.config.ext,\n  hoverStyle:'both',hoverColor:'theme',pointerFocus:'outline',pointerFocusColor:'theme',keyboardFocus:'border',keyboardFocusColor:'black-white',focusBackground:'parent-surface'}};\n const sheet=d.createElement('style');sheet.textContent=window.QXFRAME9A7C2_CREATE.compileTheme(config,{generatedAt:''}).body+'[data-seven-axis-qa] *{transition:none!important;animation:none!important}';d.head.append(sheet);\n const host=d.createElement('div');host.dataset.sevenAxisQa='';host.style.cssText='position:fixed;left:1rem;top:1rem;z-index:2147483000;width:20rem;padding:1rem;background:var(--qxframe9a7c2-theme-background)';\n host.innerHTML='<div class=\"qxframe9a7c2-selectgroup is-outline\"><div class=\"qxframe9a7c2-flex is-gap-2\"><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"checkbox\"><span class=\"qxframe9a7c2-selectgroup-label\" data-qa-active>Hover target</span></label><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"checkbox\" checked><span class=\"qxframe9a7c2-selectgroup-label\" data-qa-checked>Checked</span></label><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"checkbox\" disabled><span class=\"qxframe9a7c2-selectgroup-label\" data-qa-disabled>Disabled</span></label></div></div><input type=\"text\" class=\"qxframe9a7c2-form-input\" data-qa-native value=\"Native input\">';\n d.body.append(host);window.__qxSevenAxisFixture={host,sheet};\n const css=getComputedStyle(d.documentElement);\n return {strengthBorder:css.getPropertyValue('--qxframe9a7c2-theme-hover-border-strength').trim(),strengthBg:css.getPropertyValue('--qxframe9a7c2-theme-hover-background-strength').trim(),pointer:css.getPropertyValue('--qxframe9a7c2-theme-pointer-focus').trim(),keyboard:css.getPropertyValue('--qxframe9a7c2-theme-focus').trim()};\n})()");
    assert.equal(initial.strengthBorder,'30%');
    assert.equal(initial.strengthBg,'15%');
    assert.notEqual(initial.pointer,initial.keyboard,'pointer and keyboard colors are independent');
    await mouse('mouseMoved',2,2);
    const idle=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument;const el=d.querySelector('[data-qa-active]'),disabled=d.querySelector('[data-qa-disabled]'),checked=d.querySelector('[data-qa-checked]'),native=d.querySelector('[data-qa-native]');const c=x=>getComputedStyle(x);return {border:c(el).borderTopColor,bg:c(el).backgroundColor,disabledBorder:c(disabled).borderTopColor,disabledBg:c(disabled).backgroundColor,checkedBorder:c(checked).borderTopColor,nativeBorder:c(native).borderTopColor};})()");
    const pos=await evaluate("(() => {const f=document.querySelector('[data-create-frame]'),el=f.contentDocument.querySelector('[data-qa-active]'),o=f.getBoundingClientRect(),r=el.getBoundingClientRect();return {x:o.left+r.left+r.width/2,y:o.top+r.top+r.height/2};})()");
    assert.ok(pos.x>0&&pos.x<1440&&pos.y>0&&pos.y<900,'test fixture appears in real Chromium viewport: '+JSON.stringify(pos));
    await mouse('mouseMoved',pos.x,pos.y);
    const hovered=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument;const el=d.querySelector('[data-qa-active]'),disabled=d.querySelector('[data-qa-disabled]'),checked=d.querySelector('[data-qa-checked]'),native=d.querySelector('[data-qa-native]');const c=x=>getComputedStyle(x);return {border:c(el).borderTopColor,bg:c(el).backgroundColor,disabledBorder:c(disabled).borderTopColor,disabledBg:c(disabled).backgroundColor,checkedBorder:c(checked).borderTopColor,nativeBorder:c(native).borderTopColor};})()");
    assert.notEqual(hovered.border,idle.border,'Theme Hover border paints on unselected SelectGroup');
    assert.notEqual(hovered.bg,idle.bg,'Theme Hover background paints on unselected SelectGroup');
    assert.equal(hovered.disabledBg,idle.disabledBg,'disabled item never inherits sibling Hover');
    assert.equal(hovered.checkedBorder,idle.checkedBorder,'selected item border retained');
    await evaluate("(() => {const fixture=window.__qxSevenAxisFixture;fixture?.host.remove();fixture?.sheet.remove();delete window.__qxSevenAxisFixture;return true;})()");
    await mouse('mouseMoved',2,2);
  });

  await step('Seven-axis Hover paints real native and JS Input V2 surface; Field warning wins',async()=>{
    const built=await evaluate("(() => {\n const api=window.QXFRAME9A7C2_CREATE;\n const frame=document.querySelector('[data-create-frame]'),d=frame.contentDocument;\n const config={...api.state.config,ext:{...api.state.config.ext,hoverStyle:'both',hoverColor:'theme'}};\n const css=d.createElement('style');\n css.textContent=api.compileTheme(config,{generatedAt:''}).body+'[data-qa-v2-hover] *{transition:none!important;animation:none!important}';\n d.head.append(css);\n const host=d.createElement('div');host.dataset.qaV2Hover='';\n host.style.cssText='position:fixed;left:16px;top:16px;z-index:2147483001;display:flex;flex-direction:column;gap:12px;padding:12px;width:380px;background:var(--qxframe9a7c2-theme-background)';\n host.innerHTML='<input class=\"qxframe9a7c2-form-input\" data-v2-native type=\"text\" value=\"Native Hover\"><div class=\"qxframe9a7c2-input\" data-v2-js><input class=\"qxframe9a7c2-input-control\" type=\"text\" value=\"JS Hover\"></div><div class=\"qxframe9a7c2-field is-warning\"><input class=\"qxframe9a7c2-form-input\" data-v2-warning type=\"text\" value=\"Warning Hover\"></div><input class=\"qxframe9a7c2-form-input\" data-v2-disabled disabled value=\"Disabled Hover\">';\n d.body.append(host);window.__qxV2Hover={host,css};\n return {native:!!host.querySelector('[data-v2-native]'),js:!!host.querySelector('[data-v2-js]')};\n})()");
    assert.ok(built.native&&built.js,'native/JS fixture mounted');
    await mouse('mouseMoved',2,2);
    const idle=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument;\n const names=['native','js','warning','disabled'],out={};\n for(const name of names){const node=d.querySelector('[data-v2-'+name+']'),c=getComputedStyle(node);\n  out[name]={border:c.borderBottomColor,bg:c.backgroundColor,role:c.getPropertyValue('--_qxframe9a7c2-v2-control-border').trim()};\n }\n return out;\n})()");
    for(const target of ['native','js','warning']){
      const expr="(() => {const f=document.querySelector('[data-create-frame]'),d=f.contentDocument,el=d.querySelector('[data-v2-'+\"TARGET\"+']'),o=f.getBoundingClientRect(),r=el.getBoundingClientRect();return{x:o.left+r.left+r.width/2,y:o.top+r.top+r.height/2};})()".replace('TARGET',target);
      const pos=await evaluate(expr);
      assert.ok(pos.x>0&&pos.x<1440&&pos.y>0&&pos.y<900,'hover point inside viewport '+JSON.stringify(pos));
      await mouse('mouseMoved',pos.x,pos.y);
      const active=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument;\n const names=['native','js','warning','disabled'],out={};\n for(const name of names){const node=d.querySelector('[data-v2-'+name+']'),c=getComputedStyle(node);\n  out[name]={border:c.borderBottomColor,bg:c.backgroundColor,role:c.getPropertyValue('--_qxframe9a7c2-v2-control-border').trim()};\n }\n return out;\n})()");
      if(target!=='warning'){
        assert.notEqual(active[target].border,idle[target].border,target+' V2 border must visibly change on Theme Hover');
        assert.notEqual(active[target].bg,idle[target].bg,target+' V2 background must visibly change on Theme Hover');
      }else{
        assert.equal(active.warning.border,idle.warning.border,'Field warning border must dominate Theme Hover');
      }
      assert.equal(active.disabled.border,idle.disabled.border,'disabled native border unaffected');
      await mouse('mouseMoved',2,2);
    }
    await evaluate("(() => {window.__qxV2Hover.host.remove();window.__qxV2Hover.css.remove();delete window.__qxV2Hover;return true;})()");
  });

  await step('Normal Control Shadow parity and genuine 2px/-1px Pointer Outline',async()=>{
    const result=await evaluate("(() => {\n"+
      "const d=document.querySelector('[data-create-frame]').contentDocument,api=window.QXFRAME9A7C2_CREATE,h=d.documentElement;\n"+
      "const host=d.createElement('div'),sheet=d.createElement('style'),wasKeyboard=h.classList.contains('qxframe9a7c2-keyboard-focus-origin');\n"+
      "host.style.cssText='position:fixed;left:12px;top:12px;z-index:2147483000;display:flex;flex-direction:column;gap:4px;padding:12px;pointer-events:auto';\n"+
      "host.innerHTML='<button class=\"qxframe9a7c2-button is-outline\" data-shadow-button>Button</button><input class=\"qxframe9a7c2-form-input\" data-shadow-input value=\"Input\"><select class=\"qxframe9a7c2-form-select\" data-shadow-select><option>Select</option></select><div class=\"qxframe9a7c2-input\" data-shadow-js><input class=\"qxframe9a7c2-input-control\" value=\"JS Input\"></div><div class=\"qxframe9a7c2-input-group-field\" data-shadow-group><input class=\"qxframe9a7c2-form-input\" value=\"Grouped Input\"></div><div class=\"qxframe9a7c2-selectgroup is-outline\"><label class=\"qxframe9a7c2-selectgroup-item\"><input type=\"radio\" class=\"qxframe9a7c2-selectgroup-input\"><span data-shadow-choice class=\"qxframe9a7c2-selectgroup-label\">SelectGroup</span></label></div>';\n"+
      "d.head.append(sheet);d.body.append(host);h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n"+
      "const names=['button','input','select','js','group','choice'],read=()=>Object.fromEntries(names.map(n=>[n,getComputedStyle(host.querySelector('[data-shadow-'+n+']')).boxShadow]));\n"+
      "const orig={...api.state.config},ext={...orig.ext};let out={};\n"+
      "for(const shadow of ['off','on']){\n"+
      "sheet.textContent=api.compileTheme({...orig,ext:{...ext,controlShadow:shadow,pointerFocus:'border'}},{generatedAt:''}).body+'[data-shadow-js],[data-shadow-button],[data-shadow-choice]{transition:none!important}';\n"+
      "out[shadow==='on'?'light':'none']=read();\n"+
      "}\n"+
      "sheet.textContent=api.compileTheme({...orig,ext:{...ext,controlShadow:'on',pointerFocus:'outline'}},{generatedAt:''}).body+'[data-shadow-js],[data-shadow-button]{transition:none!important}';\n"+
      "host.querySelector('[data-shadow-button]').focus();h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n"+
      "const getOutline=n=>{const c=getComputedStyle(host.querySelector('[data-shadow-'+n+']'));return {width:c.outlineWidth,offset:c.outlineOffset,style:c.outlineStyle,shadow:c.boxShadow};};\n"+
      "out.buttonFocus=getOutline('button');\n"+
      "host.querySelector('[data-shadow-js] input').focus();h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n"+
      "out.jsFocus=getOutline('js');\n"+
      "h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',wasKeyboard);sheet.remove();host.remove();return out;\n"+
      "})()");
    const names=['button','input','select','js','group','choice'];
    const baseline=result.light.button;
    assert.ok(baseline!=='none'&&!baseline.includes('rgba(0, 0, 0, 0) 0px 0px 0px 0px'),'ordinary Theme light elevation paints on Button '+JSON.stringify(result));
    for(const name of names){
      assert.ok(result.light[name].includes(baseline),'Theme normal shadow must appear on '+name+' exactly as on Button: '+JSON.stringify(result));
      assert.ok(!/0\.05\)|0\.1\)|0\.2\)/.test(result.none[name]),'Shadow none must hide ordinary elevation for '+name+': '+JSON.stringify(result.none));
    }
    for(const name of ['buttonFocus','jsFocus']){
      assert.equal(result[name].width,'2px',name+' CSS outline is genuine 2px, not box-shadow');
      assert.equal(result[name].offset,'-1px',name+' CSS outline has -1px offset');
      assert.equal(result[name].style,'solid',name+' CSS outline visible');
      assert.ok(result[name].shadow!=='none'&&result[name].shadow!==result.none[name],name+' normal elevation persists while focus Outline is active even during CSS shadow transition');
    }
  });


  await step('Normal Shadow and real native Textarea/bare control Focus matrix: 8 styles x light/dark',async()=>{
    const rows=await evaluate("(() => {\n"+
      "const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n"+
      "const wasDark=h.classList.contains('dark'),wasKeyboard=h.classList.contains('qxframe9a7c2-keyboard-focus-origin'),orig=api.state.config;\n"+
      "const host=d.createElement('div'),sheet=d.createElement('style');host.style.cssText='position:absolute;left:-9000px;top:0;width:380px';\n"+
      "host.innerHTML='<button class=\\\"qxframe9a7c2-button is-outline\\\" data-control=\\\"button\\\">Button</button><input data-control=\\\"bare-input\\\" value=\\\"Bare\\\"><textarea data-control=\\\"bare-textarea\\\">Bare textarea</textarea><select data-control=\\\"bare-select\\\"><option>Native</option></select><input class=\\\"qxframe9a7c2-form-input\\\" data-control=\\\"input\\\" value=\\\"Form\\\"><textarea class=\\\"qxframe9a7c2-form-textarea\\\" data-control=\\\"textarea\\\">Form textarea</textarea><select class=\\\"qxframe9a7c2-form-select\\\" data-control=\\\"select\\\"><option>Select</option></select><div class=\\\"qxframe9a7c2-native-form\\\"><textarea data-control=\\\"native-form-textarea\\\">Native form</textarea></div>';\n"+
      "d.head.append(sheet);d.body.append(host);h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n"+
      "const names=['button','bare-input','bare-textarea','bare-select','input','textarea','select','native-form-textarea'],out=[];\n"+
      "for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){\n"+
      " h.classList.toggle('dark',dark);const c={...orig,style,ext:{...orig.ext,shadow:'none',controlShadow:'on',pointerFocus:'outline',keyboardFocus:'outline'}};\n"+
      " sheet.textContent=api.compileTheme(c,{generatedAt:''}).body+'[data-control]{transition:none!important;animation:none!important}';\n"+
      " const on=Object.fromEntries(names.map(name=>[name,getComputedStyle(host.querySelector('[data-control=\\\"'+name+'\\\"]')).boxShadow]));\n"+
      " const target=host.querySelector('[data-control=\\\"bare-textarea\\\"]');target.focus({preventScroll:true});h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n"+
      " const cs=getComputedStyle(target),pointer={width:cs.outlineWidth,offset:cs.outlineOffset,style:cs.outlineStyle,shadow:cs.boxShadow};\n"+
      " h.classList.add('qxframe9a7c2-keyboard-focus-origin');const ck=getComputedStyle(target),keyboard={width:ck.outlineWidth,offset:ck.outlineOffset,style:ck.outlineStyle,shadow:ck.boxShadow};\n"+
      " h.classList.remove('qxframe9a7c2-keyboard-focus-origin');target.blur();\n"+
      " sheet.textContent=api.compileTheme({...c,ext:{...c.ext,shadow:'heavy',controlShadow:'off'}},{generatedAt:''}).body+'[data-control]{transition:none!important;animation:none!important}';\n"+
      " const off=Object.fromEntries(names.map(name=>[name,getComputedStyle(host.querySelector('[data-control=\\\"'+name+'\\\"]')).boxShadow]));\n"+
      " out.push({style,dark,on,off,pointer,keyboard});\n"+
      "}h.classList.toggle('dark',wasDark);h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',wasKeyboard);host.remove();sheet.remove();return out;\n"+
      "})()");
    assert.equal(rows.length,16);
    for(const r of rows){
      const baseline=r.on.button;
      assert.notEqual(baseline,'none',r.style+' normal Button shadow');
      for(const name of Object.keys(r.on)){
        assert.ok(r.on[name].includes(baseline),r.style+'/'+r.dark+' normal Shadow matches Button for '+name+': '+JSON.stringify(r));
        assert.ok(!r.off[name].includes(baseline),r.style+'/'+r.dark+' Control=off removes elevation even with Card=heavy on '+name+': '+JSON.stringify(r));
      }
      for(const origin of ['pointer','keyboard']){
        const focus=r[origin];
        assert.equal(focus.style,'solid',r.style+'/'+r.dark+' '+origin+' bare Textarea must paint CSS outline');
        assert.equal(focus.width,'2px',r.style+'/'+r.dark+' '+origin+' CSS outline width');
        assert.equal(focus.offset,'-1px',r.style+'/'+r.dark+' '+origin+' CSS outline offset');
        assert.ok(focus.shadow.includes(baseline),r.style+'/'+r.dark+' '+origin+' keeps ordinary Shadow');
      }
    }
  });

  await step('Control Shadow and surface Shadow independent in Chromium: 8 Styles x light/dark x 4 combinations',async()=>{
    const rows=await evaluate("(() => {\n  const d=document.querySelector('[data-create-frame]').contentDocument,api=window.QXFRAME9A7C2_CREATE,h=d.documentElement;\n  const cfg=api.state.config,wasDark=h.classList.contains('dark'),sheet=d.createElement('style'),host=d.createElement('div');\n  host.style.cssText='position:absolute;left:-9000px;top:0';\n  host.innerHTML='<div class=\"qxframe9a7c2-card\" data-axis-card>Card</div><button class=\"qxframe9a7c2-button is-outline\" data-axis-button>Button</button><input class=\"qxframe9a7c2-form-input\" data-axis-input value=\"Input\"><div class=\"qxframe9a7c2-selectgroup is-outline\"><label class=\"qxframe9a7c2-selectgroup-item\"><input class=\"qxframe9a7c2-selectgroup-input\" type=\"radio\"><span class=\"qxframe9a7c2-selectgroup-label\" data-axis-choice>Choice</span></label></div>';\n  d.head.append(sheet);d.body.append(host);const rows=[];\n  for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){\n    h.classList.toggle('dark',dark);\n    for(const surface of ['none','heavy'])for(const control of ['off','on']){\n      const config={...cfg,style,ext:{...cfg.ext,shadow:surface,controlShadow:control}};\n      sheet.textContent=api.compileTheme(config,{generatedAt:''}).body+'[data-axis-card],[data-axis-button],[data-axis-input],[data-axis-choice]{transition:none!important;animation:none!important}';\n      const get=sel=>getComputedStyle(host.querySelector(sel)).boxShadow;\n      rows.push({style,dark,surface,control,card:get('[data-axis-card]'),button:get('[data-axis-button]'),input:get('[data-axis-input]'),choice:get('[data-axis-choice]'),\n        controlToken:getComputedStyle(h).getPropertyValue('--qxframe9a7c2-theme-shadow-control').trim(),cardToken:getComputedStyle(h).getPropertyValue('--qxframe9a7c2-theme-shadow-card').trim()});\n    }\n  }\n  h.classList.toggle('dark',wasDark);host.remove();sheet.remove();return rows;\n})()");
    assert.equal(rows.length,64,'8 styles × 2 modes × 4 independent ON/OFF combinations');
    for(const r of rows){
      const label=r.style+'/'+(r.dark?'dark':'light')+'/'+r.surface+'/'+r.control;
      if(r.control==='off')assert.ok(r.controlToken.includes('transparent'),label+' disabled Control shadow');
      else assert.ok(r.controlToken.includes('0.0625rem'),label+' enabled Control shadow');
      if(r.surface==='none')assert.equal(r.card,'none',label+' Card must not inherit Control elevation');
      else assert.notEqual(r.card,'none',label+' Card independently draws Surface shadow');
      if(r.control==='on')for(const control of ['button','input','choice'])
        assert.ok(r[control]!=='none',label+' '+control+' must paint ordinary elevation');
    }
    for(let i=0;i<rows.length;i+=4){
      const sample=rows.slice(i,i+4),at=(surface,control)=>sample.find(x=>x.surface===surface&&x.control===control);
      for(const control of ['on','off']){
        const a=at('none',control),b=at('heavy',control);
        for(const key of ['button','input','choice','controlToken'])
          assert.equal(a[key],b[key],a.style+'/'+a.dark+' surface strength must not alter '+key);
      }
      for(const surface of ['none','heavy']){
        const a=at(surface,'off'),b=at(surface,'on');
        assert.equal(a.card,b.card,a.style+'/'+a.dark+' Control toggle must not alter Card');
        assert.equal(a.cardToken,b.cardToken,a.style+'/'+a.dark+' Control toggle must not alter Card token');
      }
    }
  });

  await step('Inverted Select ItemCollection idle/selected/hover/disabled colors: 8 Styles x light/dark x 4 menu modes',async()=>{
    const rows=await evaluate("(() => {\nconst d=document.querySelector('[data-create-frame]').contentDocument,api=window.QXFRAME9A7C2_CREATE,h=d.documentElement,initialDark=h.classList.contains('dark'),orig=api.state.config;\nconst sheet=d.createElement('style'),host=d.createElement('section');host.style.cssText='position:absolute;left:-10000px;top:0;width:320px';\nhost.innerHTML='<div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-select-panel\" style=\"position:relative\"><div class=\"qxframe9a7c2-select-option-host\"><div class=\"qxframe9a7c2-item-collection\"><div class=\"qxframe9a7c2-item-collection-body\"><div class=\"qxframe9a7c2-item-collection-item qxframe9a7c2-item-surface\" data-menu-state=\"idle\">EUR — Euro</div><div class=\"qxframe9a7c2-item-collection-item qxframe9a7c2-item-surface is-selected\" data-menu-state=\"selected\">USD — United States Dollar</div><div class=\"qxframe9a7c2-item-collection-item qxframe9a7c2-item-surface is-hover\" data-menu-state=\"hover\">GBP — British Pound</div><div class=\"qxframe9a7c2-item-collection-item qxframe9a7c2-item-surface is-disabled\" data-menu-state=\"disabled\">JPY — Japanese Yen</div></div></div></div><i data-probe-menu style=\"color:var(--qxframe9a7c2-theme-menu-foreground)\"></i><i data-probe-accent style=\"color:var(--qxframe9a7c2-theme-menu-accent-foreground);background:var(--qxframe9a7c2-theme-menu-accent)\"></i><i data-probe-soft style=\"background:var(--_qxframe9a7c2-menu-hover-soft)\"></i><i class=\"qxframe9a7c2-popup-surface\" data-probe-selected-soft style=\"background:var(--_qxframe9a7c2-menu-selected-soft)\"></i>';\nd.head.append(sheet);d.body.append(host);const css=sel=>getComputedStyle(host.querySelector(sel)),rows=[];\nfor(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true])for(const menuColor of ['default','default-translucent','inverted','inverted-translucent']){\nh.classList.toggle('dark',dark);sheet.textContent=api.compileTheme({...orig,style,menuColor},{generatedAt:''}).body;\nconst probe=css('[data-probe-menu]'),accent=css('[data-probe-accent]');\nrows.push({style,dark,menuColor,expected:probe.color,collection:css('.qxframe9a7c2-item-collection').color,\nidle:css('[data-menu-state=idle]').color,selected:css('[data-menu-state=selected]').color,hover:css('[data-menu-state=hover]').color,disabled:css('[data-menu-state=disabled]').color,accentFg:accent.color,\nselectedBg:css('[data-menu-state=selected]').backgroundColor,hoverBg:css('[data-menu-state=hover]').backgroundColor,softBg:css('[data-probe-soft]').backgroundColor,selectedSoftBg:css('[data-probe-selected-soft]').backgroundColor,accentBg:accent.backgroundColor});\n}\nh.classList.toggle('dark',initialDark);sheet.remove();host.remove();return rows;\n})()");
    assert.equal(rows.length,64,'8 Styles x 2 modes x 4 menu colors');
    for(const r of rows){
      const msg=r.style+'/'+r.dark+'/'+r.menuColor;
      assert.equal(r.collection,r.expected,msg+' collection foreground');
      assert.equal(r.idle,r.expected,msg+' idle dropdown foreground');
      assert.equal(r.disabled,r.expected,msg+' disabled dropdown foreground before opacity');
      assert.equal(r.selected,r.accentFg,msg+' selected foreground accent');
      assert.equal(r.hover,r.expected,msg+' hover retains readable Menu foreground, not selected accent');
      assert.equal(r.selectedBg,r.selectedSoftBg,msg+' selected background uses alpha Menu accent overlay');
      assert.equal(r.hoverBg,r.softBg,msg+' hover uses shared neutral Menu mix, not selected accent');
    }
  });

  await step('SelectGroup nine floating anchors and one Surface focus owner', async()=>{
    const result=await evaluate("(() => {\n      const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n      const origin=h.classList.contains('qxframe9a7c2-keyboard-focus-origin');\n      const host=d.createElement('div');\n      host.style.cssText='position:absolute;left:100px;top:100px;width:570px;z-index:1;background:var(--qxframe9a7c2-theme-background)';\n      const group=d.createElement('div');group.className='qxframe9a7c2-selectgroup is-outline';\n      const anchors=['top-left','top-center','top-right','middle-left','middle-center','middle-right','bottom-left','bottom-center','bottom-right'];\n      for(const anchor of anchors){\n        const row=d.createElement('label');row.className='qxframe9a7c2-selectgroup-item';\n        row.style.cssText='width:9rem;height:6rem';\n        row.innerHTML='<input type=\"checkbox\" class=\"qxframe9a7c2-selectgroup-input\"><span class=\"qxframe9a7c2-selectgroup-label\" style=\"width:100%;height:100%\"><span class=\"qxframe9a7c2-selectgroup-indicator is-checkbox is-floating is-'+anchor+'\"></span><span class=\"qxframe9a7c2-flex is-center\">'+anchor+'</span></span>';\n        group.append(row);\n      }\n      host.append(group);d.body.append(host);\n      const entries=[];\n      for(const [index,anchor] of anchors.entries()){\n        const row=group.children[index],surface=row.querySelector('.qxframe9a7c2-selectgroup-label'),indicator=row.querySelector('.qxframe9a7c2-selectgroup-indicator');\n        const b=surface.getBoundingClientRect(),r=indicator.getBoundingClientRect();\n        const x=(r.left+r.right-2*b.left)/(2*b.width),y=(r.top+r.bottom-2*b.top)/(2*b.height);\n        entries.push({anchor,x,y,position:getComputedStyle(indicator).position});\n      }\n      const input=group.children[0].querySelector('input'),surface=group.children[0].querySelector('.qxframe9a7c2-selectgroup-label'),indicator=group.children[0].querySelector('.qxframe9a7c2-selectgroup-indicator');\n      // Measure the settled focus paint synchronously; production keeps the box-shadow transition.\n      surface.style.transition='none';\n      const oldShadow=h.style.getPropertyValue('--qxframe9a7c2-theme-pointer-shadow'),oldWidth=h.style.getPropertyValue('--qxframe9a7c2-theme-pointer-width');\n      const oldKShadow=h.style.getPropertyValue('--qxframe9a7c2-theme-focus-shadow');\n      h.style.setProperty('--qxframe9a7c2-theme-pointer-shadow','0 0 0 3px rgb(255, 0, 0)');\n      h.style.setProperty('--qxframe9a7c2-theme-pointer-width','0');\n      h.style.setProperty('--qxframe9a7c2-theme-focus-shadow','0 0 0 3px rgb(0, 180, 0)');\n      input.focus();\n      h.classList.add('qxframe9a7c2-keyboard-focus-origin');\n      const keyboard={surfaceOutline:getComputedStyle(surface).outlineWidth,surfaceShadow:getComputedStyle(surface).boxShadow,indicatorOutline:getComputedStyle(indicator).outlineStyle,actualFocus:d.activeElement===input,inputFocus:input.matches(':focus'),inputFocusVisible:input.matches(':focus-visible'),origin:h.classList.contains('qxframe9a7c2-keyboard-focus-origin'),customRing:getComputedStyle(surface).getPropertyValue('--_qxframe9a7c2-choice-focus-shadow'),themeShadow:getComputedStyle(surface).getPropertyValue('--qxframe9a7c2-theme-focus-shadow'),styleCount:d.styleSheets.length};\n      h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n      const pointer={surfaceShadow:getComputedStyle(surface).boxShadow,surfaceOutline:getComputedStyle(surface).outlineWidth,indicatorOutline:getComputedStyle(indicator).outlineStyle,actualFocus:d.activeElement===input,inputFocus:input.matches(':focus'),origin:h.classList.contains('qxframe9a7c2-keyboard-focus-origin'),customRing:getComputedStyle(surface).getPropertyValue('--_qxframe9a7c2-choice-focus-shadow'),themeShadow:getComputedStyle(surface).getPropertyValue('--qxframe9a7c2-theme-pointer-shadow')};\n      input.checked=true;\n      const checked=getComputedStyle(indicator).backgroundColor;\n      for(const [k,v] of [['--qxframe9a7c2-theme-pointer-shadow',oldShadow],['--qxframe9a7c2-theme-pointer-width',oldWidth],['--qxframe9a7c2-theme-focus-shadow',oldKShadow]]){\n        if(v)h.style.setProperty(k,v);else h.style.removeProperty(k);\n      }\n      h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',origin);\n      host.remove();\n      return {entries,keyboard,pointer,checked};\n    })()"); 
    assert.equal(result.entries.length,9);
    for(const e of result.entries){
      const [v,h]=e.anchor.split('-');
      const refX={left:0,center:.5,right:1}[h],refY={top:0,middle:.5,bottom:1}[v];
      assert.ok(Math.abs(e.x-refX)<.2 && Math.abs(e.y-refY)<.2,e.anchor+' indicator anchored in correct quadrant '+JSON.stringify(e));
      assert.equal(e.position,'absolute',e.anchor+' uses floating projection');
    }
    assert.equal(result.keyboard.indicatorOutline,'none','no double keyboard outline on indicator');
    assert.ok(result.keyboard.surfaceShadow.includes('0, 180, 0'),'keyboard Theme shadow paints on Surface: '+JSON.stringify(result.keyboard));
    assert.equal(result.pointer.indicatorOutline,'none','pointer projection never draws a nested outline');
    assert.ok(result.pointer.surfaceShadow.includes('255, 0, 0'),'pointer Theme ring paints on Surface: '+JSON.stringify(result.pointer));
    assert.ok(result.checked !== 'rgba(0, 0, 0, 0)','native checked state still paints indicator');
  });

  await step('Owner feedback: group focus, Tabs scroll and native Select paint',async()=>{
    await click('document.querySelector(\'[data-create-item="01"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=savings-targets] .qxframe9a7c2-input-group")','shared InputGroup');
    const r=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument,group=d.querySelector('[data-card=savings-targets] .qxframe9a7c2-input-group'),input=group?.querySelector('.qxframe9a7c2-form-input'),addon=group?.querySelector('.qxframe9a7c2-input-group-addon'),tabs=d.querySelector('[data-card=faq] .qxframe9a7c2-tabs-scroll'),tab=tabs?.querySelector('.qxframe9a7c2-tabs-tab'),select=d.querySelector('[data-card=savings-targets] select.qxframe9a7c2-form-select');if(!input||!addon||!tabs||!tab||!select)return {error:'missing roles'};input.focus();const outer=getComputedStyle(group),inner=getComputedStyle(input),g=group.getBoundingClientRect(),v=tabs.querySelector('.qxframe9a7c2-scroll-viewport').getBoundingClientRect(),t=tab.getBoundingClientRect(),s=getComputedStyle(select);return {outerOutline:outer.outlineStyle,innerOutline:inner.outlineStyle,addonRight:parseFloat(getComputedStyle(addon).paddingRight),inputLeft:parseFloat(inner.paddingLeft),fieldWidth:g.width,tabHeight:t.height,viewportHeight:v.height,arrow:s.backgroundImage,appearance:s.appearance,pickerAppearance:getComputedStyle(select,'::picker(select)').appearance,pickerIcon:getComputedStyle(select,'::picker-icon').display};})()");
    assert.ok(!r.error,JSON.stringify(r));
    assert.equal(r.outerOutline,'solid','entire grouped field owns keyboard outline');
    assert.equal(r.innerOutline,'none','inner field cannot draw duplicate outline');
    assert.ok(Math.abs(r.addonRight-r.inputLeft)<.6,'both sides of internal seam share half padding: '+JSON.stringify(r));
    assert.ok(r.viewportHeight+.5>=r.tabHeight,'Tabs horizontal viewport cannot clip TabItem: '+JSON.stringify(r));
    assert.equal(r.appearance,'base-select','modern native Select opts into customizable picker');
    assert.equal(r.pickerAppearance,'base-select','native dropdown is the browser top-layer customizable picker');
    assert.equal(r.pickerIcon,'none','native Select has only the framework CSS chevron, no duplicate picker icon');
    assert.ok(r.arrow.includes('linear-gradient(45deg')&&r.arrow.includes('linear-gradient(135deg')&&!r.arrow.includes('url('),'native Select uses two theme-aware gradient strokes, not a fixed SVG URL');
  });

  await step('Owner follow-up: pointer focus tokens, 4px segmented Tabs viewport and scheme-aware chevron',async()=>{
    const r=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,group=d.querySelector('[data-card=savings-targets] .qxframe9a7c2-input-group'),input=group.querySelector('.qxframe9a7c2-form-input'),tabs=d.querySelector('[data-card=faq] .qxframe9a7c2-tabs'),scroll=tabs.querySelector('.qxframe9a7c2-tabs-scroll'),viewport=scroll.querySelector('.qxframe9a7c2-scroll-viewport'),item=tabs.querySelector('.qxframe9a7c2-tabs-tab');h.classList.remove('qxframe9a7c2-keyboard-focus-origin');h.style.setProperty('--qxframe9a7c2-theme-pointer-width','3px');h.style.setProperty('--qxframe9a7c2-theme-pointer-offset','2px');h.style.setProperty('--qxframe9a7c2-theme-pointer-opacity','100%');input.focus();let pointer=getComputedStyle(group),w=getComputedStyle(viewport),g=viewport.getBoundingClientRect(),t=item.getBoundingClientRect(),sr=scroll.getBoundingClientRect(),card=d.querySelector('[data-card=faq]').getBoundingClientRect();let out={pointerWidth:pointer.outlineWidth,pointerOffset:pointer.outlineOffset,paddingTop:parseFloat(w.paddingTop),paddingBottom:parseFloat(w.paddingBottom),withinTop:t.top>=g.top+parseFloat(w.paddingTop)-.6,withinBottom:t.bottom<=g.bottom-parseFloat(w.paddingBottom)+.6,tabHeight:t.height,railHeight:sr.height,cardHeight:card.height};h.classList.add('qxframe9a7c2-keyboard-focus-origin');const keyboard=getComputedStyle(group);out.keyboardWidth=keyboard.outlineWidth;out.keyboardOffset=keyboard.outlineOffset;h.style.removeProperty('--qxframe9a7c2-theme-pointer-width');h.style.removeProperty('--qxframe9a7c2-theme-pointer-offset');h.style.removeProperty('--qxframe9a7c2-theme-pointer-opacity');return out})()");
    assert.equal(r.pointerWidth,'3px','InputGroup visual owner respects mouse focus Theme width');
    assert.equal(r.pointerOffset,'2px','InputGroup visual owner respects mouse focus Theme offset');
    assert.equal(r.keyboardWidth,'2px','keyboard Group outline is a separate 2px contract');
    assert.equal(r.paddingTop,4,'segmented viewport has 4px top inset');
    assert.equal(r.paddingBottom,4,'segmented viewport has 4px bottom inset');
    assert.ok(r.withinTop&&r.withinBottom,'entire TabItem must be inside its padded Scroll viewport: '+JSON.stringify(r));
    assert.ok(r.railHeight+1>=r.tabHeight+8,'rail reserves padding outside trigger height');
  });

  await step('Owner focus halo: actual shadow owner and pointer/keyboard modality',async()=>{
    const r=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,group=d.querySelector('[data-card=savings-targets] .qxframe9a7c2-input-group'),inner=group?.querySelector('.qxframe9a7c2-form-input'),native=d.createElement('input');native.type='text';native.className='qxframe9a7c2-form-input';d.body.appendChild(native);if(!group||!inner)return {error:'missing input/group roles'};h.style.setProperty('--qxframe9a7c2-theme-pointer-shadow','0 0 0 3px rgb(255, 0, 0)');h.style.setProperty('--qxframe9a7c2-theme-focus-shadow','0 0 0 3px rgb(0, 200, 0)');h.classList.remove('qxframe9a7c2-keyboard-focus-origin');inner.focus();const pointer=getComputedStyle(group).boxShadow,child=getComputedStyle(inner).boxShadow;h.classList.add('qxframe9a7c2-keyboard-focus-origin');const keyboard=getComputedStyle(group).boxShadow;native.focus();h.classList.add('qxframe9a7c2-keyboard-focus-origin');const nativeKeyboard=getComputedStyle(native).boxShadow;h.classList.remove('qxframe9a7c2-keyboard-focus-origin');const nativePointer=getComputedStyle(native).boxShadow;h.style.removeProperty('--qxframe9a7c2-theme-pointer-shadow');h.style.removeProperty('--qxframe9a7c2-theme-focus-shadow');native.remove();return {pointer,child,keyboard,nativeKeyboard,nativePointer};})()");
    assert.ok(!r.error,JSON.stringify(r));
    assert.ok(r.pointer.includes('255, 0, 0'),'group pointer halo is themed and rendered: '+JSON.stringify(r));
    assert.ok(r.keyboard.includes('0, 200, 0'),'group keyboard halo is themed and rendered: '+JSON.stringify(r));
    assert.ok(r.nativeKeyboard.includes('0, 200, 0'),'standalone native keyboard halo visible: '+JSON.stringify(r));
    assert.ok(r.nativePointer.includes('255, 0, 0'),'standalone native pointer halo visible: '+JSON.stringify(r));
    assert.equal(r.child,'none','grouped input does not paint duplicate halo');
    const button=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,b=d.querySelector('[data-card=social-links] .qxframe9a7c2-card-footer .qxframe9a7c2-button');if(!b)return{error:'missing native Button'};h.style.setProperty('--qxframe9a7c2-theme-pointer-shadow','0 0 0 3px rgb(255, 0, 0)');h.classList.remove('qxframe9a7c2-keyboard-focus-origin');b.focus();h.classList.remove('qxframe9a7c2-keyboard-focus-origin');const g=getComputedStyle(b);const pointer=g.boxShadow;const info={focused:d.activeElement===b,focusSelector:b.matches(':focus'),focusVisible:b.matches(':focus-visible'),origin:h.className,shadowToken:g.getPropertyValue('--qxframe9a7c2-theme-pointer-shadow').trim(),baseShadow:g.getPropertyValue('--_qxframe9a7c2-state-shadow').trim(),styleScope:g.getPropertyValue('--_qxframe9a7c2-action-shadow').trim(),ruleSelector:b.matches('html:not(.qxframe9a7c2-keyboard-focus-origin) .qxframe9a7c2-button:focus:not(:disabled):not(.is-disabled):not(.is-loading)'),isDisabled:b.disabled,classes:b.className};return{pointer,info}})()");
    assert.ok(!button.error,JSON.stringify(button));
    assert.ok(button.info.focused&&button.info.ruleSelector&&button.info.shadowToken.includes('255, 0, 0'),'Button pointer selector and token must be active before transition: '+JSON.stringify(button));
    // The Button transitions box-shadow; sampling immediately after focus()
    // catches the transparent first keyframe instead of the intended Theme halo.
    // Assert the actual final painted value, not an unanimated snapshot.
    await sleep(450);
    const painted=await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement,b=d.querySelector('[data-card=social-links] .qxframe9a7c2-card-footer .qxframe9a7c2-button');const g=getComputedStyle(b),pointer=g.boxShadow,focused=d.activeElement===b,transition=g.transitionDuration;h.style.removeProperty('--qxframe9a7c2-theme-pointer-shadow');return {pointer,focused,transition};})()");
    assert.ok(painted.focused,'Button remains focused while the box-shadow transition completes');
    assert.ok(painted.pointer.includes('255, 0, 0'),'Button pointer focus must paint Theme shadow after CSS transition: '+JSON.stringify({button,painted}));
  });


  await step('JS Input flat/mixed/nested composition: pointer, keyboard, error and no duplicate halo',async()=>{
    await click('document.querySelector(\'[data-create-item="01"]\')');
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument?.querySelector("[data-card=savings-targets]")','composition test document');
    const result=await evaluate("(() => {\n  const d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n  const origin=h.classList.contains('qxframe9a7c2-keyboard-focus-origin');\n  const style=d.createElement('style');\n  style.textContent='[data-qa-composition] *{transition:none!important;animation:none!important}';\n  d.head.append(style);\n  const host=d.createElement('div');\n  host.dataset.qaComposition='';\n  host.style.cssText='position:absolute;top:0;left:0;width:600px;pointer-events:none';\n  host.innerHTML=\n    '<div class=\"qxframe9a7c2-input-group is-md\" data-qa-kind=\"flat\"><span class=\"qxframe9a7c2-input-group-addon\">@</span><div class=\"qxframe9a7c2-input\"><input class=\"qxframe9a7c2-input-control\" type=\"text\"></div></div>'+\n    '<div class=\"qxframe9a7c2-input-group is-md\" data-qa-kind=\"mixed\"><span class=\"qxframe9a7c2-input-group-prefix\">USD</span><div class=\"qxframe9a7c2-input-group-field\"><span class=\"qxframe9a7c2-input-group-addon\">@</span><div class=\"qxframe9a7c2-input\"><input class=\"qxframe9a7c2-input-control\" type=\"text\"></div></div></div>'+\n    '<div class=\"qxframe9a7c2-input-group is-md\" data-qa-kind=\"island\"><div class=\"qxframe9a7c2-input-group\"><span class=\"qxframe9a7c2-input-group-addon\">@</span><div class=\"qxframe9a7c2-input\"><input class=\"qxframe9a7c2-input-control\" type=\"text\"></div></div></div>';\n  d.body.append(host);\n  const oldPointer=h.style.getPropertyValue('--qxframe9a7c2-theme-pointer-shadow');\n  const oldKeyboard=h.style.getPropertyValue('--qxframe9a7c2-theme-focus-shadow');\n  const oldWidth=h.style.getPropertyValue('--qxframe9a7c2-theme-pointer-width');\n  h.style.setProperty('--qxframe9a7c2-theme-pointer-shadow','0 0 0 3px rgb(255, 0, 0)');\n  h.style.setProperty('--qxframe9a7c2-theme-focus-shadow','0 0 0 3px rgb(0, 200, 0)');\n  h.style.setProperty('--qxframe9a7c2-theme-pointer-width','3px');\n  const cases={};\n  for(const kind of ['flat','mixed','island']){\n    const wrapper=host.querySelector('[data-qa-kind=\"'+kind+'\"]');\n    const shell=wrapper.querySelector('.qxframe9a7c2-input');\n    const outer=kind==='mixed'?wrapper.querySelector('.qxframe9a7c2-input-group-field'):kind==='island'?wrapper.querySelector('.qxframe9a7c2-input-group'):wrapper;\n    const editor=shell.querySelector('input');\n    editor.focus();\n    shell.classList.add('is-focused');\n    h.classList.remove('qxframe9a7c2-keyboard-focus-origin');\n    const p=getComputedStyle(outer),c=getComputedStyle(shell);\n    const pointer={shadow:p.boxShadow,width:p.outlineWidth,childShadow:c.boxShadow,childOutline:c.outlineStyle};\n    h.classList.add('qxframe9a7c2-keyboard-focus-origin');\n    shell.classList.add('is-keyboard-focus');\n    const k=getComputedStyle(outer),kc=getComputedStyle(shell);\n    const keyboard={shadow:k.boxShadow,outline:k.outlineStyle,childShadow:kc.boxShadow,childOutline:kc.outlineStyle};\n    shell.classList.remove('is-keyboard-focus','is-focused');\n    editor.blur();\n    shell.classList.add('is-invalid');\n    const invalidBorder=getComputedStyle(outer).borderBottomColor;\n    shell.classList.remove('is-invalid');\n    cases[kind]={pointer,keyboard,invalidBorder};\n  }\n  const colorProbe=d.createElement('div');\n  colorProbe.style.color='var(--qxframe9a7c2-theme-destructive)';\n  host.append(colorProbe);\n  const destructive=getComputedStyle(colorProbe).color;\n  h.classList.toggle('qxframe9a7c2-keyboard-focus-origin',origin);\n  for(const [token,value] of [['--qxframe9a7c2-theme-pointer-shadow',oldPointer],['--qxframe9a7c2-theme-focus-shadow',oldKeyboard],['--qxframe9a7c2-theme-pointer-width',oldWidth]]) {\n    if(value)h.style.setProperty(token,value);else h.style.removeProperty(token);\n  }\n  host.remove();style.remove();\n  return {cases,destructive};\n})()");
    for(const [kind,c] of Object.entries(result.cases)){
      assert.ok(c.pointer.shadow.includes('255, 0, 0'),kind+' pointer halo owned by outer border: '+JSON.stringify(c));
      assert.equal(c.pointer.childShadow,'none',kind+' hosted JS Input has no second pointer ring');
      assert.equal(c.pointer.childOutline,'none',kind+' hosted JS Input has no second pointer outline');
      assert.ok(c.keyboard.shadow.includes('0, 200, 0'),kind+' keyboard halo owned by outer border: '+JSON.stringify(c));
      assert.equal(c.keyboard.outline,'solid',kind+' keyboard outline on outer border');
      assert.equal(c.keyboard.childShadow,'none',kind+' hosted JS Input has no second keyboard ring');
      assert.equal(c.keyboard.childOutline,'none',kind+' hosted JS Input has no second keyboard outline');
      assert.equal(c.invalidBorder,result.destructive,kind+' invalid border stays destructive');
    }
  });


  await step('Stage5 Table Filter / Transfer / JSON 8 Style x 2 mode Theme consumer matrix',async()=>{
    await click('document.querySelector(\'[data-create-item="03"]\')');
    await waitFor('!!document.querySelector(\'[data-create-frame]\').contentDocument?.querySelector(\'[data-card="plan-governance"]\')','Preview03 Table visual consumer');
    const rows=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument,api=window.QXFRAME9A7C2_CREATE,h=d.documentElement,old=h.classList.contains('dark'),config=api.state.config;
      const box=d.createElement('section'),sheet=d.createElement('style');box.style.cssText='position:absolute;left:-9000px;top:0;width:480px';
      box.innerHTML='<div class="qxframe9a7c2-table-filter-popup" data-s5-popup><div class="qxframe9a7c2-table-filter-search"><input class="qxframe9a7c2-input-control" placeholder="Filter"></div><label class="qxframe9a7c2-table-filter-option is-selected" data-s5-selected><input class="qxframe9a7c2-form-check-input" type="checkbox" checked><span>Chosen</span></label><label class="qxframe9a7c2-table-filter-option is-disabled" data-s5-disabled><input class="qxframe9a7c2-form-check-input" type="checkbox" disabled><span>Disabled</span></label></div><div class="qxframe9a7c2-transfer is-disabled" data-s5-transfer style="--qxframe9a7c2-transfer-panel-border:rgb(19,33,55)"><div class="qxframe9a7c2-transfer-panel"><header class="qxframe9a7c2-transfer-header"><span class="qxframe9a7c2-transfer-title">Disabled</span></header><footer class="qxframe9a7c2-transfer-footer">0 items</footer></div></div><div class="qxframe9a7c2-json-root" data-s5-json><span class="qxframe9a7c2-json-string">code</span><input class="qxframe9a7c2-json-editor qxframe9a7c2-json-string" value="code"></div><span data-s5-font style="font-size:var(--_qxframe9a7c2-control-font-size)">Text</span><span data-s5-muted style="color:var(--qxframe9a7c2-theme-muted-foreground)">Muted</span>';
      d.head.append(sheet);d.body.append(box);const c=s=>getComputedStyle(box.querySelector(s)),result=[];
      for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true]){
        h.classList.toggle('dark',dark);sheet.textContent=api.compileTheme({...config,style},{generatedAt:''}).body;
        const popup=c('[data-s5-popup]'),input=c('[data-s5-popup] input'),disabled=c('[data-s5-disabled]'),panel=c('.qxframe9a7c2-transfer-panel'),header=c('.qxframe9a7c2-transfer-header'),footer=c('.qxframe9a7c2-transfer-footer'),j=c('[data-s5-json]'),editor=c('.qxframe9a7c2-json-editor');
        result.push({style,dark,popupText:popup.color,inputText:input.color,popupBg:popup.backgroundColor,inputBg:input.backgroundColor,selectedBg:c('[data-s5-selected]').backgroundColor,disabledText:disabled.color,disabledCursor:disabled.cursor,muted:c('[data-s5-muted]').color,panelBorder:panel.borderTopColor,headerBorder:header.borderBottomColor,footerBorder:footer.borderTopColor,title:c('.qxframe9a7c2-transfer-title').color,jsonFont:j.fontSize,controlFont:c('[data-s5-font]').fontSize,jsonInk:c('.qxframe9a7c2-json-string').color,editorInk:editor.color,caret:editor.caretColor});
      }h.classList.toggle('dark',old);sheet.remove();box.remove();return result;
    })()`);
    assert.equal(rows.length,16);
    for(const r of rows){
      const note=r.style+'/'+r.dark;
      assert.equal(r.popupText,r.inputText,note+' popup search foreground');
      assert.equal(r.popupBg,r.inputBg,note+' popup search background');
      assert.notEqual(r.selectedBg,'rgba(0, 0, 0, 0)',note+' selected filter row');
      assert.equal(r.disabledCursor,'not-allowed',note+' disabled filter cursor');
      assert.equal(r.disabledText,r.muted,note+' disabled filter text');
      for(const prop of ['panelBorder','headerBorder','footerBorder'])assert.equal(r[prop],'rgb(19, 33, 55)',note+' Transfer border '+prop);
      assert.equal(r.title,r.muted,note+' Transfer disabled title');
      assert.equal(r.jsonFont,r.controlFont,note+' JSON consumes Theme Control size');
      assert.equal(r.editorInk,r.jsonInk,note+' JSON editor retains syntax color');
      assert.equal(r.caret,r.editorInk,note+' JSON caret follows ink');
    }
  });


  await step('Inverse Menu uses only existing popup classes, no DOM theme attribute or JS changes',async()=>{
    const samples=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument,api=window.QXFRAME9A7C2_CREATE,h=d.documentElement;\n const wasDark=h.classList.contains('dark'),holder=d.createElement('div'),styleEl=d.createElement('style');\n holder.innerHTML='<div class=\"qxframe9a7c2-popup-surface\" data-popup></div><div class=\"qxframe9a7c2-menu-submenu-panel\" data-submenu></div><div class=\"qxframe9a7c2-menu-overflow-panel\" data-overflow></div><div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-popover-container\" data-popover></div><div class=\"qxframe9a7c2-tooltip-root\" data-tip-root><div class=\"qxframe9a7c2-tooltip-container qxframe9a7c2-popup-surface\" data-tooltip>Tip</div><i class=\"qxframe9a7c2-tooltip-arrow\" data-tip-arrow></i></div>';\n d.body.append(holder);d.head.append(styleEl);\n const read=e=>{const c=d.defaultView.getComputedStyle(e),probe=d.createElement('span');probe.style.cssText='color:var(--qxframe9a7c2-theme-primary);background:var(--qxframe9a7c2-theme-background)';e.append(probe);const x=d.defaultView.getComputedStyle(probe);const resolved=[x.color,x.backgroundColor];probe.remove();return [c.getPropertyValue('--qxframe9a7c2-theme-background').trim(),c.getPropertyValue('--qxframe9a7c2-theme-foreground').trim(),c.getPropertyValue('--qxframe9a7c2-theme-primary').trim(),c.colorScheme,...resolved];};\n const results=[];\n try{\n  for(const style of ['nova','rhea','sera'])for(const mode of ['default','inverted']){\n   styleEl.textContent=api.compileTheme({...api.state.config,style,menuColor:mode},{generatedAt:''}).body;\n   h.classList.remove('dark');\n   const light={root:read(h),popup:read(holder.querySelector('[data-popup]')),submenu:read(holder.querySelector('[data-submenu]')),overflow:read(holder.querySelector('[data-overflow]')),popover:read(holder.querySelector('[data-popover]')),tooltip:read(holder.querySelector('[data-tooltip]')),tipFill:d.defaultView.getComputedStyle(holder.querySelector('[data-tooltip]')).backgroundColor,tipArrow:d.defaultView.getComputedStyle(holder.querySelector('[data-tip-arrow]')).backgroundColor};\n   h.classList.add('dark');\n   const dark={root:read(h),popup:read(holder.querySelector('[data-popup]')),submenu:read(holder.querySelector('[data-submenu]')),overflow:read(holder.querySelector('[data-overflow]')),popover:read(holder.querySelector('[data-popover]')),tooltip:read(holder.querySelector('[data-tooltip]')),tipFill:d.defaultView.getComputedStyle(holder.querySelector('[data-tooltip]')).backgroundColor,tipArrow:d.defaultView.getComputedStyle(holder.querySelector('[data-tip-arrow]')).backgroundColor};\n   results.push({style,mode,light,dark});\n  }\n }finally{h.classList.toggle('dark',wasDark);styleEl.remove();holder.remove();}\n return results;\n})()");
    assert.equal(samples.length,6);
    for(const s of samples){
      const inv=s.mode==='inverted',tag=s.style+'/'+s.mode;
      for(const key of ['popup','submenu','overflow']){
        assert.deepEqual(s.light[key],inv?s.dark.root:s.light.root,tag+' light-page '+key+' matches complete target Theme');
        assert.deepEqual(s.dark[key],inv?s.light.root:s.dark.root,tag+' dark-page '+key+' matches complete target Theme');
      }
      assert.deepEqual(s.light.popover,s.light.root,tag+' Popover is never inverted with Menu');
      assert.deepEqual(s.dark.popover,s.dark.root,tag+' dark Popover remains normal');
      assert.deepEqual(s.light.tooltip,s.light.root,tag+' light Tooltip stays in page scheme');
      assert.deepEqual(s.dark.tooltip,s.dark.root,tag+' dark Tooltip stays in page scheme');
      assert.equal(s.light.tipFill,s.light.tipArrow,tag+' Tooltip arrow and panel same background');
      assert.equal(s.dark.tipFill,s.dark.tipArrow,tag+' dark Tooltip arrow and panel same background');
    }
  });


  await step('Native Select local-scheme arrow + true TreeSelect panel scope: 8 Styles x 3 themes x 2 pages x 4 Menu modes',async()=>{
    const rows=await evaluate("(() => {\n  const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n  const oldDark=h.classList.contains('dark'),sheet=d.createElement('style'),host=d.createElement('div');\n  host.style.cssText='position:absolute;left:-10000px;top:0;width:22rem';\n  host.innerHTML='<select class=\"qxframe9a7c2-form-select\" data-page><option>Native</option></select>'+\n    '<div class=\"qxframe9a7c2-popup-surface\" data-popup-root><select class=\"qxframe9a7c2-form-select\" data-popup><option>Native</option></select><div class=\"qxframe9a7c2-native-form\"><select data-native><option>Native</option></select></div></div>'+\n    '<div class=\"qxframe9a7c2-tree-select-panel qxframe9a7c2-popup-surface\" data-tree-panel><div class=\"qxframe9a7c2-tree-select-popup-content\"><div class=\"qxframe9a7c2-tree-select-tree-host\"><div class=\"qxframe9a7c2-tree\"><div class=\"qxframe9a7c2-tree-check-wrap\"><input class=\"qxframe9a7c2-tree-check\" type=\"checkbox\" checked><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div></div></div></div></div>'+\n    '<div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-popover-container\" data-popover-root><select class=\"qxframe9a7c2-form-select\" data-popover><option>Native</option></select></div>';\n  d.head.append(sheet);d.body.append(host);\n  const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];\n  const menus=['default','default-translucent','inverted','inverted-translucent'],palettes=['neutral','blue','orange'],rows=[];\n  const read=key=>{const computed=d.defaultView.getComputedStyle(host.querySelector(key));return {scheme:computed.colorScheme,arrow:computed.backgroundImage};};\n  try{\n    for(const style of styles)for(const palette of palettes)for(const menuColor of menus)for(const dark of [false,true]){\n      sheet.textContent=api.compileTheme({...api.state.config,style,baseColor:'neutral',theme:palette,chartColor:palette,menuColor},{generatedAt:''}).body;\n      h.classList.toggle('dark',dark);\n      rows.push({style,palette,menuColor,dark,page:read('[data-page]'),popup:read('[data-popup]'),native:read('[data-native]'),popover:read('[data-popover]'),\n        rootScheme:d.defaultView.getComputedStyle(h).colorScheme,\n        popupScheme:d.defaultView.getComputedStyle(host.querySelector('[data-popup-root]')).colorScheme,\n        treeScheme:d.defaultView.getComputedStyle(host.querySelector('[data-tree-panel]')).colorScheme,\n        treeCheck:d.defaultView.getComputedStyle(host.querySelector('[data-tree-panel] .qxframe9a7c2-tree-check:checked + .qxframe9a7c2-tree-check-indicator')).backgroundColor});\n    }\n  }finally{h.classList.toggle('dark',oldDark);sheet.remove();host.remove();}\n  return rows;\n})()");
    assert.equal(rows.length,192,'cross-theme computed-style acceptance must run all combinations');
    const lookup=new Map(rows.map(r=>[JSON.stringify([r.style,r.palette,r.menuColor,r.dark]),r]));
    for(const row of rows){
      const tag=[row.style,row.palette,row.menuColor,row.dark?'dark':'light'].join('/');
      const rootScheme=row.dark?'dark':'light',invert=row.menuColor.startsWith('inverted');
      const popupScheme=invert?(row.dark?'light':'dark'):rootScheme;
      assert.equal(row.rootScheme,rootScheme,tag+' page scheme');
      assert.equal(row.page.scheme,rootScheme,tag+' standalone native scheme');
      assert.equal(row.popup.scheme,popupScheme,tag+' local Popup native scheme');
      assert.equal(row.popupScheme,popupScheme,tag+' Popup root scheme');
      assert.equal(row.treeScheme,popupScheme,tag+' actual TreeSelect panel class is scheme-bound, not a fake PickerField');
      assert.equal(row.native.scheme,popupScheme,tag+' native-form select scheme');
      assert.equal(row.popover.scheme,rootScheme,tag+' non-Menu Popover must not invert');
      assert.equal(row.popover.arrow,row.page.arrow,tag+' non-Menu Popover arrow matches page');
      assert.equal(row.native.arrow,row.popup.arrow,tag+' both native select API shapes share Theme arrow');
      assert.ok(row.page.arrow.includes('linear-gradient(45deg')&&row.page.arrow.includes('linear-gradient(135deg')&&!row.page.arrow.includes('url('),tag+' CSS arrow uses live Theme color');
      const opposite=lookup.get(JSON.stringify([row.style,row.palette,row.menuColor,!row.dark]));
      assert.ok(opposite,tag+' opposite page sample');
      assert.notEqual(row.page.arrow,opposite.page.arrow,tag+' light/dark arrow paint differs');
      assert.equal(row.popup.arrow,invert?opposite.page.arrow:row.page.arrow,tag+' local inverse selects opposite color without SVG or per-component CSS');
      assert.notEqual(row.treeCheck,'rgba(0, 0, 0, 0)',tag+' TreeSelect checked indicator remains filled');
    }
  });

  await step('Stage5 inverted Popup paired paint: Date/Time/Tree Choice/HEX 64 modes',async()=>{
    const samples=await evaluate("(() => {\n const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,h=d.documentElement;\n const orig=api.state.config,wasDark=h.classList.contains('dark'),host=d.createElement('section'),sheet=d.createElement('style');\n host.style.cssText='position:absolute;left:-10000px;top:0;width:25rem';\n host.innerHTML='<div class=\"qxframe9a7c2-picker-field-panel qxframe9a7c2-popup-surface\"><div class=\"qxframe9a7c2-date-panel\"><button class=\"qxframe9a7c2-date-panel-nav\" type=\"button\">Next</button><button class=\"qxframe9a7c2-date-panel-cell is-selected\">16</button></div><div class=\"qxframe9a7c2-wheel-panel\"><div class=\"qxframe9a7c2-wheel-panel-columns\"><div class=\"qxframe9a7c2-wheel-panel-column\"><div class=\"qxframe9a7c2-wheel-panel-item is-selected\">21</div></div></div><div class=\"qxframe9a7c2-wheel-panel-center-guide\"></div></div><div class=\"qxframe9a7c2-color-panel\"><div class=\"qxframe9a7c2-color-panel-fields\"><button class=\"qxframe9a7c2-color-panel-format\">HEX</button><input class=\"qxframe9a7c2-color-panel-input\" value=\"#2869E6\"><button class=\"qxframe9a7c2-color-panel-eye\">Eye</button></div></div></div><div class=\"qxframe9a7c2-tree-select-panel qxframe9a7c2-popup-surface qxframe9a7c2-list-frame is-inset\"><div class=\"qxframe9a7c2-tree-select-popup-content\"><div class=\"qxframe9a7c2-tree-select-tree-host\"><div class=\"qxframe9a7c2-tree\"><div class=\"qxframe9a7c2-tree-check-wrap\"><input type=\"checkbox\" class=\"qxframe9a7c2-tree-check\" checked><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div><div class=\"qxframe9a7c2-tree-check-wrap\"><input type=\"checkbox\" class=\"qxframe9a7c2-tree-check\" data-mixed><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div></div></div></div></div><i data-menu style=\"color:var(--qxframe9a7c2-theme-menu-foreground);background:var(--qxframe9a7c2-theme-menu)\"></i><i data-accent style=\"color:var(--qxframe9a7c2-theme-menu-accent-foreground);background:var(--qxframe9a7c2-theme-menu-accent)\"></i><i class=\"qxframe9a7c2-popup-surface\" data-selected-soft style=\"background:var(--_qxframe9a7c2-menu-selected-soft)\"></i><i data-pointer style=\"color:var(--qxframe9a7c2-theme-pointer-focus)\"></i><i data-solid style=\"color:oklch(from var(--qxframe9a7c2-theme-menu-accent) l c h / 1)\"></i>';\n host.insertAdjacentHTML('beforeend','<div data-global-tree class=\"qxframe9a7c2-tree\"><div class=\"qxframe9a7c2-tree-check-wrap\"><input data-reference-unchecked class=\"qxframe9a7c2-tree-check\" type=\"checkbox\"><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div><div class=\"qxframe9a7c2-tree-check-wrap\"><input data-reference-checked class=\"qxframe9a7c2-tree-check\" type=\"checkbox\" checked><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div><div class=\"qxframe9a7c2-tree-check-wrap\"><input data-reference-mixed class=\"qxframe9a7c2-tree-check\" type=\"checkbox\"><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div></div>');\n host.querySelector('.qxframe9a7c2-tree-select-panel .qxframe9a7c2-tree').insertAdjacentHTML('beforeend','<div class=\"qxframe9a7c2-tree-check-wrap\"><input data-popup-unchecked class=\"qxframe9a7c2-tree-check\" type=\"checkbox\"><span class=\"qxframe9a7c2-tree-check-indicator\"></span></div>');\n d.head.append(sheet);d.body.append(host);for(const name of ['menu','accent','selected-soft','solid'])host.querySelector('.qxframe9a7c2-picker-field-panel').append(host.querySelector('[data-'+name+']'));host.querySelector('.qxframe9a7c2-tree-select-panel').insertAdjacentHTML('beforeend','<i data-choice-expected style=\"color:var(--_qxframe9a7c2-type-foreground,var(--qxframe9a7c2-theme-primary-foreground));background:var(--qxframe9a7c2-theme-choice);border:1px solid var(--qxframe9a7c2-theme-choice-border)\"></i>');host.querySelector('[data-mixed]').indeterminate=true;host.querySelector('[data-reference-mixed]').indeterminate=true;host.querySelectorAll('.qxframe9a7c2-tree-check-indicator').forEach(x=>{x.style.transition='none';});\n const c=s=>d.defaultView.getComputedStyle(host.querySelector(s)),rows=[],input=host.querySelector('.qxframe9a7c2-color-panel-input');\n for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])for(const dark of [false,true])for(const menuColor of ['default','default-translucent','inverted','inverted-translucent']){\n   h.classList.toggle('dark',dark);sheet.textContent=api.compileTheme({...orig,style,menuColor},{generatedAt:''}).body;\n   input.focus();\n   const menu=c('[data-menu]'),accent=c('[data-accent]'),nav=c('.qxframe9a7c2-date-panel-nav'),date=c('.qxframe9a7c2-date-panel-cell.is-selected'),guide=c('.qxframe9a7c2-wheel-panel-center-guide'),field=c('.qxframe9a7c2-color-panel-input'),format=c('.qxframe9a7c2-color-panel-format'),eye=c('.qxframe9a7c2-color-panel-eye'),checked=c('.qxframe9a7c2-tree-select-panel .qxframe9a7c2-tree-check:checked + .qxframe9a7c2-tree-check-indicator'),mixed=c('.qxframe9a7c2-tree-select-panel .qxframe9a7c2-tree-check:indeterminate + .qxframe9a7c2-tree-check-indicator'),refChecked=c('[data-reference-checked] + .qxframe9a7c2-tree-check-indicator'),refMixed=c('[data-reference-mixed] + .qxframe9a7c2-tree-check-indicator'),refUnchecked=c('[data-reference-unchecked] + .qxframe9a7c2-tree-check-indicator'),popupUnchecked=c('[data-popup-unchecked] + .qxframe9a7c2-tree-check-indicator');\n   rows.push({style,dark,menuColor,menuText:menu.color,menuBg:menu.backgroundColor,accentText:accent.color,accentBg:accent.backgroundColor,navText:nav.color,dateText:date.color,dateBg:date.backgroundColor,selectedSoftBg:c('[data-selected-soft]').backgroundColor,guideBg:guide.backgroundColor,fieldText:field.color,fieldBg:field.backgroundColor,fieldBorder:field.borderTopColor,pointer:c('[data-pointer]').color,menuSolid:c('[data-solid]').color,formatText:format.color,formatBg:format.backgroundColor,eyeText:eye.color,eyeBg:eye.backgroundColor,expectedChoiceText:c('[data-choice-expected]').color,expectedChoiceBg:c('[data-choice-expected]').backgroundColor,expectedChoiceBorder:c('[data-choice-expected]').borderTopColor,checkedText:checked.color,checkedBg:checked.backgroundColor,checkedBorder:checked.borderTopColor,mixedText:mixed.color,mixedBg:mixed.backgroundColor,mixedBorder:mixed.borderTopColor,refCheckedText:refChecked.color,refCheckedBg:refChecked.backgroundColor,refCheckedBorder:refChecked.borderTopColor,refMixedText:refMixed.color,refMixedBg:refMixed.backgroundColor,refMixedBorder:refMixed.borderTopColor,uncheckedText:popupUnchecked.color,uncheckedBg:popupUnchecked.backgroundColor,uncheckedBorder:popupUnchecked.borderTopColor,refUncheckedText:refUnchecked.color,refUncheckedBg:refUnchecked.backgroundColor,refUncheckedBorder:refUnchecked.borderTopColor});\n }\n h.classList.toggle('dark',wasDark);sheet.remove();host.remove();return rows;\n})()");
    assert.equal(samples.length,64);
    for(const v of samples){
      const k=v.style+'/'+v.dark+'/'+v.menuColor;
      assert.equal(v.navText,v.menuText,k+' idle Date nav foreground');
      assert.equal(v.dateText,v.accentText,k+' selected date foreground');
      assert.equal(v.dateBg,v.selectedSoftBg,k+' selected date uses alpha Menu accent background');
      assert.notEqual(v.guideBg,'rgba(0, 0, 0, 0)',k+' canonical WheelPanel guide keeps its translucent primary paint');
      assert.equal(v.fieldText,v.menuText,k+' HEX foreground');
      assert.equal(v.fieldBg,v.menuBg,k+' HEX background');
      assert.equal(v.fieldBorder,v.menuSolid,k+' HEX focus border derives from Menu Primary');
      assert.equal(v.formatText,v.menuText,k+' HEX format foreground');
      assert.equal(v.formatBg,v.menuBg,k+' HEX format background');
      assert.equal(v.eyeText,v.menuText,k+' eyedropper foreground');
      assert.equal(v.eyeBg,v.menuBg,k+' eyedropper background');
      // Tree owns check state; Shared Choice provides Type foreground, not Menu background.
      assert.equal(v.checkedText,v.expectedChoiceText,k+' checked TreeSelect glyph uses Choice foreground');
      assert.equal(v.mixedText,v.expectedChoiceText,k+' indeterminate TreeSelect glyph uses Choice foreground');
      assert.notEqual(v.checkedText,v.checkedBg,k+' checked glyph contrasts with its fill');
      assert.equal(v.checkedBg,v.mixedBg,k+' checked/mixed Menu Primary fill match');
      assert.equal(v.checkedBg,v.checkedBorder,k+' real TreeSelect checked checkbox is a filled square, not a free-floating glyph');
      assert.equal(v.mixedBg,v.mixedBorder,k+' real TreeSelect indeterminate checkbox is a filled square');
      assert.equal(v.checkedBorder,v.mixedBorder,k+' checked/mixed Menu border match');
      assert.equal(v.uncheckedBg,v.expectedChoiceBg,k+' unchecked popup Choice follows Theme Choice fill');
      assert.equal(v.uncheckedBorder,v.expectedChoiceBorder,k+' unchecked popup Choice follows Theme Choice edge');
      assert.notEqual(v.uncheckedBorder,v.uncheckedBg,k+' unchecked popup Choice has visible border');
      assert.equal(v.refCheckedText,v.refMixedText,k+' Tree outside Popup still consumes page Choice');
    }
  });

  await step('CALENDAR-UNIT-OWNER-001 real Calendar unit data, same DOM and keyboard/pointer paths',async()=>{
    const result=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument,q=d.defaultView.QXFRAME9A7C2;\n const C=q&&q.BuildingBlocks?.Calendar,P=q&&q.BuildingBlocks?.PeriodPanel;\n if(!C||!P)return {error:'Calendar/legacy exported alias missing'};\n const host=d.createElement('div');host.style.cssText='position:absolute;left:-5000px;top:0';d.body.append(host);\n const modes=[['date','2026-10-14',42],['week','2026-10-14',42],['month','2026-10',12],['quarter','2026-Q3',4],['year','2026',12]];\n const out=[];\n try{\n  for(const [unit,value,count] of modes){\n   const target=d.createElement('div');host.append(target);\n   const calls=[],c=C.create({container:target,document:d,unit,value,onSelect:v=>calls.push(v)});\n   try{\n    const root=c.getRootElement(),grid=root.querySelector('.qxframe9a7c2-calendar-grid');\n    const cells=[...grid.querySelectorAll(':scope > .qxframe9a7c2-calendar-cell')];\n    const button=cells.find(x=>!x.disabled&&!x.classList.contains('is-outside'));\n    const prev=c.getState().viewValue;\n    const before=c.getState().activeKey;\n    const moved=c.handleKeydown(new d.defaultView.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true}));\n    const after=c.getState().activeKey;\n    const el=button?.querySelector('.qxframe9a7c2-calendar-cell-inner');\n    el?.click();\n    const selected=c.getState().value;\n    c.next();\n    const viewNext=c.getState().viewValue;\n    const delta=(viewNext.getFullYear()-prev.getFullYear())*12+viewNext.getMonth()-prev.getMonth();\n    out.push({unit,count:cells.length,expected:count,period:root.classList.contains('is-period'),weekdaysHidden:root.querySelector('.qxframe9a7c2-calendar-weekdays').hidden,structure:!!button&&button.tagName==='BUTTON'&&button.firstElementChild?.classList.contains('qxframe9a7c2-calendar-cell-view')&&button.firstElementChild.firstElementChild===el,selectionCount:calls.length,selectedTime:selected&&typeof selected.getTime==='function'?selected.getTime():null,keyboard:moved,activeMoved:before!==after,monthDelta:delta,fieldUnit:c.getState().unit});\n   }finally{c.destroy();}\n  }\n }finally{host.remove();}\n return {aliasIdentity:C===P,modes:out};\n})()");
    assert.equal(result.error,undefined,'shared Calendar + direct public alias available');
    assert.equal(result.aliasIdentity,true,'PeriodPanel is the exact Calendar object, not a second component');
    assert.equal(result.modes.length,5,'five unit datasets');
    for(const m of result.modes){
      assert.equal(m.count,m.expected,m.unit+' unit data count');
      assert.equal(m.fieldUnit,m.unit,m.unit+' state unit');
      assert.equal(m.period,!['date','week'].includes(m.unit),m.unit+' unit geometry');
      assert.equal(m.weekdaysHidden,m.period,m.unit+' show weekdays only for date/week');
      assert.equal(m.structure,true,m.unit+' button > view > inner');
      assert.equal(m.selectionCount,1,m.unit+' exactly one delegated select callback');
      assert.ok(Number.isFinite(m.selectedTime),m.unit+' selected value is a valid Date across iframe realms');
      assert.equal(m.keyboard,true,m.unit+' keyboard handled');
      assert.equal(m.activeMoved,true,m.unit+' active date changes');
      assert.equal(m.monthDelta,m.unit==='year'?120:m.period?12:1,m.unit+' correct page step');
    }
  });

  await step('Stage5 Calendar Week Hover selects seven contiguous dates with opaque Range endpoints',async()=>{
    const rows=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const C=d.defaultView.QXFRAME9A7C2?.BuildingBlocks?.Calendar;
      if(!C)return {error:'Calendar unavailable'};
      const host=d.createElement('div');host.style.cssText='position:absolute;left:-4000px;top:0';d.body.append(host);
      const c=C.create({container:host,unit:'week',value:'2026-10-14',weekStartsOn:1});
      const snapshot=()=>{
        const cells=[...c.getRootElement().querySelectorAll('.qxframe9a7c2-calendar-grid>.qxframe9a7c2-calendar-cell')];
        const selected=cells.filter(n=>n.classList.contains('is-week-selected'));
        const hover=cells.filter(n=>n.classList.contains('is-week-hover'));
        const range=cells.filter(n=>n.classList.contains('is-in-range'));
        const starts=cells.filter(n=>n.classList.contains('is-range-start'));
        const ends=cells.filter(n=>n.classList.contains('is-range-end'));
        const boxes=starts.concat(ends).map(n=>d.defaultView.getComputedStyle(n.querySelector('.qxframe9a7c2-calendar-cell-inner')).backgroundColor);
        const before=starts.map(n=>d.defaultView.getComputedStyle(n,'::before').width);
        return {selected:selected.length,hover:hover.length,range:range.length,starts:starts.length,ends:ends.length,boxes,before,weekStyles:c.getRootElement().className};
      };
      try{
        const initial=snapshot();
        const nextWeek=c.getRootElement().querySelectorAll('.qxframe9a7c2-calendar-grid>.qxframe9a7c2-calendar-cell')[24];
        nextWeek.dispatchEvent(new d.defaultView.PointerEvent('pointermove',{bubbles:true}));
        const hovered=snapshot();
        nextWeek.click();
        const committed=snapshot();
        c.getRootElement().dispatchEvent(new d.defaultView.PointerEvent('pointerleave',{bubbles:false}));
        const cleared=snapshot();
        return {initial,hovered,committed,cleared};
      }finally{c.destroy();host.remove();}
    })()`);
    assert.equal(rows.error,undefined,'week Calendar runtime exists');
    assert.equal(rows.initial.selected,7,'committed week highlights seven dates, not one date');
    assert.equal(rows.initial.range,7,'selected week uses existing continuous Range strip');
    assert.equal(rows.hovered.hover,7,'pointer Hover projects to all seven week cells');
    assert.ok(rows.hovered.range>=7,'hovered week also uses Range strip');
    assert.equal(rows.committed.selected,7,'selecting a new week keeps seven connected selected dates');
    assert.equal(rows.cleared.hover,0,'pointer leave clears the entire weekly hover preview');
    assert.equal(rows.cleared.selected,7,'clearing Hover does not clear committed week selection');
    for(const key of ['initial','cleared']){
      assert.equal(rows[key].starts,1,key+' one start for one week');
      assert.equal(rows[key].ends,1,key+' one end for one week');
      assert.ok(rows[key].boxes.every(x=>x&&x!=='rgba(0, 0, 0, 0)'&&x!=='transparent'),key+' raised endpoints are opaque above half width ::before');
    }
  });

  await step('Stage5 Vega Mist neutral Hover and independent Slider capsule handle in real Chromium',async()=>{
    const got=await evaluate(`(() => {
      const api=window.QXFRAME9A7C2_CREATE,d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,h=d.documentElement;
      const sheet=d.getElementById('qxframe9a7c2-create-theme'),before=sheet.textContent,oldDark=h.classList.contains('dark');
      const host=d.createElement('section');host.style.cssText='position:absolute;left:-5000px;top:0;width:24rem';
      host.innerHTML='<div class="qxframe9a7c2-slider is-md"><div class="qxframe9a7c2-slider-rail"></div><div class="qxframe9a7c2-slider-handle"></div></div>'+
        '<div class="qxframe9a7c2-card" data-shadow>Card</div>'+
        '<div class="qxframe9a7c2-popup-surface"><div class="qxframe9a7c2-item-surface is-hover" data-popup-hover>Menu</div></div>'+
        '<div data-nav-hover style="background:var(--_qxframe9a7c2-semantic-subtle-hover)"></div>'+
        '<div data-nav-active style="background:var(--_qxframe9a7c2-semantic-subtle-active)"></div>';
      d.body.appendChild(host);
      const cfg=api.state.config,css=e=>w.getComputedStyle(host.querySelector(e));
      function sample(baseColor,sliderLook,shapeThumb,dark){
        h.classList.toggle('dark',dark);
        sheet.textContent=api.compileTheme({...cfg,style:'vega',baseColor,theme:baseColor,chartColor:baseColor,
          ext:{...cfg.ext,shadow:'medium',sliderLook,shapeThumb}},{generatedAt:''}).body;
        return {
          rail:parseFloat(css('.qxframe9a7c2-slider-rail').height),
          width:parseFloat(css('.qxframe9a7c2-slider-handle').width),
          height:parseFloat(css('.qxframe9a7c2-slider-handle').height),
          radius:css('.qxframe9a7c2-slider-handle').borderRadius,
          hover:css('[data-nav-hover]').backgroundColor,active:css('[data-nav-active]').backgroundColor,
          menu:css('[data-popup-hover]').backgroundColor,shadow:css('[data-shadow]').boxShadow
        };
      }
      try{
        return {neutral:sample('neutral','t4','circle',false),thin:sample('mist','t4','circle',false),
          thick:sample('mist','t12','circle',false),pill:sample('mist','t4','pill',false),
          darkMist:sample('mist','t4','pill',true)};
      }finally{h.classList.toggle('dark',oldDark);sheet.textContent=before;host.remove()}
    })()`);
    assert.ok(got.thick.rail>got.thin.rail,'sliderLook must alter rail thickness');
    assert.equal(got.thick.width,got.thin.width,'rail thickness must not alter handle width');
    assert.equal(got.pill.rail,got.thin.rail,'pill handle must not alter rail thickness');
    assert.ok(got.pill.width>got.pill.height,'pill shape must physically widen the handle');
    assert.equal(got.pill.radius,got.thin.radius,'circle/pill both preserve full rounded shape');
    for(const field of ['hover','active','menu','shadow'])
      assert.notEqual(got.thin[field],got.neutral[field],'Mist base color must affect '+field+': '+JSON.stringify(got));
    assert.ok(!got.darkMist.shadow.includes('rgba(255, 255, 255'),'dark Mist shadow must not be a white glow');
  });

  await step('Stage5 Modal origin and zero-divider Dialog geometry in real Chromium',async()=>{
    const got=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const w=d.defaultView, Q=w.QXFRAME9A7C2, style=d.documentElement.style;
      const key='--qxframe9a7c2-theme-dialog-divider-width';
      const before=style.getPropertyValue(key),sectionKey='--qxframe9a7c2-theme-card-section',beforeSection=style.getPropertyValue(sectionKey), c=n=>w.getComputedStyle(n);
      style.setProperty(key,'0px');style.setProperty(sectionKey,'rgb(190 30 30)');
      const m=Q.Components.Modal.create({document:d,portalContainer:d.body,autoOpen:false,title:'Geometry',content:'Body',footer:'Footer',focusTrap:false,lockScroll:false});
      const dr=Q.Components.Drawer.create({document:d,portalContainer:d.body,autoOpen:false,title:'Geometry',content:'Body',footer:'Footer',focusTrap:false,lockScroll:false,placement:'right'});
      try {
        const event=new w.MouseEvent('click',{bubbles:true,clientX:40,clientY:80});
        m.open('pointer-geometry',event);
        dr.open('drawer-geometry',event);
        const dialog=m.getDialogElement(),drawer=dr.getPanelElement();
        const read=p=>{const role=p===dialog?'modal':'drawer',h=p.querySelector('.qxframe9a7c2-'+role+'-header'),f=p.querySelector('.qxframe9a7c2-'+role+'-footer');
          return {header:c(h).paddingBottom,footer:c(f).paddingTop,panelBg:c(p).backgroundColor,headerBg:c(h).backgroundColor,footerBg:c(f).backgroundColor};};
        return {originX:dialog.style.getPropertyValue('--_qxframe9a7c2-modal-motion-x'),
          originY:dialog.style.getPropertyValue('--_qxframe9a7c2-modal-motion-y'),
          scale:dialog.style.getPropertyValue('--_qxframe9a7c2-modal-motion-scale'),
          modal:read(dialog),drawer:read(drawer),placement:drawer.dataset.placement};
      } finally {
        m.destroy();dr.destroy();
        if(before)style.setProperty(key,before);else style.removeProperty(key);
        if(beforeSection)style.setProperty(sectionKey,beforeSection);else style.removeProperty(sectionKey);
      }
    })()`);
    assert.notEqual(got.originX,'0px','pointer Modal must start at the actual click x, not its center');
    assert.notEqual(got.originY,'0px','pointer Modal must start at the actual click y, not its center');
    assert.equal(got.scale,'.7','pointer-origin visibly scales from the trigger');
    for(const role of ['modal','drawer']){
      assert.equal(got[role].header,'0px',role+' divider-free header has no bottom padding');
      assert.ok(parseFloat(got[role].footer)>0,role+' divider-free footer keeps button space');
      assert.equal(got[role].headerBg,got[role].panelBg,role+' divider-free header and panel background match');
      assert.equal(got[role].footerBg,got[role].panelBg,role+' divider-free footer and panel background match');
    }
    assert.equal(got.placement,'right','Drawer retains real placement owner');
  });

  await step('Stage5 Preview04 inherits Create live CSS, shows all demos and black shadow in dark mode',async()=>{
    await click('document.querySelector(\'[data-create-item="04"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("theme-playground.html")','Preview04 route',15000);
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.getElementById("component-alert")','Preview04 live gallery',15000);
    // Use the gallery's real search filter: keeping hundreds of expanded
    // canonical demos above the target otherwise shifts its scroll position
    // before IntersectionObserver can enqueue it (and leaves heavy idle tasks).
    await evaluate("(() => {const d=document.querySelector('[data-create-frame]').contentDocument;const input=d.querySelector('[data-qxframe9a7c2-search]');input.value='Alert';input.dispatchEvent(new d.defaultView.Event('input',{bubbles:true}));d.getElementById('component-alert').scrollIntoView({behavior:'instant',block:'center'});return true})()");
    await waitFor('!document.querySelector("[data-create-frame]").contentDocument.getElementById("component-alert").hidden','Alert is exposed by real gallery filtering',15000);
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.getElementById("qxframe9a7c2-create-theme")','Preview04 theme bridge',15000);
    await waitFor('document.querySelector("[data-create-frame]").contentDocument.querySelectorAll("#component-alert .qxframe9a7c2-play-example").length>=2','all Alert demos mounted',20000);
    const result=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,root=d.documentElement;
      const alert=d.getElementById('component-alert'),theme=d.getElementById('qxframe9a7c2-create-theme'),wasDark=root.classList.contains('dark');
      root.classList.add('dark');
      const n=d.createElement('div');n.className='qxframe9a7c2-alert-root is-shadow is-success';d.body.append(n);
      const shadow=w.getComputedStyle(n).boxShadow;n.remove();root.classList.toggle('dark',wasDark);
      return {theme:theme.textContent.length,examples:alert.querySelectorAll('.qxframe9a7c2-play-example').length,folds:alert.querySelectorAll('[data-qxframe9a7c2-card-toggle]').length,shadow};
    })()`);
    assert.ok(result.theme>100,'live Create compiled theme applied to Preview04');
    assert.ok(result.examples>=2,'all canonical Alert demos visible');
    assert.equal(result.folds,0,'no collapsed cards in Preview04');
    assert.ok(!result.shadow.includes('rgba(255, 255, 255') && !result.shadow.includes('oklch(0.9'),'dark Alert shadow must not use white foreground: '+result.shadow);
    await click('document.querySelector(\'[data-create-item="02"]\')');
    await waitFor('document.querySelector("[data-create-frame]").src.endsWith("preview-02.html")','restore Preview02',15000);
    // src changes before the new iframe's scripts have executed; the following
    // compositor diagnostic requires the actual local QX runtime and live Theme.
    await waitFor('!!document.querySelector("[data-create-frame]").contentDocument.defaultView.QXFRAME9A7C2?.Components?.Modal && document.querySelector("[data-create-frame]").contentDocument.getElementById("qxframe9a7c2-create-theme")?.textContent.length>100','Preview02 runtime and Theme restored after Preview04',25000);
  });

  await step('Stage5 overlay compositor frame timings (diagnostic, not a visual signoff)',async()=>{
    const timings=await evaluate("(async()=>{\n const d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,q=w.QXFRAME9A7C2;\n const host=d.createElement('section');host.style.cssText='position:absolute;left:-2500px;top:0';d.body.append(host);\n const canvas=d.createElement('canvas');canvas.width=160;canvas.height=90;canvas.getContext('2d').fillRect(0,0,160,90);\n const source=canvas.toDataURL('image/png'),imgHost=d.createElement('div');host.append(imgHost);\n const modal=q.Components.Modal.create({document:d,portalContainer:d.body,title:'Motion sample',content:'Compositor profile',autoOpen:false,lockScroll:true,focusTrap:false});\n const drawer=q.Components.Drawer.create({document:d,portalContainer:d.body,title:'Drawer sample',content:'Compositor profile',autoOpen:false,lockScroll:true,focusTrap:false});\n const img=q.Components.Image.create({container:imgHost,src:source,alt:'Performance sampling source',preview:true,width:160,height:90});\n const sample=async act=>{\n  const start=w.performance.now();act();const syncMs=w.performance.now()-start;\n  let first=0,prev=0,maxGap=0,longFrames=0,deltaTotal=0;const gaps=[];\n  for(let i=0;i<28;i++){\n   const t=await new Promise(done=>w.requestAnimationFrame(done));\n   if(!first)first=t-start;\n   if(prev){const gap=t-prev;gaps.push(gap);deltaTotal+=gap;maxGap=Math.max(maxGap,gap);if(gap>34)longFrames++}\n   prev=t;\n  }\n  return {syncMs:+syncMs.toFixed(2),firstFrameMs:+first.toFixed(2),maxGapMs:+maxGap.toFixed(2),longFrames,meanGapMs:+(deltaTotal/Math.max(1,gaps.length)).toFixed(2)};\n };\n try{\n  const result={};\n  result.modalEnter=await sample(()=>modal.open('motion-profile'));\n  result.modalLeave=await sample(()=>modal.close('motion-profile'));\n  result.drawerEnter=await sample(()=>drawer.open('motion-profile'));\n  result.drawerLeave=await sample(()=>drawer.close('motion-profile'));\n  result.imageEnter=await sample(()=>img.openPreview());\n  result.imageLeave=await sample(()=>img.closePreview('motion-profile'));\n  return result;\n }finally{img.destroy();modal.destroy();drawer.destroy();host.remove()}\n})()");
    for(const name of ['modalEnter','modalLeave','drawerEnter','drawerLeave','imageEnter','imageLeave']){
      const data=timings[name];
      assert.ok(data&&Number.isFinite(data.syncMs)&&Number.isFinite(data.firstFrameMs)&&Number.isFinite(data.maxGapMs),'timing recorded for '+name);
    }
    console.log('[Stage5 overlay-frame-profile] '+JSON.stringify(timings));
  });

  await step('Stage5 visible cross-month range clips and 2026-07-27 to 08-02 week endpoints',async()=>{
    const got=await evaluate("(async()=>{\n const d=document.querySelector('[data-create-frame]').contentDocument,w=d.defaultView,Q=w.QXFRAME9A7C2;\n const host=d.createElement('div');host.style.cssText='position:absolute;left:-2500px;top:0;width:80rem';d.body.append(host);\n const made=[],make=o=>{const slot=d.createElement('div');host.append(slot);const x=Q.Components.DatePicker.create({...o,container:slot,open:true});made.push(x);return x};\n const col=cell=>{const date=cell&&cell.textContent.trim(),cs=cell&&w.getComputedStyle(cell.querySelector('.qxframe9a7c2-calendar-cell-inner'));return {date,bg:cs?.backgroundColor,ink:cs?.color,classes:cell?.className}};\n try{\n  const wk=make({unit:'week',value:'2026-W31',weekStartsOn:1});\n  const wc=wk.getCalendar();wc.setViewValue(new Date(2026,7,1),{silent:true,source:'qa'});\n  const wr=wc.getRootElement(),wends=[...wr.querySelectorAll('.qxframe9a7c2-calendar-cell.is-range-start,.qxframe9a7c2-calendar-cell.is-range-end')],wselected=[...wr.querySelectorAll('.qxframe9a7c2-calendar-cell.is-week-selected')];\n  const r=make({unit:'date',selection:'range',value:['2026-09-28','2026-10-05'],weekStartsOn:1});\n  const rangeCals=r.getCalendars(),parts=rangeCals.flatMap(c=>[...c.getRootElement().querySelectorAll('.qxframe9a7c2-calendar-cell')]);\n  const clipStart=parts.filter(x=>x.classList.contains('is-range-clip-start')),clipEnd=parts.filter(x=>x.classList.contains('is-range-clip-end'));\n  const selected=parts.filter(x=>x.classList.contains('is-range-start')||x.classList.contains('is-range-end'));\n  return {wk:{count:wselected.length,start:wends.filter(x=>x.classList.contains('is-range-start')).map(col),end:wends.filter(x=>x.classList.contains('is-range-end')).map(col),range:wselected.filter(x=>x.classList.contains('is-in-range')).length},date:{clipsStart:clipStart.map(col),clipsEnd:clipEnd.map(col),falseCaps:clipStart.concat(clipEnd).filter(x=>x.classList.contains('is-selected')).length,selected:selected.map(col)}};\n }finally{made.forEach(x=>x.destroy());host.remove()}\n})()");
    assert.equal(got.wk.count,7,'week must paint all seven dates including displayed adjacent-month days');
    assert.equal(got.wk.range,7,'week uses continuous range band');
    assert.equal(got.wk.start.length,1,'exactly one real week start');
    assert.equal(got.wk.end.length,1,'exactly one real week end');
    for(const endpoint of got.wk.start.concat(got.wk.end))
      assert.ok(endpoint.bg&&endpoint.bg!=='rgba(0, 0, 0, 0)'&&endpoint.bg!=='transparent','cross-month endpoint retains solid background: '+JSON.stringify(endpoint));
    assert.ok(got.date.clipsStart.length>0&&got.date.clipsEnd.length>0,'both month panels mark visible range strip cuts: '+JSON.stringify(got.date));
    assert.equal(got.date.falseCaps,0,'visual month cuts do not become selected endpoints');
  });

  await step('Stage5 CSS Theme controls Dropdown, Select, List and submenu inset without JS',async()=>{
    const got=await evaluate("(async () => {\n const doc=document.querySelector('[data-create-frame]').contentDocument,win=doc.defaultView,q=win.QXFRAME9A7C2;\n if(!q?.Components?.Dropdown||!q?.Components?.Select||!q?.BuildingBlocks?.List)return {error:'list family unavailable',components:!!q?.Components,buildingBlocks:!!q?.BuildingBlocks};\n const btn=doc.createElement('button');btn.textContent='Menu';doc.body.append(btn);\n const host=doc.createElement('div');doc.body.append(host);\n const root=doc.documentElement;\n const oldX=root.style.getPropertyValue('--qxframe9a7c2-theme-list-padding-x');\n const oldY=root.style.getPropertyValue('--qxframe9a7c2-theme-list-padding-y');\n const drop=q.Components.Dropdown.create({reference:btn,submenuTrigger:'click',submenuOpenDelay:0,items:[{key:'branch',value:'branch',label:'Branch',items:[{key:'child',value:'child',label:'Child'}]},{key:'action',value:'action',label:'Action'}]});\n const select=q.Components.Select.create({container:host,items:[{key:'a',value:'a',label:'Alpha'},{key:'b',value:'b',label:'Beta'}],open:true});\n const listHost=doc.createElement('div');host.append(listHost);\n const list=q.BuildingBlocks.List.create({container:listHost,items:[{key:'x',value:'x',label:'X'}]});\n const settle=()=>new Promise(done=>win.requestAnimationFrame(()=>win.requestAnimationFrame(done)));\n const check=panel=>{\n  const css=win.getComputedStyle(panel),item=panel.querySelector('.qxframe9a7c2-item-collection-item,.qxframe9a7c2-list-item,.qxframe9a7c2-menu-item');\n  return {x:css.paddingLeft,xEnd:css.paddingRight,y:css.paddingTop,yEnd:css.paddingBottom,\n   radius:item?win.getComputedStyle(item).borderTopLeftRadius:null,\n   classes:panel.className};\n };\n try {\n  await Promise.resolve(drop.open('theme-padding'));await Promise.resolve(select.setOpen(true,'theme-padding'));await settle();\n  const panel=drop.getPopupElement(),selectPanel=select.getPopupElement?select.getPopupElement():null;\n  if(!selectPanel||!selectPanel.isConnected||selectPanel.hidden||win.getComputedStyle(selectPanel).display==='none')return {error:'Select popup not mounted and visible',state:select.getState(),connected:!!selectPanel?.isConnected,hidden:selectPanel?.hidden};\n  root.style.setProperty('--qxframe9a7c2-theme-list-padding-x','0rem');\n  root.style.setProperty('--qxframe9a7c2-theme-list-padding-y','0.5rem');\n  await settle(); const flush={drop:check(panel),select:check(selectPanel),list:check(list.getRootElement())};\n  const row=panel.querySelector('.has-submenu');if(!row)return {error:'no submenu row',flush};\n  row.click();await new Promise(done=>win.setTimeout(done,180));\n  const sub=[...doc.querySelectorAll('.qxframe9a7c2-dropdown-submenu-panel')].find(n=>n.isConnected&&!n.hidden);\n  const submenu=sub?check(sub):null;\n  root.style.setProperty('--qxframe9a7c2-theme-list-padding-x','0.375rem');\n  await settle(); const inset={drop:check(panel),select:check(selectPanel),list:check(list.getRootElement()),submenu:sub?check(sub):null};\n  let rejects=false;try{drop.updateOptions({inset:'all'})}catch(e){rejects=true}\n  return {flush,submenu,inset,rejects};\n }finally{\n  if(oldX)root.style.setProperty('--qxframe9a7c2-theme-list-padding-x',oldX);else root.style.removeProperty('--qxframe9a7c2-theme-list-padding-x');\n  if(oldY)root.style.setProperty('--qxframe9a7c2-theme-list-padding-y',oldY);else root.style.removeProperty('--qxframe9a7c2-theme-list-padding-y');\n  drop.destroy();select.destroy();list.destroy();host.remove();btn.remove();\n }\n})()");
    assert.equal(got.error,undefined,'shared list-family owners mounted: '+JSON.stringify(got));
    for(const kind of ['drop','select','list']){
      assert.equal(got.flush[kind].x,'0px',kind+' flush x');
      assert.equal(got.flush[kind].xEnd,'0px',kind+' flush right x');
      assert.equal(got.flush[kind].y,'8px',kind+' independently themed y');
      assert.equal(got.flush[kind].radius,'0px',kind+' flush item corners');
      assert.equal(got.inset[kind].x,'6px',kind+' all-sides themed x');
      assert.equal(got.inset[kind].xEnd,'6px',kind+' all-sides right');
    }
    assert.ok(got.submenu,'Dropdown submenu must be present');
    assert.equal(got.submenu.x,'0px','submenu follows vertical-only CSS Theme');
    assert.equal(got.submenu.radius,'0px','submenu item corners flush at x=0');
    assert.equal(got.inset.submenu.x,'6px','submenu follows all-sided Theme without reinsertion');
    assert.equal(got.rejects,true,'removed JS inset option is rejected');
  });

  await step('Stage5 Tags editable surface uses Theme dimensions and ScrollLock does not shift page',async()=>{
    const got=await evaluate("(async()=>{\n  const doc=document.querySelector('[data-create-frame]').contentDocument,win=doc.defaultView,cs=n=>win.getComputedStyle(n),q=win.QXFRAME9A7C2;\n  const host=doc.createElement('div');doc.body.append(host);\n  const tags=q.Components.Tags.create({container:host,items:[{key:'alpha',value:'alpha',label:'alpha'}],editable:true,closable:true});\n  const chip=host.querySelector('.qxframe9a7c2-tag:not(.qxframe9a7c2-tags-add)');\n  const add=tags.getAddTriggerElement();\n  if(add)add.click();\n  await new Promise(done=>win.requestAnimationFrame(done));\n  const input=tags.getInputElement(),inputStyle=input&&cs(input),chipStyle=chip&&cs(chip);\n  const tagState={chipRadius:chipStyle?.borderTopLeftRadius,inputRadius:inputStyle?.borderTopLeftRadius,inputWidth:inputStyle?.borderTopWidth,\n    configuredWidth:cs(host).getPropertyValue('--_qxframe9a7c2-control-border-width').trim(),fieldColor:inputStyle?.borderTopColor};\n  tags.destroy();host.remove();\n  const beforeWidth=win.innerWidth-doc.documentElement.clientWidth;\n  const current=doc.createElement('div');current.style.cssText='position:fixed;left:50%;top:3px;width:10px;height:10px';doc.body.append(current);\n  const baseline=current.getBoundingClientRect().left;\n  const modal=q.Components.Modal.create({document:doc,portalContainer:doc.body,title:'Scroll geometry',content:'Overlay probe',autoOpen:false,lockScroll:true});\n  let scroll;\n  try{\n    await Promise.resolve(modal.open('scroll-geometry'));\n    await new Promise(done=>win.requestAnimationFrame(()=>win.requestAnimationFrame(done)));\n    scroll={gutter:cs(doc.documentElement).scrollbarGutter,overflow:cs(doc.documentElement).overflow,left:current.getBoundingClientRect().left-baseline,\n      compositor:cs(modal.getDialogElement()).willChange};\n  }finally{modal.destroy();current.remove()}\n  return {tags:tagState,scroll,beforeWidth,defaultAnimation:modal.options.animation};\n})()");
    assert.equal(got.tags.inputRadius,got.tags.chipRadius,'Tag editor radius follows the same Theme Tag radius');
    assert.ok(parseFloat(got.tags.inputWidth)>=0,'Tag editor border width is resolved');
    assert.equal(got.defaultAnimation,'zoom','Modal defaults to compositor center zoom');
    assert.equal(got.scroll.overflow,'hidden','Modal locks root document scrolling');
    assert.ok(Math.abs(got.scroll.left)<1,'scroll lock does not move fixed centered content');
    if(got.beforeWidth>0)assert.equal(got.scroll.gutter,'stable','layout scrollbars reserve a stable gutter instead of padding compensation');
    assert.match(got.scroll.compositor,/transform/,'dialog is promoted for transform-only motion');
  });

  await step('Stage5 Alert/Dropdown/Tags appearance and Image Preview chrome/leave lifecycle',async()=>{
    const result=await evaluate(`(async()=>{
      const d=document.querySelector('[data-create-frame]').contentDocument,win=d.defaultView;
      const q=win.QXFRAME9A7C2,theme=window.QXFRAME9A7C2_CREATE;
      if(!q?.Components?.Image||!q?.Components?.Tags)return {error:'Image/Tags runtime unavailable'};
      const host=d.createElement('section');host.style.cssText='position:absolute;left:-4000px;top:0';d.body.append(host);
      const alert=(classes)=>{const n=d.createElement('section');n.className='qxframe9a7c2-alert-root '+classes;
        n.innerHTML='<div class="qxframe9a7c2-alert-wrapper"><span class="qxframe9a7c2-alert-icon">!</span>Alert content</div>';host.append(n);return n;};
      const success=alert('is-outline is-success'),error=alert('is-outline is-error'),muted=alert('is-muted is-warning'),shadow=alert('is-shadow is-info');
      const head=d.createElement('section');head.className='qxframe9a7c2-dropdown-panel';head.innerHTML='<div class="qxframe9a7c2-item-collection"><div class="qxframe9a7c2-item-collection-group">Group</div><div class="qxframe9a7c2-item-collection-title">Title</div></div>';host.append(head);
      const chipHost=d.createElement('div');host.append(chipHost);
      const tags=q.Components.Tags.create({container:chipHost,items:[{key:'one',value:'one',label:'One'}],editable:true,variant:'filled',creatable:true});
      const imgHost=d.createElement('div');host.append(imgHost);
      const paint=d.createElement('canvas');paint.width=120;paint.height=80;
      const ctx=paint.getContext('2d');ctx.fillStyle='#1969ef';ctx.fillRect(0,0,120,80);
      const source=paint.toDataURL('image/png'); // accepted by URLPolicy; SVG data URIs are forbidden.
      const img=q.Components.Image.create({container:imgHost,src:source,alt:'Preview visibility',preview:true,width:120,height:80});
      const cs=n=>win.getComputedStyle(n),colors=[];
      const docRoot=d.documentElement,sty=d.getElementById('qxframe9a7c2-create-theme');
      const oldCss=sty?.textContent,wasDark=docRoot.classList.contains('dark');
      const styles=['vega','nova','maia','lyra','mira','luma','sera','rhea'];
      try{
        for(const style of styles)for(const dark of [false,true]){
          docRoot.classList.toggle('dark',dark);
          if(sty)sty.textContent=theme.compileTheme({...theme.state.config,style},{generatedAt:''}).body;
          const chip=chipHost.querySelector('.qxframe9a7c2-tag:not(.qxframe9a7c2-tags-add)'),add=chipHost.querySelector('.qxframe9a7c2-tags-add');
          colors.push({style,dark,success:cs(success.querySelector('.qxframe9a7c2-alert-icon')).color,error:cs(error.querySelector('.qxframe9a7c2-alert-icon')).color,
            outline:cs(success).backgroundColor,muted:cs(muted).backgroundColor,shadow:cs(shadow).boxShadow,unshadow:cs(success).boxShadow,
            groupFont:parseFloat(cs(head.querySelector('.qxframe9a7c2-item-collection-group')).fontSize),
            titleFont:parseFloat(cs(head.querySelector('.qxframe9a7c2-item-collection-title')).fontSize),
            tagBg:cs(chip).backgroundColor,addBg:cs(add).backgroundColor,tagBorder:cs(chip).borderColor,addBorder:cs(add).borderColor,tagBorderStyle:cs(chip).borderStyle,addBorderStyle:cs(add).borderStyle,tagInk:cs(chip).color,addInk:cs(add).color,tagRadius:cs(chip).borderTopLeftRadius,addRadius:cs(add).borderTopLeftRadius,
            tagHeight:chip.getBoundingClientRect().height,addHeight:add.getBoundingClientRect().height});
        }
        docRoot.classList.toggle('dark',false);
        if(sty)sty.textContent=theme.compileTheme({...theme.state.config,style:'nova'},{generatedAt:''}).body;
        img.openPreview();
        await new Promise(r=>setTimeout(r,160));
        const preview=img.getPreviewElement();
        const title=preview?.querySelector('.qxframe9a7c2-image-preview-title'),close=preview?.querySelector('.qxframe9a7c2-image-preview-close'),toolbar=preview?.querySelector('.qxframe9a7c2-image-preview-toolbar');
        const chrome={title:!!title,close:!!close,toolbar:!!toolbar,
          titleBackground:title&&cs(title).backgroundColor,closeBackground:close&&cs(close).backgroundColor,toolbarBackground:toolbar&&cs(toolbar).backgroundColor,
          titleBorder:title&&cs(title).borderColor,closeBorder:close&&cs(close).borderColor,toolbarBorder:toolbar&&cs(toolbar).borderColor,
          titleColor:title&&cs(title).color,closeColor:close&&cs(close).color,toolbarColor:toolbar&&cs(toolbar).color};
        img.closePreview('qa-exit');
        const during={sourceHidden:img.getRootElement().classList.contains('is-preview-source-hidden'),
          rootHidden:preview.hidden,previewMotionVisible:preview.querySelector('.qxframe9a7c2-image-preview-motion')?.style.visibility};
        const paintFrames=[];
        // Sample Chromium rendered frames, not only final state: a landed copy
        // cannot be hidden while the original is still fading up from opacity 0.
        for(let frame=0;frame<40;frame++){
          await new Promise(r=>win.requestAnimationFrame(r));
          const copy=preview.querySelector('.qxframe9a7c2-image-preview-motion');
          paintFrames.push({copyHidden:copy?.style.visibility==='hidden',
            originalOpacity:parseFloat(cs(img.getImageElement()).opacity),
            sourceHidden:img.getRootElement().classList.contains('is-preview-source-hidden')});
        }
        await new Promise(r=>setTimeout(r,250));
        const finished={sourceHidden:img.getRootElement().classList.contains('is-preview-source-hidden'),
          previewOpen:img.getState().previewOpen,previewPresent:img.getState().previewPresent};
        return {colors,chrome,during,paintFrames,finished};
      }finally{
        if(sty)sty.textContent=oldCss;
        docRoot.classList.toggle('dark',wasDark);
        tags.destroy();img.destroy();host.remove();
      }
    })()`);
    assert.equal(result.error,undefined,'runtime Image and Tags available');
    assert.equal(result.colors.length,16,'eight Styles x two schemes');
    for(const row of result.colors){
      const k=row.style+'/'+row.dark;
      assert.notEqual(row.success,row.error,k+' Alert success/error semantic icons differ');
      assert.notEqual(row.outline,row.muted,k+' Outline/Muted Alert surfaces differ');
      assert.notEqual(row.shadow,row.unshadow,k+' is-shadow alone enables elevation');
      assert.ok(row.groupFont<=row.titleFont+.1,k+' Dropdown Group uses ItemCollection title font size');
      assert.equal(row.tagBg,row.addBg,k+' Tags Add shares Tag background token');
      assert.equal(row.tagBorder,row.addBorder,k+' Tags Add shares Tag border color');
      assert.equal(row.tagBorderStyle,row.addBorderStyle,k+' Tags Add shares Tag border style');
      assert.equal(row.tagInk,row.addInk,k+' Tags Add shares Tag foreground');
      assert.equal(row.tagRadius,row.addRadius,k+' Tags Add shares Tag radius');
      assert.ok(Math.abs(row.tagHeight-row.addHeight)<.75,k+' Tags Add shares Tag height');
    }
    assert.ok(result.chrome.title&&result.chrome.close&&result.chrome.toolbar,'Image Preview has three chrome surfaces');
    assert.equal(result.chrome.titleBackground,result.chrome.toolbarBackground,'Image title and toolbar share control background');
    assert.equal(result.chrome.closeBackground,result.chrome.toolbarBackground,'Image close and toolbar share control background');
    assert.equal(result.chrome.titleBorder,result.chrome.toolbarBorder,'Image title and toolbar share border');
    assert.equal(result.chrome.closeBorder,result.chrome.toolbarBorder,'Image close and toolbar share border');
    assert.equal(result.chrome.titleColor,result.chrome.toolbarColor,'Image title and toolbar share white foreground');
    assert.equal(result.chrome.closeColor,result.chrome.toolbarColor,'Image close and toolbar share white foreground');
    assert.equal(result.during.sourceHidden,false,'independent center-zoom preview does not hide original image during leave');
    assert.ok(result.paintFrames.some(frame=>frame.copyHidden),'Chromium observed the independent preview copy become hidden at leave completion');
    assert.ok(result.paintFrames.filter(frame=>frame.copyHidden).every(frame=>frame.originalOpacity>=.98&&!frame.sourceHidden),
      'The source remains fully opaque across center-zoom leave: '+JSON.stringify(result.paintFrames));
    assert.equal(result.finished.sourceHidden,false,'authored image recovers after completed leave');
    assert.equal(result.finished.previewOpen,false,'preview public state closed');
  });

  await step('Stage5 DatePicker delegates week rendering to Calendar, DateTime separator is visible',async()=>{
    const got=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument,q=d.defaultView.QXFRAME9A7C2;\n const host=d.createElement('section');host.style.cssText='position:absolute;left:-4000px;top:0';d.body.append(host);\n const single=q.Components.DatePicker.create({container:host,unit:'week',value:'2026-W33',weekStartsOn:1,open:true});\n const range=q.Components.DatePicker.create({container:host,unit:'week',selection:'range',value:['2026-W33','2026-W35'],weekStartsOn:1,open:true});\n const dt=q.Components.DatePicker.create({container:host,time:true,value:'2026-08-15 09:30:00',open:true});\n try{\n  const cal=single.getCalendar(),rc=range.getCalendar(),cs=d.defaultView.getComputedStyle;\n  const separator=dt.getPanelOriginElement().querySelector('.qxframe9a7c2-date-picker-time-panel');\n  return {singleUnit:cal.getState().unit,rangeUnit:rc.getState().unit,\n   selected:cal.getRootElement().querySelectorAll('.qxframe9a7c2-calendar-cell.is-week-selected').length,\n   rangeCount:rc.getRootElement().querySelectorAll('.qxframe9a7c2-calendar-cell.is-in-range').length,\n   border:separator&&cs(separator).borderLeftWidth};\n }finally{single.destroy();range.destroy();dt.destroy();host.remove()}\n})()");
    assert.equal(got.singleUnit,'week','DatePicker passes week to canonical Calendar');
    assert.equal(got.rangeUnit,'week','range DatePicker passes week to the same Calendar');
    assert.equal(got.selected,7,'a selected week paints seven cells');
    assert.ok(got.rangeCount>=7,'a week range uses the same continuous Range painter');
    assert.equal(got.border,'1px','DateTime retains Theme boundary between Calendar and TimePanel');
  });

  await step('CALENDAR-WHEEL-GEOMETRY-001 browser shared 36px, seven rows, dual and drill',async()=>{
    const v=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument;\n const q=d.defaultView.QXFRAME9A7C2,DP=q&&q.Components&&q.Components.DatePicker,WP=q&&q.BuildingBlocks&&q.BuildingBlocks.WheelPanel;\n if(!DP)return {error:'DatePicker unavailable'};\n const box=d.createElement('section');box.style.cssText='position:absolute;left:-4000px;top:0;width:60rem';\n d.body.append(box);const made=[];\n const near=(v,n)=>Math.abs(v-n)<.75;\n const make=(opts)=>{const mount=d.createElement('div');box.append(mount);const c=DP.create({...opts,container:mount,open:true});made.push(c);return c;};\n const measure=(c)=>{\n   const shell=c.getPanelOriginElement(),cal=c.getCalendar(),cals=c.getCalendars();\n   const time=c.getTimePanel(),wheel=time&&time.getWheelPanel(),w=wheel&&wheel.getRootElement();\n   const scroll=w&&w.querySelector('.qxframe9a7c2-wheel-panel-scroll');\n   const item=w&&w.querySelector('.qxframe9a7c2-wheel-panel-item'),guide=w&&w.querySelector('.qxframe9a7c2-wheel-panel-center-guide');\n   const pad=w&&w.querySelector('.qxframe9a7c2-wheel-panel-pad');\n   const host=shell&&shell.querySelector('.qxframe9a7c2-date-picker-calendar-host');\n   const grid=cal&&cal.getRootElement().querySelector('.qxframe9a7c2-calendar-grid');\n   const firstCell=grid&&grid.querySelector('.qxframe9a7c2-calendar-cell');\n   const cs=n=>n?d.defaultView.getComputedStyle(n):null;\n   const wh=n=>n?n.getBoundingClientRect().height:null;\n   const ww=n=>n?n.getBoundingClientRect().width:null;\n   return {\n     wheelCount:wheel&&wheel.getState().visibleItemCount,itemHeight:wh(item),scrollHeight:wh(scroll),guideHeight:wh(guide),\n     padHeight:wh(pad), itemInline:item&&item.style.height, centerDelta:scroll&&guide&&item?(guide.getBoundingClientRect().top+wh(guide)/2-scroll.getBoundingClientRect().top-wh(scroll)/2):null,\n     calendarWidth:ww(cal&&cal.getRootElement()),hostWidth:ww(host),gridWidth:ww(grid),dayWidth:ww(firstCell),dayHeight:wh(firstCell),\n     columns:cals.map(p=>ww(p.getRootElement())),columnCount:cals.length,\n     groupMin:shell&&cs(shell.querySelector('.qxframe9a7c2-date-picker-calendar-group'))?.minWidth,\n     hostMin:cs(host)?.minWidth,\n     gap:grid&&cs(grid)?.gap,\n     scrollInline:scroll&&scroll.style.height\n   };\n };\n const results={};\n try{\n   const std=make({value:'2026-10-15 12:34:00',time:{showSecond:false},needConfirm:true});\n   results.standard=measure(std);\n   const explicit=make({value:'2026-10-15 12:34:00',time:{showSecond:false,visibleItemCount:5},needConfirm:true});\n   results.custom=measure(explicit);\n   const dual=make({selection:'range',panelCount:2,value:['2026-10-10','2026-11-21'],needConfirm:true});\n   results.dual=measure(dual);\n   const disabled=make({value:'2026-10-15',allowYearView:false,allowMonthView:true});\n   const orig=disabled.getCalendar(),root=orig.getRootElement(),before=disabled.getState().value?.getTime();\n   const year=root.querySelector('.qxframe9a7c2-calendar-year'),month=root.querySelector('.qxframe9a7c2-calendar-month');\n   results.disabledTitle={yearDisabled:year?.disabled,monthDisabled:month?.disabled};\n   month?.click();\n   results.drilled={mode:disabled.getState().panelMode,unit:orig.getState().unit,viewMode:orig.getState().viewMode,\n     rootSame:disabled.getCalendar()===orig&&disabled.getCalendar().getRootElement()===root,\n     calendarCount:root.parentNode?.querySelectorAll('.qxframe9a7c2-calendar').length,\n     valueSame:disabled.getState().value?.getTime()===before};\n   const monthCell=root.querySelector('.qxframe9a7c2-calendar-grid>.qxframe9a7c2-calendar-cell:not(:disabled)');\n   monthCell?.click();\n   results.returned={mode:disabled.getState().panelMode,viewMode:orig.getState().viewMode,unit:orig.getState().unit,valueSame:disabled.getState().value?.getTime()===before};\n   const opposite=make({value:'2026-10-15',allowYearView:true,allowMonthView:false});\n   const other=opposite.getCalendar().getRootElement();\n   results.opposite={yearDisabled:other.querySelector('.qxframe9a7c2-calendar-year')?.disabled,monthDisabled:other.querySelector('.qxframe9a7c2-calendar-month')?.disabled};\n   other.querySelector('.qxframe9a7c2-calendar-year')?.click();\n   results.yearDrill={mode:opposite.getState().panelMode,viewMode:opposite.getCalendar().getState().viewMode,\n    rootCount:other.parentNode?.querySelectorAll('.qxframe9a7c2-calendar').length};\n   const yr=other.querySelector('.qxframe9a7c2-calendar-grid>.qxframe9a7c2-calendar-cell:not(:disabled):not(.is-outside)');\n   yr?.click();\n   results.yearToMonth={mode:opposite.getState().panelMode,viewMode:opposite.getCalendar().getState().viewMode};\n   return results;\n }finally{for(const c of made)try{c.destroy()}catch(e){}box.remove();}\n})()");
    assert.equal(v.error,undefined,'runtime DatePicker exists');
    const s=v.standard;
    assert.equal(s.wheelCount,7,'DatePicker embeds 7 wheel items');
    assert.ok(Math.abs(s.itemHeight-36)<.75,'md physical item is 36px: '+JSON.stringify(s));
    assert.ok(Math.abs(s.scrollHeight-252)<.75,'WheelPanel computes 7x36 viewport 252px: '+JSON.stringify(s));
    assert.ok(Math.abs(s.guideHeight-s.itemHeight)<.75,'Guide directly uses actual item height: '+JSON.stringify(s));
    assert.ok(Math.abs(s.padHeight-108)<.75,'WheelPanel calculates symmetric 108px snap pad');
    assert.equal(s.itemInline,'36px','real Wheel Item remains the CSS Guide owner');
    assert.ok(Math.abs(s.centerDelta)<.75,'guide centered in scroll');
    assert.ok(Math.abs(s.calendarWidth-262)<.75&&Math.abs(s.hostWidth-262)<.75,'host/calendar both 7*36 + 2*5 = 262px: '+JSON.stringify(s));
    assert.ok(Math.abs(s.gridWidth-252)<.75&&Math.abs(s.dayWidth-36)<.75&&Math.abs(s.dayHeight-36)<.75,'seven complete square 36px date cells: '+JSON.stringify(s));
    assert.equal(s.gap,'0px','continuous range strips retain gap zero');
    assert.equal(s.groupMin,'0px');assert.equal(s.hostMin,'0px');
    assert.equal(v.custom.wheelCount,5,'explicit count priority');
    assert.ok(Math.abs(v.custom.scrollHeight-180)<.75&&Math.abs(v.custom.padHeight-72)<.75,'explicit 5x36 and symmetric 72px pads');
    assert.equal(v.dual.columnCount,2,'dual two actually displayed calendars');
    assert.ok(v.dual.columns.every(x=>Math.abs(x-262)<.75),'dual same 262px columns '+JSON.stringify(v.dual));
    assert.equal(v.disabledTitle.yearDisabled,true);
    assert.equal(v.disabledTitle.monthDisabled,false);
    assert.deepEqual(v.drilled,{mode:'month',unit:'date',viewMode:'month',rootSame:true,calendarCount:1,valueSame:true},'month drilled within same Calendar');
    assert.deepEqual(v.returned,{mode:'date',viewMode:'date',unit:'date',valueSame:true},'month selection restores date without committing date precision');
    assert.deepEqual(v.opposite,{yearDisabled:false,monthDisabled:true},'independent header capabilities');
    assert.deepEqual(v.yearDrill,{mode:'year',viewMode:'year',rootCount:1},'year title enters same Calendar');
    assert.deepEqual(v.yearToMonth,{mode:'month',viewMode:'month'},'year pick drills to month');
  });

  await step('CALENDAR-WHEEL-7-ROW-OWNER browser five Sizes, six full weeks and numeric Calendar cellSize overrides',async()=>{
    const v=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const q=d.defaultView.QXFRAME9A7C2, DP=q?.Components?.DatePicker, Calendar=q?.BuildingBlocks?.Calendar;
      if(!DP||!Calendar)return {error:'Missing Calendar or DatePicker'};
      const container=d.createElement('section');container.style.cssText='position:absolute;left:-9999px;top:0;width:100rem';d.body.append(container);
      const out={};
      const height=el=>el?.getBoundingClientRect().height??null;
      const width=el=>el?.getBoundingClientRect().width??null;
      try {
        for(const [size,expected] of Object.entries({xs:28,sm:32,md:36,lg:40,xl:44})){
          const host=d.createElement('div');container.append(host);
          const picker=DP.create({container:host,size,value:'2026-10-15 12:34:00',time:{showSecond:false},needConfirm:true,open:true});
          try{
            const root=picker.getCalendar().getRootElement(), wheel=picker.getTimePanel().getWheelPanel().getRootElement();
            const header=root.querySelector('.qxframe9a7c2-calendar-header'),weekday=root.querySelector('.qxframe9a7c2-calendar-weekdays');
            const grid=root.querySelector('.qxframe9a7c2-calendar-grid'),cell=grid.querySelector('.qxframe9a7c2-calendar-cell');
            const title=wheel.querySelector('.qxframe9a7c2-wheel-panel-column-title');
            const item=wheel.querySelector('.qxframe9a7c2-wheel-panel-item'),scroll=wheel.querySelector('.qxframe9a7c2-wheel-panel-scroll');
            out[size]={expected,header:height(header),weekday:height(weekday),grid:height(grid),cellH:height(cell),cellW:width(cell),gridW:width(grid),calendarW:width(root),title:height(title),item:height(item),scroll:height(scroll),calendarH:height(root),wheelH:height(wheel),dates:grid.children.length};
          }finally{picker.destroy();host.remove();}
        }
        const mount=d.createElement('div');container.append(mount);
        const standalone=Calendar.create({container:mount,cellSize:34,size:'sm',value:new d.defaultView.Date(2026,9,15)});
        try{
          const root=standalone.getRootElement(),cell=root.querySelector('.qxframe9a7c2-calendar-cell');
          out.explicit={before:height(cell),width:width(root)};
          standalone.updateOptions({cellSize:38});
          out.explicit.after=height(root.querySelector('.qxframe9a7c2-calendar-cell'));
        }finally{standalone.destroy();}
        return out;
      }finally{container.remove();}
    })()`);
    assert.equal(v.error,undefined,'Calendar and DatePicker available');
    for(const size of ['xs','sm','md','lg','xl']){
      const a=v[size],s=a.expected;
      assert.ok(Math.abs(a.cellH-s)<.75&&Math.abs(a.cellW-s)<.75,size+' square CellSize '+JSON.stringify(a));
      assert.ok(Math.abs(a.weekday-s)<.75&&Math.abs(a.item-s)<.75,size+' shared weekday/item size '+JSON.stringify(a));
      assert.equal(a.dates,42,size+' exactly six calendar weeks');
      assert.ok(Math.abs(a.grid-s*6)<.75&&Math.abs(a.scroll-s*7)<.75,size+' 6+1 date rows match 7 visible Wheel rows');
      assert.ok(Math.abs(a.header-a.title)<.75,size+' Header and Wheel Column Title exterior height equal '+JSON.stringify(a));
      assert.ok(Math.abs(a.calendarH-a.wheelH)<.75,size+' total Calendar/Wheel heights match '+JSON.stringify(a));
      assert.ok(Math.abs(a.calendarW-(7*s+10))<.75&&Math.abs(a.gridW-7*s)<.75,size+' Calendar width from 7 Cells + horizontal padding');
    }
    assert.ok(Math.abs(v.explicit.before-34)<.75&&Math.abs(v.explicit.after-38)<.75,'standalone Calendar cellSize and updateOptions');
  });

  await step('Stage5 Calendar/Wheel 8 Styles x light/dark x five Sizes: actual seven-row geometry',async()=>{
    const actual=await evaluate(`(() => {
      const d=document.querySelector('[data-create-frame]').contentDocument;
      const app=window.QXFRAME9A7C2_CREATE,q=d.defaultView.QXFRAME9A7C2;
      const DP=q?.Components?.DatePicker;
      if(!DP||!app?.compileTheme)return {error:'DatePicker or Theme compiler unavailable'};
      const originalDark=d.documentElement.classList.contains('dark');
      const sheet=d.createElement('style'),fixture=d.createElement('section'),pickers=[];
      fixture.style.cssText='position:absolute;left:-5000px;top:0;display:flex;gap:1rem';
      d.head.append(sheet);d.body.append(fixture);
      const height=n=>n?.getBoundingClientRect().height??NaN;
      const width=n=>n?.getBoundingClientRect().width??NaN;
      const sizes={xs:28,sm:32,md:36,lg:40,xl:44},rows=[];
      try{
        for(const [size,expected] of Object.entries(sizes)){
          const host=d.createElement('div');fixture.append(host);
          const picker=DP.create({container:host,size,value:'2026-10-15 12:34:00',time:{showSecond:false},needConfirm:true,open:true});
          pickers.push({picker,size,expected});
        }
        for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea']){
          sheet.textContent=app.compileTheme({...app.state.config,style},{generatedAt:''}).body;
          for(const dark of [false,true]){
            d.documentElement.classList.toggle('dark',dark);
            for(const {picker,size,expected} of pickers){
              const cal=picker.getCalendar()?.getRootElement();
              const wheel=picker.getTimePanel()?.getWheelPanel()?.getRootElement();
              const day=cal?.querySelector('.qxframe9a7c2-calendar-cell');
              const grid=cal?.querySelector('.qxframe9a7c2-calendar-grid');
              const weekday=cal?.querySelector('.qxframe9a7c2-calendar-weekdays');
              const heading=cal?.querySelector('.qxframe9a7c2-calendar-header');
              const title=wheel?.querySelector('.qxframe9a7c2-wheel-panel-column-title');
              const scroll=wheel?.querySelector('.qxframe9a7c2-wheel-panel-scroll');
              const item=wheel?.querySelector('.qxframe9a7c2-wheel-panel-item');
              const guide=wheel?.querySelector('.qxframe9a7c2-wheel-panel-center-guide');
              const host=cal?.closest('.qxframe9a7c2-date-picker-calendar-host');
              rows.push({style,dark,size,expected,day:height(day),dayWidth:width(day),
                weekday:height(weekday),grid:height(grid),gridWidth:width(grid),
                header:height(heading),title:height(title),scroll:height(scroll),
                item:height(item),guide:height(guide),calendar:height(cal),wheel:height(wheel),
                calendarWidth:width(cal),hostWidth:width(host),weekCount:grid?.children.length,
                scrollClient:scroll?.clientHeight??0,scrollOverflow:scroll?.scrollHeight??0});
            }
          }
        }
        return {rows};
      }finally{
        pickers.forEach(({picker})=>picker.destroy());
        fixture.remove();sheet.remove();
        d.documentElement.classList.toggle('dark',originalDark);
      }
    })()`);
    assert.equal(actual.error,undefined,'DatePicker and Theme compiler available');
    assert.equal(actual.rows.length,80,'8 styles x 2 modes x 5 sizes');
    for(const row of actual.rows){
      const {expected:s}=row, label=row.style+'/'+(row.dark?'dark':'light')+'/'+row.size;
      const approx=(a,b,part)=>assert.ok(Number.isFinite(a)&&Math.abs(a-b)<.75,label+' '+part+': '+a+' vs '+b);
      approx(row.day,s,'day height');approx(row.dayWidth,s,'day width');
      approx(row.weekday,s,'weekday height');approx(row.item,s,'wheel item');
      approx(row.guide,s,'guide follows item');approx(row.grid,s*6,'six day rows');
      approx(row.gridWidth,s*7,'seven date columns');
      approx(row.scroll,s*7,'seven wheel items viewport');
      approx(row.header,row.title,'header equals wheel title');
      approx(row.calendar,row.wheel,'total calendar/wheel height');
      approx(row.calendarWidth,7*s+10,'calendar derives width');
      approx(row.hostWidth,row.calendarWidth,'host matches calendar width');
      assert.equal(row.weekCount,42,label+' fixed six-week Calendar DOM');
      assert.ok(row.scrollOverflow>=row.scrollClient,label+' Wheel scroll not physically undersized');
    }
  });

  await step('CALENDAR-RANGE-VISUAL-001 real Calendar wrappers/pseudo geometry and delegated click in page/popup light/dark',async()=>{
    const value=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument;\n const q=d.defaultView.QXFRAME9A7C2,app=window.QXFRAME9A7C2_CREATE;\n if(!q?.BuildingBlocks?.Calendar?.create)return {error:'Real Calendar BuildingBlock unavailable'};\n const savedDark=d.documentElement.classList.contains('dark'),theme=d.createElement('style');\n const holder=d.createElement('div');holder.style.cssText='position:absolute;left:-3000px;top:0;width:44rem;display:flex;gap:1rem';\n const plain=d.createElement('div'),popup=d.createElement('div');\n popup.className='qxframe9a7c2-popup-surface qxframe9a7c2-picker-field-panel';\n holder.append(plain,popup);d.body.append(holder);d.head.append(theme);\n const callbacks=[],instances=[];\n const range=(date)=>{\n   const inMonth=date.getFullYear()===2026&&date.getMonth()===9;\n   const day=date.getDate();\n   return {selected:inMonth&&(day===1||day===7),inRange:inMonth&&day>=1&&day<=7,rangeStart:inMonth&&day===1,rangeEnd:inMonth&&day===7};\n };\n const results=[];\n try {\n   for(const [key,host] of [['standalone',plain],['popup',popup]]){\n     const calendar=q.BuildingBlocks.Calendar.create({\n       container:host,document:d,viewValue:new Date(2026,9,1),value:new Date(2026,9,1),\n       getCellState:range,\n       renderCell:(date)=>{const span=d.createElement('span');span.textContent=String(date.getDate());return span;},\n       onSelect:(date)=>callbacks.push({key,day:date.getDate(),month:date.getMonth()})\n     });\n     instances.push(calendar);\n   }\n   const select=(root,day)=>{\n     return [...root.querySelectorAll('.qxframe9a7c2-calendar-grid>.qxframe9a7c2-calendar-cell')]\n       .find(b=>b.textContent.trim()===String(day)&&!b.classList.contains('is-outside'));\n   };\n   for(const dark of [false,true])\n   for(const accent of ['subtle','bold']){\n     d.documentElement.classList.toggle('dark',dark);\n     theme.textContent=app.compileTheme({...app.state.config,style:'nova',menuAccent:accent},{generatedAt:''}).body;\n     for(const [key,host] of [['standalone',plain],['popup',popup]]){\n       const grid=host.querySelector('.qxframe9a7c2-calendar-grid');\n       const cells=grid.querySelectorAll(':scope>.qxframe9a7c2-calendar-cell');\n       const start=select(host,1),middle=select(host,2),end=select(host,7),normal=select(host,12);\n       const css=(node,pseudo)=>d.defaultView.getComputedStyle(node,pseudo);\n       const sample=cell=>{\n         const view=cell?.firstElementChild,inner=view?.firstElementChild,ps=cell?css(cell,'::before'):null;\n         const rc=inner?.getBoundingClientRect(),r=cell?.getBoundingClientRect();\n         return {\n           childCount:cell?.childElementCount,viewClass:view?.className,innerClass:inner?.className,\n           children:view?.childElementCount,buttonTag:cell?.tagName,spanCount:inner?.querySelectorAll('span').length,\n           beforeContent:ps?.content,beforePosition:ps?.position,beforeBg:ps?.backgroundColor,\n           beforeWidth:ps?parseFloat(ps.width):null,beforeLeft:ps?parseFloat(ps.left):null,\n           width:r?.width,innerWidth:rc?.width,innerHeight:rc?.height,\n           outerBg:cell?css(cell).backgroundColor:null,innerBg:inner?css(inner).backgroundColor:null,\n           innerZ:inner?css(inner).zIndex:null\n         };\n       };\n       results.push({dark,accent,key,cellCount:cells.length,gridGap:css(grid).gap,start:sample(start),middle:sample(middle),end:sample(end),normal:sample(normal)});\n     }\n   }\n   const target=select(popup,5);const span=target?.querySelector('.qxframe9a7c2-calendar-cell-inner span');\n   span?.click();\n   return {results,clicked:callbacks.some(c=>c.key==='popup'&&c.day===5&&c.month===9)};\n } finally {\n   for(const instance of instances)try{instance.destroy()}catch(_){}\n   holder.remove();theme.remove();d.documentElement.classList.toggle('dark',savedDark);\n }\n})()");
    assert.equal(value.error,undefined,'real Calendar must be available in preview runtime');
    assert.equal(value.results.length,8,'standalone/popup x Light/Dark x subtle/bold');
    for(const r of value.results){
      const key=[r.key,r.dark,r.accent].join('/');
      assert.equal(r.cellCount,42,key+' standard 6-week Calendar renders all 42 dates');
      assert.equal(r.gridGap,'0px',key+' Calendar has zero gaps');
      for(const [name,cell] of Object.entries({start:r.start,middle:r.middle,end:r.end,normal:r.normal})){
        assert.equal(cell.buttonTag,'BUTTON',key+'/'+name+' original button is the calendarDate owner');
        assert.equal(cell.childCount,1,key+'/'+name+' only view child added');
        assert.equal(cell.children,1,key+'/'+name+' only inner child of view');
        assert.equal(cell.viewClass,'qxframe9a7c2-calendar-cell-view',key+'/'+name+' view class');
        assert.equal(cell.innerClass,'qxframe9a7c2-calendar-cell-inner',key+'/'+name+' inner class');
        assert.equal(cell.spanCount,1,key+'/'+name+' renderCell content stays in inner');
        assert.equal(cell.outerBg,'rgba(0, 0, 0, 0)',key+'/'+name+' outer button is not another painter');
        assert.equal(cell.innerZ,'2',key+'/'+name+' inner sits above strip');
        assert.ok(Math.abs(cell.innerWidth-cell.innerHeight)<2,key+'/'+name+' inner ratio 1:1');
      }
      for(const [name,expectedLeft,expectedWidth] of [['start',.5,.5],['middle',0,1],['end',0,.5]]){
        const cell=r[name];
        assert.equal(cell.beforePosition,'absolute',key+'/'+name+' strip CSS-only');
        assert.notEqual(cell.beforeContent,'none',key+'/'+name+' strip pseudo generated');
        assert.notEqual(cell.beforeBg,'rgba(0, 0, 0, 0)',key+'/'+name+' strip color visible');
        assert.ok(Math.abs(cell.beforeWidth/cell.width-expectedWidth)<.06,key+'/'+name+' correct half/full strip width');
        assert.ok(Math.abs(cell.beforeLeft/cell.width-expectedLeft)<.06,key+'/'+name+' correct half/full strip offset');
      }
      assert.equal(r.normal.beforeContent,'none',key+' no range pseudo for ordinary date');
      assert.notEqual(r.start.innerBg,'rgba(0, 0, 0, 0)',key+' selected start painted on inner square');
      assert.equal(r.middle.innerBg,'rgba(0, 0, 0, 0)',key+' range middle has no separate inner fill');
    }
    assert.ok(value.clicked,'renderCell child click bubbles to original Calendar event delegate');
  });

  await step('Stage5 shared WheelPanel / WheelPicker / TimePicker guide and unified passive dividers: 8 Styles x 2 schemes x 4 Menu modes x 2 accents',async()=>{
    const rows=await evaluate("(() => {\n  const d=document.querySelector('[data-create-frame]').contentDocument;\n  const h=d.documentElement,api=window.QXFRAME9A7C2_CREATE;\n  const wasDark=h.classList.contains('dark'),orig=api.state.config;\n  const host=d.createElement('section'),sheet=d.createElement('style');\n  host.style.cssText='position:absolute;left:-10000px;top:0;width:28rem';\n  const wheel=(kind)=>'<div class=\"qxframe9a7c2-wheel-panel\" data-wheel=\"'+kind+'\"><div class=\"qxframe9a7c2-wheel-panel-columns\"><div class=\"qxframe9a7c2-wheel-panel-column\"><div class=\"qxframe9a7c2-wheel-panel-item is-selected\">20</div></div><div class=\"qxframe9a7c2-wheel-panel-column\"><div class=\"qxframe9a7c2-wheel-panel-item is-selected\">30</div></div></div><div class=\"qxframe9a7c2-wheel-panel-center-guide\"></div></div>';\n  host.innerHTML='<div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-picker-field-panel\">'\n    +wheel('panel')\n    +'<div class=\"qxframe9a7c2-wheel-picker-popup\">'+wheel('picker')+'</div>'\n    +'<div class=\"qxframe9a7c2-time-panel-root\"><div class=\"qxframe9a7c2-time-panel-wrapper\">'+wheel('time')+'</div></div>'\n    +'<div class=\"qxframe9a7c2-cascader-columns\"><div class=\"qxframe9a7c2-cascader-column\">A</div><div class=\"qxframe9a7c2-cascader-column\">B</div></div>'\n    +'<button class=\"qxframe9a7c2-time-picker-now\">Now</button>'\n    +'<i data-accent style=\"background:var(--qxframe9a7c2-theme-menu-accent);color:var(--qxframe9a7c2-theme-menu-accent-foreground)\"></i>'\n    +'<i data-field-edge style=\"border-top:1px solid var(--qxframe9a7c2-theme-field-border)\"></i>'\n    +'</div>';\n  d.body.append(host);d.head.append(sheet);\n  const get=(sel)=>d.defaultView.getComputedStyle(host.querySelector(sel));\n  const samples=[];\n  try {\n    for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])\n    for(const dark of [false,true])\n    for(const menuColor of ['default','default-translucent','inverted','inverted-translucent'])\n    for(const menuAccent of ['subtle','bold']){\n      h.classList.toggle('dark',dark);\n      sheet.textContent=api.compileTheme({...orig,style,menuColor,menuAccent},{generatedAt:''}).body;\n      const accent=get('[data-accent]'),border=get('[data-field-edge]').borderTopColor;\n      samples.push({style,dark,menuColor,menuAccent,accentBg:accent.backgroundColor,accentInk:accent.color,edge:border,\n        panelBg:get('[data-wheel=\"panel\"] .qxframe9a7c2-wheel-panel-center-guide').backgroundColor,\n        pickerBg:get('[data-wheel=\"picker\"] .qxframe9a7c2-wheel-panel-center-guide').backgroundColor,\n        timeBg:get('[data-wheel=\"time\"] .qxframe9a7c2-wheel-panel-center-guide').backgroundColor,\n        panelBorder:get('[data-wheel=\"panel\"] .qxframe9a7c2-wheel-panel-center-guide').borderTopColor,\n        pickerBorder:get('[data-wheel=\"picker\"] .qxframe9a7c2-wheel-panel-center-guide').borderTopColor,\n        timeBorder:get('[data-wheel=\"time\"] .qxframe9a7c2-wheel-panel-center-guide').borderTopColor,\n        panelInk:get('[data-wheel=\"panel\"] .qxframe9a7c2-wheel-panel-item.is-selected').color,\n        pickerInk:get('[data-wheel=\"picker\"] .qxframe9a7c2-wheel-panel-item.is-selected').color,\n        timeInk:get('[data-wheel=\"time\"] .qxframe9a7c2-wheel-panel-item.is-selected').color,\n        wheelDivider:get('[data-wheel=\"panel\"] .qxframe9a7c2-wheel-panel-column + .qxframe9a7c2-wheel-panel-column').borderLeftColor,\n        cascaderDivider:get('.qxframe9a7c2-cascader-column').borderRightColor,\n        timeNowDivider:get('.qxframe9a7c2-time-picker-now').borderTopColor\n      });\n    }\n  } finally {h.classList.toggle('dark',wasDark);host.remove();sheet.remove();}\n  return samples;\n})()");
    assert.equal(rows.length,128,'Style x page scheme x Menu mode x subtle/bold');
    for(const r of rows){
      const k=[r.style,r.dark,r.menuColor,r.menuAccent].join('/');
      for(const name of ['panelBg','pickerBg','timeBg','panelBorder','pickerBorder','timeBorder'])
        assert.equal(r[name],r.accentBg,k+' '+name+' uses one Theme accent painter');
      for(const name of ['panelInk','pickerInk','timeInk'])
        assert.equal(r[name],r.accentInk,k+' '+name+' pairs with guide background');
      for(const name of ['wheelDivider','cascaderDivider','timeNowDivider'])
        assert.equal(r[name],r.edge,k+' '+name+' shares Theme Field border');
      assert.notEqual(r.accentBg,'rgba(0, 0, 0, 0)',k+' guide remains visible');
      if(r.menuAccent==='bold')assert.notEqual(r.accentInk,r.accentBg,k+' bold text must contrast accent');
    }
  });

  await step('WHEEL-GUIDE-STACK-001 real sibling Scroll above guide: 8 Styles x 2 modes x 4 Menu modes x 2 accents',async()=>{
    const rows=await evaluate("(() => {\n const d=document.querySelector('[data-create-frame]').contentDocument;\n const h=d.documentElement,api=window.QXFRAME9A7C2_CREATE,wasDark=h.classList.contains('dark'),orig=api.state.config;\n const host=d.createElement('section'),sheet=d.createElement('style');\n host.style.cssText='position:absolute;left:-10000px;top:0;width:28rem';\n const wheel=(kind)=>'<div class=\"qxframe9a7c2-wheel-panel\" data-wheel=\"'+kind+'\"><div class=\"qxframe9a7c2-wheel-panel-columns\"><div class=\"qxframe9a7c2-wheel-panel-column\"><div class=\"qxframe9a7c2-wheel-panel-scroll\" style=\"height:12rem\"><div class=\"qxframe9a7c2-scroll\"><div class=\"qxframe9a7c2-scroll-viewport\"><div class=\"qxframe9a7c2-scroll-content\"><div class=\"qxframe9a7c2-wheel-panel-item is-selected\">09</div></div></div><div class=\"qxframe9a7c2-scroll-track qxframe9a7c2-scroll-track-y\"></div></div><div class=\"qxframe9a7c2-wheel-panel-center-guide\"></div></div></div></div></div>';\n host.innerHTML='<div class=\"qxframe9a7c2-popup-surface qxframe9a7c2-picker-field-panel\">'+wheel('panel')+'<div class=\"qxframe9a7c2-wheel-picker-popup\">'+wheel('picker')+'</div><div class=\"qxframe9a7c2-time-panel-root\"><div class=\"qxframe9a7c2-time-panel-wrapper\">'+wheel('time')+'</div></div></div>';\n d.body.append(host);d.head.append(sheet);\n const samples=[];\n try {\n for(const style of ['vega','nova','maia','lyra','mira','luma','sera','rhea'])\n for(const dark of [false,true])\n for(const menuColor of ['default','default-translucent','inverted','inverted-translucent'])\n for(const menuAccent of ['subtle','bold']){\n   h.classList.toggle('dark',dark);\n   sheet.textContent=api.compileTheme({...orig,style,menuColor,menuAccent},{generatedAt:''}).body;\n   const result={style,dark,menuColor,menuAccent};\n   for(const kind of ['panel','picker','time']){\n     const root=host.querySelector('[data-wheel=\"'+kind+'\"]');\n     const mount=root.querySelector('.qxframe9a7c2-wheel-panel-scroll');\n     const scroll=mount.querySelector(':scope > .qxframe9a7c2-scroll');\n     const guide=mount.querySelector(':scope > .qxframe9a7c2-wheel-panel-center-guide');\n     const item=scroll?.querySelector('.qxframe9a7c2-wheel-panel-item.is-selected');\n     const scrollCss=scroll&&d.defaultView.getComputedStyle(scroll),guideCss=guide&&d.defaultView.getComputedStyle(guide);\n     result[kind]={validDOM:!!(scroll&&guide&&item&&guide.previousElementSibling===scroll&&scroll.contains(item)),scrollZ:scrollCss?.zIndex,guideZ:guideCss?.zIndex,scrollPos:scrollCss?.position,guidePos:guideCss?.position,guidePaint:guideCss?.backgroundColor,selectedInk:item?d.defaultView.getComputedStyle(item).color:null};\n   }\n   samples.push(result);\n }\n } finally {h.classList.toggle('dark',wasDark);sheet.remove();host.remove();}\n return samples;\n})()");
    assert.equal(rows.length,128,'all Theme cases test WheelPanel real sibling layout');
    for(const r of rows){
      const key=[r.style,r.dark,r.menuColor,r.menuAccent].join('/');
      for(const kind of ['panel','picker','time']){
        const v=r[kind];
        assert.ok(v.validDOM,key+' '+kind+' matches real WheelPanel scrollMount children');
        assert.equal(v.scrollPos,'relative',key+' '+kind+' Scroll layer positioned');
        assert.equal(v.guidePos,'absolute',key+' '+kind+' Guide absolute in same containing block');
        assert.ok(Number(v.scrollZ)>Number(v.guideZ),key+' '+kind+' Scroll item text is painted above guide');
        assert.notEqual(v.guidePaint,'rgba(0, 0, 0, 0)',key+' '+kind+' guide background not removed to hide bug');
      }
    }
  });

  await step('Official main Tree 3000-node VirtualList and selection',async()=>{
    await s('Page.navigate',{url:origin+'/docs/qa/tree-large-data.html'});
    await waitFor("!!window.QXFRAME9A7C2_TREE_QA?.tree || document.querySelector('[data-status]')?.textContent?.includes('Tree unavailable')",'official Tree mount',12000);
    const initial=await evaluate(`(() => {
      const tree=window.QXFRAME9A7C2_TREE_QA.tree,s=tree.getState();
      return {count:s.visibleKeys.length,rows:document.querySelectorAll('.qxframe9a7c2-tree-item').length,
      viewport:!!document.querySelector('.qxframe9a7c2-virtual-list-viewport'),checked:s.checkedKeys};
    })()`);
    assert.equal(initial.count,3000,'official Tree has 3000 roots');
    assert.ok(initial.rows>0&&initial.rows<150,'official Tree keeps bounded virtual rows');
    assert.equal(initial.viewport,true,'official Tree shows VirtualList');
    assert.ok(initial.checked.includes('finance'),'checked child survives initial load');
    await evaluate("window.QXFRAME9A7C2_TREE_QA.tree.expand('company')");
    await waitFor("window.QXFRAME9A7C2_TREE_QA.tree.getState().visibleKeys.includes('finance')",'official Tree expands branch');
    assert.equal(await evaluate("window.QXFRAME9A7C2_TREE_QA.tree.getState().visibleKeys.length"),3002);
    await evaluate("window.QXFRAME9A7C2_TREE_QA.tree.collapse('company')");
    assert.equal(await evaluate("window.QXFRAME9A7C2_TREE_QA.tree.getState().visibleKeys.length"),3000);
    const rows=await evaluate("document.querySelectorAll('.qxframe9a7c2-tree-item').length");
    assert.ok(rows>0&&rows<150,'official Tree stays virtual after disclosure');
  });

  await step('Stage5 Theme Playground visibly mounts new Alert, week picker and Kbd demos',async()=>{
    await s('Page.navigate',{url:origin+'/docs/theme-playground.html'});
    await waitFor("!!window.QXFRAME9A7C2ComponentDemos&&!!document.getElementById('component-alert')",'canonical theme playground mounts',15000);
    for(const [slug,title] of [['alert','Alert：语义 × 外观 × 阴影'],['date-picker','周选择与 Calendar 共用 Range Painter'],['form','Kbd 命令键组合']]){
      // All canonical examples are expanded: earlier grid rows grow during
      // idle mounts, so exercise the real search UI before asserting the target.
      await evaluate("(() => {const search=document.querySelector('[data-qxframe9a7c2-search]');search.value="+JSON.stringify(slug)+";search.dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('component-"+slug+"').scrollIntoView({behavior:'instant',block:'center'});return true})()");
      const expr="Array.from(document.querySelectorAll('#component-"+slug+" .qxframe9a7c2-play-example-title strong')).some(n=>n.textContent==="+JSON.stringify(title)+")";
      await waitFor(expr,'new '+slug+' demo visible by default',15000);
    }
    const actual=await evaluate("(() => {\n const alert=document.querySelector('#component-alert'),week=document.querySelector('#component-date-picker'),form=document.querySelector('#component-form');\n const rows=[...alert.querySelectorAll('.qxframe9a7c2-alert-root')];\n return {alertCount:rows.length,officialCount:rows.filter(x=>x.querySelector('.qxframe9a7c2-alert-wrapper .qxframe9a7c2-alert-icon')&&x.querySelector('.qxframe9a7c2-alert-section .qxframe9a7c2-alert-title')).length,\n shadowCombined:rows.filter(x=>x.classList.contains('is-shadow')&&(x.classList.contains('is-outline')||x.classList.contains('is-muted'))).length,\n weekNames:[...week.querySelectorAll('.qxframe9a7c2-play-example-title strong')].map(x=>x.textContent),\n liveWeek:week.querySelectorAll('.qxframe9a7c2-date-picker').length,kbd:form.querySelectorAll('.qxframe9a7c2-kbd').length};\n})()");
    assert.ok(actual.alertCount>=12&&actual.officialCount>=12,'all 12 semantic Alert skins use canonical DOM: '+JSON.stringify(actual));
    assert.ok(actual.shadowCombined>=2,'combined shadow/muted/outline Alert appears');
    assert.ok(actual.weekNames.includes('周选择与 Calendar 共用 Range Painter'),'week picker visible without expanding');
    assert.ok(actual.liveWeek>=2,'two live week pickers exist');
    assert.ok(actual.kbd>=4,'real Kbd group visible under Form');
  });

  assert.deepEqual(errors, [], 'page errors: ' + errors.join('\n'));
  console.log(JSON.stringify({ ok: true, browser: path.basename(browserBin), steps: results.length, names: results }));
} catch (error) {
  console.error('[create-app-browser] ' + (error && error.stack || error));
  console.log(JSON.stringify({ ok: false, passed: results }));
  process.exitCode = 1;
} finally {
  try { socket && socket.close(); } catch {}
  child.kill('SIGKILL');
  server.close();
  await new Promise(resolve => { if (child.exitCode !== null) return resolve(); child.once('exit', resolve); setTimeout(resolve, 2000); });
  try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 }); } catch {}
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
