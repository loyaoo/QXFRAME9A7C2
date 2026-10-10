# Visibly distinct shared Control/InputGroup hover border

## CURRENT — 2026-10-10 visually effective default hover role
- Existing Theme default `field-border` and `input` values are identical in light and dark. Earlier field `:hover` mapping to `--theme-input` produced no visible change! Corrected shared V2 field hover to 70% field-border + 30% Theme ring, using existing Theme tokens, and added same hover border to connected addon InputGroup. Focus always takes precedence; disabled/error/warning don't inherit hover ring.
- No new hover Theme tokens and no per-Card styling. Static gate now asserts real color-mix expression, not mere presence of `theme-input`. Official two green CI on the new SHA still required, exact baseline source locked tests untouched.


# True standalone Input focus shadow probe

## CURRENT — 2026-10-10 actual standalone native Input test probe correction
- CSS Schema `38025604755` browser gate showed connected InputGroup pointer shadow **red 3px**, keyboard shadow **green 3px**, and inner Input **none** (correct). It falsely claimed standalone native Input had no shadow because test used Social Links input nested inside an InputGroup, where removing its shadow is explicitly required.
- Browser acceptance now appends a temporary standalone `<input class=qxframe9a7c2-form-input>` outside any Group, samples keyboard and pointer shadow and removes it. This preserves strict duplicate-shadow prevention and adds true standalone coverage. Production CSS remains unchanged in this correction; exact new SHA CI must be green.

# New focus test initialization order

## CURRENT — 2026-10-10 static test initialization order correction
- QXFRAME run `38025429041` passed pinned source preview geometry and Windows tools; Release static test failed before behavior checks: new focus Theme assertion referenced `model` before dynamic module initialization.
- Move complete test block after existing dynamic model/data imports; no loosening assertions or production CSS. New exact-HEAD CI required. PR #265 Draft.


# Acceptance highlights precision

## CURRENT — 2026-10-10 acceptance yellow ledger precision
- Corrected current yellow regions to actual **InputGroup Savings Targets**, **native Input Social Links** and **CardFooter Button Social Links** (2 Cards, 3 selector categories). A preliminary ledger had a FAQ Tabs diagnostic line even though this batch modifies no Tabs code; removed that false highlight before the official ZIP.
- No CSS behavior changes in this commit. Prior source-locked CI remains required, PR Draft. No previous-round yellow survives.


# 2026-10-10 pointer/keyboard ring actual browser regression gate

## CURRENT — 2026-10-10 browser focus halo ownership regression gate (CI pending)
- Added Chromium browser checks that force distinct visible 3px pointer red and keyboard green box-shadows to verify computed focus ownership on actual composed InputGroup vs standalone native Input; child Input must not draw a duplicate halo. Preserves existing pointer-vs-keyboard outline width tests. Added static test proving `focusColor=theme` sets `focus` AND `ring` to primary and baseline default shadow slots remain none.
- This gate is diagnostic/acceptance only, no new Create Card changes; offline highlighted regions unchanged. PR Draft and all strict source gates retained.


# 2026-10-10 shared interactive state and focus halo/color batch

## CURRENT — 2026-10-10 Focus halo/color & interactive state consistency batch — CI pending
- Baseline verified 458cf9aa QXFRAME 38023498729 and CSS Schema 38023498714 SUCCESS, PR #265 Draft. Owner reported missing hover/active visual state, no real focus shadows, no consistent Theme-colored focus border.
- Source audit: Button already has hover/active and state classes; native Form fields have hover, JS Input only is-hovered. Existing focusColor toggle (mono/theme) only recolored `focus` while components' border used unrelated `ring`. Corrected `focusColor=theme` to link both `focus` and `ring` to primary. Added only two Theme presentation slots `focus-shadow` and `pointer-shadow` (none in baseline). Each ring preset yields real box-shadow, with default QX focus unchanged. Native/JS Input, InputGroup and Button consume the shared roles; group owns shadow, child doesn't; Button retains base elevation. Added native hover for JS Input and V2 field family border hover mapping; no spurious pressed editing state and no core JS change.
- Strict source gates preserved. Current offline ledger cleared prior yellow and marks only Savings Targets grouped Input, FAQ interactive Tab rail, and Social Links native Input. Both CI workflows + offline artifact need verification; no progress credit yet. Baseline total ~70%, S3 ~91%.


# FocusOrigin no-bare-focus-within outline correction

## CURRENT — 2026-10-10 FocusOrigin verifier correction
- QXFRAME `38023345059` Release rejected any `:focus-within` block that draws `outline`, even under non-keyboard html origin. Correctly enforced shared runtime FocusOrigin contract; NOT disabled.
- InputGroup pointer rule now projects from actual `FormInput:focus-visible` / `Input:focus-visible` through parent `:has()`, with pointer origin class filter, rather than :focus-within. Browser test against official earlier offline base confirmed theme Pointer **3px width/2px offset** and keyboard **2px/-1px** simultaneously. The old Group `:focus-within` border color, which draws NO outline, is preserved.
- Keep same visual acceptance and 4px segmented rail; repeat both CI workflows after commit. No core JS modifications.


# Strict FAQ Tabs source slot assertion modernization

## CURRENT — 2026-10-10 FAQ rail static source assertion updated after real geometry proof
- Official QXFRAME run `38023226924` Release failed only on stale static assertion requiring old `--tabs-height:calc(... - .375rem)`; the component now uses `- .5rem` because 4px+4px vertical rail padding has been restored. Local Chromium demonstrated FAQ Card remains 355px, with Scroll rail 32px, Viewport padding-block 4px each and TabItem 24px fully visible. Strict source-locked Card and TabItem browser gates remain; update static assertion to match the new correct public Tabs slot mapping, do not remove the gate.
- Await the separate same-browser source geometry job result; rerun both workflows at new HEAD. PR Draft.


# Browser-confirmed InputGroup mouse focus selector ownership

## CURRENT — 2026-10-10 real-browser pointer focus cascade fix
- Ran local Chromium against the previous official offline demo with the prospective pointer CSS. Pointer-focus `--theme-pointer-width:3px` and `offset:2px` **failed** when rule was expressed as `html:not(.keyboard)...` inside `@scope (:root)` (computed 2px/-1px keyboard outline); independent Chromium check showed the same selector outside scope correctly yielded **3px/2px** and keyboard remained 2px.
- Moved InputGroup mouse Theme rule to the shared `src/styles/components/composition.css` cascade with `html:not(.qxframe9a7c2-keyboard-focus-origin)` selector. Keep Theme consumption, keyboard 2px, inner input none. Removed ineffective duplicate scoped rule, updated regression guard.
- Current candidate still requires full two-green CI, then matching official Windows offline pack. No merge/branch pollution.


# Owner follow-up: pointer InputGroup focus, segmented rail padding, native SVG chevron

## CURRENT — 2026-10-10 SVG arrow CSS image mode correction
- Before accepting CI, local Chromium checked `CSS.supports('background-image','light-dark(url(...),url(...))') === false`. Fixed source syntax by using a theme-boundary `.dark` CSS override for the SVG URI and retaining one `--qxframe9a7c2-form-select-arrow-image` public override. Native Select must compute a genuine SVG URL, not `none`. Static regression enforces this; browser acceptance will check computed image.
- The other follow-up repairs (group mouse Theme pointer tokens, Tabs rail vertical 4px inset with fixed height budget) remain. Prior commit was provisional, no success or offline ZIP yet.


## CURRENT — 2026-10-10 owner follow-up three concrete regressions (CI pending)
- Latest baseline `b185660e93260dc2acc424b4b18edfa05e50bb08` passed QXFRAME `38021362739` and CSS Schema `38021362707`; PR #265 remains Draft.
- Fixed at framework level: connected InputGroup / InputGroupField pointer focus now reuses same Theme pointer width/opacity/offset as standalone Input; no second child outline, existing keyboard 2px owner unchanged. Segmented Tabs 4px top/bottom viewport padding restored, Scroll rail owns 8px extra vertical budget; source Create tab height mapping adjusted to 24px trigger + 8px rail = 32px and segmented Panel removes duplicate 6px spacer to keep source Card height; cross-checked locally in real Chromium. Native Select gradient triangles replaced by a round-stroke SVG chevron, light/dark URI with overridable image slot.
- Static and browser regression tests expanded; offline yellow ledger reset to only Savings Targets InputGroup/Select and FAQ viewport (two Cards, three marked region types). Previous Sidebar, CheckField yellow removed. Preserve all strict source-locked checks, no JS runtime changes, no source gate relaxation.
- Stage 3 ~91%, total ~70% previous owner estimates pending owner review. New CI/pack needed; no merge, no main/backup edit.


# Stage3 MD Button shared source style step correction

## CURRENT — 2026-10-10 MD Button style-size step final source candidate
- Source run `38021088496` now passed all prior Card/Item/Field checks through the 304 first-Button parity section. Remaining failure: only Maia, Luma, Rhea first MD Button width was -4px across 5 Cards × 2 modes; exactly one size-step (2px per side) missing after introducing explicit MD family Theme padding. Style MD Button mapping now adds .125rem to generic Control padding in these three source styles; Sera keeps .625rem editorial offset; all density levels still monotonic for every property and all generic inputs.
- Keep strict 304 first-Button width/height/font/colors gate. Any new failures must be fixed, not suppressed; no current success claim. PR Draft, main/backup untouched.


# Stage3 editorial Button family regression correction

## CURRENT — 2026-10-10 density/MD Button source regression and style mapping candidate
- In QXFRAME `38020871123`, the fixed Tabs rail advanced the source gate beyond Lyra FAQ. Strict Sera Social Links then detected unequal source Footer Buttons **134.813px/168.047px** had become QX **151.422px/151.422px**. Cause: correcting incorrect control loose40 horizontal padding from 1.5rem to .875rem also changed Sera-specific md Button min-content clamp.
- Correct architectural owner: new registered `button-md-padding-inline` Theme family slot. Sera md button retains its editorial +.625rem inset (original 1.5rem at loose40), generic controls follow monotone 28/32/36/40/44 density. No card-specific CSS or JS edits. Retain actual min-content source geometry strict gate. Static Sidebar hover selector migrated to distinct muted :hover:not(.is-active), not waived.
- Complete prior multi-component batch still awaiting official two-green CI; user progress unchanged until validated. PR #265 Draft, protected branches untouched.


# User-reported multi-component consistency batch (2026-10-10)

## CURRENT — 2026-10-10 Tabs rail strict source correction
- Official failed same-browser artifact `11657787259`: Lyra FAQ source Card 343px vs QX 475.75px when Scroll root/viewport were set to auto. Intrinsic Scroll sizing introduced a severe feedback/height-growth regression in the segmented rail. Preserved source-locked strict Card comparison and reverted root sizing to shared Theme tabs height.
- Root-cause correction: horizontal segmented Scroll viewport formerly used `padding:0.25rem`, consuming 8px of the exact TabItem height and cropping the tab. The shared rule now keeps inline rail chrome while setting vertical padding to zero; viewport and tab use same block-height budget. No per-Card CSS, no test waiver. Pending same-browser rerun plus browser no-clip geometry assertion.
- All other multi-component fixes remain part of the same batch. PR #265 Draft.


