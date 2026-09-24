import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import configs from '../rollup.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.type, 'module');
assert.equal(pkg.main, './dist/esm/index.js', 'Package main must resolve to the preserveModules ESM graph so root/subpath imports share one runtime.');
assert.equal(pkg.module, './dist/esm/index.js');
assert.equal(pkg.browser, undefined, 'Do not overload the bundler browser field with the IIFE global build.');
assert.equal(pkg.unpkg, './dist/qxframe9a7c2.js', 'UNPKG direct-script entry must use the IIFE build.');
assert.equal(pkg.jsdelivr, './dist/qxframe9a7c2.js', 'jsDelivr direct-script entry must use the IIFE build.');
assert.equal(pkg.types, './dist/qxframe9a7c2.d.ts');
assert.ok((pkg.files || []).includes('THIRD_PARTY_NOTICES.md'), 'npm package must include third-party notices.');
const thirdPartyNotices = fs.readFileSync(path.join(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
assert.match(thirdPartyNotices, /Floating UI/);
assert.match(thirdPartyNotices, /MIT License/);
assert.match(thirdPartyNotices, /Copyright \(c\) 2021 Floating UI contributors/);
const floatingVendor = fs.readFileSync(path.join(root, 'src/vendor/floating-ui.js'), 'utf8');
assert.match(floatingVendor, /THIRD_PARTY_NOTICES\.md/);
assert.ok(!/Replace with @floating-ui\/dom at package-publish time/.test(floatingVendor), 'Vendored Floating UI authority must not retain obsolete publish-time replacement instructions.');
assert.equal(pkg.devDependencies.rollup, '4.63.4', 'Rollup release toolchain must be pinned.');
assert.equal(pkg.devDependencies['@rollup/wasm-node'], '4.63.4', 'Official Rollup WASM fallback must stay version-aligned.');
assert.equal(pkg.devDependencies.typescript, '5.8.3', 'TypeScript verifier must be reproducible from declared devDependencies.');
assert.equal(pkg.devDependencies.ws, '8.21.3', 'Node 18 browser verification requires the declared ws fallback devDependency.');
const wsClient = fs.readFileSync(path.join(root, 'tools/websocket-client.mjs'), 'utf8');
assert.match(wsClient, /globalThis\.WebSocket/, 'Browser verifier should prefer the native Node WebSocket when available.');
assert.match(wsClient, /import\('ws'\)/, 'Browser verifier must provide the Node 18 ws fallback.');
assert.equal(pkg.scripts['verify:browser'], 'node tools/verify-browser-suite.mjs', 'Release browser gate must be strict and non-skippable.');
assert.ok(pkg.scripts['verify:browser:optional'], 'Optional per-developer browser smoke chain should remain separately available.');
assert.equal(pkg.dependencies?.typescript, undefined, 'TypeScript is build/test-only and must not leak into runtime dependencies.');
assert.equal(pkg.scripts.build, 'node tools/build-release.mjs');
assert.ok(/verify-release-artifacts\.mjs/.test(pkg.scripts['verify:release'] || ''));
assert.equal(pkg.scripts['verify:rollup-source'], 'node tools/verify-rollup-source-compatibility.mjs');
assert.equal(pkg.scripts['verify:rollup-provider'], 'node tools/verify-rollup-provider.mjs');
assert.equal(pkg.scripts['verify:release-transaction'], 'node tools/verify-release-transaction.mjs');
assert.equal(pkg.scripts['verify:release-build-rollback'], 'node tools/verify-release-build-rollback.mjs');
assert.equal(pkg.scripts['verify:source-umd-browser'], 'node tools/verify-source-umd-browser.mjs');
assert.equal(pkg.scripts['verify:types'], 'node tools/verify-types.mjs');
assert.equal(pkg.scripts['verify:release-metadata'], 'node tools/verify-release-metadata.mjs');
assert.equal(pkg.scripts['verify:postbuild-independence'], 'node tools/verify-postbuild-independence.mjs');
const browserSuite = fs.readFileSync(path.join(root, 'tools/verify-browser-suite.mjs'), 'utf8');
for (const script of ['verify-browser-smoke.mjs','verify-source-esm-browser.mjs','verify-source-umd-browser.mjs','verify-high-risk-browser.mjs','verify-preserve-subpath-browser.mjs']) {
    assert.ok(browserSuite.includes(script), `Strict browser suite must execute ${script}.`);
}
assert.match(browserSuite, /Release browser verification requires Chromium\/Chrome/, 'Strict browser suite must fail closed when Chromium is unavailable.');
assert.equal(
    pkg.scripts['verify:legacy-browser'],
    'node tools/verify-browser-smoke.mjs --required --skip-docs --smoke=tools/fixtures/legacy-hotfix6/verify-browser-smoke-phase-c.html',
    'HOTFIX6-derived Phase C browser compatibility gate must remain explicit and strict.'
);
const frozenBrowserSmoke = path.join(root, 'tools', 'fixtures', 'legacy-hotfix6', 'verify-browser-smoke.html');
const phaseCLegacyBrowserSmoke = path.join(root, 'tools', 'fixtures', 'legacy-hotfix6', 'verify-browser-smoke-phase-c.html');
assert.ok(fs.existsSync(frozenBrowserSmoke), 'Frozen HOTFIX6 browser smoke source must remain available and unchanged as archival evidence.');
assert.ok(fs.existsSync(phaseCLegacyBrowserSmoke), 'Phase C legacy compatibility smoke must remain available.');
const frozenBrowserSmokeSource = fs.readFileSync(frozenBrowserSmoke, 'utf8');
const phaseCLegacyBrowserSmokeSource = fs.readFileSync(phaseCLegacyBrowserSmoke, 'utf8');
assert.match(frozenBrowserSmokeSource, /QX_BROWSER_SMOKE:/, 'Frozen HOTFIX6 browser smoke must contain the original result marker.');
assert.match(phaseCLegacyBrowserSmokeSource, /QX_BROWSER_SMOKE:/, 'Phase C legacy compatibility smoke must contain the result marker.');
const supersededFocusChecks = ['regression-time-panel-outer-focus-owner','regression-date-time-panel-focusable'];
function normalizeSupersededFocusChecks(source) {
    return source.split('\n').map((line) => supersededFocusChecks.some((name) => line.includes(name)) ? '__PHASE_C_SUPERSEDED_FOCUS_CHECK__' : line).join('\n');
}
assert.equal(
    normalizeSupersededFocusChecks(phaseCLegacyBrowserSmokeSource),
    normalizeSupersededFocusChecks(frozenBrowserSmokeSource),
    'Phase C legacy compatibility fixture may differ from frozen HOTFIX6 only in the two superseded TimePanel focus-owner checks.'
);
for (const name of supersededFocusChecks) {
    assert.equal((frozenBrowserSmokeSource.match(new RegExp(name, 'g')) || []).length, 1, 'Frozen HOTFIX6 smoke must contain exactly one ' + name + ' check.');
    assert.equal((phaseCLegacyBrowserSmokeSource.match(new RegExp(name, 'g')) || []).length, 1, 'Phase C compatibility smoke must contain exactly one ' + name + ' check.');
}
assert.equal(
    pkg.scripts.release,
    'npm run build && npm run verify && npm run verify:browser && npm run verify:legacy-browser && npm run verify:release && npm run verify:package',
    'Release must run current browser verification and the strict HOTFIX6-derived Phase C compatibility smoke before artifact/package gates.'
);
assert.equal(pkg.exports['.'].import, './dist/esm/index.js');
assert.equal(pkg.exports['.'].default, './dist/esm/index.js');
assert.equal(pkg.exports['./bundle'].import, './dist/qxframe9a7c2.esm.js');
assert.equal(pkg.exports['./dist/qxframe9a7c2.esm.js'], './dist/qxframe9a7c2.esm.js');
assert.equal(pkg.exports['.'].types, './dist/qxframe9a7c2.d.ts');
assert.equal(pkg.exports['./components/*'].types, './dist/esm/components/*.d.ts');
assert.equal(pkg.exports['./components/*'].import, './dist/esm/components/*.js');
assert.equal(pkg.exports['./core/*'].types, './dist/esm/core/*.d.ts');
assert.equal(pkg.exports['./core/*'].import, './dist/esm/core/*.js');
assert.equal(pkg.exports['./utils/*'].types, './dist/esm/utils/*.d.ts');
assert.equal(pkg.exports['./utils/*'].import, './dist/esm/utils/*.js');
assert.equal(pkg.exports['./components'].types, './dist/esm/components/index.d.ts');
assert.equal(pkg.exports['./core'].types, './dist/esm/core/index.d.ts');
assert.equal(pkg.exports['./utils'].types, './dist/esm/utils/index.d.ts');

assert.ok(Array.isArray(configs) && configs.length === 3, 'Rollup must expose exactly IIFE, ESM bundle, and preserveModules outputs.');
const [iife, esm, preserved] = configs;
assert.equal(iife.input, 'src/index.umd.js');
assert.equal(iife.output.file, 'dist/qxframe9a7c2.js');
assert.equal(iife.output.format, 'iife');
assert.equal(iife.output.name, undefined, 'IIFE entry must not create an auxiliary bundle global.');
assert.equal(esm.input, 'src/index.js');
assert.equal(esm.output.file, 'dist/qxframe9a7c2.esm.js');
assert.equal(esm.output.format, 'es');
assert.equal(preserved.input, 'src/index.js');
assert.equal(preserved.output.dir, 'dist/esm');
assert.equal(preserved.output.format, 'es');
assert.equal(preserved.output.preserveModules, true);
assert.equal(preserved.output.preserveModulesRoot, 'src');
for (const config of configs) assert.equal(config.treeshake, false, 'Migration release must preserve behavior before any tree-shaking optimization phase.');

const umdEntry = fs.readFileSync(path.join(root, 'src/index.umd.js'), 'utf8');
assert.match(umdEntry, /initializeGlobal\(api\)/);
assert.ok(!/\bexport\b/.test(umdEntry), 'IIFE entry must not export a value that forces an auxiliary Rollup global.');
const build = fs.readFileSync(path.join(root, 'tools/build-release.mjs'), 'utf8');
assert.match(build, /loadRollupProvider/);
assert.match(build, /createReleaseStage/);
assert.match(build, /verifyReleaseArtifacts/);
assert.match(build, /replaceDistAtomically/);
const provider = fs.readFileSync(path.join(root, 'tools/rollup-provider.mjs'), 'utf8');
assert.match(provider, /'rollup', '@rollup\/wasm-node'/);
assert.match(provider, /QXFRAME_ROLLUP_PROVIDER/);
const metadata = fs.readFileSync(path.join(root, 'tools/generate-release-metadata.mjs'), 'utf8');
assert.match(metadata, /ComponentContracts/);
assert.match(metadata, /ModuleManifest/);
const postbuild = fs.readFileSync(path.join(root, 'tools/postbuild-release.mjs'), 'utf8');
assert.match(postbuild, /writeReleaseMetadata/);
assert.ok(!/currentDist|docs\/generated\/component-api/.test(postbuild), 'Postbuild must derive release metadata from canonical source, never an existing dist/docs snapshot.');
const types = fs.readFileSync(path.join(root, 'tools/generate-types.mjs'), 'utf8');
assert.match(types, /ComponentContracts/);
assert.match(types, /preserveModules type facade/);
const transaction = fs.readFileSync(path.join(root, 'tools/release-transaction.mjs'), 'utf8');
assert.match(transaction, /release-dist-backup/);
assert.match(transaction, /assertNoPendingReleaseRecovery/);
assert.match(transaction, /sole surviving/);
assert.match(transaction, /fs\.renameSync/);
assert.ok(!/frozen-production|frozen-production-hashes/.test(build), 'Production build must not contain a frozen-dist fallback.');
assert.ok(!fs.existsSync(path.join(root, 'tools/build-modern.mjs')), 'Legacy fallback build script must remain removed.');

console.log(JSON.stringify({ ok: true, rollupOutputs: 3, packageExports: true, strictBuild: true, providerFallback: true, providerInjection: true, atomicReleaseTransaction: true, rollbackBuildGuard: true, esmTypes: true, sourceDerivedMetadata: true, postbuildIndependent: true, thirdPartyNotices: true, auxiliaryIifeGlobal: false, frozenFallback: false }));
