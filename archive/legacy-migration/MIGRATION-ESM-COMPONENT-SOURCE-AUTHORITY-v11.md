# QXFRAME9A7C2 ESM Component Source Authority v11

## Scope

This stage converts the already verified `Result extends Component` and `Progress extends Component` implementations from side-by-side candidates into the actual **source-side component authorities** used by `src/index.js` / `src/cutover-entry.js`.

Production `dist` remains on the frozen legacy builder because Rollup is still unavailable in the execution environment. This stage therefore does **not** claim production authority cutover.

## Changes

1. `src/compat/legacyModules.js` no longer imports:
   - `src/modules/result.js`
   - `src/modules/progress.js`
2. `src/compat/classComponentModules.js` supplies temporary `defineModule` manifests/adapters for Result and Progress so the remaining legacy modules can continue to resolve the same module names and ComponentRegistry dependencies.
3. `src/index.js` exports the real ESM classes directly:
   - `Result` from `src/components/result.js`
   - `Progress` from `src/components/progress.js`
4. `tools/manifests/esm-component-authority.json` records every component whose source authority has moved to a class implementation.
5. `verify-esm-cutover-source` now requires migrated legacy implementation files to be unreachable from the source cutover graph.
6. `verify-esm-entry` understands the transition rule:
   - migrated components are constructor exports extending `Component`;
   - unmigrated components retain runtime namespace identity.
7. `verify-component-class-candidates` now compares the ESM classes against the **frozen production dist loaded in an isolated VM**, not against the source cutover runtime. This prevents a false-positive where a migrated class is compared with itself after authority cutover.

## Verified authority state

```text
source public components             40
class source authorities              2
legacy implementation files reachable 70
ModuleManifest entries                72
ESM kernel capability authorities     79
```

`Result` and `Progress` are now used by the source cutover runtime through ComponentRegistry compatibility adapters, and instances created through `QXFRAME9A7C2.Components.Result.create()` / `.Progress.create()` are verified to be instances of the corresponding ESM classes.

## Frozen legacy reference

Class parity uses `dist/qxframe9a7c2.js` in an isolated Node VM. This keeps the reference implementation independent of the source cutover graph.

Verified for both classes:

- contract parity
- API/state parity
- DOM parity
- option transaction parity
- callback parity
- lifecycle/destroy parity

## Regression status

All structural/runtime verification passes, including browser smoke. Production artifacts remain byte-identical to HOTFIX6:

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

Legacy monolithic kernel remains 14,471 lines and is unchanged.

## Remaining hard gate

`npm run build:rollup` still ends with:

```text
sh: 1: rollup: not found
exit=127
```

Therefore production `dist` authority is intentionally not switched yet.

## Next migration rule

Further concrete component migrations should follow the same sequence:

```text
legacy implementation
  -> real Component/Family class
  -> frozen-dist parity
  -> add to esm-component-authority manifest
  -> remove legacy implementation from source cutover graph
  -> keep temporary module/registry adapter only while legacy consumers remain
```

Do not increase compatibility-layer responsibilities beyond module/registry adaptation. Family lifecycle logic belongs in the future Family Base classes, not in `src/compat`.
