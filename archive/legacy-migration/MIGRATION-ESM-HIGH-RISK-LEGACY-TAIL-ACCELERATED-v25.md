# QXFRAME9A7C2 ESM Migration — High-Risk + Legacy Tail Accelerated v25

> Baseline: `QXFRAME9A7C2-v2.19.81-HOTFIX6-ESM-MIGRATION-ACCELERATED-v24`  
> Result: v25  
> Date: 2026-09-22  
> Scope: finish the 88→92 high-risk migration, remove the final reachable legacy module implementations from the executable ESM source graph, and establish the 92→95 Registry-removal readiness boundary.

## 1. Executive status

This batch completes the behavioral ESM authority migration for every remaining legacy runtime module implementation.

- Conservative overall architecture progress: **~90%**.
- 88→92 high-risk stage: **complete**.
- Reachable legacy `src/modules/*.js` implementations in executable ESM source graph: **9 → 0**.
- Frozen module ownership coverage: **72 / 72**.
- Modern source (`src/components`, `src/core`, `src/utils`) Registry/defineModule/global-QX markers: **0**.
- Registry-removal authority prerequisites: **ready**.
- Production Registry/compat removal: **not yet safe**, because the working environment has no Rollup executable and `PositionAdapter` still uses the migration-time `global.FloatingUIDOM` fallback supplied by `src/compat/legacyFloatingUI.js`.

This distinction is intentional: source authority migration is complete, but production cutover is not falsely reported as complete.

## 2. New ESM authorities

### Public/support authorities

The following final legacy public implementations were replaced with canonical ESM source owners:

- `src/components/image.js` → `Image`
- `src/components/json.js` → `JSONComponent` / public `JSON`
- `src/components/pagination.js` → `Pagination`
- `src/components/upload.js` → `Upload`
- `src/components/table.js` → `Table`
- `src/components/tags.js` → `Tags`
- `src/components/message.js` → `Message`
- `src/components/notification.js` → `Notification`

Static dependency chains now include:

```text
Upload → Image
Table → Pagination → Select
Message → NoticeService
Notification → NoticeService
```

### Building-block authority

- `src/core/noticeService.js` → `NoticeService`

`NoticeService` is now a canonical ESM building-block owner rather than a reachable legacy module implementation.

## 3. Legacy-tail removal from the source graph

`src/compat/legacyModules.js` no longer imports any `src/modules/*.js` implementation.

The frozen set of 72 module names is still retained temporarily so the compatibility shell can reproduce `ModuleManifest` and global runtime metadata while production remains frozen. The implementation ownership is now:

```text
26 class component authorities
19 support authorities
14 building-block authorities
13 manifest-only/CSS-only modules
--------------------------------
72 / 72 frozen module names covered
```

The 13 manifest-only modules have no JS behavior to migrate; they only retain static compatibility metadata until 92→95.

## 4. Registry-removal readiness boundary

Added:

```text
tools/verify-registry-removal-readiness.mjs
npm run verify:registry-readiness
```

Current result:

```json
{
  "modernLegacyMarkers": 0,
  "moduleCoverage": "72/72",
  "reachableLegacyModuleImplementations": 0,
  "reachableCompatFiles": 11,
  "compatFiles": 11,
  "compatLegacyMarkers": 47,
  "rollupExecutable": false,
  "registryRemovalAuthorityReady": true,
  "productionCutoverReady": false
}
```

The important architecture boundary is now explicit:

```text
src/components + src/core + src/utils
    Registry lookup / defineModule / global QX dependency = 0

src/compat
    remaining migration-only Registry/Module bridge = isolated
```

No compatibility file is treated as a canonical business or capability owner.

## 5. High-risk authority verification

Added:

```text
tools/verify-high-risk-authorities.mjs
tools/verify-legacy-tail-browser.mjs
```

The authority guard covers:

```text
Image
JSON
Pagination
Tags
Upload
Table
Message
Notification
NoticeService
```

Result:

```json
{
  "authorityCount": 9,
  "reachableLegacyModuleImplementations": 0
}
```

The real Chromium source test verifies all nine ESM owners, not only parsing/importability.

During this test Chromium found one extraction defect that static syntax checks could not catch: the ESM `Upload` extraction had lost its local `Utils.own` binding. The canonical binding was restored, then the entire source/browser regression was rerun successfully.

## 6. Canonical barrels

The canonical barrels were completed for the newly authoritative source layout:

- `src/components/index.js` now also exports `List`, `Menu`, `Tabs`, and `Transfer` in addition to the new high-risk/tail authorities.
- `src/core/index.js` now exports `NoticeService`.
- `src/utils/index.js` already exposes `TimeUnit`, `WheelMetrics`, and `TreeQuery` from v24.

This keeps the physical ESM ownership graph independent of legacy Registry discovery.

## 7. ESM graph status

Latest static ESM graph:

```text
files         = 155
static edges  = 1034
cycles        = 0
legacyImports = 0
```

Executable cutover closure:

```text
reachable source files = 166
static import edges     = 1088
reachable legacy module implementations = 0
monolithic kernel imported = false
legacy-entry imported      = false
compat files                = 11
```

## 8. Verification status

### Full Node/build suite

```text
npm test = PASS
```

This includes the new high-risk authority and Registry-readiness guards.

### Browser verification

```text
production browser smoke = PASS
source ESM Chromium       = PASS
legacy-tail ESM Chromium  = PASS
```

The source ESM browser suite still verifies the previously migrated Field, Popup, Overlay, PopupField, Picker, hierarchy, collection and interaction behavior.

### Frozen production artifacts

Rebuilding with the existing production builder preserves the frozen v24 artifacts exactly:

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

Therefore this batch changes source architecture without silently changing the frozen production contract.

## 9. Why 92→95 is not declared complete yet

The source-side prerequisites are now satisfied, but physical Registry/compat deletion must happen together with the real production bundler cutover.

Two blockers remain in this environment:

1. `package.json` declares `rollup ^4.63.4`, but `node_modules/.bin/rollup` is absent. Network package lookup also timed out in this environment, so the dependency cannot be installed here safely.
2. `src/core/position.js` still uses the migration-time `global.FloatingUIDOM` fallback; source browser tests currently receive that provider from `src/compat/legacyFloatingUI.js`. The final cutover must replace this with the real ESM `@floating-ui/dom` dependency before deleting that compatibility file.

Until those are resolved, deleting these physical compatibility/build inputs would break either source popup positioning or the current frozen production build:

```text
src/compat/*
src/modules/*
src/qxframe9a7c2.js
src/legacy-entry.mjs
```

They are now isolated legacy production/compat inputs, not ESM behavior authorities.

## 10. Next stage

The next safe sequence is:

```text
1. make Rollup executable from the declared dependency
2. replace PositionAdapter global FloatingUIDOM fallback with @floating-ui/dom ESM import
3. build src/index.umd.js as the production UMD bundle
4. compare API/contracts/browser behavior against the frozen dist
5. switch npm build away from tools/build.mjs legacy concatenation
6. delete src/compat/* Registry bridges
7. delete src/modules/* and src/qxframe9a7c2.js
8. delete legacy-entry.mjs / old loader paths
9. rewrite remaining architecture verifiers around import ownership only
```

Only after that sequence passes should 92→95 be marked complete.
