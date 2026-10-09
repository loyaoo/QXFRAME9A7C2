# QXFRAME9A7C2 AI Work State

> Persistent recovery checkpoint. Read `AGENTS.md` first.
> Git / PR / CI facts override stale text here. Always query the current branch, PR and Actions before continuing.
> Keep CURRENT concise. Historical investigation belongs in Git history and task change documents.

## CURRENT — 2026-10-09 CREATEAPP-V3-S3

- Batch closeout from green `615d72d2` (QXFRAME CI and CSS Schema both passed, 116/528). Locked Sera source `.cn-badge` is transparent, no border/inset, uppercase 10px/14.2857px vs QX 12px/18px with 20px minimum; Claimable +5.72px is exactly the Badge box. Added shared semantic `Badge.is-status-label` and `BadgeIndicator`, 4 closed Badge Theme inputs; normal 20px outline Badge also adopts source line metrics. Sera StockPerformance `Separator className="style-sera:hidden"` was incorrectly always visible; uses existing `field-separator-display` Theme policy via shared `Divider.is-theme-optional`, predicted −17px correction. CoverArt source Footer `flex-col gap-2` and Item `aspect-square` with 40px icon: moved preview-only `pv-square` to shared `Item.is-artwork/ItemArtworkLabel` and `CardFooter.is-column` with 8px natural gap, no fixed Card height. Added strict static/browser source geometry and extended paired target reports for Sera Payout/Preferences/Cover, Vega Kitchen, recent transactions. CI pending.
- Last same-browser `0b50751f` result **118/528** height deltas >0.5px, 528/528 present, Card geometry subset 0 differences, five Syncing State target styles exactly 0px; `main` and backup unchanged. On this SHA both CI suites failed an incorrect Rhea 24px test assumption: frozen Rhea default Card padding is p20=20px; test now requires actual 20px, no production modification or threshold change.
- Sera FAQ +14px root cause in paired DOM: source Footer 40px tall with two **full-width, shrink-0** Buttons side by side overflowing the horizontal content, no gap; QX app CSS forced both Buttons to `flex:1 1 auto`, widths halved and first label wrapped making Footer 86px tall. Reuse shared `Button.is-block` + new generic `Button.is-no-shrink` and `CardFooter.is-gap-0` only for the source FAQ instance; do not hardcode Button/Card heights. Added static, standalone browser and source-paired Sera Footer and Card ≤0.5px gates. Pending new CI.
- Source-locked Syncing State paired nodes (Sera/Vega/Nova/Maia/Luma): QX Card padding top already matched source, but **missing bottom Card padding** (16/24/32px) while QX Empty root was **8px taller** for ordinary styles and 6px taller for Sera, resulting −8/−16/−26px Card gaps. Upstream JSX puts EmptyMedia inside EmptyHeader; QX put it beside EmptyHeader, adding 8px to the root. New `Card.is-content-only` shared semantic gives root symmetric natural padding and sole CardContent zero inset; Syncing markup nests media in header. Reuses existing empty padding p-4; Sera's source `.cn-empty-description mt-0.5` gets a single `empty-description-offset` Theme role (2px editorial,0 others). Algebra from measured nodes gives exact source Card height for five styles; added same-browser 0.5px Card source gates plus 8-style browser structure tests. No hardcoded heights. CI pending.
- Corrected the temporary Sera Dividend fix after pinned shadcn `style-sera.css` showed `.cn-item-title { text-xs leading-snug font-semibold uppercase }`. The QX shared `ItemTitle` already mapped font/weight but failed to consume existing `--theme-control-transform:uppercase`. Replaced per-title forced `nowrap/max-content` (which introduced Vega/Maia/Luma regressions) with semantic `text-transform:var(--theme-control-transform,none)` on every shared ItemTitle. All four authored Dividend titles return to one common class; tests require eight-style uppercase/none computed parity plus Sera paired natural first-row/whole-Card geometry. Latest CI pending.
- Latest `8bae71d0` same Chromium geometry confirmed **Sera Dividend 606.25/606.25px and Lyra FAQ 359/359px, both whole Card = 0px**, without fixed heights or lowered ±0.5px tolerance. 528 total height diagnostic **146/528**, up from previous 144 due to three other style families gaining one Dividend mismatch each (Vega/Maia/Luma, both light/dark), while two previous Lyra/Sera mismatches closed. Do not conceal the net regression. Added paired node logs for those three Divider variants and focused Syncing State (Sera −26, other families −16), to find a shared rather than per-Card fix.
- `8bae71d0` Release found a historical static test counting only `class="... is-wrapping"` and therefore excluding the new single-line modifier. Updated the strict test to require four ItemTitle instances **and exactly one intrinsic first-title variant**. CSS Schema result pending.
- Dividend remaining +5.25px (Sera) traced to *Flex item line packing*, not Card padding: pinned first `ItemTitle` 103.3px wide, 16.5px tall; QX first title 74.02px wide, 33px tall. Its weaker min-content permits three children to stay on first Flex row rather than wrapping amount to second row like source. Added shared `ItemTitle.is-intrinsic-line` (nowrap/max-content minimum) on first Vanguard title only. The Item remains natural flex and all four children/sibling structures unchanged; added same-Chromium first-row/first-title ≤0.5px source parity gate and browser text-wrap check. CI pending.
- Lyra FAQ remaining +4px isolated to two single-line Accordion triggers: locked source trigger38px vs QX40px, because QX's 16px chevron has 2px top margin in the 16px Lyra typography line; two-line second trigger is already exact. Shared native Collapse icon margin now clamps the offset by `accordion-line-height - 1rem`: Lyra0px, other pinned styles2px. Adds same-Chromium Lyra source trigger and whole-Card ≤0.5px gates plus all-style browser margin assertion, with no new token.
- `fb60960` CSS Schema browser reached an old Receiving Method test that still expected zero RadioField top padding and border; source now explicitly demands themed inset and 1px FieldLabel border (verified Maia/Luma exact in same browser). Updated those obsolete expectations to require the actual Theme inset and border, unchanged 10px bottom. CI pending.
- `11443533` pinned same-browser geometry measured **144/528** >0.5px (down from 154), Sera Claimable +5.72px (was +32.38), Lyra FAQ +4px (was +31.5); source lock/528/528/four-property gate retained.
- Its Release failed a stale CSS regex still requiring Accordion's generic text-leading; remediated the assertion to verify the new dedicated source-derived `accordion-line-height` for eight styles, including exact Mira 19.5px. CSS Schema browser failed an absolute Maia RadioField 91.5px check in a *different font/browser context*, even though paired same-browser source and QX both measured 91.5px. Moved the absolute 91.5px acceptance to the source-paired Chromium QA and retained browser acceptance of every row's exact natural content+padding+border height. Removed accidental duplicate Nova target key. CI pending; no numerical geometry tolerance lowered.
- Source CardTitle `text-5xl` leading: pinned Vega CardTitle `leading-normal` (48px*1.5), Nova `leading-snug` (48px*1.375), other styles lack a leading override so Tailwind `text-5xl` is tight 48/48. QX `pv-text-5xl` only changed font size and inherited theme heading-leading, causing Sera 74.6667px vs 48px source, Maia/Luma/Rhea 72px vs48px, Lyra/Mira68.57px vs48px. Moved display semantics into shared `CardTitle.is-display`, source style leading role in closed Theme, removed private `.pv-text-5xl` and added 8-style browser/static gate. Further Sera badge +5.7px divergence remains separately measured. Latest CI pending, do not claim net count yet.
- Next pinned Lyra FAQ correction (newest CI pending): QX shared native Accordion inherited 19.5px body leading, but locked Lyra source `text-xs` uses 12px/16px for both trigger and content. Three question headings (4 rendered lines total) add 14px and five content lines add 17.5px: exact **+31.5px** whole FAQ delta. Added shared `accordion-line-height` Theme input (Lyra16px, Mira19.5px, others20px), consumed by native Collapse root/content only, preserving Controller-driven Collapse and existing body text role. Updated static and 8-style light/dark Chromium line-height checks. Sera FAQ added to same-browser node diagnostics.
- Previous same-browser paired geometry (d58d740c, source-preview-geometry job `113635342375`): height outliers **168/528 → 154/528**; Maia/Luma Receiving Method and Maia/Luma/Sera Sidebar Nav all now exact whole Card height matches (0px). It did **not** alter other source component strict checks. Prior Release failed only an obsolete RadioField private padding regex, replaced in b3e8773; latest source count CI pending.
- Source-locked paired node evidence from `3c635463` identifies Maia/Luma Receiving Method radio FieldSet exactly **91.5px upstream vs 55px QX** (−36.5px Card), caused by missing 1px FieldLabel border and p-4 top/inline Field inset; source Bank Transfer title wraps at width95.42px (19.25px leading). Added shared `CheckField.is-choice` and `FieldTitle` roles with closed style-based inset token, preserving authored pb-2.5 override; no fixed row/card height.
- Sidebar Nav Maia/Luma/Sera upstream has **nine 36px SidebarMenuButtons**, QX had nine 32px private preview links (−36px Card). Replaced preview paint with shared `SidebarMenuButton`/`SidebarGroupLabel` compositions and a closed Theme height role; source gap and per-instance active state retained. New static/Chromium tests. **CI and paired count pending**; last confirmed 168/528.
- Next measured-pair batch: shared ItemContent opt-in now uses the source `flex:1 1 0%` (was `0px`) alongside intrinsic min-width and unclamped title, to resolve Sera Dividend's remaining +5.25px first-row wrapping without per-Card constants. Static/Chromium test checks computed flex-basis.
- Existing same-browser node probe extended to Maia/Luma Receiving Method, Maia/Luma/Sera Sidebar Nav, Sera Claimable Balance and Lyra FAQ; inspect actual DOM paddings/borders/line heights before changing shared Field/Sidebar primitives. New CI results pending; previous 168/528 remains the last **confirmed** diagnostic.
- Branch `redesign/create`, PR #265 **Draft**, do not merge; `main` and `backup/main-before-pr265-2026-10-08` both frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- Latest geometry code checkpoint: `c81856991cbdb6176f9d9742cbbc2a27420d0fdb`. Same-browser source-locked 528-pair audit passed its measurement job: **182/528 → 168/528** height differences >0.5px (handoff 202/528). **Mira/Nova Upcoming Payments now both exactly 0px whole-Card height delta**, with source 40px day cells, 8/12px padding, 40px navigation and 4/5/6-week month geometry. Rhea/Maia FAQ remain 0px; Sera Dividend remains +5.25px. Controlled 66 Luma radius exceptions and ±0.5px tolerance unchanged.
- Source provenance: `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`; matched computed Calendar/Item CSS through `tools/qa/preview-01-audit.mjs` in the same Chromium process. Shared `Calendar.is-adaptive-month` opted in from Preview 01; hosted DatePicker retains its regular six-week presentation. Sera `ItemTitle.is-wrapping` drops legacy max-width cap, but Dividend first row still differs +5.25px; do not force sizes without source evidence.
- `c8185699` Release job failed a **stale static HTML attribute adjacency assertion**; revised the test to require both real `data-pv-calendar-layout` and `data-value` attributes while permitting intervening attributes. Added keyboard regression to guard against invisible focus when hidden outside-only week changes the view. New combined docs/test commit CI is pending; do not mark latest HEAD green prematurely.
- NEXT EXACT STEPS: inspect latest Actions/Chromium, fix failures; reduce top source-paired remaining deltas (Receiving Method Maia/Luma −36.5px, Sidebar Nav Maia/Luma/Sera −36px, Sera Claimable Balance +32.375px, Lyra FAQ +31.5px). Keep core `qxframe.js` identical to main, do not redo prior phases. Update PR body and QA report for confirmed HEAD.
- Program ~65%, Stage 3 ~64% prior provisional estimates; Stage 3 full visual/nested-card acceptance **not complete**.

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

