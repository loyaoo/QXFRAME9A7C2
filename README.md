# QXFRAME9A7C2 — ESM source architecture

## Directory contract

```text
src/
  index.js              # side-effect-free ESM public entry
  index.umd.js          # traditional browser bundle entry
  initializer.js        # the only global namespace initialization boundary
  runtime/              # static runtime namespace + component adapters
  core/                 # canonical cross-component capabilities
  components/           # component/family implementations
  utils/                # pure shared algorithms
  vendor/               # vendored third-party runtime authority used offline
  qxframe9a7c2.css      # canonical full stylesheet
  fonts/*

tools/manifests/        # build/verification metadata; not browser runtime source
dist/                   # generated release artifacts
```

`src` is the only implementation source of truth. Runtime dependency resolution is expressed by static `import`/`export`; there is no `src/modules`, monolithic JS kernel, `defineModule`, or Registry-based dependency locator. `ModuleManifest` is static compatibility metadata only.

## Source mode

```html
<script type="module">
  import QXFRAME9A7C2, { initializeRuntime } from './src/index.js';
  initializeRuntime();
  const select = QXFRAME9A7C2.Components.Select.create({ /* ... */ });
</script>
```

Importing `src/index.js` itself does not write `globalThis.QXFRAME9A7C2`. Traditional global initialization is isolated to `src/index.umd.js` + `src/initializer.js`.

## Full dist mode

```html
<link rel="stylesheet" href="dist/qxframe9a7c2.css">
<script src="dist/qxframe9a7c2.js"></script>
```

The production `dist` is generated from the ESM source graph by Rollup. `npm run build` is strict: it prefers the standard `rollup` package and may fall back to the official version-matched `@rollup/wasm-node` package when native Rollup cannot be loaded. The build is transactional: all three Rollup formats are written to `.release-stage/dist`, CSS/fonts, ESM declarations and release metadata are generated there from canonical source, the staged artifacts pass the release verifier, and only then is `dist` atomically replaced. A failed build leaves the previously committed `dist` byte-for-byte untouched. If neither declared Rollup provider is available, the build fails instead of silently accepting an older frozen bundle. The historical frozen hashes remain available only through `npm run build:frozen` as an archival comparison command.

If the final filesystem replace fails, the previous committed distribution is restored. If both commit and rollback fail because of an external filesystem/permission fault, `.release-dist-backup` is deliberately preserved as the recovery copy and the next release refuses to start until that recovery state is resolved.

## Package consumption

The npm package root and all public `components/*`, `core/*`, and `utils/*` subpaths resolve through the same `dist/esm/**` preserveModules graph. This prevents duplicate `Component`, configuration, instance-registry, or other singleton identities when root and subpath imports are mixed in one application.

```js
import QXFRAME9A7C2, { DatePicker } from 'qxframe9a7c2';
import { DatePicker as DirectDatePicker } from 'qxframe9a7c2/components/date-picker';
// DatePicker === DirectDatePicker
```

The single-file ESM bundle is intentionally explicit:

```js
import QXFRAME9A7C2 from 'qxframe9a7c2/bundle';
```

Traditional browser/CDN consumers use the IIFE file (`dist/qxframe9a7c2.js`); `unpkg` and `jsdelivr` point there. The package does not use a `browser` field to redirect module-aware bundlers to the IIFE build.

Vendored third-party runtime code and its license attribution are documented in `THIRD_PARTY_NOTICES.md`.

## CSS compatibility baseline

Public CSS contains **zero** `@layer`, `:is()`, `:has()`, or `:dir()` selectors. Original cascade-layer order is compiled into physical rule order. Relational states that previously depended on `:has()` are projected as ordinary framework state classes by an incremental dirty-subtree projector rather than full-document rescans. Public RTL state classes/options are not supported.

## Native HTML controls

Native authored form controls use the framework visual contract directly without turning them into JavaScript-owned components. No Form parent, bridge container, or opt-in control class is required.

Plain HTML controls are styled wherever they are authored:

```html
<input type="text" placeholder="Title">
<select><option>Draft</option><option>Published</option></select>
<textarea placeholder="Summary"></textarea>
<input type="checkbox">
<input type="radio">
<input type="range">
<input type="file">
<input type="date">
<input type="color">
```

The native-control contract covers text/search/email/password/url/tel/number/date/datetime-local/time/month/week, select, textarea, checkbox/radio, range, file, color, and native submit/reset/button states. It consumes the same Light/Dark, size, radius, border, focus, disabled/readonly, validation and Primary tokens as framework controls. Elements already owned by a `qxframe9a7c2-*` component class are excluded so component-specific paint remains authoritative.

## Runtime invariants

