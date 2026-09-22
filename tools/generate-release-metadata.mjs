import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Components, ModuleManifest } from '../src/runtime/runtime.js';
import { ComponentRuntime } from '../src/runtime/componentRuntime.js';
import { ComponentContracts } from '../src/core/componentContracts.js';

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dependencyNamespaces = ['core', 'headless', 'domHeadless', 'buildingBlocks', 'components'];

function readJSON(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }
function serializable(value) {
    if (typeof value === 'function') return 'custom';
    if (Array.isArray(value)) return value.map(serializable);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serializable(item)]));
    return value;
}
function componentModuleMap(root) {
    const result = Object.create(null);
    for (const file of ['esm-component-authority.json', 'esm-support-authority.json']) {
        const manifest = readJSON(path.join(root, 'tools/manifests', file));
        for (const record of manifest.authorities || []) if (Object.prototype.hasOwnProperty.call(Components, record.name)) result[record.name] = record.module;
    }
    return result;
}

export function generateComponentApi({ root = ownRoot } = {}) {
    const pkg = readJSON(path.join(root, 'package.json'));
    const moduleByComponent = componentModuleMap(root);
    const components = Object.keys(Components).sort().map(name => {
        const definition = ComponentRuntime.describe(name);
        const moduleName = moduleByComponent[name];
        if (!definition) throw new Error('[generate-release-metadata] Missing ComponentRuntime definition for ' + name + '.');
        if (!moduleName) throw new Error('[generate-release-metadata] Missing ESM authority module mapping for ' + name + '.');
        const manifest = ModuleManifest.get(moduleName);
        if (!manifest) throw new Error('[generate-release-metadata] Missing ModuleManifest record for ' + moduleName + ' (' + name + ').');
        const capabilities = manifest.capabilities || {};
        return {
            name,
            schema: serializable(definition.schema),
            defaults: serializable(definition.defaults),
            immutable: serializable(definition.immutable),
            legacy: serializable(definition.legacy),
            optionImpact: serializable(definition.optionImpact),
            initializer: serializable(definition.initializer),
            allowUnknown: definition.allowUnknown,
            dependencies: Object.fromEntries(dependencyNamespaces.map(namespace => [namespace, serializable(capabilities[namespace] || [])]))
        };
    });
    return { framework: 'QXFRAME9A7C2', version: pkg.version, components };
}

export function generateModuleManifest({ root = ownRoot } = {}) {
    const pkg = readJSON(path.join(root, 'package.json'));
    return { framework: 'QXFRAME9A7C2', version: pkg.version, modules: serializable(ModuleManifest.list()) };
}

export function generateMigrationManifest({ root = ownRoot } = {}) {
    const pkg = readJSON(path.join(root, 'package.json'));
    const compatibility = readJSON(path.join(root, 'tools/manifests/compatibility.json'));
    const defaults = compatibility.defaults && compatibility.defaults.option || {};
    const entries = [];
    for (const component of ComponentContracts.names) {
        const contract = ComponentContracts.get(component);
        for (const name of contract && contract.legacy || []) entries.push({ kind:'option', component, name, status:'rejected', ...defaults });
    }
    entries.push(...serializable(compatibility.entries || []));
    return { framework:'QXFRAME9A7C2', version:pkg.version, policy:compatibility.policy, entries };
}

export function writeReleaseMetadata({ root = ownRoot, distDir = path.join(root, 'dist') } = {}) {
    fs.mkdirSync(distDir, { recursive:true });
    const metadata = {
        api: generateComponentApi({ root }),
        modules: generateModuleManifest({ root }),
        migration: generateMigrationManifest({ root })
    };
    fs.writeFileSync(path.join(distDir, 'qxframe9a7c2-api.json'), JSON.stringify(metadata.api, null, 2) + '\n');
    fs.writeFileSync(path.join(distDir, 'qxframe9a7c2-module-manifest.json'), JSON.stringify(metadata.modules, null, 2) + '\n');
    fs.writeFileSync(path.join(distDir, 'qxframe9a7c2-migration.json'), JSON.stringify(metadata.migration, null, 2) + '\n');
    return metadata;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const metadata = writeReleaseMetadata();
    console.log(JSON.stringify({ ok:true, components:metadata.api.components.length, modules:metadata.modules.modules.length, migrationEntries:metadata.migration.entries.length }));
}