2026-10-09 CREATEAPP-V3-S3 Upcoming Payments date semantic restoration (CI pending):
- The locked shadcn `UpcomingPayments` initializes Calendar selected value with `useState(new Date())`; payment rows carry independent fixed Apr 2024 text. QX had bound calendar to 2024-04-15, incorrectly showing a different current month and selected day.
- Preview now uses generic `data-value="today"` and resolves to live `new Date()` ONLY as an instance argument to the existing QX `Calendar.create`. No framework JS/controller mutation, no private datepicker. Added static and real Chromium selected/today assertions; calendar layout size/row chrome still to be investigated.
- NEXT EXACT STEP: verify latest HEAD CI and paired geometry; Calendar padding/week cell sizes in shared picker-family/date-panel CSS remain the source of Mira/Nova Upcoming height mismatch; no arbitrary fixed Card height. Keep PR Draft and main/backup pinned.

2026-10-09 CREATEAPP-V3-S3 FAQ trigger box-model correction (CI pending):
- Source-preview-geometry on 71b74b98 succeeded: height diagnostics decreased **202/528 -> 192/528**; paired Sera Dividend -44.25px -> +5.25px, Rhea FAQ -68px -> -6px, Maia FAQ -48px -> -6px. Paired 528 property exceptions remain exactly the 66 v3-mandated Luma radius caps.
- Remaining -6px for Rhea/Maia FAQ traced to 3 original AccordionTrigger 1px transparent borders at top/bottom, absent in QX native Collapse summaries (source each 74px vs QX 72px). Applied shared 1px transparent summary border and Chromium+static assertions; no Card height hacks.
- Earlier 71b74b98 release job failed only because the closed theme catalog had three new tokens not yet mirrored in generated default root/dark theme.css; commit 1f678de4 synchronizes that default CSS without weakening gate. Verify newest CI before acceptance.
- Upcoming Payments remains Mira -48.89px, Nova -18.5px pending Calendar geometry. NEXT EXACT STEP: inspect full newest CI and remaining paired 528 diagnostics, address shared Calendar next, update PR body. No main/backup edits, PR Draft.
2026-10-09 CREATEAPP-V3-S3 pinned paired node remediation (CI pending):
- First sibling-topology commit 0d69fe72: source-preview-geometry passed, 528/528 measured and 202/528 outlier heights unchanged; Sera Dividend reduced from roughly -89.75px to -44.25px (44–45px recovered). CSS Schema #37869373895 succeeded; release final status to verify.
- Paired Rhea FAQ source Accordion has 1px outer frame, 16px trigger/content inline inset and 24px trigger icon gap; QX shared native Collapse previously had 0 for all three. Maia/Rhea/Luma/Mira use framed source style, Sera is gap-only editorial; added closed Theme recipe inputs for framed/overflow/trigger-gap and switched shared Collapse native adapter to consume these without component-name/style selectors or hardcoded Card heights.
- Sera Dividend ItemContent/source title can wrap with intrinsic minimum and flex/w-fit title; QX legacy clamping remains default, new shared .is-intrinsic/.is-wrapping options used only where pinned source requires them.
- NEXT EXACT STEP: Actions on newest HEAD, compare same-browser 202/528 diagnostic and targeted FAQ/Dividend geometry, inspect regressions, keep main and backup unchanged and PR #265 Draft.

