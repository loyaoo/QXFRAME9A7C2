# SEMANTIC-INPUTS-001 | Root-input mapping consolidation

**Frozen B0:** `62d9a8402c19460ced37265acc6d110ae2cfda76`
**Prior 3-workflow approved HEAD:** `5788af42d088fcdff3f4035b5756797ff1d44fd3`

## Changed production source
- Former `src/styles/main/theme-visual-v2-style.css` is **deleted**, replaced at the **same source order position** by `src/styles/main/semantic-inputs.css`. No second adapter, versioned alias, duplicated rule, or re-generated Theme file is introduced.
- The 26 existing component-facing private variables remain identical and read the exact same public Theme inputs. The old single `@scope (:root)` plus inner `:scope,.dark` selector becomes a direct `:root,.dark` rule; the original root and local dark evaluation boundaries remain.
- Do not move these private variable declarations into early `fixed-values.css`: local B0 Chromium preflight **disproved** that change. That candidate produced 136 light and 34 dark CSS computed differences. This version keeps the late source order.
- All active references in canonical `css-order.json`, schema-1 excluded consumer list, `verify-css-token-layers.mjs`, and `verify-create-app.mjs` now reference the semantic module. The old file is not left behind.
- Gate baseline accounting transfers 26 root-non-theme declarations from the previous filename to the new owner, with **no change in total allowance**; the migration is not a ratchet increase.
- No new @scope; global root-scope count expected 5→4. No changes to JS runtime, Theme compiler, exported Theme CSS, public tokens, selectors that paint components or the existing FocusOrigin protocol.

## Local B0 preflight
- Programmatically reconstructed the frozen official B0 compiled CSS and swapped the precise module body at the original source-order location.
- Chromium Playwright: 448 light-mode and 890 dark-mode sampled elements across 50+ component families, sizes/states, an ancestor local dark boundary and public overrides. Computed CSS key properties and geometry: **0 differences in both modes**.
- This preflight is strictly limited, and is not the official L2 CreateApp/Portal/interaction evidence. Do not infer acceptance from it.

## Mandatory new-head gates
- Exact-head QXFRAME CI, CSS Schema Acceptance and CSS Refactor Fast Evidence (B0 self + negative controls + Card docs computed/layout and full-page screenshot).
- Any fail must be investigated without broadening Theme or CSS gates. No Draft PR merge.
- Partial scope work, **not** completion of R5-05/R6-01, because 4 scoped blocks and 3 historical `theme-visual-v2*` modules remain.

## Correction after QXFRAME owner gate
QXFRAME #39021602826 correctly rejected 12 records corresponding to six root/dark duplicated private variables. Retire the six earlier fixed-values declarations so the late semantic-inputs.css rule is the sole owner. No test baseline increase and no fallbacks introduced. Exact private names: --_qxframe9a7c2-fixed-card-meta-gap, --_qxframe9a7c2-fixed-card-title-delta, --_qxframe9a7c2-fixed-motion-duration-1, --_qxframe9a7c2-fixed-motion-duration-2, --_qxframe9a7c2-fixed-motion-duration-3, --_qxframe9a7c2-fixed-motion-duration-5. Chromium B0 self/candidate local synthetic: 448 light nodes, 890 dark nodes, zero computed/geometry differences after a 1000ms stabilization. CI acceptance remains pending.
