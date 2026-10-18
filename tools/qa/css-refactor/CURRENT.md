# CSS Refactor continuation — 2026-10-17 R0 evidence batch

- B0 source `62d9a8402c19460ced37265acc6d110ae2cfda76`, tree `a96bb959a69f15ce27d1c78182c273d422a531e9`.
- Latest fully passed prior-head pair `1cf13ce640df8c9ed0fc615551effe790cfc5f62`: QXFRAME run 39008100852 success, CSS Schema run 39008100884 success.
- GitHub PR merge SHA `6a567d6d64e2d2b7f46955135340b8b56f351d54` and source HEAD have the SAME Git tree `2e03417267fd4fd0c7a45c7f08c54c9acccf709e`; the Action artifact names use merge SHA, while `workflow_run.head_sha` reports source SHA.
- Verified Chromium CDP Chrome/155.0.8059.0: synthetic fixture 19 elements, light/dark: B0 self differences 0; intentional mutation yielded 2 computed differences per mode; B0→same production CSS differences 0; no runtime errors. Source JS parity verified 553 dist files, no differences. This completes minimum R0 self/mutant proof, NOT full G04/G05/G06.
- Current batch adds real dynamically mounted `docs/components/card.html` computed + screenshot B0 self/negative/candidate checks, stable DOM paths, required resource and stylesheet load; separate Stage5 postmerge ledger. Results pending current batch CI.
- Active implementation R0-03/R0-04/R0-05 partially complete; R1–R7 and production CSS changes pending. Stage5 owner visual signoff not provided.
- Next exact step: verify same-tree QXFRAME & Schema current batch runs; inspect report `css-refactor-smoke.json` and six real Card screenshot PNGs, fix any harness instability WITHOUT relaxing checks; then begin full CSS AST Token/rule/owner inventories and Card pilot design closure. Never merge PR #268 or modify main/B0.


R5/R6 incremental closure candidate: `main/theme-visual-v2-style.css` → `main/semantic-inputs.css` (26 Theme-derived private roles, one `@scope` replaced with explicit `:root,.dark` at unchanged canonical module order). Historic file deleted; all active references updated. Do not report as accepted until exact-head triple CI and visual QA. The 26 root roles are transferred in the CSS gate ledger, total unchanged; no ratchet relaxation.

Removed six duplicate early private roles from fixed-values.css, preserving the same inputs under the late semantic-inputs.css owner. Exact new SHA full gates required.


### R5 focus / control consumer partition (dd841d3931702f3722a9ec3edb2097e0c08e8d38)

Legacy `src/styles/main/theme-visual-v2-consumers.css` is deleted and its entire 10KB of actual rule declarations are preserved at the original cascade position in `src/styles/components/focus-feedback.css` (feedback/focus base) and `src/styles/components/control-interaction.css` (Input/Form/SelectGroup states), except that the first 8-rule `@scope (:root)` group is now ordinary CSS. Second scoped hover group is deliberately retained pending cascade ownership work. CSS source order, JS/DOM and public Theme contract unchanged. CI acceptance pending new exact HEAD; no merge authorization.

Correction: the extracted feedback-focus rules retain original @scope(:root), because unscoping created four duplicate owners and was rejected by QXFRAME CI. Still eliminates the versioned consumer module, partitions 10KB into two components, and preserves original cascade. Current exact-head triple gates required.


Component appearance owner batch: historical last-stage 21-rule file moved in-place to components/component-appearance.css. Initial private-variable deletions were REJECTED by full CSSOM comparator and completely reverted; 14 names/21 definitions remain unchanged. 4 @scope wrappers remain; only the one core 81KB version-named file remains. Exact-head triple CI pending.

## Partial @scope retirement at component-appearance owner
14/21 qualified rules lifted to plain CSS; 7 priority-sensitive rules remain in the same original root scope. No additional scope blocks; no duplicate-owner ratchet increase. Exact-head three CIs required. CDP fs.rmSync now retries ENOTEMPTY during cleanup instead of terminating successful comparisons. Detailed proof: tools/qa/css-refactor/APPEARANCE-SCOPE-14.md.

## 49-rule scoped-core migration (pending exact-head CI)
Core theme-v2 main file: scoped rules 200 → 151; 49 plain component state/geometry rules moved to the tail of the same file with selector/declaration multiset preserved. New duplicates: 0; local accepted-head Chromium geometry: 0 differences (448 Light, 890 Dark); source contract B0-approved selector hash pinned. R5/R6 overall remain pending; no new component file or historical alias introduced.


