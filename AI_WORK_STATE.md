# QXFRAME9A7C2 AI Work State

> Persistent recovery checkpoint. Read `AGENTS.md` first.
> Git / PR / CI facts override stale text here. Always query the current branch, PR and Actions before continuing.
> Keep CURRENT concise. Historical investigation belongs in Git history and task change documents.

## Repository checkpoint

- Last checkpoint date: 2026-10-07
- Repository: `loyaoo/QXFRAME9A7C2`
- Package version: `2.19.81`
- **Top authority: `QXFRAME9A7C2-createApp-重做任务要求-v3.md`** (createApp redesign). It overrides this file's older Theme plans, the master handbook and v1.5 wherever they conflict.
- Measured shadcn reference data: `tools/qa/spec.json` (shadcn create SHA `295a1f114a138f23b5dfee0e0c6812394dfeb90c`).
- Runtime Controller migration: accepted 40/40 public components; do not restart it. qxframe.js is not modified in this program.
- Workflow: branch `redesign/create`, one PR per v3 stage, stop for owner acceptance after each stage PR. Ask the owner on anything v3 does not cover.
- Current Program: CREATEAPP-V3 — stage 0 of 0–5.
- Current Phase: CREATEAPP-V3 stage 0 — plain CSS source, concat build and v3 §5/§6 CI gates.
- Current Task: `CREATEAPP-V3-S0` — implemented; PR #261 awaiting owner acceptance.

## CURRENT

Task: CREATEAPP-V3-S0 — SCSS → plain CSS source, concat build, v3 §5/§6 CI gates.
Status: IMPLEMENTED on `redesign/create`; PR pending owner acceptance.

### Owner decisions (2026-10-07) — frozen

- §5/§6 gates run as a **ratchet**: current violations are frozen in `tools/manifests/css-gate-baseline.json`; any increase fails CI, counts may only fall; token-class violations clear in stage 2, every count must be zero by stage 5.
- Stage 0 keeps the **existing 60 module boundaries** (no cascade-order change). True per-component re-split happens in stage 2 together with the token-chain rewrite.

### Stage 0 delivered

- `src/styles/main/*.css` (reset, foundation, fixed-values, theme-visual-v2*) + `src/styles/components/*.css` (53 files); source text is the former SCSS module text verbatim (only a leading `@charset` removed). No SCSS, no `@import`, `sass` dependency removed.
- `tools/compile-styles.mjs` concatenates `tools/manifests/css-order.json` `sourceModules` in order, wrapping each in `/* @qxframe9a7c2-begin <seg> */ … /* @qxframe9a7c2-end <seg> */`.
- New gates: `verify:css-source-authority`, `verify:css-concat-build`, `verify:css-constraints` (§6), `verify:theme-tokens` (§5, includes theme-file 16KB warning and duplicate-owner count), `verify:js-build-matches-main` (CI, pull_request), `theme:chain` printer.
- `tools/qa/`: handoff `spec.json`, reference renderer `ref/`, handoff scripts `scripts/`, `css-equivalence.mjs`, reports in `tools/qa/reports/` (uploaded by CI as `qa-reports-<sha>`).

## NEXT EXACT STEPS

1. Owner accepts stage-0 PR (or requests changes). Do not start stage 1 before the owner says 继续.
2. Stage 1: sync `redesign/create` with main, then build `docs/create/` shell, customization panel and all interaction logic per v3 §3–§4.

## SUPERSEDED — THEME-VISUAL-V2-001

PR #258 merged into main (`1072127`). The remaining v1.5 G/H scope is superseded by the v3 createApp redesign; its token chain (`--qxframe9a7c2-theme-v2-*`, `@scope([data-qxframe9a7c2-style])`) is rebuilt in v3 stage 2. Accepted evidence for PR #255–#258 stays in Git history and `QXFRAME9A7C2-Theme-Visual-V2-001-Changes.md`.

## DO NOT REDO

