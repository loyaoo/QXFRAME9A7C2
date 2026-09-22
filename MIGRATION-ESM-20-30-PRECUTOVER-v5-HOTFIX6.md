# QXFRAME9A7C2 ESM Migration · 20→30 PRE-CUTOVER v5

Baseline: `QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX6-2026-09-22`

Runtime authority remains `legacy-registry`. This revision strengthens the cutover control plane; it does not delete legacy kernel sections and does not claim Rollup cutover completion.

## What changed in v5

### 1. Kernel section coverage is now machine-verifiable

Added:

- `tools/manifests/esm-kernel-coverage.json`
- `tools/verify-esm-migration-coverage.mjs`
- `npm run verify:esm-coverage`

The verifier parses the real `src/qxframe9a7c2.js` kernel section markers and requires every section to have exactly one migration classification.

Current classification:

- kernel sections: **77 / 77 classified**
- candidate sections: **68**
- candidate files: **79**
- loader/Registry shells scheduled for deletion: **5**
- `PerformanceDiagnostics`: **1 deferred runtime-provider section**
- Floating UI UMD sections reserved for 30→35: **2**
- focus-modality compatibility bootstrap scheduled to merge into initializer: **1**

A candidate target must exist, be directly covered by `verify-esm-core-parity.mjs`, and may not contain Registry lookup/definition, `defineModule()`, or global QX namespace dependency.

### 2. Legacy Registry consumer inventory is frozen as a decreasing upper bound

Added:

- `tools/manifests/legacy-registry-consumers.json`
- `tools/verify-esm-consumers.mjs`
- `npm run verify:esm-consumers`
- `MIGRATION-ESM-20-30-CUTOVER-INVENTORY-v5.md`

Current `src/modules/*.js` inventory:

| Registry | Lookups | Unique capabilities |
|---|---:|---:|
| CoreRegistry | 219 | 11 |
| HeadlessRegistry | 167 | 32 |
| DOMHeadlessRegistry | 163 | 27 |
| ComponentRegistry | 25 | 7 |
| BuildingBlockRegistry | 48 | 12 |

Total: **622 lookup sites across 57 module files**.

The verifier allows these counts to decrease during migration but rejects:

- a new Registry capability lookup;
- a new file becoming a Registry consumer;
- an existing capability lookup count increasing;
- dynamic/non-literal `Registry.get(...)` dependency lookup.

This turns the later cutover requirement “consumer inventory must be complete” into an executable guard rather than a manual checklist.

### 3. Candidate ESM import graph is verified before Rollup cutover

Added:

- `tools/verify-esm-import-graph.mjs`
- `npm run verify:esm-graph`

Current graph:

- files: **82** (79 candidate targets + barrels/initializer/imported helpers)
- relative import/export edges: **254**
- cycles: **0**
- imports from `src/modules`: **0**
- imports from `src/qxframe9a7c2.js`: **0**
- imports from `src/legacy-entry.mjs`: **0**

Every graph file is also rejected if it contains Registry identifiers, `defineModule()`, or direct `globalThis/window.QXFRAME9A7C2` dependency.

### 4. InteractionModality no longer performs hidden import-time bootstrap

`src/core/interactionModality.js` previously executed `setup(global.document)` merely by being imported. That is unsuitable for the final ESM source graph because importing a horizontal capability should not silently install document listeners.

v5 changes the candidate only:

- removes import-time `setup(global.document)`;
- exports `bootstrapInteractionModality(doc)` as an explicit module-level bootstrap helper;
- adds `initializeInteractionModality(target)` to `src/initializer.js`;
- keeps current production bootstrap on the legacy `qxframe9a7c2-focus-modality` section until authority cutover.

Therefore current browser behavior is unchanged while the future ESM bootstrap boundary is explicit.

## Important inventory boundary

The 79 candidate files cover kernel-owned capabilities, not every capability currently reachable through a Registry.

The new consumer inventory confirms module-owned capabilities that must be migrated in later batches, including:

- `DOMHeadlessRegistry.EmptyProjection` → currently `src/modules/empty-projection.js`
- `BuildingBlockRegistry.NoticeService` / `NoticeClock`
- public `ComponentRegistry` dependencies such as Trigger, Scroll, Popover, Select and Tags
- BuildingBlock owners such as Control, Item, ItemCollection, OptionList, TimePanel, Tree, Calendar, PeriodPanel and VirtualList

These are deliberately not misreported as missing kernel candidate sections.

## Verification

Passed individually in the current execution environment:

- `npm run build` → PASS, 72 legacy runtime modules
- `node tools/verify-esm-core-parity.mjs` → PASS, 79 candidates
- `node tools/verify-esm-migration-coverage.mjs` → PASS, 77/77 sections classified
- `node tools/verify-esm-import-graph.mjs` → PASS, 0 cycles / 0 legacy imports
- `node tools/verify-esm-consumers.mjs` → PASS, 622 baseline lookup sites
- `node tools/verify-esm-entry.mjs` → PASS, 40 named components and UMD/ESM identity bridge
- `node tools/verify-release.mjs` → PASS, 192 JS/MJS syntax files, 22 JSON files, 72 modules
- `node tools/verify-browser-smoke.mjs` → PASS

Frozen release hashes remain:

- `dist/qxframe9a7c2.js` → `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- `dist/qxframe9a7c2.css` → `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`

`src/qxframe9a7c2.js` remains **14,471 lines** because authority cutover has not occurred.

## Rollup blocker remains external to the source changes

`npm run build:rollup` currently performs the legacy build successfully and then exits:

```text
sh: 1: rollup: not found
exit=127
```

No substitute bundler is introduced. Until a real Rollup binary can execute the configured build and pass runtime/browser parity, v5 intentionally leaves:

- `runtimeAuthority = legacy-registry`
- legacy kernel sections intact
- `TEMP-ESM-BRIDGE` intact

## Next step

When Rollup becomes executable, the next operation is not more candidate copying. It is controlled cutover:

1. build the real Rollup UMD + ESM outputs;
2. verify output parity/browser smoke;
3. migrate consumer batches from the frozen 622 Registry lookups to static imports;
4. after each batch, verify the lookup inventory only decreases;
5. delete the corresponding legacy kernel section only when its consumer inventory reaches zero;
6. then enter 30→35 to replace embedded Floating UI UMD/global fallback with `@floating-ui/dom`.
