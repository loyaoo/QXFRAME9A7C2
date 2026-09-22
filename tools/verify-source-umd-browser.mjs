import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const browser = [process.env.CHROMIUM_BIN, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].filter(Boolean).find(fs.existsSync);
if (!browser) { console.log(JSON.stringify({ ok: true, skipped: true, reason: 'chromium not found' })); process.exit(0); }
const WebSocketClient = await getWebSocketConstructor();

const staticRe = /(?:\bimport\s*(?:[^'";]*?\s+from\s*)?|\bexport\s+[^'";]*?\s+from\s*)['"]([^'"]+)['"]/g;
const dynamicRe = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
const files = new Map();
const normalize = file => path.relative(root, file).split(path.sep).join('/');
function resolve(from, spec) { if (!spec.startsWith('.')) return null; let file = path.resolve(path.dirname(from), spec); if (!path.extname(file)) file += '.js'; return file; }
function collect(file) {
    file = path.resolve(file);
    if (files.has(file)) return;
    const source = fs.readFileSync(file, 'utf8');
    const specs = [];
    for (const re of [staticRe, dynamicRe]) { re.lastIndex = 0; for (let m; (m = re.exec(source));) if (m[1].startsWith('.')) specs.push(m[1]); }
    files.set(file, source);
    for (const spec of specs) collect(resolve(file, spec));
}
collect(path.join(root, 'src/index.umd.js'));
collect(path.join(root, 'src/index.js'));

const imports = {};
for (const [file, raw] of files) {
    let source = raw;
    for (const re of [staticRe, dynamicRe]) {
        re.lastIndex = 0;
        source = source.replace(re, (full, spec) => {
            const resolved = resolve(file, spec);
            return resolved ? full.replace(spec, 'qx:/' + normalize(resolved)) : full;
        });
    }
    source += '\n//# sourceURL=qx:/' + normalize(file);
    imports['qx:/' + normalize(file)] = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
}
const importMap = JSON.stringify({ imports }).replace(/</g, '\\u003c');
const test = `
import 'qx:/src/index.umd.js';
import { QXFRAME9A7C2 } from 'qx:/src/index.js';
const out = document.getElementById('result');
try {
  const q = globalThis.QXFRAME9A7C2;
  if (!q || q !== QXFRAME9A7C2) throw new Error('index.umd.js did not publish the canonical runtime');
  const forbidden = ['CoreRegistry','HeadlessRegistry','DOMHeadlessRegistry','ComponentRegistry','BuildingBlockRegistry','defineModule','load','use'];
  for (const key of forbidden) if (key in q) throw new Error('legacy global key: ' + key);
  if ('QXFRAME9A7C2Bundle' in globalThis) throw new Error('auxiliary bundle global leaked');
  if ('FloatingUIDOM' in globalThis || 'FloatingUICore' in globalThis) throw new Error('Floating UI vendor global leaked');
  if (Object.keys(q.Components).length !== 40) throw new Error('component inventory mismatch');
  if (q.ModuleManifest.list().length !== 72) throw new Error('module manifest mismatch');
  out.textContent = 'QX_SOURCE_UMD:' + JSON.stringify({ok:true,modules:${files.size},components:40,manifest:72,legacyGlobals:0,vendorGlobals:0});
} catch (e) { out.textContent = 'QX_SOURCE_UMD:' + JSON.stringify({ok:false,error:String(e && e.stack || e)}); }
`;
const html = `<!doctype html><meta charset=utf-8><div id=result>pending</div><script type=importmap>${importMap}</script><script type=module>${test}</script>`;
const profile = path.join('/tmp', 'qx-source-umd-' + process.pid + '-' + Date.now());
const child = cp.spawn(browser, ['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--remote-debugging-port=0','--user-data-dir=' + profile,'about:blank'], { stdio: ['ignore','ignore','pipe'] });
let stderr = '', endpoint = null;
child.stderr.setEncoding('utf8');
child.stderr.on('data', chunk => { stderr += chunk; const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) endpoint = match[1]; });
const deadline = Date.now() + 10000;
while (!endpoint && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
if (!endpoint) throw new Error('CDP endpoint timeout');
const socket = new WebSocketClient(endpoint);
await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('CDP connect failed')); });
let id = 0; const pending = new Map();
socket.onmessage = event => { const message = JSON.parse(event.data); if (!message.id || !pending.has(message.id)) return; const item = pending.get(message.id); pending.delete(message.id); message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result); };
function call(method, params = {}, sessionId) { return new Promise((resolve, reject) => { const callId = ++id; pending.set(callId, { resolve, reject }); const message = { id: callId, method, params }; if (sessionId) message.sessionId = sessionId; socket.send(JSON.stringify(message)); }); }
let targetId = null;
try {
    ({ targetId } = await call('Target.createTarget', { url: 'about:blank' }));
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    await call('Page.enable', {}, sessionId); await call('Runtime.enable', {}, sessionId);
    const tree = await call('Page.getFrameTree', {}, sessionId);
    await call('Page.setDocumentContent', { frameId: tree.frameTree.frame.id, html }, sessionId);
    let payload = null; const until = Date.now() + 20000;
    while (Date.now() < until) {
        const result = await call('Runtime.evaluate', { expression: `(document.getElementById('result')||{}).textContent||''`, returnByValue: true }, sessionId);
        const text = result && result.result && result.result.value;
        if (typeof text === 'string' && text.startsWith('QX_SOURCE_UMD:')) { payload = JSON.parse(text.slice(14)); break; }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!payload) throw new Error('source UMD browser result timeout');
    if (!payload.ok) throw new Error(payload.error);
    console.log(JSON.stringify(payload));
} finally {
    if (targetId) await call('Target.closeTarget', { targetId }).catch(() => {});
    try { socket.close(); } catch {}
    try { child.kill('SIGKILL'); } catch {}
    for (let i = 0; i < 5; i++) { try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }); break; } catch { await new Promise(resolve => setTimeout(resolve, 100)); } }
}
