import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadRollupProvider } from './rollup-provider.mjs';
import { createReleaseStage, stageOutput, replaceDistAtomically, cleanupReleaseStage } from './release-transaction.mjs';
import { runPostbuild } from './postbuild-release.mjs';
import { verifyReleaseArtifacts } from './verify-release-artifacts.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let provider;
try {
    provider = await loadRollupProvider({ root });
} catch (error) {
    console.error(`[build-release] ${error.message}`);
    process.exit(2);
}

const configs = (await import(new URL('../rollup.config.mjs', import.meta.url))).default;
if (!Array.isArray(configs) || configs.length !== 3) throw new Error('[build-release] rollup.config.mjs must expose exactly three release outputs.');

function resolveRollupInput(input) {
    if (typeof input === 'string') return path.isAbsolute(input) ? input : path.resolve(root, input);
    if (Array.isArray(input)) return input.map(resolveRollupInput);
    if (input && typeof input === 'object') {
        return Object.fromEntries(Object.entries(input).map(([name, value]) => [name, resolveRollupInput(value)]));
    }
    return input;
}

function resolveRollupOutput(output) {
    if (!output || !output.preserveModulesRoot) return output;
    return {
        ...output,
        preserveModulesRoot: path.isAbsolute(output.preserveModulesRoot)
            ? output.preserveModulesRoot
            : path.resolve(root, output.preserveModulesRoot)
    };
}

const { stageRoot, stageDist } = createReleaseStage(root);
try {
    for (const config of configs) {
        const { output, ...input } = config;
        const bundle = await provider.api.rollup({ ...input, input: resolveRollupInput(input.input) });
        try {
            if (Array.isArray(output)) {
                for (const item of output) await bundle.write(stageOutput(resolveRollupOutput(item), stageRoot));
            } else {
                await bundle.write(stageOutput(resolveRollupOutput(output), stageRoot));
            }
        } finally {
            await bundle.close();
        }
    }

    await runPostbuild({ root, distDir: stageDist });
    const verified = await verifyReleaseArtifacts({ root, distDir: stageDist });
    const transaction = replaceDistAtomically({ root, stageDist });
    console.log(JSON.stringify({
        ok: true,
        mode: 'rollup-release',
        rollupProvider: provider.provider,
        rollupVersion: provider.version,
        injectedProvider: provider.injected,
        atomicDistReplace: transaction.replaced,
        preCommitVerified: verified.ok,
        outputs: ['dist/qxframe9a7c2.js', 'dist/qxframe9a7c2.esm.js', 'dist/esm/']
    }));
} finally {
    cleanupReleaseStage(root);
}