2026-10-09 CREATEAPP-V3-S3 source-locked Dividend sibling-structure batch (CI pending):
- Recovered GitHub baseline: PR #265 Draft, HEAD 65c80d018615e191da13448a7bf8a5472dd1f471, both QXFRAME CI #37866512674 and CSS Schema #37866512679 successful; latest paired Chromium 33/33 and 202/528 first-Card height outliers. Historical "CI pending" at top of CURRENT is superseded.
- Source `dividend-income.tsx` mounts ItemContent, ChartContainer and amount span as THREE direct Item flex children. The QX example incorrectly grouped chart + amount into a fourth-layer ItemActions, changing flex wrapping at narrow Sera card widths. Removed only that extra markup, preserving real QX Item CSS and data.
- Added static and eight-theme real Chromium direct-child topology regression. Extended the pinned same-browser QA to log node-level source/QX for Sera Dividend, Rhea/Maia FAQ, Mira/Nova Upcoming Payments; no tolerance changes and no runtime Controller edits.
- NEXT EXACT STEP: run both workflows, retrieve source-preview-geometry paired rows and target node traces, decide additional shared Item/Collapse/Calendar fixes by measured cause. Reconcile 202/528 baseline before claiming any numerical improvement. Keep main and backup unchanged and PR #265 Draft.

