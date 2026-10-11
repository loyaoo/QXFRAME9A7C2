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
