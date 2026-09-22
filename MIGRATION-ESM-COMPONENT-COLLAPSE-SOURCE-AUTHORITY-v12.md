# QXFRAME9A7C2 ESM / Component migration v12

## Scope

This round migrates `Collapse` from a legacy `defineModule()` factory implementation to a real ESM class:

```text
Component
  ↓
Collapse
```

The migration is structural only. Public DOM, options, callback behavior, keyboard/disclosure behavior, transitions and production `dist` remain frozen.

## New canonical implementation

- `src/components/collapse.js`
- `export class Collapse extends Component`
- Static `options`, `optionNormalizers`, `immutableOptions`, and `contract`
- Static imports for `DOM`, `Disclosure`, `ActiveItem`, `KeyboardNavigation`, `RovingProjection`, `Renderer`, and `Transition`
- No Registry lookup
- No `defineModule()`
- No global QX namespace dependency
- No concrete `destroy()` implementation
- No concrete `updateOptions()` implementation
- Component-specific resources are registered through `Component.own()`

## Frozen-dist parity

The class verifier compares the new ESM class against an isolated VM loaded from the frozen `dist/qxframe9a7c2.js`.

Verified:

- contract schema / legacy-option parity
- initial state
- initial DOM
- `toggle()`
- `setValue()`
- `setItems()`
- `updateOptions()`
- callback sequence
- immutable `container`
- failed option transaction rollback
- unknown-option rejection
- destroy cleanup and idempotency

Result: PASS.

## Source authority cutover

`Collapse` is now a source-side class authority.

- `src/index.js` exports `Collapse` from `src/components/collapse.js`
- `src/compat/classComponentModules.js` registers the class through the temporary ComponentRegistry adapter
- `src/compat/legacyModules.js` no longer imports `src/modules/collapse.js`
- `tools/manifests/esm-component-authority.json` now contains Collapse / Progress / Result

The legacy `src/modules/collapse.js` file remains only because the frozen production build still uses the legacy builder until Rollup can execute.

## Source graph result

```text
class authorities                   3
  Collapse
  Progress
  Result

reachable legacy implementations   69
public components                   40
ModuleManifest entries              72
ESM capability authorities          79
monolithic kernel imported           0
legacy-entry imported                0
```

ESM candidate graph:

```text
files   91
edges   295
cycles  0
legacy imports 0
```

Executable cutover graph:

```text
reachable source files 168
static import edges     377
```

## Validation

Passed:

- verify:core
- verify:contracts
- verify:platform
- verify:esm-core
- verify:esm-coverage
- verify:esm-graph
- verify:esm-waves
- verify:esm-consumers
- verify:esm-cutover
- verify:esm-cutover-source
- verify:esm-entry
- verify:component-base
- verify:component-classes
- verify:release
- verify:browser

Release validation:

```text
JS/MJS syntax files 216
JSON files           22
runtime modules      72
```

Production hashes remain frozen:

```text
dist/qxframe9a7c2.js
13dc56032a6562003827220dd83c0ce9fd6307f9efb046052138b1829251372d

dist/qxframe9a7c2.css
5042e59366a6424516f4d2d17af8b61da4e24f5521224c7cbc4adedfb74eca92

dist/qxframe9a7c2.d.ts
fea48995b11ceea218af66e7c290dfe6bcd938f1f53b729ebb222f75f23dc573
```

## Rollup gate

Still blocked by the execution environment:

```text
sh: 1: rollup: not found
exit 127
```

Therefore production authority is intentionally unchanged. No legacy kernel section or legacy component source required by the legacy builder has been deleted.
