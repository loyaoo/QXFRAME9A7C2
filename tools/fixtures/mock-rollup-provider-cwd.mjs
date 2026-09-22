import fs from 'node:fs';
import path from 'node:path';

export const VERSION = '4.63.4';
export async function rollup(options = {}) {
    const inputs = typeof options.input === 'string' ? [options.input] : Array.isArray(options.input) ? options.input : Object.values(options.input || {});
    if (!inputs.length) throw new Error('cwd fixture received no Rollup input');
    for (const input of inputs) {
        if (!path.isAbsolute(input)) throw new Error(`Rollup input is not absolute: ${input}`);
        if (!fs.existsSync(input)) throw new Error(`Rollup input does not exist: ${input}`);
    }
    return {
        async write(output = {}) {
            if (output.preserveModulesRoot) {
                if (!path.isAbsolute(output.preserveModulesRoot)) throw new Error(`preserveModulesRoot is not absolute: ${output.preserveModulesRoot}`);
                if (!fs.existsSync(output.preserveModulesRoot)) throw new Error(`preserveModulesRoot does not exist: ${output.preserveModulesRoot}`);
            }
        },
        async close() {}
    };
}
