# QXFRAME9A7C2 Browser / Runtime Contract

This file is the canonical browser/runtime baseline for QXFRAME9A7C2 2.19.x.

## Supported browser baseline

| Browser family | Minimum supported version |
| --- | ---: |
| Chrome | 105 |
| Edge (Chromium) | 105 |
| Firefox | 112 |
| Safari | 16.4 |

The framework is shipped as a browser bundle and is not transpiled to ES5. The supported baseline assumes modern JavaScript (`Map`, `Set`, `WeakMap`, `Promise`, `URL`) and modern CSS logical properties.

## Platform capability contract

| Capability | Contract |
| --- | --- |
| AbortController | Preferred by `AsyncTask` and `MotionCore`; stale-result/lifecycle guards still prevent late writes when the constructor is unavailable. |
| Pointer Events | Native on the supported baseline and used by canonical pointer/press primitives. |
| ResizeObserver | Access goes through `ObserverHub`; absence must fail closed rather than crash. Components may use an explicit fallback only where documented. |
| MutationObserver | Access goes through `ObserverHub`; absence must fail closed rather than crash. |
| IntersectionObserver | Access goes through `ObserverHub`; absence must fail closed rather than crash. |
| `inert` | Preferred by interaction isolation. `InteractionIsolation` has a pointer-events fallback for environments without the property. |
| requestAnimationFrame | Required by the browser runtime; framework scheduling is owned by `Scheduler`. |
| CSS logical properties | Required by the supported baseline. |
| WeakRef | Optional diagnostics enhancement only; runtime correctness must not depend on it. |
| Trusted Types | Strict `require-trusted-types-for 'script'` is **not** part of the 2.19.x baseline contract. `DOMTemplate` remains restricted to framework static HTML; full TrustedHTML integration is a separate security decision. |
| Shadow DOM | Not a formal 2.19.x framework contract. Composed-path handling may exist internally, but ordinary Document DOM remains the supported ownership model. |

## Realm / document rule

Once a component resolves its `ownerDocument` / explicit `document`, DOM creation and realm-sensitive operations must stay in that document/window for the lifetime of the instance. Visible component source must not create instance DOM with `global.document.create*`.

## Verification

`tools/verify-platform.js` is part of `npm run verify`. It checks this document and the source-level platform boundaries so browser support cannot silently drift away from the declared baseline.
