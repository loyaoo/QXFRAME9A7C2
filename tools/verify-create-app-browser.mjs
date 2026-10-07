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
