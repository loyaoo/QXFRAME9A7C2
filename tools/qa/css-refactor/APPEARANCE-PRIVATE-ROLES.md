# Component Appearance Owner Migration — Chromium-gated correction

## Accepted candidate scope
- Frozen B0 `62d9a8402c19460ced37265acc6d110ae2cfda76`.
- Before this batch `e238c297fde792685e79567f6f5a29c47a4b01e2`. The historical `src/styles/main/theme-visual-v2-style-consumers.css` is replaced by `src/styles/components/component-appearance.css` at the **exact same last-stage cascade position**, maintaining all 21 original rules, the same `@scope (:root)` wrapper, selectors and declarations. No Theme input or runtime JS was changed.
- Source order, schema exclusions, compiler references and QA source checks updated together.
- Previous observed duplicate-owner count was 12 at `main/theme-visual-v2-style-consumers`; ratchet allowance was 15. The new component segment adopts allowance **12**, lowering allowed total by 3; no baseline increase.
- Only **one version-named core CSS file remains**; 4 scoped blocks remain. The main 80KB file still requires true per-component migration.

## Negative trial / strict regression discipline
- The same initial batch attempted removal of 14 apparently unused private custom-property names (21 declarations) from `main/theme-visual-v2.css`.
- CSS `var()` scanning and B0 local sampled visual geometry showed no use, but **full Chromium getComputedStyle()** exposed those custom properties in both modes. [Fast #39024901042](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/39024901042) correctly rejected **2,571** synthetic and **6,336** real-doc custom-property differences in each mode. The negative evidence has priority over the narrower preliminary smoke.
- **All 14 private names and 21 declarations are fully restored byte-for-byte from `e238c297fde792685e79567f6f5a29c47a4b01e2`.** Do not claim these were safely eliminated; they remain pending full dynamic/contract ownership migration.
- It would be inappropriate to exclude private properties from a strict CSSOM full computed-property comparison solely to force a passing result. The original B0 comparator remains unchanged.
- Run exact SHA Fast, QXFRAME and CSS Schema workflows again. Treat new component appearance owner as implemented but not accepted before all three pass; original B0/main untouched and PR #268 Draft.
