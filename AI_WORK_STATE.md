# QXFRAME9A7C2 AI Work State

> Persistent recovery checkpoint. Read `AGENTS.md` first.
> Git / PR / CI facts override stale text here. Always query the current branch, PR and Actions before continuing.
> Keep CURRENT concise. Historical investigation belongs in Git history and task change documents.

## Repository checkpoint

- Last checkpoint date: 2026-10-08
- Repository: `loyaoo/QXFRAME9A7C2`
- Package version: `2.19.81`
- **Top authority: `QXFRAME9A7C2-createApp-重做任务要求-v3.md`** (createApp redesign). It overrides this file's older Theme plans, the master handbook and v1.5 wherever they conflict.
- Measured shadcn reference data: `tools/qa/spec.json` (shadcn create SHA `295a1f114a138f23b5dfee0e0c6812394dfeb90c`).
- Runtime Controller migration: accepted 40/40 public components; do not restart it. qxframe.js is not modified in this program.
- Workflow: branch `redesign/create`, one PR per v3 stage, stop for owner acceptance after each stage PR. Ask the owner on anything v3 does not cover.
- Current Program: CREATEAPP-V3 — stage 3 of 0–5 (stages 0, 1, 2a, 2b merged).
- Current Phase: CREATEAPP-V3 stage 3 — Preview 01 geometry alignment.
- Current Task: `CREATEAPP-V3-S3` — resumed on owner instruction, 2026-10-07.

## CURRENT

Task: `CREATEAPP-V3-S3` — Preview 01 geometry parity. Status: IN PROGRESS.
Branch `redesign/create`, Draft PR #265, do not merge before owner acceptance.
Stages 0–2 merged, Controller runtime 40/40 accepted; do not redo or modify qxframe.js.

LAST VERIFIED CI GREEN: HEAD `3f633e206a51dc43e7c82255afac18940873c0b2`,
QXFRAME CI run `37739795743` release + windows-tools success,
CSS Schema Acceptance run `37739795705` success. This batch registered
Item/Field five Theme roles and added a pinned 8 styles × 2 modes × 15 computed
geometry gate; 14 createApp browser steps passed. The new 528-entry first-Card
diagnostic compares source-pinned first Card heights, reporting **400/528 >0.5px
vs prior 410/528**, **186 improved and 172 worsened**. Top Nova residuals FAQ+87,
Kitchen Island+45, Preferences+42, Sidebar Nav+36 and Empty Distribute+28.75.
These are diagnostic counts, NOT Stage 3 Card parity acceptance.

CURRENT CODE BATCH (source-backed targeted cards, pending its own CI):
- Inspected upstream pinned `empty-distribute-track.tsx`, `faq.tsx`,
  `preferences.tsx`, all eight `style-*.css` recipes.
- Source Empty cards all locally specify `p-4` (16px) even though style's
  Empty tier is 24/48px. Shared Empty now permits
  `--qxframe9a7c2-empty-padding` local override without altering
  theme media/title density. All three Preview 01 Empty cards set 16px;
  shared icon media bottom gap is 8px; dense Mira header gap is 4px, other
  pinned defaults are 8px, projected from existing control density.
- FAQ Accordion source trigger/content insets are 16,10,16,10,8,16,16,16px
  across Vega/Nova/Maia/Lyra/Mira/Luma/Sera/Rhea. Registered ONE new theme
  input `accordion-padding`, compiled from existing axes. Preview
  FAQ CSS consumes it along with theme type/weight/corner.
- Two Preferences `FieldSeparator` examples now reproduce the source's
  -16px top/bottom margins without changing the reusable Divider.
- Added 8-style static source tests and 8×2 computed browser checks for FAQ,
  Empty card instance padding/media/header, and Preferences separators.
  QA documentation and PR description to be updated after CI.

Program engineering estimate: CREATEAPP-V3 overall 57%, S3 Stage 3 **38%**
(provisional pending current CI); 624/624 earlier shared Card geometry and
Empty/Item/Field subset browser gates already passed. New reports remain a
non-gating diagnostic, and the old 410 differences are superseded by the
measured 400/528 baseline only at the last green HEAD.

KITCHEN ISLAND SOURCE-DERIVED FOLLOW-UP (2026-10-08, CI pending):
- Read pinned upstream `ui/item.tsx`, eight `style-*.css` recipes and
  `blocks/preview-02/cards/kitchen-island.tsx`.
- Upstream `ItemMedia variant=icon` is a bare 16px glyph with no
  32px background/border in all eight styles; QX erroneously used a
  32px boxed icon, ballooning four Kitchen slider rows.
- Shared QX `item-surface.css` now emits bare 16px icon media and
  16px default / 10px sm children / 8px xs children ItemGroup gaps
  using `:has()`. Preview 01 Kitchen markup removes four redundant
  nested media wrappers. Static and browser QA added (8 style × 4
  rows; verify DOM count, width/height/border/group gap).
- Await HEAD CI and newly regenerated 528-card diagnostic; do not
  claim the +45px Nova kitchen difference fixed before measurement.

