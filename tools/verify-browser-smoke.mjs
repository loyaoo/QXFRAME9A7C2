import * as fs from 'node:fs';
import * as path from 'node:path';
import * as cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { getWebSocketConstructor } from './websocket-client.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliArgs = process.argv.slice(2);
const smokeArg = cliArgs.find(arg => arg.startsWith('--smoke='));
const smokePath = smokeArg ? path.resolve(root, smokeArg.slice('--smoke='.length)) : path.join(root, 'tools', 'verify-browser-smoke.html');
const skipDocs = cliArgs.includes('--skip-docs') || process.env.QX_BROWSER_SKIP_DOCS === '1';
const required = cliArgs.includes('--required') || process.env.QX_BROWSER_REQUIRED === '1';
const candidates = [
    process.env.CHROMIUM_BIN,
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable'
].filter(Boolean);
const browser = candidates.find((candidate) => fs.existsSync(candidate));
const WebSocketClient = browser ? await getWebSocketConstructor() : null;

function skipped(reason) {
    console.log(JSON.stringify({ ok: !required, skipped: true, required, reason, browser: browser || null }));
    process.exitCode = required ? 1 : 0;
}

function smokeArtifacts() {
    const source = fs.readFileSync(smokePath, 'utf8');
    const css = fs.readFileSync(path.join(root, 'dist', 'qxframe9a7c2.css'), 'utf8');
    const framework = fs.readFileSync(path.join(root, 'dist', 'qxframe9a7c2.js'), 'utf8');
    const scripts = [];
    const base = source
        .replace('<link rel="stylesheet" href="../dist/qxframe9a7c2.css">', '<style>' + css + '</style>')
        .replace(/<script\b[^>]*src="\.\.\/dist\/qxframe9a7c2\.js"[^>]*><\/script>/i, '')
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gi, function (_, code) { scripts.push(code); return ''; });
    return { html: base, framework, scripts };
}

function exceptionMessage(result, label) {
    if (!result || !result.exceptionDetails) return null;
    const details = result.exceptionDetails;
    const exception = details.exception;
    const description = exception && (exception.description || exception.value);
    return new Error(label + ': ' + (description || details.text || 'browser evaluation failed'));
}

function launchBrowser() {
    return new Promise((resolve, reject) => {
        const profile = path.join('/tmp', 'qxframe9a7c2-browser-smoke-' + process.pid + '-' + Date.now());
        fs.rmSync(profile, { recursive: true, force: true });
        const child = cp.spawn(browser, [
            '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
            '--disable-background-networking', '--disable-component-update', '--disable-sync',
            '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', '--remote-debugging-port=0',
            '--user-data-dir=' + profile, 'about:blank'
        ], { stdio: ['ignore', 'ignore', 'pipe'] });
        let stderr = '';
        let settled = false;
        const timer = setTimeout(() => finish(new Error('Chromium DevTools endpoint timed out')), 30000);
        function finish(error, endpoint) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) {
                try { child.kill('SIGKILL'); } catch (_) {}
                fs.rmSync(profile, { recursive: true, force: true });
                reject(error);
            } else resolve({ child, profile, endpoint });
        }
        child.stderr.setEncoding('utf8');
        child.stderr.on('data', (chunk) => {
            stderr += chunk;
            const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
            if (match) finish(null, match[1]);
        });
        child.once('error', finish);
        child.once('exit', (code, signal) => {
            if (!settled) finish(new Error('Chromium exited before DevTools was ready: ' + code + '/' + signal + '\n' + stderr.slice(-1500)));
        });
    });
}

function connectCDP(endpoint) {
    return new Promise((resolve, reject) => {
        const socket = new WebSocketClient(endpoint);
        let id = 0;
        const pending = new Map();
        socket.onopen = () => resolve({
            socket,
            call(method, params = {}, sessionId) {
                return new Promise((resolveCall, rejectCall) => {
                    const callId = ++id;
                    pending.set(callId, { resolve: resolveCall, reject: rejectCall });
                    const message = { id: callId, method, params };
                    if (sessionId) message.sessionId = sessionId;
                    socket.send(JSON.stringify(message));
                });
            }
        });
        socket.onerror = () => reject(new Error('Failed to connect to Chromium DevTools WebSocket'));
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (!message.id || !pending.has(message.id)) return;
            const waiter = pending.get(message.id);
            pending.delete(message.id);
            if (message.error) waiter.reject(new Error(message.error.message || JSON.stringify(message.error)));
            else waiter.resolve(message.result);
        };
        socket.onclose = () => {
            for (const waiter of pending.values()) waiter.reject(new Error('Chromium DevTools connection closed'));
            pending.clear();
        };
    });
}