2026-10-09 Stage 3 Payout/Claimable root cause resolved (CI pending):
- Paired source Nova geometry in source QA run #37865241466: Payout net -22px combined **Slider height +28px** (QX32px/source4px) with **Textarea -50px** (QX50px/source100px). Claimable -18px was entirely a 48px QX CardTitle line box instead of source66px.
- Claimable `pv-text-5xl` no longer replaces CardTitle's `line-height:1.375`, restoring source 374px. Payout opts into reusable `Slider.is-track-height` (root height equals its theme rail height) using the existing preview controller and preserves keyboard value handling.
- Computed Nova Textarea traced `min-height:32px` despite static `5rem` and authored `6.25rem` because `src/styles/main/theme-visual-v2.css` used an overlapping high-specificity `.qxframe9a7c2-form-textarea[class]` group with `min-height:var(--_qxframe9a7c2-control-height)`. Separated shared typography/padding from single-line minimum height: Buttons/Inputs/Selects keep Control sizing; Textarea now consumes native Form/Textarea 5rem and optional authored 6.25rem without override. Added static and real Chromium contracts for exact 100px Textarea and 468px Nova Payout Card. No JS runtime Controller modifications.
- New CI must pass at final HEAD before marking acceptance; prior 216/528 was a transient after slider correction and before Textarea repair. PR #265 remains Draft and `main`/backup pinned.

