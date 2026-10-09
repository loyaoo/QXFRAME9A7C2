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
        approx(actual.content,inset,label+' Accordion content inset');
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
        const choices=[...radio.querySelectorAll('.qxframe9a7c2-check-field.is-choice')];
        const menu=doc.querySelector('[data-card="sidebar-nav"]');
        const button=menu.querySelector('.qxframe9a7c2-sidebar-menu-button');
        const groupTitle=menu.querySelector('.qxframe9a7c2-sidebar-group-label');
        return {choices:choices.map(c=>({top:px(css(c).paddingTop),bottom:px(css(c).paddingBottom),
          side:px(css(c).paddingLeft),border:px(css(c).borderTopWidth),height:c.getBoundingClientRect().height,
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
          badgeLine:px(computed(badge).lineHeight),badgeInset:px(computed(badge).paddingLeft),
          separatorDisplay:computed(stock).display,
          coverAspect:item.getBoundingClientRect().width/item.getBoundingClientRect().height,
          iconWidth:svg.getBoundingClientRect().width,footerGap:px(computed(footer).rowGap),
          footerColumn:computed(footer).flexDirection};
      })()`);
      const sourceHeight=style==='sera'?100/7:20;
      assert.ok(Math.abs(info.badgeHeight-sourceHeight)<=.5,style+' Badge intrinsic source height');
      assert.equal(info.badgeFont,style==='vega'?12:10,style+' Badge source typography');
      assert.ok(Math.abs(info.badgeInset-(style==='sera'?0:8))<=.5,style+' Badge source inline inset');
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
          descOffset:parseFloat(c(desc).marginTop)};
      })()`);
      const expectedInset=style==='sera'?32:style==='rhea'?20:style==='nova'||style==='lyra'||style==='mira'?16:24;
      assert.equal(result.parented,true,style+' EmptyMedia must belong to EmptyHeader');
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
          const fields=[...doc.querySelectorAll('[data-card="notification-settings"] .qxframe9a7c2-check-field')];
          const ans={labelLines:labels.map(e=>px(css(e).lineHeight)),labelWeights:labels.map(e=>Number(css(e).fontWeight)),
            fieldGaps:fields.map(e=>px(css(e).columnGap)),
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
          const rows=[...card.querySelectorAll('.qxframe9a7c2-check-field.pv-choice-field')];
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
            const st=css(el),inner=el.querySelector('.qxframe9a7c2-field-content');
            return {paddingBottom:num(st.paddingBottom),paddingTop:num(st.paddingTop),
              border:num(st.borderTopWidth),gap:num(st.columnGap),
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
            '<div class="qxframe9a7c2-form-input-group is-md" data-case="flat"><span class="qxframe9a7c2-form-input-group-addon">$</span><input class="qxframe9a7c2-form-input is-md is-invalid" value="invalid"></div>'+
            '<div class="qxframe9a7c2-form-input-group is-md" data-case="mixed"><span class="qxframe9a7c2-form-input-group-prefix">$</span><div class="qxframe9a7c2-form-input-group-field"><span class="qxframe9a7c2-form-input-group-addon">@</span><input class="qxframe9a7c2-form-input is-md is-invalid" value="invalid"></div><span class="qxframe9a7c2-form-input-group-suffix">USD</span></div>'+
            '<div class="qxframe9a7c2-form-input-group is-separated is-md" data-case="separated"><span class="qxframe9a7c2-form-input-group-addon">$</span><input class="qxframe9a7c2-form-input" value="separate"></div>'+
            '<div class="qxframe9a7c2-form-input-group is-vertical is-md" data-case="vertical"><span class="qxframe9a7c2-form-input-group-addon">$</span><input class="qxframe9a7c2-form-input" value="vertical"></div>';
          doc.body.append(host);
          const cs=el=>doc.defaultView.getComputedStyle(el),rect=el=>el.getBoundingClientRect();
          const plain=host.firstElementChild,flat=host.querySelector('[data-case=flat]'),mixed=host.querySelector('[data-case=mixed]');
          const field=mixed.querySelector('.qxframe9a7c2-form-input-group-field');
          const sep=host.querySelector('[data-case=separated] .qxframe9a7c2-form-input-group-addon');
          const vert=host.querySelector('[data-case=vertical] .qxframe9a7c2-form-input-group-addon');
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
      return {tabs:actions.length,panels:panels.length,segmented:!!faq.querySelector('.pv-tabs .qxframe9a7c2-tabs.is-segmented'),initial,billing,goals,restored,billingSingleOpen,
        names:[...faq.querySelectorAll('details')].map(e=>e.name)};
    })()`);
    assert.equal(result.tabs,3);
    assert.equal(result.panels,3);
    assert.equal(result.segmented,true,'source FAQ TabsList uses QX segmented style');
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
          : ['.qxframe9a7c2-card-header','.qxframe9a7c2-card-content','.qxframe9a7c2-field-group','.qxframe9a7c2-check-field','.qxframe9a7c2-form-description','.qxframe9a7c2-card-footer'];
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
