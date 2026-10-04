# QXFRAME9A7C2 AI Work State

> Persistent recovery checkpoint. Read `AGENTS.md` first. Git / PR / CI facts override this file.

## Repository checkpoint

- Checkpoint date: 2026-10-05.
- Repository: `loyaoo/QXFRAME9A7C2`.
- Package version: `2.19.81`.
- Baseline main before this batch: `1072127d36f9b653de7284f246e4e480f1f969f7` (merged PR #258).
- Working branch: `feat/theme-v2-8-m0-m2`.
- Master runtime architecture remains `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md`: 9 Runtime Controllers + Shared Protocol + pure-CSS Theme/Token. Runtime Controller migration is accepted 40/40 and must not be restarted.
- Theme target: `QXFRAME9A7C2-Theme-System-Unified-Execution-Guide-v2.8-2026-10-04.md`. v1.5, v2.7 Canonical Map and the 2026-10-04 audit are provenance only after v2.8 is committed into the repository.
- Task: `THEME-VISUAL-V2-001`.
- Current v2.8 batch: M0 + M1, then M2 representative chain.
- Progress: v2.8 numeric progress is intentionally `baseline pending` until the applicable registry/task denominator is established. Do not reuse the historical v1.5 `70%` figure.

## CURRENT

### M0 — recovery and authority entry

Status: IN PROGRESS.

Completed in this branch:
- `AGENTS.md` now points THEME-VISUAL-V2-001 at v2.8 and freezes the existing JS focus/focus-visible ownership boundary.
- Branch was created from the actual merged main rather than restarting historical phases.
- This checkpoint removes the stale claim that only G/H remain and the stale 70% progress reuse.

Still required before M0 is DONE:
- commit the exact approved v2.8 unified guide into the repository at the path referenced by `AGENTS.md`;
- establish the first machine-readable applicable task/registry denominator instead of inventing a percentage;
- record PR/head/CI evidence after the first meaningful code batch is opened.

### M1 — user intent and existing overrides

Status: IN PROGRESS.

Implemented so far:
- `docs/assets/theme-generator/engine-v2.mjs`
  - adds `qx-theme-intent-1`;
  - returns separate resolved `config` and sparse `intent`;
  - `serializeThemeV2()` persists intent instead of dumping resolved defaults;
  - parser rejects unknown future intent schema;
  - a WeakMap preserves sparse intent when current callers serialize the exact resolved config object, keeping existing same-process round-trip callers compatible.
- `docs/assets/theme-generator/studio-v2.mjs`
  - localStorage/JSON import/export use the same sparse intent contract;
  - changing Style no longer deletes options/geometry/appearance;
  - option/appearance/shape edits merge into explicit input only and do not copy resolved defaults back into intent.
- `docs/assets/theme-generator/style-engine-v2.mjs`
  - Surface supplies Card border/shadow defaults only;
  - explicit `border` and `shadow` now win over Surface defaults;
  - `fontHeading=inherit` remains a live CSS dependency on Theme body font instead of being flattened to a copied font string.
- `tools/verify-theme-v2-intent.mjs`
  - locks T01/T02/T14 configuration semantics and heading follow dependency.
- `.github/workflows/css-schema-acceptance.yml`
  - runs the new v2.8 intent/precedence gate without weakening existing gates.

Not yet complete in M1:
- I01/T03: Card public padding/radius/shadow override must survive Theme assignment through the real component paint owner;
- single-field UI "follow Style/default" controls beyond the existing color restore action;
- T07 reset semantics beyond sparse deletion basics;
- old resolved snapshot migration report/identity product is deferred to M5 unless needed for M1 compatibility.

### M2 — representative component/state chain

Status: NOT STARTED in code. Do not remove canonical `ring` inputs piecemeal until the state-property replacement path is implemented and the representative Vega/Sera/Maia gates exist. JS FocusOrigin behavior is frozen.

## CURRENT BRANCH COMMITS

- `2e84874a6c76cc0c3aa256b774d2d143cd4ca84b` — sparse Theme intent engine.
- `4ab34c77dbcc366b5712de24940572785244f211` — explicit visual choices override Surface defaults; live heading follow.
- `662aded6b2642df037d080462e544d24dae788a4` — Studio keeps explicit choices across Style switches.
- `6ae739e97f6dc34171306ee1f29791356466c772` — v2.8 intent/precedence verifier.
- `011a7cc5dc110f02eb89eec2f0911dd10c3cc847` — CI gate hookup.
- `e6f6d7c6ba13025cf0deb814397ca9cf214119e3` — v2.8 authority update in AGENTS.

## NEXT EXACT STEPS

1. Commit the exact v2.8 unified execution guide into the repository.
2. Finish M1 I01/T03: route Card padding/radius/shadow Theme defaults through its existing public/private Component Token fallback instead of bypassing it; add focused regression coverage.
3. Run/open the PR and inspect existing Theme/Studio/browser gates. Fix new-contract conflicts by updating assertions to the v2.8 contract, never by weakening interaction/color tolerances.
4. Complete M1 single-field restore semantics that have a real UI consumer.
5. Start M2 only after M1 chain is stable: representative Vega/Sera/Maia Button/Input/Select/Card/Popup, unique paint ownership and real state-property mapping; remove QX canonical Theme `ring` only together with its replacement consumers and tests.
6. Continue M3-M8 in v2.8 order. Do not publish a new final default before M8.

## DO NOT REDO

- Do not restore or re-audit Schema1 Theme/generator/public token chains, Preset/Palette 1..N or public five-size Theme tables.
- Do not redo 9 Runtime Controllers, FocusOrigin, Popup/Scroll unification, Picker draft/value semantics, CSS Grid/viewport cleanup or SCSS modularization unless a new v2.8 requirement directly affects a precise visual consumer.
- Do not turn Theme/Token into JS Runtime Controllers or read computed Theme values in production JS.
- Do not treat `ring` in external source provenance, historical private endpoint names, or Progress ring geometry as a reason to keep a QX canonical Theme focus-color semantic.
- Do not remove existing component endpoints merely because values currently match.
- Do not make tests pass by restoring old direct Theme paint, widening source color tolerances or adding accepted-failure lists.

## FROZEN FRAMEWORK CONSTRAINTS

- One owner / one truth; projection is not a second writable truth.
- Flex-based framework layout; no canonical `display:grid`, `fr`, `vw`, `vh`, `vmin`, `vmax`.
- No `@layer`, `:is()` or `:where()`.
- rem-based geometry with 16px reference root; existing 1px hairline exception; v2.8 border-aware geometry may document derived odd compensation when mathematically required.
- Existing keyboard-vs-pointer FocusOrigin behavior remains unchanged. Current keyboard outline is a default visual recipe, not an immutable Theme semantic.
- Loading/disabled/readOnly capability rules, Picker commit/draft, popup focus scope and existing Controller ownership remain unchanged by Theme work.
- Tags overflow summary remains outside the main keyboard focus sequence unless separately authorized as a full interaction redesign.

## ACCEPTED BASELINE EVIDENCE — DO NOT MISREPORT AS v2.8 COMPLETION

PR #258 established the single public Theme v2 baseline and historical source/color/geometry/browser evidence. Its main merge is the starting point for this branch. That evidence remains useful regression coverage but does not prove the new v2.8 M1-M8 contracts are complete.

## Recovery rule

On resume: read `AGENTS.md` → this file → v2.8 unified guide → relevant Runtime/Shared Protocol section → query actual branch/PR/CI. Resume from `NEXT EXACT STEPS`; do not restart a repository-wide audit.
