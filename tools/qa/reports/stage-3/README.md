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
