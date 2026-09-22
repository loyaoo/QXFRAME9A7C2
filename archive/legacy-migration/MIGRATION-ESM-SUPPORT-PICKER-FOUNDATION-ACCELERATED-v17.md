# QXFRAME9A7C2 ESM Migration — Accelerated v17

## Status

- Baseline: HOTFIX6 frozen production behavior.
- Overall architecture completion: **~45%** (conservative, weighted by the 0→100 migration gates; not line-count completion).
- Production `dist` authority: still legacy build, pending real Rollup execution.
- Source ESM authority: active through `src/index.js -> cutover-entry.js`.
- Reachable legacy source implementations: **47 → 38** in this batch.

## What changed in v17

### Canonical ESM support/building-block owners

The following legacy IIFE/Registry modules no longer participate in the source cutover graph:

1. `component-contracts` → `src/core/componentContracts.js`
2. `empty-projection` → `src/core/emptyProjection.js`
3. `switch` loading activation guard → `src/core/switchLoadingGuard.js`
4. `text-field` → `src/components/text-field.js`
5. `notice-clock` → `src/core/noticeClock.js`
6. `ripple` → `src/components/ripple.js`
7. `calendar` → `src/components/calendar.js`
8. `period-panel` → `src/components/period-panel.js`
9. `color-panel` → `src/components/color-panel.js`

`Ripple` is intentionally kept as a behavior/enhancer owner rather than being forced into `Component` inheritance. `TextField` remains an enhancer/BuildingBlock owner for the same reason.

### Picker-family foundation

`Calendar`, `PeriodPanel`, and `ColorPanel` now use direct ESM imports for their canonical capabilities instead of runtime Registry lookups. This prepares the later PickerComponent migration without introducing a second owner for date/time/color algorithms.

### Temporary adapters

A new temporary compatibility adapter `src/compat/supportModules.js` publishes canonical ESM support owners into the existing temporary Registry/defineModule runtime while legacy consumers still exist. It is inventoried in `esm-cutover-compat.json` and must be deleted by phase 92→95.

### New migration guard

`tools/verify-esm-support-authorities.mjs` enforces that canonical support/building-block owners contain none of:

- `Registry.get/define/assert`
- `defineModule()`
- `globalThis.QXFRAME9A7C2` / `window.QXFRAME9A7C2`
- legacy IIFE module wrappers

Current guarded authorities: **11**.

## Browser validation

The source-ESM Chromium verifier now executes and validates:

- `TextField`
- `EmptyProjection`
- `NoticeClock`
- `Ripple` canonical behavior metadata
- Switch loading activation guard
- `Calendar`
- `PeriodPanel`
- `ColorPanel`
- existing `InputOTP`, `InputNumber`, `Rate`, `TagInput`, `Control`

Production-dist Chromium smoke also remains fully green.

## Current graph

- ESM canonical graph: **110 files / 457 static edges / 0 cycles / 0 legacy imports**.
- Executable source cutover: **159 reachable source files / 523 edges**.
- Public components: **40**.
- ModuleManifest entries: **72**.
- BuildingBlocks: **14**.
- Kernel capability authorities: **79**.
- Class component authorities: **10**.
- Canonical BuildingBlock authorities: **7**.
- Canonical support authorities: **4**.
- Reachable legacy implementations: **38**.

## Production freeze

Legacy build remains byte-identical to HOTFIX6:

- JS SHA-256: `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- CSS SHA-256: `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`
- d.ts SHA-256: `fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573`
- `src/qxframe9a7c2.js`: **14,471 lines**, intentionally untouched.

Release verification: **241 JS/MJS, 22 JSON, 72 modules — PASS**.

## Why Slider was not force-migrated in this batch

Slider is a 698-line field implementation combining range/editable-handle semantics, pointer sessions, keyboard sessions, form bridging, projection rebuilding, controlled/uncontrolled value state and per-handle policy. It remains the largest simple-field holdout. It should be migrated as a true `Slider extends FieldComponent`, not by wrapping its old factory in a class or copying the old lifecycle into a new class merely to increase the migration count.

## Next accelerated batch

1. Migrate `Slider extends FieldComponent` with frozen-dist + source-browser parity.
2. Finish remaining Field-family decisions (`Tags` versus FieldComponent/behavior boundaries).
3. Establish real `PopupComponent` and migrate Tooltip/Popover/Popconfirm/Dropdown as one family wave.
4. Continue reducing the 38 reachable legacy implementations.
5. As soon as Rollup is executable, perform production bundle parity and remove the legacy kernel sections that already lost source authority.
