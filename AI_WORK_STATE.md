# QXFRAME9A7C2 AI Work State

> Persistent recovery checkpoint. Read `AGENTS.md` first. Git / PR / CI facts override this file.

## Repository checkpoint

- Checkpoint date: 2026-10-05.
- Repository: `loyaoo/QXFRAME9A7C2`.
- Package version: `2.19.81`.
- Baseline main before this batch: `1072127d36f9b653de7284f246e4e480f1f969f7` (merged PR #258).
- Working branch: `feat/theme-v2-8-m0-m2`.
- Draft PR: `#259` — Theme v2.8 M0/M1 intent and precedence foundation.
- Master runtime architecture remains `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md`: 9 Runtime Controllers + Shared Protocol + pure-CSS Theme/Token. Runtime Controller migration is accepted 40/40 and must not be restarted.
- Theme target: `QXFRAME9A7C2-Theme-System-Unified-Execution-Guide-v2.8-2026-10-04.md`. v1.5, v2.7 Canonical Map and the 2026-10-04 audit are provenance only after the exact v2.8 guide is committed into the repository.
- Current Phase: THEME-VISUAL-V2-001 / v2.8 M0-M1 implementation, with M2 representative-chain preparation only.
- Current Task: `THEME-VISUAL-V2-001` — IMPLEMENTING v2.8 on PR #259.
- Work denominator: `tools/manifests/theme-v2-8-work-items.json` tracks M0-M8 and confirmed gaps I01-I19. It is a planning denominator, not the final component/slot/property Mapping Registry.
- Confirmed-gap closeout: I03/I04/I05/I10/I12 implemented and awaiting final green head; I01 partially implemented; remaining gaps not yet claimed complete.
- Do not reuse the historical v1.5 `70%` figure as v2.8 progress.

## CURRENT

### M0 — recovery and authority entry

Status: IN PROGRESS.

Completed:
- `AGENTS.md` points THEME-VISUAL-V2-001 at v2.8 and freezes existing JS focus/focus-visible ownership.
- Branch and PR were created from the actual merged main; no historical Controller/Token phase was restarted.
- `tools/manifests/theme-v2-8-work-items.json` establishes the first machine-readable v2.8 planning denominator from the 19 confirmed gaps.
- CI/release has been split into equivalent named steps for diagnosability; coverage was not removed.

Remaining before M0 can be called DONE:
- commit the exact approved v2.8 unified guide at the path referenced by `AGENTS.md`;
- replace the planning denominator with/augment it by the exact component/slot/property Mapping Registry when M6 broadens coverage.

### M1 — user intent, reset and existing overrides

Status: IN PROGRESS; implementation substantially landed, final browser/CI head still required.

Implemented:
- `docs/assets/theme-generator/engine-v2.mjs`
  - adds `qx-theme-intent-1`;
  - separates sparse user `intent` from resolved `config`;
  - `serializeThemeV2()` persists intent instead of dumping resolved defaults;
  - unknown future intent schema is rejected;
  - same-process exact resolved config objects retain their sparse source intent through a WeakMap compatibility bridge.
- `docs/assets/theme-generator/studio-v2.mjs`
  - localStorage/JSON import/export use the same sparse intent contract;
  - Style changes no longer delete explicit options/geometry/appearance;
  - option/appearance/shape edits do not copy resolved defaults back into intent;
  - each non-Style option/appearance/shape field now has an explicit `跟随 Style` reset that deletes only that field and preserves siblings;
  - color restore prunes empty intent containers.
- `docs/assets/theme-generator/style-engine-v2.mjs`
  - Surface supplies Card border/shadow defaults only;
  - explicit `border` and `shadow` win over Surface defaults;
  - `fontHeading=inherit` remains a live CSS dependency instead of a flattened copied font string.
- `src/styles/theme/_visual-v2-style-consumers.scss`
  - Card padding/radius/shadow now preserve existing public Detail endpoints ahead of Theme common/default values;
  - Card xs/sm/md/lg/xl padding keeps the corresponding public compatibility endpoint;
  - the style-consumer Card block no longer writes final `box-shadow` directly.
- `tools/verify-theme-v2-intent.mjs`
  - locks sparse intent round trip, Style switch preservation, per-field reset, Surface/default precedence, live heading dependency and Card Detail fallback source chain.
- `.github/workflows/css-schema-acceptance.yml`
  - runs the new verifier without weakening existing Theme/browser gates.

Known M1/M2 boundary:
- I01 is only partial until earlier direct Card assignments/paint in `_visual-v2.scss` are removed or converted and browser T03 proves padding/radius/shadow end-to-end.
- `_visual-v2.scss` still contains direct Theme Card paint and many other direct component-property writes; that is I02/M2, not falsely claimed as closed by the later fallback bridge.
- legacy resolved snapshot identity/migration output remains M5 unless an M1 compatibility failure requires earlier work.

### M2 — representative component/state chain

Status: NOT YET CLAIMED COMPLETE.

Next representative set: Vega/Sera/Maia × Button/Input/Select/Card/Popup.
- establish unique paint ownership through existing private Component Tokens;
- separate real focus/focus-visible visual properties from expanded/invalid/warning selectors without touching JS FocusOrigin behavior;
- remove QX canonical Theme `ring` only together with replacement consumers and tests, never as an isolated rename/delete;
- do not reimplement Popup/Scroll or Controller interaction logic.

## CI evidence for PR #259

- CSS Schema Acceptance run `37219257481` on head `50ffda1b13203b82bd588b735b660bc6c6a09625`:
  - build, single-Theme, Studio-static and new v2.8 intent/precedence verifier passed;
  - browser smoke failed only because Chromium DevTools startup timed out after 30s; no assertion mismatch was reported.
- QXFRAME CI run `37219257509` on the same head:
  - Windows tools passed;
  - build and all static/architecture checks through `verify:final-audit-regressions` passed;
  - `verify:phase-i-release-integrity` failed because this checkpoint had temporarily dropped the historical lifecycle marker fields, not because of Theme implementation behavior.
- This checkpoint restores the required lifecycle markers and preserved Phase-I completion evidence instead of weakening/removing the gate.
- A new CI head after this commit must be checked again. Browser startup timeouts are infrastructure failures; retry the same gate rather than widening tolerances or skipping it.

## ACCEPTED HISTORICAL LIFECYCLE EVIDENCE

### PHASE-I-001 — release-integrity + Astra High handoff
Status: DONE
- Phase H public surface remains accepted 40/40.
- Phase I release-integrity completed before the current Theme lifecycle and its gate remains required.
- Detailed historical evidence remains in Git history and `FOUR_UNIFICATIONS_ACCEPTANCE.md`; do not restart it.

### Runtime Controllers / Shared Protocol
- All 40 public component profiles remain accepted under the 9 Runtime Controllers.
- Theme/Token remain pure CSS authority, not Runtime Controllers.
- FocusController/InteractionController/CapabilityController/SelectionController/OverlayController/MotionController/FeedbackController/FormController/ValueController ownership remains regression-gated.

## NEXT EXACT STEPS

1. Let the post-checkpoint PR #259 head run both required workflows; if browser startup alone times out, rerun the same failed job without changing test tolerance.
2. Finish I01/T03 end-to-end by removing the earlier direct Card paint/duplicate Theme assignment from `_visual-v2.scss` while keeping component `_card.scss` as final property owner; add/confirm browser padding + radius + shadow positive controls.
3. Commit the exact approved v2.8 unified guide into the repository so `AGENTS.md` has a real local authority file.
4. Start M2 representative Vega/Sera/Maia Button/Input/Select/Card/Popup mapping and unique paint-owner cleanup.
5. Implement state-property mapping and only then retire the QX canonical Theme focus `ring` semantic; JS focus-origin behavior stays frozen.
6. Continue M3-M8 in v2.8 order. Do not replace the production default before M8.

## DO NOT REDO

- Do not restore/re-audit Schema1 Theme/generator/public token chains, Preset/Palette 1..N or public five-size Theme tables.
- Do not redo the 9 Runtime Controllers, FocusOrigin, Popup/Scroll unification, Picker draft/value semantics, CSS Grid/viewport cleanup or SCSS modularization unless a precise v2.8 visual consumer requires it.
- Do not turn Theme/Token into JS Runtime Controllers or read computed Theme values in production JS.
- Do not treat external-source `ring`, historical private endpoint names or Progress ring geometry as a reason to keep a QX canonical Theme focus-color semantic.
- Do not remove existing component endpoints merely because current values match.
- Do not make tests pass by restoring direct Theme paint, widening color/geometry tolerances or adding accepted-failure lists.

## FROZEN FRAMEWORK CONSTRAINTS

- One owner / one truth; projection is not a second writable truth.
- Flex-based framework layout; no canonical `display:grid`, `fr`, `vw`, `vh`, `vmin`, `vmax`.
- No `@layer`, `:is()` or `:where()`.
- rem-based geometry with 16px root reference; existing 1px hairline exception; border-aware geometry may document derived odd compensation when mathematically necessary.
- Existing keyboard-vs-pointer FocusOrigin behavior remains unchanged. Current keyboard outline is a default visual recipe, not an immutable Theme semantic.
- Loading/disabled/readOnly capability rules, Picker commit/draft, popup focus scope and existing Controller ownership remain unchanged by Theme work.
- Tags overflow summary remains outside the main keyboard focus sequence unless separately authorized as a full interaction redesign.

## ACCEPTED BASELINE — DO NOT MISREPORT AS v2.8 COMPLETION

PR #258 / main `1072127d36f9b653de7284f246e4e480f1f969f7` established the single public Theme-v2 baseline and historical source/color/geometry/browser evidence. It is the starting point for v2.8, not proof that M1-M8 are complete.

## Recovery rule

On resume: read `AGENTS.md` → this file → repo-local v2.8 guide when committed → relevant Runtime/Shared Protocol section → query actual branch/PR/CI. Resume from `NEXT EXACT STEPS`; do not restart a repository-wide audit.
