# QXFRAME9A7C2 ESM Migration — Overlay + PopupField Foundation Accelerated v21

## Overall completion

Estimated architecture completion: **~62%** using the 0→100 gates in the migration handbook, not file-count percentage.

- 58→64 OverlayComponent: **source-side 100% complete**.
- 64→70 PopupFieldComponent: **foundation complete, concrete members pending**.
- Production Rollup cutover remains blocked in this execution environment (`rollup: not found`, exit 127).

## v21 changes

### Overlay family

Added `src/components/overlay.js` as the canonical family base.

Source authorities now include:

- `Modal extends OverlayComponent`
- `Drawer extends OverlayComponent`

`OverlayComponent` owns the public lifecycle shell:

- `open`
- `close`
- `setOpen`
- common option setters
- public `getState`
- Component option transaction handoff
- destroy handoff

Modal/Drawer keep frame/view-specific controller logic while no longer redefining the public lifecycle methods on their classes.

`src/modules/modal.js` and `src/modules/drawer.js` no longer participate in the source cutover graph. They remain only for the frozen legacy production builder until Rollup cutover.

### PopupField foundation

Added `src/components/popup-field.js`:

```text
Component
  ↓
FieldComponent
  ↓
PopupFieldComponent
```

It composes `Trigger`; it does **not** inherit `PopupComponent`.

Canonical responsibilities now include:

- popup field open/close/toggle/setOpen/reposition
- reference/popup ownership
- focus handoff
- tab-exit target
- disabled/readOnly/busy activation gate through FieldComponent
- common Trigger option synchronization

Concrete members pending: Select, TreeSelect, Cascader, Autocomplete, then PickerComponent.

### OptionList preparation

`OptionList` is now a static ESM BuildingBlock owner composed from `ItemCollection`.
The old `src/modules/option-list.js` implementation is removed from the source dependency graph.

## Current source architecture

- Kernel ESM authorities: **79**
- Class source authorities: **18**
- BuildingBlock authorities: **10**
- Support authorities: **6**
- Reachable legacy implementations: **25**
- Public components: **40**
- ModuleManifest entries: **72**
- ESM graph: **126 files / 632 static edges / 0 cycles / 0 legacy imports**
- Cutover graph: **162 reachable source files / 695 static edges**
- Monolithic kernel imported by source entry: **no**
- legacy-entry imported by source entry: **no**

## Verification

PASS:

- core
- contracts
- platform
- 79 ESM capability parity
- kernel migration coverage
- import graph
- cutover waves
- Registry consumer guard
- support/building-block authority guard
- cutover rehearsal
- executable source cutover
- source ESM entry
- Component base
- FieldComponent family
- PopupComponent family
- OverlayComponent family
- PopupFieldComponent foundation
- component-class authority guard
- release verification
- frozen production Chromium smoke
- source ESM Chromium smoke

Source Chromium directly verified new Modal and Drawer class instances, OverlayComponent inheritance, open/close, content/title mutation and ComponentRegistry class identity.

## Frozen production artifacts

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

No production drift.

## Rollup gate

Actual execution remains:

```text
Built 72 modules; dependency graph verified.
sh: 1: rollup: not found
exit 127
```

Therefore production authority is intentionally not switched and the legacy kernel is not deleted.

## Next batch

64→70 concrete PopupField migration:

1. Autocomplete
2. Select
3. TreeSelect
4. Cascader

The shared dependencies are now ready as ESM owners: FieldComponent, PopupFieldComponent, Control, Trigger, Scroll, Item, ItemCollection, OptionList and FieldHost.
