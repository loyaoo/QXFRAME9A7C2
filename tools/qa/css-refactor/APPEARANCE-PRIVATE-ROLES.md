# Component Appearance + Dead Private Roles — consolidated source batch

## Frozen and ownership
- Immutable B0: `62d9a8402c19460ced37265acc6d110ae2cfda76`
- Previous exact-head CI candidate: `e238c297fde792685e79567f6f5a29c47a4b01e2`; Fast #39023485165 and CSS Schema #39023485161 success. Full QXFRAME #39023485136 **must be checked before claiming last-head triple green**.
- The entire historical `src/styles/main/theme-visual-v2-style-consumers.css` source (21 top-level qualified rules in one scoped block, approximately 13KB) moves to `src/styles/components/component-appearance.css` **at the same last-stage source order**. Its declarations, scoped selectors and rule order remain unchanged. No new `@scope`, cascade level, fallback, public Theme property, or CSS paint is introduced. The new module is an interim shared component appearance owner, not yet full per-component relocation. Legacy Style historical module count 2→1.
- The real source/manifests, schema-1 filter, Theme layer verifier and CreateApp source-assertion references are updated atomically. Compiled module count stays unchanged.
- Gate ratchet reassigns the existing observed 12 duplicate-owner records from `main/theme-visual-v2-style-consumers` (old allowance 15) to `components/component-appearance` (new allowance 12). This **reduces** total baseline allowance by 3. No count is increased to disguise duplicate owners.

## Dead private role cleanup
- Removes **21 declarations for 14 distinct private names** from `src/styles/main/theme-visual-v2.css`.
- Removal candidates were selected only where B0's concatenated CSS has no `var( --name)` consumer (whitespace-aware, exact identifier boundary), B0 official built `dist+docs` JS/HTML/JSON (355 runtime files) has no text reference, and key source contract gates have no exact identifier references. Names with runtime text hits (success, warning, info, soft-info, generic accent) were explicitly excluded.
- Removed names: --_qxframe9a7c2-semantic-mask, --_qxframe9a7c2-semantic-error, --_qxframe9a7c2-semantic-overlay-control-hover, --_qxframe9a7c2-semantic-accent-hover, --_qxframe9a7c2-semantic-accent-focus-color, --_qxframe9a7c2-semantic-accent-soft, --_qxframe9a7c2-semantic-accent-soft-hover, --_qxframe9a7c2-semantic-success-soft, --_qxframe9a7c2-semantic-error-soft, --_qxframe9a7c2-focus-focus-shadow, --_qxframe9a7c2-validation-error-focus-shadow, --_qxframe9a7c2-validation-warning-focus-shadow, --_qxframe9a7c2-semantic-accent-active, --_qxframe9a7c2-surface-gap.
- No `--qxframe9a7c2-theme-*` public name was removed or redefined. Private dynamic-name construction outside known code remains a residual risk; do not treat a static scan as general runtime proof.
- No JS, Theme compiler, DOM, .dark scheme, control geometry or animation declarations changed.

## Gates (do not accept until all pass)
- New exact HEAD QXFRAME CI + CSS Schema + CSS Refactor Fast Chromium Card docs: self/mutant/candidate, Light/Dark computed styles and screenshots.
- Additional dynamic-name/public override validation remains an open R1/R4 item. No full 112-config/portal acceptance claim.
- PR #268 remains Draft and main/B0 are untouched.