async function runSmoke(cdp) {
    const { targetId } = await cdp.call('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.call('Target.attachToTarget', { targetId, flatten: true });
    try {
        await cdp.call('Page.enable', {}, sessionId);
        await cdp.call('Runtime.enable', {}, sessionId);
        const frameTree = await cdp.call('Page.getFrameTree', {}, sessionId);
        const frameId = frameTree.frameTree.frame.id;
        const artifacts = smokeArtifacts();
        await cdp.call('Page.setDocumentContent', { frameId, html: artifacts.html }, sessionId);
        for (let index = 0; index < artifacts.scripts.length - 1; index += 1) {
            const prelude = await cdp.call('Runtime.evaluate', { expression: artifacts.scripts[index], sourceURL: 'qx-browser-prelude-' + index + '.js' }, sessionId);
            const preludeError = exceptionMessage(prelude, 'Browser smoke prelude');
            if (preludeError) throw preludeError;
        }
        const frameworkResult = await cdp.call('Runtime.evaluate', { expression: artifacts.framework, sourceURL: 'qxframe9a7c2.js' }, sessionId);
        const frameworkError = exceptionMessage(frameworkResult, 'QXFRAME9A7C2 browser bundle');
        if (frameworkError) throw frameworkError;
        const smokeScript = artifacts.scripts[artifacts.scripts.length - 1] || '';
        const smokeResult = await cdp.call('Runtime.evaluate', { expression: smokeScript, sourceURL: 'verify-browser-smoke-page.js' }, sessionId);
        const smokeError = exceptionMessage(smokeResult, 'Browser smoke script');
        if (smokeError) throw smokeError;
        const deadline = Date.now() + 12000;
        while (Date.now() < deadline) {
            const result = await cdp.call('Runtime.evaluate', {
                expression: `(function(){var n=document.getElementById('qx-browser-smoke-result');return n?n.textContent:null})()`,
                returnByValue: true
            }, sessionId);
            const value = result && result.result && result.result.value;
            if (typeof value === 'string' && value.startsWith('QX_BROWSER_SMOKE:')) {
                return JSON.parse(value.slice('QX_BROWSER_SMOKE:'.length));
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const diagnostic = await cdp.call('Runtime.evaluate', {
            expression: `({href:location.href,readyState:document.readyState,marker:document.documentElement.getAttribute('data-qx-browser-smoke'),text:(document.getElementById('qx-browser-smoke-result')||{}).textContent||null,framework:typeof window.QXFRAME9A7C2})`,
            returnByValue: true
        }, sessionId).catch(() => null);
        throw new Error('Browser smoke result timed out: ' + JSON.stringify(diagnostic && diagnostic.result && diagnostic.result.value));
    } finally {
        await cdp.call('Target.closeTarget', { targetId }).catch(() => {});
    }
}


function themePlaygroundArtifacts() {
    const pagePath = path.join(root, 'docs', 'theme-playground.html');
    const baseDir = path.dirname(pagePath);
    let html = fs.readFileSync(pagePath, 'utf8');
    const scripts = [];
    html = html.replace(/<link\b([^>]*?)>/gi, function (tag, attrs) {
        const rel = attrs.match(/\brel=["']([^"']+)["']/i);
        const href = attrs.match(/\bhref=["']([^"']+)["']/i);
        if (!rel || !/\bstylesheet\b/i.test(rel[1]) || !href) return tag;
        const file = path.resolve(baseDir, href[1]);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) return '';
        return '<style data-qx-browser-inline="' + path.basename(file) + '">' + fs.readFileSync(file, 'utf8') + '</style>';
    });
    html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, function (_, attrs, inlineCode) {
        const src = attrs.match(/\bsrc=["']([^"']+)["']/i);
        if (src) {
            const file = path.resolve(baseDir, src[1]);
            if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) throw new Error('Missing Theme Playground script: ' + src[1]);
            scripts.push({ label: src[1], code: fs.readFileSync(file, 'utf8') });
        } else if (inlineCode.trim()) scripts.push({ label: 'theme-playground-inline-' + scripts.length, code: inlineCode });
        return '';
    });
    return { html, scripts };
}

