# QXFRAME9A7C2 ESM migration — release environment hardening v31

## Status

Architecture progress remains at the final release boundary. Source/runtime migration is complete; the only remaining blocker to 100% is executing the real Rollup production build in an environment where the declared Rollup provider can be installed.

## Changes in v31

### 1. Release/build tooling no longer depends on caller cwd

- `tools/build-release.mjs` resolves every Rollup input against the project root.
- `preserveModulesRoot` is also normalized against the project root before `bundle.write()`.
- `tools/verify-package-contents.mjs` runs `npm pack` with `cwd: root`.
- Added `verify:tool-cwd`, which launches key build/package tools from an unrelated temporary working directory and verifies that the project root is still used.

### 2. TypeScript verifier is reproducible

- Added `typescript@5.8.3` as an explicit devDependency.
- `verify-types.mjs` prefers `node_modules/.bin/tsc` and only uses a system `tsc` as a fallback when dependencies are intentionally unavailable in the current sandbox.
- Root ESM types and 155 preserveModules declarations continue to compile and resolve through package exports.

### 3. Browser release gate is fail-closed

- Added `tools/verify-browser-suite.mjs`.
- `npm run verify:browser` now requires Chromium/Chrome and executes all five browser layers:
  1. committed production dist smoke/regression
  2. source ESM
  3. source UMD entry
  4. high-risk authorities
  5. all public preserveModules subpaths
- A missing browser is now a release failure rather than `skipped:true` success.
- The old developer-friendly skip behavior remains available as `verify:browser:optional`.

### 4. Node 18 browser-tool compatibility

- Added `ws@8.21.3` as a devDependency.
- Browser/CDP tools prefer native `globalThis.WebSocket` when available and dynamically fall back to `ws` on Node versions without the global WebSocket implementation.
- Runtime package dependencies remain empty; this is development/release tooling only.

### 5. Rollup release toolchain update

- Standard `rollup` and official `@rollup/wasm-node` fallback are both pinned to `4.63.4`.
- Provider version validation, injected-provider fixtures, and preflight assertions were updated together.

### 6. preserveModules source-map completeness

`verify-release-artifacts` now requires one-to-one mapping for the entire preserveModules graph:

- every `dist/esm/**/*.js` must have `*.js.map`;
- every preserveModules map must have its matching JS file;
- every map continues to be checked for version, non-empty sources, no absolute source paths, and no references to removed legacy runtime directories.

This covers internal runtime/vendor/initializer modules as well as the 155 public subpaths.

## Current verified architecture

- modern source JS files: 164
- static ESM edges: 1216
- external source imports: 0
- import cycles: 0
- legacy imports: 0
- migration dependency injectors: 0
- public preserveModules subpaths: 155
- Components parity: 40/40
- ModuleManifest parity: 72/72
- migration metadata parity: 359/359
- reachable legacy implementations: 0
- legacy runtime markers: 0

## Remaining blocker

The execution environment still cannot install or download the declared official Rollup provider. Therefore the real production bundle cannot be generated in this sandbox and the migration must not be labeled 100% yet.

The intended final command remains:

```bash
npm install
npm run release
```

A valid release must perform the real Rollup build, pass staged artifact verification, atomically commit `dist`, pass the strict five-layer browser suite, validate all release/package artifacts, pack/install the npm tarball, and verify root/subpath module identity.

## Final v31 verification evidence

Final verification was repeated after the project directory was renamed to the v31 path, so the result also checks that active tooling does not contain a hidden v30 absolute-path dependency.

- `npm test`: PASS.
- strict `npm run verify:browser`: PASS with Chromium `/usr/bin/chromium` and all 5 required layers; no browser layer was skipped.
- root TypeScript/package export verification: PASS; 194 root exports, 40 component option contracts, and 155 preserveModules declarations are covered.
- source/metadata parity: Components 40/40, ModuleManifest 72/72, migration metadata 359/359.
- `npm run build:frozen`: PASS.
- archival frozen hashes remain unchanged:
  - `dist/qxframe9a7c2.js`: `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
  - `dist/qxframe9a7c2.css`: `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`
  - `dist/qxframe9a7c2.d.ts`: `fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573`
- strict `npm run build`: expected BLOCKED with exit code 2 because neither declared official Rollup provider is installed in this sandbox.
- recursive committed `dist` hash before and after that failed build is identical: `d2b916d29c409d4a518139d4a74997c08c287d1497bb66bd37a7d4755c11ba64`.
- `npm pack --dry-run`: succeeds against the current frozen package layout; current archival package preview is 323 files, 3,890,841 compressed bytes and 22,127,748 unpacked bytes.
- release/build scratch pollution at closeout: no `.release-stage`, `.release-dist-backup`, `node_modules`, or generated `*.tgz` remains in the project tree.

Accordingly, v31 keeps the status below 100% solely because a real Rollup provider cannot be obtained inside this execution environment. No source/runtime migration item is being deferred behind that status.
