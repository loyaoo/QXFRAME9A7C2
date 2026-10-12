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

### 2026-10-12 CI feedback on first Stage5 Table/Transfer/JSON Chromium matrix
- CSS Schema #38193245580 failed only in newly added matrix: Vega/light selected filter row computed transparent. Selected state now consumes existing solid Theme-muted derived semantic-subtle-active, matching QX Table selection instead of relying on transient accent-soft, without new formulas.
- Found higher-level Theme V2 source overriding Transfer component's explicit panel border and disabled foreground. Its shared List/Tree/Transfer selector is now split, with Transfer consuming existing local panel roles and inheriting text from owner. Both are actual framework fixes; 16-case browser assertion retained.

### 2026-10-12 Transfer status overrides vs public border
- CSS Schema #38193867512 progressed beyond Table selection but failed on Transfer explicit panel border in disabled state: observed default Theme border instead of caller-provided rgb(19,33,55). Identified .is-disabled private slot assignment overriding root's public border, also shared by is-status-error/warning. Corrected all three status mappings to resolve user-public border first, fall back to existing state semantic only when not supplied. Source + static regression updated; browser gate remains strict.

## 2026-10-12 owner screenshots and JS parity closeout
- Exact prior QXFRAME CI failure was built JS parity with main after Stage5 had changed src/components/table.js; restored its original main blob. Native Table filter selection/disabled visuals use :has(>input:checked/disabled) CSS so Stage5 does not fork framework JS.
- Screenshot regressions: Tree ancestry and native checkbox Menu contrast, Cascader first-column 13rem minimum popup width, selected TimePicker wheel text/background above guide, ColorPanel HEX focus border. All fixed in shared source CSS, not Preview03-specific overrides. Offline QA resets to six real cards/seven regions; Popover/Dialog independent; existing source gate preserved. New CI needed.

## 2026-10-12 owner screenshots: popup foreground/background/border
- Root-cause fixes in shared Theme V2: DatePicker idle navigation foreground uses Menu, hovered nav uses Menu accent + accent foreground together; selected date/period similarly paired. TimePicker centre guide no longer covers the selected item's own paint. Tree Choice active/mixed checkbox paint follows Menu pair AFTER the global V2 Choice skin. ColorPanel HEX input/format/eyedropper pair background/border/text from the same popup with public field overrides first; focused HEX border stays pointer-focus, keyboard outline unchanged.
- Scope: only 4 Preview03 cards / 6 regions in offline QA; production preview never gains QA CSS. PR Draft/unmerged and all existing regression gates retained. New CI/artifact pending.

### 2026-10-12 Chromium paired-paint extension
- New 64-case browser computed-style gate (8 Styles × 2 mode × 4 menu colors) checks genuine calculated Date/Time/Tree Choice/ColorPanel paint, including checked and indeterminate native glyphs, HEX focusing and pointer border. Existing source and other browser tests are retained; no new token/mixing rules.

### 2026-10-12 CI owner boundary correction
- QXFRAME #38199405323 failed strict token duplicate-owner guard: Theme V2 attempted to write --_color-panel-field-* on ColorPanel itself, duplicating component source ownership. Removed this duplicate declaration; field/format/eye now directly read existing public component field vars with Menu fallback in their actual paint. No gate suppression, default CSS token count remains controlled. 64-mode Chromium contract retained.
