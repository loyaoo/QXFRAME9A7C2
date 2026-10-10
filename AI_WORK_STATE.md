## CURRENT — 2026-10-10 SelectGroup one-Surface FocusOrigin and nine-floating-anchor documentation (new CI pending)
- Baseline 7d1e7cc8abf8a22f707d46e3602064046e537bc6: QXFRAME CI #38040376325 and CSS Schema Acceptance #38040376311 SUCCESS, PR #265 still Draft, not merged. Previous successful Actions artifact 11665697248.
- Repaired a confirmed duplicate keyboard focus outline: shared Choice Visual no longer gives SelectGroup's inner indicator a second outline; its Surface paints keyboard Theme shadow, pointer Theme shadow and pointer width/offset/color according to FocusOrigin. Native checkbox/radio checked/disabled state ownership is unchanged.
- Generalized SelectGroup CSS gap through a public override without changing default geometry. Converted interactive docs checkbox/radio demos away from retired is-pill/scenario modes and old display:grid samples into Theme Appearance and 20+ independent inner Flex compositions; preserved image/swatch as independent content slots; added all nine floating anchors in docs.
- Added static and Chromium browser acceptance for floating positions, independent Surface/indicator ownership, keyboard + pointer Theme ring, native state; this round's offline ledger marks only Preview01 Notifications/Receiving Method changed Surface/indicator regions; previous Preview02 yellow highlights cleared.
- Await same-HEAD QXFRAME + CSS Schema Success, then produce a new official Actions dist+docs Windows offline ZIP. Stage3 still Draft and not accepted. Do not merge or start Stage4/5.

## CURRENT — 2026-10-10 exact Surface owner counter correction (CI pending)
- QXFRAME run #38040160568: CSS Section5, JS runtime, source-preview-geometry and windows-tools previously green; release failed Phase F test because count('.selectgroup-label{') matches suffixes of 20 different selectors rather than one exact rule. This is a test selector bug, not 20 Surface drawing owners.
- Correct static gate now uses line-anchored CSS basic rule selector and still requires exactly one base paint owner; state selectors remain checked by existing Section5 duplicate-owner ratchet. No production CSS changes or threshold weakening.
- CSS Schema #38040160560 was pending during this correction. New same-HEAD QXFRAME + CSS Schema required, and final Actions ZIP must use successful HEAD. PR #265 Draft, no merge.

## CURRENT — 2026-10-10 native Notifications master-checkbox behavior and batch highlights (new CI pending)
- QXFRAME #38039883190: CSS Section5 gate now SUCCESS, release static Create gate failed only because old-highlight list included this round's Notifications and Receiving cards. CSS Schema #38039883198: browser passed the earlier strict Radio Field/Theme tests; actual Notifications Select-All interaction failed because preview-cards.js queried removed CheckField class.
- Fixed behavior at its JS binding owner: master now selects native SelectGroup checkbox inputs while retaining indeterminate/checked/change ownership; not a relaxed browser assertion. QA ledger now marks precisely current Preview01 Notifications/Receiving and Preview02 Shipping Address/Contributions Activity (required cross-scope CheckField removal only, not Stage4 geometric work); excludes prior Savings yellow.
- Static gate now enforces four correct markers and no stale cards. Require fresh same-HEAD QXFRAME and CSS Schema success, then official Actions dist/docs ZIP. PR #265 still Draft, no merge. Overall 65%, Stage3 75%, SelectGroup task provisional 30% pending complete docs and browser/owner checks.

## CURRENT — 2026-10-10 S3 SelectGroup failed CI correction (new CI pending)
- Candidate 190c34a QXFRAME #38039628230: source-preview-geometry and windows-tools SUCCESS, release FAILED strict Section5 (public component --qxframe9a7c2-layout-gap, duplicate middle-center transform and indicator focus owner). CSS Schema #38039628207 failed Chromium when old test measured border on Item rather than its new Surface (0 vs expected 1).
- Fix: use private inherited Field gap slot (no public declaration); one transform per floating anchor; Focus indicator outline owner only in focus-closeout; Flex supports is-center/is-end. Browser checks now measure Surface border/padding and independent Flex gap without weakening any tolerance.
- Field/SelectGroup migrations still pending full same-HEAD CI and Windows offline ZIP. PR #265 Draft, no merge. Overall 65%, S3 75%, SelectGroup task provisional 25%.

## CURRENT — 2026-10-10 S3-FIELD-001 / S3-SELECTGROUP-002 migration candidate; new CI required
- Verified previous HEAD 4c40c708 both CI SUCCESS: QXFRAME 38038216181, CSS Schema 38038216271. Source geometry and Windows jobs passed.
- Source files now rename formal SelectGroup and share None/Outline/Muted surfaces, native checked projection, nine floating anchors, one connected seam. CheckField-specific CSS removed; Preview01 Notifications and Receiving Method migrated to choice Surface and independent Flex; Preview02's two CheckField consumers updated as necessary migration only (not Stage4 acceptance).
- Static docs and specialized tests must be completed before Stage3 closeout. Current candidate cannot be marked delivered until full CI, Chromium and same-HEAD Windows ZIP; PR #265 Draft and main unchanged.
- Overall 65% / S3 75% revised scope; current SelectGroup task preliminary 25%, not accepted. Next: resolve static and browser gate failures; finish all docs composition modes and verify connected image/floating and SelectGroup/Field error/disabled behavior.

## CURRENT — 2026-10-10 Field baseline CI follow-up: preserve source label owner (CI pending)
- Candidate 2fc2967 source job found source-locked Sera PayoutThreshold label/card differed by 1px; Release `verify:theme-tokens` rejected duplicate owner count 12→14 for legacy FormLabel fontsize/weight. Repair keeps original `.form-label` rule intact, gives new `.field-label` its own selector, and removes the extra FieldContent alias on the old specialized FormLabel rule. No source gate or baseline was weakened. CI on new HEAD required; first Field foundation remains unaccepted until both pass.

## CURRENT — 2026-10-10 CREATEAPP-V3-S3-FIELD-001: shared Field foundation (CI pending)
- Resumed verified PR #265 Open/Draft and HEAD `fc489c9c5b72ea106febeace9c31f7af86808251`; QXFRAME CI #38030203282 and CSS Schema #38030203246 SUCCESS **at the old HEAD only**. Frozen source geometry and previously valid Focus shadow/hover are unchanged.
- Task IDs: CREATEAPP-V3-S3-FIELD-001 (active), CREATEAPP-V3-S3-SELECTGROUP-002, CREATEAPP-V3-S3-CHOICE-COMPOSE-003, CREATEAPP-V3-S3-STATE-004, CREATEAPP-V3-S3-PREVIEW01-CLOSEOUT-005 (not started).
- Concrete first delta: universal Field, FieldLabel, FieldDescription, FieldError, FieldSet/Legend and FieldSeparator now share existing Form/Divider CSS owners; docs Form demos include working native label/input/error/fieldset structure and regression assertions. No standalone duplicate Field drawing owner, no component JS changes.
- **Incomplete / do not credit as migrated:** all CheckField CSS/markup and old SelectGroup classes still need removal; none/outline/muted, docs full replacement, nine Floating positions, connected, seven state axes, browser and source-locked geometry QA are NOT verified by this foundation commit.
- Revised scope estimate (provisional): overall 65%, Stage3 75%, FIELD-001 15%. This reflects new tasks added, not a rollback of old completed work. Do not claim this batch delivered or provide Windows ZIP until both new HEAD CI pass; keep PR Draft, do not merge.
- Next exact step: change CheckField and SelectGroup source/Preview/docs/tests together, preserve source-locked 0.5px geometry; then two complete CIs and same-HEAD dist/docs artifact plus Windows offline overlay.

# QXFRAME9A7C2 AI Work State

## CURRENT — 2026-10-10 JS Input inside connected composition: shared halo/hover ownership (CI pending)
- Verified GitHub baseline `e07d685f`: PR #265 Open/Draft; QXFRAME #38027653287 and CSS Schema #38027653277 both SUCCESS. Do not regress the original native-field focus/halo, 528 source-pinned source geometry or other locked gates.
- Shared `composition.css` corrects previously unprojected **JS Input** `.is-focused` (pointer) and `.is-keyboard-focus` (keyboard) inside `InputGroup > Addon + JS Input` and `InputGroup > InputGroupField > Addon + JS Input`. Root/Field paints the ring and outline; nested JS shell clears its own outline/box-shadow. An `InputGroup > InputGroup` stays an independent layout/focus island. No JS controller/runtime changes.
- Connected root's Theme hover now excludes JS Input `is-disabled/is-invalid/is-error/is-warning`. `InputGroupField` gets matching derived 70/30 Theme hover without overtaking focus or invalid/warning inherited from FormField. Added static CSS assertions and Chromium flat/mixed/island pointer/keyboard/error focus ownership regression; **new CI result not yet verified**.
- Offline yellow ledger resets previous Savings/Social focus regions and marks **only Savings Targets' connected InputGroup** (one Card/one changed region) for current-round shared hover/visual ownership. A synthetic JS Input regression is not misrepresented as a modified Create Card.
- Conservatively hold CREATEAPP-V3 **70%** / Stage3 **91%** until strict same-HEAD two-green CI and Windows offline owner review. PR remains Draft; main and backup unchanged. Next: inspect both workflow jobs, correct any strict failure, then obtain same-HEAD Actions dist+docs artifact and validate Windows ZIP before release.


## CURRENT — 2026-10-10 Button pointer halo first-frame browser-test correction
- Failing QXFRAME `38026688662` / CSS `38026688667`: all group/native pointer/keyboard halos pass, only Button mouse halo test sampled two transparent shadows immediately after `focus()`.
- New instrumented CI `38027357014` showed Button `document.activeElement===button`, :focus true, selector true, pointer Theme token **red 3px** properly inherited, no disabled state. `button.css` has `transition:box-shadow var(--_qxframe9a7c2-fixed-motion-duration-3)`; synchronous getComputedStyle sampled the first 0px transparent transition frame, not the final halo.
- Browser test now verifies selector/token immediately, awaits 450ms for the existing transition, then strictly checks the actual painted red 3px shadow and persistent focus. No production behavior changes, no reduced assertions or skipped tests. Preserve pinned source/Card gates; rerun both CI. PR Draft, main/backup unchanged.


## CURRENT — 2026-10-10 exact focus rendering diagnostic before repair
- Latest HEAD `d1ac79f4` two CIs `38026688662/38026688667` failed only in Chromium Button pointer-shadow verification. Group pointer/keyboard and native Input pointer/keyboard probes pass; source geometry and Windows Tools succeed.
- Added focused Button diagnostic: active element match, :focus / :focus-visible, FocusOrigin class, token inheritance, current V2 shadow, selector matching and disabled state to isolate failure rather than loosen test or guess. No production CSS changed; next CI yields evidence. PR Draft, no merge.


## CURRENT — 2026-10-10 Button pointer halo and actionable Addon focus parity
- Previous batch supported Theme keyboard halo for Button and Theme pointer halo for Input/Select/InputGroup, but native Button pointer focus was missing. Added pointer-origin Button :focus shadow (no outline), composited with existing elevation and excluded disabled/loading. Clickable InputGroup Addon also maps independent focus-visible keyboard shadow and pointer :focus shadow; editor remains a separate border/focus owner.
- Added static and actual Chromium regression for pointer-focused Button. No global :focus outline, no pressed/active semantics change; default Theme pointer-shadow none preserves baseline. Full QXFRAME + CSS Schema acceptance must pass on new HEAD.


## CURRENT — 2026-10-10 FocusOrigin event ordering in native probe
- CSS Schema `38026172810`: group pointer red 3px, group keyboard green 3px, and standalone native input pointer red 3px all passed. Standalone native keyboard sample read red despite test setting keyboard-origin before `native.focus()`. The runtime FocusOrigin focus event changed the origin class on focus, so manual class injection must happen AFTER the focus event when testing an explicit keyboard origin.
- Updated browser regression to `native.focus(); h.classList.add('qxframe9a7c2-keyboard-focus-origin'); getComputedStyle(native)`; pointer sample still reads after class removal. No production CSS or lowered assertion, test now actually measures the requested mode. New exact-HEAD both CI required.


## CURRENT — 2026-10-10 strict pinned Theme formula ownership
- QXFRAME `38025980122` source geometry and Windows Tools SUCCESS; Release rejected `color-mix(in oklab,var(--theme-field-border) 70%,var(--theme-ring))` only because the hover-mapping rule was mistakenly placed in source-formula-locked `theme-visual-v2.css`.
- Moved the exact shared input hover consumer rule into `theme-visual-v2-consumers.css`, the existing after-v2 consumption layer. Kept 70/30 derived contrast with zero extra Theme tokens. Connected InputGroup composition retains the same derived border recipe.
- `tools/theme-v2-contract.mjs` remains untouched, its shadcn SHA/formula whitelist stays strict; updated static gate to assert the consumer, not frozen source. CI new SHA required.


## CURRENT — 2026-10-10 visually effective default hover role
- Existing Theme default `field-border` and `input` values are identical in light and dark. Earlier field `:hover` mapping to `--theme-input` produced no visible change! Corrected shared V2 field hover to 70% field-border + 30% Theme ring, using existing Theme tokens, and added same hover border to connected addon InputGroup. Focus always takes precedence; disabled/error/warning don't inherit hover ring.
- No new hover Theme tokens and no per-Card styling. Static gate now asserts real color-mix expression, not mere presence of `theme-input`. Official two green CI on the new SHA still required, exact baseline source locked tests untouched.


## CURRENT — 2026-10-10 actual standalone native Input test probe correction
- CSS Schema `38025604755` browser gate showed connected InputGroup pointer shadow **red 3px**, keyboard shadow **green 3px**, and inner Input **none** (correct). It falsely claimed standalone native Input had no shadow because test used Social Links input nested inside an InputGroup, where removing its shadow is explicitly required.
- Browser acceptance now appends a temporary standalone `<input class=qxframe9a7c2-form-input>` outside any Group, samples keyboard and pointer shadow and removes it. This preserves strict duplicate-shadow prevention and adds true standalone coverage. Production CSS remains unchanged in this correction; exact new SHA CI must be green.

## CURRENT — 2026-10-10 static test initialization order correction
- QXFRAME run `38025429041` passed pinned source preview geometry and Windows tools; Release static test failed before behavior checks: new focus Theme assertion referenced `model` before dynamic module initialization.
- Move complete test block after existing dynamic model/data imports; no loosening assertions or production CSS. New exact-HEAD CI required. PR #265 Draft.


## CURRENT — 2026-10-10 acceptance yellow ledger precision
- Corrected current yellow regions to actual **InputGroup Savings Targets**, **native Input Social Links** and **CardFooter Button Social Links** (2 Cards, 3 selector categories). A preliminary ledger had a FAQ Tabs diagnostic line even though this batch modifies no Tabs code; removed that false highlight before the official ZIP.
- No CSS behavior changes in this commit. Prior source-locked CI remains required, PR Draft. No previous-round yellow survives.


## CURRENT — 2026-10-10 browser focus halo ownership regression gate (CI pending)
- Added Chromium browser checks that force distinct visible 3px pointer red and keyboard green box-shadows to verify computed focus ownership on actual composed InputGroup vs standalone native Input; child Input must not draw a duplicate halo. Preserves existing pointer-vs-keyboard outline width tests. Added static test proving `focusColor=theme` sets `focus` AND `ring` to primary and baseline default shadow slots remain none.
- This gate is diagnostic/acceptance only, no new Create Card changes; offline highlighted regions unchanged. PR Draft and all strict source gates retained.


