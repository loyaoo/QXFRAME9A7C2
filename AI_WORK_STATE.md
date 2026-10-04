# QXFRAME9A7C2 AI Work State

> Persistent recovery checkpoint. Read `AGENTS.md` first.
> Git / PR / CI facts override stale text here. Always query the current branch, PR and Actions before continuing.
> Keep CURRENT concise. Historical investigation belongs in Git history and task change documents.

## Repository checkpoint

- Last checkpoint date: 2026-10-04
- Repository: `loyaoo/QXFRAME9A7C2`
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md` (historical filename; body defines 9 Runtime Controllers + pure CSS Theme/Token authority).
- Theme authority: `QXFRAME9A7C2-Theme-Visual-System-v1.5.md` plus its 2026-10-04 single-system implementation decision.
- Theme change evidence: `QXFRAME9A7C2-Theme-Visual-V2-001-Changes.md`.
- Runtime Controller migration: accepted 40/40 public components; do not restart it.
- Current Phase: THEME-VISUAL-V2-001 — single public Theme canonicalization and current source-backed migration are implemented; broad G/H visual acceptance and final release closeout remain.
- Current Task: `THEME-VISUAL-V2-001` — IMPLEMENTING, approximately 70% of v1.5 A–H scope after PR #258 implementation closeout.

## CURRENT

Task: THEME-VISUAL-V2-001 — Theme input → shared rules → Component.
Status: IMPLEMENTING. PR #258 implementation is ready for final documentation-head CI; query GitHub for the actual head/run state instead of reusing IDs below.

### Current architecture truth

- There is exactly one public CSS Theme system. Old `.qxframe9a7c2-play-settings`, old Theme Studio/generator, Schema1 Theme contract, old theme/default/family public chain and the `data-qxframe9a7c2-visual="2"` opt-in marker are retired and reverse-gated.
- Theme is pure CSS runtime authority. Do not introduce ThemeController, TokenController, ThemeRuntime, TokenRuntime or JS-generated runtime Theme state.
- Studio v2 is the sole generator/editor surface. User-facing configuration labels are Chinese; internal enum/JSON keys may remain English.
- Color authority is source-locked to shadcn SHA `295a1f114a138f23b5dfee0e0c6812394dfeb90c`: 30 complete semantic colors plus sparse physical Type inputs. Do not recreate palette/state/component result matrices or invent pressed intensity.
- Physical Type axis is implemented for the existing 14 Types plus foregrounds; gray→grey compatibility is handled without restoring an independent old gray palette chain.
- Geometry authority is `qx-md-2`: 21 md inputs only; xs/sm/md/lg/xl are fixed CSS derivations. Control min-block changes by 4px per size step. Multiple/multiline controls may grow intrinsically; do not force all five sizes or single/multiple forms to equal height.
- Non-color authority is `qx-style-3`: typography density, text style, body/heading/mono font, Control Appearance, border, shadow, motion pace, surface and Shape families. Style supplies defaults; explicit user selections must win.
- Control Appearance shared values: outline / tinted / tinted-subtle / soft / underline. Focus/invalid/warning topology is shared; Sera underline keeps focus on the bottom edge only.
- Body font is an inherited Theme-boundary projection, not a Button-local font override.
- Popup/Popover/Dropdown/Menu submenu remain shared Overlay/Popup/Scroll consumers. Do not recreate picker/menu-local popup or scroll implementations.
- Existing keyboard-vs-pointer focus-origin rules remain frozen: keyboard visual focus uses the shared outline contract; pointer focus does not manufacture keyboard outline.

### PR #258 implemented scope — do not redo

- Destructive single-public-Theme cutover and legacy Theme/generator retirement.
- Physical Type editing, sparse delete/restore, JSON import/export and CSS export.
- Shared color consumer migration including remaining native/control/notice/media/badge/carousel/popup paint roles reached by the current real-DOM probe.
- `qx-md-2` 21-input geometry and fixed five-size derivation.
- `qx-style-3` typography/text/font/Control Appearance/border/shadow/motion/surface/Shape work currently source-supported.
- Theme boundary rebinding for inherited body font and shared shape/state consumers.
- Studio computed-style verification, including bounded transition settlement rather than same-tick reads.
- Legacy browser geometry smoke migration from retired family-control tokens to strict current qx-md-2 expectations. No failed-check whitelist remains.

### Latest verified implementation evidence before this checkpoint commit

Implementation head: `c34aa95c95c8cba0dc1f997771618a5c7c50d028`.

- CSS Schema Acceptance #277 / run `37190097101`: SUCCESS.
- QXFRAME CI #1523 / run `37190097110`: SUCCESS; release and Windows both passed, including npm pack and standalone dist/docs artifacts.
- Canonical real-DOM consumer poison: 16 configurations, 660,143 paint checks, 739 covered classes, 2,158 unmounted classes, 3,206 poisoned inputs, mismatchCount 0.
- Source/color browser: 5,456 cases / 15,714 checks, zero failures.
- Physical Type browser shards: 4,032 cases / 11,012 checks, zero failures.
- Geometry: 576 configurations × five sizes / 51,855 checks, zero failures; `1e-6 CSS px` tolerance, existing 1px border exception only.
- Studio: 73 actual browser UI checks, zero failures.
- Color rendering tolerance remains exact: 0 RGBA byte difference on transparent canvas and after real mode-surface composition.

This checkpoint/change-doc commit is documentation-only and therefore creates a newer PR head. Required Schema + QXFRAME CI must pass again on that newer head before merge. PR Pages deploy is expected to be skipped; actual Pages must be verified after merge to main.

## NEXT EXACT STEPS

1. Query PR #258 current head and both required workflows after this documentation checkpoint.
2. If either gate fails, fix the exact failure without weakening color/geometry/browser tolerances or adding accepted-failure lists.
3. When final PR head has Schema + QXFRAME CI green, merge PR #258.
4. Verify merged `main`: QXFRAME release, Windows and `deploy-pages` all SUCCESS. Record/report actual merge commit and main run; do not create a documentation-only follow-up merely to cache volatile run IDs.
5. Continue THEME-VISUAL-V2-001 from the remaining G/H scope only:
   - broad all-component + narrow-container visual acceptance;
   - physical external Popup/portal cases and native inputs;
   - chart/halo and remaining source-backed non-color consumer cases;
   - additional browser/manual visual confirmation;
   - final retired private-paint cleanup;
   - final framework + Theme byte/gzip totals and H release closeout.

## DO NOT REDO

- Do not restore or re-audit the old Schema1 Theme/generator/public token chain.
- Do not reintroduce `data-qxframe9a7c2-visual="2"` as a Theme switch.
- Do not recreate five-size public Theme tables; qx-md-2 owns geometry.
- Do not redo physical Type foundation, 30-color authority, qx-style-3 foundation or sole Studio-v2 setup.
- Do not make historical smoke pass by restoring `--qxframe9a7c2-family-control-height` / `--qxframe9a7c2-family-control-font-size`.
- Do not redo the 9-controller migration, FocusOrigin unification, Popup/Scroll unification, Picker draft/value unification, CSS Grid/viewport cleanup or SCSS modularization unless a new reproducible regression directly contradicts their accepted gates.
- Do not treat unmounted classes from the real-DOM poison inventory as proof of G completion; they are explicit remaining coverage inventory.

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

On a new conversation: read `AGENTS.md` → this file → `QXFRAME9A7C2-Theme-Visual-System-v1.5.md` → `QXFRAME9A7C2-Theme-Visual-V2-001-Changes.md`, then query current GitHub PR/CI. Continue from NEXT EXACT STEPS. Do not start a repository-wide audit from zero.
