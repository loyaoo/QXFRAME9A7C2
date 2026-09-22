# QXFRAME9A7C2 ESM migration — package identity & release hardening v30

## Status

- Architecture / source migration: complete.
- Reachable legacy implementations: **0**.
- Legacy Registry / `defineModule` / legacy runtime markers in modern source: **0**.
- Static ESM graph: **164 files / 1216 edges / 0 external imports / 0 cycles / 0 legacy imports**.
- Public components: **40**.
- Static ModuleManifest records: **72**.
- Public preserveModules subpaths (`components + core + utils`): **155**.
- Overall migration completion: **~99.5%**.
- The only remaining completion gate is execution of the real official Rollup provider and acceptance of the generated production artifacts. The current sandbox does not contain `rollup` or `@rollup/wasm-node` and cannot download packages, therefore this report does **not** declare 100%.

## What v30 closes

### 1. npm root/subpath identity is now canonical

The npm root no longer points at the single-file ESM bundle. It now resolves to the preserveModules graph:

```text
qxframe9a7c2                         -> dist/esm/index.js
qxframe9a7c2/components/*            -> dist/esm/components/*.js
qxframe9a7c2/core/*                  -> dist/esm/core/*.js
qxframe9a7c2/utils/*                 -> dist/esm/utils/*.js
```

This prevents a consumer from loading two independent `Component`, Config, InstanceRegistry, or other singleton/class graphs when mixing root and subpath imports.

The single-file ESM artifact remains explicit:

```text
qxframe9a7c2/bundle                  -> dist/qxframe9a7c2.esm.js
```

Traditional direct-script / CDN delivery remains explicit:

```text
unpkg/jsdelivr                       -> dist/qxframe9a7c2.js (IIFE)
```

The `browser` field is intentionally absent so module-aware bundlers cannot redirect ESM imports to the IIFE build.

`verify-package-entry-semantics.mjs` creates a synthetic installed package and proves root/subpath class identity is shared while the explicit `/bundle` graph remains intentionally separate.

### 2. Migration-time runtime dependency injection is gone

Two remaining migration-era dependency injectors were found:

```text
Control  <- runtime injects Tags
Transfer <- runtime injects Pagination / Table
```

They are now ordinary static ESM dependencies:

```text
Control  -> import Tags
Transfer -> import Pagination, Table
```

`src/runtime/runtime.js` no longer configures these component dependencies.

This matters for published preserveModules entry points: a consumer can now import a component subpath directly without first importing the root runtime.

### 3. Every public preserveModules subpath is browser-tested independently

`verify-preserve-subpath-browser.mjs` directly imports every public source subpath without loading `src/index.js`:

```text
155 / 155 public subpaths PASS
Control tags mode PASS
Transfer pagination PASS
Transfer table mode PASS
runtime assembly required = false
```

The Rollup source guard additionally verifies that all 155 public subpaths are reachable from `src/index.js`, because Rollup `preserveModules` only emits modules reachable from its input.

### 4. Full release coverage replaces sample-only checks

The production release verifier and npm package-content verifier now require, for all 155 public subpaths:

```text
*.js
*.js.map
*.d.ts
```

That is **465 public-subpath release files**, in addition to root IIFE, single-file ESM, preserveModules entry, CSS, metadata, root declarations, and top-level maps.

This prevents a release where wildcard `exports` advertises a subpath that Rollup/types/postbuild failed to emit.

### 5. Real installed-package runtime gate

`verify-package-runtime.mjs` is prepared for the real release output. After Rollup succeeds it will:

1. run `npm pack` for the actual project;
2. install the generated tarball into an isolated temporary consumer with dev dependencies omitted;
3. import the package by package name, not filesystem paths;
4. verify root/subpath identities for `DatePicker`, `Component`, and `TreeQuery`;
5. verify the explicit `/bundle` entry;
6. verify the 40-component / 72-module public inventories.

It currently remains intentionally blocked because the real Rollup-generated `dist/esm/**` and single-file ESM bundle do not yet exist.

### 6. Release transaction recovery was hardened

