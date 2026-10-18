# Table / Progress / Scroll — real component owner closure
B0 freeze: `62d9a8402c19460ced37265acc6d110ae2cfda76`; previous all-green HEAD `dcb5ff2f814fb420953930905e0f666a8052dfae` (QXFRAME #39135263511, Schema #39135263528, Fast #39135263501).

## Scope
Move four source-of-truth consumer definitions out of the **last** production `@scope (:root)` by folding the exact B0 resulting values into their existing component owners, without a new late alias/patch or modifying Theme/default JS.

- `semantic-cascade.css`: scoped qualified rules **29 → 25** (remove original current indices 6 Table Row, 7 Table Cell, 10 Progress, 11 Scroll). Retain one `@scope`, all other 25 rules and 153 previously unscoped state rules untouched.
- `table.css`: final row background/foreground and Cell border/foreground are now component-owned. Row states keep their exact source selectors and cursor state, header continues to own its distinct background.
- `progress.css`: defaults resolve the existing B0 theme muted/type/success roles (previous scoped winner) on the component itself, **including preserving B0's outcome when public progress overrides are supplied**.
- `scroll.css`: default track/thumb/edge colors retain exactly the B0 late Theme mapping on the actual Scroll owner. Higher-specificity Popup scroll appearance selectors are unchanged.
- `tools/theme-v2-contract.mjs`: scoped owner count is checked at 25, retaining the unchanged strict fingerprint contract for the 153 unscoped selectors and the 47 non-Control default-border-width owner.
- `tools/qa/css-refactor/compare-smoke.mjs`: expand native Chromium B0 self/mutant/candidate fixture with **real TABLE thead/tbody**, striped/selected/disabled/warning states, Scroll public overrides, Progress custom rail/primary/success, nested local dark. No pixel/candidate/negative tolerance relaxed.

## Negative proof — do not generalize
- Simply deleting the four late rules without replacing their component owner declarations failed local CSSOM on native table row state, public Progress and Scroll track override — **not approved**.
- Proper owner transfer: local Chrome actual 220-node Table DOM, Light/Dark, normal+real hover, striped/disabled/selected/transfer/warning/error/success, user border/row hover and nested dark: **0 computed/rect differences** each of four runs.
- Combined source candidate on a separate 202-element broad family fixture with native choice, tags, modal, control, Progress public overrides, Scroll public overrides, nested dark and Theme custom colors: **0 computed property/rect differences** in Light and Dark.
- Neither fixture proves all Create styles/bases, Portal, or unusual app overrides; triple exact-HEAD CI gate mandatory.
- Previously tested removal of nonmatching scope rules for Tag, Notification, Button, Card, Item, Menu caused real CSSOM differences. They remain scoped, pending separate ownership closure.

## Required acceptance
QXFRAME CI, CSS Schema Acceptance, Fast Chromium B0 self + negative poison + Light/Dark Card screenshot + new Table/Progress/Scroll fixtures all must pass at the **same SHA**. No rollback of B0 or merge of PR #268. No new token/Theme input, CSS history file, extra @scope, @layer, :where, :is, JS/DOM app patch or test relaxation.