REMAINING: source `style-sera:hidden` on Preferences FieldSeparator,
contained Accordion shell variants; Card internal/nested markup, Item sm/xs,
and comprehensive first-Card height parity (old baseline still hundreds off).
NEXT EXACT STEP: Inspect latest HEAD PR Actions, fix any failures without
weakening §5/§6 ratchet; read full release `[preview-01-first-card-diagnostic]`
lines, checkpoint new currentOverTolerance/improved/worsened values; continue
source-driven high-impact cards. Keep PR #265 Draft, no main merge.


### Owner decisions (2026-10-07) — frozen

- Stage 2 decisions: dark mode selector is **`.dark` only** (no `[data-qxframe9a7c2-theme="dark"]` alias; repo docs/createApp switch to class="dark"); docs-site theme/style switchers **simplified to light/dark only** (style/theme customization lives in createApp; tokens.html shows the new token list; theme-playground redirects to createApp); **Claude drafts the ~100-token closed list** (registered under tools/manifests) and migrates directly, owner accepts on Pages; stage 2 split into **2a** (list + compiler + default theme + preview-used core components) and **2b** (all remaining components, :root component tokens cleared), each merged on green CI.

- §5/§6 gates run as a **ratchet**: current violations are frozen in `tools/manifests/css-gate-baseline.json`; any increase fails CI, counts may only fall; token-class violations clear in stage 2, every count must be zero by stage 5.
- **Framework zero React / zero UI-framework dependency**; Floating UI (vendored) is the only third-party runtime code. `tools/qa/ref/` (React-based shadcn reference renderer) is kept as a measurement tool only and never ships; `verify:no-framework-deps` enforces this in CI.
- Answer the owner in Chinese.
- **Acceptance via GitHub Pages**: when a stage PR's CI is fully green, Claude merges it into main; Pages publishes and the owner accepts on the live site (`https://loyaoo.github.io/QXFRAME9A7C2/…`). Problems are fixed in a follow-up PR.
- Stage 1 builds **all preview cards in a first version** (shadcn preview-02 → 01, preview → 02, ~68 cards, shadcn English copy, QX components); stages 3/4 only do per-card geometry alignment.
- Stage 1 previews change live through a **temporary mapping onto the existing v2 theme inputs** (style scope, shadcn base/theme colors, radius, dark); stage 2 replaces it with the new compiler and deletes the mapping.
- Stage 0 keeps the **existing 60 module boundaries** (no cascade-order change). True per-component re-split happens in stage 2 together with the token-chain rewrite.

### Stage 0 delivered

- `src/styles/main/*.css` (reset, foundation, fixed-values, theme-visual-v2*) + `src/styles/components/*.css` (53 files); source text is the former SCSS module text verbatim (only a leading `@charset` removed). No SCSS, no `@import`, `sass` dependency removed.
- `tools/compile-styles.mjs` concatenates `tools/manifests/css-order.json` `sourceModules` in order, wrapping each in `/* @qxframe9a7c2-begin <seg> */ … /* @qxframe9a7c2-end <seg> */`.
- New gates: `verify:css-source-authority`, `verify:css-concat-build`, `verify:css-constraints` (§6), `verify:theme-tokens` (§5, includes theme-file 16KB warning and duplicate-owner count), `verify:js-build-matches-main` (CI, pull_request), `theme:chain` printer.
- `tools/qa/`: handoff `spec.json`, reference renderer `ref/`, handoff scripts `scripts/`, `css-equivalence.mjs`, reports in `tools/qa/reports/` (uploaded by CI as `qa-reports-<sha>`).

### Stage 0 evidence

- Visual equivalence (`tools/qa/reports/stage-0/`): 222/222 renders (111 canonical pages × light/dark) pixel-identical and computed-style-identical, 314,798 elements; CSSOM 4,610 rules, 0 unequal.
- qxframe.js: 553 non-CSS build files byte-identical to main.
- CI on PR #261 head `25e8cf4`: release ✅, windows-tools ✅, schema-acceptance ✅ (deploy-pages skipped on PR).

### Stage 1 delivered

- `docs/create/`: `index.html` (shell), `app.css`, `app.js` (panel, pickers, hover preview, undo/redo, locks, shuffle, reset, import/export, shortcuts, URL + localStorage), `model.js` (pure config model + interim compiler onto v2 tokens), `data.js` / `themes.js` (v3 §4 option tables, 24 shadcn themes), `preview-01.html` (shadcn preview-02, 32 cards), `preview-02.html` (shadcn preview, 31 cards), `preview.css` / `preview.js` / `preview-cards.js`.
- Gates: `verify:create-app` (13 static/model checks, in `verify` chain), `verify:create-app-browser` (9 CDP interaction steps, own CI step).
- Known gaps (later stages): extension axes only partly mapped by the interim compiler (stage 2 compiler); `.pv-*` private primitives to be promoted into qxframe.css (stages 3/4); tables/accordion static; old theme-generator deleted in stage 5.

### Stage 2a progress (WIP on redesign/create, not yet a PR)

