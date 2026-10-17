# Component Appearance — 14-rule scope retirement & Chromium lifecycle fix

**Golden B0:** `62d9a8402c19460ced37265acc6d110ae2cfda76`
**Previous branch:** `041c13d2a0f1f8d43334f7a05d36ff5a2fbb0a5a` (Fast / CSS Schema succeeded, full QXFRAME failed on Chromium temporary directory ENOTEMPTY).

## Source change (one owner file)
- File: `src/styles/components/component-appearance.css`, with original 21 qualified rules in the last-stage source position.
- **14 rules (original indices 6–15, 18–21) become ordinary component CSS.**
- **7 rules (original indices 1–5 and 16–17) remain in a single `@scope (:root)`**, retaining shared Control border/disabled topology and native checkbox/radio radius cascade precedence.
- Rules 16–17 are grouped with the earlier scoped rules. They concern only native/SelectGroup choice border radii and do not overlap the declarations of intervening 6–15. Selector/property/declaration multiset is byte-identical after whitespace normalization. Scoped rule count in this module: 21 → 7; total scoped blocks across production: 4 → 4 (does not create another block).
- This is **not** complete @scope elimination. The remaining scoped 7 rules require owner-level cascade de-duplication.
- Active Theme default, JS/DOM, design sizes and independent public override names remain unchanged.

## Local independent negative owner check
- B0 Chromium Playwright: Light 448 nodes, Dark 890 nodes across 50+ component families, nesting, state classes and public overrides. Baseline → in-place partial-scope candidate: **0 computed/geometry differences** for both modes after 1200 ms stabilization.
- tinycss2 parsed both full 1.1MB compiled CSS texts, counted selectors+property+at-rule-context duplicates: **zero new duplicates**; a simpler leave-first-five-scoped candidate added 8 global choice-radius duplicates and was rejected.
- This narrower local fixture cannot replace full CreateApp/real docs/portal acceptance.

## CI test integrity
- Full QXFRAME [#39025129037](https://github.com/loyaoo/QXFRAME9A7C2/actions/runs/39025129037) failed solely after otherwise passing release verification when Chromium profile `rmdir` raced background process teardown (ENOTEMPTY). It did not report a CSS visual regression. Node fs.rmSync retries ENOTEMPTY/EBUSY with maxRetries=15, retryDelay=200ms instead of relaxing CSS comparison.
- Acceptance requires same SHA: QXFRAME, CSS Schema, Fast Chromium with B0 self/mutant/candidate, Action hover, full-page PNG equality.
- Do not merge PR #268, change main/B0, weaken gates or claim S5-A signoff.