- Component-family shared behavior is governed by `tools/manifests/family-capabilities.json`. The audited 25 families must have one canonical owner; sibling components may adapt that owner but may not introduce a second state machine/rule implementation. `verify-core` enforces the critical consumer/delegation boundaries.
- Component instances are tracked by `ComponentRuntime`; declarative `[data-qx-component]` initialization, option schema/default handling, update impact routing, duplicate-init protection, and auto-destroy share one runtime.
- Controlled/uncontrolled value flows use `ValueController` as the public value authority, with `ControllableStateCore` limited to controlled/external-vs-internal request metadata; component-local duplicate value state machines are not allowed.
- `InteractionPolicy` is the shared disabled/readonly/loading capability gate; `PressInteraction` and `PointerSession` centralize activation and pointer-session semantics.
- `InteractionModality` records raw keyboard/pointer/touch/programmatic interaction context. `FocusOrigin` separately owns the origin of the current real DOM focus, while `KeyboardNavigation` owns virtual-navigation origin; managed keyboard focus visuals must not be inferred from global input modality alone.
- `FocusScope` owns popup/modal Tab boundaries (`exit`, `contain`, `trap`); `KeyboardRegion` owns one logical Tab region plus arrow-driven `VirtualFocus`. The two layers do not replace each other.
- `IdManager` is the canonical source for generated selector-safe identities.
- `Core.DOM.query()/resolveElement()` is the canonical selector boundary for user-authored selector input; malformed selectors fail closed instead of leaking native `DOMException`.
- `Core.DOM.isComposingEvent()` is the canonical IME composition guard shared by keyboard/press/dismiss behavior.
- `ObserverHub` and `Scheduler.measure()/mutate()` centralize observers and layout read/write scheduling. Observer constructor overrides must be explicit own properties; inherited `Object.prototype.constructor` is never treated as an observer implementation.
- Reduced-motion policy is resolved by `Config`, including scoped configuration and the shared OS preference observer.
- `InteractionDetails` carries shared `reason`, `source`, original-event and cancellation metadata across low-level interaction services.
- Overlay ownership is a logical tree, not just physical DOM containment.
- Closing/destroying an owner structurally tears down portaled descendant overlays.
- Focus trapping includes logical descendant overlay containers.
- Normal popup/modal/tooltip roots are ordered by root family; an older root's tooltip cannot cross above a newer modal root.
- `notice` and `blocking` roots remain global planes above normal overlay roots.
- Table item replacement reconciles stale selection/expanded keys on every data-update path.
- Sticky/fixed table offsets are resolved from actual rendered geometry, including responsive hidden columns.
- Navigation/media/image/download/document URLs pass through the central `URLPolicy`.
- Focus success is verified against the actual active element and hidden/inert/disconnected targets are rejected.
- Scroll locking supports custom scroll containers, logical inline-end compensation, nested locks, and fixed/sticky compensation.

## Build

```bash
npm test
npm run build
npm run verify:browser
npm run verify:release
# or one command:
npm run release
```

`npm test` validates the modern ESM architecture and family authorities without pretending to perform a production build. It also verifies that both release entries form a fully static browser graph (no bare imports, dynamic imports, Node builtins or `import.meta`), that `src/index.umd.js` publishes only the canonical global namespace in Chromium, that release staging commits/rolls back atomically, that build/pack tooling is independent of the caller's working directory, and that package declarations resolve through the real `exports.types` paths. `npm run build` requires the pinned Rollup toolchain (standard `rollup@4.63.4` preferred, official version-matched `@rollup/wasm-node` fallback) and generates the UMD/IIFE browser bundle, the ESM bundle, source maps, and `preserveModules` output in a staging directory. Type verification uses the declared `typescript@5.8.3`; browser/CDP verification prefers Node's native WebSocket and uses the declared `ws@8.21.3` fallback on Node versions without one. Postbuild derives `qxframe9a7c2.d.ts`, all `dist/esm/**/*.d.ts`, component API metadata, module metadata and migration metadata from current canonical source/manifests; it does not copy them from an old `dist`. `npm run verify:browser` is a strict release gate: Chromium/Chrome must be installed (or supplied through `CHROMIUM_BIN`) and none of the five browser layers may be skipped. `npm run verify:browser:optional` retains the developer-friendly skip behavior. `npm run verify:release` validates the staged artifacts before the atomic commit, including one-to-one source-map coverage for every preserveModules JS file, then the release command re-validates the committed output. `npm run build:frozen` is archival only and never substitutes for a production build.

The architecture verifier enforces: static canonical owners, no Registry/`defineModule` runtime dependency lookup, no legacy source directories, no import cycles, stable component contracts, and family-base boundaries.

## Static style inspection

Open `docs/all-components-static.html` for the CSS visual inspection page. It contains static HTML only, loads `dist/qxframe9a7c2.css`, and runs no component JavaScript. Styles are shown only inside complete, recognizable component/application scenarios; selector branches, foundation tokens, Grid utilities and the icon glyph list are not rendered as isolated samples. Production fixed roots are localized inside their owning specimen as `absolute`, and hidden/portal structures are displayed in their real component DOM context.
