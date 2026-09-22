import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRollupProvider, REQUIRED_ROLLUP_VERSION } from './rollup-provider.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
assert.equal(pkg.devDependencies.rollup, REQUIRED_ROLLUP_VERSION);
assert.equal(pkg.devDependencies['@rollup/wasm-node'], REQUIRED_ROLLUP_VERSION);

const previous = process.env.QXFRAME_ROLLUP_PROVIDER;
try {
    process.env.QXFRAME_ROLLUP_PROVIDER = './tools/fixtures/mock-rollup-provider.mjs';
    const injected = await loadRollupProvider({ root });
    assert.equal(injected.version, REQUIRED_ROLLUP_VERSION);
    assert.equal(injected.injected, true);

    process.env.QXFRAME_ROLLUP_PROVIDER = './tools/fixtures/mock-rollup-provider-no-version.mjs';
    const versionless = await loadRollupProvider({ root, optional: true });
    assert.equal(versionless.available, false, 'Versionless injected Rollup providers must be rejected.');
    assert.match(versionless.attempts[0]?.message || '', /does not expose a verifiable VERSION/);
} finally {
    if (previous === undefined) delete process.env.QXFRAME_ROLLUP_PROVIDER;
    else process.env.QXFRAME_ROLLUP_PROVIDER = previous;
}

const probe = await loadRollupProvider({ root, optional: true });
console.log(JSON.stringify({
    ok: true,
    requiredVersion: REQUIRED_ROLLUP_VERSION,
    providerAvailable: probe.available,
    provider: probe.provider,
    version: probe.version,
    injectedProvider: probe.injected,
    strictVersionVerification: true,
    versionlessProviderRejected: true,
    attempts: probe.available ? [] : probe.attempts
}, null, 2));
