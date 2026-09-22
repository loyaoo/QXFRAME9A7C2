import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as api from '../src/index.js';
import { ComponentContracts } from '../src/core/componentContracts.js';

const ownRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function tsLiteral(value) {
    if (typeof value === 'string') return JSON.stringify(value);
    if (value === null) return 'null';
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return 'unknown';
}

function tsType(rule) {
    if (rule == null || rule === 'any') return 'unknown';
    if (Array.isArray(rule)) return rule.map(tsLiteral).join(' | ') || 'never';
    if (typeof rule === 'object') {
        let output = 'unknown';
        if (Array.isArray(rule.enum)) output = rule.enum.map(tsLiteral).join(' | ') || 'never';
        else if (Array.isArray(rule.types)) output = rule.types.map(tsType).join(' | ') || 'unknown';
        else if (rule.type) output = tsType(rule.type);
        return rule.nullable === true ? `${output} | null` : output;
    }
    if (rule === 'string' || rule === 'number' || rule === 'boolean') return rule;
    if (rule === 'array') return 'unknown[]';
    if (rule === 'element') return 'Element';
    if (rule === 'document') return 'Document';
    if (rule === 'function') return '((...args: any[]) => any)';
    if (rule === 'object') return 'Record<string, unknown>';
    return 'unknown';
}

function isClass(value) {
    return typeof value === 'function' && /^class\s/.test(Function.prototype.toString.call(value));
}

function classParentName(value) {
    const parent = Object.getPrototypeOf(value);
    return parent && parent !== Function.prototype && parent.name ? parent.name : null;
}

function emitRootDeclarations() {
    const lines = [
        '// Generated from canonical ESM exports + ComponentContracts by tools/generate-types.mjs. Do not edit by hand.',
        'export interface QXComponentInstance {',
        '  destroy(): boolean | void;',
        '  updateOptions?(options: Record<string, unknown>): unknown;',
        '  getRootElement?(): Element | null;',
        '  readonly root?: unknown;',
        '  readonly destroyed?: boolean;',
        '}',
        'export interface QXComponentApi<TOptions> {',
        '  readonly definition?: unknown;',
        '  create(options?: TOptions): QXComponentInstance;',
        '  enhance?(target: Element | string, options?: TOptions): QXComponentInstance;',
        '  readonly [key: string]: unknown;',
        '}',
        'export interface QXComponentClass<TOptions, TInstance extends QXComponentInstance> {',
        '  new(options?: TOptions): TInstance;',
        '  create(options?: TOptions): TInstance;',
        '  enhance?(target: Element | string, options?: TOptions): TInstance;',
        '  readonly contract?: unknown;',
        '}',
        ''
    ];

    for (const name of ComponentContracts.names) {
        const contract = ComponentContracts.get(name);
        lines.push(`export interface ${name}Options {`);
        for (const key of Object.keys(contract.schema || {}).sort()) lines.push(`  ${JSON.stringify(key)}?: ${tsType(contract.schema[key])};`);
        lines.push('}', '');
    }

    lines.push('export interface QXComponents {');
    for (const name of Object.keys(api.Components).sort()) lines.push(`  ${name}: QXComponentApi<${name}Options>;`);
    lines.push('}', '');
    lines.push('export interface QXModuleManifestRecord { readonly name: string; readonly modules: readonly string[]; readonly capabilities: Readonly<Record<string, unknown>>; }');
    lines.push('export interface QXModuleManifest { list(): QXModuleManifestRecord[]; has(name: string): boolean; get(name: string): QXModuleManifestRecord | null; }');
    lines.push('export interface QXRuntime { readonly Core: Readonly<Record<string, any>>; readonly Headless: Readonly<Record<string, any>>; readonly DOMHeadless: Readonly<Record<string, any>>; readonly BuildingBlocks: Readonly<Record<string, any>>; readonly Components: QXComponents; readonly ModuleManifest: QXModuleManifest; readonly ComponentRuntime: any; readonly ComponentInitializer: any; init: (...args: any[]) => any; }');
    lines.push('');
    lines.push('export declare class Component {');
    lines.push('  static readonly options: Readonly<Record<string, unknown>>;');
    lines.push('  static readonly contract: unknown;');
    lines.push('  static create<T extends typeof Component>(this: T, options?: Record<string, unknown>): InstanceType<T>;');
    lines.push('  constructor(options?: Record<string, unknown>);');
    lines.push('  render(): this;');
    lines.push('  mount(target?: unknown): this;');
    lines.push('  reload(options?: Record<string, unknown>): this;');
    lines.push('  updateOptions(options?: Record<string, unknown>): this;');
    lines.push('  destroy(): boolean;');
    lines.push('  once(type: string, listener: (detail: any) => void): () => boolean;');
    lines.push('  on(type: string, listener: (detail: any) => void): () => boolean;');
    lines.push('  off(type: string, listener?: (detail: any) => void): boolean;');
    lines.push('  emit(type: string, detail?: any): number;');
    lines.push('  own<T>(resource: T): T;');
    lines.push('  listen(target: EventTarget, type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): () => boolean;');
    lines.push('  readonly id: string; readonly root: unknown; readonly options: Record<string, unknown>; readonly contract: unknown; readonly destroyed: boolean; readonly rendered: boolean; readonly mounted: boolean;');
    lines.push('}', '');

    const familyBases = new Set(['FieldComponent','PopupFieldComponent','PickerComponent','PopupComponent','OverlayComponent']);
    const emitted = new Set(['Component']);
    for (const name of familyBases) {
        const value = api[name];
        const parent = classParentName(value) || 'Component';
        lines.push(`export declare class ${name} extends ${parent} { constructor(options?: Record<string, unknown>); }`, '');
        emitted.add(name);
    }

    const componentNames = new Set(Object.keys(api.Components));
    for (const name of [...componentNames].sort()) {
        const value = api[name];
        if (isClass(value)) {
            const parent = classParentName(value) || 'Component';
            lines.push(`export interface ${name} extends ${parent} {}`);
            lines.push(`export declare const ${name}: QXComponentClass<${name}Options, ${name}>;`, '');
        } else {
            lines.push(`export declare const ${name}: QXComponentApi<${name}Options>;`, '');
        }
        emitted.add(name);
    }

    // JSONComponent is a named alias of the JSON component adapter.
    if ('JSONComponent' in api) {
        lines.push('export declare const JSONComponent: QXComponentApi<JSONOptions>;', '');
        emitted.add('JSONComponent');
    }

    lines.push('export declare const Components: QXComponents;');
    lines.push('export declare const ModuleManifest: QXModuleManifest;');
    lines.push('export declare const Core: Readonly<Record<string, any>>;');
    lines.push('export declare const Headless: Readonly<Record<string, any>>;');
    lines.push('export declare const DOMHeadless: Readonly<Record<string, any>>;');
    lines.push('export declare const BuildingBlocks: Readonly<Record<string, any>>;');
    lines.push('export declare const ComponentRuntime: any;');
    lines.push('export declare const ComponentInitializer: any;');
    lines.push('export declare const QXFRAME9A7C2: QXRuntime;');
    lines.push('export declare function initializeRuntime(target?: typeof globalThis): boolean;');
    for (const name of ['Components','ModuleManifest','Core','Headless','DOMHeadless','BuildingBlocks','ComponentRuntime','ComponentInitializer','QXFRAME9A7C2','initializeRuntime']) emitted.add(name);

    const rootNames = Object.keys(api).filter(name => name !== 'default').sort();
    for (const name of rootNames) {
        if (emitted.has(name)) continue;
        const value = api[name];
        if (isClass(value)) {
            const parent = classParentName(value);
            const extendsClause = parent && rootNames.includes(parent) ? ` extends ${parent}` : '';
            lines.push(`export declare class ${name}${extendsClause} { constructor(...args: any[]); }`);
        } else if (typeof value === 'function') {
            lines.push(`export declare function ${name}(...args: any[]): any;`);
        } else if (typeof value === 'string') {
            lines.push(`export declare const ${name}: string;`);
        } else if (typeof value === 'number') {
            lines.push(`export declare const ${name}: number;`);
        } else if (typeof value === 'boolean') {
            lines.push(`export declare const ${name}: boolean;`);
        } else {
            lines.push(`export declare const ${name}: any;`);
        }
        emitted.add(name);
    }
    lines.push('export default QXFRAME9A7C2;', '');
    return { text: lines.join('\n'), exportNames: rootNames };
}