The release transaction already staged output before replacing `dist`, but an extreme failure mode remained: if commit failed and rollback also failed, `.release-dist-backup` could later be deleted automatically.

v30 changes the rule:

- staging is disposable;
- a recovery backup is never automatically deleted after failed rollback;
- a new release refuses to begin while `.release-dist-backup` exists;
- successful commit removes the backup;
- successful rollback restores the prior `dist` and consumes the backup.

Automated transaction verification covers successful commit, successful rollback, backup preservation, and refusal to overwrite an unresolved recovery state.

### 7. Rollup provider injection is version-strict

The release loader accepts:

```text
rollup
@rollup/wasm-node
QXFRAME_ROLLUP_PROVIDER=<compatible local module>
```

All providers must expose a verifiable version matching the pinned release toolchain. A versionless injected provider is rejected instead of being silently treated as compatible.

Current project pin:

```text
rollup             4.63.3
@rollup/wasm-node  4.63.3
```

Both remain development-only build dependencies; no Rollup package is leaked into runtime dependencies of the published framework.

### 8. Third-party runtime attribution is now release-enforced

`src/vendor/floating-ui.js` is the canonical dependency-free Floating UI Core/DOM authority used by the browser source graph. Its old migration comment claiming it would later be replaced during package publication was obsolete and has been removed.

`THIRD_PARTY_NOTICES.md` now carries the Floating UI MIT attribution and is explicitly included in the npm package whitelist.

Release preflight and npm package-content validation require the notice; a future release cannot silently drop it.

### 9. Current source/release documentation matches the final architecture

`README.md`, `MIGRATION-src-dist-unified.md`, and `HARDENING-v2.19.81.md` now state the actual final contract:

- package root + public subpaths share the preserveModules graph;
- `/bundle` is the explicit single-file ESM entry;
- CDN/direct script uses IIFE;
- no migration dependency injection remains;
- release uses staging + verification + atomic commit;
- failed rollback preserves a manual recovery backup;
- vendored third-party runtime attribution is shipped with the package.

## Validation evidence

### Source / architecture

```text
npm test                               PASS
source files                           164
static ESM edges                       1216
external imports                       0
cycles                                 0
legacy imports                         0
migration dependency injectors         0
public preserveModules subpaths        155
unreachable public subpaths            0
Component contracts                    40 / 40
ModuleManifest                         72 / 72
migration metadata                     359 / 359
```

### Browser

```text
production archival dist Chromium      PASS
source ESM Chromium                    PASS
source UMD-entry Chromium              PASS
high-risk authority Chromium           PASS
155 public subpath Chromium imports    PASS
Control tags direct-subpath behavior   PASS
Transfer pagination/table behavior     PASS
```

### Production immutability while Rollup is unavailable

The archival production baseline still passes:

```text
npm run build:frozen                   PASS
```

A strict real build currently exits with code 2 solely because neither official Rollup provider is installed in this sandbox. Before/after recursive `dist` hashes are identical, and neither `.release-stage` nor `.release-dist-backup` leaks after the provider-resolution failure.

The frozen baseline SHA-256 values remain:

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

### npm package pre-build state

`npm pack --dry-run` already includes `THIRD_PARTY_NOTICES.md` and the vendored source authority. Because the real Rollup/postbuild transaction has not executed, the current archival package naturally lacks the new ESM/preserveModules release tree. The final package verifier therefore remains closed until a real build generates every advertised file.

## What remains for 100%

No source migration task remains. The last gate is operational and intentionally strict:

```text
1. obtain either official Rollup provider pinned by package.json;
2. npm run build;
3. staging release-artifact verification must PASS;
4. atomic dist commit must complete;
5. npm test;
6. npm run verify:browser;
7. npm run verify:release;
8. npm run verify:package;
9. only then mark migration = 100%.
```

The package/runtime verifier will then test the actual packed-and-installed npm artifact, including root/subpath identity and the explicit single-file bundle.

Until that real Rollup execution occurs, the correct status remains **~99.5%, not 100%**.
