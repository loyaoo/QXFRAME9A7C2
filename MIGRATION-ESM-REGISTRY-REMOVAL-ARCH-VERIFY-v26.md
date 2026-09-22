# QXFRAME9A7C2 ESM Migration v26 — Registry Removal + Architecture Verify

## Status

- Baseline: `QXFRAME9A7C2-v2.19.81-HOTFIX6-ESM-MIGRATION-ACCELERATED-v25`
- Current stage: **92→95 completed; 95→97 completed**
- Conservative overall migration progress: **~96%**
- Production release stage 97→99: **not yet complete** because a local Rollup executable is unavailable in this environment.

## 1. 92→95: old Module / Registry runtime physically removed from `src`

The modern source tree no longer contains:

```text
src/modules/
src/compat/
src/qxframe9a7c2.js
src/cutover-entry.js
src/legacy-entry.mjs
src/manifests/
```

`src/manifests/*.json` build/verification metadata was moved to `tools/manifests/`.
Historical legacy runtime copies were **not kept inside v26**; v25 remains the previous migration reference.

Final modern source roots are now:

```text
src/
├─ index.js
├─ index.umd.js
├─ initializer.js
├─ components/
├─ core/
├─ runtime/
├─ utils/
├─ vendor/
├─ css/
├─ fonts/
└─ qxframe9a7c2.css
```

## 2. Static runtime replaces Registry dependency lookup

`src/index.js` now imports the static runtime directly. Runtime namespace assembly is owned by `src/runtime/runtime.js`.

The modern runtime exposes:

```text
Core
Headless
DOMHeadless
BuildingBlocks
Components
ModuleManifest
ComponentRuntime
ComponentInitializer
```

It no longer exposes or uses dependency-locator runtime keys:

```text
CoreRegistry
HeadlessRegistry
DOMHeadlessRegistry
ComponentRegistry
BuildingBlockRegistry
defineModule
load
use
```

`ModuleManifest` remains only as **static compatibility metadata**; it is not a module loader.

### Public inventory parity

- Static `Components`: **40/40** matches frozen production component inventory.
- Static `ModuleManifest`: **72/72** matches frozen production manifest metadata.
- Reachable legacy module implementations: **0**.
- Compat runtime files in `src`: **0**.

## 3. Side-effect-free ESM entry

`src/index.js` is now side-effect-free with respect to the public global namespace:

```text
import src/index.js
→ does NOT create globalThis.QXFRAME9A7C2
```

Traditional global publication is isolated to:

```text
src/index.umd.js
src/initializer.js
```

`verify-source-entry.mjs` confirms that the UMD source entry creates the global runtime while still exposing **zero legacy Registry/loader keys**.

## 4. Floating UI source boundary

`PositionAdapter` no longer reads `global.FloatingUIDOM`.

The current offline environment has no installable `@floating-ui/dom`, so v26 uses `src/vendor/floating-ui.js` as the explicit vendor authority. Its embedded UMD global branch is isolated inside a **module-local object**, so importing the source does not mutate or leak:

```text
globalThis.FloatingUICore
globalThis.FloatingUIDOM
```

For the final 97→99 release cutover, the preferred end state remains replacing this vendored payload with the declared package-level ESM dependency when dependency installation is available.

## 5. 95→97: architecture verification rewritten around ESM

Active verification no longer scans `src/modules` or requires Registry parity.

New/updated active checks include:

- `verify-modern-architecture.mjs`
  - old runtime paths must be absent;
  - Registry / `defineModule` / QX global lookups forbidden in modern source;
  - source `index.js` import must be global-side-effect free;
  - static runtime must contain 40 Components and 72 ModuleManifest records.
- `verify-esm-import-graph.mjs`
  - scans the complete modern JS source tree directly;
  - no old coverage manifest dependency;
  - no missing internal imports;
  - no cycles;
  - no legacy imports.
- `verify-source-entry.mjs`
  - 40/40 component inventory parity against frozen production;
  - 72/72 ModuleManifest parity;
  - verifies `src/index.umd.js` global publication;
  - verifies no Registry/loader keys return.
- `verify-component-contracts.mjs`
  - validates generated API metadata against canonical `ComponentContracts` directly.
