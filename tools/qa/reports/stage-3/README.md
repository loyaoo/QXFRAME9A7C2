# Stage 3 checkpoint — shared Card geometry

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