## Second core owner closure: extra 106 (pending exact-head CI)
The one active core `@scope (:root)` retains 45/200 original rules. A previously accepted batch moved 49; this batch migrates 106 more root-inheritance-safe, globally non-colliding rules to plain component selectors in the original core stylesheet tail, making 155 plain. B0 original rule IDs 1 and 3 (universal semantic roles and generic type mapping) stay scoped, alongside 43 additional conflicting rules. Local B0 and last-green CSSOM: 448 Light/890 Dark selected elements, all computed properties and geometry, zero differences. Actual browser/CI/portal must revalidate. Selector exact-list SHA256 `a07758b80e49246cff7c1475880691891db666c4a6c8b9d6a17b5049bccb9dfe` pins 155 rules. Source changes grouped in a single commit; no main/B0 mutation or PR merge.


## Exact-HEAD correction to 153 qualified rules
The proposed 155-rule migration did not pass the real Card docs gate: #39030981911 detected 249 per-mode computed+geometry differences, primarily `.qxframe9a7c2-button.is-sm` 32px→28px. Local real Card doc CSSOM and binary rule isolation proved original B0 rules **#177 and #183** are the interacting cascade owners; returned both to the scoped set. The narrowed additional migration is 104 (153 total plain, 47 scoped), with zero full CSSOM/rect differences in both real Card light/dark and synthetic 447/890 probes; no new duplicate selector/property owners. Current exact-HEAD triple CI pending; the prior failure is not marked accepted.


Core component-painter owner consolidation: eight B0 late scoped duplicate visual rules removed from src/styles/main/theme-visual-v2.css; 153 original plain rules retained unchanged, scoped core 47→39, all existing component owner CSS remains as before. Exact-head triple CI acceptance pending. Evidence and rule mapping in tools/qa/css-refactor/CORE-SCOPE-39.md.

## Five real component-owner closures (pending exact-head triple CI)
Original B0 ids #55 disabled Item, #66 Slider handle, #86/#87 Carousel and #194 Switch checked geometry are incorporated in their existing canonical component CSS. Main core scope 39→34; 153 plain rules remain, 4 scope blocks remain. Chromium preflight 505 Light / 948 Dark synthetic + 125 actual Card doc per mode, full CSSOM & geometry 0 differences. Native owner coverage appended to comparator fixture. Detailed evidence: OWNER-CLOSURE-5.md.


## Four owner closures: Card Grid/title, Switch Thumb, Input placeholder/prefix/suffix
Real scoped rules 34→30 via edits in existing Card/Switch/native-input component source, no new style layers or version aliases. B0 CSSOM fixture and local static DOM 0 differences; rejected Button Filled move remains scoped. Exact-head CI must still pass. Detailed evidence: tools/qa/css-refactor/OWNER-CLOSURE-4.md.


Owner correction: Card Grid Hover public --qxframe9a7c2-card-shadow override must be preserved. Restored original component rule and B0 scoped hover winner; real scoped core 30→31. Current batch valid owner changes are CardTitle, SwitchThumb, Input; exact-head CI must accept before signoff.


## Seven component-family modules (exact-head CI pending)
153 plain consumer rules (54,358 B) have been extracted byte-for-byte from legacy theme-visual-v2.css to seven late component-domain CSS modules. The legacy core now contains 31 scoped rules and root tokens, at 24,856 B. Rule order preserved and canonical source readers updated. See SEMANTIC-CONSUMER-PARTITION.md. No extra @scope; PR remains Draft.


## R5 semantic cascade core consolidation — 2026-10-18
Last historical production CSS filename `src/styles/main/theme-visual-v2.css` is retired. Its 31 remaining scoped rules, root tokens, actual selectors and declaration order now live at exactly the same canonical CSS loading position in `src/styles/main/semantic-cascade.css`. Tooling/readers/source gate/order/size exceptions/ratchet references atomically follow the new owner. No change to public Theme variables, JS, DOM, @scope count, visual output, or developer-facing selectors. Duplicate-owner baseline allowance transfers from historic `main/theme-visual-v2:34` to `main/semantic-cascade:9` (observed current green count); allowed duplicate owners decrease by 25. This removes the last live versioned CSS file, but the 31 scoped rules, 3 other scope blocks, component owners, and Stage5/112 style browser/Portal gates remain **unfinished**. Evidence file `tools/qa/css-refactor/SEMANTIC-CASCADE-RENAME.md`. Await exact HEAD Fast/QXFRAME/Schema success; PR #268 remains Draft and main/B0 frozen.


