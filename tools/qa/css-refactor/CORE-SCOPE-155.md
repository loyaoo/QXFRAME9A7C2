# R5 — migrate 106 more core scoped consumer rules (total 155)

## Reference, target, rule IDs
- Frozen B0/main: `62d9a8402c19460ced37265acc6d110ae2cfda76` (unchanged)
- Last triple-green source: `d3e1e4827841a8b1a33a347c5c1a4590d7ba24d4`: QXFRAME #39029404531, CSS Schema #39029404547, Fast #39029404521 all success.
- Exact original source: B0 `src/styles/main/theme-visual-v2.css` (200 qualified rules inside one original `@scope (:root)`).
- This change migrates an **additional 106** original rules alongside the 49 previously approved; remaining scoped **45**, unscoped **155**. The complete 200-rule selector+declaration multiset is unchanged, with within-group relative source order preserved.
- The 106 extra B0 IDs: 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 105, 107, 108, 109, 110, 111, 113, 114, 115, 119, 120, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148, 149, 150, 151, 152, 153, 156, 157, 158, 159, 160, 161, 162, 166, 169, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 188, 191, 192, 193.
- Deliberately retain scoped rule **#1** (universal semantic/private slots) and **#3** (generic type/class mapping). These were the cause of 25 private CSSOM root property deviations when flattened. The other 43 still scoped selectors have CSS owner conflicts that must be closed by component-level cascades.
- Scope blocks remain 4 across the framework; no new CSS property, public/private token, JS/DOM, theme compiler or theme.css change. Migration stays in the current canonical core source-order position; moving owners to component files is a separate staged ownership operation, not falsely claimed complete.

## Local full CSSOM checks
- Reconstructed both prior 49-rule and new 155-rule compiled CSS from official previous-green dist, changing only the canonical late core module body.
- Playwright Chromium (headless): **447 total observed Light samples incl. html/body; 890 Dark**, every `getComputedStyle()` key/value plus `getBoundingClientRect()` including public override and nested dark: **0 differences** per mode.
- tinycss2 full 1.1MB CSS owner inventory: **0 new repeated selector+property+@context owners**, 8 existing duplicate records reduced.
- 106 candidate IDs were selected only when lacking a competing global selector/property owner; the two CSSOM-inheritance counterexample rules #1/#3 were removed from the candidate. The trial with both included returned **25 private CSSOM root differences**, and was not submitted.
- Source gate still checks exactly one scoped core block and freezes **all 155 approved unscoped selector preludes** with SHA256 `a07758b80e49246cff7c1475880691891db666c4a6c8b9d6a17b5049bccb9dfe` (no open-ended allowance). The original 49 selector SHA `e1d019419dd302cde69a866182b55da29cd7bfb34a3dbe702864677a692e6c8c` is superseded, not accepted alongside it.

## Acceptance and unresolved
- Pending exact-head QXFRAME + CSS Schema + Fast Chromium CDP self/negative/candidate Card docs+screenshots/hover.
- Full CreateApp 112-config visual matrix, Portal, interaction and S5-A user acceptance remain open; a 0-difference local CSSOM fixture is not sufficient alone.
- Core is still version-named, still has 45 scoped rules; **R5/R6 not closed**. PR #268 Draft, do not merge or mutate main/B0.