async function emitSubpathTypes({ root, distDir, rootExportNames }) {
    const rootSet = new Set(rootExportNames);
    for (const section of ['components','core','utils']) {
        const sourceDir = path.join(root, 'src', section);
        const outputDir = path.join(distDir, 'esm', section);
        fs.mkdirSync(outputDir, { recursive: true });
        for (const filename of fs.readdirSync(sourceDir).filter(name => name.endsWith('.js')).sort()) {
            const sourceFile = path.join(sourceDir, filename);
            const module = await import(pathToFileURLWithNonce(sourceFile));
            const names = Object.keys(module).sort();
            const lines = ['// Generated preserveModules type facade. Do not edit by hand.'];
            for (const name of names) {
                if (name === 'default') continue;
                if (rootSet.has(name)) lines.push(`export { ${name} } from '../../qxframe9a7c2.js';`);
                else lines.push(`export declare const ${name}: any;`);
            }
            if ('default' in module) lines.push('declare const _default: any;', 'export default _default;');
            fs.writeFileSync(path.join(outputDir, filename.replace(/\.js$/, '.d.ts')), lines.join('\n') + '\n');
        }
    }
}

function pathToFileURLWithNonce(file) {
    const url = pathToFileURL(file);
    url.searchParams.set('types', `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    return url.href;
}

export async function generateTypes({ root = ownRoot, distDir = path.join(root, 'dist') } = {}) {
    fs.mkdirSync(distDir, { recursive: true });
    const generated = emitRootDeclarations();
    fs.writeFileSync(path.join(distDir, 'qxframe9a7c2.d.ts'), generated.text);
    await emitSubpathTypes({ root, distDir, rootExportNames: generated.exportNames });
    return { rootExports: generated.exportNames.length, componentOptions: ComponentContracts.names.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    console.log(JSON.stringify(await generateTypes()));
}
