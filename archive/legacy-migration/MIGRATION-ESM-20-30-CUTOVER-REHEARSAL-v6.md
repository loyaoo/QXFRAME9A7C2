# ESM 20→30 Cutover Rehearsal · v6

> Baseline: HOTFIX6 + PRE-CUTOVER v5. This remains a rehearsal branch; production `dist` still comes from the legacy kernel build until Rollup is executable.

## What changed

1. Added `tools/verify-esm-cutover-rehearsal.mjs`.
   - Loads only the legacy Registry/runtime shells, deferred `PerformanceDiagnostics`, current Floating UI UMD provider, component/building-block loader shells and focus-modality compatibility bootstrap.
   - Does **not** execute the 68 legacy kernel sections already represented by ESM candidates.
   - Imports all 79 candidate owner modules and registers those exact objects into the temporary legacy registries using the frozen dependency metadata.
   - Loads and bootstraps all 72 existing `src/modules/*.js` modules against the ESM-owned capabilities.
   - Asserts ESM object identity for all 79 registered capabilities.
   - Compares Core, Headless, DOMHeadless, ComponentRegistry, BuildingBlockRegistry and ModuleManifest snapshots with the frozen legacy `dist` runtime.

2. Split the `Utils` implementation out of the barrel.
   - `src/utils/utils.js` is now the canonical owner of `Utils` and its helper exports.
   - `src/utils/index.js` is a re-export-only barrel.
   - Core candidates import the exact utility owner they require instead of importing the barrel.
   - This removes accidental eager loading of unrelated utility modules through `Utils`.

3. Added `tools/manifests/esm-cutover-waves.json` and `tools/verify-esm-cutover-waves.mjs`.
   - All 79 candidate capabilities are assigned to a wave derived from their real static ESM dependency depth.
   - Any import from an earlier wave to a later wave fails verification.
   - Candidate capability lookup counts and consumer files are frozen as upper bounds and may only decrease.

## Current cutover waves

| Wave | Meaning | Capabilities | Legacy candidate lookups |
|---|---|---:|---:|
| 1 | root-capabilities | 15 | 169 |
| 2 | first-order-foundation | 11 | 161 |
| 3 | direct-runtime | 31 | 154 |
| 4 | composed-runtime | 15 | 40 |
| 5 | orchestration | 7 | 23 |

Total candidate Registry lookup sites remaining in legacy modules: **547**.

The remaining **75** Registry lookups are module/component-owned dependencies such as `Control`, `Item`, `Trigger`, `Scroll`, `NoticeService`, etc. They are deliberately excluded from kernel cutover waves and belong to later component/module migration phases.

## Rehearsal result

The rehearsal proves the following before touching production authority:

- ESM capability authority: **79 / 79**
- Legacy candidate kernel sections skipped: **68 / 68**
- Existing legacy modules bootstrapped: **72 / 72**
- Public components: **40**
- Building blocks: **14**
- CoreRegistry metadata parity: PASS
- HeadlessRegistry metadata parity: PASS
- DOMHeadlessRegistry metadata parity: PASS
- ComponentRegistry contract parity: PASS
- BuildingBlockRegistry parity: PASS
- ModuleManifest parity: PASS

This means the 79 ESM candidates are already capable of serving the existing module layer through a compatibility Registry bridge. It does **not** yet change the production build. The remaining production cutover gate is still a real Rollup build/parity pass.

## Final verification

- `npm run build`: PASS
- `npm run verify` reached the final `verify:release` subprocess with all preceding stages PASS; the outer sandbox command timed out while `verify:release` was running.
- `npm run verify:release` separately: PASS
- `npm run verify:browser`: PASS
- ESM import graph: **83 files / 256 edges / 0 cycles / 0 legacy imports**
- Release syntax verification: **195 JS/MJS files / 22 JSON files**
- Runtime modules: **72**
- Public component contracts: **40**
- Rollup execution remains environment-blocked: `rollup: not found` (exit 127)

### Production artifact hashes

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

All three hashes are identical to PRE-CUTOVER v5.

## Cutover status after v6

The architecture has moved from “candidate parity only” to a stronger state:

```text
79 ESM owners
  ↓ real ESM dependency graph
79 capabilities installed as rehearsal runtime authority
  ↓ temporary legacy Registry bridge
72 existing modules bootstrap unchanged
  ↓
40 public components + 14 building blocks match frozen legacy runtime
```

Production authority is still intentionally unchanged. When Rollup becomes executable, the next production step is no longer speculative: use this exact rehearsal mapping to replace the 68 candidate kernel sections, run bundle parity/browser smoke, and only then remove the corresponding legacy implementations.
