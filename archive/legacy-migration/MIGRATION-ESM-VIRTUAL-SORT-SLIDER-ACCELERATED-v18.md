# QXFRAME9A7C2 ESM Migration Accelerated v18

## Overall architecture completion

**≈ 47%** of the migration manual's 0→100 architecture gates.

This is gate-weighted architecture completion, not file-count or LOC completion. The source-side architecture is further ahead than the percentage suggests, but the production Rollup cutover remains blocked because the current execution environment has no Rollup executable and cannot install it.

## v18 scope

v18 continues from Accelerated v17 and completes three real source-authority migrations:

1. `VirtualList` → `src/components/virtual-list.js`
   - `VirtualList extends Component`
   - canonical BuildingBlock authority
   - legacy `src/modules/virtual-list.js` no longer reachable from `src/index.js`

2. `Sort` → `src/components/sort.js`
   - `Sort extends Component`
   - canonical public Component authority
   - static ESM dependencies instead of Registry lookups
   - legacy `src/modules/sort.js` no longer reachable from source cutover graph

3. `Slider` → `src/components/slider.js`
   - `Slider extends FieldComponent`
   - common option transaction / destroy lifecycle remains owned by Component/FieldComponent
   - Slider-specific range, pointer, keyboard and projection behavior remains local
   - `StateController`, `PointerSession`, `FormBridge`, `Lifecycle` remain composition capabilities
   - legacy `src/modules/slider.js` no longer reachable from source cutover graph

## Source-authority delta

- reachable legacy implementations: **38 → 35**
- class source authorities: **10 → 12**
- BuildingBlock authorities: **7 → 8**
- support authorities: **4**
- kernel ESM capability authorities: **79**

Current class authorities:

- Carousel
- Collapse
- InputNumber
- InputOTP
- Loading
- Progress
- Rate
- Result
- Slider
- Sort
- Steps
- TagInput

## ESM graph

- ESM files: **113**
- static import/export edges: **490**
- cycles: **0**
- legacy imports: **0**

Executable source cutover:

- reachable source files: **159**
- static import edges: **555**
- reachable legacy implementations: **35**
- public components: **40**
- ModuleManifest entries: **72**
- BuildingBlocks: **14**
- monolithic kernel imported: **false**
- legacy entry imported: **false**

## Verification improvements

`verify:field-base` now explicitly guards `Slider extends FieldComponent` and verifies that Slider does not duplicate `destroy()` or `updateOptions()`.

`verify:component-classes` now reports the complete class-authority manifest instead of only the original frozen-dist parity sample set.

The source ESM Chromium verifier directly executes:

- VirtualList create / items update / BuildingBlock registry identity
- Sort move / moveUp / updateOptions / Component registry identity
- Slider single value / range value / setValue / ArrowRight keyboard interaction / disabled gate / Component registry identity

## Validation result

PASS:

- legacy build
- core verification
- component contracts
- platform verification
- 79 ESM kernel capability parity
- kernel coverage
- ESM graph
- cutover waves
- Registry consumer guard
- cutover rehearsal
- source cutover
- public ESM entry
- Component base
- FieldComponent base
- Component class guards
- release verification
- production Chromium smoke
- source ESM Chromium smoke

Release verification:

- JS/MJS syntax files: **244**
- JSON files: **22**
- modules: **72**

## Frozen production artifacts

Still byte-identical to HOTFIX6:

- `dist/qxframe9a7c2.js`: `13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d`
- `dist/qxframe9a7c2.css`: `5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92`
- `dist/qxframe9a7c2.d.ts`: `fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573`

`src/qxframe9a7c2.js` remains **14,471 lines** because production authority has not been cut over.

## Rollup gate

Still blocked by the execution environment:

```text
Built 72 modules; dependency graph verified.
sh: 1: rollup: not found
exit 127
```

No replacement bundler has been introduced and the production cutover has not been faked.

## Next highest-value batch

1. Establish the real `PopupComponent` family base.
2. Migrate Tooltip / Popover first, then Popconfirm.
3. Migrate Trigger or replace its remaining component-level role with `TriggerInteraction` where the public API contract permits.
4. Defer Dropdown until `ItemCollection` / Scroll dependencies are source-authority ready, or migrate those dependencies in the same batch.
