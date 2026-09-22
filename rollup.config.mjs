const shared = {
    context: 'globalThis',
    treeshake: false,
    preserveEntrySignatures: 'strict'
};

export default [
    {
        ...shared,
        input: 'src/index.umd.js',
        output: {
            file: 'dist/qxframe9a7c2.js',
            format: 'iife',
            sourcemap: true,
            generatedCode: 'es2015'
        }
    },
    {
        ...shared,
        input: 'src/index.js',
        output: {
            file: 'dist/qxframe9a7c2.esm.js',
            format: 'es',
            sourcemap: true,
            generatedCode: 'es2015'
        }
    },
    {
        ...shared,
        input: 'src/index.js',
        output: {
            dir: 'dist/esm',
            format: 'es',
            preserveModules: true,
            preserveModulesRoot: 'src',
            sourcemap: true,
            generatedCode: 'es2015'
        }
    }
];
