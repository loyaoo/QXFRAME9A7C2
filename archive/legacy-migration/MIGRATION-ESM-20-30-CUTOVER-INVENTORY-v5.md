# ESM 20→30 Cutover Inventory · v5

> Generated from the v4 PRE-CUTOVER source tree. This is a migration control artifact, not a new runtime authority.

## Kernel coverage

- Kernel sections: **77 / 77 classified**
- Candidate sections: **68**
- Candidate files: **79**
- Deferred PerformanceDiagnostics: **1**
- Floating UI sections reserved for 30→35: **2**
- Loader/registry shells to delete at cutover: **5**
- Focus modality bootstrap to merge into initializer: **1**

## Legacy Registry consumer baseline

The verifier treats these values as upper bounds. Counts may decrease as consumers migrate; they may not increase.

| Registry | Lookups | Unique capabilities |
|---|---:|---:|
| `CoreRegistry` | 219 | 11 |
| `HeadlessRegistry` | 167 | 32 |
| `DOMHeadlessRegistry` | 163 | 27 |
| `ComponentRegistry` | 25 | 7 |
| `BuildingBlockRegistry` | 48 | 12 |

**Total runtime lookup sites: 622 across 57 module files.**

### Largest capability lookup groups

| Capability | Registry | Lookups | Consumer files |
|---|---|---:|---:|
| `InteractionPolicy` | `HeadlessRegistry` | 53 | 26 |
| `Utils` | `CoreRegistry` | 53 | 49 |
| `DOM` | `CoreRegistry` | 48 | 48 |
| `Lifecycle` | `CoreRegistry` | 34 | 34 |
| `Events` | `CoreRegistry` | 29 | 29 |
| `Renderer` | `DOMHeadlessRegistry` | 28 | 28 |
| `Scheduler` | `CoreRegistry` | 20 | 20 |
| `Control` | `BuildingBlockRegistry` | 18 | 18 |
| `OptionTransaction` | `HeadlessRegistry` | 16 | 16 |
| `DOMTemplate` | `DOMHeadlessRegistry` | 16 | 16 |
| `DOMBinding` | `DOMHeadlessRegistry` | 16 | 16 |
| `KeyboardNavigation` | `DOMHeadlessRegistry` | 13 | 13 |
| `OpenStateBridge` | `HeadlessRegistry` | 12 | 12 |
| `Item` | `BuildingBlockRegistry` | 11 | 11 |
| `IdManager` | `CoreRegistry` | 10 | 10 |
| `Config` | `CoreRegistry` | 10 | 10 |
| `Trigger` | `ComponentRegistry` | 10 | 10 |
| `StateController` | `HeadlessRegistry` | 9 | 9 |
| `Scroll` | `ComponentRegistry` | 9 | 9 |
| `Transition` | `DOMHeadlessRegistry` | 8 | 8 |
| `PointerSession` | `DOMHeadlessRegistry` | 7 | 7 |
| `ObserverHub` | `DOMHeadlessRegistry` | 7 | 7 |
| `EventDelegation` | `DOMHeadlessRegistry` | 7 | 7 |
| `ValueEquality` | `HeadlessRegistry` | 6 | 6 |
| `Selection` | `HeadlessRegistry` | 6 | 6 |

### Highest-density legacy module consumers

| Module | Registry lookups |
|---|---:|
| `src/modules/cascader.js` | 25 |
| `src/modules/tree.js` | 23 |
| `src/modules/tree-select.js` | 22 |
| `src/modules/item-collection.js` | 22 |
| `src/modules/autocomplete.js` | 22 |
| `src/modules/select.js` | 21 |
| `src/modules/table.js` | 20 |
| `src/modules/color-picker.js` | 20 |
| `src/modules/tags.js` | 19 |
| `src/modules/menu.js` | 19 |
| `src/modules/date-picker.js` | 19 |
| `src/modules/control.js` | 18 |
| `src/modules/tabs.js` | 16 |
| `src/modules/modal.js` | 15 |
| `src/modules/drawer.js` | 15 |
| `src/modules/time-picker.js` | 14 |
| `src/modules/dropdown.js` | 14 |
| `src/modules/transfer.js` | 13 |
| `src/modules/pagination.js` | 13 |
| `src/modules/wheel-panel.js` | 12 |
| `src/modules/sort.js` | 12 |
| `src/modules/scroll.js` | 12 |
| `src/modules/picker-field-base.js` | 12 |
| `src/modules/notice-service.js` | 12 |
| `src/modules/calendar.js` | 12 |

## Important boundary found by inventory

- `DOMHeadlessRegistry.EmptyProjection` is still owned by `src/modules/empty-projection.js`; it is not a kernel section and therefore is intentionally outside the 79 kernel candidate files.
- `NoticeService` / `NoticeClock` and several BuildingBlock owners are likewise module-owned capabilities. They belong to later module/component migration batches rather than being silently counted as kernel coverage.
- `ComponentRegistry` lookups remain public-component dependencies and must disappear only as concrete components become real ESM exports/classes.

## Cutover rule

Do not delete a legacy kernel/Registry owner until the relevant consumer inventory reaches zero or every remaining consumer is explicitly covered by the temporary compatibility bridge. New Registry consumers are forbidden.