Done:
- `docs/create/tokens.js` closed list (~130 tokens, registry used by gates); `docs/create/compiler.js` emits full :root + .dark; `tools/build-theme.mjs` generates `src/styles/main/theme.css` (Nova + neutral, ~11.5KB; `--check` mode).
- v2 consumer modules rewritten onto new tokens; all `@scope([data-qxframe9a7c2-style])` blocks removed; `[data-qxframe9a7c2-theme*]` → `:root` / `.dark`; light-dark() kept only for shared mode formulas.
- Focus: keyboard via focus-width/opacity/offset tokens; pointer focus only via :focus-visible under pointer origin (FocusOrigin gate forbids bare :focus outlines; buttons not covered — tell owner).
- Docs: docs-theme-state.js light/dark only (`.dark` class); tokens.html renders the closed list; theme-playground.html = card linking to create/ (playground assets deleted; canonical gate adapted); all-components-static theme panel → createApp link.
- Gate refinements (tell owner): css-gates registry = tokens.js; theme block = :root/.dark rule declaring theme tokens; root-non-theme counts custom properties only; theme files must be complete. Corrected definition exposes 2,211 legacy color literals in fixed-values :root palettes (previously exempt) → needs documented re-baseline.
- `verify:theme-single-system` adapted to v3 closed list.

Gates adapted to v3 and passing locally (commits 9a2ee97..HEAD): phase-f-css-authority, theme-single-system, css-concat-build, geometry family (theme-v2-geometry-contract now async + 7 callers), css-token-layers, phase-f-token-graph, css-static-colors(+browser), theme-visual-v2(+browser; rewritten as createApp compiler/consumer contract), phase-f-static-closeout, canonical docs, final-focus-origin, theme-studio-v2/-static (now delegate to createApp gates).
Local evidence (after npm run build): every `npm run verify` step passes; verify:browser, verify:theme-visual-v2-browser (compiled theme per style resolves in consumers, light+dark), verify:theme-studio-v2-browser (= createApp browser gate, 9 steps), verify:legacy-browser, verify:release, verify:package pass; canonical docs browser gate on demo package passes. theme-playground keeps the all-component canvas (needed by browser smoke) with a createApp entry card. Ratchet re-measured (728b6ee).

### Stage 2a acceptance findings → fixed in 2b (owner decision 2026-10-07)

- BUG: 边界清晰度 thin/clear makes compileTheme throw (alpha() cannot parse the color-mix() hairline value) → app breaks. Fix: compute hairline by oklch lightness interpolation toward background/foreground.
- Tokens compiled but not consumed by qxframe.css yet: radius-badge, radius-tabs, radius-dialog, card-section, card-section-border (badge/tag, tabs, modal/drawer radius and card footer band need consumer rules). chart-1..5 only used by createApp preview.
- 选择器 shape axis has no effect (selects share radius-field) — needs its own token or removal.
- Luma slider thumb (shadcn w-6 h-4 long capsule) not modelled: single slider-thumb size token; need slider-thumb-width token.
- Docs/default look: Nova defaults are thin (slider 4px rail, 12px thumb; switch 32×18.4) vs the old QX look; capsule options exist (滑块 胶囊12, 开关 宽体) but defaults follow Nova.

## NEXT EXACT STEPS

1. DONE 2b-A (9a74c7d): hairline fix, badge/tabs/dialog/select radius + card-section consumers, radius-select + slider-thumb-width tokens (Luma 24×16 verified in browser), verify-create-app check #14 (every axis level reaches a consumer).
2. DONE 2b-B (dissolve fixed-values :root custom properties), commits aee6c0b..HEAD:
   - step 1 inline/dead (proven 0 diffs), step 3 mode-color palettes removed, 3b repoint legacy roles → theme tokens (tools/qa/migrations/repoint-legacy-palette.mjs, drop-broken-decls.mjs), 3c inlined 14 mode-independent media-overlay/shadow constants + dead `.is-default` button palette block removed + docs legacy `--qxframe9a7c2-color-*` → theme tokens / docs-accent, 3d removed 3 `*`-shadowed root defs.
   - Equivalence (scratchpad/eq3e.json, baseline after-inline.css): 111 pages × light/dark, 335 diffs, all reviewed and accepted: same color in other notation (color(srgb) ↔ rgba), status soft tints 12%/22% → 10%/20%, login/result tints follow theme primary/status, message + image-preview video shadow → theme shadow-popup, color-picker active mode button gets primary soft tint, result info icon uses theme-info; element-count rows are async-demo noise.
   - Ratchet re-baselined: root-non-theme 4618→383, hardcoded-color 2244→126, public-component-token-declared 503→492 (per-segment hardcoded-color rose where constants moved into their only consumer; documented in baseline note).
   - Remaining for stages 3–5: public-component-token-declared 492, root-non-theme 383, duplicate-owner 141, hardcoded-color 126 (color picker spectrum needs documented exception).
3. DONE 2b-C: PR #264 merged; main fe209ab and Actions 37608238589 green. Owner requested continuation.
4. NOW S3: follow CURRENT above. Stage-3 internal card alignment and full per-card evidence are not complete.

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
