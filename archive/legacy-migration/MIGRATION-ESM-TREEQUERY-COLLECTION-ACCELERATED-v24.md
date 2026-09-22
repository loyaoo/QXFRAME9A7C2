# QXFRAME9A7C2 ESM Migration — v24

> Baseline: `QXFRAME9A7C2-v2.19.81-HOTFIX6-ESM-MIGRATION-ACCELERATED-v23`  
> Output: `QXFRAME9A7C2-v2.19.81-HOTFIX6-ESM-MIGRATION-ACCELERATED-v24`  
> Scope: 76→80 Time/Wheel canonical utilities + 80→84 TreeQuery/ItemAccessors + 84→88 collection/data authorities  
> Conservative overall completion: **~86%** (v23 ~74% + three completed 4-point migration gates)

## 1. Result summary

This batch completes the source-side architecture work for the manual's 76→80, 80→84 and 84→88 stages while keeping production dist frozen.

- reachable legacy source implementations: **13 → 9**
- class component authorities: **26** (unchanged)
- building-block authorities: **12 → 13**
- support authorities: **8 → 11**
- static ESM graph: **142 files / 866 edges / 0 cycles / 0 legacy imports**
- source cutover graph: **166 reachable files / 982 static edges**
- collection/data 84→88 authority guard: **10/10 PASS**
- TimeUnit / WheelMetrics / TreeQuery uniqueness guard: **PASS**
- full `npm test`: **PASS**
- production Chromium smoke: **PASS**
- source ESM Chromium: **PASS**
- frozen dist JS/CSS/d.ts hashes: **unchanged**
- Rollup executable: **unavailable**, so production authority is intentionally unchanged.

## 2. 76→80 — Time/Wheel canonical owners

Added:

- `src/utils/timeUnit.js`
- `src/utils/wheelMetrics.js`

`TimeUnit` is now the canonical pure owner for time parsing/normalization/formatting and related conversions used by picker/panel source code.

`WheelMetrics` is now the canonical pure owner for wheel size normalization, item height, viewport height and center offset. The duplicated `xs/sm/md/lg/xl → itemHeight` maps have been removed from the migrated wheel consumers.

Migrated consumers:

- `src/components/time-picker.js`
- `src/components/time-panel.js`
- `src/components/wheel-picker.js`
- `src/components/wheel-panel.js`

## 3. 80→84 — TreeQuery + ItemAccessors

Added:

- `src/utils/treeQuery.js`

Canonical TreeQuery now owns hierarchy traversal/query primitives including:

- `visit`
- `find`
- `findByKey`
- `findByValue`
- `findPath`
- `findPathByKeys`
- `filterPaths`
- `location`
- `index`

Tree item semantics remain in `ItemAccessors`; TreeQuery consumes those accessors instead of inventing component-specific child/key/value semantics.

Migrated TreeQuery consumers:

1. Select
2. Cascader
3. Dropdown
4. OptionList
5. TreeSelect
6. Menu
7. Transfer

Local recursive DFS/walk/find-path implementations in these source authorities have been removed/replaced with the shared owner.

## 4. 84→88 — collection/data source authorities

The manual's 84→88 set is now covered by canonical ESM source authorities:

- Menu
- Tree
- Transfer
- List
- ItemCollection
- OptionList
- VirtualList
- Tabs
- Calendar
- PeriodPanel

This batch newly cut over:

- `src/components/menu.js`
- `src/components/transfer.js`
- `src/components/list.js`
- `src/components/tabs.js`

Existing ESM authorities from earlier batches cover the other six members.

No `CollectionComponent` super-class was introduced because the migration manual explicitly requires evidence of a real shared instance lifecycle before creating one. These components continue to compose existing collection/model/capability owners.

### Transfer temporary dependency bridge

Transfer still consumes legacy Pagination/Table through a temporary compatibility injection in `src/compat/supportModules.js` because Pagination/Table have not yet been migrated. The canonical `src/components/transfer.js` itself does not perform Registry/global lookups. This bridge is expected to disappear when those consumers move to static ESM imports.

## 5. Authority/cutover changes

New/updated source-side adapters and manifests:

- `src/compat/buildingBlockModules.js`
  - List authority
- `src/compat/supportModules.js`
  - Menu authority
  - Transfer authority
  - Tabs authority
- `src/compat/legacyModules.js`
  - removed direct legacy imports for Menu / Transfer / List / Tabs
- `tools/manifests/esm-building-block-authority.json`
  - added List
- `tools/manifests/esm-support-authority.json`
  - added Menu / Transfer / Tabs
- `src/index.js`
  - Menu / Transfer / Tabs now export canonical ESM authorities instead of `Components.*` aliases

## 6. New architecture guards

### `tools/verify-shared-utility-authorities.mjs`

Protects:

- TimeUnit uniqueness
- WheelMetrics uniqueness
- TreeQuery functional behavior
- all 7 hierarchy-query consumers importing TreeQuery
- no reintroduction of known duplicated time/wheel helpers or local hierarchy DFS

### `tools/verify-collection-family.mjs`

Protects all 10 members of the 84→88 collection/data stage:

- authority manifest entry must exist
- source must be canonical ESM
- no Registry lookup
- no `defineModule()`
- no global QXFRAME dependency
- no IIFE module wrapper
- old `src/modules/<name>.js` must not remain imported in the reachable source graph

`package.json` main verify chain now runs both guards.

## 7. Browser/source verification added

`tools/verify-source-esm-browser.mjs` now exercises real source ESM behavior for:

- Menu hierarchy query/selection
- Transfer indexing/value movement
- List creation/update options
- Tabs active-key switching

This is in addition to the existing Picker/PopupField/Overlay/Field/source-authority browser coverage.

## 8. Remaining reachable legacy source implementations

Exactly 9 remain:

```text
image
json
message
notice-service
notification
pagination
table
tags
upload
```

This is down from 13 at v23.

## 9. Verification evidence

### Full test

```text
npm test = PASS
```

Includes build, all core/contracts/platform/ESM architecture guards, family guards, utility guard, collection guard, class parity and release verification.

### Browser

```text
npm run verify:browser = PASS
```

Both:

- frozen production browser smoke
- real source ESM Chromium

passed.

### Static ESM graph

```text
files:         142
edges:         866
cycles:        0
legacyImports: 0
```

### Source cutover graph

```text
candidateAuthority:                79
reachableLegacyModuleImplementations: 9
reachableSourceFiles:              166
staticImportEdges:                 982
publicComponents:                  40
buildingBlocks:                    14
```

## 10. Frozen dist verification

Rebuilt production artifacts retain the same hashes as v23:

```text
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d  dist/qxframe9a7c2.js
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92  dist/qxframe9a7c2.css
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573  dist/qxframe9a7c2.d.ts
```

Therefore this batch changes source architecture only; it does not change the frozen production contract/artifacts.

## 11. Rollup status

`node_modules/.bin/rollup` is still unavailable in this execution environment.

Therefore:

- source-side ESM cutover continues normally;
- production `dist` remains on the verified frozen legacy build path;
- no claim is made that production Rollup cutover has completed.

## 12. Next batch

Proceed into 88→92 and the remaining legacy tail.

The original 88→92 group is Upload / Scroll / Carousel / Image / JSON / Table. Scroll and Carousel are already ESM authorities, so the actual high-risk legacy work remaining there is:

```text
Upload
Image
JSON
Table
```

After that, clear the remaining non-high-risk legacy tail:

```text
Pagination
Tags
Message
NoticeService
Notification
```

Then enter 92→95 runtime Module/Registry removal only after their consumers have static ESM owners.
