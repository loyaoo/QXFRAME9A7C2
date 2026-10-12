# Stage 5 — QX-only component Theme visual parity (2026-10-11)

## Scope and measured evidence

- Baseline: Draft PR #267, 66 Preview 03 commercial Cards, component-to-card mapping for 66 documentation families. Previous Preview 01/02 owner acceptance retained. No JS framework changes in this batch.
- Chromium local measurements used official prior dist+docs source on 66 Cards in Nova `radius=none`/default, Maia large and Sera default. Concrete failures: Menu items and List containers remained at **4px** while Theme radius was zero; Tree controls, Steps markers, Carousel arrows remained `50%`; Preview03 commercial avatar retained `100rem` irrespective of Theme; several auxiliary Badge/ImagePreview/Progress/Slider corners were fixed.
- Implemented: `src/styles/main/fixed-values.css` fixes shared **Navigation/Data** radius fallback. Additional consumer fixes in 10 `src/styles/components/*.css` families: Menu, List, Steps, Tree, Carousel, Progress, Image, Badge, Card (skeleton), Slider. Preview03 Avatar private example now uses `--qxframe9a7c2-theme-radius-avatar`.
- Fallback/override: public per-component radius custom properties continue to override Theme defaults. Theme radius none becomes zero unless the user explicitly selects another shape policy. Genuine decorative status dots and media artwork are deliberately not treated as ordinary controls.
- Regression: 8 Styles × 2 modes × none/default radius × **19 representative QX parts** = 608 Chrome computed-radius assertions; existing owner-accepted Preview01/02 regression tests untouched. Extra Theme source-static role mapping check.
- Local QA: 11 current Preview03 component cards/regions highlighted, previous inverse Picker region highlights removed. Official Windows ZIP must be built only from the successful exact-head GitHub Actions dist+docs artifact.

## Remaining visual acceptance work

The 66/66 coverage mapping is a **documentation/demo inventory**, not 66/66 visual acceptance. Still to verify across all QX component families and representative states: semantic color pair contrast, hover/active/selected/disabled/read-only, size/density and spacing, all Shape Policy alternatives, menu inversion with popups, nested custom properties, and theme-specific edge/shadow settings. Do not conflate this batch's radius fixes with full Stage5 acceptance.

## Gate

Draft PR #267; do not merge until owner accepts. QXFRAME CI and CSS Schema must both be success on the final HEAD; otherwise inspect failed workflow logs, correct the source, rerun. Keep main unchanged.

## 2026-10-12 Stage5 follow-up — Theme popup normal-state + native Switch commercial composition

- Reviewed the owner's actual Preview03 screenshots. Confirmed Feature flag matrix used a bare native `input.qxframe9a7c2-switch` instead of the framework's `Switch > SwitchInput + SwitchTrack > SwitchThumb` contract. Replaced all three instances without replacing native checkbox state or simulated backend calls.
- The prior 64-case popup browser test checked today/selected dates and selected wheel rows but omitted **normal calendar dates and nonselected wheel rows**. The matrix now checks both additional foreground consumers under 8 Styles × 2 modes × 4 Menu variants, without changing the fixture's Popover isolation test.
- InputOTP now uses the existing Control family color roles for background, border and text in the shared component stylesheet; no Preview03-specific coloring, extra Theme tokens, or unsafe mix formulas.
- Visual QA highlights: release-planner (two controls), dial-settings (one), identity-otp (one), feature-flags (one) = **4 Cards / 5 regions**. Prior 13 regions cleared. This is not yet full all-family visual signoff; CI and official package must correspond to the new HEAD.

### 2026-10-12 CI feedback and WheelPanel layer

- QXFRAME workflow #38191006431 failed at a stale static QA ledger gate referring to the prior 13 highlighted radius consumers. The current 4-Card / 5-region selectors are now asserted instead, with explicit rejection of previous 13 regions. No gate disabled.
- TimePicker and Year/Month WheelPicker selection-guide element was at z-local-above (2), overpainted the scroll rows. Wheel columns now own z-local-above (2); guide is behind at z-local-raised (1), preserving the highlight background but allowing text to remain visible. The existing 64-case inverse Menu fixture now checks guide-versus-row stacking.

## 2026-10-12 Stage5 Table / Transfer / JSON follow-up
- Table filter options were native unthemed checks, and disabled option labels retained pointer/hover affordances. Selected draft values did not project into a row state. Fixed the source Table renderer and component CSS; popup search now pairs with popup background/foreground and pointer focus.
- Transfer did not apply its public panel-border override, while header/footer/pagination independently used page-level borders; disabled root text remained normal. Unified the existing source roles, status color priority stays higher.
- JSON monospace root fixed its font at 0.875rem rather than consuming shared Control size. It now supports public JSON font override with shared default and a currentColor caret without altering edit events.
- 16 browser computed-style cases added (8 styles x 2 modes), plus strict source static gates. Existing 800 radius and 64 Menu inversion regressions unchanged. QA offline highlights: exactly 3 actual Preview03 business Card regions. New dual CI/artifact still required before claiming full acceptance.
