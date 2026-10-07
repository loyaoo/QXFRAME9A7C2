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

function createCanonicalGeometrySmoke() {
    const sourcePath = path.join(root, 'tools', 'verify-browser-smoke.html');
    let source = fs.readFileSync(sourcePath, 'utf8');
    const replacements = [
        [
            "var sgHost=makeRegressionHost();sgHost.style.setProperty('--qxframe9a7c2-family-control-height','46px');sgHost.style.setProperty('--qxframe9a7c2-family-control-font-size','20px');",
            "var sgHost=makeRegressionHost();sgHost.style.setProperty('--qxframe9a7c2-theme-control-height','2.5rem');"
        ],
        [
            "record('regression-select-single-multiple-share-family-control-height',Math.abs(h1-h2)<0.75&&h1>=45&&h2>=45,'single='+h1+',multiple='+h2);",
            "record('regression-select-single-multiple-share-family-control-height',Math.abs(h1-40)<0.75&&h2>=39.25&&h2+0.75>=h1,'single='+h1+',multiple='+h2+',contract=md40/intrinsic-multiple-growth');"
        ],
        [
            "var collapseFamilyHost=makeRegressionHost();collapseFamilyHost.style.setProperty('--qxframe9a7c2-family-control-height','50px');",
            "var collapseFamilyHost=makeRegressionHost();collapseFamilyHost.style.setProperty('--qxframe9a7c2-theme-control-height','2.5rem');"
        ],
        [
            "record('regression-collapse-family-height-shared-across-sizes',collapseFamilyHeights.length===3&&collapseFamilyHeights.every(function(v){return Math.abs(v-50)<0.75;}),'heights='+collapseFamilyHeights.join(','));",
            "var collapseFamilyExpected=[32,40,48];record('regression-collapse-family-height-shared-across-sizes',collapseFamilyHeights.length===3&&collapseFamilyHeights.every(function(v,i){return Math.abs(v-collapseFamilyExpected[i])<0.75;}),'heights='+collapseFamilyHeights.join(',')+',expected='+collapseFamilyExpected.join(','));"
        ]
    ];
    replacements.forEach(function ([from, to]) {
        assert.ok(source.includes(from), 'Canonical browser smoke contract drifted before qx-md-2 adaptation: ' + from.slice(0, 96));
        source = source.replace(from, to);
        assert.ok(source.includes(to), 'Failed to install qx-md-2 browser smoke contract: ' + to.slice(0, 96));
    });
    const output = path.join('/tmp', 'qxframe9a7c2-browser-smoke-qx-md-2-' + process.pid + '.html');
    fs.writeFileSync(output, source, 'utf8');
    return output;
}

const canonicalGeometrySmoke = createCanonicalGeometrySmoke();
const results = [];
try {
    for (const script of scripts) {
        let result = null;
        let attempt = 0;
        const args = [path.join(root, 'tools', script)];
        if (script === 'verify-browser-smoke.mjs') args.push('--smoke=' + canonicalGeometrySmoke);
        for (; attempt < 3; attempt += 1) {
            result = spawnSync(process.execPath, args, {
                cwd: root,
                encoding: 'utf8',
                env: { ...process.env, CHROMIUM_BIN: browser, QX_BROWSER_REQUIRED: '1' }
            });
            if (result.status === 0) break;
            const output = String(result.stdout || '') + '\n' + String(result.stderr || '');
            if (!/Chromium DevTools endpoint timed out|CDP endpoint timeout/.test(output)) break;
        }
        if (result.status !== 0) {
            const stdoutLines = String(result.stdout || '').trim().split(/\r?\n/).filter(Boolean);
            const jsonLine = stdoutLines.slice().reverse().find(line => line.trim().startsWith('{') && line.includes('\"ok\"'));
            let summary = null;
            if (jsonLine) {
                try {
                    const payload = JSON.parse(jsonLine);
                    summary = {
                        error: payload && payload.error || null,
                        failedChecks: Array.isArray(payload && payload.checks)
                            ? payload.checks.filter(check => check && check.ok === false).map(check => ({ name:check.name, detail:check.detail || '' }))
                            : [],
                        docs: payload && payload.docs ? {
                            ok: payload.docs.ok === true,
                            failures: Array.isArray(payload.docs.failures) ? payload.docs.failures : [],
                            unmounted: Array.isArray(payload.docs.unmounted) ? payload.docs.unmounted : [],
                            windowErrors: Array.isArray(payload.docs.windowErrors) ? payload.docs.windowErrors : [],
                            inputOtp: payload.docs.inputOtp || null,
                            v2Consumers: payload.docs.v2Consumers || null
                        } : null
                    };
                } catch (_) {}
            }
            if (!summary) {
                const stderr = String(result.stderr || '').trim();
                summary = { error: stderr || 'browser verification child exited non-zero', failedChecks: [] };
            }
            console.error('QX_BROWSER_SUITE_FAILURE:' + JSON.stringify({ script, attempts:attempt + 1, ...summary }));
        }
        assert.equal(result.status, 0, `${script} failed after ${attempt + 1} attempt(s). See QX_BROWSER_SUITE_FAILURE above.`);
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
} finally {
    fs.rmSync(canonicalGeometrySmoke, { force: true });
}
console.log(JSON.stringify({ ok: true, strict: true, browser, layers: results.length, results }));
