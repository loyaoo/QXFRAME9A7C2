# Four scoped consumer closures — Tag, Table and Button

## Baseline and safety
- Immutable B0/main `62d9a8402c19460ced37265acc6d110ae2cfda76`; exact last-green development HEAD `c2996b3dbe9562d44a3f955dc9c40da00b9ed2ea`, QXFRAME, CSS Schema and Chromium Fast all success. PR #268 remains Draft.
- Production core `src/styles/main/semantic-cascade.css`: **21 → 17** root-scoped qualified rules; one remaining `@scope (:root)` block. Removes actual rule numbers **2,3,4,10** from this HEAD's scoped-rule inventory. All other 17 scoped rules and all non-scoped semantic assignments preserved verbatim. No global new @scope or alternate patch file.
- Transfer original Tag neutral surface and Tag solid type foreground to `components/feedback-theme-states.css`, the Table background/text/border to `components/data-control-states.css`, and Button filled focus-border alpha to `components/input-action-states.css`. These already-loaded late component-domain modules preserve exact selectors and body declarations; moving to earlier base component CSS would have changed source order and is not attempted.
- No Theme generator, public/private token name, color-mix formula, runtime JS/DOM or source order list modified. Strict contract asserts the four exact selector/declaration recipes in target modules and exactly 17 rules still scoped.
- Browser smoke gains actual Tag default/solid/disabled/colored, Button filled/focused, Table surface and nested local dark nodes. Existing real Card docs, whole-page screenshot, negative mutation and action-hover evidence remain mandatory.
- Risks not claimed closed: Theme public override edge cases, nested popover/local dark, four Framework scope-removal packages and full 112 Theme CreateApp/portal matrix. Exact-head QXFRAME + CSS Schema + Chromium Fast must pass; revert production changes if any CSSOM or screenshot regression. No ratchet relaxation.

## Duplicate-owner correction before final acceptance
- Strict Fast #39189758228 found three valid duplicate CSS owner keys in early components: `.tag { color }`, `.badge.is-solid { color }` and `.button.is-filled { --_qxframe9a7c2-button-focus-border }`.
- Do **not** increase `duplicate-owner` ratchet. Remove only the superseded early property declarations in `tags.css`, `badge.css`, `button.css`, retaining all other button/tag/badge private slots and states.
- Their exact late values remain in `feedback-theme-states.css` and `input-action-states.css`. The tag/badge fields are still assigned from the Theme and per-Type roles. No earlier owner is left competing for the same key.
- Corrected the initial structural assertion's whitespace-normalization regular expression: `/\\s+/g` (literal backslash) → `/\s+/g` (actual whitespace). This corrects the test; it does not relax a requirement.
- This is one closed component-family owner migration; the previous failed HEAD and its screenshots cannot be used as acceptance. Exact corrected SHA three CIs and negative controls required.

## Table final-owner correction
The full QXFRAME #39189833778 also identified two Table `color` collisions that the preceding fast log abbreviated. Remove `table-wrap { color:var(--_semantic-text) }` and `table { color:inherit }` from the early canonical `table.css`; keep all other Table geometry and variable declarations. The new later `data-control-states.css` continues to supply exactly `color:var(--qxframe9a7c2-theme-foreground)` to both, matching the original scoped final owner. This closes five explicit duplicate-owner keys in one family batch, not by increasing ratchets.