Stage 3 next sub-batch (2026-10-09): paired Nova node geometry from source run #37865241466 identified Claimable Balance's entire -18px height deficit as CardTitle 48px instead of pinned 66px (the `pv-text-5xl` utility wrongly forced `line-height:1`). Removed that override so the CardTitle's standard leading-snug controls text layout. Payout Threshold's net -22px actually combines source Slider root 4px vs QX 32px (+28px) and source Notes textarea 100px vs QX 50px (-50px); added reusable framework `Slider.is-track-height` that sizes its root to the actual theme rail, and activated this option only in Payout Threshold. Static and browser checks now enforce Nova Claimable Card =374px and title=66px, Payout Slider root=4px while existing keyboard/value semantics remain. Detailed computed textarea diagnostic pending; do not globally change Textarea without this evidence. PR #265 remains Draft, `main` and pre-merge backup unmodified. New source CI/Release validation pending; earlier 210/528 remains last verified paired figure.

LATEST Stage 3 source-parity batch: `SyncingState` upstream `Empty className="p-4"` requires 16px instance padding in every style, but Preview omitted that override (spacious styles inherited up to 48px). Applied the already supported `--qxframe9a7c2-empty-padding:1rem` directly on its composed Empty instance; no global Empty CSS/token or Controller change. Added static + Chromium eight-style × light/dark padding gate. Pending paired CI for this, Loading Card gap-2, and FAQ segmented Tabs; do not claim completion until the latest HEAD passes.

LATEST Stage 3 visual follow-up: FAQ's three tabs are now configured as framework-owned `Tabs type="segmented"` using `data-type="segmented"` rather than QX's line/underline default. This follows the pinned shadcn `TabsList` muted band and active segment, reuses existing public Tabs CSS/Controller, and adds static + browser type assertions. Await exact paired CI height diagnostics for this and the Loading gap-2 fix. Do not merge PR #265.

