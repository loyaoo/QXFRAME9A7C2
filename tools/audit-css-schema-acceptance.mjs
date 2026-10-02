import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { compileStyles } from './compile-styles.mjs';
import { getCanonicalStyleModulePaths } from './style-source.mjs';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stripComments = text => text.replace(/\/\*[\s\S]*?\*\//g, match => match.replace(/[^\n]/g, ' '));
const lineAt = (text, index) => text.slice(0, index).split('\n').length;

export function inspectSchema({ rootDir = root } = {}) {
  const modules = getCanonicalStyleModulePaths({ root: rootDir });
  const sources = modules.map(file => ({ file, text: stripComments(fs.readFileSync(path.join(rootDir, file), 'utf8')) }));
  const runtimeColorMix = [];
  const componentRootPublicDefaults = [];
  const definitions = new Set();
  for (const { file, text } of sources) {
    for (const match of text.matchAll(/(--_?qxframe9a7c2-[a-z0-9-]+)\s*:/gi)) definitions.add(match[1]);
    for (const match of text.matchAll(/\bcolor-mix\s*\(/gi)) runtimeColorMix.push({ file, line: lineAt(text, match.index) });
    if (!file.includes('/components/')) continue;
    // Candidates, not automatically violations: explicit size/variant overrides
    // and dynamic functional channels require their own ownership decisions.
    for (const rule of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim();
      if (!/^\.qxframe9a7c2-[a-z0-9-]+$/.test(selector)) continue;
      for (const declaration of rule[2].matchAll(/(--qxframe9a7c2-[a-z0-9-]+)\s*:\s*([^;{}]+)/gi)) {
        componentRootPublicDefaults.push({ file, line: lineAt(text, rule.index + rule[1].length), selector, token: declaration[1], value: declaration[2].trim() });
      }
    }
  }
  const themeControlHeight = ['xs', 'sm', 'md', 'lg', 'xl'].map(size => {
    const token = '--qxframe9a7c2-theme-control-height-' + size;
    const source = sources.find(entry => entry.file.endsWith('theme/_family.scss'))?.text || '';
    return { size, token, defined: definitions.has(token), consumed: new RegExp('var\\(\\s*' + token + '(?:\\s*[,)]|\\s)').test(source) };
  });
  const guide = fs.readFileSync(path.join(rootDir, 'QXFRAME9A7C2-CSS-Design-Token-System-Refactor-Execution-Guide-v1.6.md'), 'utf8');
  const completeGuide = /^# 46\./m.test(guide);
  const projectionPath = path.join(rootDir, 'tools/manifests/css-functional-root-projections.json');
  const projections = fs.existsSync(projectionPath) ? JSON.parse(fs.readFileSync(projectionPath,'utf8')).entries : [];
  const unclassifiedRootDefaults = componentRootPublicDefaults.filter(entry => !projections.some(p => p.selector === entry.selector && p.token === entry.token && p.value === entry.value));
  const mixByLayer = {};
  for (const entry of runtimeColorMix) {
    const layer = entry.file.includes('/components/') ? 'component' : entry.file.includes('/theme/') ? 'theme' : 'preset';
    mixByLayer[layer] = (mixByLayer[layer] || 0) + 1;
  }
  return { completeGuide, themeControlHeight, runtimeColorMix, mixByLayer, componentRootPublicDefaults, unclassifiedRootDefaults, loadedComponentModules: modules.filter(file => file.includes('/components/')).length };
}

export async function browserProbes({ expression, htmlContent, cssText } = {}) {
  const browser = [process.env.CHROMIUM_BIN, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].filter(Boolean).find(fs.existsSync);
  if (!browser) throw new Error('Schema acceptance browser evidence requires Chromium; it cannot be skipped.');
  const css = (cssText || compileStyles({ root }).css).replace(/<\/style/gi, '<\\/style');
  const html = htmlContent || `<!doctype html><meta charset="utf-8"><style>${css}</style>
    <div id="scope" data-qxframe9a7c2-theme="light">
      <button id="control" class="qxframe9a7c2-button is-md">Control</button>
      <div id="card" class="qxframe9a7c2-card"><div id="cardBody" class="qxframe9a7c2-card-body"><div id="title" class="qxframe9a7c2-card-skeleton-line is-title"></div></div></div>
      <span id="avatar" class="qxframe9a7c2-avatar is-md">A</span>
      <div id="popup" class="qxframe9a7c2-popup-surface">Popup</div>
    </div>`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'qx-schema-acceptance-'));
  const child = spawn(browser, ['--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-background-networking', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let endpoint, stderr = '', socket, targetId, call;
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', data => { stderr += data; endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]; });
  try {
    const deadline = Date.now() + 30000;
    while (!endpoint && Date.now() < deadline && child.exitCode === null) await new Promise(resolve => setTimeout(resolve, 50));
    if (!endpoint) throw new Error('Chromium DevTools endpoint timed out: ' + stderr.slice(-1500));
    const WebSocketClient = await getWebSocketConstructor();
    socket = new WebSocketClient(endpoint);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = () => reject(new Error('CDP connect failed')); });
    let id = 0;
    const pending = new Map();
    socket.onmessage = event => {
      const message = JSON.parse(event.data), entry = pending.get(message.id);
      if (!entry) return;
      pending.delete(message.id); clearTimeout(entry.timer);
      message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
    };
    call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      const n = ++id, timer = setTimeout(() => { pending.delete(n); reject(new Error('CDP call timed out: ' + method)); }, 30000);
      pending.set(n, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: n, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
    ({ targetId } = await call('Target.createTarget', { url: 'about:blank' }));
    const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true });
    await call('Page.enable', {}, sessionId);
    const tree = await call('Page.getFrameTree', {}, sessionId);
    await call('Page.setDocumentContent', { frameId: tree.frameTree.frame.id, html }, sessionId);
    const result = await call('Runtime.evaluate', { returnByValue: true, expression: expression || `(() => {
      const probes = [], el = id => document.getElementById(id), cs = id => getComputedStyle(el(id));
      const scope = el('scope'), root = document.documentElement;
      const measure = (id, property) => parseFloat(cs(id)[property]);
      const add = (name, actual, expected) => probes.push({name, actual, expected, passed: typeof expected === 'number' ? Math.abs(actual - expected) < .1 : actual === expected});
      root.style.fontSize = '16px';
      add('default-control-height-md', measure('control', 'minHeight'), 32);
      add('default-card-body-padding', measure('cardBody', 'paddingLeft'), 12);
      const sheet = document.createElement('style'); sheet.textContent = ':root { --qxframe9a7c2-theme-control-height-md: 3.25rem; }'; document.head.appendChild(sheet);
      add('external-theme-control-height-md', measure('control', 'minHeight'), 52);
      sheet.remove();
      scope.style.setProperty('--qxframe9a7c2-card-skeleton-title-height', '24px');
      add('ancestor-public-card-skeleton-title-height', measure('title', 'height'), 24);
      scope.style.removeProperty('--qxframe9a7c2-card-skeleton-title-height');
      scope.style.setProperty('--qxframe9a7c2-theme-space-6', '2rem');
      add('scoped-theme-card-padding', measure('cardBody', 'paddingLeft'), 32);
      scope.style.removeProperty('--qxframe9a7c2-theme-space-6');
      scope.style.setProperty('--qxframe9a7c2-theme-avatar-size-md', '3.5rem');
      add('scoped-theme-avatar-size-md', measure('avatar', 'width'), 56);
      scope.style.removeProperty('--qxframe9a7c2-theme-avatar-size-md');
      scope.style.setProperty('--qxframe9a7c2-card-padding', '20px');
      add('ancestor-public-card-padding-positive-control', measure('cardBody', 'paddingLeft'), 20);
      scope.style.removeProperty('--qxframe9a7c2-card-padding');
      root.style.fontSize = '20px';
      add('root-font-size-scales-control', measure('control', 'minHeight'), 40);
      root.style.fontSize = '16px';
      for (const [size,height] of Object.entries({xs:24,sm:28,md:32,lg:36,xl:40})) {
        el('control').className = 'qxframe9a7c2-button is-' + size;
        add('default-control-height-' + size, measure('control','minHeight'), height);
        scope.style.setProperty('--qxframe9a7c2-theme-control-height-' + size,'3rem');
        add('scoped-control-height-' + size,measure('control','minHeight'),48);
        scope.style.removeProperty('--qxframe9a7c2-theme-control-height-' + size);
      }
      el('control').className = 'qxframe9a7c2-button';
      scope.style.setProperty('--qxframe9a7c2-theme-control-height-md','3rem');
      add('scoped-default-control-height',measure('control','minHeight'),48);
      scope.style.removeProperty('--qxframe9a7c2-theme-control-height-md');
      el('control').className = 'qxframe9a7c2-button is-md';
      scope.style.setProperty('--qxframe9a7c2-card-md-padding','26px');
      scope.style.setProperty('--qxframe9a7c2-theme-space-6','2rem');
      add('ancestor-card-size-slot-wins-over-theme',measure('cardBody','paddingLeft'),26);
      scope.style.removeProperty('--qxframe9a7c2-card-md-padding');
      scope.style.removeProperty('--qxframe9a7c2-theme-space-6');
      scope.style.setProperty('--qxframe9a7c2-avatar-md-size','44px');
      scope.style.setProperty('--qxframe9a7c2-theme-avatar-size-md','3.5rem');
      add('ancestor-avatar-size-slot-wins-over-theme',measure('avatar','width'),44);
      scope.style.removeProperty('--qxframe9a7c2-avatar-md-size');
      scope.style.removeProperty('--qxframe9a7c2-theme-avatar-size-md');
      const nested = document.createElement('div');
      nested.setAttribute('data-qxframe9a7c2-theme','dark');
      nested.style.setProperty('--qxframe9a7c2-theme-space-6','1.5rem');
      nested.innerHTML = '<div class="qxframe9a7c2-card"><div id="nestedBody" class="qxframe9a7c2-card-body"></div></div>';
      el('cardBody').appendChild(nested);
      scope.style.setProperty('--qxframe9a7c2-card-padding','20px');
      add('nested-card-inherits-explicit-public-override',measure('nestedBody','paddingLeft'),20);
      scope.style.removeProperty('--qxframe9a7c2-card-padding');
      add('nested-card-resolves-local-theme-default',measure('nestedBody','paddingLeft'),24);
      el('card').classList.add('is-shadow');
      add('nested-card-private-shadow-reset',getComputedStyle(nested.firstElementChild).boxShadow,'none');
      el('card').classList.remove('is-shadow');
      nested.remove();
      const light = cs('popup').backgroundColor;
      scope.setAttribute('data-qxframe9a7c2-theme', 'dark');
      const dark = cs('popup').backgroundColor;
      add('scoped-popup-light-dark-positive-control', dark !== light, true);
      return { browserVersion: navigator.userAgent, probes, failed: probes.filter(probe => !probe.passed).length };
    })()` }, sessionId);
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
    await call('Target.closeTarget', { targetId }); targetId = null;
    return result.result.value;
  } finally {
    // Close the browser itself, including children spawned by a distribution
    // wrapper. A profile cleanup race must never erase computed-style evidence
    // or replace the original verification exception.
    if (call && socket?.readyState === 1) await call('Browser.close').catch(() => {});
    try { socket?.close(); } catch {}
    child.kill('SIGKILL');
    await new Promise(resolve => child.exitCode !== null || child.signalCode !== null ? resolve() : child.once('exit', resolve));
    try { fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 }); }
    catch (error) { console.error('Schema browser profile cleanup: ' + error.code); }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const structural = inspectSchema();
  const browser = process.argv.includes('--browser') ? await browserProbes() : null;
  const blockers = [
    ...(!structural.completeGuide ? ['SCHEMA-ACCEPT-001: authoritative guide incomplete'] : []),
    ...(structural.themeControlHeight.some(role => !role.defined || !role.consumed) ? ['SCHEMA-ACCEPT-002: public control-height theme roles absent/unconsumed'] : []),
    ...(structural.runtimeColorMix.length ? ['SCHEMA-ACCEPT-003: runtime color-mix cleanup incomplete; per-consumer decisions required'] : []),
    ...(structural.unclassifiedRootDefaults.length ? ['SCHEMA-ACCEPT-004: unclassified public defaults on component roots'] : []),
    ...(browser?.failed ? ['SCHEMA-ACCEPT-004/005: browser theme/public override probes failed'] : [])
  ];
  const report = { schemaVersion: 1, scope: 'CSS Schema v1.6 acceptance only; not an independent model-specific architecture/security audit', acceptance: blockers.length ? 'NOT_ACCEPTED' : browser ? 'PROBES_PASS_REMAINING_MANUAL_GATES_REQUIRED' : 'BROWSER_EVIDENCE_REQUIRED', blockers, structural, browser };
  const write = process.argv.find(arg => arg.startsWith('--write='));
  if (write) { const file = path.resolve(root, write.slice(8)); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(report, null, 2) + '\n'); }
  console.log(JSON.stringify({ acceptance: report.acceptance, blockers, runtimeColorMix: structural.runtimeColorMix.length, mixByLayer: structural.mixByLayer, componentRootPublicDefaultCandidates: structural.componentRootPublicDefaults.length, browser }));
  // Evidence collection succeeding does not mean acceptance passing.
  // --enforce is deliberately strict: confirmed defects and missing browser
  // evidence must fail the gate. Never replace this with ok:true inventory counts.
  if (process.argv.includes('--enforce') && (blockers.length || !browser)) process.exitCode = 1;
}
