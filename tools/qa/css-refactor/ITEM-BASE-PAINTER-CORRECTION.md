# Item Surface scoped final paint — 2026-10-19

**Branch** `refactor/css-readable-token-chain-postcleanup-20261017` · **previous rejected HEAD** `04e5874be85cc25a11275c646f3a555922a35ce5` · **last triple-green** `862a7113e227415f27327a7c6ef214f4a2bd5f6a` · frozen B0/main `62d9a8402c19460ced37265acc6d110ae2cfda76`.

## Verified defect and implementation
- Fast #39198345508 and Full QXFRAME #39198345517 failed **Light and Dark full-page screenshots** even though both completed 152 Card-body computed-style node comparisons with 0 differences. Browser screenshots changed **8067 actual RGB pixels in each mode**, bounding box x=12..239, y=373..409, the docs sidebar currently-selected Card Item.
- Previous attempt moved the entire scoped Item base (two private role definitions plus CSS background-color/color painting) into earlier `components/item-surface.css`, but the ordinary background shorthand lost the former last scoped painter's cascade precedence. The docs selected item background visibly disappeared. Earlier b5f356ec trial also failed the same pixel box.
- **Corrected partition:** component Item owns `--_qxframe9a7c2-item-bg` and `--_qxframe9a7c2-item-text` base role definitions; root scoped `semantic-cascade.css` now owns only `background-color` and `color` for the same public `.qxframe9a7c2-item-surface` selector. No parallel variant, new tokens, JS change, or increased specificity. All other previously accepted domain ownership migrations retained. The root scope is **18** qualified rules (was 17 in failed branch; last triple-green also 18), one scope block.
- New source contract verifies explicitly that the final painter remains scoped while private Item role definitions are not reintroduced into that scope. No weakened CSSOM, screenshot equality, negative controls, or duplicate-owner ratchet.

## Local Chromium validation
- Static offline accepted `862a7113` compiled CSS plus identical docs asset CSS, with only the Item base role / scoped painter partition modified.
- Native browser `page.set_content` with real `qxframe9a7c2-menu-item qxframe9a7c2-item-surface` Item DOM, containing plain, selected, hover, selected+hover, disabled, selected+disabled, open, and selected+open states. Waited 1200ms for Theme transition settlement.
- **8 states × Light/Dark = 16 cases; for every element, all computed CSS properties have 0 baseline/candidate differences**, including selected background, foreground, alpha and private role slots. A negative trial with no scoped painter visibly reproduced the 8067-pixel sidebar area failure. Broader Card document runner remains mandatory.
- Expanded the existing real-doc Chromium **CSSOM comparison** to also include up to 90 sidebar Menu Items, in addition to all previously tested Card nodes and root/body. The existing full-page screenshot byte equality remains mandatory. This closes the false-negative sampling blind spot that let 152 Card-only nodes appear unchanged.
- Attempted Chromium navigation to localhost and file URLs is restricted in this environment. Local parity on actual docs site composition is limited to inline CSS/DOM; exact HEAD GitHub Actions remains the deciding run.

## Gates
- QXFRAME, CSS Schema, and Fast Chromium on **new exact HEAD** all must succeed; previous failures not relabeled as successes.
- PR #268 stays Draft, B0/main unchanged, no merge.
- R5/R6 and Stage5 A01–A06 not closed: 18 scoped rules and one source `@scope` remain, plus Theme 112 case and Portal acceptance matrix.
