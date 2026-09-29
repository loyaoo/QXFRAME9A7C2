# QXFRAME9A7C2 AI Work State

> Persistent engineering checkpoint for timeout recovery, context compression, model changes and new conversations.
> Read `AGENTS.md` first. This file records execution state only; architecture belongs in the master handbook.
> Git / PR / CI facts override stale text here. If they differ, reconcile this file before continuing.
> This file must contain current truth only. Superseded findings belong in DONE evidence, not in CURRENT.

## Repository checkpoint

- Last checkpoint date: 2026-09-28
- Repository: `loyaoo/QXFRAME9A7C2`
- Repository HEAD: always query Git on resume; do not cache a self-invalidating HEAD in this file.
- Active branch / PR / CI: always query GitHub on resume; do not cache transient branch names, PR states or “latest” run IDs here.
- Package version: `2.19.81`
- Master architecture spec: `QXFRAME-11-Controller-Shared-Protocol-全组件迁移开发手册-v3.md` (historical filename retained; body defines 9 Runtime Controllers + pure CSS Theme/Token).
- Overall handbook implementation progress: base 9-controller migration is 100%; final-audit remediation, focus follow-ups and the Picker/Autocomplete/Notification/Table/Image UX closeout are implemented with regression coverage.
- Current Phase: handoff-ready; independent Ant interaction follow-up.
- Current Task: `ANT-DIFFERENTIAL-EDGE-STATES-003`

## CURRENT

### ANT-DIFFERENTIAL-EDGE-STATES-004 — responsive/filter + control geometry pressure audit
Status: IMPLEMENTED_PENDING_CI
Task progress: 60%
Baseline: `main@50c372ffd437476c7fa47ee545654b6154859134`.
Branch: `audit/ant-edge-state-demos-004`.

Previous batch closed:
- PR #173 merged at `50c372ffd437476c7fa47ee545654b6154859134`.
- PR exact-head CI #840 passed Windows tooling, Completion audit, Full release verification, packaging, standalone dist/docs build and artifacts.
- Round 3 Modal/Drawer leave reversal, live content update, List data-revision anchor invalidation, and Transfer page-3 -> empty-filter -> clear recovery all passed without runtime component changes.
- Two verifier races were hardened without weakening semantics: Collapse motion checks now wait for observable state/geometry instead of fixed milliseconds, and the 300+ browser regression suite result budget is 30s instead of the previous 12s.
- main push CI #841 was started after merge and remains the deployment gate for the previous batch.

Round 4 targets selected from Ant 6.6.x regressions that map to QX capabilities:
1. Select single vs multiple Control geometry under authored family control font-size/height overrides. Both modes must keep the same one-line shell height when tags do not wrap.
2. Table active filter state must continue to filter data when that column is responsive-hidden; responsive rendering is CSS projection only and must not remove the column from TableModel filter ownership.
3. Existing Chromium coverage already verifies Table single-select filter option value `''`, including live programmatic sync while the popup stays open; no duplicate test added.
4. Table filter action labels with numeric `0` must render `0` rather than fall back via truthy checks.
5. Upload custom dropzone geometry is not mapped: QX Upload exposes no Ant-style public dropzone `style.height` owner, so adding that API solely for parity is out of scope.

Static audit before browser pressure:
- TableModel owns filters independently from responsive cell classes. `setColumns` only prunes filters when a column key is actually removed, not when CSS hides it.
- QX responsiveMode=hide adds `.qxframe9a7c2-table-col-hide-sm/md`; media queries only change `display`, so hidden columns should still participate in filtering.
- Select single and multiple both render the same `.qxframe9a7c2-input` shell and use shared `--_qxframe9a7c2-control-local-height`; hosted Tags derive their internal height from that same variable.
- Potential falsy-label defect found in Table filter popup: `column.filterResetText || 'Reset'` and `column.filterConfirmText || 'Apply'` would replace numeric 0. This must be reproduced before runtime change.
- Picker footer/confirm numeric 0 and generic Control prefix/suffix numeric 0 already preserve values and/or have regression coverage; do not duplicate them.

Implemented:
- Added Select family-token geometry demo + Chromium measurement for single vs one-line multiple shell height.
- Added Table responsive-hidden filter demo + Chromium regression; switching hide/scroll must not change filteredTotal or row projection.
- Fixed Table filter Reset/Apply falsy content: fallback now applies only to null/undefined and rendering goes through Renderer, preserving numeric 0.
- Added Chromium regression requiring both action labels to render exactly `0`.
- Existing empty-string filter regression retained; Upload style-height case marked not applicable.
- main CI #841 and Pages both succeeded for `main@50c372ffd437476c7fa47ee545654b6154859134`.

Next exact step:
1. Open PR and run exact-head CI.
2. If geometry/responsive assertions fail, fix the canonical Control/Table owner rather than weakening them.
3. Merge/deploy when green, then continue with the next unclosed Ant interaction class.
