# QXFRAME9A7C2 ESM Migration 20→30 PRE-CUTOVER v4

Baseline: `QXFRAME9A7C2-v2.19.81-fix11-FINAL-HOTFIX6-2026-09-22`

## Status

- Runtime authority: `legacy-registry`
- ESM candidate authority: ready for Rollup cutover, but **not active in production runtime**
- Rollup cutover: blocked in the current execution environment because the declared Rollup binary is unavailable (`rollup: not found`)
- Legacy kernel: unchanged, `src/qxframe9a7c2.js = 14,471 lines`
- Public component behavior/API/DOM/CSS: unchanged in this stage

This is deliberately a PRE-CUTOVER package. It does not claim the 20→30 authority switch is complete.

## Candidate coverage

`tools/verify-esm-core-parity.mjs` now verifies **79 canonical ESM candidates** against the frozen legacy Registry implementations.

### Core / utility / model capabilities

Utils, IdManager, URLPolicy, ValueEquality, DateUnit, SemanticStyles, Events, Scheduler, InteractionDetails, Lifecycle, DOMProjection, Config, DOM, Selection, ValueDraft, StateController, TreeModel, PaginationModel, TableModel, Collection, InteractionPolicy, TransformModel, AsyncTask, AsyncTaskGroup, AsyncAction, ActiveItem, UploadLifecycle, TextInputBehavior, TokenInput, SegmentedInput, NumericInput, Disclosure.

### DOM / interaction runtime capabilities

InteractionModality, ObserverHub, PressInteraction, PointerSession, EventDelegation, FormBridge, FocusManager, ScrollLock, PopupSurface, TriggerInteraction, LogicalOwnership, ScrollVisibility, Renderer, DOMBinding, FieldHost, ResponsiveOverflow, DOMTemplate, LayerManager, DismissableLayer, InteractionIsolation, FocusScope, FocusTrap, Virtualizer, KeyboardNavigation, RovingProjection, TagNavigation, KeyboardRegion, ReorderInteraction.

### Family capabilities split out of the old aggregate section

The old `family-capabilities` kernel section was **not** copied as another aggregate module. It is split into independent canonical owners:

- ItemAccessors
- ItemSchema
- SearchState
- SelectionTags
- HierarchicalSelection
- PickerSession
- OpenStateBridge
- TemporalGrid
- OptionTransaction
- ClearAction
- OverlayFramePolicy
- NoticePreset

### Motion / positioning / overlay runtime

- MotionCore
- MotionPresets
- Transition
- TransitionGroup
- PositionAdapter
- OverlayRuntime
- OverlayFrameShell

`PositionAdapter` intentionally preserves the current `settings.floating || global.FloatingUIDOM` resolution during this PRE-CUTOVER stage so its behavior remains equal to HOTFIX6. Replacing the embedded/global Floating UI path with a real `@floating-ui/dom` ESM dependency belongs to the documented 30→35 stage.

## Verification rules now enforced

Every ESM candidate is scanned to reject:

- `CoreRegistry.get/define`
- `HeadlessRegistry.get/define`
- `DOMHeadlessRegistry.get/define`
- `defineModule()`
- `globalThis.QXFRAME9A7C2`

The verifier also checks that `src/core/index.js` / `src/utils/index.js` re-export the exact canonical object identity and runs direct behavioral parity checks against the legacy implementation.

The v4 additions include behavioral coverage for Motion, PositionAdapter, OverlayRuntime, OverlayFrameShell and the expanded DOM/focus/navigation/family capabilities; this is not export-name-only verification.

## Kernel sections deliberately not copied into ESM candidates

### `performance`

`PerformanceDiagnostics` currently discovers statistics dynamically through Core/Headless/DOMHeadless Registries and reads the legacy `ComponentRuntime`. Copying that implementation now would embed Registry dependency in the new ESM architecture. It remains deferred until the new Component/runtime authority exists, then its providers can be expressed through static imports/runtime injection without preserving Registry lookup.

### Floating UI UMD payload

`floating-ui.core.umd.min` and `floating-ui.dom.umd.min` remain in the frozen legacy kernel for behavior parity. They are a 30→35 migration concern.

### Registry / loader / compatibility shells

These are not canonical business capabilities and should be removed rather than recreated as ESM modules:

- core namespace/registry bootstrap
- headless registry shell
- dom-headless registry shell
- components registry shell
- building-blocks registry shell
- focus-modality compatibility bootstrap

They remain only because production authority has not cut over from the legacy runtime.

## Validation results

### ESM direct parity

`node tools/verify-esm-core-parity.mjs` → PASS

- candidates: 79
- runtimeAuthority: `legacy-registry`
- esmAuthorityReady: `true`
- rollupCutoverPending: `true`

### Build

`npm run build` → PASS

- legacy runtime modules: 72

### Full verify

`npm run verify` → PASS

- public component contracts: 40
- source contract drift: 0
- demo contract drift: 0
- ESM named component entry: 40
- release JS syntax files: 189
- release modules: 72

### Browser smoke

`npm run verify:browser` → PASS

Includes the current Select / Cascader / TreeSelect / DatePicker / Tags / InputNumber / Rate / Slider / Table / overlay/focus regression suite.

### Frozen release hashes

- `dist/qxframe9a7c2.js`: `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- `dist/qxframe9a7c2.css`: `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`

Both remain identical to the HOTFIX6 frozen baseline.

## Current environment blocker

`npm run build:rollup` currently ends with:

```text
sh: 1: rollup: not found
exit=127
```

Therefore this package does **not** delete the old kernel sections and does not switch production authority. Doing so before a real Rollup bundle passes runtime/browser parity would violate the migration manual.

## Next cutover sequence

Once Rollup is executable:

1. Run the real Rollup bundle from the ESM graph.
2. Run ESM/UMD runtime parity and browser smoke against the Rollup output.
3. Switch the migrated capability consumers from Registry resolution to static imports in controlled batches.
4. Delete each corresponding legacy kernel section only after its consumer inventory reaches zero.
5. Keep `PerformanceDiagnostics` deferred until Component/runtime ownership can replace its Registry-based dynamic discovery.
6. Enter 30→35 and replace the embedded Floating UI UMD/global fallback with `@floating-ui/dom` imports.

