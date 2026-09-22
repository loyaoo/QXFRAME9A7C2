import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const REQUIRED_ROLLUP_VERSION = '4.63.4';

function asImportSpecifier(value, root) {
    if (!value) return null;
    if (/^(?:file:|node:|data:)/.test(value)) return value;
    if (value.startsWith('.') || value.startsWith('/') || /^[A-Za-z]:[\\/]/.test(value)) {
        const absolute = path.isAbsolute(value) ? value : path.resolve(root, value);
        return pathToFileURL(absolute).href;
    }
    return value;
}

function resolveApi(moduleNamespace) {
    const api = moduleNamespace && typeof moduleNamespace.rollup === 'function'
        ? moduleNamespace
        : moduleNamespace && moduleNamespace.default && typeof moduleNamespace.default.rollup === 'function'
            ? moduleNamespace.default
            : null;
    if (!api) throw new Error('module does not expose a Rollup `rollup()` API');
    return api;
}

function resolveVersion(moduleNamespace, api) {
    return moduleNamespace?.VERSION || api?.VERSION || moduleNamespace?.version || api?.version || null;
}

export async function loadRollupProvider({ root = process.cwd(), requiredVersion = REQUIRED_ROLLUP_VERSION, optional = false } = {}) {
    const requested = process.env.QXFRAME_ROLLUP_PROVIDER || '';
    const candidates = requested ? [requested] : ['rollup', '@rollup/wasm-node'];
    const attempts = [];

    for (const candidate of candidates) {
        const specifier = asImportSpecifier(candidate, root);
        try {
            if (specifier?.startsWith('file:')) {
                const pathname = new URL(specifier);
                if (!fs.existsSync(pathname)) throw new Error(`provider path does not exist: ${pathname.pathname}`);
            }
            const moduleNamespace = await import(specifier);
            const api = resolveApi(moduleNamespace);
            const version = resolveVersion(moduleNamespace, api);
            if (requiredVersion && !version) throw new Error(`provider does not expose a verifiable VERSION; required ${requiredVersion}`);
            if (version && requiredVersion && version !== requiredVersion) {
                throw new Error(`provider version ${version} does not match required ${requiredVersion}`);
            }
            return {
                available: true,
                api,
                provider: candidate,
                specifier,
                version: version || null,
                injected: Boolean(requested),
                attempts
            };
        } catch (error) {
            attempts.push({ provider: candidate, message: error && error.message ? error.message : String(error) });
        }
    }

    const result = { available: false, api: null, provider: null, version: null, injected: Boolean(requested), attempts };
    if (optional) return result;
    const detail = attempts.map(item => `${item.provider}: ${item.message}`).join('\n');
    throw new Error(`No usable Rollup provider is available. Install rollup@${requiredVersion} or @rollup/wasm-node@${requiredVersion}, or set QXFRAME_ROLLUP_PROVIDER to a compatible local module.\n${detail}`);
}