async function runDocsPlayground(cdp) {
    const { targetId } = await cdp.call('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.call('Target.attachToTarget', { targetId, flatten: true });
    try {
        await cdp.call('Page.enable', {}, sessionId);
        await cdp.call('Runtime.enable', {}, sessionId);
        const frameTree = await cdp.call('Page.getFrameTree', {}, sessionId);
        const frameId = frameTree.frameTree.frame.id;
        const artifacts = themePlaygroundArtifacts();
        await cdp.call('Page.setDocumentContent', { frameId, html: artifacts.html }, sessionId);
        await cdp.call('Runtime.evaluate', { expression: `(function(){window.__QX_DOC_ERRORS=[];window.addEventListener('error',function(e){window.__QX_DOC_ERRORS.push(String(e.message||e.error||e));});window.addEventListener('unhandledrejection',function(e){window.__QX_DOC_ERRORS.push(String(e.reason&&e.reason.stack||e.reason||e));});})();` }, sessionId);
        for (let index = 0; index < artifacts.scripts.length; index += 1) {
            const evaluated = await cdp.call('Runtime.evaluate', { expression: artifacts.scripts[index].code, sourceURL: artifacts.scripts[index].label }, sessionId);
            const scriptError = exceptionMessage(evaluated, 'Theme Playground script ' + artifacts.scripts[index].label);
            if (scriptError) throw scriptError;
        }
        const deadline = Date.now() + 12000;
        while (Date.now() < deadline) {
            const ready = await cdp.call('Runtime.evaluate', { expression: `document.querySelectorAll('.qxframe9a7c2-play-card').length>0`, returnByValue: true }, sessionId);
            if (ready && ready.result && ready.result.value === true) break;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const result = await cdp.call('Runtime.evaluate', {
            expression: `(async function(){
              var cards=Array.prototype.slice.call(document.querySelectorAll('.qxframe9a7c2-play-card'));
              var failures=[],unmounted=[];
              function wait(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}
              async function waitMounted(card){
                var log=card.querySelector('[data-qxframe9a7c2-card-log]'),deadline=Date.now()+1200;
                while(log&&/等待进入视口后挂载|Loading canonical demo/i.test(log.textContent||'')&&Date.now()<deadline){await wait(40);}
                return !log||!/等待进入视口后挂载|Loading canonical demo/i.test(log.textContent||'');
              }
              for(var i=0;i<cards.length;i+=1){
                var card=cards[i];card.scrollIntoView({block:'center'});
                await new Promise(function(r){requestAnimationFrame(function(){setTimeout(r,60);});});
                if(!(await waitMounted(card)))unmounted.push({name:card.dataset.name,slug:card.dataset.slug});
                var toggle=card.querySelector('[data-qxframe9a7c2-card-toggle]');
                if(toggle&&!toggle.hidden){toggle.click();await new Promise(function(r){requestAnimationFrame(function(){setTimeout(r,45);});});}
                var errors=Array.prototype.slice.call(card.querySelectorAll('.qxframe9a7c2-play-card-error')).map(function(n){return n.textContent.trim();}).filter(Boolean);
                var log=card.querySelector('[data-qxframe9a7c2-card-log]');var logText=log?log.textContent:'';
                if(errors.length||/Demo (?:error|mount failed)/i.test(logText))failures.push({name:card.dataset.name,slug:card.dataset.slug,log:logText,errors:errors});
              }
              return {framework:typeof window.QXFRAME9A7C2,catalog:Array.isArray(window.QXFRAME9A7C2_DOCS_CATALOG)?window.QXFRAME9A7C2_DOCS_CATALOG.length:null,cards:cards.length,failures:failures,unmounted:unmounted,windowErrors:(window.__QX_DOC_ERRORS||[]).slice(),inputOtp:(function(){var c=document.getElementById('component-input-otp');return c?{log:(c.querySelector('[data-qxframe9a7c2-card-log]')||{}).textContent||'',errors:Array.prototype.slice.call(c.querySelectorAll('.qxframe9a7c2-play-card-error')).map(function(n){return n.textContent.trim();})}:null;})()};
            })()`,
            awaitPromise: true,
            returnByValue: true
        }, sessionId);
        const error = exceptionMessage(result, 'Theme Playground browser smoke');
        if (error) throw error;
        const value = result && result.result && result.result.value || {};
        return { ok: Number(value.cards) > 0 && Array.isArray(value.failures) && value.failures.length === 0 && Array.isArray(value.unmounted) && value.unmounted.length === 0 && Array.isArray(value.windowErrors) && value.windowErrors.length === 0, ...value };
    } finally {
        await cdp.call('Target.closeTarget', { targetId }).catch(() => {});
    }
}

async function main() {
    if (!browser) return skipped('Chromium/Chrome executable not found');
    let launched;
    let cdp;
    try {
        launched = await launchBrowser();
        cdp = await connectCDP(launched.endpoint);
        const payload = await runSmoke(cdp);
        const docs = skipDocs ? { ok:true, skipped:true } : await runDocsPlayground(cdp);
        payload.docs = docs;
        payload.ok = payload.ok && docs.ok;
        payload.smokeSource = path.relative(root, smokePath).split(path.sep).join('/');
        payload.browser = browser;
        payload.skipped = false;
        payload.transport = 'cdp-setDocumentContent+theme-playground';
        console.log(JSON.stringify(payload));
        if (!payload.ok) process.exitCode = 1;
    } catch (error) {
        const message = error && error.stack ? error.stack : String(error);
        if (!required && /DevTools|Chromium.*timed out|Failed to connect/.test(message)) skipped(message.split('\n')[0]);
        else {
            console.error(message);
            process.exitCode = 1;
        }
    } finally {
        if (cdp && cdp.socket) try { cdp.socket.close(); } catch (_) {}
        if (launched && launched.child) {
            try { launched.child.kill('SIGKILL'); } catch (_) {}
            try { fs.rmSync(launched.profile, { recursive: true, force: true }); } catch (_) {}
        }
    }
}

main();
