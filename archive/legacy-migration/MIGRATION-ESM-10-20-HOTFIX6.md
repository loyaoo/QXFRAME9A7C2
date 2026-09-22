# QXFRAME9A7C2 ESM Migration — 10→20 execution record

Baseline authority: `QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX6-2026-09-22`.

> Important: the 5→10 Rollup **execution gate is still pending** because this execution environment cannot install the Rollup package. No later phase is allowed to make the legacy string-concat builder responsible for transforming real ESM component/core source. Therefore 20→30 kernel extraction remains blocked until `build:rollup + verify:rollup` can be executed successfully with the declared Rollup dependency.

## 10→15 — Node tooling ESM migration

Status: **implementation complete and locally verified**.

Changes:

- `tools/build.js` → `tools/build.mjs`
- `tools/verify-core.js` → `tools/verify-core.mjs`
- `tools/verify-platform.js` → `tools/verify-platform.mjs`
- `tools/verify-release.js` → `tools/verify-release.mjs`
- `tools/verify-component-contracts.js` → `tools/verify-component-contracts.mjs`
- `tools/verify-browser-smoke.js` → `tools/verify-browser-smoke.mjs`
- `tools/verify-rollup-parity.js` → `tools/verify-rollup-parity.mjs`
- Added `tools/verify-esm-entry.mjs` for the next entry phase.
- CommonJS `require()` imports were replaced by native `node:*` ESM imports.
- `package.json` scripts now invoke `.mjs` tools.
- `package.json` now declares `"type": "module"` after the Node tools were proven stable.
- `verify-release` now parses both legacy `.js` and new `.mjs`/ESM files, so verification coverage does not shrink during migration.
- `verify-release` guards against reintroducing `tools/*.js` CommonJS-era entry files or package scripts that reference them.

Behavior/parity result:

- Existing 98 frozen `src` baseline files: **0 changed, 0 missing**.
- `dist/qxframe9a7c2.js` SHA-256: unchanged.
- `dist/qxframe9a7c2.css` SHA-256: unchanged.
- generated `dist/qxframe9a7c2.d.ts`: byte-identical to HOTFIX6 baseline.
- generated API and module manifests: unchanged.

## 15→20 — ESM/UMD source entry protocol

Status: **bridge implementation complete and locally verified**.

Added:

- `src/index.js`
- `src/index.umd.js`
- `src/initializer.js`
- `tools/verify-esm-entry.mjs`

Current bridge behavior:

1. `src/index.js` imports the temporary `legacy-entry.mjs` and exposes the current 40 public component APIs as **real static ESM named exports**.
2. It also exports `QXFRAME9A7C2`, `Components`, and the default runtime object during the compatibility window.
3. `src/index.umd.js` routes through `initializer.js` and resolves to the same runtime object as the ESM entry.
4. `initializer.js` safely reuses an already initialized read-only legacy global instead of overwriting it.
5. `TEMP-ESM-BRIDGE` is explicitly marked. It must be removed after concrete components/core capabilities become direct ESM imports/exports.
6. No component implementation, DOM, CSS, keyboard behavior, defaults, contract or current production `dist` JavaScript was changed.

Verification:

```text
npm test                    PASS
npm run verify:esm-entry    PASS
npm run verify:browser      PASS
```

Current ESM entry check:

```json
{"ok":true,"esmNamedComponents":40,"umdGlobal":true,"legacyBridge":true}
```

## Why 20→30 is not started in this checkpoint

The next phase deletes sections from the 14k-line kernel and turns them into real ESM files. Once that begins, production JS must be assembled by the real bundler. Using the old `tools/build.mjs` concat path to transform or strip ESM would recreate the exact custom-bundler architecture this migration is intended to remove.

Therefore the required next gate is:

```text
npm install
npm run build:rollup
npm run verify:rollup
```

After that passes, switch production JS ownership to Rollup and begin 20→30 with the low-risk kernel capabilities in the handbook order.
