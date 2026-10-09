# Stage 3 checkpoint — shared Card geometry

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
