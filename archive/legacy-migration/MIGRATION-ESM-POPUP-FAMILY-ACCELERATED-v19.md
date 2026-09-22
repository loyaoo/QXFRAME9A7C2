# QXFRAME9A7C2 ESM Migration — Popup Family Accelerated v19

## Overall architecture completion

**≈52%** by the migration handbook's 0→100 architecture gates.

This is intentionally conservative. Source-side migration is ahead of 52%, but production Rollup cutover, Floating UI 30→35, Dropdown, Overlay, PopupField, Picker, remaining collection/data components, high-risk components and final Registry deletion are not counted as complete.

## v18 → v19 primary result

Stage **50→58 PopupComponent** is now roughly **75% complete**.

Completed source authorities:

- `Trigger` — canonical ESM behavior owner
- `PopupComponent` — Family Base and sole public open/close/toggle/setOpen/reposition shell
- `Tooltip extends PopupComponent`
- `Popover extends PopupComponent`
- `Popconfirm extends PopupComponent`

Deferred in this family:

- `Dropdown` — blocked on `ItemCollection` + `Scroll` source-authority migration; no Registry dependency was reintroduced merely to force Dropdown into a class.

## Trigger cutover

`src/components/trigger.js` is extracted from the frozen Trigger runtime with behavior preserved.

Changed only:

- Registry dependency lookup → static ESM imports
- `ComponentRuntime.validateOptions()` → canonical `ComponentContracts` validation
- browser global access → `globalThis`

The Trigger state machine itself remains structurally equivalent.

The legacy `src/modules/trigger.js` no longer belongs to the source cutover dependency closure.

## PopupComponent family base

`src/components/popup.js` now owns:

- Trigger/controller runtime adoption
- `open()`
- `close()`
- `toggle()`
- `setOpen()`
- `reposition()`
- Trigger/controller ownership
- reference/popup identity
- Component resource cleanup integration

Concrete Popup members are statically guarded from redefining those public lifecycle methods.

The base also supports a controller adapter so singleton/grouped Tooltip can preserve its physical shared-overlay behavior without duplicating the public popup lifecycle.

## Popover

`Popover extends PopupComponent` now owns only Popover-specific differences:

- title/content/action projection
- arrow/size view projection
- Popup-specific option → Trigger patching
- Popover callback payloads

Common open/close/toggle/setOpen/reposition and destroy/options transaction remain owned by `PopupComponent` / `Component`.

Frozen legacy behavior of `Popover.getReferenceElement()` returning `undefined` is intentionally preserved during structural migration rather than silently fixed.

## Popconfirm

`Popconfirm extends PopupComponent` preserves:

- real inner `Popover` class exposure through `getPopover()`
- `AsyncAction`
- confirm/cancel semantics
- pending-close veto
- restore-focus rules
- title/content/icon/actions rendering

Root ownership was explicitly separated:

- inner Popover owns the popup panel
- Popconfirm owns its internal body root

This prevents two Component instances from claiming the same InstanceRegistry root.

## Tooltip

`Tooltip extends PopupComponent` preserves both modes:

- independent Tooltip → canonical Trigger
- grouped/singleton Tooltip → shared LayerManager visual Trigger + PopupComponent controller adapter

Browser source-ESM verification covers:

- independent open/close/content update
- grouped singleton open
- switching active singleton member
- shared physical popup panel identity
- ComponentRegistry class instance creation

## Source-authority delta

- reachable legacy implementations: **35 → 31**
- class source authorities: **12 → 15**
- support authorities: **4 → 5** (`Trigger` added)
- BuildingBlock authorities: **8**
- kernel ESM capability authorities: **79**

Current Popup-family class authorities:

- Tooltip
- Popover
- Popconfirm

## ESM graph

- ESM files: **118**
- static import/export edges: **533**
- cycles: **0**
- legacy imports: **0**

Executable source cutover:

- reachable source files: **160**
- static import edges: **598**
- reachable legacy implementations: **31**
- public components: **40**
- ModuleManifest entries: **72**
- monolithic kernel imported: **false**
- legacy entry imported: **false**

## Verification added

New `verify:popup-family` enforces:

- Trigger/Popup canonical sources contain no Registry lookup / defineModule / QX global runtime dependency
- Tooltip / Popover / Popconfirm really extend PopupComponent
- public popup lifecycle methods live in PopupComponent only
- concrete popup classes do not duplicate `destroy()` or `updateOptions()`
- compatibility adapters exist while legacy consumers remain

`verify:popup-family` is included in the main `npm run verify` chain.

The source ESM Chromium verifier now directly exercises:

- Trigger manual open/close
- Popover class + PopupComponent inheritance + content update
- Popconfirm class + inner Popover + cancel-close
- Tooltip independent mode
- Tooltip grouped/singleton switching and shared panel

## Validation result

PASS:

- core
- contracts
- platform
- 79 ESM kernel capability parity
- migration coverage
- ESM graph
- cutover waves
- Registry consumer guard
- ESM support authorities
- cutover rehearsal
- executable source cutover
- ESM public entry
- Component base
- FieldComponent base
- PopupComponent family
- component class guard
- release verification
- production Chromium smoke
- source ESM Chromium smoke

Release verification:

- JS/MJS syntax files: **250**
- JSON files: **22**
- runtime modules: **72**

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

No replacement bundler has been introduced and production authority has not been faked.

## Next highest-value batch

1. Migrate `ItemCollection` canonical owner.
2. Migrate `Scroll extends Component`.
3. Complete `Dropdown extends PopupComponent` using only static ESM dependencies.
4. Then begin `OverlayComponent` with Modal + Drawer.