- Do not redo the 9-controller migration, FocusOrigin unification, Popup/Scroll unification, Picker draft/value unification or CSS Grid/viewport cleanup.
- Do not reintroduce SCSS, `@import` or `sass` into the CSS build.
- Do not raise `tools/manifests/css-gate-baseline.json` counts to make CI pass.

## Frozen framework constraints

- One owner / one truth; projection is not a second writable truth.
- Exactly 9 Runtime Controllers; Shared Protocol infrastructure is not another business Controller.
- CSS is visual Theme/Token authority; JS and CSS do not form a Theme runtime dependency cycle.
- Framework layout remains Flex-based; no `display:grid`, `fr`, `vw`, `vh`, `vmin`, `vmax` in canonical framework CSS.
- No `@layer`, `:is()` or `:where()`.
- Most dimensional values are rem-based with 16px root reference; 1px borders are the permitted hairline exception and reference geometry otherwise prefers even pixels.
- Keyboard outline remains 2px with -1px offset under the existing FocusOrigin rules; pointer interaction uses border/background/shadow rather than keyboard outline.
- Loading/disabled/readOnly capability rules, Picker commit/draft semantics, popup focus scope, and existing Controller ownership protocols remain unchanged by Theme work.
- Tags overflow summary remains intentionally outside the main keyboard focus sequence unless a separately authorized full overflow-focus redesign is performed.

## Compact DONE evidence

### THEME-VISUAL-V2-001 — PR #255
- Merge: `a59c2d4664125d72f1950c4c6faff10b4fe2adf3`.
- Established first source-locked color representative chain and browser equivalence gates.

### THEME-VISUAL-V2-001 — PR #256
- Source head: `e6d63a8097413a08a02bfa46a0ee1b793cc1e478`; merge: `e7bbf6b7800a2a82db1bd04ac115e0ba5ff62ea4`.
- Main QXFRAME CI `37164806216`: SUCCESS including Pages.
- Accepted evidence: 15,131 color checks, 51,855 geometry checks, 23 Studio checks.
- Delivered shared consumer expansion, 21 md inputs/fixed derivation, native choices and Studio-v2 foundation.

### PHASE-I-001 — release-integrity + Astra High handoff
Status: DONE
- Phase H public surface remains accepted 40/40 and the release-integrity gate remains required while the current Theme lifecycle advances independently.
- This compact checkpoint preserves the machine-readable completion evidence; detailed historical investigation remains in Git history.

### VISUAL-RECIPE / CSS THEME BASELINE
- PR #254 merged `965d0af5a55f8adea1f3afa3e0692c604f4cde2f`; Post-PR253 visual recipe plan completed before THEME-VISUAL-V2-001 superseded the old public Theme interface.
- Earlier Schema1 generator/freeze tasks are historical evidence only; their public Theme interface is intentionally retired by the single-system decision and must not be revived.

### 9 Runtime Controllers / shared architecture
- Public component migration accepted 40/40 through Phase H; Phase I release-integrity gates remain required.
- Theme/Token are pure CSS, not Runtime Controllers.
- FocusController / InteractionController / CapabilityController / SelectionController / OverlayController / MotionController / FeedbackController / FormController and ValueController ownership is already established and regression-gated.

### CSS structural closeout
- Canonical SCSS is physically modularized; legacy monolithic CSS mirror is retired.
- Actual CSS Grid/fr and viewport-unit live inventories are zero and verifier-locked.
- Popup→Scroll, focus-origin, Picker draft projection, Date range behavior, Image/TimePanel/DatePicker interaction follow-ups are historical accepted work and are not THEME-VISUAL-V2-001 redo scope.

## Recovery rule

On a new conversation: read `AGENTS.md` → this file → `QXFRAME9A7C2-createApp-重做任务要求-v3.md`, then query the `redesign/create` branch, its open PR and CI. Continue from NEXT EXACT STEPS. Do not start a repository-wide audit from zero.