2026-10-09 CREATEAPP-V3-S3 — same-browser pinned source QA and Loading Card follow-up:
- PR #265 is still Draft, on `redesign/create`; no merge, `main` and `backup/main-before-pr265-2026-10-08` stay at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- Wired existing `tools/qa/preview-01-audit.mjs` into a dedicated QXFRAME CI `source-preview-geometry` job. This job checks out pinned shadcn source at `295a1f114a138f23b5dfee0e0c6812394dfeb90c`, verifies all **159 source hashes**, builds the reference, renders it and QX in **one Linux Chromium**, records/uploads 528 Card measurements and Nova screenshots. The source renderer is not part of framework/build output.
- First actual same-browser result, run [#37862646440](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37862646440): **528/528 measured, no page errors, 226/528 heights differ >0.5px**. Exactly **66** core-geometry differences are solely Luma source radius 26px vs v3 §4.5 mandatory QX Card maximum 24px (33 cards × 2 modes). All other core radius/title/inset/top properties match. Initial strict CI check rejected these 66; revised validator now hard-locks the *exact* v3-authorized cap and rejects every other deviation; [#37863258225](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37863258225) source job passed.
- Source/QX Nova Loading Card instrumented: source Skeleton content Stack has **8px** gaps and total card height **348px**; QX Stack inherited theme's **16px** gap causing 364px height; identical +16px across all eight styles. Added shared `qxframe9a7c2-flex.is-gap-2` / `qxframe9a7c2-stack.is-gap-2` with 8px and applied to Loading Card's three-line and button-row wrappers. Static and real browser gates now require source-locked heights in 8 styles × 2 modes. **New CI pending**; do not claim reduced 226/528 before the final source job measures it.
- Do not weaken original v3 24px container cap or old 528 data. No `qxframe.js`/Controller modifications; report only verified diagnostics. Subsequent geometry priorities: Syncing State (source vs QX Empty), FAQ Tabs visual variant, Payout Threshold and Upcoming Payments. Check CI latest HEAD before accepting.

PAYOUT THRESHOLD FUNCTIONAL SOURCE FIX (2026-10-08, after same-browser Item QA):
- Pinned upstream `payout-threshold.tsx` updates `$2500.00` as the Slider changes; the QX Preview previously displayed an inert label despite working Slider ValueController.
- `preview-01.html` adds a generic data-keyed output label and `data-pv-output-format="money-2"` on the existing QX Slider. `preview-cards.js` registers `Slider.onChange` to project the value, without a second value state or new input implementation. Added static gate and real keyboard ArrowRight/ArrowLeft browser assertion.
- This is content/interaction parity, not a geometry correction; baseline 252/528 out-of-tolerance remains diagnostic, not a pass gate. The new HEAD after docs must pass both workflows before completion is reported. Keep PR #265 Draft and main/backup unchanged.

SOURCE-FONT GEOMETRY INVESTIGATION (2026-10-08, Stage 3 continuing):
- Pinned Windows Chrome reference source capture vs Linux Chromium implementation measurement uses different real fonts even when both declare `system-ui`. Historical Payments +42px should not trigger a CSS size hack.
- Real browser source CSS Item fixture using the SAME CSS font in the SAME Linux Chromium now proves all 4 Nova Payments rows have identical source/QX geometry (87.25px each, 268.859px content, description 2×21px). CSS Schema run #37794980057 passed **29/29** createApp checks at code SHA `2f950ca8`.
- The 528-row diagnostic remains 252 out of ±0.5px, unrebased, with explicit cross-platform-font warning in its summary. Source comparison is pinned to upstream `295a1f11` and directly verifies the shared Item contract; **no CSS or Controller change** in this batch.
- Final code/documentation SHA is after the above check; verify both QXFRAME CI and CSS Schema Acceptance at the newest HEAD before treating this as a green checkpoint. PR #265 stays Draft.

LATEST CONTINUATION — 2026-10-08 (PR #265 Draft, not merged):
- User pruned historical branches: verified exact GitHub list is only `main`, `backup/main-before-pr265-2026-10-08`, and active `redesign/create`. Backup and `main` both remain at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`; never advance the backup ref.
- Stage 3 continued at current source branch: FAQ General/Billing/Goals are now three genuinely independent question panels (3 questions each) copied from pinned shadcn `faq.tsx`; previously Tabs changed the active label but General content always remained visible.
- `docs/create/preview-cards.js` uses QX `Tabs.create({onChange})` as the sole selection owner, toggling authored framework Collapse panels via `hidden`. Shared `collapse.css` owns `.is-native[hidden]` display, not a duplicate private FAQ implementation. Each question panel uses native exclusive/collapsible `details`.
- Added static nine-question / three-panel contract and Chromium Tabs/FAQ switching test; expected createApp browser steps: 28. No runtime Controller or `qxframe.js` change. CSS design ratchet and locked ±0.5px geometry gates unchanged.
- Code checkpoint: `31176234106a13ac9ae2378b1d7c088f84a07815` (last code commit; subsequent state/QA updates may advance the branch). Two workflows must be green on the final document HEAD before acceptance. One intermediate release failure at `0b1d741c` was test-only (old FAQ header count 3 versus new 9), fixed at `2f0b3151`; do not treat earlier failed or canceled runs as final.
- Previous accepted green geometry result remains 252/528 first-Card heights outside ±0.5px, including Nova Payments +42px and FAQ +14px; **no new height improvement is claimed** until final Actions produce source-locked measurements. Program ~62%, Stage 3 ~58% provisional. Keep Draft; no main merge.

Task: `CREATEAPP-V3-S3` — source-locked Preview 01 geometry, ongoing.
Branch `redesign/create`, open Draft PR #265. Stages 0–2 merged;
40/40 runtime Controller work and 624/624 shared Card subset already
accepted. Do **not** restart either. qxframe.js remains frozen.

REAL-TIME RECOVERY, 2026-10-08:
- PR #265 at verified green baseline HEAD
  `1f7e2ab8bfb7779df2c0b7006e21cb4de9bf9872`,
  still Draft/open, based on main `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- QXFRAME CI `37769225703`: release success, windows-tools success;
  deploy-pages skipped (expected on PR).
- CSS Schema Acceptance `37769225824`: schema-acceptance success.
- Chromium createApp browser gate: **22 checks** passed.
- Latest successful source-locked first-Card height diagnostic:
  **300/528** over ±0.5px (initially 410/528), 292 improved vs
  old and 122 worsened. *Diagnostic only*, not full Card alignment.
- Nova light residuals: Payments +42px, FAQ +14px,
  Payout Threshold -22px, Upcoming Payments -18.5px,
  Claimable Balance -18px, Loading Card +16px.
  Kitchen Island 337/337px and Sidebar Nav 377/377px match height
  (not full visual acceptance).

LATEST VERIFIED GREEN S3 BATCH:
- Source/QA/documentation checkpoint HEAD `b388b1f9568cf0458fb1dfce15588c498f45207d`
  passed QXFRAME CI `37771536451` (release and windows-tools
  success; deploy-pages skipped) and CSS Schema Acceptance
  `37771536361` (success).
- Chromium createApp gate: **23/23 checks passed**, including the new
  pinned descriptive ItemMedia 8-style × light/dark browser check.
- Remeasured 528 first-Card source-locked heights: **300/528** beyond
  ±0.5px; 292 improved / 122 worsened relative to original; unchanged
  from the previous green baseline. Positioning fix is real but does not
  repair Payments +42px or FAQ +14px.
- QA and work-state final evidence is a documentation-only follow-up;
  the above tested code SHA is the authoritative new visual checkpoint.

SOURCE-BACKED CHANGE DETAILS:
- Compared upstream pinned `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c`
  and all 8 `style-*.css` recipes. All require described
  `ItemMedia` to align self at flex-start and translate down 2px,
  with 8px internal gap. QX shared `item-surface.css` previously
  centered the glyph in its tall Item row, including Payments.
- Corrected this missing shared ItemMedia rule using modern `:has()`;
  a description-less Item still uses centered alignment.
  Added static source assertions and 8 style × light/dark Payments
  geometry regression. No font, Card height, runtime JS, generator,
  token inventory, or test tolerance changes.
- This fixes a verified **icon placement** issue, NOT Payments' +42px
  height residual. Do not count any first-Card height improvement
  without the next CI diagnostic. The measured result is now confirmed
  unchanged at 300/528.
- Changed code commits: `322a75f7` (CSS), `0304fff9` (static QA),
  `64a8cc5d` (browser QA). Follow subsequent documentation commits
  and the final Actions result as authoritative for the latest HEAD.

Next:
1. Confirm both Actions workflows for the latest HEAD; on failure,
   read job logs, repair the real cause and rerun without relaxing gates.
2. Compare true upstream row-level text widths / line wraps for Payments
   +42px and Accordion content structure for FAQ +14px; also handle
   Payout Threshold -22px and Upcoming Payments -18.5px.
   No fixed Card heights or font tweaks to mask layout differences.
3. Expand source-backed geometry to all nested Cards and Preview 01;
   Stage 4/5 remain unfinished. Keep PR Draft; do not merge main
   until explicit stage acceptance.
4. Update this file, Stage-3 QA and PR with the confirmed new HEAD,
   real run URLs, mismatch count and completed/uncompleted items.

Engineering estimate: CREATEAPP-V3 **61%**, Stage 3 **55%**
(provisional; percentages are not inferred from green CI or 528 heights).

### 2026-10-08 · Stage 3 continuation — shared Table and native FAQ Collapse

Latest implementation milestone: `914f62db930e107395bed49548566b9d479543e6`
(`redesign/create`; PR #265 stays Draft). Continue this SHA, not
historical `1f7e2ab8` or `8f3ffe50` green checkpoints.

- **#19 Table ownership:** removed all preview-private `pv-table`
  selectors. Preview 01 Recent Transactions and Preview 02 Invoice now
  use the framework `qxframe9a7c2-table is-embedded is-hover`.
  The opt-in static Table modifier lives in
  `src/styles/components/table.css`; it reuses the real Table's
  semantics/row states and does not require an authored duplicate JS widget.
  Two new registered Theme roles derive the 8/12px cell inset and
  muted-vs-foreground head text from the existing padding/shape/text axes.
  Header height derives from the same inset (40px/48px), Sera headings
  inherit editorial uppercase and 12px typography.
- **Table regression prevention:** browser checks the pinned eight
  styles × two modes for shared Table typography, semantic foreground,
  cell geometry and transparent body paint. The first post-migration
  successful *Schema* diagnostic at `64c604c4` was still 252/528
  over tolerance, but Recent Transactions increased from +10px to +16px.
  The latest patch changes embedded table leading to the upstream
  12px/16px, 14px/20px tiers via one CSS formula; CI is **pending** on
  that patch, and the old 252/528 snapshot is not a post-patch result.
- **#20 FAQ owner:** the FAQ now uses
  `qxframe9a7c2-collapse is-native` with three native
  `<details name="qx-create-faq">` children, no duplicate private
  `pv-accordion` drawing. Static opt-in native disclosure styling
  belongs to `src/styles/components/collapse.css`, without touching
  the JS-driven Collapse Controller contract. Native single-open,
  re-collapse, geometry, icon motion-none and source text-leading are
  regression locked.
- **CI evidence:** CSS Schema Acceptance **passed** for
  `64c604c4` (run #37779358028), including 27/27 Chromium
  createApp checks, 8-style theme browser checks and 653,064
  canonical consumer checks without mismatches. A distinct QXFRAME
  release run was still in progress at documentation time; do not
  promote this to full release acceptance. The latest
  `914f62db` revision needs independent success for **both** workflows.
- No `qxframe.js` or Controller implementation modified. Do not
  change the old-browser compatibility waiver, silent import rejection,
  or current CSS schema gates. Existing #9–#13 runtime findings remain
  out of this frozen JS Stage 3 PR; #14 underlined shape precedence
  awaits a contract decision. Source geometry for Payments/Payout/
  Upcoming and the remaining 252 first-Card deviations continues
  after an accepted current CI.
- Provisional program estimate: CREATEAPP-V3 ~62%, Stage 3 ~58%.
  This is a planning estimate, not an acceptance or ratio of passing
  Card geometry tests.

### 2026-10-08 · PR #265 audit triage / code batch (CI pending)

Owner supplied `AUDIT-PR265-ae56205.md`, 22 candidate findings;
not treated as 22 automatically validated defects.

- **Not a task:** #1 older-browser compatibility (owner explicitly
  waived legacy browser support in this continuation).
- **Patched in Stage 3 branch:** #2/#3/#4/#5 InputGroup border
  ownership, variant paint, control-height and separate/vertical addon;
  #6 switchLook independent of style name; #7 explicit pill shape
  precedence; #15 24px container radius cap for all allocations;
  #16 motion:none static loading/accordion effects; #17 strict header
  import; #18 locked theme/chart palette on shuffle/reset; #21 full
  `:root` and `.dark` token inventory; #22 paired Item link/accent
  foreground moved to framework and sidebar hover paired. #20 FAQ
  single-open/collapsible native details-name behavior also patched;
  existing private Accordion appearance is **not** yet promoted to
  reusable Collapse style.
- **Source-backed additional implementation:** #8 Empty icon glyph
  16/20/24px and action gap 8/10/16px now use registered shared
  Theme roles. Eight pinned upstream style-*.css files verified;
  explicit CSS instance overrides still take priority.
- **Needs continued validation/implementation:** #14 underlined inputs'
  shape exception (audit itself
  notes the owner is discussing precedence); #19 two preview Table
  surfaces not yet migrated; #20 Collapse owner consolidation;
  remaining visual parity for 300/528 initial-height diagnostics.
- **Confirmed historical baseline, outside this Stage 3 PR's frozen
  JS mandate:** #9/#10 numeric API, #11/#12 week calculation, #13
  AsyncTask re-entry. These require a separately scoped runtime fix,
  not a silent Controller modification while `qxframe.js` must match
  `main`. They are *not* marked fixed, nor dismissed.
- New code is on `redesign/create`. Current implementation/test SHA
  `189056f7c51caca654d3cc709a1b9b4386e37703`; CI must be
  queried by SHA and any errors repaired before acceptance. Never
  count a prior green run as confirmation of this batch.
- Added source assertions for import/locks/shape/full dark/motion,
  browser regressions for Item accent, InputGroup geometry/states,
  FAQ exclusivity, motion, Empty icon and content gaps across 8 styles × light/dark.
- No Controller/core JS touched, no gate tolerance relaxed, PR remains
  Draft, no main merge. Stage 3 next: fix any Actions failure first,
  then reuse shared Table/Collapse, Empty glyph precision, and resume
  Payments/FAQ/Payout/Upcoming source geometry.
- Estimate unchanged pending CI: overall ~61%, Stage 3 ~55%.

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
