# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. If they differ, reconcile this file before continuing.
> This file must contain current truth only. Superseded findings belong in DONE evidence, not in CURRENT.

## Repository checkpoint

- Last checkpoint date: 2026-10-02
- Repository: `loyaoo/QXFRAME9A7C2`
- Repository HEAD: always query Git on resume; do not cache a self-invalidating HEAD in this file.
- Active branch / PR / CI: always query GitHub on resume; do not cache transient branch names, PR states or “latest” run IDs here.
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md` (historical filename retained; body defines 9 Runtime Controllers + pure CSS Theme/Token).
- Overall handbook implementation progress: base 9-controller migration is 100%; final-audit remediation, focus follow-ups and the Picker/Autocomplete/Notification/Table/Image UX closeout are implemented with regression coverage.
- Current Phase: CSS Grid + viewport closeout DONE; bulk Size Tree source migration active; PR/CI checkpoint pending
- Current Task: `CSS-TOKEN-SCHEMA-001` (IN PROGRESS)

## CURRENT

### CSS-TOKEN-SCHEMA-001 — CSS Design Token Schema v1.6 refactor
Status: IN PROGRESS
Task progress: post-viewport actionable raw-size migration 91.3% complete (925/1013 closed; 88 remain)
Phase: Phase A/B/C DONE; Grid/viewport closeout DONE; Size Tree bulk source migration active

Current Size Tree bulk checkpoint (2026-10-02):
- Canonical candidate inventory: 178 total; 76 exact-node candidates; 12 needs-review; 89 protected breakpoints; 1 pill sentinel.
- Actionable migration count is 88 (76 exact + 12 review), down from the explicit 1013 baseline.
- Component-batch execution is now authoritative for closeout; phase-completion percentages must not be used as consumer-migration completion.

User authority:
- Execution authority is `QXFRAME9A7C2-CSS-Design-Token-System-Refactor-Execution-Guide-v1.6.md`.
- Preserve interaction/keyboard/value/overlay behavior, icon-font mapping, 24-column Flex Grid math, responsive breakpoints, and Motion lifecycle.
- Target dependency is Preset -> Theme -> Component -> Private resolved token; Component must not bypass Theme.
- Size Tree v1 uses 46 sequentially named nodes; scalable visual geometry is rem-based, while exact 1px lines and percentage layout remain allowed.
- Final framework layout forbids vw/vh/vmin/vmax, fr and CSS Grid; migration requires per-consumer verification, not mechanical replacement.
- SCSS is source organization/build-time only. Runtime theming remains CSS custom properties; no ThemeController/TokenController.

Baseline / reconciliation (2026-10-01):
- main HEAD at task start: `fa76cd12729642a8cca9ab1c42b4b9c1e6fbd21a`.
- Main QXFRAME CI #1039 / run 36803727898: SUCCESS.
- Open PRs at task start: none.
- Existing semantic/motion/controller work is frozen and must not be reopened without a demonstrated regression.
- Frozen CSS baseline SHA-256: `72eefc2a738b744c09b7243b94db3dac92f2d0b68237478b1ba170208c243234`.
- Frozen CSS baseline: 884,967 bytes / 17,774 lines.

Phase A build handoff delivered:
- Canonical release entry is now `src/styles/qxframe9a7c2.scss`.
- Sass is pinned and lockfile-backed at `sass@1.93.2`.
- `tools/compile-styles.mjs` compiles the SCSS entry into the single `dist/qxframe9a7c2.css` release file.
- `tools/postbuild-release.mjs` no longer copies `src/qxframe9a7c2.css` into dist.
- Phase A source is decomposed into ordered `base / preset / theme / components` SCSS modules at verified top-level boundaries.
- `theme/_family.scss` is source organization inside the Theme layer; it is not a fourth public Token layer.
- The temporary `src/styles/_legacy.scss` mirror is removed.
- The legacy `src/qxframe9a7c2.css` production source is removed. The immutable Phase A comparison file lives only under `tools/fixtures/css-token-phase-a/` and is not shipped.
- `tools/style-source.mjs` is the shared source-loader authority for SCSS-aware audits/verifiers; tools must not hard-code physical legacy CSS paths.
- `verify:scss-source-authority` scans tools/generated manifests and fails if the retired production CSS path reappears.
- `verify:css-scss-equivalence` proves the migration module is byte-identical to the baseline and that the canonical entry produces the same Sass output as direct baseline compilation.
- Existing CSS-authority/browser checks execute against compiled SCSS output while structural source assertions still use the frozen baseline during this transition.
- CI returned to strict `contents: read` + `npm ci`; the one-time lock refresh/write path has been removed.

Phase A closeout verified:
- PR #202 QXFRAME CI #1054 / run 36837090404: SUCCESS.
- Legacy `src/qxframe9a7c2.css` removed from production source.
- SCSS source-authority guard passed; full release, Windows, npm pack and docs demo passed.

Verified CI:
- PR #200 QXFRAME CI #1045 / run 36829080678: SUCCESS.
- PR #201 QXFRAME CI #1048 / run 36830551150: SUCCESS (exact decomposed-SCSS head before status-only checkpoint).
- Full release verification: SUCCESS.
- Windows tool paths: SUCCESS.
- npm pack + standalone dist/docs demo: SUCCESS.
- Browser suite remained green after SCSS compilation.

Current baseline inventory summary:
- public token definitions: 483
- private token definitions: 824
- px occurrences: 492
- rem occurrences: 1,104
- non-1px/0px occurrences: 272
- odd px occurrences: 45
- decimal px occurrences: 14
- forbidden viewport-unit occurrences: 54
- fr occurrences: 21
- CSS Grid declarations: 436
- color-mix() calls: 206
- JS geometry-coupling sites: 147
- Inventory values are discovery only; they are not approval for mechanical replacement.

Phase B exact-head evidence:
- PR #203 QXFRAME CI #1056 / run 36837720548: SUCCESS.
- Generated full inventory artifact #11150345740.
- Counts: odd px 45; decimal px 14; viewport units 54; fr 21; CSS Grid matches 436; JS geometry sites 154.

Phase B persisted basis:
- Full consumer inventory: `tools/manifests/css-token-phase-b-inventory.json`.
- Decision/classification manifest: `tools/manifests/css-token-phase-b-decisions.json`.
- `verify:css-token-phase-b` regenerates the current inventory and fails if the persisted basis is stale.
- Temporary CI write permission and self-commit step are removed.

Recent evidence:
- Main CI #1116 on `da54e4ee70971718a4d342ca902dfa2fe596817a`: SUCCESS; Card skeleton title 15px→16px is merged and verified.
- Theme control geometry batch maps 14 exact literals to Size Tree nodes without changing physical values; odd 13/5/7px control values remain explicit.

Recent evidence:
- PR #222 merged as `7f528805ccde31cd42c608ef7deef4f6975d8435` after CI #1124 SUCCESS.
- Control recipe normalization branch rebased onto that main; exact-head CI must pass before merge.

Recent viewport closeout evidence (2026-10-02):
- PR #232 merged to main as `f74409534045d5fdf60dbd281cf72805fd1c7ad7`; CSS Grid/fr live inventory is zero.
- PR #233 is the active viewport closeout branch.
- Fixed-root Modal/Drawer/Notice rail batch removed 12 consumers: 54 -> 42.
- Container-relative popup/overflow/loading/sort batch removed 19 consumers: 42 -> 23.
- Upload preview and Image preview now derive percentage constraints from their proven fixed `inset:0` preview roots; Image trajectory JS keeps its existing pixel geometry ownership.
- NoticeService preserves the zero-width list/absolute slot model and now projects measured viewport availability through `--qxframe9a7c2-notice-available-inline-size`; no percentage is resolved against the zero-width list.
- Canonical CSS viewport-unit inventory is now 0; the verifier rejects any future vw/vh/vmin/vmax consumer globally.
- PR #233 code head `9aa8fa9072baef93f4e2e4ab9eaf1d348d5f3a48` passed QXFRAME CI #1174 / run `36890639622`: Windows tools, Size Tree inventory, Grid map, viewport map, JS geometry map, Full release verification, Phase B inventory generation, npm pack, and standalone dist/docs all succeeded.

Viewport closeout final evidence:
- PR #233 merged to main as `7773b2a042a196e09f22165ba83ead67ec40f356`.
- Main QXFRAME CI #1176 / run `36892319564`: SUCCESS, including Full release, Windows tools, npm pack, standalone dist/docs and GitHub Pages deployment.
- Canonical CSS viewport-unit inventory is 0 and remains verifier-locked.

Small visual-geometry batch (PR #234):
- Removed the dead public 3px `--qxframe9a7c2-focus-ring` alias; canonical keyboard focus remains the existing 2px Size Tree-backed private focus contract.
- Switch active press expansion: 3.2px -> Theme geometry token -> Size Tree size-2 (4px).
- Slider XS/SM rail: 3px -> Theme geometry tokens -> Size Tree size-1 (2px).
- Slider LG rail: 5px -> Theme geometry token -> Size Tree size-3 (6px).
- `radius-pill:100rem` is explicitly preserved as a semantic sentinel, not forced into Size Tree.
- Size Tree candidate inventory: 1259 -> 1254; needs-review: 121 -> 116.
- PR #234 implementation head `ec4443e96123eb5507f6c4aee75839e96762d492` passed QXFRAME CI #1182 / run `36938028212`: Full release, Windows tools, Size Tree, Grid/viewport/JS geometry gates, npm pack and standalone dist/docs all succeeded.

PR #234 final evidence:
- PR #234 merged to main as `b24cf4ac3703911862a09fd24587ad9aee697567`.
- Main QXFRAME CI #1184 / run `36938939246`: SUCCESS.

Bulk Size Tree migration 1 (PR #236):
- Frozen Grid gutter API remains `g/gx/gy 0..24` with the same `0.125rem × n` physical defaults; 336 raw gutter literals now resolve through Theme Grid gap tokens.
- Existing Preset spacing scale is fully bridged as Theme space-1..12; 161 scalable component spacing literals were migrated without changing their physical values.
- Added semantic Size Tree-backed Preset -> Theme -> Component geometry scales for Icon, Avatar, Progress line/circle, and Switch height/width/padding.
- Switch XL padding normalized 3px -> 4px, consistent with the approved even-size rule.
- Inventory moved from 1254 total / 1013 actionable to 726 total / 516 actionable.
- Exact-node candidates: 897 -> 401; needs-review: 116 -> 115.
- PR #236 implementation head `7f308dde9b2639294c16911a6f4065f74ddb545e` passed QXFRAME CI #1189 / run `36947850053`: Full release, Windows tools, Size Tree inventory, Grid/viewport/JS geometry gates, Phase B inventory, npm pack and standalone dist/docs all succeeded.
- Earlier #1187/#1188 failures were stale verifier expectations for raw Grid/Card spacing; verifiers were updated to validate the Theme-backed contracts instead.

Progress accounting:
- Do not use old Phase-completion percentages as SCSS migration completion.
- Current authoritative source-migration denominator is the post-viewport actionable inventory: 1013.
- Closed in bulk migration so far: 497.
- Remaining actionable consumers: 516.
- Bulk source-migration completion from this checkpoint: 49.1%.

Next exact step:
- This checkpoint-only update must pass exact-head PR #236 QXFRAME CI, then merge PR #236 and verify main CI.
- Start bulk migration 2 from the remaining 516 actionable consumers, prioritizing semantic geometry/control scales (Badge, FormCheck, Rate, Loading, Table and other component-owned geometry), then typography/shadow/review items.
- Keep 1px hairlines, 100rem pill, 50% circle, percentage layout, Grid span math and true responsive boundaries protected.
- Do not reopen completed Grid/viewport/Controller work without a demonstrated regression.



### SEMANTIC-MOTION-API-013 — Component Semantic API + Motion System one-track replacement
Status: DONE
Task progress: 100%

User authority:
- One-track replacement: no old API/token aliases and no dual visual timing authority.
- Canonical public styling API is `class` / `style` / `getElement(name?)`; `duration` remains only where semantically correct (for Notice/Message/Notification it is lifetime, not visual motion duration).
- CSS is the sole default visual Motion timing authority; MotionCore owns lifecycle/interruption/reversal/completion coordination and may read computed CSS timing.
- Preserve the completed 9 Runtime Controller architecture; Theme/Token remain pure CSS.
- Grid replacement is the mature 24-column contract with `g/gx/gy`, gutter 0..24 at 0.125rem increments, and xs/sm/md/lg/xl/xxl with xxl >= 1600px.

Delivered:
- Shared SemanticProjection + Component semantic element registry/getElement().
- Canonical class/style semantic projection with explicit default slots and repeated Element[] semantic surfaces.
- Modal / Drawer / Loading / Table / Transfer / Image / Carousel / Sort motion ownership migrated to the unified contract.
- MotionCore completion is coordinated from computed CSS timing instead of JS-owned visual-duration defaults.
- DOMBinding styling side-channels and legacy component styling aliases removed from active implementation/contracts.
- Tags / Select / Cascader / TreeSelect repeated item/tag semantic projection unified.
- NoticeService / Message / Notification legacy enterDuration/leaveDuration/moveDuration/easing and className/stackClassName/stackStyle public paths removed; notice `duration` remains lifetime only.
- Canonical Notice motion tokens added to production CSS.
- Grid replaced by the mature 24-column contract with `g/gx/gy`, 0..24 gutter scale, row-cols utilities, and xs/sm/md/lg/xl/xxl breakpoints.
- Frozen HOTFIX6 browser fixture remains unchanged; test-runner adapters translate only intentionally removed historical APIs into current semantic/CSS-motion contracts.
- Browser regression harness now reports docs sub-failures explicitly and uses deadline-safe waits for CSS-owned motion completion.

Final validation (2026-10-01):
- PR #199: `refactor: unify semantic component API, motion timing, and Grid contract`.
- Exact PR head: `4e16164e82cb3c7d4b6c1b4f06c7469a6a9703c0`.
- PR QXFRAME CI #1037: SUCCESS — Full release verification, npm artifact, standalone dist/docs, and Windows tools all green.
- PR #199 merged into main successfully.
- Merge commit: `a694409da842885e02ed7bf94f445d41a37eb6c2`.
- Main QXFRAME CI #1038 / run id 36802146232: SUCCESS.
- Main release job: SUCCESS, including dependency audit, completion audit, full release verification, npm artifact, standalone dist/docs, and GitHub Pages artifact upload.
- Main `deploy-pages` job: SUCCESS.
- Canonical Grid, semantic styling, CSS timing authority, browser regression layers, legacy HOTFIX6 compatibility harness, dist, package, and Pages are all validated on main.

Next exact step:
- None for SEMANTIC-MOTION-API-013. Do not reopen or redo this phase unless a new regression is demonstrated against current main.

### DOCS-SELF-HOSTING-CSS-012 — Docs dogfood + Card border + physical color alias cleanup
Status: COMPLETE
Task progress: 100%

User authority:
- Canonical docs should be built from the framework's existing components/CSS wherever an equivalent framework primitive already exists; docs-only classes may own documentation layout but should not recreate Card/Button/Input/Table visual systems.
- Card outer and internal divider borders should not default to visibly different neutral strengths. Keep a dedicated divider override slot only if useful, but its default must inherit the Card border.
- Remove redundant physical color forwarding aliases such as `--qxframe9a7c2-color-gray-1: var(--qxframe9a7c2-palette-gray-1)`; physical palettes should have one RGB triplet source.

Baseline / reconciliation:
- Baseline `main@09f7494df1eb9bdf0095e8a3d830ce7e66715bc4`.
- Previous `NEUTRAL-GREY-CSS-011` is complete. Main QXFRAME CI #955 / run `36687659711` is success.
- Existing controller/runtime work remains frozen; this task is CSS/docs/verifier only unless a docs runtime adapter is strictly required.

Audit findings:
- Component docs already dogfood Layout/Menu/Button/Icon in parts, but demo cards, observe cards, home cards, Theme Playground cards, and Token Reference card-like surfaces still recreate Card border/background/radius styling.
- Component demo cards are generated as `qxframe9a7c2-docs-demo-card` without `qxframe9a7c2-card`; Theme Playground generates `qxframe9a7c2-play-card` without Card; Token Reference creates several card-like shells with custom border/background/radius.
- Card root defaults `--_qxframe9a7c2-card-border` to semantic border, while `--_qxframe9a7c2-card-divider` defaults to semantic border-subtle; header/footer/actions/grid therefore render lighter internal lines by default.
- Canonical CSS contained 242 pure physical/theme-seed forwarding aliases in total (including numbered palette aliases and seed aliases). Canonical CSS did not consume them internally; all 242 have now been removed.

Frozen decisions:
- Docs-specific classes retain only docs layout/spacing/content behavior; framework Card owns the common visual shell.
- `--_qxframe9a7c2-card-divider` remains an explicit override slot but defaults to `--_qxframe9a7c2-card-border`.
- Remove all pure `--qxframe9a7c2-color-*-N -> --qxframe9a7c2-palette-*-N` forwarding aliases; do not replace them with another alias layer.
- Preserve semantic output tokens such as `--qxframe9a7c2-color-border`, `--qxframe9a7c2-color-primary`, etc.; this cleanup targets physical palette forwarding duplication, not semantic public outputs.
- Add regression gates so docs self-hosting and physical-alias removal cannot silently regress.

Implementation checkpoint:
- `src/qxframe9a7c2.css`: removed all 242 pure `color-* -> palette/theme-seed-*` forwarding aliases; semantic public output tokens remain.
- Card `--_qxframe9a7c2-card-divider` now defaults to resolved `--_qxframe9a7c2-card-border`, while `--qxframe9a7c2-card-divider-color` remains an explicit override.
- Component docs now dogfood framework Card for demo/home/reference/observe shells; search uses Form Input, feature/API pills use Tag.
- Component API reference now dogfoods Table + TableWrap + Tag + Form Input instead of rebuilding table/form visuals.
- Theme Playground now dogfoods Card for component cards, hero/token board and setting panels; header/body/footer map to Card structure; existing Button/Form controls are reused.
- Token Reference now dogfoods Card for hero/control/section/token/foundation surfaces and uses framework Button/Form controls.
- Dead parallel `.qxframe9a7c2-docs-card`, `.qxframe9a7c2-docs-button`, and `.qxframe9a7c2-docs-table` styles were removed.
- Residual docs consumers of removed `color-white/color-black` aliases were migrated to canonical physical palette tokens.
- Canonical docs + Phase F verifiers now reject return of parallel docs visual primitives, removed forwarding aliases, Card border mismatch, and missing Card/Table/Form dogfood mappings.

Completion / verification evidence:
- PR #197 `docs: dogfood framework primitives and clean color aliases` merged to `main` as `f5399052fdee0445af067f6999ac5ad6d2caf4ea`.
- Exact-head PR QXFRAME CI #957 / run `36691177918` passed on `c82f20d66c64659964e5fbcdcfb07be50aacda93`.
- Main QXFRAME CI #958 / run `36692022708` passed: Windows tools, dependency audit, Completion audit, Full release verification, npm pack, standalone dist/docs build, artifact uploads, GitHub Pages artifact upload and `deploy-pages` all succeeded.
- No runtime component/controller behavior changed in this task.

Next exact step:
- No remaining `DOCS-SELF-HOSTING-CSS-012` work. On resume, query current Git/PR/CI/Pages state first and wait for the next user-directed task.


### NEUTRAL-GREY-CSS-011 — Cold Gray leakage closeout
Status: COMPLETE
Task progress: 100%

User authority:
- Audit every remaining standard-theme/component consumer of the cold `Gray` palette and migrate it back to canonical `Grey`.
- Do not mechanically replace matching numeric steps; choose the target Grey tone by actual RGB/perceived lightness and semantic role, using Tailwind Neutral and shadcn neutral-token usage as the reference model.
- Keep the cold Gray physical palette available only as an explicit optional palette/theme input; it must not leak into standard Light/Dark component utility tokens.

Baseline / reconciliation:
- Baseline `main@5b0bb20bc4681105dff1def193e5052dede6ce7d`; no open PR at task start.
- Main QXFRAME CI #950 / run `36683036709` passed.
- NEUTRAL-GREY-CSS-010 remains complete and must not be redone.

Audit findings:
- No component selector directly consumes cold Gray. The remaining leakage is centralized in shared utility tokens and therefore fans out to multiple component families.
- Standard Light scroll track/thumb/hover use cold `Gray-5 = 85,95,109`.
- Light popup shadow and Dark loading mask use cold `Gray-1 = 27,36,44`.
- Standard Dark scroll track/thumb/hover use cold `Gray-9 = 222,227,231`.
- Cold Gray declarations and `theme-seed-gray` are intentional optional-palette infrastructure, not standard-theme consumers.

Frozen mapping method:
- Compare rendered RGB/perceived lightness rather than palette index.
- `Gray-1 (27,36,44)` -> `Grey-3 (38,38,38)` for popup shadow/loading-mask darkness.
- `Gray-5 (85,95,109)` -> `Grey-5 (82,82,82)` for Light scroll chrome.
- `Gray-9 (222,227,231)` -> `Grey-10 (229,229,229)` for Dark scroll chrome.
- Preserve existing alpha values unless verification shows a contrast regression; this task removes hue contamination, not redesigns scrollbar/shadow/loading behavior.

Implementation checkpoint:
- Standard Light scroll track/thumb/hover now use canonical Grey-5 (82,82,82), chosen by rendered-lightness proximity to old cold Gray-5 (85,95,109).
- Standard Dark scroll track/thumb/hover now use canonical Grey-10 (229,229,229), chosen by rendered-lightness proximity to old cold Gray-9 (222,227,231); this intentionally is not a same-index replacement.
- Light popup shadow and the retained Dark loading utility token now use Grey-3 (38,38,38), matching the perceived darkness of old cold Gray-1 (27,36,44) much more closely than Grey-1.
- `.is-gray` remains as a spelling/API alias but now consumes the same canonical Grey seed/on-color as `.is-grey`; component color variants no longer consume the cold Gray seed.
- The cold Gray physical palette, compatibility outputs, neutral-theme option, and theme seed remain available as explicit optional palette infrastructure.
- Phase F verifier now locks all above mappings and rejects any direct cold `palette-gray-*` consumer outside palette compatibility declarations / explicit theme seed.

Implementation commits:
- `cf8dcda30ff3de6d5a462e602343f7b5b29469c4` — standard utility tokens -> canonical Grey.
- `0a9f829f09593785a62379398813861620f0e0b3` — verifier for utility consumers.
- `0a76a448c142804a8e5a66bfb70ffcf82eb6ffe5` — component `.is-gray` -> canonical Grey alias.
- `5d1be6a3ec60be3eed19c4da84337aad669c6b7a` — verifier for component gray alias.

Verification note:
- Local clone/Node verification is unavailable in the execution sandbox because outbound DNS to GitHub is blocked; GitHub Actions remains the authoritative validation path.

PR / CI checkpoint:
- PR #195 `style: remove cold Gray leakage from component visuals` opened against `main`.
- QXFRAME CI #951 / run `36685505007` passed on head `4de0d7e1e5e0f608ff471caffa09d5b1360d00cd`.
- Windows tools = success; dependency audit = success; Completion audit = success; Full release verification = success; npm pack = success; standalone dist/docs build = success; artifact uploads = success. Pages upload is intentionally skipped for PR events.

Completion / verification evidence:
- Final exact-head PR CI #952 / run `36686017880` passed on `50a2ada9f81bbb0d7b140dab56282a44ec641418`: Windows tools, dependency audit, Completion audit, Full release verification, npm pack, standalone dist/docs build and artifact uploads all succeeded.
- PR #195 was squash-merged to `main` as `ebd9c6eed426c720dff7531ee9302784de3d681c`.
- Main QXFRAME CI #953 / run `36686567648` passed release + Windows, uploaded the GitHub Pages artifact, and `deploy-pages` completed successfully.
- Standard/component CSS no longer directly consumes cold `palette-gray-*`; the only remaining cold Gray palette references are the physical palette/compatibility declarations and explicit theme seed infrastructure.
- `.is-gray` is retained only as a spelling/API alias of canonical `.is-grey` behavior.
- No runtime component/controller JS changed.

Next exact step:
- No remaining `NEUTRAL-GREY-CSS-011` work. On resume, query current Git / PR / CI / Pages state first and wait for the next user-directed task.


### NEUTRAL-GREY-CSS-010 — Tailwind-derived Grey 13 + shadcn-style Neutral semantic recipe
Status: COMPLETE
Task progress: 100%

User authority:
- Attached `QXFRAME9A7C2 — Neutral / Grey CSS-only 重构修改手册` dated 2026-09-30.
- Scope is CSS-only runtime refactor: Grey palette, Light/Dark Neutral recipe, semantic/family consumers; docs may be synchronized.
- Do not modify Component/Controller/Picker/Popup runtime JS for this task.

Baseline / reconciliation:
- Baseline `main@e6879399483b6c4f25b93d3423519390d853e485`; no open PR at task start.
- Main QXFRAME CI #944 (run 36662982378) passed.
- Existing 9-controller migration, Phase F CSS Theme/Token architecture, Popup/Scroll/Admin closeouts remain complete and must not be redone.

Inventory findings:
- Canonical CSS still has Grey `0..13` (14 tones), including `--qxframe9a7c2-palette-grey-0`.
- Canonical CSS still has 14 pure forwarding `--qxframe9a7c2-color-grey-N` aliases.
- Standard Light/Dark mode recipes still default through `--_qxframe9a7c2-neutral-N -> Auxiliary/MixedGray -> Primary`, so default Neutral remains Primary-tinted.
- The separate cold `Gray` palette remains a distinct optional palette; current compatibility/token helpers still reference it in several places.
- Component/family CSS already routes physical color meaning through semantic/family owners after the foundation section, so the main correction can stay in CSS token/recipe layers.

Frozen decisions for this task:
- Canonical Grey becomes exactly `1..13`, 1 darkest -> 13 lightest, using the handbook Tailwind Neutral anchors plus two added light-region tones.
- Remove Grey `0` and all `--qxframe9a7c2-color-grey-N` pure forwarding aliases; no replacement compatibility alias.
- Keep MixedGray/Auxiliary generation intact as an optional/fallback recipe, but standard Light/Dark Neutral must directly use Grey.
- Keep Primary/selected/focus on the Primary axis; keyboard focus-visible remains Light black / Dark white.
- Keep the distinct cold `Gray` palette; it is not the canonical default Neutral and must not leak into standard neutral recipe.
- No JS runtime changes.

Implementation checkpoint:
- CSS implementation commit: `b28c7785adc4ddff202c45ccb7e8a091ae8b18b5`.
- `src/qxframe9a7c2.css` now defines only Grey `1..13` with the handbook Tailwind-derived RGB values; `grey-0` and numbered `color-grey-N` forwarding aliases are removed.
- Resolved `--_qxframe9a7c2-neutral-1..13` now default directly to the Grey palette while preserving public `--qxframe9a7c2-theme-neutral-N` overrides.
- MixedGray/Auxiliary `base-1..13`, `auxiliary-1..13`, and neutral mix ratio remain present.
- Light text/border/subtle roles and Dark surface/text/border roles were remapped; Dark general borders are white/10%, subtle white/8%, strong/input white/15%.
- Added a dedicated semantic input-border role so control borders can follow the Dark 15% input recipe without making every Dark border equally strong.
- Ordinary subtle/disabled semantic fallbacks now resolve to mode recipe tokens instead of regenerating near-grey values with text/background color-mix.
- Keyboard focus-visible remains Light black / Dark white.
- No runtime JS was modified.

Docs / verification checkpoint:
- Docs-only theme state, Theme Playground, and Tokens Reference now default to Grey; MixedGray is explicit and projects `theme-neutral-N -> _auxiliary-N` only when selected.
- Physical palette display now reads `palette-*-N` primitives rather than the removed numbered Grey compatibility aliases.
- Phase F token-graph verification now locks the exact 13 Grey RGB values, absence of grey-0 / numbered color-grey aliases, default Grey fallback, preserved MixedGray chain, Light/Dark recipe assignments, Dark alpha borders/input, semantic input-border routing, and removal of ordinary Neutral semantic color-mix.
- Scope diff is limited to `src/qxframe9a7c2.css`, docs-only theme/token JS, `tools/verify-phase-f-token-graph.mjs`, and this checkpoint. No `src/**/*.js` runtime file changed.

Completion / verification evidence:
- PR #193 `style: rebuild canonical Neutral Grey system` passed final exact-head QXFRAME CI #947 / run `36681486935` on `b6edc2685eb825a998ca4aab17f87953f4d69c6b`.
- PR #193 was squash-merged to `main` as `9352523eca7afc80de7aca654208115b73cbaa53`.
- Main QXFRAME CI #948 / run `36681944315` passed: release = success, windows-tools = success, Completion audit = success, Full release verification = success, npm pack = success, standalone dist/docs build = success, artifact uploads = success.
- Main #948 uploaded the GitHub Pages artifact and `deploy-pages` completed successfully.
- Canonical Grey is exactly 13 RGB-channel primitives; `grey-0` and every `color-grey-*` forwarding declaration are gone.
- Standard Light/Dark Neutral defaults directly to Grey; MixedGray/Auxiliary remains available only as an explicit optional theme recipe.
- Light/Dark semantic recipes, Dark alpha border/input roles, semantic input-border routing, focus-visible black/white invariants, and ordinary Neutral color-mix removal are all regression-locked.
- Runtime scope remained CSS-only: no `src/**/*.js` runtime component/controller file changed.
- No implementation work remains for `NEUTRAL-GREY-CSS-010`.

Next exact step:
- No remaining `NEUTRAL-GREY-CSS-010` work. On resume, query current Git / PR / CI / Pages state first and wait for the next user-directed task.


### ADMIN-GRID-CARD-LAYERING-009 — Admin Grid column / component-root DOM separation
Status: COMPLETE
Task progress: 100%

Completion evidence:
- Admin Grid columns now own responsive width and gutter only; Card/component roots are nested children instead of sharing the same DOM node.
- Mixed `qxframe9a7c2-col*` + `qxframe9a7c2-card` markup was split across the complete Admin view set, including KPI, view cards, app cards, job cards, profile/search/settings/account sidebars, schedule/workflow/developer-tools layouts, and repeated responsive Card compositions.
- Dynamic `appendCard()` now creates `div.qxframe9a7c2-col-24 > article.qxframe9a7c2-card...`.
- Admin CSS remained component-root based and required no compatibility selectors for the old mixed structure.
- `verify-admin-template.mjs` now rejects Grid columns that also carry known framework component-root classes and rejects dynamic builders that recombine Grid and Card classes.
- PR #191 passed exact-head QXFRAME CI #941 and merged to `main` as `6750f88e9cd94756e73f01d85ed84b5156521a40`.
- Main QXFRAME CI #942 for merge SHA `6750f88e9cd94756e73f01d85ed84b5156521a40` passed Windows tools, Full release verification, npm pack, standalone dist/docs + canonical browser verification, artifact uploads, and `deploy-pages`.
- No implementation work remains for ADMIN-GRID-CARD-LAYERING-009.

Resume rule:
- Query current Git / PR / CI / Pages state first.
- Do not put framework component-root classes such as `qxframe9a7c2-card` back onto the same DOM node as `qxframe9a7c2-col*`; compose `Grid column > component root`.


### MENU-SCROLL-AUTO-008 — Menu root Scroll auto visibility correction
Status: COMPLETE
Task progress: 100%

Completion evidence:
- Menu root Scroll ownership remains canonical `Menu -> Scroll`; Admin no longer calls `Scroll.showScrollbar()`.
- Menu keeps the framework default `scrollbarVisibility:'auto'`: idle chrome is hidden, scrolling activates the chrome, and it hides again after the configured idle delay.
- The shared Scroll runtime now calls `activateScrollbar()` from the native viewport `scroll` listener, so wheel, trackpad/native inertia, programmatic scrolling and other native scroll paths share the same auto-visibility behavior instead of relying only on wheel/keyboard/thumb/track entry points.
- Canonical browser acceptance explicitly verifies `menuTrackHiddenIdle`, `menuTrackVisibleWhileScrolling`, `menuTrackHiddenAfterIdle`, and actual Menu scroll movement.
- PR #189 merged into `main` as `ab3036c0d26ad0dee410bc99745df6f9aa06ea68`.
- Exact-head QXFRAME CI #937 passed Windows tools, Full release verification, npm pack, standalone dist + docs demo build, and canonical browser verification.
- Main QXFRAME CI #938 for merge SHA `ab3036c0d26ad0dee410bc99745df6f9aa06ea68` passed release, Windows, standalone browser verification, artifact uploads, and `deploy-pages`.
- No implementation work remains for MENU-SCROLL-AUTO-008.

Resume rule:
- Query current Git / PR / CI / Pages state first. Do not restore persistent Menu scrollbar chrome or re-add an Admin `showScrollbar()` override unless a new requirement explicitly asks for always-visible scrollbars.

### ARCH-MERGE-CLOSEOUT-007 — merge / main / Pages closeout
Status: COMPLETE
Task progress: 100%

Completion evidence:
- PR #186 merged into `main` as `a78e0a4a5fda5d72441074fe85090aaf9a23051f`.
- Superseded PR #185 was closed unmerged after its valid Menu-root Scroll/admin acceptance intent had been absorbed by #186.
- Main QXFRAME CI #930 for merge SHA `a78e0a4a5fda5d72441074fe85090aaf9a23051f` passed Windows tools, Completion audit, Full release verification, npm pack, standalone dist + docs demo build, canonical browser verification and artifact uploads.
- The same main run uploaded the GitHub Pages artifact and `deploy-pages` completed successfully.
- No implementation work remains for ARCH-UNIFICATION-006 or ARCH-MERGE-CLOSEOUT-007.

Resume rule:
- Query current Git / PR / CI / Pages state first. Do not re-run the popup/reorder/OverlayFrame migration or reopen superseded PR #185 unless new repository evidence proves a regression.

### ARCH-UNIFICATION-006 — Popup / Reorder / OverlayFrame shared-runtime closeout
Status: COMPLETE
Task progress: 100%

Outcome:
- Popup-family physical runtime is unified as `business component -> PopupComponent/PopupField/PickerField -> PopupRuntime/PopupFrame -> Trigger -> OverlayController/PositionAdapter`.
- PopupFrame owns popup Scroll resources; business popup components no longer construct parallel popup Scroll/Trigger paths.
- Menu main/root navigation remains an intentional business-level Scroll owner; submenu/overflow popup scrolling is PopupFrame-owned.
- Table main viewport, Tabs main navigation, Tags scroll mode, Transfer/Upload/WheelPanel/Sort remain intentional non-popup Scroll owners.
- Tree hierarchical drag/drop is a domain adapter over ReorderInteraction; Tree no longer owns a second raw drag lifecycle.
- Modal and Drawer share OverlayFrameRuntime for common frame DOM, body Scroll, OverlayFrameShell, OverlayController, PopupSurface, transitions and open/close/destroy resource lifecycle, while retaining component-specific geometry/motion profiles.
- Admin Menu uses the canonical Menu-owned Scroll and explicitly requests persistent visible chrome through Scroll.showScrollbar(); the admin shell no longer exposes a second native scrollbar.
- PR #185's valid Menu-root Scroll/admin acceptance intent was absorbed into the unified implementation; its architecture is superseded by PR #186.

Guardrails retained:
- One owner / one truth; no compatibility parallel runtime.
- Trigger remains trigger/Overlay/position/motion coordinator; popup Scroll belongs to PopupFrame, not Trigger or business popup components.
- Tree before/inside/after semantics stay in Tree while drag lifecycle stays in ReorderInteraction.
- Theme/Token remain pure CSS.
- Picker draft/commit/cancel semantics, Autocomplete input-first behavior, keyboard-vs-pointer focus-origin separation, generic overflow policy and min-width policy remain unchanged.
- No ARIA/a11y/RTL reintroduction.

Regression gates:
- `verify:capability-unification` rejects direct business Trigger creation, direct popup Scroll ownership, Tree-local raw drag lifecycle, and Modal/Drawer-local frame resource ownership.
- Existing popup-field, popup facade, Scroll, Tree/Reorder, Modal/Drawer and final-audit verifiers were updated to assert the canonical owners rather than the superseded duplicate paths.
- Canonical Admin browser coverage validates Menu custom Scroll DOM/scrollability/track+thumb visibility/movement and the real Orders DatePicker first-frame popup position.

Verification evidence:
- PR #186 implementation head `846140367ad247d9044398804ea9d91d74105ad2`.
- QXFRAME CI #926 passed Windows tools, Completion audit, Full release verification, npm pack, standalone dist + docs demo build, canonical docs verification, canonical Admin browser regression, and artifact uploads.
- The canonical Admin browser accepted `menuCustomScrollPresent`, disabled host native scroll, a scrollable Menu viewport, visible framework track/thumb, actual Scroll movement, collapsed Menu geometry, global search close behavior, and stable Orders DatePicker popup placement.
- Earlier CI failures in this task exposed and fixed two real DatePicker PopupFrame mount-order defects; PopupFrame's strict panel-descendant ownership invariant was preserved rather than weakened.
- Select/DatePicker first-frame positioning regressions remain covered and passed with motion enabled.

Resume rule:
- No implementation work remains for ARCH-UNIFICATION-006. On resume, query Git/PR/CI/Pages first and only act on current repository state; do not re-run this architecture migration from the beginning.

### SCROLL-UNIFICATION-005 — unified Scroll ownership + first-frame popup positioning
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Merged via PR #184 as `1fda904db5548f53ccdb9628c5f5c6e797f5abaf`.
Baseline: `main@7cbaa7b18d7953c267a8c525eab8ccc6aecb20f1`.

User requirements:
- Runtime components with their own scrollable surfaces should use framework Scroll by default instead of independently exposing native scrollbar chrome.
- Native scrolling remains the browser physics layer and is allowed for intentional hidden/fallback/CSS-only surfaces, but every visible native track/thumb must consume the same Scroll geometry/color tokens.
- Select/DatePicker and other Trigger-based popup panels must be correctly positioned on their first visible frame; no end-of-enter horizontal correction/jump.

Implemented Scroll ownership:
- ItemCollection defaults `scrollAdapter` to `Scroll.attachViewport` unless explicitly opted out with false/null.
- VirtualList defaults to Scroll ownership and exposes `getScroll()`; ItemCollection virtual mode avoids double ownership by explicitly disabling the nested VirtualList adapter before attaching its outer Scroll.
- Menu submenu/overflow popup levels are Scroll-owned.
- Table main viewport and filter-option list are Scroll-owned; sticky/fixed geometry, ScrollVisibility and Virtualizer now use the Scroll viewport instead of the outer Table root.
- Cascader horizontal columns are Scroll-owned.
- DatePicker responsive selection strip and preset strip are Scroll-owned.
- Transfer pagination is Scroll-owned; Transfer's Table projection reuses Table's Scroll instead of introducing a second owner.
- Sort overflow is Scroll-owned through a dedicated shell/viewport/content structure.
- Upload document-preview overflow is Scroll-owned.
- Existing Scroll-owned paths (WheelPanel, Modal body, Select, Autocomplete, TreeSelect and other ItemCollection consumers) remain intact.
- Intentional core/CSS-only/native fallback surfaces such as Layout/Descriptions and hidden Notice viewport physics remain native, with shared visual tokens rather than a second component implementation.

Native fallback parity:
- Added shared `--qxframe9a7c2-scroll-track-size`, track radius and thumb inset tokens.
- Native scrollbar size/radius/thumb inset reference the Scroll tokens instead of duplicating `8px / 999px / 1px`.
- Native track/thumb/hover consume the same Scroll color tokens.
- Intentional hidden native viewports remain hidden.

Popup first-frame regression from user video:
- Frame-by-frame inspection of `PixPin_2026-09-29_19-39-37.mp4` confirmed the DatePicker panel performs an end-of-enter horizontal correction.
- Root cause: Trigger applied popup-placement `scale(.96)` before `runtime.preparePosition()`. Floating UI measured transformed geometry; when motion completed at `scale(1)` and auto-update resumed, full-size geometry produced a visible correction.
- Trigger now keeps the floating surface measurable-but-invisible during first positioning, neutralizes entry motion transform for the first placement measurement, computes full-size coordinates, restores motion transform, then reveals/animates from the already-correct coordinates.
- Placement-specific transform origins keep `bottom-start/end`, `top-start/end`, and side placements anchored to the resolved edge throughout scale motion.
- This is a Trigger-level fix for Select, DatePicker, Dropdown, TreeSelect, Cascader, Menu popup and other anchored popup consumers.

Regression gates:
- `verify:phase-h-carousel-scroll` requires default Scroll ownership for ItemCollection, VirtualList, Menu, Table, Table filter, Cascader, DatePicker, Transfer pagination, Sort and Upload preview, plus shared native geometry tokens.
- `verify:phase-h-trigger-controller-family` requires first-frame visibility gating, transform-neutral full-size placement measurement and placement-specific motion origins.
- Required browser smoke samples visible Select and DatePicker popup left positions over the whole enter sequence and rejects any first-frame/end-of-motion horizontal jump.

Guardrails:
- Scroll remains native-scroll-backed internally; do not replace scrollTop/scrollLeft browser physics.
- Do not introduce per-component scrollbar implementations.
- Pure CSS/fallback surfaces may retain native overflow, but visible chrome must match Scroll exactly.
- Do not disable popup motion to hide positioning defects; preserve animation and fix measurement/order.

Verification:
- PR #184 exact implementation head `cdf6861063c4b241d15fc6511869a69dde0a832c`.
- QXFRAME CI #918 passed Windows tools and the full release pipeline.
- Full release verification passed current Chromium smoke, source ESM/UMD browser verification, high-risk browser verification, subpath verification, and the frozen HOTFIX6 legacy smoke through a narrow runner adaptation for Table's migrated public Scroll viewport.
- Standalone dist + docs demo build passed canonical docs verification and canonical admin browser regression checks.
- Select and DatePicker popup first-frame position regressions are sampled across the complete enter sequence and passed.
- Table Scroll geometry/sticky/fixed/virtual behavior uses the public inner Scroll viewport and passed current + legacy browser verification.
- No popup motion was disabled and no legacy second scroll owner was reintroduced.

Next exact step:
- Run exact-head CI for this checkpoint-only commit, merge PR #184, then verify main CI and Pages deployment.

### ADMIN-VIEW-GRID-REGRESSION-004 — admin responsive Grid ownership regression
Status: VERIFIED
Task progress: 100%
Baseline: `main@d14b4e635eebaa0e6953a700e21433b5a8e6a131`.
PR: #183 merged.

User evidence:
- Multiple complete-admin pages rendered secondary content compressed into a narrow strip with per-character wrapping and horizontal overflow.

Root cause:
- Five views (`profile`, `orders`, `search`, `settings`, `users`) placed a framework `.qxframe9a7c2-row` directly inside another framework Row without a `col-*` owner.
- Because Row is a flex container, the nested Row became an unconstrained flex item and could shrink to content width. This exactly matched the screenshot: the right-side card/list was compressed into a vertical strip while the page gained horizontal overflow.

Implemented:
- Restored canonical `Row -> col-24 -> nested Row` composition in all five affected views.
- Audited all 36 `docs/admin/views/*.html`; these five were the only direct Row-under-Row violations.
- Added `hasDirectRowChildOfRow()` to `verify:admin-template`; every admin view now fails static verification if Row is directly nested under Row.
- Added canonical Chromium geometry regression coverage for the five affected views. It verifies the nested Grid section exists, is not a direct Row child, occupies normal page width, keeps child columns above a sane minimum width, and does not create document-level horizontal overflow.

Guardrails:
- No framework Grid CSS behavior changed; this was malformed admin composition, not a framework Grid defect.
- No admin-only CSS workaround was added.
- PR #182 component coverage and the 112-page canonical publication set remain intact.

Verification evidence:
- PR #183 implementation head `3957c7c045daf9071673d9ed2c8761df69527f92` passed QXFRAME CI #893.
- Final PR head `c268b151db66643a35c2a07dff0ec1e9ea30a265` passed exact-head QXFRAME CI #894.
- PR #183 merged as `d14b4e635eebaa0e6953a700e21433b5a8e6a131`.
- Main QXFRAME CI #895 passed dependency audit, Completion audit, Full release verification, Windows tools, npm pack, standalone dist/docs build, artifact upload and GitHub Pages deployment.
- GitHub Pages deployment for the merge commit completed successfully.

Next exact step:
- Treat this regression as closed. Reopen only if a concrete admin page still reproduces abnormal compression/overflow after Pages serves `d14b4e635eebaa0e6953a700e21433b5a8e6a131`.

### ADMIN-COMPLETE-PRESET-003 — complete admin preset page matrix
Status: VERIFIED
Task progress: 100%
Branch: `docs/admin-complete-preset-003`.
Baseline: `main@4c2a281a12a0fb891aad9bc1d23df5480ce61903` (PR #181 merged; admin interaction polish verified).

User goal:
- Expand `docs/admin` from the existing shell + core pages into a complete preset admin demonstration.
- Use layuiAdmin, TDesign React Starter, Arco Design Pro and Ant Design Pro only as information-architecture/page-breadth references.
- Keep QXFRAME9A7C2 components, tokens, interactions and DOM conventions as the implementation authority.
- Integrate all 66 public framework components and their normal admin-relevant usage families into actual admin scenarios instead of building a second isolated component showcase.

Frozen decisions:
- Preserve PR #179–#181 shell/runtime fixes; do not rebuild Tabs/Menu/Picker behavior locally in admin code.
- Reuse existing dashboard/content list/content form demos instead of duplicating them.
- Keep demo data local/static and dependency-free.
- Low-level primitives such as Trigger/Transition/TransitionGroup appear only in legitimate developer/diagnostic admin scenarios.
- Exhaustive API/state matrices remain in `docs/components/*.html`; the admin preset covers normal public usage families in real application contexts.
- Third-party admin projects are information-architecture references only; no third-party source/assets are copied.

Implemented:
- Expanded shell routes from 14 to 39 and admin views from 11 to 36.
- Added monitor/workplace, products/inventory/customers/marketing/finance, list/form/detail families, notifications/jobs, schedule/workflow/theme/developer tools, account settings, result/failure/403 plus register/register-result presets.
- Added real admin scenarios for the Picker family, selection/tree/transfer/steps/sort/collapse families, theme inputs, diagnostics primitives, business-facing image/tags/modal/drawer/popconfirm/carousel/rate/progress/pagination/OTP families, while retaining existing Menu/Tabs/Dropdown/Autocomplete/Select/Table/Upload/layout/card/badge/avatar/icon/Descriptions coverage.
- Fixed declarative Select initial-value parsing so `value:label` option descriptors project the actual option value instead of the raw descriptor.
- Added `docs/admin/COMPONENT_COVERAGE.md`, mapping all 66 component docs to admin scenarios and implementation markers.
- `verify:admin-template` now derives the 66-component catalog and fails if any component lacks an admin coverage mapping/marker.
- Canonical publication verification now covers 66 component pages, 36 admin views and 112 HTML pages total, including register/register-result.
- Updated the standalone Chromium publication verifier to the 112-page canonical set.

Verification evidence:
- PR #182 head `78a72d2c7bdd1e50325b865f430aaa21fad34315` passed QXFRAME CI run #890 after retrying an unrelated existing iframe-readiness flake.
- Successful gates: Windows tools, dependency security audit, Completion audit, Full release verification, npm package, standalone dist/docs demo build and artifact uploads.
- The earlier exact-head run also passed Full release verification; its only failure was the stale standalone canonical browser count (66/11/85), which was corrected to 66/36/112 before CI #890 passed.

Next exact step:
- Run exact-head CI for this checkpoint commit; when green, merge PR #182 and verify the resulting main CI plus GitHub Pages deployment.

### ADMIN-INTERACTION-POLISH-002 — popup-field opening, admin Tabs focus, native focus precedence, SelectGroup stacking, flex layout and collapsed Menu
Status: VERIFIED
Task progress: 100%
Branch: `fix/admin-interaction-polish-002`.
Baseline: `main@e49a8f8f95396938cfce246515d8f80c354332b6` (PR #180 merge; main CI #871 + Pages green).

User-reported scope:
- Opening the content-add Cascader must preserve its committed category until the user actually selects/clears a value.
- Searchable Select with an existing value must open normally without requiring the user to clear the value first.
- Admin canonical Tabs must preserve keyboard focus across keyboard activation and tab removal instead of losing focus when shell state synchronizes.
- Plain native input/textarea/select focus border must take precedence over hover while focused.
- Checked SelectGroup radio/checkbox items must stack above adjacent unselected items so connected borders paint correctly.
- Remove remaining admin structural layout abstractions `qx-admin-view-page`, `qx-admin-view-head`, and `qx-admin-search-hero`; use canonical framework row/col composition (Layout remains the page shell owner).
- Correct collapsed inline Menu geometry/alignment and eliminate the horizontal overflow visible in the admin sidebar screenshot.

Frozen decisions:
- Do not reopen completed Controller migration or PR #180 work.
- Fix shared picker/control/Menu/SelectGroup/native-control defects in framework source; do not mask them with admin-only CSS/JS.
- Admin Tabs already consume `Components.Tabs`; shell synchronization must not reconstruct tab DOM on ordinary keyboard activation/close if the item model did not change.
- Browser-visible regressions get Chromium coverage; structural admin layout rules get static verification.

Current evidence / suspected owners:
- `docs/admin-form-static.html` mounts searchable Select value `topic` and Cascader value `season`, both `clearable:true`.
- Control currently shows the clear action on hover/focus and lets it replace the picker toggle; this can move the pointer hit target from the toggle to clear before the primary click.
- Searchable Select open starts an empty draft while preserving committed value; Cascader open seeds from committed selection, so committed-value loss is not intended picker transaction behavior.
- Admin `syncTabs()` currently calls `tabsOwner.setItems(...)` on every activation, which can rebuild the tab strip and detach the focused keyboard tab.
- SelectGroup raises only `:focus-within`; checked connected siblings have no higher stacking context.
- Remaining admin view CSS still defines the three custom structural classes named above.

Implemented evidence:
- Control default no longer replaces the popup toggle with clear; CSS now lets both render together, keeping the toggle hit target stable while clear appears.
- Admin Tabs synchronize item collections only when tabs actually change, preserving the canonical Tabs keyboard focus path during activation/removal.
- Native text-control hover excludes :focus; checked SelectGroup items now stack above connected peers; collapsed inline Menu is constrained to its host and hides group headings.
- All 11 admin views removed qx-admin-view-page / qx-admin-view-head / qx-admin-search-hero structural wrappers in favor of framework row/col composition.
- Static and Chromium gates cover popup committed values, tab keyboard focus/removal, collapsed Menu fit/alignment and SelectGroup stacking.
- PR #181 is open from this branch; exact-head CI #886 passed on `5cb65005b9b6107b7a3213710f9bf594e009efc9`.

Next exact step:
- Run exact-head CI for this VERIFIED checkpoint commit; if green, merge PR #181 and verify main CI + GitHub Pages deployment.

### ADMIN-FRAMEWORK-POLISH-001 — admin shell convergence + shared Table/Card/native-control CSS polish
Status: VERIFIED
Task progress: 100%
Branch: `fix/admin-framework-polish-001`.
Baseline: `main@ebb827b47c5797021fc055242647d487bea09326` (PR #179 merge).

User-reported scope:
- Close the global Autocomplete popup when the user interacts inside an admin iframe.
- Replace the hand-authored admin multi-tab strip with the canonical Tabs component so sizing, scrolling/ResponsiveOverflow and overflow-list behavior come from the framework.
- Correct Table fixed-header stacking and make fixed-column boundary shadows depend on real horizontal scroll reachability instead of always painting.
- Give plain native text input/textarea/select elements the canonical Control visual contract in framework CSS without overriding checkbox/radio/range/file or framework-owned internals.
- Synchronize Card header/footer corner radii with the Card surface radius while preserving `overflow: visible`.
- Remove the redundant `qx-admin-view-grid` layout abstraction and compose those admin view layouts with the framework's responsive row/column CSS.

Frozen decisions:
- Do not reopen the completed Controller migration or unrelated component audits.
- Shared visual defects are fixed in `src/qxframe9a7c2.css`; admin-only behavior remains in admin shell/assets.
- Admin tabs must consume `Components.Tabs`; do not create a second overflow/scroll implementation.
- Table shadow visibility is runtime geometry state, while actual shadow paint remains CSS-owned.
- Card remains non-clipping; corner-radius ownership is on header/footer backgrounds, not `overflow:hidden`.

Implemented in branch:
- Admin multi-tab strip now consumes canonical `Tabs` with framework Scroll/ResponsiveOverflow instead of `.qx-admin-tab`.
- Admin iframe pointer/focus interaction closes the global Autocomplete popup.
- Table projects horizontal overflow/reachability classes; fixed-boundary shadows now follow actual scroll geometry; fixed header z-order is raised above ordinary headers.
- Native text input/textarea/select receive the Control visual recipe in framework CSS while specialized/framework-owned inputs remain excluded.
- Card header/footer backgrounds inherit synchronized inner corner radii without clipping the Card root.
- `qx-admin-view-grid` removed from the admin views that used it; layouts now use framework responsive row/column classes.
- Structural + Chromium regression gates extended for these exact cases.

Verification evidence:
- PR #180 CI #867 correctly rejected the first native-control outline selector; it was tightened to keyboard-origin + `:focus-visible`.
- CI #868 passed full release verification and confirmed the core browser behaviors, exposing the remaining fixed-header specificity and Card probe issues.
- CI #869 is green: Windows tools, full release verification, npm pack, standalone dist/docs build, and 85-page Chromium all passed.
- Chromium #869 explicitly reported: admin canonical Tabs mounted; overflow list visible; tab font-size 14px; global search opened and closed from iframe interaction; Table no-overflow shadow hidden; horizontal-overflow state true; start shadow appears after scrolling; fixed header stacks above ordinary header; native control styling applied; Card corner radius synchronized.
- The release artifact contains the generated dist CSS/JS with the Table/native-control changes. `dist/` is generated and is not tracked in the repository tree.

Completion evidence:
- PR #180 merged to main as `e49a8f8f95396938cfce246515d8f80c354332b6`; main CI #871 and GitHub Pages deployment passed.


### DOCS-ADMIN-CLOSEOUT-001 — API manual/demo parity + complete iframe admin template
Status: VERIFIED
Task progress: 100%
Branch: `docs/api-admin-closeout-001`.
Baseline: current `main` after PR #178.

User goal:
- Finish the user-facing API / METHOD / PARAMS manual and keep it synchronized with the canonical component demos/runtime.
- Build a complete QXFRAME admin UI template comparable in breadth and shell behavior to a mature iframe-style admin theme, while using QXFRAME's own components/CSS and not copying third-party source.
- Keep the already verified framework runtime behavior unchanged unless a documentation-only integration exposes a concrete regression.

Frozen implementation decisions:
- Do not restart Controller/component interaction audits; the framework behavior closeout remains verified.
- The 66 component HTML pages remain thin shells; API/manual improvements belong in shared docs assets and verification tooling.
- Existing `docs/admin-dashboard-static.html`, `docs/admin-list-static.html`, and `docs/admin-form-static.html` remain standalone composition demos and become embeddable views for the new admin shell rather than being replaced.
- The complete admin template gets a dedicated iframe/multi-tab host under `docs/admin/`, with shared shell assets, route/tab lifecycle, theme propagation and responsive sidebar behavior.
- Third-party layuiAdmin material is reference-only for information architecture and interaction breadth; do not copy proprietary source/assets.

Planned batches:
1. Docs contract parity: remove stale v2.19.79 labels, expose Params/Props + Methods + Events/Callbacks clearly, add package-version/API-coverage verification, and link the admin template from docs navigation.
2. Admin shell: iframe multi-tab host, collapsible sidebar, route/hash restore, tab close controls, refresh/theme/user actions and embedded-view bridge.
3. Admin view matrix: dashboard/list/form plus representative user/role/settings/profile/search/result/auth/error pages using QXFRAME primitives.
4. Exact-head CI, PR, merge and main Pages verification.

Implemented:
- Shared component docs now expose the package-aligned v2.19.81 version instead of stale v2.19.79 chrome.
- All 66 thin component pages continue to share one API data source and one renderer; the renderer now presents Props/Params, Methods with extracted parameter lists/return values, and Events/Callbacks with one searchable reference surface.
- Added `verify:docs-api` to assert package/docs version parity, all 66 catalog/page/API links, expanded docs API coverage against the generated runtime contracts, and shared renderer/navigation markers.
- Added `docs/admin/index.html` as the complete multi-iframe admin host with retained tab state, hash routing, tab restore/close controls, refresh/fullscreen/theme actions, responsive/collapsible navigation and child-to-parent route bridging.
- Existing dashboard/list/form composition demos remain standalone and also support `?embed=1` inside the complete shell.
- Added real admin pages for orders, users, roles/permissions, media, global search, operation logs, settings, profile, result, 404, 500 and login.
- Added `verify:admin-template` plus canonical-doc expansion; complete admin pages are now CI-governed publication surfaces.
- Branch diff is docs/tools/package/checkpoint only; no `src/` or `dist/` framework runtime file changed.

Next exact step:
- PR #179 exact-head CI #864 passed Windows tools, dependency audit, Completion audit, Full release verification, npm pack, standalone dist/docs build, and the 85-page canonical Chromium browser gate.
- The API manual now merges all 2,326 canonical runtime parameter rows into the rich manual without overwriting existing curated descriptions; final API data contains 2,835 parameter rows and 310 event/callback rows with zero generated-contract omissions.
- The complete admin template browser-smoke passed after fixing Dropdown action items to satisfy the canonical value contract.
- Merge PR #179 to main, then verify main push CI and GitHub Pages deployment.

Next exact step:
- Merge PR #179, verify the resulting main CI/Pages deployment, then treat this closeout task as complete.

### THEME-PLAYGROUND-REVIEW-824-854 — merged-change manual review annotations
Status: VERIFIED
Task progress: 100%
Baseline: `main@8cbec279e3171fda7ab1633f59522d5ce694da1a` / successful main CI #854.
Branch: `docs/theme-playground-review-824-854`.

User goal:
- Mark every user-reviewable change merged to main across QXFRAME CI #824 through #854 directly in `docs/theme-playground.html`.
- Make runtime/style changes visibly distinct from demo-only pressure coverage.
- Provide PR/CI provenance so manual regressions can be reported against an exact batch.

Resolved merge window:
- CI #824 / PR #170: checkpoint-only state finalization; no runtime/UI change.
- CI #830 / PR #171: Table + Result runtime fixes and transition demos.
- CI #834 / PR #172: TransitionGroup child MotionCore leave cleanup plus Upload/Transfer/ColorPicker/List/Message/Notification/Modal pressure demos.
- CI #841 / PR #173: Modal/Drawer/List/Transfer state-transition demos; verifier timing/budget hardening only, no component runtime change.
- CI #846 / PR #174: Table falsy filter-action rendering + shared Input/Select family control-height ownership; responsive/filter geometry demos.
- CI #850 / PR #175: Collapse shared family-height ownership + Select/Cascader/TreeSelect popupRender primitive/array demos.
- CI #854 / PR #176: InputOTP real canonical-focus reconciliation + ColorPanel mutation-lock gesture cancellation; ColorPicker/InputOTP/Carousel demos.

Additional manual-review defect found:
- PR #176's `Mutation lock cancels active gesture` canonical demo is currently unreachable because it was accidentally placed after `return out` inside `wheelItems()`, outside `mountColorPicker`.
- Runtime ColorPanel fix and Chromium regression are valid, but the Theme Playground cannot currently show that manual demo.
- Move the demo back into `mountColorPicker` as part of this review-surface repair.

Implementation plan:
1. Add an 824–854 review manifest, top summary, legend and component-level annotations directly from `theme-playground.html`.
2. Add per-demo badges for every canonical demo introduced in PR #171–#176.
3. Distinguish RUNTIME / CSS OWNER / NEW DEMO / TEST INFRA.
4. Relocate the unreachable ColorPicker mutation-lock demo into `mountColorPicker`.
5. Run exact-head CI, merge, then verify main Pages deployment.

Implemented:
- `docs/theme-playground.html` now contains an explicit CI #824–#854 review manifest.
- Top review panel lists CI #824/#830/#834/#841/#846/#850/#854 with PR links, main merge SHAs, batch summaries and affected component anchors.
- Component cards are marked separately as RUNTIME / CSS OWNER / NEW DEMO / TEST INFRA / STATE ONLY / REVIEW FIX.
- Each affected card gets a concise manual-review note with PR/CI provenance and the exact behavior to re-test.
- Every canonical demo added during PR #171–#176 is tagged `824–854 NEW/CHANGED` when rendered.
- Added a docs-only “只看 #824–#854 修改组件” switch; existing search/category filters remain independent.
- CI #824 / PR #170 is explicitly shown as state-only, preventing false UI regression attribution.
- Fixed the PR #176 manual-review surface: `Mutation lock cancels active gesture` was unreachable after `return out` inside `wheelItems()`; it now mounts inside `mountColorPicker` while `wheelItems()` is restored to a pure helper.
- No framework runtime behavior was changed by the annotation work.

Verification:
- PR #177 exact-head CI #855 passed Windows tools, dependency audit, Completion audit, Full release verification including Theme Playground/browser smoke, package/build and artifact checks.
- PR #177 merged to main as `8bf7a6a179b7f8f0e9e8227ada35501be9dfe8f1`.
- Main push CI #856 passed Windows tools, dependency audit, Completion audit, Full release verification, npm pack, standalone dist/docs build, artifact uploads and GitHub Pages deployment.
- `docs/theme-playground.html` now exposes the complete CI #824–#854 manual-review surface on Pages.
- ColorPicker `Mutation lock cancels active gesture` canonical demo is restored to the actual ColorPicker mount and is manually reviewable.
- No framework runtime change was introduced by the annotation layer.

Next exact step:
- User manually reviews the marked Theme Playground cards/demos and reports only concrete regressions against main `8bf7a6a179b7f8f0e9e8227ada35501be9dfe8f1` or newer.



## PREVIOUS VERIFIED HANDOFF

### THEME-PLAYGROUND-REGRESSION-001 — user-driven keyboard/focus interaction closeout
Status: VERIFIED
Task progress: 100% for the reported batch
User verification surface: `docs/theme-playground.html`.
Current verified main after runtime fixes + browser regression coverage: `bc3e8818f60ea5bb86d526b9fefccdcb9953be4a`.

Merged runtime fixes:
- PR #152 — TreeSelect `maxCount` projects capacity into check-only disabled capability. At capacity, unchecked choices that would exceed the limit visibly disable their checkbox/check intent while already-selected choices remain removable; parent disclosure/navigation/search remain available. Pages Max count demo text documents the behavior.
- PR #155 — InputOTP keyboard ArrowRight cannot bypass the canonical first-empty slot. Pointer and keyboard now share the same sequential-fill constraint while completed OTPs remain editable.
- PR #157 — Picker keyboard/focus closeout:
  - DatePicker default open region remains the day/date virtual region.
  - DatePicker Tab cycle is presets → active year → active month → date virtual region → cancel → confirm, so Shift+Tab from the default date region reaches month then year.
  - Dual-panel DatePicker horizontal navigation crosses the visual seam geometrically on the same rendered row in both directions instead of waiting for calendar month rollover.
  - ColorPicker with `needConfirm:false` commits current dirty/preview value and closes on Enter; confirm mode remains explicit.
  - Dropdown item and Picker/Wheel virtual-focus outlines stay 2px but move an extra pixel inward inside clipped scroll viewports so Chromium does not trim the outer edge.
- PR #158 — Menu interaction closeout:
  - horizontal root entries use stable intrinsic width so ResponsiveOverflow moves real items into the More submenu instead of flex-shrinking them while the More panel stays empty;
  - collapsed inline root leaves use framework Tooltip for labels;
  - collapsed items with children retain submenu Trigger ownership rather than receiving competing tooltip behavior/native title.
- PR #159 — Carousel keyboard/focus ownership:
  - root, arrows and dots are not Tab stops;
  - the active slide outer is the Carousel-level Tab owner;
  - focusable descendants are available only on the active slide;
  - direction keys remain Carousel-owned from both the active slide outer and interactive descendants;
  - keyboard slide changes transfer real focus to the new active slide;
  - the active-slide focus ring is inset to avoid viewport clipping.
- PR #160 — Image preview closeout:
  - component-specific fade states make preview mask opacity visibly animate despite the steady mask-opacity rule;
  - preview chrome remembers the focused action across media rerenders and restores focus to the equivalent replacement action, so ImageGroup Left/Right navigation continues after the first switch.
- PR #156 — shared Theme Playground focus/keyboard closeout:
  - Slider pointer-origin focus no longer shows the keyboard-only outline;
  - List `hideSelected` reconciles canonical active item after the selected row disappears, allowing immediate repeated Enter selection;
  - JSON first real focus synchronizes Tree activeKey + VirtualFocus so the first directional key works;
  - Modal / Drawer body Scroll is not a Tab stop, removing the invisible focus stop after close;
  - TimePanel/WheelPanel internal Scroll roots remain `tabIndex=-1`; TimePanel outer composite is the sole Tab owner;
  - Tabs keyboard/Backspace removal prefers the previous enabled tab and restores real focus after the removed DOM disappears;
  - Collapse supports Tree-style ArrowRight=open and ArrowLeft=close in addition to Enter/Space.
  Exact integrated head `7d2de0d198556fdf5e2027f09799f4afc51177cf` passed QXFRAME CI #784. The prior head timed out with no failed browser assertions; the integrated rerun passed Full release verification without extending the global browser timeout.
- PR #161 — real browser regression layer for PRs #158–#160:
  - horizontal Menu must move real items into a non-empty More panel;
  - collapsed Menu leaf Tooltip vs submenu ownership is exercised in Chromium;
  - Carousel direction keys are exercised from both slide outer and inner button after motion completes;
  - Image preview Right → Left repeated navigation must keep focus on rebuilt equivalent chrome action.
  First CI #786 exposed a test-timing false positive because the second Carousel key was sent during `waitForAnimate:true`; the test now waits for the first motion. Exact final head `eb81676e9c3f7874916b22d7d892e757c16b39fb` passed QXFRAME CI #787.

Deployment evidence:
- Runtime-complete main `6fe10afaa6f62b8438de71fd57a1cdf21467fca0` passed push QXFRAME CI #785.
- CI #785 `deploy-pages` completed successfully, so GitHub Pages serves the runtime fixes from this batch.
- PR #161 is test-only; it does not alter runtime/CSS/demo behavior.

User-reported batch disposition:
- TreeSelect Max count disabled projection: closed.
- Slider pointer outline: closed.
- InputOTP keyboard bypass of sequential-focus/fill limit: closed.
- Dropdown / PickerList clipped keyboard outline: closed via inward focus-ring offset.
- DatePicker Tab order and dual-panel same-row horizontal seam: closed.
- ColorPicker immediate-mode Enter commit/close: closed.
- Menu collapsed submenu/Tooltip behavior and Horizontal+Overflow empty panel: closed.
- Tabs focus after keyboard deletion: closed.
- List Search+Multiple+Groups second Enter after hideSelected active-row reconciliation: closed.
- TimePanel internal column Tab stops: closed.
- Modal / Drawer invisible Scroll Tab stop: closed.
- Collapse Left/Right disclosure: closed.
- Carousel focus model and directional navigation from active-slide content: closed.
- Image preview mask fade and repeated ImageGroup keyboard navigation: closed.
- JSON first-focus active-key mismatch: closed.


### HANDOFF-READY-007 — Ant interaction audit final closeout
Status: VERIFIED
Task progress: 100%
Repository state: PR #137 merged to `main` at `0503df0be2f175a3d6039a1425cc899bd7d7a23e`.
Closed interaction findings:
- Slider `step:null` keyboard navigation traverses the ordered discrete points `min + marks + max` instead of adding 1 and snapping back to the same mark.
- Slider public contract and frozen generated API now consistently allow `number|null` for `step`.
- Tabs overflow selection arms focus restoration before active-key changes can schedule responsive overflow measurement, eliminating the race that intermittently left focus inside the closing overflow popup.
Verification:
- Exact PR head `078d79e24018ab6266665e2c7722029c08605cf9` passed QXFRAME CI #682, including Windows tooling, full release verification, Chromium regressions, npm packing, and standalone dist/docs build.
- CI #679 on the prior integrated Slider head intentionally blocked merge by exposing the intermittent Tabs focus-return race; the test remained strict and the component ordering was fixed rather than extending sleeps.
Audit disposition:
- Current Ant Design interaction comparison is complete for the maintained QXFRAME component surface reviewed in this pass.
- TreeSelect `maxCount` dynamic visual disabling remains a documented parity/design gap, not an unresolved selection correctness bug: QX enforces the limit through canonical `beforeCheck`, while a safe disabled projection must not alter hierarchical checked/half-checked semantics.
- Ant-only additions such as Steps `maxCount`, Table grouped headers, Drawer resizable, and InputNumber modifier stepping remain optional enhancements.
Next exact step: perform user-driven browser/manual verification or a later independent Astra audit; do not reopen the closed findings without new reproduction evidence.

## PREVIOUS VERIFIED HANDOFF

### HANDOFF-READY-006 — Ant interaction audit round 3 closeout
Status: VERIFIED
Task progress: 100%
Repository state: PR #134 merged to `main` at `8a8fcfcc54885a00823f811dc3fe74accfd3e7f0`.
Closed interaction findings:
- Modal now honors validated `closable.onClose` on accepted close paths instead of accepting the option and silently dropping the callback.
- Carousel default arrow glyphs follow horizontal/vertical orientation, and runtime direction changes cannot leave PointerSession locked to the creation-time drag axis.
- InputOTP custom string masks now project through the existing Control Segments mask layer instead of being collapsed into native password masking.
Verification:
- Exact integrated PR head `5ba97c45d37ff8b132b1f7e4fc3ea5f31e55414c` passed QXFRAME CI #673, including full release verification and Windows tooling.
- PR #134 was rebased onto main after PR #133 WheelPanel downstream-selection preservation merged, so the green gate covered the integrated state.
Audit disposition:
- TreeSelect `maxCount` visual disabling remains a design/parity gap, not a safe standalone bug fix: naïve dynamic disabled projection can change hierarchical checked/half-checked normalization. Existing `beforeCheck` enforcement remains canonical until a projection-layer design preserves checkedStrategy/checkStrictly/disabled-node semantics.
- Ant-only feature additions such as Steps maxCount, Table group headers, Drawer resizable and InputNumber modifier stepping are enhancements, not current QXFRAME interaction bugs.
Next exact step: finish the remaining Ant Design interaction comparison; only open another fix when a reproducible QXFRAME behavior bug is confirmed.

### HANDOFF-READY-005 — WheelPanel interaction fix merged
Status: VERIFIED
Task progress: 100%
Repository state: PR #133 merged to `main` at `2ca016d08b72a6d2302f4a39a06bc8fe25f77d05`.
Finding closed: WheelPanel `selectIndex` had cleared every downstream value on upstream selection. TimePanel/TimePicker lost minutes and seconds when hours changed; independent WheelPicker columns also reset.
Outcome: `src/components/wheel-panel.js` preserves downstream candidate values while `rebuildFrom` revalidates each column. Browser regressions in `tools/verify-browser-smoke.html` cover TimePanel pointer, TimePicker keyboard, independent WheelPicker columns, and dependent column retention/fallback.
Verification: exact PR head `17fdee81c3ad12ebde57abf40376d2461dcc5bf0` passed QXFRAME CI #665, including full release verification and Windows tooling. Local syntax and diff checks passed; local build lacked a Rollup provider.
Next exact step: continue the Ant Design interaction comparison across remaining component families, without reopening this fixed WheelPanel finding absent new regression evidence.

### HANDOFF-READY-004 — post Ant interaction audit round 2 closeout
Status: VERIFIED
Task progress: 100%
Repository state:
- PR #132 merged to `main` at `7013c439a0e9fe1bc407420c852be21ffa58e4c2`.
- Final PR head `06fb534675e105b890446feae8de2fa20ad6beaa` passed QXFRAME CI #662.
Closed interaction findings:
- DatePicker complete ordered range hover/click/keyboard now share one canonical range projection; focusing the end segment cannot change hover semantics away from the current-end anchor.
- Cascader keyboard Enter routes parent activation through the same `activateAt` path as pointer activation, so `changeOnSelect:true` updates the parent value before entering the child column.
- Tabs overflow has keyboard navigation and returns focus only after responsive overflow layout completes; it never focuses a hidden main-tab element.
- Upload `maxCount:1` keeps the trigger available so selecting another file can replace the current file.
- Pagination quick jumper uses conventional numeric direction: ArrowUp increments and ArrowDown decrements.
Verification:
- New Chromium behavior regressions cover all five findings.
- Existing source-ESM browser fixture was updated for the corrected Pagination direction.
- Full release verification and Windows tooling passed on exact PR head before merge.
Next exact step:
1. Query current `main`, open PRs and latest CI before any new task.
2. Continue the Ant Design horizontal interaction audit from the remaining component families; do not reopen these five findings unless new evidence shows a regression.
3. Keep this file current after each merged fix.

## Current authority snapshot — after Phase A

This section is current-state truth. Do not treat earlier Phase A gap findings as still active if they conflict with this snapshot.

- Action/event metadata: `ActionContext` and structured `OperationResult` exist above existing `InteractionDetails`, `OpenStateBridge` and logical events.
- Value ownership: `ValueController` is the sole canonical committed/draft/preview/rawInput/session/revision authority. `ValueDraft` and `StateController` compatibility aliases are removed; `ControllableStateCore` owns controlled/external-vs-internal and pending-request metadata only. DatePicker / TimePicker / ColorPicker / WheelPicker declare ValueController ownership directly. There is no second committed value.
- Logical ownership: `LogicalOwnership` remains node/parent-child authority; `LogicalOwnerTree` exists as the shared facade/registry layer.
- Focus/navigation: `FocusController` is the aggregate entry point over `FocusManager`, `FocusScope`, `KeyboardRegion` and `KeyboardNavigation` virtual focus. WheelPanel / TimePanel / Calendar / PeriodPanel / Select / TreeSelect / Cascader / Menu / Tags / Table enter through it. Underlying ActiveItem/RovingProjection/domain state remains the execution truth. Handbook Phase C Focus scope is accepted.
- Interaction/capability: `InteractionController` is the semantic key/action + logical scope routing entry and `KeyboardNavigation` consumes its resolver; `CapabilityController` is the component-facing entry over `InteractionPolicy`. Handbook Phase C priority owners are accepted through PR #56 and #58–#61, including Date/Time composites, Menu, Select, TreeSelect, Cascader, Tags and Table.
- Overlay/open: `OverlayController` is now the resource facade over existing `OverlayRuntime` / `LayerManager` / `DismissableLayer` execution authorities; `OpenStateBridge` remains logical open authority. Trigger is the first representative consumer. OverlayController must not become a second public open-state owner.
- Form: `FormBridge` remains native field/FormData/reset carrier authority. `FormController` is the accepted Phase G field/form transaction coordinator above it; Phase H public field/form consumers are migrated and H accepted without duplicating carrier/value ownership.
- Theme/token: Phase F is accepted. CSS is the sole visual authority; ComponentProfile exposes exactly 9 Runtime Controllers and no theme/tokens runtime capabilities. CI recursively rejects ThemeController/TokenController/ThemeRuntime/TokenRuntime and JS projection/reading of the canonical CSS theme selector.
- Selection/data: `SelectionController` is the accepted Phase D facade over canonical Selection/HierarchicalSelection execution stores. ItemCollection/List/OptionList/Tree, Transfer, Table, Tags, Select/TreeSelect/Cascader enter through it; Table remote allMatching is semantic rather than materialized page keys. `ActiveItem`/component navigation remains activeKey authority and public value remains ValueController-owned where applicable.
- Projection/scheduling: shared `ProjectionScheduler` exists over `Scheduler`, but it is intentionally not inserted into synchronous `DOMProjection` / `RovingProjection` paths until it can replace a real stale/async projection owner.
- Motion: `MotionController` is the accepted intent facade over canonical `MotionCore`; `Transition` and `TransitionGroup` enter through it while MotionCore remains generation/timing/style authority. Collapse rapid reversal is fixed by stable DOM projection before motion, with no parallel generation or component timer.
- Environment: `ObserverHub` now delegates Resize/Mutation/Intersection/media environment resolution to shared `EnvironmentPort`; additional ad-hoc environment consumers migrate only when their owning Controller/family is touched.
- Diagnostics: semantic `Diagnostics` with stable codes is injectable; `Collection` reports duplicate stable keys observationally when a sink is supplied. Further diagnostics adoption occurs with the owning Controller.
- Component capability declaration: `Component` and `ComponentRuntime` now carry validated immutable `ComponentProfile` metadata; concrete profiles are authored as each family migrates, with no runtime component-name inference.
- Input modality / focus origin: `InteractionModality` remains the raw device-context authority and exposes touch/programmatic modalities plus the `InputModality` alias; `FocusOrigin` is the Shared Protocol authority for real DOM focus origin; `KeyboardNavigation` / VirtualFocus owns virtual-navigation modality.
- Shared Protocol verification covers the canonical foundation and Collection/ValueController integration; removed ValueDraft/StateController aliases must not reappear.

## ACTIVE KNOWN ISSUES — NOT DONE

No known controller-migration implementation blocker remains in the maintained 40-component public surface. Broad final architecture/internal-target/security/release audit is intentionally reserved for GPT-6 Astra High and may still produce follow-up findings before final acceptance.

## DONE / VERIFIED EXISTING

### WHEEL-PANEL-DOWNSTREAM-PRESERVE-001 — valid downstream values retained
Status: DONE_MERGED_VERIFIED
Evidence: PR #133 merged at `2ca016d08b72a6d2302f4a39a06bc8fe25f77d05`; exact head passed QXFRAME CI #665.

### ANT-INTERACTION-AUDIT-ROUND2-001 — five cross-component interaction fixes
Status: DONE_MERGED_VERIFIED
Evidence:
- PR #132 merged at `7013c439a0e9fe1bc407420c852be21ffa58e4c2`.
- Exact PR head `06fb534675e105b890446feae8de2fa20ad6beaa` passed QXFRAME CI #662.
Outcome:
- DatePicker preview/selection range projection unified.
- Cascader `changeOnSelect` keyboard/pointer activation unified.
- Tabs overflow keyboard navigation and post-layout focus return fixed.
- Upload `maxCount:1` replacement trigger preserved.
- Pagination jumper ArrowUp/ArrowDown direction corrected.
- Chromium regression coverage added for all five behaviors.


### DATEPICKER-RANGE-REPLACE-001 — end-anchored complete-range replacement
Status: DONE
Evidence:
- PR #131 merged at `f586bb3e01a76e624219d3b3a61314164f90c70a`.
- CI #652 passed on implementation/test head; CI #653 passed on final PR head.
Outcome:
- Complete ordered ranges now preserve two endpoints immediately after selection.
- Clicking before the current end makes the clicked date the new start and preserves the current end.
- Clicking on/after the current end promotes the previous end to start and makes the clicked date the new end.
- The superseded transient unsorted-slot/commit-reorder path was removed; range normalization is single-path again.
- Current and legacy browser regression fixtures, plus release-preflight approved-difference normalization, encode the same interaction.


### DATEPICKER-RANGE-EDIT-PREVIEW-001 — ordered active-endpoint hover preview
Status: DONE
Evidence:
- PR #130 merged at `74559789ea0a9616f8a5909e7f0db9af9257356b`.
- QXFRAME CI #637 passed on implementation head; CI #638 passed on final PR head.
Outcome:
- active range hover preview now projects exactly two visual endpoints and follows `order:true` role swapping across the fixed anchor.
- browser regression covers editing both start and end across the opposite endpoint.


### UX-CLOSEOUT-001 — Picker projection + range controls + component surface regressions
Status: DONE
Task progress: 100%
Evidence:
- PR #122 is the atomic implementation vehicle; GitHub PR / Actions facts remain authoritative for merge and CI state.
Outcome:
- Picker controls stay on one committed-seeded grey draft projection while open; hover preview replaces that projection in-place and falls back to the seeded draft on leave.
- DatePicker range supports single-input, dual-Control and Segments dual-input control forms.
- Autocomplete defaults to input-first suggestions with optional openOnFocus.
- Notification has one shadow-gutter owner and a non-clipping outer stack.
- Table removes empty title/toolbar/footer shells, the permanent right scrollbar gutter and inappropriate header corner seams.
- Image preview remains operable after source-load failure, and the canonical demo no longer relies on a broken remote image.


### SELF-AUDIT-FOLLOWUP-001 — FocusOrigin handoff + ItemCollection empty-focus edge
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Evidence:
- PR #119 merged.
- PR exact head `ce1446f40e73d7cb2b02f7c12dd5b5a564455201`; CI run #599: release success, Windows tooling success.
- merged main `18830d387a60b53c76c97e54e2ac9cf6700c7baa`; CI run #600: release success, Windows tooling success, Pages success.
Outcome:
- related ancestor/descendant pointer focus handoff preserves pointer intent through the ensuing real-focus transition.
- empty ItemCollection `focusFirst()` / `focusLast()` no longer steals focus or reports success.
- same-active-item API refocus remains covered and working.

### FINAL-AUDIT-FOCUS-ORIGIN-001 — final audit remediation + Focus Origin unification
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Evidence:
- PR #118 merged.
- merge commit `9ecc4dc658fe9319a9febb5e946a1219c525d110`.
- merged-main run #597: release success, Windows tooling success, Pages success.
Outcome:
- A01/A02, B01/B03, A04-A11 and D01/D02 final-audit remediation landed.
- FocusOrigin is Shared Protocol infrastructure rather than a 10th Runtime Controller.
- managed focus, async/form lifecycle, runtime cleanup, Windows tool paths, release and legacy browser regressions are required gates.


### POST-AUDIT-CORE-INTEGRITY-PERF-003 — shared state integrity + hotpath cleanup
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Scope:
- Fix confirmed ValueController integrity defects: duplicate normalization, copied reset baseline, public mutable-reference leakage, and stale callback reentrancy events.
- Fix TimePanel/WheelPanel canonicalization so visual wheel selection and parent value cannot diverge.
- Remove redundant TimePanel refresh/rebuild work and share pure selectable-time canonicalization across TimePanel/TimePicker/DatePicker without changing wheel/keyboard behavior.
- Decouple Control visual projection from committed FormBridge synchronization and collapse duplicate FormBridge sync operations.
- Remove Tree applyOptions duplicate rows/list refresh work.
- Avoid ItemCollection O(N) row-state refresh on pointermove when hover row did not change.
- Optimize Scroll snap geometry reads without changing snap semantics.
Risk policy:
- Preserve synchronous public API semantics; do not replace immediate projection with requestAnimationFrame/debounce.
- Do not change commit/draft behavior from PR #115.
- Do not merge an optimization that changes visible interaction unless it fixes a confirmed bug.
- WheelPanel same-value hard no-op and VirtualList keyed DOM reuse are deliberately deferred: both alter refresh/DOM lifecycle contracts and need a separate invalidation/reconciliation design before implementation.
Baseline:
- base main: `02060d0385dc7f85598361b4b483f8862b2d950e`
- last code-affecting main: `18a276417a2331b889d3994931f3effb82d9facd`
- latest verified main CI + Pages: #574 / `36204351824` success
- open PRs at task start: none
Implementation evidence:
- ValueController normalizes once per write, owns a copied normalized reset baseline, isolates public mutable reads, and rejects stale outer publication after callback reentrancy.
- TimePanel exposes one pure normalizeAvailable rule; TimePicker and DatePicker(time) use the same rule so canonical value, visual wheel selection and FormData start aligned.
- DatePicker/TimePanel duplicate refresh chains were removed.
- WheelPicker form reset re-normalizes its baseline against current columns before re-publishing committed/FormData.
- ColorPicker keeps mode/value invariant for draft writes and separates user-session mode from final external option rebases; reset baseline follows final mode/format configuration.
- Control caches FormBridge option/value projection so visual-only syncView calls do not recreate hidden form fields.
- Tree options, ItemCollection pointermove and Scroll snap geometry hotpaths remove confirmed duplicate/O(N) work without changing public timing semantics.
- Deliberately not implemented: WheelPanel same-value unconditional no-op; VirtualList keyed reuse.
Verification added:
- tools/verify-value-controller.mjs
- tools/verify-core-hotpaths.mjs
- tools/verify-browser-smoke.html
CI evidence:
- PR #116 run #575 / `36212460277` attempt 1 reached core checks but Chrome CDP startup timed out in the existing phase-d Table browser harness (infrastructure failure).
- PR #116 run #575 attempt 2 started Chrome and passed phase-d Table, then exposed a real ValueController boundary regression in phase-d Tags: optional `previousPreviewValue=undefined` was incorrectly sent through TokenInput's array-only copyValue adapter.
- fix commit `2008ce5b8fb53e28f2498c0a4ecc4303c44b1b82`: optional undefined event metadata bypasses the value copy adapter; domain values remain copied at public boundaries. Added a strict array-copy adapter regression.
- PR #116 final exact-head CI #576 / `36212774177`: success, including Full release verification, strict Chromium regressions, npm pack, standalone dist/docs, and artifacts.
- PR #116 squash merged as `0c40decacebcbd8c35e7c77a2b141a8161adbfd7`.
- main CI #577 / `36212979450`: release success and deploy-pages success on the merged code.
Next exact step:
1. Resume `ASTRA-HIGH-FINAL-ACCEPTANCE` only for newly confirmed findings.
2. Do not reopen this task unless a new reproducible regression contradicts the verified coverage.
3. Keep WheelPanel same-value hard no-op and VirtualList keyed reuse deferred until a dedicated invalidation/reconciliation contract makes their interaction risks explicit.


### PICKER-VALUE-DISPLAY-UNIFICATION-002 — Picker family visual-value and commit-policy unification
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Scope:
- Do not treat the migration handbook as infallible; preserve correct shipped behavior and use a single coherent Picker-family rule based on interaction semantics.
- Closed control/projected value shows committed value only.
- Open picker shows the current interaction value with priority rawInput -> preview -> draft -> committed; needConfirm affects commit timing, not whether draft is visible.
- Multiple/tag controls project draft tags while open; the token editor remains raw-input only.
- External renderControl:false projection follows the same visual-value rule instead of freezing committed value during navigation.
- DatePicker multiple add/remove while open must participate in draft/confirm/rollback semantics.
- ColorPicker mode changes must not bypass an open confirm session or lose the current draft.
- Clear visibility/action must be reconciled with the currently displayed session value rather than stale committed-only state.
Non-goals:
- Do not add controlled mode to DatePicker/TimePicker/ColorPicker/WheelPicker merely because an older handbook checklist mentioned it; that is a separate API decision.
- Do not redesign Tags overflow focus.
Baseline:
- branch: `fix/picker-value-display-unification-20260926`
- base main: `37ae0b84f5de4b12e9552d789586192df77a4527`
- latest main CI + Pages: #568 / `36158000520` success
- open PRs at task start: none
Implementation evidence:
- PickerComponent now owns one visual projection rule: closed => committed; open => rawInput -> preview -> draft -> committed.
- needConfirm controls commit timing only; it no longer decides whether the control/valueTarget shows the live draft.
- built-in Control and renderControl:false authored projection now follow the same open-session visual value.
- DatePicker multiple add/remove participates in the popup draft transaction and rolls back on Cancel/Escape when confirmation is required.
- ColorPicker solid/gradient mode changes convert the current draft, do not bypass needConfirm, and restore/advance mode baselines correctly across cancel, commit, clear and external final setValue.
- Picker-family final-value replacement releases rawInput/preview before replacing committed+draft, without changing global ValueController semantics.
- clear visibility and clear() changed-result semantics follow the current visual/session value, including draft-only values.
- the handbook was corrected where the old draftValueTarget/controlled checklist contradicted the accepted interaction model.
Verification:
- PR #115 first implementation head `d2797d60003603c08dd27eda75e26e460be99492`: CI #569 / `36202979518` success.
- PR #115 final exact-head `21a942bfb64b4b9f1fd505626cacee659b699091`: CI #572 / `36203814588` success, including strict Chromium browser regressions, full release verification, npm artifact, and standalone dist/docs build.
- PR #115 squash merged as `18a276417a2331b889d3994931f3effb82d9facd`.
- main CI #573 / `36204025514`: release success and deploy-pages success on the merged code.
Next exact step:
1. Resume `ASTRA-HIGH-FINAL-ACCEPTANCE` only for newly confirmed findings.
2. Do not reopen this task unless a new reproducible regression contradicts the verified browser coverage.


### PICKER-DRAFT-PROJECTION-001 — Picker family open-session draft projection regression
Status: DONE_MERGED_VERIFIED
Task progress: 100%
Scope:
- DatePicker multiple control projection must reflect the current open-session draft while committed/FormData remain unchanged until commit.
- DatePicker needConfirm=false presets must commit immediately and close after a successful complete preset selection.
- DatePicker needConfirm=true presets update draft and keep the popup open until explicit confirm.
- TimePicker / ColorPicker / WheelPicker controls must display draft/preview while the popup is open, independent of whether a separate draftValueTarget exists.
- Escape/cancel/outside-close rollback semantics remain unchanged; close itself never implies commit.
- Preserve ValueController as the only committed/draft/preview authority and keep external draftValueTarget as an additional projection only, not a reason to suppress control draft display.
Baseline:
- merged PR: #114
- merge commit: `898be09e28d7c7ddcbb9b6af7dafc70385a54be5`
- PR exact-head CI: #565 / `36156818440` on `0b51167239850bcf7df73c3ddbe3a968cf61c608` — green
- latest verified code main CI before this task: #560 / `36150117894` green
Implementation evidence:
- DatePicker multiple uses draft tags while the token editor remains an editor, not an aggregate-value mirror.
- DatePicker needConfirm=false preset activation commits then closes independently from ordinary panel closeOnSelect policy.
- PickerField projects open-session draft text through Control.setInputValue(), so Control state and DOM cannot diverge; tag mode projects through tags instead.
- TimePicker / ColorPicker / WheelPicker no longer gate open-session draft projection on needConfirm or a separate draft target.
- production Chromium smoke coverage now checks Date multiple draft/cancel, immediate range preset close, and Time/Color/Wheel open control draft state.
- browser assertions capture Time/Color/Wheel Control draft state before Enter commit; the earlier post-commit sampling mistake was corrected before acceptance.
- static Phase-H Picker gate rejects reintroducing draft-target suppression or raw-DOM-only draft projection.
Verification:
- PR #114 exact-head CI #565 / `36156818440` on `0b51167239850bcf7df73c3ddbe3a968cf61c608` — success, including full release verification and strict Chromium browser regressions.
- `main` CI + Pages #567 / `36157349913` on `8e34553795c17e7a38413d22c0a251dfff14b223` — release success and `deploy-pages` success.
- Main code merge commit remains `898be09e28d7c7ddcbb9b6af7dafc70385a54be5`; this checkpoint update is documentation-only.
Next exact step:
1. Resume `ASTRA-HIGH-FINAL-ACCEPTANCE` only for newly confirmed findings.
2. Do not reopen or reimplement `PICKER-DRAFT-PROJECTION-001` unless a new reproducible regression contradicts the verified browser coverage.

### PHASE-I-001 — release-integrity + Astra High handoff
Status: DONE
Evidence:
- PR #109 merged
- merge commit `f00455ecd2d1e8274673806fad5d5629fb08803d`
- exact-head CI #517 / `36112109009`: success
- main CI + Pages #518 / `36112480912`: success
Outcome:
- Phase H profiled/completed target floors are frozen at 40/40.
- `verify:phase-i-release-integrity` is part of the required verify chain and proves 40-component target/owner parity, 40 H-accepted rows, clean Phase I checkpoint state and canonical release-chain coverage.
- Table/Phase H acceptance evidence is current and stale H-027/needConfirm checkpoint state is removed.
- `PHASE_I_ASTRA_AUDIT_HANDOFF.md` contains the requested broad final audit scope and non-goals.
- migration/release-integrity implementation is complete; broad final audit acceptance remains intentionally pending GPT-6 Astra High.



### PHASE-H-027 — Table final V/F/I/C/S/O/B/R closeout
Status: DONE
Evidence:
- PR #108 merged
- merge commit `a331356fcc418f200b58950153beb346aab2e3b9`
- exact-head CI #515 / `36109887374`: success
- main CI + Pages #516 / `36111306682`: success
Outcome:
- Table declares/consumes exact Value/Focus/Interaction/Capability/Selection/Overlay/Feedback/Form ownership and intentionally has no Motion owner.
- explicit selected keys are the canonical ValueController value; SelectionController remains local/remote/allMatching execution/projection authority.
- controlled selection changes remain proposals until external acknowledgement/sync; form reset preserves the current controlled committed V/S and only resets uncontrolled values/transient form state.
- filter popup reuses Trigger→OverlayController; remote pending/error enters FeedbackController; FormBridge remains native carrier and FormController owns registration/serialization.
- prior high-risk Chromium coverage includes uncontrolled/controlled V/S, silent projection rollback, Feedback, Overlay and repeated-entry Form serialization; PR #111 supersedes the old controlled-reset proposal semantics.
- Table is H accepted; public Phase H component floor is 40/40.

### Phase H — full public component migration
Status: PUBLIC SURFACE ACCEPTED 40/40
Evidence:
- final component PR #108 / exact-head #515 / main + Pages #516
- `verify:phase-h-target-matrix` + family-specific Phase H gates + browser regressions
Outcome:
- all 40 maintained public components match their handbook Runtime Controller target combinations.
- remaining broad internal-target/final architecture acceptance is delegated to Phase I/Astra High audit and is not silently inferred from the 40/40 public result.



### PHASE-H-026 — Carousel + Scroll closeout
Status: DONE
Evidence:
- PR #107 merged
- merge commit `157cf96d119ce50c4dd8a38c02c3782adc99e578`
- final exact-head CI #510 / `36107647790`: success
- main CI + Pages #511 / `36108104799`: first release attempt hit the pre-existing Phase E intermediate-frame timing probe; failed-job rerun succeeded including Pages
Outcome:
- Carousel declares/consumes exact Value/Focus/Interaction/Capability/Motion ownership.
- Scroll declares/consumes exact Focus/Interaction/Capability/Motion ownership.
- Scroll imperative smooth motion enters MotionController while native scroll state remains Scroll execution authority.
- keyboard/focus/capability paths are browser-gated and no duplicate value/motion authority was introduced.
- Carousel and Scroll are H accepted; public-component floor is 39/40.

### PHASE-H-025 — Sort + Tabs shared navigation/value closeout
Status: DONE
Evidence:
- PR #106 merged
- merge commit `26d116b38dac03761a4841c1a5db1806aa11610d`
- exact-head CI #503 / `36104289572`: success
- main CI + Pages #504 / `36104608435`: success
Outcome:
- Sort and Tabs declare/consume their exact handbook controller targets with ValueController as committed value owner.
- shared Focus/Interaction/Capability paths replace direct duplicate keyboard ownership; Selection remains projection/execution authority.
- Sort drag overlay enters OverlayController and motion remains shared MotionController path.
- Sort and Tabs are H accepted.



### PHASE-H-025 — Sort + Tabs shared navigation/value closeout
Status: DONE
Evidence:
- PR #106 merged
- merge commit `26d116b38dac03761a4841c1a5db1806aa11610d`
- exact-head CI #503 / `36104289572`: success
- main CI + Pages #504 / `36104608435`: success
Outcome:
- Sort declares and consumes exact Value/Focus/Interaction/Capability/Motion/Selection/Overlay ownership.
- Sort committed order remains ValueController-owned while Collection/ReorderInteraction remain execution authorities; keyboard reorder/navigation enters InteractionController and capability gates, focus/active projection enters Focus/Selection controllers.
- Tabs declares and consumes exact Value/Focus/Interaction/Capability/Motion/Selection/Overlay ownership.
- Tabs activeKey remains ValueController-owned with SelectionController projection; direct KeyboardNavigation owner is removed in favor of FocusController-hosted InteractionController semantics.
- Sort and Tabs are H accepted; accepted public-component floor is 37/40.



### PHASE-H-024 — Upload V/F/I/C/S/O/B/R closeout
Status: DONE
Evidence:
- PR #105 merged
- merge commit `fe44fc60d78384b78374cd9d23bd19db8d69ee47`
- final exact-head CI #501 / `36102589108`: success
- main CI + Pages #502 / `36102876651`: success
Outcome:
- Upload declares and consumes the exact handbook Value/Focus/Interaction/Capability/Selection/Overlay/Feedback/Form owners.
- public committed file-list truth is inherited FieldComponent ValueController; UploadLifecycle remains upload/task execution authority.
- controlled add/remove/move stay proposals, while explicit lifecycle `set-value` (including clear/public setValue) synchronizes the committed ValueController owner.
- preview selection, document/media overlay, feedback projection, keyboard open/capability gates and FormController registration are browser-gated.
- Upload is H accepted.



### PHASE-H-023 — Image F/I/C/M/O/B closeout
Status: DONE
Evidence:
- PR #104 merged
- merge commit `b984c6589fbc45f17c90628f474aa6eea173a19a`
- exact-head CI #496 / `36099779410`: success
- main CI + Pages #497 / `36100069067`: success
Outcome:
- Image declares exact Focus/Interaction/Capability/Motion/Overlay/Feedback ownership.
- preview keyboard semantics enter one InteractionController and disabled/navigation/edit gates enter one CapabilityController.
- source pending/error visuals enter FeedbackController; preview resources remain OverlayController and focus scope remains OverlayRuntime→FocusController.
- mask/content presence remains Transition→MotionController with no component-owned motion generation/timer.
- source-ESM Chromium proves feedback, overlay/focus scope, motion access, ArrowRight routing and disabled open blocking.
- Image is H accepted; accepted public-component floor is 34/40.



### PHASE-H-022 — Transfer V/F/I/C/S/B/R closeout
Status: DONE
Evidence:
- PR #103 merged
- merge commit `119ad00ef226b2a58d24d1d5e5641d518824b19c`
- exact-head CI #494 / `36098771206`: success
- main CI + Pages #495 / `36099068281`: success
Outcome:
- Transfer reuses shared FieldComponent Value/Focus/Interaction/Capability/Feedback/Form ownership and one existing multi-channel SelectionController.
- committed target value remains ValueController-owned; source/target checked channels remain SelectionController-owned projections.
- native form carrier uses FieldComponent bindFormBridge; no parallel Control.createFormFieldBridge remains.
- operation keyboard semantics enter InteractionController and disabled mutation blocking enters the bound CapabilityController.
- local busy/error/warning projection enters FeedbackController.
- FormController serialization/unregister and per-channel Selection revision behavior are Chromium-gated.
- Transfer is H accepted; accepted public-component floor is 33/40.



### PHASE-H-021 — Menu V/F/I/C/S/O closeout
Status: DONE
Evidence:
- PR #102 merged
- merge commit `2f83d3464a396dd10250be1b3af5fdf0fd1e66ed`
- exact-head CI #490 / `36096268302`: success
- main CI + Pages #491 / `36096555627`: success
Outcome:
- Menu declares exact Value/Focus/Interaction/Capability/Selection/Overlay ownership.
- selectedKey(s) canonical state is ValueController-owned; SelectionController selected state is a synchronized projection rather than a second public value owner.
- direct Selection ownership is removed; FocusController/InteractionController remain the semantic keyboard path and share Menu CapabilityController.
- submenu/overflow popup resources remain Trigger→OverlayController; Menu does not invent a Motion owner.
- target-matrix floors are 34 profiled / 32 complete.
- Menu is H accepted.



### PHASE-H-020 — Dropdown V/F/I/C/M/S/O closeout
Status: DONE
Evidence:
- PR #101 merged
- merge commit `5ebdc44be5e2481483ff500291af226b4ed1882b`
- exact-head CI #487 / `36094628225` attempt 2: success
- main CI + Pages #488 / `36095210276`: success
Outcome:
- Dropdown declares exact Value/Focus/Interaction/Capability/Motion/Selection/Overlay ownership.
- committed value remains StateController→ValueController; SelectionController owns selected/hierarchy projection and FocusController owns the reference keyboard region.
- direct Selection/HierarchicalSelection/KeyboardNavigation ownership is removed.
- PopupComponent→Trigger remains the shared Interaction/Capability/Motion/Overlay path.
- Dropdown is H accepted.



### PHASE-H-019 — Ripple I/C/M closeout
Status: DONE
Evidence:
- PR #100 merged
- merge commit `709e5dc2c6ce3447e138f1a90f548c038b5983f4`
- exact-head CI #485 / `36093452646`: success
- main CI + Pages #486 / `36093996030`: success
Outcome:
- Ripple declares exact Interaction/Capability/Motion ownership.
- press semantics enter InteractionController, loading/disabled mutation blocking enters CapabilityController and wave lifetime remains MotionController-owned.
- direct duplicate authority paths are rejected by the H-019 verifier and Chromium regression.
- target-matrix floor reaches 33 profiled / 30 complete.
- Ripple is H accepted.

### PHASE-H-018 — JSON F/I/C/B closeout
Status: DONE
Evidence:
- PR #99 merged
- merge commit `f4a7f37d31e3685ead3ff911274f87f8a2ed0d4f`
- exact-head CI #483 / `36092472277`: success
- main CI + Pages #484 / `36092917404`: success
Outcome:
- JSON declares exact Focus/Interaction/Capability/Feedback ownership.
- root/tree/toolbar focus enters FocusController while KeyboardNavigation remains semantic execution through InteractionController.
- CapabilityController gates edit/toolbar/copy and FeedbackController projects status only.
- JSON is H accepted.



### PHASE-H-018 — JSON F/I/C/B closeout
Status: DONE
Evidence:
- PR #99 merged
- merge commit `f4a7f37d31e3685ead3ff911274f87f8a2ed0d4f`
- exact-head CI #483 / `36092472277` attempt 2: success
- main CI + Pages #484 / `36092917404`: success
Outcome:
- direct KeyboardRegion ownership is removed; root/tree/toolbar focus enters FocusController.
- keyboard semantics remain the existing KeyboardNavigation→InteractionController path.
- CapabilityController gates edit/commit, toolbar activation and copy.
- FeedbackController projects root loading/error/warning/success only and does not own JSON business data.
- exact F/I/C/B profile is gated and strict Chromium verifies focus-region identity, feedback and readOnly/edit behavior.
- JSON is H accepted.



### PHASE-H-017 — Steps V/F/I/C/B closeout
Status: DONE
Evidence:
- PR #98 merged
- merge commit `71687b9057fc25f432d78885821aaf6287734f5f`
- exact-head CI #481 / `36091760761`: success
- main CI + Pages #482 / `36092055152`: success
Outcome:
- current index remains the public API but canonical state is projected through StateController→ValueController.
- direct KeyboardNavigation construction is removed; step navigation enters FocusController→KeyboardRegion with shared InteractionController semantics.
- CapabilityController gates user navigation/click activation while programmatic `setCurrent()` remains available.
- FeedbackController projects loading/error/warning/success root state without becoming a second business-state owner.
- exact V/F/I/C/B profile is permanently gated and strict Chromium verifies current sync, arrow navigation, feedback and disabled blocking.
- Steps is H accepted.



### PHASE-H-016 — Autocomplete V/F/I/C/S/O/B/R closeout
Status: DONE
Evidence:
- PR #97 merged
- merge commit `f97417350a24397d95d27e41426d108f12143214`
- exact-head CI #479 / `36090821302`: success
- main CI + Pages #480 / `36091284678`: success
Outcome:
- Autocomplete keeps one canonical ValueController and reuses inherited FieldComponent/FormController ownership.
- keyboard/virtual focus enters FocusController; edit/clear/select reuse the PopupField Trigger CapabilityController.
- OptionList remains the sole SelectionController, local feedback enters FieldComponent FeedbackController, and popup resources remain Trigger→OverlayController.
- exact V/F/I/C/S/O/B/R profile is gated; direct KeyboardNavigation and duplicate Selection/Feedback owners are prohibited.
- target-matrix floor reaches 30 profiled / 27 complete.
- Autocomplete is H accepted.



### PHASE-H-015 — Tags + TagInput V/F/I/C/S/O/B/R closeout
Status: DONE
Evidence:
- PR #96 merged
- merge commit `0d8044846fc3e02977c73d950a5cf88ef3d4159f`
- exact-head CI #477 / `36089782080`: success
- main CI + Pages #478 / `36090124257`: success
Outcome:
- TokenInput tag list is ValueController-owned; Tags binds exactly one canonical public ValueController per mode.
- Tags and TagInput share the FieldComponent Focus/Interaction/Capability/Feedback/Form facades and the existing SelectionController/Popover overlay authorities without duplicate projectors or writable value stores.
- ValueController binding now exposes the read-only canonical controller accessor required to verify owner identity rather than treating the binding wrapper as the owner.
- strict browser/structural gates verify owner identity, disabled interaction blocking, feedback projection, selection/overlay identity and Form serialization.
- target-matrix floor reaches 30 profiled / 26 complete.
- Tags and TagInput are H accepted.



### PHASE-H-014 — Collapse + Pagination V/F/I/C(+M) closeout
Status: DONE
Evidence:
- PR #95 merged
- merge commit `865db8e8e2e45d7bd7cd45c1fb54fac58bc59233`
- exact-head CI #471 / `36088695602`: success
- main CI + Pages #472 / `36088993467`: success
Outcome:
- Collapse declares exact V/F/I/C/M ownership; open-key state remains StateController→ValueController, navigation enters FocusController and activation is capability-gated.
- Collapse motion remains Transition→MotionController with the existing rapid-reversal fix unchanged.
- Pagination declares exact V/F/I/C ownership; page state is StateController→ValueController, focus/keyboard region enters FocusController and jumper edit is capability-gated.
- shared keyboard semantics continue through KeyboardNavigation→InteractionController resolver without a second keydown owner.
- Collapse and Pagination are H accepted.
- target-matrix floors are 29 profiled / 24 complete.



### PHASE-H-013 — InputNumber + InputOTP + Rate + Slider V/F/I/C/B/R closeout
Status: DONE
Evidence:
- PR #93 merged
- merge commit `5a77fd6a5e7e757ba2f20a552e4cc151305b6891`
- exact-head CI #467 / `36086835393`: success
- main CI + Pages #468 / `36087140788`: success
Outcome:
- all four components declare the exact V/F/I/C/B/R target through one shared simple-field profile factory.
- FieldComponent shared Focus/Interaction/Capability/Feedback/Form paths are reused instead of four component-local controller stacks.
- InputNumber binds the existing NumericInput canonical ValueController and routes Enter/Arrow stepping through InteractionController + CapabilityController.
- InputOTP routes segment navigation/edit semantics through InteractionController while retaining its canonical ValueController.
- Rate and Slider retain existing numeric/value execution stores while focus, interaction, capability and feedback become shared controller facades.
- no duplicate committed value owner or duplicated feedback projector remains.
- target-matrix floors are 27 profiled / 22 complete after this pack.
- InputNumber, InputOTP, Rate and Slider are H accepted.



### PHASE-H-012 — Picker family shared V/F/I/C/M/S/O/B/R closeout
Status: DONE
Evidence:
- PR #92 merged
- merge commit `120f57d98be4f95da53f5564a6f96332d787c15b`
- exact-head CI #462 / `36085025052`: success
- main CI + Pages #463 / `36085329998`: success
Outcome:
- DatePicker, TimePicker, ColorPicker and WheelPicker bind their existing picker-session ValueController directly into FieldComponent with no second committed value.
- PickerField keyboard ownership enters one shared FocusController; the missing local `focusController` declaration found by #460 was fixed and permanently gated before acceptance.
- PopupFieldComponent exposes canonical Trigger Interaction/Capability/Overlay/Motion facades; PickerComponent shares Field feedback/form without duplicating Control serialization.
- DatePicker, TimePicker and WheelPicker use stable semantic SelectionController selected-key channels while committed/draft business values remain ValueController-owned.
- Date/Time selection follows draft/confirm/cancel semantics; Wheel uses column-scoped stable keys; ColorPicker correctly has no SelectionController target.
- all four public Picker profiles match the handbook target exactly; shared profile factory removes repeated profile regions.
- `minimumProfiled=23` remains unchanged because the four components already had profiles before H-012; exact completeness is enforced by `verify:phase-h-picker-family`.
- strict Chromium covers shared V/F/I/C/M/O/B/R, stable S keys, needConfirm separation, feedback, canonical Form serialization, focus declaration and destroy cleanup.
- DatePicker, TimePicker, ColorPicker and WheelPicker are H accepted.



### PHASE-H-011 — shared ValueController binding for simple Field consumers
Status: DONE
Evidence:
- PR #91 merged
- merge commit `3a0d62162a884ec6e9c4b66120f4e974b2665841`
- exact-head CI #451 / `36082593230`: success
- main CI + Pages #452 / `36082994382`: success
Outcome:
- Autocomplete, InputOTP, Rate and Slider bind their existing canonical ValueController into FieldComponent exactly once.
- controlled proposal/draft paths do not masquerade as committed Field/Form writes.
- FieldComponent `detail.sync` is projection-only for consumers that already updated the canonical ValueController.
- FieldComponent supports a pure external value projector for normalized internal ValueController shapes.
- Slider canonical state remains the handle array while public Field/Form state is scalar/range; Chromium verifies canonical value, external projection, FormController serialization and destroy unregister.
- no second committed Field value is restored.
- these four public components remain pending their remaining Phase H controller-family closeout.



### PHASE-H-010 — FieldComponent ValueController authority
Status: DONE
Evidence:
- PR #90 merged
- merge commit `c43f6290bf464420f00d9e6739f75a43a4a68b20`
- exact-head CI #445 / `36080900679`: success
- main CI + Pages #446 / `36081202515`: success
Outcome:
- FieldComponent's plain committed-value mirror is removed.
- default FieldComponent value is owned by ValueController.
- setFieldValue/options sync enter ValueController and FormBridge/FormController project that canonical committed value.
- components with specialized ValueControllers can bind the same controller into FieldComponent; the external controller remains authoritative and lifecycle ownership is explicit.
- FieldComponent internal Value path is H-migrated.



### PHASE-H-009 — Select / TreeSelect / Cascader O/B closeout
Status: DONE
Evidence:
- PR #89 merged
- merge commit `4ac4187990cf299013d1845eed2926fda412bc67`
- exact-head CI #442 / `36079189990`: success
- main CI + Pages #443 / `36079511984`: success
Outcome:
- FieldComponent provides one shared local FeedbackController projection over canonical Control state.
- Select, TreeSelect and Cascader bind visible pending/error/warning state through that shared path; authored state restores on clear.
- PopupFieldComponent→Trigger remains the sole popup OverlayController resource path.
- all three declare exact handbook Value/Focus/Interaction/Capability/Selection/Overlay/Feedback/Form profiles.
- no component-local parallel FeedbackController is added.
- Select, TreeSelect and Cascader are H accepted.



### PHASE-H-008 — OverlayFrameShell I/C/B + Modal/Drawer migration
Status: DONE
Evidence:
- PR #88 merged
- merge commit `c006b036652892ef00fb1d1cfaf3a7434e258971`
- exact-head CI #440 / `36077958731`: success
- main CI + Pages #441 / `36078235274`: success
Outcome:
- OverlayFrameShell owns one shared InteractionController for close/footer actions.
- close/footer activation enters PressInteraction/CapabilityController; duplicate direct DOM click semantic owners are removed.
- AsyncAction remains task owner while FeedbackController owns autoLoading visible projection.
- Modal and Drawer declare exact handbook Focus/Interaction/Capability/Motion/Overlay/Feedback profiles.
- strict Chromium covers async pending loading, duplicate activation blocking, terminal cleanup and Drawer close PressInteraction.
- Modal and Drawer are H accepted; OverlayFrameShell action path is H-migrated.



### PHASE-H-007 — Popconfirm F/I/C/M/O/B migration
Status: DONE
Evidence:
- PR #87 merged
- merge commit `b6c6cb5404be86856c6897664648e5f7f0d66ff5`
- exact-head CI #438 / `36076980019`: success
- main CI + Pages #439 / `36077293582`: success
Outcome:
- Popconfirm declares exact handbook Focus/Interaction/Capability/Motion/Overlay/Feedback ownership.
- Popover→PopupComponent→Trigger remains the sole popup F/I/C/M/O path.
- AsyncAction remains async confirm task owner; CapabilityController gates confirm/cancel and pending lock.
- FeedbackController is the sole internal visible pending/loading projector for confirm action state.
- strict Chromium verifies pending loading, duplicate activation blocking and terminal feedback cleanup.
- Popconfirm is H accepted.



### PHASE-H-006 — Tooltip + Popover popup-facade migration
Status: DONE
Evidence:
- PR #86 merged
- merge commit `7b49dd8d85e51de462b1aad854d94ee0bdfe0925`
- exact-head CI #436 / `36075356993`: success
- main CI + Pages #437 / `36075810132`: success
Outcome:
- Tooltip no longer accesses LayerManager directly; parent-layer lookup and grouped singleton resource ownership enter OverlayController.
- Tooltip declares the exact handbook Motion/Overlay profile and retains Trigger as the physical popup/motion authority.
- PopupComponent exposes inherited Interaction/Capability/Overlay/Motion controller facades from its canonical Trigger.
- Popover declares the exact handbook Focus/Interaction/Capability/Motion/Overlay profile and consumes those authorities through PopupComponent→Trigger.
- strict Chromium preserves Tooltip singleton switching and verifies Popover inherited controller facade identity.
- Tooltip and Popover are H accepted.



### PHASE-H-005 — Trigger F/I/C/M/O controller-family migration
Status: DONE
Evidence:
- PR #85 merged
- merge commit `bc56d9cd1377ebd34d5a898413852a2b29a1c180`
- exact-head CI #434 / `36074443611`: success
- main CI + Pages #435 / `36074753673`: success
Outcome:
- Trigger declares and consumes the exact handbook Focus/Interaction/Capability/Motion/Overlay authorities.
- Trigger shares one CapabilityController and InteractionController through TriggerInteraction→PressInteraction.
- OverlayRuntime focus manager/scope resources enter FocusController; direct FocusManager/FocusScope imports are removed.
- presence remains Transition→MotionController, physical popup resources remain OverlayController→OverlayRuntime, and logical open remains OpenStateBridge.
- strict Chromium verifies Enter activation through InteractionController and disabled blocking through CapabilityController.
- Trigger is H accepted.



### PHASE-H-004 — FieldComponent → FormController shared binding
Status: DONE
Evidence:
- PR #84 merged
- merge commit `fccf929b03170b9e6eff1331274b7a81b5dfebfb`
- exact-head CI #432 / `36072251524`: success
- main CI + Pages #433 / `36072642871`: success
Outcome:
- FieldComponent owns the shared FormController registration/notification bridge while FormBridge remains native carrier and ValueController remains value/reset-baseline owner.
- duplicate-name registration, rename re-indexing, validation, touched, serialization and destroy cleanup are gated.
- real Chromium Rate consumer verifies bind → dirty/serialize → destroy unregister.
- ten R-capable public components declare FormController ownership through the inherited FieldComponent path; their remaining Phase H controllers still require final component signoff.
- FieldComponent internal Form path is H-migrated.



### PHASE-H-003 — Progress + Result + Loading feedback presenters
Status: DONE
Evidence:
- PR #83 merged
- merge commit `a7eb78ca9db866acd0bc60f470b241bfe7858bce`
- exact-head CI #430 / `36071355296`: success
- main CI + Pages #431 / `36071805997`: success
Outcome:
- FeedbackController gained generic local/form/global projector binding without new state ownership.
- Progress is H accepted for Feedback-only presentation projection.
- Result is H accepted for Feedback-only result projection.
- Loading is H accepted for Capability/Motion/Overlay/Feedback; open enters CapabilityController while existing Motion/Overlay authorities remain canonical.
- strict source-ESM Chromium covers pending/progress/terminal/clear presenter behavior.



### PHASE-H-002 — NoticeService + Message/Notification M/O/B migration
Status: DONE
Evidence:
- PR #82 merged
- merge commit `deede43a127e525458c1b3163b24c048881c56dc`
- exact-head CI #427 / `36029897206`: success
- main CI + Pages #428 / `36070432617`: success
Outcome:
- NoticeService no longer accesses LayerManager directly; notice layer resource ownership enters OverlayController through `createLayerLease()`.
- NoticeService/NoticeClock remain notice lifecycle/timing authorities and TransitionGroup→MotionController remains presence authority.
- Message and Notification declare exact handbook Motion/Overlay/Feedback profiles.
- operation/task-linked global feedback uses FeedbackController identity de-dup while raw Message/Notification APIs remain compatible.
- Message and Notification are H accepted; NoticeService internal overlay path is H-migrated.



### PHASE-H-001 — executable 40-component target matrix
Status: DONE
Evidence:
- PR #81 merged
- merge commit `4c901ed23be08b71e8c938d346f2730060b6d766`
- exact-head CI #423 / `36028486399`: success
- main CI + Pages #424 / `36028914790`: success
Outcome:
- handbook target Runtime Controller combinations for all 40 public components are machine-readable.
- the matrix exactly matches the public Components namespace and rejects out-of-target capabilities/controller owners.
- internal/base migration targets are explicitly ledgered.
- current missing profile/ownership coverage is reportable without falsely claiming Phase H completion.



### PHASE-G-001 — FeedbackController + FormController foundations
Status: DONE
Evidence:
- PR #80 merged
- merge commit `e99cf3aa376277cf4d040c69f51b8c6916869ebe`
- exact-head CI #421 / `36025556499`: success
- main CI + Pages #422 / `36026105260`: success
Outcome:
- FeedbackController is the operation/task visible-feedback facade; NoticeService/NoticeClock remain global notice/timing execution authorities.
- feedback identity de-dup is owner + operation + actionId/requestId, with stale generation rejection and identity-preserving updates.
- FormController owns field registry + dirty/touched/pending/valid + validation/submit/reset coordination without copying the ValueController reset baseline or FormBridge native carrier.
- fieldId is unique identity and duplicate names serialize independently.
- async validator and submit completions are stale-safe; reset cancels pending submit/validation work.
- FormController can represent an explicit adapter-level requested reset, but public controlled value owners do not use reset as an implicit value proposal; their committed value remains owner-controlled.
- native submit/reset/FormData/reset-cancellation behavior is verified in Chromium.

### Phase G — Feedback + Form
Status: ACCEPTED
Evidence:
- PR #80 / exact-head #421 / main + Pages #422
- `verify:phase-g-foundation` + strict source-ESM browser gates
Outcome:
- all handbook Phase G gates are covered.
- Phase G acceptance does not claim Phase H/I completion.



### PHASE-F-008 — runtime profile Theme/Token residue closeout
Status: DONE
Evidence:
- PR #78 merged
- merge commit `e7903d9ff08ecde8bdb000da64b6a77ceea837f1`
- exact-head CI #408 / `36021985007`: success
- main CI + Pages #409 / `36022470128`: success
Outcome:
- removed `theme` / `tokens` from ComponentProfile runtime capabilities.
- removed ThemeController / TokenController from ComponentProfile legal controllers; the runtime controller list is exactly 9.
- `verify:phase-f-css-authority` now recursively scans all `src/**/*.js` and rejects ThemeController/TokenController/ThemeRuntime/TokenRuntime plus JS use of canonical CSS theme selectors.
- Shared Protocol gates reject theme/tokens profile fields and theme runtime dependencies.
- no CSS or component visual implementation changed.

### PHASE-F — CSS Theme / Token System Unification
Status: ACCEPTED
Evidence:
- implementation/closeout PRs #70–#76 and #78; #77 was intentionally closed unmerged after discovering F-008.
- exact-head CI #392 / #395 / #397 / #399 / #401 / #403 / #405 / #408: success
- corresponding main release + Pages #393 / #396 / #398 / #400 / #402 / #404 / #406 / #409: success
Outcome:
- one canonical CSS Theme/Token authority and one final self-contained `dist/qxframe9a7c2.css`.
- no ThemeController / TokenController / ThemeRuntime / TokenRuntime and no ComponentProfile theme/token runtime capability.
- primitive → semantic → family → component → state graph, Light/Dark/scoped theme, semantic overlay/shadow channels and state cascade are required gates.
- token graph/cycle/reference/color-channel/specificity/duplicate-owner audits are required CI.
- static no-framework-JS state matrix, scoped portal inheritance, and theme/business-state separation are required CI.
- Phase F acceptance does not claim Phase G–I completion.

### PHASE-F-007 — static CSS / scoped-theme closeout
Status: DONE
Evidence:
- PR #76 merged
- merge commit `b764a1a378cf8fc2dde8edc83dc6c0bc4155b3d8`
- exact-head CI #405 / `36019147203`: success
- main CI + Pages #406 / `36019711807`: success
Outcome:
- `verify:phase-f-static-closeout` requires final dist CSS with no framework runtime JS on the all-components static state matrix.
- representative visual states remain authored directly in static HTML; docs helpers do not synthesize component state.
- CSS-only browser coverage proves scoped popup/portal theme inheritance.
- value/class/open/selected-key/real-focus remain invariant across theme changes.
- no production component CSS or runtime JS changed in the closeout pack.

### PHASE-F-006 — duplicate CSS owner / dead-rule cleanup
Status: DONE
Evidence:
- PR #75 merged
- merge commit `108fa1d67d6a129c13f7f9397e11968867a05adb`
- exact-head CI #403 / `36017571445`: success
- main CI + Pages #404 / `36018227817`: success
Outcome:
- retired duplicate early Control Contract secondary/danger accent owners while keeping the shared Color Variant contract canonical.
- removed dead Notice passive-scrollbar rules in favor of the canonical hidden-scrollbar Notice viewport.
- folded ItemCollection/List item gaps and SelectGroup image-grid width into their canonical owner rules.
- removed the unreachable second Image Preview hidden-state patch.
- preserved intentional staged Button paint-z, Image Preview motion and JSON refinement rules.
- required `verify:phase-f-duplicate-owners` prevents the retired owners from returning.

### PHASE-F-005 — repeated compound selector specificity normalization
Status: DONE
Evidence:
- PR #74 merged
- merge commit `885b5202e69a8b43fe6d82bdbac8839c28aff957`
- exact-head CI #401 / `36016034020`: success
- main CI + Pages #402 / `36016716760`: success
Outcome:
- four Table expand-trigger selector chains were normalized so one compound no longer repeats the same state atom.
- declarations and rule order were preserved.
- required `verify:phase-f-selector-specificity` performs compound-aware duplicate-state detection and does not flag legitimate state constraints on separate relationship compounds.

### PHASE-F-004 — state cascade / specificity ownership closeout
Status: DONE
Evidence:
- PR #73 merged
- merge commit `cd53968dee909f551bfc1b8ac3ab9d235580d066`
- exact-head CI #399 / `36014584198`: success
- main CI + Pages #400 / `36015116050`: success
Outcome:
- the late `unlayered overrides (kept last to preserve original cascade strength)` patch bucket is removed.
- Picker/TimePicker and Table filter rules now live with their canonical component owners.
- InputGroup stacking resolves through its existing private state channel instead of a duplicate late z-index patch.
- Card overflow/corner ownership is consolidated in the Card section while the unified keyboard focus/modality contract remains unchanged.
- required `verify:phase-f-state-cascade` prevents late cascade-patch recovery and owner drift.

### PHASE-F-003 — semantic overlay / shadow color-channel closeout
Status: DONE
Evidence:
- PR #72 merged
- merge commit `c5f5eb654c20c62b97f32ba0d2f88ba9303ab8d4`
- exact-head CI #397 / `36012650779`: success
- main CI + Pages #398 / `36013188043`: success
Outcome:
- all post-foundation component/family physical black/white palette consumers were routed through existing semantic overlay-base/overlay-text channels.
- original alpha and shadow geometry were preserved; ColorPanel HSV/Hue and ColorPicker contrast-stop colors remain classified functional color-model data.
- required `verify:phase-f-color-channels` forbids new post-foundation physical palette consumption and unexpected component hard-coded colors.

### PHASE-F-002 — canonical CSS token graph closeout
Status: DONE
Evidence:
- PR #71 merged
- merge commit `85921cfc12e7af95a1b8f64cf54b4dbf6c50056d`
- exact-head CI #395 / `36011237135`: success
- main CI + Pages #396 / `36011730662`: success
Outcome:
- three real static unresolved references were redirected to existing canonical control/font owners.
- four JS-owned dynamic CSS variables remain intentionally instance-scoped and are verified against their JS projection owners.
- the sole custom-property dependency cycle (Scroll edge shadow self-fallback) is removed.
- duplicate Light/Dark selector members are removed while the symmetric 93-variable mode contract remains unchanged.
- required `verify:phase-f-token-graph` enforces acyclic token dependencies, unresolved-input classification, Light/Dark symmetry, white/black baseline and output-only compatibility aliases.

### PHASE-F-001 — CSS authority + JS Theme/Token decoupling
Status: DONE
Evidence:
- PR #70 merged
- merge commit `7c9e9455d7102dc0ba945bb5ab29ea28a5ab827d`
- exact-head CI #392 / `36009735693`: success
- main CI + Pages #393 / `36010087461`: success
Outcome:
- Core.Config no longer owns or projects Theme/Token state; runtime behavior configuration remains.
- OverlayRuntime no longer copies theme/token CSS context; Menu runtime theme scopes/options are removed with an explicit migration record.
- ColorPicker behavioral defaults no longer read CSS token state.
- `src/qxframe9a7c2.css` is the one physical production CSS authority and the stale split `src/css/00...10.css` mirror is removed.
- immutable HOTFIX6 API baseline remains untouched; completion audit permits only manifest-authorized `Menu.theme` removal.
- required CSS-only Chromium gate proves Light white / Dark black / scoped theme resolution without framework JS.

### PHASE-E-005 — Motion closeout
Status: DONE
Evidence:
- PR #69 merged
- merge commit `b4b1f506d4f14db8f1bd521c9ca4611515a19e5b`
- PR CI #385 / `36005279398`: success
- main CI + Pages #386 / `36005795095`: success
Outcome:
- Collapse rapid close/reopen no longer resets native autosize transition by re-appending the live section after motion starts.
- TransitionGroup enters child/move motion through MotionController; MotionCore remains canonical generation/timing authority.
- Chromium gate verifies live intermediate height, repeated rapid toggles, stable DOM order and final settle.
- no component-local timer or duplicate motion truth was added.

### PHASE-E — Overlay + Motion scope
Status: DONE
Evidence:
- PR #65 / #66 / #67 / #68 / #69 merged
- exact-head CI #374 / #376 / #378 / #380 / #385: success
- merged main CI + Pages #375 / #377 / #379 / #381 / #386: success
Outcome:
- OverlayController is the physical resource facade while OpenStateBridge/family adapters retain logical open.
- Trigger/Popup bases, Modal/Drawer, Image Preview, Loading and Upload preview use the canonical overlay resource path.
- MotionController fronts MotionCore through Transition and TransitionGroup without a second generation truth.
- nested/reopen/leave lease, rapid reverse and autosize Collapse regressions are covered.
- Phase E is accepted; current work advances to pure-CSS Phase F.

### PHASE-E-004 — Remaining direct OverlayRuntime consumers
Status: DONE
Evidence:
- PR #68 merged
- merge commit `30034b15d1d19acff0c3ff5cef44981568074ffd`
- PR CI #380 / `35996521940`: success
- main CI + Pages #381 / `35997097751`: success
Outcome:
- Image Preview, Loading and Upload document preview enter physical overlay resources through OverlayController.
- raw OverlayRuntime getters remain compatibility views of controller.getRuntime().
- Image and Loading expose their existing MotionController channels; Upload media preview delegates Image and document preview invents no synthetic motion owner.
- dedicated Chromium coverage verifies resource identity, leave lifetime and cleanup.
- remaining Phase E blocker is motion closeout, not component OverlayRuntime construction.

### PHASE-E-003 — Modal/Drawer physical Overlay + multi-motion migration
Status: DONE
Evidence:
- PR #67 merged
- merge commit `7a03e956ed227170418906614294d27964286a33`
- PR CI #378 / `35995208862`: success
- main CI + Pages #379 / `35995590673`: success
Outcome:
- Modal/Drawer no longer import or create OverlayRuntime directly; physical resources enter through OverlayController.
- logical family open/close state remains separate from physical overlay state.
- raw OverlayRuntime callback/getter compatibility is preserved through the controller facade.
- mask + dialog/panel transitions remain distinct MotionController-backed visual channels.
- Chromium verifies leave resource lifetime, rapid close→reopen stale-completion safety and final lease release.
- required `verify:phase-e-modal-drawer` passed.

### PHASE-E-002 — Popup facade propagation + overlay naming closeout
Status: DONE
Evidence:
- PR #66 merged
- merge commit `a3a8bb87c538741568266d38ee68a540edab99a2`
- PR CI #376 / `35994260669`: success
- main CI + Pages #377 / `35994605514`: success
Outcome:
- PopupComponent and PopupFieldComponent forward the exact Trigger OverlayController/MotionController identities.
- Popover/Tooltip/Dropdown/Select browser conformance proves facade identity without duplicate open/value state.
- OverlayComponent explicitly separates its Modal/Drawer family logical adapter from the physical resource-controller accessor.
- legacy OverlayComponent accessor names remain compatibility aliases while internal Modal/Drawer code uses explicit family naming.
- required `verify:phase-e-popup-facades` passed.

### PHASE-E-001 — OverlayController + MotionController foundations
Status: DONE
Evidence:
- PR #65 merged
- merge commit `a7b6d55ba1fe755adb9409d045e67f12f211ac54`
- PR CI #374 / `35992315155`: success
- main CI + Pages #375 / `35992675173`: success
Outcome:
- OverlayController delegates to OverlayRuntime and owns no logical-open truth.
- MotionController delegates to MotionCore and creates no second generation authority.
- MotionCore exposes canonical generation plus bounded cancel through its existing completion path.
- Transition is the compatibility facade over MotionController.
- Trigger enters overlay resources through OverlayController while logical open remains OpenStateBridge-owned.
- sandbox Chromium verified rapid reverse/cancel and Open/Overlay/Motion three-state resource lifetime.
- required `verify:phase-e-foundation` plus full release gates passed.

### PHASE-D-005 — Select/TreeSelect/Cascader selection closeout
Status: DONE
Evidence:
- PR #64 merged
- merge commit `eef0048a5f2c88f1a0e9fcf1de23eb8a064d7c4a`
- PR CI #371 / `35986798091`: success
- main CI + Pages #372 / `35990367837`: success
Outcome:
- Select exposes/reuses OptionList SelectionController identity without a second selected store.
- TreeSelect exposes/reuses Tree selected/checked channels from the same SelectionController.
- Cascader direct Selection/HierarchicalSelection/component-local anchor ownership is replaced by one SelectionController facade.
- Cascader item replacement/lazy child data changes advance selection data revision and stale anchors invalidate.
- ValueController and Phase C focus/interaction/capability authorities remain unchanged.
- required `verify:phase-d-popup-selection` covers source ownership and Chromium identity/revision behavior.

### PHASE-D — Selection scope
Status: DONE
Evidence:
- PR #55 / #57 / #62 / #63 / #64 merged
- exact-head CI #341 / #344 / #366 / #368 / #371: success
- main CI + Pages #342 / #345 / #367 / #369 / #372: success
Outcome:
- handbook Phase D scope (OptionList/List/Tree, Transfer, Table, Tags, Select/TreeSelect/Cascader) is accepted.
- multi-channel selection, stable keys, DataRevision-bound anchors, remote allMatching/exclusions, lazy-data revision and no-duplicate-selection-truth constraints are covered.
- `FOUR_UNIFICATIONS_ACCEPTANCE.md` records D accepted only for public Phase D consumers; later E–I signoff remains pending.
- Phase D acceptance does not imply overall migration completion; current work advances to Phase E.

### PHASE-D-004 — Tags SelectionController semantics
Status: DONE
Evidence:
- PR #63 merged
- merge commit `bf3823248a7a5725b20a9711dfc12736bf7ff60e`
- PR CI #368 / `35985407152`: success
- main CI + Pages #369 / `35985810168`: success
Outcome:
- Tags direct Selection ownership is replaced by one SelectionController selected channel.
- public controlled/uncontrolled value remains owned by the existing ValueController/StateController binding.
- item membership/order/value mutations advance selection dataset revision and invalidate stale anchors.
- controlled proposal/external-sync, FormBridge and Phase C interaction/capability behavior remain intact.
- required `verify:phase-d-tags-selection` covers controller identity, pruning, revision invalidation and controlled semantics.

### PHASE-D-003 — Table local/remote SelectionController semantics
Status: DONE
Evidence:
- PR #62 merged
- merge commit `af757cb76c7511c46ae4953da4da718a08a3c20e`
- PR CI #366 / `35984401592`: success
- main CI + Pages #367 / `35984812326`: success
Outcome:
- TableModel local selected keys are the SelectionController `selected` channel; direct Selection ownership is removed.
- TableModel dataset DataRevision invalidates stale selection anchors across data mutations.
- Table remote query-wide selection uses a SelectionController semantic channel with allMatching/queryKey/excludedKeys/knownCount/revision.
- remote exclusions reuse Selection and allMatching is never materialized as current-page selectedKeys.
- Table reuses the exact TableModel SelectionController while Focus/Interaction/Capability/Hybrid Edit authorities remain unchanged.
- required `verify:phase-d-table-selection` covers Node/store identity and Chromium remote-query semantics.

### PHASE-C-004D — Tags/Table Interaction + Capability tail
Status: DONE
Evidence:
- PR #61 merged
- merge commit `56bbf6698a9116630c37158fbdd9879269c18a25`
- PR CI #364 / `35981073140`: success
- main CI + Pages #365 / `35981438989`: success
Outcome:
- standalone Tags owns one InteractionController scope + one instance CapabilityController while native input editing remains a separate child edit domain.
- duplicate Tags root keydown business ownership is removed; printable +Add entry routes through the canonical FocusController/InteractionController path.
- Table owns explicit main-grid, filter-popup and resize-session interaction scopes with one CapabilityController snapshot.
- Table native cell editor remains an edit subdomain; filter F6 and resize Escape listeners are delivery surfaces rather than parallel business-key authorities.
- required `verify:phase-c-tail` gates source ownership plus Chromium behavior.

### PHASE-C-004 — Focus + Interaction + Capability priority scope
Status: DONE
Evidence:
- foundation PR #56
- owner packs PR #58 / #59 / #60 / #61
- exact-head CI #343 / #358 / #360 / #362 / #364: success
- merged main + Pages #346 / #359 / #361 / #363 / #365: success
Outcome:
- handbook Phase C priority set (TimePanel, Date Calendar/PeriodPanel, Select, TreeSelect, Cascader, Menu, Tags, Table Hybrid Edit) is accepted.
- canonical real-focus ownership, scoped semantic interaction, native/IME priority, repeat suppression, Home/End/Page behavior and loading/readOnly/disabled operation gates are covered by required browser/source gates.
- `FOUR_UNIFICATIONS_ACCEPTANCE.md` records C accepted only for the Phase C priority public components; non-priority rows remain Base/C partial until their owning later phase or final H/I signoff.
- Phase C acceptance does not imply overall 9-Runtime-Controller completion; current work resumes at Phase D.

### PHASE-C-004C — TreeSelect/Cascader Interaction + Capability owners
Status: DONE
Evidence:
- PR #60 merged
- merge commit `a2cf08c4777d1afbc94b958cc229415b1ef255a5`
- PR CI #362 / `35979415228`: success
- main CI + Pages #363 / `35979815823`: success
Outcome:
- TreeSelect/Cascader use explicit InteractionController + CapabilityController ownership.
- FocusController/KeyboardNavigation is the sole DOM keyboard owner.
- readOnly/busy browse behavior is separated from mutation authority.
- Cascader child traversal remains available without leaf commit while locked.
- legacy duplicate Cascader panel-keydown logic is removed.

### PHASE-C-004B — Select Interaction + Capability reference
Status: DONE
Evidence:
- PR #59 merged
- merge commit `460895256268187c5a795aa9c7e2348e558239f3`
- PR CI #360 / `35977872248`: success
- main CI + Pages #361 / `35978193325`: success
Outcome:
- PopupField open lifecycle uses semantic open capability.
- Select has explicit InteractionController + CapabilityController ownership with one DOM keyboard owner.
- readOnly/busy browsing remains possible while value mutation is blocked; disabled cannot open.
- IME, repeat activation, native caret and controlled proposal behavior are required browser gates.

### PHASE-C-004A — Date/Time composite Interaction + Capability owners
Status: DONE
Evidence:
- PR #58 merged
- merge commit `75d07e96d6648ee2f7a695b05a722b1252817383`
- PR CI #358 / `35976568725`: success
- main CI + Pages #359 / `35977068529`: success
Outcome:
- WheelPanel / Calendar / PeriodPanel have explicit InteractionController + CapabilityController ownership without a second DOM keyboard listener.
- TimePanel has local CapabilityController authority and delegates interaction to its canonical WheelPanel scope.
- DatePicker / TimePicker propagate busy/loading capability state into inner composite panels.
- readOnly/loading browsing, mutation blocking, disabled blocking, IME pass-through and repeat activation suppression are browser-gated.
- semantic action-to-key projection is centralized in InteractionController.

### PHASE-C-FOUNDATION — InteractionController + CapabilityController
Status: DONE
Evidence:
- PR #56 merged
- merge commit `599076ed92b88b2464e45b3a926acbb9324ce757`
- PR CI #343 / `35972148887`: success
- joint main CI + Pages #346 / `35973772633`: success
Outcome:
- canonical InteractionController and CapabilityController foundations exist.
- Menu routes semantic keyboard actions through a logical InteractionController scope and held non-navigation activation is repeat-suppressed.
- DatePicker presets use a FocusController virtual region with one composite Tab stop and arrow/Home/End navigation.
- CapabilityController provides operation-level semantics while preserving bounded InteractionPolicy compatibility forwarding.
- `FOUR_UNIFICATIONS_ACCEPTANCE.md` intentionally records Phase C as partial; this foundation entry does not claim full Phase C completion.

### PHASE-D-002 — Transfer multi-channel selection + per-channel DataRevision
Status: DONE
Evidence:
- PR #57 merged
- merge commit `fb4e5fb5ee8ba8644916431d431de5e18e1edd5a`
- PR CI #344 / `35972507182`: success
- main CI + Pages #345 / `35972849325`: success
Outcome:
- SelectionController supports channel-scoped revision sources without a second selected-key store.
- ItemCollection binds Collection revision to its explicit selection channel.
- Transfer uses one SelectionController with independent `sourceChecked` / `targetChecked` channels.
- source/target dataset revisions invalidate only their own anchors.
- final target value/order remains Transfer + targetOrder authority and FormBridge source.
- structural and Chromium/browser regressions cover single-facade identity, checked-channel independence and per-channel stale-anchor invalidation.

### PHASE-C foundation supplement — InteractionController + CapabilityController
Status: FOUNDATION DONE / ACCEPTANCE SUPERSEDED BY PHASE-C-004
Evidence:
- PR #56 merged
- merge commit `599076ed92b88b2464e45b3a926acbb9324ce757`
- PR CI #343 / `35972148887`: success
- merged main CI + Pages #346 / `35973772633`: success
Outcome:
- added CapabilityController as component-facing entry over InteractionPolicy and required structural gate.
- added InteractionController semantic action/scope routing and canonical keyboard resolver.
- KeyboardNavigation uses canonical InteractionController key resolution and blocks activation repeat by default.
- Menu uses an explicit logical InteractionController scope; held Space no longer repeats multiple selection.
- DatePicker presets use one virtual-focus region and dual-panel drill first-arrow regressions are covered.
- owner-by-owner Phase C priority acceptance is now complete in PHASE-C-004; this foundation supplement is retained only as historical evidence.

### Repository branch cleanup
Status: DONE
Evidence:
- audited 68 branches against current main and all PR associations.
- PR #56 was the only remaining useful independent line and was merged before cleanup.
- closed/merged/superseded historical fix/staging branches were removed by a one-shot temporary Actions branch.
- cleanup run #3 / `35974049408`: success.
Outcome:
- repository branch count reduced from 68 to 1.
- only `main` remains.
- the temporary cleanup branch deleted itself and no cleanup workflow was merged into main.

### PHASE-D-001 — SelectionController foundation + ItemCollection/List/OptionList/Tree first pack
Status: DONE
Evidence:
- PR #55 merged
- merge commit `2933f1feae0b6bf6891f4db5fe578984aca8aa54`
- PR CI #341 / `35970615817`: success
- main CI + Pages #342 / `35970931277`: success
Outcome:
- SelectionController composes canonical Selection / HierarchicalSelection stores and revision-bound anchors without a second selected-key store.
- Selection uses shared DataRevision for reentrant/stale mutation protection and exposes revision refs.
- ItemCollection/List/OptionList route selection through SelectionController while retaining raw Selection compatibility.
- Tree uses one controller with independent selected/checked channels and shares the selected channel with its ItemCollection.
- ActiveItem remains the sole activeKey owner.
- required structural gate and browser regressions cover single-store identity, selected/checked separation and stale-anchor invalidation.
- sandbox targeted gates passed before merge: verify:selection-controller, verify:shared-protocol, verify:collection-family, verify:architecture.

### PHASE-C-003 — Table Hybrid Edit focus lease
Status: DONE
Evidence:
- PR #54 merged
- merge commit `37a506d3c6dc2bfdfe3e00a059e7f0fb9970bd49`
- PR CI #337 / `35965963724`: success
- main CI + Pages #338 / `35966293514`: success
Outcome:
- Table root keyboard navigation enters through FocusController with the existing F6/arrows/Home/End/Page/Enter/Space/F2 keymap preserved.
- cells/header virtual domains use FocusController canonical binding with existing reconcile/visibility algorithms intact.
- Hybrid Edit keeps editTransaction as draft/validate/save/cancel authority; FocusController owns only the root-to-editor real-focus lease.
- Escape rollback restores initial editor value, releases the lease and returns focus to the Table root.
- native textarea/contenteditable Enter remains editor-owned; readOnly/disabled/loading mutation gates remain Table/InteractionPolicy owned.
- Table ComponentProfile declares FocusController ownership only; Table selection remains deferred to Phase D.
- browser coverage verifies lease acquire/release, rollback/root return, native Enter and readOnly/disabled blocking while retaining virtual-scroll edit survival.


### PHASE-C-002 — Popup-hosted + standalone composite focus migration
Status: DONE
Evidence:
- PR #53 merged
- merge commit `6bb926b93c4f0f16dae042cc41f8426bf77d4733`
- PR CI #335 / `35962474270`: success
- main CI + Pages #336 / `35962763162`: success
Outcome:
- Select / TreeSelect / Cascader editable hosts enter through FocusController with `manageTabIndex:false`, preserving Control/Field tabindex ownership.
- Menu root uses FocusController and canonical domain binding while retaining existing menu keymap/typeahead/disclosure behavior.
- Tags standalone root uses FocusController; TagNavigation remains canonical tag-domain behavior owner.
- Tags +Add editor uses FocusController edit lease and releases it on all existing add-exit paths.
- browser coverage verifies popup real-focus retention + one ring, Menu root ownership and Tags lease acquire/release.


### PHASE-C-001 — FocusController foundation + Time/Date composite regions
Status: DONE
Evidence:
- PR #52 merged
- merge commit `a1f19b25ceb2de4ef238e5bbc7d3c4c250c366b0`
- PR CI #333 / `35960898199`: success on attempt 2
- main CI + Pages #334 / `35961330135`: success
- #333 attempt 1 failed only the unrelated high-risk NoticeClock explicit-realm timing check; identical HEAD passed on retry, so runtime was not changed.
Outcome:
- added FocusController as facade over existing focus authorities with no second DOM-focus/domain engine.
- TimePanel root is the sole real-focus/Tab owner; inner WheelPanel is hosted/non-tabbable and the active wheel item owns the visible ring.
- Calendar / PeriodPanel / WheelPanel use the FocusController entry path and canonical virtual-domain binding.
- DatePicker-hosted Calendar keeps real focus on the editor with one virtual cell ring.
- canonical root outline duplication was removed.
- frozen HOTFIX6 artifact remains unchanged; a Phase-C derived compatibility smoke differs in exactly the two superseded TimePanel focus-owner checks, enforced by release-preflight.


### PHASE-B-002 — ValueController + picker-like popup second migration pack
Status: DONE
Evidence:
- PR #51 merged
- merge commit `7f3a475565fec5548871e7c6c52a7ed8c0e945bc`
- PR CI #326 / `35958353342`: success
- main CI + Pages #327 / `35958853046`: success
Outcome:
- `ValueController.createValueBinding()` and `createOptionValueBinding()` are canonical; StateController is compatibility forwarding for these helpers.
- Select / TreeSelect / Cascader use ValueController directly for controlled/defaultValue binding.
- Autocomplete uses ValueController directly for committed/draft value.
- all four declare explicit ValueController ComponentProfile ownership while retaining existing Search/Selection/Tree/OptionList focus authorities.
- structural and browser gates preserve controlled proposal/external-sync and uncontrolled defaultValue semantics.


### PHASE-B-001 — ValueController + Picker Family first migration pack
Status: DONE
Evidence:
- PR #50 merged
- merge commit `be2263e5c9cd388efe42142cfa28657fe0c8f5b4`
- PR CI #324 / `35957442947`: success
- main CI + Pages #325 / `35957755294`: success
- CI #322 initially failed only because TimePicker/WheelPicker duplicated the same scoped Enter-confirm block; the implementation was centralized in `PickerComponent.confirmFromKeyboard()`, then Completion audit and full release passed.
Outcome:
- canonical `ValueController` owns committed/draft/preview/rawInput/session/revision channels; `ValueDraft` is its compatibility alias.
- `PickerSession.close()` no longer performs hidden dirty commit; uncommitted draft rolls back by default.
- DatePicker / TimePicker / ColorPicker / WheelPicker create ValueController directly and declare ComponentProfile ownership.
- Date/Time raw input and hover preview are controller channels; ColorPicker hot-path interaction is preview-first and promotes to draft on completion.
- scoped Enter confirmation is shared by PickerComponent and used by TimePicker / ColorPicker / WheelPicker only in their open confirm session.
- browser coverage verifies draft projection without FormData commit, Esc rollback, immediate preset commit, and scoped Enter confirm.

### PHASE-A-003 — EnvironmentPort / Diagnostics / ComponentProfile authority adoption
Status: DONE
Evidence:
- PR #49 merged
- merge commit `b2ecdb4e33bea642932092693d0ad5a8a47fd4e3`
- PR CI #320 / `35955216461`: success
- main CI + Pages #321 / `35955524890`: success
- PR CI #317 initially failed only the existing platform fail-closed source contract; implementation was corrected so observer constructors remain in the resolved document/window realm and `ObserverHub` retains an explicit fail-closed guard.
Outcome:
- `ObserverHub` delegates observer/media environment resolution to `EnvironmentPort` while retaining scheduling/statistics ownership.
- `EnvironmentPort` covers validated IntersectionObserver construction and no longer leaks observer constructors across resolved realms.
- `Diagnostics` is injectable and `Collection` can report duplicate stable keys without mutating data state.
- `Component` / `ComponentRuntime` carry normalized `ComponentProfile` metadata; adapters forward only explicitly authored profiles.
- no first-wave Picker business behavior was changed in Phase A.


### PHASE-A-002 — Shared Protocol authority integration
Status: DONE
Evidence:
- PR #48 merged
- merge commit `01875c583fe99c47ee249a4e9eeb6e86304f23f2`
- PR CI #315 / `35953604691`: success
- main CI + Pages #316 / `35953925660`: success on attempt 2
- attempt 1 failed only `tabs-indicator-measured` with an empty inline width while the identical code passed PR #315; retry of the identical main commit passed. Treat this as a recorded browser timing flake, not a framework semantic failure.
Outcome:
- `Collection` now uses `DataRevision` as stale-transaction revision authority.
- `ValueDraft` delegates controlled/external ownership and pending-request metadata to `ControllableStateCore`.
- `StateController.createValueBinding` exposes delegated ownership state without adding a second value truth.
- `verify:shared-protocol` covers Collection stale refs/reentrancy plus controlled proposal/external sync/uncontrolled transition behavior.
- ProjectionScheduler adoption was explicitly deferred because current DOM/Roving projection paths are synchronous and no competing async revision owner exists to replace.

### PHASE-A-001 — Baseline inventory + Shared Protocol foundation
Status: DONE
Evidence:
- PR #47 merged
- merge commit `51b7f317037fc538beaadc6f710da077a8429d0f`
- PR CI #312 / `35952642035`: success
- main CI + Pages #313 / `35952965100`: success
Outcome:
- existing authorities were mapped before adding Controller abstractions;
- added `ActionContext`, `OperationResult`, `ControllableStateCore`, `DataRevision`, `EnvironmentPort`, `ProjectionScheduler`, `Diagnostics`, `ComponentProfile`, `LogicalOwnerTree`, `InputModality` alias and Shared Protocol exports;
- no direct component migration was performed.

### OPS-001 — AI persistent state + repository documentation cleanup
Status: DONE
Evidence:
- PR #46 merged
- merge commit `a459e28f2486ce89615322c6e49094fddd8464a4`
- PR CI #307: success
- main CI + Pages #308: success
Outcome:
- added `AGENTS.md`, `AI_WORK_STATE.md`, and the complete master handbook;
- removed obsolete historical migration/stage/audit files;
- retained required HOTFIX6 compatibility artifacts only as `tools/fixtures/legacy-hotfix6/**`;
- removed numbered Stage navigation from canonical docs.

### CTRL-LEGACY-001 — Cascader controlled value
Status: DONE
Evidence:
- PR #36 merged
- merge commit `1ce69ad304088f0910993229426ba1a843b3d1fd`
- shared StateController option-value binding; controlled proposal/external sync and uncontrolled defaultValue coverage

### CTRL-LEGACY-002 — TagInput controlled value
Status: DONE
Evidence:
- PR #39 merged
- merge commit `6357bc0b88c72f2dd777641b942a97c48929a3d8`

### CTRL-LEGACY-003 — Collapse controlled value
Status: DONE
Evidence:
- PR #41 merged
- merge commit `20327c0d717a3a56a45e098d756e40eb9ae8c743`
Note:
- controlled ownership is done;
- rapid autosize animation reversal remains an active Motion issue.

### CTRL-LEGACY-004 — Dropdown controlled value
Status: DONE
Evidence:
- PR #43 merged
- merge commit `e2300ff0eb59fca8621218930fe6343f41c56309`

### CTRL-LEGACY-005 — Upload controlled file-list membership/order
Status: DONE
Evidence:
- PR #45 merged
- merge commit `a7702a2a66a2f201d1152c23c5d20ff1b1e9607e`
- UploadLifecycle remains runtime status/progress authority.

### FOCUS-LEGACY-001 — prior DatePicker/TimePanel focus cleanup
Status: VERIFIED_EXISTING, NOT SUFFICIENT FOR CURRENT QA
Evidence:
- PR #27 merged
- merge commit `6558fc5d1d008725a43a40fa869a0f9ba69cd367`
Rule:
- do not repeat the old investigation from zero;
- PHASE-C-001 superseded the remaining TimePanel owner defect; reopen only if a new reproducible regression appears.

## DO NOT REDO

Unless a current regression or architecture migration invalidates the evidence:

- Do not redo the original 17-component controlled/defaultValue survey from zero.
- Do not recreate the completed ESM/src-to-dist migration as a new migration project.
- Do not restore `src/modules`, runtime Registry dependency lookup or old monolithic source architecture.
- Do not recreate Shared Protocol primitives already landed in PHASE-A-001.
- Do not re-run PHASE-A-002 authority ownership analysis from zero; only inspect impact when PHASE-A-003 touches those authorities.
- Do not reintroduce numbered Stage documentation as a second canonical docs tree.
- Do not re-open completed controlled semantics merely because a new Controller is being introduced; migrate the existing contract and test it.
- Do not treat deleted historical audit/log files as active requirements. Git history is the archive.
- Do not convert the recorded #316 attempt-1 Tabs timing flake into a framework change unless it reproduces with evidence.

## PAUSED

None.

## BLOCKED

None.

## Frozen decisions

- One owner / one truth; projection is not a second writable truth.
- The 9 Runtime Controllers reuse/evolve existing mature authorities rather than duplicating them.
- Shared Protocol Layer is infrastructure, not a 12th business Controller.
- Controller code must not branch on component names.
- Interaction routing is scoped/logical-owner based, not one global keydown handler.
- Enter and Space are context/profile dependent; they are not globally equivalent.
- Multiple checkbox primary toggle uses Space within its composite keymap; navigation/activation semantics remain profile-scoped.
- Picker close is not an implicit commit. Escape/cancel rolls back uncommitted draft.
- Tags overflow summary is intentionally non-focusable/hover-only; do not place it in the main Tags virtual-focus sequence without an explicit full popup-focus redesign.
- Complex composite regions use one canonical real-focus host plus virtual focus unless a native/hybrid-edit profile explicitly leases real focus.
- Current Git source/tests/manifests are preserved while migrating; do not roll back later fixes to match an old document snapshot.

## Checkpoint maintenance rule

Keep this file compact and non-contradictory:
- `CURRENT` contains exactly one active/ready Task ID plus one exact next step.
- Current authority facts belong only in `Current authority snapshot`.
- When a gap is resolved, replace its old current-state wording; do not leave both “does not exist” and “added” statements in active sections.
- `DONE` retains Task ID + outcome + PR/commit/test/CI evidence, not the full historical investigation.
- Historical findings that are no longer current truth move to DONE evidence or Git/PR history.
- Never append a second CURRENT task at the bottom of the file.


## UX-REGRESSION-002 — Picker projection / component surface regressions (2026-09-27)

- Status: **VERIFIED — READY TO MERGE**
- Baseline: `main@fc5fa38a9353bba92910f88cb94a87445c0a2b64` (post UX-CLOSEOUT-001)
- Branch: `fix/ux-regression-002-picker-surfaces`
- User evidence: current canonical demos plus uploaded picker/table recordings and table screenshots.
- Scope:
  - Picker Control projection must derive visual mode from the active ValueController projection channel; opening alone must not turn an unchanged committed value into a grey draft, while real draft/hover preview must stay projected continuously in-Control.
  - DatePicker range keeps three canonical built-in forms: single input, dual independent Controls, and one segmented Control with two inputs.
  - Autocomplete remains input-first by default: focus/click/Tab do not open; actual user input may open; `openOnFocus:true` is explicit opt-in.
  - Notification keeps one spacing/shadow-gutter owner and no clipping ancestor that cuts normal card elevation.
  - Table optional title/toolbar/footer chrome must detach when empty; scrolling must not create a false right padding/gutter; table cell corner radii must flatten against adjacent chrome.
  - Image preview must open on the first user/API activation independently of source load/error state; the normal canonical demo must not require a “break src” step.
- Guardrails: preserve ValueController as sole value owner, preserve existing focus/navigation semantics, add browser-visible regression coverage before merge, then verify exact-head PR CI before merge.

- Implementation checkpoint: picker grey-state is now projection-channel driven (draft/preview only); DatePicker single/dual/segments range forms are browser-locked; Autocomplete input-first default is browser-locked; Notification stacked viewport is shadow-safe with a single edge-gutter owner; Table empty chrome/right gutter/corner seams are regression-locked; Image first activation is tested before load settles and after error, and the canonical demo no longer requires a break-src button.
- Verification: PR #123 exact implementation head `0d3ccad11c44b7418a9498191e12af7cae315c34` passed QXFRAME CI run #617: dependency audit, completion audit, full release verification, npm pack, standalone dist/docs build, artifact upload, and Windows tools all succeeded. This status-only checkpoint is the sole change after that verified implementation head.


## IMAGE-PREVIEW-MOTION-001 — Image preview trajectory continuity (2026-09-27)

- Status: **VERIFIED — READY TO MERGE**
- Baseline: `main@7c18b8a55792e3a86ba9fa0127c43ed9263f4b27`.
- Verification: PR #125 implementation head `43ccfd17cd94415226be26e921a76fa0585679a1` passed QXFRAME CI #621 including full release verification, standalone dist/docs build, artifact packaging, and Windows tools. This status-only checkpoint is the only change after that verified implementation head.
- User evidence: PixPin_2026-09-27_18-31-14.mp4 showed the preview copy changing size at the enter/leave boundary and a visible source/preview overlap on close.
- Root cause: the trajectory phase locked `previewMotion` to viewport-derived pixel geometry, then `onAfterEnter` released that lock into `.qxframe9a7c2-image-preview-image { max-width:94%; max-height:92%; }`, whose percentages were relative to the auto-sized motion wrapper rather than the viewport. Closing locked the geometry again, producing another size jump. In addition, the authored source image was made visible at leave start while the preview copy was still travelling back to it.
- Fix: settled Image preview sizing now uses `94vw / 92vh`, matching the trajectory viewport basis; trajectory content is transform-only while the mask owns fading; the authored source stays hidden until `finalizePreviewLeave()`; closing resets inner zoom/pan/rotate/flip while the outer copy returns to the source.
- Non-goals: no Image public API, OverlayController, TransformModel, media preview, focus, keyboard, or toolbar behavior changes.
- Regression coverage: verifies post-enter geometry does not jump, source visibility remains single-owner through leave, and zoom/rotate followed by close completes ownership handoff correctly.


## UX-REGRESSION-003 — Image leave / TimePanel centering / DatePicker pointer focus (2026-09-27)

- Status: **IMPLEMENTED — PENDING PR CI**
- Baseline: `main@97ce558ab6199d266e8db0dff4f18c7dba9a829b`.
- User evidence: uploaded videos `PixPin_2026-09-27_19-17-56.mp4`, `19-19-23.mp4`, and `19-20-30.mp4`.
- Image root cause/fix: leave could recalculate/lock canonical geometry instead of the exact currently painted preview box, and `releasePreviewTrajectoryGeometry()` ran while the preview surface was still paintable, allowing a one-frame snap at the end. Leave now locks the current painted rect and hides the preview surface before releasing trajectory geometry/source ownership.
- TimePanel root cause/fix: initial WheelPanel centering ran before final layout metrics and initial construction lacked the two-frame visible-layout correction already used by update paths. WheelPanel now schedules `refreshVisible()` after initial bind; TimePicker also refreshes its TimePanel after popup open.
- DatePicker root cause/fix: a reused virtual-focus controller could retain keyboard modality when a later popup open was pointer-origin. Pointer/mouse/touch open explicitly demotes virtual focus to pointer before hosted calendar domains bind; pointerdown inside the selection panel also does so.
- Regression coverage: exact current-rect lock on Image leave, TimePanel hour/minute/second snap centering, and pointer-open DatePicker with zero `.is-keyboard-focus` calendar cells.


## UX-REGRESSION-004 — Image leave rebound + canonical date-cell states (2026-09-27)

- Status: **IMPLEMENTED — PENDING PR CI**
- Baseline: `main@49d8ba5e4e7ba5343a9a25b5e9f3da0e85c3042c`.
- User evidence: `PixPin_2026-09-27_19-51-30.mp4` shows the Image preview correctly shrinking toward the source, then snapping back to the centered large resting geometry before finally disappearing.
- Image root cause/fix: content leave completes before the mask lifecycle fully finishes. Motion cleanup clears the trajectory transform after the content transition callback, so the still-paintable preview copy returns to its centered resting geometry. The landed motion node is now hidden inside content `onAfterLeave` before cleanup can repaint it, and visual ownership is transferred to the authored source at that exact landing boundary. Opening explicitly restores motion visibility.
- DatePicker architecture: DatePicker directly composes `Calendar` and `PeriodPanel`; both already render the shared `.qxframe9a7c2-date-panel-cell` primitive. DatePicker no longer treats hover `previewValue` as selected state. Selected endpoints come only from committed/draft selection; preview may project a provisional range band.
- Canonical state styling: Calendar and PeriodPanel both project `.is-hover`; shared cell CSS now defines normal hover, in-range hover, selected, and selected-hover as distinct states using subtle-hover, accent-soft-hover, accent, and accent-hover tokens respectively.
- Regression coverage: Image landed copy cannot repaint after leave cleanup; DatePicker hover target is not selected while the actual selection remains selected; Calendar and PeriodPanel expose the same canonical hover state.


## FOCUS-ORIGIN-CLOSEOUT-002 — Pointer outline repository-wide audit (2026-09-27)

- Status: **IMPLEMENTED — PENDING PR CI**
- Baseline: `main@59a3636d1768ea1265568aae5d791f3724d12d79`.
- User regression: DatePicker opened by mouse correctly stayed pointer-origin, but clicking the year/month headers called `setCalendarPanelMode()`, which unconditionally re-activated hosted virtual focus as keyboard and painted `.is-keyboard-focus` on the newly shown PeriodPanel.
- Systemic root cause: `KeyboardNavigation.VirtualFocus.activate()` defaulted every activation that was not explicitly pointer to keyboard. Programmatic/sync/domain handoffs could therefore manufacture keyboard modality after a pointer action.
- Shared fix: virtual-focus activation now changes modality only for explicit keyboard or pointer/mouse/touch evidence (including the original event type); otherwise it preserves the controller's current modality. This applies to every composite component using the shared VirtualFocus controller.
- DatePicker fix: year/month/date drill transitions now carry the actual interaction metadata into `setCalendarPanelMode()`; pointer transitions explicitly retain pointer modality, and the return-to-date activation is keyboard-only when the source is keyboard.
- CSS/component audit: all `src/components/*.js` are now CI-scanned for direct `is-keyboard-focus` ownership; only Control and Image may project it locally and both must derive it from `FocusOrigin.isKeyboard()`. CSS is CI-scanned so `:focus` / `:focus-within` cannot paint a nonzero outline. Image's old unconditional `:focus-within` outline and the forced-colors segmented-input `:focus-within` outline were converted to keyboard-origin classes.
- Browser regression coverage: pointer-open DatePicker -> year panel -> month panel -> date panel must remain pointer modality with zero `.is-keyboard-focus` cells throughout; pointer-focused Image must have no keyboard outline.


## DATEPICKER-OUTSIDE-MONTH-COLOR-001 — Outside-month text regression (2026-09-27)

- Status: **IMPLEMENTED — PENDING PR CI**
- Baseline: `main@32b4c06bf86cd6fc5fd34603156973f8208bd97a`.
- User regression: DatePicker calendar cells from the previous/next month still receive `.is-outside`, but their text is no longer visually muted/light gray.
- Root cause: the Calendar owner rule survived the shared Calendar/PeriodPanel cell unification with the retired private variable `--_qxframe9a7c2-calendar-cell-text`. The canonical shared cell now paints `color` from `--_qxframe9a7c2-date-panel-cell-text`, so the outside-month rule was writing a dead channel and had no visual effect.
- Fix: `.qxframe9a7c2-calendar-cell.is-outside:not(.is-selected):not(.is-in-range)` now sets the canonical `--_qxframe9a7c2-date-panel-cell-text` to `--_qxframe9a7c2-semantic-text-disabled`, restoring the former light-gray treatment while preserving selected/range colors.
- Audit: no other `--_qxframe9a7c2-calendar-cell-*` private state channels remain in the stylesheet.
- Outside-month interaction parity: normal state keeps muted text; hover keeps the muted text while adding the canonical hover background; clicking the filler selects that exact date and navigates the panel so the selected cell is rendered in-view, matching Ant Design's current cell model.
- Range ordering: DatePicker already exposes `order`; it remains `true` by default (chronological auto-order for range/multiple) and `order:false` preserves explicit start/end slot order. This matches Ant Design's current API default and avoids adding a second overlapping option.
- Regression gates: Phase-F rejects the retired variable and requires the canonical outside-month rule; browser regression checks outside/current-month color, outside hover, outside click-selection/navigation, default auto-order, and explicit fixed-order range selection.
