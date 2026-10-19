# Last @scope — Notification / Menu / Textarea component ownership

Previous fully-green HEAD: `427d041aab9966013b45d6a295196e8442fbe8f6` (QXFRAME 39177267087, Schema 39177267068, Fast 39177267222 all success). Frozen main/B0: `62d9a8402c19460ced37265acc6d110ae2cfda76`.

## Actual source changes
- `semantic-cascade.css`: remove scoped current rule indices **4,16,17,25**; retain 21 other qualified rules in the exact original order and original root scope. No new scoped block, historic CSS file, global patch layer or public Theme token.
- The exact Notification surface final declarations are transferred to `feedback-theme-states.css`, *before* its existing component feedback states. Remove the now-superseded earlier Notification text-color declaration from `notice.css` without changing its public background/border fallbacks, sizing, shadow or status handling.
- Both Menu final container paint and disabled state projections are transferred to `menu-selection-states.css`, *before* its existing Menu hover/selected/open recipe. Remove the previously shadowed base Menu container text-color and redundant disabled bg declaration from `menu.css`; retain the cursor, text, outline and focus affordances.
- The repeated `.qxframe9a7c2-input.is-textarea{padding:0}` scoped declaration is removed; the unchanged `native-input.css` base rule already owns exactly that value.
- Production CSS changes to five existing modules, no component controller/JS/DOM edits. The component owner modules already load late relative to `semantic-cascade.css`; original selector and value semantics are retained.
- Source structural gate `theme-v2-contract.mjs` now asserts exactly 21 remaining scoped qualified rules, preserving every other strict selector fingerprint, B0 Theme recipe and no-disallowed-CSS checks.
- The independent Fast Chromium fixture now mounts live Navigation Menu default, dangerous/disabled, hovered disabled, disabled parent, Notification normal/warning/public override, Textarea and nested local .dark. The existing B0 self/self, intentional mutation, full computed style + geometry and 1:1 full-page screenshots continue unchanged.

## Counterexamples and acceptance
- Interactions between Menu scoped precedence and the existing late Menu selection state rules remain sensitive; therefore unconditionally broadening or dropping the Menu root scope is forbidden. Fail closed if any Menu state or notification override changes.
- Local Chromium browsing was **not possible in this container** (Chromium reports `ERR_BLOCKED_BY_ADMINISTRATOR` even for localhost, file: and data:); no local visual equivalence claim is made. The baseline immutable B0 CSS source and source-level declaration comparison support this candidate only. Require new exact-HEAD Fast, QXFRAME and Schema success.
- Stage5 owner visual signoff and full 112-style + Portal interaction coverage remain open. Draft PR #268 must not merge or touch main/B0.
