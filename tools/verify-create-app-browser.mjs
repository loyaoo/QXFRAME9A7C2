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
      const root = doc.querySelector('.qxframe9a7c2-form-input-group:has(> .qxframe9a7c2-form-input-group-addon)');
      const addon = root?.querySelector(':scope > .qxframe9a7c2-form-input-group-addon');
      const field = root?.querySelector(':scope > .qxframe9a7c2-form-input');
      if (!root || !addon || !field) return null;
      const css = node => doc.defaultView.getComputedStyle(node);
      return { group: css(root).borderTopWidth, addon: css(addon).borderTopWidth, input: css(field).borderTopWidth };
    })()`);
    assert.ok(group && parseFloat(group.group) > 0 && group.addon === '0px' && group.input === '0px', 'addon must be INSIDE one outlined field: ' + JSON.stringify(group));

    const mixed = await evaluate(`(() => {
      const doc = document.querySelector('[data-create-frame]').contentDocument;
      const root = doc.createElement('div');
      root.className = 'qxframe9a7c2-form-input-group';
      root.style.width = '320px';
      root.innerHTML = '<span class="qxframe9a7c2-form-input-group-prefix">https://</span><div class="qxframe9a7c2-form-input-group-field"><span class="qxframe9a7c2-form-input-group-addon">#</span><input class="qxframe9a7c2-form-input" value="project"></div><span class="qxframe9a7c2-form-input-group-suffix">.com</span>';
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
      vega: [48,40,18,28,10,10], nova: [24,32,14,20,14,10],
      maia: [48,40,18,28,10,10], lyra: [24,32,14,20,0,0],
      mira: [24,32,14,20,14,8], luma: [48,40,18,28,18,14],
      sera: [48,40,18,28,0,0], rhea: [48,40,18,28,22,14]
    };
    const approx = (actual, expectedValue, description) =>
      assert.ok(Number.isFinite(actual) && Math.abs(actual - expectedValue) <= 0.5,
        description + ': expected ' + expectedValue + 'px, got ' + actual);
    for (const [style, [inset, mediaSize, titleSize, titleLine, outerRadius, mediaRadius]] of Object.entries(expected)) {
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
          doc.body.append(fixture);
          const css = el => doc.defaultView.getComputedStyle(el);
          const read = value => parseFloat(value);
          const result = {
            inset: read(css(empty).paddingTop), gap: read(css(empty).rowGap),
            media: read(css(media).width), mediaRadius: read(css(media).borderTopLeftRadius),
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
    const accordion={vega:16,nova:10,maia:16,lyra:10,mira:8,luma:16,sera:16,rhea:16};
    const approx=(actual,expected,label)=>assert.ok(Number.isFinite(actual)&&Math.abs(actual-expected)<=.5,
      label+': expected '+expected+', observed '+actual);
    for(const [style,inset] of Object.entries(accordion)){
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
            trigger: px(css(faq.querySelector('.pv-accordion-item > summary')).paddingTop),
            content: px(css(faq.querySelector('.pv-accordion-content')).paddingBottom),
            separatorCount: separators.length,
            separator: separators.map(el=>[px(css(el).marginTop),px(css(el).marginBottom)]),
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
        approx(actual.content,inset,label+' Accordion content inset');
        assert.equal(actual.separatorCount,2,label+' field separators');
        for(const pair of actual.separator)for(const value of pair)approx(value,-16,label+' separator margin');
        approx(actual.emptyPadding,16,label+' Card Empty p-4');
        approx(actual.emptyMedia,(['nova','lyra','mira'].includes(style)?32:40),label+' media retains theme size');
        approx(actual.emptyMediaBottom,8,label+' media bottom gap');
        approx(actual.emptyHeader,style==='mira'?4:8,label+' Empty header gap');
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
        return { gap,overriddenGap,
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
      assert.ok(actual&&actual.media.length===4,style+' has four Kitchen slider rows');
      assert.ok(Math.abs(actual.gap-10)<.5,style+' compact ItemGroup gap');
      assert.ok(Math.abs(actual.overriddenGap-28)<.5,style+' explicit ItemGroup gap wins');
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
          const faq=doc.querySelector('[data-card="faq"]'),summary=faq.querySelector('.pv-accordion-item>summary');
          const ans={labelLines:labels.map(e=>px(css(e).lineHeight)),labelWeights:labels.map(e=>Number(css(e).fontWeight)),
            expectedLine:px(css(root).getPropertyValue('--qxframe9a7c2-theme-field-label-line-height'))*16,
            actualGap:px(css(summary).columnGap),faqHeight:faq.getBoundingClientRect().height,
            notificationHeight:doc.querySelector('[data-card="notification-settings"]').getBoundingClientRect().height};
          root.classList.toggle('dark',prev);return ans;
        })()`);
        assert.equal(actual.labelLines.length,5,style+'/'+mode+' field labels');
        assert.ok(Math.abs(actual.actualGap)<=.5,style+'/'+mode+' no invented FAQ gap');
        for(const line of actual.labelLines)assert.ok(Math.abs(line-actual.expectedLine)<=.5,
          style+'/'+mode+' FieldContent label line consumes role: '+line+'/'+actual.expectedLine);
        assert.ok(actual.labelWeights.every(Number.isFinite),style+'/'+mode+' valid Label font weights');
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
          ? ['.qxframe9a7c2-card-content','.pv-tabs','.qxframe9a7c2-tabs','.qxframe9a7c2-tabs-list','.pv-accordion','.pv-accordion-item','summary','.pv-accordion-content','.qxframe9a7c2-card-footer']
          : name==='kitchen-island'
          ? ['.qxframe9a7c2-card-header','.qxframe9a7c2-card-content','.pv-toggle-group','.qxframe9a7c2-item-group','.pv-slider-item','.qxframe9a7c2-item-content','.qxframe9a7c2-item-title','.qxframe9a7c2-item-actions','.pv-slider']
          : name==='payments'
          ? ['.qxframe9a7c2-card-header','.pv-breadcrumb','.qxframe9a7c2-card-content','.qxframe9a7c2-item-group','.qxframe9a7c2-item','.qxframe9a7c2-item-content','.qxframe9a7c2-item-title','.qxframe9a7c2-item-desc']
          : name==='sidebar-nav'
          ? ['.qxframe9a7c2-card','.pv-nav-group','.pv-nav-label','.pv-nav','.pv-nav-button','.qxframe9a7c2-divider']
          : ['.qxframe9a7c2-card-header','.qxframe9a7c2-card-content','.qxframe9a7c2-field-group','.qxframe9a7c2-check-field','.qxframe9a7c2-form-description','.qxframe9a7c2-card-footer'];
        for(const selector of selectors){const el=card.querySelector(selector);samples.push({selector,metrics:get(el)});}
        result[name]={root:get(card),samples};
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
      renders:rows.length,previousOverTolerance:rows.filter(oldBad).length,currentOverTolerance:rows.filter(bad).length,
      improved:rows.filter(row=>row.delta!==null&&row.priorHeight!==null&&Math.abs(row.delta)<Math.abs(row.priorHeight-row.referenceHeight)-.5).length,
      worsened:rows.filter(row=>row.delta!==null&&row.priorHeight!==null&&Math.abs(row.delta)>Math.abs(row.priorHeight-row.referenceHeight)+.5).length,
      topNova:rows.filter(row=>row.style==='nova'&&row.mode==='light').sort((a,b)=>Math.abs(b.delta??0)-Math.abs(a.delta??0)).slice(0,10)};
    fs.writeFileSync(path.join(root,'tools/qa/reports/stage-3/preview-01/current-report.json'),
      JSON.stringify({...summary,rows},null,2)+'\n');
    console.log('[preview-01-first-card-diagnostic] '+JSON.stringify(summary));
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
