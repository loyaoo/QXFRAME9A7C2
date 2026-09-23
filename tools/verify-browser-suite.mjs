import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const discoveryDisabled = process.env.QXFRAME_BROWSER_DISABLE_DISCOVERY === '1';
const candidates = discoveryDisabled
    ? [process.env.CHROMIUM_BIN]
    : [process.env.CHROMIUM_BIN, '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
const browser = candidates.filter(Boolean).find(fs.existsSync);
assert.ok(browser, 'Release browser verification requires Chromium/Chrome. Set CHROMIUM_BIN to a valid executable; browser verification may not be skipped during release.');

const scripts = [
    'verify-browser-smoke.mjs',
    'verify-source-esm-browser.mjs',
    'verify-source-umd-browser.mjs',
    'verify-high-risk-browser.mjs',
    'verify-preserve-subpath-browser.mjs'
];
const results = [];
for (const script of scripts) {
    let result = null;
    let attempt = 0;
    for (; attempt < 3; attempt += 1) {
        result = spawnSync(process.execPath, [path.join(root, 'tools', script)], {
            cwd: root,
            encoding: 'utf8',
            env: { ...process.env, CHROMIUM_BIN: browser, QX_BROWSER_REQUIRED: '1' }
        });
        if (result.status === 0) break;
        const output = String(result.stdout || '') + '\n' + String(result.stderr || '');
        if (!/Chromium DevTools endpoint timed out|CDP endpoint timeout/.test(output)) break;
    }
    assert.equal(result.status, 0, `${script} failed after ${attempt + 1} attempt(s):\n${result.stdout}\n${result.stderr}`);
    const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
    const last = lines.at(-1) || '';
    assert.ok(last, `${script} produced no verification result.`);
    let payload;
    try { payload = JSON.parse(last); }
    catch { throw new Error(`${script} did not end with JSON verification output:\n${result.stdout}`); }
    assert.equal(payload.ok, true, `${script} did not report ok=true.`);
    assert.notEqual(payload.skipped, true, `${script} was skipped inside the strict release browser suite.`);
    results.push({ script, attempts: attempt + 1, ...payload });
}
console.log(JSON.stringify({ ok: true, strict: true, browser, layers: results.length, results }));
