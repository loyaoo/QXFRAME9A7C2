# Core Scope 153: correction after failed real Card docs CI

## Failed prior attempt
- `2a8114c9f36672c27abf80c52541640174311335` migrated 106 additional B0 core rules (total 155 plain), passed synthetic 447/890 full CSSOM and no-owner-duplicate checks, **but failed** [Fast Chromium #39030981911](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/39030981911).
- True Card doc Light/Dark each had 249 computed/layout differences and failed whole-page screenshot equality. Several Button `is-sm` instances changed min-height 32px → 28px; Card total page block length changed. Negative poison controls and synthetic self-pair worked, so this was production style regression, not a failing test harness.

## Corrective targeted closure
- Re-rendered real offline Card doc with original JS/DOM, injected reference vs candidate production CSS; script-loaded local Card showed `min-height` deviations in 4 of 9 sm buttons, matching Fast's geometry failure.
- Binary split of the 106 original B0 candidate rule IDs revealed **#177** (generic control size recipe) and **#183** (control layout/size override) as the exact competing scoped rules. Both remain inside `@scope (:root)`.
- Recomputed the B0 source preserving all 200 selectors/declarations. **153** are plain after the original scoped block: previous 49 + newly eligible 104. Original scoped rules **47**. No new scope blocks; core file remains the sole current historically named stylesheet.
- New strict top-level selector-list SHA-256: `3378a85bbad1acca5f23029e692c353e528ac79d6fbb478702b016492473fe7d`. The source contract explicitly permits exactly 153 ordered selectors; any unknown selector remains a hard failure.

## Before pushing — local proof
- Real original Card docs HTML and original nine runtime JS sources; native CSS loaded using Playwright injection in identical source order, style settling and frozen Skeleton WAAPI timeline.
- **125 locally inspected Card+descendant+root/body nodes, Light/Dark:** full `getComputedStyle()` key/value and rect per element, **0 differences** each.
- Synthetic 447 Light and 890 Dark nodes: full computed CSSOM/geometry, **0 differences** each.
- Full ~1.1MB CSS AST owner inventory: **0 newly duplicated selector+property+context owners**, 8 pre-existing duplicate records reduced.
- B0 root universals #1/#3 remain scoped, preserving custom-variable visibility. #177/#183 remain scoped for min-height geometry. The remaining 43 scope rules have their own focused closure ledger.

## Acceptance
- Must pass **QXFRAME, CSS Schema and Fast Chromium** on the new exact SHA; earlier failed HEAD is explicitly rejected.
- No Theme/public Token/JS/DOM changes, no relaxed CSSOM or screenshot gate, no main/B0 or PR merge.
- Full CreateApp 112-case browser matrix, Portal, and Stage5 A01–A06 user signoff still open. R5/R6 overall not closed.
