# QXFRAME9A7C2 ESM Component Migration — Loading Source Authority v14

## Scope

This iteration continues the staged source-side Component/class migration without changing the frozen production `dist` authority.

### Completed in v14

- Added `src/components/loading.js` as a real `Loading extends Component` implementation.
- `Loading` imports canonical ESM runtime owners directly: `Scheduler`, `DOMProjection`, `OverlayRuntime`, `PopupSurface`, `Transition`, `MotionPresets`, `Renderer`, `Utils`.
- `Loading` imports and composes the canonical `Progress` class directly from `./progress.js`.
- Added `componentHooks.beforeOptionsUpdate` so component-specific pre-transaction invariants can be enforced without overriding the public `Component.updateOptions()` shell.
- Loading preserves the frozen target/fullscreen rule: supplying the current value is accepted; changing either requires destroy/recreate.
- Loading does not duplicate public `destroy()` or `updateOptions()`.
- Frozen-dist parity now covers Loading initial state/DOM, open/close, `setText`, `setProgress`, general `updateOptions`, callback ordering, failed transactions and destroy idempotency.
- Promoted Loading from class candidate to source-side authority.
- Removed `src/modules/loading.js` from the executable source cutover dependency graph while retaining it for the frozen legacy production builder.
- Added Loading to the temporary class module compatibility bridge and ESM component authority manifest.
- `src/index.js` now directly exports the `Loading` class.

## Source authority delta

```text
v13 class source authorities    4
v14 class source authorities    5

v13 reachable legacy impls     68
v14 reachable legacy impls     67
```

Current source class authorities:

```text
Carousel
Collapse
Loading
Progress
Result
```

## Composition proof

`Loading` is the first migrated ordinary component in this series that directly consumes another migrated class authority:

```text
Loading extends Component
    has-a
Progress extends Component
```

The class parity verifier asserts that `Loading.getProgress()` returns an actual `Progress` instance both directly and through the temporary `ComponentRegistry` compatibility adapter.

## Verification

```text
verify:core                    PASS
verify:contracts               PASS
verify:platform                PASS
verify:esm-core                PASS
verify:esm-coverage            PASS
verify:esm-graph               PASS
verify:esm-waves               PASS
verify:esm-consumers           PASS
verify:esm-cutover             PASS
verify:esm-cutover-source      PASS
verify:esm-entry               PASS
verify:component-base          PASS
verify:component-classes       PASS
verify:release                 PASS
verify:browser                 PASS
```

Current graph facts:

```text
ESM graph files                93
ESM graph static edges        320
ESM cycles                      0
ESM legacy imports              0

cutover reachable files       168
cutover static import edges   402
reachable legacy impls         67
public components              40
ModuleManifest                 72
kernel capability authority    79
```

Release verification:

```text
JS/MJS syntax files           218
JSON files                     22
runtime modules                72
```

## Frozen production output

Production output remains byte-identical to the HOTFIX6 baseline:

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

`src/qxframe9a7c2.js` remains 14,471 lines and is still retained only for the legacy production build path.

## Remaining production cutover gate

`npm run build:rollup` still reaches the legacy build successfully and then fails only because Rollup is unavailable in the execution environment:

```text
Built 72 modules; dependency graph verified.
sh: 1: rollup: not found
exit 127
```

Therefore v14 continues to change source-side authority only. It does not claim the production Rollup cutover is complete.
