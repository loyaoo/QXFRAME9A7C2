# Focus and Control Source Ownership Batch

## Scope and intent
- Immutable B0: `62d9a8402c19460ced37265acc6d110ae2cfda76`.
- Last accepted branch head: `dd841d3931702f3722a9ec3edb2097e0c08e8d38` (QXFRAME, CSS Schema and Fast all success).
- Deletes `src/styles/main/theme-visual-v2-consumers.css` and replaces its actual 10,146-byte rules in **two semantically named component-family modules** at exactly the previous CSS source-order position.
- `src/styles/components/focus-feedback.css`: first 8-rule root-scope group (shared keyboard/pointer focus roles, result statuses, image masking and overlay SelectGroup indicators). This set has no `@scope` wrapper.
- `src/styles/components/control-interaction.css`: second 2-rule scoped hover block plus the unscoped pointer/keyboard/Field status projections, preserving original selectors, values and order.
- `@scope` total decreases **4 → 3**. Versioned production source file count decreases **3 → 2**. The new modules have no historical version suffix.
- `tools/manifests/css-order.json`, the Schema-1 exclusion list in `tools/style-source.mjs`, and all three QA references in `tools/verify-create-app.mjs` are updated atomically. No new Theme input, alternate patch layer, public variable or JS behavior.

## Explicit limits and counterexamples
- This is **late owner partition**, not full relocation into the early owner modules; canonical order is frozen because earlier owner placement changes cascade winners.
- Entire second scope was tested and rejected for flattening: on frozen B0 synthetic Chromium, 136 light-mode differences appeared. It remains scoped unchanged.
- Local Chromium baseline vs candidate, after 1,200ms style settling: 448 sampled light-mode and 890 dark-mode elements, including root/local dark and user overrides; **0 computed/geometry differences in both**. An earlier 200ms smoke test showed fluctuating outline values on dark controls and is not sufficient evidence; it is superseded by this stable run.
- These synthetic samples do not prove full Create preview/portal matrix acceptance. New exact-head Full QXFRAME + CSS Schema + Fast Chrome (Card docs screenshots and mutation) are mandatory before accepting.
- No changes to `theme-visual-v2.css` or `theme-visual-v2-style-consumers.css`; both still require per-component real owner migration and user visual sign-off.

## Verification and rollback
- Fail closed on source-owner duplicates, computed/geometry differences, screenshots, or extra custom tokens; restore this split from the last green HEAD instead of relaxing QA baselines.
- Branch: `refactor/css-readable-token-chain-postcleanup-20261017`; PR #268 must remain Draft. No main merge.