## CURRENT — 2026-10-10 Focus halo/color & interactive state consistency batch — CI pending
- Baseline verified 458cf9aa QXFRAME 38023498729 and CSS Schema 38023498714 SUCCESS, PR #265 Draft. Owner reported missing hover/active visual state, no real focus shadows, no consistent Theme-colored focus border.
- Source audit: Button already has hover/active and state classes; native Form fields have hover, JS Input only is-hovered. Existing focusColor toggle (mono/theme) only recolored `focus` while components' border used unrelated `ring`. Corrected `focusColor=theme` to link both `focus` and `ring` to primary. Added only two Theme presentation slots `focus-shadow` and `pointer-shadow` (none in baseline). Each ring preset yields real box-shadow, with default QX focus unchanged. Native/JS Input, InputGroup and Button consume the shared roles; group owns shadow, child doesn't; Button retains base elevation. Added native hover for JS Input and V2 field family border hover mapping; no spurious pressed editing state and no core JS change.
- Strict source gates preserved. Current offline ledger cleared prior yellow and marks only Savings Targets grouped Input, FAQ interactive Tab rail, and Social Links native Input. Both CI workflows + offline artifact need verification; no progress credit yet. Baseline total ~70%, S3 ~91%.


## CURRENT — 2026-10-10 FocusOrigin verifier correction
- QXFRAME `38023345059` Release rejected any `:focus-within` block that draws `outline`, even under non-keyboard html origin. Correctly enforced shared runtime FocusOrigin contract; NOT disabled.
- InputGroup pointer rule now projects from actual `FormInput:focus-visible` / `Input:focus-visible` through parent `:has()`, with pointer origin class filter, rather than :focus-within. Browser test against official earlier offline base confirmed theme Pointer **3px width/2px offset** and keyboard **2px/-1px** simultaneously. The old Group `:focus-within` border color, which draws NO outline, is preserved.
- Keep same visual acceptance and 4px segmented rail; repeat both CI workflows after commit. No core JS modifications.


## CURRENT — 2026-10-10 FAQ rail static source assertion updated after real geometry proof
- Official QXFRAME run `38023226924` Release failed only on stale static assertion requiring old `--tabs-height:calc(... - .375rem)`; the component now uses `- .5rem` because 4px+4px vertical rail padding has been restored. Local Chromium demonstrated FAQ Card remains 355px, with Scroll rail 32px, Viewport padding-block 4px each and TabItem 24px fully visible. Strict source-locked Card and TabItem browser gates remain; update static assertion to match the new correct public Tabs slot mapping, do not remove the gate.
- Await the separate same-browser source geometry job result; rerun both workflows at new HEAD. PR Draft.


## CURRENT — 2026-10-10 real-browser pointer focus cascade fix
- Ran local Chromium against the previous official offline demo with the prospective pointer CSS. Pointer-focus `--theme-pointer-width:3px` and `offset:2px` **failed** when rule was expressed as `html:not(.keyboard)...` inside `@scope (:root)` (computed 2px/-1px keyboard outline); independent Chromium check showed the same selector outside scope correctly yielded **3px/2px** and keyboard remained 2px.
- Moved InputGroup mouse Theme rule to the shared `src/styles/components/composition.css` cascade with `html:not(.qxframe9a7c2-keyboard-focus-origin)` selector. Keep Theme consumption, keyboard 2px, inner input none. Removed ineffective duplicate scoped rule, updated regression guard.
- Current candidate still requires full two-green CI, then matching official Windows offline pack. No merge/branch pollution.


## CURRENT — 2026-10-10 SVG arrow CSS image mode correction
- Before accepting CI, local Chromium checked `CSS.supports('background-image','light-dark(url(...),url(...))') === false`. Fixed source syntax by using a theme-boundary `.dark` CSS override for the SVG URI and retaining one `--qxframe9a7c2-form-select-arrow-image` public override. Native Select must compute a genuine SVG URL, not `none`. Static regression enforces this; browser acceptance will check computed image.
- The other follow-up repairs (group mouse Theme pointer tokens, Tabs rail vertical 4px inset with fixed height budget) remain. Prior commit was provisional, no success or offline ZIP yet.


## CURRENT — 2026-10-10 owner follow-up three concrete regressions (CI pending)
- Latest baseline `b185660e93260dc2acc424b4b18edfa05e50bb08` passed QXFRAME `38021362739` and CSS Schema `38021362707`; PR #265 remains Draft.
- Fixed at framework level: connected InputGroup / InputGroupField pointer focus now reuses same Theme pointer width/opacity/offset as standalone Input; no second child outline, existing keyboard 2px owner unchanged. Segmented Tabs 4px top/bottom viewport padding restored, Scroll rail owns 8px extra vertical budget; source Create tab height mapping adjusted to 24px trigger + 8px rail = 32px and segmented Panel removes duplicate 6px spacer to keep source Card height; cross-checked locally in real Chromium. Native Select gradient triangles replaced by a round-stroke SVG chevron, light/dark URI with overridable image slot.
- Static and browser regression tests expanded; offline yellow ledger reset to only Savings Targets InputGroup/Select and FAQ viewport (two Cards, three marked region types). Previous Sidebar, CheckField yellow removed. Preserve all strict source-locked checks, no JS runtime changes, no source gate relaxation.
- Stage 3 ~91%, total ~70% previous owner estimates pending owner review. New CI/pack needed; no merge, no main/backup edit.


## CURRENT — 2026-10-10 MD Button style-size step final source candidate
- Source run `38021088496` now passed all prior Card/Item/Field checks through the 304 first-Button parity section. Remaining failure: only Maia, Luma, Rhea first MD Button width was -4px across 5 Cards × 2 modes; exactly one size-step (2px per side) missing after introducing explicit MD family Theme padding. Style MD Button mapping now adds .125rem to generic Control padding in these three source styles; Sera keeps .625rem editorial offset; all density levels still monotonic for every property and all generic inputs.
- Keep strict 304 first-Button width/height/font/colors gate. Any new failures must be fixed, not suppressed; no current success claim. PR Draft, main/backup untouched.


## CURRENT — 2026-10-10 density/MD Button source regression and style mapping candidate
- In QXFRAME `38020871123`, the fixed Tabs rail advanced the source gate beyond Lyra FAQ. Strict Sera Social Links then detected unequal source Footer Buttons **134.813px/168.047px** had become QX **151.422px/151.422px**. Cause: correcting incorrect control loose40 horizontal padding from 1.5rem to .875rem also changed Sera-specific md Button min-content clamp.
- Correct architectural owner: new registered `button-md-padding-inline` Theme family slot. Sera md button retains its editorial +.625rem inset (original 1.5rem at loose40), generic controls follow monotone 28/32/36/40/44 density. No card-specific CSS or JS edits. Retain actual min-content source geometry strict gate. Static Sidebar hover selector migrated to distinct muted :hover:not(.is-active), not waived.
- Complete prior multi-component batch still awaiting official two-green CI; user progress unchanged until validated. PR #265 Draft, protected branches untouched.


## CURRENT — 2026-10-10 Tabs rail strict source correction
- Official failed same-browser artifact `11657787259`: Lyra FAQ source Card 343px vs QX 475.75px when Scroll root/viewport were set to auto. Intrinsic Scroll sizing introduced a severe feedback/height-growth regression in the segmented rail. Preserved source-locked strict Card comparison and reverted root sizing to shared Theme tabs height.
- Root-cause correction: horizontal segmented Scroll viewport formerly used `padding:0.25rem`, consuming 8px of the exact TabItem height and cropping the tab. The shared rule now keeps inline rail chrome while setting vertical padding to zero; viewport and tab use same block-height budget. No per-Card CSS, no test waiver. Pending same-browser rerun plus browser no-clip geometry assertion.
- All other multi-component fixes remain part of the same batch. PR #265 Draft.


## CURRENT — 2026-10-10 shared fixes QA ledger round normalization (CI pending)
- HEAD `9adcb02b` batch spans InputGroup padding/focus, native Select arrow, popup motion, sidebar hover, Tabs height, density. Its QA ledger was normalized to exactly three Card groups and four interior role selectors (Buy Investment includes two regions), preventing double grouping and eliminating stale test expectations from the previous CheckField-only round.
- Full source-locked browser and Release CI continue as the acceptance authority. PR #265 remains Draft, no main/backup edit. No premature Stage3 percentage credit.


