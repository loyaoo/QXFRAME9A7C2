# R5 Scoped Core Partial Retirement — 49 Actual Rules

**Immutable B0:** `62d9a8402c19460ced37265acc6d110ae2cfda76`
**Previous exact-green HEAD:** `83cf8f10f343690fbd5355c8a741aa98e3041d67` — QXFRAME #39027619556, CSS Schema #39027619558, Fast Chromium #39027619555 all success.

## Production change and scoped owner allocation
- Exactly **49 of 200** qualified rules in the sole `src/styles/main/theme-visual-v2.css` `@scope (:root)` are lifted to plain component CSS within the same canonical source module.
- 151 rules stay in the original scoped block; 49 no longer need scope proximity. Total production @scope blocks still **4**. No legacy module rename or parallel CSS implementation is introduced.
- Source rules moved (1-indexed B0 rule IDs): 27, 28, 30, 31, 32, 33, 34, 35, 37, 38, 40, 42, 44, 45, 48, 49, 51, 52, 56, 58, 59, 60, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 88, 90, 195, 196, 197, 198, 199, 200.
- The groups cover Badge/Tag/Alert/Notification painting, Table/Transfer status, Slider surface, input native/JS Control state, SelectGroup overlay, carousel/upload feedback, and Slider/Progress/Badge late geometry. The 49 rules retain their actual selector text, specificity, complete declarations, and mutual order; retained 151 scoped rules also preserve mutual order. Safe unscoped rules are moved **after** the remaining scoped block to avoid multiple new @scope wrappers.
- The main semantic Theme generator and output are not changed. No public Token, private variable, JS/DOM or transition/animation changed.

## Reproducible trial and ownership guard
- Official B0 golden compiled CSS and accepted previous-head **real official dist CSS** were each independently compared with the corresponding 49-rule source-candidate compiled CSS.
- Playwright Chromium: 448 Light sampled elements, 890 Dark sampled elements; key computed props / geometry **0 differences** in both pairs after theme-settle. This includes 50+ component families, nested .dark boundary, and public override fixture. Exact-head CI will expand to real docs and all custom-property computed slots, pixel screenshots and native hover.
- tinycss2 parsing of the entire accepted 1.1 MB CSS confirms **0 new duplicate selector/property/context owners** and **23 fewer already-duplicated owner records** from scope contexts (these are counter differences, not necessarily deletions).
- A source-contract regression gate remains strict: one scoped block must remain and top-level retired selectors must be **exactly 49**, with the B0-approved selector list and order pinned via SHA-256 `e1d019419dd302cde69a866182b55da29cd7bfb34a3dbe702864677a692e6c8c`. Unexpected top-level expressions still fail; the contract is not opened to arbitrary selectors.
- The remaining 151-rule scope contains known conflicting matching/specificity families, especially Button/Input/Card, Popup/Menu/Picker and the five-step geometry system. Its removal is NOT approved by this batch.
- Exact HEAD QXFRAME CI + CSS Schema + Fast Chromium negative control required before status becomes accepted. No PR merge; B0/main untouched.