- `verify-platform.mjs`
  - validates modern `ObserverHub`, `DOMTemplate`, AbortController and inert fallbacks directly.
- Popup / Overlay / PopupField / Picker / Collection / High-risk family guards now use canonical ESM authorities rather than old Registry adapters.

Obsolete migration-only tools that required the deleted kernel/modules/cutover runtime were removed from the active project.

## 6. Final static graph

```text
modern JS source files : 164
static import edges     : 1214
external imports        : 0   (Floating UI is currently vendored offline)
cycles                  : 0
legacy imports          : 0
```

Modern `src` scan:

```text
CoreRegistry marker          = 0
HeadlessRegistry marker      = 0
DOMHeadlessRegistry marker   = 0
ComponentRegistry marker     = 0
BuildingBlockRegistry marker = 0
defineModule marker          = 0
TEMP-ESM-BRIDGE marker       = 0
globalThis.QXFRAME9A7C2      = 0
window.QXFRAME9A7C2          = 0
```

## 7. Test / browser acceptance

### `npm test`

**PASS**

Includes:

- modern architecture
- ESM graph
- source entry parity
- Component base
- Field family
- Popup family
- Overlay family
- PopupField family
- Picker family
- TimeUnit / WheelMetrics / TreeQuery authorities
- collection family
- high-risk authorities
- registry-removal closure
- ComponentContracts
- platform boundaries

### Browser acceptance

**PASS**

- Frozen production Chromium smoke: PASS
- Modern source ESM Chromium: PASS
- High-risk ESM Chromium: PASS

The source Chromium suite still passes PopupField, Overlay, Picker, Tree/Menu/Transfer/List/Tabs and keyboard/focus interaction coverage after Registry removal.

## 8. Frozen production dist remains byte-stable

Rollup cannot currently be installed or found in:

- project `node_modules`
- system executable paths
- system Node package locations
- npm local cache

Network package retrieval is unavailable in the current environment.

Therefore `npm run build` uses `tools/build-modern.mjs`:

1. if local Rollup exists: run the final `rollup.config.mjs`;
2. otherwise: **do not recreate production JS from legacy source**;
3. validate pinned hashes of the frozen production artifacts.

Current hashes remain unchanged from v25:

```text
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d  dist/qxframe9a7c2.js
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92  dist/qxframe9a7c2.css
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573  dist/qxframe9a7c2.d.ts
```

This is intentional. The frozen production browser artifact still contains the old compatibility Registry implementation; **that does not exist in modern source anymore**.

## 9. Final Rollup configuration is prepared

`rollup.config.mjs` now targets the final architecture rather than `legacy-entry`/`cutover-entry`:

```text
src/index.umd.js → dist/qxframe9a7c2.js        (IIFE browser bundle)
src/index.js     → dist/qxframe9a7c2.esm.js    (ESM bundle)
src/index.js     → dist/esm/**                 (preserveModules)
```

No final bundle was fabricated without Rollup.

## 10. Remaining 97→100 work

### 97→99 — production release cutover

Required once Rollup/package installation is available:

1. install/use Rollup 4.x;
2. preferably replace the offline Floating UI vendor payload with `@floating-ui/dom` ESM;
3. run final Rollup build;
4. produce and execute UMD + ESM + preserveModules acceptance;
5. compare public API, defaults, events, contracts and d.ts against the frozen baseline;
6. only then replace the frozen `dist/qxframe9a7c2.js`.

### 99→100 — final release cleanup

After successful production build:

- add the final package ESM `module`/exports fields only when their files actually exist;
- remove the frozen-production hash fallback if no longer needed;
- perform final full-tree legacy/IIFE/Registry scan;
- execute final `npm run build`, `npm test`, and all browser suites against generated production output.

## 11. Completion assessment

The **source architecture migration itself is now effectively through 95→97**:

```text
legacy runtime implementations in src = 0
Registry dependency resolution in src = 0
defineModule in src                  = 0
static ESM runtime                   = active
architecture verification            = ESM-native
source browser runtime               = PASS
```

Overall progress is conservatively recorded as **~96%**, not 100%, because generated production dist has not yet been replaced by the final Rollup output.