## CURRENT — 2026-10-10 S3 user feedback multi-component batch (CI pending)
- Baseline green HEAD `15c7f5a3`, QXFRAME `38019740808` and CSS Schema `38019740821` SUCCESS; PR #265 Draft.
- Shared CSS and compiler changes: density 28/32/36/40/44 inline-padding monotonic; Tabs horizontal intrinsic viewport height; placement-aware popup from attached edge scaleY/scaleX (no point-scale); Sidebar muted hover distinct from active accent; connected InputGroup additive padding seam halves and wrapper-owned focus-visible (not child's outline); native Select browser-stable drawn chevron; nesting contract documented without claiming seamless nested-group support.
- New static and Chromium tests added; previous 528 source/Card, 2128 Field/Item, 384 Badge, 448 small Button, 304 first-Button, 4224 Title/Description and FAQ paint gates stay enabled. CI must verify visual regressions, especially editorial Sera affected by density source. If source-lock contradicts corrected monotonic density, adjudicate with real evidence; do not silently weaken source gates.
- Current offline ledger is RESET to only four affected inner regions (Buy Investment input-group and Select, Sidebar menu, FAQ Tabs). No old yellow. New official 2-green artifact required.
- Stage3 ~91%, total CREATEAPP-V3 ~70% prior to user acceptance; this batch is not credited until CI plus owner's review. No core JS edits, no PR merge, no main/backup edits.


## CURRENT — 2026-10-10 CheckField CSS state precedence and stale highlight gate (new CI pending)

- After `df181ac3`, QXFRAME release in `38019622374` failed solely on a historical no-old-annotation assertion that still forbade `notification-settings` in the *current* QA ledger. This card is intentionally part of the new batch, so rotate the old batch prohibition to former `release-catalog` instead; retain the other old checks and exact active-selector assertions.
- `.check-field.is-choice` previously re-declared `align-items:center` after the new three-state selectors, which would defeat explicit `is-start/is-end` on framed radio choices. Remove this redundant default so `is-choice` inherits centered base and obeys all three modifiers. All default source framing geometry must remain identical; strict CI guards not weakened.
- Waiting QXFRAME and CSS Schema new same-tree green before exporting local annotated acceptance ZIP. Stage3 last confirmed ~91%, total ~70%; PR Draft, main/backup unchanged.


## CURRENT — 2026-10-10 CheckField source audit selector updated (rerun required)

- Candidate `01e03012` QXFRAME source-preview-geometry `38019524639` failed in its *legacy expected class selector*, not a measured size deviation: audit expected exact `qxframe9a7c2-check-field is-center`, but new intended default-centered HTML correctly omits the redundant modifier. Audit now matches exact `qxframe9a7c2-check-field` and retains strict source row 16px + QX row 0.5px delta + whole Card height 0.5px delta checks. No gate relaxation. CI must rerun on the new tree.
- Original baseline Stage3 91%/overall 70%; CheckField candidate not credited until green. PR #265 Draft; main and backup untouched.


## CURRENT — 2026-10-10 CheckField three-state cross-axis contract (CI pending)

- Latest verified baseline `322de1c1` PR #265 Draft; QXFRAME `38016670565` and CSS Schema `38016670548` both SUCCESS. This independent feedback batch addresses user item 1: the CheckField should not rely on a per-Card `.is-center` and a 2px margin patch.
- Shared `src/styles/components/composition.css` CheckField now defaults to center alignment for both row and native checkbox/radio input (including its pseudo indicator), with opt-in `is-start/is-center/is-end` three-way cross-axis states controlling both `align-items` and child `align-self`. Removed old margin-top hacks. All five Notification Settings rows use implicit default center. Choice radio composition remains centered.
- Added static source contract plus live Chromium computed geometry for default/start/center/end input positions (3 alignments + no margin offsets); no core JS edit. QA overlay ledger RESET to Notification Settings CheckField/indicators only; prior FAQ/New Milestone marks discarded. Existing locked Stage3 tests must remain unchanged.
- Remaining user findings to handle next, each on evidence: InputGroup addon+input padding/focus ownership, menu/dropdown reveal animation, loose40 padding monotonicity, Tabs Scroll height clipping, sidebar hover/active semantics, cross-browser native select arrow, InputGroup-vs-Control and nested-composition contract. Do not claim these fixed in this checkpoint.
- Progress remains latest validated Stage3 ~91%, overall CREATEAPP-V3 ~70%; new head cannot be credited before double-green and manual acceptance. Never merge PR #265 or touch main/backup.


## CURRENT — 2026-10-10 FAQ active source border recipe and 4,224 text gates (CI rerun)

- Candidate `4da37e36`: same-browser source-preview job `38016429187` proved **352 Title + 352 Description matched pairs × 6 = 4,224 strict source-locked assertions PASS** across 8 Styles/light/dark; all earlier 528 outer, 2,128 Item/Field, 384 Badge, 448 small Button, and 304 paired first Buttons stayed passing. New FAQ Tabs background/foreground parity passed all modes but source dark Luma/Rhea active border was transparent while the initial QX CSS used the Input border. Root cause is the source's no-border choice policy, not a sampling error.
- Existing Theme `choice-border` already represents precisely the required source style split: Luma/Rhea `transparent`, six others `input`. Segmented Tabs active dark border now consumes this shared token, no new dedicated Theme variable, no per-Style CSS override, JS unchanged. Strict FAQ test stays active for 16 variants × 3 RGBA channels.
- Release in `38016429187` additionally failed because old offline marker assertion expected one marker after the current batch intentionally changed to two marked regions; fixed static assertion to use current ledger's region count without weakening exact selector checks.
- New candidate requires fresh QXFRAME + CSS Schema SUCCESS; only THEN report the new scope as completed. QA ledger only FAQ active Tab and New Milestone description; prior Social Links yellow cleared. PR #265 Draft; main and backup unchanged. Progress stays ~69% total/~85% Stage until verified green and owner approval.


## CURRENT — 2026-10-10 S3 source-locked internal text and FAQ dark Tabs candidate (CI pending)

- Baseline HEAD `86f124cdb1845cae5b325d36207cbf947b6d4490`; QXFRAME CI `38014041835` SUCCESS; CSS Schema `38014041832` SUCCESS; prior pending text is superseded. PR #265 stays Draft and main/backup remain untouched.
- Compared official same Chromium artifact `11655478191` with locked shadcn `295a1f114a138f23b5dfee0e0c6812394dfeb90c`; outer 528 and existing Button/Item/Field/Badge gates pass. Real dark FAQ active Tabs surface mismatch confirmed against exact pinned source TabsTrigger: dark active bg=input/30 and border=input, light active bg=background. Fixed shared QX segmented Tabs in `src/styles/components/tabs.css` only; no Preview-private CSS, no JS core edits.
- Extended paired source sampling to title/description/active Tab across all Cards and 16 Style/modes, with strict text positions/font/normalized text paint and FAQ active Tab normalized bg/fg/border paint; existing hard gates retained. Do not infer success until new same-browser Actions validate.
- Offline QA ledger reset to FAQ active Tab and New Milestone description ONLY, former Social Links highlights removed. Progress baseline CREATEAPP-V3 **~69%**, Stage3 **~85%**; new coverage progress remains pending CI and owner visual acceptance. Source charts/QR are intentionally rendered static artwork in QX and stubbed in the harness; do not fake visual closure by erasing them.
- Next: run both official CI workflows for the candidate; fix any genuinely equivalent title/description discrepancies without weakening gates; produce Windows offline ZIP only from same-tree two-green Actions artifact, then await owner acceptance.


## CURRENT — 2026-10-10 Sera Social Links source literal Button nowrap root-cause (CI pending)

- Source-pinned same-Chromium log for HEAD `c63846a2` identified **actual** remaining discrepancy: source `whiteSpace:nowrap` on both Sera footer Buttons, QX `whiteSpace:normal`. Both already have identical 12px/600/1.2px, 24px horizontal padding, `flex:1 1 0%`, `min-width:auto`, border widths, 8px gap. Because QX text wrapped at its min-content threshold it distributed the 302.8px total equally (151.422px each) instead of source's natural min-content widths (134.813px / 168.047px). The correct shared opt-in rule now adds `white-space:nowrap`; no new forced widths, no style-specific override, no QX runtime JS edit. This is a genuine component flex/typography contract fix.
- Extended strict source-pinned peer gate to compare `whiteSpace` and `textRangeWidth` for BOTH actions in Sera light/dark as well as prior x/width/font/flex/min-width assertions; static CSS regression also added. Existing 528 first Cards, 2,128 Item/Field, 384 Badge, 448 small Button and 304 first-Button source-gates retained (not weakened).
- Prior HEAD `c63846a2`: CSS Schema SUCCESS `38012937231`, QXFRAME CI FAILED `38012937269` on exact peer widths only. New candidate requires two successful workflow runs on same tree and official Actions dist+docs artifact before Windows ZIP.
- Active yellow offline QA ledger continues to include **only Social Links footer (2 Buttons)**. Progress stays Stage3 **~85%**, full CREATEAPP-V3 **~69%** until broad remaining pixel comparisons and owner Windows signoff. PR #265 remains Draft, main/backup untouched.


## CURRENT — 2026-10-10 Stage3 Sera true min-content Flex parity source-confirmed (new CI pending)

- Same Chromium probe `[stage3-social-peer-deep]` from failed candidate `d772f00a` resolved source actual: Sera Social Links buttons `flex:1 1 0%`, **`min-width:auto`**. Both have identical 12px/600/1.2px tracking, 24px horizontal padding, Footer gap 8px, left/right inset 32px. Browser's min-content width constraint gives **Discard 134.813px, Save Changes 168.047px**, rather than forced equal widths.
- QX earlier `flex:1 1 auto;min-width:0` gave 126.781px/176.063px; QX `flex:1 1 0;min-width:0` gave 151.42px equally. Correct **component-level opt-in**: `CardFooter.is-source-peer-actions>.button{min-width:auto;flex:var(--theme-card-footer-peer-flex)}`, with **editorial Theme token `1 1 0%`** and other Theme styles `0 1 auto`. This faithfully restores browser min-content constraint without modifying framework-wide default min-width:0.
- Source same-browser regression now strictly compares **BOTH Discard and Save Changes** in Sera light/dark, each x/width/fontSize/fontWeight/letterSpacing/flex/minWidth; previous 304 source-paired first Buttons × 16 themes, 528 Card, 2,128 Item+Field, 384 Badge, 448 small Button gates all retained without weakening. New CI must return QXFRAME and CSS Schema double-green on matching tree.
- Offline changed-card ledger remains ONLY Social Links 1 grouped region / 2 Button nodes, old yellow removed. Progress estimate remains CREATEAPP-V3 total ~69%, Stage3 ~85% pending whole-pixel and Windows owner acceptance; PR #265 Draft, main + backup frozen. No QA ZIP from failed candidates.


## CURRENT — 2026-10-10 Stage3 Sera Social Links peer action exact flex basis (CI pending)

- Strong 304-paired-button lock exposed Sera Social Links Discard source width **134.81px**, old QX **118.77px** (both light/dark). First opt-in peer rule `flex:1 1 0` overshot to **151.42px**, confirming the source is NOT equal-width; upstream Sera `style-sera:flex-1` retains an intrinsic base in the source's computed layout. Correct single Theme token now emits **`flex:1 1 auto` for editorial Sera**, `0 1 auto` otherwise. This lets both actions gain an equal share of remaining row space without erasing different text intrinsic widths.
- Prior candidate `77912bb8` same-Chromium pinned geometry gate FAILED exactly on those two values; no gate weakened, dimensions unchanged. Next HEAD must yield **304 Button source-paired visual-role passes**, plus existing 528 outer, 2,128 Item/Field, 384 Badge, 448 small Button gates and full CSS Schema. No production JS changes.
- Offline QA active ONLY Social Links, one grouped inner footer region covering two Buttons; previous yellow cleared. Do not ship from failed build. Progress kept CREATEAPP-V3 total ~69%, Stage3 ~85% pending remaining full-pixel/manual owner acceptance.


## CURRENT — 2026-10-10 Stage3 full first-Button RGBA gate finds Sera peer sizing bug (CI pending)

- A new source/QX **19 matched Card Groups × 8 Styles × light/dark = 304 first Button** gate compares exact source equivalent Button geometry/font and normalized sRGB colors. Neutral dark differences from prior diagnostic were transition sampling artefacts; override both renderers `animation:none!important;transition:none!important`. Upcoming Payments source first Button is Calendar day and QX first Button is nav, so explicitly not a matched pair.
- Source gate revealed ONE real discrepancy across 304 pairs: **Sera Social Links Discard Button width 118.77px vs source 134.81px** (both light/dark). The source Sera footer sets both actions `flex:1`, other styles natural width. Added reusable QX `CardFooter.is-source-peer-actions` opt-in; new **single Theme token** `--qxframe9a7c2-theme-card-footer-peer-flex` outputs `1 1 0` for editorial Sera, `0 1 auto` otherwise. Source Preview Social Links consumes static CardFooter class. No private PV CSS/style selector, no qxframe runtime JS edit; default `:root` and `.dark` token synchronized, static schema gated.
- Current offline QA ledger REPLACED with **only Social Links / 1 grouped footer / 2 actual Buttons**, all older yellow highlights cleared. Test source/Chromium gates retained; candidate requires BOTH full QXFRAME and CSS Schema GREEN and official Actions dist+docs before Windows QA. Stage3 ~85% and overall ~69% unchanged until confirmed actual visual acceptance; PR #265 Draft; main/backup frozen.


## CURRENT — 2026-10-10 Stage3: semantic-matched 19-Card Button paint/type parity (CI PENDING)

- Latest green base commit `5f7f70ab`, full QXFRAME CI `38009549018` and CSS Schema `38009549022` SUCCESS. PR #265 remains Draft, main/backup untouched. Existing 528 first-Card + 2,128 Item/Field + 384 Badge + 448 small Button gates all retained.
- Source/QX nested role audit revealed a timing artifact: `transition:none` without `!important` loses against framework Button transitions. Dark computed color samples captured intermediate oklab mixtures, mistakenly suggesting that every dark Button is miscolored. Source and QX audited with **`animation:none!important;transition:none!important`** in both renderers; no production CSS altered.
- Added same-Chromium **19 semantically matched first-Button Card groups × 16 styles/modes = 304 source/QX paired Buttons**, strict width/height/fontSize/fontWeight plus 2 normalized sRGB paint channels (4-channel RGBA for each). Explicitly exclude Upcoming Payments **because pinned source's first Button is calendar day 27 and QX first Button is calendar nav**: non-equivalent DOM roles, not an exception to an observed failure. Complete paint and geometry gate must pass; no visual acceptance from unverified alpha colors.
- No visual-asset or DOM production change in this checkpoint. Current offline QA 7 Card / 8 region ledger from previous actually fixed small Button batch retained until a new visual batch; no ZIP issued solely for audit. Stage3 ~85%, total ~69% unchanged until actual new visual corrections/manual pass. New candidate CI pending.


## CURRENT — 2026-10-10 V2 separate small text/icon font roles (candidate CI PENDING)

- Source-paired Chromium 448-property Button gate proved after V2 cascade fix that all styles matched **except Nova icon-sm**: source Header icon buttons use **14px**, but Nova `size=sm` text Buttons use **12.8px**. Distinct roles now: `.button.is-sm` consumes `theme-button-sm-font-size`, whereas `.button.is-sm.is-square/.is-icon-only` consumes `theme-control-font-size` (Nova 14px). This is shared QX component mapping, not Preview CSS, no additional Theme token.
- Relocated both rules **AFTER** generic single-line min-height geometry block, preserving existing static Textarea vs single-line structural contract. Prior candidate Release failure was caused solely by new CSS block interrupting that static group order. No gate removed or tolerance changed. Real source Card 7/16/4 Button 448 checks remain hard; prior 528 first-Card/2,128 Item-Field/384 Badge still hard.
- 7 current Card / 8 inner-region offline QA highlights, no previous markers. Do not package prior failed CI. PR #265 Draft, main/backup unchanged. Pending double-green final official Actions artifact. Estimate unchanged Stage3 85%, total 69%; remaining full pixel and owner review.


## CURRENT — 2026-10-10 Stage3 small Button V2 ownership correction (CI rerun)

- First candidate `3a6a5756` source-locked strict font-size/width gate correctly failed: V2 scoped `.qxframe9a7c2-button[class]` late typography wins cascade over early `src/styles/components/button.css`; actual source-paired Vega/Nova QX small Buttons stayed 12px. Previous candidate `8e8325b0` added missing default `:root/.dark` `button-sm-font-size` token after canonical Schema rejection but was not sufficient to correct cascade.
- **Real owner fixed** in `src/styles/main/theme-visual-v2.css`: co-located `.qxframe9a7c2-button.is-sm` source-size font rule just AFTER general `font-size` V2 geometry rule. Removed overwritten earlier `button.css` rule; canonical token produced in compiler/default CSS, no Preview-specific styling. Static gate enforces exactly this single consumption ownership. New strict **448 checks / 7 Cards / all 16 style-mode pairs** remain unchanged and must pass; prior 528 geometry, 2,128 Item/Field, 384 Badge acceptance remain.
- Offline ledger active ONLY **7 Cards / 8 regions**, prior yellow labels cleared. Both QXFRAME + CSS Schema pending final HEAD, no ZIP until green; Stage3 still ~85% and total ~69% before owner inspection, PR Draft, main+backup untouched.


## CURRENT — 2026-10-10 Stage3 small Button Theme schema correction (CI rerun required)

- Candidate `3a6a5756` introduced source-paired font scaling and 448 strict Button geometry assertions across 7 Cards/16 theme modes. Release caught canonical **default Nova `:root` / `.dark` Theme token omission**: `--qxframe9a7c2-theme-button-sm-font-size` was generated by `docs/create/compiler.js` but not synchronized into `src/styles/main/theme.css`. Corrected both slots to **0.8rem** (12.8px), matching pinned Nova source, and added explicit source test for 2/2 declarations. No gate weakened.
- Active offline ledger remains **7 Cards / 8 source-paired small Button inner regions** only; former Badge annotations cleared. Re-run QXFRAME + CSS Schema on final same HEAD and ship ZIP only after both success. Progress remains estimated Stage3 ~85%, total ~69% (no bonus for test or schema repair); PR Draft; main/backup unchanged.


## CURRENT — 2026-10-10 Stage3 seven-card source Button type parity (NEW CI PENDING)

- Pinned shadcn same-Chromium `inner-roles.json` found actual 7-Card **small Button** deviations: 5 Header icon-sm Cards rendered QX 12px vs source 14px for Vega/Nova/Maia/Luma/Rhea; in Savings Targets and Recent Transactions the source text-sm type was 14px (Nova 12.8px) vs QX 12px, shortening intrinsic widths. Lyra/Mira/Sera intentionally remain 12px. This is not wrapper noise; exact same DOM role and fontSize differ.
- Added one closed Theme token `button-sm-font-size` consumed in shared `button.css`, derived from existing user typography axis and pinned source-style Nova exception; no per-card CSS, no JS code. Source-paired mandatory **7 Cards × 16 light/dark Style cases × 4 font/size properties = 448 strict Button checks**. Any measured >0.5px discrepancy fails CI, in addition to existing 528 outer geometry, 2,128 Item/Field and 384 Badge checks.
- Offline QA ledger replaced with current **7 Cards / 8 precise inner regions**, including all five Recent Transactions row buttons, previous Badge highlights cleared. Changes in existing `src/styles/components/button.css` and generated Theme tokens. PR #265 remains Draft, main/backup untouched. **Current progress estimate remains Stage3 ~85%, overall ~69%** until final same-HEAD two-green CI and wider visual/pixel validation; no claim of 100% without owner acceptance.
- Pending steps: run QXFRAME + CSS Schema; if computed source width drift is found, fix shared sizing without weakening or deleting the new gate; then build official Actions Windows dist+docs QA artifact and verify marker rotation. Full nested/pixel manual acceptance still open.


## CURRENT — 2026-10-10 Stage3 ≥15-point acceptance scope — nested universal primitives + semantic Badge paints (FINAL CI PENDING)

- Locked shadcn reference `295a1f114a138f23b5dfee0e0c6812394dfeb90c`. Expanded **same-Chromium** 33 example Cards × 8 styles × light/dark = **528 source/QX Card pairs, 1,856 shared nested-role samples** in one renderer/process; 0 missing cards. Retains strict 528 first-Card geometry and height gates; wrapper difference diagnostics are explicitly NOT counted as visual failures (source uses root padding; QX distributes padding into Header/Content/Footer). Full pixel acceptance still outstanding.
- Hard new nested gate: **176 Item + 128 Field = 304 precise equivalent instances × 7 source-locked properties (x, y, width, height, fontSize, fontWeight, radius) = 2,128 pixel/typography assertions across 16 styles/modes**, a major expansion from first-Card-only checks. Current baseline source paired sample showed zero deviations among those equivalent roles. Any new >0.5px divergence fails. On top: **4 distinct Badge Card groups × 16 styles/modes × 4 geometry + 2 normalized sRGB paint channels = 384 more hard checks** (Claimable Balance, Front Door, Release Catalog, Upcoming Payments).
- Source Badge mappings: Claimable + Release use `outline`, Front Door `destructive`, Upcoming `secondary`; 1+1+4+3 = **9 actually changed Badge instances across four Cards**. Badge `is-status-label` existing framework size/editorial policy is reused. Dark destructive has source 20% alpha (light 10%); Sera secondary label text uses `muted-foreground` while normal uses `secondary-foreground`; Maia/Mira Outline surfaces need source 30%/20% border tint in light and 4.5% foreground tint in dark. These four style/color combinations are compiled into **ONE new semantic theme token** `--qxframe9a7c2-theme-badge-label-outline-bg` via `docs/create/tokens.js` + `compiler.js`; no custom `data-style` selector and no per-card PV styling.
- Offline QA active ledger **4 Cards / 4 exact grouped inside regions** ONLY, 9 physical Badges. All old yellow highlights absent. No core QX JS edit, PR #265 remains Draft, main/backup unchanged. Previous candidate `d3325a5f` source-preview geometry **SUCCESS**, badge geometry 64/64 **SUCCESS**, release failed only because the old round-level static test incorrectly forbade highlighting Release Catalog again (it was actually modified); fixed in current candidate. All new code requires both QXFRAME+CSS Schema green on the same final tree and official Actions dist+docs ZIP integrity checks before release.
- Owner requests each delivered round to advance Stage ≥15 percentage points. **Target Stage 3 70% → ~85% after this source-paired 2,512-check nested/Badge matrix fully passes**, overall CREATEAPP-V3 ~65% → ~69% as estimated. These target figures are NOT yet completed/verified and must NOT be reported as actual percentages until the final hard gates pass. Remaining Stage3 manual complete pixel/artwork/interaction review and owner signoff; Stage4/5 not started.


## CURRENT — 2026-10-10 S3 Batch A: source Badge semantics & first comprehensive nested-role gate (new CI pending)

- The first same-Chromium pinned source/QX matrix now covers **33 Cards × 8 styles × light/dark = 528 paired render groups and 1,856 corresponding nested component roles**. Zero missing source/QX cards and prior 528 first-Card geometry gate still green. The raw matrix reported 2630 wrapper-related geometry differences and 621 raw color-string differences; these are *diagnostic*, often non-equivalent wrapper padding or color-space notation. Never claim all are visual bugs; isolate equivalent nodes/roles.
- **Concrete source deviation identified:** `front-door` badge source `variant=destructive` is translucent and keeps semantic foreground, QX previously `is-error is-solid`. `release-catalog` source four `outline` labels use 500 weight (except Sera editorial) and 10px Mira; QX four had 600/12px. `upcoming-payments` source three `secondary` labels use neutral Theme Secondary and editorial Sera dimensions; QX were filled with the wrong type. Shared theme role adapters now extend QX `Badge.is-status-label` for `is-destructive/is-outlined/is-secondary`. The exact 1 + 4 + 3 Badge DOM pieces are updated, and **64 source-paired Badge samples × 4 measured properties** (4 cards with prior passing Claimable) become a **hard source-derived CI gate**. Theme remains owner, no Preview-specific paint hacks, no JS changes.
- Active offline QA ledger reset to **only current three Cards / three grouped inner Badge selectors (8 physical badges)**: Front Door, Release Catalog, Upcoming Payments. Previous Qr Connect / Cover Art / Social Links / FAQ and older marks removed. No ZIP until final new two-green CI and enough material scope for owner >=15point batch.
- Source-paired comprehensive internal layout remains not fully accepted: non-comparable wrapping structure and chart/calendar mock measurements need careful calibration; owner Stage3 70→85 target **not yet achieved**. Stage3 ~70%, whole CREATEAPP-V3 ~65% remain accurate until the larger hard-gated batch is complete. Main & backup frozen; PR #265 stays Draft.


## CURRENT — 2026-10-10 Stage3 ≥15-point batch — nested 33-card × 16-theme source measurement in progress

- Owner changed delivery policy: no more 3–5-region micro-round acceptance ZIPs; target **Stage3 70% → ≥85%**, count only confirmed scope. This work first extends existing *same Chromium, pinned shadcn source* audit from 528 outer Card checks to an **additional 528 × up to 7 nested-role samples** for Header / Content / Footer / Item / Button / Badge / Field.
- `tools/qa/preview-01-audit.mjs` writes `inner-roles.json` for all 33 cards × 8 styles × light/dark; `tools/qa/validate-preview-01-same-browser.mjs` enforces complete source/QX coverage, sufficient component sampling and emits paint/geometry **diagnostics**. It does **not** label unnormalized color strings or non-equivalent DOM wrapper differences as failures or claim full pixel parity. Follow measured output to batch fix actual shared CSS/Theme/component issues; only then expand hard acceptance scope.
- This is a diagnostic/QA infrastructure commit only: **no Preview DOM/style fix yet, so active offline yellow ledger intentionally unchanged**, and do not publish an acceptance ZIP for this checkpoint. Do not count Stage3 +15 until substantive inner-card parity is independently verified. PR #265 stays Draft; main/backup frozen; qxframe JS untouched.
- Latest verified prior release HEAD `7421a656` (QXFRAME run `37950398355` and CSS Schema `37950398391` both SUCCESS); next CI on new HEAD must be assessed as separate candidate. Progress still **Stage3 ~70%, CREATEAPP-V3 total ~65%** until new hard results.


## CURRENT — 2026-10-09 Stage3 source Secondary and Segmented Tabs owner correction (CI pending)

- Initial CSS patch `583dd93b` passed 528 geometry, but real browser computed-style gate exposed correct ownership: `src/styles/main/theme-visual-v2.css` is the **active Button paint bridge** and overrides legacy `button.css` private paint slots. Fix the **actual Preview authoring** rather than duplicate a dead CSS override: Qr Connect Got it, Cover Art Upload Artwork, Social Links Discard all map upstream shadcn `variant="secondary"` to framework `is-secondary is-solid`. Theme Visual V2 already handles that exact semantic pair in all light/dark styles; legacy interim `is-default.is-filled` patch removed.
- FAQ source Tabs active has Theme Foreground and inherited weight. Existing shared segmented Tabs CSS patch kept. Browser gate now suppresses transition timing while reading computed light/dark properties to avoid mid-transition false mismatches; 4 Cards / 4 exact QA regions only, prior round highlights removed. Runtime JS unchanged; 528/±0.5px/Schema uncompromised.
- Prior CI `CSS Schema #37948503530` failed *our new real Chromium source-role assertion*, not source geometry: wrong Button Color Axis used and palette animation was read before settling. Current candidate requires both QXFRAME and CSS Schema SUCCESS before Windows offline ZIP.
- Progress remains **CREATEAPP-V3 ~65%**, **Stage3 ~70%** pending pixel/nested-card and user signoff; PR #265 Draft, main+backup locked.


## CURRENT — 2026-10-09 S3 pinned source multi-Card Secondary/Tabs visual parity (CI pending)

- Source-pinned shadcn @ `295a1f114a138f23b5dfee0e0c6812394dfeb90c`: QrConnect `Got it`, CoverArt `Upload Artwork`, SocialLinks `Discard` each have `Button variant="secondary"`. QX Preview represents these 3 with `is-default is-filled` but its shared CSS used a too-strong semantic subtle color (Nova screenshot actual ~225 vs pinned reference ~245 in light, actual ~74 vs pinned reference ~38 in dark). Fixed shared Button color recipe with `--qxframe9a7c2-theme-secondary/secondary-foreground`, source hover alpha via color-mix; no per-card PV color hacks.
- Pinned shadcn FAQ `TabsTrigger` active is `text-foreground` with the **same inherited font weight** as inactive, while QX `is-segmented` currently inherited generic active `Primary/600`. Shared Tabs segmented active now consumes Theme Foreground and inherited weight; inactive tabs, keyboard and other Tabs variants remain unchanged.
- Batch **4 Cards / 4 precise internal visual regions** (3 secondary Buttons + FAQ selected Tab). Active offline QA ledger REPLACED: **none** of previous 4 Card / 5 Select or older yellow highlights persist. Framework JS/runtimes untouched; CSS shared components only, Theme tokens used directly. Added source-backed static checks and true Chromium light/dark computed-style parity for 3 Buttons and FAQ; 528/±0.5px and CSS Schema unchanged.
- Mandatory double-green QXFRAME/CSS Schema pending on final same-tree HEAD before official Actions dist+docs Windows ZIP. Progress estimate **Stage 3 ~70%**, total CREATEAPP-V3 **~65%**; do not mechanically advance for a CSS microcommit. PR #265 stays Draft, main+backup frozen. Stage 3 still needs full inner/nested Card pixel/semantic plus user Windows acceptance; Stage 4/5 not started.


## CURRENT — CREATEAPP-V3-S3 QX Select Label/Focus ownership — 2026-10-09 (new CI pending)

- Source-pinned **4 Cards / 5 QX Select labels**: Payout Threshold Preferred Currency, Preferences Default Currency, Transfer Funds From/To Account, Stock Performance Ticker. Root cause confirmed by locally executing bundled Preview in Chromium: non-searchable QX Select creates `div.qxframe9a7c2-select[tabindex="0"]`, **not an input**. Earlier guesses caused missing association / aborted Slider mounting. This Preview-only bridge connects the source-authored FieldLabel to the live QX root and calls `root.focus({preventScroll:true})`; existing FocusController continues to own `.is-focused`, selection, overlay and keyboard behavior. No framework JS/CSS changes.
- Local Chromium (in-memory HTML and official prior dist JS) successfully verified **5/5** labels focused the real root, `.is-focused` became true, no popup opened, values stayed unchanged, Kitchen Island's four Sliders remained mounted, no page exceptions. Added equivalent real GitHub Chromium test and static source/ledger contract. Previously completed **7 Cards / 15 native Input/Textarea/Select label links remain intact**. The 528-source same-browser ±0.5px/Card-height and CSS Schema gates remain unchanged.
- Offline QA ledger reset to **only 4 Cards / 5 exact Select Field regions**, not the 7 Card/15 native fields of the previous batch or any prior yellow highlight. Official Windows dist+docs ZIP must be built from the final two-green GitHub Actions artifact, with verified current SHA, CRC, local HTTP200, targets and no prior marked groups.
- Completion still needs full Stage 3 Preview01 pixel/nested-card/manual acceptance; Stage 4/5 not started. Progress estimate **CREATEAPP-V3 overall ~65%, Stage 3 ~70%**, not incremented per microcommit. PR #265 must stay Draft. Main/backup stay `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. For real final CI IDs and ZIP result, see PR #265 checkpoint.


## CURRENT — 2026-10-09 Stage3 7-Card native label source parity (full CI pending)

- Real Chromium on prior candidate verified **all 15 native Input/Textarea/Select label click-to-focus checks passed**; the separate 5 runtime QX Select label-to-trigger cases failed and remain **NOT COMPLETED**. Discarded only that unaccepted Select adapter, which had temporarily interrupted downstream Slider mounting; existing QX Select/Slider/Tabs implementation restored unchanged.
- Native scope: 7 Cards / 15 FieldLabel-to-native-control connections. Cards: Payout Threshold (Notes), Savings Targets/Buy Investment (Amount, Order Type), Account Access (Email, Password), Transfer Funds (Amount), Receiving Method (Holder, IBAN), New Milestone (3 fields), Social Links (4 fields). Added strict 15/15 real browser associations, existing 528 same-browser ±0.5px and CSS Schema gates unchanged; no framework runtime or shared CSS edit.
- Offline active ledger reset to exactly these 7 Cards / 15 label+field rectangles. Old Kitchen/Roller/Release/Notifications and earlier yellow marks absent. Full QXFRAME+CSS Schema both must be SUCCESS on final HEAD before Windows dist+docs ZIP release.
- Stage3 estimated ~70% (not user accepted), whole CREATEAPP-V3 ~65%; Stage4/5 not started. PR #265 Draft, main+backup frozen. Next batch tackles 5 runtime Select associations separately using QX Controller-owned focus.


## CURRENT — 2026-10-09 CREATEAPP-V3-S3 FieldLabel visual focus batch (new CI pending)

- Source pinned `shadcn-ui/ui@295a1f114a138f23b5dfee0e0c6812394dfeb90c` uses `FieldLabel htmlFor` and an exact native Input/InputGroupInput/Textarea/SelectTrigger `id` in Payout Threshold, Preferences, Savings Targets/Buy Investment, Account Access, Transfer Funds, Receiving Method, Stock Performance, New Milestone and Social Links. Our Preview 01 authored **twenty unassociated labels**, leaving clicks unable to deliver the associated input's visual focus. This batch connects twenty labels to actual native controls and, for runtime QX Select, its actual `getInputElement()` focus input. QX Select remains the only Focus/Value/Overlay owner and `src/qxframe9a7c2.js` stays unchanged.
- Batch **9 Cards / 20 exact label+control field regions**. Active offline yellow groups are *only these 9 cards*. Previous Kitchen Island, Roller Shades, Release Catalog, Notifications and older Front Door/FAQ/etc. groups removed from current ledger; history retained in README and PR.
- New static tests require exact current ledger, twenty source field associations and Select focus ownership. New real Chromium test clicks all twenty labels and asserts `label.control === actualControl` and `document.activeElement === actualControl`. Strict 528 / ±0.5px, CSS Schema, runtime JS unchanged and pinned source gates all remain. This is real internal focus presentation parity, **not an unmeasured Card-height claim**.
- Baseline previously validated HEAD `56588ea6`, dual-green QXFRAME #37936538257/CSS Schema #37936538247; 528/528 first Card height diagnostic >0.5px = 0. Next require both suites SUCCESS on final HEAD before packaging real Actions dist/docs ZIP. Stage 3 remains open, overall project ~65%, Stage3 ~70% estimate pending user visual validation. PR #265 Draft, main and backup locked.

## VERIFIED — 2026-10-09 S3 4-Card controlled state and rotating offline QA ledger

- **Validated code HEAD:** `015523f77bfd1755d9b95dc1357c55a2cf87692e`; QXFRAME CI [#37935530883](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37935530883) **SUCCESS** (Release, Windows tools, pinned same-browser source-preview geometry all SUCCESS); CSS Schema Acceptance [#37935530939](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37935530939) **SUCCESS**. Code tree `9ffe9ccbb6363512ababd4c851e9f95dd02b900e` equals PR synthetic merge `3f253f32617af8a26159e77189491e9753c891a0` tree. Prior candidate `91fe34a7` Release FAILED because its static test still expected *previous-round* Front Door marks; `015523f7` rotated that gate correctly without weakening a geometry tolerance.
- **Completed, source-pinned Preview 01:** Kitchen Island scene/group controls now update four QX Sliders and obey master power; Roller Shades presets and shade art follow Slider value; Release Catalog single category button selection now responds (upstream still shows all four holdings); Notifications four native checkbox choices control master checked/indeterminate and vice versa. Existing framework QX Slider and Checkbox state remain canonical; no runtime qxframe.js change, no universal CSS/Theme geometry overrides.
- **Offline QA ledger:** Only Kitchen Island (scene selection + power, 2), Roller Shades (shade artwork + preset buttons, 2), Release Catalog (category selection, 1), Notifications (master+four choices, 5). **4 Cards / 10 exact regions**, not accumulated from prior batch; Front Door stripe and old Kitchen slider-rail yellow marks are removed. Packager's README text now derives from the live ledger rather than naming previous-round Cards.
- **Windows ZIP validated for that green code HEAD:** official Actions dist+docs artifact `11618462309`; generated local ZIP with 739 files / 7,708,739 bytes / SHA256 `be822913adcca2f49c41ca85699e42830dbf73c5d7dc3da5f48f0b086b26ffc0`, CRC PASS, nine local HTTP200 responses, ten selector targets matched uniquely, no old annotations, exact HEAD injected. Local Chromium overlay click/toggle verification was blocked by local browser administrative policy; treat it as **unverified**, not passed. CI Chromium source/component browser gates passed separately.
- **Remaining:** Stage 3 Preview 01 full pixel/semantic parity and Windows manual acceptance; offline yellow overlay user click/toggle review, nested Cards and Preview 02 as scheduled; Stage 4/5 not begun. The 528 strict source-pair/±0.5px gate remains unchanged; green geometry job is not equal to 100% visual parity. Overall project estimate **~65%**, no artificial per-commit increment.
- PR #265 stays Draft/open/unmerged, `main` and `backup/main-before-pr265-2026-10-08` remain frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. This documentation checkpoint must receive its **own full two-suite CI** before a new HEAD's ZIP may be published. Exact doc-HEAD run numbers belong in the next PR checkpoint.


## CURRENT — 2026-10-09 CREATEAPP-V3-S3 multi-Card controlled visual state (new CI pending)

- Live Git baseline PR #265 Draft/unmerged at `dc7e070581b8a9fe280a300d837286ce7cbea277`: QXFRAME #37931075977 **SUCCESS**, CSS Schema #37931076100 **SUCCESS**; previous `AI_WORK_STATE.md` top pending was stale. Main and backup stay `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. Overall ~65%; Stage 3 not user accepted, Stage 4/5 not started.
- New source-pinned `preview-02/cards/{kitchen-island,roller-shades,release-catalog,notification-settings}.tsx` behavioral/visual batch: shared Preview authoring for single-selection ToggleGroups, QX Slider value/disabled state and native checkbox indeterminate sync. Kitchen Scenes apply 4 pinned presets and master power disables scene buttons/Sliders; Roller Shades presets and dragging keep shade height/selected button in sync; Release Catalog only updates active category without inventing filtering; Notifications master updates all 4 choices and reflects mixed state.
- This is cross-Card Preview 01 **controlled visual state parity**, not a new shared CSS geometry recipe and **not a first-Card height improvement**. Framework qxframe.js remains frozen; QX Slider and native input remain state owners. Existing geometry 528/±0.5px, CSS Schema, same-tree dist/docs, all regressions unchanged.
- Active yellow QA ledger reset to ONLY 4 Cards / 10 exact regions: Kitchen (scene bar/power), Roller (shade/preset), Release Catalog (category bar), Notifications (master+4 choices). Prior Kitchen four rails and Front Door stripe, FAQ/Savings/Transactions/Syncing are NOT highlighted. New ZIP may be published only from final *two-green* HEAD official Actions artifact with HEAD stamp and verification.
- NEXT: GitHub atomic candidate -> both full QXFRAME/CSS Schema success -> inspect actual Chromium controlled-state step and 528 geometry -> release same-tree Windows dist/docs offline ZIP -> PR #265 checkpoint. CI is pending, not claimed successful.

## CURRENT — 2026-10-09 S3 Kitchen four equal rails: standalone Slider min-width collision (CI pending)

- Reconciled live Git HEAD `e6566178b03918901293a0d233b9137de584deb9`, PR #265 Draft/unmerged. QXFRAME #37929320175: **Release SUCCESS**, **windows-tools SUCCESS**, source-preview-geometry FAILED the newly added strict Kitchen source comparison for Maia; CSS Schema #37929320258 SUCCESS. Exact failing source Maia rails x209.42/w126.44/h12 vs QX x209.42/w128/h16. Their centers already match; the QX Slider's `min-width:8rem` default prevents the flex share shrinking to 126.44px. The other four rails match x, so no change to Item flex allocation or gap required.
- Fixed **shared owner** `src/styles/components/item-surface.css`: opt-in `.qxframe9a7c2-item.is-actions-equal .qxframe9a7c2-slider{min-width:0}` ONLY within equal-actions Item, preserving general Slider's 8rem public default and legacy standalone behavior. This allows four source rails to resolve to actual equal flex slots across Vega/Maia/Lyra/Luma/Rhea, avoiding a fixed pixel or Style branch. Eight-style Chromium regression asserts all four Slider roots compute min-width 0. Existing strict source-pair x,width,right edge,vertical center <=0.5px unchanged.
- Required Windows bundle current-only yellow QA ledger ALREADY reset on prior batch: 2 Cards only, Kitchen Island four rails and Front Door thin stripes (5 regions). Do not highlight FAQ/Savings/Transactions/Syncing again. The actual package must be built once from final double-green Action, with exact HEAD stamped in those five regions. Main & backup remain frozen. Overall ~65%, Stage3 open; Stage4/5 untouched.
- NEXT: atomic commit, full QXFRAME + CSS Schema CI both SUCCESS on new HEAD, inspect source paired rails and Release, then download exact same-tree dist/docs artifact, assemble local Windows ZIP, test 2 Cards / 5 regions only, ZIP CRC + HTTP200 + click/highlight toggle; PR Draft.


## CURRENT — 2026-10-09 S3 Kitchen Item equal Actions and source row gap (new final CI)

- Candidate `3bea7c7d81cb1d3c48d00bebc7397b9d56e51798` strict source CI FAILED Maia: source 4 slider rails x=209.42,width=126.44, QX x=207.42,width=128.42, all four equally aligned. Source structure proves row Item gap =14px Maia/Luma/Rhea, while QX shared Item.is-sm gap=12px. Vega/Lyra source and QX row gap=10px. This is a **shared Item gap geometry recipe** difference, not Slider ValueController or per-style fixed pixel.
- Existing Theme `--theme-item-space` is 14px spacious and 10px compact. Existing `--theme-item-sm-reduction` is 4px Vega, 2px other Styles (see compiler.js). Equal-action source recipe maps Vega 14 - 2*(4-2)=10px, spacious others 14px, compact 10px. Added an opt-in shared `Item.is-actions-equal` gap consumer deriving the row gap from these **existing** Theme roles with no new tokens, custom Style names or Preview CSS. Two child flex:1 sizes then match five source sampled Style rail widths/left/right/centers within existing new ±0.5px gate.
- Keep all previous strict verification gates and current round offline marks only two Cards/five regions: Kitchen 4 rails, Front Door thin stripe; historical yellow highlights absent. Same final HEAD both QXFRAME/CSS Schema SUCCESS still required; official Actions artifact local ZIP only after CI success. No PR merge, no main/backup change, Stage3 pending.


## CURRENT — 2026-10-09 S3 Kitchen equal-flex source invariant (final CI pending)

- Candidate `9aca424f6394cb8b0d1092d49d0aef8418faa1af` source CI proved Preview flex conflict removed and rails aligned, but Lyra source (x186, w121) vs QX (x184.69,w128) still failed exact right-edge; a 44% guess was insufficient. Original pinned source node trace revealed decisive architecture: **cn-item-content flex-1 and cn-item-actions flex-1**, both measured 121px in Lyra. Restored one shared generic *equal halves* variant `Item.is-actions-equal .item-actions{flex:1 1 0}` matching default `ItemContent{flex:1 1 0}`, not a guessed percentage. Four Kitchen rows opt in; old Preview private flex veto already removed. Strict source paired x, width, rail right-edge and center all now **<=0.5px** for five source-traced Styles. Browser check asserts four equal action shells in all eight Styles.
- Batch scope stays Kitchen four rails and Front Door placeholder lines. **Current-only** offline QA ledger 2 Cards/5 regions, no old yellow highlighters; packager stamps final HEAD for all records. QXFRAME and CSS Schema complete SUCCESS plus same-tree official ZIP still required. PR #265 Draft, main/backup `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3` untouched, Stage3 pending.


## CURRENT — 2026-10-09 Batch Kitchen slider root owner correction after source CI (rerun required)

- Candidate `8968b848e2c6c45c05abd04eea7e403857990fd7`: source-preview-geometry #37927531635 FAILED the **new** strict Kitchen 4-rail x gate. In Vega the four QX slider widths all corrected to 132.36px versus upstream 132.44px, but x remained at [147.58,151.31,125.08,105.86] instead of uniform 205.42. Genuine root cause: preview.css legacy `.pv-slider-item .qxframe9a7c2-item-content{flex:0 0 auto}` and `.pv-slider-item .qxframe9a7c2-item-actions{flex:1 1 auto}` replaced framework Item flex distribution, so making right actions proportional alone cannot move their left edges. Removed BOTH old private flex policies and restored canonical shared ItemContent flex-grow plus new opt-in shared fixed-proportion ItemActions. Preview retains only child slider host flex. Source same-browser x/width/center and eight-style Create gates unchanged; **no gate weakened**.
- This remains one batch: Kitchen four rails + Front Door thin stripe artwork. Offline QA active ledger **only 2 Cards/5 regions this round**, no old yellow highlights. Next new final HEAD CI both green and same-tree official Actions bundle; no merge, main+backup frozen, overall~65% Stage3 open.


## CURRENT — 2026-10-09 S3-BATCH-KITCHEN-FRONT-001 (final CI pending)

- Reconciled stable development `943960ff1823ec3b5b4326b11aae8f81fec58bfd`, QXFRAME #37924086652 / CSS Schema #37924086734 SUCCESS; PR #265 Draft and main/backup frozen `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. Owner expressly requires **each Windows demo shows ONLY this batch's yellow highlights**; prior batch's overlays must be dropped.
- Source-pinned same Chromium five-style Kitchen Island shows four slider rails aligned to common x and right edge (Vega source width 132.44px; Maia/Luma 126.44px; Lyra 121px; Rhea 130.44px) regardless of label length. QX's four rails formerly had dramatically different widths (~178–232px), because ItemActions occupied free space to the right of intrinsic ItemContent. Added shared opt-in `Item.is-actions-proportional` (44% of Item inner width for the action area), authored on four Kitchen slider rows. Existing default ItemActions unchanged, no Theme token or qxframe.js modifications. New pinned same-browser geometry test checks all four starts equal, right edge and vertical center ±0.5px, x/width deviation <=8px in five styles, original strict Card height unchanged. All eight styles Create Chromium asserts rows use modifier and common slider x. Do not claim full strict ±0.5px internal accept at this intermediary precision.
- QX Front Door placeholder had 10px thick alternating diagonal stripes vs source delicate line-art placeholder. Modified only `docs/create/preview.css` private decorative `.pv-stripes` to narrow border-colored lines and transparent 8px gaps; reusable CSS Item layout stays in shared item-surface.css.
- Active offline QA ledger RESET: only Kitchen Island (Brightness/ColorTemp/Volume/Fade) and Front Door (`.pv-stripes`) => **2 Cards / 5 tracked internal regions**. Prior FAQ, Savings Targets, Recent Transactions and Syncing State marks are absent from this bundle, though fixes persist in source and history. Packager now stamps final CI HEAD on all five entries, not just one. `verify-create-app` strictly checks only current Card/region selectors and no previous highlight groups. AGENTS.md formalizes non-accumulation. Production docs continue not to load overlay.
- NEXT exact steps: one atomic Git commit (source+tests+AGENTS+QA ledger); both QXFRAME and CSS Schema green at same HEAD; inspect any geometry CI failure and repair real shared cause; download matching real Actions dist+docs artifact; build Windows local ZIP, validate 2 Cards/5 accurate marks, no old yellow Card, on/off and README + CRC/HTTP200. No merge. No inflated progress: overall~65%; Stage3 open; Stage4/5 not begun.


## CURRENT — 2026-10-09 Syncing glyph exact static authoring assertion repaired (new final CI required)

- Latest `ec3ba7f4fbb1cff7ba85f193a799cc51b092f8d0` QXFRAME #37923808097 Release FAIL at strict static `verify-create-app` pattern: expected `qxframe9a7c2-empty-media is-icon` followed by closing quote; legitimate new authored `is-glyph-sm` extends same icon container class and invalidates old exact markup text. **Structural parent / nested media role unchanged**. Updated verifier to require the complete new `...is-icon is-glyph-sm` markup exactly (no permissive regex), and kept icon/glyph computed + pinned source ±0.5px assertions.
- Prior `02f3acd9` source-preview-geometry job was SUCCESS; CSS owner ratchet failure fixed in `ec3ba7f4` via existing variable **consumer** not declaration; after this last verifier update, both complete workflows must pass on identical final HEAD. No forced Card heights, token expansion, runtime JS, change to main/backup or premature PR merge. User's offline Card precise region ledger 7 modifications, dynamic count and ZIP-stamped exact HEAD retained. Total~65% Stage3~66% until CI.


## CURRENT — 2026-10-09 S3-SYNCING-GLYPH-001 public Token declaration ratchet repair (new final CI pending)

- `02f3acd9` QXFRAME #37923344273 source-preview-geometry SUCCESS (new five-style source-paired 16px spinner glyph + center test), but Release FAILED on strict CSS Schema size/owner ratchet: `public-component-token-declared` +1 due to opt-in `.is-glyph-sm{--qxframe9a7c2-empty-icon-size:1rem}`. This is NOT geometry failure. CSS Schema first-HEAD run was cancelled as newer `def8124f` queued. Neither upstream thresholds nor verifier may be relaxed.
- Resolved real owner/rachet issue: shared Empty opt-in now styles only glyph SVG at higher specificity `.qxframe9a7c2-empty-media.is-icon.is-glyph-sm>svg` with `width/height:var(--qxframe9a7c2-empty-icon-size,1rem)`, reusing existing public input (if user explicitly supplies it) and source 1rem fallback. **No additional public token declaration** and no new Theme role. Default all other Empty instances unchanged. HTML and strict browser/source QA unchanged.
- Prior `def8124f` additionally fixes offline ledger dynamic 7-region count and bundle-resolved final commit id. Need new final-HEAD both complete QXFRAME and CSS Schema SUCCESS, same-tree Actions artifact, annotated Windows bundle, no merge. Stage3~66%, overall~65%, PR #265 Draft; main/backup `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.


## CURRENT — 2026-10-09 S3-QA-MARKER-CONSISTENCY-002 finalizing source-backed Syncing glyph (new final CI pending)

- First commit `02f3acd97ce2e65f61c68437dcdfe7f61ae77c17` adds proven 16px Syncing icon glyph and strict source-paired + all-eight-Styles Create browser checks, plus precise seventh offline annotation. Git state remains PR #265 Draft, main/backup frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- Proactively caught annotation correctness defect before Windows QA: previously the panel heading literal `Preview 01 · 6 处` would be stale as soon as a seventh region was added. `offline-qa-changes.mjs` now computes live count from its array with `groups.reduce`. New change's commit label uses one `__QA_BUNDLE_HEAD__` placeholder, and official `tools/qa/build-offline-demo.py` replaces it with the exact final development SHA prefix **after** verifying the source ZIP, before local-only injection. `tools/verify-create-app.mjs` strictly asserts count/placeholder/builder paths in addition to no online HTML overlays. No marked Preview02 false claims.
- NEXT: final single new HEAD both complete CI suites SUCCESS, exact Actions dist/docs artifact, using committed offline packager; local browser verify 4 Cards/7 marked regions, dynamic panel count=7, exact HEAD in glyph tooltip, click-to-jump, clean mode and ZIP CRC/HTTP200. Must not deliver previous pre-fix package. Overall~65%, Stage3~66% estimates; Stage4/5 pending.


## CURRENT — 2026-10-09 S3-SYNCING-GLYPH-001 shared Empty compact glyph (CI pending)

- Reconciled Git/PR/CI stable HEAD `b424cb37879adadd013035252fb864451ce09f75`: PR #265 Draft/unmerged; main and backup `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`; QXFRAME #37921619118 and CSS Schema #37921619145 SUCCESS, 528 first Cards and all existing pinned strict geometry checks passing. Successful local annotated Windows ZIP was delivered (4 Cards / 6 regions).
- Source paired same-Chromium node logs revealed a new **true internal mismatch** in Syncing State: source EmptyMedia glyph is 16x16px across Vega/Nova/Maia/Luma/Sera while QX spinner glyph computed/theme size is >16; outer 32/40px EmptyMedia and Card geometry already match. Fix only glyph: shared reusable CSS modifier `.qxframe9a7c2-empty-media.is-icon.is-glyph-sm` sets existing public `--qxframe9a7c2-empty-icon-size:1rem`, opt in on Preview01 Syncing; no global changes or new Theme token. Keep source media/outer Card dimensions intact, other Empty instances unchanged.
- Strict Stage3 pinned-source regression now compares computed CSS SVG width+height (not animation-transformed bounding width) and SVG center/media size for five sampled Styles. Create Chromium checks all eight styles for 16px computed dimensions, 32px+ media, exact glyph modifier. Existing QA offline Card/inner-region ledger adds Syncing icon exact region, previous Syncing text record now references `b424cb37`, for 4 Cards / 7 regions total. No a11y/ARIA/RTL/old browser workaround, JS runtime or fixed Card height changes.
- NEXT: one atomic Git commit, both full QXFRAME + CSS Schema SUCCESS, verify same Git tree and download real Actions dist+docs artifact. Rebuild annotated ZIP using committed `tools/qa/build-offline-demo.py`; verify 4 Cards / 7 inner regions, clickable change locator, on/off/on, ZIP CRC and HTTP200. PR Draft; no main/backup change. Overall ~65%, Stage3 ~66% estimate, Stage4/5 unstarted.


## CURRENT — 2026-10-09 S3-QA-ANNOTATIONS-001 & syncing source text/wrapping (new CI required)

- Resumed from Git verified HEAD `e4fa02d5c731de5497b4ee3ae6bd9b9b6120062a`, PR #265 Draft, main/backup `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. QXFRAME #37918985032 and CSS Schema #37918984965 **both SUCCESS**, source geometry 528/528 verified; Windows offline bundle for prior HEAD delivered.
- Owner requirement: from this package forward, annotate **exact Create Card and changed inner region**, not a vague changed page. Added `docs/create/offline-qa-changes.mjs` Card/region change ledger (FAQ, Savings Targets, Recent Transactions, Syncing State), and `offline-qa-changes.css` bright Card outline + dashed inner changes; clickable local panel, commit/change explanation, one-click marker off/on, Preview02 explicitly unchanged. `tools/qa/build-offline-demo.py` injects script+stylesheet **only into extracted Windows package**, never production HTML/CI browser, and uses Actions real dist/docs artifact. `AGENTS.md` makes this ledger/update/injection mandatory for every subsequent local bundle. `verify-create-app.mjs` asserts no online HTML links to overlay, ledger selectors and builder. New bundle must be browser-inspected for accurate marks and off mode.
- Additional source-backed Preview01 discrepancy: Syncing State description source uses straight ASCII apostrophe and visually balanced sentence wraps. QX had curly apostrophe and greedy wrapping that moved `This` onto first line. Shared Empty opt-in `.is-balanced` applies `text-wrap:balance` without changing default; HTML restores exact source text. Create real Chromium verifies literal copy and computed wrap in 8 styles. Previous first Card/source paired shape/color thresholds untouched.
- NEXT: submit single atomic PR-branch commit; new HEAD full QXFRAME + CSS Schema SUCCESS required; obtain same Git tree Action artifact; generate **annotated** Windows ZIP; validate 4 Card markers/6 precise regions, clickable locator + clean state, local HTTP + ZIP CRC. PR Draft; no main/backup write. Overall ~65%, Stage3 ~64% pending final success; Stage4/5 untouched.


## CURRENT — 2026-10-09 Native Collapse color owner repaired after strict CI failure (rerun pending)

- Commit `8c871b8e3ac2af7a4731e643e9eb7c2ca607230e`: QXFRAME #37918375886 source-preview-geometry SUCCESS (new eight-style Savings note intrinsic-text geometry gate); CSS Schema #37918375804 FAILED in real Create browser: FAQ all nine answers still `oklch(0.708 0 0)` while Card foreground `oklch(0.985 0 0)`.
- Real cause: `.qxframe9a7c2-collapse.is-native>details>.qxframe9a7c2-collapse-content` had a *second* higher-specificity color owner fixed to `--theme-muted-foreground`. Updated that exact native rule to consume the same public `--qxframe9a7c2-collapse-content-color` with its existing muted Theme fallback; default native Collapse unchanged. Do NOT remove or soften the browser gate. General Collapse still falls back to its own prior secondary semantic.
- Next: both complete workflows SUCCESS at new HEAD, unchanged main/backup and PR Draft, matching Actions dist/docs Windows offline ZIP from identical Git tree. Stage3 still not fully visually/manually accepted, Stage4/5 untouched, progress total~65% Stage3~64%.


## CURRENT — 2026-10-09 Stage 3 shared FAQ prose / Savings footer note parity (CI pending)

- Reconciled Git/PR/CI at stable development HEAD `34b369233bc14e06bf6e57c7cf1395296828d53c`: PR #265 Draft/unmerged; main and backup at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`; QXFRAME CI #37916334634 and CSS Schema #37916334873 both SUCCESS, 528/528 first Card height diagnostic 0 above 0.5px. Previous Windows package delivered.
- Task S3-FAQ-SAVINGS-VISUAL-003: source-pinned Nova reference versus QX screenshot shows FAQ answer prose must use normal foreground; QX Collapse default renders it muted. Shared `collapse.css` now consumes public per-instance `--qxframe9a7c2-collapse-content-color` with unchanged secondary fallback; the composed FAQ Card sets this one existing Theme foreground role for all nine answers (no preview-owned CSS, no JS runtime change).
- Savings Targets footer note's source has an intrinsic text-width centered child; QX's authored `pv-full` inflated its flex width, shifting text in Preview 01. Removed only this superfluous class; no height locks. Pinned same-browser source trace strict-checks note x / width / height for all eight Styles (light); existing first-Card + Sera full sibling thresholds unchanged. Create Chromium test checks all nine FAQ answers use Card foreground while preserving panel activation.
- NEXT: full QXFRAME + CSS Schema on new submitted HEAD, fix any real regression, use only final-HEAD successful Actions artifact to rebuild Windows ZIP (local JS / CRC / HTTP). Owner manual Stage3 approval pending; Stage4/5 untouched. Estimates total ~65%, Stage3 ~64%.


## CURRENT — 2026-10-09 Fix Release static FAQ attribute-order contract (new final CI required)

- HEAD `24bcbaaab54b7f5ed9af929f3bafeef2e19ff98f`: QXFRAME #37916022095 source-preview-geometry SUCCESS, Windows tools SUCCESS, but Release FAILED on `Full release verification`: strict pre-existing `verify-create-app` pattern requires adjacent `data-pv-tabs data-type="segmented"`. Adding `data-pv-equal` between the two accidentally broke this valid authoring contract. The new shared Tabs and Table CSS are not implicated by this failure.
- Corrected Preview01 FAQ authoring to `data-pv-tabs data-type="segmented" data-pv-equal`. No verifier edits or tolerance changes. The next *single* HEAD must pass complete QXFRAME and CSS Schema workflows; then download the matching Action's actual dist/docs ZIP and package a Windows offline demo. PR #265 remains Draft; main/backup unchanged. Overall~65%, Stage3~64% pending owner acceptance.


## CURRENT — 2026-10-09 Stage3 shared Table muted cell color (CI pending)

- In pinned source Nova visual screenshot, Recent Transactions' five date cells use muted-foreground. QX screenshot showed regular/darker text even though cells carried `pv-muted`; cause: Table row's high-specificity `tbody tr > td` foreground owner overrides lower-specificity standalone preview utility.
- Task S3-TABLE-MUTED-001: shared opt-in `Table td.is-muted` sets Theme muted foreground, with optional public table muted override. Preview's five date cells consume that role instead of relying on a defeated preview utility. Browser test asserts all five date computed foregrounds equal Theme muted. No global Table default color change, no Preview CSS patch, no token expansion.
- Combine with prior `b1919e1d` shared `Tabs.is-equal` FAQ layout and the 16-mode Buy Investment peer geometry audit. Both full CI workflows mandatory at the new final HEAD. No merge. Overall~65%, Stage3~64% until wider visuals+manual owner signoff.


## CURRENT — 2026-10-09 Stage3 FAQ Tabs equal-width source layout (CI pending)

- Real pinned source vs QX Nova visual comparison showed FAQ segmented **General/Billing/Goals** source tabs fill the entire rail with three equal-width slots, while QX left a large unused segment to the right. The generic Tabs component only had intrinsic-width shells.
- Task S3-TABS-EQUAL-001: add opt-in shared `Tabs.is-equal` flex distribution without modifying intrinsic default, vertical/overflow behavior, Theme tokens, or JS runtime. Preview 01 opts in via `data-pv-equal` and authored mounting adds shared CSS modifier on the actual Tabs root. Added real Chromium FAQ regression that all three tabs have equal width and together fill the list; existing activation/panel test remains.
- Latest working parent `2d57916825f38d183ae4f17d91bb8eee2985a8bd` included 16-mode Buy Investment sibling diagnostics with 0 Card outer height/width deltas; internal placement still not certified. Preserve all 528 source and Sera peer assertions. Current update must run both complete workflows on final head and generate the same-tree Windows demo ZIP before delivery. PR #265 Draft, frozen main/backup, overall~65%, Stage3~64%, Stage4/5 untouched.


## CURRENT — 2026-10-09 Stage3 Buy Investment sibling source diagnostics (CI pending)

- Verified stable HEAD `645d884c77d900f8a0e346fd8217f55e70544f59`: QXFRAME CI #37912898948 / CSS Schema #37912898938 SUCCESS, 528/528 first Cards within 0.5px, PR #265 Draft, main and backup frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- Task S3-SAVINGS-PEERS-002: first Card checks and the Sera two-column peer gate do not cover adjacent **Buy Investment** in the other Styles. Extend pinned-source Chromium audit to emit both Card widths/heights and subtree details for eight Styles/light-dark. Existing strict gates unchanged. This is *diagnostic coverage*, not a completed visual fix.
- Next: inspect source-vs-QX sibling deltas in actual CI logs; repair shared CSS geometry with regression assertion; obtain two green workflows for the same final HEAD and Windows offline dist/docs ZIP. Stage 4/5 untouched. Estimates overall~65%, Stage 3~64%.


> Persistent recovery checkpoint. Read `AGENTS.md` first.
> Git / PR / CI facts override stale text here. Always query the current branch, PR and Actions before continuing.
> Keep CURRENT concise. Historical investigation belongs in Git history and task change documents.

## CURRENT — 2026-10-09 DatePanel shared Theme Geometry owner fix (new CI required)

- On `ec70db9c7dedb1fa220f763698a0096bdb935529`, QXFRAME #37912292100 source-preview-geometry job #113760062249 SUCCESS: 528/528 matched, 0/528 first Card height outliers, 0 unauthorized four-property differences, 66 permitted Luma caps. Windows tools SUCCESS. CSS Schema #37912292118 FAILED during Theme Studio browser because the new source-paired DatePicker radius assertion found standalone DatePanel day radius **4px vs Button 10px**, even after DateCell switched from navigation to action radius.
- Root: shared Theme geometry resolver in `src/styles/main/theme-visual-v2.css` assigns `--_qxframe9a7c2-action-radius` to Button/Calendar/PeriodPanel roots but omitted the generic `.qxframe9a7c2-date-panel` root. DateCell inherited legacy `--_action-radius` (4px). Registered DatePanel in the **existing same geometry owner selector**, reusing the exact Button radius/size formula, no copied color or radius formula, no new theme token, retains public overrides.
- Both CI suites must pass on next HEAD, including the new Create browser gate measuring Select natural one-line/sm-md-lg height, multi-line/custom expansion, and Date/Period selected Primary+Button-radius. No constraints relaxed, no main/backup/JS runtime changes. Earlier Select `1.4em` constraint defect already replaced with rem-sized Control font token × unitless1.4.
- Overall program ~65%, Stage 3 ~64%, targeted task ~85% until two full CIs + matching Windows dist/docs artifact and manual visual signoff.

## CURRENT — 2026-10-09 Select padding CSS unit-ratchet correction (CI pending)

- First branch head `55f9756019e6e28539551afca87facdb1a28ccbe` QXFRAME release job #113758921256 failed v3 CSS constraints only: one new `em` unit in Select ItemCollection block-padding; rule forbids non-rem length increases. Corrected to arithmetic of `--_qxframe9a7c2-control-font-size` × unitless `1.4` and Control height (no fixed row height). No gate ratchets loosened. Other source geometry/browser/schema must be verified again on new HEAD.

## CURRENT — 2026-10-09 Stage3 Select option natural height + DatePicker Primary/Shape regression (CI pending)

- Reconciled last accepted HEAD `7c2a90f557954b4c5101cf4f9fbc6e869041586a`: [QXFRAME CI #37907490867](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37907490867) and [CSS Schema #37907490909](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37907490909) both SUCCESS. Source same-browser 528/528, **0/528** first-Card height >0.5px, zero unauthorized four-property differences, 66 allowed Luma radius exceptions; matching Windows dist/docs local ZIP delivered. PR #265 Draft/Open/unmerged, main and backup frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- **New owner feedback, Task S3-SELECT-DATE-SHARED-001**: Select options too tall; should align a one-line option height to the Select Control without fixed item heights, and allow multiline/rich options to expand. Shared `ItemCollection` originally used `min-height:--list-row-height`, `overflow:hidden;white-space:nowrap`, and clipped all content slots. Replaced option min-height with natural block padding: `max(0px,calc((Control height - Control font-size × 1.4)/2))`, while preserving user-controlled padding override and generic group header height; allowed option/label/custom content wrapping, no JS geometry changes.
- DatePicker/Calendar `DatePanelCell` used navigation radius instead of Button Action radius; Calendar/PeriodPanel outer shells used data radius instead of Popup radius; PeriodPanel cell used navigation radius. All switched to existing Action/Popup radius owners, retaining public calendar/period-specific explicit overrides. Selected day normal used full Primary but selected hover/active mixed Primary at 80% against transparent. Removed that selected-only opacity rule: selected day and month now keep a fully opaque Primary fill/border in pointer, active and keyboard states; in-range soft 10/20% remains intentionally semantic.
- Browser regression inserted into existing `verify-create-app-browser.mjs`: Select md/sm/lg one-line height equals resolved Control; multiline and custom-rendered grow unclipped; DatePicker and PeriodPanel day/month radii follow Button; selected backgrounds remain identical to Theme Primary on hover. No Preview private CSS, no new Theme tokens, no JS runtime changes, no threshold relaxation.
- **Current action**: commit shared CSS/browser test/docs to `redesign/create` and verify both complete CI suites; repair regressions before delivery. Final ZIP must come from this same accepted HEAD's successful GitHub Action dist+docs artifact; no main merge. Progress conservative total~65%, Stage3~64%, task implementation~80% pending CI + manual local visual verification.

## CURRENT — 2026-10-09 Stage3 Sera Savings shared Flex gap-inheritance regression closeout (CI pending)

- Latest verified source-paired baseline remains `a113163f2915f612dcb903ded559d9773e21fe8d` with 528/528 pairs, 2/528 height outliers, 0 unauthorized subset differences, 66 approved Luma radius caps. Later commits `ec8f46d`, `6d7bb85` and `5d165318` exposed strict failures; none were claimed delivered. PR #265 must stay Draft, main+backup frozen.
- Paired Chromium failure on `5d165318`: Vega Savings first Item source 148px vs QX204px, Card source472px vs QX584px **even with `align-items:flex-start`**. The actual root is inherited public `--qxframe9a7c2-layout-gap:var(--create-gap)` on Savings row: all inner generic Flex/Stack consume this inherited variable instead of their own normal .is-gap-3, inflating the two ItemContent blocks. The conditional peer alignment hypothesis was false and withdrawn.
- Replaced author-authored pair with `qxframe9a7c2-flex is-stretch is-equal` and inline **direct `gap:var(--create-gap)`** (noninheriting gap property). Reverted interim style-specific `card-peer-alignment` token, compiler, default root/dark and CSS selector completely. Framework generic stretch and equal-width Flex remain reusable, no Card fixed heights and no app-private CSS added. Offline Chromium source-style comparison confirms the generic direct-gap stretch preserves Vega first Card472px and first Item148px (bad inherited-var wrapper produced584/204), while stretching Sera peers; only the full pinned GitHub CI can confirm strict 528 pairs.
- The shared Button.sm inset role from the earlier batch remains: source Sera New Goal width115.922px, header description22.75px. Strict two-card Sera gate remains intact. Check both full CI suites on newest HEAD, generate matching GitHub Actions dist+docs artifact Windows ZIP (local Create/Preview JS, ZIP CRC/HTTP verification), update PR. Stage 3 manual visual/interaction and non-first-Card checks remain unfinished, Stage4/5 untouched. Provisional total65%, Stage364%.

## CURRENT — 2026-10-09 S3 transition: source-locked Sera peer stretch, non-editorial Buy Investment remains unaccepted (CI pending)

- `6d7bb85eadf6a4466db41c45bf7f9a2d6e4c51e1` source-preview-geometry job #113739959814 failed a **pre-existing non-editorial sibling height exposure**: global Flex stretch propagated Vega Buy Investment's currently oversized Card into source-locked Vega SavingsTargets first Card, making its first Item 204px vs source148px. This is not permission to relax the existing Item/first Card source gate. QXFRAME Release/CSS Schema remained pending when repair began; no acceptance claim.
- Retained source-validated small Button width/description repair for Sera (both 115.922px and22.75px). Shared `Card peer row` alignment role now permits **editorial Sera** natural sibling stretch while **non-editorial** styles retain previously source-paired first Card intrinsic height. Shared `Flex.is-peer-row.is-equal` owns the layout and consumes closed `card-peer-alignment` Theme input (`stretch` Sera, `flex-start` others); no private Preview CSS, fixed Card height or dropped threshold. This is an incremental dual-card compatibility policy, **not final validation of non-editorial Buy Investment sibling geometry**; the remaining second-card parity is an explicit Stage3 visual QA item.
- Mandatory: next current-HEAD 2 complete CI green, 528 same-Chromium source diagnostic, full dist+docs demo ZIP from matching Release artifact, HTTP/ZIP inspection and PR Draft checkpoint. Protected main+backup untouched. Engineering estimates total65%, Stage3~64% while full owner visual acceptance pending.

## CURRENT — 2026-10-09 CI strict failures corrected: generated Theme order + source two-column stretch (pending new final CI)

- On `ec8f46d9377677cb7ee71e0e6f16996b2346f617`, QXFRAME #37905457103 Release FAILURE because generated `theme.css` token order differed from the compiler's `THEME_TOKENS` output: `button-sm-padding-inline` must be before `control-padding`. CSS Schema #37905457100 failed the same exact generated default check. Reordered **both** :root/.dark declarations without changing computed values, no verifier or threshold modifications.
- Same source-preview-geometry job strict Sera Savings peer test correctly FAILED despite source small Button 115.922px = QX115.922px and descriptions both22.75px: source card A/B heights557.5/557.5px, QX A/B538.5/557.5px. The shared Button-sm fix removed source's extra two-line description, but old preview `.pv-cols-2.is-gap` had `align-items:flex-start` instead of upstream CSS Grid's equal-height sibling stretch. Source and sibling confirm parent layout defect, not Card padding.
- Added reusable framework CSS Flex modifiers `is-stretch` and `is-equal` (flex-only, min-width:0), and changed **Savings** authoring wrapper from Preview private `pv-cols-2 is-gap` to `qxframe9a7c2-flex is-stretch is-equal`, consuming the existing `--create-gap` via an inline layout variable. This restores source two-column natural equal-height stretch with no fixed height or new Preview private CSS. Existing source strict checks enforce both sibling heights and Button width/line-box for Sera light/dark.
- PR #265 remains Draft/unmerged; main and backup frozen. No JS runtime changes and no gate weakening. Next: two complete CIs on final HEAD (source 528/528 with zero >0.5 expected but **not yet verified**), download that successful HEAD's CI actual dist/docs artifact, create/test new Windows ZIP and update PR. Conservative overall65%, Stage364%; Stage3 manual visual acceptance remains.

## CURRENT — 2026-10-09 S3 2/528 paired, shared Button.sm intrinsic padding closeout (CI pending)

- HEAD `a113163f2915f612dcb903ded559d9773e21fe8d` source-preview-geometry job #113735804348 SUCCESS: 528/528, only **2/528** first Card heights >0.5px, both Sera SavingsTargets light/dark +3.75px; 0 unauthorized geometry subset deltas; 66 permitted Luma radius caps. Release QXFRAME #37904872243 and CSS Schema #37904872231 must still be confirmed. PR #265 Draft, protected refs unchanged.
- Source-paired both cards: Sera Savings A/B source 557.5/557.5px; QX A/B 561.25/557.5px. The Buy Investment sibling already exact. Source New Goal Button.sm width115.922px, QX127.922px because source horizontal inset16px each, QX22px each; QX header description therefore wraps twice (45.5px) vs source one line (22.75px), making first Card natural height overflow before two-column stretch. Changing Card height or the Preview-only wrapper would hide the incorrect button width.
- Shared Button size-sm now consumes ONE closed `button-sm-padding-inline` Theme role based on pinned eight styles' real px-2/2.5/3/4 values (8/10/12/16px), with the user's density extension delta applied to the style baseline. Icon/square buttons retain their existing ownership. Strict Sera same-browser Button width, description line-box and both peer Card heights gate; no fixed Card height, no Preview private CSS or threshold changes.
- Combined prior batch introduced reusable ordinary ItemTitle leading, Nova value leading, Sera FieldLegend/FieldTitle and strict source gates. Next: confirm both full CI suites on new final HEAD, inspect 528 count and failures, deliver corresponding CI-built nested dist+docs Windows ZIP. Overall~65%, Stage3~64% engineering estimates pending user visual acceptance; Stage4/5 untouched.

## CURRENT — 2026-10-09 S3 residual 12/528 source-backed ItemTitle/CardValue/FieldLegend batch (CI pending)

- Baseline HEAD `db6aaed73ef38ab959d67a3c1399b914fb951065`, PR #265 Open/Draft; QXFRAME #37902751672 and CSS Schema #37902751687 both SUCCESS. Pinned same-Chromium 528/528, **12/528** first-Card height deltas >0.5px, no unauthorized Card subset differences, 66 allowed Luma radius caps. main and backup frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- Root #1: Lyra 12px ItemTitle source line-box16px, but ordinary QX ItemTitle 16.5px; KitchenIsland and Payments four rows each +2px, UpcomingPayments three titles +1.5px. Reuse the previously introduced Lyra 4/3 leading Theme input for **all** shared ItemTitles, and rename it to semantically accurate `item-title-leading` (no new duplicate Theme role). Wrapping ItemTitle inherits the same line-height. Strict source 16px title/whole Card gates for Lyra Kitchen/Payments/Upcoming.
- Root #2: Nova 2xl CardTitle source 24px/33px, QX 24px/32px, lowering CardOverview by1px. Correct existing closed `card-value-leading` Nova source recipe to1.375 (Vega still1.5 and all other styles unchanged), strict source CardTitle and Card height gate.
- Root #3: Sera ReceivingMethod source native FieldLegend 12px/16px versus QX14px/20px, combined with FieldTitle source12px/18px versus QX12px/16.5px. Shared FieldSet legend now consumes one closed `field-legend-leading` role and the already-available font-size minimum; Sera FieldTitle leading1.5, Mira1.625, others unchanged1.375. Styles other than Sera keep their observed leading values to avoid a silent regression. New Sera source legend/title/whole Card gate.
- Sera SavingsTargets remains a two-column row-height problem: source New Goal button115.92px versus QX127.92px, causing a wrapping heading, but the Card may also stretch to sibling Buy Investment. Added exact source/QX paired measurement of both cards and their controls before attempting a height workaround. No fixed Card heights, preview-private CSS, JS runtime changes, or threshold relaxation.
- Next: push branch PR with code+docs, run BOTH full workflows on identical HEAD, inspect 528 and Sera sibling pair, fix any strict failure; each completed batch must include its own CI-built Windows dist+docs ZIP (Create/Preview local JS, HTTP/ZIP integrity). Overall program~65% Stage3~64% conservative pending full owner visual acceptance.

## CURRENT — 2026-10-09 paired 34/528, 3 shared residual owners (CI pending)

- GitHub QXFRAME CI #37901911627 same-Chromium job SUCCESS on `c3b2bee1836208e18f876707fce39d152124c17a`: 528/528 matched, **34/528** first Card heights >0.5px (was52), 0 unauthorized four-property deviations, 66 permitted Luma radii. CSS Schema #37901911601 SUCCESS, full QXFRAME release completion still subject to verification. PR #265 Draft and protected main/backup unchanged.
- Source/QX node evidence: NotificationSettings first checkbox-only Field row source16px QX18px from generic CheckField checkbox 2px top margin. Shared `CheckField.is-center` centers checkbox with margin0 for the five authored rows, without changing other CheckField composition. Vega/Nova/Mira/other source and Card strict pair regression gates.
- Source ContributionHistory text-xs ItemDescription category label source Vega/Nova18px Sera19.5px while QX16px. Reuse existing registered `ItemDescription.is-kpi-label` role in both Item descriptions, strict source label+Card pairs. No duplicate token.
- Source Lyra DividendIncome four wrapped ItemTitle heights source16/16/16/32px vs QX16.5/16.5/16.5/33px, cumulative +2.5px Card. Closed `item-wrapping-title-leading` Theme: Lyra4/3, other existing1.375; shared `ItemTitle.is-wrapping` consumes it. Source title/Card gate.
- These are three further shared root causes, not fixed Card heights or Preview-only CSS. Next: verify two complete final-HEAD CI suites and refreshed 528 diagnostic; create corresponding CI dist+docs Windows ZIP including local relative JS, check integrity and HTTP. Existing 3b32e3d ZIP is ONLY previous stable baseline. Estimates overall65%, Stage364% until actual visual acceptance.

## CURRENT — 2026-10-09 Stage 3 PowerUsage / Mira FieldTitle source-paired repair, residual tracing (CI pending)

- GitHub checked baseline HEAD `3b32e3d701d8afdf8dccbc545819a68274bf9515`: QXFRAME CI #37898122441 and CSS Schema #37898122595 both success, 528/528 same-Chromium pairs, 52/528 first-Card height deviations >0.5px, 0 unauthorized geometry subset deltas and 66 allowed Luma caps. PR #265 remains Open/Draft; frozen main and backup at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`.
- Source-backed fix 1: pinned PowerUsage uses two metric stacks with `gap-0.5` (2px); QX Preview01 used `Stack.is-gap-0` (0px), accounting for the common -2px card-height residual in eight style families. Added reusable Flex/Stack `is-gap-half` modifier in shared composition CSS, used for both metric pairs; 8-style source-paired full Card gate. No fixed Card dimensions.
- Source-backed fix 2: pinned Mira `cn-field-title` is `text-xs/relaxed` (12px/19.5px), while QX FieldTitle hardcoded 1.375 (16.5px). Added one closed `field-title-leading` Theme role (Mira1.625, default1.375), default Nova root/dark synchronization and shared FieldTitle consumer, with Mira source-paired title and full Card check.
- Expanded same-Chromium node traces for remaining ContributionHistory, NotificationSettings, Lyra Dividend/Payments/Upcoming and editorial Savings to identify shared next owners, not compensate in Preview private styles. Do not claim a new mismatch count until same-final-HEAD CI. No JS runtime modification, no threshold changes.
- Mandatory release: after both workflows SUCCESS on final HEAD, download that HEAD's actual dist-docs artifact and provide a new Windows local ZIP with corrected relative JS links. Existing baseline local ZIP is pinned to prior 3b32e3d and must not be reused for new HEAD.
- Next exact step: confirm CI source geometry and static regressions; if either fails, fix the source cause; diagnose remaining captured nodes, batch repair, update PR progress. Provisional overall65% Stage364% until real acceptance.

## CURRENT — 2026-10-09 Vega SavingsTargets and CardOverview 2xl parity (CI pending)

- Previous c5490932 528 source-paired geometry SUCCESS: 68/528 first Card height deltas from 70, Sera PayoutThreshold exact 627.5/627.5px. Pinned Vega SavingsTargets first Item 148px vs QX146px because ItemDescription text-xs 18px vs16px, across 2 items => first Card -4px. Updated shared KPI label leading to 18px Vega (Nova18, Sera19.5, others16), with strict Vega source Item/Content/Footer/Card gate.
- Vega CardOverview source metric CardTitle 24px/36px from pinned cn-card-title leading-normal, QX 24px/32px due text-size utility. Introduced reusable CardTitle.is-value with closed card-value-leading Theme: Vega1.5, others unchanged 4/3; used for both metric headings, strict paired Vega Overview Card test. Updated generated Nova default Theme. No Card fixed heights, no framework JS, no private Preview layout compensation.
- Next: verify both full CI suites on final HEAD, report 528 count, fix failures. PR #265 Draft/unmerged, main+backup untouched. Engineering estimates overall65%, Stage364% pending final acceptance.

## CURRENT — 2026-10-09 default generated Theme source parity (CI pending)

- `c5490932` Release failed verify:theme-tokens because the two new registered Theme tokens were absent from the committed generated default theme CSS (both :root and .dark), though 528 same-browser geometry job SUCCESS with 68/528 on that HEAD. Updated generated `src/styles/main/theme.css` with compiler-equivalent default Nova/neutral field-label-tracking normal, calendar-weekday-leading 20/14, and synchronized previously corrected non-editorial artwork-label-leading 12px. No source architecture or defaults changed beyond the registered compiler recipe.
- Latest HEAD requires green both suites; base 528 on previous commit 68/528, newest CoverArt all-style delta still pending. Draft PR #265 remains unmerged.

## CURRENT — 2026-10-09 CoverArt text-xs/leading-none cross-style owner (CI pending)

- Upstream pinned styles Vega/Nova/Maia/Lyra/Mira/Luma/Rhea source .cn-label all use leading-none; CoverArt explicitly sets text-xs (12px); current shared Theme artwork-label-leading returned 12px ONLY for Vega but 16px for other six non-editorial styles. Existing 528 result shows CoverArt +4px for Lyra/Mira/Nova etc; the erroneous extra 4px arises from this single shared Label role. Corrected existing closed Theme token to 12px for ALL non-editorial families, retains source Sera 19.5px. No Preview-only CSS and no Card fixed-height compensation.
- Expanded paired CoverArt card strict source-height gate across 8 styles, added Maia trace alongside previous additions. Latest two CI suites must pass on new HEAD; do not claim mismatch decrease until verified. PR #265 Draft and protected branches untouched.

## CURRENT — 2026-10-09 Release source-order correction (new CI pending)

- Release #37897438706 failed token schema initialization: calendar-weekday-leading was assigned before text-leading, yielding an undefined Theme token during generated CSS verification. Moved weekday-leading projection immediately after text-leading initialization, retaining exactly the same intended values. Strict source-paired geometry job and CSS Schema must re-run at new HEAD. PR Draft.

## CURRENT — 2026-10-09 CREATEAPP-V3-S3 source-backed FieldLabel + Calendar weekday batch (CI pending)

- Confirmed baseline HEAD `61dd0a71`, PR #265 Open/Draft, QXFRAME #37888241850 and CSS Schema #37888241908 SUCCESS; 528/528 paired Chromium, 70/528 Card height deltas >0.5px, zero unauthorized geometry subset mismatches, 66 approved Luma caps. Protected main/backup unchanged.
- Pinned Sera PayoutThreshold source FieldLabel "Minimum Payout Amount" uppercase with tracking-wide breaks into 39px two-line label; QX had 19.5px one line because reusable composed FormLabel had no transform/tracking. Mapped source .025em FieldLabel tracking through one closed Theme role and shared FormField / FieldContent label selectors; enforced source-paired label+Card height.
- Pinned Lyra UpcomingPayments source Calendar weekday line box ~17.05px, QX 20.78px because adaptive weekday consumed compact body leading 1.625 instead of source 4/3. Mapped independent weekday leading role and strict source-paired Calendar weekday check, keeping other source styles' current line-height untouched.
- Broadened source paired diagnostic logs for Vega CardOverview/SavingsTargets and CoverArt in Lyra/Mira/Nova/Luma/Rhea to identify remaining shared-owner 4px differences, without speculative styling.
- Next: inspect both latest GitHub CI results on new HEAD; correct any strict fail, quantify updated 528 mismatches, then batch CoverArt / Savings root fixes. DO NOT merge Draft #265, do not change main or backup. Estimate overall65%, Stage364% until acceptance evidence.

## CURRENT — 2026-10-09 CSS Schema browser regression expectation corrected (pending latest CI)

- On `8d24d8b0`, QXFRAME source-preview-geometry SUCCESS: 528/528 measured, **70/528** first-Card heights >0.5px, 0 nonauthorized geometry subset mismatches (66 allowed Luma caps). Source label/Cards AccountAccess Nova and Mira exact, Lyra +0.5px. Full Release job had not completed at correction.
- CSS Schema [#37887892053](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37887892053) FAILURE solely in Chromium browser assertion `mira/light Accordion content inset: expected 8, observed 16` after source-locked ownership split. Pinned `style-mira.css` explicitly sets `AccordionTrigger p-2` and `AccordionContentInner pb-4`; source-paired Mira FAQ Card385/385px passed. Updated `tools/verify-create-app-browser.mjs` to preserve strict **independent** expected trigger8/content16 (all 8 styles in maps; other values unchanged), rather than reverting correct implementation or relaxing tolerance. This is correcting stale expectation with real reference evidence.
- Next: wait for BOTH new workflows on the newest HEAD, inspect and fix any additional failures, update PR #265 with final run URLs/status. Protected main/backup unchanged, PR Draft, Stage 3 unfinished. Current estimate overall65%, Stage364%.

## CURRENT — 2026-10-09 84/528 measured, shared nested FieldLabel root cause closeout (CI pending)

- At `33316902` [QXFRAME #37887627002](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/37887627002) source-preview-geometry job SUCCESS: pinned source 528/528 same Chromium forced system-ui, first Card height outliers **84/528** (down from 102 and starting 104), geometry subset zero unauthorized. Exact 0px matches: Sera CardOverview, Sera IndexInvesting, Lyra/Mira/Nova/Maia SavingsTargets, Mira FAQ, Nova ReceivingMethod. QXFRAME Release and CSS Schema were still executing when the next batch started, not yet claimed green.
- Node comparison pinned AccountAccess: Nova source Card371.25px/QX375.25px and form Current Password row source16px/QX20px. Lyra source Card362/QX366, Mira329.5/QX333. QX `.is-composed > .form-label` only styles direct children: the password FieldLabel is nested in a Flex row beside Forgot?, so its inherited line box becomes 20px/19.5px while source FieldLabel maintains font-height and the row remains 16px. Extended the **single existing shared FormLabel owner selector** to nested descendants in FormField, no preview CSS compensation. Added strict source-paired AccountAccess Card + label check for Nova/Lyra/Mira. Expect similar 4px convergence for other source styles, but next 528 run must confirm.
- Keep PR #265 Draft and protected refs unchanged. Next: validate two full CI suites and report updated 528 count, handle failures, then remaining Lyra UpcomingPayments/calendar and other nested visual differences. CREATEAPP-V3 ~65%, Stage3 ~64% provisional.

## CURRENT — 2026-10-09 strict QA feedback closeout: ItemFooter single gap and Button selector regression (CI pending)

- `ff89e656` QXFRAME run #37887238932 failed on two actionable sources: release static assertion expects exact `.qxframe9a7c2-button.is-no-shrink{flex-shrink:0}`; geometry strict Nova SavingsTargets trace shows ItemFooter after being moved to sibling still has extraneous 12px `margin-top` authored privately in `docs/create/preview.css` and its explicit text-xs label is 16px instead of source Nova 18px.
- Restored Button's established `is-no-shrink` declaration exactly and added independent shared semantic `Button.is-label-nowrap` (Sera Overview source Button has `white-space:nowrap`). Deleted duplicate Preview-local `.item-footer{margin-top:.75rem}`; Item parent now owns its documented gap. Registered `item-kpi-label-leading` Theme role and `ItemDescription.is-kpi-label` source label composition (Nova18px, Sera19.5px, other source styles16px), used on both SavingsTarget labels. Expected source-paired first Item source/QX Nova134px, Lyra/Mira132px, Maia152px; must confirm in new CI rather than report prediction as result.
- Prev complete paired baseline `f24bbbe7`: 102/528; new complete result not yet known. Latest batch also includes Mira AccordionContent and Nova FieldLegend shared source roles. Update PR and Stage3 QA after latest two CI jobs. Provisional CREATEAPP-V3 65%, Stage3 64%, Draft, no main/backup changes.

## CURRENT — 2026-10-09 source-approved shared FieldLegend and AccordionContent separation (new CI pending)

- Prior measured gate: `f24bbbe7` source-preview-geometry SUCCESS, **102/528** source-paired first Card height diagnostics (104 before), 528/528 measured and no nonauthorized geometry-subset mismatch. The previous intermediate run's CSS Schema passed; newest HEAD still requires both CI.
- Pinned `style-mira.css` has AccordionTrigger `p-2` (8px) but `AccordionContentInner pb-4` (16px): prior QX incorrectly used one `accordion-padding` for both, causing Mira FAQ first open content and total Card **−8px**. New registered `accordion-content-padding` source role, shared Collapse owner and paired Mira open content/Card checks. All source styles use pb-4 except Nova/Lyra pb-2.5. Existing trigger padding unchanged.
- Pinned FieldLegend margins: Nova mb-1.5 (6px), Lyra mb-2.5 (10px), Mira mb-2 (8px), others mb-3 (12px). Prior `docs/create/preview.css` incorrectly owned reusable `form-fieldset` and hardcoded margin 12px, causing Nova ReceivingMethod FieldSet/Card **+6px**. Migrated its static class into `src/styles/components/composition.css`, registered `field-legend-gap` closed Theme role, projected pinned values in compiler; removed private preview CSS duplicate. Added strict Nova paired FieldSet/Card checks.
- Savings ItemFooter direct sibling fix and CardOverview Button natural no-wrap from `ff89e656` are in this same staged branch; verify on newest CI before claiming results. No production JS changes, no fixed Card heights or threshold change, PR remains Draft. Provisional overall ~65%, Stage 3 ~64% until full visual acceptance.
- Next exact step: inspect both latest Actions, paired 528 metrics and per-node gate; update PR and QA with verified numbers; remaining Lyra Calendar ~5.234px, AccountAccess and others require source-backed fix, Stage 4/5 remain undone.

## CURRENT — 2026-10-09 source paired Stage 3 sibling composition (new CI pending)

- `f24bbbe7` pinned same-browser job passed 528/528 and diagnosed **102/528** first Card heights outside ±0.5px, down from 104/528, with Sera IndexInvesting source/QX **289.25/289.25px**. Geometry subset has zero nonauthorized mismatches; 66 Luma radius cap exceptions remain authorized. Its other release/schema runs were still in progress at the point the next batch began; do not claim those suites green until latest HEAD completes.
- New real node evidence: SavingsTargets Lyra/Mira first `Item` QX138px versus source132px twice, Nova+8, Maia+4. Source `ItemFooter` is a direct sibling after 80px `ItemContent`, but QX placed Footer *inside* ItemContent, causing an additional content gap before each footer. Corrected both SavingsTargets instances by moving the existing closing tag (same shared `ItemContent`/`ItemFooter` classes, no extra preview CSS), source-paired four-style first Item/content/footer/Card gates added.
- Sera CardOverview sibling peer probe: source both cards170.75px, QX both184.75px despite first card's text metrics matching exactly. Source Pay Early button36px and `white-space:nowrap;flex:0 0 auto`; QX sibling button50px, `white-space:normal;flex:0 1 auto`. Used existing shared Button `is-no-shrink` and restored nowrap in that reusable modifier; both cards then retain natural-height sizing, no fixed card/button pixel override. Added Sera first Card paired regression gate.
- Changed: `docs/create/preview-01.html`, `src/styles/components/button.css`, `tools/qa/preview-01-audit.mjs`, this state and Stage 3 QA. No JS, no altered threshold, no protected refs changed. **Next**: watch newest two workflows; if new strict source gate fails read source-preview-geometry actual node logs and correct; refresh 528 result, update PR #265 with exact HEAD / CI. Stage 3 still not visually complete. Estimate CREATEAPP-V3 ~65%, Stage 3 ~64% pending additional gates.

## CURRENT — 2026-10-09 source-paired S3 focused batch (CI pending)

- GitHub check: `redesign/create` started at `bd32478eb1229051ca2e9d818326f51b69040d36`, PR #265 Open/Draft; `main` and `backup/main-before-pr265-2026-10-08` frozen at `fe209abbf1698294ec6cda468b7fd4cf9ee56ff3`. Baseline QXFRAME run #37884789294 and CSS Schema run #37884789259 both SUCCESS, 528/528 pairs, 104/528 height diagnostics, zero unapproved Card geometry subset failures, 66 authorized Luma radius caps.
- Locked source `index-investing.tsx` explicitly sets `mt-3 style-sera:mt-0` on the introductory CardDescription, while QX left `pv-mt-3` active for Sera. This is direct evidence for Sera IndexInvesting +12px. Added one registered `card-prose-offset` closed Theme input, generic `CardDescription.is-prose-intro` owner, preview semantic class and strict paired Sera Card/prose position gate. No fixed Card heights, framework JS or preview-local duplicated owner.
- Extended node-level paired traces for SavingsTargets (Lyra/Mira/Nova/Maia), Mira FAQ, Nova ReceivingMethod, Lyra UpcomingPayments, AccountAccess and Sera CardOverview second sibling. The +14px first Overview Card may be caused by flex row stretch from PaymentDue; do not alter its padding before comparing both siblings.
- Completed: one source-backed shared CSS/Theme fix + multi-card paired regression instrumentation. Unfinished: consume resulting new job traces to identify additional shared root causes, refresh 104/528 diagnostic, verify BOTH workflows, update PR #265 body. Stage 3 visual/nested-card acceptance remains open; no Stage 4/5 work. Engineering estimates held **CREATEAPP-V3 ~65%, Stage 3 ~64%**, pending CI.
- Next exact step: inspect new `source-preview-geometry` logs for `[stage3-target-*]` and `[stage3-overview-row-sera]`; identify shared SavingsTargets/Overview/FAQ/Calendar/Radio root causes, batch-fix the measured owners; keep Draft and protected refs unchanged.

## CURRENT — 2026-10-09 CREATEAPP-V3-S3

- Latest `e7752a00` same-Chromium geometry job **success**, 528/528, zero subset failures, 114/528 >0.5px. Targets Vega Kitchen 367/367, Vega/Nova Recent Transactions exact, Vega/Sera CoverArt within .02px. Aggregate 112→114 regression comes entirely from Vega-only sm Item subtraction applied to Maia/Luma/Sera/Rhea: 4 small Items each became 4px shorter (each style both modes, eight regressions), despite Vega now exact. Mapped `item-sm-reduction` as a single new closed Theme input: 4px Vega, 2px other pinned families, dense clamp at10px. Added source-paired gates across 5 Kitchen styles.
- Same Sera Preferences +14px: source Footer Reset 98.47px + Save 203.73px stay one line, QX Footer gap32px reduced Save to180.38px and wrapped it to two lines, producing 54px instead of40px. Reused existing shared `CardFooter.is-gap-0` to restore source no-gap/auto-margin composition; same-Chromium Preferences card and browser button width/height checks added. New CI pending.
- `3228303e` Release `verify:theme-tokens` detected +1 duplicate-owner `CardHeader.gap` from grouped Header/Footer and separate Header rule. Refactored to a shared display/min-width group with **one gap per dedicated Header/Footer rule**, preserving source header 4/6px and existing Footer theme inset; static single-owner gate added. This is an actual CSS contract failure, fixed without changing any accepted visual value. CI pending.
- `3228303e` pinned CI same-browser reached strict Vega RecentTransactions and failed at **source404px vs QX405px** (only +1px after fixing Stack gap0 and border-collapse); pinned Vega KitchenIsland **367/367px**, CoverArt **498.86/498.84px** already within ±0.5px. The remaining +1px is from border ownership: source Tailwind TableRow places 1px between rows, with collapsed half-pixel first/last boundaries, whereas QX embedded variant left a border at the bottom of each td. Shared embedded Table now assigns border to `tbody tr:not(:last-child)`, not cells; added 5-row 56.5/57/57/57/56.5 browser assertions. Old run failed precisely under the strict, unchanged 0.5px acceptance. CI pending new commit.
- Source-locked `7a71ad29` same-Chromium: **112/528** height deltas >0.5px (116 prior), Sera Claimable and StockPerformance both exactly 0px, no 528 missing/geometry subset failures. Newly probed five shared/root causes: (1) Sera PayoutThreshold Header 3-line description vs source2 because shared Header used Card padding32px as action column gap instead of source meta gap6px; other styles also benefit from source 4px. (2) Vega KitchenIsland four `Item.is-sm` rows 45.25px QX vs41.25px source due 12px instead of10px block inset. (3) RecentTransactions rows 59px QX vs source approx57px because `Stack.is-gap-0` was misdefined to 2px and embedded Table used border-collapse:separate rather than source collapse; 5 rows account 11px total. (4) CoverArt source Vega Label 12px vs QX16; Sera Label19.5px vs QX16 and FooterDescription39px vs QX32; new shared label/description leading roles reproduce source. All corrected at shared component level, no Card fixed heights; added new browser/source-paired strict checks. CI pending.
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
