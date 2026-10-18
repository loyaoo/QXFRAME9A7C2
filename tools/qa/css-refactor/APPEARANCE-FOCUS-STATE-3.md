# Control Appearance · Focus/validation owner migration · 2026-10-18

## Immutable references
- Frozen B0/main `62d9a8402c19460ced37265acc6d110ae2cfda76`
- Previous triple-green branch `3935453c9b4e1d23ba2b5034678e68533bac3007`: Fast #39124301698, CSS Schema #39124301663, QXFRAME #39124301634.
- PR #268 Draft; do not merge, modify B0 or edit business JS/Theme generator.

## Actual production change
- `src/styles/components/component-appearance.css`: 7 remaining qualified rules under its root scope → **4 scoped + 3 unscoped** in the **same late-loaded file**.
- Moved original scoped rules **#3, #4, #5** (entire state-facing topology for focus-within, is-focused, is-expanded, is-error/is-invalid/is-warning and disabled across native input/select/textarea, JS Input, OTP and Pagination).
- Scoped rules #1 (control border width), #2 (base Control background/edges), #6/#7 (Checkbox/Radio radius with user override precedence) **remain untouched**. `@scope` block count stays 2, because it is not yet valid to eliminate those remaining priority-sensitive rules.
- No selector, declaration, public/private variable definition, specificity, transition, color formula, DOM or JS change. Exactly the same 7 qualified rule bodies are preserved; one scope boundary moved.
- No new owner duplication: each moved selector/property pairing was absent in the earlier global owner graph (tinycss2 4,679 flattened rules checked).

## Independent local browser preflight
- Used the preceding exact-green official Windows `dist+docs` CSS (1,109,966 bytes) and replaced only the 3 scoped declarations in-place within its last appearance module.
- Headless Chromium static component fixture: **182 scoped/control/root nodes** spanning ordinary Light, nested .dark, zero/full field-side alpha, public pointer/theme overrides, focused/expanded/invalid/warning/disabled, native Input/Select/Textarea, OTP, Pagination. Sampled borders/colors, state variables, padding, sizing/geometry. Normal + 3 actual mouse hovers + 3 DOM focus states, all **0 candidate differences**.
- This is local targeted sampling, NOT an assertion of the full CSSOM on every node, 112-case CreateApp, portal states, or Stage5 user signoff. The production screenshot, full sampled CSSOM and B0 self/mutant/candidate proof are delegated to unmodified strict Fast Chromium comparator on exact new SHA.
- The Fast synthetic fixture is extended with native and JS Control states, nested .dark and public Theme field-sides/pointer overrides. Negative poison test remains mandatory.

## Rollback/acceptance
- Need exact-HEAD QXFRAME + CSS Schema + Fast Chromium success; fail closed if any deviation.
- R5/R6 overall remain open: 2 scopes and 33(?) other scoped rules (29 semantic + 4 appearance) remain; exact total **33** qualified rules inside active `@scope`.