## Root-excluding semantic role candidate (pending exact-head three-gate approval)
Moves 62 universal roles from scoped `*` into zero-specificity `* *` immediately preceding the original scope to preserve root omission and local dark re-evaluation; the scoped core rule count is 31→30, scope blocks remain 4. Four adjacent same-selector component rules merged and one duplicate InputGroup property removed. Source contract pins normalized semantic-role SHA256. See ROOT-DESCENDANT-SEMANTICS.md; actual Chrome and full CI acceptance required.


## Seven root-scope rule ownership transfers (pending exact HEAD gates)
`semantic-cascade.css`: shared generic Type role selector lifted to root-excluded plain `* *[class*]` (29 scoped left). `focus-feedback.css`: transferred descendant FocusOrigin vars into focus-closeout.css, four Result state aliases into result.css, and overlay SelectGroup indicator into collection-select.css (2 scoped left). All transferred values unchanged; no new scope blocks or Theme/JS/DOM changes. Synthetic full CSSOM 68 nodes in each light/dark mode, zero differences for the whole seven-rule batch. Exact-head Fast/Full/Schema mandatory; see FOCUS-TYPE-OWNER-7.md.


## Two @scope closures (pending exact-HEAD triple CI) — 2026-10-18
- Delete the now-redundant source `src/styles/components/focus-feedback.css`. Its Form input/select/textarea pointer :focus-visible outline is already implemented by the canonical focus-closeout.css with the configured Theme pointer width/offset; the Image overlay private mask role moves into the actual image.css owner, with the same Theme overlay formula winning as frozen B0 (including public override precedence).
- Remove the two-rule `@scope (:root)` wrapper from `components/control-interaction.css` while retaining the exact original selectors, declaration sets and source order for JS/native hover. Drop the superseded earlier JS Input state-border declaration from native-input.css to avoid introducing a second global owner.
- Update source manifest + Schema-1 exclusion list, and expand Chromium synthetic fixture with actual pointer focus, readonly/disabled native controls, image masks, public overlay override and nested .dark.
- Local 50-node static Card/Form/Image fixture Light/Dark: complete computed CSSOM & geometry 0 candidate differences in 6 combinations; native pointer hover four input/select/textarea states Light/Dark 0 differences; parsed CSS owner inventory 0 new competing selector/property owners. This local test omits JS dynamic docs mount and other states; mandatory exact-HEAD QXFRAME, CSS Schema, Fast Chromium with negative controls and screenshots.
- Active source `@scope` block count 4→2. No Theme/JS DOM/runtime change, no increase in owner ratchet. B0/main frozen and PR #268 remains Draft. See TWO-SCOPE-FOCUS-CONTROL.md.


## Appearance state scope refinement — current HEAD pending full CI
In component-appearance.css, 3 native/JS focus/validation and disabled rule groups were moved to ordinary selectors at original late file position; 4 still scoped. All seven qualified rules and formulae conserved exactly, no additional owner pair collisions, 2 total production @scope blocks. Fast Chromium fixture now covers actual Control focused/error/warning/disabled and nested dark/public field-sides states. Detailed record: APPEARANCE-FOCUS-STATE-3.md. No R5/R6 full closeout or user Stage5-A acceptance.


## Final Appearance scope ownership consolidation — 2026-10-18
The former 4 qualified rules in components/component-appearance.css are now plain component CSS, removing the full scoped block. Their earlier competing owners are deliberately consolidated: 6 shared Control border-width defaults are separated from 47 non-Control default owners in component-sizing.css; 5 earlier form-control background paints are removed from data-control-states.css; overlapping native/check/radio radius selectors are removed from choice-visual.css while preserving the special unwrapped SelectGroup input radius selectors. Four production modules changed atomically, 2 total @scope blocks → 1, exact-head triple CI pending. See APPEARANCE-SCOPE-CLOSURE.md.

Strict source gate closure: Fast #39134378268 passed no-visual CSS, but QXFRAME/Schema rejected intentional new 47-selector border fallback as 154th unscoped rule. Gated exact 47 selectors by SHA256, single 1px declaration, while preserving 153 original selector hash and count. Same-HEAD full CI pending.


## Table / Progress / Scroll owner closure (pending CI)
Four final precedence-sensitive declarations from the sole active semantic-cascade @scope are now declared by Table, Progress and Scroll source owners; core 29→25 scoped, no new scope blocks. Local browser full CSSOM/geometry on 220-node Table state matrix and 202-node cross-component/public-variable matrix: 0 Light/Dark differences. Exact head CI must verify Card docs, negative controls, Schema and release; no Stage5 signoff. See OWNER-CLOSURE-TABLE-PROGRESS-SCROLL.md.
