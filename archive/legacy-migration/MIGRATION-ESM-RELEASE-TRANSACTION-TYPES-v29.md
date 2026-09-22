# QXFRAME9A7C2 ESM migration — release transaction/types/metadata hardening v29

> Baseline: v28  
> Target phase: 97→99 production release cutover hardening / 99→100 final release gate  
> Status: source architecture complete; real Rollup artifact generation remains blocked only by the execution environment lacking an installed official Rollup provider.

## 1. This round's main result

v29 does not add another compatibility layer. It removes the last hidden dependencies that could make the first real ESM release unsafe or incomplete:

1. Production build is now transactional: `.release-stage/dist` → postbuild → release verification → atomic `dist` replacement.
2. A failed build cannot leave a half-updated production `dist`; rollback behavior is machine-tested.
3. Public TypeScript declarations are generated from the actual ESM export surface and `ComponentContracts`, including preserveModules subpaths.
4. `package.json` `exports.types` is verified with TypeScript NodeNext using real package-name imports.
5. API/module/migration release metadata is regenerated from canonical current source/manifests and no longer copied from an old `dist` or docs snapshot.
6. Postbuild can start from an empty target directory and generate all non-bundle release artifacts independently.
7. During metadata parity verification a real ESM migration omission was found and fixed: `Scroll` had lost its declarative initializer contract.

## 2. Scroll initializer contract repair

The frozen public component API required:

```json
{
  "mode": "create",
  "bind": "container"
}
```

for `Scroll`, while the ESM adapter had left `ComponentRuntime.describe('Scroll').initializer` as `null`.

This was not treated as a documentation mismatch. It affects declarative/get-or-create initialization, so `src/runtime/componentAdapters.js` now publishes the canonical `createInitializer` definition for `Scroll`.

After the repair, regenerated component API metadata matches the frozen public API snapshot 40/40.

## 3. Transactional release build

New/updated release infrastructure:

- `tools/rollup-provider.mjs`
- `tools/release-transaction.mjs`
- `tools/build-release.mjs`
- `tools/verify-release-transaction.mjs`
- `tools/fixtures/mock-rollup-provider.mjs`
- `tools/verify-release-build-rollback.mjs`

The production flow is now:

```text
load official Rollup provider
        ↓
create .release-stage/dist
        ↓
IIFE + ESM bundle + preserveModules into staging
        ↓
postbuild into staging
        ↓
verify staged release artifacts
        ↓
atomic dist replacement
```

If any step fails, the committed `dist` remains unchanged.

Verified:

```text
stagedOutputs       PASS
atomicCommit        PASS
rollbackRestore     PASS
backupLeak          0
failed build hash   unchanged
staging leak        0
```

## 4. Real ESM TypeScript release surface

The historical `dist/qxframe9a7c2.d.ts` described the old Components-style API but did not describe the new package ESM named exports. That would have caused runtime JavaScript imports to work while TypeScript imports such as:

```ts
import { DatePicker } from 'qxframe9a7c2';
```

failed or lacked correct types.

`tools/generate-types.mjs` now generates declarations from the actual ESM source export inventory plus `ComponentContracts`.

Current verified type surface:

```text
root named exports               195
component option interfaces       40
preserveModules declarations     155
TypeScript strict compile       PASS
package exports NodeNext        PASS
```

Verified package-style imports include:

```text
qxframe9a7c2
qxframe9a7c2/components/date-picker
qxframe9a7c2/core/component
qxframe9a7c2/utils/treeQuery
```

`package.json` wildcard and barrel exports now carry explicit `types` conditions.

## 5. Release metadata is source-derived

New:

- `tools/generate-release-metadata.mjs`
- `tools/verify-release-metadata.mjs`
- `tools/verify-postbuild-independence.mjs`

The following release files are now rebuilt from canonical source/manifests:

```text
dist/qxframe9a7c2-api.json
dist/qxframe9a7c2-module-manifest.json
dist/qxframe9a7c2-migration.json
```

Canonical inputs:

```text
ComponentRuntime
ComponentContracts
ModuleManifest
tools/manifests/esm-component-authority.json
tools/manifests/esm-support-authority.json
tools/manifests/compatibility.json
package.json
```

Parity against the historical/frozen public snapshots:

```text
Component API components        40/40 PASS
ModuleManifest records          72/72 PASS
Migration entries             359/359 PASS
old dist required                   NO
old docs snapshot required          NO (release postbuild)
```

`verify-release-metadata` may compare regenerated metadata to archival snapshots as a regression oracle, but production postbuild does not read those snapshots.

## 6. Empty-target postbuild proof

`verify-postbuild-independence.mjs` runs `runPostbuild()` into a brand-new empty target directory.

Verified from current source alone:

```text
CSS                         PASS
fonts                       PASS
root d.ts                    PASS
preserveModules d.ts         PASS
component API metadata       PASS
module metadata              PASS
migration metadata           PASS
existing dist input required NO
```

Therefore the next successful Rollup build no longer needs the existing frozen `dist` as an input source.

## 7. Current architecture/release verification

### `npm test`

PASS.

Key results:

```text
modern source files             164
static ESM edges               1214
external imports                  0
import cycles                     0
legacy imports                    0
legacy runtime markers            0
Components                       40
ModuleManifest                   72
reachable legacy implementations  0
compat runtime files              0
```

### Browser suite

All PASS:

```text
production archival dist Chromium   PASS
source ESM Chromium                 PASS
source UMD-entry Chromium           PASS
high-risk authority Chromium        PASS
```

### Frozen archival baseline

Still unchanged:

```text
dist/qxframe9a7c2.js
SHA-256 13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
SHA-256 5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
SHA-256 fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

The old d.ts remains only because committed `dist` is still the archival production baseline until a real Rollup release transaction succeeds. The new declaration generator is verified independently and runs inside release staging.

## 8. The one remaining blocking condition

The current sandbox cannot load either declared official Rollup provider:

```text
rollup@4.63.4
@rollup/wasm-node@4.63.4
```

Network/package access is restricted (`NETWORK=caas_packages_only`) and no provider is preinstalled/cached.

Therefore strict `npm run build` correctly exits with code 2. It does not fall back to a custom concatenator and does not mutate committed `dist`.

This is now the only step preventing a true final 100% release acceptance:

```text
install/load official Rollup provider
          ↓
npm run build
          ↓
real IIFE + ESM + preserveModules + maps generated
          ↓
staged verify PASS
          ↓
atomic dist commit
          ↓
npm run verify:browser
npm run verify:release
npm run verify:package
          ↓
100%
```

## 9. Current completion assessment

Architecture/source migration itself is complete. Registry/module cleanup and final cleanroom checks are complete. Release engineering, type generation, metadata generation, staging/rollback and package type resolution are complete.

Conservative overall completion: **~99%**.

The remaining percentage is reserved for executing the real official Rollup build and accepting the generated production artifacts. No substitute bundler or fake bundle is counted as completion.