## CURRENT — 2026-10-10 S3 user feedback multi-component batch (CI pending)
- Baseline green HEAD `15c7f5a3`, QXFRAME `38019740808` and CSS Schema `38019740821` SUCCESS; PR #265 Draft.
- Shared CSS and compiler changes: density 28/32/36/40/44 inline-padding monotonic; Tabs horizontal intrinsic viewport height; placement-aware popup from attached edge scaleY/scaleX (no point-scale); Sidebar muted hover distinct from active accent; connected InputGroup additive padding seam halves and wrapper-owned focus-visible (not child's outline); native Select browser-stable drawn chevron; nesting contract documented without claiming seamless nested-group support.
- New static and Chromium tests added; previous 528 source/Card, 2128 Field/Item, 384 Badge, 448 small Button, 304 first-Button, 4224 Title/Description and FAQ paint gates stay enabled. CI must verify visual regressions, especially editorial Sera affected by density source. If source-lock contradicts corrected monotonic density, adjudicate with real evidence; do not silently weaken source gates.
- Current offline ledger is RESET to only four affected inner regions (Buy Investment input-group and Select, Sidebar menu, FAQ Tabs). No old yellow. New official 2-green artifact required.
- Stage3 ~91%, total CREATEAPP-V3 ~70% prior to user acceptance; this batch is not credited until CI plus owner's review. No core JS edits, no PR merge, no main/backup edits.


# CheckField test-selector migration while retaining source strictness

## CURRENT — 2026-10-10 CheckField source audit selector updated (rerun required)

- Candidate `01e03012` QXFRAME source-preview-geometry `38019524639` failed in its *legacy expected class selector*, not a measured size deviation: audit expected exact `qxframe9a7c2-check-field is-center`, but new intended default-centered HTML correctly omits the redundant modifier. Audit now matches exact `qxframe9a7c2-check-field` and retains strict source row 16px + QX row 0.5px delta + whole Card height 0.5px delta checks. No gate relaxation. CI must rerun on the new tree.
- Original baseline Stage3 91%/overall 70%; CheckField candidate not credited until green. PR #265 Draft; main and backup untouched.


# Stage3 CheckField alignment policy - new owner feedback item 1 (CI pending)

## CURRENT — 2026-10-10 CheckField CSS state precedence and stale highlight gate (new CI pending)

- After `df181ac3`, QXFRAME release in `38019622374` failed solely on a historical no-old-annotation assertion that still forbade `notification-settings` in the *current* QA ledger. This card is intentionally part of the new batch, so rotate the old batch prohibition to former `release-catalog` instead; retain the other old checks and exact active-selector assertions.
- `.check-field.is-choice` previously re-declared `align-items:center` after the new three-state selectors, which would defeat explicit `is-start/is-end` on framed radio choices. Remove this redundant default so `is-choice` inherits centered base and obeys all three modifiers. All default source framing geometry must remain identical; strict CI guards not weakened.
- Waiting QXFRAME and CSS Schema new same-tree green before exporting local annotated acceptance ZIP. Stage3 last confirmed ~91%, total ~70%; PR Draft, main/backup unchanged.


## CURRENT — 2026-10-10 CheckField three-state cross-axis contract (CI pending)

- Latest verified baseline `322de1c1` PR #265 Draft; QXFRAME `38016670565` and CSS Schema `38016670548` both SUCCESS. This independent feedback batch addresses user item 1: the CheckField should not rely on a per-Card `.is-center` and a 2px margin patch.
- Shared `src/styles/components/composition.css` CheckField now defaults to center alignment for both row and native checkbox/radio input (including its pseudo indicator), with opt-in `is-start/is-center/is-end` three-way cross-axis states controlling both `align-items` and child `align-self`. Removed old margin-top hacks. All five Notification Settings rows use implicit default center. Choice radio composition remains centered.
- Added static source contract plus live Chromium computed geometry for default/start/center/end input positions (3 alignments + no margin offsets); no core JS edit. QA overlay ledger RESET to Notification Settings CheckField/indicators only; prior FAQ/New Milestone marks discarded. Existing locked Stage3 tests must remain unchanged.
- Remaining user findings to handle next, each on evidence: InputGroup addon+input padding/focus ownership, menu/dropdown reveal animation, loose40 padding monotonicity, Tabs Scroll height clipping, sidebar hover/active semantics, cross-browser native select arrow, InputGroup-vs-Control and nested-composition contract. Do not claim these fixed in this checkpoint.
- Progress remains latest validated Stage3 ~91%, overall CREATEAPP-V3 ~70%; new head cannot be credited before double-green and manual acceptance. Never merge PR #265 or touch main/backup.


# Stage 3 2026-10-10 second candidate: 4,224 inner text strict PASS, FAQ border fix

- QXFRAME run 38016429187 source-preview passed all 4,224 Title/Description assertions; only active FAQ Tab border in dark Luma/Rhea differed. The exact locked source uses transparent for Luma/Rhea, `input` for other six. Reusing existing `--qxframe9a7c2-theme-choice-border` aligns this without adding a source-special Token. Other channel checks retained. Static QA marker count updated from stale one to the active two-region ledger. New double-green CI required; no ZIP before then. Progress 69% total / 85% Stage pending completed CI and owner acceptance, PR Draft.

# Stage 3 FAQ segmented Tabs paint and text-role hard-gate candidate (2026-10-10)

- Green baseline: `86f124cd`, QXFRAME `38014041835` SUCCESS, CSS Schema `38014041832` SUCCESS. Candidate pending official workflow validation.
- Source: pinned shadcn `295a1f114a138f23b5dfee0e0c6812394dfeb90c`, upstream `apps/v4/registry/new-york-v4/ui/tabs.tsx` sets dark active `bg-input/30 border-input` and light active `bg-background`. QX shared segmented Tabs previously used surface in dark, clearly mispainting FAQ General. Shared Tabs CSS now consumes Theme input/background with a stable transparent border-box.
- All 528 source/QX samples now also audit matched Title / Description / active Tab text and paint in the same Chromium, and require exact corresponding source typography and FAQ Tab paint. Existing 528 Card, 2,128 Item/Field, 384 Badge, 448 small Button and 304 first Button tests preserved. Actual new hard-gate counts/results require CI evidence.
- Current-round offline QA ledger: FAQ segmented active Tab and New Milestone source punctuation (two exact regions); previous Social Links and older markers cleared. No new ZIP until double green on the same tree. Overall progress ~69%, Stage3 ~85% until trustworthy test results and owner acceptance; main/backup untouched, PR #265 Draft.

# Stage 3 source Button nowrap root cause

## CURRENT — 2026-10-10 Sera Social Links source literal Button nowrap root-cause (CI pending)

- Source-pinned same-Chromium log for HEAD `c63846a2` identified **actual** remaining discrepancy: source `whiteSpace:nowrap` on both Sera footer Buttons, QX `whiteSpace:normal`. Both already have identical 12px/600/1.2px, 24px horizontal padding, `flex:1 1 0%`, `min-width:auto`, border widths, 8px gap. Because QX text wrapped at its min-content threshold it distributed the 302.8px total equally (151.422px each) instead of source's natural min-content widths (134.813px / 168.047px). The correct shared opt-in rule now adds `white-space:nowrap`; no new forced widths, no style-specific override, no QX runtime JS edit. This is a genuine component flex/typography contract fix.
- Extended strict source-pinned peer gate to compare `whiteSpace` and `textRangeWidth` for BOTH actions in Sera light/dark as well as prior x/width/font/flex/min-width assertions; static CSS regression also added. Existing 528 first Cards, 2,128 Item/Field, 384 Badge, 448 small Button and 304 first-Button source-gates retained (not weakened).
- Prior HEAD `c63846a2`: CSS Schema SUCCESS `38012937231`, QXFRAME CI FAILED `38012937269` on exact peer widths only. New candidate requires two successful workflow runs on same tree and official Actions dist+docs artifact before Windows ZIP.
- Active yellow offline QA ledger continues to include **only Social Links footer (2 Buttons)**. Progress stays Stage3 **~85%**, full CREATEAPP-V3 **~69%** until broad remaining pixel comparisons and owner Windows signoff. PR #265 remains Draft, main/backup untouched.

# Stage 3 min-content Button peers source-proof

## CURRENT — 2026-10-10 Stage3 Sera true min-content Flex parity source-confirmed (new CI pending)

- Same Chromium probe `[stage3-social-peer-deep]` from failed candidate `d772f00a` resolved source actual: Sera Social Links buttons `flex:1 1 0%`, **`min-width:auto`**. Both have identical 12px/600/1.2px tracking, 24px horizontal padding, Footer gap 8px, left/right inset 32px. Browser's min-content width constraint gives **Discard 134.813px, Save Changes 168.047px**, rather than forced equal widths.
- QX earlier `flex:1 1 auto;min-width:0` gave 126.781px/176.063px; QX `flex:1 1 0;min-width:0` gave 151.42px equally. Correct **component-level opt-in**: `CardFooter.is-source-peer-actions>.button{min-width:auto;flex:var(--theme-card-footer-peer-flex)}`, with **editorial Theme token `1 1 0%`** and other Theme styles `0 1 auto`. This faithfully restores browser min-content constraint without modifying framework-wide default min-width:0.
- Source same-browser regression now strictly compares **BOTH Discard and Save Changes** in Sera light/dark, each x/width/fontSize/fontWeight/letterSpacing/flex/minWidth; previous 304 source-paired first Buttons × 16 themes, 528 Card, 2,128 Item+Field, 384 Badge, 448 small Button gates all retained without weakening. New CI must return QXFRAME and CSS Schema double-green on matching tree.
- Offline changed-card ledger remains ONLY Social Links 1 grouped region / 2 Button nodes, old yellow removed. Progress estimate remains CREATEAPP-V3 total ~69%, Stage3 ~85% pending whole-pixel and Windows owner acceptance; PR #265 Draft, main + backup frozen. No QA ZIP from failed candidates.

# Stage3 true intrinsic peer Flex correction

## CURRENT — 2026-10-10 Stage3 Sera Social Links peer action exact flex basis (CI pending)

- Strong 304-paired-button lock exposed Sera Social Links Discard source width **134.81px**, old QX **118.77px** (both light/dark). First opt-in peer rule `flex:1 1 0` overshot to **151.42px**, confirming the source is NOT equal-width; upstream Sera `style-sera:flex-1` retains an intrinsic base in the source's computed layout. Correct single Theme token now emits **`flex:1 1 auto` for editorial Sera**, `0 1 auto` otherwise. This lets both actions gain an equal share of remaining row space without erasing different text intrinsic widths.
- Prior candidate `77912bb8` same-Chromium pinned geometry gate FAILED exactly on those two values; no gate weakened, dimensions unchanged. Next HEAD must yield **304 Button source-paired visual-role passes**, plus existing 528 outer, 2,128 Item/Field, 384 Badge, 448 small Button gates and full CSS Schema. No production JS changes.
- Offline QA active ONLY Social Links, one grouped inner footer region covering two Buttons; previous yellow cleared. Do not ship from failed build. Progress kept CREATEAPP-V3 total ~69%, Stage3 ~85% pending remaining full-pixel/manual owner acceptance.

# Stage 3 source-matched first Button peer fix

## CURRENT — 2026-10-10 Stage3 full first-Button RGBA gate finds Sera peer sizing bug (CI pending)

- A new source/QX **19 matched Card Groups × 8 Styles × light/dark = 304 first Button** gate compares exact source equivalent Button geometry/font and normalized sRGB colors. Neutral dark differences from prior diagnostic were transition sampling artefacts; override both renderers `animation:none!important;transition:none!important`. Upcoming Payments source first Button is Calendar day and QX first Button is nav, so explicitly not a matched pair.
- Source gate revealed ONE real discrepancy across 304 pairs: **Sera Social Links Discard Button width 118.77px vs source 134.81px** (both light/dark). The source Sera footer sets both actions `flex:1`, other styles natural width. Added reusable QX `CardFooter.is-source-peer-actions` opt-in; new **single Theme token** `--qxframe9a7c2-theme-card-footer-peer-flex` outputs `1 1 0` for editorial Sera, `0 1 auto` otherwise. Source Preview Social Links consumes static CardFooter class. No private PV CSS/style selector, no qxframe runtime JS edit; default `:root` and `.dark` token synchronized, static schema gated.
- Current offline QA ledger REPLACED with **only Social Links / 1 grouped footer / 2 actual Buttons**, all older yellow highlights cleared. Test source/Chromium gates retained; candidate requires BOTH full QXFRAME and CSS Schema GREEN and official Actions dist+docs before Windows QA. Stage3 ~85% and overall ~69% unchanged until confirmed actual visual acceptance; PR #265 Draft; main/backup frozen.

# Stage 3 latest source-locked first-Button gate

## CURRENT — 2026-10-10 Stage3: semantic-matched 19-Card Button paint/type parity (CI PENDING)

- Latest green base commit `5f7f70ab`, full QXFRAME CI `38009549018` and CSS Schema `38009549022` SUCCESS. PR #265 remains Draft, main/backup untouched. Existing 528 first-Card + 2,128 Item/Field + 384 Badge + 448 small Button gates all retained.
- Source/QX nested role audit revealed a timing artifact: `transition:none` without `!important` loses against framework Button transitions. Dark computed color samples captured intermediate oklab mixtures, mistakenly suggesting that every dark Button is miscolored. Source and QX audited with **`animation:none!important;transition:none!important`** in both renderers; no production CSS altered.
- Added same-Chromium **19 semantically matched first-Button Card groups × 16 styles/modes = 304 source/QX paired Buttons**, strict width/height/fontSize/fontWeight plus 2 normalized sRGB paint channels (4-channel RGBA for each). Explicitly exclude Upcoming Payments **because pinned source's first Button is calendar day 27 and QX first Button is calendar nav**: non-equivalent DOM roles, not an exception to an observed failure. Complete paint and geometry gate must pass; no visual acceptance from unverified alpha colors.
- No visual-asset or DOM production change in this checkpoint. Current offline QA 7 Card / 8 region ledger from previous actually fixed small Button batch retained until a new visual batch; no ZIP issued solely for audit. Stage3 ~85%, total ~69% unchanged until actual new visual corrections/manual pass. New candidate CI pending.

# Stage 3 small text/icon role correction

## CURRENT — 2026-10-10 V2 separate small text/icon font roles (candidate CI PENDING)

- Source-paired Chromium 448-property Button gate proved after V2 cascade fix that all styles matched **except Nova icon-sm**: source Header icon buttons use **14px**, but Nova `size=sm` text Buttons use **12.8px**. Distinct roles now: `.button.is-sm` consumes `theme-button-sm-font-size`, whereas `.button.is-sm.is-square/.is-icon-only` consumes `theme-control-font-size` (Nova 14px). This is shared QX component mapping, not Preview CSS, no additional Theme token.
- Relocated both rules **AFTER** generic single-line min-height geometry block, preserving existing static Textarea vs single-line structural contract. Prior candidate Release failure was caused solely by new CSS block interrupting that static group order. No gate removed or tolerance changed. Real source Card 7/16/4 Button 448 checks remain hard; prior 528 first-Card/2,128 Item-Field/384 Badge still hard.
- 7 current Card / 8 inner-region offline QA highlights, no previous markers. Do not package prior failed CI. PR #265 Draft, main/backup unchanged. Pending double-green final official Actions artifact. Estimate unchanged Stage3 85%, total 69%; remaining full pixel and owner review.

# Stage 3 shared Button owner verification

## CURRENT — 2026-10-10 Stage3 small Button V2 ownership correction (CI rerun)

- First candidate `3a6a5756` source-locked strict font-size/width gate correctly failed: V2 scoped `.qxframe9a7c2-button[class]` late typography wins cascade over early `src/styles/components/button.css`; actual source-paired Vega/Nova QX small Buttons stayed 12px. Previous candidate `8e8325b0` added missing default `:root/.dark` `button-sm-font-size` token after canonical Schema rejection but was not sufficient to correct cascade.
- **Real owner fixed** in `src/styles/main/theme-visual-v2.css`: co-located `.qxframe9a7c2-button.is-sm` source-size font rule just AFTER general `font-size` V2 geometry rule. Removed overwritten earlier `button.css` rule; canonical token produced in compiler/default CSS, no Preview-specific styling. Static gate enforces exactly this single consumption ownership. New strict **448 checks / 7 Cards / all 16 style-mode pairs** remain unchanged and must pass; prior 528 geometry, 2,128 Item/Field, 384 Badge acceptance remain.
- Offline ledger active ONLY **7 Cards / 8 regions**, prior yellow labels cleared. Both QXFRAME + CSS Schema pending final HEAD, no ZIP until green; Stage3 still ~85% and total ~69% before owner inspection, PR Draft, main+backup untouched.

# Stage 3 final small Button correction

## CURRENT — 2026-10-10 Stage3 small Button Theme schema correction (CI rerun required)

- Candidate `3a6a5756` introduced source-paired font scaling and 448 strict Button geometry assertions across 7 Cards/16 theme modes. Release caught canonical **default Nova `:root` / `.dark` Theme token omission**: `--qxframe9a7c2-theme-button-sm-font-size` was generated by `docs/create/compiler.js` but not synchronized into `src/styles/main/theme.css`. Corrected both slots to **0.8rem** (12.8px), matching pinned Nova source, and added explicit source test for 2/2 declarations. No gate weakened.
- Active offline ledger remains **7 Cards / 8 source-paired small Button inner regions** only; former Badge annotations cleared. Re-run QXFRAME + CSS Schema on final same HEAD and ship ZIP only after both success. Progress remains estimated Stage3 ~85%, total ~69% (no bonus for test or schema repair); PR Draft; main/backup unchanged.

# Stage 3 latest source Button parity checkpoint

## CURRENT — 2026-10-10 Stage3 seven-card source Button type parity (NEW CI PENDING)

- Pinned shadcn same-Chromium `inner-roles.json` found actual 7-Card **small Button** deviations: 5 Header icon-sm Cards rendered QX 12px vs source 14px for Vega/Nova/Maia/Luma/Rhea; in Savings Targets and Recent Transactions the source text-sm type was 14px (Nova 12.8px) vs QX 12px, shortening intrinsic widths. Lyra/Mira/Sera intentionally remain 12px. This is not wrapper noise; exact same DOM role and fontSize differ.
- Added one closed Theme token `button-sm-font-size` consumed in shared `button.css`, derived from existing user typography axis and pinned source-style Nova exception; no per-card CSS, no JS code. Source-paired mandatory **7 Cards × 16 light/dark Style cases × 4 font/size properties = 448 strict Button checks**. Any measured >0.5px discrepancy fails CI, in addition to existing 528 outer geometry, 2,128 Item/Field and 384 Badge checks.
- Offline QA ledger replaced with current **7 Cards / 8 precise inner regions**, including all five Recent Transactions row buttons, previous Badge highlights cleared. Changes in existing `src/styles/components/button.css` and generated Theme tokens. PR #265 remains Draft, main/backup untouched. **Current progress estimate remains Stage3 ~85%, overall ~69%** until final same-HEAD two-green CI and wider visual/pixel validation; no claim of 100% without owner acceptance.
- Pending steps: run QXFRAME + CSS Schema; if computed source width drift is found, fix shared sizing without weakening or deleting the new gate; then build official Actions Windows dist+docs QA artifact and verify marker rotation. Full nested/pixel manual acceptance still open.

# Stage 3 latest nested/Badge checkpoint

## CURRENT — 2026-10-10 Stage3 ≥15-point acceptance scope — nested universal primitives + semantic Badge paints (FINAL CI PENDING)

- Locked shadcn reference `295a1f114a138f23b5dfee0e0c6812394dfeb90c`. Expanded **same-Chromium** 33 example Cards × 8 styles × light/dark = **528 source/QX Card pairs, 1,856 shared nested-role samples** in one renderer/process; 0 missing cards. Retains strict 528 first-Card geometry and height gates; wrapper difference diagnostics are explicitly NOT counted as visual failures (source uses root padding; QX distributes padding into Header/Content/Footer). Full pixel acceptance still outstanding.
- Hard new nested gate: **176 Item + 128 Field = 304 precise equivalent instances × 7 source-locked properties (x, y, width, height, fontSize, fontWeight, radius) = 2,128 pixel/typography assertions across 16 styles/modes**, a major expansion from first-Card-only checks. Current baseline source paired sample showed zero deviations among those equivalent roles. Any new >0.5px divergence fails. On top: **4 distinct Badge Card groups × 16 styles/modes × 4 geometry + 2 normalized sRGB paint channels = 384 more hard checks** (Claimable Balance, Front Door, Release Catalog, Upcoming Payments).
- Source Badge mappings: Claimable + Release use `outline`, Front Door `destructive`, Upcoming `secondary`; 1+1+4+3 = **9 actually changed Badge instances across four Cards**. Badge `is-status-label` existing framework size/editorial policy is reused. Dark destructive has source 20% alpha (light 10%); Sera secondary label text uses `muted-foreground` while normal uses `secondary-foreground`; Maia/Mira Outline surfaces need source 30%/20% border tint in light and 4.5% foreground tint in dark. These four style/color combinations are compiled into **ONE new semantic theme token** `--qxframe9a7c2-theme-badge-label-outline-bg` via `docs/create/tokens.js` + `compiler.js`; no custom `data-style` selector and no per-card PV styling.
- Offline QA active ledger **4 Cards / 4 exact grouped inside regions** ONLY, 9 physical Badges. All old yellow highlights absent. No core QX JS edit, PR #265 remains Draft, main/backup unchanged. Previous candidate `d3325a5f` source-preview geometry **SUCCESS**, badge geometry 64/64 **SUCCESS**, release failed only because the old round-level static test incorrectly forbade highlighting Release Catalog again (it was actually modified); fixed in current candidate. All new code requires both QXFRAME+CSS Schema green on the same final tree and official Actions dist+docs ZIP integrity checks before release.
- Owner requests each delivered round to advance Stage ≥15 percentage points. **Target Stage 3 70% → ~85% after this source-paired 2,512-check nested/Badge matrix fully passes**, overall CREATEAPP-V3 ~65% → ~69% as estimated. These target figures are NOT yet completed/verified and must NOT be reported as actual percentages until the final hard gates pass. Remaining Stage3 manual complete pixel/artwork/interaction review and owner signoff; Stage4/5 not started.

# Stage 3 current checkpoint

## CURRENT — 2026-10-10 S3 Batch A: source Badge semantics & first comprehensive nested-role gate (new CI pending)

- The first same-Chromium pinned source/QX matrix now covers **33 Cards × 8 styles × light/dark = 528 paired render groups and 1,856 corresponding nested component roles**. Zero missing source/QX cards and prior 528 first-Card geometry gate still green. The raw matrix reported 2630 wrapper-related geometry differences and 621 raw color-string differences; these are *diagnostic*, often non-equivalent wrapper padding or color-space notation. Never claim all are visual bugs; isolate equivalent nodes/roles.
- **Concrete source deviation identified:** `front-door` badge source `variant=destructive` is translucent and keeps semantic foreground, QX previously `is-error is-solid`. `release-catalog` source four `outline` labels use 500 weight (except Sera editorial) and 10px Mira; QX four had 600/12px. `upcoming-payments` source three `secondary` labels use neutral Theme Secondary and editorial Sera dimensions; QX were filled with the wrong type. Shared theme role adapters now extend QX `Badge.is-status-label` for `is-destructive/is-outlined/is-secondary`. The exact 1 + 4 + 3 Badge DOM pieces are updated, and **64 source-paired Badge samples × 4 measured properties** (4 cards with prior passing Claimable) become a **hard source-derived CI gate**. Theme remains owner, no Preview-specific paint hacks, no JS changes.
- Active offline QA ledger reset to **only current three Cards / three grouped inner Badge selectors (8 physical badges)**: Front Door, Release Catalog, Upcoming Payments. Previous Qr Connect / Cover Art / Social Links / FAQ and older marks removed. No ZIP until final new two-green CI and enough material scope for owner >=15point batch.
- Source-paired comprehensive internal layout remains not fully accepted: non-comparable wrapping structure and chart/calendar mock measurements need careful calibration; owner Stage3 70→85 target **not yet achieved**. Stage3 ~70%, whole CREATEAPP-V3 ~65% remain accurate until the larger hard-gated batch is complete. Main & backup frozen; PR #265 stays Draft.

# Stage 3 latest checkpoint

## CURRENT — 2026-10-10 Stage3 ≥15-point batch — nested 33-card × 16-theme source measurement in progress

- Owner changed delivery policy: no more 3–5-region micro-round acceptance ZIPs; target **Stage3 70% → ≥85%**, count only confirmed scope. This work first extends existing *same Chromium, pinned shadcn source* audit from 528 outer Card checks to an **additional 528 × up to 7 nested-role samples** for Header / Content / Footer / Item / Button / Badge / Field.
- `tools/qa/preview-01-audit.mjs` writes `inner-roles.json` for all 33 cards × 8 styles × light/dark; `tools/qa/validate-preview-01-same-browser.mjs` enforces complete source/QX coverage, sufficient component sampling and emits paint/geometry **diagnostics**. It does **not** label unnormalized color strings or non-equivalent DOM wrapper differences as failures or claim full pixel parity. Follow measured output to batch fix actual shared CSS/Theme/component issues; only then expand hard acceptance scope.
- This is a diagnostic/QA infrastructure commit only: **no Preview DOM/style fix yet, so active offline yellow ledger intentionally unchanged**, and do not publish an acceptance ZIP for this checkpoint. Do not count Stage3 +15 until substantive inner-card parity is independently verified. PR #265 stays Draft; main/backup frozen; qxframe JS untouched.
- Latest verified prior release HEAD `7421a656` (QXFRAME run `37950398355` and CSS Schema `37950398391` both SUCCESS); next CI on new HEAD must be assessed as separate candidate. Progress still **Stage3 ~70%, CREATEAPP-V3 total ~65%** until new hard results.

# Stage 3 current checkpoint

## CURRENT — 2026-10-09 Stage3 source Secondary and Segmented Tabs owner correction (CI pending)

- Initial CSS patch `583dd93b` passed 528 geometry, but real browser computed-style gate exposed correct ownership: `src/styles/main/theme-visual-v2.css` is the **active Button paint bridge** and overrides legacy `button.css` private paint slots. Fix the **actual Preview authoring** rather than duplicate a dead CSS override: Qr Connect Got it, Cover Art Upload Artwork, Social Links Discard all map upstream shadcn `variant="secondary"` to framework `is-secondary is-solid`. Theme Visual V2 already handles that exact semantic pair in all light/dark styles; legacy interim `is-default.is-filled` patch removed.
- FAQ source Tabs active has Theme Foreground and inherited weight. Existing shared segmented Tabs CSS patch kept. Browser gate now suppresses transition timing while reading computed light/dark properties to avoid mid-transition false mismatches; 4 Cards / 4 exact QA regions only, prior round highlights removed. Runtime JS unchanged; 528/±0.5px/Schema uncompromised.
- Prior CI `CSS Schema #37948503530` failed *our new real Chromium source-role assertion*, not source geometry: wrong Button Color Axis used and palette animation was read before settling. Current candidate requires both QXFRAME and CSS Schema SUCCESS before Windows offline ZIP.
- Progress remains **CREATEAPP-V3 ~65%**, **Stage3 ~70%** pending pixel/nested-card and user signoff; PR #265 Draft, main+backup locked.

# Stage 3 current source-backed checkpoint

## CURRENT — 2026-10-09 S3 pinned source multi-Card Secondary/Tabs visual parity (CI pending)

- Source-pinned shadcn @ `295a1f114a138f23b5dfee0e0c6812394dfeb90c`: QrConnect `Got it`, CoverArt `Upload Artwork`, SocialLinks `Discard` each have `Button variant="secondary"`. QX Preview represents these 3 with `is-default is-filled` but its shared CSS used a too-strong semantic subtle color (Nova screenshot actual ~225 vs pinned reference ~245 in light, actual ~74 vs pinned reference ~38 in dark). Fixed shared Button color recipe with `--qxframe9a7c2-theme-secondary/secondary-foreground`, source hover alpha via color-mix; no per-card PV color hacks.
- Pinned shadcn FAQ `TabsTrigger` active is `text-foreground` with the **same inherited font weight** as inactive, while QX `is-segmented` currently inherited generic active `Primary/600`. Shared Tabs segmented active now consumes Theme Foreground and inherited weight; inactive tabs, keyboard and other Tabs variants remain unchanged.
- Batch **4 Cards / 4 precise internal visual regions** (3 secondary Buttons + FAQ selected Tab). Active offline QA ledger REPLACED: **none** of previous 4 Card / 5 Select or older yellow highlights persist. Framework JS/runtimes untouched; CSS shared components only, Theme tokens used directly. Added source-backed static checks and true Chromium light/dark computed-style parity for 3 Buttons and FAQ; 528/±0.5px and CSS Schema unchanged.
- Mandatory double-green QXFRAME/CSS Schema pending on final same-tree HEAD before official Actions dist+docs Windows ZIP. Progress estimate **Stage 3 ~70%**, total CREATEAPP-V3 **~65%**; do not mechanically advance for a CSS microcommit. PR #265 stays Draft, main+backup frozen. Stage 3 still needs full inner/nested Card pixel/semantic plus user Windows acceptance; Stage 4/5 not started.

# Stage 3 current checkpoint

## CURRENT — CREATEAPP-V3-S3 QX Select Label/Focus ownership — 2026-10-09 (new CI pending)

- Source-pinned **4 Cards / 5 QX Select labels**: Payout Threshold Preferred Currency, Preferences Default Currency, Transfer Funds From/To Account, Stock Performance Ticker. Root cause confirmed by locally executing bundled Preview in Chromium: non-searchable QX Select creates `div.qxframe9a7c2-select[tabindex="0"]`, **not an input**. Earlier guesses caused missing association / aborted Slider mounting. This Preview-only bridge connects the source-authored FieldLabel to the live QX root and calls `root.focus({preventScroll:true})`; existing FocusController continues to own `.is-focused`, selection, overlay and keyboard behavior. No framework JS/CSS changes.
- Local Chromium (in-memory HTML and official prior dist JS) successfully verified **5/5** labels focused the real root, `.is-focused` became true, no popup opened, values stayed unchanged, Kitchen Island's four Sliders remained mounted, no page exceptions. Added equivalent real GitHub Chromium test and static source/ledger contract. Previously completed **7 Cards / 15 native Input/Textarea/Select label links remain intact**. The 528-source same-browser ±0.5px/Card-height and CSS Schema gates remain unchanged.
- Offline QA ledger reset to **only 4 Cards / 5 exact Select Field regions**, not the 7 Card/15 native fields of the previous batch or any prior yellow highlight. Official Windows dist+docs ZIP must be built from the final two-green GitHub Actions artifact, with verified current SHA, CRC, local HTTP200, targets and no prior marked groups.
- Completion still needs full Stage 3 Preview01 pixel/nested-card/manual acceptance; Stage 4/5 not started. Progress estimate **CREATEAPP-V3 overall ~65%, Stage 3 ~70%**, not incremented per microcommit. PR #265 must stay Draft. Main/backup stay `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. For real final CI IDs and ZIP result, see PR #265 checkpoint.

# Stage 3 checkpoint

## CURRENT — 2026-10-09 Stage3 7-Card native label source parity (full CI pending)

- Real Chromium on prior candidate verified **all 15 native Input/Textarea/Select label click-to-focus checks passed**; the separate 5 runtime QX Select label-to-trigger cases failed and remain **NOT COMPLETED**. Discarded only that unaccepted Select adapter, which had temporarily interrupted downstream Slider mounting; existing QX Select/Slider/Tabs implementation restored unchanged.
- Native scope: 7 Cards / 15 FieldLabel-to-native-control connections. Cards: Payout Threshold (Notes), Savings Targets/Buy Investment (Amount, Order Type), Account Access (Email, Password), Transfer Funds (Amount), Receiving Method (Holder, IBAN), New Milestone (3 fields), Social Links (4 fields). Added strict 15/15 real browser associations, existing 528 same-browser ±0.5px and CSS Schema gates unchanged; no framework runtime or shared CSS edit.
- Offline active ledger reset to exactly these 7 Cards / 15 label+field rectangles. Old Kitchen/Roller/Release/Notifications and earlier yellow marks absent. Full QXFRAME+CSS Schema both must be SUCCESS on final HEAD before Windows dist+docs ZIP release.
- Stage3 estimated ~70% (not user accepted), whole CREATEAPP-V3 ~65%; Stage4/5 not started. PR #265 Draft, main+backup frozen. Next batch tackles 5 runtime Select associations separately using QX Controller-owned focus.

# Stage 3 checkpoint — Preview 01 source-backed parity

## CURRENT — 2026-10-09 CREATEAPP-V3-S3 FieldLabel visual focus batch (new CI pending)

- Source pinned `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c` uses `FieldLabel htmlFor` and an exact native Input/InputGroupInput/Textarea/SelectTrigger `id` in Payout Threshold, Preferences, Savings Targets/Buy Investment, Account Access, Transfer Funds, Receiving Method, Stock Performance, New Milestone and Social Links. Our Preview 01 authored **twenty unassociated labels**, leaving clicks unable to deliver the associated input's visual focus. This batch connects twenty labels to actual native controls and, for runtime QX Select, its actual `getInputElement()` focus input. QX Select remains the only Focus/Value/Overlay owner and `src/qxframe9a7c2.js` stays unchanged.
- Batch **9 Cards / 20 exact label+control field regions**. Active offline yellow groups are *only these 9 cards*. Previous Kitchen Island, Roller Shades, Release Catalog, Notifications and older Front Door/FAQ/etc. groups removed from current ledger; history retained in README and PR.
- New static tests require exact current ledger, twenty source field associations and Select focus ownership. New real Chromium test clicks all twenty labels and asserts `label.control === actualControl` and `document.activeElement === actualControl`. Strict 528 / ±0.5px, CSS Schema, runtime JS unchanged and pinned source gates all remain. This is real internal focus presentation parity, **not an unmeasured Card-height claim**.
- Baseline previously validated HEAD `56588ea6`, dual-green QXFRAME #37936538257/CSS Schema #37936538247; 528/528 first Card height diagnostic >0.5px = 0. Next require both suites SUCCESS on final HEAD before packaging real Actions dist/docs ZIP. Stage 3 remains open, overall project ~65%, Stage3 ~70% estimate pending user visual validation. PR #265 Draft, main and backup locked.

## 2026-10-09 — Four-card controlled visual parity (CI pending)

## VERIFIED — 2026-10-09 S3 4-Card controlled state and rotating offline QA ledger

- **Validated code HEAD:** `015523f77bfd1755d9b95dc1357c55a2cf87692e`; QXFRAME CI [#37935530883](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37935530883) **SUCCESS** (Release, Windows tools, pinned same-browser source-preview geometry all SUCCESS); CSS Schema Acceptance [#37935530939](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37935530939) **SUCCESS**. Code tree `9ffe9ccbb6363512ababd4c851e9f95dd02b900e` equals PR synthetic merge `3f253f32617af8a26159e77189491e9753c891a0` tree. Prior candidate `91fe34a7` Release FAILED because its static test still expected *previous-round* Front Door marks; `015523f7` rotated that gate correctly without weakening a geometry tolerance.
- **Completed, source-pinned Preview 01:** Kitchen Island scene/group controls now update four QX Sliders and obey master power; Roller Shades presets and shade art follow Slider value; Release Catalog single category button selection now responds (upstream still shows all four holdings); Notifications four native checkbox choices control master checked/indeterminate and vice versa. Existing framework QX Slider and Checkbox state remain canonical; no runtime qxframe.js change, no universal CSS/Theme geometry overrides.
- **Offline QA ledger:** Only Kitchen Island (scene selection + power, 2), Roller Shades (shade artwork + preset buttons, 2), Release Catalog (category selection, 1), Notifications (master+four choices, 5). **4 Cards / 10 exact regions**, not accumulated from prior batch; Front Door stripe and old Kitchen slider-rail yellow marks are removed. Packager's README text now derives from the live ledger rather than naming previous-round Cards.
- **Windows ZIP validated for that green code HEAD:** official Actions dist+docs artifact `11618462309`; generated local ZIP with 739 files / 7,708,739 bytes / SHA256 `be822913adcca2f49c41ca85699e42830dbf73c5d7dc3da5f48f0b086b26ffc0`, CRC PASS, nine local HTTP200 responses, ten selector targets matched uniquely, no old annotations, exact HEAD injected. Local Chromium overlay click/toggle verification was blocked by local browser administrative policy; treat it as **unverified**, not passed. CI Chromium source/component browser gates passed separately.
- **Remaining:** Stage 3 Preview 01 full pixel/semantic parity and Windows manual acceptance; offline yellow overlay user click/toggle review, nested Cards and Preview 02 as scheduled; Stage 4/5 not begun. The 528 strict source-pair/±0.5px gate remains unchanged; green geometry job is not equal to 100% visual parity. Overall project estimate **~65%**, no artificial per-commit increment.
- PR #265 stays Draft/open/unmerged, `main` and `backup/main-before-pr265-2026-10-08` remain frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. This documentation checkpoint must receive its **own full two-suite CI** before a new HEAD's ZIP may be published. Exact doc-HEAD run numbers belong in the next PR checkpoint.


- Live Git baseline PR #265 Draft/unmerged at `dc7e070581b8a9fe280a300d837286ce7cbea277`: QXFRAME #37931075977 **SUCCESS**, CSS Schema #37931076100 **SUCCESS**; previous `AI_WORK_STATE.md` top pending was stale. Main and backup stay `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. Overall ~65%; Stage 3 not user accepted, Stage 4/5 not started.
- New source-pinned `preview-02/cards/{kitchen-island,roller-shades,release-catalog,notification-settings}.tsx` behavioral/visual batch: shared Preview authoring for single-selection ToggleGroups, QX Slider value/disabled state and native checkbox indeterminate sync. Kitchen Scenes apply 4 pinned presets and master power disables scene buttons/Sliders; Roller Shades presets and dragging keep shade height/selected button in sync; Release Catalog only updates active category without inventing filtering; Notifications master updates all 4 choices and reflects mixed state.
- This is cross-Card Preview 01 **controlled visual state parity**, not a new shared CSS geometry recipe and **not a first-Card height improvement**. Framework qxframe.js remains frozen; QX Slider and native input remain state owners. Existing geometry 528/±0.5px, CSS Schema, same-tree dist/docs, all regressions unchanged.
- Active yellow QA ledger reset to ONLY 4 Cards / 10 exact regions: Kitchen (scene bar/power), Roller (shade/preset), Release Catalog (category bar), Notifications (master+4 choices). Prior Kitchen four rails and Front Door stripe, FAQ/Savings/Transactions/Syncing are NOT highlighted. New ZIP may be published only from final *two-green* HEAD official Actions artifact with HEAD stamp and verification.
- NEXT: GitHub atomic candidate -> both full QXFRAME/CSS Schema success -> inspect actual Chromium controlled-state step and 528 geometry -> release same-tree Windows dist/docs offline ZIP -> PR #265 checkpoint. CI is pending, not claimed successful.

 
# Stage 3 checkpoint — shared Card geometry

## 2026-10-09 — Source-paired Kitchen slider root min-width (new final CI pending)

The common Item x owner is aligned after equal flex and Theme gap recipe. New strict source gate on `e6566178` caught Maia source slider x209.42/w126.44 against QX x209.42/w128. QX standalone Slider has `min-width:8rem`, overruling the narrower computed equal-actions Item slot, although rail center and Card geometry were otherwise correct. Shared opt-in Item variant now sets child Slider min-width:0 only within `is-actions-equal` rows, preserving the standalone Slider default. No guessed slider width or preview-private override. All eight-style Chromium checks verify opt-in min-width; unchanged five-source-style ±0.5px x/width/right-edge/center gate detects geometry regressions. Offline bundle highlights ONLY current Kitchen (4 rails) and Front Door (1 stripe), not earlier batches.


## 2026-10-09 — Equal-action Item row gap derived from existing Theme recipe (CI required)

On `3bea7c7d`, new strict source-paired gate found Maia source four rails x209.42/w126.44 while QX x207.42/w128.42; the main flex invariant now works but QX Item gap was 12px versus pinned source 14px (Maia/Luma/Rhea), while Vega/Lyra already have 10px correct. The existing `theme-item-sm-reduction` axis distinguishes Vega's 4px from other 2px, and existing `theme-item-space` distinguishes compact 10px / spacious 14px. New shared opt-in `is-actions-equal` consumer computes source-aligned row gap from those roles (Vega 10, Maia/Luma/Rhea 14, Lyra 10), with public item-gap override preserved, without theme token expansion or Preview-local compensations. Existing source±0.5px tests unchanged. Only current Kitchen+FrontDoor QA badges remain.


## 2026-10-09 — Replace guessed percentage with source equal-flex Item owner

QXFRAME CI from `9aca424f` proved Kitchen rails now align per text length but Lyra source x186/w121 vs QX x184.69/w128 showed incorrect 44%-based allocation, with unchanged source right-edge gate. Examined actual pinned source subtree: **both** `cn-item-content` and `cn-item-actions` have `flex-1`; Lyra equal width 121px. Matched this *common invariant* using shared `Item.is-actions-equal` + default equal-flex ItemContent, no hardcoded percentage, special Style branch, or new Token. Four Preview01 rows opt in. Tightened new Kitchen per-rail source test x/width to 0.5px (right-edge and centers already 0.5px) for 5 source-inspected Styles. Original Card gates unchanged. QA marks only this batch's two Cards/five regions.


## 2026-10-09 — Batch CI feedback: remove Preview-only Item flex veto (new CI pending)

The new paired Kitchen slider gate correctly caught `8968b848`: QX four rails now all 132.36px (source 132.44px for Vega) but their x coordinates remained based on label lengths. The legacy `preview.css` forced `ItemContent{flex:0 0 auto}` and `ItemActions{flex:1 1 auto}`, overriding the semantic shared Item layout. Removed both preview-private overrides; the default shared ItemContent grows and shared opt-in `is-actions-proportional` reserves a uniform right action rail. Existing non-Kitchen Item default unchanged. Strict source y and right-edge tolerance, 8px transitional left/width threshold and all eight-style tests unchanged. Only Kitchen/Front Door highlighted this batch.


## 2026-10-09 — Batched Kitchen Island rail geometry and Front Door art; current-round-only QA

Pinned source's Kitchen Island four slider rails are equal width and share a common x in five inspected Styles; QX's label-length-dependent rails vary 178–232px, misplacing thumbs even though the values 90/70/30/0 are correct. Shared opt-in `Item.is-actions-proportional` gives each right action rail 44% of row interior, without changing default Item. Same-browser gate enforces common x, right edge and vertical center ±0.5px and narrowed width/inset discrepancy <=8px for five Styles; strict Card height gate retained. All eight Styles check the proportional modifier in the Create browser suite. Front Door decorative placeholder changed from broad diagonal bands to narrower lines in Preview-only CSS (no framework Theme token or shared component workaround). User-mandated offline QA marks now reset per build, this batch **Kitchen Island 4 sliders and Front Door stripes only** (2 Cards / 5 region entries); all prior yellow highlights gone. Previous fixes remain in this document and Git PR history. Double-green final CI and owner Windows QA still required.


## 2026-10-09 — Strict syncing media class authoring assertion updated (CI required)

`ec3ba7f4` Release static `verify-create-app` failed because the established exact static contract matched `is-icon"` and new legitimate shared `is-icon is-glyph-sm"` adds modifier without changing nesting. Changed the pattern to require the exact updated class text, **not** to permit arbitrary class names. Source-pinned five-style 16px glyph/center checks and eight-style real Chromium glyph checks remain strict; no weakening. CI rerun and annotated bundle pending.


## 2026-10-09 — Shared Empty glyph modifier ratchet repair (CI required)

CI run #37923344273 passed strict source-paired Syncing source geometry, but QXFRAME Release static CSS owners/size ratchet blocked new `--qxframe9a7c2-empty-icon-size` *declaration* inside the modifier (`public-component-token-declared` +1). Refactored modifier to a higher-specificity existing SVG consumption of **existing** public `--qxframe9a7c2-empty-icon-size` with `1rem` fallback, not a declaration: `.qxframe9a7c2-empty-media.is-icon.is-glyph-sm>svg` width/height. Public per-instance override remains usable; no Theme additions. Same source 16px geometry and strict browser tests retained. Full CI and local annotated Actions package pending.


## 2026-10-09 — Dynamic offline changed-region count and same-HEAD commit attribution (CI pending)

The seventh Syncing glyph region uncovered hardcoded `Preview 01 · 6 处` in offline panel. Replaced it with count derived from `groups` records; made new change's commit reference a build-time placeholder resolved to verified current final HEAD in `tools/qa/build-offline-demo.py` extracted Windows bundle only. Static verify asserts both. Avoids stale or vague annotations; production Create HTML still intentionally never loads the overlay. Additional final CI and Actions source matching bundle required.


## 2026-10-09 — Source-paired Syncing State spinner glyph vs media (CI pending)

Same Chromium pinned shadcn source measurements across Vega/Nova/Maia/Luma/Sera show source Syncing State spinner glyph exactly 16px inside shared 32px/40px media box. QX glyph was magnified by Theme Empty icon size (CSS box sizes vary by Style; rotation additionally affects screenshot bounding rectangle), despite media box/Card parity. Add generic opt-in `EmptyMedia.is-icon.is-glyph-sm` consuming existing public `--qxframe9a7c2-empty-icon-size:1rem`; use it only in Syncing State to avoid changing all other Empty variants. Strict browser source-pair compares CSS intrinsic SVG width/height, glyph center and unchanged media dimensions for 5 proven Styles. Create real Chromium checks computed size for all 8 Styles. Updated offline change ledger adds precise icon glyph region (four annotated Cards / seven inner regions), preserves clean-mode and previous source text record. No global Theme token expansion or new hardcoded Card height. CI and official Actions-based annotated Windows bundle pending; Stage3 ~66% and overall ~65% estimates.


## 2026-10-09 — Required offline visual change annotations and Syncing State source wrapping (CI pending)

The owner cannot identify recently modified cards in unmarked Windows demo packages. Persisted a concrete visual ledger in `docs/create/offline-qa-changes.mjs` with 4 Preview01 Cards/6 inner areas: FAQ (Tabs equal rail, foreground), Savings Targets (Item spacing + footer note width), Recent Transactions (five muted dates), Syncing State (original text + balance). The local-only CSS visually frames Cards and inner changed targets; clickable panel jumps to card, has explanations and commits and a one-click clean mode. No Preview02 Card was changed, so none is misrepresented. Added `tools/qa/build-offline-demo.py` to inject overlay only into **offline Actions artifact copies**; strict static verifier prevents source HTML contamination; AGENTS and checkpoint require ledger updates in future batches. Also fixed Syncing text ASCII source apostrophe and opt-in shared Empty balanced wrap, verified locally with Chromium layout probe; Create browser tests assert exact copy and computed balance in eight styles. No production JS changes, geometry tolerance changes or unverified fix labels.

New full QXFRAME and CSS Schema workflows, verified postbuild marker interactions/clean render and CRC zip still required. Est total 65%, S3 64%.

## 2026-10-09 — Native Collapse own color priority (CI gate caught)

On `8c871b8e`, the full QXFRAME same-browser Savings note geometry passed, but CSS Schema Create Chromium failed because nine FAQ answer computed colors remained muted. `.qxframe9a7c2-collapse.is-native>details>.qxframe9a7c2-collapse-content` owns a higher-specificity direct `color:var(--theme-muted-foreground)` and bypassed the newly introduced public override in general Collapse. Both Collapse and native detail paint positions now consume the same public `--qxframe9a7c2-collapse-content-color` with their **existing** default fallbacks (secondary general / muted native). User-authored FAQ foreground should now win without Preview private CSS. CI and Windows bundle pending; strict test unchanged.

## 2026-10-09 — FAQ prose foreground and Savings note intrinsic width (CI pending)

Pinned source/QX Nova screenshot comparison shows FAQ content normally painted with foreground while shared Collapse default uses secondary text. The framework Collapse content now consumes an opt-in public per-instance `--qxframe9a7c2-collapse-content-color`, retaining original secondary fallback; Preview 01 FAQ Card scopes Theme foreground to all independent panels. The Savings Targets footer note is an intrinsic centered flex child upstream; remove QX `pv-full` that stretches its text box and shifts visible alignment. Same-browser pinned source audit enforces Savings note text x, width and height for all eight styles; Create browser gate enforces all nine FAQ answers matching Card foreground. Neither gate is relaxed; no private preview CSS, fixed Card height, new Theme token, or JS runtime change. Both CI suites, matching tree and Windows offline artifact remain pending. Overall ~65%; Stage 3 ~64%.

## 2026-10-09 — CI static FAQ attribute-order repair (rerun pending)

The first combined Tabs/Table run #37916022095 passed same-browser source-preview-geometry but Release failed an existing structural pattern requiring `data-pv-tabs data-type="segmented"`. The new `data-pv-equal` had been placed in between. Moved `data-pv-equal` after `data-type`, leaving the strict verifier unchanged; next final-HEAD complete CI and same-tree Windows ZIP required.

## 2026-10-09 — Recent Transactions semantic muted Table cells (CI pending)

Pinned Nova reference dates have muted-foreground. QX Table's row-level foreground selector overrides the weaker Preview utility on the five date `td` elements, leaving an unintended dark date color. A reusable `Table td.is-muted` opt-in now consumes Theme muted foreground with an optional Table public override. Preview01's five cells use this modifier; no global row color or private Preview CSS changed. Chromium computes and compares the five date colors to the actual Theme token. Requires both CI workflows green and matching Windows local package.

## 2026-10-09 — FAQ equal-width segmented tabs (CI pending)

Pinned shadcn Nova screenshot renders General/Billing/Goals as three equal slots filling the segmented TabsList; QX's intrinsic-width tabs leave unused gray rail. Added reusable opt-in shared Tabs.is-equal horizontal flex modifier and Preview01 data-pv-equal authoring mapping; this is framework CSS rather than a Preview-only styling rule. Added real Chromium regression for equal shell widths, total list fill and existing panel switching. Needs both CI suites green before calling accepted, and matching Windows dist/docs.

## 2026-10-09 — Buy Investment sibling source-pair diagnostics (CI pending)

Savings Targets is a composed two-column region; first-Card strict parity and Sera-only sibling parity do not prove **Buy Investment** parity for other Styles. Added same-Chromium pinned source/QX measurements for both sibling widths/heights across eight Styles and light/dark, logging child geometry only when >0.5px different. This is evidence collection, not yet a fix or new pass claim. Preserve existing Sera strict checks and 528 first-card gates. Next: inspect CI per-style differences, fix shared owner, add strict test, obtain both green workflows and matching Windows dist/docs. Overall~65%, Stage3~64%.

## 2026-10-09 — DatePanel omitted from shared Theme geometry owner (CI pending)

The new Create real-Chromium regression gate caught a genuine defect: standalone `DatePanelCell` 4px radius vs QX Button 10px, despite changing its radius consumer to `--_qxframe9a7c2-action-radius`. Cause: DatePanel wasn't a registered **independent geometry owner** under `theme-visual-v2.css`, unlike Calendar/PeriodPanel/Button, so inherited old 4px family action value. Register DatePanel under existing geometry owner selector to share the same Theme radius-button, ratio and Popup radius calculations, without forking a new recipe. Remaining Select natural-padding and opaque selected Primary changes unchanged; CI and browser gate rerun mandatory.

## 2026-10-09 — User Select/DatePicker shared component consistency follow-up (CI pending)

Targeted owner defects after prior 528/528 first-Card acceptance: Select option heights too tall and content clipped; DatePicker selected hover 80% alpha and wrong shape role. Shared ItemCollection rows now consume no fixed/min item height: computed vertical padding centers one Control font-size × 1.4 line to resolved Control height, while wrapping/custom renders grow naturally. Default label/content-slot/root no longer cut off multiline; explicit user row padding remains possible; group/title minimums unchanged. Date/Calendar shell uses Popup shape; day/month uses Button Action shape; public per-component radius overrides remain higher priority. Selected day/month no longer fade to 80%-transparent Primary on hover; soft range selection retains 10/20%. Existing Create Chromium browser suite now checks option md/sm/lg line metrics and multiline growth and DatePicker/PeriodPanel selected shape/colors. CI and Windows same-HEAD dist/docs bundle pending; no main or backup updates. Stage3 other visual acceptance remains open.

## 2026-10-09 — Final Savings root cause: inherited layout custom property, not cross-style stretch (CI pending)

The `5d165318` strict Vega first Item source148px vs QX204px/Card source472px vs QX584px persisted with flex-start parent: inherited `--qxframe9a7c2-layout-gap:var(--create-gap)` overridden every nested Flex/Stack's scoped gap. Independently reproduced using offline Chromium; putting the **direct `gap:var(--create-gap)` property** on the Savings row rather than the inheriting custom variable restores Vega Item148px and Card472px even with equal sibling stretch. Sera sibling can stretch to source Card without a fixed Card height after Button.sm width correction. Switched author wrapper to generic framework `Flex.is-stretch.is-equal` and removed unnecessary `card-peer-alignment` Theme token/consumer/conditional policy. Existing strict ±0.5px node/Card thresholds unchanged. New final-HEAD two CI runs, 528 result, matching CI demo ZIP still mandatory; full visual and second-card QA remain pending.

## 2026-10-09 — Peer alignment incremental source-locked policy (pending CI)

Global Flex align-stretch caused Vega SavingsTargets first Item to reach204px vs pinned source148px because non-editorial Buy Investment sibling geometry is not yet matched. This strict failure is retained rather than altering Item/card tests. Shared Flex `is-peer-row is-equal` now consumes one closed Theme `card-peer-alignment` input: source-verified Sera editorial sibling stretch, other pinned families retain previously verified intrinsic first Card height. Existing source-locked Sera checks require New Goal Button115.922px, description22.75px and both peer Cards557.5px. This staged policy does **not** mark the non-editorial Buy Investment sibling as visually aligned, and it must remain a Stage3 manual/paired QA target. No fixed height, Preview-private paint or weakened tolerance. Complete final-HEAD CI and artifact ZIP pending.

## 2026-10-09 — Failed strict tests distinguished Theme ordering and paired row stretch (pending recheck)

CI `ec8f46d` failed exact generated theme default because the new Button.sm role appeared after control-padding in checked-in theme.css, while compiler's closed token list emits it before. Reordered both light and dark generated tokens; no value or test changed. The real Chromium paired gate also failed Sera Savings even after small Button width and header text matched the source: source siblings both557.5px, QX 538.5/557.5px. The residual was **not** a Card height issue: QX Preview's old `pv-cols-2.is-gap` had `align-items:flex-start` and thus failed the source equal-height CSS Grid row semantics. Replaced this Savings-only authoring wrapper with reusable framework Flex `is-stretch is-equal` plus existing theme-driven Create gap. No private Preview CSS additions, fixed heights or threshold changes; strict Sera Button+description+two sibling Card checks retained. Await full final SHA CI and local ZIP.

## 2026-10-09 — Only 2/528 remain, shared source Button.sm horizontal inset (CI pending)

At `a113163f` source-preview-geometry SUCCESS: **528/528, 2/528** first Card heights >0.5px, zero unauthorized geometry subset differences, 66 allowed Luma caps. The Lyra, Nova and Sera FieldLegend fixes reduced 12→2. The final two are Sera SavingsTargets light/dark: source two peer cards both557.5px, QX left/right561.25/557.5px. Source small New Goal button115.922px vs QX127.922px; extra 12px from 22px instead of source16px horizontal inset shrinks heading width and wraps description from22.75 to45.5px. New reusable Button.sm padding token uses pinned source insets Vega10,Nova10,Maia12,Lyra10,Mira8,Luma12,Sera16,Rhea12px, with custom density delta; icon-only/square excluded. Strict peer Card/description/Button source width gates added. No fixed Card height or private Preview CSS. Await BOTH latest CI suites, same-head 528 and new CI dist+docs ZIP for delivery.

## 2026-10-09 — Source-paired final 12 residual families: shared line metrics (CI pending)

Baseline `db6aaed7`: QXFRAME #37902751672 and CSS Schema #37902751687 both success, 528 same-Chromium source pairs, 12 first-card height excesses >0.5px, zero unauthorized geometry deltas and 66 allowed Luma caps. New batch addresses three shared metric roots without overriding Card sizes: (1) Lyra normal ItemTitle 16.5px but locked source16px, 4 Kitchen rows/4 Payment rows/3 Upcoming rows; adopt one shared `item-title-leading` Theme owner also used by wrapping ItemTitle; (2) Nova CardOverview 2xl title 32px vs source33px, correct existing `card-value-leading` recipe; (3) Sera FieldLegend source16px vs QX20px and FieldTitle source18px vs QX16.5px, assign independent source FieldLegend leading and existing FieldTitle role. Added strict source-paired checks and simultaneous Sera SavingsTargets sibling Card/controls diagnostics for its remaining3.75px row height. No source threshold change, no Preview private CSS. Must await both full current-HEAD CI and new CI-built Windows dist+docs zip to mark delivered.

## 2026-10-09 — Post-34/528 semantic checkbox/KPI/ItemTitle sources (CI pending)

Paired `c3b2bee` 528 same Chromium found 34/528 >0.5px, 0 unauthorized geometry. Three source-backed distinct shared fixes: NotificationSettings only first row had checkbox margin inflating 16px to18px; `CheckField.is-center` applies source horizontal centering to 5 rows. ContributionHistory text-xs category Item descriptions are Vega/Nova18px Sera19.5px rather than QX16px; reuse existing `ItemDescription.is-kpi-label`. Lyra DividendItem wrapped titles line-height source16px not QX16.5px; closed Theme `item-wrapping-title-leading` (Lyra4/3, others1.375) feeds shared `ItemTitle.is-wrapping`. Extended pinned source pairs for these Cards; no thresholds relaxed, no Card dimensions forced. Await final CI and matching dist/docs ZIP before classifying batch as delivered.

## 2026-10-09 — Source PowerUsage metric spacing and Mira FieldTitle (CI pending)

Pinned PowerUsage 2px gap-0.5 between metric title and number was absent in two QX Stack.is-gap-0 pairs; introduced shared Flex/Stack.is-gap-half (.125rem), used in Preview01. Mira ReceivingMethod FieldTitle pinned 12px/19.5px (text-xs/relaxed) instead of QX 12px/16.5px; closed Theme field-title-leading and shared FieldTitle consumer. Strict source-paired Card gates now check all eight PowerUsage styles plus Mira Radio title+whole Card. Extended DOM traces cover NotificationSettings/ContributionHistory and Lyra; obtain actual next 528 count from complete CI before declaring fixes accepted. Draft PR preserved; protected branches unchanged. Mandatory new final-HEAD dist+docs ZIP after both CI suites pass.

## 2026-10-09 — Vega Item KPI and CardTitle 2xl source parity (CI pending)

Vega SavingsTargets source first Item 148px/QX146px due label line box 18px vs16px, reused Theme KPI leading. Vega Overview source CardTitle text-2xl 24px/36px vs QX 24px/32px; shared CardTitle.is-value with Theme card-value-leading Vega1.5 and others4/3. Generated Nova theme synchronized. Strict paired Item/Overview card gates added. Current last measured c5490932 68/528; new CI pending; PR Draft.

## 2026-10-09 — generated Theme alignment (CI pending)

Release on c5490932 reported both new registered Theme inputs absent from checked-in generated default theme. Updated Nova default `src/styles/main/theme.css` compiler-equivalent values for both modes, including source 12px artwork label leading. Previous same-browser c5490932 passed 528/528, 68 height deltas; new full CI result pending.

## 2026-10-09 — CoverArt text-xs source line-box closure (CI pending)

Pinned styles' `.cn-label leading-none` plus CoverArt `text-xs` produces a 12px label line-box in Vega/Nova/Maia/Lyra/Mira/Luma/Rhea. Framework Theme artwork-label-leading had returned 16px for the last six, making the Card +4px. Shared existing role now 12px for all non-editorial; Sera stays 19.5px. Enforced source-paired all-eight CoverArt Card height. Previous green baseline 70/528, no updated claim until full latest CI.

## 2026-10-09 — Sera FieldLabel wrapping / Lyra Calendar weekday source roles (CI pending)

Source-backed shared FormLabel uppercase/tracking (.025em Sera) and Lyra Calendar weekday 4/3 line-box repair; strict paired regressions added for Sera PayoutThreshold Card and Lyra weekday, expanded CoverArt and Vega savings trace. Baseline green 61dd0a71 70/528; outcome must be confirmed by new both-suite CI before declaring improvement. PR #265 Draft, protected refs unchanged. Completion estimate CREATEAPP-V3 ~65%, Stage3 ~64%.

## 2026-10-09 — 70/528, Browser Accordion source assertion correction

Verified QXFRAME `8d24d8b0` source-preview-geometry SUCCESS, 528/528 source-paired, **70/528** first Card height diagnostics over ±0.5px, zero unapproved four-property subset mismatches, 66 authorized Luma radius caps. AccountAccess nested FieldLabel source exact Nova/Mira, Lyra first Card within +0.5px.

CSS Schema Acceptance #37887892053 failed a stale browser assertion that expected Mira Accordion open content bottom padding8px merely because its trigger top padding is8px. Pinned `style-mira.css` source has trigger `p-2` **and** content `pb-4` (16px); source-paired Mira FAQ Card matched 385px. Updated separate pinned-style expected trigger and content maps in `tools/verify-create-app-browser.mjs` (8 independent style values; no tolerance change). Stage 3 visual acceptance remains pending.


## 2026-10-09 — 84/528 verified, AccountAccess nested FormLabel owner

`33316902` source-preview-geometry SUCCESS: 528/528 pinned same-Chromium/forced-system-ui pairs, **84/528** first Card height diagnostics outside ±0.5px (102 prior, 104 original), 0 nonauthorized four-property subset mismatches. Verified 0px Card delta for Sera CardOverview and IndexInvesting, all Lyra/Mira/Nova/Maia SavingsTargets, Mira FAQ, Nova ReceivingMethod. Separate Release and CSS Schema job conclusions are not inferred from this source job.

New AccountAccess node evidence: source Nova Current Password `cn-label` h14px wrapped in 16px Forgot? row, QX FormLabel h20px because `.form-field.is-composed>.form-label` skipped nested FieldLabel. Root Source/QX Card371.25/375.25px Nova; Lyra362/366px and Mira329.5/333px, same ancestor selector issue. Broadened existing single framework CSS FormLabel rule to descendant under FormField, preserving Theme label line-height semantics inside composition rows. Paired Nova/Lyra/Mira label + Card strict checks added. Updated first Card count must be verified by next CI; no hardcoded Card height or threshold change.


## 2026-10-09 — Failed strict gate correction: source Item label line-box, footer margin, Button modifier

CI #37887238932 failed in Release static check due to changed literal `.is-no-shrink` declaration, and source-preview-geometry strict Nova SavingsTargets probe: source first muted Item134px/QX144px, source ItemContent82px/QX80px. The source ItemFooter is an actual sibling, but Preview still specified a redundant 12px top margin after the Item parent gap. Deleted that Preview CSS owner; parent gap is canonical in shared Item. Source text-xs ItemDescription label is 18px in Nova, 19.5px Sera, 16px other sampled styles, while preview `pv-text-xs` hardcoded16px. Added registered `item-kpi-label-leading` theme role and a shared Item label semantic variant, used by both SavingsTargets labels. Source-aligned per-style heights must be established by new CI.

Restored old shared `is-no-shrink{flex-shrink:0}` declaration to meet established Release verifier and added distinct `is-label-nowrap` policy for pinned Sera Overview button; no fixed dimension. Prior f24bbbe7 measured 102/528, stage 3 incomplete. New CI pending, preserve PR Draft.


## 2026-10-09 — Source FieldLegend and AccordionContent authored owner split

Pinned shadcn `style-mira.css`: AccordionTrigger `p-2` but AccordionContentInner `pb-4`. QX shared Collapse was consuming trigger padding for content and thus Mira FAQ 8px too short; split Theme inputs (with `accordion-content-padding` default .625rem in root+dark) and consume in shared Collapse. Source content uses 16px in Vega/Maia/Mira/Luma/Sera/Rhea, 10px in Nova/Lyra. Dedicated Mira content/Card strict pairing added.

Native FieldSet/FieldLegend: locked source Nova `FieldLegend mb-1.5` (6px), Lyra `mb-2.5` (10px), Mira `mb-2` (8px), other source styles `mb-3` (12px). QX had a reusable `form-fieldset` hidden in Preview-specific CSS using 12px for every style, placing Nova RadioGroup and its whole Card 6px lower. FieldSet classes moved to shared `composition.css`, one `field-legend-gap` registered compiler/Theme role, Preview CSS duplicates removed, strict Nova FieldSet/Card pairing added. Existing Radio Field dimensions unchanged.

Last confirmed completed pinned first-Card measurement: **102/528** on `f24bbbe7` (down from 104/528), not a claim of this new HEAD. Upcoming CI must confirm staged Savings/Overview/Mira/Nova repairs. PR #265 remains Draft; Stage 3 incomplete.


## 2026-10-09 — paired 102/528, native ItemFooter sibling + Overview Button no-wrap

`f24bbbe7` source-preview-geometry SUCCESS: 528/528 same-Chromium/forced-system-ui pairs, **102/528** first Card height outliers (104 prior), no unauthorized geometry subset violations. Sera IndexInvesting source/QX both289.25px, matching after editorial prose margin owner. This 102/528 is real measured evidence; it is **not** whole visual or Stage 3 acceptance.

New source-paired DOM proof: Lyra/Mira SavingsTargets source each muted Item132px, QX138px; QX ItemContent wrapped its ItemFooter, unlike upstream which authors Footer as next sibling with independent parent Item gap. Two matching DOM repairs move Footer directly next to ItemContent (no fixed heights). Remaining Nova+8 and Maia+4 follow the same two-item structural defect. Strict first Item/Content/Footer/Card source gates for four styles now enforce this natural composition.

Sera CardOverview pair: upstream both row Cards170.75px; QX both184.75px, even though Card A child positions are exact. Sibling Card B Pay Early button is source36px/nowrap/flex0 0 auto, QX50px/normal/flex0 1 auto; row stretch lifts A. Reused generic `Button.is-no-shrink` and set its no-wrap policy alongside flex-shrink0, as pinned `cn-button` uses nowrap, rather than changing Card A padding/height. Sera first Card source ±0.5px gate added. Pending new paired result and both Actions; PR #265 stays Draft; main/backup fixed.


## 2026-10-09 — IndexInvesting prose source ownership / unresolved sibling & Savings probes

Verified baseline HEAD `bd32478eb1229051ca2e9d818326f51b69040d36`: QXFRAME #37884789294 and CSS Schema #37884789259 Success, 528/528 same Chromium/forced system-ui pairs, 104/528 first Card height diagnostics over ±0.5px, zero nonauthorized four-property subset mismatches, 66 authorized Luma radius caps.

The locked `index-investing.tsx` has `CardDescription className="mt-3 text-sm leading-relaxed style-sera:mt-0"`. QX incorrectly retained `pv-mt-3` for Sera; it accounts exactly for that card's observed +12px. The new generic `CardDescription.is-prose-intro` owns the prose offset with one registered closed `card-prose-offset` Theme input (0 editorial, 12px otherwise). Added exact Sera source-paired prose Y and whole Card height regression checks, without hardcoded Card height. New CI measurement pending; baseline 104/528 is NOT yet a new-result count.

CardOverview Sera A has source/QX identical text and internal line boxes, but outer 170.75 vs184.75px. Both columns' parent row can stretch A to sibling B; next paired job logs both sibling Content and Button boxes as `[stage3-overview-row-sera]` before any first-card padding changes. Added node probes for SavingsTargets Lyra/Mira/Nova/Maia, Mira FAQ, Nova ReceivingMethod, Lyra UpcomingPayments and AccountAccess. These remain diagnostic and require computed DOM evidence before further CSS changes. PR remains Draft; Stage 3 is incomplete.


## 2026-10-09 — Kitchen cross-style regression and Preferences action width

Pinned `e7752a00` same Chromium **528/528 geometry job succeeded, 114/528** heights beyond unchanged ±0.5px, 0 subset mismatches. Vega KitchenIsland 367/367px, Vega/Nova RecentTransactions 0px, Sera/Vega CoverArt within0.02px; Sera PayoutThreshold improved from +21.75 to -1px after source-backed CardHeader gap fix. However treating all Item.sm as Vega's 10px produced -16px on Maia/Luma/Sera/Rhea KitchenIsland (four rows ×4px; two light/dark each). A *single shared Theme size-step* `item-sm-reduction` now takes Vega4px, others2px, with dense families max-clamped at10px. The shared Item.sm uses this instead of forcing all source styles to one value; five-family same-browser gate enforces natural Card parity.

Pinned Sera Preferences Footer source Button widths Reset98.47px and Save203.73px, heights40px; QX Footer had 32px fabricated gap, shrinking Save to180.38px, wrapping to two lines/54px and raising Card by14px. Reused existing shared CardFooter.is-gap-0 with the existing `ml-auto` button for intrinsic horizontal composition. No fixed button height, no new app CSS. Source-paired whole Preferences Card ≤0.5px and standalone browser intrinsic widths/heights added. New CI pending.

## 2026-10-09 — source CardHeader ownership acceptance

`3228303e` Release `verify:theme-tokens` identified one new duplicate CSS owner for `CardHeader.gap` (group selector and Header-only override). Header and Footer now share only structural display/min-width; the existing dedicated Header rule uniquely emits the source 4/6px meta gap, and Footer's dedicated rule uniquely emits section spacing. No style values changed and the static gate now rejects grouped duplicate ownership. The same run's RecentTransactions remaining +1px after gap0/collapse has been assigned to source TableRow rather than per-td borders. New CI pending. Threshold remains 0.5px.

## 2026-10-09 — embedded Table border owner closeout

The first strict same-browser attempt on `3228303e` confirmed Vega KitchenIsland 367/367px and Vega CoverArt 498.86/498.84px (both pass ±0.5px). Vega RecentTransactions was source404px vs QX405px, caught by the new hard gate. After correcting the true 2px Stack.is-gap-0 and collapsed Table, the last +1px came from borders being drawn on all five QX TableCells. The source TableRow owns a 1px inter-row border, except the last row; collapsing borders makes the five natural rows 56.5/57/57/57/56.5px (sum284). Updated embedded Table adapter to draw borders only on `tr:not(:last-child)` and remove cell bottom borders, with no row height overrides. Added source-row ownership and heights to browser/static tests. Re-running entire CI; no acceptance thresholds changed.

## 2026-10-09 — bulk shared header, compact item, zero stack/table, Cover typography

Latest source-paired report `7a71ad29`: 528/528, **112/528 >0.5px** (handoff 202), 0 pinned Card geometry subset mismatches. Sera Claimable Badge 443.03/443.03px and StockPerformance 440.25/440.25px exactly matched.

Same-Chromium node measurements from this report identify four additional independent shared causes: PayoutThreshold Sera action header QX heading width242.84px vs upstream 268.86px because QX used 32px Card spacing as the action column gap vs source 6px heading/meta gap; 3-line vs 2-line description adds22.75px of its +21.75px Card delta. Header uses existing shared heading gap now. Vega KitchenIsland four sm Items had QX 12px top/bottom insets vs source10px, each adding4px, exact +16px Card difference; shared Item sm size now subtracts4px from its Theme space anchor rather than2px. RecentTransactions five table rows source ~57px vs QX59px: shared Stack.is-gap-0 erroneously created 2px, and embedded QX Table had separate borders rather than upstream Tailwind-collapsed borders. Corrected both shared utilities, expected −11px Card height. CoverArt pinned label/footer text metrics: Vega Label source12px/QX16, Sera Label19.5/QX16 and description source39/QX32. Two closed Theme typography-leading roles in shared FormLabel/CardDescription artwork modifiers target those exact source properties without changing Card heights or artwork Item dimensions.

Added pinned same-browser ±0.5px whole Card gates for Vega/Sera CoverArt, Vega KitchenIsland, Vega/Nova RecentTransactions, and browser/static checks for shared action gap, item-sm padding, true gap0 and collapsed table. New CI result and aggregate 528 count pending; no acceptance threshold lowered.

## 2026-10-09 — batch source-backed shared StatusBadge/Divider/CoverArt

Previous SHA `615d72d2` has QXFRAME CI and CSS Schema Acceptance **both green**, 528/528 same-Chromium source pairs, 116/528 Card heights outside ±0.5px, 0 pinned geometry subset mismatches.

Three independently traceable source-to-QX problems fixed in one branch update: (1) Sera Claimable reference Badge 10px font/14.2857px line, no border or padding, natural height14.2857px vs QX Badge min-height20px (exact +5.7143px Card). New shared `Badge.is-status-label` consumes closed Theme font/line/height/editorial roles; it honors non-editorial h-5 outlines and Sera tracking/uppercase, while the icon is an ordinary shared BadgeIndicator. (2) Sera StockPerformance reference `<Separator className="style-sera:hidden" />` is absent; QX showed it with Flex gap16px plus 1px line (exact +17px Card). Shared `Divider.is-theme-optional` consumes already-existing `field-separator-display` Theme token, and makes no new style-scoped selectors. (3) CoverArt source Item is aspect-square, child label centers a 40px image icon; Footer `flex-col gap-2` centers two natural blocks. Replaced preview private square styling with shared Item artwork composition and shared CardFooter column gap 8px. No fixed Card height.

Added static + 3-style live browser checks. Pinned source same-Chromium QA must find Sera Claimable/Stock whole Card and Badge heights within original 0.5px threshold. Added targeted node reporting for Sera PayoutThreshold, CoverArt, Preferences, CardOverview and Vega Kitchen Island plus multi-style RecentTransactions, for next source-grounded batch. Pending actual CI and refreshed 528 count; PR #265 remains Draft, protected refs unchanged.

## 2026-10-09 — Sera FAQ full-width Button semantics and Rhea gate

Last confirmed `0b50751f` same browser audited 528/528, **118/528 >0.5px** (202 handoff), 0 geometry subset mismatches, 66 authorized Luma radius caps. Five Syncing State style Cards exactly match their source heights; main/backup remain frozen.

The `0b50751f` full Release and CSS Schema browser stopped on a *test-only* Rhea assumption of 24px Card padding: the frozen Theme default `p20` is 20px. Corrected that expected source configuration rather than modifying rendered components. Pinned Sera FAQ source-computed Footer: 40px tall with two 314.86px full-width Buttons (both `shrink-0`), zero gap, overhanging horizontal width. QX had Footer 86px, with Buttons shrunk to ~156px and first text wrapping to two lines because the app-owned `pv-full` flex-grow rule overrode source shrink0. Sera Card difference is 14px after natural footer and Card spacing accounting. New QX shared generic `Button.is-no-shrink` used with existing `Button.is-block` and `CardFooter.is-gap-0` restores source flex semantics; FAQ has no private `pv-full` action. Static, browser and source-locked paired Sera Footer and first-Card ≤0.5px gates added. No fixed heights, threshold changes or core controller JS modifications. Latest CI pending.

## 2026-10-09 — Syncing State exact parent/child composition

Pinned `syncing-state.tsx`: `Card` with sole `CardContent p-0`; `Empty p-4` contains an `EmptyHeader` whose FIRST child is `EmptyMedia`, followed by title/description, then sibling `EmptyContent`. Previous QX inserted Media as a root sibling ahead of Header and moved Card top padding into CardContent, leaving Card bottom padding absent. Same-Chromium measured source/QX Empty root: Vega/Maia/Luma 221.5px/229.5px, Nova201.5/209.5px, Sera227.5/233.5px. Source Card also has 16/24/32px bottom inset, absent from QX: hence previous final deltas -8/-16/-26px. Media nested under Header saves 8px, while Sera adds its pinned editorial `EmptyDescription mt-0.5` 2px. Introduced shared `Card.is-content-only` (symmetric parent padding, zero-inset only child Content) and closed single `empty-description-offset` Theme role (2px editorial, 0 ordinary); restored source DOM nesting. Same-browser hard gate now checks exact Card heights within 0.5px for five measured styles, plus all-style browser composition/padding checks. This does not touch previously accepted Empty's baseline media size/glyph/typography APIs. Latest CI pending.

## 2026-10-09 — replace Dividend nowrap workaround with shared editorial typography

The last `8bae71d0` run closed Sera Dividend at 606.25/606.25px but created six paired Vega/Maia/Luma regressions (146/528 overall). Pinned source `style-sera.css` explicitly sets `.cn-item-title` uppercase and semibold; QX ItemTitle lacked the uppercase mapping. This changes intrinsic min-content and Flex line packing. Removed the one-off `is-intrinsic-line` white-space/max-content modifier and instead made the shared `ItemTitle` consume the existing `--theme-control-transform` (uppercased editorial Sera; none elsewhere). No new token or pixel width/height. Static/browser tests verify all eight styles and consistent four-title markup, paired source Chromium checks Sera first Item and title. New 528 geometry result pending.

## 2026-10-09 — Dividend/Lyra exact pair, regression isolation

Pinned `8bae71d0` same Chromium 528 audit: **Lyra FAQ 359/359px and Sera Dividend 606.25/606.25px**, both 0px whole-Card height difference. The original fixed source tolerance remains ±0.5px. Aggregate first-Card height outliers **146/528** vs prior 144/528: the new first-title max-content rule eliminated Sera's two light/dark mismatches but introduced one each in Vega/Maia/Luma light and dark. We do not claim monotonic improvement. Source-paired DOM measurements have been enabled for those specific Dividend styles to resolve the cross-style rule; focused Syncing State nodes (Sera/Vega/Maia/Luma/Nova) added for next batch.

Release static test was stale: counting the exact suffix `is-wrapping"` excluded the new `is-wrapping is-intrinsic-line"`. The test now requires four shared ItemTitle wrappers and precisely one intrinsic modifier. This is not a test weakening: it adds the source semantic requirement. CI pending.

## 2026-10-09 — Sera Dividend first Item intrinsic line-packing

Pinned same-browser prior first row: shadcn title `Vanguard VIG` width103.3px/height16.5px, QX 74.02px/height33px. QX let that title wrap, shrinking the content flex min-content enough for content + 96px chart + $1,842.10 to share one Flex row; source uses content + chart on row one and amount on row two. Introduced reusable `ItemTitle.is-intrinsic-line` with white-space nowrap and min-width:max-content on the Vanguard heading only. No card or item fixed pixel height/width; just the correct intrinsic text contract. Same-Chromium source-paired first Item and title heights must now agree within 0.5px, with a separate browser text-wrap assertion. Latest paired 528 count pending.

## 2026-10-09 — Lyra FAQ icon layout and Radio Field test gate

Source-locked Chromium on `11443533` proves Lyra FAQ source Accordion first and third single-line triggers are 38px, QX 40px, while the two-line middle trigger already equals the 54px source. The source 16px chevron occupies no extra ascent; QX had 16px icon plus 2px top margin, adding 2px per single-line header. The shared native Collapse icon now calculates a capped optical offset from the existing `accordion-line-height`: 0px in Lyra (16px), 2px for other pinned typography families. Same-browser Lyra trigger/whole Card gate now requires ≤0.5px; no Card fixed height or exception. CSS Schema test exposed an older RadioField assertion still forbidding top inset and borders. Updated it to require source Theme `choice-field-inset` and 1px FieldLabel border while retaining 10px authored bottom padding and 2-column/1-column tests.

## 2026-10-09 — 144/528 and CI gate correction

Pinned QA on `11443533` measured 144/528 first-Card heights over ±0.5px, an improvement from 154/528; Sera Claimable 448.75px vs reference 443.03px (+5.72px), Lyra FAQ363px vs359px (+4px), while Maia/Luma RadioField, Sidebar Nav and Upcoming Calendar remain exact at Card height. Two CI regressions were test contracts, not evidence that those source-paired values regressed: a historical static regex expected `theme-text-leading` after migration to the dedicated `accordion-line-height` role; the standalone createApp browser applied an absolute 91.5px Bank Transfer row expectation despite not using the source-audit's forced system-ui. Revised the static check to require 16px/19.5px/20px source style line heights, and enforced Maia/Luma 91.5px Row in the **same Chromium/font source-paired QA** while the separate interactive browser checks natural row height equals content box + the exact source top/bottom/border insets. Fixed duplicated Nova target key. CI pending; no Card height offsets or reduced tolerances.

## 2026-10-09 — source display CardTitle leading

Pinned source `ClaimableBalance` shows `text-5xl` (48px). Vega `CardTitle` explicitly sets `leading-normal` (=72px), Nova `leading-snug` (=66px), all other pinned style CardTitles lack an explicit leading override and retain Tailwind text-5xl tight (=48px). QX preview's private `pv-text-5xl` set font-size48 but inherited generic heading-leading. Sera's source title was 48px tall, QX 74.6667px, accounting for 26.6667px of the +32.375px Card delta; the remaining ~5.7px is the editorial Badge, to investigate next.

New shared `qxframe9a7c2-card-title.is-display` handles the 3rem font scale and a single closed `card-display-leading` Theme input (Vega1.5/Nova1.375/others1). This is source-backed composition, not a per-Card height override. Existing other CardTitle defaults remain unchanged. Updated all-style Chromium/title box tests and broadened same-browser Claimable node reports. Pending CI and 528 paired height diagnosis.

## 2026-10-09 — native FAQ composition line box and 154/528 paired results

Same-browser pinned run on `d58d740c`, source-preview-geometry job `113635342375`, yielded 528 measured, **154/528 >0.5px** (previous 168). Maia/Luma Receiving Method source and QX exactly 487.5/487.5px and 485.5/485.5px; Maia/Luma/Sera SidebarNav respectively 441/441px, 427/427px, 427/427px. New static RadioField shared-variable test supersedes an obsolete `pv-choice-field padding-block-end` assumption and does not change source pb-2.5 acceptance.

Lyra FAQ source first Accordion item 129px, QX 150px, overall source FAQ359px vs QX390.5px. Trigger line boxes are 16px source vs 19.5px QX for four rendered lines (14px total); content uses 16px source vs 19.5px QX for five rendered lines (17.5px total). Their 31.5px sum explains the exact card delta. The native Collapse adapter now consumes a source-derived closed `accordion-line-height` Theme input (Lyra16px, Mira19.5px, all other styles20px) for trigger and content instead of generic body line-height. All regular Collapse instances retain existing behavior. CI and refreshed count pending; no threshold relaxation.

## 2026-10-09 — source-locked Radio Field and SidebarMenu ownership

The paired Maia/Luma Receiving Method FieldSet is **123.5px source vs 87px QX**, precisely the whole −36.5px Card delta. Its source RadioGroup has a 91.5px Bank Transfer FieldLabel with 1px outer border and 16px top/inline inner Field padding, an authored 10px bottom padding and 14px/19.25px title wrapping to two lines. QX previously rendered 55px frameless CheckFields. Shared `CheckField.is-choice` and `FieldTitle` now own border/padding/title semantics; Preview 01 retains only local pb-2.5. Pinned style ChoiceField inset map (8/10/12/16px) emits one registered Theme input and respects the Padding extension.

Maia/Luma/Sera first Sidebar Nav Card: source nine 36px `SidebarMenuButton` rows vs QX nine private 32px `pv-nav-button` rows (exact −36px). Preview Nav link/label chrome moved into shared `qxframe9a7c2-sidebar-menu-button` and `qxframe9a7c2-sidebar-group-label`, with a single Theme row-height role (36px verified families, 32px previous compact others) and source 8/12px horizontal padding. Menu gap, group padding and native Card/Divider remain unchanged. This also removes duplicate preview hover/selected paint.

All corrections are rooted in per-node computed styles on the pinned same-browser renderer, not forced Card heights. Static and Chromium style/geometry checks added; current-HEAD CI pending. PR remains Draft, main and backup unchanged.

## 2026-10-09 — adaptive Calendar source parity (CI remediation)

Next probe batch (pending CI): source `ItemContent.flex-1` emits computed `flex-basis:0%`; QX's legacy `flex:1 1 0` emitted `0px`. The opt-in intrinsic Item now matches the pinned basis while preserving the default QX Item rule. Expanded paired node structures to additional unresolved Receiving Method, Sidebar Nav, Claimable Balance and Lyra FAQ cards, including all four box paddings/borders and minimum sizes. Do not infer any height improvement until the same-Chromium rerun.

Pinned same-browser source probe isolated Upcoming Payments differences to framework Calendar layout: source Mira Calendar 304×340.78px (12px padding) vs QX 278×291.89px (6px panel inset, 1px border); source Nova 296×330.28px (8px padding) vs QX 296×311.78px. Source uses 40px desktop day cells and navigation, 8px margin before date grid, 8px vertical week gap and 35 cells in October 2026; QX had 36/39px cells and 42 cells. The source card sets responsive 32/40px days (36px for Sera), distinct from base Calendar style sizes.

Shared `Calendar.is-adaptive-month` now projects 4/5/6 visible weeks via CSS :has on the first full outside-only trailing week (leaving the 42 core Calendar state entries intact and keeping regular DatePicker unaffected), source-sized adaptive day cells, 8/12px style padding and 40/36px desktop navigation. `pv-calendar` merely centers the shared component in its authored Item. No new proprietary Calendar renderer, runtime Value/Focus rewrite or fixed Card height. Calendar roles `calendar-padding` and `calendar-cell-size` are in closed theme schema and both default theme modes.

**Source-locked Chromium geometry job on `c8185699`: 528 measured, 168/528 heights beyond ±0.5px, down from 182/528. Mira Upcoming source=688.28125/QX=688.28125 (0px); Nova Upcoming source=693.03125/QX=693.03125 (0px).** Rhea/Maia FAQ also 0px, Sera Dividend remains +5.25px. All 66 governed Luma Card radius caps unchanged. This is first-Card height diagnostic, not full visual parity.

`c8185699` Release static check rejected the new intervening `data-pv-calendar-layout` attribute because a historical regex assumed two attributes were adjacent. Revised the assertion to require both real attributes and added Calendar keyboard cross-month regression. Latest-HEAD CI verification pending; no gate or threshold relaxation.

## 2026-10-09 — Upcoming Payments current-date parity

The pinned `upcoming-payments.tsx` initializes `useState(new Date())`, while the three payment descriptions intentionally refer to Apr 2024. QX previously selected `2024-04-15` in Calendar and displayed a different month than the pinned source. The preview now authors a `today` sentinel and resolves it only at the existing `Calendar.create` public instance API; source text in the payment rows remains unchanged. Added static/runtime tests that the live selected QX cell is also its own today cell. This does not yet solve Calendar box-model size parity; that remains under same-browser QA.

## 2026-10-09 — paired 192/528 diagnostic and native AccordionTrigger border

The second source-locked same-Chromium run (`71b74b98`, job `113625030611`) reduced **202 → 192 of 528** height outliers, without lowering tolerance or modifying the 66 governed Luma radius exceptions. Sera Dividend changed -44.25 → +5.25px (needs further 1st Item min-content examination), Rhea FAQ changed -68 → -6px, and Maia FAQ changed -48 → -6px.

The remaining FAQ exactly 6px is three upstream `AccordionTrigger` instances whose core JSX class includes `border border-transparent` (each 1px top and bottom); QX's native summary lacked this transparent layout border. The shared native Collapse header now gets 1px transparent border. Eight-style light/dark Chromium assertion and static contract added. CI pending for this change.

Previous `71b74b98` release failed `verify:theme-default` because the three new closed Accordion inputs were missing from generated default CSS; `1f678de4` added these to root/dark, no validation relaxation. Verify release and CSS Schema jobs on latest branch before declaring green.

## 2026-10-09 — shared Collapse framed recipe and Dividend intrinsic Item title

Same-Chromium node evidence after sibling fix: 202/528 total height outliers unchanged, but Sera Dividend decreases from -89.75px to -44.25px. Original shadcn Sera ItemContent and ItemTitle have intrinsic flex sizing/wrapping that QX's long-standing one-line clamp suppresses. Introduced opt-in shared `ItemContent.is-intrinsic` and `ItemTitle.is-wrapping`, applying only to Dividend's four holdings; default truncated Item behavior remains covered.

The original Rhea/Maia Accordion is an actual framed `Accordion` with 1px border, vertical/horizontal 16px trigger inset, 24px disclosure gap, 16px content inset and muted/50 opened background; existing native QX Collapse was unframed, had zero horizontal padding/gap and therefore shorter text blocks. Three closed theme inputs (`accordion-framed`, `accordion-overflow`, `accordion-trigger-gap`) now drive the shared Collapse adapter. Frameless Nova/Vega/Lyra/Sera remain unboxed; Sera retains the original 24px gap. Added source-derived static and Chromium checks across all eight styles/light-dark. Pending final newest-HEAD CI; no height claim until remeasurement, runtime JS untouched.

## 2026-10-09 — source sibling-structure restoration and next-node probes

Verified previous GitHub checkpoint `65c80d01`: QXFRAME CI `37866512674`, CSS Schema `37866512679` both succeeded; 33/33 Chromium cases passed. The pinned same-Linux-browser first-Card height residual is **202/528 >0.5px**; this is not acceptance.

Pinned `dividend-income.tsx` has three direct Item children: `ItemContent`, a responsive `ChartContainer`, and a separate responsive amount `span`. Preview incorrectly grouped the latter two inside `ItemActions`, changing the flex wrap algorithm. Restored the upstream child topology, reused QX Item/Card, and added static + eight-style browser topology checks. No fixed height, private replacement component, runtime JS change, or test relaxation.

The existing same-browser QA now emits focused source/QX node reports for Sera Dividend, Rhea/Maia FAQ, Mira/Nova Upcoming Payments (light mode) to distinguish per-node padding/wrap differences from chart/calendar stubs. **New CI and the resulting delta count are pending**, not yet a claimed improvement. Remaining: these cards, nested Cards, Preview 02, full visual/content acceptance. PR #265 stays Draft; main and fixed backup are untouched.

Status: **in progress; not stage acceptance**. Baseline main: fe209ab.
Reference: shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c.
Windows Chrome 154, both sides forced to system-ui, sans-serif; tolerance 0.5px.

Completed this batch:
- Card title/description line height and weight, metadata gap, full surface radius,
  slot spacing, optional footer partition and non-layout outer ring.
- Public Card padding/radius overrides and selected/hover/borderless states retained.
- Mixed body/content and content-before-header spacing covered.
- Preview-only border-box reset prevents padded items from breaking two-column rows;
  QR's explicit top padding composes with Card padding.
- Portable reference build, pinned QA dependencies, 159 hashed source files;
  generated JS is excluded from Tailwind candidates.

Evidence:
- card-geometry/report.json: **624/624** checks across 8 styles × light/dark;
  both content and legacy body markup, plus state/override regressions.
- preview-01/report.json: **528/528** first-Card measurements match the four checked
  properties (radius, titleSize, titleInset, titleTop), with no page errors.
- **410/528** measurements still have height differences above 0.5px. These are
  diagnostics: wrapping, stub content and component structure must be investigated
  before height acceptance. This is not 528 fully aligned cards.
- Static verify chain completed locally after npm 10 compatibility, a CRLF-only
  generated docs refresh and the updated outer-ring structural assertion.
- createApp browser: 9/9 interaction steps. Theme browser: 8 styles, no failures.
- CSS/token gates: no increased counts; duplicate-owner decreased 141 → 136.
- The separate optional Modal/Drawer test failed on this Windows Chrome setup
  ("modal leave keeps resource lease"). No runtime JS changed. Linux CI remains
  authoritative and its result must be recorded before any merge.

Coverage limits and next work:
- Inventory currently measures only the first Card in each of 33 source examples;
  savings-targets, sidebar-nav and card-overview need all nested cards measured.
- Internal Empty/Item/Field/list/form geometry, full footer color/partition parity,
  total height, and representative component-demo regressions remain unfinished.
- Reference chart/calendar/QR internals are stubs. They are not content-parity
  evidence. Nova light/dark screenshots show only the visible canvas portion.
- Keep this stage PR in draft. Continue per-card work in the same PR; do not merge
  or publish Pages based on the shared Card results alone.
- Runtime source unchanged; build identity against main is checked by existing CI.

## Nova light: diagnostic heights

### Root cause: Control sizing mistakenly overrides Textarea min-height

The same-browser node audit identified a pair of compensating defects in
Payout Threshold: QX Slider took a 32px Control-height root instead of the
source's Nova 4px intrinsic rail, while QX Notes Textarea rendered at 50px
instead of the upstream minimum 100px. The net Card error (-22px) concealed
these +28px and -50px internal errors. An optional shared
`.qxframe9a7c2-slider.is-track-height` now maps root height to the
already-themed rail, keeping actual QX Slider keyboard/pointer authority.

Detailed CSSOM trace showed the Notes textarea computed `min-height:32px`
in spite of two matched rules for `5rem` and `6.25rem`. The source was the
legacy single-line control bridge in
`src/styles/main/theme-visual-v2.css`, whose higher-specificity
`.qxframe9a7c2-form-textarea[class]` group forcibly assigned the Control
min-height. That rule now shares only typography and padding with
Textarea. The min-height assignment applies exclusively to single-line
Button/Input/Select controls, leaving FormTextarea's own 5rem base and
instance min-height available. The browser gate now checks Nova Notes =100px
and Payout Card=468px, in addition to the existing keyboard Slider change.

Claimable Balance's full -18px came from preview typography helper
`.pv-text-5xl` overriding CardTitle's source `line-height:1.375` with 1.
Removing the excess declaration restores title 66px and Card 374px in Nova.

**Acceptance pending:** both complete CI suites and paired 528 source/QX
measurements on the newest branch commit. No Card fixed heights, no new
Controller, and no relaxation of source thresholds.

## 2026-10-09 — Nova Payout / Claimable node-level source comparison

The pinned reference and QX paired source job now prints first-Card DOM
bounding boxes and computed layout for `payout-threshold` and
`claimable-balance`, rather than guessing from total heights. On the
last completed paired run (CI #37865241466, Nova/light):

- Claimable source total 374px, QX 356px. The `text-5xl` CardTitle is
  66px source vs 48px QX, exactly the total 18px deficit; shared Item,
  footer, content are otherwise identical. The preview's typography helper
  was erroneously overriding CardTitle `leading-snug` to `line-height:1`.
  Removed that override without changing the shared Card component recipe.
- Payout source total 468px, QX 446px. The source `Slider` root is 4px
  while QX's full-height controller root is 32px (+28px); source Notes
  Textarea is 100px while QX is 50px (-50px). These *opposite* offsets
  happen to produce the net -22px total; simple padding tweaks would hide
  the structural error. A framework-wide opt-in
  `.qxframe9a7c2-slider.is-track-height` uses the existing internal rail
  token to size the Slider root, preserving native QX value/focus handling.
  The Payout Preview activates this class only for that authored instance.
  Browser checks verify the Nova root is 4px and previous keyboard
  interactions still work. Textarea computed min-height and inherited
  declarations are being probed before any size change.

The new source CI has not passed yet for these changes. Continue to enforce
the v3 Luma 24px Card radius limit and use **same-browser** geometry data.

### Syncing State — restore authored source Empty padding

The pinned upstream `syncing-state.tsx` explicitly renders
`<Empty className="p-4">`, independent of each look's Empty default
padding (24px for compact Nova, 48px for spacious variants). Preview 01
previously omitted the instance override, inheriting the global composed
Empty padding and creating approximately +16px/+64px excess vertical space
before other typography differences. The preview now sets the public
`--qxframe9a7c2-empty-padding:1rem` on **this instance only**; the shared
Empty density hierarchy and other cards remain untouched. Static QA and a
new eight-style × light/dark Chromium test enforce the 16px computed inset.
**Latest CI still pending**; source-paired height reductions are not claimed
until remeasurement.

### FAQ Tabs presentation — shared segmented type

The locked `faq.tsx` mounts `TabsList` with a muted segmented background
and three evenly sized triggers. Previously the QX Preview's own Tab renderer
used its default line/underline type, a visible mismatch despite functioning
selection. The FAQ now passes `data-type="segmented"` through the existing
`C.Tabs.create` interface; framework Tabs owns the background, selected
surface, keyboard and focus. No FAQ-specific CSS was added. Static and
Chromium gates assert the segmented variant. **New source-paired and
browser results pending.**

## 2026-10-09 — paired Chromium source audit + Loading Card fix

**Reference build is now reproducible inside CI.** The dedicated QXFRAME
`source-preview-geometry` job checks out SHA-locked shadcn, validates the 159
`ref/source-lock.json` hashes, builds the reference-only React renderer,
then runs existing `tools/qa/preview-01-audit.mjs` with shadcn and QX in the
same Linux Chromium with a forced common font. The reference tree never
becomes a QX runtime dependency or part of the npm artifact. The report and
Nova screenshots are uploaded as `stage3-same-browser-<sha>`.

The first actual paired run ([#37862646440](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37862646440)) measured **528** cells, with no missing examples or page errors.
**226/528** first-Card heights differed by more than 0.5px, down from the
incomparable **252/528** Windows-source vs Linux-QX count. This reduction
is a measurement-correction, **not** a CSS improvement. Nova Payments 0px
height delta; Nova FAQ -6px; Nova Loading Card +16px. There are 66 raw
core-geometry differences, all precisely Luma/Card radius: source **26px**
vs QX **24px**, 33 cards × light/dark. The 24px cap is mandated by higher
priority v3 §4.5; validator locks exactly those exceptions and rejects
any new core geometry mismatch. Source-geometry job [#37863258225](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37863258225) passed.

The Nova Loading Card structural readout identifies one true 16px error:
source Card root 348px; QX 364px. The three-line Skeleton group has
source **8px** row gap, QX **16px**; two gaps make the 16px height error.
Their component root/header and all child sizes otherwise align. Rather
than overriding the component in `preview.css`, the shared Flex/Stack
static layout gained `.is-gap-2` = 8px, consumed by the Loading Card
stack and horizontal button-placeholder row. The browser gate asserts
all eight pinned style heights in light and dark. **Latest code CI still
pending**; no claim of visual acceptance or new 528 height count yet.

### Payout Threshold runtime value parity (2026-10-08)

Pinned upstream `apps/v4/registry/bases/radix/blocks/preview-02/cards/payout-threshold.tsx` holds `amount` and projects `$ + amount.toFixed(2)` whenever the Slider changes. The QX Preview previously mounted the real QX Slider but left its adjacent `$2500.00` display static. The authored slider now carries `data-pv-output`, pointing to an existing label, with the optional display formatter `money-2`. `docs/create/preview-cards.js` uses the Slider's public `onChange` callback; it does not own or duplicate Slider state. Added a static contract and a Chromium keyboard ArrowRight (+50) / ArrowLeft (-50) test that must restore the label. This task changes no Card height policy, Theme token or runtime Controller. **CI for this new batch is pending.**

## 2026-10-08 — Stage 3 Payments same-browser reference check

- Frozen upstream: `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`, `apps/v4/registry/bases/radix/ui/item.tsx` and `apps/v4/registry/styles/style-nova.css`.
- **Measurement trap found:** the immutable 528-row source report was captured on **Windows Chrome 154** (recorded at the top of this Stage-3 QA file), whereas the GitHub Actions implementation diagnostic runs on **Linux HeadlessChrome 154**. `font-family:system-ui` does **not** lock the actual font metrics across platforms. Earlier numeric Card heights may encode differences in wrapping rather than genuine Theme geometry drift.
- Introduced a **real same-browser, same-font Nova Payments Item comparator** in `tools/verify-create-app-browser.mjs`. Its independent CSS-only fixture reproduces the pinned React Item's layout recipe: root width, flex-wrap, 10px gap, 12/10px horizontal/vertical padding, 1px transparent border, icon boxes, ItemContent zero flex basis and 4px gap, title 14px/1.375, description 14px/1.5 with 2-line clamp, and ItemGroup gap 16px. Both candidates receive the **same** temporary system-ui override in one Chromium document.
- [CSS Schema Acceptance #37794980057](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37794980057) passed, including **29/29** real Chromium checks. Linux observed all four QX rows = source fixture rows: **87.25px** each, ItemContent and description width **268.859px**, description line-height **21px**, description height **42px (two lines)**. Thus the QX Item geometric recipe is correct **in this controlled Nova fixture**, despite historical **Payments +42px** difference against the Windows capture. Do not alter ItemGroup gap, line-height or fixed Card height to chase that unpaired baseline.
- The intermediate same-browser attempt at `60225c7b` failed by exposing a **different bug in the test fixture**: its source row used CSS `system-ui` while the live QX row inherited `Segoe UI, Arial, ...`, yielding 2 vs 1 lines. Explicitly using identical font override made the source comparison pass at `2f950ca8`.
- The final first-Card report still records **252/528** cross-platform height differences above ±0.5px. The number is kept as a **diagnostic**, not rebaselined or promoted to a visual acceptance assertion. New summary includes `referenceCapturedOn`, `actualCapturedOn` and `fontMetricParityUnverified`. Reliable next steps: regenerate the pinned source screenshot/measurements in the same browser environment as QX, or build additional side-by-side same-browser source fixtures for component families before changing geometry.
- This work does **not** change `qxframe.js`, any framework runtime Controller, Card CSS, Theme Token, prior 27/28 tests, or tolerances. PR #265 stays Draft and unmerged. The **new HEAD** after summary/doc updates must still pass both workflows before declaring final acceptance.

Width and wrapping do not constitute alignment criteria. This table identifies
where to investigate component geometry; it does not assign a pass/fail verdict.

| Example (first Card) | Reference height | QX height | Difference |
|---|---:|---:|---:|
| contribution-history | 471.00 | 485.00 | 14.00 |
| empty-distribute-track | 241.50 | 251.70 | 10.20 |
| qr-connect | 397.00 | 397.00 | 0.00 |
| dividend-income | 427.00 | 450.00 | 23.00 |
| index-investing | 242.50 | 242.50 | 0.00 |
| syncing-state | 233.50 | 235.70 | 2.20 |
| payout-threshold | 468.00 | 472.25 | 4.25 |
| claimable-balance | 374.00 | 368.00 | -6.00 |
| preferences | 405.00 | 478.00 | 73.00 |
| savings-progress | 419.00 | 419.00 | 0.00 |
| kitchen-island | 337.00 | 398.00 | 61.00 |
| savings-targets | 427.00 | 475.00 | 48.00 |
| recent-transactions | 378.00 | 388.00 | 10.00 |
| sidebar-nav | 377.00 | 413.00 | 36.00 |
| faq | 375.00 | 421.00 | 46.00 |
| payments | 431.00 | 492.00 | 61.00 |
| front-door | 289.09 | 289.09 | 0.00 |
| release-catalog | 408.00 | 432.00 | 24.00 |
| account-access | 371.25 | 401.00 | 29.75 |
| card-overview | 129.00 | 128.00 | -1.00 |
| transfer-funds | 533.00 | 587.00 | 54.00 |
| cover-art | 503.86 | 503.84 | -0.02 |
| loading-card | 348.00 | 348.00 | 0.00 |
| receiving-method | 397.25 | 448.25 | 51.00 |
| power-usage | 394.00 | 394.00 | 0.00 |
| empty-connect-bank | 241.50 | 251.70 | 10.20 |
| upcoming-payments | 693.03 | 705.78 | 12.75 |
| roller-shades | 319.00 | 335.00 | 16.00 |
| stock-performance | 381.00 | 387.00 | 6.00 |
| empty-explore-catalog | 241.50 | 251.70 | 10.20 |
| new-milestone | 347.00 | 367.00 | 20.00 |
| social-links | 411.00 | 459.00 | 48.00 |
| notification-settings | 403.00 | 464.00 | 61.00 |

## 2026-10-08 — Empty composed component follow-up (in progress)

- Promoted the preview Empty geometry to shared `src/styles/components/empty.css`.
  Legacy `.qxframe9a7c2-empty-image/-description/-extra` contract remains intact.
- All 9 Empty instances in Preview 01/02 use QX classes; icon media is
  a sibling of the header instead of being nested inside it.
- The intended Nova geometry is 32px icon media, 14px title, 16px root gap;
  styled by theme tokens for background, foreground and radius. Preview-private
  `.pv-empty*` declarations have been removed.
- Static regression `verify:create-app` adds composed-Empty contract (15 checks);
  browser regression checks computed dimensions and slot parentage.
- Local source/static checks passed on the supplied R2 source snapshot:
  `verify:create-app` 15/15; CSS source authority, concatenation,
  constraints and theme-token ratchet passed after regenerating local CSS.
- The R2 snapshot's createApp browser smoke timed out before boot in the
  current Linux container; it is **not** a passing browser measurement.
  GitHub CI on PR #265 remains the release gate.
- The 410 previous height diagnostics have not been remeasured or closed.
  Continue with per-card computed geometry and Item/Field/form/list internals.


## 2026-10-08 — Owner visual-semantic corrections / private primitive removal (PR #265)

- `.is-square` is solely width=height; it no longer forces a corner radius of zero.
  Actual straight-corner policy is the theme/category radius.
- Radio interior dot follows the theme's radio radius; explicit global zero radius
  affects follow-style categories, while an explicitly selected circle shape wins.
- Luma switch thumb width is independently derived from height with an 8px horizontal
  extension, capped inside the switch track; the selectgroup switch is in the same
  shape scheme.
- FormInputGroup connected segments have start/end seam clipping; addon is a
  borderless inner part, prefix/suffix are separately bordered outer segments,
  with CSS `:has()` (modern browser baseline; no legacy fallback).
- Preview 01/02 classes migrated: `create-grid/col/pair`, `pv-row/stack`,
  `pv-field-group/check-field`, `pv-item/field/label`, `pv-separator`,
  `pv-swatch-cell`, `pv-kbd`, `pv-skeleton/spinner/progress`. Shared structure
  is now defined by QX Flex/Stack, FormField, Item, Divider, Kbd,
  Skeleton/Spinner and Progress styles.
  The fixed seven-column comparison canvas stays page-owned.
- Static and browser regression checks added to guard shape/geometry,
  closed-theme token consumers and remaining duplicate private CSS primitives.
- **Not yet accepted:** pixel/geometric regression of all preview cards,
  visual fidelity to the pinned shadcn renderer, and complete cleanup of
  still-page-private special-purpose demo classes. These remain stage-3 tasks.
- First CI attempt reported 5 public `layout-gap` declarations and 2
  duplicated FormLabel font owners. Fixed the cause by assigning private
  `--_qxframe9a7c2-layout-gap` per modifier and removing the extra FormLabel
  typography owner; the CSS gate baseline was not increased. Recheck latest CI.

Additional InputGroup closeout: shared `.qxframe9a7c2-form-input-group-field` provides an explicitly bordered inner field when prefix/suffix and addon coexist. The parent group now joins the same theme control-size owner as other controls; nested addon/input have zero border, external prefix/suffix retain bordered segments. Browser test creates this mixed structure and checks border owners and center square seams. The separate full-width Progress projection `.qxframe9a7c2-progress.is-full` restores the original block-level demo geometry after swapping to the existing QX progress internals. Current CI remains authoritative; do not assert passing visual acceptance before it completes.


## 2026-10-08 — Empty across eight styles (CREATEAPP-V3-S3)

Root cause: the previous composed-Empty CSS fixed Nova-sized media/title/inset
for all 8 styles. The pinned reference at
`tools/qa/spec.json` has two distinct geometry tiers; retaining the Nova
constants would prevent Stage 3 style parity even when the Card outer frame
passed.

Reference source geometry (light/dark share these dimensions):

| Style | Inset | Media square | Title (font / line) | Empty root radius | Media radius |
|---|---:|---:|---:|---:|---:|
| Vega | 48px | 40px | 18px / 28px | 10px | 10px |
| Nova | 24px | 32px | 14px / 20px | 14px | 10px |
| Maia | 48px | 40px | 18px / 28px | 10px | 10px |
| Lyra | 24px | 32px | 14px / 20px | 0 | 0 |
| Mira | 24px | 32px | 14px / 20px | 14px | 8px |
| Luma | 48px | 40px | 18px / 28px | 18px | 14px |
| Sera | 48px | 40px | 18px / 28px | 0 | 0 |
| Rhea | 48px | 40px | 18px / 28px | 22px | 14px |

Implementation:
- Register exactly three added Theme inputs:
  `empty-inset`, `radius-empty`, `radius-empty-media`.
  The 24px/48px tier is selected by the existing container padding axis; the
  two radius roles use the existing six-category radius-allocation recipe,
  scaled by the global radius. An explicit container-square shape clips root
  radius to zero. No `data-create-style` selector or runtime JS is used.
- Shared Empty CSS derives media size `24px + inset/3`, icon SVG dimensions
  `16px + inset/6`, title font `10px + inset/6` and title line
  `12px + inset/3`. Description font consumes `text-size` and its line
  multiplier 1.625 matches the source's 14px/22.75px and 12px/19.5px.
- Add 8-style numeric checks to the static createApp gate and computed-style
  checks for eight styles × light/dark to browser CI (0.5px tolerance), including
  media/root corners. All existing Empty demos and legacy Empty DOM remain.

Status: changes submitted in draft PR #265. Previous 410 height differences
must **not** be treated as fixed until the full first-Card audit is regenerated
against the pinned reference, and nested cards/form/list internals still need
measurement. The new geometry test is an explicit partial Stage 3 contract,
not a claim of full pixel parity.


## 2026-10-08 — Item / Field geometry from pinned spec

Pinned source: `tools/qa/spec.json` blob SHA
`4cd9ab1c61c8fe335a05de7880f101a02301e534` at shadcn
`295a1f114a138f23b5dfee0e0c6812394dfeb90c`. Source reference is
used verbatim; Chrome geometries are sampled on the QX preview iframe.

| Style | Item default block/gap | Radius | Item title/description line | FieldGroup | Field | Label line/weight |
|---|---:|---:|---|---:|---:|---|
| Vega | 14px | 8px | 19.25 / 21px | 28px | 12px | 14px / 500 |
| Nova | 10px | 10px | 19.25 / 21px | 20px | 8px | 14px / 500 |
| Maia | 14px | 18px | 19.25 / 20px | 28px | 12px | 14px / 500 |
| Lyra | 10px | 0 | 16 / 19.5px | 20px | 8px | 12px / 400 |
| Mira | 10px | 8px | 16.5 / 19.5px | 16px | 8px | 12px / 500 |
| Luma | 14px | 18px | 19.25 / 20px | 28px | 12px | 14px / 500 |
| Sera | 14px | 0 | 16.5 / 22.75px | 40px | 12px | 19.5px / 600 |
| Rhea | 14px | 18px | 19.25 / 20px | 24px | 12px | 14px / 500 |

**Code**: `tokens.js`, `compiler.js`, and generated Nova `theme.css`
register five semantic roles:
`item-space`, `item-description-leading`, `field-group-gap`,
`field-gap`, `field-label-line-height`. The shared Item width inset
derives as block + 2px; its radius reuses action radius with an 18px cap.
Composed FormField/Label and Description consume theme typography and gap
without modifying runtime state. No `data-create-style` selectors.

**Regression**: `tools/verify-create-app.mjs` checks 8 preset projections.
`tools/verify-create-app-browser.mjs` asserts 8 styles × 2 modes ×
15 computed default-md Item/Field geometries, using 0.5px tolerance.
Lyra title line projects 16.5px against 16px source (0.5px tolerance
boundary), so is not exact. Legacy S3 reported 410 differing Card heights;
that report predates this batch and must be rerun; no total-height parity
claimed. Item `.is-sm`/`.is-xs` remain a separate source-precision task.
Nested Cards and full FieldGroup/content equality are not yet accepted.



### First-Card height refresh diagnostic (new Actions artifact)

`tools/verify-create-app-browser.mjs` now measures Preview 01's **33 first
Cards × 8 styles × 2 modes = 528 records** against the saved source-locked
reference side of `preview-01/report.json`. It uses the same system-ui forced
font method as `tools/qa/preview-01-audit.mjs`, and writes
`preview-01/current-report.json` during Actions for upload in the QA artifact.

The report includes old/reference/current heights and widths, current number
of cases beyond 0.5px, improved/worsened cases and the largest Nova defects.
It is **diagnostic only**. All 528 reference cards must be found, but the
height mismatches intentionally do not cause a green gate or false parity
claim. The pinned original reference is never modified by this diagnostic.
Nested Cards remain uncovered by this first-Card audit.


## 2026-10-08 — Pinned card-source targeted corrections

Source verification: `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`:
`apps/v4/registry/bases/radix/blocks/preview-02/cards/empty-distribute-track.tsx`
(and other two Empty blocks), `faq.tsx`, `preferences.tsx`, and the
eight pinned `apps/v4/registry/styles/style-*.css` component recipes.

**Fresh 528-row CI baseline (head `3f633e206a51dc43e7c82255afac18940873c0b2`)**:
previous height differences above 0.5px 410/528, new 400/528,
186 improved, 172 worsened. Largest Nova current differences: FAQ +87px,
Kitchen Island +45px, Preferences +42px, Sidebar Nav +36px,
Notification Settings +36px, Empty-distribute +28.75px, Empty-connect +28.75px.
This is a partial improvement, not total-card acceptance; see
`preview-01/current-report.json` in that run's QA artifact.

**This follow-up changes three source-proven component composition cases:**
1. Each Empty preview-02 source card uses `<Empty className="p-4">`
   (16px local padding) despite the style's default root padding 24/48px.
   QX Empty now provides a local public CSS override
   `--qxframe9a7c2-empty-padding`, independent of the semantic
   `empty-inset` role that sizes the icon and title. The three Preview 01
   instances set local 16px, preserving media size.
   Reference `cn-empty-media` also adds margin-bottom 8px; header gaps
   are 8px except dense Mira (4px). QX uses the existing density scale to
   project these, not `data-create-style` selectors.
2. Preferences source uses exactly two
   `<FieldSeparator className="-my-4 style-sera:hidden" />` instances.
   QX applies the `-my-4` margins to those two authored separators,
   retaining the shared QX Divider styling. The source-only Sera hidden
   modifier remains a known unmatched case.
3. FAQ source Accordion trigger and opened content padding across pinned
   styles: Vega16/Nova10/Maia16/Lyra10/Mira8/Luma16/Sera16/Rhea16 px.
   One registered `theme-accordion-padding` role derives from existing
   typography, density and container axes; preview CSS consumes it for both
   trigger and content, and uses theme font/weight/corner radius.

New checks: 8-style static contracts for all three cards and Accordion role;
16-mode browser computed inset/padding/margins/media/header geometry, retaining
0.5px tolerance. `verify-create-app-browser` continues remeasuring all
528 first-Card heights with the pinned reference, reporting both improvements
and regressions. None of this turns diagnostic height differences into a pass.

**Still open:** Accordion contained variants (Maia/Mira/Luma/Rhea) have
additional source-specific shell/border/inset treatment. The reference
`style-sera:hidden` FieldSeparator remains unmatched. Exact Empty text
wrapping, nested cards and per-card full-height parity require further QA.
No changes to runtime qxframe.js / Controller. PR #265 remains Draft.


## 2026-10-08 — Kitchen Island ItemMedia structural parity

Source-locked QX/static Item semantic correction:
`shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`
`apps/v4/registry/bases/radix/ui/item.tsx`,
`registry/styles/style-{vega,nova,maia,lyra,mira,luma,sera,rhea}.css`
and `blocks/preview-02/cards/kitchen-island.tsx`.

- `ItemMedia variant="icon"` is **unboxed 16×16px** in all eight
  upstream styles. It must not inherit EmptyMedia's separate **boxed**
  32/40px semantics. QX static ItemMedia previously added a 32px
  gray/bordered icon box; multiplied across four Kitchen slider rows this
  produced much of the +45px Nova card-height difference.
- Upstream `ItemGroup` gaps across all eight styles: base 16px, group
  containing sm children 10px, group containing xs 8px. QX previously
  hardcoded 8px regardless of child size. The shared ItemGroup now
  uses these source widths via modern `:has()` (no legacy browser
  fallback required).
- Kitchen Island's four sliders previously nested redundant
  `.qxframe9a7c2-item-media` inside another ItemMedia. The markup now
  mirrors the source's single ItemMedia, without altering Slider runtime.
- Static QA ensures shared selector contracts and exactly four
  single media slots. Browser QA on Preview 01 measures four rows ×
  eight styles, verifying icon 16×16, border 0, group gap 10px and
  one ItemMedia DOM element.

**Caution**: the source-linked structural change has not yet been
accepted by latest Actions at this checkpoint; the next 528-card
height diagnostic must determine actual net improvement. The full
nested-card/Preview 02 audits remain outstanding. No runtime JS edits.


## 2026-10-08 — SidebarNav / FieldContent / Item wrap source acceptance

Last **fully green** commit before this batch:
`0786b8cf758477eba8da5f7d202fa14144cfc722`, CI `37741832685`
release/windows-tools and schema `37741832686` successful. The
`[preview-01-first-card-diagnostic]` in its release job verified
**358/528** heights outside ±0.5px against the frozen source (previous
410/528). **244 improved**, **132 worsened**. Remaining Nova:
Kitchen Island +51, FAQ +45, Payments +42, Sidebar Nav +36,
Notification Settings +36. This is a diagnostic baseline, not a green
height-parity gate.

Pinned upstream evidence:
`ui/sidebar.tsx`, `ui/item.tsx`, `ui/field.tsx`, source
`blocks/preview-02/cards/sidebar-nav.tsx`, `payments.tsx`,
`notification-settings.tsx` and
`registry/styles/style-{vega,nova,maia,lyra,mira,luma,sera,rhea}.css`
from shadcn commit
`295a1f114a138f23b5dfee0e0c6812394dfeb90c`.

**Sidebar source layout** uses `SidebarMenu` gaps by style:
Vega 4px, Nova 0px, Maia 4px, Lyra 0px, Mira 1px,
Luma/Sera/Rhea 2px. A control-look recipe maps those categories
without per-style CSS selectors. SidebarGroup is 8px vertical
except dense Mira (4px), and the two authored Sidebar Groups
supply explicit 4px `pb-1` and `pt-1` seam insets. Nova's
old static 4px item gap across 7 in-between positions (=28px),
plus two 4px excess seam insets (=8px), explain its +36px
Sidebar height discrepancy as a source-supported hypothesis;
the next 528-row refresh must confirm rather than assume.

**FieldContent source gap**: Vega/Maia/Luma/Sera/Rhea 4px;
Nova/Lyra/Mira 2px. Shared
`.qxframe9a7c2-field-content` consumes one added
`theme-field-content-gap` role derived from existing `field-gap`
(default Nova 2px). Preview Preferences and Notification Settings
use it instead of fixed `.qxframe9a7c2-stack.is-gap-1`.
The existing public `--qxframe9a7c2-field-content-gap` wins.
Static/Blink checks measure both affected cards across 16 modes.

**Item text contract**: The upstream composed Item is `w-full flex-wrap`,
clamps title to one line and description to two. QX static Item
now reproduces those, preserving the earlier 10/14px md
padding scheme and 16px bare ItemMedia. Browser QA checks
the computed `-webkit-line-clamp`, actual two-line height and
full-width box at a narrow fixture across 16 modes.
No legacy browser fallbacks were added.

Outstanding: nested Cards, complete Item xs/sm theme size curves,
FAQ/Tabs/Slider structure and exact Cards' 528-height alignment;
all changed source contracts must pass current CI. Runtime Controller
and qxframe.js are unchanged. PR #265 stays Draft.


## 2026-10-08 — Browser-rooted Payments and Kitchen closeout

**Last confirmed green before this fix**:
HEAD `8c14677538b6ed1512e9fa9d629e52e99d2aaf47`,
release/windows `37744243988`, schema `37744243987`.
The `verify-create-app-browser` suite ran 19 checks. Its 528 current
first-Card height differences at tolerance 0.5px were **362/528**
(226 improved, 166 worsened vs original 410/528). Compared with
the immediately preceding 358/528 result, this version regressed by
four cases despite fixing Nova Sidebar exactly (377px QX = 377px
pinned reference). These values are diagnostics, not release gates.

The new `[preview-01-structure-nova]` browser report isolated two
root causes (rather than attempting Card height hacks):

- **Payments**: first Item unexpectedly rendered 139.25px and
  whole Card 540px vs source 431px. QX Item was corrected
  to `flex-wrap:wrap` earlier, but its `ItemContent` still used
  `flex:1 1 auto`. That content claimed intrinsic full width,
  forcing trailing chevrons into a new flex row. Pinned upstream
  `ui/item.tsx` uses `flex-1` = zero basis. QX shared
  `.qxframe9a7c2-item-content` now uses `flex:1 1 0`,
  retaining min-width:0 and the source's two-line clamp.
  Browser QA verifies all four Payments rows keep their trailing
  SVGs center-aligned on the same row in eight themes.

- **Kitchen Island**: QX Item row 54px despite correct unboxed
  ItemMedia icon and compact group gap. Its embedded native
  QX Slider consumed 32px height due to the standard button/control
  footprint; in the pinned React source the Slider visual
  dimension is determined by its thumb, and row height should
  follow the Item title + vertical padding instead. QX Slider
  now reads optional inherited
  `--qxframe9a7c2-slider-height` before falling back to its
  unchanged default control height. The four Kitchen instances
  set that variable locally to
  `var(--qxframe9a7c2-theme-slider-thumb)`; no runtime JS,
  private selector, global Slider shrinkage or duplicate token.
  Browser QA checks intrinsic thumb height vs Slider root and
  Item row geometry, including style-dependent padding.

The fallback keeps all existing Slider demos and author overrides
unchanged. No component pixel acceptance is declared until
the newly generated 528-row report shows the net effect.
Nested-card/full visual acceptance and other cards remain open.


## 2026-10-08 — FAQ and FieldContent label closeout

Verified head `dc6a9fa7ad855a156b8a3710f6127ee1bb31660f` passed
QXFRAME CI `37745480286` and CSS Schema Acceptance `37745480393`.
Browser interaction suite passed **20** steps and the refreshed 528-row
first Card diagnostics measured **330/528 >0.5px** compared with
362/528 on the preceding build and 410/528 in the initial report.
268 first Card records improved vs original and 124 worsened.
Nova Kitchen Island is now exactly **337px** versus frozen source 337px.
The remaining largest Nova height residuals are FAQ +45px,
Payments +42px, Notification Settings +28px,
Preferences −26px, Receiving Method +24.75px.

This new source-driven batch repairs two more composition mismatches:
1. Upstream `AccordionTrigger` in
   `apps/v4/registry/bases/radix/ui/accordion.tsx` uses a flex
   justify-between row **without** an added 16px gap. The QX
   Preview FAQ `.pv-accordion-item>summary` had `gap:1rem`;
   it now sets `gap:0` so the label has the full available
   width and avoids unintended line wraps. All earlier
   theme-controlled trigger/content insets remain unchanged.
2. In the source, `FieldContent` is independently composable
   alongside `Field`; it is not a child of `FormField.is-composed`.
   The QX `.qxframe9a7c2-field-content` previously provided
   only layout/gap, while label typography matched the theme
   **only** under `.qxframe9a7c2-form-field.is-composed`.
   Explicit `.qxframe9a7c2-field-content>.qxframe9a7c2-form-label`
   now consumes the already-registered shared Label font,
   line-height, and weight roles, with no new Theme inputs.
   This applies to Notification Settings and Preferences
   while preserving direct consumer style overrides.
3. The source-locked 8-style static and browser 8×light/dark
   checks assert FAQ gap zero and all five notification
   Label computed line heights match `theme-field-label-line-height`.
   Existing 528-row Card report remains diagnostic only.

No runtime qxframe.js changes, no loosening of QA constraints,
no private style selectors. **This batch's effect on 528
height differences must be measured by its latest CI**;
FAQ/Card height parity is not claimed yet. PR #265 remains Draft.


### Checkbox Field horizontal gap follow-up

The pinned eight `registry/styles/style-*.css` recipes specify
`cn-field` horizontal gap by style: Vega/Maia/Luma/Sera/Rhea 12px,
Nova/Lyra/Mira 8px. The QX `.qxframe9a7c2-check-field` had a
fixed 12px gap, ignoring the already-registered and tested
`theme-field-gap` role. It now consumes
`var(--qxframe9a7c2-check-field-gap,var(--qxframe9a7c2-theme-field-gap,.75rem))`;
public local override retains precedence.

This changes only CSS layout for checkbox Field compositions; input
state and handler behavior are untouched. The static eight-style
and browser 8 styles × 2 modes checks verify the source gap on all
five Notification Settings rows, alongside FAQ trigger and Label
line-height tests. All Card height claims remain pending the next
green 528-row diagnostic.


### Preferences FieldSeparator source-height correction

The validated `18d59c59a6782375644ce13a6046367770af11eb`
build passed QXFRAME CI run `37759206595` and Schema run `37759206598`.
Its 21 browser steps passed. First-Card height diff count remained
**330/528 >0.5px**. Nova FAQ improved 420→400px (ref 375);
Notifications improved 431→405px (ref 403), while
Preferences fell further to 367px (ref 405).

**Root cause verified against the pinned source**: each of the two
`<FieldSeparator className="-my-4 ..."/>` elements has a
**20px slot** (`cn-field-separator h-5`) with a 1px center
separator stroke. The earlier QX Preview used `<hr
class="qxframe9a7c2-divider pv-divider-bleed">` with a
1px layout height and the same -16px top/bottom margins.
That was **19px too little occupied layout height per separator**,
or 38px across two, exactly matching the Nova shortfall
(405 reference − 367 QX = 38).

The existing reusable Divider remains 1px by default. The
Preview instance modifier `.pv-divider-bleed` now gives it a
transparent 20px *layout slot*, with a centered 1px stroke
via ::after, while preserving `margin-block:-1rem`.
No extra token, no private component replacement and no
JS/runtime changes.

Static and 16-mode browser QA assert both separators' 20px
height and -16px margins as well as the transparent layout
slot. Full 528-row count and all-mode parity remain pending
latest CI, as source Sera explicitly hides those separator
instances (`style-sera:hidden`), still an independent
remaining behavior to handle.


### FieldSeparator final green CI checkpoint

Commit `a7d764b54b9887719c63ef225fef2e9c888bdfce`
passed both GitHub Actions workflows:
- QXFRAME CI `37760566328`: release + windows-tools success,
  21 Chromium createApp checks successful; PR Pages deploy skipped.
- CSS Schema Acceptance `37760566341`: success.

The regenerated `preview-01/current-report.json` in the run's
QA Reports artifact measures **316/528** source-locked first Card
height records beyond ±0.5px, down from 330 immediately prior
and 410 at S3 diagnostic start. Relative to the original,
270 cases improved, 120 worsened (height only). The new 20px
FieldSeparator layout correction eliminated 14 further
over-tolerance records, without changing reusable 1px
Divider CSS or the compiler.
Nova: Kitchen Island 337/337 exact, Sidebar Nav 377/377 exact,
Notification Settings 405 vs ref 403, FAQ 400 vs ref 375,
Payments 473 vs ref 431. Preferences had a prior -38px
residual and is now absent from the ten largest Nova outliers;
the QA artifact is authoritative for its precise value.
Source `style-sera:hidden` remains outstanding.

The preceding bad static regex contained double-escaped
backslashes and was repaired without changing the
CSS source or relaxing the ratchet.
**The 316/528 count is not full Card pixel/DOM acceptance.**


## 2026-10-08 — FAQ Typography/Tabs and editorial FieldSeparator

**Verified FAQ batch**: HEAD `c372bb81ddec9a03a529b0a048177f4008c34f67`
passed QXFRAME CI run `37764637779` (release/windows-tools),
CSS Schema Acceptance run `37764637828` and **21** Chromium
createApp checks. The 528-case diagnostic remained **316/528**
heights exceeding ±0.5px (272 improved / 126 worsened vs original
source reference). Nova FAQ improved **400px → 389px**
(reference **375px**), a measured 11px reduction, but not
full-Card parity. Nova Payments remains **473px**
(reference 431, +42px).

This FAQ batch corrects two source-backed projections, without
`[data-create-style]` CSS branches:

- The pinned Nova Accordion `cn-accordion-content` uses
  `text-sm` (14px / 20px). QX previously forced `line-height:1.5`
  (14px / 21px) even though the semantic
  `theme-text-leading` already resolves to **20/14**.
  Preview FAQ now consumes the shared `theme-text-leading`;
  browser tests assert real line-height equals text-size ×
  semantic leading for all eight styles × light/dark.
- The pinned `cn-tabs-list` horizontal list heights are:
  Vega/Maia/Luma 36px; Nova/Lyra/Mira/Rhea 32px;
  Sera 40px. QX FAQ `pv-tabs` previously occupied
  38px in Nova while its actual list was 32px, adding
  6px to the Card. The existing public
  `--qxframe9a7c2-tabs-height` API is now set **only**
  on the FAQ preview host, deriving its rail height
  from `max(32px, theme-control-height) − 6px`.
  All eight browser styles assert the actual rail
  geometry; no production Tabs behavior is changed.

**Sera FieldSeparator source case — current batch, CI pending**:

Upstream `preferences.tsx` explicitly uses two
`<FieldSeparator className="-my-4 style-sera:hidden" />`
instances. The earlier QX 20px slot reconstruction
rendered both in all styles. A single *generic* Theme role,
`field-separator-display`, now derives `none` for the
existing editorial text configuration (Sera default)
and `block` otherwise. The two authored Preview instances
consume that role with public
`--qxframe9a7c2-field-separator-display` taking precedence.
No style-named selector or runtime branch is added.
Static 8-style and Chromium 8×2 checks cover actual
display, 20px visible slot / 0px hidden bounding box,
and author override. The generic Divider still renders as
a 1px line outside this local instance.

Source reference remains pinned to
`shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`.
Only first Card height metrics are tracked; these changes
do not imply nested-Card, layout, visual or interaction
acceptance. Pending the latest Sera batch CI, the
**last confirmed** 528 height-over-tolerance count is
316/528, not an extrapolated improvement.


### 2026-10-08 — Roller Shades shared Slider height reuse

CI checkpoint at `8398f8ff5cea9517140db5599c76b6b1467bd58c`
was **fully green**, QXFRAME `37765996385` (release and
Windows tools), CSS Schema `37765996393`; the 21 browser
tests passed. After Sera's `FieldSeparator` conditional,
the source-locked first-Card over-tolerance count remains
**316/528**, versus the initial 410/528 (274 old-vs-new cases
improved; 124 worsened). The pinned 8-style source ref stays
`295a1f114a138f23b5dfee0e0c6812394dfeb90c`.
A zero difference in the total number of height mismatches
does not imply no changes in individual style/card heights.

A separate source check of `blocks/preview-02/cards/roller-shades.tsx`
found that its inline `<Slider className="flex-1" />` is
thumb-height-based, unlike the QX Slider's default 32px
standalone control footprint. This matches the earlier
measured Kitchen Island mismatch that was fixed using
the public local `--qxframe9a7c2-slider-height` override.
Now *only* the Roller Shades slider instance consumes
`var(--qxframe9a7c2-theme-slider-thumb)` via that existing
override. The reusable Slider's default geometry, all
input interactions, track, keyboard navigation and CSS
token roles remain unchanged.

Static QA asserts this instance uses the existing
author override, and the existing Kitchen Island
eight-style Chromium browser check now also validates
the Roller root's computed height against its handle
height. The actual effect on the 528-card height
diagnostic is **pending the latest CI**, and no precise
height improvement is claimed before measurement.


### 2026-10-08 — Receiving Method unboxed horizontal Field composition

Pinned source `apps/v4/registry/bases/radix/blocks/preview-02/cards/receiving-method.tsx`
places exactly two `Field orientation="horizontal" className="pb-2.5"`
inside `FieldLabel` within the RadioGroup; the radio choices
are **not** raised/bordered background Cards. QX previously
used two invented `.pv-choice-card` labels with `padding:
1rem 1rem 1.25rem`, a 1px border and selected background.
The extra 16px top + 20px bottom (compared with source 10px
bottom) is a measured source-consistent explanation for
much of Nova Receiving Method's +24.75px Card residual.

Both choices now compose existing framework primitives:
`.qxframe9a7c2-check-field` and
`.qxframe9a7c2-field-content`, with a single authored
non-framework instance modifier `.pv-choice-field`
contributing **only 10px bottom padding**. The custom
choice-card CSS rules and selected box chrome are removed.
The shared `theme-field-gap` / `theme-field-content-gap`
tokens continue to control spacing, including 8/12px
horizontal and 2/4px content gaps across the 8 source
styles. Native radio state/keyboard behavior and all
runtime Controller code remain unchanged.

Eight-style static markup checks and actual Chromium
8-style×light/dark×2 radio Field computed geometry checks
guard 10px bottom padding, no top padding/border,
selected bank radio and both token spacing roles.
The pinned source additionally specifies a
Sera-specific one-column choice layout
(`style-sera:grid-cols-1`), while the current QX
layout stays two columns; this is **still open**, not
silently claimed complete. Next 528-height CI result
must verify the actual effect, not an assumed reduction.


### 2026-10-08 — Shared ChoiceGroup column allocation

The pinned `receiving-method.tsx` RadioGroup source explicitly
uses 2 columns on the captured desktop viewport, except Sera
(`style-sera:grid-cols-1`). The QX preview's former
`pv-cols-2` fixed two-column layout could not reproduce Sera.

This difference is a cross-component **ChoiceGroup** layout
choice, not an incidental CSS patch. One new numeric
`theme-choice-group-columns` role projects from the
already-present editorial typography axis: 1 for editorial
(Sera), otherwise 2 for other styles. New reusable pure-CSS
`.qxframe9a7c2-choice-group` uses flex layout, not CSS Grid,
and resolves public per-instance
`--qxframe9a7c2-choice-group-columns` before the theme
default. Current Receiving Method uses this shared class.
No `[data-create-style]` selectors, no hard-coded Sera CSS
and no runtime JS.

New static 8-style Theme and component consumer checks,
plus browser 8 styles × dark/light checks, assert
Sera rows vertically stack, other styles have two
side-by-side radio choices, and the explicit one-column
override wins. Actual source-height effect remains
unconfirmed until the new full CI 528-height report
finishes. At narrower viewport widths, general
responsive behavior remains part of remaining parity QA.

## 2026-10-08 — Resumed S3: proven ItemMedia position bug (CI pending)

**GitHub-reconciled baseline:** Draft PR #265 at
`1f7e2ab8bfb7779df2c0b7006e21cb4de9bf9872` passed
QXFRAME CI [37769225703](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37769225703)
(release/windows-tools) and CSS Schema [37769225824](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37769225824).
The release job `113284794521` reported 22 createApp Chromium checks.
Source-locked first-Card height mismatches: **300/528**, previously
410/528 before the Stage-3 fixes, with 292 improved and 122 worsened
against the original actual heights. This supersedes the historical
316/528 and CI-pending notes above, not their implementation history.

**Pinned-source-backed correction:**
`shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`,
eight `apps/v4/registry/styles/style-*.css` files all specify
`cn-item-media` with `gap-2` and, when a descendant
`[data-slot=item-description]` exists, `self-start translate-y-0.5`.
The QX `item-surface.css` still centered its 16px media in the taller
Payments Item despite matching ItemContent's zero flex basis.
The shared Item now uses a documented `:has(.qxframe9a7c2-item-desc)`
media rule with `align-self:flex-start;transform:translateY(.125rem)`
and an internal 8px gap; a description-less Item retains center alignment.
Static source assertions and an 8 style × light/dark browser check read
the real icon top offset, transform and computed gap.
No Card heights, typography, runtime JS, theme token roles or test
tolerances are changed. **This addresses icon positioning only.**

**Still open**: Nova Payments +42px (all four QX descriptions presently
two lines at 268.86px text width); FAQ +14px (the first Accordion item
open, other two closed); Payout Threshold -22px; Upcoming Payments -18.5px;
Claimable Balance -18px; other 528 diagnostic discrepancies, nested Card
and Preview 02 full fidelity. Measured height is not visual acceptance.
The post-change CI and updated 528 summary are **pending**, and should
be recorded separately after they actually run. Keep PR #265 Draft.

### Confirmed post-ItemMedia CI, 2026-10-08

The code+test+documentation HEAD `b388b1f9568cf0458fb1dfce15588c498f45207d`
has **both CI workflows green**:
[QXFRAME CI #37771536451](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37771536451):
release and windows-tools passed, deploy-pages skipped for Draft PR;
[CSS Schema Acceptance #37771536361](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37771536361) passed.
CreateApp real Chromium gate: **23/23 checks passed**, including
`ItemMedia description alignment matches pinned source in eight styles and both modes`.

The corresponding release diagnostic still reports **300/528** first-Card
height differences over 0.5px (original 410/528), 292 improved and 122
worsened against original; heights did not change with this visual
icon-position fix. Nova Payments remains **473px versus reference 431px**
(+42px), FAQ **389px versus 375px** (+14px), Payout Threshold -22px,
Upcoming Payments -18.5px. Height-only diagnostics are not full visual
acceptance. Next work continues per-row source-locked measurements and
nested Cards; keep Draft PR #265 open without merge.


## 2026-10-08 — Audit PR #265 triage (22 candidates; CI not yet verified)

Input source: `AUDIT-PR265-ae56205.md` (review of commits through
`d661b282`). This audit contains evidence, but "22 problems" is not
itself an acceptance decision.

Candidate dispositions:
- #1: legacy-browser version mismatch is outside this task because the
  owner explicitly dropped older-version compatibility.
- #2–#5: InputGroup outer edge now consumes field theme surface, side
  border, invalid/warning/focus; one fixed control-height border box;
  inner fields fill the box; standalone connected addon alone loses
  its extra chrome. Separated/vertical addons retain their own border
  and muted background. Added Chromium 8-style × 2-mode comparison
  to normal field appearance/height and invalid state.
- #6: switch thumb extra width derives only from `switchLook=wide`,
  preserving default Luma 8px capsule without style-named logic.
- #7: `radius:none + controlShape:pill` respects the explicit pill
  choice unless a per-category shape overrides it.
- #15: card/dialog 24px cap applies to all radius allocations, not
  just smooth; all 8 presets × allocations checked.
- #16: three registered loading-animation names return `none` for
  motion:none; Skeleton/Spinner/Loading consume their names, durations
  derive from existing Theme time and Accordion uses duration-md.
- #17: ThemeHeader parser now requires the current complete export,
  rejects duplicates/malformed/missing/contradictory config rows,
  and returns no config upon failure. Old-version migration is not
  promised implicitly.
- #18: random/reset base candidates respect locked theme/chart;
  matching menu accent/menuColor constraint preserved.
- #20: the three FAQ details share a native `name` value to enforce
  single-open/collapsible behavior. **Remaining**: replace the
  preview-private Accordion visual owner with framework Collapse
  composition instead of claiming complete reuse.
- #21: both theme blocks now enumerate all 162 existing roles;
  three registered animation roles bring the inventory to **165**.
  Generator, generated `src/styles/main/theme.css`, and
  `tools/css-gates.mjs` updated together. Theme file now exceeds
  the historical 16KB *warning* threshold; this is explicitly
  expected from v3's full-dark-list contract, not a hidden exception.
- #22: reusable Item link owns matching accent background/foreground,
  including its description in hover/focus/active, avoiding dark/text
  contrast failures. The other sidebar hover accent consumer is paired.

**Not closed**: #8 Empty 3-tier glyph/content gaps; #14 underline
shape policy under discussion; #19 preview Table reuse; #20 reusable
Collapse appearance; #9–#13 historical runtime defects. Runtime
`qxframe.js` is frozen by the current v3 Stage 3 mandate; numeric,
calendar week and async core fixes require a separately authorized
runtime patch. Existing first-Card 300/528 over-tolerance baseline
still applies until a fresh successful browser diagnostic is read.

New source and browser tests are committed. Pending results at
`4304f90384e3b71cdfe41308c157e27d37390238`
(or newer documentation HEAD); any GitHub Actions failure must
be investigated before calling the batch accepted. Keep #265 Draft.

### Follow-up to audit #8: pinned Empty glyph and action gaps

Reopened the exact shadcn-ui/ui pinned `style-*.css` files for all
8 styles. Source `cn-empty-media-icon` SVG sizes: Vega/Maia 24px;
Luma/Sera/Rhea 20px; Nova/Lyra/Mira 16px, while media boxes stay
40px and 32px respectively. Source `cn-empty-content` gaps:
Mira 8px, Nova/Lyra 10px, all remaining styles 16px. This verifies
#8, rather than assuming it from the audit report.

Two shared Theme roles `empty-icon-size` / `empty-content-gap` now
express these differences, the compiler and generated default full
light/dark file are synchronized (167 total roles), and composed
Empty consumes them with public instance overrides. The 8 styles ×
2 modes static/Chromium checks now inspect the SVG *inside* the media
box and computed gaps of EmptyContent children. Compact/spacious
padding tier still determines structural media sizing, as before.
Do not claim first-Card height improvements until a new green CI
report is measured; QA status for this code batch remains pending.


## 2026-10-08 — Stage 3 #19/#20 actual Table + Collapse owners

Pinned source: `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`,
`apps/v4/registry/styles/style-{vega,nova,maia,lyra,mira,luma,sera,rhea}.css`.

### #19 Embedded Table

Both Create previews now render authored HTML using
`qxframe9a7c2-table is-embedded is-hover` and the actual framework
`src/styles/components/table.css` owner. Preview's duplicate
`pv-table` class and table paint rules have been deleted; the
app-specific 40px and 32px icon/action columns remain ordinary
private width utilities, not a second Table renderer.
Theme inventory adds only `table-cell-inset` and
`table-heading-foreground`, keeping base typography under the
existing `text-size` axis and line-height as a CSS formula.
Source default cell padding is 8px (Vega/Nova/Lyra/Mira/Rhea),
12px (Maia/Luma/Sera), with head row height 40/48px respectively.
Sera alone has the muted editorial header foreground, 12px
uppercase tracking. Native `Table` runtime and sizing modes are
otherwise unchanged. Source text line heights are 16px at 12px
and 20px at 14px; the next QA report must confirm the updated
formula removes the +6px Recent Transactions regression detected
after the initial Table migration.

### #20 Native FAQ backed by shared Collapse

FAQ is now `qxframe9a7c2-collapse is-native`, three
`qxframe9a7c2-collapse-item` native details with one shared
`name`, `qxframe9a7c2-collapse-header` summaries, and
`qxframe9a7c2-collapse-content` panels. Geometry, icon
transform/motion, border, text and font roles live solely in
`src/styles/components/collapse.css`. No preview-local
`pv-accordion` remains. This is a strictly opt-in static
native variant; existing JS-driven Collapse behavior and
Controller source are frozen. Tests still enforce single-open,
re-collapsible state and the source 8-style FAQ inset/leading.

### Evidence and continuation

- CSS Schema Acceptance run #37779358028: success on
  `64c604c4`. Its Chromium gate passed 27/27 steps including
  new Table/FAQ fixtures in all 16 style×mode combinations.
- At that checkpoint the 528 first-Card diagnostic remained
  252 beyond ±0.5px, with 308 items improved and 128 worsened
  relative to the original. Nova Recent Transactions moved
  from +10px to +16px. **Do not mark this as improvement.**
- The follow-up Table line-height change is at
  `914f62db930e107395bed49548566b9d479543e6`.
  Read a newer green diagnostic before claiming its effect.
- The project state / PR disposition are updated separately.
  No main merge, no relaxed CSS or visual source gate.


## 2026-10-08 — source FAQ Tabs content parity; branch consolidation

The owner deleted old remote branches; GitHub now reports precisely `main`,
`backup/main-before-pr265-2026-10-08`, `redesign/create`. The
fixed backup points to the unmerged main SHA `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
Do not modify this backup or merge PR #265 while Stage 3 remains unaccepted.

Pinned source: `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`,
`apps/v4/registry/bases/radix/blocks/preview-02/cards/faq.tsx`.
It declares three independent question lists: General, Billing, Goals,
with three questions each. The QX preview previously exposed all three tab
labels but always displayed the General questions. This is behavioral and
content drift even when the initial Card geometry is close.

The Preview now authors all nine source questions in three opt-in framework
`qxframe9a7c2-collapse is-native` groups. Actual `QX.Components.Tabs`
remains the sole activation owner: `onChange` projects the selection into
the active content panel's native `hidden` state, while `collapse.css`
implements the corresponding hidden display rule. There is no preview-owned
Accordion CSS or extra Tabs controller; QX runtime JS is unchanged.
The three `details name` groups each retain single-open, collapsible behavior.
The initial General panel has the same markup and layout as before. Hidden
Billing/Goals do not participate in geometry, so this is not a Card-height
fix.

Static verification now counts nine FAQ questions, checks all tab keys and
preserved source text, and asserts one shared hidden owner. The new real
Chromium test switches General → Billing → Goals → General, checks the
visible text, 3 distinct `details name` groups, and Billing one-open state.
**Pending:** both GitHub Actions workflows on the final HEAD must pass;
28/28 createApp browser steps is the target, not yet an asserted result.
The previously confirmed `252/528` >±0.5px diagnostic is still the
last validated measurement; this task does not relax or rebaseline it.
