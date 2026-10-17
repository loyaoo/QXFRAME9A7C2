# Production CSS ownership: seven component-family modules

- **B0 immutable** `62d9a8402c19460ced37265acc6d110ae2cfda76`; last accepted triple-green `95815c269650eb57eff845bbf960ef3b8c4338fb` (QXFRAME #39044474454, Schema #39044474404, Fast Chromium #39044474458).
- `src/styles/main/theme-visual-v2.css` original ~79KB held the 31 genuinely precedence-sensitive scoped rules and 153 previously plain state/size/appearance rules. The latter **54,358 bytes** are now in seven real component-domain stylesheet modules, loaded in exactly the same canonical sequence:
  
  - `src/styles/components/semantic-status-modifiers.css` — plain group 1–22
  - `src/styles/components/feedback-theme-states.css` — plain group 23–36
  - `src/styles/components/data-control-states.css` — plain group 37–65
  - `src/styles/components/input-action-states.css` — plain group 66–86
  - `src/styles/components/overlay-picker-states.css` — plain group 87–119
  - `src/styles/components/menu-selection-states.css` — plain group 120–133
  - `src/styles/components/component-sizing.css` — plain group 134–153
- The entire moved UTF-8 suffix was verified **byte-for-byte equal** to concatenating the seven new sources. Original selector strings, declarations, source order, CSS specificity, custom properties and behavior are not intentionally changed. The surviving core shrinks from **79,214 to 24,856 bytes** and retains its existing 31 `@scope (:root)` qualified rules, unresolved for the next owner stage. Four overall scope blocks still exist.
- `tools/manifests/css-order.json` inserts all seven modules immediately after core, before focus-feedback/control-interaction and the late semantic-input/appearance modules. Schema1 exclusions and 14 canonical test readers were updated to inspect the **closed, ordered combined source**, including exact source-formula and 153 selector SHA contracts; tests must continue to fail on extra/missing or changed rules.
- This is **actual component-family source partition**, not a claim that the final 31 scoped rules are resolved or the entire 1MB framework cleaned. A later R3/R6 must reconcile component-specific ownership and remove @scope after full B0 CSSOM, CreateApp style matrix, Portal, focus, and user override coverage.
- No published Theme/Token interface, Theme CSS generator/compiler, runtime JS/DOM or main/B0 modified. PR #268 stays Draft; no merge.
- **Acceptance pending** current-HEAD Fast Chromium B0 self/mutant/real Card DOM+pixel check, QXFRAME CI and CSS Schema. Any failure must be analyzed without loosening gates. The source-file partition is unaccepted until all three pass.

## Source-segment exception ledger transfer
QXFRAME run #39080265507 found 2 pre-existing `non-rem-length` exceptions in the migrated geometry group: one shared component height-size mapping and a Textarea inset subtraction of 2px. Neither value changed. In `css-gate-baseline.json` section6 non-rem-length, move **exactly two** existing allowances from `main/theme-visual-v2` to `components/component-sizing`; total unchanged, and no new exception is approved. Fast Chromium #39080265503 succeeded (Light/Dark docs each 152 elements, 0 computed/geometry diffs, whole-page screenshot identical). The baseline is not loosened to tolerate any increase.
