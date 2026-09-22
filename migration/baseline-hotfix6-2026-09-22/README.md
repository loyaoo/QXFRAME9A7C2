# ESM migration baseline — HOTFIX6 — 2026-09-22

This directory freezes the source/runtime baseline before the `src -> ESM + Component/Family Base` migration begins.

## Source baseline

- Package: `QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX6-2026-09-22`
- `src` JavaScript files: 73
- `src` JavaScript lines: 50,931
- `src/qxframe9a7c2.js` lines: 14,471
- Runtime module count after build: 72
- Public component contract count: 40

The migration handbook was written against HOTFIX5. HOTFIX6 is therefore the authoritative code baseline for this migration; no HOTFIX6 change may be reverted merely to match the handbook's older line counts.

## Frozen verification state

The following commands passed before any migration structure was introduced:

```text
npm test
npm run verify:browser
```

The raw logs are stored as `npm-test.log` and `verify-browser.log`.

## Frozen artifacts

- `src-sha256.txt`: hash of every source file.
- `src-js-inventory.tsv`: JS path, line count, byte count and SHA-256.
- `dist-sha256.txt`: hashes for the generated runtime/CSS/API/type artifacts.
- `qxframe9a7c2-api.json`: public API snapshot.
- `qxframe9a7c2-module-manifest.json`: runtime module manifest snapshot.
- `qxframe9a7c2.d.ts`: generated declaration snapshot.
- `package.json`: package/build-script snapshot before Rollup integration.

## Migration rule

This baseline is immutable evidence. It is not a source directory and must never be used as an alternate runtime implementation.
